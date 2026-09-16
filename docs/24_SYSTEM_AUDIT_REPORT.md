# 24 — SYSTEM AUDIT REPORT · VNTECH ERP V5.3.0

- **Ngày audit:** 16/09/2026
- **Baseline git:** nhánh `unity` · HEAD `1c01f39` · remote `origin/unity` **khớp** · cây làm việc **sạch**
- **Phương pháp:** đọc mã nguồn + truy vấn DB thật + **kiểm chứng thực nghiệm bằng HTTP lên hệ thống đang chạy**
- **Nguyên tắc áp dụng:** chỉ kết luận khi có bằng chứng; chỗ không đủ dữ liệu ghi rõ **UNKNOWN**

> ⚠️ **Báo cáo này KHÔNG sửa gì.** Mọi thay đổi chỉ bắt đầu sau khi audit xong và có TODO/ROADMAP.

---

## 1. Tech Stack

| Tầng | Công nghệ | Phiên bản |
|---|---|---|
| UI | Next.js (vinext) + React + TypeScript | Next 16.2.6 · React 19.2.6 · TS 5.9.3 |
| Build UI | Vite + Tailwind + PostCSS | Vite 8.0.13 · Tailwind 4.2.1 |
| Backend | Java Spring Boot, Maven đa module | Spring Boot 3.5.0 · Java 21 target (chạy JDK 26) |
| DB | MySQL + Flyway | MySQL 8.0.46 · Flyway 16 migration |
| Định danh | drizzle (metadata identity) | 102 file `drizzle/*.sql` |
| Runtime phụ | wrangler, pg, redis, fflate, tsx | Có khai báo trong `package.json` |

**Kiến trúc UI đặc biệt:** UI là **SSR** (`dist/server/index.js`), trong `dist/client` **không có `index.html`**
⇒ Java **không thể** tự phục vụ giao diện. Vì vậy hệ thống đang chạy bằng **proxy cắt chuyển**
(`tools/cutover-proxy.mjs`, cổng 9000): `/api/*` → Java (18081), còn lại → Node SSR (8787).

---

## 2. Architecture

### Backend — Clean Architecture, 7 module Maven

```
java-backend/
  domain/          thực thể + quy tắc nghiệp vụ thuần
  application/     22 use case + 2 lớp RBAC (ActionRbacRegistry, RbacService)
  infrastructure/  adapter JPA/JDBC + Flyway migration
  web/             SystemController (bộ điều phối action) + filter
  contract-tests/  test hợp đồng
  data/  tools/    dữ liệu và công cụ
```

**Entry point backend:** `web/.../SystemController.java` — **1.437 dòng, 224 nhánh `case`**.
Mọi thao tác của UI đi qua **một** endpoint `POST /api/system` với trường `action`.

### Frontend — SPA một tệp

```
app/
  page.tsx          4.057 dòng · 218 hàm cấp cao  ← TOÀN BỘ giao diện nằm ở đây
  layout.tsx        nạp 4 tầng CSS theo thứ tự
  globals.css       2.724 dòng · 4.950 khai báo ưu tiên cao · 1.183 khối selector TRÙNG
  styles/
    tokens.css      200 dòng — hệ token thiết kế (GĐ1)
    canonical.css   747 dòng — tầng chuẩn hoá
    font-floor.css  264 dòng — FILE SINH TỰ ĐỘNG, nâng sàn 120 selector lên 10px
  api/system/route.ts   endpoint duy nhất cho mọi action
  api/files/route.ts    tải/tệp đính kèm
```

**Không có routing theo URL.** Điều hướng là trạng thái React; mọi màn hình nằm trong một tệp.

---

## 3. Database

**121 bảng**, phân nhóm:

| Nhóm | Số bảng |
|---|---:|
| Dự án & Vật tư | 43 |
| Mua hàng & Kho | 16 |
| Hệ thống | 14 |
| Người dùng & Phân quyền | 12 |
| Workflow & Phê duyệt | 9 |
| Tài chính & Nhân sự | 8 |
| Thi công & Sản lượng | 3 |
| Khác | 19 |

**Migration:** Flyway `V1` → `V16` (16 file) là nguồn sự thật của schema;
`drizzle/*.sql` (102 file) chỉ ghi **dấu định danh nguồn**, không tạo bảng.

**Hai nguồn migration song song** — cần lưu ý khi thêm bảng: bảng mới PHẢI khai trong Flyway,
và **PHẢI ghi rõ `COLLATE=utf8mb4_unicode_ci`** (xem §13).

---

## 4. API

| | |
|---|---:|
| Endpoint HTTP | **2** (`/api/system`, `/api/files`) |
| Nhánh `case` trong SystemController | **224** |
| Action trong `ACTION_CATALOG.json` | **174** |
| Action **KHÔNG có module** trong catalog | **64** |

### ⚠️ Lệch 50 action
`SystemController` dispatch **224** action nhưng catalog (sinh từ monolith JS cũ) chỉ liệt kê **174**.
⇒ **Catalog đã lệch thực tế 50 action** (≈22%). Bảng đối chiếu parity dựa trên catalog này
**không còn đáng tin** để kết luận "đã port đủ".

---

## 5. Authentication

- Đăng nhập qua `action: "login"`, phiên giữ bằng **cookie `mep_session`**.
- Mật khẩu băm **PBKDF2-SHA256 600.000 vòng**, salt riêng từng tài khoản.
- Có `must_change_password`, `password_reset_at/by`, `revoke_user_sessions`.
- **Khoá đăng nhập:** 10 lần sai / 15 phút theo (IP + username); chỉ xoá được bằng khởi động lại Java.
- **Chưa xác minh:** thời hạn phiên, cơ chế gia hạn, thu hồi khi đổi quyền → **UNKNOWN**.

---

## 6. Authorization / Permission

### Mô hình hiện tại — 3 tầng

```
TAI KHOAN ──(role)──> role_catalog (16 vai trò)
        │
        ├──(organization_unit_id)──> department_module_permissions (37 dòng)
        │                                   │  suy ra
        │                                   ▼
        ├─────────────────────────> user_module_permissions (278 dòng)
        │                              permission_source = department_default | manual_override
        │
        └──(system_level_code)──> system_level_catalog (5 bậc, có auto_grant_all)
```

### Luật đã kiểm chứng trong mã nguồn

```java
// RbacService
isAdmin(user)              → role == "admin"                          → cho qua tất cả
isCompanyLeadership(user)  → role ∈ {"director","accountant"}         → cho qua mọi module TRỪ "admin"
còn lại                    → cần user_module_permissions.can_<quyền>=1
```

**Luật P5.3** (`UserManagementUseCase`): *không được cấp cho người dùng quyền mà PHÒNG BAN chưa có* —
chốt này chỉ hoạt động khi phòng ban **đã** được cấu hình ít nhất một quyền.

### 🚨 PHÁT HIỆN NGHIÊM TRỌNG NHẤT — tầng RBAC action KHÔNG ĐƯỢC THỰC THI

`RbacService.requireActionModule()` **được định nghĩa nhưng KHÔNG BAO GIỜ ĐƯỢC GỌI**.
`ActionRbacRegistry` (174 action × module × quyền) chỉ được dùng trong `AuditTrailFilter`
để **ghi log** (`permissionUsed`), **không phải để chặn**.

Nói cách khác: **toàn bộ bảng khai báo module + quyền cho 174 action là mã chết về mặt bảo vệ.**

Thứ duy nhất còn chặn được là `rbac.requireRole(...)` — và **chỉ 8/20 use case có gọi**:

| Use case | `requireRole` | Use case | `requireRole` |
|---|---:|---|---:|
| AdminSystemUseCase | 18 | RequestManagementUseCase | 1 |
| UserManagementUseCase | 17 | **AuthUseCase** | **0** |
| SystemSettingsUseCase | 9 | **BoqManagementUseCase** | **0** |
| StockManagementUseCase | 6 | **FinanceManagementUseCase** | **0** |
| ProductionManagementUseCase | 5 | **HrManagementUseCase** | **0** |
| ProjectManagementUseCase | 4 | **MaterialCatalogManagementUseCase** | **0** |
| PurchaseManagementUseCase | 4 | **OpsTaskManagementUseCase** | **0** |
| AdminOpsManagementUseCase | 1 | **ProjectContractUseCase** | **0** |
| | | **SupplierManagementUseCase** | **0** |
| | | **FileUseCase** · **BootstrapUseCase** · **ListActiveProjectsUseCase** | **0** |

### 🧪 KIỂM CHỨNG THỰC NGHIỆM — đã chạy, có kết quả

`tools/probe-security-rbac.mjs`: tạo tài khoản **ít quyền nhất** (vai trò `ksda`,
**0 dòng quyền module**), rồi gọi từng action.

| HTTP | Phân loại | Action | Use case |
|---:|---|---|---|
| 400 | **LỌT QUA** ❌ | `save_supplier` | SupplierManagement |
| 400 | **LỌT QUA** ❌ | `set_supplier_status` | SupplierManagement |
| 400 | **LỌT QUA** ❌ | `save_material` | MaterialCatalogManagement |
| 400 | **LỌT QUA** ❌ | `save_material_category` | MaterialCatalogManagement |
| 400 | **LỌT QUA** ❌ | `save_material_subcategory` | MaterialCatalogManagement |
| 400 | **LỌT QUA** ❌ | `save_boq_item` | BoqManagement |
| 400 | **LỌT QUA** ❌ | `save_boq_version` | BoqManagement |
| 400 | **LỌT QUA** ❌ | `create_dept_task` | OpsTaskManagement |
| **200** | **LỌT + ĐÃ GHI** ❌❌ | `create_self_work_item` | OpsTaskManagement |
| 400 | **LỌT QUA** ❌ | `update_work_item_status` | OpsTaskManagement |
| 400 | **LỌT QUA** ❌ | `save_project_contract` | ProjectContract |
| 400 | **LỌT QUA** ❌ | `save_payment_plan` | FinanceManagement |
| 400 | **LỌT QUA** ❌ | `save_cashbook_entry` | FinanceManagement |
| 400 | **LỌT QUA** ❌ | `save_hr_record` | HrManagement |
| 400 | **LỌT QUA** ❌ | `save_labor_contract` | HrManagement |
| 403 | ĐƯỢC BẢO VỆ ✅ | `create_user` | UserManagement (đối chứng) |
| 403 | ĐƯỢC BẢO VỆ ✅ | `save_user_access` | UserManagement (đối chứng) |
| 403 | ĐƯỢC BẢO VỆ ✅ | `create_project` | ProjectManagement (đối chứng) |
| 403 | ĐƯỢC BẢO VỆ ✅ | `create_po` | PurchaseManagement (đối chứng) |
| 400 | *không phải lỗi* | `create_request` | Đối chứng — tài khoản có vai trò `ksda` nên **đúng luật** qua được kiểm vai trò, rồi vướng kiểm dữ liệu |

**Kết luận: 15/15 action thuộc use case không có `requireRole` đều LỌT QUA (0 bị chặn).**
Một trong số đó **đã thực thi và ghi vào DB** (`create_self_work_item`).

**Hệ quả:** bất kỳ tài khoản nào đã đăng nhập — kể cả tài khoản ít quyền nhất — đều có thể
tạo/sửa **nhà cung cấp, vật tư, nhóm vật tư, BOQ, hợp đồng dự án, kế hoạch thanh toán,
bút toán sổ quỹ, hồ sơ nhân sự, hợp đồng lao động, công việc phòng ban**.

> Ghi chú: phát hiện này **trùng với một ghi chú cũ** trong nhật ký dự án
> (*"RbacService.requireActionModule() được định nghĩa nhưng 0 lời gọi"*). Vậy **lỗi này
> chưa từng được sửa** — chỉ 4/5 action liên quan từng được vá thủ công bằng `requireRole`.

---

## 7. Workflow

### Hai hệ thống SONG SONG — chưa hợp nhất

| Hệ | Bảng | Bản chất | Đang dùng? |
|---|---|---|---|
| **Cũ** | `approval_stage_catalog` (5 dòng) | theo **vai trò** · dùng `all_roles` ở bước 5 | ✅ có — cấp `approvals` sinh từ đây |
| **Mới** | `workflow_definitions` (1) + `workflow_steps` (5) + `workflow_step_approvers` (5) | theo **người được chỉ định** | ✅ có — `canApproveRequestStage` đọc từ đây |

`workflow_definitions`: `WF-MUAHANG` / `WF-MUAHANG-01` — *"Quy trình mua hàng chuẩn"*, 5 bước, `is_default=1`, `project_id=NULL`.

| # | Bước | Vai trò cho phép | Người được gán | `approval_mode` |
|---|---|---|---|---|
| 1 | CHT xác nhận nhu cầu | `commander,cht` | cha.ht | `single` |
| 2 | Thư ký Tổng giám đốc duyệt | `thuky` | thukydemo | `single` |
| 3 | Phòng Dự án kiểm tra khối lượng | `project,da_nv` | nvdademo | `single` |
| 4 | Phòng Kế hoạch tiếp nhận | `procurement,kh_nv` | nvkhdemo | `single` |
| 5 | Trưởng phòng DA + KH xác nhận cuối | `da_truong,kh_truong` | **chỉ trdademo** | **`all_of`** |

### §7 — Workflow versioning: ĐÃ AUDIT

Câu hỏi đặt ra: *"Workflow A đang dùng, có document Pending, Admin đổi sang Workflow B thì sao?"*

**Đã xác định được:**

| Câu hỏi | Trả lời | Bằng chứng |
|---|---|---|
| Document cũ dùng A hay B? | **A — có snapshot** cho `allowed_role_codes` và `approval_mode` | `RequestStoreAdapter` dòng 268-280: `COALESCE(NULLIF(a.allowed_role_codes_snapshot,''), cfg.allowed_role_codes,'')` |
| Workflow instance có snapshot version? | **Một phần.** `approvals` có `allowed_role_codes_snapshot` + `approval_mode_snapshot` | cột DB đã kiểm, có dữ liệu |
| User thuộc Workflow A còn xử lý được document cũ không? | **CÓ** nếu đúng **vai trò**; **KHÔNG** nếu chỉ được chỉ định đích danh | `stageApproverUserIds` đọc **LIVE** từ `workflow_step_approvers`, **không** snapshot |
| Workflow history có bị thay đổi? | Không — `approvals` giữ nguyên dòng | |
| Document pending có bị ảnh hưởng? | **CÓ, một phần** — danh sách người được chỉ định thay đổi theo thời gian thực | như trên |
| Cột `workflow_definitions.version` | **Tồn tại nhưng KHÔNG được đọc ở đâu** | không truy vấn nào `SELECT ... version` |
| Bảng `approval_stage_decisions` | **0 dòng** — đường `all_roles` là mã chết | đếm DB |

⇒ **Kết luận: versioning CHỈ MỘT PHẦN.** Snapshot bảo vệ *vai trò*, nhưng **danh sách người
được chỉ định đọc trực tiếp từ cấu hình hiện tại**. Sửa `workflow_step_approvers` sẽ **thay đổi
ngay** ai được duyệt các phiếu đang chờ. Đây là **rủi ro cần xử lý** (xem §20).

---

## 8. Existing Modules

**61 module** trong `module_catalog`, 12 nhóm menu.

| Trạng thái | Module |
|---|---|
| **Hoàn thiện** (có use case + bảng + UI + probe ĐẠT) | `requests` · `purchasing` · `receiving` · `approvals` · `material_catalog` · `supplier_catalog` · `warehouse_receipt` · `warehouse_issue` · `inventory` · `stocktake` · `central_warehouse` · `projects` · `teams` · `users`/admin · `audit_logs` |
| **Có nhưng nông** (UI + bảng, ít quy tắc) | `dept_*` (27 module phòng ban) · `construction` · `production` · `hr_legal` · `finance_*` · `boq` |
| **Dang dở** | `mep` (8 module — **chưa rõ nghiệp vụ**) · `reports` · `dashboard` |
| **Chưa có** | Chấm công / nghỉ phép / tăng ca (§22) · báo cáo dùng chung (§23) · dashboard tồn kho (§19) · dashboard công việc (§11) |

---

## 9. Shared Components

**Đã có, dùng được:**

| Thành phần | Vai trò |
|---|---|
| `BaseModal` · `ModalFooter` | khung modal dùng chung |
| `CardHead` · `Pill` · `Empty` · `Kpi` · `HelpTip` | hiển thị dùng chung |
| `AttachmentPanel` | tệp đính kèm |
| `AccessDeniedPanel` | chặn truy cập |
| `LoadingScreen` · `ErrorScreen` | trạng thái |
| `RequestDrawer` | **đã hỗ trợ 2 chế độ `drawer`/`page`** — tiền lệ tốt cho việc chuyển modal → trang |

**Chưa có (cần xây theo §4):** `DataTable` · `Toolbar` · `Search/Filter/Sort/Pagination` dùng chung ·
`PermissionGuard` · `StatusBadge` · `ApprovalTimeline` · `ActivityTimeline` · **`EntityDetailModal`**.

---

## 10. Duplicate Components

**218 hàm cấp cao** trong một tệp. Đếm được:

- **31 modal thực thể độc lập**: `RequestModal`, `PoModal`, `ReceiptModal`, `ProjectModal`,
  `CategoryModal`, `MaterialModal`, `MaterialMergeModal`, `ProjectContractModal`, `BoqVersionModal`,
  `BoqItemModal`, `MenuGroupModal`, `ModuleCatalogModal`, `BusinessGroupModal`, `RoleCatalogModal`,
  `ApprovalStageModal`, `UserModal`, `UserEditModal`, `UserAccessModal`, `SystemLevelModal`,
  `WorkflowModal`, `TeamCreateModal`, `InstallModal`, `IssueModal`, `CountModal`, `ReturnModal`,
  `TransferModal`, `CentralReturnModal`, `CentralReceiveModal`, `EmailSettingsModal`,
  `AccountSettingsModal`, `ForcedPasswordModal`
- **27 màn hình** dạng `*Screen`: `BenefitsScreen`, `SealScreen`, `LegalDocsScreen`,
  `CorrespondenceScreen`, `LaborScreen`, `HrScreen`, `DocumentsScreen`, `CashbankScreen`,
  `SiteCostScreen`, `AdvanceScreen`, `PaymentPlanScreen`, `MaterialNormsScreen`,
  `ConstructionScreen`, `FinanceRecoveryScreen`, `SiteCommandScreen`…

**Đánh giá:** 31 modal độc lập cho 31 thực thể là **hệ quả tự nhiên** của kiến trúc một tệp,
không hẳn là lỗi — nhưng chúng **lặp lại cùng một khuôn**: mở/đóng, nạp dữ liệu, kiểm quyền,
trạng thái rỗng/lỗi, responsive. Xây `EntityDetailModal` dùng chung sẽ gom được phần lặp này.

**Trùng lặp nặng nhất về CSS:** `globals.css` có **1.183 khối selector bị định nghĩa trùng nhau**
và **4.950 khai báo ưu tiên cao** — đây là lý do gốc khiến tầng CSS phải phân xử bằng `!important`.

---

## 11. Technical Debt

| # | Nợ | Mức | Bằng chứng |
|---|---|---|---|
| 1 | **RBAC action không thực thi** | 🔴 Chặn | 15/15 action lọt qua (§6) |
| 2 | **Catalog action lệch 50 action** | 🟠 Cao | 224 case vs 174 catalog (§4) |
| 3 | `globals.css`: 1.183 selector trùng, 4.950 `!important` | 🟠 Cao | `probe-css-budget` |
| 4 | `page.tsx` 4.057 dòng, 218 hàm trong **một** tệp | 🟠 Cao | không có biên giới module |
| 5 | Hai hệ workflow song song, chưa hợp nhất | 🟠 Cao | §7 |
| 6 | Versioning workflow chỉ một phần | 🟠 Cao | §7 |
| 7 | 31 modal trùng khuôn, chưa có `EntityDetailModal` | 🟡 TB | §10 |
| 8 | `SystemController` 1.437 dòng, 224 nhánh `case` | 🟡 TB | |
| 9 | `approval_stage_decisions` 0 dòng — mã chết | 🟡 TB | |
| 10 | `workflow_definitions.version` không được đọc | 🟡 TB | |
| 11 | `firstToCamel()` là **NO-OP** → phụ thuộc chữ hoa alias của DB | 🟡 TB | ghi chú cũ, còn giá trị |
| 12 | Java có `spring-boot-starter-mail` nhưng **0 lớp dùng** → không gửi được email | 🟡 TB | chỉ có hàng đợi, không gửi |
| 13 | Tài liệu trùng số (`09_`, `10_`, `16_` mỗi số 2 tệp) | 🟢 Thấp | `docs/` |
| 14 | `tools/` có 88 file, nhiều script dùng một lần | 🟢 Thấp | |

---

## 12. Unknown Business Logic

| # | Vùng | Trạng thái | Ghi chú |
|---|---|---|---|
| 1 | **Module `mep`** (8 module) | **UNKNOWN** | Có module trong catalog nhưng không có use case riêng, không có bảng nghiệp vụ MEP. Cần xác nhận phạm vi trước khi làm (§15) |
| 2 | **Thời hạn phiên + thu hồi phiên** | **UNKNOWN** | Có bảng `sessions` (333 dòng) nhưng chưa rõ chính sách |
| 3 | **`task_sla_policies`** (24 dòng) | **LIKELY** | Có vẻ là SLA theo loại công việc; chưa thấy nơi áp dụng |
| 4 | **`supply_workflow_steps`** (38 dòng) | **LIKELY** | Nhật ký bước cung ứng (`po_creation`, `bch_confirmation`, `issue`…); **ghi log, không điều khiển luồng** |
| 5 | **`business_role_group_*`** (11 nhóm, 9 scope) | **LIKELY** | Nhóm quyền nghiệp vụ — có bảng + UI (`BusinessRoleGroupManager`) nhưng **chưa rõ có tham gia kiểm quyền không** |
| 6 | **`procurement_allocations`** (41 dòng) | **UNKNOWN** | Chưa rõ quan hệ với MR/PO |
| 7 | **`material_norms`** (định mức vật tư) | **LIKELY** | Có màn hình, chưa rõ dùng ở đâu trong tính toán |

### §35 — NGOẠI LỆ CÁ NHÂN (đã điều tra theo đúng quy trình Code→DB→API→UI→Permission)

**Kết luận: CONFIRMED.** Ngoại lệ cá nhân ghi đè **QUYỀN**, không đính tới workflow/phòng ban/scope.

```text
Code   : UserManagementUseCase dòng 203-208 — saveUserAccess ghi permission_source
DB     : user_module_permissions.permission_source ∈ {department_default, manual_override}
API    : action `delete_user_module_override` xoá đúng các dòng manual_override
UI     : PersonalExceptionManager (tab "Ngoại lệ cá nhân") + 5 nơi khác đọc allModulePermissions
Permission: manual_override THẮNG quyền suy ra từ phòng ban
```

⇒ Đây là cơ chế **cấp thêm quyền cho một cá nhân vượt quyền phòng ban**, có thể thu hồi riêng.
**Không được xoá.** Rủi ro cần lưu ý: vì tầng RBAC action không thực thi (§6), ngoại lệ cá nhân
hiện **không có tác dụng chặn** — nó chỉ ảnh hưởng tới việc **hiển thị menu/màn hình**.

### §25 — NHÓM CON VẬT TƯ (đã audit)

**Kết luận: CONFIRMED** — cấu trúc phân cấp **2 cấp**, không sâu hơn:

```text
materials.category_id ──> material_categories (6 dòng)      ← "Hệ M&E"
materials.subcategory_id ──> material_subcategories (8 dòng) ← "Nhóm con"
Mã vật tư = <HỆ>-<NHÓM>-<STT>   ví dụ DIEN-DAY-CAD-001
```

- **Dùng để làm gì:** phân loại vật tư theo Hệ M&E (Điện/CTN/HVAC/Khác) và nhóm con trong hệ;
  mã vật tư sinh ra từ chính cặp này.
- **Quan hệ với Material:** mỗi vật tư thuộc **đúng 1** hệ và **đúng 1** nhóm con.
- **Nhiều cấp?** Không — chỉ 2 cấp.
- **Ảnh hưởng MR/PO?** Có, gián tiếp qua mã vật tư và qua kiểm tồn kho.
- **Ảnh hưởng Kho?** Không trực tiếp.
- **Ảnh hưởng báo cáo?** Có — mọi báo cáo nhóm theo Hệ/Nhóm đều dựa vào đây.
- **Trạng thái dữ liệu:** 14 vật tư, **0 vật tư thiếu category/subcategory** ✅ (đã kiểm).

---

## 13. Database Risks

| # | Rủi ro | Mức | Ghi chú |
|---|---|---|---|
| 1 | **`COLLATE` mặc định khác nhau** | 🔴 Chặn | `CREATE TABLE ... DEFAULT CHARSET=utf8mb4` **không nêu COLLATE** sẽ lấy `utf8mb4_0900_ai_ci`, trong khi schema gốc dùng `utf8mb4_unicode_ci`. JOIN hai bảng khác collation → **ERROR 1267** → `BootstrapDataAdapter` JOIN ngay khi tải ⇒ **TOÀN BỘ giao diện 500**. **Mọi bảng mới PHẢI ghi rõ `COLLATE=utf8mb4_unicode_ci`.** |
| 2 | **Sửa migration đã chạy đổi Flyway checksum** | 🟠 Cao | Phải `DELETE FROM flyway_schema_history WHERE version='N'` để chạy lại — chỉ an toàn nếu migration idempotent |
| 3 | **Hai nguồn migration** (Flyway + drizzle) | 🟡 TB | drizzle chỉ là dấu định danh; nhầm lẫn dễ dẫn tới tưởng đã có bảng |
| 4 | **Không có khoá ngoại ở một số bảng** | 🟡 TB | `procurement_allocations`, `supply_workflow_steps` dùng mã dạng chuỗi |
| 5 | **`material_subcategories.created_at` không có giá trị mặc định** | 🟢 Thấp | Chèn thiếu cột → `ERROR 1364` |
| 6 | **Chưa kiểm: backup / PITR** | **UNKNOWN** | Cần xác nhận trước khi thao tác dữ liệu lớn (§2 P0) |

---

## 14. API Risks

| # | Rủi ro | Mức |
|---|---|---|
| 1 | **Action không được kiểm quyền** | 🔴 Chặn — §6 |
| 2 | **Catalog lệch 50 action** → parity không đáng tin | 🟠 Cao |
| 3 | **`/api/files` là endpoint riêng**, không đi qua `ActionRbacRegistry` | 🟠 Cao — cần kiểm quyền riêng |
| 4 | Một endpoint duy nhất cho 224 action → khó rate-limit, khó log theo route | 🟡 TB |
| 5 | Không thấy versioning API (`/v1/`) | 🟢 Thấp — nội bộ nên chấp nhận được |
| 6 | Lỗi trả về dạng chuỗi tiếng Việt, không mã lỗi máy đọc được | 🟢 Thấp |

---

## 15. UI/UX Issues

| # | Vấn đề | Nguồn |
|---|---|---|
| 1 | Toolbar danh sách mất cân đối, nút bị dồn một phía | §5, §31 |
| 2 | Modal có thể vượt viewport | §5 |
| 3 | Phiếu: phần duyệt thiếu thông tin (người duyệt/phòng ban/thời gian) → cần **Approval Timeline** | §8.1 |
| 4 | "Tổng hợp giao nhận" bị ép vào layout chi tiết → cần **modal riêng** | §8.2 |
| 5 | Hồ sơ vật tư đặc thù: ảnh/tệp đính kèm khó xem, tràn khung | §8.3 |
| 6 | Màn công việc chưa tách menu con theo quyền | §9.1 |
| 7 | Approval Center chưa tách khỏi Công việc | §12 |
| 8 | Danh sách dự án + Ban chỉ huy dự án chưa tách tab | §13, §14 |
| 9 | Mua hàng chưa tách MR/PR/PO thành tab riêng | §16 |
| 10 | Nhà cung cấp đang nằm dưới Mua hàng thay vì menu độc lập | §17 |
| 11 | Kho chưa tách 5 mục con + chưa có dashboard tồn kho | §18, §19 |
| 12 | Tổ đội: chưa có tab Cấp phát, chưa có CRUD đầy đủ | §20 |
| 13 | Nhân sự chưa đổi tên thành **Tài khoản**, thiếu cột | §26.1 |
| 14 | Tổ chức chưa tách "Cơ cấu tổ chức" / "Tổ đội theo dự án" | §27 |
| 15 | Phân quyền phòng ban hiển thị toàn bộ danh sách, thiếu chọn nhiều + xoá hàng loạt | §30 |
| 16 | Phân quyền người dùng: toolbar mất cân đối | §31 |
| 17 | Audit log gộp `User` với `Performed By` | §36 |
| 18 | Tab workflow chưa đổi tên thành `Workflow` | §34 |

**Sàn cỡ chữ:** còn **120 selector** phải nâng lên 10px bằng tệp sinh `font-floor.css`;
`globals.css` vẫn còn **14 chỗ** đặt cỡ chữ dưới sàn.

---

## 16. Security Issues

| # | Vấn đề | Mức | Trạng thái |
|---|---|---|---|
| 1 | **Broken Access Control — action không kiểm quyền** | 🔴 **CHẶN** | **Đã chứng minh 15/15 lọt qua, 1 action ghi được DB** |
| 2 | 12 use case không có bất kỳ kiểm vai trò nào | 🔴 **CHẶN** | cùng nguyên nhân |
| 3 | 64 action khai báo module rỗng trong registry | 🔴 Chặn | cùng nguyên nhân |
| 4 | Ngoại lệ cá nhân không có tác dụng chặn (vì #1) | 🟠 Cao | hệ quả |
| 5 | `/api/files` nằm ngoài mọi kiểm quyền action | 🟠 Cao | cần kiểm riêng |
| 6 | Khoá đăng nhập 10 lần/15 phút — chỉ xoá được bằng khởi động lại Java | 🟡 TB | có thể bị lợi dụng để từ chối dịch vụ tài khoản |
| 7 | Chưa có bằng chứng test **cross-department / cross-project** | **UNKNOWN** | cần bổ sung (§40) |

> **Điểm sáng:** 22/22 phương thức trong `UserManagementUseCase`, 18 phương thức trong
> `AdminSystemUseCase`… **đều có `requireRole(admin)`** ở tầng use case. Nên 64 action module rỗng
> **không phải** lỗ hổng leo thang đặc quyền cho nhóm quản trị. Vấn đề nằm ở **các use case
> nghiệp vụ** (vật tư, NCC, BOQ, tài chính, HR, công việc, hợp đồng) — xem #1.

---

## 17. Recommended Architecture

### 17.1 Bịt lỗ hổng RBAC trước tiên (P0)

```
Mọi action trong SystemController
        ↓
[1] requireActionModule(user, action)     ← GỌI Ở ĐÂY, một chỗ, dùng ActionRbacRegistry
        ↓  (bỏ qua nếu action chưa khai module → mặc định ĐÓNG, không phải MỞ)
[2] requireRole(...) trong use case       ← giữ nguyên, phòng thủ nhiều lớp
        ↓
[3] kiểm nghiệp vụ + dữ liệu
```

Nguyên tắc: **mặc định TỪ CHỐI** khi action chưa được khai module. Bổ sung
action còn thiếu vào `ActionRbacRegistry` (50 action) rồi mới bật.

### 17.2 Tầng thành phần dùng chung (P1)

```
components/
  EntityDetailModal      ← 1 khung cho User/Project/Warehouse/Team/Material/Supplier/Task
  DataTable              ← cột, sắp xếp, lọc, phân trang, trạng thái rỗng/đang tải/lỗi
  ListToolbar            ← TIÊU ĐỀ + SỐ LƯỢNG  |  TÌM · LỌC · SẮP XẾP · HÀNH ĐỘNG
  PermissionGuard        ← ẩn/hiện theo quyền (backend vẫn phải kiểm)
  StatusBadge            ← nhãn trạng thái thống nhất
  ApprovalTimeline       ← dùng cho mọi phiếu
  ActivityTimeline       ← dùng cho mọi lịch sử
```

### 17.3 Tách `page.tsx` (P1)

Chia theo **màn hình**, giữ `page.tsx` < 300 dòng (đã có kế hoạch ở `docs/22` GĐ3).

---

## 18. Implementation Plan

| Phase | Nội dung | Phụ thuộc | Ghi chú |
|---|---|---|---|
| **P0** | Bịt RBAC action · kiểm `/api/files` · xác nhận backup | — | **Chặn mọi thứ khác** |
| **P1** | Hạ tầng UI dùng chung: `EntityDetailModal`, `DataTable`, `ListToolbar`, `PermissionGuard`, `StatusBadge` | P0 | |
| **P2** | Purchase: MR/PR/PO tab · Approval Timeline · modal Tổng hợp giao nhận · hồ sơ vật tư | P1 | |
| **P3** | Task: menu 5 mục · personal/dept · Kanban · dashboard · mô hình dữ liệu task | P1 | |
| **P4** | Project: list tab · detail modal · entity navigation · Ban chỉ huy dự án | P1 | |
| **P5** | Inventory: 5 mục con · dashboard tồn kho · quan hệ Project–N Warehouse | P1 | |
| **P6** | Team: list · detail · CRUD · tab Cấp phát | P1 | |
| **P7** | Admin: Tài khoản · tổ chức · chức danh · nhóm quyền · phân quyền · audit log | P0,P1 | |
| **P8** | Workflow: đổi tên · **versioning đầy đủ** · mở rộng form tương lai | P0 | |
| **P9** | Reporting dùng chung + dashboard các module | P2–P6 | |
| **P10** | MEP · tài chính · HR nâng cao | cần spec | **Chỉ audit + chuẩn bị** |

---

## 19. TODO

Xem `docs/25_TODO_ROADMAP.md` — mỗi mục có ID, module, ưu tiên, phụ thuộc, ảnh hưởng DB/API/UI/quyền, trạng thái.

---

## 20. Risks / Blockers

| # | Rủi ro | Mức | Cần làm |
|---|---|---|---|
| 1 | **RBAC action không thực thi** — mọi tài khoản đã đăng nhập đều sửa được vật tư/NCC/BOQ/tài chính/HR | 🔴 **CHẶN** | Bật `requireActionModule` + khai 50 action còn thiếu. **Không làm gì khác trước khi bịt.** |
| 2 | **Bật RBAC có thể khoá nhầm người dùng thật** vì 50 action chưa có module và quyền phòng ban chưa đủ | 🔴 Chặn | Bật theo **danh sách trắng**: chỉ bật cho action đã khai module; action chưa khai tạm giữ nguyên, ghi TODO |
| 3 | **Workflow versioning một phần** — sửa `workflow_step_approvers` ảnh hưởng ngay phiếu đang chờ | 🟠 Cao | Snapshot cả danh sách người được chỉ định |
| 4 | **Chưa xác nhận backup/PITR** | 🟠 Cao | Xác nhận trước khi sửa dữ liệu lớn |
| 5 | **Nhóm quyền nghiệp vụ chưa rõ có tham gia kiểm quyền không** | 🟠 Cao | Audit trước khi đụng tới phân quyền |
| 6 | **Module MEP chưa rõ nghiệp vụ** | 🟠 Cao | Cần spec từ người dùng |
| 7 | Tài liệu cũ mô tả hành vi đã đổi | 🟡 TB | Cập nhật ở `docs/42` |
| 8 | 4.057 dòng trong một tệp — sửa dễ gây hồi quy | 🟡 TB | Có cổng ảnh + 13 probe làm lưới |

---

## PHỤ LỤC — Bằng chứng đã thu thập

| Bằng chứng | Công cụ |
|---|---|
| 15/15 action lọt qua kiểm quyền | `tools/probe-security-rbac.mjs` |
| 1 action ghi được vào DB (`create_self_work_item` → HTTP 200) | cùng probe |
| 13 probe hồi quy ĐẠT | `tools/probe-*.mjs` |
| 28 ảnh chuẩn 4 kích thước, lệch 0 điểm ảnh | `tools/probe-visual-regression.mjs` |
| 4.950 `!important` · 1.183 selector trùng | `tools/probe-css-budget.mjs` |
| Luồng mua hàng 5 bước chạy bằng đúng tài khoản từng vai trò | `tools/probe-purchasing-flow.mjs` |
| 121 bảng · 174/224 action · 22 use case · 218 hàm UI | truy vấn DB + quét mã nguồn |
