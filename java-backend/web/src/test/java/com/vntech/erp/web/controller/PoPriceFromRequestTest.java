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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * TASK-140 (b) — <b>F3 lỗi: PO phải giữ ĐƠN GIÁ của dòng phiếu đề nghị ⇒ `total_value` khác 0.</b>
 *
 * <p>Lỗi thật (đo LIVE): 9/9 PO có {@code purchase_orders.total_value=0.0000} và
 * {@code purchase_order_items.unit_price=0} trong khi dòng phiếu đề nghị CÓ
 * {@code material_request_items.estimated_unit_price} (ví dụ 350000). Nguyên nhân: {@code createPo} KHÔNG đọc
 * đơn giá của dòng phiếu và {@code insertPurchaseOrderWithItems} bind cứng {@code unit_price=0},
 * {@code purchase_orders.total_value=0}.
 *
 * <p><b>Bất biến được kiểm:</b>
 * <ol>
 *   <li>{@code purchase_order_items.unit_price} = {@code material_request_items.estimated_unit_price} của dòng gốc;</li>
 *   <li>{@code purchase_orders.total_value} = Σ({@code ordered_qty} × {@code unit_price}) — MỘT nguồn sự thật;</li>
 *   <li>dòng phiếu KHÔNG có đơn giá ⇒ PO ghi 0 (KHÔNG bịa giá) — phủ định kèm.</li>
 * </ol>
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class PoPriceFromRequestTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbc;

    private Cookie adminCookie;
    private Cookie requesterCookie;

    private String action(String name, String fields) {
        return "{\"action\":\"" + name + "\"" + (fields.isEmpty() ? "" : "," + fields) + "}";
    }

    private void seed() throws Exception {
        mockMvc.perform(post("/api/system").contentType(MediaType.APPLICATION_JSON)
                        .content(action("setup", "\"companyName\":\"Công ty VNTECH\",\"fullName\":\"Quản trị viên\","
                                + "\"username\":\"admin\",\"password\":\"VnTech@123\"")))
                .andExpect(status().isCreated());
        adminCookie = TestActors.login(mockMvc, "admin");
        Instant now = Instant.now();
        String adminId = jdbc.queryForObject("SELECT id FROM users WHERE username='admin'", String.class);
        jdbc.update("INSERT INTO projects (id,code,name,status,manager_user_id,created_at,updated_at)"
                + " VALUES ('p_po','PRJ-PO','Dự án PO','active',?,?,?)", adminId, now, now);
        // CỐ Ý KHÔNG seed `standard_price`: dòng phiếu không có đơn giá phải giữ 0, KHÔNG suy diễn giá.
        jdbc.update("INSERT INTO materials (id,code,name,unit,`system`,active,created_at,updated_at)"
                + " VALUES ('m_a','M-A','Vật tư A','cái','DIEN',1,?,?)", now, now);
        jdbc.update("INSERT INTO materials (id,code,name,unit,`system`,active,created_at,updated_at)"
                + " VALUES ('m_b','M-B','Vật tư B','cái','DIEN',1,?,?)", now, now);
        jdbc.update("INSERT INTO approval_stage_catalog (id,stage_no,name,allowed_role_codes,approval_mode,sla_hours,"
                        + "auto_approve_on_submit,active,sort_order,created_at,updated_at)"
                        + " VALUES ('stg_po_1',1,'BCH / Chỉ huy trưởng','engineer,commander,admin','single',8,0,1,1,?,?)",
                now, now);
        jdbc.update("INSERT INTO approval_project_assignments (id,project_id,stage,owner_user_id,active,created_at,updated_at)"
                + " VALUES ('apa_po_1','p_po',1,?,1,?,?)", adminId, now, now);
        jdbc.update("INSERT INTO warehouses (id,code,name,type,project_id,parent_warehouse_id,keeper_user_id,active,"
                        + "created_at,updated_at) VALUES ('wh_po','KHO-PO','Kho PO','site','p_po','WH-CENTRAL',?,1,?,?)",
                adminId, now, now);
        jdbc.update("INSERT INTO suppliers (id,code,name,active,created_at,updated_at)"
                + " VALUES ('sup_po','NCC-PO','Nhà cung cấp PO',1,?,?)", now, now);
        TestActors.seedRequester(jdbc, "u_req_po", "kh.nv.po", "Nhân viên Kế hoạch", "kh_nv",
                "Phòng Kế hoạch", "p_po", now);
        requesterCookie = TestActors.login(mockMvc, "kh.nv.po");
    }

    @Test
    void poGiuDonGiaVaTongGiaTriTuDongPhieuDeNghi() throws Exception {
        seed();
        // Dòng A: CÓ đơn giá 350000. Dòng B: KHÔNG có đơn giá (0) ⇒ phủ định kèm "KHÔNG bịa giá".
        mockMvc.perform(post("/api/system").contentType(MediaType.APPLICATION_JSON)
                        .content(action("create_request", "\"projectId\":\"p_po\",\"neededAt\":\"2026-10-01\","
                                + "\"area\":\"Tầng 1\",\"lines\":["
                                + "{\"materialId\":\"m_a\",\"quantity\":10,\"unitPrice\":350000,"
                                + "\"itemType\":\"outside_contract\",\"note\":\"Phát sinh\"},"
                                + "{\"materialId\":\"m_b\",\"quantity\":5,"
                                + "\"itemType\":\"outside_contract\",\"note\":\"Không có đơn giá\"}]"))
                        .cookie(requesterCookie))
                .andExpect(status().isOk());
        String requestId = jdbc.queryForObject(
                "SELECT id FROM material_requests WHERE project_id='p_po' ORDER BY created_at DESC LIMIT 1", String.class);

        // Nguồn sự thật của đơn giá: dòng phiếu đề nghị
        assertEquals(350000.0, jdbc.queryForObject(
                "SELECT estimated_unit_price FROM material_request_items WHERE request_id=? AND material_id='m_a'",
                Double.class, requestId), 1e-9, "dòng A của phiếu phải có đơn giá 350000");
        assertEquals(0.0, jdbc.queryForObject(
                "SELECT estimated_unit_price FROM material_request_items WHERE request_id=? AND material_id='m_b'",
                Double.class, requestId), 1e-9, "dòng B KHÔNG có đơn giá");

        // duyệt bước 1 (owner = admin) ⇒ MR approved
        mockMvc.perform(post("/api/system").contentType(MediaType.APPLICATION_JSON)
                        .content(action("decide_approval", "\"requestId\":\"" + requestId
                                + "\",\"stage\":1,\"decision\":\"approved\",\"comment\":\"OK\""))
                        .cookie(adminCookie))
                .andExpect(status().isOk());
        assertEquals("approved", jdbc.queryForObject(
                "SELECT status FROM material_requests WHERE id=?", String.class, requestId));

        String mriA = jdbc.queryForObject(
                "SELECT id FROM material_request_items WHERE request_id=? AND material_id='m_a'", String.class, requestId);
        String mriB = jdbc.queryForObject(
                "SELECT id FROM material_request_items WHERE request_id=? AND material_id='m_b'", String.class, requestId);
        mockMvc.perform(post("/api/system").contentType(MediaType.APPLICATION_JSON)
                        .content(action("create_po", "\"requestId\":\"" + requestId + "\",\"warehouseId\":\"wh_po\","
                                + "\"supplierId\":\"sup_po\",\"eta\":\"2026-10-05\","
                                + "\"availabilityOverrideReason\":\"Kiểm chứng TASK-140\",\"lines\":["
                                + "{\"requestItemId\":\"" + mriA + "\",\"quantity\":10,\"supplierId\":\"sup_po\","
                                + "\"plannedDeliveryAt\":\"2026-10-05\"},"
                                + "{\"requestItemId\":\"" + mriB + "\",\"quantity\":5,\"supplierId\":\"sup_po\","
                                + "\"plannedDeliveryAt\":\"2026-10-05\"}]"))
                        .cookie(adminCookie))
                .andExpect(status().isOk());
        String poId = jdbc.queryForObject(
                "SELECT id FROM purchase_orders WHERE request_id=? ORDER BY created_at DESC LIMIT 1", String.class, requestId);

        // ① ĐƠN GIÁ PO = ĐƠN GIÁ dòng phiếu đề nghị (KHÔNG còn 0)
        assertEquals(350000.0, jdbc.queryForObject(
                "SELECT unit_price FROM purchase_order_items WHERE purchase_order_id=? AND request_item_id=?",
                Double.class, poId, mriA), 1e-9, "đơn giá dòng A của PO phải = estimated_unit_price của phiếu");
        // ② phủ định kèm: dòng phiếu không có đơn giá ⇒ PO ghi 0 (KHÔNG bịa giá)
        assertEquals(0.0, jdbc.queryForObject(
                "SELECT unit_price FROM purchase_order_items WHERE purchase_order_id=? AND request_item_id=?",
                Double.class, poId, mriB), 1e-9, "dòng B không có đơn giá ⇒ PO phải ghi 0");

        // ③ total_value = Σ(ordered_qty × unit_price) — MỘT nguồn sự thật, KHÔNG còn 0
        Double total = jdbc.queryForObject(
                "SELECT total_value FROM purchase_orders WHERE id=?", Double.class, poId);
        Double derived = jdbc.queryForObject(
                "SELECT COALESCE(SUM(ordered_qty*unit_price),0) FROM purchase_order_items WHERE purchase_order_id=?",
                Double.class, poId);
        assertEquals(3500000.0, total, 1e-9, "total_value = 10×350000 + 5×0");
        assertEquals(derived, total, 1e-9, "total_value phải bằng Σ(ordered_qty×unit_price) của chính các dòng PO");
        assertTrue(total > 0, "PO phải có tổng giá trị > 0 khi dòng phiếu có đơn giá");

        // ④ sửa đơn giá PO ⇒ tổng vẫn khớp công thức dẫn xuất (không có nguồn sự thật thứ hai)
        String poiA = jdbc.queryForObject(
                "SELECT id FROM purchase_order_items WHERE purchase_order_id=? AND request_item_id=?",
                String.class, poId, mriA);
        mockMvc.perform(post("/api/system").contentType(MediaType.APPLICATION_JSON)
                        .content(action("update_po_price", "\"purchaseOrderId\":\"" + poId + "\",\"lines\":["
                                + "{\"purchaseOrderItemId\":\"" + poiA + "\",\"unitPrice\":400000}]"))
                        .cookie(adminCookie))
                .andExpect(status().isOk());
        assertEquals(4000000.0, jdbc.queryForObject(
                "SELECT total_value FROM purchase_orders WHERE id=?", Double.class, poId), 1e-9,
                "sau khi sửa giá: total_value = 10×400000");
    }
}
