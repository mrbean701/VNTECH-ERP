// Trích bản đồ ACTION -> DANH SÁCH VAI TRÒ từ tầng application (Java).
//
// Chốt quyền nằm trong các UseCase: rbac.requireRole(principal, List.of("engineer", ...), "thong bao")
// Script quét mọi file *UseCase.java, tìm lời gọi requireRole, lần ngược lên tìm chữ ký phương thức
// bao ngoài để suy ra tên action.
//
// Chạy: node tools/show-action-roles.mjs [--json]
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const DIR = "java-backend/application/src/main/java/com/vntech/erp/application/service";

const camelToSnake = (s) => s.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();

// Tìm dấu ')' khớp với '(' tại vị trí open.
function matchParen(text, open) {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    const c = text[i];
    if (c === "(") depth++;
    else if (c === ")") { depth--; if (depth === 0) return i; }
    else if (c === '"') { i++; while (i < text.length && text[i] !== '"') { if (text[i] === "\\") i++; i++; } }
  }
  return -1;
}

const rows = [];
let total = 0;

for (const f of readdirSync(DIR).filter((n) => n.endsWith("UseCase.java")).sort()) {
  const text = readFileSync(join(DIR, f), "utf8");
  const re = /requireRole\s*\(/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const open = m.index + m[0].length - 1;
    const close = matchParen(text, open);
    if (close < 0) continue;
    const args = text.slice(open + 1, close);
    // Lấy danh sách chuỗi trong List.of(...) hoặc mảng
    const roles = [...args.matchAll(/"([a-z_]+)"/g)].map((x) => x[1]);
    // Thông báo lỗi là chuỗi cuối cùng có dấu tiếng Việt -> loại bỏ các chuỗi đó
    const roleish = roles.filter((r) => /^[a-z][a-z_]*$/.test(r) && !r.includes(" "));
    // Tìm chữ ký phương thức bao ngoài (lần ngược)
    const before = text.slice(0, m.index);
    const sigs = [...before.matchAll(/(?:public|private|protected)\s+[\w<>,\[\]\.\s]+\s+([a-zA-Z_][\w]*)\s*\(/g)];
    const method = sigs.length ? sigs[sigs.length - 1][1] : "?";
    rows.push({ file: f.replace("UseCase.java", ""), method, action: camelToSnake(method), roles: roleish });
    total++;
  }
}

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(rows, null, 2));
} else {
  console.log(`Tổng lời gọi requireRole: ${total}\n`);
  for (const r of rows) {
    console.log(`  ${r.action.padEnd(34)} [${r.roles.join(", ")}]   (${r.file}.${r.method})`);
  }
  const byAction = new Map();
  for (const r of rows) byAction.set(r.action, [...new Set([...(byAction.get(r.action) || []), ...r.roles])]);
  console.log(`\nSố action có chốt quyền: ${byAction.size}`);
  const adminOnly = [...byAction].filter(([, v]) => v.length === 1 && v[0] === "admin");
  console.log(`Action chỉ admin: ${adminOnly.length}`);
  const uniqueRoles = [...new Set(rows.flatMap((r) => r.roles))].sort();
  console.log(`Vai trò xuất hiện: ${uniqueRoles.join(", ")}`);
}
