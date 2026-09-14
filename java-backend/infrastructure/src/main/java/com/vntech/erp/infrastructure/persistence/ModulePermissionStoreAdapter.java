package com.vntech.erp.infrastructure.persistence;

import com.vntech.erp.application.port.out.ModulePermissionStore;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Adapter canUseModule — native SQL port nguyên trạng JS:
 *   SELECT ump.can_<capability> FROM user_module_permissions ump
 *   JOIN module_catalog mc ON mc.module_key=ump.module_key AND mc.active=1
 *   LEFT JOIN menu_group_catalog mg ON mg.group_key=mc.group_key
 *   WHERE ump.user_id=? AND ump.module_key=?
 *     AND (ump.permission_expires_at IS NULL OR ump.permission_expires_at>?)
 *     AND (mc.group_key IS NULL OR mg.active=1)
 */
@Component
public class ModulePermissionStoreAdapter implements ModulePermissionStore {

    private static final java.util.Map<String, String> COLUMNS = java.util.Map.of(
            "canView", "can_view", "canUse", "can_use", "canCreate", "can_create",
            "canEdit", "can_edit", "canApprove", "can_approve", "canExport", "can_export");

    private final JdbcTemplate jdbcTemplate;

    public ModulePermissionStoreAdapter(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean canUseModule(String userId, String moduleKey, String capability) {
        String column = COLUMNS.getOrDefault(capability, "can_use");
        Integer allowed = jdbcTemplate.queryForObject("""
                SELECT ump.%s AS allowed
                FROM user_module_permissions ump
                JOIN module_catalog mc ON mc.module_key=ump.module_key AND mc.active=1
                LEFT JOIN menu_group_catalog mg ON mg.group_key=mc.group_key
                WHERE ump.user_id=? AND ump.module_key=?
                  AND (ump.permission_expires_at IS NULL OR ump.permission_expires_at>?)
                  AND (mc.group_key IS NULL OR mg.active=1)
                """.formatted(column), Integer.class, userId, moduleKey, Instant.now());
        return allowed != null && allowed == 1;
    }
}