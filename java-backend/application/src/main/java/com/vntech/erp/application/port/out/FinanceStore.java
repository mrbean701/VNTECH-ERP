package com.vntech.erp.application.port.out;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;

/** Port Tài chính — port nguyên trạng payment plan / advance / site expense JS. */
public interface FinanceStore {

    Optional<Map<String, Object>> findPaymentPlan(String id);
    String nextPaymentPlanNo(String projectId, String yearPrefix);
    void insertPaymentPlan(String id, String planNo, String projectId, String contractId, String poId,
                           String milestone, String plannedDate, double plannedAmount, String status,
                           String note, String createdBy, Instant now);
    void updatePaymentPlan(String id, String contractId, String poId, String milestone, String plannedDate,
                           double plannedAmount, String note, Instant now);
    void setPaymentPlanStatus(String id, String status, double paidAmount, Instant now);
    void deletePaymentPlan(String id);

    Optional<Map<String, Object>> findAdvanceRequest(String id);
    String nextAdvanceRequestNo();
    void insertAdvanceRequest(String id, String requestNo, String projectId, String requesterId, double amount,
                              String purpose, String category, String status, String note, String createdBy,
                              Instant now);
    void updateAdvanceRequest(String id, String projectId, String requesterId, double amount, String purpose,
                              String category, String note, String status, Instant now);
    void settleAdvanceRequest(String id, double advancePaid, double settlementValue, Instant now);
    void deleteAdvanceRequest(String id);

    Optional<Map<String, Object>> findSiteExpenseClaim(String id);
    String nextExpenseClaimNo(String projectId);
    void insertSiteExpenseClaim(String id, String claimNo, String projectId, String costType, double amount,
                                String paidBy, String claimDate, String description, String voucherAttachmentId,
                                String status, String createdBy, Instant now);
    void updateSiteExpenseClaim(String id, String costType, double amount, String paidBy, String claimDate,
                                String description, String voucherAttachmentId, String status, Instant now);
    void approveSiteExpenseClaim(String id, String approvedBy, Instant now);
    void deleteSiteExpenseClaim(String id);

    // ---- bank / cashbook / vouchers ----
    Optional<Map<String, Object>> findBankAccount(String id);
    Optional<Map<String, Object>> findBankAccountByCode(String code);
    void insertBankAccount(String id, String code, String bankName, String accountNo, String branch,
                           String currency, double openingBalance, String createdBy, Instant now);
    void updateBankAccount(String id, String code, String bankName, String accountNo, String branch,
                           String currency, double openingBalance, Instant now);
    Optional<Map<String, Object>> findCashbookEntry(String id);
    String nextCashbookEntryNo();
    void insertCashbookEntry(String id, String entryNo, String entryDate, String accountId, String entryType,
                             double amount, String counterparty, String referenceType, String referenceId,
                             String note, String createdBy, Instant now);
    void updateCashbookEntry(String id, String entryDate, String accountId, String entryType, double amount,
                             String counterparty, String referenceType, String referenceId, String note, Instant now);
    void deleteCashbookEntry(String id);
    Optional<Map<String, Object>> findAccountingVoucher(String id);
    String nextVoucherNo(String yearPrefix);
    void insertAccountingVoucher(String id, String voucherNo, String voucherDate, String voucherType,
                                 String projectId, String description, double totalAmount, String filesJson,
                                 String createdBy, Instant now);
    void updateAccountingVoucher(String id, String voucherDate, String voucherType, String projectId,
                                 String description, double totalAmount, String filesJson, Instant now);
    void deleteAccountingVoucher(String id);
}