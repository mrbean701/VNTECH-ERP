// PHASE 2 (§20 · §21) — HÀM THUẦN TRUY VẾT PR → PO → GRN, DÙNG CHUNG CHO HAI MÀN UI.
//
// Vì sao tách thành tệp riêng (không viết thẳng trong JSX):
//   1) `app/screens/*.tsx` là JSX cỡ lớn — logic đếm/đối soát nằm trong JSX thì KHÔNG test được ở tầng nguồn;
//   2) tệp này KHÔNG import gì ⇒ KHÔNG tạo import vòng vào `app/page.tsx`;
//   3) `tests/p2-d1-*.test.mjs` và `tests/p2-d2-*.test.mjs` import TRỰC TIẾP tệp này để đo hành vi thật
//      (đúng cách `tests/t01-work-menu-probe.mjs` đang làm).
//
// ⚠️ TÊN TRƯỜNG LÀ TÊN THẬT ĐÃ ĐO TRÊN CSDL + PAYLOAD BOOTSTRAP (không đoán):
//   · `purchase_orders.request_id`            → payload `requestId`      (nullable, KHÔNG unique ⇒ 1 PR → N PO)
//   · `purchase_order_items.request_item_id`  → payload `requestItemId`  (tách PO ở MỨC DÒNG)
//   · `purchase_order_items.ordered_qty`      → payload `orderedQty`
//   · `purchase_order_items.received_qty`     → payload `receivedQty`
//   · `purchase_order_items.closed_qty`       → payload `closedQty`
//   · `goods_receipts.purchase_order_id`      → payload `purchaseOrderId` (KHÔNG unique ⇒ 1 PO → N GRN)
//   · `goods_receipt_items.receipt_id`        → payload `receiptId`       (KHÔNG có cột `goods_receipt_id`)
//   · `goods_receipt_items.accepted_qty`      → payload `acceptedQty`
//   Nguồn: `scripts/system-route.mjs:653-668` (bootstrap) + `docs/agent-progress/PHASE2-GAP-ANALYSIS.md` §2.4.

/** Bản ghi bất kỳ đến từ payload bootstrap (cùng kiểu `Row` của `lib/ui-shared.tsx` — KHÔNG dùng `any` để giữ lint 0 error). */
export type Row = Record<string, unknown>;

// Kiểu CHỈ-dùng-để-biên-dịch (`import type` bị xoá khi build ⇒ tệp này vẫn KHÔNG có phụ thuộc runtime,
// chạy được cả trong Node lẫn bundle client). Mục đích: `purchaseOrderTimeline` trả ĐÚNG kiểu `ActivityItem`
// để màn chi tiết PO (§21) truyền thẳng vào `ActivityTimeline` mà không phải ép kiểu.
import type { ActivityItem } from "@/app/components/ui/Timeline";

/** Số an toàn: `null`/`undefined`/chuỗi rỗng đều thành 0; KHÔNG bao giờ trả `NaN`. */
export function numeric(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Trường có THẬT trong payload không (phân biệt `undefined` = thiếu nguồn với `0` = số 0 thật). */
export function hasField(row: Row | null | undefined, key: string): boolean {
  return Boolean(row) && Object.prototype.hasOwnProperty.call(row as object, key) && (row as Row)[key] !== undefined;
}

/**
 * PO con của một phiếu đề nghị (§20).
 * Lọc ĐÚNG theo `request_id` của PO (`po.requestId`); PO mồ côi (`request_id = NULL`) KHÔNG bao giờ lọt vào.
 */
export function childPurchaseOrdersFor(data: { purchaseOrders?: Row[] } | null | undefined, requestId: unknown): Row[] {
  if (!data || !Array.isArray(data.purchaseOrders)) return [];
  if (requestId === null || requestId === undefined || requestId === "") return [];
  return data.purchaseOrders.filter((po) => rowKey(po?.requestId) === rowKey(requestId));
}

/** Khoá so khớp: chuỗi đã cắt khoảng trắng; `null`/`undefined`/rỗng ⇒ `""` (không khớp gì). */
export function rowKey(value: unknown): string {
  return value === null || value === undefined ? "" : String(value).trim();
}

/** GRN của một PO (§21) — lọc theo `goods_receipts.purchase_order_id`. */
export function receiptsForPurchaseOrder(data: { receipts?: Row[] } | null | undefined, purchaseOrderId: unknown): Row[] {
  if (!data || !Array.isArray(data.receipts)) return [];
  if (purchaseOrderId === null || purchaseOrderId === undefined || purchaseOrderId === "") return [];
  return data.receipts.filter((receipt) => rowKey(receipt?.purchaseOrderId) === rowKey(purchaseOrderId));
}

/**
 * PO NGUỒN của một chuyến giao (§21 — CHIỀU NGƯỢC của `receiptsForPurchaseOrder`).
 *
 * VÌ SAO CẦN: §21 yêu cầu đi được «PO → GRN → PO». Chiều xuôi có ở `PurchaseOrderDrawer`
 * (`data-vntech="po-grn-open"`), nhưng đứng ở chi tiết phiếu nhập thì KHÔNG quay lại được đơn mua
 * nguồn ⇒ truy vết đứt tại chính màn người dùng đang xem.
 *
 * Khoá nối là cột THẬT `goods_receipts.purchase_order_id` (payload `purchaseOrderId`), tra trong
 * `data.purchaseOrders` theo `purchase_orders.id` (payload `id`).
 *
 * KHÔNG BỊA: GRN không khai PO, khai PO rỗng, hoặc PO khai ra KHÔNG có trong payload (PO mồ côi /
 * ngoài phạm vi dự án) ⇒ trả `null`. Nơi gọi phải hiện nhánh «chưa có nguồn», KHÔNG ghép bừa sang
 * một PO khác.
 */
export function purchaseOrderForReceipt(
  data: { purchaseOrders?: Row[] } | null | undefined,
  receipt: Row | null | undefined
): Row | null {
  if (!data || !Array.isArray(data.purchaseOrders) || !receipt) return null;
  const purchaseOrderId = rowKey(receipt.purchaseOrderId);
  if (!purchaseOrderId) return null;
  return data.purchaseOrders.find((po) => rowKey(po?.id) === purchaseOrderId) ?? null;
}

/**
 * PO mồ côi — `request_id = NULL` ⇒ KHÔNG truy được PR (§21 phần 1).
 * Trả `true` khi trường `requestId` THIẾU hoặc rỗng.
 */
export function isOrphanPurchaseOrder(po: Row | null | undefined): boolean {
  return rowKey(po?.requestId) === "";
}

export type QuantityAudit = {
  /** Nguồn số liệu: `po_header` (tổng hợp sẵn ở đầu PO) hoặc `po_items` (cộng từ dòng PO). */
  source: "po_header" | "po_items" | "none";
  /** `SUM(ordered_qty)`. */
  ordered: number;
  /** `SUM(received_qty)` — số backend đã ghi nhận theo dòng PO. */
  received: number;
  /** `SUM(closed_qty)` — dòng đóng thiếu (kết thúc sớm theo quyết định). */
  closed: number;
  /** Thực giao theo `goods_receipt_items` (`actualDeliveredQty`) — đối chứng với `received`. */
  delivered: number;
  /** `ordered - (received + closed)`, không âm. */
  remaining: number;
  hasData: boolean;
  /** Lý do khi KHÔNG có nguồn (`hasData = false`) — hiện thẳng lên UI, KHÔNG bịa số. */
  reason: string;
};

/**
 * Đối soát Ordered / Received / Remaining của một PO (§21 phần 2).
 * Ưu tiên tổng hợp đầu PO (`orderedQty`/`receivedQty` của `purchase_orders`); nếu payload KHÔNG có
 * hai trường đó thì cộng từ `purchase_order_items`. Không có cả hai ⇒ `hasData = false` + lý do.
 */
export function quantityAudit(po: Row | null | undefined): QuantityAudit {
  const empty: QuantityAudit = { source: "none", ordered: 0, received: 0, closed: 0, delivered: 0, remaining: 0, hasData: false, reason: "" };
  if (!po) return { ...empty, reason: "Bản ghi PO không có trong payload." };
  const items: Row[] = Array.isArray(po.items) ? po.items : [];
  const headerAvailable = hasField(po, "orderedQty") || hasField(po, "receivedQty");
  if (headerAvailable) {
    const ordered = numeric(po.orderedQty);
    const received = numeric(po.receivedQty);
    const closed = numeric(po.closedQty);
    const delivered = numeric(po.actualDeliveredQty);
    return { source: "po_header", ordered, received, closed, delivered, remaining: Math.max(0, ordered - received - closed), hasData: true, reason: "" };
  }
  if (items.length) {
    const ordered = items.reduce((sum, item) => sum + numeric(item.orderedQty), 0);
    const received = items.reduce((sum, item) => sum + numeric(item.receivedQty), 0);
    const closed = items.reduce((sum, item) => sum + numeric(item.closedQty), 0);
    const delivered = items.reduce((sum, item) => sum + numeric(item.actualDeliveredQty), 0);
    return { source: "po_items", ordered, received, closed, delivered, remaining: Math.max(0, ordered - received - closed), hasData: true, reason: "" };
  }
  return { source: "none", ordered: 0, received: 0, closed: 0, delivered: 0, remaining: 0, hasData: false, reason: "Payload PO không kèm `orderedQty`/`receivedQty` và cũng không có dòng `purchase_order_items` để cộng." };
}

/** Tiến độ giao của một PO ở dạng dùng để vẽ (đơn vị % làm tròn, không chia cho 0). */
export function deliveryProgress(po: Row | null | undefined): { audit: QuantityAudit; percent: number; complete: boolean } {
  const audit = quantityAudit(po);
  const percent = audit.ordered > 0 ? Math.min(100, (audit.received + audit.closed) / audit.ordered * 100) : 0;
  return { audit, percent, complete: audit.hasData && audit.ordered > 0 && audit.remaining <= 0 };
}

/**
 * Tiến độ nhận của MỘT DÒNG PO (`ordered` ↔ `received` ↔ `remaining`).
 * KHÔNG dùng để thay số tổng của PO.
 */
export function lineReceivedQty(item: Row | null | undefined): number {
  return numeric(item?.receivedQty) + numeric(item?.actualDeliveredQty);
}

/**
 * Cảnh báo GRN rỗng dòng (§21 phần 3) — dữ liệu thật: 10/16 GRN KHÔNG có dòng `goods_receipt_items`.
 * Trả về `0` khi payload KHÔNG có trường `itemCount` (KHÔNG bịa số) — nơi gọi phân biệt bằng `hasField`.
 */
export function receiptItemCount(receipt: Row | null | undefined): number {
  if (!receipt) return 0;
  if (hasField(receipt, "itemCount")) return numeric(receipt.itemCount);
  return Array.isArray(receipt.items) ? receipt.items.length : 0;
}

/** `true` khi GRN rỗng dòng ⇒ UI BẮT BUỘC hiện cảnh báo (không được im lặng). GRN không tồn tại ⇒ `false` (không dựng cảnh báo giả). */
export function isEmptyReceipt(receipt: Row | null | undefined): boolean {
  if (!receipt) return false;
  return receiptItemCount(receipt) === 0;
}

/** Nhãn ngắn cho dòng "Khối lượng đặt theo dòng PO" ở màn chi tiết PO. */
export function poLineLabel(item: Row | null | undefined, index = 0): string {
  const line = item?.lineNo ?? index + 1;
  const code = rowKey(item?.materialCode) || rowKey(item?.systemCode) || "[CHƯA CÓ MÃ]";
  const name = rowKey(item?.materialName);
  return name ? `Dòng ${line} · ${code} — ${name}` : `Dòng ${line} · ${code}`;
}

/**
 * Sự kiện cho dải thời gian của PO (§21 phần 4) — CHỈ dựng từ dữ liệu THẬT của payload:
 * `orderedAt` (phát hành PO) · `eta` (hạn giao dự kiến) · `deliveryQueuedAt`/`deliveryCompletedAt` ·
 * từng GRN theo `receivedAt`. Không có mốc nào ⇒ mảng rỗng (UI hiện «chưa có nguồn»).
 */
export function purchaseOrderTimeline(po: Row | null | undefined, receipts: Row[] = []): ActivityItem[] {
  const events: ActivityItem[] = [];
  if (!po) return events;
  if (po.orderedAt) events.push({ at: String(po.orderedAt), action: "Phát hành PO", actor: rowKey(po.buyerName) || undefined, detail: `Nhà cung cấp: ${rowKey(po.supplierName) || "chưa xác định"} · Trạng thái hiện tại: ${rowKey(po.status) || "—"}`, tone: "blue" });
  if (po.eta) events.push({ at: String(po.eta), action: "Hạn giao dự kiến", detail: `Kho nhận: ${rowKey(po.receivingWarehouseId) || "chưa xác định"}`, tone: "amber" });
  if (po.deliveryQueuedAt) events.push({ at: String(po.deliveryQueuedAt), action: "Đưa vào hàng chờ giao", tone: "amber" });
  for (const receipt of receipts) {
    const count = receiptItemCount(receipt);
    events.push({
      at: receipt.receivedAt ? String(receipt.receivedAt) : null,
      action: `Chuyến giao ${rowKey(receipt.receiptNo) || "[chưa có số GRN]"}`,
      detail: `${count > 0 ? `${count} dòng` : "RỖNG DÒNG — không đối soát được số lượng"} · Thực giao ${numeric(receipt.actualDeliveredQty)} · Chấp nhận ${numeric(receipt.acceptedQty)}${isEmptyReceipt(receipt) ? " · ⚠ cần bổ sung dòng GRN" : ""}`,
      tone: isEmptyReceipt(receipt) ? "red" : "green",
    });
  }
  if (po.deliveryCompletedAt) events.push({ at: String(po.deliveryCompletedAt), action: "Hoàn tất giao nhận theo xác nhận BCH", tone: "green" });
  return events;
}
