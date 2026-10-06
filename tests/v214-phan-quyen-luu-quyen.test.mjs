// VÒNG 214 — BẮT LỖI TAB «PHÂN QUYỀN NGƯỜI DÙNG» (báo cáo gấp của USER 02/10/2026).
//
// USER, nguyên văn:
//   «Lỗi phân quyền, không thể cấp quyền cho user từ tab Phân quyền người dùng: không sử dụng
//    được copy quyền từ phòng ban, không lưu được quyền đã chọn cho user. Tiến hành bắt lỗi
//    và xử lý gấp.»
//
// NGUYÊN NHÂN GỐC (đo trên API sống 02/10/2026, KHÔNG suy đoán):
//   `app/screens/PermissionAccessPanel.tsx` dựng danh sách chức năng từ `data.moduleCatalog`,
//   nhưng lấy khoá bằng `item.key`. Dòng API trả cột `module_key` ⇒ mọi trường của một dòng
//   `moduleCatalog` là: active, groupKey, groupName, icon, label, moduleKey, sortOrder,
//   systemLocked — KHÔNG có `key`, KHÔNG có `enabled`.
//   ⇒ `item.key === undefined` cho CẢ 76 dòng ⇒ `Object.fromEntries` gộp thành MỘT khoá
//     `"undefined"` ⇒ hệ quả đo được:
//       1. Ma trận hiện ô tick TRỐNG cho cả tài khoản đang CÓ quyền.
//       2. «Chọn tất cả» / «Bỏ chọn tất cả» / checkbox đầu cột đều dựng state bằng khoá
//          `undefined` ⇒ payload `save_user_access` gửi 76 module TẤT CẢ `false` ⇒
//          `clearUserScopes()` XOÁ SẠCH toàn bộ quyền, trả về «Đã lưu quyền hiệu lực».
//          ⇒ «không lưu được quyền đã chọn» + âm thầm mất sạch quyền cũ.
//       3. Sau khi «Sao chép từ phòng ban» mà bấm Lưu thì kết quả copy cũng bị xoá ⇒
//          tưởng như nút copy hỏng.
//   Đã loại trừ TRƯỚC KHI VÁ (bài học D-081 — đo, đừng đoán):
//     · cổng P5.3 `assertDepartmentAllowsPermissions` KHÔNG chặn: 0/478 dòng quyền phòng ban
//       bật mà thiếu `can_view` ⇒ «Sao chép từ phòng ban» thành công cho 27/28 tài khoản.
//     · ngoại lệ cấp bật KHÔNG hỏng: adapter alias `l.auto_grant_all AS autogrant` đúng
//       với khoá Java đọc.
//     · `intOf` ĐÃ xử lý Boolean đúng (`"true"` ⇒ 1) nên payload boolean của modal không hỏng.

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");

const panel = read("app/screens/PermissionAccessPanel.tsx");
const page = read("app/page.tsx");

// Hình dạng dòng `moduleCatalog` ĐO THẬT ngày 02/10/2026 từ `GET /api/system` (76 dòng).
// Khoá `key` và `enabled` cố ý VẮNG MẶT — đó chính là nguyên nhân gốc.
const moduleCatalogRow = {
  active: true,
  groupKey: "purchasing",
  groupName: "MUA HÀNG & CUNG ỨNG",
  icon: "PO",
  label: "PR & PO",
  moduleKey: "purchasing",
  sortOrder: 30,
  systemLocked: false,
};

test("VỆ 1 — panel lấy khoá chức năng từ `moduleKey` (cột CSDL thật), KHÔNG phải `item.key`", () => {
  assert.match(panel, /key:\s*String\(item\.moduleKey\)/);
  // Không còn đọc `item.enabled` (cột không tồn tại) và không lọc bằng `item.key`.
  assert.doesNotMatch(panel, /item\.enabled/);
  assert.doesNotMatch(panel, /item\.key !== "admin"/);
  assert.match(panel, /\.filter\(\(item\) => item\.active !== false\)/);
});

test("VỆ 2 — `moduleKeys` hợp nhất khoá từ danh mục module VÀ khoá của dòng ma trận thật (`entries`)", () => {
  assert.match(panel, /const moduleKeys = Array\.from\(/);
  assert.match(panel, /assignableModules\s*\n\s*\.map\(\(item\) => item\.key\)/);
  // `entry.module?.key` là đường truy cập chuẩn, khớp `PermissionMatrix.tsx` dòng 78.
  assert.match(panel, /entries\.map\(\(entry\) => String\(entry\.module\?\.key \?\? ""\)\)/);
});

/** Bỏ mọi chú thích `//` và khối `/** … *\/` — KHÔNG được khớp regex vào text trong chú thích (D-088). */
function maCode(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[ \t]*\/\/.*$/gm, "");
}

test("VỆ 3 — phần DỰNG STATE không được đọc `item.key`; `item` ở phần VẼ thì ĐƯỢC (khác ý nghĩa)", () => {
  const code = maCode(panel);

  // ⓔ `item` có HAI nghĩa khác nhau trong tệp này:
  //   · trong `assignableModules`  = dòng `moduleCatalog` ⇒ `.key` KHÔNG tồn tại (lỗi gốc).
  //   · trong phần vẽ `<tbody>`  = `entry.module` từ `permissionMenuStructure` ⇒ `.key` ĐÚNG.
  // Vì vậy phải khoanh đúng vùng dựng state, không cấm chung toàn tệp.
  const vungDungState = code.slice(code.indexOf("const assignableModules"), code.indexOf("<div className=\"embedded-permission-body\">"));
  assert.ok(vungDungState.length > 0, "phải tìm được vùng dựng state");
  assert.doesNotMatch(vungDungState, /permissionState\[item\.key\]/);
  assert.doesNotMatch(vungDungState, /permissionFor\(item\.key\)/);
  assert.doesNotMatch(vungDungState, /assignableModules\.map\(\(item\) => \[/);

  // Vùng này phải dùng `moduleKeys` cho cả 3 nơi: state khởi tạo, setAll/setColumnAll, columnState.
  assert.match(vungDungState, /moduleKeys\.map\(\(key\) => \{/);
  assert.match(vungDungState, /moduleKeys\.map\(\(key\) => \[/);
  assert.match(vungDungState, /const selected = moduleKeys\.filter\(\(key\) => permissionState\[key\]\?\.\[cap\]\)\.length;/);
  assert.match(vungDungState, /all: moduleKeys\.length > 0 && selected === moduleKeys\.length,/);

  // Phần vẽ vẫn dùng `item.key` — ĐÚNG, vì `item` ở đó là `entry.module`.
  assert.match(code, /const item = entry\.module!;/);
  assert.match(code, /checked=\{Boolean\(permissionState\[item\.key\]\?\.\[cap\]\)\}/);
});

test("VỆ 4 — HÀNH VI THẬT: biểu thức MỚI sinh N khoá phân biệt trên dữ liệu API thật", () => {
  const moduleCatalog = [moduleCatalogRow, { ...moduleCatalogRow, moduleKey: "requests", label: "Phiếu đề nghị mua hàng" }];

  // Đúng biểu thức đã vá trong `PermissionAccessPanel.tsx`.
  const assignableModules = moduleCatalog
    .filter((item) => item.active !== false)
    .map((item) => ({ ...item, key: String(item.moduleKey) }));
  const moduleKeys = Array.from(new Set(assignableModules.map((item) => item.key)));

  assert.equal(assignableModules.length, 2);
  assert.equal(moduleKeys.length, 2, "mỗi chức năng phải có khoá phân biệt");
  assert.deepEqual(moduleKeys, ["purchasing", "requests"]);
});

test("VỆ 5 — ĐỐI CHỨNG ÂM: biểu thức CŨ gộp 76 dòng thành ĐÚNG 1 khoá `undefined` (khóa lỗi)", () => {
  const moduleCatalog = Array.from({ length: 76 }, (_, i) => ({
    ...moduleCatalogRow,
    moduleKey: `module_${i}`,
  }));

  const oldAssignable = moduleCatalog.filter((item) => Boolean(item.enabled !== false) && item.key !== "admin");
  const oldState = Object.fromEntries(oldAssignable.map((item) => [item.key, {}]));

  assert.equal(oldAssignable.length, 76, "bộ lọc cũ vẫn giữ hết dòng — nên lỗi KHÔNG biểu hiện ở chỗ lọc");
  assert.deepEqual(Object.keys(oldState), ["undefined"], "đây chính là khoá độc nhất gây mất quyền");

  // Bản vá phải sinh đủ 76 khoá phân biệt — nếu ai đó lỡ sửa lại thì VỆ này bắt được.
  const fixed = Object.fromEntries(
    moduleCatalog
      .filter((item) => item.active !== false)
      .map((item) => ({ ...item, key: String(item.moduleKey) }))
      .map((item) => [item.key, {}]),
  );
  assert.equal(Object.keys(fixed).length, 76);
});

test("VỆ 6 — modal gửi `save_user_access` với mảng `modulePermissions` lấy từ `permissionStateRef`", () => {
  // Khóa hợp đồng: modal KHÔNG đọc state của panel, mà đọc `permissionStateRef.current`.
  assert.match(page, /const ps=permissionStateRef\.current;/);
  assert.match(page, /moduleKey:item\.key,canView:Boolean\(ps\[item\.key\]\?\.view\)/);
  assert.match(page, /submit\("save_user_access",\{userId:userRow\.id,projectScopes,warehouseScopes,modulePermissions\}\)/);
});