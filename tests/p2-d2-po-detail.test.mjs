// PHASE 2 (§21) — HỢP ĐỒNG «MÀN CHI TIẾT PO» (4 PHẦN BẮT BUỘC).
//
// Bốn phần §21 phải có, đo được bằng dấu `data-vntech`:
//   1. Source PR        → `po-source-pr`   (PO mồ côi `request_id = NULL` phải hiện RÕ, KHÔNG giấu)
//   2. Ordered/Received/Remaining → `po-summary-table` (đọc `purchase_order_items.ordered_qty`…)
//   3. Danh sách GRN    → `po-grn-list`    (GRN rỗng dòng BẮT BUỘC có cảnh báo)
//   4. Timeline         → `po-timeline`    (TÁI DÙNG `ActivityTimeline` của `app/components/ui`, không viết mới)
//
// Đo ở HAI tầng: (a) hàm thuần `lib/p2-po-trace.ts` với DỮ LIỆU THẬT; (b) nguồn `PurchaseOrderDrawer.tsx`.
//
// ⚠️ TÊN TRƯỜNG ĐÃ ĐO (không đoán): `receiptId` (KHÔNG có `goods_receipt_id`/`goodsReceiptId` trên payload) ·
//    `purchaseOrderId` · `orderedQty`/`receivedQty`/`closedQty`/`remainingQty` · `itemCount`.
//
// Chạy riêng:  node --import tsx --test tests/p2-d2-po-detail.test.mjs
// (tệp CỐ Ý không nằm trong `package.json` → `test:regression` giữ nguyên 69 ca)
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isEmptyReceipt, numeric, purchaseOrderTimeline, quantityAudit, receiptItemCount, receiptsForPurchaseOrder } from "../lib/p2-po-trace.ts";

const read = (relative) => readFileSync(new URL("../" + relative, import.meta.url), "utf8");
const source = read("app/screens/PurchaseOrderDrawer.tsx");
const timelineUi = read("app/components/ui/Timeline.tsx");
const page = read("app/page.tsx");

// ── DỮ LIỆU THẬT (PO-0011: `request_id = NULL`, 2 GRN — đúng bản ghi mồ côi đã đo trên MySQL) ────────
const ORPHAN = { id: "PO-0011", poNo: "PO-PRJ-DEMO-01-2026-0011", requestId: null, requestNo: null, projectCode: "PRJ-DEMO-01", supplierName: "NCC MỒ CÔI", status: "completed", orderedQty: 100, receivedQty: 100, closedQty: 0, actualDeliveredQty: 100, orderedAt: "2026-01-05T02:00:00.000Z", eta: "2026-02-01", deliveryQueuedAt: "2026-01-06T02:00:00.000Z", deliveryCompletedAt: "2026-02-03T02:00:00.000Z" };
const PO = { id: "PO-0005", poNo: "PO-PRJ-DEMO-01-2026-0005", requestId: "MR-0007", requestNo: "MR-PRJ-DEMO-01-2026-0007", projectCode: "PRJ-DEMO-01", supplierName: "NCC A", status: "partial_delivery", orderedQty: 200, receivedQty: 120, closedQty: 0, actualDeliveredQty: 120, itemCount: 2, orderedAt: "2026-01-10T02:00:00.000Z", eta: "2026-02-20" };
const GRN_OK = { id: "GR1", receiptNo: "GRN-PRJ-2026-0001", purchaseOrderId: "PO-0005", receivedAt: "2026-01-20T02:00:00.000Z", itemCount: 2, actualDeliveredQty: 60, acceptedQty: 60, rejectedQty: 0, qcStatus: "accepted", bchConfirmationStatus: "confirmed", postingStatus: "posted" };
const GRN_EMPTY = { id: "GR2", receiptNo: "GRN-PRJ-2026-0002", purchaseOrderId: "PO-0005", receivedAt: "2026-01-28T02:00:00.000Z", itemCount: 0, actualDeliveredQty: 0, acceptedQty: 0, rejectedQty: 0, qcStatus: "accepted", bchConfirmationStatus: "pending", postingStatus: "blocked" };
const DATA = { receipts: [GRN_OK, GRN_EMPTY] };

// ── Cắt khối nguồn theo dấu `data-vntech` để mỗi khẳng định chỉ soi ĐÚNG phần của nó ────────────────
const block = (marker, nextMarker) => {
  const start = source.indexOf(`data-vntech="${marker}"`);
  assert.ok(start > 0, `PurchaseOrderDrawer.tsx THIẾU khối §21 \`data-vntech="${marker}"\``);
  const end = nextMarker ? source.indexOf(`data-vntech="${nextMarker}"`, start) : source.length;
  assert.ok(!nextMarker || end > start, `Không cắt được khối \`${marker}\` (thiếu mốc kết thúc \`${nextMarker}\`)`);
  return source.slice(start, end);
};

test("§21.1 — Source PR: PO có `requestId` hiện mã phiếu; PO MỒ CÔI (`request_id = NULL`) hiện RÕ, KHÔNG giấu", () => {
  const sourcePr = block("po-source-pr", "po-summary-table");
  assert.match(sourcePr, /Nguồn PR \(phiếu đề nghị\)/, "Thiếu phần 1 «Source PR»");
  assert.match(sourcePr, /purchaseOrder\.requestNo/, "Phải hiện `requestNo` (LEFT JOIN `material_requests.request_no`)");
  assert.match(sourcePr, /purchaseOrder\.requestId/, "Phải kiểm `requestId` thật của payload (từ `purchase_orders.request_id`)");
  assert.match(sourcePr, /PO mồ côi — không truy được PR/, "PO mồ côi BẮT BUỘC hiện nguyên văn «PO mồ côi — không truy được PR»");
  assert.match(sourcePr, /data-vntech="po-source-pr-orphan"/, "Thiếu dấu đo được cho nhánh mồ côi");
  assert.match(source, /\{orphan\?/, "Nhánh mồ côi phải rẽ bằng biến `orphan` đã tính từ `isOrphanPurchaseOrder(purchaseOrder)`, không hard-code chuỗi rỗng");
  assert.match(source, /const orphan = isOrphanPurchaseOrder\(purchaseOrder\);/, "Biến `orphan` phải lấy từ `isOrphanPurchaseOrder(purchaseOrder)`");
});

test("§21.2 — Ordered / Received / Remaining tính từ dữ liệu THẬT và có nhánh «chưa có nguồn» + lý do", () => {
  const summary = block("po-summary-table", "po-grn-list");
  assert.match(summary, /Đã đặt/, "Thiếu cột «Đã đặt» (ordered)");
  assert.match(summary, /Đã nhận/, "Thiếu cột «Đã nhận» (received)");
  assert.match(summary, /Còn lại/, "Thiếu cột «Còn lại» (remaining)");
  assert.match(summary, /audit\.hasData/, "Phải rẽ nhánh theo `audit.hasData` (thiếu nguồn ⇒ KHÔNG bịa số)");
  assert.match(summary, /chưa có nguồn/, "Thiếu nguồn ⇒ BẮT BUỘC hiện «chưa có nguồn»");
  assert.match(summary, /audit\.reason/, "Thiếu nguồn ⇒ BẮT BUỘC kèm LÝ DO");
  assert.match(source, /const audit = quantityAudit\(purchaseOrder\);/, "Số lượng phải lấy từ hàm thuần dùng chung `quantityAudit(purchaseOrder)`, không tự cộng trong JSX");

  // Tầng hàm thuần — dữ liệu thật:
  const audit = quantityAudit(PO);
  assert.deepEqual({ ordered: audit.ordered, received: audit.received, remaining: audit.remaining, source: audit.source }, { ordered: 200, received: 120, remaining: 80, source: "po_header" }, "PO 200/120 phải còn 80, lấy từ tổng hợp ĐẦU PO");
  assert.equal(audit.delivered, 120, "`actualDeliveredQty` (tổng `goods_receipt_items.received_qty`) phải được đọc riêng");
  const noSource = quantityAudit({ id: "PO-X" });
  assert.equal(noSource.hasData, false, "PO không có số lượng trong payload ⇒ `hasData = false`");
  assert.ok(noSource.reason.length > 10, "Thiếu nguồn ⇒ phải có LÝ DO để hiện lên UI");
});

test("§21.3 — danh sách GRN của PO: mã · ngày · trạng thái · SỐ DÒNG, và GRN RỖNG DÒNG phải có CẢNH BÁO", () => {
  const grnList = block("po-grn-list", "po-timeline");
  assert.match(grnList, /Danh sách GRN của đơn mua này/, "Thiếu phần 3 «danh sách GRN»");
  assert.match(grnList, /receiptsForPurchaseOrder\(data, purchaseOrder\.id\)/, "GRN phải lọc theo `goods_receipts.purchase_order_id` qua `receiptsForPurchaseOrder`");
  assert.match(grnList, /SỐ DÒNG|Số dòng/, "Thiếu cột số dòng GRN");
  assert.match(grnList, /isEmptyReceipt\(/, "Thiếu kiểm GRN rỗng dòng");
  assert.match(grnList, /data-vntech="po-grn-empty-warning"/, "GRN rỗng dòng THIẾU cảnh báo đo được");
  assert.match(grnList, /inline-alert danger/, "Cảnh báo GRN rỗng dòng phải là cảnh báo đỏ (`inline-alert danger`)");
  assert.match(grnList, /format\.format\(numeric\(receipt\.actualDeliveredQty\)\)/, "Số lượng thực giao phải đọc `actualDeliveredQty` đúng tên trường");

  // Tầng hàm thuần — đúng 2 GRN của PO-0005, GRN thứ 2 RỖNG DÒNG (10/16 GRN thật đang rỗng):
  const receipts = receiptsForPurchaseOrder(DATA, PO.id);
  assert.deepEqual(receipts.map((row) => row.receiptNo), ["GRN-PRJ-2026-0001", "GRN-PRJ-2026-0002"], "Phải lấy đúng GRN theo `purchaseOrderId`");
  assert.equal(receiptItemCount(receipts[0]), 2, "GRN có 2 dòng (từ `COUNT(goods_receipt_items.receipt_id)`)");
  assert.equal(isEmptyReceipt(receipts[0]), false, "GRN có dòng ⇒ KHÔNG cảnh báo");
  assert.equal(isEmptyReceipt(receipts[1]), true, "GRN 0 dòng ⇒ BẮT BUỘC cảnh báo");
  assert.equal(isEmptyReceipt(undefined), false, "GRN không tồn tại ⇒ không dựng cảnh báo giả");

  // Không được dùng tên trường SAI trên bảng `goods_receipt_items`.
  assert.doesNotMatch(source, /goodsReceiptId|goods_receipt_id/, "KHÔNG được dùng `goodsReceiptId`/`goods_receipt_id` (cột thật là `goods_receipt_items.receipt_id`)");
});

test("§21.4 — Timeline: TÁI DÙNG dải thời gian dùng chung, chỉ dựng từ mốc THẬT của payload", () => {
  const timeline = block("po-timeline");
  assert.match(timeline, /<ActivityTimeline/, "Phải tái dùng `ActivityTimeline` (dải hoạt động dùng chung)");
  assert.match(timeline, /purchaseOrderTimeline\(purchaseOrder, receiptsForPurchaseOrder\(data, purchaseOrder\.id\)\)/, "Sự kiện timeline phải dựng bằng `purchaseOrderTimeline` từ dữ liệu THẬT");
  assert.match(page, /import \{ PurchaseOrderDrawer \} from "@\/app\/screens\/PurchaseOrderDrawer"/, "page.tsx chưa import màn chi tiết PO");
  assert.match(source, /from "@\/app\/components\/ui"/, "Dải thời gian phải lấy từ thư viện dùng chung `@/app/components/ui`");
  assert.match(timelineUi, /export function ActivityTimeline/, "`app/components/ui/Timeline.tsx` phải có `ActivityTimeline` (§21 cho phép tái dùng, không viết mới)");

  // Tầng hàm thuần: mốc THẬT ⇒ có sự kiện; PO KHÔNG mốc nào ⇒ mảng rỗng (UI hiện «chưa có nguồn»).
  const events = purchaseOrderTimeline(PO, receiptsForPurchaseOrder(DATA, PO.id));
  assert.ok(events.some((row) => row.action === "Phát hành PO"), "Thiếu mốc «Phát hành PO» (`orderedAt`)");
  assert.equal(events.filter((row) => /Chuyến giao/.test(row.action)).length, 2, "Mỗi GRN phải thành MỘT mốc thời gian");
  assert.deepEqual(purchaseOrderTimeline({ id: "PO-Z" }, []), [], "PO không có mốc thời gian ⇒ mảng RỖNG (không bịa sự kiện)");
});

test("§21 — tầng màn hình: 4 phần theo ĐÚNG thứ tự + cổng mở/đóng và truy vết ngược về PO con của §20", () => {
  const order = ["po-source-pr", "po-summary-table", "po-grn-list", "po-timeline"].map((marker) => source.indexOf(`data-vntech="${marker}"`));
  assert.ok(order.every((index) => index > 0), "Thiếu một trong 4 phần bắt buộc của §21");
  assert.deepEqual([...order].sort((a, b) => a - b), order, "4 phần phải theo ĐÚNG thứ tự §21: Source PR → Ordered/Received/Remaining → GRN → Timeline");
  assert.match(source, /EntityDetailModal/, "Màn chi tiết PO phải dùng khung chi tiết thực thể dùng chung");
  assert.match(source, /function PurchaseOrderDrawer\(\{ data, purchaseOrder, close, open \}/, "Chữ ký component phải nhận đúng `{ data, purchaseOrder, close, open }`");
  assert.match(page, /\{selected && modal === "poDetail" && <PurchaseOrderDrawer data=\{data\} purchaseOrder=\{selected\} close=\{\(\) => setModal\(null\)\} open=\{open\} \/>\}/, "page.tsx chưa nối modal `poDetail` vào màn chi tiết PO");
  assert.equal(numeric(0), 0, "`numeric` phải an toàn với 0");
});

test("§21 — màn Mua hàng cũng mở được chi tiết PO (truy vết xuôi PO → GRN → PO của §21)", () => {
  const purchasing = read("app/screens/Purchasing.tsx");
  assert.match(purchasing, /data-vntech="purchasing-pos"/, "Màn Mua hàng thiếu danh sách PO để mở chi tiết");
  assert.match(purchasing, /data-vntech="purchasing-po-open"/, "Thiếu nút mở chi tiết PO trên màn Mua hàng");
  assert.match(purchasing, /onClick=\{\(\)=>open\("poDetail",po\)\}/, 'Nút mở chi tiết phải gọi `open("poDetail", po)`');
  assert.match(purchasing, /deliveryProgress\(po\)/, "Số liệu phải lấy từ `deliveryProgress` (hàm thuần dùng chung), KHÔNG tự cộng trong JSX");
  assert.match(purchasing, /chưa có nguồn — \{progress\.audit\.reason\}/, "Thiếu nguồn ⇒ hiện «chưa có nguồn» + LÝ DO");
});
