package com.vntech.erp.application.rbac;

import com.vntech.erp.application.port.out.ModulePermissionStore;
import com.vntech.erp.application.service.AuthUseCase;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * TASK-135 — LỖI RBAC CỦA 3 ACTION PO ({@code approve_po} · {@code reject_po} · {@code update_po_price}).
 *
 * <p><b>Lỗi đã đo (LIVE, jar 21/09 11:10)</b> — probe {@code tools/probe-wf-muahang-standard.mjs --apply}
 * bước {@code B6b}: {@code nvkhdemo} gọi {@code approve_po} ⇒ HTTP 403 «Thao tác chưa được khai báo
 * quyền trong hệ thống…» trong khi {@code B6a create_po} của CÙNG user ⇒ 200. Nguyên nhân: 3 action PO
 * được khai MODULE RỖNG ({@code List.of()}) ⇒ {@code RbacService} rơi vào nhánh "mặc định từ chối"
 * (PHASE 0B) nên CHẶN MỌI user không phải admin/C-level, bất kể họ có quyền {@code purchasing} hay không.
 *
 * <p>Test này chốt 2 tầng:
 * <ol>
 *   <li><b>Tầng khai báo</b> — module + capability của 3 action phải theo đúng tiền lệ PO đã có
 *       ({@code create_po}=canCreate · {@code close_po_line}=canApprove, cùng module {@code purchasing}).</li>
 *   <li><b>Tầng cưỡng chế</b> — {@code RbacService.requireActionModule}: user CÓ
 *       {@code purchasing.canApprove} ⇒ ĐI QUA (hết 403 oan); user KHÔNG có quyền ⇒ vẫn 403
 *       (đối chứng âm — cổng quyền KHÔNG bị nới lỏng).</li>
 * </ol>
 */
class ActionRbacRegistryPoTest {

    private static AuthUseCase.CurrentUser poUser(String id) {
        // role `procurement` = base_role của khối mua hàng (dùng cho cổng VAI TRÒ của use case).
        return new AuthUseCase.CurrentUser(id, "Nhân viên mua hàng", "kh.demo", "kh.demo@vntech.vn",
                "procurement", "procurement", "Nhân viên mua hàng", "project",
                "Phòng Mua hàng", null, false);
    }

    /** Fake store: chỉ trả true cho đúng cặp (module, capability) được cấp. */
    private static final class FakeStore implements ModulePermissionStore {
        private final Set<String> granted = new HashSet<>();
        private final StringBuilder asked = new StringBuilder();

        void grant(String moduleKey, String capability) {
            granted.add(moduleKey + "." + capability);
        }

        @Override public boolean canUseModule(String userId, String moduleKey, String capability) {
            asked.append(moduleKey).append('.').append(capability).append(';');
            return granted.contains(moduleKey + "." + capability);
        }
    }

    // ───────────────────────── TẦNG 1 — KHAI BÁO ─────────────────────────

    @Test
    void approvePo_declaresModulePurchasing_notEmpty() {
        assertEquals(List.of("purchasing"), ActionRbacRegistry.modulesFor("approve_po"),
                "approve_po phải khai module `purchasing` (tiền lệ create_po:48 · close_po_line:48) "
                        + "— danh sách RỖNG nghĩa là «chưa khai báo quyền» ⇒ 403 oan cho MỌI user");
    }

    @Test
    void rejectPo_declaresModulePurchasing_notEmpty() {
        assertEquals(List.of("purchasing"), ActionRbacRegistry.modulesFor("reject_po"),
                "reject_po phải khai module `purchasing` (từ chối PO = hành vi trên cùng chứng từ PO)");
    }

    @Test
    void updatePoPrice_declaresModulePurchasing_notEmpty() {
        assertEquals(List.of("purchasing"), ActionRbacRegistry.modulesFor("update_po_price"),
                "update_po_price phải khai module `purchasing` (sửa đơn giá của chính PO)");
    }

    @Test
    void capabilities_followExistingPoPrecedents() {
        assertEquals("canApprove", ActionRbacRegistry.capabilityFor("approve_po"),
                "duyệt PO = hành vi phê duyệt ⇒ canApprove (đối chiếu close_po_line = canApprove)");
        assertEquals("canApprove", ActionRbacRegistry.capabilityFor("reject_po"),
                "từ chối PO = hành vi phê duyệt (âm) ⇒ canApprove");
        assertEquals("canEdit", ActionRbacRegistry.capabilityFor("update_po_price"),
                "sửa ĐƠN GIÁ của bản ghi đã có ⇒ canEdit — đối chiếu JS `update_boq_contract_prices`"
                        + " (ACTION_CAPABILITY = canEdit, handler kiểm canUseModule(user,'boq','canEdit'))"
                        + " và Java `update_boq_contract_prices` = canEdit");
        // Tiền lệ PO ĐÚNG chuẩn — chốt lại để test này đỏ khi ai đó sửa nhầm chúng.
        assertEquals(List.of("purchasing"), ActionRbacRegistry.modulesFor("create_po"));
        assertEquals("canCreate", ActionRbacRegistry.capabilityFor("create_po"));
        assertEquals(List.of("purchasing"), ActionRbacRegistry.modulesFor("close_po_line"));
        assertEquals("canApprove", ActionRbacRegistry.capabilityFor("close_po_line"));
    }

    // ───────────────────────── TẦNG 2 — CƯỠNG CHẾ ─────────────────────────

    @Test
    void userWithPurchasingCanApprove_canCallApprovePo_andCanCallRejectPo() {
        FakeStore store = new FakeStore();
        store.grant("purchasing", "canApprove");
        RbacService rbac = new RbacService(store);
        AuthUseCase.CurrentUser user = poUser("u_kh_135");

        // TRƯỚC khi sửa: 403 «Thao tác chưa được khai báo quyền trong hệ thống…» (module rỗng).
        assertDoesNotThrow(() -> rbac.requireActionModule(user, "approve_po"),
                "user có purchasing.canApprove KHÔNG được bị 403 vì «chưa khai báo quyền»");
        assertDoesNotThrow(() -> rbac.requireActionModule(user, "reject_po"),
                "user có purchasing.canApprove KHÔNG được bị 403 vì «chưa khai báo quyền»");
        assertTrue(store.asked.toString().contains("purchasing.canApprove"),
                "cổng quyền phải HỎI đúng cặp (purchasing, canApprove) — đã hỏi: " + store.asked);
    }

    @Test
    void userWithPurchasingCanEdit_canCallUpdatePoPrice() {
        FakeStore store = new FakeStore();
        store.grant("purchasing", "canEdit");
        RbacService rbac = new RbacService(store);

        assertDoesNotThrow(() -> rbac.requireActionModule(poUser("u_kh_135"), "update_po_price"),
                "user có purchasing.canEdit KHÔNG được bị 403 vì «chưa khai báo quyền»");
    }

    @Test
    void negativeControl_userWithoutPurchasingPermission_isStill403_withPermissionMessage() {
        FakeStore store = new FakeStore();   // KHÔNG cấp quyền nào
        RbacService rbac = new RbacService(store);

        AuthUseCase.ApiError approve = assertThrows(AuthUseCase.ApiError.class,
                () -> rbac.requireActionModule(poUser("u_none_135"), "approve_po"),
                "user KHÔNG có purchasing.canApprove phải bị 403");
        assertEquals(403, approve.status());
        assertEquals("Tài khoản chưa được quản trị viên cấp đúng quyền cho thao tác này.", approve.getMessage(),
                "sau khi khai module, 403 phải là 403 CẤP QUYỀN (không còn là «chưa khai báo quyền»)");

        AuthUseCase.ApiError reject = assertThrows(AuthUseCase.ApiError.class,
                () -> rbac.requireActionModule(poUser("u_none_135"), "reject_po"));
        assertEquals(403, reject.status());

        AuthUseCase.ApiError price = assertThrows(AuthUseCase.ApiError.class,
                () -> rbac.requireActionModule(poUser("u_none_135"), "update_po_price"));
        assertEquals(403, price.status());

        // Đối chứng âm TƯƠNG PHẢN: người chỉ có canUse (không canApprove/canEdit) vẫn bị chặn.
        store.grant("purchasing", "canUse");
        assertEquals(403, assertThrows(AuthUseCase.ApiError.class,
                () -> rbac.requireActionModule(poUser("u_use_135"), "approve_po")).status(),
                "chỉ có purchasing.canUse KHÔNG đủ để DUYỆT PO");
        assertEquals(403, assertThrows(AuthUseCase.ApiError.class,
                () -> rbac.requireActionModule(poUser("u_use_135"), "update_po_price")).status(),
                "chỉ có purchasing.canUse KHÔNG đủ để SỬA ĐƠN GIÁ PO");
    }
}
