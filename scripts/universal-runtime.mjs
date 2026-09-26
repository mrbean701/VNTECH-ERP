// VNTECH PROPRIETARY SOURCE | V5.3.0 FULL W2 Universal Central Server Runtime
import { createHash, randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { readFile, writeFile, unlink } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { PostgresD1Database } from "./postgres-d1.mjs";
import { VNTECH_IDENTITY } from "./vntech-identity.mjs";

const EXPECTED_FP = VNTECH_IDENTITY.sourceFingerprint;

class LocalStatement {
  constructor(database, sql, values = []) { this.database = database; this.sql = sql; this.values = values; }
  bind(...values) { return new LocalStatement(this.database, this.sql, values); }
  first(column) { const row = this.database.prepare(this.sql).get(...this.values) ?? null; return column && row ? row[column] : row; }
  all() { return { success: true, results: this.database.prepare(this.sql).all(...this.values), meta: {} }; }
  run() { const r = this.database.prepare(this.sql).run(...this.values); return { success: true, meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid) } }; }
  raw() { return this.database.prepare(this.sql).all(...this.values).map((row) => Object.values(row)); }
}
class LocalD1Database {
  constructor(database) { this.database = database; }
  prepare(sql) { return new LocalStatement(this.database, sql); }
  batch(statements) {
    this.database.exec("BEGIN IMMEDIATE");
    try { const results = statements.map((s) => s.run()); this.database.exec("COMMIT"); return results; }
    catch (error) { this.database.exec("ROLLBACK"); throw error; }
  }
  exec(sql) { this.database.exec(sql); return { count: 1, duration: 0 }; }
}

class PathFileBucket {
  constructor(directory) { this.directory = resolve(directory); mkdirSync(this.directory, { recursive: true }); }
  pathFor(key) { return join(this.directory, `${createHash("sha256").update(key).digest("hex")}.bin`); }
  async put(key, value) { const bytes = Buffer.from(await new Response(value).arrayBuffer()); await writeFile(this.pathFor(key), bytes); return { key, size: bytes.length }; }
  async get(key) { const path = this.pathFor(key); if (!existsSync(path)) return null; const bytes = await readFile(path); return { key, body: bytes, size: bytes.length }; }
  async delete(key) { const path = this.pathFor(key); if (!existsSync(path)) return; await unlink(path); }
}

const mimeTypes = {
  ".css":"text/css; charset=utf-8", ".csv":"text/csv; charset=utf-8", ".gif":"image/gif", ".html":"text/html; charset=utf-8",
  ".ico":"image/x-icon", ".jpeg":"image/jpeg", ".jpg":"image/jpeg", ".js":"text/javascript; charset=utf-8", ".json":"application/json; charset=utf-8",
  ".png":"image/png", ".svg":"image/svg+xml", ".txt":"text/plain; charset=utf-8", ".webp":"image/webp", ".woff":"font/woff", ".woff2":"font/woff2",
  ".xlsx":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};
class LocalAssets {
  constructor(directory) { this.directory = resolve(directory); }
  async fetch(request) {
    let pathname; try { pathname = decodeURIComponent(new URL(request.url).pathname); } catch { return new Response("Bad Request", { status:400 }); }
    const path = resolve(this.directory, pathname.replace(/^\/+/, ""));
    if (path !== this.directory && !path.startsWith(`${this.directory}${sep}`)) return new Response("Forbidden", { status:403 });
    if (!existsSync(path) || !statSync(path).isFile()) return new Response("Not Found", { status:404 });
    return new Response(await readFile(path), { headers: { "Content-Type": mimeTypes[extname(path).toLowerCase()] || "application/octet-stream" } });
  }
}

function applySqliteMigrations(database, migrationsDirectory) {
  database.exec(`CREATE TABLE IF NOT EXISTS __mep_migrations (name TEXT PRIMARY KEY NOT NULL, applied_at TEXT NOT NULL)`);
  const applied = new Set(database.prepare("SELECT name FROM __mep_migrations").all().map((row) => row.name));
  const files = readdirSync(migrationsDirectory).filter((name) => name.endsWith(".sql")).sort();
  for (const name of files) {
    if (applied.has(name)) continue;
    const source = readFileSync(join(migrationsDirectory, name), "utf8");
    const statements = source.split("--> statement-breakpoint").map((v) => v.trim()).filter(Boolean);
    database.exec("BEGIN IMMEDIATE");
    try {
      for (const statement of statements) database.exec(statement);
      database.prepare("INSERT INTO __mep_migrations (name,applied_at) VALUES (?,?)").run(name, new Date().toISOString());
      database.exec("COMMIT");
    } catch (error) {
      database.exec("ROLLBACK");
      throw new Error(`Khong ap dung duoc cap nhat du lieu ${name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

async function createRedis(url) {
  if (!url) return null;
  try {
    const { createClient } = await import("redis");
    const client = createClient({ url });
    client.on("error", (error) => console.error(`Redis: ${error.message}`));
    await client.connect();
    await client.ping();
    return client;
  } catch (error) {
    if (String(process.env.VNTECH_REDIS_REQUIRED || "0") === "1") throw error;
    console.warn(`Redis khong san sang - he thong tiep tuc khong cache: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

function readOrCreateSecret(directory) {
  mkdirSync(directory, { recursive: true });
  const path = join(directory, "email-secret.key");
  if (!existsSync(path)) writeFileSync(path, randomBytes(32).toString("hex"), { encoding:"utf8", mode:0o600 });
  return readFileSync(path, "utf8").trim();
}

export async function createUniversalRuntime(projectRoot) {
  const root = resolve(projectRoot);
  const mode = process.env.VNTECH_DEPLOYMENT_MODE || "server-standalone";
  const engine = (process.env.VNTECH_DB_ENGINE || (process.env.DATABASE_URL ? "postgres" : "sqlite")).toLowerCase();
  const dataDirectory = resolve(process.env.VNTECH_DATA_DIR || join(root, ".server-data"));
  const storageDirectory = resolve(process.env.VNTECH_STORAGE_DIR || join(dataDirectory, "files"));
  const secretDirectory = resolve(process.env.VNTECH_SECRET_DIR || join(dataDirectory, "secrets"));
  mkdirSync(dataDirectory, { recursive:true }); mkdirSync(storageDirectory, { recursive:true }); mkdirSync(secretDirectory, { recursive:true });
  const emailSecret = readOrCreateSecret(secretDirectory);
  let rawDatabase = null; let pool = null; let db;

  if (engine === "postgres" || engine === "postgresql") {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("VNTECH_DB_ENGINE=postgres nhưng thiếu DATABASE_URL.");
    const pgModule = await import("pg");
    const pgApi = pgModule.default ?? pgModule;
    const Pool = pgApi.Pool ?? pgModule.Pool;
    if (typeof Pool !== "function") throw new Error("Không nạp được PostgreSQL Pool từ module pg.");
    pool = new Pool({ connectionString, max: Number(process.env.VNTECH_DB_POOL_MAX || 30), idleTimeoutMillis: 30000, connectionTimeoutMillis: 10000 });
    await pool.query("SELECT 1");
    db = new PostgresD1Database(pool);
  } else {
    rawDatabase = new DatabaseSync(join(dataDirectory, "warehouse.sqlite"));
    rawDatabase.exec("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=10000;");
    applySqliteMigrations(rawDatabase, join(root, "drizzle"));
    db = new LocalD1Database(rawDatabase);
  }

  const identity = await db.prepare("SELECT id,legal_owner,version,source_fingerprint FROM vntech_product_identity WHERE id=?").bind("VNTECH-KHO-MEP-001").first();
  if (!identity || identity.source_fingerprint !== EXPECTED_FP) throw new Error("Dau van tay san pham VNTECH V5.3.0 FULL W2 khong hop le hoac da bi thay doi.");
  const expectedVersion=String(process.env.VNTECH_RELEASE_VERSION||"").trim();
  if(expectedVersion&&String(identity.version)!==expectedVersion)throw new Error(`Sai phien ban database/runtime: database=${identity.version||"khong-ro"}, runtime=${expectedVersion}.`);

  const stamp = new Date().toISOString();
  const publicUrl = process.env.VNTECH_PUBLIC_URL || null;
  const storageMode = process.env.VNTECH_STORAGE_MODE || (mode === "server-nas" ? "nas" : "local");
  const nodeName = process.env.VNTECH_NODE_NAME || process.env.HOSTNAME || process.env.COMPUTERNAME || "VNTECH-SERVER";
  try {
    await db.prepare(`UPDATE server_deployment_metadata SET deployment_mode=?,database_engine=?,storage_mode=?,public_url=?,node_name=?,updated_at=? WHERE id='SERVER'`)
      .bind(mode, engine, storageMode, publicUrl, nodeName, stamp).run();
  } catch (error) { console.warn(`Khong cap nhat metadata may chu: ${error instanceof Error ? error.message : String(error)}`); }
  try {
    const machineFingerprint = String(process.env.VNTECH_MACHINE_FINGERPRINT || "").trim() || null;
    await db.prepare(`UPDATE vntech_trust_settings SET machine_fingerprint=?,updated_at=? WHERE id='TRUST-ROOT'`).bind(machineFingerprint, stamp).run();
    await db.prepare(`INSERT INTO vntech_trust_audit(id,event_type,actor_user_id,trust_mode,enforcement_enabled,license_id,machine_fingerprint,detail_json,occurred_at) VALUES (?,?,?,?,?,?,?,?,?)`).bind(`TA_${randomBytes(12).toString("hex")}`, "STARTUP_CHECK", null, VNTECH_IDENTITY.trust.mode, 0, null, machineFingerprint, JSON.stringify({ allowStartup: true, enforcement: "disabled-by-design" }), stamp).run();
  } catch (error) { console.warn(`Trust foundation metadata chua cap nhat: ${error instanceof Error ? error.message : String(error)}`); }

  const redis = await createRedis(process.env.REDIS_URL || "");
  const env = {
    DB: db,
    BUCKET: new PathFileBucket(storageDirectory),
    ASSETS: new LocalAssets(join(root, "dist", "client")),
    EMAIL_SECRET: emailSecret,
    COOKIE_SECURE: String(process.env.VNTECH_COOKIE_SECURE || "0") === "1",
    PUBLIC_URL: publicUrl,
    DEPLOYMENT_MODE: mode,
    DATABASE_ENGINE: engine,
    STORAGE_MODE: storageMode,
    REDIS: redis,
  };
  return {
    env, emailSecret, pool, rawDatabase, redis,
    info: { mode, engine, storageMode, publicUrl, dataDirectory, storageDirectory, nodeName, version: identity.version },
    close: async () => {
      try { if (redis?.isOpen) await redis.quit(); } catch {}
      try { if (pool) await pool.end(); } catch {}
      try { if (rawDatabase) rawDatabase.close(); } catch {}
    },
  };
}
