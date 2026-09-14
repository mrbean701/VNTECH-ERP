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
 * Integration test chuỗi TÀI CHÍNH + PHÁP CHẾ/HR (Phase 8–9):
 *   payment_plan (save → set_status → delete cấm khi paid) → advance (save → settle) →
 *   site_expense (save → approve) → bank → cashbook → voucher → hr_record →
 *   labor_contract (save → status) → correspondence → legal → seal → benefit.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class FinanceHrChainIntegrationTest {

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
                "p_fi", "PRJ-FI", "Dự án Tài chính", adminId, now, now);
    }

    @Test
    void financeHrChain() throws Exception {
        seed();
        String projectId = "p_fi";
        // ---- payment plan ----
        postAction(action("save_payment_plan",
                "\"projectId\":\"" + projectId + "\",\"milestone\":\"Đợt 1\",\"plannedDate\":\"2026-11-01\",\"plannedAmount\":100000000"), 200);
        String ppId = jdbc.queryForObject("SELECT id FROM payment_plans WHERE project_id=? LIMIT 1", String.class, projectId);
        assertTrue(!ppId.isEmpty(), "save_payment_plan phải tạo PPL");
        postAction(action("set_payment_plan_status",
                "\"planId\":\"" + ppId + "\",\"status\":\"paid\",\"paidAmount\":50000000"), 200);
        // ---- advance: save → settle ----
        postAction(action("save_advance_request",
                "\"projectId\":\"" + projectId + "\",\"requesterId\":\"" + adminId + "\",\"amount\":20000000,"
                        + "\"purpose\":\"Tạm ứng mua vật tư\",\"submit\":true"), 200);
        String advId = jdbc.queryForObject("SELECT id FROM advance_requests ORDER BY created_at DESC LIMIT 1", String.class);
        postAction(action("settle_advance_request",
                "\"requestId\":\"" + advId + "\",\"advancePaid\":20000000,\"settlementValue\":15000000"), 200);
        String advStatus = jdbc.queryForObject("SELECT status FROM advance_requests WHERE id=?", String.class, advId);
        assertTrue("settled".equals(advStatus), "advance phải settled: " + advStatus);
        // ---- site expense: save → approve ----
        postAction(action("save_site_expense_claim",
                "\"projectId\":\"" + projectId + "\",\"costType\":\"xăng\",\"amount\":500000,"
                        + "\"claimDate\":\"2026-09-15\",\"description\":\"Đổ xăng máy phát\",\"submit\":true"), 200);
        String secId = jdbc.queryForObject("SELECT id FROM site_expense_claims ORDER BY created_at DESC LIMIT 1", String.class);
        postAction(action("approve_site_expense_claim", "\"claimId\":\"" + secId + "\""), 200);
        // ---- bank + cashbook + voucher ----
        postAction(action("save_bank_account",
                "\"code\":\"VCB-DN\",\"bankName\":\"Vietcombank\",\"accountNo\":\"0123456789\",\"currency\":\"VND\",\"openingBalance\":0"), 200);
        String bankId = jdbc.queryForObject("SELECT id FROM bank_accounts WHERE code='VCB-DN'", String.class);
        postAction(action("save_cashbook_entry",
                "\"entryDate\":\"2026-09-16\",\"accountId\":\"" + bankId + "\",\"entryType\":\"OUT\",\"amount\":500000,"
                        + "\"counterparty\":\"Đại lý X\",\"note\":\"Chi xăng\""), 200);
        String cbId = jdbc.queryForObject("SELECT id FROM cashbook_entries ORDER BY created_at DESC LIMIT 1", String.class);
        assertTrue(!cbId.isEmpty(), "save_cashbook_entry phải tạo SQ");
        postAction(action("save_accounting_voucher",
                "\"voucherDate\":\"2026-09-16\",\"voucherType\":\"chi\",\"projectId\":\"" + projectId
                        + "\",\"description\":\"Chứng từ chi xăng\",\"totalAmount\":500000"), 200);
        // ---- HR + labor ----
        postAction(action("save_hr_record",
                "\"userId\":\"" + adminId + "\",\"fullName\":\"Quản trị viên\",\"identityNo\":\"012345678901\","
                        + "\"phone\":\"0900000000\",\"position\":\"Giám đốc\""), 200);
        postAction(action("save_labor_contract",
                "\"userId\":\"" + adminId + "\",\"contractType\":\"khong-thoi-han\",\"startDate\":\"2024-01-01\",\"salary\":25000000"), 200);
        String lbcId = jdbc.queryForObject("SELECT id FROM labor_contracts ORDER BY created_at DESC LIMIT 1", String.class);
        postAction(action("set_labor_contract_status", "\"contractId\":\"" + lbcId + "\",\"status\":\"active\""), 200);
        // ---- legal / seal / benefit ----
        postAction(action("save_legal_document",
                "\"docNo\":\"VB-001\",\"docType\":\"thong-tu\",\"title\":\"Thông tư hướng dẫn\",\"issueDate\":\"2026-01-01\""), 200);
        postAction(action("save_correspondence",
                "\"docNo\":\"CV-001\",\"direction\":\"IN\",\"docType\":\"cong-van\",\"summary\":\"KH gửi cv\""), 200);
        postAction(action("save_seal",
                "\"sealNo\":\"S01\",\"sealName\":\"Con dấu công ty\",\"sealType\":\"cong-dau\",\"custodian\":\"" + adminId + "\""), 200);
        postAction(action("save_benefit_record",
                "\"userId\":\"" + adminId + "\",\"benefitType\":\"bhxh\",\"provider\":\"BHXH Việt Nam\",\"monthlyAmount\":2500000"), 200);
    }
}