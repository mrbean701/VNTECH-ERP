#!/usr/bin/env node
/**
 * VNTECH ERP — Sinh Flyway V1__baseline.sql (MySQL 8.4) từ DATA_MODEL_REFERENCE.json.
 *
 * Quy tắc chuyển dialect SQLite/Postgres -> MySQL:
 *   - text PK            -> VARCHAR(64)   (MySQL không index được TEXT)
 *   - text có FK/ref     -> VARCHAR(64)
 *   - text có DEFAULT    -> VARCHAR(255)  (TEXT không được phép DEFAULT)
 *   - text còn lại       -> TEXT
 *   - integer            -> INT  (cờ boolean kiểu integer -> TINYINT(1) nếu tên cột bắt đầu is_/has_/active...)
 *   - real               -> DECIMAL(18,4)
 *   - blob               -> LONGBLOB
 *   - utf8mb4 + DATETIME(3) cho timestamp TEXT
 * Index/constraint từ nguồn được port sang MySQL (bỏ IF NOT EXISTS).
 *
 * ĐẶT Ở java-backend/tools — KHÔNG đặt trong scripts/ (fingerprint gate bản JS).
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const javaBackend = resolve(__dirname, "..");
const jsonPath = process.argv[2] || join(javaBackend, "DATA_MODEL_REFERENCE.json");
const outPath = process.argv[3] || join(javaBackend, "infrastructure", "src", "main", "resources", "db", "migration", "V1__baseline.sql");

const { tables } = JSON.parse(readFileSync(jsonPath, "utf8"));
mkdirSync(dirname(outPath), { recursive: true });

const BOOLEAN_HINT = /^(is_|has_|active|verified|enabled|locked|system_locked|negative_stock_blocked|requires_|archived|deleted)/i;

function mysqlType(col) {
  const t = col.type.toUpperCase();
  const name = col.name.toLowerCase();
  if (t === "TEXT") {
    // Timestamp lưu TEXT (ISO 'YYYY-MM-DDTHH:mm:ss.sssZ') ở bản JS -> DATETIME(3) ở MySQL
    if (/_at$/.test(name)) return "DATETIME(3)";
    if (/_date$/.test(name)) return "DATE";
    if (col.pk) return "VARCHAR(64)";
    if (col.ref || /_id$/.test(name) || /^(id|code|no|key)$/.test(name) || /^.*_(code|no)$/.test(name)) return "VARCHAR(64)";
    if (col.default !== undefined) return "VARCHAR(255)";
    return "TEXT";
  }
  if (t === "INTEGER" || t === "INT") {
    if (BOOLEAN_HINT.test(name)) return "TINYINT(1)";
    return "INT";
  }
  if (t === "REAL" || t === "FLOAT" || t === "DOUBLE") return "DECIMAL(18,4)";
  if (t === "BLOB") return "LONGBLOB";
  if (t === "NUMERIC" || t === "DECIMAL") return "DECIMAL(18,4)";
  if (t === "DATE") return "DATE";
  if (t === "DATETIME") return "DATETIME(3)";
  if (t === "BOOLEAN") return "TINYINT(1)";
  if (t === "BIGINT") return "BIGINT";
  console.error(`[warn] kiểu chưa map: ${t} (cột ${name})`);
  return t;
}

function mysqlDefault(col) {
  if (col.default === undefined) return null;
  const d = String(col.default);
  const t = mysqlType(col);
  if (t === "TINYINT(1)") return /^(1|true)$/i.test(d) ? "1" : "0";
  if (t === "DECIMAL(18,4)") return Number(d).toString();
  if (t === "INT" || t === "BIGINT") return Number(d).toString();
  // các literal text khác — giữ nguyên nếu là số, ngược lại thêm quote
  if (/^-?\d+(\.\d+)?$/.test(d)) return `'${d}'`;
  return `'${d.replace(/'/g, "''")}'`;
}

const out = [];
out.push("-- ============================================================");
out.push("-- VNTECH ERP — V1__baseline.sql (MySQL 8.4, utf8mb4)");
out.push("-- Sinh tự động từ DATA_MODEL_REFERENCE.json (nguồn: drizzle/0000..0075)");
out.push("-- Đừng sửa tay: chạy java-backend/tools/generate-flyway-baseline.mjs");
out.push("-- ============================================================");
out.push("");
out.push("SET NAMES utf8mb4;");
out.push("SET FOREIGN_KEY_CHECKS = 0;");
out.push("");

for (const t of tables.sort((a, b) => a.table.localeCompare(b.table))) {
  const defs = t.columns.map((c) => {
    const parts = [`\`${c.name}\``, mysqlType(c)];
    if (c.pk) parts.push("NOT NULL");
    else if (c.notNull) parts.push("NOT NULL");
    const def = mysqlDefault(c);
    if (def !== null) parts.push(`DEFAULT ${def}`);
    if (!c.notNull && !c.pk && def === null) parts.push("NULL");
    return parts.join(" ");
  });

  // PK
  const pks = t.columns.filter((c) => c.pk).map((c) => `\`${c.name}\``);
  if (pks.length) defs.push(`PRIMARY KEY (${pks.join(", ")})`);

  // Inline UNIQUE (từ constraint trong CREATE TABLE) — tên theo cột (drizzle có thể 2 unique cùng tên khác cột)
  for (const ix of t.indexes) {
    if (ix.unique && ix.name === `${t.table}_inline_unique`) {
      const uqName = `${t.table}_uidx_${ix.columns.join("_").replace(/[^a-zA-Z0-9_]/g, "")}`;
      defs.push(`UNIQUE KEY \`${uqName}\` (${ix.columns.map((c) => `\`${c}\``).join(", ")})`);
    }
  }

  // FK — KHÔNG tạo CONSTRAINT FOREIGN KEY trong baseline:
  //   (1) thứ tự bảng alphabet → bảng con trước bảng cha (MySQL/H2 đều fail tạo FK);
  //   (2) schema-h2 đã bỏ FK; integrity do application quản lý (JdbcTemplate).
  // Nếu sau này cần DB-level FK: tạo migration V2 riêng sau khi đủ dữ liệu.

  out.push(`CREATE TABLE \`${t.table}\` (`);
  out.push(`  ${defs.join(",\n  ")}`);
  out.push(`) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
  out.push("");

  // Index (ngoài inline unique; UNIQUE index CREATE UNIQUE INDEX) — ưu tiên đúng prefix vì utf8mb4
  const createdIndexes = new Set();
  for (const ix of t.indexes) {
    if (ix.name === `${t.table}_inline_unique`) continue;
    const bad = ix.columns.some((c) => c.includes("(") || c.includes(")"));
    if (bad) {
      out.push(`-- MySQL 8.4 không hỗ trợ functional index; bỏ \`${ix.name}\` (${ix.columns.join(",")})`);
      out.push("");
      continue;
    }
    if (createdIndexes.has(ix.name)) {
      out.push(`-- index trùng tên \`${ix.name}\` (bỏ lần tạo thứ 2)`);
      out.push("");
      continue;
    }
    createdIndexes.add(ix.name);
    const kind = ix.unique ? "UNIQUE INDEX" : "INDEX";
    const cols = ix.columns.map((c) => {
      const col = t.columns.find((x) => x.name === c);
      // TEXT cần prefix length cho index trong MySQL
      if (col && mysqlType(col) === "TEXT") return `\`${c}\`(191)`;
      return `\`${c}\``;
    }).join(", ");
    out.push(`CREATE ${kind} \`${ix.name}\` ON \`${t.table}\` (${cols});`);
    out.push("");
  }
}

out.push("SET FOREIGN_KEY_CHECKS = 1;");
out.push("");
out.push("-- Baseline tạo bởi generator — bảng: " + tables.length);

writeFileSync(outPath, out.join("\n"));
console.log(`Flyway baseline: ${tables.length} bảng -> ${outPath}`);
console.log(`  (${out.length} dòng SQL)`);