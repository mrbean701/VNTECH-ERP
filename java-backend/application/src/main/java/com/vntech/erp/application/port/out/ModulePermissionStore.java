package com.vntech.erp.application.port.out;

/**
 * Port đọc quyền module của user (user_module_permissions + module_catalog + menu_group_catalog).
 * Port nguyên trạng canUseModule() của monolith JS.
 */
public interface ModulePermissionStore {

    /** user có quyền capability trên module (canView/canUse/canCreate/canEdit/canApprove/canExport)? */
    boolean canUseModule(String userId, String moduleKey, String capability);
}