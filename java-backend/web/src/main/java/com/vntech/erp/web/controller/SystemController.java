package com.vntech.erp.web.controller;

import com.vntech.erp.application.service.AdminOpsManagementUseCase;
import com.vntech.erp.application.service.AdminSystemUseCase;
import com.vntech.erp.application.service.AuthUseCase;
import com.vntech.erp.application.service.BoqManagementUseCase;
import com.vntech.erp.application.service.FinanceManagementUseCase;
import com.vntech.erp.application.service.HrManagementUseCase;
import com.vntech.erp.application.service.BootstrapUseCase;
import com.vntech.erp.application.service.ProjectContractUseCase;
import com.vntech.erp.application.service.MaterialCatalogManagementUseCase;
import com.vntech.erp.application.service.OpsTaskManagementUseCase;
import com.vntech.erp.application.service.ProductionManagementUseCase;
import com.vntech.erp.application.service.ProjectManagementUseCase;
import com.vntech.erp.application.service.PurchaseManagementUseCase;
import com.vntech.erp.application.service.RequestManagementUseCase;
import com.vntech.erp.application.service.StockManagementUseCase;
import com.vntech.erp.application.service.SystemSettingsUseCase;
import com.vntech.erp.application.service.SupplierManagementUseCase;
import com.vntech.erp.application.service.UserManagementUseCase;
import com.vntech.erp.web.security.SessionCookieFactory;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Gateway POST /api/system + GET /api/system — KHỚP contract monolith JS:
 *   GET  -> {ok, setupRequired} | {ok:false, authenticated:false} 401 | {ok, authenticated, data:bootstrap}
 *   POST -> {action, ...} => {ok:true,...} | {ok:false,error} (400/401/403/409/428/500)
 *   Cookie mep_session. Đây là seam giữ nguyên UI React SPA hiện tại.
 */
@RestController
@RequestMapping("/api/system")
public class SystemController {

    private final AuthUseCase authUseCase;
    private final SessionCookieFactory sessionCookieFactory;
    private final BootstrapUseCase bootstrapUseCase;
    private final BoqManagementUseCase boqManagementUseCase;
    private final FinanceManagementUseCase financeManagementUseCase;
    private final MaterialCatalogManagementUseCase materialCatalogManagementUseCase;
    private final HrManagementUseCase hrManagementUseCase;
    private final ProjectManagementUseCase projectManagementUseCase;
    private final ProjectContractUseCase projectContractUseCase;
    private final ProductionManagementUseCase productionManagementUseCase;
    private final OpsTaskManagementUseCase opsTaskManagementUseCase;
    private final PurchaseManagementUseCase purchaseManagementUseCase;
    private final UserManagementUseCase userManagementUseCase;
    private final AdminSystemUseCase adminSystemUseCase;
    private final AdminOpsManagementUseCase adminOpsManagementUseCase;
    private final RequestManagementUseCase requestManagementUseCase;
    private final SupplierManagementUseCase supplierManagementUseCase;
    private final StockManagementUseCase stockManagementUseCase;
    private final SystemSettingsUseCase systemSettingsUseCase;
    private final com.vntech.erp.infrastructure.excel.ExcelTemplateService excelTemplateService;
    /**
     * PHASE 0B (S-02) — kiểm quyền ở tầng action.
     * Trước đây KHÔNG được tiêm vào đây, nên ActionRbacRegistry chỉ dùng để ghi log.
     */
    private final com.vntech.erp.application.rbac.RbacService rbacService;
    /** TASK-023b — kiểm PHẠM VI dự án ở tầng web (đúng chú thích của ProjectContractUseCase). */
    private final com.vntech.erp.application.rbac.AccessScopeService accessScopeService;

    /** [WF] PHASE 8 (B1, 18/09) — bean cho CẢNH BÁO phê duyệt (CHỈ CẢNH BÁO, KHÔNG chặn).
     *  Dùng TIÊM TRƯỜNG để không phải sửa constructor dài; Spring tự tiêm theo kiểu. */
    @org.springframework.beans.factory.annotation.Autowired
    private com.vntech.erp.application.port.out.RequestStore requestStore;

    public SystemController(AuthUseCase authUseCase, SessionCookieFactory sessionCookieFactory,
                            BootstrapUseCase bootstrapUseCase,
                            BoqManagementUseCase boqManagementUseCase,
                            FinanceManagementUseCase financeManagementUseCase,
                            MaterialCatalogManagementUseCase materialCatalogManagementUseCase,
                            HrManagementUseCase hrManagementUseCase,
                            ProjectManagementUseCase projectManagementUseCase,
                            ProjectContractUseCase projectContractUseCase,
                            com.vntech.erp.application.rbac.AccessScopeService accessScopeService,
                            ProductionManagementUseCase productionManagementUseCase,
                            OpsTaskManagementUseCase opsTaskManagementUseCase,
                            PurchaseManagementUseCase purchaseManagementUseCase,
                            UserManagementUseCase userManagementUseCase,
                            AdminSystemUseCase adminSystemUseCase,
                            AdminOpsManagementUseCase adminOpsManagementUseCase,
                            RequestManagementUseCase requestManagementUseCase,
                            SupplierManagementUseCase supplierManagementUseCase,
                            StockManagementUseCase stockManagementUseCase,
                            SystemSettingsUseCase systemSettingsUseCase,
                            com.vntech.erp.infrastructure.excel.ExcelTemplateService excelTemplateService,
                            com.vntech.erp.application.rbac.RbacService rbacService) {
        this.authUseCase = authUseCase;
        this.sessionCookieFactory = sessionCookieFactory;
        this.bootstrapUseCase = bootstrapUseCase;
        this.boqManagementUseCase = boqManagementUseCase;
        this.financeManagementUseCase = financeManagementUseCase;
        this.materialCatalogManagementUseCase = materialCatalogManagementUseCase;
        this.hrManagementUseCase = hrManagementUseCase;
        this.projectManagementUseCase = projectManagementUseCase;
        this.projectContractUseCase = projectContractUseCase;
        this.productionManagementUseCase = productionManagementUseCase;
        this.opsTaskManagementUseCase = opsTaskManagementUseCase;
        this.purchaseManagementUseCase = purchaseManagementUseCase;
        this.userManagementUseCase = userManagementUseCase;
        this.adminSystemUseCase = adminSystemUseCase;
        this.adminOpsManagementUseCase = adminOpsManagementUseCase;
        this.requestManagementUseCase = requestManagementUseCase;
        this.supplierManagementUseCase = supplierManagementUseCase;
        this.stockManagementUseCase = stockManagementUseCase;
        this.systemSettingsUseCase = systemSettingsUseCase;
        this.excelTemplateService = excelTemplateService;
        this.rbacService = rbacService;
        this.accessScopeService = accessScopeService;
    }

    /**
     * Khai báo charset tường minh cho JSON.
     * Dù RFC 8259 quy định JSON luôn là UTF-8, nhiều công cụ/trình duyệt vẫn dựa vào
     * charset trong Content-Type; thiếu nó gây hiển thị sai tiếng Việt. Khai báo rõ
     * để loại bỏ hoàn toàn khả năng giải mã sai.
     */
    static final String JSON_UTF8 = "application/json;charset=UTF-8";

    @GetMapping(produces = JSON_UTF8)
    public ResponseEntity<?> get(HttpServletRequest request) {
        String templateAction = request.getParameter("action");
        if ("template".equals(templateAction)) {
            String kind = request.getParameter("kind");
            try {
                com.vntech.erp.infrastructure.excel.ExcelTemplateService.TemplateFile tf =
                        excelTemplateService.generate(kind);
                return ResponseEntity.ok()
                        .header("Content-Disposition", "attachment; filename=\"" + tf.filename() + "\"")
                        .contentType(org.springframework.http.MediaType
                                .parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                        .body(tf.content());
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(json(Map.of("ok", false,
                        "error", "Loại template không hợp lệ: " + kind)));
            }
        }
        if (!authUseCase.isSetupComplete()) {
            return ResponseEntity.ok(json(Map.of("ok", true, "setupRequired", true)));
        }
        Optional<AuthUseCase.CurrentUser> user = authUseCase.currentUser(currentToken(request), Instant.now());
        if (user.isEmpty()) {
            return ResponseEntity.status(401).body(json(Map.of("ok", false, "authenticated", false)));
        }
        // JS isAdmin(user) = (COALESCE(rc.base_role,u.role)==='admin' || u.role==='admin')
        // (system-route.mjs:210) — bản Java trước đây CHỈ so `users.role` nên một vai trò
        // tuỳ biến có base_role='admin' bị coi là người dùng thường (lệch quyền bootstrap).
        boolean isAdmin = "admin".equals(user.get().roleBase()) || "admin".equals(user.get().role());
        Map<String, Object> data = bootstrapUseCase.load(user.get().id(), isAdmin,
                user.get().role(), user.get().roleBase(), user.get().warehouseScopeKind(),
                user.get().department());
        // user + profile nằm trong data (như JS bootstrap trả về)
        Map<String, Object> userMap = new LinkedHashMap<>();
        userMap.put("id", user.get().id());
        userMap.put("fullName", user.get().fullName());
        userMap.put("username", user.get().username());
        userMap.put("role", user.get().role());
        userMap.put("roleBase", user.get().roleBase());
        userMap.put("roleName", user.get().roleName());
        // SỬA LỖI (đường ĐỌC thứ 11 — hồ sơ TASK-051): JS trả đủ 10 trường của `user`
        // (system-route.mjs:181/189 `SELECT … rc.warehouse_scope_kind AS warehouseScopeKind,
        // u.must_change_password AS mustChangePassword`), bản Java CHỈ trả 8 ⇒ thiếu 2 khoá.
        // Hệ quả thật: `app/page.tsx:565` đọc `data.user.mustChangePassword` để MỞ modal bắt
        // đổi mật khẩu ngay sau khi đăng nhập ⇒ giá trị `undefined` làm modal KHÔNG BAO GIỜ hiện.
        userMap.put("warehouseScopeKind", user.get().warehouseScopeKind());
        userMap.put("mustChangePassword", user.get().mustChangePassword());
        data.put("user", userMap);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("ok", true);
        body.put("authenticated", true);
        body.put("data", data);
        return ResponseEntity.ok(body);
    }

    @PostMapping(produces = JSON_UTF8, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> post(@RequestBody Map<String, Object> payload,
                                                    HttpServletRequest request,
                                                    HttpServletResponse response) {
        String action = trim(payload.get("action"));
        try {
            // ================= PHASE 0B — KIỂM QUYỀN Ở TẦNG ACTION (ĐIỂM KIỂM DUY NHẤT) =====
            // Trước đây ActionRbacRegistry (module + quyền của từng action) CHỈ được dùng
            // trong AuditTrailFilter để GHI LOG, KHÔNG dùng để CHẶN. Hệ quả: 12 use case
            // không có rbac.requireRole(...) bị hở hoàn toàn — bất kỳ tài khoản đã đăng nhập
            // đều gọi được. Đã chứng minh bằng tools/probe-security-rbac.mjs: 15/15 action
            // lọt qua kiểm quyền, trong đó create_self_work_item trả HTTP 200 và ghi vào DB.
            //
            // Hành động CÔNG KHAI được miễn: login/setup chạy trước khi có phiên; logout /
            // đổi mật khẩu / tự đổi ảnh là việc tự phục vụ của chính người dùng.
            if (!action.isEmpty()
                    && !com.vntech.erp.application.rbac.RbacService.PUBLIC_ACTIONS.contains(action)) {
                rbacService.requireActionModule(requireCurrentUser(request), action);
            }
            switch (action) {
                case "setup" -> {
                    AuthUseCase.SetupResult result = authUseCase.setup(
                            trim(payload.get("companyName")), trim(payload.get("fullName")),
                            trim(payload.get("username")), trim(payload.get("email")), trim(payload.get("password")));
                    response.setHeader("Set-Cookie", sessionCookieFactory.create(result.session().token()));
                    return ResponseEntity.status(201).body(json(Map.of("ok", true)));
                }
                case "login" -> {
                    String username = trim(payload.get("username"));
                    String ip = clientIp(request);
                    // Lockout 10 lần/15 phút — kiểm tra TRƯỚC khi xử lý (như universal-server)
                    if (!username.isBlank() && authUseCase.isLoginLocked(ip, username)) {
                        return ResponseEntity.status(429).body(json(Map.of("ok", false,
                                "error", "Tạm khóa đăng nhập 15 phút do nhập sai quá nhiều lần.")));
                    }
                    AuthUseCase.LoginResult result = authUseCase.login(
                            username, trim(payload.get("password")), ip, request.getHeader("User-Agent"));
                    response.setHeader("Set-Cookie", sessionCookieFactory.create(result.session().token()));
                    return ResponseEntity.ok(json(Map.of("ok", true,
                            "mustChangePassword", result.mustChangePassword())));
                }
                case "logout" -> {
                    authUseCase.logout(currentToken(request));
                    response.setHeader("Set-Cookie", sessionCookieFactory.clear());
                    return ResponseEntity.ok(json(Map.of("ok", true)));
                }
                case "change_password" -> {
                    // Giống JS: chỉ được chạy khi đã đăng nhập (cho phép cả khi cờ 428)
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    authUseCase.changePassword(cu.id(), trim(payload.get("currentPassword")),
                            trim(payload.get("newPassword")), sha256OfToken(currentToken(request)));
                    return ResponseEntity.ok(json(Map.of("ok", true, "message", "Đã đổi mật khẩu thành công.")));
                }
                case "revoke_session" -> {
                    AuthUseCase.CurrentUser cu = requireRequireAdmin(request);
                    String message = authUseCase.revokeSession(trim(payload.get("sessionId")));
                    return ResponseEntity.ok(json(Map.of("ok", true, "message", message)));
                }
                case "revoke_user_sessions" -> {
                    AuthUseCase.CurrentUser cu = requireRequireAdmin(request);
                    String message = authUseCase.revokeUserSessions(trim(payload.get("userId")));
                    return ResponseEntity.ok(json(Map.of("ok", true, "message", message)));
                }
                case "update_profile_avatar" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    String message = authUseCase.updateProfileAvatar(cu.id(), trim(payload.get("avatarDataUrl")));
                    return ResponseEntity.ok(json(Map.of("ok", true, "message", message)));
                }
                case "create_project" -> {
                    AuthUseCase.CurrentUser cu = requireRequireAdmin(request);
                    String message = projectManagementUseCase.createProject(asPrincipal(cu), payload);
                    return ResponseEntity.ok(json(Map.of("ok", true, "message", message)));
                }
                case "update_project" -> {
                    AuthUseCase.CurrentUser cu = requireRequireAdmin(request);
                    String message = projectManagementUseCase.updateProject(asPrincipal(cu), payload);
                    return ResponseEntity.ok(json(Map.of("ok", true, "message", message)));
                }
                case "set_project_status" -> {
                    AuthUseCase.CurrentUser cu = requireRequireAdmin(request);
                    String message = projectManagementUseCase.setProjectStatus(asPrincipal(cu), payload);
                    return ResponseEntity.ok(json(Map.of("ok", true, "message", message)));
                }
                case "delete_project" -> {
                    AuthUseCase.CurrentUser cu = requireRequireAdmin(request);
                    Map<String, Object> result = projectManagementUseCase.deleteProject(asPrincipal(cu), payload);
                    Map<String, Object> body = new LinkedHashMap<>();
                    body.put("ok", true);
                    body.putAll(result);
                    return ResponseEntity.ok(body);
                }
                case "save_project_contract" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    String projectId = trim(payload.get("projectId"));
                    // JS 801.
                    accessScopeService.requireProjectAccess(cu.id(), cu.role(), projectId, true,
                            "Không có quyền sửa hợp đồng dự án này.");
                    Map<String, Object> result = projectContractUseCase.saveProjectContract(projectId, payload);
                    Map<String, Object> resp = new LinkedHashMap<>();
                    resp.put("ok", true);
                    resp.putAll(result);
                    return ResponseEntity.ok(resp);
                }
                case "set_project_contract_status" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    String m = projectContractUseCase.setProjectContractStatus(
                            asProjectContractPrincipal(cu), trim(payload.get("contractId")),
                            toActiveFlag(payload.get("active")));
                    return ResponseEntity.ok(json(Map.of("ok", true, "message", m)));
                }
                case "delete_project_contract" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    String m = projectContractUseCase.deleteProjectContract(
                            asProjectContractPrincipal(cu), trim(payload.get("contractId")), payload);
                    return ResponseEntity.ok(json(Map.of("ok", true, "message", m)));
                }
                case "save_engine_role_profile" -> {
                    AuthUseCase.CurrentUser cu = requireRequireAdmin(request);
                    String m = adminSystemUseCase.saveEngineRoleProfile(asAdminPrincipal(cu), payload);
                    return ResponseEntity.ok(json(Map.of("ok", true, "message", m)));
                }
                case "save_business_scope" -> {
                    AuthUseCase.CurrentUser cu = requireRequireAdmin(request);
                    String m = adminSystemUseCase.saveBusinessScope(asAdminPrincipal(cu), payload);
                    return ResponseEntity.ok(json(Map.of("ok", true, "message", m)));
                }
                case "set_business_scope_status" -> {
                    AuthUseCase.CurrentUser cu = requireRequireAdmin(request);
                    String m = adminSystemUseCase.setBusinessScopeStatus(asAdminPrincipal(cu), payload);
                    return ResponseEntity.ok(json(Map.of("ok", true, "message", m)));
                }
                case "delete_business_scope" -> {
                    AuthUseCase.CurrentUser cu = requireRequireAdmin(request);
                    String m = adminSystemUseCase.deleteBusinessScope(asAdminPrincipal(cu), payload);
                    return ResponseEntity.ok(json(Map.of("ok", true, "message", m)));
                }
                case "save_business_role_group" -> {
                    AuthUseCase.CurrentUser cu = requireRequireAdmin(request);
                    String m = adminSystemUseCase.saveBusinessRoleGroup(asAdminPrincipal(cu), payload);
                    return ResponseEntity.ok(json(Map.of("ok", true, "message", m)));
                }
                case "set_business_role_group_status" -> {
                    AuthUseCase.CurrentUser cu = requireRequireAdmin(request);
                    String m = adminSystemUseCase.setBusinessRoleGroupStatus(asAdminPrincipal(cu), payload);
                    return ResponseEntity.ok(json(Map.of("ok", true, "message", m)));
                }
                case "delete_business_role_group" -> {
                    AuthUseCase.CurrentUser cu = requireRequireAdmin(request);
                    String m = adminSystemUseCase.deleteBusinessRoleGroup(asAdminPrincipal(cu), payload);
                    return ResponseEntity.ok(json(Map.of("ok", true, "message", m)));
                }
                case "reorder_menu_layout" -> {
                    AuthUseCase.CurrentUser cu = requireRequireAdmin(request);
                    String m = adminSystemUseCase.reorderMenuLayout(asAdminPrincipal(cu), payload);
                    return ResponseEntity.ok(json(Map.of("ok", true, "message", m)));
                }
                case "reorder_form_fields" -> {
                    AuthUseCase.CurrentUser cu = requireRequireAdmin(request);
                    String m = adminSystemUseCase.reorderFormFields(asAdminPrincipal(cu), payload);
                    return ResponseEntity.ok(json(Map.of("ok", true, "message", m)));
                }
                case "create_user" -> {
                    AuthUseCase.CurrentUser cu = requireRequireAdmin(request);
                    String message = userManagementUseCase.createUser(asUserPrincipal(cu), payload);
                    return ResponseEntity.ok(json(Map.of("ok", true, "message", message)));
                }
                case "update_user" -> {
                    AuthUseCase.CurrentUser cu = requireRequireAdmin(request);
                    String message = userManagementUseCase.updateUser(asUserPrincipal(cu), payload);
                    return ResponseEntity.ok(json(Map.of("ok", true, "message", message)));
                }
                case "set_user_status" -> {
                    AuthUseCase.CurrentUser cu = requireRequireAdmin(request);
                    String message = userManagementUseCase.setUserStatus(asUserPrincipal(cu), payload);
                    return ResponseEntity.ok(json(Map.of("ok", true, "message", message)));
                }
                case "reset_user_password" -> {
                    AuthUseCase.CurrentUser cu = requireRequireAdmin(request);
                    Map<String, Object> result = userManagementUseCase.resetUserPassword(asUserPrincipal(cu), payload);
                    Map<String, Object> body = new LinkedHashMap<>();
                    body.put("ok", true);
                    body.putAll(result);
                    return ResponseEntity.ok(body);
                }
                case "delete_user" -> {
                    AuthUseCase.CurrentUser cu = requireRequireAdmin(request);
                    String message = userManagementUseCase.deleteUser(asUserPrincipal(cu), payload);
                    return ResponseEntity.ok(json(Map.of("ok", true, "message", message)));
                }
                case "save_user_access" -> {
                    AuthUseCase.CurrentUser cu = requireRequireAdmin(request);
                    String message = userManagementUseCase.saveUserAccess(asUserPrincipal(cu), payload);
                    return ResponseEntity.ok(json(Map.of("ok", true, "message", message)));
                }
                case "delete_user_module_override" -> {
                    AuthUseCase.CurrentUser cu = requireRequireAdmin(request);
                    String message = userManagementUseCase.deleteUserModuleOverride(asUserPrincipal(cu), payload);
                    return ResponseEntity.ok(json(Map.of("ok", true, "message", message)));
                }
                // ---- P5: phân quyền phòng ban + cấp bậc hệ thống ----
                case "save_department_permission" -> {
                    AuthUseCase.CurrentUser cu = requireRequireAdmin(request);
                    String message = userManagementUseCase.saveDepartmentPermission(asUserPrincipal(cu), payload);
                    return ResponseEntity.ok(json(Map.of("ok", true, "message", message)));
                }
                case "delete_department_permission" -> {
                    AuthUseCase.CurrentUser cu = requireRequireAdmin(request);
                    String message = userManagementUseCase.deleteDepartmentPermission(asUserPrincipal(cu), payload);
                    return ResponseEntity.ok(json(Map.of("ok", true, "message", message)));
                }
                case "rebuild_department_permissions" -> {
                    AuthUseCase.CurrentUser cu = requireRequireAdmin(request);
                    String message = userManagementUseCase.rebuildDepartmentPermissions(asUserPrincipal(cu), payload);
                    return ResponseEntity.ok(json(Map.of("ok", true, "message", message)));
                }
                case "save_system_level" -> {
                    AuthUseCase.CurrentUser cu = requireRequireAdmin(request);
                    String message = userManagementUseCase.saveSystemLevel(asUserPrincipal(cu), payload);
                    return ResponseEntity.ok(json(Map.of("ok", true, "message", message)));
                }
                case "set_system_level_status" -> {
                    AuthUseCase.CurrentUser cu = requireRequireAdmin(request);
                    String message = userManagementUseCase.setSystemLevelStatus(asUserPrincipal(cu), payload);
                    return ResponseEntity.ok(json(Map.of("ok", true, "message", message)));
                }
                case "delete_system_level" -> {
                    AuthUseCase.CurrentUser cu = requireRequireAdmin(request);
                    String message = userManagementUseCase.deleteSystemLevel(asUserPrincipal(cu), payload);
                    return ResponseEntity.ok(json(Map.of("ok", true, "message", message)));
                }
                case "set_user_system_level" -> {
                    AuthUseCase.CurrentUser cu = requireRequireAdmin(request);
                    String message = userManagementUseCase.setUserSystemLevel(asUserPrincipal(cu), payload);
                    return ResponseEntity.ok(json(Map.of("ok", true, "message", message)));
                }
                case "system_level_impact" -> {
                    AuthUseCase.CurrentUser cu = requireRequireAdmin(request);
                    Map<String, Object> result = userManagementUseCase.systemLevelImpact(asUserPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "save_role_catalog" -> {
                    AuthUseCase.CurrentUser cu = requireRequireAdmin(request);
                    String message = userManagementUseCase.saveRoleCatalog(asUserPrincipal(cu), payload);
                    return ResponseEntity.ok(json(Map.of("ok", true, "message", message)));
                }
                case "set_role_status" -> {
                    AuthUseCase.CurrentUser cu = requireRequireAdmin(request);
                    String message = userManagementUseCase.setRoleStatus(asUserPrincipal(cu), payload);
                    return ResponseEntity.ok(json(Map.of("ok", true, "message", message)));
                }
                case "delete_role_catalog" -> {
                    AuthUseCase.CurrentUser cu = requireRequireAdmin(request);
                    String message = userManagementUseCase.deleteRoleCatalog(asUserPrincipal(cu), payload);
                    return ResponseEntity.ok(json(Map.of("ok", true, "message", message)));
                }
                case "save_organization_unit" -> {
                    AuthUseCase.CurrentUser cu = requireRequireAdmin(request);
                    String m = adminSystemUseCase.saveOrganizationUnit(asAdminPrincipal(cu), payload);
                    return ResponseEntity.ok(json(Map.of("ok", true, "message", m)));
                }
                case "set_organization_unit_status" -> {
                    AuthUseCase.CurrentUser cu = requireRequireAdmin(request);
                    String m = adminSystemUseCase.setOrganizationUnitStatus(asAdminPrincipal(cu), payload);
                    return ResponseEntity.ok(json(Map.of("ok", true, "message", m)));
                }
                case "set_organization_unit_member" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    String m = adminSystemUseCase.setOrganizationUnitMember(asAdminPrincipal(cu), payload);
                    return ResponseEntity.ok(json(Map.of("ok", true, "message", m)));
                }
                case "save_menu_group" -> {
                    AuthUseCase.CurrentUser cu = requireRequireAdmin(request);
                    String m = adminSystemUseCase.saveMenuGroup(asAdminPrincipal(cu), payload);
                    return ResponseEntity.ok(json(Map.of("ok", true, "message", m)));
                }
                case "set_menu_group_status" -> {
                    AuthUseCase.CurrentUser cu = requireRequireAdmin(request);
                    String m = adminSystemUseCase.setMenuGroupStatus(asAdminPrincipal(cu), payload);
                    return ResponseEntity.ok(json(Map.of("ok", true, "message", m)));
                }
                case "delete_menu_group" -> {
                    AuthUseCase.CurrentUser cu = requireRequireAdmin(request);
                    String m = adminSystemUseCase.deleteMenuGroup(asAdminPrincipal(cu), payload);
                    return ResponseEntity.ok(json(Map.of("ok", true, "message", m)));
                }
                case "save_module_catalog" -> {
                    AuthUseCase.CurrentUser cu = requireRequireAdmin(request);
                    String m = adminSystemUseCase.saveModuleCatalog(asAdminPrincipal(cu), payload);
                    return ResponseEntity.ok(json(Map.of("ok", true, "message", m)));
                }
                case "set_module_status" -> {
                    AuthUseCase.CurrentUser cu = requireRequireAdmin(request);
                    String m = adminSystemUseCase.setModuleStatus(asAdminPrincipal(cu), payload);
                    return ResponseEntity.ok(json(Map.of("ok", true, "message", m)));
                }
                case "save_form_field_config" -> {
                    AuthUseCase.CurrentUser cu = requireRequireAdmin(request);
                    String m = adminSystemUseCase.saveFormFieldConfig(asAdminPrincipal(cu), payload);
                    return ResponseEntity.ok(json(Map.of("ok", true, "message", m)));
                }
                case "delete_form_field_config" -> {
                    AuthUseCase.CurrentUser cu = requireRequireAdmin(request);
                    String m = adminSystemUseCase.deleteFormFieldConfig(asAdminPrincipal(cu), payload);
                    return ResponseEntity.ok(json(Map.of("ok", true, "message", m)));
                }
                case "save_warehouse_location" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    String m = adminSystemUseCase.saveWarehouseLocation(asAdminPrincipal(cu), payload);
                    return ResponseEntity.ok(json(Map.of("ok", true, "message", m)));
                }
                case "preview_request_import" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = adminOpsManagementUseCase.previewRequestImport(asAdminOpsPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "save_email_settings" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = adminOpsManagementUseCase.saveEmailSettings(asAdminOpsPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "update_returned_request" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = requestManagementUseCase.updateReturnedRequest(asReqPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "resubmit_request" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = requestManagementUseCase.resubmitRequest(asReqPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "delete_request" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = requestManagementUseCase.deleteRequest(asReqPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "cancel_request" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = requestManagementUseCase.cancelRequest(asReqPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "save_boq_version" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = boqManagementUseCase.saveBoqVersion(asBoqPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "save_boq_item" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = boqManagementUseCase.saveBoqItem(asBoqPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "set_boq_item_status" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = boqManagementUseCase.setBoqItemStatus(asBoqPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "bulk_boq_item_action" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = boqManagementUseCase.bulkBoqItemAction(asBoqPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "delete_boq_item" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = boqManagementUseCase.deleteBoqItem(asBoqPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "replace_boq_items" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = boqManagementUseCase.replaceBoqItems(asBoqPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "update_boq_contract_prices" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = boqManagementUseCase.updateBoqContractPrices(asBoqPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "clear_boq_version" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = boqManagementUseCase.clearBoqVersion(asBoqPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "request_material_master_from_boq" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = boqManagementUseCase.requestMaterialMasterFromBoq(asBoqPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "compare_boq_materials" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = boqManagementUseCase.compareBoqMaterials(asBoqPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "confirm_boq_material_mappings" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = boqManagementUseCase.confirmBoqMaterialMappings(asBoqPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "save_production_report" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = productionManagementUseCase.saveProductionReport(asProductionPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "approve_production_report" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = productionManagementUseCase.approveProductionReport(asProductionPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "save_capital_recovery" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = productionManagementUseCase.saveCapitalRecovery(asProductionPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "delete_capital_recovery" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = productionManagementUseCase.deleteCapitalRecovery(asProductionPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "save_contract_payment" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = productionManagementUseCase.saveContractPayment(asProductionPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "import_contract_payments" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = productionManagementUseCase.importContractPayments(asProductionPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "save_team_subcontract" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = productionManagementUseCase.saveTeamSubcontract(asProductionPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "save_team_production" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = productionManagementUseCase.saveTeamProduction(asProductionPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "approve_team_production" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = productionManagementUseCase.approveTeamProduction(asProductionPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "save_team_payment" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = productionManagementUseCase.saveTeamPayment(asProductionPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "save_construction_daily_log" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = productionManagementUseCase.saveConstructionDailyLog(asProductionPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "approve_construction_daily_log" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = productionManagementUseCase.approveConstructionDailyLog(asProductionPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "delete_construction_daily_log" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = productionManagementUseCase.deleteConstructionDailyLog(asProductionPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "settle_team_subcontract" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = productionManagementUseCase.settleTeamSubcontract(asProductionPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "delete_contract_payment" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = productionManagementUseCase.deleteContractPayment(asProductionPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "save_payment_plan" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = financeManagementUseCase.savePaymentPlan(asFinancePrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "set_payment_plan_status" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = financeManagementUseCase.setPaymentPlanStatus(asFinancePrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "delete_payment_plan" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = financeManagementUseCase.deletePaymentPlan(asFinancePrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "save_advance_request" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = financeManagementUseCase.saveAdvanceRequest(asFinancePrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "settle_advance_request" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = financeManagementUseCase.settleAdvanceRequest(asFinancePrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "delete_advance_request" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = financeManagementUseCase.deleteAdvanceRequest(asFinancePrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "save_site_expense_claim" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = financeManagementUseCase.saveSiteExpenseClaim(asFinancePrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "approve_site_expense_claim" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = financeManagementUseCase.approveSiteExpenseClaim(asFinancePrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "save_bank_account" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = financeManagementUseCase.saveBankAccount(asFinancePrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "save_cashbook_entry" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = financeManagementUseCase.saveCashbookEntry(asFinancePrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "delete_cashbook_entry" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = financeManagementUseCase.deleteCashbookEntry(asFinancePrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "save_accounting_voucher" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = financeManagementUseCase.saveAccountingVoucher(asFinancePrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "delete_accounting_voucher" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = financeManagementUseCase.deleteAccountingVoucher(asFinancePrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "save_hr_record" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = hrManagementUseCase.saveHrRecord(asHrPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "save_labor_contract" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = hrManagementUseCase.saveLaborContract(asHrPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "set_labor_contract_status" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = hrManagementUseCase.setLaborContractStatus(asHrPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "save_correspondence" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = hrManagementUseCase.saveCorrespondence(asHrPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "set_correspondence_status" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = hrManagementUseCase.setCorrespondenceStatus(asHrPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "delete_correspondence" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = hrManagementUseCase.deleteCorrespondence(asHrPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "save_legal_document" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = hrManagementUseCase.saveLegalDocument(asHrPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "set_legal_document_status" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = hrManagementUseCase.setLegalDocumentStatus(asHrPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "delete_legal_document" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = hrManagementUseCase.deleteLegalDocument(asHrPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "save_seal" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = hrManagementUseCase.saveSeal(asHrPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "set_seal_status" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = hrManagementUseCase.setSealStatus(asHrPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "delete_seal" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = hrManagementUseCase.deleteSeal(asHrPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "save_benefit_record" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = hrManagementUseCase.saveBenefitRecord(asHrPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "set_benefit_record_status" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = hrManagementUseCase.setBenefitRecordStatus(asHrPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "delete_benefit_record" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = hrManagementUseCase.deleteBenefitRecord(asHrPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "delete_labor_contract" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = hrManagementUseCase.deleteLaborContract(asHrPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "delete_site_expense_claim" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = financeManagementUseCase.deleteSiteExpenseClaim(asFinancePrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "bulk_material_subcategory_action" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = materialCatalogManagementUseCase.bulkMaterialSubcategoryAction(asMaterialCatalogPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                                case "check_material_alias_conflicts" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = materialCatalogManagementUseCase.checkMaterialAliasConflicts(asMaterialCatalogPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                                case "delete_material" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = materialCatalogManagementUseCase.deleteMaterial(asMaterialCatalogPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                                case "delete_material_category" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = materialCatalogManagementUseCase.deleteMaterialCategory(asMaterialCatalogPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                                case "delete_material_norm" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = materialCatalogManagementUseCase.deleteMaterialNorm(asMaterialCatalogPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                                case "delete_material_subcategory" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = materialCatalogManagementUseCase.deleteMaterialSubcategory(asMaterialCatalogPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                                case "delete_selected_materials" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = materialCatalogManagementUseCase.deleteSelectedMaterials(asMaterialCatalogPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                                case "delete_unused_materials" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = materialCatalogManagementUseCase.deleteUnusedMaterials(asMaterialCatalogPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                                case "estimate_material_norms" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = materialCatalogManagementUseCase.estimateMaterialNorms(asMaterialCatalogPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                                case "import_material_catalog" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = materialCatalogManagementUseCase.importMaterialCatalog(asMaterialCatalogPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                                case "merge_material_master" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = materialCatalogManagementUseCase.mergeMaterialMaster(asMaterialCatalogPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                                case "preview_material_dependencies" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = materialCatalogManagementUseCase.previewMaterialDependencies(asMaterialCatalogPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                                case "reset_material_catalog_test" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = materialCatalogManagementUseCase.resetMaterialCatalogTest(asMaterialCatalogPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                                case "save_material" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = materialCatalogManagementUseCase.saveMaterial(asMaterialCatalogPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                                case "save_material_category" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = materialCatalogManagementUseCase.saveMaterialCategory(asMaterialCatalogPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                                case "save_material_external_code" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = materialCatalogManagementUseCase.saveMaterialExternalCode(asMaterialCatalogPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                                case "save_material_norm" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = materialCatalogManagementUseCase.saveMaterialNorm(asMaterialCatalogPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                                case "save_material_subcategory" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = materialCatalogManagementUseCase.saveMaterialSubcategory(asMaterialCatalogPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                                case "save_material_uom_conversion" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = materialCatalogManagementUseCase.saveMaterialUomConversion(asMaterialCatalogPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                                case "set_material_category_status" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = materialCatalogManagementUseCase.setMaterialCategoryStatus(asMaterialCatalogPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                                case "set_material_norm_status" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = materialCatalogManagementUseCase.setMaterialNormStatus(asMaterialCatalogPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                                case "set_material_status" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = materialCatalogManagementUseCase.setMaterialStatus(asMaterialCatalogPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                                case "set_material_subcategory_status" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = materialCatalogManagementUseCase.setMaterialSubcategoryStatus(asMaterialCatalogPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                                case "create_work_item" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = opsTaskManagementUseCase.createWorkItem(asOpsTaskPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                                case "create_self_work_item" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = opsTaskManagementUseCase.createSelfWorkItem(asOpsTaskPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                                case "update_work_item_progress" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = opsTaskManagementUseCase.updateWorkItemProgress(asOpsTaskPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                                case "update_work_item_status" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = opsTaskManagementUseCase.updateWorkItemStatus(asOpsTaskPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                                case "reassign_work_item" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = opsTaskManagementUseCase.reassignWorkItem(asOpsTaskPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                                case "mark_task_notification_read" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = opsTaskManagementUseCase.markTaskNotificationRead(asOpsTaskPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                                case "create_project_team" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = opsTaskManagementUseCase.createProjectTeam(asOpsTaskPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                                case "set_project_team_status" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = opsTaskManagementUseCase.setProjectTeamStatus(asOpsTaskPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                                case "delete_project_team" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = opsTaskManagementUseCase.deleteProjectTeam(asOpsTaskPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                                case "save_approval_stage" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = opsTaskManagementUseCase.saveApprovalStage(asOpsTaskPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                                case "set_approval_stage_status" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = opsTaskManagementUseCase.setApprovalStageStatus(asOpsTaskPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                                case "delete_approval_stage" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = opsTaskManagementUseCase.deleteApprovalStage(asOpsTaskPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                                case "save_workflow" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = opsTaskManagementUseCase.saveWorkflow(asOpsTaskPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                                case "set_workflow_status" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = opsTaskManagementUseCase.setWorkflowStatus(asOpsTaskPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                                case "delete_workflow" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = opsTaskManagementUseCase.deleteWorkflow(asOpsTaskPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                                case "save_mar_approval" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = opsTaskManagementUseCase.saveMarApproval(asOpsTaskPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                                case "bulk_import_projects" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = systemSettingsUseCase.bulkImportProjects(asSystemSettingsPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                                case "bulk_import_users" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = systemSettingsUseCase.bulkImportUsers(asSystemSettingsPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                                case "factory_reset_preview" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = systemSettingsUseCase.factoryResetPreview(asSystemSettingsPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                                case "factory_reset_execute" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = systemSettingsUseCase.factoryResetExecute(asSystemSettingsPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                                case "install_license_foundation" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = systemSettingsUseCase.installLicenseFoundation(asSystemSettingsPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                                case "request_license_transfer" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = systemSettingsUseCase.requestLicenseTransfer(asSystemSettingsPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                                case "retry_email" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = systemSettingsUseCase.retryEmail(asSystemSettingsPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                                case "save_ui_display_settings" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = systemSettingsUseCase.saveUiDisplaySettings(asSystemSettingsPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                                case "save_trust_development_settings" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = systemSettingsUseCase.saveTrustDevelopmentSettings(asSystemSettingsPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                                case "create_request" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = requestManagementUseCase.createRequest(asReqPrincipal(cu), payload);
                    Map<String, Object> resp = new LinkedHashMap<>();
                    resp.put("ok", true);
                    resp.putAll(result);
                    return ResponseEntity.ok(resp);
                }
                case "decide_approval" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = requestManagementUseCase.decideApproval(asReqPrincipal(cu), payload);
                    Map<String, Object> resp = new LinkedHashMap<>();
                    resp.put("ok", true);
                    resp.putAll(result);
                    return ResponseEntity.ok(resp);
                }
                case "create_po" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = purchaseManagementUseCase.createPo(asPurchasePrincipal(cu), payload);
                    Map<String, Object> out = new java.util.LinkedHashMap<>(result);
                    out.put("warnings", requestStore.approvalWarnings("purchase_order", String.valueOf(result.getOrDefault("poId", ""))));
                    return ResponseEntity.ok(jsonResult(out));
                }
case "update_po_price" -> {
    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
    Map<String, Object> result = purchaseManagementUseCase.updatePoPrice(asPurchasePrincipal(cu), payload);
    return ResponseEntity.ok(jsonResult(result));
}
                case "approve_po" -> {
    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
    Map<String, Object> result = purchaseManagementUseCase.approvePo(asPurchasePrincipal(cu), payload);
    return ResponseEntity.ok(jsonResult(result));
}
case "reject_po" -> {
    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
    Map<String, Object> result = purchaseManagementUseCase.rejectPo(asPurchasePrincipal(cu), payload);
    return ResponseEntity.ok(jsonResult(result));
}case "close_po_line" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = purchaseManagementUseCase.closePoLine(asPurchasePrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "receive_goods" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = purchaseManagementUseCase.receiveGoods(asPurchasePrincipal(cu), payload);
                    Map<String, Object> recvResult = new java.util.LinkedHashMap<>(result);
                    recvResult.put("warnings", requestStore.approvalWarnings("goods_receipt", String.valueOf(result.getOrDefault("receiptId", ""))));
                    return ResponseEntity.ok(jsonResult(recvResult));
                }
                case "confirm_delivery" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = purchaseManagementUseCase.confirmDelivery(asPurchasePrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "return_stock" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = stockManagementUseCase.returnStock(asStockPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "create_transfer_order" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = stockManagementUseCase.createTransferOrder(asStockPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "approve_transfer_order" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = stockManagementUseCase.approveTransferOrder(asStockPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "ship_transfer_order" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = stockManagementUseCase.shipTransferOrder(asStockPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "create_central_return" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = stockManagementUseCase.createCentralReturn(asStockPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "approve_central_return" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = stockManagementUseCase.approveCentralReturn(asStockPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "receive_central_return" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = stockManagementUseCase.receiveCentralReturn(asStockPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "create_stock_count" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = stockManagementUseCase.createStockCount(asStockPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "reconcile_contract_stock" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = stockManagementUseCase.reconcileContractStock(asStockPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "transfer_contract_ownership" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = stockManagementUseCase.transferContractOwnership(asStockPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "reverse_stock_movement" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = stockManagementUseCase.reverseStockMovement(asStockPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "approve_stock_count" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = stockManagementUseCase.approveStockCount(asStockPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "receive_transfer_order" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = stockManagementUseCase.receiveTransferOrder(asStockPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "confirm_installation" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = stockManagementUseCase.confirmInstallation(asStockPrincipal(cu), payload);
                    return ResponseEntity.ok(jsonResult(result));
                }
                case "issue_stock" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    Map<String, Object> result = stockManagementUseCase.issueStock(asStockPrincipal(cu), payload);
                    Map<String, Object> out = new java.util.LinkedHashMap<>(result);
                    out.put("warnings", requestStore.approvalWarnings("stock_issue", String.valueOf(result.getOrDefault("issueId", ""))));
                    return ResponseEntity.ok(jsonResult(out));
                }
                case "save_supplier" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    String m = supplierManagementUseCase.saveSupplier(asSupplierPrincipal(cu), payload);
                    return ResponseEntity.ok(json(Map.of("ok", true, "message", m)));
                }
                case "set_supplier_status" -> {
                    AuthUseCase.CurrentUser cu = requireCurrentUser(request);
                    String m = supplierManagementUseCase.setSupplierStatus(asSupplierPrincipal(cu), payload);
                    return ResponseEntity.ok(json(Map.of("ok", true, "message", m)));
                }
                case "delete_supplier" -> {
                    AuthUseCase.CurrentUser cu = requireRequireAdmin(request);
                    String m = supplierManagementUseCase.deleteSupplier(asSupplierPrincipal(cu), payload);
                    return ResponseEntity.ok(json(Map.of("ok", true, "message", m)));
                }
                default -> {
                    return ResponseEntity.status(400).body(json(Map.of("ok", false,
                            "error", "Action '" + action + "' chưa được triển khai trên backend Java (Strangler Fig).")));
                }
            }
        } catch (AuthUseCase.ApiError e) {
            return ResponseEntity.status(e.status()).body(json(Map.of("ok", false, "error", e.getMessage())));
        } catch (org.springframework.dao.DuplicateKeyException e) {
            // JS quy ước: lỗi UNIQUE/duplicate key → HTTP 409 kèm thông báo đọc được.
            // Trước đây rơi vào 500 câm "Internal Server Error" nên UI không hiển thị được nguyên nhân
            // (vd tạo dự án trùng mã, trùng số chứng từ, trùng mã vật tư...).
            return ResponseEntity.status(409).body(json(Map.of("ok", false,
                    "error", duplicateMessage(action, e))));
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            // Vi phạm ràng buộc khác (NOT NULL/FK/độ dài) — vẫn là lỗi DỮ LIỆU ĐẦU VÀO, không phải lỗi hệ thống.
            return ResponseEntity.status(409).body(json(Map.of("ok", false,
                    "error", "Dữ liệu vi phạm ràng buộc của hệ thống (trùng hoặc thiếu tham chiếu). "
                            + "Vui lòng kiểm tra lại thông tin vừa nhập.")));
        }
    }

    private static Map<String, Object> jsonResult(Map<String, Object> result) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("ok", true);
        body.putAll(result);
        return body;
    }

    /**
     * Chuyển lỗi trùng khoá thành thông báo tiếng Việt đọc được cho người dùng cuối.
     *
     * <p>Hai định dạng message phải xử lý (đã kiểm chứng bằng thực nghiệm):
     * <ul>
     *   <li><b>MySQL</b>: {@code Duplicate entry 'DA-MAU-01' for key 'projects.projects_code_uidx'}</li>
     *   <li><b>H2</b> (test): {@code Unique index or primary key violation: "PUBLIC.PROJECTS_CODE_UIDX ON PUBLIC.PROJECTS(CODE) VALUES (...)"}</li>
     * </ul>
     * Bỏ qua việc này thì test H2 và production MySQL cho kết quả khác nhau — đúng loại lệch đã gây ra
     * nhiều bug port trong dự án này.
     */
    private static String duplicateMessage(String action, org.springframework.dao.DuplicateKeyException e) {
        String raw = e.getMostSpecificCause() != null
                ? String.valueOf(e.getMostSpecificCause().getMessage())
                : String.valueOf(e.getMessage());

        String key = "";
        String value = "";
        // MySQL: for key 'table.index_name'
        java.util.regex.Matcher my = java.util.regex.Pattern
                .compile("for key '(?:[^.]+\\.)?([^']+)'").matcher(raw);
        if (my.find()) key = my.group(1).toLowerCase(java.util.Locale.ROOT);
        java.util.regex.Matcher mv = java.util.regex.Pattern
                .compile("Duplicate entry '([^']*)'").matcher(raw);
        if (mv.find()) value = mv.group(1);
        // H2: "public.INDEX_NAME ON public.TABLE(...)  VALUES ( /* 1 */ 'value' )"
        // Lưu ý: H2 in tên schema viết THƯỜNG (public.) trên một số bản, viết HOA trên bản khác
        // ⇒ regex phải case-insensitive, nếu không sẽ không nhận diện được khoá nào.
        if (key.isEmpty()) {
            java.util.regex.Matcher h2 = java.util.regex.Pattern
                    .compile("\\\"(?:[A-Za-z0-9_]+\\.)?([A-Za-z0-9_]+) ON [A-Za-z0-9_]+\\.([A-Za-z0-9_]+)\\(")
                    .matcher(raw);
            if (h2.find()) key = h2.group(1).toLowerCase(java.util.Locale.ROOT);
            if (value.isEmpty()) {
                java.util.regex.Matcher h2v = java.util.regex.Pattern
                        .compile("VALUES \\(\\s*(?:/\\* \\d+ \\*/\\s*)?'([^']*)'").matcher(raw);
                if (h2v.find()) value = h2v.group(1);
            }
        }

        String subject = switch (key) {
            // Tên khoá lấy ĐÚNG theo information_schema của DB (không đoán).
            case "projects_code_uidx" -> "Mã dự án";
            case "warehouses_code_uidx" -> "Mã kho";
            case "materials_code_uidx" -> "Mã vật tư";
            case "material_aliases_uidx_normalized_name" -> "Tên vật tư (alias)";
            case "material_norms_uidx_norm_code" -> "Mã định mức";
            case "suppliers_code_uidx" -> "Mã nhà cung cấp";
            case "users_username_uidx" -> "Tên đăng nhập";
            case "users_email_uidx" -> "Email";
            case "users_employee_code_uidx" -> "Mã nhân viên";
            case "teams_code_uidx" -> "Mã tổ đội";
            case "bank_accounts_uidx_code" -> "Mã tài khoản ngân hàng";
            case "purchase_orders_no_uidx" -> "Số PO";
            case "goods_receipts_no_uidx" -> "Số phiếu nhập";
            case "material_requests_no_uidx" -> "Số phiếu đề nghị";
            case "stock_issues_no_uidx" -> "Số phiếu xuất";
            case "material_returns_no_uidx" -> "Số phiếu hoàn trả";
            case "stock_counts_no_uidx" -> "Số phiếu kiểm kê";
            case "transfer_orders_uidx_transfer_no" -> "Số phiếu điều chuyển";
            case "contract_ownership_transfers_no_uidx" -> "Số phiếu chuyển quyền sở hữu";
            case "project_contracts_uidx_project_id_contract_no" -> "Số hợp đồng (trong dự án)";
            case "team_subcontracts_uidx_project_id_contract_no" -> "Số HĐ giao khoán (trong dự án)";
            case "payment_plans_uidx_plan_no" -> "Số kế hoạch thanh toán";
            case "advance_requests_uidx_request_no" -> "Số đề nghị tạm ứng";
            case "site_expense_claims_uidx_claim_no" -> "Số đề nghị chi phí";
            case "cashbook_entries_uidx_entry_no" -> "Số phiếu sổ quỹ";
            case "accounting_vouchers_uidx_voucher_no" -> "Số chứng từ kế toán";
            case "labor_contracts_uidx_contract_no" -> "Số hợp đồng lao động";
            case "benefit_records_uidx_benefit_no" -> "Số hồ sơ phúc lợi";
            case "legal_documents_uidx_doc_no" -> "Số văn bản pháp lý";
            case "official_correspondence_uidx_doc_no" -> "Số công văn";
            case "seal_management_uidx_seal_no" -> "Số hiệu con dấu";
            case "construction_daily_logs_uidx_log_no" -> "Số nhật ký thi công";
            case "work_items_uidx_task_no" -> "Số nhiệm vụ";
            case "boq_versions_uidx_contract_id_version_no" -> "Số phiên bản BOQ (trong hợp đồng)";
            case "project_close_checks_uidx_project_id_check_key" -> "Mục kiểm tra đóng dự án";
            case "material_mar_approvals_uidx_project_id_material_id" -> "MAR của vật tư trong dự án";
            case "production_reports_uidx_project_id_report_period" -> "Báo cáo sản lượng kỳ này";
            case "primary_key_f" -> "Mã định danh (trùng khoá chính)";
            default -> "";
        };
        if (!subject.isEmpty()) {
            return value.isEmpty()
                    ? subject + " đã tồn tại. Vui lòng dùng giá trị khác."
                    : subject + " \"" + value + "\" đã tồn tại. Vui lòng dùng giá trị khác.";
        }
        // Không nhận diện được khoá cụ thể: vẫn trả 409 kèm gợi ý, KHÔNG để lộ tên bảng cho người dùng.
        return "Dữ liệu đã tồn tại (trùng khoá duy nhất). Vui lòng kiểm tra lại mã/số vừa nhập.";
    }

    private static BoqManagementUseCase.Principal asBoqPrincipal(AuthUseCase.CurrentUser cu) {
        return new BoqManagementUseCase.Principal() {
            @Override public String userId() { return cu.id(); }
            @Override public String role() { return cu.role(); }
            @Override public String fullName() { return cu.fullName(); }
        };
    }

    private static ProductionManagementUseCase.Principal asProductionPrincipal(AuthUseCase.CurrentUser cu) {
        return new ProductionManagementUseCase.Principal() {
            @Override public String userId() { return cu.id(); }
            @Override public String role() { return cu.role(); }
            @Override public String roleBase() { return cu.roleBase(); }
        };
    }

    private static HrManagementUseCase.Principal asHrPrincipal(AuthUseCase.CurrentUser cu) {
        return new HrManagementUseCase.Principal() {
            @Override public String userId() { return cu.id(); }
            @Override public String role() { return cu.role(); }
        };
    }

    private static AdminOpsManagementUseCase.Principal asAdminOpsPrincipal(AuthUseCase.CurrentUser cu) {
        return new AdminOpsManagementUseCase.Principal() {
            @Override public String userId() { return cu.id(); }
            @Override public String role() { return cu.role(); }
            @Override public String roleBase() { return cu.roleBase(); }
        };
    }

    private static SystemSettingsUseCase.Principal asSystemSettingsPrincipal(AuthUseCase.CurrentUser cu) {
        return new SystemSettingsUseCase.Principal() {
            @Override public String userId() { return cu.id(); }
            @Override public String role() { return cu.role(); }
        };
    }

    private static OpsTaskManagementUseCase.Principal asOpsTaskPrincipal(AuthUseCase.CurrentUser cu) {
        return new OpsTaskManagementUseCase.Principal() {
            @Override public String userId() { return cu.id(); }
            @Override public String role() { return cu.role(); }
            @Override public String roleBase() { return cu.roleBase(); }
            @Override public String fullName() { return cu.fullName(); }
            @Override public String email() { return cu.email(); }
        };
    }

    private static MaterialCatalogManagementUseCase.Principal asMaterialCatalogPrincipal(AuthUseCase.CurrentUser cu) {
        return new MaterialCatalogManagementUseCase.Principal() {
            @Override public String userId() { return cu.id(); }
            @Override public String role() { return cu.role(); }
        };
    }

    private static FinanceManagementUseCase.Principal asFinancePrincipal(AuthUseCase.CurrentUser cu) {
        return new FinanceManagementUseCase.Principal() {
            @Override public String userId() { return cu.id(); }
            @Override public String role() { return cu.role(); }
        };
    }

    private static RequestManagementUseCase.Principal asReqPrincipal(AuthUseCase.CurrentUser cu) {
        return new RequestManagementUseCase.Principal() {
            @Override public String userId() { return cu.id(); }
            @Override public String role() { return cu.role(); }
            @Override public String roleBase() { return cu.roleBase(); }
            @Override public String fullName() { return cu.fullName(); }
            @Override public String email() { return cu.email(); }
        };
    }

    private static ProjectContractUseCase.Principal asProjectContractPrincipal(AuthUseCase.CurrentUser cu) {
        return new ProjectContractUseCase.Principal() {
            @Override public String userId() { return cu.id(); }
            @Override public String role() { return cu.role(); }
        };
    }

    private static AdminSystemUseCase.Principal asAdminPrincipal(AuthUseCase.CurrentUser cu) {
        return new AdminSystemUseCase.Principal() {
            @Override public String userId() { return cu.id(); }
            @Override public String role() { return cu.role(); }
            @Override public String warehouseScopeKind() { return cu.warehouseScopeKind(); }
        };
    }

    private static PurchaseManagementUseCase.Principal asPurchasePrincipal(AuthUseCase.CurrentUser cu) {
        return new PurchaseManagementUseCase.Principal() {
            @Override public String userId() { return cu.id(); }
            @Override public String role() { return cu.role(); }
            @Override public String roleBase() { return cu.roleBase(); }
            @Override public String warehouseScopeKind() { return cu.warehouseScopeKind(); }
            @Override public String fullName() { return cu.fullName(); }
            @Override public String email() { return cu.email(); }
        };
    }

    private static StockManagementUseCase.Principal asStockPrincipal(AuthUseCase.CurrentUser cu) {
        return new StockManagementUseCase.Principal() {
            @Override public String userId() { return cu.id(); }
            @Override public String role() { return cu.role(); }
            @Override public String roleBase() { return cu.roleBase(); }
            @Override public String warehouseScopeKind() { return cu.warehouseScopeKind(); }
            @Override public String fullName() { return cu.fullName(); }
        };
    }

    private static SupplierManagementUseCase.Principal asSupplierPrincipal(AuthUseCase.CurrentUser cu) {
        return new SupplierManagementUseCase.Principal() {
            @Override public String userId() { return cu.id(); }
            @Override public String role() { return cu.role(); }
        };
    }

    private static boolean toActiveFlag(Object o) {
        if (o == null) return false;
        if (o instanceof Boolean b) return b;
        return java.util.List.of("1", "true", "on").contains(String.valueOf(o).trim().toLowerCase());
    }

    private static ProjectManagementUseCase.Principal asPrincipal(AuthUseCase.CurrentUser cu) {
        return new ProjectManagementUseCase.Principal() {
            @Override public String userId() { return cu.id(); }
            @Override public String role() { return cu.role(); }
        };
    }

    private static UserManagementUseCase.Principal asUserPrincipal(AuthUseCase.CurrentUser cu) {
        return new UserManagementUseCase.Principal() {
            @Override public String userId() { return cu.id(); }
            @Override public String role() { return cu.role(); }
        };
    }

    /** Action yêu cầu quyền admin (giống requireRole(user, ["admin"]) trong JS). */
    private AuthUseCase.CurrentUser requireRequireAdmin(HttpServletRequest request) {
        AuthUseCase.CurrentUser cu = requireCurrentUser(request, false);
        if (!"admin".equals(cu.role())) {
            throw new AuthUseCase.ApiError("Tài khoản không có quyền thực hiện nghiệp vụ này.", 403);
        }
        return cu;
    }

    private String sha256OfToken(String rawToken) {
        return rawToken == null || rawToken.isBlank() ? "" : AuthUseCase.sha256Hex(rawToken);
    }

    /** Giống JS: user phải đăng nhập; nếu đang bị cờ mustChangePassword thì chặn (428) trừ action change_password. */
    private AuthUseCase.CurrentUser requireCurrentUser(HttpServletRequest request, boolean allowMustChange) {
        Optional<AuthUseCase.CurrentUser> user = authUseCase.currentUser(currentToken(request), Instant.now());
        if (user.isEmpty()) throw new AuthUseCase.ApiError("Phiên đăng nhập đã hết hạn.", 401);
        if (user.get().mustChangePassword() && !allowMustChange) {
            throw new AuthUseCase.ApiError(
                    "Bạn phải đổi mật khẩu tạm thời trước khi sử dụng hệ thống.", 428);
        }
        return user.get();
    }

    private AuthUseCase.CurrentUser requireCurrentUser(HttpServletRequest request) {
        return requireCurrentUser(request, true);
    }

    private String currentToken(HttpServletRequest request) {
        return SessionCookieFactory.decode(cookieValue(request, SessionCookieFactory.COOKIE_NAME));
    }

    private static String cookieValue(HttpServletRequest request, String name) {
        jakarta.servlet.http.Cookie[] cookies = request.getCookies();
        if (cookies == null) return null;
        for (jakarta.servlet.http.Cookie c : cookies) {
            if (name.equals(c.getName())) return c.getValue();
        }
        return null;
    }

    private static String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("x-forwarded-for");
        if (forwarded != null && !forwarded.isBlank()) return forwarded.split(",")[0].trim();
        return request.getRemoteAddr();
    }

    private static String trim(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }

    private static Map<String, Object> json(Map<String, Object> body) {
        return body;
    }
}
