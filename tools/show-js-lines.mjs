// In một khoảng dòng HOẶC một đoạn quanh một mẫu — để tránh việc PowerShell làm hỏng `node -e` có regex/ngoặc kép.
//
// Chạy:
//   node tools/show-js-lines.mjs <tệp> <từDòng> <đếnDòng>
//   node tools/show-js-lines.mjs <tệp> --grep "<mẫu regex>" [--around N] [--max M]
import { readFileSync } from "node:fs";

const [, , file, a, b, ...rest] = process.argv;
if (!file || !a) {
  console.error("Dùng: node tools/show-js-lines.mjs <tệp> <từDòng> <đếnDòng>");
  console.error("  hoặc: node tools/show-js-lines.mjs <tệp> --grep \"<regex>\" [--around N] [--max M]");
  process.exit(2);
}

const lines = readFileSync(file, "utf8").split(/\r?\n/);

if (a === "--grep") {
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
