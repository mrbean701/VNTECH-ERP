// ĐO TIẾN ĐỘ PHASE 1 (và các phase khác) từ `docs/25_TODO_ROADMAP.md` — báo cáo cho người dùng, KHÔNG suy diễn.
import { readFileSync } from "node:fs";
const lines = readFileSync("docs/25_TODO_ROADMAP.md", "utf8").split("\n");

const phases = [];
lines.forEach((l, i) => { if (/^#\s*PHASE/i.test(l)) phases.push({ title: l.replace(/^#\s*/, "").trim(), line: i }); });
console.log("=== CÁC PHASE trong lộ trình ===");
for (const p of phases) console.log(`  ${p.title} (dòng ${p.line + 1})`);

const isRow = (l) => /^\|\s*`[A-Z]+-[0-9]+`/.test(l);
const ttOf = (l) => { const c = l.split("|").map((x) => x.trim()).filter(Boolean); return c.length >= 4 ? c[c.length - 1].replace(/\*\*/g, "").replace(/~~/g, "") : ""; };
const doneToken = (tt) => /^DONE/i.test(tt);

for (let k = 0; k < phases.length; k++) {
  const from = phases[k].line;
  const to = k + 1 < phases.length ? phases[k + 1].line : lines.length;
  const rows = lines.slice(from, to).filter(isRow);
  const done = rows.filter((l) => doneToken(ttOf(l)));
  console.log(`\n=== ${phases[k].title}: ${done.length}/${rows.length} DONE ===`);
}

// Chi tiết PHASE 1
const p1 = phases.find((p) => /PHASE\s*1/i.test(p.title));
if (!p1) { console.log("\n✖ Không thấy mục PHASE 1 ⇒ DỪNG (không kết luận)."); process.exit(1); }
const idx = phases.indexOf(p1);
const from = p1.line, to = idx + 1 < phases.length ? phases[idx + 1].line : lines.length;
const rows1 = lines.slice(from, to).filter(isRow);
console.log(`\n=== CHI TIẾT ${p1.title} (${rows1.length} mục) ===`);
for (const l of rows1) {
  const c = l.split("|").map((x) => x.trim());
  const key = c[1], name = (c[3] || "").slice(0, 60), tt = ttOf(l);
  console.log(`  ${key.padEnd(8)} ${tt.padEnd(22)} ${name}`);
}
const undone = rows1.filter((l) => !doneToken(ttOf(l)));
console.log(`\nKẾT LUẬN PHASE 1: ${rows1.length - undone.length}/${rows1.length} DONE · CÒN ${undone.length} mục CHƯA XONG`);
