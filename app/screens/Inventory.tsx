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

// PHASE 5 (`W-01` + `W-04`) — MÀN TỒN KHO NAY CÓ 2 TAB: «Tồn kho» (giữ NGUYÊN toàn bộ hành vi cũ) và
// «Dashboard tồn kho» (mục #5 của nhóm menu KHO, 8 chỉ số theo §19 — `app/screens/WarehouseDashboard.tsx`).
// `view` do MỤC MENU quyết định (`lib/menu-helpers.ts` → `warehouseMenuViewFor` → `app/page.tsx`): mục
// «Dashboard tồn kho» truyền `view="dashboard"`, bốn mục còn lại KHÔNG truyền ⇒ rơi về tab «Tồn kho».
// KHÔNG thêm khoá module, KHÔNG route mới, KHÔNG màn mới.

import { DataTable, ListToolbar, StatusBadge } from "@/app/components/ui";
import { WarehouseDashboard } from "@/app/screens/WarehouseDashboard";
import type { WarehouseMenuView } from "@/lib/menu-helpers";
// ⭐ HUB «KHO VẬT TƯ» (ERP-SESSION-02, 06/10/2026) — KHỐI THUẦN dùng chung:
//   · `WAREHOUSE_HUB_TABS`   = 3 tab cấp 1 ĐÚNG yêu cầu user («KHO» · «XUẤT & NHẬP» · «CẤP PHÁT & HOÀN TRẢ»)
//   · `warehouseCards()`     = cards kho có ĐỦ 4 thông tin user yêu cầu (Tên · Mã · Dự án · Tồn hiện tại)
//   · `visibleWarehouseCards()` = phạm vi XEM theo thành viên dự án + NGOẠI LỆ director/admin (user chốt)
//   · `defaultOutInSubtab()` / `defaultAllocateReturnSubtab()` = subtab mặc định theo QUYỀN user
//   ⛔ KHÔNG bịa nghiệp vụ: các hàm này chỉ LỌC/TÍNH trên payload sẵn có.
import {
  WAREHOUSE_HUB_TABS,
  WAREHOUSE_DETAIL_TABS,
  warehouseCards,
  visibleWarehouseCards,
  defaultOutInSubtab,
  defaultAllocateReturnSubtab,
  totalsForWarehouse,
  inventoryRowsOfWarehouse,
} from "@/lib/warehouse-hub";
import { modulePermission } from "@/lib/permissions";
import { CardHead, Empty, Kpi, NavIcon, exportInventoryXlsx, format, printInventoryBarcodes, printInventoryLedger, AttachmentPanel } from "@/lib/ui-shared";
// MT3 §IV.6 — nguồn ánh xạ trạng thái dùng chung (⛔ không lộ mã thô).
import { statusLabel } from "@/lib/status-labels";
// MT3 §IV.7 — xuất CSV UTF-8 có BOM để Excel trên Windows đọc đúng tiếng Việt.
import { downloadCsv } from "@/lib/tabular-export";
import type { AppData, Row } from "@/lib/ui-shared";
import { useState } from "react";
// Dải 2 tab của màn Tồn kho — thứ tự CỐ ĐỊNH, tab «Tồn kho» là mặc định (hành vi cũ không đổi).
// MT3 §F — 4 TAB CẤP CAO của màn Kho, đúng thứ tự yêu cầu.
// (Trước MT3: màn này chỉ có 2 tab «Tồn kho» / «Dashboard tồn kho», các mục Nhập/Xuất/Cấp phát
//  là NÚT thao tác rời, ⛔ không phải tab.)
// ⭐ HUB «KHO VẬT TƯ» — 3 TAB CẤP 1 (yêu cầu user 06/10/2026):
//   [ KHO ] [ XUẤT & NHẬP ] [ CẤP PHÁT & HOÀN TRẢ ]
// ⚠️ THAY BỘ 4 TAB CŨ của MT3 §F («Kho» · «Nhập kho & Xuất kho» · «Tồn kho» · «Cấp phát & hoàn trả»):
//   · «Tồn kho» CŨ (dashboard + bảng tồn) nay nằm TRONG tab «KHO» cùng với cards kho ⇒ user mở menu là
//     thấy NGAY dashboard tồn kho (đúng yêu cầu «click vào menu nó sẽ hiển thị luôn ra màn dashboard tồn kho»).
//   · «Nhập kho & Xuất kho» đổi tên thành «XUẤT & NHẬP» (đúng nguyên văn yêu cầu).
//   · Hằng số lấy từ `lib/warehouse-hub.ts` (⭐ MỘT nguồn) ⇒ ⛔ không khai báo trùng ở 2 nơi.
const WAREHOUSE_TABS: readonly string[] = WAREHOUSE_HUB_TABS;
function Inventory({ data, project, open, action, view = null }: { data: AppData; project: string; open: (name: string, row?: Row) => void; action?: (name: string, payload: Row) => Promise<boolean>; view?: WarehouseMenuView | null }) {
  // MT3 §F — tab cấp cao (0 Kho · 1 Nhập & Xuất · 2 Tồn kho · 3 Cấp phát & hoàn trả) + sub-tab Nhập/Xuất.
  // ⭐ user: «click vào menu nó sẽ hiển thị luôn ra màn dashboard tồn kho» ⇒ MẶC ĐỊNH tab 0 «KHO»
  //    (tab KHO nay chứa CẢ dashboard tồn kho LẪN cards kho).
  const [tab, setTab] = useState(0);
  // ⚠️ `view` GIỮ trong chữ ký để `app/page.tsx` ⛔ không phải sửa (mục menu «Dashboard tồn kho» vẫn truyền
  //    `view="dashboard"`), nhưng ⛔ KHÔNG còn dùng để chọn tab — dashboard nay NẰM TRONG tab «KHO».
  void view;
  // ⭐ user: «hiển thị màn XUẤT trước hoặc NHẬP tùy thuộc vào user perm» ⇒ mặc định THEO QUYỀN (⛔ không hardcode).
  const [ioTab, setIoTab] = useState<"issue" | "receipt">(
    defaultOutInSubtab(
      modulePermission(data, "warehouse_issue").canView,
      modulePermission(data, "warehouse_receipt").canView,
    ) === "XUẤT" ? "issue" : "receipt",
  );
  // ⭐ Tab «CẤP PHÁT & HOÀN TRẢ» — subtab mặc định theo QUYỀN (cùng logic, user: «logic tương tự»).
  const [arTab, setArTab] = useState<"allocate" | "return">(
    defaultAllocateReturnSubtab(
      modulePermission(data, "warehouse_issue").canView,
      modulePermission(data, "stocktake").canView,
    ) === "CẤP PHÁT" ? "allocate" : "return",
  );
  // MT3 §F — click CARD KHO mở modal chi tiết (thủ kho · lịch sử xuất/nhập · cấp phát/hoàn trả · danh mục vật tư).
  const [openWarehouseId, setOpenWarehouseId] = useState<string>("");
  // ⭐ MÀN CHI TIẾT KHO (yêu cầu user 06/10/2026): **nút QUAY LẠI** + **5 TAB**
  //   [Dashboard kho] [Tồn kho] [Xuất - Nhập] [Cấp phát - Hoàn trả] [Nhân sự] — ⛔ KHÔNG còn là modal.
  const [wdTab, setWdTab] = useState(0);
  // MT3 ma trận #4 — «Modal thay side panel» (user cho phép 27/09/2026).
  //   ⚠️ TRƯỚC ĐÂY bảng «TẠO PHIẾU NHẬP / XUẤT / ĐIỀU CHUYỂN» là `<aside>` render THẲNG trong trang
  //   (luôn chiếm chỗ, đẩy lệch bố cục). Nay đưa vào **hộp thoại**, mở bằng nút ở thanh công cụ.
  //   ✅ GIỮ NGUYÊN mọi chức năng bên trong: 3 tab ĐIỀU CHUYỂN/NHẬP KHO/XUẤT KHO + nút TẠO PHIẾU
  //      ĐIỀU CHUYỂN + khối MÃ VẠCH/QR + nút IN TEM MÃ.
  const [transferPanelOpen, setTransferPanelOpen] = useState(false);
  // MT3 §F — toolbar CRUD kho: tìm / sắp xếp / chọn kho đang chọn (cho nút Sửa · Xóa) + xuất Excel.
  const [whQuery, setWhQuery] = useState("");
  const [whSortKey, setWhSortKey] = useState("name_asc");
  const [selectedWhId, setSelectedWhId] = useState<string>("");
  // ⭐⭐ TASK-230 (07/10/2026 · yêu cầu user ⑥) — TOOLBAR SEARCH/SORT/FILTER CHO **5 TAB MÀN CHI TIẾT KHO**
  //   · Tab «Tồn kho» (wdTab 1): tìm / sắp xếp / lọc mức tồn + nút «＋ Tạo phiếu đề nghị».
  //   · Tab «Xuất - Nhập» (wdTab 2) và «Cấp phát - Hoàn trả» (wdTab 3): tìm / sắp xếp / lọc trạng thái + nút tạo phiếu.
  //   · Tab «Nhân sự» (wdTab 4): nút «＋ Thêm nhân sự» ⇒ MODAL thêm nhân sự kho (state ở dưới).
  const [wdInvQuery,setWdInvQuery]=useState(""); const [wdInvSortKey,setWdInvSortKey]=useState("code"); const [wdInvLowOnly,setWdInvLowOnly]=useState(false);
  const [wdIoQuery,setWdIoQuery]=useState(""); const [wdIoSortKey,setWdIoSortKey]=useState("date"); const [wdIoStatus,setWdIoStatus]=useState("ALL");
  const [wdArQuery,setWdArQuery]=useState(""); const [wdArSortKey,setWdArSortKey]=useState("date"); const [wdArStatus,setWdArStatus]=useState("ALL");
  const [staffModalOpen,setStaffModalOpen]=useState(false); const [staffQuery,setStaffQuery]=useState(""); const [staffPickId,setStaffPickId]=useState(""); const [staffRole,setStaffRole]=useState("");
  // ⛔ `showDashboard` ĐÃ XOÁ: dashboard nay nằm trong tab «KHO» (xem khối `tabBar` bên dưới).
  const [query,setQuery]=useState(""); const [lowOnly,setLowOnly]=useState(false);
  // MT2-P9-01 (§7.1) — «Chưa chọn kho ⇒ dashboard TỔNG HỢP. Click kho ⇒ dashboard chuyển sang dữ liệu
  // của kho được chọn.» ⚠️ Lọc ngay tại GỐC `scopedInventory` ⇒ mọi thứ downstream (KPI · bảng · export ·
  // «Giá trị tồn kho theo kho») tự đúng theo kho đang chọn. `""` = TỔNG HỢP (hành vi cũ không đổi).
  const [wh,setWh]=useState("");
  // MT2-P9-03 (§7.3) — «Thêm **Sort · Filter**». ⚠️ Lọc/sắp xếp THẬT trên dữ liệu, ⛔ không hình thức (§25).
  const [sortKey,setSortKey]=useState("code"); const [whFilter,setWhFilter]=useState("ALL");
  // MT2-P9-05 (§7.5) — «Thêm CRUD · Search · Sort · Filter. Hiển thị danh sách phiếu xuất · đơn xuất kho.»
  // ⚠️ BE CHỈ có `issue_stock` (CREATE); ⛔ KHÔNG có update/delete/cancel (đã đo ActionRbacRegistry +
  // SystemController) ⇒ §14/§20: ⛔ KHÔNG bịa nghiệp vụ sửa/xoá ⇒ phần này = READ + Search·Sort·Filter.
  const [issueQuery,setIssueQuery]=useState(""); const [issueSortKey,setIssueSortKey]=useState("issuedAt"); const [issueStatus,setIssueStatus]=useState("ALL");
  const scopeIssues=(data.issues||[]).filter(row=>project==="ALL"||row.projectId===project);
  const issueSearched=scopeIssues.filter(row=>!issueQuery||`${row.issueNo||""} ${row.projectCode||""} ${row.teamName||""} ${row.receivedByName||""}`.toLocaleLowerCase("vi").includes(issueQuery.toLocaleLowerCase("vi")));
  const issueStatusFiltered=issueSearched.filter(row=>issueStatus==="ALL"||String(row.status)===issueStatus);
  const issueRows=[...issueStatusFiltered].sort((a,b)=>{switch(issueSortKey){case "issueNo":return String(a.issueNo||"").localeCompare(String(b.issueNo||""),"vi"); case "project":return String(a.projectCode||"").localeCompare(String(b.projectCode||""),"vi"); case "qty_desc":return (Number(b.totalQty||0)-Number(a.totalQty||0)); default:return String(a.issuedAt||"").localeCompare(String(b.issuedAt||""));}});
  const issueStatusOptions=Array.from(new Set(scopeIssues.map(r=>String(r.status)).filter(Boolean)));
  // ⭐ HUB «KHO VẬT TƯ» — SUBTAB «NHẬP» của tab «XUẤT & NHẬP»: bản cũ ⛔ CHỈ có nút TẠO, **KHÔNG có danh sách**
  //   (user yêu cầu: «mỗi subtab sẽ hiển thị 1 danh sách tương ứng, có các nhóm nút crud search sort fillter»).
  //   ⚠️ Trường ĐO THẬT trên payload (`data.receipts[0]`): `receiptNo` · `poNo` · `projectCode` · `supplierName` ·
  //   `warehouseName` · `receivedAt` · `acceptedQty` · `bchConfirmationStatus` · `itemCount`
  //   (⭐ `warehouseName` CÓ ở đây — khác `data.warehouses[]`; ⛔ KHÔNG có `warehouseId`).
  const [recQuery,setRecQuery]=useState(""); const [recSortKey,setRecSortKey]=useState("receivedAt"); const [recStatus,setRecStatus]=useState("ALL");
  const scopeReceipts=(data.receipts||[]).filter(row=>project==="ALL"||row.projectId===project);
  const recSearched=scopeReceipts.filter(row=>!recQuery||`${row.receiptNo||""} ${row.poNo||""} ${row.projectCode||""} ${row.supplierName||""} ${row.warehouseName||""}`.toLocaleLowerCase("vi").includes(recQuery.toLocaleLowerCase("vi")));
  const recStatusFiltered=recSearched.filter(row=>recStatus==="ALL"||String(row.bchConfirmationStatus||row.status||"")===recStatus);
  const receiptRows=[...recStatusFiltered].sort((a,b)=>{switch(recSortKey){case "receiptNo":return String(a.receiptNo||"").localeCompare(String(b.receiptNo||""),"vi"); case "project":return String(a.projectCode||"").localeCompare(String(b.projectCode||""),"vi"); case "supplier":return String(a.supplierName||"").localeCompare(String(b.supplierName||""),"vi"); case "qty_desc":return (Number(b.acceptedQty||0)-Number(a.acceptedQty||0)); default:return String(a.receivedAt||"").localeCompare(String(b.receivedAt||""));}});
  const recStatusOptions=Array.from(new Set(scopeReceipts.map(r=>String(r.bchConfirmationStatus||r.status||"")).filter(Boolean)));
  // ⭐ HUB «KHO VẬT TƯ» — TAB «CẤP PHÁT & HOÀN TRẢ»: 2 subtab + **2 DANH SÁCH** (user: «logic tương tự» tab XUẤT & NHẬP).
  //   Nguồn ĐO THẬT: cấp phát ← `data.issues[]` (**29 dòng**) · hoàn trả ← `data.returns[]` (**6 dòng**)
  //   (đúng khuôn `app/screens/AllocateReturn.tsx`). ⚠️ CẢ HAI ⛔ KHÔNG có trường «kho xuất/kho nhập»
  //   ⇒ hiện «—» và ⛔ KHÔNG bịa (bài học §14/§20).
  const [arQuery,setArQuery]=useState(""); const [arSortKey,setArSortKey]=useState("date"); const [arStatus,setArStatus]=useState("ALL");
  // ⚠️ `scopeReturns` PHẢI khai báo Ở ĐÂY: biến cùng tên trong `AllocateReturn.tsx` là của tệp đó, ⛔ KHÔNG tự có ở đây
  //    (`tsc` đã bắt đúng lỗi này — TS2304).
  const scopeReturns=(data.returns||[]).filter((row:Row)=>project==="ALL"||row.projectId===project);
  const arSource:Row[]=arTab==="allocate"?scopeIssues:scopeReturns;
  const arSearched=arSource.filter((row:Row)=>!arQuery||`${row.issueNo||""} ${row.returnNo||""} ${row.projectCode||""} ${row.teamName||""} ${row.receivedByName||""} ${row.returnedByName||""}`.toLocaleLowerCase("vi").includes(arQuery.toLocaleLowerCase("vi")));
  const arStatusFiltered=arSearched.filter((row:Row)=>arStatus==="ALL"||String(row.status)===arStatus);
  const arRows=[...arStatusFiltered].sort((a:Row,b:Row)=>{switch(arSortKey){case "no":return String(a.issueNo||a.returnNo||"").localeCompare(String(b.issueNo||b.returnNo||""),"vi"); case "project":return String(a.projectCode||"").localeCompare(String(b.projectCode||""),"vi"); case "qty_desc":return (Number(b.totalQty||b.acceptedQty||0)-Number(a.totalQty||a.acceptedQty||0)); default:return String(a.issuedAt||a.returnedAt||"").localeCompare(String(b.issuedAt||b.returnedAt||""));}});
  const arStatusOptions=Array.from(new Set(arSource.map((r:Row)=>String(r.status||"")).filter(Boolean)));
  const scopedInventory=data.inventory.filter((row)=>(project==="ALL"||row.projectId===project)&&(!wh||String(row.warehouseId)===wh)); const searched=scopedInventory.filter(row=>!query||`${row.materialCode||""} ${row.materialName||""} ${row.warehouseCode||""} ${row.warehouseName||""} ${row.locationCode||""}`.toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi"))); const lowRows=searched.filter(row=>Number(row.available??row.balance)>=0&&Number(row.available??row.balance)<Number(row.minStock||0)); const base=lowOnly?lowRows:searched; const whFiltered=base.filter(row=>whFilter==="ALL"||String(row.warehouseId)===whFilter); const filtered=[...whFiltered].sort((a,b)=>{const av=Number(a.available??a.balance)||0, bv=Number(b.available??b.balance)||0; switch(sortKey){case "name":return String(a.materialName||"").localeCompare(String(b.materialName||""),"vi"); case "avail_desc":return bv-av; case "avail_asc":return av-bv; case "min_desc":return (Number(b.minStock||0)-Number(b.minStock||0))+(Number(b.minStock||0)-Number(a.minStock||0)); case "wh":return String(a.warehouseCode||a.warehouseName||"").localeCompare(String(b.warehouseCode||b.warehouseName||""),"vi"); default:return String(a.materialCode||"").localeCompare(String(b.materialCode||""),"vi");}}); const positive=filtered.filter((row)=>Number(row.available??row.balance)>0); const totalQty=positive.reduce((sum,row)=>sum+Number((row.available??row.balance)||0),0); const below=lowRows.length; const inbound=filtered.filter(row=>Number(row.pendingInbound||0)>0).length; const outbound=data.issues.filter((row)=>project==="ALL"||row.projectId===project).length;
  const selectedProject=project==="ALL"?null:data.projects.find(row=>row.id===project);
  // ⭐ HUB «KHO VẬT TƯ» — PHẠM VI KHO THEO YÊU CẦU USER (06/10/2026):
  //   · kho DỰ ÁN chỉ hiện với user ĐƯỢC THÊM VÀO dự án đó (`data.userScopes` — backend đã lọc theo `user_project_scopes`)
  //   · NGOẠI LỆ (user CHỐT): BAN GIÁM ĐỐC `director` · ADMIN/IT `admin` ⇒ XEM TẤT CẢ kho.
  //     ⚠️ CHỈ là phạm vi XEM — mọi THAO TÁC vẫn gác theo quyền module (⛔ KHÔNG nới quyền ghi ở đây).
  //   · Phạm vi dự án đang chọn trên thanh công cụ VẪN lọc thêm (giữ hành vi cũ).
  //   ⚠️ SỬA LỖI CÓ SẴN: bản cũ đọc `row.warehouseType` — trường ⛔ KHÔNG tồn tại trong payload
  //      (payload THẬT: `id`·`code`·`name`·`type`·`projectId`·`parentWarehouseId` — đo trên `GET /api/system`).
  const warehouseCardRows = warehouseCards(data.warehouses || [], data.inventory || [], data.projects || []);
  // ⭐ Tra cứu card theo id: `visibleWarehouses` lo THỨ TỰ/LỌC (theo `whQuery`/`whSortKey`),
  //   còn `cardById` cấp ĐỦ 4 thông tin user yêu cầu (Tên · Mã · Dự án · Tồn hiện tại).
  const cardById = new Map(warehouseCardRows.map((c) => [c.id, c]));
  // ⭐⭐ TASK-230 (07/10/2026) — DỮ LIỆU THÊM CHO CARD KHO (yêu cầu user ①):
  //   card phải có: TÊN · MÃ · SỐ LƯỢNG TỒN KHO · **SỐ LƯỢNG MÃ ĐANG THIẾU** · **TRẠNG THÁI HOẠT ĐỘNG** · **THỦ KHO**.
  //   ⚠️ NGUỒN ĐÃ ĐO (⛔ KHÔNG BỊA — đọc `BootstrapDataAdapter.java`):
  //     · `inventory[]` = …·`minStock`·`balance`·`available`… ⇒ «mã đang thiếu» = đếm dòng `balance < minStock`.
  //     · `userWarehouseScopes[]` = `userId`·`warehouseId`·`permission`·`warehouseCode`·`warehouseName`·`type`·`projectId`
  //       ⇒ ⭐ ĐÂY mới là nguồn ĐÚNG cho «ai phụ trách kho».
  //       ⛔ SỬA LỖI CÓ SẴN: trước đây lọc `data.staffDirectory` theo `u.warehouseId` — trường đó
  //       **⛔ KHÔNG TỒN TẠI** trong `staffDirectory` (đo SQL: id·employeeCode·fullName·email·role·roleName·
  //       department·organizationUnitId·organizationCode·organizationName·avatarUrl·signatureUrl·systemLevelCode)
  //       ⇒ tab «Nhân sự» của màn chi tiết kho **LUÔN RỖNG**.
  //     · `warehouses[]` ⛔ KHÔNG có trường `active` (SQL chỉ `WHERE active=1`) ⇒ mọi kho trong payload
  //       **đều đang hoạt động** ⇒ hiển thị «Đang hoạt động» là ĐÚNG dữ liệu, ⛔ không bịa.
  const nameById = new Map<string, string>();
  for (const u of data.staffDirectory || []) if (u?.id != null) nameById.set(String(u.id), String(u.fullName || u.employeeCode || ""));
  for (const u of data.users || []) if (u?.id != null && !nameById.has(String(u.id))) nameById.set(String(u.id), String(u.fullName || u.username || ""));
  /** Số mã vật tư ĐANG THIẾU (tồn < mức tối thiểu) của từng kho — nguồn `inventory[].balance/minStock`. */
  const shortageByWarehouse = new Map<string, number>();
  for (const r of data.inventory || []) {
    const wid = String(r.warehouseId || "");
    if (!wid) continue;
    if (Number(r.balance || 0) < Number(r.minStock || 0)) shortageByWarehouse.set(wid, (shortageByWarehouse.get(wid) || 0) + 1);
  }
  /** Người phụ trách / thủ kho của từng kho — nguồn `userWarehouseScopes[]` ∪ tên từ `staffDirectory`/`users`. */
  const keepersByWarehouse = new Map<string, string[]>();
  for (const s of data.userWarehouseScopes || []) {
    const wid = String(s.warehouseId || "");
    if (!wid) continue;
    const ten = nameById.get(String(s.userId)) || "";
    if (!ten) continue;
    const ds = keepersByWarehouse.get(wid) || [];
    if (!ds.includes(ten)) ds.push(ten);
    keepersByWarehouse.set(wid, ds);
  }
  const warehouseVisibility = visibleWarehouseCards(warehouseCardRows, data.user, data.userScopes || []);
  const allowedWarehouseIds = new Set(warehouseVisibility.visible.map((c) => c.id));
  const allowedWarehouses = (data.warehouses || []).filter((row) =>
    allowedWarehouseIds.has(String(row.id)) &&
    (project === "ALL" || String(row.projectId || "") === project || String(row.type || "") === "central"));
  // MT3 §F — toolbar CRUD kho: tìm theo tên/mã + sắp xếp; ⛔ chỉ lọc HIỂN THỊ, ⛔ không đổi phạm vi quyền.
  const visibleWarehouses=[...allowedWarehouses]
    .filter((w:Row)=>!whQuery||`${w.name||""} ${w.code||""}`.toLocaleLowerCase("vi").includes(whQuery.toLocaleLowerCase("vi")))
    .sort((a:Row,b:Row)=>{const an=String(a.name||a.code||""),bn=String(b.name||b.code||"");
      if(whSortKey==="name_desc")return bn.localeCompare(an,"vi");
      if(whSortKey==="items_desc")return scopedInventory.filter((r:Row)=>String(r.warehouseId)===String(b.id)).length-scopedInventory.filter((r:Row)=>String(r.warehouseId)===String(a.id)).length;
      return an.localeCompare(bn,"vi");});
  // MT3 §IV.7 — xuất CSV UTF-8 có BOM (Excel Windows đọc đúng tiếng Việt).
  function exportWarehousesCsv(source:Row[]){downloadCsv(["Mã kho","Tên kho","Loại","Số vật tư","Số phiếu xuất"],
    source.map((w:Row)=>[String(w.code||""),String(w.name||""),String(w.type==="central"?"Kho Tổng":w.type==="site"?"Kho dự án":w.type==="transit"?"Kho trung chuyển":"—"),
      scopedInventory.filter((r:Row)=>String(r.warehouseId)===String(w.id)).length,(data.issues||[]).filter((r:Row)=>String(r.warehouseId)===String(w.id)).length]),
    `Danh_sach_kho_${new Date().toISOString().slice(0,10)}`);}
  // ⭐ HUB «KHO VẬT TƯ» — ⛔ BỎ nhánh `showDashboard` tách riêng của bản cũ.
  //   LÝ DO: bản cũ dùng `tab === 2` cho «Dashboard tồn kho»; nay bộ tab chỉ còn **3 tab**
  //   (0 KHO · 1 XUẤT & NHẬP · 2 CẤP PHÁT & HOÀN TRẢ) ⇒ nếu giữ `tab === 2` thì **tab CẤP PHÁT sẽ hiện nhầm
  //   dashboard** (LỖI LOGIC, `tsc` ⛔ không bắt được). Dashboard nay được đặt **NGAY ĐẦU TAB «KHO»** — đúng
  //   yêu cầu user «click vào menu nó sẽ hiển thị luôn ra màn dashboard tồn kho».
  // ⭐ TASK-230 (07/10/2026 · yêu cầu user ②): ĐÃ XOÁ dòng note
  //   «Ba tab của cùng một màn: «KHO» (dashboard tồn kho + danh sách kho) · «XUẤT & NHẬP» · «CẤP PHÁT & HOÀN TRẢ».»
  //   ⇒ ListToolbar nay CHỈ còn tiêu đề «KHO VẬT TƯ» (⛔ không còn dòng mô tả 3 tab).
  const tabBar = <section className="card inventory-tabs-card"><ListToolbar title="KHO VẬT TƯ"
    />
    <div className="project-scope-tabs" role="tablist" aria-label="Kho vật tư">
      {WAREHOUSE_TABS.map((label,index)=><button type="button" key={label} role="tab" aria-selected={tab===index} className={tab===index?"active":""} data-warehouse-tab={index===0?"inventory":"dashboard"} onClick={()=>setTab(index)}>{label}</button>)}
    </div>
  </section>;
  // ⭐⭐ MÀN CHI TIẾT KHO — THAY MODAL CŨ. Yêu cầu user (06/10/2026): «click vào sẽ hiển thị ra màn thông tin chi tiết
  //   của kho (có nút quay lại màn KHO). Trong màn thông tin chi tiết của kho sẽ có các tab: dashboard của kho đó,
  //   tồn kho, xuất - nhập, cấp phát - hoàn trả, nhân sự (hiển thị ra các user liên quan đến kho này)».
  //
  // ⚠️ NGUỒN + GIỚI HẠN (ĐÃ ĐO, ⛔ KHÔNG BỊA): `data.issues[]` / `data.returns[]` / `data.receipts[]`
  //    ⛔ **KHÔNG có trường kho** (`warehouseId`) — đo thật: issues chỉ có issueNo·projectCode·teamName·…;
  //    ⇒ ⛔ KHÔNG thể lọc chính xác «phiếu thuộc kho này». Nay lọc theo **DỰ ÁN CỦA KHO** và **GHI RÕ NGUỒN**
  //    trên UI để user ⛔ không hiểu nhầm là «phiếu của riêng kho».
  if (openWarehouseId) {
    const w:Row = allowedWarehouses.find((x:Row)=>String(x.id)===String(openWarehouseId)) || {};
    const whRows = inventoryRowsOfWarehouse(data.inventory || [], openWarehouseId);
    const whTotals = totalsForWarehouse(data.inventory || [], openWarehouseId);
    const wProjectId = String(w.projectId || "");
    const projName = wProjectId ? String((data.projects||[]).find((p:Row)=>String(p.id)===wProjectId)?.name || wProjectId) : "";
    const projIssues = (data.issues || []).filter((r:Row)=>wProjectId && String(r.projectId || "")===wProjectId);
    const projReturns = (data.returns || []).filter((r:Row)=>wProjectId && String(r.projectId || "")===wProjectId);
    const projReceipts = (data.receipts || []).filter((r:Row)=>wProjectId && String(r.projectId || "")===wProjectId);
    // ⭐⭐ TASK-230 (07/10/2026) — SỬA **LỖI NGUỒN DỮ LIỆU**: bản cũ lọc `data.staffDirectory`
    //   theo `u.warehouseId` — ⛔ **TRƯỜNG NÀY KHÔNG TỒN TẠI** trong `staffDirectory`
    //   (đo SQL `BootstrapDataAdapter.java:921`: id·employeeCode·fullName·email·role·roleName·department·
    //    organizationUnitId·organizationCode·organizationName·avatarUrl·signatureUrl·systemLevelCode)
    //   ⇒ tab «Nhân sự» của màn chi tiết kho **LUÔN RỖNG** (bug thật, user báo ở yêu cầu ⑥).
    //   NGUỒN ĐÚNG: `userWarehouseScopes[]` = `userId`·`warehouseId`·`permission`·… (có `warehouseId` THẬT)
    //   ⇒ nối sang tên/chức danh qua `staffDirectory` → `users` (theo `id`).
    const staffById = new Map<string, Row>();
    for (const u of data.staffDirectory || []) if (u?.id != null) staffById.set(String(u.id), u);
    for (const u of data.users || []) if (u?.id != null && !staffById.has(String(u.id))) staffById.set(String(u.id), u);
    const keeperRows:Row[] = (data.userWarehouseScopes || [])
      .filter((s:Row)=>String(s.warehouseId || "")===String(openWarehouseId))
      .map((s:Row)=>({ ...(staffById.get(String(s.userId)) || { id:s.userId, fullName:String(s.userId) }),
        warehouseRole:String(s.permission || ""), warehouseId:String(s.warehouseId || ""), warehouseName:String(s.warehouseName || "") }));
    // ⭐ TASK-230 ⑥ — nhân sự ỨNG VIÊN để thêm vào kho (⛔ chưa gán kho này) + đã gán (tránh trùng).
    const daGanIds = new Set(keeperRows.map((r:Row)=>String(r.id)));
    const staffUngVien = (data.staffDirectory || [])
      .filter((u:Row)=>u?.id != null && !daGanIds.has(String(u.id)))
      .filter((u:Row)=>!staffQuery || `${u.fullName||""} ${u.employeeCode||""} ${u.department||""}`
        .toLocaleLowerCase("vi").includes(staffQuery.toLocaleLowerCase("vi")))
      .slice(0, 60);
    const nguoiChon:Row = staffPickId ? (staffById.get(staffPickId) || {}) : {};
    // ⭐ TASK-230 ⑥ — «Admin hoặc user có perm»: backend `saveUserAccess` = `requireRole(…, List.of("admin"))`
    //   (đo `UserManagementUseCase.java:259`) ⇒ ⭐ điều kiện ĐÚNG là **role admin** (⛔ không phải đoán perm khác).
    const isAdmin = String((data.user as Row | undefined)?.role || "") === "admin";
    /** Nhãn tiếng Việt cho `user_warehouse_scopes.permission` — tập giá trị ĐO từ `AccessScopeService:31`. */
    const warehouseRoleLabel = (p: string) =>
      p === "admin" ? "Quản trị kho" : p === "approve" ? "Được duyệt" : p === "write" ? "Thủ kho (ghi)" : p === "read" ? "Chỉ xem" : (p || "—");

    // ⭐ TASK-230 ⑥ — LỌC/SẮP XẾP cho 3 tab danh sách của màn chi tiết kho.
    const whRowsLoc = whRows
      .filter((r:Row)=>!wdInvQuery || `${r.materialCode||""} ${r.materialName||""}`.toLocaleLowerCase("vi").includes(wdInvQuery.toLocaleLowerCase("vi")))
      .filter((r:Row)=>!wdInvLowOnly || Number(r.balance||0) < Number(r.minStock||0))
      .sort((a:Row,b:Row)=>{
        if (wdInvSortKey==="avail_desc") return Number((b.available??b.balance)||0)-Number((a.available??a.balance)||0);
        if (wdInvSortKey==="avail_asc")  return Number((a.available??a.balance)||0)-Number((b.available??b.balance)||0);
        if (wdInvSortKey==="name")       return String(a.materialName||"").localeCompare(String(b.materialName||""),"vi");
        return String(a.materialCode||"").localeCompare(String(b.materialCode||""),"vi");});
    const sortPhieu = (rows:Row[], key:string, nhan:(r:Row)=>string)=>{
      const ds=[...rows];
      if (key==="qty_desc") ds.sort((a,b)=>Number(b.totalQty||b.acceptedQty||0)-Number(a.totalQty||a.acceptedQty||0));
      else if (key==="no") ds.sort((a,b)=>String(nhan(a)).localeCompare(String(nhan(b)),"vi"));
      else ds.sort((a,b)=>String(nhan(b)).localeCompare(String(nhan(a))));
      return ds;};
    const locTrangThai = (rows:Row[])=>wdIoStatus==="ALL"?rows:rows.filter((r:Row)=>String(r.status||"")===wdIoStatus);
    const projIssuesLoc = sortPhieu(locTrangThai(projIssues).filter((r:Row)=>!wdIoQuery || `${r.issueNo||""} ${r.teamName||""} ${r.receivedByName||""}`.toLocaleLowerCase("vi").includes(wdIoQuery.toLocaleLowerCase("vi"))), wdIoSortKey, (r)=>String(r.issuedAt||""));
    const projReceiptsLoc = sortPhieu(locTrangThai(projReceipts).filter((r:Row)=>!wdIoQuery || `${r.receiptNo||""} ${r.poNo||""} ${r.supplierName||""}`.toLocaleLowerCase("vi").includes(wdIoQuery.toLocaleLowerCase("vi"))), wdIoSortKey, (r)=>String(r.receivedAt||""));
    const projIssuesArLoc = sortPhieu(locTrangThai(projIssues).filter((r:Row)=>!wdArQuery || `${r.issueNo||""} ${r.teamName||""} ${r.receivedByName||""}`.toLocaleLowerCase("vi").includes(wdArQuery.toLocaleLowerCase("vi"))), wdArSortKey, (r)=>String(r.issuedAt||""));
    const projReturnsLoc = sortPhieu(locTrangThai(projReturns).filter((r:Row)=>!wdArQuery || `${r.returnNo||""} ${r.returnedByName||""}`.toLocaleLowerCase("vi").includes(wdArQuery.toLocaleLowerCase("vi"))), wdArSortKey, (r)=>String(r.returnedAt||""));

    return <div className="stack baseline-screen" data-vntech="warehouse-detail-screen">
      <section className="card inventory-tabs-card">
        <ListToolbar
          title={`CHI TIẾT KHO · ${String(w.name || w.code || "")}`}
          note="Màn chi tiết kho — 5 tab (Dashboard kho · Tồn kho · Xuất - Nhập · Cấp phát - Hoàn trả · Nhân sự)."
          count={whRows.length} total={whRows.length} unit="mặt hàng"
          actions={<button type="button" className="secondary" data-vntech="warehouse-detail-back" onClick={()=>{setOpenWarehouseId("");setWdTab(0);}}>← Quay lại màn KHO</button>}
        />
        <div className="project-scope-tabs" role="tablist" aria-label="Chi tiết kho">
          {WAREHOUSE_DETAIL_TABS.map((label, index) => <button type="button" key={label} role="tab" aria-selected={wdTab===index} className={wdTab===index?"active":""} data-vntech={`wd-tab-${index}`} onClick={()=>setWdTab(index)}>{label}</button>)}
        </div>
      </section>

      {wdTab===0&&<section className="card" data-vntech="wd-dashboard">
        <CardHead title="DASHBOARD KHO" note="Chỉ số của RIÊNG kho này (tính từ `data.inventory` theo `warehouseId`)."/>
        <div className="kpi-grid small">
          <Kpi icon="TK" label="Tồn hiện tại" value={format.format(whTotals.balance)} note="Σ tồn thực tế của kho" tone="blue"/>
          <Kpi icon="VT" label="Mặt hàng" value={String(whTotals.materialCount)} note="Số dòng vật tư trong kho" tone="green"/>
          <Kpi icon="GC" label="Đã giữ chỗ" value={format.format(whTotals.reserved)} note="đã reserved" tone="amber"/>
          <Kpi icon="CB" label="Sắp hết" value={String(whTotals.belowMinCount)} note="dưới định mức tối thiểu" tone="red"/>
        </div>
        <dl className="kv">
          <div><dt>Mã kho</dt><dd>{String(w.code || "—")}</dd></div>
          <div><dt>Loại kho</dt><dd>{String(w.type)==="central"?"Kho Tổng":String(w.type)==="site"?"Kho dự án":String(w.type)==="transit"?"Kho trung chuyển":String(w.type||"—")}</dd></div>
          <div><dt>Dự án</dt><dd>{wProjectId?projName:<span className="muted">Kho Tổng (không thuộc dự án)</span>}</dd></div>
          <div><dt>Thủ kho</dt><dd>{keeperRows.length?String(keeperRows[0].fullName||keeperRows[0].username||"—"):<span className="muted">Chưa phân công</span>}</dd></div>
        </dl>
      </section>}

      {wdTab===1&&<section className="card" data-vntech="wd-inventory">
        {/* ⭐ TASK-230 ⑥ — yêu cầu user: «tab Tồn kho của kho cần thêm search sort filter, thêm nút tạo phiếu
            đề nghị ở trong danh sách tồn kho». Nút dùng modal `request` CÓ THẬT trong app/page.tsx (đủ 40 modal). */}
        <ListToolbar title="TỒN KHO CỦA KHO NÀY"
          note="Nguồn: `data.inventory` lọc theo `warehouseId` (⭐ liên kết CHÍNH XÁC)."
          count={whRowsLoc.length} total={whRows.length} unit="mặt hàng"
          search={{ value: wdInvQuery, onChange: setWdInvQuery, placeholder: "Tìm theo mã hoặc tên vật tư..." }}
          sort={{ value: wdInvSortKey, onChange: setWdInvSortKey, options: [
            { value: "code", label: "Mã vật tư" }, { value: "name", label: "Tên vật tư" },
            { value: "avail_desc", label: "Tồn khả dụng — cao nhất" }, { value: "avail_asc", label: "Tồn khả dụng — thấp nhất" }] }}
          filters={[{ key: "low", label: "Mức tồn", value: wdInvLowOnly ? "low" : "ALL",
            onChange: (v: string) => setWdInvLowOnly(v === "low"),
            options: [{ value: "ALL", label: "Tất cả mức tồn" }, { value: "low", label: `Chỉ dưới mức tối thiểu (${whTotals.belowMinCount})` }] }]}
          actions={<>
            <button type="button" className="secondary" disabled={!whRowsLoc.length} onClick={()=>exportInventoryXlsx(whRowsLoc)}>⇩ Xuất Excel</button>
            <button type="button" className="primary" data-vntech="wd-inv-create-request" onClick={()=>open("request")}>＋ Tạo phiếu đề nghị</button>
          </>}
        />
        <DataTable rows={whRowsLoc} rowKey={(row,index)=>String(`${row.materialId}-${index}`)} columns={[
          { key: "c1", header: "#", render: (row,index) => <>{index+1}</> },
          { key: "c2", header: "Mã vật tư", render: (row) => <><strong className="link">{row.materialCode}</strong></> },
          { key: "c3", header: "Tên vật tư", render: (row) => <>{row.materialName}</> },
          { key: "c4", header: "ĐVT", render: (row) => <>{row.unit}</> },
          { key: "c5", header: "Tồn", render: (row) => <>{format.format(row.balance||0)}</> },
          { key: "c6", header: "Đã giữ", render: (row) => <>{format.format(row.reserved||0)}</> },
          { key: "c7", header: "Khả dụng", render: (row) => <><strong>{format.format((row.available??row.balance)||0)}</strong></> },
          { key: "c8", header: "Tối thiểu", render: (row) => <>{format.format(row.minStock||0)}</> },
          { key: "c9", header: "Trạng thái", render: (row) => <><StatusBadge value={Number(row.balance||0)<Number(row.minStock||0)?"Sắp hết":"Bình thường"}/></> },
        ]} emptyText={wdInvQuery||wdInvLowOnly?"Không có vật tư nào khớp bộ lọc.":"Kho chưa có vật tư nào."} />
      </section>}

      {wdTab===2&&<section className="card" data-vntech="wd-io">
        {/* ⭐ TASK-230 ⑥ — yêu cầu user: «các tab Xuất - Nhập và Cấp phát - hoàn trả cần có thêm nút tạo phiếu
            cùng nhóm nút chức năng search sort filter». Nút dùng modal `issue` / `receipt` CÓ THẬT (40 modal). */}
        <ListToolbar title="XUẤT - NHẬP CỦA KHO"
          note={wProjectId?`⚠️ Phiếu xuất/nhập ⛔ KHÔNG có trường kho ⇒ lọc theo DỰ ÁN của kho (${projName}) — ⛔ KHÔNG phải «phiếu của riêng kho».`:"Kho Tổng ⛔ không thuộc dự án ⇒ ⛔ không lọc được phiếu theo kho (dữ liệu ⛔ không có trường kho)."}
          count={projIssuesLoc.length + projReceiptsLoc.length} total={projIssues.length + projReceipts.length} unit="phiếu"
          search={{ value: wdIoQuery, onChange: setWdIoQuery, placeholder: "Tìm số phiếu · PO · tổ đội · NCC..." }}
          sort={{ value: wdIoSortKey, onChange: setWdIoSortKey, options: [
            { value: "date", label: "Ngày" }, { value: "no", label: "Số phiếu" }, { value: "qty_desc", label: "Số lượng — cao nhất" }] }}
          filters={[{ key: "status", label: "Trạng thái", value: wdIoStatus, onChange: setWdIoStatus,
            options: [{ value: "ALL", label: "Tất cả trạng thái" }, ...Array.from(new Set((projIssues||[]).map((r:Row)=>String(r.status||"")).filter(Boolean))).map((s)=>({ value: s, label: statusLabel(s) }))] }]}
          actions={<>
            <button type="button" className="secondary" data-vntech="wd-io-create-receipt" onClick={()=>open("receipt")}>⭳ Tạo phiếu nhập</button>
            <button type="button" className="primary" data-vntech="wd-io-create-issue" onClick={()=>open("issue")}>⭱ Tạo phiếu xuất</button>
          </>}
        />
        <h3 className="section-subhead">PHIẾU XUẤT ({projIssuesLoc.length})</h3>
        <DataTable rows={projIssuesLoc} rowKey={(row,index)=>String(`${row.id}-o-${index}`)} columns={[
          { key: "c1", header: "Số phiếu", render: (row) => <><strong className="link">{row.issueNo}</strong></> },
          { key: "c2", header: "Tổ đội", render: (row) => <>{row.teamName}</> },
          { key: "c3", header: "Ngày", render: (row) => <>{row.issuedAt?String(row.issuedAt).slice(0,10):"—"}</> },
          { key: "c4", header: "SL xuất", render: (row) => <>{format.format(row.totalQty||0)}</> },
          { key: "c5", header: "Trạng thái", render: (row) => <><StatusBadge value={statusLabel(row.status)}/></> },
        ]} emptyText="Chưa có phiếu xuất trong dự án của kho." />
        <h3 className="section-subhead">PHIẾU NHẬP ({projReceiptsLoc.length})</h3>
        <DataTable rows={projReceiptsLoc} rowKey={(row,index)=>String(`${row.id}-i-${index}`)} columns={[
          { key: "c1", header: "Số phiếu", render: (row) => <><strong className="link">{row.receiptNo}</strong></> },
          { key: "c2", header: "PO", render: (row) => <>{row.poNo||"—"}</> },
          { key: "c3", header: "NCC", render: (row) => <>{row.supplierName||"—"}</> },
          { key: "c4", header: "Ngày", render: (row) => <>{row.receivedAt?String(row.receivedAt).slice(0,10):"—"}</> },
          { key: "c5", header: "SL nhận", render: (row) => <>{format.format(row.acceptedQty||0)}</> },
        ]} emptyText="Chưa có phiếu nhập trong dự án của kho." />
      </section>}

      {wdTab===3&&<section className="card" data-vntech="wd-allocate-return">
        {/* ⭐ TASK-230 ⑥ — search/sort/filter + nút tạo phiếu (yêu cầu user).
            ⚠️ «Tạo phiếu cấp phát» GIỮ TẠM KHOÁ: `open("allocate")` ⛔ không có modal (BUG-20261007-013). */}
        <ListToolbar title="CẤP PHÁT - HOÀN TRẢ CỦA KHO"
          note={wProjectId?`⚠️ Lọc theo DỰ ÁN của kho (${projName}) — dữ liệu ⛔ không có trường kho.`:"Kho Tổng ⛔ không thuộc dự án ⇒ ⛔ không lọc được."}
          count={projIssuesArLoc.length + projReturnsLoc.length} total={projIssues.length + projReturns.length} unit="phiếu"
          search={{ value: wdArQuery, onChange: setWdArQuery, placeholder: "Tìm mã đơn · tổ đội · người nhận/trả..." }}
          sort={{ value: wdArSortKey, onChange: setWdArSortKey, options: [
            { value: "date", label: "Ngày" }, { value: "no", label: "Mã đơn" }, { value: "qty_desc", label: "Số lượng — cao nhất" }] }}
          filters={[{ key: "status", label: "Trạng thái", value: wdArStatus, onChange: setWdArStatus,
            options: [{ value: "ALL", label: "Tất cả trạng thái" }, ...Array.from(new Set([...(projIssues||[]), ...(projReturns||[])].map((r:Row)=>String(r.status||"")).filter(Boolean))).map((s)=>({ value: s, label: statusLabel(s) }))] }]}
          actions={<>
            <button type="button" className="secondary" disabled title="TẠM KHOÁ (BUG-20261007-013): app/page.tsx chưa có modal «allocate» ⇒ bấm ⛔ không mở gì. Chờ backend bổ sung.">＋ Tạo phiếu cấp phát</button>
            <button type="button" className="primary" data-vntech="wd-ar-create-return" onClick={()=>open("return")}>＋ Tạo phiếu hoàn trả</button>
          </>}
        />
        <h3 className="section-subhead">CẤP PHÁT ({projIssuesArLoc.length})</h3>
        <DataTable rows={projIssuesArLoc} rowKey={(row,index)=>String(`${row.id}-a-${index}`)} columns={[
          { key: "c1", header: "Mã đơn", render: (row) => <><strong className="link">{row.issueNo}</strong></> },
          { key: "c2", header: "Tổ đội / người nhận", render: (row) => <>{row.teamName} · {row.receivedByName||"—"}</> },
          { key: "c3", header: "Ngày", render: (row) => <>{row.issuedAt?String(row.issuedAt).slice(0,10):"—"}</> },
          { key: "c4", header: "SL", render: (row) => <>{format.format(row.totalQty||0)}</> },
          { key: "c5", header: "Trạng thái", render: (row) => <><StatusBadge value={statusLabel(row.status)}/></> },
        ]} emptyText="Chưa có phiếu cấp phát trong dự án của kho." />
        <h3 className="section-subhead">HOÀN TRẢ ({projReturnsLoc.length})</h3>
        <DataTable rows={projReturnsLoc} rowKey={(row,index)=>String(`${row.id}-r-${index}`)} columns={[
          { key: "c1", header: "Mã đơn", render: (row) => <><strong className="link">{row.returnNo}</strong></> },
          { key: "c2", header: "Người trả", render: (row) => <>{row.returnedByName||"—"}</> },
          { key: "c3", header: "Ngày", render: (row) => <>{row.returnedAt?String(row.returnedAt).slice(0,10):"—"}</> },
          { key: "c4", header: "SL nhận", render: (row) => <>{format.format(row.acceptedQty||0)}</> },
          { key: "c5", header: "Trạng thái", render: (row) => <><StatusBadge value={statusLabel(row.status)}/></> },
        ]} emptyText="Chưa có phiếu hoàn trả trong dự án của kho." />
      </section>}

      {wdTab===4&&<section className="card" data-vntech="wd-staff">
        {/* ⭐⭐ TASK-230 ⑥ — yêu cầu user: «tab Nhân sự cần có thêm nút thêm nhân sự, khi click thêm sẽ hiển thị ra
            modal thêm nhân sự kho (cho phép tìm theo tên nhân sự, khi chọn nhân sự sẽ hiển thị ra chức danh,
            phòng ban và các thông tin liên quan. Sau đó có thể chọn được chức danh hoặc nhiệm vụ của nhân sự đó
            đối với kho) Admin hoặc user có perm có thể sử dụng được chức năng này.»
            ⚠️ NGUỒN GHI (đã ĐỌC MÃ, ⛔ không bịa): action THẬT duy nhất ghi `user_warehouse_scopes` là
            **`save_user_access`** (`UserManagementUseCase:258`) và backend **`requireRole(…, List.of("admin"))`**
            ⇒ ⭐ **ADMIN-ONLY** ⇒ UI ẩn nút với người ⛔ không phải admin (⛔ không tạo nút chết như BUG-013/014).
            ⚠️ `saveUserAccess` là **FULL-REPLACE** (`clearUserScopes()` xoá cứng 3 bảng rồi ghi lại)
            ⇒ ⛔ BẮT BUỘC gửi **đủ** `projectScopes` + `warehouseScopes` + `modulePermissions` hiện có,
            nếu gửi thiếu sẽ **XOÁ mất phạm vi khác** của tài khoản. */}
        <ListToolbar title="NHÂN SỰ CỦA KHO"
          note="Nguồn: `data.userWarehouseScopes` (⭐ có `warehouseId` THẬT) nối tên/chức danh/phòng ban qua `staffDirectory`. ⚠️ Bản cũ lọc `staffDirectory.warehouseId` — trường ⛔ KHÔNG tồn tại ⇒ tab LUÔN RỖNG (đã sửa)."
          count={keeperRows.length} total={keeperRows.length} unit="nhân sự"
          search={{ value: staffQuery, onChange: setStaffQuery, placeholder: "Tìm theo tên · mã NV · phòng ban..." }}
          actions={isAdmin?<button type="button" className="primary" data-vntech="wd-staff-add" onClick={()=>{setStaffModalOpen(true);setStaffPickId("");setStaffRole("write");}}>＋ Thêm nhân sự</button>:undefined}
        />
        <DataTable rows={keeperRows.filter((r:Row)=>!staffQuery || `${r.fullName||""} ${r.employeeCode||""} ${r.department||""} ${r.organizationName||""}`.toLocaleLowerCase("vi").includes(staffQuery.toLocaleLowerCase("vi")))}
          rowKey={(row,index)=>String(`${row.id}-${index}`)} columns={[
          { key: "c1", header: "#", render: (row,index) => <>{index+1}</> },
          { key: "c2", header: "Họ tên", render: (row) => <><strong>{row.fullName||row.username||"—"}</strong></> },
          { key: "c3", header: "Mã NV", render: (row) => <>{row.employeeCode||"—"}</> },
          { key: "c4", header: "Chức danh", render: (row) => <>{row.roleName||row.role||"—"}</> },
          { key: "c5", header: "Phòng ban", render: (row) => <>{row.organizationName||row.department||"—"}</> },
          { key: "c6", header: "Nhiệm vụ với kho", render: (row) => <><StatusBadge value={warehouseRoleLabel(String(row.warehouseRole||""))}/></> },
        ]} emptyText={isAdmin?"Chưa có nhân sự nào được gán vào kho này. Bấm «＋ Thêm nhân sự» để gán.":"Chưa có nhân sự nào được gán vào kho này."} />

        {staffModalOpen&&<div className="overlay" onMouseDown={(event)=>{if(event.target===event.currentTarget)setStaffModalOpen(false);}}>
          <div className="modal" role="dialog" aria-modal="true" aria-label="Thêm nhân sự vào kho">
            <h2>THÊM NHÂN SỰ VÀO KHO · {String(w.name || w.code || "")}</h2>
            <p className="scope-lock-note">Tìm theo tên / mã nhân viên ⇒ chọn nhân sự ⇒ chọn <strong>chức danh (nhiệm vụ) của nhân sự đó đối với kho</strong>. 🔒 Chỉ <strong>admin</strong> dùng được (backend yêu cầu role admin).</p>
            <label className="list-toolbar-field">Tìm nhân sự
              <input type="text" data-vntech="wd-staff-search" value={staffQuery} onChange={(e)=>setStaffQuery(e.target.value)} placeholder="Nhập tên · mã NV · phòng ban..."/>
            </label>
            <div className="table-wrap" style={{maxHeight:260,overflow:"auto"}}><table><thead><tr><th>Chọn</th><th>Họ tên</th><th>Mã NV</th><th>Chức danh</th><th>Phòng ban</th></tr></thead><tbody>
              {staffUngVien.map((u:Row)=><tr key={String(u.id)} data-vntech="wd-staff-candidate" onClick={()=>setStaffPickId(String(u.id))}
                  style={staffPickId===String(u.id)?{background:"rgba(11,102,246,.10)"}:undefined}>
                  <td><input type="radio" name="staffPick" checked={staffPickId===String(u.id)} onChange={()=>setStaffPickId(String(u.id))}/></td>
                  <td><strong>{u.fullName||"—"}</strong></td><td>{u.employeeCode||"—"}</td>
                  <td>{u.roleName||u.role||"—"}</td><td>{u.organizationName||u.department||"—"}</td></tr>)}
              {!staffUngVien.length&&<tr><td colSpan={5}><Empty text={staffQuery?"Không có nhân sự nào khớp từ khoá.":"⛔ Không còn nhân sự nào để thêm (tất cả đã được gán vào kho này)."}/></td></tr>}
            </tbody></table></div>
            {staffPickId&&<div className="card" data-vntech="wd-staff-picked" style={{marginTop:12}}>
              <CardHead title="NHÂN SỰ ĐÃ CHỌN" note="Thông tin lấy từ `staffDirectory` theo `id` — ⛔ không bịa trường."/>
              <dl className="kv">
                <div><dt>Họ tên</dt><dd><strong>{String(nguoiChon.fullName||"—")}</strong></dd></div>
                <div><dt>Mã nhân viên</dt><dd>{String(nguoiChon.employeeCode||"—")}</dd></div>
                <div><dt>Chức danh</dt><dd>{String(nguoiChon.roleName||nguoiChon.role||"—")}</dd></div>
                <div><dt>Phòng ban</dt><dd>{String(nguoiChon.organizationName||nguoiChon.department||"—")}</dd></div>
                <div><dt>Email</dt><dd>{String(nguoiChon.email||"—")}</dd></div>
              </dl>
              <label className="list-toolbar-field" style={{marginTop:10,display:"block"}}>Nhiệm vụ của nhân sự này đối với kho
                <select data-vntech="wd-staff-role" value={staffRole} onChange={(e)=>setStaffRole(e.target.value)}>
                  <option value="read">Chỉ xem (read)</option>
                  <option value="write">Được ghi (write) — thủ kho</option>
                  <option value="approve">Được duyệt (approve)</option>
                  <option value="admin">Quản trị kho (admin)</option>
                </select>
              </label>
              <p className="scope-lock-note">⚠️ Giá trị nhiệm vụ dùng ĐÚNG tập của CSDL `user_warehouse_scopes.permission` (đo `AccessScopeService:31`: mức `write` ⇒ thuộc nhóm write · approve · admin).</p>
            </div>}
            <footer className="modal-actions">
              <button type="button" className="secondary" data-vntech="wd-staff-cancel" onClick={()=>setStaffModalOpen(false)}>Huỷ</button>
              <button type="button" className="primary" data-vntech="wd-staff-save" disabled={!staffPickId||!action}
                onClick={async ()=>{
                  if(!action||!staffPickId) return;
                  const uid=staffPickId;
                  // ⚠️ FULL-REPLACE: gửi ĐỦ 3 nhóm, ⛔ nếu thiếu sẽ xoá mất phạm vi khác của tài khoản.
                  const projectScopes=(data.userScopes||[]).filter((s:Row)=>String(s.userId)===uid)
                    .map((s:Row)=>({projectId:String(s.projectId||""),permission:String(s.permission||"none")})).filter((s)=>s.projectId);
                  const whCu=(data.userWarehouseScopes||[]).filter((s:Row)=>String(s.userId)===uid)
                    .map((s:Row)=>({warehouseId:String(s.warehouseId||""),permission:String(s.permission||"read")})).filter((s)=>s.warehouseId&&s.warehouseId!==String(openWarehouseId));
                  const modulePermissions=(data.allModulePermissions||[]).filter((m:Row)=>String(m.userId)===uid)
                    .map((m:Row)=>({moduleKey:String(m.moduleKey||""),canView:Boolean(m.canView),canUse:Boolean(m.canUse),canCreate:Boolean(m.canCreate),canEdit:Boolean(m.canEdit),canApprove:Boolean(m.canApprove),canExport:Boolean(m.canExport)}));
                  const ok=await action("save_user_access",{userId:uid,projectScopes,
                    warehouseScopes:[...whCu,{warehouseId:String(openWarehouseId),permission:staffRole}],modulePermissions});
                  if(ok){setStaffModalOpen(false);}}
                }>Lưu phân công</button>
            </footer>
          </div>
        </div>}
      </section>}
    </div>;
  }

  return <div className="stack baseline-screen approved-inventory-screen">
    {tabBar}
    {tab===0&&<ListToolbar
      title="TỒN KHO & ĐIỀU CHUYỂN"
      note="Theo dõi tồn theo đúng dự án/kho được phân quyền; điều chuyển phải có xác nhận kho đích."
      count={filtered.length} total={scopedInventory.length} unit="mã vật tư"
      search={{ value: query, onChange: setQuery, placeholder: "Tìm kiếm theo mã vật tư, tên vật tư..." }}
      sort={{ value: sortKey, onChange: setSortKey, options: [{ value: "code", label: "Mã vật tư" }, { value: "name", label: "Tên vật tư" }, { value: "avail_desc", label: "Tồn khả dụng — cao nhất" }, { value: "avail_asc", label: "Tồn khả dụng — thấp nhất" }, { value: "min_desc", label: "Tồn tối thiểu — cao nhất" }, { value: "wh", label: "Kho / vị trí" }] }}
      filters={[
        { key: "warehouse", label: "Kho", value: whFilter, onChange: setWhFilter, options: [{ value: "ALL", label: "Tất cả kho" }, ...allowedWarehouses.map((w) => ({ value: String(w.id), label: w.name }))] },
        { key: "low", label: "Mức tồn", value: lowOnly ? "low" : "ALL", onChange: (v: string) => setLowOnly(v === "low"), options: [{ value: "ALL", label: "Tất cả mức tồn" }, { value: "low", label: `Chỉ tồn dưới mức tối thiểu (${below})` }] },
      ]}
      extra={<>
        
        <label className="list-toolbar-field check-inline"><input type="checkbox" checked={lowOnly} onChange={e=>setLowOnly(e.target.checked)}/><span>Chỉ hiện tồn dưới mức tối thiểu ({below})</span></label>
      </>}
      actions={<>
        {lowOnly&&<button className="secondary" onClick={()=>{setLowOnly(false);setQuery("");}}>Đặt lại</button>}
        <button className="secondary" onClick={()=>exportInventoryXlsx(filtered)}>⇩ Xuất Excel</button>
        <button className="secondary" disabled={!filtered.length} onClick={()=>printInventoryBarcodes(filtered)}>▥ In mã Barcode</button><button className="secondary" data-vntech="inv-transfer-btn" onClick={()=>open("transfer")}>⇄ Chuyển kho</button><button className="secondary" data-vntech="inv-ledger-btn" onClick={()=>printInventoryLedger(filtered)}>▤ Thẻ kho</button>
      </>}
    />}
    <div className="inventory-approved-grid"><div className="inventory-approved-main stack"><div className="kpi-grid"><Kpi icon="TK" label="Tồn khả dụng" value={format.format(totalQty)} note="mã/đơn vị tồn trong phạm vi"/><Kpi icon="CN" label="Chờ nhập" value={format.format(inbound)} note="theo PO đang giao" tone="violet"/><Kpi icon="CX" label="Chờ xuất" value={format.format(outbound)} note="theo yêu cầu cấp phát" tone="amber"/><Kpi icon="CB" label="Cảnh báo tồn thấp" value={`${format.format(below)} mặt hàng`} note="dưới mức tồn tối thiểu" tone="red"/></div>
      {/* Bộ lọc đã gộp vào ListToolbar phía trên — không còn card lọc tách rời (§5). */}
      {/* ⭐ HUB «KHO VẬT TƯ» — ⛔ BỎ DẢI TAB LẶP: bản cũ vẽ dải tab **2 lần** (1 ở `tabBar` đầu màn + 1 ở đây)
          ⇒ user thấy 2 hàng tab giống nhau. Nay chỉ còn `tabBar`; chỗ này thay bằng **DASHBOARD TỒN KHO**
          đặt NGAY ĐẦU tab «KHO» — đúng yêu cầu «click vào menu nó sẽ hiển thị luôn ra màn dashboard tồn kho».
          ⭐ Dashboard TÁI DÙNG component có sẵn `WarehouseDashboard` (8 chỉ số §19) — ⛔ không viết lại. */}
      {tab===0&&<WarehouseDashboard data={data} project={project}/>}

      {/* ── MT3 §F — TAB 1 «KHO»: danh sách kho dạng CARD, bấm card mở modal chi tiết ── */}
      {tab===0&&<section className="card" data-vntech="warehouse-cards">
        {/* MT3 §F — TOOLBAR CRUD CHO KHO (Tạo · Sửa · Xóa · Tìm · Sắp xếp · Lọc · Xuất Excel).
            ⚠️ 2026-10-07 (BUG-20261007-014/015, ERP-SESSION-02): 3 nút «Tạo kho / Sửa / Xóa» TẠM KHOÁ.
            ĐO THẬT trên :9000 — bấm ⛔ KHÔNG có gì xảy ra (dai 107.793 → 107.793, hub vẫn true).
            ROOT CAUSE (đã chứng minh): `open("warehouse")` ⇒ `setModal("warehouse")` nhưng `app/page.tsx`
            có đủ 40 modal và ⛔ KHÔNG có tên `warehouse` (cũng ⛔ không có `WarehouseModal` nào);
            `action("delete_warehouse")` ⛔ không tồn tại ở CẢ JS lẫn Java backend.
            ⇒ ⛔ Không để nút bấm mà IM LẶNG (§22 — error state). Mở lại khi backend bổ sung modal + action.
            ⛔ GIỮ NGUYÊN onClick để hoàn nguyên chỉ bằng cách bỏ `disabled`. */}
        <ListToolbar title="KHO" note="Danh sách kho trong phạm vi dự án bạn được phân quyền. Bấm một thẻ để xem thủ kho, lịch sử xuất/nhập, lịch sử cấp phát/hoàn trả và danh mục vật tư trong kho. ⚠️ Ba nút «Tạo kho / Sửa / Xóa» đang TẠM KHOÁ: backend chưa khai báo modal «warehouse» và action «delete_warehouse» (§14/§20 — chờ bổ sung)."
          count={visibleWarehouses.length} total={allowedWarehouses.length} unit="kho"
          search={{value:whQuery,onChange:setWhQuery,placeholder:"Tìm theo tên hoặc mã kho..."}}
          sort={{value:whSortKey,onChange:setWhSortKey,options:[{value:"name_asc",label:"Tên A→Z"},{value:"name_desc",label:"Tên Z→A"},{value:"items_desc",label:"Nhiều vật tư trước"}]}}
          actions={<>
            <button type="button" className="primary" disabled title="TẠM KHOÁ (BUG-20261007-014): app/page.tsx chưa có modal «warehouse» ⇒ bấm ⛔ không mở gì. Chờ backend bổ sung." onClick={()=>open("warehouse")}>＋ Tạo kho</button>
            <button type="button" className="secondary" disabled title="TẠM KHOÁ (BUG-20261007-014): modal «warehouse» chưa tồn tại ⇒ ⛔ không sửa được. Chờ backend bổ sung." onClick={()=>{const w=allowedWarehouses.find((x:Row)=>String(x.id)===selectedWhId);if(w)open("warehouse",w);}}>✎ Sửa</button>
            <button type="button" className="secondary" disabled title="TẠM KHOÁ (BUG-20261007-015): action «delete_warehouse» ⛔ không tồn tại ở cả JS lẫn Java backend ⇒ ⛔ không xoá được." onClick={()=>{const w=allowedWarehouses.find((x:Row)=>String(x.id)===selectedWhId);if(w&&action&&window.confirm(`Xóa kho ${String(w.warehouseName||w.warehouseCode)}?`))void action("delete_warehouse",{warehouseId:w.id});}}>🗑 Xóa</button>
          </>}
          secondaryActions={<button type="button" className="secondary" onClick={()=>exportWarehousesCsv(visibleWarehouses)}>⇩ Xuất Excel</button>}
        />
        {/* MT3 §F — số liệu TỔNG HỢP toàn phạm vi được phép (⛔ không chỉ một kho). */}
        
        <div className="warehouse-card-grid">
          {visibleWarehouses.map((w:Row)=>{
            const card=cardById.get(String(w.id));
            const whRows=scopedInventory.filter((r:Row)=>String(r.warehouseId)===String(w.id));
            const whIssued=data.issues.filter((r:Row)=>String(r.warehouseId)===String(w.id));
            // ⭐ BỐN thông tin user yêu cầu: TÊN KHO · MÃ KHO · DỰ ÁN (CHỈ kho dự án) · TỒN KHO HIỆN TẠI.
            // ⚠️ SỬA LỖI CÓ SẴN: bản cũ đọc `w.warehouseName`/`w.warehouseCode`/`w.warehouseType` — 3 trường
            //    ⛔ KHÔNG tồn tại trong payload (đo thật: `id`·`code`·`name`·`type`·`projectId`) ⇒ card hiện
            //    **UUID thay vì tên kho** và nhãn loại luôn sai. Nay đọc qua `card` (nguồn ĐÚNG) + fallback `w.name`/`w.code`.
            const wid = String(w.id);
            const thieu = shortageByWarehouse.get(wid) || 0;
            const keepers = keepersByWarehouse.get(wid) || [];
            const keeperText = keepers.length ? (keepers.length > 1 ? `${keepers[0]} (+${keepers.length - 1})` : keepers[0]) : "— chưa gán —";
            // ⭐ HUB «KHO VẬT TƯ» — CARD KHO (yêu cầu user ①): TÊN · MÃ · TỒN KHO · MÃ ĐANG THIẾU · TRẠNG THÁI · THỦ KHO.
            // ⭐⭐ TASK-230 (yêu cầu user ⑤): «Khi click vào kho ở tab dashboard không hiển thị thông tin của kho»
            //    ⇒ NAY **BẤM 1 LẦN = MỞ MÀN CHI TIẾT KHO** (trước đây 1 lần chỉ CHỌN, phải bấm đúp mới mở ⇒ user ⛔ không thấy gì).
            //    Vẫn ĐỒNG THỜI chọn kho (để nút «Xem chi tiết kho đang chọn» + Sửa/Xóa vẫn dùng được).
            const cardClass = ["warehouse-card", selectedWhId === wid ? "is-selected" : "", thieu > 0 ? "is-low" : ""].filter(Boolean).join(" ");
            return <button type="button" className={cardClass} key={wid} data-vntech="warehouse-card"
              aria-pressed={selectedWhId === wid}
              title={`Mở chi tiết kho ${card?.name || String(w.name || "")}`}
              onClick={()=>{setSelectedWhId(wid);setOpenWarehouseId(wid);}}>
              <b>{card?.name||String(w.name||w.id)}</b>
              <span className="wc-code">{card?.code||String(w.code||"")} · {card?.type==="central"?"Kho Tổng":card?.type==="site"?"Kho dự án":card?.type==="transit"?"Kho trung chuyển":String(card?.type||"—")}</span>
              {card?.isProjectWarehouse?<span className="wc-sub">Dự án: {card.projectName||card.projectCode||"—"}</span>:null}
              <div className="wc-rows">
                <div className="wc-row"><span>Tồn kho</span><strong>{format.format(card?.totals.balance||0)}</strong></div>
                <div className="wc-row"><span>Số mã đang thiếu</span>
                  <span className={thieu>0?"wc-chip low":"wc-chip ok"}>{thieu>0?`${thieu} mã`:"Đủ tồn"}</span></div>
                <div className="wc-row"><span>Thủ kho</span><span className="wc-keeper" title={keepers.join(", ")||"Chưa gán người phụ trách kho"}>{keeperText}</span></div>
                <div className="wc-row"><span>Trạng thái</span><span className="wc-chip ok">Đang hoạt động</span></div>
              </div>
              <em className="warehouse-card-hint">Bấm để mở chi tiết kho · {whRows.length} vật tư</em>
            </button>;
          })}
          {!visibleWarehouses.length&&<Empty text={whQuery?"Không có kho nào khớp từ khoá tìm kiếm.":"Chưa có kho nào trong phạm vi bạn được phân quyền."}/>}
          {/* MT3 §F — bấm thẻ để CHỌN (cho Sửa/Xóa); nút này mở MODAL CHI TIẾT kho đang chọn. */}
          <button type="button" className="secondary" data-vntech="warehouse-open-detail" disabled={!selectedWhId} onClick={()=>{if(selectedWhId)setOpenWarehouseId(selectedWhId);}}>◉ Xem chi tiết kho đang chọn</button>
        </div>
      </section>}

      {/* ── MT3 §F — TAB 2 «NHẬP KHO & XUẤT KHO»: gộp 2 mục cũ, có 2 sub-tab ── */}
      {tab===1&&<section className="card" data-vntech="warehouse-io-tab">
        <CardHead title="NHẬP KHO & XUẤT KHO" note="Gộp hai mục cũ theo MT3 §F; chọn sub-tab bên dưới."/>
        <div className="project-scope-tabs" role="tablist" aria-label="Nhập kho và Xuất kho">
          <button type="button" role="tab" aria-selected={ioTab==="issue"} className={ioTab==="issue"?"active":""} onClick={()=>setIoTab("issue")}>Xuất kho</button>
          <button type="button" role="tab" aria-selected={ioTab==="receipt"} className={ioTab==="receipt"?"active":""} onClick={()=>setIoTab("receipt")}>Nhập kho</button>
        </div>
        <div className="warehouse-io-actions">
          <button type="button" className="primary" onClick={()=>open(ioTab==="issue"?"issue":"receipt")}>{ioTab==="issue"?"⭳ Tạo phiếu xuất kho":"⭱ Tạo phiếu nhập kho"}</button>
        </div>
      </section>}

      {/* ── HUB «KHO VẬT TƯ» — TAB 3 «CẤP PHÁT & HOÀN TRẢ» (⚠️ bản cũ để `tab===3` ⇒ ⛔ KHÔNG BAO GIỜ HIỆN
             vì màn chỉ còn 3 tab 0/1/2 — LỖI LOGIC đã sửa thành `tab===2`) ── */}
      {tab===2&&<section className="card" data-vntech="warehouse-allocate-tab">
        <CardHead title="CẤP PHÁT & HOÀN TRẢ" note="Phiếu cấp phát vật tư cho tổ đội, hoàn trả lại kho, và LUÂN CHUYỂN VẬT TƯ DƯ về kho."/>
        {/* ⭐ SUBTABBAR «CẤP PHÁT / HOÀN TRẢ» — mặc định chọn theo QUYỀN user (`arTab` ← `defaultAllocateReturnSubtab`). */}
        <div className="project-scope-tabs" role="tablist" aria-label="Cấp phát và hoàn trả">
          <button type="button" role="tab" aria-selected={arTab==="allocate"} className={arTab==="allocate"?"active":""} data-vntech="ar-tab-allocate" onClick={()=>setArTab("allocate")}>Cấp phát</button>
          <button type="button" role="tab" aria-selected={arTab==="return"} className={arTab==="return"?"active":""} data-vntech="ar-tab-return" onClick={()=>setArTab("return")}>Hoàn trả</button>
        </div>
        <ListToolbar
          title={arTab==="allocate"?"DANH SÁCH PHIẾU CẤP PHÁT":"DANH SÁCH PHIẾU HOÀN TRẢ"}
          note="Nguồn: phiếu xuất kho cấp cho tổ đội (cấp phát) · phiếu hoàn trả về kho. ⛔ Chưa có sửa/xoá: backend chưa khai báo action (§14/§20). ⚠️ Nút «Tạo phiếu cấp phát» đang TẠM KHOÁ: app/page.tsx chưa có modal «allocate» (BUG-20261007-013)."
          count={arRows.length} total={arSource.length} unit={arTab==="allocate"?"phiếu cấp phát":"phiếu hoàn trả"}
          search={{ value: arQuery, onChange: setArQuery, placeholder: "Tìm mã đơn · dự án · tổ đội · người nhận..." }}
          sort={{ value: arSortKey, onChange: setArSortKey, options: [{ value: "date", label: "Ngày" }, { value: "no", label: "Mã đơn" }, { value: "project", label: "Dự án" }, { value: "qty_desc", label: "Số lượng — cao nhất" }] }}
          filters={[{ key: "status", label: "Trạng thái", value: arStatus, onChange: setArStatus, options: [{ value: "ALL", label: "Tất cả trạng thái" }, ...arStatusOptions.map((s) => ({ value: s, label: s }))] }]}
          actions={arTab==="allocate"
            ? <button type="button" className="primary" data-vntech="open-allocate" disabled title="TẠM KHOÁ (BUG-20261007-013): app/page.tsx chưa có modal «allocate» ⇒ bấm ⛔ không mở gì. Nút «Tạo phiếu hoàn trả» vẫn dùng được." onClick={()=>open("allocate")}>＋ Tạo phiếu cấp phát</button>
            : <button type="button" className="primary" data-vntech="open-return" onClick={()=>open("return")}>＋ Tạo phiếu hoàn trả</button>}
        />
        {arTab==="allocate"
          ? <DataTable rows={arRows} rowKey={(row,index)=>String(`${row.id}-${index}`)} columns={[
              { key: "c1", header: "#", render: (row,index) => <>{index+1}</> },
              { key: "c2", header: "Mã đơn", render: (row) => <><strong className="link">{row.issueNo}</strong></> },
              { key: "c3", header: "Người tạo", render: () => <span className="muted">—</span> },
              { key: "c4", header: "Tổ đội / người nhận", render: (row) => <>{row.teamName} · {row.receivedByName || "—"}</> },
              { key: "c5", header: "Dự án", render: (row) => <>{row.projectCode}</> },
              { key: "c6", header: "Kho xuất", render: () => <span className="muted">—</span> },
              { key: "c7", header: "Ngày xuất", render: (row) => <>{row.issuedAt ? String(row.issuedAt).slice(0,10) : "—"}</> },
              { key: "c8", header: "SL xuất", render: (row) => <><strong>{format.format(row.totalQty || 0)}</strong></> },
              { key: "c9", header: "Đã lắp đặt", render: (row) => <>{format.format(row.installedQty || 0)}</> },
              { key: "c10", header: "Trạng thái", render: (row) => <><StatusBadge value={String(row.status) === "issued" ? "Đã xuất" : statusLabel(row.status)}/></> },
            ]} emptyText="Chưa có phiếu cấp phát trong phạm vi." />
          : <DataTable rows={arRows} rowKey={(row,index)=>String(`${row.id}-${index}`)} columns={[
              { key: "c1", header: "#", render: (row,index) => <>{index+1}</> },
              { key: "c2", header: "Mã đơn", render: (row) => <><strong className="link">{row.returnNo}</strong></> },
              { key: "c3", header: "Người trả", render: (row) => <>{row.returnedByName || "—"}</> },
              { key: "c4", header: "Tổ đội / người nhận", render: (row) => <>{row.teamName} · {row.returnedByName || "—"}</> },
              { key: "c5", header: "Dự án", render: (row) => <>{row.projectCode}</> },
              { key: "c6", header: "Kho nhập", render: () => <span className="muted">—</span> },
              { key: "c7", header: "Ngày trả", render: (row) => <>{row.returnedAt ? String(row.returnedAt).slice(0,10) : "—"}</> },
              { key: "c8", header: "SL nhận", render: (row) => <><strong>{format.format(row.acceptedQty || 0)}</strong></> },
              { key: "c9", header: "Số dòng", render: (row) => <>{format.format(row.itemCount || 0)}</> },
              { key: "c10", header: "Trạng thái", render: (row) => <><StatusBadge value={statusLabel(row.status)}/></> },
            ]} emptyText="Chưa có phiếu hoàn trả trong phạm vi." />}
        <div className="table-pagination functional-summary"><span>Hiển thị {arRows.length}/{arSource.length} {arTab==="allocate"?"phiếu cấp phát":"phiếu hoàn trả"} phù hợp bộ lọc.</span></div>
        {/* ⛔ QUYẾT ĐỊNH USER (26/09/2026): «Luân chuyển vật tư dư» LÀ MỘT PHẦN của Cấp phát & hoàn trả
            – Nhập/Xuất kho ⇒ chuyển danh sách này từ màn «Kho tổng» về ĐÂY. ⛔ Không xoá nghiệp vụ. */}
        <h3 className="section-subhead">LUÂN CHUYỂN VẬT TƯ DƯ DỰ ÁN → KHO</h3>
        <div className="table-wrap"><table><thead><tr><th>Phiếu / dự án</th><th>Đề nghị</th><th>Chấp nhận / từ chối</th><th>Ảnh</th><th>Trạng thái</th><th>Xử lý</th></tr></thead>
          <tbody>{(data.centralReturns||[]).map((row:Row)=><tr key={String(row.id)}>
            <td><strong>{String(row.returnNo||"")}</strong><small>{String(row.projectCode||"")} · {String(row.sourceWarehouseName||"")}</small></td>
            <td>{format.format(row.proposedQty||0)} · {String(row.itemCount||0)} dòng</td>
            <td>{format.format(row.acceptedQty||0)} / {format.format(row.rejectedQty||0)}</td>
            <td>{String(row.attachmentCount||0)}</td>
            <td><StatusBadge value={row.status==="pending_approval"?"Chờ phê duyệt":row.status==="in_transit"?"Đang vận chuyển":row.status==="received_with_rejection"?"Đã nhận · Có từ chối":"Đã nhận"}/></td>
            <td><div className="row-actions">
              {row.status==="pending_approval"&&action&&<button className="mini-approve" onClick={()=>void action("approve_central_return",{centralReturnId:row.id,reason:"Đã duyệt chuyển vật tư dư về kho"})}>Duyệt</button>}
              {row.status==="in_transit"&&<button className="secondary" onClick={()=>open("centralReceive",row)}>Kiểm đếm</button>}
              {row.status==="in_transit"&&<AttachmentPanel entityType="central_return" entityId={String(row.id)} />}
            </div></td></tr>)}
          {!(data.centralReturns||[]).length&&<tr><td colSpan={6}><Empty text="Chưa có phiếu chuyển vật tư dư nào."/></td></tr>}
          </tbody></table></div>
      </section>}

      {/* ⛔ MT3 §F: các nút NHẬP KHO / XUẤT KHO / CHUYỂN KHO đã thành TAB & sub-tab ở trên ⇒ bỏ khỏi dải này.
          Giữ lại THẺ KHO (in thẻ kho — hành động độc lập, không trùng tab nào). */}
      {/* ⭐ HUB «KHO VẬT TƯ» — BẢNG TỒN KHO nay CHỈ hiện trong TAB «KHO» (bản cũ render ở MỌI tab ⇒ tab
          XUẤT&NHẬP / CẤP PHÁT cũng thấy bảng tồn kho — SAI yêu cầu user «mỗi tab 1 nội dung»). */}
      {tab===0&&<section className="card inventory-tabs-card"><DataTable rows={filtered} rowKey={(row, index) => String(`${row.warehouseId}-${row.materialId}-${index}`)} columns={[{ key: "c1", header: "#", render: (row, index) => <>{index+1}</> }, { key: "c2", header: "Mã vật tư", render: (row) => <><strong className="link">{row.materialCode}</strong></> }, { key: "c3", header: "Tên vật tư", render: (row) => <>{row.materialName}</> }, { key: "c4", header: "ĐVT", render: (row) => <>{row.unit}</> }, { key: "c5", header: "On Hand", render: (row) => <>{format.format(row.balance||0)}</> }, { key: "c6", header: "Đã giữ", render: (row) => <>{format.format(row.reserved||0)}</> }, { key: "c7", header: "Tồn khả dụng", render: (row) => <><strong>{format.format((row.available??row.balance)||0)}</strong></> }, { key: "c8", header: "Tồn tối thiểu", render: (row) => <>{format.format(row.minStock||0)}</> }, { key: "c9", header: "Vị trí/Kho", render: (row) => <>{row.warehouseCode||row.warehouseName} · {row.locationCode||"—"}</> }, { key: "c10", header: "Dự án", render: (row) => <>{row.projectCode||row.projectName||"Kho"}</> }, { key: "c11", header: "Trạng thái", render: (row) => <><StatusBadge value={Number(row.balance)<Number(row.minStock)?"Sắp hết":"Bình thường"}/></> }]} emptyText="Chưa phát sinh tồn kho." /><div className="table-pagination functional-summary"><span>Đang hiển thị toàn bộ {filtered.length} vật tư phù hợp bộ lọc.</span></div></section>}
      {tab===2&&<section className="card"><CardHead title="Phiếu điều chuyển đang xử lý" note="Requested → Approved → In Transit → Received; tồn kho nguồn giảm ngay khi Ship."/><div className="table-wrap"><table><thead><tr><th>Phiếu</th><th>Nguồn</th><th>Đích</th><th>Yêu cầu</th><th>Đã xuất</th><th>Đã nhận</th><th>Trạng thái</th></tr></thead><tbody>{data.transferOrders.filter(row=>!["received","cancelled"].includes(String(row.status))).slice(0,10).map(row=><tr key={row.id}><td><strong>{row.transferNo}</strong></td><td>{row.sourceWarehouseCode}</td><td>{row.destinationWarehouseCode}</td><td>{format.format(row.requestedQty||0)}</td><td>{format.format(row.shippedQty||0)}</td><td>{format.format(row.receivedQty||0)}</td><td><StatusBadge value={row.status==="requested"?"Chờ duyệt":row.status==="approved"?"Đã duyệt":row.status==="in_transit"?"Đang vận chuyển":"Đã nhận"}/></td></tr>)}{!data.transferOrders.filter(row=>!["received","cancelled"].includes(String(row.status))).length&&<tr><td colSpan={7}><Empty text="Không có phiếu điều chuyển đang xử lý."/></td></tr>}</tbody></table></div></section>}
      {tab===0&&<div className="inventory-bottom-grid"><section className="card"><CardHead title="Cảnh báo tồn kho"/><div className="simple-list"><div><span className="doc-icon"><NavIcon name="dept_plan_alerts"/></span><div><strong>{below} mã vật tư sắp hết tồn</strong><p>Dưới mức tồn tối thiểu đã cấu hình</p></div></div><div><span className="doc-icon"><NavIcon name="inventory"/></span><div><strong>{outbound} yêu cầu xuất/điều chuyển đang theo dõi</strong><p>Kiểm tra trạng thái trước khi xác nhận kho đích</p></div></div></div></section></div>}
      {/* ⛔ MODAL CHI TIẾT KHO ĐÃ XOÁ (06/10/2026 · TASK-226): thay bằng **MÀN CHI TIẾT KHO** có nút quay lại + 5 tab
          ở khối `if (openWarehouseId) { … return … }` phía trên — yêu cầu user «click vào sẽ hiển thị ra màn thông tin chi tiết
          của kho (có nút quay lại màn KHO)». ⛔ Không còn mã chết. */}
    </div>{transferPanelOpen&&<div className="overlay" onMouseDown={(event)=>{if(event.target===event.currentTarget)setTransferPanelOpen(false);}}><div className="modal" role="dialog" aria-modal="true" aria-label="Tạo phiếu nhập / xuất / điều chuyển"><aside className="card inventory-transfer-panel"><h2>TẠO PHIẾU NHẬP / XUẤT / ĐIỀU CHUYỂN</h2><div className="switch-tabs"><span className="active" aria-current="page">ĐIỀU CHUYỂN</span><button onClick={()=>open("receipt")}>NHẬP KHO</button><button onClick={()=>open("issue")}>XUẤT KHO</button></div><div className="scope-lock-note">Biểu mẫu điều chuyển đầy đủ sẽ mở khi bấm nút bên dưới; Kho nguồn/đích, vật tư, số lượng và ghi chú được kiểm tra tại biểu mẫu thật.</div><button className="primary wide" onClick={()=>open("transfer")}>TẠO PHIẾU ĐIỀU CHUYỂN</button><div className="scope-lock-note">🔒 Chỉ hiển thị kho/dự án thuộc phạm vi tài khoản. Thủ kho dự án không thao tác Kho Tổng; Thủ kho Tổng không thao tác kho dự án.</div><div className="qr-card compact"><h2>MÃ VẠCH / QR CODE</h2><div className="barcode-preview">|||| ||| | ||||</div><button className="secondary" disabled={!filtered.length} onClick={()=>printInventoryBarcodes(filtered)}>IN TEM MÃ</button></div></aside><footer className="modal-actions"><button type="button" className="secondary" data-vntech="close-transfer-panel" onClick={()=>setTransferPanelOpen(false)}>Đóng</button></footer></div></div>}</div>
    {/* ⭐ HUB «KHO VẬT TƯ» — DANH SÁCH PHIẾU XUẤT nay CHỈ hiện trong TAB «XUẤT & NHẬP» + subtab «XUẤT»
        (bản cũ render ở MỌI tab ⇒ tab CẤP PHÁT/HOÀN TRẢ cũng thấy danh sách xuất — SAI yêu cầu user). */}
    {tab===1&&ioTab==="issue"&&<section className="card" data-vntech="issue-list-screen">
      <ListToolbar
        title="DANH SÁCH PHIẾU XUẤT · ĐƠN XUẤT KHO"
        note="§7.5 — phiếu xuất kho cho tổ đội (nguồn: stock_issues + stock_issue_items). Tạo mới qua nút «XUẤT KHO» phía trên. ⛔ Không có sửa/xoá phiếu xuất: backend chưa khai báo action — không bịa nghiệp vụ (§14/§20)."
        count={issueRows.length} total={scopeIssues.length} unit="phiếu"
        search={{ value: issueQuery, onChange: setIssueQuery, placeholder: "Tìm phiếu xuất · dự án · tổ đội · người nhận..." }}
        sort={{ value: issueSortKey, onChange: setIssueSortKey, options: [{ value: "issuedAt", label: "Ngày xuất" }, { value: "issueNo", label: "Số phiếu" }, { value: "project", label: "Dự án" }, { value: "qty_desc", label: "Số lượng — cao nhất" }] }}
        filters={[{ key: "status", label: "Trạng thái", value: issueStatus, onChange: setIssueStatus, options: [{ value: "ALL", label: "Tất cả trạng thái" }, ...issueStatusOptions.map((s) => ({ value: s, label: s }))] }]}
        actions={<button type="button" className="primary" data-vntech="open-transfer-panel" onClick={()=>setTransferPanelOpen(true)}>＋ TẠO PHIẾU NHẬP / XUẤT / ĐIỀU CHUYỂN</button>}
      />
      <DataTable rows={issueRows} rowKey={(row, index) => String(`${row.id}-${index}`)} columns={[
        { key: "c1", header: "#", render: (row, index) => <>{index + 1}</> },
        { key: "c2", header: "Số phiếu xuất", render: (row) => <><strong className="link">{row.issueNo}</strong></> },
        { key: "c3", header: "Dự án", render: (row) => <>{row.projectCode}</> },
        { key: "c4", header: "Tổ đội nhận", render: (row) => <>{row.teamName}</> },
        { key: "c5", header: "Người nhận", render: (row) => <>{row.receivedByName || "—"}</> },
        { key: "c6", header: "Ngày xuất", render: (row) => <>{row.issuedAt ? String(row.issuedAt).slice(0, 10) : "—"}</> },
        { key: "c7", header: "SL xuất", render: (row) => <><strong>{format.format(row.totalQty || 0)}</strong></> },
        { key: "c8", header: "Đã lắp đặt", render: (row) => <>{format.format(row.installedQty || 0)}</> },
        { key: "c9", header: "Trạng thái", render: (row) => <><StatusBadge value={String(row.status) === "issued" ? "Đã xuất" : statusLabel(row.status)} /></> },
      ]} emptyText="Chưa có phiếu xuất kho nào trong phạm vi." />
      <div className="table-pagination functional-summary"><span>Hiển thị {issueRows.length}/{scopeIssues.length} phiếu xuất phù hợp bộ lọc.</span></div>
    </section>}

    {/* ⭐ HUB «KHO VẬT TƯ» — SUBTAB «NHẬP» của tab «XUẤT & NHẬP» — MỚI (bản cũ ⛔ chỉ có nút tạo).
        Nhóm nút theo yêu cầu user: TẠO · TÌM (search) · SẮP XẾP (sort) · LỌC (filter).
        ⛔ KHÔNG bịa nghiệp vụ sửa/xoá: backend chưa khai báo action update/delete cho phiếu nhập (§14/§20) ⇒ READ + TẠO. */}
    {tab===1&&ioTab==="receipt"&&<section className="card" data-vntech="receipt-list-screen">
      <ListToolbar
        title="DANH SÁCH PHIẾU NHẬP · ĐƠN NHẬP KHO"
        note="Nguồn: goods_receipts + goods_receipt_items. Tạo mới qua nút bên phải. ⛔ Chưa có sửa/xoá phiếu nhập — backend chưa khai báo action (§14/§20)."
        count={receiptRows.length} total={scopeReceipts.length} unit="phiếu"
        search={{ value: recQuery, onChange: setRecQuery, placeholder: "Tìm phiếu nhập · PO · dự án · nhà cung cấp · kho..." }}
        sort={{ value: recSortKey, onChange: setRecSortKey, options: [{ value: "receivedAt", label: "Ngày nhập" }, { value: "receiptNo", label: "Số phiếu" }, { value: "project", label: "Dự án" }, { value: "supplier", label: "Nhà cung cấp" }, { value: "qty_desc", label: "Số lượng — cao nhất" }] }}
        filters={[{ key: "status", label: "Xác nhận BCH", value: recStatus, onChange: setRecStatus, options: [{ value: "ALL", label: "Tất cả trạng thái" }, ...recStatusOptions.map((s) => ({ value: s, label: s }))] }]}
        actions={<button type="button" className="primary" data-vntech="open-receipt-create" onClick={()=>open("receipt")}>＋ Tạo phiếu nhập kho</button>}
      />
      <DataTable rows={receiptRows} rowKey={(row, index) => String(`${row.id}-${index}`)} columns={[
        { key: "c1", header: "#", render: (row, index) => <>{index + 1}</> },
        { key: "c2", header: "Số phiếu nhập", render: (row) => <><strong className="link">{row.receiptNo}</strong></> },
        { key: "c3", header: "Đơn mua (PO)", render: (row) => <>{row.poNo || "—"}</> },
        { key: "c4", header: "Dự án", render: (row) => <>{row.projectCode || "—"}</> },
        { key: "c5", header: "Nhà cung cấp", render: (row) => <>{row.supplierName || "—"}</> },
        { key: "c6", header: "Kho nhập", render: (row) => <>{row.warehouseName || "—"}</> },
        { key: "c7", header: "Ngày nhập", render: (row) => <>{row.receivedAt ? String(row.receivedAt).slice(0, 10) : "—"}</> },
        { key: "c8", header: "SL nhận", render: (row) => <><strong>{format.format(row.acceptedQty || 0)}</strong></> },
        { key: "c9", header: "Số dòng", render: (row) => <>{format.format(row.itemCount || 0)}</> },
        { key: "c10", header: "BCH xác nhận", render: (row) => <><StatusBadge value={row.bchConfirmationStatus === "confirmed" ? "Đã xác nhận" : row.bchConfirmationStatus === "pending" ? "Chờ xác nhận" : String(row.bchConfirmationStatus || "—")}/></> },
      ]} emptyText="Chưa có phiếu nhập kho nào trong phạm vi." />
      <div className="table-pagination functional-summary"><span>Hiển thị {receiptRows.length}/{scopeReceipts.length} phiếu nhập phù hợp bộ lọc.</span></div>
    </section>}
  </div>;
}
export {
  Inventory,
};
