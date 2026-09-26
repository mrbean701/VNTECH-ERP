// [PHASE 8 · D5 — tối thiểu] Gỡ khoá kiểm chứng B1: nâng `approved_qty` của 1 dòng phiếu ĐÃ DUYỆT lên mức còn dư
// để `issue_stock` có thể chạy (điều kiện dòng 110: issuedQty + qty <= requestedQty; và dòng 94 cần requestLine != null).
// An toàn: chạy khô mặc định · --apply mới ghi · ghi file hoàn tác theo ĐIỀU KIỆN · ĐỌC LẠI bắt buộc.
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const q = (sql) => execFileSync(MYSQL, ["-uvntech", "-pvntech", "--default-character-set=utf8mb4", "-N", "-B", "vntech_erp", "-e", sql], { encoding: "utf8" }).trim();
const rows = (sql) => q(sql).split(/\r?\n/).filter(Boolean).map((l) => l.split("\t"));
const APPLY = process.argv.includes("--apply");
const PROJ = "PRJ_fdbfab20-bf1f-4ad5-8159-7dcc582140c3";

console.log("=== các dòng phiếu ĐÃ DUYỆT của PRJ-DEMO-01 ===");
const lines = rows(`SELECT mri.id, mri.request_id, mri.material_id, COALESCE(mri.requested_qty,0), COALESCE(mri.approved_qty,0), COALESCE(mri.issued_qty,0) FROM material_request_items mri JOIN material_requests mr ON mr.id=mri.request_id WHERE mr.project_id='${PROJ}' AND mr.status='approved' ORDER BY mri.id LIMIT 5;`);
for (const l of lines) console.log(`  ${l[0]} · req=${l[3]} · appr=${l[4]} · issued=${l[5]}`);
if (!lines.length) { console.error("✖ Không có dòng phiếu nào ⇒ DỪNG."); process.exit(1); }
const [id, requestId, materialId, reqQty, apprQty, issuedQty] = lines[0];
const target = Math.max(Number(reqQty) || 0, Number(issuedQty) + 5);
console.log(`\nchọn dòng ${id} (vật tư ${materialId}) · đặt approved_qty = ${target} (issued=${issuedQty})`);

if (!APPLY) { console.log("(CHẠY KHÔ) thêm --apply để ghi."); process.exit(0); }
q(`UPDATE material_request_items SET approved_qty=${target} WHERE id='${id}';`);
const after = q(`SELECT COALESCE(approved_qty,0) FROM material_request_items WHERE id='${id}';`);
writeFileSync("docs/agent-progress/TASK-094-d5-rollback.sql",
  "-- D5 (tối thiểu) ROLLBACK (18/09) — hoàn tác nâng approved_qty cho dòng phiếu test.\n" +
  `UPDATE material_request_items SET approved_qty=${apprQty} WHERE id='${id}';\n`);
console.log(`SAU (đọc lại): approved_qty = ${after} · file hoàn tác: docs/agent-progress/TASK-094-d5-rollback.sql`);
console.log(`BỘ BA để gọi API: requestItemId=${id} · materialId=${materialId} · requestId=${requestId}`);
