package com.vntech.erp.application.notification;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * MT2 §15.1 — **RULE** của Notification Engine.
 *
 * <p>Luật KHÔNG hard-code trong service: cấu hình nằm ở bảng {@code notification_configs}
 * (mã · kênh · thời gian hiệu lực). Lớp này chỉ CHỌN các cấu hình thật sự khớp
 * {@code eventKey} và có kênh được hỗ trợ ({@code web} | {@code email}).
 *
 * <p>⛔ Không phát thông báo khi không có cấu hình nào khớp — tránh bịa thông báo.
 */
public final class NotificationRule {

    private static final List<String> SUPPORTED_CHANNELS = List.of("web", "email");

    /** Các cấu hình đang hiệu lực khớp {@code eventKey} và thuộc kênh Web/Email. */
    public List<Map<String, Object>> activeConfigsFor(String eventKey, List<Map<String, Object>> activeConfigs) {
        String key = value(eventKey);
        if (key.isEmpty() || activeConfigs == null) return List.of();
        List<Map<String, Object>> matched = new ArrayList<>();
        for (Map<String, Object> config : activeConfigs) {
            if (config == null) continue;
            if (!key.equals(value(config.get("code")))) continue;
            String channel = value(config.get("channel")).toLowerCase();
            if (!SUPPORTED_CHANNELS.contains(channel)) continue;
            matched.add(config);
        }
        return matched;
    }

    private static String value(Object raw) {
        return raw == null ? "" : String.valueOf(raw).trim();
    }
}
