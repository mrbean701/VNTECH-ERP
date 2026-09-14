package com.vntech.erp.application.port.out;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Port lưu trữ tệp đính kèm — port nguyên trạng {@code app/api/files/route.ts}.
 *
 * <p>JS dùng R2 ({@code env.BUCKET}) cho nội dung tệp + MySQL bảng {@code attachments} cho metadata.
 * Bản Java giữ nguyên metadata trong MySQL và lưu nội dung xuống đĩa dưới {@code vntech.files.root}
 * với đúng {@code storage_key} mà JS sinh ra ({@code <entityType>/<entityId>/<id>-<safeName>}),
 * nên dữ liệu migrate từ R2 sang chỉ cần giữ nguyên key.
 */
public interface FileStore {

    /** Người dùng hiện tại tối thiểu cần cho RBAC của /api/files (khớp CurrentUser trong JS). */
    record FileUser(String id, String role, String roleBase) {}

    Optional<FileUser> findUserBySessionTokenHash(String tokenHash, Instant now);

    Optional<FileUser> findUserByEmail(String email);

    /** project_id suy ra từ loại chứng từ; rỗng nếu loại không hỗ trợ. */
    Optional<String> entityProjectId(String entityType, String entityId);

    /** user_project_scopes.permission; rỗng nếu không có phạm vi. */
    Optional<String> projectScopePermission(String userId, String projectId);

    /** Kiểm tra quyền module theo đúng ma trận của JS moduleAllowed(). */
    boolean moduleAllowed(String userId, String entityType, boolean write);

    void insertAttachment(String id, String entityType, String entityId, String fileName, String storageKey,
                          String mimeType, String uploadedBy, Instant now);

    Optional<Map<String, Object>> findAttachment(String attachmentId);

    List<Map<String, Object>> listAttachments(String entityType, String entityId);

    void deleteAttachment(String attachmentId);

    // ---- nội dung tệp (thay cho env.BUCKET) ----
    void putObject(String storageKey, byte[] content);
    Optional<byte[]> getObject(String storageKey);
    void deleteObject(String storageKey);

    // ---- archive dự án (GET ?projectArchive=) ----
    Optional<Map<String, Object>> findProject(String projectId);

    /** Một nhóm bảng trong archive — tên bảng + toàn bộ dòng thuộc dự án. */
    record ArchiveTable(String name, List<Map<String, Object>> rows) {}

    /** Toàn bộ bảng archive theo đúng thứ tự và bộ bảng của JS projectArchiveDataset(). */
    List<ArchiveTable> archiveTables(String projectId);

    List<Map<String, Object>> auditLogsForEntityIds(List<String> entityIds);

    void insertProjectArchive(String id, String projectId, String projectCode, String projectName, String fileName,
                              String sha256, long byteSize, int recordCount, int attachmentCount,
                              String schemaVersion, String generatedBy, Instant now);
}
