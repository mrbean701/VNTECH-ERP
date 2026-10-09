package com.vntech.erp.application.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * ⭐⭐ V-1 — `BUG-20261008-014` (🔴 CRITICAL «mất dữ liệu») — nghiệm thu **ngữ nghĩa HỢP** của
 * {@link UserManagementUseCase#hopThemKhongXoa}.
 *
 * <h2>Vì sao cần bài này</h2>
 * `save_user_access` là **FULL-REPLACE**: `clearUserScopes()` xoá cả 3 bảng rồi chèn lại **theo payload**.
 * Người **⛔ không phải admin** chỉ nhận được **MỘT PHẦN** dữ liệu phạm vi:
 * <ul>
 *   <li>`data.userWarehouseScopes` với non-admin **chỉ có của chính họ** (`BootstrapDataAdapter` L959)</li>
 *   <li>`data.allModulePermissions` **rỗng** với non-admin (`if (admin)` L943)</li>
 *   <li>`data.userScopes` với non-admin **chỉ có của chính họ**</li>
 * </ul>
 * ⇒ payload gửi lên **THIẾU** ⇒ nếu vẫn FULL-REPLACE thì ⛔ **XOÁ OAN** phần họ ⛔ không nhìn thấy ⇒ 🔴 mất dữ liệu.
 * ⚠️ Đường đi thật: `U-1` (commit `3cfbd75`) đã **mở modal «Thêm nhân sự vào kho»** cho người uỷ nhiệm ✓
 *
 * <h2>Ngữ nghĩa phải giữ (⛔ đừng đổi)</h2>
 * <ul>
 *   <li>⭐ khoá **TRÙNG** ⇒ **payload THẮNG** (người dùng vẫn SỬA được) ✓</li>
 *   <li>⭐ khoá chỉ có ở **HIỆN CÓ** ⇒ **GIỮ LẠI NGUYÊN** (⛔ KHÔNG XOÁ) ✓ ← chính là chỗ chống mất dữ liệu</li>
 *   <li>⭐ `role=admin` ⇒ ⛔ **giữ nguyên FULL-REPLACE** (⚠️ phép kiểm đó đã có ở
 *       {@code AdminGovernanceIntegrationTest.phanQuyenPhongBan_...} — payload rỗng ⇒ về 0 là ĐÚNG Ý ĐỊNH) ✓</li>
 * </ul>
 */
class UserAccessScopeMergeTest {

    private static Map<String, Object> row(Object... kv) {
        Map<String, Object> m = new LinkedHashMap<>();
        for (int i = 0; i < kv.length; i += 2) m.put(String.valueOf(kv[i]), kv[i + 1]);
        return m;
    }

    private static String khoaCua(Object o, String khoa) { return String.valueOf(((Map<?, ?>) o).get(khoa)); }

    @Test
    @DisplayName("V-1 ①: người có 3 phạm vi, payload chỉ gửi 1 ⇒ ⭐ VẪN CÒN 3 (⛔ KHÔNG MẤT DỮ LIỆU)")
    void hop_khongMatPhamViCu() {
        // ⚠️ Đúng ca thật đã gây bug: payload (client thấy) chỉ có 1 kho, người dùng thật có 3 kho.
        List<Map<String, Object>> hienCo = List.of(
                row("warehouseId", "WH-A", "permission", "read"),
                row("warehouseId", "WH-B", "permission", "approve"),
                row("warehouseId", "WH-C", "permission", "write"));
        List<Object> payload = List.of(row("warehouseId", "WH-D", "permission", "read"));

        List<Object> kq = UserManagementUseCase.hopThemKhongXoa(hienCo, payload, "warehouseId");

        assertEquals(4, kq.size(), "⭐ phải là 1 (gửi mới) + 3 (giữ lại) = 4 — ⛔ KHÔNG được mất phạm vi cũ");
        List<String> khoa = kq.stream().map(o -> khoaCua(o, "warehouseId")).sorted().toList();
        assertEquals(List.of("WH-A", "WH-B", "WH-C", "WH-D"), khoa,
                "⭐ cả 3 kho CŨ phải CÒN NGUYÊN + kho mới được thêm ✓");
        assertEquals("approve", kq.stream().filter(o -> "WH-B".equals(khoaCua(o, "warehouseId")))
                        .map(o -> String.valueOf(((Map<?, ?>) o).get("permission"))).findFirst().orElse(""),
                "⭐ GIỮ NGUYÊN quyền CŨ của kho ⛔ không bị hạ về mặc định");
    }

    @Test
    @DisplayName("V-1 ②: gửi lại CÙNG khoá ⇒ ⭐ payload THẮNG (vẫn SỬA được, ⛔ không bị chặn)")
    void hop_payloadThangKhiTrungKhoa() {
        List<Map<String, Object>> hienCo = List.of(row("warehouseId", "WH-A", "permission", "read"));
        List<Object> payload = List.of(row("warehouseId", "WH-A", "permission", "approve"));

        List<Object> kq = UserManagementUseCase.hopThemKhongXoa(hienCo, payload, "warehouseId");

        assertEquals(1, kq.size(), "⭐ trùng khoá ⇒ ⛔ KHÔNG nhân đôi dòng");
        assertEquals("approve", ((Map<?, ?>) kq.get(0)).get("permission"),
                "⭐ payload THẮNG ⇒ sửa quyền vẫn có hiệu lực ✓");
    }

    @Test
    @DisplayName("V-1 ③: người CHƯA có phạm vi nào ⇒ ⭐ payload được ghi NGUYÊN (⛔ không thêm rác)")
    void hop_khiChuaCoPhamVi() {
        List<Object> payload = List.of(row("projectId", "P-1", "permission", "read"),
                row("projectId", "P-2", "permission", "write"));

        List<Object> kq = UserManagementUseCase.hopThemKhongXoa(List.of(), payload, "projectId");

        assertEquals(2, kq.size(), "⭐ danh sách hiện có RỖNG ⇒ ⛔ không sinh thêm dòng nào");
        assertTrue(kq.stream().anyMatch(o -> "P-1".equals(khoaCua(o, "projectId"))));
        assertTrue(kq.stream().anyMatch(o -> "P-2".equals(khoaCua(o, "projectId"))));
    }

    @Test
    @DisplayName("V-1 ④: `hienCo` null hoặc dòng thiếu khoá ⇒ ⭐ xử lý an toàn (⛔ không ném lỗi, ⛔ không thêm dòng rỗng)")
    void hop_anToanVoiDuLieuXau() {
        List<Object> payload = List.of(row("moduleKey", "requests", "canView", 1));
        List<Map<String, Object>> hienCo = List.of(row("moduleKey", ""), row("khac", "X"));

        List<Object> kq = UserManagementUseCase.hopThemKhongXoa(hienCo, payload, "moduleKey");

        assertEquals(1, kq.size(), "⭐ dòng thiếu khoá (rỗng) ⛔ KHÔNG được thêm vào");
        assertEquals(1, UserManagementUseCase.hopThemKhongXoa(null, payload, "moduleKey").size(),
                "⭐ `hienCo` null ⇒ trả đúng payload, ⛔ không ném lỗi");
    }
}
