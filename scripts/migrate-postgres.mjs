// VNTECH V5.0.0 - PostgreSQL migration runner with SQLite compatibility translation.
// FINAL stabilization: validates ALL migrations before connecting to PostgreSQL.
import { readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { VNTECH_IDENTITY } from "./vntech-identity.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const nowSql = "to_char((CURRENT_TIMESTAMP AT TIME ZONE 'UTC'), 'YYYY-MM-DD\"T\"HH24:MI:SS.MS\"Z\"')";

function stripSqlComments(source) {
  const text = String(source);
  let out = "";
  let quote = null;
  let block = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (block) {
      if (ch === "*" && next === "/") { block = false; i += 1; }
      continue;
    }
    if (quote) {
      out += ch;
      if (ch === quote) {
        if (text[i + 1] === quote) out += text[++i];
        else quote = null;
      }
      continue;
    }
    if (ch === "'" || ch === '"') { quote = ch; out += ch; continue; }
    if (ch === "/" && next === "*") { block = true; i += 1; continue; }
    if (ch === "-" && next === "-") {
      while (i < text.length && text[i] !== "\n") i += 1;
      out += "\n";
      continue;
    }
    out += ch;
  }
  return out;
}

function insertOrIgnore(statement) {
  if (!/^\s*INSERT\s+OR\s+IGNORE\s+INTO\b/i.test(statement)) return statement;
  let out = statement.replace(/^\s*INSERT\s+OR\s+IGNORE\s+INTO\b/i, "INSERT INTO").trim();
  const semicolon = out.endsWith(";") ? ";" : "";
  if (semicolon) out = out.slice(0, -1).trimEnd();
  if (!/\bON\s+CONFLICT\b/i.test(out)) out += " ON CONFLICT DO NOTHING";
  return out + semicolon;
}

function updateOrIgnore(statement) {
  if (!/^\s*UPDATE\s+OR\s+IGNORE\b/i.test(statement)) return statement;
  // SQLite OR IGNORE is used only for approval recipient stage renumbering.
  // PostgreSQL equivalent: update only rows for which the target unique key does not already exist;
  // the immediately following DELETE statement removes the duplicate legacy row.
  const m = statement.match(/^\s*UPDATE\s+OR\s+IGNORE\s+"?approval_email_recipients"?\s+SET\s+"?stage"?\s*=\s*(\d+)\s+WHERE\s+"?stage"?\s*=\s*(\d+)\s*;?\s*$/i);
  if (!m) throw new Error(`UPDATE OR IGNORE chua duoc ho tro: ${statement}`);
  const nextStage = Number(m[1]);
  const oldStage = Number(m[2]);
  return `UPDATE approval_email_recipients AS target\nSET stage=${nextStage}\nWHERE target.stage=${oldStage}\n  AND NOT EXISTS (\n    SELECT 1 FROM approval_email_recipients AS existing\n    WHERE existing.project_id=target.project_id AND existing.stage=${nextStage}\n  );`;
}

function splitTopLevelArgs(source) {
  const args = [];
  let current = "";
  let quote = null;
  let depth = 0;
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    if (quote) {
      current += ch;
      if (ch === quote) {
        if (source[i + 1] === quote) current += source[++i];
        else quote = null;
      }
      continue;
    }
    if (ch === "'" || ch === '"') { quote = ch; current += ch; continue; }
    if (ch === "(") { depth += 1; current += ch; continue; }
    if (ch === ")") { depth -= 1; current += ch; continue; }
    if (ch === "," && depth === 0) { args.push(current.trim()); current = ""; continue; }
    current += ch;
  }
  if (current.trim()) args.push(current.trim());
  return args;
}

function translateStrftimeCalls(statement) {
  let sql = String(statement);
  const token = "strftime(";
  for (;;) {
    const lower = sql.toLowerCase();
    const start = lower.indexOf(token);
    if (start < 0) break;
    let quote = null;
    let depth = 1;
    let end = -1;
    for (let i = start + token.length; i < sql.length; i += 1) {
      const ch = sql[i];
      if (quote) {
        if (ch === quote) {
          if (sql[i + 1] === quote) i += 1;
          else quote = null;
        }
        continue;
      }
      if (ch === "'" || ch === '"') { quote = ch; continue; }
      if (ch === "(") depth += 1;
      else if (ch === ")") {
        depth -= 1;
        if (depth === 0) { end = i; break; }
      }
    }
    if (end < 0) throw new Error("Khong phan tich duoc ham strftime trong migration.");
    const args = splitTopLevelArgs(sql.slice(start + token.length, end));
    const fmt = args[0]?.replace(/^'|'$/g, "");
    if (fmt !== "%Y-%m-%dT%H:%M:%fZ" || args.length < 2) {
      throw new Error(`strftime chua duoc ho tro: ${sql.slice(start, end + 1)}`);
    }

    // All historical VNTECH timestamps are stored as ISO text. PostgreSQL must cast that text
    // to timestamptz BEFORE interval arithmetic; otherwise it raises "operator does not exist: text + interval".
    let instant = `((${args[1]})::timestamptz)`;
    for (const modifierArg of args.slice(2)) {
      const modifier = modifierArg.replace(/^'|'$/g, "").trim();
      const m = modifier.match(/^([+-]?\d+)\s+(hour|hours|day|days|minute|minutes)$/i);
      if (!m) throw new Error(`strftime modifier chua duoc ho tro: ${modifier}`);
      const amount = Number(m[1]);
      const unit = m[2].toLowerCase().replace(/s$/, "");
      instant = `(${instant} + interval '${amount} ${unit}')`;
    }
    const replacement = `to_char((${instant} AT TIME ZONE 'UTC'), 'YYYY-MM-DD\"T\"HH24:MI:SS.MS\"Z\"')`;
    sql = sql.slice(0, start) + replacement + sql.slice(end + 1);
  }
  return sql;
}

function translate(statement) {
  let sql = stripSqlComments(statement).trim();
  if (!sql) return null;

  // SQLite trigger syntax is replaced by ensureProtection() after all migrations.
  if (/(DROP\s+TRIGGER\s+IF\s+EXISTS\s+vntech_product_identity_|CREATE\s+TRIGGER\s+IF\s+NOT\s+EXISTS\s+vntech_product_identity_)/i.test(sql)) return null;

  sql = translateStrftimeCalls(sql);
  sql = sql
    .replaceAll("`", '"')
    .replace(/\bDEFAULT\s+false\b/gi, "DEFAULT 0")
    .replace(/\bDEFAULT\s+true\b/gi, "DEFAULT 1")
    // MT2 (bản vá #32 — user duyệt ở ⑤.5b A): kiểu SQLite `datetime(3)` / `datetime(6)` phải dịch thành
    // `timestamp(3)` của PostgreSQL. ⚠️ Đặt TRƯỚC quy tắc `datetime('now')` bên dưới; regex đòi CHỮ SỐ
    // trong ngoặc nên ⛔ không nuốt nhầm dạng `datetime('now')`.
    .replace(/\bdatetime\s*\(\s*(\d+)\s*\)/gi, "timestamp($1)")
    .replace(/\bdatetime\(\s*'now'\s*\)/gi, nowSql)
    .replace(/lower\(hex\(randomblob\(12\)\)\)/gi, "substr(md5(random()::text || clock_timestamp()::text),1,24)");

  sql = insertOrIgnore(sql);
  sql = updateOrIgnore(sql);
  return sql;
}

function splitSqlStatements(source) {
  const text = stripSqlComments(source);
  if (/CREATE\s+TRIGGER\s+IF\s+NOT\s+EXISTS\s+vntech_product_identity_/i.test(text)) return [text.trim()].filter(Boolean);
  const result = [];
  let current = "";
  let quote = null;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    current += ch;
    if (quote) {
      if (ch === quote) {
        if (text[i + 1] === quote) current += text[++i];
        else quote = null;
      }
      continue;
    }
    if (ch === "'" || ch === '"') { quote = ch; continue; }
    if (ch === ";") { if (current.trim()) result.push(current.trim()); current = ""; }
  }
  if (current.trim()) result.push(current.trim());
  return result;
}

function createTableInfo(statement, index) {
  const match = String(statement).match(/^\s*CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+[`"]([^`"]+)[`"]\s*\(/i);
  if (!match) return null;
  const refs = new Set();
  for (const ref of String(statement).matchAll(/\bREFERENCES\s+[`"]([^`"]+)[`"]+/gi)) refs.add(ref[1]);
  return { name: match[1], refs, statement, index };
}

function orderCreateTables(statements) {
  const tableInfos = statements.map((statement, index) => createTableInfo(statement, index)).filter(Boolean);
  if (tableInfos.length < 2) return statements;

  const names = new Set(tableInfos.map((item) => item.name));
  const remaining = new Map(tableInfos.map((item) => [item.name, item]));
  const completed = new Set();
  const ordered = [];

  while (remaining.size) {
    const ready = [...remaining.values()]
      .filter((item) => [...item.refs].every((ref) => ref === item.name || !names.has(ref) || completed.has(ref)))
      .sort((a, b) => a.index - b.index);

    if (!ready.length) {
      const unresolved = [...remaining.values()]
        .map((item) => `${item.name}->${[...item.refs].filter((ref) => names.has(ref) && !completed.has(ref) && ref !== item.name).join(",")}`)
        .join("; ");
      throw new Error(`Khong the sap xep thu tu CREATE TABLE theo khoa ngoai: ${unresolved}`);
    }

    for (const item of ready) {
      ordered.push(item.statement);
      completed.add(item.name);
      remaining.delete(item.name);
    }
  }

  const tableStatements = new Set(tableInfos.map((item) => item.statement));
  return [...ordered, ...statements.filter((statement) => !tableStatements.has(statement))];
}

function assertTranslatedSql(sql, migrationName) {
  if (!sql) return;
  const checks = [
    [/`/, "SQLite backtick"],
    [/\bINSERT\s+OR\s+IGNORE\b/i, "INSERT OR IGNORE"],
    [/\bUPDATE\s+OR\s+IGNORE\b/i, "UPDATE OR IGNORE"],
    [/\bdatetime\s*\(/i, "datetime()"],
    [/\bstrftime\s*\(/i, "strftime()"],
    [/\brandomblob\s*\(/i, "randomblob()"],
    [/\bAUTOINCREMENT\b/i, "AUTOINCREMENT"],
    [/\bPRAGMA\b/i, "PRAGMA"],
    [/\bRAISE\s*\(/i, "SQLite RAISE()"],
  ];
  for (const [pattern, label] of checks) {
    if (pattern.test(sql)) throw new Error(`${migrationName}: con cu phap SQLite sau khi chuyen doi (${label}): ${sql.slice(0, 260)}`);
  }
}

async function loadTranslatedMigrations() {
  const files = (await readdir(join(root, "drizzle"))).filter((name) => name.endsWith(".sql")).sort();
  const result = [];
  for (const name of files) {
    const source = await readFile(join(root, "drizzle", name), "utf8");
    const chunks = source.split("--> statement-breakpoint").map((value) => value.trim()).filter(Boolean);
    const statements = orderCreateTables(chunks.flatMap((chunk) => splitSqlStatements(chunk)));
    const translated = [];
    for (const statement of statements) {
      const sql = translate(statement);
      assertTranslatedSql(sql, name);
      if (sql) translated.push(sql);
    }
    result.push({ name, statements: translated });
  }
  return result;
}

async function preflight() {
  const migrations = await loadTranslatedMigrations();
  const statementCount = migrations.reduce((sum, item) => sum + item.statements.length, 0);
  const supply = migrations.find((item) => item.name === "0005_supply_delivery_workflow.sql");
  const supplySql = (supply?.statements || []).join("\n");
  if (!/::timestamptz/i.test(supplySql) || !/interval\s+'24\s+hour'/i.test(supplySql) || !/interval\s+'8\s+hour'/i.test(supplySql)) {
    throw new Error("Preflight 0005 that bai: phep cong SLA voi timestamp chua duoc chuyen dung sang PostgreSQL.");
  }
  const roles = migrations.find((item) => item.name === "0009_configurable_roles_approval_stages.sql");
  if ((roles?.statements || []).some((sql) => /UPDATE\s+OR\s+IGNORE/i.test(sql))) {
    throw new Error("Preflight 0009 that bai: UPDATE OR IGNORE chua duoc chuyen doi.");
  }
  const dynamic = migrations.find((item) => item.name === "0016_dynamic_forms_boq_request.sql");
  const dynamicSql=(dynamic?.statements||[]).join("\n");
  if (!dynamic || !/CREATE TABLE IF NOT EXISTS form_field_config/i.test(dynamicSql) || !/CREATE TABLE IF NOT EXISTS custom_field_values/i.test(dynamicSql) || !/ON CONFLICT DO NOTHING/i.test(dynamicSql)) {
    throw new Error("Preflight 0016 that bai: dynamic form migration chua duoc chuyen dung sang PostgreSQL.");
  }
  console.log(`PostgreSQL migration preflight: DAT · ${migrations.length} files · ${statementCount} statements.`);
  return migrations;
}

if (process.argv.includes("--preflight")) {
  await preflight();
  process.exit(0);
}

// Run the exact same translation preflight before touching a real database.
async function validateLive(migrations) {
  const pgModule = await import("pg");
  const api = pgModule.default ?? pgModule;
  const Pool = api.Pool ?? pgModule.Pool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL chưa được cấu hình cho --validate-live.");
  const pool = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 5000 });
  const client = await pool.connect();
  try {
    const appliedRows = await client.query(`SELECT name FROM __mep_migrations`);
    const applied = new Set(appliedRows.rows.map((row) => row.name));
    const pending = migrations.filter((migration) => !applied.has(migration.name));
    await client.query("BEGIN");
    try {
      for (const migration of pending) {
        for (const sql of migration.statements) await client.query(sql);
        console.log(`PostgreSQL live dry-run: ${migration.name} - DAT`);
      }
      await client.query("ROLLBACK");
    } catch (error) {
      try { await client.query("ROLLBACK"); } catch {}
      throw new Error(`Live dry-run migration thất bại: ${error instanceof Error ? error.message : String(error)}`);
    }
    console.log(`PostgreSQL live migration dry-run: DAT · ${pending.length} migration chưa áp dụng · KHÔNG ghi thay đổi.`);
  } finally {
    client.release();
    await pool.end();
  }
}

const migrations = await preflight();
if (process.argv.includes("--validate-live")) { await validateLive(migrations); process.exit(0); }
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("Thiếu DATABASE_URL để khởi tạo PostgreSQL.");
const pgModule = await import("pg");
const pgApi = pgModule.default ?? pgModule;
const Pool = pgApi.Pool ?? pgModule.Pool;
if (typeof Pool !== "function") throw new Error("Không nạp được PostgreSQL Pool từ module pg.");
const pool = new Pool({ connectionString, max: 4 });

async function ensureProtection(client) {
  await client.query(`DROP TRIGGER IF EXISTS vntech_product_identity_no_update ON vntech_product_identity`);
  await client.query(`DROP TRIGGER IF EXISTS vntech_product_identity_no_delete ON vntech_product_identity`);
  await client.query(`
    CREATE OR REPLACE FUNCTION vntech_product_identity_protected() RETURNS trigger
    LANGUAGE plpgsql AS $$
    BEGIN
      RAISE EXCEPTION 'VNTECH product identity is protected.';
    END;
    $$
  `);
  await client.query(`CREATE TRIGGER vntech_product_identity_no_update BEFORE UPDATE ON vntech_product_identity FOR EACH ROW EXECUTE FUNCTION vntech_product_identity_protected()`);
  await client.query(`CREATE TRIGGER vntech_product_identity_no_delete BEFORE DELETE ON vntech_product_identity FOR EACH ROW EXECUTE FUNCTION vntech_product_identity_protected()`);
}

const client = await pool.connect();
try {
  await client.query(`CREATE TABLE IF NOT EXISTS __mep_migrations (name text PRIMARY KEY NOT NULL, applied_at text NOT NULL)`);
  const appliedRows = await client.query(`SELECT name FROM __mep_migrations`);
  const applied = new Set(appliedRows.rows.map((row) => row.name));

  // Identity rows are protected after every successful run. Any later release
  // migration that updates the identity must temporarily remove those guards;
  // checking SQL content keeps this safe for future version migrations too.
  if (migrations.some((migration) => !applied.has(migration.name) && migration.statements.some((sql) => /UPDATE\s+vntech_product_identity\b/i.test(sql)))) {
    await client.query(`DROP TRIGGER IF EXISTS vntech_product_identity_no_update ON vntech_product_identity`);
    await client.query(`DROP TRIGGER IF EXISTS vntech_product_identity_no_delete ON vntech_product_identity`);
  }

  for (const migration of migrations) {
    if (applied.has(migration.name)) continue;
    await client.query("BEGIN");
    try {
      for (const sql of migration.statements) await client.query(sql);
      await client.query(`INSERT INTO __mep_migrations(name,applied_at) VALUES($1,$2)`, [migration.name, new Date().toISOString()]);
      await client.query("COMMIT");
      console.log(`PostgreSQL migration: ${migration.name} - DAT`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error(`Không áp dụng được migration PostgreSQL ${migration.name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  await ensureProtection(client);
  const identity = await client.query(`SELECT id,version,source_fingerprint FROM vntech_product_identity WHERE id='VNTECH-KHO-MEP-001'`);
  const row = identity.rows[0];
  if (!row || !["4.9.0","5.0.0","5.1.0","5.2.0","5.2.2","5.2.3","5.2.5","5.3.0"].includes(row.version) || row.source_fingerprint !== VNTECH_IDENTITY.sourceFingerprint) {
    throw new Error("Dấu nhận diện VNTECH trên PostgreSQL không đúng V5.3.0 FULL W2.");
  }
  console.log("Khởi tạo PostgreSQL VNTECH ERP V5.3.0 FULL W2: ĐẠT.");
} finally {
  client.release();
  await pool.end();
}
