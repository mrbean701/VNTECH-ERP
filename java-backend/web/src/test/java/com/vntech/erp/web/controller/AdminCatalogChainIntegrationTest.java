package com.vntech.erp.web.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
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
 * Integration test nhóm ADMIN/CATALOG/OPS cuối (Phase 2/10):
 *   material (save → uom → external code → category → subcategory → set_status) →
 *   approval_stage (save → status) → project_team → mar_approval → work_item →
 *   preview_request_import → save_email_settings (tắt) → factory_reset_preview.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class AdminCatalogChainIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbc;

    private final ObjectMapper om = new ObjectMapper();
    private jakarta.servlet.http.Cookie adminCookie;
    private String adminId;

    private MvcResult postAction(String json, int expectStatus) throws Exception {
        var req = post("/api/system").contentType(MediaType.APPLICATION_JSON).content(json);
        if (adminCookie != null) req.cookie(adminCookie);
        var res = mockMvc.perform(req);
        res.andExpect(status().is(expectStatus));
        var q = res.andReturn();
        if (expectStatus == 200) {
            String body = q.getResponse().getContentAsString();
            assertTrue(body.contains("\"ok\":true"), "action phải ok:true — " + abbrev(body));
        }
        return q;
    }

    private String action(String name, String fields) {
        return "{\"action\":\"" + name + "\"" + (fields.isEmpty() ? "" : "," + fields) + "}";
    }

    private static String abbrev(String s) {
        return s.length() > 240 ? s.substring(0, 240) + "…" : s;
    }

    private void seed() throws Exception {
        MvcResult setup = postAction(action("setup",
                "\"companyName\":\"Công ty VNTECH\",\"fullName\":\"Quản trị viên\",\"username\":\"admin\",\"password\":\"VnTech@123\""), 201);
        adminCookie = setup.getResponse().getCookie("mep_session");
        adminId = jdbc.queryForObject("SELECT id FROM users WHERE username='admin'", String.class);
        Instant now = Instant.now();
        jdbc.update("INSERT INTO projects (id,code,name,status,manager_user_id,created_at,updated_at) VALUES (?,?,?,'active',?,?,?)",
                "p_adm", "PRJ-ADM", "Dự án Admin", adminId, now, now);
        jdbc.update("INSERT INTO project_contracts (id,project_id,contract_no,contract_name,contract_type,status,is_primary,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)",
                "pc_adm", "p_adm", "HD-ADM", "HĐ ADM", "main", "active", 1, now, now);
        jdbc.update("INSERT INTO materials (id,code,name,unit,`system`,active,created_at,updated_at) VALUES (?,?,?,?,?,1,?,?)",
                "m_adm_seed", "M-ADM-SEED", "Vật tư thử", "cái", "DIEN", now, now);
        jdbc.update("INSERT INTO boq_versions (id,project_id,contract_id,version_no,version_code,version_name,revision_type,status,active,effective_at,created_at,updated_at) VALUES (?,?,?,1,'V1','BOQ V1','original','active',1,?,?,?)",
                "bv_adm", "p_adm", "pc_adm", now, now, now);
        jdbc.update("INSERT INTO project_boq_items (id,project_id,contract_id,boq_version_id,line_no,source_order,contract_line_ref,row_role,boq_code,item_type,material_id,description,contract_qty,remeasured_qty,unit_price,active,created_at,updated_at) VALUES (?,?,?,?,1,1,'A-1','material','BQ-A','contract',?,?,10,10,0,1,?,?)",
                "pboq_adm", "p_adm", "pc_adm", "bv_adm", "m_adm_seed", "Vật tư thử", now, now);
        jdbc.update("INSERT INTO warehouses (id,code,name,type,project_id,parent_warehouse_id,active,created_at,updated_at) VALUES (?,?,?,'site',?,'WH-CENTRAL',1,?,?)",
                "wh_adm", "KHO-ADM", "Kho ADM", "p_adm", now, now);
        // [TASK-115] `role_catalog` là DỮ LIỆU THAM CHIẾU có sẵn trên MySQL thật nhưng H2 test KHÔNG nạp seed
        // tham chiếu ⇒ `OpsTaskManagementUseCase` kiểm `store.activeRoleCodes()` (role_catalog WHERE active=1)
        // và `save_approval_stage` dưới đây trả 400 «Vai trò engineer không tồn tại hoặc đang bị ẩn.».
        // Ca này dùng đúng 2 mã vai trò 'engineer' và 'admin' (xem postAction save_approval_stage).
        for (String[] role : new String[][]{
                {"engineer", "Kỹ sư giám sát", "engineer"},
                {"admin", "Quản trị viên", "admin"}}) {
            jdbc.update("INSERT INTO role_catalog (id,code,name,base_role,active,sort_order,system_locked,"
                            + "created_at,updated_at) VALUES (?,?,?,?,1,10,1,?,?)",
                    "rc_" + role[0], role[0], role[1], role[2], now, now);
        }
    }

    @Test
    void adminCatalogChain() throws Exception {
        seed();
        String projectId = "p_adm";
        // ---- material catalog ----
        postAction(action("save_material_category", "\"code\":\"VL\",\"name\":\"Vật liệu\""), 200);
        String catId = jdbc.queryForObject("SELECT id FROM material_categories WHERE code='VL'", String.class);
        postAction(action("save_material_subcategory", "\"categoryId\":\"" + catId
                + "\",\"code\":\"VL-NHUA\",\"name\":\"Nhựa\""), 200);
        postAction(action("save_material",
                "\"code\":\"M-ADM\",\"name\":\"Vật tư Admin\",\"unit\":\"cái\",\"system\":\"DIEN\",\"categoryId\":\""
                        + catId + "\",\"standardPrice\":10000"), 200);
        String matId = jdbc.queryForObject("SELECT id FROM materials WHERE code='M-ADM'", String.class);
        postAction(action("save_material_uom_conversion",
                "\"materialId\":\"" + matId + "\",\"fromUom\":\"cái\",\"toUom\":\"hộp\",\"factor\":12"), 200);
        postAction(action("save_material_external_code",
                "\"materialId\":\"" + matId + "\",\"codeType\":\"SUPPLIER\",\"ownerKey\":\"NCC-1\",\"externalCode\":\"SP-ADM\""), 200);
        postAction(action("set_material_status", "\"materialId\":\"" + matId + "\",\"active\":true"), 200);
        // ---- approval stage + team + MAR + work item ----
        postAction(action("save_approval_stage",
                "\"code\":\"HT\",\"name\":\"Hội đồng kỹ thuật\",\"stageNo\":101,\"allowedRoleCodes\":\"engineer,admin\""), 200);
        postAction(action("create_project_team",
                "\"projectId\":\"" + projectId + "\",\"code\":\"TD-ADM\",\"name\":\"Tổ ADM\",\"trade\":\"installation\""), 200);
        // create_project_team phải tự sinh kho tổ đội (teams.warehouse_id NOT NULL) như JS.
        String teamWh = jdbc.queryForObject("SELECT warehouse_id FROM teams WHERE code=?",
                String.class, "PRJ-ADM-TD-ADM");
        assertEquals("team", jdbc.queryForObject("SELECT type FROM warehouses WHERE id=?", String.class, teamWh));
        assertEquals(projectId, jdbc.queryForObject("SELECT project_id FROM warehouses WHERE id=?", String.class, teamWh));
        postAction(action("save_mar_approval",
                "\"projectId\":\"" + projectId + "\",\"materialId\":\"" + matId + "\",\"status\":\"approved\",\"approvalNo\":\"MAR-01\""), 200);
        postAction(action("create_work_item",
                "\"departmentCode\":\"DA\",\"title\":\"Nhiệm vụ admin\",\"projectId\":\"" + projectId
                        + "\",\"assignedTo\":\"" + adminId + "\""), 200);
        // ---- preview_request_import (cần BOQ có material) ----
        MvcResult prev = postAction(action("preview_request_import",
                "\"projectId\":\"" + projectId + "\",\"contractId\":\"pc_adm\",\"boqVersionId\":\"bv_adm\","
                        + "\"lines\":[{\"materialName\":\"Vật tư thử\",\"unit\":\"cái\",\"quantity\":3}]"), 200);
        String prevBody = prev.getResponse().getContentAsString();
        assertTrue(prevBody.contains("\"lines\""), "preview phải trả lines — " + abbrev(prevBody));
        // ---- settings ----
        postAction(action("save_email_settings",
                "\"enabled\":false,\"poSlaHours\":24,\"bchConfirmationSlaHours\":8"), 200);
        postAction(action("factory_reset_preview", ""), 200);
        // ---- delete guards ----
        jdbc.update("INSERT INTO material_request_items (id,request_id,material_id,line_no,requested_qty,created_at,updated_at) VALUES (?,?,?,1,?,?,?)",
                "mri_adm", "mr_adm", matId, 1, Instant.now(), Instant.now());
        jdbc.update("INSERT INTO material_requests (id,request_no,project_id,requested_by,requested_at,needed_at,area,status,created_at,updated_at) VALUES ('mr_adm','DNMH-ADM-2026-1','" + projectId + "','" + adminId + "',?,?,'SITE','approved',?,?)",
                Instant.now(), Instant.now(), Instant.now(), Instant.now());
        MvcResult del = mockMvc.perform(post("/api/system").contentType(MediaType.APPLICATION_JSON)
                        .cookie(adminCookie).content(action("delete_material", "\"materialId\":\"" + matId + "\"")))
                .andExpect(status().is(400)).andReturn();
        String delBody = del.getResponse().getContentAsString();
        assertTrue(delBody.contains("liên kết") || delBody.contains("đề nghị"), "xóa vật tư có nghiệp vụ phải chặn — " + abbrev(delBody));
    }
}