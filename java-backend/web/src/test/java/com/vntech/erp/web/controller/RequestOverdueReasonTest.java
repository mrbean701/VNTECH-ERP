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
import java.time.temporal.ChronoUnit;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * MT2 §4.4 — <b>DUYỆT KHI QUÁ HẠN SLA: VẪN CHO PHÉP, NHƯNG BẮT BUỘC NHẬP LÝ DO.</b>
 *
 * <p>Nguyên văn yêu cầu: “Nếu SLA đã quá hạn: VẪN CHO PHÉP DUYỆT. Tuy nhiên Bắt buộc nhập lý do quá hạn.
 * Không cho submit approval nếu {@code SLA expired + Reason empty}. Phải reject validation.”
 *
 * <p>Hạ tầng seed sao chép từ {@link RequestApprovalOwnerOnlyTest} (topology LIVE {@code PRJ-DEMO-01};
 * bước 1 TẮT nên phiếu mới sinh ở BƯỚC 2, owner = {@code u_thuky}).
 * Hạn của bước = {@code approvals.due_at} (đặt tại {@code RequestManagementUseCase:392}
 * = {@code now + approval_stage_catalog.sla_hours * 3600}).
 *
 * <p>3 CA:
 * <ol>
 *   <li><b>CHƯA quá hạn + lý do rỗng ⇒ 200</b> (⛔ không chặn oan).</li>
 *   <li><b>QUÁ hạn + lý do RỖNG ⇒ 400</b> kèm “Bắt buộc nhập lý do duyệt quá hạn”.</li>
 *   <li><b>QUÁ hạn + CÓ lý do ⇒ 200</b> và lý do được <b>LƯU VẾT</b> vào {@code approvals.overdue_reason}.</li>
 * </ol>
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class RequestOverdueReasonTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbc;

    private Cookie requesterCookie;
    /** Cookie của OWNER từng bước — cổng owner-only (TASK-140) đòi ĐÚNG người được phân công của bước đó. */
    private final java.util.Map<Integer, Cookie> stageCookies = new java.util.HashMap<>();

    private void setupAdmin() throws Exception {
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"action":"setup","companyName":"Công ty VNTECH","fullName":"Quản trị viên",
                                 "username":"admin","password":"VnTech@123"}"""))
                .andExpect(status().isCreated());
    }

    private void seedUser(String userId, String username, String fullName, String role, String hash, Instant now) {
        jdbc.update("INSERT INTO users (id,employee_code,full_name,username,password_hash,role,department,"
                        + "approval_limit,active,must_change_password,created_at,updated_at)"
                        + " VALUES (?,?,?,?,?,?,?,0,1,0,?,?)",
                userId, "NV-" + userId, fullName, username, hash, role, "Phòng " + role, now, now);
        jdbc.update("INSERT INTO user_project_scopes (id,user_id,project_id,permission,created_at,updated_at)"
                + " VALUES (?,?,?,'approve',?,?)", "ups_" + userId, userId, "p_1", now, now);
        jdbc.update("INSERT INTO user_module_permissions (id,user_id,module_key,can_view,can_use,can_create,"
                        + "can_edit,can_approve,can_export,permission_source,created_at,updated_at)"
                        + " VALUES (?,?,'approvals',1,1,0,0,1,0,'manual_override',?,?)",
                "ump_ap_" + userId, userId, now, now);
    }

    private void seedStage(int stageNo, String name, String allowedRoleCodes, int active, int sortOrder, Instant now) {
        jdbc.update("INSERT INTO approval_stage_catalog (id,stage_no,name,allowed_role_codes,approval_mode,sla_hours,"
                        + "auto_approve_on_submit,active,sort_order,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                "stg_" + stageNo, stageNo, name, allowedRoleCodes, "single", 8, 0, active, sortOrder, now, now);
    }

    private void seedTopology() throws Exception {
        Instant now = Instant.now();
        jdbc.update("INSERT INTO projects (id,code,name,status,created_at,updated_at) VALUES (?,?,?,'active',?,?)",
                "p_1", "PRJ-DEMO-01", "Dự án demo", now, now);
        jdbc.update("INSERT INTO materials (id,code,name,unit,`system`,active,created_at,updated_at) VALUES (?,?,?,?,?,1,?,?)",
                "m_1", "M001", "Vật tư A", "cái", "DIEN", now, now);

        seedStage(1, "Chỉ huy trưởng", "commander,engineer,admin", 0, 10, now);   // TẮT — như LIVE
        seedStage(2, "Thư ký dự án", "thuky,director,admin", 1, 20, now);
        seedStage(3, "Phòng Dự án", "project,da_nv,admin", 1, 30, now);
        seedStage(4, "Phòng Kế hoạch", "procurement,kh_nv", 1, 40, now);
        seedStage(5, "Giám đốc", "director,giamdoc,admin", 1, 50, now);

        String hash = TestActors.passwordHash(TestActors.PASSWORD);
        seedUser("u_req", "ketoan.demo", "Kế toán Demo", "accountant", hash, now);
        seedUser("u_thuky", "thukydemo", "Thư ký Demo", "thuky", hash, now);
        // ⚠️ PHẢI có owner cho **MỌI bước active** — lập phiếu sẽ dựng `approvals` cho từng bước;
        // thiếu owner ⇒ `create_request` trả 400 (đúng loại lỗi BLK-01 đã gặp ở LIVE).
        seedUser("u_da", "nvdademo", "NV Dự án Demo", "da_nv", hash, now);
        seedUser("u_kh", "nvkhdemo", "NV Kế hoạch Demo", "kh_nv", hash, now);
        seedUser("u_gd", "giamdoc.demo", "Giám đốc Demo", "giamdoc", hash, now);

        jdbc.update("INSERT INTO approval_project_assignments (id,project_id,stage,owner_user_id,active,created_at,updated_at)"
                + " VALUES ('apa_2','p_1',2,'u_thuky',1,?,?)", now, now);
        jdbc.update("INSERT INTO approval_project_assignments (id,project_id,stage,owner_user_id,active,created_at,updated_at)"
                + " VALUES ('apa_3','p_1',3,'u_da',1,?,?)", now, now);
        jdbc.update("INSERT INTO approval_project_assignments (id,project_id,stage,owner_user_id,active,created_at,updated_at)"
                + " VALUES ('apa_4','p_1',4,'u_kh',1,?,?)", now, now);
        jdbc.update("INSERT INTO approval_project_assignments (id,project_id,stage,owner_user_id,active,created_at,updated_at)"
                + " VALUES ('apa_5','p_1',5,'u_gd',1,?,?)", now, now);

        jdbc.update("INSERT INTO module_catalog (module_key,label,icon,active,sort_order,created_at,updated_at)"
                + " SELECT 'approvals','Trung tâm phê duyệt','X',1,30,?,? WHERE NOT EXISTS"
                + " (SELECT 1 FROM module_catalog WHERE module_key='approvals')", now, now);
        Integer modules = jdbc.queryForObject("SELECT COUNT(*) FROM module_catalog WHERE module_key='requests'", Integer.class);
        if (modules == null || modules == 0) {
            jdbc.update("INSERT INTO module_catalog (module_key,label,icon,active,sort_order,created_at,updated_at)"
                    + " VALUES ('requests','Phiếu đề nghị mua hàng','X',1,10,?,?)", now, now);
        }
        jdbc.update("INSERT INTO user_module_permissions (id,user_id,module_key,can_view,can_use,can_create,"
                        + "can_edit,can_approve,can_export,permission_source,created_at,updated_at)"
                        + " VALUES ('ump_req','u_req','requests',1,1,1,1,0,0,'manual_override',?,?)", now, now);

        requesterCookie = TestActors.login(mockMvc, "ketoan.demo");
        stageCookies.put(2, TestActors.login(mockMvc, "thukydemo"));
        stageCookies.put(3, TestActors.login(mockMvc, "nvdademo"));
        stageCookies.put(4, TestActors.login(mockMvc, "nvkhdemo"));
        stageCookies.put(5, TestActors.login(mockMvc, "giamdoc.demo"));
    }

    private String createRequest() throws Exception {
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"action":"create_request","projectId":"p_1","neededAt":"2026-09-15","area":"Tầng 1",
                                 "lines":[{"materialId":"m_1","quantity":10,"unitPrice":350000,
                                           "itemType":"outside_contract","note":"MT2 §4.4"}]}""")
                        .cookie(requesterCookie))
                .andExpect(status().isOk());
        return jdbc.queryForObject("SELECT id FROM material_requests ORDER BY created_at DESC LIMIT 1", String.class);
    }

    /** Ép `due_at` của bước 2 về QUÁ KHỨ (hoặc TƯƠNG LAI) để dựng đúng ca kiểm thử. */
    private void setDueAt(String requestId, int stage, Instant dueAt) {
        jdbc.update("UPDATE approvals SET due_at=? WHERE request_id=? AND stage=?",
                Timestamp.from(dueAt), requestId, stage);
    }

    private org.springframework.test.web.servlet.ResultActions decide(String requestId, int stage, String comment)
            throws Exception {
        return mockMvc.perform(post("/api/system")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"action\":\"decide_approval\",\"requestId\":\"" + requestId + "\",\"stage\":" + stage
                        + ",\"decision\":\"approved\",\"comment\":\"" + comment + "\"}")
                .cookie(stageCookies.get(stage)));
    }

    @Test
    void quaHan_thieuLyDo_thiChan_quaHan_coLyDo_thiChoVa_LuuVet() throws Exception {
        setupAdmin();
        seedTopology();
        String requestId = createRequest();
        Assertions.assertEquals("2", jdbc.queryForObject(
                "SELECT approval_stage FROM material_requests WHERE id=?", String.class, requestId),
                "phiếu mới phải ở bước 2 (bước 1 TẮT như LIVE)");

        // ── CA 3 (đối chứng): CHƯA quá hạn + lý do rỗng ⇒ PHẢI CHO QUA (⛔ không chặn oan) ────────────
        setDueAt(requestId, 2, Instant.now().plus(6, ChronoUnit.HOURS));
        decide(requestId, 2, "").andExpect(status().isOk());
        Assertions.assertEquals("3", jdbc.queryForObject(
                "SELECT approval_stage FROM material_requests WHERE id=?", String.class, requestId),
                "chưa quá hạn thì duyệt phải CHUYỂN BƯỚC bình thường");

        // ── CA 2: QUÁ hạn + lý do RỖNG ⇒ PHẢI CHẶN 400 + ĐÚNG THÔNG ĐIỆP ──────────────────────────────
        setDueAt(requestId, 3, Instant.now().minus(2, ChronoUnit.HOURS));   // quá hạn 2 giờ
        decide(requestId, 3, "")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("QUÁ HẠN SLA")))
                .andExpect(jsonPath("$.error", containsString("Bắt buộc nhập lý do")));
        Assertions.assertEquals("3", jdbc.queryForObject(
                "SELECT approval_stage FROM material_requests WHERE id=?", String.class, requestId),
                "bị chặn thì hồ sơ PHẢI còn nguyên ở bước 3 (⛔ không chuyển bước)");
        Assertions.assertNull(jdbc.queryForObject(
                "SELECT overdue_reason FROM approvals WHERE request_id=? AND stage=3", String.class, requestId),
                "bị chặn thì ⛔ KHÔNG được ghi lý do");

        // ── CA 1: QUÁ hạn + CÓ lý do ⇒ CHO QUA và LƯU VẾT lý do (MT2 §4.4) ────────────────────────────
        decide(requestId, 3, "Nhà cung cấp gửi báo giá muộn 2 giờ")
                .andExpect(status().isOk());
        Assertions.assertEquals("4", jdbc.queryForObject(
                "SELECT approval_stage FROM material_requests WHERE id=?", String.class, requestId),
                "quá hạn NHƯNG có lý do thì PHẢI cho duyệt và chuyển bước");
        Assertions.assertEquals("Nhà cung cấp gửi báo giá muộn 2 giờ", jdbc.queryForObject(
                "SELECT overdue_reason FROM approvals WHERE request_id=? AND stage=3", String.class, requestId),
                "lý do quá hạn PHẢI được lưu vết vào approvals.overdue_reason");
    }

    /**
     * MT2 §4.4 (phần sau) — <b>“Total overdue”: ĐẾM số bước quá hạn + PHÒNG BAN + THỜI LƯỢNG.</b>
     *
     * <p>Khẳng định payload bootstrap (`GET /api/system`) có `approvalOverdue`:
     * <pre>{@code {"total":N,"byDepartment":[{"department":…,"total":…,"avgOverdueMinutes":…,"maxOverdueMinutes":…}]}}</pre>
     *
     * <p>3 mốc: ① bình thường ⇒ {@code total=0} ② ép `due_at` về QUÁ KHỨ ⇒ {@code total=1}
     * ③ sau khi DUYỆT xong bước đó ⇒ trở lại {@code total=0} (⛔ không đếm bước ĐÃ có quyết định).
     */
    @Test
    void tongHopQuaHanDuyet_demDungVaBoBuocDaQuyetDinh() throws Exception {
        setupAdmin();
        seedTopology();
        // ⚠️ MT2-P4-02 (phần 2): vùng duyệt (gồm `approvalOverdue`) nay chỉ trả cho
        // **QUẢN TRỊ HỆ THỐNG** hoặc **«≥ trưởng phòng»** (`system_level_catalog.level_rank >= 30`).
        // Nhân vật của ca này là `ketoan.demo` ⇒ ⛔ không thuộc 2 nhóm trên ⇒ `approvalOverdue` bị `blank`.
        // ⇒ Sửa ĐÚNG: gán CẤP ≥ trưởng phòng cho **nhân vật test** (⛔ KHÔNG hạ ngưỡng 30,
        //    ⛔ KHÔNG bỏ điều kiện P4-02 — làm vậy là “game” cổng kiểm).
        jdbc.update("UPDATE users SET system_level_code='truong_phong' WHERE username='ketoan.demo'");
        // ⚠️⚠️ MT2-P4-02 (sửa lần 2) — **H2 CÓ bảng `system_level_catalog` NHƯNG ⛔ KHÔNG CÓ DÒNG NÀO**
        // (`schema-h2.sql:2189` chỉ tạo bảng, ⛔ không seed) ⇒ JOIN `l.code = u.system_level_code`
        // ⛔ không khớp ⇒ `level_rank` = **NULL** ⇒ vẫn bị `blank` dù đã gán `system_level_code`.
        // ⇒ PHẢI **TỰ SEED** danh mục (đúng bài học MT2-P3-04: «H2 ⛔ không tự có danh mục MySQL»).
        // Idempotent bằng `WHERE NOT EXISTS` (⛔ không phá UNIQUE(`code`)).
        java.time.Instant nowSeed = java.time.Instant.now();
        jdbc.update("INSERT INTO system_level_catalog (id,code,name,description,level_rank,auto_grant_all,"
                + "can_skip_levels,active,sort_order,created_at,updated_at) "
                + "SELECT 'LVL-TP-TEST','truong_phong','Trưởng phòng','seed cho test MT2-P4-02',30,0,0,1,30,?,? "
                + "WHERE NOT EXISTS (SELECT 1 FROM system_level_catalog WHERE code='truong_phong')",
                nowSeed, nowSeed);
        String requestId = createRequest();

        // ① Chưa quá hạn (create_request đặt due_at = now + 8h) ⇒ ĐẾM 0
        String bootstrapDau = bootstrapBody();
        Assertions.assertTrue(bootstrapDau.contains("\"approvalOverdue\":{\"total\":0,"),
                "chưa quá hạn thì total PHẢI = 0. body=" + snippet(bootstrapDau));

        // ② Ép hạn bước 2 về QUÁ KHỨ 2 giờ ⇒ ĐẾM 1 + có nhóm theo PHÒNG BAN + thời lượng
        setDueAt(requestId, 2, Instant.now().minus(2, ChronoUnit.HOURS));
        String bootstrapQuaHan = bootstrapBody();
        Assertions.assertTrue(bootstrapQuaHan.contains("\"approvalOverdue\":{\"total\":1,"),
                "quá hạn 1 bước thì total PHẢI = 1. body=" + snippet(bootstrapQuaHan));
        Assertions.assertTrue(bootstrapQuaHan.contains("\"byDepartment\":["),
                "PHẢI có tổng hợp theo PHÒNG BAN (MT2 §4.4). body=" + snippet(bootstrapQuaHan));
        Assertions.assertTrue(bootstrapQuaHan.contains("\"maxOverdueMinutes\":"),
                "PHẢI có THỜI LƯỢNG quá hạn (MT2 §4.4). body=" + snippet(bootstrapQuaHan));
        Assertions.assertFalse(bootstrapQuaHan.contains("\"maxOverdueMinutes\":0,"),
                "đã quá hạn 2 giờ thì thời lượng lớn nhất KHÔNG thể = 0. body=" + snippet(bootstrapQuaHan));

        // ══════════════════════════════════════════════════════════════════════════════════════════════
        // MT2-P4-02 (PHẦN 2) — **CHIỀU NGƯỢC**: HẠ CẤP chính user này xuống `nhan_vien` (`level_rank`=10)
        // ⇒ vùng duyệt PHẢI bị `blank` (`approvalOverdue` thành **mảng rỗng `[]`** — đo từ `blank()` :1984).
        // ⚠️ Dùng **CHÍNH user + CHÍNH dữ liệu** ⇒ cô lập hoàn hảo **BIẾN CẤP BẬC** (⛔ không cần fixture mới ✗).
        // ⛔ CHỈ sửa TEST — ⛔ KHÔNG hạ ngưỡng 30, ⛔ KHÔNG bỏ điều kiện P4-02 ✗.
        // ══════════════════════════════════════════════════════════════════════════════════════════════
        jdbc.update("INSERT INTO system_level_catalog (id,code,name,description,level_rank,auto_grant_all,"
                + "can_skip_levels,active,sort_order,created_at,updated_at) "
                + "SELECT 'LVL-NV-TEST','nhan_vien','Nhân viên','seed cho test MT2-P4-02',10,0,0,1,10,?,? "
                + "WHERE NOT EXISTS (SELECT 1 FROM system_level_catalog WHERE code='nhan_vien')",
                nowSeed, nowSeed);
        jdbc.update("UPDATE users SET system_level_code='nhan_vien' WHERE username='ketoan.demo'");
        String bootstrapCapThap = bootstrapBody();
        Assertions.assertTrue(bootstrapCapThap.contains("\"approvalOverdue\":[]"),
                "MT2-P4-02: user cấp THẤP (level_rank=10) ⛔ KHÔNG được thấy vùng duyệt — phải bị `blank`. body="
                        + snippet(bootstrapCapThap));
        // Khôi phục cấp để các bước sau (③ quyết định) không bị ảnh hưởng.
        jdbc.update("UPDATE users SET system_level_code='truong_phong' WHERE username='ketoan.demo'");

        // ③ Duyệt xong (có lý do) ⇒ bước đó KHÔNG còn bị đếm (đã có quyết định)
        decide(requestId, 2, "Duyệt muộn do họp đột xuất").andExpect(status().isOk());
        String bootstrapSau = bootstrapBody();
        Assertions.assertTrue(bootstrapSau.contains("\"approvalOverdue\":{\"total\":0,"),
                "bước ĐÃ quyết định thì KHÔNG được đếm là quá hạn. body=" + snippet(bootstrapSau));
    }

    private String bootstrapBody() throws Exception {
        return mockMvc.perform(get("/api/system").cookie(requesterCookie))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
    }

    private static String snippet(String body) {
        int at = body.indexOf("approvalOverdue");
        return at < 0 ? "(KHÔNG có approvalOverdue trong payload!)" : body.substring(at, Math.min(body.length(), at + 260));
    }
}
