package com.vntech.erp.application.service;

import com.vntech.erp.application.port.out.ContractReviewStore;
import com.vntech.erp.application.port.out.IdGenerator;
import com.vntech.erp.application.port.out.ContractReviewStore;
import com.vntech.erp.application.rbac.RbacService;
import com.vntech.erp.application.service.HrManagementUseCase.Principal;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * MỐC 103 (user 29/09) — MENU «REVIEW HĐ».
 *
 * <p>Yêu cầu user: «Review HĐ là chức năng để nhân sự hành chính ghi nhận việc
 * kiểm tra/review hợp đồng», click vào hợp đồng ⇒ mở modal chi tiết gồm
 * <b>Thông tin hợp đồng</b> + <b>Lịch sử review</b> (thời gian review · thời gian thao tác ·
 * trạng thái · người review).
 */
public class ContractReviewUseCase {

    private final ContractReviewStore store;
    private final RbacService rbac;
    private final IdGenerator idGenerator;

    public ContractReviewUseCase(ContractReviewStore store, RbacService rbac, IdGenerator idGenerator) {
        this.store = store;
        this.rbac = rbac;
        this.idGenerator = idGenerator;
    }

    /** Danh sách hợp đồng cần review + lịch sử review của từng hợp đồng. */
    public Map<String, Object> list(Principal principal) {
        guard(principal);
        List<Map<String, Object>> rows = store.listReviews();
        List<Map<String, Object>> out = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            Map<String, Object> r = new LinkedHashMap<>(row);
            r.put("logs", store.listLogs(String.valueOf(row.get("id"))));
            r.put("logCount", r.get("logs") instanceof List ? ((List<?>) r.get("logs")).size() : 0);
            out.add(r);
        }
        Map<String, Object> result = new HashMap<>();
        result.put("contractReviews", out);
        result.put("total", out.size());
        result.put("pending", out.stream().filter(r -> !truthy(r.get("viewed"))).count());
        return result;
    }

    /** Thêm / sửa một hợp đồng trong danh sách review. */
    public Map<String, Object> save(Principal principal, Map<String, Object> payload) {
        guard(principal);
        String id = trim(payload.get("reviewId"));
        String contractNo = trim(payload.get("contractNo"));
        if (id.isEmpty() && contractNo.isEmpty())
            throw new AuthUseCase.ApiError("Thiếu mã hợp đồng.", 400);
        String code = contractNo;
        String now = Instant.now().toString();
        String newId = id.isEmpty() ? idGenerator.next("CR") : id;
        store.saveReview(newId,
                trim(payload.get("contractId")),
                code,
                trim(payload.get("contractType")),
                trim(payload.get("contractName")),
                trim(payload.get("senderName")),
                trim(payload.get("receiverName")),
                trim(payload.get("receivedDate")),
                trim(payload.get("reviewDate")),
                truthy(payload.get("viewed")),
                trim(payload.get("note")),
                principal.userId(), Instant.now());
        return Map.of("ok", true, "id", newId, "message", id.isEmpty() ? "Đã thêm hợp đồng cần review." : "Đã cập nhật hợp đồng review.");
    }

    public Map<String, Object> delete(Principal principal, Map<String, Object> payload) {
        guard(principal);
        String id = trim(payload.get("reviewId"));
        if (id.isEmpty()) throw new AuthUseCase.ApiError("Thiếu mã review.", 400);
        store.deleteReview(id);
        return Map.of("ok", true, "message", "Đã xoá khỏi danh sách review.");
    }

    /**
     * MỞ hợp đồng để review — đánh dấu ĐÃ XEM + ghi 1 dòng lịch sử.
     *
     * @param durationSeconds THỜI GIAN THAO TÁC (giây) — UI đo từ lúc mở modal
     */
    public Map<String, Object> open(Principal principal, Map<String, Object> payload) {
        guard(principal);
        String id = trim(payload.get("reviewId"));
        if (id.isEmpty()) throw new AuthUseCase.ApiError("Thiếu mã review.", 400);
        Map<String, Object> row = store.findReview(id);
        if (row == null) throw new AuthUseCase.ApiError("Không tìm thấy hợp đồng review.", 400);
        Integer seconds = intOrNull(payload.get("durationSeconds"));
        String name = principal.userId();
        String now = Instant.now().toString();
        store.markViewed(id, principal.userId(), name, now, seconds, Instant.now());
        return Map.of("ok", true, "id", id, "message", "Đã ghi nhận lượt xem hợp đồng.");
    }

    /**
     * GHI NHẬN KẾT QUẢ REVIEW (nút «Ghi nhận đã review» trong modal chi tiết).
     * Ghi thêm 1 dòng lịch sử với trạng thái {@code reviewed}.
     */
    public Map<String, Object> logReview(Principal principal, Map<String, Object> payload) {
        guard(principal);
        String id = trim(payload.get("reviewId"));
        if (id.isEmpty()) throw new AuthUseCase.ApiError("Thiếu mã review.", 400);
        Map<String, Object> row = store.findReview(id);
        if (row == null) throw new AuthUseCase.ApiError("Không tìm thấy hợp đồng review.", 400);
        Integer seconds = intOrNull(payload.get("durationSeconds"));
        String name = principal.userId();
        Instant now = Instant.now();
        store.addLog(idGenerator.next("CRL"), id, trim(row.get("contractId")), now.toString(),
                seconds, "reviewed", principal.userId(), name, trim(payload.get("comment")), now);
        store.markViewed(id, principal.userId(), name, now.toString(), seconds, now);
        return Map.of("ok", true, "id", id, "message", "Đã ghi nhận kết quả review.");
    }

    // ---------- helpers ----------

    /** ⛔ Backend là lớp kiểm soát: chặn ở server, không chỉ ẩn nút ở UI (goal §12). */
    private void guard(Principal principal) {
        // ⛔ `Principal` (HrManagementUseCase.Principal) CHỈ có `userId()` + `role()`.
        //    Không có `displayName()` ⇒ tên người review lấy từ `users.full_name` ở tầng store.
        rbac.requireActionModule(currentUser(principal), ACTION);
    }

    private static final String ACTION = "manage_contract_review";

    /** Dựng `CurrentUser` tối thiểu đúng kiểu `AuthUseCase.CurrentUser` (12 thành phần). */
    private static AuthUseCase.CurrentUser currentUser(Principal principal) {
        return new AuthUseCase.CurrentUser(
                principal.userId(), null, null, null, principal.role(),
                null, null, null, null, null, false);
    }

    private static String trim(Object v) {
        return v == null ? "" : String.valueOf(v).trim();
    }

    private static boolean truthy(Object v) {
        if (v == null) return false;
        if (v instanceof Boolean b) return b;
        String s = String.valueOf(v).trim();
        return "1".equals(s) || "true".equalsIgnoreCase(s) || "yes".equalsIgnoreCase(s);
    }

    private static Integer intOrNull(Object v) {
        String s = trim(v);
        if (s.isEmpty()) return null;
        try {
            int n = Integer.parseInt(s);
            return n < 0 ? null : n;
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}
