package com.vntech.erp.application.rbac;

import com.vntech.erp.application.port.out.ModulePermissionStore;
import com.vntech.erp.application.service.AuthUseCase;

import java.time.Instant;
import java.util.List;

/**
 * RBAC — port nguyên trạng requireActionModule()/canUseModule()/isAdmin() của monolith JS:
 *   - admin: luôn được phép
 *   - C-level leadership: được phép mọi module trừ "admin"
 *   - user thường: cần user_module_permissions.can_<capability>=1 với module của action
 *     (module phải active; menu group của module phải active)
 */
public final class RbacService {

    private final ModulePermissionStore modulePermissionStore;

    public RbacService(ModulePermissionStore modulePermissionStore) {
        this.modulePermissionStore = modulePermissionStore;
    }

    public boolean isAdmin(AuthUseCase.CurrentUser user) {
        return "admin".equals(user.role());
    }

    public boolean isCompanyLeadership(AuthUseCase.CurrentUser user) {
        return List.of("director", "accountant").contains(user.role());
    }

    /** requireActionModule(user, action) — ném ApiError(403) nếu thiếu quyền. */
    public void requireActionModule(AuthUseCase.CurrentUser user, String action) {
        List<String> required = ActionRbacRegistry.modulesFor(action);
        if (required.isEmpty() || isAdmin(user)) return;
        if (isCompanyLeadership(user) && !required.contains("admin")) return;
        String capability = ActionRbacRegistry.capabilityFor(action);
        for (String moduleKey : required) {
            if (modulePermissionStore.canUseModule(user.id(), moduleKey, capability)) return;
        }
        throw new AuthUseCase.ApiError(
                "Tài khoản chưa được quản trị viên cấp đúng quyền cho thao tác này.", 403);
    }

    /** requireRole(user, ["admin"]) — ném ApiError(403) nếu không đúng vai trò. */
    public void requireRole(AuthUseCase.CurrentUser user, java.util.Collection<String> roles) {
        if (!roles.contains(user.role()) && !isAdmin(user)) {
            throw new AuthUseCase.ApiError("Tài khoản không có quyền thực hiện nghiệp vụ này.", 403);
        }
    }
}