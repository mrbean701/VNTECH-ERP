// Đo HIỆN TRẠNG workflow phê duyệt cho 3 nhóm quy trình: MUA HÀNG · CẤP PHÁT · XUẤT–NHẬP KHO.
// Mục đích: biết chính xác nhóm nào ĐÃ có phê duyệt, nhóm nào CHƯA, rồi mới đề xuất phương án.
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const q = (sql) => execFileSync(MYSQL, ["-uvntech", "-pvntech", "--default-character-set=utf8mb4", "-N", "-B", "vntech_erp", "-e", sql], { encoding: "utf8" }).trim();
const rows = (sql) => q(sql).split(/\r?\n/).filter(Boolean).map((l) => l.split("\t"));

console.log("=== 1. `approval_stage_catalog` (cấu hình bước duyệt) ===");
const stages = rows("SELECT stage_no, name, COALESCE(allowed_role_codes,''), COALESCE(approval_mode,''), active FROM approval_stage_catalog ORDER BY stage_no;");
for (const s of stages) console.log(`  bước ${s[0]} · ${s[1]} · vai trò=[${s[2]}] · mode=${s[3]} · active=${s[4]}`);
console.log(`  tổng ${stages.length} bước · có ` + q("SELECT COUNT(*) FROM approval_project_assignments") + " phân công Owner theo dự án");

console.log("\n=== 2. `approvals` là bảng DUYỆT THEO PHIẾU ĐỀ NGHỊ (không phải theo mọi thực thể) ===");
console.log("  cột: " + q("SELECT GROUP_CONCAT(column_name ORDER BY ordinal_position) FROM information_schema.columns WHERE table_schema='vntech_erp' AND table_name='approvals'"));
console.log("  số dòng: " + q("SELECT COUNT(*) FROM approvals") + " · theo trạng thái: " + q("SELECT GROUP_CONCAT(CONCAT(status,'=',n)) FROM (SELECT status, COUNT(*) n FROM approvals GROUP BY status) t"));
console.log("\n=== 2b. Bảng workflow/duyệt khác và mức sử dụng THẬT ===");
console.log(q("SELECT CONCAT(table_name) FROM information_schema.tables WHERE table_schema='vntech_erp' AND (table_name LIKE '%approv%' OR table_name LIKE '%workflow%') ORDER BY table_name").split(/\r?\n/).map((t) => `  ${t.padEnd(28)} ${q(`SELECT COUNT(*) FROM \`${t}\``)} dòng`).join("\n"));

console.log("\n=== 3. Action LIÊN QUAN PHÊ DUYỆT trong Java (ActionRbacRegistry) ===");
const reg = readFileSync("java-backend/application/src/main/java/com/vntech/erp/application/rbac/ActionRbacRegistry.java", "utf8");
const entries = [...reg.matchAll(/Map\.entry\(\s*"([a-z_0-9]+)"\s*,\s*"([A-Za-z]+)"\s*\)/g)].map((m) => [m[1], m[2]]);
for (const [a, cap] of entries.filter(([a]) => /approve|decide|reject|confirm|cancel/.test(a))) console.log(`  ${a.padEnd(34)} capability=${cap}`);

console.log("\n=== 4. Action của 3 nhóm quy trình (mua hàng · cấp phát · xuất–nhập) ===");
const groups = {
  "MUA HÀNG": /^(create_request|update_request|decide_approval|create_po|save_po|import_po|merge_po)/,
  "CẤP PHÁT": /^(issue_stock|allocate|save_allocation|create_issue|approve_issue)/,
  "XUẤT–NHẬP KHO": /^(receive_goods|confirm_delivery|create_transfer_order|create_central_return|return_stock|create_stock_count|save_material_norm)/,
};
for (const [label, re] of Object.entries(groups)) {
  console.log(`  [${label}]`);
  for (const [a, cap] of entries.filter(([a]) => re.test(a))) console.log(`     ${a.padEnd(30)} capability=${cap}`);
}

console.log("\n=== 5. JAVA có ghi `approvals` cho PO / xuất / nhập không? ===");
const hits = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!name.endsWith(".java")) continue;
    const text = readFileSync(p, "utf8");
    if (/approvals?\b/i.test(text) && /insertApproval|saveApproval|approvalStore|approval_stage/i.test(text)) hits.push(p.replace(process.cwd() + "\\", ""));
  }
};
walk("java-backend");
for (const h of hits) console.log("  " + h);

console.log("\n=== 6. JS: các action TẠO/GHI duyệt ===");
const js = readFileSync("scripts/system-route.mjs", "utf8");
const jsApprovals = [...js.matchAll(/INSERT INTO approvals/gi)].length;
console.log(`  số câu INSERT INTO approvals trong JS: ${jsApprovals}`);
for (const m of js.matchAll(/if \(action === "(decide_approval|save_po|create_po|issue_stock|receive_goods|confirm_delivery)"\)/g)) console.log(`  có nhánh action: ${m[1]}`);
