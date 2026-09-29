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
};

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
  // 1) nhãn riêng theo phân hệ (khớp HOẶC không phân biệt hoa/thường)
  const domainTable = domain ? DOMAIN_STATUS_LABELS[domain] : undefined;
  if (domainTable) {
    if (domainTable[raw]) return domainTable[raw];
    const hit = Object.keys(domainTable).find((k) => k.toLowerCase() === raw.toLowerCase());
    if (hit) return domainTable[hit];
  }
  // 2) nhãn chung
  if (STATUS_LABELS[raw]) return STATUS_LABELS[raw];
  const commonHit = Object.keys(STATUS_LABELS).find((k) => k.toLowerCase() === raw.toLowerCase());
  if (commonHit) return STATUS_LABELS[commonHit];
  // 3) fallback AN TOÀN — ⛔ không lộ mã thô như `zzz_unknown`, không crash UI
  return humanize(raw);
}

export default statusLabel;
