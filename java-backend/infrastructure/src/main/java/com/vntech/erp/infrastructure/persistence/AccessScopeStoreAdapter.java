package com.vntech.erp.infrastructure.persistence;

import com.vntech.erp.application.port.out.AccessScopeStore;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Đọc phạm vi truy cập (project/warehouse scope) — native SQL, phản chiếu đúng truy vấn của JS
 * trong {@code canAccessProject()}/{@code canAccessWarehouse()}.
 */
@Component
public class AccessScopeStoreAdapter implements AccessScopeStore {

    private final JdbcTemplate jdbcTemplate;

    public AccessScopeStoreAdapter(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<String> projectScopePermission(String userId, String projectId) {
        List<String> rows = jdbcTemplate.queryForList(
                "SELECT permission FROM user_project_scopes WHERE user_id=? AND project_id=?",
                String.class, userId, projectId);
        return rows.isEmpty() ? Optional.empty() : Optional.ofNullable(rows.get(0));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<String> warehouseScopePermission(String userId, String warehouseId) {
        List<String> rows = jdbcTemplate.queryForList(
                "SELECT permission FROM user_warehouse_scopes WHERE user_id=? AND warehouse_id=?",
                String.class, userId, warehouseId);
        return rows.isEmpty() ? Optional.empty() : Optional.ofNullable(rows.get(0));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Map<String, Object>> findActiveWarehouseBasic(String warehouseId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT id,type,project_id AS projectId FROM warehouses WHERE id=? AND active=1", warehouseId);
        if (rows.isEmpty()) return Optional.empty();
        // ⛔ SỬA LỖI (TASK-133, phát hiện khi viết test H2 cho luồng xuất kho):
        // `AccessScopeService.canAccessWarehouse` đọc `warehouse.get("projectId")` — tên alias do CÂU SQL
        // quyết định. H2 (MODE=MySQL) **hạ chữ thường nhãn cột** nên trả về khoá `projectid`, còn MySQL
        // giữ `projectId` ⇒ trên H2 phép đọc LUÔN ra null ⇒ projectId="" ⇒ nhánh «kho site» của
        // canAccessWarehouse **LUÔN false** ⇒ MỌI thao tác kho của vai trò kho (thủ kho) bị 403 OAN trong
        // test H2 (đo được: `AccessScopeService:96` `canAccessProject(userId,role,"",true)` = false dù
        // `user_project_scopes` CÓ dòng write). Chuẩn hoá khoá về đúng tên alias để hai engine hành xử giống nhau.
        Map<String, Object> row = new LinkedHashMap<>();
        for (Map.Entry<String, Object> e : rows.get(0).entrySet()) {
            row.put("projectid".equalsIgnoreCase(e.getKey()) && !"projectId".equals(e.getKey())
                    ? "projectId" : e.getKey(), e.getValue());
        }
        return Optional.of(row);
    }
}
