// [Q10-fix] Người dùng quyết: "dữ liệu để test thì cứ sửa cho đúng" ⇒ SỬA 4 dòng `materials.system` lệch về đúng hệ theo mã nhóm.
// Đồng thời ĐO dữ liệu thanh toán của PRJ-DEMO-01 (KP #83: 1,5 tỷ > hợp đồng 673.250.000) để sửa tiếp.
// AN TOÀN: chạy khô mặc định · `--apply` mới ghi · ghi file hoàn tác · ĐỌC LẠI xác nhận.
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const APPLY = process.argv.includes("--apply");
const q = (sql) => execFileSync(MYSQL, ["-uvntech", "-pvntech", "--default-character-set=utf8mb4", "-N", "-B", "vntech_erp", "-e", sql], { encoding: "utf8" }).trim();
const rows = (sql) => q(sql).split(/\r?\n/).filter(Boolean).map((l) => l.split("\t"));

// ── PHẦN 1: 4 dòng materials.system lệch (đo bằng probe-q10 có ĐỐI CHỨNG DƯƠNG 7/7) ──────────
const FIX = [
  { code: "CTN-ONG-NHUA-002", want: "CTN" },
  { code: "CTN-VAN-001", want: "CTN" },
  { code: "DIEN-DAY-CAD-001", want: "DIEN" },
  { code: "DIEN-ONG-LUON-001", want: "DIEN" },
];
console.log("=== 1. TRƯỚC (materials.system) ===");
const before = rows(`SELECT code, \`system\` FROM materials WHERE code IN (${FIX.map((f) => `'${f.code}'`).join(",")}) ORDER BY code;`);
for (const [code, sys] of before) console.log(`  ${code.padEnd(20)} system=${sys}`);

if (!APPLY) { console.log("\n(CHẠY KHÔ) — thêm --apply để ghi phần 1."); }
else {
  for (const f of FIX) q(`UPDATE materials SET \`system\`='${f.want}', updated_at=NOW() WHERE code='${f.code}';`);
  const rollback = before.map(([code, sys]) => `UPDATE materials SET \`system\`='${sys}' WHERE code='${code}'; -- ${code}`).join("\n");
  writeFileSync("docs/agent-progress/TASK-092-q10-rollback.sql", `-- Q10 ROLLBACK (18/09) — hoàn tác sửa materials.system 4 dòng (người dùng: dữ liệu test thì sửa cho đúng).\n${rollback}\n`);
  console.log("\n=== 2. SAU (đọc lại) ===");
  for (const [code, sys] of rows(`SELECT code, \`system\` FROM materials WHERE code IN (${FIX.map((f) => `'${f.code}'`).join(",")}) ORDER BY code;`)) console.log(`  ${code.padEnd(20)} system=${sys}`);
  console.log("  file hoàn tác: docs/agent-progress/TASK-092-q10-rollback.sql");
}

// ── PHẦN 2: ĐO dữ liệu thanh toán PRJ-DEMO-01 (KP #83) ──────────────────────────────────────
console.log("\n=== 3. DỮ LIỆU THANH TOÁN PRJ-DEMO-01 (để sửa cho đúng) ===");
const proj = q("SELECT id FROM projects WHERE code='PRJ-DEMO-01';");
const boq = q(`SELECT COALESCE(SUM(contract_qty*unit_price),0) FROM project_boq_items WHERE project_id='${proj}';`);
console.log(`  giá trị hợp đồng (BOQ) = ${Number(boq).toLocaleString("vi-VN")} đ`);
const tables = rows("SELECT table_name FROM information_schema.tables WHERE table_schema='vntech_erp' AND (table_name LIKE '%payment%' OR table_name LIKE '%capital%' OR table_name LIKE '%recovery%') ORDER BY table_name;").map((r) => r[0]);
for (const t of tables) {
  const n = q(`SELECT COUNT(*) FROM \`${t}\``);
  if (n === "0") { console.log(`  ${t.padEnd(28)} 0 dòng`); continue; }
  const cols = rows(`SELECT column_name FROM information_schema.columns WHERE table_schema='vntech_erp' AND table_name='${t}' AND table_name='${t}';`).map((r) => r[0]);
  const amountCol = ["paid_amount", "amount", "invoice_value", "approved_value", "paid_value", "planned_amount"].find((c) => cols.includes(c));
  const projCol = ["project_id", "project_code"].find((c) => cols.includes(c));
  const sum = amountCol ? q(`SELECT COALESCE(SUM(\`${amountCol}\`),0) FROM \`${t}\`${projCol && projCol === "project_id" ? ` WHERE project_id='${proj}'` : ""}`) : "?";
  console.log(`  ${t.padEnd(28)} ${n} dòng · cột tiền=${amountCol || "?"} · tổng=${amountCol ? Number(sum).toLocaleString("vi-VN") + " đ" : "?"}`);
}
