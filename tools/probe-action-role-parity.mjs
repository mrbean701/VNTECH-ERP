// Cổng đối chiếu TẦNG VAI TRÒ giữa bản JS tham chiếu và bản Java port.
//
// Vì sao cần: sau TASK-021, tầng vai trò của Java đã dùng mã engine. Nhưng còn câu hỏi khác:
// có action nào JS kiểm vai trò mà Java KHÔNG kiểm gì không? Và ngược lại, Java có chặt hơn JS không?
//
// Phải phân biệt hai chiều, vì hậu quả khác hẳn nhau:
//   • HỞ   — JS yêu cầu vai trò, Java không chặn vai trò nào ⇒ nguy cơ vượt quyền.
//   • CHẶT — Java chặn admin-only nhưng JS cho vai trò khác ⇒ người dùng bị 403 oan (lỗi chức năng).
//
// LƯU Ý: Java còn lớp `requireActionModule` chặn theo quyền module cho MỌI action không công khai
// (SystemController dòng 186-189). Vì vậy "thiếu requireRole" KHÔNG đồng nghĩa "hở" — báo cáo này
// chỉ ra chỗ CẦN ĐỌC TAY, không tự kết luận thay người đọc.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const JS = "scripts/system-route.mjs";
const JAVA_ROOT = "java-backend";
const CONTROLLER = "java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java";

// ── Tiện ích quét khối theo cặp ngoặc, BỎ QUA chuỗi và chú thích ─────────────────────────────
// (Bài học cũ: quét thô bằng regex sẽ khớp cả ngoặc nằm trong chuỗi/chú thích.)
function sliceBlock(src, openIdx) {
  let depth = 0, i = openIdx;
  let inLine = false, inBlock = false, inStr = null;
  for (; i < src.length; i++) {
    const c = src[i], n = src[i + 1];
    if (inLine) { if (c === "\n") inLine = false; continue; }
    if (inBlock) { if (c === "*" && n === "/") { inBlock = false; i++; } continue; }
    if (inStr) {
      if (c === "\\") { i++; continue; }
      if (c === inStr) inStr = null;
      continue;
    }
    if (c === "/" && n === "/") { inLine = true; i++; continue; }
    if (c === "/" && n === "*") { inBlock = true; i++; continue; }
    if (c === '"' || c === "'" || c === "`") { inStr = c; continue; }
    if (c === "{") depth++;
    else if (c === "}") { depth--; if (depth === 0) return src.slice(openIdx, i + 1); }
  }
  return src.slice(openIdx);
}

function walkJava(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walkJava(p, out);
    else if (name.endsWith(".java")) out.push(p);
  }
  return out;
}

// ── 1) JS: action → danh sách vai trò trong requireRole ─────────────────────────────────────
const js = readFileSync(JS, "utf8");
const jsActions = new Map();          // action → roles[] | null (null = không có requireRole)
const reAction = /if\s*\(\s*action\s*===\s*"([^"]+)"\s*\)\s*\{/g;
for (let m; (m = reAction.exec(js)); ) {
  const action = m[1];
  const body = sliceBlock(js, m.index + m[0].length - 1);
  const reRole = /requireRole\(\s*user\s*,\s*\[([^\]]*)\]\s*\)/g;
  const roles = [];
  for (let r; (r = reRole.exec(body)); ) {
    for (const part of r[1].split(",")) {
      const v = part.trim().replace(/^["'`]|["'`]$/g, "");
      if (v) roles.push(v);
    }
  }
  if (!jsActions.has(action) || roles.length) jsActions.set(action, roles.length ? roles : jsActions.get(action) ?? []);
}

// ── 2) Java: action → có cổng admin không + phương thức use-case được gọi ───────────────────
const ctrl = readFileSync(CONTROLLER, "utf8");
const javaCases = new Map();
const reCase = /case\s+"([^"]+)"\s*->\s*\{/g;
for (let m; (m = reCase.exec(ctrl)); ) {
  const action = m[1];
  const body = sliceBlock(ctrl, m.index + m[0].length - 1);
  const adminGated = /requireRequireAdmin\s*\(/.test(body);
  const calls = [...body.matchAll(/(\w+UseCase)\.(\w+)\s*\(/g)].map((x) => ({ useCase: x[1], method: x[2] }));
  const prev = javaCases.get(action);
  javaCases.set(action, {
    adminGated: adminGated || (prev?.adminGated ?? false),
    calls: [...(prev?.calls ?? []), ...calls],
  });
}

// ── 3) Java: map method bodies and resolve delegated calls ──────────────────────────────────
const methodBodies = new Map();
for (const file of walkJava(JAVA_ROOT)) {
  const src = readFileSync(file, "utf8");
  const useCase = file.replace(/\\/g, "/").split("/").pop().replace(".java", "");
  const reMethod = /\n\s{0,8}(?:public|private|protected)[^\n{;]*\([^)]*\)[^\n{;]*\{/g;
  for (let m; (m = reMethod.exec(src)); ) {
    const name = (m[0].match(/(\w+)\s*\([^)]*\)\s*\{$/) || [])[1];
    if (name) methodBodies.set(`${useCase}.${name}`, sliceBlock(src, m.index + m[0].length - 1));
  }
}
function hasRoleCheck(key, seen = new Set()) {
  if (seen.has(key)) return false;
  seen.add(key);
  const body = methodBodies.get(key);
  if (!body) return false;
  if (body.includes("rbac.requireRole")) return true;
  for (const call of body.matchAll(/\b(\w+)\s*\(/g)) {
    if (hasRoleCheck(`${key.split(".")[0]}.${call[1]}`, seen)) return true;
  }
  return false;
}
const roleMethods = new Set();
for (const key of methodBodies.keys()) if (hasRoleCheck(key)) {
  roleMethods.add(key);
  roleMethods.add(key.split(".")[1]);
}

// ── 4) Đối chiếu ───────────────────────────────────────────────────────────────────────────
const ADMIN_ONLY = (roles) => roles.length === 1 && roles[0] === "admin";
const rowsHole = [], rowsStrict = [], rowsOk = [], rowsUnmapped = [];

for (const [action, jsRoles] of [...jsActions].sort()) {
  if (!jsRoles.length || ADMIN_ONLY(jsRoles)) continue;   // JS cũng chỉ đòi admin ⇒ không phải ca cần so
  const jc = javaCases.get(action);
  if (!jc) { rowsUnmapped.push({ action, jsRoles }); continue; }

  const javaHasRole = jc.calls.some((c) => roleMethods.has(`${c.useCase}.${c.method}`) || roleMethods.has(c.method));
  if (jc.adminGated && !javaHasRole) rowsStrict.push({ action, jsRoles, note: "Java chỉ cho admin" });
  else if (!jc.adminGated && !javaHasRole) rowsHole.push({ action, jsRoles, note: "Java không chặn vai trò" });
  else rowsOk.push({ action, jsRoles });
}

const fmt = (r) => `   ${r.action.padEnd(34)} JS=[${r.jsRoles.join(",")}]  ${r.note ?? ""}`;

console.log("═".repeat(94));
console.log("  ĐỐI CHIẾU TẦNG VAI TRÒ  JS (system-route.mjs)  ↔  JAVA (SystemController + *UseCase)");
console.log("═".repeat(94));
console.log(`  Action có khai vai trò ở JS (khác admin-only): ${rowsHole.length + rowsStrict.length + rowsOk.length + rowsUnmapped.length}`);
console.log(`  Số action đọc được ở JS: ${jsActions.size} · số case ở Java: ${javaCases.size}`);

console.log(`\n── CẦN ĐỌC TAY: Java KHÔNG chặn vai trò, JS CÓ (${rowsHole.length}) ──`);
console.log("   Chưa kết luận là lỗ hổng: mọi action vẫn qua requireActionModule theo quyền module.");
console.log(rowsHole.length ? rowsHole.map(fmt).join("\n") : "   (không có)");

console.log(`\n── Java CHẶT HƠN JS: Java chỉ cho admin (${rowsStrict.length}) ──`);
console.log("   Đây là lỗi CHỨC NĂNG (403 oan) nếu JS thật sự cho vai trò khác.");
console.log(rowsStrict.length ? rowsStrict.map(fmt).join("\n") : "   (không có)");

console.log(`\n── KHỚP (cả hai đều chặn vai trò) (${rowsOk.length}) ──`);
console.log(rowsOk.length ? rowsOk.slice(0, 25).map((r) => `   ${r.action.padEnd(34)} JS=[${r.jsRoles.join(",")}]`).join("\n")
  + (rowsOk.length > 25 ? `\n   … và ${rowsOk.length - 25} action khác` : "") : "   (không có)");

console.log(`\n── JS có khai vai trò nhưng KHÔNG tìm thấy case ở Java (${rowsUnmapped.length}) ──`);
console.log(rowsUnmapped.length ? rowsUnmapped.map((r) => `   ${r.action.padEnd(34)} JS=[${r.jsRoles.join(",")}]`).join("\n") : "   (không có)");

// ── 5) ĐƯỜNG ỐNG roleBase ─────────────────────────────────────────────────────────────────────
// Đây là lớp kiểm tra suýt bỏ lọt hồi quy của TASK-021: một use-case có thể dùng ĐÚNG mã engine
// trong danh sách vai trò, nhưng vẫn 403 oan nếu `principalAsCurrent()` dựng CurrentUser với
// `roleBase = p.role()` (mã chuẩn) — vì khi đó cả `role()` lẫn `roleBase()` đều KHÔNG khớp mã engine.
// Điều kiện ĐỦ: use-case dùng mã engine phải (a) khai `default String roleBase()` trong Principal,
// và (b) truyền `p.roleBase()` vào CurrentUser.
const plumb = [];
for (const file of walkJava(JAVA_ROOT)) {
  const src = readFileSync(file, "utf8");
  if (!src.includes("principalAsCurrent")) continue;
  const roleLists = [...src.matchAll(/rbac\.requireRole\(principalAsCurrent\([^)]*\),\s*List\.of\(([^)]*)\)/g)]
    .map((m) => m[1].split(",").map((s) => s.trim().replace(/"/g, "")).filter(Boolean))
    .filter((roles) => !(roles.length === 1 && roles[0] === "admin"));
  if (!roleLists.length) continue;                    // chỉ dùng ["admin"] ⇒ roleBase không ảnh hưởng
  plumb.push({
    name: file.replace(/\\/g, "/").split("/").pop(),
    hasDefault: /default\s+String\s+roleBase\s*\(/.test(src),
    usesRoleBase: /p\.roleBase\(\)/.test(src),
    roleLists,
  });
}
const plumbBad = plumb.filter((r) => !r.hasDefault || !r.usesRoleBase);

console.log(`\n── ĐƯỜNG ỐNG roleBase của use-case dùng mã engine (${plumb.length} tệp) ──`);
console.log("   Thiếu đường ống ⇒ mọi tài khoản không phải admin bị 403 oan.");
console.log(plumb.length
  ? plumb.map((r) => `   ${(r.hasDefault && r.usesRoleBase ? "OK " : "X  ")} ${r.name.padEnd(34)} default=${r.hasDefault} p.roleBase()=${r.usesRoleBase}  [${r.roleLists.flat().join(",")}]`).join("\n")
  : "   (không có tệp nào dùng mã engine)");

console.log("\n" + "═".repeat(94));
const needReview = rowsHole.length + rowsStrict.length + rowsUnmapped.length + plumbBad.length;
console.log(needReview === 0
  ? "  KẾT LUẬN: tầng vai trò hai bản KHỚP và đường ống roleBase đầy đủ ✅"
  : `  KẾT LUẬN: ${needReview} điểm cần đọc tay (${rowsHole.length} có thể hở · ${rowsStrict.length} chặt hơn JS · ${rowsUnmapped.length} chưa ánh xạ · ${plumbBad.length} thiếu đường ống roleBase) ⚠`);
console.log("═".repeat(94));
process.exit(needReview === 0 ? 0 : 1);
