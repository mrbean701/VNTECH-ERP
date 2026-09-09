# HƯỚNG DẪN DEV MỚI — VNTECH ERP V5.3.0

Bản cập nhật: 09/2026 · Đọc cùng `docs/01_BAO_CAO_PHAN_TICH_DU_AN.md` và `docs/04_KE_HOACH_PHAT_TRIEN.md`.

---

## 1. KHỞI ĐẦU

### 1.1 Yêu cầu môi trường
- Node.js ≥ 22.13 (khuyến nghị 22 LTS hoặc 24), npm 10+.
- Docker Desktop/Engine + Docker Compose (cho production chạy PostgreSQL + Redis).
- Git (nên init repo riêng; bộ cài này chưa có git).
- Không cần tài khoản Cloudflare cho phát triển local.

### 1.2 Cài đặt & chạy local (KHÔNG cần Cloudflare)
```bash
npm install            # cài dependencies
npm run dev            # Vite dev server (thường ở http://localhost:5173)
```
Dev server dùng `node:sqlite` (`warehouse.sqlite`), tự chạy 50 migration, tự khởi tạo database. Vào web, lần đầu sẽ hiện màn **Setup** để tạo admin.

Tham chiếu script vận hành chính thức (Windows):
- `00_CAI_MOI_SERVER_WINDOWS.bat` — cài mới hoàn chỉnh (kiểm integrity → install).
- `01_MO_VNTECH_ERP_WINDOWS.bat` — mở phần mềm.
- `02_QUAN_LY_HE_THONG_WINDOWS.bat` — quản lý system (start/stop/backup/restore).
- `00_NANG_CAP_GIU_NGUYEN_DU_LIEU_WINDOWS.bat` — nâng cấp giữ dữ liệu.

### 1.3 Cách chạy production thật (PostgreSQL)
Xem `deploy/docker-compose.yml`: postgres 16 + redis 7 + app + backup; `compose.proxy.yml` thêm Caddy TLS. `.env.example` là mẫu biến môi trường (`VNTECH_DB_ENGINE=postgres`, `DATABASE_URL`, `VNTECH_REDIS_REQUIRED`, secret...).

---

## 2. BẢN ĐỒ CODE (AI CŨNG ĐỌC ĐƯỢC)

```
Bạn gõ luồng 1 request như thế này:
  UI (app/page.tsx)  --POST {action,...}-->  app/api/system/route.ts
        → bind env globalThis.__MEP_LOCAL_ENV__
        → scripts/system-route.mjs (handleAction, ~2900 dòng)
        → loadEnv → currentUser → requireActionModule → handler

Mọi action: scripts/system-route.mjs
Mọi UI:     app/page.tsx (SPA 1 file, state machine tại Home(), dispatch tại ~dòng 653)
DB schema:  db/schema.ts  (67 bảng — KHÔNG đầy đủ) / drizzle/0000..0049 (99 bảng thật)
```

### 2.1 Nơi cần sửa khi làm tính năng mới
| Bạn muốn làm | Sửa ở đâu |
|---|---|
| Thêm action backend | `scripts/system-route.mjs`: thêm case trong `handleAction` + khai `ACTION_MODULE`/`ACTION_CAPABILITY` |
| Thêm màn hình UI | `app/page.tsx`: thêm module key + nhánh render trong dispatch + component |
| Thêm bảng/cột | Tạo migration mới `drizzle/0050_*.sql` (CHỈ APPEND, KHÔNG sửa migration cũ) |
| Thêm export file | `lib/*.ts` (`request-export.ts`, `boq-export.ts`, `tabular-export.ts`...) |
| Cấu hình form động | `lib/form-fields.ts` + bảng `form_field_config` |

> ⚠️ **KHÔNG chạy `drizzle-kit generate` bừa bãi**: schema.ts chỉ có 67/99 bảng, generate có thể tạo migration xóa 32 bảng đang chạy. Migration dự án chạy bằng script riêng (installer/upgrade), không qua drizzle-kit.

### 2.2 Các file quyết định kiến trúc (đọc trước khi làm 2 ngày)
- `scripts/universal-runtime.mjs` + `scripts/universal-server.mjs` — adapter DB (D1/PG/SQLite), env binding.
- `scripts/migrate-postgres.mjs` — dịch SQLite→PG, preflight, topological sort.
- `lib/runtime-env.ts` — schema env; `lib/material-matching-v2.mjs` — matching engine.
- `lib/trust/*` — fingerprint, canonical-json, license-verifier (Trust Lock).
- `scripts/preflight-source.mjs` + `scripts/master-baseline-gate.mjs` + `verify-vntech-fingerprint.mjs` — integrity gates (đọc §4).

---

## 3. QUY TRÌNH LÀM VIỆC HÀNG NGÀY

1. **Trước khi sửa**: chạy `node scripts/verify-vntech-fingerprint.mjs` → nhớ fingerprint gốc là bao nhiêu.
2. **Sửa nghiệp vụ tinh gọn** trong các file cho phép; tránh đụng file khóa.
3. **Sau khi sửa**: chạy tuần tự:
   ```bash
   npm run verify:release
   npm run verify:master-baseline
   npm run verify:css-baseline
   npm run verify:fingerprint
   npm test                 # lint + typecheck + regression + workflow
   ```
   Nếu `verify:fingerprint` FAIL → source đang khác fingerprint đăng ký. Tùy mục đích:
   - Chỉ sửa code dev, không phát hành → đây là hiện tượng bình thường khi dev feature, nhưng **đừng phá gate của chính bạn**: test qua `npm test`, và khi kết thúc vòng phát hành phải làm fingerprint refresh (xem vòng FP_FIXED trong báo cáo).
   - Đang phát hành thật → phải thực hiện đúng quy trình refresh identity + migration 0050 (không sửa tay file identity).

4. Mọi thay đổi nghiệp vụ của bạn SẼ phải kèm cập nhật fingerprint khi đóng gói. Hãy ghi chú "Cần refresh fingerprint" vào commit.

---

## 4. QUY TẮC VÀNG (KHÔNG THỂ THƯƠNG LƯỢNG)

### 4.1 Cấm
- ❌ **Format lại code/prettier/beautify bất kỳ file nguồn nào** trong danh sách fingerprint (app/, db/, lib/, scripts/, drizzle/…). Chỉ 1 lần prettier → 3 gate vỡ → rollback. **Định dạng hiện tại LÀ contract.**
- ❌ Sửa/xóa migration cũ (`drizzle/`). Chỉ append file mới `0050+`, cập nhật `MIGRATION_HEAD` nếu cần.
- ❌ Sửa tay file identity (`VNTECH_*.txt`, `VNTECH_FINGERPRINT.json`, `lib/vntech-identity-data.mjs`, `MANIFEST_SHA256.txt`). MANIFEST chỉ tái sinh bằng tool khi đóng gói.
- ❌ Thêm CSS phía sau marker `VNTECH_MASTER_BASELINE_CSS_R1_1_1_END` trong `app/globals.css`.
- ❌ Đưa secret/private key/PEM/`.key/.p12/.pfx` vào source (gate quét toàn cây).
- ❌ Tạo file tên `patch*`, `gate*`, `rc*` ở root/tests (bị strict-package chặn).
- ❌ Đưa `node_modules/dist/.env/.wrangler` vào git/gói.

### 4.2 Nên
- ✅ Thêm logic mới trong `scripts/system-route.mjs` (giữ if-chain đúng style hiện có) — không tách file làm phá fingerprint.
- ✅ Thêm UI trong `app/page.tsx` tái dùng class CSS có sẵn (`nav-glyph-*`, `density-*`, `boq-row-*`...).
- ✅ Chạy test sau mọi thay đổi; lỗi test kèm `npm test` để ổn định.
- ✅ Khi cần chạy DB thật: backup PostgreSQL trước, migration qua upgrade bat.

### 4.3 Nếu cần refactor kiến trúc (tách monolith)
Đây là quyết định chiến lược → xem lộ trình trong `docs/04_KE_HOACH_PHAT_TRIEN.md` (Phase 3). Refactor phải là vòng phát hành riêng: đổi source → tính fingerprint mới → refresh identity SSOT đúng quy trình → migration 0050 → kiểm 171 file khớp.

---

## 5. DEBUG NHANH

| Triệu chứng | Nguyên nhân hay gặp | Xử lý |
|---|---|---|
| `GET /api/system` 500 `internal error` | D1 local chưa có bảng (chưa migrate) | Chạy dev lại (tự migrate) hoặc `wrangler d1 migrations apply DB --local` |
| Gate `verify:fingerprint` FAIL | Sửa file nguồn bị hash | Xem §3.3. Nếu dev, OK miễn test pass; nếu release, refresh identity |
| `Preflight thiếu contract X` | Mất marker string trong file khóa | Khôi phục đúng dòng gốc (đừng format) |
| `spawn EFTYPE` khi chạy dev | Native binary chưa cài (workerd/esbuild) | `npm approve-scripts` + reinstall |
| Login sai 10 lần bị khóa | Login lockout (15 phút) | Đợi hết khóa hoặc reset qua admin |
| Màn hiện "ĐANG PHÁT TRIỂN" | Module chưa hoàn thiện (15 màn) | Không phải lỗi — đúng thiết kế |

---

## 6. CHECKLIST DEV MỚI TRONG 3 NGÀY

- [ ] Đọc `docs/01_BAO_CAO_PHAN_TICH_DU_AN.md` + `docs/04_KE_HOACH_PHAT_TRIEN.md`.
- [ ] `npm install` + `npm run dev`, tạo admin qua màn Setup, đăng nhập.
- [ ] Lướt 5 màn: Dashboard, Requests (tạo phiếu → duyệt), Purchasing (tạo PO), Inventory, Material Catalog.
- [ ] Chạy `npm test` một lượt — hiểu vùng phủ (regression + workflow E2E).
- [ ] Đọc `scripts/preflight-source.mjs` — hiểu tại sao không được format code.
- [ ] Thử 1 tính năng nhỏ + chạy đủ verify gates.
- [ ] Đặt câu hỏi trước khi chạm `app/globals.css`, `db/schema.ts`, `drizzle/`, file identity.