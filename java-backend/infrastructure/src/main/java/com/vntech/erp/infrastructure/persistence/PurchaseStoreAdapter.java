package com.vntech.erp.infrastructure.persistence;

import com.vntech.erp.application.port.out.PurchaseStore;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/** Adapter mua hàng — native SQL port từ create_po/close_po_line của monolith JS. */
@Component
public class PurchaseStoreAdapter implements PurchaseStore {

    private final JdbcTemplate jdbcTemplate;

    public PurchaseStoreAdapter(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public Optional<Map<String, Object>> findApprovedRequest(String requestId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT mr.id,mr.request_no AS requestNo,mr.project_id AS projectId,
                       mr.contract_id AS contractId,mr.boq_version_id AS boqVersionId,
                       mr.status,mr.supply_status AS supplyStatus,
                       p.code AS projectCode,p.name AS projectName,u.email AS requesterEmail
                FROM material_requests mr
                JOIN projects p ON p.id=mr.project_id
                JOIN users u ON u.id=mr.requested_by
                WHERE mr.id=? AND mr.status='approved'""", requestId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    public Optional<Map<String, Object>> findWarehouse(String warehouseId, String projectId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT id FROM warehouses WHERE id=? AND project_id=? AND active=1""", warehouseId, projectId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    public List<Map<String, Object>> requestSourceItems(String requestId) {
        return jdbcTemplate.queryForList("""
                SELECT mri.id,mri.material_id AS materialId,mri.contract_id AS contractId,
                       mri.boq_version_id AS boqVersionId,mri.boq_item_id AS boqItemId,
                       mri.approved_purchase_qty AS approvedQty,mri.ordered_qty AS orderedQty,
                       m.`system`,m.requires_mar AS requiresMar
                FROM material_request_items mri
                JOIN materials m ON m.id=mri.material_id
                WHERE mri.request_id=?""", requestId);
    }

    @Override
    public Optional<Map<String, Object>> findMaterial(String materialId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT id,code,name,`system`,requires_mar AS requiresMar FROM materials WHERE id=?", materialId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    public Optional<Map<String, Object>> findMarApproval(String projectId, String materialId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT status FROM material_mar_approvals WHERE project_id=? AND material_id=?""",
                projectId, materialId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    public Optional<Map<String, Object>> findOtherAvailableStock(String materialId, String excludeWarehouseId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                WITH mv AS (
                    SELECT to_warehouse_id AS warehouse_id,quantity AS qty FROM stock_movements
                    WHERE material_id=? AND to_warehouse_id IS NOT NULL
                    UNION ALL
                    SELECT from_warehouse_id AS warehouse_id,-quantity AS qty FROM stock_movements
                    WHERE material_id=? AND from_warehouse_id IS NOT NULL),
                 b AS (SELECT warehouse_id,COALESCE(SUM(qty),0) AS on_hand FROM mv GROUP BY warehouse_id),
                 r AS (SELECT warehouse_id,COALESCE(SUM(quantity),0) AS reserved FROM stock_reservations
                       WHERE material_id=? AND status='active' GROUP BY warehouse_id)
                SELECT w.id,w.code,w.name,w.type,p.code AS projectCode,
                       CASE WHEN COALESCE(b.on_hand,0)-COALESCE(r.reserved,0)>0
                            THEN COALESCE(b.on_hand,0)-COALESCE(r.reserved,0) ELSE 0 END AS available
                FROM b
                JOIN warehouses w ON w.id=b.warehouse_id AND w.active=1 AND w.type<>'transit'
                LEFT JOIN r ON r.warehouse_id=w.id
                LEFT JOIN projects p ON p.id=w.project_id
                WHERE w.id<>? AND COALESCE(b.on_hand,0)-COALESCE(r.reserved,0)>0
                ORDER BY CASE WHEN w.type='central' THEN 0 ELSE 1 END,available DESC LIMIT 1""",
                materialId, materialId, materialId, excludeWarehouseId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    public boolean supplierActive(String supplierId) {
        Long n = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM suppliers WHERE id=? AND active=1", Long.class, supplierId);
        return n != null && n > 0;
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
    public long supplyPoSlaHours() {
        Long n = jdbcTemplate.queryForObject("""
                SELECT COALESCE((SELECT po_sla_hours FROM company_settings WHERE id='SETTINGS'),24)""", Long.class);
        return n == null ? 24 : n;
    }

    @Override
    @Transactional
    public void insertPurchaseOrderWithItems(String poId, String poNo, String requestId, String projectId,
                                             String contractId, String boqVersionId, String supplierId,
                                             String warehouseId, String buyerUserId, String eta, String status,
                                             List<Map<String, Object>> items, String allocationProjectId,
                                             String allocationContractId, String allocationBoqVersionId,
                                             String requestNo, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO purchase_orders (id,po_no,request_id,project_id,contract_id,boq_version_id,
                                             supplier_id,receiving_warehouse_id,buyer_user_id,ordered_at,eta,
                                             delivery_queued_at,delivery_completed_at,status,total_value,
                                             created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,NULL,?,0,?,?)""",
                poId, poNo, requestId, projectId, contractId, boqVersionId, supplierId, warehouseId,
                buyerUserId, now, eta, now, status, now, now);
        int lineNo = 1;
        for (Map<String, Object> line : items) {
            String poiId = "POI_" + java.util.UUID.randomUUID();
            jdbcTemplate.update("""
                    INSERT INTO purchase_order_items (id,purchase_order_id,request_item_id,contract_id,
                                                      boq_version_id,boq_item_id,line_no,ordered_qty,unit_price,
                                                      system_code,planned_delivery_at,delivered_qty,received_qty,
                                                      closed_qty,status,created_at,updated_at)
                    VALUES (?,?,?,?,?,?,?,?,0,?,?,0,0,0,'ordered',?,?)""",
                    poiId, poId, line.get("requestItemId"), line.get("contractId"), line.get("boqVersionId"),
                    line.get("boqItemId"), lineNo++, line.get("qty"), line.get("systemCode"),
                    line.get("plannedDeliveryAt"), now, now);
            jdbcTemplate.update("""
                    INSERT INTO procurement_allocations (id,project_id,contract_id,boq_version_id,boq_item_id,
                                                         material_id,request_item_id,stage,quantity,reference_no,
                                                         created_at,updated_at)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
                    "PAL_" + java.util.UUID.randomUUID(), allocationProjectId, allocationContractId,
                    allocationBoqVersionId, line.get("boqItemId"), line.get("materialId"),
                    line.get("requestItemId"), "PO", line.get("qty"), requestNo, now, now);
        }
    }

    @Override
    @Transactional
    public void updateRequestItemOrdered(String requestItemId, double qty, boolean orderedComplete, Instant now) {
        jdbcTemplate.update("""
                UPDATE material_request_items SET ordered_qty=ordered_qty+?,
                     line_status=CASE WHEN ? THEN 'ordered' ELSE line_status END,updated_at=? WHERE id=?""",
                qty, orderedComplete, now, requestItemId);
        if (orderedComplete) {
            // khi đặt đủ: chuyển line_status sang 'ordered'
        }
    }

    @Override
    @Transactional
    public void updateRequestSupplyStatus(String requestId, String supplyStatus, Instant now) {
        jdbcTemplate.update("UPDATE material_requests SET supply_status=?,updated_at=? WHERE id=?",
                supplyStatus, now, requestId);
    }

    @Override
    @Transactional
    public void insertSupplyWorkflowStepPoCreation(String requestId, String poId, String comment, Instant now,
                                                   long dueHours) {
        jdbcTemplate.update("""
                INSERT INTO supply_workflow_steps (id,request_id,purchase_order_id,receipt_id,step,status,
                                                   queued_at,due_at,completed_at,completed_by,comment,created_at,updated_at)
                VALUES (?,?,?,NULL,'po_creation','completed',?,?,?,?,?,?,?)
                ON DUPLICATE KEY UPDATE status='completed',completed_at=?,completed_by=?,comment=?,updated_at=?""",
                "SWF_" + java.util.UUID.randomUUID(), requestId, poId, now,
                now.plusSeconds(dueHours * 3600), now, null, comment, now, now,
                now, null, comment, now);
    }

    @Override
    @Transactional
    public void updatePendingPoCreationStep(String requestId, String poId, String comment, Instant now) {
        jdbcTemplate.update("""
                UPDATE supply_workflow_steps SET purchase_order_id=COALESCE(purchase_order_id,?),
                       status='completed',completed_at=?,completed_by=NULL,comment=?,updated_at=?
                WHERE request_id=? AND step='po_creation' AND status='pending'""",
                poId, now, comment, now, requestId);
    }

    @Override
    @Transactional
    public void insertPendingPoCreationStep(String requestId, long dueHours, String comment, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO supply_workflow_steps (id,request_id,purchase_order_id,receipt_id,step,status,
                                                   queued_at,due_at,completed_at,completed_by,comment,created_at,updated_at)
                VALUES (?,?,NULL,NULL,'po_creation','pending',?,?,NULL,NULL,?,?,?)""",
                "SWF_" + java.util.UUID.randomUUID(), requestId, now,
                now.plusSeconds(dueHours * 3600), comment, now, now);
    }

    // ---------- close_po_line ----------
    @Override
    public Optional<Map<String, Object>> findPoLine(String poItemId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT poi.id,poi.purchase_order_id AS purchaseOrderId,poi.request_item_id AS requestItemId,
                       poi.ordered_qty AS orderedQty,poi.delivered_qty AS deliveredQty,
                       poi.received_qty AS receivedQty,poi.closed_qty AS closedQty,
                       po.project_id AS projectId,po.request_id AS requestId
                FROM purchase_order_items poi
                JOIN purchase_orders po ON po.id=poi.purchase_order_id
                WHERE poi.id=?""", poItemId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

/** [WF] PHASE 8 (B2) — QUYẾT ĐỊNH cho PO + (tuỳ chọn) thông báo cho người tạo, trong MỘT giao dịch. */
@Override
@Transactional
public void decidePo(String poId, String status, String reason, String userId, String notifyUserId,
        String notifyTitle, String notifyBody, Instant now) {
    jdbcTemplate.update(
        "UPDATE purchase_orders SET status=?, decision_reason=?, decided_by=?, decided_at=?, updated_at=? WHERE id=?",
        status, reason, userId, now, now, poId);
    if (notifyUserId != null && !notifyUserId.isBlank()) {
        jdbcTemplate.update(
            "INSERT INTO task_notifications (id,work_item_id,user_id,channel,title,body,status,read_at,sent_at,last_error,created_at,updated_at) " +
            "VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
            "NTF_" + java.util.UUID.randomUUID(), poId, notifyUserId, "in_app", notifyTitle, notifyBody, "SENT", null, now, null, now, now);
    }
}


/** [WF] PHASE 8 (B2/b3) — cập nhật đơn giá 1 dòng PO; ràng buộc theo poId để KHÔNG sửa chéo sang PO khác. */
@Override
@Transactional

public void updatePoItemPrice(String poId, String poItemId, double unitPrice, Instant now) {
    jdbcTemplate.update(
        "UPDATE purchase_order_items SET unit_price=?, updated_at=? WHERE id=? AND purchase_order_id=?",
        unitPrice, now, poItemId, poId);
}

    @Override
    @Transactional
public void closePoLine(String poItemId, double shortage, String reason, String userId, Instant now) {
        jdbcTemplate.update("""
                UPDATE purchase_order_items SET closed_qty=closed_qty+?,close_reason=?,closed_by=?,
                       closed_at=?,status='closed_shortage',updated_at=? WHERE id=?""",
                shortage, reason, userId, now, now, poItemId);
    }

    @Override
    @Transactional
    public void closeRequestItemForShortage(String requestItemId, double shortage, String reason, Instant now) {
        jdbcTemplate.update("""
                UPDATE material_request_items SET closed_qty=closed_qty+?,close_reason=?,
                       line_status=CASE WHEN received_qty+closed_qty+?>=approved_purchase_qty
                                        THEN 'closed_shortage' ELSE line_status END,
                       updated_at=? WHERE id=?""",
                shortage, reason, shortage, now, requestItemId);
    }

    @Override
    public long countPoOpenLines(String purchaseOrderId) {
        Long n = jdbcTemplate.queryForObject("""
                SELECT COUNT(*) FROM purchase_order_items
                WHERE purchase_order_id=? AND received_qty+closed_qty<ordered_qty""",
                Long.class, purchaseOrderId);
        return n == null ? 0 : n;
    }

    @Override
    public long countRequestOpenLines(String requestId) {
        Long n = jdbcTemplate.queryForObject("""
                SELECT COUNT(*) FROM material_request_items
                WHERE request_id=? AND received_qty+closed_qty<approved_purchase_qty""",
                Long.class, requestId);
        return n == null ? 0 : n;
    }

    @Override
    @Transactional
    public void completePoWithShortage(String purchaseOrderId, Instant now) {
        jdbcTemplate.update("""
                UPDATE purchase_orders SET status='completed_with_shortage',delivery_completed_at=?,updated_at=?
                WHERE id=?""", now, now, purchaseOrderId);
    }

    @Override
    @Transactional
    public void completeRequestWithShortage(String requestId, Instant now) {
        jdbcTemplate.update(
                "UPDATE material_requests SET supply_status='completed_with_shortage',updated_at=? WHERE id=?",
                now, requestId);
    }

    // ---------- receive_goods / confirm_delivery ----------
    @Override
    public Optional<Map<String, Object>> findPoForReceiving(String poId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT po.id,po.po_no AS poNo,po.request_id AS requestId,po.project_id AS projectId,
                       po.contract_id AS contractId,po.boq_version_id AS boqVersionId,
                       po.receiving_warehouse_id AS warehouseId,po.status,po.eta,
po.buyer_user_id AS buyerUserId,mr.requested_by AS requesterId,
                       mr.request_no AS requestNo,p.code AS projectCode,p.name AS projectName,
                       u.email AS requesterEmail
                FROM purchase_orders po
                JOIN material_requests mr ON mr.id=po.request_id
                JOIN projects p ON p.id=po.project_id
                JOIN users u ON u.id=mr.requested_by
                WHERE po.id=?""", poId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    public List<Map<String, Object>> poItemsForReceiving(String poId) {
        return jdbcTemplate.queryForList("""
                SELECT poi.id,poi.request_item_id AS requestItemId,poi.contract_id AS contractId,
                       poi.boq_version_id AS boqVersionId,poi.boq_item_id AS boqItemId,
                       poi.ordered_qty AS orderedQty,poi.delivered_qty AS deliveredQty,
                       poi.received_qty AS receivedQty,poi.closed_qty AS closedQty,
                       mri.material_id AS materialId
                FROM purchase_order_items poi
                JOIN material_request_items mri ON mri.id=poi.request_item_id
                WHERE poi.purchase_order_id=?""", poId);
    }

    @Override
    public Optional<Map<String, Object>> findReceiptInfo(String receiptId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT gr.id,gr.receipt_no AS receiptNo,gr.purchase_order_id AS purchaseOrderId,
                       gr.contract_id AS contractId,gr.boq_version_id AS boqVersionId,
                       gr.warehouse_id AS warehouseId,gr.qc_status AS qcStatus,
                       gr.posting_status AS postingStatus,
                       gr.bch_confirmation_status AS confirmationStatus,
                       po.po_no AS poNo,po.eta,po.request_id AS requestId,po.project_id AS projectId,
                       mr.request_no AS requestNo,p.code AS projectCode,p.name AS projectName,
                       u.email AS requesterEmail
                FROM goods_receipts gr
                JOIN purchase_orders po ON po.id=gr.purchase_order_id
                JOIN material_requests mr ON mr.id=po.request_id
                JOIN projects p ON p.id=po.project_id
                JOIN users u ON u.id=mr.requested_by
                WHERE gr.id=?""", receiptId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    public List<Map<String, Object>> receiptItems(String receiptId) {
        return jdbcTemplate.queryForList("""
                SELECT gri.id,gri.purchase_order_item_id AS purchaseOrderItemId,
                       gri.contract_id AS contractId,gri.boq_version_id AS boqVersionId,
                       gri.boq_item_id AS boqItemId,gri.accepted_qty AS acceptedQty,
                       gri.rejected_qty AS rejectedQty,poi.request_item_id AS requestItemId,
                       mri.material_id AS materialId
                FROM goods_receipt_items gri
                JOIN purchase_order_items poi ON poi.id=gri.purchase_order_item_id
                JOIN material_request_items mri ON mri.id=poi.request_item_id
                WHERE gri.receipt_id=?""", receiptId);
    }

    @Override
    public long goodsReceiptImageCount(String receiptId) {
        Long n = jdbcTemplate.queryForObject("""
                SELECT COUNT(*) FROM attachments
                WHERE entity_type='goods_receipt' AND entity_id=?
                  AND lower(mime_type) LIKE 'image/%'""", Long.class, receiptId);
        return n == null ? 0 : n;
    }

    @Override
    @Transactional
    public void insertGoodsReceipt(Map<String, Object> header, List<Map<String, Object>> items, Instant now) {
        String receiptId = (String) header.get("id");
        jdbcTemplate.update("""
                INSERT INTO goods_receipts (id,receipt_no,purchase_order_id,contract_id,boq_version_id,
                                            warehouse_id,received_by,received_at,delivery_note_no,qc_status,
                                            document_status,certificate_status,delivery_document_status,
                                            bch_confirmation_status,bch_confirmed_by,bch_confirmed_at,bch_comment,
                                            posting_status,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                receiptId, header.get("receiptNo"), header.get("purchaseOrderId"), header.get("contractId"),
                header.get("boqVersionId"), header.get("warehouseId"), header.get("receivedBy"),
                header.get("receivedAt"), header.get("deliveryNoteNo"), header.get("qcStatus"),
                header.get("documentStatus"), header.get("certificateStatus"),
                header.get("deliveryDocumentStatus"), "pending", null, null, null,
                "pending_confirmation", now, now);
        for (Map<String, Object> item : items) {
            String receiptItemId = "GRNI_" + java.util.UUID.randomUUID();
            jdbcTemplate.update("""
                    INSERT INTO goods_receipt_items (id,receipt_id,purchase_order_item_id,contract_id,
                                                    boq_version_id,boq_item_id,received_qty,accepted_qty,
                                                    rejected_qty,lot_no,qc_result,created_at,updated_at)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                    receiptItemId, receiptId, item.get("purchaseOrderItemId"), item.get("contractId"),
                    item.get("boqVersionId"), item.get("boqItemId"), item.get("actualQty"),
                    item.get("acceptedQty"), item.get("rejectedQty"), item.get("lotNo"),
                    item.get("qcResult"), now, now);
            if (((Number) item.get("acceptedQty")).doubleValue() > 0) {
                jdbcTemplate.update("""
                        INSERT INTO procurement_allocations (id,project_id,contract_id,boq_version_id,boq_item_id,
                                                             material_id,request_item_id,purchase_order_item_id,
                                                             receipt_item_id,stage,quantity,reference_no,
                                                             created_at,updated_at)
                        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                        "PAL_" + java.util.UUID.randomUUID(), header.get("projectId"), item.get("contractId"),
                        item.get("boqVersionId"), item.get("boqItemId"), item.get("materialId"),
                        item.get("requestItemId"), item.get("purchaseOrderItemId"), receiptItemId,
                        "RECEIPT", item.get("acceptedQty"), header.get("receiptNo"), now, now);
            }
            jdbcTemplate.update("""
                    UPDATE purchase_order_items SET delivered_qty=delivered_qty+?,
                           status=CASE WHEN delivered_qty+?+closed_qty>=ordered_qty THEN 'delivered_pending_confirmation'
                                       WHEN delivered_qty+?>0 THEN 'partial_delivery' ELSE 'ordered' END,
                           updated_at=? WHERE id=?""",
                    item.get("acceptedQty"), item.get("acceptedQty"), item.get("acceptedQty"), now,
                    item.get("purchaseOrderItemId"));
            jdbcTemplate.update("""
                    UPDATE material_request_items SET delivered_qty=delivered_qty+?,
                           line_status=CASE WHEN delivered_qty+?+closed_qty>=approved_purchase_qty
                                            THEN 'delivered_pending_confirmation'
                                            WHEN delivered_qty+?>0 THEN 'partial_delivery' ELSE line_status END,
                           updated_at=? WHERE id=?""",
                    item.get("acceptedQty"), item.get("acceptedQty"), item.get("acceptedQty"), now,
                    item.get("requestItemId"));
        }
    }

    @Override
    @Transactional
    public void updatePoStatusAndMr(String poId, String poStatus, boolean fullyDelivered, String requestId,
                                    String mrSupplyStatus, Instant now) {
        jdbcTemplate.update("""
                UPDATE purchase_orders SET status=?,delivery_completed_at=CASE WHEN ? THEN ? ELSE delivery_completed_at END,
                                           updated_at=? WHERE id=?""",
                poStatus, fullyDelivered ? 1 : 0, now, now, poId);
        jdbcTemplate.update("UPDATE material_requests SET supply_status=?,updated_at=? WHERE id=?",
                mrSupplyStatus, now, requestId);
    }

    @Override
    @Transactional
    public void insertBchConfirmationStep(String requestId, String poId, String receiptId,
                                          Instant now, long dueHours) {
        jdbcTemplate.update("""
                INSERT INTO supply_workflow_steps (id,request_id,purchase_order_id,receipt_id,step,status,
                                                   queued_at,due_at,completed_at,completed_by,comment,created_at,updated_at)
                VALUES (?,?,?,?,'bch_confirmation','pending',?,?,NULL,NULL,
                        'Chờ BCH kiểm tra ảnh, số lượng và hồ sơ giao hàng',?,?)""",
                "SWF_" + java.util.UUID.randomUUID(), requestId, poId, receiptId, now,
                now.plusSeconds(dueHours * 3600), now, now);
    }

    @Override
    public Optional<Map<String, Object>> poTotals(String purchaseOrderId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT COALESCE(SUM(ordered_qty),0) AS orderedQty,
                       COALESCE(SUM(received_qty),0) AS receivedQty,
                       COALESCE(SUM(closed_qty),0) AS closedQty
                FROM purchase_order_items WHERE purchase_order_id=?""", purchaseOrderId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    public Optional<Map<String, Object>> requestTotals(String requestId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT COALESCE(SUM(approved_purchase_qty),0) AS approvedQty,
                       COALESCE(SUM(received_qty),0) AS receivedQty,
                       COALESCE(SUM(closed_qty),0) AS closedQty
                FROM material_request_items WHERE request_id=?""", requestId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    public long countPendingReceipts(String purchaseOrderId, String excludeReceiptId) {
        return count("SELECT COUNT(*) FROM goods_receipts WHERE purchase_order_id=? AND id<>? AND bch_confirmation_status='pending'",
                purchaseOrderId, excludeReceiptId);
    }

    @Override
    public long countConfirmedReceiptExceptions(String purchaseOrderId, String excludeReceiptId) {
        return count("""
                SELECT COUNT(*) FROM goods_receipts
                WHERE purchase_order_id=? AND id<>? AND bch_confirmation_status='confirmed'
                  AND (certificate_status='missing' OR delivery_document_status='missing')""",
                purchaseOrderId, excludeReceiptId);
    }

    @Override
    public long countRequestReceiptExceptions(String requestId, String excludeReceiptId) {
        return count("""
                SELECT COUNT(*) FROM goods_receipts gr
                JOIN purchase_orders po ON po.id=gr.purchase_order_id
                WHERE po.request_id=? AND gr.id<>? AND gr.bch_confirmation_status='confirmed'
                  AND (gr.certificate_status='missing' OR gr.delivery_document_status='missing')""",
                requestId, excludeReceiptId);
    }

    @Override
    @Transactional
    public void updateReceiptConfirmed(String receiptId, String certificateStatus, String deliveryDocumentStatus,
                                       boolean documentsOk, String userId, String comment, Instant now) {
        jdbcTemplate.update("""
                UPDATE goods_receipts SET certificate_status=?,delivery_document_status=?,document_status=?,
                       bch_confirmation_status='confirmed',bch_confirmed_by=?,bch_confirmed_at=?,bch_comment=?,
                       posting_status=CASE WHEN qc_status='accepted' THEN 'posted' ELSE posting_status END,
                       updated_at=? WHERE id=?""",
                certificateStatus, deliveryDocumentStatus, documentsOk ? "complete" : "missing",
                userId, now, comment, now, receiptId);
    }

    @Override
    @Transactional
    public void completeBchConfirmationStep(String receiptId, String userId, String comment, Instant now) {
        jdbcTemplate.update("""
                UPDATE supply_workflow_steps SET status='completed',completed_at=?,completed_by=?,comment=?,updated_at=?
                WHERE receipt_id=? AND step='bch_confirmation' AND status='pending'""",
                now, userId, comment, now, receiptId);
    }

    @Override
    @Transactional
    public void updatePoReceivedStatus(String purchaseOrderId, String status, Instant now) {
        jdbcTemplate.update("UPDATE purchase_orders SET status=?,updated_at=? WHERE id=?", status, now, purchaseOrderId);
    }

    @Override
    @Transactional
    public void updateMrReceivedStatus(String requestId, String supplyStatus, Instant now) {
        jdbcTemplate.update("UPDATE material_requests SET supply_status=?,updated_at=? WHERE id=?",
                supplyStatus, now, requestId);
    }

    @Override
    @Transactional
    public void postGoodsReceipt(String receiptId, String poNo, String userId, Instant now) {
        List<Map<String, Object>> items = receiptItems(receiptId);
        Map<String, Object> receipt = findReceiptInfo(receiptId).orElse(Map.of());
        for (Map<String, Object> item : items) {
            double accepted = numberValue(item.get("acceptedQty"));
            if (accepted <= 0) continue;
            String materialId = sv(item, "materialId");
            String ownerContractId = sv(item, "contractId");
            if (ownerContractId.isEmpty()) ownerContractId = sv(receipt, "contractId");
            if (ownerContractId.isEmpty())
                throw new IllegalStateException("Phiếu nhập thiếu Contract ownership; dừng ghi sổ để tránh sai tồn kế toán.");
            // stock_movements idempotent
            jdbcTemplate.update("""
                    INSERT INTO stock_movements (id,project_id,contract_id,destination_contract_id,material_id,
                                                 from_warehouse_id,to_warehouse_id,movement_type,quantity,unit_cost,
                                                 occurred_at,reference_type,reference_id,posted_by,reversal_of_id,
                                                 created_at,updated_at)
                    SELECT ?,?,?,?,?,NULL,?,?,?,0,?,?,?,?,NULL,?,?
                    WHERE NOT EXISTS (SELECT 1 FROM stock_movements
                                      WHERE reference_type='goods_receipt' AND reference_id=? AND material_id=?)""",
                    "MOV_" + java.util.UUID.randomUUID(), sv(receipt, "projectId"), ownerContractId,
                    ownerContractId, materialId, sv(receipt, "warehouseId"), "GRN", accepted, now,
                    "goods_receipt", receiptId, userId, now, now, receiptId, materialId);
            // contract ledger
            jdbcTemplate.update("""
                    INSERT INTO contract_stock_ledger (id,project_id,contract_id,warehouse_id,material_id,
                                                       movement_type,quantity_delta,occurred_at,reference_type,
                                                       reference_id,reference_item_id,counterparty_contract_id,
                                                       actor_user_id,note,created_at)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,NULL,?,?,?)""",
                    "CSL_" + java.util.UUID.randomUUID(), sv(receipt, "projectId"), ownerContractId,
                    sv(receipt, "warehouseId"), materialId, "GRN", accepted, now, "goods_receipt",
                    receiptId, item.get("id"), userId, "Nhập theo " + poNo, now);
            jdbcTemplate.update("""
                    UPDATE purchase_order_items SET received_qty=received_qty+?,
                           status=CASE WHEN received_qty+?+closed_qty>=ordered_qty THEN 'received'
                                       ELSE 'partial_received' END,
                           updated_at=? WHERE id=?""",
                    accepted, accepted, now, item.get("purchaseOrderItemId"));
            jdbcTemplate.update("""
                    UPDATE material_request_items SET received_qty=received_qty+?,
                           line_status=CASE WHEN received_qty+?+closed_qty>=approved_purchase_qty THEN 'received'
                                            ELSE 'partial_received' END,
                           updated_at=? WHERE id=?""",
                    accepted, accepted, now, item.get("requestItemId"));
        }
    }

    private long count(String sql, Object... args) {
        Long n = jdbcTemplate.queryForObject(sql, Long.class, args);
        return n == null ? 0 : n;
    }

    private static double numberValue(Object o) {
        try { return o == null ? 0 : Double.parseDouble(String.valueOf(o)); }
        catch (NumberFormatException e) { return 0; }
    }

    private static String sv(Map<String, Object> m, String k) {
        Object v = m.get(k);
        if (v != null) return String.valueOf(v);
        for (Map.Entry<String, Object> e : m.entrySet()) {
            if (e.getKey().equalsIgnoreCase(k)) return String.valueOf(e.getValue());
        }
        return "";
    }
}
