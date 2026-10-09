> **VNTECH ERP — BỘ TÀI LIỆU PHIÊN BẢN `ALPHA TEST`**
> · Phiên bản tài liệu: **`DOC-ALPHA-TEST-2026.10`** · Ngày cập nhật: **08/10/2026** · Phiên soạn: `ERP-SESSION-01`
> · Sản phẩm: `V5.3.0-MASTER-BASELINE-R1.1.1` · Cổng: `:8787` (UI) · `:9000` (cutover) · `:18081` (API Java)
> · ⚠️ Trạng thái: **ALPHA TEST** — tài liệu phản ánh bản ĐANG CHẠY; ⛔ chưa phải bản phát hành chính thức.
> · 📌 Nguồn sự thật: **mã nguồn + CSDL thật** (mọi số liệu đều ĐO được, ⛔ không suy đoán).

# MÔ TẢ CHỨC NĂNG VÀ HỆ THỐNG — VNTECH ERP V5.3.0

Tài liệu mô tả **toàn bộ chức năng của hệ thống theo nhóm nghiệp vụ**, kèm danh mục màn hình, danh mục action backend, luồng xử lý nghiệp vụ và mô hình quyền 3 tầng. Đây là tài liệu "viết theo đúng hệ thống ĐANG CHẠY" để làm cơ sở nghiệm thu và đào tạo.

**Bản cập nhật: 08/10/2026** (thay thế bản 23/09/2026) · Phiên bản mã đo tại commit `3cfbd75` · Baseline `V5.3.0-MASTER-BASELINE-R1.1.1`.

---

## MỤC LỤC

| § | Mục | Nội dung |
|---|---|---|
| 0 | [Cách đo số liệu](#0-cách-đo-số-liệu-nguồn-sự-thật) | Nguồn sự thật, lệnh đo, môi trường đo |
| 1 | [Cấu trúc menu & nhóm chức năng](#1-cấu-trúc-menu--nhóm-chức-năng) | 12 nhóm menu, menu theo dự án, menu điện thoại |
| 2 | [Danh mục màn hình](#2-danh-mục-màn-hình) | 55 tệp `app/screens/`, bảng màn chính, màn placeholder |
| 3 | [Backend & danh mục action](#3-backend--danh-mục-action) | 261 nhãn `case`, 431 mục RBAC, **RBAC 3 TẦNG** |
| 4 | [Luồng nghiệp vụ chính](#4-luồng-nghiệp-vụ-chính) | Mua hàng, kho (nhập/xuất/điều chuyển), công việc, phê duyệt |
| 5 | [Quyền người dùng (RBAC)](#5-quyền-người-dùng-rbac) | 14 tab quản trị `admin_tab_01..14`, ⭐ nguyên tắc **U-1** |
| 6 | [Chức năng quản trị (Admin)](#6-chức-năng-quản-trị-admin) | Tài khoản, tổ chức, quyền, menu/form, thông báo, audit, Trust Lock |
| 7 | [Tính năng đặc thù](#7-tính-năng-đặc-thù) | Giữ chỗ tồn kho, thẻ kho, chuyển kho, in mã barcode |
| 8 | [Dữ liệu mẫu bàn giao](#8-dữ-liệu-mẫu-bàn-giao-đo-từ-csdl) | Chuỗi chứng từ PRJ-DEMO-01 (đo thật) |
| 9 | [Mục cần xác minh](#9-mục-cần-xác-minh) | Danh sách ⛔ chưa kiểm chứng được |

---

## 0. CÁCH ĐO SỐ LIỆU (NGUỒN SỰ THẬT)

> 📌 **Nguyên tắc:** mọi con số trong tài liệu này đều **ĐO ĐƯỢC** và ghi kèm **lệnh đo**. ⛔ Không suy đoán, ⛔ không bịa.

### 0.1 Môi trường đo

| Thành phần | Giá trị đo được | Cách kiểm |
|---|---|---|
| Mã nguồn | commit `3cfbd75` — `feat(rbac): U-1 - nguoi uy nhiem quan tri thay du lieu TRONG PHAM VI` | `git log -1 --oneline` |
| CSDL | MySQL 8, schema `vntech_erp` — **134 bảng** | `SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='vntech_erp'` |
| Flyway đã áp | **38** migration thành công, bản cao nhất **V39**, áp lúc `2026-10-08 15:57:04` | `SELECT COUNT(*) FROM flyway_schema_history WHERE success=1` |
| API Java | cổng `18081` — **UP** (`db: UP`, `diskSpace: UP`, `ping: UP`) | `Invoke-WebRequest http://127.0.0.1:18081/actuator/health` |
| UI | cổng `8787` — **đang mở** | `Test-NetConnection 127.0.0.1 -Port 8787` |
| MySQL | cổng `3306` — **đang mở** | `Test-NetConnection 127.0.0.1 -Port 3306` |

### 0.2 Bảng tổng hợp số đếm chủ chốt

| # | Số liệu | Giá trị | Lệnh đo (nguyên văn) |
|---|---|---|---|
| 1 | Số màn (`app/screens/`) | **55** | `Get-ChildItem app/screens -File \| Measure-Object` |
| 2 | Nhãn `case "` trong `SystemController.java` | **261** (261 tên **khác nhau** — `update_user` khai 2 lần) | `Select-String -Path ".../SystemController.java" -Pattern 'case "'` |
| 3 | Mục `Map.entry(` trong `ActionRbacRegistry.java` | **431** | `Select-String -Path ".../ActionRbacRegistry.java" -Pattern 'Map\.entry\('` |
| 4 | Tệp migration `*.sql` | **38** | `Get-ChildItem "java-backend/infrastructure/src/main/resources/db/migration/*.sql" -File \| Measure-Object` |
| 5 | Nhóm menu (`menu_group_catalog`) | **12** (12 đang bật) | `SELECT COUNT(*), SUM(active=1) FROM menu_group_catalog` |
| 6 | Khoá module (`module_catalog`) | **76** (76 đang bật) | `SELECT COUNT(*) FROM module_catalog` |
| 7 | Người dùng (`users`) | **73** | `SELECT COUNT(*) FROM users` |
| 8 | Quyền module theo người | **2 772** dòng | `SELECT COUNT(*) FROM user_module_permissions` |
| 9 | Quyền module theo phòng ban | **481** dòng | `SELECT COUNT(*) FROM department_module_permissions` |
| 10 | Nhóm quyền nghiệp vụ | **11** | `SELECT COUNT(*) FROM business_role_group_catalog` |
| 11 | Bản ghi audit | **4 307** | `SELECT COUNT(*) FROM audit_logs` |

> ⚠️ **Chênh lệch với bản 23/09/2026 (đã cũ):** bản cũ ghi «42 màn», «~224 case», «~135 action monolith», «user_module_permissions 484→926». Các số này ⛔ **không còn đúng**; số mới ở bảng trên.

---

## 1. CẤU TRÚC MENU & NHÓM CHỨC NĂNG

### 1.1 Mười hai nhóm menu (đo từ CSDL — `menu_group_catalog`)

Bảng `menu_group_catalog` có **12 dòng**, tất cả `active=1`, trùng khớp 1-1 với mảng `defaultMenuGroups` trong `lib/ui-shared.tsx` (L31–44):

| Thứ tự | `group_key` | Tên hiển thị | Icon | Thu gọn được |
|---|---|---|---|---|
| 10 | `overview` | TỔNG QUAN | OV | ⛔ không |
| 15 | `my_work` | CÔNG VIỆC | NV | ✅ |
| 25 | `site_command` | QUẢN LÝ DỰ ÁN | DA | ✅ |
| 28 | `mep` | MEP | MEP | ✅ |
| 30 | `purchasing` | MUA HÀNG & CUNG ỨNG | MH | ✅ |
| 40 | `warehouse` | KHO VẬT TƯ | KV | ✅ |
| 45 | `teams` | TỔ ĐỘI | TD | ✅ |
| 50 | `finance` | TÀI CHÍNH – KẾ TOÁN | TC | ✅ |
| 55 | `hr_legal` | HÀNH CHÍNH – PHÁP CHẾ | HC | ✅ |
| 60 | `reports` | BÁO CÁO | BC | ✅ |
| 70 | `material_master` | DANH MỤC VẬT TƯ GỐC | MV | ⛔ không |
| 80 | `system_admin` | QUẢN TRỊ HỆ THỐNG | QT | ✅ |

> 🔎 **Cách đo:** `SELECT group_key,name,sort_order,active FROM menu_group_catalog ORDER BY sort_order;` · đối chiếu `lib/ui-shared.tsx` dòng 31–44 (`defaultMenuGroups`).

### 1.2 Phân bổ khoá module theo nhóm (đo từ CSDL)

`module_catalog` = **76 khoá**, phân bổ theo `group_key`:

| Nhóm | Số khoá module |
|---|---|
| `system_admin` | 15 |
| `purchasing` | 13 |
| `mep` | 9 |
| `finance` | 8 |
| `hr_legal` | 7 |
| `warehouse` | 6 |
| `my_work` | 5 |
| `reports` | 5 |
| `site_command` | 5 |
| `material_master` | 1 |
| `teams` | 1 |
| (⛔ không gán nhóm — `NULL`) | 1 |
| **Tổng** | **76** |

> 🔎 **Cách đo:** `SELECT group_key, COUNT(*) FROM module_catalog GROUP BY group_key ORDER BY group_key;`

### 1.3 Cơ chế gom mục menu (đo từ `lib/menu-helpers.ts`)

Hệ thống đã **gom nhiều mục rời thành 1 mục hub** nhưng ⛔ **không xoá khoá quyền** — cổng quyền vẫn treo trên các khoá cũ:

| Mục menu hiện tại | `key` | Gom từ | Cổng quyền (`permissionKeys`) |
|---|---|---|---|
| Công việc | `work_hub` | 5 mục rời | HỢP của `dept_plan_kpi`, `dept_project_kpi`, `dept_plan_tasks`, `dept_project_tasks`, `dept_plan_assign`, `dept_project_assign`, `dept_plan_alerts`, `dept_project_alerts` |
| Kho vật tư | `warehouse_hub` | 7 mục rời | HỢP của `central_warehouse`, `warehouse_receipt`, `warehouse_issue`, `inventory`, `stocktake`, `material_norms` — đích đến `moduleKey: "inventory"` |
| Cấp phát & hoàn trả | (mục riêng) | mới (`MT2-P9-06`) | dùng chung khoá đã có `warehouse_issue` |

- **4 mục công việc cũ** bị ẩn khỏi menu: `dept_plan_tasks`, `dept_project_tasks`, `dept_plan_assign`, `dept_project_assign` (`legacyWorkMenuKeys`).
- **6 mục kho cũ** bị ẩn khỏi menu: `warehouse_receipt`, `warehouse_issue`, `inventory`, `stocktake`, `material_norms`, `central_warehouse` (`legacyWarehouseMenuKeys`).
- ⚠️ Khoá ⛔ **KHÔNG bị xoá**: quyền, tiêu đề màn, tìm kiếm, thông báo và nhánh render trong `app/page.tsx` vẫn treo trên chúng ⇒ ⛔ không mất chức năng nào.

> 🔎 **Cách đo:** đọc `lib/menu-helpers.ts` (khối `workMenuItems` L125–139, `warehouseMenuItems` L165–177, `supplierPartnerMenuItems` L283).

### 1.4 Menu theo dự án & menu điện thoại

| Chế độ | Mô tả | Trạng thái |
|---|---|---|
| Menu theo dự án | Chọn dự án ⇒ menu chuyển sang ngữ cảnh dự án; dữ liệu lọc theo `visibleProjectIds` | ✅ đang chạy (`BootstrapDataAdapter` dòng 20, 39, 50) |
| Menu điện thoại | Thu gọn thành nút ☰; nhớ trạng thái mở/đóng **theo từng tài khoản**; nhóm rỗng hoặc ⛔ không có quyền thì **tự ẩn** | ✅ đang chạy |
| Cấu hình menu cây | Kéo–thả đổi thứ tự nhóm/mục; thêm · sửa · ẩn · xoá nhóm tuỳ chỉnh | ✅ đang chạy (`app/page.tsx` L1445–1459) |

---

## 2. DANH MỤC MÀN HÌNH

### 2.1 Số đếm

| Đại lượng | Giá trị | Cách đo |
|---|---|---|
| Số tệp trong `app/screens/` | **55** | `Get-ChildItem app/screens -File \| Measure-Object` |
| Màn chính ngoài `app/screens/` | `app/page.tsx` (1 tệp, điều phối toàn bộ `active`) | đọc `app/page.tsx` |

So với bản 23/09/2026 ghi «42 màn» ⇒ **tăng 13 tệp**.

### 2.2 Danh mục 55 tệp `app/screens/` (đo nguyên văn)

| # | Tệp | Loại |
|---|---|---|
| 1 | `admin-governance-pure.ts` | Logic thuần (governance) |
| 2 | `AdminUserModalTabs.tsx` | Modal |
| 3 | `AllocateReturn.tsx` | Màn |
| 4 | `BenefitsScreen.tsx` | Màn |
| 5 | `BoqControl.tsx` | Màn |
| 6 | `CashbankScreen.tsx` | Màn |
| 7 | `ConstructionScreen.tsx` | Màn |
| 8 | `ContractReviewScreen.tsx` | Màn |
| 9 | `CorrespondenceScreen.tsx` | Màn |
| 10 | `Delivered.tsx` | Màn |
| 11 | `DocumentsScreen.tsx` | Màn |
| 12 | `ErrorReportAdminPanel.tsx` | Panel |
| 13 | `ErrorReportModal.tsx` | Modal |
| 14 | `HrProfileEditModal.tsx` | Modal |
| 15 | `HrScreen.tsx` | Màn |
| 16 | `Inventory.tsx` | Màn (hub kho) |
| 17 | `LaborScreen.tsx` | Màn |
| 18 | `LegalDocsScreen.tsx` | Màn |
| 19 | `MaterialCategoryList.tsx` | Thành phần |
| 20 | `MaterialListTable.tsx` | Thành phần |
| 21 | `P08PoNavigation.tsx` | Điều hướng |
| 22 | `P08SupplierNavigation.tsx` | Điều hướng |
| 23 | `PartnerManager.tsx` | Màn |
| 24 | `Payments.tsx` | Màn |
| 25 | `PermissionAccessPanel.tsx` | Panel |
| 26 | `PermissionMatrix.tsx` | Panel |
| 27 | `project-bch-permissions.ts` | Logic thuần |
| 28 | `project-filters.ts` | Logic thuần |
| 29 | `ProjectAggregateTabs.tsx` | Tab |
| 30 | `ProjectDetailTabs.tsx` | Tab |
| 31 | `ProjectEntityModal.tsx` | Modal |
| 32 | `ProjectTeams.tsx` | Tab |
| 33 | `PurchaseOrderDrawer.tsx` | Drawer |
| 34 | `Purchasing.tsx` | Màn |
| 35 | `ReceiptDrawer.tsx` | Drawer |
| 36 | `Receiving.tsx` | Màn |
| 37 | `ReportView.tsx` | Màn |
| 38 | `RequestDrawer.tsx` | Drawer |
| 39 | `Requests.tsx` | Màn |
| 40 | `SealScreen.tsx` | Màn |
| 41 | `SiteCommandCreateModal.tsx` | Modal |
| 42 | `SiteCostScreen.tsx` | Màn |
| 43 | `Stocktake.tsx` | Màn |
| 44 | `SupplierDetailModal.tsx` | Modal |
| 45 | `SupplierManager.tsx` | Màn |
| 46 | `TeamDirectory.tsx` | Màn |
| 47 | `TeamManagement.tsx` | Màn |
| 48 | `WarehouseCreateModal.tsx` | Modal |
| 49 | `WarehouseDashboard.tsx` | Màn |
| 50 | `WarehouseFormModal.tsx` | Modal |
| 51 | `WorkCenter.tsx` | Màn |
| 52 | `WorkDashboard.tsx` | Màn |
| 53 | `WorkflowModal.tsx` | Modal |
| 54 | `WorkHierarchy.tsx` | Màn |
| 55 | `WorkKanban.tsx` | Màn |

### 2.3 Màn nghiệp vụ chính & mô tả

| Màn | Khoá `active` / tệp | Mô tả |
|---|---|---|
| Dashboard | `dashboard` | Thẻ KPI: số dự án, giá trị hợp đồng, tiến độ, thu hồi vốn, công việc chờ; tự đồng bộ định kỳ |
| Requests (Đề nghị mua) | `requests` (`Requests.tsx`, `RequestDrawer.tsx`) | Lập MR (DNMH), theo dõi chuỗi bậc duyệt, tìm kiếm/sắp xếp/lọc |
| Approvals | `approvals` | Trung tâm phê duyệt: chỉ hiện phiếu thuộc quyền; Duyệt / Trả về / bắt buộc lý do; cột SLA |
| Purchasing | `purchasing` (`Purchasing.tsx`, `PurchaseOrderDrawer.tsx`) | Đơn mua hàng (PO), đối chiếu MR/Nhà cung cấp |
| Receiving / Delivered | `receiving` / `delivered` (`Receiving.tsx`, `Delivered.tsx`, `ReceiptDrawer.tsx`) | Nhận hàng, xác nhận số lượng/chứng từ/ảnh; phiếu đã giao |
| Kho vật tư (hub) | `inventory` (`Inventory.tsx`) | **Một cửa vào kho**: dashboard tồn + 5 tab chi tiết kho (Dashboard kho · Tồn kho · Xuất–Nhập · Cấp phát–Hoàn trả · Nhân sự) |
| Warehouse Dashboard | `WarehouseDashboard.tsx` | Bảng điều khiển tồn kho |
| Stocktake | `stocktake` (`Stocktake.tsx`) | Kiểm kê, hoàn trả, đối chiếu |
| Allocate & Return | `AllocateReturn.tsx` | Cấp phát & hoàn trả (cấu trúc UI/dữ liệu; nghiệp vụ theo business rule) |
| TeamDirectory | `team_directory` (`TeamDirectory.tsx`) | Danh sách tổ đội, tab chi tiết, cấp phát |
| TeamManagement | `team_management` (`TeamManagement.tsx`) | Quản lý tổ đội |
| WorkCenter | `work_center` (`WorkCenter.tsx`, `WorkDashboard.tsx`, `WorkKanban.tsx`, `WorkHierarchy.tsx`) | Trung tâm công việc: dashboard · Kanban · cây phân cấp · việc của tôi |
| Supplier Manager | `supplier_manager` (`SupplierManager.tsx`) | Danh mục nhà cung cấp |
| Partner Manager | `partner_manager` (`PartnerManager.tsx`) | Danh mục đối tác (bảng riêng) |
| Material Catalog | `material_catalog` (`MaterialListTable.tsx`, `MaterialCategoryList.tsx`) | Danh mục vật tư gốc, gán mã chuẩn |
| BoqControl | `boq` (`BoqControl.tsx`) | Workspace BOQ + Material Matching |
| ProjectDetailTabs | `project_*` (`ProjectDetailTabs.tsx`, `ProjectAggregateTabs.tsx`, `ProjectTeams.tsx`) | Chi tiết dự án: nhiều tab + toolbar |
| Admin | `admin` | Quản trị: User/Role/Org/Menu/Form/Thông báo/Bulk import/Audit/Trust/Factory Reset |
| Account Settings | `account` | Đổi mật khẩu, avatar, hiển thị |

### 2.4 Màn thuộc khối tài chính – pháp chế (đã có tệp riêng)

| Nhóm | Tệp màn |
|---|---|
| Tài chính – Kế toán | `Payments.tsx`, `CashbankScreen.tsx`, `SiteCostScreen.tsx`, `DocumentsScreen.tsx` |
| Hành chính – Pháp chế | `HrScreen.tsx`, `LaborScreen.tsx`, `CorrespondenceScreen.tsx`, `LegalDocsScreen.tsx`, `SealScreen.tsx`, `BenefitsScreen.tsx`, `ContractReviewScreen.tsx` |
| MEP / Thi công | `ConstructionScreen.tsx`, `ReportView.tsx` |

> ⚠️ **Cần xác minh:** bản 23/09/2026 xếp 6 màn `dept_finance_*` và 6 màn `dept_legal_*` vào nhóm «ĐANG PHÁT TRIỂN (placeholder)». Đo mã cho thấy **đã có tệp màn riêng** cho các nhóm này, nhưng mức độ hoàn thiện nghiệp vụ **chưa được kiểm chứng trong tài liệu này** ⇒ xem §9.

---

## 3. BACKEND & DANH MỤC ACTION

### 3.1 Kiến trúc backend (đo được)

| Thành phần | Vị trí | Số đo |
|---|---|---|
| API Java (đang chạy, cổng `18081`) | `java-backend/web/.../controller/SystemController.java` | **1 781 dòng**, **261** nhãn `case "` |
| Bộ điều phối action cũ (Node monolith, cổng `9000`) | `scripts/system-route.mjs` | **3 409 dòng** |
| Danh mục action đã trích xuất | `java-backend/ACTION_CATALOG.json` | **182 action** (trường `count`) |
| Cổng RBAC tầng 1 | `java-backend/application/.../rbac/ActionRbacRegistry.java` | **598 dòng**, **431** mục `Map.entry(` |

> 🔎 **Cách đo:**
> - `Select-String -Path ".../SystemController.java" -Pattern 'case "' -AllMatches | Measure-Object` ⇒ **261**
> - `Select-String -Path ".../SystemController.java" -Pattern 'case "([a-zA-Z0-9_]+)"' … | Sort-Object -Unique | Measure-Object` ⇒ **261 tên khác nhau** (`update_user` xuất hiện 2 lần)
> - `Select-String -Path ".../ActionRbacRegistry.java" -Pattern 'Map\.entry\(' -AllMatches | Measure-Object` ⇒ **431**
> - `(Get-Content java-backend/ACTION_CATALOG.json -Raw | ConvertFrom-Json).count` ⇒ **182**

Chia nhỏ **431** mục `Map.entry(` trong `ActionRbacRegistry.java`:

| Khối | Dòng | Số mục `Map.entry(` | Ý nghĩa |
|---|---|---|---|
| `ACTION_MODULES` | 15–328 | **216** | action → danh sách khoá module được phép |
| `ACTION_CAPABILITIES` | 329–570 | **208** | action → capability yêu cầu |

> ⚠️ 216 + 208 = 424 < 431 ⇒ **7 mục còn lại** nằm ngoài 2 khối trên (dòng trống/ghi chú) — **cần xác minh** nếu cần con số tuyệt đối theo khối. Con số **tổng 431** là số đo trực tiếp, chắc chắn.

### 3.2 Phân bố action theo tiền tố (đo từ 261 tên khác nhau)

| Tiền tố | Số action | Tiền tố | Số action |
|---|---|---|---|
| `save_` | 53 | `bulk_` | 4 |
| `delete_` | 39 | `confirm_` | 4 |
| `set_` | 30 | `users` | 3 |
| `create_` | 12 | `receive_` | 3 |
| `approve_` | 9 | `request_` | 3 |
| `update_` | 9 | `transfer` / `stock` / `reset` / `factory` / `import` / `reorder` / `notification` / `preview` / `issue` / `work` / `revoke` / `supplier` / `material` / `mark` | 5/2/2/2/2/2/2/2/2/2/2/2/5/5 |

> 🔎 **Cách đo:** `$cases | Group-Object { ($_ -split '_')[0] } | Sort-Object Count -Descending`

### 3.3 ⭐ RBAC **BA TẦNG** (mô hình quyền thực tế)

Quyền của một action được kiểm qua **3 tầng độc lập, nối tiếp** — thiếu tầng nào cũng có thể bị **403**:

```
   Yêu cầu action
        │
        ▼
 ┌──────────────────────────────────────────────────────────────┐
 │ TẦNG ①  ActionRbacRegistry  —  CỔNG MODULE (thô)             │
 │  • Bản đồ action → khoá module  (ACTION_MODULES, 216 mục)     │
 │  • Bản đồ action → capability   (ACTION_CAPABILITIES, 208 mục)│
 │  • Nguồn sinh: ACTION_MODULE + ACTION_CAPABILITY của           │
 │    scripts/system-route.mjs                                   │
 │  • ⚠️ action ⛔ CHƯA khai ⇒ Rơi vào «MẶC ĐỊNH TỪ CHỐI» (403)  │
 └──────────────────────────────────────────────────────────────┘
        │  đạt
        ▼
 ┌──────────────────────────────────────────────────────────────┐
 │ TẦNG ②  SystemController —  CỔNG XÁC THỰC DANH TÍNH/ADMIN     │
 │  • requireRequireAdmin : 47 điểm gọi  (chỉ quản trị viên)     │
 │  • requireCurrentUser  : 184 điểm gọi (đã đăng nhập)          │
 └──────────────────────────────────────────────────────────────┘
        │  đạt
        ▼
 ┌──────────────────────────────────────────────────────────────┐
 │ TẦNG ③  USE-CASE — CỔNG VAI TRÒ NGHIỆP VỤ (luật thật)         │
 │  • rbac.requireRole(...) : 74 điểm gọi trong mã `src/main`    │
 │  • Ví dụ: approveStockIssue ⇒ requireRole(["commander","admin"])│
 └──────────────────────────────────────────────────────────────┘
        │
        ▼
     THỰC THI
```

> 🔎 **Cách đo từng tầng:**
> - Tầng ①: `Select-String -Path ".../ActionRbacRegistry.java" -Pattern 'Map\.entry\(' -AllMatches | Measure-Object` ⇒ 431
> - Tầng ②: `Select-String -Path ".../SystemController.java" -Pattern 'requireRequireAdmin' -AllMatches | Measure-Object` ⇒ **47**; `… -Pattern 'requireCurrentUser' …` ⇒ **184**
> - Tầng ③: `Select-String -Path ($javaFilesSrcMain) -Pattern 'rbac\.requireRole\(' -AllMatches | Measure-Object` ⇒ **74**

#### 3.3.1 Số khoá module **thực sự được dùng** ở tầng ①

Trích các khoá module trong `List.of(...)` của `ACTION_MODULES` ⇒ **38 khoá khác nhau**:

| Nhóm | Khoá module dùng trong RBAC |
|---|---|
| Quản trị | `admin`, `admin_tab_01`, `admin_tab_06` |
| Mua hàng & kho | `purchasing`, `requests`, `approvals`, `receiving`, `supplier_catalog`, `warehouse_issue`, `warehouse_receipt`, `inventory`, `stocktake`, `central_warehouse`, `material_catalog`, `material_norms` |
| Dự án / công việc | `site_command`, `boq`, `construction`, `production`, `teams`, `dept_plan_tasks`, `dept_plan_assign`, `dept_project_tasks`, `dept_project_assign` |
| Tài chính | `payments`, `capital_recovery`, `dept_finance_advance`, `dept_finance_cashbank`, `dept_finance_documents`, `dept_finance_payment_plan`, `dept_finance_site_cost` |
| Pháp chế | `dept_legal_benefits`, `dept_legal_contract_review`, `dept_legal_correspondence`, `dept_legal_documents`, `dept_legal_hr`, `dept_legal_labor`, `dept_legal_seal` |
| **Tổng** | **38** |

Capability dùng trong `ACTION_CAPABILITIES` (**208** mục): `canEdit` **74** · `canUse` **72** · `canCreate` **35** · `canApprove` **21** · `canView` **13**.

> 🔎 **Cách đo:** regex `Map\.entry\("[^"]+",\s*List\.of\(([^)]*)\)` rồi tách các chuỗi trong ngoặc ⇒ 38 khoá; regex `Map\.entry\("[^"]+",\s*"(\w+)"\)` ⇒ 5 capability.

#### 3.3.2 ⭐ Action **KHÔNG gác module** (`List.of()` rỗng) — mọi user đã đăng nhập đều gọi được

Đo được **64** mục `Map.entry("...", List.of())`. Đây là **chủ ý thiết kế**, ghi rõ trong ghi chú mã:

| Action | Lý do (nguyên văn ghi chú mã) |
|---|---|
| `mark_notification_read` · `mark_notification_snooze` · `mark_notification_all_read` | Mọi user phải đánh dấu đọc được thông báo **CỦA CHÍNH MÌNH** — nếu gác module thì user ⛔ không đọc được thông báo |
| `save_error_report` | Nút **báo lỗi** nằm cạnh nút đổi màu nền ⇒ ai cũng bấm được, kể cả chưa có quyền module nào |
| `change_password` · `bulk_import_projects` · `bulk_import_users` | Thao tác trên chính tài khoản / luồng nhập liệu nền |

> ⛔ **CẢNH BÁO THIẾT KẾ (bài học đo được — TASK-135):** action ⛔ **chưa khai module** sẽ rơi vào nhánh «mặc định từ chối» của `RbacService.requireActionModule` ⇒ **403 «Thao tác chưa được khai báo quyền…»** cho **MỌI** user ⛔ không phải admin/C-level, **dù họ có quyền nghiệp vụ**. Tiền lệ thật: `approve_po` từng khai **module RỖNG** ⇒ `nvkhdemo` gọi `approve_po` bị **403**, trong khi `create_po` của **cùng user** trả **200**. Đã vá bằng cách khai `List.of("purchasing")` — trùng module với `create_po` và `close_po_line`.

#### 3.3.3 Ví dụ đối chiếu 3 tầng (đo từ mã)

| Action | Tầng ① Module | Tầng ② | Tầng ③ Vai trò |
|---|---|---|---|
| `approve_po` | `purchasing` | `requireCurrentUser` | `rbac.requireRole(...)` trong use-case |
| `approve_stock_issue` | `approvals` (dùng lại khoá có sẵn) | `requireCurrentUser` | `requireRole(["commander","admin"])` — `StockManagementUseCase.approveStockIssue` |
| `issue_stock_confirm` | `warehouse_issue` | `requireCurrentUser` | use-case thủ kho |
| `confirm_stock_issue` | `warehouse_issue` | `requireCurrentUser` | use-case thủ kho |
| `create_issue_grn` | `receiving` | `requireCurrentUser` | use-case kho |
| `create_transfer_grn` | `receiving` | `requireCurrentUser` | use-case kho |
| `update_user` | `admin_tab_01` | `requireRequireAdmin` | use-case quản trị |
| `save_user_access` | `admin_tab_06` | `requireRequireAdmin` | use-case quản trị |
| `error_reports` · `mark_error_report_resolved` | `admin` | `requireRequireAdmin` | ⛔ chỉ quản trị viên (tab 14 nằm trong `ADMIN_LOCKED_TABS`) |

### 3.4 Action trọng yếu (Java)

| Action | Vai trò |
|---|---|
| `approve_po` / `reject_po` / `update_po_price` | Duyệt / từ chối / sửa giá PO |
| `issue_stock_confirm` | Xác nhận xuất kho (thủ kho) → phiếu chuyển trạng thái |
| `confirm_stock_issue` | Xác nhận hoàn tất phiếu xuất |
| `create_issue_grn` | Sinh phiếu nhập từ phiếu xuất |
| `create_transfer_order` / `approve_transfer_order` / `ship_transfer_order` / `receive_transfer_order` / `create_transfer_grn` | Chuỗi **chuyển kho** 5 bước |
| `delete_department_permission` / `rebuild_department_permissions` | Quản trị quyền phòng ban |
| `approve` / `reject` (theo bậc) | Phê duyệt động nhiều bậc |
| `retry_email` / `requeueEmail` | Phát lại email đang lỗi |
| `transfer_contract_ownership` / `reconcile_contract_stock` | Chuyển quyền sở hữu hợp đồng / đối chiếu tồn theo hợp đồng |
| `bulk_boq_item_action` / `bulk_material_subcategory_action` | Thao tác hàng loạt BOQ / nhóm vật tư |

---

## 4. LUỒNG NGHIỆP VỤ CHÍNH

### 4.1 Luồng Mua hàng — `WF-MUAHANG-01` (đo từ CSDL: **4 bước**, ⛔ không phải 5)

Bảng `workflow_definitions` có **5 quy trình**; riêng `WF-MUAHANG-01` có **4 bước** (`SELECT workflow_id, COUNT(*) FROM workflow_steps GROUP BY workflow_id`):

| Bước | Tên bước (đo từ `workflow_steps`) | SLA (giờ) | Chế độ |
|---|---|---|---|
| 1 | Thư ký Tổng giám đốc duyệt — duyệt đầu tiên sau CHT trước khi chuyển Phòng Dự án | 12 | `single` |
| 2 | Phòng Dự án kiểm tra khối lượng — nhân viên chuyên quản kiểm tra khối lượng/BOQ | 24 | `single` |
| 3 | Phòng Kế hoạch tiếp nhận — tiếp nhận và chuẩn bị mua hàng | 24 | `single` |
| 4 | Giám đốc phê duyệt — **bắt buộc** phải phê duyệt thì mới lập được PO | 12 | `single` |

Danh mục bậc duyệt nền (`approval_stage_catalog`) có **8 dòng**, gồm bậc CHT xác nhận nhu cầu và 3 bậc giao nhận:

| Mã bậc | Thứ tự | Tên | Vai trò cho phép | SLA |
|---|---|---|---|---|
| `ASTAGE-1` | 1 | CHT xác nhận nhu cầu | `commander`, `cht` | 12 |
| `ASTAGE-2` | 2 | Thư ký Tổng giám đốc | `thuky`, `thu_ky_tgd` | 12 |
| `ASTAGE-3` | 3 | Phòng Dự án | `project`, `da_nv` | 24 |
| `ASTAGE-4` | 4 | Phòng Kế hoạch | `procurement`, `kh_nv` | 24 |
| `ASTAGE-5` | 5 | Giám đốc | `director`, `tgd`, `giam_doc` | 12 |
| `ASTAGE-101` | 101 | Lập & phát hành PO | `procurement`, `kh_nv`, `kh_truong` | 24 |
| `ASTAGE-102` | 102 | Giao nhận (thủ kho xác nhận) | `warehouse`, `thu_kho` | 24 |
| `ASTAGE-103` | 103 | BCH xác nhận giao hàng | `commander`, `cht` | 24 |

Chuỗi chứng từ đầy đủ:

```
① Kỹ sư tạo MR (DNMH)  →  CHT xác nhận nhu cầu (ASTAGE-1)
② Bậc 1: Thư ký TGĐ      (ASTAGE-2)
③ Bậc 2: Phòng Dự án     (ASTAGE-3)  — kiểm BOQ/khối lượng/lũy kế/tồn
④ Bậc 3: Phòng Kế hoạch  (ASTAGE-4)  — ưu tiên tồn/điều chuyển trước khi mua
⑤ Bậc 4: Giám đốc        (ASTAGE-5)  — BẮT BUỘC mới lập được PO
⑥ Tạo PO                 (ASTAGE-101) → phát hành PO (WF-PO-01: 2 bước)
⑦ Nhận hàng              (ASTAGE-102) → BCH xác nhận giao hàng (ASTAGE-103)
```

### 4.2 Luồng Nhập kho — `WF-NHAPKHO-01` (2 bước)

| Bước | Tên bước | Yêu cầu quyền | SLA |
|---|---|---|---|
| 1 | Thủ kho kiểm hàng & xác nhận — kiểm soát số lượng/chất lượng hàng về | `canApprove` | 24 |
| 2 | Kế toán duyệt **ghi tăng tồn** — cho phép ghi TĂNG tồn kho (phương án A) | `canApprove` | 24 |

### 4.3 Luồng Xuất kho — `WF-XUATKHO-01` (2 bước duyệt)

| Bước | Tên bước | Yêu cầu quyền | SLA |
|---|---|---|---|
| 1 | Chỉ huy trưởng / BCH xác nhận — vật tư xuất đúng tổ đội, đúng khối lượng | `canApprove` | 24 |
| 2 | Kế toán xác nhận — đối chiếu giá trị vật tư xuất kho | `canApprove` | 24 |

Chuỗi thực thi (đo từ `StockManagementUseCase.java`):

```
① Lập phiếu xuất  →  ⭐ TẠO GIỮ CHỖ TỒN KHO theo `issue_id`  (store.createIssueReservations, L152)
② CHT/BCH duyệt   →  `approve_stock_issue`  (module `approvals` + requireRole(["commander","admin"]))
③ Thủ kho xác nhận → `issue_stock_confirm` / `confirm_stock_issue` (module `warehouse_issue`)
④ Sinh phiếu nhập  → `create_issue_grn` (module `receiving`)
⑤ Phiếu HOÀN THÀNH →  ⭐ NHẢ giữ chỗ  (store.releaseReservationsForIssue, L316)  →  cập nhật tồn kho nguồn + đích
```

> ⚠️ **Lỗ hổng đã đo và đã vá:** trước đây vòng lặp chỉ gọi `releaseReservationsForRequest` (nhả giữ chỗ của phiếu **ĐỀ NGHỊ**) ⇒ giữ chỗ của phiếu **XUẤT** ⛔ không bao giờ được nhả. Nay đã thêm `createIssueReservations` (đặt **SAU** `insertStockIssue`, ⛔ **ngoài** vòng lặp để tránh tạo **TRÙNG** reservation) và `releaseReservationsForIssue` khi phiếu hoàn thành.

### 4.4 Luồng chuyển kho — 5 action (đo từ `ActionRbacRegistry` + `system-route.mjs`)

| Bước | Action | Khoá module (tầng ①) |
|---|---|---|
| 1 | `create_transfer_order` | `inventory` |
| 2 | `approve_transfer_order` | `inventory` |
| 3 | `ship_transfer_order` | `inventory` |
| 4 | `receive_transfer_order` | `inventory` |
| 5 | `create_transfer_grn` | `receiving` |

Bảng dữ liệu: `transfer_orders` + `transfer_order_items` + cột `transfer_orders_uidx_transfer_no`.

### 4.5 Luồng công việc (Work)

| Hạng mục | Action | Khoá module |
|---|---|---|
| Tạo việc | `create_work_item` | `dept_plan_assign`, `dept_project_assign` |
| Đổi trạng thái | `update_work_item_status` | `dept_plan_tasks`, `dept_project_tasks`, `dept_plan_assign`, `dept_project_assign` |
| Cập nhật tiến độ | `update_work_item_progress` | `dept_plan_tasks`, `dept_project_tasks` |
| Giao lại việc | `reassign_work_item` | `dept_plan_assign`, `dept_project_assign` |
| Bình luận | `add_work_item_comment` | `dept_plan_tasks`, `dept_project_tasks`, `dept_plan_assign`, `dept_project_assign` |
| Người tham gia/theo dõi | `set_work_item_participant` | `dept_plan_assign`, `dept_project_assign` |
| Đọc thông báo việc | `mark_task_notification_read` | `dept_plan_tasks`, `dept_project_tasks` |

Luật nghiệp vụ (đo từ ghi chú mã): **cổng module ở tầng ① chỉ là lớp thô** — luật thật (người được giao · trưởng phòng · người tham gia) nằm ở hàm `requireWorkItemAccess`.

- Trưởng phòng trở lên: xem/giao việc **trong phòng ban mình**.
- Phó GĐ trở lên: xem/giao **toàn công ty**.
- Backend kiểm **user · chức vụ · phòng ban · phạm vi dự án** — ⛔ không hard-code ở frontend.
- Tab «Việc của tôi» lọc theo **đúng assignee**.

> 🔎 **Cách đo:** đọc `scripts/system-route.mjs` dòng 15–29 (`ACTION_MODULE`) và 30+ (`ACTION_CAPABILITY`); đối chiếu `ActionRbacRegistry.java`.

### 4.6 Trung tâm phê duyệt (Approval Center)

| Hạng mục | Trạng thái |
|---|---|
| Thẻ dashboard «Chờ Giám đốc duyệt» — dữ liệu thật | ✅ (chỉ admin / ≥ trưởng phòng) |
| Danh sách chờ duyệt → «phiếu đang xử lý» → nút **Chi tiết** (modal) | ✅ |
| Approval timeline dạng «Bước 1…» (⛔ không dùng cột dọc) | ✅ |
| **SLA quá hạn vẫn duyệt được — BẮT BUỘC nhập lý do** | ✅ (ràng buộc đo được qua `approval_overdue_reason` — migration `V25`) |

---

## 5. QUYỀN NGƯỜI DÙNG (RBAC)

### 5.1 Khái niệm

| Khái niệm | Mô tả | Bảng / mã nguồn |
|---|---|---|
| Vai trò (role) | `cht`, `kh_truong`, `da_truong`, `thuky`, `da_nv`, `kh_nv`, `thu_kho`, `accountant`, engine, phó GĐ… | `role_catalog` + `lib/ui-shared.tsx` (`roleNames`) |
| Module capability | `canView` / `canUse` / `canCreate` / `canEdit` / `canDelete` / `canApprove` | `module_catalog`, `user_module_permissions`, `department_module_permissions` |
| Phạm vi dữ liệu | Dự án (`user_project_scopes`), phòng ban, kho | `ctx.visibleProjectIds()` |
| Nhóm quyền nghiệp vụ | Nhóm bản ghi hạn chế kết hợp role ⇒ quyền theo tài nguyên | `business_role_group_catalog` (**11** dòng) + `business_role_group_scopes` |
| Audit | Lịch sử thay đổi mọi hành động, ghi **trước — sau** | `audit_logs` (**4 307** bản ghi) |

Số đo quyền (CSDL thật):

| Bảng | Số dòng |
|---|---|
| `module_catalog` | **76** |
| `user_module_permissions` | **2 772** |
| `department_module_permissions` | **481** |
| `business_role_group_catalog` | **11** |

> ⚠️ Bản 23/09/2026 ghi «user_module_permissions 484→926». Số **đo hôm nay là 2 772** ⇒ bản cũ đã lạc hậu.

### 5.2 ⭐ 14 BƯỚC QUẢN TRỊ — `admin_tab_01` … `admin_tab_14`

Đo từ `drizzle/0261_phase_gd_module_quan_tri_he_thong_tung_tab_identity.sql` (**14 dòng**, `group_key='QT'` = `system_admin`) và nhãn tiếng Việt trong `V33__moc114_module_catalog_labels.sql`:

| # | Khoá module | Nhãn (đo từ CSDL/migration) | Ý nghĩa nghiệp vụ |
|---|---|---|---|
| 01 | `admin_tab_01` | Quản trị hệ thống - Tab 01. **Tài khoản** | Tạo/sửa tài khoản, gán chức danh & vai trò hệ thống |
| 02 | `admin_tab_02` | Quản trị hệ thống - Tab 02. **Tổ chức** | Đơn vị/phòng ban/BCH |
| 03 | `admin_tab_03` | Quản trị hệ thống - Tab 03. **Chức danh / vai trò** | Danh mục `role_catalog` |
| 04 | `admin_tab_04` | Quản trị hệ thống - Tab 04. **Nhóm quyền nghiệp vụ** | Nhóm quyền theo tài nguyên |
| 05 | `admin_tab_05` | Quản trị hệ thống - Tab 05. **Phân quyền phòng ban** | Mẫu/giới hạn quyền theo phòng ban |
| 06 | `admin_tab_06` | Quản trị hệ thống - Tab 06. **Phân quyền người dùng** | Quyền module theo từng người |
| 07 | `admin_tab_07` | Quản trị hệ thống - Tab 07. **Cấp bậc hệ thống** | Thang bậc/level |
| 08 | `admin_tab_08` | Quản trị hệ thống - Tab 08. **Phạm vi dự án & kho** | `user_project_scopes`, phạm vi kho |
| 09 | `admin_tab_09` | Quản trị hệ thống - Tab 09. **Workflow phê duyệt** | `workflow_definitions` / `workflow_steps` |
| 10 | `admin_tab_10` | Quản trị hệ thống - Tab 10. **Ngoại lệ cá nhân** | Ghi đè quyền cho cá nhân |
| 11 | `admin_tab_11` | Quản trị hệ thống - Tab 11. **Audit log** | Xem lịch sử thay đổi |
| 12 | `admin_tab_12` | Quản trị hệ thống - Tab 12. **Cấu hình hệ thống** | Tham số hệ thống |
| 13 | `admin_tab_13` | Quản trị hệ thống - Tab 13. **Thông báo** | Cấu hình thông báo Web/Email |
| 14 | `admin_tab_14` | Quản trị hệ thống - Tab 14. **Báo lỗi** | Người dùng gửi báo lỗi; quản trị viên xử lý |

Cổng quyền đã đo được cho tab:

| Tab | Action gác | Khoá module (tầng ①) | Ghi chú |
|---|---|---|---|
| 01 | `update_user` | `admin_tab_01` | `ActionRbacRegistry.java:324` |
| 06 | `save_user_access` | `admin_tab_06` | `ActionRbacRegistry.java:277` |
| 14 | `save_error_report` | `List.of()` — **⛔ KHÔNG gác** | Mọi user đã đăng nhập đều gửi được |
| 14 | `error_reports`, `mark_error_report_resolved` | `admin` | ⛔ **CHỈ** quản trị viên (tab 14 nằm trong `ADMIN_LOCKED_TABS`) |

Ở frontend, quyền theo tab được kiểm bằng `hasAdminTab(data, "admin_tab_XX")` và `ADMIN_LOCKED_TABS` (`app/screens/admin-governance-pure.ts`).

> ⚠️ **Lưu ý đo được:** `ActionRbacRegistry` chỉ khai **2** khoá `admin_tab_*` (`admin_tab_01`, `admin_tab_06`). **12 tab còn lại** ⛔ không xuất hiện trực tiếp trong registry ⇒ cổng quyền của chúng đi qua tầng ② / tầng ③ hoặc qua `module_catalog`. **Cần xác minh** nếu muốn bảng ánh xạ tab → action đầy đủ.

### 5.3 ⭐ NGUYÊN TẮC **U-1** — «Người được uỷ nhiệm quyền thì nhận dữ liệu **LỌC THEO PHẠM VI**»

> **Nguồn:** USER CHỐT **08/10/2026** (`BUG-20261008-013`), thi hành trong commit **`3cfbd75`**.
> **Vị trí mã:** `java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/BootstrapDataAdapter.java` dòng **1928–1934**.

**Nội dung nguyên tắc:**

| Đối tượng | Điều kiện | Dữ liệu được nhận |
|---|---|---|
| **Uỷ nhiệm quản trị** (non-admin) | CÓ khoá `admin` hoặc `admin_tab_*` với `can_view = 1` **còn hạn** | `users` · `adminProjects` · `userScopes` — ⭐ **LỌC THEO `ctx.visibleProjectIds()`** (chính mình ∪ người cùng dự án trong phạm vi) |
| **Quản trị viên thật** (`role = admin`) | — | Toàn bộ dữ liệu |
| ⛔ **VẪN admin-only** (U-1 ⛔ KHÔNG áp) | — | `allModulePermissions` · `emailOutbox` · `emailRecipients` |

**Trước U-1:** người được uỷ nhiệm quyền quản trị bị **CHẶN Ở TẦNG DỮ LIỆU** — tức là họ có quyền ở tầng module nhưng ⛔ không nhận được dữ liệu để thao tác.
**Sau U-1:** họ **nhận được** dữ liệu, nhưng ⭐ **chỉ trong phạm vi dự án của chính họ** — ⛔ không toàn bộ.

⚠️ **Phạm vi U-1 CÒN LẠI chưa áp** (ghi nhận từ mã, **cần xác minh** nếu muốn hoàn tất):
`userWarehouseScopes` · `engineRoleProfiles` · `adminSuppliers` / `adminPartners`.

### 5.4 Cơ chế an ninh tầng dữ liệu phải tôn trọng

> 📌 **BÀI HỌC KIẾN TRÚC (đo được, ⛔ không được phá):** `BootstrapDataAdapter.java` có **2 cơ chế an ninh**:
> ① `blank(data, ...keys)` là **GHI ĐÈ VÔ ĐIỀU KIỆN — CƠ CHẾ AN NINH** (xoá-trắng theo cấp bậc/quyền — ví dụ `approvalOverdue` cho user cấp thấp; test `RequestOverdueReasonTest` MT2-P4-02 khoá chặt). ⛔ **TUYỆT ĐỐI không đổi ngữ nghĩa** (từng thử «chỉ điền khi thiếu» ⇒ làm **ĐỎ** test an ninh). Muốn dữ liệu mới sống sót thì **NẠP SAU lệnh `blank(...)`**.
> ② Nhiều trường ⛔ **chỉ gửi khi `admin === true`**: `users`, `adminProjects`, `userScopes`, `teamMembers`, `projectAccessAll`, `adminPartners`, `allModulePermissions`, `userWarehouseScopes`, `emailRecipients`, `emailOutbox`, `workflowAssignments`.

---

## 6. CHỨC NĂNG QUẢN TRỊ (ADMIN)

| # | Nhóm chức năng | Mô tả |
|---|---|---|
| 1 | **Tài khoản / Actor** | Tách khái niệm *user tài khoản* và *actor người dùng* (AD-13); màn «Nhân sự» đổi tên «Tài khoản»; 13 cột; sắp xếp Trạng thái→Mã; lọc phòng ban; 2 sub-tab tổ chức; đặt Position / System Role |
| 2 | **Đổi tên / email** | ⛔ Chỉ Admin sửa `full_name` / `email`; user tự sửa avatar + mật khẩu (AD-16) |
| 3 | **Phân quyền phòng ban** | Theo **MẪU / GIỚI HẠN**, ⛔ không phải đường kiểm quyền (AD-07, khớp A-15). Đo: `department_module_permissions` = **481** dòng |
| 4 | **Menu & form động** | Cấu hình ẩn/hiện/required field; cấu hình menu **cây** (kéo–thả, ⛔ không lồng nhau); nhóm rỗng hoặc ⛔ không có quyền thì **tự ẩn**; thêm/sửa/ẩn/xoá nhóm tuỳ chỉnh |
| 5 | **Thông báo** | Tab Thông báo CRUD; tạo thông báo Web/Email; người nhận: 1 user / nhiều user / phòng ban / dự án / toàn bộ; web notification **read-once** |
| 6 | **Bulk import** | User Excel 12 cột, project Excel 9 cột, **preflight nguyên tử** |
| 7 | **Audit** | Xem lịch sử thay đổi mọi hành động; audit theo 2 phạm vi; ghi **trước — sau**. Đo: `audit_logs` = **4 307** bản ghi |
| 8 | **Trust Lock & Factory Reset** | `factory_reset_preview` / `factory_reset_execute` (khoá module `admin`); `vntech_trust_audit` |
| 9 | **Báo lỗi (tab 14)** | `save_error_report` ⛔ không gác module ⇒ **mọi user gửi được**; `error_reports` + `mark_error_report_resolved` gác `admin` ⇒ **chỉ quản trị viên** xem danh sách và tick «đã xử lý» |

---

## 7. TÍNH NĂNG ĐẶC THÙ

### 7.1 ⭐ Giữ chỗ tồn kho cho PHIẾU XUẤT khi phiếu đang xử lý

> **Nguồn:** USER CHỐT **08/10/2026** (`DEC-20261008-013`) — nguyên văn:
> «khi phiếu ở trạng thái **HOÀN THÀNH** thì mới được thay đổi tồn kho trong kho đích và nguồn. Trong thời gian **TẠO PHIẾU** hoặc **CHỜ DUYỆT** thì số lượng vật tư trong phiếu đó ở trong trạng thái **ĐANG XỬ LÝ** (không cho user khác thao tác vào những mã vật tư đó), ví dụ như dây điện cadivi 1.5 tồn 100 - phiếu xuất 70 (đang xử lý) thì những user khác không được thao tác xuất quá số lượng đang trạng thái bình thường»

| Hạng mục | Đo được |
|---|---|
| Migration | `V39__session02_stock_reservation_issue_id.sql` — thêm cột `issue_id VARCHAR(64) NULL` + index `stock_reservations_issue_idx` |
| Bảng | `stock_reservations` (đo: **0 dòng** tại thời điểm này) |
| Hàm tạo giữ chỗ | `WarehouseStockStore.createIssueReservations(issueId, now)` — mỗi dòng `stock_issue_items` của phiếu ⇒ 1 dòng `stock_reservations` |
| Hàm nhả giữ chỗ | `WarehouseStockStore.releaseReservationsForIssue(issueId, now)` — gọi tại `StockManagementUseCase.java:316` khi phiếu hoàn thành |
| Điểm gọi tạo | `StockManagementUseCase.java:152` — đặt **SAU** `insertStockIssue`, ⛔ **ngoài** vòng lặp (tránh tạo **TRÙNG** reservation) |
| Công thức tồn khả dụng | `available = physical − SUM(reserved WHERE status='active')` — ⛔ **không** phân biệt nguồn giữ chỗ |
| An toàn | Cột **NULLABLE** ⇒ ⛔ không phá dữ liệu cũ, ⛔ không cần backfill; ⛔ không đổi khoá chính, ⛔ không đổi cột cũ |

⛔ **Vì sao KHÔNG tái dùng `request_id`:** phiếu xuất ⛔ có thể **không** sinh từ đề nghị; nếu nhồi `issue_id` vào `request_id` thì ⛔ **không phân biệt được nguồn giữ chỗ** ⇒ khi **RELEASE** sẽ nhả nhầm reservation của phiếu đề nghị khác ⇒ **SAI TỒN KHO**. Vì vậy phải thêm **cột riêng `issue_id`**.

Kiểm tra toàn vẹn dự án: chỉ số `OPEN_RESERVATION` — «Vẫn còn giữ chỗ tồn kho cho nhu cầu chưa kết thúc» (`ProjectManagementUseCase.java:125`, đếm `stock_reservations WHERE status='active' AND quantity > 0.000001`).

### 7.2 Thẻ kho / Tồn kho (in báo cáo)

| Hạng mục | Đo được |
|---|---|
| Hàm in | `printInventoryLedger(rows)` trong `lib/ui-shared.tsx:362` |
| Tiêu đề báo cáo | **«THẺ KHO / TỒN KHO»** |
| Cột in | Mã vật tư · Tên vật tư · ĐVT · Kho · Vị trí · Dự án · **Nhập** · **Xuất** · **Tồn cuối** · **Tồn tối thiểu** |

### 7.3 Chuyển kho (Điều chuyển)

| Hạng mục | Đo được |
|---|---|
| Màn | `app/screens/Inventory.tsx` — nút `data-vntech="inv-transfer-btn"` mở hộp thoại **3 tab: ĐIỀU CHUYỂN / NHẬP KHO / XUẤT KHO** + nút TẠO PHIẾU ĐIỀU CHUYỂN |
| Action | `create_transfer_order` → `approve_transfer_order` → `ship_transfer_order` → `receive_transfer_order` → `create_transfer_grn` |
| Khoá module | `inventory` (4 action đầu) · `receiving` (`create_transfer_grn`) |
| Bảng | `transfer_orders`, `transfer_order_items` |

### 7.4 ⭐ In mã Barcode (Code 39) cho vật tư

| Hạng mục | Đo được |
|---|---|
| Bảng mã | `CODE39` — bảng mã hoá Code 39 đầy đủ (`lib/ui-shared.tsx:206`) |
| Hàm sinh SVG | `code39Svg(value)` — thêm ký tự chặn `*`, ⛔ lọc ký tự ngoài `[0-9A-Z. \-]` thành `-`, đơn vị `unit = 2` (`lib/ui-shared.tsx:364`) |
| Hàm in | `printInventoryBarcodes(rows)` — **tối đa 80 tem**/lần (`rows.filter(row => row.materialCode).slice(0, 80)`), mở cửa sổ in `1000×800` (`lib/ui-shared.tsx:360`) |
| Nút trên UI | **«▥ In mã Barcode»** — `app/screens/Inventory.tsx:519`, in theo danh sách **đã lọc** |
| Khối nhập liệu | Hộp thoại tạo phiếu có khối **MÃ VẠCH/QR** + nút **IN TEM MÃ** (`Inventory.tsx:88`) |

### 7.5 Các tính năng đặc thù khác

| Tính năng | Mô tả | Trạng thái |
|---|---|---|
| Xuất CSV/XLSX | Hầu hết màn danh sách có nút xuất (`exportInventoryXlsx`, `export-mini`) | ✅ |
| Export BOQ Excel/CSV | Định dạng chuẩn ⛔ không lộ GUID (TASK-122) | ✅ |
| Chế độ sáng/tối | Nút ☀/☾, nhớ **theo tài khoản** | ✅ |
| Tìm kiếm toàn hệ thống | Tìm dự án / vật tư / số phiếu / đơn vị | ✅ |
| Responsive | Nhiều kích thước màn hình; menu điện thoại ☰ | ✅ |
| Material Matching | Tự đề xuất vật tư / kiểm tra NCC khi lập PO («Vật tư này chưa có trong NCC…») | ✅ (`compare_boq_materials`, `confirm_boq_material_mappings`) |
| Modal chuẩn | ⛔ không vượt viewport; lỗi API nổi trên modal bằng `.toast` + `role="alert"` (BUG-202010-002) | ✅ |
| Màn chi tiết kho | **5 tab** thay cho modal: Dashboard kho · Tồn kho · Xuất–Nhập · Cấp phát–Hoàn trả · Nhân sự (yêu cầu user 06/10/2026) | ✅ |
| Toolbar 5 tab kho | Tìm / sắp xếp / lọc mức tồn / lọc trạng thái + nút tạo phiếu (TASK-230, 07/10/2026) | ✅ |

---

## 8. DỮ LIỆU MẪU BÀN GIAO (ĐO TỪ CSDL)

### 8.1 Dự án mẫu & quy mô dữ liệu

| Đại lượng | Giá trị đo |
|---|---|
| Dự án | **5** (`PRJ-DEMO-01`, `DA-MAU-01`, `E2E-DA-01`, `E2E-DIAG-01`, `DA06`) |
| Dự án mẫu chuẩn | `PRJ-DEMO-01` — «Dự án mẫu chuẩn hóa quy trình VNTECH», `status = active` |
| Vật tư | **237** |
| Kho | **12** |
| Nhà cung cấp | **7** |
| Người dùng | **73** |

### 8.2 Chuỗi chứng từ đã thông qua đầy đủ (đo trực tiếp từng phiếu)

| Loại | Số chứng từ | Trạng thái **đo được** |
|---|---|---|
| Đề nghị mua hàng (DNMH) | `DNMH-PRJ-DEMO-01-2026-0008` | `approved` ✅ |
| Đơn mua hàng (PO) | `PO-PRJ-DEMO-01-2026-0005` | `completed` ✅ |
| Phiếu nhập kho (GRN) | `GRN-PRJ-DEMO-01-2026-0005` | `document_status = complete` · `posting_status = posted` · `bch_confirmation_status = confirmed` ✅ |
| Phiếu xuất kho (PX) | `PX-PRJ-DEMO-01-2026-0007` | `posted` ✅ |
| Phiếu hoàn trả (RET) | `RET-PRJ-DEMO-01-2026-0008` | `received` ✅ |

> ⚠️ **Điều chỉnh so với bản 23/09/2026:** bản cũ ghi GRN ở trạng thái `confirmed`. **Đo hôm nay** cho thấy `document_status = complete` và `posting_status = posted`; `confirmed` là giá trị của cột **xác nhận BCH** (`bch_confirmation_status`). Tài liệu này ghi theo **giá trị đo được**.

### 8.3 Khối lượng chứng từ theo dự án (đo từ CSDL)

| Chứng từ | Tổng toàn hệ thống | Riêng `PRJ-DEMO-01` |
|---|---|---|
| Đề nghị mua (MR) | **91** | **71** |
| Đơn mua (PO) | **31** | **28** |
| Phiếu nhập (GRN) | **36** | **32** |
| Phiếu xuất (PX) | **33** | **21** |
| Phiếu hoàn trả (RET) | **10** | **1** (`RET-PRJ-DEMO-01-2026-0008`) |
| Công việc (`work_items`) | **27** | — |

### 8.4 Cấu trúc dữ liệu mẫu (theo `docs/16_HUONG_DAN_SEED_DEMO_VA_TAI_KHOAN_MO_RA.md`)

- **6 đơn vị**: VNTECH (company), BCH (site_command), DA (`DA-01`, department), KH, TCKT, + `VNTECH-01` (cũ, ⛔ không dùng).
- Dự án **PRJ-DEMO-01** `active` + kho site **KHO-PRJ-DEMO-01**, hợp đồng **HD-PRJ-DEMO-01**.
- Tổ đội **TD-01** (kho tổ đội riêng), nhà cung cấp **NCC-VTMN**.
- **8 vật tư** thêm ngoài catalog gốc: `VL-THEP, VL-XIMANG, VL-SAT02, VL-GACH, VL-CAPDIEN, VL-ONGPVC, VL-GACHMEN, VL-SON` + **8 dòng BOQ** (BOQ V1).
- **Nhân sự**: 4 hồ sơ nhân sự, 2 hợp đồng lao động, 1 BHXH.
- **Tài chính**: tài khoản NH `VNTECH-BIDV`, 2 bút toán sổ quỹ (thu 2 tỷ / chi 150tr), 2 dòng thanh toán HĐ (`TT-HD-PRJ-DEMO-01-01/02`), 3 mốc kế hoạch giải ngân (`PPL-PRJ-DEMO-01-0001..0003`).
- **Nhật ký thi công**: `CDL-PRJ-DEMO-01-2026-0001` (**approved**).
- **Pháp chế**: công văn đến `CV-2026-001`.
- Seed **idempotent** — chạy lại ⛔ không nhân đôi.

> 🔗 Chi tiết + danh sách tài khoản mở ra: `docs/16_HUONG_DAN_SEED_DEMO_VA_TAI_KHOAN_MO_RA.md`.
> Lệnh seed: `node "java-backend/tools/seed-demo.mjs" "http://127.0.0.1:9000"`

---

## 9. MỤC CẦN XÁC MINH

Các mục sau ⛔ **chưa kiểm chứng được** trong phạm vi đo của tài liệu này — ghi rõ để ⛔ không suy đoán:

| # | Mục | Lý do |
|---|---|---|
| 1 | Ánh xạ đầy đủ **14 tab quản trị → action** | `ActionRbacRegistry` chỉ khai 2 khoá `admin_tab_*`; 12 tab còn lại đi qua tầng ②/③ |
| 2 | **7 mục `Map.entry(`** nằm ngoài 2 khối `ACTION_MODULES` / `ACTION_CAPABILITIES` | 216 + 208 = 424 < 431 (tổng đo trực tiếp) |
| 3 | Mức độ hoàn thiện nghiệp vụ của 6 màn tài chính + 6 màn pháp chế | Đã có tệp màn, chưa đo độ phủ chức năng |
| 4 | Phạm vi U-1 **còn lại** (`userWarehouseScopes`, `engineRoleProfiles`, `adminSuppliers`/`adminPartners`) | Ghi nhận từ mã, chưa áp dụng |
| 5 | Số action của **monolith JS** theo cách đếm `case "` | `scripts/system-route.mjs` ⛔ không dùng `switch/case` ⇒ chỉ đo được qua `ACTION_CATALOG.json` = **182** |
| 6 | Danh sách tài khoản demo & mật khẩu | ⛔ **Không ghi vào tài liệu này** (quy tắc bảo mật) — xem `docs/16_...` |

---

## PHỤ LỤC A — BẢNG LỆNH ĐO (chạy lại được)

```powershell
# ── ① Số màn
Get-ChildItem app/screens -File | Measure-Object | Select-Object -ExpandProperty Count      # ⇒ 55

# ── ② Số action backend (Java)
Select-String -Path "java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java" `
  -Pattern 'case "' -AllMatches | Measure-Object                                             # ⇒ 261
#    (tên khác nhau)
Select-String -Path "java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java" `
  -Pattern 'case "([a-zA-Z0-9_]+)"' -AllMatches |
  ForEach-Object { $_.Matches } | ForEach-Object { $_.Groups[1].Value } |
  Sort-Object -Unique | Measure-Object                                                       # ⇒ 261

# ── ③ Số action có khai module trong RBAC
Select-String -Path "java-backend/application/src/main/java/com/vntech/erp/application/rbac/ActionRbacRegistry.java" `
  -Pattern 'Map\.entry\(' -AllMatches | Measure-Object                                       # ⇒ 431

# ── ④ Số bảng / migration
Get-ChildItem "java-backend/infrastructure/src/main/resources/db/migration/*.sql" -File |
  Measure-Object | Select-Object -ExpandProperty Count                                       # ⇒ 38

# ── ⑤ RBAC tầng ②
Select-String -Path "java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java" `
  -Pattern 'requireRequireAdmin' -AllMatches | Measure-Object                                # ⇒ 47
Select-String -Path "java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java" `
  -Pattern 'requireCurrentUser' -AllMatches | Measure-Object                                 # ⇒ 184

# ── ⑥ RBAC tầng ③
$files = Get-ChildItem java-backend -Recurse -Include *.java -File |
  Where-Object { $_.FullName -match '\\src\\main\\' -and $_.FullName -notmatch '\\target\\' }
Select-String -Path ($files | Select-Object -ExpandProperty FullName) `
  -Pattern 'rbac\.requireRole\(' -AllMatches | Measure-Object                                # ⇒ 74

# ── ⑦ Kiểm tra dịch vụ
Invoke-WebRequest http://127.0.0.1:18081/actuator/health -UseBasicParsing   # ⇒ {"status":"UP",...}
Test-NetConnection 127.0.0.1 -Port 8787    # UI
Test-NetConnection 127.0.0.1 -Port 3306    # MySQL
```

```sql
-- ── ⑧ Số liệu CSDL (schema vntech_erp)
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='vntech_erp';   -- 134 bảng
SELECT COUNT(*) FROM flyway_schema_history WHERE success=1;                        -- 38 migration
SELECT COUNT(*), SUM(active=1) FROM menu_group_catalog;                            -- 12 / 12
SELECT COUNT(*) FROM module_catalog;                                               -- 76
SELECT COUNT(*) FROM users;                                                        -- 73
SELECT COUNT(*) FROM user_module_permissions;                                      -- 2772
SELECT COUNT(*) FROM department_module_permissions;                                -- 481
SELECT COUNT(*) FROM business_role_group_catalog;                                  -- 11
SELECT COUNT(*) FROM audit_logs;                                                   -- 4307
SELECT workflow_id, COUNT(*) FROM workflow_steps GROUP BY workflow_id;             -- WF-MUAHANG: 4 bước
SELECT COUNT(*) FROM approval_stage_catalog;                                       -- 8 bậc
```

---

*Tài liệu thuộc bộ tài liệu bàn giao hệ thống VNTECH ERP V5.3.0 — phiên bản `DOC-ALPHA-TEST-2026.10`, cập nhật 08/10/2026. Mọi số liệu đều đo được từ mã nguồn (commit `3cfbd75`) và CSDL `vntech_erp`; các mục ⛔ chưa kiểm chứng được liệt kê ở §9.*
