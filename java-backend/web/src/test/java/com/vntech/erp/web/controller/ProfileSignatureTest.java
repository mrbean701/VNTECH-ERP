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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * MT2-P3-04 — CHỮ KÝ USER (MT2 §13.4) kiểm ở đúng các vế của đặc tả:
 *
 * <ol>
 *   <li>«cho phép upload **đúng 1 ảnh**» ⇒ lưu được ảnh data-URL và **DB có đúng 1 giá trị**.</li>
 *   <li>«Nếu upload ảnh mới ⇒ **xoá/thay ảnh cũ**» ⇒ ảnh mới **THAY** ảnh cũ (⛔ không sinh bản ghi thứ 2).</li>
 *   <li>Rỗng ⇒ **XOÁ** (cột về {@code NULL}) — vế «xoá» của cùng câu.</li>
 *   <li>⛔ Chỉ nhận ảnh JPG/PNG/WebP (URL ngoài ⇒ **400**) và ⛔ ≤ 2 MB (quá hạn ⇒ **400**).</li>
 * </ol>
 *
 * <p>⚠️ Đường gọi là action **`update_profile_signature`** — đã đăng ký ở {@code RbacService.PUBLIC_ACTIONS}
 * (⛔ KHÔNG khai {@code List.of()} ở map module vì map rỗng = **MẶC ĐỊNH TỪ CHỐI 403**).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class ProfileSignatureTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbc;

    private static final String PNG_1PX = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==";
    private static final String JPG_1PX = "data:image/jpeg;base64,/9j/4AAQSkZJRg==";

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

    private org.springframework.test.web.servlet.MvcResult call(String dataUrl, int expectedStatus) throws Exception {
        String json = "{\"action\":\"update_profile_signature\",\"signatureDataUrl\":\"" + dataUrl + "\"}";
        return mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json)
                        .cookie(adminCookie))
                .andExpect(status().is(expectedStatus))
                .andReturn();
    }

    private String storedSignature() {
        return jdbc.queryForObject("SELECT signature_url FROM users WHERE username='admin'", String.class);
    }

    @Test
    void chuKy_luu_Thay_Xoa_vaChanAnhSai() throws Exception {
        setupAdmin();
        Assertions.assertNull(storedSignature(), "ban đầu chưa có chữ ký");

        // ① LƯU được ảnh PNG.
        call(PNG_1PX, 200);
        Assertions.assertEquals(PNG_1PX, storedSignature(), "MT2 §13.4: phải lưu được ảnh chữ ký");

        // ② Ảnh mới THAY ảnh cũ (⛔ không giữ 2 ảnh) — đúng «xoá/thay ảnh cũ».
        call(JPG_1PX, 200);
        Assertions.assertEquals(JPG_1PX, storedSignature(), "ảnh mới phải THAY ảnh cũ");
        Assertions.assertEquals(1, jdbc.queryForObject(
                        "SELECT COUNT(*) FROM users WHERE username='admin' AND signature_url IS NOT NULL", Integer.class),
                "⛔ chỉ được có ĐÚNG MỘT ảnh chữ ký cho mỗi user");

        // ③ Rỗng ⇒ XOÁ (cột về NULL).
        call("", 200);
        Assertions.assertNull(storedSignature(), "MT2 §13.4: chuỗi rỗng ⇒ XOÁ chữ ký");

        // ④a URL ngoài (⛔ không phải data:image) ⇒ 400 + ⛔ KHÔNG ghi gì.
        call("https://example.com/ky.png", 400);
        Assertions.assertNull(storedSignature(), "bị chặn 400 ⇒ ⛔ KHÔNG được ghi chữ ký");

        // ④b Quá 2,8 MB ⇒ 400.
        String tooBig = "data:image/png;base64," + "A".repeat(2_800_001);
        call(tooBig, 400);
        Assertions.assertNull(storedSignature(), "ảnh quá hạn ⇒ 400 và ⛔ KHÔNG ghi");
    }

    /**
     * MT2 §13.4 vế **QUẢN TRỊ** — «Trong modal **tạo user** và **chỉnh sửa user** ⇒ thêm **Chữ ký**»:
     * gọi action `update_user` kèm khoá `signatureUrl` ⇒ chữ ký phải được ghi/xoá y như đường tự phục vụ.
     *
     * <p>⚠️ Dùng **giá trị THẬT của chính tài khoản admin** đọc từ CSDL (⛔ không bịa dữ liệu), vì `update_user`
     * đòi đủ `userId`/`employeeCode`/`fullName`/`username`/`email`/`role`/`active` và thông tin tổ chức.
     */
    @Test
    void duongQuanTri_updateUser_ghiDuocChuKy() throws Exception {
        setupAdmin();
        // ⚠️ BÀI HỌC ĐÃ KIỂM CHỨNG BẰNG BẰNG CHỨNG (xem tài liệu MT2-P3-04):
        //   test chạy trên **H2** và H2 ⛔ **KHÔNG có `role_catalog.kh_nv`** (bảng có ở schema-h2.sql:1451 nhưng rỗng),
        //   còn `update_user` kiểm `findRoleByCode(role)` = `role_catalog WHERE code=? AND active=1`
        //   ⇒ thiếu dòng đó thì trả **400 «Vai trò không tồn tại hoặc đang bị ẩn trong danh mục.»**
        //   ⛔ KHÔNG phải lỗi ở mã chữ ký. ⇒ PHẢI tự seed role trong test (TestActors có seed `module_catalog`,
        //   ⛔ KHÔNG seed `role_catalog`).
        // Cột NOT NULL (không default) của `role_catalog`: id · code · name · created_at · updated_at.
        jdbc.update("INSERT INTO role_catalog (id,code,name,active,created_at,updated_at) "
                + "SELECT 'rc_kh_nv','kh_nv','Nhân viên Phòng Kế hoạch',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP "
                + "WHERE NOT EXISTS (SELECT 1 FROM role_catalog WHERE code='kh_nv')");
        // ⚠️ TẦNG CHẶN #2 (đã đo bằng thực nghiệm): `resolveOrganization` cần có ĐƠN VỊ TỔ CHỨC thật:
        //   ① theo `organizationUnitId` HOẶC `department` ② theo `roleRow.defaultOrganizationUnitId`
        //   ③ theo `baseRole` → code {procurement→'KH', …} ⇒ `resolveOrganizationUnit(code)`.
        //   H2 ⛔ **không có sẵn `organization_units`** ⇒ phải seed (cột NOT NULL: id·code·name·unit_type·
        //   created_at·updated_at — dữ liệu thật có mã 'KH' = «Phòng Kế hoạch»).
        jdbc.update("INSERT INTO organization_units (id,code,name,unit_type,active,created_at,updated_at) "
                + "SELECT 'ORG_TEST_KH','KH','Phòng Kế hoạch','phong_ban',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP "
                + "WHERE NOT EXISTS (SELECT 1 FROM organization_units WHERE code='KH')");
        jdbc.update("UPDATE role_catalog SET base_role='procurement' WHERE code='kh_nv'");
        // ⚠️ Không dùng chính tài khoản `admin` làm ĐÍCH: `update_user` loại role `admin` TƯỜNG MINH
        //    (`|| "admin".equals(role)`) — hành vi có chủ đích, ⛔ không phải bug.
        TestActors.seedRequester(jdbc, "u_sig_target", "sig.target", "Người Đích", "kh_nv",
                "Phòng Kế hoạch", "p_sig", java.time.Instant.now());
        String userId = "u_sig_target";
        // Thông tin tổ chức: lấy từ chính user đích (⛔ không bịa) — nếu danh mục thiếu thì để rỗng như dữ liệu thật.
        jdbc.update("UPDATE users SET organization_unit_id=(SELECT organization_unit_id FROM users WHERE username='admin') "
                + "WHERE id='u_sig_target'");

        // ① Ghi chữ ký qua đường QUẢN TRỊ ⇒ lưu đúng.
        updateUserViaAdmin(userId, PNG_1PX, 200);
        Assertions.assertEquals(PNG_1PX, storedSignatureOf(userId),
                "MT2 §13.4: update_user (modal sửa user) phải ghi được chữ ký");

        // ② Chuỗi rỗng qua đường QUẢN TRỊ ⇒ XOÁ.
        updateUserViaAdmin(userId, "", 200);
        Assertions.assertNull(storedSignatureOf(userId), "rỗng qua đường quản trị ⇒ XOÁ chữ ký");

        // ③ Ảnh sai định dạng qua đường QUẢN TRỊ ⇒ 400 (cùng luật với đường tự phục vụ).
        updateUserViaAdmin(userId, "https://example.com/ky.png", 400);
        Assertions.assertNull(storedSignatureOf(userId), "bị chặn 400 ⇒ ⛔ KHÔNG ghi chữ ký");
    }

    /** Chữ ký đang lưu của một user bất kỳ (⛔ không chỉ admin). */
    private String storedSignatureOf(String userId) {
        return jdbc.queryForObject("SELECT signature_url FROM users WHERE id=?", String.class, userId);
    }

    /** Gọi `update_user` bằng dữ liệu THẬT của chính user đó + chữ ký cần kiểm. */
    private void updateUserViaAdmin(String userId, String signature, int expectedStatus) throws Exception {
        String json = "{"
                + "\"action\":\"update_user\","
                + "\"userId\":\"" + userId + "\","
                + "\"employeeCode\":\"" + str(userId, "employee_code") + "\","
                + "\"fullName\":\"" + str(userId, "full_name") + "\","
                + "\"username\":\"" + str(userId, "username") + "\","
                + "\"email\":\"" + str(userId, "email") + "\","
                + "\"role\":\"" + str(userId, "role") + "\","
                + "\"department\":\"" + str(userId, "department") + "\","
                + "\"organizationUnitId\":\"" + str(userId, "organization_unit_id") + "\","
                + "\"active\":\"" + (jdbc.queryForObject("SELECT active FROM users WHERE id=?", Integer.class, userId) == 1 ? "1" : "0") + "\","
                + "\"approvalLimit\":\"0\","
                + "\"signatureUrl\":\"" + signature + "\""
                + "}";
        // ⚠️ Dùng `andReturn()` + assert thủ công (⛔ KHÔNG `andExpect`) để LUÔN in được body —
        // cần body mới phân biệt được lỗi ở TEST (payload sai) hay ở MÃ (nhánh chữ ký), ⛔ không đoán.
        // ⚠️ IN CẢ PAYLOAD: cần biết giá trị `role` THẬT đang gửi (⛔ không đoán) vì `update_user`
        // kiểm `canonicalRoleCode(role)` + `findRoleByCode(role)` và role `admin` bị loại tường minh.
        System.out.println("[P3-04][payload] " + json);
        var result = mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json)
                        .cookie(adminCookie))
                .andReturn();
        int status = result.getResponse().getStatus();
        String body = result.getResponse().getContentAsString();
        System.out.println("[P3-04][update_user] status=" + status
                + " body=" + (body.length() > 500 ? body.substring(0, 500) : body));
        Assertions.assertEquals(expectedStatus, status, "update_user trả " + status + " — body=" + body);
    }

    private String str(String userId, String column) {
        return java.util.Objects.toString(
                jdbc.queryForObject("SELECT " + column + " FROM users WHERE id=?", String.class, userId), "");
    }
}
