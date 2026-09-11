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

    Optional<Map<String, Object>> findActiveProject(String projectId);       // {code,name,status}
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

    /** Tạo material_request + items + allocations + custom fields + approvals trong 1 transaction. */
    void insertRequest(Map<String, Object> header, List<Map<String, Object>> lines,
                       List<Map<String, Object>> approvals, Instant now);

    // ---- workflow phê duyệt (decide_approval) ----
    Optional<Map<String, Object>> findRequestForApproval(String requestId); // MR + project + requester + itemCount
    Optional<Map<String, Object>> findApprovalRow(String requestId, int stage); // ownerUserId, allowedRoleCodes, approvalMode
    List<Map<String, Object>> approvalStagesForRequest(String requestId);  // từ approvals left join catalog
    Optional<Map<String, Object>> findUserRoleInfo(String userId);          // role + baseRole
    void updateApprovalDecision(String requestId, int stage, String decision, String userId,
                                String comment, String snapshot, Instant now);
    void advanceRequestStage(String requestId, int nextStage, Instant queuedAt, Instant dueAt, Instant now);
    void finalizeRequestApproval(String requestId, int stage, Instant now); // approved + items + supply step
    void createStockReservations(String requestId, String warehouseId, String userId, Instant now);
    void returnRequestToRequester(String requestId, int stage, String userId, String comment, Instant now);
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