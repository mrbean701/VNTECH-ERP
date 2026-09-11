package com.vntech.erp.infrastructure.persistence;

import com.vntech.erp.application.port.out.AdminSystemStore;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/** Adapter cấu hình hệ thống admin — native SQL port từ monolith JS. */
@Component
public class AdminSystemStoreAdapter implements AdminSystemStore {

    private final JdbcTemplate jdbcTemplate;

    public AdminSystemStoreAdapter(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // ---------- organization_units ----------
    @Override
    public Optional<Map<String, Object>> findOrganizationUnitFull(String id) {
        return first("SELECT * FROM organization_units WHERE id=?", id);
    }

    @Override
    public boolean organizationUnitCodeExists(String code, String excludeId) {
        Long n = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM organization_units WHERE code=? AND id<>COALESCE(?, '')",
                Long.class, code, excludeId == null ? "" : excludeId);
        return n != null && n > 0;
    }

    @Override
    public boolean organizationUnitNameExists(String name, String excludeId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT id,name FROM organization_units WHERE id<>COALESCE(?, '')", excludeId == null ? "" : excludeId);
        String target = norm(name);
        for (Map<String, Object> r : rows)
            if (norm(String.valueOf(r.getOrDefault("name", ""))).equals(target)) return true;
        return false;
    }

    @Override
    public Optional<Map<String, Object>> findOrgByCodeOrName(String value) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT id,code,name,unit_type AS unitType,parent_id AS parentId,project_id AS projectId,
                       active,archived_at AS archivedAt
                FROM organization_units WHERE (id=? OR upper(code)=upper(?) OR name=?)
                  AND active=1 AND archived_at IS NULL""", value, value, value);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    public boolean isDescendant(String descendantId, String potentialAncestorId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                WITH RECURSIVE descendants(id) AS (
                    SELECT id FROM organization_units WHERE parent_id=?
                    UNION ALL SELECT child.id FROM organization_units child
                    JOIN descendants d ON child.parent_id=d.id
                )
                SELECT id FROM descendants WHERE id=? LIMIT 1""", descendantId, potentialAncestorId);
        return !rows.isEmpty();
    }

    @Override
    @Transactional
    public void insertOrganizationUnit(String id, String code, String name, String unitType, String parentId,
                                       String projectId, String description, String effectiveFrom,
                                       String effectiveTo, int sortOrder, boolean systemLocked, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO organization_units (id,code,name,unit_type,parent_id,project_id,description,
                                                effective_from,effective_to,active,archived_at,sort_order,
                                                system_locked,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,1,NULL,?,?,?,?)""",
                id, code, name, unitType, parentId, projectId, description, effectiveFrom, effectiveTo,
                sortOrder, systemLocked ? 1 : 0, now, now);
    }

    @Override
    @Transactional
    public void updateOrganizationUnit(String id, String code, String name, String unitType, String parentId,
                                       String projectId, String description, String effectiveFrom,
                                       String effectiveTo, int sortOrder, Instant now) {
        jdbcTemplate.update("""
                UPDATE organization_units SET code=?,name=?,unit_type=?,parent_id=?,project_id=?,description=?,
                                              effective_from=?,effective_to=?,sort_order=?,updated_at=? WHERE id=?""",
                code, name, unitType, parentId, projectId, description, effectiveFrom, effectiveTo, sortOrder, now, id);
    }

    @Override
    @Transactional
    public void syncUserDepartmentsByOrg(String organizationUnitId, String name, Instant now) {
        jdbcTemplate.update("UPDATE users SET department=?,updated_at=? WHERE organization_unit_id=?",
                name, now, organizationUnitId);
    }

    @Override
    @Transactional
    public void setOrganizationUnitActive(String id, boolean active, Instant now) {
        jdbcTemplate.update("UPDATE organization_units SET active=?,archived_at=?,updated_at=? WHERE id=?",
                active ? 1 : 0, active ? null : now, now, id);
    }

    @Override
    public long countActiveUsersByOrg(String organizationUnitId) {
        Long n = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users WHERE organization_unit_id=? AND active=1", Long.class, organizationUnitId);
        return n == null ? 0 : n;
    }

    @Override
    public long countActiveChildrenByOrg(String organizationUnitId) {
        Long n = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM organization_units WHERE parent_id=? AND active=1", Long.class, organizationUnitId);
        return n == null ? 0 : n;
    }

    @Override
    public Optional<Map<String, Object>> findUserOrgMembership(String userId) {
        return first("SELECT id,full_name AS fullName,role,organization_unit_id AS organizationUnitId FROM users WHERE id=?", userId);
    }

    @Override
    public Optional<Map<String, Object>> findSiteCommandUnit(String organizationUnitId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT id,code,name,unit_type AS unitType,project_id AS projectId,active,archived_at AS archivedAt
                FROM organization_units WHERE id=?""", organizationUnitId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    @Transactional
    public void assignUserToUnit(String userId, String organizationUnitId, String departmentName, Instant now) {
        jdbcTemplate.update("""
                UPDATE users SET organization_unit_id=?,department=?,updated_at=? WHERE id=?""",
                organizationUnitId, departmentName, now, userId);
    }

    @Override
    @Transactional
    public void unassignUserFromUnit(String userId, Instant now) {
        jdbcTemplate.update("UPDATE users SET organization_unit_id=NULL,updated_at=? WHERE id=?", now, userId);
    }

    // ---------- menu_group_catalog ----------
    @Override
    public Optional<Map<String, Object>> findMenuGroup(String id) {
        return first("""
                SELECT id,group_key AS groupKey,name,icon,active,sort_order AS sortOrder,
                       collapsible,system_locked AS systemLocked
                FROM menu_group_catalog WHERE id=?""", id);
    }

    @Override
    public Optional<Map<String, Object>> findMenuGroupByKey(String groupKey) {
        return first("SELECT name,active FROM menu_group_catalog WHERE group_key=?", groupKey);
    }

    @Override
    public boolean menuGroupKeyExists(String groupKey) {
        Long n = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM menu_group_catalog WHERE group_key=?",
                Long.class, groupKey);
        return n != null && n > 0;
    }

    @Override
    @Transactional
    public void insertMenuGroup(String id, String groupKey, String name, String icon, boolean collapsible,
                                int sortOrder, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO menu_group_catalog (id,group_key,name,icon,active,sort_order,collapsible,
                                                system_locked,created_at,updated_at)
                VALUES (?,?,?,?,1,?,?,0,?,?)""", id, groupKey, name, icon, sortOrder, collapsible ? 1 : 0, now, now);
    }

    @Override
    @Transactional
    public void updateMenuGroup(String id, String name, String icon, boolean collapsible, int sortOrder, Instant now) {
        jdbcTemplate.update("""
                UPDATE menu_group_catalog SET name=?,icon=?,sort_order=?,collapsible=?,updated_at=? WHERE id=?""",
                name, icon, sortOrder, collapsible ? 1 : 0, now, id);
    }

    @Override
    @Transactional
    public void syncModuleGroupName(String groupKey, String name, Instant now) {
        jdbcTemplate.update("UPDATE module_catalog SET group_name=?,updated_at=? WHERE group_key=?",
                name, now, groupKey);
    }

    @Override
    @Transactional
    public void setMenuGroupActive(String id, boolean active, Instant now) {
        jdbcTemplate.update("UPDATE menu_group_catalog SET active=?,updated_at=? WHERE id=?",
                active ? 1 : 0, now, id);
    }

    @Override
    public Optional<Map<String, Object>> findAdminModuleInGroup(String groupKey) {
        return first("""
                SELECT module_key AS moduleKey FROM module_catalog
                WHERE group_key=? AND module_key='admin' AND active=1""", groupKey);
    }

    @Override
    public long countModulesInGroup(String groupKey) {
        Long n = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM module_catalog WHERE group_key=?",
                Long.class, groupKey);
        return n == null ? 0 : n;
    }

    @Override
    @Transactional
    public void deleteMenuGroup(String id) {
        jdbcTemplate.update("DELETE FROM menu_group_catalog WHERE id=?", id);
    }

    // ---------- module_catalog ----------
    @Override
    public Optional<Map<String, Object>> findModule(String moduleKey) {
        return first("""
                SELECT module_key AS moduleKey,label,icon,group_name AS groupName,group_key AS groupKey,
                       active,sort_order AS sortOrder
                FROM module_catalog WHERE module_key=?""", moduleKey);
    }

    @Override
    @Transactional
    public void updateModule(String moduleKey, String label, String icon, String groupName, String groupKey,
                             int sortOrder, Instant now) {
        jdbcTemplate.update("""
                UPDATE module_catalog SET label=?,icon=?,group_name=?,group_key=?,sort_order=?,updated_at=? WHERE module_key=?""",
                label, icon, groupName, groupKey, sortOrder, now, moduleKey);
    }

    @Override
    @Transactional
    public void setModuleActive(String moduleKey, boolean active, Instant now) {
        jdbcTemplate.update("UPDATE module_catalog SET active=?,updated_at=? WHERE module_key=?",
                active ? 1 : 0, now, moduleKey);
    }

    // ---------- form_field_config ----------
    @Override
    public List<String> validFormKeys() {
        return List.of("boq", "boq_purchase", "request_header", "request_line");
    }

    @Override
    public Optional<Map<String, Object>> findFormField(String formKey, String fieldKey) {
        return first("""
                SELECT id,source_kind AS sourceKind,system_locked AS systemLocked,display_name AS displayName
                FROM form_field_config WHERE form_key=? AND field_key=?""", formKey, fieldKey);
    }

    @Override
    @Transactional
    public void upsertFormField(String configId, String formKey, String fieldKey, String displayName, String dataType,
                                String sourceKind, boolean visible, boolean required, boolean importable,
                                boolean exportable, boolean editable, int sortOrder, String optionsJson,
                                boolean systemLocked, boolean active, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO form_field_config (id,form_key,field_key,display_name,data_type,source_kind,
                                               visible,required,importable,exportable,editable,sort_order,
                                               options_json,system_locked,active,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                ON DUPLICATE KEY UPDATE display_name=VALUES(display_name),data_type=VALUES(data_type),
                       visible=VALUES(visible),required=VALUES(required),importable=VALUES(importable),
                       exportable=VALUES(exportable),editable=VALUES(editable),sort_order=VALUES(sort_order),
                       options_json=VALUES(options_json),active=VALUES(active),updated_at=VALUES(updated_at)""",
                configId, formKey, fieldKey, displayName, dataType, sourceKind,
                visible ? 1 : 0, required ? 1 : 0, importable ? 1 : 0, exportable ? 1 : 0, editable ? 1 : 0,
                sortOrder, optionsJson, systemLocked ? 1 : 0, active ? 1 : 0, now, now);
    }

    @Override
    @Transactional
    public void disableFormField(String formKey, String fieldKey, Instant now) {
        jdbcTemplate.update("""
                UPDATE form_field_config SET active=0,visible=0,updated_at=? WHERE form_key=? AND field_key=?""",
                now, formKey, fieldKey);
    }

    // ---------- warehouse_locations ----------
    @Override
    public Optional<Map<String, Object>> findWarehouse(String warehouseId) {
        return first("SELECT id,code,name FROM warehouses WHERE id=? AND active=1", warehouseId);
    }

    @Override
    @Transactional
    public void upsertWarehouseLocation(String warehouseId, String code, String name, String locationType,
                                        boolean secure, boolean active, Instant now) {
        List<Map<String, Object>> existing = jdbcTemplate.queryForList(
                "SELECT id FROM warehouse_locations WHERE warehouse_id=? AND upper(code)=upper(?)",
                warehouseId, code);
        if (!existing.isEmpty()) {
            jdbcTemplate.update("""
                    UPDATE warehouse_locations SET name=?,location_type=?,secure=?,active=?,updated_at=? WHERE id=?""",
                    name, locationType, secure ? 1 : 0, active ? 1 : 0, now, existing.get(0).get("id"));
        } else {
            jdbcTemplate.update("""
                    INSERT INTO warehouse_locations (id,warehouse_id,code,name,location_type,secure,active,
                                                     created_at,updated_at)
                    VALUES (?,?,?,?,?,?,?,?,?)""",
                    "LOC_" + java.util.UUID.randomUUID(), warehouseId, code, name, locationType,
                    secure ? 1 : 0, 1, now, now);
        }
    }

    // ---------- business_role_engine_catalog ----------
    @Override
    public Optional<Map<String, Object>> findEngineProfile(String profileId, String engineKey) {
        return first(""" 
                SELECT id,engine_key AS engineKey,company_code AS companyCode,display_name AS displayName,
                       description,sort_order AS sortOrder
                FROM business_role_engine_catalog WHERE id=? AND engine_key=?""", profileId, engineKey);
    }

    @Override
    public boolean engineCompanyCodeExists(String companyCode, String excludeId) {
        Long n = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM business_role_engine_catalog WHERE company_code=? AND id<>?",
                Long.class, companyCode, excludeId);
        return n != null && n > 0;
    }

    @Override
    @Transactional
    public void updateEngineProfile(String profileId, String companyCode, String displayName, String description,
                                    int sortOrder, Instant now) {
        jdbcTemplate.update("""
                UPDATE business_role_engine_catalog SET company_code=?,display_name=?,description=?,
                                                        sort_order=?,updated_at=? WHERE id=?""",
                companyCode, displayName, description, sortOrder, now, profileId);
    }

    // ---------- business_scope_catalog ----------
    @Override
    public Optional<Map<String, Object>> findBusinessScope(String scopeId) {
        return first("SELECT * FROM business_scope_catalog WHERE id=?", scopeId);
    }

    @Override
    public boolean businessScopeDuplicate(String code, String name, String excludeId) {
        Long n = jdbcTemplate.queryForObject("""
                SELECT COUNT(*) FROM business_scope_catalog
                WHERE (code=? OR lower(trim(name))=lower(trim(?))) AND id<>COALESCE(?, '')""",
                Long.class, code, name, excludeId == null ? "" : excludeId);
        return n != null && n > 0;
    }

    @Override
    public boolean businessScopeInUseByActiveGroup(String scopeId) {
        Long n = jdbcTemplate.queryForObject("""
                SELECT COUNT(*) FROM business_role_group_scopes brgs
                JOIN business_role_group_catalog bg ON bg.id=brgs.business_group_id
                WHERE brgs.business_scope_id=? AND bg.active=1""", Long.class, scopeId);
        return n != null && n > 0;
    }

    @Override
    public boolean businessScopeInUse(String scopeId) {
        Long n = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM business_role_group_scopes WHERE business_scope_id=?", Long.class, scopeId);
        return n != null && n > 0;
    }

    @Override
    @Transactional
    public void insertBusinessScope(String scopeId, String code, String name, String description, int sortOrder, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO business_scope_catalog (id,code,name,description,active,sort_order,system_locked,
                                                    created_at,updated_at)
                VALUES (?,?,?,?,1,?,0,?,?)""", scopeId, code, name, description, sortOrder, now, now);
    }

    @Override
    @Transactional
    public void updateBusinessScope(String scopeId, String code, String name, String description, int sortOrder, Instant now) {
        jdbcTemplate.update("""
                UPDATE business_scope_catalog SET code=?,name=?,description=?,sort_order=?,updated_at=? WHERE id=?""",
                code, name, description, sortOrder, now, scopeId);
    }

    @Override
    @Transactional
    public void setBusinessScopeActive(String scopeId, boolean active, Instant now) {
        jdbcTemplate.update("UPDATE business_scope_catalog SET active=?,updated_at=? WHERE id=?",
                active ? 1 : 0, now, scopeId);
    }

    @Override
    @Transactional
    public void deleteBusinessScope(String scopeId) {
        jdbcTemplate.update("DELETE FROM business_scope_catalog WHERE id=?", scopeId);
    }

    // ---------- business_role_group_catalog ----------
    @Override
    public Optional<Map<String, Object>> findBusinessRoleGroup(String groupId) {
        return first("SELECT * FROM business_role_group_catalog WHERE id=?", groupId);
    }

    @Override
    public boolean businessRoleGroupCodeExists(String code, String excludeId) {
        Long n = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM business_role_group_catalog WHERE code=? AND id<>?", Long.class, code, excludeId);
        return n != null && n > 0;
    }

    @Override
    public long countRolesUsingGroup(String groupId) {
        Long n = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM role_catalog WHERE business_group_id=?", Long.class, groupId);
        return n == null ? 0 : n;
    }

    @Override
    @Transactional
    public void insertBusinessRoleGroup(String groupId, String code, String name, String description, String engineRole,
                                        int sortOrder, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO business_role_group_catalog (id,code,name,description,engine_role,active,sort_order,
                                                         system_locked,created_at,updated_at)
                VALUES (?,?,?,?,?,1,?,0,?,?)""", groupId, code, name, description, engineRole, sortOrder, now, now);
    }

    @Override
    @Transactional
    public void updateBusinessRoleGroup(String groupId, String code, String name, String description, String engineRole,
                                        int sortOrder, Instant now) {
        jdbcTemplate.update("""
                UPDATE business_role_group_catalog SET code=?,name=?,description=?,engine_role=?,sort_order=?,
                                                       updated_at=? WHERE id=?""",
                code, name, description, engineRole, sortOrder, now, groupId);
    }

    @Override
    @Transactional
    public void setBusinessRoleGroupActive(String groupId, boolean active, Instant now) {
        jdbcTemplate.update("UPDATE business_role_group_catalog SET active=?,updated_at=? WHERE id=?",
                active ? 1 : 0, now, groupId);
    }

    @Override
    @Transactional
    public void deleteBusinessRoleGroup(String groupId) {
        jdbcTemplate.update("DELETE FROM business_role_group_scopes WHERE business_group_id=?", groupId);
        jdbcTemplate.update("DELETE FROM business_role_group_catalog WHERE id=?", groupId);
    }

    @Override
    @Transactional
    public void replaceGroupScopes(String groupId, List<String> scopeIds, String firstNameWhenPrimary, Instant now) {
        jdbcTemplate.update("DELETE FROM business_role_group_scopes WHERE business_group_id=?", groupId);
        for (int i = 0; i < scopeIds.size(); i++) {
            String scopeId = scopeIds.get(i);
            jdbcTemplate.update("""
                    INSERT INTO business_role_group_scopes (id,business_group_id,business_scope_id,is_primary,
                                                            created_at,updated_at)
                    VALUES (?,?,?,?,?,?)""",
                    "BRGS_" + java.util.UUID.randomUUID(), groupId, scopeId, i == 0 ? 1 : 0, now, now);
        }
    }

    @Override
    @Transactional
    public void syncRolesBaseRoleByGroup(String groupId, String engineRole, Instant now) {
        jdbcTemplate.update("UPDATE role_catalog SET base_role=?,updated_at=? WHERE business_group_id=?",
                engineRole, now, groupId);
    }

    @Override
    public List<String> listActiveScopeIds() {
        return jdbcTemplate.queryForList("SELECT id FROM business_scope_catalog WHERE active=1", String.class);
    }

    // ---------- reorder_menu_layout ----------
    @Override
    public Map<String, Object> findMenuGroupByKeyRow(String groupKey) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT group_key AS groupKey,name FROM menu_group_catalog WHERE group_key=?", groupKey);
        return rows.isEmpty() ? null : rows.get(0);
    }

    @Override
    public List<Map<String, Object>> listMenuGroups() {
        return jdbcTemplate.queryForList("SELECT group_key AS groupKey,name FROM menu_group_catalog ORDER BY sort_order,name");
    }

    @Override
    @Transactional
    public void updateMenuGroupSort(String groupKey, int sortOrder, Instant now) {
        jdbcTemplate.update("UPDATE menu_group_catalog SET sort_order=?,updated_at=? WHERE group_key=?",
                sortOrder, now, groupKey);
    }

    @Override
    @Transactional
    public void updateModuleGroupAndSort(String moduleKey, String groupKey, String groupName, int sortOrder, Instant now) {
        jdbcTemplate.update("""
                UPDATE module_catalog SET group_key=?,group_name=?,sort_order=?,updated_at=? WHERE module_key=?""",
                groupKey, groupName, sortOrder, now, moduleKey);
    }

    @Override
    public boolean moduleKeyExists(String moduleKey) {
        Long n = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM module_catalog WHERE module_key=?",
                Long.class, moduleKey);
        return n != null && n > 0;
    }

    // ---------- reorder_form_fields ----------
    @Override
    public List<Map<String, Object>> listFormFields(String formKey) {
        return jdbcTemplate.queryForList("""
                SELECT id,field_key AS fieldKey,display_name AS displayName,source_kind AS sourceKind,
                       data_type AS dataType,system_locked AS systemLocked,active,
                       visible,required,importable,exportable,editable,sort_order AS sortOrder
                FROM form_field_config WHERE form_key=? ORDER BY sort_order,display_name""", formKey);
    }

    @Override
    @Transactional
    public void updateFormFieldSortConfig(String id, String displayName, String dataType, boolean visible,
                                          boolean required, boolean importable, boolean exportable,
                                          boolean editable, int sortOrder, boolean active, Instant now) {
        jdbcTemplate.update("""
                UPDATE form_field_config SET display_name=?,data_type=?,visible=?,required=?,importable=?,
                                             exportable=?,editable=?,sort_order=?,active=?,updated_at=? WHERE id=?""",
                displayName, dataType, visible ? 1 : 0, required ? 1 : 0, importable ? 1 : 0, exportable ? 1 : 0,
                editable ? 1 : 0, sortOrder, active ? 1 : 0, now, id);
    }

    // ---------- helpers ----------
    private Optional<Map<String, Object>> first(String sql, Object... args) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, args);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    private static String norm(String s) {
        String n = java.text.Normalizer.normalize(s == null ? "" : s, java.text.Normalizer.Form.NFD);
        n = n.replaceAll("\\p{M}", "").replace("đ", "d").replace("Đ", "D");
        return n.trim().toUpperCase().replaceAll("\\s+", " ");
    }
}