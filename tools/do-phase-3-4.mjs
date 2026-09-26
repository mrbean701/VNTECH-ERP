// ĐO PHASE 3 (CÔNG VIỆC) + PHASE 4 (QUẢN LÝ DỰ ÁN): liệt kê từng mục + TT trong lộ trình,
// kèm ĐỐI CHIẾU THỰC TẾ (bảng/màn hình có tồn tại không) để trả lời "đã làm đến đâu" — không suy diễn.
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const q = (sql) => execFileSync(MYSQL, ["-uvntech", "-pvntech", "--default-character-set=utf8mb4", "-N", "-B", "vntech_erp", "-e", sql], { encoding: "utf8" }).trim();

const lines = readFileSync("docs/25_TODO_ROADMAP.md", "utf8").split("\n");
const phases = [];
lines.forEach((l, i) => { if (/^#\s*PHASE/i.test(l)) phases.push({ title: l.replace(/^#\s*/, "").trim(), line: i }); });
for (const want of [/PHASE\s*3/i, /PHASE\s*4/i]) {
  const k = phases.findIndex((p) => want.test(p.title));
  if (k < 0) continue;
  const from = phases[k].line, to = k + 1 < phases.length ? phases[k + 1].line : lines.length;
  const rows = lines.slice(from, to).filter((l) => /^\|\s*`[A-Z]+-[0-9]+`/.test(l));
  console.log(`\n=== ${phases[k].title} — ${rows.length} mục ===`);
  for (const l of rows) {
    const c = l.split("|").map((x) => x.trim());
    console.log(`  ${c[1].padEnd(8)} TT=${(c[c.length - 1] || "").replace(/\*\*/g, "").padEnd(20)} ${(c[3] || "").slice(0, 88)}`);
  }
  console.log(`  ⇒ DONE: ${rows.filter((l) => /\|\s*\*{0,2}DONE/i.test(l)).length}/${rows.length}`);
}

console.log("\n=== ĐỐI CHIẾU THỰC TẾ (số dòng bảng liên quan) ===");
const tables = [["công việc", "ops_tasks"], ["định kỳ", "ops_task_recurrences"], ["dự án", "projects"], ["thành viên dự án", "project_members"], ["BOQ", "project_boq_items"], ["khối lượng thi công", "construction_volume_entries"], ["nhật ký thi công", "construction_daily_logs"], ["mốc tiến độ", "project_milestones"], ["cột mốc thu hồi", "capital_recovery_records"]];
for (const [label, t] of tables) {
  try { console.log(`  ${label.padEnd(22)} ${t.padEnd(30)} ${q(`SELECT COUNT(*) FROM \`${t}\``)} dòng`); }
  catch { console.log(`  ${label.padEnd(22)} ${t.padEnd(30)} (không có bảng)`); }
}
