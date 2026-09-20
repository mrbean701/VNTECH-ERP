// PHASE 2 (§21) — HỢP ĐỒNG «ĐỦ CHIỀU: GRN → PO» (chiều NGƯỢC của PO → GRN).
//
// VÌ SAO CÓ TỆP NÀY: §21 yêu cầu click-through «PO → GRN → PO» và giao diện đã có chiều XUÔI
// (`PurchaseOrderDrawer` → `data-vntech="po-grn-open"` mở `receiptDetail`) nhưng chiều NGƯỢC
// (`ReceiptDrawer` → mở PO nguồn) **CHƯA CÓ** ⇒ người dùng đang đứng ở phiếu nhập không quay
// lại được đơn mua nguồn. Tệp này khoá hành vi đó lại bằng dấu `data-vntech` đo được.
//
// Đo ở HAI tầng (lượt này BỊ CẤM build/khởi động dịch vụ ⇒ bằng chứng DOM chỉ có nghĩa sau khi build):
//   1) TẦNG HÀM THUẦN: `purchaseOrderForReceipt` trong `lib/p2-po-trace.ts`, chạy với DỮ LIỆU THẬT
//      hình dạng payload bootstrap.
//   2) TẦNG NGUỒN: `app/screens/ReceiptDrawer.tsx` + dây nối ở `app/page.tsx`.
//
// ⚠️ TÊN TRƯỜNG ĐÃ ĐO (không đoán): `goods_receipts.purchase_order_id` → payload `purchaseOrderId`;
//    PO được tra trong `data.purchaseOrders` theo `purchase_orders.id` → payload `id`.
//    Tên SAI thường bị đoán: `goodsReceiptId`/`goods_receipt_id` — tệp này CHẶN.
//
// Chạy riêng:  node --import tsx --test tests/p2-d3-grn-to-po.test.mjs
// (tệp CỐ Ý không nằm trong `package.json` → `test:regression` giữ nguyên 69 ca)
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { purchaseOrderForReceipt, receiptsForPurchaseOrder, rowKey } from "../lib/p2-po-trace.ts";

const read = (relative) => readFileSync(new URL("../" + relative, import.meta.url), "utf8");
const drawer = read("app/screens/ReceiptDrawer.tsx");
const poDrawer = read("app/screens/PurchaseOrderDrawer.tsx");
const page = read("app/page.tsx");

// ── DỮ LIỆU THẬT (hình dạng payload bootstrap) ───────────────────────────────────────────────────
const PO_SRC = { id: "PO-0005", poNo: "PO-PRJ-DEMO-01-2026-0005", requestId: "MR-0007", requestNo: "MR-PRJ-DEMO-01-2026-0007", projectCode: "PRJ-DEMO-01", supplierName: "NCC A", status: "partial_delivery", orderedQty: 200, receivedQty: 120, closedQty: 0 };
const PO_ORPHAN = { id: "PO-0011", poNo: "PO-PRJ-DEMO-01-2026-0011", requestId: null, requestNo: null, status: "completed", orderedQty: 100, receivedQty: 100 };
const GRN = { id: "GR1", receiptNo: "GRN-PRJ-2026-0001", purchaseOrderId: "PO-0005", projectId: "PRJ-DEMO-01", itemCount: 2 };
const DATA = { purchaseOrders: [PO_ORPHAN, PO_SRC], receipts: [GRN] };

/** Cắt khối nguồn theo dấu `data-vntech` để mỗi khẳng định chỉ soi ĐÚNG phần của nó. */
const block = (source, marker, nextMarker) => {
  const start = source.indexOf(`data-vntech="${marker}"`);
  assert.ok(start > 0, `THIẾU khối \`data-vntech="${marker}"\``);
  const end = nextMarker ? source.indexOf(`data-vntech="${nextMarker}"`, start) : source.length;
  assert.ok(!nextMarker || end > start, `Không cắt được khối \`${marker}\` (thiếu mốc kết thúc \`${nextMarker}\`)`);
  return source.slice(start, end);
};

test("§21 — tầng hàm thuần: tra PO nguồn từ GRN theo ĐÚNG `purchaseOrderId`, KHÔNG bịa khi thiếu nguồn", () => {
  assert.equal(typeof purchaseOrderForReceipt, "function", "`lib/p2-po-trace.ts` phải có `purchaseOrderForReceipt`");

  const found = purchaseOrderForReceipt(DATA, GRN);
  assert.ok(found, "GRN khai `purchaseOrderId` có trong payload ⇒ PHẢI tra được PO");
  assert.equal(found.id, "PO-0005", "Phải tra theo `purchase_orders.id` = `goods_receipts.purchase_order_id`");
  assert.equal(found.poNo, "PO-PRJ-DEMO-01-2026-0005", "Phải trả NGUYÊN bản ghi PO để mở lại màn chi tiết PO");

  // GRN KHÔNG khai PO (dữ liệu cũ) ⇒ KHÔNG được trả bừa một PO nào.
  assert.equal(purchaseOrderForReceipt(DATA, { id: "GR2", receiptNo: "GRN-X" }), null, "GRN không có `purchaseOrderId` ⇒ null (không bịa)");
  assert.equal(purchaseOrderForReceipt(DATA, { id: "GR3", purchaseOrderId: "" }), null, "`purchaseOrderId` rỗng ⇒ null");
  // GRN khai PO KHÔNG có trong payload (PO mồ côi / ngoài phạm vi dự án) ⇒ null, KHÔNG ghép sang PO khác.
  assert.equal(purchaseOrderForReceipt(DATA, { id: "GR4", purchaseOrderId: "PO-KHONG-CO" }), null, "PO không có trong payload ⇒ null");
  assert.equal(purchaseOrderForReceipt({ purchaseOrders: [] }, GRN), null, "Payload rỗng ⇒ null");
  assert.equal(purchaseOrderForReceipt(null, GRN), null, "`data` null ⇒ null (không ném lỗi)");
  assert.equal(purchaseOrderForReceipt(DATA, null), null, "`receipt` null ⇒ null (không ném lỗi)");

  // Bất biến hai chiều: PO → danh sách GRN và GRN → PO phải nhất quán trên cùng dữ liệu.
  const receiptsOfPo = receiptsForPurchaseOrder(DATA, "PO-0005");
  assert.deepEqual(receiptsOfPo.map((row) => row.id), ["GR1"], "Chiều XUÔI PO → GRN phải trả đúng chuyến giao");
  assert.equal(rowKey(purchaseOrderForReceipt(DATA, receiptsOfPo[0]).id), "PO-0005", "Đi XUÔI rồi NGƯỢC phải quay về đúng PO nguồn");
});

test("§21 — tầng màn hình: chi tiết GRN có khối PO nguồn + nút mở chi tiết PO", () => {
  const sourcePo = block(drawer, "grn-source-po");
  assert.match(sourcePo, /purchaseOrderForReceipt\(data, receipt\)/, "Khối PO nguồn phải lấy từ hàm thuần dùng chung `purchaseOrderForReceipt(data, receipt)` (KHÔNG tự lọc trong JSX)");
  assert.match(sourcePo, /purchaseOrderId/, "Phải đọc `purchaseOrderId` — cột thật `goods_receipts.purchase_order_id` trên payload");
  assert.match(sourcePo, /data-vntech="grn-source-po-open"/, "Thiếu nút mở chi tiết PO (dấu đo được `grn-source-po-open`)");
  assert.match(sourcePo, /open\("poDetail"/, 'Nút phải mở ĐÚNG modal đã có `poDetail` của `app/page.tsx` (tái dùng, không dựng màn mới)');
  assert.match(sourcePo, /data-vntech="grn-source-po-missing"/, "Thiếu nhánh «không truy được PO nguồn» (dấu đo được)");
  assert.match(sourcePo, /chưa có nguồn/, "Thiếu nguồn ⇒ BẮT BUỘC hiện «chưa có nguồn», KHÔNG bịa số PO");

  // Đóng drawer hiện tại TRƯỚC khi mở modal khác — cùng kỷ luật với chiều PO → PR đã có.
  assert.match(drawer, /close\(\);\s*open\("poDetail"/, "Phải `close()` drawer GRN rồi mới `open(\"poDetail\", …)`");
  assert.match(poDrawer, /onClick=\{openSourceRequest\}/, "Chiều PO → PR (§21) phải còn nguyên");
  assert.match(poDrawer, /data-vntech="po-grn-open"/, "Chiều XUÔI PO → GRN phải còn nguyên (đủ chiều)");
});

test("§21 — tầng nối dây: `ReceiptDrawer` nhận được `open` và `page.tsx` truyền `open`", () => {
  assert.match(drawer, /function ReceiptDrawer\(\{ data, receipt, user, close, action, open \}/, "Chữ ký `ReceiptDrawer` phải nhận thêm `open` để điều hướng sang chi tiết PO");
  assert.match(drawer, /open: \(name: string, row\?: Row\) => void/, "Kiểu của `open` phải khớp `app/page.tsx` (`(name: string, row?: Row) => void`)");
  assert.match(page, /\{selected && modal === "receiptDetail" && <ReceiptDrawer data=\{data\} receipt=\{selected\} user=\{data\.user\} close=\{\(\) => setModal\(null\)\} action=\{action\} open=\{open\} \/>\}/, "`app/page.tsx` chưa truyền `open` vào `ReceiptDrawer` (thiếu `open={open}` ⇒ nút mở PO sẽ chết)");
  assert.match(page, /\{selected && modal === "poDetail" && <PurchaseOrderDrawer/, "Modal `poDetail` phải còn để đích đến tồn tại (nút không được chết)");

  // Không được dùng tên trường SAI đã từng bị đoán.
  assert.doesNotMatch(drawer, /goodsReceiptId|goods_receipt_id/, "KHÔNG được dùng `goodsReceiptId`/`goods_receipt_id`");
});
