// Q9 — CHỈNH `payment_plans` QUÁ HẠN (người dùng quyết: "cần chỉnh").
//
// TIỀN ĐỀ ĐO ĐƯỢC: 3 mốc thanh toán của PRJ-DEMO-01 (tạo 14/09 16:13:10 — một lô seed) cộng lại
// **2.300.000.000** trong khi **giá trị hợp đồng = 673.250.000** (đo tươi: `SELECT SUM(contract_qty*unit_price)`
// trên `project_boq_items` của dự án = 673.250.000 · 8 dòng) ⇒ lịch thanh toán **gấp 3,42 lần** hợp đồng.
//
// CÔNG THỨC CHỈNH (suy ra, có ghi rõ — không tự đặt số tròn):
//   • Mốc "Tạm ứng 20%" giữ đúng **20%** giá trị hợp đồng (đúng như TÊN mốc đang có);
//   • 80% còn lại chia cho 2 mốc sau theo ĐÚNG TỶ LỆ mà lô seed đã dùng (1.000.000.000 : 800.000.000 = 5:4);
//   • Tổng sau chỉnh = ĐÚNG bằng giá trị hợp đồng.
//
// AN TOÀN: chạy khô mặc định · `--apply` mới ghi · ghi file HOÀN TÁC trước khi sửa · ĐỌC LẠI xác nhận.
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const APPLY = process.argv.includes("--apply");
const PROJECT = "PRJ_fdbfab20-bf1f-4ad5-8159-7dcc582140c3";
const q = (sql) => execFileSync(MYSQL, ["-uvntech", "-pvntech", "--default-character-set=utf8mb4", "-N", "-B", "vntech_erp", "-e", sql], { encoding: "utf8" }).trim();
const rows = (sql) => q(sql).split(/\r?\n/).filter(Boolean).map((l) => l.split("\t"));

console.log("=== 1. TIỀN ĐỀ ===");
const contract = Number(q(`SELECT COALESCE(SUM(contract_qty*unit_price),0) FROM project_boq_items WHERE project_id='${PROJECT}';`));
const plans = rows(`SELECT id, plan_no, milestone, planned_amount FROM payment_plans WHERE project_id='${PROJECT}' ORDER BY planned_date;`);
const total = plans.reduce((s, r) => s + Number(r[3]), 0);
console.log(`  giá trị hợp đồng (BOQ) = ${contract.toLocaleString("vi-VN")} đ`);
console.log(`  tổng 3 mốc hiện tại     = ${total.toLocaleString("vi-VN")} đ  (${(total / contract).toFixed(2)}× hợp đồng)`);
for (const r of plans) console.log(`   • ${r[1]} · ${r[2]} = ${Number(r[3]).toLocaleString("vi-VN")} đ`);
if (plans.length !== 3) { console.error(`  ✖ Kỳ vọng 3 mốc, đo được ${plans.length} ⇒ DỪNG.`); process.exit(1); }
if (!contract) { console.error("  ✖ Không đọc được giá trị hợp đồng ⇒ DỪNG."); process.exit(1); }

// ── 2. Tính lịch MỚI ──────────────────────────────────────────────────────────────────────
const advance = Math.round(contract * 0.2);           // "Tạm ứng 20%"
const remaining = contract - advance;                 // 80%
const gd1 = Math.round((remaining * 5) / 9);          // tỷ lệ 5:4 của lô seed
const final = remaining - gd1;
const planFor = (milestone) => {
  if (/Tạm ứng/i.test(milestone)) return advance;
  if (/Nghiệm thu/i.test(milestone)) return gd1;
  return final;
};
console.log("\n=== 2. LỊCH MỚI (suy ra, tổng ĐÚNG bằng hợp đồng) ===");
let sum = 0;
const updates = plans.map((r) => { const amount = planFor(r[2]); sum += amount; return { id: r[0], plan_no: r[1], milestone: r[2], old: Number(r[3]), amount }; });
for (const u of updates) console.log(`   • ${u.plan_no} · ${u.milestone}: ${u.old.toLocaleString("vi-VN")} → ${u.amount.toLocaleString("vi-VN")} đ`);
console.log(`   tổng mới = ${sum.toLocaleString("vi-VN")} đ · hợp đồng = ${contract.toLocaleString("vi-VN")} đ · KHỚP: ${sum === contract}`);
if (sum !== contract) { console.error("  ✖ Tổng không khớp ⇒ DỪNG."); process.exit(1); }

if (!APPLY) { console.log("\nCHẠY KHÔ: chưa ghi gì. Thêm --apply để ghi."); process.exit(0); }

// ── 3. File HOÀN TÁC + ÁP DỤNG ────────────────────────────────────────────────────────────
const rollback = updates.map((u) => `UPDATE payment_plans SET planned_amount=${u.old} WHERE id='${u.id}'; -- ${u.plan_no} (${u.milestone})`).join("\n");
writeFileSync("docs/agent-progress/TASK-092-q9-rollback.sql",
  `-- Q9 ROLLBACK (18/09/2026) — hoàn tác chỉnh lịch thanh toán PRJ-DEMO-01 về số cũ.
-- Sinh tự động TRƯỚC khi ghi. Chạy trên CSDL nào thì hoàn tác CSDL đó.
${rollback}\n`);
console.log("\n=== 3. ĐÃ ghi file hoàn tác: docs/agent-progress/TASK-092-q9-rollback.sql ===");
for (const u of updates) q(`UPDATE payment_plans SET planned_amount=${u.amount} WHERE id='${u.id}';`);

// ── 4. ĐỌC LẠI ────────────────────────────────────────────────────────────────────────────
const after = rows(`SELECT plan_no, milestone, planned_amount, status FROM payment_plans WHERE project_id='${PROJECT}' ORDER BY planned_date;`);
const totalAfter = after.reduce((s, r) => s + Number(r[2]), 0);
console.log("\n=== 4. SAU (đọc lại) ===");
for (const r of after) console.log(`   • ${r[0]} · ${r[1]} = ${Number(r[2]).toLocaleString("vi-VN")} đ · ${r[3]}`);
console.log(`  tổng = ${totalAfter.toLocaleString("vi-VN")} đ · KHỚP hợp đồng: ${totalAfter === contract}`);
console.log(`  "Quá hạn" nay = ${after.filter((r) => r[3] === "overdue").reduce((s, r) => s + Number(r[2]), 0).toLocaleString("vi-VN")} đ (trước: 1.500.000.000 đ)`);
