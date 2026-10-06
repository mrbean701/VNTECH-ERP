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
 * GO-LIVE 05/10/2026 — NGHIỆM THU BẢN VÁ «NGOẠI LỆ CÁ NHÂN» (`permission_source`).
 *
 * <p><b>LỖI ĐƯỢC VÁ.</b> `UserManagementUseCase.saveUserAccess` tính `permissionSource` bằng
 * {@code Boolean.TRUE.equals(row.get("isOverride"))} — nhưng **UI KHÔNG BAO GIỜ gửi `isOverride`**
 * ⇒ luôn `false` ⇒ **mọi dòng đều thành `department_default`**. Đo trên MySQL thật trước khi vá:
 * {@code user_module_permissions} = 2198 dòng, **2198 `department_default`, 0 `manual_override`**,
 * {@code permission_expires_at} NULL toàn bộ.
 *
 * <p><b>HẬU QUẢ ĐO ĐƯỢC.</b> {@code deleteModuleOverride} lọc {@code permission_source='manual_override'}
 * ⇒ không bao giờ khớp ⇒ nút «Xóa ngoại lệ cá nhân» là **nút chết**, và cột «Hết hạn» luôn trống.
 *
 * <p><b>CÁCH VÁ.</b> Khôi phục đúng ngữ nghĩa bản JS cũ (`scripts/system-route.mjs:3084`): SO các cờ
 * người dùng gửi với **mặc định hiệu lực của phòng** — khác ⇒ {@code manual_override}, bằng ⇒
 * {@code department_default}.
 *
 * <p>⛔ Test này phải CHỨNG MINH được cả hai chiều, nếu không nó chỉ là «xanh vô nghĩa»:
 * chiều KHÁC phải ra {@code manual_override}, chiều BẰNG phải ra {@code department_default}.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class UserOverrideSourceIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbc;

    private jakarta.servlet.http.Cookie adminCookie;
    private String staffId;
    private String deptId;

    private MvcResult sendPost(String json, int expectStatus) throws Exception {
        var req = post("/api/system").contentType(MediaType.APPLICATION_JSON).content(json);
        if (adminCookie != null) req.cookie(adminCookie);
        return mockMvc.perform(req).andExpect(status().is(expectStatus)).andReturn();
    }

    private MvcResult ok(String json) throws Exception {
        MvcResult r = sendPost(json, 200);
        assertTrue(r.getResponse().getContentAsString().contains("\"ok\":true"),
                "action phải ok:true — " + r.getResponse().getContentAsString());
        return r;
    }

    private static String a(String name, String fields) {
        return "{\"action\":\"" + name + "\"" + (fields == null || fields.isEmpty() ? "" : "," + fields) + "}";
    }

    private int count(String sql, Object... args) {
        Integer n = jdbc.queryForObject(sql, Integer.class, args);
        return n == null ? 0 : n;
    }

    /** Nguồn (`permission_source`) đang lưu cho một cặp (user, module). */
    private String nguon(String moduleKey) {
        var rows = jdbc.queryForList(
                "SELECT permission_source FROM user_module_permissions WHERE user_id=? AND module_key=?",
                String.class, staffId, moduleKey);
        return rows.isEmpty() ? "(KHONG CO DONG)" : rows.get(0);
    }

    /**
     * Dữ liệu nền: phòng KH có quyền `requests` = **toàn 1**, người dùng thuộc phòng đó.
     * ⛔ Tự kiểm chứng dữ liệu nền — nếu seed không vào được thì mọi khẳng định sau vô nghĩa.
     */
    private void seed() throws Exception {
        MvcResult setup = sendPost(a("setup",
                "\"companyName\":\"Công ty VNTECH\",\"fullName\":\"Quản trị viên\",\"username\":\"admin\",\"password\":\"VnTech@123\""), 201);
        adminCookie = setup.getResponse().getCookie("mep_session");
        Instant now = Instant.now();

        jdbc.update("INSERT INTO module_catalog (module_key,label,icon,active,sort_order,created_at,updated_at)"
                + " VALUES ('requests','Phiếu đề nghị mua hàng','X',1,10,?,?)", now, now);

        jdbc.update("INSERT INTO organization_units (id,code,name,unit_type,active,created_at,updated_at)"
                + " VALUES (?,?,?,'department',1,?,?)", "org_kh_ovr", "KH", "Phòng Kế hoạch", now, now);
        deptId = "org_kh_ovr";

        jdbc.update("INSERT INTO users (id,employee_code,full_name,username,role,department,organization_unit_id,"
                        + "approval_limit,active,must_change_password,system_level_code,created_at,updated_at)"
                        + " VALUES (?,?,?,?,?,?,?,0,1,0,NULL,?,?)",
                "u_ovr", "NV-OVR-01", "Nhân viên Kế hoạch", "kh.ovr01", "kh_nv", "Phòng Kế hoạch", deptId, now, now);
        staffId = "u_ovr";

        // Mặc định phòng cho 'requests' = TOÀN 1 → dùng làm mốc so sánh.
        jdbc.update("INSERT INTO department_module_permissions (id,organization_unit_id,module_key,"
                        + "can_view,can_use,can_create,can_edit,can_approve,can_export,active,created_at,updated_at)"
                        + " VALUES ('dmp_ovr',?,'requests',1,1,1,1,1,1,1,?,?)", deptId, now, now);

        assertEquals(1, count("SELECT COUNT(*) FROM module_catalog WHERE module_key='requests'"), "seed: module_catalog");
        assertEquals(1, count("SELECT COUNT(*) FROM department_module_permissions WHERE organization_unit_id=?", deptId),
                "seed: quyền phòng ban");
        assertEquals(1, count("SELECT COUNT(*) FROM users WHERE id=?", staffId), "seed: người dùng");
    }

    /** Payload `save_user_access` với 6 cờ cho `requests`. */
    private String payloadQuyen(int v, int u, int c, int e, int ap, int ex, String expiresAt) {
        return a("save_user_access", "\"userId\":\"" + staffId + "\",\"projectScopes\":[],\"warehouseScopes\":[],"
                + "\"modulePermissions\":[{\"moduleKey\":\"requests\",\"canView\":" + v + ",\"canUse\":" + u
                + ",\"canCreate\":" + c + ",\"canEdit\":" + e + ",\"canApprove\":" + ap + ",\"canExport\":" + ex
                + (expiresAt == null ? "" : ",\"permissionExpiresAt\":\"" + expiresAt + "\"") + "}]");
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    @Test
    void coCheCH_KHAC_macDinhPhong_thiPhaiLa_manualOverride() throws Exception {
        seed();

        // Mặc định phòng `requests` = toàn 1. Gửi cờ ĐÃ SỬA (canEdit 0, canApprove 0) ⇒ KHÁC mặc định.
        ok(payloadQuyen(1, 1, 1, 0, 0, 1, null));

        assertEquals(1, count("SELECT COUNT(*) FROM user_module_permissions WHERE user_id=?", staffId),
                "phải có ĐÚNG 1 dòng quyền cho người dùng");
        assertEquals("manual_override", nguon("requests"),
                "Cờ KHÁC mặc định phòng ⇒ permission_source PHẢI là 'manual_override' (đây chính là lỗi đã vá)");
    }

    @Test
    void coCheBANG_macDinhPhong_thiPhaiLa_departmentDefault() throws Exception {
        seed();

        // Gửi ĐÚNG bằng mặc định phòng (toàn 1) ⇒ KHÔNG phải ngoại lệ.
        ok(payloadQuyen(1, 1, 1, 1, 1, 1, null));

        assertEquals("department_default", nguon("requests"),
                "Cờ BẰNG mặc định phòng ⇒ permission_source PHẢI là 'department_default' (chiều còn lại, chống vá quá tay)");
    }

    @Test
    void ngoaiLeLuuDuocHanDung_vaNutXoaNgoaiLeKhongConChet() throws Exception {
        seed();

        // 1) Tạo NGOẠI LỆ kèm hạn dùng.
        ok(payloadQuyen(1, 1, 1, 0, 0, 1, "2027-01-31T00:00:00Z"));
        assertEquals("manual_override", nguon("requests"), "phải là ngoại lệ cá nhân");
        assertEquals(1, count("SELECT COUNT(*) FROM user_module_permissions WHERE user_id=? AND module_key='requests'"
                        + " AND permission_source='manual_override' AND permission_expires_at IS NOT NULL", staffId),
                "cột «Hết hạn» PHẢI lưu được (trước khi vá luôn NULL vì mọi dòng là department_default)");

        // 2) Bấm nút «Xóa ngoại lệ cá nhân» ⇒ PHẢI xoá được thật.
        ok(a("delete_user_module_override", "\"userId\":\"" + staffId + "\",\"moduleKey\":\"requests\""));

        assertEquals(0, count("SELECT COUNT(*) FROM user_module_permissions WHERE user_id=? AND module_key='requests'"
                        + " AND permission_source='manual_override'", staffId),
                "nút «Xóa ngoại lệ cá nhân» PHẢI xoá được dòng ngoại lệ (trước khi vá: nút chết, xoá 0 dòng)");
        assertEquals("(KHONG CO DONG)", nguon("requests"),
                "sau khi xoá ngoại lệ, quyền hiệu lực quay về mặc định phòng ⇒ KHÔNG còn dòng riêng");
    }
}
