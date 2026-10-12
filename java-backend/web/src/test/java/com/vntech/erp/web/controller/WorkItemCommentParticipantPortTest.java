package com.vntech.erp.web.controller;

import jakarta.servlet.http.Cookie;
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

/**
 * T-04 (PHASE 3 · CÔNG VIỆC) — 2 action WORK **vừa được PORT sang đường Java** ⇒ đóng `docs/61` **Q3**.
 *
 * <p><b>VẤN ĐỀ ĐÃ ĐO ĐƯỢC (09/10/2026):</b> `add_work_item_comment` và `set_work_item_participant` **CÓ quyền**
 * trong ma trận (`ActionRbacRegistry` L16/L314 · `scripts/system-route.mjs` `:26`/`:38` · `module_catalog`)
 * nhưng ⛔ **không có `case` nào trong `SystemController`** ⇒ gọi qua API = **400 «chưa triển khai»**
 * ⇒ 2 quyền **«MA»** trên bản chạy Java. Nay đã port **handler + luật truy cập** (use-case + adapter).
 *
 * <p><b>Bài này chứng minh 2 CHIỀU (⛔ không chỉ chiều DƯƠNG — luật `MỐC 110 §7`):</b>
 * <ul>
 *   <li><b>DƯƠNG</b>: người ĐƯỢC GIAO việc bình luận + thêm người tham gia được; <b>Trưởng phòng</b> thêm được;
 *       thêm người tham gia <b>2 lần</b> ⇒ **GHI ĐÈ, ⛔ không sinh dòng trùng** (JS `:1308`);</li>
 *   <li><b>ÂM ①</b>: người ⛔ **không có quyền module** ⇒ bị chặn ở **cổng RBAC** (403) — chứng minh việc port
 *       ⛔ **KHÔNG nới quyền**;</li>
 *   <li><b>ÂM ②</b>: người **CÓ** quyền `work` nhưng ⛔ **không liên quan** công việc ⇒ bị chặn ở **luật truy cập**
 *       (400) — đúng `requireWorkItemAccess` của JS `:501-515`.</li>
 * </ul>
 *
 * <p>⚠️ <b>Phụ thuộc schema test:</b> 2 bảng `work_item_comments` / `work_item_participants` trước đây
 * ⛔ **thiếu** trong `schema-h2.sql` (dù MySQL THẬT đã có) ⇒ đã bổ sung theo đúng `SHOW CREATE TABLE`.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class WorkItemCommentParticipantPortTest {

    /** Thông điệp cổng RBAC khi tài khoản thiếu quyền module (đo từ `PoRbacActionsIntegrationTest`). */
    private static final String RBAC_DENIED =
            "Tài khoản chưa được quản trị viên cấp đúng quyền cho thao tác này.";
    /** Thông điệp luật truy cập của `set_work_item_participant` (JS `:513`). */
    private static final String NOT_ASSIGNEE_NOR_MANAGER =
            "Chỉ người được giao việc, Trưởng phòng hoặc người có quyền điều phối công việc "
                    + "mới thêm được người tham gia.";

    private static final String WORK_ITEM = "wi_t04";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbc;

    private Cookie coAssignee;
    private Cookie coOutsider;
    private Cookie coForeign;
    private Cookie coManager;

    private MvcResult postAs(Cookie cookie, String json) throws Exception {
        return mockMvc.perform(post("/api/system").contentType(MediaType.APPLICATION_JSON)
                .content(json).cookie(cookie)).andReturn();
    }

    private static String body(MvcResult r) throws Exception {
        return r.getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8);
    }

    /**
     * Seed: admin (setup) + `module_catalog` khoá `work` + 4 tài khoản + 1 nhiệm vụ phòng `KH`:
     * <ul>
     *   <li>{@code u_giao} — người ĐƯỢC GIAO việc, CÓ quyền `work` (canUse + canEdit);</li>
     *   <li>{@code u_ngoai} — ⛔ không liên quan, ⛔ KHÔNG quyền module nào (đối chứng âm ①);</li>
     *   <li>{@code u.khac} — ⛔ không liên quan nhưng CÓ quyền `work` (đối chứng âm ②);</li>
     *   <li>{@code u.khtruong} — Trưởng phòng KH ({@code role='kh_truong'}, CÓ quyền `work`).</li>
     * </ul>
     */
    private void seed() throws Exception {
        Instant now = Instant.now();
        mockMvc.perform(post("/api/system").contentType(MediaType.APPLICATION_JSON)
                .content("{\"action\":\"setup\",\"companyName\":\"Công ty VNTECH\",\"fullName\":\"Quản trị viên\","
                        + "\"username\":\"admin\",\"password\":\"" + TestActors.PASSWORD + "\"}"))
                .andReturn();

        Integer coWork = jdbc.queryForObject(
                "SELECT COUNT(*) FROM module_catalog WHERE module_key='work'", Integer.class);
        if (coWork == null || coWork == 0) {
            jdbc.update("INSERT INTO module_catalog (module_key,label,icon,active,sort_order,created_at,updated_at)"
                    + " VALUES ('work','Công việc (mọi phòng ban)','CV',1,9,?,?)", now, now);
        }

        taiKhoan("u_giao", "kh.giao", "Người được giao việc", "engineer", "Phòng Kế hoạch", now, true);
        taiKhoan("u_ngoai", "kh.ngoai", "Người không liên quan", "engineer", "Phòng Kế hoạch", now, false);
        taiKhoan("u.khac", "kh.khac", "Người ngoài có quyền", "engineer", "Phòng Kế hoạch", now, true);
        taiKhoan("u.khtruong", "kh.truong", "Trưởng phòng Kế hoạch", "kh_truong", "Phòng Kế hoạch", now, true);

        jdbc.update("INSERT INTO work_items (id,task_no,department_code,work_group,title,work_step,dedupe_key,"
                        + "assigned_to,assigned_by,assigned_at,status,progress,active,created_at,updated_at)"
                        + " VALUES (?,?,?,?,?,?,?,?,?,?,'NEW',0,1,?,?)",
                WORK_ITEM, "TASK-T04-1", "KH", "plan", "Nhiệm vụ kiểm thử T-04", "step-1", "dd-t04-1",
                "u_giao", "u_khtruong", now, now, now);

        coAssignee = TestActors.login(mockMvc, "kh.giao");
        coOutsider = TestActors.login(mockMvc, "kh.ngoai");
        coForeign = TestActors.login(mockMvc, "kh.khac");
        coManager = TestActors.login(mockMvc, "kh.truong");
    }

    private void taiKhoan(String id, String username, String fullName, String role, String department,
                          Instant now, boolean coQuyenWork) {
        jdbc.update("INSERT INTO users (id,employee_code,full_name,username,password_hash,role,department,"
                        + "approval_limit,active,must_change_password,created_at,updated_at)"
                        + " VALUES (?,?,?,?,?,?,?,0,1,0,?,?)",
                id, "NV-" + id, fullName, username, TestActors.passwordHash(TestActors.PASSWORD), role,
                department, now, now);
        if (!coQuyenWork) return;
        jdbc.update("INSERT INTO user_module_permissions (id,user_id,module_key,can_view,can_use,can_create,"
                        + "can_edit,can_approve,can_export,permission_source,created_at,updated_at)"
                        + " VALUES (?,?,'work',1,1,0,1,0,0,'manual_override',?,?)",
                "ump_" + id, id, now, now);
    }

    // ───────────────────────────────── DƯƠNG ─────────────────────────────────

    @Test
    void nguoiDuocGiao_binhLuan_thanhCong_vaGhiDungBang() throws Exception {
        seed();
        MvcResult r = postAs(coAssignee, "{\"action\":\"add_work_item_comment\",\"workItemId\":\"" + WORK_ITEM
                + "\",\"comment\":\"Bình luận kiểm thử T-04\",\"visibility\":\"public\"}");
        assertEquals(200, r.getResponse().getStatus(),
                "Người được giao việc PHẢI bình luận được (trước đây action chưa tồn tại ⇒ 400). Thân: "
                        + body(r));
        Integer soDong = jdbc.queryForObject(
                "SELECT COUNT(*) FROM work_item_comments WHERE work_item_id=? AND user_id='u_giao'",
                Integer.class, WORK_ITEM);
        assertEquals(1, soDong, "Phải ghi ĐÚNG 1 hàng vào work_item_comments.");
        String visibility = jdbc.queryForObject(
                "SELECT visibility FROM work_item_comments WHERE work_item_id=? AND user_id='u_giao'",
                String.class, WORK_ITEM);
        assertEquals("public", visibility, "`visibility:\"public\"` phải được giữ nguyên (JS `:1293`).");
    }

    @Test
    void nguoiDuocGiao_themNguoiThamGia_lanHai_thiGHIDE_khongSinhDongTrung() throws Exception {
        seed();
        MvcResult lan1 = postAs(coAssignee, "{\"action\":\"set_work_item_participant\",\"workItemId\":\"" + WORK_ITEM
                + "\",\"userId\":\"u_ngoai\",\"roleInTask\":\"supporter\"}");
        assertEquals(200, lan1.getResponse().getStatus(), "Lần 1 phải thành công. Thân: " + body(lan1));
        MvcResult lan2 = postAs(coAssignee, "{\"action\":\"set_work_item_participant\",\"workItemId\":\"" + WORK_ITEM
                + "\",\"userId\":\"u_ngoai\",\"roleInTask\":\"follower\"}");
        assertEquals(200, lan2.getResponse().getStatus(), "Lần 2 phải thành công. Thân: " + body(lan2));

        Integer soDong = jdbc.queryForObject(
                "SELECT COUNT(*) FROM work_item_participants WHERE work_item_id=? AND user_id='u_ngoai'",
                Integer.class, WORK_ITEM);
        assertEquals(1, soDong, "MỘT dòng cho mỗi (công việc, người) — lần 2 phải GHI ĐÈ (JS `:1308`).");
        String vaiTro = jdbc.queryForObject(
                "SELECT role_in_task FROM work_item_participants WHERE work_item_id=? AND user_id='u_ngoai'",
                String.class, WORK_ITEM);
        assertEquals("follower", vaiTro, "Lần 2 phải ghi đè vai trò thành `follower`.");
    }

    @Test
    void truongPhong_themNguoiThamGia_duocPhep() throws Exception {
        seed();
        MvcResult r = postAs(coManager, "{\"action\":\"set_work_item_participant\",\"workItemId\":\"" + WORK_ITEM
                + "\",\"userId\":\"u_ngoai\",\"roleInTask\":\"supporter\"}");
        assertEquals(200, r.getResponse().getStatus(),
                "Trưởng phòng của phòng công việc PHẢI điều phối được (JS `:505-506`). Thân: " + body(r));
    }

    // ───────────────────────────── ĐỐI CHỨNG ÂM ─────────────────────────────

    @Test
    void doiChungAm1_khongCoQuyenModule_thiChan_O_congRBAC() throws Exception {
        seed();
        MvcResult r = postAs(coOutsider, "{\"action\":\"add_work_item_comment\",\"workItemId\":\"" + WORK_ITEM
                + "\",\"comment\":\"Tôi không có quyền\"}");
        assertEquals(403, r.getResponse().getStatus(),
                "Tài khoản ⛔ không có quyền module PHẢI bị chặn (⛔ không được nới quyền khi port). Thân: "
                        + body(r));
        assertTrue(body(r).contains(RBAC_DENIED), "Thông điệp phải là thông điệp cổng RBAC.");
        Integer soDong = jdbc.queryForObject(
                "SELECT COUNT(*) FROM work_item_comments WHERE work_item_id=?", Integer.class, WORK_ITEM);
        assertEquals(0, soDong, "⛔ KHÔNG được ghi hàng nào khi bị chặn.");
    }

    @Test
    void doiChungAm2_coQuyenModule_nhungKhongLienQuan_thiChanOLuatTruyCap() throws Exception {
        seed();
        MvcResult r = postAs(coForeign, "{\"action\":\"set_work_item_participant\",\"workItemId\":\"" + WORK_ITEM
                + "\",\"userId\":\"u_ngoai\",\"roleInTask\":\"follower\"}");
        assertEquals(400, r.getResponse().getStatus(),
                "Người CÓ quyền `work` nhưng ⛔ không liên quan công việc PHẢI bị luật truy cập chặn. Thân: "
                        + body(r));
        assertTrue(body(r).contains(NOT_ASSIGNEE_NOR_MANAGER),
                "Phải đúng thông điệp `requireWorkItemAccess` (JS `:513`). Thân: " + body(r));
        Integer soDong = jdbc.queryForObject(
                "SELECT COUNT(*) FROM work_item_participants WHERE work_item_id=?", Integer.class, WORK_ITEM);
        assertEquals(0, soDong, "⛔ KHÔNG được ghi hàng nào khi bị luật truy cập chặn.");
    }
}
