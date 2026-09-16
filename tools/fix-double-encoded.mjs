// Khôi phục tệp bị mã hoá hai lớp.
// Nguyên nhân: `Get-Content -Raw` của Windows PowerShell đọc tệp UTF-8 bằng bảng mã ANSI
// (cp1252), rồi `Set-Content -Encoding UTF8` ghi chuỗi kết quả trở lại dạng UTF-8
// ⇒ mỗi ký tự tiếng Việt bị băm thành 2-3 ký tự rác.
// Cách sửa: đọc tệp hỏng bằng UTF-8 để lấy chuỗi S, rồi mã hoá S ngược về cp1252 để lấy
// lại đúng các byte gốc.
import { readFileSync, writeFileSync } from "node:fs";

const path = process.argv[2];
if (!path) { console.error("Cần đường dẫn tệp."); process.exit(1); }

// Bảng cp1252 → Unicode cho vùng 0x80–0x9F (các byte còn lại ánh xạ 1-1 với Unicode).
const CP1252 = {
  0x80: 0x20AC, 0x82: 0x201A, 0x83: 0x0192, 0x84: 0x201E, 0x85: 0x2026, 0x86: 0x2020,
  0x87: 0x2021, 0x88: 0x02C6, 0x89: 0x2030, 0x8A: 0x0160, 0x8B: 0x2039, 0x8C: 0x0152,
  0x8E: 0x017D, 0x91: 0x2018, 0x92: 0x2019, 0x93: 0x201C, 0x94: 0x201D, 0x95: 0x2022,
  0x96: 0x2013, 0x97: 0x2014, 0x98: 0x02DC, 0x99: 0x2122, 0x9A: 0x0161, 0x9B: 0x203A,
  0x9C: 0x0153, 0x9E: 0x017E, 0x9F: 0x0178,
};
// Ánh xạ ngược Unicode → byte
const REVERSE = new Map();
for (let b = 0; b < 0x100; b++) {
  const u = CP1252[b] ?? b;
  if (!REVERSE.has(u)) REVERSE.set(u, b);
}

const text = readFileSync(path, "utf8").replace(/^\uFEFF/, "");
const bytes = [];
const unmapped = new Set();

for (const ch of text) {
  const code = ch.codePointAt(0);
  const byte = REVERSE.get(code);
  if (byte === undefined) {
    // Ký tự không thuộc cp1252 (ví dụ emoji) — giữ nguyên dạng UTF-8 để không mất dữ liệu.
    unmapped.add(ch);
    for (const b of Buffer.from(ch, "utf8")) bytes.push(b);
  } else {
    bytes.push(byte);
  }
}

const out = Buffer.from(bytes);
const decoded = out.toString("utf8");

// Kiểm tra: nếu khôi phục đúng thì không còn chuỗi rác đặc trưng và tiếng Việt đọc được.
const bad = /âœ|â€|Ã|á»|áº/.test(decoded);
const viet = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(decoded);

console.log(`tệp            : ${path}`);
console.log(`ký tự lạ       : ${unmapped.size ? [...unmapped].join(" ") : "(không)"}`);
console.log(`còn chuỗi rác  : ${bad ? "CÓ ❌" : "không ✅"}`);
console.log(`thấy tiếng Việt: ${viet ? "CÓ ✅" : "không ❌"}`);

if (bad) { console.error("Khôi phục KHÔNG thành công — giữ nguyên tệp gốc."); process.exit(1); }

writeFileSync(path, decoded, "utf8");
console.log("Đã ghi lại tệp (UTF-8, không BOM).");
