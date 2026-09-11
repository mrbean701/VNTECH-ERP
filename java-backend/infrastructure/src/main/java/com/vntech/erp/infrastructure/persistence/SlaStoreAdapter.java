package com.vntech.erp.infrastructure.persistence;

import com.vntech.erp.application.port.out.SlaStore;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Adapter SLA compliance. */
@Component
public class SlaStoreAdapter implements SlaStore {

    private final JdbcTemplate jdbcTemplate;

    public SlaStoreAdapter(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public List<Map<String, Object>> overdueSupplySteps(Instant now) {
        return jdbcTemplate.queryForList("""
                SELECT id,request_id AS requestId,step,due_at AS dueAt,status
                FROM supply_workflow_steps
                WHERE status='pending' AND due_at<? ORDER BY due_at""", now);
    }

    @Override
    @Transactional
    public void markStepOverdue(String stepId, Instant now) {
        jdbcTemplate.update("""
                UPDATE supply_workflow_steps SET status='overdue',overdue_at=?,updated_at=?
                WHERE id=? AND status='pending'""", now, now, stepId);
    }

    @Override
    @Transactional
    public int markPaymentPlansOverdue(String today) {
        return jdbcTemplate.update("""
                UPDATE payment_plans SET status='overdue',updated_at=?
                WHERE status='planned' AND planned_date<?""", Instant.now(), today);
    }

    @Override
    public List<Map<String, Object>> pendingBchConfirmations() {
        return jdbcTemplate.queryForList("""
                SELECT swf.id AS stepId,swf.request_id AS requestId,gr.receipt_no AS receiptNo,
                       gr.id AS receiptId,swf.due_at AS dueAt,gr.document_status AS documentStatus
                FROM supply_workflow_steps swf
                JOIN goods_receipts gr ON gr.id=swf.receipt_id
                WHERE swf.step='bch_confirmation' AND swf.status IN ('pending','overdue')
                  AND gr.bch_confirmation_status='pending'""");
    }

    @Override
    public Map<String, Object> slaSettings() {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT po_sla_hours AS poSla,bch_confirmation_sla_hours AS bchSla
                FROM company_settings WHERE id='SETTINGS'""");
        Map<String, Object> out = new LinkedHashMap<>();
        if (!rows.isEmpty()) out = new LinkedHashMap<>(rows.get(0));
        out.putIfAbsent("poSla", 24L);
        out.putIfAbsent("bchSla", 8L);
        return out;
    }
}