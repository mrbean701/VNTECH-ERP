package com.vntech.erp.application.port.out;

/**
 * Ghi nhật ký kiểm toán (audit_logs) — tương đương audit() của monolith JS.
 * beforeJson/afterJson là JSON chuỗi; infrastructure có thể lưu tiếng Việt UTF-8.
 */
public interface AuditLogPort {

    void log(String userId, String action, String entityType, String entityId,
             String beforeJson, String afterJson, String ipAddress);
}