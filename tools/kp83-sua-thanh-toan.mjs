// [KP #83] SỬA DỮ LIỆU TEST PRJ-DEMO-01: `contract_payments` 1.500.000.000 → 433.872.222 đ (người dùng đã XÁC NHẬN 18/09).
// Đề xuất được duyệt: khớp ĐÚNG 2 mốc kế hoạch đang có ⇒ Tạm ứng 20% = 134.650.000 + Nghiệm thu GĐ1 = 299.222.222.
// An toàn: chạy khô mặc định · --apply mới ghi · ghi file hoàn tác · ĐỌC LẠI bắt buộc · kiểm ≤ giá trị hợp đồng.
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const APPLY = process.argv.includes("--apply");
const q = (sql) => execFileSync(MYSQL, ["-uvntech", "-pvntech", "--default-character-set=utf8mb4", "-N", "-B", "vntech_erp", "-e", sql], { encoding: "utf8" }).trim();
const rows = (sql) => q(sql).split(/\r?\n/).filter(Boolean).map((l) => l.split("\t"));
const vn = (n) => Number(n).toLocaleString("vi-VN");

const proj = q("SELECT id FROM projects WHERE code='PRJ-DEMO-01';");
const contract = Number(q(`SELECT COALESCE(SUM(contract_qty*unit_price),0) FROM project_boq_items WHERE project_id='${proj}';`));
const cols = rows("SELECT column_name FROM information_schema.columns WHERE table_schema='vntech_erp' AND table_name='contract_payments' ORDER BY ordinal_position;").map((r) => r[0]);
console.log("cột contract_payments: " + cols.join(", "));
const labelCol = ["milestone", "title", "name", "description", "note", "content", "phase"].find((c) => cols.includes(c));
const dateCol = ["paid_at", "payment_date", "paid_date", "created_at"].find((c) => cols.includes(c));

console.log(`\nhợp đồng (BOQ) = ${vn(contract)} đ`);
console.log("=== TRƯỚC ===");
const before = rows(`SELECT id, amount${labelCol ? `, \`${labelCol}\`` : ""}${dateCol ? `, \`${dateCol}\`` : ""} FROM contract_payments WHERE project_id='${proj}' ORDER BY amount DESC;`);
before.forEach((r) => console.log(`  ${r[0]} · ${vn(r[1])} đ${r[2] ? " · " + r[2] : ""}${r[3] ? " · " + r[3] : ""}`));
const totalBefore = before.reduce((s, r) => s + Number(r[1]), 0);
console.log(`  TỔNG = ${vn(totalBefore)} đ (hợp đồng ${vn(contract)} đ ⇒ ${totalBefore > contract ? "VƯỢT" : "trong hạn"})`);

if (before.length !== 2) { console.error(`\n✖ Cần ĐÚNG 2 dòng để gán 2 mốc, thực tế ${before.length} ⇒ DỪNG (không tự đoán).`); process.exit(1); }
const TARGET = [299222222, 134650000];   // dòng lớn (Nghiệm thu GĐ1) + dòng nhỏ (Tạm ứng 20%) — khớp 2 mốc kế hoạch

if (!APPLY) {
  console.log(`\n(CHẠY KHÔ) sẽ đặt: ${before[0][0]} → ${vn(TARGET[0])} đ · ${before[1][0]} → ${vn(TARGET[1])} đ`);
  console.log(`  tổng sau = ${vn(TARGET[0] + TARGET[1])} đ ≤ ${vn(contract)} đ ⇒ HỢP LỆ`);
  process.exit(0);
}
for (let i = 0; i < 2; i++) q(`UPDATE contract_payments SET amount=${TARGET[i]} WHERE id='${before[i][0]}';`);
writeFileSync("docs/agent-progress/TASK-092-kp83-rollback.sql",
  `-- KP #83 ROLLBACK (18/09) — hoàn tác sửa contract_payments PRJ-DEMO-01 (người dùng đã duyệt sửa dữ liệu test).\n` +
  before.map((r) => `UPDATE contract_payments SET amount=${r[1]} WHERE id='${r[0]}'; -- ${r[2] || ""}`).join("\n") + "\n");

console.log("\n=== SAU (ĐỌC LẠI) ===");
const after = rows(`SELECT id, amount FROM contract_payments WHERE project_id='${proj}' ORDER BY amount DESC;`);
after.forEach((r) => console.log(`  ${r[0]} · ${vn(r[1])} đ`));
const totalAfter = after.reduce((s, r) => s + Number(r[1]), 0);
console.log(`  TỔNG = ${vn(totalAfter)} đ · hợp đồng ${vn(contract)} đ ⇒ ${totalAfter <= contract ? "ĐẠT (không vượt hợp đồng)" : "VẪN VƯỢT"}`);
console.log("  file hoàn tác: docs/agent-progress/TASK-092-kp83-rollback.sql");
