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

import java.time.Instant;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * MT3 §B.3 — «YÊU CẦU BỔ SUNG» ({@code request_supplement}): test DÀNH RIÊNG phủ ĐỦ 4 hành vi.
 *
 * <p>Trước test này, action chỉ mới được chứng minh «đúng kiểu + không hồi quy»; 4 hành vi dưới đây
 * là phần <b>CHƯA</b> từng được chứng minh:
 * <ol>
 *   <li><b>Lý do RỖNG ⇒ CHẶN</b> (400) — chặn ở BACKEND, ⛔ không tin frontend;</li>
 *   <li><b>KHÔNG phải owner của bước ⇒ CHẶN</b> — cổng {@code canApproveRequestStage};</li>
 *   <li><b>Gửi HỢP LỆ ⇒ trạng thái phiếu = {@code returned_to_requester}</b> — đúng luồng có sẵn,
 *       để người lập sửa rồi {@code resubmit_request};</li>
 *   <li><b>GỌI LẶP ⇒ CHẶN</b> — vì sau lần đầu trạng thái đã đổi khỏi {@code pending_approval}.</li>
 * </ol>
 *
 * <p>Khuôn dựng bài noi NGUYÊN {@code RequestApprovalIntegrationTest} (stack Java + H2, seed master data
 * trực tiếp bằng {@link JdbcTemplate}) — ⛔ không tạo cơ chế test mới.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class RequestSupplementIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbc;

    private jakarta.servlet.http.Cookie adminCookie;
    private jakarta.servlet.http.Cookie requesterCookie;

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

    private void seedRequester() throws Exception {
        TestActors.seedRequester(jdbc, "u_req", "kh.nv01", "Nhân viên Kế hoạch", "kh_nv",
                "Phòng Kế hoạch", "p_1", Instant.now());
        requesterCookie = TestActors.login(mockMvc, "kh.nv01");
    }

    /** Seed dự án + hợp đồng + vật tư + 2 bước duyệt; owner bước 1 = admin (giống bài kiểm thử luồng duyệt). */
    private void seedBusinessData() {
        Instant now = Instant.now();
        jdbc.update("INSERT INTO projects (id,code,name,status,created_at,updated_at) VALUES (?,?,?,'active',?,?)",
                "p_1", "PRJ-01", "Dự án 1", now, now);
        jdbc.update("INSERT INTO project_contracts (id,project_id,contract_no,contract_name,contract_type,status,is_primary,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)",
                "pc_1", "p_1", "HD-001", "Hợp đồng chính", "main", "active", 1, now, now);
        jdbc.update("INSERT INTO materials (id,code,name,unit,`system`,active,created_at,updated_at) VALUES (?,?,?,?,?,1,?,?)",
                "m_1", "M001", "Vật tư A", "cái", "DIEN", now, now);
        jdbc.update("INSERT INTO approval_stage_catalog (id,stage_no,name,allowed_role_codes,approval_mode,sla_hours,auto_approve_on_submit,active,sort_order,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                "stg_1", 1, "BCH / Chỉ huy trưởng", "engineer,commander,admin", "single", 8, 0, 1, 1, now, now);
        jdbc.update("INSERT INTO approval_stage_catalog (id,stage_no,name,allowed_role_codes,approval_mode,sla_hours,auto_approve_on_submit,active,sort_order,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                "stg_2", 2, "Phòng Dự án", "engineer,commander,project,admin", "single", 8, 0, 1, 2, now, now);
        String adminId = jdbc.queryForObject("SELECT id FROM users WHERE username='admin'", String.class);
        jdbc.update("INSERT INTO approval_project_assignments (id,project_id,stage,owner_user_id,active,created_at,updated_at) VALUES (?,?,?,?,1,?,?)",
                "apa_1", "p_1", 1, adminId, now, now);
        jdbc.update("INSERT INTO approval_project_assignments (id,project_id,stage,owner_user_id,active,created_at,updated_at) VALUES (?,?,?,?,1,?,?)",
                "apa_2", "p_1", 2, adminId, now, now);
    }

    /** Tạo 1 phiếu ĐANG CHỜ DUYỆT ở bước 1 (owner bước 1 = admin). */
    private String createPendingRequest() throws Exception {
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"action":"create_request","projectId":"p_1","neededAt":"2026-09-15",
                                 "area":"Tầng 1",
                                 "lines":[{"materialId":"m_1","quantity":10,"unitPrice":50000,
                                           "itemType":"outside_contract","note":"Phát sinh khối lượng ngoài hợp đồng"}]}""")
                        .cookie(requesterCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ok").value(true));
        String id = jdbc.queryForObject(
                "SELECT id FROM material_requests ORDER BY created_at DESC LIMIT 1", String.class);
        // TIỀN ĐỀ của test: phiếu phải đang chờ duyệt ở bước 1 (nếu không, các ca dưới vô nghĩa).
        String st = jdbc.queryForObject("SELECT status FROM material_requests WHERE id=?", String.class, id);
        String stage = jdbc.queryForObject("SELECT approval_stage FROM material_requests WHERE id=?", String.class, id);
        org.junit.jupiter.api.Assertions.assertEquals("pending_approval", st, "tiền đề: phiếu phải đang chờ duyệt");
        org.junit.jupiter.api.Assertions.assertEquals("1", stage, "tiền đề: phiếu phải ở bước 1");
        return id;
    }

    private String body(String requestId, int stage, String reason) {
        return "{\"action\":\"request_supplement\",\"requestId\":\"" + requestId + "\",\"stage\":" + stage
                + ",\"reason\":\"" + reason + "\"}";
    }

    @Test
    void requestSupplement_coversFourBehaviours() throws Exception {
        setupAdmin();
        seedBusinessData();
        seedRequester();
        String requestId = createPendingRequest();

        // ── ① LÝ DO RỖNG ⇒ CHẶN (400). ⛔ Backend là tầng cưỡng chế, ⛔ không tin frontend.
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(requestId, 1, ""))
                        .cookie(adminCookie))
                .andExpect(status().isBadRequest());
        // …và phiếu KHÔNG được đổi trạng thái vì lệnh đã bị chặn.
        org.junit.jupiter.api.Assertions.assertEquals("pending_approval",
                jdbc.queryForObject("SELECT status FROM material_requests WHERE id=?", String.class, requestId),
                "lệnh bị chặn ⛔ KHÔNG được đổi trạng thái phiếu");

        // ── ② NGƯỜI LẬP PHIẾU (không phải owner của bước) ⇒ BỊ CHẶN.
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(requestId, 1, "thiếu bản vẽ thi công"))
                        .cookie(requesterCookie))
                .andExpect(status().is4xxClientError());
        org.junit.jupiter.api.Assertions.assertEquals("pending_approval",
                jdbc.queryForObject("SELECT status FROM material_requests WHERE id=?", String.class, requestId),
                "người không có quyền ⛔ KHÔNG được đổi trạng thái phiếu");

        // ── ③ OWNER CỦA BƯỚC gửi HỢP LỆ ⇒ phiếu về ĐÚNG trạng thái luồng có sẵn.
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(requestId, 1, "Bổ sung bản vẽ thi công và CO/CQ vật tư"))
                        .cookie(adminCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ok").value(true))
                .andExpect(jsonPath("$.status").value("returned_to_requester"));
        String after = jdbc.queryForObject("SELECT status FROM material_requests WHERE id=?", String.class, requestId);
        org.junit.jupiter.api.Assertions.assertEquals("returned_to_requester", after,
                "MT3 §B.3: yêu cầu bổ sung phải đưa phiếu về «đã trả cho người lập» (luồng có sẵn)");
        // Trạng thái này là ĐIỀU KIỆN để `update_returned_request` chạy được ⇒ chứng minh nối đúng luồng.
        org.junit.jupiter.api.Assertions.assertEquals("0",
                jdbc.queryForObject("SELECT approval_stage FROM material_requests WHERE id=?", String.class, requestId),
                "phiếu phải được đưa về bước 0 để người lập sửa");

        // ── ④ GỌI LẶP ⇒ CHẶN (trạng thái đã đổi khỏi `pending_approval`).
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(requestId, 1, "gọi lại lần hai"))
                        .cookie(adminCookie))
                .andExpect(status().is4xxClientError());
        org.junit.jupiter.api.Assertions.assertEquals("returned_to_requester",
                jdbc.queryForObject("SELECT status FROM material_requests WHERE id=?", String.class, requestId),
                "gọi lặp ⛔ KHÔNG được đổi trạng thái lần nữa");
    }
}
