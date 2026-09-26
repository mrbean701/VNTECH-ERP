package com.vntech.erp.application.service;

import com.vntech.erp.application.port.out.IdGenerator;
import com.vntech.erp.application.port.out.PartnerStore;

import java.time.Instant;
import java.util.Map;

/**
 * TASK-127 (21/09/2026) — Use-case ĐỐI TÁC: port nguyên trạng `save_partner` / `set_partner_status` /
 * `delete_partner` của JS (`scripts/system-route.mjs:1340-1358`) sang Java (bảng riêng `partners`).
 *
 * <p>Khuôn sao chép 1-1 từ {@link SupplierManagementUseCase} (cùng cách đọc payload, cùng kiểu trả về
 * {@code String message}, cùng cách ném {@link AuthUseCase.ApiError} 400).
 * Quyền: RBAC ở tầng web dùng khoá SẴN CÓ `supplier_catalog` + capability `canEdit` ⇒ 0 khoá mới.
 */
public final class PartnerManagementUseCase {

    private final PartnerStore store;
    private final IdGenerator idGenerator;

    public PartnerManagementUseCase(PartnerStore store, IdGenerator idGenerator) {
        this.store = store;
        this.idGenerator = idGenerator;
    }

    public interface Principal {
        String userId();
        String role();
    }

    public String savePartner(Principal principal, Map<String, Object> payload) {
        String partnerId = trim(payload.get("partnerId"));
        String code = trim(payload.get("code")).toUpperCase();
        String name = trim(payload.get("name"));
        if (code.isEmpty() || name.isEmpty()) throw Api("Đối tác phải có Mã đối tác và Tên đối tác.");
        if (store.partnerCodeExists(code, partnerId)) throw Api("Mã đối tác đã tồn tại.");
        String taxCode = nvl(payload.get("taxCode"));
        String address = nvl(payload.get("address"));
        String contactName = nvl(payload.get("contactName"));
        String contactPhone = nvl(payload.get("contactPhone"));
        String email = nvl(payload.get("email"));
        String partnerType = nvl(payload.get("partnerType"));
        if (partnerType == null) partnerType = "supplier";
        boolean active = !(payload.get("active") == Boolean.FALSE || "0".equals(trim(payload.get("active"))));
        String status = nvl(payload.get("status"));
        if (status == null) status = active ? "active" : "inactive";
        Instant now = Instant.now();
        if (!partnerId.isEmpty()) {
            store.findPartner(partnerId).orElseThrow(() -> Api("Không tìm thấy đối tác."));
            store.updatePartner(partnerId, code, name, taxCode, address, contactName, contactPhone,
                    email, partnerType, status, active, now);
            return "Đã cập nhật đối tác " + code + ".";
        }
        store.insertPartner(idGenerator.next("PTR"), code, name, taxCode, address, contactName,
                contactPhone, email, partnerType, status, active, now);
        return "Đã thêm đối tác " + code + ".";
    }

    public String setPartnerStatus(Principal principal, Map<String, Object> payload) {
        String partnerId = trim(payload.get("partnerId"));
        boolean active = payload.get("active") == Boolean.TRUE || "1".equals(trim(payload.get("active")));
        store.findPartner(partnerId).orElseThrow(() -> Api("Không tìm thấy đối tác."));
        store.setPartnerActive(partnerId, active, active ? "active" : "inactive", Instant.now());
        return active ? "Đã kích hoạt đối tác." : "Đã chuyển đối tác sang Ngừng sử dụng.";
    }

    public String deletePartner(Principal principal, Map<String, Object> payload) {
        String partnerId = trim(payload.get("partnerId"));
        store.findPartner(partnerId).orElseThrow(() -> Api("Không tìm thấy đối tác."));
        store.deletePartner(partnerId);
        return "Đã xóa Đối tác.";
    }

    // ---- helpers (giống SupplierManagementUseCase) ----
    private static String trim(Object o) { return o == null ? "" : String.valueOf(o).trim(); }
    private static String nvl(Object o) { String s = trim(o); return s.isEmpty() ? null : s; }
    private static AuthUseCase.ApiError Api(String message) { return new AuthUseCase.ApiError(message, 400); }
}
