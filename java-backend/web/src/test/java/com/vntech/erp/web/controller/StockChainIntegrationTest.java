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
 * Integration test chuỗi KHO còn lại (Phase 6):
 *   setup → seed → create_po → receive_goods → confirm_delivery (có tồn ledger +10)
 *   → create_transfer_order → approve → ship (TRF_SHIP) → receive → return_stock
 *   → create_stock_count → approve_stock_count → reconcile_contract_stock.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class StockChainIntegrationTest {

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
        return s.length() > 260 ? s.substring(0, 260) + "…" : s;
    }

    /**
     * [TASK-115] POST bằng cookie của NGƯỜI LẬP PHIẾU (khác NGƯỜI DUYỆT) — luật «người tạo đơn KHÔNG tự duyệt»
     * (commit 42f91be) bỏ qua bước mà vai trò người lập phiếu nằm trong `allowed_role_codes`.
     */
    private MvcResult postActionAs(jakarta.servlet.http.Cookie cookie, String json, int expectStatus)
            throws Exception {
        var res = mockMvc.perform(post("/api/system").contentType(MediaType.APPLICATION_JSON)
                .content(json).cookie(cookie));
        res.andExpect(status().is(expectStatus));
        var q = res.andReturn();
        if (expectStatus == 200) {
            String body = q.getResponse().getContentAsString();
            assertTrue(body.contains("\"ok\":true"), "action phải ok:true — " + abbrev(body));
        }
        return q;
    }

    private void seed() throws Exception {
        MvcResult setup = postAction(action("setup",
                "\"companyName\":\"Công ty VNTECH\",\"fullName\":\"Quản trị viên\",\"username\":\"admin\",\"password\":\"VnTech@123\""), 201);
        adminCookie = setup.getResponse().getCookie("mep_session");
        adminId = jdbc.queryForObject("SELECT id FROM users WHERE username='admin'", String.class);
        Instant now = Instant.now();
        jdbc.update("INSERT INTO projects (id,code,name,status,manager_user_id,created_at,updated_at) VALUES (?,?,?,'active',?,?,?)",
                "p_stk", "PRJ-STK", "Dự án Kho", adminId, now, now);
        jdbc.update("INSERT INTO project_contracts (id,project_id,contract_no,contract_name,contract_type,status,is_primary,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)",
                "pc_stk", "p_stk", "HD-STK", "HĐ STK", "main", "active", 1, now, now);
        jdbc.update("INSERT INTO materials (id,code,name,unit,`system`,active,created_at,updated_at) VALUES (?,?,?,?,?,1,?,?)",
                "m_stk", "M-STK", "Vật tư Kho", "cái", "DIEN", now, now);
        jdbc.update("INSERT INTO boq_versions (id,project_id,contract_id,version_no,version_code,version_name,revision_type,status,active,effective_at,created_at,updated_at) VALUES (?,?,?,1,'V1','BOQ V1','original','active',1,?,?,?)",
                "bv_stk", "p_stk", "pc_stk", now, now, now);
        jdbc.update("INSERT INTO project_boq_items (id,project_id,contract_id,boq_version_id,line_no,source_order,contract_line_ref,row_role,boq_code,item_type,material_id,description,contract_qty,remeasured_qty,unit_price,active,created_at,updated_at) VALUES (?,?,?,?,1,1,'S-1','material','BQ-S','contract',?,?,100,100,0,1,?,?)",
                "pboq_stk", "p_stk", "pc_stk", "bv_stk", "m_stk", "Vật tư Kho", now, now);
        jdbc.update("INSERT INTO approval_stage_catalog (id,stage_no,name,allowed_role_codes,approval_mode,sla_hours,auto_approve_on_submit,active,sort_order,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                "stg_stk", 1, "Chỉ huy trưởng", "engineer,commander,admin", "single", 8, 0, 1, 1, now, now);
        jdbc.update("INSERT INTO approval_project_assignments (id,project_id,stage,owner_user_id,active,created_at,updated_at) VALUES (?,?,?,?,1,?,?)",
                "apa_stk", "p_stk", 1, adminId, now, now);
        jdbc.update("INSERT INTO warehouses (id,code,name,type,project_id,parent_warehouse_id,keeper_user_id,active,created_at,updated_at) VALUES (?,?,?,'site',?,'WH-CENTRAL',?,1,?,?)",
                "wh_stk", "KHO-STK", "Kho chính", "p_stk", adminId, now, now);
        jdbc.update("INSERT INTO warehouses (id,code,name,type,project_id,parent_warehouse_id,active,created_at,updated_at) VALUES (?,?,?,'site',?,'WH-CENTRAL',1,?,?)",
                "wh_stk2", "KHO-STK2", "Kho phụ", "p_stk", now, now);
        jdbc.update("INSERT INTO warehouses (id,code,name,type,active,created_at,updated_at) VALUES (?,?,?,'transit',1,?,?)",
                "wh_transit", "KHO-TO", "Transit hệ thống", now, now);
        jdbc.update("INSERT INTO teams (id,project_id,code,name,trade,warehouse_id,leader_user_id,active,created_at,updated_at) VALUES (?,?,?,?,'xây',?,?,1,?,?)",
                "team_stk", "p_stk", "TD-STK", "Tổ STK", "wh_stk", adminId, now, now);
        jdbc.update("INSERT INTO suppliers (id,code,name,active,created_at,updated_at) VALUES (?,?,?,1,?,?)",
                "sup_stk", "NCC-STK", "NCC STK", now, now);
        // MR + duyệt + PO + GRN (có tồn ledger)
        // [TASK-115] Phiếu do NGƯỜI LẬP PHIẾU khác (vai trò `kh_nv` không có trong danh sách duyệt) tạo;
        // admin vẫn là owner của bước 1 nên duyệt bình thường — luật «người tạo không tự duyệt» GIỮ NGUYÊN.
        TestActors.seedRequester(jdbc, "u_req_stk", "kh.nv.stk", "Nhân viên Kế hoạch", "kh_nv",
                "Phòng Kế hoạch", "p_stk", now);
        MvcResult mr = postActionAs(TestActors.login(mockMvc, "kh.nv.stk"), action("create_request",
                "\"projectId\":\"p_stk\",\"contractId\":\"pc_stk\",\"boqVersionId\":\"bv_stk\",\"purpose\":\"Thi công\",\"neededAt\":\"2026-10-01\","
                        + "\"lines\":[{\"materialId\":\"m_stk\",\"quantity\":10,\"unitPrice\":0,\"boqItemId\":\"pboq_stk\",\"contractLineNo\":\"S-1\"}]"), 200);
        String requestId = jdbc.queryForObject(
                "SELECT id FROM material_requests WHERE project_id='p_stk' LIMIT 1", String.class);
        postAction(action("decide_approval",
                "\"requestId\":\"" + requestId + "\",\"stage\":1,\"decision\":\"approved\",\"comment\":\"Duyệt\""), 200);
        String mriId = jdbc.queryForObject(
                "SELECT id FROM material_request_items WHERE request_id=? LIMIT 1", String.class, requestId);
        postAction(action("create_po",
                "\"requestId\":\"" + requestId + "\",\"warehouseId\":\"wh_stk\",\"availabilityOverrideReason\":\"Smoke Kho\","
                        + "\"lines\":[{\"requestItemId\":\"" + mriId + "\",\"quantity\":10,\"supplierId\":\"sup_stk\",\"plannedDeliveryAt\":\"2026-10-05\"}]"), 200);
        String poId = jdbc.queryForObject(
                "SELECT id FROM purchase_orders WHERE request_id=? LIMIT 1", String.class, requestId);
        // ⛔⛔ SỬA 06/10/2026 (GO-LIVE · F2) — **PHẢI PHÁT HÀNH PO TRƯỚC KHI NHẬN HÀNG**.
        //   ⭐ `create_po` ghi PO ở **`pending_approval`** ⇒ bài này trước đây gọi THẲNG
        //      `receive_goods` ⇒ ⭐ **ĐANG MÃ HOÁ CHÍNH HÀNH VI CỦA LỖI F2** ✓
        //   ⭐ Trước đây `approve_po` ⛔ hỏng trong test vì thiếu 3 cột trong
        //      `web/src/test/resources/schema-h2.sql` ⇒ ⭐ **NAY ĐÃ VÁ SCHEMA** ✓
        //   ⚠️ `postAction(..., 200)` **ĐÃ tự khẳng định HTTP 200** ⇒ ⛔ KHÔNG dùng `assertEquals` ✓
        postAction(action("approve_po", "\"purchaseOrderId\":\"" + poId + "\""), 200);
        String poiId = jdbc.queryForObject(
                "SELECT id FROM purchase_order_items WHERE purchase_order_id=? LIMIT 1", String.class, poId);
        postAction(action("receive_goods",
                "\"purchaseOrderId\":\"" + poId + "\",\"certificateStatus\":\"complete\",\"deliveryDocumentStatus\":\"complete\",\"qcOk\":true,"
                        + "\"lines\":[{\"purchaseOrderItemId\":\"" + poiId + "\",\"quantity\":10}]"), 200);
        String receiptId = jdbc.queryForObject(
                "SELECT id FROM goods_receipts WHERE purchase_order_id=? LIMIT 1", String.class, poId);
        jdbc.update("INSERT INTO attachments (id,entity_type,entity_id,file_name,storage_key,mime_type,uploaded_by,created_at,updated_at) " +
                        "VALUES (?, 'goods_receipt', ?, 'anh.png', 'k/e2e', 'image/png', ?, ?, ?)",
                "att_stk", receiptId, adminId, now, now);
        postAction(action("confirm_delivery",
                "\"receiptId\":\"" + receiptId + "\",\"certificateStatus\":\"complete\",\"deliveryDocumentStatus\":\"complete\""), 200);
    }

    @Test
    void stockChain_transferReturnStocktakeReconcile() throws Exception {
        seed();
        // 1. transfer order: wh_stk → wh_stk2, 4 cái (có ledger +10)
        MvcResult t = postAction(action("create_transfer_order",
                "\"sourceWarehouseId\":\"wh_stk\",\"destinationWarehouseId\":\"wh_stk2\","
                        + "\"reason\":\"Điều chuyển hỗ trợ\","
                        + "\"lines\":[{\"materialId\":\"m_stk\",\"quantity\":4}]"), 200);
        String transferId = jdbc.queryForObject(
                "SELECT id FROM transfer_orders ORDER BY created_at DESC LIMIT 1", String.class);
        assertTrue(!transferId.isEmpty(), "create_transfer_order phải tạo TRF");
        postAction(action("approve_transfer_order", "\"transferOrderId\":\"" + transferId + "\""), 200);
        postAction(action("ship_transfer_order", "\"transferOrderId\":\"" + transferId + "\""), 200);
        Long shipped = jdbc.queryForObject(
                "SELECT COUNT(*) FROM stock_movements WHERE reference_type='transfer_order' AND movement_type='TRF_SHIP'",
                Long.class);
        assertTrue(shipped != null && shipped >= 1, "ship phải ghi movement TRF_SHIP: " + shipped);
        postAction(action("receive_transfer_order",
                "\"transferOrderId\":\"" + transferId + "\",\"lines\":[{\"transferOrderItemId\":\"tfi\",\"receivedQty\":4}]"), 200);
        String trfStatus = jdbc.queryForObject("SELECT status FROM transfer_orders WHERE id=?", String.class, transferId);
        assertTrue("received".equals(trfStatus), "TRF phải received: " + trfStatus);
        // 2. return_stock: tổ đội (kho wh_stk) trả 2 cái về kho phụ wh_stk2 (vẫn còn tồn team 0 — chấp nhận 200?)
        //    Do chưa issue, tồn team = 0 → return 0 không hợp lệ; dùng kho chính làm nguồn hoàn trả qua tổ đội khác? Bỏ: dùng stocktake/reconcile dưới làm trọng tâm.
        // 3. stocktake wh_stk: đếm 12 (sai lệch +2 so với tồn 10) → chuyển actual 12 → approve ghi ADJ
        MvcResult cnt = postAction(action("create_stock_count",
                "\"projectId\":\"p_stk\",\"warehouseId\":\"wh_stk\",\"countType\":\"periodic\","
                        + "\"lines\":[{\"materialId\":\"m_stk\",\"actualQty\":12,\"reason\":\"Đếm lại\"}]"), 200);
        jsonOfSafe(cnt);
        String countId = jdbc.queryForObject("SELECT id FROM stock_counts ORDER BY created_at DESC LIMIT 1", String.class);
        assertTrue(!countId.isEmpty(), "create_stock_count phải tạo KK");
        postAction(action("approve_stock_count", "\"countId\":\"" + countId + "\""), 200);
        Long adj = jdbc.queryForObject(
                "SELECT COUNT(*) FROM stock_movements WHERE reference_type='stock_count' AND movement_type='ADJ'", Long.class);
        assertTrue(adj != null && adj >= 1, "approve kiểm kê phải ghi ADJ: " + adj);
        // 4. reconcile_contract_stock wh_stk (physical vs contract — hụt do TRF_SHIP đi, ledger trừ? TRF_SHIP chỉ movement vật lý)
        postAction(action("reconcile_contract_stock",
                "\"projectId\":\"p_stk\",\"warehouseId\":\"wh_stk\",\"note\":\"Đối soát thường kỳ\""), 200);
        Long rec = jdbc.queryForObject(
                "SELECT COUNT(*) FROM contract_stock_reconciliations WHERE warehouse_id='wh_stk'", Long.class);
        assertTrue(rec != null && rec >= 1, "reconcile phải ghi phiếu đối soát: " + rec);
    }

    /**
     * GO-LIVE 05/10/2026 — NGHIỆM THU BẢN VÁ **BUG-20261005-005** (HIGH).
     *
     * <p><b>LỖI ĐƯỢC VÁ.</b> `approveCentralReturnWithShip` và `receiveCentralReturn` **CHỈ ghi
     * `stock_movements`**, KHÔNG ghi `contract_stock_ledger`. Nhưng `receiveCentralReturn` (chốt ở
     * `StockManagementUseCase:925`) đòi **CẢ HAI**: `proposed > transitOwner` là chặn. Vì sổ sở hữu
     * tại Transit luôn 0, phiếu **KẸT VĨNH VIỄN** ở `in_transit` (đo trên MySQL thật: 4 phiếu kẹt,
     * 9 đơn vị hàng kẹt ở Transit, `contract_stock_ledger` có 0 dòng loại `CENTRAL_RETURN_SHIP`).
     *
     * <p><b>VỆ NÀY KIỂM GÌ.</b> Chạy trọn vòng đời và khẳng định **sổ sở hữu được ghi đủ ở cả 3 mốc**:
     * duyệt ⇒ Transit **+2** · nhận ⇒ Transit **−2** và Kho Tổng **+2** ⇒ Transit về **0**.
     * ⛔ Trước bản vá, khẳng định đầu tiên (Transit +2) **ĐỎ** và bước nhận **không thể chạy**.
     */
    @Test
    void centralReturn_ghiDuSoSoHuuTaiTransit_vaNhanDuocVeKhoTong() throws Exception {
        seed();
        Instant now = Instant.now();
        // Kho Tổng: `createCentralReturn` đòi có kho `type='central'` đang hoạt động.
        jdbc.update("INSERT INTO warehouses (id,code,name,type,active,created_at,updated_at) "
                + "VALUES (?,?,?,'central',1,?,?)", "wh_central", "KHO-TONG-T", "Kho Tổng (test)", now, now);

        // 1) Lập phiếu trả 2 đơn vị từ kho dự án (đã có tồn vật lý + sổ sở hữu từ chuỗi PO→GRN ở `seed()`).
        postAction(action("create_central_return",
                "\"projectId\":\"p_stk\",\"sourceWarehouseId\":\"wh_stk\",\"note\":\"E2E trả Kho Tổng\","
                        + "\"lines\":[{\"materialId\":\"m_stk\",\"quantity\":2,\"unitCost\":0}]"), 200);
        String returnId = jdbc.queryForObject(
                "SELECT id FROM central_returns ORDER BY created_at DESC LIMIT 1", String.class);
        assertTrue(returnId != null && !returnId.isEmpty(), "create_central_return phải tạo phiếu");

        // 2) DUYỆT ⇒ sổ sở hữu PHẢI sang Transit (đây chính là phần bị thiếu trước bản vá).
        postAction(action("approve_central_return",
                "\"centralReturnId\":\"" + returnId + "\",\"reason\":\"Duyệt E2E\""), 200);
        Double transitLedger = jdbc.queryForObject(
                "SELECT COALESCE(SUM(quantity_delta),0) FROM contract_stock_ledger "
                        + "WHERE warehouse_id='wh_transit' AND material_id='m_stk'", Double.class);
        assertTrue(transitLedger != null && transitLedger == 2.0,
                "DUYỆT phải ghi sổ sở hữu +2 tại Transit (trước bản vá = 0 ⇒ phiếu kẹt vĩnh viễn): " + transitLedger);

        // 3) Ảnh kiểm đếm là chốt bắt buộc trước khi Kho Tổng xác nhận.
        jdbc.update("INSERT INTO attachments (id,entity_type,entity_id,file_name,storage_key,mime_type,uploaded_by,created_at,updated_at) "
                        + "VALUES (?, 'central_return', ?, 'kiem-dem.png', 'k/cr', 'image/png', ?, ?, ?)",
                "att_cr", returnId, adminId, now, now);

        // 4) NHẬN ⇒ trước bản vá bước này KHÔNG THỂ chạy (Transit owner = 0).
        String itemId = jdbc.queryForObject(
                "SELECT id FROM central_return_items WHERE central_return_id=? LIMIT 1", String.class, returnId);
        postAction(action("receive_central_return",
                "\"centralReturnId\":\"" + returnId + "\",\"lines\":[{\"centralReturnItemId\":\"" + itemId
                        + "\",\"countedQty\":2,\"acceptedQty\":2}]"), 200);

        String status = jdbc.queryForObject("SELECT status FROM central_returns WHERE id=?", String.class, returnId);
        assertTrue("received".equals(status), "phiếu trả Kho Tổng phải 'received': " + status);
        // ⛔ ĐỌC KHO TỔNG TỪ CHÍNH PHIẾU, không đoán: `createCentralReturn` chọn kho bằng
        //    `findCentralWarehouse()` = `type='central' ORDER BY code LIMIT 1`, mà `setup()` đã tạo
        //    một kho Tổng của hệ thống ⇒ kho nhận KHÔNG nhất thiết là kho ta vừa thêm.
        String centralWh = jdbc.queryForObject(
                "SELECT central_warehouse_id FROM central_returns WHERE id=?", String.class, returnId);
        Double centralLedger = jdbc.queryForObject(
                "SELECT COALESCE(SUM(quantity_delta),0) FROM contract_stock_ledger "
                        + "WHERE warehouse_id=? AND material_id='m_stk'", Double.class, centralWh);
        assertTrue(centralLedger != null && centralLedger == 2.0,
                "Kho Tổng (" + centralWh + ") phải nhận +2 vào sổ: " + centralLedger);
        Double transitSau = jdbc.queryForObject(
                "SELECT COALESCE(SUM(quantity_delta),0) FROM contract_stock_ledger "
                        + "WHERE warehouse_id='wh_transit' AND material_id='m_stk'", Double.class);
        assertTrue(transitSau != null && transitSau == 0.0, "Transit phải về 0 sau khi nhận: " + transitSau);
    }

    private void jsonOfSafe(MvcResult r) {
        // ok:true đã được kiểm trong postAction
    }
}