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
  assert.match(page, /systemAdminMenuVisible = isAdminUser\(data\.user\)\s*\n?\s*\|\| configuredModules\(data\)\.some\(\(item\) => isSystemAdminItem\(item\) && hasAnyCapability\(modulePermission\(data, item\.key\)\)\)/,
    "Menu nhóm quản trị chỉ hiện khi là admin HOẶC có ≥1 quyền trong nhóm");
});

test("MỐC 118 — nhóm quản trị hệ thống KHÔNG hưởng lối thoát `!permissionConfigured`", () => {
  // Đo thật: `kttdemo` có 0 dòng quyền mà lối thoát này vẫn mở ra 15 mục con.
  assert.doesNotMatch(page, /systemAdminMenuVisible = !permissionConfigured/,
    "Không được để nhóm quản trị hệ thống đi qua lối thoát !permissionConfigured");
  assert.match(page, /if \(isSystemAdminItem\(item\)\) return systemAdminMenuVisible && hasAnyCapability\(modulePermission\(data, item\.key\)\);/,
    "Mục con nhóm quản trị lọc bằng cổng riêng, đứng trước nhánh lối thoát");
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