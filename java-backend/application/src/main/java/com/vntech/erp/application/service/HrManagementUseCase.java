package com.vntech.erp.application.service;

import com.vntech.erp.application.port.out.HrStore;
import com.vntech.erp.application.port.out.IdGenerator;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/** Use-case Pháp chế/HR — port nguyên trạng save_hr_record / labor contract JS. */
public final class HrManagementUseCase {

    private final HrStore store;
    private final IdGenerator idGenerator;

    public HrManagementUseCase(HrStore store, IdGenerator idGenerator) {
        this.store = store;
        this.idGenerator = idGenerator;
    }

    public interface Principal {
        String userId();
        String role();
    }

    public Map<String, Object> saveHrRecord(Principal principal, Map<String, Object> payload) {
        String userId = trim(payload.get("userId"));
        String fullName = trim(payload.get("fullName"));
        if (fullName.isEmpty()) fullName = trim(payload.get("userFullName"));
        if (userId.isEmpty() || fullName.isEmpty()) throw Api("Hồ sơ nhân sự cần nhân sự và họ tên.");
        if (store.findUser(userId).isEmpty()) throw Api("Nhân sự không tồn tại.");
        Map<String, Object> existing = store.findHrRecord(userId).orElse(null);
        Instant now = Instant.now();
        if (existing != null) {
            store.updateHrRecord(sv(existing, "id"), fullName, nvl(payload.get("identityNo")),
                    nvl(payload.get("identityDate")), nvl(payload.get("identityPlace")), nvl(payload.get("birthDate")),
                    nvl(payload.get("birthplace")), nvl(payload.get("permanentAddress")), nvl(payload.get("phone")),
                    nvl(payload.get("educationLevel")), nvl(payload.get("joinedDate")), nvl(payload.get("position")),
                    nvl(payload.get("note")), now);
            return Map.of("message", "Đã cập nhật hồ sơ nhân sự.");
        }
        store.insertHrRecord(idGenerator.next("HR"), userId, fullName, nvl(payload.get("identityNo")),
                nvl(payload.get("identityDate")), nvl(payload.get("identityPlace")), nvl(payload.get("birthDate")),
                nvl(payload.get("birthplace")), nvl(payload.get("permanentAddress")), nvl(payload.get("phone")),
                nvl(payload.get("educationLevel")), nvl(payload.get("joinedDate")), nvl(payload.get("position")),
                nvl(payload.get("note")), principal.userId(), now);
        return Map.of("message", "Đã lập hồ sơ nhân sự.");
    }

    public Map<String, Object> saveLaborContract(Principal principal, Map<String, Object> payload) {
        String contractId = trim(payload.get("contractId"));
        String userId = trim(payload.get("userId"));
        String contractType = trim(payload.get("contractType"));
        if (userId.isEmpty() || contractType.isEmpty())
            throw Api("Hợp đồng lao động cần nhân sự và loại hợp đồng.");
        if (store.findUser(userId).isEmpty()) throw Api("Nhân sự không tồn tại.");
        double salary = strictNonNegative(payload.get("salary"), "Mức lương");
        Instant now = Instant.now();
        if (!contractId.isEmpty()) {
            Map<String, Object> old = store.findLaborContract(contractId)
                    .orElseThrow(() -> Api("Không tìm thấy hợp đồng."));
            store.updateLaborContract(contractId, userId, contractType, nvl(payload.get("startDate")),
                    nvl(payload.get("endDate")), nvl(payload.get("signingDate")), salary,
                    nvl(payload.get("note")), now);
            return Map.of("message", "Đã cập nhật hợp đồng lao động.");
        }
        long n = 1;
        try { n = Long.parseLong(store.nextLaborContractNo()); } catch (Exception ignored) { }
        String contractNo = "HĐLĐ-" + String.format("%05d", n);
        store.insertLaborContract(idGenerator.next("LBC"), contractNo, userId, contractType,
                nvl(payload.get("startDate")), nvl(payload.get("endDate")), nvl(payload.get("signingDate")),
                salary, nvl(payload.get("note")), principal.userId(), now);
        return Map.of("message", "Đã lập hợp đồng lao động.");
    }

    public Map<String, Object> setLaborContractStatus(Principal principal, Map<String, Object> payload) {
        String contractId = trim(payload.get("contractId"));
        String status = trim(payload.get("status"));
        store.findLaborContract(contractId).orElseThrow(() -> Api("Không tìm thấy hợp đồng."));
        store.setLaborContractStatus(contractId, status, Instant.now());
        return Map.of("message", "Đã cập nhật trạng thái hợp đồng lao động.");
    }

    public Map<String, Object> deleteLaborContract(Principal principal, Map<String, Object> payload) {
        String contractId = trim(payload.get("contractId"));
        store.findLaborContract(contractId).orElseThrow(() -> Api("Không tìm thấy hợp đồng."));
        store.deleteLaborContract(contractId);
        return Map.of("message", "Đã xóa hợp đồng lao động.");
    }

    // ============ correspondence ============
    public Map<String, Object> saveCorrespondence(Principal principal, Map<String, Object> payload) {
        String corrId = trim(payload.get("corrId"));
        String docNo = trim(payload.get("docNo"));
        String direction = trim(payload.get("direction"));
        String docType = trim(payload.get("docType"));
        if (!List.of("IN", "OUT").contains(direction) || docType.isEmpty())
            throw Api("Công văn cần hướng đến/đi và loại văn bản.");
        if (docNo.isEmpty()) throw Api("Số công văn là bắt buộc.");
        Instant now = Instant.now();
        if (!corrId.isEmpty()) {
            store.findCorrespondence(corrId).orElseThrow(() -> Api("Không tìm thấy công văn."));
            store.updateCorrespondence(corrId, docNo, direction, docType, nvl(payload.get("issueDate")),
                    nvl(payload.get("senderName")), nvl(payload.get("receiverName")), nvl(payload.get("summary")),
                    nvl(payload.get("internalHandler")), nvl(payload.get("resultNote")), now);
            return Map.of("message", "Đã cập nhật công văn.");
        }
        if (store.findCorrespondenceByDocNo(docNo).isPresent()) throw Api("Số công văn đã tồn tại.");
        store.insertCorrespondence(idGenerator.next("COR"), docNo, direction, docType, nvl(payload.get("issueDate")),
                nvl(payload.get("senderName")), nvl(payload.get("receiverName")), nvl(payload.get("summary")),
                nvl(payload.get("internalHandler")), nvl(payload.get("resultNote")), principal.userId(), now);
        return Map.of("message", "Đã ghi nhận công văn " + ("IN".equals(direction) ? "đến" : "đi") + ".");
    }

    public Map<String, Object> setCorrespondenceStatus(Principal principal, Map<String, Object> payload) {
        String corrId = trim(payload.get("corrId"));
        String status = trim(payload.get("status"));
        store.findCorrespondence(corrId).orElseThrow(() -> Api("Không tìm thấy công văn."));
        store.setCorrespondenceStatus(corrId, status, nvl(payload.get("resultNote")), Instant.now());
        return Map.of("message", "Đã cập nhật trạng thái công văn.");
    }

    public Map<String, Object> deleteCorrespondence(Principal principal, Map<String, Object> payload) {
        String corrId = trim(payload.get("corrId"));
        store.findCorrespondence(corrId).orElseThrow(() -> Api("Không tìm thấy công văn."));
        store.deleteCorrespondence(corrId);
        return Map.of("message", "Đã xóa công văn.");
    }

    // ============ legal documents ============
    public Map<String, Object> saveLegalDocument(Principal principal, Map<String, Object> payload) {
        String docId = trim(payload.get("docId"));
        String docNo = trim(payload.get("docNo"));
        String docType = trim(payload.get("docType"));
        String title = trim(payload.get("title"));
        if (docNo.isEmpty() || docType.isEmpty() || title.isEmpty())
            throw Api("Văn bản pháp lý cần số, loại và tiêu đề.");
        Instant now = Instant.now();
        if (!docId.isEmpty()) {
            store.findLegalDocument(docId).orElseThrow(() -> Api("Không tìm thấy văn bản."));
            store.updateLegalDocument(docId, docNo, docType, title, nvl(payload.get("issueDate")),
                    nvl(payload.get("issuer")), nvl(payload.get("effectiveDate")), nvl(payload.get("expiryDate")),
                    nvl(payload.get("scope")), nvl(payload.get("attachmentId")), now);
            return Map.of("message", "Đã cập nhật văn bản pháp lý.");
        }
        if (store.findLegalDocumentByDocNo(docNo).isPresent()) throw Api("Số văn bản đã tồn tại.");
        store.insertLegalDocument(idGenerator.next("LGD"), docNo, docType, title, nvl(payload.get("issueDate")),
                nvl(payload.get("issuer")), nvl(payload.get("effectiveDate")), nvl(payload.get("expiryDate")),
                nvl(payload.get("scope")), nvl(payload.get("attachmentId")), principal.userId(), now);
        return Map.of("message", "Đã lưu văn bản pháp lý.");
    }

    public Map<String, Object> setLegalDocumentStatus(Principal principal, Map<String, Object> payload) {
        String docId = trim(payload.get("docId"));
        String status = trim(payload.get("status"));
        store.findLegalDocument(docId).orElseThrow(() -> Api("Không tìm thấy văn bản."));
        store.setLegalDocumentStatus(docId, status, Instant.now());
        return Map.of("message", "Đã cập nhật trạng thái văn bản pháp lý.");
    }

    public Map<String, Object> deleteLegalDocument(Principal principal, Map<String, Object> payload) {
        String docId = trim(payload.get("docId"));
        store.findLegalDocument(docId).orElseThrow(() -> Api("Không tìm thấy văn bản."));
        store.deleteLegalDocument(docId);
        return Map.of("message", "Đã xóa văn bản pháp lý.");
    }

    // ============ seals ============
    public Map<String, Object> saveSeal(Principal principal, Map<String, Object> payload) {
        String sealId = trim(payload.get("sealId"));
        String sealNo = trim(payload.get("sealNo"));
        String sealName = trim(payload.get("sealName"));
        String sealType = trim(payload.get("sealType"));
        if (sealNo.isEmpty() || sealName.isEmpty() || sealType.isEmpty())
            throw Api("Con dấu cần số hiệu, tên và loại.");
        Instant now = Instant.now();
        if (!sealId.isEmpty()) {
            store.findSeal(sealId).orElseThrow(() -> Api("Không tìm thấy con dấu."));
            store.updateSeal(sealId, sealNo, sealName, sealType, nvl(payload.get("custodian")),
                    nvl(payload.get("registeredDate")), nvl(payload.get("usageNote")), now);
            return Map.of("message", "Đã cập nhật con dấu.");
        }
        if (store.findSealByNo(sealNo).isPresent()) throw Api("Số hiệu con dấu đã tồn tại.");
        store.insertSeal(idGenerator.next("SEL"), sealNo, sealName, sealType, nvl(payload.get("custodian")),
                nvl(payload.get("registeredDate")), nvl(payload.get("usageNote")), principal.userId(), now);
        return Map.of("message", "Đã đăng ký con dấu.");
    }

    public Map<String, Object> setSealStatus(Principal principal, Map<String, Object> payload) {
        String sealId = trim(payload.get("sealId"));
        String status = trim(payload.get("status"));
        store.findSeal(sealId).orElseThrow(() -> Api("Không tìm thấy con dấu."));
        store.setSealStatus(sealId, status, Instant.now());
        return Map.of("message", "Đã cập nhật trạng thái con dấu.");
    }

    public Map<String, Object> deleteSeal(Principal principal, Map<String, Object> payload) {
        String sealId = trim(payload.get("sealId"));
        store.findSeal(sealId).orElseThrow(() -> Api("Không tìm thấy con dấu."));
        store.deleteSeal(sealId);
        return Map.of("message", "Đã xóa đăng ký con dấu.");
    }

    // ============ benefit records ============
    public Map<String, Object> saveBenefitRecord(Principal principal, Map<String, Object> payload) {
        String benefitId = trim(payload.get("benefitId"));
        String userId = trim(payload.get("userId"));
        String benefitType = trim(payload.get("benefitType"));
        if (userId.isEmpty() || benefitType.isEmpty()) throw Api("Bảo hiểm & chế độ cần nhân sự và loại.");
        if (store.findUser(userId).isEmpty()) throw Api("Nhân sự không tồn tại.");
        double monthlyAmount = strictNonNegative(payload.get("monthlyAmount"), "Mức đóng hàng tháng");
        Instant now = Instant.now();
        if (!benefitId.isEmpty()) {
            store.findBenefitRecord(benefitId).orElseThrow(() -> Api("Không tìm thấy bản ghi."));
            store.updateBenefitRecord(benefitId, userId, benefitType, nvl(payload.get("provider")),
                    nvl(payload.get("startDate")), nvl(payload.get("endDate")), monthlyAmount,
                    nvl(payload.get("note")), now);
            return Map.of("message", "Đã cập nhật bảo hiểm & chế độ.");
        }
        long n = 1;
        try { n = Long.parseLong(store.nextBenefitRecordNo()); } catch (Exception ignored) { }
        String benefitNo = "BH-" + String.format("%05d", n);
        store.insertBenefitRecord(idGenerator.next("BEN"), benefitNo, userId, benefitType,
                nvl(payload.get("provider")), nvl(payload.get("startDate")), nvl(payload.get("endDate")),
                monthlyAmount, nvl(payload.get("note")), principal.userId(), now);
        return Map.of("message", "Đã theo dõi bảo hiểm & chế độ.");
    }

    public Map<String, Object> setBenefitRecordStatus(Principal principal, Map<String, Object> payload) {
        String benefitId = trim(payload.get("benefitId"));
        String status = trim(payload.get("status"));
        store.findBenefitRecord(benefitId).orElseThrow(() -> Api("Không tìm thấy bản ghi."));
        store.setBenefitRecordStatus(benefitId, status, Instant.now());
        return Map.of("message", "Đã cập nhật trạng thái.");
    }

    public Map<String, Object> deleteBenefitRecord(Principal principal, Map<String, Object> payload) {
        String benefitId = trim(payload.get("benefitId"));
        store.findBenefitRecord(benefitId).orElseThrow(() -> Api("Không tìm thấy bản ghi."));
        store.deleteBenefitRecord(benefitId);
        return Map.of("message", "Đã xóa bản ghi bảo hiểm & chế độ.");
    }

    // ---- helpers ----
    private static double strictNonNegative(Object o, String label) {
        String raw = trim(o);
        if (raw.isEmpty()) throw Api(label + " không được để trống.");
        try { double v = Double.parseDouble(raw); if (v < 0) throw Api(label + " không hợp lệ."); return v; }
        catch (NumberFormatException e) { throw Api(label + " không hợp lệ."); }
    }
    private static String sv(Map<String, Object> m, String k) { Object v = m.get(k); return v == null ? "" : String.valueOf(v); }
    private static String trim(Object o) { return o == null ? "" : String.valueOf(o).trim(); }
    private static String nvl(Object o) { String s = trim(o); return s.isEmpty() ? null : s; }
    private static AuthUseCase.ApiError Api(String message) { return new AuthUseCase.ApiError(message, 400); }
}