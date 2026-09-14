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
    void updateIssueItemInstalled(String issueItemId, double installedQty, Instant now);
    void updateRequestItemIssued(String requestItemId, double qty, double installedQty, Instant now);
    void releaseReservationsForRequest(String requestId, String materialId, String warehouseId, Instant now);
    void insertSupplyWorkflowStepIssued(String requestId, String issueId, Instant now, long dueHours);
    String postingStatusOf(String issueId);

    // ---- return_stock / confirm_installation ----
    Optional<Map<String, Object>> resolveOwnershipContract(String projectId, String warehouseId, String materialId,
                                                           String requestedContractId);
    void insertMaterialReturn(Map<String, Object> header, List<Map<String, Object>> items,
                              boolean acceptedAny, Instant now);
    Optional<Map<String, Object>> findIssueItem(String issueItemId);   // issueItem + issue + team warehouse
    void updateRequestItemInstalledOnly(String requestItemId, double installedQty, Instant now);
    void insertInstallMovement(String issueId, String issueItemId, double quantity, String contractId,
                               String teamWarehouseId, String materialId, String projectId, String userId, Instant now);
    void updateIssueItemStatusInstalled(String issueItemId, Instant now);

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