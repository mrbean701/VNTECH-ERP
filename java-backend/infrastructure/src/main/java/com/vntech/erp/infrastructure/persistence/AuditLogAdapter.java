package com.vntech.erp.infrastructure.persistence;

import com.vntech.erp.application.port.out.AuditLogPort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/** Ghi audit_logs — tương đương audit() của monolith JS. */
@Component
public class AuditLogAdapter implements AuditLogPort {

    /**
     * AD-14 (PHASE 7 — chỉ đạo người dùng 21/09/2026 «thêm result»): cột `result` = KẾT QUẢ NGHIỆP VỤ, không rỗng.
     * Từ vựng ĐÓNG: {@link #RESULT_OK} · {@link #RESULT_DENIED} · {@link #RESULT_FAILED}.
     * Mặc định `ok` vì mọi lời gọi hiện nay nằm ở CUỐI nhánh THÀNH CÔNG (lỗi/từ chối thì ném ra trước đó);
     * nơi gọi dùng {@code logDetailed} có thể truyền khoá {@code result} để ghi `denied`/`failed` tường minh.
     * `metadata` KHÔNG có cột riêng: metadata = CHÍNH `before_json` + `after_json` (người dùng chốt).
     */
    public static final String RESULT_OK = "ok";
    public static final String RESULT_DENIED = "denied";
    public static final String RESULT_FAILED = "failed";

    private final JdbcTemplate jdbcTemplate;

    public AuditLogAdapter(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    @Transactional
    public void log(String userId, String action, String entityType, String entityId,
                    String beforeJson, String afterJson, String ipAddress) {
        insert(userId, action, entityType, entityId, beforeJson, afterJson, ipAddress);
    }

    /**
     * TASK-046 — trả về id bản ghi để nơi gọi liên kết được.
     * JS `system-route.mjs:2451-2452`: sinh `auditId`, ghi `audit_logs`, rồi
     * `UPDATE project_archives SET purge_audit_id=<auditId>`.
     */
    @Override
    @Transactional
    public String logReturningId(String userId, String action, String entityType, String entityId,
                                String beforeJson, String afterJson, String ipAddress) {
        return insert(userId, action, entityType, entityId, beforeJson, afterJson, ipAddress);
    }

    private String insert(String userId, String action, String entityType, String entityId,
                          String beforeJson, String afterJson, String ipAddress) {
        String id = "AUD_" + UUID.randomUUID();
        jdbcTemplate.update("""
                INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id,
                                        before_json, after_json, ip_address, result, occurred_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, id, userId, action, entityType, entityId,
                beforeJson, afterJson, ipAddress, RESULT_OK, Instant.now());
        return id;
    }

    /**
     * P6 — bản ghi đầy đủ ngữ cảnh.
     * Dùng REQUIRES_NEW: nhật ký phải được ghi NGAY cả khi giao dịch nghiệp vụ xung quanh
     * đang mở hoặc đã bị đánh dấu rollback — mất nhật ký là mất khả năng truy vết.
     */
    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logDetailed(Map<String, Object> entry) {
        jdbcTemplate.update("""
                INSERT INTO audit_logs (id, user_id, user_name, user_role, department, system_level,
                                        module_key, permission_used, action, entity_type, entity_id,
                                        before_json, after_json, change_detail, ip_address, result, occurred_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                "AUD_" + UUID.randomUUID(),
                str(entry.get("userId")), str(entry.get("userName")), str(entry.get("userRole")),
                str(entry.get("department")), str(entry.get("systemLevel")),
                str(entry.get("moduleKey")), str(entry.get("permissionUsed")),
                entry.get("action") == null ? "unknown" : String.valueOf(entry.get("action")),
                entry.get("entityType") == null ? "system" : String.valueOf(entry.get("entityType")),
                entry.get("entityId") == null ? "" : String.valueOf(entry.get("entityId")),
                str(entry.get("beforeJson")), str(entry.get("afterJson")), str(entry.get("changeDetail")),
                str(entry.get("ipAddress")),
                // AD-14: `result` do nơi gọi quyết định (`ok`/`denied`/`failed`); thiếu thì mặc định `ok`.
                entry.get("result") == null || String.valueOf(entry.get("result")).isBlank()
                        ? RESULT_OK : String.valueOf(entry.get("result")),
                Instant.now());
    }

    /** Cột text NULL — chuỗi rỗng nên lưu thành NULL cho sạch dữ liệu. */
    private static String str(Object value) {
        if (value == null) return null;
        String s = String.valueOf(value);
        return s.isBlank() || "null".equals(s) ? null : s;
    }
}
