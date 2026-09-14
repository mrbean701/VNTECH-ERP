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

    Optional<Map<String, Object>> findApprovalStageCatalog(String stageNo);
    boolean stageCodeExists(String code, String excludeId);
    Optional<Map<String, Object>> findApprovalStage(String id);
    void insertApprovalStage(Map<String, Object> stage, Instant now);
    void updateApprovalStage(Map<String, Object> stage, Instant now);
    void setApprovalStageStatus(String id, boolean active, Instant now);
    void deleteApprovalStageSafe(String id);

    Optional<Map<String, Object>> findMaterialMarApproval(String projectId, String materialId);
    void insertMarApproval(String id, String projectId, String materialId, String approvalNo, String status,
                           String note, String userId, Instant now);
    void updateMarApproval(String id, String approvalNo, String status, String note, String userId, Instant now);
    Optional<Map<String, Object>> findActiveMaterial(String materialId);
}