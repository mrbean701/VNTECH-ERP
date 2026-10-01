# CURRENT STATE — VNTECH ERP V5.3.0 (MASTER BASELINE R1.1.1)

> Cập nhật: 28/09/2026 · nhánh `unity-p2-full-20260920`
> Đây là nguồn sự thật cho phiên mới. Đọc 4 tập trong `/docs/dsh-state/` rồi tiếp tục.

## COMMIT / BUILD

| Mục | Giá trị |
|---|---|
| HEAD | `4d1c129` — 26/09/2026 «[MT2] Chốt MASTER TASK 2 — 79/81 = 97,5 %» |
| Build hiện tại | `VNTECH-FP-702F7531E63FB174` — 28/09/2026 (tab «Báo cáo» + MỐC 14) |
| Files chưa commit | **64** — ⛔ KHÔNG commit (goal §18) |
| Backup rollback | branch `backup/mt3-head-20260928` (= 7fdf71d) · branch `backup/mt3-worktree-20260928` (= 73ff69d) · tag `backup-mt3-worktree-20260928` |

## SERVICE — khởi động ĐÚNG THỨ TỰ

```
1. Java   :18081  →  java-backend/web/target/vntech-erp-web-0.1.0-SNAPSHOT.jar --server.port=18081
2. UI     :8787   →  node scripts/local-server.mjs          (phục vụ dist/, KHÔNG phải mã nguồn)
3. Proxy  :9000   →  node tools/cutover-proxy.mjs --port 9000 --ui-port 8787 --api-port 18081
```

⛔ **Build bắt buộc**: `node tools/gd-cycle.mjs "<NHẬN>"`
⛔ Trước khi build: **dừng đúng PID** của :8787 và :9000 (⛔ TUYỆT ĐỐI KHÔNG `Stop-Process node` — giết DSH runner) + chuyển `.local-data` ra ngoài
⛔ Sau khi build: `node tools/set-local-identity.mjs` (đồng bộ vản tay SQLite ≠ SSOT)

## 4 CỔNG KIỂM — ĐỀU XANH ở lần chạy gần nhất

| Cổng | Kết quả |
|---|---|
| `npx tsc --noEmit` | **EXIT=0** |
| `node --import tsx --test tests/*.test.mjs` | **579 test · 578 pass · 0 fail · 1 skip** |
| `npm run test:regression` | **69/69 · 0 fail** |
| `npm run verify:css-baseline` | **ĐẠT · 2694 dòng · 0 lớp chặt · 0 biến chặt** |

## API / AUTH — đo thật, KHÔNG đoán

| Mục | Kết quả |
|---|---|
| Đăng nhập | `POST /api/system` với `{action:"login",username,password}` → 200 + cookie `mep_session` |
| ⛔ KHÔNG phải | `/api/auth/login` (404) |
| Đọc dữ liệu | `GET /api/system` có cookie → 200 (~1,37 MB) |
| Không cookie | 401 — **đúng thiết kế**, không phải lỗi |
| Mỗi hành động | Đi qua 1 dispatcher: `POST /api/system {action, …}` (`app/page.tsx:260` hàm `requestApi()`) |

## TÀI KHOẢN

- `admin` / `Admin123456@`
- `giamdoc.demo` / `Vntech@2026` (tài khoản duyệt, có phíếu chờ)

## TUNNEL

- https://riding-witnesses-spas-teaches.trycloudflare.com (HTTP 200)
- ⛔ Cloudflare **quick tunnel — URL ĐỔI MỖI LẦN KHỞI ĐỘNG LẠI**
- Lệnh: `cloudflared tunnel --url http://127.0.0.1:9000 --no-autoupdate`

## ACTION THẬT trong backend (Đọc từ `ActionRbacRegistry` + `SystemController`)

| Action | Module | Capability |
|---|---|---|
| `create_project` | (rỗng) | `canUse` |
| `create_project_team` | `site_command` | `canUse` |
| `save_organization_unit` | (rỗng) | `canUse` |
| `save_warehouse_location` | `inventory` | `canEdit` |
| ⛔ **KHÔNG có** `create_warehouse` | — | — |

→ **Kho chỉ tạo ĐƯỢC kèm lúc tạo dự án** (`create_project` + gọi `createWarehouse`, xem `page.tsx` L2758-2769)






---

# TRẠNG THÁI HIỆN TẠI — 29/09/2026 (sau MỐC 58)

## HỆ THỐNG
```
BUILD            : VNTECH-FP-AF52A0604645C4C5 (giao dien) + JAR moi (co `imageChanged`)
DICH             : :18081 (Java) · :8787 (UI) · :9000 (proxy) — ca 3 DANG CHAY
DANG NHAP        : POST /api/system {action:"login",username,password} -> 200 + cookie `mep_session`
5 CONG           : ✅ css-comment-guard · ✅ tsc EXIT=0 · ✅ css-baseline DAT
                   ❌ contract 4 (pr01) · ❌ regression 3 (pr03)  ← man Quan ly Du an, VON DA DO SAN
CSDL SACH        : error_reports=0 · benefit thu=0 · labor co anh=0 · user_module_permissions tam=0
```

## MỐC 113 — H2 THIẾU CỘT `labor_contracts` + `IF()` KHÔNG TƯƠNG THÍCH H2

| Mục | Giá trị |
|---|---|
| Triệu chứng | 5 test Java đỏ: `Column "lc.job_rank" not found` |
| Bản định nghĩa phải sửa | `web/src/test/resources/schema-h2.sql` · `web/src/main/resources/db/demo/schema-h2.sql` |
| Bản đã có sẵn ở MySQL | 18 cột (thiếu 5: `image_url`,`image_updated_at`,`job_rank`,`grade`,`renewal_round`) |
| Migration bù | `V32__moc113_labor_contracts_columns.sql` — **idempotent**, production là **no-op** |
| Lỗ thứ 2 | `HrStoreAdapter.java:111` dùng `IF()` — hàm riêng MySQL, H2 không có → đổi `CASE WHEN` |
| Kiểm chứng | harness H2 thật **16/16** · `javac` 121 tệp **exit 0** · typecheck 0 · regression 72/72 |

⚠️ **MÁY NÀY KHÔNG CÓ MAVEN** — không chạy được `mvn test`. Bằng chứng thay thế đã dựng và chạy thật,
nhưng **5 test kia cần anh chạy `mvn -o -B test` trên máy có Maven để đóng nốt**.

⛔ **Bài học (D-047):** vá schema H2 xong **chưa chắc** test xanh — phải dò cả cú pháp MySQL-only
(`IF`, `DATE_FORMAT`, `GROUP_CONCAT`…) trong SQL chạy trên H2. Ở đây vá cột xong mới lộ lỗi `IF()`.

---

## MỐC 118 — MENU «QUẢN TRỊ HỆ THỐNG» THEO QUYỀN THẬT

| Mục | Giá trị |
|---|---|
| Nhóm | `system_admin` · **15 mục** = `admin` + `admin_tab_01..14` |
| Cổng cũ | `canView` của từng mục — **bỏ**, vì 1 quyền «Xuất/Tạo/Sửa/Duyệt» không mở được menu |
| Cổng mới | **≥1 quyền bất kỳ** trong nhóm ⇒ hiện menu; mục con lọc theo ≥1 quyền |
| Ngoại lệ | Quản trị viên (vai trò `admin`) luôn thấy |
| Lối thoát đã bỏ | `!permissionConfigured` — chính là lỗ hổng (`kttdemo` 0 quyền mà ra 15 mục) |
| Tệp sửa | `lib/permissions.ts` · `app/page.tsx` |
| Test | `tests/m118-system-admin-menu-gate.test.mjs` (3 test) → hồi quy **72/72** |
| Đo thật | 7/7 tài khoản đúng quy tắc trên payload `GET /api/system` |

⛔ **Cảnh báo khi đọc quyền:** bảng `user_module_permissions` trống KHÔNG có nghĩa là user không
có quyền — backend bơm thêm quyền theo phòng ban (`permissionSource` = `company_leadership` /
`department_default`). `giamdoc.demo` có 0 dòng trong bảng nhưng payload trả về 15 quyền nhóm quản trị.
Luôn đo trên payload thật, đừng kết luận từ bảng.

---
## 20 MỐC ĐÃ LÀM TRONG PHIÊN
| Nhóm | Mốc |
|---|---|
| Quản trị hệ thống | 39 · 40 · 41 · **42** (Tab 14 Báo lỗi) · 51 · **53** · **54** · **57** |
| Hồ sơ nhân sự | 45 · 45b · **52** · **56** (1·2) · **58-1** · **58-2** |
| Màn khác | 43 · 46 · 49 · **55** (Hợp đồng + ảnh) · **56-5** · **58-3** · **58-4** · **58-5** |
| Hạ tầng | 47 · 50 · D-025…D-029 |

```
FAIL: 11 -> 10 -> 9 -> 8 -> 7 -> 4
TAI LIEU: CHECKLIST.md 1.588 dong · DECISIONS.md 1.102 dong (D-027·D-028·D-029)
GIT     : 0 commit · 0 push (theo yeu cau cua user)
```

## ⏳ 4 VIỆC CHO USER QUYẾT — **KHÔNG BLOCK GOAL**
```
① MỐC 48 — nut «Sua tai khoan» tra HTTP 403 voi nguoi co `admin_tab_01`
     (UI cho phep, backend `UserManagementUseCase.java:104` chi nhan ROLE `admin`)
     -> 1 sua backend (⚠️ nguoi do sua duoc vai tro admin cua nguoi khac)
     -> 2 an nut neu khong phai admin          -> 3 tam gac
② Tab «Tong quan» o man Chi tiet Du an: code 5 muc (dang dung) · pr01/pr03 dam 4 muc va
   HAI TEST NHAU CON MAU THUAN nhau
     -> 1 GIU (khuyen nghi, sua test)         -> 2 BO (sua code)
③ bypass `isCompanyLeadership` (D-022) — `BootstrapDataAdapter.java:867,1929`
   COMPANY_LEADERSHIP_ROLE_CODES 6 muc + **`|| "director".equals(roleBase)`**
   3 tai khoan bi anh: thukydemo · hrm (ma chuc danh NHAN SU!) · giamdoc.demo — deu thay 74 module
     -> 1 giu · 2 bo ve `"director".equals(base)` (⭐ chi `hrm` mat bypass) · 3 bo hanh · 4 gac
④ Bat email: can `smtp_host` · `username` · `password` · `sender_email` · `base_url`
   + 2 tang chan them: `notification_config_targets`=0 · `approval_email_recipients`=0
```

## ⛔ 3 BÀI HỌC ĐÃ GHI (DECISIONS.md + memory) — ĐỂ KHÔNG LẶP LẠI
```
D-025/026 · KHONG verify bang TEN BIEN trong bundle (da minify) + CSS nam file .css rieng
            + 4 tang: tsc · chuoi literal · rule CSS · API that
D-027       · SO TIENG VIET PHAI DO CODEPOINT, khong so bang mat
D-028       · `mvn clean` BAT BUOC tat Java :18081 truoc — nguoc lai JAR CU, test tren CODE CU
D-029       · HTTP 400 RONG = loi ENCODING may test, chua phai logic
```

---

# CẬP NHẬT 29/09 — MỐC 96 → 99 SAU MỐC 58 (BUG-01 + QUÉT D-030)

```
BUILD            : VNTECH-FP-B3ABCB674A9A0C05  (dai hon VNTECH-FP-AF52A0604645C4C5)
DICH             : :18081 · :8787 · :9000 — ca 3 DANG CHAY · login 200
5 CONG           : ✅ css-comment-guard · ✅ tsc EXIT=0 · ✅ css-baseline DAT
                   ❌ contract 4 (pr01) · ❌ regression 3 (pr03)  ← von da do san, KHONG TANG
CSDL SACH        : hr_records 4 (dung 4 ban goc) · labor 2 (anh rong, image_updated_at NULL)
```

## 🐛 BUG-01 (S1) — ĐÃ SỬA
```
O «Email cong ty» trong modal «Sua ho so»: gui `email` vao `save_hr_record`
nhung bang `hr_records` KHONG co cot `email` ⇒ BI BO QUA AM THAM ⇒ mat du lieu, khong bao loi.
SUA: bo `email` khoi `save_hr_record` · o Email chi dung duoc khi co quyen `update_user`
     (luu vao `users.email`) · khong co quyen ⇒ KHOA o + ghi chu · hien thi tu `row.email`.
⇒ KHONG tao cot moi · KHONG sua Java · KHONG build lai backend.
```

## 🔎 D-030 — ĐÃ QUÉT DỤ 4 VÒNG, 6 MODAL
| Modal / action | Bảng dịch | Kết quả |
|---|---|---|
| BenefitsScreen -> `save_benefit_record` | `benefit_records` | ✅ 7/7 |
| LaborScreen -> `save_labor_contract` | `labor_contracts` | ✅ 7/7 |
| HrProfileEditModal -> `save_hr_record` | `hr_records` | ⛔ 13/14 (email) → ĐÃ SỬA |
| `save_user_access` | `user_module_permissions` + `user_project_scopes` | ✅ chuẩn |
| HrProfileEditModal -> `update_user` | `users` | ✅ 5/5 |
| HrScreen -> `save_hr_record` / `create_user` | `hr_records` + `users` | ✅ 13/13 |
⇒ **CHỈ 1 lỗi `IgnoredField` duy nhất — đã sửa + kiểm chứng hồi quy.**

## ⛔ LƯU Ý PHẠM MỸ
```
`app/page.tsx` co 159 `name="..."` nhung trai tren NHIEU bang ⇒ D-030 ap dung cho
modal 1 BANG. Quet tiep chi nen lam khi tao MOI modal, khong quet lai toan he thong.
```

## ⏳ VẪN 4 VIỆC CHO USER QUYẾT (KHÔNG BLOCK GOAL) — không đổi
```
① MỐC 48 (xac nhan o dong code L207: `rbac.requireRole(..., List.of("admin"))`)
② Tab «Tong quan» · ③ bypass D-022 · ④ Bat email
```

---

# CẬP NHẬT LẦN CUỐI 29/09 — MỐC 101 (BUG-02) · BUILD MỚI NHẤT

```
BUILD            : VNTECH-FP-B01C5D788932F083   ⬅ MOI NHAT (dung build nay)
DICH             : :18081 · :8787 · :9000 — ca 3 DANG CHAY · login 200
5 CONG           : ✅ css-comment-guard · ✅ tsc EXIT=0 · ✅ css-baseline DAT
                   ❌ contract 4 (pr01) · ❌ regression 3 (pr03)  ← von da do san
CSDL SACH        : hr_records 4 · labor 2 (anh rong, image_updated_at NULL) · error_reports 0
```

## 🐛 BUG-02 (S1) — ĐÃ SỬA (MỐC 101)
```
Trieu chung: modal «Sua ho so` mo khoa 4 truong cho nguoi co `admin_tab_01`
⇒ `save_hr_record` GHI XONG → moi goi `update_user` → `UserManagementUseCase:103-104`
  (`rbac.requireRole(..., List.of("admin"))`) tra **HTTP 403** ⇒ tuong mat du lieu.
SUA: `canEditAccount` = `role === "admin"` (bo ve `admin_tab_01`) · khoa 4 o
     (Ma NV · Ten dang nhap · Phong/bộ phan · Email) + ghi chu · sua them 1 dong
     tieng Viet sai dau.
⇒ KHONG sua Java · KHONG tao cot moi · KHONG doi nghiep vu.
⇒ DA KIEM CHUNG TRONG BUNDLE: 4/4 chuoi dac trung co mat trong dist/client/assets/*.js
```

## 🔎 D-031 — RBAC FAIL-CLOSED (KHÔNG LỖ)
```
`SystemController:224-225` chan MOI action (tru PUBLIC_ACTIONS) qua `requireActionModule`.
`RbacService.requireActionModule`: action chua khai module ⇒ **throw 403** (mac dinh tu choi).
4 action HR da khai dung trong `ActionRbacRegistry.java`:
  save_hr_record→dept_legal_hr · save_labor_contract / set_labor_contract_status→dept_legal_labor
  · save_benefit_record→dept_legal_benefits
⛔ CHI doc code — CHUA co phep thu tang 4 voi user that (thieu mat khau tai khoan
   khong phai admin). Xem muc ⑤ trong danh sach cho USER QUYET.
```

## ⏳ VẪN 5 VIỆC CHO USER QUYẾT (KHÔNG BLOCK GOAL)
```
① MỐC 48 · ② Tab «Tong quan» · ③ bypass D-022 · ④ SMTP
⑤ (tuỳ chọn) mat khau 1 tai khoan thuong → de chay 4 action HR bang user THAT
```

---

# CẬP NHẬT 29/09/2026 — MỐC 102 + MỐC 103 ĐÃ COMMIT + PUSH + MERGE VÀO `unity`

## 📦 GIT
```
acb28ae  feat: MỐC 102 (ngach/bac/gia han HD lao dong) + MỐC 103 (menu Review HD)
         · 30 file (18 sửa + 12 mới) · nguồn b08de4f
✅ origin/unity-p2-full-20260920 = acb28ae
✅ origin/unity                  = acb28ae
   (fast-forward  b08de4f..acb28ae — KHÔNG phá lịch sử, KHÔNG dùng --force)
```

## ✅ MỐC 102 — HỢP ĐỒNG LAO ĐỘNG: NGẠCH · BẬC · GIÁ HẠN LẦN — DONE
```
🗄️ drizzle/0314_hop_dong_lao_dong_ngach_bac_gia_han_lan.sql
⚙️ HrStore + HrManagementUseCase (renewalRound + 3 trường) + HrStoreAdapter
    + BootstrapDataAdapter
🎨 app/screens/LaborScreen.tsx (3 ô nhập mới)
🧪 ĐO THẬT: API HTTP 200 ⇒ CSDL ngạch=Chuyen gia · bậc=Bac 3 · gia_han=2
   · HĐ cũ giữ NULL/NULL/0 (không phá dữ liệu)
   · sai kiểu dữ liệu ⇒ 400
```

## 🟡 MỐC 103 — MENU «REVIEW HĐ» — PARTIAL (code + build + cổng XONG, THIẾU test API thật)
```
✅ CSDL       module_catalog += dept_legal_contract_review (hr_legal, sort 60, active 1)
              contract_reviews + contract_review_logs (drizzle/0315_review_hop_dong.sql)
✅ JAVA       ContractReviewStore / ContractReviewUseCase / ContractReviewStoreAdapter (MỚI)
              ApplicationBeansConfig + SystemController (tiêm + route)
              ActionRbacRegistry: manage_contract_review → dept_legal_contract_review + canEdit
              BootstrapDataAdapter: nạp contractReviews + contractReviewLogs
✅ UI         app/screens/ContractReviewScreen.tsx (225 dòng)
              app/page.tsx (import + route) · lib/ui-shared.tsx · lib/menu-helpers.ts
              app/globals.css (MỐC 106: .review-modal / .review-tab-panel cao 320px)
✅ BUILD      SHORT = VNTECH-FP-72751DBE6DEBEED8 · BUILT ARTIFACT VALIDATION: ĐẠT
✅ 5 CỔNG     css-comment-guard OK · tsc EXIT=0 · css-baseline ĐẠT
              contract 674/645/28 FAIL · regression 69/66/3 FAIL
⬜ CÒN        test API thật (list/open/log_contract_review) · ảnh màn + modal 2 tab
              · dọn dữ liệu thử
```

## 📊 28 FAIL CONTRACT — PHÂN LOẠI (KHÔNG PHẢI HỒI QUY)
```
16 test MT3-UI-*  : MỒ CÔI — commit MT3 7fdf71d đã bị rollback bởi 151db2e,
                    chỉ còn 14 file tests/mt3-* sống sót
 3 test PR-01/PR-03: MÂU THUẪN NHAU ở màn «Chi tiết Dự án»
                    (PR-01 đòi 4 tab, PR-03 đòi GIỮ 6 tab)
 9 test còn lại    : F-03 · MR/PR chung · datalist alias · MT3-UI-04/12d/13/14 · #9 · §19
```

## 🧹 ĐÍNH CHÍNH TÀI LIỆU
```
⛔ Mục «SỰ CỐ: WORKSPACE MẤT .git VÀ tools/» trong CHECKLIST.md đã bị GỠ —
   đó là BÁO ĐỘNG GIẢ do đo nhầm thư mục làm việc lệch bởi `subst W:` cũ.
✅ Thay bằng mục ĐÍNH CHÍNH + 3 bài học bắt buộc về cách đo hạ tầng.
```

## 🧪 CẬP NHẬT 30/09/2026 — MỐC 103b ĐÃ XONG & ĐÃ PUSH

```
✅ GIT        HEAD = 82d7ea8   «fix: MỐC 103b - ten nguoi review lay tu users.full_name
                                  + sua du lieu mojibake CSDL»
              origin/unity-p2-full-20260920 = 82d7ea8   ✅
              origin/unity                  = 82d7ea8   ✅
              ⇒ HAI NHÁNH TRÙNG NHAU (fast-forward, không phá lịch sử)

✅ LỖI #1 ĐÃ SỬA  Người review trước ghi MÃ TÀI KHOẢN (USR_2f435847-…).
                  Nay tra `users.full_name` ngay trong SQL ⇒ «Quản trị viên VNTECH».
                  File: java-backend/infrastructure/.../ContractReviewStoreAdapter.java
                        (addLog dùng INSERT … SELECT + IFNULL; markViewed dùng
                         last_reviewer_name=IFNULL((SELECT full_name FROM users WHERE id=?),?))

✅ LỖI #2 ĐÃ SỬA  Mojibake CSDL: contract_reviews.contract_name (double-encode) +
                  module_catalog.dept_legal_contract_review (MẤT DỮ LIỆU, «Đ»→«?»).
                  Sửa bằng CONVERT(0x<hex> USING utf8mb4) — charset-proof.
                  Migration: drizzle/0325_…sql (CÓ ĐIỀU KIỆN ⇒ idempotent).

✅ TEST API THẬT  8/8 ĐẠT qua cổng :9000
                  login 200 · list 200 (total=2 pending=2) · open 200 · log 200 ·
                  list lại 200 (pending 2→1, nguoi=«Quản trị viên VNTECH», log 23s/reviewed) ·
                  HĐ 2 KHÔNG bị lây · 2 đối chứng âm 400 · quét mojibake 6 cột = 0

✅ ẢNH CHỨNG CỨ    shot-review-m103.png                 — bảng 8 cột / 2 dòng, chữ SẠCH
                  shot-review-m103-modal-tab1.png      — panel 1062 x 320px
                  shot-review-m103-modal-tab2.png      — panel 1062 x 320px ⇒ BẰNG TAB 1
                  Cột «Người review» = «Quản trị viên VNTECH» (hết mã USR_)

✅ DỌN DỮ LIỆU    contract_review_logs=0 · viewed=1 → 0 · contract_reviews=2 ·
                  labor_contracts=2 · hr_records=3 · error_reports=0

🔧 BUILD ENV      ⛔ C:\Users\PC\.m2 KHÔNG CÒN TỒN TẠI.
                  Maven: D:\0.APP\IntelIji\IntelliJ IDEA 2026.2.1\plugins\maven-plugin\
                         lib\maven3\bin\mvn.cmd
                  Repo : E:\VNTECH\.m2\repository   ·   JAVA_HOME: JDK 21 Eclipse Adoptium
                  Lệnh: & $MVN -o -B -q package -DskipTests "-Dmaven.repo.local=E:\VNTECH\.m2\repository"

⬜ CÒN LẠI         1. Cập nhật 4 file tài liệu (đang làm) + commit/push
                  2. Dọn 6 tài khoản `sec_probe_*` còn sót trong `users`
                  3. Câu hỏi treo: «gia hạn HĐ lần N» lưu thế nào
                  4. MỐC 104 «Cơ sở vật chất & VVP»  — CHƯA LÀM
                  5. MỐC 105 UI chung toolbar ngang áp cho các màn khác — CHƯA LÀM
                  6. Dừng tunnel Cloudflare khi user yêu cầu
```

---

## CẬP NHẬT 30/09/2026 — MỐC 107 + 2 SỰ CỐ DO CHÍNH MÌNH GÂY RA (ĐÃ SỬA)

### Đã xong và ĐO ĐƯỢC

**1. MỐC 107 — nút nổi «Báo lỗi / Góp ý» che cột «Trạng thái» của bảng**

| | TRƯỚC | SAU |
|---|---|---|
| `.main-content` padding-bottom | `0px` | `84px` |
| Kích thước nút nổi | `155 x 40` @(1374,750) | `146 x 37` @(1383,753) |
| Số ô bị nút che khi cuộn xuống đáy | **2** (`Trạng thái` header, `Chưa xem` badge) | **0** |

Ảnh: `shot-m107-dau-trang.png` · `shot-m107-cuon-day.png` · `shot-m107-modal.png`.
Ghi chú trung thực: nút nổi cố định **vẫn** phủ góc dưới-phải ở đầu trang — đây là **giảm thiểu**,
không phải triệt tiêu; nhưng nay **mọi ô dữ liệu đều đọc được khi cuộn**, không còn ô nào bị che vĩnh viễn.

**2. Sự cố migration `0325` làm UI `:8787` KHÔNG khởi động được — ĐÃ SỬA**
`CONVERT(0x… USING utf8mb4)` là cú pháp chỉ-MySQL, trong khi `drizzle/*.sql` được áp cho CẢ SQLite (UI)
LẪN MySQL. Lỗi này đã bị push lên cả 2 nhánh trong `82d7ea8`.
Đã viết lại file cho chạy được trên cả hai; kiểm chứng `_test-mig0325.mjs` **8/8 ĐẠT**.

**3. Sự cố `Start-Process -ArgumentList` cắt đường dẫn theo dấu cách — ĐÃ SỬA**
node chết `Error: Cannot find module 'D:\13.'`. Nay dùng đường dẫn tương đối + `-WorkingDirectory`.

### Hạ tầng cuối vòng

```
:18081 UP (Java)   :8787 UP (UI)   :9000 UP (proxy)   GET / => 200 · 7456 bytes
Fingerprint UI: VNTECH-FP-86907EEC9FD2052F · BUILT ARTIFACT VALIDATION: ĐẠT
Bundle CSS: index-smd9uxFW.css 390.495 bytes | MOC107=84px: True
```

### Quyết định mới
* **D-036** — `drizzle/*.sql` phải chạy được trên CẢ SQLite VÀ MySQL.
* **D-037** — khởi động service bằng đường dẫn tương đối + `-WorkingDirectory`.
* **D-038** — mô tả thị giác là GỢI Ý, DOM là BẰNG CHỨNG.

### VIỆC CÒN LẠI (chưa xong)
1. **Commit + push** MỐC 107 + sửa `0325` + tài liệu lên `unity-p2-full-20260920` và `unity`
2. Chạy lại **5 cổng** (`node tools/verify-all.mjs`) sau khi build
3. Dọn tài khoản `sec_probe_*` còn sót trong `users`
4. Câu hỏi treo với người dùng: «gia hạn HĐ lần N» lưu thế nào
5. **MỐC 104** «Cơ sở vật chất & VVP» — CHƯA LÀM
6. **MỐC 105** UI chung toolbar ngang áp cho các màn khác — CHƯA LÀM
7. Dừng tunnel Cloudflare khi người dùng yêu cầu

---

## CẬP NHẬT 30/09/2026 (tiếp) — MỐC 108 · D-039 · LỆNH KHÔNG COMMIT

**MỐC 108 — ĐÃ ĐO ĐƯỢC.** Nút nổi gây **2 lỗi thật**; đo lại 7 cảnh báo thị giác ⇒ **chỉ 2 đúng**:

```
toast z-index            150  → 9600      mép phải toast bị che: TRUE → false
ô nhập cách mép modal    0px  → 18px      hộp modal cao: 481 → 509px
cột cuối cách mép phải   78px (không phải lỗi)   tràn ngang = false
```

**Sự cố công cụ (D-039):** script đo chạy `fetch` đăng nhập khi trang còn `about:blank`
(`readyState` đã là `"complete"`) ⇒ mất cookie phiên ⇒ báo `sidebar=0` **3 lần liền**, tưởng bản build
làm hỏng app. Chẩn đoán `_diag2.mjs` chứng minh **app KHÔNG hỏng** (đang ở màn đăng nhập, `body` 296 ký tự,
`log.error 401`). Đã sửa script: chờ **đúng gốc** + **in mã đăng nhập** + **kiểm giá trị `waitFor`**.

**Sự cố migration `0325` làm UI `:8787` chết** — đã sửa (viết lại đa hệ CSDL), `_test-mig0325.mjs` **8/8 ĐẠT**.

**⛔ LỆNH NGƯỜI DÙNG (m01935): «Không commit không push cho đến khi tôi yêu cầu».**
Toàn bộ thay đổi đang nằm ở working tree. Danh sách file chờ commit đã ghi ở mục MỐC 108 trong
`CHECKLIST.md` — lần sau commit theo ĐÚNG danh sách đó, **KHÔNG dùng `git add -A`**.

**Hạ tầng:** `:18081 UP` · `:8787 UP` · `:9000 UP` · `Fingerprint VNTECH-FP-C631E3D4936F84D5`.

### VIỆC CÒN LẠI
1. **MỐC 104** «Cơ sở vật chất & VVP» — CHƯA LÀM
2. **MỐC 105** UI chung toolbar ngang áp cho các màn khác — CHƯA LÀM
3. Dọn 6 tài khoản `sec_probe_*` còn sót trong `users`
4. Câu hỏi treo với người dùng: «gia hạn HĐ lần N» lưu thế nào
5. Dừng tunnel Cloudflare khi người dùng yêu cầu
6. Commit + push — **CHỜ LỆNH NGƯỜI DÙNG**

## MỐC 109 (30/09/2026) — ĐÃ SỬA XONG: nút «Sửa tài khoản» trả 403
- TASK: MỐC 109 — sửa 2 cổng chặn `update_user` cho tài khoản không phải admin.
- STATUS: DONE (đo được bằng test RBAC thật 14 bước + 15 phép chống hồi quy).
- FILES CHANGED:
  - `java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java` (bỏ `requireRequireAdmin` ở `case "update_user"`)
  - `java-backend/application/src/main/java/com/vntech/erp/application/service/UserManagementUseCase.java` (`guardRoleChange` cho qua khi vai trò không đổi)
  - `tests/moc-96-105-no-regression.test.mjs` (12 → 15 phép)
- DATABASE: không đổi schema. Dữ liệu thử đã dọn: probe `sec_probe_017830` giữ role `ksda`, active `1`, 60 quyền; quyền `admin_tab_01` ĐÃ thu hồi.
- API: không đổi hợp đồng. Chỉ đổi TẦNG CHẶN của `update_user`: admin HOẶC `admin_tab_01` + `canEdit`.
- TEST: `_test-rbac-update-user.ps1` → `TAT CA DAT` (exit 0); `node --import tsx --test tests/moc-96-105-no-regression.test.mjs` → 15/15 pass.
- BACKEND ĐÃ BUILD LẠI: JAR `91029958 B` lúc `10/01/2026 07:55:13`, `:18081` UP sau 10 giây, `_java-err.log` sạch.
- REMAINING: 5 việc cũ vẫn treo — MỐC 104 «Cơ sở vật chất & VVP» (spec gốc không còn trong tài liệu), MỐC 105 UI chung, dọn 6 tài khoản `sec_probe_*`, câu hỏi «gia hạn HĐ lần N», dừng tunnel Cloudflare.
- NEXT ACTION: cập nhật tài liệu + báo cáo; CHỜ LỆNH mới về commit/push (lệnh m01935: «Không commit không push cho đến khi tôi yêu cầu»).
- BLOCKER: không.

## MỐC 110 (01/10/2026) — ĐÃ SỬA XONG: nút «Báo lỗi / Góp ý» không dùng được với user thường
- TASK: MỐC 110 — `save_error_report` trả 403 «Thao tác chưa được khai báo quyền trong hệ thống» cho MỌI tài khoản không phải admin.
- STATUS: DONE (đo bằng 8 cổng API thật + 17 phép chống hồi quy + chạy lại 14 bước MỐC 109).
- ROOT CAUSE: `RbacService.requireActionModule` đổi nghĩa `List.of()` từ «không gác quyền» (PHASE 0B) thành «từ chối», trong khi registry + tài liệu nguồn (`ErrorReportModal.tsx:14`, `ErrorReportStore.java:20-23`) vẫn mô tả `save_error_report` là mở cho mọi user.
- FILES CHANGED:
  - `java-backend/application/src/main/java/com/vntech/erp/application/rbac/RbacService.java` (thêm `save_error_report` vào `PUBLIC_ACTIONS`; sửa lời khẳng định sai ở nhánh `required.isEmpty()`)
  - `tests/moc-96-105-no-regression.test.mjs` (15 → 17 phép)
  - `docs/dsh-state/CHECKLIST.md` + `CURRENT_STATE.md` + `TASK_HISTORY.md` + `DECISIONS.md`
- DATABASE: không đổi schema. Dữ liệu thử đã dọn: `error_reports` còn 0 dòng `PROBE MOC110%`.
- API: không đổi hợp đồng. Chỉ đổi TẦNG CHẶN của `save_error_report`: admin HOẶC mọi user đã đăng nhập.
- TEST:
  - `_test-error-report-rbac.ps1` → 8/8 ĐẠT, exit 0 (không đăng nhập 401; probe `bao_loi` 200; probe `gop_y` 200; admin 200; probe xem danh sách 403; probe tick 403; `retry_email` 403; admin xem danh sách 200).
  - `tests/moc-96-105-no-regression.test.mjs` → 17/17 pass.
  - `_test-rbac-update-user.ps1` (MỐC 109) → 14/14 ĐẠT, exit 0 ⇒ không hồi quy.
- BACKEND ĐÃ BUILD LẠI: JAR `91029975 B` lúc `01/10/2026 07:59:56`, `:18081` UP, `_java-err.log` 0 byte.
- REMAINING: 18 action mồ côi quyền + 2 mâu thuẫn `delete_partner`/`delete_supplier` (cần quyết định nghiệp vụ, đang ghi ở CHECKLIST dạng bảng); dọn 6 tài khoản `sec_probe_*`; MỐC 104; MỐC 105; SMTP; gia hạn HĐ lần N; dừng tunnel Cloudflare.
- NEXT ACTION: dọn tài khoản thử `sec_probe_*`; chờ anh ra lệnh commit + push (AUTO_COMMIT=FALSE, AUTO_PUSH=FALSE).
- BLOCKER: không.
- GIT (01/10/2026, đã trả lời anh): bản sửa MỐC 104 «gom nhóm `system_admin` lên đầu ma trận» **ĐÃ push** — commit `4fc75a0` có trong `origin/unity` và `origin/unity-p2-full-20260920`; nhánh hiện tại đồng bộ sạch remote. MỐC 109/110 **CHƯA** commit/push.

## DỌN TÀI KHOẢN THĂM DÒ (01/10/2026) — DONE
- TASK: xoá 6 tài khoản `sec_probe_*` do MỐC 109/110 tạo ra.
- STATUS: DONE. Đo tham chiếu trước khi xoá: `user_module_permissions` 360, `sessions` 20, `audit_logs` 16, `user_project_scopes` 4; **mọi bảng nghiệp vụ = 0**; **không FK nào trỏ `users.id`**.
- DATABASE: xoá trong 1 transaction → `users` **20 → 14** (đều là tài khoản thật). `error_reports` còn 0 dòng `PROBE MOC110%`.
- Xác minh sau dọn: không đăng nhập ⇒ 401; admin ⇒ 200; `GET /api/system` ⇒ `moduleCatalog=76`, `users=14`, `employees=1`, `projects=3`, `businessScopes=9`, `engineRoleProfiles=9`.

## ĐIỀU TRA 2 CỔNG GATE ĐỎ (01/10/2026) — 1 ĐÃ SỬA, 1 CHỜ QUYẾT

### A. `test:regression` — ĐÃ SỬA, CỬA XANH
- TRIỆU CHỨNG: 3/7 ca đỏ trong `tests/pr01-project-tabs.test.mjs` (dải nhãn tab, thẻ tổng hợp, chỉ số BCH).
- BISECT 230 commit: PASS ở `7fdf71d` (27/09) → FAIL ở `4fc75a0` (29/09, MỐC 96-104, **đã push**).
- NGUYÊN NHÂN: `4fc75a0` **hạ test về hợp đồng cũ** (`DETAIL_TABS` 5→4 phần tử, BCH `tab===5`→`tab===4`,
  thêm đòi `<ProjectAggregateTabs data={data}`) mà **không sửa `app/page.tsx`** cho khớp.
- BẰNG CHỨNG MÃ NGUỒN ĐÚNG: bản test `7fdf71d` chạy **7/7 PASS** trên `app/page.tsx` hiện tại.
  `app/page.tsx` tự nhất quán: `DETAIL_TABS` 5 phần tử ⇒ `TAB_LABELS[5]` = "Ban chỉ huy" ↔ `{tab === 5 && <SiteCommandScreen`.
- FILES CHANGED: `tests/pr01-project-tabs.test.mjs` (khôi phục byte-identical, `git hash-object` = `2f332e9`). **KHÔNG** sửa `app/page.tsx`.
- TEST: `test:regression` **69/69 XANH (exit 0)** · `tests/moc-96-105-no-regression` **17/17** · `typecheck` **0**.
- QUY TẮC MỚI: `DECISIONS.md` **D-044**.

### B. `verify:fingerprint` — HỎNG CÓ SẴN TOÀN LỊCH SỬ, CHỜ LỆNH
- TRIỆU CHỨNG: `expected c631e3d4… / actual 3d378863…`.
- ĐO BẰNG `git archive` TỪNG COMMIT (không đụng working tree):
  FAIL ở `HEAD`, `HEAD~5`, `4fc75a0`, `ffe20f9`, `128c021` ⇒ **hỏng có sẵn ở mọi commit**, không riêng commit nào.
- KHÔNG phải do MỐC 109/110: `java-backend/` **không** nằm trong `ROOT_DIRS` nên không được băm.
- VÒNG LẶP GỐC: `tools/refresh-phase-identity.mjs` ghi fingerprint mới **vào chính `drizzle/`** (một trong `ROOT_DIRS`)
  ⇒ sinh file mới ⇒ đổi hash ⇒ cần refresh lần nữa. Hai migration `0326_*` và `0327_*` trùng nhãn
  `moc107-fab-khong-che-bang`, mỗi file nhúng một giá trị khác nhau (`86907eec…` / `c631e3d4…`).
- `verify:master-baseline` vẫn **ĐẠT**.
- **CHƯA SỬA** vì đụng bộ identity (`VNTECH_*.txt`, `VNTECH_FINGERPRINT.json`, `lib/vntech-identity-data.mjs`)
  — tài liệu dự án ghi rõ là **cấm đụng tay**; chỉ dùng được tool chuẩn. Cần anh quyết (xem Telegram).

### C. BLOCKED — USER CONFIRMATION REQUIRED (TYPE 3)
- **Câu hỏi**: yêu cầu 28/09 «4 thẻ danh sách TỔNG HỢP không bị khoá theo dự án» — giữ hay bỏ?
- **Vì sao treo**: màn chi tiết dự án đã được MT3 (`7fdf71d`, 27/09) dựng lại thành 5 tab **theo dự án**;
  `app/screens/ProjectAggregateTabs.tsx` (14 502 B) thành **mã chết**. `4fc75a0` cố mã hóa yêu cầu này bằng cách sửa **test**
  thay vì sửa **mã** ⇒ test đỏ 3 ca ngay tại commit đó.
- **Phương án A (khuyến nghị)**: giữ cấu trúc 5 tab hiện tại, coi yêu cầu 28/09 là **đã bị thay thế** bởi MT3
  ⇒ đóng yêu cầu, xoá mã chết. Không đụng mã đang chạy.
- **Phương án B**: giữ yêu cầu ⇒ phải sửa **mã** dựng lại thẻ tổng hợp ở nhánh danh sách + tab BCH lùi về `tab === 4`.
  Đây là đảo ngược một phần MT3, cần chuẩn ảnh chụp mới.
- **Ảnh hưởng kỹ thuật**: A = xoá 1 file mã chết; B = sửa `app/page.tsx` + `ProjectDetailTabs` + test contract.

---

## MỐC 111 (01/10/2026) — SỬA XONG LỖI PHÂN QUYỀN KHÔNG LƯU · trạng thái đang chạy

**Đề của anh đã xử lý xong và kiểm chứng 11/11.** Hai modal phân quyền giờ lưu đúng.

- **Nguyên nhân gốc (đã chứng minh, không suy đoán):** `UserEditModal` có 2 thẻ nhưng **một** handler,
  gọi `update_user` **vô điều kiện** trước. Ở thẻ *Phân quyền* không có ô tài khoản và `PermissionMatrix`
  không đặt `name` ⇒ `update_user` trả **400** ⇒ `return` sớm ⇒ `save_user_access` **không bao giờ chạy**.
  Chiều ngược lại, thẻ *Tài khoản** gửi `projectScopes=[]` ⇒ **xoá sạch phạm vi dự án**.
- **Đã sửa:** mỗi thẻ chỉ lưu đúng phần nó sở hữu. Backend chặn **400** khi `modulePermissions` rỗng
  (trước đó xoá 3 bảng rồi vẫn trả 200 *«Đã lưu quyền hiệu lực»*).
- **Cổng:** `typecheck` 0 · `test:regression` **69/69 XANH** · `mvn package` exit 0 · `:18081` UP (JAR 10:07) ·
  `verify:master-baseline` ĐẠT.
- **DB về đúng mốc gốc:** `user_module_permissions` **1226** · `nvdademo` **60** · `user_project_scopes` **13** ·
  `user_warehouse_scopes` **9** · `users` **14**.
- **Chưa commit / chưa push** (theo yêu cầu của anh).
- **Còn treo (FOLLOW-UP, xem `CHECKLIST.md` § MỐC 111):** 5 ca test Java đỏ do schema H2 thiếu `job_rank`
  (**có sẵn, không do MỐC 111**).

## MỐC 112 — 3 lỗi còn tồn trong `save_user_access` — **DONE** (01/10/2026)
- **Nguyên nhân sâu (3 lỗi trong cùng hàm):**
  1. `permission_expires_at` **hard-code `NULL`** trong adapter ⇒ cột *Hết hạn* không bao giờ có dữ liệu.
  2. `permission_source` **luôn `'department_default'`** — biến `source` tính ở `UserManagementUseCase:303`
     rồi **bỏ không** ⇒ `deleteModuleOverride` lọc `manual_override` nên **không xoá được gì**
     ⇒ nút *«Xóa ngoại lệ cá nhân» là nút chết*.
  3. `ON DUPLICATE KEY UPDATE` **không cập nhật `permission_expires_at`** ⇒ bỏ hạn thì hạn cũ treo vĩnh viễn.
- **Thiếu nguyên tử:** `clearUserScopes()` commit trước, insert lỗi sau ⇒ mất trắng. Sửa bằng
  `store.runAtomically(Runnable)`, **adapter** mở `@Transactional` (không đặt ở use-case — module
  `application` cố ý không phụ thuộc Spring).
- **Khoảng trống hai đầu phát hiện thêm:** UI chưa hề có ô nhập — `PermissionMatrix` chỉ hiện `<span>` chỉ đọc,
  còn cả hai modal đều đọc `form.get('expires-<module>')` ⇒ luôn `null`. Thêm cờ tùy chọn `expiryEditable`
  (mặc định **false** — không đổi hành vi nơi khác) và bật ở `UserEditModal`.
  `UserAccessModal` **không có cột «Hết hạn»** ⇒ chưa bổ sung, cần anh quyết.
- **⚠️ Lỗi múi giờ đã bắt & sửa:** ngày hạn neo theo UTC bị MySQL đổi `+7` ⇒ chọn `30/06` lưu thành
  `30/06 07:00`, quyền hết hạn **muộn một ngày**. Đổi sang neo theo múi giờ máy chủ ⇒ `2027-06-30 00:00:00.000`.
- **Kiểm chứng `_verify-moc112.mjs` — 8/8 ĐẠT**, đọc ngược **thẳng MySQL**: hạn dùng ghi đúng · bỏ hạn thì xoá được ·
  nguồn `manual_override` · nút xoá ngoại lệ xoá thật (1 → 0).
- **Hồi quy:** MỐC 111 **11/11 ĐẠT** · `test:regression` **69/69 XANH** · `typecheck` 0 · `mvn package` exit 0 ·
  `verify:master-baseline` ĐẠT · `:18081` UP (JAR 10:24).
- **DB về đúng mốc gốc:** `user_module_permissions` **1226** · `testuser86661` **59** · `user_project_scopes` **13** ·
  `user_warehouse_scopes` **9** · `users` **14**.
- **Chưa commit / chưa push** (theo yêu cầu của anh).

---

## Cập nhật 2026-10-01 — sau MỐC 114a → 114f

**Mốc đã xong trong đợt này (MỐC 114–118, 5/5):**

| Mốc | Nội dung | File chính |
|---|---|---|
| 114 | Bổ sung dấu tiếng Việt cho UI + tài liệu | `app/screens/*.tsx`, `CHECKLIST.md` |
| 114a | Bảng nhãn tiếng Việt cho import hàng loạt (user + project) | `lib/admin-bulk-import.ts` |
| 115 | Thống nhất 3 modal chi tiết dùng chung panel hiển thị | `app/components/ui/EntityDetailModal.tsx` |
| 116 | Sửa nhãn lỗi chính tả trong modal dự án / danh bạ nhóm | `ProjectEntityModal.tsx`, `TeamDirectory.tsx` |
| 118 | Chặn nhóm `system_admin` trong menu (1 panel dùng chung + 3 test) | `PermissionAccessPanel.tsx`, `tests/m118-*.mjs` |

**MỐC 114e — đính chính một kết luận đã ghi quá đà.**
114c từng khẳng định «0 văn xuôi thiếu dấu còn lại». **Sai.** Kiểm lại phát hiện
`CHECKLIST.md:1039-1061` vẫn còn ~10 dòng thiếu dấu. Đã vá **14 dòng**, trong đó 2 dòng là **ảnh chụp
cũ đã cũ** được cập nhật theo hành vi hiện tại (`RbacService.java:83` đã trả thông báo có dấu; đối
chiếu CSDL cho thấy `users.nvdademo.full_name` = `Nhân viên Dự án E`). Hai bảng đã chốt "0" trong
`CHECKLIST.md:3601` và `TASK_HISTORY.md:527` được gạch bỏ và ghi lại là **SAI**.

**MỐC 114f — `npm run build` đang bị chặn, CHỜ USER QUYẾT.**
- **App vẫn chạy bình thường:** dev server `:9000` (và `:8787`) phục vụ mã nguồn mới nhất, HTTP 200,
  log lỗi rỗng; backend Java `:18081` `/api/health` trả `{"ok":true,…}` ⇒ **không có lỗi biên dịch**.
- **`npm run build` dừng ở cổng fingerprint** (`verify-vntech-fingerprint.mjs:29`):
  `expected c631e3d4…` vs `actual f2447843…`. Nguyên nhân là MỐC 114–118 đã sửa `app/`, `lib/`,
  `tests/`, `drizzle/`, `package.json` — đều là input của hash nên đổi là **đúng và có chủ đích**.
- Cách mở cổng cần một migration `identity_refresh` mới + cập nhật `lib/vntech-identity-data.mjs`,
  mà điều đó `UPDATE` bảng production `vntech_product_identity` / `vntech_trust_settings`.
  **Không tự quyết — chờ anh chọn.**

**Cổng kiểm hiện tại:** `lint` **223 problems / 2 errors** (đúng mức nền) · `typecheck` 0 ·
`test:regression` **72/72** · 4 file `docs/dsh-state/*.md` đều BOM=false, FFFD=0.

**Chưa commit / chưa push** (theo yêu cầu của anh).

## 2026-10-01 — MỞ CỔNG FINGERPRINT, BUILD THÀNH CÔNG, VÀ SỬA SỰ CỐ MÀN BOOT KẹT

Anh yêu cầu `build đi để tôi check`. **`npm run build` → `BUILD_EXIT=0`**, cả 5 cổng ĐẠT.
Lý do trước đây bị chặn (nhận định sai từ `114f`) đã hiệu chính: **không cần migration mới**.

| Mục | Giá trị |
|---|---|
| sourceFingerprint | `f24478438ea56e360d17fce83b77eece80282be1f539ab182dd06db497f92f3e` |
| sourceFingerprintShort | `VNTECH-FP-F24478438EA56E36` |
| brandFingerprint | `66e253f229915d9fd40c3a8ec10a51e237b5fb3bfbe4c4f92cb098cfa4548def` |
| releaseFingerprint | **không đổi** (không phụ thuộc source) |
| Số tệp băm | 690 |

**Files changed:** `lib/vntech-identity-data.mjs` · `VNTECH_FINGERPRINT.json` ·
`drizzle/0327_phase_gd_moc107_fab_khong_che_bang_identity.sql` (nội dung file, **không** chạy lên DB).

### Sự cố màn boot kẹt — đã sửa (xem `TASK_HISTORY.md` mục `114h`, `DECISIONS.md` mục `D-052`)

Asset 404 do build ghi đè `dist/` + `local-runtime.mjs:177` từ chối chạy vì hash lưu trong
SQLite cục bộ lệch SSOT. Đã UPDATE metadata identity cục bộ (sao lưu `.bak-20261001`), dọn
Vite còn sót trên `:9000`, khởi động lại đúng stack.

**Trạng thái hiện tại — app ĐANG CHẠY:**

| Cổng | Tiến trình |
|---|---|
| `:9000` | `tools/cutover-proxy.mjs --port 9000 --ui-port 8787 --api-port 18081` |
| `:8787` | `scripts/local-server.mjs` (UI Node) |
| `:18081` | Java backend |

Đo thật qua `:9000`: asset **200** · `/api/system` **401** · đăng nhập `admin` **HTTP 200** ·
bootstrap **104 khoá**. Đăng nhập `admin / Admin123456@`.

> ⚠️ **Không chạy `npm run build` khi app đang mở** — sẽ 404 toàn bộ JS/CSS. Tắt app trước, build xong mở lại.

**Việc dở dang — MỐC 114 (anh đã cho dừng để build):** còn 3 ứng viên đã sàng lọc, **chưa vá**:
`lib/ui-shared.tsx:347` `sheetName:"Ton kho"` → `Tồn kho` (chắc chắn là lỗi);
`app/page.tsx:1447-1448` `Nhập: XOA N`; `app/page.tsx:1713,1723` `KHOI PHUC CAI DAT GOC`.
Hai token sau **phải sửa đồng thời cả vế hiển thị lẫn vế so sánh**, và **phải kiểm tra backend có
so sánh chuỗi tương ứng hay không** — nếu không rõ thì để nguyên.

## Trạng thái sau MỐC 119 (01/10/2026) — CSDL đã lên v34, app KHÔNG cần build lại

- **Flyway schema = `v34`** (V32 MỐC 113 · V33 MỐC 114 · V34 MỐC 119 đều đã áp thành công).
- **`module_catalog`: 0 nhãn còn dấu `?`** — 16 mục đã sửa đúng (13 nhãn + 1 icon), xác minh qua
  HTTP thật `/api/system`. Không mất dòng nào (vẫn 76 module).
- ⏸ **Tên 2 kho thiếu dấu vẫn giữ nguyên** — đã gỡ khỏi V33, chờ anh quyết định (dữ liệu nghiệp vụ).
- **Dải tab modal tài khoản** đã đổi sang một dải ngang ôm sát nhãn, giống tabbar hồ sơ nhân sự.
  Sửa CSS ⇒ **F5 là thấy**, không cần build.
- **Cổng kiểm:** typecheck 0 · regression 72/72 · lint 223/2 (đúng gốc).

> ⚠️ Lưu ý dự án này **không có Maven trên máy này** — không `mvn test`, không build lại jar.
> Đổi Java phải chờ chạy trên máy có Maven. Xem `D-054` cho cách áp migration thay thế.

## Sau MỐC 119c (01/10/2026) — ĐÃ CHẠY LẠI, SẴN SÀNG ĐỂ XEM

- **Vân tay nguồn: `VNTECH-FP-2DDAB683B062EFE6`** (đổi từ `F2447843EA56E36`) — hệ quả tất yếu
  của việc sửa `app/styles/canonical.css`. SSOT, `VNTECH_FINGERPRINT.json`,
  `VNTECH_PRODUCT_IDENTITY.txt` và SQLite cục bộ đã đồng bộ. Chi tiết: `D-055`.
- **Đã build lại `dist/`** và khởi động lại `:8787` (PID mới 22476). Proxy `:9000` và Java `:18081`
  **không bị đụng**.
- Đo qua `:9000`: 8 asset **200** · đăng nhập **200** · bootstrap **76 module** ·
  `receiving` = «Kế hoạch giao hàng» · nhãn hỏng **0** · icon `HĐ` ✅
- Sao lưu SQLite: `.local-data/warehouse.sqlite.bak-fp-20261001`.
- Cổng kiểm: typecheck 0 · regression 72/72 · lint 223/2 (đúng gốc).

> ⚠️ **Lần sửa mã nguồn nào sau mốc này cũng phải chạy lại chuỗi vân tay `D-055`**, nếu không
> lần build sau sẽ bị cổng chặn.

## Sau MỐC 120 (01/10/2026) — HAI MODAL PHÂN QUYỀN ĐÃ ĐỒNG NHẤT

- **Vân tay nguồn: `VNTECH-FP-F0AF369533F385B2`** (đổi từ `2DDAB683B062EFE6`). Cổng `D-055`
  đã chạy lại đầy đủ; hội tụ **2 vòng**.
- **Đã build và chạy lại** `:8787`. Proxy `:9000` + Java `:18081` không bị đụng.
- Modal **Sửa tài khoản** (thẻ *Phân quyền công việc / Chức năng*) giờ có **cùng cấu trúc** với
  modal **Phân quyền** của tab 6: cùng bọc trong `.modal-body`, cùng panel, cùng vùng cuộn.
- Ba yêu cầu của USER 01/10/2026 đã xong: xoá note *MỐC 39* · cuộn được cả thẻ · hai tab cùng
  giao diện. Nguyên nhân gốc: panel nằm ngoài `modal-body` — xem `D-056`.
- Cổng kiểm: typecheck 0 · regression 72/72 · lint 223/2 (đúng gốc) · build exit 0.

> ⚠️ Lần sửa mã nguồn nào sau mốc này cũng phải chạy lại chuỗi `D-055`, nếu không lần build
> sau sẽ bị cổng chặn.
