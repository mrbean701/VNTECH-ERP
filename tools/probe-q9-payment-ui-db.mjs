// Q9 — KIỂM CHỨNG phía UI: con số "Quá hạn" mà màn Thanh toán hiển thị phải khớp CSDL sau khi chỉnh.
// UI tính: Σ max(0, planned_amount − paid_amount) trên các mốc status='overdue' (TASK-082 đã bỏ hằng số giả).
import { execFileSync } from "node:child_process";

const BASE = process.argv[2] || "http://127.0.0.1:18081";
const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const q = (sql) => execFileSync(MYSQL, ["-uvntech", "-pvntech", "--default-character-set=utf8mb4", "-N", "-B", "vntech_erp", "-e", sql], { encoding: "utf8" }).trim();

const login = await fetch(`${BASE}/api/system`, {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ action: "login", username: "admin", password: "Admin123456@" }),
});
if (!login.ok) { console.error(`Đăng nhập lỗi HTTP ${login.status}`); process.exit(1); }
const cookie = (login.headers.getSetCookie?.() ?? [login.headers.get("set-cookie")]).filter(Boolean).map((c) => c.split(";")[0]).join("; ");
const boot = await (await fetch(`${BASE}/api/system`, { headers: { cookie } })).json();
const plans = boot?.data?.paymentPlans ?? [];
console.log(`API trả ${plans.length} mốc thanh toán`);
const overdueUi = plans.filter((p) => String(p.status) === "overdue").reduce((sum, p) => sum + Math.max(0, Number(p.plannedAmount || 0) - Number(p.paidAmount || 0)), 0);
const totalUi = plans.reduce((sum, p) => sum + Number(p.plannedAmount || 0), 0);
const overdueDb = Number(q("SELECT COALESCE(SUM(planned_amount-paid_amount),0) FROM payment_plans WHERE status='overdue';"));
const totalDb = Number(q("SELECT COALESCE(SUM(planned_amount),0) FROM payment_plans;"));
const contract = Number(q("SELECT COALESCE(SUM(contract_qty*unit_price),0) FROM project_boq_items WHERE project_id='PRJ_fdbfab20-bf1f-4ad5-8159-7dcc582140c3';"));
const fmt = (n) => n.toLocaleString("vi-VN") + " đ";
console.log(`  UI  quá hạn = ${fmt(overdueUi)} · tổng kế hoạch = ${fmt(totalUi)}`);
console.log(`  CSDL quá hạn = ${fmt(overdueDb)} · tổng kế hoạch = ${fmt(totalDb)} · hợp đồng = ${fmt(contract)}`);
const okOverdue = Math.round(overdueUi) === Math.round(overdueDb);
const okTotal = Math.round(totalUi) === Math.round(totalDb);
const okContract = Math.round(totalDb) === Math.round(contract);
console.log(`  ${okOverdue ? "ĐẠT " : "HỎNG"} quá hạn UI ↔ CSDL`);
console.log(`  ${okTotal ? "ĐẠT " : "HỎNG"} tổng kế hoạch UI ↔ CSDL`);
console.log(`  ${okContract ? "ĐẠT " : "HỎNG"} tổng kế hoạch = GIÁ TRỊ HỢP ĐỒNG (điều kiện "cần chỉnh" của Q9)`);
process.exit(okOverdue && okTotal && okContract ? 0 : 1);
