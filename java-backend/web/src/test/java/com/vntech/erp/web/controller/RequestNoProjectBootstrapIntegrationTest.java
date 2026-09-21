package com.vntech.erp.web.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;
import java.time.Instant;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * TASK-141 · VIỆC 1 — PHIẾU ĐỀ NGHỊ <b>KHÔNG THUỘC DỰ ÁN NÀO</b> phải:
 * <ol>
 *   <li><b>XUẤT HIỆN</b> trong {@code data.requests} của bootstrap {@code GET /api/system}; và</li>
 *   <li><b>MỞ / DUYỆT ĐƯỢC</b> ({@code decide_approval}) — kể cả bởi người duyệt KHÔNG có phạm vi dự án nào.</li>
 * </ol>
 *
 * <p><b>Đo được TRƯỚC bản vá (đỏ):</b> {@code BootstrapDataAdapter} dùng {@code JOIN projects p ON p.id=mr.project_id}
 * + {@code WHERE mr.project_id IN (…)} và {@code RequestStoreAdapter#findRequestForApproval} dùng {@code JOIN projects}
 * ⇒ phiếu có {@code project_id} NULL bị INNER JOIN LOẠI BỎ: biến mất khỏi {@code data.requests} và
 * {@code decide_approval} trả 400 «Không tìm thấy đơn yêu cầu.».
 *
 * <p><b>Fixture:</b> người lập phiếu là nhân viên văn phòng {@code kh_nv} KHÔNG có dòng {@code user_project_scopes}
 * nào; phiếu ghi {@code material_requests.project_id = NULL}; người duyệt bước 2 là {@code kh_truong} cũng KHÔNG có
 * phạm vi dự án ⇒ chứng minh cổng phạm vi dự án không chặn oan người duyệt của phiếu không-dự-án.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class RequestNoProjectBootstrapIntegrationTest {

    private static final ObjectMapper OM = new ObjectMapper();

    /**
     * Tra một khoá JSON KHÔNG phân biệt hoa/thường — H2 (MODE=MySQL, DATABASE_TO_LOWER=TRUE) trả alias
     * SQL ở dạng chữ thường (`projectcode`) còn MySQL thật trả đúng camelCase (`projectCode`).
     */
    private static JsonNode field(JsonNode row, String key) {
        JsonNode direct = row.get(key);
        if (direct != null) return direct;
        java.util.Iterator<String> names = row.fieldNames();
        while (names.hasNext()) {
            String name = names.next();
            if (name.equalsIgnoreCase(key)) return row.get(name);
        }
        return null;
    }

    /** Giá trị chuỗi của khoá; trả `null` khi khoá vắng, NULL hoặc rỗng. */
    private static String blankOrNull(JsonNode row, String key) {
        JsonNode node = field(row, key);
        if (node == null || node.isNull()) return null;
        String text = node.asText();
        return text == null || text.isEmpty() ? null : text;
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbc;

    private Cookie adminCookie;

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

    /** 2 bước duyệt; bước 1 KHÔNG auto-approve ⇒ phiếu nằm CHỜ DUYỆT ở bước 1. */
    private void seedStages() {
        Instant now = Instant.now();
        jdbc.update("INSERT INTO approval_stage_catalog (id,stage_no,name,allowed_role_codes,approval_mode,sla_hours,"
                        + "auto_approve_on_submit,active,sort_order,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                "stg_1", 1, "BCH / Chỉ huy trưởng", "engineer,commander,admin", "single", 8, 0, 1, 1, now, now);
        jdbc.update("INSERT INTO approval_stage_catalog (id,stage_no,name,allowed_role_codes,approval_mode,sla_hours,"
                        + "auto_approve_on_submit,active,sort_order,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                "stg_2", 2, "Thư ký Tổng giám đốc", "engineer,commander,project,admin,kh_truong", "single", 8, 0, 1, 2, now, now);
    }

    /**
     * Tài khoản KHÔNG thuộc dự án nào / KHÔNG thuộc kho nào: KHÔNG có dòng {@code user_project_scopes},
     * KHÔNG có {@code user_warehouse_scopes} — chỉ có quyền module đúng theo {@code ActionRbacRegistry}.
     */
    private void seedUserWithoutAnyScope(String userId, String username, String fullName, String role,
                                         String moduleKey, String capabilityColumn) {
        Instant now = Instant.now();
        Integer modules = jdbc.queryForObject(
                "SELECT COUNT(*) FROM module_catalog WHERE module_key=?", Integer.class, moduleKey);
        if (modules == null || modules == 0) {
            jdbc.update("INSERT INTO module_catalog (module_key,label,icon,active,sort_order,created_at,updated_at)"
                            + " VALUES (?,?,'X',1,10,?,?)",
                    moduleKey, moduleKey, now, now);
        }
        jdbc.update("INSERT INTO users (id,employee_code,full_name,username,password_hash,role,department,"
                        + "approval_limit,active,must_change_password,created_at,updated_at)"
                        + " VALUES (?,?,?,?,?,?,?,0,1,0,?,?)",
                userId, "NV-" + userId, fullName, username, TestActors.passwordHash(TestActors.PASSWORD),
                role, "Phòng Kế hoạch", now, now);
        jdbc.update("INSERT INTO user_module_permissions (id,user_id,module_key,can_view,can_use,can_create,"
                        + "can_edit,can_approve,can_export,permission_source,created_at,updated_at)"
                        + " VALUES (?,?,?,1,1,1,1,1,0,'manual_override',?,?)",
                "ump_" + userId, userId, moduleKey, now, now);
        Integer scopes = jdbc.queryForObject(
                "SELECT COUNT(*) FROM user_project_scopes WHERE user_id=?", Integer.class, userId);
        Assertions.assertEquals(0, scopes, "fixture phải KHÔNG có phạm vi dự án nào: " + userId);
        Assertions.assertEquals(1, (int) jdbc.queryForObject(
                        "SELECT " + capabilityColumn + " FROM user_module_permissions WHERE id=?",
                        Integer.class, "ump_" + userId),
                "phải cấp quyền module " + moduleKey + " cho " + userId);
    }

    private void seedMaterial() {
        Instant now = Instant.now();
        jdbc.update("INSERT INTO materials (id,code,name,unit,`system`,active,created_at,updated_at)"
                + " VALUES (?,?,?,?,?,1,?,?)", "m_1", "M001", "Vật tư A", "cái", "DIEN", now, now);
    }

    @Test
    void requestWithoutProject_appearsInBootstrap_andIsApprovable() throws Exception {
        setupAdmin();
        seedStages();
        seedMaterial();
        // Nhân viên văn phòng: KHÔNG dự án, KHÔNG kho — chỉ có quyền tạo phiếu (module `requests`).
        seedUserWithoutAnyScope("u_office", "vp.nv01", "Nhân viên Văn phòng", "kh_nv", "requests", "can_create");
        // Người duyệt bước 2: cũng KHÔNG dự án, KHÔNG kho — chỉ có quyền duyệt (module `approvals`).
        seedUserWithoutAnyScope("u_secretary", "tk.tgd", "Thư ký Tổng giám đốc", "kh_truong", "approvals", "can_approve");
        Cookie officeCookie = TestActors.login(mockMvc, "vp.nv01");
        Cookie secretaryCookie = TestActors.login(mockMvc, "tk.tgd");

        // ── 1) LẬP PHIẾU — CỐ Ý BỎ TRỐNG dự án / hợp đồng / BOQ / kho ─────────────────────────
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"action":"create_request","projectId":"","contractId":"","boqVersionId":"",
                                 "sourceWarehouseId":"","neededAt":"2026-09-15","area":"Văn phòng công ty",
                                 "priority":"normal","purpose":"Đề nghị không thuộc dự án nào",
                                 "lines":[{"materialId":"m_1","quantity":3,"unitPrice":50000,
                                           "itemType":"outside_contract","note":"Nhân viên văn phòng công ty"}]}""")
                        .cookie(officeCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ok").value(true))
                .andExpect(jsonPath("$.message", containsString("DNMH")));

        String requestId = jdbc.queryForObject(
                "SELECT id FROM material_requests ORDER BY requested_at DESC,id DESC LIMIT 1", String.class);
        String storedProjectId = jdbc.queryForObject(
                "SELECT project_id FROM material_requests WHERE id=?", String.class, requestId);
        Assertions.assertTrue(storedProjectId == null || storedProjectId.isEmpty(),
                "phiếu không-dự-án phải ghi NULL/rỗng vào material_requests.project_id, thực tế: '"
                        + storedProjectId + "'");
        // Ép ĐÚNG nhánh `project_id IS NULL` mà truy vấn bootstrap + findRequestForApproval phải chấp nhận.
        jdbc.update("UPDATE material_requests SET project_id=NULL WHERE id=?", requestId);
        Assertions.assertEquals("pending_approval", jdbc.queryForObject(
                "SELECT status FROM material_requests WHERE id=?", String.class, requestId));

        // Phân công người duyệt: bước 1 = admin, bước 2 = thư ký (KHÔNG có phạm vi dự án nào).
        // Ghi thẳng `approvals.approver_user_id` — ĐÚNG cột mà luồng lập phiếu ghi cho phiếu có dự án
        // (qua `approval_project_assignments`); phiếu không-dự-án KHÔNG thể phân công qua API vì
        // `approval_project_assignments.project_id` là NOT NULL (hạn chế đã ghi trong hồ sơ TASK-141).
        String adminId = jdbc.queryForObject("SELECT id FROM users WHERE username='admin'", String.class);
        jdbc.update("UPDATE approvals SET approver_user_id=? WHERE request_id=? AND stage=1", adminId, requestId);
        jdbc.update("UPDATE approvals SET approver_user_id=? WHERE request_id=? AND stage=2", "u_secretary", requestId);

        // ── 2) BOOTSTRAP: phiếu PHẢI XUẤT HIỆN trong data.requests (trước bản vá: BIẾN MẤT) ────
        MvcResult boot = mockMvc.perform(get("/api/system").cookie(adminCookie))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode data = OM.readTree(boot.getResponse().getContentAsString(StandardCharsets.UTF_8)).path("data");
        JsonNode requests = data.path("requests");
        JsonNode mine = null;
        for (JsonNode row : requests) {
            if (requestId.equals(row.path("id").asText())) mine = row;
        }
        Assertions.assertNotNull(mine,
                "phiếu KHÔNG thuộc dự án phải có trong data.requests — hiện chỉ thấy " + requests.size() + " phiếu");
        String bootProjectId = blankOrNull(mine, "projectId");
        Assertions.assertNull(bootProjectId,
                "projectId của phiếu không-dự-án phải rỗng/NULL, thực tế: '" + bootProjectId + "'");
        // LEFT JOIN projects ⇒ 2 cột này NULL (khoá có thể VẮNG hoặc rỗng tuỳ H2/MySQL — tên khoá
        // trong H2 cũng bị hạ chữ thường, nên tra theo kiểu không phân biệt hoa/thường).
        Assertions.assertNull(blankOrNull(mine, "projectCode"),
                "projectCode của phiếu không-dự-án phải NULL/rỗng — row: " + mine);
        Assertions.assertNull(blankOrNull(mine, "projectName"),
                "projectName của phiếu không-dự-án phải NULL/rỗng — row: " + mine);
        JsonNode stageNode = field(mine, "approvalStage");
        Assertions.assertNotNull(stageNode, "bootstrap phải trả bước duyệt hiện tại — row: " + mine);
        Assertions.assertEquals(1, stageNode.asInt(),
                "phiếu phải nằm ở bước duyệt 1 (chưa auto-approve)");

        // ── 3) MỞ ĐỂ DUYỆT: admin (người được phân công bước 1) duyệt → chuyển bước 2 ─────────
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"action\":\"decide_approval\",\"requestId\":\"" + requestId
                                + "\",\"stage\":1,\"decision\":\"approved\",\"comment\":\"OK bước 1\"}")
                        .cookie(adminCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ok").value(true));
        Assertions.assertEquals(2, jdbc.queryForObject(
                        "SELECT approval_stage FROM material_requests WHERE id=?", Integer.class, requestId),
                "phiếu không-dự-án phải chuyển được sang bước 2");

        // ── 4) NGƯỜI DUYỆT KHÔNG THUỘC DỰ ÁN NÀO duyệt bước 2 → hoàn tất luồng ───────────────
        // (không có dòng `user_project_scopes` nào ⇒ nếu cổng phạm vi dự án còn chặn oan thì 403)
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"action\":\"decide_approval\",\"requestId\":\"" + requestId
                                + "\",\"stage\":2,\"decision\":\"approved\",\"comment\":\"OK bước 2\"}")
                        .cookie(secretaryCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ok").value(true));
        Assertions.assertEquals("approved", jdbc.queryForObject(
                "SELECT status FROM material_requests WHERE id=?", String.class, requestId));
        Assertions.assertEquals("awaiting_po", jdbc.queryForObject(
                "SELECT supply_status FROM material_requests WHERE id=?", String.class, requestId));
    }
}
