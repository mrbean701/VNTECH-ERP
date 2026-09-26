package com.vntech.erp.application.port.out;

/**
 * Ghi nhật ký kiểm toán (audit_logs) — tương đương audit() của monolith JS.
 * beforeJson/afterJson là JSON chuỗi; infrastructure có thể lưu tiếng Việt UTF-8.
 */
public interface AuditLogPort {

    void log(String userId, String action, String entityType, String entityId,
             String beforeJson, String afterJson, String ipAddress);

    /**
     * TASK-046 — như {@link #log} nhưng **TRẢ VỀ id** của bản ghi vừa ghi.
     *
     * <p>JS (`system-route.mjs:2451-2452`) sinh `auditId = id("AUD")`, ghi `audit_logs`, rồi dùng
     * **chính id đó** cho `UPDATE project_archives SET purge_audit_id=?` — tức audit và archive được
     * liên kết bằng id. Java trước đây không ghi audit ở luồng purge nên `purge_audit_id` luôn NULL.
     *
     * <p>Cố ý để `default` (trả `null`) để {@link AuditLogPort} **vẫn là FUNCTIONAL INTERFACE** —
     * thêm một phương thức abstract sẽ làm vỡ mọi lambda kiểu `(a,b,c,d,e,f,g) -> {}` trong test cũ.
     */
    default String logReturningId(String userId, String action, String entityType, String entityId,
                                  String beforeJson, String afterJson, String ipAddress) {
        log(userId, action, entityType, entityId, beforeJson, afterJson, ipAddress);
        return null;
    }

    /**
     * P6 — ghi kèm ĐẦY ĐỦ ngữ cảnh người thực hiện và thay đổi.
     * Khóa nhận trong `entry` (mọi khóa đều tùy chọn):
     *   userId, userName, userRole, department, systemLevel, moduleKey, permissionUsed,
     *   action, entityType, entityId, beforeJson, afterJson, changeDetail, ipAddress.
     *
     * Cố ý để `default` (không phải abstract) để AuditLogPort vẫn là FUNCTIONAL INTERFACE:
     * nhiều test cũ và adapter rút gọn dùng lambda `(a,b,c,d,e,f,g) -> {}` cho port này.
     * Thêm một phương thức abstract sẽ làm vỡ tất cả chúng.
     * Mặc định chỉ ghi các trường cơ bản; AuditLogAdapter ghi đè để lưu đủ 16 cột.
     */
    default void logDetailed(java.util.Map<String, Object> entry) {
        log(text(entry.get("userId")), text(entry.get("action")), text(entry.get("entityType")),
                text(entry.get("entityId")), text(entry.get("beforeJson")), text(entry.get("afterJson")),
                text(entry.get("ipAddress")));
    }

    private static String text(Object value) {
        return value == null ? null : String.valueOf(value);
    }
}