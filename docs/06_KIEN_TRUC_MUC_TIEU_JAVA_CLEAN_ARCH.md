# KIẾN TRÚC MỤC TIÊU — VNTECH ERP JAVA CLEAN ARCHITECTURE + MySQL

Bản cập nhật: 09/2026 · Quyết định chiến lược: giữ monolith JS V5.3.0 làm **bản tham chiếu**, xây hệ **Java Clean Architecture** thay thế từng lát (Strangler Fig), đổi DB sang **MySQL** ở tầng infrastructure.

---

## 1. BỐI CẢNH & QUYẾT ĐỊNH

- Monolith JS (SPA 1 file + backend 1 file `system-route.mjs`, ~200 action, DB qua adapter D1-like) được xây **nhanh nhất có thể** — đúng mục tiêu, đang hoạt động tốt, đã có toàn bộ nghiệp vụ Kho/M&E/BOQ/Mua/Phê duyệt/Tài chính/Pháp chế.
- Hướng tương lai đã chốt: **Java + Clean Architecture**, DB ⇒ **MySQL**.
- Hệ quả trực tiếp: **không refactor monolith JS thành layered modules** (Phase 3.1/3.2 cũ). Đó là nợ kỹ thuật bỏ đi khi Java thay thế; mỗi lần chạm file đều đụng fingerprint gate rất đắt.

> Nguyên tắc: **monolith JS = đặc tả đang chạy (reference implementation)**. Mọi hành vi, quy tắc nghiệp vụ, hợp đồng action, data model được "đóng băng" làm chuẩn cho bản Java. Hệ Java thay thế **theo lát cắt dọc**, không gộp nhiều biến đổi (không vừa đổi backend vừa đổi UI vừa đổi DB cùng lúc).

---

## 2. KIẾN TRÚC MỤC TIÊU (JAVA CLEAN ARCHITECTURE)

```
┌──────────────────────────────────────────────────────────────────┐
│  INTERFACES WEB (adapter)                                         │
│  Spring Boot REST + gateway tương thích POST /api/system {action} │
│  + OpenAPI + (tùy chọn) giữ React SPA hiện tại làm client         │
├──────────────────────────────────────────────────────────────────┤
│  APPLICATION (use-cases)                                          │
│  Mỗi use-case 1 class thuần: MaterialCatalogUseCase,              │
│  RequestApprovalUseCase (máy trạng thái 5 bậc + SLA),             │
│  StockIssueUseCase, ContractStockLedgerUseCase, RecoveryUseCase…  │
│  Ports (interfaces) khai báo ở tầng này, KHÔNG phụ thuộc framework │
├──────────────────────────────────────────────────────────────────┤
│  DOMAIN (lõi, không phụ thuộc gì)                                 │
│  Entities / Value Objects / Domain Services / Domain Events        │
│  Project, Material, MaterialAlias, PurchaseOrder, Approval,        │
│  StockMovement, ContractStockLedger, MaterialNorm, Advance…        │
├──────────────────────────────────────────────────────────────────┤
│  INFRASTRUCTURE (adapters — mọi chi tiết kỹ thuật nằm đây)         │
│  MySQL repository (JDBC/JPA + Flyway migrations)                   │
│  Redis cache/job, SMTP, file storage, export OpenXML/MISA          │
│  Licensing: port Ed25519 verifier + vntech_product_identity        │
└──────────────────────────────────────────────────────────────────┘
```

Điểm mấu chốt của Clean Architecture ở đây:
1. **Domain không import framework/DB** → MySQL chỉ là 1 adapter, đổi sau dễ.
2. **Ports (interface repository) do use-case định nghĩa** → test unit thuần, không cần DB.
3. **Hợp đồng `POST /api/system {action}` là seam (đường may)** → UI React hiện tại **không cần sửa** trong suốt quá trình chuyển đổi; gateway route action đã migrate sang Java, action chưa migrate vẫn gọi JS.

---

## 3. VÌ SAO KHÔNG TÁCH MONOLITH JS THÀNH TẦNG

| Phương án | Chi phí | Giá trị cho đích Java/MySQL |
|---|---|---|
| Tách `handleAction` thành module JS (Phase 3.1 cũ) | Cao: đụng ~200 action, fingerprint, nhiều vòng release | Thấp: tri thức tầng use-case sẽ phải làm lại bằng Java |
| Tách SPA thành components + router (Phase 3.2 cũ) | Rất cao: 570KB file minified, marker contract | Thấp: UI sẽ được giữ nguyên làm client, không cần tách để dùng lại |
| Tách DB schema.ts / migration framework | Cao, rủi ro phá 99 bảng | Thấp: MySQL sẽ là schema mới do Flyway quản lý từ data model hiện có |
| **"Đóng băng" monolith làm reference + xây Java song song** | Trung bình/hợp lý, ít rủi ro | **Cao**: đúng đích Clean Architecture + MySQL, UI giữ nguyên |

---

## 4. LỘ TRÌNH TRIỂN KHAI (STRANGLER FIG)

### Giai đoạn 0 — Chuẩn bị nền (2–4 tuần)
1. Đóng băng chức năng JS: snapshot `ACTION_MODULE`/`MODULE_KEYS` (đã có trong `system-route.mjs`) → **Action Catalog** dùng làm service boundary.
2. Xuất **Data Model Reference**: 99 bảng từ migrations 0000..0064 (contract-stock ledger, approval 5 bậc, team subcontract, material matching…) → tài liệu + seed dữ liệu mẫu.
3. Dựng skeleton Java: Spring Boot 3 (Java 17/21) + package theo 4 tầng + Flyway + MySQL container + CI (build/test gates kiểu “xanh lá” riêng cho Java).
4. Chọn **slice đầu tiên** (khuyến nghị: Material Catalog → BOQ → MR/Approval → PO/Receipt → Stock → Finance → Legal — theo phụ thuộc dữ liệu).

### Giai đoạn 1..N — Chuyển từng lát cắt dọc
Mỗi slice (vd "Approval 5 bậc") làm TRỌN theo thứ tự:
- Domain entity + quy tắc (state machine, SLA, email).
- Use-case + ports.
- Repository MySQL adapter + Flyway migration (port từ SQL của slice đó, đổi dialect sang MySQL).
- REST endpoint + tích hợp gateway `POST /api/system` (action thuộc slice → route Java; ngoài slice → JS).
- Test: unit (domain), integration (repo MySQL), contract test (gateway).

### Giai đoạn cuối — Cắt bỏ hệ cũ
- Khi toàn bộ action đã route sang Java: tắt backend JS (`system-route.mjs`), giữ UI React.
- Chuyển licensing/trust (vntech_product_identity, Ed25519) sang Java infrastructure.
- Xoá dần mã JS backend; lưu lại làm tài liệu tham chiếu (đóng gói zip riêng, không nằm trong source Java).

---

## 5. CHUYỂN DỮ LIỆU SANG MYSQL

1. Schema: Flyway `V1__init.sql` sinh từ data model hiện có; **giữ nguyên mô hình cốt lõi**: tách tồn vật lý (warehouse) khỏi sở hữu kế toán (contract) qua `procurement_allocations` + `contract_stock_ledger` (đây là khác biệt cạnh tranh — đừng làm mất).
2. Dialect: sửa các điểm không tương thích SQLite/Postgres → MySQL (LIMIT, booleans, timestamps TEXT → DATETIME, `INSERT OR IGNORE` → `INSERT IGNORE`, `RAISE(ABORT)` trigger → thay bằng application-level guard/Flyway guard).
3. Dữ liệu: script import từ Postgres/SQLite hiện có (pg_dump → CSV → bulk load); **không chuyển identity fingerprint** theo cơ chế hash-file JS — license/trust Java dùng bảng `vntech_product_identity` + Ed25519 nhưng không gate theo fingerprint file nguồn.
4. Password PBKDF2-SHA256 (600k vòng) giữ nguyên — tương thích Java (PBKDF2WithHmacSHA256) nên người dùng không phải đổi mật khẩu.

---

## 6. RỦI RO & NGUYÊN TẮC

1. **Không đổi UI khi đổi backend** — giữ React SPA + hợp đồng action; UI chỉ nâng cấp sau khi backend ổn định.
2. **Port lại ĐÚNG nghiệp vụ, không "cải tiến"**: 5 bậc duyệt + SLA + email, multi-contract stock, matching vật tư, thu hồi vốn chuỗi (sản lượng→hồ sơ→hóa đơn→thu→nợ), giao khoán tổ đội — port nguyên trạng rồi mới tinh chỉnh.
3. **MySQL là adapter, không phải kiến trúc** — repository interface giữ; nếu sau này cần Oracle/Postgres chỉ thêm adapter.
4. **Không gộp slice** — mỗi slice là 1 milestone đóng gói, demo được, rollback được.
5. Fingerprint/Trust Lock của bản JS không áp dụng cho bản Java (thiết kế lại licensing theo Ed25519 thuần).

---

## 7. ƯỚC LƯỢNG

| Giai đoạn | Nội dung | Ước (1–2 dev) |
|---|---|---|
| 0 | Skeleton + Action Catalog + Data Model + slice đầu | 3–5 tuần |
| 1–N | Mỗi lát cắt (Catalog, BOQ, MR/Approval, PO/Receipt, Stock, Finance, Legal) | 2–4 tuần/slice |
| Cuối | Cutover + licensing + dọn dẹp | 2–3 tuần |

> Toàn bộ 7–9 tháng cho 1 team 2 dev nếu làm song song, hoặc 4–6 tháng nếu ưu tiên 60% nghiệp vụ lõi trước (Kho/Mua/BOQ/Phe duyệt) và để Tài chính/Pháp chế JS chạy qua gateway lâu hơn.

---

## 8. KẾT LUẬN

- **Không refactor monolith JS thành tầng** — lãng phí vì đích là Java.
- Monolith JS = **reference implementation**: đóng băng hành vi/hợp đồng/schema.
- Xây **Java Clean Architecture** (Domain → Application → Infrastructure → Web) theo **lát cắt dọc + gateway action**, DB MySQL nằm ở infrastructure.
- UI React giữ nguyên tới khi backend Java ổn định → cắt JS theo từng slice.