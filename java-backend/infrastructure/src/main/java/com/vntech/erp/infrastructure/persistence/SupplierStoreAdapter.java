package com.vntech.erp.infrastructure.persistence;

import com.vntech.erp.application.port.out.SupplierStore;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/** Adapter nhà cung cấp — native SQL port from JS. */
@Component
public class SupplierStoreAdapter implements SupplierStore {

    private final JdbcTemplate jdbcTemplate;

    public SupplierStoreAdapter(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public boolean supplierCodeExists(String code, String excludeId) {
        Long n = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM suppliers WHERE upper(code)=upper(?) AND id<>COALESCE(?, '__NEW__')",
                Long.class, code, excludeId == null ? "" : excludeId);
        return n != null && n > 0;
    }

    @Override
    public Optional<Map<String, Object>> findSupplier(String supplierId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT * FROM suppliers WHERE id=?", supplierId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    public long countSupplierPurchaseOrders(String supplierId) {
        Long n = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM purchase_orders WHERE supplier_id=?", Long.class, supplierId);
        return n == null ? 0 : n;
    }

    @Override
    @Transactional
    public void insertSupplier(String id, String code, String name, String taxCode, String contactName,
                               String phone, int leadTimeDays, double rating, boolean active, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO suppliers (id,code,name,tax_code,contact_name,phone,lead_time_days,rating,active,
                                       created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
                id, code, name, taxCode, contactName, phone, leadTimeDays, rating, active ? 1 : 0, now, now);
    }

    @Override
    @Transactional
    public void updateSupplier(String id, String code, String name, String taxCode, String contactName,
                               String phone, int leadTimeDays, double rating, boolean active, Instant now) {
        jdbcTemplate.update("""
                UPDATE suppliers SET code=?,name=?,tax_code=?,contact_name=?,phone=?,lead_time_days=?,rating=?,
                                     active=?,updated_at=? WHERE id=?""",
                code, name, taxCode, contactName, phone, leadTimeDays, rating, active ? 1 : 0, now, id);
    }

    @Override
    @Transactional
    public void setSupplierActive(String id, boolean active, Instant now) {
        jdbcTemplate.update("UPDATE suppliers SET active=?,updated_at=? WHERE id=?", active ? 1 : 0, now, id);
    }

    @Override
    @Transactional
    public void deleteSupplier(String id) {
        jdbcTemplate.update("DELETE FROM suppliers WHERE id=?", id);
    }
}