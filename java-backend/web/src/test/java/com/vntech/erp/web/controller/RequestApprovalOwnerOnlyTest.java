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

import java.time.Instant;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * TASK-140 (a) — <b>F4: CHỈ owner được PHÂN CÔNG ĐÍCH DANH của đúng bước mới được duyệt.</b>
 *
 * <p>Mô phỏng ĐÚNG topology LIVE {@code PRJ-DEMO-01} (bước 1 {@code active=0} ⇒ phiếu mới sinh ở bước 2):
 * <pre>
 *   bước 2 = thukydemo · bước 3 = nvdademo · bước 4 = nvkhdemo · bước 5 = giamdoc.demo
 * </pre>
 *
 * <p><b>DƯƠNG</b> — 4 owner đúng vai trò của mình đi hết luồng tới "hoàn tất luồng phê duyệt".<br>
 * <b>ÂM</b> — {@code trinhtrench} ({@code base_role=procurement}, CÓ trong {@code allowed_role_codes} bước 4
 * nhưng KHÔNG được phân công) bị chặn NGAY ở cổng quyền; {@code trdademo} bước 5 bị chặn; người lập phiếu
 * tự duyệt bị chặn.
 *
 * <p>Đây chính là lỗ hổng trước TASK-140: nhánh "THEO VAI TRÒ" trong {@code canApproveRequestStage} cho
 * {@code trinhtrench} qua cổng bước 4 ⇒ hồ sơ chuyển bước dù người duyệt KHÔNG được phân công.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class RequestApprovalOwnerOnlyTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbc;

    private Cookie requesterCookie;
    private final java.util.Map<String, Cookie> cookies = new java.util.HashMap<>();

    private void setupAdmin() throws Exception {
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"action":"setup","companyName":"Công ty VNTECH","fullName":"Quản trị viên",
                                 "username":"admin","password":"VnTech@123"}"""))
                .andExpect(status().isCreated());
    }

    /** Tài khoản + phạm vi dự án (approve) + `approvals.canApprove` — KHÔNG seed vai trò vào `allowed_role_codes`. */
    private void seedUser(String userId, String username, String fullName, String role, String hash, Instant now) {
        jdbc.update("INSERT INTO users (id,employee_code,full_name,username,password_hash,role,department,"
                        + "approval_limit,active,must_change_password,created_at,updated_at)"
                        + " VALUES (?,?,?,?,?,?,?,0,1,0,?,?)",
                userId, "NV-" + userId, fullName, username, hash, role, "Phòng " + role, now, now);
        jdbc.update("INSERT INTO user_project_scopes (id,user_id,project_id,permission,created_at,updated_at)"
                + " VALUES (?,?,?,'approve',?,?)", "ups_" + userId, userId, "p_1", now, now);
        // Cổng MODULE (`approvals.canApprove`) phải đi qua được, nhờ vậy mọi ca ÂM dưới đây CHẮC CHẮN
        // đến từ cổng OWNER (canApproveRequestStage) chứ không phải cổng module.
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

    private void seedAssignment(String projectId, int stage, String ownerUserId, String id, Instant now) {
        jdbc.update("INSERT INTO approval_project_assignments (id,project_id,stage,owner_user_id,active,created_at,updated_at)"
                + " VALUES (?,?,?,?,1,?,?)", id, projectId, stage, ownerUserId, now, now);
    }

    /**
     * Topology LIVE: bước 1 TẮT (`active=0` — ⛔ KHÔNG bật lại), owner 4 bước còn lại như `approval_project_assignments`.
     * `allowed_role_codes` giữ NGUYÊN như cấu hình thật (bước 4 chứa `procurement,kh_nv` — nguồn của lỗ hổng cũ).
     */
    private void seedLiveTopology() throws Exception {
        Instant now = Instant.now();
        jdbc.update("INSERT INTO projects (id,code,name,status,created_at,updated_at) VALUES (?,?,?,'active',?,?)",
                "p_1", "PRJ-DEMO-01", "Dự án demo", now, now);
        jdbc.update("INSERT INTO materials (id,code,name,unit,`system`,active,created_at,updated_at) VALUES (?,?,?,?,?,1,?,?)",
                "m_1", "M001", "Vật tư A", "cái", "DIEN", now, now);

        seedStage(1, "Chỉ huy trưởng", "commander,engineer,admin", 0, 10, now);   // TẮT — như LIVE
        seedStage(2, "Thư ký dự án", "thuky,director,admin", 1, 20, now);
        seedStage(3, "Phòng Dự án", "project,da_nv,admin", 1, 30, now);
        seedStage(4, "Phòng Kế hoạch", "procurement,kh_nv", 1, 40, now);         // chứa base_role của trinhtrench
        seedStage(5, "Giám đốc", "director,giamdoc,admin", 1, 50, now);

        String hash = TestActors.passwordHash(TestActors.PASSWORD);   // tính 1 lần, dùng cho mọi tài khoản
        seedUser("u_req", "ketoan.demo", "Kế toán Demo", "accountant", hash, now);
        seedUser("u_thuky", "thukydemo", "Thư ký Demo", "thuky", hash, now);
        seedUser("u_da", "nvdademo", "NV Dự án Demo", "da_nv", hash, now);
        seedUser("u_kh", "nvkhdemo", "NV Kế hoạch Demo", "kh_nv", hash, now);
        seedUser("u_gd", "giamdoc.demo", "Giám đốc Demo", "giamdoc", hash, now);
        seedUser("u_tren", "trinhtrench", "Trịnh Trần Ch", "procurement", hash, now);
        seedUser("u_trda", "trdademo", "Trưởng DA Demo", "da_truong", hash, now);

        // Owner đích danh — nguồn: approval_project_assignments (project_id + stage → owner_user_id)
        seedAssignment("p_1", 2, "u_thuky", "apa_2", now);
        seedAssignment("p_1", 3, "u_da", "apa_3", now);
        seedAssignment("p_1", 4, "u_kh", "apa_4", now);
        seedAssignment("p_1", 5, "u_gd", "apa_5", now);

        // module 'requests' cho người lập phiếu (canCreate) + module 'approvals' (cổng module của decide_approval)
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
        for (String[] u : new String[][]{{"u_thuky", "thukydemo"}, {"u_da", "nvdademo"}, {"u_kh", "nvkhdemo"},
                {"u_gd", "giamdoc.demo"}, {"u_tren", "trinhtrench"}, {"u_trda", "trdademo"}}) {
            cookies.put(u[0], TestActors.login(mockMvc, u[1]));
        }

        org.junit.jupiter.api.Assertions.assertEquals(4, jdbc.queryForObject(
                "SELECT COUNT(*) FROM approval_stage_catalog WHERE active=1", Integer.class), "phải có 4 bước active");
        org.junit.jupiter.api.Assertions.assertEquals(0, jdbc.queryForObject(
                "SELECT COUNT(*) FROM approval_stage_catalog WHERE stage_no=1 AND active=1", Integer.class),
                "bước 1 phải TẮT như LIVE");
        org.junit.jupiter.api.Assertions.assertEquals("procurement", jdbc.queryForObject(
                "SELECT COALESCE(rc.base_role,u.role) FROM users u LEFT JOIN role_catalog rc ON rc.code=u.role"
                        + " WHERE u.username='trinhtrench'", String.class),
                "trinhtrench phải có base_role=procurement (đúng ca lỗi LIVE)");
    }

    private String createRequest() throws Exception {
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"action":"create_request","projectId":"p_1","neededAt":"2026-09-15","area":"Tầng 1",
                                 "lines":[{"materialId":"m_1","quantity":10,"unitPrice":350000,
                                           "itemType":"outside_contract","note":"Phát sinh khối lượng ngoài hợp đồng"}]}""")
                        .cookie(requesterCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("DNMH")));
        return jdbc.queryForObject("SELECT id FROM material_requests ORDER BY created_at DESC LIMIT 1", String.class);
    }

    private String stageOf(String requestId) {
        return jdbc.queryForObject("SELECT approval_stage FROM material_requests WHERE id=?", String.class, requestId);
    }

    private org.springframework.test.web.servlet.ResultActions decide(String requestId, int stage, Cookie cookie,
                                                                     String decision) throws Exception {
        return mockMvc.perform(post("/api/system")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"action\":\"decide_approval\",\"requestId\":\"" + requestId + "\",\"stage\":" + stage
                        + ",\"decision\":\"" + decision + "\",\"comment\":\"TASK-140\"}")
                .cookie(cookie));
    }

    @Test
    void chiOwnerDuocPhanCongMoiDuyetDuoc() throws Exception {
        setupAdmin();
        seedLiveTopology();
        String requestId = createRequest();

        // Phiếu mới sinh ở BƯỚC 2 (bước 1 tắt) và owner bước 2 = thukydemo
        org.junit.jupiter.api.Assertions.assertEquals("2", stageOf(requestId), "phiếu mới phải ở bước 2");
        org.junit.jupiter.api.Assertions.assertEquals("u_thuky", jdbc.queryForObject(
                "SELECT approver_user_id FROM approvals WHERE request_id=? AND stage=2", String.class, requestId));

        // ── DƯƠNG 1: thukydemo (owner bước 2) duyệt ⇒ sang bước 3
        decide(requestId, 2, cookies.get("u_thuky"), "approved")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("chuyển sang")));
        org.junit.jupiter.api.Assertions.assertEquals("3", stageOf(requestId));

        // ── DƯƠNG 2: nvdademo (owner bước 3) duyệt ⇒ sang bước 4
        decide(requestId, 3, cookies.get("u_da"), "approved")
                .andExpect(status().isOk());
        org.junit.jupiter.api.Assertions.assertEquals("4", stageOf(requestId));

        // ── ÂM 1 (ca lỗi LIVE): trinhtrench — base_role='procurement' CÓ trong allowed_role_codes bước 4
        //    nhưng KHÔNG được phân công ⇒ phải bị chặn NGAY ở cổng quyền, hồ sơ KHÔNG đổi bước.
        decide(requestId, 4, cookies.get("u_tren"), "approved")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Owner được phân công")));
        org.junit.jupiter.api.Assertions.assertEquals("4", stageOf(requestId),
                "trinhtrench KHÔNG được làm hồ sơ chuyển bước 4");
        org.junit.jupiter.api.Assertions.assertEquals("pending", jdbc.queryForObject(
                "SELECT status FROM approvals WHERE request_id=? AND stage=4", String.class, requestId),
                "bước 4 vẫn phải pending sau khi bị chặn");

        // ── ÂM 2: NGƯỜI LẬP PHIẾU tự duyệt bước 4 ⇒ chặn
        decide(requestId, 4, requesterCookie, "approved")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Owner được phân công")));
        org.junit.jupiter.api.Assertions.assertEquals("4", stageOf(requestId));

        // ── DƯƠNG 3: nvkhdemo (owner bước 4) duyệt ⇒ sang bước 5
        decide(requestId, 4, cookies.get("u_kh"), "approved")
                .andExpect(status().isOk());
        org.junit.jupiter.api.Assertions.assertEquals("5", stageOf(requestId));

        // ── ÂM 3: trdademo (Trưởng dự án, KHÔNG được phân công bước 5) ⇒ chặn
        decide(requestId, 5, cookies.get("u_trda"), "approved")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Owner được phân công")));
        org.junit.jupiter.api.Assertions.assertEquals("5", stageOf(requestId));

        // ── DƯƠNG 4: giamdoc.demo (owner bước 5) duyệt ⇒ hoàn tất luồng
        decide(requestId, 5, cookies.get("u_gd"), "approved")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("hoàn tất luồng phê duyệt")));
        org.junit.jupiter.api.Assertions.assertEquals("approved", jdbc.queryForObject(
                "SELECT status FROM material_requests WHERE id=?", String.class, requestId));
    }
}
