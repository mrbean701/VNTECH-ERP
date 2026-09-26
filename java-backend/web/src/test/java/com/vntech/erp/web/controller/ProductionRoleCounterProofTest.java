package com.vntech.erp.web.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vntech.erp.application.service.AuthUseCase;
import com.vntech.erp.application.service.ProductionManagementUseCase;
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
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * [TASK-117 / P-09] CA ĐỐI CHỨNG cho 5 call site {@code requireRole} của
 * {@code ProductionManagementUseCase} (save_team_subcontract / save_team_production /
 * approve_team_production / save_team_payment / settle_team_subcontract).
 *
 * <p><b>Vì sao cần:</b> {@code P09-FIX-PLAN.md} khẳng định 5 lời gọi dùng mã vai trò CŨ
 * ({@code admin/commander/accountant/project}) gây «từ chối oan» người dùng thật
 * ({@code cht} · {@code da_nv} · {@code da_truong} · {@code ksda}). {@code TASK-113} đính chính:
 * {@code RbacService.java:80} nay kiểm CẢ {@code user.role()} VÀ {@code user.roleBase()} nên
 * <b>chưa có bằng chứng tái hiện</b>. Kết luận chỉ được phép sau khi ĐO bằng H2:
 * <ul>
 *   <li>CA 1 — người dùng thật {@code role=cht} (chức danh thật, {@code role_catalog.base_role='commander'})
 *       ⇒ action {@code save_team_subcontract} ĐƯỢC phép (nếu bị 403 thì có «từ chối oan»).</li>
 *   <li>CA 2 — {@code role=engineer} (KHÔNG liên quan Xưởng sản xuất) NHƯNG ĐÃ có đủ quyền module
 *       {@code teams} + đã là thành viên dự án mức {@code write} ⇒ phải BỊ CHẶN bởi chính cổng
 *       {@code requireRole} (403 «Tài khoản không có quyền thực hiện nghiệp vụ này.»), KHÔNG phải
 *       bị chặn sớm ở cổng module.</li>
 *   <li>CA 3 — {@code role=cht} nhưng {@code base_role} bị cấu hình SAI ({@code 'engineer'} — fixture
 *       CỐ Ý sai, KHÔNG phải khuyến nghị) ⇒ mã chức danh thật trong danh sách cho phép phải cứu được
 *       (đây là chỗ 5 call site mã cũ từ chối oan).</li>
 * </ul>
 *
 * <p><b>Kỷ luật:</b> KHÔNG ca nào chạy bằng {@code admin} (chạy bằng admin sẽ che lỗi phân quyền —
 * {@code admin} được miễn mọi cổng nên test luôn xanh dù cổng sai).
 * Người dùng được seed bằng fixture cùng phong cách {@code TASK-115} (hash PBKDF2 + quyền module +
 * phạm vi dự án), {@code role_catalog} phải seed vì H2 không nạp dữ liệu tham chiếu của MySQL thật.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class ProductionRoleCounterProofTest {

    /** Nguyên văn thông điệp của {@code RbacService.requireRole} — dùng để khẳng định ĐÚNG cổng đã chặn. */
    private static final String MSG_ROLE_DENIED = "Tài khoản không có quyền thực hiện nghiệp vụ này.";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private ProductionManagementUseCase productionManagementUseCase;

    private final ObjectMapper om = new ObjectMapper();

    // ------------------------------------------------------------------ helpers

    private void call(String json, Cookie cookie, int expectStatus) throws Exception {
        var req = post("/api/system").contentType(MediaType.APPLICATION_JSON).content(json);
        if (cookie != null) req.cookie(cookie);
        MvcResult res = mockMvc.perform(req).andExpect(status().is(expectStatus)).andReturn();
        if (expectStatus != 200) {
            String body = res.getResponse().getContentAsString();
            assertTrue(body.contains(MSG_ROLE_DENIED),
                    "403 phải đến từ cổng requireRole (không phải cổng module) — body: " + abbrev(body));
        }
    }

    private String action(String name, String fields) {
        return "{\"action\":\"" + name + "\"" + (fields.isEmpty() ? "" : "," + fields) + "}";
    }

    private static String abbrev(String s) {
        return s.length() > 240 ? s.substring(0, 240) + "..." : s;
    }

    private String setupAdmin() throws Exception {
        MvcResult res = mockMvc.perform(post("/api/system").contentType(MediaType.APPLICATION_JSON)
                        .content(action("setup", "\"companyName\":\"Công ty VNTECH\",\"fullName\":\"Quản trị viên\","
                                + "\"username\":\"admin\",\"password\":\"" + TestActors.PASSWORD + "\"")))
                .andExpect(status().is(201)).andReturn();
        return jdbc.queryForObject("SELECT id FROM users WHERE username='admin'", String.class);
    }

    /**
     * Seed 1 người dùng KHÔNG phải admin, ĐỦ quyền module {@code teams} và đủ phạm vi dự án mức
     * {@code write} ⇒ mọi cổng khác đều qua, chỉ còn cổng {@code requireRole} quyết định.
     */
    private Cookie seedUser(String userId, String role, String department, String projectId, Instant now)
            throws Exception {
        jdbc.update("INSERT INTO users (id,employee_code,full_name,username,password_hash,role,department,"
                        + "approval_limit,active,must_change_password,created_at,updated_at)"
                        + " VALUES (?,?,?,?,?,?,?,0,1,0,?,?)",
                userId, "NV-" + userId, "Người dùng " + role, userId, TestActors.passwordHash(TestActors.PASSWORD),
                role, department, now, now);
        jdbc.update("INSERT INTO user_project_scopes (id,user_id,project_id,permission,created_at,updated_at)"
                + " VALUES (?,?,?,'write',?,?)", "ups_" + userId, userId, projectId, now, now);
        jdbc.update("INSERT INTO user_module_permissions (id,user_id,module_key,can_view,can_use,can_create,"
                        + "can_edit,can_approve,can_export,permission_source,created_at,updated_at)"
                        + " VALUES (?,?,'teams',1,1,1,1,1,0,'manual_override',?,?)",
                "ump_" + userId, userId, now, now);
        return TestActors.login(mockMvc, userId);
    }

    private void seedCatalog(Instant now) {
        jdbc.update("INSERT INTO module_catalog (module_key,label,icon,active,sort_order,system_locked,"
                + "created_at,updated_at) VALUES ('teams','Tổ đội & giao khoán','X',1,10,0,?,?)", now, now);
        // ĐÚNG 16 mã của MySQL thật (SELECT code, base_role FROM role_catalog) — rút gọn về 4 mã ca này dùng.
        for (String[] role : new String[][]{
                {"admin", "Quản trị viên", "admin"},
                {"cht", "Chỉ huy trưởng", "commander"},
                {"engineer", "Kỹ sư", "engineer"},
                {"accountant", "Kế toán", "accountant"}}) {
            jdbc.update("INSERT INTO role_catalog (id,code,name,base_role,active,sort_order,system_locked,"
                            + "created_at,updated_at) VALUES (?,?,?,?,1,10,1,?,?)",
                    "rc_" + role[0], role[0], role[1], role[2], now, now);
        }
    }

    /** Fixture dự án + tổ đội tối thiểu để {@code save_team_subcontract} đi qua được cổng phạm vi. */
    private void seedTeam(String projectId, String teamId, String adminId, Instant now) {
        jdbc.update("INSERT INTO projects (id,code,name,status,manager_user_id,created_at,updated_at)"
                + " VALUES (?,?,?,'active',?,?,?)", projectId, "PRJ-" + projectId, "Dự án " + projectId,
                adminId, now, now);
        jdbc.update("INSERT INTO teams (id,code,name,trade,project_id,warehouse_id,active,created_at,updated_at)"
                + " VALUES (?,?,?,'installation',?,?,1,?,?)", teamId, "T-" + teamId, "Tổ " + teamId,
                projectId, "wh_" + teamId, now, now);
    }

    private String payloadSubcontract(String projectId, String teamId, String contractNo) {
        return action("save_team_subcontract", "\"projectId\":\"" + projectId + "\",\"teamId\":\"" + teamId
                + "\",\"contractNo\":\"" + contractNo + "\",\"contractName\":\"HĐ giao khoán thử\","
                + "\"contractValue\":1000000");
    }

    private String seedMisconfiguredCatalog(String code, String name, String wrongBaseRole, Instant now) {
        jdbc.update("INSERT INTO role_catalog (id,code,name,base_role,active,sort_order,system_locked,"
                        + "created_at,updated_at) VALUES (?,?,?,?,1,20,1,?,?)",
                "rc_" + code + "_wrong", code, name, wrongBaseRole, now, now);
        return code;
    }

    // ------------------------------------------------------------------ CA 1

    /**
     * CA 1 — ĐỐI CHỨNG DƯƠNG: chức danh THẬT {@code cht} (Chỉ huy trưởng) ĐƯỢC phép.
     * Việc này khoá lại bất biến «người dùng thật của Xưởng sản xuất không bị từ chối oan».
     */
    @Test
    void productionRole_cht_duocPhep() throws Exception {
        Instant now = Instant.now();
        String adminId = setupAdmin();
        seedCatalog(now);
        seedTeam("p_cht", "t_cht", adminId, now);
        Cookie cht = seedUser("u_cht", "cht", "Ban chỉ huy", "p_cht", now);

        call(payloadSubcontract("p_cht", "t_cht", "TSC-CHT-01"), cht, 200);

        assertEquals(1, jdbc.queryForObject(
                        "SELECT COUNT(*) FROM team_subcontracts WHERE project_id='p_cht' AND contract_no='TSC-CHT-01'",
                        Integer.class),
                "cht phải ghi được HĐ giao khoán (đây là hành vi ĐÚNG, không phải từ chối oan)");
    }

    // ------------------------------------------------------------------ CA 2

    /**
     * CA 2 — ĐỐI CHỨNG ÂM: vai trò KHÔNG liên quan ({@code engineer}) phải BỊ CHẶN, và bị chặn bởi
     * ĐÚNG cổng {@code requireRole} (403 + nguyên văn thông điệp), không phải bị chặn sớm ở cổng module
     * — người dùng này ĐÃ có {@code canUse=1} cho module {@code teams} và phạm vi {@code write}.
     */
    @Test
    void productionRole_engineer_biChan() throws Exception {
        Instant now = Instant.now();
        String adminId = setupAdmin();
        seedCatalog(now);
        seedTeam("p_eng", "t_eng", adminId, now);
        Cookie eng = seedUser("u_eng", "engineer", "Ban chỉ huy", "p_eng", now);

        call(payloadSubcontract("p_eng", "t_eng", "TSC-ENG-01"), eng, 403);

        assertEquals(0, jdbc.queryForObject(
                        "SELECT COUNT(*) FROM team_subcontracts WHERE project_id='p_eng'",
                        Integer.class),
                "engineer KHÔNG được ghi HĐ giao khoán (không nới quyền sai)");
    }

    // ------------------------------------------------------------------ CA 3

    /**
     * CA 3 — ĐO ĐÚNG CHỖ HỞ CỦA 5 CALL SITE: {@code role=cht} nhưng {@code roleBase} KHÔNG cứu được
     * (ở ca này {@code role_catalog} CHỈ có dòng {@code cht→engineer} cấu hình SAI, nên
     * {@code effectiveRole(user)} = {@code 'engineer'} ∉ danh sách cho phép). Fixture CỐ Ý sai để mô
     * phỏng đúng tình huống {@code P09-FIX-PLAN} mô tả (lúc chỉ có mã ENGINE trong danh sách).
     *
     * <p>Trước khi sửa ⇒ {@code cht} bị 403 oan; sau khi sửa (thêm mã chức danh THẬT) ⇒ cứu được.
     * GHI RÕ: mã {@code cht} là dữ liệu THẬT của {@code role_catalog}; giá trị {@code base_role='engineer'}
     * là giả lập có chủ ý trong test, KHÔNG phải khuyến nghị cấu hình.
     */
    @Test
    void productionRole_cht_roleBaseSai_vanDuocPhep() throws Exception {
        Instant now = Instant.now();
        String adminId = setupAdmin();
        seedMisconfiguredCatalog("cht", "Chỉ huy trưởng (cấu hình sai)", "engineer", now);
        seedTeam("p_c3", "t_c3", adminId, now);
        jdbc.update("INSERT INTO module_catalog (module_key,label,icon,active,sort_order,system_locked,"
                + "created_at,updated_at) VALUES ('teams','Tổ đội & giao khoán','X',1,10,0,?,?)", now, now);
        Cookie cht = seedUser("u_c3", "cht", "Ban chỉ huy", "p_c3", now);

        call(payloadSubcontract("p_c3", "t_c3", "TSC-C3-01"), cht, 200);
    }

    // ------------------------------------------------------------------ CA 4

    /**
     * CA 4 — QUÉT CẢ 5 CALL SITE với {@code roleBase} = chính mã chức danh, {@code role='cht'}.
     *
     * <p><b>Vì sao dùng {@code roleBase='cht'} chứ không phải {@code ""}:</b> {@code RbacService.requireRole}
     * so {@code roles.contains(user.role())} HOẶC {@code roles.contains(user.roleBase())}; với
     * {@code roleBase=""} thì vế thứ hai rỗng nên kết quả y hệt {@code role='cht'}, {@code roleBase='cht'}.
     * Mà tầng web TRUYỀN XUỐNG ĐÚNG giá trị đó khi {@code role_catalog} cấu hình sai cho một mã chức danh
     * ({@code AuthUseCase:215} và 3 adapter dùng {@code COALESCE(rc.base_role, users.role)}) — đây là
     * kịch bản ĐO ĐƯỢC, khác với {@code roleBase=""} chỉ xảy ra khi tầng gọi quên truyền.
     *
     * <p><b>Điều khẳng định:</b> mỗi action phải VƯỢT cổng {@code requireRole} và dừng ở cổng nghiệp vụ
     * phía sau với thông điệp KHÁC ({@code requireRole} dùng đúng 1 câu cố định) ⇒ 5/5 call site đã nhận
     * mã chức danh THẬT. Trước khi sửa, cả 5 dừng ngay ở cổng vai trò với 403 «…nghiệp vụ này.».
     */
    @Test
    void productionRole_5CallSite_nhanMaChucDanhThat() {
        var cht = new ProductionManagementUseCase.Principal() {
            @Override public String userId() { return "u_c4"; }
            @Override public String role() { return "cht"; }
            @Override public String roleBase() { return "cht"; }
        };
        String projectId = "p_khong_ton_tai";
        String teamId = "t_khong_ton_tai";
        String subId = "tsc_khong_ton_tai";

        assertNotRoleDenied("save_team_subcontract", () ->
                productionManagementUseCase.saveTeamSubcontract(cht,
                        map("projectId", projectId, "teamId", teamId, "contractNo", "TSC-C4-01",
                                "contractName", "HĐ giao khoán thử", "contractValue", 1000000)));

        assertNotRoleDenied("save_team_production", () ->
                productionManagementUseCase.saveTeamProduction(cht,
                        map("projectId", projectId, "subcontractId", subId, "periodKey", "2026-09",
                                "description", "Sản lượng thử", "submittedValue", 100,
                                "approvedValue", 100)));

        assertNotRoleDenied("approve_team_production", () ->
                productionManagementUseCase.approveTeamProduction(cht,
                        map("productionId", "tpr_khong_ton_tai")));

        assertNotRoleDenied("save_team_payment", () ->
                productionManagementUseCase.saveTeamPayment(cht,
                        map("projectId", projectId, "subcontractId", subId, "amount", 100,
                                "paymentDate", "2026-09-20", "paymentType", "progress",
                                "description", "Thanh toán thử")));

        assertNotRoleDenied("settle_team_subcontract", () ->
                productionManagementUseCase.settleTeamSubcontract(cht,
                        map("subcontractId", subId)));
    }

    /**
     * CA 5 — ĐỐI CHỨNG ÂM THỨ HAI (chống NỚI QUYỀN QUÁ MỨC): vai trò {@code team} (Tổ đội — người NHẬN
     * giao khoán, không phải người LẬP/DUYỆT) với {@code roleBase} = chính mã chức danh ⇒ vẫn phải BỊ CHẶN.
     * Ca này khoá lại việc bản vá CHỈ thêm mã chức danh tương ứng đúng {@code base_role} đã duyệt
     * (cht→commander · da_nv/da_truong→project), KHÔNG mở cửa cho {@code team}/{@code engineer}/{@code warehouse}.
     */
    @Test
    void productionRole_team_vanBiChan() {
        var team = new ProductionManagementUseCase.Principal() {
            @Override public String userId() { return "u_c5"; }
            @Override public String role() { return "team"; }
            @Override public String roleBase() { return "team"; }
        };
        AuthUseCase.ApiError err = assertThrows(AuthUseCase.ApiError.class, () ->
                productionManagementUseCase.saveTeamProduction(team,
                        map("projectId", "p_team", "subcontractId", "tsc_team", "periodKey", "2026-09",
                                "description", "Sản lượng thử", "submittedValue", 100, "approvedValue", 100)));
        assertEquals(MSG_ROLE_DENIED, err.getMessage(),
                "vai trò team (tổ đội) KHÔNG được lập/duyệt sản lượng — bản vá không được nới quyền sai");
        assertEquals(403, err.status());
    }

    /** Chạy 1 lời gọi và khẳng định nó KHÔNG bị chặn bởi cổng {@code requireRole}. */
    private void assertNotRoleDenied(String action, java.util.function.Supplier<Object> call) {
        AuthUseCase.ApiError err = assertThrows(AuthUseCase.ApiError.class, call::get,
                action + ": phải đi tiếp qua cổng nghiệp vụ phía sau, không được dừng ở cổng vai trò");
        assertTrue(!MSG_ROLE_DENIED.equals(err.getMessage()),
                action + " vẫn bị TỪ CHỐI OAN ở cổng requireRole: " + err.getMessage());
    }

    private static java.util.HashMap<String, Object> map(Object... kv) {
        java.util.HashMap<String, Object> m = new java.util.HashMap<>();
        for (int i = 0; i < kv.length; i += 2) m.put(String.valueOf(kv[i]), kv[i + 1]);
        return m;
    }
}
