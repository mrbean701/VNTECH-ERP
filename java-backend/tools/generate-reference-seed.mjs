#!/usr/bin/env node
/**
 * Sinh V3__reference_seed.sql — nạp DANH MỤC NỀN mà monolith JS có nhưng Java thiếu.
 *
 * VÌ SAO CẦN: JS seed 25 bảng từ 76 file drizzle/, Java V2 mới seed 2 bảng
 * (role_catalog, approval_stage_catalog). Thiếu module_catalog/menu_group_catalog ⇒
 * menu không dựng được theo dữ liệu và phân quyền menu vô hiệu; thiếu organization_units
 * ⇒ create_user trả 400 "Phòng/bộ phận không tồn tại" (không tạo được người dùng nào).
 *
 * CÁCH LÀM: đọc các file drizzle/ theo ĐÚNG thứ tự migration (để bản sau ghi đè bản trước),
 * chuyển cú pháp SQLite → MySQL:
 *   INSERT OR IGNORE  → INSERT IGNORE
 *   datetime('now')   → CURRENT_TIMESTAMP(3)
 *   ON CONFLICT(...) DO UPDATE SET x=excluded.x → ON DUPLICATE KEY UPDATE x=VALUES(x)
 *
 * Chạy: node java-backend/tools/generate-reference-seed.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const drizzleDir = join(repoRoot, "drizzle");
const outPath = join(repoRoot, "java-backend", "infrastructure", "src", "main", "resources",
  "db", "migration", "V3__reference_seed.sql");

/**
 * Các bảng danh mục cần seed. Thứ tự QUAN TRỌNG: bảng cha trước bảng con.
 * KHÔNG đưa dữ liệu nghiệp vụ (đơn hàng, phiếu...) vào đây — chỉ danh mục hệ thống.
 */
const TABLES = [
  "menu_group_catalog",       // cha của module_catalog (group_key)
  "module_catalog",
  "business_scope_catalog",
  "business_role_engine_catalog",
  "business_role_group_catalog",
  "business_role_group_scopes",
  "organization_units",       // bắt buộc để tạo người dùng
  "task_sla_policies",
  "form_field_config",
  "material_categories",
  "material_subcategories",
  "vntech_product_identity",
  "vntech_trust_settings",
];

/** Chuyển cú pháp SQLite sang MySQL. */
function toMysql(sql) {
  return sql
    .replace(/INSERT\s+OR\s+IGNORE\s+INTO/gi, "INSERT IGNORE INTO")
    .replace(/INSERT\s+OR\s+REPLACE\s+INTO/gi, "REPLACE INTO")
    .replace(/datetime\(\s*'now'\s*\)/gi, "CURRENT_TIMESTAMP(3)")
    .replace(/datetime\(\s*"now"\s*\)/gi, "CURRENT_TIMESTAMP(3)")
    // ON CONFLICT(a,b) DO UPDATE SET x=excluded.x  →  ON DUPLICATE KEY UPDATE x=VALUES(x)
    .replace(/ON\s+CONFLICT\s*\([^)]*\)\s+DO\s+UPDATE\s+SET\s+([\s\S]*?)(?=;)/gi, (m, sets) =>
      "ON DUPLICATE KEY UPDATE " + sets.replace(/excluded\.(\w+)/gi, "VALUES($1)"))
    .replace(/\bAUTOINCREMENT\b/gi, "AUTO_INCREMENT")
    .replace(/\bRETURNING\b[^;]*/gi, "");
}

/**
 * Trích các câu INSERT nhắm vào 1 bảng, có xử lý đúng dấu ; bên trong chuỗi.
 * Trả về mảng câu SQL đã chuẩn hoá MySQL.
 */
function extractInserts(sql, table) {
  const out = [];
  const re = new RegExp(`INSERT\\s+(OR\\s+IGNORE\\s+)?INTO\\s+\`?${table}\`?`, "gi");
  let m;
  while ((m = re.exec(sql)) !== null) {
    const start = m.index;
    // quét tới dấu ; ở ngoài chuỗi
    let i = re.lastIndex, inStr = false;
    for (; i < sql.length; i++) {
      const ch = sql[i];
      if (ch === "'") { if (inStr && sql[i + 1] === "'") { i++; continue; } inStr = !inStr; }
      else if (ch === ";" && !inStr) break;
    }
    out.push(sql.slice(start, i + 1));
    re.lastIndex = i + 1;
  }
  return out;
}

const files = readdirSync(drizzleDir).filter((f) => f.endsWith(".sql")).sort();
const lines = [
  "-- ============================================================",
  "-- VNTECH ERP — V3__reference_seed.sql (MySQL 8.0+, utf8mb4)",
  "-- Sinh tự động: node java-backend/tools/generate-reference-seed.mjs",
  "-- ĐỪNG SỬA TAY.",
  "--",
  "-- Mục đích: nạp DANH MỤC NỀN từ monolith JS (drizzle/) mà V2__system_seed còn thiếu.",
  "--   • module_catalog / menu_group_catalog — menu + phân quyền theo module",
  "--   • organization_units — BẮT BUỘC để create_user (thiếu ⇒ HTTP 400)",
  "--   • danh mục vật tư, phạm vi nghiệp vụ, nhóm vai trò, cấu hình biểu mẫu, SLA...",
  "--",
  "-- Nguyên tắc: giữ ĐÚNG thứ tự file migration của JS để bản ghi sau ghi đè bản trước;",
  "-- dùng INSERT IGNORE + ON DUPLICATE KEY UPDATE nên chạy lại an toàn (idempotent).",
  "-- ============================================================",
  "",
  "SET NAMES utf8mb4;",
  "",
];

let total = 0;
const perTable = {};
for (const table of TABLES) {
  const found = [];
  for (const f of files) {
    const sql = readFileSync(join(drizzleDir, f), "utf8");
    for (const stmt of extractInserts(sql, table)) found.push({ file: f, stmt: toMysql(stmt) });
  }
  if (!found.length) { perTable[table] = 0; continue; }
  perTable[table] = found.length;
  total += found.length;
  lines.push(`-- ───── ${table} (${found.length} lệnh, từ ${[...new Set(found.map(x => x.file))].join(", ")}) ─────`);
  for (const { file, stmt } of found) {
    lines.push(`-- nguồn: drizzle/${file}`);
    lines.push(stmt.trim().endsWith(";") ? stmt.trim() : stmt.trim() + ";");
    lines.push("");
  }
}

lines.push("-- ============================================================");
lines.push(`-- TỔNG: ${total} lệnh INSERT cho ${Object.values(perTable).filter(n => n > 0).length} bảng`);
for (const [t, n] of Object.entries(perTable)) if (n > 0) lines.push(`--   ${String(n).padStart(3)}  ${t}`);
lines.push("-- ============================================================");

writeFileSync(outPath, lines.join("\n"), "utf8");
console.log(`Đã ghi: ${outPath}`);
console.log(`Tổng ${total} lệnh INSERT:`);
for (const [t, n] of Object.entries(perTable)) console.log(`  ${String(n).padStart(3)}  ${t}`);
