package com.vntech.erp.application.service;

import com.vntech.erp.application.port.out.IdGenerator;
import com.vntech.erp.application.port.out.PasswordHasher;
import com.vntech.erp.application.port.out.UserAdminStore;
import com.vntech.erp.application.rbac.RbacService;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.LinkedHashMap;
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
        // P5.3 — BẮT BUỘC kiểm tra ràng buộc TRƯỚC khi xoá quyền cũ.
        // Nếu đặt sau clearUserScopes(), một yêu cầu bị TỪ CHỐI vẫn xoá sạch phạm vi
        // dự án / kho / quyền hiện có của người dùng ⇒ MẤT DỮ LIỆU.
        assertDepartmentAllowsPermissions(targetUserId, target, payload);
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
        // P5.7 — cấp bậc auto_grant_all (Giám đốc / Tổng giám đốc) tự động có quyền cao nhất,
        // không cần cấu hình tay từng chức năng.
        boolean autoAll = store.findUserSystemLevel(userId)
                .map((l) -> intOf(l.get("autogrant")) == 1).orElse(false);
        String orgUnitId = svAny(target.get(), "organizationUnitId", "organizationunitid");
        for (String moduleKey : store.listActiveModuleKeys()) {
            if ("admin".equals(moduleKey)) continue;
            Caps caps;
            if (autoAll) {
                caps = new Caps(1, 1, 1, 1, 1, 1);
            } else {
                // P5 — bảng department_module_permissions là nguồn chính; nếu phòng chưa được
                // cấu hình thì giữ quy tắc mặc định cũ để không khoá nhầm người dùng.
                Optional<Map<String, Object>> dep = orgUnitId.isEmpty()
                        ? Optional.empty() : store.findDepartmentPermission(orgUnitId, moduleKey);
                caps = dep.isPresent() ? capsOfDepartment(dep.get()) : defaultDepartmentPermission(target.get(), moduleKey);
            }
            if (caps.any())
                store.insertDepartmentDefaultPermission(idGenerator.next("UMP"), userId, moduleKey,
                        caps.canView, caps.canUse, caps.canCreate, caps.canEdit, caps.canApprove, caps.canExport, now);
        }
    }

    private Caps capsOfDepartment(Map<String, Object> row) {
        if (intOf(row.get("active")) != 1) return new Caps(0, 0, 0, 0, 0, 0);
        return new Caps(intOf(row.get("can_view")), intOf(row.get("can_use")), intOf(row.get("can_create")),
                intOf(row.get("can_edit")), intOf(row.get("can_approve")), intOf(row.get("can_export")));
    }

    /**
     * P5.3 — chặn cấp cho người dùng quyền mà PHÒNG BAN không có.
     * Ngoại lệ (P5.8): tài khoản admin và cấp bậc có auto_grant_all.
     * Nếu phòng ban CHƯA cấu hình quyền nào thì bỏ qua — tránh khoá nhầm toàn hệ thống
     * khi chưa thiết lập tab "Phân quyền phòng ban".
     * Hàm này chỉ ĐỌC, không ghi: phải gọi TRƯỚC mọi thao tác xoá quyền cũ.
     */
    private void assertDepartmentAllowsPermissions(String targetUserId, Map<String, Object> target,
                                                   Map<String, Object> payload) {
        boolean levelException = "admin".equals(sv(target, "role"))
                || store.findUserSystemLevel(targetUserId)
                        .map((l) -> intOf(l.get("autogrant")) == 1).orElse(false);
        if (levelException) return;
        String orgUnitId = svAny(target, "organizationUnitId", "organizationunitid");
        if (orgUnitId.isEmpty()) return;
        List<Map<String, Object>> allDeptPerms = store.departmentModulePermissions();
        boolean deptConfigured = allDeptPerms.stream()
                .anyMatch((d) -> orgUnitId.equals(sv(d, "orgunitid")) && intOf(d.get("active")) == 1);
        if (!deptConfigured) return;
        for (Object o : listOf(payload.get("modulePermissions"))) {
            Map<?, ?> row = asMap(o);
            String moduleKey = trim(row.get("moduleKey"));
            if (moduleKey.isEmpty() || "admin".equals(moduleKey)) continue;
            int want = intOf(row.get("canView")) + intOf(row.get("canUse")) + intOf(row.get("canCreate"))
                    + intOf(row.get("canEdit")) + intOf(row.get("canApprove")) + intOf(row.get("canExport"));
            if (want == 0) continue;
            Optional<Map<String, Object>> dep = store.findDepartmentPermission(orgUnitId, moduleKey);
            boolean allowed = dep.isPresent() && intOf(dep.get().get("active")) == 1
                    && intOf(dep.get().get("can_view")) == 1;
            if (!allowed) {
                String deptName = allDeptPerms.stream()
                        .filter((d) -> orgUnitId.equals(sv(d, "orgunitid")))
                        .map((d) -> sv(d, "orgname")).findFirst().orElse("phòng ban");
                throw new AuthUseCase.ApiError("Phòng ban “" + deptName + "” chưa được cấp quyền cho chức năng “"
                        + moduleKey + "”. Hãy cấp ở tab “Phân quyền phòng ban” trước, hoặc xếp cho tài khoản "
                        + "một cấp bậc đủ cao (tự động toàn quyền).", 400);
            }
        }
    }

    // ================= P5: phân quyền phòng ban =================

    public String saveDepartmentPermission(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
        String organizationUnitId = trim(payload.get("organizationUnitId"));
        String moduleKey = trim(payload.get("moduleKey"));
        if (organizationUnitId.isEmpty() || moduleKey.isEmpty())
            throw new AuthUseCase.ApiError("Cần chọn phòng ban và chức năng.", 400);
        if ("admin".equals(moduleKey))
            throw new AuthUseCase.ApiError("Chức năng quản trị chỉ dành cho tài khoản admin.", 400);
        Instant now = Instant.now();
        store.upsertDepartmentPermission(idGenerator.next("DMP"), organizationUnitId, moduleKey,
                intOf(payload.get("canView")), intOf(payload.get("canUse")), intOf(payload.get("canCreate")),
                intOf(payload.get("canEdit")), intOf(payload.get("canApprove")), intOf(payload.get("canExport")),
                principal.userId(), now);
        int synced = syncDepartmentUsers(now);
        return "Đã lưu quyền phòng ban cho chức năng “" + moduleKey + "”; đồng bộ lại " + synced + " tài khoản.";
    }

    public String deleteDepartmentPermission(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
        String organizationUnitId = trim(payload.get("organizationUnitId"));
        String moduleKey = trim(payload.get("moduleKey"));
        if (organizationUnitId.isEmpty() || moduleKey.isEmpty())
            throw new AuthUseCase.ApiError("Cần chọn phòng ban và chức năng.", 400);
        store.deleteDepartmentPermission(organizationUnitId, moduleKey);
        int synced = syncDepartmentUsers(Instant.now());
        return "Đã thu hồi quyền của phòng ban; đồng bộ lại " + synced + " tài khoản (ngoại lệ cá nhân giữ nguyên).";
    }

    /** Sinh lại quyền department_default cho mọi tài khoản đang hoạt động (trừ admin). */
    public String rebuildDepartmentPermissions(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
        int n = syncDepartmentUsers(Instant.now());
        return "Đã đồng bộ lại quyền mặc định phòng ban cho " + n + " tài khoản.";
    }

    private int syncDepartmentUsers(Instant now) {
        int n = 0;
        for (String userId : store.activeUserIds()) {
            Optional<Map<String, Object>> user = store.findUser(userId);
            if (user.isEmpty() || "admin".equals(sv(user.get(), "role"))) continue;
            replaceDepartmentDefaults(userId);
            n++;
        }
        return n;
    }

    // ================= P5: cấp bậc hệ thống =================

    public String saveSystemLevel(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
        String levelId = trim(payload.get("levelId"));
        String code = trim(payload.get("code"));
        String name = trim(payload.get("name"));
        if (code.isEmpty() || name.isEmpty())
            throw new AuthUseCase.ApiError("Cấp bậc cần mã và tên.", 400);
        if (!code.matches("[A-Za-z0-9_]{2,64}"))
            throw new AuthUseCase.ApiError("Mã cấp bậc chỉ gồm chữ, số và gạch dưới (2–64 ký tự).", 400);
        Optional<Map<String, Object>> byCode = store.findSystemLevelByCode(code);
        boolean exists = !levelId.isEmpty() && store.findSystemLevelById(levelId).isPresent();
        if (byCode.isPresent() && !exists)
            throw new AuthUseCase.ApiError("Mã cấp bậc “" + code + "” đã tồn tại.", 400);
        if (byCode.isPresent() && exists && !trim(byCode.get().get("id")).equals(levelId))
            throw new AuthUseCase.ApiError("Mã cấp bậc “" + code + "” đã được dùng cho cấp bậc khác.", 400);
        Map<String, Object> level = new LinkedHashMap<>();
        level.put("id", exists ? levelId : idGenerator.next("LVL"));
        level.put("code", code);
        level.put("name", name);
        level.put("description", trim(payload.get("description")));
        level.put("rank", (int) Math.round(numberOf(payload.get("rank"))));
        level.put("autoGrantAll", truthy(payload.get("autoGrantAll")) ? 1 : 0);
        level.put("canSkipLevels", truthy(payload.get("canSkipLevels")) ? 1 : 0);
        level.put("sortOrder", (int) Math.round(numberOf(payload.get("sortOrder"))));
        store.upsertSystemLevel(level, Instant.now());
        int synced = truthy(payload.get("autoGrantAll")) ? syncDepartmentUsers(Instant.now()) : 0;
        String extra = truthy(payload.get("autoGrantAll"))
                ? " Cấp bậc này TỰ ĐỘNG có toàn quyền (đã đồng bộ " + synced + " tài khoản)." : "";
        String skip = truthy(payload.get("canSkipLevels"))
                ? " Được DUYỆT VƯỢT CẤP, không cần thêm tên vào từng quy trình." : "";
        return "Đã lưu cấp bậc “" + name + "”." + extra + skip;
    }

    public String setSystemLevelStatus(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
        String levelId = trim(payload.get("levelId"));
        store.findSystemLevelById(levelId)
                .orElseThrow(() -> new AuthUseCase.ApiError("Không tìm thấy cấp bậc.", 400));
        boolean active = truthy(payload.get("active"));
        store.setSystemLevelStatus(levelId, active, Instant.now());
        return active ? "Đã kích hoạt cấp bậc." : "Đã ngừng dùng cấp bậc (tài khoản đang giữ vẫn giữ nguyên).";
    }

    public String deleteSystemLevel(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
        String levelId = trim(payload.get("levelId"));
        Map<String, Object> level = store.findSystemLevelById(levelId)
                .orElseThrow(() -> new AuthUseCase.ApiError("Không tìm thấy cấp bậc.", 400));
        int inUse = store.countUsersWithLevel(sv(level, "code"));
        if (inUse > 0)
            throw new AuthUseCase.ApiError("Còn " + inUse + " tài khoản đang giữ cấp bậc này. "
                    + "Hãy chuyển họ sang cấp bậc khác trước khi xóa.", 400);
        store.deleteSystemLevel(levelId);
        return "Đã xóa cấp bậc.";
    }

    public String setUserSystemLevel(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
        String userId = trim(payload.get("userId"));
        String levelCode = trim(payload.get("levelCode"));
        Map<String, Object> user = store.findUser(userId)
                .orElseThrow(() -> new AuthUseCase.ApiError("Không tìm thấy tài khoản.", 400));
        Map<String, Object> level = null;
        if (!levelCode.isEmpty()) {
            level = store.findSystemLevelByCode(levelCode)
                    .orElseThrow(() -> new AuthUseCase.ApiError("Cấp bậc “" + levelCode + "” không tồn tại.", 400));
            if (intOf(level.get("active")) != 1)
                throw new AuthUseCase.ApiError("Cấp bậc “" + sv(level, "name") + "” đang ngừng sử dụng.", 400);
        }
        store.setUserSystemLevel(userId, levelCode, Instant.now());
        replaceDepartmentDefaults(userId);
        StringBuilder msg = new StringBuilder("Đã xếp cấp bậc cho ").append(sv(user, "fullName")).append('.');
        if (level != null) {
            if (intOf(level.get("auto_grant_all")) == 1)
                msg.append(" Cấp bậc này tự động có toàn quyền nên đã được cấp đủ quyền.")
                   .append(" Bạn KHÔNG cần thêm người này vào từng quy trình phê duyệt.");
            if (intOf(level.get("can_skip_levels")) == 1)
                msg.append(" Cấp bậc này được phép DUYỆT VƯỢT CẤP.");
        }
        return msg.toString();
    }

    /** Thông tin cấp bậc để UI hiển thị cảnh báo trước khi lưu (P5.7). */
    public Map<String, Object> systemLevelImpact(Principal principal, Map<String, Object> payload) {
        String levelCode = trim(payload.get("levelCode"));
        Map<String, Object> level = store.findSystemLevelByCode(levelCode).orElse(null);
        if (level == null) return Map.of("found", false);
        int users = store.countUsersWithLevel(levelCode);
        return Map.of("found", true, "name", sv(level, "name"), "users", users,
                "autoGrantAll", intOf(level.get("auto_grant_all")) == 1,
                "canSkipLevels", intOf(level.get("can_skip_levels")) == 1,
                "moduleCount", store.listActiveModuleKeys().size());
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

    /**
     * Đọc theo camelCase, nếu rỗng thì thử bản viết thường.
     * VÌ SAO CẦN: H2 (profile test) viết thường nhãn alias không có backtick, còn MySQL giữ
     * nguyên văn — nên cùng một câu SELECT cho ra khoá khác nhau ở hai nơi. Hàm này giúp
     * code chạy đúng ở cả hai mà không phải nhân đôi truy vấn.
     */
    private static String svAny(Map<String, Object> m, String camel, String lower) {
        String v = sv(m, camel);
        return v.isEmpty() ? sv(m, lower) : v;
    }
    private static String trim(Object o) { return o == null ? "" : String.valueOf(o).trim(); }
    private static String blankDefault(String s, String fallback) { return s.isEmpty() ? (fallback == null ? "" : fallback) : s; }
    private static double numberValue(Object o) { try { return o == null ? 0 : Double.parseDouble(String.valueOf(o)); } catch (NumberFormatException e) { return 0; } }
    private static int intOf(Object o) { return o == null || "false".equalsIgnoreCase(String.valueOf(o)) || "0".equals(String.valueOf(o)) ? 0 : 1; }

    /** P5 — cờ bật/tắt nhận cả boolean, 1/0 và "1"/"0"/"true"/"false". */
    private static boolean truthy(Object o) { return intOf(o) == 1; }

    /** P5 — đọc số (rank/sortOrder) từ payload JSON có thể là Number hoặc chuỗi. */
    private static double numberOf(Object o) {
        if (o == null) return 0;
        if (o instanceof Number n) return n.doubleValue();
        try { return Double.parseDouble(String.valueOf(o).trim()); } catch (NumberFormatException e) { return 0; }
    }
    private static List<Object> listOf(Object o) { return o instanceof List<?> l ? (List<Object>) (List<?>) l : List.of(); }
    @SuppressWarnings("unchecked")
    private static Map<String, Object> asMap(Object o) { return o instanceof Map ? (Map<String, Object>) o : Map.of(); }

    private AuthUseCase.CurrentUser principalAsCurrent(Principal p) {
        return new AuthUseCase.CurrentUser(p.userId(), "", "", null, p.role(), p.role(), p.role(),
                null, null, null, false);
    }
}