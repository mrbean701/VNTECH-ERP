// PHASE 1 (U-11) — LÁT CẮT ĐẦU TIÊN TÁCH KHỎI `app/page.tsx`.
//
// Vì sao tách: `app/page.tsx` là MỘT tệp khổng lồ (hơn 4.000 dòng, hơn 250 khai báo top-level).
// Thứ tự cắt ĐÚNG (đã ghi ở `docs/agent-progress/U14-U11-KHAO-SAT.md` mục 2) là:
//   bước 1 tách HELPER DÙNG CHUNG trước (gỡ chặn IMPORT VÒNG), rồi mới tách từng màn.
// Đây chính là bước 1.
//
// ⚠️ ĐIỀU KIỆN AN TOÀN CỦA LÁT CẮT NÀY (do `tools/tach-lat-cat-page.mjs` tự kiểm trước khi ghi):
//   mọi thứ trong tệp này CHỈ dùng hàm/kiểu có sẵn của JS và các khai báo CÙNG nằm trong tệp này —
//   KHÔNG có JSX, KHÔNG import gì. Nhờ vậy nó KHÔNG THỂ tạo import vòng.
//   Muốn thêm thứ cần JSX/import vào đây thì phải thêm import tương ứng — và phải chạy lại cổng ảnh.
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
export {
  UI_NOW_MS,
  defaultMenuGroups,
  roleNames,
  format,
  projectPeriod,
  NAV_ICON_TYPE,
  NAV_ICON_TONE,
  DEPT_MODULE_GROUP,
  taskStatusLabel,
  WORK_STATUS_LABELS,
  WORK_CLOSED,
  PROJECT_STATUS_LABELS,
  initials,
  durationText,
  kpiIconName,
  APPROVAL_STAGE_LABELS,
  sanitizeUiText,
  normalizeMasterHeader,
  truthyCatalog,
  materialCatalogTemplateRows,
  normalizeBoqHeader,
  BOQ_SYSTEM_CODES,
  boqStatusLabel,
  normalizePaymentDate,
  ADMIN_HELP_TEXT,
  joinCodes,
  APPROVAL_MODE_LABELS,
  APPROVAL_MODE_SHORT,
  PERM_CAPS,
  canvasJpegBytesForDownload,
  CODE39,
};
export type {
  Row,
  ModuleKey,
};