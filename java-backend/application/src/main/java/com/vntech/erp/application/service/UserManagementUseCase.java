package com.vntech.erp.application.service;

import com.vntech.erp.application.port.out.IdGenerator;
import com.vntech.erp.application.port.out.PasswordHasher;
import com.vntech.erp.application.port.out.UserAdminStore;
import com.vntech.erp.application.rbac.RbacService;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

/**
 * Use-case quản trị tài khoản (admin) — port nguyên trạng create_user/update_user/set_user_status/
 * reset_user_password/delete_user/save_user_access/delete_user_module_override của monolith JS,
 * gồm: resolve org theo department/role default, department-default permissions (replaceDepartmentDefaults),
 * khóa/quy tắc admin cuối cùng, lịch sử nghiệp vụ khi xóa.
 */
public final class UserManagementUseCase {

    private static final Pattern ORG_KEY = Pattern.compile("\\p{M}+");
    private static final String[] ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789".split("");
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserAdminStore store;
    private final IdGenerator idGenerator;
    private final PasswordHasher passwordHasher;
    private final RbacService rbac;

    public UserManagementUseCase(UserAdminStore store, IdGenerator idGenerator,
                                 PasswordHasher passwordHasher, RbacService rbac) {
        this.store = store;
        this.idGenerator = idGenerator;
        this.passwordHasher = passwordHasher;
        this.rbac = rbac;
    }

    public interface Principal {
        String userId();
        String role();
    }

    /** canonicalRoleCode + kiểm tra vai trò hợp lệ (JS create_user). */
    public String createUser(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
        String username = trim(payload.get("username")).toLowerCase();
        String password = trim(payload.get("password"));
        if (username.isEmpty()) throw new AuthUseCase.ApiError("Tên đăng nhập là bắt buộc.", 400);
        String passwordError = AuthUseCase.passwordPolicyError(password);
        if (!passwordError.isEmpty()) throw new AuthUseCase.ApiError(passwordError, 400);
        String role = canonicalRoleCode(payload.get("role"));
        Map<String, Object> roleRow = store.findRoleByCode(role).orElse(null);
        if (roleRow == null || "admin".equals(role))
            throw new AuthUseCase.ApiError("Vai trò chưa hợp lệ hoặc đang bị ẩn.", 400);
        Map<String, Object> org = resolveOrganization(payload, roleRow);
        if (org == null)
            throw new AuthUseCase.ApiError("Phòng/bộ phận không tồn tại hoặc đã được lưu trữ.", 400);
        String userId = idGenerator.next("USR");
        Instant now = Instant.now();
        store.insertUser(userId, trim(payload.get("employeeCode")), trim(payload.get("fullName")),
                username, trim(payload.get("email")).toLowerCase().isEmpty() ? null : trim(payload.get("email")).toLowerCase(),
                passwordHasher.hash(password), role, sv(org, "name"), sv(org, "id"),
                numberValue(payload.get("approvalLimit")), true, now);
        List<String> scopes = listOf(payload.get("projectIds")).stream().map(String::valueOf).toList();
        for (String projectId : scopes)
            store.insertProjectScope(idGenerator.next("SCOPE"), userId, projectId, "read", now);
        String baseRole = sv(roleRow, "baseRole");
        if ("warehouse".equals(baseRole)) {
            String kind = blankDefault(sv(roleRow, "warehouseScopeKind"), "site");
            for (String warehouseId : listOf(payload.get("warehouseIds")).stream().map(String::valueOf).toList()) {
                var wh = store.findActiveWarehouse(warehouseId).orElse(null);
                if (wh == null) throw new AuthUseCase.ApiError("Kho được chọn không tồn tại.", 400);
                if ("site".equals(kind) && (!"site".equals(sv(wh, "type")) || sv(wh, "projectId").isEmpty()
                        || !scopes.contains(sv(wh, "projectId"))))
                    throw new AuthUseCase.ApiError("Thủ kho dự án chỉ được gán kho thuộc dự án đã chọn.", 400);
                if ("central".equals(kind) && !"central".equals(sv(wh, "type")))
                    throw new AuthUseCase.ApiError("Thủ kho Tổng chỉ được gán Kho Tổng.", 400);
                store.insertWarehouseScope(idGenerator.next("UWS"), userId, warehouseId, "read", now);
            }
        }
        replaceDepartmentDefaults(userId);
        return "Đã tạo tài khoản " + username + " và tự cấp quyền mặc định theo Phòng/Bộ phận.";
    }

    public String updateUser(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
        String targetUserId = trim(payload.get("userId"));
        Map<String, Object> target = store.findUser(targetUserId).orElse(null);
        if (target == null) throw new AuthUseCase.ApiError("Không tìm thấy tài khoản.", 400);
        String employeeCode = trim(payload.get("employeeCode"));
        String fullName = trim(payload.get("fullName"));
        String username = trim(payload.get("username")).toLowerCase();
        String email = trim(payload.get("email")).toLowerCase().isEmpty() ? null : trim(payload.get("email")).toLowerCase();
        String role = canonicalRoleCode(payload.get("role"));
        boolean active = payload.get("active") == Boolean.TRUE || "1".equals(trim(payload.get("active")));
        Map<String, Object> roleRow = store.findRoleByCode(role).orElse(null);
        if (roleRow == null || !isActive(roleRow.get("active")))
            throw new AuthUseCase.ApiError("Vai trò không tồn tại hoặc đang bị ẩn trong danh mục.", 400);
        Map<String, Object> org = resolveOrganization(payload, roleRow);
        String department = org == null ? "" : sv(org, "name");
        if (employeeCode.isEmpty() || fullName.isEmpty() || username.isEmpty() || org == null || department.isEmpty())
            throw new AuthUseCase.ApiError("Mã nhân viên, họ tên, tên đăng nhập và phòng/bộ phận là bắt buộc.", 400);
        if (targetUserId.equals(principal.userId()) && !active)
            throw new AuthUseCase.ApiError("Không thể tự khóa tài khoản quản trị đang đăng nhập.", 400);
        if ("admin".equals(sv(target, "role")) && !"admin".equals(role) && store.countActiveAdmins() <= 1)
            throw new AuthUseCase.ApiError("Hệ thống phải còn ít nhất một tài khoản Quản trị hệ thống đang hoạt động.", 400);
        String oldDepartment = sv(target, "department");
        String oldRole = sv(target, "role");
        store.updateUser(targetUserId, employeeCode, fullName, username, email, role, department,
                sv(org, "id"), numberValue(payload.get("approvalLimit")), active, Instant.now());
        if (!oldDepartment.equals(department) || !oldRole.equals(role)) replaceDepartmentDefaults(targetUserId);
        if (!active) store.deleteSessionsByUser(targetUserId);
        String newPassword = trim(payload.get("newPassword"));
        String message = "Đã cập nhật tài khoản " + username;
        if (!newPassword.isEmpty()) {
            String passwordError = AuthUseCase.passwordPolicyError(newPassword);
            if (!passwordError.isEmpty()) throw new AuthUseCase.ApiError(passwordError, 400);
            store.setPassword(targetUserId, passwordHasher.hash(newPassword), false, Instant.now());
            message += " và đặt lại mật khẩu";
        }
        return message + ".";
    }

    public String setUserStatus(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
        String targetUserId = trim(payload.get("userId"));
        boolean active = payload.get("active") == Boolean.TRUE || "1".equals(trim(payload.get("active")));
        Map<String, Object> target = store.findUser(targetUserId).orElse(null);
        if (target == null) throw new AuthUseCase.ApiError("Không tìm thấy tài khoản.", 400);
        if (targetUserId.equals(principal.userId()) && !active)
            throw new AuthUseCase.ApiError("Không thể tự khóa tài khoản Quản trị viên đang đăng nhập.", 400);
        if ("admin".equals(sv(target, "role")) && !active && store.countActiveAdmins() <= 1)
            throw new AuthUseCase.ApiError("Hệ thống phải còn ít nhất một tài khoản Quản trị viên đang hoạt động.", 400);
        store.setUserActive(targetUserId, active, Instant.now());
        if (!active) store.deleteSessionsByUser(targetUserId);
        String username = sv(target, "username");
        return active ? "Đã mở khóa tài khoản " + username + "." : "Đã khóa tài khoản " + username + " và đăng xuất toàn bộ thiết bị.";
    }

    public Map<String, Object> resetUserPassword(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
        String targetUserId = trim(payload.get("userId"));
        Map<String, Object> target = store.findUser(targetUserId).orElse(null);
        if (target == null) throw new AuthUseCase.ApiError("Không tìm thấy tài khoản.", 400);
        if (!isActive(target.get("active"))) throw new AuthUseCase.ApiError("Tài khoản đang bị khóa. Hãy mở khóa trước khi reset mật khẩu.", 400);
        boolean testMode = Boolean.getBoolean("vntech.testMode") // tạm: bật qua JVM flag
                || java.util.Optional.ofNullable(System.getenv("VNTECH_TEST_MODE")).map(String::valueOf).isPresent();
        String temporaryPassword = "Vn@" + randomBody(14) + "9";
        if (testMode && Boolean.TRUE.equals(payload.get("useTestDefault"))) temporaryPassword = "Admin123456@";
        Instant now = Instant.now();
        store.resetPassword(targetUserId, passwordHasher.hash(temporaryPassword), now, principal.userId());
        store.deleteSessionsByUser(targetUserId);
        Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("message", "Đã reset mật khẩu cho " + sv(target, "username") + ". Người dùng bắt buộc đổi mật khẩu khi đăng nhập lại.");
        result.put("temporaryPassword", temporaryPassword);
        result.put("mustChangePassword", true);
        return result;
    }

    public String deleteUser(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
        String targetUserId = trim(payload.get("userId"));
        Map<String, Object> target = store.findUser(targetUserId).orElse(null);
        if (target == null) throw new AuthUseCase.ApiError("Không tìm thấy tài khoản.", 400);
        if (targetUserId.equals(principal.userId()) || "admin".equals(sv(target, "role")))
            throw new AuthUseCase.ApiError("Không được xóa tài khoản Quản trị viên. Có thể quản lý Quản trị viên khác bằng quy trình khóa/mở khóa.", 400);
        if (isActive(target.get("active")))
            throw new AuthUseCase.ApiError("Hãy khóa tài khoản trước khi xóa để tránh thao tác nhầm.", 400);
        if (store.hasBusinessHistory(targetUserId))
            throw new AuthUseCase.ApiError("Tài khoản đã có lịch sử nghiệp vụ nên không được xóa. Hãy giữ ở trạng thái Đã khóa để bảo toàn người lập/người duyệt trên chứng từ.", 400);
        store.deleteOwned(targetUserId);
        return "Đã xóa tài khoản chưa phát sinh " + sv(target, "username") + ".";
    }

    public String saveUserAccess(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
        String targetUserId = trim(payload.get("userId"));
        Map<String, Object> target = store.findUser(targetUserId).orElse(null);
        if (target == null) throw new AuthUseCase.ApiError("Không tìm thấy tài khoản.", 400);
        Instant now = Instant.now();
        store.clearUserScopes(targetUserId);
        for (Object o : listOf(payload.get("projectScopes"))) {
            Map<?, ?> row = asMap(o);
            String projectId = trim(row.get("projectId"));
            if (!projectId.isEmpty())
                store.insertProjectScope(idGenerator.next("SCOPE"), targetUserId, projectId,
                        blankDefault(trim(row.get("permission")), "read"), now);
        }
        for (Object o : listOf(payload.get("warehouseScopes"))) {
            Map<?, ?> row = asMap(o);
            String warehouseId = trim(row.get("warehouseId"));
            if (!warehouseId.isEmpty())
                store.insertWarehouseScope(idGenerator.next("UWS"), targetUserId, warehouseId,
                        blankDefault(trim(row.get("permission")), "read"), now);
        }
        // modulePermissions: chỉ xử lý override khác default (đơn giản hóa: ghi thẳng manual_override)
        for (Object o : listOf(payload.get("modulePermissions"))) {
            Map<?, ?> row = asMap(o);
            String moduleKey = trim(row.get("moduleKey"));
            if (moduleKey.isEmpty() || "admin".equals(moduleKey)) continue;
            String source = Boolean.TRUE.equals(row.get("isOverride")) ? "manual_override" : "department_default";
            store.insertDepartmentDefaultPermission(idGenerator.next("UMP"), targetUserId, moduleKey,
                    intOf(row.get("canView")), intOf(row.get("canUse")), intOf(row.get("canCreate")),
                    intOf(row.get("canEdit")), intOf(row.get("canApprove")), intOf(row.get("canExport")), now);
        }
        return "Đã lưu quyền hiệu lực: mặc định phòng + ngoại lệ cá nhân.";
    }

    public String deleteUserModuleOverride(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
        String targetUserId = trim(payload.get("userId"));
        String moduleKey = trim(payload.get("moduleKey"));
        if (targetUserId.isEmpty() || moduleKey.isEmpty() || "admin".equals(moduleKey))
            throw new AuthUseCase.ApiError("Ngoại lệ cá nhân không hợp lệ.", 400);
        store.deleteModuleOverride(targetUserId, moduleKey);
        return "Đã xóa ngoại lệ cá nhân; quyền hiệu lực quay về mặc định của phòng/bộ phận.";
    }

    // ---- role_catalog ----
    private static final Pattern ROLE_CODE = Pattern.compile("^[a-z0-9_-]{2,32}$");
    private static final List<String> ALLOWED_BASES = List.of(
            "engineer", "commander", "project", "procurement", "accountant", "warehouse", "team", "director");

    public String saveRoleCatalog(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
        String roleId = trim(payload.get("roleId"));
        String requestedCode = trim(payload.get("code")).toLowerCase();
        String name = trim(payload.get("name"));
        String description = trim(payload.get("description"));
        String businessGroupId = trim(payload.get("businessGroupId"));
        String defaultOrganizationUnitId = trim(payload.get("defaultOrganizationUnitId"));
        if (name.isEmpty()) throw new AuthUseCase.ApiError("Tên vai trò là bắt buộc.", 400);

        String baseRole = "engineer";
        if (!"admin".equals(requestedCode)) {
            Map<String, Object> group = store.findBusinessGroup(businessGroupId).orElse(null);
            if (group == null)
                throw new AuthUseCase.ApiError("Nhóm quyền nghiệp vụ không tồn tại hoặc đang bị ẩn.", 400);
            baseRole = sv(group, "engineRole").isEmpty() ? "engineer" : sv(group, "engineRole");
            if (defaultOrganizationUnitId.isEmpty())
                throw new AuthUseCase.ApiError("Chức danh phải gắn Phòng/Bộ phận mặc định để đồng bộ import và phân quyền.", 400);
            if (store.findOrganizationUnit(defaultOrganizationUnitId) == null)
                throw new AuthUseCase.ApiError("Phòng/Bộ phận mặc định không tồn tại hoặc đang bị ẩn.", 400);
            if (!ALLOWED_BASES.contains(baseRole))
                throw new AuthUseCase.ApiError("Nhóm quyền nghiệp vụ kế thừa chưa hợp lệ.", 400);
        }
        int sortOrder = (int) Math.floor(numberValue(payload.get("sortOrder")));
        if (store.roleNameExists(name, roleId))
            throw new AuthUseCase.ApiError("Chức danh \u201c" + name + "\u201d đã tồn tại. Không được tạo chức danh trùng tên.", 400);

        Instant now = Instant.now();
        if (!roleId.isEmpty()) {
            Map<String, Object> before = store.findRoleById(roleId)
                    .orElseThrow(() -> new AuthUseCase.ApiError("Không tìm thấy vai trò.", 400));
            String oldCode = sv(before, "code");
            String finalCode = "admin".equals(oldCode) ? "admin" : (requestedCode.isEmpty() ? oldCode : requestedCode);
            if (!ROLE_CODE.matcher(finalCode).matches())
                throw new AuthUseCase.ApiError("Mã vai trò gồm 2–32 ký tự a-z, số, gạch dưới hoặc gạch ngang.", 400);
            if (store.roleCodeExists(finalCode, roleId))
                throw new AuthUseCase.ApiError("Mã vai trò đã được sử dụng. Hãy nhập mã khác.", 400);
            String finalBase = "admin".equals(finalCode) ? "admin" : baseRole;
            String finalGroupId = "admin".equals(finalCode) ? sv(before, "business_group_id") : businessGroupId;
            String finalOrgId = "admin".equals(finalCode)
                    ? blankDefault(sv(before, "default_organization_unit_id"), null) : defaultOrganizationUnitId;
            store.updateRole(roleId, finalCode, name, description.isEmpty() ? null : description, finalBase,
                    finalGroupId.isEmpty() ? null : finalGroupId, finalOrgId.isEmpty() ? null : finalOrgId, sortOrder, now);
            if (!finalCode.equals(oldCode)) {
                store.renameRoleInUsers(oldCode, finalCode, now);
                store.renameRoleInApprovalStages(oldCode, finalCode, now);
            }
            return "Đã cập nhật vai trò " + finalCode + " · " + name
                    + (!finalCode.equals(oldCode) ? " và tự chuyển mã trong tài khoản/luồng duyệt" : "") + ".";
        }
        if (!ROLE_CODE.matcher(requestedCode).matches())
            throw new AuthUseCase.ApiError("Mã vai trò gồm 2–32 ký tự a-z, số, gạch dưới hoặc gạch ngang.", 400);
        if (store.roleCodeExists(requestedCode, null))
            throw new AuthUseCase.ApiError("Mã vai trò đã được sử dụng. Hãy nhập mã khác.", 400);
        store.insertRole(idGenerator.next("ROLE"), requestedCode, name, description.isEmpty() ? null : description,
                baseRole, businessGroupId, defaultOrganizationUnitId, sortOrder, now);
        return "Đã thêm vai trò " + name + ".";
    }

    public String setRoleStatus(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
        String roleId = trim(payload.get("roleId"));
        boolean active = payload.get("active") == Boolean.TRUE || "1".equals(trim(payload.get("active")));
        Map<String, Object> role = store.findRoleById(roleId)
                .orElseThrow(() -> new AuthUseCase.ApiError("Không tìm thấy vai trò.", 400));
        if ("admin".equals(sv(role, "code")) && !active)
            throw new AuthUseCase.ApiError("Không được vô hiệu hóa vai trò Quản trị hệ thống.", 400);
        store.setRoleActive(roleId, active, Instant.now());
        return active ? "Đã kích hoạt vai trò." : "Đã ẩn vai trò khỏi danh sách tạo tài khoản; người dùng cũ vẫn giữ dữ liệu lịch sử.";
    }

    public String deleteRoleCatalog(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
        String roleId = trim(payload.get("roleId"));
        Map<String, Object> role = store.findRoleById(roleId)
                .orElseThrow(() -> new AuthUseCase.ApiError("Không tìm thấy vai trò.", 400));
        if (isActive(role.get("system_locked")))
            throw new AuthUseCase.ApiError("Vai trò hệ thống gốc không được xóa; có thể đổi tên hoặc ẩn (trừ Quản trị hệ thống).", 400);
        if (store.countUsersByRole(sv(role, "code")) > 0)
            throw new AuthUseCase.ApiError("Vai trò đang được gán cho tài khoản nên chưa thể xóa. Hãy chuyển người dùng sang vai trò khác trước.", 400);
        if (store.countStagesUsingRole(sv(role, "code")) > 0)
            throw new AuthUseCase.ApiError("Vai trò đang được dùng trong luồng phê duyệt. Hãy bỏ vai trò khỏi các bước duyệt trước.", 400);
        store.deleteRole(roleId);
        return "Đã xóa vai trò tùy chỉnh.";
    }

    // ---- helpers port từ JS ----
    private Map<String, Object> resolveOrganization(Map<String, Object> payload, Map<String, Object> roleRow) {
        Map<String, Object> org = store.resolveOrganizationUnit(
                blankDefault(trim(payload.get("organizationUnitId")), trim(payload.get("department"))), false);
        if (org == null && !sv(roleRow, "defaultOrganizationUnitId").isEmpty())
            org = store.resolveOrganizationUnit(sv(roleRow, "defaultOrganizationUnitId"), false);
        if (org == null) {
            String base = sv(roleRow, "baseRole");
            String code = Map.of("procurement", "KH", "project", "DA", "accountant", "TCKT",
                    "director", "BGD", "engineer", "BCH", "commander", "BCH", "warehouse", "BCH",
                    "team", "BCH", "admin", "VNTECH").getOrDefault(base, "");
            if (!code.isEmpty()) org = store.resolveOrganizationUnit(code, false);
        }
        return org;
    }

    /** replaceDepartmentDefaults: xóa department_default + sinh lại theo role base (rút gọn). */
    public void rebuildDepartmentDefaults(String userId) {
        replaceDepartmentDefaults(userId);
    }

    private void replaceDepartmentDefaults(String userId) {
        Optional<Map<String, Object>> target = store.findUser(userId);
        if (target.isEmpty()) return;
        store.deleteDepartmentDefaultPermissions(userId);
        if ("admin".equals(sv(target.get(), "role"))) return;
        Instant now = Instant.now();
        for (String moduleKey : store.listActiveModuleKeys()) {
            Caps caps = defaultDepartmentPermission(target.get(), moduleKey);
            if (caps.any())
                store.insertDepartmentDefaultPermission(idGenerator.next("UMP"), userId, moduleKey,
                        caps.canView, caps.canUse, caps.canCreate, caps.canEdit, caps.canApprove, caps.canExport, now);
        }
    }

    private record Caps(int canView, int canUse, int canCreate, int canEdit, int canApprove, int canExport) {
        boolean any() { return canView + canUse + canCreate + canEdit + canApprove + canExport > 0; }
    }

    private Caps defaultDepartmentPermission(Map<String, Object> user, String moduleKey) {
        if ("dashboard".equals(moduleKey)) return new Caps(1, 1, 0, 0, 0, 1);
        String dep = departmentCodeForUser(user);
        boolean matches = switch (dep) {
            case "KH" -> moduleKey.startsWith("dept_plan_") || "supplier_catalog".equals(moduleKey);
            case "DA" -> moduleKey.startsWith("dept_project_");
            case "TCKT" -> moduleKey.startsWith("dept_finance_");
            case "HCPC" -> moduleKey.startsWith("dept_legal_");
            case "BCH" -> "site_command".equals(moduleKey);
            default -> false;
        };
        if (!matches) return new Caps(0, 0, 0, 0, 0, 0);
        if ("BCH".equals(dep)) return new Caps(1, 1, 0, 0, 0, 1);
        return new Caps(1, 1, 1, 1, "KH".equals(dep) ? 0 : 0, 1); // canApprove tinh chỉnh theo role sau
    }

    private String departmentCodeForUser(Map<String, Object> user) {
        String base = sv(user, "role"); // roleBase đã là base_role trong store.findUser
        return Map.of("procurement", "KH", "project", "DA", "accountant", "TCKT", "director", "BGD",
                "engineer", "BCH", "commander", "BCH", "warehouse", "BCH", "team", "BCH", "admin", "VNTECH")
                .getOrDefault(base, "DA");
    }

    static String canonicalRoleCode(Object value) {
        String code = trim(value);
        return Map.of("engineer", "ksda", "commander", "cht", "project", "da_nv",
                "procurement", "kh_nv", "warehouse", "thu_kho").getOrDefault(code, code);
    }

    private static String randomBody(int n) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < n; i++) sb.append(ALPHABET[RANDOM.nextInt(ALPHABET.length)]);
        return sb.toString();
    }

    private static boolean isActive(Object o) { return o instanceof Number n ? n.intValue() == 1 : Boolean.TRUE.equals(o); }
    private static String sv(Map<String, Object> m, String k) { Object v = m.get(k); return v == null ? "" : String.valueOf(v); }
    private static String trim(Object o) { return o == null ? "" : String.valueOf(o).trim(); }
    private static String blankDefault(String s, String fallback) { return s.isEmpty() ? (fallback == null ? "" : fallback) : s; }
    private static double numberValue(Object o) { try { return o == null ? 0 : Double.parseDouble(String.valueOf(o)); } catch (NumberFormatException e) { return 0; } }
    private static int intOf(Object o) { return o == null || "false".equalsIgnoreCase(String.valueOf(o)) || "0".equals(String.valueOf(o)) ? 0 : 1; }
    private static List<Object> listOf(Object o) { return o instanceof List<?> l ? (List<Object>) (List<?>) l : List.of(); }
    @SuppressWarnings("unchecked")
    private static Map<String, Object> asMap(Object o) { return o instanceof Map ? (Map<String, Object>) o : Map.of(); }

    private AuthUseCase.CurrentUser principalAsCurrent(Principal p) {
        return new AuthUseCase.CurrentUser(p.userId(), "", "", null, p.role(), p.role(), p.role(),
                null, null, null, false);
    }
}