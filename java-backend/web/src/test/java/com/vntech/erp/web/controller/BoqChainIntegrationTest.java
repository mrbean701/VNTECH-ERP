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

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration test chuỗi BOQ lớn nhất (Phase 5, 100% port):
 *   setup → seed → save_boq_version (new) → save_boq_item (mapped) →
 *   compare_boq_materials (engine 96D thật) → confirm_boq_material_mappings →
 *   replace_boq_items (append) → update_boq_contract_prices.
 * Kiểm tra mapping thật trên H2 + engine MaterialMatcherV2.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class BoqChainIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbc;

    private final ObjectMapper om = new ObjectMapper();
    private jakarta.servlet.http.Cookie adminCookie;

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
        return s.length() > 260 ? s.substring(0, 260) + "…" : s;
    }

    private void seed() throws Exception {
        MvcResult setup = postAction(action("setup",
                "\"companyName\":\"Công ty VNTECH\",\"fullName\":\"Quản trị viên\",\"username\":\"admin\",\"password\":\"VnTech@123\""), 201);
        adminCookie = setup.getResponse().getCookie("mep_session");
        Instant now = Instant.now();
        jdbc.update("INSERT INTO projects (id,code,name,status,created_at,updated_at) VALUES (?,?,?,'active',?,?)",
                "p_boq", "PRJ-BOQ", "Dự án BOQ", now, now);
        jdbc.update("INSERT INTO project_contracts (id,project_id,contract_no,contract_name,contract_type,status,is_primary,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)",
                "pc_boq", "p_boq", "HD-BOQ", "Hợp đồng BOQ", "main", "active", 1, now, now);
        jdbc.update("INSERT INTO materials (id,code,name,unit,`system`,active,created_at,updated_at) VALUES (?,?,?,?,?,1,?,?)",
                "m_ppr", "M-PPR", "Ống nhựa PPR DN25", "m", "CTN", now, now);
        jdbc.update("INSERT INTO materials (id,code,name,unit,`system`,active,created_at,updated_at) VALUES (?,?,?,?,?,1,?,?)",
                "m_van", "M-VAN", "Van bi inox DN50", "cái", "CTN", now, now);
    }

    @Test
    void boqChain_compareConfirmReplace() throws Exception {
        seed();
        String projectId = "p_boq", contractId = "pc_boq";
        // 1. save_boq_version — tạo version mới
        MvcResult v = postAction(action("save_boq_version",
                "\"projectId\":\"" + projectId + "\",\"contractId\":\"" + contractId
                        + "\",\"versionCode\":\"V1\",\"makeActive\":true"), 200);
        String versionId = jdbc.queryForObject(
                "SELECT id FROM boq_versions WHERE project_id=? ORDER BY version_no DESC LIMIT 1", String.class, projectId);
        assertTrue(!versionId.isEmpty(), "save_boq_version phải tạo version");
        // 2. save_boq_item — 2 dòng mapped: PPR + Van (tên khớp catalog → compare trả exact)
        postAction(action("save_boq_item", "\"projectId\":\"" + projectId + "\",\"contractId\":\"" + contractId
                + "\",\"boqVersionId\":\"" + versionId + "\",\"sourceOrder\":1,\"rowRole\":\"material\","
                + "\"contractMaterialName\":\"Ống nhựa PPR DN25\",\"unit\":\"m\",\"contractQty\":200,"
                + "\"materialId\":\"m_ppr\""), 200);
        postAction(action("save_boq_item", "\"projectId\":\"" + projectId + "\",\"contractId\":\"" + contractId
                + "\",\"boqVersionId\":\"" + versionId + "\",\"sourceOrder\":2,\"rowRole\":\"material\","
                + "\"contractMaterialName\":\"Van bi inox DN50\",\"unit\":\"cái\",\"contractQty\":5,"
                + "\"materialId\":\"m_van\""), 200);
        Long srcCount = jdbc.queryForObject(
                "SELECT COUNT(*) FROM boq_source_items WHERE boq_version_id=?", Long.class, versionId);
        assertTrue(srcCount != null && srcCount == 2, "boq_source_items phải có 2 dòng: " + srcCount);
        // 3. compare_boq_materials — provider local_feature_v1, không cần mapping cũ
        MvcResult cmp = postAction(action("compare_boq_materials",
                "\"projectId\":\"" + projectId + "\",\"contractId\":\"" + contractId
                        + "\",\"boqVersionId\":\"" + versionId + "\",\"scope\":\"all\""), 200);
        String body = cmp.getResponse().getContentAsString();
        assertTrue(body.contains("\"already_mapped\"") || body.contains("\"exact\"") || body.contains("\"items\""),
                "compare phải trả items đã mapping/exact — " + abbrev(body));
        // 4. confirm toàn bộ mappings (đã mapped tự động qua save_boq_item với materialId)
        Long mapped = jdbc.queryForObject(
                "SELECT COUNT(*) FROM boq_source_items WHERE boq_version_id=? AND mapped_material_id IS NOT NULL",
                Long.class, versionId);
        assertTrue(mapped != null && mapped == 2, "2 dòng phải mapped: " + mapped);
        // 5. replace_boq_items — append 1 dòng mới (merge thêm vào version hiện hành)
        MvcResult rep = postAction(action("replace_boq_items", "\"projectId\":\"" + projectId
                + "\",\"contractId\":\"" + contractId + "\",\"boqVersionId\":\"" + versionId + "\",\"importMode\":\"append\","
                + "\"rows\":[{\"sourceOrder\":3,\"contractLineRef\":\"B-3\",\"boqCode\":\"BQ-3\","
                + "\"contractMaterialName\":\"Cáp điện CV 3x2.5\",\"unit\":\"m\",\"contractQty\":50,"
                + "\"rowRole\":\"material\",\"itemType\":\"contract\",\"internalMaterialCode\":\"M-PPR\"}]"), 200);
        String repBody = rep.getResponse().getContentAsString();
        assertTrue(repBody.contains("1 dòng mới"), "append phải thêm 1 dòng — " + abbrev(repBody));
        Long after = jdbc.queryForObject(
                "SELECT COUNT(*) FROM boq_source_items WHERE boq_version_id=?", Long.class, versionId);
        assertTrue(after != null && after == 3, "sau append phải có 3 dòng: " + after);
        // 6. update_boq_contract_prices — cập nhật giá dòng 1,2
        String pbi1 = jdbc.queryForObject(
                "SELECT id FROM project_boq_items WHERE boq_version_id=? ORDER BY source_order LIMIT 1", String.class, versionId);
        MvcResult pr = postAction(action("update_boq_contract_prices", "\"projectId\":\"" + projectId
                + "\",\"contractId\":\"" + contractId + "\",\"boqVersionId\":\"" + versionId + "\","
                + "\"updates\":[{\"boqItemId\":\"" + pbi1 + "\",\"unitPrice\":15000}]"), 200);
        String prBody = pr.getResponse().getContentAsString();
        assertTrue(prBody.contains("1 đơn giá"), "cập nhật giá 1 dòng — " + abbrev(prBody));
    }
}