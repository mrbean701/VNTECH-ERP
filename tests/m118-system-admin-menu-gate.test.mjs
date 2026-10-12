// MỐC 118 — HỢP ĐỒNG: ẨN MENU «QUẢN TRỊ HỆ THỐNG» KHI USER KHÔNG CÓ QUYỀN NÀO TRONG NHÓM.
//
// USER 01/10/2026: «ẩn menu quản trị hệ thống đối với tất cả các user không được cấp bất cứ 1
// quyền nào trong nhóm phân quyền hệ thống. Ngoại lệ chỉ các user được cấp quyền quản trị hệ thống
// thì mới thấy được menu quản trị hệ thống (kể cả 1 quyền cũng hiển thị menu).»
//
// Đo thật trên payload `GET /api/system` (MỐC 118 probe): 7/7 tài khoản đúng quy tắc.
// Bài học đã ghi vào test: KHÔNG được kết luận "user không có quyền nào" chỉ vì bảng
// `user_module_permissions` trống — backend còn bơm quyền theo phòng ban
// (`permissionSource` = `company_leadership` / `department_default`).
import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const page = read("app/page.tsx");
const permissions = read("lib/permissions.ts");

test("MỐC 118 — cổng menu nhóm quản trị hệ thống độc lập với cổng canView chung", () => {
  assert.match(page, /SYSTEM_ADMIN_GROUP_KEY/, "app/page.tsx phải dùng khoá nhóm dùng chung");
  assert.match(permissions, /const SYSTEM_ADMIN_GROUP_KEY = "system_admin"/, "Khoá nhóm phải khớp menu_group_catalog.group_key");
  assert.match(permissions, /function hasAnyCapability\(/, "Phải có bộ đếm 'một quyền bất kỳ'");
  // 6 năng lực phải được xét hết — thiếu `canApprove` là mất trường hợp 'chỉ được Duyệt'.
  for (const cap of ["canView", "canUse", "canCreate", "canEdit", "canApprove", "canExport"]) {
    assert.match(permissions, new RegExp(`perm\\.${cap}`), `hasAnyCapability phải xét ${cap}`);
  }
  // ⭐ M-2 (USER CHỐT 08/10/2026 — `DEC-20261008-003`) — ⛔ SỬA CHO ĐÚNG **Ý ĐỊNH GỐC MỐC 118**:
  //   user đã yêu cầu «**kể cả 1 quyền cũng hiển thị menu**», nhưng bản cũ chỉ xét
  //   `configuredModules(data)` = **MẢNG MENU TĨNH** — mà 14 khoá `admin_tab_NN` ⛔ KHÔNG nằm trong đó
  //   (chúng có trong `module_catalog`; MỐC 31 đã bỏ 14 menu con) ⇒ cấp `admin_tab_06` ⛔ KHÔNG hiện menu
  //   (⭐ ĐO được ở `TEST-20261008-004`: `nav groups` thiếu `system_admin`) ✓
  //   ✅ NAY: xét TRỰC TIẾP `data.modulePermissions` của chính người dùng — nhận module `admin`
  //   ⭐ VÀ 14 khoá `admin_tab_NN` ⇒ **đúng câu «kể cả 1 quyền cũng hiển thị menu»** ✓
  assert.match(page, /const hasAnyAdminGroupPermission = \(data\.modulePermissions \|\| \[\]\)\.some\(/,
    "Phải có bộ đếm '≥1 quyền trong NHÓM QUẢN TRỊ' (đọc quyền của CHÍNH người dùng)");
  assert.match(page, /key === "admin" \|\| \/\^admin_tab_/,
    "Bộ đếm phải nhận module `admin` ⭐ VÀ 14 khoá `admin_tab_NN`");
  assert.match(page, /systemAdminMenuVisible = isAdminUser\(data\.user\) \|\| hasAnyAdminGroupPermission;/,
    "Menu nhóm quản trị chỉ hiện khi là admin HOẶC có ≥1 quyền trong nhóm");
});

test("MỐC 118 — nhóm quản trị hệ thống KHÔNG hưởng lối thoát `!permissionConfigured`", () => {
  // Đo thật: `kttdemo` có 0 dòng quyền mà lối thoát này vẫn mở ra 15 mục con.
  assert.doesNotMatch(page, /systemAdminMenuVisible = !permissionConfigured/,
    "Không được để nhóm quản trị hệ thống đi qua lối thoát !permissionConfigured");
  // ⭐ M-2 — mục con nhóm quản trị: cổng riêng CỦA NÓ ⭐ HOẶC vế «≥1 quyền trong nhóm».
  //   ⚠️ Vế sau BẮT BUỘC: người chỉ được cấp `admin_tab_06` ⛔ không có quyền trên module `admin`
  //   ⇒ nếu ⛔ thiếu vế này thì nhóm hiện ra **RỖNG** và họ ⛔ không vào được màn quản trị
  //   (⭐ ĐO được: `TEST-20261008-004` — 0 tab quản trị, thân màn trống) ✓
  assert.match(page, /if \(isSystemAdminItem\(item\)\) return systemAdminMenuVisible && \(hasAnyCapability\(modulePermission\(data, item\.key\)\) \|\| hasAnyAdminGroupPermission\);/,
    "Mục con nhóm quản trị lọc bằng cổng riêng + vế M-2, đứng trước nhánh lối thoát");
  // Nhánn lối thoát chỉ còn ở menu nghiệp vụ.
  assert.match(page, /return !permissionConfigured \|\| modulePermission\(data, item\.key\)\.canView;/,
    "Menu nghiệp vụ giữ nguyên lối thoát cũ");
});

test("MỐC 118 — không được phát hiện cả nhóm quản trị cho tài khoản chưa được cấp quyền", () => {
  // `visibleGroupKeys` phải loại nhóm ra khỏi danh sách nhóm khi menu không hiện,
  // nếu không tiêu đề nhóm vẫn hiện dù không có mục con nào.
  assert.match(page, /menuGroups\.filter\(\(row\) => String\(row\.groupKey\) !== SYSTEM_ADMIN_GROUP_KEY \|\| systemAdminMenuVisible\)/,
    "Phải loại nhóm quản trị khỏi visibleGroupKeys khi menu không hiện");
});