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

import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * MT2-P3-05 — VẬT TƯ NHÀ CUNG CẤP (§6.3 Tab 3 · §6.4 auto-detection).
 *
 * <p>Kiểm đúng 3 điều cốt lõi:
 * <ol>
 *   <li><b>§6.4 «user đồng ý ⇒ thêm vào danh mục NCC»</b> — action {@code save_supplier_material} lưu được.</li>
 *   <li><b>Thêm LẦN 2 KHÔNG sinh dòng thứ 2</b> — UNIQUE({@code supplier_id},{@code material_id}) ⇒
 *       phải là <b>UPDATE-then-INSERT</b>; gặp lại ⇒ {@code times_ordered} tăng + giá cập nhật.</li>
 *   <li><b>§6.3 Tab 3</b> — {@code supplier_materials} trả danh sách kèm mã/tên/ĐVT (⛔ không trả ID trần).</li>
 * </ol>
 *
 * <p>⚠️ <b>BÀI HỌC P3-04 đã áp dụng</b>: test chạy trên <b>H2</b> và H2 <b>⛔ không tự có danh mục của MySQL</b>
 * ⇒ phải <b>TỰ SEED</b>. Cột NOT NULL (đã ĐO, ⛔ không đoán):
 * {@code suppliers}(id·code·name·created_at·updated_at) ·
 * {@code materials}(id·code·name·<b>system</b>·unit·created_at·updated_at) ·
 * {@code supplier_materials}(id·supplier_id·material_id).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class SupplierMaterialTest {

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
        // ⚠️ TỰ SEED danh mục — H2 ⛔ không có sẵn dữ liệu của MySQL (bài học P3-04).
        jdbc.update("INSERT INTO suppliers (id,code,name,active,created_at,updated_at) "
                + "VALUES ('sup_test','NCC-TEST','Nhà cung cấp Test',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)");
        jdbc.update("INSERT INTO materials (id,code,name,system,unit,active,created_at,updated_at) "
                + "VALUES ('mat_a','VT-A','Vật tư A','TEST','cái',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)");
        jdbc.update("INSERT INTO materials (id,code,name,system,unit,active,created_at,updated_at) "
                + "VALUES ('mat_b','VT-B','Vật tư B','TEST','kg',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)");
    }

    /** Gọi action qua HTTP và LUÔN in body ra (⛔ `andDo` không chạy khi `andExpect` fail ⇒ dùng `andReturn()`). */
    private String call(String action, String fields) throws Exception {
        String json = "{\"action\":\"" + action + "\"" + (fields.isEmpty() ? "" : "," + fields) + "}";
        var result = mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json)
                        .cookie(adminCookie))
                .andReturn();
        String body = result.getResponse().getContentAsString();
        System.out.println("[P3-05][" + action + "] status=" + result.getResponse().getStatus()
                + " body=" + (body.length() > 300 ? body.substring(0, 300) : body));
        return body;
    }

    private int count(String materialId) {
        Integer n = jdbc.queryForObject(
                "SELECT COUNT(*) FROM supplier_materials WHERE supplier_id='sup_test' AND material_id=?",
                Integer.class, materialId);
        return n == null ? 0 : n;
    }

    @Test
    void themVatTuChoNcc_lanHaiKhongSinhDongThuHai_vaTab3TraDuDuLieu() throws Exception {
        setup();

        // ① §6.4 — user ĐỒNG Ý ⇒ thêm vật tư vào danh mục NCC.
        call("save_supplier_material", "\"supplierId\":\"sup_test\",\"materialId\":\"mat_a\",\"lastUnitPrice\":\"1000\"");
        Assertions.assertEquals(1, count("mat_a"), "phải có đúng 1 dòng supplier_materials");

        // ② Thêm LẦN 2 (giá mới) ⇒ ⛔ KHÔNG sinh dòng thứ 2; times_ordered = 2; giá cập nhật.
        call("save_supplier_material", "\"supplierId\":\"sup_test\",\"materialId\":\"mat_a\",\"lastUnitPrice\":\"2500\"");
        Assertions.assertEquals(1, count("mat_a"),
                "UNIQUE(supplier_id,material_id): thêm lần 2 ⛔ KHÔNG được sinh dòng thứ hai (UPDATE-then-INSERT)");
        Map<String, Object> row = jdbc.queryForMap(
                "SELECT times_ordered,last_unit_price FROM supplier_materials WHERE supplier_id='sup_test' AND material_id='mat_a'");
        Assertions.assertEquals(2, ((Number) row.get("times_ordered")).intValue(), "gặp lại ⇒ times_ordered phải = 2");
        Assertions.assertEquals(2500.0, ((Number) row.get("last_unit_price")).doubleValue(), 0.001, "giá phải cập nhật");

        // ③ Thêm vật tư KHÁC ⇒ 2 dòng (⛔ không ảnh hưởng nhau).
        call("save_supplier_material", "\"supplierId\":\"sup_test\",\"materialId\":\"mat_b\"");
        Assertions.assertEquals(1, count("mat_b"), "vật tư B phải có dòng riêng");

        // ④ §6.3 Tab 3 — danh sách trả kèm mã/tên/ĐVT (⛔ không trả ID trần).
        String body = call("supplier_materials", "\"supplierId\":\"sup_test\"");
        Assertions.assertTrue(body.contains("VT-A") && body.contains("Vật tư A") && body.contains("cái"),
                "Tab 3 phải có materialCode/materialName/unit. body=" + body);
        Assertions.assertEquals(2, jdbc.queryForObject(
                "SELECT COUNT(*) FROM supplier_materials WHERE supplier_id='sup_test'", Integer.class),
                "NCC phải có đúng 2 vật tư");

        // ⑤ NCC không tồn tại ⇒ 400 (validate ở use-case, ⛔ không ghi gì).
        var bad = mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"action\":\"save_supplier_material\",\"supplierId\":\"khong_co\",\"materialId\":\"mat_a\"}")
                        .cookie(adminCookie))
                .andReturn();
        Assertions.assertEquals(400, bad.getResponse().getStatus(),
                "NCC không tồn tại ⇒ 400. body=" + bad.getResponse().getContentAsString());
    }

    /** §6.4 — endpoint TÍN HIỆU auto-detect chạy được và trả đúng hình dạng dữ liệu. */
    @Test
    void tinHieuAutoDetect_traDanhSachThieu() throws Exception {
        setup();
        // PO không tồn tại ⇒ ⛔ không có gì thiếu (endpoint vẫn phải chạy, trả `missing` rỗng).
        String body = call("supplier_material_gaps", "\"purchaseOrderId\":\"po_khong_ton_tai\"");
        Assertions.assertTrue(body.contains("\"missing\":[]") || body.contains("\"missing\": []"),
                "PO không có vật tư ⇒ `missing` phải RỖNG (⛔ không bịa). body=" + body);
        Assertions.assertTrue(body.contains("missingCount"), "phải trả kèm missingCount. body=" + body);
    }
}
