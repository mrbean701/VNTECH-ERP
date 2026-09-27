// MT3-UI-01 — HỢP ĐỒNG: thành phần toolbar dùng chung đúng THỨ TỰ chuẩn của MT3 §IV.4.
//
// MT3 §IV.4 yêu cầu thứ tự trên toolbar:
//   Tạo mới → Sửa → Xóa/ngừng sử dụng → Tìm kiếm → Sắp xếp → Bộ lọc → Chọn phạm vi → Xuất Excel → thao tác phụ
// Ngoài ra §IV.2: ⛔ KHÔNG được để toolbar thành CỘT DỌC lệch bên phải ở màn nhỏ.
//
// ⚠️ Phạm vi của test này: xác nhận CẤU TRÚC component dùng chung (một sửa ⇒ áp dụng cho MỌI màn đang
//    dùng `ListToolbar`). ⛔ Xác nhận BỐ CỤC RENDER THẬT (toạ độ X, số hàng) là việc của
//    `tools/probe-toolbar-order.mjs` (đo bằng Chrome headless) + ảnh chuẩn ở task P3-UI-17.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const toolbar = read("app/components/ui/ListToolbar.tsx");
const css = read("app/styles/canonical.css");

test("MT3-UI-01 — toolbar có NHÓM hành động chính và NHÓM hành động phụ (Tạo/Sửa/Xóa … Xuất Excel)", () => {
  assert.match(toolbar, /actions\?: ReactNode/, "phải nhận nhóm hành động chính (Tạo · Sửa · Xóa)");
  assert.match(toolbar, /secondaryActions\?: ReactNode/, "phải nhận nhóm hành động phụ (Xuất Excel · thao tác phụ)");
  assert.match(toolbar, /list-toolbar-primary/, "nhóm chính phải có lớp riêng để đo/kiểm thứ tự");
  assert.match(toolbar, /list-toolbar-secondary/, "nhóm phụ phải có lớp riêng");
});

test("MT3-UI-01 — THỨ TỰ render: hành động chính TRƯỚC bộ điều khiển; hành động phụ SAU", () => {
  const iPrimary = toolbar.indexOf("list-toolbar-primary");
  const iControls = toolbar.indexOf("list-toolbar-controls");
  const iSecondary = toolbar.indexOf("list-toolbar-secondary");
  assert.ok(iPrimary > -1 && iControls > -1 && iSecondary > -1, "phải có đủ 3 vùng");
  assert.ok(iPrimary < iControls, "§IV.4: [Tạo · Sửa · Xóa] phải đứng TRƯỚC Tìm/Sắp xếp/Lọc");
  assert.ok(iSecondary > iControls, "§IV.4: [Xuất Excel · thao tác phụ] phải ở CUỐI");
});

test("MT3-UI-01 — trong vùng điều khiển: Tìm kiếm → Sắp xếp → Bộ lọc → extra", () => {
  const block = toolbar.slice(toolbar.indexOf("list-toolbar-controls"));
  const iSearch = block.indexOf("list-toolbar-search");
  const iSort = block.indexOf("list-toolbar-sort");
  const iFilters = block.indexOf("(filters || []).map");
  assert.ok(iSearch > -1 && iSort > -1 && iFilters > -1, "phải có đủ Tìm · Sắp xếp · Lọc");
  assert.ok(iSearch < iSort, "§IV.4: Tìm kiếm TRƯỚC Sắp xếp");
  assert.ok(iSort < iFilters, "§IV.4: Sắp xếp TRƯỚC Bộ lọc");
});

test("MT3-UI-01 — ⛔ không làm 2 nhóm hành động thành CỘT DỌC (MT3 §IV.2)", () => {
  assert.match(css, /\.list-toolbar-primary\s*\{[^}]*flex-wrap:\s*wrap/, "nhóm chính phải WRAP theo hàng, không xếp dọc cứng");
  assert.match(css, /\.list-toolbar-secondary\s*\{[^}]*flex-wrap:\s*wrap/, "nhóm phụ phải WRAP theo hàng");
  assert.doesNotMatch(css, /\.list-toolbar-primary\s*\{[^}]*flex-direction:\s*column/, "⛔ không được ép nhóm chính thành cột dọc");
  assert.doesNotMatch(css, /\.list-toolbar-secondary\s*\{[^}]*flex-direction:\s*column/, "⛔ không được ép nhóm phụ thành cột dọc");
});

test("MT3-UI-01 — tương thích ngược: mọi nơi gọi cũ chỉ truyền `actions` vẫn hợp lệ", () => {
  // `actions` và `secondaryActions` đều tuỳ chọn ⇒ không phá 56 nơi dùng sẵn (GOAL §40 dependency).
  assert.match(toolbar, /actions\?: ReactNode;?\s*\n/, "`actions` phải là tuỳ chọn (không bắt buộc)");
  assert.match(toolbar, /secondaryActions\?: ReactNode;?\s*\n/, "`secondaryActions` phải là tuỳ chọn");
  // Nhóm phụ phải chỉ render khi có nội dung (⛔ không sinh vùng rỗng làm lệch bố cục).
  assert.match(toolbar, /\{secondaryActions && <div className="row-actions list-toolbar-secondary">/, "chỉ render nhóm phụ khi CÓ nội dung");
});
