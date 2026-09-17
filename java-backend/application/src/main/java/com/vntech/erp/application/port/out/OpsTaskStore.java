package com.vntech.erp.application.port.out;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/** Port nhiệm vụ/tổ đội/bước duyệt/MAR — port nguyên trạng create_work_item/team/approval_stage JS. */
public interface OpsTaskStore {

    boolean userIsDepartmentManager(String userId, String departmentCode);
    boolean userCanReceiveDepartmentTask(String userId, String departmentCode, String projectId);
    String insertWorkItem(Map<String, Object> task, Instant now);
    Optional<Map<String, Object>> findWorkItem(String id);
    void updateWorkItemProgress(String id, int progress, String currentStatus, Instant now);
    void insertWorkItemEvent(String id, String workItemId, String eventType, String fromStatus, String toStatus,
                             String actorUserId, String previousAssignee, String newAssignee, String reason,
                             String detailJson, Instant now);
    void updateWorkItemStatus(Map<String, Object> update, Instant now);
    void reassignWorkItem(String id, String nextUser, String assignedBy, Instant now);
    void markNotificationRead(String notificationId, String userId, Instant now);

    Optional<Map<String, Object>> findProjectTeam(String teamId, String projectId);
    boolean teamCodeExists(String projectId, String code);
    void insertProjectTeam(Map<String, Object> team, Instant now);
    void updateProjectTeam(Map<String, Object> team, Instant now);
    void setProjectTeamStatus(String teamId, boolean active, Instant now);
    void deleteProjectTeamSafe(String teamId);

    // ---- kho tổ đội (tạo kèm tổ đội, tương đương JS create_project_team) ----
    Optional<Map<String, Object>> findActiveProject(String projectId);
    Optional<Map<String, Object>> findFirstSiteWarehouse(String projectId);
    boolean teamGlobalCodeExists(String globalCode);
    boolean teamNameExists(String projectId, String name);
    void insertProjectTeamWithWarehouse(Map<String, Object> team, String warehouseId, String warehouseCode,
                                        String warehouseName, String parentSiteWarehouseId, Instant now);
    /** Đồng bộ trạng thái/ẩn hiện kho tổ đội khi bật/tắt tổ đội (JS set_project_team_status). */
    Optional<String> findTeamWarehouseId(String teamId);
    /** true nếu tổ đội đã có phiếu xuất/hoàn trả/đề nghị — chặn xóa vật lý như JS. */
    boolean teamHasTransactions(String teamId);
    void setWarehouseStatus(String warehouseId, boolean active, Instant now);
    void deleteProjectTeamWithWarehouse(String teamId, String warehouseId);

    /** Mã các vai trò đang hoạt động — JS `SELECT code FROM role_catalog WHERE active=1` (system-route.mjs:2144). */
    List<String> activeRoleCodes();
    Optional<Map<String, Object>> findApprovalStage(String id);
    /**
     * INSERT bước phê duyệt — <b>12 cột</b> như JS `system-route.mjs:2175`.
     *
     * <p><b>SỬA LỖI (TASK-041):</b> bản cũ chỉ ghi 6 cột và truyền {@code null} CỨNG cho {@code description};
     * {@code approval_mode}, {@code sla_hours}, {@code auto_approve_on_submit}, {@code sort_order}
     * <b>không được ghi</b>. Khoá của map: {@code id, stageNo, name, description, allowedRoleCodes,
     * approvalMode, slaHours, autoApproveOnSubmit, sortOrder}.
     */
    void insertApprovalStage(Map<String, Object> stage, Instant now);
    /**
     * UPDATE bước phê duyệt — <b>8 trường</b> như JS `system-route.mjs:2167`.
     *
     * <p><b>SỬA LỖI (TASK-041):</b> bảng `approval_stage_catalog` <b>KHÔNG có cột `code`</b>; bản cũ bắt buộc
     * payload {@code code} (UI không bao giờ gửi) nên action trả HTTP 400 trước khi tới SQL, và chỉ ghi 3 cột
     * ({@code name}/{@code stage_no}/{@code allowed_role_codes}) ⇒ admin sửa SLA nhưng SLA **không đổi**.
     */
    void updateApprovalStage(Map<String, Object> stage, Instant now);
    void setApprovalStageStatus(String id, boolean active, Instant now);
    void deleteApprovalStageSafe(String id);
    /** Xoá cờ tự duyệt ở MỌI bước TRỪ một bước — JS `:2166` (`WHERE id<>?`). */
    void clearAutoApproveExcept(String keepStageId, Instant now);
    /** Xoá cờ tự duyệt ở MỌI bước (nhánh THÊM bước mới) — JS `:2173`. */
    void clearAutoApproveAll(Instant now);
    /** Đếm bước đang hoạt động có `stage_no` NHỎ HƠN {@code stageNo}, trừ chính nó — JS `:2152`. */
    long countActiveStagesBefore(String excludeStageId, int stageNo);
    /** Lịch sử duyệt của một số bước — JS `:2161` (`SELECT COUNT(*) FROM approvals WHERE stage=?`). */
    long countApprovalsByStageNo(int stageNo);
    /** Đồng bộ tên bước sang `approvals.department` của hồ sơ ĐANG CHỜ — JS `:2168`. */
    void propagateStageNameToPendingApprovals(int stageNo, String name, Instant now);
    /** Số bước đang hoạt động — JS `:2192`. */
    long countActiveStages();
    /** Đếm hồ sơ đang chờ ở một bước (join `material_requests`) — JS `:2187`. */
    long countPendingApprovalsForStageNo(int stageNo);

    Optional<Map<String, Object>> findMaterialMarApproval(String projectId, String materialId);
    void insertMarApproval(String id, String projectId, String materialId, String approvalNo, String status,
                           String note, String userId, Instant now);
    void updateMarApproval(String id, String approvalNo, String status, String note, String userId, Instant now);
    Optional<Map<String, Object>> findActiveMaterial(String materialId);

    // ---- P4: workflow đa luồng (nhiều quy trình · nhiều bước · nhiều người duyệt) ----
    List<Map<String, Object>> workflowDefinitions();
    List<Map<String, Object>> workflowSteps();
    List<Map<String, Object>> workflowStepApprovers();
    Optional<Map<String, Object>> findWorkflow(String id);
    Optional<Map<String, Object>> findWorkflowByCode(String code);
    void upsertWorkflow(Map<String, Object> workflow, Instant now);
    /** Ghi đè toàn bộ bước + người duyệt của một workflow trong một giao dịch. */
    void replaceWorkflowSteps(String workflowId, List<Map<String, Object>> steps,
                              List<Map<String, Object>> approvers, Instant now);
    void setWorkflowStatus(String id, boolean active, Instant now);
    void deleteWorkflowSafe(String id);
}