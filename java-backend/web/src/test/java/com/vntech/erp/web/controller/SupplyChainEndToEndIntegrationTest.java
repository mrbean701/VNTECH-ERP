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
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
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
    private jakarta.servlet.http.Cookie requesterCookie;
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

    /**
     * [TASK-115] POST bằng cookie của NGƯỜI LẬP PHIẾU (khác NGƯỜI DUYỆT) — luật «người tạo đơn KHÔNG tự duyệt»
     * (commit 42f91be) bỏ qua bước mà vai trò người lập phiếu nằm trong `allowed_role_codes`, nên phiếu của
     * chuỗi này phải do tài khoản KHÁC tạo (vai trò `kh_nv` không có trong danh sách duyệt của bước nào).
     */
    private MvcResult postActionAs(jakarta.servlet.http.Cookie cookie, String json, int expectStatus)
            throws Exception {
        var res = mockMvc.perform(post("/api/system").contentType(MediaType.APPLICATION_JSON)
                .content(json).cookie(cookie));
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
        jdbc.update("INSERT INTO materials (id,code,name,unit,`system`,active,created_at,updated_at) VALUES (?,?,?,?,?,1,?,?)",
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
        // [TASK-115] Người LẬP PHIẾU khác NGƯỜI DUYỆT (luật «người tạo không tự duyệt» — commit 42f91be).
        TestActors.seedRequester(jdbc, "u_req_e2e", "kh.nv.e2e", "Nhân viên Kế hoạch", "kh_nv",
                "Phòng Kế hoạch", "p_e2e", now);
        requesterCookie = TestActors.login(mockMvc, "kh.nv.e2e");
    }

    @Test
    void fullSupplyChain() throws Exception {
        seedBaseData();
        String projectId = "p_e2e", contractId = "pc_e2e", versionId = "bv_e2e", materialId = "m_e2e";
        String mrFields = "\"projectId\":\"" + projectId + "\",\"contractId\":\"" + contractId
                + "\",\"boqVersionId\":\"" + versionId + "\",\"purpose\":\"Phục vụ thi công\",\"neededAt\":\"2026-10-01\","
                + "\"lines\":[{\"materialId\":\"" + materialId + "\",\"quantity\":10,\"unitPrice\":50000,"
                + "\"boqItemId\":\"pboq_e2e\",\"contractLineNo\":\"E2E-1\",\"boqCode\":\"BQ-E2E\"}]";
        postActionAs(requesterCookie, action("create_request", mrFields), 200);
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
        // [TASK-133] BUG #10 (regression guard) — TASK-133 DỜI phần ghi kho từ bước ① (tạo phiếu) sang
        // bước ③ (`issue_stock_confirm`, sau khi CHT duyệt) nên movement SMI KHÔNG còn xuất hiện ngay sau
        // `issue_stock`. Bất biến được kiểm ở đây là phần CHẶN: chưa duyệt/chưa xuất thì CHƯA có movement.
        String teamWarehouseId = jdbc.queryForObject(
                "SELECT warehouse_id FROM teams WHERE id='team_e2e'", String.class);
        assertEquals(0, jdbc.queryForObject(
                "SELECT COUNT(*) FROM stock_movements WHERE movement_type='SMI' AND from_warehouse_id='wh_e2e'"
                        + " AND reference_type='stock_issue'", Integer.class),
                "TASK-133: tạo phiếu ① KHÔNG được ghi movement SMI (phần ghi kho đã dời sang bước ③)");

        // ═══ TASK-132 — WF-XUATKHO-01 BƯỚC ①② («tạo phiếu» → «chỉ huy trưởng duyệt») ═══════════
        // Phạm vi lượt này CHỈ 2 bước đầu: ③ tiến hành xuất kho · ④ thủ kho xác nhận · ⑤ GRN
        // KHÔNG được thi hành ở đây (nhánh sau làm) ⇒ KHÔNG assert gì về 3 bước đó.
        String issueId = jdbc.queryForObject(
                "SELECT id FROM stock_issues WHERE project_id=? ORDER BY created_at DESC LIMIT 1",
                String.class, projectId);
        // ① phiếu MỚI sinh ra phải là CHỜ CHT DUYỆT, KHÔNG còn bind cứng 'posted'.
        assertEquals("pending_cht",
                jdbc.queryForObject("SELECT status FROM stock_issues WHERE id=?", String.class, issueId),
                "phiếu xuất mới phải ở trạng thái pending_cht (chờ chỉ huy trưởng duyệt) — không được 'posted'");
        // Cho người lập phiếu quyền `approvals.canApprove=1` để cổng MODULE đi qua, nhờ vậy 403 của
        // ca dưới CHẮC CHẮN đến từ cổng VAI TRÒ `requireRole(["commander","admin"])` chứ không phải
        // cổng module (đúng lời khẳng định «cổng vai trò mới là cái chặn thật»).
        jdbc.update("INSERT INTO module_catalog (module_key,label,icon,active,sort_order,created_at,updated_at)"
                + " SELECT 'approvals','Trung tâm phê duyệt','X',1,30,?,? WHERE NOT EXISTS"
                + " (SELECT 1 FROM module_catalog WHERE module_key='approvals')", now, now);
        jdbc.update("INSERT INTO user_module_permissions (id,user_id,module_key,can_view,can_use,can_create,"
                        + "can_edit,can_approve,can_export,permission_source,created_at,updated_at)"
                        + " VALUES (?,?,'approvals',1,1,0,0,1,0,'manual_override',?,?)",
                "ump_ap_e2e", "u_req_e2e", now, now);
        // ĐỐI CHỨNG ÂM 1: người KHÔNG phải chỉ huy trưởng (vai trò kh_nv) duyệt ⇒ 403.
        MvcResult notCommander = postActionAs(requesterCookie,
                action("approve_stock_issue", "\"issueId\":\"" + issueId + "\",\"decision\":\"approved\""), 403);
        assertTrue(notCommander.getResponse().getContentAsString()
                        .contains("không có quyền thực hiện nghiệp vụ này"),
                "403 phải đến từ cổng VAI TRÒ (requireRole), không phải cổng module — body: "
                        + abbreviate(notCommander.getResponse().getContentAsString()));
        // ② chỉ huy trưởng duyệt ⇒ 200 + sinh bản ghi `approvals` + phiếu sang trạng thái sẵn sàng xuất.
        postAction(action("approve_stock_issue",
                "\"issueId\":\"" + issueId + "\",\"decision\":\"approved\",\"comment\":\"CHT duyệt (TASK-132)\""), 200);
        assertEquals("approved",
                jdbc.queryForObject("SELECT status FROM stock_issues WHERE id=?", String.class, issueId),
                "sau khi CHT duyệt, stock_issues.status phải là 'approved'");
        Map<String, Object> ap = jdbc.queryForMap(
                "SELECT entity_type, entity_id, stage, approver_user_id, status, decided_at FROM approvals"
                        + " WHERE entity_type='stock_issue' AND entity_id=?", issueId);
        assertEquals("stock_issue", ap.get("entity_type"));
        assertEquals(issueId, ap.get("entity_id"));
        assertEquals(1, ((Number) ap.get("stage")).intValue());
        assertEquals(adminId, ap.get("approver_user_id"), "approver_user_id phải là chính người duyệt");
        assertEquals("approved", ap.get("status"));
        assertEquals(adminId, jdbc.queryForObject(
                "SELECT approved_by FROM stock_issues WHERE id=?", String.class, issueId),
                "stock_issues.approved_by phải là người duyệt");
        // ĐỐI CHỨNG ÂM 2: duyệt LẦN 2 cùng phiếu ⇒ 400 (đã duyệt rồi).
        postAction(action("approve_stock_issue", "\"issueId\":\"" + issueId + "\",\"decision\":\"approved\""), 400);
        assertEquals(1, jdbc.queryForObject(
                "SELECT COUNT(*) FROM approvals WHERE entity_type='stock_issue' AND entity_id=?",
                Integer.class, issueId), "duyệt lại KHÔNG được sinh thêm bản ghi approvals");
        // ĐỐI CHỨNG ÂM 3: phiếu KHÔNG tồn tại ⇒ 400.
        postAction(action("approve_stock_issue", "\"issueId\":\"ISS_khong-ton-tai\""), 400);

        // ═══ TASK-133 — WF-XUATKHO-01 BƯỚC ③④⑤ («xuất kho» → «thủ kho xác nhận đủ» → «GRN») ═══════
        // ③ tiến hành xuất kho — ĐÂY mới là chỗ ghi `stock_movements` (SMI) + `contract_stock_ledger`.
        // BUG #10 (regression guard) được kiểm LẠI ở đúng bước ③: movement PHẢI chuyển hàng sang kho TỔ
        // ĐỘI, không được để `to_warehouse_id` NULL (nếu sai thì tồn tổ đội luôn 0, return_stock/kiểm kê
        // đều hỏng). Lưu ý: fixture này seed `team_e2e` trỏ CHÍNH `wh_e2e` nên chỉ khẳng định trên movement
        // + `destination_contract_id`; không khẳng định ledger vì 2 kho trùng nhau.
        postAction(action("issue_stock_confirm", "\"issueId\":\"" + issueId + "\""), 200);
        assertEquals("issued",
                jdbc.queryForObject("SELECT status FROM stock_issues WHERE id=?", String.class, issueId),
                "TASK-133 ③: sau khi xuất kho, stock_issues.status phải là 'issued'");
        Map<String, Object> smi = jdbc.queryForMap(
                "SELECT to_warehouse_id AS toWh, destination_contract_id AS destContract, quantity "
                        + "FROM stock_movements WHERE movement_type='SMI' AND from_warehouse_id='wh_e2e' "
                        + "AND reference_type='stock_issue' ORDER BY occurred_at DESC LIMIT 1");
        assertEquals(teamWarehouseId, smi.get("toWh"),
                "movement SMI phải có to_warehouse_id = kho tổ đội (bug #10: trước đây là NULL)");
        assertEquals(contractId, smi.get("destContract"),
                "movement SMI phải có destination_contract_id = contract của dòng (bug #10: trước đây NULL)");
        assertEquals(0, new java.math.BigDecimal("4").compareTo((java.math.BigDecimal) smi.get("quantity")),
                "movement SMI phải đúng số lượng 4");
        // ④ thủ kho xác nhận đã xuất đủ ⇒ `completed`.
        postAction(action("confirm_stock_issue", "\"issueId\":\"" + issueId + "\",\"comment\":\"Đã xuất đủ\""), 200);
        assertEquals("completed",
                jdbc.queryForObject("SELECT status FROM stock_issues WHERE id=?", String.class, issueId),
                "TASK-133 ④: thủ kho xác nhận đủ ⇒ status 'completed'");
        // ⑤ sinh GRN nhập vào kho khác — ⛔ KHÔNG cần duyệt, CHỈ cần quyền tạo.
        postAction(action("create_issue_grn",
                "\"issueId\":\"" + issueId + "\",\"toWarehouseId\":\"wh_e2e\""), 200);
        assertEquals("grn_created",
                jdbc.queryForObject("SELECT status FROM stock_issues WHERE id=?", String.class, issueId),
                "TASK-133 ⑤: sinh GRN xong ⇒ status 'grn_created'");

        // ══════════════════════════════════════════════════════════════════════════════════════════
        // MT2 §7.4 — **TẠO PHIẾU NHẬP TỪ LỆNH ĐIỀU CHUYỂN (STO)** (nguồn còn thiếu; nguồn phiếu xuất đã
        // kiểm ở ⑤ phía trên). Nguyên văn: “tạo phiếu nhập từ STO/phiếu xuất kho: nếu phiếu liên quan đã có
        // kho đi/kho đến ⇒ tự động fill”. ⇒ Kho nhận LẤY TỰ ĐỘNG từ `transfer_orders.destination_warehouse_id`.
        // ⚠️ Tái dùng ĐÚNG PO mà `fullSupplyChain()` đã tạo qua API (cùng dự án `p_e2e`, cùng vật tư `m_e2e`)
        //    ⇒ ⛔ KHÔNG seed thêm MR/PO; chỉ thêm 1 KHO ĐÍCH + 1 lệnh điều chuyển.
        // ══════════════════════════════════════════════════════════════════════════════════════════
        Instant stoT = Instant.now();
        jdbc.update("INSERT INTO warehouses (id,code,name,type,project_id,parent_warehouse_id,keeper_user_id,active,created_at,updated_at) VALUES (?,?,?,'site',?,'WH-CENTRAL',?,1,?,?)",
                "wh_e2e_dest", "KHO-E2E-DICH", "Kho đích E2E", projectId, adminId, stoT, stoT);
        jdbc.update("INSERT INTO transfer_orders (id,transfer_no,source_warehouse_id,destination_warehouse_id,"
                        + "transit_warehouse_id,source_project_id,destination_project_id,requested_by,requested_at,"
                        + "status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
                "to_e2e", "STO-E2E-001", "wh_e2e", "wh_e2e_dest", "wh_e2e", projectId, projectId,
                adminId, stoT, "received", stoT, stoT);
        jdbc.update("INSERT INTO transfer_order_items (id,transfer_order_id,material_id,requested_qty,"
                        + "received_qty,created_at,updated_at) VALUES (?,?,?,?,?,?,?)",
                "toi_e2e", "to_e2e", "m_e2e", 4, 4, stoT, stoT);

        // ⑥a. ÂM — trạng thái KHÔNG phải `received` ⇒ 400 và ⛔ KHÔNG sinh phiếu nhập.
        jdbc.update("UPDATE transfer_orders SET status='approved' WHERE id='to_e2e'");
        postAction(action("create_transfer_grn", "\"transferId\":\"to_e2e\""), 400);
        assertEquals(0, jdbc.queryForObject(
                "SELECT COUNT(*) FROM goods_receipts WHERE receipt_no LIKE 'GRN-STO-%'", Integer.class),
                "MT2 §7.4 (âm): STO chưa nhận hàng ⇒ ⛔ KHÔNG được sinh phiếu nhập nào");

        // ⑥b. DƯƠNG — STO `received` ⇒ sinh 1 GRN, số dòng `GRN-STO-`, kho nhận TỰ ĐIỀN từ STO.
        jdbc.update("UPDATE transfer_orders SET status='received' WHERE id='to_e2e'");
        postAction(action("create_transfer_grn", "\"transferId\":\"to_e2e\""), 200);
        assertEquals("grn_created",
                jdbc.queryForObject("SELECT status FROM transfer_orders WHERE id='to_e2e'", String.class),
                "MT2 §7.4: sinh GRN xong ⇒ `transfer_orders.status` = 'grn_created'");
        Map<String, Object> stoGrn = jdbc.queryForMap(
                "SELECT receipt_no AS rn, warehouse_id AS wh, posting_status AS ps, purchase_order_id AS po "
                        + "FROM goods_receipts WHERE receipt_no LIKE 'GRN-STO-%'");
        assertTrue(String.valueOf(stoGrn.get("rn")).startsWith("GRN-STO-"),
                "MT2 §7.4: số phiếu nhập sinh từ STO phải theo dòng riêng `GRN-STO-` (⛔ không lẫn `GRN-PX`/mua hàng)");
        assertEquals("wh_e2e_dest", stoGrn.get("wh"),
                "MT2 §7.4: kho nhận phải TỰ ĐỘNG lấy từ `transfer_orders.destination_warehouse_id`");
        assertEquals("posted", stoGrn.get("ps"), "GRN sinh từ STO phải ở trạng thái `posted` (⛔ không vòng QC/duyệt)");
        assertTrue(stoGrn.get("po") != null && !String.valueOf(stoGrn.get("po")).isEmpty(),
                "chốt PO: mọi GRN hiện có đều gắn PO (32/32) ⇒ dòng STO phải tra được PO của dự án");
        assertEquals(1, jdbc.queryForObject(
                "SELECT COUNT(*) FROM goods_receipt_items WHERE receipt_id=(SELECT id FROM goods_receipts WHERE receipt_no LIKE 'GRN-STO-%')",
                Integer.class), "GRN phải có ĐÚNG 1 dòng vật tư (theo 1 dòng STO)");

        // ⑥c. ÂM — GỌI LẦN HAI ⇒ 400 và ⛔ vẫn CHỈ 1 phiếu nhập (chốt chặn không sinh trùng).
        postAction(action("create_transfer_grn", "\"transferId\":\"to_e2e\""), 400);
        assertEquals(1, jdbc.queryForObject(
                "SELECT COUNT(*) FROM goods_receipts WHERE receipt_no LIKE 'GRN-STO-%'", Integer.class),
                "MT2 §7.4 (âm): gọi lần hai ⛔ KHÔNG được sinh phiếu nhập thứ hai");

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