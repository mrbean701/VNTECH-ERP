package com.vntech.erp.application.port.out;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/** Port SLA compliance — quét workflow steps + payment plans quá hạn. */
public interface SlaStore {

    List<Map<String, Object>> overdueSupplySteps(Instant now);
    void markStepOverdue(String stepId, Instant now);
    int markPaymentPlansOverdue(String today);
    List<Map<String, Object>> pendingBchConfirmations();
    Map<String, Object> slaSettings();
}