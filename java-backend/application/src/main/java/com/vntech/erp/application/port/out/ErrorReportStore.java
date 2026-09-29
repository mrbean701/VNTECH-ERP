package com.vntech.erp.application.port.out;

import java.util.List;
import java.util.Map;

/**
 * USER 29/09/2026 (MỐC 42) — cổng dữ liệu cho chức năng **BÁO LỖI** (tab 14 «Báo lỗi»).
 *
 * <p>Bảng {@code error_reports} được tạo MỚI trong {@code drizzle/0277_...sql}
 * (⛔ đã kiểm tra §10: {@code production_reports} = báo cáo sản xuất, {@code stock_issues} = lỗi
 * tồn kho ⇒ HAI nghiệp vụ KHÁC, không tái dùng được).
 *
 * <p>Luồng nghiệp vụ:
 * <pre>
 *   MỌI user đã đăng nhập  ──save()──▶  error_reports (status='open')
 *   Quản trị viên           ──list()──▶  tab 14, MỚI NHẤT TRƯỚC
 *   Quản trị viên           ──resolve()▶  status='resolved' + resolved_at
 * </pre>
 *
 * <p>⛔ Phân quyền: {@code save_error_report} KHÔNG gắc module (`List.of()` trong
 * {@code ActionRbacRegistry}) ⇒ ai đã đăng nhập cũng gửi được — đúng yêu cầu «nút báo lỗi
 * nằm cạnh nút đổi màu nền, ai cũng bấm được». {@code error_reports} + {@code
 * mark_error_report_resolved} gắn module {@code admin} ⇒ chỉ quản trị viên xem/tick.
 */
public interface ErrorReportStore {

    /**
     * USER 29/09/2026 — lưu 1 report lỗi do user gửi.
     *
     * @param report Map đã chuẩn hoá: {@code reportCode} (bắt buộc) · {@code title} ·
     *               {@code moduleKey} (⛔ KHÔNG được là module `admin`) · {@code content} ·
     *               {@code userId} · {@code username} · {@code fullName} · {@code employeeCode} ·
     *               {@code organizationUnitId} · {@code organizationName} · {@code createdAt}
     * @return {@code true} nếu INSERT thành công.
     */
    boolean insert(Map<String, Object> report);

    /**
     * USER 29/09/2026 — danh sách report cho tab 14.
     * ⛔ Sắp **MỚI NHẤT TRƯỚC** ({@code created_at DESC}) theo yêu cầu user.
     *
     * @param status {@code null} = tất cả; {@code "open"} = chưa xử lý; {@code "resolved"} = đã xử lý.
     */
    List<Map<String, Object>> list(String status, int limit);

    /**
     * USER 29/09/2026 — tick «đã xử lý xong» (nút ✓ trong danh sách tab 14).
     *
     * @param resolvedAt thời điểm xử lý (chuỗi); {@code null} ⇒ mở lại thành {@code open}.
     * @return {@code true} nếu có dòng bị cập nhật.
     */
    boolean markResolved(String reportId, String resolvedAt, String note);
}
