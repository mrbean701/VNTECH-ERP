package com.vntech.erp.infrastructure.persistence;

import com.vntech.erp.application.port.out.AdminOpsStore;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/** Adapter vận hành admin. */
@Component
public class AdminOpsStoreAdapter implements AdminOpsStore {

    private final JdbcTemplate jdbcTemplate;

    public AdminOpsStoreAdapter(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private Optional<Map<String, Object>> first(String sql, Object... args) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, args);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    // ---------- email settings ----------
    @Override
    @Transactional
    public void upsertEmailSettings(Map<String, Object> s, String userId, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO email_settings (id,enabled,smtp_host,smtp_port,security,username,password,sender_email,
                                            sender_name,base_url,updated_by,created_at,updated_at)
                VALUES ('EMAIL',?,?,?,?,?,?,?,?,?,?,?,?)
                ON DUPLICATE KEY UPDATE enabled=VALUES(enabled),smtp_host=VALUES(smtp_host),smtp_port=VALUES(smtp_port),
                    security=VALUES(security),username=VALUES(username),
                    password=CASE WHEN VALUES(password) IS NULL THEN email_settings.password ELSE VALUES(password) END,
                    sender_email=VALUES(sender_email),sender_name=VALUES(sender_name),base_url=VALUES(base_url),
                    updated_by=VALUES(updated_by),updated_at=VALUES(updated_at)""",
                s.get("enabled") == Boolean.TRUE ? 1 : 0, s.get("smtpHost"), s.get("smtpPort"),
                s.get("security"), s.get("username"), s.get("smtpPassword"), s.get("senderEmail"),
                s.get("senderName"), s.get("baseUrl"), userId, now, now);
    }

    @Override
    @Transactional
    public void updateSlaSettings(boolean poSla, long poHours, boolean bchSla, long bchHours, String userId,
                                  Instant now) {
        jdbcTemplate.update("""
                UPDATE company_settings SET po_sla_hours=?,bch_confirmation_sla_hours=?,updated_by=?,updated_at=?
                WHERE id='SETTINGS'""", poSla ? poHours : 24, bchSla ? bchHours : 8, userId, now);
    }

    @Override
    @Transactional
    public void clearApprovalEmailRecipients() {
        jdbcTemplate.update("DELETE FROM approval_email_recipients");
    }

    @Override
    @Transactional
    public void clearApprovalProjectAssignments() {
        jdbcTemplate.update("DELETE FROM approval_project_assignments");
    }

    @Override
    @Transactional
    public void insertApprovalAssignment(String id, String projectId, int stage, String ownerUserId,
                                         String ccEmails, String updatedBy, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO approval_project_assignments (id,project_id,stage,owner_user_id,cc_emails,active,
                                                          updated_by,created_at,updated_at)
                VALUES (?,?,?,?,?,1,?,?,?)""", id, projectId, stage, ownerUserId, ccEmails, updatedBy, now, now);
    }

    @Override
    @Transactional
    public void insertApprovalRecipient(String id, String projectId, int stage, String emails, Instant now) {
        // SỬA LỖI (TASK-040): câu lệnh cũ ghi user_email + cc_emails + updated_by — CẢ BA cột này KHÔNG
        // tồn tại trong lược đồ (drizzle 0004 và V1__baseline đều chỉ có MỘT cột `emails`)
        // ⇒ MySQL ném "Unknown column" ⇒ action save_email_settings trả HTTP 500.
        // Port nguyên trạng JS (scripts/system-route.mjs): một cột `emails`, active=1, có created_at.
        jdbcTemplate.update("""
                INSERT INTO approval_email_recipients (id,project_id,stage,emails,active,created_at,updated_at)
                VALUES (?,?,?,?,1,?,?)""", id, projectId, stage, emails, now, now);
    }

    // ---------- preview request import ----------
    @Override
    public Optional<Map<String, Object>> findProjectBasic(String projectId) {
        return first("SELECT id,code,name FROM projects WHERE id=?", projectId);
    }

    @Override
    public Optional<Map<String, Object>> findActiveBoqVersionId(String projectId, String contractId) {
        return first("""
                SELECT id FROM boq_versions WHERE project_id=? AND contract_id=? AND active=1
                ORDER BY version_no DESC LIMIT 1""", projectId, contractId);
    }

    @Override
    public Optional<Map<String, Object>> findContractForVersion(String projectId, String contractId, String boqVersionId) {
        return first("""
                SELECT c.id,c.contract_no AS contractNo,c.contract_name AS contractName,c.project_id AS projectId
                FROM project_contracts c JOIN boq_versions v ON v.contract_id=c.id
                WHERE c.project_id=? AND c.id=? AND v.id=?""", projectId, contractId, boqVersionId);
    }

    @Override
    public List<Map<String, Object>> boqRowsForPreview(String projectId, String contractId, String boqVersionId) {
        return jdbcTemplate.queryForList("""
                SELECT pbi.id,pbi.material_id AS materialId,pbi.contract_line_ref AS contractLineRef,pbi.line_no AS lineNo,
                       pbi.boq_code AS boqCode,pbi.contract_material_code AS contractMaterialCode,pbi.approved_material_code AS approvedMaterialCode,
                       pbi.description AS materialName,COALESCE(NULLIF(bsi.unit,''),m.unit) AS unit,pbi.contract_qty AS contractQty,
                       pbi.item_type AS itemType,m.code AS materialCode,m.name AS standardMaterialName
                FROM project_boq_items pbi
                LEFT JOIN materials m ON m.id=pbi.material_id
                LEFT JOIN boq_source_items bsi ON bsi.id=pbi.source_item_id
                WHERE pbi.project_id=? AND pbi.contract_id=? AND pbi.boq_version_id=?
                  AND pbi.active=1 AND pbi.row_role IN ('material','component')""",
                projectId, contractId, boqVersionId);
    }

    @Override
    public List<Map<String, Object>> materialsForPreview() {
        return jdbcTemplate.queryForList("""
                SELECT id,code,name,unit,standard_price AS standardPrice FROM materials WHERE active=1""");
    }

    @Override
    public List<Map<String, Object>> inventoryForProject(String projectId) {
        return jdbcTemplate.queryForList("""
                SELECT material_id AS materialId,
                       COALESCE(SUM(CASE WHEN to_warehouse_id IN (SELECT id FROM warehouses WHERE project_id=? AND active=1)
                                         THEN quantity ELSE 0 END)
                               -SUM(CASE WHEN from_warehouse_id IN (SELECT id FROM warehouses WHERE project_id=? AND active=1)
                                         THEN quantity ELSE 0 END),0) AS qty
                FROM stock_movements GROUP BY material_id""", projectId, projectId);
    }

    @Override
    public List<Map<String, Object>> cumulativeByBoq(String projectId, String contractId, String boqVersionId) {
        return jdbcTemplate.queryForList("""
                SELECT mri.boq_item_id AS boqItemId,
                       COALESCE(SUM(CASE WHEN mr.status NOT IN ('cancelled','rejected') THEN mri.requested_qty ELSE 0 END),0) AS requestedQty,
                       COALESCE(SUM(mri.ordered_qty),0) AS orderedQty,
                       COALESCE(SUM(mri.received_qty),0) AS receivedQty
                FROM material_request_items mri JOIN material_requests mr ON mr.id=mri.request_id
                WHERE mr.project_id=? AND mri.contract_id=? AND mri.boq_version_id=?
                GROUP BY mri.boq_item_id""", projectId, contractId, boqVersionId);
    }
}