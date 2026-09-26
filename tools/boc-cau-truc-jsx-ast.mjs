// U-14 (TASK-091) — BÓC CẤU TRÚC JSX BẰNG AST THẬT (`typescript`), thay cho bản tự viết đã chứng minh SAI.
//
// Vì sao: `RequestDrawer` (`app/page.tsx`) nằm TRỌN trong MỘT DÒNG 9.254 ký tự. Bản quét tự viết bị KẸT bộ đếm
// ngoặc nhọn nên bỏ qua phần lớn thẻ và GHÉP CẶP SAI (bài học #21/#25: công cụ đo sai còn nguy hiểm hơn không đo).
// Bản này dùng chính `typescript` (đã có trong devDependencies) ⇒ vị trí thẻ lấy từ parser thật.
//
//   node tools/boc-cau-truc-jsx-ast.mjs <file> <dòng> [--depth=3] [--show=80]
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const args = process.argv.slice(2);
const file = args[0];
const lineWanted = Number(args[1]);
const opt = (name, dflt) => { const v = args.find((a) => a.startsWith(`--${name}=`)); return v ? Number(v.slice(name.length + 3)) : dflt; };
const MAX_DEPTH = opt("depth", 3);
const SHOW = opt("show", 80);
// Chỉ in thẻ "cấu trúc" để bản đồ đọc được (bỏ fragment/`{biểu thức}` gây nhiễu).
const TAGS = new Set((args.find((a) => a.startsWith("--tags="))?.slice(7) || "header,div,section,aside,footer,form,table,button,ul,li,a").split(","));
if (!file || !lineWanted) { console.error("Dùng: node tools/boc-cau-truc-jsx-ast.mjs <file> <dòng> [--depth=3] [--show=80]"); process.exit(2); }

const text = readFileSync(file, "utf8");
const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const lines = text.split("\n");
const lineStart = lines.slice(0, lineWanted - 1).reduce((sum, l) => sum + l.length + 1, 0);
const lineEnd = lineStart + (lines[lineWanted - 1] ?? "").length;

const tagName = (node) => {
  const t = node.tagName;
  return t ? t.getText(sf) : "<fragment>";
};
const classNameOf = (node) => {
  const attr = (node.attributes?.properties || []).find((p) => ts.isJsxAttribute(p) && p.name.getText(sf) === "className");
  if (!attr?.initializer) return "";
  if (ts.isStringLiteral(attr.initializer)) return attr.initializer.text;
  return "{biểu thức} " + attr.initializer.getText(sf).slice(0, 60);
};
const idOf = (node) => {
  const ids = ["id", "data-contract", "aria-label", "type"].map((name) => {
    const attr = (node.attributes?.properties || []).find((p) => ts.isJsxAttribute(p) && p.name.getText(sf) === name);
    if (!attr?.initializer) return null;
    const v = ts.isStringLiteral(attr.initializer) ? attr.initializer.text : attr.initializer.getText(sf).slice(0, 40);
    return `${name}=${v}`;
  }).filter(Boolean);
  return ids.join(" ");
};

let printed = 0;
// `jsxDepth` = độ sâu CHỈ tính trong cây JSX (không tính các nút AST trung gian như SourceFile/ReturnStatement).
// ⚠️ Hai lỗi đã gặp thật ở công cụ này: (1) truyền `depth` không +1 ⇒ mọi nút là depth 0; (2) lọc theo độ sâu
// AST ⇒ JSX nằm ở depth ~8 nên bị chặn hết. Nay tách hẳn `jsxDepth`.
function walk(node, jsxDepth) {
  const isJsx = ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node);
  let nextDepth = jsxDepth;
  if (isJsx) {
    const isFrag = ts.isJsxFragment(node);
    const open = ts.isJsxElement(node) ? node.openingElement : node;
    const start = open.getStart(sf), end = node.getEnd();
    if (start >= lineStart - 1 && end <= lineEnd + 1) {
      const tag = isFrag ? "{…}" : tagName(node);
      if (isFrag ? jsxDepth <= 1 : TAGS.has(tagName(node))) {
        const cn = isFrag ? "" : classNameOf(node);
        const extra = isFrag ? "" : idOf(node);
        console.log(`${"  ".repeat(jsxDepth)}[${String(start - lineStart).padStart(5)}..${String(end - lineStart).padStart(5)}] ${isFrag ? tag : "<" + tag + ">"} len=${end - start} ${cn ? `class="${cn}"` : ""} ${extra}`.trimEnd());
        printed++;
      }
    }
    nextDepth = jsxDepth + 1;
    if (nextDepth > MAX_DEPTH) return;
  }
  ts.forEachChild(node, (child) => walk(child, nextDepth));
}

// Chỉ bắt đầu từ các JSX nằm TRONG dòng cần đo (bỏ qua phần còn lại của tệp).
function walkTop(node, depth) {
  const pos = node.getStart(sf);
  if (pos > lineEnd) return;
  walk(node, depth);
}
walkTop(sf, 0);

console.log(`\n${file}:${lineWanted} · dài ${lineEnd - lineStart} ký tự · in ${printed} phần tử (depth≤${MAX_DEPTH})`);
const lineText = lines[lineWanted - 1] ?? "";
for (const needle of ["<header", "</header>", "drawer-body", "<footer", "</footer>", "summary-grid", "type=\"submit\""]) {
  const first = lineText.indexOf(needle);
  if (first >= 0) console.log(`  mỏ neo ${needle.padEnd(14)} lần đầu @${first} · tổng ${lineText.split(needle).length - 1}`);
}
