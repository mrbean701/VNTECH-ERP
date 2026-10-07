// SỬA LỖI DO TÔI GÂY RA 28/09/2026: trong khối CSS đã chèn có ghi chú bắt đầu bằng `//`
// ⇒ CSS KHÔNG có cú pháp `//` (chỉ có `/* … */`) ⇒ postcss lỗi ⇒ `gd-cycle` FAIL ⇒ `dist/` giữ
// bản CŨ ⇒ người dùng không thấy thay đổi. Sửa: đổi mọi dòng ghi chú `//` trong khối đó thành `/* … */`.
// ➕ Bài học rút ra: khi xác nhận "CSS đã vào bundle" phải khớp CHUỖI DUY NHẤT của khối mình vừa thêm,
//    ⛔ KHÔNG dùng chuỗi ngắn (`align-items:stretch` đã có sẵn ở `.variation-columns` L1248 ⇒ báo SAI).
import { readFileSync, writeFileSync } from "node:fs";

const F = "app/globals.css";
let css = readFileSync(F, "utf8");

// Chỉ xử lý TRONG khối đã chèn (bắt đầu bằng thẻ nhận diện → hết khi gặp dấu kết thúc).
const TAG = "/* USER 28/09/2026: BINH LUAN + 3 KHUNG BANG NHAU */";
const END = "/* VNTECH_MASTER_BASELINE_CSS_R1_1_1_END */";
const i = css.indexOf(TAG);
const j = css.indexOf(END);
if (i < 0 || j < 0 || j < i) { console.log("  🔴 không tìm thấy khối CSS cần sửa"); process.exit(1); }

const head = css.slice(0, i);
const block = css.slice(i, j);
const tail = css.slice(j);

let fixed = 0;
const lines = block.split("\n").map((ln) => {
  const t = ln.trim();
  if (t.startsWith("//")) { fixed += 1; return "/* " + t.replace(/^\/\/\s?/, "") + " */"; }
  return ln;
});
const newBlock = lines.join("\n");

writeFileSync(F, head + newBlock + tail, "utf8");
console.log("  ✅ đã đổi " + fixed + " dòng ghi chú `//` → `/* … */` trong khối CSS");

// Tự kiểm: trong khối đó KHÔNG còn dòng nào bắt đầu bằng `//`.
const after = readFileSync(F, "utf8");
const blk = after.slice(after.indexOf(TAG), after.indexOf(END));
const bad = blk.split("\n").filter((l) => l.trim().startsWith("//"));
console.log("  " + (bad.length ? "🔴 còn " + bad.length + " dòng `//`" : "✅ khối CSS không còn dòng `//` nào"));
// Kiểm chuỗi DUY NHẤT của khối mới vừa thêm.
const UNIQ = [".approval-comment{display:grid!important", ".approval-comment>textarea{display:block!important", ".approval-workbench,.baseline-approval-workbench{align-items:stretch!important", ".approval-workbench>.card,.baseline-approval-workbench>.card{height:100%!important"];
for (const u of UNIQ) console.log("  " + (blk.includes(u) ? "✅ có" : "🔴 THIẾU") + "  " + u.slice(0, 62));
