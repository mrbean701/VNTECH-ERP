package com.vntech.erp.application.port.out;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Port quản trị tài khoản (admin) — port nguyên trạng create_user/update_user/set_user_status/
 * reset_user_password/delete_user/save_user_access của monolith JS.
 */
public interface UserAdminStore {

    // ---- đọc ----
    Optional<Map<String, Object>> findUser(String userId);
    Optional<Map<String, Object>> findRoleByCode(String code);                    // role_catalog + base_role + warehouse_scope_kind...
    long countActiveAdmins();
    Map<String, Object> resolveOrganizationUnit(String value, boolean includeInactive); // thành organization {id,name,code,unitType...}
    Map<String, Object> findOrganizationUnit(String id);                            // cho kiểm tra tồn tại

    // ---- ghi user ----
    void insertUser(String userId, String employeeCode, String fullName, String username, String email,
                    String passwordHash, String role, String department, String organizationUnitId,
                    double approvalLimit, boolean active, Instant now);
    void updateUser(String userId, String employeeCode, String fullName, String username, String email,
                    String role, String department, String organizationUnitId, double approvalLimit,
                    boolean active, Instant now);
    void setUserActive(String userId, boolean active, Instant now);
    /**
     * MT2 §13.4 — ghi **CHỮ KÝ** của user (đường QUẢN TRỊ: modal tạo/sửa user).
     * ⚠️ Cố ý là **hàm MỚI, thuần thêm** — ⛔ KHÔNG thêm tham số vào {@link #insertUser}/{@link #updateUser}
     * vì hai hàm đó dùng **tham số vị trí** ⇒ thêm tham số sẽ lan toả sang adapter + mọi caller (⛔ rủi ro vỡ).
     * {@code signatureUrl} null/rỗng ⇒ ghi NULL = **XOÁ** (đúng vế «xoá/thay ảnh cũ» của §13.4).
     */
    void setUserSignature(String userId, String signatureUrl, Instant now);
    void setPassword(String userId, String passwordHash, boolean mustChangePassword, Instant now);
    void resetPassword(String userId, String passwordHash, Instant now, String resetByUserId);
    void deleteOwned(Object userId); // delete user + scopes + permissions + sessions (kiểm tra lịch sử trước ở use-case)

    // ---- scopes ----
    void insertProjectScope(String scopeId, String userId, String projectId, String permission, Instant now);
    void insertWarehouseScope(String scopeId, String userId, String warehouseId, String permission, Instant now);
    void clearUserScopes(String userId); // DELETE user_project_scopes + user_warehouse_scopes + user_module_permissions
    /**
     * ⭐⭐ V-1 (`BUG-20261008-014` — 🔴 CRITICAL «mất dữ liệu») — ĐỌC **phạm vi HIỆN CÓ** của một người,
     * trả về **ĐÚNG DẠNG PAYLOAD** mà `saveUserAccess` đang tiêu thụ ⇒ bên gọi **HỢP** được mà ⛔ không mất trường nào.
     *
     * <p>⚠️ VÌ SAO CẦN: `saveUserAccess` là **FULL-REPLACE** (`clearUserScopes()` rồi chèn lại theo payload).
     * Người **⛔ không phải admin** chỉ nhận **một phần** dữ liệu phạm vi — vd `data.userWarehouseScopes`
     * với non-admin **chỉ có của chính họ** (`BootstrapDataAdapter` L959), và `data.allModulePermissions`
     * là **rỗng** với non-admin ⇒ payload gửi lên **THIẾU** ⇒ FULL-REPLACE sẽ ⛔ **XOÁ OAN** ⇒ 🔴 **mất dữ liệu** ✓
     *
     * <p>⭐ 3 khoá trả về (⛔ luôn có mặt, ⛔ không null — danh sách rỗng nếu chưa có):
     * <ul>
     *   <li>{@code "projectScopes"} — {@code [{projectId, permission}]}</li>
     *   <li>{@code "warehouseScopes"} — {@code [{warehouseId, permission}]}</li>
     *   <li>{@code "modulePermissions"} — {@code [{moduleKey, canView, canUse, canCreate, canEdit, canApprove, canExport}]}</li>
     * </ul>
     */
    java.util.Map<String, java.util.List<java.util.Map<String, Object>>> listExistingScopes(String userId);
    /**
     * Xoá ngoại lệ cá nhân (chỉ dòng có {@code permission_source='manual_override'}).
     *
     * <p>⛔⛔ VÁ 05/10/2026 (GO-LIVE · BUG-20261011 — LOW): đổi {@code void} → {@code int} để use-case
     * <b>biết được có dòng nào bị xoá hay không</b>. Trước bản vá, {@code delete_user_module_override}
     * với {@code userId}/{@code moduleKey} <b>bịa</b> vẫn trả <b>HTTP 200</b> «Đã xóa ngoại lệ cá nhân…»
     * ⇒ báo thành công cho việc ⛔ không tồn tại — trong khi <b>33/34</b> action {@code delete_*} khác
     * đều trả 400 «Không tìm thấy …».
     *
     * @return số dòng đã xoá (0 ⇒ ⛔ không có ngoại lệ nào để xoá).
     */
    int deleteModuleOverride(String userId, String moduleKey);

    // ---- warehouse kiểm tra ----
    Optional<Map<String, Object>> findActiveWarehouse(String warehouseId);

    // ---- lịch sử (delete_user) ----
    boolean hasBusinessHistory(String userId);

    // ---- department defaults (replaceDepartmentDefaults) ----
    List<String> listActiveModuleKeys();
    List<String> activeUserIds();
    void deleteDepartmentDefaultPermissions(String userId);
    // MỐC 112 — thêm `permissionSource` + `permissionExpiresAt`.
    // TRƯỚC đây adapter hard-code `'department_default'` và `NULL` ⇒ cột «Hết hạn» LUÔN trống
    // dù UI có ô nhập, và `deleteModuleOverride` (lọc `permission_source='manual_override'`)
    // không bao giờ xoá được gì ⇒ nút «Xóa ngoại lệ cá nhân» là nút chết.
    void insertDepartmentDefaultPermission(String permissionId, String userId, String moduleKey,
                                           int canView, int canUse, int canCreate, int canEdit,
                                           int canApprove, int canExport,
                                           String permissionSource, Instant permissionExpiresAt, Instant now);
    // MỐC 112 — chạy một khối ghi trong MỘT transaction (adapter đánh dấu @Transactional).
    // Dùng để `clearUserScopes()` + vòng chèn lại của `saveUserAccess` là NGUYÊN TỬ: trước đó mỗi
    // lệnh là một transaction riêng ⇒ xoá xong rồi insert lỗi giữa chừng là mất trắng.
    // KHÔNG thêm @Transactional vào use-case: module `application` cố ý không phụ thuộc Spring.
    void runAtomically(Runnable work);
    void deleteSessionsByUser(String userId);

    // ---- P5: phân quyền phòng ban + cấp bậc hệ thống ----
    List<Map<String, Object>> departmentModulePermissions();
    Optional<Map<String, Object>> findDepartmentPermission(String organizationUnitId, String moduleKey);
    void upsertDepartmentPermission(String id, String organizationUnitId, String moduleKey,
                                    int canView, int canUse, int canCreate, int canEdit,
                                    int canApprove, int canExport, String updatedBy, Instant now);
    void deleteDepartmentPermission(String organizationUnitId, String moduleKey);

    List<Map<String, Object>> systemLevelCatalog();
    Optional<Map<String, Object>> findSystemLevelByCode(String code);
    Optional<Map<String, Object>> findSystemLevelById(String id);
    Optional<Map<String, Object>> findUserSystemLevel(String userId);   // cấp bậc của người dùng (join catalog)
    void upsertSystemLevel(Map<String, Object> level, Instant now);
    void setSystemLevelStatus(String id, boolean active, Instant now);
    void deleteSystemLevel(String id);
    void setUserSystemLevel(String userId, String levelCode, Instant now);
    int countUsersWithLevel(String code);

    // ---- role_catalog (save_role_catalog/set_role_status/delete_role_catalog) ----
    Optional<Map<String, Object>> findRoleById(String roleId);
    Optional<Map<String, Object>> findBusinessGroup(String groupId);          // engine_role kế thừa
    boolean roleCodeExists(String code, String excludeId);
    boolean roleNameExists(String name, String excludeId);
    void insertRole(String roleId, String code, String name, String description, String baseRole,
                    String businessGroupId, String defaultOrganizationUnitId, int sortOrder, Instant now);
    void updateRole(String roleId, String code, String name, String description, String baseRole,
                    String businessGroupId, String defaultOrganizationUnitId, int sortOrder, Instant now);
    void setRoleActive(String roleId, boolean active, Instant now);
    long countUsersByRole(String roleCode);
    long countStagesUsingRole(String roleCode);
    void renameRoleInUsers(String oldCode, String newCode, Instant now);
    void renameRoleInApprovalStages(String oldCode, String newCode, Instant now);
    void deleteRole(String roleId);
}