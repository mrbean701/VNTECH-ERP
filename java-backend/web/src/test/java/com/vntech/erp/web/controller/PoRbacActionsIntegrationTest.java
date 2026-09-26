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

import jakarta.servlet.http.Cookie;
import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/**
 * TASK-135 — RBAC của 3 ACTION PO trên **stack Java + H2** (đúng đường HTTP mà probe LIVE đã đo).
 *
 * <p><b>Bằng chứng gốc (LIVE, jar 21/09 11:10)</b> — {@code tools/probe-wf-muahang-standard.mjs --apply}
 * bước {@code B6b}: {@code nvkhdemo} gọi {@code approve_po} ⇒ HTTP 403 «Thao tác chưa được khai báo quyền
 * trong hệ thống. Liên hệ quản trị viên.» trong khi {@code B6a create_po} của CÙNG user ⇒ 200
 * ⇒ user CÓ quyền ở module {@code purchasing}, chỉ action bị khai SAI (module rỗng).
 *
 * <p>Test này khoá lại ĐÚNG hành vi đó qua HTTP với 2 tài khoản:
 * <ul>
 *   <li>{@code kh.po135} — vai trò {@code procurement} + {@code purchasing} (can_use/can_edit/can_approve = 1)
 *       ⇒ 3 action PO phải ĐI QUA cổng RBAC (không còn 403 «chưa khai báo quyền»); lỗi còn lại (nếu có)
 *       phải là lỗi NGHIỆP VỤ 400 — dấu hiệu cổng quyền đã cho qua.</li>
 *   <li>{@code none.po135} — vai trò {@code procurement} nhưng ⛔ KHÔNG có quyền module nào
 *       ⇒ vẫn **403 CẤP QUYỀN** (đối chứng âm: cổng quyền KHÔNG bị nới lỏng).</li>
 * </ul>
 * ⛔ Không thêm khoá {@code module_catalog} mới: chỉ dùng khoá SẴN CÓ {@code purchasing}.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class PoRbacActionsIntegrationTest {

    private static final String RBAC_UNDECLARED =
            "Thao tác chưa được khai báo quyền trong hệ thống. Liên hệ quản trị viên.";
    private static final String RBAC_DENIED =
            "Tài khoản chưa được quản trị viên cấp đúng quyền cho thao tác này.";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbc;

    private Cookie hasPurchasing;
    private Cookie noPermission;

    private MvcResult postAs(Cookie cookie, String json) throws Exception {
        return mockMvc.perform(post("/api/system").contentType(MediaType.APPLICATION_JSON)
                .content(json).cookie(cookie)).andReturn();
    }

    private static String action(String name, String purchaseOrderId) {
        return "{\"action\":\"" + name + "\",\"purchaseOrderId\":\"" + purchaseOrderId + "\"}";
    }

    /** Seed: admin (setup) + `role_catalog` procurement + module_catalog `purchasing` + 2 tài khoản. */
    private void seed() throws Exception {
        MvcResult setup = mockMvc.perform(post("/api/system").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"action\":\"setup\",\"companyName\":\"Công ty VNTECH\","
                                + "\"fullName\":\"Quản trị viên\",\"username\":\"admin\",\"password\":\""
                                + TestActors.PASSWORD + "\"}"))
                .andReturn();
        assertEquals(201, setup.getResponse().getStatus(), "setup phải trả 201");
        Instant now = Instant.now();
        // `role_catalog` là dữ liệu THAM CHIẾU có trên MySQL thật nhưng H2 KHÔNG nạp seed (khuôn
        // `ProductionRoleCounterProofTest` / `StockIssueWorkflowSteps345Test`).
        jdbc.update("INSERT INTO role_catalog (id,code,name,base_role,active,sort_order,system_locked,"
                        + "created_at,updated_at) VALUES (?,?,?,?,1,10,1,?,?)",
                "rc_proc_135", "procurement", "Nhân viên mua hàng", "procurement", now, now);
        // Khoá module SẴN CÓ `purchasing` (KHÔNG thêm khoá mới). group_key = NULL ⇒ không phụ thuộc menu group.
        jdbc.update("INSERT INTO module_catalog (module_key,label,icon,active,sort_order,created_at,updated_at)"
                        + " SELECT 'purchasing','Mua hàng','X',1,20,?,? WHERE NOT EXISTS"
                        + " (SELECT 1 FROM module_catalog WHERE module_key='purchasing')", now, now);
        seedUser("u_kh_po135", "kh.po135", "Nhân viên mua hàng", now);
        seedUser("u_none_po135", "none.po135", "Người không quyền", now);
        // CHỈ `u_kh_po135` có quyền module `purchasing` — đủ cả 3 capability mà 3 action PO cần.
        jdbc.update("INSERT INTO user_module_permissions (id,user_id,module_key,can_view,can_use,can_create,"
                        + "can_edit,can_approve,can_export,permission_source,created_at,updated_at)"
                        + " VALUES (?,?,'purchasing',1,1,0,1,1,0,'manual_override',?,?)",
                "ump_kh_po135", "u_kh_po135", now, now);
        hasPurchasing = TestActors.login(mockMvc, "kh.po135");
        noPermission = TestActors.login(mockMvc, "none.po135");
    }

    private void seedUser(String id, String username, String fullName, Instant now) {
        jdbc.update("INSERT INTO users (id,employee_code,full_name,username,password_hash,role,department,"
                        + "approval_limit,active,must_change_password,created_at,updated_at)"
                        + " VALUES (?,?,?,?,?,?,?,0,1,0,?,?)",
                id, "NV-" + id, fullName, username, TestActors.passwordHash(TestActors.PASSWORD),
                "procurement", "Phòng Mua hàng", now, now);
    }

    /**
     * Khẳng định 1 action PO ĐI QUA cổng RBAC: HTTP KHÔNG được là 403 và thông điệp KHÔNG được là
     * «chưa khai báo quyền». Lỗi nghiệp vụ 400 (PO không tồn tại) là bằng chứng cổng quyền đã cho qua.
     */
    private void assertPassesRbacGate(String actionName, int expectedStatus, String expectedMessage)
            throws Exception {
        MvcResult res = postAs(hasPurchasing, action(actionName, "PO_KHONG_TON_TAI_135"));
        String body = res.getResponse().getContentAsString();
        assertFalse(body.contains(RBAC_UNDECLARED),
                actionName + " KHÔNG được trả «chưa khai báo quyền» — body: " + body);
        assertEquals(expectedStatus, res.getResponse().getStatus(),
                actionName + " phải đi qua cổng RBAC (400 lỗi nghiệp vụ, KHÔNG phải 403) — body: " + body);
        assertTrue(body.contains(expectedMessage),
                actionName + " phải báo đúng lỗi nghiệp vụ — body: " + body);
    }

    @Test
    void approvePo_userWithPurchasingCanApprove_passesRbacGate() throws Exception {
        seed();
        assertPassesRbacGate("approve_po", 400, "PO không tồn tại hoặc đã xử lý.");
    }

    @Test
    void rejectPo_userWithPurchasingCanApprove_passesRbacGate() throws Exception {
        seed();
        assertPassesRbacGate("reject_po", 400, "PO không tồn tại hoặc đã xử lý.");
    }

    @Test
    void updatePoPrice_userWithPurchasingCanEdit_passesRbacGate() throws Exception {
        seed();
        assertPassesRbacGate("update_po_price", 400, "PO không tồn tại.");
    }

    @Test
    void negativeControl_userWithoutPurchasingPermission_isStill403RbacDenied() throws Exception {
        seed();
        for (String actionName : new String[]{"approve_po", "reject_po", "update_po_price"}) {
            MvcResult res = postAs(noPermission, action(actionName, "PO_KHONG_TON_TAI_135"));
            String body = res.getResponse().getContentAsString();
            assertEquals(403, res.getResponse().getStatus(),
                    actionName + " của user KHÔNG có quyền phải là 403 — body: " + body);
            assertTrue(body.contains(RBAC_DENIED),
                    actionName + " phải là 403 CẤP QUYỀN (sau khi khai module), KHÔNG còn là «chưa khai báo quyền»"
                            + " — body: " + body);
        }
    }
}
