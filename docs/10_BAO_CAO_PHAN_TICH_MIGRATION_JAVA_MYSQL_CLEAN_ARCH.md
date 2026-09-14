# BÁO CÁO PHÂN TÍCH KHẢ THI — MIGRATION SANG JAVA + MYSQL THEO CLEAN ARCHITECTURE

Ngày lập: 10/09/2026 · Phạm vi: codebase `VNTECH_ERP_V5_3_0_MASTER_BASELINE_R1_1_1_PROJECT_NAV_FINAL_FP_FIXED_20260908`
Loại tài liệu: **Báo cáo phân tích chi tiết** (số liệu đã kiểm chứng từ source, không phỏng đoán) — bổ sung/chuyên sâu cho `docs/06_KIEN_TRUC_MUC_TIEU_JAVA_CLEAN_ARCH.md`.

> Mục tiêu câu hỏi: *"Chuyển dự án sang kiến trúc 3 lớp + Java + MySQL có khả thi không? Nếu dùng Clean Architecture thì sao?"*

---

## 1. KẾT LUẬN NGẮN

- **Có khả thi**, nhưng phải hiểu đúng bản chất: đây KHÔNG phải là "chuyển đổi/chuyên chở" (migration), mà là **viết lại (rewrite) theo kiến trúc mới, giữ nguyên hợp đồng dữ liệu với frontend** — áp dụng chiến lược Strangler Fig (docs/06), dòng sản phẩm riêng, không chạm baseline đang chạy.
- Phần khó nhất KHÔNG nằm ở DB, cũng không ở Java — mà ở **~174 action nghiệp vụ gói trong 1 hàm** và **hợp đồng trả dữ liệu camelCase vô hình** giữa backend và SPA.
- **Clean Architecture rất hợp bài toán này**: code hiện tại đã có sẵn nửa tinh thần Port & Adapter (giao diện `D1Database` + 2 cài đặt SQLite/Postgres). Cần áp dụng **có kỷ luật, pragmatic**, nếu không sẽ phình code nặng cho khối CRUD.
- Ước lượng: **6–12 tháng cho đội 3–4 dev** (1 dev = 1.5–2 năm). Chi phí nằm ở khâu port nghiệp vụ, không phải ở khâu "đổi ngôn ngữ".

---

## 2. HIỆN TRẠNG HỆ THỐNG (KIỂM CHỨNG TỪ SOURCE)

### 2.1 Kiến trúc tổng thể
| Tầng | Đặc điểm | Bằng chứng |
|---|---|---|
| Backend | **Monolith 1 file**: `scripts/system-route.mjs` — ~3.156 dòng / 615KB, **~174 action** rẽ nhánh trong 1 hàm `handleAction()`. Không middleware, không ORM, SQL inline | đếm các nhánh `ACTION_MODULE`/`case` trong source |
| Database | 76 migration (`drizzle/0000..0075`), **114 bảng**, 160 index, 106 ALTER, 66 INSERT, 170 UPDATE, 2 trigger. SQL viết theo dialect **SQLite**, dịch sang PG tại runtime | phân tích cụm `drizzle/*` |
| Schema/entity | `db/schema.ts` chỉ khai **67/114 bảng** (thiếu **47 bảng**) → khi viết JPA/MyBatis **không được copy từ schema.ts**, phải viết từ migration SQL | đếm `CREATE TABLE` so sánh schema.ts |
| Frontend | SPA 1 file `app/page.tsx`: ~2.296 dòng, **~60 component inline cùng file**, `type Row = Record<string, any>` — **không có interface dùng chung giữa FE và BE** | đọc `app/page.tsx` |
| Giao tiếp | Chỉ **2 endpoint**: `GET /api/system` (bootstrap toàn bộ data) + `POST /api/system` (dispatch theo `action`) | `system-route.mjs` |
| Contract | Frontend truy cập ~200+ tên cột **camelCase theo quy ước SQL alias**; sai tên = lỗi âm thầm (undefined, không có type error) | đọc `bootstrap()` + các `SELECT ... AS xyz | Frame` |

### 2.2 Các luồng nghiệp vụ cốt lõi (ảnh hưởng lớn đến nỗ lực port)
| Luồng | Action đại diện | Độ phức tạp |
|---|---|---|
| Đề nghị mua → duyệt 5 bậc + SLA + email | `create_request`, `decide_approval`, `save_approval_stage` | Cao (state machine, `all_roles`, email dispatcher) |
| Mua hàng: tách PO theo phiếu, nhiều chuyến | `create_po`, `confirm_delivery`, `close_po_line` | Cao |
| Sổ kho kép theo hợp đồng (điểm khác biệt cạnh tranh) | `reconcile_contract_stock`, `transfer_contract_ownership`, `issue_stock`, `return_stock`, 3 luồng vật tư rời | Rất cao |
| Vật tư: catalog, UoM, alias chống trùng, mapping BOQ | 33 action | Cao (material matching) |
| Dự án / BOQ / hợp đồng / thanh toán HĐ | 32 action | Cao |
| Phân quyền phòng ban + RBAC + ngoại lệ | 19 action | Trung bình–Cao (54 module × 6 quyền) |
| HR / Pháp chế / Tài chính cơ bản | ~40 action | Thấp (CRUD mỏng) |
| An toàn tài khoản / phiên | `revoke_user_sessions`, lock | Trung bình |

### 2.3 Auth & Bảo mật hiện tại (phải port giữ nguyên)
- Session cookie `mep_session`, TTL 24h, token sinh bằng `crypto.random` (sha-256).
- Password **PBKDF2-SHA256 600k vòng** → trùng khớp `PBKDF2WithHmacSHA256` của Java ⇒ **người dùng không phải đổi mật khẩu khi migrate**.

---

## 3. ĐÁNH GIÁ KHẢ THI THEO TỪNG TẦNG

### 3.1 Tầng Data → MySQL — KHẢ THI CAO, LÀ PHẦN DỄ NHẤT
- **Thuận lợi bất ngờ:** SQL của dự án viết theo **SQLite** lại **gần MySQL hơn cả PostgreSQL**:
  - `?` placeholder là cú pháp gốc của cả SQLite và MySQL.
  - Dấu backtick `` ` `` là cú pháp gốc của cả SQLite và MySQL (PostgreSQL phải có adapter dịch, MySQL dùng thẳng được).
- Danh mục việc cần làm (dialect shift, liệt kê không phỏng đoán):
  | SQLite/Postgres hiện tại | MySQL thay thế |
  |---|---|
  | `datetime('now')` | `NOW()` |
  | `INSERT OR IGNORE` | `INSERT IGNORE` |
  | `strftime(...)` | `DATE_ADD`/`DATE_FORMAT` |
  | Trigger `RAISE(ABORT ...)` | Trigger không raise → **`SIGNAL SQLSTATE`** hoặc đưa guard lên application layer |
  | `TEXT` làm timestamp | `DATETIME` |
  | `$1` (khi đi qua adapter D1) | `?` |
  | 106 ALTER rời rạc | Gộp vào bảng gốc khi viết schema Flyway `V1__init.sql` |
- 47 bảng thiếu trong schema.ts ⇒ schema MySQL phải dựng từ migration SQL 0000..0075, không từ schema.ts.
- Data di trú hiện tại: `.local-data/warehouse.sqlite` (~2MB) hoặc `.vntech-data/warehouse.sqlite` → ETL script → MySQL, đối chiếu 114 bảng.
- **Lưu ý chiến lược:** hạ tầng hiện có đã chứng minh PostgreSQL 16 (docker-compose + adapter `PostgresD1Database`). PG mạnh hơn MySQL ở JSONB / CTE recursive / vector. Nếu chưa có lý do cứng (đội vận hành MySQL, chi phí license môi trường…), **đề xuất cân nhắc giữ PG cho bản Java** — MySQL nên chỉ được chọn khi có lý do rõ ràng.

### 3.2 Tầng Logic → Java/Spring Boot — PHẦN NẶNG NHẤT
- 174 action ⇒ tầng Service. Phân loại thực tế:
  - **~60% CRUD mỏng** (catalog, HR/legal, tài chính đơn giản) → di chuyển câu lệnh, thao tác nhẹ.
  - **~40% luồng nghiệp vụ phức tạp** → cần thiết kế lại nghiêm túc trong domain layer: máy phê duyệt 5 bậc + SLA + `all_roles`, sổ kho kép theo hợp đồng + chuyển quyền sở hữu, luồng cấp vật tư (đề nghị → PO → nhập → chuyến giao → BCH xác nhận), material matching, sinh số chứng từ, import Excel hàng loạt.
- Auth/RBAC: port được ~2 tuần (PBKDF2 tương thích, session trùng hình).

### 3.3 Tầng Presentation → React — KHÔNG CẦN ĐỤNG
- Frontend chỉ đọc **2 endpoint** và biết **tên action** + **shape camelCase**.
- Nếu backend Java **tái tạo đúng contract** (`/api/system` GET/POST + cùng shape + cùng tên action) ⇒ `app/page.tsx` **giữ nguyên không sửa**. Đây là đòn bẩy giảm rủi ro lớn nhất.
- Nếu muốn chuyển sang REST chuẩn (`GET /purchase-orders`, `POST /requests`…) ⇒ **viết lại frontend**, nhân đôi chi phí — không khuyến khích trong giai đoạn đầu.

### 3.4 Tổng hợp khả thi
| Tầng | Khả thi | Độ khó | Nhận định |
|---|---|---|---|
| Data → MySQL | ✅ Cao | Thấp–TB | Gần với SQL hiện có hơn PG; cần ETL + schema đầy đủ |
| Logic → Java | ✅ Được | **Cao** | 174 action; 40% nghiệp vụ phức tạp cần domain thiết kế lại |
| UI → React | ✅ Giữ nguyên | Thấp | Chỉ cần 2 endpoint contract đúng |
| Integrity gates | ⚠️ Chặn in-place | — | Phải làm dòng sản phẩm ngoài baseline (xem §5) |

---

## 4. THIẾT KẾ CLEAN ARCHITECTURE (CHUYÊN SÂU)

### 4.1 Vì sao Clean Architecture hợp — dự án đã có sẵn nửa pattern
Trong `scripts/`, database được trừu tượng hóa qua interface **`D1Database`** với 2 cài đặt:
- `LocalD1Database` (SQLite, `node:sqlite`) — dev/test
- `PostgresD1Database` (PostgreSQL) — production/docker

Đây chính là tinh thần **hexagonal/Port-Adapters** ở tầng hạ tầng. Clean Architecture chỉ cần đẩy nguyên lý này lên đúng tầng: thay vì adapter dưới DB, mở rộng thành **repository ports** cho nghiệp vụ. ⇒ Không phải "xé bỏ" tư tưởng hiện tại mà là **hoàn thiện hạt giống đã có**.

### 4.2 Sơ đồ 4 vòng (theo Robert C. Martin)
```
┌────────────────────────────────────────────────────────────────────────┐
│  INTERFACES (Web) — React SPA hiện tại (KHÔNG ĐỔI)                       │
│  GET  /api/system  → bootstrap(data)   ·  POST /api/system {action,...} │
├────────────────────────────────────────────────────────────────────────┤
│  ADAPTERS (trình điều khiển)                                            │
│  SystemController (1 class duy nhất) → parse payload → route theo action│
│  → Presenter/DTO map về shape camelCase cũ (contract seam)               │
├────────────────────────────────────────────────────────────────────────┤
│  APPLICATION (Use Cases) — thuần nghiệp vụ, KHÔNG biết Spring/MySQL      │
│  MaterialCatalogUseCase, RequestUseCase, ApprovalUseCase (5 bậc + SLA), │
│  PurchaseOrderUseCase, StockIssueUseCase, ContractStockLedgerUseCase,   │
│  StocktakeUseCase, RecoveryUseCase, ProjectUseCase, LegalUseCase...      │
│  → Ports: RequestRepository, ApprovalStageRepository, StockLedgerRepo,  │
│    MaterialRepository, UserRepository, ProjectRepository...              │
├────────────────────────────────────────────────────────────────────────┤
│  DOMAIN (lõi, không phụ thuộc framework/DB)                             │
│  Entities: Material, MaterialAlias, Request, Approval (State Machine),  │
│    PurchaseOrder, StockMovement, ContractStockLedger, MaterialNorm,     │
│    OrganizationUnit, Project, User, Advance...                          │
│  Domain Services: ApprovalEngine, StockLedgerEngine, NumberingEngine,   │
│    MaterialMatcher, TransferOwnership...                                │
├────────────────────────────────────────────────────────────────────────┤
│  INFRASTRUCTURE (adapters — mọi chi tiết kỹ thuật nằm ở đây)            │
│  MySQL adapter (JPA/MyBatis + Flyway V1__init.sql)                      │
│  (Tùy chọn) SQLite adapter cho test fast                                │
│  Session store, Email/Outbox, Excel openxml, Redis cache/job            │
│  Licensing: Ed25519 (thay fingerprint-hash của JS)                      │
└────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Nguyên tắc áp dụng thực tế (quan trọng — tránh over-engineering)
1. **Entity domain chỉ cho module có nghiệp vụ thật** (≈6 module lõi: phê duyệt, kho, dự toán/BOQ, mua, tài chính, dự án). CRUD mỏng (~60%) đi thẳng Use Case → Repository port, không bắt xây đủ entity — nếu không code phình vô nghĩa.
2. **Không 174 use-case class.** Gom theo module: **~20–30 class Use Case**, mỗi class chứa các phương thức action của module đó (vd `RequestUseCase.create/resubmit/cancel/decide`).
3. **1 use case = 1 transaction.** Clean Architecture hay mất `@Transactional` ở controller ⇒ dùng **UseCaseRunner + interceptor** mở/commit transaction quanh each use case (app có action chạm nhiều bảng: sổ kho + chứng từ + history).
4. **Contract camelCase sống ở biên DTO**, không được để entity/domain ngấm shape API — nếu không sẽ "tái kết dính" monolith.
5. **Domain không import framework/DB** (dependency inversion). Kiểm soát bằng checkstyle/archunit trong CI để ngăn ngược vòng.

### 4.4 Clean Architecture vs Spring "3-layer"
- Spring Boot mặc định có sẵn **3-layer**: Controller – Service – Repository. Đó KHÔNG phải Clean Architecture (Service biết DB, không có domain thuần).
- Chọn **1 trong 2, không trộn** — trộn sẽ phá dependency rule (điều cực dễ xảy ra với team quen Spring).
- 3-layer: nhanh hơn, ít boilerplate, phù hợp nếu ưu tiên tốc độ. Clean Architecture: đắt hơn ~10–20% nhưng tăng testability + khả năng bảo trì + đổi DB/framework không động business. Cho dự án ERP nhiều luồng 5-bậc/sổ kho kép ⇒ **chọn Clean Architecture pragmatic**.

### 4.5 Lợi ích cụ thể
- **Testability cao:** use case test bằng repository giả/SQLite — FAST, không cần MySQL trong CI (tận dụng sẵn adapter D1 hiện có).
- Quy tắc nghiệp vụ kiểm chứng độc lập: phê duyệt/SLA, sổ kho, quyết toán test đơn vị thuần — nơi bug ăn tiền nhất.
- Chỉ **1 controller** ⇒ phần interface adapter gần như miễn phí, seam để chuyển dần theo Strangler Fig.
- **Đổi cơ chế lưu trữ không chạm logic** — đúng nhu cầu "dữ liệu sẵn sàng để nâng cấp/đổi engine".

---

## 5. RÀNG BUỘC QUAN TRỌNG NHẤT: HỆ TOÀN VẸN VNTECH

**Hệ integrity gate sẽ chặn mọi thay đổi trong repo hiện tại:**
- `verify-vntech-fingerprint.mjs` hash **toàn bộ source tree** (198 file) — bỏ/đổi `system-route.mjs` ⇒ fingerprint lệch ⇒ build/cài/release/master-baseline-gate đều fail.
- `preflight-source.mjs` kiểm tra ~19 marker bắt buộc trong `page.tsx` và `system-route.mjs`.
- Migration chỉ append-only (0000..0075), không được sửa schema cũ.

⇒ Hệ quả bắt buộc:
1. Bản Java + MySQL là **dòng sản phẩm mới (V6/next-gen) tách hẳn repo baseline** — không tiến hành trong repo đang hash.
2. Baseline V5.3.0 **đóng băng như reference implementation**: mọi hành vi/hợp đồng/schema là chuẩn đối chiếu.
3. Đổi cơ chế license/trust: Java dùng **bảng `vntech_product_identity` + Ed25519**, không gate theo fingerprint-hash file nguồn (docs/06 §6.5).

---

## 6. CHI PHÍ & LỘ TRÌNH (CẬP NHẬT THEO SỐ LIỆU MỚI)

### 6.1 Ước lượng nguồn lực
| Giai đoạn | Nội dung | Effort (đội 3–4 dev) |
|---|---|---|
| 0. Chốt contract | Băng hóa `bootstrap()` + 174 action payload thành OpenAPI/Zod; Action Catalog; Data Model Reference 114 bảng | 2–3 tuần |
| 1. Data | Schema MySQL đầy đủ (từ 76 migration, không từ schema.ts) + Flyway + ETL từ SQLite/PG + đối chiếu | 3–4 tuần |
| 2. Nền Java | Spring Boot 3 (Java 17/21) + package 4 tầng + auth/RBAC/session + UseCaseRunner + skeleton ~20–30 use case | 3–4 tuần |
| 3. Service | Port CRUD trước, luồng nghiệp vụ sau (Catalog → BOQ → MR/Approval → PO/Receipt → Stock → Finance → Legal theo phụ thuộc dữ liệu) | **3–6 tháng** |
| 4. Dual-run | Gateway action: slice đã migrate → Java; chưa → JS; so sánh kết quả 2 backend | 1–2 tháng |
| 5. Cutover | Chuyển FE sang backend Java, tắt backend JS, licensing Ed25519, dọn dẹp | 2–3 tuần |

Tổng: **6–12 tháng, đội 3–4 dev**. 1 dev: 1.5–2 năm. Trọng tâm chi phí 100% nằm ở bước 3.

### 6.2 Chiến lược triển khai
- **Strangler Fig theo lát cắt dọc** (docs/06): mỗi slice = 1 milestone đóng gói, demo được, rollback được. Không big-bang, không gộp slice.
- **Thứ tự slice theo phụ thuộc dữ liệu**: Material Catalog → BOQ/Norm → Request/Approval → PO/Receipt → Stock/Contract Ledger → Finance → Legal.

---

## 7. RỦI RO & NGUYÊN TẮC PHÒNG TRÁNH

1. **Không đổi UI khi đổi backend** — giữ React SPA + contract action; UI chỉ nâng cấp sau khi backend Java ổn định.
2. **Port lại ĐÚNG nghiệp vụ, không "cải tiến" lúc port:** 5 bậc duyệt + SLA + email, multi-contract stock, matching vật tư, thu hồi vốn chuỗi, giao khoán tổ đội — port nguyên trạng, tinh chỉnh sau.
3. **MySQL là 1 adapter, không phải kiến trúc** — repository interface giữ; sau này cần Oracle/PG chỉ thêm adapter.
4. **Boilerplate phình** — kiểm soát bằng quy tắc §4.3 (entity chỉ nơi nghiệp vụ thật, gom use case, 1-controller).
5. **Transaction boundary** — 1 use case = 1 transaction (UseCaseRunner), không để controller tự vụ transaction.
6. **47 bảng thiếu schema.ts** — không copy schema.ts; viết từ migration SQL.
7. **CE ambiguity ở contract** — phải băng hóa bằng OpenAPI/Zod trước khi code (bước 0 là bắt buộc).
8. **Git/ownership** — nhánh riêng / repo riêng; tránh conflict với baseline đang release.

---

## 8. KẾT LUẬN & KHUYẾN NGHỊ

1. **Feasible: CÓ**, với điều kiện hiểu đúng là **rewrite theo Strangler Fig + giữ contract**, không phải "migrate một cách êm ái".
2. **Clean Architecture: áp dụng được và đáng làm**, với kỷ luật pragmatic (§4.3); dự án đã có sẵn tinh thần adapter D1.
3. **React GIỮ NGUYÊN** làm client trung gian ⇒ rủi ro thấp, có sản phẩm chạy sớm.
4. **Java + Spring Boot + Clean Architecture pragmatic**, DB **MySQL** (hoặc cân nhắc giữ PostgreSQL nếu chưa có lý do cứng — xem §3.1).
5. **Baseline V5.3.0 đóng băng**; bản Java là dòng sản phẩm mới ngoài repo baseline (ràng buộc fingerprint gate).
6. Bước 0 (băng hóa contract) và bước 4 (dual-run) là **bắt buộc, không phải tùy chọn**.

---

## 9. VĂN BẢN LIÊN QUAN
- `docs/06_KIEN_TRUC_MUC_TIEU_JAVA_CLEAN_ARCH.md` — kiến trúc mục tiêu + lộ trình Strangler Fig (mức chiến lược).
- `docs/04_KE_HOACH_PHAT_TRIEN.md` — kế hoạch phát triển chung.
- `docs/09_KE_HOACH_GO_LIVE_VA_PHAT_TRIEN_LOI_MEP.md` — lõi nghiệp vụ mua hàng đã kiểm chứng (174 action).
- Source phân tích: `scripts/system-route.mjs`, `app/page.tsx`, `db/schema.ts`, `drizzle/0000..0075`, `scripts/local-server.mjs`, `scripts/universal-server.mjs`.