// TASK-023b — 3 action cuối của ProjectContractUseCase (đủ 64/64).
//
// Vì sao phải khác các lô trước:
//   • Lớp ghi rõ trong chú thích: "quyền theo canAccessProject — check ở web" ⇒ thiết kế gốc CHỦ ĐÍCH
//     kiểm ở tầng web. Với `save_project_contract`, `projectId` có sẵn trong payload ⇒ kiểm ngay ở controller.
//   • `set_project_contract_status` và `delete_project_contract` phải tra bản ghi để lấy `row.project_id`
//     (đúng JS L809/L813) ⇒ phải đưa `Principal` vào use-case (interface Principal đã có sẵn nhưng chưa dùng).
//
// Ngữ nghĩa JS: L801 canAccessProject(projectId,true) "Không có quyền sửa hợp đồng dự án này."
//               L809/L813 canAccessProject(row.project_id,true) "Không có quyền tại dự án này."
import { readFileSync, writeFileSync } from "node:fs";

const S = "java-backend/application/src/main/java/com/vntech/erp/application/service/";
const F = S + "ProjectContractUseCase.java";
const CTRL = "java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java";
const BEANS = "java-backend/web/src/main/java/com/vntech/erp/web/config/ApplicationBeansConfig.java";

const CHECK = (expr, msg) =>
  `        accessScope.requireProjectAccess(principal.userId(), principal.role(), ${expr}, true,\n`
  + `                "${msg}");\n`;

const EDITS = [
  // ── ProjectContractUseCase: import + trường + ctor ─────────────────────────────────────────
  { file: F,
    from: "import com.vntech.erp.application.rbac.RbacService;",
    to: "import com.vntech.erp.application.rbac.AccessScopeService;\nimport com.vntech.erp.application.rbac.RbacService;" },
  { file: F,
    from: `    private final ProjectAdminStore store;
    private final IdGenerator idGenerator;

    public ProjectContractUseCase(ProjectAdminStore store, IdGenerator idGenerator) {
        this.store = store;
        this.idGenerator = idGenerator;
    }`,
    to: `    private final ProjectAdminStore store;
    private final IdGenerator idGenerator;
    private final AccessScopeService accessScope;

    public ProjectContractUseCase(ProjectAdminStore store, IdGenerator idGenerator, AccessScopeService accessScope) {
        this.store = store;
        this.idGenerator = idGenerator;
        this.accessScope = accessScope;
    }` },

  // ── set_project_contract_status: thêm Principal + kiểm phạm vi của CHÍNH hợp đồng ──────────
  { file: F,
    from: `    public String setProjectContractStatus(String contractId, boolean active) {
        Map<String, Object> row = store.findContract(contractId);
        if (row == null) throw Api("Không tìm thấy hợp đồng.");
`,
    to: `    public String setProjectContractStatus(Principal principal, String contractId, boolean active) {
        Map<String, Object> row = store.findContract(contractId);
        if (row == null) throw Api("Không tìm thấy hợp đồng.");
        // JS 809: phạm vi dự án của CHÍNH hợp đồng (tra từ DB, không lấy từ payload).
` + CHECK(`sv(row, "project_id")`, "Không có quyền tại dự án này.") },

  // ── delete_project_contract ────────────────────────────────────────────────────────────────
  { file: F,
    from: `    public String deleteProjectContract(String contractId, Map<String, Object> payload) {
        Map<String, Object> row = store.findContract(contractId);
        if (row == null) throw Api("Không tìm thấy hợp đồng.");
`,
    to: `    public String deleteProjectContract(Principal principal, String contractId, Map<String, Object> payload) {
        Map<String, Object> row = store.findContract(contractId);
        if (row == null) throw Api("Không tìm thấy hợp đồng.");
        // JS 813: phạm vi dự án của CHÍNH hợp đồng.
` + CHECK(`sv(row, "project_id")`, "Không có quyền tại dự án này.") },

  // ── Controller: tiêm AccessScopeService ────────────────────────────────────────────────────
  { file: CTRL,
    from: "    private final com.vntech.erp.application.rbac.RbacService rbacService;\n",
    to: "    private final com.vntech.erp.application.rbac.RbacService rbacService;\n"
      + "    /** TASK-023b — kiểm PHẠM VI dự án ở tầng web (đúng chú thích của ProjectContractUseCase). */\n"
      + "    private final com.vntech.erp.application.rbac.AccessScopeService accessScopeService;\n" },

  // ── Controller: save_project_contract — kiểm phạm vi ngay ở web ─────────────────────────────
  { file: CTRL,
    from: `                case "save_project_contract" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = projectContractUseCase.saveProjectContract(
                            trim(payload.get("projectId")), payload);
`,
    to: `                case "save_project_contract" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    String projectId = trim(payload.get("projectId"));
                    // JS 801.
                    accessScopeService.requireProjectAccess(cu.id(), cu.role(), projectId, true,
                            "Không có quyền sửa hợp đồng dự án này.");
                    Map<String, Object> result = projectContractUseCase.saveProjectContract(projectId, payload);
` },

  // ── Controller: 2 case còn lại truyền Principal ─────────────────────────────────────────────
  { file: CTRL,
    from: `                    String m = projectContractUseCase.setProjectContractStatus(
                            trim(payload.get("contractId")), toActiveFlag(payload.get("active")));`,
    to: `                    String m = projectContractUseCase.setProjectContractStatus(
                            asProjectContractPrincipal(cu), trim(payload.get("contractId")),
                            toActiveFlag(payload.get("active")));` },
  { file: CTRL,
    from: `                    String m = projectContractUseCase.deleteProjectContract(
                            trim(payload.get("contractId")), payload);`,
    to: `                    String m = projectContractUseCase.deleteProjectContract(
                            asProjectContractPrincipal(cu), trim(payload.get("contractId")), payload);` },

  // ── Controller: helper Principal cho ProjectContractUseCase ────────────────────────────────
  { file: CTRL,
    from: "    private static AdminSystemUseCase.Principal asAdminPrincipal(AuthUseCase.CurrentUser cu) {",
    to: `    private static ProjectContractUseCase.Principal asProjectContractPrincipal(AuthUseCase.CurrentUser cu) {
        return new ProjectContractUseCase.Principal() {
            @Override public String userId() { return cu.id(); }
            @Override public String role() { return cu.role(); }
        };
    }

    private static AdminSystemUseCase.Principal asAdminPrincipal(AuthUseCase.CurrentUser cu) {` },
];

const cache = new Map();
function load(path) {
  if (!cache.has(path)) {
    const raw = readFileSync(path, "utf8");
    cache.set(path, { crlf: raw.includes("\r\n"), text: raw.replace(/\r\n/g, "\n") });
  }
  return cache.get(path);
}

let failed = 0, applied = 0, skipped = 0;
const rows = [];
for (const edit of EDITS) {
  const entry = load(edit.file);
  const name = edit.file.split("/").pop();
  // Kiểm `to` TRƯỚC `from` — bài học idempotency (xem commit #32).
  if (entry.text.includes(edit.to)) { skipped++; rows.push(`  BO  ${name} (da ap dung)`); }
  else if (entry.text.includes(edit.from)) {
    const n = entry.text.split(edit.from).length - 1;
    if (n !== 1) { failed++; rows.push(`  X   NEO KHONG DUY NHAT (${n}) ${name}: ${edit.from.trim().split("\n")[0].slice(0, 44)}`); continue; }
    entry.text = entry.text.replace(edit.from, edit.to);
    applied++; rows.push(`  APD ${name}  ${edit.from.trim().split("\n")[0].slice(0, 52)}`);
  } else { failed++; rows.push(`  X   ${name} KHONG KHOP: ${edit.from.trim().split("\n")[0].slice(0, 52)}`); }
}

// Controller constructor: thêm tham số + gán
const ctrl = load(CTRL);
if (!ctrl.text.includes("this.accessScopeService = accessScopeService;")) {
  // Chèn tham số ngay sau tham số RbacService của constructor (nếu có), nếu không thì sau ProjectContractUseCase.
  let done = false;
  for (const anchor of ["RbacService rbacService,", "ProjectContractUseCase projectContractUseCase,"]) {
    const i = ctrl.text.indexOf(anchor);
    if (i < 0) continue;
    const indent = (ctrl.text.slice(0, i).match(/\n(\s*)\S[^\n]*$/) || [, "                            "])[1];
    ctrl.text = ctrl.text.slice(0, i + anchor.length)
      + `\n${indent}com.vntech.erp.application.rbac.AccessScopeService accessScopeService,`
      + ctrl.text.slice(i + anchor.length);
    done = true;
    break;
  }
  const assign = "        this.rbacService = rbacService;\n";
  if (done && ctrl.text.includes(assign)) {
    ctrl.text = ctrl.text.replace(assign, assign + "        this.accessScopeService = accessScopeService;\n");
    applied++; rows.push("  APD controller ctor nhan accessScopeService");
  } else { failed++; rows.push("  X   controller ctor: khong chen duoc tham so/gán"); }
} else { skipped++; rows.push("  BO  controller ctor"); }

// Bean projectContractUseCase nhận AccessScopeService
const beans = load(BEANS);
if (/new ProjectContractUseCase\([^)]*accessScopeService/.test(beans.text)) { skipped++; rows.push("  BO  bean projectContract"); }
else {
  const bsig = /public\s+ProjectContractUseCase\s+projectContractUseCase\s*\(([\s\S]*?)\)\s*\{/.exec(beans.text);
  const bctor = /new ProjectContractUseCase\(([^)]*)\)/.exec(beans.text);
  if (!bsig || !bctor) { failed++; rows.push("  X   khong khop bean projectContractUseCase"); }
  else {
    const indent = (bsig[1].match(/\n(\s*)\S/) || [, "                                                          "])[1];
    beans.text = beans.text.slice(0, bsig.index)
      + `public ProjectContractUseCase projectContractUseCase(${bsig[1].replace(/\s*$/, "")},\n${indent}AccessScopeService accessScopeService) {`
      + beans.text.slice(bsig.index + bsig[0].length);
    const b2 = /new ProjectContractUseCase\(([^)]*)\)/.exec(beans.text);
    beans.text = beans.text.slice(0, b2.index)
      + `new ProjectContractUseCase(${b2[1]}, accessScopeService)`
      + beans.text.slice(b2.index + b2[0].length);
    applied++; rows.push("  APD bean projectContractUseCase");
  }
}

if (failed === 0) {
  for (const [path, entry] of cache) {
    writeFileSync(path, entry.crlf ? entry.text.replace(/\n/g, "\r\n") : entry.text, "utf8");
  }
}

console.log("=== TASK-023b: 3 action ProjectContractUseCase ===");
console.log(rows.join("\n"));
console.log(`\nAp dung: ${applied} · Bo qua: ${skipped} · Loi: ${failed}`);
if (failed) console.log("(Co loi nen KHONG ghi tep)");
process.exit(failed === 0 ? 0 : 1);
