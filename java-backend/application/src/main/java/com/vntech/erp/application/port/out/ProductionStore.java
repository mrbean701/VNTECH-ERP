package com.vntech.erp.application.port.out;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/** Port Sản lượng & Thu hồi vốn — port nguyên trạng production/recovery/payment JS. */
public interface ProductionStore {

    Optional<Map<String, Object>> findProductionReport(String id);
    boolean productionReportPeriodDuplicate(String projectId, String reportPeriod, String excludeId);
    void insertProductionReport(String id, String projectId, String reportPeriod, String referenceNo,
                                String description, double plannedValue, double actualValue, String submittedBy,
                                Instant now);
    void updateProductionReport(String id, String reportPeriod, String referenceNo, String description,
                                double plannedValue, double actualValue, String submittedBy, boolean approvedKeep,
                                Instant now);
    void approveProductionReport(String id, double approvedValue, String approvedBy, Instant now);
    Optional<Map<String, Object>> findCapitalRecovery(String id);
    Optional<Map<String, Object>> findApprovedProductionReport(String id, String projectId);
    void insertCapitalRecovery(String id, String projectId, String periodKey, String referenceNo,
                               String productionReportId, double submittedValue, double approvedValue,
                               String invoiceNo, double invoiceValue, String dueDate, String status, String note,
                               String createdBy, Instant now);
    void updateCapitalRecovery(String id, String periodKey, String referenceNo, String productionReportId,
                               double submittedValue, double approvedValue, String invoiceNo, double invoiceValue,
                               String dueDate, String status, String note, Instant now);
    long countRecoveryPayments(String recoveryId);
    void deleteCapitalRecovery(String id);
    Optional<Map<String, Object>> findContractPayment(String id);
    Optional<Map<String, Object>> findRecoveryForPayment(String recoveryRecordId, String projectId);
    void insertContractPayment(String id, String projectId, String recoveryRecordId, String paymentDate,
                               String referenceNo, String description, double amount, String note,
                               String createdBy, Instant now);
    void updateContractPayment(String id, String recoveryRecordId, String paymentDate, String referenceNo,
                               String description, double amount, String note, Instant now);
    void deleteContractPayment(String id);

    // ---- import payments / team subcontract ----
    void insertPaymentBulk(String id, String projectId, String paymentDate, String referenceNo,
                           String description, double amount, String note, String createdBy, Instant now);
    Optional<Map<String, Object>> findTeam(String teamId, String projectId);
    Optional<Map<String, Object>> findSubcontractNoDuplicate(String projectId, String contractNo);
    void insertTeamSubcontract(String id, String projectId, String teamId, String contractNo, String contractName,
                               String scopeText, double contractValue, String startDate, String endDate,
                               String note, String createdBy, Instant now);
    Optional<Map<String, Object>> findSubcontract(String id);
    double sumApprovedProduction(String subcontractId, String excludeId);
    Optional<Map<String, Object>> findTeamProduction(String id);
    void insertTeamProduction(String id, String projectId, String teamId, String subcontractId, String periodKey,
                              String referenceNo, String description, double submittedValue, double approvedValue,
                              String submittedBy, Instant now);
    void approveTeamProduction(String id, String approvedBy, Instant now);
    double sumTeamPayments(String subcontractId);
    void insertTeamPayment(String id, String projectId, String teamId, String subcontractId, String productionRecordId,
                           String paymentDate, String paymentType, String referenceNo, String description,
                           double amount, String note, String createdBy, Instant now);
    long teamHeldStockLines(String teamId);
    void insertTeamSettlement(String id, String projectId, String teamId, String subcontractId, String settlementNo,
                              double approvedProductionValue, double adjustmentValue, double finalValue,
                              double paidValue, double remainingValue, String note, String createdBy, Instant now);
    /**
     * Đánh dấu hợp đồng giao khoán đã quyết toán.
     *
     * <p><b>SỬA LỖI (TASK-040 nhóm 5):</b> bản cũ nhận thêm {@code settlementId} và ghi
     * {@code settlement_id}/{@code settled_at} — hai cột <b>KHÔNG tồn tại</b> trong `team_subcontracts`
     * ⇒ HTTP 500 ở action `settle_subcontract`. JS (scripts/system-route.mjs:1250) chỉ ghi {@code status} +
     * {@code updated_at}; liên kết tới phiếu quyết toán nằm ở phía `team_settlements.subcontract_id`.
     */
    void settleSubcontract(String subcontractId, Instant now);

    // ---- construction daily logs ----
    Optional<Map<String, Object>> findDailyLog(String id);
    String dailyLogSequenceNo(String projectId, String yearPrefix);
    void insertDailyLog(String id, String logNo, String projectId, String warehouseId, String workDate,
                        String shift, String weather, String workContent, int laborCount, String equipmentNote,
                        String status, String submittedBy, String createdBy, Instant now);
    void updateDailyLog(String id, String workDate, String shift, String weather, String workContent,
                        int laborCount, String equipmentNote, String note, String warehouseId, String status,
                        String submittedBy, Instant now);
    void replaceDailyLogItems(String logId, List<Map<String, Object>> items, Instant now);
    void approveDailyLog(String id, String approvedBy, Instant now);
    void deleteDailyLog(String id);
    Optional<Map<String, Object>> findProjectCode(String projectId);
}