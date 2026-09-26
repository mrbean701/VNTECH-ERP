# TÀI LIỆU HƯỚNG DẪN PHÁT TRIỂN (DEV) — VNTECH ERP V5.3.0

Bản cập nhật: 23/09/2026 · Bộ tài liệu bàn giao hệ thống.

Tài liệu này dành cho **lập trình viên / quản trị viên hệ thống / NVIT** làm việc trên mã nguồn. Đọc kỹ phần "Quy tắc vàng" (mục 5) trước khi chạm vào code.

---

## 1. YÊU CẦU MÔI TRƯỜNG

| Thành phần | Yêu cầu |
|---|---|
| Node.js | ≥ 22.13 (khuyến nghị 22 LTS hoặc 24) |
| Java | OpenJDK 26 tại máy này (`C:\Users\PC\.jdks\openjdk-26.0.2.1`) |
| Maven | 3.9.16 (wrapper lấy từ `.m2/wrapper`, không chạy được với `.m2` mặc định — xem mục 3) |
| MySQL | 8.4 (CSDL `vntech_erp`, cổng 3306) |
| npm | 10+ |
| Docker (môi trường có) | Docker Desktop/Engine + Compose (production Postgres + Redis — phiên bản lộ trình) |

> ⚠️ Java và Node **KHÔNG có trong PATH** của shell — phải dùng đường dẫn đầy đủ hoặc đặt `JAVA_HOME`.

---

## 2. CẤU TRÚC MÃ NGUỒN

```
/ (root)
├── app/                      # UI: page.tsx (SPA ~2916 dòng/598 KB), globals.css, api/system
├── app/components/ui/        # 7 component dùng chung: DataTable, ListToolbar, StatusBadge, EntityDetailModal, Timeline...
├── app/screens/              # 42 màn hình (Requests, Purchasing, Inventory, Stocktake, TeamDirectory, ...)
├── app/styles/canonical.css  # CSS dùng chung
├── lib/                      # helper: runtime-env, labels (statusLabel), ui-shared, form-fields, export...
├── scripts/                  # system-route.mjs (backend JS), universal-runtime/server, preflight, verify, probe-*...
├── java-backend/             # Backend Java (xem mục 2.1)
├── drizzle/                  # Migration SQLite: 0000..0194
├── db/schema.ts              # Schema Drizzle (⚠️ chỉ 67/99 bảng — KHÔNG đầy đủ)
├── tests/                    # test: regression, workflow E2E, trust, security, mobile, BOQ, tm0*, ad0*, ...
├── deploy/                   # docker-compose, proxy Caddy
├── tools/                    # probe-*, seed-demo, cutover-proxy, gen-roadmap-110-md...
├── public/                   # assets
└── docs/                     # tài liệu (bộ bàn giao này nằm ở đây)
```

### 2.1 java-backend (Maven đa module)
```
java-backend/
├── .mvn/maven.config         # -Dmaven.repo.local=<workspace>\_m2-repo  (không commit)
├── domain/                   # entity thuần
├── application/              # use-case, port out (31 port), RBAC (ActionRbacRegistry, RbacService, AccessScopeService)
├── infrastructure/           # adapter JPA/MySQL, Flyway V1..V28, bootstrap, workers
│   └── src/main/resources/db/migration/V1__baseline.sql (114 bảng) ...
├── web/                      # SystemController (~224 case action), config tầng web
├── DATA_MODEL_REFERENCE.json # tableCount=114, nguồn baseline
└── tools/seed-demo.mjs       # seed dữ liệu demo
```

---

## 3. BUILD & CHẠY

### 3.1 Frontend / monolith JS
```bash
npm install
npm run dev          # dev server (Node local, SQLite warehouse.sqlite)
npm run build        # build production (EXIT 0 mới coi là đạt)
```

### 3.2 Backend Java — chuẩn bị (một lần cho mỗi máy)
```powershell
# (a) chép local Maven repo vào workspace để mvn có quyền ghi (~411 MB)
robocopy "C:\Users\PC\.m2\repository" "<WORKSPACE>\_m2-repo" /E /NFL /NDL /NJH /NJS /NP

# (b) tạo java-backend\.mvn\maven.config với 1 dòng duy nhất:
#     -Dmaven.repo.local=<WORKSPACE>\_m2-repo
```
> `_m2-repo/` và `java-backend/.mvn/maven.config` **không commit** (đường dẫn tuyệt đối máy local).

### 3.3 Build Java
```powershell
$env:JAVA_HOME = "C:\Users\PC\.jdks\openjdk-26.0.2.1"
$mvn = "C:\Users\PC\.m2\wrapper\dists\apache-maven-3.9.16\<...>\bin\mvn.cmd"
Set-Location java-backend
& $mvn -DskipTests package
```
- Kỳ vọng: `Domain → Application → Infrastructure → Web` đều `SUCCESS`.
- Jar béo: `java-backend/web/target/vntech-erp-web-0.1.0-SNAPSHOT.jar` ≈ **90 MB**. Nếu thấy ~68 KB → repackage fail.

### 3.4 Chạy Java API (đúng cách)
```powershell
# dừng đúng PID :18081 rồi khởi động lại
& "C:\Users\PC\.jdks\openjdk-26.0.2.1\bin\java.exe" -jar web\target\vntech-erp-web-0.1.0-SNAPSHOT.jar --server.port=18081
Invoke-WebRequest "http://127.0.0.1:18081/actuator/health" -UseBasicParsing
```
> ⚠️ KHÔNG dùng `Start-Process` — tiến trình chết khi cửa sổ PowerShell đóng.

### 3.5 Chạy seed demo
```powershell
node "java-backend/tools/seed-demo.mjs" "http://127.0.0.1:9000"   # → SEED DEMO: 61/61 PASS
```

---

## 4. TEST & CỔNG XANH

### 4.1 Lệnh kiểm định chuẩn (chạy sau mọi thay đổi)
```bash
npm run verify:release
npm run verify:master-baseline
npm run verify:css-baseline
npm run verify:fingerprint
npm test            # lint + typecheck + regression + workflow
```

### 4.2 Bộ test hiện có
| Bộ test | Phạm vi | Trạng thái mẫu |
|---|---|---|
| `npm run typecheck` (tsc) | TypeScript strict | 0 error |
| `test:regression` | 69 test hồi quy | 69/69 PASS |
| `test:workflow` | E2E luồng nghiệp vụ | ĐẠT |
| Java `mvn -pl web -am test` | 42 test (H2) | 42/3 đỏ có sẵn/0 mới |
| probe nền (bootstrap 100/100, work-items 18/18, audit-requests 18/18, owner-checks 10/10, all-roles 20/20, schema-drift 0, ≤min 69/69...) | chạy qua tools/ | chờ xanh |

> Lưu ý: một số "đỏ" là **đỏ có sẵn/đã biết** (vd TASK-031 sentinel, TASK-032 `defaultOrganizationCode`, ProductionRoleCounterProofTest). Đọc log để phân biệt trước khi sửa.

---

## 5. QUY TẮC VÀNG (KHÔNG THỂ THƯƠNG LƯỢNG)

### 5.1 Cấm
1. ❌ **Format lại code** (prettier/beautify) bất kỳ file nguồn trong danh sách fingerprint (`app/`, `db/`, `lib/`, `scripts/`, `drizzle/`...). Định dạng hiện tại **LÀ contract**; format 1 lần = vỡ 3 gate.
2. ❌ Sửa/xóa migration cũ. Chỉ **append**: `drizzle/0195_*.sql` mới, hoặc Flyway `V29` mới. Cập nhật `MIGRATION_HEAD`.
3. ❌ Sửa tay file identity: `VNTECH_*.txt`, `VNTECH_FINGERPRINT.json`, `MANIFEST_SHA256.txt`, `lib/vntech-identity-data.mjs`, `*identity_refresh*.sql`. MANIFEST chỉ tái sinh bằng tool khi đóng gói.
4. ❌ Thêm CSS sau marker `VNTECH_MASTER_BASELINE_CSS_R1_1_1_END` trong `app/globals.css`.
5. ❌ Đưa secret/PEM/.key/.p12/.pfx vào source (gate quét toàn cây).
6. ❌ Tạo file `patch*`, `gate*`, `rc*` ở root/tests (strict-package chặn).
7. ❌ Đưa `node_modules/dist/.env/.wrangler` vào git/gói.

### 5.2 Nên
- ✅ Thêm logic nghiệp vụ trong `scripts/system-route.mjs` (giữ if-chain style cũ) — không tách file làm phá fingerprint.
- ✅ Thêm UI trong `app/page.tsx` tái dùng class CSS có sẵn (`nav-glyph-*`, `density-*`, `boq-row-*`).
- ✅ Chạy đủ cổng sau mọi thay đổi; commit thông điệp rõ ràng.
- ✅ Khi thêm bảng/cột: thêm **cả hai dòng migration** (MySQL Flyway + SQLite Drizzle) theo quy tắc additive.
- ✅ Ghi chú "Cần refresh fingerprint" vào commit khi thay đổi nghiệp vụ.

### 5.3 Nếu cần refactor kiến trúc (tách monolith)
Đây là **quyết định chiến lược** → xem `docs/04_KE_HOACH_PHAT_TRIEN.md` (Phase 3). Refactor phải là vòng phát hành riêng: đổi source → tính fingerprint mới → refresh identity SSOT đúng quy trình → migration mới → kiểm toàn bộ danh sách file khớp.

---

## 6. BẢN ĐỒ SỬA TÍNH NĂNG (LUỒNG REQUEST)

```
UI (app/page.tsx) --POST {action,...}--> app/api/system/route.ts
   → bind env globalThis.__MEP_LOCAL_ENV__
   → scripts/system-route.mjs (handleAction)
        → loadEnv → currentUser → requireActionModule → handler
   ───hoặc───  Java: Web/SystemController → RbacService → UseCase → Port → Adapter → MySQL
```

| Bạn muốn làm | Sửa ở đâu |
|---|---|
| Thêm action backend JS | `scripts/system-route.mjs`: thêm `case` + khai `ACTION_MODULE`/`ACTION_CAPABILITY` |
| Thêm action backend Java | `web/SystemController.java` (case action) + UseCase + port + adapter + đăng ký RBAC |
| Thêm màn hình UI | `app/page.tsx`: module key + nhánh render + component (hoặc `app/screens/*`) |
| Thêm bảng/cột | Migration mới (Drizzle append `0195+` **và** Flyway `V29+`) |
| Thêm export file | `lib/*.ts` (`request-export.ts`, `boq-export.ts`, `tabular-export.ts`) |
| Cấu hình form động | `lib/form-fields.ts` + bảng `form_field_config` |
| Thêm probe/kiểm tra | `tools/probe-*.mjs` |

---

## 7. DEBUG NHANH

| Triệu chứng | Nguyên nhân hay gặp | Xử lý |
|---|---|---|
| `GET /api/system` 500 internal error | CSDL chưa migrate | Chạy dev lại (tự migrate) hoặc `wrangler d1 migrations apply DB --local` |
| Gate `verify:fingerprint` FAIL | Sửa file nguồn bị hash | Nếu dev: OK miễn test pass; nếu release: refresh identity |
| `spawn EFTYPE` khi dev | Native binary chưa cài | `npm approve-scripts` + reinstall |
| Login sai 10 lần bị khóa | Login lockout (15 phút) | Đợi hết khóa hoặc reset qua admin |
| Màn "ĐANG PHÁT TRIỂN" | Module chưa hoàn thiện | Không phải lỗi — đúng thiết kế |
| `mvn package` fail "AccessDenied .m2" | Local repo đặt sai | Dùng `_m2-repo` + `maven.config` |
| `Unable to rename jar` | Java đang chạy giữ file | Dừng đúng PID :18081 trước khi build |
| Proxy :9000 trả 502 | Java API bị chết | Kiểm `probe-live-stack.mjs`; khởi động lại jar |
| admin báo 401 sau khi UI ghi đè | Hash admin bị đổi | Chạy lại seed (reset PBKDF2) |

---

## 8. CHECKLIST DEV MỚI (3 NGÀY)

- [ ] Đọc `docs/01_BAO_CAO_PHAN_TICH_DU_AN.md`, `docs/04_KE_HOACH_PHAT_TRIEN.md`, `docs/32`, `docs/33`.
- [ ] `npm install` + `npm run dev`; cài môi trường Java + Maven local repo.
- [ ] Chạy `npm test` một lượt — hiểu vùng phủ.
- [ ] Lướt 5 màn: Dashboard, Requests, Purchasing, Inventory, Material Catalog.
- [ ] Đọc `scripts/preflight-source.mjs` — hiểu vì sao không được format code.
- [ ] Đọc bộ runbook Java: `docs/29_RUNBOOK_BUILD_VA_CHAY_JAVA_BACKEND.md`, `docs/11_RUNBOOK_VAN_HANH_BACKEND_JAVA.md`.
- [ ] Thử 1 tính năng nhỏ + chạy đủ verify gates.
- [ ] Hỏi trước khi chạm: `app/globals.css`, `db/schema.ts`, `drizzle/`, file identity.

---
*Tài liệu thuộc bộ tài liệu bàn giao hệ thống VNTECH ERP V5.3.0 (23/09/2026).*