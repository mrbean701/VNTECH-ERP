package com.vntech.erp.web.controller;

import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * MT2-P4-03 — **CARD «CHỜ GIÁM ĐỐC DUYỆT»** (§4.1): dữ liệu **THỰC** từ approval engine + **RBAC ở BACKEND**.
 *
 * <p>§4.1:51 «⛔ Không hiển thị card “phiếu đang chờ duyệt” cho user **không có quyền quản trị hệ thống**
 * hoặc **không có chức vụ tương đương/cao hơn Trưởng phòng**. Kiểm permission/RBAC **ở backend**.»
 *
 * <p>⚠️ <b>CÁCH CÔ LẬP ĐÚNG 1 BIẾN</b>: cấp **CẢ HAI** user **cùng** quyền module `approvals`/`canView` ✔
 * ⇒ ⇒ ⇒ tầng RBAC cho **cả hai** qua ✗ ⇒ **biến DUY NHẤT** còn lại là **CẤP BẬC** (`level_rank`) ✔
 * (nếu chỉ cấp quyền cho 1 người thì test sẽ ⛔ không phân biệt được «chặn do RBAC» và «chặn do CẤP BẬC» ✗)
 *
 * <p>⚠️ <b>H2 ⛔ KHÔNG tự có danh mục MySQL</b> ✗ ⇒ test **PHẢI TỰ SEED** `system_level_catalog` ✔
 * (bài học MT2-P3-04 + MT2-P4-02 — H2 **có bảng nhưng 0 DÒNG** ✗).
 *
 * <p>⚠️ <b>BÀI HỌC #1 CỦA DỰ ÁN</b>: ⛔ **KHÔNG** test bằng **admin** ✗ — `isAdmin` cho qua SỚM ⇒
 * **che mất lỗi phân quyền** ✗ (đúng lỗi đã xảy ra ở MT2-P3-05). Test này dùng **USER THƯỜNG** ✔.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class DirectorPendingApprovalsTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbc;

    private Cookie adminCookie;

    private void setup() throws Exception {
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"action":"setup","companyName":"Công ty VNTECH","fullName":"Quản trị viên",
                                 "username":"admin","password":"VnTech@123"}"""))
                .andExpect(status().isCreated());
        adminCookie = TestActors.login(mockMvc, "admin");
        Instant now = Instant.now();

        // ① SEED CẤP BẬC (H2 có bảng nhưng 0 dòng ⇒ PHẢI tự seed). Idempotent bằng `WHERE NOT EXISTS`
        //    ⇒ ⛔ KHÔNG phá UNIQUE(`code`) ✗. `level_rank` ĐO từ MySQL: truong_phong=30, nhan_vien=10.
        jdbc.update("INSERT INTO system_level_catalog (id,code,name,description,level_rank,auto_grant_all,"
                + "can_skip_levels,active,sort_order,created_at,updated_at) "
                + "SELECT 'LVL-TP-P403','truong_phong','Trưởng phòng','seed test MT2-P4-03',30,0,0,1,30,?,? "
                + "WHERE NOT EXISTS (SELECT 1 FROM system_level_catalog WHERE code='truong_phong')", now, now);
        jdbc.update("INSERT INTO system_level_catalog (id,code,name,description,level_rank,auto_grant_all,"
                + "can_skip_levels,active,sort_order,created_at,updated_at) "
                + "SELECT 'LVL-NV-P403','nhan_vien','Nhân viên','seed test MT2-P4-03',10,0,0,1,10,?,? "
                + "WHERE NOT EXISTS (SELECT 1 FROM system_level_catalog WHERE code='nhan_vien')", now, now);

        // ② module `approvals` với `group_key` NULL ⇒ điều kiện menu-group được BỎ QUA (theo SQL của adapter).
        jdbc.update("INSERT INTO module_catalog (module_key,label,icon,active,sort_order,created_at,updated_at) "
                + "SELECT 'approvals','Trung tâm phê duyệt','F',1,20,?,? "
                + "WHERE NOT EXISTS (SELECT 1 FROM module_catalog WHERE module_key='approvals')", now, now);

        // ③ HAI user THƯỜNG cùng vai trò — CHỈ KHÁC CẤP BẬC (biến duy nhất).
        TestActors.seedRequester(jdbc, "u_lv_cao", "lv.cao", "Trưởng Phòng Test", "kh_truong",
                "Phòng Kế hoạch", "p_p403", now);
        TestActors.seedRequester(jdbc, "u_lv_thap", "lv.thap", "Nhân Viên Test", "kh_nv",
                "Phòng Kế hoạch", "p_p403", now);
        jdbc.update("UPDATE users SET system_level_code='truong_phong' WHERE username='lv.cao'");
        jdbc.update("UPDATE users SET system_level_code='nhan_vien' WHERE username='lv.thap'");

        // ④ CẤP QUYỀN MODULE CHO **CẢ HAI** ⇒ tầng RBAC cho qua CẢ HAI ⇒ biến duy nhất còn lại là CẤP BẬC.
        jdbc.update("INSERT INTO user_module_permissions (id,user_id,module_key,can_view,can_use,created_at,updated_at) "
                + "VALUES ('ump_lv_cao','u_lv_cao','approvals',1,1,?,?)", now, now);
        jdbc.update("INSERT INTO user_module_permissions (id,user_id,module_key,can_view,can_use,created_at,updated_at) "
                + "VALUES ('ump_lv_thap','u_lv_thap','approvals',1,1,?,?)", now, now);
    }

    private int call(Cookie cookie) throws Exception {
        var result = mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"action\":\"director_pending_approvals\"}")
                        .cookie(cookie))
                .andReturn();
        String body = result.getResponse().getContentAsString();
        System.out.println("[P4-03][director_pending_approvals] status=" + result.getResponse().getStatus()
                + " body=" + (body.length() > 260 ? body.substring(0, 260) : body));
        return result.getResponse().getStatus();
    }

    /**
     * ① Cấp **≥ trưởng phòng** (`level_rank`=30) ⇒ **200** ⇒ thấy card «Chờ Giám đốc duyệt» ✔
     * ② Cấp **THẤP** (`level_rank`=10, nhưng **CÓ** quyền module `approvals`) ⇒ **403** ⇒
     *    ⇒ ⛔ backend là tầng thực thi (§17) — ⛔ KHÔNG thể chỉ ẩn card ở UI ✗
     * ③ Admin ⇒ 200 (**đối chứng** — ⛔ KHÔNG dùng làm bằng chứng duy nhất ✗)
     */
    @Test
    void directorPendingApprovals_duCapThi200_thieuCapThi403() throws Exception {
        setup();
        Cookie cao = TestActors.login(mockMvc, "lv.cao");
        Cookie thap = TestActors.login(mockMvc, "lv.thap");

        Assertions.assertEquals(200, call(cao),
                "MT2-P4-03: user cấp ≥ trưởng phòng (level_rank=30) PHẢI xem được card «Chờ Giám đốc duyệt» (200)");
        Assertions.assertEquals(403, call(thap),
                "MT2-P4-03 §4.1:51: user cấp THẤP (level_rank=10) — DÙ có quyền module `approvals` — "
                        + "PHẢI bị chặn 403 ở BACKEND");
        Assertions.assertEquals(200, call(adminCookie), "admin ⇒ 200 (đối chứng)");
    }
}
