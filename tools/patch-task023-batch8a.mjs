// TASK-023 LÔ 8a — nối phạm vi cho 7 action còn lại (nhóm dễ).
//
// Ngữ nghĩa NGUYÊN VĂN từ scripts/system-route.mjs:
//   create_project_team   L1487 canAccessProject(projectId,true) "CHT chỉ được tạo tổ đội trong dự án được phân quyền."
//   create_work_item      L1153 canAccessProject(projectId,true) CHỈ KHI projectId KHÁC RỖNG "Không có quyền tại dự án."
//   save_mar_approval     L1253 canAccessProject(projectId,true) "Không có quyền tại dự án này."
//   create_request        L907  canAccessProject(projectId,true) "Tài khoản không được lập đơn cho dự án này."
//   decide_approval       L1076 canAccessProject(mr.projectId,true) "Tài khoản không có quyền tại dự án."
//   preview_request_import L865 canAccessProject(projectId,true) "Tài khoản không được lập đơn cho dự án này."
//   save_warehouse_location L1273 canAccessWarehouse(warehouseId,true) "Không có quyền cấu hình vị trí tại kho này."
//
// LƯU Ý QUAN TRỌNG: create_work_item kiểm CÓ ĐIỀU KIỆN (`if(projectId && …)`) — công việc phòng ban
// KHÔNG gắn dự án vẫn hợp lệ. Không được biến nó thành kiểm vô điều kiện (sẽ chặn oan).
import { readFileSync, writeFileSync } from "node:fs";

const S = "java-backend/application/src/main/java/com/vntech/erp/application/service/";
const CTRL = "java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java";
const BEANS = "java-backend/web/src/main/java/com/vntech/erp/web/config/ApplicationBeansConfig.java";

const P = (expr, msg) =>
  `        accessScope.requireProjectAccess(principal.userId(), principal.role(), ${expr}, true,\n`
  + `                "${msg}");\n`;
const W = (expr, msg) =>
  `        accessScope.requireWarehouseAccess(principal.userId(), principal.role(),\n`
  + `                principal.warehouseScopeKind(), ${expr}, true,\n`
  + `                "${msg}");\n`;

const EDITS = [
  // ── OpsTaskManagementUseCase (đã có rbac, CHƯA có accessScope) ─────────────────────────────
  { file: S + "OpsTaskManagementUseCase.java",
    from: "import com.vntech.erp.application.rbac.RbacService;",
    to: "import com.vntech.erp.application.rbac.AccessScopeService;\nimport com.vntech.erp.application.rbac.RbacService;" },
  { file: S + "OpsTaskManagementUseCase.java",
    from: "    private final RbacService rbac;\n",
    to: "    private final RbacService rbac;\n    private final AccessScopeService accessScope;\n" },

  // 1) create_project_team
  { file: S + "OpsTaskManagementUseCase.java",
    from: `        rbac.requireRole(principalAsCurrent(principal), List.of("commander", "admin"));
        String projectId = trim(payload.get("projectId"));
        String code = trim(payload.get("code")).toUpperCase(Locale.ROOT);
`,
    to: `        rbac.requireRole(principalAsCurrent(principal), List.of("commander", "admin"));
        String projectId = trim(payload.get("projectId"));
        // JS 1487.
` + P("projectId", "CHT chỉ được tạo tổ đội trong dự án được phân quyền.") + `        String code = trim(payload.get("code")).toUpperCase(Locale.ROOT);
` },

  // 2) create_work_item — CÓ ĐIỀU KIỆN
  { file: S + "OpsTaskManagementUseCase.java",
    from: `            throw Api("Giao việc thủ công chỉ dùng cho công việc không có nghiệp vụ nguồn. Task từ ERP phải được hệ thống tự sinh.");
`,
    to: `            throw Api("Giao việc thủ công chỉ dùng cho công việc không có nghiệp vụ nguồn. Task từ ERP phải được hệ thống tự sinh.");
        // JS 1153: CHỈ kiểm khi projectId KHÁC RỖNG — công việc phòng ban không gắn dự án vẫn hợp lệ.
        String scopeProjectId = trim(payload.get("projectId"));
        if (!scopeProjectId.isEmpty()
                && !accessScope.canAccessProject(principal.userId(), principal.role(), scopeProjectId, true)) {
            throw Api("Không có quyền tại dự án.");
        }
` },

  // 3) save_mar_approval
  { file: S + "OpsTaskManagementUseCase.java",
    from: `        rbac.requireRole(principalAsCurrent(principal), List.of("project", "procurement", "admin"));
        String projectId = trim(payload.get("projectId"));
        String materialId = trim(payload.get("materialId"));
`,
    to: `        rbac.requireRole(principalAsCurrent(principal), List.of("project", "procurement", "admin"));
        String projectId = trim(payload.get("projectId"));
        // JS 1253.
` + P("projectId", "Không có quyền tại dự án này.") + `        String materialId = trim(payload.get("materialId"));
` },

  // ── RequestManagementUseCase (đã có rbac + accessScope) ────────────────────────────────────
  // 4) create_request
  { file: S + "RequestManagementUseCase.java",
    from: `        rbac.requireRole(principalAsCurrent(principal), List.of("engineer", "commander", "admin"));
        String projectId = trim(payload.get("projectId"));
        String neededAt = trim(payload.get("neededAt"));
`,
    to: `        rbac.requireRole(principalAsCurrent(principal), List.of("engineer", "commander", "admin"));
        String projectId = trim(payload.get("projectId"));
        // JS 907.
` + P("projectId", "Tài khoản không được lập đơn cho dự án này.") + `        String neededAt = trim(payload.get("neededAt"));
` },

  // 5) decide_approval
  { file: S + "RequestManagementUseCase.java",
    from: `        Map<String, Object> mr = store.findRequestForApproval(requestId)
                .orElseThrow(() -> Api("Không tìm thấy đơn yêu cầu."));
        if (!canApproveRequestStage(principal.userId(), requestId, stage))
`,
    to: `        Map<String, Object> mr = store.findRequestForApproval(requestId)
                .orElseThrow(() -> Api("Không tìm thấy đơn yêu cầu."));
        // JS 1076: phạm vi dự án của CHÍNH đơn (findRequestForApproval alias projectId).
` + P(`sv(mr, "projectId")`, "Tài khoản không có quyền tại dự án.") + `        if (!canApproveRequestStage(principal.userId(), requestId, stage))
` },

  // ── AdminOpsManagementUseCase (đã có rbac, CHƯA có accessScope) ────────────────────────────
  { file: S + "AdminOpsManagementUseCase.java",
    from: "import com.vntech.erp.application.rbac.RbacService;",
    to: "import com.vntech.erp.application.rbac.AccessScopeService;\nimport com.vntech.erp.application.rbac.RbacService;" },
  { file: S + "AdminOpsManagementUseCase.java",
    from: "    private final RbacService rbac;\n",
    to: "    private final RbacService rbac;\n    private final AccessScopeService accessScope;\n" },
  // 6) preview_request_import
  { file: S + "AdminOpsManagementUseCase.java",
    from: `        if (rawLines.size() > 100) throw Api("Mỗi phiếu đề nghị được nhập tối đa 100 dòng vật tư.");
`,
    to: `        if (rawLines.size() > 100) throw Api("Mỗi phiếu đề nghị được nhập tối đa 100 dòng vật tư.");
        // JS 865.
` + P("projectId", "Tài khoản không được lập đơn cho dự án này.") },

  // ── AdminSystemUseCase (đã có rbac; cần accessScope + warehouseScopeKind) ──────────────────
  { file: S + "AdminSystemUseCase.java",
    from: "import com.vntech.erp.application.rbac.RbacService;",
    to: "import com.vntech.erp.application.rbac.AccessScopeService;\nimport com.vntech.erp.application.rbac.RbacService;" },
  { file: S + "AdminSystemUseCase.java",
    from: "    private final RbacService rbac;\n",
    to: "    private final RbacService rbac;\n    private final AccessScopeService accessScope;\n" },
  // 7) save_warehouse_location
  { file: S + "AdminSystemUseCase.java",
    from: `        if (store.findWarehouse(warehouseId).isEmpty()) throw Api("Kho không còn tồn tại.");
`,
    to: `        if (store.findWarehouse(warehouseId).isEmpty()) throw Api("Kho không còn tồn tại.");
        // JS 1273.
` + W("warehouseId", "Không có quyền cấu hình vị trí tại kho này.") },
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
  // THỨ TỰ KIỂM RẤT QUAN TRỌNG — bài học từ lỗi idempotency đã gỡ ở commit #31:
  // với phép "chèn sau một dòng neo", `from` (dòng neo) VẪN CÒN sau khi chèn, nên nếu kiểm `from`
  // trước thì lần chạy thứ hai sẽ CHÈN LẶP. Phải kiểm `to` (nội dung đã-áp-dụng) TRƯỚC.
  if (entry.text.includes(edit.to)) {
    skipped++; rows.push(`  BO  ${name}  (da ap dung)`);
  } else if (entry.text.includes(edit.from)) {
    const n = entry.text.split(edit.from).length - 1;
    if (n !== 1) { failed++; rows.push(`  X   NEO KHONG DUY NHAT (${n}) ${name}: ${edit.from.trim().split("\n")[0].slice(0, 44)}`); continue; }
    entry.text = entry.text.replace(edit.from, edit.to);
    applied++; rows.push(`  APD ${name}  ${edit.from.trim().split("\n")[0].slice(0, 50)}`);
  } else {
    failed++; rows.push(`  X   ${name} KHONG KHOP: ${edit.from.trim().split("\n")[0].slice(0, 50)}`);
  }
}

// Principal cua AdminSystem: them warehouseScopeKind (nếu chưa có)
const admin = load(S + "AdminSystemUseCase.java");
if (!admin.text.includes("default String warehouseScopeKind()")) {
  const re = /(    public interface Principal \{\n(?:        String \w+\(\);\n)+)(    \})/;
  const m = re.exec(admin.text);
  if (m) {
    admin.text = admin.text.slice(0, m.index + m[1].length)
      + `\n        /** Loại phạm vi kho (site | central); rỗng ⇒ coi như "site". */\n        default String warehouseScopeKind() { return ""; }\n`
      + admin.text.slice(m.index + m[1].length);
    applied++; rows.push("  APD AdminSystem.Principal them warehouseScopeKind()");
  } else { failed++; rows.push("  X   khong thay interface Principal cua AdminSystem"); }
} else { skipped++; rows.push("  BO  AdminSystem warehouseScopeKind"); }

if (!admin.text.includes("p.warehouseScopeKind()")) {
  const from2 = "p.role(), p.role(), p.role(),\n                null, null, null, false);";
  if (admin.text.includes(from2)) {
    admin.text = admin.text.replace(from2, "p.role(), p.role(), p.role(),\n                p.warehouseScopeKind(), null, null, false);");
    applied++; rows.push("  APD AdminSystem.principalAsCurrent truyen warehouseScopeKind");
  } else { failed++; rows.push("  X   khong khop principalAsCurrent cua AdminSystem"); }
} else { skipped++; rows.push("  BO  AdminSystem principalAsCurrent"); }

// constructor cua 3 use-case nhan AccessScopeService
for (const [cls, file] of [["OpsTaskManagementUseCase", S + "OpsTaskManagementUseCase.java"],
                           ["AdminOpsManagementUseCase", S + "AdminOpsManagementUseCase.java"],
                           ["AdminSystemUseCase", S + "AdminSystemUseCase.java"]]) {
  const entry = load(file);
  if (/AccessScopeService\s+accessScope\)/.test(entry.text)) { skipped++; continue; }
  const re = new RegExp(`public\\s+${cls}\\s*\\(([^)]*)\\)\\s*\\{`);
  const m = re.exec(entry.text);
  if (!m) { failed++; rows.push(`  X   khong thay ctor ${cls}`); continue; }
  entry.text = entry.text.slice(0, m.index)
    + `public ${cls}(${m[1].trim()}, AccessScopeService accessScope) {`
    + entry.text.slice(m.index + m[0].length);
  // AdminSystemUseCase có constructor 4 tham số ⇒ `this.rbac = rbac;` KHÔNG đứng ngay trước `}`.
  // Neo đúng là chính dòng gán đó (kiểm duy nhất trước khi thay).
  const before = entry.text;
  const assign = "        this.rbac = rbac;\n";
  const nAssign = entry.text.split(assign).length - 1;
  if (nAssign !== 1) { failed++; rows.push(`  X   ctor ${cls}: dong 'this.rbac = rbac;' xuat hien ${nAssign} lan`); continue; }
  entry.text = entry.text.replace(assign, assign + "        this.accessScope = accessScope;\n");
  if (entry.text === before) { failed++; rows.push(`  X   ctor ${cls}: khong thay doi duoc`); }
  else { applied++; rows.push(`  APD ctor ${cls}`); }
}

// controller: asAdminPrincipal truyen warehouseScopeKind
const ctrl = load(CTRL);
const sig = "asAdminPrincipal(AuthUseCase.CurrentUser cu) {";
const at = ctrl.text.indexOf(sig);
if (at < 0) { failed++; rows.push("  X   khong thay asAdminPrincipal"); }
else if (ctrl.text.slice(at, at + 900).includes("warehouseScopeKind()")) { skipped++; rows.push("  BO  asAdminPrincipal"); }
else {
  const anchor = "@Override public String role() { return cu.role(); }";
  const a = ctrl.text.indexOf(anchor, at);
  if (a < 0 || a > at + 900) { failed++; rows.push("  X   asAdminPrincipal khong co dong role()"); }
  else {
    const insertAt = a + anchor.length;
    ctrl.text = ctrl.text.slice(0, insertAt)
      + "\n            @Override public String warehouseScopeKind() { return cu.warehouseScopeKind(); }"
      + ctrl.text.slice(insertAt);
    applied++; rows.push("  APD asAdminPrincipal truyen warehouseScopeKind");
  }
}

// bean cho 3 use-case
for (const [beanName, cls] of [["opsTaskManagementUseCase", "OpsTaskManagementUseCase"],
                               ["adminOpsManagementUseCase", "AdminOpsManagementUseCase"],
                               ["adminSystemUseCase", "AdminSystemUseCase"]]) {
  const beans = load(BEANS);
  if (new RegExp(`new ${cls}\\([^)]*accessScopeService`).test(beans.text)) { skipped++; continue; }
  const bsig = new RegExp(`public\\s+${cls}\\s+${beanName}\\s*\\(([\\s\\S]*?)\\)\\s*\\{`).exec(beans.text);
  const bctor = new RegExp(`new ${cls}\\(([^)]*)\\)`).exec(beans.text);
  if (!bsig || !bctor) { failed++; rows.push(`  X   khong khop bean ${beanName}`); continue; }
  const indent = (bsig[1].match(/\n(\s*)\S/) || [, "                                                             "])[1];
  beans.text = beans.text.slice(0, bsig.index)
    + `public ${cls} ${beanName}(${bsig[1].replace(/\s*$/, "")},\n${indent}AccessScopeService accessScopeService) {`
    + beans.text.slice(bsig.index + bsig[0].length);
  const b2 = new RegExp(`new ${cls}\\(([^)]*)\\)`).exec(beans.text);
  beans.text = beans.text.slice(0, b2.index)
    + `new ${cls}(${b2[1]}, accessScopeService)`
    + beans.text.slice(b2.index + b2[0].length);
  applied++; rows.push(`  APD bean ${beanName}`);
}

if (failed === 0) {
  for (const [path, entry] of cache) {
    writeFileSync(path, entry.crlf ? entry.text.replace(/\n/g, "\r\n") : entry.text, "utf8");
  }
}

console.log("=== TASK-023 LO 8a: 7 action con lai ===");
console.log(rows.join("\n"));
console.log(`\nAp dung: ${applied} · Bo qua: ${skipped} · Loi: ${failed}`);
if (failed) console.log("(Co loi nen KHONG ghi tep)");
process.exit(failed === 0 ? 0 : 1);
