package com.vntech.erp.application.port.out;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Port mua hàng (PO) — port nguyên trạng create_po/close_po_line của monolith JS:
 * tách PO theo nhà cung cấp, sequence PO-<PROJECT>-<YEAR>-NNNN, MAR check, availability override,
 * procurement_allocations, supply_workflow_steps po_creation.
 */
public interface PurchaseStore {

    // ---- đọc ----
    Optional<Map<String, Object>> findApprovedRequest(String requestId);   // MR approved + project/requester info
    Optional<Map<String, Object>> findWarehouse(String warehouseId, String projectId); // active + đúng project
    List<Map<String, Object>> requestSourceItems(String requestId);        // mri + material (requires_mar, system)
    Optional<Map<String, Object>> findMaterial(String materialId);
    Optional<Map<String, Object>> findMarApproval(String projectId, String materialId); // material_mar_approvals
    Optional<Map<String, Object>> findOtherAvailableStock(String materialId, String excludeWarehouseId); // tồn nơi khác
    boolean supplierActive(String supplierId);
    long nextSequence(String key, String documentType, String projectId, int year, Instant now);
    long supplyPoSlaHours();

    // ---- ghi (1 transaction create_po) ----
    void insertPurchaseOrderWithItems(String poId, String poNo, String requestId, String projectId,
                                      String contractId, String boqVersionId, String supplierId,
                                      String warehouseId, String buyerUserId, String eta, String status,
                                      List<Map<String, Object>> items, String allocationProjectId,
                                      String allocationContractId, String allocationBoqVersionId,
                                      String requestNo, Instant now);

    void updateRequestItemOrdered(String requestItemId, double qty, boolean orderedComplete, Instant now);
    void updateRequestSupplyStatus(String requestId, String supplyStatus, Instant now);
    void insertSupplyWorkflowStepPoCreation(String requestId, String poId, String comment, Instant now,
                                            long dueHours);
    void updatePendingPoCreationStep(String requestId, String poId, String comment, Instant now);
    void insertPendingPoCreationStep(String requestId, long dueHours, String comment, Instant now);

    // ---- close_po_line ----
    Optional<Map<String, Object>> findPoLine(String poItemId);              // + po/request context
    void closePoLine(String poItemId, double shortage, String reason, String userId, Instant now);

    /** [WF] PHASE 8 (B2) — QUYẾT ĐỊNH PO + (tuỳ chọn) thông báo người tạo, trong MỘT giao dịch (work_item_id = poId). */
    void decidePo(String poId, String status, String reason, String userId, String notifyUserId,
            String notifyTitle, String notifyBody, Instant now);

    /** [WF] PHASE 8 (B2/b3) — SỬA GIÁ một dòng PO (chỉ khi PO CHƯA hoàn thành; gọi trong 1 giao dịch). */
    void updatePoItemPrice(String poId, String poItemId, double unitPrice, Instant now);
    void closeRequestItemForShortage(String requestItemId, double shortage, String reason, Instant now);
    long countPoOpenLines(String purchaseOrderId);
    long countRequestOpenLines(String requestId);
    void completePoWithShortage(String purchaseOrderId, Instant now);
    void completeRequestWithShortage(String requestId, Instant now);

    // ---- receive_goods / confirm_delivery ----
    Optional<Map<String, Object>> findPoForReceiving(String poId);          // po + request + project info
    List<Map<String, Object>> poItemsForReceiving(String poId);             // poi + mri material
    Optional<Map<String, Object>> findReceiptInfo(String receiptId);        // gr + po + request + project
    List<Map<String, Object>> receiptItems(String receiptId);               // gri + poi + mri material
    long goodsReceiptImageCount(String receiptId);                          // attachments image/
    Optional<Map<String, Object>> poTotals(String purchaseOrderId);
    Optional<Map<String, Object>> requestTotals(String requestId);
    long countPendingReceipts(String purchaseOrderId, String excludeReceiptId);
    long countConfirmedReceiptExceptions(String purchaseOrderId, String excludeReceiptId);
    long countRequestReceiptExceptions(String requestId, String excludeReceiptId);

    /** Ghi receipt header + items + allocations + cập nhật delivered (toàn bộ trong 1 transaction). */
    void insertGoodsReceipt(Map<String, Object> header, List<Map<String, Object>> items, Instant now);
    void updatePoStatusAndMr(String poId, String poStatus, boolean fullyDelivered, String requestId,
                             String mrSupplyStatus, Instant now);
    void insertBchConfirmationStep(String requestId, String poId, String receiptId,
                                   Instant now, long dueHours);
    void updateReceiptConfirmed(String receiptId, String certificateStatus, String deliveryDocumentStatus,
                                boolean documentsOk, String userId, String comment, Instant now);
    void completeBchConfirmationStep(String receiptId, String userId, String comment, Instant now);
    void updatePoReceivedStatus(String purchaseOrderId, String status, Instant now);
    void updateMrReceivedStatus(String requestId, String supplyStatus, Instant now);
    /** Nhập kho: stock_movements (idempotent) + contract ledger + received_qty. */
    void postGoodsReceipt(String receiptId, String poNo, String userId, Instant now);
}