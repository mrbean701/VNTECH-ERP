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
        Instant now = Instant.now();
        if (!supplierId.isEmpty()) {
            store.findSupplier(supplierId).orElseThrow(() -> Api("Không tìm thấy nhà cung cấp."));
            store.updateSupplier(supplierId, code, name, taxCode, contactName, phone, leadTimeDays, rating, active, now);
            return "Đã cập nhật nhà cung cấp " + code + ".";
        }
        store.insertSupplier(idGenerator.next("SUP"), code, name, taxCode, contactName, phone,
                leadTimeDays, rating, active, now);
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