// In một khoảng dòng HOẶC một đoạn quanh một mẫu — để tránh việc PowerShell làm hỏng `node -e` có regex/ngoặc kép.
//
// Chạy:
//   node tools/show-js-lines.mjs <tệp> <từDòng> <đếnDòng>
//   node tools/show-js-lines.mjs <tệp> --grep "<mẫu regex>" [--around N] [--max M]
//   node tools/show-js-lines.mjs <tệp> --slice "<mẫu regex>" [--before N] [--after N]   (trích theo KÝ TỰ)
import { readFileSync } from "node:fs";

const [, , file, a, b, ...rest] = process.argv;
if (!file || !a) {
  console.error("Dùng: node tools/show-js-lines.mjs <tệp> <từDòng> <đếnDòng>");
  console.error("  hoặc: node tools/show-js-lines.mjs <tệp> --grep \"<regex>\" [--around N] [--max M]");
  console.error("  hoặc: node tools/show-js-lines.mjs <tệp> --slice \"<regex>\" [--before N] [--after N]");
  process.exit(2);
}

const lines = readFileSync(file, "utf8").split(/\r?\n/);

if (a === "--slice") {
  // Dùng khi một dòng dài hàng nghìn ký tự (file này có nhiều handler nằm gọn trên 1 dòng) —
  // in một cửa sổ ký tự quanh mẫu, kèm số dòng để còn truy vết.
  const pattern = b;
  if (!pattern) { console.error("Thiếu mẫu regex."); process.exit(2); }
  const get = (flag, dflt) => { const i = rest.indexOf(flag); return i >= 0 ? Number(rest[i + 1]) : dflt; };
  const before = get("--before", 300);
  const after = get("--after", 600);
  const text = readFileSync(file, "utf8");
  const re = new RegExp(pattern, "g");
  const hits = [...text.matchAll(re)];
  console.log(`${hits.length} vị trí khớp "${pattern}" trong ${file}\n`);
  for (const h of hits.slice(0, 5)) {
    const lineNo = text.slice(0, h.index).split(/\r?\n/).length;
    const from = Math.max(0, h.index - before);
    const to = Math.min(text.length, h.index + h[0].length + after);
    console.log(`──── khớp ở dòng ${lineNo}, ký tự ${h.index} ────`);
    console.log(text.slice(from, to));
    console.log("");
  }
} else if (a === "--grep") {
  const pattern = b;
  if (!pattern) { console.error("Thiếu mẫu regex."); process.exit(2); }
  const get = (flag, dflt) => {
    const i = rest.indexOf(flag);
    return i >= 0 ? Number(rest[i + 1]) : dflt;
  };
  const around = get("--around", 2);
  const max = get("--max", 20);
  let re;
  try { re = new RegExp(pattern); } catch (e) { console.error("Regex không hợp lệ: " + e.message); process.exit(2); }
  // KHÔNG dùng lastIndex của regex dùng chung — mỗi lần `test` là một lần độc lập.
  const hits = [];
  for (let i = 0; i < lines.length; i++) if (re.test(lines[i])) hits.push(i);
  console.log(`${hits.length} dòng khớp trong ${file} (in ${Math.min(hits.length, max)} nhóm đầu)\n`);
  for (const h of hits.slice(0, max)) {
    const from = Math.max(0, h - around), to = Math.min(lines.length - 1, h + around);
    console.log(`──── khớp ở dòng ${h + 1} ────`);
    for (let i = from; i <= to; i++) console.log(`${i + 1}: ${lines[i]}`);
    console.log("");
  }
} else {
  const from = Number(a), to = b === undefined ? from : Number(b);
  if (!Number.isFinite(from) || !Number.isFinite(to)) { console.error("Số dòng không hợp lệ."); process.exit(2); }
  for (let i = Math.max(1, from); i <= Math.min(lines.length, to); i++) console.log(`${i}: ${lines[i - 1]}`);
}
