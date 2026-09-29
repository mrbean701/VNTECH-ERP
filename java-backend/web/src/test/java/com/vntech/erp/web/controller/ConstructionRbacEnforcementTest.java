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
 * MT3 §RBAC — CHỨNG MINH backend **THỰC SỰ cưỡng chế quyền** cho CRUD THI CÔNG.
 *
 * <p><b>Vì sao cần test này</b>: khảo sát mã đã cho thấy các action Thi công <b>đã được đăng ký cổng quyền</b>
 * ({@code ActionRbacRegistry}) và cổng là <b>fail-closed</b> ({@code getOrDefault(action, List.of())}).
 * Nhưng «đã khai báo» ⛔ **không tự động nghĩa là «đã chặn thật»** ⇒ MT3 yêu cầu kiểm bằng
 * <b>tài khoản thường</b> và kỳ vọng <b>bị từ chối</b>. Đây chính là phần được chứng minh ở đây.
 *
 * <p><b>Cách chứng minh ⛔ không «chặn trắng»</b>: sau khi bị chặn vì thiếu quyền, ta <b>CẤP quyền</b> cho
 * đúng tài khoản đó rồi gọi lại với <b>payload RỖNG</b>. Lúc này lỗi phải là <b>lỗi ĐẦU VÀO (400)</b>,
 * ⛔ không còn là lỗi quyền ⇒ suy ra việc bị chặn trước đó là do <b>QUYỀN</b>, ⛔ không phải do hệ thống
 * từ chối mọi yêu cầu. (Đối chứng dương này ⛔ không cần payload nghiệp vụ hợp lệ — nên test vẫn chạy được
 * mà không phải bịa dữ liệu thi công.)
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class ConstructionRbacEnforcementTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbc;

    private jakarta.servlet.http.Cookie requesterCookie;

    private void setupAdmin() throws Exception {
        MvcResult setup = mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"action":"setup","companyName":"Công ty VNTECH","fullName":"Quản trị viên",
                                 "username":"admin","password":"VnTech@123"}"""))
                .andExpect(status().isCreated())
                .andReturn();
        // ⛔ không dùng admin cho các ca dưới: admin thường có toàn quyền ⇒ không chứng minh được gì.
    }

    /** Tài khoản THƯỜNG: chỉ được cấp module `requests` (⛔ KHÔNG có `construction`). */
    private void seedPlainUser() throws Exception {
        TestActors.seedRequester(jdbc, "u_plain", "kh.nv09", "Nhân viên thường", "kh_nv",
                "Phòng Kế hoạch", "p_1", Instant.now());
        requesterCookie = TestActors.login(mockMvc, "kh.nv09");
    }

    /** CẤP quyền module `construction` (canCreate) cho tài khoản thường — dùng cho ĐỐI CHỨNG DƯƠNG. */
    private void grantConstructionModule() {
        Instant now = Instant.now();
        Integer rows = jdbc.queryForObject(
                "SELECT COUNT(*) FROM module_catalog WHERE module_key='construction'", Integer.class);
        if (rows == null || rows == 0) {
            jdbc.update("INSERT INTO module_catalog (module_key,label,icon,active,sort_order,created_at,updated_at)"
                    + " VALUES ('construction','Thi công','TC',1,20,?,?)", now, now);
        }
        jdbc.update("INSERT INTO user_module_permissions (id,user_id,module_key,can_view,can_use,can_create,"
                        + "can_edit,can_approve,can_export,permission_source,created_at,updated_at)"
                        + " VALUES (?,?,'construction',1,1,1,1,0,0,'manual_override',?,?)",
                "ump_construction_u_plain", "u_plain", now, now);
    }

    private org.springframework.test.web.servlet.ResultActions call(String body) throws Exception {
        return mockMvc.perform(post("/api/system")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body)
                .cookie(requesterCookie));
    }

    @Test
    void constructionCrud_isEnforcedByBackendRbac() throws Exception {
        setupAdmin();
        seedPlainUser();

        // ── ① THIẾU quyền `construction` ⇒ LƯU NHẬT KÝ THI CÔNG BỊ TỪ CHỐI.
        //    ⛔ Cố ý dùng payload tối thiểu: cổng RBAC phải chặn TRƯỚC khi đọc dữ liệu nghiệp vụ.
        call("{\"action\":\"save_construction_daily_log\",\"projectId\":\"p_1\"}")
                .andExpect(status().is4xxClientError());

        // ── ② THIẾU quyền ⇒ XOÁ NHẬT KÝ THI CÔNG cũng BỊ TỪ CHỐI.
        call("{\"action\":\"delete_construction_daily_log\",\"logId\":\"cdl_khong_ton_tai\"}")
                .andExpect(status().is4xxClientError());

        // ── ③ ĐỐI CHỨNG DƯƠNG: CẤP quyền `construction` rồi gọi lại ⇒ cổng quyền MỞ.
        //    Payload vẫn RỖNG ⇒ phải ra lỗi ĐẦU VÀO (400), ⛔ KHÔNG còn bị chặn vì quyền.
        //    ⇒ Chứng minh ① và ② bị chặn là do QUYỀN, ⛔ không phải hệ thống chặn trắng mọi yêu cầu.
        grantConstructionModule();
        call("{\"action\":\"save_construction_daily_log\",\"projectId\":\"p_1\"}")
                .andExpect(status().isBadRequest());

        // ── ④ PHẠM VI DỰ ÁN: đã CÓ quyền module, nhưng gọi vào dự án ⛔ KHÔNG được cấp phạm vi ⇒ TỪ CHỐI.
        //    Chứng minh tầng `accessScope.requireProjectAccess` chạy THẬT (⛔ không chỉ dựa quyền module).
        //    ⛔ Không cần payload nghiệp vụ đầy đủ: trong `ProductionManagementUseCase.saveConstructionDailyLog`
        //    cổng phạm vi là KIỂM TRA ĐẦU TIÊN (ngay sau khi đọc `logId`/`projectId`).
        Instant now = Instant.now();
        jdbc.update("INSERT INTO projects (id,code,name,status,created_at,updated_at) VALUES (?,?,?,'active',?,?)",
                "p_2", "PRJ-02", "Dự án 2", now, now);
        call("{\"action\":\"save_construction_daily_log\",\"projectId\":\"p_2\"}")
                .andExpect(status().is4xxClientError());
    }
}
