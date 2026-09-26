package com.vntech.erp.application.port.out;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * MT2 §15.1 — cổng dữ liệu cho **Notification Engine**. Bảng đã có sẵn từ migration **V26**
 * (MT2-P1-04/P1-05): {@code notification_configs} · {@code notification_config_targets} ·
 * {@code notification_user_states} ⇒ ⛔ KHÔNG cần bảng mới.
 *
 * <p>Kiến trúc MT2 §15.1: {@code Business Event → Notification Service → Notification Rule →
 * Recipient Resolver → Web/Email → Notification Log → Read/Delivery Status}. Cổng này phục vụ
 * đúng 4 mắt: **Rule** ({@link #activeConfigs}), **Recipient Resolver** ({@link #configTargets} +
 * các hàm tra người nhận), **Log** ({@link #upsertDelivered}) và **Read/Delivery**
 * ({@link #markRead}, {@link #snooze}, {@link #markAllRead}).
 *
 * <p>⛔ KHÔNG đụng {@code task_notifications} — bảng đó là HÀNG ĐỢI in-app gắn {@code work_item_id}
 * phục vụ luồng CÔNG VIỆC, khác hẳn cấu hình thông báo ở đây.
 */
public interface NotificationStore {

    // ---- Rule: cấu hình đang hiệu lực (active + trong cửa sổ send_at/end_at) ----
    /** MT2 §14 «Check active period»: {@code active=1} và {@code send_at<=now} và ({@code end_at IS NULL} hoặc {@code now<end_at}). */
    List<Map<String, Object>> activeConfigs(Instant now);

    // ---- Rule phụ trợ cho màn Quản trị: toàn bộ cấu hình (kể cả hết hiệu lực) ----
    List<Map<String, Object>> allConfigs();

    void insertConfig(Map<String, Object> config);

    boolean updateConfig(Map<String, Object> config);

    boolean setConfigActive(String configId, boolean active, Instant now);

    /**
     * MT2 §13.1 — xoá cấu hình thông báo (chữ **D** của **CRUD**).
     * ⚠️ CHỈ xoá cấu hình (và **targets** của nó). ⛔ **KHÔNG** xoá {@code notification_user_states} —
     * đó là **lịch sử đọc của từng user**, xoá đi là mất dấu vết người dùng đã đọc gì.
     */
    boolean deleteConfig(String configId);

    boolean deleteConfigTargets(String configId);

    void insertConfigTarget(String id, String configId, String targetType, String targetId, Instant now);

    // ---- Recipient Resolver ----
    List<Map<String, Object>> configTargets(String configId);          // targetType · targetId

    List<String> activeUserIds();

    List<String> userIdsByDepartment(String department);

    List<String> userIdsByProject(String projectId);

    // ---- Log + Delivery/Read (theo TỪNG user — MT2 §14) ----
    /** Ghi nhận ĐÃ HIỂN THỊ cho user (UPSERT theo {@code config_id + user_id}); ⛔ không đụng {@code read_at} cũ. */
    void upsertDelivered(String id, String configId, String userId, Instant now);

    /** Đánh dấu ĐÃ ĐỌC của ĐÚNG user này. Trả {@code true} nếu có thay đổi. */
    boolean markRead(String configId, String userId, Instant now);

    /** MT2 §14 «Đánh dấu tất cả đã đọc» — nhưng chỉ cho CHÍNH user này (⛔ không global). */
    int markAllRead(String userId, Instant now);

    /** MT2 §48/§49 — «Không nhắc lại hôm nay»: tạm ẩn tới {@code until}. */
    boolean snooze(String configId, String userId, Instant until, Instant now);

    /** Thông báo ĐANG hiệu lực của CHÍNH user: chưa đọc và chưa trong thời gian tạm ẩn (MT2 §14). */
    List<Map<String, Object>> notificationsForUser(String userId, Instant now);

    /** §15.1 — log tổng hợp từ các bảng log/delivery đang có, không tạo bảng trùng. */
    List<Map<String, Object>> notificationLog();

    // ---- MT2-P3-01b — KÊNH EMAIL (§15 «Web/Email») ----
    /** Địa chỉ email của người nhận (MT2 §15) — rỗng nghĩa là user chưa có email ⇒ ⛔ KHÔNG xếp thư. */
    String emailOf(String userId);

    /**
     * Xếp 1 thư vào {@code email_outbox} (hàng đợi gửi SẴN CÓ của dự án —
     * khuôn {@code OpsTaskStore.insertEmailOutbox}). ⛔ KHÔNG gửi SMTP trực tiếp từ use-case.
     * 9 cột NOT NULL phải có: id · event · recipients · subject · text_body · html_body · queued_at · created_at · updated_at.
     */
    void insertNotificationEmail(Map<String, Object> mail, Instant now);
}
