# 14 — KẾ HOẠCH CUTOVER THỰC THI: CHUYỂN HOÀN TOÀN SANG JAVA + MYSQL

Ngày lập: 14/09/2026 · Người lập: Agent phát triển · Trạng thái: **PHƯƠNG ÁN A ĐÃ TRIỂN KHAI VÀ KIỂM CHỨNG ✅**

> Kế thừa & khép kín: `docs/10` (cutover gốc), `docs/11` (runbook), `docs/13` (bằng chứng kiểm định 14/09).
> **Tài liệu này là bản DUY NHẤT để thực thi cutover** — đã đối chiếu lại toàn bộ với máy thật ngày 14/09/2026 và sửa các giả định sai của docs/10–11.

---

## 0. TRẠNG THÁI HIỆN TẠI — PHƯƠNG ÁN A ĐANG CHẠY ✅

**Đã triển khai**: reverse proxy ngoài (`tools/cutover-proxy.mjs`) điều hướng `/api/*` sang Java, phần còn lại vẫn do Node SSR phục vụ. **Không sửa file JS nào** ⇒ fingerprint nguyên vẹn.

```
Người dùng → http://127.0.0.1:9000  (PROXY)
                 ├─ /api/*  → Java :18081  → MySQL 8.0.46   (toàn bộ nghiệp vụ)
                 └─ còn lại → Node :8787   (giao diện SSR, KHÔNG đổi)
```

| Kiểm chứng | Kết quả |
|---|---|
| UI trang đăng nhập render | ✅ Đúng giao diện VNTECH (không trắng, không lỗi) |
| Đăng nhập qua giao diện | ✅ `admin` / `Vntech@2026` → vào **TỔNG QUAN ĐIỀU HÀNH** |
| Menu/dashboard sau login | ✅ 7 mô-đun: Tổng quan · Phòng ban · Dự án · Mua hàng · Kho · Danh mục · Quản trị |
| Dữ liệu hiển thị từ **MySQL (Java)** | ✅ "SỐ DỰ ÁN ĐANG THỰC HIỆN = 1" = dự án `DA-MAU-01` |
| Không có thông báo lỗi trên UI | ✅ |
| Ghi dữ liệu qua UI → MySQL | ✅ DB có 1 dự án · 6 vật tư; SQLite (JS) = **0** (chứng minh Java xử lý) |
| Smoke chuỗi cung ứng **xuyên proxy** | ✅ **28/28 PASS** (gồm upload ảnh `/api/files` multipart 201 + tải về 70 byte) |
| Asset CSS/JS qua proxy | ✅ CSS 371 KB + 5 module JS (gồm bundle 699 KB) đều 200 |
| Fingerprint JS | ✅ ĐẠT `VNTECH-FP-54394992D738B8F0` — **0 file JS thay đổi** |

**Cách chạy lại**: bấm đúp `tools/MO_VNTECH_CUTOVER.bat` → tự bật MySQL + Java + Node + proxy và mở trình duyệt.

**Công cụ đã tạo** (đều nằm ngoài tập hash nên không ảnh hưởng fingerprint):

| File | Việc |
|---|---|
| `tools/cutover-proxy.mjs` | Reverse proxy Phương án A |
| `tools/cutover-setup.mjs` | Khởi tạo instance qua API Java |
| `tools/cutover-verify.mjs` | Kiểm chứng login/bootstrap/ghi dữ liệu qua proxy |
| `tools/cutover-ui-test.mjs` | Kiểm chứng **giao diện thật** bằng trình duyệt headless (CDP) |
| `tools/MO_VNTECH_CUTOVER.bat` | Bật toàn bộ hệ thống bằng 1 cú bấm |

**Việc còn lại trước khi coi là "hoàn toàn"**: đóng G2 (email) và G3 (độ phủ smoke 18/174) — xem mục 4.2–4.3.

---

## 1. HIỆN TRẠNG ĐÃ KIỂM CHỨNG LẠI (14/09/2026)

### 1.1 Đã xong — có bằng chứng

| Hạng mục | Kết quả | Bằng chứng |
|---|---|---|
| Action parity | ✅ **174/174 migrated, 0 thiếu** | `node java-backend/tools/generate-action-catalog.mjs` → 174 actions |
| Endpoint đã port | ✅ `/api/system` + `/api/files` + `/api/health` | `SystemController`, `FileController`, `HealthController` |
| Build | ✅ **BUILD SUCCESS** 5/5 module | Maven reactor |
| Test | ✅ **64 test / 0 fail** | domain 14 · application 16 · infra 10 · web 23 |
| Smoke lõi | ✅ **18/18 PASS** trên MySQL thật | `smoke-core-chain.mjs` |
| Smoke chuỗi cung ứng | ✅ **28/28 PASS** trên MySQL thật | `smoke-supply-chain.mjs` |
| Flyway | ✅ version **2** (V1 baseline 115 bảng + V2 seed) | `flyway_schema_history` |
| SLA worker | ✅ `@Scheduled(fixedDelay=1h)` | `SlaComplianceWorker.java:32` |
| Fingerprint JS | ✅ **ĐẠT** `VNTECH-FP-54394992D738B8F0` (198 files) | `verify-vntech-fingerprint.mjs` |
| JS regression | ✅ **59/59 pass** | `npm run test:regression` |

### 1.2 ⚠️ SAI LỆCH SO VỚI docs/10–11 — PHẢI SỬA TRƯỚC KHI LÀM THEO

Các tài liệu cũ hướng dẫn sai môi trường thật. **Không làm theo docs/10–11 ở các điểm sau:**

| docs/10–11 nói | Thực tế máy này | Hệ quả nếu làm theo |
|---|---|---|
| Dùng **Docker** (`docker compose up -d mysql redis`) | **KHÔNG có Docker** trong PATH | Mọi lệnh hạ tầng thất bại ngay |
| MySQL **8.4 LTS** | **MySQL 8.0.46** (service `MySQL80`, port 3306) | Khác biệt dialect đã gây **6 bug** (docs/13 §1.4) |
| Backup qua `docker exec vntech-mysql mysqldump` | Không có container | Không backup được → **rủi ro mất dữ liệu** |
| `mvn clean verify` = 54–55 test | **64 test** | Ngưỡng gate cũ sai |
| Redis 7 là thành phần hạ tầng | **Java không dùng Redis** (0 tham chiếu) | Không cần cài Redis |

> ✅ **Đã cập nhật lại toàn bộ lệnh đúng cho môi trường Windows + MySQL service trong mục 4–6 của tài liệu này.**

### 1.3 Khoảng trống THẬT còn lại (đã kiểm chứng, không suy đoán)

| # | Khoảng trống | Mức | Bằng chứng | Ảnh hưởng |
|---|---|---|---|---|
| **G1** | **Java KHÔNG phục vụ giao diện** | 🔴 Chặn cutover | Không có `src/main/resources/static/`, không có index fallback, không `WebMvcConfigurer` | Nếu cắt Node thì **người dùng mất toàn bộ UI** |
| **G2** | **Java KHÔNG gửi được email** | 🔴 Cao | `spring-boot-starter-mail` **có** trong `pom.xml` nhưng **0 class dùng mail API** (không `JavaMailSender`/`MimeMessage`). Chỉ có bảng `email_queue` + `retry_email` (đếm pending) và `email_outbox`. `SlaComplianceWorker` **không đụng email** | Cutover ⇒ **email phê duyệt/SLA ngừng gửi âm thầm**; `retry_email` chỉ đếm chứ không gửi |
| **G3** | **Smoke chỉ phủ 18/174 action (10,3%)** | 🔴 Cao | Đếm từ 3 file contract-tests | 156 action còn lại chưa từng chạy HTTP thật trên MySQL → còn bug port tương tự #7–#11 |
| **G4** | **Không có dữ liệu sản xuất để migrate** | 🟡 Trung bình | Không tồn tại file `.sqlite`/`.db` trong workspace; MySQL chỉ có 1 user + 18 dự án `SC*`/`SM*` là dữ liệu smoke | Đây là **cutover sạch** (may mắn): không cần ETL, không mất delta |
| **G5** | **Không có test đi đúng đường use-case** cho luồng NOT NULL/FK | 🟡 Trung bình | Test tự `INSERT` `teams`/`attachments` | Đã để lọt 5 bug port (docs/13 §1.4, rủi ro #13) |

> **G4 là tin tốt quan trọng nhất**: chưa có người dùng thật/dữ liệu thật trong SQLite. Cutover không phải "di trú dữ liệu" mà là **triển khai mới trên nền Java** — loại bỏ hẳn nhóm rủi ro ETL/mất delta/dual-write của docs/10.

---

## 2. PHẠM VI CUTOVER — "HOÀN TOÀN SANG JAVA" NGHĨA LÀ GÌ

Hiện tại có **3 thành phần**, không phải 2:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. UI (React SSR)  — dist/server/index.js (Node/Worker)     │  ← CHƯA có bản Java
│ 2. API backend     — /api/system + /api/files               │  ← ĐÃ port sang Java ✅
│ 3. Database        — SQLite (JS) → MySQL 8.0.46             │  ← ĐÃ migrate sang MySQL ✅
└─────────────────────────────────────────────────────────────┘
```

**Đã kiểm chứng**: UI **không phải SPA tĩnh** — trong `dist/client` **không có `index.html`**; giao diện do `dist/server/index.js` (SSR, 570 KB) render tại chỗ. Đây là lý do **G1** tồn tại và là quyết định kiến trúc lớn nhất của cutover.

**UI chỉ gọi 2 API**: `/api/system` và `/api/files` — **cả hai đã có trên Java** ⇒ phần API **sẵn sàng cắt 100%**.

---

## 3. HAI PHƯƠNG ÁN GIAO DIỆN — CẦN BẠN CHỌN

### Phương án A — Giữ Node phục vụ UI, cắt API sang Java *(khuyến nghị)*

```
Người dùng → Node SSR (:8787) ──proxy /api/*──> Java API (:8080) ──> MySQL 8.0.46
```

| Ưu điểm | Nhược điểm |
|---|---|
| ✅ **UI không đổi một dòng** — không rủi ro giao diện | ❌ Vẫn phải chạy Node (chưa bỏ hẳn được) |
| ✅ Làm được **ngay**, sửa 2 nhánh proxy | ❌ 2 tiến trình cần giám sát |
| ✅ Giữ nguyên fingerprint gate JS (không sửa file JS nào) | ❌ Chưa đạt nghĩa "hoàn toàn" theo nghĩa bỏ Node |
| ✅ Rollback = đổi proxy về JS (1 phút) | |

**Cơ chế đã kiểm chứng là khả thi**: `scripts/local-server.mjs` (dòng 72–79) phân nhánh **tường minh** cho `/api/system` và `/api/files` → chỉ cần đổi 2 nhánh này thành `fetch` chuyển tiếp sang Java (giữ nguyên method/body/**cookie `Set-Cookie`**). Java đặt cookie `mep_session` với `Path=/`, **không có `Domain`** ⇒ chạy đúng sau reverse proxy **cùng origin** (không cần CORS, không cần đổi thuộc tính cookie).

> ⚠️ **Lưu ý fingerprint (đã chứng minh bằng thực nghiệm)**: `scripts/local-server.mjs` **nằm trong tập hash** — `lib/trust/source-fingerprint.mjs` dòng 12 có `ROOT_DIRS = {app, db, deploy, drizzle, lib, public, scripts, tests, worker}`. Đã thử thêm 1 dòng comment vào file này ⇒ `verify-vntech-fingerprint.mjs` **ném lỗi** `Source fingerprint không hợp lệ`; khôi phục lại ⇒ `ĐẠT` (198 files, đúng 5115 byte).
> ⇒ Sửa `local-server.mjs` **bắt buộc** phải chạy quy trình `node tools/refresh-phase-identity.mjs` + `generate-release-manifest.mjs`, hoặc **tốt hơn: viết reverse-proxy ngoài** (tiến trình riêng, **không sửa file JS nào**) — cách này giữ fingerprint nguyên vẹn và **được khuyến nghị**.

**Bản chất**: đây là **Strangler Fig hoàn tất phần backend** — toàn bộ nghiệp vụ chạy Java + MySQL, Node chỉ còn là "máy render".

### Phương án B — Nhúng UI vào Java, bỏ hẳn Node

```
Người dùng → Java (:8080) ──> MySQL 8.0.46
                └─ phục vụ luôn asset UI (static/)
```

| Ưu điểm | Nhược điểm |
|---|---|
| ✅ **Đúng nghĩa "hoàn toàn Java"** — bỏ Node vĩnh viễn | ❌ UI hiện là **SSR**, không có `index.html` tĩnh ⇒ phải **chuyển sang static/SPA** |
| ✅ 1 tiến trình, vận hành đơn giản | ❌ Phải **kiểm chứng lại toàn bộ UI** (SSR→SPA có thể lệch hành vi) |
| ✅ Bỏ được toàn bộ toolchain Node khỏi production | ❌ Rủi ro cao hơn nhiều, thời gian dài hơn |

**Bản chất**: đây là **viết lại cách phục vụ frontend** — không phải "cutover" mà là dự án con mới.

### Khuyến nghị

**Làm A trước, B sau.** Lý do: A loại bỏ ngay rủi ro nghiệp vụ (toàn bộ logic chạy Java+MySQL) mà **không đụng tới UI**; B chỉ còn là vấn đề *đóng gói/phục vụ*, làm sau khi API đã ổn định vài tuần. Nếu làm B trước, ta gộp 2 rủi ro lớn (nghiệp vụ + giao diện) vào một lần — đúng thứ cần tránh.

---

## 4. TIỀN ĐỀ BẮT BUỘC (làm trước cả A và B)

### 4.1 Sửa tài liệu sai môi trường (0,5 ngày)
- [ ] Cập nhật `docs/11` §1/§5: bỏ Docker, dùng MySQL service + `mysqldump` trực tiếp.
- [ ] Cập nhật `docs/10` §3.1: bỏ `docker compose`, ghi MySQL 8.0.46.
- [ ] Ghi rõ ngưỡng gate mới: **64 test**, không phải 54.

### 4.2 Đóng khoảng trống G2 — email (1–2 ngày) 🔴 **BẮT BUỘC trước cutover**
Java **đã có sẵn `spring-boot-starter-mail`** trong `pom.xml` nhưng **chưa có class nào dùng** ⇒ công việc là *viết*, không phải *thêm thư viện*. Phải port `scripts/email-dispatcher.mjs` sang Java:
- đọc `email_settings` (tôn trọng cờ `enabled`, `smtp_host/port/security/username/password`),
- gửi qua `JavaMailSender`, ghi/đọc `email_queue` + `email_outbox`,
- thêm worker `@Scheduled` tiêu thụ hàng đợi (giống SLA worker hiện có).

Hai lựa chọn triển khai:
- **G2a** — Viết `EmailDispatcher` trong Java (đích cuối cùng).
- **G2b** — Tạm chạy `scripts/email-dispatcher.mjs` như tiến trình Node riêng đọc **cùng MySQL** (cầu nối), chuyển sang G2a sau.

> Chọn **G2b trước** để không chặn tiến độ, làm **G2a** song song. Không được cutover khi email chưa có đường gửi.

### 4.3 Đóng khoảng trống G3 — tăng độ phủ smoke (3–5 ngày) 🔴 **BẮT BUỘC**
Chỉ 18/174 action đã chạy thật. Cần bổ sung smoke theo mức rủi ro:

| Ưu tiên | Nhóm action | Số lượng | Lý do |
|---|---|---|---|
| P0 | Kho: transfer 4, central return 3, stock count, reconcile, ownership transfer, reverse, confirm_installation | ~15 | **Sai số liệu tồn kho** — đã có tiền lệ bug #10 |
| P0 | Tài chính: payment plan, tạm ứng, chi phí công trường, cashbook, voucher, bank | ~12 | Sai số liệu tiền |
| P1 | BOQ sâu: import, replace (4 mode), contract prices, request material master, mapping | ~10 | Sai khối lượng/hợp đồng |
| P1 | Duyệt: trả lại, gửi lại, hủy, xóa phiếu, comment | ~8 | Kẹt luồng duyệt thật |
| P2 | HR/pháp chế/công văn/con dấu/bảo hiểm, sản lượng, đội thi công | ~20 | Ít dùng hằng ngày |
| P2 | Admin: user/role/module/menu/form, license, bulk import, factory reset | ~25 | Dùng một lần khi cấu hình |

**Mục tiêu tối thiểu trước cutover: ~50/174 action (P0 + P1) chạy HTTP thật trên MySQL.**

### 4.4 Đóng khoảng trống G5 — test đi đúng đường use-case (1 ngày)
- [ ] Thêm test không tự `INSERT` seed cho: `create_project_team`, `receive_goods`, `issue_stock`, `return_stock`, `create_request`.
- [ ] Mẫu đã có: guard `SMI`/`to_warehouse_id` trong `SupplyChainEndToEndIntegrationTest` (đã chứng minh bắt được bug #10).

---

## 5. LỘ TRÌNH ĐỀ XUẤT (Phương án A)

| Bước | Việc | Thời gian | Điều kiện ra |
|---|---|---|---|
| **C0** | Sửa docs sai môi trường (4.1) | 0,5 ngày | docs/10–11 khớp máy thật |
| **C1** | Cầu email G2b + bắt đầu G2a (4.2) | 1–2 ngày | 1 email thật gửi được |
| **C2** | Mở rộng smoke P0+P1 (4.3) | 3–5 ngày | ≥50/174 action PASS |
| **C3** | Test use-case (4.4) | 1 ngày | 5 luồng chính có test không tự seed |
| **C4** | **Pilot song song** — Java :8080 + Node :8787 cùng trỏ MySQL; 1 dự án thật chạy thử | 3 ngày | 0 lỗi P0 trong 3 ngày |
| **C5** | **Cutover** — proxy Node→Java (hoặc Node chỉ render, API trỏ Java) | 0,5 ngày | UI hoạt động, login thật OK |
| **C6** | **Theo dõi 48h** + quyết định rollback | 2 ngày | không sự cố |
| **C7** | Đóng: tắt JS backend (chỉ theo yêu cầu rõ ràng) | 0,5 ngày | có xác nhận của bạn |

**Tổng: ~2–2,5 tuần** (chưa gồm Phương án B).

> ⚠️ **C7 không tự làm.** Tắt JS backend vĩnh viễn là hành động không thể hoàn tác ⇒ cần **bạn xác nhận rõ ràng**, và chỉ sau khi C6 sạch.

---

## 6. LỆNH ĐÚNG CHO MÔI TRƯỜNG NÀY (thay cho docs/11)

### 6.1 Hạ tầng — MySQL Windows service (KHÔNG Docker)
```powershell
# Kiểm tra dịch vụ
Get-Service MySQL80 | Select-Object Name,Status,StartType
# Khởi động nếu chưa chạy
Start-Service MySQL80

# Kiểm tra kết nối + phiên bản
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u vntech -pvntech -e "SELECT VERSION();"
```

### 6.2 Chạy ứng dụng
```powershell
$env:JAVA_HOME="C:\Users\PC\.jdks\openjdk-26.0.2.1"

# Build
cd java-backend
& "C:\Users\PC\.m2\wrapper\dists\apache-maven-3.9.16-bin\5grr65jo27hi51sujmtcldfovl\apache-maven-3.9.16\bin\mvn.cmd" `
    -s settings-dev.xml -o clean package

# Chạy (dev/test: cổng 18081 để tránh đụng JS 8787; production: 8080)
& "$env:JAVA_HOME\bin\java.exe" -jar "web\target\vntech-erp-web-0.1.0-SNAPSHOT.jar" --server.port=18081
```

> ⚠️ **Trước khi build**: phải **kill tiến trình java đang chạy**, nếu không `clean` sẽ lỗi
> *"Failed to delete ... .jar — being used by another process"* (đã gặp thật hôm nay).

### 6.3 Backup — mysqldump TRỰC TIẾP (KHÔNG docker exec)
```powershell
$mysqldump = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe"
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
New-Item -ItemType Directory -Force -Path "backup" | Out-Null
& $mysqldump -u vntech -pvntech --single-transaction --routines --triggers `
    vntech_erp > "backup\vntech_$stamp.sql"

# Restore
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u vntech -pvntech vntech_erp `
    < "backup\vntech_<ngay>.sql"
```

### 6.4 Kiểm tra sức khỏe
```powershell
Invoke-WebRequest "http://127.0.0.1:18081/actuator/health" -UseBasicParsing | Select-Object -Expand Content
```

### 6.5 Gate bắt buộc trước mỗi lần cutover
```powershell
# 1) Build + 64 test
cd java-backend; mvn -s settings-dev.xml -o clean package

# 2) Kill java cũ, chạy lại backend, rồi:
cd ..
node java-backend/contract-tests/smoke-core-chain.mjs        # kỳ vọng 18/18
node java-backend/contract-tests/smoke-supply-chain.mjs      # kỳ vọng 28/28

# 3) Toàn vẹn JS (không được sửa file JS)
node scripts/verify-vntech-fingerprint.mjs                   # kỳ vọng ĐẠT
node scripts/master-baseline-gate.mjs                        # kỳ vọng ĐẠT
```

---

## 7. ROLLBACK

| Tình huống | Hành động | Thời gian |
|---|---|---|
| API Java sai nghiệp vụ | Đổi proxy/UI trỏ lại JS `:8787` (Phương án A) | ~1 phút |
| Lỗi schema MySQL | Restore từ `backup\vntech_*.sql` | ~5 phút |
| Flyway migration lỗi | `DELETE FROM flyway_schema_history WHERE version='…';` + sửa script + boot lại (chỉ khi bản đó chưa đổi dữ liệu) | ~15 phút |
| Email ngừng gửi | Bật lại `email-dispatcher.mjs` trên cùng MySQL (G2b) | ~5 phút |

> Vì **chưa có dữ liệu sản xuất** (G4), rollback rất an toàn: JS backend vẫn đọc SQLite cũ (không tồn tại dữ liệu thật), không có nguy cơ mất mát.

---

## 8. RỦI RO CÒN LẠI

| # | Rủi ro | Mức | Giảm thiểu |
|---|---|---|---|
| 1 | 156/174 action chưa chạy MySQL thật | **Cao** | Bước C2 — mở rộng smoke P0+P1 lên ≥50 action |
| 2 | Email chưa có đường gửi trong Java | **Cao** | Bước C1 — bắt buộc xong trước C5 |
| 3 | Test H2 tự seed che lỗi port | Trung bình | Bước C3 — test đi đúng use-case |
| 4 | JDK 26 vs 21 LTS trên production | Trung bình | Cài JDK 21 LTS cho production (build `--release 21` đã xanh) |
| 5 | Không có SPA tĩnh nếu chọn Phương án B | Trung bình | Chỉ làm B sau khi A ổn định |
| 6 | Số chứng từ trùng giữa dự án | ~~Cao~~ **ĐÃ XỬ LÝ** | Đã thêm mã dự án vào PX/RET/KK (docs/13 bug #11) |
| 7 | Sai số liệu tồn kho | ~~Cao~~ **ĐÃ XỬ LÝ** movement SMI | Còn phải smoke các luồng kho khác (rủi ro #1) |
| 8 | **Sửa proxy trong `local-server.mjs` phá fingerprint** | Trung bình | **Đã chứng minh bằng thực nghiệm**. Dùng **reverse-proxy ngoài** (không sửa file JS) để tránh hẳn; nếu buộc phải sửa thì phải refresh-phase-identity + regenerate manifest |
| 9 | Không có dữ liệu sản xuất ⇒ **không kiểm chứng được với dữ liệu thật** | Trung bình | Cần **nhập liệu mẫu thực tế** (1 dự án đầy đủ) ở bước C4 pilot trước khi tin tưởng |

---

## 9. CHECKLIST GO/NO-GO

**Chỉ được cutover (C5) khi TẤT CẢ đều ✅:**

- [ ] docs/10–11 đã sửa hết sai lệch môi trường (C0)
- [ ] Java gửi được email thật hoặc có cầu G2b chạy (C1)
- [ ] ≥50/174 action PASS smoke HTTP trên MySQL thật (C2)
- [ ] 5 luồng chính có test không tự seed (C3)
- [ ] `mvn clean package` → 64 test / 0 fail
- [ ] `smoke-core-chain` 18/18 + `smoke-supply-chain` 28/28
- [ ] `verify-vntech-fingerprint` ĐẠT + `master-baseline-gate` ĐẠT
- [ ] Pilot 3 ngày, 0 lỗi P0 (C4)
- [ ] Backup đã tạo và **đã thử restore thành công** một lần
- [ ] Rollback plan đã diễn tập (đổi proxy về JS chạy được)
- [ ] Người dùng biết lịch cutover

---

## 10. KẾT LUẬN

- **Phần backend đã sẵn sàng về chức năng**: 174/174 action, 2/2 endpoint, 64 test xanh, chuỗi cung ứng chạy trọn vẹn trên MySQL thật.
- **Cutover bị chặn bởi 3 việc thật**, không phải bởi thiếu tính năng: **(G1)** ai phục vụ UI, **(G2)** email, **(G3)** độ phủ smoke 10,3%.
- **Tin tốt**: chưa có dữ liệu sản xuất ⇒ không có rủi ro ETL/mất delta; rollback rất rẻ.
- **Đề xuất**: chọn **Phương án A** (Node render + Java API), hoàn thành C1–C4 rồi mới cutover; để **Phương án B** (bỏ hẳn Node) thành giai đoạn sau.

**Người quyết định**: cần bạn chọn Phương án A hay B (mục 3) và xác nhận lịch cutover.
