package com.vntech.erp.application.port.out;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Port kho — port nguyên trạng issue_stock của monolith JS: tồn vật lý/giữ chỗ/contract,
 * phiếu xuất + movements + ledger + items + reservations release + MR tiến độ.
 */
public interface WarehouseStockStore {

    // ---- đọc ----
    Optional<Map<String, Object>> findTeam(String teamId, String projectId);
    Optional<Map<String, Object>> findRequestForIssue(String requestId, String projectId);
    Optional<Map<String, Object>> findActiveWarehouse(String warehouseId, String projectId);
    double stockBalance(String warehouseId, String materialId);
    double reservedBalance(String warehouseId, String materialId, String excludeRequestId);
    double contractBalance(String projectId, String contractId, String warehouseId, String materialId);
    Optional<Map<String, Object>> findRequestLine(String requestItemId, String requestId, String materialId);
    long nextSequenceNo(String key, String documentType, String projectId, int year, Instant now);

    // ---- ghi issue_stock (1 transaction) ----
    void insertStockIssue(Map<String, Object> header, List<Map<String, Object>> items, Instant now);
    /**
     * CỘNG DỒN số lượng đã lắp của MỘT dòng xuất kho.
     *
     * <p><b>SỬA LỖI (TASK-040 nhóm 4):</b> bản thi hành cũ dùng {@code SET installed_qty=?} — <b>GHI ĐÈ</b>,
     * trong khi JS `confirm_installation` (scripts/system-route.mjs:1520) dùng
     * {@code SET installed_qty=installed_qty+?} — <b>CỘNG DỒN</b> ⇒ xác nhận lắp nhiều lần sẽ ra sai số
     * (JS: 3+4=7; bản cũ: 4). Tham số {@code installedQty} ở đây là <b>phần tăng thêm</b>, không phải giá trị mới.
     * Đây là lỗi NGỮ NGHĨA nên cổng đối chiếu lược đồ không thể phát hiện (cột có thật).
     */
    void updateIssueItemInstalled(String issueItemId, double installedQty, Instant now);
    void updateRequestItemIssued(String requestItemId, double qty, double installedQty, Instant now);
    void releaseReservationsForRequest(String requestId, String materialId, String warehouseId, Instant now);
    void insertSupplyWorkflowStepIssued(String requestId, String issueId, Instant now, long dueHours);
    String postingStatusOf(String issueId);

    // ---- WF-XUATKHO-01 BƯỚC ② (TASK-132): CHỈ HUY TRƯỞNG duyệt phiếu xuất ----
    /** Header phiếu xuất để duyệt: id/issueNo/projectId/teamId/requestId/status/approvedBy/issuedBy. */
    Optional<Map<String, Object>> findStockIssue(String issueId);
    /**
     * Duyệt phiếu xuất ĐANG `pending_cht`: chuyển `stock_issues.status='approved'` + ghi `approved_by`,
     * và SINH 1 bản ghi `approvals` (entity_type='stock_issue', entity_id=issueId, stage=1,
     * approver_user_id=người duyệt, status='approved', decided_at=now) trong CÙNG transaction.
     *
     * @return {@code false} nếu phiếu KHÔNG ở trạng thái `pending_cht` (đã duyệt / phiếu cũ `posted`)
     *         ⇒ tầng use-case trả 400 «đã duyệt rồi»; {@code true} nếu duyệt thành công.
     */
    boolean approveStockIssue(String issueId, String userId, String department, String comment, Instant now);

    // ============ WF-XUATKHO-01 BƯỚC ③④⑤ (TASK-133) ============

    /**
     * Header phiếu xuất ĐẦY ĐỦ cho bước ③④⑤: id/issueNo/projectId/teamId/requestId/status/
     * approvedBy/issuedBy + {@code fromWarehouseId} + {@code toWarehouseId} (kho tổ đội, đích của
     * movement SMI) — đủ để ghi kho mà KHÔNG phải đọc lại payload.
     */
    Optional<Map<String, Object>> findStockIssueFull(String issueId);

    /** Các dòng của phiếu xuất (id/materialId/requestItemId/contractId/quantity/installedQty). */
    List<Map<String, Object>> stockIssueItems(String issueId);

    /**
     * Đếm số dòng movement SMI đã ghi cho phiếu xuất + tổng số lượng đã ghi.
     * Dùng cho (a) kiểm tra bước ③ đã ghi kho thật chưa trước khi cho xác nhận ④,
     * (b) chống ghi kho LẦN 2 (idempotent).
     */
    Map<String, Object> issuedMovementSummary(String issueId);

    /**
     * BƯỚC ③ — GHI KHO cho phiếu ĐÃ DUYỆT: mỗi dòng phiếu xuất sinh 1 movement {@code SMI}
     * (kho nguồn → kho tổ đội) + 2 dòng {@code contract_stock_ledger} (−qty kho nguồn, +qty kho tổ đội),
     * rồi chuyển {@code stock_issues.status} sang {@code issued}.
     *
     * <p>Chốt chặn nằm TRONG câu UPDATE ({@code WHERE status='approved'}) ⇒ gọi lần 2, gọi khi
     * {@code pending_cht}, hoặc gọi trên phiếu CŨ {@code posted} đều trả {@code false} (use-case ⇒ 400)
     * và KHÔNG ghi thêm movement nào (chống đua + chống ghi kho trùng).
     *
     * @return {@code false} nếu phiếu không còn ở {@code approved}.
     */
    boolean issueStockConfirm(String issueId, String userId, Instant now);

    /**
     * BƯỚC ④ — THỦ KHO XÁC NHẬN ĐÃ XUẤT ĐỦ: {@code issued} → {@code completed} + đóng dấu
     * {@code signed_at} (thời điểm ký nhận thực tế).
     *
     * <p>Chốt chặn trong UPDATE ({@code WHERE status='issued'}) ⇒ xác nhận lần 2 hoặc xác nhận khi
     * phiếu CHƯA qua bước ③ đều {@code false} (use-case ⇒ 400).
     */
    boolean confirmStockIssue(String issueId, String userId, String comment, Instant now);

    /**
     * Với mỗi dòng phiếu xuất, tìm DÒNG ĐẶT HÀNG (nếu có) của cùng {@code request_item_id} +
     * {@code material_id} — nguồn khoá ngoại hợp lệ cho {@code goods_receipt_items.purchase_order_item_id}
     * và {@code goods_receipts.purchase_order_id} (hai cột NOT NULL, KHÔNG có FK nhưng mọi truy vấn
     * bootstrap đều JOIN `goods_receipts gr JOIN purchase_orders po` ⇒ GRN thiếu PO sẽ VÔ HÌNH).
     * Phiếu cấp phát thuần kho không có PO ⇒ trả {@code purchaseOrderItemId}/{@code purchaseOrderId} rỗng.
     */
    List<Map<String, Object>> stockIssueGrnLines(String issueId);

    /**
     * BƯỚC ⑤ — SINH PHIẾU NHẬP (GRN) cho phiếu xuất ĐÃ XÁC NHẬN ĐỦ: 1 header {@code goods_receipts}
     * (kho đích = tham số {@code toWarehouseId}, {@code receipt_no} riêng dòng {@code GRN-PX}) +
     * 1 dòng {@code goods_receipt_items} cho mỗi dòng phiếu xuất. KHÔNG sinh vòng duyệt nào.
     */
    void insertStockIssueGrn(Map<String, Object> header, List<Map<String, Object>> items, Instant now);

    /**
     * BƯỚC ⑤ — chuyển phiếu xuất sang {@code grn_created} và trả về {@code true}.
     * Chốt chặn: {@code WHERE status='completed'} ⇒ phiếu chưa xác nhận đủ (hoặc đã sinh GRN rồi)
     * trả {@code false} (use-case ⇒ 400) và KHÔNG sinh thêm GRN.
     */
    boolean markStockIssueGrnCreated(String issueId, String receiptId, String userId, Instant now);

    // ---- return_stock / confirm_installation ----
    Optional<Map<String, Object>> resolveOwnershipContract(String projectId, String warehouseId, String materialId,
                                                           String requestedContractId);
    void insertMaterialReturn(Map<String, Object> header, List<Map<String, Object>> items,
                              boolean acceptedAny, Instant now);
    Optional<Map<String, Object>> findIssueItem(String issueItemId);   // issueItem + issue + team warehouse
    void updateRequestItemInstalledOnly(String requestItemId, double installedQty, Instant now);
    void insertInstallMovement(String issueId, String issueItemId, double quantity, String contractId,
                               String teamWarehouseId, String materialId, String projectId, String userId, Instant now);
    // ĐÃ XOÁ (TASK-040 nhóm 4): `updateIssueItemStatusInstalled` — ghi cột `stock_issue_items.status`
    // KHÔNG tồn tại và cũng KHÔNG có trong JS ⇒ hành vi tự thêm, đã bỏ hẳn.

    // ---- transfer orders ----
    Optional<Map<String, Object>> findWarehouseFull(String warehouseId);       // type, projectId
    Optional<Map<String, Object>> findTransitWarehouse();
    java.util.Optional<String> defaultContractId(String projectId);
    Optional<Map<String, Object>> findTransferOrder(String transferId);        // full header
    List<Map<String, Object>> transferOrderItems(String transferId);
    void insertTransferOrder(Map<String, Object> header, List<Map<String, Object>> items, Instant now);
    void setTransferApproved(String transferId, String userId, Instant now);
    void shipTransfer(String transferId, List<Map<String, Object>> items, String transitWarehouseId,
                      String sourceProjectId, String userId, Instant now);
    void receiveTransfer(String transferId, List<Map<String, Object>> updates, Map<String, Object> context,
                         long lostTotal, String userId, Instant now);
    void insertOwnershipTransfer(Map<String, Object> ot, Instant now);

    // ---- central returns ----
    Optional<Map<String, Object>> findCentralWarehouse();
    Optional<Map<String, Object>> findCentralReturn(String returnId);
    List<Map<String, Object>> centralReturnItems(String returnId);
    long centralReturnImageCount(String returnId);
    void insertCentralReturn(Map<String, Object> header, List<Map<String, Object>> items, Instant now);
    void approveCentralReturnWithShip(String returnId, String reason, String transitWarehouseId,
                                      Map<String, Object> context, List<Map<String, Object>> items,
                                      String userId, Instant now);
    void receiveCentralReturn(String returnId, List<Map<String, Object>> updates, Map<String, Object> context,
                              long acceptedTotal, long rejectedTotal, String userId, Instant now);

    // ---- stocktake ----
    Optional<Map<String, Object>> findWarehouseById(String warehouseId);
    Optional<Map<String, Object>> findStockCount(String countId);
    List<Map<String, Object>> stockCountItems(String countId);
    void insertStockCount(String countId, String countNo, String projectId, String warehouseId,
                          String countType, List<Map<String, Object>> items, String userId, Instant now);
    void approveStockCountAdjustments(String countId, List<Map<String, Object>> items, String projectId,
                                      String warehouseId, String userId, Instant now);

    // ---- reconcile / ownership transfer / reverse ----
    List<Map<String, Object>> reconcilePhysicalVsContract(String warehouseId, String projectId);
    void insertReconciliation(Map<String, Object> row, String userId, String note, Instant now);
    Optional<Map<String, Object>> findStockMovement(String movementId);
    Optional<Map<String, Object>> findReversal(String movementId);
    void insertMovementReversal(Map<String, Object> reverse, Instant now);
    void updateMovementReversalMarker(String movementId, Instant now);
    void insertContractLedgerRow(Map<String, Object> row, Instant now);
    Optional<Map<String, Object>> findContractActive(String contractId);
    String nextOwnershipTransferNo(int year);
    void recordOwnershipTransferLite(Map<String, Object> ot, Instant now);
}