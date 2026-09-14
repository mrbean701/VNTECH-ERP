package com.vntech.erp.application.port.out;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Port cấu hình hệ thống admin — port nguyên trạng save_organization_unit/set_organization_unit_status/
 * set_organization_unit_member, save_menu_group/set_menu_group_status/delete_menu_group,
 * save_module_catalog/set_module_status, save_form_field_config/delete_form_field_config của JS.
 */
public interface AdminSystemStore {

    // ---- organization_units ----
    Optional<Map<String, Object>> findOrganizationUnitFull(String id);
    boolean organizationUnitCodeExists(String code, String excludeId);
    boolean organizationUnitNameExists(String name, String excludeId);
    Optional<Map<String, Object>> findOrgByCodeOrName(String value);          // resolveOrganizationUnit (active)
    boolean isDescendant(String descendantId, String potentialAncestorId);    // WITH RECURSIVE descendants
    void insertOrganizationUnit(String id, String code, String name, String unitType, String parentId,
                                String projectId, String description, String effectiveFrom, String effectiveTo,
                                int sortOrder, boolean systemLocked, Instant now);
    void updateOrganizationUnit(String id, String code, String name, String unitType, String parentId,
                                String projectId, String description, String effectiveFrom, String effectiveTo,
                                int sortOrder, Instant now);
    void syncUserDepartmentsByOrg(String organizationUnitId, String name, Instant now);
    void setOrganizationUnitActive(String id, boolean active, Instant now);
    long countActiveUsersByOrg(String organizationUnitId);
    long countActiveChildrenByOrg(String organizationUnitId);
    Optional<Map<String, Object>> findUserOrgMembership(String userId);       // site_command member target
    Optional<Map<String, Object>> findSiteCommandUnit(String organizationUnitId);
    void assignUserToUnit(String userId, String organizationUnitId, String departmentName, Instant now);
    void unassignUserFromUnit(String userId, Instant now);

    // ---- menu_group_catalog ----
    Optional<Map<String, Object>> findMenuGroup(String id);
    Optional<Map<String, Object>> findMenuGroupByKey(String groupKey);
    boolean menuGroupKeyExists(String groupKey);
    void insertMenuGroup(String id, String groupKey, String name, String icon, boolean collapsible,
                         int sortOrder, Instant now);
    void updateMenuGroup(String id, String name, String icon, boolean collapsible, int sortOrder, Instant now);
    void syncModuleGroupName(String groupKey, String name, Instant now);
    void setMenuGroupActive(String id, boolean active, Instant now);
    Optional<Map<String, Object>> findAdminModuleInGroup(String groupKey);
    long countModulesInGroup(String groupKey);
    void deleteMenuGroup(String id);

    // ---- module_catalog ----
    Optional<Map<String, Object>> findModule(String moduleKey);
    void updateModule(String moduleKey, String label, String icon, String groupName, String groupKey,
                      int sortOrder, Instant now);
    void setModuleActive(String moduleKey, boolean active, Instant now);

    // ---- form_field_config ----
    List<String> validFormKeys();
    Optional<Map<String, Object>> findFormField(String formKey, String fieldKey);
    void upsertFormField(String configId, String formKey, String fieldKey, String displayName, String dataType,
                         String sourceKind, boolean visible, boolean required, boolean importable,
                         boolean exportable, boolean editable, int sortOrder, String optionsJson,
                         boolean systemLocked, boolean active, Instant now);
    void disableFormField(String formKey, String fieldKey, Instant now);

    // ---- warehouse_locations ----
    Optional<Map<String, Object>> findWarehouse(String warehouseId);
    void upsertWarehouseLocation(String warehouseId, String code, String name, String locationType,
                                 boolean secure, boolean active, Instant now);

    // ---- business_role_engine_catalog (save_engine_role_profile) ----
    Optional<Map<String, Object>> findEngineProfile(String profileId, String engineKey);
    boolean engineCompanyCodeExists(String companyCode, String excludeId);
    void updateEngineProfile(String profileId, String companyCode, String displayName, String description,
                             int sortOrder, Instant now);

    // ---- business_scope_catalog (save/set_status/delete_business_scope) ----
    Optional<Map<String, Object>> findBusinessScope(String scopeId);
    boolean businessScopeDuplicate(String code, String name, String excludeId);
    boolean businessScopeInUseByActiveGroup(String scopeId);
    boolean businessScopeInUse(String scopeId);
    void insertBusinessScope(String scopeId, String code, String name, String description, int sortOrder, Instant now);
    void updateBusinessScope(String scopeId, String code, String name, String description, int sortOrder, Instant now);
    void setBusinessScopeActive(String scopeId, boolean active, Instant now);
    void deleteBusinessScope(String scopeId);

    // ---- business_role_group_catalog (save/set_status/delete_business_role_group) ----
    Optional<Map<String, Object>> findBusinessRoleGroup(String groupId);
    boolean businessRoleGroupCodeExists(String code, String excludeId);
    long countRolesUsingGroup(String groupId);
    void insertBusinessRoleGroup(String groupId, String code, String name, String description, String engineRole,
                                 int sortOrder, Instant now);
    void updateBusinessRoleGroup(String groupId, String code, String name, String description, String engineRole,
                                 int sortOrder, Instant now);
    void setBusinessRoleGroupActive(String groupId, boolean active, Instant now);
    void deleteBusinessRoleGroup(String groupId);
    /** persist scopes của group: xóa cũ + insert mới (logic persistScopes JS). */
    void replaceGroupScopes(String groupId, List<String> scopeIds, String firstNameWhenPrimary, Instant now);
    void syncRolesBaseRoleByGroup(String groupId, String engineRole, Instant now);
    List<String> listActiveScopeIds();

    // ---- reorder_menu_layout ----
    Map<String, Object> findMenuGroupByKeyRow(String groupKey);
    java.util.List<Map<String, Object>> listMenuGroups();
    void updateMenuGroupSort(String groupKey, int sortOrder, Instant now);
    void updateModuleGroupAndSort(String moduleKey, String groupKey, String groupName, int sortOrder, Instant now);
    boolean moduleKeyExists(String moduleKey);

    // ---- reorder_form_fields ----
    List<Map<String, Object>> listFormFields(String formKey);
    void updateFormFieldSortConfig(String id, String displayName, String dataType, boolean visible, boolean required,
                                   boolean importable, boolean exportable, boolean editable, int sortOrder,
                                   boolean active, Instant now);
}