# BÁO CÁO PHÂN TÍCH DỰ ÁN VNTECH ERP V5.3.0

Bản cập nhật: 09/2026 · Build `5.3.0-MASTER-BASELINE-R1.1.1-FINAL-20260908` · Trust Development Mode

---

## 1. VỊ THẾ SẢN PHẨM

**VNTECH ERP** là nền tảng quản trị & điều hành nội bộ của CÔNG TY CỔ PHẦN THƯƠNG MẠI ĐẦU TƯ PHÁT TRIỂN CÔNG NGHỆ VIỆT (VNTECH), Product ID `VNTECH-KHO-MEP-001`. Sản phẩm tập trung vào nghiệp vụ **Kho vật tư + M&E** (Cơ – Điện): từ bản vẽ → bóc khối lượng BOQ → chuẩn hóa mã vật tư → đề nghị mua (MR) → phê duyệt 5 bậc → đặt hàng (PO) → nhận hàng → tồn kho theo hợp đồng → xuất/trả/lắp đặt → nghiệp thu → thu hồi vốn.

Đây là bản **FULL SOURCE** độc lập (không cần replay PATCH/RC cũ), đã qua 2 vòng chuẩn hóa lớn để làm sạch kiến trúc và khóa tính toàn vẹn:

| Vòng | Mục tiêu chính |
|---|---|
| MASTER BASELINE CLEANUP R1.1 | Loại đường runtime song song (`/api/files`), SSOT backend, khóa identity/migration, approval single-owner |
| R1.1.1 (safe-clean) | CSS safe-clean không xóa nhầm, source↔CSS contract 2 chiều, visual equivalence 12/12 |
| PROJECT NAVIGATION CONSOLIDATION | Hợp nhất menu Project → BCH thành `QUẢN LÝ DỰ ÁN`, Project Workspace 8 miền + Context Lock |
| FINGERPRINT FIX (vòng này) | Refresh identity SSOT sau khi fingerprint bị leak bởi Project Nav |

---

## 2. KIẾN TRÚC CÔNG NGHỆ

### 2.1 Stack tổng thể

| Tầng | Công nghệ | Vai trò |
|---|---|---|
| Frontend | React 19 + TypeScript 5.9 + Vite 8 (`app/page.tsx` SPA 1 file, ~2.070 dòng/595 KB) | Toàn bộ giao diện người dùng |
| Backend | `scripts/system-route.mjs` (~2.950 dòng/553 KB, if-chain dispatcher) | Toàn bộ logic nghiệp vụ (~135 action) |
| ORM/Database | Drizzle ORM 0.45 + D1 (dev) / PostgreSQL 16 (prod) | Schema + migration; adapter `PostgresD1Database` viết tay |
| Cache/Rate-limit | Redis 7 | Login lockout, cache, future job |
| Runtime | Cloudflare Workers (prod)/Workerd, Node `node:http` + `node:sqlite` (local) | Cùng 1 code chạy 2 chế độ |
| Bảo mật | PBKDF2-SHA256, session sha256, RBAC 3 tầng, audit toàn diện, Trust Lock Ed25519 + fingerprint | Xác thực, phân quyền, chống giả mạo |

### 2.2 Vì sao "một file to đùng" vẫn OK

- **Backend SSOT**: `system-route.mjs` là nguồn sự thật duy nhất; `app/api/system/route.ts` chỉ bind env và delegate. Mọi đường chạy (Worker, Node local, Postgres) đều đi qua 1 file → không lệch logic.
- **Frontend SSOT**: `app/page.tsx` là 1 SPA; server trả 1 bundle `AppData`; client state machine `loading → setup/login/ready/error`.
- Sự đuổi theo "clean code tách file" sẽ **phá vỡ fingerprint** (xem §5). Mỗi lần refactor thành file nhỏ phải là một vòng phát hành riêng kèm refresh identity.

### 2.3 Ngôn ngữ & tooling

- Node ≥22.13, TypeScript strict, ESLint 9, Prettier (CẢNH BÁO: không được format code suốt bao giờ — xem §5.3), `tsx` để chạy test TS.
- `wrangler` 4.92 cho Cloudflare, `drizzle-kit` cho migration, `vinext` cho build pipeline, Docker/Caddy cho production.

---

## 3. THÀNH PHẦN CHÍNH BÊN TRONG

### 3.1 Cấu trúc thư mục

```
/ (root)
├── app/                  # Next.js-style app: page.tsx (SPA), layout, globals.css, api/ (system, files)
├── db/                   # Drizzle schema.ts (67 bảng - KHÔNG đầy đủ), index.ts
├── drizzle/              # 50 migration SQL 0000..0049 (99 bảng thực tế)
├── lib/                  # runtime-env, trust/* (fingerprint, license, canonical-json),
│                         # material-matching-v2.mjs, request-export, boq-export, form-fields, admin-bulk-import
├── scripts/              # system-route.mjs (backend), universal-server/runtime/installer,
│                         # migrate-postgres, preflight-source, verify-vntech-fingerprint, master-baseline-gate, ...
├── worker/               # index.ts: Cloudflare Worker entry
├── tests/                # 11 file test (regression, workflow E2E, trust, security, mobile, BOQ...)
├── deploy/               # docker-compose (postgres+redis+app+backup), proxy Caddy
├── native-verifier/      # protocol-v1.json (bản quyền/trust)
├── tools/                # vntech-license-generator
├── public/               # assets UI
└── docs/                 # Tài liệu mới bổ sung (thư mục này): báo cáo, hướng dẫn, roadmap
```

### 3.2 Database: 99 bảng nghiệp vụ (qua 50 migration)

| Nhóm | Số bảng | Đại diện |
|---|---|---|
| Master data | 26 | projects, project_contracts, boq_versions, suppliers, teams, materials, categories, role_catalog, org units... |
| Kho / tồn kho | 23 | warehouses, stock_movements, goods_receipts, stock_issues, transfer_orders, central_returns, contract_stock_ledger... |
| Mua hàng | 6 | material_requests, material_request_items, purchase_orders, approvals, supply_workflow_steps |
| BOQ / mapping | 21 | project_boq_items, boq_source_items, material_embeddings, boq_mapping_candidates... |
| Security/audit | 17 | users, sessions, user_project_scopes, user_module_permissions, audit_logs, email_outbox... |
| Trust/license | 7 | vntech_product_identity, vntech_trust_settings, vntech_license_installations... |

Điểm thiết kế cốt lõi: **tách tồn vật lý (warehouse) khỏi sở hữu kế toán (contract)** — `procurement_allocations` + `contract_stock_ledger` cho phép truy vết MR→PO→GRN→BOQ tới từng hợp đồng (rất mạnh cho đối soát kế toán, multi-contract cùng sở hữu 1 mã vật tư).

### 3.3 Backend: ~135 action theo mô-đun

Xác thực/setup · user/session (9) · phân quyền/vai trò (12) · cấu hình menu/form (10) · trust/license (2) · factory reset (2) · dự án/hợp đồng (8) · MR & phê duyệt 5 bậc (7) · nhà cung cấp (3) · PO (2) · danh mục vật tư (12) · MAR/mapping (2) · BOQ (9) · kho xuất/nhập/tồn (15) · giao nhận/lắp đặt (2) · sản xuất/sản lượng (2) · giao khoán tổ đội (5) · thu hồi vốn/thanh toán (5) · công việc/task (5) → tổng ~135.

### 3.4 Frontend: 61 module UI (46 màn thật + 15 placeholder "ĐANG PHÁT TRIỂN")

Màn chính: Dashboard, Project Progress, Department Task Workspace (KH + DA, engine nhiệm vụ phòng ban), Requests + phê duyệt 5 bậc, Approvals (SLA), Purchasing + PO, Receiving/Delivered, Warehouse Receipt/Issue, Inventory, Central Warehouse, Material Catalog Manager, **BoqControl** (workspace BOQ + Material Matching), Payments/Teams/Stocktake, Admin (User/Role/Org/Menu/Form/Bulk import/Trust Lock/Factory Reset), Account Settings.

### 3.5 Điểm công nghệ nổi bật

1. **Material Matching V2** — không cần ML bên ngoài: embedding cục bộ 96 chiều (FNV-1a + hashing trick), 6 tiêu chí chấm điểm (history/technical/system/UOM/fuzzy/embedding), Candidate Gate chống gán sai, fallback Ollama/OpenAI embed khi có env.
2. **BOQ Workspace** — bản vẽ → bóc khối lượng → chuẩn hóa → mua sắm; cộng dồn request/approved/ordered/received/remaining.
3. **Form động** — cấu hình field `visible/required/importable/exportable/editable` theo form key, không cần sửa code.
4. **Bulk import** — user (12 cột) / project (9 cột) với preflight nguyên tử, tạo BCH động theo dự án.
5. **RBAC 3 tầng** — vai trò → module/capability (override có hạn) → scope dữ liệu (dự án/kho/org), kèm phê duyệt theo stage + owner dự án + SLA email.
6. **Trust Lock** — fingerprint máy (`/etc/machine-id`, hostname...) + license Ed25519, giữ ở development mode (chưa enforcement), không có private key trong source.
7. **Ops chắc** — backup 24h (pg_dump custom + retention 30d), healthcheck, Caddy TLS, upgrade giữ dữ liệu, migrate SQLite→PG, login lockout 10 lần/15 phút.

---

## 4. CƠ HỘI PHÁT TRIỂN THÊM

### 4.1 Nghiệp vụ còn là placeholder (15 màn "ĐANG PHÁT TRIỂN")
- **site_command** (Tổng quan & Nhân sự dự án), **construction** (Thi công), **material_norms** (Định mức vật tư) — 3 màn tên tuổi lớn nhưng chưa có nội dung.
- **6 màn tài chính** `dept_finance_*`: kế hoạch thanh toán, thu hồi vốn, tạm ứng, chi phí hiện trường, quỹ tiền mặt, chứng từ.
- **6 màn pháp chế/hành chính** `dept_legal_*`: nhân sự, lao động, công văn, tài liệu, con dấu, phúc lợi.

→ Đây là kho tính năng "nhìn thấy được" rõ nhất để hoàn thiện.

### 4.2 Chiều sâu nghiệp vụ hiện có (tăng giá trị ngay lập tức)
- **Báo cáo & phân tích** (màn `reports` còn sơ sài): KPI M&E, giá trị hợp đồng, công nợ theo dự án, tồn kho định kỳ.
- **Tích hợp tài chính**: xuất sổ kế toán, kết nối kế toán ngoại (MISA/Excel), quyết toán thuế.
- **Định mức vật tư** (`material_norms`): chuẩn bị cơ sở để tự động ước lượng mua sắm theo BOQ.

### 4.3 Hạ tầng/kỹ thuật (để bảo trì lâu dài)
- Migration framework (fix schema 67→99 bảng), phân trang phía server, cache/memo client, cơ chế export báo cáo PDF/Excel đúng nghiệp vụ.
- Xem chi tiết tại `docs/04_KE_HOACH_PHAT_TRIEN.md`.

---

## 5. HỆ THỐNG INTEGRITY GATE — ĐỌC KỸ TRƯỚC KHI LÀM VIỆC

### 5.1 Tại sao có
Vì đây là FULL SOURCE độc lập không replay patch cũ, và vì lịch sử đã có 2 lần "phá" (xóa nhầm CSS `.nav-glyph-green`; Project Nav làm leak fingerprint chặn cài đặt). Hệ thống gate ép mọi thay đổi **chứng minh được** là hợp lệ trước khi release.

### 5.2 Chuỗi gate (chạy khi build/cài/release)
```
preflight-source.mjs
  → css-baseline-audit.mjs
  → verify-vntech-fingerprint.mjs (tính lại fingerprint từ 171 file nguồn)
  → master-baseline-gate.mjs
  → release-static-gate.mjs (chạy tất cả: verify-full-release, preflight migration PG,
     SQL bind arity, template/openxml, lint, typecheck, test regression, test workflow)
```

### 5.3 QUY TẮC VÀNG KHI PHÁT TRIỂN
1. **KHÔNG được format code/reformat file bằng prettier hay bất cứ tool nào** → fingerprint đổi → `verify-vntech-fingerprint.mjs` CHẶN build/cài. (Đã thử prettier → 3 lỗi integrity liên tiếp → phải rollback. Bài học quy ra tiền!)
2. **File nằm trong danh sách hash không được sửa lệch contract**: bất kỳ thay đổi nghiệp vụ nào cũng phải kèm bước **refresh identity** (như vòng FP_FIXED) + **migration mới 0050+**.
3. File cấm đụng: `app/globals.css` (chỉ thêm trong block BEGIN/END, giữ dưới 400.653 B/4.950 `!important`), `app/page.tsx` (marker hàng chục contract), `db/schema.ts`, `drizzle/0000..0049` (chỉ append, head = 0049), bộ identity (`VNTECH_*.txt`, `VNTECH_FINGERPRINT.json`, `lib/vntech-identity-data.mjs`, `*identity_refresh*.sql`), `MANIFEST_SHA256.txt` (tái sinh bằng tool khi đóng gói).
4. Cấm private key/PEM/`.key/.p12/.pfx` trong source; cấm artifact `node_modules/dist/.env` trong gói; cấm tên file `patch*/gate*/rc*` ở root/tests.
5. Sau mỗi thay đổi chạy: `npm run verify:release`, `npm run verify:master-baseline`, `npm run verify:css-baseline`, `npm run verify:fingerprint`, `npm test`.

> ⚠️ Luôn kiểm tra bằng `node scripts/verify-vntech-fingerprint.mjs` ngay sau thay đổi file nguồn; nếu FAIL nghĩa là source đang khác fingerprint đăng ký → cần quy trình refresh, KHÔNG phải sửa tay file identity.

### 5.4 Cảnh báo mâu thuẫn tài liệu
`README.md` và các báo cáo clean-up ghi fingerprint CŨ `7f76ccf7...`/brand `e4fce926...` (trước FP FIX). Giá trị HOẠT ĐỘNG hiện tại (đã khớp với file identity và migration 0049) là source `31cb2728...` / brand `f7867695...` / release `add41b0f...` (không đổi). Khi làm việc hãy dựa vào `lib/vntech-identity-data.mjs` + các gate, không dựa vào README.

---

## 6. KẾT LUẬN PHÂN TÍCH

**Đánh giá tổng thể:** Dự án có chiều sâu nghiệp vụ đáng nể và tầng bảo vệ bản quyền/quy trình rất cẩn trọng — đáng kinh ngạc so với quy mô. Điểm yếu lớn nhất không phải nghiệp vụ mà là **bảo trì**: monolith 1 file 553 KB, schema Drizzle thiếu 32 bảng, không down-migration, timestamp TEXT, và fingerprint gate làm mọi refactor trở nên đắt đỏ.

**Hướng phát triển khôn ngoan:** Ưu tiên (1) hoàn thiện các màn placeholder nhìn thấy được, (2) tăng chiều sâu báo cáo/tài chính, (3) tách kiến trúc monolith bằng các vòng release riêng kèm refresh fingerprint — theo lộ trình trong `docs/04_KE_HOACH_PHAT_TRIEN.md`.