// KHO VNTECH V4.8.0 - one-time migration from V4.7 SQLite to PostgreSQL.
import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdirSync, cpSync } from "node:fs";
import { dirname, resolve, join } from "node:path";

const sqlitePath = resolve(process.argv[2] || "/import/v47/warehouse.sqlite");
const oldFilesPath = resolve(process.argv[3] || join(dirname(sqlitePath), "files"));
const newFilesPath = resolve(process.argv[4] || process.env.VNTECH_STORAGE_DIR || "/data/storage");
if (!existsSync(sqlitePath)) throw new Error(`Không tìm thấy SQLite cũ: ${sqlitePath}`);
if (!process.env.DATABASE_URL) throw new Error("Thiếu DATABASE_URL của PostgreSQL đích.");
const pgModule = await import("pg");
const pgApi = pgModule.default ?? pgModule;
const Pool = pgApi.Pool ?? pgModule.Pool;
if (typeof Pool !== "function") throw new Error("Không nạp được PostgreSQL Pool từ module pg.");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
const sqlite = new DatabaseSync(sqlitePath, { readOnly: true });
const skip = new Set(["__mep_migrations","vntech_product_identity","server_deployment_metadata"]);
const quote = (v) => `"${String(v).replaceAll('"','""')}"`;

try {
  const existing = await pool.query(`SELECT COUNT(*)::int AS count FROM users`);
  if (Number(existing.rows[0]?.count || 0) > 0 && process.env.VNTECH_MIGRATE_FORCE !== "1") {
    throw new Error("PostgreSQL đã có người dùng/dữ liệu. Migration chỉ chạy vào hệ thống mới. Nếu chắc chắn muốn ghi đè, đặt VNTECH_MIGRATE_FORCE=1.");
  }
  const tableRows = sqlite.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`).all();
  const targetRows = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'`);
  const targetTables = new Set(targetRows.rows.map(r=>r.table_name));
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SET session_replication_role = replica");
    for (const { name } of tableRows) {
      if (skip.has(name) || !targetTables.has(name)) continue;
      await client.query(`DELETE FROM ${quote(name)}`);
    }
    for (const { name } of tableRows) {
      if (skip.has(name) || !targetTables.has(name)) continue;
      const sourceCols = sqlite.prepare(`PRAGMA table_info(${quote(name)})`).all().map(r=>r.name);
      const targetColsResult = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`, [name]);
      const targetCols = new Set(targetColsResult.rows.map(r=>r.column_name));
      const cols = sourceCols.filter(c=>targetCols.has(c));
      if (!cols.length) continue;
      const rows = sqlite.prepare(`SELECT ${cols.map(quote).join(',')} FROM ${quote(name)}`).all();
      const batchSize = 100;
      for (let offset=0; offset<rows.length; offset+=batchSize) {
        const batch = rows.slice(offset, offset+batchSize);
        if (!batch.length) continue;
        const values=[]; const groups=[];
        for (const row of batch) {
          const marks=[];
          for (const col of cols) { values.push(row[col]); marks.push(`$${values.length}`); }
          groups.push(`(${marks.join(',')})`);
        }
        await client.query(`INSERT INTO ${quote(name)} (${cols.map(quote).join(',')}) VALUES ${groups.join(',')}`, values);
      }
      console.log(`Migrated ${name}: ${rows.length} rows`);
    }
    await client.query("SET session_replication_role = origin");
    await client.query("COMMIT");
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch {}
    throw error;
  } finally { client.release(); }

  if (existsSync(oldFilesPath)) {
    mkdirSync(newFilesPath, { recursive:true });
    cpSync(oldFilesPath, newFilesPath, { recursive:true, force:false, errorOnExist:false });
    console.log(`Attachments copied: ${oldFilesPath} -> ${newFilesPath}`);
  }
  console.log("MIGRATION V4.7 -> V4.8: DAT. Dấu nhận diện V4.8.0 trên PostgreSQL được giữ nguyên.");
} finally {
  sqlite.close();
  await pool.end();
}
