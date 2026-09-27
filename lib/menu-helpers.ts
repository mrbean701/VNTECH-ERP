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
  // 📌 QUYẾT ĐỊNH USER 26/09/2026 (MT3 §E): «Giao nhận công trường» / «Kế hoạch giao hàng» —
  //    user chốt «cứ làm theo đề xuất» ⇒ ĐỔI TÊN mục/màn hiện có thành «Giao nhận công trường»
  //    (⛔ KHÔNG tách 2 tab: bản chất là cùng một việc thông báo cho BCH dự án sắp xếp nhận hàng).
  { key: "receiving", label: "Giao nhận công trường", icon: "GH", groupKey: "purchasing" },
  { key: "delivered", label: "Đơn hàng đã giao", icon: "DG", groupKey: "purchasing" },
  // MT2-P8-01 (§6.1) — «Đưa menu NCC XUỐNG CUỐI NHÓM menu tương ứng.»
  // ⚠️ TRƯỚC: `supplier_catalog` nằm ở vị trí thứ 4/6 (giữa nhóm «MUA HÀNG») ⇒ NAY chuyển xuống CUỐI nhóm.
  // ✅ GIỮ NGUYÊN `key`/`label`/`icon`/`groupKey` ⇒ `tests/p07-supplier-partner-split.test.mjs`
  //    ⚠️ Trước đây trỏ `…-probe.mjs` — probe đó **đã XOÁ** (xem `docs/dsh/MT3_USER_DECISIONS.md` &#9315;).
  //    (`label:"Danh mục Nhà cung cấp"`, `groupKey:"purchasing"`, `sortOrder:120`) vẫn KHỚP (§26).
  { key: "supplier_catalog", label: "Danh mục Nhà cung cấp", icon: "NC", groupKey: "purchasing" },
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
// MT2-P5-01 (§3.1) — THÊM `"dashboard"` vào union: trước đây mục «Dashboard» của nhóm «Công việc»
// khai `view: "kpi"` (SAI — trỏ vào tab KPI) nên khi click ⇒ `workCenterViewFor("kpi", "work_dashboard")`
// KHÔNG khớp nhánh `dept_plan_kpi`/`dept_project_kpi` ⇒ trả `null` ⇒ ⛔ KHÔNG render WorkCenter
// ⇒ ⛔ KHÔNG hiển thị Dashboard (LỖI CÓ SẴN, phát hiện ở MT2-PHASE-5-AUDIT §7).
type WorkMenuView = "personal" | "department" | "assign" | "kpi" | "reports" | "dashboard";
// MT2-P5-02 (§3.1 ②) — «đưa Dashboard lên **ĐẦU menu** nếu vẫn giữ menu»:
// mục «Dashboard» được ĐƯA LÊN ĐẦU nhóm «Công việc» (trước đây ở vị trí thứ 4).
// ⚠️ ĐO được: click nhóm CHA chỉ `toggleGroup` (expand/collapse) — ⛔ KHÔNG `setActive` (page.tsx:483)
//    ⇒ ⛔ KHÔNG thể «vào Dashboard bằng click nhóm cha»; cách đúng §3.1 ② là ĐỂ DASHBOARD ĐẦU MENU ✔
// ⛔ KHÔNG xoá mục (giữ §3.1 ③ làm phương án khác) ⇒ ⛔ không thể tạo hồi quy (mất lối vào) ✔
const workMenuItems: { key: string; label: string; groupKey: "my_work"; view: WorkMenuView; permissionKeys: ModuleKey[] }[] = [
  // MT2-P5-01 — `view: "kpi"` ⇒ **`view: "dashboard"`** (mục này là «Dashboard», KHÔNG phải tab KPI).
  // ⚠️ `permissionKeys` GIỮ NGUYÊN (`dept_plan_kpi`/`dept_project_kpi`) — §3.1 KHÔNG nói đổi quyền ⇒ ⛔ không tự đổi.
  { key: "work_dashboard", label: "Dashboard", groupKey: "my_work", view: "dashboard", permissionKeys: ["dept_plan_kpi", "dept_project_kpi"] },
  { key: "work_personal", label: "Cá nhân", groupKey: "my_work", view: "personal", permissionKeys: ["dept_plan_tasks", "dept_project_tasks"] },
  { key: "work_department", label: "Phòng ban", groupKey: "my_work", view: "department", permissionKeys: ["dept_plan_assign", "dept_project_assign"] },
  { key: "work_assign", label: "Giao việc", groupKey: "my_work", view: "assign", permissionKeys: ["dept_plan_assign", "dept_project_assign"] },
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

// ─────────────────────────────────────────────────────────────────────────────
// MT2-P9-06 (§7.6) — NHÓM «KHO VẬT TƯ»: THÊM **MENU ITEM MỚI** «Cấp phát & hoàn trả»
// (ĐÚNG KHUÔN `P-07`/`W-01`/`T-01`: khai báo trong CODE, ⛔ KHÔNG migration, ⛔ KHÔNG khoá module mới).
//
// NGUYÊN VĂN §7.6: `[ Cấp phát ] [ Hoàn trả ]` — mỗi tab danh sách riêng (mã đơn · người tạo ·
// tổ đội/người nhận · dự án · kho xuất · kho nhập đối với hoàn trả).
// ⚠️ «Logic nghiệp vụ + workflow + quyền triển khai SAU khi business rule xác định ⇒ hiện tại
//    CHỈ triển khai cấu trúc UI/list/tab/data foundation. ⛔ Không tự suy diễn nghiệp vụ» (§14).
//
// ⚠️ CỔNG QUYỀN: mục mới dùng CHUNG khoá ĐÃ CÓ `warehouse_issue` (`permissionKeys`) — đúng chỉ dẫn
//    P-07 «nếu hệ thống bắt buộc có khoá module để canView ⇒ trỏ cùng permissionKeys của khoá cũ».
//    `view: "list"` để `app/page.tsx` phân biệt màn mới với màn «Xuất» (cùng moduleKey) — khuôn
//    `supplierPartnerViewFor`. KHÔNG khoá module mới · KHÔNG hardcode admin · KHÔNG dòng module_catalog.
const allocateReturnMenuItems: { key: string; label: string; groupKey: "warehouse"; moduleKey: ModuleKey; view: "list"; permissionKeys: ModuleKey[] }[] = [
  { key: "warehouse_allocate_return", label: "Cấp phát & hoàn trả", groupKey: "warehouse", moduleKey: "warehouse_issue", view: "list", permissionKeys: ["warehouse_issue"] },
];
// ĐÍCH ĐẾN: `view` trả "list" CHỈ khi active = `warehouse_issue` (cổng quyền); điều hướng cũ (không kèm
// view) trả `null` để GIỮ NGUYÊN hành vi màn «Xuất» (đúng cách `warehouseMenuViewFor`/`supplierPartnerViewFor`).
function allocateReturnViewFor(view: "list" | null, active: ModuleKey): "list" | null {
  if (active !== "warehouse_issue") return null;
  if (view === "list") return view;
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// MT2-P11-01 (§11) — NHÓM «BÁO CÁO»: ⛔ **BỎ CHIA MENU THEO PHÒNG BAN** ⇒ 1 MỤC TỔNG HỢP.
// NGUYÊN VĂN `docs/dsh/MASTER_TASK_2.md:234`: «Báo cáo & cảnh báo: ⛔ không chia menu theo phòng ban
// ⇒ hiển thị **thông tin tổng hợp**».
//
// ĐO ĐƯỢC TRƯỚC KHI CODE:
// · Menu ĐƯỢC dựng từ `configuredModules(data)` = `module_catalog` ⇒ khoá `reports_center` (màn tổng hợp đã có
//   sẵn: `app/page.tsx:575` render `ReportView` với `REPORT_CATALOG`) ⛔ KHÔNG có trong seed `module_catalog`
//   ⇒ mục đó **không thể** tự hiện trên menu.
// · Menu hiện CÓ 2 mục trùng nội dung, tách theo phòng ban: `dept_plan_alerts` «… – Phòng Kế hoạch» và
//   `dept_project_alerts` «… – Phòng Dự án» ⇒ **vi phạm §11**. Cả hai đều render CÙNG một màn
//   (`workCenterViewFor`: `view==="reports"` → `WorkCenter view="reports"`).
//
// ⇒ LÀM THEO ĐÚNG KHUÔN `W-01`/`P-07`/`P9-06`: 1 mục MỚI khai trong CODE (⛔ KHÔNG migration, ⛔ KHÔNG khoá module
// mới), cổng quyền trỏ CHUNG 2 khoá ĐÃ CÓ (`dept_plan_alerts` + `dept_project_alerts`), đích đến là màn tổng hợp
// ĐÃ CÓ (`reports_center`). 2 khoá cũ bị ẨN khỏi menu nhưng khoá vẫn sống (quyền · tìm kiếm · nhánh render).
const reportsSummaryMenuItems: { key: string; label: string; groupKey: "reports"; moduleKey: ModuleKey; permissionKeys: ModuleKey[] }[] = [
  { key: "reports_summary", label: "Báo cáo & cảnh báo", groupKey: "reports", moduleKey: "reports_center", permissionKeys: ["dept_plan_alerts", "dept_project_alerts"] },
];
// HAI MỤC CŨ BỊ ẨN KHỎI MENU (theo §11) — khoá vẫn sống, chỉ gỡ khỏi `children` của nhóm «reports».
const legacyReportsMenuKeys: ModuleKey[] = ["dept_plan_alerts", "dept_project_alerts"];

// ─────────────────────────────────────────────────────────────────────────────
// MT2-P11-02 (§11) — NHÓM «BÁO CÁO»: ⛔ **BỎ CHIA MENU THEO PHÒNG BAN** cho «KPI & hiệu suất»
// ⇒ 1 MỤC TỔNG HỢP. NGUYÊN VĂN `docs/dsh/MASTER_TASK_2.md:235`: «KPI & hiệu suất nhân viên: ⛔ không
// chia menu theo phòng ban ⇒ hiển thị **thông tin tổng hợp**».
//
// ĐO ĐƯỢC: `dept_plan_kpi` + `dept_project_kpi` CÙNG map về `WorkCenter view="kpi"`
// (`app/page.tsx:400` trong `workCenterViewFor`) ⇒ 2 mục, 1 nội dung, lặp theo phòng ban.
// ⚠️ Khác P11-01: màn đích đến **KHÔNG** phải `reports_center` mà là tab KPI của `WorkCenter`, nên mục mới
// PHẢI mang `view: "kpi"` + `moduleKey` thuộc 1 trong 2 khoá cũ (điều kiện khớp của `workCenterViewFor`).
// ⚠️ `dept_plan_kpi` đang được `work_dashboard` dùng làm `permissionKeys` — ⛔ đó là CỔNG QUYỀN, không phải
// menu ⇒ ẩn khỏi `children` KHÔNG ảnh hưởng mục «Dashboard» của nhóm «Công việc».
const kpiSummaryMenuItems: { key: string; label: string; groupKey: "reports"; moduleKey: ModuleKey; view: WorkMenuView; permissionKeys: ModuleKey[] }[] = [
  { key: "kpi_summary", label: "KPI & hiệu suất nhân viên", groupKey: "reports", moduleKey: "dept_plan_kpi", view: "kpi", permissionKeys: ["dept_plan_kpi", "dept_project_kpi"] },
];
// HAI MỤC CŨ BỊ ẨN KHỎI MENU (theo §11) — khoá vẫn sống (quyền · tìm kiếm · nhánh render `WorkCenter`).
const legacyKpiMenuKeys: ModuleKey[] = ["dept_plan_kpi", "dept_project_kpi"];

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
// 📌 QUYẾT ĐỊNH USER 26/09/2026 (MT3 §E): «Gộp thành 1 "Nhà cung cấp"» ⇒ THÊM `supplier_catalog` vào
//    danh sách ẩn khỏi cây menu (đúng khuôn `legacyWarehouseMenuKeys`).
//    • Mục menu DUY NHẤT còn lại là «Nhà cung cấp» (khai báo trong code, `view: "supplier"`).
//    • ⛔ KHÔNG xoá gì: khoá `supplier_catalog` VẪN SỐNG (quyền · tiêu đề màn · tìm kiếm · nhánh render),
//      chỉ bị ẨN khỏi cây menu đúng như yêu cầu «loại bỏ menu trùng».
const legacySupplierPartnerMenuKeys: ModuleKey[] = ["dept_plan_suppliers", "supplier_catalog"];

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

// ─────────────────────────────────────────────────────────────────────────────
// MT3 §IV.1 + §E — NHÓM «MUA HÀNG & CUNG ỨNG»: 10 TAB CẤP NHÓM.
//   §IV.1: «Chuyển các menu item cấp con vào màn hình của menu cha và hiển thị dưới dạng TAB».
//   §E:   yêu cầu 10 tab; ⛔ KHÔNG bịa khoá module mới — mỗi tab trỏ tới MÀN ĐÃ CÓ.
//   📌 QUYẾT ĐỊNH USER 26/09/2026 (docs/dsh/MT3_USER_DECISIONS.md):
//     • （2） GỘP 2 mục NCC thành 1 «Nhà cung cấp» — khoá mã cũ `supplier_catalog` đã bị ẩn khỏi menu
//           (`legacySupplierPartnerMenuKeys`) ⇒ tab này trỏ `dept_plan_suppliers` (màn NCC thật).
//     • （3） «Xin giá vật tư» = TAB RIÊNG (chưa chốt nghiệp vụ ⇒ ⛔ KHÔNG xây nghiệp vụ mới).
//     • （4） ĐỔI TÊN `receiving` thành «Giao nhận công trường» (⛔ không tách 2 tab).
//   ⚠️ §E có liệt kê tab «Báo cáo» nhưng QUYẾT ĐỊNH USER KHÔNG NHẮC TỚI và chưa xác định được MÀN báo cáo
//      nào của nhóm này ⇒ ⛔ KHÔNG tự chọn, chưa đưa vào (đã ghi trong biên bản quyết định).
const purchasingHubTabs: { key: ModuleKey; label: string }[] = [
  { key: "purchasing", label: "PR & PO" },
  { key: "requests", label: "Phiếu đề nghị mua hàng" },
  { key: "receiving", label: "Giao nhận công trường" },
  { key: "delivered", label: "Đơn hàng đã giao" },
  { key: "dept_plan_supply_plan", label: "Kế hoạch mua hàng & cung ứng" },
  { key: "dept_plan_tender", label: "Đấu thầu" },
  { key: "dept_plan_contracts", label: "Hợp đồng" },
  { key: "dept_plan_suppliers", label: "Nhà cung cấp" },
  { key: "dept_plan_price_data", label: "Giá & dữ liệu thương mại" },
  { key: "dept_plan_rfq", label: "Xin giá vật tư" },
];

// ══════════════════════════════════════════════════════════════════════════════════════════════════
// MT3 — «ĐƯA TẤT CẢ MỤC MENU VÀO NHÓM, CHUYỂN THÀNH TAB» (yêu cầu TRỰC TIẾP của user 27/09/2026)
//   Nguyên văn: «cái quan trọng nhất là đưa tất cả menu item vào trong menu chuyển thành tab
//                thì vẫn chưa được thực hiện».
//
// ⚠️ TRƯỚC ĐÂY: chỉ **MỘT** nhóm có thanh tab — `purchasingHubTabs` (10 tab curated) — hard-code
//    thẳng trong `app/page.tsx`; **BẢY** nhóm còn lại vẫn điều hướng từng mục rời rạc.
// ✅ NAY: **CƠ CHẾ DÙNG CHUNG** — mọi nhóm có ≥2 mục con đều sinh tab từ chính `modules`
//    (⛔ KHÔNG copy khối tab 7 lần — đúng §14 «1 component giải quyết nhiều màn»).
// ══════════════════════════════════════════════════════════════════════════════════════════════════

/**
 * Các `groupKey` được coi là «nhóm có tab». Đo từ `modules`:
 * `purchasing` 18 · `warehouse` 14 · `my_work` 10 · `reports` 9 · `mep` 8 ·
 * `project_management` 7 · `finance` 7 · `hr_legal` 6.
 * ⛔ Các nhóm chỉ 1 mục (`overview` · `system_admin` · `approval_center` · `material_master` ·
 * `site_command`) **KHÔNG** vào đây — 1 mục thì ⛔ không có gì để thành tab.
 */
const HUB_TAB_GROUP_KEYS: string[] = [
  // ✅ 7 NHÓM ĐÃ ĐO có ≥2 MỤC CON và KHÔNG trùng nhãn (đo 27/09/2026 bằng `node --import tsx`):
  //   `purchasing` 2 (dùng `purchasingHubTabs` curated 10) · `my_work` 5 · `warehouse` 6
  //   · `mep` 8 · `finance` 7 · `hr_legal` 6 · `project_management` 7
  //   ⚠️ `my_work`/`warehouse` trước đây bị TẮT vì `view="dashboard"` TRÙNG giữa 2 nhóm ⇒ mở 2 màn
  //   cùng lúc. ⛔ ĐÃ SỬA (user duyệt 27/09): `activateModule` nay xoá `view` của nhóm KHÔNG sở hữu
  //   màn đích (`app/page.tsx` khối "CHẶN RÒ TRẠNG THÁI QUA NHÓM") ⇒ an toàn bật lại.
  "purchasing",
  "my_work",
  "warehouse",
  "mep",
  "finance",
  "hr_legal",
  "project_management",
  // ⛔ KHÔNG có: `reports` (chỉ 1 mục) · `overview` (1) · `site_command` (1) · `material_master` (1)
  //    · `system_admin` (1) ⇒ **1 mục thì KHÔNG có gì để thành tab** ⇒ sidebar giữ nguyên như cũ.
  // 📌 NGUỒN TAB KHÔNG CÒN LÀ `modules`: xem `app/page.tsx` — bản đồ `hubChildrenByGroup` dựng từ CÁC
  //   MẢNG CON THẬT (`workMenuItems`·`warehouseMenuItems`·`allocateReturnMenuItems`·
  //   `supplierPartnerMenuItems`·`kpiSummaryMenuItems`·`reportsSummaryMenuItems`) vì chúng **MANG `view`**
  //   (`modules` thì KHÔNG) ⇒ bấm tab mở ĐÚNG màn con.
];

/** Nhãn tiếng Việt cho thanh tab của từng nhóm (`aria-label` — hỗ trợ trình đọc màn hình). */
const HUB_GROUP_LABELS: Record<string, string> = {
  purchasing: "Mua hàng & Cung ứng",
  warehouse: "Kho & Vật tư",
  my_work: "Công việc",
  reports: "Báo cáo & Dashboard",
  mep: "Hệ M&E",
  project_management: "Quản lý dự án",
  finance: "Tài chính",
  hr_legal: "Nhân sự & Pháp lý",
};

/**
 * **TAB của nhóm chứa `active`** — `null` nếu module không thuộc nhóm có tab.
 *
 * <p>⚠️ `purchasing` giữ **danh sách curated** (`purchasingHubTabs` — 18 mục gom thành 10 tab theo
 * **quyết định user**): ⛔ KHÔNG thay bằng ánh xạ 1-1, vì như vậy là **phá quyết định đã chốt**.
 * Các nhóm còn lại: ánh xạ **1 mục con = 1 tab** (đúng yêu cầu «đưa tất cả menu item … thành tab»).
 *
 * @param active module đang mở
 * @returns danh sách tab của nhóm, hoặc `null` nếu không áp dụng
 */
function hubTabsFor(active: string): { key: ModuleKey; label: string }[] | null {
  const mod = modules.find((m) => String(m.key) === String(active));
  const gk = String(mod?.groupKey || "");
  if (!gk || !HUB_TAB_GROUP_KEYS.includes(gk)) return null;
  if (gk === "purchasing") return purchasingHubTabs;
  return modules
    .filter((m) => String(m.groupKey) === gk)
    .map((m) => ({ key: m.key, label: m.label }));
}

/** Nhãn nhóm (`aria-label`) cho thanh tab — rỗng nếu `active` ⛔ không thuộc nhóm có tab. */
function hubLabelFor(active: string): string {
  const mod = modules.find((m) => String(m.key) === String(active));
  const gk = String(mod?.groupKey || "");
  return HUB_GROUP_LABELS[gk] || "";
}

export {
  allocateReturnMenuItems,
  allocateReturnViewFor,
  approvalCenterGroup,
  approvalCenterMenuKey,
  configuredMenuGroups,
  HUB_TAB_GROUP_KEYS,
  hubLabelFor,
  hubTabsFor,
  independentMenuKeys,
  kpiSummaryMenuItems,
  legacyKpiMenuKeys,
  legacyReportsMenuKeys,
  legacySupplierPartnerMenuKeys,
  legacyWarehouseMenuKeys,
  legacyWorkMenuKeys,
  modules,
  purchasingHubTabs,
  reportsSummaryMenuItems,
  supplierPartnerMenuItems,
  supplierPartnerViewFor,
  warehouseMenuItems,
  warehouseMenuViewFor,
  workMenuItems,
};
export type { SupplierPartnerMenuView, WarehouseMenuView, WorkMenuView };