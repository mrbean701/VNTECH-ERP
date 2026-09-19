// PHASE 7 (`AD-11`) — HỢP ĐỒNG AUDIT: «2 SUB-TAB PROJECT & WAREHOUSE SCOPE».
// Nguyên văn `docs/25_TODO_ROADMAP.md` dòng `AD-11`: «Audit 2 sub-tab Project & Warehouse scope»
// (module «Phạm vi», UI=FIX, QUYỀN=CHECK). Đây là mục AUDIT ⇒ phải kết luận CONFIRMED/LIKELY/UNKNOWN kèm bằng chứng.
//
// BẰNG CHỨNG ĐỌC ĐƯỢC (test tự xác minh, không tin lời kể):
//   • Màn Quản trị bước 8 KHÔNG có 2 sub-tab: chỉ có 1 danh sách dự án + 1 bảng gộp «Phạm vi dự án & kho».
//   • Cặp phạm vi ĐỘC LẬP nằm trong `UserAccessModal`: mục «1. Phạm vi dự án» và «2. Phạm vi kho bắt buộc»,
//     với cổng quyền riêng cho từng loại (`isWarehouseRole`, `warehouseScopeKind`).
// ⇒ Kết luận đúng phải là: tiền đề «2 sub-tab» KHÔNG đúng nguyên văn ở bước 8; cặp phạm vi thật nằm ở modal phân quyền.
//
// Chạy riêng:  node --test tests/ad11-scope-audit.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const root = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");
const page = read("app/page.tsx");
const DOC = "docs/agent-progress/AD-11-PHAM-VI-DU-AN-KHO-AUDIT.md";

function step8Block() {
  const start = page.indexOf("{step===8&&");
  const end = page.indexOf("{step===9&&", start);
  assert.ok(start > 0 && end > start, "Không tìm thấy nhánh `step===8` (Phạm vi dự án & kho)");
  return page.slice(start, end);
}
function accessModalBlock() {
  const start = page.indexOf("function UserAccessModal(");
  const end = page.indexOf("function canonicalRoleOptions", start);
  assert.ok(start > 0 && end > start, "Không tìm thấy `UserAccessModal`");
  return page.slice(start, end);
}

test("AD-11 — TIỀN ĐỀ ĐƯỢC ĐÍNH CHÍNH: bước 8 KHÔNG có 2 sub-tab, chỉ có 1 bảng gộp", () => {
  const block = step8Block();
  assert.match(block, /<CardHead title="Phạm vi dự án & kho"/, "Bước 8 phải có khối «Phạm vi dự án & kho»");
  assert.doesNotMatch(block, /ORG_SUB_TABS|POSITION_SUB_TABS|data-subtab=/, "Bước 8 KHÔNG có cơ chế sub-tab nào trong mã");
  // Cổng đối chứng: nếu bước 8 có sub-tab thì kết luận của tài liệu sẽ SAI.
  const subTabGate = (text) => /data-subtab=|SUB_TABS\.map\(/.test(text);
  assert.equal(subTabGate(block), false, "[đối chứng âm] nếu bước 8 có sub-tab ⇒ phải sửa lại kết luận tài liệu");
  assert.equal(subTabGate("<div data-subtab=\"x\"/>"), true, "cổng phải thực sự phát hiện được sub-tab");
});

test("AD-11 — CẶP PHẠM VI THẬT nằm trong `UserAccessModal`: dự án (1) và kho (2) kiểm độc lập", () => {
  const block = accessModalBlock();
  assert.match(block, /1\. Phạm vi dự án/, "Modal phân quyền phải có mục «1. Phạm vi dự án»");
  assert.match(block, /2\. Phạm vi kho bắt buộc/, "Modal phân quyền phải có mục «2. Phạm vi kho bắt buộc»");
  assert.match(block, /isWarehouseRole/, "Phạm vi kho phải có cổng theo loại vai trò kho");
  assert.match(block, /warehouseScopeKind/, "Phạm vi kho phải phân biệt Kho Tổng / kho dự án bằng `warehouse_scope_kind`");
  assert.match(block, /projectScopes/, "Phải ghi phạm vi DỰ ÁN vào `user_project_scopes`");
  assert.match(block, /warehouseScopes/, "Phải ghi phạm vi KHO vào `user_warehouse_scopes`");
  assert.match(block, /save_user_access/, "Hai phạm vi phải được lưu qua action thật `save_user_access`");
});

test("AD-11 — TÀI LIỆU audit: verdict + đính chính tiền đề + bằng chứng + hệ quả roadmap", () => {
  assert.ok(existsSync(new URL(DOC, root)), `Thiếu tài liệu audit bắt buộc ${DOC}`);
  const text = readFileSync(new URL(DOC, root), "utf8");
  assert.match(text, /CONFIRMED|LIKELY|UNKNOWN/, "Phải có kết luận phân loại");
  assert.match(text, /UserAccessModal/, "Phải nêu vị trí THẬT của cặp phạm vi");
  assert.match(text, /sub-tab/i, "Phải nói rõ về tiền đề «2 sub-tab»");
  assert.match(text, /app\/page\.tsx/, "Phải trích dẫn tệp bằng chứng");
  assert.match(text, /(không ảnh hưởng|backlog|roadmap)/i, "Phải nêu hệ quả với roadmap");
});
