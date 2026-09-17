package com.vntech.erp.application.service;

import com.vntech.erp.application.port.out.FinanceStore;
import com.vntech.erp.application.port.out.IdGenerator;
import com.vntech.erp.application.port.out.ProductionStore;
import com.vntech.erp.application.rbac.AccessScopeService;
import com.vntech.erp.application.rbac.RbacService;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Use-case Tài chính — port nguyên trạng payment plan / advance request / site expense claim
 * của monolith JS. Flow chung: draft → submitted → approved (đã duyệt chỉ admin mở lại).
 */
public final class FinanceManagementUseCase {

    private final FinanceStore store;
    private final ProductionStore productionStore;
    private final IdGenerator idGenerator;
    private final RbacService rbac;
    private final AccessScopeService accessScope;

    public FinanceManagementUseCase(FinanceStore store, ProductionStore productionStore,
                                    IdGenerator idGenerator, RbacService rbac, AccessScopeService accessScope) {
        this.store = store;
        this.productionStore = productionStore;
        this.idGenerator = idGenerator;
        this.rbac = rbac;
        this.accessScope = accessScope;
    }

    public interface Principal {
        String userId();
        String role();
    }

    // ============ payment plans ============
    public Map<String, Object> savePaymentPlan(Principal principal, Map<String, Object> payload) {
        String projectId = trim(payload.get("projectId"));
        // JS 1947.
        accessScope.requireProjectAccess(principal.userId(), principal.role(), projectId, true,
                "Không có quyền cập nhật kế hoạch tại dự án này.");
        String planId = trim(payload.get("planId"));
        String contractId = nvl(payload.get("contractId"));
        String poId = nvl(payload.get("poId"));
        String milestone = nvl(payload.get("milestone"));
        String plannedDate = nvl(payload.get("plannedDate"));
        double plannedAmount = strictNonNegative(payload.get("plannedAmount"), "Giá trị kế hoạch");
        String note = nvl(payload.get("note"));
        if (projectId.isEmpty()) throw Api("Kế hoạch thanh toán phải gắn dự án.");
        Instant now = Instant.now();
        if (!planId.isEmpty()) {
            Map<String, Object> old = store.findPaymentPlan(planId)
                    .orElseThrow(() -> Api("Không tìm thấy kế hoạch thanh toán."));
            if (!sv(old, "project_id").equals(projectId))
                throw Api("Không được chuyển kế hoạch sang dự án khác.");
            store.updatePaymentPlan(planId, contractId, poId, milestone, plannedDate, plannedAmount, note, now);
            return Map.of("message", "Đã cập nhật kế hoạch thanh toán.");
        }
        String code = "DA";
        Map<String, Object> proj = productionStore.findProjectCode(projectId).orElse(null);
        if (proj != null && !sv(proj, "code").isEmpty()) code = sv(proj, "code");
        long n = 1;
        try { n = Long.parseLong(store.nextPaymentPlanNo(projectId, (plannedDate == null ? "" : plannedDate).substring(0, Math.min(4, plannedDate == null ? 0 : plannedDate.length())))); } catch (Exception ignored) { }
        String planNo = "PPL-" + code + "-" + String.format("%04d", n);
        String status = plannedDate != null && !plannedDate.isEmpty() && plannedDate.compareTo(java.time.LocalDate.now().toString()) < 0
                ? "overdue" : "planned";
        store.insertPaymentPlan(idGenerator.next("PPL"), planNo, projectId, contractId, poId, milestone,
                plannedDate, plannedAmount, status, note, principal.userId(), now);
        return Map.of("message", "Đã thêm kế hoạch thanh toán.");
    }

    public Map<String, Object> setPaymentPlanStatus(Principal principal, Map<String, Object> payload) {
        String planId = trim(payload.get("planId"));
        String status = trim(payload.get("status"));
        double paidAmount = strictNonNegative(payload.get("paidAmount"), "Số tiền đã thanh toán");
        Map<String, Object> old = store.findPaymentPlan(planId)
                .orElseThrow(() -> Api("Không tìm thấy kế hoạch thanh toán."));
        // JS 1952.
        accessScope.requireProjectAccess(principal.userId(), principal.role(), sv(old, "project_id"), true,
                "Không có quyền tại dự án này.");
        if (paidAmount > num(old.get("planned_amount")) + 1e-9)
            throw Api("Số tiền đã thanh toán không được vượt kế hoạch.");
        store.setPaymentPlanStatus(planId, status, paidAmount, Instant.now());
        return Map.of("message", "Đã cập nhật trạng thái kế hoạch thanh toán.");
    }

    public Map<String, Object> deletePaymentPlan(Principal principal, Map<String, Object> payload) {
        String planId = trim(payload.get("planId"));
        Map<String, Object> old = store.findPaymentPlan(planId)
                .orElseThrow(() -> Api("Không tìm thấy kế hoạch thanh toán."));
        // JS 1955.
        accessScope.requireProjectAccess(principal.userId(), principal.role(), sv(old, "project_id"), true,
                "Không có quyền tại dự án này.");
        if (num(old.get("paid_amount")) > 0)
            throw Api("Kế hoạch đã phát sinh thanh toán nên không được xóa; hãy đóng kế hoạch.");
        store.deletePaymentPlan(planId);
        return Map.of("message", "Đã xóa kế hoạch thanh toán.");
    }

    // ============ advance requests ============
    public Map<String, Object> saveAdvanceRequest(Principal principal, Map<String, Object> payload) {
        String requestId = trim(payload.get("requestId"));
        String projectId = nvl(payload.get("projectId"));
        // JS 1959. projectId rỗng ⇒ canAccessProject trả false ⇒ 403, đúng như JS.
        accessScope.requireProjectAccess(principal.userId(), principal.role(), projectId, true,
                "Không có quyền tại dự án này.");
        String requesterId = trim(payload.get("requesterId"));
        double amount = strictNonNegative(payload.get("amount"), "Số tiền tạm ứng");
        String purpose = trim(payload.get("purpose"));
        String category = blankDefault(trim(payload.get("category")), "purchase");
        String note = nvl(payload.get("note"));
        if (requesterId.isEmpty() || amount <= 0 || purpose.isEmpty())
            throw Api("Tạm ứng cần người nhận, số tiền > 0 và mục đích.");
        Instant now = Instant.now();
        if (!requestId.isEmpty()) {
            Map<String, Object> old = store.findAdvanceRequest(requestId)
                    .orElseThrow(() -> Api("Không tìm thấy phiếu tạm ứng."));
            if ("settled".equals(sv(old, "status")) && !"admin".equals(principal.role()))
                throw Api("Phiếu đã hoàn ứng; chỉ Quản trị được mở lại.");
            String nextStatus = payload.get("submit") == Boolean.TRUE
                    ? ("approved".equals(sv(old, "status")) ? "approved" : "submitted")
                    : sv(old, "status").isEmpty() ? "draft" : sv(old, "status");
            store.updateAdvanceRequest(requestId, projectId, requesterId, amount, purpose, category, note,
                    nextStatus, now);
            return Map.of("message", nextStatus.equals("submitted")
                    ? "Đã cập nhật và gửi tạm ứng để Phòng Tài chính duyệt." : "Đã cập nhật phiếu tạm ứng.");
        }
        long n = 1;
        try { n = Long.parseLong(store.nextAdvanceRequestNo()); } catch (Exception ignored) { }
        String requestNo = "TƯ-" + String.format("%05d", n);
        String status0 = payload.get("submit") == Boolean.TRUE ? "submitted" : "draft";
        store.insertAdvanceRequest(idGenerator.next("ADV"), requestNo, projectId, requesterId, amount,
                purpose, category, status0, note, principal.userId(), now);
        return Map.of("message", status0.equals("submitted") ? "Đã tạo phiếu tạm ứng và gửi duyệt."
                : "Đã tạo phiếu tạm ứng (bản nháp).");
    }

    public Map<String, Object> settleAdvanceRequest(Principal principal, Map<String, Object> payload) {
        String requestId = trim(payload.get("requestId"));
        double advancePaid = strictNonNegative(payload.get("advancePaid"), "Số tiền đã chi tạm ứng");
        double settlementValue = strictNonNegative(payload.get("settlementValue"), "Giá trị hoàn ứng");
        Map<String, Object> old = store.findAdvanceRequest(requestId)
                .orElseThrow(() -> Api("Không tìm thấy phiếu tạm ứng."));
        if (!"approved".equals(sv(old, "status")) && !"submitted".equals(sv(old, "status")))
            throw Api("Chỉ hoàn ứng phiếu đã duyệt.");
        if (settlementValue > num(old.get("amount")) + 1e-9)
            throw Api("Giá trị hoàn ứng không được vượt số tiền tạm ứng.");
        store.settleAdvanceRequest(requestId, advancePaid, settlementValue, Instant.now());
        return Map.of("message", "Đã hoàn ứng phiếu tạm ứng; số dư tự động theo dõi.");
    }

    public Map<String, Object> deleteAdvanceRequest(Principal principal, Map<String, Object> payload) {
        String requestId = trim(payload.get("requestId"));
        Map<String, Object> old = store.findAdvanceRequest(requestId)
                .orElseThrow(() -> Api("Không tìm thấy phiếu tạm ứng."));
        if ("settled".equals(sv(old, "status"))) throw Api("Phiếu đã hoàn ứng không được xóa.");
        store.deleteAdvanceRequest(requestId);
        return Map.of("message", "Đã xóa phiếu tạm ứng.");
    }

    // ============ site expense claims ============
    public Map<String, Object> saveSiteExpenseClaim(Principal principal, Map<String, Object> payload) {
        String claimId = trim(payload.get("claimId"));
        String projectId = trim(payload.get("projectId"));
        // JS 1971.
        accessScope.requireProjectAccess(principal.userId(), principal.role(), projectId, true,
                "Không có quyền tại dự án này.");
        String costType = trim(payload.get("costType"));
        double amount = strictNonNegative(payload.get("amount"), "Số chi phí");
        String paidBy = nvl(payload.get("paidBy"));
        String claimDate = nvl(payload.get("claimDate"));
        String description = nvl(payload.get("description"));
        String voucherAttachmentId = nvl(payload.get("voucherAttachmentId"));
        if (projectId.isEmpty() || costType.isEmpty() || amount <= 0)
            throw Api("Chi phí hiện trường cần dự án, loại chi phí và số tiền > 0.");
        Instant now = Instant.now();
        if (!claimId.isEmpty()) {
            Map<String, Object> old = store.findSiteExpenseClaim(claimId)
                    .orElseThrow(() -> Api("Không tìm thấy chi phí."));
            if (!sv(old, "project_id").equals(projectId))
                throw Api("Không được chuyển chi phí sang dự án khác.");
            if ("approved".equals(sv(old, "status")) && !"admin".equals(principal.role()))
                throw Api("Chi phí đã duyệt; chỉ Quản trị được mở lại.");
            String nextStatus = "approved".equals(sv(old, "status")) ? "approved"
                    : payload.get("submit") == Boolean.TRUE ? "submitted"
                    : sv(old, "status").isEmpty() ? "draft" : sv(old, "status");
            store.updateSiteExpenseClaim(claimId, costType, amount, paidBy, claimDate, description,
                    voucherAttachmentId, nextStatus, now);
            return Map.of("message", nextStatus.equals("submitted")
                    ? "Đã cập nhật và gửi chi phí để duyệt." : "Đã cập nhật chi phí hiện trường.");
        }
        String code = "DA";
        Map<String, Object> proj = productionStore.findProjectCode(projectId).orElse(null);
        if (proj != null && !sv(proj, "code").isEmpty()) code = sv(proj, "code");
        long n = 1;
        try { n = Long.parseLong(store.nextExpenseClaimNo(projectId)); } catch (Exception ignored) { }
        String claimNo = "CP-" + code + "-" + String.format("%04d", n);
        String status0 = payload.get("submit") == Boolean.TRUE ? "submitted" : "draft";
        store.insertSiteExpenseClaim(idGenerator.next("SEC"), claimNo, projectId, costType, amount, paidBy,
                claimDate, description, voucherAttachmentId, status0, principal.userId(), now);
        return Map.of("message", status0.equals("submitted") ? "Đã ghi chi phí và gửi duyệt."
                : "Đã ghi chi phí hiện trường (bản nháp).");
    }

    public Map<String, Object> approveSiteExpenseClaim(Principal principal, Map<String, Object> payload) {
        String claimId = trim(payload.get("claimId"));
        Map<String, Object> old = store.findSiteExpenseClaim(claimId)
                .orElseThrow(() -> Api("Không tìm thấy chi phí."));
        // JS 1976.
        accessScope.requireProjectAccess(principal.userId(), principal.role(), sv(old, "project_id"), true,
                "Không có quyền tại dự án này.");
        if ("approved".equals(sv(old, "status"))) throw Api("Chi phí đã duyệt.");
        store.approveSiteExpenseClaim(claimId, principal.userId(), Instant.now());
        return Map.of("message", "Đã duyệt chi phí hiện trường.");
    }

    public Map<String, Object> deleteSiteExpenseClaim(Principal principal, Map<String, Object> payload) {
        String claimId = trim(payload.get("claimId"));
        Map<String, Object> old = store.findSiteExpenseClaim(claimId)
                .orElseThrow(() -> Api("Không tìm thấy chi phí."));
        // JS 1979.
        accessScope.requireProjectAccess(principal.userId(), principal.role(), sv(old, "project_id"), true,
                "Không có quyền tại dự án này.");
        if ("approved".equals(sv(old, "status")) && !"admin".equals(principal.role()))
            throw Api("Chi phí đã duyệt; chỉ Quản trị được xóa.");
        store.deleteSiteExpenseClaim(claimId);
        return Map.of("message", "Đã xóa chi phí hiện trường.");
    }

    // ============ bank / cashbook / vouchers ============
    public Map<String, Object> saveBankAccount(Principal principal, Map<String, Object> payload) {
        String accountId = trim(payload.get("accountId"));
        String code = trim(payload.get("code"));
        String bankName = trim(payload.get("bankName"));
        String accountNo = trim(payload.get("accountNo"));
        String branch = nvl(payload.get("branch"));
        String currency = blankDefault(trim(payload.get("currency")), "VND");
        double openingBalance = strictNonNegative(payload.get("openingBalance"), "Số dư đầu kỳ");
        if (code.isEmpty() || bankName.isEmpty() || accountNo.isEmpty())
            throw Api("Tài khoản ngân hàng cần mã, ngân hàng và số tài khoản.");
        Instant now = Instant.now();
        if (!accountId.isEmpty()) {
            store.findBankAccount(accountId).orElseThrow(() -> Api("Không tìm thấy tài khoản."));
            store.updateBankAccount(accountId, code, bankName, accountNo, branch, currency, openingBalance, now);
            return Map.of("message", "Đã cập nhật tài khoản ngân hàng.");
        }
        if (store.findBankAccountByCode(code).isPresent()) throw Api("Mã tài khoản đã tồn tại.");
        store.insertBankAccount(idGenerator.next("BKA"), code, bankName, accountNo, branch, currency,
                openingBalance, principal.userId(), now);
        return Map.of("message", "Đã thêm tài khoản ngân hàng.");
    }

    public Map<String, Object> saveCashbookEntry(Principal principal, Map<String, Object> payload) {
        String entryId = trim(payload.get("entryId"));
        String entryDate = trim(payload.get("entryDate"));
        String accountId = trim(payload.get("accountId"));
        String entryType = trim(payload.get("entryType"));
        double amount = strictNonNegative(payload.get("amount"), "Số tiền");
        String counterparty = nvl(payload.get("counterparty"));
        String referenceType = nvl(payload.get("referenceType"));
        String referenceId = nvl(payload.get("referenceId"));
        String note = nvl(payload.get("note"));
        if (entryDate.isEmpty() || accountId.isEmpty() || !List.of("IN", "OUT").contains(entryType) || amount <= 0)
            throw Api("Sổ quỹ cần ngày, tài khoản, loại Thu/Chi và số tiền > 0.");
        if (store.findBankAccount(accountId).isEmpty()) throw Api("Tài khoản không tồn tại.");
        Instant now = Instant.now();
        if (!entryId.isEmpty()) {
            store.findCashbookEntry(entryId).orElseThrow(() -> Api("Không tìm thấy bút toán."));
            store.updateCashbookEntry(entryId, entryDate, accountId, entryType, amount, counterparty,
                    referenceType, referenceId, note, now);
            return Map.of("message", "Đã cập nhật bút toán sổ quỹ.");
        }
        long n = 1;
        try { n = Long.parseLong(store.nextCashbookEntryNo()); } catch (Exception ignored) { }
        String entryNo = "SQ-" + String.format("%06d", n);
        store.insertCashbookEntry(idGenerator.next("CBE"), entryNo, entryDate, accountId, entryType, amount,
                counterparty, referenceType, referenceId, note, principal.userId(), now);
        return Map.of("message", "Đã ghi sổ quỹ; số dư tự cập nhật.");
    }

    public Map<String, Object> deleteCashbookEntry(Principal principal, Map<String, Object> payload) {
        String entryId = trim(payload.get("entryId"));
        store.findCashbookEntry(entryId).orElseThrow(() -> Api("Không tìm thấy bút toán."));
        store.deleteCashbookEntry(entryId);
        return Map.of("message", "Đã xóa bút toán sổ quỹ.");
    }

    public Map<String, Object> saveAccountingVoucher(Principal principal, Map<String, Object> payload) {
        String voucherId = trim(payload.get("voucherId"));
        String voucherDate = trim(payload.get("voucherDate"));
        String voucherType = trim(payload.get("voucherType"));
        String projectId = nvl(payload.get("projectId"));
        String description = nvl(payload.get("description"));
        double totalAmount = strictNonNegative(payload.get("totalAmount"), "Giá trị chứng từ");
        String filesJson = nvl(payload.get("filesJson"));
        if (voucherDate.isEmpty() || voucherType.isEmpty()) throw Api("Chứng từ kế toán cần ngày và loại chứng từ.");
        Instant now = Instant.now();
        if (!voucherId.isEmpty()) {
            store.findAccountingVoucher(voucherId).orElseThrow(() -> Api("Không tìm thấy chứng từ."));
            store.updateAccountingVoucher(voucherId, voucherDate, voucherType, projectId, description,
                    totalAmount, filesJson, now);
            return Map.of("message", "Đã cập nhật chứng từ kế toán.");
        }
        long n = 1;
        try { n = Long.parseLong(store.nextVoucherNo(voucherDate.substring(0, 4))); } catch (Exception ignored) { }
        String voucherNo = "CT-" + voucherDate.substring(0, 4) + "-" + String.format("%04d", n);
        store.insertAccountingVoucher(idGenerator.next("AVC"), voucherNo, voucherDate, voucherType, projectId,
                description, totalAmount, filesJson, principal.userId(), now);
        return Map.of("message", "Đã lập chứng từ kế toán.");
    }

    public Map<String, Object> deleteAccountingVoucher(Principal principal, Map<String, Object> payload) {
        String voucherId = trim(payload.get("voucherId"));
        store.findAccountingVoucher(voucherId).orElseThrow(() -> Api("Không tìm thấy chứng từ."));
        store.deleteAccountingVoucher(voucherId);
        return Map.of("message", "Đã xóa chứng từ kế toán.");
    }

    // ---- helpers ----
    private static double strictNonNegative(Object o, String label) {
        String raw = trim(o);
        if (raw.isEmpty()) throw Api(label + " không được để trống.");
        try { double v = Double.parseDouble(raw); if (v < 0) throw Api(label + " không hợp lệ."); return v; }
        catch (NumberFormatException e) { throw Api(label + " không hợp lệ."); }
    }
    private static double num(Object o) {
        try { return o == null ? 0 : Double.parseDouble(String.valueOf(o)); }
        catch (NumberFormatException e) { return 0; }
    }
    private static String sv(Map<String, Object> m, String k) { Object v = m.get(k); return v == null ? "" : String.valueOf(v); }
    private static String trim(Object o) { return o == null ? "" : String.valueOf(o).trim(); }
    private static String nvl(Object o) { String s = trim(o); return s.isEmpty() ? null : s; }
    private static String blankDefault(String s, String fallback) { return s.isEmpty() ? fallback : s; }
    private static AuthUseCase.ApiError Api(String message) { return new AuthUseCase.ApiError(message, 400); }
}