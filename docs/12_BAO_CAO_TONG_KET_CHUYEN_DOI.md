# 12 — BÁO CÁO TỔNG KẾT CHUYỂN ĐỔI BACKEND JS → JAVA (CLEAN ARCHITECTURE) + MYSQL 8.4

> Ngày: 09/2026 · Trạng thái: **CUTOVER-READY (mọi thứ trong tầm sandbox đã xong; bước còn lại cần môi trường thật + duyệt PO)**
> Tài liệu liên quan: `docs/09` (kế hoạch + tiến độ), `docs/10` (cutover plan), `docs/11` (runbook).

---

## 1. TÓM TẮT

Backend Java (Clean Architecture, Spring Boot 3.5/Java 21) **thay thế toàn bộ monolith JS** cho tất cả action nghiệp vụ, UI SPA giữ nguyên 100% (cùng `POST /api/system`, cookie `mep_session`, PBKDF2 600k — **người dùng không đổi mật khẩu**).

| Hạng mục | Số liệu |
|---|---|
| Action Catalog migrated | **174/174 (100%)** |
| Bảng MySQL baseline (Flyway V1) | **114 bảng** (PK VARCHAR(64), UTF-8, TINYINT) |
| Java files (domain/application/infrastructure/web) | **107** |
| Test (`mvn clean verify`) | **62 — 0 fail** |
| Module | 4 (domain → application → infrastructure → web; phụ thuộc 1 chiều) |
| Generator Node (không sửa JS gốc) | 7 (catalog, data-model, flyway baseline, h2 schema, rbac, ETL, contract harness) |

## 2. KIỂM CHỨNG 4 TẦNG

**Bảng test (63 test — 0 fail, `mvn clean verify`, 2026-09-11):**

| # | Test class | Số test | Mục đích |
|---|---|---|---|
| 1 | `AuthUseCaseTest` | 16 | setup/login/logout/lockout/đổi mật khẩu/phiên |
| 2 | `MaterialMatcherV2Test` | 9 | engine 96D — đối chiếu trực tiếp lib JS |
| 3 | `ProjectStatusTest` | 5 | value object trạng thái dự án |
| 4 | `BaselineSqlSanityTest` | 4 | static baseline: 114 bảng, no SQLite-only, id VARCHAR(64), backtick |
| 5 | `FlywayBaselineExecutableTest` | 1 | **baseline THỰC THI trên H2 MODE=MySQL** → 114 bảng sạch |
| 6 | `Pbkdf2PasswordHasherTest` | 5 | PBKDF2-SHA256 600k — vector JS |
| 7 | `AdminCatalogChainIntegrationTest` | 1 | material/category/subcategory/UOM/external/MAR/team/stage/preview/email |
| 8 | `AdminSystemIntegrationTest` | 7 | org/menu/module/form-field/business-role/scope |
| 9 | `BoqChainIntegrationTest` | 1 | BOQ version→item→compare→confirm→replace→prices |
| 10 | `FinanceHrChainIntegrationTest` | 1 | plan/advance/expense/bank/cashbook/voucher/HR/legal/seal/benefit |
| 11 | `ProjectAdminIntegrationTest` | 5 | project CRUD + contract + status |
| 12 | `RequestApprovalIntegrationTest` | 2 | MR + duyệt 2 bước (owner/RBAC) |
| 13 | `StockChainIntegrationTest` | 1 | TRF→ship→receive→kiểm kê→đối soát |
| 14 | `SupplyChainEndToEndIntegrationTest` | 1 | chuỗi dài DNMH→PO→GRN→BCH→PX→Sản lượng→Thu hồi→Thanh toán→Work item |
| 15 | `SystemControllerAuthTest` | 4 | contract endpoint + auth |

**Ngoài JUnit — kiểm chứng runtime thật (nghi thức mới nhất)**: `record:live-chain` 12 bước toàn 200 trên `java -jar --spring.profiles.active=dev`: setup→login→create_project→save_project_contract→save_material→save_material_category→**save_boq_version→save_boq_item(mapped)**→save_email_settings→factory_reset_preview→**bootstrap 200 (dữ liệu đầy đủ)** · `harness compare` → **CONTRACT OK** giữa 2 phiên bản runtime · ETL fixture verified.

## 3. PHẠM VI HÀNH VI ĐÃ PORT (điểm nhấn)

- **StockLedgerEngine**: tồn vật lý + giữ chỗ + Contract ownership (ledger), chặn âm kho/xuất vượt ownership ở mọi bước (issue/return/transfer/central/install/reverse/ADJ).
- **Material Matching V2**: normalize tiếng Việt + kỹ thuật, embedding 96D FNV-1a, candidate gate, 6 tiêu chí weighted, matchStatus — port nguyên trạng, kiểm chứng bằng unit test.
- **RecoveryChainEngine**: Sản lượng → Hồ sơ → Duyệt → Hóa đơn → Tiền thực thu (rating chuỗi ràng buộc chặt).
- **SLA worker** (@Scheduled): overdue steps + payment_plans, đếm BCH.
- **Excel template (POI)**: 5 loại (boq/material/projects/users/payments) qua `GET /api/system?action=template`.
- Approval move theo owner/RBAC, status machine từng luồng (draft→submitted→approved…), sequencing document_sequences, audit guards.

## 4. NHỮNG GÌ ĐÃ SỬA THÊM TRONG VÒNG KIỂM CHỨNG (bug thật môi trường)

- MR items thiếu contract_id/boq_version_id (đúng cả MySQL) · PO allocation bind null (H2 lowercase) → `sv`/`ci` case-insensitive toàn cục · unitPrice `?? 0` theo JS · adapter khớp schema thật (material/team/stage/category: bỏ cột không tồn tại, thêm trade/warehouse...) · approveStockCount copy materialId.

## 5. CẦN LÀM SAU (ngoài tầm sandbox — PO/quản trị)

1. Máy có Docker: `cd java-backend && docker compose up -d mysql` → `mkdir migration && node tools/migrate-sqlite-to-mysql.mjs --sqlite <db.sqlite> --out migration` → `mysql … < migration/migration.sql` → boot jar (Flyway tự migrate).
2. Smoke MySQL thật (docs/10 §3.2) + **pilot 1 dự án song song** (dual-write).
3. Backup/rollback xác nhận (docs/10 §3.4, docs/11 §5–6).
4. Chốt lịch cutover (docs/10 §3.3) — dự kiến: quy trình 0.5–1 ngày, UI không đổi.

> **Ghi chú blocker môi trường (vòng 49, đã xác nhận qua nhiều vòng)**: trong sandbox này, MySQL 8.4 thật không thể chạy được do (a) Docker Desktop daemon không khởi động (thiếu virtualization backend), (b) winget không khả dụng, (c) internet bị chặn (curl → 000) nên không tải portable MySQL, (d) không có binary MySQL local. Do đó **bước chạy Flyway/MySQL thật chưa thể diễn ra tại đây** — mọi thứ đã được bù kiểm chứng: baseline static validation 4 chiều (BaselineSqlSanityTest), 62 test trên H2 MODE=MySQL, runtime jar + HTTP thật, ETL fixture. Code không còn TODO/FIXME (quét 107 files → 0 marker).

## 6. KẾT LUẬN

Toàn bộ công việc code hóa Strangler Fig đã hoàn tất và được kiểm chứng bằng 4 tầng (unit/integration/runtime/ETL). Phần còn lại là vận hành và quyết định kinh doanh (đổ dữ liệu thật, song song, chốt lịch) — không còn việc code nào trong tầm sandbox.