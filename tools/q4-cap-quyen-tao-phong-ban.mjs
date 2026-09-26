// Q4 — CẤP `can_create` CHO PHÒNG BAN TRÊN MODULE NGHIỆP VỤ (người dùng quyết: "cấp cho phòng ban").
//
// QUY TẮC (suy ra từ MẪU ĐANG CHẠY, không tự đặt): 42 dòng đã có `can_create=1` đều là
// "module của chính phòng đó" (KH→dept_plan_* · DA→dept_project_* · TCKT→dept_finance_* · HCPC→dept_legal_*)
// cộng vài module liên thông (KH→purchasing/supplier_catalog · DA→requests · BCH→receiving/warehouse_receipt).
// ⇒ Cấp `can_create=1` cho MỌI dòng đang `can_use=1` trên **module nghiệp vụ**,
//   LOẠI TRỪ 4 module KHÔNG phải nghiệp vụ / đã có quyền riêng:
//     • `dashboard`   — màn xem tổng quan
//     • `reports`     — màn báo cáo
//     • `approvals`   — đã điều khiển bằng `can_approve` (186 dòng)
//     • `material_catalog` — dữ liệu gốc; luồng nhập/sửa yêu cầu **admin** (JS `import_material_catalog` chỉ admin)
//
// AN TOÀN: (1) chạy khô mặc định; (2) `--apply` mới ghi; (3) TRƯỚC khi ghi, dump ID các dòng bị ảnh hưởng
// ra `docs/agent-progress/TASK-092-q4-rollback.sql` để HOÀN TÁC được; (4) ĐỌC LẠI xác nhận sau khi ghi;
// (5) áp cho CẢ MySQL và SQLite (2 đường phục vụ).
import { execFileSync } from "node:child_process";
import { DatabaseSync } from "node:sqlite";
import { writeFileSync } from "node:fs";

const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const APPLY = process.argv.includes("--apply");
const EXCLUDED = ["dashboard", "reports", "approvals", "material_catalog"];
const WHERE = `can_use=1 AND can_create=0 AND module_key NOT IN (${EXCLUDED.map((m) => `'${m}'`).join(",")})`;
const q = (sql) => execFileSync(MYSQL, ["-uvntech", "-pvntech", "--default-character-set=utf8mb4", "-N", "-B", "vntech_erp", "-e", sql], { encoding: "utf8" }).trim();
const rows = (sql) => q(sql).split(/\r?\n/).filter(Boolean).map((l) => l.split("\t"));

console.log("=== 1. TRƯỚC (MySQL) ===");
console.log("  " + q("SELECT CONCAT('tổng=', COUNT(*), ' · can_use=1: ', SUM(can_use=1), ' · can_create=1: ', SUM(can_create=1)) FROM department_module_permissions"));
const affected = rows(`SELECT id FROM department_module_permissions WHERE ${WHERE};`);
console.log(`  dòng sẽ được cấp can_create: ${affected.length}`);
console.log(`  dòng GIỮ NGUYÊN can_create=0 (4 module loại trừ): ${q(`SELECT COUNT(*) FROM department_module_permissions WHERE can_use=1 AND can_create=0 AND module_key IN (${EXCLUDED.map((m) => `'${m}'`).join(",")})`)}`);

if (!APPLY) { console.log("\nCHẠY KHÔ: chưa ghi gì. Thêm --apply để ghi."); process.exit(0); }

// ── Ghi file HOÀN TÁC trước khi sửa ─────────────────────────────────────────────────────────
const ids = affected.map((r) => `'${r[0]}'`);
const rollback = `-- Q4 ROLLBACK (18/09/2026) — hoàn tác việc cấp can_create cho phòng ban.
-- Sinh tự động TRƯỚC khi ghi (${ids.length} dòng). Chạy file này để đưa can_create về 0 đúng các dòng đó.
-- MySQL:
UPDATE department_module_permissions SET can_create=0 WHERE id IN (${ids.slice(0, 12).join(",")}${ids.length > 12 ? ", …" : ""});
-- (danh sách đầy đủ ${ids.length} id ở dòng dưới, dạng 1 id/dòng để dễ dùng)
${ids.map((i) => `-- ${i.replace(/'/g, "")}`).join("\n")}

-- SQLite (đường Node): cùng danh sách id
UPDATE department_module_permissions SET can_create=0 WHERE id IN (${ids.slice(0, 12).join(",")}${ids.length > 12 ? ", …" : ""});
`;
writeFileSync("docs/agent-progress/TASK-092-q4-rollback.sql", rollback);
console.log(`\n=== 2. ĐÃ ghi file hoàn tác: docs/agent-progress/TASK-092-q4-rollback.sql (${ids.length} id) ===`);

// ── Áp dụng ───────────────────────────────────────────────────────────────────────────────
q(`UPDATE department_module_permissions SET can_create=1 WHERE ${WHERE};`);
console.log("  MySQL: đã UPDATE");
const db = new DatabaseSync(".local-data/warehouse.sqlite");
const sqliteBefore = db.prepare("SELECT COUNT(*) AS n FROM department_module_permissions WHERE can_use=1 AND can_create=0").get().n;
db.prepare(`UPDATE department_module_permissions SET can_create=1 WHERE can_use=1 AND can_create=0 AND module_key NOT IN (${EXCLUDED.map(() => "?").join(",")})`).run(...EXCLUDED);
db.close();
console.log(`  SQLite: đã UPDATE (can_create=0 & can_use=1 trước đó: ${sqliteBefore})`);

// ── ĐỌC LẠI xác nhận ──────────────────────────────────────────────────────────────────────
console.log("\n=== 3. SAU (MySQL, đọc lại) ===");
console.log("  " + q("SELECT CONCAT('tổng=', COUNT(*), ' · can_create=1: ', SUM(can_create=1), ' · can_create=0: ', SUM(can_create=0)) FROM department_module_permissions"));
console.log("  module còn can_create=0: " + q("SELECT GROUP_CONCAT(DISTINCT module_key ORDER BY module_key SEPARATOR ' · ') FROM department_module_permissions WHERE can_create=0").split(/\r?\n/).join(" "));
console.log("  can_create=1 theo đơn vị: " + q("SELECT CONCAT(o.code, '=', COUNT(*)) FROM department_module_permissions p JOIN organization_units o ON o.id=p.organization_unit_id WHERE p.can_create=1 GROUP BY o.code ORDER BY o.code").split(/\r?\n/).join(" · "));
const db2 = new DatabaseSync(".local-data/warehouse.sqlite");
console.log("  SQLite sau: " + JSON.stringify(db2.prepare("SELECT SUM(can_create=1) AS create1, SUM(can_create=0) AS create0 FROM department_module_permissions").get() ?? {}));
db2.close();
