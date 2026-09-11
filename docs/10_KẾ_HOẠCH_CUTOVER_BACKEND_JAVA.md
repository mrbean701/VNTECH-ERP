# 10 — KẾ HOẠCH CUTOVER: Backend JS → Java (Clean Architecture) + MySQL 8.4

> Trạng thái: **CHUẨN BỊ CUTOVER** — Action Catalog **174/174 (100%)** migrated, `mvn clean verify` xanh (54 test), khung contract test hoạt động.
> Tài liệu liên quan: `docs/09` (Giai đoạn 0–10), `java-backend/README.md`, `ACTION_CATALOG.json`.

---

## 1. Mục tiêu

Chuyển **toàn bộ luồng nghiệp vụ** từ backend JS (Bun + SQLite) sang **Spring Boot 3.5 (Java 21, Clean Architecture) + MySQL 8.4** mới mà **UI SPA React giữ nguyên 100%**:
- Cùng contract: `POST /api/system` `{action, ...} → {ok, ...}`; cookie `mep_session` giữ nguyên (PBKDF2-SHA256 600k — hash cũ dùng được ngay).
- Người dùng **không phải đổi mật khẩu**, không đăng nhập lại khi cutover.

## 2. Nguyên tắc Strangler Fig đã thực hiện (34 vòng)

| Giai đoạn | Kết quả |
|---|---|
| 0 Nền tảng | Maven multi-module (domain/application/infrastructure/web), generator ACTION_CATALOG/DATA_MODEL_REFERENCE (114 bảng/1469 cột), Flyway baseline 114 bảng, contract harness; Node tooling giữ nguyên (không sửa JS). |
| 1–5 | Auth (PBKDF2 600k, lockout 10 lần/15 phút), Master data, MR+phê duyệt, Purchasing (PO→GRN→BCH), **BOQ + Material Matching V2** (embedding 96D port nguyên trạng, 9 unit test đối chiếu lib JS). |
| 6 | **StockLedgerEngine** (tồn vật lý + giữ chỗ + Contract ownership), issue/return/install, transfer 4 action, central returns, stocktake, reconcile, ownership transfer, reverse. |
| 7–9 | Sản lượng/Thu hồi vốn (RecoveryChain), Tài chính (payment plan/tạm ứng/chi phí/cashbook/voucher/bank), Pháp chế/HR (hồ sơ/HĐLĐ/công văn/văn bản/con dấu/bảo hiểm). |
| 10 | Email settings + assignments, preview_request_import, replace_boq_items (4 modes), contract prices, **SLA worker (@Scheduled)**, Material Catalog (23 action), Ops tasks/teams/stages/MAR, Settings/License/Bulk import, **Excel template (POI)**. |

## 3. Kế hoạch cutover đề xuất

### 3.1 Chuẩn bị (1–2 ngày)
0. **Hạ tầng MySQL 8.4** (đã có sẵn `java-backend/docker-compose.yml` — compose valid):
   ```bash
   cd java-backend
   docker compose up -d mysql        # MySQL 8.4 + Redis 7, healthcheck, utf8mb4
   # ứng dụng trỏ sẵn: jdbc:mysql://localhost:3306/vntech_erp (user vntech/vntech)
   ```
   *(Ghi chú vòng 40: trong môi trường dev này Docker Desktop không mở được daemon nên chưa chạy thật; file đã được `docker compose config` xác nhận hợp lệ.)*
0a. **Seed approval stages hệ thống (bắt buộc trước khi dùng create_request)**: `save_approval_stage` chỉ cho phép stage tùy chỉnh ≥100; các bước 1..N (BCH → Phòng Dự án …) phải tồn tại trong DB từ đầu (catalog + `approval_project_assignments` theo dự án). Khuyến nghị gộp vào script seed/migration V2 (nguồn: staging thật của dự án) — nếu thiếu, `create_request` sẽ báo "Chưa cấu hình bước phê duyệt đang hoạt động". *(Ghi chú vòng 56 — phát hiện từ record:live-chain khi cố gắng tạo MR qua API.)*
1. **Tạo DB MySQL 8.4** `vntech_erp` (utf8mb4) — tự động qua compose; chạy `mvn -pl web spring-boot:run` để **Flyway migrate** (V1 baseline 114 bảng) hoặc `java -jar ...` (Flyway autoboot).
2. **Map dữ liệu**: `node java-backend/tools/migrate-sqlite-to-mysql.mjs --sqlite <db.sqlite> --out java-backend/migration` → `mysql -uvntech -pvntech vntech_erp < migration/migration.sql` (đã sinh đúng thứ tự FK + UTF-8 + manifest.json).
3. **Kiểm chứng hash mật khẩu**: chạy 1 user thật qua `AuthUseCase` — PBKDF2 vector đã verify tương thích; không reset mật khẩu ai.

### 3.2 Song song chạy thử (2–3 ngày)
1. Chạy Java backend trên cổng khác (VD 8090) với **bản sao dữ liệu** (không đụng SQLite production).
2. Mở UI bản dev trỏ `/api/system` → Java (qua proxy dev).
3. **Smoke test toàn chuỗi** bằng `java-backend/contract-tests/contract-harness.mjs` (golden snapshot, ignore timestamps):
   - setup → login → create_user → create_project → material catalog → BOQ import → save_boq_version → save_boq_item → compare/confirm mapping
   - create_request (DNMH) → duyệt → create_po → receive_goods → confirm_delivery → issue_stock → confirm_installation → return_stock
   - transit transfer 4 action → central return → stocktake → reconcile
   - production report → capital recovery → contract payment → team subcontract (5) → daily log
   - payment plan/tạm ứng/chi phí/cashbook/voucher, HR/legal/seal/benefit, work items, sinh template Excel.
4. Mỗi lệch contract → sửa Java (message/giá trị/status) tới khi golden snapshot khớp.

### 3.3 Cutover chính thức (0.5–1 ngày, cuối tuần)
1. **Stop JS**: tắt Bun worker; **stop UI gọi JS**.
2. **Backup lần cuối**: SQLite file + MySQL dump.
3. **Đồng bộ dữ liệu cuối**: đổ delta từ SQLite → MySQL (idempotent upsert theo PK).
4. **Chạy Java trên 8080** với `application-prod.yml` (MySQL, cookie domain/secure như cũ).
5. **Verify thủ công**: login thật, xem dashboard, duyệt 1 MR, xuất 1 PX, in 1 hoá đơn (nếu có).
6. **UI không đổi**: SPA đã trỏ cùng `/api/system`; không cần rebuild frontend.

### 3.4 Rollback (nếu lỗi trong 48h)
- Bật lại JS backend (dữ liệu JS không bị xóa — Java chỉ WRITE vào MySQL bản mới).
- Mọi thay đổi trong thời gian song song phải ghi **cả 2 phía** (dual-write) hoặc chấp nhận mất delta nhỏ; khuyến nghị dual-write cho giai đoạn pilot 1 dự án.

### 3.5 Đóng
- Xóa flag dual-write; tắt JS worker vĩnh viễn.
- Giữ `java-backend/tools/*.mjs` làm tài liệu tham chiếu (read-only).

## 4. Rủi ro & giảm thiểu

| Rủi ro | Giảm thiểu |
|---|---|
| Sai thứ tự sequence (DNMH/PO/GRN/PX...) | document_sequences dùng chung PK `id` (ON DUPLICATE) — đã port đúng JS; smoke test kiểm tra số liên tục. |
| H2 khác MySQL khi test | Integration test dùng H2 MODE=MySQL + schema-h2.sql (bỏ ENGINE/FK) — nhưng **luôn chạy 1 lượt trên MySQL thật trước cutover**. |
| Email worker | JS gửi email qua SMTP thật; Java port cấu hình email_settings + retry queue — kiểm tra SMTP bằng tay. |
| Fingerprint/identity JS | KHÔNG sửa file JS; Java đọc cùng bảng (vntech_identity) — bootstrap giữ `x-vntech-*` header. |
| ROLLBACK deltas | Dual-write pilot; ghi audit đồng thời (bảng `audit_log`). |

## 5. Checklist cuối
- [ ] `mvn clean verify` xanh (mọi module)
- [ ] Contract harness chạy golden trên MySQL thật
- [ ] 1 user thật login không phải đổi mật khẩu
- [ ] Smoke test toàn chuỗi nghiệp vụ (mục 3.2.3)
- [ ] 1 dự án pilot chạy song song 3 ngày (dual-write)
- [ ] Backup + rollback plan được xác nhận
- [ ] Cắt JS worker, set DNS/port sang Java

---

**Người duyệt**: chờ PO/dự án xác nhận lịch cutover thực tế.