package com.vntech.erp.application.service;

import com.vntech.erp.application.notification.NotificationRecipientResolver;
import com.vntech.erp.application.notification.NotificationRule;
import com.vntech.erp.application.port.out.IdGenerator;
import com.vntech.erp.application.port.out.NotificationStore;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * MT2 §15.1 — **NOTIFICATION ENGINE** theo đúng pipeline bắt buộc:
 * <pre>
 * Business Event → {@code dispatch} (SERVICE) → {@code activeConfigs} (RULE)
 *                → {@code resolveRecipients} (RECIPIENT RESOLVER) → Web
 *                → {@code upsertDelivered} (LOG) → {@code markRead}/{@code snooze} (READ/DELIVERY)
 * </pre>
 *
 * <p>Vì sao tách thành MỘT lớp ở tầng application: MT2 §15.1 ghi rõ
 * <i>“⛔ Không tạo logic notification rải rác trong từng page”</i> ⇒ mọi nghiệp vụ thông báo đi qua đây,
 * các use-case khác chỉ **gọi hàm** ⛔ không tự dựng thông báo.
 *
 * <p>Phạm vi hiện tại: **kênh WEB trọn vẹn** (§13.2 cấu hình + §14 hiển thị/đọc). Kênh **EMAIL** là
 * `MT2-P3-01b` — phải audit bảng {@code email_outbox} trước khi ghi (⛔ không đoán cột).
 */
public class NotificationManagementUseCase {

    private final NotificationStore store;
    private final IdGenerator idGenerator;
    private final NotificationRule rule = new NotificationRule();
    private final NotificationRecipientResolver resolver;

    public NotificationManagementUseCase(NotificationStore store, IdGenerator idGenerator) {
        this.store = store;
        this.idGenerator = idGenerator;
        this.resolver = new NotificationRecipientResolver(store);
    }

    // ═══════════════════════════════════════════════════════════════════════════════════════════
    // 1) SERVICE — cửa DUY NHẤT cho mọi business event
    // ═══════════════════════════════════════════════════════════════════════════════════════════

    /**
     * Phát một business event: tra các cấu hình đang hiệu lực, giải người nhận, ghi LOG đã hiển thị.
     *
     * @param eventKey mã cấu hình cần phát (vd {@code PR_APPROVED}) — ⛔ KHÔNG hard-code luật trong code:
     *                 luật nằm ở bảng {@code notification_configs} do người dùng cấu hình (MT2 §13.2).
     * @return số bản ghi LOG đã tạo (0 nếu không có cấu hình nào hiệu lực ⇒ ⛔ không bịa thông báo).
     */
    public int dispatch(String eventKey) {
        String key = trim(eventKey);
        if (key.isEmpty()) return 0;
        Instant now = Instant.now();
        int logged = 0;
        for (Map<String, Object> config : rule.activeConfigsFor(key, store.activeConfigs(now))) {
            String channel = sv(config, "channel").toLowerCase();
            for (String userId : resolver.resolve(config)) {
                if ("web".equals(channel)) {
                    store.upsertDelivered(idGenerator.next("NUS"), sv(config, "id"), userId, now);
                    logged++;
                } else {
                    // MT2 §15 «Web/Email» — kênh EMAIL: xếp thư vào hàng đợi SẴN CÓ `email_outbox`
                    // (⛔ KHÔNG gửi SMTP ở đây). User chưa có email ⇒ ⛔ bỏ qua, KHÔNG bịa địa chỉ.
                    String to = store.emailOf(userId);
                    if (to.isEmpty()) continue;
                    Map<String, Object> mail = new LinkedHashMap<>();
                    mail.put("id", idGenerator.next("MAIL"));
                    mail.put("recipients", to);
                    mail.put("subject", "[VNTECH ERP] " + sv(config, "name"));
                    String body = sv(config, "content");
                    mail.put("textBody", body.isEmpty() ? sv(config, "name") : body);
                    mail.put("htmlBody", "<p>" + (body.isEmpty() ? sv(config, "name") : body) + "</p>");
                    store.insertNotificationEmail(mail, now);
                    logged++;
                }
            }
        }
        return logged;
    }

    // ═══════════════════════════════════════════════════════════════════════════════════════════
    // 2) RECIPIENT RESOLVER — theo `recipient_mode`, ⛔ KHÔNG bịa người nhận
    // ═══════════════════════════════════════════════════════════════════════════════════════════

    /** MT2 §13.2/§45: {@code all | user | users | department | project} ⇒ danh sách {@code user_id} (đã khử trùng). */
    public List<String> resolveRecipients(Map<String, Object> config) {
        return resolver.resolve(config);
    }

    // ═══════════════════════════════════════════════════════════════════════════════════════════
    // 3) MÀN QUẢN TRỊ §13.2 — CRUD cấu hình (List · Search · Sort · Filter do UI lo, backend giữ luật)
    // ═══════════════════════════════════════════════════════════════════════════════════════════

    public Map<String, Object> saveConfig(Map<String, Object> payload) {
        String name = trim(payload.get("name"));
        String code = trim(payload.get("code"));
        String channel = trim(payload.get("channel")).toLowerCase();
        if (name.isEmpty()) throw Api("Thiếu Tên thông báo.");
        if (code.isEmpty()) throw Api("Thiếu Mã thông báo.");
        if (!channel.equals("web") && !channel.equals("email"))
            throw Api("Loại thông báo phải là web hoặc email.");
        String recipientMode = trim(payload.get("recipientMode"));
        if (recipientMode.isEmpty()) recipientMode = "all";
        if (!List.of("all", "user", "users", "department", "project").contains(recipientMode))
            throw Api("Người nhận không hợp lệ: " + recipientMode + ".");
        Instant now = Instant.now();
        String id = trim(payload.get("configId"));
        Map<String, Object> config = new LinkedHashMap<>();
        config.put("id", id.isEmpty() ? idGenerator.next("NCFG") : id);
        config.put("code", code);
        config.put("name", name);
        config.put("channel", channel);
        config.put("content", trim(payload.get("content")));
        config.put("recipientMode", recipientMode);
        config.put("sendAt", instantOrNull(payload.get("sendAt")));
        config.put("endAt", instantOrNull(payload.get("endAt")));
        config.put("createdBy", trim(payload.get("createdBy")));
        if (id.isEmpty()) {
            store.insertConfig(config);
        } else if (!store.updateConfig(config)) {
            throw Api("Không tìm thấy cấu hình thông báo " + id + ".");
        }
        // Người nhận: THAY TOÀN BỘ theo payload (⛔ không trộn cũ/mới gây sai người nhận).
        if (payload.get("targets") instanceof List<?> targets) {
            store.deleteConfigTargets((String) config.get("id"));
            for (Object item : targets) {
                if (!(item instanceof Map<?, ?> target)) continue;
                String type = trim(target.get("targetType"));
                String targetId = trim(target.get("targetId"));
                if (type.isEmpty()) continue;
                store.insertConfigTarget(idGenerator.next("NTG"), (String) config.get("id"), type, targetId, now);
            }
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", (id.isEmpty() ? "Đã tạo " : "Đã cập nhật ") + "cấu hình thông báo " + code + ".");
        result.put("configId", config.get("id"));
        return result;
    }

    public Map<String, Object> setConfigActive(Map<String, Object> payload) {
        String configId = trim(payload.get("configId"));
        if (configId.isEmpty()) throw Api("Thiếu configId.");
        boolean active = !"0".equals(trim(payload.get("active"))) && !"false".equalsIgnoreCase(trim(payload.get("active")));
        if (!store.setConfigActive(configId, active, Instant.now()))
            throw Api("Không tìm thấy cấu hình thông báo " + configId + ".");
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", (active ? "Đã bật " : "Đã tắt ") + "cấu hình thông báo " + configId + ".");
        return result;
    }

    // ═══════════════════════════════════════════════════════════════════════════════════════════
    // MT2-P3-02 — §13.1 «Danh sách có **CRUD** · Search · Sort · Filter»
    //    · Danh sách (R) + Xoá (D) bổ sung ở đây; Create/Update = `saveConfig` (đã có ✔).
    //    · ⚠️ **Search/Sort/Filter để UI lo** — backend chỉ trả danh sách đầy đủ (⛔ không tự đặt luật lọc) ✔
    // ═══════════════════════════════════════════════════════════════════════════════════════════

    /** §13.1 — danh sách cấu hình thông báo (màn Quản trị · tab Thông báo). */
    /** MT2 §15.1 — log + delivery status từ các bảng sẵn có; ⛔ không tạo bảng trùng. */
    public List<Map<String, Object>> notificationLog() {
        return store.notificationLog();
    }

    public List<Map<String, Object>> listConfigs() {
        return store.allConfigs();
    }

    /**
     * §13.1 — xoá cấu hình thông báo (chữ **D** của CRUD).
     * ⛔ KHÔNG xoá `notification_user_states`: đó là **lịch sử đọc của từng user** ✗ (chỉ xoá config + targets).
     */
    public Map<String, Object> deleteConfig(Map<String, Object> payload) {
        String configId = trim(payload.get("configId"));
        if (configId.isEmpty()) throw Api("Thiếu configId.");
        if (!store.deleteConfig(configId)) throw Api("Không tìm thấy cấu hình thông báo " + configId + ".");
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "Đã xoá cấu hình thông báo " + configId + ".");
        result.put("configId", configId);
        return result;
    }

    // ═══════════════════════════════════════════════════════════════════════════════════════════
    // 4) READ / DELIVERY (§14) — trạng thái THEO TỪNG USER, ⛔ không global
    // ═══════════════════════════════════════════════════════════════════════════════════════════

    /** Hiển thị sau login — CHỈ thông báo của CHÍNH user, đã trừ đã-đọc và đang tạm ẩn (§14). */
    public List<Map<String, Object>> notificationsForUser(String userId) {
        String uid = trim(userId);
        if (uid.isEmpty()) return List.of();
        return store.notificationsForUser(uid, Instant.now());
    }

    public Map<String, Object> markRead(String userId, Map<String, Object> payload) {
        String configId = trim(payload.get("configId"));
        if (configId.isEmpty()) throw Api("Thiếu configId.");
        store.markRead(configId, trim(userId), Instant.now());
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "Đã đánh dấu đã đọc.");
        return result;
    }

    public Map<String, Object> markAllRead(String userId) {
        int changed = store.markAllRead(trim(userId), Instant.now());
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "Đã đánh dấu tất cả đã đọc (" + changed + " thông báo).");
        result.put("changed", changed);
        return result;
    }

    /** §48/§49 «Không nhắc lại hôm nay» — tạm ẩn tới {@code snoozeUntil} (mặc định 1 ngày). */
    public Map<String, Object> snooze(String userId, Map<String, Object> payload) {
        String configId = trim(payload.get("configId"));
        if (configId.isEmpty()) throw Api("Thiếu configId.");
        Instant until = instantOrNull(payload.get("snoozeUntil"));
        if (until == null) until = Instant.now().plusSeconds(24 * 3600);
        if (!store.snooze(configId, trim(userId), until, Instant.now()))
            throw Api("Không ghi được trạng thái tạm ẩn cho cấu hình " + configId + ".");
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "Sẽ không nhắc lại thông báo này tới " + until + ".");
        return result;
    }

    // ---- helpers (giữ cục bộ ⇒ ⛔ không phụ thuộc private của lớp khác) ----
    private static String trim(Object value) { return value == null ? "" : String.valueOf(value).trim(); }

    private static String sv(Map<String, Object> row, String key) {
        Object value = row == null ? null : row.get(key);
        return value == null ? "" : String.valueOf(value).trim();
    }

    private static Instant instantOrNull(Object value) {
        if (value instanceof Instant instant) return instant;
        String raw = trim(value);
        if (raw.isEmpty()) return null;
        try {
            return Instant.parse(raw);
        } catch (RuntimeException ignored) {
            try {
                return java.time.LocalDateTime.parse(raw.replace(' ', 'T')).toInstant(java.time.ZoneOffset.UTC);
            } catch (RuntimeException ignoredToo) {
                throw Api("Thời gian không hợp lệ: " + raw);
            }
        }
    }

    private static RuntimeException Api(String message) {
        // ⚠️ BUG ĐÃ ĐƯỢC TEST BẮT (MT2-P3-02): trước đây trả `IllegalArgumentException` ⇒ lọt ra ngoài luồng API
        // ⇒ Spring trả **500 (ServletException)** thay vì **400** ✗. Quy ước của dự án là `AuthUseCase.ApiError(msg, 400)`
        // (xem `SupplierManagementUseCase.Api`, `StockManagementUseCase`) ⇒ dùng đúng để mọi validate trả **400** ✔
        return new AuthUseCase.ApiError(message, 400);
    }
}
