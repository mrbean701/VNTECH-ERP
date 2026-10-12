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
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/**
 * **`Q1 = A3` — CRUD DỰ ÁN CẤP QUA MA TRẬN** (user chốt 08/10/2026; S01 thi hành 09/10 · `HANDOFF-20261009-A13`).
 *
 * <p><b>⚠️ VÌ SAO PHẢI SỬA **2 TẦNG** (bài học «2 tầng cổng» — `SHARED_STATE` §73′ của `ERP-SESSION-04`):</b>
 * bản vá registry **một mình** là **SỬA GIẢ**, vì 3 action bị chặn ở **controller** bằng `requireRequireAdmin`
 * (tầng này chặn **TRƯỚC** khi registry được xét) ⇒ ⭐ đã **hạ cổng controller** về `requireCurrentUser` cho
 * **đúng 3 action** (`set_project_status` ⛔ **giữ nguyên** `requireRequireAdmin`) ✓
 *
 * <p><b>⭐ LUẬT GIỮ NGUYÊN (kết quả đo vòng 99 của `ERP-SESSION-04`):</b> khai module kèm **`"admin"`**
 * (`List.of("project_admin", "admin")`) ⇒ nhánh `isCompanyLeadership(user) && !required.contains("admin")`
 * ⛔ **không** cho giám đốc/kế toán đi qua ⇒ ⭐ **`giamdoc` + `delete_project`/`update_project` vẫn 403** ✓
 * (⚠️ nếu khai module **trần** thì nhánh cấp bậc sẽ **mở cửa** cho `director`/`accountant` — đúng bẫy đã tránh)
 *
 * <p><b>CẤP BAN ĐẦU = 0</b> (điều kiện an toàn §3.2 của S04): ⛔ **không tick sẵn cho ai** ⇒ hành vi hiện tại
 * ⛔ **không đổi** cho tới khi admin tick trong ma trận ✓
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class ProjectCrudMatrixRbacTest {

    private static final String RBAC_DENIED =
            "Tài khoản chưa được quản trị viên cấp đúng quyền cho thao tác này.";
    private static final String RBAC_LEADERSHIP =
            "Tài khoản không có quyền thực hiện nghiệp vụ này.";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbc;

    private Cookie coGiamDoc;
    private Cookie coDaTick;
    private Cookie coChuaTick;

    private MvcResult postAs(Cookie cookie, String json) throws Exception {
        return mockMvc.perform(post("/api/system").contentType(MediaType.APPLICATION_JSON)
                .content(json).cookie(cookie)).andReturn();
    }

    private static String body(MvcResult r) throws Exception {
        return r.getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8);
    }

    /** Seed: admin + khoá `project_admin` + 3 tài khoản (giám đốc · đã tick · chưa tick). */
    private void seed() throws Exception {
        Instant now = Instant.now();
        mockMvc.perform(post("/api/system").contentType(MediaType.APPLICATION_JSON)
                .content("{\"action\":\"setup\",\"companyName\":\"Công ty VNTECH\",\"fullName\":\"Quản trị viên\","
                        + "\"username\":\"admin\",\"password\":\"" + TestActors.PASSWORD + "\"}"))
                .andReturn();

        Integer co = jdbc.queryForObject(
                "SELECT COUNT(*) FROM module_catalog WHERE module_key='project_admin'", Integer.class);
        if (co == null || co == 0) {
            jdbc.update("INSERT INTO module_catalog (module_key,label,icon,active,sort_order,created_at,updated_at)"
                    + " VALUES ('project_admin','Quản trị dự án (tạo / sửa / xoá)','DA',1,10,?,?)", now, now);
        }
        // ⚠️ Trung hoà `group_key` — cổng `canUseModule` JOIN `menu_group_catalog` (module trỏ menu group
        //    ⛔ không hoạt động sẽ bị LỌC ⇒ 403 oan) ✓
        jdbc.update("UPDATE module_catalog SET active=1, group_key=NULL WHERE module_key='project_admin'");

        taiKhoan("u.giamdoc", "giamdoc.demo", "Giám đốc", "director", now, false);
        taiKhoan("u.datick", "da.tick", "Người đã được tick", "engineer", now, true);
        taiKhoan("u.chuatick", "chua.tick", "Người chưa được tick", "engineer", now, false);

        coGiamDoc = TestActors.login(mockMvc, "giamdoc.demo");
        coDaTick = TestActors.login(mockMvc, "da.tick");
        coChuaTick = TestActors.login(mockMvc, "chua.tick");
    }

    /** `tick=true` ⇒ cấp `project_admin` với `can_create=1` + `can_edit=1` (đủ cho C/U/D dự án) ✓ */
    private void taiKhoan(String id, String username, String fullName, String role, Instant now, boolean tick) {
        jdbc.update("INSERT INTO users (id,employee_code,full_name,username,password_hash,role,department,"
                        + "approval_limit,active,must_change_password,created_at,updated_at)"
                        + " VALUES (?,?,?,?,?,?,?,0,1,0,?,?)",
                id, "NV-" + id, fullName, username, TestActors.passwordHash(TestActors.PASSWORD), role,
                "Phòng Dự án", now, now);
        if (!tick) return;
        jdbc.update("INSERT INTO user_module_permissions (id,user_id,module_key,can_view,can_use,can_create,"
                        + "can_edit,can_approve,can_export,permission_source,created_at,updated_at)"
                        + " VALUES (?,?,'project_admin',1,1,1,1,0,0,'manual_override',?,?)",
                "ump_" + id, id, now, now);
    }

    // ─────────── ĐỐI CHỨNG ÂM ① — GIÁM ĐỐC vẫn bị chặn (giữ kết quả đo vòng 99) ───────────

    @Test
    void doiChungAm1_giamDoc_thiVANbiChan_khongLotNhanhCapBac() throws Exception {
        seed();
        MvcResult r = mockMvc.perform(post("/api/system").contentType(MediaType.APPLICATION_JSON)
                .content("{\"action\":\"delete_project\",\"projectId\":\"P-ANY\"}")
                .cookie(coGiamDoc)).andReturn();
        assertEquals(403, r.getResponse().getStatus(),
                "⭐ KHẲNG ĐỊNH CỐT LÕI: giám đốc (leadership) PHẢI vẫn **403** — vì module khai kèm `\"admin\"` "
                        + "⇒ nhánh `isCompanyLeadership && !required.contains(\"admin\")` ⛔ không mở cửa ✓ "
                        + "(⚠️ nếu khai module TRẦN thì ca này sẽ ĐỎ). Thân: " + body(r));
    }

    // ─────────── ĐỐI CHỨNG ÂM ② — tài khoản CHƯA tick ⇒ 403 ───────────

    @Test
    void doiChungAm2_chuaTick_thiChanOCongQuyen403() throws Exception {
        seed();
        MvcResult r = postAs(coChuaTick, "{\"action\":\"create_project\",\"name\":\"Dự án thử\"}");
        assertEquals(403, r.getResponse().getStatus(),
                "⛔ Tài khoản ⛔ chưa được tick PHẢI bị chặn (403) — điều kiện an toàn §3.2 của S04. Thân: " + body(r));
        assertTrue(body(r).contains(RBAC_DENIED) || body(r).contains(RBAC_LEADERSHIP),
                "Phải là thông điệp cổng quyền. Thân: " + body(r));
    }

    // ─────────── DƯƠNG — tài khoản ĐÃ tick ⇒ ⛔ KHÔNG còn 403 (đi qua cổng quyền) ───────────

    @Test
    void duong_daTick_thiDIQUA_congQuyen_khongCon403() throws Exception {
        seed();
        MvcResult r = postAs(coDaTick, "{\"action\":\"create_project\",\"name\":\"Dự án thử\"}");
        String b = body(r);
        assertFalse(b.contains(RBAC_DENIED) || b.contains(RBAC_LEADERSHIP),
                "⭐ Tài khoản ĐÃ được tick `project_admin`+`canCreate` PHẢI đi qua CỔNG QUYỀN — ⛔ không còn rơi "
                        + "vào 2 thông điệp RBAC (lỗi còn lại nếu có là LUẬT NGHIỆP VỤ 400 của use-case). Thân: " + b);
    }

    // ─────────── ĐỐI CHỨNG ÂM ③ — chưa tick + xoá ⇒ 403 ───────────

    @Test
    void doiChungAm3_chuaTick_xoaDuAn_thiChan403() throws Exception {
        seed();
        MvcResult r = postAs(coChuaTick, "{\"action\":\"delete_project\",\"projectId\":\"P-ANY\"}");
        assertEquals(403, r.getResponse().getStatus(),
                "⛔ Chưa tick ⇒ `delete_project` PHẢI 403 (module `project_admin` + `canEdit`). Thân: " + body(r));
    }
}
