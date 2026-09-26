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
import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration test Phase 3 — luồng nghiệp vụ: tạo MR (create_request) → duyệt bước 1 (decide_approval) → sang bước 2,
 * trên stack Java + H2 (seed trực tiếp master data qua JdbcTemplate).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class RequestApprovalIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbc;

    private jakarta.servlet.http.Cookie adminCookie;
    private jakarta.servlet.http.Cookie requesterCookie;

    private void setupAdmin() throws Exception {
        MvcResult setup = mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"action":"setup","companyName":"Công ty VNTECH","fullName":"Quản trị viên",
                                 "username":"admin","password":"VnTech@123"}"""))
                .andExpect(status().isCreated())
                .andReturn();
        adminCookie = setup.getResponse().getCookie("mep_session");
    }

    /**
     * [TASK-115] NGƯỜI LẬP PHIẾU phải KHÁC NGƯỜI DUYỆT: luật «người tạo đơn KHÔNG tự duyệt» (commit 42f91be)
     * bỏ qua bước mà vai trò của người lập phiếu nằm trong `allowed_role_codes`. Vai trò `kh_nv` KHÔNG có trong
     * danh sách duyệt của bất kỳ bước nào ⇒ luồng vẫn khởi động đúng ở bước 1 và admin (owner của bước) duyệt.
     */
    private void seedRequester() throws Exception {
        TestActors.seedRequester(jdbc, "u_req", "kh.nv01", "Nhân viên Kế hoạch", "kh_nv",
                "Phòng Kế hoạch", "p_1", Instant.now());
        requesterCookie = TestActors.login(mockMvc, "kh.nv01");
    }

    /** Seed dự án + hợp đồng + vật tư + approval stage + workflow assignment (admin làm owner). */
    private void seedBusinessData() {
        Instant now = Instant.now();
        jdbc.update("INSERT INTO projects (id,code,name,status,created_at,updated_at) VALUES (?,?,?,'active',?,?)",
                "p_1", "PRJ-01", "Dự án 1", now, now);
        jdbc.update("INSERT INTO project_contracts (id,project_id,contract_no,contract_name,contract_type,status,is_primary,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)",
                "pc_1", "p_1", "HD-001", "Hợp đồng chính", "main", "active", 1, now, now);
        jdbc.update("INSERT INTO materials (id,code,name,unit,`system`,active,created_at,updated_at) VALUES (?,?,?,?,?,1,?,?)",
                "m_1", "M001", "Vật tư A", "cái", "DIEN", now, now);
        jdbc.update("INSERT INTO approval_stage_catalog (id,stage_no,name,allowed_role_codes,approval_mode,sla_hours,auto_approve_on_submit,active,sort_order,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                "stg_1", 1, "BCH / Chỉ huy trưởng", "engineer,commander,admin", "single", 8, 0, 1, 1, now, now);
        jdbc.update("INSERT INTO approval_stage_catalog (id,stage_no,name,allowed_role_codes,approval_mode,sla_hours,auto_approve_on_submit,active,sort_order,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                "stg_2", 2, "Phòng Dự án", "engineer,commander,project,admin", "single", 8, 0, 1, 2, now, now);
        // owner = admin (user setup)
        String adminId = jdbc.queryForObject("SELECT id FROM users WHERE username='admin'", String.class);
        jdbc.update("INSERT INTO approval_project_assignments (id,project_id,stage,owner_user_id,active,created_at,updated_at) VALUES (?,?,?,?,1,?,?)",
                "apa_1", "p_1", 1, adminId, now, now);
        jdbc.update("INSERT INTO approval_project_assignments (id,project_id,stage,owner_user_id,active,created_at,updated_at) VALUES (?,?,?,?,1,?,?)",
                "apa_2", "p_1", 2, adminId, now, now);
        // kiểm tra seed có hiệu lực
        Integer cnt = jdbc.queryForObject(
                "SELECT COUNT(*) FROM approval_project_assignments WHERE project_id='p_1' AND active=1", Integer.class);
        org.junit.jupiter.api.Assertions.assertEquals(2, cnt, "phải seed 2 assignment active");
        Integer stageCnt = jdbc.queryForObject(
                "SELECT COUNT(*) FROM approval_stage_catalog WHERE active=1", Integer.class);
        org.junit.jupiter.api.Assertions.assertEquals(2, stageCnt, "phải seed 2 approval stage");
        Integer assign1 = jdbc.queryForObject(
                "SELECT COUNT(*) FROM approval_project_assignments WHERE project_id='p_1' AND stage=1 AND active=1", Integer.class);
        org.junit.jupiter.api.Assertions.assertEquals(1, assign1, "phải có assignment stage 1 active");
        String owner = jdbc.queryForObject(
                "SELECT owner_user_id FROM approval_project_assignments WHERE project_id='p_1' AND stage=1", String.class);
        org.junit.jupiter.api.Assertions.assertEquals(adminId, owner, "owner phải là admin");
    }

    @Test
    void requestFlow_createAndApprove() throws Exception {
        setupAdmin();
        seedBusinessData();
        seedRequester();

        // 1. create_request — NGƯỜI LẬP PHIẾU là kh.nv01 (KHÔNG phải admin) — dòng vật tư outside contract + lý do
        MvcResult created = mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"action":"create_request","projectId":"p_1","neededAt":"2026-09-15",
                                 "area":"Tầng 1",
                                 "lines":[{"materialId":"m_1","quantity":10,"unitPrice":50000,
                                           "itemType":"outside_contract","note":"Phát sinh khối lượng ngoài hợp đồng"}]}""")
                        .cookie(requesterCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ok").value(true))
                .andExpect(jsonPath("$.message", containsString("DNMH")))
                .andReturn();
        String message = created.getResponse().getContentAsString();
        String requestId = jdbc.queryForObject(
                "SELECT id FROM material_requests ORDER BY created_at DESC LIMIT 1", String.class);
        // 2. không owner -> lỗi 403
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"action\":\"decide_approval\",\"requestId\":\"" + requestId
                                + "\",\"stage\":1,\"decision\":\"rejected\",\"comment\":\"chưa đủ hồ sơ\"}"))
                .andExpect(status().isUnauthorized());

        // 3. admin (owner bước 1) duyệt -> chuyển bước 2
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"action\":\"decide_approval\",\"requestId\":\"" + requestId
                                + "\",\"stage\":1,\"decision\":\"approved\",\"comment\":\"OK\"}")
                        .cookie(adminCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("chuyển sang Phòng Dự án")));
        String approvalStage = jdbc.queryForObject(
                "SELECT approval_stage FROM material_requests WHERE id=?", String.class, requestId);
        org.junit.jupiter.api.Assertions.assertEquals("2", approvalStage, "MR phải chuyển sang bước 2");

        // 4. duyệt bước 2 -> hoàn tất, chuyển sang awaiting_po
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"action\":\"decide_approval\",\"requestId\":\"" + requestId
                                + "\",\"stage\":2,\"decision\":\"approved\"}")
                        .cookie(adminCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("hoàn tất luồng phê duyệt")));
        String status = jdbc.queryForObject(
                "SELECT status FROM material_requests WHERE id=?", String.class, requestId);
        String supply = jdbc.queryForObject(
                "SELECT supply_status FROM material_requests WHERE id=?", String.class, requestId);
        org.junit.jupiter.api.Assertions.assertEquals("approved", status);
        org.junit.jupiter.api.Assertions.assertEquals("awaiting_po", supply);

        // ══════════════════════════════════════════════════════════════════════════════════════════
        // 5. [TASK-115] KHẲNG ĐỊNH LUẬT «NGƯỜI TẠO ĐƠN KHÔNG TỰ DUYỆT» (commit 42f91be) VẪN NGUYÊN:
        //    phiếu này do CHÍNH admin lập, và `allowed_role_codes` của CẢ HAI bước đều chứa 'admin'
        //    (seed ở `seedBusinessData`) ⇒ mỗi bước bị BỎ QUA kèm vết `creator_role_waived` + comment nêu
        //    rõ lý do; hồ sơ khởi động ngay ở bước cuối và KHÔNG thể `decide_approval` lại bước 1.
        //    (Không sửa `allowed_role_codes` của seed — luật phải được chứng minh bằng chính luật.)
        // ══════════════════════════════════════════════════════════════════════════════════════════
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"action":"create_request","projectId":"p_1","neededAt":"2026-09-16","area":"Tầng 3",
                                 "lines":[{"materialId":"m_1","quantity":1,"unitPrice":1000,
                                           "itemType":"outside_contract","note":"Kiểm chứng luật người tạo"}]}""")
                        .cookie(adminCookie))
                .andExpect(status().isOk());
        String waivedId = jdbc.queryForObject(
                "SELECT id FROM material_requests WHERE id<>? ORDER BY created_at DESC LIMIT 1",
                String.class, requestId);
        String waivedSnapshot = jdbc.queryForObject(
                "SELECT decision_snapshot FROM approvals WHERE request_id=? AND stage=1", String.class, waivedId);
        org.junit.jupiter.api.Assertions.assertTrue(
                waivedSnapshot != null && waivedSnapshot.contains("creator_role_waived"),
                "phải ghi vết creator_role_waived ở bước bị bỏ qua: " + waivedSnapshot);
        String waivedComment = jdbc.queryForObject(
                "SELECT comment FROM approvals WHERE request_id=? AND stage=1", String.class, waivedId);
        org.junit.jupiter.api.Assertions.assertTrue(
                waivedComment != null && waivedComment.contains("Người lập phiếu trùng vai trò duyệt"),
                "comment phải nêu rõ lý do bỏ qua bước: " + waivedComment);
        // Bước đã bị bỏ qua KHÔNG thể duyệt lại ⇒ 400 đúng thông điệp (chứng minh luật có hiệu lực thật).
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"action\":\"decide_approval\",\"requestId\":\"" + waivedId
                                + "\",\"stage\":1,\"decision\":\"approved\"}")
                        .cookie(adminCookie))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Hồ sơ chưa đến bước duyệt này hoặc đã được xử lý."));
    }

    @Test
    void requestFlow_rejectReturnsToRequester() throws Exception {
        setupAdmin();
        seedBusinessData();
        seedRequester();
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"action":"create_request","projectId":"p_1","neededAt":"2026-09-15","area":"Tầng 2",
                                 "lines":[{"materialId":"m_1","quantity":5,"unitPrice":100000,
                                           "itemType":"outside_contract","note":"Phát sinh"}]}""")
                        .cookie(requesterCookie))
                .andExpect(status().isOk());
        String requestId = jdbc.queryForObject(
                "SELECT id FROM material_requests ORDER BY created_at DESC LIMIT 1", String.class);
        // reject bước 1 thiếu lý do -> 400
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"action\":\"decide_approval\",\"requestId\":\"" + requestId
                                + "\",\"stage\":1,\"decision\":\"rejected\"}")
                        .cookie(adminCookie))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Bắt buộc nhập lý do trả lại / từ chối hồ sơ."));
        // reject có lý do -> returned_to_requester
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"action\":\"decide_approval\",\"requestId\":\"" + requestId
                                + "\",\"stage\":1,\"decision\":\"rejected\",\"comment\":\"Thai vật tư sai\"}")
                        .cookie(adminCookie))
                .andExpect(status().isOk());
        String status = jdbc.queryForObject(
                "SELECT status FROM material_requests WHERE id=?", String.class, requestId);
        org.junit.jupiter.api.Assertions.assertEquals("returned_to_requester", status);
    }
}