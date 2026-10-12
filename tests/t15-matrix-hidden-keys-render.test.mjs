// T15 — HỢP ĐỒNG: 4 KHOÁ CŨ theo phòng (`dept_plan_tasks` · `dept_project_tasks` · `dept_plan_assign` ·
// `dept_project_assign`) phải bị ẨN Ở **MỌI ĐƯỜNG VẼ** ma trận phân quyền — nhưng ⛔ **KHÔNG** được ẩn ở
// đường **PAYLOAD** (gửi lên máy chủ), vì `save_user_access` là **FULL-REPLACE**:
//   khoá nào ⛔ không gửi lên sẽ **BỊ XOÁ** ⇒ mất quyền ÂM THẦM (đúng lỗi `BUG-D19`).
//
// ⚠️ VÌ SAO CÓ TEST NÀY (nguồn: `BUG-20261009-D31` — bug THẬT, user báo bằng ảnh):
//   Cả cụm trước đây **chỉ vá `PermissionMatrix`** (màn ma trận lớn) ⇒ tab «Phân quyền công việc / Chức năng»
//   dùng component **KHÁC** là `PermissionAccessPanel` **chưa bao giờ được vá** ⇒ vẫn hiện 4 dòng cũ.
//   ⇒ ⭐ Test này khoá **CẢ HAI** component ⇒ ⛔ bug không thể tái phát bằng cách sửa 1 chỗ rồi quên chỗ kia.
//
// ⚠️ 2 BẪY PHẢI CHỐNG (đã đo được, ⛔ không phải giả định):
//   ① Sửa vào `permissionMenuStructure` (`app/page.tsx`) ⇒ **payload cũng teo** ⇒ MẤT QUYỀN ÂM THẦM.
//   ② Lọc thẳng `entries` trong panel ⇒ `permissionMatrixKeys(data, entries)` cũng teo ⇒ CÙNG hậu quả.
//
// Chạy: node --import tsx --test tests/t15-matrix-hidden-keys-render.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const matrix = readFileSync(new URL("../app/screens/PermissionMatrix.tsx", import.meta.url), "utf8");
const panel = readFileSync(new URL("../app/screens/PermissionAccessPanel.tsx", import.meta.url), "utf8");
const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");

const HIDDEN_4 = ["dept_plan_tasks", "dept_project_tasks", "dept_plan_assign", "dept_project_assign"];

/**
 * ⚠️ BÀI HỌC ĐO ĐƯỢC (09/10/2026): bản đầu của test này chỉ khớp **CHUỖI HẰNG SỐ** `MATRIX_HIDDEN_MODULE_KEYS`
 * ⇒ khi tôi **tạm xoá bộ lọc** (`entries.filter(() => true`), hằng số vẫn **sót ở dòng 2** ⇒ test **VẪN XANH**
 * (nghiệm thu âm THẤT BẠI) ⇒ ⭐ phải khớp **TRỌN VẸN BIỂU THỨC LỌC 2 DÒNG** (khai báo + vế `||` liền nhau)
 * ⇒ xoá/nắn một nửa nào cũng **ĐỎ** ✓.
 */
const RENDER_FILTER = new RegExp(
  'const kept = entries\\.filter\\(\\(entry\\) => entry\\.kind !== "module"\\s*\\n\\s*'
  + '\\|\\| !MATRIX_HIDDEN_MODULE_KEYS\\.includes\\(entry\\.module\\?\\.key \\?\\? String\\(entry\\.key\\)\\.replace\\(\\/\\^module:\\/, ""\\)\\)\\)',
);

test("T15 — danh sách ẩn vẫn giữ ĐỦ 4 khoá CŨ (⛔ không ai được xoá khỏi danh sách ẩn)", () => {
  assert.match(matrix, /export const MATRIX_HIDDEN_MODULE_KEYS: string\[\] = \[/,
    "`MATRIX_HIDDEN_MODULE_KEYS` phải được khai báo trong `PermissionMatrix.tsx` (nguồn duy nhất)");
  for (const key of HIDDEN_4) {
    assert.ok(matrix.includes(`"${key}"`), `danh sách ẩn phải còn khoá \`${key}\``);
  }
});

test("T15 — `PermissionMatrix` lọc 4 khoá CŨ Ở TẦNG VẼ (màn ma trận lớn)", () => {
  assert.match(matrix, /const visibleEntries = \(\(\) => \{/,
    "`PermissionMatrix` phải dựng `visibleEntries` (tập để VẼ)");
  assert.match(matrix, RENDER_FILTER,
    "`PermissionMatrix` phải LỌC 4 khoá ẩn khỏi tập VẼ");
});

test("T15 — ⭐ `PermissionAccessPanel` CŨNG lọc 4 khoá CŨ Ở TẦNG VẼ (đúng chỗ `BUG-20261009-D31`)", () => {
  assert.match(panel, RENDER_FILTER,
    "`PermissionAccessPanel` (tab «Phân quyền công việc / Chức năng») phải LỌC 4 khoá ẩn khỏi tập VẼ — " +
    "⚠️ thiếu chỗ này chính là bug D31: tab đó vẫn hiện «CÔNG VIỆC · Phòng Kế hoạch / Phòng Dự án»");
  assert.match(panel, /\{\(\(\) => \{[\s\S]{0,4000}?MATRIX_HIDDEN_MODULE_KEYS[\s\S]{0,4000}?\}\)\(\)\.map\(\(entry\) => \{/,
    "tập VẼ phải là IIFE đã lọc rồi mới `.map(...)` (⛔ KHÔNG vẽ thẳng `entries`)");
  assert.doesNotMatch(panel, /\{entries\.map\(\(entry\) => \{/,
    "⛔ CẤM vẽ thẳng `entries` — đó là dòng đã gây bug D31");
});

test("T15 — ⭐ BẢO VỆ PAYLOAD: `entries` GỐC ⛔ KHÔNG bị lọc (chống mất quyền âm thầm `BUG-D19`)", () => {
  assert.match(panel, /permissionMatrixKeys\(data, entries\)/,
    "tập khoá GỬI LÊN phải suy từ `entries` GỐC (đầy đủ)");
  assert.doesNotMatch(panel, /permissionMatrixKeys\(data, kept\)/,
    "⛔ CẤM truyền tập đã lọc (`kept`) vào payload — sẽ XOÁ quyền của 4 khoá ẩn (FULL-REPLACE)");
  assert.doesNotMatch(panel, /const entries = entries\.filter|entries = entries\.filter/,
    "⛔ CẤM gán đè `entries` bằng bản đã lọc");
});

test("T15 — ⭐ BẢO VỆ PAYLOAD: `permissionMenuStructure` ⛔ KHÔNG lọc 4 khoá ẩn (nguồn của payload)", () => {
  const def = page.indexOf("function permissionMenuStructure(data: AppData) {");
  assert.ok(def > 0, "phải tìm thấy `permissionMenuStructure` trong `app/page.tsx`");
  const body = page.slice(def, def + 2500);
  assert.match(body, /configuredModules\(data\)\.filter\(\(item\)=>item\.key!=="admin"\)/,
    "`moduleRows` chỉ được loại khoá `admin` (như thiết kế hiện tại)");
  assert.ok(!body.includes("MATRIX_HIDDEN_MODULE_KEYS"),
    "⛔ CẤM lọc `MATRIX_HIDDEN_MODULE_KEYS` trong `permissionMenuStructure`: hàm này cấp `entries` cho " +
    "`permissionMatrixKeys` ⇒ lọc ở đây làm PAYLOAD teo ⇒ MẤT QUYỀN ÂM THẦM (đúng `BUG-D19`). " +
    "Chỗ đúng để lọc là TẦNG VẼ trong 2 component ở trên.");
});

test("T15 — 2 nút HÀNG LOẠT vẫn loại 4 khoá ẩn (⛔ không ghi 0 cho khoá không còn ô nào)", () => {
  assert.match(panel, /const bulkKeys = moduleKeys\.filter\(\(key\) => !MATRIX_HIDDEN_MODULE_KEYS\.includes\(key\)\)/,
    "`bulkKeys` phải loại 4 khoá ẩn (nếu không, «Bỏ chọn tất cả» sẽ ghi 0 ⇒ mất quyền âm thầm)");
});
