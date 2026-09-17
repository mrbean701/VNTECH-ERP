// Kiểm tra 12 action JAVA-ONLY: mỗi action có bị "mặc định từ chối" oan không?
//
// BỐI CẢNH (đọc từ mã, không suy đoán):
//   RbacService.requireActionModule:
//       if (PUBLIC_ACTIONS.contains(action)) return;
//       required = ActionRbacRegistry.modulesFor(action);
//       if (isAdmin(user)) return;                      <-- admin luôn qua
//       if (isCompanyLeadership(user) && !required.contains("admin")) return;
//       if (required.isEmpty()) throw 403 "Thao tác chưa được khai báo quyền trong hệ thống."
//       ... kiểm quyền module
//
//   ⇒ module = []  nghĩa là **MẶC ĐỊNH TỪ CHỐI** với mọi người trừ admin / lãnh đạo công ty.
//
// CÂU HỎI: 8 trong 12 action Java-only có module rỗng. Việc từ chối đó có CHÍNH ĐÁNG không?
//   CHÍNH ĐÁNG nếu controller đã chặn bằng requireRequireAdmin (tức vốn chỉ admin dùng được).
//   HỎNG nếu KHÔNG chặn admin + lại có người dùng thường gọi → mất chức năng thật.
//
// Chạy: node tools/audit-java-only-actions.mjs
import { readFileSync } from "node:fs";

const CTRL = "java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java";
const REGISTRY = "java-backend/application/src/main/java/com/vntech/erp/application/rbac/ActionRbacRegistry.java";
const UI = "app/page.tsx";

const JAVA_ONLY = [
  "create_self_work_item", "delete_department_permission", "delete_system_level", "delete_workflow",
  "rebuild_department_permissions", "save_department_permission", "save_system_level", "save_workflow",
  "set_system_level_status", "set_user_system_level", "set_workflow_status", "system_level_impact",
];

const ctrl = readFileSync(CTRL, "utf8");
const registry = readFileSync(REGISTRY, "utf8");
const ui = readFileSync(UI, "utf8");

// Cắt từng nhánh `case "action" -> { ... }` bằng cách đếm ngoặc (case có thể dài nhiều dòng).
function caseBlock(src, action) {
  const marker = `case "${action}" ->`;
  const at = src.indexOf(marker);
  if (at < 0) return null;
  const open = src.indexOf("{", at);
  if (open < 0) return null;
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    if (c === "{") depth++;
    else if (c === "}") { depth--; if (depth === 0) return src.slice(open, i + 1); }
  }
  return null;
}

const modulesOf = (action) => {
  const m = registry.match(new RegExp(`Map\\.entry\\("${action}",\\s*List\\.of\\(([^)]*)\\)`));
  return m ? [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]) : null; // null = không khai
};

console.log("action".padEnd(34) + "module".padEnd(26) + "controller".padEnd(22) + "UI gọi?");
console.log("-".repeat(100));

const rows = [];
for (const a of JAVA_ONLY) {
  const mods = modulesOf(a);
  const block = caseBlock(ctrl, a);
  const guard = !block ? "KHÔNG có case"
    : /requireRequireAdmin\(/.test(block) ? "requireRequireAdmin"
      : /requireCurrentUser\(/.test(block) ? "chỉ cần đăng nhập" : "?";
  // UI có gọi action này không (theo TÊN action trong chuỗi submit/call)?
  const uiUses = new RegExp(`["']${a}["']`).test(ui);
  const verdict = !mods || mods.length === 0
    ? (guard === "requireRequireAdmin" ? "OK (đã chỉ admin)" : "⚠ CẦN XEM: module rỗng mà KHÔNG chặn admin")
    : "có module → kiểm theo module";
  rows.push({ a, mods, guard, uiUses, verdict });
  console.log(
    a.padEnd(34)
    + (mods === null ? "(không khai)" : `[${mods.join(", ")}]`).padEnd(26)
    + guard.padEnd(22)
    + (uiUses ? "CÓ" : "không")
  );
}

const risky = rows.filter((r) => r.mods !== null && r.mods.length === 0 && r.guard !== "requireRequireAdmin");
console.log("\n=== KẾT LUẬN ===");
console.log(`  Action Java-only: ${JAVA_ONLY.length}`);
console.log(`  Có module rỗng (mặc định từ chối): ${rows.filter((r) => r.mods && r.mods.length === 0).length}`);
console.log(`  Rủi ro (rỗng module + KHÔNG chặn admin): ${risky.length}`);
for (const r of risky) console.log(`    ⚠ ${r.a} — controller: ${r.guard} — UI gọi: ${r.uiUses ? "CÓ" : "không"}`);
console.log(risky.length === 0
  ? "\n✅ Mọi action module-rỗng đều đã được controller chặn admin ⇒ việc mặc định từ chối là CHÍNH ĐÁNG."
  : "\n⚠ Cần rà các action ở trên.");
process.exit(risky.length === 0 ? 0 : 1);
