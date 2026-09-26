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

    // MT2-P8-04 (§6.2) — GHI EMAIL NCC. Cột `suppliers.email` tạo ở migration V28.
    // ⚠️ HÀM MỚI (thuần thêm) — ⛔ KHÔNG đụng `insertSupplier`/`updateSupplier` (bài học MT2-P3-04).
    // ⚠️ `email` rỗng/blank ⇒ ghi NULL: ⛔ KHÔNG lưu chuỗi rỗng (dữ liệu sạch, ⛔ không bịa).
    @Override
    @Transactional
    public void setSupplierEmail(String id, String email, Instant now) {
        String normalized = (email == null || email.isBlank()) ? null : email.trim();
        jdbcTemplate.update("UPDATE suppliers SET email=?,updated_at=? WHERE id=?", normalized, now, id);
    }

    @Override
    @Transactional
    public void deleteSupplier(String id) {
        jdbcTemplate.update("DELETE FROM suppliers WHERE id=?", id);
    }

    // ══════════════════════════════════════════════════════════════════════════════════════════════
    // MT2-P3-05 — VẬT TƯ CỦA NHÀ CUNG CẤP (§6.3 Tab 3 · §6.4 auto-detection). Bảng có từ V27.
    // · Alias **TRÍCH DẪN** (`AS "materialId"`) để giữ chữ hoa ở CẢ MySQL và H2.
    // · ⛔ KHÔNG subquery `ORDER BY … LIMIT` trong danh sách chọn (bài học `stockIssueGrnLines`).
    // · ⚠️ `purchase_order_items` ⛔ **KHÔNG có `material_id`** ⇒ phải đi qua `request_item_id`
    //   → `material_request_items.material_id` (đã trả giá ở MT2-P3-09).
    // ══════════════════════════════════════════════════════════════════════════════════════════════

    @Override
    public java.util.List<Map<String, Object>> supplierMaterials(String supplierId) {
        return jdbcTemplate.queryForList("""
                SELECT sm.id AS "id",sm.material_id AS "materialId",m.code AS "materialCode",
                       m.name AS "materialName",m.unit AS "unit",sm.times_ordered AS "timesOrdered",
                       sm.last_ordered_at AS "lastOrderedAt",sm.last_unit_price AS "lastUnitPrice",sm.active AS "active"
                FROM supplier_materials sm
                LEFT JOIN materials m ON m.id=sm.material_id
                WHERE sm.supplier_id=?
                ORDER BY m.code,sm.id""", supplierId);
    }

    @Override
    public java.util.List<Map<String, Object>> materialsMissingForSupplierOfPo(String purchaseOrderId) {
        return jdbcTemplate.queryForList("""
                SELECT m.id AS "materialId",m.code AS "materialCode",m.name AS "materialName",m.unit AS "unit"
                FROM purchase_orders po
                JOIN purchase_order_items poi ON poi.purchase_order_id=po.id
                JOIN material_request_items mri ON mri.id=poi.request_item_id
                JOIN materials m ON m.id=mri.material_id
                WHERE po.id=?
                  AND NOT EXISTS (SELECT 1 FROM supplier_materials sm
                                  WHERE sm.supplier_id=po.supplier_id AND sm.material_id=m.id)
                ORDER BY m.code,m.id""", purchaseOrderId);
    }

    @Override
    @Transactional
    public void upsertSupplierMaterial(String id, String supplierId, String materialId, Double lastUnitPrice, Instant now) {
        // ⛔ KHÔNG `ON DUPLICATE KEY UPDATE` (MySQL-only): **UPDATE trước, 0 dòng thì INSERT** (chạy cả H2).
        int changed = jdbcTemplate.update("""
                UPDATE supplier_materials SET active=1,times_ordered=times_ordered+1,last_ordered_at=?,
                       last_unit_price=COALESCE(?,last_unit_price),updated_at=?
                WHERE supplier_id=? AND material_id=?""",
                now, lastUnitPrice, now, supplierId, materialId);
        if (changed == 0) {
            jdbcTemplate.update("""
                    INSERT INTO supplier_materials (id,supplier_id,material_id,times_ordered,last_ordered_at,
                                                    last_unit_price,active,created_at,updated_at)
                    VALUES (?,?,?,1,?,?,1,?,?)""",
                    id, supplierId, materialId, now, lastUnitPrice, now, now);
        }
    }
}