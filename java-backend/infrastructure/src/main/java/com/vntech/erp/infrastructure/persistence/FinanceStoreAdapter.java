package com.vntech.erp.infrastructure.persistence;

import com.vntech.erp.application.port.out.FinanceStore;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/** Adapter Tài chính. */
@Component
public class FinanceStoreAdapter implements FinanceStore {

    private final JdbcTemplate jdbcTemplate;

    public FinanceStoreAdapter(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private Optional<Map<String, Object>> first(String sql, Object... args) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, args);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    // ---------- payment plans ----------
    @Override
    public Optional<Map<String, Object>> findPaymentPlan(String id) {
        return first("SELECT * FROM payment_plans WHERE id=?", id);
    }

    @Override
    public String nextPaymentPlanNo(String projectId, String yearPrefix) {
        Long n = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)+1 FROM payment_plans WHERE project_id=? AND substr(COALESCE(planned_date,''),1,4)=?""",
                Long.class, projectId, yearPrefix);
        return n == null ? "1" : String.valueOf(n);
    }

    @Override
    @Transactional
    public void insertPaymentPlan(String id, String planNo, String projectId, String contractId, String poId,
                                  String milestone, String plannedDate, double plannedAmount, String status,
                                  String note, String createdBy, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO payment_plans (id,plan_no,project_id,contract_id,po_id,milestone,planned_date,
                                           planned_amount,paid_amount,status,note,created_by,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,?,0,?,?,?,?,?)""",
                id, planNo, projectId, contractId, poId, milestone, plannedDate, plannedAmount,
                status, note, createdBy, now, now);
    }

    @Override
    @Transactional
    public void updatePaymentPlan(String id, String contractId, String poId, String milestone, String plannedDate,
                                  double plannedAmount, String note, Instant now) {
        jdbcTemplate.update("""
                UPDATE payment_plans SET contract_id=?,po_id=?,milestone=?,planned_date=?,planned_amount=?,
                       note=?,updated_at=? WHERE id=?""",
                contractId, poId, milestone, plannedDate, plannedAmount, note, now, id);
    }

    @Override
    @Transactional
    public void setPaymentPlanStatus(String id, String status, double paidAmount, Instant now) {
        jdbcTemplate.update("UPDATE payment_plans SET status=?,paid_amount=?,updated_at=? WHERE id=?",
                status, paidAmount, now, id);
    }

    @Override
    @Transactional
    public void deletePaymentPlan(String id) {
        jdbcTemplate.update("DELETE FROM payment_plans WHERE id=?", id);
    }

    // ---------- advance requests ----------
    @Override
    public Optional<Map<String, Object>> findAdvanceRequest(String id) {
        return first("SELECT * FROM advance_requests WHERE id=?", id);
    }

    @Override
    public String nextAdvanceRequestNo() {
        Long n = jdbcTemplate.queryForObject("SELECT COUNT(*)+1 FROM advance_requests", Long.class);
        return n == null ? "1" : String.valueOf(n);
    }

    @Override
    @Transactional
    public void insertAdvanceRequest(String id, String requestNo, String projectId, String requesterId, double amount,
                                     String purpose, String category, String status, String note, String createdBy,
                                     Instant now) {
        jdbcTemplate.update("""
                INSERT INTO advance_requests (id,request_no,project_id,requester_id,amount,purpose,category,status,
                                              advance_paid,settlement_value,note,created_by,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,?,0,0,?,?,?,?)""",
                id, requestNo, projectId, requesterId, amount, purpose, category, status, note, createdBy, now, now);
    }

    @Override
    @Transactional
    public void updateAdvanceRequest(String id, String projectId, String requesterId, double amount, String purpose,
                                     String category, String note, String status, Instant now) {
        jdbcTemplate.update("""
                UPDATE advance_requests SET project_id=?,requester_id=?,amount=?,purpose=?,category=?,note=?,
                       status=?,updated_at=? WHERE id=?""",
                projectId, requesterId, amount, purpose, category, note, status, now, id);
    }

    @Override
    @Transactional
    public void settleAdvanceRequest(String id, double advancePaid, double settlementValue, Instant now) {
        jdbcTemplate.update("""
                UPDATE advance_requests SET advance_paid=?,settlement_value=?,status='settled',settled_at=?,
                       updated_at=? WHERE id=?""", advancePaid, settlementValue, now, now, id);
    }

    @Override
    @Transactional
    public void deleteAdvanceRequest(String id) {
        jdbcTemplate.update("DELETE FROM advance_requests WHERE id=?", id);
    }

    // ---------- site expense claims ----------
    @Override
    public Optional<Map<String, Object>> findSiteExpenseClaim(String id) {
        return first("SELECT * FROM site_expense_claims WHERE id=?", id);
    }

    @Override
    public String nextExpenseClaimNo(String projectId) {
        Long n = jdbcTemplate.queryForObject(
                "SELECT COUNT(*)+1 FROM site_expense_claims", Long.class);
        return n == null ? "1" : String.valueOf(n);
    }

    @Override
    @Transactional
    public void insertSiteExpenseClaim(String id, String claimNo, String projectId, String costType, double amount,
                                       String paidBy, String claimDate, String description, String voucherAttachmentId,
                                       String status, String createdBy, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO site_expense_claims (id,claim_no,project_id,cost_type,amount,paid_by,claim_date,
                                                 description,voucher_attachment_id,status,created_by,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                id, claimNo, projectId, costType, amount, paidBy, claimDate, description,
                voucherAttachmentId, status, createdBy, now, now);
    }

    @Override
    @Transactional
    public void updateSiteExpenseClaim(String id, String costType, double amount, String paidBy, String claimDate,
                                       String description, String voucherAttachmentId, String status, Instant now) {
        jdbcTemplate.update("""
                UPDATE site_expense_claims SET cost_type=?,amount=?,paid_by=?,claim_date=?,description=?,
                       voucher_attachment_id=?,status=?,updated_at=? WHERE id=?""",
                costType, amount, paidBy, claimDate, description, voucherAttachmentId, status, now, id);
    }

    @Override
    @Transactional
    public void approveSiteExpenseClaim(String id, String approvedBy, Instant now) {
        jdbcTemplate.update("""
                UPDATE site_expense_claims SET status='approved',approved_by=?,approved_at=?,updated_at=? WHERE id=?""",
                approvedBy, now, now, id);
    }

    @Override
    @Transactional
    public void deleteSiteExpenseClaim(String id) {
        jdbcTemplate.update("DELETE FROM site_expense_claims WHERE id=?", id);
    }

    // ---------- bank / cashbook / vouchers ----------
    @Override
    public Optional<Map<String, Object>> findBankAccount(String id) {
        return first("SELECT * FROM bank_accounts WHERE id=?", id);
    }

    @Override
    public Optional<Map<String, Object>> findBankAccountByCode(String code) {
        return first("SELECT id FROM bank_accounts WHERE code=?", code);
    }

    @Override
    @Transactional
    public void insertBankAccount(String id, String code, String bankName, String accountNo, String branch,
                                  String currency, double openingBalance, String createdBy, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO bank_accounts (id,code,bank_name,account_no,branch,currency,opening_balance,active,
                                           created_by,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,1,?,?,?)""",
                id, code, bankName, accountNo, branch, currency, openingBalance, createdBy, now, now);
    }

    @Override
    @Transactional
    public void updateBankAccount(String id, String code, String bankName, String accountNo, String branch,
                                  String currency, double openingBalance, Instant now) {
        jdbcTemplate.update("""
                UPDATE bank_accounts SET code=?,bank_name=?,account_no=?,branch=?,currency=?,opening_balance=?,updated_at=?
                WHERE id=?""", code, bankName, accountNo, branch, currency, openingBalance, now, id);
    }

    @Override
    public Optional<Map<String, Object>> findCashbookEntry(String id) {
        return first("SELECT * FROM cashbook_entries WHERE id=?", id);
    }

    @Override
    public String nextCashbookEntryNo() {
        Long n = jdbcTemplate.queryForObject("SELECT COUNT(*)+1 FROM cashbook_entries", Long.class);
        return n == null ? "1" : String.valueOf(n);
    }

    @Override
    @Transactional
    public void insertCashbookEntry(String id, String entryNo, String entryDate, String accountId, String entryType,
                                    double amount, String counterparty, String referenceType, String referenceId,
                                    String note, String createdBy, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO cashbook_entries (id,entry_no,entry_date,account_id,entry_type,amount,counterparty,
                                              reference_type,reference_id,note,created_by,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                id, entryNo, entryDate, accountId, entryType, amount, counterparty, referenceType, referenceId,
                note, createdBy, now, now);
    }

    @Override
    @Transactional
    public void updateCashbookEntry(String id, String entryDate, String accountId, String entryType, double amount,
                                    String counterparty, String referenceType, String referenceId, String note,
                                    Instant now) {
        jdbcTemplate.update("""
                UPDATE cashbook_entries SET entry_date=?,account_id=?,entry_type=?,amount=?,counterparty=?,
                       reference_type=?,reference_id=?,note=?,updated_at=? WHERE id=?""",
                entryDate, accountId, entryType, amount, counterparty, referenceType, referenceId, note, now, id);
    }

    @Override
    @Transactional
    public void deleteCashbookEntry(String id) {
        jdbcTemplate.update("DELETE FROM cashbook_entries WHERE id=?", id);
    }

    @Override
    public Optional<Map<String, Object>> findAccountingVoucher(String id) {
        return first("SELECT * FROM accounting_vouchers WHERE id=?", id);
    }

    @Override
    public String nextVoucherNo(String yearPrefix) {
        Long n = jdbcTemplate.queryForObject(
                "SELECT COUNT(*)+1 FROM accounting_vouchers WHERE substr(voucher_date,1,4)=?", Long.class, yearPrefix);
        return n == null ? "1" : String.valueOf(n);
    }

    @Override
    @Transactional
    public void insertAccountingVoucher(String id, String voucherNo, String voucherDate, String voucherType,
                                        String projectId, String description, double totalAmount, String filesJson,
                                        String createdBy, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO accounting_vouchers (id,voucher_no,voucher_date,voucher_type,project_id,description,
                                                 total_amount,status,files_json,created_by,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,'draft',?,?,?,?)""",
                id, voucherNo, voucherDate, voucherType, projectId, description, totalAmount, filesJson,
                createdBy, now, now);
    }

    @Override
    @Transactional
    public void updateAccountingVoucher(String id, String voucherDate, String voucherType, String projectId,
                                        String description, double totalAmount, String filesJson, Instant now) {
        jdbcTemplate.update("""
                UPDATE accounting_vouchers SET voucher_date=?,voucher_type=?,project_id=?,description=?,
                       total_amount=?,files_json=?,updated_at=? WHERE id=?""",
                voucherDate, voucherType, projectId, description, totalAmount, filesJson, now, id);
    }

    @Override
    @Transactional
    public void deleteAccountingVoucher(String id) {
        jdbcTemplate.update("DELETE FROM accounting_vouchers WHERE id=?", id);
    }
}