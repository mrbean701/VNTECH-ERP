package com.vntech.erp.application.service;

import com.vntech.erp.application.port.out.FileStore;
import com.vntech.erp.application.service.AuthUseCase.ApiError;
import com.vntech.erp.application.service.AuthUseCase.CurrentUser;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/**
 * Port {@code app/api/files/route.ts} — tệp đính kèm + archive dự án offline.
 *
 * <p>Giữ nguyên toàn bộ ngữ nghĩa của JS: giới hạn 20 MB, mã lỗi 401/400/413/403/404/500,
 * ma trận quyền {@code assertEntityAccess}, quy tắc riêng cho {@code material_request} khi ghi/xóa,
 * và định dạng archive {@code VNTECH_PROJECT_OFFLINE_ARCHIVE_V1} (MANIFEST.json + README.txt + sha256).
 */
public class FileUseCase {

    /** Giới hạn 20 MB — giống MAX_SIZE trong JS. */
    public static final long MAX_SIZE = 20L * 1024 * 1024;

    private static final String SCHEMA_VERSION = "5.3.0-FULL-W2-0047";
    private static final List<String> WRITE_SCOPE_PERMISSIONS = List.of("write", "approve", "admin");
    private static final DateTimeFormatter DAY = DateTimeFormatter.ofPattern("yyyyMMdd");

    private final FileStore store;

    public FileUseCase(FileStore store) {
        this.store = store;
    }

    // ================= POST /api/files =================

    /** @return {id, fileName} của tệp vừa lưu. */
    public Map<String, Object> upload(CurrentUser user, String entityType, String entityId,
                                      String fileName, String contentType, long size, byte[] content) {
        requireLogin(user);
        if (fileName == null || fileName.isBlank() || entityType == null || entityType.isBlank()
                || entityId == null || entityId.isBlank()) {
            throw new ApiError("Thiếu tệp hoặc chứng từ liên quan.", 400);
        }
        if (size > MAX_SIZE) throw new ApiError("Tệp vượt giới hạn 20 MB.", 413);
        assertEntityAccess(user, entityType, entityId, true);

        String attachmentId = "ATT_" + UUID.randomUUID();
        String storageKey = entityType + "/" + entityId + "/" + attachmentId + "-" + safeName(fileName);
        String mime = (contentType == null || contentType.isBlank()) ? "application/octet-stream" : contentType;
        Instant now = Instant.now();
        store.putObject(storageKey, content == null ? new byte[0] : content);
        try {
            store.insertAttachment(attachmentId, entityType, entityId, fileName, storageKey, mime, user.id(), now);
        } catch (RuntimeException e) {
            // Không để lại object mồ côi nếu ghi metadata thất bại (JS cũng put BUCKET trước rồi mới INSERT).
            try { store.deleteObject(storageKey); } catch (RuntimeException ignored) { /* best effort */ }
            throw e;
        }
        Map<String, Object> attachment = new LinkedHashMap<>();
        attachment.put("id", attachmentId);
        attachment.put("fileName", fileName);
        return Map.of("attachment", attachment);
    }

    // ================= GET /api/files =================

    /** GET ?entityType=&entityId= — danh sách tệp của một chứng từ. */
    public List<Map<String, Object>> list(CurrentUser user, String entityType, String entityId) {
        requireLogin(user);
        assertEntityAccess(user, entityType, entityId, false);
        return store.listAttachments(entityType, entityId);
    }

    /** GET ?id= — nội dung tệp để tải xuống. */
    public Download download(CurrentUser user, String attachmentId) {
        requireLogin(user);
        Map<String, Object> row = store.findAttachment(attachmentId)
                .orElseThrow(() -> new ApiError("Không tìm thấy tệp", 404));
        String entityType = str(row.get("entityType"));
        String entityId = str(row.get("entityId"));
        assertEntityAccess(user, entityType, entityId, false);
        byte[] bytes = store.getObject(str(row.get("storageKey")))
                .orElseThrow(() -> new ApiError("Không tìm thấy dữ liệu tệp", 404));
        return new Download(bytes, str(row.get("mimeType")), str(row.get("fileName")));
    }

    // ================= DELETE /api/files =================

    public void delete(CurrentUser user, String attachmentId) {
        requireLogin(user);
        if (attachmentId == null || attachmentId.isBlank()) throw new ApiError("Thiếu mã tệp.", 400);
        Map<String, Object> row = store.findAttachment(attachmentId)
                .orElseThrow(() -> new ApiError("Không tìm thấy tệp.", 404));
        String entityType = str(row.get("entityType"));
        String entityId = str(row.get("entityId"));
        assertEntityAccess(user, entityType, entityId, true);
        if (isAdmin(user)) {
            // admin bỏ qua kiểm tra roleBase đặc thù bên dưới (giống JS)
        } else if ("material_request".equals(entityType)
                && !List.of("commander", "project").contains(roleBase(user))) {
            throw new ApiError("Chỉ Chỉ huy trưởng hoặc Phòng Dự án được xóa hồ sơ vật tư đặc thù.", 403);
        }
        store.deleteObject(str(row.get("storageKey")));
        store.deleteAttachment(attachmentId);
    }

    // ================= GET ?projectArchive= =================

    /** Archive ZIP toàn bộ dữ liệu dự án — chỉ admin (giống JS). */
    public ProjectArchive projectArchive(CurrentUser user, String projectId) {
        requireLogin(user);
        if (!isAdmin(user)) throw new ApiError("Chỉ Quản trị viên được xuất toàn bộ dữ liệu dự án.", 403);
        Map<String, Object> project = store.findProject(projectId)
                .orElseThrow(() -> new ApiError("Không tìm thấy dự án.", 500));

        // data/<table>.json cho từng nhóm bảng — thứ tự và bộ bảng do adapter cung cấp theo đúng JS.
        List<FileStore.ArchiveTable> tables = store.archiveTables(projectId);
        Map<String, byte[]> files = new LinkedHashMap<>();
        int recordCount = 0;
        List<Map<String, Object>> attachmentRows = List.of();
        List<String> entityIds = new ArrayList<>();
        for (FileStore.ArchiveTable table : tables) {
            recordCount += table.rows().size();
            files.put("data/" + table.name() + ".json", jsonBytes(table.rows()));
            if ("attachments".equals(table.name())) attachmentRows = table.rows();
            for (Map<String, Object> row : table.rows()) {
                Object id = row.get("id");
                if (id != null) entityIds.add(String.valueOf(id));
            }
        }

        List<Map<String, Object>> attachmentManifest = new ArrayList<>();
        for (Map<String, Object> a : attachmentRows) {
            String storageKey = str(a.get("storageKey"));
            String fileName = str(a.get("fileName"));
            byte[] bytes = store.getObject(storageKey)
                    .orElseThrow(() -> new ApiError("Thiếu tệp đính kèm " + fileName
                            + "; không thể xác nhận archive đầy đủ.", 500));
            String rel = "attachments/" + safeName(str(a.get("id"))) + "-" + safeName(fileName);
            files.put(rel, bytes);
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", a.get("id"));
            m.put("fileName", a.get("fileName"));
            m.put("mimeType", a.get("mimeType"));
            m.put("path", rel);
            m.put("sha256", sha256Hex(bytes));
            attachmentManifest.add(m);
        }

        Map<String, Object> tableCounts = new LinkedHashMap<>();
        for (FileStore.ArchiveTable table : tables) tableCounts.put(table.name(), table.rows().size());

        Map<String, Object> projectMeta = new LinkedHashMap<>();
        projectMeta.put("id", project.get("id"));
        projectMeta.put("code", project.get("code"));
        projectMeta.put("name", project.get("name"));
        projectMeta.put("status", project.get("status"));

        Map<String, Object> manifest = new LinkedHashMap<>();
        manifest.put("format", "VNTECH_PROJECT_OFFLINE_ARCHIVE_V1");
        manifest.put("schemaVersion", SCHEMA_VERSION);
        manifest.put("generatedAt", Instant.now().toString());
        manifest.put("generatedBy", user.id());
        manifest.put("project", projectMeta);
        manifest.put("recordCount", recordCount);
        manifest.put("attachmentCount", attachmentRows.size());
        manifest.put("tables", tableCounts);
        manifest.put("attachments", attachmentManifest);

        files.put("MANIFEST.json", jsonBytes(manifest));
        String readme = "VNTECH ERP PROJECT OFFLINE ARCHIVE\n"
                + "Project: " + str(project.get("code")) + " - " + str(project.get("name")) + "\n"
                + "Generated: " + manifest.get("generatedAt") + "\n"
                + "Records: " + recordCount + "\n"
                + "Attachments: " + attachmentRows.size() + "\n"
                + "Keep this ZIP unchanged. Use MANIFEST.json and SHA-256 for integrity verification.\n";
        files.put("README.txt", readme.getBytes(StandardCharsets.UTF_8));

        byte[] zipped = zip(files);
        String archiveSha = sha256Hex(zipped);
        String fileName = "VNTECH_PROJECT_" + safeName(str(project.get("code"))) + "_OFFLINE_"
                + LocalDate.now().format(DAY) + ".zip";
        String archiveId = "PAR_" + UUID.randomUUID();
        store.insertProjectArchive(archiveId, str(project.get("id")), str(project.get("code")),
                str(project.get("name")), fileName, archiveSha, zipped.length, recordCount,
                attachmentRows.size(), SCHEMA_VERSION, user.id(), Instant.now());
        return new ProjectArchive(zipped, fileName, archiveId, archiveSha, recordCount, attachmentRows.size());
    }

    // ================= RBAC — port assertEntityAccess =================

    private void assertEntityAccess(CurrentUser user, String entityType, String entityId, boolean write) {
        String projectId = store.entityProjectId(entityType, entityId).orElse(null);
        if (projectId == null || projectId.isBlank()) {
            throw new ApiError("Chứng từ không tồn tại hoặc loại hồ sơ không được hỗ trợ.", 403);
        }
        if (!isAdmin(user)) {
            Optional<String> scope = store.projectScopePermission(user.id(), projectId);
            if (scope.isEmpty()) throw new ApiError("Tài khoản không được truy cập hồ sơ của dự án này.", 403);
            if (write && !WRITE_SCOPE_PERMISSIONS.contains(scope.get())) {
                throw new ApiError("Tài khoản chỉ được xem hồ sơ dự án này.", 403);
            }
        }
        if (!store.moduleAllowed(user.id(), entityType, write)) {
            throw new ApiError(write
                    ? "Tài khoản chưa được phép tải hồ sơ lên mục này."
                    : "Tài khoản không được xem mục hồ sơ này.", 403);
        }
    }

    private static void requireLogin(CurrentUser user) {
        if (user == null) throw new ApiError("Chưa đăng nhập.", 401);
    }

    private static boolean isAdmin(CurrentUser user) {
        return "admin".equals(user.role());
    }

    private static String roleBase(CurrentUser user) {
        String base = user.roleBase();
        return (base == null || base.isBlank()) ? user.role() : base;
    }

    // ================= helpers =================

    /** safeName() của JS: NFKD, giữ [a-zA-Z0-9._-], gộp '-', tối đa 120 ký tự. */
    static String safeName(String name) {
        if (name == null) return "tai-lieu";
        String n = java.text.Normalizer.normalize(name, java.text.Normalizer.Form.NFKD)
                .replaceAll("[^a-zA-Z0-9._-]+", "-")
                .replaceAll("-+", "-");
        if (n.length() > 120) n = n.substring(0, 120);
        return n.isEmpty() ? "tai-lieu" : n;
    }

    private static String str(Object o) {
        return o == null ? "" : String.valueOf(o);
    }

    private static byte[] jsonBytes(Object value) {
        return JsonWriter.write(value).getBytes(StandardCharsets.UTF_8);
    }

    private static String sha256Hex(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] out = digest.digest(data);
            StringBuilder sb = new StringBuilder(out.length * 2);
            for (byte b : out) sb.append(String.format(Locale.ROOT, "%02x", b));
            return sb.toString();
        } catch (Exception e) {
            throw new IllegalStateException("Không tính được SHA-256.", e);
        }
    }

    private static byte[] zip(Map<String, byte[]> files) {
        try {
            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            try (ZipOutputStream zip = new ZipOutputStream(buffer, StandardCharsets.UTF_8)) {
                for (Map.Entry<String, byte[]> entry : files.entrySet()) {
                    zip.putNextEntry(new ZipEntry(entry.getKey()));
                    zip.write(entry.getValue());
                    zip.closeEntry();
                }
            }
            return buffer.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("Không tạo được ZIP archive.", e);
        }
    }

    // ================= kiểu trả về =================

    public record Download(byte[] content, String contentType, String fileName) {}

    public record ProjectArchive(byte[] content, String fileName, String archiveId, String sha256,
                                 int recordCount, int attachmentCount) {}
}
