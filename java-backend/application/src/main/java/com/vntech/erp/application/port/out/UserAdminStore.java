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
    void setPassword(String userId, String passwordHash, boolean mustChangePassword, Instant now);
    void resetPassword(String userId, String passwordHash, Instant now, String resetByUserId);
    void deleteOwned(Object userId); // delete user + scopes + permissions + sessions (kiểm tra lịch sử trước ở use-case)

    // ---- scopes ----
    void insertProjectScope(String scopeId, String userId, String projectId, String permission, Instant now);
    void insertWarehouseScope(String scopeId, String userId, String warehouseId, String permission, Instant now);
    void clearUserScopes(String userId); // DELETE user_project_scopes + user_warehouse_scopes + user_module_permissions
    void deleteModuleOverride(String userId, String moduleKey);

    // ---- warehouse kiểm tra ----
    Optional<Map<String, Object>> findActiveWarehouse(String warehouseId);

    // ---- lịch sử (delete_user) ----
    boolean hasBusinessHistory(String userId);

    // ---- department defaults (replaceDepartmentDefaults) ----
    List<String> listActiveModuleKeys();
    List<String> activeUserIds();
    void deleteDepartmentDefaultPermissions(String userId);
    void insertDepartmentDefaultPermission(String permissionId, String userId, String moduleKey,
                                           int canView, int canUse, int canCreate, int canEdit,
                                           int canApprove, int canExport, Instant now);
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