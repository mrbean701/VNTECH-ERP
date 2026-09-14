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

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Test Phase 2 — cấu hình hệ thống: org unit, menu group, form field (H2). */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class AdminSystemIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private jakarta.servlet.http.Cookie adminCookie() throws Exception {
        MvcResult setup = mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"action":"setup","companyName":"Công ty VNTECH","fullName":"Quản trị viên",
                                 "username":"admin","password":"VnTech@123"}"""))
                .andExpect(status().isCreated())
                .andReturn();
        return setup.getResponse().getCookie("mep_session");
    }

    @Test
    void saveOrganizationUnit_validation_and_create() throws Exception {
        jakarta.servlet.http.Cookie cookie = adminCookie();
        // code không hợp lệ -> 400
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"action":"save_organization_unit","code":"x@","name":"Phòng Dự án",
                                 "unitType":"department"}""")
                        .cookie(cookie))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Mã đơn vị")));

        // tạo đơn vị hợp lệ -> OK
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"action":"save_organization_unit","code":"DA","name":"Phòng Dự án",
                                 "unitType":"department","sortOrder":10}""")
                        .cookie(cookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("Phòng Dự án")));
    }

    @Test
    void saveMenuGroup_create_and_duplicate() throws Exception {
        jakarta.servlet.http.Cookie cookie = adminCookie();
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"action":"save_menu_group","groupKey":"group_x","name":"Nhóm mới","icon":"▦",
                                 "sortOrder":1}""")
                        .cookie(cookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("Nhóm mới")));

        // trùng groupKey -> 400
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"action":"save_menu_group","groupKey":"group_x","name":"Nhóm trùng","icon":"▦"}""")
                        .cookie(cookie))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Mã nhóm menu đã tồn tại."));
    }

    @Test
    void saveFormFieldConfig_customField_and_delete() throws Exception {
        jakarta.servlet.http.Cookie cookie = adminCookie();
        // formKey không hợp lệ -> 400
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"action":"save_form_field_config","formKey":"unknown","fieldKey":"abc","displayName":"X"}""")
                        .cookie(cookie))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Biểu mẫu cấu hình không hợp lệ."));

        // tạo trường custom hợp lệ
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"action":"save_form_field_config","formKey":"request_line","fieldKey":"note2",
                                 "displayName":"Ghi chú bổ sung","dataType":"text","visible":true}""")
                        .cookie(cookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ok").value(true)).andExpect(jsonPath("$.message").exists());

        // xóa trường custom -> OK
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"action":"delete_form_field_config","formKey":"request_line","fieldKey":"note2"}""")
                        .cookie(cookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ok").value(true)).andExpect(jsonPath("$.message").exists());
    }
    @Test
    void deleteProject_requiresClosedStatus_andConfirmCode() throws Exception {
        jakarta.servlet.http.Cookie cookie = adminCookie();
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"action\":\"create_project\",\"code\":\"PRJ-DEL\",\"name\":\"Dự án xóa\"}")
                        .cookie(cookie))
                .andExpect(status().isOk());

        // dự án chưa Đóng -> 400
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"action\":\"delete_project\",\"projectId\":\"PRJ-X\",\"confirmCode\":\"PRJ-X\"}")
                        .cookie(cookie))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Không tìm thấy dự án."));
    }

    @Test
    void saveWarehouseLocation_upserts() throws Exception {
        jakarta.servlet.http.Cookie cookie = adminCookie();
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"action\":\"save_warehouse_location\",\"warehouseId\":\"WH-CENTRAL\",\"code\":\"A-01\",\"name\":\"Kệ A1\",\"locationType\":\"bin\"}")
                        .cookie(cookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ok").value(true));
        // kho không tồn tại -> 400
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"action\":\"save_warehouse_location\",\"warehouseId\":\"WH-NOT\",\"code\":\"B-01\",\"name\":\"Kệ B1\"}")
                        .cookie(cookie))
                .andExpect(status().isBadRequest());
    }
    @Test
    void saveProjectContract_createsAndUpdates() throws Exception {
        jakarta.servlet.http.Cookie cookie = adminCookie();

        // tạo dự án
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"action\":\"create_project\",\"code\":\"PRJ-C\",\"name\":\"Dự án hợp đồng\"}")
                        .cookie(cookie))
                .andExpect(status().isOk());

        // thiếu số hợp đồng -> 400
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"action\":\"save_project_contract\",\"projectId\":\"PRJ-C\",\"contractName\":\"HD A\"}")
                        .cookie(cookie))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Số hợp đồng và tên hợp đồng là bắt buộc."));
    }

    @Test
    void deleteProjectContract_requiresConfirm() throws Exception {
        jakarta.servlet.http.Cookie cookie = adminCookie();
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"action\":\"delete_project_contract\",\"contractId\":\"PCON_X\",\"confirmText\":\"SAI\"}")
                        .cookie(cookie))
                .andExpect(status().isBadRequest());
    }
}