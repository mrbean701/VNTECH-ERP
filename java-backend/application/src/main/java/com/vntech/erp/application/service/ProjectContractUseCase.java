package com.vntech.erp.application.service;

import com.vntech.erp.application.port.out.IdGenerator;
import com.vntech.erp.application.port.out.ProjectAdminStore;
import com.vntech.erp.application.rbac.RbacService;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Use-case hợp đồng dự án — port nguyên trạng save_project_contract/set_project_contract_status/
 * delete_project_contract của monolith JS (không yêu cầu admin; quyền theo canAccessProject — check ở web).
 */
public final class ProjectContractUseCase {

    private final ProjectAdminStore store;
    private final IdGenerator idGenerator;

    public ProjectContractUseCase(ProjectAdminStore store, IdGenerator idGenerator) {
        this.store = store;
        this.idGenerator = idGenerator;
    }

    public interface Principal {
        String userId();
        String role();
    }

    public Map<String, Object> saveProjectContract(String projectId, Map<String, Object> payload) {
        String contractNo = trim(payload.get("contractNo"));
        String contractName = trim(payload.get("contractName"));
        if (contractNo.isEmpty() || contractName.isEmpty())
            throw Api("Số hợp đồng và tên hợp đồng là bắt buộc.");
        String contractType = List.of("main", "addendum", "other").contains(trim(payload.get("contractType")))
                ? trim(payload.get("contractType")) : "main";
        String parentContractId = nvl(payload.get("parentContractId"));
        String note = nvl(payload.get("note"));
        if (parentContractId != null && store.findContractParent(parentContractId, projectId) == null)
            throw Api("Hợp đồng/phụ lục cha không thuộc dự án.");
        String contractId = trim(payload.get("contractId"));
        Instant now = Instant.now();
        if (!contractId.isEmpty()) {
            Map<String, Object> old = store.findContract(contractId);
            if (old == null || !projectId.equals(sv(old, "project_id"))) throw Api("Không tìm thấy hợp đồng.");
            store.updateContract(contractId, contractNo, contractName, contractType, parentContractId,
                    nvl(payload.get("signedAt")), nvl(payload.get("effectiveFrom")), nvl(payload.get("effectiveTo")),
                    note, now);
            return Map.of("message", "Đã cập nhật hợp đồng.");
        }
        boolean hasPrimary = store.contractHasPrimary(projectId);
        String newId = idGenerator.next("PCON");
        store.insertContract(newId, projectId, contractNo, contractName, contractType, parentContractId,
                !hasPrimary, nvl(payload.get("signedAt")), nvl(payload.get("effectiveFrom")),
                nvl(payload.get("effectiveTo")), note, null, now);
        return Map.of("message", "Đã tạo hợp đồng cho dự án.", "contractId", newId);
    }

    public String setProjectContractStatus(String contractId, boolean active) {
        Map<String, Object> row = store.findContract(contractId);
        if (row == null) throw Api("Không tìm thấy hợp đồng.");
        if (!active) {
            double residual = store.contractStockResidual(contractId);
            if (residual > 0)
                throw Api("Hợp đồng còn tồn kế toán theo Contract; phải điều chuyển/hoàn trả hết trước khi ngừng áp dụng.");
        }
        store.setContractStatus(contractId, active ? "active" : "inactive", Instant.now());
        return active ? "Đã kích hoạt hợp đồng." : "Đã ngừng áp dụng hợp đồng.";
    }

    public String deleteProjectContract(String contractId, Map<String, Object> payload) {
        Map<String, Object> row = store.findContract(contractId);
        if (row == null) throw Api("Không tìm thấy hợp đồng.");
        String expected = "XOA " + sv(row, "contract_no");
        if (!expected.equals(trim(payload.get("confirmText"))))
            throw Api("Xác nhận chưa đúng. Hãy nhập \u201c" + expected + "\u201d.");
        if (store.contractUsageCount(contractId) > 0)
            throw Api("Hợp đồng vẫn còn phụ lục/BOQ Version/giao dịch/lịch sử. Hãy xóa dữ liệu downstream trước, sau đó xóa lại hợp đồng.");
        String projectId = sv(row, "project_id");
        String replacementId = null;
        if (isOne(row.get("is_primary"))) {
            Map<String, Object> replacement = store.nextPrimaryCandidate(projectId, contractId);
            if (replacement != null) {
                replacementId = sv(replacement, "id");
                store.promotePrimaryContract(replacementId, Instant.now());
            }
        }
        store.deleteContract(contractId);
        return "Đã xóa hợp đồng sau khi xác nhận không còn phụ lục/BOQ Version/giao dịch; hợp đồng mặc định đã được chuyển tự động nếu cần.";
    }

    private static boolean isOne(Object o) { return o instanceof Number n ? n.intValue() == 1 : Boolean.TRUE.equals(o); }
    private static String sv(Map<String, Object> m, String k) { Object v = m.get(k); return v == null ? "" : String.valueOf(v); }
    private static String trim(Object o) { return o == null ? "" : String.valueOf(o).trim(); }
    private static String nvl(Object o) { String s = trim(o); return s.isEmpty() ? null : s; }
    private static AuthUseCase.ApiError Api(String message) { return new AuthUseCase.ApiError(message, 400); }
}