// In thân một phương thức Java theo tên lớp + tên phương thức (quét khối theo cặp ngoặc,
// bỏ qua chuỗi và chú thích). Dùng để lấy dữ liệu chính xác trước khi vá — không đoán.
//
// Dùng: node tools/show-java-method.mjs StockManagementUseCase issueStock [maxLines]
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const [className, methodName, maxLinesRaw] = process.argv.slice(2);
if (!className || !methodName) {
  console.error("Dùng: node tools/show-java-method.mjs <TenLop> <tenPhuongThuc> [maxLines]");
  process.exit(2);
}
const maxLines = Number(maxLinesRaw || 26);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (name.endsWith(".java")) out.push(p);
  }
  return out;
}

function sliceBlock(src, openIdx) {
  let depth = 0, i = openIdx, inLine = false, inBlock = false, inStr = null;
  for (; i < src.length; i++) {
    const c = src[i], n = src[i + 1];
    if (inLine) { if (c === "\n") inLine = false; continue; }
    if (inBlock) { if (c === "*" && n === "/") { inBlock = false; i++; } continue; }
    if (inStr) { if (c === "\\") { i++; continue; } if (c === inStr) inStr = null; continue; }
    if (c === "/" && n === "/") { inLine = true; i++; continue; }
    if (c === "/" && n === "*") { inBlock = true; i++; continue; }
    if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
    if (c === "{") depth++;
    else if (c === "}") { depth--; if (depth === 0) return src.slice(openIdx, i + 1); }
  }
  return src.slice(openIdx);
}

const file = walk("java-backend").find((f) => f.replace(/\\/g, "/").split("/").pop() === `${className}.java`);
if (!file) { console.error(`Không tìm thấy lớp ${className}`); process.exit(1); }

const src = readFileSync(file, "utf8").replace(/\r\n/g, "\n");
const sig = new RegExp(`^ {4}(?:public|private|protected)[^\\n{;]*\\b${methodName}\\s*\\([^)]*\\)[^\\n{;]*\\{`, "m");
const m = sig.exec(src);
if (!m) { console.error(`Không tìm thấy phương thức ${className}.${methodName}`); process.exit(1); }

const openIdx = m.index + m[0].length - 1;
const body = sliceBlock(src, openIdx);
const startLine = src.slice(0, m.index).split("\n").length;
const head = m[0].replace(/\s+/g, " ").trim();
console.log(`── ${className}.${methodName}  (${file.replace(/\\/g, "/")}, từ dòng ${startLine})\n`);
console.log(body.split("\n").slice(0, maxLines).join("\n"));
if (body.split("\n").length > maxLines) console.log(`… (còn ${body.split("\n").length - maxLines} dòng nữa)`);
void head;
process.exit(0);
