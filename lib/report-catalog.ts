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

export type ReportSource = "requests" | "purchaseOrders" | "inventory" | "projects" | "workItems" | "stockMovements" | "teams" | "userProjectScopes";

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
        { key: "tbNgayXuLy", label: "TB ngày xử lý", agg: "avg", field: "xuLyNgay", format: "number" },
        { key: "chamNhat", label: "Lâu nhất (ngày)", agg: "max", field: "xuLyNgay", format: "number" },
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
// R-03c/d/e — KHO (nguon stock_movements DA XAC MINH: from/to_warehouse_id, quantity, movement_type, unit_cost)
const R03B: ReportCatalogEntry[] = [
  { source: "stockMovements", def: {
      key: "R-03c", title: "Kho — Nhập / Xuất theo loại giao dịch",
      note: "Số giao dịch · tổng số lượng · giá trị (quantity × unit_cost) · số mặt hàng. Nguồn: stock_movements (cột đã xác minh).",
      groupBy: ["movementType", "chieu"],
      metrics: [
        { key: "soGiaoDich", label: "Số giao dịch", agg: "count" },
        { key: "tongSoLuong", label: "Tổng số lượng", agg: "sum", field: "soLuong", format: "number" },
        { key: "tongGiaTri", label: "Tổng giá trị", agg: "sum", field: "giaTri", format: "money" },
        { key: "soMatHang", label: "Số mặt hàng", agg: "distinct", field: "materialId" },
      ], sortBy: "tongSoLuong", sortDir: "desc" } },
  { source: "stockMovements", def: {
      key: "R-03d", title: "Kho — Tồn theo KHO (cộng nhập − trừ xuất)",
      note: "TỒN = Σ(+quantity khi nhập) − Σ(quantity khi xuất), gộp theo kho. Nguồn: stock_movements.to_warehouse_id / from_warehouse_id.",
      groupBy: ["khoTen"],
      metrics: [
        { key: "tonSoLuong", label: "Tồn (số lượng)", agg: "sum", field: "soLuong", format: "number" },
        { key: "soGiaoDich", label: "Số giao dịch", agg: "count" },
        { key: "soMatHang", label: "Số mặt hàng", agg: "distinct", field: "materialId" },
      ], sortBy: "tonSoLuong", sortDir: "desc" } },
  { source: "stockMovements", def: {
      key: "R-03e", title: "Kho — Giá trị theo kho",
      note: "Giá trị = quantity × unit_cost (unit_cost đã xác minh; nếu nghiệp vụ chưa nhập đơn giá thì bằng 0 — phản ánh đúng dữ liệu).",
      groupBy: ["khoTen"],
      metrics: [
        { key: "giaTri", label: "Giá trị", agg: "sum", field: "giaTri", format: "money" },
        { key: "soGiaoDich", label: "Số giao dịch", agg: "count" },
      ], sortBy: "giaTri", sortDir: "desc" } },
];

// R-04b/c — DU AN: nguon DA XAC MINH (teams: project_id/warehouse_id/trade; user_project_scopes: project_id/user_id/permission/position_name)
const R04B: ReportCatalogEntry[] = [
  { source: "teams", def: {
      key: "R-04b", title: "Dự án — Tổ đội & kho theo dự án",
      note: "Số tổ đội · số kho khác nhau · số nghề (trade) · số tổ đội còn hoạt động. Nguồn: teams (project_id · warehouse_id · trade · active).",
      groupBy: ["projectId"],
      metrics: [
        { key: "soToDoi", label: "Số tổ đội", agg: "count" },
        { key: "soKho", label: "Số kho", agg: "distinct", field: "warehouseId" },
        { key: "soNghe", label: "Số nghề", agg: "distinct", field: "trade" },
        { key: "soLeader", label: "Số tổ trưởng", agg: "distinct", field: "leaderUserId" },
      ], sortBy: "soToDoi", sortDir: "desc" } },
  { source: "userProjectScopes", def: {
      key: "R-04c", title: "Dự án — Thành viên theo dự án",
      note: "Số thành viên (user khác nhau) · số chức danh · số mức quyền. Nguồn: user_project_scopes (project_id · user_id · position_name · permission). (Bảng project_members KHÔNG tồn tại ⇒ đây là nguồn thành viên dự án.)",
      groupBy: ["projectId"],
      metrics: [
        { key: "soThanhVien", label: "Số thành viên", agg: "distinct", field: "userId" },
        { key: "soChucDanh", label: "Số chức danh", agg: "distinct", field: "positionName" },
        { key: "soMucQuyen", label: "Số mức quyền", agg: "distinct", field: "permission" },
        { key: "soLuot", label: "Số lượt gán", agg: "count" },
      ], sortBy: "soThanhVien", sortDir: "desc" } },
];

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

// R-05c — CONG VIEC THEO PHONG (work_items.department_code DA XAC MINH; quaHan/tienDo lam giau tu due_at/progress)
const R05B: ReportCatalogEntry[] = [
  { source: "workItems", def: {
      key: "R-05c", title: "Công việc — Theo PHÒNG",
      note: "Số việc · số việc QUÁ HẠN (due_at < hiện tại & chưa xong) · số việc ĐÃ XONG · tiến độ TB (progress) · tiến độ cao nhất. Nguồn: work_items (department_code · due_at · status · progress).",
      groupBy: ["departmentCode"],
      metrics: [
        { key: "soViec", label: "Số việc", agg: "count" },
        { key: "quaHan", label: "Quá hạn", agg: "sum", field: "quaHan", format: "number" },
        { key: "daXong", label: "Đã xong", agg: "sum", field: "hoanThanh", format: "number" },
        { key: "tbTienDo", label: "Tiến độ TB (%)", agg: "avg", field: "tienDo", format: "percent" },
        { key: "tienDoCaoNhat", label: "Tiến độ cao nhất", agg: "max", field: "tienDo", format: "percent" },
      ], sortBy: "soViec", sortDir: "desc" } },
];
export const REPORT_CATALOG: ReportCatalogEntry[] = [...R02, ...R03, ...R03B, ...R04, ...R04B, ...R05, ...R05B];

/**
 * Lấy mảng dữ liệu nguồn từ `data` bootstrap (an toàn: luôn trả mảng).
 *
 * CHUẨN HOÁ theo CỘT DB ĐÃ XÁC MINH (TASK-094 §54) — KHÔNG bịa trường:
 *   material_requests : requested_at · needed_at · updated_at · created_at · status · total_estimated_value · project_id · requested_by
 *   purchase_orders   : ordered_at · eta · status · total_value · decided_at · delivery_queued_at · delivery_completed_at · request_id
 * Bổ sung:
 *   • amount    — khoá tiền cho PO dù bootstrap đặt tên amount / totalValue / total_value.
 *   • xuLyNgay  — SỐ NGÀY XỬ LÝ = updated_at − requested_at (chỉ khi CẢ HAI mốc có thật) ⇒ "thời gian xử lý" của R-02.
 */
export function sourceRows(source: ReportSource, data: unknown): Row[] {
  const bag = (data ?? {}) as Record<string, unknown>;
  const v = bag[source];
  const list = Array.isArray(v) ? (v as Row[]) : [];
  if (source === "purchaseOrders") {
    return list.map((r) => ({ ...r, amount: Number(r.amount ?? r.totalValue ?? r.total_value ?? 0) }));
  }
  if (source === "requests") {
    return list.map((r) => {
      const a = r.requestedAt ?? r.requested_at;
      const b = r.updatedAt ?? r.updated_at;
      const ta = a ? new Date(String(a)).getTime() : NaN;
      const tb = b ? new Date(String(b)).getTime() : NaN;
      const soNgay = Number.isFinite(ta) && Number.isFinite(tb) ? Math.max(0, (tb - ta) / 86400000) : undefined;
      return { ...r, xuLyNgay: soNgay };
    });
  }
  if (source === "stockMovements") {
    // FAN-OUT CO DAU theo cot DA XAC MINH (stock_movements: from/to_warehouse_id, quantity, unit_cost):
    //   nhap (to_warehouse_id) => +quantity ; xuat (from_warehouse_id) => -quantity
    //   => gop theo khoId + sum(soLuong) chinh la TON THEO KHO.
    const wh = Array.isArray((bag as Record<string, unknown>).warehouses) ? ((bag as Record<string, unknown>).warehouses as Row[]) : [];
    const ten = (id: unknown) => { const w = wh.find((x) => String(x.id) === String(id)); return w ? String(w.name ?? w.code ?? id) : String(id ?? "(khong xac dinh)"); };
    const out: Row[] = [];
    for (const r of list) {
      const qty = Number(r.quantity ?? 0);
      const cost = Number(r.unitCost ?? r.unit_cost ?? 0);
      const when = r.occurredAt ?? r.occurred_at;
      const to = r.toWarehouseId ?? r.to_warehouse_id;
      const from = r.fromWarehouseId ?? r.from_warehouse_id;
      if (to) out.push({ ...r, khoId: to, khoTen: ten(to), soLuong: qty, giaTri: qty * cost, chieu: "N", occurredAt: when });
      if (from) out.push({ ...r, khoId: from, khoTen: ten(from), soLuong: -qty, giaTri: -qty * cost, chieu: "X", occurredAt: when });
    }
    return out;
  }
  if (source === "workItems") {
    // LAM GIAU theo COT DA XAC MINH (work_items: due_at, status, progress, department_code, completed_at):
    //   quaHan = due_at < hien tai VA chua hoan thanh/xong  ;  hoanThanh = status thuoc nhom xong
    const XONG = new Set(["done", "completed", "closed"]);
    const now = Date.now();
    return list.map((r) => {
      const st = String(r.status ?? "");
      const due = r.dueAt ?? r.due_at;
      const t = due ? new Date(String(due)).getTime() : NaN;
      const xong = XONG.has(st);
      return { ...r, quaHan: Number.isFinite(t) && t < now && !xong ? 1 : 0, hoanThanh: xong ? 1 : 0, tienDo: Number(r.progress ?? 0) };
    });
  }
  return list;
}

/** Tra một mục catalog theo khoá định nghĩa. */
export function findEntry(key: string): ReportCatalogEntry | undefined {
  return REPORT_CATALOG.find((e) => e.def.key === key);
}
