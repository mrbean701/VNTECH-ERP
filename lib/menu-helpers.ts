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

import { defaultMenuGroups } from "@/lib/ui-shared";
import type { AppData, ModuleKey, Row } from "@/lib/ui-shared";
function configuredMenuGroups(data: AppData, includeHidden = false): Row[] {
  const dbCatalog: Row[] = Array.isArray(data.menuGroups) ? data.menuGroups : [];
  const catalog: Row[] = [...dbCatalog, ...defaultMenuGroups.filter((row)=>!dbCatalog.some((db)=>String(db.groupKey)===String(row.groupKey)))];
  const unique = new Map<string, Row>();
  catalog.forEach((row) => {
    const groupKey = String(row.groupKey || "").trim();
    if (!groupKey || unique.has(groupKey)) return;
    unique.set(groupKey, { ...row, groupKey });
  });
  return [...unique.values()]
    .filter((row) => String(row.groupKey) !== "project_management")
    .map((row): Row => {
      const normalized = String(row.groupKey) === "site_command" ? { ...row, name: "QUẢN LÝ DỰ ÁN", icon: "DA", sortOrder: 25 } : row;
      return { ...normalized, active: normalized.active === undefined ? true : Boolean(normalized.active), collapsible: normalized.collapsible === undefined ? true : Boolean(normalized.collapsible), sortOrder: Number(normalized.sortOrder || 0) };
    })
    .filter((row) => includeHidden || row.active).sort((a, b) => a.sortOrder - b.sortOrder || String(a.name).localeCompare(String(b.name), "vi"));
}

const modules: { key: ModuleKey; label: string; icon: string; groupKey?: string; subGroup?: string }[] = [
  { key: "dashboard", label: "Tổng quan điều hành", icon: "OV", groupKey: "overview" },
  { key: "dept_plan_tasks", label: "Nhiệm vụ nhân viên đang làm", icon: "NV", groupKey: "my_work", subGroup: "Phòng Kế hoạch" },
  { key: "dept_plan_assign", label: "Giao việc & Kiểm soát hoàn thành", icon: "GV", groupKey: "my_work", subGroup: "Phòng Kế hoạch" },
  { key: "dept_plan_supply_plan", label: "Kế hoạch mua hàng & cung ứng", icon: "KH", groupKey: "purchasing", subGroup: "Phòng Kế hoạch" },
  { key: "dept_plan_tender", label: "Đấu thầu", icon: "DT", groupKey: "purchasing", subGroup: "Phòng Kế hoạch" },
  { key: "dept_plan_rfq", label: "Xin giá vật tư", icon: "RF", groupKey: "purchasing", subGroup: "Phòng Kế hoạch" },
  { key: "dept_plan_purchasing", label: "Mua hàng vật tư thiết bị", icon: "MH", groupKey: "purchasing", subGroup: "Phòng Kế hoạch" },
  { key: "dept_plan_supply", label: "Cung ứng vật tư cho dự án", icon: "CU", groupKey: "purchasing", subGroup: "Phòng Kế hoạch" },
  { key: "dept_plan_contracts", label: "Hợp đồng các loại", icon: "HD", groupKey: "purchasing", subGroup: "Phòng Kế hoạch" },
  { key: "dept_plan_suppliers", label: "Nhà cung cấp / Đối tác", icon: "NC", groupKey: "purchasing", subGroup: "Phòng Kế hoạch" },
  { key: "dept_plan_price_data", label: "Giá & dữ liệu thương mại", icon: "DG", groupKey: "purchasing", subGroup: "Phòng Kế hoạch" },
  { key: "dept_plan_kpi", label: "KPI & hiệu suất nhân viên", icon: "KP", groupKey: "reports", subGroup: "Phòng Kế hoạch" },
  { key: "dept_plan_alerts", label: "Báo cáo & cảnh báo", icon: "CB", groupKey: "reports", subGroup: "Phòng Kế hoạch" },
  { key: "reports_center", label: "Báo cáo tổng hợp", icon: "BC", groupKey: "reports" },
  { key: "dept_project_tasks", label: "Nhiệm vụ nhân viên đang làm", icon: "NV", groupKey: "my_work", subGroup: "Phòng Dự án" },
  { key: "dept_project_pda", label: "PDA / Điều phối dự án", icon: "PD", groupKey: "mep", subGroup: "Phòng Dự án" },
  { key: "dept_project_assign", label: "Giao việc & Kiểm soát hoàn thành", icon: "GV", groupKey: "my_work", subGroup: "Phòng Dự án" },
  { key: "dept_project_plan", label: "Kế hoạch triển khai dự án", icon: "KH", groupKey: "mep", subGroup: "Phòng Dự án" },
  { key: "dept_project_shop", label: "Shopdrawing & trình duyệt", icon: "SD", groupKey: "mep", subGroup: "Phòng Dự án" },
  { key: "dept_project_boq", label: "BOQ & bóc tách khối lượng", icon: "BQ", groupKey: "mep", subGroup: "Phòng Dự án" },
  { key: "dept_project_material", label: "Kiểm soát vật tư & đặt hàng", icon: "VT", groupKey: "mep", subGroup: "Phòng Dự án" },
  { key: "dept_project_issues", label: "Phát sinh / RFI / RFQ / NCR", icon: "PS", groupKey: "mep", subGroup: "Phòng Dự án" },
  { key: "dept_project_asbuilt", label: "Hoàn công", icon: "HC", groupKey: "mep", subGroup: "Phòng Dự án" },
  { key: "dept_project_payment", label: "Thanh toán / Quyết toán", icon: "TT", groupKey: "finance", subGroup: "Phòng Dự án" },
  { key: "dept_project_tender", label: "Đấu thầu kỹ thuật", icon: "DT", groupKey: "mep", subGroup: "Phòng Dự án" },
  { key: "dept_project_kpi", label: "KPI & hiệu suất nhân viên", icon: "KP", groupKey: "reports", subGroup: "Phòng Dự án" },
  { key: "dept_project_alerts", label: "Báo cáo & cảnh báo", icon: "CB", groupKey: "reports", subGroup: "Phòng Dự án" },
  { key: "dept_finance_payment_plan", label: "Kế hoạch thanh toán", icon: "KT", groupKey: "finance", subGroup: "Tài chính Kế toán" },
  { key: "dept_finance_recovery", label: "Thu hồi vốn / Công nợ", icon: "TH", groupKey: "finance", subGroup: "Tài chính Kế toán" },
  { key: "dept_finance_advance", label: "Tạm ứng / Hoàn ứng", icon: "TU", groupKey: "finance", subGroup: "Tài chính Kế toán" },
  { key: "dept_finance_site_cost", label: "Chi phí Ban chỉ huy", icon: "CP", groupKey: "finance", subGroup: "Tài chính Kế toán" },
  { key: "dept_finance_cashbank", label: "Sổ quỹ & Ngân hàng", icon: "SQ", groupKey: "finance", subGroup: "Tài chính Kế toán" },
  { key: "dept_finance_documents", label: "Chứng từ kế toán", icon: "CT", groupKey: "finance", subGroup: "Tài chính Kế toán" },
  { key: "dept_legal_hr", label: "Hồ sơ nhân sự", icon: "NS", groupKey: "hr_legal", subGroup: "Hành chính Pháp chế" },
  { key: "dept_legal_labor", label: "Hợp đồng lao động", icon: "LD", groupKey: "hr_legal", subGroup: "Hành chính Pháp chế" },
  { key: "dept_legal_correspondence", label: "Công văn đến / đi", icon: "CV", groupKey: "hr_legal", subGroup: "Hành chính Pháp chế" },
  { key: "dept_legal_documents", label: "Văn bản pháp lý", icon: "PL", groupKey: "hr_legal", subGroup: "Hành chính Pháp chế" },
  { key: "dept_legal_seal", label: "Con dấu / Ủy quyền", icon: "CD", groupKey: "hr_legal", subGroup: "Hành chính Pháp chế" },
  { key: "dept_legal_benefits", label: "Bảo hiểm & Chế độ", icon: "BH", groupKey: "hr_legal", subGroup: "Hành chính Pháp chế" },
  { key: "site_command", label: "Quản lý dự án", icon: "BC", groupKey: "site_command" },
  { key: "project_progress", label: "Tiến độ & sản lượng dự án", icon: "TD", groupKey: "project_management" },
  { key: "construction", label: "Thi công", icon: "TC", groupKey: "project_management" },
  { key: "production", label: "Sản lượng", icon: "SL", groupKey: "project_management" },
  { key: "capital_recovery", label: "Thu hồi vốn", icon: "TH", groupKey: "project_management" },
  { key: "boq", label: "BOQ / Hợp đồng dự án", icon: "BQ", groupKey: "project_management" },
  { key: "payments", label: "Thanh toán HĐ", icon: "TT", groupKey: "project_management" },
  { key: "teams", label: "Tổ đội theo dự án", icon: "TĐ", groupKey: "project_management" },
  { key: "requests", label: "Phiếu đề nghị mua hàng", icon: "ĐN", groupKey: "purchasing" },
  { key: "approvals", label: "Workflow", icon: "PD", groupKey: "purchasing" },
  { key: "purchasing", label: "Mua hàng & PO", icon: "PO", groupKey: "purchasing" },
  { key: "supplier_catalog", label: "Danh mục Nhà cung cấp", icon: "NC", groupKey: "purchasing" },
  { key: "receiving", label: "Kế hoạch giao hàng", icon: "GH", groupKey: "purchasing" },
  { key: "delivered", label: "Đơn hàng đã giao", icon: "DG", groupKey: "purchasing" },
  { key: "warehouse_receipt", label: "Nhập kho", icon: "NK", groupKey: "warehouse" },
  { key: "warehouse_issue", label: "Xuất kho", icon: "XK", groupKey: "warehouse" },
  { key: "inventory", label: "Tồn kho & điều chuyển", icon: "TK", groupKey: "warehouse" },
  { key: "stocktake", label: "Kiểm kê & hoàn trả", icon: "KK", groupKey: "warehouse" },
  { key: "material_norms", label: "Định mức vật tư theo dự án", icon: "ĐM", groupKey: "warehouse" },
  { key: "central_warehouse", label: "Kho Tổng", icon: "KT", groupKey: "warehouse" },
  { key: "material_catalog", label: "Danh mục vật tư gốc", icon: "MV", groupKey: "material_master" },
  { key: "admin", label: "Phân quyền & Cấu hình hệ thống", icon: "QT", groupKey: "system_admin" },
];

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 3 (`T-01`) — NHÓM MENU «CÔNG VIỆC» TÁCH THÀNH 5 MỤC (PHƯƠNG ÁN A: không migration).
//
// VÌ SAO 5 MỤC NÀY KHAI BÁO TRONG CODE (không thêm dòng `module_catalog`): nhãn menu của khoá ĐÃ CÓ
// trong `module_catalog` lấy từ DB (`configuredModules()`: `config?.label || item.label` — `lib/workflow-helpers.ts`),
// nên muốn 5 nhãn «Cá nhân · Phòng ban · Giao việc · Dashboard · Báo cáo» thì PHẢI là 5 khoá MỚI KHÔNG có
// `config` ⇒ lấy nhãn trong code. Bốn khoá `dept_*` cũ bị ẨN KHỎI MENU nhưng VẪN là khoá nghiệp vụ THẬT
// (quyền · tiêu đề màn · tìm kiếm · thông báo · nhánh render) ⇒ mỗi mục menu chỉ ĐỔI ĐÍCH ĐẾN, không đổi màn.
// ─────────────────────────────────────────────────────────────────────────────
type WorkMenuView = "personal" | "department" | "assign" | "kpi" | "reports";
const workMenuItems: { key: string; label: string; groupKey: "my_work"; view: WorkMenuView; permissionKeys: ModuleKey[] }[] = [
  { key: "work_personal", label: "Cá nhân", groupKey: "my_work", view: "personal", permissionKeys: ["dept_plan_tasks", "dept_project_tasks"] },
  { key: "work_department", label: "Phòng ban", groupKey: "my_work", view: "department", permissionKeys: ["dept_plan_assign", "dept_project_assign"] },
  { key: "work_assign", label: "Giao việc", groupKey: "my_work", view: "assign", permissionKeys: ["dept_plan_assign", "dept_project_assign"] },
  { key: "work_dashboard", label: "Dashboard", groupKey: "my_work", view: "kpi", permissionKeys: ["dept_plan_kpi", "dept_project_kpi"] },
  { key: "work_reports", label: "Báo cáo", groupKey: "my_work", view: "reports", permissionKeys: ["dept_plan_alerts", "dept_project_alerts"] },
];
// BỐN MỤC CŨ BỊ ẨN KHỎI MENU (`T-01`). Khoá vẫn sống: quyền, tiêu đề, tìm kiếm, thông báo, nhánh render.
// `approvals` («Trung tâm phê duyệt») CỐ Ý KHÔNG nằm ở đây — nó là mục thứ 6 của nhóm, do `T-10` tách riêng.
const legacyWorkMenuKeys: ModuleKey[] = ["dept_plan_tasks", "dept_project_tasks", "dept_plan_assign", "dept_project_assign"];

// KP #96 (18/09/2026) — ĐÃ DỌN "cây workspace theo dự án" (8 mục/dự án + khoá ngữ cảnh dự án).
// Lý do: hai nhánh render treo trên một SENTINEL không bao giờ khớp — `configuredMenuGroups()` chỉ ghép từ
// `menu_group_catalog` (12 nhóm thật, đo trên CẢ MySQL + SQLite) + bản fallback (12 nhóm), và nhóm
// `project_management` còn bị chính hàm đó LỌC BỎ ⇒ tính năng KHÔNG BAO GIỜ render, chỉ còn mã chết.
// Giao diện THẬT của nhóm «QUẢN LÝ DỰ ÁN» là danh sách con phẳng (`group.children.map`), giữ nguyên.
// Bằng chứng: tools/probe-kp96-dead-project-tree.mjs · docs/agent-progress/TASK-090.md · MASTER_STATUS KP #96.

export {
  configuredMenuGroups,
  legacyWorkMenuKeys,
  modules,
  workMenuItems,
};
export type { WorkMenuView };