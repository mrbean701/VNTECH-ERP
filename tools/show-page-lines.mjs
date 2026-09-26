// Tra cứu nhanh một tệp lớn (app/page.tsx có dòng dài hàng trăm nghìn ký tự) mà không cần
// đọc cả tệp: in các dòng khớp mẫu, có cắt bớt độ dài.
//
// Vì sao cần công cụ này: `node -e` với biểu thức chính quy chứa dấu nháy kép bị PowerShell phá,
// còn `read` trên tệp này trả về dòng khổng lồ không đọc nổi. Công cụ này nhận tham số qua argv
// nên không dính vấn đề trích dẫn.
//
// Chạy:
//   node tools/show-page-lines.mjs <tệp> <mẫu-regex> [từ-dòng] [đến-dòng] [độ-dài-cắt]
import { readFileSync } from "node:fs";

const file = process.argv[2] || "app/page.tsx";
const pattern = process.argv[3];
const from = Number(process.argv[4] || 1);
const to = Number(process.argv[5] || 0);
const cut = Number(process.argv[6] || 200);

if (!pattern) {
  console.error("Thiếu mẫu regex. Ví dụ: node tools/show-page-lines.mjs app/page.tsx \"approvals\\\\?\\\\.map\"");
  process.exit(1);
}

const lines = readFileSync(file, "utf8").split(/\r?\n/);
const re = new RegExp(pattern);
const end = to > 0 ? Math.min(to, lines.length) : lines.length;

let hits = 0;
for (let i = from - 1; i < end; i++) {
  if (!re.test(lines[i])) continue;
  hits++;
  // Nếu mẫu khớp, in các đoạn khớp kèm chỉ số dòng; nếu dòng quá dài thì cắt.
  const s = lines[i];
  if (s.length <= cut) { console.log(`[${i + 1}] ${s.trim()}`); continue; }
  const matches = [...s.matchAll(new RegExp(pattern, "g"))];
  if (!matches.length) { console.log(`[${i + 1}] ${s.trim().slice(0, cut)}…`); continue; }
  console.log(`[${i + 1}] (dòng dài ${s.length} ký tự, ${matches.length} chỗ khớp)`);
  for (const m of matches.slice(0, 6)) {
    const a = Math.max(0, m.index - 60);
    console.log(`      …${s.slice(a, m.index + m[0].length + cut)}…`);
  }
}
console.log(`\n${hits} dòng khớp / ${end - from + 1} dòng đã quét (tệp ${lines.length} dòng)`);
