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

  // Vùng này phải lấy `moduleKeys` (HỢP: danh mục ∪ dòng ma trận) làm NGUỒN DUY NHẤT:
  //   · USESTATE khởi tạo  : `moduleKeys` (phải đủ MỌI khoá, kể cả khoá ⛔ không được vẽ —
  //     đó chính là cơ chế ⛔ không mất quyền khi Lưu, xem VỆ 7/8).
  //   · 2 NÚT HÀNG LOẠT + trạng thái ĐẦU CỘT: `bulkKeys` = `moduleKeys` ĐÃ LỌC khoá ẩn khỏi ma trận
  //     (⭐ QUYẾT ĐỊNH USER 08/10/2026 «ẩn» 4 khoá `dept_plan_*`/`dept_project_*` — nếu 2 nút này chạy trên
  //     `moduleKeys` thì bấm «□ Bỏ chọn tất cả» sẽ **GHI 0 ÂM THẦM** cho khoá ⛔ không còn ô nào trên màn hình).
  // ⚠️ `bulkKeys` PHẢI suy **TỪ `moduleKeys`** (⛔ KHÔNG suy từ `entries`/`item.key`) — nếu không là lệch nguồn.
  assert.match(vungDungState, /moduleKeys\.map\(\(key\) => \{/);
  assert.match(vungDungState, /const bulkKeys = moduleKeys\.filter\(\(key\) => !MATRIX_HIDDEN_MODULE_KEYS\.includes\(key\)\);/);
  assert.match(vungDungState, /bulkKeys\.map\(\(key\) => \[/);
  assert.match(vungDungState, /const selected = bulkKeys\.filter\(\(key\) => permissionState\[key\]\?\.\[cap\]\)\.length;/);
  assert.match(vungDungState, /all: bulkKeys\.length > 0 && selected === bulkKeys\.length,/);

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

// ⭐⭐ QUYẾT ĐỊNH USER 08/10/2026: «**ẩn**» 4 khoá cũ khỏi ma trận (`ERP-SESSION-04`).
//   VÌ SAO CẦN TEST NÀY (⚠️ `BUG-D19` — suýt gây MẤT QUYỀN ÂM THẦM): ma trận bị «chia 2 phòng ban» vì 4 khoá
//   `dept_plan_*`/`dept_project_*` mang tên 2 phòng, trong khi công ty có **11 đơn vị**. User chốt ẨN.
//   ⚠️ Nhưng `save_user_access` là **FULL-REPLACE** ⇒ nếu "ẩn" bị làm SAI cách (xoá khỏi `module_catalog`
//   hoặc khỏi tập khoá gửi lên) thì **4 khoá đó bị GHI XOÁ** cho mọi tài khoản. Và 2 nút HÀNG LOẠT
//   (`setAll`/`setColumnAll`) lặp trên HỢP (gồm khoá ẩn) ⇒ bấm «Bỏ chọn tất cả» = **ghi 0 âm thầm**.
//   ⇒ Test này khoá **CẢ 4 BẤT BIẾN** của cách ẩn AN TOÀN:
//     ① 4 khoá nằm trong `MATRIX_HIDDEN_MODULE_KEYS`
//     ② ẩn ở **TẦNG VẼ** (`visibleEntries`) — `entries` ⛔ KHÔNG bị đụng
//     ③ nguồn khoá GỬI LÊN (`permissionMatrixKeys`) ⛔ KHÔNG lọc theo danh sách ẩn ⇒ vẫn gửi đủ 4 khoá
//     ④ 2 nút hàng loạt + trạng thái đầu cột dùng `bulkKeys` (⛔ KHÔNG dùng `moduleKeys`)
test("VỆ 8 — ẨN 4 khoá cũ khỏi ma trận mà ⛔ KHÔNG mất quyền (chống ghi 0 âm thầm)", () => {
  const matrix = read("app/screens/PermissionMatrix.tsx");
  const HIDDEN = ["dept_plan_tasks", "dept_project_tasks", "dept_plan_assign", "dept_project_assign"];

  // ① danh sách ẩn phải có ĐỦ 4 khoá (⛔ thiếu 1 khoá ⇒ ma trận vẫn chia phòng ban)
  const block = matrix.slice(matrix.indexOf("MATRIX_HIDDEN_MODULE_KEYS"), matrix.indexOf("MATRIX_HIDDEN_MODULE_KEYS") + 500);
  for (const key of HIDDEN) {
    assert.ok(block.includes(`"${key}"`), `⛔ \`MATRIX_HIDDEN_MODULE_KEYS\` thiếu \`${key}\``);
  }
  assert.match(matrix, /export const MATRIX_HIDDEN_MODULE_KEYS: string\[\] = \[/,
    "phải EXPORT danh sách ẩn để panel dùng CHUNG (⛔ không khai 2 nơi rồi lệch nhau)");

  // ② ẨN Ở TẦNG VẼ: ô `<tr>` lặp trên `visibleEntries`; ⛔ KHÔNG còn lặp trên `entries`
  assert.match(matrix, /\{visibleEntries\.map\(\(entry\) => \{/,
    "phần VẼ phải lặp trên `visibleEntries` (đã lọc khoá ẩn)");
  assert.doesNotMatch(matrix, /\{entries\.map\(\(entry\) => \{/,
    "⛔ phần VẼ vẫn lặp trên `entries` ⇒ khoá ẩn VẪN hiện ⇒ trái quyết định user");
  assert.match(matrix, /const visibleEntries = \(\(\) => \{/,
    "phải có bộ lọc `visibleEntries` (lọc ở TẦNG VẼ ⇒ ⛔ không đổi tập khoá nào)");
  assert.match(matrix, /if \(kept\[i\]\.kind === "module"\) return true;/,
    "phải bỏ DÒNG NHÓM rỗng (⛔ không để tiêu đề nhóm TRỐNG khi mọi module của nhóm bị ẩn)");

  // ③ nguồn khoá GỬI LÊN ⛔ KHÔNG được lọc theo danh sách ẩn (nếu lọc ⇒ 4 khoá bị XOÁ khi Lưu)
  assert.match(panel, /export function permissionMatrixKeys/,
    "`permissionMatrixKeys` phải còn nguyên (nguồn khoá gửi lên)");
  const fn = panel.slice(panel.indexOf("export function permissionMatrixKeys"), panel.indexOf("export function permissionMatrixKeys") + 700);
  assert.ok(!fn.includes("MATRIX_HIDDEN_MODULE_KEYS"),
    "⛔ `permissionMatrixKeys` bị lọc theo danh sách ẩn ⇒ 4 khoá ⛔ KHÔNG gửi lên ⇒ **BỊ XOÁ** khi Lưu (FULL-REPLACE)");

  // ④ 2 nút hàng loạt + trạng thái 3 mức đầu cột chỉ tác động khoá ĐANG HIỆN
  assert.match(panel, /const bulkKeys = moduleKeys\.filter\(\(key\) => !MATRIX_HIDDEN_MODULE_KEYS\.includes\(key\)\)/,
    "phải có `bulkKeys` (khoá đang HIỆN) cho các nút hàng loạt");
  for (const fnName of ["setAll", "setColumnAll"]) {
    const body = panel.slice(panel.indexOf(`const ${fnName} = `), panel.indexOf(`const ${fnName} = `) + 600);
    assert.match(body, /bulkKeys\.map/, `⛔ \`${fnName}\` phải dùng \`bulkKeys\` — nếu dùng \`moduleKeys\` là GHI 0 ÂM THẦM cho khoá đã ẩn`);
    assert.ok(!/moduleKeys\.map/.test(body), `⛔ \`${fnName}\` còn dùng \`moduleKeys\` ⇒ bấm «Bỏ chọn tất cả» sẽ XOÁ quyền của khoá đã ẩn`);
  }
  const colState = panel.slice(panel.indexOf("const columnState = "), panel.indexOf("const columnState = ") + 700);
  assert.match(colState, /bulkKeys\.filter/, "⛔ `columnState` phải tính trên `bulkKeys` (nếu tính cả khoá ẩn thì đầu cột hiện SAI so với mắt admin)");
});
