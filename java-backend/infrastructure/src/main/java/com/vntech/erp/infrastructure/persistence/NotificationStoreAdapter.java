package com.vntech.erp.infrastructure.persistence;

import com.vntech.erp.application.port.out.NotificationStore;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Cài đặt {@link NotificationStore} trên 3 bảng của migration **V26** (MT2-P1-04/P1-05).
 *
 * <p>⛔ KHÔNG đụng {@code task_notifications}.
 *
 * <p><b>Hai bài học H2 đã trả giá trong chính dự án này — tuân thủ tuyệt đối ở tệp này:</b>
 * <ol>
 *   <li>⛔ KHÔNG dùng {@code INSERT … ON DUPLICATE KEY UPDATE} (cú pháp MySQL, H2 không có)
 *       ⇒ mọi UPSERT làm bằng **UPDATE trước, nếu 0 dòng thì INSERT**.</li>
 *   <li>⛔ KHÔNG nhúng subquery có {@code ORDER BY … LIMIT} vào danh sách chọn ⇒ chỉ dùng JOIN/LEFT JOIN
 *       và **alias TRÍCH DẪN** ({@code AS "configId"}) để giữ nguyên chữ hoa ở CẢ MySQL và H2.</li>
 * </ol>
 */
@Component
public class NotificationStoreAdapter implements NotificationStore {

    private final JdbcTemplate jdbcTemplate;

    public NotificationStoreAdapter(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // ───────────────────────────── RULE ─────────────────────────────
    @Override
    public List<Map<String, Object>> activeConfigs(Instant now) {
        // MT2 §14 «Check active period»: đang bật VÀ đã tới giờ gửi VÀ chưa quá giờ kết thúc.
        return jdbcTemplate.queryForList("""
                SELECT id AS "id",code AS "code",name AS "name",channel AS "channel",content AS "content",
                       recipient_mode AS "recipientMode",send_at AS "sendAt",end_at AS "endAt",active AS "active"
                FROM notification_configs
                WHERE active=1
                  AND (send_at IS NULL OR send_at<=?)
                  AND (end_at IS NULL OR end_at>?)
                ORDER BY created_at,id""", Timestamp.from(now), Timestamp.from(now));
    }

    @Override
    public List<Map<String, Object>> allConfigs() {
        return jdbcTemplate.queryForList("""
                SELECT id AS "id",code AS "code",name AS "name",channel AS "channel",content AS "content",
                       recipient_mode AS "recipientMode",send_at AS "sendAt",end_at AS "endAt",active AS "active",
                       created_by AS "createdBy",created_at AS "createdAt"
                FROM notification_configs ORDER BY created_at DESC,id""");
    }

    @Override
    @Transactional
    public void insertConfig(Map<String, Object> config) {
        jdbcTemplate.update("""
                INSERT INTO notification_configs (id,code,name,channel,content,recipient_mode,send_at,end_at,
                                                  active,created_by,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,?,1,?,?,?)""",
                config.get("id"), config.get("code"), config.get("name"), config.get("channel"),
                config.get("content"), config.get("recipientMode"), timestamp(config.get("sendAt")),
                timestamp(config.get("endAt")), config.get("createdBy"), Timestamp.from(Instant.now()),
                Timestamp.from(Instant.now()));
    }

    @Override
    @Transactional
    public boolean updateConfig(Map<String, Object> config) {
        int changed = jdbcTemplate.update("""
                UPDATE notification_configs SET code=?,name=?,channel=?,content=?,recipient_mode=?,
                       send_at=?,end_at=?,updated_at=? WHERE id=?""",
                config.get("code"), config.get("name"), config.get("channel"), config.get("content"),
                config.get("recipientMode"), timestamp(config.get("sendAt")), timestamp(config.get("endAt")),
                Timestamp.from(Instant.now()), config.get("id"));
        return changed > 0;
    }

    @Override
    public boolean setConfigActive(String configId, boolean active, Instant now) {
        return jdbcTemplate.update("UPDATE notification_configs SET active=?,updated_at=? WHERE id=?",
                active ? 1 : 0, Timestamp.from(now), configId) > 0;
    }

    @Override
    public boolean deleteConfigTargets(String configId) {
        return jdbcTemplate.update("DELETE FROM notification_config_targets WHERE config_id=?", configId) > 0;
    }

    @Override
    public void insertConfigTarget(String id, String configId, String targetType, String targetId, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO notification_config_targets (id,config_id,target_type,target_id,created_at)
                VALUES (?,?,?,?,?)""", id, configId, targetType, targetId, Timestamp.from(now));
    }

    // ───────────────────── RECIPIENT RESOLVER ─────────────────────
    @Override
    public List<Map<String, Object>> configTargets(String configId) {
        return jdbcTemplate.queryForList("""
                SELECT target_type AS "targetType",target_id AS "targetId"
                FROM notification_config_targets WHERE config_id=? ORDER BY created_at,id""", configId);
    }

    @Override
    public List<String> activeUserIds() {
        return jdbcTemplate.queryForList("SELECT id FROM users WHERE active=1 ORDER BY id", String.class);
    }

    @Override
    public List<String> userIdsByDepartment(String department) {
        if (department == null || department.isBlank()) return List.of();
        return jdbcTemplate.queryForList(
                "SELECT id FROM users WHERE active=1 AND department=? ORDER BY id", String.class, department.trim());
    }

    @Override
    public List<String> userIdsByProject(String projectId) {
        if (projectId == null || projectId.isBlank()) return List.of();
        return jdbcTemplate.queryForList("""
                SELECT u.id FROM users u JOIN user_project_scopes s ON s.user_id=u.id
                WHERE u.active=1 AND s.project_id=? ORDER BY u.id""", String.class, projectId.trim());
    }

    // ──────────────── LOG + READ/DELIVERY (theo user) ────────────────
    @Override
    @Transactional
    public void upsertDelivered(String id, String configId, String userId, Instant now) {
        // ⛔ KHÔNG `ON DUPLICATE KEY UPDATE` (MySQL-only). UPDATE trước, 0 dòng thì INSERT (chạy cả H2).
        int changed = jdbcTemplate.update(
                "UPDATE notification_user_states SET delivered_at=COALESCE(delivered_at,?),updated_at=? "
                        + "WHERE config_id=? AND user_id=?",
                Timestamp.from(now), Timestamp.from(now), configId, userId);
        if (changed == 0) {
            jdbcTemplate.update("""
                    INSERT INTO notification_user_states (id,config_id,user_id,delivered_at,created_at,updated_at)
                    VALUES (?,?,?,?,?,?)""",
                    id, configId, userId, Timestamp.from(now), Timestamp.from(now), Timestamp.from(now));
        }
    }

    @Override
    public boolean markRead(String configId, String userId, Instant now) {
        int changed = jdbcTemplate.update(
                "UPDATE notification_user_states SET read_at=COALESCE(read_at,?),updated_at=? "
                        + "WHERE config_id=? AND user_id=?",
                Timestamp.from(now), Timestamp.from(now), configId, userId);
        if (changed > 0) return true;
        // Chưa từng có dòng trạng thái (chưa hiển thị lần nào) ⇒ tạo dòng ĐÃ ĐỌC của ĐÚNG user này.
        jdbcTemplate.update("""
                INSERT INTO notification_user_states (id,config_id,user_id,read_at,delivered_at,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?)""",
                "NUS_" + java.util.UUID.randomUUID(), configId, userId,
                Timestamp.from(now), Timestamp.from(now), Timestamp.from(now), Timestamp.from(now));
        return true;
    }

    @Override
    public int markAllRead(String userId, Instant now) {
        // ⛔ CHỈ của CHÍNH user (MT2 §14) — không đánh dấu đọc global.
        //
        // MT2-P13-03 (§14.1) — FIX ROOT CAUSE: bản trước **CHỈ UPDATE** dòng `notification_user_states` đã
        // tồn tại. Nhưng `notificationsForUser` đọc bằng `LEFT JOIN … WHERE s.read_at IS NULL` ⇒ một thông báo
        // **chưa từng có state row** (chưa snooze, chưa đọc) VẪN được hiện, và sau khi bấm «Đánh dấu tất cả đã
        // đọc» nó **vẫn hiện lại** ⇒ nút này không thực sự làm hết ý nghĩa. ⇒ UPDATE + INSERT các dòng còn
        // THIẾU, dùng **ĐÚNG bộ lọc** mà `notificationsForUser` dùng (cùng nguồn sự thật, ⛔ không lệch).
        int updated = jdbcTemplate.update(
                "UPDATE notification_user_states SET read_at=COALESCE(read_at,?),updated_at=? "
                        + "WHERE user_id=? AND read_at IS NULL",
                Timestamp.from(now), Timestamp.from(now), userId);
        int inserted = jdbcTemplate.update("""
                INSERT INTO notification_user_states (id,config_id,user_id,read_at,delivered_at,created_at,updated_at)
                SELECT CONCAT('NUS_',REPLACE(UUID(),'-','')),c.id,?,?,?,?,?
                FROM notification_configs c
                WHERE c.active=1 AND c.channel='web'
                  AND (c.send_at IS NULL OR c.send_at<=?)
                  AND (c.end_at IS NULL OR c.end_at>?)
                  AND NOT EXISTS (SELECT 1 FROM notification_user_states s
                                  WHERE s.config_id=c.id AND s.user_id=?)""",
                userId, Timestamp.from(now), Timestamp.from(now), Timestamp.from(now), Timestamp.from(now),
                Timestamp.from(now), Timestamp.from(now), userId);
        return updated + inserted;
    }

    @Override
    @Transactional
    public boolean snooze(String configId, String userId, Instant until, Instant now) {
        int changed = jdbcTemplate.update(
                "UPDATE notification_user_states SET snooze_until=?,updated_at=? WHERE config_id=? AND user_id=?",
                Timestamp.from(until), Timestamp.from(now), configId, userId);
        if (changed > 0) return true;
        jdbcTemplate.update("""
                INSERT INTO notification_user_states (id,config_id,user_id,snooze_until,delivered_at,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?)""",
                "NUS_" + java.util.UUID.randomUUID(), configId, userId,
                Timestamp.from(until), Timestamp.from(now), Timestamp.from(now), Timestamp.from(now));
        return true;
    }

    @Override
    public List<Map<String, Object>> notificationsForUser(String userId, Instant now) {
        // Chỉ cấu hình ĐANG hiệu lực + kênh web + CHƯA đọc + KHÔNG đang tạm ẩn (MT2 §14/§48).
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT c.id AS "configId",c.code AS "code",c.name AS "name",c.content AS "content",
                       c.send_at AS "sendAt",c.end_at AS "endAt",
                       s.read_at AS "readAt",s.snooze_until AS "snoozeUntil",s.delivered_at AS "deliveredAt"
                FROM notification_configs c
                LEFT JOIN notification_user_states s ON s.config_id=c.id AND s.user_id=?
                WHERE c.active=1 AND c.channel='web'
                  AND (c.send_at IS NULL OR c.send_at<=?)
                  AND (c.end_at IS NULL OR c.end_at>?)
                  AND s.read_at IS NULL
                  AND (s.snooze_until IS NULL OR s.snooze_until<=?)
                ORDER BY c.created_at DESC,c.id""",
                userId, Timestamp.from(now), Timestamp.from(now), Timestamp.from(now));
        return new ArrayList<>(rows);
    }

    // ═══════════════ MT2-P3-02 — CRUD cấu hình thông báo (§13.1) ═══════════════
    /** Xoá cấu hình + **targets** của nó. ⛔ **KHÔNG** xoá `notification_user_states` (lịch sử đọc của user) ✗. */
    @Override
    @Transactional
    public boolean deleteConfig(String configId) {
        jdbcTemplate.update("DELETE FROM notification_config_targets WHERE config_id=?", configId);
        return jdbcTemplate.update("DELETE FROM notification_configs WHERE id=?", configId) > 0;
    }

    /** §15.1 — tổng hợp log web/email từ các bảng sẵn có, không nhân bản trạng thái sang bảng mới. */
    @Override
    public List<Map<String, Object>> notificationLog() {
        List<Map<String, Object>> rows = new ArrayList<>();
        rows.addAll(jdbcTemplate.queryForList("""
                SELECT 'web' AS source,s.id AS logId,s.config_id AS configId,s.user_id AS userId,
                       c.code AS event,c.name AS subject,
                       CASE WHEN s.read_at IS NOT NULL THEN 'read'
                            WHEN s.delivered_at IS NOT NULL THEN 'delivered'
                            ELSE 'queued' END AS status,
                       s.delivered_at AS deliveredAt,s.read_at AS readAt,s.snooze_until AS snoozeUntil,
                       s.created_at AS createdAt
                FROM notification_user_states s
                JOIN notification_configs c ON c.id=s.config_id
                ORDER BY s.created_at DESC,s.id DESC"""));
        rows.addAll(jdbcTemplate.queryForList("""
                SELECT 'email' AS source,e.id AS logId,e.request_id AS configId,NULL AS userId,
                       e.event,e.subject,
                       CASE WHEN e.status='sent' THEN 'delivered'
                            WHEN e.status='failed' THEN 'failed'
                            WHEN e.status='sending' THEN 'sending'
                            ELSE 'queued' END AS status,
                       e.sent_at AS deliveredAt,NULL AS readAt,NULL AS snoozeUntil,e.created_at AS createdAt
                FROM email_outbox e
                ORDER BY e.created_at DESC,e.id DESC"""));
        return rows;
    }

    // ---- MT2-P3-01b — KÊNH EMAIL ----
    @Override
    public String emailOf(String userId) {
        List<String> rows = jdbcTemplate.queryForList(
                "SELECT email FROM users WHERE id=?", String.class, userId);
        if (rows.isEmpty() || rows.get(0) == null) return "";
        return rows.get(0).trim();
    }

    /** Soi gương `OpsTaskStoreAdapter.insertEmailOutbox` (hàng đợi email SẴN CÓ) — ⛔ không tự gửi SMTP.
     *  `event` riêng `system_notification` để phân biệt với `task_assigned` của luồng CÔNG VIỆC. */
    @Override
    @Transactional
    public void insertNotificationEmail(Map<String, Object> mail, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO email_outbox (id,request_id,stage,event,recipients,subject,text_body,html_body,
                                          status,attempt_count,next_attempt_at,queued_at,sent_at,last_error,
                                          created_at,updated_at)
                VALUES (?,NULL,NULL,'system_notification',?,?,?,?,'queued',0,?,?,NULL,NULL,?,?)""",
                mail.get("id"), mail.get("recipients"), mail.get("subject"), mail.get("textBody"),
                mail.get("htmlBody"), Timestamp.from(now), Timestamp.from(now),
                Timestamp.from(now), Timestamp.from(now));
    }

    private static Timestamp timestamp(Object value) {
        if (value == null) return null;
        if (value instanceof Instant instant) return Timestamp.from(instant);
        if (value instanceof Timestamp stamp) return stamp;
        String raw = String.valueOf(value).trim();
        if (raw.isEmpty()) return null;
        return Timestamp.from(Instant.parse(raw));
    }

    /** Giữ chỗ cho `MT2-P3-01b` (kênh EMAIL) — sẽ thêm khi đã audit bảng {@code email_outbox}. */
    static Map<String, Object> empty() { return new LinkedHashMap<>(); }
}
