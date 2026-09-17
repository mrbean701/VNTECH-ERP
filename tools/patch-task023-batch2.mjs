// TASK-023 LÔ 2 — nối phạm vi cho StockManagementUseCase (4 action đầu).
//
// Nguồn ngữ nghĩa (trích nguyên văn bằng tools/show-js-scope-checks.mjs + đọc scripts/system-route.mjs):
//   issue_stock       L1510: requireRole → canAccessProject(projectId,true)   "Tài khoản không có quyền cấp phát tại dự án này."
//                             → canAccessWarehouse(fromWarehouseId,true)     "Tài khoản không có quyền xuất tại kho này."
//   return_stock      L1515: requireRole → canAccessProject(projectId,true)   "Tài khoản không có quyền hoàn trả tại dự án này."
//                             → canAccessWarehouse(toWarehouseId,true)       "Tài khoản không có quyền nhận hoàn trả tại kho này."
//   create_stock_count L1527/1532: requireRole → canAccessProject(projectId,true) "Tài khoản không có quyền kiểm kê tại dự án này."
//                             (tra kho + kiểm đúng dự án) → canAccessWarehouse(warehouseId,true) "Tài khoản không có quyền kiểm kê kho này."
//   approve_stock_count L1555/1557: requireRole → (tra phiếu + kiểm trạng thái)
//                             → canAccessProject(count.projectId,true)  "Tài khoản không có quyền duyệt kiểm kê tại dự án này."
//                             → canAccessWarehouse(count.warehouseId,true) "Tài khoản không có quyền duyệt kiểm kê tại kho này."
//
// Cần thêm: Principal phải mang `warehouseScopeKind` (nhánh kho của canAccessWarehouse dùng giá trị này).
import { readFileSync, writeFileSync } from "node:fs";

const S = "java-backend/application/src/main/java/com/vntech/erp/application/service/";
const STOCK = S + "StockManagementUseCase.java";
const CTRL = "java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java";
const BEANS = "java-backend/web/src/main/java/com/vntech/erp/web/config/ApplicationBeansConfig.java";

const PRINCIPAL_OLD = `    public interface Principal {
        String userId();
        String role();
        String fullName();
    }`;
const PRINCIPAL_NEW = `    public interface Principal {
        String userId();
        String role();
        String fullName();

        /**
         * Loại phạm vi kho của tài khoản (role_catalog.warehouse_scope_kind: "site" | "central").
         * Nhánh kho của canAccessWarehouse dùng giá trị này để chặn thủ kho dự án thao tác Kho Tổng
         * và ngược lại. Mặc định rỗng ⇒ AccessScopeService coi như "site" (đúng JS).
         */
        default String warehouseScopeKind() { return ""; }
    }`;

const EDITS = [
  // ── Principal mang warehouseScopeKind ─────────────────────────────────────────────────────
  { file: STOCK, from: PRINCIPAL_OLD, to: PRINCIPAL_NEW },

  // ── principalAsCurrent truyền warehouseScopeKind vào CurrentUser ───────────────────────────
  { file: STOCK,
    from: '        return new AuthUseCase.CurrentUser(p.userId(), "", p.fullName(), null, p.role(), p.roleBase(), p.role(),\n'
        + '                null, null, null, false);',
    to: '        return new AuthUseCase.CurrentUser(p.userId(), "", p.fullName(), null, p.role(), p.roleBase(), p.role(),\n'
        + '                p.warehouseScopeKind(), null, null, false);' },

  // ── import AccessScopeService ─────────────────────────────────────────────────────────────
  { file: STOCK,
    from: 'import com.vntech.erp.application.rbac.RbacService;',
    to: 'import com.vntech.erp.application.rbac.AccessScopeService;\nimport com.vntech.erp.application.rbac.RbacService;' },
  { file: STOCK,
    from: '    private final RbacService rbac;\n',
    to: '    private final RbacService rbac;\n    private final AccessScopeService accessScope;\n' },

  // ── issue_stock ──────────────────────────────────────────────────────────────────────────
  { file: STOCK,
    from: '        rbac.requireRole(principalAsCurrent(principal), List.of("warehouse", "commander", "admin"));\n'
        + '        String projectId = trim(payload.get("projectId"));\n'
        + '        String fromWarehouseId = trim(payload.get("fromWarehouseId"));',
    to: '        rbac.requireRole(principalAsCurrent(principal), List.of("warehouse", "commander", "admin"));\n'
        + '        String projectId = trim(payload.get("projectId"));\n'
        + '        String fromWarehouseId = trim(payload.get("fromWarehouseId"));\n'
        + '        // JS 1510: kiểm vai trò TRƯỚC, rồi mới kiểm phạm vi dự án/kho (TASK-023).\n'
        + '        accessScope.requireProjectAccess(principal.userId(), principal.role(), projectId, true,\n'
        + '                "Tài khoản không có quyền cấp phát tại dự án này.");\n'
        + '        accessScope.requireWarehouseAccess(principal.userId(), principal.role(),\n'
        + '                principal.warehouseScopeKind(), fromWarehouseId, true,\n'
        + '                "Tài khoản không có quyền xuất tại kho này.");' },

  // ── return_stock ─────────────────────────────────────────────────────────────────────────
  { file: STOCK,
    from: '        rbac.requireRole(principalAsCurrent(principal), List.of("warehouse", "team", "admin"));\n'
        + '        String projectId = trim(payload.get("projectId"));\n'
        + '        String teamId = trim(payload.get("teamId"));\n'
        + '        String toWarehouseId = trim(payload.get("toWarehouseId"));',
    to: '        rbac.requireRole(principalAsCurrent(principal), List.of("warehouse", "team", "admin"));\n'
        + '        String projectId = trim(payload.get("projectId"));\n'
        + '        String teamId = trim(payload.get("teamId"));\n'
        + '        String toWarehouseId = trim(payload.get("toWarehouseId"));\n'
        + '        // JS 1515: kiểm vai trò TRƯỚC, rồi mới kiểm phạm vi dự án/kho (TASK-023).\n'
        + '        accessScope.requireProjectAccess(principal.userId(), principal.role(), projectId, true,\n'
        + '                "Tài khoản không có quyền hoàn trả tại dự án này.");\n'
        + '        accessScope.requireWarehouseAccess(principal.userId(), principal.role(),\n'
        + '                principal.warehouseScopeKind(), toWarehouseId, true,\n'
        + '                "Tài khoản không có quyền nhận hoàn trả tại kho này.");' },

  // ── create_stock_count: phạm vi dự án TRƯỚC khi tra kho; phạm vi kho SAU khi kiểm hợp lệ ──
  { file: STOCK,
    from: '        List<?> rawLines = payload.get("lines") instanceof List<?> l ? l : List.of();\n'
        + '        Map<String, Object> warehouse = store.findWarehouseById(warehouseId).orElse(null);\n'
        + '        if (warehouse == null || !sv(warehouse, "projectId").equals(projectId) || rawLines.isEmpty())\n'
        + '            throw Api("Phiếu kiểm kê phải đúng dự án, kho và có dữ liệu đếm.");',
    to: '        List<?> rawLines = payload.get("lines") instanceof List<?> l ? l : List.of();\n'
        + '        // JS 1527: phạm vi DỰ ÁN kiểm trước khi tra kho.\n'
        + '        accessScope.requireProjectAccess(principal.userId(), principal.role(), projectId, true,\n'
        + '                "Tài khoản không có quyền kiểm kê tại dự án này.");\n'
        + '        Map<String, Object> warehouse = store.findWarehouseById(warehouseId).orElse(null);\n'
        + '        if (warehouse == null || !sv(warehouse, "projectId").equals(projectId) || rawLines.isEmpty())\n'
        + '            throw Api("Phiếu kiểm kê phải đúng dự án, kho và có dữ liệu đếm.");\n'
        + '        // JS 1532: phạm vi KHO kiểm sau khi đã xác nhận kho thuộc dự án.\n'
        + '        accessScope.requireWarehouseAccess(principal.userId(), principal.role(),\n'
        + '                principal.warehouseScopeKind(), warehouseId, true,\n'
        + '                "Tài khoản không có quyền kiểm kê kho này.");' },

  // ── approve_stock_count ──────────────────────────────────────────────────────────────────
  { file: STOCK,
    from: '        if (!"pending_approval".equals(sv(count, "status")))\n'
        + '            throw Api("Phiếu kiểm kê không tồn tại hoặc đã xử lý.");\n'
        + '        List<Map<String, Object>> items = new ArrayList<>();',
    to: '        if (!"pending_approval".equals(sv(count, "status")))\n'
        + '            throw Api("Phiếu kiểm kê không tồn tại hoặc đã xử lý.");\n'
        + '        // JS 1555/1557: kiểm phạm vi theo chính phiếu kiểm kê (không theo payload).\n'
        + '        accessScope.requireProjectAccess(principal.userId(), principal.role(), sv(count, "projectId"), true,\n'
        + '                "Tài khoản không có quyền duyệt kiểm kê tại dự án này.");\n'
        + '        accessScope.requireWarehouseAccess(principal.userId(), principal.role(),\n'
        + '                principal.warehouseScopeKind(), sv(count, "warehouseId"), true,\n'
        + '                "Tài khoản không có quyền duyệt kiểm kê tại kho này.");\n'
        + '        List<Map<String, Object>> items = new ArrayList<>();' },
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
    applied++; rows.push(`  APD ${name}  ${edit.from.slice(0, 50).replace(/\n/g, "|")}`);
  } else if (entry.text.includes(edit.to)) {
    skipped++; rows.push(`  BO  ${name}`);
  } else {
    failed++; rows.push(`  X   ${name}  KHONG KHOP: ${edit.from.slice(0, 50).replace(/\n/g, "|")}`);
  }
}

// ── controller: asStockPrincipal truyền warehouseScopeKind ───────────────────────────────────
const ctrl = load(CTRL);
const sig = "asStockPrincipal(AuthUseCase.CurrentUser cu) {";
const at = ctrl.text.indexOf(sig);
if (at < 0) { failed++; rows.push("  X   khong thay asStockPrincipal"); }
else if (ctrl.text.slice(at, at + 900).includes("warehouseScopeKind()")) { skipped++; rows.push("  BO  asStockPrincipal"); }
else {
  const anchor = `@Override public String roleBase() { return cu.roleBase(); }`;
  const a = ctrl.text.indexOf(anchor, at);
  if (a < 0 || a > at + 900) { failed++; rows.push("  X   asStockPrincipal khong co dong roleBase()"); }
  else {
    const insertAt = a + anchor.length;
    ctrl.text = ctrl.text.slice(0, insertAt)
        + `\n            @Override public String warehouseScopeKind() { return cu.warehouseScopeKind(); }`
        + ctrl.text.slice(insertAt);
    applied++; rows.push("  APD asStockPrincipal truyen warehouseScopeKind");
  }
}

// ── bean: stockManagementUseCase nhận accessScopeService + constructor use-case ──────────────
const stock = load(STOCK);
const ctorRe = /public\s+StockManagementUseCase\s*\(([^)]*)\)\s*\{/;
if (/AccessScopeService\s+accessScope\)/.test(stock.text)) { skipped++; rows.push("  BO  ctor StockManagementUseCase"); }
else {
  const c = ctorRe.exec(stock.text);
  if (!c) { failed++; rows.push("  X   khong thay ctor StockManagementUseCase"); }
  else {
    stock.text = stock.text.slice(0, c.index)
        + `public StockManagementUseCase(${c[1].trim()}, AccessScopeService accessScope) {`
        + stock.text.slice(c.index + c[0].length);
    stock.text = stock.text.replace("        this.rbac = rbac;\n    }",
        "        this.rbac = rbac;\n        this.accessScope = accessScope;\n    }");
    applied++; rows.push("  APD ctor StockManagementUseCase");
  }
}

const beans = load(BEANS);
if (/AccessScopeService accessScopeService\)\s*\{\s*\n\s*return new StockManagementUseCase\([^)]*accessScopeService/.test(beans.text)) {
  skipped++; rows.push("  BO  bean stockManagementUseCase");
} else {
  const bsig = /public\s+StockManagementUseCase\s+stockManagementUseCase\s*\(([\s\S]*?)\)\s*\{/.exec(beans.text);
  const bctor = /new StockManagementUseCase\(([^)]*)\)/.exec(beans.text);
  if (!bsig || !bctor) { failed++; rows.push("  X   khong khop bean stockManagementUseCase"); }
  else {
    const indent = (bsig[1].match(/\n(\s*)\S/) || [, "                                                         "])[1];
    beans.text = beans.text.slice(0, bsig.index)
        + `public StockManagementUseCase stockManagementUseCase(${bsig[1].replace(/\s*$/, "")},\n${indent}AccessScopeService accessScopeService) {`
        + beans.text.slice(bsig.index + bsig[0].length);
    const b2 = /new StockManagementUseCase\(([^)]*)\)/.exec(beans.text);
    beans.text = beans.text.slice(0, b2.index)
        + `new StockManagementUseCase(${b2[1]}, accessScopeService)`
        + beans.text.slice(b2.index + b2[0].length);
    applied++; rows.push("  APD bean stockManagementUseCase");
  }
}

for (const [path, entry] of cache) {
  writeFileSync(path, entry.crlf ? entry.text.replace(/\n/g, "\r\n") : entry.text, "utf8");
}

console.log("=== TASK-023 LO 2: StockManagementUseCase + warehouseScopeKind ===");
console.log(rows.join("\n"));
console.log(`\nAp dung moi: ${applied} · Bo qua: ${skipped} · Loi: ${failed}`);
process.exit(failed === 0 ? 0 : 1);
