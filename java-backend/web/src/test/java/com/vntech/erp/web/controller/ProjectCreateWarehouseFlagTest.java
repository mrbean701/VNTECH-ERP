package com.vntech.erp.web.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
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

import java.util.LinkedHashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * MT2-P14-03c — <b>CỜ «Tạo kho dự án?» KHI TẠO DỰ ÁN (W-03)</b>.
 *
 * <p><b>Lỗi phải vá:</b> UI `app/page.tsx:2709-2742` đã hỏi «Tạo kho dự án?» và gửi
 * {@code createWarehouse: false} khi chọn «Không»; JS {@code scripts/system-route.mjs} (nhánh `create_project`)
 * ĐỌC cờ và chỉ chèn kho khi {@code createWarehouse !== false} — nhưng bản Java **luôn** chèn kho
 * ⇒ chọn «Không» vẫn sinh kho công trường (lệch hành vi + sai dữ liệu).
 *
 * <p><b>3 CA:</b> ① cờ vắng ⇒ **CÓ** kho (tương thích ngược) ② cờ {@code false} ⇒ **KHÔNG** kho
 * ③ chuỗi {@code "no"} ⇒ **KHÔNG** kho (đúng biểu thức JS) — và CA ①/② phải cho **thông điệp khác nhau**.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class ProjectCreateWarehouseFlagTest {

    private static final ObjectMapper JSON = new ObjectMapper();

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbc;

    private Cookie adminCookie;

    private void setupAdmin() throws Exception {
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"action":"setup","companyName":"Công ty VNTECH","fullName":"Quản trị viên",
                                 "username":"admin","password":"VnTech@123"}"""))
                .andExpect(status().isCreated());
        adminCookie = TestActors.login(mockMvc, "admin");
    }

    /** Tạo dự án với mã cho trước; {@code createWarehouse} = null ⇒ KHÔNG gửi cờ (ca tương thích ngược). */
    private String createProject(String code, Object createWarehouse) throws Exception {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("action", "create_project");
        body.put("code", code);
        body.put("name", "Dự án kiểm thử " + code);
        if (createWarehouse != null) body.put("createWarehouse", createWarehouse);
        var result = mockMvc.perform(post("/api/system").cookie(adminCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(JSON.writeValueAsString(body))).andReturn();
        String responseBody = result.getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8);
        Assertions.assertEquals(200, result.getResponse().getStatus(), "body=" + responseBody);
        return responseBody;
    }

    private int warehousesOf(String code) {
        Integer count = jdbc.queryForObject("""
                SELECT COUNT(*) FROM warehouses w
                 WHERE w.project_id = (SELECT p.id FROM projects p WHERE p.code = ?)""", Integer.class, code);
        return count == null ? 0 : count;
    }

    private int scopesOf(String code) {
        Integer count = jdbc.queryForObject("""
                SELECT COUNT(*) FROM user_project_scopes s
                 WHERE s.project_id = (SELECT p.id FROM projects p WHERE p.code = ?)""", Integer.class, code);
        return count == null ? 0 : count;
    }

    @Test
    void ca_1_khong_gui_co_thi_van_tao_kho_tuong_thich_nguoc() throws Exception {
        setupAdmin();
        String body = createProject("PRJ-W03-DEF", null);
        Assertions.assertEquals(1, warehousesOf("PRJ-W03-DEF"),
                "Không gửi cờ ⇒ PHẢI tạo kho (tương thích ngược, mọi nơi gọi cũ vẫn như trước)");
        Assertions.assertEquals(1, scopesOf("PRJ-W03-DEF"), "Phạm vi dự án cho người tạo luôn phải có");
        Assertions.assertTrue(body.contains("kho công trường riêng"), body);
    }

    @Test
    void ca_2_co_false_thi_KHONG_tao_kho_nhung_van_tao_du_an_va_pham_vi() throws Exception {
        setupAdmin();
        String body = createProject("PRJ-W03-NO", Boolean.FALSE);
        Assertions.assertEquals(0, warehousesOf("PRJ-W03-NO"),
                "Cờ false ⇒ ⛔ KHÔNG được sinh kho công trường (đúng lựa chọn «Không» của người dùng)");
        Assertions.assertEquals(1, scopesOf("PRJ-W03-NO"), "Vẫn phải cấp phạm vi dự án cho người tạo");
        Integer projects = jdbc.queryForObject(
                "SELECT COUNT(*) FROM projects WHERE code='PRJ-W03-NO'", Integer.class);
        Assertions.assertEquals(1, projects, "Dự án LUÔN được tạo, ⛔ không phụ thuộc cờ");
        Assertions.assertTrue(body.contains("không tạo kho công trường"), body);
    }

    @Test
    void ca_3_chuoi_no_cung_la_false_theo_bieu_thuc_JS() throws Exception {
        setupAdmin();
        createProject("PRJ-W03-NO-STR", "no");
        Assertions.assertEquals(0, warehousesOf("PRJ-W03-NO-STR"),
                "Chuỗi «no» (không phân biệt hoa/thường) ⇒ KHÔNG tạo kho — đúng biểu thức đọc cờ của JS");
    }
}
