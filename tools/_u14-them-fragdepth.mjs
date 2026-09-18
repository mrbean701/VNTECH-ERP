// [U-14] SỬA BỘ TÁCH: thêm `fragDepth` (độ sâu FRAGMENT) vào `splitChildren` của công cụ chuyển drawer.
// Vì sao: fragment `<>…</>` ở mức ngoài cùng bọc nhiều khối bị cắt đôi ⇒ `<>` ở tab này, `</>` ở tab khác ⇒ JSX lệch cân
// (đã bị `tsc` bắt ở lượt `--apply` đầu và đã hoàn tác). Mỏ neo + TỰ CHỐI nếu không khớp đúng 1 lần.
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
patch("thêm biến fragDepth", "let tagDepth = 0;", "let tagDepth = 0;\n  let fragDepth = 0;   // độ sâu FRAGMENT `<>…</>` (bài học: chỉ theo dõi thẻ là CHƯA ĐỦ)");
patch("theo dõi frag khi gặp <> / </>", "if (!m) { buf += text[i]; i++; continue; }",
  'if (!m) { if (text.startsWith("<>", i)) fragDepth++; else if (text.startsWith("</>", i)) fragDepth = Math.max(0, fragDepth - 1); buf += text[i]; i++; continue; }');
patch("mốc biểu thức phải ở ngoài fragment", 'if (tagDepth === 0 && text[i] === "{") {', 'if (tagDepth === 0 && fragDepth === 0 && text[i] === "{") {');
patch("cắt section phải ở ngoài fragment", "if (!close && tagDepth === 0 && /^<\\s*section\\b/i.test(tagText) && buf) {", "if (!close && tagDepth === 0 && fragDepth === 0 && /^<\\s*section\\b/i.test(tagText) && buf) {");

if (failures.length) { console.error("KHÔNG GHI — có điều kiện không đạt:"); for (const f of failures) console.error("  ✖ " + f); process.exit(1); }
if (!APPLY) { console.log("CHẠY KHÔ: 4 mỏ neo khớp đủ ⇒ sẵn sàng sửa công cụ (thêm --apply)."); process.exit(0); }
writeFileSync(FILE, text);
console.log("ĐÃ GHI: " + FILE + " (bộ tách nay theo dõi cả độ sâu FRAGMENT)");
