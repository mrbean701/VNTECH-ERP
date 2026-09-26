package com.vntech.erp.infrastructure.persistence;

import com.vntech.erp.application.port.out.PartnerStore;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * TASK-127 — Adapter ĐỐI TÁC (bảng riêng `partners`), khuôn y hệt {@link SupplierStoreAdapter}.
 * Native SQL, cột snake_case của bảng `partners` (Flyway `V23__partners_table.sql`).
 */
@Component
public class PartnerStoreAdapter implements PartnerStore {

    private final JdbcTemplate jdbcTemplate;

    public PartnerStoreAdapter(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public boolean partnerCodeExists(String code, String excludeId) {
        Long n = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM partners WHERE upper(code)=upper(?) AND id<>COALESCE(?, '__NEW__')",
                Long.class, code, excludeId == null ? "" : excludeId);
        return n != null && n > 0;
    }

    @Override
    public Optional<Map<String, Object>> findPartner(String partnerId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT * FROM partners WHERE id=?", partnerId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    @Transactional
    public void insertPartner(String id, String code, String name, String taxCode, String address,
                              String contactName, String contactPhone, String email, String partnerType,
                              String status, boolean active, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO partners (id,code,name,tax_code,address,contact_name,contact_phone,email,
                                      partner_type,status,active,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                id, code, name, taxCode, address, contactName, contactPhone, email,
                partnerType, status, active ? 1 : 0, now, now);
    }

    @Override
    @Transactional
    public void updatePartner(String id, String code, String name, String taxCode, String address,
                              String contactName, String contactPhone, String email, String partnerType,
                              String status, boolean active, Instant now) {
        jdbcTemplate.update("""
                UPDATE partners SET code=?,name=?,tax_code=?,address=?,contact_name=?,contact_phone=?,
                                    email=?,partner_type=?,status=?,active=?,updated_at=? WHERE id=?""",
                code, name, taxCode, address, contactName, contactPhone, email,
                partnerType, status, active ? 1 : 0, now, id);
    }

    @Override
    @Transactional
    public void setPartnerActive(String id, boolean active, String status, Instant now) {
        jdbcTemplate.update("UPDATE partners SET active=?,status=?,updated_at=? WHERE id=?",
                active ? 1 : 0, status, now, id);
    }

    @Override
    @Transactional
    public void deletePartner(String id) {
        jdbcTemplate.update("DELETE FROM partners WHERE id=?", id);
    }
}
