package com.vntech.erp.application.service;

import com.vntech.erp.application.port.out.IdGenerator;
import com.vntech.erp.application.port.out.SupplierStore;
import com.vntech.erp.application.rbac.RbacService;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Use-case nhà cung cấp — port nguyên trạng save_supplier/set_supplier_status/delete_supplier JS.
 * Quyền: save/status mọi user có module supplier_catalog (RBAC ở web); delete cần admin hoặc KH approver.
 */
public final class SupplierManagementUseCase {

    private final SupplierStore store;
    private final IdGenerator idGenerator;

    public SupplierManagementUseCase(SupplierStore store, IdGenerator idGenerator) {
        this.store = store;
        this.idGenerator = idGenerator;
    }

    public interface Principal {
        String userId();
        String role();
    }

    // ══════════════════════════════════════════════════════════════════════════════════════════════
    // MT2-P3-05 — VẬT TƯ CỦA NHÀ CUNG CẤP (§6.3 Tab 3 «Danh sách vật tư» · §6.4 auto-detection).
    // Quyền: cùng module **`supplier_catalog`** như `save_supplier` (RBAC ở tầng web).
    // ⛔ **KHÔNG tự thêm** vật tư khi phát hiện thiếu — §6.4 yêu cầu **HỎI user**;
    //    backend chỉ **TRẢ DANH SÁCH THIẾU** để giao diện hỏi ✔
    // ⛔ KHÔNG đụng `saveSupplier`/`setSupplierStatus`/`deleteSupplier` (hàm cũ giữ nguyên chữ ký).
    // ══════════════════════════════════════════════════════════════════════════════════════════════

    /** §6.3 Tab 3 — danh sách vật tư của NCC. */
    public List<Map<String, Object>> supplierMaterials(Principal principal, Map<String, Object> payload) {
        String supplierId = trim(payload.get("supplierId"));
        if (supplierId.isEmpty()) throw Api("Thiếu nhà cung cấp.");
        return store.supplierMaterials(supplierId);
    }

    /**
     * §6.4 — thêm vật tư vào danh mục NCC **sau khi user ĐỒNG Ý** (⛔ không tự động).
     * Gặp lại ⇒ cập nhật bản ghi cũ (`times_ordered+1`, giá mới nếu có) — ⛔ không sinh dòng thứ 2
     * vì `supplier_materials` có UNIQUE(`supplier_id`,`material_id`).
     */
    public String saveSupplierMaterial(Principal principal, Map<String, Object> payload) {
        String supplierId = trim(payload.get("supplierId"));
        String materialId = trim(payload.get("materialId"));
        if (supplierId.isEmpty()) throw Api("Thiếu nhà cung cấp.");
        if (materialId.isEmpty()) throw Api("Thiếu vật tư.");
        if (store.findSupplier(supplierId).isEmpty()) throw Api("Không tìm thấy nhà cung cấp " + supplierId + ".");
        Double price = null;
        String raw = trim(payload.get("lastUnitPrice"));
        if (!raw.isEmpty()) {
            try {
                price = Double.valueOf(raw);
            } catch (NumberFormatException ignored) {
                throw Api("Đơn giá không hợp lệ.");
            }
        }
        store.upsertSupplierMaterial(idGenerator.next("SUPMAT"), supplierId, materialId, price, Instant.now());
        return "Đã thêm vật tư vào danh mục nhà cung cấp.";
    }

    /** §6.4 — tín hiệu auto-detect: vật tư **PO cần** mà NCC của PO **chưa có** ⇒ `{missing:[…]}` cho UI HỎI. */
    public Map<String, Object> supplierMaterialGaps(Principal principal, Map<String, Object> payload) {
        String purchaseOrderId = trim(payload.get("purchaseOrderId"));
        if (purchaseOrderId.isEmpty()) throw Api("Thiếu đơn mua hàng.");
        List<Map<String, Object>> missing = store.materialsMissingForSupplierOfPo(purchaseOrderId);
        return Map.of("missing", missing, "missingCount", missing.size());
    }

    public String saveSupplier(Principal principal, Map<String, Object> payload) {
        String supplierId = trim(payload.get("supplierId"));
        String code = trim(payload.get("code")).toUpperCase();
        String name = trim(payload.get("name"));
        if (code.isEmpty() || name.isEmpty()) throw Api("Nhà cung cấp phải có Mã NCC và Tên nhà cung cấp.");
        if (store.supplierCodeExists(code, supplierId)) throw Api("Mã nhà cung cấp đã tồn tại.");
        String taxCode = nvl(payload.get("taxCode"));
        String contactName = nvl(payload.get("contactName"));
        String phone = nvl(payload.get("phone"));
        int leadTimeDays = Math.max(0, (int) Math.floor(numberValue(payload.get("leadTimeDays"))));
        double rating = Math.max(0, Math.min(5, numberValue(payload.get("rating"))));
        boolean active = !(payload.get("active") == Boolean.FALSE || "0".equals(trim(payload.get("active"))));
        // MT2-P8-04 (§6.2) — Email là 1 trong 8 thông tin của «Create Supplier».
        // ⚠️ `email` để trống ⇒ `setSupplierEmail` ghi NULL (⛔ KHÔNG bịa, ⛔ KHÔNG lưu chuỗi rỗng).
        String email = nvl(payload.get("email"));
        Instant now = Instant.now();
        if (!supplierId.isEmpty()) {
            store.findSupplier(supplierId).orElseThrow(() -> Api("Không tìm thấy nhà cung cấp."));
            store.updateSupplier(supplierId, code, name, taxCode, contactName, phone, leadTimeDays, rating, active, now);
            // ⚠️ Gọi SAU `updateSupplier` — ⛔ KHÔNG đổi chữ ký hàm cũ (bài học MT2-P3-04).
            store.setSupplierEmail(supplierId, email, now);
            return "Đã cập nhật nhà cung cấp " + code + ".";
        }
        String newSupplierId = idGenerator.next("SUP");
        store.insertSupplier(newSupplierId, code, name, taxCode, contactName, phone,
                leadTimeDays, rating, active, now);
        // ⚠️ Cột `email` do migration V28 tạo ⇒ ghi bằng hàm MỚI, ngay sau INSERT.
        store.setSupplierEmail(newSupplierId, email, now);
        return "Đã thêm nhà cung cấp " + code + ".";
    }

    public String setSupplierStatus(Principal principal, Map<String, Object> payload) {
        String supplierId = trim(payload.get("supplierId"));
        boolean active = payload.get("active") == Boolean.TRUE || "1".equals(trim(payload.get("active")));
        store.findSupplier(supplierId).orElseThrow(() -> Api("Không tìm thấy nhà cung cấp."));
        store.setSupplierActive(supplierId, active, Instant.now());
        return active ? "Đã kích hoạt nhà cung cấp." : "Đã ẩn nhà cung cấp khỏi danh sách lập PO.";
    }

    public String deleteSupplier(Principal principal, Map<String, Object> payload) {
        String supplierId = trim(payload.get("supplierId"));
        Map<String, Object> old = store.findSupplier(supplierId)
                .orElseThrow(() -> Api("Không tìm thấy nhà cung cấp."));
        if (store.countSupplierPurchaseOrders(supplierId) > 0) {
            store.setSupplierActive(supplierId, false, Instant.now());
            return "Nhà cung cấp đã phát sinh PO nên không xóa vật lý; hệ thống đã chuyển sang Ngừng sử dụng.";
        }
        store.deleteSupplier(supplierId);
        return "Đã xóa Nhà cung cấp chưa phát sinh PO.";
    }

    // ---- helpers ----
    private static double numberValue(Object o) {
        try { return o == null ? 0 : Double.parseDouble(String.valueOf(o)); }
        catch (NumberFormatException e) { return 0; }
    }
    private static String trim(Object o) { return o == null ? "" : String.valueOf(o).trim(); }
    private static String nvl(Object o) { String s = trim(o); return s.isEmpty() ? null : s; }
    private static AuthUseCase.ApiError Api(String message) { return new AuthUseCase.ApiError(message, 400); }
}