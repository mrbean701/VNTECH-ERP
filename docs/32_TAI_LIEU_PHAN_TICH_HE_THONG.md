> **VNTECH ERP — BỘ TÀI LIỆU PHIÊN BẢN `ALPHA TEST`**
> · Phiên bản tài liệu: **`DOC-ALPHA-TEST-2026.10`** · Ngày cập nhật: **08/10/2026** · Phiên soạn: `ERP-SESSION-01`
> · Sản phẩm: `V5.3.0-MASTER-BASELINE-R1.1.1` · Cổng: `:8787` (UI) · `:9000` (cutover) · `:18081` (API Java)
> · ⚠️ Trạng thái: **ALPHA TEST** — tài liệu phản ánh bản ĐANG CHẠY; ⛔ chưa phải bản phát hành chính thức.
> · 📌 Nguồn sự thật: **mã nguồn + CSDL thật** (mọi số liệu đều ĐO được, ⛔ không suy đoán).

# TÀI LIỆU PHÂN TÍCH / MÔ TẢ HỆ THỐNG — VNTECH ERP V5.3.0

Bản cập nhật: **08/10/2026** · thay thế bản 23/09/2026 (169 dòng) · Phiên soạn: `ERP-SESSION-01`.

Tài liệu này mô tả **kiến trúc, thành phần, mô hình dữ liệu, cơ chế an toàn và hạn chế đã biết** của hệ thống **đang chạy**.
Đọc cùng `docs/33_MO_TA_CHUC_NANG_VA_HE_THONG.md` (góc chức năng) và `docs/34_TAI_LIEU_DEV.md` (góc phát triển).

---

## 0. MỤC LỤC

| § | Nội dung |
|---|---|
| [1](#1-cách-đo--nguồn-sự-thật) | Cách đo — nguồn sự thật |
| [2](#2-bối-cảnh--mục-tiêu) | Bối cảnh & mục tiêu |
| [3](#3-kiến-trúc-tổng-thể) | Kiến trúc tổng thể |
| [4](#4-backend-java--clean-architecture) | Backend Java — Clean Architecture |
| [5](#5-mô-hình-dữ-liệu) | Mô hình dữ liệu |
| [6](#6-thành-phần-nghiệp-vụ-nổi-bật) | Thành phần nghiệp vụ nổi bật |
| [7](#7-an-toàn--toàn-vẹn-) | An toàn & toàn vẹn ⭐ |
| [8](#8-sự-kiện-nền--worker) | Sự kiện nền & worker |
| [9](#9-hạn-chế-đã-biết-bug-20261008-0xx) | Hạn chế đã biết (`BUG-20261008-0xx`) |
| [10](#10-phụ-lục--bảng-số-đo-tổng-hợp--cách-tái-lập) | Phụ lục — bảng số đo tổng hợp & cách tái lập |

---

## 1. CÁCH ĐO — NGUỒN SỰ THẬT

Mọi con số trong tài liệu này đều **đo được** bằng lệnh dưới đây (chạy tại gốc repo). ⛔ Không có số nào là suy đoán.

| Nhóm | Lệnh đo | Kết quả tại 08/10/2026 |
|---|---|---|
| Module Java | `Get-ChildItem java-backend -Directory` + `<module>` trong `java-backend/pom.xml` | **4 module Maven**: `domain` · `application` · `infrastructure` · `web` |
| Tệp `.java` | `Get-ChildItem java-backend/<module> -Recurse -File -Filter *.java \| Measure-Object` | **166** tệp (xem §4.1) |
| Migration | `Get-ChildItem java-backend/infrastructure/src/main/resources/db/migration -File -Filter *.sql` | **38** tệp |
| Lịch sử Flyway | `SELECT COUNT(*) FROM flyway_schema_history WHERE success=1;` | **38** (`success=0` ⇒ **0**) |
| Số bảng CSDL | `SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='vntech_erp';` | **134** (0 VIEW — tất cả `BASE TABLE`) |
| Bất biến kho/dự án | `SELECT COUNT(*) FROM warehouses;` · `... FROM projects;` · `... FROM warehouses WHERE project_id IS NOT NULL;` | **12 / 5 / 10** |
| Số dòng bảng chính | `SELECT COUNT(*) FROM <bảng>;` (từng bảng) | xem §5.4 |
| Cổng đang chạy | `Invoke-WebRequest http://127.0.0.1:<cổng>/` · `Get-NetTCPConnection -State Listen -LocalPort 8787,9000,18081` | `:8787` **200** · `:9000` **200** · `:18081/api/system` **401** (đang nghe) |
| Git | `git log -1 --oneline` · `git status --short \| Measure-Object` | HEAD **`3cfbd75`** (nhánh `unity`) · **80** đường chưa commit |

> ⚠️ **CSDL chỉ ĐỌC**: toàn bộ truy vấn trong tài liệu là `SELECT` / `information_schema`. ⛔ Không ghi CSDL.
> ⚠️ **PID cổng thay đổi theo lần khởi động lại** — con số PID nêu ở §3.2 chỉ đúng tại thời điểm đo 08/10/2026.

---

## 2. BỐI CẢNH & MỤC TIÊU

**VNTECH ERP** là nền tảng quản trị & điều hành nội bộ của Công ty CP TM ĐT PT Công nghệ Việt (VNTECH), tập trung nghiệp vụ **Kho vật tư + M&E (Cơ – Điện)**:

```
Bản vẽ → Bóc khối lượng BOQ → Chuẩn hóa mã vật tư → Đề nghị mua (MR)
→ Phê duyệt nhiều bậc → Đặt hàng (PO) → Nhận hàng (GRN)
→ Tồn kho theo hợp đồng → Xuất/Trả/Lắp đặt → Nghiệm thu → Thu hồi vốn
```

**Sản phẩm** (nguồn: `lib/vntech-identity-data.mjs` + `VNTECH_FINGERPRINT.json`):
`VNTECH ERP V5.3.0 MASTER BASELINE R1.1.1` · `packageId = VNTECH_ERP_V5_3_0_MASTER_BASELINE_R1_1_1` ·
build `5.3.0-MASTER-BASELINE-R1.1.1-FINAL-20260908` · `productId = VNTECH-KHO-MEP-001`.

Sản phẩm qua nhiều vòng chuẩn hóa: MASTER BASELINE CLEANUP R1.1 → R1.1.1 safe-clean CSS → PROJECT NAVIGATION CONSOLIDATION → FINGERPRINT FIX.
Bản hiện tại là **FULL SOURCE** độc lập (không cần replay patch cũ).

**Mục tiêu phiên bản ALPHA TEST:** đưa toàn bộ nghiệp vụ chạy trên **Java backend + MySQL** theo lộ trình **strangler-fig**,
giữ giao diện không đổi, bảo đảm **zero-downtime** trong giai đoạn chuyển đổi và **đo được** trạng thái thật thay vì suy đoán.

---

## 3. KIẾN TRÚC TỔNG THỂ

### 3.1 Sơ đồ tiến trình (đo từ mã, ⛔ không suy đoán)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Trình duyệt — React/TypeScript SPA (app/**)                                 │
└───────────────────────────────┬──────────────────────────────────────────────┘
                                │ http
┌───────────────────────────────▼──────────────────────────────────────────────┐
│  CUTOVER PROXY  :9000  —  tools/cutover-proxy.mjs                            │
│  · /api/system · /api/files · /api/health · /actuator  →  JAVA  :18081       │
│  · mọi đường dẫn còn lại (UI/asset)                    →  NODE UI :8787      │
└──────────────┬─────────────────────────────────────────┬─────────────────────┘
               │                                         │
┌──────────────▼───────────────────────┐   ┌─────────────▼─────────────────────┐
│  UI SERVER  :8787                    │   │  JAVA API  :18081                 │
│  scripts/local-server.mjs            │   │  Spring Boot — java-backend/web   │
│  (phục vụ app/** đã build + SSR)     │   │  Clean Architecture (4 module)    │
│  Lõi JS tham chiếu:                  │   │  · GET  /api/system  = bootstrap  │
│  scripts/system-route.mjs (3.429 d)  │   │  · POST /api/system  = 261 action │
└──────────────────────────────────────┘   └─────────────┬─────────────────────┘
                                                         │ JDBC
                                           ┌─────────────▼─────────────────────┐
                                           │  MySQL 8 — CSDL `vntech_erp`      │
                                           │  134 bảng · Flyway V1..V39 (38)   │
                                           └───────────────────────────────────┘
```

### 3.2 Ba tiến trình đang chạy (đo 08/10/2026)

| Cổng | Tiến trình | Tệp khởi động | Kết quả đo |
|---|---|---|---|
| `:8787` | Node UI server | `scripts/local-server.mjs` (lắng nghe `8787` tại dòng 100) | HTTP **200** (PID 14028) |
| `:9000` | Cutover proxy | `tools/cutover-proxy.mjs` | HTTP **200** (PID 5584) |
| `:18081` | Java API (Spring Boot) | `java-backend/web/target/vntech-erp-web-0.1.0-SNAPSHOT.jar` | `/` → **404**, `/api/system` → **401** = đang nghe, cần đăng nhập (PID 20508) |

**Lệnh khởi động proxy `:9000` — ⚠️ BẮT BUỘC ĐỦ CỜ** (mặc định trong mã: `--port 8787` · `--ui-port 8788` · `--api-port 18081`):

```powershell
node tools/cutover-proxy.mjs --port 9000 --ui-port 8787 --api-port 18081
```

⚠️ Thiếu cờ ⇒ proxy cố mở `:8787` (đã bị UI chiếm) ⇒ `EADDRINUSE`, **proxy không lên**. Nguồn: `tools/cutover-proxy.mjs` dòng 32–36.

### 3.3 Luồng một request tiêu biểu

```
UI (app/page.tsx) --GET/POST /api/system--> proxy :9000 --> Java :18081
   GET  → AuthUseCase.currentUser() → BootstrapUseCase.load() → BootstrapDataAdapter → MySQL
   POST → SystemController.post(payload{action})
            ① rbacService.requireActionModule(user, action)   ← CHẶN ở tầng action (fail-closed)
            ② switch(action) → 261 nhánh → *UseCase (business rule)
            ③ Port out → Adapter JPA/JdbcTemplate → MySQL
            ④ trả payload: data + allowedCapabilities + audit
```

📏 Nguồn: `java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java`
— **1.822 dòng**, `@RequestMapping("/api/system")` (L48), `@GetMapping` (L158) = **bootstrap**, `@PostMapping` (L213) = **261 `case "…"`**.
📌 **Cập nhật so với bản 23/09/2026:** hành vi `bootstrap` **ĐÃ được triển khai ở Java** (qua `GET /api/system` + `BootstrapUseCase`), ⛔ không còn là "chưa triển khai" như ghi nhận cũ.

### 3.4 Vì sao có "hai lõi"?

Hệ thống đang trong lộ trình **strangler-fig**: logic nghiệp vụ chuyển dần từ monolith JS (`scripts/system-route.mjs` — **3.429 dòng**)
sang **Java Clean Architecture**. Trong giai đoạn chuyển đổi, một số action chưa có nhánh Java nên do lõi JS phục vụ ⇒ bảo đảm **zero-downtime** và khả năng **đối chứng hai lõi**.
Xem `docs/09_KE_HOACH_CHUYEN_SANG_JAVA_MYSQL.md`, `docs/10_KẾ_HOẠCH_CUTOVER_BACKEND_JAVA.md`, `docs/13_KE_HOACH_CHUYEN_DOI_HOAN_TOAN_SANG_JAVA_BACKEND.md`.

---

## 4. BACKEND JAVA — CLEAN ARCHITECTURE

### 4.1 Maven đa module — số tệp `.java` ĐO ĐƯỢC

| Module | Luồng phụ thuộc | `src/main` | `src/test` | **Tổng** |
|---|---|---|---|---|
| `domain` | entity + domain service (thuần, ⛔ không framework) | 6 | 3 | **9** |
| `application` | use-case + port in/out + RBAC | 66 | 4 | **70** |
| `infrastructure` | adapter JPA/MySQL, bootstrap, worker, migration | 42 | 4 | **46** |
| `web` | REST controller + security filter + Spring Boot app | 7 | 34 | **41** |
| | | | **TỔNG** | **166** |

📏 Lệnh: `Get-ChildItem java-backend/<module>/src/<main|test> -Recurse -File -Filter *.java | Measure-Object`.
📏 4 module khai báo trong `java-backend/pom.xml` bằng thẻ `<module>`. Các thư mục `.idea` · `.mvn` · `contract-tests` · `data` · `tools` **⛔ không phải module Maven**.

```
vntech-erp-domain  (entity + domain service)
   → vntech-erp-application (use-case, port in/out, RBAC)
        → vntech-erp-infrastructure (adapter JPA/MySQL, bootstrap, workers)
             → vntech-erp-web  (REST controller + Spring Boot app)
```
Artifact gói thực thi: `java-backend/web/target/vntech-erp-web-0.1.0-SNAPSHOT.jar` (fat jar ~86,8 MB — theo log triển khai `SESSION_REGISTRY.md`).

### 4.2 Quy ước Ports & Adapters (số đo)

| Tầng | Thành phần | Số đo |
|---|---|---|
| Domain | `domain/entity` (`Project`, `User`) · `domain/service` (`MaterialMatcherV2` 417 dòng, `MaterialSystemCodes`, `StockLedgerEngine`) · `domain/valueobject` (`ProjectStatus`) | **6** tệp `main` |
| Application | **24** `*UseCase.java` · **33** interface `port/out` · **25** tệp `service/` | `java-backend/application/**` |
| Infrastructure | adapter JPA/JdbcTemplate, `BootstrapDataAdapter` (**2.127 dòng**), **2** worker, **38** migration Flyway | `java-backend/infrastructure/**` |
| Web | `VntechErpApplication` · `SystemController` · `FileController` · `HealthController` · `AuditTrailFilter` · `SessionCookieFactory` · `ApplicationBeansConfig` | **7** tệp `main` |

**24 use-case hiện có:** `AdminOpsManagement` · `AdminSystem` · `Auth` · `Bootstrap` · `BoqManagement` · `ContractReview` · `ErrorReport` · `File` · `FinanceManagement` · `HrManagement` · `ListActiveProjects` · `MaterialCatalogManagement` · `NotificationManagement` · `OpsTaskManagement` · `PartnerManagement` · `ProductionManagement` · `ProjectContract` · `ProjectManagement` · `PurchaseManagement` · `RequestManagement` · `StockManagement` · `SupplierManagement` · `SystemSettings` · `UserManagement`.

### 4.3 RBAC 3 lớp

| Lớp | Thành phần | Ý nghĩa |
|---|---|---|
| 1. Vai trò | `role_catalog` (hệ mã role ENGINE/CHT/KH/DA/TCKT/…) | Người dùng thuộc vai trò nào |
| 2. Module + capability | `ActionRbacRegistry` + `RbacService`; capability `canView/canUse/canCreate/canEdit/canDelete/canApprove` | Thao tác nào được phép |
| 3. Phạm vi dữ liệu | `AccessScopeService`, `user_project_scopes`, `department_module_permissions`, `user_warehouse_scopes` | Dữ liệu dự án/kho/đơn vị nào được nhìn |

📏 Đo được: `module_catalog` = **76** module (trong đó `active=1` = **76**) · `menu_group_catalog` = **12** nhóm menu · `user_module_permissions` = **2.772** dòng · `department_module_permissions` = **481** dòng · `user_project_scopes` = **37** dòng.

**Nguyên tắc:** **backend-first** — mọi kiểm tra quyền thực hiện ở backend (điểm kiểm duy nhất: `SystemController.post` dòng 228–231, **fail-closed**), frontend chỉ render theo dữ liệu trả về.

---

## 5. MÔ HÌNH DỮ LIỆU

### 5.1 Số bảng THẬT

| Chỉ số | Giá trị | Cách đo |
|---|---|---|
| Số bảng trong `vntech_erp` | **134** | `SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='vntech_erp';` |
| Loại đối tượng | **134 `BASE TABLE` · 0 `VIEW`** | `... GROUP BY table_type` |
| Bảng lịch sử migration | `flyway_schema_history` | có trong danh sách bảng |

⚠️ **Khác bản 23/09/2026:** tài liệu cũ ghi «114 bảng baseline» (theo `DATA_MODEL_REFERENCE.json`, tableCount=114). **Số THẬT hôm nay là 134 bảng** — 114 là mốc **baseline V1**, ⛔ không phải số bảng hiện tại.
⚠️ Trong 134 bảng có **3 bảng sao lưu kỹ thuật**: `backup_csl_20261006` · `backup_ump_20261006` · `backup_ump_20261006b` (xem §9.3).

### 5.2 Flyway — lịch sử đã áp dụng

| Chỉ số | Giá trị | Cách đo |
|---|---|---|
| Tệp migration trong mã | **38** | `Get-ChildItem .../db/migration -File -Filter *.sql` |
| Bản ghi `success=1` | **38** | `SELECT COUNT(*) FROM flyway_schema_history WHERE success=1;` |
| Bản ghi `success=0` (FAILED) | **0** | `SELECT COUNT(*) FROM flyway_schema_history WHERE success=0;` |
| Dải version | `1..35`, `37`, `38`, `39` | `SELECT GROUP_CONCAT(version ORDER BY installed_rank) ...` |
| 3 bản ghi mới nhất | `V39` (session02 stock reservation issue id) · `V38` (session02 warehouse code kd rule) · `V37` (contract reviews review logs error reports transit warehouse) | `ORDER BY installed_rank DESC LIMIT 3` |

⚠️ **`V36` ⛔ KHÔNG tồn tại** — không có ở cả thư mục migration lẫn `flyway_schema_history` (đo được, ⛔ không phải lỗi hiển thị). Cần xác minh lý do nếu muốn đánh số lại.
📌 Các version gần đây cho thấy **2 phiên cùng tạo migration** (`V37`/`V38`/`V39` do `ERP-SESSION-02` — xem §9.4).

### 5.3 Nhóm bảng chính (134 bảng)

| Nhóm | Bảng đại diện |
|---|---|
| Danh mục & tổ chức | `projects` · `project_contracts` · `organization_units` · `role_catalog` · `system_level_catalog` · `module_catalog` · `menu_group_catalog` · `document_sequences` · `company_settings` |
| Vật tư | `materials` · `material_categories` · `material_subcategories` · `material_aliases` · `material_uom_conversions` · `material_external_codes` · `material_norms` · `material_code_history` · `material_mapping_history` · `material_embeddings` |
| BOQ | `boq_versions` · `boq_source_items` · `project_boq_items` · `boq_material_components` · `boq_mapping_runs` · `boq_mapping_candidates` · `boq_mapping_audit` · `boq_change_history` · `boq_import_batches` · `boq_price_import_batches` · `boq_price_import_items` |
| Mua hàng | `material_requests` · `material_request_items` · `material_mar_approvals` · `purchase_orders` · `purchase_order_items` · `suppliers` · `supplier_materials` · `partners` · `procurement_allocations` |
| Kho / tồn kho | `warehouses` · `warehouse_locations` · `stock_movements` · `stock_reservations` · `goods_receipts` · `goods_receipt_items` · `stock_issues` · `stock_issue_items` · `transfer_orders` · `transfer_order_items` · `central_returns` · `central_return_items` · `material_returns` · `material_return_items` · `stock_counts` · `stock_count_items` |
| Sở hữu kế toán | `contract_stock_ledger` · `contract_ownership_transfers` · `contract_stock_reconciliations` |
| Phê duyệt / quy trình | `approvals` · `approval_stage_catalog` · `approval_stage_decisions` · `approval_project_assignments` · `approval_email_recipients` · `workflow_definitions` · `workflow_steps` · `workflow_step_approvers` · `supply_workflow_steps` · `task_sla_policies` |
| Công việc | `work_items` · `work_item_comments` · `work_item_participants` · `work_item_events` · `task_notifications` |
| Nhân sự / đội | `teams` · `team_members` · `team_subcontracts` · `team_payments` · `team_production_records` · `team_settlements` · `hr_records` · `labor_contracts` · `benefit_records` · `production_reports` |
| Tài chính | `accounting_vouchers` · `cashbook_entries` · `bank_accounts` · `payment_plans` · `contract_payments` · `advance_requests` · `capital_recovery_records` · `site_expense_claims` |
| Dự án / thi công | `project_archives` · `project_close_checks` · `construction_daily_logs` · `construction_daily_log_items` · `site_expense_claims` · `seal_management` · `legal_documents` · `official_correspondence` · `contract_reviews` · `contract_review_logs` |
| Người dùng / quyền | `users` · `sessions` · `user_project_scopes` · `user_module_permissions` · `department_module_permissions` · `user_warehouse_scopes` · `role_catalog` · `business_role_*` |
| Audit / thông báo / email | `audit_logs` · `error_reports` · `request_comments` · `attachments` · `notification_configs` · `notification_config_targets` · `notification_user_states` · `email_outbox` · `email_settings` |
| Cấu hình động | `form_field_config` · `custom_field_values` · `ui_display_settings` |
| Trust / license | `vntech_product_identity` · `vntech_trust_settings` · `vntech_trust_audit` · `vntech_license_installations` · `vntech_license_transfer_requests` · `vntech_release_signatures` · `vntech_attestation_events` · `server_deployment_metadata` |
| Kỹ thuật | `flyway_schema_history` · `backup_csl_20261006` · `backup_ump_20261006` · `backup_ump_20261006b` |

### 5.4 Số dòng ĐO ĐƯỢC của các bảng chính

Lệnh: `SELECT COUNT(*) FROM <bảng>;` (MySQL `vntech_erp`, chỉ đọc) — đo 08/10/2026.

| Bảng | Số dòng | Bảng | Số dòng |
|---|---|---|---|
| `users` | **73** | `purchase_orders` | **31** |
| `projects` | **5** | `goods_receipts` | **36** |
| `user_project_scopes` | **37** | `stock_issues` | **33** |
| `warehouses` | **12** | `stock_movements` | **105** |
| `warehouses` có `project_id IS NOT NULL` | **10** | `stock_reservations` | **0** |
| `materials` | **237** | `contract_stock_ledger` | **178** |
| `material_requests` | **91** | `audit_logs` | **4.307** |
| `user_module_permissions` | **2.772** | `work_items` | **27** |
| `department_module_permissions` | **481** | `email_outbox` | **12** |

### 5.5 Bất biến kho/dự án — dùng làm cổng kiểm hồi quy

```
warehouses = 12  ·  projects = 5  ·  warehouses có project_id IS NOT NULL = 10
```
📌 Bộ số **12 / 5 / 10** được dùng làm **bất biến** trong nhật ký nhiều phiên (khớp `W-02-AUDIT`, xác nhận lại trong `DEV-20261008-007`).
⚠️ **Cảnh báo vận hành (đo được, `BUG-20261008-007`)**: một probe đã **xoá liên kết dự án của một kho THẬT** ⇒ cổng `W-02` ĐỎ.
⇒ ⛔ **Probe/diễn tập phải chạy trên dữ liệu tạm và phải khôi phục**; ⛔ không thao tác ghi lên kho thật để đo.

### 5.6 Điểm thiết kế cốt lõi

- **Tách tồn vật lý (warehouse) khỏi sở hữu kế toán (contract):** `procurement_allocations` + `contract_stock_ledger` truy vết MR→PO→GRN→BOQ tới từng hợp đồng (multi-contract có thể cùng sở hữu một mã vật tư).
- **Giữ chỗ tồn kho (stock reservation):** `stock_reservations` giữ chỗ theo **phiếu đề nghị** (`request_id`) **và** theo **phiếu xuất** (`issue_id`, thêm bởi `V39`); cột thêm **NULLABLE** ⇒ ⛔ không phá dữ liệu cũ. Hiện bảng **0 dòng** (đo được).
- **Approval flow động:** `approval_stage_catalog` + `approval_project_assignments`; phiếu **không thuộc dự án** (`project_id` NULL/`''`) luôn nhìn thấy và duyệt được.
- **Audit trước/sau:** thay đổi dữ liệu ghi cả giá trị trước và sau (`audit_logs` — 4.307 dòng).
- **Cấu hình động:** `form_field_config` điều khiển `visible/required/importable/exportable/editable` theo form key.

---

## 6. THÀNH PHẦN NGHIỆP VỤ NỔI BẬT

| # | Thành phần | Bằng chứng đo được |
|---|---|---|
| 1 | **Material Matching V2** | `java-backend/domain/src/main/java/com/vntech/erp/domain/service/MaterialMatcherV2.java` — **417 dòng**, có test riêng `MaterialMatcherV2Test.java` (94 dòng); dữ liệu: `material_embeddings` · `material_aliases` · `boq_mapping_candidates` |
| 2 | **BOQ Workspace** | Nhóm bảng `boq_*` (**11 bảng** — §5.3); use-case `BoqManagementUseCase` |
| 3 | **Kho vật tư — HUB** | `app/screens/Inventory.tsx` + `lib/warehouse-hub.ts`; `TASK-226` (hub 3 tab · màn chi tiết kho 5 tab · gom menu) — đã `VERIFIED` theo `SESSION_REGISTRY.md` |
| 4 | **Danh mục vật tư 3 tab** | `app/screens/MaterialCategoryList.tsx` (mới) + `MaterialListTable.tsx`; `TASK-227` |
| 5 | **Bulk import người dùng / dự án** | `lib/admin-bulk-import.ts` (341 dòng): `USER_BULK_HEADERS` = **12 cột** · `PROJECT_BULK_HEADERS` = **9 cột** |
| 6 | **Form động** | Bảng `form_field_config` + `custom_field_values` |
| 7 | **Báo lỗi người dùng** | `app/screens/ErrorReportModal.tsx` + `ErrorReportAdminPanel.tsx`; bảng `error_reports`; use-case `ErrorReportUseCase`; `BUG-20261006-001` đã đóng (commit `b5ca4cc`) |
| 8 | **Uỷ nhiệm quản trị (mô hình tài khoản uỷ nhiệm)** | Người được cấp `admin` / `admin_tab_*` (`can_view=1`, còn hạn) nhận dữ liệu **lọc theo phạm vi** — quy tắc **U-1**, xem §7.2 |
| 9 | **Trust Lock / License** | 8 bảng `vntech_*`; `trustMode = development` · `licenseEnforcement = false` · `privateKeyPresent = false` (nguồn: `VNTECH_FINGERPRINT.json`) ⇒ **chưa enforce**, ⛔ không có private key trong source |
| 10 | **Work Center / Kanban / Hierarchy** | `app/screens/WorkCenter.tsx` · `WorkKanban.tsx` · `WorkHierarchy.tsx` · `WorkDashboard.tsx`; bảng `work_items` (**27** dòng) |

📏 Mặt bằng giao diện: `app/**` có **67** tệp `.ts/.tsx`, trong đó `app/screens/` có **55** tệp; `app/page.tsx` = **3.718 dòng / 656.030 byte**.

---

## 7. AN TOÀN & TOÀN VẸN ⭐

### 7.1 ⭐⭐ HAI CƠ CHẾ TRONG `BootstrapDataAdapter.java` — PHẢI TÔN TRỌNG

> Tệp: `java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/BootstrapDataAdapter.java`
> — **2.127 dòng** · nguồn sự thật cho toàn bộ payload `bootstrap` (mọi thứ UI nhìn thấy).

**① Nhiều trường bootstrap CHỈ được gửi khi `admin === true`.**
📏 Đo được: `if (admin)` xuất hiện tại **L269 · L853 · L1257 · L1563**; và các khoá dạng `admin ? …` (theo `BUG-20261008-013` mở rộng: `projectAccessAll` · `adminPartners` · `allModulePermissions` · `userWarehouseScopes` · `emailRecipients` · `emailOutbox` · `workflowAssignments` …).
⇒ Hệ quả thật (đo bằng probe E2E): tài khoản **non-admin** từng nhận **`data.users = 0`**, `data.userScopes = 0` ⇒ ⛔ không quản trị được ai, dù đã được cấp quyền quản trị.

**② `blank(data, ...keys)` là CƠ CHẾ AN NINH — GHI ĐÈ VÔ ĐIỀU KIỆN, ⛔ KHÔNG ĐƯỢC ĐỔI NGỮ NGHĨA.**

```java
/** Xoá trắng một nhóm khoá về mảng rỗng — đúng cách JS gán `result.<khoá> = []`. */
private static void blank(Map<String, Object> data, String... keys) {     // L2124
    for (String key : keys) data.put(key, List.of());
}
```
📏 Đo được: định nghĩa tại **L2124**; **16** điểm gọi `blank(` trong tệp.

| # | Cách làm | Kết quả ĐO ĐƯỢC | Kết luận |
|---|---|---|---|
| 1 | Nạp dữ liệu **TRƯỚC** `blank(...)` | ⛔ `soUsers = 0` **dù SQL trả đúng 8 tài khoản** — `blank` xoá sạch | ❌ SAI |
| 2 | Sửa `blank` thành «chỉ điền khi THIẾU» | ⛔ **LÀM ĐỎ test an ninh** `RequestOverdueReasonTest` MT2-P4-02 («user cấp THẤP ⛔ không được thấy vùng duyệt ⇒ **phải bị `blank`**») | ❌❌ TUYỆT ĐỐI KHÔNG |
| 3 | **Nạp dữ liệu mới SAU `blank(...)`** | ✅ dữ liệu sống sót; XANH toàn bộ cổng | ✅ **ĐÁP ÁN ĐÚNG** |

> 📌 **LUẬT (D-103):** muốn thêm dữ liệu cho **non-admin** ⇒ **NẠP SAU lệnh `blank(...)`**. `blank` là **an ninh**, ⛔ không phải tiện ích.

### 7.2 ⭐ QUY TẮC `U-1` — người uỷ nhiệm nhận dữ liệu **LỌC THEO `ctx.visibleProjectIds()`**

**Quyết định (user chốt 08/10/2026, `BUG-20261008-013`):** người **được uỷ nhiệm quản trị** — non-admin **CÓ** quyền nhóm quản trị (`admin` / `admin_tab_*`, `can_view=1`, **còn hạn**) — được nhận `users` · `adminProjects` · `userScopes`, nhưng **LỌC THEO PHẠM VI của chính họ** (`ctx.visibleProjectIds()`), ⛔ **KHÔNG** toàn bộ như admin và ⛔ **KHÔNG** mở cho nhân viên thường.

📏 Vị trí thi hành: khối U-1 tại **L1928–L1986**, đặt **SAU** `blank(...)` ở **L1924–L1926**; điều kiện `if (!admin)` + truy vấn `user_module_permissions` … `module_key='admin' OR module_key LIKE 'admin_tab_%'` (dùng **đúng khuôn** truy vấn `modulePermissions` sẵn có).

| Đối tượng nhận | Nội dung |
|---|---|
| `users` | **chính mình** ∪ **người cùng dự án trong phạm vi** (`ups2.project_id IN (<visibleProjectIds>)`) |
| `adminProjects` | chỉ dự án trong phạm vi (`pids` rỗng ⇒ trả `[]` — an toàn) |
| `userScopes` | chỉ scope thuộc dự án trong phạm vi |
| ⛔ **GIỮ admin-only** (U-1 ⛔ không áp) | `allModulePermissions` · `emailOutbox` · `emailRecipients` — **vẫn nằm trong `blank(...)`** ⇒ giữ nguyên an ninh |

**Nghiệm thu đo runtime (⛔ không chỉ đọc mã):**

| Phép đo | Trước | **Sau** |
|---|---|---|
| `data.users` của người uỷ nhiệm (non-admin, vai trò `ksda`) | ⛔ **0** | ⭐ **12** |
| `data.userScopes` | ⛔ **0** | ⭐ **12** |
| Dòng bảng tài khoản · nút «Sửa tài khoản» | 1 · 0 | ⭐ **12 · 12** |

Cổng đã xanh sau U-1: Java `mvn -B test` **88/88** · probe E2E `probe-grant-1-perm-e2e.mjs` **17/17 ĐẠT** · cổng FE **955 test · 954 pass · 0 fail** · cổng UI **6/6 bundle đúng byte** · CSDL kho **12 / 5 / 10**. Commit thi hành: **`3cfbd75`** (`unity`).

> ⚠️ **PHẠM VI U-1 CÒN LẠI** (chưa áp): `userWarehouseScopes` · `engineRoleProfiles` · `adminSuppliers` / `adminPartners` ⇒ **cần xác minh** trạng thái trước khi tuyên bố «đã mở đủ cho uỷ nhiệm».

### 7.3 Vân tay & cổng chuỗi build

**Giá trị SSOT hiện tại** (`lib/vntech-identity-data.mjs` — khớp `VNTECH_FINGERPRINT.json`):

| Khoá | Giá trị |
|---|---|
| `sourceFingerprintShort` | `VNTECH-FP-BB706F1202490077` |
| `sourceFingerprint` | `bb706f12024900770b0cdefd691c0a7c5d775b29fece3153ea5372d7bc424454` |
| `brandFingerprint` | `c6990f5fcb1c57a42f432747c04780c92d7eb186b8012172fff83c90ba6ca994` |
| `releaseFingerprint` | `e41f1239b83d0daa293d6a3e2ac771fc8ecfa07cf705da4b1db1c05490ac0991` |
| `trustMode` / `licenseEnforcement` / `privateKeyPresent` | `development` / `false` / `false` |

⚠️ **Khác bản 23/09/2026:** tài liệu cũ ghi `31cb2728… / f7867695… / add41b0f…` — **đã cũ**. ⛔ Luôn đọc giá trị từ 2 tệp SSOT trên (hoặc chạy gate), ⛔ không dựa bản chụp cũ trong README.

**Chuỗi cổng build:** preflight-source → css-baseline-audit → verify-vntech-fingerprint → master-baseline-gate → release-static-gate.
**CSS baseline:** chặn thêm style sau marker `VNTECH_MASTER_BASELINE_CSS_R1_1_1_END`.
**Quét cấm:** secret/PEM/`.key`/`.p12`/`.pfx` trong source; artifact `node_modules`/`dist`/`.env` trong gói.

⚠️ **LUẬT SỐ 1 (đã xảy ra 2 lần):** sửa mã ⇒ **vân tay đổi** ⇒ `npm run build` FAIL → phải chốt lại bằng `node tools/fixpoint-fingerprint.mjs` (chạy **2 vòng phải bất động**) → thêm **migration identity metadata-only** trong `drizzle/` → **chạy lại fixpoint** (thêm migration ⇒ vân tay đổi **lần nữa**) → build → áp migration (⚠️ **backup `.local-data` trước**) → khởi động lại `scripts/local-server.mjs`.
⚠️ **Thứ tự bắt buộc:** **BUILD TRƯỚC**, restart **SAU** — ⛔ không gộp «dừng service + build + start» vào một lệnh dài (đã từng làm UI chết + JAR hỏng 0,1 MB).

### 7.4 Cổng kiểm phục vụ UI

```
node tools/verify-ui-build-applied.mjs --port=8787
```
⇒ phải thấy `✓ byte 6/6` + `KET LUAN: BAN CHAY DUNG BAN DA BUILD MOI NHAT`.
📌 Bài học đã trả giá: bundle minify lưu **tiếng Việt RAW** (⛔ không escape `\u1ECD`), và Next.js nạp JS bằng **`<link rel="modulepreload" href="…">`** (⛔ không chỉ `<script src>`).
⇒ ⛔ **KHÔNG** kết luận «do cache trình duyệt» khi **chưa chứng minh bundle chứa bản vá**; ⛔ kết luận từ số vô lý (VD tổng ký tự CSS = 4) — đó là **dấu hiệu phép đo hỏng**, ⛔ không phải code thiếu.

---

## 8. SỰ KIỆN NỀN & WORKER

📏 Đo được: `java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/worker/` có **2** worker.

| Worker | Số dòng | Nhịp | Việc làm | Trạng thái |
|---|---|---|---|---|
| **`EmailOutboxDispatchWorker`** | **190** | `@Scheduled(fixedDelay = 60_000, initialDelay = 60_000)` | Gửi email từ `email_outbox` (**12** dòng) | ✅ `BUG-20261008-004` **FIXED + VERIFIED** — trước đó ném `NumberFormatException` **mỗi 60 giây** ⇒ ⛔ không gửi được email nào; đã có test `EmailOutboxDispatchWorkerTest.java` |
| **`SlaComplianceWorker`** | **50** | theo lịch Spring | ① `supply_workflow_steps` pending quá `due_at` → `status='overdue'` ② `payment_plans` planned quá hạn → `overdue` ③ đếm BCH chờ xác nhận | ⚠️ Có `try/catch` **bỏ qua lượt lỗi** và ghi `log.warn(...)` ⇒ lỗi **không làm chết** tiến trình. ⚠️ Tài liệu cũ ghi «báo lỗi SQL mỗi giờ (`TASK-025`)» — **cần xác minh** trạng thái hiện tại (mã hiện không còn câu `UPDATE … status='overdue'` viết trực tiếp trong worker mà gọi qua adapter `store.markStepOverdue` / `store.markPaymentPlansOverdue`) |

**Bootstrap dữ liệu nền:** `BootstrapDataAdapter` (đọc) + `BootstrapUseCase` (điều phối) khởi tạo danh mục chuẩn, role, action registry và dựng payload `bootstrap` khi khởi động / khi `GET /api/system`.

---

## 9. HẠN CHẾ ĐÃ BIẾT (`BUG-20261008-0xx`)

Nguồn: `docs/dsh-mutil-session/SESSION_A/BUG_HOTFIX_LOG.md` (**1.219 dòng**) + `docs/dsh-state/SESSION_REGISTRY.md`.

### 9.1 Bảng tổng hợp

| Mã | Mức | Nội dung | Trạng thái |
|---|---|---|---|
| `BUG-20261008-001` | 🚨 | «Bấm Lưu không lưu được quyền» ở modal phân quyền (mất 16 khoá) | ✅ **VERIFIED** (UI thật — log L475) |
| `BUG-20261008-002` | 🚨 **CRITICAL (bảo mật)** | Người có `admin_tab_06` **tự leo thang** tới `factory_reset_execute` (XOÁ DỮ LIỆU) | ✅ Đã xử lý (`CHG-20261008-002` PA-1 · `DEC-20261008-001/002`) |
| `BUG-20261008-003` | 🟠 | ⛔ Không cấp được quyền vào «Quản lý hệ thống» từ giao diện (ma trận thiếu dòng module `admin`) | ✅ **ĐÃ VÁ + VERIFIED** (log L708) |
| `BUG-20261008-004` | 🟠 | Worker email ném `NumberFormatException` mỗi 60 giây ⇒ ⛔ không gửi được email | ✅ **FIXED + VERIFIED** |
| `BUG-20261008-005` | 🟠 | M-2 mở cổng ⇒ **lộ 14 tab quản trị** cho người chỉ có 1 quyền | ✅ **ĐÃ VÁ + VERIFIED** |
| `BUG-20261008-006` | 🟠 | Gate bước quản trị đọc **SAI NGUỒN QUYỀN**; nút khoá ⛔ không nhìn thấy | ✅ **ĐÃ VÁ + VERIFIED** |
| `BUG-20261008-007` | 🚨 | **Sự cố do phép đo**: probe xoá liên kết dự án của một **kho THẬT** ⇒ cổng `W-02` ĐỎ | ✅ Đã khôi phục (bất biến **12 / 5 / 10** khớp lại) |
| `BUG-20261008-008` | 🟠 | `hasAdminTab` **luôn false cho non-admin** ⇒ quyền uỷ nhiệm vô hiệu | ✅ **ĐÃ VÁ + VERIFIED** |
| `BUG-20261008-009` | — | 4 cổng `page.tsx` liên quan uỷ nhiệm | ⚠️ **Chỉ được NHẮC trong log** (không có mục riêng) ⇒ **cần xác minh** nếu cần chi tiết |
| `BUG-20261008-010` | 🟠 **HIGH** | 2 action đáng lẽ **ADMIN-ONLY** bị **NỚI QUYỀN** ⇒ cổng `TM-04` ĐỎ | 🔴 **OPEN** — chờ `ERP-SESSION-03` |
| `BUG-20261008-011` | 🔴 **CRITICAL** | BACKEND DOWN do `V39` ⛔ **không idempotent** (Flyway FAILED) | ⚠️ **Đã khôi phục dịch vụ**, ⚠️ **khuyến nghị CHƯA thi hành** |
| `BUG-20261008-012` | 🟠 | 2 test Java lỗi vì `schema-h2.sql` thiếu gương `issue_id` | ✅ **FIXED** ⇒ `mvn test` **88/88** |
| `BUG-20261008-013` | 🟠 **HIGH (chính sách)** | Mô hình «tài khoản uỷ nhiệm» bị chặn ở **tầng dữ liệu** (`data.users = 0`) | ✅ **FIXED + VERIFIED** qua **U-1** (§7.2) — commit `3cfbd75` |

### 9.2 Chi tiết 2 mục còn mở / còn rủi ro

**① `BUG-20261008-010` — 🟠 OPEN (⛔ không thuộc ERP-SESSION-01).**
`ActionRbacRegistry` đã **nới quyền** cho `set_project_team_status` và `delete_project_team` (thêm module `site_command`, đổi capability `canUse → canEdit`) ⇒ **mâu thuẫn với chú thích ngay trong chính tệp** (`ActionRbacRegistry.java` dòng 96 ghi «⛔ KHÔNG nới cho 2 action còn lại») ⇒ cổng `tests/tm04-team-crud.test.mjs` **ĐỎ**.
⇒ Cần `ERP-SESSION-03` chốt **(a)** trả về ADMIN-ONLY, hoặc **(b)** nếu cố ý mở thì **cập nhật chú thích + test kèm lý do**. ⛔ Không để mã và cổng đá nhau.

**② `BUG-20261008-011` — 🔴 rủi ro còn nguyên trong mã.**
📏 Đo lại hôm nay: `V39__session02_stock_reservation_issue_id.sql` (**38 dòng**) **vẫn** dùng `ALTER TABLE ... ADD COLUMN` **trần** + `CREATE INDEX` (L30–L34) — ⛔ chưa có `INFORMATION_SCHEMA` guard.
⚠️ Hệ quả: **mọi máy/CSDL đã có cột `issue_id`** sẽ ⛔ **chết ở lần khởi động kế tiếp** (`Duplicate column name 'issue_id'` ⇒ Flyway đánh `success=0` ⇒ Spring Boot từ chối khởi động, **kể cả JAR cũ**).
📌 Hiện trạng CSDL: cột `issue_id varchar(64) NULL` **đã tồn tại**, `flyway_schema_history` có `V39 success=1` (`success=0` = **0**) ⇒ dịch vụ đang chạy bình thường. ⚠️ Cách khôi phục đã dùng chỉ sửa **lịch sử Flyway**, ⛔ **không** sửa tệp migration của phiên khác.

### 9.3 Nợ kỹ thuật khác (đo được)

| Hạng mục | Trạng thái (đo 08/10/2026) |
|---|---|
| **Monolith JS** | `scripts/system-route.mjs` = **3.429 dòng** · `app/page.tsx` = **3.718 dòng / 656.030 byte** (bản 23/09 ghi ~2.900/~2.916 ⇒ **đã tăng**). Tách file là lộ trình dài hạn (`docs/04_KE_HOACH_PHAT_TRIEN.md`) |
| **Màn «ĐANG PHÁT TRIỂN»** | `DEVELOPMENT_MODULES` (`app/page.tsx:1083`) = **25 khoá module** (nhóm `dept_plan_*` và `dept_project_*`) — bản 23/09 ghi 15 màn ⇒ **đã tăng**. Có component `DevelopmentNotice` + `DevelopmentModule` |
| **Bảng sao lưu kỹ thuật** | `backup_csl_20261006` · `backup_ump_20261006` · `backup_ump_20261006b` — **3 bảng dư** còn nằm trong CSDL (đo qua `information_schema`) ⇒ nên có kế hoạch dọn/đặt tên rõ |
| **Không có down-migration** | ⛔ Không có `U__`/rollback ở cả hai dòng DB — **chỉ append**, phù hợp quy trình (⛔ không phải lỗi) |
| **`V36` khuyết** | Không có ở cả mã lẫn lịch sử Flyway ⇒ **cần xác minh** lý do nếu muốn đánh số liền mạch |
| **`BUG-20261008-012` gương H2** | `java-backend/web/src/test/resources/schema-h2.sql` **dòng 1668** đã có `` `issue_id` VARCHAR(64) NULL `` — ⚠️ **đúng tệp**; ⛔ **KHÔNG** sửa nhầm `web/src/main/resources/db/demo/schema-h2.sql` (bài test ⛔ không dùng tệp đó) |

### 9.4 Đa phiên — vùng xung đột thật

| # | Vùng | Luật |
|---|---|---|
| ① | `docs/dsh-state/{CHECKLIST,CURRENT_STATE,SESSION_REGISTRY}.md` | **Cả hai phiên đều ghi** ⇒ ⛔ **KHÔNG ghi đè cả tệp** — chỉ `edit` đoạn của mình, thêm mục mới ở **CUỐI tệp**; **`read` lại trước khi sửa** |
| ② | `VNTECH_FINGERPRINT.json` + `lib/vntech-identity-data.mjs` | **Tự sinh lại mỗi lần build** ⇒ ⛔ không `git checkout`; nếu commit thì commit luôn |
| ③ | `dist/` (gói build phục vụ) | Hai phiên build ⇒ **ghi đè lẫn nhau** ⇒ sau build **phải** restart đúng PID + chạy `verify-ui-build-applied.mjs` |

📏 Trạng thái git đo được: HEAD **`3cfbd75`** trên nhánh **`unity`**, **80** đường chưa commit (⚠️ trong đó có tệp của **cả hai phiên**).
⚠️ Luật đã trả giá: ⛔ **KHÔNG** `git add -A` trong repo đa phiên (gom việc của phiên khác) · ⛔ **KHÔNG** `git reset --hard` / `git checkout .` / `git clean -fd` · ⛔ **KHÔNG** `Stop-Process node` hàng loạt (chỉ dừng theo **PID đã xác minh cmdline**) · ⛔ ⛔ **KHÔNG** kill 2 tiến trình `java.exe` của **dự án khác** («Phan mem Purchasing»).

---

## 10. PHỤ LỤC — BẢNG SỐ ĐO TỔNG HỢP & CÁCH TÁI LẬP

| # | Số đo | Giá trị | Lệnh tái lập |
|---|---|---|---|
| 1 | Module Maven | 4 | `Select-String java-backend/pom.xml -Pattern '<module>.*?</module>' -AllMatches` |
| 2 | Tệp `.java` toàn backend | **166** | `(Get-ChildItem java-backend -Recurse -File -Filter *.java \| Measure-Object).Count` |
| 3 | `.java` `domain` / `application` / `infrastructure` / `web` | **9 / 70 / 46 / 41** | `Get-ChildItem java-backend/<m> -Recurse -File -Filter *.java \| Measure-Object` |
| 4 | `*UseCase.java` | **24** | `Get-ChildItem java-backend -Recurse -File -Filter '*UseCase.java' \| Measure-Object` |
| 5 | Interface `port/out` | **33** | `Get-ChildItem java-backend/application/src/main/java/com/vntech/erp/application/port/out -File -Filter *.java \| Measure-Object` |
| 6 | `case "…"` trong `SystemController` | **261** | `Select-String java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java -Pattern 'case\s+"' -AllMatches` |
| 7 | Dòng `SystemController.java` | **1.822** | `(Get-Content <tệp>).Count` |
| 8 | Dòng `BootstrapDataAdapter.java` | **2.127** | `(Get-Content <tệp>).Count` |
| 9 | Điểm gọi `blank(` trong `BootstrapDataAdapter` | **16** | `Select-String <tệp> -Pattern '\bblank\(' -AllMatches` |
| 10 | `if (admin)` trong `BootstrapDataAdapter` | **4** (L269 · L853 · L1257 · L1563) | `Select-String <tệp> -Pattern 'if \(admin\)'` |
| 11 | Worker nền | **2** | `Get-ChildItem java-backend -Recurse -File -Filter '*Worker*.java'` |
| 12 | Tệp migration SQL | **38** | `Get-ChildItem java-backend/infrastructure/src/main/resources/db/migration -File -Filter *.sql \| Measure-Object` |
| 13 | Flyway `success=1` / `success=0` | **38 / 0** | `SELECT COUNT(*) FROM flyway_schema_history WHERE success=1;` (và `=0`) |
| 14 | Bảng trong `vntech_erp` | **134** (0 VIEW) | `SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='vntech_erp';` |
| 15 | Bất biến kho/dự án | **12 / 5 / 10** | `SELECT COUNT(*) FROM warehouses;` · `... FROM projects;` · `... FROM warehouses WHERE project_id IS NOT NULL;` |
| 16 | `module_catalog` / `menu_group_catalog` | **76 / 12** | `SELECT COUNT(*) FROM module_catalog;` (và `menu_group_catalog`) |
| 17 | `app/**` tệp `.ts/.tsx` · `app/screens` | **67 · 55** | `Get-ChildItem app -Recurse -File -Include *.ts,*.tsx \| Measure-Object` |
| 18 | `app/page.tsx` | **3.718 dòng / 656.030 byte** | `(Get-Content app/page.tsx).Count` · `(Get-Item app/page.tsx).Length` |
| 19 | `scripts/system-route.mjs` | **3.429 dòng** | `(Get-Content scripts/system-route.mjs).Count` |
| 20 | `tests/*.test.mjs` | **158** | `Get-ChildItem tests -File -Filter '*.test.mjs' \| Measure-Object` |
| 21 | Module «ĐANG PHÁT TRIỂN» | **25** | `app/page.tsx:1083` — `DEVELOPMENT_MODULES` |
| 22 | Cổng đang phục vụ | `:8787` 200 · `:9000` 200 · `:18081/api/system` 401 | `Invoke-WebRequest http://127.0.0.1:<cổng>/` |
| 23 | Git | HEAD `3cfbd75` (`unity`) · 80 đường chưa commit | `git log -1 --oneline` · `git status --short` |

---

### Nguồn tham khảo

`docs/01` · `docs/06_KIEN_TRUC_MUC_TIEU_JAVA_CLEAN_ARCH.md` · `docs/09` · `docs/10` · `docs/11` · `docs/13` ·
`docs/24_SYSTEM_AUDIT_REPORT.md` · `docs/25_TODO_ROADMAP.md` · `docs/28_DANH_SACH_110_MUC_MASTER_TASK.md` ·
`docs/agent-progress/MASTER_STATUS.md` · `docs/dsh-state/SESSION_REGISTRY.md` ·
`docs/dsh-mutil-session/SESSION_A/BUG_HOTFIX_LOG.md` · `docs/agent-progress/TASK-226.md` · `docs/agent-progress/TASK-227.md`.

---
*Tài liệu thuộc bộ tài liệu bàn giao hệ thống VNTECH ERP V5.3.0 — bản `ALPHA TEST` cập nhật 08/10/2026.*
*⛔ Tài liệu phản ánh bản ĐANG CHẠY, chưa phải bản phát hành chính thức. Mọi số liệu đều đo được — xem §1 và §10 để tái lập.*
