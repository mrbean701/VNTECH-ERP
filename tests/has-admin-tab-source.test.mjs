// HỢP ĐỒNG NGUỒN QUYỀN CỦA `hasAdminTab` — KHOÁ REGRESSION (`BUG-20261008-008`).
//
// ⭐ VÌ SAO CẦN: `hasAdminTab` từng **CHỈ** đọc `data.allModulePermissions` — mà
//   `BootstrapDataAdapter.java:943` chỉ đổ trường đó khi `admin === true`
//   (`data.put("allModulePermissions", admin ? query(…) : …)`).
//   ⇒ ⭐ với MỌI **non-admin**, hàm **LUÔN trả FALSE** ⇒ nút «Sửa tài khoản» (`app/page.tsx:1847`)
//   ⛔ **KHÔNG BAO GIỜ HIỆN** dù người dùng đã được **uỷ nhiệm** `admin_tab_01`
//   ⇒ ⭐ cấp quyền qua CẤU HÌNH ⛔ không có tác dụng gì ✓
//   📏 ĐO ĐƯỢC ở E2E `tools/probe-grant-1-perm-e2e.mjs` (menu quản trị hiện mà `hasAdminTab` trả false) ✓
//
// ⚠️ Test này chạy trên HÀM THUẦN (⛔ không cần trình duyệt) ⇒ rẻ + chặt.
// Chạy: node --import tsx --test tests/has-admin-tab-source.test.mjs

import test from "node:test";
import assert from "node:assert/strict";
import { hasAdminTab } from "../app/screens/AdminUserModalTabs.tsx";

const TOI = "USR_me";
const NGUOI_KHAC = "USR_other";

/** Dựng `AppData` tối thiểu — chỉ các trường hàm này thật sự đọc. */
const data = ({ all = [], mine = [], user = { id: TOI } } = {}) => ({
  user, allModulePermissions: all, modulePermissions: mine,
});

test("⭐ NON-ADMIN (bootstrap ⛔ không gửi `allModulePermissions`) VẪN được nhận đúng quyền uỷ nhiệm", () => {
  // 📏 Đây CHÍNH LÀ ca đã hỏng: `allModulePermissions` rỗng (non-admin) nhưng quyền của chính họ CÓ.
  assert.equal(
    hasAdminTab(data({ all: [], mine: [{ userId: TOI, moduleKey: "admin_tab_01", canView: 1 }] }), "admin_tab_01"),
    true,
    "⛔ trả false là tái phát BUG-20261008-008 (nút «Sửa tài khoản» sẽ không hiện)",
  );
});

test("ADMIN (bootstrap CÓ `allModulePermissions`) vẫn nhận đúng — ⛔ không phá hành vi cũ", () => {
  assert.equal(
    hasAdminTab(data({ all: [{ userId: TOI, moduleKey: "admin_tab_01", canView: 1 }], mine: [] }), "admin_tab_01"),
    true,
  );
});

test("⛔ KHÔNG cấp quyền ⇒ false (đối chứng âm: hàm ⛔ không được luôn-true)", () => {
  assert.equal(hasAdminTab(data(), "admin_tab_01"), false);
  assert.equal(hasAdminTab(data({ mine: [{ userId: TOI, moduleKey: "admin_tab_02", canView: 1 }] }), "admin_tab_01"), false,
    "khoá KHÁC ⛔ không được tính");
});

test("⛔ `canView = 0` ⇒ false (quy ước tab: `canView === 1` mới tính)", () => {
  assert.equal(hasAdminTab(data({ mine: [{ userId: TOI, moduleKey: "admin_tab_01", canView: 0 }] }), "admin_tab_01"), false);
});

test("⛔ quyền của NGƯỜI KHÁC ⛔ không được cấp cho mình (lọc đúng `userId` ở nguồn `allModulePermissions`)", () => {
  assert.equal(
    hasAdminTab(data({ all: [{ userId: NGUOI_KHAC, moduleKey: "admin_tab_01", canView: 1 }] }), "admin_tab_01"),
    false,
    "⛔ nếu true ⇒ LỘ QUYỀN: ai cũng thấy nút của người khác",
  );
});

test("⛔ không có người dùng (chưa đăng nhập) ⇒ false", () => {
  assert.equal(hasAdminTab(data({ user: null, mine: [{ moduleKey: "admin_tab_01", canView: 1 }] }), "admin_tab_01"), false);
});
