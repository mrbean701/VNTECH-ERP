package com.vntech.erp.web.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.emptyOrNullString;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration test luồng auth khớp contract JS trên stack Java (H2 tạm):
 * GET setupRequired -> POST setup (201 + Set-Cookie mep_session) -> GET authenticated
 * -> POST logout (Set-Cookie hết hạn) -> GET 401.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class SystemControllerAuthTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void get_initial_returnsSetupRequired() throws Exception {
        mockMvc.perform(get("/api/system"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ok").value(true))
                .andExpect(jsonPath("$.setupRequired").value(true));
    }

    @Test
    void fullAuthFlow_setupLoginBootstrapLogout() throws Exception {
        // 1. Setup (chưa có user -> 201 + cookie)
        MvcResult setup = mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"action":"setup","companyName":"Công ty VNTECH",
                                 "fullName":"Quản trị viên","username":"admin",
                                 "email":"admin@vntech.vn","password":"VnTech@123"}"""))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.ok").value(true))
                .andExpect(cookie().exists("mep_session"))
                .andExpect(cookie().value("mep_session", not(emptyOrNullString())))
                .andReturn();
        jakarta.servlet.http.Cookie sessionCookie = setup.getResponse().getCookie("mep_session");

        // 2. GET /api/system với cookie -> authenticated + bootstrap data
        mockMvc.perform(get("/api/system").cookie(sessionCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ok").value(true))
                .andExpect(jsonPath("$.authenticated").value(true))
                .andExpect(jsonPath("$.data.user.username").value("admin"))
                .andExpect(jsonPath("$.data.user.role").value("admin"))
                .andExpect(jsonPath("$.data.projects").isArray());

        // 3. Setup lần 2 -> 409 (giống JS)
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"action":"setup","companyName":"Cty khác","fullName":"B",
                                 "username":"admin2","password":"VnTech@123"}"""))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.ok").value(false))
                .andExpect(jsonPath("$.error").value("Hệ thống đã được khởi tạo."));

        // 4. Logout bằng cookie của setup -> OK; GET sau đó không cookie -> 401
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"action\":\"logout\"}")
                        .cookie(sessionCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ok").value(true))
                .andExpect(cookie().maxAge("mep_session", 0));
        mockMvc.perform(get("/api/system"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.authenticated").value(false));
    }

    @Test
    void login_wrongPassword_returns401_sameVietnameseMessage() throws Exception {
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"action\":\"setup\",\"companyName\":\"Cty\",\"fullName\":\"A\",\"username\":\"admin\",\"password\":\"VnTech@123\"}"))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"action\":\"login\",\"username\":\"admin\",\"password\":\"WrongPass@1\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.ok").value(false))
                .andExpect(jsonPath("$.error").value("Tên đăng nhập hoặc mật khẩu không đúng."));

        // Login đúng -> 200 + cookie + mustChangePassword=false
        MvcResult login = mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"action\":\"login\",\"username\":\"admin\",\"password\":\"VnTech@123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ok").value(true))
                .andExpect(jsonPath("$.mustChangePassword").value(false))
                .andExpect(cookie().exists("mep_session"))
                .andReturn();
        jakarta.servlet.http.Cookie sessionCookie = login.getResponse().getCookie("mep_session");

        // Đổi mật khẩu với cookie -> OK; login mật khẩu cũ fail, mật khẩu mới OK
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"action\":\"change_password\",\"currentPassword\":\"VnTech@123\",\"newPassword\":\"VnTech@456\"}")
                        .cookie(sessionCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ok").value(true));

        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"action\":\"login\",\"username\":\"admin\",\"password\":\"VnTech@123\"}"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"action\":\"login\",\"username\":\"admin\",\"password\":\"VnTech@456\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void unknownAction_returns400_notImplementedContract() throws Exception {
        // [TASK-115] Cổng RBAC ở `SystemController.post` (`:205-208`) chạy TRƯỚC `switch` ⇒ khách CHƯA đăng nhập
        // nhận **401** (ĐÚNG về bảo mật: không để lộ danh sách action cho người ẩn danh — quyết định giữ nguyên).
        // Hợp đồng **400 «chưa được triển khai»** (`:1196-1199`) chỉ áp dụng cho tài khoản ĐÃ đăng nhập
        // ⇒ ca này phải setup (lấy phiên) TRƯỚC khi gọi action lạ.
        MvcResult setup = mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"action":"setup","companyName":"Công ty VNTECH",
                                 "fullName":"Quản trị viên","username":"admin","password":"VnTech@123"}"""))
                .andExpect(status().isCreated())
                .andReturn();
        jakarta.servlet.http.Cookie sessionCookie = setup.getResponse().getCookie("mep_session");

        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"action\":\"some_unknown_action\"}")
                        .cookie(sessionCookie))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.ok").value(false))
                .andExpect(jsonPath("$.error").value(org.hamcrest.Matchers.containsString("chưa được triển khai")));
    }
}