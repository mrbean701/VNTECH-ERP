package com.vntech.erp.web.controller;

import jakarta.servlet.http.Cookie;
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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/**
 * T-13 / `Q2-b` (USER 08/10/2026) — **QUYỀN DUYỆT CÔNG VIỆC TÁCH RIÊNG** (`approve_work_item` / `canApprove`):
 * chứng minh **RUNTIME** cả 2 tầng chặn, ⛔ không chỉ khai báo tĩnh.
 *
 * <p><b>VÌ SAO CẦN BÀI NÀY (⭐ lỗ hổng kiểm thử THẬT):</b>
 * <ul>
 *   <li>`tests/t13-work-progress-cell.test.mjs` + `tests/t07-kanban-board.test.mjs` chỉ <b>so CHUỖI khai báo</b>
 *       (registry `canApprove` · route Node · FE gọi action nào) — ⛔ **không chứng minh ai bị CHẶN**;</li>
 *   <li>`java-backend/web/src/test/**` ⛔ **KHÔNG có test nào** cho `approve_work_item`/`update_work_item_status`;</li>
 *   <li>⭐ `BUG-D18` (S4 tự phát hiện 08/10) là **hồi quy THẬT** của chính việc tách action: trước khi tách, nút
 *       «Duyệt» đi qua `update_work_item_status` (`canEdit`) ⇒ quản lý phòng duyệt được; sau khi tách, nó đi qua
 *       `approve_work_item` (**`canApprove`**) mà ĐO CSDL cho thấy `can_approve=0` ⇒ quản lý phòng bị **403**.</li>
 * </ul>
 *
 * <p><b>3 ca (1 DƯƠNG + 2 ĐỐI CHỨNG ÂM — luật `MỐC 110 §7`):</b>
 * <ol>
 *   <li>Quản lý phòng có `canApprove` ⇒ duyệt `COMPLETED` **THÀNH CÔNG** (200) + trạng thái ĐỔI;</li>
 *   <li>Người ĐƯỢC GIAO việc có `canEdit` nhưng ⛔ **KHÔNG** `canApprove` ⇒ bị chặn ở **CỔNG QUYỀN** (403)
 *       ⇒ ⭐ chứng minh `canApprove` là **bắt buộc** (đúng cơ chế `BUG-D18`);</li>
 *   <li>Cùng người đó ⭐ **ĐƯỢC cấp `canApprove`** nhưng ⛔ **không phải trưởng phòng** ⇒ bị chặn ở
 *       **LUẬT NGHIỆP VỤ** (400 «Người thực hiện chỉ Gửi kiểm tra …») + trạng thái ⛔ **KHÔNG đổi**
 *       ⇒ ⭐ chứng minh cấp quyền duyệt ⛔ **không** phá luật «trưởng phòng mới xác nhận Hoàn thành».</li>
 * </ol>
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class WorkApprovePermissionSplitTest {

    private static final String RBAC_DENIED =
            "Tài khoản chưa được quản trị viên cấp đúng quyền cho thao tác này.";
    private static final String CHI_TRUONG_PHONG =
            "Người thực hiện chỉ Gửi kiểm tra; Trưởng phòng/người có thẩm quyền mới xác nhận Hoàn thành.";

    /** Nhiệm vụ của người ĐƯỢC GIAO (⛔ không có `canApprove`). */
    private static final String WI_THUONG = "wi_duyet_1";
    /** Nhiệm vụ của người ĐƯỢC GIAO ⭐ CÓ `canApprove` (nhưng ⛔ không phải trưởng phòng). */
    private static final String WI_CO_APPROVE = "wi_duyet_2";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbc;

    private Cookie coTruongPhong;
    private Cookie coNhanVien;
    private Cookie coNhanVienCoApprove;

    private MvcResult postAs(Cookie cookie, String json) throws Exception {
        return mockMvc.perform(post("/api/system").contentType(MediaType.APPLICATION_JSON)
                .content(json).cookie(cookie)).andReturn();
    }

    private static String body(MvcResult r) throws Exception {
        return r.getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8);
    }

    private String duyet(String workItemId) {
        return "{\"action\":\"approve_work_item\",\"workItemId\":\"" + workItemId
                + "\",\"status\":\"COMPLETED\"}";
    }

    private String trangThai(String workItemId) {
        return jdbc.queryForObject("SELECT status FROM work_items WHERE id=?", String.class, workItemId);
    }

    /**
     * Seed: admin (setup) + `module_catalog` khoá `work` + 3 tài khoản + 2 nhiệm vụ phòng `KH`:
     * <ul>
     *   <li>{@code u.khtruong} — Trưởng phòng KH (`role='kh_truong'`) · `work` **can_approve=1**;</li>
     *   <li>{@code kh.nv} — nhân viên ĐƯỢC GIAO · `work` `can_use/can_edit=1`, ⛔ **can_approve=0**;</li>
     *   <li>{@code kh.nv2} — nhân viên ĐƯỢC GIAO khác · `work` `can_use/can_edit=1`, ⭐ **can_approve=1**.</li>
     * </ul>
     */
    private void seed() throws Exception {
        Instant now = Instant.now();
        mockMvc.perform(post("/api/system").contentType(MediaType.APPLICATION_JSON)
                .content("{\"action\":\"setup\",\"companyName\":\"Công ty VNTECH\",\"fullName\":\"Quản trị viên\","
                        + "\"username\":\"admin\",\"password\":\"" + TestActors.PASSWORD + "\"}"))
                .andReturn();

        Integer coWork = jdbc.queryForObject(
                "SELECT COUNT(*) FROM module_catalog WHERE module_key='work'", Integer.class);
        if (coWork == null || coWork == 0) {
            jdbc.update("INSERT INTO module_catalog (module_key,label,icon,active,sort_order,created_at,updated_at)"
                    + " VALUES ('work','Công việc (mọi phòng ban)','CV',1,9,?,?)", now, now);
        }

        taiKhoan("u.khtruong", "kh.truong", "Trưởng phòng Kế hoạch", "kh_truong", now, 1);
        taiKhoan("u.nv", "kh.nv", "Nhân viên Kế hoạch", "engineer", now, 0);
        taiKhoan("u.nv2", "kh.nv2", "Nhân viên Kế hoạch 2", "engineer", now, 1);

        nhiemVu(WI_THUONG, "TASK-DUYET-1", "u.nv", now);
        nhiemVu(WI_CO_APPROVE, "TASK-DUYET-2", "u.nv2", now);

        coTruongPhong = TestActors.login(mockMvc, "kh.truong");
        coNhanVien = TestActors.login(mockMvc, "kh.nv");
        coNhanVienCoApprove = TestActors.login(mockMvc, "kh.nv2");
    }

    private void taiKhoan(String id, String username, String fullName, String role, Instant now, int canApprove) {
        jdbc.update("INSERT INTO users (id,employee_code,full_name,username,password_hash,role,department,"
                        + "approval_limit,active,must_change_password,created_at,updated_at)"
                        + " VALUES (?,?,?,?,?,?,?,0,1,0,?,?)",
                id, "NV-" + id, fullName, username, TestActors.passwordHash(TestActors.PASSWORD), role,
                "Phòng Kế hoạch", now, now);
        jdbc.update("INSERT INTO user_module_permissions (id,user_id,module_key,can_view,can_use,can_create,"
                        + "can_edit,can_approve,can_export,permission_source,created_at,updated_at)"
                        + " VALUES (?,?,'work',1,1,0,1,?,0,'manual_override',?,?)",
                "ump_" + id, id, canApprove, now, now);
    }

    private void nhiemVu(String id, String taskNo, String assignedTo, Instant now) {
        jdbc.update("INSERT INTO work_items (id,task_no,department_code,work_group,title,work_step,dedupe_key,"
                        + "assigned_to,assigned_by,assigned_at,status,progress,active,created_at,updated_at)"
                        + " VALUES (?,?,?,?,?,?,?,?,?,?,'SUBMITTED',80,1,?,?)",
                id, taskNo, "KH", "plan", "Nhiệm vụ kiểm thử duyệt", "step-1", "dd-" + id,
                assignedTo, "u.khtruong", now, now, now);
    }

    // ───────────────────────────────── DƯƠNG ─────────────────────────────────

    @Test
    void truongPhong_coCanApprove_duyetHoanThanh_THANHCONG() throws Exception {
        seed();
        MvcResult r = postAs(coTruongPhong, duyet(WI_THUONG));
        assertEquals(200, r.getResponse().getStatus(),
                "Trưởng phòng có `canApprove` PHẢI duyệt được (⭐ đây là hành vi `BUG-D18` đã bù bằng `V40 §3`). "
                        + "Thân: " + body(r));
        assertEquals("COMPLETED", trangThai(WI_THUONG), "Trạng thái nhiệm vụ PHẢI đổi thành COMPLETED.");
        Integer progress = jdbc.queryForObject(
                "SELECT progress FROM work_items WHERE id=?", Integer.class, WI_THUONG);
        assertEquals(100, progress, "COMPLETED ⇒ tiến độ phải = 100 (như `updateWorkItemStatus`).");
    }

    // ───────────────────────────── ĐỐI CHỨNG ÂM ─────────────────────────────

    @Test
    void doiChungAm1_coCanEdit_nhungKHONGcoCanApprove_thiChanOCongQuyen() throws Exception {
        seed();
        MvcResult r = postAs(coNhanVien, duyet(WI_THUONG));
        assertEquals(403, r.getResponse().getStatus(),
                "Người có `canEdit` nhưng ⛔ KHÔNG `canApprove` PHẢI bị CỔNG QUYỀN chặn (đúng cơ chế `BUG-D18`). "
                        + "Thân: " + body(r));
        assertTrue(body(r).contains(RBAC_DENIED), "Phải là thông điệp cổng RBAC. Thân: " + body(r));
        assertEquals("SUBMITTED", trangThai(WI_THUONG), "⛔ Trạng thái KHÔNG được đổi khi bị chặn.");
    }

    @Test
    void doiChungAm2_coCanApprove_nhungKHONGphaiTruongPhong_thiChanOLuatNghiepVu() throws Exception {
        seed();
        MvcResult r = postAs(coNhanVienCoApprove, duyet(WI_CO_APPROVE));
        assertEquals(400, r.getResponse().getStatus(),
                "⭐ Được cấp `canApprove` ⛔ KHÔNG đủ để tự xác nhận Hoàn thành — luật «trưởng phòng mới xác nhận» "
                        + "vẫn phải giữ. Thân: " + body(r));
        assertTrue(body(r).contains(CHI_TRUONG_PHONG),
                "Phải đúng thông điệp luật nghiệp vụ. Thân: " + body(r));
        assertEquals("SUBMITTED", trangThai(WI_CO_APPROVE),
                "⛔ Trạng thái KHÔNG được đổi — cấp quyền duyệt ⛔ không phá luật trưởng phòng.");
    }
}
