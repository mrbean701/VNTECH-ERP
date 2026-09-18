// U-11 (bước 1) — TÁCH LÁT CẮT AN TOÀN ĐẦU TIÊN khỏi `app/page.tsx`.
//
// NGUYÊN TẮC AN TOÀN (script tự KIỂM TRƯỚC KHI GHI, không ghi gì nếu vi phạm):
//   Một khai báo chỉ được chuyển sang module mới khi thân nó CHỈ dùng:
//     (a) các khai báo top-level KHÁC CŨNG ĐƯỢC CHUYỂN trong cùng lượt (không phụ thuộc cái ở lại),
//     (b) tên có sẵn của JS/trình duyệt (Date, Math, Number, String, JSON, Object, Array, Intl, RegExp…),
//     (c) không có JSX (không có `<TênHoa`).
//   ⇒ Module mới KHÔNG cần import nào ⇒ KHÔNG thể tạo import vòng, KHÔNG thể thiếu import.
//
// Cách dùng:  node tools/tach-lat-cat-page.mjs --dry     (chỉ in kế hoạch)
//             node tools/tach-lat-cat-page.mjs            (ghi thật)
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PAGE = join(root, "app", "page.tsx");
// ⚠️ `@/*` trong tsconfig trỏ về GỐC DỰ ÁN (`"@/*": ["./*"]`), nên `@/lib/…` là **`lib/` ở GỐC**,
// không phải `app/lib/…`. Lượt chạy đầu ghi vào `app/lib/` ⇒ import KHÔNG giải được ⇒ mọi hằng số
// nhập về thành `any` ⇒ `tsc` báo `TS7006: Parameter 'c' implicitly has an 'any' type` (lỗi ĐÁNH LỪA:
// trông như lỗi suy diễn, thật ra là lỗi ĐƯỜNG DẪN).
const OUT = join(root, "lib", "ui-shared.tsx");
const DRY = process.argv.includes("--dry");
const TARGET = "lib/ui-shared.tsx";

const BUILTINS = new Set([
  "Date", "Math", "Number", "String", "Boolean", "JSON", "Object", "Array", "Intl", "RegExp",
  "Map", "Set", "Promise", "console", "window", "document", "undefined", "null", "true", "false",
  "NaN", "Infinity", "parseInt", "parseFloat", "isNaN", "encodeURIComponent", "decodeURIComponent",
  "setTimeout", "clearTimeout", "localStorage", "sessionStorage", "alert", "fetch",
]);
// ⚠️ KIỂU CỦA REACT KHÔNG PHẢI "CÓ SẴN": dùng tới chúng là phải có `import type { … } from "react"`.
// Lượt `--dry` đầu tiên suýt chuyển `BaseModal` (dùng `ReactNode`) sang tệp KHÔNG import gì ⇒ tsc sẽ chặn.
const REACT_TYPES = new Set([
  "ReactNode", "ReactElement", "CSSProperties", "FormEvent", "ChangeEvent", "MouseEvent",
  "KeyboardEvent", "Dispatch", "SetStateAction", "RefObject", "ReactPortal", "FC",
]);
const KEYWORDS = new Set([
  "function", "const", "let", "var", "return", "if", "else", "for", "while", "do", "switch", "case",
  "break", "continue", "new", "typeof", "instanceof", "in", "of", "class", "extends", "super", "this",
  "try", "catch", "finally", "throw", "delete", "void", "yield", "await", "async", "default", "export",
  "import", "from", "as", "type", "interface", "enum", "implements", "public", "private", "protected",
  "readonly", "static", "abstract", "declare", "namespace", "module", "satisfies", "keyof", "infer",
  "string", "number", "boolean", "any", "unknown", "never", "object", "symbol", "bigint", "Record",
  "Partial", "Readonly", "Pick", "Omit", "ArrayLike",
]);

const src = readFileSync(PAGE, "utf8");
const lines = src.split(/\r?\n/);

// --- 1. Khai báo top-level ---
const decls = [];
const rx = /^(?:export\s+)?(?:async\s+)?(function|const|type|interface)\s+([A-Za-z_$][\w$]*)/;
for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(rx);
  if (m) decls.push({ kind: m[1], name: m[2], line: i + 1 });
}
for (let i = 0; i < decls.length; i++) {
  decls[i].end = i + 1 < decls.length ? decls[i + 1].line - 1 : lines.length;
  decls[i].body = lines.slice(decls[i].line - 1, decls[i].end).join("\n");
}
// MỞ RỘNG LÊN TRÊN: kéo theo các dòng CHÚ THÍCH liền trên (kể cả `// eslint-disable-next-line …`).
// Không làm việc này thì chú thích nằm lại `page.tsx` và eslint báo "unused eslint-disable directive"
// (đã gặp thật với `type Row = Record<string, any>` được bọc bởi `// eslint-disable-next-line`).
for (const d of decls) {
  let s = d.line;
  while (s - 1 >= 1 && /^\s*(\/\/|\/\*|\*|\*\/)/.test(lines[s - 2])) s--;
  d.line = s;
  d.body = lines.slice(d.line - 1, d.end).join("\n");
}
const topNames = new Set(decls.map((d) => d.name));
const byName = new Map(decls.map((d) => [d.name, d]));

// --- 2. Tên đến từ import (không được xuất hiện trong khối chuyển đi) ---
const imported = new Set();
for (const line of lines) {
  const m = line.match(/^import\s+(?:type\s+)?\{([^}]+)\}\s+from/);
  if (m) for (const raw of m[1].split(",")) {
    const n = raw.replace(/\btype\s+/, "").trim().split(/\s+as\s+/).pop().trim();
    if (n) imported.add(n);
  }
}
console.log(`Khai báo top-level: ${decls.length} · tên từ import: ${imported.size}`);

// --- 3. Đồ thị phụ thuộc + chọn lá "sạch" ---
const refs = (body) => {
  const out = new Set();
  for (const m of body.matchAll(/([A-Za-z_$][\w$]*)/g)) {
    const n = m[1];
    if (KEYWORDS.has(n) || BUILTINS.has(n)) continue;
    out.add(n);
  }
  return out;
};
for (const d of decls) d.refs = refs(d.body);

// NHẬN DIỆN JSX: lượt `--dry` đầu chỉ bắt `<TênHoa` nên ĐÃ LỌT các component dùng thẻ thường
// (`<div>`, `<footer>`, `<button>`). Hệ quả khi chuyển: KIỂU SUY DIỄN của props mất ngữ cảnh ⇒
// `tsc` báo `TS7006: Parameter 'c' implicitly has an 'any' type` ở nơi dùng. Nay bắt MỌI thẻ:
const hasJsx = (body) => /(^|[^\w])<[a-zA-Z][\w.-]*([\s/>]|$)/.test(body.replace(/=>/g, "")) || /<>/.test(body);

// lá = không tham chiếu khai báo top-level nào khác
const leaf = decls.filter((d) => ![...d.refs].some((r) => topNames.has(r) && r !== d.name));
// lá SẠCH = lá ∧ không JSX ∧ không tham chiếu tên import nào ∧ không dùng KIỂU CỦA REACT
const clean = leaf.filter((d) =>
  !hasJsx(d.body) && ![...d.refs].some((r) => imported.has(r) || REACT_TYPES.has(r)));

console.log(`\nLÁ: ${leaf.length} · LÁ SẠCH (không JSX, không cần import): ${clean.length}`);
for (const d of clean) console.log(`  ${String(d.line).padStart(5)}  ${d.kind.padEnd(9)} ${d.name}  (${d.end - d.line + 1} dòng)`);

const skipped = leaf.filter((d) => !clean.includes(d));
if (skipped.length) {
  console.log(`\n(Để lại — có JSX hoặc cần import): ${skipped.map((d) => `${d.name}${hasJsx(d.body) ? "[JSX]" : "[import]"}`).join(", ")}`);
}

const movedLines = clean.reduce((s, d) => s + (d.end - d.line + 1), 0);
console.log(`\nTổng dòng sẽ chuyển: ${movedLines} · page.tsx ${lines.length} → ${lines.length - movedLines}`);

const MOVE = clean.map((d) => d.name);
console.log(`\nDanh sách chuyển (${MOVE.length}): ${MOVE.join(", ")}`);

if (DRY || !clean.length) {
  console.log("\n[--dry] Không ghi gì.");
  process.exit(0);
}

// --- 4. Ghi: cắt khỏi page.tsx, thêm vào module mới ---
const cut = new Set();
const blocks = [];
for (const d of clean) {
  for (let i = d.line; i <= d.end; i++) cut.add(i);
  blocks.push(lines.slice(d.line - 1, d.end).join("\n"));
}
const kept = lines.filter((_, idx) => !cut.has(idx + 1));

// Chèn import vào page.tsx ngay sau KẾT THÚC của câu import CUỐI CÙNG — TÁCH RIÊNG import KIỂU (type)
// và giá trị để không phụ thuộc cấu hình `verbatimModuleSyntax`/`isolatedModules` của tsconfig.
// ⚠️ Lượt chạy đầu tiên chèn vào GIỮA một câu import nhiều dòng ⇒ `TS1003: Identifier expected` ở dòng 20.
let lastImport = -1;
let inImport = false;
for (let i = 0; i < kept.length; i++) {
  const l = kept[i];
  if (!inImport && /^import\b/.test(l)) {
    inImport = true;
    if (/from\s+["']/.test(l) || /^import\s+["']/.test(l)) { inImport = false; lastImport = i; }
    continue;
  }
  if (inImport) {
    if (/from\s+["']/.test(l)) { inImport = false; lastImport = i; }
    continue;
  }
}
if (lastImport < 0) throw new Error("Không tìm thấy câu import nào hoàn chỉnh trong page.tsx");
const typeNames = clean.filter((d) => d.kind === "type" || d.kind === "interface").map((d) => d.name).sort();
const valueNames = clean.filter((d) => d.kind !== "type" && d.kind !== "interface").map((d) => d.name).sort();
const importLines = [];
if (valueNames.length) importLines.push(`import { ${valueNames.join(", ")} } from "@/lib/ui-shared";`);
if (typeNames.length) importLines.push(`import type { ${typeNames.join(", ")} } from "@/lib/ui-shared";`);
kept.splice(lastImport + 1, 0, ...importLines);

const header = [
  "// PHASE 1 (U-11) — LÁT CẮT ĐẦU TIÊN TÁCH KHỎI `app/page.tsx`.",
  "//",
  "// Vì sao tách: `app/page.tsx` là MỘT tệp khổng lồ (hơn 4.000 dòng, hơn 250 khai báo top-level).",
  "// Thứ tự cắt ĐÚNG (đã ghi ở `docs/agent-progress/U14-U11-KHAO-SAT.md` mục 2) là:",
  "//   bước 1 tách HELPER DÙNG CHUNG trước (gỡ chặn IMPORT VÒNG), rồi mới tách từng màn.",
  "// Đây chính là bước 1.",
  "//",
  "// ⚠️ ĐIỀU KIỆN AN TOÀN CỦA LÁT CẮT NÀY (do `tools/tach-lat-cat-page.mjs` tự kiểm trước khi ghi):",
  "//   mọi thứ trong tệp này CHỈ dùng hàm/kiểu có sẵn của JS và các khai báo CÙNG nằm trong tệp này —",
  "//   KHÔNG có JSX, KHÔNG import gì. Nhờ vậy nó KHÔNG THỂ tạo import vòng.",
  "//   Muốn thêm thứ cần JSX/import vào đây thì phải thêm import tương ứng — và phải chạy lại cổng ảnh.",
  "",
].join("\n");
mkdirSync(dirname(OUT), { recursive: true });
// ⚠️ PHẢI CÓ `export`: giữ nguyên khai báo (không `export`) thì tệp KHÔNG phải là module ⇒ tsc báo
// `TS2306: File '…/lib/ui-shared.tsx' is not a module` và MỌI thứ nhập về thành `any`.
// Cách an toàn nhất: giữ nguyên văn từng khối, rồi thêm MỘT câu export ở cuối tệp.
const exportValues = clean.filter((d) => d.kind !== "type" && d.kind !== "interface").map((d) => d.name);
const exportTypes = clean.filter((d) => d.kind === "type" || d.kind === "interface").map((d) => d.name);
const trailer = [
  "",
  exportValues.length ? `export {\n  ${exportValues.join(",\n  ")},\n};` : "",
  exportTypes.length ? `export type {\n  ${exportTypes.join(",\n  ")},\n};` : "",
  "",
].filter(Boolean).join("\n");
writeFileSync(OUT, header + blocks.join("\n\n") + "\n" + trailer, "utf8");
writeFileSync(PAGE, kept.join("\n"), "utf8");
console.log(`\nĐÃ GHI: ${TARGET} (${blocks.length} khối · ${exportValues.length} giá trị + ${exportTypes.length} kiểu)`);
