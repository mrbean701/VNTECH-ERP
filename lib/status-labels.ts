// MASTER TASK 3 §IV.6 — BẢNG ÁNH XẠ TRẠNG THÁI TIẾNG VIỆT **DÙNG CHUNG**
//
// MT3 §IV.6 yêu cầu:
//   1. Tất cả trạng thái đơn/phiếu/quy trình phải hiển thị bằng TIẾNG VIỆT.
//   2. ⛔ KHÔNG hiển thị trực tiếp mã trạng thái backend (pending, approved, rejected, cancelled, in_progress…).
//   3. Tạo cơ chế ánh xạ DÙNG CHUNG, không viết rải rác ở từng màn hình.
//   4. Giá trị không nhận diện được phải có FALLBACK AN TOÀN, không làm crash UI.
//   5. ⛔ Không thay đổi mã trạng thái lưu trong database — chỉ DỊCH tại tầng hiển thị.
//
// ⛔ NGUYÊN TẮC GIỮ NGUYÊN (RULE 13): file này CHỈ đọc/ghi nhãn hiển thị.
//    Mọi logic nghiệp vụ (so sánh `status === "approved"`) vẫn dùng MÃ GỐC như cũ — không đổi.
//
// Cách dùng:
//   import { statusLabel, STATUS_LABELS } from "@/lib/status-labels";
//   <StatusBadge value={statusLabel(row.status)} />          // ⛔ thay vì <StatusBadge value={String(row.status)} />
//   statusLabel("pending_approval", "purchase_request")      // ưu tiên nhãn theo phân hệ, rồi mới tới nhãn chung

/**
 * Nhãn CHUNG cho mã trạng thái xuất hiện ở nhiều phân hệ.
 * Khoá dùng mã THÔ của backend (viết thường, không dấu) để không phụ thuộc hoa/thường.
 */
export const GENERIC_STATUS_LABELS: Record<string, string> = {
  // Vòng đời đơn/phiếu
  draft: "Bản nháp", pending: "Chờ xử lý", pending_approval: "Chờ duyệt", submitted: "Đã trình",
  in_progress: "Đang xử lý", processing: "Đang xử lý", working: "Đang thực hiện",
  approved: "Đã duyệt", rejected: "Từ chối", returned: "Trả lại", cancelled: "Đã huỷ",
  canceled: "Đã huỷ", completed: "Hoàn thành", done: "Hoàn thành", closed: "Đã đóng",
  // Trạng thái mở/đóng
  open: "Đang mở", todo: "Chưa làm", doing: "Đang làm", blocked: "Bị chặn", on_hold: "Tạm dừng",
  active: "Đang hoạt động", inactive: "Ngừng hoạt động", paused: "Tạm dừng", archived: "Đã lưu trữ",
  // Kế toán / vật tư
  paid: "Đã thanh toán", unpaid: "Chưa thanh toán", partial: "Thanh toán một phần",
  discontinued: "Đã ngừng", stopped: "Đã ngừng", expired: "Đã hết hạn", effective: "Có hiệu lực",
};

/**
 * Nhãn RIÊNG theo phân hệ. Ưu tiên cao hơn `GENERIC_STATUS_LABELS` khi trùng mã
 * (VD mã `closed` của dự án ≠ mã `closed` của phiếu ⇒ nhãn khác nhau).
 */
export const DOMAIN_STATUS_LABELS: Record<string, Record<string, string>> = {
  project: { active: "Đang hoạt động", paused: "Tạm dừng", closed: "Đã đóng", purged: "Đã xoá", pending: "Chờ khởi động" },
  work_item: {
    NEW: "Mới", IN_PROGRESS: "Đang làm", WAITING_SUPPLIER: "Chờ NCC", WAITING_CLIENT: "Chờ khách hàng",
    WAITING_APPROVAL: "Chờ duyệt", WAITING_PROJECT: "Chờ dự án", BLOCKED: "Bị chặn", ON_HOLD: "Tạm dừng",
    SUBMITTED: "Đã trình", REWORK: "Làm lại", COMPLETED: "Hoàn thành", CANCELLED: "Đã huỷ",
  },
  approval_step: { waiting: "Chưa tới bước", pending: "Chờ duyệt", approved: "Đã duyệt", rejected: "Từ chối", skipped: "Bỏ qua" },
  // ERP-SESSION-03 (07/10/2026) — `BUG-20261007-C03`: bảng nhãn CHUỖI CUNG ỨNG được **CHUYỂN VỀ ĐÂY**
  // từ `lib/labels.ts` (bản CŨ trùng lặp). Lý do: `lib/labels.ts` có fallback `row.supplyStatus || row.status`
  // ⇒ **RÒ MÃ THÔ TIẾNG ANH** ra UI/export, đúng lỗi user báo «1 số nơi hiển thị tiếng Anh».
  // ⛔ Giữ NGUYÊN từng nhãn của bảng cũ ⇒ hành vi của 7 mô-đun đang dùng `lib/labels.ts` KHÔNG đổi,
  //   chỉ khác ở chỗ mã KHÔNG có trong bảng nay được DỊCH thay vì in thô.
  // ⚠️ `partial` ở đây = «Giao một phần» (nghĩa chuỗi cung ứng) KHÁC nhãn chung «Thanh toán một phần»
  //   ⇒ nhờ tra theo DOMAIN TRƯỚC, người gọi chuỗi cung ứng vẫn nhận đúng nghĩa cũ.
  supply: {
    pending_approval: "Chờ duyệt", approval_pending: "Chờ duyệt", approved: "Đã duyệt", awaiting_po: "Chờ lập PO",
    waiting_delivery: "Chờ giao hàng", partial_delivery: "Giao một phần", delivered_pending_confirmation: "Chờ BCH xác nhận",
    awaiting_bch_confirmation: "Chờ BCH xác nhận", received_full_docs_pending: "Đã nhận đủ · Chờ hồ sơ",
    completed: "Đã hoàn tất", completed_with_exceptions: "Hoàn tất · Thiếu hồ sơ", completed_with_shortage: "Đóng đơn có thiếu",
    returned_to_requester: "Trả lại", returned: "Trả lại", issued: "Đã xuất kho", partial_issued: "Xuất một phần",
    rejected: "Từ chối", cancelled: "Đã hủy", ordered: "Đang mua", partial: "Giao một phần", received: "Đã giao đủ",
    posted: "Đã ghi sổ", blocked: "Bị chặn",
  },
  // ⛔ ERP-SESSION-03 (07/10/2026) — `BUG-20261007-C04`: `work_items.priority` lưu **MÃ TIẾNG ANH**
  //   (`critical` · `urgent` · `high` · `normal` · `low`) và nhiều màn in NGUYÊN MÃ, hoặc tự dịch bằng
  //   ternary **lặp 3 chỗ** và **sót `critical`** (màn Công việc hiện «Thường» cho việc KHẨN CẤP).
  //   ✅ Nhãn ở đây **KHỚP TỪNG CHỮ** với `KANBAN_PRIORITIES` (`app/screens/WorkKanban.tsx:44-50`) —
  //      có cổng `tests/mt3-c04-status-vi.test.mjs` kiểm 2 bảng KHÔNG được lệch nhau.
  //   ⚠️ `KANBAN_PRIORITIES` giữ thêm `tone`/`rank` (màu + thứ tự) nên ⛔ KHÔNG xoá nó; khối thuần của
  //      WorkKanban ⛔ không được `import` (test `t07` trích khối đó ra chạy) ⇒ chỉ đồng bộ bằng CỔNG KIỂM.
  priority: {
    critical: "Khẩn cấp", urgent: "Khẩn", high: "Cao", normal: "Bình thường", low: "Thấp",
  },
  // `seals.seal_type` lưu mã tiếng Anh; ô chọn ở `SealScreen` đã có nhãn, nhưng BẢNG lại in mã thô.
  seal_type: {
    company: "Dấu công ty", legal: "Dấu pháp nhân", signature: "Dấu chức danh", other: "Khác",
  },
  // ⛔ ERP-SESSION-03 (07/10/2026) — `BUG-20261007-C06`: `goods_receipts.certificate_status` /
  //   `delivery_document_status` lưu MÃ ANH (`complete` · `missing` · `not_required`) và **ĐI THẲNG VÀO TỆP XUẤT**:
  //   `lib/ui-shared.tsx::deliveredExportRows` đưa mã thô vào **cả XLSX lẫn CSV** «Đơn hàng đã giao»,
  //   trong khi `lib/request-export.ts` lại có **bản dịch RIÊNG** (trùng lặp) cho cùng 3 giá trị.
  //   ✅ Nay cả hai dùng CHUNG 2 domain dưới đây (REUSE — Goal §17).
  certificate_status: {
    complete: "Đã có", missing: "Chưa có", not_required: "Không yêu cầu",
  },
  delivery_document: {
    complete: "Đã có", missing: "Chưa có",
  },
  // ⛔ ERP-SESSION-03 (07/10/2026) — `TASK-20261007-C18`: 3 giá trị **CÓ THẬT TRONG CSDL** nhưng ⛔ CHƯA có nhãn:
  //   `goods_receipts.bch_confirmation_status = confirmed` · `goods_receipts.qc_status = accepted | passed`
  //   (ĐO ĐƯỢC: `statusLabel("confirmed")` → «Confirmed» · `("accepted")` → «Accepted» · `("passed")` → «Passed»).
  //   ⭐ HIỆN TẠI ⛔ **CHƯA rò ra màn hình** vì **mọi** call site đều dịch TAY bằng ternary
  //   (`Inventory.tsx` · `PurchaseOrderDrawer.tsx` · `ReceiptDrawer.tsx` · `app/page.tsx` — đã đo 5 chỗ).
  //   ⇒ Đây là **LỖ HỔNG TIỀM ẨN + TRÙNG LẶP 5 CHỖ** (đúng lớp lỗi đã gây 4 bug trong phiên) ⇒ bổ sung nhãn tại NGUỒN.
  //   ⚠️ Nhãn chọn theo **cách viết rõ nhất đang dùng ở call site** (⛔ KHÔNG đổi câu chữ trên màn hình: các call site
  //      giữ nguyên ternary của chúng — ⛔ không refactor tệp của phiên khác theo §41).
  bch_confirmation: {
    pending: "Chờ BCH xác nhận", confirmed: "BCH đã xác nhận", rejected: "BCH từ chối",
  },
  qc_result: {
    pending: "Chờ kiểm tra", accepted: "Đạt", passed: "Đạt", rejected: "Không đạt", failed: "Không đạt",
  },
};

/**
 * Thứ tự tra các bảng DOMAIN khi mã KHÔNG có ở bảng CHUNG — CỐ ĐỊNH để kết quả **tất định**
 * (⛔ không phụ thuộc thứ tự khoá của object, vốn có thể đổi khi thêm bảng mới).
 */
const DOMAIN_LOOKUP_ORDER = ["project", "work_item", "approval_step", "supply", "priority", "seal_type", "certificate_status", "delivery_document"] as const;

/** Bảng tra cứu hợp nhất (mã thô → nhãn tiếng Việt). */
export const STATUS_LABELS: Record<string, string> = { ...GENERIC_STATUS_LABELS };

/**
 * Viết hoá chuỗi dùng làm fallback: `pending_approval` → `Pending approval`.
 * ⛔ CHỈ dùng khi KHÔNG tìm thấy nhãn nào — vẫn tốt hơn việc đẩy mã thô vào UI (MT3 §IV.6).
 */
function humanize(raw: string): string {
  const text = raw.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return "—";
  return text.charAt(0).toLocaleUpperCase("vi") + text.slice(1);
}

/**
 * Tra nhãn **ĐÃ BIẾT** cho một mã (⛔ KHÔNG humanize): trả `undefined` khi mã không có trong bất kỳ bảng nào.
 *
 * Vì sao cần hàm này (ERP-SESSION-03, `BUG-20261007-C03`): nơi gọi cần phân biệt
 * «mã này ĐÃ CÓ nhãn» với «mã lạ», để ⛔ không lấy kết quả `humanize()` (vẫn là tiếng Anh)
 * làm nhãn chính thức. `lib/labels.ts` dùng nó để giữ ĐÚNG thứ tự ưu tiên
 * `supplyStatus → status → postingStatus` của bản cũ.
 */
export function knownStatusLabel(value: unknown, domain?: string): string | undefined {
  const raw = value === null || value === undefined ? "" : String(value).trim();
  if (!raw) return undefined;
  const domainTable = domain ? DOMAIN_STATUS_LABELS[domain] : undefined;
  if (domainTable) {
    if (domainTable[raw]) return domainTable[raw];
    const hitInDomain = Object.keys(domainTable).find((k) => k.toLowerCase() === raw.toLowerCase());
    if (hitInDomain) return domainTable[hitInDomain];
  }
  if (STATUS_LABELS[raw]) return STATUS_LABELS[raw];
  const commonHit = Object.keys(STATUS_LABELS).find((k) => k.toLowerCase() === raw.toLowerCase());
  if (commonHit) return STATUS_LABELS[commonHit];
  // Mã KHÔNG có ở bảng chung ⇒ thử từng bảng DOMAIN theo thứ tự CỐ ĐỊNH (khớp CHÍNH XÁC trước).
  for (const key of DOMAIN_LOOKUP_ORDER) {
    if (key === domain) continue;
    const table = DOMAIN_STATUS_LABELS[key];
    if (!table) continue;
    if (table[raw]) return table[raw];
  }
  for (const key of DOMAIN_LOOKUP_ORDER) {
    if (key === domain) continue;
    const table = DOMAIN_STATUS_LABELS[key];
    if (!table) continue;
    const hit = Object.keys(table).find((k) => k.toLowerCase() === raw.toLowerCase());
    if (hit) return table[hit];
  }
  return undefined;
}

/**
 * Lấy nhãn tiếng Việt cho một mã trạng thái.
 *
 * @param value  mã trạng thái thô từ backend (có thể rỗng / null / undefined)
 * @param domain khoa phân hệ, xem `DOMAIN_STATUS_LABELS` (tuỳ chọn)
 * @returns chuỗi tiếng Việt — ⛔ LUÔN trả về chuỗi, không bao giờ throw và không bao giờ trả `undefined`.
 */
export function statusLabel(value: unknown, domain?: string): string {
  if (value === null || value === undefined) return "—";
  const raw = String(value).trim();
  if (!raw) return "—";
  const known = knownStatusLabel(raw, domain);
  if (known) return known;
  // Fallback AN TOÀN — ⛔ không lộ mã thô như `zzz_unknown`, không crash UI.
  return humanize(raw);
}

export default statusLabel;
