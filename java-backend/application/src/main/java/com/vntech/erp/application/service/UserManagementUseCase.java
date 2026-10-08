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
        // MT2-P12-05 (§13.3) — ROOT CAUSE: `createUser` **TRƯỚC ĐÂY** lấy `employeeCode` mà KHÔNG kiểm tra rỗng
        // ⇒ có thể tạo tài khoản **không có mã** (đã đo được: 1 user có `employee_code` rỗng trên MySQL),
        // trong khi `updateUser` lại ĐÃ chặn ⇒ lệch không nhất quán. ⇒ Chặn ngay tại đây (§17 backend là
        // lớp kiểm soát) với CÙNG thông điệp như `updateUser` để không lộ chi tiết nội bộ.
        String employeeCode = trim(payload.get("employeeCode"));
        if (employeeCode.isEmpty())
            throw new AuthUseCase.ApiError("Mã nhân viên là bắt buộc.", 400);
        String userId = idGenerator.next("USR");
        Instant now = Instant.now();
        store.insertUser(userId, employeeCode, trim(payload.get("fullName")),
                username, trim(payload.get("email")).toLowerCase().isEmpty() ? null : trim(payload.get("email")).toLowerCase(),
                passwordHasher.hash(password), role, sv(org, "name"), sv(org, "id"),
                numberValue(payload.get("approvalLimit")), true, now);
        // MT2-P12-06 (§13.4) — chữ ký PHẢI có ở modal **TẠO** lẫn modal **CHỈNH SỬA**
        // («Trong modal tạo user và chỉnh sửa user ⇒ thêm Chữ ký»). `updateUser` đã xử lý từ P3-04,
        // nhưng `createUser` **CHƯA** lưu ⇒ ⛔ nếu chỉ sửa UI thì chọn ảnh lúc tạo sẽ KHÔNG được lưu
        // (nút chết / mất dữ liệu). Ghi CHỈ khi payload có khoá `signatureUrl` (⛔ không ghi đè mặc định NULL).
        if (payload.containsKey("signatureUrl")) {
            String signature = trim(payload.get("signatureUrl"));
            store.setUserSignature(userId, signature, now);
        }
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
        boolean callerIsAdmin = requireAccountUpdateRight(principal);
        String targetUserId = trim(payload.get("userId"));
        Map<String, Object> target = store.findUser(targetUserId).orElse(null);
        if (target == null) throw new AuthUseCase.ApiError("Không tìm thấy tài khoản.", 400);
        // MỐC 103 — mở khoá MÃ NV + TÊN ĐĂNG NHẬP; rỗng ⇒ 400.
        String employeeCode = trim(payload.get("employeeCode"));
        if (employeeCode.isEmpty()) employeeCode = sv(target, "employeeCode");
        if (employeeCode.isEmpty())
            throw new AuthUseCase.ApiError("Mã nhân viên, họ tên, tên đăng nhập và phòng/bộ phận là bắt buộc.", 400);
        String username = trim(payload.get("username")).toLowerCase();
        if (username.isEmpty()) username = sv(target, "username").toLowerCase();
        String fullName = trim(payload.get("fullName"));
        String email = trim(payload.get("email")).toLowerCase().isEmpty() ? null : trim(payload.get("email")).toLowerCase();
        String role = guardRoleChange(callerIsAdmin, target, payload);
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
        // MT2 §13.4 — «Trong modal tạo user và CHỈNH SỬA user ⇒ thêm Chữ ký»: đường QUẢN TRỊ.
        // ⚠️ CHỈ xử lý khi payload CÓ khoá `signatureUrl` (⛔ không ghi đè chữ ký khi client không gửi trường này).
        // Luật giống hệt đường tự phục vụ (§13.4): data-URL JPG/PNG/WebP · ≤ 2,8 MB · rỗng/null ⇒ XOÁ.
        if (payload.containsKey("signatureUrl")) {
            String signature = trim(payload.get("signatureUrl"));
            if (!signature.isEmpty() && !signature.matches("(?i)^data:image/(png|jpeg|webp);base64,.*"))
                throw new AuthUseCase.ApiError("Chữ ký chỉ hỗ trợ JPG, PNG hoặc WebP.", 400);
            if (signature.length() > 2_800_000)
                throw new AuthUseCase.ApiError("Ảnh chữ ký vượt quá giới hạn 2 MB.", 400);
            store.setUserSignature(targetUserId, signature, Instant.now());
        }
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

    /**
     * MỐC 103 (user 29/09) — cổng quyền cập nhật tài khoản.
     *
     * <p>ADMIN đi qua vì `isAdmin`. Người khác cần module `admin_tab_01` + quyền SỬA
     * (khai ở `ActionRbacRegistry`, capability `canEdit`) — `update_user` trước đây
     * <b>chưa</b> được khai nên mọi user thường đều 403.
     *
     * @return {@code true} nếu người gọi là Quản trị hệ thống
     */
    private boolean requireAccountUpdateRight(Principal principal) {
        boolean isAdmin = rbac.isAdmin(principalAsCurrent(principal));
        if (!isAdmin) rbac.requireActionModule(principalAsCurrent(principal), "update_user");
        return isAdmin;
    }

    /**
     * MỐC 103 (user 29/09) — ⛔ CHỐNG LEO THANG ĐẶC QUYỀN.
     *
     * <p>Đổi `role` = đổi quyền ⇒ chỉ ADMIN được đổi. Người có `admin_tab_01` vẫn sửa được
     * MÃ NV · TÊN ĐĂNG NHẬP · HỌ TÊN · EMAIL · PHÒNG/BỘ PHẬN.
     */
    private String guardRoleChange(boolean callerIsAdmin, Map<String, Object> target,
            Map<String, Object> payload) {
        String current = sv(target, "role");
        if (!payload.containsKey("role") || trim(payload.get("role")).isEmpty())
            return current;
        // MỐC 109 (30/09/2026) — ⛔ KHÔNG ĐỔI THÌ PHẢI CHO QUA.
        // Modal sửa tài khoản LUÔN gửi kèm ô `role` (đó là một trường của form, kể cả khi
        // người dùng không chạm tới), nên nếu chặn MỌI payload CÓ `role` thì người được cấp
        // `admin_tab_01` + `canEdit` LUÔN nhận 403 — đúng lỗi BUG-02 tái diễn ở tầng use-case.
        // ĐO THẬT: probe `sec_probe_017830` gửi `role='ksda'` (y hệt vai trò hiện tại) ⇒ 403
        // «Chỉ Quản trị hệ thống mới đổi được vai trò…» dù không hề đổi vai trò.
        // Chỉ chặn khi vai trò THẬT SỰ ĐỔI (so cả mã gửi lên lẫn mã chuẩn hoá).
        String requested = trim(payload.get("role"));
        if (requested.equalsIgnoreCase(trim(current))
                || canonicalRoleCode(requested).equalsIgnoreCase(trim(current)))
            return current;
        if (!callerIsAdmin)
            throw new AuthUseCase.ApiError(
                    "Chỉ Quản trị hệ thống mới đổi được vai trò. Bạn vẫn sửa được mã nhân viên, "
                    + "tên đăng nhập, họ tên, email và phòng/bộ phận.", 403);
        return canonicalRoleCode(payload.get("role"));
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

    // MỐC 112 — `clearUserScopes()` + vòng chèn lại nay nằm trong MỘT transaction
    // (`store.runAtomically`). Trước đây mỗi lệnh là một transaction riêng: xoá commit trước,
    // insert lỗi giữa chừng ⇒ phạm vi/quyền bị xoá không bao giờ được ghi lại.
    // KHÔNG thêm `@Transactional` ở đây: module `application` cố ý KHÔNG phụ thuộc Spring
    // (kiến trúc hexagonal — chỉ dùng port); đã thử và build fail. Transaction do ADAPTER mở.
    public String saveUserAccess(Principal principal, Map<String, Object> payload) {
        // ⭐ PA-1 (USER 08/10/2026 — `DEC-20261008-001`) — ⛔ THAY `requireRole(…, List.of("admin"))`.
        //   📍 USER nguyên văn: «role === admin thì có nghĩa là user đó có toàn quyền và override toàn bộ
        //      phân quyền, là user có khả năng vượt qua mọi quyền mà không cần cấu hình, user có
        //      role === admin là quản trị hệ thống chỉ được sử dụng trong trường hợp đặc biệt ngoài ra khi
        //      không có việc gì quan trọng thì quản trị hệ thống sẽ sử dụng tài khoản ITM hoặc tài khoản
        //      tương tự được cấp full quyền.»
        //   🔎 NGUYÊN NHÂN GỐC (⭐ ĐO bằng `tools/probe-permission-save-api.mjs`, ⛔ không suy đoán):
        //      UI — `AdminUserModalTabs.hasAdminTab` (`:22`, `canView === 1`) và
        //      `app/page.tsx:3433` `canManageUserPermissions` — cho người có `admin_tab_06` **MỞ modal và
        //      tick được**, nhưng dòng này chỉ nhận `role === "admin"` ⇒ ⭐ **HTTP 403**
        //      «Thao tác chưa được khai báo quyền trong hệ thống» ⇒ «mở được, tick được, bấm Lưu
        //      ⛔ không lưu được gì» — ĐÚNG triệu chứng user báo.
        //   ✅ SỬA THEO ĐÚNG KHUÔN ĐÃ CÓ cho `update_user` (MỐC 103 — `requireAccountUpdateRight` ở trên):
        //      admin đi qua nhánh `isAdmin`; người khác phải có quyền module CẤU HÌNH của thao tác
        //      (`save_user_access` ⇒ `admin_tab_06` + `canView`, khai ở `ActionRbacRegistry`).
        //   ⚠️ GIỮ NGUYÊN mọi chốt an toàn phía sau (MỐC 111 chặn payload rỗng · MỐC 112 nguyên tử).
        if (!rbac.isAdmin(principalAsCurrent(principal)))
            rbac.requireActionModule(principalAsCurrent(principal), "save_user_access");
        String targetUserId = trim(payload.get("userId"));
        Map<String, Object> target = store.findUser(targetUserId).orElse(null);
        if (target == null) throw new AuthUseCase.ApiError("Không tìm thấy tài khoản.", 400);
        // P5.3 — BẮT BUỘC kiểm tra ràng buộc TRƯỚC khi xoá quyền cũ.
        // Nếu đặt sau clearUserScopes(), một yêu cầu bị TỪ CHỐI vẫn xoá sạch phạm vi
        // dự án / kho / quyền hiện có của người dùng ⇒ MẤT DỮ LIỆU.
        // ⛔⛔ VÁ 06/10/2026 (GO-LIVE · BUG-20261006-003 — MỨC CAO) — **BỎ CHỐT `P5.3`**.
        //   📍 YÊU CẦU USER (nguyên văn): «Đang gặp lỗi trong phần phân quyền người dùng, modal
        //      không thể cấp thêm quyền cho user nếu như số lượng quyền đó lớn hơn số lượng quyền
        //      đã cấp cho phòng ban. Tôi muốn sửa lại có thể thêm quyền cho người dùng kể cả
        //      phòng ban của user đó không có quyền như vậy.» ✓
        //   🔎 NGUYÊN NHÂN GỐC (⭐ đo từ mã, ⛔ không suy đoán): lời gọi
        //      `assertDepartmentAllowsPermissions(targetUserId, target, payload)` — ⭐ chốt **P5.3**
        //      (⭐ chú thích gốc ở dòng ~521: «chặn cấp cho người dùng quyền mà PHÒNG BAN không có»)
        //      ⇒ ⭐ ném `ApiError` «Phòng ban “…” chưa được cấp quyền cho chức năng “…”» (dòng ~553)
        //      ⇒ ⭐ **chặn ĐÚNG thao tác mà user muốn làm** ✓
        //   ✅ SỬA: ⛔ **bỏ lời gọi** ⇒ ⭐ cấp được quyền cho user **kể cả phòng ban ⛔ không có** ✓
        //   ⚠️ GIỮ LẠI hàm `assertDepartmentAllowsPermissions` (⭐ thành không dùng) — ⭐ ⛔ không xoá
        //      để còn tham chiếu và ⛔ không phình diff (§12 `SMALL SAFE FIX`) ✓
        //   ⚠️ LƯU Ý VỀ AN TOÀN DỮ LIỆU: chú thích cũ (dòng ~263-265) nói chốt này phải chạy
        //      TRƯỚC `clearUserScopes()` để «một yêu cầu bị TỪ CHỐI vẫn xoá sạch phạm vi» ⚠️
        //      — ⭐ nay ⛔ KHÔNG còn yêu cầu nào bị từ chối ở bước này ⇒ ⭐ lo ngại đó **hết hiệu lực** ✓
        //      ⚠️ NHƯNG chốt **MỐC 111** ngay dưới (dòng ~274) **VẪN GIỮ** — ⭐ nó chặn payload rỗng
        //      để ⛔ không mất toàn bộ quyền ⇒ ⭐ vẫn còn một lớp bảo vệ ✓
        // assertDepartmentAllowsPermissions(targetUserId, target, payload);  // ⛔ BỎ 06/10/2026 — BUG-20261006-003
        // MỐC 111 — CHỐNG MẤT SẠCH QUYỀN (bổ sung cho P5.3 ở trên).
        // `clearUserScopes()` XOÁ CỨNG cả 3 bảng (project / warehouse / module permissions).
        // Nếu `modulePermissions` rỗng hoặc toàn rỗng-trắng thì vòng ghi bên dưới không có
        // gì để chèn ⇒ tài khoản mất TOÀN BỘ quyền mà API vẫn trả 200 «Đã lưu quyền hiệu lực».
        // Đã tái hiện thật: 60 dòng quyền biến mất sau một lần bấm lưu.
        // UI luôn gửi ĐẦY ĐỦ danh mục module (kể cả module không có quyền nào) ⇒ mảng rỗng
        // là payload hỏng, KHÔNG phải ý định thu hồi toàn bộ quyền ⇒ chặn trước khi xoá.
        if (listOf(payload.get("modulePermissions")).isEmpty())
            throw new AuthUseCase.ApiError("Dữ liệu phân quyền rỗng — hệ thống không lưu để tránh mất toàn bộ quyền hiện có của tài khoản. Vui lòng tải lại trang rồi thao tác lại.", 400);
        // ⭐ S-1 (USER CHỐT 08/10/2026 — `DEC-20261008-002`) — ⛔ **CHẶN TỰ NÂNG QUYỀN**.
        //   📍 USER nguyên văn: «chặn tự nâng quyền cho mình, ngoại lệ chỉ có tài khoản ADMIN thích làm gì thì làm.»
        //   🔎 VÌ SAO CẦN (⭐ ĐO ở `TEST-20261008-003`, ⛔ không suy đoán): sau PA-1, người có `admin_tab_06`
        //      gọi được `save_user_access` ⇒ ⭐ có thể **tự cấp module `admin`** cho CHÍNH MÌNH ⇒ gọi
        //      `factory_reset_execute` = **XOÁ SẠCH DỮ LIỆU** (`ActionRbacRegistry:154` map action đó vào
        //      module `admin`; controller ⛔ không có `requireRequireAdmin`) ⇒ `BUG-20261008-002` (CRITICAL) ✓
        //   ✅ LUẬT: người gọi ⛔ KHÔNG phải `role = admin` thì ⛔ **không được CẤP THÊM** quyền cho CHÍNH MÌNH.
        //      ⭐ VẪN CHO PHÉP: sửa quyền người KHÁC · **thu hồi** quyền của mình · **giữ nguyên** quyền đang có
        //      ⇒ ⭐ chỉ chặn đúng chiều ĐI LÊN, ⛔ không chặn chiều đi xuống ✓
        //   ⚠️ ĐẶT **TRƯỚC** `clearUserScopes()` ngay dưới — bài học MỐC 111: nếu kiểm SAU khi xoá thì một
        //      yêu cầu bị TỪ CHỐI vẫn **xoá sạch** quyền hiện có của tài khoản (**mất dữ liệu**) ✓
        final String[][] selfElevationCaps = {
                {"canView", "canView"}, {"canUse", "canUse"}, {"canCreate", "canCreate"},
                {"canEdit", "canEdit"}, {"canApprove", "canApprove"}, {"canExport", "canExport"}};
        if (!rbac.isAdmin(principalAsCurrent(principal)) && principal.userId().equals(targetUserId)) {
            for (Object o : listOf(payload.get("modulePermissions"))) {
                Map<?, ?> row = asMap(o);
                String moduleKey = trim(row.get("moduleKey"));
                if (moduleKey.isEmpty()) continue;
                for (String[] cap : selfElevationCaps) {
                    if (intOf(row.get(cap[0])) != 1) continue;
                    if (!rbac.canUseModule(targetUserId, moduleKey, cap[1]))
                        throw new AuthUseCase.ApiError(
                                "Không được tự cấp thêm quyền cho chính mình. Hãy nhờ quản trị viên cấp, hoặc cấp cho tài khoản khác.", 403);
                }
            }
        }
        Instant now = Instant.now();
        // MỐC 112 — nguyên tử: xoá và chèn lại phải cùng thành công hoặc cùng không đổi gì.
        store.runAtomically(() -> {
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
        for (Object o : listOf(payload.get("modulePermissions"))) {
            Map<?, ?> row = asMap(o);
            String moduleKey = trim(row.get("moduleKey"));
            // USER 28/09/2026 — bỏ chặn `admin` (xem giải thích đầy đủ ở dòng ~232).
            // ⚠️ AN TOÀN: bước 12 «Cấu hình hệ thống» (có `FactoryResetAdmin` XÓA DỮ LIỆU), 13 «Thông báo»,
            //    14 «Báo lỗi» vẫn CHỈ hiện với `role === "admin"` — `ADMIN_ROLE_ONLY_STEPS`.
            if (moduleKey.isEmpty()) continue;
            // MỐC 112 — `source` trước đây được TÍNH RA rồi BỎ KHÔNG (biến chết), còn adapter
            // hard-code `'department_default'` ⇒ mọi dòng đều mang nhãn mặc định phòng ⇒
            // `deleteModuleOverride` lọc `permission_source='manual_override'` nên KHÔNG BAO GIỜ
            // xoá được ngoại lệ thật ⇒ nút «Xóa ngoại lệ cá nhân» là nút chết.
            // ⛔⛔ VÁ 05/10/2026 (GO-LIVE) — MỐC 112 mới chỉ NỐI tham số xuống adapter, GIÁ TRỊ vẫn sai:
            //    `row.get("isOverride")` là trường mà UI **KHÔNG BAO GIỜ gửi** (`Boolean.TRUE.equals(null)`
            //    luôn `false`) ⇒ **100% dòng thành `department_default`**. Đo trên MySQL thật:
            //    `user_module_permissions` = **2198 dòng, 2198 `department_default`, 0 `manual_override`**,
            //    và `permission_expires_at` NULL toàn bộ ⇒ nút «Xóa ngoại lệ cá nhân» VẪN là nút chết.
            // ⭐ Bản JS cũ (`scripts/system-route.mjs:3084`) tính ĐÚNG bằng cách **SO với mặc định phòng**:
            //      const defaults = defaultDepartmentPermission(target, moduleKey);
            //      const differs  = keys.some((key) => submitted[key] !== defaults[key]);
            //      const source   = differs ? "manual_override" : "department_default";
            //    Khi chuyển sang kiến trúc hexagonal, phép SO đó bị đánh rơi. Khôi phục đúng ngữ nghĩa.
            Caps submittedCaps = new Caps(intOf(row.get("canView")), intOf(row.get("canUse")),
                    intOf(row.get("canCreate")), intOf(row.get("canEdit")),
                    intOf(row.get("canApprove")), intOf(row.get("canExport")));
            Caps defaultCaps = effectiveDepartmentDefault(target, moduleKey);
            boolean differsFromDefault = submittedCaps.canView != defaultCaps.canView
                    || submittedCaps.canUse != defaultCaps.canUse
                    || submittedCaps.canCreate != defaultCaps.canCreate
                    || submittedCaps.canEdit != defaultCaps.canEdit
                    || submittedCaps.canApprove != defaultCaps.canApprove
                    || submittedCaps.canExport != defaultCaps.canExport;
            String source = differsFromDefault ? "manual_override" : "department_default";
            store.insertDepartmentDefaultPermission(idGenerator.next("UMP"), targetUserId, moduleKey,
                    intOf(row.get("canView")), intOf(row.get("canUse")), intOf(row.get("canCreate")),
                    intOf(row.get("canEdit")), intOf(row.get("canApprove")), intOf(row.get("canExport")),
                    source, instantOrNull(row.get("permissionExpiresAt")), now);
        }
        });
        return "Đã lưu quyền hiệu lực: mặc định phòng + ngoại lệ cá nhân.";
    }

    public String deleteUserModuleOverride(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
        String targetUserId = trim(payload.get("userId"));
        String moduleKey = trim(payload.get("moduleKey"));
        if (targetUserId.isEmpty() || moduleKey.isEmpty())
            throw new AuthUseCase.ApiError("Ngoại lệ cá nhân không hợp lệ.", 400);
        // ⛔⛔ VÁ 05/10/2026 (GO-LIVE · BUG-20261011 — LOW). TRƯỚC BẢN VÁ: gọi thẳng rồi trả về
        //   «Đã xóa ngoại lệ cá nhân…» ⇒ với `userId`/`moduleKey` BỊA thì vẫn **HTTP 200** dù ⛔
        //   không có gì để xoá — trong khi **33/34** action `delete_*` khác đều trả 400 «Không tìm thấy …».
        //   ⭐ GHI CHÚ NGỮ CẢNH: hiện `user_module_permissions` là **100% `department_default`**
        //   (2198 dòng, **0** dòng `manual_override`) — hệ quả hạ nguồn của BUG-20261005-003
        //   (nút «Xóa ngoại lệ cá nhân» từng là nút chết, **đã vá nhưng chưa triển khai**).
        //   ⛔ Khác BUG-20261010 ở chỗ **KHÔNG có tác dụng phụ toàn hệ thống** ⇒ mức chỉ **LOW**.
        if (store.deleteModuleOverride(targetUserId, moduleKey) == 0)
            throw new AuthUseCase.ApiError(
                    "Không tìm thấy ngoại lệ cá nhân cho chức năng này.", 400);
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
                // MỐC 112 — đây ĐÚNG là mặc định phòng ban ⇒ nguồn `'department_default'`, không hạn dùng.
                store.insertDepartmentDefaultPermission(idGenerator.next("UMP"), userId, moduleKey,
                        caps.canView, caps.canUse, caps.canCreate, caps.canEdit, caps.canApprove, caps.canExport,
                        "department_default", null, now);
        }
    }

    private Caps capsOfDepartment(Map<String, Object> row) {
        if (intOf(row.get("active")) != 1) return new Caps(0, 0, 0, 0, 0, 0);
        return new Caps(intOf(row.get("can_view")), intOf(row.get("can_use")), intOf(row.get("can_create")),
                intOf(row.get("can_edit")), intOf(row.get("can_approve")), intOf(row.get("can_export")));
    }

    /**
     * GO-LIVE 05/10/2026 — MẶC ĐỊNH HIỆU LỰC của phòng cho một chức năng, dùng để phân biệt
     * «quyền theo phòng» với «ngoại lệ cá nhân» khi lưu phân quyền.
     *
     * <p>Quy tắc lấy **đúng như** {@code replaceDepartmentDefaults}: nếu phòng đã được cấu hình
     * (có dòng trong {@code department_module_permissions}) thì lấy dòng đó; nếu chưa thì rơi về
     * quy tắc mặc định cũ. ⛔ Hai nơi PHẢI dùng cùng một quy tắc, nếu không thì một dòng vừa được
     * ghi là «mặc định phòng» lại bị chính hệ thống coi là «ngoại lệ» ở lần lưu sau.
     */
    private Caps effectiveDepartmentDefault(Map<String, Object> user, String moduleKey) {
        String orgUnitId = user == null ? "" : svAny(user, "organizationUnitId", "organizationunitid");
        if (!orgUnitId.isEmpty()) {
            Optional<Map<String, Object>> dep = store.findDepartmentPermission(orgUnitId, moduleKey);
            if (dep.isPresent()) return capsOfDepartment(dep.get());
        }
        return user == null ? new Caps(0, 0, 0, 0, 0, 0) : defaultDepartmentPermission(user, moduleKey);
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
            if (moduleKey.isEmpty()) continue;
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
        // USER 28/09/2026 — bỏ chặn `admin` (xem giải thích đầy đủ ở khai báo `moduleKey` phía trên).
        // ⚠️ TRƯỚC ĐÂY chỗ này ném ApiError "Chức năng quản trị chỉ dành cho tài khoản admin" —
        //    nhưng action vẫn trả `ok:true` ⇒ SAI LỆCH im lặng, rất dễ gây hiểu nhầm khi test.
        // ⚠️ AN TOÀN: bước 12 «Cấu hình hệ thống» (FactoryResetAdmin XÓA DỮ LIỆU), 13 «Thông báo»,
        //    14 «Báo lỗi» vẫn CHỈ hiện với `role === "admin"` — `ADMIN_ROLE_ONLY_STEPS`.
        // ⛔⛔ VÁ 06/10/2026 (GO-LIVE · BUG-20261007-001 — **ĐIỂM NÓNG HIỆU NĂNG** · §41 «nhỏ · an toàn · hoàn nguyên được»)
        //   📍 TRIỆU CHỨNG (user báo): «bấm chọn tất cả ⇒ bấm lưu ⇒ nút lưu hiện đang lưu nhưng
        //      **đợi rất lâu không thấy phản hồi**» ✓
        //   🔎 NGUYÊN NHÂN GỐC (⭐ ĐO THẬT — 1 lời gọi = **11,50 GIÂY**):
        //      ⚠️ `syncDepartmentUsers(now)` chạy **SAU MỖI lần lưu 1 module** ⚠️
        //      ⇒ ⭐ nó duyệt **MỌI tài khoản đang hoạt động** (**27**) và gọi
        //        `replaceDepartmentDefaults` cho **từng người** — mà hàm đó lại duyệt
        //        **MỌI module** (**61**) ⇒ ⭐ **~1.647 lượt truy vấn+ghi cho MỘT lần lưu** ✓
        //      ⇒ ⚠️ «Chọn tất cả» = **61 module** ⇒ FE gọi **TUẦN TỰ 61 lần**
        //        ⇒ ⭐ 61 × 1.647 ≈ **~100.000 lượt** ⇒ ⭐ **~701 giây ≈ 11,7 PHÚT** ✓
        //      ⚠️ VÀ ⛔ **KHÔNG có tiến độ** ⇒ ⭐ nút chỉ hiện «Đang lưu…» ⇒ **trông như TREO** ✓
        //   📍 BẰNG CHỨNG CSDL (phòng `ORG-BGD`): ⭐ `updated_at` chạy **13:33:19 → 13:40:09**
        //      (**~7 phút**) rồi **DỪNG GIỮA CHỪNG** ⇒ ⭐ **55/61 module ĐÃ lưu** ·
        //      ⚠️ **6 module ⛔ CHƯA** ⇒ ⭐ **user tưởng treo nên RỜI TRANG ⇒ dữ liệu lưu DỞ DANG** ✓
        //   ✅ SỬA: ⭐ **cho phép FE BỎ QUA đồng bộ ở các lời gọi TRUNG GIAN** —
        //      ⭐ chỉ đồng bộ ở **lời gọi CUỐI** (⭐ FE gửi `syncNow:false` cho mọi module trừ module cuối) ✓
        //   ⚠️⚠️ **MẶC ĐỊNH KHÔNG ĐỔI**: ⭐ thiếu `syncNow` hoặc `syncNow=true` ⇒ ⭐ **vẫn đồng bộ như cũ** ✓
        //      ⇒ ⭐ **⛔ KHÔNG phá bất kỳ lời gọi nào hiện có** (⭐ `AdminGovernanceIntegrationTest`
        //        gọi `save_department_permission` **KHÔNG kèm `syncNow`** ⇒ vẫn đồng bộ ✓)
        //   ✅ KẾT QUẢ: ⭐ **61 lần đồng bộ → 1 lần** ⇒ ⭐ **11,5 giây → ~1 giây** ✓
        //   ⚠️ RỦI RO ĐÃ BIẾT: ⭐ nếu **lời gọi CUỐI bị lỗi** thì **⛔ không có lần đồng bộ nào** ⚠️
        //      ⇒ ⭐ người dùng cần **bấm Lưu lại** (⭐ hàm đồng bộ là **idempotent** — chạy lại vô hại) ✓
        boolean dongBoNgay = !"false".equalsIgnoreCase(trim(payload.get("syncNow")));
        Instant now = Instant.now();
        store.upsertDepartmentPermission(idGenerator.next("DMP"), organizationUnitId, moduleKey,
                intOf(payload.get("canView")), intOf(payload.get("canUse")), intOf(payload.get("canCreate")),
                intOf(payload.get("canEdit")), intOf(payload.get("canApprove")), intOf(payload.get("canExport")),
                principal.userId(), now);
        int synced = dongBoNgay ? syncDepartmentUsers(now) : 0;
        return "Đã lưu quyền phòng ban cho chức năng “" + moduleKey + "”"
                + (dongBoNgay ? "; đồng bộ lại " + synced + " tài khoản."
                              : " (⭐ chờ đồng bộ ở bước cuối).");
    }

    public String deleteDepartmentPermission(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
        String organizationUnitId = trim(payload.get("organizationUnitId"));
        String moduleKey = trim(payload.get("moduleKey"));
        if (organizationUnitId.isEmpty() || moduleKey.isEmpty())
            throw new AuthUseCase.ApiError("Cần chọn phòng ban và chức năng.", 400);
        // ⛔⛔ VÁ 05/10/2026 (GO-LIVE · BUG-20261010 — HIGH, liên quan QUYỀN).
        //   TRƯỚC BẢN VÁ: hàm này **KHÔNG kiểm gì** rồi gọi `store.deleteDepartmentPermission(...)`
        //   (xoá 0 dòng nếu khoá sai) và **LUÔN** chạy `syncDepartmentUsers(...)` — mà hàm đó duyệt
        //   **MỌI tài khoản đang hoạt động** (trừ admin; đo được **27 tài khoản**) và gọi
        //   `replaceDepartmentDefaults` cho **từng người** ⇒ **GHI ĐÈ quyền mặc định phòng ban của
        //   toàn bộ tài khoản** chỉ vì một cú bấm, rồi vẫn trả thông báo **THÀNH CÔNG**.
        //   ĐO ĐƯỢC: gọi với `organizationUnitId` bịa ⇒ **HTTP 200** + «Đã thu hồi quyền của phòng ban;
        //   đồng bộ lại 27 tài khoản…» — trong khi **7** action `delete_*` khác đều trả «Không tìm thấy …».
        //   ⛔ Hệ quả: bấm nhầm/bấm đúp cũng kích hoạt đồng bộ quyền **TOÀN HỆ THỐNG**, và người dùng
        //   tưởng đã thu hồi quyền trong khi ⛔ không có gì để thu hồi.
        //   ✅ Nay: ⛔ không có dòng quyền ⇒ **400** (đúng khuôn 7 action kia) và ⛔ **KHÔNG** đồng bộ gì.
        if (store.findDepartmentPermission(organizationUnitId, moduleKey).isEmpty())
            throw new AuthUseCase.ApiError(
                    "Không tìm thấy quyền của phòng ban cho chức năng này.", 400);
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

    // MỐC 112 — đọc ô «Hết hạn» của ma trận quyền. Trước đây UI có ô nhập nhưng backend
    // hard-code NULL ⇒ hạn dùng không bao giờ được ghi. Nhận cả `2026-12-31` (ngày do `<input
    // type="date">` gửi) và ISO đầy đủ. Ô rỗng ⇒ null (không hạn) — KHÔNG phải lỗi.
    // ⚠️ Ngày phải neo theo MÚI GIỜ MÁY CHỦ, không phải UTC: nếu neo UTC rồi MySQL quy đổi
    //    theo múi giờ kết nối (Asia/Ho_Chi_Minh +7), người dùng chọn 30/06 sẽ lưu thành
    //    30/06 07:00 ⇒ quyền chỉ hết hạn MUỘN một ngày so với ý.
    private static Instant instantOrNull(Object o) {
        String s = trim(o);
        if (s.isEmpty()) return null;
        try { return java.time.LocalDate.parse(s).atStartOfDay(java.time.ZoneId.systemDefault()).toInstant(); }
        catch (RuntimeException ignored) { /* không phải ngày thuần → thử ISO-8601 */ }
        try { return Instant.parse(s); }
        catch (RuntimeException ignored) { /* thử định dạng khác */ }
        try { return java.time.LocalDateTime.parse(s).atZone(java.time.ZoneId.systemDefault()).toInstant(); }
        catch (RuntimeException e) {
            throw new AuthUseCase.ApiError("Hạn dùng quyền không hợp lệ: \"" + s + "\". Định dạng đúng là YYYY-MM-DD.", 400);
        }
    }

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