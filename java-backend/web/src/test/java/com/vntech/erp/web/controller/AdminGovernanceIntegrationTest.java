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
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Nghiệm thu tự động ĐỢT P4 + P5 + P6 (xem docs/18 mục 9, 10, 11).
 *
 * Vì sao cần test này: các probe headless chỉ chứng minh được GIAO DIỆN và một vài API.
 * Ở đây kiểm chứng ở tầng dịch vụ + dữ liệu những hành vi KHÓ thấy bằng mắt:
 *   • workflow đa luồng: any_of / all_of / single và các trường hợp bị CHẶN,
 *   • ràng buộc phòng ban → người dùng, và điều quan trọng nhất: yêu cầu bị TỪ CHỐI
 *     KHÔNG được xoá quyền/phạm vi hiện có của người dùng,
 *   • cấp bậc auto_grant_all tự động cấp toàn quyền,
 *   • audit log ghi MỌI action thay đổi dữ liệu và KHÔNG ghi action đăng nhập.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class AdminGovernanceIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbc;

    private jakarta.servlet.http.Cookie adminCookie;
    private String adminId;
    private String deptId;
    private String staffId;

    // ---------- helpers ----------

    private MvcResult sendPost(String json, int expectStatus) throws Exception {
        var req = post("/api/system").contentType(MediaType.APPLICATION_JSON).content(json);
        if (adminCookie != null) req.cookie(adminCookie);
        var res = mockMvc.perform(req).andExpect(status().is(expectStatus)).andReturn();
        return res;
    }

    private MvcResult ok(String json) throws Exception {
        MvcResult r = sendPost(json, 200);
        assertTrue(r.getResponse().getContentAsString().contains("\"ok\":true"),
                "action phải ok:true — " + r.getResponse().getContentAsString());
        return r;
    }

    private void expectRejected(String json, String mustContain) throws Exception {
        MvcResult r = sendPost(json, 400);
        String body = r.getResponse().getContentAsString();
        assertTrue(body.contains(mustContain),
                "thông báo từ chối phải chứa \"" + mustContain + "\" — nhận được: " + body);
    }

    private static String a(String name, String fields) {
        return "{\"action\":\"" + name + "\"" + (fields == null || fields.isEmpty() ? "" : "," + fields) + "}";
    }

    /** Dữ liệu mẫu tối thiểu nhưng ĐỦ để đi qua đúng các use-case thật. */
    private void seed() throws Exception {
        MvcResult setup = sendPost(a("setup",
                "\"companyName\":\"Công ty VNTECH\",\"fullName\":\"Quản trị viên\",\"username\":\"admin\",\"password\":\"VnTech@123\""), 201);
        adminCookie = setup.getResponse().getCookie("mep_session");
        adminId = jdbc.queryForObject("SELECT id FROM users WHERE username='admin'", String.class);
        Instant now = Instant.now();

        // module_catalog: nguồn cho replaceDepartmentDefaults + cấp bậc auto_grant_all
        for (String[] m : new String[][]{
                {"requests", "Phiếu đề nghị mua hàng"}, {"purchasing", "Mua hàng & PO"},
                {"inventory", "Tồn kho & điều chuyển"}, {"dept_legal_hr", "Hồ sơ nhân sự"}}) {
            jdbc.update("INSERT INTO module_catalog (module_key,label,icon,active,sort_order,created_at,updated_at)"
                    + " VALUES (?,?,'X',1,10,?,?)", m[0], m[1], now, now);
        }
        // Phòng ban có cấu hình quyền (điều kiện để ràng buộc P5.3 kích hoạt)
        jdbc.update("INSERT INTO organization_units (id,code,name,unit_type,active,created_at,updated_at)"
                + " VALUES (?,?,?,'department',1,?,?)", "org_kh", "KH", "Phòng Kế hoạch", now, now);
        jdbc.update("INSERT INTO organization_units (id,code,name,unit_type,active,created_at,updated_at)"
                + " VALUES (?,?,?,'department',1,?,?)", "org_da", "DA", "Phòng Dự án", now, now);
        deptId = "org_kh";

        jdbc.update("INSERT INTO users (id,employee_code,full_name,username,role,department,organization_unit_id,"
                        + "approval_limit,active,must_change_password,system_level_code,created_at,updated_at)"
                        + " VALUES (?,?,?,?,?,?,?,0,1,0,NULL,?,?)",
                "u_staff", "NV-KH-01", "Nhân viên Kế hoạch", "kh.nv01", "kh_nv", "Phòng Kế hoạch", deptId, now, now);
        staffId = "u_staff";

        // Người dùng có sẵn phạm vi dự án + quyền — dùng để chứng minh KHÔNG mất dữ liệu khi bị chặn
        jdbc.update("INSERT INTO projects (id,code,name,status,manager_user_id,created_at,updated_at)"
                + " VALUES (?,?,?,'active',?,?,?)", "p_gov", "PRJ-GOV", "Dự án kiểm chứng", adminId, now, now);
        jdbc.update("INSERT INTO user_project_scopes (id,user_id,project_id,permission,created_at,updated_at)"
                + " VALUES ('ups_gov',?,?,'read',?,?)", staffId, "p_gov", now, now);

        // Quyền của phòng KH: CHỈ có 'requests' (KHÔNG có 'dept_legal_hr' ⇒ dùng để test chặn)
        jdbc.update("INSERT INTO department_module_permissions (id,organization_unit_id,module_key,"
                        + "can_view,can_use,can_create,can_edit,can_approve,can_export,active,created_at,updated_at)"
                        + " VALUES ('dmp_gov',?,'requests',1,1,1,1,1,1,1,?,?)", deptId, now, now);
        jdbc.update("INSERT INTO user_module_permissions (id,user_id,module_key,can_view,can_use,can_create,"
                        + "can_edit,can_approve,can_export,permission_source,created_at,updated_at)"
                        + " VALUES ('ump_gov',?,'requests',1,1,1,1,1,1,'manual_override',?,?)", staffId, now, now);

        // Tự kiểm chứng dữ liệu nền: nếu các dòng này không vào được thì mọi khẳng định phía sau vô nghĩa.
        assertEquals(4, count("SELECT COUNT(*) FROM module_catalog WHERE active=1"), "seed: module_catalog phải có 4 dòng");
        assertEquals(1, count("SELECT COUNT(*) FROM department_module_permissions WHERE organization_unit_id=?", deptId),
                "seed: quyền phòng ban phải có 1 dòng");
        assertEquals(1, count("SELECT COUNT(*) FROM user_project_scopes WHERE user_id=?", staffId), "seed: phạm vi dự án");
    }

    // ==================== P4 — WORKFLOW ĐA LUỒNG ====================

    @Test
    void workflow_multiLuong_anyOf_allOf_vaCacTruongHopBiChan() throws Exception {
        seed();
        String u1 = adminId;
        String u2 = staffId;

        // (1) Tạo quy trình 2 bước: bước 1 any_of (2 người), bước 2 all_of (2 người)
        ok(a("save_workflow",
                "\"code\":\"WF-GOV-01\",\"name\":\"Quy trình kiểm chứng\",\"moduleKey\":\"requests\","
                        + "\"stages\":[{\"stepNo\":1,\"name\":\"Bước một-trong-nhiều\",\"approvalMode\":\"any_of\",\"slaHours\":4,"
                        + "\"approverUserIds\":[\"" + u1 + "\",\"" + u2 + "\"]},"
                        + "{\"stepNo\":2,\"name\":\"Bước tất cả\",\"approvalMode\":\"all_of\",\"slaHours\":8,"
                        + "\"approverUserIds\":[\"" + u2 + "\",\"" + u1 + "\"]}]"));

        String wfId = jdbc.queryForObject("SELECT id FROM workflow_definitions WHERE code='WF-GOV-01'", String.class);
        assertEquals(2, count("SELECT COUNT(*) FROM workflow_steps WHERE workflow_id=?", wfId),
                "phải lưu đúng 2 bước");
        assertEquals("any_of", jdbc.queryForObject(
                "SELECT approval_mode FROM workflow_steps WHERE workflow_id=? AND step_no=1", String.class, wfId));
        assertEquals("all_of", jdbc.queryForObject(
                "SELECT approval_mode FROM workflow_steps WHERE workflow_id=? AND step_no=2", String.class, wfId));
        assertEquals(4, count("SELECT COUNT(*) FROM workflow_step_approvers a JOIN workflow_steps s ON s.id=a.step_id"
                + " WHERE s.workflow_id=?", wfId), "hai bước × hai người duyệt = 4 dòng");

        // (2) 'single' mà chỉ định 2 người ⇒ CHẶN
        expectRejected(a("save_workflow",
                        "\"code\":\"WF-GOV-BAD1\",\"name\":\"Sai single\",\"stages\":[{\"stepNo\":1,\"name\":\"Bước\","
                                + "\"approvalMode\":\"single\",\"approverUserIds\":[\"" + u1 + "\",\"" + u2 + "\"]}]"),
                "một người duyệt");

        // (3) Bước không có người duyệt ⇒ CHẶN
        expectRejected(a("save_workflow",
                        "\"code\":\"WF-GOV-BAD2\",\"name\":\"Thiếu người\",\"stages\":[{\"stepNo\":1,\"name\":\"Bước\","
                                + "\"approvalMode\":\"any_of\",\"approverUserIds\":[]}]"),
                "chưa chỉ định người duyệt");

        // (4) Chế độ xác nhận lạ ⇒ CHẶN
        expectRejected(a("save_workflow",
                        "\"code\":\"WF-GOV-BAD3\",\"name\":\"Sai chế độ\",\"stages\":[{\"stepNo\":1,\"name\":\"Bước\","
                                + "\"approvalMode\":\"linh_tinh\",\"approverUserIds\":[\"" + u1 + "\"]}]"),
                "không hợp lệ");

        // (5) Mã quy trình trùng ⇒ CHẶN
        expectRejected(a("save_workflow",
                        "\"code\":\"WF-GOV-01\",\"name\":\"Trùng mã\",\"stages\":[{\"stepNo\":1,\"name\":\"Bước\","
                                + "\"approvalMode\":\"single\",\"approverUserIds\":[\"" + u1 + "\"]}]"),
                "đã tồn tại");

        // (6) Xóa được quy trình thường (và xóa kéo theo bước + người duyệt)
        ok(a("delete_workflow", "\"workflowId\":\"" + wfId + "\""));
        assertEquals(0, count("SELECT COUNT(*) FROM workflow_steps WHERE workflow_id=?", wfId), "xóa phải kéo theo bước");
        assertEquals(0, count("SELECT COUNT(*) FROM workflow_step_approvers a WHERE a.step_id LIKE 'WFS-%'"
                + " AND a.step_id NOT IN (SELECT id FROM workflow_steps)"), "không được còn người duyệt mồ côi");
    }

    @Test
    void workflow_quyTrinhMacDinh_khongChoXoa() throws Exception {
        seed();
        Instant now = Instant.now();
        jdbc.update("INSERT INTO workflow_definitions (id,code,name,is_default,active,sort_order,created_at,updated_at)"
                + " VALUES ('WF-MUAHANG','WF-MUAHANG-01','Quy trình mặc định',1,1,10,?,?)", now, now);
        expectRejected(a("delete_workflow", "\"workflowId\":\"WF-MUAHANG\""), "mặc định");
    }

    // ==================== P5 — RÀNG BUỘC PHÒNG BAN + CẤP BẬC ====================

    @Test
    void phanQuyenPhongBan_chanVuotQuyen_vaKhongMatDuLieuKhiBiChan() throws Exception {
        seed();
        int scopesBefore = count("SELECT COUNT(*) FROM user_project_scopes WHERE user_id=?", staffId);
        int permsBefore = count("SELECT COUNT(*) FROM user_module_permissions WHERE user_id=?", staffId);
        assertEquals(1, scopesBefore);
        assertEquals(1, permsBefore);

        // Phòng KH CHƯA có 'dept_legal_hr' ⇒ cấp cho người dùng phải bị CHẶN
        expectRejected(a("save_user_access",
                        "\"userId\":\"" + staffId + "\",\"projectScopes\":[],\"warehouseScopes\":[],"
                                + "\"modulePermissions\":[{\"moduleKey\":\"dept_legal_hr\",\"canView\":1,\"canUse\":1}]"),
                "chưa được cấp quyền");

        // ĐIỀU QUAN TRỌNG NHẤT: yêu cầu bị từ chối KHÔNG được xoá dữ liệu hiện có.
        assertEquals(scopesBefore, count("SELECT COUNT(*) FROM user_project_scopes WHERE user_id=?", staffId),
                "phạm vi dự án KHÔNG được mất khi yêu cầu bị chặn");
        assertEquals(permsBefore, count("SELECT COUNT(*) FROM user_module_permissions WHERE user_id=?", staffId),
                "quyền chức năng KHÔNG được mất khi yêu cầu bị chặn");

        // Cấp quyền cho PHÒNG trước, sau đó cấp cho người dùng ⇒ phải THÀNH CÔNG
        ok(a("save_department_permission",
                "\"organizationUnitId\":\"" + deptId + "\",\"moduleKey\":\"dept_legal_hr\","
                        + "\"canView\":1,\"canUse\":1,\"canCreate\":1,\"canEdit\":1,\"canApprove\":0,\"canExport\":1"));
        ok(a("save_user_access",
                "\"userId\":\"" + staffId + "\",\"projectScopes\":[{\"projectId\":\"p_gov\",\"permission\":\"read\"}],"
                        + "\"warehouseScopes\":[],\"modulePermissions\":[{\"moduleKey\":\"dept_legal_hr\","
                        + "\"canView\":1,\"canUse\":1,\"canCreate\":1,\"canEdit\":1,\"canApprove\":0,\"canExport\":1}]"));
        assertTrue(count("SELECT COUNT(*) FROM user_module_permissions WHERE user_id=? AND module_key='dept_legal_hr'",
                staffId) > 0, "sau khi phòng được cấp quyền thì người dùng cấp được");

        // Thu hồi quyền của phòng ⇒ quyền mặc định của người dùng biến mất, NGOẠI LỆ cá nhân giữ nguyên
        ok(a("delete_department_permission",
                "\"organizationUnitId\":\"" + deptId + "\",\"moduleKey\":\"dept_legal_hr\""));
        assertEquals(0, count("SELECT COUNT(*) FROM user_module_permissions WHERE user_id=?"
                + " AND module_key='dept_legal_hr' AND permission_source='department_default'", staffId),
                "thu hồi quyền phòng phải xoá quyền mặc định tương ứng");
    }

    @Test
    void capBac_tuDongToanQuyen_vaChanXoaKhiDangCoNguoiGiu() throws Exception {
        seed();
        int modules = count("SELECT COUNT(*) FROM module_catalog WHERE active=1");

        // Tạo cấp bậc tự động toàn quyền
        ok(a("save_system_level",
                "\"code\":\"giam_doc_test\",\"name\":\"Giám đốc kiểm chứng\",\"rank\":40,"
                        + "\"autoGrantAll\":1,\"canSkipLevels\":1,\"sortOrder\":40"));
        assertEquals("giam_doc_test", jdbc.queryForObject(
                "SELECT code FROM system_level_catalog WHERE code='giam_doc_test'", String.class));

        // Gán cho người dùng ⇒ quyền mặc định phải phủ MỌI chức năng đang bật
        ok(a("set_user_system_level", "\"userId\":\"" + staffId + "\",\"levelCode\":\"giam_doc_test\""));
        Integer granted = jdbc.queryForObject("SELECT COUNT(*) FROM user_module_permissions"
                + " WHERE user_id=? AND permission_source='department_default' AND can_view=1", Integer.class, staffId);
        assertEquals(modules, granted == null ? 0 : granted,
                "cấp bậc auto_grant_all phải cấp quyền cho MỌI chức năng đang bật");

        // Cấp bậc này là NGOẠI LỆ: được cấp quyền mà phòng ban không có (không bị ràng buộc P5.3)
        ok(a("save_user_access",
                "\"userId\":\"" + staffId + "\",\"projectScopes\":[],\"warehouseScopes\":[],"
                        + "\"modulePermissions\":[{\"moduleKey\":\"purchasing\",\"canView\":1,\"canUse\":1}]"));

        // Đang có người giữ ⇒ CHẶN xóa
        String levelId = jdbc.queryForObject("SELECT id FROM system_level_catalog WHERE code='giam_doc_test'", String.class);
        expectRejected(a("delete_system_level", "\"levelId\":\"" + levelId + "\""), "đang giữ cấp bậc");

        // Chuyển người dùng sang cấp bậc khác rồi mới xóa được
        ok(a("set_user_system_level", "\"userId\":\"" + staffId + "\",\"levelCode\":\"\""));
        ok(a("delete_system_level", "\"levelId\":\"" + levelId + "\""));
        assertEquals(0, count("SELECT COUNT(*) FROM system_level_catalog WHERE code='giam_doc_test'"), "phải xóa được");
    }

    // ==================== P6 — AUDIT LOG ====================

    @Test
    void auditLog_ghiMoiThayDoi_vaKhongGhiDangNhap() throws Exception {
        seed();
        assertEquals(0, count("SELECT COUNT(*) FROM audit_logs"), "đầu kỳ chưa có nhật ký");

        // Đăng nhập lại: KHÔNG được sinh nhật ký
        sendPost(a("login", "\"username\":\"admin\",\"password\":\"VnTech@123\""), 200);
        assertEquals(0, count("SELECT COUNT(*) FROM audit_logs"), "login không được ghi nhật ký");

        // Thao tác thay đổi dữ liệu: PHẢI sinh nhật ký
        ok(a("save_department_permission",
                "\"organizationUnitId\":\"" + deptId + "\",\"moduleKey\":\"inventory\",\"canView\":1,\"canUse\":1"));
        assertTrue(count("SELECT COUNT(*) FROM audit_logs WHERE action='save_department_permission'") > 0,
                "save_department_permission phải được ghi nhật ký");

        List<Map<String, Object>> audits = jdbc.queryForList(
                "SELECT action,user_id,user_name,user_role,module_key,permission_used,change_detail,after_json"
                        + " FROM audit_logs WHERE action='save_department_permission' ORDER BY occurred_at DESC");
        Map<String, Object> row = audits.get(0);
        assertEquals(adminId, row.get("user_id"), "phải ghi đúng người thực hiện");
        assertFalse(String.valueOf(row.get("user_name")).isBlank(), "phải ghi TÊN người thực hiện");
        assertEquals("admin", row.get("user_role"), "phải ghi vai trò");
        assertEquals("canUse", row.get("permission_used"), "phải ghi quyền đã dùng");
        assertFalse(String.valueOf(row.get("change_detail")).isBlank(), "phải có mô tả thay đổi");
        assertTrue(String.valueOf(row.get("after_json")).contains("inventory"), "phải lưu dữ liệu gửi lên");

        // Action bị TỪ CHỐI (400) không được ghi như thành công
        int before = count("SELECT COUNT(*) FROM audit_logs");
        sendPost(a("delete_system_level", "\"levelId\":\"khong-ton-tai\""), 400);
        assertEquals(before, count("SELECT COUNT(*) FROM audit_logs"), "action thất bại không được ghi nhật ký");
    }

    private int count(String sql, Object... args) {
        Integer n = jdbc.queryForObject(sql, Integer.class, args);
        return n == null ? 0 : n;
    }
}
