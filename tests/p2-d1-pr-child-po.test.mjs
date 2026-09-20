// PHASE 2 (§20) — HỢP ĐỒNG «KHỐI PO CON TRONG CHI TIẾT PHIẾU ĐỀ NGHỊ».
//
// Đo ở HAI tầng (vì lượt này BỊ CẤM build/khởi động dịch vụ — bằng chứng DOM chỉ có nghĩa sau khi build):
//   1) TẦNG HÀM THUẦN: import TRỰC TIẾP `lib/p2-po-trace.ts` và đo hành vi lọc PO con bằng DỮ LIỆU THẬT
//      hình dạng payload (`requestId`, `receiptId`, `orderedQty`…). Đây là phần "chạy được", không chỉ đọc chữ.
//   2) TẦNG NGUỒN: khẳng định `RequestDrawer.tsx` CÓ khối PO con, CÓ nhánh «Chưa có PO nào», CÓ nhánh
//      «chưa có nguồn» + lý do, và mỗi dòng PO BẤM ĐƯỢC sang màn chi tiết PO.
//
// ⚠️ TÊN TRƯỜNG ĐÃ ĐO (không đoán): `requestId` (từ `purchase_orders.request_id`) · `orderedQty`/`receivedQty`/
//    `closedQty` (từ `purchase_order_items.*_qty`) · `itemCount` (từ `COUNT(goods_receipt_items.receipt_id)`).
//    Trường SAI thường bị đoán: `goodsReceiptId` (không tồn tại) — tệp này CHẶN nó.
//
// Chạy riêng:  node --import tsx --test tests/p2-d1-pr-child-po.test.mjs
// (tệp CỐ Ý không nằm trong `package.json` → `test:regression` giữ nguyên 69 ca)
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  childPurchaseOrdersFor,
  deliveryProgress,
  hasField,
  isOrphanPurchaseOrder,
  numeric,
  quantityAudit,
  receiptItemCount,
  receiptsForPurchaseOrder,
} from "../lib/p2-po-trace.ts";

const read = (relative) => readFileSync(new URL("../" + relative, import.meta.url), "utf8");
const drawer = read("app/screens/RequestDrawer.tsx");
const page = read("app/page.tsx");

// ── DỮ LIỆU THẬT (hình dạng payload bootstrap đã đo ở `scripts/system-route.mjs:653-668`) ──────────
const PR = { id: "MR-0001", requestNo: "MR-PRJ-2026-0001", status: "approved", supplyStatus: "partial_delivery" };
const ORPHAN = { id: "PO-0011", poNo: "PO-PRJ-DEMO-01-2026-0011", requestId: null, requestNo: null, status: "completed", orderedQty: 100, receivedQty: 100, actualDeliveredQty: 100, itemCount: 2 };
const PO_A = { id: "PO-0001", poNo: "PO-PRJ-2026-0001", requestId: "MR-0001", requestNo: "MR-PRJ-2026-0001", status: "waiting_delivery", supplierName: "NCC A", orderedQty: 100, receivedQty: 60, closedQty: 0, actualDeliveredQty: 60, itemCount: 3 };
const PO_B = { id: "PO-0002", poNo: "PO-PRJ-2026-0002", requestId: "MR-0001", requestNo: "MR-PRJ-2026-0001", status: "completed", supplierName: "NCC B", orderedQty: 40, receivedQty: 40, closedQty: 0, actualDeliveredQty: 40, itemCount: 0 };
const DATA = { purchaseOrders: [ORPHAN, PO_A, PO_B], receipts: [] };

// ── BẢNG CHỐT: khối PO con của §20 nằm TRONG chi tiết phiếu, giữa «Tổng quan phiếu» và «Dải phê duyệt» ──
const childPoBlock = () => {
  const start = drawer.indexOf('data-vntech="request-child-pos"');
  assert.ok(start > 0, 'RequestDrawer.tsx THIẾU khối PO con (`data-vntech="request-child-pos"`) của §20');
  const before = drawer.lastIndexOf('<section', start);
  const end = drawer.indexOf("Tiến trình phê duyệt", start);
  assert.ok(before > 0 && end > start, "Khối PO con phải nằm TRONG `drawer-body`, NGAY TRƯỚC dải phê duyệt");
  return drawer.slice(before, end);
};

test("§20 — lọc PO con ĐÚNG theo `requestId` (từ `purchase_orders.request_id`); PO mồ côi KHÔNG lọt vào", () => {
  const children = childPurchaseOrdersFor(DATA, PR.id);
  assert.deepEqual(children.map((row) => row.poNo), ["PO-PRJ-2026-0001", "PO-PRJ-2026-0002"], "Phải trả ĐÚNG các PO có `request_id` = PR đang xem");
  assert.ok(!children.some((row) => row.poNo === ORPHAN.poNo), "PO mồ côi (`request_id = NULL`) TUYỆT ĐỐI không được tính là PO con của PR");
  assert.equal(childPurchaseOrdersFor(DATA, "").length, 0, "PR không có mã ⇒ 0 PO con (không được trả về TOÀN BỘ PO)");
  assert.equal(childPurchaseOrdersFor({ purchaseOrders: [] }, PR.id).length, 0, "Không có PO nào ⇒ 0 dòng");
  assert.equal(childPurchaseOrdersFor(null, PR.id).length, 0, "Payload thiếu `purchaseOrders` ⇒ 0 dòng (không ném lỗi)");
  assert.equal(isOrphanPurchaseOrder(ORPHAN), true, "`requestId = null` phải nhận diện là PO mồ côi");
  assert.equal(isOrphanPurchaseOrder(PO_A), false, "PO có `requestId` KHÔNG phải mồ côi");
});

test("§20 — tiến độ nhận của từng PO con: ordered ↔ received ↔ remaining đọc từ trường THẬT của payload", () => {
  const partial = deliveryProgress(PO_A);
  assert.deepEqual({ source: partial.audit.source, ordered: partial.audit.ordered, received: partial.audit.received, remaining: partial.audit.remaining }, { source: "po_header", ordered: 100, received: 60, remaining: 40 }, "PO 100/60 phải còn 40 — không được lấy `remainingQty` của DÒNG làm số tổng");
  assert.equal(partial.complete, false, "Chưa nhận đủ ⇒ KHÔNG đánh dấu hoàn tất");
  const done = deliveryProgress(PO_B);
  assert.deepEqual({ ordered: done.audit.ordered, received: done.audit.received, remaining: done.audit.remaining }, { ordered: 40, received: 40, remaining: 0 }, "PO 40/40 phải còn 0");
  assert.equal(done.complete, true, "Đã nhận đủ ⇒ hoàn tất");
  // Nhánh KHÔNG có nguồn: payload thiếu cả `orderedQty`/`receivedQty` lẫn dòng PO ⇒ KHÔNG bịa số 0.
  const missing = quantityAudit({ id: "PO-X", poNo: "PO-X" });
  assert.equal(missing.hasData, false, "Thiếu nguồn số lượng ⇒ `hasData = false`");
  assert.ok(missing.reason.length > 10, "Thiếu nguồn ⇒ BẮT BUỘC kèm LÝ DO để hiện «chưa có nguồn»");
  assert.equal(hasField(PO_A, "orderedQty"), true, "PO thật CÓ `orderedQty`");
  assert.equal(hasField({ orderedQty: 0 }, "orderedQty"), true, "`orderedQty = 0` là CÓ nguồn (khác `undefined`)");
  assert.equal(numeric(undefined), 0, "`undefined` thành 0 nhưng KHÔNG được coi là có nguồn");
});

test("§20 — nguồn GRN của một PO con dùng ĐÚNG tên trường thật (`purchaseOrderId`), KHÔNG có `goodsReceiptId`", () => {
  const receipts = [{ id: "GR1", receiptNo: "GRN-1", purchaseOrderId: "PO-0001", itemCount: 3 }, { id: "GR2", receiptNo: "GRN-2", purchaseOrderId: "PO-0002", itemCount: 0 }];
  const found = receiptsForPurchaseOrder({ receipts }, "PO-0001");
  assert.deepEqual(found.map((row) => row.receiptNo), ["GRN-1"], "GRN phải lọc bằng `goods_receipts.purchase_order_id` ⇒ payload `purchaseOrderId`");
  assert.equal(receiptItemCount(found[0]), 3, "Số dòng GRN lấy từ `COUNT(goods_receipt_items.receipt_id)`)");
  assert.equal(receiptItemCount({ id: "GR9", purchaseOrderId: "PO-0001" }), 0, "GRN thiếu cả `itemCount` lẫn `items` ⇒ 0 dòng");
  // KHÔNG dùng định danh SAI `goodsReceiptId`; tên cột snake_case chỉ được XUẤT HIỆN trong ghi chú (có dấu backtick).
  assert.doesNotMatch(read("lib/p2-po-trace.ts"), /goodsReceiptId/, "KHÔNG được dùng tên trường SAI `goodsReceiptId` (cột thật là `goods_receipt_items.receipt_id`)");
  assert.doesNotMatch(drawer, /goodsReceiptId/, "RequestDrawer KHÔNG được dùng tên trường SAI `goodsReceiptId`");
  assert.doesNotMatch(read("lib/p2-po-trace.ts"), /[^`]goods_receipt_id[^`]/, "`goods_receipt_id` chỉ được nhắc trong ghi chú, không được dùng như trường dữ liệu");
});

test("§20 — RequestDrawer VẼ khối PO con: tiêu đề «Đơn mua (PO) sinh từ phiếu này» + mã PO + NCC + trạng thái + tiến độ nhận", () => {
  const block = childPoBlock();
  assert.match(block, /Đơn mua \(PO\) sinh từ phiếu này/, "Thiếu tiêu đề khối PO con của §20");
  assert.match(block, /Đã đặt|ordered/, "Thiếu cột «Đã đặt» (ordered)");
  assert.match(block, /Đã nhận|received/, "Thiếu cột «Đã nhận» (received)");
  assert.match(block, /Còn lại|remaining/, "Thiếu cột «Còn lại» (remaining)");
  assert.match(block, /supplierName/, "Thiếu nhà cung cấp của PO (`supplierName`)");
  assert.match(block, /statusLabel/, "Trạng thái PO phải đi qua `statusLabel` (nguồn nhãn dùng chung), không hard-code chuỗi trạng thái");
  // Mỗi dòng PO phải BẤM ĐƯỢC sang màn chi tiết PO (§21).
  assert.match(block, /data-vntech="child-po-open"/, "Thiếu nút mở màn chi tiết PO trên từng dòng PO con");
  assert.match(block, /onClick=\{\(\) => open\("poDetail", po\)\}/, 'Nút mở chi tiết PO phải gọi `open("poDetail", po)`');
});

test("§20 — nhánh «Chưa có PO nào» khi PR chưa có PO, và nhánh «chưa có nguồn» + LÝ DO khi thiếu dữ liệu", () => {
  const block = childPoBlock();
  assert.match(block, /Chưa có PO nào/, "PR chưa có PO ⇒ BẮT BUỘC hiện «Chưa có PO nào» (không hiện bảng rỗng vô nghĩa)");
  assert.match(block, /data-vntech="request-child-pos-empty"/, "Thiếu nhánh rỗng có đánh dấu đo được");
  assert.match(block, /chưa có nguồn/i, "Thiếu dữ liệu ⇒ phải hiện «chưa có nguồn», KHÔNG bịa số");
  assert.match(block, /reason/, "Nhánh «chưa có nguồn» phải kèm LÝ DO (`reason` từ `quantityAudit`)");
  // Không được hiện bảng PO rỗng vô nghĩa khi chưa có PO.
  assert.match(block, /!childPos\.length/, "Thiếu điều kiện `!childPos.length` để rẽ nhánh rỗng TRƯỚC khi vẽ bảng");
});

test("§20 — cổng nối vào màn chi tiết phiếu: `page.tsx` truyền `purchaseOrders` + `open` xuống RequestDrawer", () => {
  assert.match(page, /import \{ RequestDrawer \} from "@\/app\/screens\/RequestDrawer"/, "page.tsx phải giữ import RequestDrawer");
  assert.match(page, /<RequestDrawer variant="page" data=\{data\} request=\{selected\}[\s\S]{0,200}open=\{open\}/, "RequestDrawer chưa được truyền `open` ⇒ dòng PO con không bấm được");
  assert.match(drawer, /childPurchaseOrdersFor\(data, request\.id\)/, "RequestDrawer phải lọc PO con bằng `childPurchaseOrdersFor(data, request.id)` (từ `request.id` = `material_requests.id`)");
  assert.match(drawer, /import \{[^}]*childPurchaseOrdersFor[^}]*\} from "@\/lib\/p2-po-trace"/, "RequestDrawer chưa import hàm lọc PO con dùng chung");
});
