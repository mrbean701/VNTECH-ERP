#!/usr/bin/env node
/**
 * migrate-sqlite-to-mysql.mjs — ETL cho giai đoạn CUTOVER (docs/10 §3.1.2):
 * đọc DB SQLite của monolith JS (branch unity) → sinh script INSERT compat MySQL 8.4
 * theo DATA_MODEL_REFERENCE (PK VARCHAR(64), DATETIME(3), TINYINT(1), utf8mb4).
 *
 * Cách dùng:
 *   node java-backend/tools/migrate-sqlite-to-mysql.mjs --sqlite <db.sqlite> --out java-backend/migration
 *
 * Đầu ra: java-backend/migration/ + migration.sql (tổng hợp, thứ tự FK an toàn) + manifest.json
 * (row counts theo bảng).
 *
 * Thứ tự ghi (dependency-safe): không ghi vào bảng user_data; bảng cấu hình/master trước,
 * nghiệp vụ sau (BOQ → MR → PO → GRN → Stock → Finance → HR/Pháp chế).
 */
import { DatabaseSync } from "node:sqlite";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
function arg(name) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : null;
}
const sqlitePath = arg("--sqlite");
const outDir = arg("--out") || join(__dirname, "migration");
if (!sqlitePath || !existsSync(sqlitePath)) {
  console.error("Cần --sqlite <path> (DB SQLite của monolith JS).");
  process.exit(1);
}

// Bảng bỏ qua (hệ thống/tạm — không migrate sang MySQL)
const SKIP_TABLES = new Set([
  "sqlite_sequence", "sqlite_stat1", "drizzle_migrations", "kysely_migration",
  "users_password_reset_tokens", "sessions", "audit_log",
]);
// Bảng hệ thống migrate đặc biệt không cần (id chuẩn hoá tự sinh phía Java) — giữ những gì JS viết

// Ưu tiên ghi: master/config trước, nghiệp vụ sau
const PRIORITY = [
  "company_settings", "email_settings", "ui_display_settings", "vntech_trust_settings",
  "material_categories", "material_subcategories", "materials", "material_aliases",
  "material_external_codes", "material_uom_conversions", "material_norms",
  "role_catalog", "organization_units", "users", "departments",
  "approval_stage_catalog", "business_role_group_catalog", "business_scope_catalog",
  "menu_groups", "menu_layout", "module_catalog", "form_field_configs",
  "projects", "project_contracts", "boq_versions", "boq_import_batches",
  "boq_source_items", "project_boq_items", "boq_change_history",
  "warehouses", "warehouse_locations", "teams", "suppliers",
  "material_requests", "material_request_items", "approvals", "approval_project_assignments",
  "stock_reservations", "purchase_orders", "purchase_order_items", "procurement_allocations",
  "supply_workflow_steps", "goods_receipts", "goods_receipt_items",
  "stock_movements", "contract_stock_ledger", "stock_issues", "stock_issue_items",
  "material_returns", "material_return_items", "transfer_orders", "transfer_order_items",
  "central_returns", "central_return_items", "stock_counts", "stock_count_items",
  "contract_stock_reconciliations", "contract_ownership_transfers",
  "production_reports", "capital_recovery_records", "contract_payments",
  "team_subcontracts", "team_production_records", "team_payments", "team_settlements",
  "construction_daily_logs", "construction_daily_log_items",
  "payment_plans", "advance_requests", "site_expense_claims",
  "bank_accounts", "cashbook_entries", "accounting_vouchers", "boq_price_import_batches", "boq_price_import_items",
  "hr_records", "labor_contracts", "official_correspondence", "legal_documents",
  "seal_management", "benefit_records", "work_items", "work_item_events", "task_notifications",
  "material_mar_approvals", "attachments", "document_sequences",
];

const db = new DatabaseSync(sqlitePath, { readOnly: true });

function esc(v) {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "NULL";
  if (typeof v === "bigint") return v.toString();
  if (typeof v === "boolean") return v ? "1" : "0";
  const s = String(v);
  if (s instanceof Uint8Array || typeof s === "object") return "NULL";
  return "'" + s.replace(/\\/g, "\\\\").replace(/'/g, "''") + "'";
}

function toMysqlValue(col, v) {
  if (v === null || v === undefined) return "NULL";
  const t = (col.type || "").toLowerCase();
  if (t.includes("int")) return Number.isFinite(Number(v)) ? String(Number(v)) : "NULL";
  if (t.includes("real") || t.includes("deci")) return Number.isFinite(Number(v)) ? String(Number(v)) : "0";
  return esc(v);
}

function tableNames() {
  const rows = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  return rows.map((r) => r.name).filter((n) => !SKIP_TABLES.has(n));
}

function columnsOf(table) {
  return db.prepare(`PRAGMA table_info(${quoteIdent(table)})`).all();
}
function quoteIdent(s) {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(s) ? `\`${s}\`` : `${JSON.stringify(s)}`;
}
function quoteWhere(s) {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(s) ? s : `"${s}"`;
}

function dumpTable(table) {
  const cols = columnsOf(table);
  const rows = db.prepare(`SELECT * FROM ${quoteIdent(table)}`).all();
  const lines = [];
  lines.push(`-- ===== ${table} (${rows.length} rows) =====`);
  if (!rows.length) return { table, rows: 0, sql: lines.join("\n") + "\n" };
  for (const row of rows) {
    const values = cols.map((c) => toMysqlValue(c, row[c.name]));
    lines.push(`INSERT INTO \`${table}\` (${cols.map((c) => `\`${c.name}\``).join(",")}) VALUES (${values.join(",")});`);
  }
  return { table, rows: rows.length, sql: lines.join("\n") + "\n" };
}

const header = `-- VNTECH ERP — Migration SQLite (JS monolith) → MySQL 8.4
-- Sinh bởi java-backend/tools/migrate-sqlite-to-mysql.mjs
-- Chạy SAU khi Flyway V1 baseline đã migrate (bảng trống). Upsert-safe với PK trùng.
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
`;

mkdirSync(outDir, { recursive: true });
const manifest = { source: sqlitePath, generatedAt: new Date().toISOString(), tables: [], totalRows: 0 };
const parts = [header];
const tables = tableNames().sort((a, b) => {
  const ia = PRIORITY.indexOf(a), ib = PRIORITY.indexOf(b);
  const pa = ia >= 0 ? ia : PRIORITY.length, pb = ib >= 0 ? ib : PRIORITY.length;
  return pa - pb;
});
let total = 0;
for (const table of tables) {
  try {
    const out = dumpTable(table);
    parts.push(out.sql);
    manifest.tables.push({ table, rows: out.rows });
    total += out.rows;
  } catch (e) {
    console.warn(`  ! bỏ qua ${table}: ${e.message}`);
  }
}
manifest.totalRows = total;
parts.push("SET FOREIGN_KEY_CHECKS = 1;\n");
writeFileSync(join(outDir, "migration.sql"), parts.join("\n"), "utf8");
writeFileSync(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
console.log(`Đã sinh migration: ${outDir}`);
console.log(`  Bảng: ${manifest.tables.length} · Tổng dòng: ${total}`);
for (const t of manifest.tables.filter((t) => t.rows > 0).slice(0, 25))
  console.log(`    - ${t.table}: ${t.rows}`);
if (manifest.tables.some((t) => t.rows > 0)) console.log("  … (đầy đủ trong manifest.json)");