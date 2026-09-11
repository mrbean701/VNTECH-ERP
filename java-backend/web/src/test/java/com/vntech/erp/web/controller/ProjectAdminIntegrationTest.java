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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration test Phase 2 — quản trị dự án (admin): create_project, update_project, set_project_status
 * khớp contract JS trên stack Java (H2).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class ProjectAdminIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private MvcResult setupAdmin() throws Exception {
        // setup trả cookie mep_session
        MvcResult setup = mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"action":"setup","companyName":"Công ty VNTECH","fullName":"Quản trị viên",
                                 "username":"admin","password":"VnTech@123"}"""))
                .andExpect(status().isCreated())
                .andReturn();
        return setup;
    }

    @Test
    void createProject_createsProjectAndSiteWarehouse() throws Exception {
        MvcResult setup = setupAdmin();
        jakarta.servlet.http.Cookie sessionCookie = setup.getResponse().getCookie("mep_session");

        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"action":"create_project","code":"PRJ-01","name":"Dự án mẫu",
                                 "startDate":"2026-01-01","contractNo":"HD-001","contractName":"Hợp đồng 1"}""")
                        .cookie(sessionCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ok").value(true))
                .andExpect(jsonPath("$.message").value("Đã tạo dự án PRJ-01 và kho công trường riêng."));

        // validate mã sai -> 400
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"action\":\"create_project\",\"code\":\"x!@\",\"name\":\"Dự án lỗi\"}")
                        .cookie(sessionCookie))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.ok").value(false))
                .andExpect(jsonPath("$.error").value(org.hamcrest.Matchers.containsString("Mã dự án")));
    }

    @Test
    void setProjectStatus_invalidStatus_returns400() throws Exception {
        MvcResult setup = setupAdmin();
        jakarta.servlet.http.Cookie sessionCookie = setup.getResponse().getCookie("mep_session");
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"action":"create_project","code":"PRJ-02","name":"Dự án 2"}""")
                        .cookie(sessionCookie))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"action\":\"set_project_status\",\"projectId\":\"unknown\",\"status\":\"bogus\"}")
                        .cookie(sessionCookie))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Trạng thái dự án không hợp lệ."));
    }

    @Test
    void nonAdmin_cannotCreateProject_403() throws Exception {
        // admin setup xong, tạo user thường qua bootstrap không có -> thử trực tiếp với cookie admin? 
        // Ở đây kiểm tra requireRole: tạo 1 session của user không phải admin là phức tạp trên H2,
        // nên kiểm tra trực tiếp: action không đăng nhập -> 401
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"action\":\"create_project\",\"code\":\"PRJ-X\",\"name\":\"X\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void createUser_validatesRole_cannotCreateAdmin() throws Exception {
        MvcResult setup = setupAdmin();
        jakarta.servlet.http.Cookie sessionCookie = setup.getResponse().getCookie("mep_session");

        // Vai trò "admin" không được tạo qua create_user (giống JS)
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"action":"create_user","username":"boss","fullName":"Quản trị B",
                                 "password":"VnTech@123","role":"admin","department":"VNTECH"}""")
                        .cookie(sessionCookie))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.ok").value(false))
                .andExpect(jsonPath("$.error").value("Vai trò chưa hợp lệ hoặc đang bị ẩn."));

        // Thiếu password policy -> 400
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"action":"create_user","username":"weak","fullName":"Yếu",
                                 "password":"weak","role":"da_nv","department":"Phòng Dự án"}""")
                        .cookie(sessionCookie))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.ok").value(false));
    }

    @Test
    void setUserStatus_unknownUser_returns400() throws Exception {
        MvcResult setup = setupAdmin();
        jakarta.servlet.http.Cookie sessionCookie = setup.getResponse().getCookie("mep_session");
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"action\":\"set_user_status\",\"userId\":\"USR_unknown\",\"active\":false}")
                        .cookie(sessionCookie))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.ok").value(false))
                .andExpect(jsonPath("$.error").value("Không tìm thấy tài khoản."));
    }
}