package com.vntech.erp.infrastructure.worker;

import com.vntech.erp.application.port.out.SlaStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * SlaComplianceWorker — port chính sách SLA của monolith JS (worker nền):
 *  1) supply_workflow_steps pending quá due_at → status 'overdue'
 *  2) payment_plans planned quá hạn → 'overdue'
 *  3) đếm BCH chờ xác nhận quá hạn (telemetry/log để cảnh báo)
 * Chạy mỗi giờ; idempotent.
 */
@Component
public class SlaComplianceWorker {

    private static final Logger log = LoggerFactory.getLogger(SlaComplianceWorker.class);

    private final SlaStore store;

    public SlaComplianceWorker(SlaStore store) {
        this.store = store;
    }

    @Scheduled(fixedDelay = 3_600_000, initialDelay = 60_000)
    public void run() {
        try {
            Instant now = Instant.now();
            List<Map<String, Object>> steps = store.overdueSupplySteps(now);
            int overdue = 0;
            for (Map<String, Object> step : steps) {
                store.markStepOverdue(String.valueOf(step.get("id")), now);
                overdue++;
            }
            int paymentOverdue = store.markPaymentPlansOverdue(LocalDate.now().toString());
            int pendingBch = store.pendingBchConfirmations().size();
            log.info("SLA worker: {} supply steps quá hạn; {} payment plans quá hạn; {} BCH chờ xác nhận.",
                    overdue, paymentOverdue, pendingBch);
        } catch (Exception e) {
            log.warn("SLA worker lỗi do hệ thống tạm thời; bỏ qua lượt này và thử lại sau: {}", e.getMessage());
        }
    }
}