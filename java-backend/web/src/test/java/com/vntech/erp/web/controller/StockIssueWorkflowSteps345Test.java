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

import jakarta.servlet.http.Cookie;
import java.time.Instant;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * TASK-133 — WF-XUATKHO-01 **BƯỚC ③④⑤** trên stack Java + H2 (MODE=MySQL):
 * <ol>
 *   <li><b>③ tiến hành xuất kho</b> — {@code issue_stock_confirm}: CHỈ chạy khi phiếu {@code approved}
 *       ⇒ LÚC NÀY mới ghi {@code stock_movements} (SMI) + {@code contract_stock_ledger} ⇒ {@code issued}.</li>
 *   <li><b>④ thủ kho xác nhận đã xuất đủ</b> — {@code confirm_stock_issue}: CHỈ {@code thu_kho}/{@code admin}
 *       ⇒ {@code completed} + {@code signed_at}.</li>
 *   <li><b>⑤ sinh GRN nhập kho khác</b> — {@code create_issue_grn}: CHỈ cần quyền TẠO, KHÔNG duyệt,
 *       chỉ khi phiếu đã {@code completed} ⇒ {@code grn_created}.</li>
 * </ol>
 *
 * <p><b>Bất biến quan trọng nhất</b> (nợ kỹ thuật đã đo — TASK-130/132): trước TASK-133,
 * {@code insertStockIssue} ghi luôn movement + ledger NGAY LÚC TẠO PHIẾU ⇒ trừ tồn kho ở bước ①,
 * trước cả khi chỉ huy trưởng duyệt. Test này KHẲNG ĐỊNH tồn kho KHÔNG đổi ở ①② và CHỈ đổi ở ③.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class StockIssueWorkflowSteps345Test {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbc;

    private final ObjectMapper om = new ObjectMapper();

    private static final String PROJECT = "p_s345";
    private static final String CONTRACT = "pc_s345";
    private static final String WAREHOUSE = "wh_s345";          // KHO DỰ ÁN (nguồn)
    private static final String TEAM_WAREHOUSE = "whteam_s345"; // KHO TỔ ĐỘI (đích bước ③)
    private static final String OTHER_WAREHOUSE = "wh_other_s345"; // kho khác — đích GRN bước ⑤
    private static final String MATERIAL = "m_s345";
    private static final String VERSION = "bv_s345";

    private Cookie adminCookie;
    private Cookie warehouseCookie;   // thủ kho dự án (thu_kho)
    private Cookie engineerCookie;    // vai trò KHÔNG được xuất / xác nhận

    private String adminId;

    private MvcResult postAs(Cookie cookie, String json, int expectStatus) throws Exception {
        var req = post("/api/system").contentType(MediaType.APPLICATION_JSON).content(json);
        if (cookie != null) req.cookie(cookie);
        MvcResult res = mockMvc.perform(req).andReturn();
        assertEquals(expectStatus, res.getResponse().getStatus(),
                "HTTP status không khớp cho " + json + " — body: " + abbrev(res.getResponse().getContentAsString()));
        if (expectStatus == 200) {
            String body = res.getResponse().getContentAsString();
            assertTrue(body.contains("\"ok\":true"), "action phải trả ok:true — body: " + abbrev(body));
        }
        return res;
    }

    private String action(String name, String fields) {
        return "{\"action\":\"" + name + "\"" + (fields.isEmpty() ? "" : "," + fields) + "}";
    }

    private static String abbrev(String s) {
        return s.length() > 400 ? s.substring(0, 400) + "…" : s;
    }

    private double balance(String warehouseId) {
        Double d = jdbc.queryForObject("""
                SELECT COALESCE(SUM(CASE WHEN to_warehouse_id=? THEN quantity ELSE 0 END)
                              -SUM(CASE WHEN from_warehouse_id=? THEN quantity ELSE 0 END),0)
                FROM stock_movements WHERE material_id=?""", Double.class, warehouseId, warehouseId, MATERIAL);
        return d == null ? 0 : d;
    }

    private double ledger(String warehouseId) {
        Double d = jdbc.queryForObject("""
                SELECT COALESCE(SUM(quantity_delta),0) FROM contract_stock_ledger
                WHERE project_id=? AND warehouse_id=? AND material_id=?""",
                Double.class, PROJECT, warehouseId, MATERIAL);
        return d == null ? 0 : d;
    }

    private String issueStatus(String issueId) {
        return jdbc.queryForObject("SELECT status FROM stock_issues WHERE id=?", String.class, issueId);
    }

    /** Seed: dự án + hợp đồng + kho nguồn + kho tổ đội + kho khác + vật tư + 2 tài khoản. */
    private void seed() throws Exception {
        MvcResult setup = postAs(null, action("setup",
                "\"companyName\":\"Công ty VNTECH\",\"fullName\":\"Quản trị viên\",\"username\":\"admin\","
                        + "\"password\":\"" + TestActors.PASSWORD + "\""), 201);
        adminCookie = setup.getResponse().getCookie("mep_session");
        adminId = jdbc.queryForObject("SELECT id FROM users WHERE username='admin'", String.class);
        Instant now = Instant.now();
        // `role_catalog` là DỮ LIỆU THAM CHIẾU có trên MySQL thật nhưng H2 KHÔNG nạp seed ⇒ `roleBase` của
        // tài khoản rơi về chính mã vai trò (`thu_kho`) và cổng VAI TRÒ `requireRole(["warehouse",…])`
        // sẽ 403 OAN. Seed đúng 2 dòng mà test này cần (khuôn `ProductionRoleCounterProofTest`).
        jdbc.update("INSERT INTO role_catalog (id,code,name,base_role,active,sort_order,system_locked,"
                        + "created_at,updated_at) VALUES (?,?,?,?,1,10,1,?,?)",
                "rc_thu_kho_s345", "thu_kho", "Thủ kho", "warehouse", now, now);
        jdbc.update("INSERT INTO role_catalog (id,code,name,base_role,active,sort_order,system_locked,"
                        + "created_at,updated_at) VALUES (?,?,?,?,1,20,1,?,?)",
                "rc_engineer_s345", "engineer", "Kỹ sư", "engineer", now, now);
        jdbc.update("INSERT INTO projects (id,code,name,status,manager_user_id,created_at,updated_at)"
                + " VALUES (?,?,?,'active',?,?,?)", PROJECT, "PRJ-S345", "Dự án S345", adminId, now, now);
        jdbc.update("INSERT INTO project_contracts (id,project_id,contract_no,contract_name,contract_type,"
                        + "status,is_primary,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)",
                CONTRACT, PROJECT, "HD-S345", "Hợp đồng S345", "main", "active", 1, now, now);
        jdbc.update("INSERT INTO warehouses (id,code,name,type,project_id,parent_warehouse_id,keeper_user_id,"
                        + "active,created_at,updated_at) VALUES (?,?,?,'site',?,'WH-CENTRAL',?,1,?,?)",
                WAREHOUSE, "KHO-S345", "Kho dự án S345", PROJECT, adminId, now, now);
        jdbc.update("INSERT INTO warehouses (id,code,name,type,project_id,parent_warehouse_id,keeper_user_id,"
                        + "active,created_at,updated_at) VALUES (?,?,?,'site',?,'WH-CENTRAL',?,1,?,?)",
                OTHER_WAREHOUSE, "KHO-KHAC-S345", "Kho khác S345", PROJECT, adminId, now, now);
        // Kho tổ đội KHÔNG gắn project (đúng dữ liệu thật: nhận movement SMI từ kho dự án).
        jdbc.update("INSERT INTO warehouses (id,code,name,type,project_id,parent_warehouse_id,keeper_user_id,"
                        + "active,created_at,updated_at) VALUES (?,?,?,'site',NULL,NULL,?,1,?,?)",
                TEAM_WAREHOUSE, "WHTEAM-S345", "Kho tổ đội S345", adminId, now, now);
        jdbc.update("INSERT INTO materials (id,code,name,unit,`system`,active,created_at,updated_at)"
                + " VALUES (?,?,?,?,?,1,?,?)", MATERIAL, "M-S345", "Vật tư S345", "cái", "DIEN", now, now);
        jdbc.update("INSERT INTO boq_versions (id,project_id,contract_id,version_no,version_code,version_name,"
                        + "revision_type,status,active,effective_at,created_at,updated_at)"
                        + " VALUES (?,?,?,1,'V1','BOQ V1','original','active',1,?,?,?)",
                VERSION, PROJECT, CONTRACT, now, now, now);
        jdbc.update("INSERT INTO teams (id,project_id,code,name,trade,warehouse_id,leader_user_id,active,"
                        + "created_at,updated_at) VALUES (?,?,?,?,'diện',?,?,1,?,?)",
                "team_s345", PROJECT, "TD-S345", "Tổ S345", TEAM_WAREHOUSE, adminId, now, now);
        // Nguồn tồn kho nguồn: 1 phiếu nhập đã ghi sổ +20 (movement GRN) + ledger +20.
        jdbc.update("INSERT INTO stock_movements (id,project_id,contract_id,destination_contract_id,material_id,"
                        + "from_warehouse_id,to_warehouse_id,movement_type,quantity,unit_cost,occurred_at,"
                        + "reference_type,reference_id,posted_by,reversal_of_id,created_at,updated_at)"
                        + " VALUES (?,?,?,NULL,?,'WH-CENTRAL',?, 'GRN',20,0,?,'goods_receipt','GRN-SEED',?,NULL,?,?)",
                "mov_seed_grn", PROJECT, CONTRACT, MATERIAL, WAREHOUSE, now, adminId, now, now);
        jdbc.update("INSERT INTO contract_stock_ledger (id,project_id,contract_id,warehouse_id,material_id,"
                        + "movement_type,quantity_delta,occurred_at,reference_type,reference_id,reference_item_id,"
                        + "counterparty_contract_id,actor_user_id,note,created_at)"
                        + " VALUES (?,?,?,?,?,'GRN',20,?,'goods_receipt','GRN-SEED',NULL,NULL,?,?,?)",
                "csl_seed_grn", PROJECT, CONTRACT, WAREHOUSE, MATERIAL, now, adminId, "Tồn đầu kỳ S345", now);

        // Tài khoản THỦ KHO (thu_kho) — người làm ③ và ④.
        TestActors.seedRequester(jdbc, "u_kho_s345", "kho.s345", "Thủ kho S345", "thu_kho",
                "Ban chỉ huy công trường", PROJECT, now);
        warehouseCookie = TestActors.login(mockMvc, "kho.s345");
        // Phạm vi KHO (write) — `canAccessWarehouse` của vai trò kho đòi hỏi dòng `user_warehouse_scopes`
        // cấp mức write trở lên cho CHÍNH kho thao tác (xem `AccessScopeService:87-97`).
        for (String whId : new String[]{WAREHOUSE, OTHER_WAREHOUSE}) {
            jdbc.update("INSERT INTO user_warehouse_scopes (id,user_id,warehouse_id,permission,created_at,"
                            + "updated_at) VALUES (?,?,?,'write',?,?)",
                    "uws_kho_" + whId, "u_kho_s345", whId, now, now);
        }
        // Tài khoản KỸ SƯ (engineer) — vai trò KHÔNG có quyền kho ⇒ nguồn của các đối chứng âm ③ và ④.
        TestActors.seedRequester(jdbc, "u_eng_s345", "eng.s345", "Kỹ sư S345", "engineer",
                "Phòng Kỹ thuật", PROJECT, now);
        engineerCookie = TestActors.login(mockMvc, "eng.s345");

        // Cổng MODULE (RbacService.requireActionModule) — dùng lại các khoá module SẴN CÓ, KHÔNG thêm khoá mới.
        for (String key : new String[]{"approvals", "warehouse_issue"}) {
            jdbc.update("INSERT INTO module_catalog (module_key,label,icon,active,sort_order,created_at,updated_at)"
                    + " SELECT ?,?, 'X',1,30,?,? WHERE NOT EXISTS"
                    + " (SELECT 1 FROM module_catalog WHERE module_key=?)", key, key, now, now, key);
        }
        // `u_kho_s345`: warehouse_issue (xuất kho + xác nhận đủ) với canEdit; receipts (tạo GRN) với canCreate.
        jdbc.update("INSERT INTO user_module_permissions (id,user_id,module_key,can_view,can_use,can_create,"
                        + "can_edit,can_approve,can_export,permission_source,created_at,updated_at)"
                        + " VALUES (?,?,'warehouse_issue',1,1,1,1,0,0,'manual_override',?,?)",
                "ump_kho_wi_s345", "u_kho_s345", now, now);
        jdbc.update("INSERT INTO user_module_permissions (id,user_id,module_key,can_view,can_use,can_create,"
                        + "can_edit,can_approve,can_export,permission_source,created_at,updated_at)"
                        + " VALUES (?,?,'receiving',1,1,1,1,0,0,'manual_override',?,?)",
                "ump_kho_rc_s345", "u_kho_s345", now, now);
        jdbc.update("INSERT INTO module_catalog (module_key,label,icon,active,sort_order,created_at,updated_at)"
                + " SELECT 'receiving','Nhận hàng','X',1,31,?,? WHERE NOT EXISTS"
                + " (SELECT 1 FROM module_catalog WHERE module_key='receiving')", now, now);
        // `u_eng_s345`: có quyền Ở TẦNG MODULE (để 403 của ca đối chứng CHẮC CHẮN đến từ cổng VAI TRÒ
        // `requireRole`, không phải cổng module — đúng cách TASK-132 đã làm cho bước ②).
        jdbc.update("INSERT INTO user_module_permissions (id,user_id,module_key,can_view,can_use,can_create,"
                        + "can_edit,can_approve,can_export,permission_source,created_at,updated_at)"
                        + " VALUES (?,?,'warehouse_issue',1,1,1,1,1,0,'manual_override',?,?)",
                "ump_eng_wi_s345", "u_eng_s345", now, now);
        jdbc.update("INSERT INTO user_module_permissions (id,user_id,module_key,can_view,can_use,can_create,"
                        + "can_edit,can_approve,can_export,permission_source,created_at,updated_at)"
                        + " SELECT ?,?,'receiving',1,1,1,1,1,0,'manual_override',?,? WHERE NOT EXISTS"
                        + " (SELECT 1 FROM user_module_permissions WHERE user_id=? AND module_key='receiving')",
                "ump_eng_rc_s345", "u_eng_s345", now, now, "u_eng_s345");

        // MR ĐÃ DUYỆT (nhu cầu 20) + 1 dòng MR — chèn MỘT LẦN (test gọi `createIssue()` 2 lượt trên cùng MR).
        jdbc.update("INSERT INTO material_requests (id,request_no,project_id,team_id,source_warehouse_id,"
                        + "requested_by,requested_at,needed_at,priority,area,status,approval_stage,"
                        + "total_estimated_value,supply_status,contract_id,boq_version_id,created_at,updated_at)"
                        + " VALUES (?,?,?,?,?,?,?,?,'normal','Khu A','approved',5,0,'awaiting_bch_confirmation',"
                        + "?,?,?,?)",
                "mr_s345", "DNMH-S345-0001", PROJECT, "team_s345", WAREHOUSE, adminId, now, now,
                CONTRACT, VERSION, now, now);
        jdbc.update("INSERT INTO material_request_items (id,request_id,line_no,material_id,requested_qty,"
                        + "issued_qty,installed_qty,line_status,delivered_qty,closed_qty,contract_id,"
                        + "boq_version_id,created_at,updated_at)"
                        + " VALUES (?,?,1,?,20,0,0,'delivered_pending_confirmation',20,0,?,?,?,?)",
                "mri_s345", "mr_s345", MATERIAL, CONTRACT, VERSION, now, now);

        // Dòng ĐẶT HÀNG (PO) của chính dòng nhu cầu trên — `goods_receipts.purchase_order_id` và
        // `goods_receipt_items.purchase_order_item_id` là NOT NULL và mọi truy vấn bootstrap đều
        // `JOIN purchase_orders` ⇒ bước ⑤ cần PO thật để GRN không bị VÔ HÌNH.
        jdbc.update("INSERT INTO suppliers (id,code,name,active,created_at,updated_at) VALUES (?,?,?,1,?,?)",
                "sup_s345", "NCC-S345", "Nhà cung cấp S345", now, now);
        jdbc.update("INSERT INTO purchase_orders (id,po_no,project_id,supplier_id,receiving_warehouse_id,"
                        + "buyer_user_id,ordered_at,status,total_value,request_id,created_at,updated_at)"
                        + " VALUES (?,?,?,?,?,?,?,'delivered_pending_confirmation',0,?,?,?)",
                "po_s345", "PO-S345-0001", PROJECT, "sup_s345", WAREHOUSE, adminId, now,
                "mr_s345", now, now);
        jdbc.update("INSERT INTO purchase_order_items (id,purchase_order_id,request_item_id,line_no,"
                        + "ordered_qty,unit_price,received_qty,delivered_qty,closed_qty,status,created_at,updated_at)"
                        + " VALUES (?,?,?,1,20,0,20,20,0,'delivered_pending_confirmation',?,?)",
                "poi_s345", "po_s345", "mri_s345", now, now);
    }

    /** Tạo 1 phiếu xuất 6/20 qua HTTP trên MR đã seed ⇒ trả về {@code issueId}. */
    private String createIssue() throws Exception {
        MvcResult res = postAs(warehouseCookie, action("issue_stock",
                "\"projectId\":\"" + PROJECT + "\",\"fromWarehouseId\":\"" + WAREHOUSE + "\","
                        + "\"teamId\":\"team_s345\",\"requestId\":\"mr_s345\","
                        + "\"receivedByName\":\"Tổ trưởng S345\","
                        + "\"lines\":[{\"materialId\":\"" + MATERIAL + "\",\"quantity\":6,"
                        + "\"requestItemId\":\"mri_s345\",\"contractId\":\"" + CONTRACT + "\"}]"), 200);
        JsonNode body = om.readTree(res.getResponse().getContentAsString());
        return body.path("issueId").asText();
    }

    @Test
    void steps345_fullFlow() throws Exception {
        seed();
        String issueId = createIssue();
        assertTrue(!issueId.isEmpty(), "issue_stock phải trả issueId");

        // ═════════ ①/② — BẤT BIẾN: CHƯA xuất kho thì TỒN KHO KHÔNG ĐƯỢC ĐỔI ═════════
        assertEquals("pending_cht", issueStatus(issueId), "① phiếu mới phải ở pending_cht");
        assertEquals(20.0, balance(WAREHOUSE), 1e-9,
                "① tạo phiếu KHÔNG được trừ tồn kho nguồn (nợ kỹ thuật TASK-133: trước đây trừ ngay ở ①)");
        assertEquals(0.0, balance(TEAM_WAREHOUSE), 1e-9, "① kho tổ đội chưa được nhận hàng");
        assertEquals(0, count("SELECT COUNT(*) FROM stock_movements WHERE reference_type='stock_issue'"
                + " AND reference_id=?", issueId), "① KHÔNG được sinh movement SMI khi mới tạo phiếu");

        // ĐỐI CHỨNG ÂM ③ — gọi `issue_stock_confirm` khi phiếu CHƯA được duyệt ⇒ 400.
        postAs(warehouseCookie, action("issue_stock_confirm", "\"issueId\":\"" + issueId + "\""), 400);
        postAs(adminCookie, action("approve_stock_issue",
                "\"issueId\":\"" + issueId + "\",\"decision\":\"approved\""), 200);
        assertEquals("approved", issueStatus(issueId), "② sau khi CHT duyệt phải là approved");
        assertEquals(20.0, balance(WAREHOUSE), 1e-9, "② duyệt KHÔNG được đụng vào tồn kho");

        // ═════════ ③ TIẾN HÀNH XUẤT KHO ═════════
        // ĐỐI CHỨNG ÂM ③a — vai trò KHÔNG có quyền kho (đã cấp đủ quyền module để 403 đến từ requireRole).
        postAs(engineerCookie, action("issue_stock_confirm", "\"issueId\":\"" + issueId + "\""), 403);
        // ĐỐI CHỨNG ÂM ③b — phiếu KHÔNG tồn tại ⇒ 400.
        postAs(warehouseCookie, action("issue_stock_confirm", "\"issueId\":\"ISS_khong-ton-tai\""), 400);

        postAs(warehouseCookie, action("issue_stock_confirm",
                "\"issueId\":\"" + issueId + "\",\"note\":\"Xuất kho theo phiếu đã duyệt (TASK-133 bước ③)\""), 200);
        assertEquals("issued", issueStatus(issueId), "③ xuất kho xong phải là issued");
        assertEquals(1, count("SELECT COUNT(*) FROM stock_movements WHERE movement_type='SMI'"
                + " AND reference_type='stock_issue' AND reference_id=?", issueId),
                "③ phải sinh ĐÚNG 1 movement SMI cho 1 dòng phiếu xuất");
        assertEquals(14.0, balance(WAREHOUSE), 1e-9, "③ tồn kho XUẤT phải GIẢM 20 → 14");
        assertEquals(6.0, balance(TEAM_WAREHOUSE), 1e-9, "③ tồn kho ĐÍCH (tổ đội) phải TĂNG 0 → 6");
        assertEquals(14.0, ledger(WAREHOUSE), 1e-9, "③ sổ Contract kho nguồn 20 → 14");
        assertEquals(6.0, ledger(TEAM_WAREHOUSE), 1e-9, "③ sổ Contract kho tổ đội 0 → 6");
        // ĐỐI CHỨNG ÂM ③c — xuất kho LẦN 2 ⇒ 400 và KHÔNG ghi thêm kho.
        postAs(warehouseCookie, action("issue_stock_confirm", "\"issueId\":\"" + issueId + "\""), 400);
        assertEquals(1, count("SELECT COUNT(*) FROM stock_movements WHERE movement_type='SMI'"
                + " AND reference_type='stock_issue' AND reference_id=?", issueId), "③ lần 2 KHÔNG ghi thêm movement");
        assertEquals(14.0, balance(WAREHOUSE), 1e-9, "③ lần 2 KHÔNG trừ tồn thêm");

        // ═════════ ④ THỦ KHO XÁC NHẬN ĐÃ XUẤT ĐỦ ═════════
        // ĐỐI CHỨNG ÂM ④a — vai trò KHÔNG phải thủ kho ⇒ 403.
        postAs(engineerCookie, action("confirm_stock_issue", "\"issueId\":\"" + issueId + "\""), 403);
        // ĐỐI CHỨNG ÂM ④b — phiếu KHÔNG tồn tại ⇒ 400.
        postAs(warehouseCookie, action("confirm_stock_issue", "\"issueId\":\"ISS_khong-ton-tai\""), 400);
        // ĐỐI CHỨNG ÂM ④c — phiếu CHƯA qua ③ ⇒ 400: tạo thêm 1 phiếu mới (mới chỉ pending_cht).
        String notIssuedId = createIssue();
        postAs(warehouseCookie, action("confirm_stock_issue", "\"issueId\":\"" + notIssuedId + "\""), 400);
        assertEquals("pending_cht", issueStatus(notIssuedId), "④ phiếu chưa qua ③ KHÔNG được đổi trạng thái");

        postAs(warehouseCookie, action("confirm_stock_issue",
                "\"issueId\":\"" + issueId + "\",\"comment\":\"Đã xuất đủ 6/6 (TASK-133 bước ④)\""), 200);
        assertEquals("completed", issueStatus(issueId), "④ xác nhận xong phải là completed");
        // ĐỐI CHỨNG ÂM ④d — xác nhận LẦN 2 ⇒ 400.
        postAs(warehouseCookie, action("confirm_stock_issue", "\"issueId\":\"" + issueId + "\""), 400);

        // ═════════ ⑤ SINH GRN NHẬP VÀO KHO KHÁC (chỉ cần quyền tạo, KHÔNG duyệt) ═════════
        // ĐỐI CHỨNG ÂM ⑤a — phiếu CHƯA xác nhận đủ ⇒ 400 (dùng phiếu `notIssuedId` đang pending_cht).
        postAs(warehouseCookie, action("create_issue_grn",
                "\"issueId\":\"" + notIssuedId + "\",\"toWarehouseId\":\"" + OTHER_WAREHOUSE + "\""), 400);
        // ĐỐI CHỨNG ÂM ⑤b — user KHÔNG có quyền tạo phiếu nhập ⇒ 403.
        // (Chưa thu hồi module `receiving` của kỹ sư ⇒ tạo tài khoản thứ 3 không có module nào.)
        Instant now = Instant.now();
        TestActors.seedRequester(jdbc, "u_none_s345", "none.s345", "Người không quyền", "engineer",
                "Phòng Kỹ thuật", PROJECT, now);
        Cookie noneCookie = TestActors.login(mockMvc, "none.s345");
        jdbc.update("DELETE FROM user_module_permissions WHERE user_id='u_none_s345'");
        postAs(noneCookie, action("create_issue_grn",
                "\"issueId\":\"" + issueId + "\",\"toWarehouseId\":\"" + OTHER_WAREHOUSE + "\""), 403);
        // ĐỐI CHỨNG ÂM ⑤c — phiếu không tồn tại ⇒ 400.
        postAs(warehouseCookie, action("create_issue_grn", "\"issueId\":\"ISS_khong-ton-tai\""), 400);

        MvcResult grn = postAs(warehouseCookie, action("create_issue_grn",
                "\"issueId\":\"" + issueId + "\",\"toWarehouseId\":\"" + OTHER_WAREHOUSE + "\","
                        + "\"note\":\"Nhập vào kho khác theo phiếu xuất (TASK-133 bước ⑤)\""), 200);
        JsonNode grnBody = om.readTree(grn.getResponse().getContentAsString());
        String receiptId = grnBody.path("receiptId").asText();
        String receiptNo = grnBody.path("receiptNo").asText();
        assertEquals("grn_created", issueStatus(issueId), "⑤ sinh GRN xong phải là grn_created");
        assertEquals(1, count("SELECT COUNT(*) FROM goods_receipts WHERE id=?", receiptId),
                "⑤ phải sinh ĐÚNG 1 header goods_receipts");
        assertEquals(OTHER_WAREHOUSE, jdbc.queryForObject(
                "SELECT warehouse_id FROM goods_receipts WHERE id=?", String.class, receiptId),
                "⑤ GRN phải nhập vào kho ĐÍCH đã chọn");
        assertEquals(1, count("SELECT COUNT(*) FROM goods_receipt_items WHERE receipt_id=?", receiptId),
                "⑤ GRN phải có 1 dòng vật tư cho 1 dòng phiếu xuất");
        assertEquals(0, count("SELECT COUNT(*) FROM approvals WHERE entity_type='goods_receipt'"
                + " AND entity_id=?", receiptId), "⑤ GRN theo phiếu xuất KHÔNG cần duyệt ⇒ 0 bản ghi approvals");
        // ĐỐI CHỨNG ÂM ⑤d — sinh GRN LẦN 2 ⇒ 400, KHÔNG sinh GRN thứ 2.
        postAs(warehouseCookie, action("create_issue_grn",
                "\"issueId\":\"" + issueId + "\",\"toWarehouseId\":\"" + OTHER_WAREHOUSE + "\""), 400);
        assertEquals(1, count("SELECT COUNT(*) FROM goods_receipts WHERE receipt_no=?", receiptNo),
                "⑤ lần 2 KHÔNG được sinh thêm phiếu nhập");

        // ═════════ NỢ #4 — cập nhật trạng thái PHIẾU ĐỀ NGHỊ ═════════
        Map<String, Object> mr = jdbc.queryForMap(
                "SELECT supply_status FROM material_requests WHERE id='mr_s345'");
        assertEquals("partial_issued", mr.get("supply_status"),
                "MR cấp 6/20 ⇒ supply_status phải là partial_issued");
        Map<String, Object> mri = jdbc.queryForMap(
                "SELECT issued_qty, line_status FROM material_request_items WHERE id='mri_s345'");
        assertEquals(new java.math.BigDecimal("6"),
                ((java.math.BigDecimal) mri.get("issued_qty")).stripTrailingZeros(),
                "issued_qty phải là 6 sau bước ③");
        assertEquals("partial_issued", mri.get("line_status"),
                "dòng MR cấp 6/20 ⇒ line_status phải là partial_issued");

        // ═════════ NỢ #5 — `supply_workflow_steps` KHÔNG được nhân dòng khi chạy 2 lần cùng 1 MR ═════════
        assertEquals(1, count("SELECT COUNT(*) FROM supply_workflow_steps WHERE request_id='mr_s345'"
                + " AND step='issue'"), "mỗi MR chỉ được có ĐÚNG 1 dòng step='issue'");
        // Phiếu xuất thứ 2 trên CÙNG MR ⇒ vẫn CHỈ 1 dòng step='issue' (nợ #5) và tổng cấp = 12/20.
        postAs(adminCookie, action("approve_stock_issue", "\"issueId\":\"" + notIssuedId + "\""), 200);
        postAs(warehouseCookie, action("issue_stock_confirm", "\"issueId\":\"" + notIssuedId + "\""), 200);
        assertEquals(1, count("SELECT COUNT(*) FROM supply_workflow_steps WHERE request_id='mr_s345'"
                + " AND step='issue'"), "xuất kho lần 2 cùng MR KHÔNG được nhân dòng supply_workflow_steps");
        assertEquals(12.0, balance(TEAM_WAREHOUSE), 1e-9, "③ phiếu thứ 2: tồn kho ĐÍCH 6 → 12");
        assertEquals(8.0, balance(WAREHOUSE), 1e-9, "③ phiếu thứ 2: tồn kho XUẤT 14 → 8");
        Map<String, Object> mr2 = jdbc.queryForMap(
                "SELECT supply_status FROM material_requests WHERE id='mr_s345'");
        assertEquals("partial_issued", mr2.get("supply_status"),
                "cấp 12/20 (2 phiếu × 6) ⇒ supply_status VẪN là partial_issued (CHƯA đủ)");
        assertEquals(new java.math.BigDecimal("12"),
                ((java.math.BigDecimal) jdbc.queryForMap(
                        "SELECT issued_qty FROM material_request_items WHERE id='mri_s345'").get("issued_qty"))
                        .stripTrailingZeros(),
                "issued_qty = 12 sau 2 phiếu (cộng DỒN ở bước ③, KHÔNG cộng ở bước ①)");
        assertEquals(adminId, jdbc.queryForObject(
                "SELECT approved_by FROM stock_issues WHERE id=?", String.class, issueId),
                "approved_by phải là người duyệt (① vẫn để NULL)");
    }

    private int count(String sql, Object... args) {
        Integer n = jdbc.queryForObject(sql, Integer.class, args);
        return n == null ? 0 : n;
    }
}
