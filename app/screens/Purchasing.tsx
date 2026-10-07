// PHASE 1 (U-11) — MODULE DÙNG CHUNG TÁCH KHỎI `app/page.tsx`.
//
// Vì sao tách: `app/page.tsx` là MỘT tệp khổng lồ (hơn 4.000 dòng, hơn 250 khai báo top-level).
// Thứ tự cắt ĐÚNG (đã ghi ở `docs/agent-progress/U14-U11-KHAO-SAT.md` mục 2): tách HELPER DÙNG CHUNG trước
// (gỡ chặn IMPORT VÒNG), rồi mới tách từng màn.
//
// ⚠️ ĐIỀU KIỆN AN TOÀN (do `tools/tach-lat-cat-page.mjs` tự kiểm TRƯỚC KHI GHI): mọi tên mà các khối ở đây
// tham chiếu phải thuộc (a) khối cùng nằm trong tệp này, (b) tên có sẵn của JS, (c) tên đến từ `import` của
// `page.tsx` — công cụ SINH LẠI import đó ở đây, hoặc (d) kiểu của React ⇒ `import type … from "react"`.
// Không còn tên nào khác ⇒ KHÔNG thể tạo import vòng.
//
// ════════════════════════════════════════════════════════════════════════════════════════════════════
// P-01 · P-02 · P-03 (TASK-119) — MÀN MUA HÀNG: ĐÚNG **2 TAB** (`PR` · `PO`) + SẮP XẾP `created DESC`
//                                  + **6 CHIỀU LỌC**, KHÔNG XOÁ DỮ LIỆU/BẢNG/CỘT NÀO.
//
// CHỈ ĐẠO NGƯỜI DÙNG 21/09/2026 (thay đổi so với đặc tả 3 tab cũ):
//   «bỏ P-01 không tách MR PR PO nữa mà chỉ còn PR và PO thôi»
//   ⇒ dải tab có ĐÚNG 2 tab: `PR` và `PO`; **KHÔNG** còn tab `MR` riêng ✗.
//
// HIỂU ĐÚNG NGUỒN DỮ LIỆU (đo trên MySQL `vntech_erp` ngày 21/09/2026 — CHỈ ĐỌC):
//   • tab `PR` = `data.requests` = bảng **`material_requests`** (35 phiếu thật) — phiếu ĐỀ NGHỊ MUA HÀNG.
//   • tab `PO` = `data.purchaseOrders` = bảng **`purchase_orders`** (17 đơn thật).
//   Trước đây tài liệu gọi «MR» và «PR» là hai thứ khác nhau; theo chỉ đạo 21/09 hai tên đó GỘP
//   thành một: **chỉ còn PR + PO**.
//
// ⛔ LUẬT CỨNG — ĐÂY LÀ YÊU CẦU **GIAO DIỆN** ✗:
//   KHÔNG xoá bảng `material_requests` · KHÔNG xoá dòng nào · KHÔNG `DROP`/`DELETE`/`TRUNCATE`/`ALTER`.
//   Toàn bộ tệp này **CHỈ ĐỌC** dữ liệu: KHÔNG INSERT/UPDATE/DELETE/ALTER/DROP/TRUNCATE vào CSDL
//   (mọi thao tác ghi vẫn đi qua `action(...)` có sẵn của ứng dụng, không đổi gì).
//
// NGUỒN CỘT (đã đo bằng dữ liệu THẬT, không suy đoán): `docs/agent-progress/P01-TAB-SPEC.md` mục 2
//   — «Cột hiển thị mỗi tab»: tab PR dùng cột của phần PR (MR + `supplyStatus` + `approvalStage`);
//     tab PO dùng 6 cột của phần PO (`poNo` · `supplierId` · `orderedAt` · `eta` · `status` · `totalValue`).
// NGUỒN 6 CHIỀU LỌC: `docs/25_TODO_ROADMAP.md` dòng `P-03`
//   — «Lọc theo Trạng thái · Ngày · Phòng ban · Người tạo · NCC · Dự án».

// ════════════════════════════════════════════════════════════════════════════════════════════════════
// VÒNG 211 · MỤC 1.4 — TAB THỨ 3 «CHI TIẾT LŨY KẾ THEO VẬT TƯ» (yêu cầu USER từ ảnh chụp màn hình)
// ════════════════════════════════════════════════════════════════════════════════════════════════════
//
// CHỈ ĐẠO CŨ 21/09: «bỏ P-01 không tách MR PR PO nữa mà chỉ còn PR và PO thôi» ⇒ dải tab 2 tab.
// ⛔ ĐÃ BỊ CHỈ ĐẠO MỚI HƠN THAY THẾ (một phần): USER vòng 211 yêu cầu thêm tab thứ 3.
// ⇒ Dải tab nay là 3: `PR` · `PO` · `Chi tiết lũy kế theo vật tư`.
//    ⚠️ `MR` vẫn KHÔNG quay lại — chỉ đạo 21/09 giữ nguyên phần này, và test vẫn cấm nhãn chứa `MR`.
//
// VÌ SAO ĐƯỢC GỘP ĐƯỢC VÀO CÙNG DẢI: tab 3 KHÔNG phải một chứng từ nữa — nó là BẢNG TỔNG HỢP
// suy ra từ BOQ/Hợp đồng (`data.boqItems`), KHÔNG có `requestNo`/`poNo` riêng. Nên nó không vi phạm
// ý «chỉ còn PR và PO» của chỉ đạo 21/09 (ý đó là bỏ tách chứng từ MR/PR/PO thành 3 tab).
//
// 📌 BẢNG NÀY ĐÃ TỒN TẠI Ở CUỐI MÀN từ trước (mục này KHÔNG phải tính năng mới, chỉ là CHUYỂN VỊ TRÍ:
//   từ «bảng lũy kế treo dưới màn, không ai tìm thấy» ⇒ thành TAB thứ 3 trên dải). Nội dung không đổi,
//   chỉ bổ sung 2 cột có số liệu thật (đo 02/10/2026: `orderedNotReceivedQty` 1/32 dòng, `issuedQty` 5/32).
//   ⛔ CỐ Ý KHÔNG thêm: `installedQty` (0/32 dòng có số ⇒ cột toàn 0), `varianceContract`/`varianceRemeasured`
//   (tổng −5911, toàn giá trị ÂM nên không có quy ước hiển thị), `variationStatus` (20 `none` + 12 null),
//   `mappingStatus` (là trường vệ sinh dữ liệu, không thuộc chuỗi mua hàng). Đo trước, không bịa cột.
// ════════════════════════════════════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════════════════════════════════════

import { DataTable, StatusBadge } from "@/app/components/ui";
import { ListToolbar } from "@/app/components/ui/ListToolbar";
import { downloadBoqPriceTemplateXlsx } from "@/lib/boq-export";
import { parseSpreadsheetRows } from "@/lib/material-import";
import { BOQ_SYSTEM_CODES, CardHead, Empty, Kpi, boqControlQty, boqSystemName, downloadBlankPoPlanningTemplate, downloadPoPlanningTemplate, format, mapBoqPriceRows, moneyBillion, normalizeBoqSystemCode } from "@/lib/ui-shared";
// PHASE 2 (§21) — mở màn chi tiết PO từ màn Mua hàng; số liệu đối soát lấy từ hàm thuần dùng chung.
import { deliveryProgress, numeric } from "@/lib/p2-po-trace";
import type { AppData, Row } from "@/lib/ui-shared";
import { Fragment, useMemo, useState } from "react";

// ─────────── P-01: DẢI TAB — 2 TAB CHỨNG TỪ (PR · PO) + 1 TAB TỔNG HỢP (MAT) ───────────
type TabKey = "PR" | "PO" | "MAT";
type TabDef = { key: TabKey; label: string; source: "requests" | "purchaseOrders" | "boqItems"; note: string };
const PURCHASING_TABS: TabDef[] = [
  { key: "PR", label: "PR", source: "requests", note: "Phiếu đề nghị mua hàng — nguồn bảng `material_requests`" },
  { key: "PO", label: "PO", source: "purchaseOrders", note: "Đơn mua hàng — nguồn bảng `purchase_orders`" },
  { key: "MAT", label: "Chi tiết lũy kế theo vật tư", source: "boqItems", note: "Bảng tổng hợp theo vật tư — nguồn bảng `project_boq_items` (BOQ/Hợp đồng); KHÔNG phải chứng từ, KHÔNG áp 6 chiều lọc của PR/PO" },
];
const PURCHASING_DEFAULT_TAB: TabKey = "PR";

// ─────────── P-01: CỘT MỖI TAB — nguồn `docs/agent-progress/P01-TAB-SPEC.md` mục 2 ───────────
type ColDef = { key: string; header: string };
const PURCHASING_PR_COLUMNS: ColDef[] = [
  { key: "requestNo", header: "Số phiếu" },
  { key: "projectCode", header: "Dự án" },
  { key: "requestedBy", header: "Người đề nghị" },
  { key: "requestedAt", header: "Ngày đề nghị" },
  { key: "neededAt", header: "Cần có" },
  { key: "status", header: "Trạng thái" },
  { key: "itemCount", header: "Số dòng" },
  { key: "totalEstimatedValue", header: "Giá trị dự kiến" },
  { key: "supplyStatus", header: "Giai đoạn cung ứng" },
  { key: "approvalStage", header: "Bước duyệt" },
];
const PURCHASING_PO_COLUMNS: ColDef[] = [
  { key: "poNo", header: "Mã PO" },
  { key: "supplierId", header: "Nhà cung cấp" },
  { key: "orderedQty", header: "Đã đặt" },
  { key: "receivedQty", header: "Đã nhận" },
  { key: "remainingQty", header: "Còn lại" },
  { key: "orderedAt", header: "Ngày đặt" },
  { key: "eta", header: "ETA" },
  { key: "status", header: "Trạng thái" },
  { key: "totalValue", header: "Tổng giá trị" },
];

// ─────────── P-02: SẮP XẾP — mặc định `created DESC`; Completed/Rejected xuống cuối ───────────
const FINAL_STATUSES = ["completed", "completed_with_exceptions", "rejected", "cancelled"];
const PURCHASING_SORTS = [
  { value: "created_desc", label: "Mới nhất" },
  { value: "created_asc", label: "Cũ nhất" },
];
const PURCHASING_DEFAULT_SORT = "created_desc";
// MỤC 4 (VÒNG 1 GO-LIVE) — nhãn rút gọn về đúng 2 lựa chọn người dùng yêu cầu.
// ⛔ KHÔNG tự chế nhãn mới ở đây: `SORT_LABEL` SUY RA từ `PURCHASING_SORTS` (D-092) — trước đây
// có 2 bản chữ nhãn riêng nên sửa một bên là lệch bên kia (nhãn dropdown ≠ nhãn dưới thanh công cụ).
const SORT_LABEL: Record<string, string> = Object.fromEntries(PURCHASING_SORTS.map((s) => [s.value, s.label]));
const isFinalStatus = (value: unknown) => FINAL_STATUSES.includes(String(value ?? "").toLowerCase());
/** `created DESC` — bản mới nhất lên đầu; nhóm Completed/Rejected LUÔN xuống cuối (vẫn mới nhất trước).
 *  `ascending=true` ⇒ ĐẢO CHIỀU NGÀY trong TỪNG nhóm, nhưng nhóm «kết thúc» VẪN nằm CUỐI (không đảo cả mảng).
 *  Dòng thiếu/hỏng `createdAt` KHÔNG bị ném lỗi và KHÔNG bị mất: xếp SAU dòng có ngày hợp lệ. */
function sortCreatedDesc<T extends Row>(rows: T[], ascending = false): T[] {
  const at = (row: Row) => { const t = Date.parse(String(row.createdAt ?? "")); return Number.isFinite(t) ? t : null; };
  return [...(rows || [])].sort((a, b) => {
    const finalDiff = (isFinalStatus(a.status) ? 1 : 0) - (isFinalStatus(b.status) ? 1 : 0);
    if (finalDiff !== 0) return finalDiff;               // Completed/Rejected luôn xuống cuối
    const ta = at(a); const tb = at(b);
    if (ta === null && tb === null) return 0;            // cả hai thiếu ngày ⇒ giữ nguyên thứ tự
    if (ta === null) return 1;                           // thiếu ngày ⇒ xuống sau
    if (tb === null) return -1;
    return ascending ? ta - tb : tb - ta;
  });
}

// ─────────── P-03: 6 CHIỀU LỌC — nguồn `docs/25_TODO_ROADMAP.md` dòng `P-03` ───────────
type FilterDim = { key: string; label: string; source: string };
const PURCHASING_FILTER_DIMENSIONS: FilterDim[] = [
  { key: "status", label: "Trạng thái", source: "PO: `purchase_orders.status` · PR: `material_requests.status` + `material_requests.supply_status` (phiếu đề nghị có 2 trạng thái: duyệt và cung ứng)" },
  { key: "date", label: "Ngày", source: "PR: `material_requests.requested_at` · PO: `purchase_orders.ordered_at` · lọc trên `created_at` khi đã chọn khoảng ngày" },
  { key: "department", label: "Phòng ban", source: "`data.staffDirectory[]` — tra theo người đề nghị: `organizationName` (đơn vị canonical) lùi về `department`" },
  { key: "creator", label: "Người tạo", source: "PR: `material_requests.requestedBy` · PO: `purchase_orders.orderedAt` (màn chưa có trường người tạo đơn riêng)" },
  { key: "supplier", label: "NCC", source: "PO: `purchase_orders.supplierName` (đối chiếu `supplierId` trong danh mục NCC)" },
  { key: "project", label: "Dự án", source: "`projectId` (PR: `material_requests.project_id` · PO: `purchase_orders.project_id`) — theo phạm vi dự án đang chọn: \"Tất cả\" hoặc một dự án cụ thể (không trộn dự án ngoài phạm vi đang chọn)" },
];
/** P-03/b — chiều «Ngày» lọc **2 CỘT THẬT KHÁC NHAU**: PR theo ngày đề nghị, PO theo ngày đặt.
 *  Logic nằm ở `purchasingRowDate`; nhãn dưới đây phải khớp logic đó, và phải hiện ra trên UI
 *  (yêu cầu P-03/b: «2 cột thật khác nhau, ghi rõ trên UI») — nếu không, người dùng tưởng
 *  cả 2 tab lọc cùng một cột ngày nên không hiểu vì sao kết quả 2 tab lệch nhau. */
const PURCHASING_DATE_DIM = {
  PR: { from: "Ngày đề nghị (từ)", to: "Ngày đề nghị (đến)", field: "requestedAt", plain: "ngày đề nghị" },
  PO: { from: "Ngày đặt (từ)", to: "Ngày đặt (đến)", field: "orderedAt", plain: "ngày đặt hàng" },
} as const;
type FilterState = { status: string; supplyStatus: string; dateFrom: string; dateTo: string; department: string; creator: string; supplier: string; project: string };
const EMPTY_PURCHASING_FILTERS: FilterState = { status: "ALL", supplyStatus: "ALL", dateFrom: "", dateTo: "", department: "ALL", creator: "ALL", supplier: "ALL", project: "ALL" };
const PR_STATUS_LABEL: Record<string, string> = {
  pending_approval: "Chờ duyệt", approved: "Đã duyệt", rejected: "Từ chối", cancelled: "Đã huỷ",
  approval_pending: "Chờ duyệt", awaiting_bch_confirmation: "Chờ BCH xác nhận", awaiting_po: "Chờ lập PO",
  partial_delivery: "Giao một phần", completed: "Hoàn thành",
};
const PO_STATUS_LABEL: Record<string, string> = {
  pending_approval: "Chờ duyệt", waiting_delivery: "Chờ giao", partial_delivery: "Giao một phần",
  delivered_pending_confirmation: "Chờ BCH xác nhận", completed: "Đã giao đủ", completed_with_exceptions: "Đã giao đủ",
  rejected: "Từ chối", cancelled: "Đã huỷ",
};
// MT2 §6.9 — ⛔ ĐÃ XOÁ `purchasingStatusLabel`: nó tra `PR_STATUS_LABEL` rồi **lùi về** `PO_STATUS_LABEL`,
// nghĩa là một giá trị của PR không có nhãn PR sẽ bị dán nhãn của **PO** — đúng cái “trộn” mà §6.9 cấm.
// Nay tách 3 hàm: `purchasingPrStatusLabel` (hồ sơ PR) · `purchasingSupplyStatusLabel` (giai đoạn cung ứng)
// · `statusOptionLabel` (trong component, theo đúng loại dòng) ⇒ ⛔ không còn đường trộn nào.

// ─────────── MT2 §6.9 — TÁCH BẠCH 3 TRỤC, ⛔ KHÔNG TRỘN `PR status` VỚI `Approval step` ───────────
// Nguyên văn yêu cầu (`docs/dsh/MASTER_TASK_2.md:161-162`): “cột bước duyệt hiển thị sai · cột trạng thái
// bị trộn · trạng thái `issued` không phù hợp … ⛔ Không trộn `PR status` với `Approval step`.”
// Vì sao phải tách hàm: `purchasingStatusLabel` tra `PR_STATUS_LABEL` **rồi lùi về** `PO_STATUS_LABEL`
// ⇒ một giá trị của PR mà PR không có nhãn sẽ bị dán nhãn của **PO** (đúng lỗi “trộn” của §6.9).
/** Trạng thái HỒ SƠ của phiếu đề nghị — CHỈ tra `PR_STATUS_LABEL`, ⛔ KHÔNG lùi về nhãn PO. */
const purchasingPrStatusLabel = (value: unknown) => {
  const raw = String(value ?? "");
  return PR_STATUS_LABEL[raw] || raw || "—";
};
// Giai đoạn CUNG ỨNG của phiếu là trục THỨ BA, ⛔ không dùng chung nhãn với `status`.
// ⚠️ `issued` CỐ Ý không có nhãn: MT2 §6.9 chốt nghiệp vụ PR kết thúc ở `completed`
//    ⇒ ⛔ KHÔNG tự thêm state `Issued` cho PR. Giá trị lạ hiện NGUYÊN VĂN (minh bạch, ⛔ không bịa nhãn).
const SUPPLY_STATUS_LABEL: Record<string, string> = {
  approval_pending: "Chờ duyệt", awaiting_bch_confirmation: "Chờ BCH xác nhận", awaiting_po: "Chờ lập PO",
  waiting_delivery: "Chờ giao", partial_delivery: "Giao một phần", completed: "Hoàn thành",
  rejected: "Từ chối", cancelled: "Đã huỷ",
};
const purchasingSupplyStatusLabel = (value: unknown) => {
  const raw = String(value ?? "");
  return SUPPLY_STATUS_LABEL[raw] || raw || "—";
};
/** BƯỚC DUYỆT — hiển thị **TÊN bước** (nguồn `data.approvalStages` = `approval_stage_catalog`),
 *  KHÔNG hiển thị con số trần. Thiếu cấu hình thì lùi về «Bước N» (⛔ không bịa tên bước). */
const purchasingApprovalStageLabel = (row: Row, data: AppData) => {
  const stage = row.approvalStage;
  if (stage === undefined || stage === null || stage === "") return "—";
  const config = (data.approvalStages || []).find((item) => Number(item.stageNo) === Number(stage));
  const name = String(config?.name || "").trim();
  return name || `Bước ${stage}`;
};

/** Dòng nào là PO (có `poNo`) — dùng để chọn đúng cột ngày: PO `ordered_at`, PR `requested_at`. */
const isPurchaseOrderRow = (row: Row) => Boolean(row.poNo) || (row.status !== undefined && row.supplierName !== undefined);
/** Ngày của dòng: PO theo `orderedAt`, PR theo `requestedAt`; khi đã chọn khoảng thì ưu tiên `createdAt`. */
const purchasingRowDate = (row: Row) => isPurchaseOrderRow(row) ? (row.orderedAt ?? row.createdAt) : (row.requestedAt ?? row.createdAt);
const datePart = (value: unknown) => String(value ?? "").slice(0, 10);
/** Tra phòng ban THẬT của người đề nghị qua `staffDirectory` (KHÔNG bịa cột `department` trên phiếu). */
const purchasingDepartmentOf = (row: Row, data: AppData) => {
  const name = String(row.requestedBy ?? "").trim().toLocaleLowerCase("vi");
  if (!name) return "";
  const match = (data.staffDirectory || []).find((u) => String(u.fullName ?? "").trim().toLocaleLowerCase("vi") === name);
  return String(match?.organizationName || match?.department || "");
};
const purchasingCreatorOf = (row: Row) => String(row.requestedBy || row.buyerName || "");
/** Dòng nào là PR (phiếu đề nghị) — luôn là dòng KHÔNG phải PO. */
// MT2 §6.9 — `isPurchaseRequestRow` đã BỎ: nó chỉ tồn tại để bộ lọc «Trạng thái» khớp chéo sang
// `supplyStatus` (đúng cái “trộn 2 trục” mà §6.9 cấm). Nay lọc tách bạch ⇒ ⛔ không còn chỗ dùng (dead code, §27).
/** Lựa chọn của 3 chiều `select` (Phòng ban · Người tạo · NCC) được suy từ CHÍNH dữ liệu đang có — không hard-code. */
function purchasingChoiceOptions(values: unknown[], allValue: string, allLabel: string): { value: string; label: string }[] {
  const distinct = [...new Set(
    // Danh sách lựa chọn suy từ dữ liệu đang có: gom giá trị phân biệt của chính các dòng trong phạm vi đang chọn.
    (values || []).map((v) => String(v || "")).filter(Boolean),
  )].sort();
  return [{ value: allValue, label: allLabel }, ...distinct.map((value) => ({ value, label: value.toUpperCase() }))];
}
/** 6 chiều lọc — hàm THUẦN, không sửa mảng đầu vào. */
function filterPurchasingRows(rows: Row[], filters?: Partial<FilterState>, data: AppData = { staffDirectory: [], users: [], requests: [], purchaseOrders: [] } as unknown as AppData): Row[] {
  const f = { ...EMPTY_PURCHASING_FILTERS, ...(filters || {}) } as FilterState;
  return (rows || []).filter((row) => {
    // Chiều 1 · Trạng thái: PR có 2 trạng thái thật (`status` của phiếu + `supply_status` cung ứng) · PO chỉ `status`.
    if (f.supplyStatus !== "ALL" && String(row.supplyStatus) !== f.supplyStatus) return false;
    // MT2 §6.9 — ⛔ KHÔNG trộn 2 trục: lọc «Trạng thái» chỉ so `status`; «Giai đoạn cung ứng» so `supplyStatus` (dòng trên).
    if (f.status !== "ALL" && String(row.status) !== f.status) return false;
    const day = datePart(purchasingRowDate(row));
    if (f.dateFrom && (!day || day < f.dateFrom)) return false;
    if (f.dateTo && (!day || day > f.dateTo)) return false;
    if (f.department !== "ALL" && purchasingDepartmentOf(row, data) !== f.department) return false;
    if (f.creator !== "ALL" && purchasingCreatorOf(row) !== f.creator) return false;
    if (f.supplier !== "ALL" && String(row.supplierName || row.supplierId || "") !== f.supplier) return false;
    if (f.project !== "ALL" && String(row.projectId || "") !== f.project) return false;
    return true;
  });
}
const prListFor = (data: AppData) => (data.requests || []) as Row[];
const poListFor = (data: AppData) => (data.purchaseOrders || []) as Row[];
const purchasesForTab = (tab: string, data: AppData) => tab === "PR" ? prListFor(data) : tab === "PO" ? poListFor(data) : [];
/** Danh sách 1 tab sau LỌC (6 chiều) rồi SẮP XẾP (`created DESC` mặc định) — dùng trong màn và trong test. */
function buildPurchasingList({ tab, data, filters, sortKey }: { tab: TabKey; data: AppData; filters?: Partial<FilterState>; sortKey?: string }): Row[] {
  const rows = filterPurchasingRows(purchasesForTab(tab, data), filters, data);
  // `created_desc` (mặc định) và `created_asc` đều giữ nhóm Completed/Rejected ở CUỐI; chỉ đảo chiều ngày trong nhóm.
  return sortCreatedDesc(rows, sortKey === "created_asc");
}

// ─────────── VÒNG 211 · MỤC 1.4 — NGUỒN DỮ LIỆU TAB 3 (hàm thuần, có test) ───────────
// ⛔ CỐ Ý KHÔNG chạy qua `filterPurchasingRows`: 6 chiều lọc (Trạng thái · Ngày · Phòng ban · Người tạo · NCC ·
//    Dự án) lấy từ CỘT CỦA CHỨNG TỪ PR/PO. Dòng BOQ không có `status`, không có `requestedAt`/`orderedAt`,
//    không có `supplierName` ⇒ áp bộ lọc sẽ **xoá sạch** mọi dòng. Tab 3 chỉ lọc theo PHẠM VI DỰ ÁN,
//    đúng như tài liệu cũ của bảng này («KHÔNG bị bộ lọc và 2 tab PR/PO tác động») — giữ nguyên nghĩa đó.
/** Dòng của tab 3 — lấy từ `data.boqItems`, chỉ giới hạn theo phạm vi dự án và chỉ 2 loại dòng vật tư. */
function buildMaterialCumulativeRows({ data, project }: { data: AppData; project: string }): Row[] {
  return (data.boqItems || []).filter(
    (row) =>
      (project === "ALL" || row.projectId === project) &&
      ["material", "component"].includes(String(row.rowRole || "material")),
  );
}
function Purchasing({ data, project, open, action, canUse }: { data: AppData; project: string; open: (name: string, row?: Row) => void; action:(name:string,payload:Row)=>Promise<boolean>; canUse: boolean }) {
  const [activeTab,setActiveTab]=useState<TabKey>(PURCHASING_DEFAULT_TAB);
  const [purchasingFilters,setPurchasingFilters]=useState<FilterState>(EMPTY_PURCHASING_FILTERS);
  const [purchasingSort,setPurchasingSort]=useState<string>(PURCHASING_DEFAULT_SORT);
  const setFilter=(patch:Partial<FilterState>)=>setPurchasingFilters((current)=>({...current,...patch}));
  // 2 o ngay CHI co o 2 tab chung tu; tab 3 lay du lieu tu BOQ (khong co cot ngay) => dateDim null => khong ve o nao (khong bia chieu loc).
  const dateDim=(activeTab==="PR"||activeTab==="PO")?PURCHASING_DATE_DIM[activeTab]:null;
  const requests=prListFor(data).filter((row)=>project==="ALL"||row.projectId===project); const pos=poListFor(data).filter((row)=>project==="ALL"||row.projectId===project); const boqRows=buildMaterialCumulativeRows({data,project}); const selected=project==="ALL"?null:data.projects.find((row)=>row.id===project);
  // P-01/P-02/P-03 — danh sách theo tab: PR = material_requests · PO = purchase_orders; qua 6 chiều lọc rồi `created DESC`.
  const tabRows=useMemo(()=>{
    const scopedProject={...purchasingFilters,project:project==="ALL"?purchasingFilters.project:project};
    return {
      PR:buildPurchasingList({tab:"PR",data:{...data,requests},filters:scopedProject,sortKey:purchasingSort}),
      PO:buildPurchasingList({tab:"PO",data:{...data,purchaseOrders:pos},filters:scopedProject,sortKey:purchasingSort}),
    };
  },[data,requests,pos,purchasingFilters,purchasingSort,project]);
  const visiblePR=tabRows.PR; const visiblePO=tabRows.PO; const visibleMAT=boqRows;
  // Số đếm trên nhãn tab = số dòng CÒN LẠI sau 6 chiều lọc của CHÍNH tab đó (không hard-code);
  // tab PR luôn đọc `counts.PR`, tab PO luôn đọc `counts.PO`, đi qua `format.format` (định dạng vi-VN).
  const counts = { PR: visiblePR.length, PO: visiblePO.length, MAT: visibleMAT.length };
  const optionsFrom=(values:string[],allLabel:string)=>({options:purchasingChoiceOptions(values,"ALL",allLabel)});
  // MT2 §6.9 — nhãn bộ lọc «Trạng thái» phải theo ĐÚNG LOẠI DÒNG chứa giá trị đó:
  //   giá trị chỉ có ở PR ⇒ nhãn PR · chỉ có ở PO ⇒ nhãn PO · có ở CẢ HAI ⇒ hiện CẢ HAI nhãn
  //   (⛔ KHÔNG chọn bừa một nhãn — chính là cái “trộn” mà §6.9 cấm).
  const statusOptionLabel = (value: string) => {
    const labels = new Set<string>();
    if (requests.some((row) => String(row.status || "") === value)) labels.add(PR_STATUS_LABEL[value] || value);
    if (pos.some((row) => String(row.status || "") === value)) labels.add(PO_STATUS_LABEL[value] || value);
    return labels.size ? [...labels].join(" / ") : value;
  };
  const statusOptions = [...new Set([...requests, ...pos].map((row) => String(row.status || "")).filter(Boolean))]
    .sort((a, b) => statusOptionLabel(a).localeCompare(statusOptionLabel(b), "vi"))
    .map((value) => ({ value, label: statusOptionLabel(value) }));
  const departmentOptions=optionsFrom(requests.map((row)=>purchasingDepartmentOf(row,data)),"Tất cả phòng ban").options;
  const creatorOptions=optionsFrom(requests.map(purchasingCreatorOf),"Tất cả người tạo").options;
  const supplierOptions=optionsFrom(pos.map((row)=>String(row.supplierName||row.supplierId||"")),"Tất cả NCC").options;
  const contractRows=boqRows.filter((row)=>row.itemType!=="outside_contract"); const contract=contractRows.reduce((sum,row)=>sum+Number(row.contractQty||0)*Number(row.unitPrice||0),0); const ordered=contractRows.reduce((sum,row)=>sum+Math.min(Number(row.contractQty||0),Number(row.orderedQty||0))*Number(row.unitPrice||0),0); const received=contractRows.reduce((sum,row)=>sum+Math.min(Number(row.contractQty||0),Number(row.receivedQty||0))*Number(row.unitPrice||0),0); const paid=data.contractPayments.filter((row)=>project==="ALL"||row.projectId===project).reduce((sum,row)=>sum+Number(row.amount||0),0); const efficiency=ordered>0?Math.min(100,received/ordered*100):0;
  const [pricePreview,setPricePreview]=useState<Row[]>([]); const [priceFileName,setPriceFileName]=useState("");
  async function importPrices(file?:File){if(!file||!selected)return;try{const updates=mapBoqPriceRows(await parseSpreadsheetRows(file),boqRows);setPricePreview(updates);setPriceFileName(file.name);}catch(error){setPricePreview([]);window.alert(error instanceof Error?error.message:"Không đọc được file đơn giá hợp đồng.");}}
  async function confirmPrices(){if(!selected||!pricePreview.length)return;const ok=await action("update_boq_contract_prices",{projectId:selected.id,sourceFileName:priceFileName,updates:pricePreview.map(({boqItemId,sourceOrder,unitPrice})=>({boqItemId,sourceOrder,unitPrice}))});if(ok){setPricePreview([]);setPriceFileName("");}}
  const systemRows=BOQ_SYSTEM_CODES.map((code)=>{const rows=boqRows.filter((row)=>normalizeBoqSystemCode(row.systemCode||row.customFields?.systemCode)===code);const c=rows.filter((row)=>row.itemType!=="outside_contract");const a=c.reduce((sum,row)=>sum+Number(row.contractQty||0)*Number(row.unitPrice||0),0);const b=c.reduce((sum,row)=>sum+Math.min(Number(row.contractQty||0),Number(row.orderedQty||0))*Number(row.unitPrice||0),0);const r=c.reduce((sum,row)=>sum+Math.min(Number(row.contractQty||0),Number(row.receivedQty||0))*Number(row.unitPrice||0),0);return{code,name:boqSystemName(code),a,b,r,pct:b?Math.min(100,r/b*100):0};}).filter((row)=>row.a||row.b||row.r||project==="ALL");
  const doc={projectCode:selected?.code,projectName:selected?.name,contractNo:selected?.contractNo,rows:boqRows,fieldConfigs:data.formFieldConfigs};
  return <div className="stack module-screen purchasing-screen baseline-screen"><div className="kpi-grid"><Kpi icon="MR" label="Phiếu đề nghị (PR)" value={format.format(counts.PR)} note="Nguồn: material_requests · đề nghị mua hàng"/><Kpi icon="PO" label="PO chờ giao" value={format.format(pos.filter((row)=>!["completed","completed_with_exceptions"].includes(String(row.status))).length)} note="Theo trạng thái đơn hàng" tone="violet"/><Kpi icon="DG" label="PO đang giao" value={format.format(pos.filter((row)=>String(row.status).includes("partial")||String(row.status).includes("delivery")).length)} note="Đang cập nhật giao hàng" tone="amber"/><Kpi icon="GT" label="Tổng giá trị đối chiếu" value={moneyBillion(contract)} note="Theo BOQ/Hợp đồng" tone="green"/></div>
    <section className="card purchase-cumulative-card"><div className="purchase-cumulative-head"><div><h2>LŨY KẾ MUA HÀNG ĐỐI CHIẾU BOQ/HỢP ĐỒNG</h2><p>Số liệu tính đến ngày {new Intl.DateTimeFormat("vi-VN").format(new Date())}</p></div></div><div className="purchase-summary-metrics"><article><small>TỔNG GIÁ TRỊ HỢP ĐỒNG (A)</small><strong>{moneyBillion(contract)}</strong><i><b style={{width:"100%"}}/></i><span>100% · Hợp đồng</span></article><article><small>GIÁ TRỊ ĐỐI CHIẾU (B)</small><strong>{moneyBillion(ordered)}</strong><i><b style={{width:`${contract?Math.min(100,ordered/contract*100):0}%`}}/></i><span>{contract?(ordered/contract*100).toLocaleString("vi-VN",{maximumFractionDigits:2}):"0"}% · B/A</span></article><article><small>ĐÃ NHẬN HÀNG (C)</small><strong>{moneyBillion(received)}</strong><i><b style={{width:`${contract?Math.min(100,received/contract*100):0}%`}}/></i><span>{contract?(received/contract*100).toLocaleString("vi-VN",{maximumFractionDigits:2}):"0"}% · C/A</span></article><article><small>THANH TOÁN (D)</small><strong>{moneyBillion(paid)}</strong><i><b style={{width:`${contract?Math.min(100,paid/contract*100):0}%`}}/></i><span>{contract?(paid/contract*100).toLocaleString("vi-VN",{maximumFractionDigits:2}):"0"}% · D/A</span></article><div className="purchase-efficiency-columns"><div><i className="received" style={{height:`${Math.max(6,efficiency)}%`}}/><strong>{efficiency.toLocaleString("vi-VN",{maximumFractionDigits:2})}%</strong><span>Đã nhận / Đối chiếu</span></div><div><i className="remaining" style={{height:`${Math.max(6,100-efficiency)}%`}}/><strong>{Math.max(0,100-efficiency).toLocaleString("vi-VN",{maximumFractionDigits:2})}%</strong><span>Còn lại</span></div></div></div></section>
    <div className="purchase-action-bar"><button className="secondary" onClick={()=>selected?downloadBoqPriceTemplateXlsx(doc):window.alert("Hãy chọn một dự án cụ thể.")}>⇩ TẢI MẪU ĐƠN GIÁ HĐ</button><label className={`secondary file-inline ${!selected||!canUse?"is-disabled":""}`}>⇧ NHẬP ĐƠN GIÁ HĐ<input type="file" accept=".xlsx,.csv" disabled={!selected||!canUse} onChange={(e)=>{void importPrices(e.target.files?.[0]);e.target.value="";}}/></label><button className="secondary" onClick={()=>requests[0]?downloadPoPlanningTemplate(data,requests[0]):downloadBlankPoPlanningTemplate(data)}>⇩ TẢI MẪU PO</button><button className="secondary" disabled={!requests[0]} onClick={()=>requests[0]&&open("po",requests[0])}>⇧ NHẬP PO EXCEL</button><button className="primary" disabled={!canUse||!requests[0]} onClick={()=>requests[0]&&open("po",requests[0])}>＋ PHÁT HÀNH PO</button></div>
    {/* P-01 (TASK-119) — DẢI 3 TAB: `PR` · `PO` · `Chi tiết lũy kế theo vật tư` (KHÔNG còn tab `MR`; tab 3 là BẢNG TỔNG HỢP, không phải chứng từ). Số đếm trên nhãn tab tính trên CHÍNH tập đã lọc.
        Nguồn cột: `docs/agent-progress/P01-TAB-SPEC.md` mục 2. Nguồn 6 chiều lọc: `docs/25_TODO_ROADMAP.md` dòng `P-03`. */}
    <section className="card purchasing-tabs-card" data-vntech="purchasing-tabs">
      <div className="project-scope-tabs" role="tablist" aria-label="Mua hàng — PR · PO · Chi tiết lũy kế theo vật tư">
        {PURCHASING_TABS.map((tab)=><button key={tab.key} type="button" role="tab" className={activeTab===tab.key?"active":""} aria-selected={activeTab===tab.key} data-vntech="purchasing-tab" data-vntech-tab={tab.key} title={tab.note} onClick={()=>setActiveTab(tab.key)}>{tab.label}<span data-vntech="purchasing-tab-count">{format.format(counts[tab.key])}</span></button>)}
      </div>
      <ListToolbar
        title={activeTab==="MAT"?"CHI TIẾT LŨY KẾ THEO VẬT TƯ":`DANH SÁCH ${activeTab==="PR"?"PHIẾU ĐỀ NGHỊ MUA (PR)":"ĐƠN MUA (PO)"}`}
        note={activeTab==="MAT"?"Tổng hợp từ BOQ/Hợp đồng trong phạm vi dự án đang chọn — KHÔNG áp 6 chiều lọc của tab PR/PO (dòng BOQ không có cột trạng thái/ngày/NCC của chứng từ) và KHÔNG sắp xếp theo ngày tạo.":`Sắp xếp mặc định: ${SORT_LABEL[purchasingSort]||SORT_LABEL.created_desc}. Phiếu Hoàn thành hoặc Từ chối luôn xuống cuối danh sách.`}
        count={counts[activeTab]}
        total={activeTab==="MAT"?boqRows.length:(activeTab==="PR"?requests.length:pos.length)}
        unit={activeTab==="MAT"?"vật tư":(activeTab==="PR"?"phiếu PR":"đơn PO")}
        filters={[
          { key:"status", label:"Trạng thái", value:purchasingFilters.status, onChange:(v)=>setFilter({status:v}), options:[{value:"ALL",label:"Tất cả trạng thái"},...statusOptions] },
          // Chiều «Ngày» (2 ô) + «Phòng ban» · «Người tạo» · «NCC»; lựa chọn của 3 chiều `select` suy từ dữ liệu đang có.
          // ⛔ KHÔNG gộp nhãn: 2 tab lọc 2 cột ngày KHÁC NHAU (P-03/b) ⇒ nhãn đổi theo tab đang mở.
          // CHI ve 2 o ngay o 2 tab chung tu; tab 3 lay du lieu BOQ nen khong co o ngay nao de loc.
          ...(dateDim ? [
            { key:"dateFrom", label:dateDim.from, value:purchasingFilters.dateFrom, onChange:(v:string)=>setFilter({dateFrom:v}), options:[{value:"",label:"Tất cả"}] },
            { key:"dateTo", label:dateDim.to, value:purchasingFilters.dateTo, onChange:(v:string)=>setFilter({dateTo:v}), options:[{value:"",label:"Tất cả"}] },
          ] : []),
          { key:"department", label:"Phòng ban", value:purchasingFilters.department, onChange:(v)=>setFilter({department:v}), options:departmentOptions },
          { key:"creator", label:"Người tạo", value:purchasingFilters.creator, onChange:(v)=>setFilter({creator:v}), options:creatorOptions },
          { key:"supplier", label:"NCC", value:purchasingFilters.supplier, onChange:(v)=>setFilter({supplier:v}), options:supplierOptions },
        ]}
        sort={{ value:purchasingSort, onChange:setPurchasingSort, options:PURCHASING_SORTS }}
        actions={<button className="secondary" type="button" onClick={()=>{setPurchasingFilters(EMPTY_PURCHASING_FILTERS);setPurchasingSort(PURCHASING_DEFAULT_SORT);}}>↺ ĐẶT LẠI LỌC/SẮP XẾP</button>}
        extra={<div className="list-toolbar-field" data-vntech="purchasing-filter-dims" title={PURCHASING_FILTER_DIMENSIONS.map((d)=>`${d.label}: ${d.source}`).join(" · ")}><span>Chiều lọc</span><em>{PURCHASING_FILTER_DIMENSIONS.length} chiều</em>{PURCHASING_FILTER_DIMENSIONS.map((d)=><span key={d.key} className="chip" data-vntech="purchasing-filter-dim" data-dim={d.key} data-source={d.source}>{d.label}</span>)}</div>}
      />
      {/* MỤC 3 (VÒNG 1 GO-LIVE) — đã bỏ 2 đoạn văn bản thừa nằm ngay dưới nhóm nút:
          (1) mô tả lại bộ lọc «Trạng thái · Ngày · Phòng ban · …» — lặp đúng thanh công cụ ngay phía trên;
          (2) giải thích chữ tắt PR/PO + câu «chỉ ĐỌC» + lịch sử phiên bản — ghi chuyển phiên bản còn nằm trong giao diện.
          Giữ lại DUY NHẤT cảnh báo bên dưới: PR và PO lọc ngày theo hai cột khác nhau, đây là thông tin
          dùng để truy vết — thiếu nó thì chênh lệch số dòng sẽ bị báo nhầm là lỗi.
          ⚠️ Vì sao phải bọc trong ngoặc nhọn: comment dạng gạch chéo đứng TRỰC TIẾP giữa các phần
          tử con JSX KHÔNG phải comment mà là TEXT NODE ⇒ chữ sẽ bị vẽ thẳng ra màn hình.
          Đã xảy ra đúng lỗi đó, xem D-105. */}
      {dateDim&&<p className="purchasing-tab-note" data-vntech="purchasing-date-dim-note"><small>⚠️ PR và PO lọc ngày theo <strong>hai cột ngày khác nhau</strong> — cùng một khoảng ngày có thể ra số dòng khác nhau; đó là đúng dữ liệu, không phải lỗi. Dòng nào thiếu cột ngày thì lấy ngày tạo bản ghi.</small></p>}
      {activeTab==="PR"&&<div className="table-wrap" role="tabpanel" data-vntech="purchasing-pr-table" aria-label="Danh sách phiếu đề nghị mua hàng (PR)">{visiblePR.length?<table className="data-table"><thead><tr>{PURCHASING_PR_COLUMNS.map((column)=><th key={column.key}>{column.header}</th>)}<th /></tr></thead><tbody>{visiblePR.map((row)=><tr key={String(row.id)} data-vntech="purchasing-pr-row"><td><strong className="code">{row.requestNo||row.id}</strong></td><td>{data.projects.find((p)=>p.id===row.projectId)?.code||row.projectCode||"—"}</td><td>{row.requestedBy||"—"}</td><td>{datePart(row.requestedAt)||"—"}</td><td>{datePart(row.neededAt)||"—"}</td><td><StatusBadge value={purchasingPrStatusLabel(row.status)}/></td><td>{format.format(Number(row.itemCount||0))}</td><td>{format.format(Number(row.totalEstimatedValue||0))}</td><td>{purchasingSupplyStatusLabel(row.supplyStatus)}</td><td>{purchasingApprovalStageLabel(row, data)}</td><td><button type="button" className="secondary" data-vntech="purchasing-pr-open" onClick={()=>open("detail",row)}>Xem chi tiết PR</button></td></tr>)}</tbody></table>:<Empty text="Chưa có phiếu đề nghị mua (PR) nào khớp bộ lọc trong phạm vi đang chọn."/>}</div>}
      {activeTab==="PO"&&<div data-vntech="purchasing-pos"><div className="table-wrap" role="tabpanel" data-vntech="purchasing-po-table" aria-label="Danh sách đơn mua (PO)">{visiblePO.length?<table className="data-table"><thead><tr>{PURCHASING_PO_COLUMNS.map((column)=><th key={column.key}>{column.header}</th>)}<th /></tr></thead><tbody>{visiblePO.map((po)=>{const progress=deliveryProgress(po);return <tr key={String(po.id)} data-vntech="purchasing-po-row"><td><strong className="code">{po.poNo||po.id}</strong></td><td>{po.supplierName||"—"}</td>{progress.audit.hasData?<><td>{format.format(numeric(progress.audit.ordered))}</td><td>{format.format(numeric(progress.audit.received))}</td><td className={progress.audit.remaining>0?"red-text":"green-text"}>{format.format(numeric(progress.audit.remaining))}</td></>:<td colSpan={3}><small>chưa có nguồn — {progress.audit.reason}</small></td>}<td>{datePart(po.orderedAt)||"—"}</td><td>{po.eta?datePart(po.eta):"—"}</td><td><StatusBadge value={progress.complete?"Đã giao đủ":"Đang giao"}/></td><td>{format.format(Number(po.totalValue||0))}</td><td><button type="button" className="secondary" data-vntech="purchasing-po-open" onClick={()=>open("poDetail",po)}>Xem chi tiết PO</button></td></tr>;})}</tbody></table>:<Empty text="Chưa có đơn mua (PO) nào khớp bộ lọc trong phạm vi đang chọn."/>}</div></div>}
      {activeTab==="MAT"&&(
<section className="purchase-material-cumulative" data-vntech="purchasing-mat-table"><CardHead title="Chi tiết lũy kế theo vật tư" note="Mỗi dòng là 1 vật tư trong BOQ/Hợp đồng của dự án đang chọn. «Còn phải mua» = số lượng chưa lập PO. Bảng này KHÔNG bị bộ lọc và 2 tab PR/PO tác động."/><DataTable rows={boqRows} rowKey={(row)=>String(row.id)} emptyText="Chưa có dòng vật tư BOQ/Hợp đồng cho phạm vi đang chọn." tableClassName="resizable-data-table" columns={[
  { key: "c1", header: "STT HĐ", render: (row) => <>{row.sourceOrder||"—"}</> },
  { key: "c2", header: "Mã vật tư", render: (row) => <strong>{row.materialCode||"—"}</strong> },
  { key: "c3", header: "Tên vật tư", render: (row) => <>{row.materialName||"—"}</> },
  { key: "c4", header: "ĐVT", render: (row) => <>{row.unit||"—"}</> },
  { key: "c5", header: "BOQ/HĐ", render: (row) => <>{format.format(Number(row.contractQty||0))}</> },
  { key: "c6", header: "Đã đề nghị", render: (row) => <>{format.format(Number(row.requestedQty||0))}</> },
  { key: "c7", header: "Đã duyệt mua", render: (row) => <>{format.format(Number(row.approvedQty||row.approvedPurchaseQty||0))}</> },
  { key: "c8", header: "Lũy kế PO", render: (row) => <>{format.format(Number(row.orderedQty||0))}</> },
  { key: "c9", header: "Đã nhận", render: (row) => <>{format.format(Number(row.receivedQty||0))}</> },
  { key: "c9b", header: "Đã đặt chưa nhận", render: (row) => <>{format.format(Number(row.orderedNotReceivedQty||0))}</> },
  { key: "c9c", header: "Đã xuất kho", render: (row) => <>{format.format(Number(row.issuedQty||0))}</> },
  { key: "c10", header: "Còn phải mua", render: (row) => <strong>{format.format(Math.max(0,boqControlQty(row)-Number(row.orderedQty||0)))}</strong> },
]}/></section>
      )}
    </section>
    {/* PHASE 2 (§21) — VÒNG 1 · MỤC 5 ĐÃ GỘP bảng PO trùng này VÀO bảng của tab PO: marker `purchasing-pos` và nút «Xem chi tiết PO» (`purchasing-po-open`) nay nằm trong `{activeTab==="PO"}`. Lý do: user báo «ở cả 3 tab đang hiển thị cả 3 danh sách» — bảng này luôn hiện, cộng thêm bảng lũy kế hệ vật tư, khiến mọi tab đều thấy 3 danh sách. ⛔ KHÔNG xoá hẳn: `tests/p01-purchasing-two-tabs.test.mjs:263-265` và `tests/p2-d2-po-detail.test.mjs:121-122` khoá hai marker đó, và chính tiêu đề P-01.10 ghi «KHÔNG tạo bảng mới trùng». Số liệu vẫn qua `deliveryProgress` — thiếu nguồn thì hiện «chưa có nguồn», KHÔNG bịa số.
        
    
    {pricePreview.length>0&&<section className="card price-import-preview"><header><div><strong>KIỂM TRA TRƯỚC KHI CẬP NHẬT · {priceFileName}</strong><small>{pricePreview.length} dòng hợp lệ · {pricePreview.filter((row)=>row.changed).length} dòng thay đổi</small></div><div className="row-actions"><button className="secondary" onClick={()=>setPricePreview([])}>HỦY</button><button className="primary" onClick={()=>void confirmPrices()}>XÁC NHẬN CẬP NHẬT GIÁ</button></div></header></section>}
    {/* VÒNG 1 · MỤC 5 — bảng này chỉ thuộc tab «Chi tiết lũy kế theo vật tư» (`MAT`). Trước khi sửa nó nằm NGOÀI thẻ tab nên ở tab PR/PO vẫn hiện ⇒ mỗi tab thấy 3 danh sách. */}
    {activeTab==="MAT"&&<section className="card purchase-system-table"><CardHead title="LŨY KẾ THEO HỆ VẬT TƯ" note="Bảng TỔNG HỢP theo hệ kỹ thuật, lấy từ BOQ/Hợp đồng — KHÔNG phải danh sách PR/PO. A = giá trị hợp đồng · B = đã lập PO (đối chiếu) · C = đã nhận hàng · D = thanh toán · C/B = tỉ lệ đã nhận so với đã đối chiếu. Lưu ý: cột D là số ƯỚC TÍNH — chia tỷ lệ từ tổng tiền đã trả theo giá trị hợp đồng của hệ, vì hệ thống chưa lưu thanh toán theo từng hệ vật tư."/><div className="table-wrap"><table className="baseline-table"><thead><tr><th>NHÓM VẬT TƯ (HỆ M&E)</th><th>HỢP ĐỒNG (A)</th><th>ĐỐI CHIẾU (B)</th><th>ĐÃ NHẬN (C)</th><th title="Ước tính: chia tỷ lệ từ tổng tiền đã trả theo giá trị hợp đồng của hệ — hệ thống chưa lưu thanh toán theo từng hệ vật tư.">THANH TOÁN (D) · ƯỚC TÍNH</th><th>C/B</th><th>TRẠNG THÁI</th></tr></thead><tbody>{systemRows.map((row)=><Fragment key={row.code}><tr className="system-total-row"><td><strong>⌄ &nbsp; HỆ {row.name.toUpperCase()}</strong></td><td><strong>{moneyBillion(row.a)}</strong></td><td><strong>{moneyBillion(row.b)}</strong></td><td><strong>{moneyBillion(row.r)}</strong></td><td><strong>{moneyBillion(row.a?paid*(row.a/Math.max(contract,1)):0)}</strong></td><td><strong>{row.pct.toLocaleString("vi-VN",{maximumFractionDigits:2})}%</strong></td><td><StatusBadge value={row.pct>=50?"Đạt kế hoạch":"Cần theo dõi"}/></td></tr></Fragment>)}{!systemRows.length&&<tr><td colSpan={7}><Empty text="Chưa có dữ liệu BOQ/Hợp đồng phát sinh trong phạm vi đang chọn."/></td></tr>}<tr className="total-row"><td><strong>TỔNG CỘNG</strong></td><td><strong>{moneyBillion(contract)}</strong></td><td><strong>{moneyBillion(ordered)}</strong></td><td><strong>{moneyBillion(received)}</strong></td><td><strong>{moneyBillion(paid)}</strong></td><td><strong>{efficiency.toLocaleString("vi-VN",{maximumFractionDigits:2})}%</strong></td><td></td></tr></tbody></table></div></section>}
  </div>;
}
export {
  Purchasing,
  PURCHASING_TABS,
  PURCHASING_DEFAULT_TAB,
  PURCHASING_FILTER_DIMENSIONS,
  PURCHASING_PR_COLUMNS,
  PURCHASING_PO_COLUMNS,
  PURCHASING_SORTS,
  PURCHASING_DEFAULT_SORT,
  FINAL_STATUSES,
  isFinalStatus,
  filterPurchasingRows,
  sortCreatedDesc,
  prListFor,
  poListFor,
  purchasesForTab,
  buildPurchasingList,
  buildMaterialCumulativeRows,
};
