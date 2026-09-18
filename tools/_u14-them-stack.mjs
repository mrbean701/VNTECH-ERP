// [U-14] THÍ NGHIỆM QUYẾT ĐỊNH: thay `isBalanced` (đếm) bằng `stackBalanced` (NGĂN XẾP TÊN THẺ).
// Vì sao: bảng soi từng con cho thấy con 1 `mở=2/đóng=1`, con 3 `mở=4/đóng=5` — tức **PHẦN TỬ bị cắt đôi**;
// phép ĐẾM không bắt được loại lỗi này (thẻ lồng tự triệt tiêu), còn **ngăn xếp RỖNG** thì bắt được.
// Mỏ neo + tự chối. Tự kiểm PARSER của công cụ vẫn là chốt an toàn cuối cùng.
import { readFileSync, writeFileSync } from "node:fs";
const FILE = "tools/chuyen-drawer-sang-edm.mjs";
const APPLY = process.argv.includes("--apply");
let text = readFileSync(FILE, "utf8");
const failures = [];
const patch = (label, find, repl) => {
  const n = text.split(find).length - 1;
  if (n !== 1) { failures.push(`[${label}] khớp ${n} lần (cần 1) ⇒ DỪNG`); return; }
  text = text.replace(find, repl);
};

patch("thêm stackBalanced",
  "function splitChildren(text) {",
  `// Ngăn xếp phần tử: duyệt các thẻ theo thứ tự, đẩy tên thẻ khi MỞ, lấy ra khi ĐÓNG (bỏ qua thẻ tự đóng).
// Trả về true nếu kết thúc mà NGĂN XẾP RỖNG ⇒ đoạn đó là "giữa hai phần tử hoàn chỉnh" ⇒ mới được cắt.
const stackBalanced = (t) => {
  const stack = [];
  for (const m of t.matchAll(/<(\\/?)([a-zA-Z][\\w.:-]*)([^>]*)>/g)) {
    const isClose = m[1] === "/";
    const selfClose = /\\/\\s*$/.test(m[3]);
    if (isClose) { if (stack[stack.length - 1] === m[2]) stack.pop(); else return false; }
    else if (!selfClose) stack.push(m[2]);
  }
  return stack.length === 0;
};

function splitChildren(text) {`);

patch("dùng stackBalanced để cắt",
  "&& buf && isBalanced(buf)) {",
  "&& buf && stackBalanced(buf)) {");

if (failures.length) { console.error("KHÔNG GHI — có điều kiện không đạt:"); for (const f of failures) console.error("  ✖ " + f); process.exit(1); }
if (!APPLY) { console.log("CHẠY KHÔ: 2 mỏ neo khớp đủ ⇒ sẵn sàng (thêm --apply)."); process.exit(0); }
writeFileSync(FILE, text);
console.log("ĐÃ GHI: " + FILE + " (cắt theo NGĂN XẾP phần tử)");
