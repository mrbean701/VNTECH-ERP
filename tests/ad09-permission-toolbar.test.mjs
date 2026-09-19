// PHASE 7 (`AD-09`) — HỢP ĐỒNG: CÂN ĐỐI LẠI TOOLBAR MÀN «PHÂN QUYỀN NGƯỜI DÙNG».
// Nguyên văn `docs/25_TODO_ROADMAP.md` dòng `AD-09`: «Cân đối lại toolbar phân quyền người dùng»
// (phụ thuộc `U-03` ✔ = khuôn `ListToolbar` §5: TIÊU ĐỀ + SỐ LƯỢNG ‖ TÌM · LỌC · SẮP XẾP · HÀNH ĐỘNG).
//
// Khuôn §5 đã chốt: toolbar PHẢI có đủ 4 phần (tiêu đề/số lượng · tìm kiếm · bộ lọc · hành động) và KHÔNG
// được tự dựng ô tìm kiếm thứ hai trong card (lệch khuôn).
//
// Chạy riêng:  node --test tests/ad09-permission-toolbar.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");
const page = read("app/page.tsx");
const toolbar = read("app/components/ui/ListToolbar.tsx");

function matrixBlock() {
  const start = page.indexOf("function UserPermissionMatrix(");
  const end = page.indexOf("/** Tab \"Cấp bậc hệ thống\"", start);
  assert.ok(start > 0 && end > start, "Không tìm thấy `UserPermissionMatrix` trong app/page.tsx");
  return page.slice(start, end);
}

/** Cổng §5 độc lập (đối chứng âm): đủ 4 phần mới ĐẠT. */
const toolbarGate = (block) =>
  /<ListToolbar/.test(block) && /title=/.test(block) && /search=\{\{/.test(block) &&
  /filters=\{\[/.test(block) && /actions=\{/.test(block);

test("AD-09 — toolbar màn «Phân quyền người dùng» có ĐỦ 4 phần theo khuôn §5", () => {
  const block = matrixBlock();
  assert.match(block, /<ListToolbar/, "Phải dùng `ListToolbar` dùng chung (U-03), không tự dựng toolbar");
  assert.match(block, /title="BỘ LỌC"/, "Toolbar phải có TIÊU ĐỀ");
  assert.match(block, /note=\{`\$\{rows\.length\}\/\$\{\(data\.users \|\| \[\]\)\.length\} tài khoản khớp`\}/,
    "Toolbar phải hiện SỐ LƯỢNG khớp/tổng (không chỉ tiêu đề)");
  assert.match(block, /search=\{\{ value: query/, "Toolbar phải có ô TÌM KIẾM nối vào state thật");
  assert.match(block, /filters=\{\[/, "Toolbar phải có BỘ LỌC");
  assert.match(block, /actions=\{/, "Toolbar phải có nhóm HÀNH ĐỘNG");
  // §5: hành động phải THẬT (bỏ lọc / xuất), không phải nút chết.
  assert.match(block, /setQuery\(""\)/, "Phải có hành động «Bỏ lọc» xoá state thật");
  assert.match(block, /data-permission-toolbar="AD-09"/, "Toolbar phải có dấu hiệu hợp đồng `AD-09`");
  assert.equal(toolbarGate(block), true, "Cổng §5 phải ĐẠT");
});

test("AD-09 — ĐỐI CHỨNG ÂM: toolbar thiếu phần ⇒ cổng §5 HỎNG; không còn ô tìm kiếm thứ hai trong card", () => {
  const block = matrixBlock();
  assert.equal(toolbarGate(block.replace(/filters=\{\[/, "")), false, "[đối chứng âm 1] thiếu BỘ LỌC phải bị bắt");
  assert.equal(toolbarGate(block.replace(/actions=\{/, "")), false, "[đối chứng âm 2] thiếu HÀNH ĐỘNG phải bị bắt");
  assert.equal(toolbarGate(block.replace(/search=\{\{/, "")), false, "[đối chứng âm 3] thiếu TÌM KIẾM phải bị bắt");
  // Lệch khuôn: card không được tự dựng lại ô tìm kiếm (đã có trong toolbar).
  const inputs = (block.match(/placeholder: "Tên, mã NV, chức danh…"/g) || []).length;
  assert.equal(inputs, 1, "Chỉ được có ĐÚNG 1 ô tìm kiếm (trong toolbar) — không lặp lại trong card");
});

test("AD-09 — `ListToolbar` dùng chung có đúng chữ ký 4 phần (nền của U-03)", () => {
  assert.match(toolbar, /export function ListToolbar\(/, "Thiếu `ListToolbar` dùng chung");
  for (const prop of ["title", "note", "search", "filters", "actions"]) {
    assert.ok(new RegExp(`${prop}[?]?:`).test(toolbar), `\`ListToolbar\` phải nhận prop \`${prop}\``);
  }
});
