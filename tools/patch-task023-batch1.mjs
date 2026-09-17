// TASK-023 — LÔ ĐẦU: hạ tầng kiểm PHẠM VI dùng chung + vá action đầu tiên (cancel_request).
//
// Bối cảnh: cổng tools/probe-action-scope-parity.mjs đo được 64 action JS có kiểm phạm vi dự án/kho
// nhưng Java kiểm 0. Đây là lỗ hổng P0. Không vá rải rác — xây một dịch vụ dùng chung
// (AccessScopeService + port AccessScopeStore) rồi lần lượt nối vào từng action.
//
// Lô này: đăng ký bean + nối cancel_request (JS kiểm `canAccessProject(user, mr.projectId, true)`
// TRƯỚC khi kiểm vai trò).
import { readFileSync, writeFileSync } from "node:fs";

const R = "java-backend/application/src/main/java/com/vntech/erp/application/service/";
const BEANS = "java-backend/web/src/main/java/com/vntech/erp/web/config/ApplicationBeansConfig.java";

const EDITS = [
  // ── A. import cho ApplicationBeansConfig ───────────────────────────────────────────────────
  { file: BEANS,
    from: 'import com.vntech.erp.application.port.out.AdminSystemStore;',
    to: 'import com.vntech.erp.application.port.out.AccessScopeStore;\nimport com.vntech.erp.application.port.out.AdminSystemStore;' },
  { file: BEANS,
    from: 'import com.vntech.erp.application.rbac.RbacService;',
    to: 'import com.vntech.erp.application.rbac.AccessScopeService;\nimport com.vntech.erp.application.rbac.RbacService;' },

  // ── B. bean AccessScopeService ─────────────────────────────────────────────────────────────
  { file: BEANS,
    from: '    @Bean\n    public RbacService rbacService(ModulePermissionStore modulePermissionStore) {\n'
        + '        return new RbacService(modulePermissionStore);\n    }',
    to: '    @Bean\n    public RbacService rbacService(ModulePermissionStore modulePermissionStore) {\n'
        + '        return new RbacService(modulePermissionStore);\n    }\n\n'
        + '    /** Port nguyên trạng canAccessProject()/canAccessWarehouse() — kiểm PHẠM VI dự án/kho (TASK-023). */\n'
        + '    @Bean\n    public AccessScopeService accessScopeService(AccessScopeStore accessScopeStore,\n'
        + '                                                 ModulePermissionStore modulePermissionStore) {\n'
        + '        return new AccessScopeService(accessScopeStore, modulePermissionStore);\n    }' },

  // ── C. RequestManagementUseCase: import + trường + constructor ─────────────────────────────
  { file: R + "RequestManagementUseCase.java",
    from: 'import com.vntech.erp.application.rbac.RbacService;',
    to: 'import com.vntech.erp.application.rbac.AccessScopeService;\nimport com.vntech.erp.application.rbac.RbacService;' },
  { file: R + "RequestManagementUseCase.java",
    from: '    private final RbacService rbac;\n\n'
        + '    public RequestManagementUseCase(RequestStore store, IdGenerator idGenerator, RbacService rbac) {\n'
        + '        this.store = store;\n        this.idGenerator = idGenerator;\n        this.rbac = rbac;\n    }',
    to: '    private final RbacService rbac;\n    private final AccessScopeService accessScope;\n\n'
        + '    public RequestManagementUseCase(RequestStore store, IdGenerator idGenerator, RbacService rbac,\n'
        + '                                    AccessScopeService accessScope) {\n'
        + '        this.store = store;\n        this.idGenerator = idGenerator;\n        this.rbac = rbac;\n'
        + '        this.accessScope = accessScope;\n    }' },

  // ── E. cancel_request: kiểm phạm vi dự án TRƯỚC khi kiểm vai trò (đúng thứ tự JS) ──────────
  { file: R + "RequestManagementUseCase.java",
    from: '        Map<String, Object> mr = store.findRequestBasic(requestId)\n'
        + '                .orElseThrow(() -> Api("Không tìm thấy phiếu đề nghị."));\n'
        + '        if (!"commander".equals(cancelBaseRole(principal))',
    to: '        Map<String, Object> mr = store.findRequestBasic(requestId)\n'
        + '                .orElseThrow(() -> Api("Không tìm thấy phiếu đề nghị."));\n'
        + '        // JS 1048: canAccessProject(user, mr.projectId, true) — kiểm TRƯỚC khi kiểm vai trò.\n'
        + '        accessScope.requireProjectAccess(principal.userId(), principal.role(),\n'
        + '                sv(mr, "projectId"), true, "Tài khoản không có quyền tại dự án.");\n'
        + '        if (!"commander".equals(cancelBaseRole(principal))' },
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
  if (entry.text.includes(edit.from)) {
    entry.text = entry.text.split(edit.from).join(edit.to);
    applied++; rows.push(`  APD ${name}  ${edit.from.slice(0, 48).replace(/\n/g, "|")}`);
  } else if (entry.text.includes(edit.to)) {
    skipped++; rows.push(`  BO  ${name}`);
  } else {
    failed++; rows.push(`  X   ${name}  KHONG KHOP: ${edit.from.slice(0, 48).replace(/\n/g, "|")}`);
  }
}

// ── F. bean requestManagementUseCase: thêm tham số + đối số ─────────────────────────────────
const beans = load(BEANS);
const beanName = "requestManagementUseCase";
const sigRe = new RegExp(`public\\s+RequestManagementUseCase\\s+${beanName}\\s*\\(([\\s\\S]*?)\\)\\s*\\{`);
const ctorRe = /new RequestManagementUseCase\(([^)]*)\)/;
if (beans.text.includes("accessScopeService,") || /RequestManagementUseCase\([^)]*accessScopeService[^)]*\)/.test(beans.text)) {
  skipped++; rows.push("  BO  bean requestManagementUseCase");
} else {
  const sig = sigRe.exec(beans.text);
  const ctor = ctorRe.exec(beans.text);
  if (!sig || !ctor) { failed++; rows.push("  X   bean requestManagementUseCase — khong khop chữ ký/lời gọi"); }
  else {
    const params = sig[1];
    const indent = (params.match(/\n(\s*)\S/) || [, "                                                             "])[1];
    beans.text = beans.text.slice(0, sig.index)
        + `public RequestManagementUseCase ${beanName}(${params.replace(/\s*$/, "")},\n${indent}AccessScopeService accessScopeService) {`
        + beans.text.slice(sig.index + sig[0].length);
    const ctor2 = ctorRe.exec(beans.text);          // tìm lại sau khi chèn
    beans.text = beans.text.slice(0, ctor2.index)
        + `new RequestManagementUseCase(${ctor2[1]}, accessScopeService)`
        + beans.text.slice(ctor2.index + ctor2[0].length);
    applied++; rows.push("  APD bean requestManagementUseCase nhan accessScopeService");
  }
}

for (const [path, entry] of cache) {
  writeFileSync(path, entry.crlf ? entry.text.replace(/\n/g, "\r\n") : entry.text, "utf8");
}

console.log("=== TASK-023 LO DAU: ha tang pham vi + cancel_request ===");
console.log(rows.join("\n"));
console.log(`\nAp dung moi: ${applied} · Bo qua: ${skipped} · Loi: ${failed}`);
process.exit(failed === 0 ? 0 : 1);
