package com.vntech.erp.application.rbac;

import com.vntech.erp.application.port.out.AccessScopeStore;
import com.vntech.erp.application.port.out.ModulePermissionStore;
import com.vntech.erp.application.service.AuthUseCase;

import java.util.List;
import java.util.Map;

/**
 * Port nguyên trạng {@code canAccessProject()}/{@code canAccessWarehouse()} của monolith JS
 * (scripts/system-route.mjs:215-242).
 *
 * <p>Vì sao cần lớp này: JS chặn nghiệp vụ theo <b>phạm vi</b> chứ không chỉ theo vai trò. Bản Java
 * port trước TASK-023 <b>không kiểm phạm vi ở tầng application</b> ⇒ một tài khoản có quyền module
 * vẫn thao tác được trên dự án/kho <b>không thuộc phạm vi</b> của mình (cổng
 * {@code tools/probe-action-scope-parity.mjs} đo được 64 action JS có kiểm, Java kiểm 0).
 *
 * <p>Luật JS được giữ nguyên từng nhánh:
 * <pre>
 * canAccessProject(user, projectId, write):
 *   admin → true
 *   không có dòng user_project_scopes → false
 *   write=false → true; write=true → permission ∈ {write, approve, admin}
 *
 * canAccessWarehouse(user, warehouseId, write):
 *   admin → true
 *   kho không tồn tại hoặc inactive → false
 *   base_role = warehouse:
 *       warehouseScopeKind (mặc định "site") phải khớp loại kho (site/central)
 *       phải có dòng user_warehouse_scopes; nếu write thì permission ∈ {write, approve, admin}
 *       kho site → còn phải qua canAccessProject của dự án chứa kho
 *       kho central → true
 *   kho central (vai trò khác) → canUseModule(central_warehouse) HOẶC canUseModule(material_catalog)
 *   còn lại → theo phạm vi dự án của kho
 * </pre>
 */
public final class AccessScopeService {

    private static final List<String> WRITE_LEVELS = List.of("write", "approve", "admin");
    private static final String DEFAULT_WAREHOUSE_SCOPE_KIND = "site";

    private final AccessScopeStore store;
    private final ModulePermissionStore modulePermissionStore;

    public AccessScopeService(AccessScopeStore store, ModulePermissionStore modulePermissionStore) {
        this.store = store;
        this.modulePermissionStore = modulePermissionStore;
    }

    private static boolean isAdmin(String role) {
        return "admin".equals(role);
    }

    /** Vai trò kho: mã ENGINE "warehouse" hoặc mã CHUẨN thu_kho/kho_tong (ánh xạ nhiều-về-một). */
    private static boolean isWarehouseRole(String role) {
        return "warehouse".equals(role) || "thu_kho".equals(role) || "kho_tong".equals(role);
    }

    private static String clean(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }

    /** admin luôn đúng; nếu không có phạm vi thì từ chối; write cần mức write/approve/admin. */
    public boolean canAccessProject(String userId, String role, String projectId, boolean write) {
        if (isAdmin(role)) return true;
        if (projectId == null || projectId.isBlank()) return false;
        String permission = store.projectScopePermission(userId, projectId).map(AccessScopeService::clean).orElse("");
        if (permission.isEmpty()) return false;
        return !write || WRITE_LEVELS.contains(permission);
    }

    public boolean canAccessWarehouse(String userId, String role, String warehouseScopeKind,
                                      String warehouseId, boolean write) {
        if (isAdmin(role)) return true;
        if (warehouseId == null || warehouseId.isBlank()) return false;
        Map<String, Object> warehouse = store.findActiveWarehouseBasic(warehouseId).orElse(null);
        if (warehouse == null) return false;
        String type = clean(warehouse.get("type"));
        String projectId = clean(warehouse.get("projectId"));

        // SỬA LỖI PHẠM VI KHO (TASK-027): JS so với effectiveRole(user) = MÃ ENGINE
        // (scripts/system-route.mjs:229). Các nơi gọi trong Java truyền principal.role() = MÃ CHUẨN
        // (thu_kho/kho_tong) nên nhánh này trước đây KHÔNG BAO GIỜ chạy ⇒ người dùng kho thật bị
        // đánh giá sai: hoặc chặn oan (thiếu user_project_scopes), hoặc lọt vào kho central qua
        // module material_catalog. Nhận cả hai mã, đúng quy ước của RbacService.requireRole.
        if (isWarehouseRole(role)) {
            String kind = clean(warehouseScopeKind);
            if (kind.isEmpty()) kind = DEFAULT_WAREHOUSE_SCOPE_KIND;
            if ("site".equals(kind) && !"site".equals(type)) return false;
            if ("central".equals(kind) && !"central".equals(type)) return false;
            String permission = store.warehouseScopePermission(userId, warehouseId)
                    .map(AccessScopeService::clean).orElse("");
            if (permission.isEmpty()) return false;
            if (write && !WRITE_LEVELS.contains(permission)) return false;
            if ("site".equals(type)) return !projectId.isEmpty() && canAccessProject(userId, role, projectId, write);
            return true;
        }
        if ("central".equals(type)) {
            String capability = write ? "canUse" : "canView";
            return modulePermissionStore.canUseModule(userId, "central_warehouse", capability)
                    || modulePermissionStore.canUseModule(userId, "material_catalog", capability);
        }
        return !projectId.isEmpty() && canAccessProject(userId, role, projectId, write);
    }

    /** Ném 403 với đúng thông điệp của JS khi không có quyền tại dự án. */
    public void requireProjectAccess(String userId, String role, String projectId, boolean write, String message) {
        if (!canAccessProject(userId, role, projectId, write)) throw new AuthUseCase.ApiError(message, 403);
    }

    /** Ném 403 với đúng thông điệp của JS khi không có quyền tại kho. */
    public void requireWarehouseAccess(String userId, String role, String warehouseScopeKind,
                                       String warehouseId, boolean write, String message) {
        if (!canAccessWarehouse(userId, role, warehouseScopeKind, warehouseId, write)) {
            throw new AuthUseCase.ApiError(message, 403);
        }
    }
}
