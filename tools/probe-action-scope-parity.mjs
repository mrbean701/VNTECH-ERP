// Cổng đối chiếu TẦNG PHẠM VI (project/warehouse scope) giữa JS tham chiếu và Java port.
//
// Vì sao cần: JS chặn nghiệp vụ theo PHẠM VI chứ không chỉ theo vai trò —
//   canAccessProject(user, projectId, write)    → user_project_scopes.permission
//   canAccessWarehouse(user, warehouseId, write)→ loại kho + user_warehouse_scopes + phạm vi dự án + canUseModule
// Java (tính đến TASK-023) gần như KHÔNG có tương đương ở tầng application. Nghĩa là một tài khoản có
// quyền module vẫn thao tác được trên dự án/kho KHÔNG thuộc phạm vi của mình. Đây là lỗ hổng P0.
//
// Cổng này liệt kê các action JS có kiểm phạm vi để biết chính xác phải vá chỗ nào — không tự sửa.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const JS = "scripts/system-route.mjs";
const JAVA_ROOT = "java-backend";
const CONTROLLER = "java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java";

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

function walkJava(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walkJava(p, out);
    else if (name.endsWith(".java")) out.push(p);
  }
  return out;
}

// ── 1) JS: action → các kiểm phạm vi được dùng ──────────────────────────────────────────────
// LƯU Ý: regex /g phải được hoist RA NGOÀI vòng lặp. Tạo regex mới trong điều kiện vòng lặp sẽ
// reset lastIndex về 0 ⇒ exec luôn trả về kết quả đầu tiên ⇒ LẶP VÔ HẠN.
const js = readFileSync(JS, "utf8");
const jsScope = new Map();
const reAction = /if\s*\(\s*action\s*===\s*"([^"]+)"\s*\)\s*\{/g;
for (let m; (m = reAction.exec(js)); ) {
  const action = m[1];
  const body = sliceBlock(js, m.index + m[0].length - 1);
  const proj = [...body.matchAll(/canAccessProject\([^)]*?,\s*([^,)]*?)(?:,\s*(true|false))?\s*\)/g)];
  const wh = [...body.matchAll(/canAccessWarehouse\([^)]*?,\s*([^,)]*?)(?:,\s*(true|false))?\s*\)/g)];
  if (!proj.length && !wh.length) continue;
  jsScope.set(action, {
    project: proj.map((x) => (x[2] === "true" ? "write" : "read")),
    warehouse: wh.map((x) => (x[2] === "true" ? "write" : "read")),
  });
}

// ── 2) Java: ánh xạ action → (use-case, phương thức) và tìm dấu vết kiểm phạm vi ────────────
const ctrl = readFileSync(CONTROLLER, "utf8");
const javaCases = new Map();
const reCase = /case\s+"([^"]+)"\s*->\s*\{/g;
for (let m; (m = reCase.exec(ctrl)); ) {
  const help = sliceBlock(ctrl, m.index + m[0].length - 1);
  const calls = [...help.matchAll(/(\w+UseCase)\.(\w+)\s*\(/g)].map((x) => ({ useCase: x[1], method: x[2] }));
  const prev = javaCases.get(m[1]);
  javaCases.set(m[1], {
    adminGated: /requireRequireAdmin\s*\(/.test(help) || (prev?.adminGated ?? false),
    // Có action kiểm phạm vi NGAY TRONG case của controller (đúng thiết kế ghi trong chú thích
    // ProjectContractUseCase: "quyền theo canAccessProject — check ở web"). Phải tính cả trường hợp này,
    // nếu không cổng sẽ báo thiếu oan.
    scopeInCase: /requireProjectAccess|requireWarehouseAccess|canAccessProject|canAccessWarehouse|accessScopeService\./
      .test(help) || (prev?.scopeInCase ?? false),
    calls: [...(prev?.calls ?? []), ...calls],
  });
}

// Dấu vết kiểm phạm vi trong Java. Từ TASK-023, Java dùng lớp dùng chung AccessScopeService
// (`requireProjectAccess` / `canAccessProject` / `accessScope.`) — tên khác JS nên phải khai ở đây.
const SCOPE_MARKERS = /requireProjectAccess|requireWarehouseAccess|canAccessProject|canAccessWarehouse|accessScope\.|projectScopePermission|findProjectScope|warehouseScopePermission|user_project_scopes|user_warehouse_scopes/;
const methodBodies = new Map();      // "TenUseCase.method" → thân phương thức
for (const file of walkJava(JAVA_ROOT)) {
  const src = readFileSync(file, "utf8");
  const useCase = file.replace(/\\/g, "/").split("/").pop().replace(".java", "");
  const re = /\n\s{0,8}(?:public|private|protected)[^\n{;]*\([^)]*\)[^\n{;]*\{/g;
  for (let m; (m = re.exec(src)); ) {
    const name = (m[0].match(/(\w+)\s*\([^)]*\)\s*\{$/) || [])[1];
    if (!name) continue;
    methodBodies.set(`${useCase}.${name}`, sliceBlock(src, m.index + m[0].length - 1));
  }
}

// ── 3) Đối chiếu ───────────────────────────────────────────────────────────────────────────
const missing = [], covered = [], noMap = [];
for (const [action, scope] of [...jsScope].sort()) {
  const jc = javaCases.get(action);
  if (!jc || !jc.calls.length) { noMap.push({ action, scope, reason: jc ? "controller không gọi use-case" : "không có case" }); continue; }
  const hit = jc.calls.filter((c) => {
    const cap = c.useCase.charAt(0).toUpperCase() + c.useCase.slice(1);
    const keys = [`${c.useCase}.${c.method}`, `${cap}.${c.method}`, c.method];
    return keys.some((key) => {
      const seen = new Set();
      const walk = (k) => {
        if (seen.has(k)) return false;
        seen.add(k);
        const body = methodBodies.get(k);
        if (!body) return false;
        if (SCOPE_MARKERS.test(body)) return true;
        return [...body.matchAll(/\b(\w+)\s*\(/g)].some((call) => walk(`${k.split(".")[0]}.${call[1]}`));
      };
      return walk(key);
    });
  });
  // Hoặc chính case của controller đã kiểm phạm vi (thiết kế "check ở web").
  if (jc.scopeInCase) hit.push({ useCase: "(controller)", method: "case-block" });
  const row = { action, scope, calls: jc.calls.map((c) => `${c.useCase}.${c.method}`), adminGated: jc.adminGated };
  if (hit.length) covered.push(row); else missing.push(row);
}

const label = (s) => `project=[${s.project.join(",") || "-"}] warehouse=[${s.warehouse.join(",") || "-"}]`;

console.log("═".repeat(96));
console.log("  ĐỐI CHIẾU TẦNG PHẠM VI  JS  ↔  JAVA   (canAccessProject / canAccessWarehouse)");
console.log("═".repeat(96));
console.log(`  Action JS có kiểm phạm vi: ${jsScope.size}`);
console.log(`  → Java CÓ dấu vết kiểm phạm vi: ${covered.length}`);
console.log(`  → Java KHÔNG kiểm phạm vi     : ${missing.length}   ← nhóm cần vá`);
console.log(`  → Không ánh xạ được sang Java : ${noMap.length}`);

console.log(`\n── JAVA KHÔNG KIỂM PHẠM VI (${missing.length}) ──`);
if (process.argv.includes("--missing")) {
  // Chế độ lập kế hoạch: in kèm use-case.phương thức để biết phải vá ở đâu.
  const byUseCase = new Map();
  for (const r of missing) {
    const key = r.calls.map((c) => c.split(".")[0]).join(",") || "(không rõ)";
    if (!byUseCase.has(key)) byUseCase.set(key, []);
    byUseCase.get(key).push(r);
  }
  for (const [useCase, rows] of [...byUseCase].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`\n   [${rows.length}] ${useCase}`);
    for (const r of rows) {
      console.log(`        ${r.action.padEnd(34)} ${label(r.scope).padEnd(46)} ${r.calls.join(" ")}`);
    }
  }
  console.log("\n" + "═".repeat(96));
  console.log(`  KẾT LUẬN: còn ${missing.length} action chưa kiểm phạm vi (${byUseCase.size} use-case)`);
  console.log("═".repeat(96));
  process.exit(1);
}
console.log("   'admin-gated' = case đó đã bị chặn admin-only ở controller (giảm nhẹ, không thay thế).");
console.log(missing.length
  ? missing.map((r) => `   ${r.action.padEnd(32)} ${label(r.scope).padEnd(46)} ${r.adminGated ? "[admin-gated]" : ""}`).join("\n")
  : "   (không có)");

console.log(`\n── JAVA ĐÃ KIỂM PHẠM VI (${covered.length}) ──`);
console.log(covered.length ? covered.map((r) => `   ${r.action.padEnd(32)} ${label(r.scope)}`).join("\n") : "   (không có)");

console.log(`\n── KHÔNG ÁNH XẠ ĐƯỢC (${noMap.length}) ──`);
console.log(noMap.length ? noMap.map((r) => `   ${r.action.padEnd(32)} ${label(r.scope)}  (${r.reason})`).join("\n") : "   (không có)");

console.log("\n" + "═".repeat(96));
console.log(missing.length === 0
  ? "  KẾT LUẬN: mọi action JS kiểm phạm vi đều được Java kiểm tương ứng ✅"
  : `  KẾT LUẬN: ${missing.length} action JS kiểm phạm vi nhưng Java KHÔNG kiểm ⚠ (lỗ hổng P0)`);
console.log("═".repeat(96));
process.exit(missing.length === 0 ? 0 : 1);
