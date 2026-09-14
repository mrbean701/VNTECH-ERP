package com.vntech.erp.web.controller;

import com.fasterxml.jackson.databind.JsonNode;
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
 * Smoke test CUTOVER — chuỗi nghiệp vụ dài nhất end-to-end trên stack Java + H2 (MODE=MySQL):
 *   setup → login → create_request → duyệt 2 bước → create_po → receive_goods →
 *   confirm_delivery (posting + ledger) → issue_stock → production_report → approve →
 *   capital_recovery → contract_payment.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class SupplyChainEndToEndIntegrationTest {

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
            org.junit.jupiter.api.Assertions.assertTrue(body.contains("\"ok\":true"),
                    "action phải trả ok:true — body: " + abbreviate(body));
        }
        return q;
    }

    private String action(String name, String fields) {
        return "{\"action\":\"" + name + "\"" + (fields.isEmpty() ? "" : "," + fields) + "}";
    }

    private JsonNode jsonOf(MvcResult r) throws Exception {
        return om.readTree(r.getResponse().getContentAsString());
    }

    private static String abbreviate(String s) {
        return s.length() > 300 ? s.substring(0, 300) + "…" : s;
    }

    private void seedBaseData() throws Exception {
        MvcResult setup = postAction(action("setup",
                "\"companyName\":\"Công ty VNTECH\",\"fullName\":\"Quản trị viên\",\"username\":\"admin\",\"password\":\"VnTech@123\""), 201);
        adminCookie = setup.getResponse().getCookie("mep_session");
        adminId = jdbc.queryForObject("SELECT id FROM users WHERE username='admin'", String.class);
        Instant now = Instant.now();
        jdbc.update("INSERT INTO projects (id,code,name,status,manager_user_id,created_at,updated_at) VALUES (?,?,?,'active',?,?,?)",
                "p_e2e", "PRJ-E2E", "Dự án E2E", adminId, now, now);
        jdbc.update("INSERT INTO project_contracts (id,project_id,contract_no,contract_name,contract_type,status,is_primary,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)",
                "pc_e2e", "p_e2e", "HD-E2E", "Hợp đồng E2E", "main", "active", 1, now, now);
        jdbc.update("INSERT INTO materials (id,code,name,unit,system,active,created_at,updated_at) VALUES (?,?,?,?,?,1,?,?)",
                "m_e2e", "M-E2E", "Vật tư E2E", "cái", "DIEN", now, now);
        jdbc.update("INSERT INTO boq_versions (id,project_id,contract_id,version_no,version_code,version_name,revision_type,status,active,effective_at,created_at,updated_at) VALUES (?,?,?,1,'V1','BOQ V1','original','active',1,?,?,?)",
                "bv_e2e", "p_e2e", "pc_e2e", now, now, now);
        jdbc.update("INSERT INTO project_boq_items (id,project_id,contract_id,boq_version_id,line_no,source_order,contract_line_ref,row_role,boq_code,item_type,material_id,description,contract_qty,remeasured_qty,unit_price,active,created_at,updated_at) VALUES (?,?,?,?,1,1,'E2E-1','material','BQ-E2E','contract',?,?,100,100,0,1,?,?)",
                "pboq_e2e", "p_e2e", "pc_e2e", "bv_e2e", "m_e2e", "Vật tư E2E", now, now);
        jdbc.update("INSERT INTO approval_stage_catalog (id,stage_no,name,allowed_role_codes,approval_mode,sla_hours,auto_approve_on_submit,active,sort_order,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                "stg_e2e_1", 1, "BCH / Chỉ huy trưởng", "engineer,commander,admin", "single", 8, 0, 1, 1, now, now);
        jdbc.update("INSERT INTO approval_stage_catalog (id,stage_no,name,allowed_role_codes,approval_mode,sla_hours,auto_approve_on_submit,active,sort_order,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                "stg_e2e_2", 2, "Phòng Dự án", "engineer,commander,project,admin", "single", 8, 0, 1, 2, now, now);
        jdbc.update("INSERT INTO approval_project_assignments (id,project_id,stage,owner_user_id,active,created_at,updated_at) VALUES (?,?,?,?,1,?,?)",
                "apa_e2e_1", "p_e2e", 1, adminId, now, now);
        jdbc.update("INSERT INTO approval_project_assignments (id,project_id,stage,owner_user_id,active,created_at,updated_at) VALUES (?,?,?,?,1,?,?)",
                "apa_e2e_2", "p_e2e", 2, adminId, now, now);
        jdbc.update("INSERT INTO warehouses (id,code,name,type,project_id,parent_warehouse_id,keeper_user_id,active,created_at,updated_at) VALUES (?,?,?,'site',?,'WH-CENTRAL',?,1,?,?)",
                "wh_e2e", "KHO-E2E", "Kho E2E", "p_e2e", adminId, now, now);
        jdbc.update("INSERT INTO teams (id,project_id,code,name,trade,warehouse_id,leader_user_id,active,created_at,updated_at) VALUES (?,?,?,?,'diện',?,?,1,?,?)",
                "team_e2e", "p_e2e", "TD-E2E", "Tổ E2E", "wh_e2e", adminId, now, now);
        jdbc.update("INSERT INTO suppliers (id,code,name,active,created_at,updated_at) VALUES (?,?,?,1,?,?)",
                "sup_e2e", "NCC-E2E", "Nhà cung cấp E2E", now, now);
    }

    @Test
    void fullSupplyChain() throws Exception {
        seedBaseData();
        String projectId = "p_e2e", contractId = "pc_e2e", versionId = "bv_e2e", materialId = "m_e2e";
        String mrFields = "\"projectId\":\"" + projectId + "\",\"contractId\":\"" + contractId
                + "\",\"boqVersionId\":\"" + versionId + "\",\"purpose\":\"Phục vụ thi công\",\"neededAt\":\"2026-10-01\","
                + "\"lines\":[{\"materialId\":\"" + materialId + "\",\"quantity\":10,\"unitPrice\":50000,"
                + "\"boqItemId\":\"pboq_e2e\",\"contractLineNo\":\"E2E-1\",\"boqCode\":\"BQ-E2E\"}]";
        postAction(action("create_request", mrFields), 200);
        String requestId = jdbc.queryForObject(
                "SELECT id FROM material_requests WHERE project_id=? ORDER BY created_at DESC LIMIT 1", String.class, projectId);
        assertTrue(!requestId.isEmpty(), "create_request phải tạo MR trong DB");
        String mriId = jdbc.queryForObject(
                "SELECT id FROM material_request_items WHERE request_id=? LIMIT 1", String.class, requestId);
        // duyệt 2 bước
        postAction(action("decide_approval",
                "\"requestId\":\"" + requestId + "\",\"stage\":1,\"decision\":\"approved\",\"comment\":\"Duyệt bước 1\""), 200);
        postAction(action("decide_approval",
                "\"requestId\":\"" + requestId + "\",\"stage\":2,\"decision\":\"approved\",\"comment\":\"Duyệt bước 2\""), 200);
        // create_po
        String poFields = "\"requestId\":\"" + requestId + "\",\"warehouseId\":\"wh_e2e\","
                + "\"availabilityOverrideReason\":\"Dùng cho smoke test E2E\","
                + "\"lines\":[{\"requestItemId\":\"" + mriId + "\",\"quantity\":10,\"supplierId\":\"sup_e2e\","
                + "\"plannedDeliveryAt\":\"2026-10-05\"}]";
        postAction(action("create_po", poFields), 200);
        String poId = jdbc.queryForObject(
                "SELECT id FROM purchase_orders WHERE request_id=? ORDER BY created_at DESC LIMIT 1", String.class, requestId);
        assertTrue(!poId.isEmpty(), "create_po phải tạo PO trong DB");
        String poiId = jdbc.queryForObject(
                "SELECT id FROM purchase_order_items WHERE purchase_order_id=? LIMIT 1", String.class, poId);
        // receive_goods
        String rgFields = "\"purchaseOrderId\":\"" + poId + "\",\"deliveryNoteNo\":\"DN-E2E\","
                + "\"certificateStatus\":\"complete\",\"deliveryDocumentStatus\":\"complete\",\"qcOk\":true,"
                + "\"lines\":[{\"purchaseOrderItemId\":\"" + poiId + "\",\"quantity\":10,\"lotNo\":\"LOT-E2E\"}]";
        postAction(action("receive_goods", rgFields), 200);
        String receiptId = jdbc.queryForObject(
                "SELECT id FROM goods_receipts WHERE purchase_order_id=? ORDER BY created_at DESC LIMIT 1", String.class, poId);
        assertTrue(!receiptId.isEmpty(), "receive_goods phải tạo GRN trong DB");
        // confirm_delivery — bắt buộc 1 ảnh
        Instant now = Instant.now();
        jdbc.update("INSERT INTO attachments (id,entity_type,entity_id,file_name,storage_key,mime_type,uploaded_by,created_at,updated_at) " +
                        "VALUES (?, 'goods_receipt', ?, 'giao-hang.png', 'keys/e2e', 'image/png', ?, ?, ?)",
                "att_e2e", receiptId, adminId, now, now);
        postAction(action("confirm_delivery",
                "\"receiptId\":\"" + receiptId + "\",\"certificateStatus\":\"complete\",\"deliveryDocumentStatus\":\"complete\","
                        + "\"comment\":\"BCH xác nhận smoke test\""), 200);
        // tồn sau posting: ledger contract +10
        Double ledger = jdbc.queryForObject(
                "SELECT COALESCE(SUM(quantity_delta),0) FROM contract_stock_ledger WHERE contract_id=? AND warehouse_id=? AND material_id=?",
                Double.class, contractId, "wh_e2e", materialId);
        assertTrue(ledger != null && Math.abs(ledger - 10) < 1e-9,
                "posting GRN phải vào ledger +10 — thực tế: " + ledger);
        // issue_stock — tổ đội nhận 4 cái
        postAction(action("issue_stock",
                "\"projectId\":\"" + projectId + "\",\"fromWarehouseId\":\"wh_e2e\",\"teamId\":\"team_e2e\","
                        + "\"requestId\":\"" + requestId + "\",\"receivedByName\":\"Tổ trưởng E2E\","
                        + "\"lines\":[{\"materialId\":\"" + materialId + "\",\"quantity\":4,\"requestItemId\":\"" + mriId + "\"}]"), 200);
        // Production → Thu hồi → Thanh toán
        postAction(action("save_production_report",
                "\"projectId\":\"" + projectId + "\",\"reportPeriod\":\"2026-09\",\"plannedValue\":100000000,"
                        + "\"actualValue\":120000000"), 200);
        String prId = jdbc.queryForObject("SELECT id FROM production_reports WHERE project_id=? LIMIT 1", String.class, projectId);
        postAction(action("approve_production_report",
                "\"productionReportId\":\"" + prId + "\",\"approvedValue\":120000000"), 200);
        postAction(action("save_capital_recovery",
                "\"periodKey\":\"2026-09\",\"projectId\":\"" + projectId + "\",\"submittedValue\":120000000,"
                        + "\"approvedValue\":110000000,\"invoiceValue\":110000000,\"invoiceNo\":\"HD-E2E\","
                        + "\"dueDate\":\"2026-11-30\",\"productionReportId\":\"" + prId + "\""), 200);
        String recoveryId = jdbc.queryForObject(
                "SELECT id FROM capital_recovery_records WHERE project_id=? LIMIT 1", String.class, projectId);
        postAction(action("save_contract_payment",
                "\"projectId\":\"" + projectId + "\",\"recoveryRecordId\":\"" + recoveryId + "\","
                        + "\"paymentDate\":\"2026-10-10\",\"description\":\"Thanh toán đợt 1\",\"amount\":55000000"), 200);
        // work item thủ công
        postAction(action("create_work_item",
                "\"departmentCode\":\"DA\",\"title\":\"Kiểm tra hồ sơ nghiệm thu\",\"projectId\":\"" + projectId
                        + "\",\"assignedTo\":\"" + adminId + "\""), 200);
    }
}