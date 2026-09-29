package com.vntech.erp.application.service;

import com.vntech.erp.application.port.out.ErrorReportStore;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * USER 29/09/2026 (MỐC 42) — nghiệp vụ **BÁO LỖI** (tab 14 «Báo lỗi» của màn Quản trị).
 *
 * <p>Luồng: mọi user đã đăng nhập bấm nút báo lỗi (cạnh nút đổi màu nền) → điền
 * <b>tiêu đề · mục cần báo lỗi · nội dung</b> → gửi → quản trị viên xem ở tab 14,
 * bấm tick ✓ để đánh dấu đã xử lý. Danh sách **ưu tiên report gần nhất**.
 */
public class ErrorReportUseCase {

    /** ⛔ user yêu cầu: chỉ báo lỗi về chức năng NGHIỆP VỤ, ngoại trừ module `admin`. */
    private static final String FORBIDDEN_MODULE = "admin";

    /** MỐC 103 — hai loại report: góp ý hoặc báo lỗi. */
    public static final String TYPE_SUGGESTION = "gop_y";
    public static final String TYPE_ERROR = "bao_loi";

    private static final DateTimeFormatter STAMP = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final ErrorReportStore store;

    public ErrorReportUseCase(ErrorReportStore store) {
        this.store = store;
    }

    /**
     * USER 29/09/2026 — lưu report lỗi.
     *
     * @param payload {@code title} · {@code moduleKey} · {@code content} · thông tin người gửi
     *                ({@code userId} · {@code username} · {@code fullName} · {@code employeeCode} ·
     *                {@code organizationUnitId} · {@code organizationName}).
     */
    public Map<String, Object> save(Map<String, Object> payload) {
        String title = trim(payload.get("title"));
        String moduleKey = trim(payload.get("moduleKey"));
        String content = trim(payload.get("content"));
        // MỐC 103 — «MỤC» = góp ý | báo lỗi (mặc định `bao_loi` cho bản ghi cũ).
        String reportType = trim(payload.get("reportType"));
        if (reportType.isEmpty()) reportType = TYPE_ERROR;
        if (!TYPE_SUGGESTION.equals(reportType) && !TYPE_ERROR.equals(reportType))
            throw Api("Mục chỉ được «góp ý» hoặc «báo lỗi».");
        if (title.isEmpty()) throw Api("Thiếu tiêu đề.");
        if (content.isEmpty()) throw Api("Thiếu nội dung.");
        // ⛔ MỐC 103 — «nhóm chức năng» KHÔNG BẮT BUỘC (user 29/09: «không bắt buộc»).
        if (moduleKey.isEmpty()) moduleKey = null;
        if (FORBIDDEN_MODULE.equalsIgnoreCase(moduleKey))
            throw Api("Không báo lỗi về chức năng của màn Quản trị hệ thống.");

        String now = LocalDateTime.now().format(STAMP);
        String code = "ER" + now.replaceAll("\\D", "").substring(0, 12) + "-"
                + UUID.randomUUID().toString().substring(0, 4).toUpperCase();

        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", "ERPT_" + UUID.randomUUID().toString().replace("-", ""));
        row.put("reportCode", code);
        row.put("reportType", reportType);
        row.put("title", title);
        row.put("moduleKey", moduleKey);
        row.put("content", content);
        row.put("userId", trim(payload.get("userId")));
        row.put("username", trim(payload.get("username")));
        row.put("fullName", trim(payload.get("fullName")));
        row.put("employeeCode", trim(payload.get("employeeCode")));
        row.put("organizationUnitId", trim(payload.get("organizationUnitId")));
        row.put("organizationName", trim(payload.get("organizationName")));
        row.put("createdAt", now);
        row.put("updatedAt", now);

        if (!store.insert(row)) throw Api("Không lưu được báo lỗi.");
        return Map.of("ok", true, "reportCode", code);
    }

    /** USER 29/09/2026 — danh sách report cho tab 14 (⛔ mới nhất trước). */
    public List<Map<String, Object>> list(Map<String, Object> payload) {
        String status = trim(payload.get("status"));
        if (status.isEmpty()) status = null;
        return store.list(status, 200);
    }

    /** USER 29/09/2026 — tick ✓ đánh dấu đã xử lý (hoặc mở lại khi bỏ tick). */
    public Map<String, Object> resolve(Map<String, Object> payload) {
        String id = trim(payload.get("reportId"));
        if (id.isEmpty()) throw Api("Thiếu mã report.");
        boolean resolved = payload.get("resolved") == null
                || Boolean.parseBoolean(String.valueOf(payload.get("resolved")));
        String stamp = resolved ? LocalDateTime.now().format(STAMP) : null;
        if (!store.markResolved(id, stamp, trim(payload.get("note"))))
            throw Api("Không tìm thấy report " + id + ".");
        return Map.of("ok", true);
    }

    private static String trim(Object v) {
        return v == null ? "" : String.valueOf(v).trim();
    }

    /**
     * ⛔ QUY UOC CUA DU AN: loi nghiep vu phai tra `AuthUseCase.ApiError(message, 400)`
     * (xem `NotificationManagementUseCase.Api` L247-252) ⇒ tra HTTP 400 chu khong phai 500.
     */
    private static RuntimeException Api(String message) {
        return new AuthUseCase.ApiError(message, 400);
    }
}
