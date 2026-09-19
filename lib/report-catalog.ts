// [PHASE 9 · R-01/R-02/R-03/R-04/R-05] CATALOG BÁO CÁO — MỖI BÁO CÁO CHỈ LÀ MỘT KHAI BÁO.
//
// NGUYÊN TẮC (§45 — KHÔNG TỰ SUY ĐOÁN): chỉ dùng TRƯỜNG ĐÃ XÁC MINH từ dữ liệu thật:
//   data.requests        : id, requestNo, status, projectId, projectCode, projectName, requestedBy, requestedAt, neededAt, itemCount
//   data.purchaseOrders  : id, code, projectId, amount, status
//   data.inventory       : materialCode, materialName, unit, available, balance, minStock, projectId
//   data.projects        : id, code, name, status
//   data.workItems       : id, status, projectId
// Phần nào của đặc tả R-02..R-05 dùng trường CHƯA xác minh thì để `note` ghi rõ là còn thiếu, KHÔNG bịa tên trường.
import type { ReportDefinition, Row } from "./report-engine";

export type ReportSource = "requests" | "purchaseOrders" | "inventory" | "projects" | "workItems";

export interface ReportCatalogEntry {
  def: ReportDefinition;
  source: ReportSource;
}

const STATUS_LABELS: Record<string, string> = {
  pending_approval: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
  waiting_delivery: "Chờ giao",
  delivered: "Đã giao",
  done: "Hoàn thành",
  cancelled: "Đã huỷ",
  open: "Mở",
  closed: "Đóng",
};

/** Nhãn trạng thái dùng chung cho mọi báo cáo (chỉ để hiển thị; khoá nhóm vẫn là giá trị thật). */
export const statusLabel = (v: unknown): string => STATUS_LABELS[String(v)] ?? String(v ?? "(không xác định)");

// ── R-02 — MUA HÀNG ─────────────────────────────────────────────────────────
const R02: ReportCatalogEntry[] = [
  {
    source: "requests",
    def: {
      key: "R-02a",
      title: "Mua hàng — Phiếu đề nghị theo trạng thái",
      note: "Số phiếu theo trạng thái · số dự án khác nhau · số người đề nghị. (Đặc tả còn phần 'thời gian xử lý' cần trường mốc duyệt — CHƯA xác minh nên không đưa vào.)",
      groupBy: ["status"],
      metrics: [
        { key: "soPhieu", label: "Số phiếu", agg: "count" },
        { key: "soDuAn", label: "Số dự án", agg: "distinct", field: "projectId" },
        { key: "soNguoiDeNghi", label: "Số người đề nghị", agg: "distinct", field: "requestedBy" },
        { key: "tongDong", label: "Tổng dòng vật tư", agg: "sum", field: "itemCount", format: "number" },
      ],
      sortBy: "soPhieu",
      sortDir: "desc",
    },
  },
  {
    source: "requests",
    def: {
      key: "R-02b",
      title: "Mua hàng — Phiếu đề nghị theo dự án",
      note: "Số phiếu theo dự án · số trạng thái khác nhau · tổng dòng vật tư.",
      groupBy: ["projectId"],
      metrics: [
        { key: "soPhieu", label: "Số phiếu", agg: "count" },
        { key: "soTrangThai", label: "Số trạng thái", agg: "distinct", field: "status" },
        { key: "tongDong", label: "Tổng dòng vật tư", agg: "sum", field: "itemCount", format: "number" },
      ],
      sortBy: "soPhieu",
      sortDir: "desc",
    },
  },
  {
    source: "purchaseOrders",
    def: {
      key: "R-02c",
      title: "Mua hàng — Đơn hàng (PO) theo trạng thái",
      note: "Số PO · tổng giá trị · giá trị lớn nhất theo trạng thái.",
      groupBy: ["status"],
      metrics: [
        { key: "soPO", label: "Số PO", agg: "count" },
        { key: "tongGiaTri", label: "Tổng giá trị", agg: "sum", field: "amount", format: "money" },
        { key: "lonNhat", label: "Lớn nhất", agg: "max", field: "amount", format: "money" },
      ],
      sortBy: "tongGiaTri",
      sortDir: "desc",
    },
  },
];

// ── R-03 — KHO ──────────────────────────────────────────────────────────────
const R03: ReportCatalogEntry[] = [
  {
    source: "inventory",
    def: {
      key: "R-03a",
      title: "Kho — Tồn theo dự án",
      note: "Tổng khả dụng · tổng số dư · tổng định mức tối thiểu · số mặt hàng. (Đặc tả còn 'tồn theo kho' và 'giá trị' cần trường kho/đơn giá — CHƯA xác minh nên không đưa vào.)",
      groupBy: ["projectId"],
      metrics: [
        { key: "soMatHang", label: "Số mặt hàng", agg: "count" },
        { key: "tongKhaDung", label: "Tổng khả dụng", agg: "sum", field: "available", format: "number" },
        { key: "tongSoDu", label: "Tổng số dư", agg: "sum", field: "balance", format: "number" },
        { key: "tongDinhMuc", label: "Tổng định mức tối thiểu", agg: "sum", field: "minStock", format: "number" },
      ],
      sortBy: "tongKhaDung",
      sortDir: "desc",
    },
  },
  {
    source: "inventory",
    def: {
      key: "R-03b",
      title: "Kho — Mặt hàng SẮP HẾT (khả dụng dưới định mức)",
      note: "Lọc MẶT HÀNG có khả dụng dưới định mức tối thiểu — dùng để cảnh báo mua bổ sung. (Cần dữ liệu có cả `available` và `minStock`.)",
      groupBy: ["materialCode"],
      metrics: [
        { key: "khaDung", label: "Khả dụng", agg: "sum", field: "available", format: "number" },
        { key: "dinhMuc", label: "Định mức tối thiểu", agg: "sum", field: "minStock", format: "number" },
      ],
      sortBy: "khaDung",
      sortDir: "asc",
    },
  },
];

// ── R-04 — DỰ ÁN ────────────────────────────────────────────────────────────
const R04: ReportCatalogEntry[] = [
  {
    source: "projects",
    def: {
      key: "R-04a",
      title: "Dự án — Theo trạng thái",
      note: "Số dự án theo trạng thái. (Đặc tả còn 'thành viên · số tổ đội · số kho · tiến độ' — cần đối chiếu trường tương ứng trước khi thêm chỉ số.)",
      groupBy: ["status"],
      metrics: [
        { key: "soDuAn", label: "Số dự án", agg: "count" },
        { key: "soMa", label: "Số mã dự án", agg: "distinct", field: "code" },
      ],
      sortBy: "soDuAn",
      sortDir: "desc",
    },
  },
];

// ── R-05 — CÔNG VIỆC ────────────────────────────────────────────────────────
const R05: ReportCatalogEntry[] = [
  {
    source: "workItems",
    def: {
      key: "R-05a",
      title: "Công việc — Theo trạng thái",
      note: "Số việc theo trạng thái · số dự án liên quan. (Đặc tả còn 'quá hạn · khối lượng · theo phòng' — cần trường hạn chót/phòng đã xác minh trước khi thêm.)",
      groupBy: ["status"],
      metrics: [
        { key: "soViec", label: "Số việc", agg: "count" },
        { key: "soDuAn", label: "Số dự án", agg: "distinct", field: "projectId" },
      ],
      sortBy: "soViec",
      sortDir: "desc",
    },
  },
  {
    source: "workItems",
    def: {
      key: "R-05b",
      title: "Công việc — Theo dự án",
      note: "Số việc theo dự án · số trạng thái khác nhau.",
      groupBy: ["projectId"],
      metrics: [
        { key: "soViec", label: "Số việc", agg: "count" },
        { key: "soTrangThai", label: "Số trạng thái", agg: "distinct", field: "status" },
      ],
      sortBy: "soViec",
      sortDir: "desc",
    },
  },
];

export const REPORT_CATALOG: ReportCatalogEntry[] = [...R02, ...R03, ...R04, ...R05];

/** Lấy mảng dữ liệu nguồn từ `data` bootstrap (an toàn: luôn trả mảng). */
export function sourceRows(source: ReportSource, data: unknown): Row[] {
  const bag = (data ?? {}) as Record<string, unknown>;
  const v = bag[source];
  return Array.isArray(v) ? (v as Row[]) : [];
}

/** Tra một mục catalog theo khoá định nghĩa. */
export function findEntry(key: string): ReportCatalogEntry | undefined {
  return REPORT_CATALOG.find((e) => e.def.key === key);
}
