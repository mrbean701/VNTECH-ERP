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
 * MT2-P4-05 — **RÀ RBAC**: kiểm rằng action đã khai báo thì **NGƯỜI CÓ QUYỀN vào được (200)** và
 * **NGƯỜI KHÔNG CÓ QUYỀN bị chặn (403)**.
 *
 * <p>⚠️ <b>VÌ SAO TEST NÀY TỒN TẠI</b>: ở MT2-P3-05 em thêm `case "supplier_materials"` nhưng **quên khai khoá RBAC**
 * và test cũ **vẫn xanh** — ⛔ vì nó gọi bằng **admin** (`isAdmin` cho qua SỚM) ⇒ **test bằng admin CHE lỗi phân quyền**
 * (đúng bài học đầu tiên của dự án). Test này gọi bằng **USER THƯỜNG** để bắt đúng loại lỗi đó ✔.
 *
 * <p>Cơ chế (đọc `ModulePermissionStoreAdapter.canUseModule`): cần
 * `module_catalog` active=1 (nếu `group_key` NULL thì bỏ qua điều kiện menu-group) +
 * `user_module_permissions.can_&lt;capability&gt;=1` còn hạn.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class RbacSupplierMaterialTest {

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
        // ① module `supplier_catalog` với `group_key` NULL ⇒ điều kiện menu-group được bỏ qua (theo SQL của adapter).
        jdbc.update("INSERT INTO module_catalog (module_key,label,icon,active,sort_order,created_at,updated_at) "
                + "SELECT 'supplier_catalog','Danh mục nhà cung cấp','X',1,10,?,? "
                + "WHERE NOT EXISTS (SELECT 1 FROM module_catalog WHERE module_key='supplier_catalog')", now, now);
        // ② NCC để action có dữ liệu trả về (⛔ không cần vật tư — chỉ cần danh sách chạy được).
        jdbc.update("INSERT INTO suppliers (id,code,name,active,created_at,updated_at) "
                + "SELECT 'sup_rbac','NCC-RBAC','NCC kiểm RBAC',1,?,? "
                + "WHERE NOT EXISTS (SELECT 1 FROM suppliers WHERE id='sup_rbac')", now, now);
        // ③ hai user THƯỜNG: một người CÓ quyền, một người KHÔNG.
        TestActors.seedRequester(jdbc, "u_rbac_ok", "rbac.ok", "Người Có Quyền", "kh_nv", "Phòng Kế hoạch", "p_rbac", now);
        TestActors.seedRequester(jdbc, "u_rbac_no", "rbac.no", "Người Không Quyền", "kh_nv", "Phòng Kế hoạch", "p_rbac", now);
        jdbc.update("INSERT INTO user_module_permissions (id,user_id,module_key,can_view,can_use,created_at,updated_at) "
                + "VALUES ('ump_rbac_ok','u_rbac_ok','supplier_catalog',1,1,?,?)", now, now);
    }

    private int call(Cookie cookie) throws Exception {
        var result = mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"action\":\"supplier_materials\",\"supplierId\":\"sup_rbac\"}")
                        .cookie(cookie))
                .andReturn();
        String body = result.getResponse().getContentAsString();
        System.out.println("[P4-05][supplier_materials] status=" + result.getResponse().getStatus()
                + " body=" + (body.length() > 220 ? body.substring(0, 220) : body));
        return result.getResponse().getStatus();
    }

    /**
     * ① Người **CÓ** module `supplier_catalog` ⇒ **200** (đã sửa được lỗi 403 NHẦM do thiếu khai báo ở P3-05).
     * ② Người **KHÔNG** có quyền ⇒ **403** ⇒ ⛔ backend vẫn là tầng enforcement (§17).
     * ③ Admin ⇒ 200 (đối chứng, ⛔ không dùng làm bằng chứng duy nhất nữa).
     */
    @Test
    void supplierMaterials_coQuyenThi200_khongQuyenThi403() throws Exception {
        setup();
        Cookie ok = TestActors.login(mockMvc, "rbac.ok");
        Cookie no = TestActors.login(mockMvc, "rbac.no");

        Assertions.assertEquals(200, call(ok),
                "MT2-P4-05: user THƯỜNG **CÓ** module `supplier_catalog` phải xem được danh sách vật tư NCC (200)");
        Assertions.assertEquals(403, call(no),
                "MT2-P4-05: user KHÔNG có `supplier_catalog` phải bị chặn 403 (§17 backend enforcement)");
        Assertions.assertEquals(200, call(adminCookie), "admin ⇒ 200 (đối chứng)");
    }
}
