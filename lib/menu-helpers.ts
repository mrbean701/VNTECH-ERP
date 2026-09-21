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
  { key: "dept_plan_suppliers", label: "Nhà cung cấp", icon: "NC", groupKey: "purchasing", subGroup: "Phòng Kế hoạch" },
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

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 5 (`W-01`) — NHÓM MENU «KHO VẬT TƯ» TÁCH THÀNH 5 MỤC: «Kho · Nhập · Xuất · Điều chuyển · Dashboard tồn kho»
// (PHƯƠNG ÁN A — ĐÚNG KHUÔN `T-01`: KHÔNG migration, KHÔNG khoá module mới).
//
// NGUYÊN VĂN YÊU CẦU: `docs/25_TODO_ROADMAP.md` dòng `W-01` — «Tách 5 mục: Kho · Nhập · Xuất · Điều chuyển · Dashboard tồn kho».
//
// VÌ SAO 5 MỤC NÀY KHAI BÁO TRONG CODE (không thêm dòng `module_catalog`): giống hệt lý do đã ghi ở `T-01`
// (xem khối `workMenuItems` phía trên) — muốn 5 NHÃN MỚI thì phải là 5 khoá mới KHÔNG có `config` trong
// `module_catalog` ⇒ lấy nhãn trong code. SÁU khoá `warehouse_receipt` · `warehouse_issue` · `inventory` ·
// `stocktake` · `material_norms` · `central_warehouse` bị ẨN KHỎI MENU nhưng VẪN là khoá nghiệp vụ THẬT
// (quyền · tiêu đề màn · tìm kiếm · thông báo · nhánh render trong `app/page.tsx`) ⇒ mỗi mục menu chỉ ĐỔI ĐÍCH ĐẾN.
//
// ⚠️ CỔNG QUYỀN: mỗi mục mang `permissionKeys` trỏ tới khoá ĐÃ CÓ và được lọc bằng
// `modulePermission(data, key).canView` (giống `T-01`) — KHÔNG hardcode admin, KHÔNG khoá mới.
//   • Nhập → `warehouse_receipt` · Xuất → `warehouse_issue` · Điều chuyển → `inventory` · Kho → `central_warehouse`.
//   • Dashboard tồn kho → `stocktake`: đây là khoá kho THỨ 6 và là khoá DUY NHẤT còn chưa được mục nào dùng làm
//     cổng quyền; "Kiểm kê & hoàn trả" và "Dashboard tồn kho" cùng phạm vi «tồn kho thực tế» nên dùng chung
//     khoá này là hợp lý nhất trong 6 khoá ĐÃ CÓ. (Phương án thay thế — dùng lại `inventory` — sẽ khiến 2 mục
//     menu TRÙNG cổng quyền, phá yêu cầu "mỗi mục có cổng quyền riêng".)
//   • `material_norms` (Định mức vật tư) là khoá THỨ 6 KHÔNG còn mục menu nào trỏ tới. Khoá vẫn SỐNG
//     (nhánh render `active === "material_norms" && <MaterialNormsScreen …>` + quyền riêng của nó giữ nguyên);
//     việc GIỮ hay BỎ lối vào menu của màn này là QUYẾT ĐỊNH CỦA NGƯỜI DÙNG — đã ghi ở `TASK-100.md` mục 8.
// ─────────────────────────────────────────────────────────────────────────────
type WarehouseMenuView = "dashboard";
const warehouseMenuItems: { key: string; label: string; groupKey: "warehouse"; moduleKey: ModuleKey; permissionKeys: ModuleKey[]; view?: WarehouseMenuView }[] = [
  { key: "warehouse_hub", label: "Kho", groupKey: "warehouse", moduleKey: "central_warehouse", permissionKeys: ["central_warehouse"] },
  { key: "warehouse_inbound", label: "Nhập", groupKey: "warehouse", moduleKey: "warehouse_receipt", permissionKeys: ["warehouse_receipt"] },
  { key: "warehouse_outbound", label: "Xuất", groupKey: "warehouse", moduleKey: "warehouse_issue", permissionKeys: ["warehouse_issue"] },
  { key: "warehouse_transfer", label: "Điều chuyển", groupKey: "warehouse", moduleKey: "inventory", permissionKeys: ["inventory"] },
  { key: "warehouse_dashboard", label: "Dashboard tồn kho", groupKey: "warehouse", moduleKey: "inventory", permissionKeys: ["stocktake"], view: "dashboard" },
];
// SÁU MỤC CŨ BỊ ẨN KHỎI MENU (`W-01`). Khoá vẫn sống: quyền, tiêu đề màn, tìm kiếm, nhánh render.
const legacyWarehouseMenuKeys: ModuleKey[] = ["warehouse_receipt", "warehouse_issue", "inventory", "stocktake", "material_norms", "central_warehouse"];

// PHASE 5 (`W-01`) — ĐÍCH ĐẾN THẬT của 5 mục nhóm KHO: mục «Dashboard tồn kho» mở **TAB** dashboard của màn
// Tồn kho (`app/screens/Inventory.tsx`) — KHÔNG màn mới, KHÔNG route mới, KHÔNG khoá module mới. Bốn mục kia
// giữ nguyên hành vi cũ nên hàm này trả `null` cho chúng (đúng cách `workCenterViewFor` đang làm với `T-01`).
function warehouseMenuViewFor(view: WarehouseMenuView | null, active: ModuleKey): WarehouseMenuView | null {
  if (view === "dashboard" && active === "inventory") return "dashboard";
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 7 (`P-07`) — NHÓM «MUA HÀNG»: TÁCH MỤC GỘP CŨ THÀNH 2 MỤC RIÊNG
// «Nhà cung cấp» + «Đối tác» (ĐÚNG KHUÔN `T-01`/`W-01`: khai báo trong CODE, KHÔNG migration,
// KHÔNG thêm dòng `module_catalog`).
//
// VÌ SAO 2 MỤC NÀY KHAI TRONG CODE: muốn 2 NHÃN riêng thì phải có 2 mục menu riêng; khoá menu của mục
// «Đối tác» là khoá MỚI **KHÔNG** có `config` trong `module_catalog` ⇒ nhãn lấy từ code (cùng lý do `T-01`).
// Khoá CŨ `dept_plan_suppliers` GIỮ NGUYÊN (tương thích ngược: quyền · tiêu đề màn · tìm kiếm · nhánh render
// `SupplierManager` trong `app/page.tsx` đều vẫn treo trên khoá này) — mục menu chỉ ĐỔI NHÃN + ĐÍCH ĐẾN.
//
// ⚠️ CỔNG QUYỀN: CẢ HAI mục dùng CHUNG khoá ĐÃ CÓ `dept_plan_suppliers` (`permissionKeys`) — đúng chỉ dẫn
// «nếu hệ thống bắt buộc có khoá module để `canView` ⇒ trỏ cùng `permissionKeys` của khoá cũ».
// KHÔNG khoá module mới · KHÔNG hardcode admin · KHÔNG dòng `module_catalog`.
//
// ⚠️ CHƯA NỐI VÀO `app/page.tsx` (lượt `P-07` này CHỈ được sửa `lib/menu-helpers.ts`): màn `SupplierManager`
// hiện chỉ nhận `{data, action}` (`app/screens/SupplierManager.tsx` dòng 16) ⇒ muốn 2 mục HIỆN ra kèm lọc
// theo `view` thì phải nối tiếp theo đúng khuôn `W-01` — xem `docs/agent-progress/TASK-121.md` mục 4.
//
// ⚠️ MÀN ĐÍCH DÙNG CHÍNH KHOÁ CŨ `dept_plan_suppliers` — ĐO ĐƯỢC, không suy đoán:
//   • TRƯỚC `P-07`, mục gộp cũ rơi vào nhánh CHUNG `active.startsWith("dept_plan_")` ⇒ mở
//     `DepartmentTaskWorkspace` (bảng nhiệm vụ phòng Kế hoạch), KHÔNG phải `SupplierManager`.
//   • Vì vậy `P-07` thêm NHÁNH RENDER RIÊNG cho `dept_plan_suppliers` → `SupplierManager` và LOẠI khoá này
//     khỏi nhánh chung `dept_plan_*` (nối ở `app/page.tsx`).
//   • KHÔNG trỏ sang `supplier_catalog`: `accessDenied` của màn được tính theo `active`
//     (`app/page.tsx`: `permissionConfigured && !activePermission.canView`) ⇒ trỏ sang khoá KHÁC sẽ khiến
//     người có quyền `dept_plan_suppliers` nhưng không có quyền `supplier_catalog` bị chặn quyền oan.
//     Đích đến = CỔNG QUYỀN = khoá cũ ⇒ nhất quán.
// ─────────────────────────────────────────────────────────────────────────────
type SupplierPartnerMenuView = "supplier" | "partner";
const supplierPartnerMenuItems: { key: string; label: string; groupKey: "purchasing"; moduleKey: ModuleKey; view: SupplierPartnerMenuView; permissionKeys: ModuleKey[] }[] = [
  { key: "dept_plan_suppliers", label: "Nhà cung cấp", groupKey: "purchasing", moduleKey: "dept_plan_suppliers", view: "supplier", permissionKeys: ["dept_plan_suppliers"] },
  { key: "dept_plan_partners", label: "Đối tác", groupKey: "purchasing", moduleKey: "dept_plan_suppliers", view: "partner", permissionKeys: ["dept_plan_suppliers"] },
];
// Dòng `dept_plan_suppliers` trong bảng `modules` bị ẨN KHỎI CÂY MENU (đúng khuôn `legacyWorkMenuKeys` /
// `legacyWarehouseMenuKeys`) — khoá vẫn SỐNG: quyền · tiêu đề màn · tìm kiếm · nhánh render màn theo `dept_plan_*`.
const legacySupplierPartnerMenuKeys: ModuleKey[] = ["dept_plan_suppliers"];

// ĐÍCH ĐẾN THẬT của 2 mục: CÙNG màn `SupplierManager` — KHÔNG màn mới, KHÔNG route mới, KHÔNG khoá module mới.
// `view` chỉ đổi TIÊU ĐỀ/cảnh báo của màn; điều hướng cũ (không kèm `view`) trả `null` để GIỮ NGUYÊN hành vi
// (đúng cách `warehouseMenuViewFor` đang làm với `W-01`).
function supplierPartnerViewFor(view: SupplierPartnerMenuView | null, active: ModuleKey): SupplierPartnerMenuView | null {
  if (active !== "dept_plan_suppliers") return null;
  if (view === "supplier" || view === "partner") return view;
  return null;
}

// KP #96 (18/09/2026) — ĐÃ DỌN "cây workspace theo dự án" (8 mục/dự án + khoá ngữ cảnh dự án).
// Lý do: hai nhánh render treo trên một SENTINEL không bao giờ khớp — `configuredMenuGroups()` chỉ ghép từ
// `menu_group_catalog` (12 nhóm thật, đo trên CẢ MySQL + SQLite) + bản fallback (12 nhóm), và nhóm
// `project_management` còn bị chính hàm đó LỌC BỎ ⇒ tính năng KHÔNG BAO GIỜ render, chỉ còn mã chết.
// Giao diện THẬT của nhóm «QUẢN LÝ DỰ ÁN» là danh sách con phẳng (`group.children.map`), giữ nguyên.
// Bằng chứng: tools/probe-kp96-dead-project-tree.mjs · docs/agent-progress/TASK-090.md · MASTER_STATUS KP #96.

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 3 (`T-10`) — «Tách Approval Center thành module độc lập» (§12) BẰNG UI, KHÔNG MIGRATION.
//
// KHOÁ DÙNG: **`approvals`** — khoá ĐÃ CÓ, không thêm gì mới:
//   • `module_catalog` có sẵn dòng `approvals` (`drizzle/0076_phase_menu_11_groups_identity.sql`:35-36 gán nhóm
//     `my_work`, :76 đặt `sort_order` 50);
//   • `ModuleKey` (`lib/ui-shared.tsx`) đã có `"approvals"`;
//   • màn đã độc lập sẵn: `app/page.tsx` — `active === "approvals" && <Approvals …>`.
// Việc còn lại thuần HIỂN THỊ MENU: đưa `approvals` ra khỏi `children` của mọi nhóm và dựng NHÓM RIÊNG
// `approval_center` (KHOÁ NHÓM MENU — KHÔNG phải khoá module, KHÔNG có dòng `module_catalog`, KHÔNG migration).
// ⚠️ Khoá module MỚI cần `module_catalog` + `MODULE_KEYS` + migration ⇒ NGOÀI PHẠM VI (kết luận đã ghi ở `T-01`).
// ─────────────────────────────────────────────────────────────────────────────
const approvalCenterMenuKey: ModuleKey = "approvals";
const approvalCenterGroup = { groupKey: "approval_center", name: "PHÊ DUYỆT", icon: "PD", sortOrder: 20 } as const;
// Hai mục menu KHÔNG bao giờ nằm trong `children` của nhóm: chúng là mục ĐỘC LẬP ở cấp cao nhất
// (`dashboard` = «TỔNG QUAN ĐIỀU HÀNH» — hành vi CŨ giữ nguyên; `approvals` = Trung tâm phê duyệt — `T-10`).
const independentMenuKeys: ModuleKey[] = ["dashboard", "approvals"];

export {
  approvalCenterGroup,
  approvalCenterMenuKey,
  configuredMenuGroups,
  independentMenuKeys,
  legacySupplierPartnerMenuKeys,
  legacyWarehouseMenuKeys,
  legacyWorkMenuKeys,
  modules,
  supplierPartnerMenuItems,
  supplierPartnerViewFor,
  warehouseMenuItems,
  warehouseMenuViewFor,
  workMenuItems,
};
export type { SupplierPartnerMenuView, WarehouseMenuView, WorkMenuView };