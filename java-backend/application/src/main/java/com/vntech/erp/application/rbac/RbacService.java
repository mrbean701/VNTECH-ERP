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
     * ⭐ S-1 (USER CHỐT 08/10/2026 — `DEC-20261008-002`) — ĐỌC quyền của MỘT tài khoản theo module+capability.
     *
     * <p>Vì sao cần lớp mỏng này: use-case `UserManagementUseCase.saveUserAccess` phải đối chiếu quyền
     * **ĐANG CÓ** của người gọi trước khi cho ghi (để chặn TỰ NÂNG QUYỀN). Port
     * {@link ModulePermissionStore} đã nằm sẵn ở lớp này ⇒ ⛔ **không** phải thêm tham số vào constructor
     * của use-case (thêm sẽ lan sang cấu hình Spring + mọi bài kiểm thử — ⛔ rủi ro vỡ).
     *
     * @return {@code true} nếu tài khoản đang có capability đó trên module (còn hiệu lực, module đang bật)
     */
    public boolean canUseModule(String userId, String moduleKey, String capability) {
        return modulePermissionStore.canUseModule(userId, moduleKey, capability);
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
            "update_profile_signature",
            // MỐC 110 (30/09/2026) — GỬI «BÁO LỖI / GÓP Ý» là việc TỰ PHỤC VỤ của MỌI user đã đăng nhập.
            // Ý định thiết kế đã ghi rõ ở `app/screens/ErrorReportModal.tsx:14`: «MọI user đã đăng nhập
            // đều gửi được — action `save_error_report` KHÔNG gắc module».
            // ⛔ Nhưng registry khai `Map.entry("save_error_report", List.of())`, mà PHASE 0B đã đổi
            // ngữ nghĩa map rỗng từ «không gác» thành TỪ CHỐI (xem nhánh `required.isEmpty()` bên dưới)
            // ⇒ MỌI tài khoản không phải admin nhận 403 «Thao tác chưa được khai báo quyền trong hệ thống.»
            // khi bấm nút «Báo lỗi / Góp ý». ĐO THẬT: probe `sec_probe_017830` ⇒ 403; admin ⇒ 200.
            // ⚠️ An toàn: `SystemController.java:1472` vẫn gọi `requireCurrentUser(request)` cho action này
            // ⇒ BẮT BUỘC đăng nhập, chỉ bỏ qua cổng MODULE (đúng như ý định ban đầu).
            "save_error_report");

    /**
     * ⭐ `P-08` (USER UỶ QUYỀN «làm theo đề xuất» 08/10/2026) — **ACTION CHỈ ADMIN**.
     * ⚠️ ĐO THẬT 16/16 action: route JS đều `requireRole(["admin"])`, còn Java chỉ `requireCurrentUser(request)`
     *    ⇒ **cổng registry là cổng DUY NHẤT** ⇒ ⛔ **KHÔNG được gắn module** cho các action này
     *    (gắn module = ai có `canUse`/`canEdit` của module đó ĐI QUA ⇒ LEO THANG — đúng bài học `TM-04`).
     * ⭐ Vì sao cần Set này thay vì để `List.of()`: `RbacService` cho **`director`/`accountant`** đi qua
     *    **mọi** danh sách không chứa `"admin"` (nhánh `isCompanyLeadership`) ⇒ ⛔ chưa khớp với route JS
     *    («chỉ admin») và ⛔ thông điệp trả về SAI («Thao tác chưa được khai báo quyền»).
     *    ⇒ Set này **siết đúng bằng route JS** + trả **đúng thông điệp**.
     */
    public static final java.util.Set<String> ADMIN_ONLY_ACTIONS = java.util.Set.of(
            // nhóm DANH MỤC VẬT TƯ (7)
            "save_material_category", "save_material_subcategory", "set_material_category_status",
            "set_material_subcategory_status", "delete_material_category", "delete_material_subcategory",
            "import_material_catalog",
            // nhóm LỊCH TRÌNH DUYỆT (3)
            "save_approval_stage", "set_approval_stage_status", "delete_approval_stage",
            // nhóm TỔ ĐỘI (2) — ⚠️ `TM-04` chốt: `requireRole(["admin"])` ⇒ ⛔ KHÔNG nới module `site_command`
            "set_project_team_status", "delete_project_team",
            // nhóm NHẬP HÀNG LOẠT (2) + CẤU HÌNH (4)
            "bulk_import_projects", "bulk_import_users",
            "save_email_settings", "retry_email",
            "save_ui_display_settings", "save_trust_development_settings");

    public boolean isCompanyLeadership(AuthUseCase.CurrentUser user) {
        return List.of("director", "accountant").contains(user.role());
    }

    /** requireActionModule(user, action) — ném ApiError(403) nếu thiếu quyền. */
    public void requireActionModule(AuthUseCase.CurrentUser user, String action) {
        if (PUBLIC_ACTIONS.contains(action)) return;
        // ⭐ `P-08` — ACTION CHỈ ADMIN: siết ĐÚNG bằng route JS (`requireRole(["admin"])`) và trả ĐÚNG thông điệp.
        //    ⚠️ Phải đứng TRƯỚC các nhánh `isAdmin`/`isCompanyLeadership` bên dưới (nếu không, `director`/`accountant`
        //    vẫn đi qua vì nhánh học-vị bỏ qua mọi danh sách không chứa `"admin"`).
        if (ADMIN_ONLY_ACTIONS.contains(action)) {
            if (!"admin".equals(user.role()))
                throw new AuthUseCase.ApiError("Tài khoản không có quyền thực hiện nghiệp vụ này.", 403);
            return;
        }
        List<String> required = ActionRbacRegistry.modulesFor(action);
        if (isAdmin(user)) return;
        if (isCompanyLeadership(user) && !required.contains("admin")) return;
        if (required.isEmpty()) {
            // PHASE 0B (S-03) — MẶC ĐỊNH TỪ CHỐI.
            // Trước đây nhánh này CHO QUA (return) nên mọi action chưa khai module đều hở.
            // Nay: action chưa khai module thì KHÔNG có cơ sở nào để kiểm quyền ⇒ từ chối.
            // ⛔ MỐC 110 (30/09/2026) — SỐ LIỆU TỪNG GHI Ở ĐÂY ĐÃ SAI; ĐÃ ĐO LẠI BẰNG SCRIPT:
            //    bản cũ ghi «46 action còn khai rỗng … 41 bị requireRequireAdmin + 5 công khai».
            //    ĐO THẬT: **65** action khai rỗng = **38** bị requireRequireAdmin + **8** công khai
            //    + **19** action KHÔNG thuộc nhóm nào ⇒ 403 với MỌI tài khoản không phải admin.
            //    Trong 19 đó có `save_error_report` — nút «Báo lỗi / Góp ý» mà user yêu cầu MỌI user
            //    dùng được ⇒ đã chuyển sang PUBLIC_ACTIONS (MỐC 110).
            //    ✅ ĐÃ XỬ LÝ 08/10/2026 (`P-08`, user uỷ quyền «làm theo đề xuất»): **18 action** đó nay nằm
            //    trong `ADMIN_ONLY_ACTIONS` ⇒ bị chặn ở NHÁNH ĐẦU TIÊN với **THÔNG ĐIỆP ĐÚNG**
            //    («Tài khoản không có quyền thực hiện nghiệp vụ này.») ⇒ ⛔ không còn rơi vào nhánh này.
            //    ⚠️ Vì sao ⛔ KHÔNG gắn module cho chúng: ĐO THẬT **16/16 action** = route JS
            //    `requireRole(user, ["admin"])` (CHỈ ADMIN) mà Java chỉ `requireCurrentUser` ⇒ **registry là
            //    cổng DUY NHẤT** ⇒ gắn module = ai có `canUse`/`canEdit` của module đó **ĐI QUA** ⇒ **LEO THANG**
            //    (bài học `tests/tm04-team-crud.test.mjs`; test chống leo thang nay ở `tests/t13`).
            //    ⇒ Nhánh dưới đây nay chỉ còn là **PHÒNG VỆ** cho action THẬT SỰ chưa khai quyền.
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