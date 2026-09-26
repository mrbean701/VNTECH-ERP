// MT2-P6-08 (§4.6) — HỢP ĐỒNG: MENU CHỈ CÓ 1 MỤC ⇒ mở TRỰC TIẾP màn hình, ⛔ KHÔNG lồng 2 cấp.
// Nguyên văn §4.6: «Menu chỉ có 1 item ⇒ click “Trung tâm phê duyệt” ⇒ mở trực tiếp màn hình,
//                  ⛔ không lồng “Trung tâm phê duyệt → Trung tâm phê duyệt”.»
// RED trước khi sửa: `app/page.tsx` dựng nhóm `approval_center` (tên «PHÊ DUYỆT») chứa ĐÚNG 1 mục con
// (`approvals` = «Trung tâm phê duyệt») ⇒ người dùng phải bấm 2 lần (mở nhóm rồi mới vào màn) = LỒNG 2 CẤP.
// Chạy: node --import tsx --test tests/p6-08-menu-single-item.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

test("P6-08 — nhóm menu CHỈ CÓ 1 MỤC được render TRỰC TIẾP (⛔ không bung nhóm rồi bấm tiếp)", () => {
  assert.match(page, /groupKey === approvalCenterGroup\.groupKey && group\.children\.length === 1/,
    "phải có nhánh xử lý riêng cho nhóm 1 mục (Trung tâm phê duyệt)");
  assert.match(page, /data-nav-single-group=\{groupKey\}/,
    "mục trực tiếp phải có marker DOM để ĐO được bằng probe");
  assert.match(page, /activateModule\(onlyChild\.key\)/,
    "click mục trực tiếp phải MỞ NGAY màn hình của mục con (1 lần bấm)");
});

test("P6-08 — mục trực tiếp KHÔNG còn bọc trong `.nav-tree-group` (⛔ không còn 2 cấp)", () => {
  // ⚠️ Mốc cắt phải nằm SAU nhánh: `const opened =` ở trên nhánh ⇒ dùng `nav-parent` (mở đầu khối `section`
  // của nhóm) làm mốc KẾT THÚC để vùng cắt đúng bằng nhánh mục trực tiếp.
  const from = page.indexOf("groupKey === approvalCenterGroup.groupKey && group.children.length === 1");
  // ⚠️ Mốc cắt = `return <section` (mở đầu khối nhóm thường NGAY SAU nhánh) — ⛔ KHÔNG dùng `nav-parent`
  // (xuất hiện BÊN TRONG khối section ⇒ vùng cắt sẽ lấn sang khối nhóm và báo lỗi giả).
  const to = page.indexOf("return <section", from);
  assert.ok(from > 0 && to > from, "phải tìm thấy nhánh render mục trực tiếp");
  const branch = page.slice(from, to);
  assert.match(branch, /data-nav-single-group=\{groupKey\}/, "nhánh phải có marker DOM của mục trực tiếp");
  assert.doesNotMatch(branch, /nav-tree-group/, "nhánh mục trực tiếp ⛔ KHÔNG được dựng `nav-tree-group`");
  assert.doesNotMatch(branch, /nav-children/, "nhánh mục trực tiếp ⛔ KHÔNG được dựng danh sách con");
});

test("P6-08 — có lớp CSS cho mục trực tiếp (dùng chung kiểu với mục Tổng quan điều hành)", () => {
  assert.match(css, /\.nav-single-direct/,
    "phải có lớp `.nav-single-direct` (kế thừa kiểu `.nav-dashboard-direct`)");
});
