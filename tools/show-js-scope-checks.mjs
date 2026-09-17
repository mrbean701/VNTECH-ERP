// Trích NGUYÊN VĂN các lời gọi kiểm phạm vi của JS cho từng action.
//
// Vì sao cần: khi nối AccessScopeService vào một use-case, phải truyền ĐÚNG giá trị mà JS dùng
// (thường là giá trị tra từ DB chứ không phải tham số thô của payload), ĐÚNG thứ tự so với kiểm vai trò,
// và ĐÚNG thông điệp lỗi. Công cụ này in ra nguyên văn để không phải suy đoán.
//
// Dùng:  node tools/show-js-scope-checks.mjs             → tất cả action
//        node tools/show-js-scope-checks.mjs issue_stock  → một action
import { readFileSync } from "node:fs";

const JS = "scripts/system-route.mjs";

function sliceBlock(src, openIdx) {
  let depth = 0, i = openIdx, inLine = false, inBlock = false, inStr = null;
  for (; i < src.length; i++) {
    const c = src[i], n = src[i + 1];
    if (inLine) { if (c === "\n") inLine = false; continue; }
    if (inBlock) { if (c === "*" && n === "/") { inBlock = false; i++; } continue; }
    if (inStr) { if (c === "\\") { i++; continue; } if (c === inStr) inStr = null; continue; }
    if (c === "/" && n === "/") { inLine = true; i++; continue; }
    if (c === "/" && n === "*") { inBlock = true; i++; continue; }
    if (c === '"' || c === "'" || c === "`") { inStr = c; continue; }
    if (c === "{") depth++;
    else if (c === "}") { depth--; if (depth === 0) return src.slice(openIdx, i + 1); }
  }
  return src.slice(openIdx);
}

/** Cắt từ đầu lời gọi tới dấu ')' cân bằng — để in nguyên văn cả lời gọi lồng nhau. */
function callAt(body, startIdx) {
  let depth = 0, inStr = null;
  for (let i = startIdx; i < body.length; i++) {
    const c = body[i];
    if (inStr) { if (c === "\\") { i++; continue; } if (c === inStr) inStr = null; continue; }
    if (c === '"' || c === "'" || c === "`") { inStr = c; continue; }
    if (c === "(") depth++;
    else if (c === ")") { depth--; if (depth === 0) return body.slice(startIdx, i + 1); }
  }
  return body.slice(startIdx, startIdx + 200);
}

const js = readFileSync(JS, "utf8");
const only = process.argv[2];
const lines = [];
const reAction = /if\s*\(\s*action\s*===\s*"([^"]+)"\s*\)\s*\{/g;
for (let m; (m = reAction.exec(js)); ) {
  const action = m[1];
  if (only && action !== only) continue;
  const bodyStart = m.index + m[0].length - 1;
  const body = sliceBlock(js, bodyStart);
  const found = [];
  const reCall = /canAccess(Project|Warehouse)\(/g;
  for (let c; (c = reCall.exec(body)); ) {
    const text = callAt(body, c.index).replace(/\s+/g, " ");
    const lineNo = js.slice(0, bodyStart + c.index).split("\n").length;
    // Lấy thông điệp lỗi đi kèm: JS luôn `if(!(await canAccessX(...))) throw new Error("...")`
    const after = body.slice(c.index + text.length, c.index + text.length + 260);
    const msg = (after.match(/throw new Error\(\s*"([^"]*)"/) || [])[1] ?? "";
    found.push({ lineNo, text, msg });
  }
  if (!found.length) continue;
  const roleLine = (body.match(/requireRole\(\s*user\s*,\s*\[[^\]]*\]\s*\)/) || [])[0];
  const roleAt = roleLine ? body.indexOf(roleLine) : -1;
  const firstScopeAt = body.search(/canAccess(Project|Warehouse)\(/);
  lines.push({ action, found, roleLine, scopeFirst: roleAt >= 0 && firstScopeAt >= 0 && firstScopeAt < roleAt });
}

console.log(`Nguồn: ${JS} — ${lines.length} action có kiểm phạm vi${only ? ` (lọc: ${only})` : ""}\n`);
for (const row of lines) {
  console.log(`── ${row.action}`);
  for (const f of row.found) console.log(`     L${f.lineNo}: ${f.text}${f.msg ? `\n              ↳ "${f.msg}"` : ""}`);
  if (row.roleLine) {
    console.log(`     requireRole: ${row.roleLine}  → phạm vi kiểm ${row.scopeFirst ? "TRƯỚC" : "SAU"} vai trò`);
  }
}
process.exit(0);
