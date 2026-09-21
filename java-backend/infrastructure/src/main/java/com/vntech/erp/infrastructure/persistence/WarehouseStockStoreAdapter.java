package com.vntech.erp.infrastructure.persistence;

import com.vntech.erp.application.port.out.WarehouseStockStore;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/** Adapter kho — native SQL port từ issue_stock/stock movements JS. */
@Component
public class WarehouseStockStoreAdapter implements WarehouseStockStore {

    private final JdbcTemplate jdbcTemplate;

    public WarehouseStockStoreAdapter(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public Optional<Map<String, Object>> findTeam(String teamId, String projectId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT t.id,t.warehouse_id AS warehouseId,p.code AS projectCode
                FROM teams t JOIN projects p ON p.id=t.project_id
                WHERE t.id=? AND t.project_id=?""", teamId, projectId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    public Optional<Map<String, Object>> findRequestForIssue(String requestId, String projectId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT mr.id,mr.status,mr.contract_id AS contractId,mr.boq_version_id AS boqVersionId,
                       p.code AS projectCode
                FROM material_requests mr
                JOIN projects p ON p.id=mr.project_id
                WHERE mr.id=? AND mr.project_id=?""", requestId, projectId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    public Optional<Map<String, Object>> findActiveWarehouse(String warehouseId, String projectId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT id FROM warehouses WHERE id=? AND project_id=? AND active=1", warehouseId, projectId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    public double stockBalance(String warehouseId, String materialId) {
        Double d = jdbcTemplate.queryForObject("""
                SELECT COALESCE(SUM(CASE WHEN to_warehouse_id=? THEN quantity ELSE 0 END)
                              -SUM(CASE WHEN from_warehouse_id=? THEN quantity ELSE 0 END),0) AS balance
                FROM stock_movements WHERE material_id=?""", Double.class, warehouseId, warehouseId, materialId);
        return d == null ? 0 : d;
    }

    @Override
    public double reservedBalance(String warehouseId, String materialId, String excludeRequestId) {
        Double d;
        if (excludeRequestId != null && !excludeRequestId.isBlank()) {
            d = jdbcTemplate.queryForObject("""
                    SELECT COALESCE(SUM(quantity),0) AS qty FROM stock_reservations
                    WHERE warehouse_id=? AND material_id=? AND status='active' AND COALESCE(request_id,'')<>?""",
                    Double.class, warehouseId, materialId, excludeRequestId);
        } else {
            d = jdbcTemplate.queryForObject("""
                    SELECT COALESCE(SUM(quantity),0) AS qty FROM stock_reservations
                    WHERE warehouse_id=? AND material_id=? AND status='active'""",
                    Double.class, warehouseId, materialId);
        }
        return d == null ? 0 : d;
    }

    @Override
    public double contractBalance(String projectId, String contractId, String warehouseId, String materialId) {
        Double d = jdbcTemplate.queryForObject("""
                SELECT COALESCE(SUM(quantity_delta),0) AS balance FROM contract_stock_ledger
                WHERE project_id=? AND contract_id=? AND warehouse_id=? AND material_id=?""",
                Double.class, projectId, contractId, warehouseId, materialId);
        return d == null ? 0 : d;
    }

    @Override
    public Optional<Map<String, Object>> findRequestLine(String requestItemId, String requestId, String materialId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT requested_qty AS requestedQty,issued_qty AS issuedQty,installed_qty AS installedQty,
                       contract_id AS contractId,boq_version_id AS boqVersionId
                FROM material_request_items WHERE id=? AND request_id=? AND material_id=?""",
                requestItemId, requestId, materialId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    @Transactional
    public long nextSequenceNo(String key, String documentType, String projectId, int year, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO document_sequences (id,document_type,project_id,`year`,last_number,updated_at)
                VALUES (?,?,?,?,1,?)
                ON DUPLICATE KEY UPDATE last_number=last_number+1,updated_at=VALUES(updated_at)""",
                key, documentType, projectId, year, now);
        Long n = jdbcTemplate.queryForObject("SELECT last_number FROM document_sequences WHERE id=?",
                Long.class, key);
        return n == null ? 1 : n;
    }

    @Override
    @Transactional
    public void insertStockIssue(Map<String, Object> header, List<Map<String, Object>> items, Instant now) {
        String issueId = (String) header.get("id");
        // WF-XUATKHO-01 — BƯỚC ① (TASK-132, 21/09/2026): phiếu xuất MỚI KHÔNG còn sinh ra ở trạng thái
        // `posted` (đã xuất kho) như bản cũ. Trạng thái ban đầu là `pending_cht` — CHỜ CHỈ HUY TRƯỞNG
        // DUYỆT; việc duyệt do action `approve_stock_issue` thực hiện (SystemController → use-case).
        // TÊN TRẠNG THÁI: chọn `pending_cht` vì (a) hệ thống CHƯA có sẵn trạng thái chờ-duyệt nào cho
        // `stock_issues` (10/10 phiếu cũ đều `posted`; không có `draft`/`pending*`), (b) khớp tên vai
        // trò nghiệp vụ trong dữ liệu (`workflow_steps` WFS-XK-1 `canApprove` → `cha.ht`; nhãn
        // `approvals.department` đang dùng «CHT xác nhận nhu cầu»).
        // ⚠ TƯƠNG THÍCH NGƯỢC: 10 phiếu CŨ giữ nguyên `posted` — KHÔNG có câu UPDATE nào chạm dữ liệu cũ.
        jdbcTemplate.update("""
                INSERT INTO stock_issues (id,issue_no,project_id,from_warehouse_id,team_id,request_id,
                                          issued_by,received_by_name,approved_by,issued_at,status,signed_at,
                                          note,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                issueId, header.get("issueNo"), header.get("projectId"), header.get("fromWarehouseId"),
                header.get("teamId"), header.get("requestId"), header.get("issuedBy"),
                header.get("receivedByName"), header.get("approvedBy"), header.get("issuedAt"),
                "pending_cht", header.get("signedAt"), header.get("note"), now, now);
        for (Map<String, Object> item : items) {
            String issueItemId = (String) item.get("id");
            jdbcTemplate.update("""
                    INSERT INTO stock_issue_items (id,issue_id,material_id,request_item_id,contract_id,quantity,
                                                   installed_qty,work_package_code,installation_area,created_at,updated_at)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
                    issueItemId, issueId, item.get("materialId"), item.get("requestItemId"),
                    item.get("contractId"), item.get("quantity"), 0, item.get("workPackageCode"),
                    item.get("installationArea"), now, now);
            // stock_movements: xuất kho vật lý — JS ghi movement_type 'SMI' và chuyển sang KHO TỔ ĐỘI
            // (to_warehouse_id = team.warehouseId) để tồn tổ đội có hàng cho hoàn trả/kiểm kê.
            // Bản port trước đây để to_warehouse_id/ destination_contract_id NULL và type 'ISSUE'
            // ⇒ tồn tổ đội luôn 0, return_stock báo "vượt tồn vật lý tổ đội".
            jdbcTemplate.update("""
                    INSERT INTO stock_movements (id,project_id,contract_id,destination_contract_id,material_id,
                                                 from_warehouse_id,to_warehouse_id,movement_type,quantity,unit_cost,
                                                 occurred_at,reference_type,reference_id,posted_by,reversal_of_id,
                                                 created_at,updated_at)
                    VALUES (?,?,?,?,?,?,?,?,?,0,?,?,?,?,NULL,?,?)""",
                    "MOV_" + java.util.UUID.randomUUID(), header.get("projectId"), item.get("contractId"),
                    item.get("contractId"), item.get("materialId"), header.get("fromWarehouseId"),
                    header.get("toWarehouseId"), "SMI", item.get("quantity"),
                    now, "stock_issue", issueId, header.get("issuedBy"), now, now);
            // contract ledger: giảm tồn kế toán ở kho NGUỒN (JS giảm tại fromWarehouseId)
            jdbcTemplate.update("""
                    INSERT INTO contract_stock_ledger (id,project_id,contract_id,warehouse_id,material_id,
                                                       movement_type,quantity_delta,occurred_at,reference_type,
                                                       reference_id,reference_item_id,counterparty_contract_id,
                                                       actor_user_id,note,created_at)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,NULL,?,?,?)""",
                    "CSL_" + java.util.UUID.randomUUID(), header.get("projectId"), item.get("contractId"),
                    header.get("fromWarehouseId"), item.get("materialId"), "SMI",
                    -((Number) item.get("quantity")).doubleValue(),
                    now, "stock_issue", issueId, issueItemId, header.get("issuedBy"),
                    "Xuất phục vụ lắp đặt", now);
            // Tồn kế toán tại KHO TỔ ĐỘI tăng tương ứng (JS ghi thêm dòng ledger cho kho nhận).
            jdbcTemplate.update("""
                    INSERT INTO contract_stock_ledger (id,project_id,contract_id,warehouse_id,material_id,
                                                       movement_type,quantity_delta,occurred_at,reference_type,
                                                       reference_id,reference_item_id,counterparty_contract_id,
                                                       actor_user_id,note,created_at)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,NULL,?,?,?)""",
                    "CSL_" + java.util.UUID.randomUUID(), header.get("projectId"), item.get("contractId"),
                    header.get("toWarehouseId"), item.get("materialId"), "SMI",
                    ((Number) item.get("quantity")).doubleValue(),
                    now, "stock_issue", issueId, issueItemId, header.get("issuedBy"),
                    "Nhận tại kho tổ đội", now);
        }
    }

    @Override
    @Transactional
    public void updateIssueItemInstalled(String issueItemId, double installedQty, Instant now) {
        // SỬA LỖI (TASK-040 nhóm 4): bản cũ dùng `installed_qty=?` — GHI ĐÈ. JS
        // (scripts/system-route.mjs:1520 action confirm_installation) dùng `installed_qty=installed_qty+?`
        // — CỘNG DỒN. Xác nhận lắp nhiều lần: JS cho 3+4=7, bản cũ cho 4 ⇒ SAI SỐ LIỆU.
        // Đây là lỗi NGỮ NGHĨA: cột có thật nên cổng lược đồ KHÔNG THỂ bắt được.
        jdbcTemplate.update("UPDATE stock_issue_items SET installed_qty=installed_qty+?,updated_at=? WHERE id=?",
                installedQty, now, issueItemId);
    }

    @Override
    @Transactional
    public void updateRequestItemIssued(String requestItemId, double qty, double installedQty, Instant now) {
        jdbcTemplate.update("""
                UPDATE material_request_items SET issued_qty=issued_qty+?,
                       installed_qty=installed_qty+?,
                       line_status=CASE WHEN issued_qty+?+received_qty>=requested_qty THEN 'issued' ELSE line_status END,
                       updated_at=? WHERE id=?""", qty, installedQty, qty, now, requestItemId);
    }

    @Override
    @Transactional
    public void releaseReservationsForRequest(String requestId, String materialId, String warehouseId, Instant now) {
        jdbcTemplate.update("""
                UPDATE stock_reservations SET status='released',released_at=?,updated_at=?
                WHERE request_id=? AND material_id=? AND warehouse_id=? AND status='active'""",
                now, now, requestId, materialId, warehouseId);
    }

    @Override
    @Transactional
    public void insertSupplyWorkflowStepIssued(String requestId, String issueId, Instant now, long dueHours) {
        jdbcTemplate.update("""
                INSERT INTO supply_workflow_steps (id,request_id,purchase_order_id,receipt_id,step,status,
                                                   queued_at,due_at,completed_at,completed_by,comment,created_at,updated_at)
                VALUES (?,?,NULL,NULL,'issue','completed',?,?,?,?,?,?,?)
                ON DUPLICATE KEY UPDATE status='completed',completed_at=?,completed_by=?,updated_at=?""",
                "SWF_" + java.util.UUID.randomUUID(), requestId, now,
                now.plusSeconds(dueHours * 3600), now, null, "Cấp phát vật tư đã hoàn tất", now, now,
                now, null, now);
    }

    @Override
    public String postingStatusOf(String issueId) {
        return jdbcTemplate.queryForObject("SELECT status FROM stock_issues WHERE id=?", String.class, issueId);
    }

    // ================= WF-XUATKHO-01 BƯỚC ② (TASK-132) — CHT DUYỆT PHIẾU XUẤT =================

    @Override
    public Optional<Map<String, Object>> findStockIssue(String issueId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT id,issue_no AS issueNo,project_id AS projectId,team_id AS teamId,
                       request_id AS requestId,status,approved_by AS approvedBy,issued_by AS issuedBy
                FROM stock_issues WHERE id=?""", issueId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    @Transactional
    public boolean approveStockIssue(String issueId, String userId, String department, String comment, Instant now) {
        // Điều kiện `status='pending_cht'` trong chính câu UPDATE là CHỐT CHẶN (chống đua + chống
        // «duyệt lần 2» + chống duyệt phiếu CŨ đang `posted`): 0 dòng bị đổi ⇒ use-case trả 400.
        int changed = jdbcTemplate.update("""
                UPDATE stock_issues SET status='approved',approved_by=?,updated_at=?
                WHERE id=? AND status='pending_cht'""", userId, now, issueId);
        if (changed == 0) return false;
        // `request_id` để NULL: phê duyệt này thuộc PHIẾU XUẤT (`entity_type/entity_id`), không thuộc
        // `material_requests` — và UNIQUE `approvals_request_stage_uidx(request_id,stage)` của MySQL cho
        // phép nhiều NULL. `department` NOT NULL nên luôn được truyền từ use-case.
        jdbcTemplate.update("""
                INSERT INTO approvals (id,entity_type,entity_id,request_id,stage,department,approver_user_id,
                                       status,queued_at,decided_at,comment,created_at,updated_at)
                VALUES (?,?,?,NULL,1,?,?,?,?,?,?,?,?)""",
                "APR_" + java.util.UUID.randomUUID(), "stock_issue", issueId, department, userId,
                "approved", now, now, comment, now, now);
        return true;
    }

    // ---------- return_stock / confirm_installation ----------
    @Override
    public Optional<Map<String, Object>> resolveOwnershipContract(String projectId, String warehouseId,
                                                                  String materialId, String requestedContractId) {
        if (requestedContractId != null && !requestedContractId.isBlank()) {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                    SELECT id,project_id AS projectId,status FROM project_contracts
                    WHERE id=? AND project_id=? AND status='active'""", requestedContractId, projectId);
            if (!rows.isEmpty()) return Optional.of(new LinkedHashMap<>(rows.get(0)));
            return Optional.empty();
        }
        List<Map<String, Object>> owners = jdbcTemplate.queryForList("""
                SELECT c.id,c.project_id AS projectId,c.contract_no AS contractNo,SUM(l.quantity_delta) AS balance
                FROM contract_stock_ledger l JOIN project_contracts c ON c.id=l.contract_id
                WHERE l.project_id=? AND l.warehouse_id=? AND l.material_id=?
                GROUP BY c.id,c.project_id,c.contract_no
                HAVING SUM(l.quantity_delta)>0.000001
                ORDER BY SUM(l.quantity_delta) DESC""", projectId, warehouseId, materialId);
        if (owners.size() == 1) return Optional.of(new LinkedHashMap<>(owners.get(0)));
        if (owners.size() > 1) return Optional.empty(); // nhiều contract — phải chọn
        List<Map<String, Object>> fallback = jdbcTemplate.queryForList("""
                SELECT id,project_id AS projectId,contract_no AS contractNo
                FROM project_contracts WHERE project_id=? AND status='active'
                ORDER BY is_primary DESC,created_at,id LIMIT 1""", projectId);
        return fallback.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(fallback.get(0)));
    }

    @Override
    @Transactional
    public void insertMaterialReturn(Map<String, Object> header, List<Map<String, Object>> items,
                                     boolean acceptedAny, Instant now) {
        String returnId = (String) header.get("id");
        jdbcTemplate.update("""
                INSERT INTO material_returns (id,return_no,project_id,team_id,to_warehouse_id,returned_by_name,
                                              received_by,returned_at,status,note,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
                returnId, header.get("returnNo"), header.get("projectId"), header.get("teamId"),
                header.get("toWarehouseId"), header.get("returnedByName"), header.get("receivedBy"),
                header.get("returnedAt"), "received", header.get("note"), now, now);
        for (Map<String, Object> item : items) {
            String returnItemId = (String) item.get("id");
            double accepted = ((Number) item.get("acceptedQty")).doubleValue();
            jdbcTemplate.update("""
                    INSERT INTO material_return_items (id,return_id,material_id,contract_id,quantity,
                                                       accepted_qty,rejected_qty,`condition`,reason,created_at,updated_at)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
                    returnItemId, returnId, item.get("materialId"), item.get("contractId"),
                    item.get("quantity"), accepted, ((Number) item.get("quantity")).doubleValue() - accepted,
                    item.get("condition"), item.get("reason"), now, now);
            if (accepted > 0) {
                // tổ đội -> kho dự án
                jdbcTemplate.update("""
                        INSERT INTO stock_movements (id,project_id,contract_id,destination_contract_id,material_id,
                                                     from_warehouse_id,to_warehouse_id,movement_type,quantity,unit_cost,
                                                     occurred_at,reference_type,reference_id,posted_by,reversal_of_id,
                                                     created_at,updated_at)
                        VALUES (?,?,?,?,?,?,?,?,?,0,?,?,?,?,NULL,?,?)""",
                        "MOV_" + java.util.UUID.randomUUID(), header.get("projectId"), item.get("contractId"),
                        item.get("contractId"), item.get("materialId"), item.get("fromWarehouseId"),
                        item.get("toWarehouseId"), "RET", accepted, now, "material_return", returnId,
                        header.get("receivedBy"), now, now);
                jdbcTemplate.update("""
                        INSERT INTO contract_stock_ledger (id,project_id,contract_id,warehouse_id,material_id,
                                                           movement_type,quantity_delta,occurred_at,reference_type,
                                                           reference_id,reference_item_id,counterparty_contract_id,
                                                           actor_user_id,note,created_at)
                        VALUES (?,?,?,?,?,?,?,?,?,?,?,NULL,?,?,?)""",
                        "CSL_" + java.util.UUID.randomUUID(), header.get("projectId"), item.get("contractId"),
                        item.get("fromWarehouseId"), item.get("materialId"), "RET", -accepted, now,
                        "material_return", returnId, returnItemId, header.get("receivedBy"), "Hoàn trả từ tổ đội", now);
                jdbcTemplate.update("""
                        INSERT INTO contract_stock_ledger (id,project_id,contract_id,warehouse_id,material_id,
                                                           movement_type,quantity_delta,occurred_at,reference_type,
                                                           reference_id,reference_item_id,counterparty_contract_id,
                                                           actor_user_id,note,created_at)
                        VALUES (?,?,?,?,?,?,?,?,?,?,?,NULL,?,?,?)""",
                        "CSL_" + java.util.UUID.randomUUID(), header.get("projectId"), item.get("contractId"),
                        item.get("toWarehouseId"), item.get("materialId"), "RET", accepted, now,
                        "material_return", returnId, returnItemId, header.get("receivedBy"), "Hoàn trả từ tổ đội", now);
            }
        }
    }

    @Override
    public Optional<Map<String, Object>> findIssueItem(String issueItemId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT sii.id,sii.issue_id AS issueId,sii.material_id AS materialId,sii.contract_id AS contractId,
                       sii.request_item_id AS requestItemId,sii.quantity,sii.installed_qty AS installedQty,
                       si.project_id AS projectId,t.warehouse_id AS teamWarehouseId
                FROM stock_issue_items sii
                JOIN stock_issues si ON si.id=sii.issue_id
                JOIN teams t ON t.id=si.team_id
                WHERE sii.id=?""", issueItemId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    @Transactional
    public void updateRequestItemInstalledOnly(String requestItemId, double installedQty, Instant now) {
        jdbcTemplate.update("UPDATE material_request_items SET installed_qty=installed_qty+?,updated_at=? WHERE id=?",
                installedQty, now, requestItemId);
    }

    @Override
    @Transactional
    public void insertInstallMovement(String issueId, String issueItemId, double quantity, String contractId,
                                      String teamWarehouseId, String materialId, String projectId, String userId,
                                      Instant now) {
        jdbcTemplate.update("""
                INSERT INTO stock_movements (id,project_id,contract_id,destination_contract_id,material_id,
                                             from_warehouse_id,to_warehouse_id,movement_type,quantity,unit_cost,
                                             occurred_at,reference_type,reference_id,posted_by,reversal_of_id,
                                             created_at,updated_at)
                VALUES (?,?,?,NULL,?,?,NULL,?,?,0,?,?,?,?,NULL,?,?)""",
                "MOV_" + java.util.UUID.randomUUID(), projectId, contractId, materialId, teamWarehouseId,
                "INSTALL", quantity, now, "stock_issue", issueId, userId, now, now);
        jdbcTemplate.update("""
                INSERT INTO contract_stock_ledger (id,project_id,contract_id,warehouse_id,material_id,
                                                   movement_type,quantity_delta,occurred_at,reference_type,
                                                   reference_id,reference_item_id,counterparty_contract_id,
                                                   actor_user_id,note,created_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,NULL,?,?,?)""",
                "CSL_" + java.util.UUID.randomUUID(), projectId, contractId, teamWarehouseId, materialId,
                "INSTALL", -quantity, now, "stock_issue", issueId, issueItemId, userId, "Đã lắp đặt tại hạng mục", now);
    }

    // ĐÃ XOÁ (TASK-040 nhóm 4): `updateIssueItemStatusInstalled` ghi `stock_issue_items.status='installed'`.
    // Cột `status` KHÔNG tồn tại trong `stock_issue_items` (11 cột thật: id, issue_id, material_id,
    // request_item_id, quantity, installed_qty, work_package_code, installation_area, created_at, updated_at,
    // contract_id) ⇒ MySQL "Unknown column" ⇒ HTTP 500 đúng ở bước xác nhận lắp CUỐI CÙNG.
    // Nghiêm trọng hơn: JS `confirm_installation` (scripts/system-route.mjs:1520) CHỈ có 2 câu cộng dồn
    // `installed_qty` + 1 movement — **KHÔNG** đánh dấu trạng thái ở đâu cả. Nên đây là HÀNH VI TỰ THÊM,
    // không phải thiếu sót cần bù: cách sửa đúng là bỏ hẳn, không phải thêm cột vào MySQL.

    // ---------- transfer orders ----------
    @Override
    public Optional<Map<String, Object>> findWarehouseFull(String warehouseId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT id,type,project_id AS projectId FROM warehouses WHERE id=? AND active=1""", warehouseId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    public Optional<Map<String, Object>> findTransitWarehouse() {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT id FROM warehouses WHERE type='transit' AND active=1 ORDER BY code LIMIT 1""");
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    public java.util.Optional<String> defaultContractId(String projectId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT id FROM project_contracts WHERE project_id=? AND status='active'
                ORDER BY is_primary DESC,created_at,id LIMIT 1""", projectId);
        return rows.isEmpty() ? java.util.Optional.empty()
                : java.util.Optional.of(String.valueOf(rows.get(0).get("id")));
    }

    @Override
    public Optional<Map<String, Object>> findTransferOrder(String transferId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT id,transfer_no AS transferNo,source_warehouse_id AS sourceWarehouseId,
                       destination_warehouse_id AS destinationWarehouseId,
                       source_project_id AS sourceProjectId,destination_project_id AS destinationProjectId,
                       transit_warehouse_id AS transitWarehouseId,status,reason,note
                FROM transfer_orders WHERE id=?""", transferId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    public List<Map<String, Object>> transferOrderItems(String transferId) {
        return jdbcTemplate.queryForList("""
                SELECT id,material_id AS materialId,source_contract_id AS sourceContractId,
                       destination_contract_id AS destinationContractId,requested_qty AS requestedQty,
                       approved_qty AS approvedQty,shipped_qty AS shippedQty,received_qty AS receivedQty,
                       rejected_qty AS rejectedQty,note
                FROM transfer_order_items WHERE transfer_order_id=?""", transferId);
    }

    @Override
    @Transactional
    public void insertTransferOrder(Map<String, Object> header, List<Map<String, Object>> items, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO transfer_orders (id,transfer_no,source_warehouse_id,destination_warehouse_id,
                                             source_project_id,destination_project_id,transit_warehouse_id,
                                             requested_by,requested_at,status,reason,note,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                header.get("id"), header.get("transferNo"), header.get("sourceWarehouseId"),
                header.get("destinationWarehouseId"), header.get("sourceProjectId"),
                header.get("destinationProjectId"), header.get("transitWarehouseId"),
                header.get("requestedBy"), header.get("requestedAt"), "requested",
                header.get("reason"), header.get("note"), now, now);
        for (Map<String, Object> item : items) {
            jdbcTemplate.update("""
                    INSERT INTO transfer_order_items (id,transfer_order_id,material_id,source_contract_id,
                                                      destination_contract_id,requested_qty,approved_qty,
                                                      shipped_qty,received_qty,rejected_qty,lost_qty,note,
                                                      created_at,updated_at)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                    item.get("id"), header.get("id"), item.get("materialId"), item.get("sourceContractId"),
                    item.get("destinationContractId"), item.get("quantity"), 0, 0, 0, 0, 0,
                    item.get("note"), now, now);
        }
    }

    @Override
    @Transactional
    public void setTransferApproved(String transferId, String userId, Instant now) {
        jdbcTemplate.update("""
                UPDATE transfer_orders SET status='approved',approved_by=?,approved_at=?,updated_at=? WHERE id=?""",
                userId, now, now, transferId);
        jdbcTemplate.update("""
                UPDATE transfer_order_items SET approved_qty=requested_qty,updated_at=?
                WHERE transfer_order_id=?""", now, transferId);
    }

    @Override
    @Transactional
    public void shipTransfer(String transferId, List<Map<String, Object>> items, String transitWarehouseId,
                             String sourceProjectId, String userId, Instant now) {
        for (Map<String, Object> item : items) {
            jdbcTemplate.update("""
                    INSERT INTO stock_movements (id,project_id,contract_id,destination_contract_id,material_id,
                                                 from_warehouse_id,to_warehouse_id,movement_type,quantity,unit_cost,
                                                 occurred_at,reference_type,reference_id,posted_by,reversal_of_id,
                                                 created_at,updated_at)
                    VALUES (?,?,?,?,?,?,?,?,?,0,?,?,?,?,NULL,?,?)""",
                    "MOV_" + java.util.UUID.randomUUID(), sourceProjectId, item.get("sourceContractId"),
                    item.get("sourceContractId"), item.get("materialId"), item.get("fromWarehouseId"),
                    transitWarehouseId, "TRF_SHIP", item.get("quantity"), now, "transfer_order", transferId,
                    userId, now, now);
        }
        jdbcTemplate.update("""
                UPDATE transfer_orders SET status='in_transit',shipped_by=?,shipped_at=?,updated_at=?
                WHERE id=?""", userId, now, now, transferId);
    }

    @Override
    @Transactional
    public void receiveTransfer(String transferId, List<Map<String, Object>> updates, Map<String, Object> context,
                                long lostTotal, String userId, Instant now) {
        for (Map<String, Object> u : updates) {
            jdbcTemplate.update("""
                    UPDATE transfer_order_items SET received_qty=?,rejected_qty=?,lost_qty=?,updated_at=?
                    WHERE id=?""", u.get("received"), u.get("rejected"), u.get("lost"), now, u.get("id"));
        }
        jdbcTemplate.update("""
                UPDATE transfer_orders SET status=?,received_by=?,received_at=?,updated_at=? WHERE id=?""",
                lostTotal > 0 ? "received_with_loss" : "received", userId, now, now, transferId);
    }

    @Override
    @Transactional
    public void insertOwnershipTransfer(Map<String, Object> ot, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO contract_ownership_transfers (id,transfer_no,warehouse_id,material_id,
                                                          source_project_id,source_contract_id,
                                                          destination_project_id,destination_contract_id,
                                                          quantity,reason,source_reference_type,source_reference_id,
                                                          status,posted_by,posted_at,created_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                ot.get("id"), ot.get("transferNo"), ot.get("warehouseId"), ot.get("materialId"),
                ot.get("sourceProjectId"), ot.get("sourceContractId"), ot.get("destinationProjectId"),
                ot.get("destinationContractId"), ot.get("quantity"), ot.get("reason"),
                ot.get("sourceReferenceType"), ot.get("sourceReferenceId"), "posted",
                ot.get("postedBy"), now, now);
    }

    // ---------- central returns ----------
    @Override
    public Optional<Map<String, Object>> findCentralWarehouse() {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT id FROM warehouses WHERE type='central' AND active=1 ORDER BY code LIMIT 1""");
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    public Optional<Map<String, Object>> findCentralReturn(String returnId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT id,return_no AS returnNo,status,source_project_id AS projectId,
                       source_warehouse_id AS sourceWarehouseId,central_warehouse_id AS centralWarehouseId
                FROM central_returns WHERE id=?""", returnId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    public List<Map<String, Object>> centralReturnItems(String returnId) {
        return jdbcTemplate.queryForList("""
                SELECT id,material_id AS materialId,contract_id AS contractId,proposed_qty AS proposedQty,
                       unit_cost AS unitCost
                FROM central_return_items WHERE central_return_id=?""", returnId);
    }

    @Override
    public long centralReturnImageCount(String returnId) {
        Long n = jdbcTemplate.queryForObject("""
                SELECT COUNT(*) FROM attachments
                WHERE entity_type='central_return' AND entity_id=?
                  AND lower(mime_type) LIKE 'image/%'""", Long.class, returnId);
        return n == null ? 0 : n;
    }

    @Override
    @Transactional
    public void insertCentralReturn(Map<String, Object> header, List<Map<String, Object>> items, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO central_returns (id,return_no,source_project_id,source_warehouse_id,central_warehouse_id,
                                             requested_by,requested_at,approved_by,approved_at,received_by,received_at,
                                             status,note,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,NULL,NULL,NULL,NULL,'pending_approval',?,?,?)""",
                header.get("id"), header.get("returnNo"), header.get("projectId"), header.get("sourceWarehouseId"),
                header.get("centralWarehouseId"), header.get("requestedBy"), header.get("requestedAt"),
                header.get("note"), now, now);
        for (Map<String, Object> item : items) {
            jdbcTemplate.update("""
                    INSERT INTO central_return_items (id,central_return_id,material_id,contract_id,proposed_qty,
                                                      counted_qty,accepted_qty,rejected_qty,condition_status,
                                                      unit_cost,rejection_reason,created_at,updated_at)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                    item.get("id"), header.get("id"), item.get("materialId"), item.get("contractId"),
                    item.get("quantity"), 0, 0, 0, item.get("conditionStatus"), item.get("unitCost"),
                    null, now, now);
        }
    }

    @Override
    @Transactional
    public void approveCentralReturnWithShip(String returnId, String reason, String transitWarehouseId,
                                             Map<String, Object> context, List<Map<String, Object>> items,
                                             String userId, Instant now) {
        String projectId = String.valueOf(context.get("projectId"));
        String sourceWarehouseId = String.valueOf(context.get("sourceWarehouseId"));
        // đánh dấu vị trí item để ghi movements
        for (Map<String, Object> item : items) {
            jdbcTemplate.update("""
                    INSERT INTO stock_movements (id,project_id,contract_id,destination_contract_id,material_id,
                                                 from_warehouse_id,to_warehouse_id,movement_type,quantity,unit_cost,
                                                 occurred_at,reference_type,reference_id,posted_by,reversal_of_id,
                                                 created_at,updated_at)
                    VALUES (?,?,?,?,?,?,?,?,?,0,?,?,?,?,NULL,?,?)""",
                    "MOV_" + java.util.UUID.randomUUID(), projectId, item.get("contractId"),
                    item.get("contractId"), item.get("materialId"), sourceWarehouseId,
                    transitWarehouseId, "CENTRAL_RETURN_SHIP", item.get("quantity"), now,
                    "central_return", returnId, userId, now, now);
        }
        jdbcTemplate.update("""
                UPDATE central_returns SET status='in_transit',approved_by=?,approved_at=?,
                       note=CASE WHEN note IS NULL THEN ? ELSE CONCAT(note,' | ',?) END,updated_at=? WHERE id=?""",
                userId, now, reason, reason, now, returnId);
    }

    @Override
    @Transactional
    public void receiveCentralReturn(String returnId, List<Map<String, Object>> updates, Map<String, Object> context,
                                     long acceptedTotal, long rejectedTotal, String userId, Instant now) {
        String projectId = String.valueOf(context.getOrDefault("projectId", ""));
        String transitWarehouseId = String.valueOf(context.getOrDefault("transitWarehouseId", ""));
        String centralWarehouseId = String.valueOf(context.getOrDefault("centralWarehouseId", ""));
        String sourceWarehouseId = String.valueOf(context.getOrDefault("sourceWarehouseId", ""));
        for (Map<String, Object> u : updates) {
            double accepted = ((Number) u.getOrDefault("accepted", 0)).doubleValue();
            double rejectedLost = ((Number) u.getOrDefault("rejected", 0)).doubleValue();
            if (accepted > 0) {
                jdbcTemplate.update("""
                        INSERT INTO stock_movements (id,project_id,contract_id,destination_contract_id,material_id,
                                                     from_warehouse_id,to_warehouse_id,movement_type,quantity,unit_cost,
                                                     occurred_at,reference_type,reference_id,posted_by,reversal_of_id,
                                                     created_at,updated_at)
                        VALUES (?,?,?,NULL,?,?,?,?,?,0,?,?,?,?,NULL,?,?)""",
                        "MOV_" + java.util.UUID.randomUUID(), projectId, u.get("contractId"),
                        u.get("materialId"), transitWarehouseId, centralWarehouseId,
                        "CENTRAL_RETURN_RECEIVE", accepted, now, "central_return", returnId, userId, now, now);
            }
            if (rejectedLost > 0) {
                jdbcTemplate.update("""
                        INSERT INTO stock_movements (id,project_id,contract_id,destination_contract_id,material_id,
                                                     from_warehouse_id,to_warehouse_id,movement_type,quantity,unit_cost,
                                                     occurred_at,reference_type,reference_id,posted_by,reversal_of_id,
                                                     created_at,updated_at)
                        VALUES (?,?,?,?,?,?,?,?,?,0,?,?,?,?,NULL,?,?)""",
                        "MOV_" + java.util.UUID.randomUUID(), projectId, u.get("contractId"),
                        u.get("contractId"), u.get("materialId"), transitWarehouseId, sourceWarehouseId,
                        "CENTRAL_RETURN_REJECT", rejectedLost, now, "central_return", returnId, userId, now, now);
            }
            jdbcTemplate.update("""
                    UPDATE central_return_items SET counted_qty=?,accepted_qty=?,rejected_qty=?,updated_at=?
                    WHERE id=?""", u.get("counted"), accepted, rejectedLost, now, u.get("id"));
        }
        jdbcTemplate.update("""
                UPDATE central_returns SET status=?,received_by=?,received_at=?,updated_at=? WHERE id=?""",
                rejectedTotal > 0 ? "received_with_rejection" : "received", userId, now, now, returnId);
    }

    // ---------- stocktake ----------
    @Override
    public Optional<Map<String, Object>> findWarehouseById(String warehouseId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT w.id,w.project_id AS projectId,w.code AS warehouseCode,p.code AS projectCode
                FROM warehouses w LEFT JOIN projects p ON p.id=w.project_id
                WHERE w.id=?""", warehouseId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    public Optional<Map<String, Object>> findStockCount(String countId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT id,project_id AS projectId,warehouse_id AS warehouseId,status
                FROM stock_counts WHERE id=?""", countId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    public List<Map<String, Object>> stockCountItems(String countId) {
        return jdbcTemplate.queryForList("""
                SELECT id,material_id AS materialId,variance_qty AS varianceQty
                FROM stock_count_items WHERE stock_count_id=?""", countId);
    }

    @Override
    @Transactional
    public void insertStockCount(String countId, String countNo, String projectId, String warehouseId,
                                 String countType, List<Map<String, Object>> items, String userId, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO stock_counts (id,count_no,project_id,warehouse_id,count_type,counted_at,status,
                                          approved_by,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,NULL,?,?)""",
                countId, countNo, projectId, warehouseId, countType, now, "pending_approval", now, now);
        for (Map<String, Object> item : items) {
            jdbcTemplate.update("""
                    INSERT INTO stock_count_items (id,stock_count_id,material_id,book_qty_snapshot,actual_qty,
                                                   variance_qty,reason,approved_adjustment_qty,created_at,updated_at)
                    VALUES (?,?,?,?,?,?,?,0,?,?)""",
                    item.get("id"), countId, item.get("materialId"), item.get("bookQty"), item.get("actualQty"),
                    item.get("variance"), item.get("reason"), now, now);
        }
    }

    @Override
    @Transactional
    public void approveStockCountAdjustments(String countId, List<Map<String, Object>> items, String projectId,
                                             String warehouseId, String userId, Instant now) {
        jdbcTemplate.update("""
                UPDATE stock_counts SET status='approved',approved_by=?,updated_at=? WHERE id=?""",
                userId, now, countId);
        for (Map<String, Object> item : items) {
            double variance = ((Number) item.get("variance")).doubleValue();
            jdbcTemplate.update("""
                    UPDATE stock_count_items SET approved_adjustment_qty=?,updated_at=? WHERE id=?""",
                    variance, now, item.get("id"));
            if (Math.abs(variance) > 1e-9) {
                jdbcTemplate.update("""
                        INSERT INTO stock_movements (id,project_id,contract_id,destination_contract_id,material_id,
                                                     from_warehouse_id,to_warehouse_id,movement_type,quantity,unit_cost,
                                                     occurred_at,reference_type,reference_id,posted_by,reversal_of_id,
                                                     created_at,updated_at)
                        VALUES (?,?,NULL,NULL,?,?,?,?,?,0,?,?,?,?,NULL,?,?)""",
                        "MOV_" + java.util.UUID.randomUUID(), projectId, item.get("materialId"),
                        variance < 0 ? warehouseId : null, variance > 0 ? warehouseId : null,
                        "ADJ", Math.abs(variance), now, "stock_count", countId, userId, now, now);
            }
        }
    }

    // ---------- reconcile / ownership / reverse ----------
    @Override
    public List<Map<String, Object>> reconcilePhysicalVsContract(String warehouseId, String projectId) {
        return jdbcTemplate.queryForList("""
                WITH physical AS (
                    SELECT material_id,
                           COALESCE(SUM(CASE WHEN to_warehouse_id=? THEN quantity ELSE 0 END)
                                  -SUM(CASE WHEN from_warehouse_id=? THEN quantity ELSE 0 END),0) AS qty
                    FROM stock_movements GROUP BY material_id),
                 owned AS (
                    SELECT material_id,COALESCE(SUM(quantity_delta),0) AS qty
                    FROM contract_stock_ledger WHERE project_id=? AND warehouse_id=?
                    GROUP BY material_id),
                 ids AS (SELECT material_id FROM physical UNION SELECT material_id FROM owned)
                SELECT ids.material_id AS materialId,m.code AS materialCode,m.name AS materialName,
                       COALESCE(physical.qty,0) AS physicalQty,COALESCE(owned.qty,0) AS contractQty,
                       COALESCE(physical.qty,0)-COALESCE(owned.qty,0) AS differenceQty
                FROM ids JOIN materials m ON m.id=ids.material_id
                LEFT JOIN physical ON physical.material_id=ids.material_id
                LEFT JOIN owned ON owned.material_id=ids.material_id
                ORDER BY m.code""", warehouseId, warehouseId, projectId, warehouseId);
    }

    @Override
    @Transactional
    public void insertReconciliation(Map<String, Object> row, String userId, String note, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO contract_stock_reconciliations (id,project_id,warehouse_id,material_id,physical_qty,
                                                            contract_qty,difference_qty,status,checked_by,checked_at,
                                                            note,created_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
                "REC_" + java.util.UUID.randomUUID(), row.get("projectId"), row.get("warehouseId"),
                row.get("materialId"), row.get("physicalQty"), row.get("contractQty"), row.get("differenceQty"),
                row.get("status"), userId, now, note, now);
    }

    @Override
    public Optional<Map<String, Object>> findStockMovement(String movementId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT * FROM stock_movements WHERE id=?", movementId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    public Optional<Map<String, Object>> findReversal(String movementId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT id FROM stock_movements WHERE reversal_of_id=?", movementId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    @Transactional
    public void insertMovementReversal(Map<String, Object> reverse, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO stock_movements (id,project_id,contract_id,destination_contract_id,material_id,
                                             from_warehouse_id,to_warehouse_id,movement_type,quantity,unit_cost,
                                             occurred_at,reference_type,reference_id,posted_by,reversal_of_id,
                                             created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                reverse.get("id"), reverse.get("projectId"), reverse.get("contractId"),
                reverse.get("destinationContractId"), reverse.get("materialId"), reverse.get("fromWarehouseId"),
                reverse.get("toWarehouseId"), reverse.get("movementType"), reverse.get("quantity"),
                reverse.get("unitCost"), reverse.get("occurredAt"), reverse.get("referenceType"),
                reverse.get("referenceId"), reverse.get("postedBy"), reverse.get("movementId"),
                now, now);
    }

    @Override
    @Transactional
    public void updateMovementReversalMarker(String movementId, Instant now) {
        jdbcTemplate.update("UPDATE stock_movements SET updated_at=? WHERE id=?", now, movementId);
    }

    @Override
    @Transactional
    public void insertContractLedgerRow(Map<String, Object> row, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO contract_stock_ledger (id,project_id,contract_id,warehouse_id,material_id,
                                                   movement_type,quantity_delta,occurred_at,reference_type,
                                                   reference_id,reference_item_id,counterparty_contract_id,
                                                   actor_user_id,note,created_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                row.get("id"), row.get("projectId"), row.get("contractId"), row.get("warehouseId"),
                row.get("materialId"), row.get("movementType"), row.get("quantityDelta"), row.get("occurredAt"),
                row.get("referenceType"), row.get("referenceId"), row.get("referenceItemId"),
                row.get("counterpartyContractId"), row.get("actorUserId"), row.get("note"), now);
    }

    @Override
    public Optional<Map<String, Object>> findContractActive(String contractId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT id,project_id AS projectId,contract_no AS contractNo FROM project_contracts
                WHERE id=? AND status='active'""", contractId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    @Transactional
    public String nextOwnershipTransferNo(int year) {
        jdbcTemplate.update("""
                INSERT INTO document_sequences (id,document_type,project_id,`year`,last_number,updated_at)
                VALUES (?,?,NULL,?,1,?)
                ON DUPLICATE KEY UPDATE last_number=last_number+1,updated_at=VALUES(updated_at)""",
                "OWNERSHIP:" + year, "OWNERSHIP_TRANSFER", year, Instant.now());
        Long n = jdbcTemplate.queryForObject("SELECT last_number FROM document_sequences WHERE id=?",
                Long.class, "OWNERSHIP:" + year);
        return String.valueOf(n == null ? 1 : n);
    }

    @Override
    @Transactional
    public void recordOwnershipTransferLite(Map<String, Object> ot, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO contract_ownership_transfers (id,transfer_no,warehouse_id,material_id,
                                                          source_project_id,source_contract_id,
                                                          destination_project_id,destination_contract_id,
                                                          quantity,reason,source_reference_type,source_reference_id,
                                                          status,posted_by,posted_at,created_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                ot.get("id"), ot.get("transferNo"), ot.get("warehouseId"), ot.get("materialId"),
                ot.get("sourceProjectId"), ot.get("sourceContractId"), ot.get("destinationProjectId"),
                ot.get("destinationContractId"), ot.get("quantity"), ot.get("reason"),
                ot.get("sourceReferenceType"), ot.get("sourceReferenceId"), "posted",
                ot.get("postedBy"), now, now);
    }
}