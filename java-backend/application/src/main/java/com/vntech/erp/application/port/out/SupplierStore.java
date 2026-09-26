package com.vntech.erp.application.port.out;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;

/** Port nhà cung cấp — port nguyên trạng save_supplier/set_supplier_status/delete_supplier JS. */
public interface SupplierStore {

    boolean supplierCodeExists(String code, String excludeId);
    Optional<Map<String, Object>> findSupplier(String supplierId);
    long countSupplierPurchaseOrders(String supplierId);
    void insertSupplier(String id, String code, String name, String taxCode, String contactName,
                        String phone, int leadTimeDays, double rating, boolean active, Instant now);
    void updateSupplier(String id, String code, String name, String taxCode, String contactName,
                        String phone, int leadTimeDays, double rating, boolean active, Instant now);
    void setSupplierActive(String id, boolean active, Instant now);
    void deleteSupplier(String id);

    // ══════════════════════════════════════════════════════════════════════════════════════════════
    // MT2-P3-05 — VẬT TƯ CỦA NHÀ CUNG CẤP (§6.3 Tab 3 «Danh sách vật tư» · §6.4 auto-detection).
    // Bảng `supplier_materials` **đã có từ migration V27** (UNIQUE(`supplier_id`,`material_id`)) ⇒ ⛔ 0 migration.
    // ⚠️ Đây là các hàm MỚI (thuần thêm) — ⛔ KHÔNG đổi chữ ký hàm cũ (bài học MT2-P3-04).
    // ══════════════════════════════════════════════════════════════════════════════════════════════

    /** Liệt kê vật tư của NCC (kèm mã/tên/ĐVT để Tab 3 hiển thị được, ⛔ không trả ID trần). */
    java.util.List<Map<String, Object>> supplierMaterials(String supplierId);

    /** Vật tư mà **PO này cần** nhưng NCC của PO **CHƯA có** ⇒ tín hiệu để UI hỏi đúng câu §6.4. */
    java.util.List<Map<String, Object>> materialsMissingForSupplierOfPo(String purchaseOrderId);

    /**
     * Thêm/cập nhật vật tư vào danh mục NCC. ⚠️ UNIQUE(`supplier_id`,`material_id`) đã có ⇒
     * cài đặt phải **UPDATE trước, 0 dòng thì INSERT** — ⛔ KHÔNG dùng `ON DUPLICATE KEY UPDATE` (MySQL-only).
     * Gặp lại ⇒ `times_ordered + 1` và cập nhật `last_ordered_at`/`last_unit_price`.
     */
    void upsertSupplierMaterial(String id, String supplierId, String materialId, Double lastUnitPrice, Instant now);

    // ══════════════════════════════════════════════════════════════════════════════════════════════
    // MT2-P8-04 (§6.2) — EMAIL của nhà cung cấp (cột `suppliers.email` **tạo ở migration V28**).
    // ⚠️ §6.2: «Create Supplier … thông tin: Mã NCC · Tên NCC · Mã số thuế · Người liên hệ ·
    //          Điện thoại · **Email** …» ⇒ `suppliers` TRƯỚC V28 chỉ có 11 cột, ⛔ KHÔNG có `email`.
    // ⚠️ ĐÂY LÀ HÀM **MỚI (thuần thêm)** — ⛔ KHÔNG đổi chữ ký `insertSupplier`/`updateSupplier`
    //    ở trên (⚠️ đúng bài học MT2-P3-04 ghi tại dòng 23).
    // ⚠️ `email` **nullable** và ⛔ KHÔNG backfill: caller truyền `null` khi form để trống.
    // ══════════════════════════════════════════════════════════════════════════════════════════════

    /** Ghi email liên hệ của NCC. `email` = `null`/rỗng ⇒ ghi NULL (⛔ KHÔNG bịa giá trị). */
    void setSupplierEmail(String id, String email, Instant now);
}