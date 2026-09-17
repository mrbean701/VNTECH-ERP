package com.vntech.erp.application.port.out;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/** Port vận hành admin — port nguyên trạng save_email_settings / preview_request_import JS. */
public interface AdminOpsStore {

    // ---- email settings ----
    void upsertEmailSettings(Map<String, Object> s, String userId, Instant now);
    void updateSlaSettings(boolean poSla, long poHours, boolean bchSla, long bchHours, String userId, Instant now);
    void clearApprovalEmailRecipients();
    void clearApprovalProjectAssignments();
    void insertApprovalAssignment(String id, String projectId, int stage, String ownerUserId, String ccEmails,
                                  String updatedBy, Instant now);
    /**
     * Ghi một dòng người nhận email theo dự án + bước duyệt.
     *
     * <p><b>SỬA LỖI (TASK-040):</b> chữ ký cũ nhận {@code userEmail} + {@code ccEmails} + {@code updatedBy}.
     * Lược đồ thật của bảng chỉ có <b>MỘT</b> cột {@code emails} (không có {@code user_email},
     * {@code cc_emails}, {@code updated_by}) — xem drizzle/0004 và V1__baseline. JS cũng ghi một cột
     * {@code emails} đã chuẩn hoá và nối bằng dấu phẩy. Nay port theo JS.
     */
    void insertApprovalRecipient(String id, String projectId, int stage, String emails, Instant now);

    // ---- preview request import context ----
    Optional<Map<String, Object>> findProjectBasic(String projectId);
    Optional<Map<String, Object>> findActiveBoqVersionId(String projectId, String contractId);
    Optional<Map<String, Object>> findContractForVersion(String projectId, String contractId, String boqVersionId);
    List<Map<String, Object>> boqRowsForPreview(String projectId, String contractId, String boqVersionId);
    List<Map<String, Object>> materialsForPreview();
    List<Map<String, Object>> inventoryForProject(String projectId);
    List<Map<String, Object>> cumulativeByBoq(String projectId, String contractId, String boqVersionId);
}