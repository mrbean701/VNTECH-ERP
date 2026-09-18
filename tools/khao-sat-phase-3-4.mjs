// KHẢO SÁT THẬT cho PHASE 3 (công việc) + PHASE 4 (dự án): liệt kê bảng có thật + số dòng,
// và các màn hình có thật trong `app/screens/` — để trả lời "đã có gì / còn thiếu gì" (không suy đoán §45).
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const q = (sql) => execFileSync(MYSQL, ["-uvntech", "-pvntech", "--default-character-set=utf8mb4", "-N", "-B", "vntech_erp", "-e", sql], { encoding: "utf8" }).trim();

console.log("=== BẢNG CÓ THẬT liên quan CÔNG VIỆC / DỰ ÁN ===");
const names = q(`SELECT table_name FROM information_schema.tables WHERE table_schema='vntech_erp' AND (
  table_name LIKE '%task%' OR table_name LIKE '%work_item%' OR table_name LIKE '%project%' OR table_name LIKE '%milestone%'
  OR table_name LIKE '%boq%' OR table_name LIKE '%construct%' OR table_name LIKE '%team%' OR table_name LIKE '%approval%')
  ORDER BY table_name`).split(/\r?\n/).filter(Boolean);
for (const t of names) {
  let n = "?";
  try { n = q(`SELECT COUNT(*) FROM \`${t}\``); } catch { n = "lỗi"; }
  console.log(`  ${t.padEnd(34)} ${String(n).padStart(6)} dòng`);
}
console.log(`  (tổng ${names.length} bảng)`);

console.log("\n=== MÀN HÌNH CÓ THẬT trong app/screens/ ===");
const screens = readdirSync("app/screens").filter((f) => f.endsWith(".tsx")).sort();
console.log("  " + screens.join(" · "));
console.log(`  (${screens.length} màn)`);
