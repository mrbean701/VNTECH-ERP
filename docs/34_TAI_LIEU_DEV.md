> **VNTECH ERP — BỘ TÀI LIỆU PHIÊN BẢN `ALPHA TEST`**
> · Phiên bản tài liệu: **`DOC-ALPHA-TEST-2026.10`** · Ngày cập nhật: **08/10/2026** · Phiên soạn: `ERP-SESSION-01`
> · Sản phẩm: `V5.3.0-MASTER-BASELINE-R1.1.1` · Cổng: `:8787` (UI) · `:9000` (cutover) · `:18081` (API Java)
> · ⚠️ Trạng thái: **ALPHA TEST** — tài liệu phản ánh bản ĐANG CHẠY; ⛔ chưa phải bản phát hành chính thức.
> · 📌 Nguồn sự thật: **mã nguồn + CSDL thật** (mọi số liệu đều ĐO được, ⛔ không suy đoán).

# TÀI LIỆU HƯỚNG DẪN PHÁT TRIỂN (DEV) — VNTECH ERP V5.3.0

**Bản cập nhật: 09/10/2026** (thay bản 23/09/2026) · Bộ tài liệu bàn giao hệ thống.

Tài liệu này dành cho **lập trình viên / quản trị viên hệ thống / NVIT** làm việc trên mã nguồn. Đọc kỹ **§6 Quy tắc vàng** trước khi chạm vào code.

> 📌 **Quy ước của tài liệu này**: mọi con số, tên tệp, cổng, PID đều **ĐO TỪ MÃ NGUỒN hoặc TIẾN TRÌNH ĐANG CHẠY ngày 09/10/2026** và **ghi kèm LỆNH KIỂM** để phiên sau tự đo lại. Chỗ nào chưa kiểm chứng được thì ghi rõ **«cần xác minh»** — ⛔ tuyệt đối không suy đoán.

---

## 0. MỤC LỤC

| # | Mục | Nội dung chính |
|---|---|---|
| 1 | [Yêu cầu môi trường](#1-yêu-cầu-môi-trường) | Node · JDK · Maven · MySQL · **4 cổng** |
| 2 | [Cấu trúc mã nguồn](#2-cấu-trúc-mã-nguồn) | cây thư mục · `java-backend` đa module · SSOT định danh |
| 3 | [Build & chạy](#3-build--chạy) | **dừng ĐÚNG PID** · frontend · backend Java · cutover · seed |
| 4 | [Chuỗi build + đồng bộ vân tay](#4-chuỗi-build--đồng-bộ-vân-tay) | fixpoint → build → `_sync-identity-once` → chạy lại → cổng `verify-ui-build-applied` |
| 5 | [Test & cổng xanh](#5-test--cổng-xanh) | **lệnh cụ thể** · 162 tệp test · `KNOWN_RED` |
| 6 | [Quy tắc vàng](#6-quy-tắc-vàng-không-thể-thương-lượng) | ⛔ cấm · ✅ nên · 4 luật mới |
| 7 | [Bản đồ sửa tính năng](#7-bản-đồ-sửa-tính-năng-luồng-request) | sửa ở đâu cho việc gì |
| 8 | [Công cụ chẩn đoán](#8-công-cụ-chẩn-đoán-trong-tools) | 30 công cụ có thật trong `tools/` |
| 9 | [Debug nhanh](#9-debug-nhanh) | triệu chứng → xử lý |
| 10 | [Checklist dev mới](#10-checklist-dev-mới-3-ngày) | 3 ngày đầu |

---

## 1. YÊU CẦU MÔI TRƯỜNG

| Thành phần | Yêu cầu / bản đang dùng trên máy này | Cách kiểm |
|---|---|---|
| Node.js | **≥ 22.13** (`package.json` → `engines.node`) · máy này **v24.19.0** | `node -v` |
| npm | **11.17.0** (npm 10+ là đủ) | `npm -v` |
| Java | **OpenJDK 26** tại `C:\Users\PC\.jdks\openjdk-26.0.2.1` | `Test-Path "C:\Users\PC\.jdks\openjdk-26.0.2.1\bin\java.exe"` |
| Maven | **3.9.16** (wrapper): `C:\Users\PC\.m2\wrapper\dists\apache-maven-3.9.16\<hash>\bin\mvn.cmd` — ⚠️ `<hash>` **khác nhau từng máy** | `Get-ChildItem "C:\Users\PC\.m2\wrapper\dists\apache-maven-3.9.16" -Directory` |
| MySQL | **8.4** · CSDL `vntech_erp` · cổng **3306** | `netstat -ano \| Select-String ":3306 "` → phải thấy `LISTENING` |
| Docker (môi trường có) | Docker Desktop/Engine + Compose (Postgres + Redis — phiên bản lộ trình) | `deploy/docker-compose.yml` |

> ⚠️ Java và Node **KHÔNG có trong PATH** của shell — phải dùng **đường dẫn đầy đủ** hoặc đặt `JAVA_HOME`.

### 1.1 Bốn cổng — ai giữ cổng nào (đo 09/10/2026 08:17)

| Cổng | Vai trò | Tiến trình giữ cổng | PID đo được |
|---|---|---|---|
| **8787** | UI — **bản build tĩnh** do Node SSR phục vụ (`scripts/local-server.mjs`) | `node` | 14028 |
| **9000** | Cutover proxy (`tools/cutover-proxy.mjs`) — `/api/*` → Java, còn lại → Node | `node` | 5584 |
| **18081** | API Java (`java-backend` — jar Spring Boot) | `java` | 20508 |
| **3306** | MySQL (`mysqld`) | `mysqld` | 5124 |

```powershell
# Đo lại 4 cổng bất cứ lúc nào (đọc-only):
foreach ($p in 8787,9000,18081,3306) {
  $c = netstat -ano | Select-String "LISTENING" | Select-String ":$p "
  if ($c) { ":$p DANG NGHE -> " + $c[0].Line.Trim() } else { ":$p KHONG nghe" }
}
```

> ⛔ **`tools/cutover-proxy.mjs` mặc định nghe `:8787`** (`const LISTEN_PORT = Number(arg("--port", … || 8787))`) ⇒ muốn proxy ở `:9000` **BẮT BUỘC** truyền `--port 9000 --ui-port 8787 --api-port 18081` (xem §3.3).
> ⛔ `java-backend/web/src/main/resources/application.yml` khai `server.port: ${PORT:8787}` ⇒ chạy jar **BẮT BUỘC** truyền `--server.port=18081`, nếu không Java sẽ tranh cổng `:8787` với UI.

---

## 2. CẤU TRÚC MÃ NGUỒN

```
/ (root)
├── app/                      # UI: page.tsx (SPA, ĐO ĐƯỢC 3607 dòng), globals.css, layout.tsx, api/
│   ├── api/system/route.ts   #   cửa vào duy nhất của API nội bộ (GET = bootstrap, POST = action)
│   ├── screens/              #   55 tệp màn hình (52 tệp .tsx): WorkCenter, BoqControl, WarehouseFormModal, ...
│   ├── components/ui/        #   7 tệp component dùng chung: DataTable, ListToolbar, StatusBadge, EntityDetailModal, ...
│   └── styles/canonical.css  #   CSS dùng chung
├── lib/                      # 36 tệp helper: ui-shared.tsx, menu-helpers.ts, request-export.ts, boq-export.ts,
│                             #   tabular-export.ts, form-fields.ts, vntech-identity-data.mjs (SSOT), trust/*
├── scripts/                  # backend JS + cổng: system-route.mjs (3409 dòng), local-server.mjs, local-runtime.mjs,
│                             #   build-cross-platform.mjs, regression-suite.mjs, preflight-source.mjs, verify-*.mjs
├── java-backend/             # Backend Java (xem §2.1) — Maven đa module
├── drizzle/                  # 393 tệp .sql (head SSOT = 0352), CHỈ APPEND — xem §6.1
├── db/schema.ts              # Schema Drizzle — ĐO ĐƯỢC 67 định nghĩa bảng (⚠️ KHÔNG phủ hết **134 bảng** MySQL (⭐ đo 08/10/2026: `information_schema.tables` = 134))
├── tests/                    # 167 tệp; 162 tệp khớp mẫu cổng hồi quy (xem §5.2)
├── tools/                    # 347 tệp công cụ: probe-*, cutover-proxy, fixpoint-fingerprint, verify-ui-build-applied, ...
├── deploy/                   # docker-compose, proxy Caddy
├── public/                   # assets
└── docs/                     # 68 tệp .md — bộ tài liệu bàn giao nằm ở đây
```

**Lệnh kiểm các con số trên:**

```powershell
(Get-Content app/page.tsx | Measure-Object -Line).Lines                 # 3607
(Get-ChildItem app/screens -File | Measure-Object).Count                # 55
(Get-ChildItem app/components/ui -File | Measure-Object).Count          # 7
(Get-ChildItem lib -File | Measure-Object).Count                        # 36
(Get-Content scripts/system-route.mjs | Measure-Object -Line).Lines     # 3409
(Get-ChildItem drizzle -Filter *.sql -File | Measure-Object).Count      # 393
(Select-String -Path db/schema.ts -Pattern "Table\(").Count             # 67
(Get-ChildItem tests -File | Measure-Object).Count                      # 167
(Get-ChildItem tools -File | Measure-Object).Count                      # 347
(Get-ChildItem docs -Filter *.md -File | Measure-Object).Count          # 68
```

### 2.1 `java-backend` — Maven đa module

| Thư mục (ĐO ĐƯỢC bằng `Get-ChildItem java-backend -Directory`) | Nội dung |
|---|---|
| `domain/` | Entity thuần |
| `application/` | Use-case, port out, RBAC (`ActionRbacRegistry`, `RbacService`, `AccessScopeService`) |
| `infrastructure/` | Adapter JPA/MySQL, **Flyway `V1..V39`** (38 tệp, đo được), bootstrap (`BootstrapDataAdapter.java`), workers |
| `web/` | `SystemController.java` (ĐO ĐƯỢC **262** nhánh `case "`), config tầng web, test H2 |
| `contract-tests/` | Kiểm thử hợp đồng giữa các tầng |
| `data/` | Dữ liệu kèm module |
| `tools/` | `seed-demo.mjs` |
| `.mvn/` · `.idea/` | Cấu hình Maven local repo · IDE |

```
java-backend/
├── .mvn/maven.config                    # -Dmaven.repo.local=<WORKSPACE>\_m2-repo (KHÔNG commit)
├── infrastructure/src/main/resources/db/migration/V1__baseline.sql ... V39__*.sql
├── DATA_MODEL_REFERENCE.json            # ĐO ĐƯỢC: "tableCount": 114  (nguồn baseline)
└── tools/seed-demo.mjs                  # seed dữ liệu demo
```

**Lệnh kiểm:**

```powershell
Get-ChildItem java-backend -Directory | Select-Object -ExpandProperty Name
(Select-String -Path "java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java" -Pattern 'case "').Count   # 262
(Get-ChildItem java-backend/infrastructure/src/main/resources/db/migration -Filter "V*.sql" -File).Count                           # 38 (V1..V39)
Select-String -Path java-backend/DATA_MODEL_REFERENCE.json -Pattern "tableCount"                                                   # 114
```

### 2.2 Vân tay & định danh — SSOT

| Thành phần | Tệp | Vai trò |
|---|---|---|
| **SSOT vân tay** | `lib/vntech-identity-data.mjs` | Nguồn duy nhất: `sourceFingerprint` (64-hex), `sourceFingerprintShort` (`VNTECH-FP-…`), `brandFingerprint`, `release.releaseFingerprint`, `release.migrationHead` |
| Vân tay công bố | `VNTECH_FINGERPRINT.json` | Bản JSON song song, do công cụ ghi |
| Định danh gói | `VNTECH_PRODUCT_IDENTITY.txt`, `VNTECH_PACKAGE_ID.txt`, `VNTECH_FULL_W2_ID.txt` | Marker định danh gói FULL |
| Manifest | `MANIFEST_SHA256.txt` | SHA256 từng tệp — chỉ tái sinh **bằng tool** khi đóng gói |
| Tập hash nguồn | `lib/trust/source-fingerprint.mjs` → `ROOT_DIRS = {app, db, deploy, drizzle, lib, public, scripts, tests, worker}` | ⚠️ **`docs/` và `tools/` KHÔNG nằm trong tập hash** ⇒ sửa tài liệu/công cụ **không** làm đổi vân tay |
| Bảng định danh CSDL cục bộ | `.local-data/warehouse.sqlite` → `vntech_product_identity`, `vntech_trust_settings` | Bị **trigger** `vntech_product_identity_no_update` bảo vệ; `scripts/local-runtime.mjs:177` **TỪ CHỐI KHỞI ĐỘNG** nếu `source_fingerprint` khác SSOT |

> ⛔ **Hệ quả bắt buộc nhớ**: sửa bất kỳ tệp trong `ROOT_DIRS` ⇒ vân tay nguồn đổi ⇒ phải chạy **chuỗi §4** (fixpoint → build → đồng bộ định danh SQLite → chạy lại `:8787`), nếu không `node scripts/local-server.mjs` sẽ **chết ngay khi khởi động** với `Dau van tay san pham VNTECH khong hop le hoac da bi thay doi.`

---

## 3. BUILD & CHẠY

### 3.0 LUẬT SỐ 1 — DỪNG **ĐÚNG PID** ĐANG GIỮ CỔNG

> ⛔ **TUYỆT ĐỐI KHÔNG** `Stop-Process -Name node -Force`, `Stop-Process -Name java -Force`, `taskkill /IM node.exe /F`, hay `Get-Process node | Stop-Process`.
> Máy này **dùng chung** cho nhiều phiên: `node` đang giữ `:8787` (UI) **và** `:9000` (proxy); `java` giữ `:18081`; dsh/agent cũng chạy bằng `node`. Kill theo **tên tiến trình** = giết cả phiên khác đang làm việc + làm chết công cụ đang chạy.

```powershell
# 1) Tìm ĐÚNG PID đang giữ cổng cần dừng
netstat -ano | Select-String "LISTENING" | Select-String ":8787 "     # đổi 8787 -> 9000 / 18081

# 2) Xác nhận đó đúng là tiến trình của dự án (đối chiếu tên + dòng lệnh)
Get-Process -Id <PID> | Select-Object Id, ProcessName
Get-CimInstance Win32_Process -Filter "ProcessId=<PID>" | Select-Object -ExpandProperty CommandLine

# 3) CHỈ dừng đúng PID đó
Stop-Process -Id <PID> -Force
```

- Dừng **UI `:8787`** (trước khi build lại / trước `_sync-identity-once`) → lấy PID từ `:8787`.
- Dừng **proxy `:9000`** → lấy PID từ `:9000`.
- Dừng **Java `:18081`** (trước khi `mvn package`, tránh `Unable to rename jar`) → lấy PID từ `:18081`.
- ⛔ **Không** dừng MySQL (`mysqld`) trừ khi có chủ đích.

### 3.1 Frontend / monolith JS

```powershell
npm install
npm run dev          # Vite dev server (HMR) — host 0.0.0.0 khai trong vite.config.ts
                     #   (cổng dev KHÔNG khai trong vite.config.ts: cần xác minh khi chạy thật)
npm run build        # = node scripts/build-cross-platform.mjs  (EXIT 0 mới coi là đạt)
npm run start        # = vinext start
```

**`npm run build` thực chất làm gì** (đọc từ `scripts/build-cross-platform.mjs`): nạp lần lượt
`preflight-source.mjs` → `verify-vntech-fingerprint.mjs` → `template-preflight.mjs` → `openxml-preflight.mjs` → `preflight-postgres-runtime.mjs`, rồi gọi `vinext build`, cuối cùng ghi `dist/.mep-version`.

> 🔴 **`dist/` là thứ được phục vụ, KHÔNG phải `app/`**: `scripts/local-server.mjs:20` nạp **một lần** `dist/server/index.js`; `scripts/local-runtime.mjs` phục vụ asset từ `dist/client`.
> ⇒ **Sửa `.tsx`/`.css` trên đĩa KHÔNG lên trình duyệt** cho tới khi `npm run build` **và** khởi động lại `:8787`. `:8787` **KHÔNG có HMR**. Đây là sự cố đã xảy ra thật (02/10/2026) và nay được canh bằng cổng §4.3.

### 3.2 Chạy UI `:8787` (bản build tĩnh)

```powershell
# ⚠️ chạy trong cửa sổ riêng / job nền, KHÔNG dùng Start-Process từ một phiên PowerShell sẽ đóng
node scripts/local-server.mjs          # -> in "Dia chi tren PC nay: http://localhost:8787"
Invoke-WebRequest "http://127.0.0.1:8787/" -UseBasicParsing   # phải là HTTP 200
```

- Lần chạy đầu tự khởi tạo CSDL cục bộ (`.local-data/warehouse.sqlite`) và in `Da khoi tao co so du lieu cuc bo: DAT.`
- Trên Windows nên mở bằng cửa sổ riêng: `tools/MO_VNTECH_CUTOVER.bat` (script này **chạy lại được nhiều lần**, dịch vụ nào đang chạy thì bỏ qua, và tự kiểm 4 cổng ở cuối).

### 3.3 Backend Java

**a) Chuẩn bị một lần cho mỗi máy**

```powershell
# (a) chép local Maven repo vào workspace để mvn có quyền ghi
robocopy "C:\Users\PC\.m2\repository" "<WORKSPACE>\_m2-repo" /E /NFL /NDL /NJH /NJS /NP
# (b) java-backend\.mvn\maven.config gồm ĐÚNG 1 dòng:
#     -Dmaven.repo.local=<WORKSPACE>\_m2-repo
```

> `_m2-repo/` và `java-backend/.mvn/maven.config` **KHÔNG commit** (chứa đường dẫn tuyệt đối của máy).

**b) Build**

```powershell
$env:JAVA_HOME = "C:\Users\PC\.jdks\openjdk-26.0.2.1"
$mvn = "C:\Users\PC\.m2\wrapper\dists\apache-maven-3.9.16\<hash>\bin\mvn.cmd"   # <hash> lấy ở §1
Set-Location java-backend
& $mvn -DskipTests package
```

- Kỳ vọng: `Domain → Application → Infrastructure → Web` đều `SUCCESS`.
- Jar béo: `java-backend/web/target/vntech-erp-web-0.1.0-SNAPSHOT.jar` ≈ **90 MB** (bản go-live 01/10 đo được 86,8 MB — `tools/deploy-java-backend.mjs`). Thấy ~68 KB ⇒ repackage **fail**.

**c) Chạy API (ĐÚNG cách)**

```powershell
# Dừng ĐÚNG PID :18081 trước (§3.0), rồi:
& "C:\Users\PC\.jdks\openjdk-26.0.2.1\bin\java.exe" -jar web\target\vntech-erp-web-0.1.0-SNAPSHOT.jar --server.port=18081
Invoke-WebRequest "http://127.0.0.1:18081/actuator/health" -UseBasicParsing   # HTTP 200, status UP
```

> ⚠️ **KHÔNG dùng `Start-Process`** từ phiên PowerShell sẽ đóng: tiến trình Java **chết theo phiên** ⇒ proxy `:9000` trả **502** và rất dễ chẩn đoán nhầm là lỗi UI. Dùng **cửa sổ cmd riêng** (`tools/MO_VNTECH_CUTOVER.bat` làm đúng việc này) hoặc job nền có quản lý.
> ⚠️ Nhớ `--server.port=18081`: không truyền thì Spring dùng `${PORT:8787}` và **đụng cổng UI**.

### 3.4 Cutover proxy `:9000`

```powershell
# ⛔ BẮT BUỘC truyền --port 9000 (mặc định của script là 8787)
node tools/cutover-proxy.mjs --port 9000 --ui-port 8787 --api-port 18081
# Kỳ vọng in ra:
#   Người dùng mở      : http://127.0.0.1:9000
#   /api/*  →  Java    : http://127.0.0.1:18081
#   Còn lại →  Node UI : http://127.0.0.1:8787
```

Thứ tự khởi động **bắt buộc**: **Java `:18081` → UI `:8787` → proxy `:9000`**. Đường rollback: mở thẳng `http://127.0.0.1:8787` (backend JS cũ).

### 3.5 Seed demo

```powershell
node "java-backend/tools/seed-demo.mjs" "http://127.0.0.1:9000"    # kỳ vọng kết thúc bằng SEED DEMO: … PASS
```

---

## 4. CHUỖI BUILD + ĐỒNG BỘ VÂN TAY

### 4.1 Vì sao phải theo đúng chuỗi này

1. Sửa tệp trong `ROOT_DIRS` ⇒ **vân tay nguồn đổi**.
2. `npm run build` **tự chạy** `verify-vntech-fingerprint.mjs` ⇒ nếu SSOT chưa cập nhật, build **ĐỎ**.
3. `.local-data/warehouse.sqlite` giữ vân tay **cũ** ⇒ `scripts/local-runtime.mjs:177` **từ chối khởi động** `:8787`.
4. Vì vậy phải: **chốt vân tay (fixpoint) → build → đồng bộ định danh SQLite → chạy lại → đo cổng**.

### 4.2 Năm bước (PowerShell)

```powershell
# ── BƯỚC 1 · FIXPOINT vân tay (chỉ ghi 2 tệp SSOT: lib/vntech-identity-data.mjs + VNTECH_FINGERPRINT.json)
node tools/fixpoint-fingerprint.mjs
#   Kỳ vọng: "✔ FIXPOINT OK sau N vòng"  ·  "migrationHead KHÔNG đổi: True"
#   Công cụ tự lặp tối đa 5 vòng; migrationHead/release KHÔNG bị đụng.

# ── BƯỚC 2 · BUILD  (bắt buộc; :8787 phục vụ dist/, KHÔNG phục vụ app/)
npm run build                       # EXIT 0 mới coi là đạt

# ── BƯỚC 3 · ĐỒNG BỘ 4 TRƯỜNG VÂN TAY VÀO SQLITE CỤC BỘ
#   ⚠️ THỨ TỰ THAM SỐ: <short> <full> <brand> <release>  (short TRƯỚC, full SAU)
$s = Get-Content lib/vntech-identity-data.mjs -Raw
foreach ($k in 'sourceFingerprintShort','sourceFingerprint','brandFingerprint','releaseFingerprint') {
  $m = [regex]::Match($s, "$k\s*:\s*`"([^`"]+)`"")
  "$k = " + $m.Groups[1].Value
}
node tools/_sync-identity-once.mjs <short> <full> <brand> <release>
#   Công cụ ĐỐI CHIẾU 4 tham số với SSOT: lệch ⇒ in "⛔ THAM SO KHONG KHOP SSOT ⇒ KHONG GHI" và thoát mã 2.
#   Nó tự DROP trigger vntech_product_identity_no_update → UPDATE 2 bảng → CREATE lại trigger, rồi in KHOP/KHONG KHOP.

# ── BƯỚC 4 · DỪNG ĐÚNG PID :8787 rồi CHẠY LẠI (§3.0 + §3.2)
node scripts/local-server.mjs

# ── BƯỚC 5 · CỔNG XÁC NHẬN (bắt buộc)
node tools/verify-ui-build-applied.mjs --port=8787
```

**Kết quả ĐẠT của BƯỚC 5 — đo thật ngày 09/10/2026 08:17 (EXIT=0):**

```
=== CONG: BAN CHAY CO MOI HON MA NGUON KHONG? ===
  ✓ do-moi    dist/ moi hon nguon 60s · 116 tep nguon da doi
  ✓ van-tay   HTML mang bb706f1202490077 · khop SSOT
  ✓ byte      6/6 bundle dung byte tren :8787

KET LUAN: BAN CHAY DUNG BAN DA BUILD MOI NHAAT.
```

| Dấu | Nghĩa | Nếu ✗ thì làm gì |
|---|---|---|
| `✓ do-moi` | `dist/` **mới hơn** mọi tệp nguồn trong `app/ lib/ public/` | Chạy lại **BƯỚC 2** rồi **BƯỚC 4** |
| `✓ van-tay` | `<meta name="vntech-source-fingerprint">` trong HTML **khớp SSOT** | Build lại (BƯỚC 2) + chạy lại (BƯỚC 4); nếu vẫn lệch ⇒ làm lại BƯỚC 1 |
| `✓ byte N/N` | Mọi bundle `.js` trong `dist/client/assets` được phục vụ **đúng byte** (hiện **6/6**) | Chạy lại `:8787`; nếu vẫn lệch ⇒ `npm run build` lại |

> ⚠️ **Hai điều dễ chẩn đoán nhầm**: (1) cổng này **mặc định đo `:9000`**, muốn đo `:8787` phải có `--port=8787`; (2) khi thoát nó có thể in `Assertion failed: … uv async.c` — đó là **rác teardown của Node trên Windows**, ⛔ đừng đọc thành «cổng hỏng»; hãy đọc **3 dấu ✓/✗** và dòng `KET LUAN`.

### 4.3 Các công cụ liên quan tới vân tay (đều có thật trong `tools/`)

| Công cụ | Việc |
|---|---|
| `tools/fixpoint-fingerprint.mjs` | Tính vân tay nguồn tới **điểm bất động**, ghi SSOT + `VNTECH_FINGERPRINT.json` |
| `tools/_sync-identity-once.mjs <short> <full> <brand> <release>` | Ghi 4 trường vân tay vào SQLite cục bộ (DROP/CREATE trigger) |
| `tools/refresh-phase-identity.mjs <migration-head-file> <phase-label>` | Khuôn `migrate-head`: **append khối identity vào migration head ĐÃ CÓ** + cập nhật 5 tệp định danh; literal 64-hex được normalizer che nên fixpoint bền |
| `tools/set-local-identity.mjs` | Đồng bộ hàng định danh trong SQLite cục bộ (dùng khi đo TRƯỚC/SAU, `git stash` …) |
| `tools/gd-cycle.mjs "<NHÃN GIAI ĐOẠN>"` | Tự động hoá cả chu kỳ: migration → build → fixpoint → artifact. ⚠️ **Bước 3 chỉ chạy được khi Node UI + proxy ĐÃ DỪNG** |
| `tools/verify-ui-build-applied.mjs` | Cổng «bản chạy có mới hơn mã nguồn không» (§4.2 BƯỚC 5) |

> ⛔ **`DEC-20261006-015`**: **KHÔNG tạo `drizzle/*.sql` chỉ để ghi vân tay** — `drizzle/` nằm trong `ROOT_DIRS` ⇒ ghi vân tay vào migration **làm vân tay đổi** ⇒ vòng lặp vô hạn. Muốn «refresh identity» thì dùng `tools/refresh-phase-identity.mjs` (append vào head **đã có**) hoặc `tools/_sync-identity-once.mjs` (UPDATE thẳng SQLite).

---

## 5. TEST & CỔNG XANH

### 5.1 Lệnh chuẩn (chạy sau MỌI thay đổi)

```powershell
npx tsc --noEmit                     # hoặc: npm run typecheck
npm run lint                         # eslint
npm run test:regression              # CỔNG HỒI QUY — tự suy danh sách từ tests/
npm run test:workflow                # E2E luồng nghiệp vụ
npm run audit:tests                  # kiểm kê sức khoẻ bộ test (chạy tay, vài phút)
npm run verify:fingerprint           # vân tay SSOT vs mã nguồn
npm run verify:master-baseline       # hợp đồng master baseline
npm run verify:css-baseline          # kiểm định CSS (có KNOWN_DEAD_CANONICAL)
npm run verify:release               # kiểm định phát hành đầy đủ (thêm --strict-package khi đóng gói)
npm run verify:migrations            # preflight migration Postgres
npm test                             # lint + typecheck + test:regression + test:workflow
node tools/verify-all.mjs            # GỘP: css-comment-guard + tsc + contract + regression + css-baseline
node tools/verify-all.mjs --quick    # như trên nhưng BỎ tsc
node tools/verify-ui-build-applied.mjs --port=8787   # bản chạy có mới hơn mã nguồn không (§4.2)
```

Java:

```powershell
Set-Location java-backend
& $mvn -pl web -am test              # test H2 của module web
```

> ⛔ **`test:regression` PHẢI chạy qua `scripts/regression-suite.mjs`** (script gọi `node --import tsx --test …`). Bỏ `--import tsx` thì mọi tệp import `.tsx` chết với `ERR_UNKNOWN_FILE_EXTENSION` ⇒ **báo đỏ GIẢ** (đã dính 1 lần ở vòng 193).

### 5.2 Bộ test hiện có (ĐO ĐƯỢC 09/10/2026)

| Bộ test | Quy mô đo được | Cách kiểm |
|---|---|---|
| `tests/` (tổng) | **167 tệp**; **162 tệp** khớp mẫu cổng `.test.{mjs,ts,tsx,js,cjs,mts,cts}` | `(Get-ChildItem tests -File).Count` |
| `test:regression` | **154 tệp phải xanh** = 162 − **8 tệp `KNOWN_RED`** | `Get-Content scripts/regression-suite.mjs` → `KNOWN_RED` |
| `test:workflow` | `tests/workflow-direct.test.ts` (E2E) | `npm run test:workflow` |
| Java `web/src/test` | **34 tệp `.java`** (toàn `java-backend`: **44** tệp `*Test.java`, **160** annotation `@Test`) | `(Get-ChildItem java-backend/web/src/test -Recurse -File -Filter *.java).Count` |
| Cổng nhỏ trong `tools/` | `probe-*` (bootstrap, work-items, audit-requests, owner-checks, all-roles, schema-drift, …) | chạy `node tools/<tên>.mjs` |

**`KNOWN_RED` — 8 tệp nợ cũ ĐÃ BIẾT (đọc thẳng từ `scripts/regression-suite.mjs`):**

| Tệp | Lý do | Mốc gỡ |
|---|---|---|
| `mt3-be-05-material-alias-search.test.mjs` | 🔴 **NỢ CŨ ĐÓNG BĂNG (MT3)** — ⚠️ **ĐÍNH CHÍNH 09/10**: `lib/material-alias.ts` **CÓ ở CẢ HAI nhánh** ⇒ đỏ vì **thiếu HÀNH VI alias**, ⛔ không phải thiếu tệp | MT3-BE-05 |
| `mt3-ui-04-no-project-block.test.mjs` | thuộc đợt MT3 đã rollback | MT3-UI-04 |
| `mt3-ui-12d-purchasing-hub-tabs.test.mjs` | thuộc đợt MT3 đã rollback | MT3-UI-12d |
| `mt3-ui-13-material-alias.test.mjs` | thuộc đợt MT3 đã rollback | MT3-UI-13 |
| `mt3-ui-14-admin-notification.test.mjs` | modal thông báo thiếu ô tìm/lọc + danh sách đã chọn (nhánh MT3 đã rollback) | MT3-UI-14 |
| `mt3-ui-25-all-groups-tabs.test.mjs` | thuộc đợt MT3 đã rollback | MT3-UI-25 |
| `mt3-ui-28-requests-permission.test.mjs` | thuộc đợt MT3 đã rollback | MT3-UI-28 |
| `p2-d4-approval-timeline.test.mjs` | test đỏ mang dấu MT3-B.2 trong TÊN ⇒ không phải hồi quy P2-D4 | P2-D4 |

> 📌 **Luật của cổng**: *nợ cũ thì GHI NHẬN, không xoá; nợ MỚI thì KHÔNG THỂ giấu* — mọi tệp **không** nằm trong `KNOWN_RED` đều **BẮT BUỘC xanh**.
> ⚠️ **Số case (tests/pass/fail) thay đổi mỗi phiên** ⇒ ⛔ đừng chép số cũ để đối chiếu; hãy đọc **dòng tổng kết của lần chạy hiện tại**. Mốc tham chiếu gần nhất ghi ở `docs/54_RUNBOOK_THI_HANH_7_VIEC_CONG_VIEC_20261008.md` §0.

---

## 6. QUY TẮC VÀNG (KHÔNG THỂ THƯƠNG LƯỢNG)

### 6.1 ⛔ CẤM

1. ❌ **Format lại code** (prettier/beautify) bất kỳ tệp nguồn nào trong `ROOT_DIRS` (`app/`, `db/`, `deploy/`, `drizzle/`, `lib/`, `public/`, `scripts/`, `tests/`, `worker/`). Định dạng hiện tại **LÀ contract** (là đầu vào của hàm băm vân tay); format 1 lần ⇒ vỡ **nhiều cổng** cùng lúc.
2. ❌ **Sửa/xoá migration cũ** — chỉ **APPEND**: Drizzle `drizzle/0353_*.sql` trở đi (số kế tiếp sau `migrationHead` **đang là `0352_…identity.sql`**, đọc từ `lib/vntech-identity-data.mjs`) hoặc Flyway `V40+`. Cập nhật `MIGRATION_HEAD` khi thêm.
   > 📌 `drizzle/` hiện có **393 tệp nhưng chỉ 353 mã số**: các tệp `*_identity.sql` là **làm mới vân tay** (không đổi schema) nên được phép trùng mã. Cổng `verify:release` **chỉ cho phép trùng mã với `*_identity.sql`** — hai migration **schema** cùng mã là lỗi thật. ⛔ KHÔNG xoá tệp nào (bộ theo dõi `__mep_migrations` khoá theo **tên đầy đủ**).
3. ❌ **Sửa tay tệp định danh**: `VNTECH_*.txt`, `VNTECH_FINGERPRINT.json`, `MANIFEST_SHA256.txt`, `lib/vntech-identity-data.mjs`, `*identity_refresh*.sql` — chỉ ghi bằng **tool** (§4.3). MANIFEST chỉ tái sinh khi đóng gói.
4. ❌ **Thêm CSS sau marker** `VNTECH_MASTER_BASELINE_CSS_R1_1_1_END` trong `app/globals.css` (marker hiện ở **dòng 129**).
5. ❌ **Đưa secret/PEM/`.key`/`.p12`/`.pfx`/`.jks`/`.keystore` vào source** — `scripts/preflight-source.mjs` quét toàn cây và **chặn build**.
6. ❌ **Tạo tệp `patch*`, `gate*`, `rc*`** ở thư mục gốc hoặc trong `tests/` — `scripts/verify-full-release.mjs` chặn bằng `legacyNamePattern = /(?:^|[-_.])(?:patch\d*|gate\d+|rc\d+)(?:[-_.]|$)/i`.
7. ❌ **Đưa `node_modules/`, `dist/`, `.env`, `.wrangler`, `.local-data/`, `.sites-runtime/`… vào git/gói** — `verify:release --strict-package` chặn.
8. ❌ **Dừng tiến trình theo TÊN** (`Stop-Process -Name node`, `taskkill /IM java.exe`) — xem **§3.0**: phải dừng **đúng PID theo cổng**.

### 6.2 ✅ NÊN

- ✅ Thêm logic nghiệp vụ trong `scripts/system-route.mjs` — **giữ nguyên kiểu if-chain hiện có**, ⛔ không tách tệp làm phá vân tay.
- ✅ Thêm UI trong `app/page.tsx` / `app/screens/*` và **tái dùng class CSS có sẵn** (`nav-glyph-*`, `density-*`, `boq-row-*`), tái dùng 7 component ở `app/components/ui/`.
- ✅ Thêm bảng/cột: **cả hai dòng migration** (MySQL Flyway **và** SQLite Drizzle) theo quy tắc **additive**.
- ✅ Chạy **đủ cổng §5.1** sau mỗi thay đổi; đổi mã nguồn thì chạy **chuỗi §4** trước khi báo «xong».
- ✅ Commit **thông điệp rõ ràng** (xem phong cách commit `#123` / `3cfbd75`), mỗi việc nhỏ một commit.

### 6.3 ⛔ BỐN LUẬT BỔ SUNG (bài học trả giá thật)

**① ⛔ KHÔNG commit / push khi chưa được phép.**
Mặc định = **không commit, không push, không force-push**. Chỉ commit/push khi **người dùng chủ động cho phép rõ ràng** (luật đã chốt 08/10/2026, ghi ở `docs/37` mục A7). Trước khi làm bất cứ điều gì ghi vào git: `git status` — thấy thay đổi lạ của phiên khác thì **DỪNG và hỏi**, ⛔ không `git reset/checkout/clean` để «dọn».

**② ⛔ KHÔNG sửa tệp migration của phiên khác.**
Nhiều phiên chạy song song trên cùng cây nguồn. Migration là **sổ cái append-only** dùng chung: sửa/xoá/đổi tên tệp của phiên khác ⇒ mất một lần áp cho CSDL đang chạy (`__mep_migrations` khoá theo tên đầy đủ) ⇒ sai lệch schema âm thầm. Muốn thay đổi schema ⇒ **tạo mã số MỚI** của mình.
⚠️ Trước khi thêm migration mới, **chạy** `node tools/check-migration-idempotency.mjs` — công cụ này sinh ra để chặn tái phát `BUG-20261008-011` (một migration `ALTER TABLE … ADD COLUMN` chạy trên CSDL **đã có cột đó** ⇒ rebuild đỏ).

**③ ⛔ KHÔNG đổi NGỮ NGHĨA hàm `blank(...)` trong `BootstrapDataAdapter.java` — đó là CƠ CHẾ AN NINH.**
- Vị trí: `java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/BootstrapDataAdapter.java`
  · định nghĩa **dòng 2124**: `private static void blank(Map<String, Object> data, String... keys) { for (String key : keys) data.put(key, List.of()); }`
  · **10 điểm gọi** (dòng 1856, 1864, 1885, 1889, 1899, 1907, 1912, 1917, 1924, 1988).
- Nó **GHI ĐÈ VÔ ĐIỀU KIỆN**: xoá-trắng dữ liệu theo **cấp bậc/quyền** của người xem. Ví dụ đã trả giá thật (`MT2-P4-02`): điều kiện `anyModule(...)` **có** kiểm `"approvals"` nhưng danh sách `blank(...)` **thiếu** `"approvals"`/`"approvalOverdue"` ⇒ người dùng **không có quyền duyệt vẫn nhận nguyên dữ liệu card «phiếu chờ duyệt»** = **rò dữ liệu**. Cách vá đúng là **đưa thêm khoá vào chính `blank(...)`**, ⛔ không dựng cơ chế song song.
- ⇒ **Muốn thêm dữ liệu cho non-admin thì NẠP SAU lệnh `blank(...)`** (⬅ sau khi vùng đó đã bị xoá-trắng), ⛔ **tuyệt đối không** đổi `blank` thành «chỉ điền khi thiếu» / «chỉ xoá khi rỗng».
- ⚠️ Ngoài ra **24 chỗ** trong cùng tệp chỉ gửi dữ liệu khi `admin === true` (`if (admin)` / `admin ?`) ⇒ thêm khoá mới cho người **không phải admin** phải rà **cả hai** cơ chế.
- 🧪 Cổng canh: `tests/RequestOverdueReasonTest` (`MT2-P4-02`) khoá chặt ngữ nghĩa này — sửa sai là **ĐỎ test an ninh**.

**④ ⛔ KHÔNG dùng script dò ngoặc để dời khối mã.**
Kiểu «đếm `{`/`}` rồi cắt/dán khối» (hoặc regex đa dòng) để **di chuyển code trong `app/page.tsx`, `app/screens/*`, `scripts/system-route.mjs`** đã gây hỏng cấu trúc và làm lệch vân tay ngoài ý muốn. Cách đúng: sửa **thủ công, từng khối nhỏ**, có `npx tsc --noEmit` + **chuỗi §4** ngay sau mỗi khối. Nếu buộc phải tự động hoá, hãy dùng công cụ **phân tích cú pháp AST có sẵn trong repo** (`tools/boc-cau-truc-jsx-ast.mjs`) chứ ⛔ không tự viết bộ đếm ngoặc.

### 6.4 Nếu cần refactor kiến trúc (tách monolith)
Đây là **quyết định chiến lược** → xem `docs/04_KE_HOACH_PHAT_TRIEN.md`. Refactor phải là **một vòng phát hành riêng**: đổi source → tính vân tay mới (§4) → refresh identity SSOT đúng quy trình → migration mới → kiểm **toàn bộ** danh sách tệp khớp.
⚠️ Ghi nhớ: một số phép kiểm nội dung **đọc hợp nhất** nhiều tệp giao diện (`CLIENT_SOURCE_FILES` trong `scripts/preflight-source.mjs`: `app/page.tsx`, `lib/ui-shared.tsx`, `lib/menu-helpers.ts`, `lib/request-actions.ts`, `lib/workflow-helpers.ts`, `lib/permissions.ts`, `app/screens/BoqControl.tsx`, `app/screens/WorkCenter.tsx`, `app/screens/RequestDrawer.tsx`) — tách tệp **không** được làm mất các literal mà cổng yêu cầu.

---

## 7. BẢN ĐỒ SỬA TÍNH NĂNG (LUỒNG REQUEST)

```
UI (app/page.tsx · app/screens/*)  --POST {action,...}-->  app/api/system/route.ts
   → bind env globalThis.__MEP_LOCAL_ENV__
   → scripts/system-route.mjs (handleAction)
        → loadEnv → currentUser → requireActionModule → handler
   ───hoặc───  Java: web/SystemController.java → RbacService → UseCase → Port → Adapter → MySQL
```

| Bạn muốn làm | Sửa ở đâu |
|---|---|
| Thêm action backend JS | `scripts/system-route.mjs`: thêm nhánh `case` + khai `ACTION_MODULE` / `ACTION_CAPABILITY` |
| Thêm action backend Java | `java-backend/web/.../controller/SystemController.java` (nhánh `case`) + UseCase + port + adapter + đăng ký RBAC |
| Thêm màn hình UI | `app/screens/*.tsx` (hoặc `app/page.tsx`): module key + nhánh render + tái dùng `app/components/ui/*` |
| Thêm bảng/cột | Migration mới: Drizzle **append** `0353+` **và** Flyway `V40+`; cập nhật `MIGRATION_HEAD` |
| Thêm export file | `lib/request-export.ts`, `lib/boq-export.ts`, `lib/tabular-export.ts` |
| Cấu hình form động | `lib/form-fields.ts` + bảng `form_field_config` |
| Thêm probe/kiểm tra | `tools/probe-*.mjs` (xem §8) |
| Sửa dữ liệu bootstrap theo quyền | `BootstrapDataAdapter.java` — ⛔ đọc **§6.3 ③** TRƯỚC KHI SỬA |

---

## 8. CÔNG CỤ CHẨN ĐOÁN TRONG `tools/`

> Tất cả tên dưới đây **có thật** trong `tools/` (347 tệp). Cột «Chạy» ghi đúng cú pháp đọc từ chính tệp đó.

| Công cụ | Mục đích (1 dòng) | Chạy |
|---|---|---|
| `fixpoint-fingerprint.mjs` | Chốt vân tay nguồn tới điểm bất động, ghi 2 tệp SSOT | `node tools/fixpoint-fingerprint.mjs` |
| `verify-ui-build-applied.mjs` | Cổng: bản `:8787`/`:9000` có mới & khớp vân tay & đúng byte không | `node tools/verify-ui-build-applied.mjs --port=8787` |
| `_sync-identity-once.mjs` | Ghi 4 trường vân tay vào SQLite cục bộ (DROP/CREATE trigger) | `node tools/_sync-identity-once.mjs <short> <full> <brand> <release>` |
| `set-local-identity.mjs` | Đồng bộ hàng định danh SQLite cục bộ (đo TRƯỚC/SAU) | `node tools/set-local-identity.mjs` |
| `gd-cycle.mjs` | Chu kỳ GĐ: migration → build → fixpoint → artifact | `node tools/gd-cycle.mjs "<NHÃN>"` |
| `verify-all.mjs` | Gộp 4 cổng + cổng chặn CSS vào 1 lệnh, in bảng tổng kết | `node tools/verify-all.mjs` |
| `probe-live-stack.mjs` | Smoke test chuỗi sống: proxy `:9000` → Node SSR → Java `:18081` → MySQL | `node tools/probe-live-stack.mjs` |
| `probe-warehouse-api.mjs` | Đo hợp đồng API kho (`save_warehouse`, `set_warehouse_status`) | `node tools/probe-warehouse-api.mjs [base]` |
| `probe-grant-1-perm-e2e.mjs` | E2E: cấp 1 quyền qua modal → đăng nhập tài khoản đó → vào Quản lý hệ thống | `node tools/probe-grant-1-perm-e2e.mjs [base]` |
| `check-migration-idempotency.mjs` | Dò migration **sắp chạy** mà không idempotent (chặn tái phát `BUG-20261008-011`) | `node tools/check-migration-idempotency.mjs` |
| `probe-schema-drift.mjs` | Lệch giữa tệp migration `V*.sql` và DB đang chạy (`INFORMATION_SCHEMA`) | `node tools/probe-schema-drift.mjs` |
| `probe-java-sql-live.mjs` | Đối chiếu SQL trong mã Java với lược đồ MySQL **đang chạy** | `node tools/probe-java-sql-live.mjs` |
| `probe-java-sql-schema.mjs` | Đối chiếu SQL trong mã Java với lược đồ dựng từ **tệp migration** | `node tools/probe-java-sql-schema.mjs` |
| `probe-bootstrap-keys.mjs` | Quét khoá bootstrap: UI đọc `data.<khoá>` nào mà backend KHÔNG trả | `node tools/probe-bootstrap-keys.mjs` |
| `dump-bootstrap-keys.mjs` | Liệt kê mọi khoá top-level của bootstrap + số dòng | `node tools/dump-bootstrap-keys.mjs` |
| `probe-action-parity.mjs` | Sai lệch action giữa bản JS tham chiếu và bản Java đã port | `node tools/probe-action-parity.mjs` |
| `audit-java-only-actions.mjs` | Kiểm 12 action JAVA-ONLY có bị «mặc định từ chối» oan không | `node tools/audit-java-only-actions.mjs` |
| `probe-security-rbac.mjs` | Kiểm chứng RBAC ở tầng action (đo chính xác, không phân loại thô) | `node tools/probe-security-rbac.mjs` |
| `probe-nonadmin-access.mjs` | Đo hậu quả khi `module_catalog`/`organization_units` **rỗng** với non-admin | `node tools/probe-nonadmin-access.mjs` |
| `probe-ui-adoption.mjs` | Đo **mức độ áp dụng thật** của thư viện UI dùng chung (U-14…U-17) | `node tools/probe-ui-adoption.mjs` |
| `probe-purchasing-flow.mjs` | Chạy trọn luồng mua hàng bằng **đúng tài khoản từng vai trò** | `node tools/probe-purchasing-flow.mjs` |
| `probe-visual-regression.mjs` | Cổng chặn hồi quy thị giác (GĐ0) | `node tools/probe-visual-regression.mjs` |
| `probe-css-budget.mjs` | Cổng chặn nợ CSS (ngân sách CSS) | `node tools/probe-css-budget.mjs` |
| `css-comment-guard.mjs` | Chặn ghi chú `//` trong CSS (chạy đầu tiên trong `verify-all`) | `node tools/css-comment-guard.mjs` |
| `don-css-chet.mjs` | Dọn CSS chết (KP #89/#96 + lớp chết do cổng CSS phát hiện) | `node tools/don-css-chet.mjs` |
| `probe-gate-truth.mjs` | Đo quyền của 4 nút trên trình duyệt THẬT (admin) | `node tools/probe-gate-truth.mjs` |
| `deploy-java-backend.mjs` | Triển khai backend Java an toàn (**mặc định chỉ chạy thử**) | `node tools/deploy-java-backend.mjs` |
| `verify-java-compile.ps1` | Compile-verify `java-backend` khi Maven bị chặn ghi `C:\Users\PC\.m2` | `powershell -File tools/verify-java-compile.ps1` |
| `boc-cau-truc-jsx-ast.mjs` | Bóc cấu trúc JSX bằng **AST** (dùng thay cho script dò ngoặc — §6.3 ④) | `node tools/boc-cau-truc-jsx-ast.mjs` |
| `refresh-phase-identity.mjs` | Khuôn `migrate-head`: append khối identity vào migration head đã có + cập nhật 5 tệp định danh | `node tools/refresh-phase-identity.mjs <head.sql> "<NHÃN>"` |

⚠️ Nhiều probe cần **hệ thống đang chạy** và nhận `[base]` (mặc định `http://127.0.0.1:9000`) — đọc 20 dòng đầu của tệp để biết tham số. ⛔ **Không dán mật khẩu/tài khoản vào tài liệu hay commit**: các probe có giá trị mặc định trong mã, ⛔ đừng chép ra ngoài.

---

## 9. DEBUG NHANH

| Triệu chứng | Nguyên nhân hay gặp | Xử lý |
|---|---|---|
| `Dau van tay san pham VNTECH khong hop le hoac da bi thay doi.` khi chạy `local-server.mjs` | Vân tay trong `.local-data/warehouse.sqlite` khác SSOT | Chạy **BƯỚC 1 → 3** của §4 (`fixpoint-fingerprint` → `npm run build` → `_sync-identity-once`) |
| Cổng `verify-ui-build-applied` báo **`✗ do-moi`** (`dist/ CŨ HƠN nguồn`) | `:8787` phục vụ **bản build tĩnh**, chưa `npm run build` / chưa chạy lại | §4 BƯỚC 2 + BƯỚC 4 |
| Sửa `.tsx`/`.css` mà **trình duyệt không đổi** | `:8787` **không có HMR** | `npm run build` rồi khởi động lại `:8787` (⛔ đừng kết luận «sửa không ăn») |
| `✗ van-tay` — HTML mang vân tay CŨ | Build lại chưa xong / chưa chạy lại `:8787` | §4 BƯỚC 2 → 4; vẫn lệch ⇒ làm lại BƯỚC 1 |
| Proxy `:9000` trả **502** | Java API `:18081` đã chết (thường do chạy bằng `Start-Process` rồi đóng phiên) | `node tools/probe-live-stack.mjs`; khởi động lại jar trong **cửa sổ riêng** |
| `Unable to rename jar` khi `mvn package` | Java đang chạy giữ tệp jar | Dừng **đúng PID `:18081`** (§3.0) rồi build lại |
| `mvn package` fail `AccessDenied … .m2` | Local repo đặt sai chỗ | Dùng `_m2-repo` + `java-backend/.mvn/maven.config` (§3.3a) |
| Cổng `verify:fingerprint` FAIL | Vừa sửa tệp nguồn trong `ROOT_DIRS` | Khi **đang dev**: chấp nhận được miễn test xanh; khi **đóng gói**: chạy §4 để refresh identity |
| `spawn EFTYPE` khi dev | Native binary chưa cài đúng | `npm install` lại trong workspace (bản cài FULL W2); nếu vẫn lỗi ⇒ **cần xác minh** trên máy này |
| `GET /api/system` trả 500 | CSDL cục bộ chưa migrate | Chạy lại `node scripts/local-server.mjs` (tự khởi tạo `.local-data/warehouse.sqlite`); với Postgres: `npm run verify:migrations` trước |
| Màn hình ghi **ĐANG PHÁT TRIỂN** | Module nằm trong `DEVELOPMENT_MODULES` (vd `material_norms`) | **Không phải lỗi** — đúng thiết kế |
| `:8787` hoặc `:9000` không phản hồi | Cổng có thể đã chết (⚠️ **kiểm cổng TRƯỚC**, ⛔ đừng kết luận «giao diện hỏng») | §1.1 — đo lại 4 cổng rồi mới chẩn đoán tiếp |
| Cổng `verify-ui-build-applied` in `Assertion failed: … uv async.c` | Rác teardown của Node trên Windows | ⛔ Không phải lỗi cổng — đọc **3 dấu ✓/✗** + dòng `KET LUAN` |

---

## 10. CHECKLIST DEV MỚI (3 NGÀY)

- [ ] Đọc `docs/01_BAO_CAO_PHAN_TICH_DU_AN.md`, `docs/04_KE_HOACH_PHAT_TRIEN.md`, `docs/32`, `docs/33`.
- [ ] `npm install` + `npm run dev`; đọc §1 và **đo lại 4 cổng** (§1.1) trước khi kết luận bất cứ điều gì.
- [ ] Cài môi trường Java: JDK 26 + `_m2-repo` + `java-backend/.mvn/maven.config` (§3.3a).
- [ ] Chạy `npm test` một lượt — hiểu vùng phủ; đọc `scripts/regression-suite.mjs` để hiểu `KNOWN_RED`.
- [ ] Lướt 5 màn: Dashboard, Requests (Phiếu đề nghị), Purchasing, Inventory/Kho, Material Catalog.
- [ ] Đọc `scripts/preflight-source.mjs` — hiểu **vì sao không được format code** (§6.1①).
- [ ] Đọc **§4** và **chạy thử trọn chuỗi** một lần trên một thay đổi nhỏ (tốt nhất là thay đổi trong `docs/` — **không** đổi vân tay) để quen tay.
- [ ] Đọc **§6.3** (4 luật bổ sung) — đặc biệt **`blank(...)` là cơ chế an ninh**.
- [ ] Đọc bộ runbook Java: `docs/29_RUNBOOK_BUILD_VA_CHAY_JAVA_BACKEND.md`, `docs/11_RUNBOOK_VAN_HANH_BACKEND_JAVA.md`.
- [ ] Hỏi trước khi chạm: `app/globals.css`, `db/schema.ts`, `drizzle/`, các tệp định danh, `BootstrapDataAdapter.java`.
- [ ] ⛔ Nhớ: **không commit/push khi chưa được phép**; **không sửa migration của phiên khác**; **không kill tiến trình theo tên**.

---
*Tài liệu thuộc bộ tài liệu bàn giao hệ thống VNTECH ERP V5.3.0 — cập nhật 09/10/2026. Mọi số liệu trong tài liệu đều kèm LỆNH KIỂM; chỗ chưa kiểm chứng được ghi rõ «cần xác minh».*

---

## 🧊🛑 8 TỆP `KNOWN_RED` = **NỢ CŨ ĐÓNG BĂNG (MT3)** — `DEC-20261008-015` (user chốt 09/10/2026)

> **Nguyên văn user**: «**MT3 đã rollback không lấy MT3 làm căn cứ cho công việc sắp tới nữa**» ✓

| ⭐ | ⭐ |
|---|---|
| **Ý NGHĨA** | 8 tệp đỏ trong `KNOWN_RED` **⛔ KHÔNG phải việc cần làm** và ⛔ **KHÔNG là căn cứ** cho công việc sắp tới ✓ |
| **VÌ SAO VẪN GIỮ TRONG DANH SÁCH** | ⭐ để cổng ⛔ **không giấu NỢ MỚI**: mọi tệp **không** nằm trong `KNOWN_RED` đều **BẮT BUỘC xanh** ✓ |
| **SỐ ĐO (09/10/2026)** | `KNOWN_RED = 8` · `allTests = 162` · `gateTests = 154` (⭐ chạy lại được: `node -e "import('./scripts/regression-suite.mjs').then(m=>console.log(m.KNOWN_RED.length,m.gateTests().length))"`) |
| **7/8 TỆP ĐỎ VÌ GÌ** | ⭐ **KỲ VỌNG ĐẶC TẢ MT3** (đo bằng `node --import tsx --test tests/<tệp>`): «phải dùng **CƠ CHẾ DÙNG CHUNG** §14» · «modal thông báo phải giữ **13 tab**, đang có 14» · «nhóm `warehouse` chỉ 1 mục ⇒ **KHÔNG được bật tab**» · «**MT3 §B.2**: bình luận ⛔ không được hiện trực tiếp trên tiến trình» ⇒ ⛔ **không phải lỗi sản phẩm hiện tại** ✓ |
| **⚠️ ĐÍNH CHÍNH** | Lý do cũ ghi cho `mt3-be-05` («`lib/material-alias.ts` **chỉ tồn tại ở nhánh MT3**») là **SAI** — ⭐ **đo lại: tệp CÓ ở CẢ HAI nhánh** ⇒ đã sửa trong `scripts/regression-suite.mjs` ✓ |
| **⛔ CẤM** | Vin vào «khôi phục MT3» — 📏 `git log unity..backup/mt3-head-20260928` = **0 commit** · `git diff --shortstat unity...<nhánh>` = **rỗng** ⇒ khôi phục = ⛔ **không đổi gì** ✓ |
| **NẾU CẦN LẠI HÀNH VI ĐÓ** | ⭐ làm như **TÍNH NĂNG MỚI** theo yêu cầu nghiệp vụ, ⛔ đừng gọi là «khôi phục MT3» ✓ |
