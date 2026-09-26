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
 * MT2-P8-04 (§6.2) — EMAIL của nhà cung cấp.
 *
 * <p>§6.2 nguyên văn: «Danh mục NCC phải có Create·Read·Update·Delete·Search·Sort·Filter.
 * <b>Create Supplier</b>: ⛔ không dùng side form ⇒ mở modal riêng, thông tin: Mã NCC · Tên NCC ·
 * Mã số thuế · Người liên hệ · Điện thoại · <b>Email</b> …»
 *
 * <p>⚠️ VÌ SAO TEST NÀY TỒN TẠI: `suppliers` TRƯỚC đây CHỈ có 11 cột và ⛔ <b>KHÔNG có `email`</b>
 * (đo bằng `tools/_live-schema.tsv`). Cột `email` mới được thêm ở migration
 * {@code V28__mt2_supplier_email.sql}. Test này khoá hành vi: lưu / đọc lại / để trống ⇒ NULL / sửa.
 *
 * <p>⚠️ Đây là test **§25**: chỉ «UI hiện ô Email» là ⛔ KHÔNG đủ — phải chứng minh **giá trị vào được DB**.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class SupplierEmailTest {

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
        // `supplier_catalog` với `group_key` NULL ⇒ điều kiện menu-group được bỏ qua (theo adapter RBAC).
        jdbc.update("INSERT INTO module_catalog (module_key,label,icon,active,sort_order,created_at,updated_at) "
                + "SELECT 'supplier_catalog','Danh mục nhà cung cấp','X',1,10,?,? "
                + "WHERE NOT EXISTS (SELECT 1 FROM module_catalog WHERE module_key='supplier_catalog')", now, now);
    }

    /** Gọi `save_supplier` cho nhánh **INSERT**. `email` = `null` ⇒ gửi JSON `null`. */
    private void createSupplier(String code, String email) throws Exception {
        mockMvc.perform(post("/api/system").cookie(adminCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"action\":\"save_supplier\",\"code\":\"" + code + "\",\"name\":\"NCC " + code
                                + "\",\"email\":" + jsonOrNull(email) + "}"))
                .andExpect(status().is2xxSuccessful());
    }

    private static String jsonOrNull(String value) {
        return value == null ? "null" : "\"" + value + "\"";
    }

    private String emailOf(String code) {
        return jdbc.queryForObject("SELECT email FROM suppliers WHERE code=?", String.class, code);
    }

    private String idOf(String code) {
        return jdbc.queryForObject("SELECT id FROM suppliers WHERE code=?", String.class, code);
    }

    @Test
    void createSupplier_nhapEmail_docLaiDungGiaTri() throws Exception {
        setup();
        createSupplier("NCC-EMAIL-1", "ncc1@vntech.vn");
        Assertions.assertEquals("ncc1@vntech.vn", emailOf("NCC-EMAIL-1"),
                "Email phải được LƯU THẬT vào cột `suppliers.email` (V28), ⛔ không chỉ hiện trên UI");
    }

    @Test
    void createSupplier_boTrongEmail_ghiNULL_khongLuuChuoiRong() throws Exception {
        setup();
        createSupplier("NCC-EMAIL-2", null);
        Assertions.assertNull(emailOf("NCC-EMAIL-2"),
                "Bỏ trống ⇒ NULL (⛔ KHÔNG lưu chuỗi rỗng — dữ liệu sạch, ⛔ không bịa giá trị)");
    }

    @Test
    void updateSupplier_suaEmail_capNhatDungGiaTriMoi() throws Exception {
        setup();
        createSupplier("NCC-EMAIL-3", "cu@vntech.vn");
        Assertions.assertEquals("cu@vntech.vn", emailOf("NCC-EMAIL-3"));

        String id = idOf("NCC-EMAIL-3");
        Assertions.assertNotNull(id, "NCC vừa tạo phải có trong bảng `suppliers`");
        mockMvc.perform(post("/api/system").cookie(adminCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"action\":\"save_supplier\",\"supplierId\":\"" + id
                                + "\",\"code\":\"NCC-EMAIL-3\",\"name\":\"NCC 3\",\"email\":\"moi@vntech.vn\"}"))
                .andExpect(status().is2xxSuccessful());

        Assertions.assertEquals("moi@vntech.vn", emailOf("NCC-EMAIL-3"),
                "Nhánh UPDATE phải ghi được `email` mới (gọi `setSupplierEmail` SAU `updateSupplier`)");
    }
}
