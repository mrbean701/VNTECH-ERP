package com.vntech.erp.infrastructure.persistence;

import com.vntech.erp.application.port.out.OpsTaskStore;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/** Adapter nhiệm vụ/tổ đội/bước duyệt/MAR. */
@Component
public class OpsTaskStoreAdapter implements OpsTaskStore {

    private final JdbcTemplate jdbcTemplate;

    public OpsTaskStoreAdapter(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private Optional<Map<String, Object>> first(String sql, Object... args) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, args);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    public boolean userIsDepartmentManager(String userId, String departmentCode) {
        Long n = jdbcTemplate.queryForObject("""
                SELECT COUNT(*) FROM users u
                LEFT JOIN role_catalog rc ON rc.code=u.role
                WHERE u.id=? AND (u.role='admin' OR u.department=? OR rc.base_role='admin')""",
                Long.class, userId, departmentCode);
        return n != null && n > 0;
    }

    @Override
    public boolean userCanReceiveDepartmentTask(String userId, String departmentCode, String projectId) {
        Long n = jdbcTemplate.queryForObject("""
                SELECT COUNT(*) FROM users u
                WHERE u.id=? AND u.active=1 AND u.department=?
                  AND (?='' OR EXISTS (SELECT 1 FROM user_project_scopes ups WHERE ups.user_id=u.id AND ups.project_id=?))""",
                Long.class, userId, departmentCode, projectId == null ? "" : projectId, projectId == null ? "" : projectId);
        return n != null && n > 0;
    }

    @Override @Transactional
    public String insertWorkItem(Map<String, Object> task, Instant now) {
        String taskNo = String.valueOf(task.get("taskNo"));
        jdbcTemplate.update("""
                INSERT INTO work_items (id,department_code,work_group,title,description,project_id,work_step,
                                        assigned_to,assigned_by,assigned_at,due_at,priority,required_output,
                                        source_id,source_type,source_module,task_origin,dedupe_key,source_no,
                                        status,progress,task_no,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'manual',?,?, 'NEW',0,?,?,?)""",
                task.get("id"), task.get("department"), task.get("workGroup"), task.get("title"),
                task.get("description"), task.get("projectId"), task.get("workStep"), task.get("assignedTo"),
                task.get("assignedBy"), now, task.get("dueAt"), task.get("priority"), task.get("requiredOutput"),
                task.get("sourceId"), task.get("sourceType"), task.get("sourceModule"),
                "manual:" + taskNo, taskNo, task.get("taskNo"), now, now);
        return sv(task, "id");
    }

    @Override
    public Optional<Map<String, Object>> findWorkItem(String id) {
        return first("SELECT * FROM work_items WHERE id=?", id);
    }

    @Override @Transactional
    public void updateWorkItemProgress(String id, int progress, String currentStatus, Instant now) {
        jdbcTemplate.update("""
                UPDATE work_items SET progress=?,status=CASE WHEN status='NEW' AND ?>0 THEN 'IN_PROGRESS' ELSE status END,
                       updated_at=? WHERE id=?""", progress, progress, now, id);
    }

    @Override @Transactional
    public void insertWorkItemEvent(String id, String workItemId, String eventType, String fromStatus, String toStatus,
                                    String actorUserId, String previousAssignee, String newAssignee, String reason,
                                    String detailJson, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO work_item_events (id,work_item_id,event_type,from_status,to_status,actor_user_id,
                                              previous_assignee,new_assignee,reason,detail_json,occurred_at,created_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
                id, workItemId, eventType, fromStatus, toStatus, actorUserId, previousAssignee, newAssignee,
                reason, detailJson, now, now);
    }

    @Override @Transactional
    public void updateWorkItemStatus(Map<String, Object> u, Instant now) {
        jdbcTemplate.update("""
                UPDATE work_items SET status=?,progress=?,waiting_reason=?,waiting_started_at=?,
                       submitted_at=CASE WHEN ?='SUBMITTED' THEN ? ELSE submitted_at END,
                       completed_at=CASE WHEN ?='COMPLETED' THEN ? ELSE completed_at END,
                       completed_by=CASE WHEN ?='COMPLETED' THEN ? ELSE completed_by END,
                       cancelled_at=CASE WHEN ?='CANCELLED' THEN ? ELSE cancelled_at END,
                       cancelled_by=CASE WHEN ?='CANCELLED' THEN ? ELSE cancelled_by END,
                       active=CASE WHEN ?='CANCELLED' THEN 0 ELSE active END,updated_at=? WHERE id=?""",
                u.get("status"), u.get("progress"), u.get("waitingReason"), u.get("waitingStartedAt"),
                u.get("status"), u.get("stamp"), u.get("status"), u.get("stamp"), u.get("status"), u.get("actor"),
                u.get("status"), u.get("stamp"), u.get("status"), u.get("actor"), u.get("status"), u.get("stamp"),
                u.get("id"));
    }

    @Override @Transactional
    public void reassignWorkItem(String id, String nextUser, String assignedBy, Instant now) {
        jdbcTemplate.update("""
                UPDATE work_items SET assigned_to=?,assigned_by=?,assigned_at=?,status='NEW',progress=0,
                       waiting_reason=NULL,waiting_started_at=NULL,updated_at=? WHERE id=?""",
                nextUser, assignedBy, now, now, id);
    }

    @Override @Transactional
    public void markNotificationRead(String notificationId, String userId, Instant now) {
        jdbcTemplate.update("""
                UPDATE task_notifications SET read_at=COALESCE(read_at,?),updated_at=?
                WHERE id=? AND user_id=?""", now, now, notificationId, userId);
    }

    // ---- project teams ----
    @Override
    public Optional<Map<String, Object>> findProjectTeam(String teamId, String projectId) {
        return first("SELECT * FROM teams WHERE id=? AND project_id=?", teamId, projectId);
    }

    @Override
    public boolean teamCodeExists(String projectId, String code) {
        Long n = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM teams WHERE project_id=? AND upper(code)=upper(?)", Long.class, projectId, code);
        return n != null && n > 0;
    }

    @Override @Transactional
    public void insertProjectTeam(Map<String, Object> team, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO teams (id,project_id,code,name,trade,warehouse_id,leader_user_id,active,
                                   created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,1,?,?)""",
                team.get("id"), team.get("projectId"), team.get("code"), team.get("name"),
                team.get("trade") != null ? team.get("trade") : "general",
                team.get("warehouseId"), team.get("leaderUserId"), now, now);
    }

    @Override @Transactional
    public void updateProjectTeam(Map<String, Object> team, Instant now) {
        jdbcTemplate.update("""
                UPDATE teams SET code=?,name=?,warehouse_id=?,leader_user_id=?,updated_at=?
                WHERE id=?""", team.get("code"), team.get("name"), team.get("warehouseId"),
                team.get("leaderUserId"), now, team.get("id"));
    }

    @Override @Transactional
    public void setProjectTeamStatus(String teamId, boolean active, Instant now) {
        jdbcTemplate.update("UPDATE teams SET active=?,updated_at=? WHERE id=?", active ? 1 : 0, now, teamId);
    }

    @Override @Transactional
    public void deleteProjectTeamSafe(String teamId) {
        jdbcTemplate.update("DELETE FROM teams WHERE id=?", teamId);
    }

    // ---- approval stages ----
    @Override
    public Optional<Map<String, Object>> findApprovalStageCatalog(String stageNo) {
        return first("SELECT * FROM approval_stage_catalog WHERE stage_no=? AND active=1", stageNo);
    }

    @Override
    public boolean stageCodeExists(String code, String excludeId) {
        // approval_stage_catalog không có cột code — chống trùng theo stage_no (chỉ tạo bước ≥100)
        Long n;
        try {
            n = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM approval_stage_catalog WHERE stage_no=? AND id<>COALESCE(?, '')",
                    Long.class, Integer.parseInt(code), excludeId == null ? "" : excludeId);
        } catch (NumberFormatException e) {
            return false;
        }
        return n != null && n > 0;
    }

    @Override
    public Optional<Map<String, Object>> findApprovalStage(String id) {
        return first("SELECT * FROM approval_stage_catalog WHERE id=?", id);
    }

    @Override @Transactional
    public void insertApprovalStage(Map<String, Object> stage, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO approval_stage_catalog (id,stage_no,name,description,allowed_role_codes,active,
                                                    created_at,updated_at)
                VALUES (?,?,?,?,?,1,?,?)""",
                stage.get("id"), stage.get("stageNo"), stage.get("name"), null,
                stage.get("allowedRoleCodes"), now, now);
    }

    @Override @Transactional
    public void updateApprovalStage(Map<String, Object> stage, Instant now) {
        jdbcTemplate.update("""
                UPDATE approval_stage_catalog SET name=?,stage_no=?,allowed_role_codes=?,updated_at=?
                WHERE id=?""", stage.get("name"), stage.get("stageNo"),
                stage.get("allowedRoleCodes"), now, stage.get("id"));
    }

    @Override @Transactional
    public void setApprovalStageStatus(String id, boolean active, Instant now) {
        jdbcTemplate.update("UPDATE approval_stage_catalog SET active=?,updated_at=? WHERE id=?", active ? 1 : 0, now, id);
    }

    @Override @Transactional
    public void deleteApprovalStageSafe(String id) {
        jdbcTemplate.update("DELETE FROM approval_stage_catalog WHERE id=?", id);
    }

    // ---- MAR ----
    @Override
    public Optional<Map<String, Object>> findMaterialMarApproval(String projectId, String materialId) {
        return first("SELECT * FROM material_mar_approvals WHERE project_id=? AND material_id=?", projectId, materialId);
    }

    @Override @Transactional
    public void insertMarApproval(String id, String projectId, String materialId, String approvalNo, String status,
                                  String note, String userId, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO material_mar_approvals (id,project_id,material_id,approval_no,status,approved_at,
                                                    approved_by,note,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,?)""",
                id, projectId, materialId, approvalNo, status,
                "approved".equals(status) ? now : null, "approved".equals(status) ? userId : null, note, now, now);
    }

    @Override @Transactional
    public void updateMarApproval(String id, String approvalNo, String status, String note, String userId, Instant now) {
        jdbcTemplate.update("""
                UPDATE material_mar_approvals SET approval_no=?,status=?,approved_at=?,approved_by=?,note=?,
                       updated_at=? WHERE id=?""",
                approvalNo, status, "approved".equals(status) ? now : null,
                "approved".equals(status) ? userId : null, note, now, id);
    }

    @Override
    public Optional<Map<String, Object>> findActiveMaterial(String materialId) {
        return first("SELECT id FROM materials WHERE id=? AND active=1", materialId);
    }

    private static String sv(Map<String, Object> m, String k) { Object v = m.get(k); return v == null ? "" : String.valueOf(v); }
}