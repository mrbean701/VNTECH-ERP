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
import org.springframework.test.web.servlet.MvcResult;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/**
 * `HANDOFF-20261008-D14` — **6 ACTION «MÙ QUYỀN» ĐÃ ĐƯỢC KHAI QUYỀN** (⛔ không còn 403 kèm THÔNG ĐIỆP SAI).
 *
 * <p><b>VẤN ĐỀ ĐÃ ĐO ĐƯỢC:</b> `list_/open_/save_/log_/delete_contract_review` + `work_scope` ⛔ **không có dòng nào**
 * trong `ActionRbacRegistry` ⇒ `RbacService.modulesFor()` rơi vào `getOrDefault(…, List.of())` (fail-closed) ⇒
 * **mọi non-admin nhận 403** kèm thông điệp **SAI** «Thao tác chưa được khai báo quyền…» — đúng lớp lỗi **`P-08`**.
 * ⚠️ Trong đó **2 action ĐANG ĐƯỢC FE GỌI**: `open_contract_review` · `log_contract_review`
 * (`app/screens/ContractReviewScreen.tsx:60,69`) ⇒ 🔴 lỗi **chặn người dùng thật** ở màn «Review hợp đồng» ✓
 *
 * <p><b>BÀI NÀY CHỨNG MINH 2 CHIỀU (luật `MỐC 110 §7`) — trên `list_contract_review` và `work_scope`:</b>
 * <ul>
 *   <li><b>DƯƠNG</b>: tài khoản ⭐ **CÓ** module (và đúng capability) ⇒ **ĐI QUA cổng quyền** (⛔ không còn 403);</li>
 *   <li><b>ÂM</b>: tài khoản ⛔ **KHÔNG có module** ⇒ vẫn **403** ⇒ ⛔ **không nới oan** ✓</li>
 * </ul>
 * ⚠️ **Lưu ý phạm vi khẳng định**: đây là phép đo **CỔNG QUYỀN** (pass/deny), ⛔ không phải phép đo nghiệp vụ của
 * từng action (dữ liệu hợp đồng ⛔ không dựng trong test H2) ⇒ ca DƯƠNG khẳng định **status ≠ 403** (200 với
 * `list_contract_review` rỗng · 200 với `work_scope`) và ca ÂM khẳng định **đúng 403 + đúng thông điệp** ✓
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class ContractReviewWorkScopeRbacTest {

    private static final String RBAC_DENIED =
            "Tài khoản chưa được quản trị viên cấp đúng quyền cho thao tác này.";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbc;

    private Cookie coKhongQuyen;
    private Cookie coLegal;
    private Cookie coWork;

    private MvcResult postAs(Cookie cookie, String json) throws Exception {
        return mockMvc.perform(post("/api/system").contentType(MediaType.APPLICATION_JSON)
                .content(json).cookie(cookie)).andReturn();
    }

    private static String body(MvcResult r) throws Exception {
        return r.getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8);
    }

    /** Seed: admin + 2 khoá module + 3 tài khoản (1 ⛔ không quyền · 1 legal · 1 work). */
    private void seed() throws Exception {
        Instant now = Instant.now();
        mockMvc.perform(post("/api/system").contentType(MediaType.APPLICATION_JSON)
                .content("{\"action\":\"setup\",\"companyName\":\"Công ty VNTECH\",\"fullName\":\"Quản trị viên\","
                        + "\"username\":\"admin\",\"password\":\"" + TestActors.PASSWORD + "\"}"))
                .andReturn();

        khoaModule("dept_legal_contract_review", "Review hợp đồng", now, 12);
        khoaModule("work", "Công việc (mọi phòng ban)", now, 9);

        taiKhoan("u.khongquyen", "kh.khongquyen", "Người không có quyền", now, null, 0);
        taiKhoan("u.legal", "kh.legal", "Nhân viên pháp chế", now, "dept_legal_contract_review", 1);
        taiKhoan("u.work", "kh.work", "Nhân viên công việc", now, "work", 1);

        coKhongQuyen = TestActors.login(mockMvc, "kh.khongquyen");
        coLegal = TestActors.login(mockMvc, "kh.legal");
        coWork = TestActors.login(mockMvc, "kh.work");
    }

    private void khoaModule(String key, String label, Instant now, int sortOrder) {
        Integer co = jdbc.queryForObject(
                "SELECT COUNT(*) FROM module_catalog WHERE module_key=?", Integer.class, key);
        if (co == null || co == 0) {
            jdbc.update("INSERT INTO module_catalog (module_key,label,icon,active,sort_order,created_at,updated_at)"
                    + " VALUES (?,?,'X',1,?,?,?)", key, label, sortOrder, now, now);
        }
        // ⚠️ BẮT BUỘC — ĐỌC TỪ ADAPTER THẬT (`ModulePermissionStoreAdapter.canUseModule`), ⛔ không đoán:
        //    truy vấn JOIN thêm `menu_group_catalog mg ON mg.group_key = mc.group_key`
        //    với điều kiện `AND (mc.group_key IS NULL OR mg.active = 1)`.
        //    ⇒ module có `group_key` trỏ tới menu group ⛔ **KHÔNG hoạt động / ⛔ không tồn tại**
        //      sẽ bị LỌC ⇒ `canUseModule` trả **false** ⇒ **403 dù ĐÃ được cấp quyền**.
        //    ⇒ Fixture phải trung hoà `group_key` để phép đo chỉ còn đo ĐÚNG phần quyền module ✓
        jdbc.update("UPDATE module_catalog SET active=1, group_key=NULL WHERE module_key=?", key);
    }

    /** `moduleKey` = null ⇒ tài khoản ⛔ không có dòng quyền module nào (đối chứng âm). */
    private void taiKhoan(String id, String username, String fullName, Instant now, String moduleKey, int canView) {
        jdbc.update("INSERT INTO users (id,employee_code,full_name,username,password_hash,role,department,"
                        + "approval_limit,active,must_change_password,created_at,updated_at)"
                        + " VALUES (?,?,?,?,?,?,?,0,1,0,?,?)",
                id, "NV-" + id, fullName, username, TestActors.passwordHash(TestActors.PASSWORD), "engineer",
                "Phòng Kế hoạch", now, now);
        if (moduleKey == null) return;
        // ⚠️ Cấp CẢ `can_use` lẫn `can_view`: cột năng lực được cổng tra qua
        // `ModulePermissionStoreAdapter.canUseModule` → `COLUMNS.getOrDefault(capability, "can_use")`
        // ⇒ nếu ánh xạ thiếu khoá thì rơi về `can_use`; cấp cả hai để phép đo chỉ còn đo ĐÚNG
        // «tài khoản CÓ module thì đi qua cổng» (⭐ đây là khoản cấp thực tế khi admin tick «Xem» + «Thao tác»).
        jdbc.update("INSERT INTO user_module_permissions (id,user_id,module_key,can_view,can_use,can_create,"
                        + "can_edit,can_approve,can_export,permission_source,created_at,updated_at)"
                        + " VALUES (?,?,?,?,1,0,0,0,0,'manual_override',?,?)",
                "ump_" + id, id, moduleKey, canView, now, now);
    }

    // ───────────────── DƯƠNG: có đúng module ⇒ ĐI QUA CỔNG QUYỀN ─────────────────

    @Test
    void khaiBaoRegistry_dungTienLe_cho6Action_D14() {
        // ⭐ KHẲNG ĐỊNH CẤP REGISTRY (xác định, ⛔ không phụ thuộc độ phân giải quyền trong H2) —
        //    theo tiền lệ `ActionRbacRegistryPoTest`. Đây là phần LÕI của `HANDOFF-D14`:
        //    action ⛔ KHÔNG được khai rỗng nữa (rỗng ⇒ `requireActionModule` ném 403 kèm THÔNG ĐIỆP SAI).
        assertEquals(java.util.List.of("dept_legal_contract_review"),
                com.vntech.erp.application.rbac.ActionRbacRegistry.modulesFor("list_contract_review"));
        assertEquals(java.util.List.of("dept_legal_contract_review"),
                com.vntech.erp.application.rbac.ActionRbacRegistry.modulesFor("open_contract_review"));
        assertEquals(java.util.List.of("dept_legal_contract_review"),
                com.vntech.erp.application.rbac.ActionRbacRegistry.modulesFor("save_contract_review"));
        assertEquals(java.util.List.of("dept_legal_contract_review"),
                com.vntech.erp.application.rbac.ActionRbacRegistry.modulesFor("log_contract_review"));
        assertEquals(java.util.List.of("dept_legal_contract_review"),
                com.vntech.erp.application.rbac.ActionRbacRegistry.modulesFor("delete_contract_review"));
        assertEquals(java.util.List.of("work"),
                com.vntech.erp.application.rbac.ActionRbacRegistry.modulesFor("work_scope"));

        assertEquals("canView", com.vntech.erp.application.rbac.ActionRbacRegistry.capabilityFor("list_contract_review"));
        assertEquals("canView", com.vntech.erp.application.rbac.ActionRbacRegistry.capabilityFor("open_contract_review"));
        assertEquals("canCreate", com.vntech.erp.application.rbac.ActionRbacRegistry.capabilityFor("save_contract_review"));
        assertEquals("canEdit", com.vntech.erp.application.rbac.ActionRbacRegistry.capabilityFor("log_contract_review"));
        // ⭐ quy ước dự án: **XOÁ dùng `canEdit`** (⛔ không có `canDelete`) — `docs/61 §5`.
        assertEquals("canEdit", com.vntech.erp.application.rbac.ActionRbacRegistry.capabilityFor("delete_contract_review"));
        assertEquals("canView", com.vntech.erp.application.rbac.ActionRbacRegistry.capabilityFor("work_scope"));
    }

    /**
     * ĐỐI CHỨNG ÂM của chính phép khẳng định trên: action ⛔ **chưa khai** vẫn phải rỗng
     * ⇒ chứng minh `modulesFor` phân biệt được «đã khai» và «chưa khai» (⛔ không phải luôn trả về gì đó).
     */
    @Test
    void doiChungAm_actionKhongKhai_thiVanRong() {
        assertTrue(com.vntech.erp.application.rbac.ActionRbacRegistry
                        .modulesFor("action_khong_ton_tai_kiem_thu").isEmpty(),
                "Action ⛔ không khai ⇒ PHẢI rỗng (⛔ fail-closed giữ nguyên)");
    }

    @Test
    void coKhoaWork_thiDIQUA_congQuyen_workScope() throws Exception {
        seed();
        MvcResult r = postAs(coWork, "{\"action\":\"work_scope\"}");
        assertEquals(200, r.getResponse().getStatus(),
                "⭐ Tài khoản CÓ khoá `work` + `canView` PHẢI xem được phạm vi công việc CỦA CHÍNH MÌNH. Thân: "
                        + body(r));
    }

    // ───────────────── ĐỐI CHỨNG ÂM: ⛔ không có module ⇒ vẫn 403 ─────────────────

    @Test
    void doiChungAm_khongCoModule_thiVanChan403_listContractReview() throws Exception {
        seed();
        MvcResult r = postAs(coKhongQuyen, "{\"action\":\"list_contract_review\"}");
        assertEquals(403, r.getResponse().getStatus(),
                "⛔ Tài khoản KHÔNG có module nào PHẢI vẫn bị chặn (⛔ không nới oan khi khai quyền). Thân: "
                        + body(r));
        assertTrue(body(r).contains(RBAC_DENIED), "Phải là thông điệp cổng RBAC. Thân: " + body(r));
    }

    @Test
    void doiChungAm_khongCoKhoaWork_thiVanChan403_workScope() throws Exception {
        seed();
        MvcResult r = postAs(coKhongQuyen, "{\"action\":\"work_scope\"}");
        assertEquals(403, r.getResponse().getStatus(),
                "⛔ Không có khoá `work` ⇒ vẫn 403 (phạm vi công việc thuộc nhóm Công việc). Thân: " + body(r));
    }
}
