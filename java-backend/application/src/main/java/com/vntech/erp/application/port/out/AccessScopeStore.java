package com.vntech.erp.application.port.out;

import java.util.Map;
import java.util.Optional;

/**
 * Port đọc PHẠM VI truy cập (project/warehouse scope) — nguồn dữ liệu cho
 * {@code canAccessProject()}/{@code canAccessWarehouse()} của monolith JS.
 *
 * <p>Ba truy vấn ở đây phản chiếu đúng ba truy vấn của JS (scripts/system-route.mjs:215-242).
 */
public interface AccessScopeStore {

    /** {@code user_project_scopes.permission} theo (user, dự án); rỗng nếu không được gán phạm vi. */
    Optional<String> projectScopePermission(String userId, String projectId);

    /** {@code user_warehouse_scopes.permission} theo (user, kho); rỗng nếu không được gán phạm vi. */
    Optional<String> warehouseScopePermission(String userId, String warehouseId);

    /**
     * Kho đang hoạt động: {@code id, type, projectId} — đúng truy vấn
     * {@code SELECT id,type,project_id AS projectId FROM warehouses WHERE id=? AND active=1}.
     * Rỗng nếu kho không tồn tại hoặc đã ngừng hoạt động.
     */
    Optional<Map<String, Object>> findActiveWarehouseBasic(String warehouseId);
}
