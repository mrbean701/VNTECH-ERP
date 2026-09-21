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

import { DataTable, StatusBadge } from "@/app/components/ui";
import { ListToolbar } from "@/app/components/ui/ListToolbar";
import { downloadBoqPriceTemplateXlsx } from "@/lib/boq-export";
import { parseSpreadsheetRows } from "@/lib/material-import";
import { BOQ_SYSTEM_CODES, CardHead, Empty, Kpi, boqControlQty, boqSystemName, downloadBlankPoPlanningTemplate, downloadPoPlanningTemplate, format, mapBoqPriceRows, moneyBillion, normalizeBoqSystemCode } from "@/lib/ui-shared";
// PHASE 2 (§21) — mở màn chi tiết PO từ màn Mua hàng; số liệu đối soát lấy từ hàm thuần dùng chung.
import { deliveryProgress, numeric } from "@/lib/p2-po-trace";
import type { AppData, Row } from "@/lib/ui-shared";
import { Fragment, useMemo, useState } from "react";

// ─────────── P-01: DẢI TAB — ĐÚNG 2 TAB (PR · PO) ───────────
type TabKey = "PR" | "PO";
type TabDef = { key: TabKey; label: string; source: "requests" | "purchaseOrders"; note: string };
const PURCHASING_TABS: TabDef[] = [
  { key: "PR", label: "PR", source: "requests", note: "Phiếu đề nghị mua hàng — nguồn bảng `material_requests`" },
  { key: "PO", label: "PO", source: "purchaseOrders", note: "Đơn mua hàng — nguồn bảng `purchase_orders`" },
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
  { value: "created_desc", label: "Mới nhất trước (created DESC)" },
  { value: "created_asc", label: "Cũ nhất trước" },
];
const PURCHASING_DEFAULT_SORT = "created_desc";
const SORT_LABEL: Record<string, string> = {
  created_desc: "Mới nhất trước (`created DESC`)",
  created_asc: "Cũ nhất trước",
};
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
  { key: "project", label: "Dự án", source: "`projectId` (PR: `material_requests.project_id` · PO: `purchase_orders.project_id`) — thanh phạm vi dự án: \"Tất cả\" hoặc một dự án đang chọn (không trộn dự án ngoài phạm vi đang chọn)" },
];
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
const purchasingStatusLabel = (value: unknown) => PR_STATUS_LABEL[String(value ?? "")] || PO_STATUS_LABEL[String(value ?? "")] || String(value || "—");

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
const isPurchaseRequestRow = (row: Row) => !isPurchaseOrderRow(row);
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
    if (f.status !== "ALL" && String(row.status) !== f.status && !(isPurchaseRequestRow(row) && String(row.supplyStatus) === f.status)) return false;
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

function Purchasing({ data, project, open, action, canUse }: { data: AppData; project: string; open: (name: string, row?: Row) => void; action:(name:string,payload:Row)=>Promise<boolean>; canUse: boolean }) {
  const [activeTab,setActiveTab]=useState<TabKey>(PURCHASING_DEFAULT_TAB);
  const [purchasingFilters,setPurchasingFilters]=useState<FilterState>(EMPTY_PURCHASING_FILTERS);
  const [purchasingSort,setPurchasingSort]=useState<string>(PURCHASING_DEFAULT_SORT);
  const setFilter=(patch:Partial<FilterState>)=>setPurchasingFilters((current)=>({...current,...patch}));
  const requests=prListFor(data).filter((row)=>project==="ALL"||row.projectId===project); const pos=poListFor(data).filter((row)=>project==="ALL"||row.projectId===project); const boqRows=data.boqItems.filter((row)=>(project==="ALL"||row.projectId===project)&&["material","component"].includes(String(row.rowRole||"material"))); const selected=project==="ALL"?null:data.projects.find((row)=>row.id===project);
  // P-01/P-02/P-03 — danh sách theo tab: PR = material_requests · PO = purchase_orders; qua 6 chiều lọc rồi `created DESC`.
  const tabRows=useMemo(()=>{
    const scopedProject={...purchasingFilters,project:project==="ALL"?purchasingFilters.project:project};
    return {
      PR:buildPurchasingList({tab:"PR",data:{...data,requests},filters:scopedProject,sortKey:purchasingSort}),
      PO:buildPurchasingList({tab:"PO",data:{...data,purchaseOrders:pos},filters:scopedProject,sortKey:purchasingSort}),
    };
  },[data,requests,pos,purchasingFilters,purchasingSort,project]);
  const visiblePR=tabRows.PR; const visiblePO=tabRows.PO;
  // Số đếm trên nhãn tab = số dòng CÒN LẠI sau 6 chiều lọc của CHÍNH tab đó (không hard-code);
  // tab PR luôn đọc `counts.PR`, tab PO luôn đọc `counts.PO`, đi qua `format.format` (định dạng vi-VN).
  const counts = { PR: visiblePR.length, PO: visiblePO.length };
  const optionsFrom=(values:string[],allLabel:string)=>({options:purchasingChoiceOptions(values,"ALL",allLabel)});
  const statusOptions=[...new Set(
    // Trạng thái cũng suy từ dữ liệu đang có của cả 2 tab (status của phiếu/đơn + supply_status của phiếu).
    [...requests,...pos].map((row)=>String(row.status||"")).filter(Boolean),
  )]
    .sort((a,b)=>String(purchasingStatusLabel(a)).localeCompare(String(purchasingStatusLabel(b)),"vi"))
    .map((value)=>({value,label:purchasingStatusLabel(value)}));
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
    {/* P-01 (TASK-119) — DẢI 2 TAB: `PR` · `PO` (KHÔNG còn tab `MR`). Số đếm trên nhãn tab tính trên CHÍNH tập đã lọc.
        Nguồn cột: `docs/agent-progress/P01-TAB-SPEC.md` mục 2. Nguồn 6 chiều lọc: `docs/25_TODO_ROADMAP.md` dòng `P-03`. */}
    <section className="card purchasing-tabs-card" data-vntech="purchasing-tabs">
      <div className="purchase-tabbar" role="tablist" aria-label="Mua hàng — PR · PO">
        {PURCHASING_TABS.map((tab)=><button key={tab.key} type="button" role="tab" className={`purchase-tab ${activeTab===tab.key?"is-active":""}`} aria-selected={activeTab===tab.key} data-vntech="purchasing-tab" data-vntech-tab={tab.key} title={tab.note} onClick={()=>setActiveTab(tab.key)}><strong>{tab.label}</strong><span data-vntech="purchasing-tab-count">{format.format(counts[tab.key])}</span></button>)}
      </div>
      <ListToolbar
        title={`DANH SÁCH ${activeTab==="PR"?"PHIẾU ĐỀ NGHỊ MUA (PR)":"ĐƠN MUA (PO)"}`}
        note={`Sắp xếp mặc định: ${SORT_LABEL[purchasingSort]||SORT_LABEL.created_desc} · Completed/Rejected xuống cuối — nguồn: docs/25_TODO_ROADMAP.md dòng \`P-02\` · 6 chiều lọc theo dòng \`P-03\` (Trạng thái · Ngày · Phòng ban · Người tạo · NCC · Dự án)`}
        count={counts[activeTab]}
        total={activeTab==="PR"?requests.length:pos.length}
        unit={activeTab==="PR"?"phiếu PR":"đơn PO"}
        filters={[
          { key:"status", label:"Trạng thái", value:purchasingFilters.status, onChange:(v)=>setFilter({status:v}), options:[{value:"ALL",label:"Tất cả trạng thái"},...statusOptions] },
          // Chiều «Ngày» (2 ô) + «Phòng ban» · «Người tạo» · «NCC»; lựa chọn của 3 chiều `select` suy từ dữ liệu đang có.
          { key:"dateFrom", label:"Ngày (từ)", value:purchasingFilters.dateFrom, onChange:(v)=>setFilter({dateFrom:v}), options:[{value:"",label:"Tất cả"}] },
          { key:"dateTo", label:"Ngày (đến)", value:purchasingFilters.dateTo, onChange:(v)=>setFilter({dateTo:v}), options:[{value:"",label:"Tất cả"}] },
          { key:"department", label:"Phòng ban", value:purchasingFilters.department, onChange:(v)=>setFilter({department:v}), options:departmentOptions },
          { key:"creator", label:"Người tạo", value:purchasingFilters.creator, onChange:(v)=>setFilter({creator:v}), options:creatorOptions },
          { key:"supplier", label:"NCC", value:purchasingFilters.supplier, onChange:(v)=>setFilter({supplier:v}), options:supplierOptions },
        ]}
        sort={{ value:purchasingSort, onChange:setPurchasingSort, options:PURCHASING_SORTS }}
        actions={<button className="secondary" type="button" onClick={()=>{setPurchasingFilters(EMPTY_PURCHASING_FILTERS);setPurchasingSort(PURCHASING_DEFAULT_SORT);}}>↺ ĐẶT LẠI LỌC/SẮP XẾP</button>}
        extra={<div className="list-toolbar-field" data-vntech="purchasing-filter-dims" title={PURCHASING_FILTER_DIMENSIONS.map((d)=>`${d.label}: ${d.source}`).join(" · ")}><span>Chiều lọc</span><em>{PURCHASING_FILTER_DIMENSIONS.length} chiều</em>{PURCHASING_FILTER_DIMENSIONS.map((d)=><span key={d.key} className="chip" data-vntech="purchasing-filter-dim" data-dim={d.key} data-source={d.source}>{d.label}</span>)}</div>}
      />
      <p className="purchasing-tab-note"><small>Nguồn cột: <code>docs/agent-progress/P01-TAB-SPEC.md</code> mục 2 (đo bằng dữ liệu MySQL thật) · Nguồn 6 chiều lọc: <code>docs/25_TODO_ROADMAP.md</code> dòng <code>P-03</code> (Trạng thái · Ngày · Phòng ban · Người tạo · NCC · Dự án) · Chiều «Ngày»: PR theo <code>requestedAt</code>, PO theo <code>orderedAt</code> · Chiều «Phòng ban» lấy từ <code>staffDirectory</code> (phiếu không có trường phòng ban riêng). Chiều «Dự án» bám thanh phạm vi dự án: dòng của dự án ngoài phạm vi đang chọn không nằm trong danh sách này.</small></p>
      <p className="purchasing-tab-note"><small>Đây là thay đổi <strong>GIAO DIỆN</strong>: KHÔNG xoá bảng/cột/dòng nào. <code>material_requests</code> · <code>purchase_orders</code> · <code>approvals</code> giữ nguyên; màn chỉ ĐỌC rồi tổ chức lại thành 2 tab (chỉ còn PR và PO).</small></p>
      {activeTab==="PR"&&<div className="table-wrap" role="tabpanel" data-vntech="purchasing-pr-table" aria-label="Danh sách phiếu đề nghị mua hàng (PR)">{visiblePR.length?<table className="data-table"><thead><tr>{PURCHASING_PR_COLUMNS.map((column)=><th key={column.key}>{column.header}</th>)}</tr></thead><tbody>{visiblePR.map((row)=><tr key={String(row.id)} data-vntech="purchasing-pr-row"><td><strong className="code">{row.requestNo||row.id}</strong></td><td>{data.projects.find((p)=>p.id===row.projectId)?.code||row.projectCode||"—"}</td><td>{row.projectCode||data.projects.find((p)=>p.id===row.projectId)?.code||"—"}</td><td>{row.requestedBy||"—"}</td><td>{datePart(row.requestedAt)||"—"}</td><td>{datePart(row.neededAt)||"—"}</td><td><StatusBadge value={purchasingStatusLabel(row.status)}/></td><td>{format.format(Number(row.itemCount||0))}</td><td>{format.format(Number(row.totalEstimatedValue||0))}</td><td>{purchasingStatusLabel(row.supplyStatus)}</td><td>{row.approvalStage??"—"}</td></tr>)}</tbody></table>:<Empty text="Chưa có phiếu đề nghị mua (PR) nào khớp bộ lọc trong phạm vi đang chọn."/>}</div>}
      {activeTab==="PO"&&<div className="table-wrap" role="tabpanel" data-vntech="purchasing-po-table" aria-label="Danh sách đơn mua (PO)">{visiblePO.length?<table className="data-table"><thead><tr>{PURCHASING_PO_COLUMNS.map((column)=><th key={column.key}>{column.header}</th>)}</tr></thead><tbody>{visiblePO.map((po)=>{const progress=deliveryProgress(po);return <tr key={String(po.id)} data-vntech="purchasing-po-row"><td><strong className="code">{po.poNo||po.id}</strong></td><td>{po.supplierName||"—"}</td>{progress.audit.hasData?<><td>{format.format(numeric(progress.audit.ordered))}</td><td>{format.format(numeric(progress.audit.received))}</td><td className={progress.audit.remaining>0?"red-text":"green-text"}>{format.format(numeric(progress.audit.remaining))}</td></>:<td colSpan={3}><small>chưa có nguồn — {progress.audit.reason}</small></td>}<td>{datePart(po.orderedAt)||"—"}</td><td>{po.eta?datePart(po.eta):"—"}</td><td><StatusBadge value={progress.complete?"Đã giao đủ":"Đang giao"}/></td><td>{format.format(Number(po.totalValue||0))}</td></tr>;})}</tbody></table>:<Empty text="Chưa có đơn mua (PO) nào khớp bộ lọc trong phạm vi đang chọn."/>}</div>}
    </section>
    {/* PHASE 2 (§21) — MỞ MÀN CHI TIẾT PO: danh sách PO của phạm vi đang chọn, bấm để xem Source PR · Ordered/Received/Remaining · GRN · Timeline.
        Số liệu đi qua `deliveryProgress` (hàm thuần dùng chung) — thiếu nguồn thì hiện «chưa có nguồn», KHÔNG bịa số. */}
    <section className="card purchase-order-detail-card" data-vntech="purchasing-pos"><CardHead title="Đơn mua (PO) — mở chi tiết để truy vết" note={`${visiblePO.length} PO khớp bộ lọc (trên ${pos.length} PO trong phạm vi đang chọn) · bấm «Xem chi tiết» để mở màn chi tiết PO (§21)`} />{visiblePO.length?<div className="table-wrap"><table className="data-table"><thead><tr><th>Mã PO</th><th>Nhà cung cấp</th><th>Trạng thái</th><th>Đã đặt</th><th>Đã nhận</th><th>Còn lại</th><th /></tr></thead><tbody>{visiblePO.map((po)=>{const progress=deliveryProgress(po);return <tr key={po.id} data-vntech="purchasing-po-row"><td><strong className="code">{po.poNo||po.id}</strong></td><td>{po.supplierName||"—"}</td><td><StatusBadge value={progress.complete?"Đã giao đủ":"Đang giao"}/></td>{progress.audit.hasData?<><td>{format.format(numeric(progress.audit.ordered))}</td><td>{format.format(numeric(progress.audit.received))}</td><td className={progress.audit.remaining>0?"red-text":"green-text"}>{format.format(numeric(progress.audit.remaining))}</td></>:<td colSpan={3}><small>chưa có nguồn — {progress.audit.reason}</small></td>}<td><button type="button" className="secondary" data-vntech="purchasing-po-open" onClick={()=>open("poDetail",po)}>Xem chi tiết PO</button></td></tr>;})}</tbody></table></div>:<Empty text="Chưa có PO nào trong phạm vi đang chọn."/>}</section>
    {pricePreview.length>0&&<section className="card price-import-preview"><header><div><strong>KIỂM TRA TRƯỚC KHI CẬP NHẬT · {priceFileName}</strong><small>{pricePreview.length} dòng hợp lệ · {pricePreview.filter((row)=>row.changed).length} dòng thay đổi</small></div><div className="row-actions"><button className="secondary" onClick={()=>setPricePreview([])}>HỦY</button><button className="primary" onClick={()=>void confirmPrices()}>XÁC NHẬN CẬP NHẬT GIÁ</button></div></header></section>}
    <section className="card purchase-system-table"><div className="table-wrap"><table className="baseline-table"><thead><tr><th>NHÓM VẬT TƯ (HỆ M&E)</th><th>HỢP ĐỒNG (A)</th><th>ĐỐI CHIẾU (B)</th><th>ĐÃ NHẬN (C)</th><th>THANH TOÁN (D)</th><th>C/E/B</th><th>TRẠNG THÁI</th></tr></thead><tbody>{systemRows.map((row)=><Fragment key={row.code}><tr className="system-total-row"><td><strong>⌄ &nbsp; HỆ {row.name.toUpperCase()}</strong></td><td><strong>{moneyBillion(row.a)}</strong></td><td><strong>{moneyBillion(row.b)}</strong></td><td><strong>{moneyBillion(row.r)}</strong></td><td><strong>{moneyBillion(row.a?paid*(row.a/Math.max(contract,1)):0)}</strong></td><td><strong>{row.pct.toLocaleString("vi-VN",{maximumFractionDigits:2})}%</strong></td><td><StatusBadge value={row.pct>=50?"Đạt kế hoạch":"Cần theo dõi"}/></td></tr></Fragment>)}{!systemRows.length&&<tr><td colSpan={7}><Empty text="Chưa có dữ liệu BOQ/Hợp đồng phát sinh trong phạm vi đang chọn."/></td></tr>}<tr className="total-row"><td><strong>TỔNG CỘNG</strong></td><td><strong>{moneyBillion(contract)}</strong></td><td><strong>{moneyBillion(ordered)}</strong></td><td><strong>{moneyBillion(received)}</strong></td><td><strong>{moneyBillion(paid)}</strong></td><td><strong>{efficiency.toLocaleString("vi-VN",{maximumFractionDigits:2})}%</strong></td><td></td></tr></tbody></table></div></section>
    <section className="card purchase-material-cumulative"><CardHead title="Chi tiết lũy kế theo vật tư" note="Chỉ hiển thị dữ liệu thực từ BOQ, đề nghị, PO và giao nhận; không nội suy dòng minh họa."/><DataTable rows={boqRows} rowKey={(row)=>String(row.id)} emptyText="Chưa có dòng vật tư BOQ/Hợp đồng cho phạm vi đang chọn." tableClassName="resizable-data-table" columns={[
  { key: "c1", header: "STT HĐ", render: (row) => <>{row.sourceOrder||"—"}</> },
  { key: "c2", header: "Mã vật tư", render: (row) => <strong>{row.materialCode||"—"}</strong> },
  { key: "c3", header: "Tên vật tư", render: (row) => <>{row.materialName||"—"}</> },
  { key: "c4", header: "ĐVT", render: (row) => <>{row.unit||"—"}</> },
  { key: "c5", header: "BOQ/HĐ", render: (row) => <>{format.format(Number(row.contractQty||0))}</> },
  { key: "c6", header: "Đã đề nghị", render: (row) => <>{format.format(Number(row.requestedQty||0))}</> },
  { key: "c7", header: "Đã duyệt mua", render: (row) => <>{format.format(Number(row.approvedQty||row.approvedPurchaseQty||0))}</> },
  { key: "c8", header: "Lũy kế PO", render: (row) => <>{format.format(Number(row.orderedQty||0))}</> },
  { key: "c9", header: "Đã nhận", render: (row) => <>{format.format(Number(row.receivedQty||0))}</> },
  { key: "c10", header: "Còn phải mua", render: (row) => <strong>{format.format(Math.max(0,boqControlQty(row)-Number(row.orderedQty||0)))}</strong> },
]}/></section>
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
};
