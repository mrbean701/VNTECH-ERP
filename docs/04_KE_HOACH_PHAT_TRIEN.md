# KẾ HOẠCH PHÁT TRIỂN TIẾP THEO — VNTECH ERP V5.3.0

Bản cập nhật: 09/2026 · Xây trên nền phân tích `docs/01_BAO_CAO_PHAN_TICH_DU_AN.md`.

> ✅ **CẬP NHẬT MỚI NHẤT (09/2026):** theo quyết định của người dùng, **giữ nguyên kiến trúc monolith JS**, không tách layered. Phase 1 (15 màn placeholder) và Phase 2 (báo cáo/tài chính/chất lượng dữ liệu) đã hoàn thành; Phase 3 chuyển sang hướng **"giữ monolith, làm mượt trước"** — fix bug + cảnh báo chủ động + báo cáo sâu (migrations 0065→0074, fingerprint hiện `VNTECH-FP-0C5B81E5CD38B19F`). Xem nhật ký chi tiết tại `docs/05` §0.0 và tổng kết tại `docs/07`.

---

## 0. NGUYÊN TẮC LỘ TRÌNH (ĐỌC TRƯỚC)

Bất kỳ thay đổi file nguồn nào nằm trong danh sách fingerprint (171 file) sẽ **đổi source fingerprint** → gate `verify-vntech-fingerprint` chặn build/cài. Vì vậy mọi phase dưới đây phải tuân theo quy ước:

```
1. Làm việc trên nhánh/tag riêng.
2. Sửa source → tính fingerprint MỚI (node scripts/verify-vntech-fingerprint.mjs báo actual).
3. Refresh identity SSOT ĐÚNG QUY TRÌNH (không sửa tay):
   lib/vntech-identity-data.mjs + VNTECH_FINGERPRINT.json + VNTECH_PRODUCT_IDENTITY.txt
   + MANIFEST_SHA256.txt (tái sinh bằng tool) + (nếu đổi migration head) MIGRATION_HEAD.
   Mẫu tham chiếu: PROJECT_NAVIGATION_FINGERPRINT_FIX_REPORT_20260908.md.
4. Thêm migration mới 0050+ (chỉ append), cập nhật migration head nếu đổi.
5. Chạy đủ gates: verify:release / verify:master-baseline / verify:css-baseline / verify:fingerprint / npm test.
```

> Lệnh kiểm tra nhanh sau mỗi change: `node scripts/verify-vntech-fingerprint.mjs`.

---

## PHASE 1 — HOÀN THIỆN NGHIỆP VỤ CÒN TRỐNG (ƯU TIÊN CAO, NGUY CƠ THẤP)

Mục tiêu: đưa 15 màn "ĐANG PHÁT TRIỂN" thành màn thật, tăng giá trị sử dụng ngay trên dữ liệu hiện có. Đây là nơi "thấy được" nhất.

### 1.1 Màn nghiệp vụ chính (ưu tiên nhất)
| Màn | Nội dung cần làm | Dựa trên dữ liệu có sẵn |
|---|---|---|
| **construction** (Thi công) | Nhật ký thi công, tiến độ thực địa theo dự án | `work_items`, `production_reports`, `stock_issues` |
| **material_norms** (Định mức vật tư) | Định mức theo hạng mục (công thức/đơn vị), gợi ý tự ước lượng | materials + `boq_material_components`, subcategories |
| **site_command** (Tổng quan & Nhân sự dự án) | BCH dự án: danh sách thành viên, PB, nhiệm vụ, trạng thái | `organization_units` (`unit_type='site_command'`/`code='BCH'`), `users.organization_unit_id`, `work_items` |

> 📄 **Kế hoạch thực thi chi tiết Phase 1 (từng màn, migration 0050+, map hành động, checklist vòng):** xem `docs/05_KE_HOACH_PHASE1_HOAN_THIEN_MAN_PLACEHOLDER.md`.
>
> ✅ **TRẠNG THÁI 09/2026: PHASE 1 ĐÃ HOÀN THÀNH TOÀN BỘ 15 MÀN** (site_command, construction, material_norms, dept_finance_recovery/payment_plan/advance/site_cost/cashbank/documents, dept_legal_hr/labor/correspondence/documents/seal/benefits). Fingerprint `VNTECH-FP-6D082737CB73D06F` · migrations 0000..0061 · đủ gates + workflow E2E + build thông qua (xem `docs/05` §0.0 nhật ký đầy đủ).

### 1.2 Màn Tài chính (dept_finance_*) — 6 màn
Kế hoạch thanh toán, Thu hồi vốn, Tạm ứng, Chi phí hiện trường, Quỹ tiền mặt, Chứng từ.
→ Dữ liệu nền đã có: `capital_recovery_records`, `contract_payments`, `team_payments`, `audit_logs`. Trọng tâm: làm "Tạm ứng & chi phí hiện trường" (nghiệp vụ thực tế nóng nhất), rồi báo cáo thu chi theo dự án. Thứ tự thực hiện chi tiết tại `docs/05` §6 (§6 E1→E5).

### 1.3 Màn Pháp chế/Hành chính (dept_legal_*) — 6 màn
Nhân sự, Lao động, Công văn, Tài liệu, Con dấu, Phúc lợi → dựa trên `work_items` + module task engine đã có. Ưu tiên "Công văn & Tài liệu" (quản lý văn thư). Thứ tự thực hiện chi tiết tại `docs/05` §7 (đợt F1: hr+labor; đợt F2: văn thư/pháp lý).

---

## PHASE 2 — TĂNG CHIỀU SÂU NGHIỆP VỤ & BÁO CÁO (TUẦN 2–4)

> ✅ **TRẠNG THÁI 09/2026: PHASE 2 ĐÃ TRIỂN KHAI 2.1–2.3** (fingerprint `VNTECH-FP-CAF2D1963CAA3B5B` · migrations 0062–0064, metadata identity-refresh). Chi tiết tại `docs/05` §0.0.

### 2.1 Báo cáo & phân tích (nâng cấp màn `reports`)
- Báo cáo M&E: giá trị hợp đồng theo dự án/kỳ; công nợ nhà cung cấp; tồn kho định kỳ theo hợp đồng.
- Dashboard cấp quản lý: so kế hoạch ↔ thực hiện ↔ ngân sách; cảnh báo vượt định mức.
- Xuất PDF đúng nghiệp vụ (hiện CSX/XLSX); nền tảng: `lib/tabular-export.ts`, `lib/request-export.ts`.

> ✅ Đã làm (vòng 2A): màn `reports` thêm 4 bảng nghiệp vụ (giá trị HĐ theo dự án từ BOQ×đơn giá, công nợ NCC theo PO mở, tồn kho theo HĐ từ contract_stock_ledger, cảnh báo tồn dưới min) + nút Xuất CSV/XLSX và In/PDF từng báo cáo (`reportExport`/`printReport`).

### 2.2 Tích hợp tài chính
- Xuất sổ/bút toán cho kế toán (json/csv chuẩn), chuẩn bị giao diện kết nối ngoại (Excel MISA).
- Hạch toán thu hồi vốn & thanh toán theo dự án về một mô hình thống nhất (giảm trùng lặp hiện tại giữa `capital_recovery_records`, `contract_payments`, `team_payments`).

> ✅ Đã làm (vòng 2B): màn `dept_finance_recovery` thêm section "Sổ kế toán tổng hợp" gộp 6 nguồn (thu hồi vốn, thanh toán HĐ, tạm ứng, chi phí BCH, sổ quỹ, chứng từ) thành bút toán chuẩn Nợ/Có (112/131/511/141/111/627) + xuất CSV/XLSX và JSON (chuẩn để nạp MISA/Excel). Mô hình thống nhất hạch toán thu/chi theo dự án: còn nối tiếp ở phase sau.

### 2.3 Chất lượng dữ liệu
- Quy trình "miễn nhiễm trùng alias" cho `materials`/`material_aliases` (mở rộng test hiện có).
- Chuẩn hóa quy trình kiểm kê & điều chuyển (giảm 3 luồng trả/điều chuyển rời rạc: `material_returns` vs `central_returns` vs `transfer_orders`).

> ✅ Đã làm (vòng 2C): action `check_material_alias_conflicts` (rà soát alias trùng normalized + alias xung đột tên chuẩn mã khác) + UI "Soát trùng alias & chất lượng danh mục" trên Material Catalog; báo cáo "Đối chiếu luồng hoàn trả / điều chuyển" trên màn reports (kiểm soát 3 luồng, chuẩn hóa hợp nhất làm ở phase sau). Backend đã có sẵn guard chống trùng alias khi lưu (normalized_name unique + chặn conflict).

---

## PHASE 3 — KIẾN TRÚC MỤC TIÊU: JAVA CLEAN ARCHITECTURE + MYSQL (THAY THẾ MONOLITH JS)

> ⚡ **QUYẾT ĐỊNH CHIẾN LƯỢC 09/2026 (thay thế Phase 3 cũ):** KHÔNG tách monolith JS thành layered modules. Lý do: hệ JS được xây nhanh nhất có thể và sắp bị thay bằng **Java Clean Architecture + MySQL**; refactor JS là nợ bỏ đi và đụng fingerprint rất đắt. → Monolith JS trở thành **reference implementation** (đóng băng nghiệp vụ/hợp đồng/schema), xây Java song song theo **Strangler Fig** (thay từng lát dọc), DB MySQL nằm ở tầng infrastructure.
>
> 📄 **Tài liệu chi tiết: `docs/06_KIEN_TRUC_MUC_TIEU_JAVA_CLEAN_ARCH.md`** (architecture, lộ trình slice, chuyển dữ liệu MySQL, rủi ro, ước lượng).

### 3.1 Kiến trúc đích
```
Interfaces Web (Spring Boot REST + gateway POST /api/system {action})
Application  (use-cases + ports — thuần, không phụ thuộc framework/DB)
Domain       (entities, value objects, domain services, events)
Infrastructure (MySQL repository + Flyway, Redis, SMTP, export MISA, licensing Ed25519)
```
- Hợp đồng `POST /api/system {action}` là **seam**: UI React giữ nguyên, gateway route action đã migrate sang Java, action chưa migrate gọi JS.
- Domain không import framework/DB → MySQL chỉ là 1 adapter, test thuần không cần DB.

### 3.2 Lộ trình slice (mỗi slice 1 milestone đóng gói)
Material Catalog → BOQ → MR/Approval (state machine 5 bậc + SLA) → PO/Receipt → Stock/Contract-ledger → Finance → Legal.
Mỗi slice: Domain → Use-case → Repository MySQL + Flyway → REST + gateway → test (unit + integration + contract).

### 3.3 Chuyển dữ liệu MySQL
- Flyway `V1__init.sql` từ data model 99 bảng hiện tại; **giữ mô hình cốt lõi** tách tồn vật lý khỏi sở hữu kế toán (`procurement_allocations` + `contract_stock_ledger`).
- Sửa dialect SQLite/Postgres → MySQL (timestamps TEXT → DATETIME, `INSERT OR IGNORE` → `INSERT IGNORE`, trigger `RAISE(ABORT)` → guard application-level).
- Password PBKDF2-SHA256 giữ nguyên (tương thích Java).

### 3.4 Rủi ro & nguyên tắc
- Không đổi UI khi đổi backend; port đúng nghiệp vụ (5 bậc duyệt, multi-contract stock, matching, thu hồi vốn chuỗi, giao khoán tổ đội) trước khi tinh chỉnh.
- Fingerprint/Trust Lock của bản JS **không áp dụng** cho Java (licensing Ed25519 thuần qua `vntech_product_identity`).
- Chi tiết ước lượng: `docs/06` §7 (~4–9 tháng tùy đội/ưu tiên).

---

## PHASE 4 — HIỆN ĐẠI HÓA (VÒNG XA HƠN, 1–2 QUÝ)

1. **AI/Matching nâng cao**: giữ OLLAMA/OpenAI embed-enabled path (đã có), thêm validation tự học từ lịch sử confirm (feedback loop cho scoring weights).
2. **Mobile app / PWA**: hiện responsive web tốt; cân nhắc PWA offline cho hiện trường.
3. **Tích hợp**: email (đã có outbox), OCR hóa đơn/chứng từ, webhook báo cáo, SSO/Okta.
4. **Observability**: OpenTelemetry, metrics/tracing cho production.

---

## ĐỀ XUẤT CÔNG NGHỆ MỚI (ĐÁNH GIÁ)

| Công nghệ | Dùng khi nào | Rủi ro với gate fingerprint |
|---|---|---|
| Monorepo (turbo/pnpm) | Phase 3 khi tách module | KHÔNG đổi file nguồn → an toàn |
| Testing (Vitest + Playwright) | Mở rộng regression, tách test render | Chỉ thêm file test — an toàn (không đổi file nguồn được hash) |
| Redis Job Queue (BullMQ) | Scale multi-instance, email/notification | Thay đổi runtime, không đổi fingerprint nhiều |
| PostgreSQL extensions/views | Báo cáo phức tạp | An toàn nếu chỉ thêm migration 0050+ |
| Migration framework (sau khi đồng bộ schema) | Phase 3.3 | Phải đồng bộ với gate |

> Luật chung: **công nghệ mới chỉ đi qua cửa fingerprint-safe** (thêm file/package/script mới, hold nguyên byte các file gốc được hash) HOẶC qua vòng phát hành có refresh identity.

---

## ĐỀ XUẤT KIẾN TRÚC MỤC TIÊU (TRUNG HẠN)

```
UI (React SPA, đã tách component) 
   │  POST /api/system {action}
   ▼
Routing layer (phân tách theo module: warehouse, purchasing, boq, admin...)
   ▼
Use-case layer (mỗi action 1 use-case hàm thuần)
   ▼
Repository layer (D1 / Postgres / SQLite qua adapter chung)
   ▼
DB (PostgreSQL 16) + Redis (cache/job) 
```
Backend vẫn phục vụ **cùng 1 contract action** (không đổi API) để UI hiện tại không vỡ; gate fingerprint được xử lý bằng quy trình refresh identity đúng chuẩn.

---

## KẾ HOẠCH TRIỂN KHAI NHANH (90 NGÀY)

| Tuần | Việc |
|---|---|
| 1 | Setup team, đọc tài liệu, chạy `npm test`, init git, tạo nhánh `docs-*/feature-*` |
| 2–4 | **Phase 1**: construction, material_norms, site_command, dept_finance (tạm ứng/chi phí) |
| 5–8 | **Phase 2**: reports nâng cao, tích hợp tài chính, chuẩn hóa alias |
| 9–12 | **Phase 3.1**: tách backend từng bước (first sub-phase), + refresh identity |
| 13–15 | Phase 3.2: tách frontend + router |
| 16–20 | Phase 4 pilot: PWA offline + OpenTelemetry |

---

## RỦI RO CẦN QUẢN LÝ
1. **Đụng fingerprint** — lớn nhất. Giải pháp: pattern refresh identity đóng gói thành 1 script chuẩn hoá, chạy tự động mỗi khi release.
2. **Refactor vội trước khi tách service** — tách từng sub-phase, giữ hành vi byte-gần.
3. **Hiệu năng bootstrap** khi dữ liệu lớn — ưu tiên phân trang server Phase 3.3/3.4.
4. **Thiếu nguồn nhân lực cho nhiều màn** — ưu tiên nghiệp vụ nóng, nhờ task engine giảm nhập trùng.

---

## KẾT LUẬN
Dự án có nền móng nghiệp vụ vững (Kho/M&E, BOQ, duyệt 5 bậc, contract stock ledger) và tầng integrity rất cẩn trọng. Lộ trình khuyến nghị: **hoàn thiện nghiệp vụ trống → báo cáo/tài chính thực chiến → refactor có kiểm soát + refresh identity** — ưu tiên tạo giá trị thấy được trước, rồi mới dọn nợ kỹ thuật bằng quy trình phát hành mới.