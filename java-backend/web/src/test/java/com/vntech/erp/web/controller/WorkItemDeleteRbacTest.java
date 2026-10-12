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
 * `delete_work_item` — ⭐ **USER BÁO TRỰC TIẾP 09/10/2026** (đặc tả Công việc §1: *«quyền **xoá** công việc
 * (của bản thân)»*). S01 thi hành theo thẩm quyền user giao (`DEC-20261009-020`).
 *
 * <p><b>KIỂM ĐỦ 2 TẦNG CỔNG (⛔ không gộp — bài học `SHARED_STATE` §73′ của `ERP-SESSION-04`):</b>
 * <ul>
 *   <li><b>TẦNG ① CỔNG QUYỀN</b> (`RbacService.requireActionModule`): action khai module **`work`** +
 *       capability **`canEdit`** ⇒ tài khoản ⛔ **không có** khoá `work` bị **403** ✓</li>
 *   <li><b>TẦNG ② LUẬT NGHIỆP VỤ</b> (`OpsTaskManagementUseCase.deleteWorkItem`): ✅ **chỉ người ĐÃ GIAO/TẠO**
 *       việc (`assigned_by` = người gọi) mới xoá được ⇒ người **có quyền** nhưng ⛔ không phải người giao
 *       bị **400** với thông điệp đích danh ✓ · ⛔ **không xoá việc đã `COMPLETED`** ⇒ **400** ✓</li>
 * </ul>
 *
 * <p><b>XOÁ MỀM, ⛔ không xoá cứng</b> — ⭐ cùng khuôn **đã có sẵn** trong hệ thống (ĐO CSDL thật 09/10/2026:
 * **7/29** công việc đang ở `status='CANCELLED'` + `active=0`) ⇒ ca DƯƠNG khẳng định **đúng 3 cột đó**,
 * và các ca ÂM khẳng định dòng **⛔ KHÔNG bị đụng** ✓
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class WorkItemDeleteRbacTest {

    private static final String RBAC_DENIED =
            "Tài khoản chưa được quản trị viên cấp đúng quyền cho thao tác này.";
    private static final String WI_XOA = "WI_XOA_01";
    private static final String WI_XONG = "WI_XONG_01";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbc;

    private Cookie coNguoiGiao;
    private Cookie coNguoiKhac;
    private Cookie coNhanVienKhongQuyen;

    private MvcResult postAs(Cookie cookie, String json) throws Exception {
        return mockMvc.perform(post("/api/system").contentType(MediaType.APPLICATION_JSON)
                .content(json).cookie(cookie)).andReturn();
    }

    private static String body(MvcResult r) throws Exception {
        return r.getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8);
    }

    private String trangThai(String id) {
        return jdbc.queryForObject("SELECT status FROM work_items WHERE id=?", String.class, id);
    }

    private Integer active(String id) {
        return jdbc.queryForObject("SELECT active FROM work_items WHERE id=?", Integer.class, id);
    }

    /** Seed: admin + khoá `work` + 3 tài khoản + 2 nhiệm vụ (1 thường · 1 đã COMPLETED). */
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
        // ⚠️ Trung hoà `group_key` — cổng `canUseModule` JOIN `menu_group_catalog` (xem
        //    `ModulePermissionStoreAdapter`): module trỏ menu group ⛔ không hoạt động sẽ bị LỌC ⇒ 403 oan ✓
        jdbc.update("UPDATE module_catalog SET active=1, group_key=NULL WHERE module_key='work'");

        taiKhoan("u.nguoigiao", "nguoigiao", "Trưởng phòng giao việc", "kh_truong", now, 1);
        taiKhoan("u.nguoikhac", "nguoikhac", "Người khác cùng quyền", "kh_truong", now, 1);
        taiKhoan("u.khongquyen", "khongquyen", "Nhân viên không quyền", "engineer", now, 0);

        nhiemVu(WI_XOA, "TASK-XOA-1", "SUBMITTED", now);
        nhiemVu(WI_XONG, "TASK-XOA-2", "COMPLETED", now);

        coNguoiGiao = TestActors.login(mockMvc, "nguoigiao");
        coNguoiKhac = TestActors.login(mockMvc, "nguoikhac");
        coNhanVienKhongQuyen = TestActors.login(mockMvc, "khongquyen");
    }

    /** `coWork` = 1 ⇒ cấp khoá `work` với `can_edit=1` (đủ điều kiện qua cổng `delete_work_item`). */
    private void taiKhoan(String id, String username, String fullName, String role, Instant now, int coWork) {
        jdbc.update("INSERT INTO users (id,employee_code,full_name,username,password_hash,role,department,"
                        + "approval_limit,active,must_change_password,created_at,updated_at)"
                        + " VALUES (?,?,?,?,?,?,?,0,1,0,?,?)",
                id, "NV-" + id, fullName, username, TestActors.passwordHash(TestActors.PASSWORD), role,
                "Phòng Kế hoạch", now, now);
        if (coWork == 0) return;
        jdbc.update("INSERT INTO user_module_permissions (id,user_id,module_key,can_view,can_use,can_create,"
                        + "can_edit,can_approve,can_export,permission_source,created_at,updated_at)"
                        + " VALUES (?,?,'work',1,1,0,1,0,0,'manual_override',?,?)",
                "ump_" + id, id, now, now);
    }

    /** Cả 2 nhiệm vụ đều do `u.nguoigiao` TẠO/GIAO (`assigned_by`) cho `u.khongquyen` ✓ */
    private void nhiemVu(String id, String taskNo, String status, Instant now) {
        jdbc.update("INSERT INTO work_items (id,task_no,department_code,work_group,title,work_step,dedupe_key,"
                        + "assigned_to,assigned_by,assigned_at,status,progress,active,created_at,updated_at)"
                        + " VALUES (?,?,?,?,?,?,?,?,?,?,?,?,1,?,?)",
                id, taskNo, "KH", "plan", "Nhiệm vụ kiểm thử xoá", "step-1", "dd-" + id,
                "u.khongquyen", "u.nguoigiao", now, status, "COMPLETED".equals(status) ? 100 : 40, now, now);
    }

    // ───────────────────────────────── DƯƠNG ─────────────────────────────────

    @Test
    void nguoiGiaoViec_coWorkCanEdit_xoaViecCuaMinh_THANHCONG_vaXoaMEM() throws Exception {
        seed();
        MvcResult r = postAs(coNguoiGiao, "{\"action\":\"delete_work_item\",\"workItemId\":\"" + WI_XOA + "\"}");
        assertEquals(200, r.getResponse().getStatus(),
                "⭐ Người ĐÃ GIAO việc + có `work`+`canEdit` PHẢI xoá được việc của mình. Thân: " + body(r));
        assertEquals("CANCELLED", trangThai(WI_XOA), "Xoá MỀM ⇒ trạng thái PHẢI thành CANCELLED.");
        assertEquals(0, active(WI_XOA), "Xoá MỀM ⇒ `active` PHẢI = 0 (⭐ cùng khuôn 7/29 việc đã huỷ trong CSDL).");
        assertEquals(1, jdbc.queryForObject(
                        "SELECT COUNT(*) FROM work_items WHERE id=? AND cancelled_by='u.nguoigiao'",
                        Integer.class, WI_XOA),
                "PHẢI ghi vết `cancelled_by` = người thực hiện (⛔ không xoá cứng ⇒ giữ kiểm toán).");
    }

    // ───────────────────────────── ĐỐI CHỨNG ÂM ─────────────────────────────

    @Test
    void doiChungAm1_COquyen_nhungKHONGPhaiNguoiGiaoViec_thiChanODAY() throws Exception {
        seed();
        MvcResult r = postAs(coNguoiKhac, "{\"action\":\"delete_work_item\",\"workItemId\":\"" + WI_XOA + "\"}");
        assertEquals(400, r.getResponse().getStatus(),
                "⛔ Người CÓ quyền `work`+`canEdit` nhưng ⛔ KHÔNG phải người giao việc PHẢI bị chặn ở tầng "
                        + "nghiệp vụ (400). Thân: " + body(r));
        assertTrue(body(r).contains("Chỉ người đã giao/tạo công việc mới xoá được"),
                "Thông điệp PHẢI đích danh lý do. Thân: " + body(r));
        assertEquals("SUBMITTED", trangThai(WI_XOA), "⛔ Trạng thái KHÔNG được đổi khi bị chặn.");
        assertEquals(1, active(WI_XOA), "⛔ `active` KHÔNG được đổi khi bị chặn.");
    }

    @Test
    void doiChungAm2_KHONGcoKhoaWork_thiChanOCongQuyen403() throws Exception {
        seed();
        MvcResult r = postAs(coNhanVienKhongQuyen,
                "{\"action\":\"delete_work_item\",\"workItemId\":\"" + WI_XOA + "\"}");
        assertEquals(403, r.getResponse().getStatus(),
                "⛔ Tài khoản KHÔNG có khoá `work` PHẢI bị CỔNG QUYỀN chặn (403) — tầng ① độc lập với tầng ②. "
                        + "Thân: " + body(r));
        assertTrue(body(r).contains(RBAC_DENIED), "Phải là thông điệp cổng RBAC. Thân: " + body(r));
        assertEquals("SUBMITTED", trangThai(WI_XOA), "⛔ Trạng thái KHÔNG được đổi khi bị chặn.");
    }

    @Test
    void doiChungAm3_viecDaHOANTHANH_thiKHONGchoXoa() throws Exception {
        seed();
        MvcResult r = postAs(coNguoiGiao, "{\"action\":\"delete_work_item\",\"workItemId\":\"" + WI_XONG + "\"}");
        assertEquals(400, r.getResponse().getStatus(),
                "⛔ Việc đã `COMPLETED` PHẢI KHÔNG xoá được (giữ lịch sử nghiệm thu). Thân: " + body(r));
        assertTrue(body(r).contains("Việc đã Hoàn thành nên không xoá được"),
                "Thông điệp PHẢI đích danh lý do + gợi ý «Huỷ việc». Thân: " + body(r));
        assertEquals("COMPLETED", trangThai(WI_XONG), "⛔ Trạng thái PHẢI giữ nguyên COMPLETED.");
        assertEquals(1, active(WI_XONG), "⛔ `active` PHẢI giữ nguyên 1.");
    }
}
