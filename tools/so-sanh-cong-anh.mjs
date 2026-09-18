// So sánh HAI lần chạy cổng ảnh bằng "chữ ký lệch" (màn × kích thước), KHÔNG so số điểm ảnh thô.
// Lý do (bài học KP #1): cổng ảnh có ghi chú nhiễu "(lần đầu N px)" đổi giữa các lần chạy ⇒ nếu so
// nguyên văn thì kết luận đổi oan. Ở đây chỉ so TẬP ẢNH LỆCH.
//
//   node tools/so-sanh-cong-anh.mjs <log-truoc> <log-sau>
import { readFileSync } from "node:fs";

function parse(file) {
  // Log có thể do PowerShell ghi bằng `*>` ⇒ UTF-16LE (BOM FF FE). Tự nhận dạng, không đoán.
  const raw = readFileSync(file);
  const isUtf16 = raw.length > 1 && ((raw[0] === 0xff && raw[1] === 0xfe) || (raw[1] === 0x00 && raw[0] !== 0x00));
  const text = isUtf16 ? new TextDecoder("utf-16le").decode(raw) : raw.toString("utf8");
  const map = new Map();
  let screen = null;
  for (const line of text.split(/\r?\n/)) {
    const head = line.match(/▸\s+(\S+)/);
    if (head) { screen = head[1]; map.set(screen, new Set()); continue; }
    const row = line.match(/(❌|✅)\s+(\S+)/);
    if (row && screen && row[1] === "❌") map.get(screen).add(row[2]);
  }
  return map;
}

const [fileA, fileB] = process.argv.slice(2);
if (!fileA || !fileB) { console.error("Dùng: node tools/so-sanh-cong-anh.mjs <log-truoc> <log-sau>"); process.exit(2); }
const A = parse(fileA), B = parse(fileB);
const count = (m) => [...m.values()].reduce((s, set) => s + set.size, 0);
console.log(`TRƯỚC: ${count(A)} ảnh lệch / ${A.size} màn   (${fileA})`);
console.log(`SAU  : ${count(B)} ảnh lệch / ${B.size} màn   (${fileB})`);

const screens = [...new Set([...A.keys(), ...B.keys()])].sort();
let worse = 0, better = 0;
for (const s of screens) {
  const a = A.get(s) || new Set(), b = B.get(s) || new Set();
  const added = [...b].filter((v) => !a.has(v));
  const removed = [...a].filter((v) => !b.has(v));
  if (!added.length && !removed.length) continue;
  if (added.length) worse += added.length;
  if (removed.length) better += removed.length;
  console.log(`  • ${s}: +${added.length} ảnh lệch mới [${added.join(", ") || "—"}] · -${removed.length} hết lệch [${removed.join(", ") || "—"}]`);
}
if (!worse && !better) console.log("\nKẾT LUẬN: TẬP ẢNH LỆCH KHÔNG ĐỔI ⇒ thay đổi KHÔNG gây lệch hình mới nào.");
else console.log(`\nKẾT LUẬN: có thay đổi — +${worse} ảnh lệch mới · -${better} ảnh hết lệch.`);
process.exit(worse ? 1 : 0);
