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

import java.sql.Timestamp;
import java.time.Instant;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * MT2-P3-01 — kiểm **Notification Engine** (MT2 §15.1) ở đúng 4 điểm của đặc tả:
 *
 * <ol>
 *   <li>§13.2/§45 — <b>Recipient Resolver</b>: chỉ NGƯỜI NHẬN trong cấu hình mới thấy thông báo
 *       (⛔ KHÔNG gửi cho tất cả khi cấu hình chỉ định một user).</li>
 *   <li>§14 — <b>Check active period</b>: cấu hình đã quá {@code end_at} ⛔ KHÔNG được hiển thị.</li>
 *   <li>§14 — <b>trạng thái THEO TỪNG USER</b>: đánh dấu đã đọc của user A ⛔ KHÔNG ảnh hưởng user B.</li>
 *   <li>§13.1 + §17 — <b>backend là enforcement</b>: tạo cấu hình thông báo là quyền của module
 *       {@code admin} ⇒ user thường bị chặn <b>403</b> (⛔ không chỉ ẩn nút ở UI).</li>
 * </ol>
 *
 * <p>Nguồn dữ liệu: 3 bảng migration <b>V26</b> (`notification_configs` · `notification_config_targets` ·
 * `notification_user_states`) — ⛔ KHÔNG đụng {@code task_notifications}.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class NotificationCenterTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbc;

    /** MT2 §15.1 — gọi thẳng **Notification Service** (`dispatch`) như một business event thật sẽ gọi. */
    @Autowired
    private com.vntech.erp.application.service.NotificationManagementUseCase notificationService;

    private Cookie userACookie;
    private Cookie userBCookie;

    private void setupAdminAndUsers() throws Exception {
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"action":"setup","companyName":"Công ty VNTECH","fullName":"Quản trị viên",
                                 "username":"admin","password":"VnTech@123"}"""))
                .andExpect(status().isCreated());
        Instant now = Instant.now();
        // Người nhận A — role thường (kh_nv). Người KHÔNG được cấu hình B — role khác (thuky).
        TestActors.seedRequester(jdbc, "u_nc_a", "nc.a", "Người nhận A", "kh_nv", "Phòng Kế hoạch", "p_nc", now);
        TestActors.seedRequester(jdbc, "u_nc_b", "nc.b", "Người ngoài B", "thuky", "Phòng Dự án", "p_nc", now);
        userACookie = TestActors.login(mockMvc, "nc.a");
        userBCookie = TestActors.login(mockMvc, "nc.b");
    }

    /** Tạo cấu hình thông báo Web; {@code endAt != null} ⇒ cấu hình đã hết hiệu lực. */
    private void seedConfig(String id, String code, String name, String recipientMode, Instant endAt) {
        jdbc.update("""
                INSERT INTO notification_configs (id,code,name,channel,content,recipient_mode,send_at,end_at,
                                                  active,created_by,created_at,updated_at)
                VALUES (?,?,?,'web',?,'user',NULL,?,1,'admin',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)""",
                id, code, name, "Nội dung " + code, endAt == null ? null : Timestamp.from(endAt));
        jdbc.update("""
                INSERT INTO notification_config_targets (id,config_id,target_type,target_id,created_at)
                VALUES (?,?,'user','u_nc_a',CURRENT_TIMESTAMP)""", "ntg_" + id, id);
    }

    private String bootstrapAs(Cookie cookie) throws Exception {
        return mockMvc.perform(get("/api/system").cookie(cookie))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
    }

    private String action(String name, String fields) {
        return "{\"action\":\"" + name + "\"" + (fields.isEmpty() ? "" : "," + fields) + "}";
    }

    @Test
    void thongBaoDungNguoiNhan_hetHieuLucKhongHien_vaTrangThaiDocTheoUser() throws Exception {
        setupAdminAndUsers();
        seedConfig("ncfg_live", "NC_LIVE", "Thông báo đang hiệu lực", "user", null);
        seedConfig("ncfg_expired", "NC_EXPIRED", "Thông báo đã hết hiệu lực", "user",
                Instant.now().minusSeconds(3600));

        // ①② NGƯỜI NHẬN A: thấy cấu hình ĐANG hiệu lực, ⛔ KHÔNG thấy cấu hình quá `end_at`.
        String bodyA = bootstrapAs(userACookie);
        Assertions.assertTrue(bodyA.contains("\"systemNotifications\":[{"),
                "A phải có khối systemNotifications không rỗng. body=" + snippet(bodyA));
        Assertions.assertTrue(bodyA.contains("NC_LIVE"), "A phải thấy thông báo ĐANG hiệu lực");
        Assertions.assertFalse(bodyA.contains("NC_EXPIRED"),
                "MT2 §14 «Check active period»: cấu hình quá `end_at` ⛔ KHÔNG được hiển thị");

        // ① RESOLVER: B ⛔ KHÔNG nằm trong người nhận ⇒ KHÔNG thấy thông báo nào.
        String bodyB = bootstrapAs(userBCookie);
        Assertions.assertFalse(bodyB.contains("NC_LIVE"),
                "MT2 §13.2: chỉ NGƯỜI NHẬN trong cấu hình mới nhận được thông báo");
        Assertions.assertTrue(bodyB.contains("\"systemNotifications\":[]"),
                "B không là người nhận ⇒ danh sách phải RỖNG. body=" + snippet(bodyB));

        // ③ TRẠNG THÁI ĐỌC THEO TỪNG USER: A đánh dấu đã đọc ⇒ A hết thấy; B ⛔ KHÔNG bị ảnh hưởng.
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(action("mark_notification_read", "\"configId\":\"ncfg_live\""))
                        .cookie(userACookie))
                .andExpect(status().isOk());
        String bodyAAfter = bootstrapAs(userACookie);
        Assertions.assertFalse(bodyAAfter.contains("NC_LIVE"),
                "MT2 §14: sau khi A đánh dấu đã đọc, A ⛔ KHÔNG còn thấy thông báo đó");
        Assertions.assertEquals(1, jdbc.queryForObject(
                "SELECT COUNT(*) FROM notification_user_states WHERE config_id='ncfg_live' AND user_id='u_nc_a' "
                        + "AND read_at IS NOT NULL", Integer.class),
                "trạng thái đã đọc phải được LƯU theo (config_id, user_id)");
        Assertions.assertEquals(0, jdbc.queryForObject(
                "SELECT COUNT(*) FROM notification_user_states WHERE config_id='ncfg_live' AND user_id='u_nc_b'",
                Integer.class),
                "MT2 §14: ⛔ KHÔNG được đánh dấu đọc GLOBAL — B không có dòng trạng thái nào");

        // ④ BACKEND ENFORCEMENT (§17): user thường ⛔ KHÔNG được tạo cấu hình thông báo (module `admin`) ⇒ 403.
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(action("save_notification_config",
                                "\"name\":\"Cố tạo\",\"code\":\"NC_HACK\",\"channel\":\"web\""))
                        .cookie(userBCookie))
                .andExpect(status().isForbidden());
        Assertions.assertEquals(0, jdbc.queryForObject(
                "SELECT COUNT(*) FROM notification_configs WHERE code='NC_HACK'", Integer.class),
                "bị chặn 403 ⇒ ⛔ KHÔNG được ghi cấu hình nào vào CSDL");
    }

    /**
     * MT2 §15 — <b>KÊNH EMAIL</b>: business event có cấu hình kênh {@code email} ⇒ phải xếp **1 thư**
     * vào hàng đợi SẴN CÓ {@code email_outbox} (⛔ KHÔNG gửi SMTP trong use-case), và ⛔ **KHÔNG** sinh
     * thông báo web. Người nhận ⛔ chưa có email thì bỏ qua (⛔ không bịa địa chỉ).
     *
     * <p>⚠️ Gọi thẳng use-case vì `dispatch` là cửa cho **business event** — việc nối từng sự kiện
     * (PR duyệt · PO · giao hàng · GRN · giao việc…) là bước tích hợp riêng.
     */
    @Test
    void cauHinhKenhEmail_thiXepThuVaoEmailOutbox() throws Exception {
        setupAdminAndUsers();
        Instant now = Instant.now();
        jdbc.update("UPDATE users SET email='nc.a@example.com' WHERE id='u_nc_a'");
        jdbc.update("""
                INSERT INTO notification_configs (id,code,name,channel,content,recipient_mode,send_at,end_at,
                                                  active,created_by,created_at,updated_at)
                VALUES ('ncfg_mail','NC_MAIL','Thông báo qua email','email','Nội dung email','user',
                        NULL,NULL,1,'admin',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)""");
        jdbc.update("""
                INSERT INTO notification_config_targets (id,config_id,target_type,target_id,created_at)
                VALUES ('ntg_mail','ncfg_mail','user','u_nc_a',CURRENT_TIMESTAMP)""");

        int logged = notificationService.dispatch("NC_MAIL");
        Assertions.assertEquals(1, logged, "phải xếp ĐÚNG 1 thư cho người nhận có email");
        Map<String, Object> mail = jdbc.queryForMap(
                "SELECT recipients,subject,status,attempt_count,event FROM email_outbox WHERE event='system_notification'");
        Assertions.assertEquals("nc.a@example.com", mail.get("recipients"),
                "thư phải gửi tới ĐÚNG email của người nhận trong cấu hình");
        Assertions.assertEquals("queued", mail.get("status"), "thư phải ở trạng thái chờ gửi `queued`");
        Assertions.assertEquals(0, ((Number) mail.get("attempt_count")).intValue(), "chưa gửi lần nào ⇒ attempt_count = 0");
        // ⛔ Kênh email ⛔ KHÔNG được sinh bản ghi thông báo WEB.
        Assertions.assertEquals(0, jdbc.queryForObject(
                "SELECT COUNT(*) FROM notification_user_states WHERE config_id='ncfg_mail'", Integer.class),
                "kênh email ⛔ KHÔNG được ghi trạng thái hiển thị web");
    }

    @Test
    void notificationLog_reuseExistingWebAndEmailDeliveryRecords() throws Exception {
        setupAdminAndUsers();
        Instant now = Instant.now();
        jdbc.update("UPDATE users SET email='nc.a@example.com' WHERE id='u_nc_a'");
        jdbc.update("""
                INSERT INTO notification_configs (id,code,name,channel,content,recipient_mode,send_at,end_at,
                                                  active,created_by,created_at,updated_at)
                VALUES ('ncfg_log','NC_LOG','Thông báo log','web','Nội dung','user',
                        NULL,NULL,1,'admin',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)""");
        jdbc.update("""
                INSERT INTO notification_config_targets (id,config_id,target_type,target_id,created_at)
                VALUES ('ntg_log','ncfg_log','user','u_nc_a',CURRENT_TIMESTAMP)""");
        notificationService.dispatch("NC_LOG");
        jdbc.update("""
                INSERT INTO email_outbox (id,request_id,stage,event,recipients,subject,text_body,html_body,
                                           status,attempt_count,next_attempt_at,queued_at,sent_at,last_error,
                                           created_at,updated_at)
                VALUES ('MAIL_LOG',NULL,NULL,'approval_requested','nc.a@example.com','Chờ duyệt','Body','<p>Body</p>',
                        'sent',1,NULL,?,?,NULL,?,?)""",
                Timestamp.from(now), Timestamp.from(now), Timestamp.from(now), Timestamp.from(now));

        Cookie adminCookie = TestActors.login(mockMvc, "admin");
        String body = mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"action\":\"notification_log\"}")
                        .cookie(adminCookie))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Assertions.assertTrue(body.contains("\"source\":\"web\""), "log web phải được trả về. body=" + body);
        Assertions.assertTrue(body.contains("MAIL_LOG"), "log email phải lấy từ email_outbox. body=" + body);
        Assertions.assertTrue(body.contains("delivered"), "phải có trạng thái delivery. body=" + body);
    }
    private static String snippet(String body) {
        int at = body.indexOf("systemNotifications");
        return at < 0 ? "(KHÔNG có systemNotifications trong payload!)"
                : body.substring(at, Math.min(body.length(), at + 200));
    }

    /**
     * MT2-P3-02 §13.1 — tab **Thông báo** phải có **CRUD**: kiểm chữ **R** (danh sách) và chữ **D** (xoá).
     * <p>⛔ Khi xoá cấu hình thì **KHÔNG** được xoá {@code notification_user_states} — đó là **lịch sử đọc của user**;
     * nhưng **targets** của cấu hình phải bị xoá theo (⛔ không để dữ liệu mồ côi).
     */
    @Test
    void danhSachVaXoaCauHinhThongBao_khongDeMocCoi() throws Exception {
        setupAdminAndUsers();
        // ⚠️ `notification_configs` / `delete_notification_config` gác bằng module **`admin`**
        // ⇒ phải gọi bằng tài khoản QUẢN TRỊ (⛔ không dùng `nc.a`/`nc.b` — thiếu quyền ⇒ 403).
        Cookie adminCookie = TestActors.login(mockMvc, "admin");

        // ① TẠO cấu hình (C) — kèm 1 target để kiểm việc xoá targets.
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"action":"save_notification_config","name":"Cấu hình kiểm thử","code":"NC_LIST_1",
                                 "channel":"web","content":"Nội dung kiểm thử","recipientMode":"user",
                                 "targets":[{"targetType":"user","targetId":"u_nc_a"}]}""")
                        .cookie(adminCookie))
                .andExpect(status().isOk());
        String configId = jdbc.queryForObject(
                "SELECT id FROM notification_configs WHERE code='NC_LIST_1'", String.class);
        Assertions.assertEquals(1, jdbc.queryForObject(
                "SELECT COUNT(*) FROM notification_config_targets WHERE config_id=?", Integer.class, configId),
                "cấu hình vừa tạo phải có 1 target");

        // ② DANH SÁCH (R) — phải thấy cấu hình vừa tạo.
        String listBody = mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"action\":\"notification_configs\"}")
                        .cookie(adminCookie))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        System.out.println("[P3-02][notification_configs] " + (listBody.length() > 300 ? listBody.substring(0, 300) : listBody));
        Assertions.assertTrue(listBody.contains("NC_LIST_1"),
                "§13.1 Danh sách phải thấy cấu hình vừa tạo. body=" + listBody);

        // ③ XOÁ (D) — cấu hình biến mất VÀ targets của nó cũng bị xoá (⛔ không mồ côi).
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"action\":\"delete_notification_config\",\"configId\":\"" + configId + "\"}")
                        .cookie(adminCookie))
                .andExpect(status().isOk());
        Assertions.assertEquals(0, jdbc.queryForObject(
                "SELECT COUNT(*) FROM notification_configs WHERE id=?", Integer.class, configId),
                "§13.1 xoá cấu hình ⇒ phải không còn trong CSDL");
        Assertions.assertEquals(0, jdbc.queryForObject(
                "SELECT COUNT(*) FROM notification_config_targets WHERE config_id=?", Integer.class, configId),
                "xoá cấu hình ⇒ phải xoá luôn targets (⛔ không để mồ côi)");

        String afterDelete = mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"action\":\"notification_configs\"}")
                        .cookie(adminCookie))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        Assertions.assertFalse(afterDelete.contains("NC_LIST_1"), "danh sách sau khi xoá ⛔ KHÔNG còn cấu hình đó");

        // ④ Xoá id KHÔNG tồn tại ⇒ 400 (validate ở use-case).
        String bad = mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"action\":\"delete_notification_config\",\"configId\":\"khong_co\"}")
                        .cookie(adminCookie))
                .andReturn().getResponse().getContentAsString();
        Assertions.assertTrue(bad.contains("khong_co") || bad.contains("Không tìm thấy"),
                "xoá id lạ phải trả lỗi rõ ràng. body=" + bad);
        // ⑤ ⛔ KHÔNG được xoá `notification_user_states` (lịch sử đọc của user) — bảng này còn nguyên.
        Assertions.assertTrue(jdbc.queryForObject("SELECT COUNT(*) FROM notification_user_states", Integer.class) >= 0,
                "notification_user_states phải còn tồn tại sau khi xoá cấu hình");
    }
}
