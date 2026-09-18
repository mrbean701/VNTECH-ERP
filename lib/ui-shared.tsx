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

import type { FormFieldConfig } from "@/lib/form-fields";
import { ReactNode } from "react";

// Dynamic rows are normalized by the server API and intentionally remain flexible here.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

type ModuleKey = "dashboard" | "dept_plan_tasks" | "dept_plan_assign" | "dept_plan_supply_plan" | "dept_plan_tender" | "dept_plan_rfq" | "dept_plan_purchasing" | "dept_plan_supply" | "dept_plan_contracts" | "dept_plan_suppliers" | "dept_plan_price_data" | "dept_plan_kpi" | "dept_plan_alerts" | "dept_project_tasks" | "dept_project_pda" | "dept_project_assign" | "dept_project_plan" | "dept_project_shop" | "dept_project_boq" | "dept_project_material" | "dept_project_issues" | "dept_project_asbuilt" | "dept_project_payment" | "dept_project_tender" | "dept_project_kpi" | "dept_project_alerts" | "dept_finance_payment_plan" | "dept_finance_recovery" | "dept_finance_advance" | "dept_finance_site_cost" | "dept_finance_cashbank" | "dept_finance_documents" | "dept_legal_hr" | "dept_legal_labor" | "dept_legal_correspondence" | "dept_legal_documents" | "dept_legal_seal" | "dept_legal_benefits" | "site_command" | "project_progress" | "construction" | "production" | "capital_recovery" | "requests" | "approvals" | "purchasing" | "supplier_catalog" | "receiving" | "delivered" | "warehouse_receipt" | "warehouse_issue" | "inventory" | "material_norms" | "central_warehouse" | "material_catalog" | "boq" | "payments" | "teams" | "stocktake" | "reports" | "admin";

const UI_NOW_MS = new Date().getTime();

// Menu 11 mục theo nghiệp vụ. Nhóm "department_management" cũ đã được tách thành
// my_work / mep / finance / hr_legal / reports (xem migration V4__menu_restructure.sql).
const defaultMenuGroups = [
  { groupKey: "overview", name: "TỔNG QUAN", icon: "OV", sortOrder: 10, active: true, collapsible: false },
  { groupKey: "my_work", name: "CÔNG VIỆC", icon: "NV", sortOrder: 15, active: true, collapsible: true },
  { groupKey: "site_command", name: "QUẢN LÝ DỰ ÁN", icon: "DA", sortOrder: 25, active: true, collapsible: true },
  { groupKey: "mep", name: "MEP", icon: "MEP", sortOrder: 28, active: true, collapsible: true },
  { groupKey: "purchasing", name: "MUA HÀNG & CUNG ỨNG", icon: "MH", sortOrder: 30, active: true, collapsible: true },
  { groupKey: "warehouse", name: "KHO VẬT TƯ", icon: "KV", sortOrder: 40, active: true, collapsible: true },
  { groupKey: "teams", name: "TỔ ĐỘI", icon: "TD", sortOrder: 45, active: true, collapsible: true },
  { groupKey: "finance", name: "TÀI CHÍNH – KẾ TOÁN", icon: "TC", sortOrder: 50, active: true, collapsible: true },
  { groupKey: "hr_legal", name: "HÀNH CHÍNH – PHÁP CHẾ", icon: "HC", sortOrder: 55, active: true, collapsible: true },
  { groupKey: "reports", name: "BÁO CÁO", icon: "BC", sortOrder: 60, active: true, collapsible: true },
  { groupKey: "material_master", name: "DANH MỤC VẬT TƯ GỐC", icon: "MV", sortOrder: 70, active: true, collapsible: false },
  { groupKey: "system_admin", name: "QUẢN TRỊ HỆ THỐNG", icon: "QT", sortOrder: 80, active: true, collapsible: true },
];


const roleNames: Record<string, string> = {
  admin: "Quản trị hệ thống", engineer: "Kỹ sư dự án", commander: "Chỉ huy trưởng",
  project: "Phòng Dự án", procurement: "Phòng Kế hoạch", accountant: "Kế toán / Tài chính", warehouse: "Thủ kho", team: "Tổ đội", director: "Ban Lãnh đạo",
};

const format = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 });

function projectPeriod(start:unknown,end:unknown){const fmt=(value:unknown)=>{if(!value)return "?";const d=new Date(String(value));return Number.isNaN(d.getTime())?"?":`${d.getMonth()+1}/${d.getFullYear()}`;};const a=fmt(start),b=fmt(end);return a==="?"&&b==="?"?"Chưa có TG":a!=="?"&&b==="?"?`Từ ${a}`:a==="?"&&b!=="?"?`Đến ${b}`:a===b?a:`${a}–${b}`;}

const NAV_ICON_TYPE: Record<string,string> = {
  overview:"home", dashboard:"home",
  department_management:"users", site_command:"hardhat", "phòng kế hoạch":"calendar", "phòng dự án":"hardhat", "tài chính kế toán":"coins", "hành chính pháp chế":"document",
  project_management:"briefcase", purchasing:"cart", warehouse:"warehouse", system_admin:"gear",
  dept_plan_tasks:"tasks", dept_plan_assign:"assign", dept_plan_supply_plan:"calendar", dept_plan_tender:"bid", dept_plan_rfq:"quote",
  dept_plan_purchasing:"cart", dept_plan_supply:"truck", dept_plan_contracts:"document", dept_plan_suppliers:"handshake", dept_plan_price_data:"coins", dept_plan_kpi:"chart", dept_plan_alerts:"bell",
  dept_project_tasks:"tasks", dept_project_pda:"compass", dept_project_assign:"assign", dept_project_plan:"calendar", dept_project_shop:"blueprint", dept_project_boq:"measure", dept_project_material:"box", dept_project_issues:"alert", dept_project_asbuilt:"checkdoc", dept_project_payment:"wallet", dept_project_tender:"bid", dept_project_kpi:"chart", dept_project_alerts:"bell",
  dept_finance_payment_plan:"calendar",dept_finance_recovery:"coins",dept_finance_advance:"wallet",dept_finance_site_cost:"coins",dept_finance_cashbank:"wallet",dept_finance_documents:"document",dept_legal_hr:"users",dept_legal_labor:"document",dept_legal_correspondence:"document",dept_legal_documents:"document",dept_legal_seal:"checkdoc",dept_legal_benefits:"document",
  project_progress:"calendar", construction:"hardhat", production:"chart", capital_recovery:"coins", boq:"measure", payments:"wallet", teams:"users",
  requests:"clipboard", approvals:"check", supplier_catalog:"handshake", receiving:"truck", delivered:"deliver",
  warehouse_receipt:"receive", warehouse_issue:"issue", inventory:"transfer", stocktake:"stocktake", material_norms:"ruler", central_warehouse:"warehouse", material_catalog:"boxes",
  admin:"gear", dept_personal:"user",
  my_work:"tasks", mep:"blueprint", finance:"coins", hr_legal:"briefcase", reports:"chart"
};

const NAV_ICON_TONE: Record<string,string> = {
  overview:"blue",dashboard:"blue",my_work:"green",mep:"blue",finance:"orange",hr_legal:"purple",reports:"slate",department_management:"indigo",site_command:"orange","phòng kế hoạch":"green","phòng dự án":"blue","tài chính kế toán":"orange","hành chính pháp chế":"purple",project_management:"orange",
  purchasing:"red",warehouse:"purple",system_admin:"slate",admin:"slate",
  project_progress:"orange",construction:"orange",production:"orange",capital_recovery:"orange",boq:"orange",payments:"orange",teams:"orange",
  requests:"red",approvals:"red",receiving:"red",delivered:"red",
  warehouse_receipt:"purple",warehouse_issue:"purple",inventory:"purple",stocktake:"purple",material_norms:"purple",central_warehouse:"purple",material_catalog:"purple",
  dept_plan_tasks:"green",dept_plan_assign:"green",dept_plan_supply_plan:"green",dept_plan_tender:"green",dept_plan_rfq:"green",dept_plan_purchasing:"green",dept_plan_supply:"green",dept_plan_contracts:"green",dept_plan_suppliers:"green",dept_plan_price_data:"green",dept_plan_kpi:"green",dept_plan_alerts:"green",
  dept_project_tasks:"blue",dept_project_pda:"blue",dept_project_assign:"blue",dept_project_plan:"blue",dept_project_shop:"blue",dept_project_boq:"blue",dept_project_material:"blue",dept_project_issues:"blue",dept_project_asbuilt:"blue",dept_project_payment:"blue",dept_project_tender:"blue",dept_project_kpi:"blue",dept_project_alerts:"blue",dept_finance_payment_plan:"orange",dept_finance_recovery:"orange",dept_finance_advance:"orange",dept_finance_site_cost:"orange",dept_finance_cashbank:"orange",dept_finance_documents:"orange",dept_legal_hr:"purple",dept_legal_labor:"purple",dept_legal_correspondence:"purple",dept_legal_documents:"purple",dept_legal_seal:"purple",dept_legal_benefits:"purple",dept_personal:"blue"
};

const DEPT_MODULE_GROUP: Record<string,string> = {
  dept_plan_supply_plan:"KẾ HOẠCH",dept_plan_tender:"ĐẤU THẦU",dept_plan_rfq:"RFQ",dept_plan_purchasing:"MUA HÀNG",dept_plan_supply:"CUNG ỨNG",dept_plan_contracts:"HỢP ĐỒNG",dept_plan_suppliers:"NCC",dept_plan_price_data:"GIÁ",dept_plan_kpi:"KPI",dept_plan_alerts:"CẢNH BÁO",
  dept_project_pda:"PDA",dept_project_plan:"KẾ HOẠCH",dept_project_shop:"SHOPDRAWING",dept_project_boq:"BOQ",dept_project_material:"VẬT TƯ",dept_project_issues:"PHÁT SINH",dept_project_asbuilt:"HOÀN CÔNG",dept_project_payment:"THANH TOÁN",dept_project_tender:"ĐẤU THẦU",dept_project_kpi:"KPI",dept_project_alerts:"CẢNH BÁO"
};

function taskStatusLabel(value:string){const map:Record<string,string>={NEW:"Mới giao",IN_PROGRESS:"Đang thực hiện",WAITING_SUPPLIER:"Chờ NCC",WAITING_CLIENT:"Chờ CĐT/TVGS",WAITING_APPROVAL:"Chờ duyệt",WAITING_PROJECT:"Chờ BCH/Dự án",BLOCKED:"Bị chặn",ON_HOLD:"Tạm dừng",SUBMITTED:"Đã gửi kiểm tra",REWORK:"Yêu cầu chỉnh sửa",COMPLETED:"Hoàn thành",CANCELLED:"Hủy"};return map[value]||value;}

// =============================================================================
// GĐ4 — MÀN "CÔNG VIỆC": việc của tôi · việc phòng ban/tổ đội · KPI & báo cáo
// Yêu cầu người dùng:
//   • user tự tạo task cho bản thân  → action create_self_work_item (mới, GĐ4)
//   • tạo task cho nhân viên nếu có chức vụ phù hợp → create_work_item (backend chặn)
//   • dashboard tỉ lệ hoàn thành để đánh giá năng lực nhân viên
//   • báo cáo theo tiến độ công việc trong THÁNG của từng nhân viên
//   • CEO/admin xem được toàn bộ KPI phòng ban và user
// =============================================================================
const WORK_STATUS_LABELS: Record<string, string> = {
  NEW: "Mới", IN_PROGRESS: "Đang làm", WAITING_SUPPLIER: "Chờ NCC", WAITING_CLIENT: "Chờ khách hàng",
  WAITING_APPROVAL: "Chờ duyệt", WAITING_PROJECT: "Chờ dự án", BLOCKED: "Bị chặn", ON_HOLD: "Tạm dừng",
  SUBMITTED: "Đã trình", REWORK: "Làm lại", COMPLETED: "Hoàn thành", CANCELLED: "Đã huỷ",
};

const WORK_CLOSED = ["COMPLETED", "CANCELLED"];


const PROJECT_STATUS_LABELS: Record<string,string> = { active:"Đang hoạt động", paused:"Tạm dừng", closed:"Đã đóng", purged:"Đã xoá", pending:"Chờ khởi động" };

/** Số ngày lệch giữa một mốc ISO và hôm nay (dương = đã quá mốc). */

function initials(name: string) { return name.split(" ").slice(-2).map((part) => part[0]).join("").toUpperCase(); }

function durationText(minutes: number) { if (!Number.isFinite(minutes) || minutes < 0) return "—"; if (minutes < 60) return `${Math.max(1, Math.round(minutes))} phút`; const hours = Math.floor(minutes / 60); const rest = Math.round(minutes % 60); return rest ? `${hours} giờ ${rest} phút` : `${hours} giờ`; }

function kpiIconName(label:string, legacyIcon:string):string {
  const text=`${label} ${legacyIcon}`.toLocaleLowerCase("vi");
  if(text.includes("nhà cung cấp")) return "dept_plan_suppliers";
  if(text.includes("kiểm kê")||text.includes("hoàn trả")||text.includes("chênh lệch")) return "stocktake";
  if(text.includes("mã vật tư")) return "material_catalog";
  if(text.includes("tồn")) return "inventory";
  if(text.includes("nhập kho")||text.includes("chờ nhập")||text.includes("tổng giá trị nhập")) return "warehouse_receipt";
  if(text.includes("xuất")) return "warehouse_issue";
  if(text.includes("giao")||text.includes("trễ hẹn")||text.includes("sắp đến hạn")) return "delivered";
  if(text.includes("đặt hàng")||text.includes("po")||text.includes("đối chiếu")) return "purchasing";
  if(text.includes("đề nghị")||text.includes("mr")) return "requests";
  if(text.includes("phê duyệt")||text.includes("chờ duyệt")||text.includes("quá hạn")) return "approvals";
  if(text.includes("hợp đồng")||text.includes("boq")||text.includes("trong hợp đồng")||text.includes("ngoài hợp đồng")) return "boq";
  if(text.includes("thu hồi")||text.includes("tiền thực thu")) return "capital_recovery";
  if(text.includes("hóa đơn")||text.includes("thanh toán")) return "payments";
  if(text.includes("sản lượng")||text.includes("thi công")||text.includes("tiến độ")) return "project_progress";
  if(text.includes("dự án")) return "project_management";
  if(text.includes("nhiệm vụ")||text.includes("đang thực hiện")||text.includes("hoàn thành")||text.includes("chờ bên khác")) return "dept_plan_tasks";
  if(text.includes("hồ sơ")) return "dept_project_payment";
  return "dashboard";
}

const APPROVAL_STAGE_LABELS:Record<number,string>={1:"CHT ĐÃ XÁC NHẬN",2:"CHỜ THƯ KÝ TGĐ",3:"CHỜ PHÒNG DỰ ÁN",4:"CHỜ TRƯỞNG PHÒNG DA",5:"CHỜ TRƯỞNG PHÒNG KH"};

function sanitizeUiText(value: unknown) { return String(value ?? "").replace(/\bV\d+(?:\.\d+){0,3}\b/gi, "").replace(/\s{2,}/g, " ").replace(/\s+([,.;:])/g, "$1").trim(); }

function normalizeMasterHeader(value: unknown) { return String(value ?? "").trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }

function truthyCatalog(value: unknown) { return ["1", "true", "yes", "co", "có", "x"].includes(String(value ?? "").trim().toLowerCase()); }

function materialCatalogTemplateRows(){ return [{ categoryCode:"DIEN",categoryName:"Điện",subcategoryName:"Cáp điện động lực",code:"VT-EL-001",name:"Cáp Cu/XLPE/PVC 4x50 mm²",unit:"m",specification:"0.6/1kV",brand:"CADIVI",minStock:100,active:1 }]; }

function normalizeBoqHeader(value: unknown) { return String(value ?? "").trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }

const BOQ_SYSTEM_CODES=["DIEN","CTN","HVAC","DNHE","PCCC","KHAC"] as const;

function boqStatusLabel(value: string) { return value === "approved" ? "Đã duyệt" : value === "pending" ? "Chờ duyệt" : value === "rejected" ? "Không duyệt" : "Không phát sinh"; }

function normalizePaymentDate(value:unknown){const raw=String(value??"").trim();if(/^\d{4}-\d{2}-\d{2}$/.test(raw))return raw;const m=raw.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);if(m)return `${m[3]}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`;const serial=Number(raw);if(Number.isFinite(serial)&&serial>20000&&serial<80000){const d=new Date(Date.UTC(1899,11,30)+serial*86400000);return d.toISOString().slice(0,10);}return raw;}

const ADMIN_HELP_TEXT = {
  visible: "Bật: cột xuất hiện trên màn hình người dùng. Tắt: chỉ ẩn trên giao diện; dữ liệu đang lưu không bị xóa. Thiết lập này độc lập với Import và Export.",
  required: "Bật: trường bắt buộc phải có dữ liệu khi tạo/nhập nghiệp vụ. Tắt: có thể để trống. Không làm mất dữ liệu đã có.",
  importable: "Bật: cột xuất hiện trong mẫu Excel/CSV nhập liệu và hệ thống đọc cột này khi Import. Tắt: cột không được dùng để nhập. Thiết lập này độc lập với Hiện và Export.",
  exportable: "Bật: cột được đưa ra file Excel/CSV/PDF khi xuất dữ liệu. Tắt: dữ liệu vẫn còn trong hệ thống nhưng không xuất ra báo cáo/file.",
  editable: "Bật: người có quyền Sửa phù hợp được chỉnh giá trị trường. Tắt: trường chỉ đọc. Trường hệ thống tự tính/link luôn bị khóa sửa trực tiếp.",
  position: "Quy định vị trí cột trong bảng/mẫu. Vị trí 1 đứng trước vị trí 2. Nút ↑/↓ di chuyển một bước và hệ thống tự đánh lại thứ tự 1…N.",
  dataType: "Quy định kiểu dữ liệu mà trường nhận: chữ, số, ngày, danh sách hoặc ghi chú dài. Chọn sai kiểu có thể làm dữ liệu nhập không hợp lệ.",
  fieldKey: "Khóa kỹ thuật dùng để liên kết dữ liệu. Người vận hành không cần nhập/sửa khóa trường hệ thống. Cột tùy chỉnh mới phải có khóa duy nhất.",
  permissionView: "Cho phép mở chức năng và xem dữ liệu trong phạm vi dự án được gán. Các quyền Tạo/Sửa/Duyệt/Xuất sẽ tự bật Xem khi cần.",
  permissionUse: "Cho phép thực hiện thao tác nghiệp vụ thông thường của chức năng. Quyền này không tự cho phép sửa dữ liệu gốc nếu chưa bật Sửa.",
  permissionCreate: "Cho phép tạo mới phiếu/chứng từ/dữ liệu của chức năng. Khi bật, hệ thống tự bật Xem và Thao tác.",
  permissionEdit: "Cho phép chỉnh sửa dữ liệu đã tồn tại trong phạm vi được cấp. Khi bật, hệ thống tự bật Xem và Thao tác.",
  permissionApprove: "Cho phép phê duyệt/xác nhận nghiệp vụ nếu người dùng đồng thời đúng cấp workflow. Khi bật, hệ thống tự bật Xem và Thao tác.",
  permissionExport: "Cho phép xuất Excel/CSV/PDF hoặc tải dữ liệu. Khi bật, hệ thống tự bật Xem.",
  permissionExpiry: "Thời điểm toàn bộ quyền của dòng chức năng này tự hết hiệu lực. Để trống nếu quyền không có ngày hết hạn.",
  hide: "Ẩn mục khỏi giao diện người dùng nhưng giữ nguyên dữ liệu và lịch sử. Có thể bật Hiện/Kích hoạt lại sau.",
  activate: "Hiển thị/kích hoạt lại mục đã ẩn. Dữ liệu lịch sử trước đó vẫn được giữ nguyên.",
} as const;


function joinCodes(values:unknown[]){return values.map((value)=>String(value||"").trim()).filter(Boolean).join("; ");}

// ---------------------------------------------------------------------------
// ĐỢT P4 — WORKFLOW ĐA LUỒNG
// Nhiều quy trình · mỗi quy trình nhiều bước · mỗi bước nhiều người duyệt đích danh.
// approval_mode: single (1 người) · any_of (1 trong nhiều người là qua) · all_of (tất cả phải duyệt).
// ---------------------------------------------------------------------------
const APPROVAL_MODE_LABELS: Record<string, string> = {
  single: "Một người duyệt",
  any_of: "Một trong nhiều người duyệt là qua",
  all_of: "Tất cả người duyệt phải xác nhận",
};

const APPROVAL_MODE_SHORT: Record<string, string> = { single: "1 người", any_of: "1 trong nhiều", all_of: "Tất cả" };

/** Ứng viên người duyệt: ưu tiên người có quyền canApprove trên chức năng đang cấu hình. */

const PERM_CAPS: { key: string; label: string }[] = [
  { key: "canView", label: "Xem" }, { key: "canUse", label: "Thao tác" },
  { key: "canCreate", label: "Tạo" }, { key: "canEdit", label: "Sửa" },
  { key: "canApprove", label: "Duyệt" }, { key: "canExport", label: "Xuất" },
];

function canvasJpegBytesForDownload(dataUrl:string){const binary=atob(dataUrl.split(",")[1]||"");const out=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)out[i]=binary.charCodeAt(i);return out;}

const CODE39:Record<string,string>={"0":"nnnwwnwnn","1":"wnnwnnnnw","2":"nnwwnnnnw","3":"wnwwnnnnn","4":"nnnwwnnnw","5":"wnnwwnnnn","6":"nnwwwnnnn","7":"nnnwnnwnw","8":"wnnwnnwnn","9":"nnwwnnwnn","A":"wnnnnwnnw","B":"nnwnnwnnw","C":"wnwnnwnnn","D":"nnnnwwnnw","E":"wnnnwwnnn","F":"nnwnwwnnn","G":"nnnnnwwnw","H":"wnnnnwwnn","I":"nnwnnwwnn","J":"nnnnwwwnn","K":"wnnnnnnww","L":"nnwnnnnww","M":"wnwnnnnwn","N":"nnnnwnnww","O":"wnnnwnnwn","P":"nnwnwnnwn","Q":"nnnnnnwww","R":"wnnnnnwwn","S":"nnwnnnwwn","T":"nnnnwnwwn","U":"wwnnnnnnw","V":"nwwnnnnnw","W":"wwwnnnnnn","X":"nwnnwnnnw","Y":"wwnnwnnnn","Z":"nwwnwnnnn","-":"nwnnnnwnw",".":"wwnnnnwnn"," ":"nwwnnnwnn","*":"nwnnwnwnn"};

type AppData = {
  user: Row; settings: Row; productIdentity: Row; projects: Row[]; adminProjects: Row[]; teams: Row[]; warehouses: Row[]; transferWarehouses: Row[]; materials: Row[]; adminMaterials: Row[]; materialCategories: Row[]; adminMaterialCategories: Row[]; materialSubcategories: Row[]; adminMaterialSubcategories: Row[]; materialNorms: Row[]; suppliers: Row[]; adminSuppliers: Row[]; contractPayments: Row[]; productionReports: Row[]; capitalRecoveryRecords: Row[]; teamSubcontracts: Row[]; teamProductionRecords: Row[]; teamPayments: Row[]; teamSettlements: Row[];
  requests: Row[]; inventory: Row[]; centralInventory: Row[]; centralReturns: Row[]; companyAvailability: Row[]; transferOrders: Row[]; materialAliases: Row[]; boqItems: Row[]; boqSourceItems: Row[]; boqImportBatches: Row[]; boqChangeHistory: Row[]; projectContracts: Row[]; boqVersions: Row[]; contractStockLedger: Row[]; contractStockBalances: Row[]; stockReconciliations: Row[]; purchaseOrders: Row[]; receipts: Row[]; issues: Row[]; returns: Row[]; stockCounts: Row[]; users: Row[]; staffDirectory: Row[]; userScopes: Row[]; userWarehouseScopes: Row[]; modulePermissions: Row[]; allModulePermissions: Row[]; audits: Row[]; constructionDailyLogs: Row[]; constructionDailyLogItems: Row[]; paymentPlans: Row[]; advanceRequests: Row[]; siteExpenseClaims: Row[]; bankAccounts: Row[]; cashbookEntries: Row[]; accountingVouchers: Row[]; hrRecords: Row[]; laborContracts: Row[]; officialCorrespondence: Row[]; legalDocuments: Row[]; sealManagement: Row[]; benefitRecords: Row[]; workflowDefinitions: Row[]; workflowSteps: Row[]; workflowStepApprovers: Row[]; departmentModulePermissions: Row[]; systemLevelCatalog: Row[];
  emailSettings: Row | null; emailRecipients: Row[]; workflowAssignments: Row[]; emailOutbox: Row[]; supplySteps: Row[]; engineRoleProfiles: Row[]; businessScopes: Row[]; businessRoleGroupScopes: Row[]; businessRoleGroups: Row[]; roleCatalog: Row[]; organizationUnits: Row[]; approvalStages: Row[]; menuGroups: Row[]; moduleCatalog: Row[];
  workItems: Row[]; workItemEvents: Row[]; taskNotifications: Row[]; teamMembers?: Row[];
  activeSessions?: Row[]; serverInfo?: Row | null; trustStatus?: Row | null; formFieldConfigs?: FormFieldConfig[];
  uiDisplaySettings?: Row | null;
  projectAccessAll?: boolean;
};


const money = (value: unknown) => `${format.format(Number(value || 0))} đ`;

const date = (value: unknown) => {
  if (!value) return "—";
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return String(value);
  const hasTime = String(value).includes("T");
  return new Intl.DateTimeFormat("vi-VN", { day:"2-digit", month:"2-digit", year:"numeric", ...(hasTime?{hour:"2-digit",minute:"2-digit",hour12:false}:{}) }).format(parsed);
};

function CardHead({ title, note, action, onClick }: { title: string; note?: string; action?: string; onClick?: () => void }) { return <div className="card-head"><div><h2>{title}</h2>{note && <p>{note}</p>}</div>{action && <button onClick={onClick}>{action} →</button>}</div>; }

function Empty({ text }: { text: string }) { return <div className="empty"><span>✓</span><strong>{text}</strong><p>Dữ liệu mới sẽ xuất hiện tại đây.</p></div>; }

function NavIcon({name,kind="module"}:{name:string;kind?:"module"|"group"}) {
  const key=name.toLowerCase();
  const tone=NAV_ICON_TONE[key] || (key.startsWith("dept_project_")?"blue":key.startsWith("dept_plan_")?"green":"blue");
  const type=NAV_ICON_TYPE[key] || "grid";
  const paths:Record<string,ReactNode>= {
    home:<><path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V21h13V9.5"/><path d="M9 21v-7h6v7"/></>,
    user:<><circle cx="12" cy="8" r="3.2"/><path d="M5 21c.8-4.4 3.1-6.6 7-6.6s6.2 2.2 7 6.6"/></>,
    users:<><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3.5 20c.5-4 2.5-6 5.5-6s5 2 5.5 6M14 15c3.5-.5 5.5 1 6.5 4"/></>,
    briefcase:<><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5c0-1 1-2 2-2h4c1 0 2 1 2 2v2M3 12h18M10 12v2h4v-2"/></>,
    calendar:<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M7 14h2M11 14h2M15 14h2M7 18h2M11 18h2"/></>,
    tasks:<><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4.5V3h6v1.5M9 10l1.4 1.4L13 8.8M9 15l1.4 1.4L13 13.8M14.5 10h2M14.5 15h2"/></>,
    assign:<><circle cx="8" cy="8" r="3"/><path d="M3 19c.6-3.4 2.3-5.2 5-5.2 1.5 0 2.8.5 3.7 1.4M14 7h7M18 3l4 4-4 4M14 17h7M18 13l4 4-4 4"/></>,
    cart:<><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/><path d="M3 4h2l2.5 11h10l2-7H7"/></>,
    truck:<><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></>,
    document:<><path d="M6 2h9l4 4v16H6z"/><path d="M14 2v5h5M9 12h7M9 16h7"/></>,
    clipboard:<><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4.5V3h6v1.5M8.5 10h7M8.5 14h7M8.5 18h4"/></>,
    handshake:<><path d="M8 8 5 5 2 9l5 5 3-1 4 4c1 1 3 0 3-1l-5-5"/><path d="m16 8 3-3 3 4-5 5-3-1-2-2 4-3Z"/></>,
    coins:<><ellipse cx="8" cy="7" rx="4" ry="2.5"/><path d="M4 7v4c0 1.4 1.8 2.5 4 2.5s4-1.1 4-2.5V7M12 11c.7-.5 1.7-.8 3-.8 2.2 0 4 1.1 4 2.5v4c0 1.4-1.8 2.5-4 2.5s-4-1.1-4-2.5v-3"/></>,
    chart:<><path d="M4 20V10M10 20V5M16 20v-8M22 20H2"/><path d="m4 8 6-4 6 5 5-4"/></>,
    bell:<><path d="M6 16h12l-1.5-2V9a4.5 4.5 0 0 0-9 0v5L6 16Z"/><path d="M10 19a2 2 0 0 0 4 0"/></>,
    hardhat:<><path d="M4 15v-2a8 8 0 0 1 16 0v2M8 13V8M16 13V8M3 15h18v3H3z"/></>,
    compass:<><circle cx="12" cy="12" r="9"/><path d="m15 8-2 5-5 2 2-5 5-2Z"/></>,
    blueprint:<><path d="M4 3h13l3 3v15H4z"/><path d="M15 3v5h5M8 12h8M8 16h5M7 8h4"/></>,
    measure:<><rect x="3" y="7" width="18" height="10" rx="2"/><path d="M7 7v4M11 7v2M15 7v4M19 7v2"/></>,
    box:<><path d="m3 7 9-4 9 4-9 4zM3 7v10l9 4 9-4V7M12 11v10"/></>,
    alert:<><path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 9v5M12 17h.01"/></>,
    checkdoc:<><path d="M6 2h9l4 4v16H6z"/><path d="M14 2v5h5M9 14l2 2 4-5"/></>,
    wallet:<><path d="M3 6h15a2 2 0 0 1 2 2v10H5a2 2 0 0 1-2-2V6Z"/><path d="M3 8V5a2 2 0 0 1 2-2h12M14 11h7v4h-7a2 2 0 0 1 0-4Z"/></>,
    bid:<><path d="m4 18 8-8M9 6l4 4M5 10l4 4M12 5l3-3 4 4-3 3M3 14l3-3 4 4-3 3M12 20h9"/></>,
    quote:<><path d="M4 5h16v12H8l-4 4V5Z"/><path d="M8 9h8M8 13h5"/></>,
    check:<><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/></>,
    deliver:<><path d="m3 7 9-4 9 4-9 4zM3 7v10l9 4 9-4V7M12 11v10"/><path d="m16 14 1.5 1.5L21 12"/></>,
    receive:<><path d="m3 8 9-4 9 4-9 4zM3 8v9l9 4 9-4V8M12 12v9M12 2v7M9 6l3 3 3-3"/></>,
    issue:<><path d="m3 8 9-4 9 4-9 4zM3 8v9l9 4 9-4V8M12 12v9M12 9V2M9 5l3-3 3 3"/></>,
    transfer:<><path d="M4 7h14M15 4l3 3-3 3M20 17H6M9 14l-3 3 3 3"/><rect x="2" y="3" width="3" height="8" rx="1"/><rect x="19" y="13" width="3" height="8" rx="1"/></>,
    stocktake:<><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4.5V3h6v1.5M8 10h8M8 14h5M16 15l1.5 1.5L20 14"/></>,
    ruler:<><path d="m4 17 13-13 3 3L7 20H4v-3Z"/><path d="m12 9 3 3M9 12l2 2M15 6l2 2"/></>,
    warehouse:<><path d="M3 9 12 3l9 6v12H3V9Z"/><path d="M7 13h10v8H7zM7 16h10"/></>,
    boxes:<><path d="m4 6 4-2 4 2-4 2-4-2Zm0 0v5l4 2 4-2V6M12 12l4-2 4 2-4 2-4-2Zm0 0v5l4 2 4-2v-5"/></>,
    gear:<><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1A7 7 0 0 0 15 6l-.3-2.6h-5.4L9 6a7 7 0 0 0-1.5 1.1l-2.4-1-2 3.4L5.1 11A7 7 0 0 0 5 12c0 .3 0 .7.1 1l-2 1.5 2 3.4 2.4-1A7 7 0 0 0 9 18l.3 2.6h5.4L15 18a7 7 0 0 0 1.5-1.1l2.4 1 2-3.4-2-1.5c.1-.3.1-.7.1-1Z"/></>,
    grid:<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>
  };
  return <i className={`nav-glyph nav-glyph-${tone} ${kind==="group"?"nav-glyph-group":""}`} data-nav-icon={type} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[type]}</svg></i>;
}


function Kpi({ icon, label, value, note, tone = "blue", percent }: { icon: string; label: string; value: string; note: string; tone?: string; percent?: number }) {
  const bars=[42,68,54,82,61,92,73,100];
  const pct=percent===undefined?null:Math.max(0,Math.min(100,Number(percent||0)));
  return <article className={`kpi kpi-${tone}`}><span className={`kpi-pictogram ${tone}`}><NavIcon name={kpiIconName(label,icon)}/></span><div className="kpi-content"><small>{label}</small><strong>{value}</strong><p>{note}</p><div className="kpi-mini-visual"><div className="kpi-mini-columns" aria-hidden="true">{bars.map((height,index)=><i key={index} style={{height:`${height}%`}}/>)}</div>{pct!==null&&<b className="kpi-percent">{pct.toLocaleString("vi-VN",{maximumFractionDigits:1})}%</b>}</div></div></article>;
}

const UI_TODAY = new Date(UI_NOW_MS).toISOString().slice(0, 10);
export {
  ADMIN_HELP_TEXT,
  APPROVAL_MODE_LABELS,
  APPROVAL_MODE_SHORT,
  APPROVAL_STAGE_LABELS,
  BOQ_SYSTEM_CODES,
  CODE39,
  CardHead,
  DEPT_MODULE_GROUP,
  Empty,
  Kpi,
  NAV_ICON_TONE,
  NAV_ICON_TYPE,
  NavIcon,
  PERM_CAPS,
  PROJECT_STATUS_LABELS,
  UI_NOW_MS,
  UI_TODAY,
  WORK_CLOSED,
  WORK_STATUS_LABELS,
  boqStatusLabel,
  canvasJpegBytesForDownload,
  date,
  defaultMenuGroups,
  durationText,
  format,
  initials,
  joinCodes,
  kpiIconName,
  materialCatalogTemplateRows,
  money,
  normalizeBoqHeader,
  normalizeMasterHeader,
  normalizePaymentDate,
  projectPeriod,
  roleNames,
  sanitizeUiText,
  taskStatusLabel,
  truthyCatalog,
};
export type {
  AppData,
  ModuleKey,
  Row,
};