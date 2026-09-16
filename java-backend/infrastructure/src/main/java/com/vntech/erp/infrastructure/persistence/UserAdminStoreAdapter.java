package com.vntech.erp.infrastructure.persistence;

import com.vntech.erp.application.port.out.UserAdminStore;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/** Adapter quản trị tài khoản — native SQL port từ monolith JS. */
@Component
public class UserAdminStoreAdapter implements UserAdminStore {

    private final JdbcTemplate jdbcTemplate;

    public UserAdminStoreAdapter(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public Optional<Map<String, Object>> findUser(String userId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT u.id,u.employee_code AS `employeeCode`,u.full_name AS `fullName`,u.username,u.email,u.role,
                       COALESCE(rc.base_role,u.role) AS `roleBase`,rc.warehouse_scope_kind AS `warehouseScopeKind`,
                       u.department,u.organization_unit_id AS `organizationUnitId`,u.approval_limit AS `approvalLimit`,
                       u.active,u.must_change_password AS `mustChangePassword`
                FROM users u LEFT JOIN role_catalog rc ON rc.code=u.role WHERE u.id=?""", userId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(firstToCamel(rows.get(0)));
    }

    @Override
    public Optional<Map<String, Object>> findRoleByCode(String code) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT code,base_role AS baseRole,warehouse_scope_kind AS warehouseScopeKind,
                       default_organization_unit_id AS defaultOrganizationUnitId,active,business_group_id AS businessGroupId
                FROM role_catalog WHERE code=? AND active=1""", code);
        return rows.isEmpty() ? Optional.empty() : Optional.of(firstToCamel(rows.get(0)));
    }

    @Override
    public long countActiveAdmins() {
        Long n = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users WHERE role='admin' AND active=1", Long.class);
        return n == null ? 0 : n;
    }

    @Override
    public Map<String, Object> resolveOrganizationUnit(String value, boolean includeInactive) {
        String key = value == null ? "" : value.trim();
        if (key.isEmpty()) return null;
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT id,code,name,unit_type AS unitType,parent_id AS parentId,project_id AS projectId,active
                FROM organization_units WHERE (id=? OR upper(code)=upper(?) OR name=?)
                %s""".formatted(includeInactive ? "" : "AND active=1 AND archived_at IS NULL"),
                key, key, key);
        if (!rows.isEmpty()) return firstToCamel(rows.get(0));
        // fallback: so khớp chuẩn hóa (bỏ dấu tiếng Việt — đơn giản so khớp UPPER)
        List<Map<String, Object>> all = jdbcTemplate.queryForList("""
                SELECT id,code,name,unit_type AS unitType,parent_id AS parentId,project_id AS projectId,active
                FROM organization_units %s""".formatted(includeInactive ? "" : "WHERE active=1 AND archived_at IS NULL"));
        String norm = orgNorm(key);
        for (Map<String, Object> r : all) {
            if (orgNorm(String.valueOf(r.getOrDefault("id", ""))).equals(norm)
                    || orgNorm(String.valueOf(r.getOrDefault("code", ""))).equals(norm)
                    || orgNorm(String.valueOf(r.getOrDefault("name", ""))).equals(norm))
                return firstToCamel(r);
        }
        return null;
    }

    private static String orgNorm(String s) {
        String n = java.text.Normalizer.normalize(s == null ? "" : s, java.text.Normalizer.Form.NFD);
        n = n.replaceAll("\\p{M}", "").replace("đ", "d").replace("Đ", "D");
        return n.trim().toUpperCase().replaceAll("\\s+", " ");
    }

    @Override
    public Map<String, Object> findOrganizationUnit(String id) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT id,code,name FROM organization_units WHERE id=? AND active=1 AND archived_at IS NULL", id);
        return rows.isEmpty() ? null : firstToCamel(rows.get(0));
    }

    @Override
    @Transactional
    public void insertUser(String userId, String employeeCode, String fullName, String username, String email,
                           String passwordHash, String role, String department, String organizationUnitId,
                           double approvalLimit, boolean active, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO users (id,employee_code,full_name,username,email,password_hash,role,department,
                                   organization_unit_id,approval_limit,active,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                userId, employeeCode, fullName, username, email, passwordHash, role, department,
                organizationUnitId, approvalLimit, active ? 1 : 0, now, now);
    }

    @Override
    @Transactional
    public void updateUser(String userId, String employeeCode, String fullName, String username, String email,
                           String role, String department, String organizationUnitId, double approvalLimit,
                           boolean active, Instant now) {
        jdbcTemplate.update("""
                UPDATE users SET employee_code=?,full_name=?,username=?,email=?,role=?,department=?,
                                  organization_unit_id=?,approval_limit=?,active=?,updated_at=? WHERE id=?""",
                employeeCode, fullName, username, email, role, department, organizationUnitId,
                approvalLimit, active ? 1 : 0, now, userId);
    }

    @Override
    @Transactional
    public void setUserActive(String userId, boolean active, Instant now) {
        jdbcTemplate.update("UPDATE users SET active=?,updated_at=? WHERE id=?", active ? 1 : 0, now, userId);
    }

    @Override
    @Transactional
    public void setPassword(String userId, String passwordHash, boolean mustChangePassword, Instant now) {
        jdbcTemplate.update("UPDATE users SET password_hash=?,must_change_password=?,updated_at=? WHERE id=?",
                passwordHash, mustChangePassword ? 1 : 0, now, userId);
    }

    @Override
    @Transactional
    public void resetPassword(String userId, String passwordHash, Instant now, String resetByUserId) {
        jdbcTemplate.update("""
                UPDATE users SET password_hash=?,must_change_password=1,password_reset_at=?,password_reset_by=?,updated_at=?
                WHERE id=?""", passwordHash, now, resetByUserId, now, userId);
    }

    @Override
    @Transactional
    public void deleteOwned(Object userId) {
        String id = String.valueOf(userId);
        jdbcTemplate.update("DELETE FROM sessions WHERE user_id=?", id);
        jdbcTemplate.update("DELETE FROM user_project_scopes WHERE user_id=?", id);
        jdbcTemplate.update("DELETE FROM user_module_permissions WHERE user_id=?", id);
        jdbcTemplate.update("DELETE FROM users WHERE id=?", id);
    }

    @Override
    @Transactional
    public void insertProjectScope(String scopeId, String userId, String projectId, String permission, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO user_project_scopes (id,user_id,project_id,permission,created_at,updated_at)
                VALUES (?,?,?,?,?,?)""", scopeId, userId, projectId, permission, now, now);
    }

    @Override
    @Transactional
    public void insertWarehouseScope(String scopeId, String userId, String warehouseId, String permission, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO user_warehouse_scopes (id,user_id,warehouse_id,permission,created_at,updated_at)
                VALUES (?,?,?,?,?,?)""", scopeId, userId, warehouseId, permission, now, now);
    }

    @Override
    @Transactional
    public void clearUserScopes(String userId) {
        jdbcTemplate.update("DELETE FROM user_project_scopes WHERE user_id=?", userId);
        jdbcTemplate.update("DELETE FROM user_warehouse_scopes WHERE user_id=?", userId);
        jdbcTemplate.update("DELETE FROM user_module_permissions WHERE user_id=?", userId);
    }

    @Override
    @Transactional
    public void deleteModuleOverride(String userId, String moduleKey) {
        jdbcTemplate.update("""
                DELETE FROM user_module_permissions WHERE user_id=? AND module_key=? AND permission_source='manual_override'""",
                userId, moduleKey);
    }

    @Override
    public Optional<Map<String, Object>> findActiveWarehouse(String warehouseId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT id,type,project_id AS projectId FROM warehouses WHERE id=? AND active=1""", warehouseId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(firstToCamel(rows.get(0)));
    }

    @Override
    public boolean hasBusinessHistory(String userId) {
        Long n = jdbcTemplate.queryForObject("""
                SELECT (SELECT COUNT(*) FROM projects WHERE manager_user_id=?)
                     + (SELECT COUNT(*) FROM warehouses WHERE keeper_user_id=?)
                     + (SELECT COUNT(*) FROM material_requests WHERE requested_by=?)
                     + (SELECT COUNT(*) FROM approvals WHERE approver_user_id=?)
                     + (SELECT COUNT(*) FROM audit_logs WHERE user_id=?)
                     + (SELECT COUNT(*) FROM goods_receipts WHERE received_by=?)
                     + (SELECT COUNT(*) FROM stock_movements WHERE posted_by=?)
                     + (SELECT COUNT(*) FROM stock_issues WHERE issued_by=?)
                     + (SELECT COUNT(*) FROM material_returns WHERE received_by=?)
                     + (SELECT COUNT(*) FROM attachments WHERE uploaded_by=?)""",
                Long.class, userId, userId, userId, userId, userId, userId, userId, userId, userId, userId);
        return n != null && n > 0;
    }

    @Override
    public List<String> listActiveModuleKeys() {
        return jdbcTemplate.queryForList(
                "SELECT module_key FROM module_catalog WHERE active=1 AND module_key<>'admin' ORDER BY sort_order,module_key",
                String.class);
    }

    @Override
    @Transactional
    public void deleteDepartmentDefaultPermissions(String userId) {
        jdbcTemplate.update("DELETE FROM user_module_permissions WHERE user_id=? AND permission_source='department_default'", userId);
    }

    @Override
    @Transactional
    public void insertDepartmentDefaultPermission(String permissionId, String userId, String moduleKey,
                                                  int canView, int canUse, int canCreate, int canEdit,
                                                  int canApprove, int canExport, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO user_module_permissions (id,user_id,module_key,can_view,can_use,can_create,can_edit,
                                                     can_approve,can_export,permission_expires_at,permission_source,
                                                     created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,NULL,?,?,?) ON DUPLICATE KEY UPDATE
                       can_view=VALUES(can_view),can_use=VALUES(can_use),can_create=VALUES(can_create),
                       can_edit=VALUES(can_edit),can_approve=VALUES(can_approve),can_export=VALUES(can_export),
                       permission_source=VALUES(permission_source),updated_at=VALUES(updated_at)""",
                permissionId, userId, moduleKey, canView, canUse, canCreate, canEdit, canApprove, canExport,
                "department_default", now, now);
    }

    private Optional<Map<String, Object>> first(String sql, Object... args) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, args);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    public List<String> activeUserIds() {
        return jdbcTemplate.queryForList("SELECT id FROM users WHERE active=1", String.class);
    }

    // ---- P5: phân quyền phòng ban ----
    @Override
    public List<Map<String, Object>> departmentModulePermissions() {
        return jdbcTemplate.queryForList("""
                SELECT d.id,d.organization_unit_id AS orgunitid,o.code AS orgcode,
                       o.name AS orgname,d.module_key AS modulekey,
                       d.can_view AS canview,d.can_use AS canuse,d.can_create AS cancreate,
                       d.can_edit AS canedit,d.can_approve AS canapprove,d.can_export AS canexport,
                       d.active
                FROM department_module_permissions d
                LEFT JOIN organization_units o ON o.id=d.organization_unit_id
                ORDER BY o.code,d.module_key""");
    }

    @Override
    public Optional<Map<String, Object>> findDepartmentPermission(String organizationUnitId, String moduleKey) {
        return first("SELECT * FROM department_module_permissions WHERE organization_unit_id=? AND module_key=?",
                organizationUnitId, moduleKey);
    }

    @Override
    @Transactional
    public void upsertDepartmentPermission(String id, String organizationUnitId, String moduleKey,
                                           int canView, int canUse, int canCreate, int canEdit,
                                           int canApprove, int canExport, String updatedBy, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO department_module_permissions (id,organization_unit_id,module_key,can_view,can_use,
                                                           can_create,can_edit,can_approve,can_export,active,
                                                           updated_by,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,1,?,?,?) ON DUPLICATE KEY UPDATE
                       can_view=VALUES(can_view),can_use=VALUES(can_use),can_create=VALUES(can_create),
                       can_edit=VALUES(can_edit),can_approve=VALUES(can_approve),can_export=VALUES(can_export),
                       active=1,updated_by=VALUES(updated_by),updated_at=VALUES(updated_at)""",
                id, organizationUnitId, moduleKey, canView, canUse, canCreate, canEdit, canApprove,
                canExport, updatedBy, now, now);
    }

    @Override
    @Transactional
    public void deleteDepartmentPermission(String organizationUnitId, String moduleKey) {
        jdbcTemplate.update(
                "DELETE FROM department_module_permissions WHERE organization_unit_id=? AND module_key=?",
                organizationUnitId, moduleKey);
    }

    // ---- P5: cấp bậc hệ thống ----
    @Override
    public List<Map<String, Object>> systemLevelCatalog() {
        return jdbcTemplate.queryForList("""
                SELECT id,code,name,description,level_rank AS rank,auto_grant_all AS autogrant,
                       can_skip_levels AS canskip,active,sort_order AS sortorder
                FROM system_level_catalog ORDER BY level_rank,sort_order,code""");
    }

    @Override
    public Optional<Map<String, Object>> findSystemLevelByCode(String code) {
        return first("SELECT * FROM system_level_catalog WHERE code=?", code);
    }

    @Override
    public Optional<Map<String, Object>> findSystemLevelById(String id) {
        return first("SELECT * FROM system_level_catalog WHERE id=?", id);
    }

    @Override
    public Optional<Map<String, Object>> findUserSystemLevel(String userId) {
        return first("""
                SELECT l.code AS levelcode,l.name AS levelname,l.level_rank AS levelrank,
                       l.auto_grant_all AS autogrant,l.can_skip_levels AS canskip
                FROM users u JOIN system_level_catalog l ON l.code=u.system_level_code
                WHERE u.id=?""", userId);
    }

    @Override
    @Transactional
    public void upsertSystemLevel(Map<String, Object> level, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO system_level_catalog (id,code,name,description,level_rank,auto_grant_all,can_skip_levels,
                                                  active,sort_order,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,1,?,?,?) ON DUPLICATE KEY UPDATE
                       code=VALUES(code),name=VALUES(name),description=VALUES(description),
                       level_rank=VALUES(level_rank),
                       auto_grant_all=VALUES(auto_grant_all),can_skip_levels=VALUES(can_skip_levels),
                       sort_order=VALUES(sort_order),updated_at=VALUES(updated_at)""",
                level.get("id"), level.get("code"), level.get("name"), level.get("description"),
                level.get("rank"), level.get("autoGrantAll"), level.get("canSkipLevels"),
                level.get("sortOrder"), now, now);
    }

    @Override
    @Transactional
    public void setSystemLevelStatus(String id, boolean active, Instant now) {
        jdbcTemplate.update("UPDATE system_level_catalog SET active=?,updated_at=? WHERE id=?",
                active ? 1 : 0, now, id);
    }

    @Override
    @Transactional
    public void deleteSystemLevel(String id) {
        jdbcTemplate.update("DELETE FROM system_level_catalog WHERE id=?", id);
    }

    @Override
    @Transactional
    public void setUserSystemLevel(String userId, String levelCode, Instant now) {
        jdbcTemplate.update("UPDATE users SET system_level_code=?,updated_at=? WHERE id=?",
                levelCode == null || levelCode.isBlank() ? null : levelCode, now, userId);
    }

    @Override
    public int countUsersWithLevel(String code) {
        Integer n = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users WHERE system_level_code=?", Integer.class, code);
        return n == null ? 0 : n;
    }

    @Override
    @Transactional
    public void deleteSessionsByUser(String userId) {        jdbcTemplate.update("DELETE FROM sessions WHERE user_id=?", userId);
    }

    @Override
    public Optional<Map<String, Object>> findRoleById(String roleId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT * FROM role_catalog WHERE id=?""", roleId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    public Optional<Map<String, Object>> findBusinessGroup(String groupId) {
        if (groupId == null || groupId.isBlank()) return Optional.empty();
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT id,engine_role AS engineRole FROM business_role_group_catalog WHERE id=? AND active=1""", groupId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    public boolean roleCodeExists(String code, String excludeId) {
        Long n = jdbcTemplate.queryForObject("""
                SELECT COUNT(*) FROM role_catalog WHERE code=? AND id<>COALESCE(?, '')""",
                Long.class, code, excludeId == null ? "" : excludeId);
        return n != null && n > 0;
    }

    @Override
    public boolean roleNameExists(String name, String excludeId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT id,code,name FROM role_catalog WHERE id<>COALESCE(?, '')""",
                excludeId == null ? "" : excludeId);
        String target = orgNorm(name);
        for (Map<String, Object> r : rows) {
            if (orgNorm(String.valueOf(r.getOrDefault("name", ""))).equals(target)) return true;
        }
        return false;
    }

    @Override
    @Transactional
    public void insertRole(String roleId, String code, String name, String description, String baseRole,
                           String businessGroupId, String defaultOrganizationUnitId, int sortOrder, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO role_catalog (id,code,name,description,base_role,business_group_id,
                                          default_organization_unit_id,active,sort_order,system_locked,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,1,?,0,?,?)""",
                roleId, code, name, description, baseRole, businessGroupId, defaultOrganizationUnitId,
                sortOrder, now, now);
    }

    @Override
    @Transactional
    public void updateRole(String roleId, String code, String name, String description, String baseRole,
                           String businessGroupId, String defaultOrganizationUnitId, int sortOrder, Instant now) {
        jdbcTemplate.update("""
                UPDATE role_catalog SET code=?,name=?,description=?,base_role=?,business_group_id=?,
                                        default_organization_unit_id=?,sort_order=?,updated_at=? WHERE id=?""",
                code, name, description, baseRole, businessGroupId, defaultOrganizationUnitId, sortOrder, now, roleId);
    }

    @Override
    @Transactional
    public void setRoleActive(String roleId, boolean active, Instant now) {
        jdbcTemplate.update("UPDATE role_catalog SET active=?,updated_at=? WHERE id=?", active ? 1 : 0, now, roleId);
    }

    @Override
    public long countUsersByRole(String roleCode) {
        Long n = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM users WHERE role=?", Long.class, roleCode);
        return n == null ? 0 : n;
    }

    @Override
    public long countStagesUsingRole(String roleCode) {
        Long n = jdbcTemplate.queryForObject("""
                SELECT COUNT(*) FROM approval_stage_catalog WHERE CONCAT(',',allowed_role_codes,',') LIKE ?""",
                Long.class, "%," + roleCode + ",%");
        return n == null ? 0 : n;
    }

    @Override
    @Transactional
    public void renameRoleInUsers(String oldCode, String newCode, Instant now) {
        jdbcTemplate.update("UPDATE users SET role=?,updated_at=? WHERE role=?", newCode, now, oldCode);
    }

    @Override
    @Transactional
    public void renameRoleInApprovalStages(String oldCode, String newCode, Instant now) {
        List<Map<String, Object>> stages = jdbcTemplate.queryForList("""
                SELECT id,allowed_role_codes AS allowedRoleCodes FROM approval_stage_catalog
                WHERE CONCAT(',',allowed_role_codes,',') LIKE ?""", "%," + oldCode + ",%");
        for (Map<String, Object> stage : stages) {
            List<String> codes = new java.util.ArrayList<>();
            for (String item : String.valueOf(stage.getOrDefault("allowedRoleCodes", "")).split(",")) {
                String trimmed = item.trim();
                if (trimmed.isEmpty()) continue;
                codes.add(trimmed.equals(oldCode) ? newCode : trimmed);
            }
            jdbcTemplate.update("UPDATE approval_stage_catalog SET allowed_role_codes=?,updated_at=? WHERE id=?",
                    String.join(",", codes.stream().distinct().toList()), now, stage.get("id"));
        }
    }

    @Override
    @Transactional
    public void deleteRole(String roleId) {
        jdbcTemplate.update("DELETE FROM role_catalog WHERE id=?", roleId);
    }

    private static Map<String, Object> firstToCamel(Map<String, Object> row) {
        // JdbcTemplate trả key = alias; giữ nguyên (alias đã camelCase trong SQL)
        return new LinkedHashMap<>(row);
    }
}