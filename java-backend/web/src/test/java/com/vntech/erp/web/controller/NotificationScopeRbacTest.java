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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * MT3 §I — CHỨNG MINH: backend KIỂM người tạo thông báo có quyền gửi tới PHẠM VI đã chọn.
 *
 * <p><b>Lỗ hổng đã bịt</b>: trước đây `case "save_notification_config"` gọi `requireCurrentUser(request)`
 * rồi **VỨT BỎ kết quả** ⇒ ⛔ không kiểm được gì ⇒ ai vào được màn quản trị là gửi được tới
 * **BẤT KỲ** phạm vi nào. Nay controller lấy `cu` ra và kiểm **từng dự án** trong `targets`
 * bằng `accessScopeService.requireProjectAccess(...)`.
 *
 * <p>Bài này chứng minh <b>PHẠM VI DỰ ÁN</b>. ⛔ `department`/`all` CHƯA kiểm vì **chưa có luật**
 * cấp quyền — ghi rõ ở `docs/agent-progress/TASK-MT3-BE-09.md`, ⛔ không tự chọn.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class NotificationScopeRbacTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbc;

    private jakarta.servlet.http.Cookie userCookie;

    private void setupAdmin() throws Exception {
        MvcResult setup = mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"action":"setup","companyName":"Công ty VNTECH","fullName":"Quản trị viên",
                                 "username":"admin","password":"VnTech@123"}"""))
                .andExpect(status().isCreated())
                .andReturn();
        // ⛔ không dùng admin: admin thường có toàn quyền ⇒ không chứng minh được gì.
    }

    /**
     * Tài khoản thường: CỐ Ý cấp đủ quyền module `admin` (để action ⛔ KHÔNG bị chặn ở cổng RBAC)
     * + phạm vi **CHỈ** dự án `p_1`. Nhờ vậy nếu bị chặn khi nhắm `p_2` thì **nguyên nhân là PHẠM VI**,
     * ⛔ không phải quyền module.
     */
    private void seedUserWithAdminModuleAndScopeP1() throws Exception {
        Instant now = Instant.now();
        jdbc.update("INSERT INTO projects (id,code,name,status,created_at,updated_at) VALUES (?,?,?,'active',?,?)",
                "p_1", "PRJ-01", "Dự án 1", now, now);
        jdbc.update("INSERT INTO projects (id,code,name,status,created_at,updated_at) VALUES (?,?,?,'active',?,?)",
                "p_2", "PRJ-02", "Dự án 2", now, now);
        TestActors.seedRequester(jdbc, "u_nsc", "kh.nsc1", "Nhân viên thông báo", "kh_nv",
                "Phòng Kế hoạch", "p_1", now);
        Integer rows = jdbc.queryForObject(
                "SELECT COUNT(*) FROM module_catalog WHERE module_key='admin'", Integer.class);
        if (rows == null || rows == 0) {
            jdbc.update("INSERT INTO module_catalog (module_key,label,icon,active,sort_order,created_at,updated_at)"
                    + " VALUES ('admin','Quản trị','AD',1,30,?,?)", now, now);
        }
        jdbc.update("INSERT INTO user_module_permissions (id,user_id,module_key,can_view,can_use,can_create,"
                        + "can_edit,can_approve,can_export,permission_source,created_at,updated_at)"
                        + " VALUES (?,?,'admin',1,1,1,1,1,0,'manual_override',?,?)",
                "ump_admin_u_nsc", "u_nsc", now, now);
        userCookie = TestActors.login(mockMvc, "kh.nsc1");
    }

    private String configBody(String code, String targetProjectId) {
        return "{\"action\":\"save_notification_config\",\"code\":\"" + code + "\",\"name\":\"Thông báo thử\","
                + "\"channel\":\"web\",\"content\":\"Nội dung thử\",\"recipientMode\":\"project\","
                + "\"targets\":[{\"targetType\":\"project\",\"targetId\":\"" + targetProjectId + "\"}]}";
    }

    @Test
    void notificationConfig_enforcesProjectScopeOfSender() throws Exception {
        setupAdmin();
        seedUserWithAdminModuleAndScopeP1();

        // ── ① Nhắm dự án **p_2** (⛔ KHÔNG có phạm vi) ⇒ BỊ TỪ CHỐI.
        //    ⚠️ Tài khoản này ĐÃ có quyền module `admin` ⇒ việc bị chặn là do **PHẠM VI DỰ ÁN**.
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(configBody("NSC_DENY_1", "p_2"))
                        .cookie(userCookie))
                .andExpect(status().is4xxClientError());

        // ── ② ĐỐI CHỨNG DƯƠNG: cùng tài khoản nhắm dự án **p_1** (CÓ phạm vi) ⇒ ⛔ KHÔNG bị chặn vì phạm vi.
        //    ⇒ Chứng minh ① bị chặn là do PHẠM VI, ⛔ không phải chặn trắng mọi yêu cầu.
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(configBody("NSC_ALLOW_1", "p_1"))
                        .cookie(userCookie))
                .andExpect(status().isOk());

        // ── ③ Cấu hình gửi tới p_1 PHẢI thực sự được ghi (⛔ không «thành công giả»).
        Integer saved = jdbc.queryForObject(
                "SELECT COUNT(*) FROM notification_configs WHERE code='NSC_ALLOW_1'", Integer.class);
        org.junit.jupiter.api.Assertions.assertEquals(1, saved,
                "cấu hình nhắm dự án CÓ phạm vi phải được lưu thật");
        // …và cấu hình nhắm dự án KHÔNG có phạm vi ⛔ KHÔNG được lưu.
        Integer denied = jdbc.queryForObject(
                "SELECT COUNT(*) FROM notification_configs WHERE code='NSC_DENY_1'", Integer.class);
        org.junit.jupiter.api.Assertions.assertEquals(0, denied,
                "⛔ yêu cầu bị chặn KHÔNG được ghi vào cơ sở dữ liệu");
    }
}
