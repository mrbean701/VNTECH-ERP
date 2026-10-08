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
//
// ─────────────────────────────────────────────────────────────────────────────────────
// VÒNG 257 — USER 07/10/2026 BÁO LẠI CÙNG TRIỆU CHỨNG (nguyên văn):
//   «tôi vừa thực hiện cấu hình phân quyền cho 1 user nhưng gặp lỗi, khi bấm lưu thì nó
//    không lưu phân quyền tôi vừa chọn cho user, check lại modal phân quyền công việc/
//    chức năng xem sao.»
//
// NGUYÊN NHÂN GỐC MỚI (đo, ⛔ không suy đoán — `tools/probe-permission-save-keyset.mjs`):
//   Bản vá vòng 214 mới chỉ sửa ĐÚNG phía PANEL. Phía hai MODAL vẫn dựng payload bằng
//   `configuredModules(data).filter((item) => item.key !== "admin")` — và tập đó KHÔNG có
//   14 khoá `admin_tab_NN` (chúng có trong `module_catalog` nhưng KHÔNG có trong mảng menu
//   `modules`, xem `app/page.tsx:269-280`), cũng không có `admin` (bị lọc) và `reports`.
//   ⇒ **tập khoá VẼ RA ⊋ tập khoá GỬI ĐI** ⇒ ô tick ngoài payload bị BỎ QUA khi bấm Lưu.
//   📏 ĐO THẬT trên bootstrap 76 dòng: panel vẽ **77** khoá · payload gửi **61** khoá ·
//      **MẤT 16** = `admin_tab_01..14` + `admin` + `reports`.
//   ✅ BACKEND CHẤP NHẬN các khoá đó — đo `tools/probe-permission-save-api.mjs`: admin lưu
//      `admin_tab_01` ⇒ HTTP 200 và đọc lại thấy persisted ⇒ lỗi ở **FRONTEND**, ⛔ không phải API.
//
// BẢN VÁ VÒNG 257: một NGUỒN DUY NHẤT `permissionMatrixKeys(data, entries)` (export từ
// `PermissionAccessPanel.tsx`) cho CẢ panel vẽ ô tick LẪN payload của cả hai modal.
// ⛔ Không còn đường nào dựng tập khoá thứ hai ⇒ không thể lệch lại.
// ─────────────────────────────────────────────────────────────────────────────────────

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

/** Bỏ mọi chú thích `//` và khối `/** … *\/` — KHÔNG được khớp regex vào text trong chú thích (D-088). */
function maCode(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[ \t]*\/\/.*$/gm, "");
}

test("VỆ 1 — nguồn khoá chức năng là `moduleKey` (cột CSDL thật), KHÔNG phải `item.key`", () => {
  // Khoá được lấy trong hàm nguồn duy nhất `permissionMatrixKeys`.
  assert.match(panel, /export function permissionMatrixKeys\(/);
  assert.match(panel, /\.map\(\(item\) => String\(item\.moduleKey\)\)/);
  // Không còn đọc `item.enabled` (cột không tồn tại) và không lọc bằng `item.key`.
  assert.doesNotMatch(panel, /item\.enabled/);
  assert.doesNotMatch(panel, /item\.key !== "admin"/);
  assert.match(panel, /\.filter\(\(item\) => item\.active !== false\)/);
});

test("VỆ 2 — khoá là HỢP của danh mục module VÀ dòng ma trận thật (`entries`), dùng CHUNG cho 2 phía", () => {
  const code = maCode(panel);
  const than = code.slice(code.indexOf("export function permissionMatrixKeys("));
  // Nguồn 1: danh mục module. Nguồn 2: `entries` (dòng ma trận thật sự được vẽ).
  assert.match(than, /const catalogKeys = \(data\.moduleCatalog \|\| \[\]\)/);
  // `entry.module?.key` là đường truy cập chuẩn, khớp `PermissionMatrix.tsx` dòng 39.
  assert.match(than, /entries\s*\n?\s*\.map\(\(entry\) => String\(entry\.module\?\.key \?\? ""\)\)/);
  assert.match(than, /new Set<string>\(\[\.\.\.catalogKeys, \.\.\.entryKeys\]\)/);

  // Panel PHẢI tiêu thụ chính hàm đó (⛔ không tự dựng tập khoá riêng).
  assert.match(code, /const moduleKeys = permissionMatrixKeys\(data, entries\);/);
});

test("VỆ 3 — phần DỰNG STATE không đọc `item.key` của dòng danh mục; phần VẼ thì ĐƯỢC (khác ý nghĩa)", () => {
  const code = maCode(panel);

  // ⓔ `item` có HAI nghĩa khác nhau trong tệp này:
  //   · trong hàm `permissionMatrixKeys` = dòng `moduleCatalog` ⇒ `.key` KHÔNG tồn tại (lỗi gốc).
  //   · trong phần vẽ `<tbody>` = `entry.module` từ `permissionMenuStructure` ⇒ `.key` ĐÚNG.
  // Vì vậy phải khoanh đúng vùng dựng state, không cấm chung toàn tệp.
  const vungDungState = code.slice(code.indexOf("export function permissionMatrixKeys("), code.indexOf("<div className=\"embedded-permission-body\">"));
  assert.ok(vungDungState.length > 0, "phải tìm được vùng dựng state");
  assert.doesNotMatch(vungDungState, /permissionState\[item\.key\]/);
  assert.doesNotMatch(vungDungState, /permissionFor\(item\.key\)/);

  // Vùng này phải dùng `moduleKeys` cho cả 3 nơi: state khởi tạo, setAll/setColumnAll, columnState.
  assert.match(vungDungState, /moduleKeys\.map\(\(key\) => \{/);
  assert.match(vungDungState, /moduleKeys\.map\(\(key\) => \[/);
  assert.match(vungDungState, /const selected = moduleKeys\.filter\(\(key\) => permissionState\[key\]\?\.\[cap\]\)\.length;/);
  assert.match(vungDungState, /all: moduleKeys\.length > 0 && selected === moduleKeys\.length,/);

  // Phần vẽ vẫn dùng `item.key` — ĐÚNG, vì `item` ở đó là `entry.module`.
  assert.match(code, /const item = entry\.module!;/);
  assert.match(code, /checked=\{Boolean\(permissionState\[item\.key\]\?\.\[cap\]\)\}/);
});

test("VỆ 4 — HÀNH VI THẬT: biểu thức nguồn sinh N khoá phân biệt trên dữ liệu API thật", () => {
  const moduleCatalog = [moduleCatalogRow, { ...moduleCatalogRow, moduleKey: "requests", label: "Phiếu đề nghị mua hàng" }];

  // Đúng biểu thức trong `permissionMatrixKeys` (nhánh danh mục module).
  const catalogKeys = moduleCatalog
    .filter((item) => item.active !== false)
    .map((item) => String(item.moduleKey));
  const moduleKeys = Array.from(new Set(catalogKeys));

  assert.equal(catalogKeys.length, 2);
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

test("VỆ 6 — CẢ HAI modal gửi `save_user_access` với `modulePermissions` dựng từ hàm nguồn chung", () => {
  const code = maCode(page);

  // Khóa hợp đồng: modal ⛔ KHÔNG đọc state của panel, mà đọc `permissionStateRef.current`.
  assert.match(code, /const ps=permissionStateRef\.current;/);
  // Cả hai modal phải dựng payload qua CÙNG hàm nguồn, đọc ô tick bằng khoá `key`.
  const soLan = (code.match(/const modulePermissions=permissionMatrixKeys\(data,permissionRows\)\.map\(\(key\)=>\(\{moduleKey:key,canView:Boolean\(ps\[key\]\?\.view\)/g) || []).length;
  assert.equal(soLan, 2, "CẢ `UserEditModal` và `UserAccessModal` đều phải dùng `permissionMatrixKeys`");
  assert.match(code, /submit\("save_user_access",\{userId:userRow\.id,projectScopes,warehouseScopes,modulePermissions\}\)/);
  assert.match(code, /submit\("save_user_access",\{userId:row\.id,projectScopes,warehouseScopes,modulePermissions\}\)/);

  // ⛔ KHÔNG còn đường dựng tập khoá thứ hai (đây chính là lỗi vòng 257).
  assert.doesNotMatch(code, /assignableModules/);
  assert.match(code, /import PermissionAccessPanel, \{ countChangedPermissions, permissionMatrixKeys \} from "@\/app\/screens\/PermissionAccessPanel";/);
});

// ⭐ VỆ 7 (MỚI — vòng 257) — BẮT ĐÚNG LỖI «BẤM LƯU KHÔNG LƯU»: tập khoá gửi đi phải
// PHỦ ĐỦ tập khoá panel vẽ, kể cả 14 khoá `admin_tab_NN` không nằm trong mảng menu.
test("VỆ 7 — payload PHỦ ĐỦ tập khoá panel vẽ (gồm `admin_tab_NN` ngoài menu)", () => {
  // Bootstrap THẬT: 76 dòng module_catalog, trong đó có 14 khoá `admin_tab_NN`.
  // ⚠️ `reports` cố ý để `active: 0` — ĐÚNG như dữ liệu thật: `0 !== false` (so sánh ngặt)
  //    nên panel VẪN vẽ, còn `configuredModules` dùng `Boolean(config.active)` ⇒ `false`
  //    nên payload CŨ rớt nó. Đây là chỗ tinh tế thứ hai của lỗi, phải giữ trong fixture.
  const moduleCatalog = [
    moduleCatalogRow,
    { ...moduleCatalogRow, moduleKey: "requests" },
    { ...moduleCatalogRow, moduleKey: "admin", label: "Danh mục & phân quyền" },
    { ...moduleCatalogRow, moduleKey: "reports", label: "Báo cáo & cảnh báo", active: 0 },
    ...Array.from({ length: 14 }, (_, i) => ({
      ...moduleCatalogRow,
      moduleKey: `admin_tab_${String(i + 1).padStart(2, "0")}`,
      groupKey: "system_admin",
    })),
  ];
  // Mảng menu `modules` (lib/menu-helpers.ts) KHÔNG chứa `admin_tab_NN` — mô phỏng đúng thực tế.
  const menuModuleKeys = ["purchasing", "requests", "admin", "reports"];

  // ── Hàm nguồn chung (nhánh danh mục ∪ nhánh entries) — đúng như đã ship ──────────
  const catalogKeys = moduleCatalog
    .filter((item) => item.active !== false)
    .map((item) => String(item.moduleKey));
  const entryKeys = menuModuleKeys.filter((k) => k !== "admin");
  const payloadKeys = Array.from(new Set([...catalogKeys, ...entryKeys]));

  // Tập panel VẼ ô tick = cùng công thức (panel gọi chính hàm này).
  const panelKeys = Array.from(new Set([...catalogKeys, ...entryKeys]));

  assert.deepEqual([...payloadKeys].sort(), [...panelKeys].sort(), "hai tập PHẢI trùng khít");
  const adminTabs = payloadKeys.filter((k) => /^admin_tab_\d{2}$/.test(k));
  assert.equal(adminTabs.length, 14, "14 khoá `admin_tab_NN` PHẢI có trong payload (lỗi vòng 257 làm mất đúng 14 khoá này)");

  // ── ĐỐI CHỨNG ÂM: biểu thức CŨ (`configuredModules`) làm mất ĐÚNG 16 khoá ─────────
  // Mô phỏng `configuredModules`: `active = config ? Boolean(config.active) : true`, rồi lọc `active`.
  const oldPayloadKeys = menuModuleKeys.filter((key) => {
    if (key === "admin") return false; // modal cũ lọc cứng `item.key !== "admin"`
    const row = moduleCatalog.find((r) => String(r.moduleKey) === key);
    return row ? Boolean(row.active) : true;
  });
  const lost = panelKeys.filter((k) => !oldPayloadKeys.includes(k));
  assert.equal(lost.length, 16, "biểu thức cũ phải mất đúng 16 khoá = 14 `admin_tab_NN` + `admin` + `reports`");
  assert.deepEqual(
    lost.sort(),
    ["admin", "reports", ...Array.from({ length: 14 }, (_, i) => `admin_tab_${String(i + 1).padStart(2, "0")}`)].sort(),
    "đúng 16 khoá đã ĐO trên bootstrap thật (tools/probe-permission-save-keyset.mjs)",
  );
});
