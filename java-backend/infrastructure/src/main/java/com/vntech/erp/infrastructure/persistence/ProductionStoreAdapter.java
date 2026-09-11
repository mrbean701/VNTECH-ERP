package com.vntech.erp.infrastructure.persistence;

import com.vntech.erp.application.port.out.ProductionStore;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/** Adapter Sản lượng & Thu hồi vốn. */
@Component
public class ProductionStoreAdapter implements ProductionStore {

    private final JdbcTemplate jdbcTemplate;

    public ProductionStoreAdapter(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public Optional<Map<String, Object>> findProductionReport(String id) {
        return first("SELECT * FROM production_reports WHERE id=?", id);
    }

    @Override
    public boolean productionReportPeriodDuplicate(String projectId, String reportPeriod, String excludeId) {
        Long n = jdbcTemplate.queryForObject("""
                SELECT COUNT(*) FROM production_reports
                WHERE project_id=? AND report_period=? AND id<>COALESCE(?, '')""",
                Long.class, projectId, reportPeriod, excludeId == null ? "" : excludeId);
        return n != null && n > 0;
    }

    @Override
    @Transactional
    public void insertProductionReport(String id, String projectId, String reportPeriod, String referenceNo,
                                       String description, double plannedValue, double actualValue,
                                       String submittedBy, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO production_reports (id,project_id,report_period,reference_no,description,
                                                planned_value,actual_value,approved_value,status,submitted_by,
                                                approved_by,approved_at,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,0,'submitted',?,NULL,NULL,?,?)""",
                id, projectId, reportPeriod, referenceNo, description, plannedValue, actualValue,
                submittedBy, now, now);
    }

    @Override
    @Transactional
    public void updateProductionReport(String id, String reportPeriod, String referenceNo, String description,
                                       double plannedValue, double actualValue, String submittedBy,
                                       boolean approvedKeep, Instant now) {
        jdbcTemplate.update("""
                UPDATE production_reports SET report_period=?,reference_no=?,description=?,
                       planned_value=?,actual_value=?,
                       approved_value=CASE WHEN status='approved' THEN approved_value ELSE 0 END,
                       status=CASE WHEN status='approved' THEN status ELSE 'submitted' END,
                       submitted_by=?,updated_at=? WHERE id=?""",
                reportPeriod, referenceNo, description, plannedValue, actualValue, submittedBy, now, id);
    }

    @Override
    @Transactional
    public void approveProductionReport(String id, double approvedValue, String approvedBy, Instant now) {
        jdbcTemplate.update("""
                UPDATE production_reports SET approved_value=?,status='approved',approved_by=?,approved_at=?,updated_at=?
                WHERE id=?""", approvedValue, approvedBy, now, now, id);
    }

    @Override
    public Optional<Map<String, Object>> findCapitalRecovery(String id) {
        return first("SELECT * FROM capital_recovery_records WHERE id=?", id);
    }

    @Override
    public Optional<Map<String, Object>> findApprovedProductionReport(String id, String projectId) {
        return first("""
                SELECT id,project_id AS projectId,status,approved_value AS approvedValue
                FROM production_reports WHERE id=? AND project_id=? AND status='approved'""", id, projectId);
    }

    @Override
    @Transactional
    public void insertCapitalRecovery(String id, String projectId, String periodKey, String referenceNo,
                                      String productionReportId, double submittedValue, double approvedValue,
                                      String invoiceNo, double invoiceValue, String dueDate, String status, String note,
                                      String createdBy, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO capital_recovery_records (id,project_id,period_key,reference_no,production_report_id,
                                                      submitted_value,approved_value,invoice_no,invoice_value,due_date,
                                                      status,note,created_by,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                id, projectId, periodKey, referenceNo, productionReportId, submittedValue, approvedValue,
                invoiceNo, invoiceValue, dueDate, status, note, createdBy, now, now);
    }

    @Override
    @Transactional
    public void updateCapitalRecovery(String id, String periodKey, String referenceNo, String productionReportId,
                                      double submittedValue, double approvedValue, String invoiceNo, double invoiceValue,
                                      String dueDate, String status, String note, Instant now) {
        jdbcTemplate.update("""
                UPDATE capital_recovery_records SET period_key=?,reference_no=?,production_report_id=?,
                       submitted_value=?,approved_value=?,invoice_no=?,invoice_value=?,due_date=?,
                       status=?,note=?,updated_at=? WHERE id=?""",
                periodKey, referenceNo, productionReportId, submittedValue, approvedValue, invoiceNo,
                invoiceValue, dueDate, status, note, now, id);
    }

    @Override
    public long countRecoveryPayments(String recoveryId) {
        Long n = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM contract_payments WHERE recovery_record_id=?", Long.class, recoveryId);
        return n == null ? 0 : n;
    }

    @Override
    @Transactional
    public void deleteCapitalRecovery(String id) {
        jdbcTemplate.update("DELETE FROM capital_recovery_records WHERE id=?", id);
    }

    @Override
    public Optional<Map<String, Object>> findContractPayment(String id) {
        return first("SELECT * FROM contract_payments WHERE id=?", id);
    }

    @Override
    public Optional<Map<String, Object>> findRecoveryForPayment(String recoveryRecordId, String projectId) {
        return first("""
                SELECT id,project_id AS projectId FROM capital_recovery_records WHERE id=? AND project_id=?""",
                recoveryRecordId, projectId);
    }

    @Override
    @Transactional
    public void insertContractPayment(String id, String projectId, String recoveryRecordId, String paymentDate,
                                      String referenceNo, String description, double amount, String note,
                                      String createdBy, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO contract_payments (id,project_id,recovery_record_id,payment_date,reference_no,
                                               description,amount,note,created_by,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
                id, projectId, recoveryRecordId, paymentDate, referenceNo, description, amount, note,
                createdBy, now, now);
    }

    @Override
    @Transactional
    public void updateContractPayment(String id, String recoveryRecordId, String paymentDate, String referenceNo,
                                      String description, double amount, String note, Instant now) {
        jdbcTemplate.update("""
                UPDATE contract_payments SET recovery_record_id=?,payment_date=?,reference_no=?,description=?,
                       amount=?,note=?,updated_at=? WHERE id=?""",
                recoveryRecordId, paymentDate, referenceNo, description, amount, note, now, id);
    }

    @Override
    @Transactional
    public void deleteContractPayment(String id) {
        jdbcTemplate.update("DELETE FROM contract_payments WHERE id=?", id);
    }

    // ---------- import payments / team subcontract ----------
    @Override
    @Transactional
    public void insertPaymentBulk(String id, String projectId, String paymentDate, String referenceNo,
                                  String description, double amount, String note, String createdBy, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO contract_payments (id,project_id,payment_date,reference_no,description,amount,note,
                                               created_by,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,?)""",
                id, projectId, paymentDate, referenceNo, description, amount, note, createdBy, now, now);
    }

    @Override
    public Optional<Map<String, Object>> findTeam(String teamId, String projectId) {
        return first("SELECT id FROM teams WHERE id=? AND project_id=? AND active=1", teamId, projectId);
    }

    @Override
    public Optional<Map<String, Object>> findSubcontractNoDuplicate(String projectId, String contractNo) {
        return first("""
                SELECT id FROM team_subcontracts WHERE project_id=? AND upper(contract_no)=upper(?)""",
                projectId, contractNo);
    }

    @Override
    @Transactional
    public void insertTeamSubcontract(String id, String projectId, String teamId, String contractNo,
                                      String contractName, String scopeText, double contractValue,
                                      String startDate, String endDate, String note, String createdBy, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO team_subcontracts (id,project_id,team_id,contract_no,contract_name,scope_text,
                                               contract_value,start_date,end_date,status,signed_at,note,
                                               created_by,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,'active',?,?,?,?,?)""",
                id, projectId, teamId, contractNo, contractName, scopeText, contractValue,
                startDate, endDate, now, note, createdBy, now, now);
    }

    @Override
    public Optional<Map<String, Object>> findSubcontract(String id) {
        return first("""
                SELECT id,project_id AS projectId,team_id AS teamId,contract_no AS contractNo,
                       contract_value AS contractValue,status FROM team_subcontracts WHERE id=?""", id);
    }

    @Override
    public double sumApprovedProduction(String subcontractId, String excludeId) {
        Double d;
        if (excludeId == null || excludeId.isBlank()) {
            d = jdbcTemplate.queryForObject("""
                    SELECT COALESCE(SUM(approved_value),0) FROM team_production_records
                    WHERE subcontract_id=? AND status='approved'""", Double.class, subcontractId);
        } else {
            d = jdbcTemplate.queryForObject("""
                    SELECT COALESCE(SUM(approved_value),0) FROM team_production_records
                    WHERE subcontract_id=? AND status='approved' AND id<>?""", Double.class, subcontractId, excludeId);
        }
        return d == null ? 0 : d;
    }

    @Override
    public Optional<Map<String, Object>> findTeamProduction(String id) {
        return first("SELECT * FROM team_production_records WHERE id=?", id);
    }

    @Override
    @Transactional
    public void insertTeamProduction(String id, String projectId, String teamId, String subcontractId,
                                     String periodKey, String referenceNo, String description,
                                     double submittedValue, double approvedValue, String submittedBy, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO team_production_records (id,project_id,team_id,subcontract_id,period_key,
                                                     reference_no,description,submitted_value,approved_value,status,
                                                     submitted_by,approved_by,approved_at,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,'submitted',?,NULL,NULL,?,?)""",
                id, projectId, teamId, subcontractId, periodKey, referenceNo, description,
                submittedValue, approvedValue, submittedBy, now, now);
    }

    @Override
    @Transactional
    public void approveTeamProduction(String id, String approvedBy, Instant now) {
        jdbcTemplate.update("""
                UPDATE team_production_records SET status='approved',approved_by=?,approved_at=?,updated_at=?
                WHERE id=?""", approvedBy, now, now, id);
    }

    @Override
    public double sumTeamPayments(String subcontractId) {
        Double d = jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(amount),0) FROM team_payments WHERE subcontract_id=?", Double.class, subcontractId);
        return d == null ? 0 : d;
    }

    @Override
    @Transactional
    public void insertTeamPayment(String id, String projectId, String teamId, String subcontractId,
                                  String productionRecordId, String paymentDate, String paymentType,
                                  String referenceNo, String description, double amount, String note,
                                  String createdBy, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO team_payments (id,project_id,team_id,subcontract_id,production_record_id,payment_date,
                                           payment_type,reference_no,description,amount,note,created_by,created_at,
                                           updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                id, projectId, teamId, subcontractId, productionRecordId, paymentDate, paymentType,
                referenceNo, description, amount, note, createdBy, now, now);
    }

    @Override
    public long teamHeldStockLines(String teamId) {
        Long n = jdbcTemplate.queryForObject("""
                WITH mv AS (
                    SELECT material_id,to_warehouse_id AS warehouse_id,quantity AS qty FROM stock_movements WHERE to_warehouse_id IS NOT NULL
                    UNION ALL
                    SELECT material_id,from_warehouse_id,-quantity FROM stock_movements WHERE from_warehouse_id IS NOT NULL)
                SELECT COUNT(*) FROM (
                    SELECT material_id,SUM(qty) AS balance FROM mv
                    WHERE warehouse_id=(SELECT warehouse_id FROM teams WHERE id=?)
                    GROUP BY material_id HAVING ABS(SUM(qty))>0.000001) x""", Long.class, teamId);
        return n == null ? 0 : n;
    }

    @Override
    @Transactional
    public void insertTeamSettlement(String id, String projectId, String teamId, String subcontractId,
                                     String settlementNo, double approvedProductionValue, double adjustmentValue,
                                     double finalValue, double paidValue, double remainingValue, String note,
                                     String createdBy, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO team_settlements (id,project_id,team_id,subcontract_id,settlement_no,
                                              approved_production_value,adjustment_value,final_value,paid_value,
                                              remaining_value,status,settled_at,note,created_by,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,'closed',?,?,?,?,?)""",
                id, projectId, teamId, subcontractId, settlementNo, approvedProductionValue, adjustmentValue,
                finalValue, paidValue, remainingValue, now, note, createdBy, now, now);
    }

    @Override
    @Transactional
    public void settleSubcontract(String subcontractId, String settlementId, Instant now) {
        jdbcTemplate.update("""
                UPDATE team_subcontracts SET status='settled',settlement_id=?,settled_at=?,updated_at=?
                WHERE id=?""", settlementId, now, now, subcontractId);
    }

    // ---------- construction daily logs ----------
    @Override
    public Optional<Map<String, Object>> findDailyLog(String id) {
        return first("SELECT * FROM construction_daily_logs WHERE id=?", id);
    }

    @Override
    public String dailyLogSequenceNo(String projectId, String yearPrefix) {  // unused; keep interface-minimal
        Long n = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)+1 FROM construction_daily_logs WHERE project_id=? AND substr(work_date,1,4)=?""",
                Long.class, projectId, yearPrefix);
        return n == null ? "1" : String.valueOf(n);
    }

    @Override
    @Transactional
    public void insertDailyLog(String id, String logNo, String projectId, String warehouseId, String workDate,
                               String shift, String weather, String workContent, int laborCount,
                               String equipmentNote, String status, String submittedBy, String createdBy,
                               Instant now) {
        jdbcTemplate.update("""
                INSERT INTO construction_daily_logs (id,log_no,project_id,warehouse_id,work_date,shift,weather,
                                                     work_content,labor_count,equipment_note,status,submitted_by,
                                                     created_by,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                id, logNo, projectId, warehouseId, workDate, shift, weather, workContent, laborCount,
                equipmentNote, status, submittedBy, createdBy, now, now);
    }

    @Override
    @Transactional
    public void updateDailyLog(String id, String workDate, String shift, String weather, String workContent,
                               int laborCount, String equipmentNote, String note, String warehouseId, String status,
                               String submittedBy, Instant now) {
        jdbcTemplate.update("""
                UPDATE construction_daily_logs SET work_date=?,shift=?,weather=?,work_content=?,labor_count=?,
                       equipment_note=?,note=?,warehouse_id=?,status=?,
                       submitted_by=CASE WHEN ?='submitted' THEN ? ELSE submitted_by END,updated_at=?
                WHERE id=?""",
                workDate, shift, weather, workContent, laborCount, equipmentNote, note, warehouseId, status,
                status, submittedBy, now, id);
    }

    @Override
    @Transactional
    public void replaceDailyLogItems(String logId, List<Map<String, Object>> items, Instant now) {
        jdbcTemplate.update("DELETE FROM construction_daily_log_items WHERE log_id=?", logId);
        for (Map<String, Object> row : items) {
            String itemName = String.valueOf(row.get("itemName")).trim();
            if (itemName.isEmpty()) continue;
            jdbcTemplate.update("""
                    INSERT INTO construction_daily_log_items (id,log_id,boq_item_id,item_name,location,
                                                              planned_qty,completed_qty,unit,labor_hours,
                                                              photo_attachment_id,note,created_at,updated_at)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                    "CDLI_" + java.util.UUID.randomUUID(), logId, row.get("boqItemId"), itemName,
                    row.get("location"), row.get("plannedQty"), row.get("completedQty"), row.get("unit"),
                    row.get("laborHours"), row.get("photoAttachmentId"), row.get("note"), now, now);
        }
    }

    @Override
    @Transactional
    public void approveDailyLog(String id, String approvedBy, Instant now) {
        jdbcTemplate.update("""
                UPDATE construction_daily_logs SET status='approved',approved_by=?,approved_at=?,updated_at=?
                WHERE id=?""", approvedBy, now, now, id);
    }

    @Override
    @Transactional
    public void deleteDailyLog(String id) {
        jdbcTemplate.update("DELETE FROM construction_daily_log_items WHERE log_id=?", id);
        jdbcTemplate.update("DELETE FROM construction_daily_logs WHERE id=?", id);
    }

    @Override
    public Optional<Map<String, Object>> findProjectCode(String projectId) {
        return first("SELECT code FROM projects WHERE id=?", projectId);
    }

    private Optional<Map<String, Object>> first(String sql, Object... args) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, args);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }
}