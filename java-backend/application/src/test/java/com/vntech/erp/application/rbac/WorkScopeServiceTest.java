package com.vntech.erp.application.rbac;

import com.vntech.erp.application.port.out.OpsTaskStore;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * MT2-P4-01 / P5-03 / P5-04 (§3.2) — <b>PHẠM VI XEM &amp; GIAO CÔNG VIỆC THEO CẤP BẬC</b>.
 *
 * <p>Nguyên văn `MASTER_TASK_2.md` §3.2 (dòng 41-42):
 * <pre>
 * | Trưởng phòng trở lên | xem công việc của nhân viên <b>thuộc phòng ban mình</b> … |
 * | Phó giám đốc trở lên | xem công việc <b>toàn bộ phòng ban</b> · <b>toàn bộ nhân viên công ty</b> ·
 *                        giao việc <b>toàn công ty</b> theo quyền |
 * </pre>
 *
 * <p><b>Ngưỡng ĐO TỪ CSDL</b> (`system_level_catalog`): `truong_phong`=30 · `pho_giam_doc`=<b>35</b>
 * (thêm ở `V30__mt2_p4_01_add_pho_giam_doc_level.sql`) · `giam_doc`=40 · `tong_giam_doc`=50.
 *
 * <p><b>Vì sao có CA ÂM:</b> thiếu cấp bậc (null) / dưới trưởng phòng / trưởng phòng mà KHÔNG rõ phòng ban
 * ⇒ ⛔ <b>KHÔNG</b> được mở quyền (phải rơi về {@code SELF}). Đây là chốt an toàn: ngưỡng người dùng
 * chọn là (A) «thêm cấp `pho_giam_doc`», ⛔ KHÔNG phải «nới rộng cho mọi tài khoản thiếu dữ liệu».
 */
class WorkScopeServiceTest {

    /** Dựng store giả với cấp bậc + phòng ban cho trước (⛔ không cần DB thật). */
    private static WorkScopeService service(Integer levelRank, String department) {
        OpsTaskStore store = mock(OpsTaskStore.class);
        when(store.userLevelRank("U1")).thenReturn(levelRank);
        when(store.userDepartment("U1")).thenReturn(department);
        return new WorkScopeService(store);
    }

    // ───────────────────────── CA DƯƠNG ─────────────────────────

    @Test
    void phoGiamDoc_rank35_xemToanCongTy() {
        WorkScopeService.Scope scope = service(35, "KH").scopeOf("U1", "engineer");
        assertEquals(WorkScopeService.Kind.COMPANY, scope.kind(), "phó GĐ (35) ⇒ phạm vi TOÀN CÔNG TY (§3.2:42)");
        assertTrue(scope.toMap().get("canViewCompanyWork").equals(Boolean.TRUE));
        assertTrue(scope.toMap().get("canAssignCompanyWide").equals(Boolean.TRUE));
        // ⚠️ HỒI QUY ĐÃ SỬA: phó GĐ xem được MỌI phòng ⇒ cờ `canViewDepartmentWork` phải TRUE
        // (trước đây ghi sai thành false vì so sánh `kind == DEPARTMENT`).
        assertTrue(scope.toMap().get("canViewDepartmentWork").equals(Boolean.TRUE),
                "phó GĐ xem được việc phòng ban ⇒ cờ phải TRUE");
        assertTrue(service(35, "KH").canViewDepartment(scope, "DA"), "xem được cả phòng KHÁC");
        assertTrue(service(35, "KH").canAssignDepartment(scope, "DA"), "giao việc toàn công ty");
    }

    @Test
    void giamDoc_rank40_va_tongGiamDoc_rank50_cungToanCongTy() {
        assertEquals(WorkScopeService.Kind.COMPANY, service(40, "KH").scopeOf("U1", "director").kind());
        assertEquals(WorkScopeService.Kind.COMPANY, service(50, "KH").scopeOf("U1", "admin").kind());
    }

    @Test
    void admin_khongCoCapBac_vanToanCongTy() {
        // admin là ngoại lệ DUY NHẤT: hệ thống đã quy ước admin toàn quyền.
        WorkScopeService.Scope scope = service(null, "").scopeOf("U1", "admin");
        assertEquals(WorkScopeService.Kind.COMPANY, scope.kind());
    }

    @Test
    void truongPhong_rank30_xemPhongMinh() {
        WorkScopeService.Scope scope = service(30, "KH").scopeOf("U1", "kh_truong");
        assertEquals(WorkScopeService.Kind.DEPARTMENT, scope.kind(), "trưởng phòng (30) ⇒ phạm vi PHÒNG BAN MÌNH (§3.2:41)");
        assertTrue(service(30, "KH").canViewDepartment(scope, "KH"), "xem được phòng mình");
        assertTrue(service(30, "KH").canViewDepartment(scope, "kh"), "so khớp KHÔNG phân biệt hoa/thường");
        assertFalse(service(30, "KH").canViewDepartment(scope, "DA"), "⛔ KHÔNG xem được phòng khác");
        assertFalse(service(30, "KH").canAssignDepartment(scope, "DA"), "⛔ KHÔNG giao việc sang phòng khác");
        assertFalse(scope.toMap().get("canViewCompanyWork").equals(Boolean.TRUE), "⛔ không phải toàn công ty");
    }

    // ───────────────────────── CA ÂM (chốt an toàn) ─────────────────────────

    @Test
    void nhanVien_rank10_chiViecCuaMinh() {
        WorkScopeService.Scope scope = service(10, "KH").scopeOf("U1", "engineer");
        assertEquals(WorkScopeService.Kind.SELF, scope.kind(), "nhân viên ⇒ chỉ việc của chính mình");
        assertFalse(service(10, "KH").canViewDepartment(scope, "KH"), "⛔ KHÔNG xem việc phòng");
        assertFalse(service(10, "KH").canAssignDepartment(scope, "KH"));
    }

    @Test
    void truongNhom_rank20_chiViecCuaMinh() {
        assertEquals(WorkScopeService.Kind.SELF, service(20, "KH").scopeOf("U1", "cht").kind(),
                "trưởng nhóm (20) chưa đủ ngưỡng trưởng phòng (30)");
    }

    @Test
    void thieuCapBac_null_KHONGduocMoQuyen() {
        // ⚠️ ĐO ĐƯỢC: 8 tài khoản trống `system_level_code` (toàn tài khoản kiểm thử) ⇒ tuyệt đối ⛔ không nới quyền.
        WorkScopeService.Scope scope = service(null, "KH").scopeOf("U1", "engineer");
        assertEquals(WorkScopeService.Kind.SELF, scope.kind(), "⛔ thiếu cấp bậc ⇒ KHÔNG mặc định mở quyền");
        assertFalse(service(null, "KH").canViewDepartment(scope, "KH"));
    }

    @Test
    void truongPhong_nhungKhongRoPhongBan_roiVeSELF() {
        // Không suy ra được phòng ⇒ ⛔ không thể xác định phạm vi phòng ⇒ về SELF (an toàn).
        assertEquals(WorkScopeService.Kind.SELF, service(30, "").scopeOf("U1", "kh_truong").kind());
        assertEquals(WorkScopeService.Kind.SELF, service(30, null).scopeOf("U1", "kh_truong").kind());
        assertEquals(WorkScopeService.Kind.SELF, service(30, "   ").scopeOf("U1", "kh_truong").kind());
    }

    @Test
    void userIdRong_traSELF_khongNemLoi() {
        WorkScopeService svc = service(50, "KH");
        assertEquals(WorkScopeService.Kind.SELF, svc.scopeOf("", "admin").kind());
        assertEquals(WorkScopeService.Kind.SELF, svc.scopeOf(null, "admin").kind());
        assertFalse(svc.canViewDepartment(null, "KH"), "scope null ⇒ ⛔ không mở quyền");
    }

    @Test
    void nguongDoTuCSDL_khopV30() {
        assertEquals(30, WorkScopeService.TRUONG_PHONG_MIN_RANK, "truong_phong = 30 (ĐO từ CSDL)");
        assertEquals(35, WorkScopeService.PHO_GIAM_DOC_MIN_RANK, "pho_giam_doc = 35 (thêm ở V30, nằm GIỮA 30 và 40)");
        assertTrue(WorkScopeService.PHO_GIAM_DOC_MIN_RANK > WorkScopeService.TRUONG_PHONG_MIN_RANK,
                "phó GĐ phải CAO HƠN trưởng phòng");
        assertTrue(WorkScopeService.PHO_GIAM_DOC_MIN_RANK < 40, "phó GĐ phải THẤP HƠN giám đốc (40)");
    }
}
