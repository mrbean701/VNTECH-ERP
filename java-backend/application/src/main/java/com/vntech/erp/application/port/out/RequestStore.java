package com.vntech.erp.application.port.out;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Port nghiệp vụ Phiếu đề nghị mua hàng (MR) — port nguyên trạng create_request của monolith JS:
 * resolveContractContext, BOQ rows, document sequence DNMH, catalog matching, approvals 5 bậc.
 */
public interface RequestStore {

    /** [WF] PHASE 8 (B1) — CẢNH BÁO phê duyệt (KHÔNG chặn) cho một chứng từ theo (entityType, entityId). */
    List<String> approvalWarnings(String entityType, String entityId);

    Optional<Map<String, Object>> findActiveProject(String projectId);       // {code,name,status}
    /**
     * TASK-136 — DỰ ÁN MẶC ĐỊNH của tài khoản khi phiếu KHÔNG chọn dự án: dòng
     * {@code user_project_scopes} còn hiệu lực ( {@code projects.status='active'} ).
     * <p>
     * Rỗng ⇒ tài khoản không thuộc dự án nào. Hiện CHƯA thể lập phiếu "không-dự-án" vì
     * {@code material_requests.project_id} là NOT NULL — cần quyết định cho cột NULL (migration mới)
     * hoặc dùng một dự án mặc định cấp công ty; xem {@code docs/agent-progress/TASK-136.md}.
     */
    Optional<String> defaultProjectIdForUser(String userId);
    Optional<Map<String, Object>> findContract(String projectId, String contractId);
    Optional<Map<String, Object>> defaultContract(String projectId);          // is_primary=1 active, fallback active đầu tiên
    Optional<Map<String, Object>> findBoqVersion(String projectId, String contractId, String versionId);
    Optional<Map<String, Object>> activeBoqVersion(String projectId, String contractId);
    List<Map<String, Object>> projectBoqRows(String projectId, String contractId, String boqVersionId);
    long nextSequence(String key, String documentType, String projectId, int year, Instant now);

    List<Map<String, Object>> activeMaterials();                            // id,code,name,unit,system,category_id,subcategory_id,standard_price
    List<Map<String, Object>> materialAliases();                            // material_id,alias_name
    List<Map<String, Object>> activeMaterialCategories();
    List<Map<String, Object>> activeMaterialSubcategories();
    List<Map<String, Object>> formFieldRows(String formKey);                // field_key,required,active,display_name

    List<Map<String, Object>> approvalStages(boolean activeOnly);           // stage_no,name,allowed_role_codes,approval_mode,sla_hours,auto_approve_on_submit
    Optional<Map<String, Object>> workflowAssignment(String projectId, int stageNo); // owner_user_id, active...

    /**
     * Tạo material_request + items + allocations + custom fields + approvals trong 1 transaction.
     * <p>
     * TASK-043: {@code customFields} là danh sách dòng cho bảng {@code custom_field_values}
     * (id, entityId, fieldKey, valueText) — trường động của TỪNG DÒNG phiếu. Trước đây hợp đồng này
     * ghi "custom fields" trong chú thích nhưng phần triển khai KHÔNG hề ghi bảng đó.
     */
    void insertRequest(Map<String, Object> header, List<Map<String, Object>> lines,
                       List<Map<String, Object>> approvals, List<Map<String, Object>> customFields,
                       Instant now);

    // ---- workflow phê duyệt (decide_approval) ----
    Optional<Map<String, Object>> findRequestForApproval(String requestId); // MR + project + requester + itemCount
    Optional<Map<String, Object>> findApprovalRow(String requestId, int stage); // ownerUserId, allowedRoleCodes, approvalMode
    List<Map<String, Object>> approvalStagesForRequest(String requestId);  // từ approvals left join catalog
    Optional<Map<String, Object>> findUserRoleInfo(String userId);          // role + baseRole
    /**
     * TASK-049 — Owner của bước duyệt có phạm vi dự án không? Nguyên văn JS `system-route.mjs:448`:
     * {@code SELECT 1 AS ok FROM user_project_scopes WHERE user_id=? AND project_id=?
     *        AND permission IN ('read','write','approve','admin') LIMIT 1}
     * (JS bỏ qua phép kiểm này khi chính Owner là `admin` — xử lý ở tầng use-case).
     */
    boolean ownerHasProjectScope(String userId, String projectId);
    void updateApprovalDecision(String requestId, int stage, String decision, String userId,
                                String comment, String snapshot, Instant now);

    /**
     * MT2 §4.4 — LƯU VẾT lý do duyệt QUÁ HẠN SLA (cột `approvals.overdue_reason` — tạo ở migration **V25**).
     *
     * <p>MT2 §4.4: “Hệ thống phải lưu dữ liệu để sau này xây dựng logic xử lý SLA: approval id · workflow step ·
     * due time · approved time · expired flag · overdue duration · <b>overdue reason</b> · approver · department.”
     * <p>Ở bảng `approvals` ĐÃ CÓ `due_at` + `decided_at` ⇒ thời lượng quá hạn TÍNH ĐƯỢC và cờ `expired`
     * SUY RA ĐƯỢC (⛔ không thêm cột dư). Hàm này chỉ lưu phần KHÔNG suy ra được: **lý do người duyệt nhập**.
     */
    void updateApprovalOverdueReason(String requestId, int stage, String reason, Instant now);
    void advanceRequestStage(String requestId, int nextStage, Instant queuedAt, Instant dueAt, Instant now);
    void finalizeRequestApproval(String requestId, int stage, Instant now); // approved + items + supply step
    void createStockReservations(String requestId, String warehouseId, String userId, Instant now);
    void returnRequestToRequester(String requestId, int stage, String userId, String comment, Instant now);

    // ---- P4: người duyệt theo workflow đa luồng ----
    /** Người duyệt đích danh của một bước trong quy trình đang áp dụng cho dự án. */
    List<String> stageApproverUserIds(String projectId, int stageNo);
    /** Cách xác nhận của bước theo workflow (single/any_of/all_of); rỗng nếu chưa cấu hình. */
    Optional<String> stageApprovalMode(String projectId, int stageNo);
    /** Những người đã ra quyết định ở bước này (dùng để chốt all_of). */
    List<String> stageDecisionUsers(String requestId, int stage);
    /**
     * TASK-054 — những VAI TRÒ đã xác nhận (`decision='approved'`) ở bước này, DISTINCT.
     * Tương đương JS `system-route.mjs:1089`:
     * {@code SELECT DISTINCT role_code AS roleCode FROM approval_stage_decisions WHERE request_id=? AND stage=? AND decision='approved'}.
     */
    List<String> stageDecisionRoles(String requestId, int stage);
    /**
     * TASK-054 — CHỈ cập nhật `comment` của dòng `approvals` ở bước này (giữ nguyên trạng thái).
     * Tương đương JS `:1100`: {@code UPDATE approvals SET comment=?,updated_at=? WHERE request_id=? AND stage=?}
     * — dùng cho nhánh xác nhận MỘT PHẦN của bước duyệt song song (KHÔNG được coi là đã quyết định).
     */
    void updateApprovalComment(String requestId, int stage, String comment, Instant now);
    boolean stageDecisionRoleExists(String requestId, int stage, String roleCode);
    void insertStageDecision(String requestId, int stage, String roleCode, String userId,
                             String decision, String comment, Instant now);

    // ---- MR lifecycle (update_returned/resubmit/delete/cancel_request) ----
    Optional<Map<String, Object>> findRequestBasic(String requestId);     // id,request_no,project_id,requested_by,status
    long countRequestPoItems(String requestId);                          // PO items nối tới MR
    void deleteRequestCascade(String requestId);                          // approvals+decisions+comments+items+request
    void updateReturnedRequest(String requestId, String neededAt, String priority, String area,
                               String purpose, List<Map<String, Object>> lines, String commentUserId,
                               String commentText, Instant now);
    /** resubmit: reset approvals theo stages (cấu hình mới), chuyển MR về pending_approval. */
    void resubmitRequest(String requestId, List<Map<String, Object>> stages, String firstStageId,
                         boolean autoFirst, int currentStage, String userId, String comment, Instant now);
    void cancelRequest(String requestId, String reason, String userId, Instant now);
}