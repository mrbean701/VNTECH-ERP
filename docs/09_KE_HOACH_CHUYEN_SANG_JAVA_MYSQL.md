# KẾ HOẠCH CHUYỂN ĐỔI — VNTECH ERP: BACKEND JAVA (CLEAN ARCHITECTURE) + MYSQL, GIỮ NGUYÊN UI

Bản: v1.0 · Ngày: 02/2026 · Căn cứ: phân tích thực tế branch `unity` (commit `ab97b23`, V5.3.0 MASTER BASELINE R1.1.1) + chiến lược đã chốt tại `docs/06_KIEN_TRUC_MUC_TIEU_JAVA_CLEAN_ARCH.md`.

---

## 1. TÓM TẮT QUYẾT ĐỊNH (đã chốt với chủ dự án)

| # | Quyết định | Lựa chọn | Lý do |
|---|---|---|---|
| 1 | Chiến lược chuyển đổi | **Strangler Fig — chuyển dần từng lát cắt dọc** | Hệ JS đang chạy tốt, giữ làm *reference implementation*; luôn có hệ dùng được; đúng tinh thần doc 06 (không refactor monolith JS) |
| 2 | Kiến trúc backend | **Java + Clean Architecture** (Domain → Application → Infrastructure → Web) | Domain không phụ thuộc framework/DB; ports do use-case định nghĩa; test unit thuần |
| 3 | Database | **MySQL 8.4 (LTS)** — tầng infrastructure | Chỉ là 1 adapter trong Clean Arch; đổi được sau |
| 4 | Tầng dữ liệu Java | **Spring Data JPA (Hibernate) + Flyway** | Đã chốt: JPA cho CRUD tự nhiên; SQL phức tạp (CTE/subquery) dùng native query; Flyway quản lý migration MySQL |
| 5 | Vị trí mã nguồn | **Thư mục `java-backend/` trong repo hiện tại** | Fingerprint gate của bản JS chỉ hash các thư mục `app/db/deploy/drizzle/lib/public/scripts/tests/worker` (+ file root) → `java-backend/` **không** làm vỡ fingerprint; JS reference giữ nguyên |
| 6 | Frontend | **Giữ nguyên 100%** (`app/page.tsx` SPA, CSS, assets) | Hợp đồng API được tái lập chính xác; UI không sửa đến khi backend ổn định |
| 7 | Ngôn ngữ thời gian chạy | **Java 21 (LTS) + Spring Boot 3.5.x** | (Spring Boot 4.x có thể cân nhắc sau; 3.5 là lựa chọn ổn định) |
| 8 | Build tool | **Maven 3.9+ (multi-module)** — ✅ ĐÃ CHỐT 02/2026 | Phổ biến, đơn giản; settings-dev.xml riêng cho máy sandbox |

---

## 2. PHÂN TÍCH HIỆN TRẠNG (đo đạc thực tế branch `unity`)

### 2.1 Cấu trúc & quy mô

| Thành phần | File / vị trí | Quy mô thực tế | Vai trò |
|---|---|---|---|
| Frontend SPA | `app/page.tsx` | **700 KB / ~2.070 dòng (1 file)** | Toàn bộ UI, ~61 module; gọi backend qua `POST /api/system {action}` + `GET /api/system` (bootstrap) + `/api/files` |
| CSS | `app/globals.css` | 403 KB, ~4.950 `!important` | Tailwind; bị fingerprint gate bảo vệ chặt |
| Backend SSOT | `scripts/system-route.mjs` | **618 KB / 3.156 dòng** | GET (bootstrap khổng lồ) + POST (~135+ action write, if-chain) |
| Schema Drizzle | `db/schema.ts` | 453 dòng (~67 bảng — KHÔNG đầy đủ) | Chỉ là tham chiếu; 114 bảng thật nằm trong migration |
| Migrations | `drizzle/0000..0075` | **76 file SQL, 114 bảng** | Di sản dialect SQLite/PG; timestamp TEXT; id text `prefix_uuid` |
| Server runtime | `scripts/universal-server.mjs` | 9,6 KB | Node http server: `/healthz`, `/api/health`, proxy `/api/system`, `/api/files`, phục vụ static SPA, dispatch email outbox, login lockout |
| Deploy | `deploy/docker-compose.yml` + Caddy | postgres:16 + redis:7 + app | Production hiện tại |

### 2.2 Hợp đồng API phải tái lập chính xác (để UI không đổi)

1. **`GET /api/system`** → `{ok:true, setupRequired:true}` (chưa có user) | `{ok:false, authenticated:false}` 401 | `{ok:true, authenticated:true, data: bootstrap(user)}`. **`bootstrap()` (bắt đầu dòng 545) là khối query lớn nhất hệ thống** — requests + approvals + items + custom fields, teams, warehouses, materials + aliases, inventory (CTE balances/reservations), PO + items, receipts + items, issues… key camelCase.
2. **`POST /api/system`** body `{action, ...payload}` → `{ok:true, ...result}`; lỗi: `{ok:false, error:"<tiếng Việt>"}` + status 400/401/**403**/409/**428** (mustChangePassword)/429 (lockout)/500 (mã lỗi `ERP-XXX-DB`). Cookie `mep_session` (sha256 token, 24h).
3. **`/api/files`** — upload/list/download/delete theo `entityType/entityId/projectArchive`; multipart; SSOT tại `app/api/files/route.ts`.
4. **Login lockout**: 10 lần sai / 15 phút (Redis) → 429.
5. **Email**: bảng `email_outbox` + dispatcher 30s + SMTP.
6. **Mật khẩu**: PBKDF2-SHA256 600.000 vòng → **tương thích Java `PBKDF2WithHmacSHA256`** → người dùng không phải đổi mật khẩu.
7. **Headers xác thực sản phẩm** (`x-vntech-*`) — có thể giữ/có thể bỏ (quyết định Phase 0; khuyến nghị bỏ cho bản Java, theo doc 06).

### 2.3 Mô hình dữ liệu (114 bảng → MySQL)

| Nhóm | Số bảng | Đại diện | Ưu tiên migrate |
|---|---|---|---|
| Master data | ~26 | projects, project_contracts, boq_versions, suppliers, teams, materials, categories, role_catalog, org units | **Slice 2** |
| Kho / tồn kho | ~23 | warehouses, stock_movements, goods_receipts, stock_issues, transfer_orders, central_returns, **contract_stock_ledger, procurement_allocations** | **Slice 6** |
| Mua hàng | ~6 | material_requests, material_request_items, purchase_orders, approvals | **Slice 3–4** |
| BOQ / mapping | ~21 | project_boq_items, boq_source_items, material_embeddings, boq_mapping_candidates | **Slice 5** |
| Security/audit | ~17 | users, sessions, user_project_scopes, user_module_permissions, audit_logs, email_outbox | **Slice 1–2** |
| Trust/license | ~7 | vntech_product_identity, vntech_trust_settings, vntech_license_installations | **Slice cuối** |

> ⚠️ Điểm thiết kế cốt lõi phải giữ: **tách tồn vật lý (warehouse) khỏi sở hữu kế toán (contract)** qua `procurement_allocations` + `contract_stock_ledger` — lợi thế cạnh tranh, không được làm mất khi sang MySQL.

### 2.4 Action Catalog (mở khóa từ chính source)

`system-route.mjs` đã có sẵn `ACTION_MODULE` (action → module) và `ACTION_CAPABILITY` (action → canView/canCreate/canEdit/canApprove/canUse) ở dòng 10–32 → **tự động sinh Action Catalog** làm service boundary cho Strangler Fig. ~135+ action write chia theo module:
dashboard · dept_plan_* · dept_project_* · dept_finance_* · dept_legal_* · site_command · project_progress · construction · production · capital_recovery · requests · approvals · purchasing · supplier_catalog · receiving · delivered · warehouse_receipt · warehouse_issue · inventory · material_norms · central_warehouse · material_catalog · boq · payments · teams · stocktake · reports · admin

---

## 3. KIẾN TRÚC MỤC TIÊU (JAVA CLEAN ARCHITECTURE + MYSQL)

### 3.1 Cấu trúc dự án Maven multi-module tại `java-backend/`

```
java-backend/
├── pom.xml                        # parent: Spring Boot 3.5.x, Java 21
├── domain/                        # KHÔNG phụ thuộc framework/DB
│   └── src/main/java/vntech/erp/domain/
│       ├── entity/                # Project, Material, MaterialAlias, PurchaseOrder,
│       │                          #   Approval, StockMovement, ContractStockLedger, MaterialNorm, Advance...
│       ├── valueobject/           # Money, Quantity, ApprovalStage, VatCode, MeCode...
│       ├── service/               # Domain services: MaterialMatcherV2, StockLedgerEngine,
│       │                          #   ApprovalStateMachine(5 bậc + SLA), RecoveryChainEngine...
│       └── event/                 # Domain events: RequestApproved, GoodsReceived, StockMoved...
├── application/                   # Use-cases + ports (interface) — thuần, không import Spring/DB
│   └── src/main/java/vntech/erp/application/
│       ├── port/in/               # Use-case interfaces: CreateRequestUseCase, DecideApprovalUseCase...
│       ├── port/out/              # Repository ports: RequestRepository, ApprovalRepository,
│       │                          #   ContractStockLedgerRepository, EmailSenderPort, FileStoragePort...
│       └── service/               # Impl của use-case: phối hợp domain + ports
├── infrastructure/                # Mọi chi tiết kỹ thuật: JPA, MySQL, Redis, SMTP, POI, storage
│   └── src/main/java/vntech/erp/infrastructure/
│       ├── persistence/           # @Entity, Spring Data JPA repositories, mappers Entity↔Domain
│       ├── flyway/                # db/migration/V1__init.sql ... (sinh từ 114 bảng, dialect MySQL)
│       ├── redis/                 # login lockout, cache
│       ├── mail/                  # Spring Mail + email_outbox worker
│       ├── file/                  # multipart storage (thay /api/files)
│       ├── export/                # Apache POI (xlsx templates), CSV, PDF
│       └── licensing/             # Ed25519 verifier + vntech_product_identity (KHÔNG gate fingerprint file)
└── web/                           # Spring Boot app: REST, gateway action, serve static SPA
    └── src/main/java/vntech/erp/web/
        ├── controller/            # SystemController GET/POST /api/system, FilesController /api/files, HealthController
        ├── gateway/               # ActionGateway: action ∈ Java → use-case; ∉ → proxy sang JS legacy (Strangler)
        ├── security/              # Cookie session mep_session, PBKDF2, RBAC, lockout
        └── static/                # bản build SPA (dist) phục vụ cùng origin
```

### 3.2 Luồng request (Strangler Fig gateway)

```
Browser SPA ── POST /api/system {action} ──> Spring Boot
                                              ├─ ActionGateway
                                              │   ├─ action đã migrate → UseCase (application) → Domain → Repository (JPA/MySQL)
                                              │   └─ action chưa migrate → proxy HTTP → JS legacy server (tạm thời)
                                              └─ trả {ok:true,...} / {ok:false,error} ĐÚNG contract
```

### 3.3 Nguyên tắc Clean Architecture giữ vững

1. **Domain không import**: javax/jakarta.persistence, Spring, JDBC — chỉ Java thuần.
2. **Ports do application định nghĩa** → test unit domain/use-case không cần DB.
3. **JPA là adapter**: Entity JPA nằm ở infrastructure; mapper chuyển Entity ↔ Domain entity; nếu sau này đổi ORM/DB chỉ sửa adapter.
4. **SQL phức tạp** (CTE stock balances, subquery approve counts…) → native query trong repository adapter; JPA dùng cho CRUD tự nhiên.
5. **Mỗi slice = 1 milestone**: đóng gói, demo được, rollback được, không gộp slice.

---

## 4. LỘ TRÌNH TRIỂN KHAI (STRANGLER FIG)

Thứ tự slice theo phụ thuộc dữ liệu + UI: **Auth/Bootstrap → Master data → MR/Approval → Purchasing → BOQ → Kho → Production/Recovery → Finance → Legal/HR → Admin/System → Cutover**.

### Giai đoạn 0 — Nền tảng (ước 1–2 tuần, 1 dev)
> ✅ **TRẠNG THÁI 02/2026**: các mục 1, 3, 4, 5(khung), 6(baseline) đã hoàn thành trong đợt khởi đầu — xem `java-backend/README.md`.
1. ✅ Tạo `java-backend/` (Maven multi-module), Spring Boot 3.5 + Java 21, cấu hình `application.yml` (MySQL, Redis, multipart, mail). Build: `mvn -s java-backend/settings-dev.xml -f java-backend/pom.xml package` — **6 test pass** (5 domain + 1 baseline sanity).
2. ✅ Compose MySQL 8.4 + Redis 7 tại `java-backend/docker-compose.yml` (KHÔNG đặt trong `deploy/` vì thư mục đó bị fingerprint hash — không đụng cấu hình JS đang chạy).
3. ✅ **Action Catalog tự động** (`java-backend/tools/generate-action-catalog.mjs`) → `java-backend/ACTION_CATALOG.md` + `.json` — **174 action**, cột `migrated` = false.
4. ✅ **Data Model Reference** (`java-backend/tools/generate-data-model-reference.mjs`) → `java-backend/DATA_MODEL_REFERENCE.md` + `.json` — **114 bảng / 1.469 cột / 195 index / 65 FK** từ `drizzle/0000..0075` (không sửa file JS).
5. ✅ **Khung contract test** (`java-backend/contract-tests/contract-harness.mjs`): selfcheck + record:fixture + compare; golden snapshot bỏ qua key thời gian động. Bridge nối JS reference sẽ bổ sung khi Phase 1.
6. ✅ Flyway `V1__baseline.sql` sinh tự động (`java-backend/tools/generate-flyway-baseline.mjs`) — dialect MySQL 8.4: TEXT-timestamp → `DATETIME(3)`, `_date` → `DATE`, PK/FK text → `VARCHAR(64)`, boolean INT → `TINYINT(1)`, text DEFAULT → `VARCHAR(255)`, utf8mb4. ⏳ Cần validate bằng MySQL thật (Testcontainers) trên máy có Docker — sandbox này không chạy được daemon.
7. ⏳ CI (GitHub Actions) riêng cho `java-backend/` — mục còn lại; thêm khi chốt repo remote.

> ⚠️ **Ghi nhận fingerprint**: branch `unity` hiện tại **fail sẵn** `verify-vntech-fingerprint.mjs` (expected `54394992…`, actual `80c20e40…`) ngay cả khi không có `java-backend/` — đúng cảnh báo `docs/01 §5.4` (identity SSOT lệch source). Việc thêm `java-backend/` + `docs/09` **không làm thay đổi** fingerprint (thư mục mới không nằm trong danh sách hash `app/db/deploy/drizzle/lib/public/scripts/tests/worker`). Không sửa tay file identity — xử lý theo quy trình refresh riêng nếu cần release bản JS.

### Giai đoạn 1 — Auth & Bootstrap (ước 2–3 tuần) ⭐ quan trọng nhất
> ✅ **HOÀN THÀNH 09/2026**: `setup`, `login`, `logout`, `change_password`, `revoke_session`, `revoke_user_sessions`, `update_profile_avatar`; session `mep_session` (SHA-256, 24h), **lockout 10 lần/15 phút → 429** (in-memory fallback như JS), PBKDF2 tương thích 100% JS, **bootstrap(user) đầy đủ** (~30 khối, JdbcTemplate giữ alias camelCase → JSON khớp SPA), audit_logs (AuditLogPort), RBAC gate `requireActionModule` chuẩn bị. **31 test xanh** (16 AuthUseCase + 5 PBKDF2 + 4 HTTP + 5 domain + 1 baseline sanity). Action Catalog: **7/174 migrated**. Còn: serve static SPA (cần máy có Docker/MySQL chạy thật), `update_profile_avatar` đã có — kiểm chứng UI cuối khi có DB thật.
- Gate: contract test bootstrap + login + màn Dashboard.

### Giai đoạn 2 — Master data & Phân quyền (ước 1–2 tuần)
> ✅ **HOÀN THÀNH 09/2026**: RBAC (registry sinh tự động + RbacService + ModulePermissionStore) · Project (create/update/set_status + 11 close checks + delete_project cascade ~50 bảng) · User 7 action (org resolve, warehouse scope, department defaults, admin cuối cùng) · Role 3 action (rename cascade) · Org units 3 action (cây recursive) · Menu/Module 5 action · Form động 2 action · Warehouse locations · Contract 3 action (primary tự động, chặn ledger residual, XOA confirm) · **Business roles/scopes 7 action** (engine profile, scope CRUD chống trùng + chặn đang dùng, role group + scopes + sync base_role) · **Reorder 2 action** (menu layout bảo vệ admin group, form fields upsert). **43 test xanh, 44/174 action migrated** — màn Admin + màn Dự án sẵn sàng chạy trên Java.
- Gate: màn Admin (User/Role/Org/Menu/Form) + màn Dự án chạy trên Java — đạt được về mặt action; kiểm chứng UI thật khi có MySQL/Docker.

### Giai đoạn 3 — Requests & Phê duyệt 5 bậc (ước 1–2 tuần) ⭐ lõi nghiệp vụ — 🔨 ĐANG LÀM
> 🔨 **TIẾN TRIỂN 09/2026**: **`create_request` + `decide_approval`** (state machine: owner/RBAC check, all_roles decisions, reject→returned + comment, advance per stage + SLA, finalize→approved/awaiting_po + approved_purchase_qty + supply step + reservations) + **`update_returned_request`** (CHT sửa phiếu trả lại + comment) + **`resubmit_request`** (khởi động lại luồng duyệt, auto-approve bước 1 nếu cấu hình, xóa decisions cũ) + **`delete_request`** (chỉ returned/rejected, chặn khi phát sinh PO, cascade approvals/items/comments) + **`cancel_request`** (chỉ CHT/Admin, MR cần returned, cancel approvals pending + supply steps). Fix toàn hệ: H2 lowercase keys → `ciGet` case-insensitive cho mọi map đọc DB. **45 test xanh, 50/174 action migrated**.
- 🔲 Còn lại Phase 3: `preview_request_import`, email_outbox + SLA worker. Sau đó sang Phase 4 (Purchasing: create_po, receive_goods, confirm_delivery, close_po_line, suppliers).
- Gate: luồng MR → duyệt 5 bậc → SLA — luồng lõi hoàn tất (create + decide + lifecycle).
- Gate: màn Admin (User/Role/Org/Menu/Form) + màn Dự án chạy trên Java.

### Giai đoạn 3 — Requests & Phê duyệt 5 bậc (ước 1–2 tuần) ⭐ lõi nghiệp vụ
- `preview_request_import`, `create_request`, `update_returned_request`, `resubmit_request`, `delete_request`, `cancel_request`, `decide_approval`.
- Domain: **ApprovalStateMachine 5 bậc + SLA** (due_at, reminder, escalate), single-owner approval, custom fields request line, tổng hợp cộng dồn (requested/approved/ordered/received/remaining), audit.
- Email: sinh mail vào `email_outbox` + worker gửi qua Spring Mail.
- Gate: 1 luồng MR → duyệt 5 bậc → SLL đúng hạn/trễ → email.

### Giai đoạn 4 — Purchasing (ước 1–2 tuần)
> ✅ **HOÀN THÀNH 09/2026**: **Nhà cung cấp** (save/set_status/delete + PO-lock) · **`create_po`** (tách PO theo NCC, sequence PO, MAR check, availability override, allocations, workflow steps) · **`close_po_line`** (đóng thiếu + rollup PO/MR shortage) · **`receive_goods`** (GRN sequence, QC accept/reject, documents check, delivered_qty rollup, nextStatus delivered_pending_confirmation/partial, BCH confirmation step) · **`confirm_delivery`** (bắt buộc ảnh giao hàng, certificates/documents check, **posting: stock_movements idempotent + contract_stock_ledger GRN + received_qty rollup**, nextStatus completed/completed_with_exceptions, MR received_full_docs_pending/completed). **57/174 action migrated — toàn bộ chuỗi MR→PO→Nhận hàng→BCH xác nhận hoạt động.**
- Gate: MR → PO → Nhận hàng → BCH xác nhận → cập nhật tồn + ledger — **đạt được**.
- `create_po`, `close_po_line`, `receive_goods`, `confirm_delivery`, suppliers (`save_supplier`, `set_supplier_status`, `delete_supplier`), BCH confirmation, certificate/document status, rejected qty, `save_mar_approval`.
- Gate: MR → PO → Nhận hàng → BCH xác nhận → cập nhật tồn + ledger.

### Giai đoạn 5 — BOQ & Material Matching (ước 2–3 tuần)
> ✅ **HOÀN THÀNH 09/2026**: BOQ core (save_boq_version/save_boq_item/set_boq_item_status) · **MaterialMatcherV2** port nguyên trạng (embedding 96D FNV-1a + gate + 6-tiêu-chí, 9 unit test) · `compare_boq_materials` + `confirm_boq_material_mappings` (runs/candidates/audit/history/alias/components) · **`bulk_boq_item_action`** (archive/restore ≤5000 + history) · **`delete_boq_item`** (xóa mềm an toàn, chặn hard-delete khi liên kết) · **`clear_boq_version`** (archive/restore/purge + dependency guard + confirm XOA) · **`request_material_master_from_boq`** (đánh dấu new_material_requested, không tự tạo mã). **66/174 action migrated — Phase 5 xong**.
- Còn lại nhỏ: `replace_boq_items`, `update_boq_contract_prices`, import/export template (có POI), mapping actions done. Chuyển Phase 6 (Kho & contract_stock_ledger).
- `save_boq_version`, `save_boq_item`, `set_boq_item_status`, `bulk_boq_item_action`, `delete_boq_item`, `replace_boq_items`, `update_boq_contract_prices`, `clear_boq_version`, import/export template (POI), `compare_boq_materials`, `confirm_boq_material_mappings`, `request_material_master_from_boq`.
- **Port Material Matching V2 sang Java**: embedding 96 chiều (FNV-1a + hashing trick), 6 tiêu chí điểm, Candidate Gate, fallback Ollama/OpenAI embed. Đây là thuật toán có bản quyền nội bộ — port nguyên trạng sang domain service.
- Gate: màn BoqControl + Material Matching cho 1 dự án thật.

### Giai đoạn 6 — Kho & Tồn kho (ước 2–3 tuần) ⭐
> ✅ **HOÀN THÀNH 09/2026**: StockLedgerEngine · issue/return/install · transfer 4 action · central returns 3 action · stocktake 2 action · **`reconcile_contract_stock`** (CTE physical UNION owned, ghi contract_stock_reconciliations balanced/mismatch) · **`transfer_contract_ownership`** (chuyển ownership giữa 2 Contract active cùng kho, chặn thiếu tồn kế toán, ledger −qty/+qty song song, contract_ownership_transfers) · **`reverse_stock_movement`** (chặn đảo giao dịch đảo/đã đảo, tạo reversal movement REV_ + hoàn nguyên ledger khi 2 kho). **81/174 action migrated — Phase 6 xong, toàn bộ chuỗi Kho (Nhập→Điều chuyển→Xuất→Lắp đặt→Kiểm kê→Đối soát→Ownership) hoạt động trên Java**.
- 🔥 Sang Phase 7 — Production/Thu hồi vốn: save/approve_production_report, save_construction_daily_log, save_capital_recovery, save_contract_payment, team subcontract (5 action) + work items.
- `receive/issue/return_stock`, `create_stock_count`, `approve_stock_count`, transfer orders (`create/approve/ship/receive_transfer_order`), central returns, `transfer_contract_ownership`, `reconcile_contract_stock`, `reverse_stock_movement`, `save_warehouse_location`, `confirm_installation`.
- Domain: **StockLedgerEngine** — physical (warehouse) vs accounting (contract) qua `procurement_allocations` + `contract_stock_ledger`; chặn âm kho (`negative_stock_blocked`), low-stock cảnh báo.
- Gate: 1 chuỗi Nhập → Điều chuyển → Xuất tổ đội → Lắp đặt → Đối soát ledger contract.

### Giai đoạn 7 — Sản xuất / Sản lượng / Thu hồi vốn (ước 1–2 tuần)
> ✅ **HOÀN THÀNH 09/2026**: recovery chain (6) + import payments + team subcontract (5) + **nhật ký thi công** (`save_construction_daily_log`: `CDL-<MÃ DA>-<NĂM>-NNNN`, shift/weather/labor/equipment + items planned/completed/labor_hours/photo, nháp→submitted→approved, đã duyệt chỉ admin mở lại · `approve_construction_daily_log` · `delete_construction_daily_log` — đã duyệt chỉ admin xóa). **96/174 action migrated — Phase 7 xong**.
- 🔥 Sang Phase 8 — Tài chính/Kế toán: ledger, bank reconciliation, chi phí gián tiếp, thuế, approvals portfolio.
- `save_production_report`, `approve_production_report`, `save_construction_daily_log` (+approve/delete), `save_capital_recovery`, `delete_capital_recovery`, `save_contract_payment`, `import_contract_payments`, team subcontract (`save_team_subcontract`, `save_team_production`, `approve_team_production`, `save_team_payment`, `settle_team_subcontract`), `create_project_team`, `set_project_team_status`, `delete_project_team`, work items/tasks.
- Domain: **RecoveryChainEngine** — sản lượng → hồ sơ → hóa đơn → thu → công nợ.
- Gate: 1 chuỗi thu hồi vốn hoàn chỉnh.

### Giai đoạn 8 — Tài chính (ước 1–2 tuần)
> ✅ **HOÀN THÀNH 09/2026**: payment plans (3) + advance (3) + site expense (3) + **`save_bank_account`** (chống trùng mã, VND mặc định) · **`save_cashbook_entry`** (`SQ-NNNNNN`, IN/OUT, tài khoản tồn tại) + delete · **`save_accounting_voucher`** (`CT-<NĂM>-NNNN`, draft, files_json) + delete. **114/174 action migrated — Phase 8 xong, 65%**.
- Còn lại Phase 8: xuất Excel/PDF báo cáo (POI/OpenPDF — có POI dependency sẵn).

### Giai đoạn 9 — Pháp chế / HR (ước 1 tuần)
> ✅ **CẬP NHẬT 09/2026 (v54)**: **record:live-chain mở rộng — 12/12 bước toàn 200** — chain runtime thật giờ gồm: project (`p_harness`) → **save_project_contract** → material (M-LIVE) → category → **save_boq_version** → **save_boq_item (internalMaterialCode, mapped)** → email settings → factory preview → **bootstrap 200 với dữ liệu đầy đủ** (BOQ/project/contract/material). Chain hỗ trợ **placeholder `{{contractId}}`/`{{boqVersionId}}` + auto-capture id** từ response trước (không hardcode id sinh). Snapshot `live-chain-v54b.json`. Không còn lỗi bootstrap ẩn trong phạm vi dữ liệu này.
> **Bug thật được vá trong quá trình E2E**: (1) `create_request` thiếu `contract_id`/`boq_version_id` trên material_request_items + allocation MR (null NOT NULL trên MySQL/H2); (2) `createPo` bind contract/boqVersion cho PO allocation qua `nvl` → null khi key H2 lowercase — đổi sang `sv` case-insensitive; (3) `postGoodsReceipt` dùng `receipt.get` trực tiếp → null trên H2 — đổi `sv()`; (4) `issue_stock` đọc request line keys lowercase (requestedqty/issuedqty) — đổi `ci()`; (5) insertWorkItem khớp cột thực (`task_origin`/`dedupe_key`/`source_no`, không `origin`/`created_by`).
> **ExcelTemplateService (POI)**: 5 template xlsx (boq/material_catalog/projects/users/payments) trên `GET /api/system?action=template&kind=...`. **docs/10_KẾ_HOẠCH_CUTOVER_BACKEND_JAVA.md** hoàn chỉnh (prep → song song → cutover → rollback + rủi ro + checklist).

### Giai đoạn 10 — Admin & Hệ thống (ước 1–2 tuần)
- `bulk_import_users`, `bulk_import_projects` (preflight nguyên tử), `create_user`, `update_user`, `reset_user_password`, `factory_reset_preview/execute`, email settings + `retry_email`, `save_email_settings`.
- Licensing Java: Ed25519 verifier + bảng `vntech_product_identity` (KHÔNG fingerprint hash-file như JS).
- Gate: toàn bộ Action Catalog → **0 action còn proxy sang JS** (trừ legacy tạm).

### Giai đoạn 11 — Cutover & Chuyển dữ liệu (ước 1–2 tuần)
1. **Migration dữ liệu**: script `pg_dump` (Postgres prod) → CSV → bulk load MySQL;
   - giữ nguyên ID text `prefix_uuid`, **giữ nguyên PBKDF2 hash** (không đổi mật khẩu),
   - timestamp TEXT → DATETIME, kiểm tra chuỗi document_sequences (không trùng số).
   - Thử nghiệm trên bản sao trước; khôi phục được nếu lỗi.
2. Bật **dual-write kiểm chứng** (tùy chọn, 1 tuần): ghi song song JS+Java, đối soát đêm.
3. Điểm dừng (cutover): tắt JS backend (`system-route.mjs`), UI trỏ Java 100%; xóa dần code JS backend khỏi đường chạy, **giữ nguyên bản tham chiếu đóng gói zip riêng** (theo doc 06), không xóa khỏi lịch sử git.

---

## 5. CHUYỂN DIALECT SANG MYSQL — ĐIỂM CẦN SỬA

| Dialect cũ (SQLite/PG) | MySQL 8.4 |
|---|---|
| Timestamp TEXT ('YYYY-MM-DDTHH:mm:ss.sssZ') | `DATETIME(3)`; đọc/ghi ISO qua JPA converter |
| Boolean integer 0/1 | `TINYINT(1)` / boolean |
| `INSERT OR IGNORE` | `INSERT IGNORE` |
| `AUTOINCREMENT` / sqlite sequences | `AUTO_INCREMENT`; document_sequences giữ logic riêng |
| Trigger `RAISE(ABORT)` | **Bỏ trigger** → application-level guard (domain) + repository |
| `LIMIT x,y` / `LIMIT ? OFFSET ?` | `LIMIT x OFFSET y` |
| CTE (đã có sẵn) | ✅ MySQL 8 hỗ trợ CTE — giữ nguyên |
| `COUNT(*)` kiểu number | JPA trả `Long` — chú ý mapper |
| Unicode/emojis trong tên vật tư | `utf8mb4` (bắt buộc cho tiếng Việt + ký tự đặc biệt) |

---

## 6. CHIẾN LƯỢC TEST

| Loại | Vị trí | Nội dung |
|---|---|---|
| Unit (domain) | domain + application | state machine 5 bậc, SLA, stock ledger (chặn âm), material matcher, recovery chain — thuần, không DB |
| Integration (repo) | infrastructure | Testcontainers MySQL 8.4 + Flyway; CRUD JPA + native query |
| **Contract (gateway)** | web | Golden snapshot JSON từ JS reference ↔ response Java; deep-compare; bắt lệch key camelCase/kiểu giá trị |
| Regression UI | — | Chạy bộ test JS hiện có (`npm test`) cho tới khi slice tương ứng migrate; sau cutover port sang test Java |
| E2E nghiệp vụ | web | 1 luồng xuyên slice: MR → duyệt → PO → nhận → xuất → đối soát |

---

## 7. RỦI RO & NGUYÊN TẮC

1. **Bootstrap GET là rào cản lớn nhất** — bất kỳ lệch key nào cũng làm UI vỡ; bắt buộc contract test ngay từ Phase 1.
2. **JPA không tốt cho mọi SQL** — giữ native query trong adapter khi cần (CTE balances, subquery approve counts); đừng ép Hibernate.
3. **Port ĐÚNG nghiệp vụ, không "cải tiến"** — 5 bậc duyệt + SLA, multi-contract stock, matching vật tư, thu hồi vốn chuỗi port nguyên trạng; tinh chỉnh SAU khi cutover.
4. **Không đổi UI khi đổi backend** — hợp đồng API là seam tuyệt đối.
5. **MySQL là adapter, không phải kiến trúc** — port repo giữ; Oracle/Postgres chỉ là thêm adapter.
6. **Fingerprint/Trust Lock bản JS KHÔNG áp dụng cho bản Java** — thiết kế lại licensing Ed25519 thuần (theo doc 06); không mang mechanism hash-file sang.
7. **Không đụng file JS bị gate** — mọi thay đổi JS (nếu có) phải qua quy trình refresh identity + migration mới 0076+; tuyệt đối tránh.
8. **Bảo mật giữ nguyên chuẩn cũ**: PBKDF2 600k, session sha256, RBAC 3 tầng, audit logs, lockout Redis.

---

## 8. ƯỚC LƯỢNG (1 dev full-time)

| Giai đoạn | Nội dung | Ước |
|---|---|---|
| 0 | Nền tảng + Action Catalog + Data Model + harness contract | 1–2 tuần |
| 1 | Auth + Bootstrap + serve SPA | 2–3 tuần |
| 2 | Master data + phân quyền | 1–2 tuần |
| 3 | MR + Duyệt 5 bậc + SLA | 1–2 tuần |
| 4 | Purchasing | 1–2 tuần |
| 5 | BOQ + Material Matching | 2–3 tuần |
| 6 | Kho + ledger | 2–3 tuần |
| 7 | Production/Recovery | 1–2 tuần |
| 8 | Tài chính | 1–2 tuần |
| 9 | Pháp chế/HR | 1 tuần |
| 10 | Admin/System + licensing | 1–2 tuần |
| 11 | Cutover + dữ liệu | 1–2 tuần |
| **Tổng** | | **~15–26 tuần (4–6 tháng)**; 2 dev song song → 2–3 tháng cho 60% lõi (Auth/Master/MR/Duyệt/PO/Kho) |

---

## 9. CÁC BƯỚC NGAY SAU KHI DUYỆT

1. ✅ Duyệt tài liệu này + chốt Maven vs Gradle.
2. ✅ **Phase 0**: `java-backend/` (Maven multi-module), generator Action Catalog (174 action) + Data Model Reference (114 bảng/1469 cột), khung contract test (`contract-tests/contract-harness.mjs` selfcheck OK), Flyway baseline MySQL (114 bảng).
3. ✅ **Phase 1–10 theo lộ trình**: **174/174 action migrated (100%)** — Auth (PBKDF2 600k, lockout 10/15′), Master data, MR+duyệt, Purchasing (PO→GRN→BCH), BOQ + Material Matching V2 (embedding 96D), StockLedgerEngine (vật lý/giữ chỗ/Contract ownership) + issue/return/install/transfer/central/kiểm kê/reconcile/reverse, Production/Thu hồi vốn, Tài chính, HR/Pháp chế, Admin/Settings/License, SLA worker, Excel template (POI), ETL SQLite→MySQL.
4. ✅ **Kiểm chứng**: `mvn clean verify` — **55 test 0 fail** (gồm `SupplyChainEndToEndIntegrationTest` chuỗi DNMH→duyệt→PO→GRN→BCH→PX→Sản lượng→Thu hồi→Thanh toán→Work item, ledger verified); **runtime thật** `java -jar --spring.profiles.active=dev` (H2) + HTTP: setup/login/bootstrap/create_project đúng contract JS; ETL tool verified fixture; Cutover plan `docs/10_KẾ_HOẠCH_CUTOVER_BACKEND_JAVA.md`.

### Cách chạy demo (dev, không cần MySQL)
```bash
cd java-backend
mvn -s settings-dev.xml -f pom.xml -q clean verify        # 55 test
mvn -s settings-dev.xml -f pom.xml -pl web -DskipTests package
java -jar web/target/vntech-erp-web-0.1.0-SNAPSHOT.jar --spring.profiles.active=dev
# mở http://127.0.0.1:18080 — SPA cũ trỏ /api/system không đổi (setup → login → dùng thử)
```

### Việc còn lại (không phải code, do PO/quản trị quyết định)
- [ ] ETL thật: `node tools/migrate-sqlite-to-mysql.mjs --sqlite <db> --out java-backend/migration` sau Flyway V1 trên MySQL 8.4
- [ ] Smoke MySQL thật (docs/10 §3.2) + pilot 1 dự án song song (dual-write)
- [ ] Chốt lịch cutover (docs/10 §3.3) + backup/rollback (docs/10 §3.4)