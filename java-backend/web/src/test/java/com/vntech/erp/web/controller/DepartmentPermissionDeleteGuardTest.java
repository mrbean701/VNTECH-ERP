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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * GO-LIVE 05/10/2026 — NGHIỆM THU BẢN VÁ <b>BUG-20261010</b> (HIGH — liên quan QUYỀN).
 *
 * <p><b>LỖI ĐƯỢC VÁ.</b> {@code UserManagementUseCase.deleteDepartmentPermission} <b>KHÔNG kiểm gì</b>
 * trước khi gọi {@code store.deleteDepartmentPermission(...)} (xoá 0 dòng nếu khoá sai) rồi <b>LUÔN</b>
 * chạy {@code syncDepartmentUsers(...)}. Hàm sau duyệt <b>MỌI tài khoản đang hoạt động</b> (trừ admin;
 * đo trên MySQL thật: <b>27 tài khoản</b>) và gọi {@code replaceDepartmentDefaults} cho <b>từng người</b>
 * ⇒ <b>GHI ĐÈ quyền mặc định phòng ban của toàn bộ tài khoản</b> chỉ vì một cú bấm — rồi vẫn trả về
 * thông báo <b>THÀNH CÔNG</b>.
 *
 * <p><b>ĐO ĐƯỢC TRƯỚC KHI VÁ:</b> gọi với {@code organizationUnitId} <b>bịa</b> ⇒ <b>HTTP 200</b> +
 * «Đã thu hồi quyền của phòng ban; đồng bộ lại 27 tài khoản…» — trong khi <b>7</b> action {@code delete_*}
 * khác đều trả «Không tìm thấy …». ⛔ Hệ quả: bấm nhầm/bấm đúp cũng kích hoạt đồng bộ quyền
 * <b>TOÀN HỆ THỐNG</b>, và người dùng tưởng đã thu hồi quyền trong khi ⛔ không có gì để thu hồi.
 *
 * <p><b>VỆ NÀY KIỂM CẢ HAI CHIỀU</b> (⛔ chỉ kiểm một chiều thì bản vá có thể chặn nhầm):
 * <ol>
 *   <li>khoá <b>BỊA</b> ⇒ <b>400</b> «Không tìm thấy quyền của phòng ban…» <b>VÀ</b> dòng quyền THẬT
 *       vẫn còn nguyên (⇒ phép gọi sai ⛔ không đụng gì);</li>
 *   <li>khoá <b>THẬT</b> ⇒ <b>200</b> và dòng quyền <b>bị xoá</b> (⇒ bản vá ⛔ không chặn nhầm).</li>
 * </ol>
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class DepartmentPermissionDeleteGuardTest {

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

    private static final String OU = "OU_E2E_1";
    private static final String MODULE = "inventory";

    private void seed() throws Exception {
        MvcResult setup = postAction(action("setup",
                "\"companyName\":\"Công ty VNTECH\",\"fullName\":\"Quản trị viên\","
                        + "\"username\":\"admin\",\"password\":\"VnTech@123\""), 201);
        adminCookie = setup.getResponse().getCookie("mep_session");
        Instant now = Instant.now();
        jdbc.update("INSERT INTO department_module_permissions "
                        + "(id,organization_unit_id,module_key,can_view,can_use,can_create,can_edit,"
                        + "can_approve,can_export,active,created_at,updated_at) "
                        + "VALUES (?,?,?,1,1,0,0,0,0,1,?,?)",
                "DMP_E2E_1", OU, MODULE, now, now);
    }

    private long demDongQuyen() {
        Long n = jdbc.queryForObject(
                "SELECT COUNT(*) FROM department_module_permissions WHERE organization_unit_id=? AND module_key=?",
                Long.class, OU, MODULE);
        return n == null ? -1 : n;
    }

    @Test
    void khoaBiaaPhaiBiChan400_vaKhongDuocDungToiDuLieuThat() throws Exception {
        seed();
        assertEquals(1L, demDongQuyen(), "điều kiện tiên quyết: phải có ĐÚNG 1 dòng quyền thật");

        // ① KHOÁ BỊA ⇒ 400. Trước bản vá: **200** («đồng bộ lại 27 tài khoản») ⇒ vệ này ĐỎ.
        MvcResult r = postAction(action("delete_department_permission",
                "\"organizationUnitId\":\"OU_KHONG_TON_TAI\",\"moduleKey\":\"khong_ton_tai\""), 400);
        String body = r.getResponse().getContentAsString();
        assertTrue(body.contains("Không tìm thấy quyền của phòng ban"),
                "khoá bịa phải báo «Không tìm thấy quyền của phòng ban…»: " + body);

        // ② ⭐ Dòng quyền THẬT phải VẪN CÒN ⇒ phép gọi sai ⛔ không được đụng tới dữ liệu.
        assertEquals(1L, demDongQuyen(),
                "gọi với khoá BỊA ⛔ KHÔNG được xoá/đụng tới dòng quyền THẬT");
    }

    @Test
    void khoaThatVanXoaDuoc200_banVaKhongChanNham() throws Exception {
        seed();
        // ⛔ Đối chứng âm cho CHIỀU NGƯỢC LẠI: nếu bản vá chặn quá tay thì vệ này ĐỎ.
        postAction(action("delete_department_permission",
                "\"organizationUnitId\":\"" + OU + "\",\"moduleKey\":\"" + MODULE + "\""), 200);
        assertEquals(0L, demDongQuyen(), "khoá THẬT ⇒ phải xoá được dòng quyền (⛔ không chặn nhầm)");
    }

    @Test
    void doiChungAm_thieuThamSoVanBiChan() throws Exception {
        seed();
        MvcResult r = postAction(action("delete_department_permission", "\"moduleKey\":\"inventory\""), 400);
        assertTrue(r.getResponse().getContentAsString().contains("Cần chọn phòng ban và chức năng"),
                "thiếu phòng ban vẫn phải bị chặn như trước");
    }
}
