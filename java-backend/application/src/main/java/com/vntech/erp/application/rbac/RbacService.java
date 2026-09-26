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

    /**
     * PHASE 0B — HÀNH ĐỘNG CÔNG KHAI, được miễn kiểm quyền module.
     *   • login — chạy TRƯỚC khi có phiên đăng nhập.
     *   • setup — khởi tạo hệ thống lần đầu, khi chưa có tài khoản nào.
     *   • logout / change_password / update_profile_avatar — việc TỰ PHỤC VỤ của chính
     *     người dùng: nếu bắt buộc phải có quyền module thì một tài khoản bị thu hồi
     *     hết quyền cũng không thể đổi mật khẩu hay thoát ra được.
     *   • mark_notification_read / mark_notification_snooze / mark_notification_all_read (MT2 §14) —
     *     CÙNG nhóm tự phục vụ: thông báo là **CỦA CHÍNH user** (`cu.id()`), và một tài khoản bị thu hồi
     *     hết quyền module vẫn phải đọc/đánh dấu đọc được thông báo của mình.
     *     ⚠️ Vì sao KHÔNG khai `List.of()` ở map module: `requireActionModule` coi map rỗng là
     *     **MẶC ĐỊNH TỪ CHỐI (403)** (PHASE 0B S-03, xem nhánh `required.isEmpty()` bên dưới) —
     *     ⛔ map rỗng KHÔNG có nghĩa là "không gác".
     * Đây là danh sách ĐÓNG (allowlist) — mọi action khác đều phải qua kiểm quyền.
     */
    public static final java.util.Set<String> PUBLIC_ACTIONS = java.util.Set.of(
            "login", "setup", "logout", "change_password", "update_profile_avatar",
            "mark_notification_read", "mark_notification_snooze", "mark_notification_all_read",
            // MT2 §13.4 — chữ ký là dữ liệu TỰ PHỤC VỤ của chính user (cùng nhóm `update_profile_avatar`).
            // ⚠️ Phải nằm ở ĐÂY (⛔ KHÔNG phải `List.of()` ở map module — map rỗng = NÉM 403).
            "update_profile_signature");

    public boolean isCompanyLeadership(AuthUseCase.CurrentUser user) {
        return List.of("director", "accountant").contains(user.role());
    }

    /** requireActionModule(user, action) — ném ApiError(403) nếu thiếu quyền. */
    public void requireActionModule(AuthUseCase.CurrentUser user, String action) {
        if (PUBLIC_ACTIONS.contains(action)) return;
        List<String> required = ActionRbacRegistry.modulesFor(action);
        if (isAdmin(user)) return;
        if (isCompanyLeadership(user) && !required.contains("admin")) return;
        if (required.isEmpty()) {
            // PHASE 0B (S-03) — MẶC ĐỊNH TỪ CHỐI.
            // Trước đây nhánh này CHO QUA (return) nên mọi action chưa khai module đều hở.
            // Nay: action chưa khai module thì KHÔNG có cơ sở nào để kiểm quyền ⇒ từ chối.
            // An toàn vì 46 action còn khai rỗng đều nằm trong 2 nhóm đã được xử lý:
            //   41 action đã bị SystemController chặn bằng requireRequireAdmin
            //    5 action là hành động công khai (đã miễn ở đầu hàm)
            throw new AuthUseCase.ApiError(
                    "Thao tác chưa được khai báo quyền trong hệ thống. Liên hệ quản trị viên.", 403);
        }
        String capability = ActionRbacRegistry.capabilityFor(action);
        for (String moduleKey : required) {
            if (modulePermissionStore.canUseModule(user.id(), moduleKey, capability)) return;
        }
        throw new AuthUseCase.ApiError(
                "Tài khoản chưa được quản trị viên cấp đúng quyền cho thao tác này.", 403);
    }

    /**
     * requireRole(user, roles) — port nguyên trạng JS {@code requireRole(user, roles)}:
     * JS so với {@code effectiveRole(user) = clean(user.roleBase || user.role)}, tức mã ENGINE
     * (base_role trong role_catalog), không phải mã vai trò chuẩn.
     *
     * <p>Vì mã chuẩn ánh xạ NHIỀU-VỀ-MỘT sang base_role (cht→commander, da_nv &amp; da_truong→project,
     * kh_nv &amp; kh_truong→procurement, thu_kho &amp; kho_tong→warehouse, ksda→engineer, thuky→director)
     * nên phải nhận CẢ HAI: mã vai trò của chính tài khoản VÀ mã engine. Nếu chỉ so mã chuẩn thì mọi
     * chức danh cùng nhóm (da_truong, kh_truong, kho_tong, thuky...) và vai trò do quản trị viên tạo
     * thêm đều bị 403 oan, trong khi JS cho phép.
     */
    public void requireRole(AuthUseCase.CurrentUser user, java.util.Collection<String> roles) {
        if (!roles.contains(user.role()) && !roles.contains(user.roleBase()) && !isAdmin(user)) {
            throw new AuthUseCase.ApiError("Tài khoản không có quyền thực hiện nghiệp vụ này.", 403);
        }
    }
}