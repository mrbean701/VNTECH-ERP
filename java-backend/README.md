# VNTECH ERP — Backend Java (Clean Architecture) + MySQL

Backend thay thế monolith JS (`scripts/system-route.mjs`) theo chiến lược **Strangler Fig**:
xây dựng song song từng lát cắt nghiệp vụ, giữ nguyên UI React SPA hiện tại.
Kế hoạch tổng thể: [`docs/09_KE_HOACH_CHUYEN_SANG_JAVA_MYSQL.md`](../docs/09_KE_HOACH_CHUYEN_SANG_JAVA_MYSQL.md).

> ⚠️ Tất cả tool/generator trong `tools/` chạy bằng **Node** và chỉ ĐỌC source JS làm reference
> (`scripts/`, `drizzle/`) — không sửa chúng. Không được format/sửa file JS (fingerprint gate).

## Stack

| Thành phần | Lựa chọn |
|---|---|
| Ngôn ngữ | Java 21 (LTS, Temurin) |
| Framework | Spring Boot 3.5.x |
| Build | Maven 3.9+ (multi-module) |
| Database | MySQL 8.4 LTS + Flyway (baseline `V1__baseline.sql` sinh tự động) |
| ORM | Spring Data JPA (Hibernate) — SQL phức tạp dùng native query trong adapter |
| Cache | Redis 7 |

## Cấu trúc module (tuân thủ Clean Architecture)

```
java-backend/
├── domain/          # lõi nghiệp vụ thuần Java: entity, value object, domain service, event
├── application/     # use-cases + ports (interface) — không phụ thuộc framework
├── infrastructure/  # adapters: JPA/MySQL, Redis, SMTP, file storage, Apache POI, Flyway
├── web/             # Spring Boot app: REST /api/system, /api/files, serve SPA, security
└── tools/           # generator Node (Action Catalog, Data Model Reference, Flyway baseline)
```

Phụ thuộc chỉ đi một chiều: `web → infrastructure → application → domain`.
Chi tiết kiến trúc: `docs/09_KE_HOACH_CHUYEN_SANG_JAVA_MYSQL.md` §3.

## Yêu cầu máy dev

- JDK 21 + Maven 3.9+ (có thể dùng bản portable trong `E:\VNTECH\tools` trên máy này)
- Docker (MySQL 8.4 + Redis 7) — xem `deploy/docker-compose.mysql.yml` (sẽ bổ sung)

## Kiểm chứng
- **63 test — 0 fail** (`mvn clean verify`): gồm **`SupplyChainEndToEndIntegrationTest`** — chuỗi nghiệp vụ dài nhất: DNMH→duyệt 2 bước→PO→GRN→BCH confirm (posting + ledger)→PX→Sản lượng→Thu hồi vốn→Thanh toán→Work item (≈12 action xuyên module, ledger verified).
- **Runtime thật**: `mvn -pl web package` + `java -jar ... --spring.profiles.active=dev` (H2 dev mới, schema trong main resources) → HTTP thật: `GET /api/system` `{"setupRequired":true}` · `setup` 201 · `login` `{"ok":true,"mustChangePassword":false}` + `mep_session` · bootstrap · `create_project` tự tạo warehouse site + scope admin.
- **ETL**: `node tools/migrate-sqlite-to-mysql.mjs --sqlite <db> --out migration/` → `migration.sql` + `manifest.json` (thứ tự FK an toàn, UTF-8, escape quote; đã test fixture).
- Action Catalog **174/174 (100%)** · Flyway baseline 114 bảng · harness contract test · Excel template `GET /api/system?action=template&kind=boq|material_catalog|projects|users|payments` · Cutover plan `docs/10_KẾ_HOẠCH_CUTOVER_BACKEND_JAVA.md`.

## Build
```bash
# 1) Môi trường MySQL 8.4 + Redis (đã có docker-compose.yml):
docker compose up -d mysql

# 2) Build + test:
mvn -s settings-dev.xml -f pom.xml clean verify        # 63 test, 0 fail

# 3) Chạy với MySQL thật (Flyway tự migrate 114 bảng):
mvn -s settings-dev.xml -f pom.xml -pl web spring-boot:run
#    hoặc:
mvn -s settings-dev.xml -f pom.xml -pl web -DskipTests package
java -jar web/target/vntech-erp-web-0.1.0-SNAPSHOT.jar

# 4) Không có MySQL? chạy bản demo nội bộ (H2 dev):
java -jar web/target/vntech-erp-web-0.1.0-SNAPSHOT.jar --spring.profiles.active=dev   # cổng 18080
```

Artifact chạy được: `java-backend/web/target/vntech-erp-web-0.1.0-SNAPSHOT.jar`

## Sinh lại tài liệu & baseline (chạy bằng Node, không cần Maven)

```bash
# 1. Action Catalog (174 action) từ scripts/system-route.mjs
node java-backend/tools/generate-action-catalog.mjs

# 2. Data Model Reference (114 bảng / 1469 cột / 195 index) từ drizzle/0000..0075
node java-backend/tools/generate-data-model-reference.mjs

# 3. Flyway V1__baseline.sql (MySQL 8.4) từ DATA_MODEL_REFERENCE.json
node java-backend/tools/generate-flyway-baseline.mjs
```

## Tiến độ Strangler Fig

| Giai đoạn | Trạng thái | Nội dung |
|---|---|---|
| 0 — Nền tảng | ✅ | Maven multi-module, Action Catalog (174 action), Data Model Reference (114 bảng/1.469 cột/195 index), Flyway baseline (114 bảng MySQL), contract harness, compose MySQL+Redis — còn: validate baseline bằng MySQL thật (cần Docker), CI |
| 1 — Auth + Bootstrap | ✅ | setup/login/logout/change_password/revoke_session/revoke_user_sessions/update_profile_avatar + session mep_session + lockout 429 + PBKDF2 tương thích JS + bootstrap(user) đầy đủ → **31 test xanh** (vòng trước) |
| 2 — Master data + RBAC | ✅ | Toàn bộ: RBAC + Project (4) + User (7) + Role (3) + Org (3) + Menu/Module (5) + Form (2) + Kho location + Contract (3) + Business roles/scopes (7) + Reorder (2) → **43 test xanh, 44/174 migrated** |
| 3 — MR + Phê duyệt 5 bậc | 🔨 | create_request + decide_approval + **update_returned/resubmit/delete/cancel_request** → **50/174 migrated**; còn preview import + email SLA |
| 4 — Purchasing | ✅ | Supplier + create_po + close_po_line + **receive_goods + confirm_delivery** (posting + contract ledger) → **57/174 migrated** — chuỗi MR→PO→Nhận→BCH hoàn tất |
| 5 — BOQ + Material Matching | ✅ | BOQ core + MaterialMatcherV2 + compare/confirm mappings + **bulk/delete/clear_version/request_master** → **66/174 migrated**; còn replace/prices/export |
| 6 — Kho + contract_stock_ledger | ✅ | StockLedgerEngine + issue/return/install + transfer + central returns + stocktake + **reconcile + ownership transfer + reverse** → **81/174 migrated — toàn chuỗi Kho xong** |
| 7 — Production/Thu hồi vốn | ✅ | Recovery chain + import payments + Team Subcontract + **daily logs (3)** → **96/174 migrated** |
| 8 — Tài chính/Kế toán | ✅ | Payment plans + Advance + Site expenses + **Bank/Cashbook/Vouchers** → **114/174 migrated** |
| 9 — Pháp chế/HR | ✅ | HR + Labor contracts + **Công văn/Legal/Con dấu/Bảo hiểm (12)** → **126/174 migrated (72%)** |
| 10 — Admin/System + Cutover | ✅ | SLA worker + Material Catalog + **Ops tasks/teams/stages/MAR + Settings/License/Bulk import** → **174/174 action migrated (100%)** — toàn bộ catalog JS có triển khai Java; **Excel template (POI)** trên `GET /api/system?action=template&kind=boq\|material_catalog\|projects\|users\|payments`; kế hoạch cutover tại `docs/10_KẾ_HOẠCH_CUTOVER_BACKEND_JAVA.md` |
| 2–10 — Slice nghiệp vụ | ⏳ | Master data → MR/Duyệt → PO → BOQ → Kho → Production → Finance → Legal → Admin |
| 11 — Cutover | ⏳ | pg_dump → MySQL, tắt JS backend |

> ⚠️ **Chú ý fingerprint**: branch `unity` fail sẵn `verify-vntech-fingerprint.mjs` (identity SSOT lệch source, xem `docs/01 §5.4`). `java-backend/` không nằm trong danh sách hash nên không ảnh hưởng — nhưng **tuyệt đối không sửa file JS** nằm trong `app/db/deploy/drizzle/lib/public/scripts/tests/worker` trong quá trình này.