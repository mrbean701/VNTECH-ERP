// U-14 (TASK-091) — BÓC CẤU TRÚC JSX của một khối nằm TRỌN trong MỘT DÒNG khổng lồ.
//
// ⚠️⚠️ TRẠNG THÁI: **CHƯA ĐÁNG TIN — KHÔNG dùng bản này để lập kế hoạch sửa mã.**
// Lượt chạy đầu trên dòng 2894 (9.254 ký tự) chỉ bóc được **41 mục và dừng ở offset ~2.000/9.254** ⇒ bộ đếm
// ngoặc nhọn (`braceDepth`) **bị kẹt ở mức > 0** (gặp `{`/`}` trong template literal hoặc trong chữ JSX) nên
// phần lớn thẻ bị BỎ QUA. Vì vậy nhãn thẻ trong kết quả **ghép cặp SAI** (`close <aside>` lại in ra đoạn `</header>`).
// **Việc phải làm trước khi dùng (bước 3/6 của TASK-091):** thay bộ quét bằng bộ đếm thẻ chuẩn (xử lý đúng
// template literal `${…}`, chuỗi, comment) — hoặc dùng `tsc`/AST (`typescript` đã có trong devDependencies)
// để lấy vị trí thẻ thật. **TUYỆT ĐỐI không sửa mã theo bản đồ sai** (bài học #21/#25: cổng/công cụ đo sai
// còn nguy hiểm hơn không đo).
//
// Cách dùng (khi đã sửa xong):
//   node tools/boc-cau-truc-jsx.mjs <dòng> [--file=app/page.tsx] [--max=200] [--show=<số ký tự>]
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const lineNo = Number(args.find((a) => /^\d+$/.test(a)) || 0);
const opt = (name, dflt) => { const v = args.find((a) => a.startsWith(`--${name}=`)); return v ? v.slice(name.length + 3) : dflt; };
const FILE = opt("file", "app/page.tsx");
const MAX = Number(opt("max", 400));
const SHOW = Number(opt("show", 90));

if (!lineNo) { console.error("Dùng: node tools/boc-cau-truc-jsx.mjs <dòng> [--file=…] [--max=…] [--show=…]"); process.exit(2); }
const source = readFileSync(FILE, "utf8");
const target = source.split("\n")[lineNo - 1];
if (target === undefined) { console.error(`Không có dòng ${lineNo} trong ${FILE}`); process.exit(2); }
console.log(`FILE=${FILE} · dòng ${lineNo} · ${target.length} ký tự`);

// Bóc thẻ JSX: bỏ qua chuỗi nháy đơn/kép, template literal, và biểu thức trong {…} ở mức 0 của ATTRIBUTE
// (chỉ cần đúng cho việc ĐẾM thẻ ở mức ngoài cùng — không phải parser JSX đầy đủ).
const SELF_CLOSING = new Set(["input", "img", "br", "hr", "meta", "link", "source", "track", "wbr", "area", "base", "col", "embed", "param"]);
const stack = [];
const outline = [];
let i = 0, inStr = null, inTpl = false, braceDepth = 0;
const push = (kind, name, start) => outline.push({ kind, name, start });
while (i < target.length) {
  const ch = target[i];
  if (inStr) { if (ch === "\\") { i += 2; continue; } if (ch === inStr) inStr = null; i++; continue; }
  if (inTpl) { if (ch === "\\") { i += 2; continue; } if (ch === "`") inTpl = false; i++; continue; }
  if (ch === '"' || ch === "'") { inStr = ch; i++; continue; }
  if (ch === "`") { inTpl = true; i++; continue; }
  if (ch === "{" && braceDepth === 0 && target[i + 1] !== undefined) { braceDepth++; i++; continue; }
  if (ch === "}" && braceDepth > 0) { braceDepth--; i++; continue; }
  if (ch === "<" && braceDepth === 0) {
    const close = target.startsWith("</", i);
    const selfClose = /^<[A-Za-z][^>]*\/>/.test(target.slice(i));
    const m = target.slice(i).match(close ? /^<\/\s*([A-Za-z][\w.:-]*)/ : /^<\s*([A-Za-z][\w.:-]*)/);
    if (m) {
      const name = m[1];
      if (close) {
        const top = stack.pop();
        if (top) outline.push({ kind: "close", name: top.name, start: i, contentStart: top.contentStart, end: i + m[0].length });
      } else if (selfClose || SELF_CLOSING.has(name.toLowerCase())) {
        outline.push({ kind: "self", name, start: i, end: i + (target.slice(i).match(/^<[^>]*>/)?.[0].length || m[0].length) });
      } else {
        stack.push({ name, start: i, contentStart: i + (target.slice(i).match(/^<[^>]*>/)?.[0].length || m[0].length) });
      }
    }
    // nhảy qua hết thẻ mở (đến '>' đầu tiên ngoài chuỗi) — đủ dùng vì thuộc tính không chứa '>' ngoài chuỗi
    let j = i + 1;
    let s2 = null;
    while (j < target.length) { const c = target[j]; if (s2) { if (c === "\\") { j += 2; continue; } if (c === s2) s2 = null; j++; continue; } if (c === '"' || c === "'") { s2 = c; j++; continue; } if (c === ">") break; j++; }
    i = j + 1;
    continue;
  }
  i++;
}

// Chỉ in các khối NGOÀI CÙNG (không lồng nhau) theo độ sâu, dừng sau MAX mục.
let printed = 0;
for (const node of outline) {
  if (printed++ >= MAX) break;
  const len = node.end !== undefined && node.contentStart !== undefined ? node.end - node.contentStart : node.end !== undefined ? node.end - node.start : "?";
  const snippet = target.slice(node.start, node.start + SHOW).replace(/\s+/g, " ");
  console.log(`  [${String(node.start).padStart(5)}] ${node.kind.padEnd(5)} <${node.name}> len=${String(len).padStart(5)}  ${snippet}`);
}
console.log(`\nTổng mục in: ${Math.min(printed, MAX)}${printed > MAX ? ` / ${printed}` : ""} · thẻ chưa đóng còn lại trên ngăn xếp: ${stack.length}${stack.length ? " (" + stack.map((s) => s.name).join(", ") + ")" : ""}`);
