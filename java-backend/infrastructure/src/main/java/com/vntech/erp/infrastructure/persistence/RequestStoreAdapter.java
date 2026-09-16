package com.vntech.erp.infrastructure.persistence;

import com.vntech.erp.application.port.out.RequestStore;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/** Adapter phiếu đề nghị MR — native SQL port từ create_request của monolith JS. */
@Component
public class RequestStoreAdapter implements RequestStore {

    private final JdbcTemplate jdbcTemplate;

    public RequestStoreAdapter(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public Optional<Map<String, Object>> findActiveProject(String projectId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT code,name,status FROM projects WHERE id=? AND status='active'", projectId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    public Optional<Map<String, Object>> findContract(String projectId, String contractId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT id,project_id AS projectId,contract_no AS contractNo,contract_name AS contractName,
                       status,is_primary AS isPrimary
                FROM project_contracts WHERE id=? AND project_id=? AND status='active'""", contractId, projectId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    public Optional<Map<String, Object>> defaultContract(String projectId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT id,project_id AS projectId,contract_no AS contractNo,contract_name AS contractName,
                       status,is_primary AS isPrimary
                FROM project_contracts WHERE project_id=? AND status='active'
                ORDER BY is_primary DESC,created_at,id LIMIT 1""", projectId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    public Optional<Map<String, Object>> findBoqVersion(String projectId, String contractId, String versionId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT id,project_id AS projectId,contract_id AS contractId,version_no AS versionNo,
                       version_code AS versionCode,status,active
                FROM boq_versions WHERE id=? AND project_id=? AND contract_id=?""", versionId, projectId, contractId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    public Optional<Map<String, Object>> activeBoqVersion(String projectId, String contractId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT id,project_id AS projectId,contract_id AS contractId,version_no AS versionNo,
                       version_code AS versionCode,status,active
                FROM boq_versions WHERE project_id=? AND contract_id=? AND active=1
                ORDER BY version_no DESC LIMIT 1""", projectId, contractId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    public List<Map<String, Object>> projectBoqRows(String projectId, String contractId, String boqVersionId) {
        if (boqVersionId == null || boqVersionId.isBlank()) {
            return jdbcTemplate.queryForList("""
                    SELECT id,material_id AS materialId,contract_id AS contractId,boq_version_id AS boqVersionId,
                           contract_line_ref AS contractLineRef,line_no AS lineNo,boq_code AS boqCode
                    FROM project_boq_items
                    WHERE project_id=? AND contract_id=? AND active=1 AND row_role IN ('material','component')""",
                    projectId, contractId);
        }
        return jdbcTemplate.queryForList("""
                SELECT id,material_id AS materialId,contract_id AS contractId,boq_version_id AS boqVersionId,
                       contract_line_ref AS contractLineRef,line_no AS lineNo,boq_code AS boqCode
                FROM project_boq_items
                WHERE project_id=? AND contract_id=? AND boq_version_id=? AND active=1
                  AND row_role IN ('material','component')""", projectId, contractId, boqVersionId);
    }

    @Override
    @Transactional
    public long nextSequence(String key, String documentType, String projectId, int year, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO document_sequences (id,document_type,project_id,`year`,last_number,updated_at)
                VALUES (?,?,?,?,1,?)
                ON DUPLICATE KEY UPDATE last_number=last_number+1,updated_at=VALUES(updated_at)""",
                key, documentType, projectId, year, now);
        Long n = jdbcTemplate.queryForObject(
                "SELECT last_number FROM document_sequences WHERE id=?", Long.class, key);
        return n == null ? 1 : n;
    }

    @Override
    public List<Map<String, Object>> activeMaterials() {
        return jdbcTemplate.queryForList("""
                SELECT id,code,name,unit,`system`,category_id AS categoryId,subcategory_id AS subcategoryId,
                       standard_price AS standardPrice
                FROM materials WHERE active=1""");
    }

    @Override
    public List<Map<String, Object>> materialAliases() {
        return jdbcTemplate.queryForList("SELECT material_id AS materialId,alias_name AS aliasName FROM material_aliases");
    }

    @Override
    public List<Map<String, Object>> activeMaterialCategories() {
        return jdbcTemplate.queryForList("SELECT id,code,name FROM material_categories WHERE active=1");
    }

    @Override
    public List<Map<String, Object>> activeMaterialSubcategories() {
        return jdbcTemplate.queryForList("SELECT id,category_id AS categoryId,code,name FROM material_subcategories WHERE active=1");
    }

    @Override
    public List<Map<String, Object>> formFieldRows(String formKey) {
        return jdbcTemplate.queryForList("""
                SELECT field_key AS fieldKey,display_name AS displayName,required,active
                FROM form_field_config WHERE form_key=? ORDER BY sort_order,field_key""", formKey);
    }

    @Override
    public List<Map<String, Object>> approvalStages(boolean activeOnly) {
        if (activeOnly) {
            return jdbcTemplate.queryForList("""
                    SELECT stage_no AS stageNo,name,allowed_role_codes AS allowedRoleCodes,
                           approval_mode AS approvalMode,sla_hours AS slaHours,
                           auto_approve_on_submit AS autoApproveOnSubmit,active,sort_order AS sortOrder
                    FROM approval_stage_catalog WHERE active=1 ORDER BY stage_no""");
        }
        return jdbcTemplate.queryForList("""
                SELECT stage_no AS stageNo,name,allowed_role_codes AS allowedRoleCodes,
                       approval_mode AS approvalMode,sla_hours AS slaHours,
                       auto_approve_on_submit AS autoApproveOnSubmit,active,sort_order AS sortOrder
                FROM approval_stage_catalog ORDER BY stage_no""");
    }

    @Override
    public Optional<Map<String, Object>> workflowAssignment(String projectId, int stageNo) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT apa.project_id AS projectId,apa.stage,apa.owner_user_id AS ownerUserId,
                       apa.cc_emails AS ccEmails,u.full_name AS ownerName,u.email AS ownerEmail,
                       u.role AS ownerRole,u.active AS ownerActive
                FROM approval_project_assignments apa
                JOIN users u ON u.id=apa.owner_user_id
                WHERE apa.project_id=? AND apa.stage=? AND apa.active=1""", projectId, stageNo);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    // ---- P4: người duyệt theo workflow đa luồng ----
    @Override
    public List<String> stageApproverUserIds(String projectId, int stageNo) {
        return jdbcTemplate.queryForList("""
                SELECT DISTINCT a.user_id
                FROM workflow_step_approvers a
                JOIN workflow_steps s ON s.id = a.step_id
                JOIN workflow_definitions w ON w.id = s.workflow_id
                WHERE a.active = 1 AND s.active = 1 AND w.active = 1 AND s.step_no = ?
                  AND (w.project_id = ? OR (w.project_id IS NULL AND w.is_default = 1))""",
                String.class, stageNo, projectId == null ? "" : projectId);
    }

    @Override
    public Optional<String> stageApprovalMode(String projectId, int stageNo) {
        String pid = projectId == null ? "" : projectId;
        // Ưu tiên quy trình gán riêng cho dự án trước quy trình mặc định.
        List<String> rows = jdbcTemplate.queryForList("""
                SELECT s.approval_mode
                FROM workflow_steps s
                JOIN workflow_definitions w ON w.id = s.workflow_id
                WHERE s.active = 1 AND w.active = 1 AND s.step_no = ?
                  AND (w.project_id = ? OR (w.project_id IS NULL AND w.is_default = 1))
                ORDER BY (w.project_id = ?) DESC
                LIMIT 1""", String.class, stageNo, pid, pid);
        return rows.isEmpty() ? Optional.empty() : Optional.ofNullable(rows.get(0));
    }

    @Override
    public List<String> stageDecisionUsers(String requestId, int stage) {
        return jdbcTemplate.queryForList(
                "SELECT DISTINCT user_id FROM approval_stage_decisions WHERE request_id=? AND stage=?",
                String.class, requestId, stage);
    }

    @Override
    @Transactional
    public void insertRequest(Map<String, Object> header, List<Map<String, Object>> lines,
                              List<Map<String, Object>> approvals, Instant now) {
        String requestId = (String) header.get("id");
        jdbcTemplate.update("""
                INSERT INTO material_requests (id,request_no,project_id,contract_id,boq_version_id,team_id,
                                               source_warehouse_id,requested_by,requested_at,needed_at,priority,
                                               area,purpose,status,approval_stage,total_estimated_value,
                                               created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                requestId, header.get("requestNo"), header.get("projectId"), header.get("contractId"),
                header.get("boqVersionId"), null, header.get("sourceWarehouseId"),
                header.get("requestedBy"), header.get("requestedAt"), header.get("neededAt"),
                header.get("priority"), header.get("area"), header.get("purpose"),
                header.get("status"), header.get("approvalStage"), header.get("total"),
                now, now);
        for (Map<String, Object> line : lines) {
            jdbcTemplate.update("""
                    INSERT INTO material_request_items (id,request_id,line_no,material_id,boq_item_id,contract_id,
                                                       boq_version_id,work_package_code,boq_code,route_tag,
                                                       installation_area,contract_line_no,origin,approved_supplier,
                                                       note,requested_qty,estimated_unit_price,stock_allocation_qty,
                                                       approved_purchase_qty,ordered_qty,received_qty,issued_qty,
                                                       installed_qty,line_status,created_at,updated_at)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                    line.get("id"), requestId, line.get("lineNo"), line.get("materialId"), line.get("boqItemId"),
                    line.get("contractId"), line.get("boqVersionId"), line.get("workPackageCode"), line.get("boqCode"),
                    line.get("routeTag"), line.get("installationArea"), line.get("contractLineNo"), line.get("origin"),
                    line.get("approvedSupplier"), line.get("note"), line.get("quantity"), line.get("unitPrice"),
                    line.get("stockAllocationQty"), line.get("approvedPurchaseQty"), 0, 0, 0, 0,
                    line.get("lineStatus"), now, now);
            jdbcTemplate.update("""
                    INSERT INTO procurement_allocations (id,project_id,contract_id,boq_version_id,boq_item_id,
                                                         material_id,request_item_id,stage,quantity,reference_no,
                                                         created_at,updated_at)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
                    "PAL_" + java.util.UUID.randomUUID(), header.get("projectId"), line.get("contractId"),
                    line.get("boqVersionId"), line.get("boqItemId"), line.get("materialId"), line.get("id"),
                    "MR", line.get("quantity"), header.get("requestNo"), now, now);
        }
        for (Map<String, Object> a : approvals) {
            jdbcTemplate.update("""
                    INSERT INTO approvals (id,request_id,stage,department,approver_user_id,status,queued_at,
                                           due_at,notified_at,reminder_sent_at,decided_at,comment,decision_snapshot,
                                           allowed_role_codes_snapshot,approval_mode_snapshot,created_at,updated_at)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                    a.get("id"), requestId, a.get("stage"), a.get("department"), a.get("approverUserId"),
                    a.get("status"), a.get("queuedAt"), a.get("dueAt"), null, null, a.get("decidedAt"),
                    a.get("comment"), a.get("decisionSnapshot"), a.get("allowedRoleCodes"),
                    a.get("approvalMode"), now, now);
        }
        header.forEach((k, v) -> { });
    }

    // ---------- workflow phê duyệt ----------
    @Override
    public Optional<Map<String, Object>> findRequestForApproval(String requestId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT mr.id,mr.request_no AS requestNo,mr.project_id AS projectId,p.code AS projectCode,
                       p.name AS projectName,mr.status,mr.approval_stage AS approvalStage,mr.needed_at AS neededAt,
                       mr.area,mr.total_estimated_value AS total,u.full_name AS requesterName,u.email AS requesterEmail,
                       mr.source_warehouse_id AS sourceWarehouseId,
                       (SELECT COUNT(*) FROM material_request_items mri WHERE mri.request_id=mr.id) AS itemCount
                FROM material_requests mr
                JOIN projects p ON p.id=mr.project_id
                JOIN users u ON u.id=mr.requested_by
                WHERE mr.id=?""", requestId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    public Optional<Map<String, Object>> findApprovalRow(String requestId, int stage) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT a.approver_user_id AS ownerUserId,
                       COALESCE(NULLIF(a.allowed_role_codes_snapshot,''),cfg.allowed_role_codes,'') AS allowedRoleCodes,
                       COALESCE(NULLIF(a.approval_mode_snapshot,''),cfg.approval_mode,'single') AS approvalMode
                FROM approvals a LEFT JOIN approval_stage_catalog cfg ON cfg.stage_no=a.stage
                WHERE a.request_id=? AND a.stage=?""", requestId, stage);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    public List<Map<String, Object>> approvalStagesForRequest(String requestId) {
        return jdbcTemplate.queryForList("""
                SELECT a.stage AS stageNo,a.department AS name,COALESCE(cfg.description,'') AS description,
                       COALESCE(NULLIF(a.allowed_role_codes_snapshot,''),cfg.allowed_role_codes,'') AS allowedRoleCodes,
                       COALESCE(NULLIF(a.approval_mode_snapshot,''),cfg.approval_mode,'single') AS approvalMode,
                       COALESCE(cfg.sla_hours,8) AS slaHours,0 AS autoApproveOnSubmit,1 AS active,a.stage AS sortOrder
                FROM approvals a
                LEFT JOIN approval_stage_catalog cfg ON cfg.stage_no=a.stage
                WHERE a.request_id=? ORDER BY a.stage""", requestId);
    }

    @Override
    public Optional<Map<String, Object>> findUserRoleInfo(String userId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT u.role,COALESCE(rc.base_role,u.role) AS baseRole
                FROM users u LEFT JOIN role_catalog rc ON rc.code=u.role WHERE u.id=?""", userId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    @Transactional
    public void updateApprovalDecision(String requestId, int stage, String decision, String userId,
                                       String comment, String snapshot, Instant now) {
        jdbcTemplate.update("""
                UPDATE approvals SET status=?,approver_user_id=?,decided_at=?,comment=?,decision_snapshot=?,updated_at=?
                WHERE request_id=? AND stage=?""", decision, userId, now, comment, snapshot, now, requestId, stage);
    }

    @Override
    @Transactional
    public void advanceRequestStage(String requestId, int nextStage, Instant queuedAt, Instant dueAt, Instant now) {
        jdbcTemplate.update("UPDATE material_requests SET approval_stage=?,updated_at=? WHERE id=?",
                nextStage, now, requestId);
        jdbcTemplate.update("UPDATE approvals SET queued_at=?,due_at=?,updated_at=? WHERE request_id=? AND stage=?",
                queuedAt, dueAt, now, requestId, nextStage);
    }

    @Override
    @Transactional
    public void finalizeRequestApproval(String requestId, int stage, Instant now) {
        jdbcTemplate.update("""
                UPDATE material_requests SET status='approved',supply_status='awaiting_po',approval_stage=?,updated_at=?
                WHERE id=?""", stage, now, requestId);
        jdbcTemplate.update("""
                UPDATE material_request_items SET
                       approved_purchase_qty=CASE WHEN requested_qty-stock_allocation_qty>0 THEN requested_qty-stock_allocation_qty ELSE 0 END,
                       line_status='approved',updated_at=? WHERE request_id=?""", now, requestId);
        Long sla = jdbcTemplate.queryForObject("""
                SELECT COALESCE((SELECT po_sla_hours FROM company_settings WHERE id='SETTINGS'),24)""", Long.class);
        long poSla = sla == null ? 24 : sla;
        jdbcTemplate.update("""
                INSERT INTO supply_workflow_steps (id,request_id,purchase_order_id,receipt_id,step,status,
                                                   queued_at,due_at,completed_at,completed_by,comment,created_at,updated_at)
                VALUES (?,?,NULL,NULL,'po_creation','pending',?,?,NULL,NULL,
                        'Tự chuyển từ phê duyệt sang chờ lập PO',?,?)""",
                "SWF_" + java.util.UUID.randomUUID(), requestId, now,
                now.plusSeconds(poSla * 3600), now, now);
    }

    @Override
    @Transactional
    public void createStockReservations(String requestId, String warehouseId, String userId, Instant now) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT id,material_id AS materialId,stock_allocation_qty AS qty
                FROM material_request_items WHERE request_id=? AND stock_allocation_qty>0""", requestId);
        for (Map<String, Object> rr : rows) {
            jdbcTemplate.update("""
                    INSERT INTO stock_reservations (id,project_id,warehouse_id,material_id,request_id,request_item_id,
                                                   quantity,status,reserved_at,released_at,created_by,created_at,updated_at)
                    VALUES (?,?,?,?,?,?,?,?,?,NULL,?,?,?)""",
                    "RSV_" + java.util.UUID.randomUUID(),
                    jdbcTemplate.queryForObject("SELECT project_id FROM material_requests WHERE id=?", String.class, requestId),
                    warehouseId, rr.get("materialId"), requestId, rr.get("id"), rr.get("qty"),
                    "active", now, userId, now, now);
        }
    }

    @Override
    @Transactional
    public void returnRequestToRequester(String requestId, int stage, String userId, String comment, Instant now) {
        jdbcTemplate.update("""
                UPDATE material_requests SET status='returned_to_requester',supply_status='returned',
                                             approval_stage=0,updated_at=? WHERE id=?""", now, requestId);
        jdbcTemplate.update("""
                UPDATE approvals SET status=CASE WHEN stage>? THEN 'waiting' ELSE status END,
                                    queued_at=CASE WHEN stage>? THEN NULL ELSE queued_at END,
                                    due_at=CASE WHEN stage>? THEN NULL ELSE due_at END,
                                    updated_at=? WHERE request_id=?""", stage, stage, stage, now, requestId);
        jdbcTemplate.update("""
                INSERT INTO request_comments (id,request_id,user_id,comment,visibility,created_at)
                VALUES (?,?,?,?,?,?)""", "RCM_" + java.util.UUID.randomUUID(), requestId, userId,
                "TRẢ LẠI BƯỚC " + stage + ": " + comment, "internal", now);
    }

    @Override
    public boolean stageDecisionRoleExists(String requestId, int stage, String roleCode) {
        Long n = jdbcTemplate.queryForObject("""
                SELECT COUNT(*) FROM approval_stage_decisions
                WHERE request_id=? AND stage=? AND role_code=?""", Long.class, requestId, stage, roleCode);
        return n != null && n > 0;
    }

    @Override
    @Transactional
    public void insertStageDecision(String requestId, int stage, String roleCode, String userId,
                                    String decision, String comment, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO approval_stage_decisions (id,request_id,stage,role_code,user_id,decision,comment,
                                                     decided_at,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,?)""",
                "APD_" + java.util.UUID.randomUUID(), requestId, stage, roleCode, userId, decision,
                comment, now, now, now);
    }

    // ---------- MR lifecycle ----------
    @Override
    public Optional<Map<String, Object>> findRequestBasic(String requestId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT id,request_no AS requestNo,project_id AS projectId,requested_by AS requestedBy,status
                FROM material_requests WHERE id=?""", requestId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    public long countRequestPoItems(String requestId) {
        Long n = jdbcTemplate.queryForObject("""
                SELECT COUNT(*) FROM purchase_order_items poi
                JOIN material_request_items mri ON mri.id=poi.request_item_id
                WHERE mri.request_id=?""", Long.class, requestId);
        return n == null ? 0 : n;
    }

    @Override
    @Transactional
    public void deleteRequestCascade(String requestId) {
        jdbcTemplate.update("DELETE FROM approval_stage_decisions WHERE request_id=?", requestId);
        jdbcTemplate.update("DELETE FROM approvals WHERE request_id=?", requestId);
        jdbcTemplate.update("DELETE FROM request_comments WHERE request_id=?", requestId);
        jdbcTemplate.update("DELETE FROM material_request_items WHERE request_id=?", requestId);
        jdbcTemplate.update("DELETE FROM material_requests WHERE id=?", requestId);
    }

    @Override
    @Transactional
    public void updateReturnedRequest(String requestId, String neededAt, String priority, String area,
                                      String purpose, List<Map<String, Object>> lines, String commentUserId,
                                      String commentText, Instant now) {
        jdbcTemplate.update("""
                UPDATE material_requests SET needed_at=?,priority=?,area=?,purpose=?,updated_at=? WHERE id=?""",
                neededAt, priority, area, purpose, now, requestId);
        for (Map<String, Object> line : lines) {
            String itemId = String.valueOf(line.get("id"));
            jdbcTemplate.update("""
                    UPDATE material_request_items SET requested_qty=?,updated_at=? WHERE id=? AND request_id=?""",
                    line.get("requestedQty"), now, itemId, requestId);
        }
        jdbcTemplate.update("""
                INSERT INTO request_comments (id,request_id,user_id,comment,visibility,created_at)
                VALUES (?,?,?,?,?,?)""", "RCM_" + java.util.UUID.randomUUID(), requestId, commentUserId,
                commentText, "internal", now);
    }

    @Override
    @Transactional
    public void resubmitRequest(String requestId, List<Map<String, Object>> stages, String firstStageId,
                                boolean autoFirst, int currentStage, String userId, String comment, Instant now) {
        // 1) MR sang pending_approval
        jdbcTemplate.update("""
                UPDATE material_requests SET status='pending_approval',supply_status='approval_pending',
                                             approval_stage=?,updated_at=? WHERE id=?""", currentStage, now, requestId);
        // 2) approvals: bước 1 auto nếu cấu hình; bước hiện tại pending; còn lại waiting
        for (int i = 0; i < stages.size(); i++) {
            Map<String, Object> stage = stages.get(i);
            int stageNo = ((Number) ciGet(stage, "stageNo")).intValue();
            double sla = ((Number) ciGet(stage, "slaHours")).doubleValue();
            boolean isFirst = i == 0;
            String status = isFirst && autoFirst ? "approved" : (stageNo == currentStage ? "pending" : "waiting");
            Object queuedAt = isFirst && autoFirst ? now : (stageNo == currentStage ? now : null);
            Instant dueAt = (stageNo == currentStage || (isFirst && autoFirst))
                    ? now.plusSeconds((long) (sla * 3600)) : null;
            jdbcTemplate.update("""
                    UPDATE approvals SET status=?,queued_at=?,due_at=?,decided_at=CASE WHEN ? THEN ? ELSE decided_at END,
                                          comment=CASE WHEN ? THEN ? ELSE comment END,updated_at=?
                    WHERE request_id=? AND stage=?""", status, queuedAt, dueAt,
                    isFirst && autoFirst, isFirst && autoFirst ? now : null,
                    isFirst && autoFirst, "Tự xác nhận khi gửi lại phiếu", now, requestId, stageNo);
        }
        // 3) xóa decisions cũ + comment
        jdbcTemplate.update("DELETE FROM approval_stage_decisions WHERE request_id=?", requestId);
        jdbcTemplate.update("""
                INSERT INTO request_comments (id,request_id,user_id,comment,visibility,created_at)
                VALUES (?,?,?,?,?,?)""", "RCM_" + java.util.UUID.randomUUID(), requestId, userId, comment,
                "internal", now);
    }

    @Override
    @Transactional
    public void cancelRequest(String requestId, String reason, String userId, Instant now) {
        jdbcTemplate.update("""
                UPDATE material_requests SET status='cancelled',supply_status='cancelled',updated_at=? WHERE id=?""",
                now, requestId);
        jdbcTemplate.update("""
                UPDATE approvals SET status=CASE WHEN status='pending' THEN 'cancelled' ELSE status END,
                                     comment=CASE WHEN status='pending' THEN ? ELSE comment END,updated_at=?
                WHERE request_id=?""", "Hủy phiếu: " + reason, now, requestId);
        jdbcTemplate.update("""
                UPDATE supply_workflow_steps SET status='cancelled',completed_at=?,completed_by=?,comment=?,updated_at=?
                WHERE request_id=? AND status='pending'""", now, userId, "Hủy phiếu: " + reason, now, requestId);
    }

    /** Get case-insensitive — H2 trả lowercase keys, MySQL trả đúng alias camelCase. */
    private static Object ciGet(Map<String, Object> m, String key) {
        if (m == null) return null;
        Object v = m.get(key);
        if (v != null) return v;
        for (Map.Entry<String, Object> e : m.entrySet()) {
            if (e.getKey().equalsIgnoreCase(key)) return e.getValue();
        }
        return null;
    }
}