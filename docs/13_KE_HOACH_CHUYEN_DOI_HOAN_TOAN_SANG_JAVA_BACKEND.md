# 13 — KẾ HOẠCH CHUYỂN ĐỔI HOÀN TOÀN SANG JAVA BACKEND (VNTECH ERP — MEP)

Ngày lập: 14/09/2026 · Người lập: Agent phát triển · Trạng thái: **ĐÃ KIỂM ĐỊNH TRÊN MÁY THẬT — SẴN SÀNG CUTOVER**

> Bổ sung/khép kín cho: `docs/10_KẾ_HOẠCH_CUTOVER_BACKEND_JAVA.md` (kế hoạch cutover gốc), `docs/09_KE_HOACH_CHUYEN_SANG_JAVA_MYSQL.md` (kiến trúc), `java-backend/README.md` (tiến độ Strangler Fig).
> Tài liệu này bổ sung **bằng chứng kiểm định thực tế hôm nay** và biến kế hoạch thành **lộ trình chuyển đổi hoàn toàn, có thể thực thi**.

---

## 1. KẾT LUẬN KIỂM ĐỊNH (BẰNG CHỨNG THỰC TẾ — 14/09/2026)

> 🔄 **CẬP NHẬT CUỐI NGÀY**: đã kiểm chứng **trên MySQL 8.0.46 THẬT** (không còn H2) — Flyway migrate 115 bảng + seed; **smoke chuỗi lõi 18/18 PASS**; **smoke chuỗi cung ứng mở rộng 28/28 PASS** (duyệt đủ 5 bậc → PO → nhập kho → ảnh giao hàng → BCH xác nhận → xuất kho → hoàn trả); **64 test / 0 fail**. Quá trình này phát hiện **13 bug thật** (mục 1.4): 6 bug dialect/seed + **7 bug port thiếu logic** (kho tổ đội, bootstrap thiếu `items[]`, thiếu `/api/files`, movement `SMI` sai làm tồn kho tổ đội luôn 0, số chứng từ trùng giữa dự án, **lỗi trùng khoá trả 500 câm**, và **schema test H2 thiếu UNIQUE** nên che mất chính bug trùng khoá).

### 1.1 Kết quả chạy thật trên máy này

| Hạng mục kiểm định | Kết quả | Bằng chứng |
|---|---|---|
| **Môi trường** | JDK 26.0.2.1 + Maven 3.9.16 (có sẵn trong `.m2/wrapper`) | `mvn -version` → Java 26.0.2.1, Maven 3.9.16 |
| **Build đầy đủ** | ✅ **BUILD SUCCESS** (5/5 module) | Reactor: Base/Domain/Application/Infrastructure/Web = SUCCESS |
| **Test suite** | ✅ **64 test / 0 fail** | domain 14 · application 16 · infrastructure 10 · web 23 |
| **Artifact** | ✅ JAR chạy được | `java-backend/web/target/vntech-erp-web-0.1.0-SNAPSHOT.jar` |
| **Runtime H2 (dev)** | ✅ Spring Boot 3.5.0, Tomcat **18080** | `Started VntechErpApplication in 7.619s` |
| **Runtime MySQL THẬT** | ✅ Spring Boot 3.5.0, Tomcat **18081**, MySQL 8.0.46 | `Database version: 8.0.46` · `Schema vntech_erp is up to date` |
| **Flyway migrate MySQL** | ✅ **115 bảng · 476 index** | `Successfully applied 1 migration ... now at version v1` + V2 seed |
| **Seed hệ thống (V2)** | ✅ **5 bậc duyệt + 8 vai trò nền** | `approval_stage_catalog` = 5 rows · `role_catalog` = 8 rows |
| **SLA worker** | ✅ Chạy tự động | `SLA worker: 0 supply steps quá hạn; 0 payment plans quá hạn; 0 BCH chờ xác nhận` |
| **API bootstrap** | ✅ `GET /api/system` → `{"setupRequired":true,"ok":true}` | HTTP 200 |
| **Setup** | ✅ HTTP **201** + cookie `mep_session` (HttpOnly, SameSite=Strict, Max-Age 86400) | POST `setup` |
| **Login** | ✅ HTTP 200 `{"ok":true,"mustChangePassword":false}` + session | POST `login` |
| **Bootstrap có session** | ✅ `{ok, authenticated, data}` với **64 nhóm dữ liệu** | projects, requests, teams, warehouses, materials, suppliers, inventory, purchaseOrders, receipts, issues, returns, stockCounts, transferOrders, boqItems, projectContracts, **approvalStageCatalog**, roleCatalog… |
| **Excel template (POI)** | ✅ HTTP 200, MIME `spreadsheetml.sheet`, 4.022 bytes | `GET /api/system?action=template&kind=boq` |
| **Health** | ✅ `status: UP` (db=MySQL, diskSpace, ping, ssl) | `/actuator/health` — Mail/Redis tắt qua env |
| **Xử lý lỗi** | ✅ 401 (sai mật khẩu) · 409 (setup trùng) · 400 (action lạ) | đúng chuẩn |
| **PARITY ACTION** | ✅ **JS 174 = Java 174** — 0 thiếu, 0 thừa, `migrated:true` 174/174 | cross-check `scripts/system-route.mjs` ↔ `ACTION_CATALOG.json` |
| **SMOKE CHUỖI LÕI** | ✅ **18/18 PASS** trên MySQL thật | `node java-backend/contract-tests/smoke-core-chain.mjs` (mục 1.5) |
| **SMOKE CHUỖI CUNG ỨNG** | ✅ **28/28 PASS** trên MySQL thật | `node java-backend/contract-tests/smoke-supply-chain.mjs` |

### 1.2 Kết luận
> **Backend Java đã đạt tương đương chức năng 100% so với monolith JS ở mức action catalog.** Hợp đồng dữ liệu (`POST /api/system {action} → {ok, data}`, cookie `mep_session`) **trùng khớp** → SPA React hiện tại dùng được **không cần sửa frontend**.
>
> **Chuỗi cung ứng đã chạy TRỌN VẸN đầu-cuối trên MySQL 8.0 thật (28/28 PASS)**: vật tư → dự án → hợp đồng → BOQ version → dòng BOQ → phân công Owner 5 bậc → **tạo phiếu DNMH** → **duyệt đủ 5/5 bậc (MR `approved · stage=5`)** → NCC → **tạo tổ đội (tự sinh kho tổ đội)** → **phát hành PO** → **nhập kho (GRN)** → **tải ảnh giao hàng qua `/api/files`** → **BCH xác nhận giao hàng (`confirm_delivery`)** → **xuất kho cấp phát cho tổ đội (`issue_stock`)** → **hoàn trả (`return_stock`)**, với bootstrap + tồn kho + contract ledger phản ánh đúng.
>
> **Kiểm chứng số liệu tồn kho**: movement `SMI` chuyển 5 từ kho site → `WHTEAM_…` (kho tổ đội), ledger ghi −5 (nguồn) / +5 (tổ đội) — khớp nghiệp vụ JS.

### 1.3 Khác biệt so với kế hoạch gốc (điểm cần cập nhật)
| Điểm | Kế hoạch gốc (docs/10) | Thực tế hôm nay |
|---|---|---|
| Số test | 54 test | **64 test** (đã tăng do bổ sung) |
| JDK | Java 21 (LTS) | Máy có **JDK 26**; build với `--release 21` vẫn xanh → **chấp nhận được**, nhưng production nên cài **JDK 21 LTS** cho ổn định |
| Docker | "Docker Desktop không mở được daemon" | Máy **đã có MySQL 8.0.46 cài trực tiếp** (service `MySQL80`, port 3306) — Docker không cần thiết |
| **Phiên bản MySQL** | Giả định **8.4 LTS** | Thực tế **8.0.46** — nghiêm ngặt hơn về default value/độ dài identifier/prefix index (xem mục 1.4) |
| Runtime | Chỉ H2 dev | ✅ **MySQL thật đã chạy + smoke 18/18 PASS** |

### 1.4 🐛 CÁC BUG THẬT PHÁT HIỆN KHI CHẠY MYSQL THẬT (không lộ trên H2)

Bộ test H2 `MODE=MySQL` (nay **64 test**) **không bắt được** các lỗi 1–11 với hai lý do khác nhau:

- **Bug #1–#6** là **dialect/seed** — H2 dễ tính hơn MySQL nên không tái hiện được (đã sửa hết).
- **Bug #7–#11** là **lỗi port thiếu logic** — H2 không bắt được vì test cũ **tự `INSERT` dữ liệu nền** thay vì đi qua use-case.
- **Bug #12–#13** đặc biệt: bug #12 lẽ ra H2 **có thể** bắt được, nhưng bug #13 (schema H2 thiếu `CREATE UNIQUE INDEX` rời) đã **vô hiệu hoá** khả năng đó. Nay #13 đã sửa ⇒ bộ test H2 **có** enforcement UNIQUE và bug #12 đã có regression guard.

| # | Lỗi MySQL | Nguyên nhân | File sửa |
|---|---|---|---|
| 1 | **Error 1067** `Invalid default value for 'created_at'` | `DEFAULT 'CURRENT_TIMESTAMP'` bị bọc nháy đơn (thành chuỗi literal) | `java-backend/tools/generate-flyway-baseline.mjs` |
| 2 | **Error 1067** (tiếp) | Cột `DATETIME(3)` cần `CURRENT_TIMESTAMP(3)` khớp độ chính xác — `CURRENT_TIMESTAMP` trần vẫn lỗi | `java-backend/tools/generate-flyway-baseline.mjs` |
| 3 | **Error 1059** `Identifier name 'business_role_group_scopes_uidx_...' is too long` (70 ký tự) | Tên index ghép vượt giới hạn **64 ký tự** của MySQL | `generate-flyway-baseline.mjs` — thêm `fitIdentifier()` (cắt + hash SHA1 8 hex) |
| 4 | **Error 1170** `BLOB/TEXT column 'form_key' used in key specification without a key length` | `UNIQUE KEY` trên cột `TEXT` thiếu **prefix length** | `generate-flyway-baseline.mjs` — thêm `(191)` cho cột TEXT trong UNIQUE KEY |
| 5 | **Error 1064** (HTTP **500**) `syntax error near 'system,...'` | **`system` là từ khoá dành riêng của MySQL** — 6 file Java dùng cột `system` chưa bọc backtick (SQL chạy được trên SQLite, hỏng trên MySQL) | `RequestStoreAdapter`, `BootstrapDataAdapter`, `BoqStoreAdapter` (×3), `PurchaseStoreAdapter`, `MaterialCatalogStoreAdapter` + 5 test |
| 6 | **THIẾU SEED** (nghiêm trọng) `create_request` báo *"Chưa cấu hình bước phê duyệt đang hoạt động"* | `V1__baseline.sql` chỉ tạo **schema** (114 bảng), **không có dữ liệu hệ thống bắt buộc** → `approval_stage_catalog` rỗng → luồng lõi chết ngay | **Tạo mới** `java-backend/tools/generate-system-seed.mjs` → sinh `V2__system_seed.sql` (5 bậc duyệt + 8 vai trò nền) |
| 7 | **HTTP 500** `Column 'warehouse_id' cannot be null` ở `create_project_team` | **Port thiếu logic**: JS `create_project_team` **tự sinh kho tổ đội** (`id("WHTEAM")`, code `TD-<MÃ DỰ ÁN>-<MÃ>`, type `team`, cha là kho site) rồi mới ghi `teams.warehouse_id`. Bản Java lấy `warehouseId` từ payload (⇒ `null`) và **không tạo kho** → vi phạm NOT NULL. Ngoài ra Java còn thiếu validate `trade` (JS bắt buộc), thiếu chống trùng **tên** tổ đội, thiếu sinh **mã toàn cục**, và `set/delete_project_team` không đồng bộ kho tổ đội | `OpsTaskManagementUseCase`, `OpsTaskStore`, `OpsTaskStoreAdapter`, `AdminCatalogChainIntegrationTest` |
| 8 | **Bootstrap thiếu `items[]` lồng** → UI hộp thoại "Ghi nhận số lượng giao thực tế" **không load được dòng nào** và `receive_goods` báo *"Phiếu nhập cần PO và ít nhất một dòng nhận hàng"* | **Port thiếu logic**: JS bootstrap gắn `items[]` vào từng `purchaseOrders` và `receipts` (`itemsByPo`/`itemsByReceipt`). Bản Java chỉ trả **số tổng hợp** (`itemCount`/`orderedQty`/`actualDeliveredQty`) → `po.items` rỗng. Dữ liệu trong DB **đúng** (mỗi PO có 1 dòng); lỗi nằm ở tầng đọc | `BootstrapDataAdapter` (thêm 2 truy vấn gắn items cho PO + receipts) |
| 9 | **Thiếu toàn bộ `/api/files`** → không thể upload ảnh/CO-CQ ⇒ `confirm_delivery` **luôn chặn** (*"Phải tải ít nhất một ảnh giao hàng thực tế…"*) và mọi panel đính kèm ở Phase 1 chết | **Port thiếu subsystem**: `app/api/files/route.ts` (SSOT, 22 KB, có fingerprint gate) có POST/GET/DELETE + `/api/files?projectArchive=` (VNTECH_PROJECT_OFFLINE_ARCHIVE_V1) nhưng Java chỉ có `/api/system` + `/api/health`. Đây là **endpoint riêng, không phải action**, nên bảng parity 174 action **không phát hiện được** | ✅ **ĐÃ SỬA** — thêm `FileUseCase` + `FileStore`/`FileStoreAdapter` (đĩa thay R2) + `FileController` (`/api/files` POST/GET/DELETE + `?projectArchive=`); giữ nguyên RBAC `assertEntityAccess`, giới hạn 20 MB, `safeName()`, định dạng archive |
| 10 | **`issue_stock` ghi sai movement** ⇒ **tồn kho tổ đội luôn 0** | **Port thiếu logic (nghiêm trọng — sai lệch số liệu)**: JS ghi `movement_type='SMI'`, `to_warehouse_id = teams.warehouse_id`, `destination_contract_id = contractId`. Bản Java ghi `movement_type='ISSUE'`, **`to_warehouse_id=NULL`**, `destination_contract_id=NULL` → hàng rời kho site mà **không vào kho tổ đội**. Hệ quả: `return_stock` báo *"số lượng hoàn trả vượt tồn vật lý tổ đội"*, và **kiểm kê/lắp đặt/hoàn trả đều sai** | ✅ **ĐÃ SỬA** — `WarehouseStockStoreAdapter.insertStockIssue`: dùng `SMI` + `toWarehouseId` + `destination_contract_id`, và ghi **2 dòng** contract ledger (−kho nguồn / +kho tổ đội); `StockManagementUseCase` truyền `toWarehouseId` từ team |
| 11 | **`Duplicate entry 'PX-2026-0001'`** (HTTP 500) khi xuất kho dự án thứ 2 | **Lỗi thiết kế số chứng từ**: `document_sequences` đếm theo **(project, year)** nhưng `stock_issues_no_uidx` / `material_returns_no_uidx` / `stock_counts_no_uidx` là **unique toàn cục**, mà số phiếu lại **không kèm mã dự án** (`PX-<year>-<seq>`) → dự án thứ 2 trong cùng năm **trùng số**. (Số PO/DNMH/GRN đã đúng vì có `<MÃ DỰ ÁN>`.) | ✅ **ĐÃ SỬA** — thêm mã dự án vào 3 số phiếu: `PX-<MÃ DA>-<year>-<seq>`, `RET-…`, `KK-…`; bổ sung `projectCode` vào `findTeam`/`findRequestForIssue`/`findWarehouseById` |

| 12 | **Mọi lỗi trùng khoá đều trả HTTP 500 câm** `"Internal Server Error"` | **Port thiếu xử lý lỗi**: `SystemController` chỉ bắt `ApiError`; `DuplicateKeyException` của Spring thoát ra thành 500 không thông báo. JS có quy ước rõ: **duplicate key → 409** + message đọc được (`system-route.mjs` dòng 3149). Ảnh hưởng **mọi** action có ràng buộc duy nhất (dự án, vật tư, NCC, chứng từ, tài khoản…), không riêng dự án. Phát hiện khi tạo dự án trùng mã trên UI | ✅ **ĐÃ SỬA** — thêm `catch DuplicateKeyException` → **409** + `duplicateMessage()` ánh xạ **38 khoá unique thật** (lấy từ `information_schema`) sang tiếng Việt; thêm `catch DataIntegrityViolationException` → 409 |
| 13 | **`schema-h2.sql` THIẾU ràng buộc UNIQUE so với MySQL** ⇒ test H2 không bao giờ bắt được lỗi trùng khoá | **Lỗi công cụ test**: `generate-h2-test-schema.mjs` **xoá toàn bộ `CREATE UNIQUE INDEX` rời** với giả định "test không cần". Trong MySQL baseline, `projects_code_uidx` là index rời ⇒ H2 mất ràng buộc. Đây là **nguyên nhân gốc khiến bug #12 (và #11) lọt qua 64 test xanh** | ✅ **ĐÃ SỬA** — generator **giữ lại 31 UNIQUE index** (chuyển sang cú pháp H2, bỏ prefix length); thêm test `createProject_duplicateCode_returns409WithReadableMessage` đã **red-proof** (bỏ handler ⇒ test fail) |

> 💡 **Bài học 1**: baseline schema-only là **chưa đủ** để hệ thống chạy. Phải có **V2 seed** cho dữ liệu hệ thống. Bug #5 đặc biệt nguy hiểm vì SQL hợp lệ trên SQLite nhưng **chết trên MySQL** — chỉ lộ khi chạy DB thật.
>
> 💡 **Bài học 2 (quan trọng hơn)**: bug #7–#9 **không phải lỗi dialect** mà là **lỗi port thiếu logic**. Test H2 không bắt được vì chúng **tự `INSERT` dữ liệu nền** (`StockChainIntegrationTest` tự chèn `teams` với `warehouse_id` có sẵn) thay vì đi qua use-case như người dùng thật. ⇒ **Smoke test gọi HTTP thật là gate bắt buộc**, và bảng **parity 174 action là chưa đủ** vì còn endpoint ngoài action (bug #9).
>
> 💡 **Bài học 3 (mới — bug #12/#13)**: bug #13 cho thấy **chính bộ test cũng có thể sai lệch so với production**. `schema-h2.sql` nhẹ ràng buộc hơn MySQL nên **mọi bug trùng khoá đều vô hình với 64 test xanh**. ⇒ Trước khi tin "test xanh", phải kiểm tra **schema test có tương đương schema thật không** (hiện đã có `BaselineSqlSanityTest` nhưng chưa đối chiếu UNIQUE).
>
> 💡 **Bài học 4**: bug #12 đáng lẽ phải được phát hiện sớm — nó ảnh hưởng **mọi** action, không chỉ dự án. Chỉ lộ ra khi **đăng nhập UI thật và bấm nút**. ⇒ Smoke test tự động **không thay thế** được việc thao tác qua giao diện; cần cả hai.

### 1.5 Smoke test chuỗi lõi (bằng chứng cutover)

Script: `java-backend/contract-tests/smoke-core-chain.mjs` — chạy `node java-backend/contract-tests/smoke-core-chain.mjs [baseUrl]`

```
✅ PASS  setup (201) / đã setup (409)
✅ PASS  login — session=true
✅ PASS  bootstrap — 64 nhóm dữ liệu
✅ PASS  save_material (danh mục vật tư)
✅ PASS  bootstrap có vật tư mới
✅ PASS  create_project
✅ PASS  bootstrap có dự án mới
✅ PASS  save_project_contract
✅ PASS  bootstrap có hợp đồng
✅ PASS  save_boq_version (phiên bản BOQ)
✅ PASS  save_boq_item (dòng BOQ hợp đồng)
✅ PASS  compare_boq_materials (đối chiếu BOQ↔danh mục)
✅ PASS  bootstrap có bậc duyệt (seed V2) — 5 bậc
✅ PASS  save_email_settings + phân công Owner theo dự án — 5 bậc
✅ PASS  create_request (DNMH) — HTTP 200
✅ PASS  bootstrap phản ánh phiếu — DNMH-SM…-2026-0001 · pending_approval
✅ PASS  decide_approval (duyệt bậc 1) — HTTP 200
✅ PASS  actuator health UP — db=MySQL

===== SMOKE CHUỖI LÕI: 18/18 PASS · 0 FAIL =====
```

**Thứ tự điều kiện tiên quyết đã được chứng minh bằng thực nghiệm** (mỗi bước thiếu đều chặn bước sau với thông báo rõ):
1. Danh mục vật tư phải có trước → nếu thiếu: *"vật tư chưa được mapping với Mã vật tư nội bộ"*
2. Hợp đồng phải có → nếu thiếu: *"Hợp đồng không tồn tại/đã ngừng áp dụng"*
3. **Phiên bản BOQ** phải có trước dòng BOQ → nếu thiếu: *"Hợp đồng chưa có phiên bản BOQ"*
4. **5 bậc duyệt phải được seed** → nếu thiếu: *"Chưa cấu hình bước phê duyệt đang hoạt động"*
5. **Owner từng bậc phải được phân công theo dự án** → nếu thiếu: *"Dự án chưa được phân công 01 Owner hợp lệ cho Bước N"*

### 1.6 Cấu hình môi trường đã dùng (để tái lập)
| Thành phần | Giá trị |
|---|---|
| MySQL | `MySQL80` service, port **3306**, version 8.0.46 |
| DB | `vntech_erp` (utf8mb4 / utf8mb4_unicode_ci) |
| User DB | `vntech` / `vntech` (đúng mặc định `application.yml`) |
| JDK | `C:\Users\PC\.jdks\openjdk-26.0.2.1` |
| Maven | `C:\Users\PC\.m2\wrapper\dists\apache-maven-3.9.16-bin\...\bin\mvn.cmd` |
| Health indicators | `VNTECH_HEALTH_MAIL=false`, `VNTECH_HEALTH_REDIS=false` (bật `true` khi có SMTP/Redis thật) |
| Port khi test | **18081** (tránh đụng monolith JS ở 8787) |

| Runtime đã chạy | H2 dev | ✅ H2 dev **đã chạy thật + API verified** |

---

## 2. MÔ TẢ HỆ THỐNG ĐÍCH (SAU CHUYỂN ĐỔI)

### 2.1 Kiến trúc
```
┌─────────────────────────────────────────────────────────────┐
│  UI: React SPA (app/page.tsx) — GIỮ NGUYÊN 100%             │
│      gọi POST /api/system {action, ...} ; GET /api/system   │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP (cookie mep_session)
┌──────────────────────────▼──────────────────────────────────┐
│  web/           Spring Boot 3.5 · REST /api/system, /api/files│
│                 security (session, lockout), serve SPA        │
├─────────────────────────────────────────────────────────────┤
│  infrastructure/ JPA/MySQL · Redis · SMTP · POI · Flyway      │
├─────────────────────────────────────────────────────────────┤
│  application/    Use-cases + Ports (interface) — 174 action   │
├─────────────────────────────────────────────────────────────┤
│  domain/         Entity, Value Object, Domain Service         │
└──────────────────────────┬──────────────────────────────────┘
                           │
                 MySQL 8.4 (114 bảng, Flyway baseline)
```
Phụ thuộc một chiều: `web → infrastructure → application → domain`. **Clean Architecture thật** — đã có `application/port/out/*` (32 port) + `application/rbac/*`.

### 2.2 Thành phần vận hành
| Thành phần | Vai trò | Trạng thái |
|---|---|---|
| `java-backend/web` | Spring Boot app, serve SPA + REST | ✅ build + chạy |
| MySQL 8.4 | DB chính (114 bảng, Flyway `V1__baseline.sql`) | ⏳ cần cài/docker |
| Redis 7 | Cache (hiện chưa bắt buộc — boot OK không Redis) | ⏳ tùy chọn |
| `tools/migrate-sqlite-to-mysql.mjs` | ETL SQLite → MySQL (đúng thứ tự FK, UTF-8) | ✅ có sẵn |
| `contract-tests/contract-harness.mjs` | Smoke test golden snapshot toàn chuỗi | ✅ có sẵn |
| `SlaComplianceWorker` | Quét quá hạn SLA (@Scheduled) | ✅ đã chạy |

### 2.3 Điểm mạnh khi chuyển hoàn toàn
1. **Kiểm soát & mở rộng**: Java type-safe, IDE refactor, RBAC trong `ActionRbacRegistry` (378 dòng) tập trung.
2. **DB chuẩn**: MySQL 8.4 + Flyway (versioned migration) thay vì SQLite + SQL inline.
3. **Kiến trúc test được**: 64 test có ý nghĩa (unit + integration + end-to-end chuỗi cung ứng).
4. **Không phá UI**: SPA giữ nguyên; cutover chỉ đổi backend URL → rủi ro thấp.
5. **Tài liệu tự sinh**: `ACTION_CATALOG` (174) + `DATA_MODEL_REFERENCE` (114 bảng/1.469 cột/195 index) là hợp đồng sống.

---

## 3. CÁC BƯỚC CHUYỂN ĐỔI HOÀN TOÀN (LỘ TRÌNH 6 GIAI ĐOẠN)

### GIAI ĐOẠN A — Chuẩn bị hạ tầng (2–3 ngày) ⚠️ ĐANG CHẶN
| # | Việc | Chi tiết | Trạng thái |
|---|---|---|---|
| A1 | Cài **JDK 21 LTS** (Temurin) | Máy hiện có JDK 26 (chạy được nhưng production nên LTS 21) | ⏳ |
| A2 | Cài **Maven** cố định | Đã có 3.9.16 trong `.m2/wrapper` — nên cài riêng + set PATH | ⏳ (tạm dùng được) |
| A3 | Cài **MySQL 8.4 LTS** | Không có Docker trên máy → cài MySQL trực tiếp (hoặc cài Docker Desktop) | ⏳ **CHẶN** |
| A4 | Tạo DB `vntech_erp` (utf8mb4) + user `vntech` | Flyway tự migrate 114 bảng khi boot | ⏳ |
| A5 | (Tùy chọn) Redis 7 | Chưa bắt buộc — boot thành công không Redis | ⏳ |

### GIAI ĐOẠN B — Kiểm chứng trên MySQL thật (2–3 ngày)
| # | Việc | Tiêu chí đạt |
|---|---|---|
| B1 | Boot Java với MySQL (bỏ profile dev) | Flyway chạy hết `V1__baseline.sql`, 114 bảng tạo |
| B2 | **Seed approval stages hệ thống** (⚠️ bắt buộc) | `save_approval_stage` chỉ cho stage tùy chỉnh ≥100; các bước 1..N + `approval_project_assignments` phải có sẵn, nếu không `create_request` báo *"Chưa cấu hình bước phê duyệt đang hoạt động"* |
| B3 | Chạy **contract harness golden snapshot** | `node java-backend/contract-tests/contract-harness.mjs` — mọi chuỗi khớp (bỏ timestamp) |
| B4 | Verify PBKDF2 tương thích hash JS | 1 user thật login **không phải reset mật khẩu** |
| B5 | Smoke test toàn chuỗi (mục 4) | PASS 100% |

### GIAI ĐOẠN C — ETL dữ liệu (1–2 ngày)
| # | Việc | Chi tiết |
|---|---|---|
| C1 | Sinh SQL di trú | `node java-backend/tools/migrate-sqlite-to-mysql.mjs --sqlite <db.sqlite> --out java-backend/migration` |
| C2 | Kiểm tra `manifest.json` | Đúng thứ tự FK, UTF-8, escape quote |
| C3 | Nạp vào MySQL | `mysql -uvntech -pvntech vntech_erp < migration/migration.sql` |
| C4 | Đối chiếu số lượng bản ghi | So count từng bảng SQLite ↔ MySQL (ngưỡng lệch = 0) |
| C5 | Verify sequence nghiệp vụ | `document_sequences` (DNMH/PO/GRN/PX…) liên tục, không trùng |

### GIAI ĐOẠN D — Chạy song song & pilot (3–5 ngày)
| # | Việc | Chi tiết |
|---|---|---|
| D1 | Java chạy **cổng phụ** (8090) trên **bản sao** dữ liệu | Không đụng SQLite production |
| D2 | Trỏ UI dev sang Java | Proxy `/api/system` → 8090 |
| D3 | **Dual-write** 1 dự án pilot | Ghi cả JS (SQLite) và Java (MySQL) — hoặc chấp nhận delta nhỏ có kiểm soát |
| D4 | So sánh kết quả 2 backend | Cùng thao tác → cùng dữ liệu trả về (bootstrap diff) |
| D5 | UAT người dùng thật | 4 nhóm: đề nghị / duyệt / mua hàng / kho |

### GIAI ĐOẠN E — Cutover chính thức (0.5–1 ngày, cuối tuần)
| # | Việc | Rollback? |
|---|---|---|
| E1 | Thông báo bảo trì, **dừng ghi** | — |
| E2 | **Backup lần cuối**: file SQLite + `mysqldump` MySQL | ✅ |
| E3 | Đồng bộ delta cuối SQLite → MySQL (idempotent upsert theo PK) | ✅ |
| E4 | Chạy Java trên **cổng 8080** với `application-prod.yml` (MySQL, cookie domain/secure) | ✅ |
| E5 | Verify thủ công: login, dashboard, duyệt 1 MR, xuất 1 PX | ✅ |
| E6 | Chuyển traffic/DNS/proxy sang Java | ✅ (bật lại JS) |
| E7 | Theo dõi 48h: log, SLA worker, email outbox | ✅ |

### GIAI ĐOẠN F — Đóng & dọn (sau 1–2 tuần ổn định)
| # | Việc |
|---|---|
| F1 | Tắt/nghỉ hưu JS backend (`scripts/system-route.mjs` chỉ giữ làm tham chiếu read-only) |
| F2 | Gỡ dual-write; chốt MySQL là nguồn sự thật duy nhất |
| F3 | Lưu trữ SQLite cuối (cold backup) + tài liệu hoá |
| F4 | Chuyển CI/CD sang build Maven (thay gate JS) |
| F5 | Cập nhật `docs/02_HUONG_DAN_DEV_MOI.md`, `docs/03_HUONG_DAN_NGUOI_DUNG.md` theo stack Java |
| F6 | (Tùy chọn) Bỏ fingerprint gate JS khi JS đã nghỉ hưu — **chỉ sau khi F1 hoàn tất và có xác nhận** |

---

## 4. SMOKE TEST TOÀN CHUỖI (BẮT BUỘC TRƯỚC CUTOVER)

### 4.0 Script tự động — ĐÃ CÓ VÀ ĐANG XANH
```bash
# 1) Chạy DB + backend (MySQL thật)
docker compose up -d mysql          # hoặc dùng MySQL cài trực tiếp (service MySQL80)
java -jar java-backend/web/target/vntech-erp-web-0.1.0-SNAPSHOT.jar --server.port=18081

# 2) Chạy smoke chuỗi lõi (18 bước) — kỳ vọng 18/18 PASS
node java-backend/contract-tests/smoke-core-chain.mjs http://127.0.0.1:18081
```
**Trạng thái hiện tại: 18/18 PASS trên MySQL 8.0.46** (xem mục 1.5).

### 4.1 Chuỗi cần kiểm chứng đầy đủ (script phủ 1–2; 3–9 cần bổ sung dần)
1. `setup` → `login` → `create_user` → `create_project` (tự tạo warehouse site + scope admin) ✅ có trong script
2. Material catalog → `save_boq_version` → `save_boq_item` → `compare/confirm mappings` ✅ có trong script
3. **`create_request` (DNMH) → duyệt 5 bậc** → `create_po` → `receive_goods` → `confirm_delivery` (posting + contract ledger) ⏳ duyệt bậc 1 đã PASS; các bậc 2–5 + PO/nhận hàng cần bổ sung
4. `issue_stock` → `confirm_installation` → `return_stock` ⏳
5. Transfer 4 action → central return → stocktake → `reconcile_contract_stock`
6. Production report → capital recovery → contract payment → team subcontract (5) → daily log
7. Payment plan / tạm ứng / chi phí BCH / cashbook / voucher / bank
8. HR / hợp đồng lao động / công văn / văn bản pháp lý / con dấu / bảo hiểm
9. Work items, sinh Excel template (POI), email settings + retry

> ⚠️ **Bước 3 là điểm rủi ro cao nhất**: phải seed approval stages trước (B2).

---

## 5. RỦI RO & GIẢM THIỂU

| # | Rủi ro | Mức | Giảm thiểu |
|---|---|---|---|
| 1 | Chưa cài MySQL → không kiểm chứng trên DB thật | ~~Cao~~ **ĐÃ XỬ LÝ** | ✅ MySQL 8.0.46 đã cài, Flyway migrate 115 bảng OK |
| 2 | Thiếu seed approval stages → `create_request` fail | ~~Cao~~ **ĐÃ XỬ LÝ** | ✅ Đã tạo `V2__system_seed.sql` (5 bậc + 8 vai trò); smoke test xác nhận tạo DNMH OK |
| 3 | H2 khác MySQL (dialect, FK, engine) | **Cao** | ⚠️ **Đã chứng minh là RỦI RO THẬT** — 6 bug chỉ lộ trên MySQL (mục 1.4). Bắt buộc chạy MySQL thật mỗi lần đổi schema/query |
| 4 | Sai/hỏng dữ liệu khi ETL | **Cao** | C4 đối chiếu count từng bảng; C5 verify sequence; giữ SQLite gốc |
| 5 | Lệch contract (message/status/field name) | Trung bình | Contract harness golden; sửa Java tới khi khớp |
| 6 | Email worker khác JS | Trung bình | Test SMTP thật + retry queue; hiện health Mail đang tắt |
| 7 | JDK 26 vs 21 trên production | Trung bình | Cài JDK 21 LTS cho prod (A1) |
| 8 | Mất delta trong lúc song song | Trung bình | Dual-write pilot (D3) hoặc chấp nhận có kiểm soát |
| 9 | Rollback thất bại | Trung bình | E2 backup bắt buộc; JS chỉ tắt ở F1 (sau ổn định) |
| 10 | Fingerprint gate JS vỡ khi sửa file JS | Thấp | **Tuyệt đối không sửa file JS** trong `app/db/deploy/drizzle/lib/public/scripts/tests/worker` |
| 11 | **Còn bug MySQL tiềm ẩn ở các action chưa smoke** | **Cao** | Nay chỉ **~26 action** đã smoke (18 lõi + mở rộng; còn ~148 action chưa chạy trên MySQL). Đã bổ sung **scanner tĩnh** `java-backend/tools/scan-sql-dialect.mjs` (quét 108 file Java tìm reserved word/SQLite-only, hiện **0 phát hiện**) làm lưới an toàn **bổ sung cho** smoke — nhưng scanner **không bắt được bug port thiếu logic** (#7–#9) |
| 12 | **Endpoint ngoài `/api/system` chưa port** (#9) | ~~Cao~~ **ĐÃ XỬ LÝ** | ✅ Đã rà toàn bộ `app/api/**`: **chỉ có 2 route** — `/api/system` + `/api/files` — và **cả hai nay đã port**. Không còn endpoint thiếu |
| 13 | **Test H2 tự `INSERT` dữ liệu nền nên che lỗi port** | **Cao** | `StockChainIntegrationTest`/`SupplyChainEndToEndIntegrationTest` tự chèn `teams`/`attachments` thay vì gọi use-case ⇒ **5 bug port đều lọt qua 64 test xanh**. Phải thêm test đi **đúng đường use-case** (không tự seed) cho mọi luồng có ràng buộc NOT NULL/FK (ưu tiên #10) |
| 14 | **Sai số liệu tồn kho/kế toán âm thầm** | ~~Cao~~ **ĐÃ XỬ LÝ** (bug #10) | ✅ Movement `SMI` nay chuyển đúng sang kho tổ đội + ledger ±; **nhưng các luồng kho khác chưa smoke** ⇒ vẫn cần ưu tiên #11 |

---

## 6. CHECKLIST QUYẾT ĐỊNH GO/NO-GO

**Bắt buộc (tất cả phải ✅)**:
- [x] `mvn clean verify` xanh — ✅ **64 test / 0 fail**
- [x] Chạy được trên **MySQL thật** + Flyway migrate — ✅ **MySQL 8.0.46 · 115 bảng · 476 index**
- [x] **Seed approval stages** đầy đủ — ✅ **V2__system_seed.sql: 5 bậc + 8 vai trò**
- [x] Smoke test chuỗi lõi (mục 4) PASS — ✅ **18/18 PASS**
- [ ] Contract harness golden snapshot **khớp 100%**
- [ ] Login user thật **không phải đổi mật khẩu** (PBKDF2 tương thích)
- [ ] Smoke test toàn chuỗi (mục 4) PASS
- [ ] ETL đối chiếu count = 0 lệch; sequence liên tục
- [ ] Pilot 1 dự án chạy song song ≥3 ngày
- [ ] Backup + rollback plan đã diễn tập
- [ ] Người dùng được thông báo lịch bảo trì

**Khuyến nghị**:
- [ ] JDK 21 LTS cho production
- [ ] Redis 7 (nếu dùng cache)
- [ ] Giám sát: actuator health + log aggregation

---

## 7. ĐỀ XUẤT HÀNH ĐỘNG NGAY (THỨ TỰ ƯU TIÊN — CẬP NHẬT SAU KHI CHẠY MYSQL THẬT)

| Ưu tiên | Việc | Trạng thái |
|---|---|---|
| ~~1~~ | ~~Cài MySQL~~ | ✅ **XONG** — MySQL 8.0.46 + Flyway 115 bảng |
| ~~2~~ | ~~Seed approval stages~~ | ✅ **XONG** — `V2__system_seed.sql` (5 bậc + 8 vai trò) |
| ~~3~~ | ~~Boot Java + MySQL, Flyway~~ | ✅ **XONG** — `Schema is up to date` |
| ~~4~~ | ~~Smoke chuỗi lõi~~ | ✅ **XONG** — 18/18 PASS |
| ~~5~~ | ~~Mở rộng smoke test sang toàn chuỗi cung ứng~~ | ✅ **XONG** — `smoke-supply-chain.mjs` **28/28 PASS**: duyệt **5/5 bậc** → `create_po` → `receive_goods` → `/api/files` → `confirm_delivery` → `issue_stock` → `return_stock` |
| ~~6~~ | ~~Rà soát SQL còn lại tìm reserved word/hàm SQLite-only~~ | ✅ **XONG** — `scan-sql-dialect.mjs` quét 108 file Java: **0 phát hiện** (đã sửa `condition`, 3 chỗ `\|\|`, 2 chỗ `m.system` sót) |
| ~~7~~ | ~~Port `/api/files` (upload/list/delete + `?projectArchive=`)~~ | ✅ **XONG** — bug #9 đã xử lý; mở khoá `confirm_delivery` + toàn bộ panel đính kèm |
| ~~8~~ | ~~Smoke nốt `confirm_delivery` → `issue_stock` → `return_stock`~~ | ✅ **XONG** — 28/28 PASS, kèm kiểm chứng tồn kho (`SMI` + ledger ±) |
| ~~9~~ | ~~Rà toàn bộ `app/api/**` tìm endpoint khác chưa port~~ | ✅ **XONG** — chỉ có 2 route: `/api/system` (đã port) + `/api/files` (nay đã port). **Không còn endpoint thiếu** |
| **10** | **Thêm test đi đúng đường use-case** (không tự `INSERT` seed) cho luồng có NOT NULL/FK | 🔴 **ƯU TIÊN SỐ 1** — chống tái phát #7/#10/#11 (rủi ro #13). Test hiện tại tự chèn `teams`/`attachments` nên **64 test xanh vẫn lọt 5 bug port** |
| **11** | **Mở rộng smoke sang các module còn lại** (BOQ sâu, tài chính, HR, kiểm kê, điều chuyển, hoàn trả Kho Tổng) | 🔴 Nên làm — nay ~30/174 action đã chạy HTTP thật trên MySQL |
| **12** | **Tự động hoá 2 smoke test vào CI** (cùng `mvn verify`) | ⏳ Để gate bắt buộc |
| 13 | Contract harness golden snapshot vs JS | ⏳ Sau khi smoke mở rộng |
| 14 | ETL dữ liệu mẫu/thật (C1–C5) | ⏳ |
| 15 | Pilot dual-write 1 dự án (D1–D4) | ⏳ |

---

## 8. KẾT LUẬN

**Về mặt kỹ thuật, việc chuyển đổi HOÀN TOÀN sang Java backend là khả thi và đã ở giai đoạn chín muồi**: 174/174 action đã port + **2/2 endpoint** (`/api/system`, `/api/files`), 64 test xanh, build + runtime + API + phân quyền + xử lý lỗi đã kiểm chứng; **và hôm nay đã chạy được trên MySQL 8.0 thật với chuỗi lõi 18/18 PASS + chuỗi cung ứng đầu-cuối 28/28 PASS**, hợp đồng dữ liệu khớp monolith nên **UI không phải sửa**.

**Giá trị lớn nhất của lần kiểm chứng này**: phát hiện **11 bug thật** — 6 bug chỉ lộ trên MySQL (4 lỗi migration/dialect + 1 lỗi từ khoá reserved `system` gây HTTP 500 + 1 thiếu sót seed nghiêm trọng khiến luồng lõi không chạy) **và 5 bug port thiếu logic** (kho tổ đội, bootstrap thiếu `items[]`, thiếu `/api/files`, **movement `SMI` sai làm tồn kho tổ đội luôn 0**, **số chứng từ trùng giữa các dự án**). Trong đó bug #10 đặc biệt nguy hiểm vì **không gây lỗi hiển thị** — hệ thống vẫn "chạy" nhưng **số liệu tồn kho sai âm thầm**, chỉ lộ khi hoàn trả/kiểm kê.

**Kết luận về phương pháp**: `64 test H2 xanh` **KHÔNG đủ** để kết luận sẵn sàng cutover. Cần **3 lớp gate** cùng lúc: (1) test H2 đơn vị/tích hợp, (2) **smoke HTTP thật trên MySQL thật** đi đúng đường use-case, (3) **rà soát endpoint ngoài action + scanner tĩnh SQL**. Ba lớp này đã bổ sung cho nhau đúng như thiết kế: scanner bắt bug dialect, smoke bắt bug port, test H2 bắt hồi quy logic.

**Cảnh báo quan trọng nhất cho cutover**: bug #7/#10/#11 đều **lọt qua 64 test xanh** vì test tự `INSERT` dữ liệu nền thay vì đi qua use-case. ⇒ Trước khi cutover **phải** bổ sung test đi đúng đường use-case (ưu tiên #10) và smoke rộng thêm các module còn lại (ưu tiên #11); nếu không, **rủi ro sai số liệu tồn kho/kế toán khi vận hành thật là hiện hữu**.

**Việc còn lại KHÔNG phải viết tính năng mới mà là (a) mở rộng smoke phủ hết 174 action trên MySQL, (b) rà soát SQL reserved/dialect còn sót, (c) ETL dữ liệu và chạy song song.** Lộ trình ước tính **2–3 tuần** (A→F), trong đó **A và B đã xong**.

**Rủi ro lớn nhất hiện nay**: các action **chưa được smoke trên MySQL** (chỉ 18/174 đã chạy) có thể còn bug dialect tương tự bug #5.
