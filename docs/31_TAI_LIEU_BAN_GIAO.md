> **VNTECH ERP — BỘ TÀI LIỆU PHIÊN BẢN `ALPHA TEST`**
> · Phiên bản tài liệu: **`DOC-ALPHA-TEST-2026.10`** · Ngày cập nhật: **08/10/2026** · Phiên soạn: `ERP-SESSION-01`
> · Sản phẩm: `V5.3.0-MASTER-BASELINE-R1.1.1` · Cổng: `:8787` (UI) · `:9000` (cutover) · `:18081` (API Java)
> · ⚠️ Trạng thái: **ALPHA TEST** — tài liệu phản ánh bản ĐANG CHẠY; ⛔ chưa phải bản phát hành chính thức.
> · 📌 Nguồn sự thật: **mã nguồn + CSDL thật** (mọi số liệu đều ĐO được, ⛔ không suy đoán).

# TÀI LIỆU BÀN GIAO HỆ THỐNG — VNTECH ERP V5.3.0

Bản cập nhật: **08/10/2026** (thay bản 23/09/2026) · Nội dung dành cho bên nhận bàn giao (vận hành & bảo trì).

> 🔎 **Cách đọc tài liệu này:** mỗi số liệu đều ghi **nguồn**. Hai nhãn được dùng:
> `[ĐO LẠI 08/10]` = chính lượt soạn tài liệu này chạy/đọc được · `[LOG PHIÊN]` = số do phiên khác ghi trong log repo (có ngày + tệp), lượt này **không chạy lại**. ⛔ Không có số nào được suy đoán.

---

## MỤC LỤC

1. [Thông tin sản phẩm & phiên bản](#1-thông-tin-sản-phẩm--phiên-bản)
2. [Kiến trúc đang vận hành](#2-kiến-trúc-đang-vận-hành)
3. [Tài khoản bàn giao](#3-tài-khoản-bàn-giao)
4. [Quy trình build & triển khai](#4-quy-trình-build--triển-khai)
5. [Bàn giao mã nguồn & git](#5-bàn-giao-mã-nguồn--git)
6. [Cổng kiểm chứng](#6-cổng-kiểm-chứng)
7. [Bất biến CSDL phải giữ](#7-bất-biến-csdl-phải-giữ)
8. [Việc còn tồn & rủi ro đã biết](#8-việc-còn-tồn--rủi-ro-đã-biết)
9. [Vận hành thường nhật](#9-vận-hành-thường-nhật)
10. [Bảo mật](#10-bảo-mật)
11. [Những điểm cần lưu ý khi tiếp nhận](#11-những-điểm-cần-lưu-ý-khi-tiếp-nhận)
12. [Danh mục tài liệu kèm theo](#12-danh-mục-tài-liệu-kèm-theo)

---

## 1. THÔNG TIN SẢN PHẨM & PHIÊN BẢN

| Hạng mục | Giá trị | Nguồn |
|---|---|---|
| Tên sản phẩm | VNTECH ERP V5.3.0 | `VNTECH_FINGERPRINT.json` |
| Gói sản phẩm | `VNTECH_ERP_V5_3_0_MASTER_BASELINE_R1_1_1_PROJECT_NAV_FINAL_FP_FIXED_20260908` | thư mục gốc |
| Build / Release build | `5.3.0-MASTER-BASELINE-R1.1.1-FINAL-20260908` | `VNTECH_FINGERPRINT.json` · `README.md` |
| Product ID | `VNTECH-KHO-MEP-001` | `VNTECH_FINGERPRINT.json` |
| UI contract ID | `VNTECH-UI-V5.3.0-MASTER-BASELINE-R1.1.1-FINAL-20260908` | `lib/vntech-identity-data.mjs` |
| Vân tay nguồn (source fingerprint) | `bb706f12024900770b0cdefd691c0a7c5d775b29fece3153ea5372d7bc424454` — rút gọn `VNTECH-FP-BB706F1202490077` | `[ĐO LẠI 08/10]` `VNTECH_FINGERPRINT.json` + `lib/vntech-identity-data.mjs` khớp nhau |
| Vân tay thương hiệu / phát hành | brand `c6990f5fcb1c57a42f432747c04780c92d7eb186b8012172fff83c90ba6ca994` · release `e41f1239b83d0daa293d6a3e2ac771fc8ecfa07cf705da4b1db1c05490ac0991` | `[ĐO LẠI 08/10]` |
| Chế độ bản quyền | Trust Development Mode — `trustMode: development` · `licenseEnforcement: false` · `privateKeyPresent: false` (chưa enforce license) | `[ĐO LẠI 08/10]` `VNTECH_FINGERPRINT.json` |
| Phạm vi nghiệp vụ | Kho vật tư + M&E (Cơ – Điện): BOQ → chuẩn hóa vật tư → MR → duyệt nhiều bậc → PO → GRN → kho → xuất/trả/lắp đặt → nghiệm thu → thu hồi vốn | kế thừa bản 23/09 |
| Trạng thái phát hành | ⚠️ **ALPHA TEST** — bản ĐANG CHẠY, ⛔ chưa phải bản phát hành chính thức | nhãn đầu tệp |

---

## 2. KIẾN TRÚC ĐANG VẬN HÀNH

Hệ thống chạy **song song hai lõi** (strangler-fig) đi qua **một cổng duy nhất**:

```
Trình duyệt
   → http://127.0.0.1:9000   (cutover proxy: tools/cutover-proxy.mjs)
        ├── UI (React/TS, SPA 1 tệp app/page.tsx)  :8787  (scripts/local-server.mjs — BẢN BUILD TĨNH)
        └── Java backend API                       :18081 (Spring Boot, Clean Architecture
                                                            domain → application → infrastructure → web)
                └── MySQL 8.0.46 :3306 (CSDL vntech_erp, migration bằng Flyway)
```

| Thành phần | Công nghệ / tệp | Cổng | Trạng thái `[ĐO LẠI 08/10]` |
|---|---|---|---|
| Giao diện người dùng | React + TypeScript, SPA 1 tệp `app/page.tsx`, phục vụ **bản build tĩnh** từ `dist/` | **8787** | ✅ HTTP **200** · PID **14028** (LISTENING) |
| Cổng điều phối (cutover) | `tools/cutover-proxy.mjs` — `/api/*` → Java, còn lại → Node UI | **9000** | ✅ HTTP **200** · PID **5584** |
| Backend nghiệp vụ | Java 21 + Spring Boot, Maven đa module (`domain` · `application` · `infrastructure` · `web` · `contract-tests`) | **18081** | ✅ `/actuator/health` **200** `{"status":"UP"}` — component `db` **UP** (MySQL) · PID **20508** |
| CSDL chính | MySQL **8.0.46**, CSDL `vntech_erp`, **134 bảng**, migration Flyway (`java-backend/infrastructure/src/main/resources/db/migration`, **38 tệp `V*.sql`**) | **3306** | ✅ PID **5124** (`mysqld`) |
| CSDL phụ (UI/local runtime) | SQLite `.local-data/warehouse.sqlite` + chuỗi migration Drizzle `drizzle/` (**393 tệp `.sql`**) | — | tồn tại, có `-wal`/`-shm` đang hoạt động |

**Bốn thành phần phải cùng sống:** 3306 (MySQL) · 18081 (Java API) · 8787 (Node UI) · 9000 (proxy).
⇒ Mất **bất kỳ** thành phần nào ⇒ `:9000` hỏng giao diện (proxy trả 502/404).

> ⚠️ **`:8787` là BẢN BUILD TĨNH** (`scripts/local-server.mjs` nạp `dist/server/index.js` **một lần** lúc khởi động, asset phục vụ từ `dist/client`) — **KHÔNG có Vite dev server, KHÔNG có HMR**. Sửa `.tsx`/`.css` trên đĩa **không** lên trình duyệt cho tới khi `npm run build` **và** khởi động lại `:8787` (xem §4).

**Tiến trình đang chạy `[ĐO LẠI 08/10]`:**

| Cổng | PID | Dòng lệnh / ghi chú |
|---|---|---|
| 18081 | 20508 | `java.exe -jar web\target\vntech-erp-web-0.1.0-SNAPSHOT.jar --server.port=18081` · JDK `C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot` · khởi động **08/10/2026 17:12:36** |
| 8787 | 14028 | `node scripts/local-server.mjs` |
| 9000 | 5584 | `node tools/cutover-proxy.mjs --port 9000 --ui-port 8787 --api-port 18081` |
| 3306 | 5124 | `mysqld` (MySQL 8.0.46) |

> ⚠️ **Bắt buộc đủ cờ khi khởi động proxy** (đọc từ mã `tools/cutover-proxy.mjs`): mặc định là `--port 8787` · `--ui-port 8788` · `--api-port 18081` ⇒ thiếu cờ sẽ **`EADDRINUSE`** (cố mở `:8787` đã bị UI chiếm) hoặc trỏ sai UI.

---

## 3. TÀI KHOẢN BÀN GIAO

> ⛔ **Tuyệt đối KHÔNG ghi mật khẩu/token/secret vào tài liệu này.** Mật khẩu do quản trị viên quản lý; mọi tài khoản đều có thể **cấp mới / đặt lại** theo quy trình dưới đây.

### 3.1 Hiện trạng tài khoản trong CSDL `[ĐO LẠI 08/10]`

Đo bằng `SELECT role, COUNT(*), SUM(active=1) FROM users GROUP BY role` trên CSDL `vntech_erp`:

| Vai trò (`role`) | Số tài khoản | Đang hoạt động |
|---|---|---|
| `admin` (quản trị toàn hệ thống) | **1** | 1 |
| `ksda` (kỹ sư/kỹ thuật dự án) | 48 | 47 |
| `da_nv` (nhân viên dự án) | 4 | 3 |
| `thuky` | 3 | 3 |
| `cht` (chỉ huy trưởng) | 3 | 3 |
| `kh_nv` · `thu_kho` · `accountant` · `kh_truong` · `hr` · `director` | 2 mỗi vai trò | 2 |
| `da_truong` · `team` | 1 mỗi vai trò | 1 |
| **TỔNG** | **73** | **28** |

✅ **ĐÃ DỌN 08/10/2026**: 43 tài khoản kiểm thử dạng `probe_*` (do probe E2E tạo) đã được **vô hiệu hoá** (`active=0`) ⇒ số **active 71 → 28**; ⭐ hoàn nguyên được bằng `UPDATE users SET active=1 WHERE username LIKE 'probe\_%'` (xem §8, mục R-5).

### 3.2 Cách cấp / đặt lại tài khoản (⛔ không ghi mật khẩu ở đây)

| Việc | Cách làm |
|---|---|
| Tạo tài khoản mới | Đăng nhập bằng tài khoản `admin` ⇒ màn **Quản lý hệ thống → Người dùng → Thêm tài khoản** |
| Cấp quyền cho tài khoản | Modal **«Phân quyền công việc / Chức năng»** — chọn module + capability (`canView`/`canUse`/`canCreate`/`canEdit`/`canDelete`/`canApprove`) + phạm vi (dự án/kho/đơn vị) |
| Đặt lại mật khẩu | Do `admin` thực hiện trong màn Người dùng (mật khẩu lưu dạng băm PBKDF2 — xem §10) |
| Seed lại dữ liệu demo + tài khoản mẫu | `node "java-backend/tools/seed-demo.mjs" "http://127.0.0.1:9000"` — hướng dẫn: `docs/16_HUONG_DAN_SEED_DEMO_VA_TAI_KHOAN_MO_RA.md` |
| Uỷ nhiệm quản trị cho non-admin | Cấp `admin`/`admin_tab_*` với `can_view = 1` còn hạn ⇒ người uỷ nhiệm thấy dữ liệu **trong phạm vi dự án của mình** (quyết định **U-1**, đã thi hành trong commit `3cfbd75`) |

> ⚠️ **Bài học vận hành (giữ từ bản cũ, còn đúng):** UI monolith có thể "tự ghi đè" mật khẩu admin giữa chừng. Nếu `admin` báo **401**, chạy lại seed ở bảng trên rồi thử lại.
> ⚠️ **`save_user_access` là FULL-REPLACE** (`clearUserScopes()` xoá rồi ghi lại **toàn bộ** `modulePermissions`) ⇒ ⛔ **không bấm thử «Lưu phân công» trên tài khoản thật**; muốn thử phải dùng **tài khoản rác dùng-một-lần** (bài học `BUG-20261008-007`).

---

## 4. QUY TRÌNH BUILD & TRIỂN KHAI

### 4.1 Chuỗi build UI (`:8787`) — **6 bước, đúng thứ tự**

```powershell
# ① CỐ ĐỊNH VÂN TAY — chạy 2 vòng, giá trị phải BẤT ĐỘNG
node tools/fixpoint-fingerprint.mjs
node tools/fixpoint-fingerprint.mjs

# ② BUILD (⛔ KHÔNG cần server đang chạy ⇒ an toàn nhất)
npm run build

# ③ ĐỒNG BỘ DANH TÍNH vào .local-data/warehouse.sqlite (chỉ khi vân tay/định danh đổi)
#    ⚠️ tệp thật nằm ở tools/ (KHÔNG phải scripts/)
node tools/_sync-identity-once.mjs <sourceShort> <sourceFull> <brandFull> <releaseFull>

# ④ DỪNG ĐÚNG PID của UI — PHẢI xác minh cmdline là scripts/local-server.mjs TRƯỚC khi dừng
netstat -ano | Select-String "LISTENING" | Select-String ":8787"
Stop-Process -Id <PID_cua_8787> -Force

# ⑤ CHẠY LẠI UI (cổng tự nạp dist/ mới)
node scripts/local-server.mjs

# ⑥ CHỨNG MINH BẢN ĐANG CHẠY = BẢN VỪA BUILD (bắt buộc, ⛔ đừng bỏ qua)
node tools/verify-ui-build-applied.mjs --port=8787
```

**Kết quả cổng ⑥ đo được trong lượt soạn tài liệu này `[ĐO LẠI 08/10]` — đạt đủ 3 phép đo:**

```text
=== CONG: BAN CHAY CO MOI HON MA NGUON KHONG? ===
  ✓ do-moi    dist/ moi hon nguon 60s · 116 tep nguon da doi
  ✓ van-tay   HTML mang bb706f1202490077 · khop SSOT
  ✓ byte      6/6 bundle dung byte tren :8787

KET LUAN: BAN CHAY DUNG BAN DA BUILD MOI NHAAT.
```

> ⛔ **KHÔNG dùng `Stop-Process node`** (giết cả DSH host/proxy/phiên khác) — **chỉ dừng theo PID đã xác minh**.
> ⛔ **KHÔNG gộp «dừng service + build + start» vào MỘT lệnh dài** — bị ngắt giữa chừng ⇒ service chết + artifact hỏng (đã xảy ra 06/10: JAR hỏng 0,1 MB so với bản lành 86,8 MB).
> ⚠️ `gd-cycle` **⛔ KHÔNG tự khởi động lại dịch vụ** ⇒ sau build **phải** chạy lại `node scripts/local-server.mjs`.
> ⚠️ `gd-cycle` **sinh 1 migration identity mỗi lần chạy** ⇒ ⛔ không chạy dồn dập.
> ⚠️ Lỗi `EPERM … rename '.local-data' → '..\_vntech-buildstash'` = **ổ khoá file do server đang chạy giữ**, ⛔ **không phải lỗi sandbox** ⇒ tìm đúng PID và dừng nó.

### 4.2 Chuỗi build/triển khai Java (`:18081`) — **4 bước**

```powershell
# ① DỪNG JAVA :18081 — PHẢI xác minh cmdline chứa `vntech-erp-web` TRƯỚC khi dừng
# ② ĐỢI ~2 GIÂY cho JAR NHẢ KHOÁ (kiểm bằng phép thử rename JAR → .lk → JAR)
# ③ BUILD ĐÚNG THƯ MỤC (thiếu ⇒ lỗi trong 1 GIÂY vì không có pom.xml)
Push-Location java-backend
& cmd /c "`"$mvn`" -o -DskipTests package"
# ④ START + KIỂM
#    WorkingDirectory = java-backend
java -jar web\target\vntech-erp-web-0.1.0-SNAPSHOT.jar --server.port=18081
#    chờ tới khi :18081 trả 401/200 = sống
```

**Mẹo chẩn đoán thời gian build:** lỗi trong **~1 giây** = **sai thư mục** · lỗi **sau ~1 phút** (`Unable to rename`) = **JAR bị Java giữ khoá**.

> 🔎 **Artifact hiện hành `[ĐO LẠI 08/10]`:** `java-backend/web/target/vntech-erp-web-0.1.0-SNAPSHOT.jar` — **86,80 MB**, mtime **08/10/2026 17:12:36** ⇒ khớp thời điểm PID 20508 khởi động.
> ⚠️ **Trước khi ghi đè JAR ⇒ PHẢI có bản lùi 86,8 MB** (bản lùi đã cứu hệ thống 1 lần ngày 06/10).
> ⚠️ `tools/deploy-java-backend.mjs` **còn 2 lỗi chưa sửa** (thiếu bước đợi JAR nhả khoá) ⇒ **làm thủ công 4 bước** cho tới khi vá (xem §8, mục R-8).
> ⛔ **KHÔNG kill `java.exe` theo tên** — máy có **2 tiến trình `java.exe` của DỰ ÁN KHÁC** (`Phan mem Purchasing`).

### 4.3 Thứ tự bắt buộc khi **sửa mã nguồn** (bài học «luật số 1»)

```text
① Sửa tệp mã nguồn (app/ lib/ scripts/ tests/ drizzle/ …)
      ⇒ vân tay nguồn ĐỔI ⇒ `npm run build` FAIL «Source fingerprint không hợp lệ»
② Sửa 2 tệp SSOT bằng `node tools/fixpoint-fingerprint.mjs` (2 vòng, phải BẤT ĐỘNG)
      → VNTECH_FINGERPRINT.json + lib/vntech-identity-data.mjs
③ ⚠️ CSDL `.local-data/warehouse.sqlite` có TRIGGER CHẶN ghi đè danh tính
      ⇒ `scripts/local-runtime.mjs` TỪ CHỐI KHỞI ĐỘNG ⇒ :8787 CHẾT ⇒ :9000 trả 404
      ⇒ dùng `node tools/_sync-identity-once.mjs` (⛔ KHÔNG tạo migration mới để ghi vân tay — sẽ lặp vô hạn)
④ ⇒ THÊM MIGRATION ⇒ VÂN TAY ĐỔI LẦN NỮA ⇒ PHẢI CHẠY LẠI BƯỚC ②
```

> ⛔ **KHÔNG BAO GIỜ xoá/dùng `.local-data`** — backup `.local-data/warehouse.sqlite` trước khi áp migration.

---

## 5. BÀN GIAO MÃ NGUỒN & GIT

| Hạng mục | Giá trị | Nguồn |
|---|---|---|
| Nhánh bàn giao | **`unity`** | `[ĐO LẠI 08/10]` `git rev-parse --abbrev-ref HEAD` |
| Commit mới nhất (**HEAD**) | `3cfbd75fa04d282c0852f23366c7d0665f2b507f` — `feat(rbac): U-1 - nguoi uy nhiem quan tri thay du lieu TRONG PHAM VI (het bi chan o tang du lieu)` · **2026-10-08 17:18:15 +0700** | `[ĐO LẠI 08/10]` `git log -1` |
| Commit trên `origin/unity` | `3cfbd75fa04d282c0852f23366c7d0665f2b507f` (**giống hệt HEAD**) | `[ĐO LẠI 08/10]` `git ls-remote origin refs/heads/unity` |
| Chênh lệch với remote | **0 ahead · 0 behind** ⇒ toàn bộ commit **đã push** | `[ĐO LẠI 08/10]` `git rev-list --left-right --count origin/unity...unity` |
| 2 commit liền trước | `defccb1` (Merge `origin/unity` vào `unity`) · `0119160` (`feat(go-live): gop toan bo thay doi 3 phien — phan quyen uy nhiem, API kho, giu cho phieu xuat, sua loi build`) | `[ĐO LẠI 08/10]` `git log -3 --oneline` |
| Cây làm việc | ⚠️ **CHƯA SẠCH**: **79 tệp đã sửa (M)** + **1 tệp chưa theo dõi (??)** ⇒ ⛔ **KHÔNG `git reset --hard` / `git checkout .` / `git clean -fd`** (sẽ mất việc nhiều phiên) | `[ĐO LẠI 08/10]` `git status --porcelain` |

> ⛔ **Thay đổi cũ trong bản 23/09 đã hết đúng:** câu *«Có 166+ commit chưa push trên nhánh `unity`»* — **SAI ở thời điểm 08/10**: nhánh `unity` nay **đã push đủ, 0 commit chờ**.
> 📌 Trước khi commit: **`git add` TỪNG TỆP CỦA MÌNH** — ⛔ **TUYỆT ĐỐI KHÔNG** `git add -A` / `git add .` (cây có tệp của nhiều phiên).

---

## 6. CỔNG KIỂM CHỨNG

| # | Cổng | Lệnh | Kết quả | Nguồn |
|---|---|---|---|---|
| 1 | **Typecheck** | `npx tsc --noEmit` | ✅ **EXIT 0** (37,3 giây) | `[ĐO LẠI 08/10]` — chạy trong lượt soạn tài liệu |
| 2 | **Cổng UI (build đã áp dụng)** | `node tools/verify-ui-build-applied.mjs --port=8787` | ✅ `✓ do-moi` · `✓ van-tay bb706f1202490077 khớp SSOT` · `✓ byte 6/6` ⇒ *BẢN CHẠY ĐÚNG BẢN ĐÃ BUILD MỚI NHẤT* | `[ĐO LẠI 08/10]` |
| 3 | **Sức khỏe dịch vụ** | `netstat -ano \| Select-String ":3306\|:18081\|:8787\|:9000"` · `Invoke-WebRequest http://127.0.0.1:18081/actuator/health` | ✅ 4/4 cổng LISTENING · `:8787` 200 · `:9000` 200 · `:18081` 200 `status=UP` (`db` UP) | `[ĐO LẠI 08/10]` |
| 4 | **Java** | `cd java-backend; mvn -B test` | ✅ module **`web`: 88 test / 33 lớp · 0 failure · 0 error · 0 skip** · toàn bộ **4 module: 160 test / 44 lớp · 0 failure · 0 error · 0 skip** (lượt chạy **08/10/2026 17:09–17:12**, JAR dựng lại lúc 17:12:36) | `[ĐO LẠI 08/10]` — đọc trực tiếp `surefire-reports` trên đĩa; **khớp** con số `88/88` trong log phiên |
| 5 | **Cổng FE (hồi quy)** | `node scripts/regression-suite.mjs` (≈ `npm run test:regression`) | ✅ **955 test · 954 pass · 0 fail** | `[LOG PHIÊN]` `docs/dsh-mutil-session/SESSION_A/BUG_HOTFIX_LOG.md` §`BUG-20261008-012` (08/10/2026) — ⚠️ lượt này **không chạy lại** (lý do ở ghi chú dưới) |
| 6 | **Probe E2E phân quyền** | `node tools/probe-grant-1-perm-e2e.mjs` | ✅ **17/17 ĐẠT · hết `finding`** (2 chiều: thiếu quyền ⇒ bước 01 KHOÁ `true` · có quyền ⇒ MỞ `false`) | `[LOG PHIÊN]` §`BUG-20261008-013` (08/10/2026 20:15) — ⚠️ lượt này **không chạy lại** (probe **ghi CSDL thật**: tạo tài khoản + cấp quyền) |
| 7 | **Bất biến CSDL** | xem §7 | ✅ **`warehouses` = 12 · `projects` = 5 · kho có `project_id` = 10** | `[ĐO LẠI 08/10]` truy vấn MySQL trực tiếp |
| 8 | **Cổng phát hành tĩnh** | `node scripts/generate-release-manifest.mjs` ⇒ `npm run test:release-static` | ⚠️ **cần xác minh** — ⛔ chưa chạy trong lượt này | — |

> ⚠️ **Vì sao cổng 5 và 6 không chạy lại trong lượt soạn tài liệu:**
> · Cổng hồi quy FE có **sinh/cập nhật ảnh chuẩn thị giác** (`tools/baseline/*.png`, 78 tệp **đang được git theo dõi**) — xem `docs/dsh-state/SESSION_REGISTRY.md` §C. Chạy lại sẽ **ghi đè tệp ngoài phạm vi tài liệu này** ⇒ ⛔ không chạy.
> · Probe E2E **lưu thật vào CSDL** (⚠️ đã từng để lại 44 tài khoản `probe_*` — **đã vô hiệu hoá 08/10/2026**, xem §8 R-5) ⇒ ⚠️ chạy trên môi trường nghiệm thu riêng, ⛔ không chạy trên CSDL dùng chung.
> ⇒ **Việc cần làm khi tiếp nhận:** chạy lại cổng 5 + 6 trên môi trường nghiệm thu riêng và ghi số thật vào nhật ký kiểm thử.

---

## 7. BẤT BIẾN CSDL PHẢI GIỮ

Ba bất biến dưới đây là **hợp đồng dữ liệu** — ⛔ **không được để thay đổi**; cổng hồi quy `W-02`/`W-04` sẽ ĐỎ nếu vi phạm.

| Bất biến | Giá trị đúng | Câu lệnh kiểm | Đo `[ĐO LẠI 08/10]` |
|---|---|---|---|
| Số kho | **`warehouses` = 12** | `SELECT COUNT(*) FROM warehouses;` | ✅ **12** |
| Số dự án | **`projects` = 5** | `SELECT COUNT(*) FROM projects;` | ✅ **5** |
| Số kho **có gắn dự án** | **kho có `project_id` = 10** | `SELECT COUNT(*) FROM warehouses WHERE project_id IS NOT NULL;` | ✅ **10** (và **2** kho không gắn dự án) |

**Trạng thái CSDL kèm theo `[ĐO LẠI 08/10]`:**

| Hạng mục | Giá trị |
|---|---|
| Phiên bản MySQL | **8.0.46** |
| CSDL | `vntech_erp` — **134 bảng** |
| Flyway | **38 bản ghi** trong `flyway_schema_history` · **version cao nhất = `39`** — `39 session02 stock reservation issue id` · `success = 1` · áp lúc **2026-10-08 15:57:04** |
| Tệp migration nguồn | `java-backend/infrastructure/src/main/resources/db/migration` — **38 tệp `V*.sql`** |
| Nhật ký kiểm toán | `audit_logs` = **4.307 bản ghi** |
| Chuỗi chứng từ mẫu PRJ-DEMO-01 (mới nhất mỗi loại) | DNMH `DNMH-PRJ-DEMO-01-2026-9201` → **approved** (bậc 5/5) · PO `PO-PRJ-DEMO-01-2026-9308` → **waiting_delivery** · GRN `GRN-PRJ-DEMO-01-2026-9203` → **complete · posted** · PX `PX-PRJ-DEMO-01-2026-0038` → **pending_cht** · RET `RET-PRJ-DEMO-01-2026-0008` → **received** |

> ⚠️ **ĐÃ TỪNG XẢY RA:** một probe của chính phiên phát triển **xoá liên kết dự án của một KHO THẬT** ⇒ cổng `W-02` ĐỎ (`BUG-20261008-007`). ⇒ **Mọi phép thử ghi dữ liệu phải dùng tài khoản/kho rác và tự dọn.**
> ⚠️ Bản 23/09 ghi *«114 bảng baseline»* và *«Flyway V1..V28»* — **nay đã lệch**: **134 bảng**, **38 migration / head `V39`**.

---

## 8. VIỆC CÒN TỒN & RỦI RO ĐÃ BIẾT

Nguồn: `docs/dsh-state/SESSION_REGISTRY.md` + `docs/dsh-mutil-session/SESSION_A|B/BUG_HOTFIX_LOG.md` (các mục `BUG-20261008-0xx`), đối chiếu với số đo `[ĐO LẠI 08/10]`.

| # | Mức | Việc còn tồn / rủi ro | Bằng chứng | Đề xuất |
|---|---|---|---|---|
| **R-1** | 🟠 **OPEN** | **2 action TỔ ĐỘI bị NỚI QUYỀN ngoài chủ đích** (`set_project_team_status` → `List.of("site_command")`, thêm `delete_project_team`) ⇒ cổng `TM-04` **ĐỎ**; mã **mâu thuẫn chú thích** ngay trong tệp | `BUG-20261008-010` (08/10 19:10) · chủ sở hữu đề nghị `ERP-SESSION-03` | Vá về `admin-only` (hoặc cập nhật chú thích + test **có chủ đích**), rồi chạy lại `tests/tm04-team-crud.test.mjs` |
| **R-2** | 🔴 **CRITICAL (đã khôi phục)** | Migration **`V39` ⛔ KHÔNG IDEMPOTENT** ⇒ Flyway FAILED (`Duplicate column name 'issue_id'`) ⇒ **backend không khởi động được**. Nay `V39` đã áp `success = 1` (`[ĐO LẠI 08/10]`) | `BUG-20261008-011` (08/10 15:57→16:18) | ⚠️ **Xử lý tận gốc:** thêm guard `INFORMATION_SCHEMA` cho `V39`. Công cụ dò `tools/check-migration-idempotency.mjs`: **38 tệp · 0 đang chờ ⇒ hiện không rủi ro**, nhưng máy nào đã có cột sẽ chết ở lần khởi động sau |
| **R-3** | ✅ **ĐÃ VÁ** | 2 test Java lỗi vì `web/src/test/resources/schema-h2.sql` thiếu gương cột `issue_id` (`stock_reservations`) — ⛔ **không phải lỗi sản phẩm** | `BUG-20261008-012` — nay `Tests run: 88, Failures: 0, Errors: 0` · **BUILD SUCCESS**; khớp `[ĐO LẠI 08/10]` | Theo dõi: mọi cột mới của MySQL **phải** được gương sang `schema-h2.sql` (bản **test**, ⛔ không phải bản `main`) |
| **R-4** | 🟠 **MỘT PHẦN** | **`U-1` mới áp một phần:** người uỷ nhiệm non-admin đã nhận `users`/`adminProjects`/`userScopes` **lọc theo phạm vi** (commit `3cfbd75`), **nhưng chưa áp** cho `userWarehouseScopes` · `engineRoleProfiles` · `adminSuppliers`/`adminPartners` (nhóm 11–14 trường bootstrap bị giữ khỏi non-admin) | `BUG-20261008-013` (+ mở rộng) · §`SESSION_REGISTRY` 08/10 | Chốt **một lần** theo U-1 + danh sách loại trừ (⛔ giữ admin-only: `allModulePermissions` · `emailOutbox` · `emailRecipients`) |
| **R-5** | ✅ **ĐÃ XỬ LÝ 08/10/2026** | 44 tài khoản kiểm thử `probe_*` (tạo 08/10 10:30 → 17:14) đã **vô hiệu hoá** (`active=0`) ⇒ ⛔ không đăng nhập được; ⭐ hoàn nguyên: `UPDATE users SET active=1 WHERE username LIKE 'probe\_%'` | `[ĐO LẠI 08/10]` `SELECT COUNT(*) FROM users WHERE username LIKE 'probe%'` | Dọn bằng `node probes/probe-cleanup.mjs http://127.0.0.1:9000 <username>` hoặc `set active = false`. ⚠️ `delete_user` **từ chối** nếu tài khoản đã có lịch sử nghiệp vụ ⇒ trạng thái đúng là **ĐÃ KHOÁ** (giữ vết chứng từ) |
| **R-6** | 🟠 **QUY TRÌNH** | **Cây làm việc bẩn: 79 tệp `M` + 1 tệp `??`** chưa commit (phần lớn là `docs/**`) | `[ĐO LẠI 08/10]` `git status --porcelain` | ⛔ **KHÔNG reset/checkout** (mất việc nhiều phiên). Rà `git diff --stat` **từng tệp** rồi commit theo cụm |
| **R-7** | 🟠 **CHƯA XÁC MINH** | **Cổng FE 955/954 và probe 17/17 chưa được chạy lại sau commit `3cfbd75`** (số hiện có là log của phiên trước đó trong cùng ngày) | §6 ghi chú | Chạy lại trên môi trường nghiệm thu riêng rồi ghi số thật vào `TEST_LOG` |
| **R-8** | 🟡 **CÔNG CỤ** | `tools/deploy-java-backend.mjs` **còn 2 lỗi**: ① thiếu bước **đợi JAR nhả khoá** ⇒ `repackage` luôn thất bại ② cần kiểm lại `Push-Location java-backend` | `SESSION_REGISTRY` §「QUY TRÌNH BUILD JAVA ĐÚNG」 | Làm thủ công 4 bước (§4.2) tới khi vá; ⛔ không dùng công cụ này để triển khai |
| **R-9** | 🟡 **TÍNH NĂNG** | Màn kho: modal `allocate` (cấp phát/hoàn trả) **thiếu 4 điểm đặc tả** (tên action · payload · nút nào mở · module/capability) — máy giữ chỗ **đã có sẵn** | `HANDOFF-20261008-006/007` · §`SESSION_REGISTRY` 08/10 | S2 chốt đặc tả ⇒ nối UI; ⛔ không viết lại máy giữ chỗ |
| **R-10** | 🟡 **UI** | **22 màn phòng ban mỏng** (`dept_plan_*` / `dept_project_*` = 1 form + 1 bảng) và **4 tệp màn mồ côi** (`ProjectAggregateTabs` · `SiteCommandCreateModal` · `WarehouseCreateModal` · `TeamManagement`) | `docs/45_BANG_TONG_HOP_GO_LIVE_20261008.md` §B6/B7 (đề xuất: **ẩn** 22 màn · **xoá** `ProjectAggregateTabs` · **giữ + ghi chú** `WarehouseCreateModal`) | Chờ user chốt; đây là **quyết định nghiệp vụ**, ⛔ không phải lỗi |
| **R-11** | ⚠️ **CẦN XÁC MINH** | **`SlaComplianceWorker`** (Java, tệp vẫn tồn tại tại `java-backend/infrastructure/.../worker/SlaComplianceWorker.java`) — bản 23/09 ghi *«lỗi SQL `supply_workflow_steps` mỗi giờ, chưa phải lỗi chặn»* | kế thừa bản 23/09 | ⛔ **chưa đo lại trong lượt này** ⇒ đọc log backend để xác nhận còn lỗi hay không trước khi đóng |
| **R-12** | ⚠️ **CẦN XÁC MINH** | Kết quả seed demo (`java-backend/tools/seed-demo.mjs`) — bản 23/09 ghi *«61/61 PASS · 0 FAIL»* | kế thừa bản 23/09 | Chạy lại trên môi trường sạch rồi cập nhật số |

> ✅ **Tin tốt (đã kiểm & sạch, ⛔ không cần làm gì):** chuỗi lõi go-live **mua hàng 13 + kho 12 + tài chính 3** action module-gated đúng · `PUBLIC_ACTIONS` **7/7** tự phục vụ có `requireCurrentUser` + `cu.id()` (⛔ không IDOR) · `setup` chặn chạy lại **409** · `login` lockout **429** · **Nút chết**: FE ↔ BE nhất quán · **JOBS**: 5 mục menu → `WorkCenter` 5 tab.

---

## 9. VẬN HÀNH THƯỜNG NHẬT

### 9.1 Khởi động / kiểm tra

```powershell
# Kiểm tra 4 cổng cùng sống
netstat -ano | Select-String "LISTENING" | Select-String ":3306|:18081|:8787|:9000"

# Kiểm tra sức khỏe Java API (phải HTTP 200 / status UP)
Invoke-WebRequest "http://127.0.0.1:18081/actuator/health" -UseBasicParsing

# Kiểm tra chuỗi sống đầy đủ
node tools/probe-live-stack.mjs

# Chứng minh UI đang phục vụ đúng bản build mới nhất
node tools/verify-ui-build-applied.mjs --port=8787
```

### 9.2 Khởi động lại Java API (khi cần)

```powershell
# dừng đúng PID cổng 18081 (⚠️ chỉ dừng theo PID đã xác minh cmdline chứa vntech-erp-web)
netstat -ano | Select-String "LISTENING" | Select-String ":18081"
Stop-Process -Id <PID_cua_18081> -Force
Set-Location java-backend
java -jar web\target\vntech-erp-web-0.1.0-SNAPSHOT.jar --server.port=18081
```

> 📌 **Đã cập nhật so với bản 23/09:** bản cũ ghi `JAVA_HOME = C:\Users\PC\.jdks\openjdk-26.0.2.1` — **lệch với bản ĐANG CHẠY**. Tiến trình thật `[ĐO LẠI 08/10]` dùng **JDK 21**: `C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot`.
> KHÔNG dùng `Start-Process` trần cho Java — tiến trình chết theo khi cửa sổ PowerShell đóng ⇒ proxy `:9000` trả 502.

### 9.3 Seed dữ liệu demo

```powershell
node "java-backend/tools/seed-demo.mjs" "http://127.0.0.1:9000"
# ⚠️ Kết quả kỳ vọng theo bản 23/09: "SEED DEMO: 61/61 PASS · 0 FAIL" — CẦN ĐO LẠI (xem R-12)
```

### 9.4 Dữ liệu mẫu (bàn giao kèm theo)

- Nhiều đơn vị (VNTECH, BCH, DA-01, KH, TCKT…), dự án **PRJ-DEMO-01** active + kho + hợp đồng.
- **Chuỗi chứng từ mẫu mới nhất mỗi loại `[ĐO LẠI 08/10]`** (xem §7) — vẫn còn bản cũ trong CSDL; đây là mẫu **mới nhất** tại thời điểm đo.
- Nhân sự, tài chính (sổ quỹ, kế hoạch giải ngân), nhật ký thi công, pháp chế (công văn).

### 9.5 Backup / khôi phục

- **MySQL (CSDL chính):** dump định kỳ bằng `mysqldump` trên CSDL `vntech_erp`; ⛔ **không** dùng `pg_dump` (hệ này **không** dùng PostgreSQL cho runtime — xem ghi chú §11).
- **SQLite / nghiệp vụ UI (`local-data`):** backup **nguyên thư mục** `.local-data` (gồm `warehouse.sqlite` + `-wal`/`-shm`) **trước** khi build/áp migration. Thư mục hiện đã có sẵn nhiều bản `.sqlite.bak-*` — giữ nguyên, ⛔ đừng xoá.
- Trước khi nâng cấp: backup **cả** CSDL MySQL **và** `.local-data` + tệp migration.

---

## 10. BẢO MẬT

| Cơ chế | Thực tế trong mã nguồn / CSDL | Nguồn |
|---|---|---|
| Băm mật khẩu | **PBKDF2-SHA256 600.000 vòng**, định dạng `pbkdf2$<iterations>$<saltHex>$<hashHex>`, salt 16 byte, khoá 32 byte — **tương thích 100% với monolith JS** (người dùng ⛔ không phải đổi mật khẩu khi migrate) | `[ĐO LẠI 08/10]` `Pbkdf2PasswordHasher.java` · `AuthUseCase.java` |
| Khoá đăng nhập | **10 lần sai / 15 phút** theo cặp `ip + username` | `[ĐO LẠI 08/10]` `AuthUseCase.java:27` |
| RBAC | **3 lớp:** role → module/capability (`canView`/`canUse`/`canCreate`/`canEdit`/`canDelete`/`canApprove`) → **scope dữ liệu** (dự án/kho/đơn vị) | mã nguồn `java-backend/application/.../rbac/` (kế thừa bản 23/09) |
| Audit | Mọi hành động ghi `audit_logs` — **4.307 bản ghi** hiện có | `[ĐO LẠI 08/10]` |
| Trust Lock | `trustMode: development` · `licenseEnforcement: false` · `privateKeyPresent: false` ⇒ ⛔ **không có private key/PEM trong source/release** | `[ĐO LẠI 08/10]` `VNTECH_FINGERPRINT.json` |
| Integrity gate | Vân tay nguồn `VNTECH-FP-BB706F1202490077` khớp SSOT; cổng UI xác nhận `6/6 bundle đúng byte` | `[ĐO LẠI 08/10]` |

> ⛔ **Quy tắc bàn giao:** ⛔ **không** ghi mật khẩu/token/secret vào tài liệu, log hay ảnh chụp; cấp tài khoản qua màn «Quản lý hệ thống» (§3.2).
> 🔎 **Đã sửa so với bản 23/09:** câu *«fingerprint nguồn (171 file)»* — số tệp **phụ thuộc lần build**; số đúng phải **đọc từ cổng** (`verify-ui-build-applied.mjs` báo *«116 tệp nguồn đã đổi»* ở lượt đo này). ⛔ Đừng chép số tệp vào tài liệu như một hằng số.

---

## 11. NHỮNG ĐIỂM CẦN LƯU Ý KHI TIẾP NHẬN

1. **Hai lõi Java/JS song song:** một số action chưa triển khai ở Java (được phục vụ từ monolith JS). Khi sửa backend Java phải kiểm tra idempotency **cả hai phía**.
2. **Migration hai dòng:** MySQL dùng **Flyway** (`java-backend/infrastructure/src/main/resources/db/migration` — 38 tệp, head **`V39`**), SQLite dùng **Drizzle** (`drizzle/` — 393 tệp). Khi thêm bảng/cột phải thêm **cả hai** (additive, ⛔ **KHÔNG** sửa migration cũ).
3. ⛔ **KHÔNG format/reformat code** trong danh sách fingerprint — làm vỡ gate cài đặt. ⛔ **KHÔNG chèn code vào GIỮA** tệp bị gate khoá **số dòng** (`scripts/system-route.mjs`, `.../SystemController.java` — `F-03`) ⇒ hàm mới đặt **CUỐI tệp** + gọi inline.
4. ⛔ **KHÔNG tin `git diff` mù:** cây có thể có hàng trăm tệp dirty của **nhiều phiên** ⇒ phải đo `--stat` **từng tệp** mới kết luận.
5. ⛔ **KHÔNG thử cổng quyền bằng action CÓ THỂ GHI** trên môi trường dùng chung (`save_email_settings` · `retry_email` · `save_ui_display_settings` — `BUG-D16` đã ghi thật 3 lần) ⇒ chỉ dùng action **kiểm dữ liệu trước khi ghi** (`bulk_import_projects` · `delete_material_category`).
6. ⛔ **KHÔNG gắn module cho action admin-only** — `P-08`: đo 16/16 route JS `requireRole(["admin"])` mà Java chỉ `requireCurrentUser` ⇒ **registry là cổng DUY NHẤT** ⇒ gắn module = **leo thang quyền** (`TM-04`).
7. **Lưu ý về PostgreSQL:** bộ cài `00_NANG_CAP_GIU_NGUYEN_DU_LIEU_WINDOWS.bat` và `README.md` còn nhắc **PostgreSQL** — nhưng **runtime thật đang chạy MySQL** (`[ĐO LẠI 08/10]`: `:3306` là `mysqld` 8.0.46, health `db` = `MySQL`). ⇒ **Cần xác minh** luồng cài đặt/nâng cấp trước khi dùng cho môi trường mới.
8. Xem chi tiết vận hành build tại `docs/29_RUNBOOK_BUILD_VA_CHAY_JAVA_BACKEND.md`, `docs/11_RUNBOOK_VAN_HANH_BACKEND_JAVA.md` và `docs/60_RUNBOOK_SAU_BUILD_20261008.md`.

---

## 12. DANH MỤC TÀI LIỆU KÈM THEO

| # | File | Nội dung |
|---|---|---|
| 30 | `docs/30_HUONG_DAN_NGUOI_DUNG.md` | Hướng dẫn sử dụng cho người dùng cuối |
| 31 | `docs/31_TAI_LIEU_BAN_GIAO.md` | Tài liệu này (bàn giao & vận hành) — **bản `DOC-ALPHA-TEST-2026.10`, 08/10/2026** |
| 32 | `docs/32_TAI_LIEU_PHAN_TICH_HE_THONG.md` | Phân tích kiến trúc & hệ thống |
| 33 | `docs/33_MO_TA_CHUC_NANG_VA_HE_THONG.md` | Mô tả chức năng & hệ thống toàn diện |
| 34 | `docs/34_TAI_LIEU_DEV.md` | Hướng dẫn phát triển (dev) |
| 35 | `docs/35_DANH_SACH_TASK_DA_HOAN_THANH.md` | Danh sách task đã hoàn thành/đang làm (MT1+MT2) |
| 45 | `docs/45_BANG_TONG_HOP_GO_LIVE_20261008.md` | Bảng tổng hợp go-live 1 trang (quyết định + việc chặn) |
| 60 | `docs/60_RUNBOOK_SAU_BUILD_20261008.md` | Runbook chạy sau khi build (xác minh + làm xanh cổng phát hành) |
| 16 | `docs/16_HUONG_DAN_SEED_DEMO_VA_TAI_KHOAN_MO_RA.md` | Hướng dẫn seed dữ liệu demo & tài khoản mở ra |
| 29 · 11 | `docs/29_…` · `docs/11_…` | Runbook build/chạy và runbook vận hành backend Java |
| — | `docs/dsh-state/SESSION_REGISTRY.md` | Sổ đăng ký & điều phối nhiều phiên (khoá tệp, bài học, trạng thái) |
| — | `docs/dsh-mutil-session/SESSION_A/BUG_HOTFIX_LOG.md` · `…/SESSION_B/BUG_HOTFIX_LOG.md` | Nhật ký lỗi & bản vá theo phiên (`BUG-20261008-0xx`) |
| — | `docs/01..44…` | Báo cáo phân tích, audit, roadmap, runbook gốc của dự án |

---

*Kết thúc tài liệu bàn giao. Bản `DOC-ALPHA-TEST-2026.10` — lập/đo ngày **08/10/2026** (thay bản 23/09/2026).*
