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
 * GO-LIVE 05/10/2026 — NGHIỆM THU BẢN VÁ <b>BUG-20261011</b> (LOW).
 *
 * <p><b>LỖI ĐƯỢC VÁ.</b> {@code delete_user_module_override} gọi thẳng {@code store.deleteModuleOverride}
 * rồi trả về «Đã xóa ngoại lệ cá nhân…» — nên khi {@code userId}/{@code moduleKey} <b>bịa</b> thì vẫn
 * <b>HTTP 200</b> dù ⛔ không có gì để xoá, trong khi <b>33/34</b> action {@code delete_*} khác đều trả
 * <b>400</b> «Không tìm thấy …». Đo trên hệ thống thật: `delete_user_module_override` với khoá bịa
 * ⇒ <b>200</b> «Đã xóa ngoại lệ cá nhân; quyền hiệu lực quay về mặc định của phòng/bộ phận.»
 *
 * <p>⛔ <b>MỨC CHỈ LOW</b> — khác hẳn BUG-20261010 (HIGH): hàm này <b>KHÔNG có tác dụng phụ toàn hệ
 * thống</b> (không gọi {@code syncDepartmentUsers}); nó chỉ xoá 0 dòng và báo sai.
 *
 * <p><b>VỆ NÀY KIỂM CẢ HAI CHIỀU</b> (⛔ chỉ một chiều thì bản vá có thể chặn nhầm):
 * <ol>
 *   <li>khoá <b>BỊA</b> ⇒ <b>400</b> «Không tìm thấy ngoại lệ cá nhân…»;</li>
 *   <li>khoá <b>THẬT</b> (có dòng {@code permission_source='manual_override'}) ⇒ <b>200</b> và dòng bị xoá.</li>
 * </ol>
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class UserModuleOverrideDeleteGuardTest {

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

    private String nguoiDung;

    private void seed() throws Exception {
        MvcResult setup = postAction(action("setup",
                "\"companyName\":\"Công ty VNTECH\",\"fullName\":\"Quản trị viên\","
                        + "\"username\":\"admin\",\"password\":\"VnTech@123\""), 201);
        adminCookie = setup.getResponse().getCookie("mep_session");
        nguoiDung = jdbc.queryForObject("SELECT id FROM users WHERE username='admin'", String.class);
        Instant now = Instant.now();
        jdbc.update("INSERT INTO user_module_permissions "
                        + "(id,user_id,module_key,can_view,can_use,can_create,can_edit,can_approve,can_export,"
                        + "permission_source,created_at,updated_at) VALUES (?,?,?,1,1,0,0,0,0,'manual_override',?,?)",
                "UMP_E2E_1", nguoiDung, "requests", now, now);
    }

    private long demOverride() {
        Long n = jdbc.queryForObject(
                "SELECT COUNT(*) FROM user_module_permissions WHERE user_id=? AND module_key='requests' "
                        + "AND permission_source='manual_override'", Long.class, nguoiDung);
        return n == null ? -1 : n;
    }

    @Test
    void khoaBiaaPhaiBiChan400_vaKhongDuocDungToiNgoaiLeThat() throws Exception {
        seed();
        assertEquals(1L, demOverride(), "điều kiện tiên quyết: phải có ĐÚNG 1 dòng manual_override");

        // ① KHOÁ BỊA ⇒ 400. Trước bản vá: **200** «Đã xóa ngoại lệ cá nhân…» ⇒ vệ này ĐỎ.
        MvcResult r = postAction(action("delete_user_module_override",
                "\"userId\":\"USR_KHONG_TON_TAI\",\"moduleKey\":\"khong_ton_tai\""), 400);
        assertTrue(r.getResponse().getContentAsString().contains("Không tìm thấy ngoại lệ cá nhân"),
                "khoá bịa phải báo «Không tìm thấy ngoại lệ cá nhân…»: " + r.getResponse().getContentAsString());

        // ② ⭐ Ngoại lệ THẬT phải VẪN CÒN ⇒ phép gọi sai ⛔ không được đụng tới dữ liệu.
        assertEquals(1L, demOverride(), "gọi với khoá BỊA ⛔ KHÔNG được xoá ngoại lệ THẬT");
    }

    @Test
    void khoaThatVanXoaDuoc200_banVaKhongChanNham() throws Exception {
        seed();
        // ⛔ Đối chứng âm cho CHIỀU NGƯỢC LẠI: bản vá chặn quá tay thì vệ này ĐỎ.
        postAction(action("delete_user_module_override",
                "\"userId\":\"" + nguoiDung + "\",\"moduleKey\":\"requests\""), 200);
        assertEquals(0L, demOverride(), "khoá THẬT ⇒ phải xoá được ngoại lệ (⛔ không chặn nhầm)");
    }

    @Test
    void doiChungAm_thieuThamSoVanBiChan() throws Exception {
        seed();
        MvcResult r = postAction(action("delete_user_module_override", "\"moduleKey\":\"requests\""), 400);
        assertTrue(r.getResponse().getContentAsString().contains("Ngoại lệ cá nhân không hợp lệ"),
                "thiếu userId vẫn phải bị chặn như trước");
    }
}
