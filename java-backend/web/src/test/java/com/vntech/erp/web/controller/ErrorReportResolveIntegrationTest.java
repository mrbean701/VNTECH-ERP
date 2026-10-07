package com.vntech.erp.web.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * GO-LIVE 05/10/2026 — NGHIỆM THU BẢN VÁ <b>BUG-20261005-008</b> (MEDIUM).
 *
 * <p><b>LỖI ĐƯỢC VÁ.</b> {@code ErrorReportStoreAdapter.markResolved} truyền <b>{@code resolvedAt}
 * vào cột {@code updated_at}</b> (lỗi copy-paste: tham số thứ 4 đúng ra phải là thời điểm cập nhật).
 * {@code updated_at} là <b>{@code NOT NULL}</b> trên MySQL ⇒ khi <b>MỞ LẠI</b> report
 * ({@code resolved = false} ⇒ {@code resolvedAt = null}) thì ghi {@code NULL} ⇒
 * {@code DataIntegrityViolationException} ⇒ <b>nhánh «mở lại» hỏng 100%</b>. UI
 * {@code ErrorReportAdminPanel} gọi đúng nhánh đó khi tick vào report <b>đã xong</b>
 * ({@code next = String(r.status) !== "resolved"} ⇒ {@code false}), và người dùng chỉ thấy thông báo
 * sai lệch «Dữ liệu vi phạm ràng buộc của hệ thống…» — ⛔ không phải lỗi dữ liệu của họ.
 *
 * <p><b>VÌ SAO VỆ NÀY KHẲNG ĐỊNH «{@code updated_at} KHÁC NULL» MÀ KHÔNG DỰA VÀO RÀNG BUỘC.</b>
 * Trong {@code schema-h2.sql} (schema kiểm thử), {@code updated_at} là <b>{@code NULL}</b>-able,
 * còn trên MySQL là <b>{@code NOT NULL}</b> ⇒ <b>H2 KHÔNG tái hiện được lỗi ràng buộc</b>. Vì vậy vệ
 * khẳng định <b>hành vi quan sát được</b> — đúng thứ MySQL cưỡng chế: sau khi mở lại,
 * {@code updated_at} <b>PHẢI có giá trị</b>. Với mã CŨ, khẳng định này <b>ĐỎ</b>
 * ({@code updated_at} bị ghi {@code NULL}); với bản vá thì XANH.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class ErrorReportResolveIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbc;

    private jakarta.servlet.http.Cookie adminCookie;

    private MvcResult postAction(String json, int expectStatus) throws Exception {
        var req = post("/api/system").contentType(MediaType.APPLICATION_JSON).content(json);
        if (adminCookie != null) req.cookie(adminCookie);
        var res = mockMvc.perform(req);
        res.andExpect(status().is(expectStatus));
        return res.andReturn();
    }

    private static String action(String name, String fields) {
        return "{\"action\":\"" + name + "\"" + (fields.isEmpty() ? "" : "," + fields) + "}";
    }

    private void seed() throws Exception {
        MvcResult setup = postAction(action("setup",
                "\"companyName\":\"Công ty VNTECH\",\"fullName\":\"Quản trị viên\","
                        + "\"username\":\"admin\",\"password\":\"VnTech@123\""), 201);
        adminCookie = setup.getResponse().getCookie("mep_session");
        Instant now = Instant.now();
        String stamp = "2026-10-05 03:00:00";
        jdbc.update("INSERT INTO error_reports (id,report_code,report_type,title,module_key,content,"
                        + "username,full_name,status,created_at,updated_at) "
                        + "VALUES (?,?,?,?,?,?,?,?, 'open', ?, ?)",
                "ERPT_test_1", "ER-2026-0001", "bao_loi", "Nút Lưu không phản hồi", "purchasing",
                "Nội dung báo lỗi kiểm thử", "e2e.kh", "E2E Nhân viên", stamp, stamp);
        assertNotNull(now);
    }

    @Test
    void moLaiBaoLoi_khongDuocGhiNULLVaoUpdatedAt() throws Exception {
        seed();

        // ① ĐÁNH DẤU ĐÃ XỬ LÝ XONG — nhánh vốn vẫn chạy được.
        postAction(action("mark_error_report_resolved",
                "\"reportId\":\"ERPT_test_1\",\"resolved\":true,\"note\":\"Đã khắc phục\""), 200);
        String statusSau = jdbc.queryForObject("SELECT status FROM error_reports WHERE id='ERPT_test_1'", String.class);
        String resolvedAt = jdbc.queryForObject("SELECT resolved_at FROM error_reports WHERE id='ERPT_test_1'", String.class);
        String note = jdbc.queryForObject("SELECT resolution_note FROM error_reports WHERE id='ERPT_test_1'", String.class);
        assertTrue("resolved".equals(statusSau), "đánh dấu xong ⇒ status phải 'resolved': " + statusSau);
        assertNotNull(resolvedAt, "đánh dấu xong ⇒ phải ghi `resolved_at`");
        assertTrue("Đã khắc phục".equals(note), "phải ghi `resolution_note`: " + note);

        // ② MỞ LẠI — ĐÂY LÀ NHÁNH BỊ LỖI. Trước bản vá: 409 «Dữ liệu vi phạm ràng buộc…».
        postAction(action("mark_error_report_resolved",
                "\"reportId\":\"ERPT_test_1\",\"resolved\":false"), 200);
        String statusLai = jdbc.queryForObject("SELECT status FROM error_reports WHERE id='ERPT_test_1'", String.class);
        String resolvedAtLai = jdbc.queryForObject("SELECT resolved_at FROM error_reports WHERE id='ERPT_test_1'", String.class);
        String updatedAtLai = jdbc.queryForObject("SELECT updated_at FROM error_reports WHERE id='ERPT_test_1'", String.class);
        assertTrue("open".equals(statusLai), "mở lại ⇒ status phải về 'open': " + statusLai);
        assertNull(resolvedAtLai, "mở lại ⇒ phải XOÁ `resolved_at`");
        // ⛔ KHẲNG ĐỊNH CỦA BẢN VÁ: `updated_at` là NOT NULL trên MySQL ⇒ ⛔ không được ghi NULL.
        assertNotNull(updatedAtLai,
                "MỞ LẠI không được ghi NULL vào `updated_at` (MySQL: NOT NULL) — "
                        + "trước bản vá adapter lấy `resolvedAt` gán cho cột này nên hỏng 100%");
    }

    @Test
    void doiChungAm_maSaiVaThieuMaDeuBiChan() throws Exception {
        seed();
        // ⛔ Không có vệ này thì vệ trên có thể «xanh vô nghĩa» nếu action nhận bừa mọi tham số.
        MvcResult r1 = postAction(action("mark_error_report_resolved",
                "\"reportId\":\"ERPT_khong_ton_tai\",\"resolved\":true"), 400);
        String b1 = r1.getResponse().getContentAsString();
        assertTrue(b1.contains("Không tìm thấy report"), "mã sai phải báo «Không tìm thấy report»: " + b1);

        MvcResult r2 = postAction(action("mark_error_report_resolved", "\"resolved\":true"), 400);
        String b2 = r2.getResponse().getContentAsString();
        assertTrue(b2.contains("Thiếu mã report"), "thiếu mã phải báo «Thiếu mã report»: " + b2);
    }
}
