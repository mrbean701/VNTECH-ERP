// CỔNG ĐO PHASE 10 (mục F-03 · F-04 · F-05) — ĐỌC-ONLY với CSDL thật.
//
// VÌ SAO CẦN: PHASE 10 là «CHỈ AUDIT + CHUẨN BỊ KIẾN TRÚC» ⇒ sản phẩm của F-03/F-04/F-05 là
// BÁO CÁO + THIẾT KẾ, không có mã nghiệp vụ. Báo cáo chỉ đáng tin nếu số liệu của nó còn khớp
// với CSDL đang chạy. Cổng này:
//   1. Đối chiếu ẢNH CHỤP danh sách bảng (LIVE_TABLES_SNAPSHOT) với information_schema THẬT.
//   2. Đối chiếu SỐ DÒNG ảnh chụp với COUNT(*) THẬT (lệch ⇒ cảnh báo DRIFT, không đánh hỏng).
//   3. Kiểm bảng KIẾN TRÚC đề xuất của F-04/F-05 KHÔNG trùng bảng đang có (trùng ⇒ migration đạp dữ liệu).
//   4. Kiểm neo engine WF-06 còn thật (cột workflow_definitions.module_key, approval_stage_catalog.approval_mode).
//   5. Kiểm mặt API đề xuất (F-04/F-05) vẫn là action MỚI ở cả 3 nơi (JS · Java · ma trận quyền).
//
// RÀNG BUỘC CỨNG: cổng này KHÔNG ghi gì vào MySQL. Mọi câu lệnh là SELECT.
// Chạy: node scripts/phase10-architecture-gate.mjs
// Đổi đường dẫn mysql: đặt biến môi trường MYSQL_BIN.
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";

const MYSQL_BIN = process.env.MYSQL_BIN || "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const DB = "vntech_erp";

const F03 = "docs/agent-progress/F-03-TAI-CHINH-AUDIT-PHU-THUOC.md";
const F04 = "docs/agent-progress/F-04-HANH-CHINH-KIEN-TRUC.md";
const F05 = "docs/agent-progress/F-05-LICH-KIEN-TRUC.md";
const JS_ROUTE = "scripts/system-route.mjs";
const JAVA_CTRL = "java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java";
const REGISTRY = "java-backend/application/src/main/java/com/vntech/erp/application/rbac/ActionRbacRegistry.java";

// ẢNH CHỤP 123 bảng — đo 22/09/2026, HEAD 729be05, nhánh unity.
// Câu lệnh tạo ảnh chụp:
//   SELECT table_name FROM information_schema.tables WHERE table_schema='vntech_erp' ORDER BY table_name;
const LIVE_TABLES_SNAPSHOT = [
  "accounting_vouchers", "advance_requests", "approval_email_recipients", "approval_project_assignments",
  "approval_stage_catalog", "approval_stage_decisions", "approvals", "attachments", "audit_logs",
  "bank_accounts", "benefit_records", "boq_change_history", "boq_import_batches", "boq_mapping_audit",
  "boq_mapping_candidates", "boq_mapping_runs", "boq_material_components", "boq_price_import_batches",
  "boq_price_import_items", "boq_source_items", "boq_versions", "business_role_engine_catalog",
  "business_role_group_catalog", "business_role_group_scopes", "business_scope_catalog",
  "capital_recovery_records", "cashbook_entries", "central_return_items", "central_returns",
  "company_settings", "construction_daily_log_items", "construction_daily_logs",
  "contract_ownership_transfers", "contract_payments", "contract_stock_ledger",
  "contract_stock_reconciliations", "custom_field_values", "department_module_permissions",
  "document_sequences", "email_outbox", "email_settings", "flyway_schema_history", "form_field_config",
  "goods_receipt_items", "goods_receipts", "hr_records", "labor_contracts", "legal_documents",
  "material_aliases", "material_categories", "material_code_history", "material_embeddings",
  "material_external_codes", "material_mapping_history", "material_mar_approvals", "material_norms",
  "material_request_items", "material_requests", "material_return_items", "material_returns",
  "material_subcategories", "material_uom_conversions", "materials", "menu_group_catalog",
  "module_catalog", "official_correspondence", "organization_units", "payment_plans",
  "procurement_allocations", "production_reports", "project_archives", "project_boq_items",
  "project_close_checks", "project_contracts", "projects", "purchase_order_items", "purchase_orders",
  "request_comments", "role_catalog", "seal_management", "server_deployment_metadata", "sessions",
  "site_expense_claims", "stock_count_items", "stock_counts", "stock_issue_items", "stock_issues",
  "stock_movements", "stock_reservations", "suppliers", "supply_workflow_steps", "system_level_catalog",
  "task_notifications", "task_sla_policies", "team_members", "team_payments", "team_production_records",
  "team_settlements", "team_subcontracts", "teams", "transfer_order_items", "transfer_orders",
  "ui_display_settings", "user_module_permissions", "user_project_scopes", "user_warehouse_scopes",
  "users", "vntech_attestation_events", "vntech_license_installations",
  "vntech_license_transfer_requests", "vntech_product_identity", "vntech_release_signatures",
  "vntech_trust_audit", "vntech_trust_settings", "warehouse_locations", "warehouses",
  "work_item_comments", "work_item_events", "work_item_participants", "work_items",
  "workflow_definitions", "workflow_step_approvers", "workflow_steps",
];

// ẢNH CHỤP SỐ DÒNG — đo cùng mốc bằng COUNT(*) (KHÔNG dùng table_rows: đó là ước lượng InnoDB, đã đo ra SAI).
// Lệch ⇒ cảnh báo DRIFT (dữ liệu nghiệp vụ có thể đã phát sinh), KHÔNG đánh hỏng cổng.
const ROW_SNAPSHOT = {
  payment_plans: 3, contract_payments: 2, capital_recovery_records: 1, advance_requests: 0,
  site_expense_claims: 0, bank_accounts: 1, cashbook_entries: 2, accounting_vouchers: 0,
  project_contracts: 4, production_reports: 2, team_payments: 0, team_settlements: 0,
  team_subcontracts: 0, team_production_records: 0, module_catalog: 61, approvals: 124,
  approval_stage_catalog: 8, workflow_definitions: 4, workflow_steps: 11, users: 13,
  task_notifications: 3, hr_records: 4, benefit_records: 1, labor_contracts: 2,
  organization_units: 8, workflow_step_approvers: 5,
};

let failed = 0;
let warned = 0;
function check(name, ok, detail = "") {
  if (ok) {
    console.log(`  ĐẠT  ${name}${detail ? ` — ${detail}` : ""}`);
  } else {
    failed += 1;
    console.log(`  HỎNG ${name}${detail ? ` — ${detail}` : ""}`);
  }
}
function warn(name, detail) {
  warned += 1;
  console.log(`  DRIFT ${name} — ${detail}`);
}

// ---- MySQL (CHỈ ĐỌC) ----
if (!existsSync(MYSQL_BIN)) {
  console.error(`THIẾU mysql.exe tại ${MYSQL_BIN} — đặt MYSQL_BIN nếu đường dẫn khác.`);
  process.exit(2);
}
function query(sql) {
  const out = execFileSync(MYSQL_BIN, ["-uvntech", "-pvntech", "-N", "-B", "-e", sql, DB], {
    encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 32 * 1024 * 1024,
  });
  return out.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
}
function countOf(table) {
  const rows = query(`SELECT COUNT(*) FROM ${table}`);
  return Number(rows[0] ?? NaN);
}

const SQUOTE = String.fromCharCode(39);
const LIVE_TABLE_SQL = `SELECT table_name FROM information_schema.tables WHERE table_schema=${SQUOTE}${DB}${SQUOTE} ORDER BY table_name`;
const LIVE_COLUMN_SQL = `SELECT table_name, column_name FROM information_schema.columns WHERE table_schema=${SQUOTE}${DB}${SQUOTE}`;

console.log("═══ CỔNG ĐO PHASE 10 — F-03 (tài chính) · F-04/F-05 (hành chính/lịch) ═══");
console.log(`Mốc ảnh chụp: 22/09/2026 · HEAD 729be05 · nhánh unity · DB ${DB}`);

// ---- [1] danh sách bảng: ảnh chụp ↔ sống ----
console.log("\n[1] DANH SÁCH BẢNG (ảnh chụp ↔ information_schema)");
const live = new Set(query(LIVE_TABLE_SQL).map((t) => t.toLowerCase()));
const snap = new Set(LIVE_TABLES_SNAPSHOT);
const missingInLive = [...snap].filter((t) => !live.has(t));
const missingInSnap = [...live].filter((t) => !snap.has(t));
check("ảnh chụp có 123 bảng", LIVE_TABLES_SNAPSHOT.length === 123, `thực tế ${LIVE_TABLES_SNAPSHOT.length}`);
check("CSDL sống có 123 bảng", live.size === 123, `thực tế ${live.size}`);
check("tập bảng ảnh chụp == tập bảng sống", missingInLive.length === 0 && missingInSnap.length === 0,
  `thiếu ở sống: [${missingInLive}] · mới ở sống: [${missingInSnap}]`);

// ---- [2] số dòng: ảnh chụp ↔ COUNT(*) ----
console.log("\n[2] SỐ DÒNG COUNT(*) (ảnh chụp ↔ sống; lệch = DRIFT, không đánh hỏng)");
for (const [table, expected] of Object.entries(ROW_SNAPSHOT)) {
  if (!live.has(table)) { check(`bảng ${table} tồn tại`, false, "không có trong CSDL sống"); continue; }
  const actual = countOf(table);
  if (actual === expected) console.log(`  ĐẠT  ${table}: ${actual}`);
  else warn(`${table}: ảnh chụp ${expected} → sống ${actual}`, "hồ sơ F-03 ghi số cũ, cần cập nhật khi chốt mục");
}

// ---- [3] bảng KIẾN TRÚC đề xuất không được trùng bảng đang có ----
console.log("\n[3] BẢNG KIẾN TRÚC ĐỀ XUẤT (F-04/F-05) — không trùng bảng đang có");
function sqlBlocks(path) {
  if (!existsSync(path)) return "";
  return [...readFileSync(path, "utf8").matchAll(/```sql([\s\S]*?)```/g)].map((m) => m[1]).join("\n");
}
const proposedDdl = sqlBlocks(F04) + "\n" + sqlBlocks(F05);
const proposed = [...proposedDdl.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"']?(\w+)[`"']?/gi)].map((m) => m[1]);
check("hồ sơ F-04/F-05 có bảng đề xuất", proposed.length > 0, `${proposed.length} bảng: ${proposed.join(", ")}`);
const clash = proposed.filter((t) => live.has(t));
check("KHÔNG bảng đề xuất nào đụng bảng đang có", clash.length === 0, `đụng: [${clash}]`);
const prefixed = proposed.filter((t) => /^hr_/.test(t));
check("mọi bảng đề xuất mang tiền tố hr_", prefixed.length === proposed.length);
const destructive = [
  [/DROP\s+(TABLE|COLUMN|DATABASE|INDEX|VIEW)/i, "DROP"],
  [/TRUNCATE/i, "TRUNCATE"],
  [/DELETE\s+FROM/i, "DELETE FROM"],
  [/UPDATE\s+\w+\s+SET/i, "UPDATE … SET"],
].filter(([re]) => re.test(proposedDdl)).map(([, n]) => n);
check("DDL đề xuất ADDITIVE thuần (không DROP/TRUNCATE/DELETE/UPDATE)", destructive.length === 0, destructive.join(", "));

// ---- [4] neo engine WF-06 còn thật ----
console.log("\n[4] NEO ENGINE WF-06 (dữ liệu dùng để tái sử dụng engine duyệt)");
const cols = query(LIVE_COLUMN_SQL).map((l) => l.split("\t").map((x) => x.toLowerCase()));
const colSet = new Set(cols.map(([t, c]) => `${t}.${c}`));
check("workflow_definitions.module_key tồn tại", colSet.has("workflow_definitions.module_key"));
check("approval_stage_catalog.approval_mode tồn tại", colSet.has("approval_stage_catalog.approval_mode"));
check("workflow_steps.workflow_id tồn tại", colSet.has("workflow_steps.workflow_id"));
check("neo nhân sự users.organization_unit_id tồn tại", colSet.has("users.organization_unit_id"));
check("hr_records tồn tại (neo dữ liệu nhân sự)", live.has("hr_records"));

// ---- [5] mặt API đề xuất vẫn là MỚI ----
console.log("\n[5] MẶT API ĐỀ XUẤT (F-04/F-05) — phải vẫn là action MỚI");
function apiActions(path) {
  if (!existsSync(path)) return [];
  const sec = readFileSync(path, "utf8").split(/^##\s/m).find((s) => /MẶT API MỚI/i.test(s.split("\n")[0]));
  return sec ? [...sec.matchAll(/^\|\s*`([a-z][a-z0-9_]+)`\s*\|/gm)].map((m) => m[1]) : [];
}
const actions = [...new Set([...apiActions(F04), ...apiActions(F05)])];
const js = readFileSync(JS_ROUTE, "utf8");
const java = readFileSync(JAVA_CTRL, "utf8");
const reg = readFileSync(REGISTRY, "utf8");
check("hồ sơ đề xuất >= 10 action", actions.length >= 10, `${actions.length} action`);
const existed = actions.filter((a) => js.includes(`action === "${a}"`) || java.includes(`case "${a}"`) || reg.includes(`Map.entry("${a}"`));
check("mọi action đề xuất CHƯA tồn tại ở JS/Java/ma trận quyền", existed.length === 0, `đã có: [${existed}]`);

// ---- [6] hồ sơ audit tài chính còn đúng (23 action, 14 bảng) ----
console.log("\n[6] HỒ SƠ F-03 — khẳng định còn khớp mã nguồn");
if (existsSync(F03)) {
  const doc = readFileSync(F03, "utf8");
  const actionRows = [...doc.matchAll(/^\|\s*\d+\s*\|\s*`([a-z_]+)`\s*\|\s*:(\d+)\s*\|\s*:(\d+)\s*\|/gm)];
  const jsLines = js.split(/\r?\n/);
  const javaLines = java.split(/\r?\n/);
  const stale = actionRows.filter(([, a, jl, vl]) =>
    !(jsLines[Number(jl) - 1] ?? "").includes(`action === "${a}"`) || !(javaLines[Number(vl) - 1] ?? "").includes(`case "${a}"`));
  check("23 dòng action của F-03 đúng dòng ở cả 2 đường ghi", actionRows.length >= 20 && stale.length === 0,
    `đọc ${actionRows.length} dòng · lệch ${stale.length}`);
  const financeTables = [...doc.matchAll(/^\|\s*`(\w+)`\s*\|\s*\*\*(\d+)\*\*\s*\|/gm)];
  const gone = financeTables.filter(([, t]) => !live.has(t));
  check("mọi bảng nêu trong F-03 còn tồn tại", financeTables.length >= 14 && gone.length === 0,
    `đọc ${financeTables.length} bảng · mất ${gone.length}`);
} else {
  check("hồ sơ F-03 tồn tại", false, F03);
}

// ---- kết luận ----
console.log(`\n═══ KẾT LUẬN: ${failed === 0 ? "ĐẠT" : "HỎNG"} — ${failed} cổng hỏng · ${warned} cảnh báo DRIFT số dòng ═══`);
process.exit(failed === 0 ? 0 : 1);
