package com.vntech.erp.infrastructure.persistence;

import com.vntech.erp.application.port.out.ErrorReportStore;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * USER 29/09/2026 (MỐC 42) — adapter JDBC cho {@code error_reports} (chức năng Báo lỗi · tab 14).
 *
 * <p>⛔ <b>PORTABILITY</b> — bảng dùng {@code VARCHAR(32)} cho {@code created_at}/{@code updated_at}
 * (đồng bộ phần còn lại của hệ thống, ⛔ KHÔNG phải {@code DATETIME}) ⇒ mọi mốc thời gian ở đây là
 * <b>chuỗi</b> {@code yyyy-MM-dd HH:mm:ss}, không dùng {@code java.sql.Timestamp} (sẽ không chạy
 * được trên engine test khác MySQL).
 *
 * <p>⛔ <b>ALIAS TRÍCH DẪN</b> ({@code AS "reportCode"}) — giữ nguyên chữ hoa ở CẢ MySQL và H2.
 */
@Component
public class ErrorReportStoreAdapter implements ErrorReportStore {

    private final JdbcTemplate jdbcTemplate;

    public ErrorReportStoreAdapter(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public boolean insert(Map<String, Object> report) {
        List<Object> args = new ArrayList<>();
        args.add(str(report, "id"));
        args.add(str(report, "reportCode"));
        args.add(str(report, "reportType"));
        args.add(str(report, "title"));
        args.add(str(report, "moduleKey"));
        args.add(str(report, "content"));
        args.add(str(report, "userId"));
        args.add(str(report, "username"));
        args.add(str(report, "fullName"));
        args.add(str(report, "employeeCode"));
        args.add(str(report, "organizationUnitId"));
        args.add(str(report, "organizationName"));
        args.add(str(report, "createdAt"));
        args.add(str(report, "updatedAt"));
        int n = jdbcTemplate.update("""
                INSERT INTO error_reports (id,report_code,report_type,title,module_key,content,
                                          user_id,username,full_name,employee_code,
                                          organization_unit_id,organization_name,
                                          status,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'open',?,?)""", args.toArray());
        return n > 0;
    }

    @Override
    public List<Map<String, Object>> list(String status, int limit) {
        // ⛔ `status` KHÔNG ghép trực tiếp vào SQL (chống SQL injection); dùng tham số `?`.
        // ⛔ LIMIT cũng là tham số để không phụ thuộc cú pháp `LIMIT` khác nhau giữa MySQL/H2.
        int safeLimit = Math.max(1, Math.min(500, limit));
        if (status == null || status.isBlank()) {
            return jdbcTemplate.queryForList("""
                    SELECT id AS "id",report_code AS "reportCode",
                           report_type AS "reportType",title AS "title",
                           module_key AS "moduleKey",content AS "content",
                           user_id AS "userId",username AS "username",full_name AS "fullName",
                           employee_code AS "employeeCode",
                           organization_unit_id AS "organizationUnitId",
                           organization_name AS "organizationName",
                           status AS "status",resolved_at AS "resolvedAt",
                           resolution_note AS "resolutionNote",
                           created_at AS "createdAt",updated_at AS "updatedAt"
                    FROM error_reports
                    ORDER BY created_at DESC,id DESC
                    LIMIT ?""", safeLimit);
        }
        return jdbcTemplate.queryForList("""
                SELECT id AS "id",report_code AS "reportCode",title AS "title",
                       module_key AS "moduleKey",content AS "content",
                       user_id AS "userId",username AS "username",full_name AS "fullName",
                       employee_code AS "employeeCode",
                       organization_unit_id AS "organizationUnitId",
                       organization_name AS "organizationName",
                       status AS "status",resolved_at AS "resolvedAt",
                       resolution_note AS "resolutionNote",
                       created_at AS "createdAt",updated_at AS "updatedAt"
                FROM error_reports
                WHERE status=?
                ORDER BY created_at DESC,id DESC
                LIMIT ?""", status, safeLimit);
    }

    @Override
    public boolean markResolved(String reportId, String resolvedAt, String note) {
        int n = jdbcTemplate.update("""
                UPDATE error_reports
                   SET status=?,resolved_at=?,resolution_note=?,updated_at=?
                 WHERE id=?""",
                resolvedAt == null ? "open" : "resolved",
                resolvedAt,
                note,
                resolvedAt,
                reportId);
        return n > 0;
    }

    private static String str(Map<String, Object> row, String key) {
        Object v = row.get(key);
        return v == null ? null : String.valueOf(v);
    }
}
