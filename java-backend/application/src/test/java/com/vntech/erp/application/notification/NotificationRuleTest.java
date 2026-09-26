package com.vntech.erp.application.notification;

import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * MT2 §15.1 — RULE tách riêng khỏi service: chỉ chọn cấu hình khớp {@code eventKey}
 * và thuộc kênh Web/Email; ⛔ không bịa thông báo khi không khớp.
 */
class NotificationRuleTest {

    private final NotificationRule rule = new NotificationRule();

    private static Map<String, Object> config(String code, String channel) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("code", code);
        row.put("channel", channel);
        return row;
    }

    @Test
    void onlyMatchingEventAndSupportedChannelIsSelected() {
        List<Map<String, Object>> active = List.of(
                config("PR_APPROVED", "web"),
                config("PR_APPROVED", "email"),
                config("PO_APPROVED", "web"),
                config("PR_APPROVED", "sms"));

        List<Map<String, Object>> matched = rule.activeConfigsFor("PR_APPROVED", active);

        assertEquals(2, matched.size(), "chỉ lấy đúng mã cấu hình và kênh web/email");
        assertTrue(matched.stream().allMatch(row -> "PR_APPROVED".equals(row.get("code"))));
    }

    @Test
    void unknownEventOrEmptyKeyProducesNoNotification() {
        List<Map<String, Object>> active = List.of(config("PR_APPROVED", "web"));
        assertTrue(rule.activeConfigsFor("KHONG_CO", active).isEmpty(), "mã lạ ⇒ rỗng, ⛔ không bịa");
        assertTrue(rule.activeConfigsFor("", active).isEmpty(), "eventKey rỗng ⇒ rỗng");
        assertTrue(rule.activeConfigsFor("PR_APPROVED", List.of()).isEmpty(), "không cấu hình ⇒ rỗng");
    }
}
