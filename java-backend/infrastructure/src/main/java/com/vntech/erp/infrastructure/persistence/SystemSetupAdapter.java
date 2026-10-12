package com.vntech.erp.infrastructure.persistence;

import com.vntech.erp.application.port.out.SystemSetupPort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Seed dữ liệu nền khi cài mới — port 1:1 từ seedMasters() monolith JS:
 * company_settings (id=SETTINGS), email_settings (id=EMAIL, disable), warehouses (kho trung tâm).
 */
@Component
public class SystemSetupAdapter implements SystemSetupPort {

    private final JdbcTemplate jdbcTemplate;

    public SystemSetupAdapter(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    @Transactional
    public void seedMasters(String adminUserId, String companyName, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO company_settings (id, company_name, updated_by, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?)
                """, "SETTINGS", companyName, adminUserId, now, now);

        jdbcTemplate.update("""
                INSERT INTO email_settings (id, enabled, smtp_port, security, sender_name, updated_by, created_at, updated_at)
                VALUES (?, 0, 587, ?, ?, ?, ?, ?)
                """, "EMAIL", "starttls", "VNTECH ERP", adminUserId, now, now);

        // INSERT IGNORE (JS) -> kiểm tra tồn tại trước (tránh lỗi unique code)
        // ⭐ TASK-242 (08/10/2026) — ĐỔI `KHO-TONG` ⇒ `KD-001` THEO QUY TẮC USER CHỐT
        //    (`DEC-20261008-013`): «Mã kho sinh theo quy tắc : KD-xxx (xxx là số thứ tự KHÔNG được trùng…)»
        //    + «Mặc định hệ thống sẽ có 1 kho Tổng» ⇒ kho Tổng = mã ĐẦU TIÊN `KD-001` ✓
        //    ⚠️ Đi kèm `V38__session02_warehouse_code_kd_rule.sql` (đổi mã kho ĐÃ có) — ⛔ phải cùng nhau,
        //    nếu chỉ đổi một bên thì DB cũ và DB mới sẽ ⛔ LỆCH mã kho Tổng.
        Integer existing = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM warehouses WHERE code = ?", Integer.class, "KD-001");
        if (existing == null || existing == 0) {
            jdbcTemplate.update("""
                    INSERT INTO warehouses (id, code, name, type, project_id, parent_warehouse_id, keeper_user_id, active, created_at, updated_at)
                    VALUES (?, ?, ?, ?, NULL, NULL, ?, 1, ?, ?)
                    """, "WH-CENTRAL", "KD-001", "Kho trung tâm", "central", adminUserId, now, now);
        }
    }
}