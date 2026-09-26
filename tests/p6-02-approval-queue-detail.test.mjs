// MT2-P6-02 (§4.2) — HỢP ĐỒNG: DANH SÁCH PHIẾU CHỜ DUYỆT → PHIẾU ĐANG XỬ LÝ → nút «Chi tiết» → MODAL.
// Nguyên văn §4.2: «Click một phiếu ⇒ chuyển sang khu vực “Phiếu đang xử lý” — ⛔ không mở detail ngay.
//                  Trong bảng Phiếu đang xử lý phải có nút “Chi tiết” ⇒ mở modal.»
// RED trước khi sửa: dòng hàng đợi đang gọi `open("detail", row)` (mở modal NGAY) và nút trong khu vực
// xử lý mang nhãn «XEM / TẢI PHIẾU» (⛔ không phải «Chi tiết»).
// Chạy: node --import tsx --test tests/p6-02-approval-queue-detail.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const queue = page.slice(page.indexOf("approval-queue-list"), page.indexOf("queue-pagination functional-summary"));
const pane = page.slice(page.indexOf("approval-detail-pane"), page.indexOf("approval-actions") + 2000);

test("P6-02 — click dòng hàng đợi CHỈ chuyển khu vực «Phiếu đang xử lý», ⛔ KHÔNG mở modal ngay", () => {
  assert.ok(queue.length > 0, "phải tìm được khối DANH SÁCH PHIẾU CHỜ DUYỆT");
  assert.doesNotMatch(queue, /open\("detail"/, "⛔ §4.2: click phiếu KHÔNG được mở detail ngay");
  assert.match(queue, /onClick=\{\(\)=>setSelectedId\(String\(row\.id\)\)\}/,
    "click phải chỉ CHỌN phiếu trong khu vực «Phiếu đang xử lý»");
});

test("P6-02 — khu vực «Phiếu đang xử lý» có nút «Chi tiết» MỞ MODAL", () => {
  assert.ok(pane.length > 0, "phải tìm được khối PHIẾU ĐANG XỬ LÝ");
  assert.match(pane, /<button[^>]*onClick=\{\(\)=>open\("detail",selected\)\}>[^<]*CHI TIẾT/,
    "phải có nút «CHI TIẾT» mở modal chi tiết phiếu (§4.2)");
});
