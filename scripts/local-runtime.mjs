// VNTECH PROPRIETARY SOURCE | Owner: CÔNG TY CỔ PHẦN THƯƠNG MẠI ĐẦU TƯ PHÁT TRIỂN CÔNG NGHỆ VIỆT (VNTECH) | Product: VNTECH-KHO-MEP-001 | Fingerprint: SSOT
import { createHash, randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { readFile, unlink, writeFile } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { VNTECH_IDENTITY } from "./vntech-identity.mjs";

class LocalStatement {
  constructor(database, sql, values = []) {
    this.database = database;
    this.sql = sql;
    this.values = values;
  }

  bind(...values) {
    return new LocalStatement(this.database, this.sql, values);
  }

  first(column) {
    const row = this.database.prepare(this.sql).get(...this.values) ?? null;
    if (column && row) return row[column];
    return row;
  }

  all() {
    return { success: true, results: this.database.prepare(this.sql).all(...this.values), meta: {} };
  }

  run() {
    const result = this.database.prepare(this.sql).run(...this.values);
    return { success: true, meta: { changes: Number(result.changes), last_row_id: Number(result.lastInsertRowid) } };
  }

  raw() {
    return this.database.prepare(this.sql).all(...this.values).map((row) => Object.values(row));
  }
}

class LocalD1Database {
  constructor(database) {
    this.database = database;
  }

  prepare(sql) {
    return new LocalStatement(this.database, sql);
  }

  batch(statements) {
    this.database.exec("BEGIN IMMEDIATE");
    try {
      const results = statements.map((statement) => statement.run());
      this.database.exec("COMMIT");
      return results;
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }

  exec(sql) {
    this.database.exec(sql);
    return { count: 1, duration: 0 };
  }
}

class LocalFileBucket {
  constructor(directory) {
    this.directory = directory;
    mkdirSync(directory, { recursive: true });
  }

  pathFor(key) {
    return join(this.directory, `${createHash("sha256").update(key).digest("hex")}.bin`);
  }

  async put(key, value) {
    const bytes = Buffer.from(await new Response(value).arrayBuffer());
    await writeFile(this.pathFor(key), bytes);
    return { key, size: bytes.length };
  }

  async get(key) {
    const path = this.pathFor(key);
    if (!existsSync(path)) return null;
    const bytes = await readFile(path);
    return { key, body: bytes, size: bytes.length };
  }

  async delete(key) {
    const path = this.pathFor(key);
    try { await unlink(path); } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return;
      throw error;
    }
  }
}

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

class LocalAssets {
  constructor(directory) {
    this.directory = resolve(directory);
  }

  async fetch(request) {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(request.url).pathname);
    } catch {
      return new Response("Bad Request", { status: 400 });
    }
    const relative = pathname.replace(/^\/+/, "");
    const path = resolve(this.directory, relative);
    if (path !== this.directory && !path.startsWith(`${this.directory}${sep}`)) {
      return new Response("Forbidden", { status: 403 });
    }
    if (!existsSync(path) || !statSync(path).isFile()) return new Response("Not Found", { status: 404 });
    return new Response(await readFile(path), {
      headers: { "Content-Type": mimeTypes[extname(path).toLowerCase()] || "application/octet-stream" },
    });
  }
}

function applyMigrations(database, migrationsDirectory) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS __mep_migrations (
      name TEXT PRIMARY KEY NOT NULL,
      applied_at TEXT NOT NULL
    )
  `);
  const applied = new Set(database.prepare("SELECT name FROM __mep_migrations").all().map((row) => row.name));
  const files = readdirSync(migrationsDirectory).filter((name) => name.endsWith(".sql")).sort();
  for (const name of files) {
    if (applied.has(name)) continue;
    const source = readFileSync(join(migrationsDirectory, name), "utf8");
    const statements = source.split("--> statement-breakpoint").map((value) => value.trim()).filter(Boolean);
    database.exec("BEGIN IMMEDIATE");
    try {
      for (const statement of statements) database.exec(statement);
      database.prepare("INSERT INTO __mep_migrations (name, applied_at) VALUES (?, ?)").run(name, new Date().toISOString());
      database.exec("COMMIT");
    } catch (error) {
      database.exec("ROLLBACK");
      throw new Error(`Khong ap dung duoc cap nhat du lieu ${name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export function createLocalRuntime(projectRoot, dataDirectory) {
  const absoluteDataDirectory = resolve(dataDirectory);
  mkdirSync(absoluteDataDirectory, { recursive: true });
  const emailSecretPath = join(absoluteDataDirectory, "email-secret.key");
  if (!existsSync(emailSecretPath)) writeFileSync(emailSecretPath, randomBytes(32).toString("hex"), { encoding: "utf8", mode: 0o600 });
  const emailSecret = readFileSync(emailSecretPath, "utf8").trim();
  const database = new DatabaseSync(join(absoluteDataDirectory, "warehouse.sqlite"));
  database.exec("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;");
  applyMigrations(database, join(projectRoot, "drizzle"));
  const identity = database.prepare("SELECT id, legal_owner, source_fingerprint FROM vntech_product_identity WHERE id=?").get("VNTECH-KHO-MEP-001");
  if (!identity || identity.source_fingerprint !== VNTECH_IDENTITY.sourceFingerprint) throw new Error("Dau van tay san pham VNTECH khong hop le hoac da bi thay doi.");
  const env = {
    DB: new LocalD1Database(database),
    BUCKET: new LocalFileBucket(join(absoluteDataDirectory, "files")),
    ASSETS: new LocalAssets(join(projectRoot, "dist", "client")),
    EMAIL_SECRET: emailSecret,
  };
  return { env, database, emailSecret, close: () => database.close() };
}
