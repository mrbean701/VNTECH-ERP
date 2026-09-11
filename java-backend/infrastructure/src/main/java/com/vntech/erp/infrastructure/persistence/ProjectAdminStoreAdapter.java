package com.vntech.erp.infrastructure.persistence;

import com.vntech.erp.application.port.out.ProjectAdminStore;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Adapter quản trị dự án — native SQL port từ create_project/update_project/set_project_status JS. */
@Component
public class ProjectAdminStoreAdapter implements ProjectAdminStore {

    private final JdbcTemplate jdbcTemplate;

    public ProjectAdminStoreAdapter(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    @Transactional
    public void insertProjectWithWarehouse(String projectId, String warehouseId, String code, String name,
                                           String managerUserId, String startDate, String plannedEndDate,
                                           String contractNo, String contractName,
                                           String warehouseCode, String warehouseName, String scopeId,
                                           String userId, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO projects (id,code,name,status,manager_user_id,start_date,planned_end_date,
                                      contract_no,contract_name,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
                projectId, code, name, "active", managerUserId, startDate, plannedEndDate,
                contractNo, contractName, now, now);
        jdbcTemplate.update("""
                INSERT INTO warehouses (id,code,name,type,project_id,parent_warehouse_id,keeper_user_id,
                                        active,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,1,?,?)""",
                warehouseId, warehouseCode, warehouseName, "site", projectId, "WH-CENTRAL", userId, now, now);
        jdbcTemplate.update("""
                INSERT INTO user_project_scopes (id,user_id,project_id,permission,created_at,updated_at)
                VALUES (?,?,?,?,?,?)""", scopeId, userId, projectId, "admin", now, now);
    }

    @Override
    @Transactional
    public void updateProject(String projectId, String code, String name, String contractNo, String contractName,
                              String startDate, String plannedEndDate, Instant now) {
        jdbcTemplate.update("""
                UPDATE projects SET code=?,name=?,contract_no=?,contract_name=?,start_date=?,planned_end_date=?,updated_at=?
                WHERE id=?""", code, name, contractNo, contractName, startDate, plannedEndDate, now, projectId);
    }

    @Override
    @Transactional
    public void upsertSiteWarehouse(String projectId, String warehouseCode, String warehouseName,
                                    String keeperUserId, Instant now) {
        Map<String, Object> existing = firstSiteWarehouse(projectId);
        if (existing != null) {
            jdbcTemplate.update("UPDATE warehouses SET code=?,name=?,updated_at=? WHERE id=?",
                    warehouseCode, warehouseName, now, existing.get("id"));
        } else {
            jdbcTemplate.update("""
                    INSERT INTO warehouses (id,code,name,type,project_id,parent_warehouse_id,keeper_user_id,
                                            active,created_at,updated_at)
                    VALUES (?,?,?,?,?,?,?,1,?,?)""",
                    "WH_" + java.util.UUID.randomUUID(), warehouseCode, warehouseName, "site",
                    projectId, "WH-CENTRAL", keeperUserId, now, now);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> firstSiteWarehouse(String projectId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT id,code,name FROM warehouses WHERE project_id=? AND type='site' ORDER BY created_at LIMIT 1""",
                projectId);
        return rows.isEmpty() ? null : rows.get(0);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Number> closeCheckCounts(String projectId) {
        Map<String, Number> out = new LinkedHashMap<>();
        out.put("open_mr", count("SELECT COUNT(*) FROM material_requests WHERE project_id=? AND COALESCE(supply_status,'') NOT IN ('completed','completed_with_shortage','cancelled','rejected')", projectId));
        out.put("open_po", count("SELECT COUNT(*) FROM purchase_orders WHERE project_id=? AND status NOT IN ('completed','completed_with_shortage','cancelled','closed')", projectId));
        out.put("open_transfer", count("SELECT COUNT(*) FROM transfer_orders WHERE (source_project_id=? OR destination_project_id=?) AND status NOT IN ('received','cancelled','rejected')", projectId, projectId));
        out.put("open_count", count("SELECT COUNT(*) FROM stock_counts WHERE project_id=? AND status NOT IN ('approved','cancelled')", projectId));
        out.put("open_central_return", count("SELECT COUNT(*) FROM central_returns WHERE source_project_id=? AND status NOT IN ('received','received_with_rejection','cancelled')", projectId));
        out.put("open_reservation", count("SELECT COUNT(*) FROM stock_reservations WHERE project_id=? AND status='active' AND quantity>0.000001", projectId));
        out.put("open_team_subcontract", count("SELECT COUNT(*) FROM team_subcontracts WHERE project_id=? AND status NOT IN ('settled','cancelled')", projectId));
        out.put("site_stock", count("""
                WITH m AS (SELECT material_id,to_warehouse_id AS warehouse_id,quantity AS qty FROM stock_movements WHERE to_warehouse_id IS NOT NULL
                           UNION ALL SELECT material_id,from_warehouse_id AS warehouse_id,-quantity AS qty FROM stock_movements WHERE from_warehouse_id IS NOT NULL)
                SELECT COUNT(*) FROM (SELECT m.material_id,m.warehouse_id,SUM(m.qty) AS balance FROM m
                                      JOIN warehouses w ON w.id=m.warehouse_id
                                      WHERE w.project_id=? AND w.type='site'
                                      GROUP BY m.material_id,m.warehouse_id HAVING ABS(SUM(m.qty))>0.000001) x""", projectId));
        out.put("team_stock", count("""
                WITH m AS (SELECT material_id,to_warehouse_id AS warehouse_id,quantity AS qty FROM stock_movements WHERE to_warehouse_id IS NOT NULL
                           UNION ALL SELECT material_id,from_warehouse_id AS warehouse_id,-quantity AS qty FROM stock_movements WHERE from_warehouse_id IS NOT NULL)
                SELECT COUNT(*) FROM (SELECT m.material_id,m.warehouse_id,SUM(m.qty) AS balance FROM m
                                      JOIN teams t ON t.warehouse_id=m.warehouse_id
                                      WHERE t.project_id=?
                                      GROUP BY m.material_id,m.warehouse_id HAVING ABS(SUM(m.qty))>0.000001) x""", projectId));
        out.put("contract_stock", count("""
                SELECT COUNT(*) FROM (SELECT contract_id,warehouse_id,material_id,SUM(quantity_delta) AS balance
                                      FROM contract_stock_ledger WHERE project_id=?
                                      GROUP BY contract_id,warehouse_id,material_id HAVING ABS(SUM(quantity_delta))>0.000001) x""", projectId));
        out.put("contract_reconciliation", count("""
                SELECT COUNT(*) FROM contract_stock_reconciliations
                WHERE project_id=? AND status<>'balanced'
                  AND checked_at=(SELECT MAX(r2.checked_at) FROM contract_stock_reconciliations r2
                                  WHERE r2.project_id=contract_stock_reconciliations.project_id
                                    AND r2.warehouse_id=contract_stock_reconciliations.warehouse_id
                                    AND r2.material_id=contract_stock_reconciliations.material_id)""", projectId));
        return out;
    }

    private Number count(String sql, Object... args) {
        return jdbcTemplate.queryForObject(sql, Long.class, args);
    }

    @Override
    @Transactional
    public int saveCloseChecks(String projectId, List<Map<String, Object>> checks, String userId, Instant now) {
        int n = 0;
        for (Map<String, Object> c : checks) {
            long cnt = ((Number) c.get("count")).longValue();
            String status = cnt > 0 ? "failed" : "passed";
            String detail = c.get("detail") + ": " + cnt;
            jdbcTemplate.update("""
                    INSERT INTO project_close_checks (id,project_id,check_key,status,detail,checked_by,checked_at,created_at,updated_at)
                    VALUES (?,?,?,?,?,?,?,?,?)
                    ON DUPLICATE KEY UPDATE status=VALUES(status),detail=VALUES(detail),
                                           checked_by=VALUES(checked_by),checked_at=VALUES(checked_at),updated_at=VALUES(updated_at)""",
                    "PCC_" + java.util.UUID.randomUUID(), projectId, c.get("key"), status, detail,
                    userId, now, now, now);
            n++;
        }
        return n;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> latestVerifiedArchive(String projectId, String sinceUpdatedAt) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT id,file_name AS fileName,sha256,generated_at AS generatedAt
                FROM project_archives
                WHERE project_id=? AND status='verified' AND generated_at>=?
                ORDER BY generated_at DESC LIMIT 1""", projectId, sinceUpdatedAt);
        return rows.isEmpty() ? null : rows.get(0);
    }

    @Override
    @Transactional
    public void setWarehouseActive(String projectId, String type, boolean active, Instant now) {
        jdbcTemplate.update("UPDATE warehouses SET active=?,updated_at=? WHERE project_id=? AND type=?",
                active ? 1 : 0, now, projectId, type);
    }

    @Override
    @Transactional
    public void setProjectStatus(String projectId, String status, Instant now) {
        jdbcTemplate.update("UPDATE projects SET status=?,updated_at=? WHERE id=?", status, now, projectId);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> findProjectById(String projectId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("SELECT * FROM projects WHERE id=?", projectId);
        return rows.isEmpty() ? null : rows.get(0);
    }

    @Override
    @Transactional
    public Map<String, Object> purgeProject(String projectId, String archiveId, Instant now) {
        // Port nguyên trạng delete_project của JS — cascade theo thứ tự bảng con trước
        jdbcTemplate.update("UPDATE boq_source_items SET project_boq_item_id=NULL WHERE project_id=?", projectId);
        jdbcTemplate.update("UPDATE project_boq_items SET source_item_id=NULL WHERE project_id=?", projectId);
        jdbcTemplate.update("DELETE FROM task_notifications WHERE work_item_id IN (SELECT id FROM work_items WHERE project_id=?)", projectId);
        jdbcTemplate.update("DELETE FROM work_item_events WHERE work_item_id IN (SELECT id FROM work_items WHERE project_id=?)", projectId);
        jdbcTemplate.update("DELETE FROM work_items WHERE project_id=?", projectId);
        jdbcTemplate.update("DELETE FROM team_payments WHERE project_id=?", projectId);
        jdbcTemplate.update("DELETE FROM team_settlements WHERE project_id=?", projectId);
        jdbcTemplate.update("DELETE FROM team_production_records WHERE project_id=?", projectId);
        jdbcTemplate.update("DELETE FROM team_subcontracts WHERE project_id=?", projectId);
        jdbcTemplate.update("DELETE FROM stock_count_items WHERE stock_count_id IN (SELECT id FROM stock_counts WHERE project_id=?)", projectId);
        jdbcTemplate.update("DELETE FROM stock_counts WHERE project_id=?", projectId);
        jdbcTemplate.update("DELETE FROM material_return_items WHERE return_id IN (SELECT id FROM material_returns WHERE project_id=?)", projectId);
        jdbcTemplate.update("DELETE FROM material_returns WHERE project_id=?", projectId);
        jdbcTemplate.update("DELETE FROM stock_issue_items WHERE issue_id IN (SELECT id FROM stock_issues WHERE project_id=?)", projectId);
        jdbcTemplate.update("DELETE FROM stock_issues WHERE project_id=?", projectId);
        jdbcTemplate.update("DELETE FROM stock_reservations WHERE project_id=?", projectId);
        jdbcTemplate.update("DELETE FROM contract_stock_reconciliations WHERE project_id=?", projectId);
        jdbcTemplate.update("DELETE FROM contract_stock_ledger WHERE project_id=?", projectId);
        jdbcTemplate.update("DELETE FROM procurement_allocations WHERE project_id=?", projectId);
        jdbcTemplate.update("DELETE FROM stock_movements WHERE project_id=?", projectId);
        jdbcTemplate.update("DELETE FROM central_return_items WHERE central_return_id IN (SELECT id FROM central_returns WHERE source_project_id=?)", projectId);
        jdbcTemplate.update("DELETE FROM attachments WHERE entity_type='central_return' AND entity_id IN (SELECT id FROM central_returns WHERE source_project_id=?)", projectId);
        jdbcTemplate.update("DELETE FROM central_returns WHERE source_project_id=?", projectId);
        jdbcTemplate.update("DELETE FROM supply_workflow_steps WHERE request_id IN (SELECT id FROM material_requests WHERE project_id=?)", projectId);
        jdbcTemplate.update("DELETE FROM goods_receipt_items WHERE receipt_id IN (SELECT g.id FROM goods_receipts g JOIN purchase_orders p ON p.id=g.purchase_order_id WHERE p.project_id=?)", projectId);
        jdbcTemplate.update("DELETE FROM attachments WHERE entity_type='goods_receipt' AND entity_id IN (SELECT g.id FROM goods_receipts g JOIN purchase_orders p ON p.id=g.purchase_order_id WHERE p.project_id=?)", projectId);
        jdbcTemplate.update("DELETE FROM goods_receipts WHERE purchase_order_id IN (SELECT id FROM purchase_orders WHERE project_id=?)", projectId);
        jdbcTemplate.update("DELETE FROM purchase_order_items WHERE purchase_order_id IN (SELECT id FROM purchase_orders WHERE project_id=?)", projectId);
        jdbcTemplate.update("DELETE FROM purchase_orders WHERE project_id=?", projectId);
        jdbcTemplate.update("DELETE FROM email_outbox WHERE request_id IN (SELECT id FROM material_requests WHERE project_id=?)", projectId);
        jdbcTemplate.update("DELETE FROM approval_stage_decisions WHERE request_id IN (SELECT id FROM material_requests WHERE project_id=?)", projectId);
        jdbcTemplate.update("DELETE FROM approvals WHERE request_id IN (SELECT id FROM material_requests WHERE project_id=?)", projectId);
        jdbcTemplate.update("DELETE FROM request_comments WHERE request_id IN (SELECT id FROM material_requests WHERE project_id=?)", projectId);
        jdbcTemplate.update("DELETE FROM attachments WHERE entity_type='material_request' AND entity_id IN (SELECT id FROM material_requests WHERE project_id=?)", projectId);
        jdbcTemplate.update("DELETE FROM material_request_items WHERE request_id IN (SELECT id FROM material_requests WHERE project_id=?)", projectId);
        jdbcTemplate.update("DELETE FROM material_requests WHERE project_id=?", projectId);
        jdbcTemplate.update("DELETE FROM boq_price_import_items WHERE batch_id IN (SELECT id FROM boq_price_import_batches WHERE project_id=?)", projectId);
        jdbcTemplate.update("DELETE FROM boq_price_import_batches WHERE project_id=?", projectId);
        jdbcTemplate.update("DELETE FROM boq_mapping_candidates WHERE run_id IN (SELECT id FROM boq_mapping_runs WHERE project_id=?)", projectId);
        jdbcTemplate.update("DELETE FROM boq_mapping_audit WHERE run_id IN (SELECT id FROM boq_mapping_runs WHERE project_id=?) OR source_item_id IN (SELECT id FROM boq_source_items WHERE project_id=?)", projectId, projectId);
        jdbcTemplate.update("DELETE FROM boq_mapping_runs WHERE project_id=?", projectId);
        jdbcTemplate.update("DELETE FROM boq_material_components WHERE source_item_id IN (SELECT id FROM boq_source_items WHERE project_id=?)", projectId);
        jdbcTemplate.update("DELETE FROM boq_change_history WHERE project_id=?", projectId);
        jdbcTemplate.update("DELETE FROM project_boq_items WHERE project_id=?", projectId);
        jdbcTemplate.update("DELETE FROM boq_source_items WHERE project_id=?", projectId);
        jdbcTemplate.update("DELETE FROM boq_import_batches WHERE project_id=?", projectId);
        jdbcTemplate.update("DELETE FROM boq_versions WHERE project_id=?", projectId);
        jdbcTemplate.update("DELETE FROM project_contracts WHERE project_id=? AND id NOT IN (SELECT source_contract_id FROM contract_ownership_transfers UNION SELECT destination_contract_id FROM contract_ownership_transfers)", projectId);
        jdbcTemplate.update("DELETE FROM contract_payments WHERE project_id=?", projectId);
        jdbcTemplate.update("DELETE FROM capital_recovery_records WHERE project_id=?", projectId);
        jdbcTemplate.update("DELETE FROM production_reports WHERE project_id=?", projectId);
        jdbcTemplate.update("DELETE FROM material_mar_approvals WHERE project_id=?", projectId);
        jdbcTemplate.update("DELETE FROM project_close_checks WHERE project_id=?", projectId);
        jdbcTemplate.update("DELETE FROM approval_email_recipients WHERE project_id=?", projectId);
        jdbcTemplate.update("DELETE FROM document_sequences WHERE project_id=?", projectId);
        jdbcTemplate.update("DELETE FROM user_warehouse_scopes WHERE warehouse_id IN (SELECT id FROM warehouses WHERE project_id=?)", projectId);
        jdbcTemplate.update("DELETE FROM warehouse_locations WHERE warehouse_id IN (SELECT id FROM warehouses WHERE project_id=?)", projectId);
        jdbcTemplate.update("DELETE FROM teams WHERE project_id=?", projectId);
        jdbcTemplate.update("UPDATE warehouses SET active=0,updated_at=? WHERE project_id=?", now, projectId);
        jdbcTemplate.update("DELETE FROM user_project_scopes WHERE project_id=?", projectId);
        jdbcTemplate.update("UPDATE organization_units SET active=0,archived_at=?,project_id=NULL,updated_at=? WHERE project_id=?", now, now, projectId);
        jdbcTemplate.update("UPDATE projects SET status='purged',contract_no=NULL,contract_name=NULL,start_date=NULL,planned_end_date=NULL,updated_at=? WHERE id=?", now, projectId);
        jdbcTemplate.update("UPDATE project_archives SET status='purged',purged_at=? WHERE id=?", now, archiveId);
        return Map.of("purged", true);
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> projectAttachmentStorageKeys(String projectId) {
        return jdbcTemplate.queryForList("""
                SELECT a.storage_key FROM attachments a
                WHERE (a.entity_type='material_request' AND a.entity_id IN (SELECT id FROM material_requests WHERE project_id=?))
                   OR (a.entity_type='goods_receipt' AND a.entity_id IN (SELECT g.id FROM goods_receipts g JOIN purchase_orders p ON p.id=g.purchase_order_id WHERE p.project_id=?))
                   OR (a.entity_type='central_return' AND a.entity_id IN (SELECT id FROM central_returns WHERE source_project_id=?))""",
                String.class, projectId, projectId, projectId);
    }

    // ---------- project_contracts ----------
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> findContract(String contractId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("SELECT * FROM project_contracts WHERE id=?", contractId);
        return rows.isEmpty() ? null : rows.get(0);
    }

    @Override
    public boolean contractHasPrimary(String projectId) {
        Long n = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM project_contracts WHERE project_id=? AND is_primary=1", Long.class, projectId);
        return n != null && n > 0;
    }

    @Override
    public Map<String, Object> findContractParent(String parentContractId, String projectId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT id FROM project_contracts WHERE id=? AND project_id=?", parentContractId, projectId);
        return rows.isEmpty() ? null : rows.get(0);
    }

    @Override
    @Transactional
    public void insertContract(String contractId, String projectId, String contractNo, String contractName,
                               String contractType, String parentContractId, boolean isPrimary,
                               String signedAt, String effectiveFrom, String effectiveTo, String note,
                               String createdBy, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO project_contracts (id,project_id,contract_no,contract_name,contract_type,
                                               parent_contract_id,status,is_primary,signed_at,effective_from,
                                               effective_to,note,created_by,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                contractId, projectId, contractNo, contractName, contractType, parentContractId, "active",
                isPrimary ? 1 : 0, signedAt, effectiveFrom, effectiveTo, note, createdBy, now, now);
    }

    @Override
    @Transactional
    public void updateContract(String contractId, String contractNo, String contractName, String contractType,
                               String parentContractId, String signedAt, String effectiveFrom, String effectiveTo,
                               String note, Instant now) {
        jdbcTemplate.update("""
                UPDATE project_contracts SET contract_no=?,contract_name=?,contract_type=?,parent_contract_id=?,
                                              signed_at=?,effective_from=?,effective_to=?,note=?,updated_at=?
                WHERE id=?""",
                contractNo, contractName, contractType, parentContractId, signedAt, effectiveFrom,
                effectiveTo, note, now, contractId);
    }

    @Override
    @Transactional
    public void setContractStatus(String contractId, String status, Instant now) {
        jdbcTemplate.update("UPDATE project_contracts SET status=?,updated_at=? WHERE id=?", status, now, contractId);
    }

    @Override
    public double contractStockResidual(String contractId) {
        Double d = jdbcTemplate.queryForObject("""
                SELECT COALESCE(SUM(ABS(balance)),0) AS residual FROM (
                    SELECT warehouse_id,material_id,SUM(quantity_delta) AS balance
                    FROM contract_stock_ledger WHERE contract_id=?
                    GROUP BY warehouse_id,material_id HAVING ABS(SUM(quantity_delta))>0.0000001) x""",
                Double.class, contractId);
        return d == null ? 0 : d;
    }

    @Override
    public long contractUsageCount(String contractId) {
        Long n = jdbcTemplate.queryForObject("""
                SELECT (SELECT COUNT(*) FROM project_contracts WHERE parent_contract_id=?)
                     + (SELECT COUNT(*) FROM boq_versions WHERE contract_id=?)
                     + (SELECT COUNT(*) FROM material_request_items WHERE contract_id=?)
                     + (SELECT COUNT(*) FROM purchase_order_items WHERE contract_id=?)
                     + (SELECT COUNT(*) FROM goods_receipt_items WHERE contract_id=?)
                     + (SELECT COUNT(*) FROM contract_stock_ledger WHERE contract_id=? OR counterparty_contract_id=?)""",
                Long.class, contractId, contractId, contractId, contractId, contractId, contractId, contractId);
        return n == null ? 0 : n;
    }

    @Override
    public Map<String, Object> nextPrimaryCandidate(String projectId, String excludeContractId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT id FROM project_contracts
                WHERE project_id=? AND id<>?
                ORDER BY status='active' DESC,created_at,id LIMIT 1""", projectId, excludeContractId);
        return rows.isEmpty() ? null : rows.get(0);
    }

    @Override
    @Transactional
    public void promotePrimaryContract(String contractId, Instant now) {
        jdbcTemplate.update("UPDATE project_contracts SET is_primary=1,updated_at=? WHERE id=?", now, contractId);
    }

    @Override
    @Transactional
    public void deleteContract(String contractId) {
        jdbcTemplate.update("DELETE FROM project_contracts WHERE id=?", contractId);
    }
}