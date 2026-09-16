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
        // PHASE 0B — SỬA LỖI CÓ SẴN BỊ CHE KÍN.
        // Trước đây dùng `queryForObject`, hàm này NÉM EmptyResultDataAccessException khi
        // truy vấn không trả về dòng nào — mà "người dùng không có dòng quyền nào cho module"
        // là trường hợp HOÀN TOÀN BÌNH THƯỜNG (nghĩa là KHÔNG có quyền). Hệ quả: đáng lẽ trả
        // HTTP 403 thì hệ thống trả HTTP 500 kèm stack trace.
        //
        // Lỗi bị che kín suốt thời gian qua vì `canUseModule` CHƯA TỪNG được gọi trong thực tế:
        // RbacService.requireActionModule() được định nghĩa nhưng không nơi nào gọi. Ngay khi
        // bật kiểm quyền ở SystemController (PHASE 0B) thì lỗi này lộ ra ở 11/15 action.
        //
        // Dùng queryForList + kiểm "có BẤT KỲ dòng nào cho phép = 1". Cách này còn xử lý đúng
        // trường hợp một người có nhiều dòng cho cùng module (ví dụ department_default và
        // manual_override cùng tồn tại) — chỉ cần MỘT dòng cho phép là đủ.
        java.util.List<Integer> rows = jdbcTemplate.queryForList("""
                SELECT ump.%s AS allowed
                FROM user_module_permissions ump
                JOIN module_catalog mc ON mc.module_key=ump.module_key AND mc.active=1
                LEFT JOIN menu_group_catalog mg ON mg.group_key=mc.group_key
                WHERE ump.user_id=? AND ump.module_key=?
                  AND (ump.permission_expires_at IS NULL OR ump.permission_expires_at>?)
                  AND (mc.group_key IS NULL OR mg.active=1)
                """.formatted(column), Integer.class, userId, moduleKey, Instant.now());
        for (Integer allowed : rows) {
            if (allowed != null && allowed == 1) return true;
        }
        return false;
    }
}