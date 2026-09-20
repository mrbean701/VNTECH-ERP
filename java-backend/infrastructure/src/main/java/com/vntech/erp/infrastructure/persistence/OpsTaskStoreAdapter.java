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
        // TASK-080C — PORT NGUỒN DỮ LIỆU từ JS SSOT `scripts/system-route.mjs:247` (quy tắc #9 của dự án:
        // "khi port từ JS sang Java phải port cả NGUỒN DỮ LIỆU, không chỉ chuỗi so sánh").
        //   JS: admin -> true; "KH" -> user.role === 'kh_truong'; "DA" -> user.role === 'da_truong'; còn lại false.
        // Bản Java trước đây so `u.department=?` với MÃ phòng ('KH'/'DA'), nhưng cột `users.department` chứa
        // TÊN tiếng Việt ('Phòng Kế hoạch'/'Phòng Dự án') ⇒ KHÔNG BAO GIỜ khớp ⇒ mọi action của Trưởng phòng
        // (create_work_item · update_work_item_status · reassign_work_item) bị chặn với MỌI người dùng thật.
        String expectedRole = "KH".equals(departmentCode) ? "kh_truong" : "DA".equals(departmentCode) ? "da_truong" : null;
        if (expectedRole == null) return false;
        Long n = jdbcTemplate.queryForObject("""
                SELECT COUNT(*) FROM users u
                LEFT JOIN role_catalog rc ON rc.code=u.role
                WHERE u.id=? AND (u.role='admin' OR u.role=? OR COALESCE(rc.base_role,u.role)='admin')""",
                Long.class, userId, expectedRole);
        return n != null && n > 0;
    }

    @Override
    public boolean userCanReceiveDepartmentTask(String userId, String departmentCode, String projectId) {
        // TASK-080C — PORT NGUYÊN quy tắc JS `scripts/system-route.mjs:248-255`:
        //   · tài khoản phải active;
        //   · `COALESCE(rc.base_role,u.role)` phải khớp phòng (KH -> 'procurement', DA -> 'project'), trừ admin;
        //   · nếu có dự án thì phải có dòng `user_project_scopes` (trừ admin).
        // Bản Java trước đây so `u.department=?` với mã phòng ⇒ luôn sai nguồn dữ liệu (cùng lớp lỗi trên).
        String expectedBase = "KH".equals(departmentCode) ? "procurement" : "DA".equals(departmentCode) ? "project" : null;
        if (expectedBase == null) return false;
        String pid = projectId == null ? "" : projectId;
        Long n = jdbcTemplate.queryForObject("""
                SELECT COUNT(*) FROM users u
                LEFT JOIN role_catalog rc ON rc.code=u.role
                WHERE u.id=? AND u.active=1
                  AND (u.role='admin' OR COALESCE(rc.base_role,u.role)=?)
                  AND (?='' OR u.role='admin'
                       OR EXISTS (SELECT 1 FROM user_project_scopes ups WHERE ups.user_id=u.id AND ups.project_id=?))""",
                Long.class, userId, expectedBase, pid, pid);
        return n != null && n > 0;
    }

    @Override
    public String defaultDepartmentAssignee(String departmentCode, String projectId) {
        // TASK-080C — PORT quy tắc chọn người nhận mặc định của JS `scripts/system-route.mjs:256-259`:
        // ưu tiên nhân sự CÓ phạm vi dự án, rồi tới nhân viên ('kh_nv'/'da_nv'), xếp theo `full_name`.
        // JS chạy 2 câu (có dự án → không dự án); ở đây gộp thành 1 câu với ORDER BY ưu tiên phạm vi dự án.
        String base = "KH".equals(departmentCode) ? "procurement" : "DA".equals(departmentCode) ? "project" : null;
        if (base == null) return null;
        String pid = projectId == null ? "" : projectId;
        List<String> ids = jdbcTemplate.queryForList("""
                SELECT u.id FROM users u
                LEFT JOIN role_catalog rc ON rc.code=u.role
                LEFT JOIN user_project_scopes ups ON ups.user_id=u.id AND ups.project_id=?
                WHERE u.active=1 AND COALESCE(rc.base_role,u.role)=?
                ORDER BY CASE WHEN u.role IN ('kh_nv','da_nv') THEN 0 ELSE 1 END,
                         CASE WHEN ?<>'' AND ups.user_id IS NULL THEN 1 ELSE 0 END,
                         u.full_name
                LIMIT 1""", String.class, pid, base, pid);
        return ids.isEmpty() ? null : ids.get(0);
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

    // ---- TASK-080C (KP #78): port bước `queueTaskNotice` của JS `system-route.mjs:261-267` ----

    @Override @Transactional(readOnly = true)
    public Optional<Map<String, Object>> findUserContact(String userId) {
        return first("SELECT id,full_name AS fullName,email FROM users WHERE id=?", userId);
    }

    @Override @Transactional(readOnly = true)
    public String emailBaseUrl() {
        return first("SELECT base_url AS baseUrl FROM email_settings WHERE id='EMAIL'")
                .map(row -> sv(row, "baseUrl")).orElse("");
    }

    @Override @Transactional
    public void insertTaskNotification(Map<String, Object> notice, Instant now) {
        // JS `:265`: INSERT task_notifications(...,channel='in_app',status='SENT',sent_at=stamp,...)
        jdbcTemplate.update("""
                INSERT INTO task_notifications (id,work_item_id,user_id,channel,title,body,status,
                                               read_at,sent_at,last_error,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
                notice.get("id"), notice.get("workItemId"), notice.get("userId"), notice.get("channel"),
                notice.get("title"), notice.get("body"), "SENT", null, now, null, now, now);
    }

    @Override @Transactional
    public void insertEmailOutbox(Map<String, Object> mail, Instant now) {
        // JS `:266`: INSERT email_outbox(...,request_id=NULL,stage=NULL,event='task_assigned',
        //                                status='queued',attempt_count=0,next_attempt_at=stamp,queued_at=stamp)
        jdbcTemplate.update("""
                INSERT INTO email_outbox (id,request_id,stage,event,recipients,subject,text_body,html_body,
                                         status,attempt_count,next_attempt_at,queued_at,sent_at,last_error,
                                         created_at,updated_at)
                VALUES (?,NULL,NULL,'task_assigned',?,?,?,?,'queued',0,?,?,NULL,NULL,?,?)""",
                mail.get("id"), mail.get("recipients"), mail.get("subject"), mail.get("textBody"),
                mail.get("htmlBody"), now, now, now, now);
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

    // ---- kho tổ đội ----
    @Override @Transactional(readOnly = true)
    public Optional<Map<String, Object>> findActiveProject(String projectId) {
        return first("SELECT id,code,name FROM projects WHERE id=? AND status='active'", projectId);
    }

    @Override @Transactional(readOnly = true)
    public Optional<Map<String, Object>> findFirstSiteWarehouse(String projectId) {
        return first("""
                SELECT id,code FROM warehouses
                WHERE project_id=? AND type='site' AND active=1 ORDER BY code LIMIT 1""", projectId);
    }

    @Override @Transactional(readOnly = true)
    public boolean teamGlobalCodeExists(String globalCode) {
        Long n = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM teams WHERE code=?", Long.class, globalCode);
        return n != null && n > 0;
    }

    @Override @Transactional(readOnly = true)
    public boolean teamNameExists(String projectId, String name) {
        Long n = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM teams WHERE project_id=? AND lower(name)=lower(?)", Long.class, projectId, name);
        return n != null && n > 0;
    }

    /**
     * JS create_project_team tạo 2 bản ghi trong cùng một batch: kho tổ đội (type='team', cha là kho site)
     * rồi tổ đội trỏ tới kho đó. teams.warehouse_id là NOT NULL nên bắt buộc phải có kho trước.
     */
    @Override @Transactional
    public void insertProjectTeamWithWarehouse(Map<String, Object> team, String warehouseId, String warehouseCode,
                                               String warehouseName, String parentSiteWarehouseId, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO warehouses (id,code,name,type,project_id,parent_warehouse_id,keeper_user_id,
                                        active,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,1,?,?)""",
                warehouseId, warehouseCode, warehouseName, "team", team.get("projectId"),
                parentSiteWarehouseId, null, now, now);
        jdbcTemplate.update("""
                INSERT INTO teams (id,project_id,code,name,trade,warehouse_id,leader_user_id,active,
                                   created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,1,?,?)""",
                team.get("id"), team.get("projectId"), team.get("code"), team.get("name"),
                team.get("trade") != null ? team.get("trade") : "general",
                warehouseId, team.get("leaderUserId"), now, now);
    }

    @Override @Transactional(readOnly = true)
    public Optional<String> findTeamWarehouseId(String teamId) {
        List<String> rows = jdbcTemplate.queryForList(
                "SELECT warehouse_id FROM teams WHERE id=?", String.class, teamId);
        return rows.isEmpty() ? Optional.empty() : Optional.ofNullable(rows.get(0));
    }

    @Override @Transactional(readOnly = true)
    public boolean teamHasTransactions(String teamId) {
        for (String table : new String[]{"stock_issues", "material_returns", "material_requests"}) {
            Long n = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM " + table + " WHERE team_id=?", Long.class, teamId);
            if (n != null && n > 0) return true;
        }
        return false;
    }

    @Override @Transactional
    public void setWarehouseStatus(String warehouseId, boolean active, Instant now) {
        if (warehouseId == null || warehouseId.isBlank()) return;
        jdbcTemplate.update("UPDATE warehouses SET active=?,updated_at=? WHERE id=?", active ? 1 : 0, now, warehouseId);
    }

    @Override @Transactional
    public void deleteProjectTeamWithWarehouse(String teamId, String warehouseId) {
        jdbcTemplate.update("DELETE FROM teams WHERE id=?", teamId);
        if (warehouseId != null && !warehouseId.isBlank()) {
            jdbcTemplate.update("DELETE FROM warehouses WHERE id=?", warehouseId);
        }
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
    public List<String> activeRoleCodes() {
        return jdbcTemplate.queryForList("SELECT code FROM role_catalog WHERE active=1", String.class);
    }

    @Override
    public Optional<Map<String, Object>> findApprovalStage(String id) {
        return first("SELECT * FROM approval_stage_catalog WHERE id=?", id);
    }

    @Override @Transactional
    public void insertApprovalStage(Map<String, Object> stage, Instant now) {
        // SỬA LỖI (TASK-041): bản cũ truyền `null` CỨNG cho description và KHÔNG ghi approval_mode/sla_hours/
        // auto_approve_on_submit/sort_order. JS `system-route.mjs:2175` chèn đủ 12 cột. Hệ quả cũ: bước mới tạo
        // mất mô tả, mất SLA (mặc định 8 giờ trong mã JS không bao giờ được ghi vào DB).
        jdbcTemplate.update("""
                INSERT INTO approval_stage_catalog (id,stage_no,name,description,allowed_role_codes,approval_mode,
                                                    sla_hours,auto_approve_on_submit,active,sort_order,
                                                    created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,?,1,?,?,?)""",
                stage.get("id"), stage.get("stageNo"), stage.get("name"), stage.get("description"),
                stage.get("allowedRoleCodes"), stage.get("approvalMode"), stage.get("slaHours"),
                Boolean.TRUE.equals(stage.get("autoApproveOnSubmit")) ? 1 : 0,
                stage.get("sortOrder"), now, now);
    }

    @Override @Transactional
    public void updateApprovalStage(Map<String, Object> stage, Instant now) {
        // SỬA LỖI (TASK-041): bản cũ chỉ ghi name/stage_no/allowed_role_codes ⇒ admin sửa SLA của bước duyệt,
        // hệ thống báo thành công nhưng `sla_hours` KHÔNG đổi (và description/approval_mode/auto_approve/
        // sort_order cũng mất). Đúng JS `system-route.mjs:2167` — 8 trường.
        jdbcTemplate.update("""
                UPDATE approval_stage_catalog SET stage_no=?,name=?,description=?,allowed_role_codes=?,
                                                  approval_mode=?,sla_hours=?,auto_approve_on_submit=?,sort_order=?,
                                                  updated_at=?
                WHERE id=?""",
                stage.get("stageNo"), stage.get("name"), stage.get("description"), stage.get("allowedRoleCodes"),
                stage.get("approvalMode"), stage.get("slaHours"),
                Boolean.TRUE.equals(stage.get("autoApproveOnSubmit")) ? 1 : 0,
                stage.get("sortOrder"), now, stage.get("id"));
    }

    @Override @Transactional
    public void clearAutoApproveExcept(String keepStageId, Instant now) {
        jdbcTemplate.update("UPDATE approval_stage_catalog SET auto_approve_on_submit=0,updated_at=? WHERE id<>?",
                now, keepStageId);
    }

    @Override @Transactional
    public void clearAutoApproveAll(Instant now) {
        jdbcTemplate.update("UPDATE approval_stage_catalog SET auto_approve_on_submit=0,updated_at=?", now);
    }

    @Override
    public long countActiveStagesBefore(String excludeStageId, int stageNo) {
        Long n = jdbcTemplate.queryForObject("""
                SELECT COUNT(*) FROM approval_stage_catalog
                WHERE active=1 AND id<>COALESCE(?, '') AND stage_no<?""", Long.class, excludeStageId, stageNo);
        return n == null ? 0 : n;
    }

    @Override
    public long countApprovalsByStageNo(int stageNo) {
        Long n = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM approvals WHERE stage=?", Long.class, stageNo);
        return n == null ? 0 : n;
    }

    @Override @Transactional
    public void propagateStageNameToPendingApprovals(int stageNo, String name, Instant now) {
        jdbcTemplate.update("""
                UPDATE approvals SET department=?,updated_at=?
                WHERE stage=? AND status='pending' AND decided_at IS NULL""", name, now, stageNo);
    }

    @Override
    public long countActiveStages() {
        Long n = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM approval_stage_catalog WHERE active=1", Long.class);
        return n == null ? 0 : n;
    }

    @Override
    public long countPendingApprovalsForStageNo(int stageNo) {
        Long n = jdbcTemplate.queryForObject("""
                SELECT COUNT(*) FROM approvals a
                JOIN material_requests mr ON mr.id=a.request_id
                WHERE a.stage=? AND a.status='pending' AND mr.status='pending_approval'
                  AND mr.approval_stage=a.stage""", Long.class, stageNo);
        return n == null ? 0 : n;
    }

    @Override @Transactional
    public void setApprovalStageStatus(String id, boolean active, Instant now) {
        jdbcTemplate.update("UPDATE approval_stage_catalog SET active=?,updated_at=? WHERE id=?", active ? 1 : 0, now, id);
    }

    @Override @Transactional
    public void deleteApprovalStageSafe(String id) {
        jdbcTemplate.update("DELETE FROM approval_stage_catalog WHERE id=?", id);
    }

    // ---- P4: workflow đa luồng ----
    @Override
    public List<Map<String, Object>> workflowDefinitions() {
        return jdbcTemplate.queryForList("""
                SELECT id,code,name,description,module_key AS moduleKey,project_id AS projectId,
                       is_default AS isDefault,active,sort_order AS sortOrder,created_by AS createdBy
                FROM workflow_definitions ORDER BY sort_order,code""");
    }

    @Override
    public List<Map<String, Object>> workflowSteps() {
        return jdbcTemplate.queryForList("""
                SELECT id,workflow_id AS workflowId,step_no AS stepNo,name,description,
                       approval_mode AS approvalMode,sla_hours AS slaHours,
                       allow_skip_level AS allowSkipLevel,required_permission AS requiredPermission,active
                FROM workflow_steps ORDER BY workflow_id,step_no""");
    }

    @Override
    public List<Map<String, Object>> workflowStepApprovers() {
        return jdbcTemplate.queryForList("""
                SELECT a.id,a.step_id AS stepId,a.user_id AS userId,a.active,
                       u.full_name AS fullName,u.employee_code AS employeeCode,u.role AS role
                FROM workflow_step_approvers a
                LEFT JOIN users u ON u.id=a.user_id
                ORDER BY a.step_id,a.user_id""");
    }

    @Override
    public Optional<Map<String, Object>> findWorkflow(String id) {
        return first("SELECT id,code,name FROM workflow_definitions WHERE id=?", id);
    }

    @Override
    public Optional<Map<String, Object>> findWorkflowByCode(String code) {
        return first("SELECT id,code,name FROM workflow_definitions WHERE code=?", code);
    }

    @Override @Transactional
    public void upsertWorkflow(Map<String, Object> wf, Instant now) {
        Long n = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM workflow_definitions WHERE id=?", Long.class, wf.get("id"));
        // [TASK-115] Cột `workflow_definitions.version` đã bị XOÁ bởi V19__drop_workflow_definitions_version.sql
        // (PHASE 8 · WF-03, commit c382b47) nhưng 2 câu lệnh dưới đây vẫn ghi nó ⇒
        // MySQL thật: `ERROR 1054 (42S22) Unknown column 'version' in 'field list'` (đo 22/09/2026),
        // H2: `Column "version" not found`. Đã bỏ hẳn khỏi INSERT và khỏi `version=version+1` của UPDATE
        // (cùng họ với việc commit 49da107 đã sửa cho các câu SELECT).
        if (n != null && n > 0) {
            jdbcTemplate.update("""
                    UPDATE workflow_definitions SET code=?,name=?,description=?,module_key=?,project_id=?,
                           is_default=?,sort_order=?,updated_at=? WHERE id=?""",
                    wf.get("code"), wf.get("name"), wf.get("description"), wf.get("moduleKey"), wf.get("projectId"),
                    wf.get("isDefault"), wf.get("sortOrder"), now, wf.get("id"));
        } else {
            jdbcTemplate.update("""
                    INSERT INTO workflow_definitions (id,code,name,description,module_key,project_id,is_default,
                                                      active,sort_order,created_by,created_at,updated_at)
                    VALUES (?,?,?,?,?,?,?,1,?,?,?,?)""",
                    wf.get("id"), wf.get("code"), wf.get("name"), wf.get("description"), wf.get("moduleKey"),
                    wf.get("projectId"), wf.get("isDefault"), wf.get("sortOrder"), wf.get("createdBy"), now, now);
        }
    }

    @Override @Transactional
    public void replaceWorkflowSteps(String workflowId, List<Map<String, Object>> steps,
                                     List<Map<String, Object>> approvers, Instant now) {
        jdbcTemplate.update("""
                DELETE FROM workflow_step_approvers
                WHERE step_id IN (SELECT id FROM workflow_steps WHERE workflow_id=?)""", workflowId);
        jdbcTemplate.update("DELETE FROM workflow_steps WHERE workflow_id=?", workflowId);
        for (Map<String, Object> s : steps) {
            jdbcTemplate.update("""
                    INSERT INTO workflow_steps (id,workflow_id,step_no,name,description,approval_mode,sla_hours,
                                                allow_skip_level,required_permission,active,created_at,updated_at)
                    VALUES (?,?,?,?,?,?,?,?,?,1,?,?)""",
                    s.get("id"), workflowId, s.get("stepNo"), s.get("name"), s.get("description"),
                    s.get("approvalMode"), s.get("slaHours"), s.get("allowSkipLevel"),
                    s.get("requiredPermission"), now, now);
        }
        for (Map<String, Object> a : approvers) {
            jdbcTemplate.update("""
                    INSERT IGNORE INTO workflow_step_approvers (id,step_id,user_id,active,created_at,updated_at)
                    VALUES (?,?,?,1,?,?)""",
                    a.get("id"), a.get("stepId"), a.get("userId"), now, now);
        }
    }

    @Override @Transactional
    public void setWorkflowStatus(String id, boolean active, Instant now) {
        jdbcTemplate.update("UPDATE workflow_definitions SET active=?,updated_at=? WHERE id=?",
                active ? 1 : 0, now, id);
    }

    @Override @Transactional
    public void deleteWorkflowSafe(String id) {
        jdbcTemplate.update("""
                DELETE FROM workflow_step_approvers
                WHERE step_id IN (SELECT id FROM workflow_steps WHERE workflow_id=?)""", id);
        jdbcTemplate.update("DELETE FROM workflow_steps WHERE workflow_id=?", id);
        // Quy trình mặc định không được xóa — chỉ được ẩn.
        jdbcTemplate.update("DELETE FROM workflow_definitions WHERE id=? AND is_default=0", id);
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