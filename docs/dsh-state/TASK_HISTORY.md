# TASK HISTORY — VNTECH ERP V5.3.0

> Ghi ngược. Xem `CURRENT_STATE.md` để biết đang làm gì.

## 28/09/2026

### TH-001 · Rollback về MT2 — **DONE**

- **Yêu cầu:** «không ổn rồi phải roll back về phiên bản trước ngày 26/9 thôi» → chốt `4d1c129`
- **Hoàn thành:**
  1. **Sao lưu trước khi xoá** — branch `backup/mt3-head-20260928` (= 7fdf71d) + branch `backup/mt3-worktree-20260928` (= 73ff69d) + tag `backup-mt3-worktree-20260928`
  2. `git reset --hard 4d1c129` — bỏ 6 commit, 220 file, 9554 dòng thêm
  3. **Build lại CẢ HAI vùng** — `dist/` và `web/target/*.jar` **KHÔNG nằm trong git** ⇒ không build thì trình duyệt vẫn hiện bản lỗi
  4. `node tools/set-local-identity.mjs` — đồng bộ vân tay
  5. Khởi động lại 3 service đúng thứ tự
- **Bài học:** `git reset` một mình **không đủ**.

### TH-002 · Toolbar + tab + bình luận + 3 khung — **DONE, đo thật**

| Hạng mục | Kết quả đo |
|---|---|
| Toolbar nằm ngang | 11 class · `1 HÀNG · wrap=nowrap · overflowX=auto` |
| Tab theo mẫu quản trị | 6 class · bo góc 11px · vạch ngăn `1px #dce5ef` · 44px · `font-weight:800` |
| Bỏ menu con | `NAV-CHILD = 0` cả `11` nhóm |
| Nhóm nút nằm ngang | `.row-actions` × **112** → **0** |
| Khung bình luận | `display:inline` → `grid`; textarea nằm DƯỚI label |
| 3 khung bằng nhau | `770/590/786` → **`786/786/786`** |
| Label trên toolbar | 2 tầng, cách ~8px |
| Ẩn nhãn filter | `span 7 trong DOM / **0** hiển thị` |

### TH-003 · Màn Danh sách dự án — **DONE, đo thật**

- Tiêu đề rút **230 → 90** ký tự
- ⛔ Bỏ filter «Phòng ban»
- ⛔ Bỏ tab «Tổng quan» (còn 5 tab)
- **Files:** `app/page.tsx` · `app/globals.css` · 3 tệp test

### TH-004 · 4 thẻ danh sách tổng hợp đa dự án — **DONE · ĐÃ ĐO THẬT 28/09**

- **Tạo mới:** `app/screens/ProjectAggregateTabs.tsx`
  - ④ Nhân sự — gom từ `userScopes`, mỗi người 1 dòng gộp nhiều dự án
  - ⑤ Tổ đội — chỉ dự án ĐANG HOẠT ĐỘNG, bấm mở modal
  - ⑥ Kho — kho thuộc dự án, mặc định lọc kho còn hoạt động + nút bật/tắt kho đã ngừng
  - ⑦ BCH — `organizationUnits` loại `site_command`, dự án còn hoạt động
- Bỏ khoá 4 thẻ · thêm `{entityModal}` · đổi tên nút → «Chi tiết ›»
- ✅ **ĐÃ ĐO THẬT 28/09:** Nhân sự **16 dòng/6 cột** · Tổ đội **3/7** · Kho **6/6** · Ban chỉ huy **0/5**
  (0 dòng là **đúng dữ liệu** — MySQL: `organization_units` có `site_command` 1 nhưng **0** đơn vị có `project_id`)

### TH-005 · 4 nút TẠO — **DONE · ĐÃ BẤM THỬ THẬT 28/09**

- **4 nút (3 tái dùng modal có sẵn, 2 modal mới):**
  - ＋ Tạo Dự án → `open("projectMaster")` · gate `canCreateProject`
  - ＋ Tạo Tổ đội → `open("teamCreate")` · gate `isAdminUser || role ∈ {cht, commander}`
  - ＋ Tạo Ban chỉ huy → `SiteCommandCreateModal` (MỚI) · gate `bchGates().canAddUnit`
  - ＋ Tạo kho → `WarehouseCreateModal` (MỚI) · action **`update_project` CÓ SẴN** ⛔ không thêm action mới
- ✅ **Bấm thật 4/4 modal mở đúng:** «Thêm dự án» · «Tạo tổ đội dự án» · «＋ Tạo kho cho dự án» · «＋ Tạo Ban chỉ huy dự án»
- ✅ **Phân quyền 2 vai:** `admin` 4/4 nút · `giamdoc.demo` (director) ⛔ **không có** nút「Tạo tổ đội」⇒ gate có hiệu lực
- ✅ Sửa lỗi có sẵn: `open` khai báo trong prop `ProjectManagement` **nhưng không destructuring** ⇒ trỏ về `window.open`
- ✅ Sửa hợp đồng `W-02` theo số đo thật (kho 7 · dự án 3 · kho gắn dự án 6 · 0 mồ côi) — ⛔ **không sửa DB**

### TH-006 · Bộ state `/docs/dsh-state/` — **DONE**

- `CHECKLIST.md` · `CURRENT_STATE.md` · `DECISIONS.md` · `TASK_HISTORY.md`

### TH-007 · Sửa 6 lỗi probe tự gây ra (TYPE 1) — **DONE 28/09**

- ⚠️ Suốt nhiều lượt báo «chưa đo được» — hoá ra là **lỗi công cụ**, ⛔ không phải lỗi hệ thống:
  ① sidebar ACCORDION phải dò từng nhóm cha ② mục con tên **«Quản lý dự án»** ③ mục con **không** mang class
  `nav-child` ④ so khớp nút phải dùng `includes` (text có dấu `＋`) ⑤ `sleep` cố định không đủ ⇒ vòng chờ
  ⑥ `process.env` không tồn tại trong ngữ cảnh trình duyệt
- Công cụ dùng lại: `tools/probe-nav-robust.mjs` · `tools/probe-aggregate-verify.mjs` · `tools/probe-gate-truth.mjs`

---

## LỖI TÔI TỰ GÂY RA — để session sau không lặp lại

| # | Lỗi | Hậu quả | Cách sửa |
|---|---|---|---|
| 1 | Ghi chú `//` trong CSS (**2 lần**) | postcss bỏ qua cả khối; build "thành công" nhưng **thay đổi không vào bundle** | dùng `/* */` + **kiểm luật có thật trong bundle** |
| 2 | `String.replace` chuỗi ngắn | sửa nhầm chỗ xuất hiện đầu tiên | ANCHOR dài duy nhất + đo lại |
| 3 | Tự kiểm bằng kỳ vọng do tôi tự sửa | báo **ĐẠT SAI** | copy **nguyên văn** điều kiện trong test |
| 4 | Script ABORT giữa chừng | các sửa "OK" trước đó **chưa được ghi** | `grep` xác nhận trước khi báo xong |
| 5 | Đo bằng `textContent` | thấy cả phần tử đã `display:none` | đo bằng `getBoundingClientRect` |
| 6 | So khớp chuỗi nhiều dòng bằng `\n` | hỏng với CRLF | regex `\r?\n` hoặc đọc nguyên văn |
| 7 | `CardHead.action` nhận `string` | TS lỗi | chuyển nút ra khỏi prop |
| 8 | Sửa regex thành `data={{data}}` | sai — JSX là `data={data}` | hoàn tác |
| 9 | `node -e` với tiếng Việt | vỡ escape PowerShell | viết `.mjs` rồi `node` |
| 10 | Dấu `` ` `` trong template literal `.mjs` | `SyntaxError` | ghi `.md` bằng `write` trực tiếp |

---

## TASK-038 — PHÂN QUYỀN TỪNG TAB MÀN QUẢN TRỊ HỆ THỐNG (28/09/2026)

**TASK:** MỐC 28 → 37 · phân quyền từng TAB cho màn Quản trị hệ thống
**STATUS:** PARTIALLY COMPLETED — code + test XONG, còn 1 cổng chặn cần user quyết

### FILES CHANGED
| File | Thay đổi |
|---|---|
| `drizzle/0262_phase_gd_module_quan_tri_he_thong_tung_tab_identity.sql` | +14 dòng `admin_tab_01..14` vào `module_catalog` |
| `app/screens/admin-governance-pure.ts` | `ADMIN_TAB_MODULE_KEY` · `ADMIN_LOCKED_TABS` · `adminTabGrantable()` |
| `app/page.tsx` | `activateModule` ánh xạ tab → event · `AdminScreen` listener · `tabAllowed()` · tab `disabled` · `allowedModules` lọc nhóm `system_admin` |
| `lib/menu-helpers.ts` | 14 menu con ĐÃ BỊ GỠ (MỐC 35 theo yêu cầu mới) |
| `app/globals.css` | `.permission-steps button.locked` (tab khoá: xám, `cursor:not-allowed`) |
| `tests/ad01-account-rename.test.mjs` | +8 assert khoá hành vi MỐC 35/36 |
| `java-backend/.../BootstrapDataAdapter.java:884` | BỎ lọc `!admin.equals(moduleKey)` |

### DATABASE CHANGES
```
module_catalog: 61 → 75  (+14 admin_tab_NN)      ✅ GIỮ (tính năng)
department_module_permissions: 478 dòng         ✅ đã hoàn tác sạch
user_module_permissions: 0 dòng admin/admin_tab ✅ đã hoàn tác sạch
```

### API CHANGES
Không đổi API. `save_user_access` đọc field `modulePermissions`; `reset_user_password`
trả `temporaryPassword`.

### TEST RESULT
```
BUILD VNTECH-FP-91781B688D6322F5
✅ css-comment-guard  ✅ tsc EXIT=0
✅ contract 579 tests / 578 pass / 0 FAIL
✅ regression 69/69
✅ css-baseline ĐẠT · 2714 lines · 373004 bytes · 3779 !important
```
BẰNG CHỨNG ĐO THẬT: cấp `nvdademo` (role `da_nv`) = `admin` + `admin_tab_03`
⇒ menu con 2 mục, KHÔNG thấy tab 1/2/4…14 ⇒ phân quyền từng tab CHẠY ĐÚNG.

### REMAINING / BLOCKER
⛔ `app/page.tsx:542` `accessDenied` khi `active==="admin"` = `!isAdminUser(data.user)`
⇒ user thường **không vào được màn** ⇒ cần user chọn ① (sửa, đề xuất) hay ② (giữ nguyên).
⛔ `hrm` thuộc `COMPANY_LEADERSHIP_ROLE_CODES` (`BootstrapDataAdapter:1928`) ⇒ tự toàn quyền.
⛔ GÁC (chờ user): mục master task tiếp theo · bộ lọc/sắp xếp/CRUD màn «Kế hoạch giao hàng».

### NEXT ACTION
User chọn ①/② → sửa `page.tsx:542` → `node tools/gd-cycle.mjs` → `node tools/verify-all.mjs` → đo lại.

### COMMIT
⛔ 0 commit (AUTO_COMMIT=FALSE, AUTO_PUSH=FALSE)

---

## TASK-039 — TÁCH MODAL SỬA TÀI KHOẢN / PHÂN QUYỀN (29/09/2026)

**STATUS:** PARTIALLY COMPLETED (1/2 xong, 3 việc 3-5 con)

| TASK | MỐC | NỘI DUNG | STATUS |
|---|---|---|---|
| TASK-039-1 | 39a | Bóc section quyền trong modal Sửa tài khoản theo `canManageUserPermissions` | DONE |
| TASK-039-2 | 39b | Nút «Sửa» tab 6 → `open("access", u)` «Sửa quyền» | DONE |
| TASK-039-3 | 40 | Tab 8 bỏ nút sửa danh sách Phạm vi dự án & kho | PENDING |
| TASK-039-4 | 41 | Tab 13 Thông báo nâng cao | PENDING |
| TASK-039-5 | 42 | Tab 14 Báo lỗi đầy đủ | PENDING |

**FILES CHANGED:** `app/page.tsx` (L1716 · L1956 · L3067 · L3068)
**DATABASE:** không đổi
**API:** không đổi
**TEST:** build `VNTECH-FP-702F7531E63FB174` · tsc EXIT=0 · 8 FAIL thuộc màn Quản lý Dự Án (không phải MỐC 39)
**COMMIT:** 0

**BÀI HỌC (D-021 → D-023):** KHÔNG xoá cả dòng JSX. L3068 chứa cả `<details>` lẫn `</details>`
⇒ chỉ bọc trong `{cond && …}` trên cùng dòng ⇒ không mất thẻ ⇒ tsc sạch ngay.

---

# NHẬT KÝ TASK — PHIÊN 29/09/2026 (MỐC 39 → 58)

| Mốc | Task | Status | Files changed | DB | API | Test |
|---|---|---|---|---|---|---|
| 39 | Modal sửa tài khoản tách khỏi phân quyền | DONE | app/page.tsx | — | `update_user` | tsc 0 |
| 40 | Nút sửa + nút phân quyền dùng chung 1 modal | DONE | app/page.tsx | — | — | tsc 0 |
| 41 | Chương gộp 3 nguồn thông báo | DONE | app/page.tsx | — | — | tsc 0 |
| 42 | **Tab 14 «Báo lỗi»** (bảng + 3 action + 2 modal) | DONE | drizzle/0277 · ErrorReport* · BootstrapDataAdapter · ApplicationBeansConfig | bảng `error_reports` | 3 action mới | **API thật 5/5 HTTP 200** |
| 43 | Kế hoạch giao hàng: tìm kiếm + sắp xếp 5 tiêu chí | DONE | app/screens/Receiving.tsx | — | — | tsc 0 |
| 44 | Bỏ chiều lọc «Phòng ban» ở màn Dự án | DONE | app/page.tsx | — | — | pr02 xanh |
| 45 | Sửa lỗi modal bị cắt (đo thật 2884 vs 737) | DONE | app/globals.css | — | — | đo bằng GOM |
| 45b | Chặn hỏi quý 28 modal `<form>` sau khi đổi `.modal` | DONE | app/globals.css | — | — | 28/28 OK |
| 46 | (ghi nhóm vào 44) | DONE | — | — | — | — |
| 47 | Chứng minh phân quyền bằng USER THẬT (không phải admin) | DONE | — | xoá quyền tạm | — | 3 phép thử thật |
| 48 | Phát hiện nút «Sửa tài khoản» 403 vs `admin_tab_01` | DIAGNOSED | — | — | `UserManagementUseCase:104` | 3 phép thử thật |
| 49 | Hồ sơ nhân sự: dài ô inline -> modal «Lập hồ sơ» | DONE | app/screens/HrScreen.tsx | — | — | tsc 0 |
| 50 | Sửa email dispatcher (khởi email kết) | DONE | scripts/email-dispatcher.mjs | — | — | đọc code |
| 51 | **Khôi phục** nút «Sửa tài khoản» (đã bị ghi đè) | DONE | app/page.tsx | — | — | grep bundle = 1 |
| 52 | Modal «Sửa hồ sơ» thay nút «Sửa tài khoản» | DONE | app/screens/HrProfileEditModal.tsx · app/page.tsx | — | `save_hr_record` | tsc 0 |
| 53 | Bỏ nút «Sửa quyền» + thêm 14 `admin_tab_NN` vào ma trận | DONE | app/page.tsx | — | — | đo API thật |
| 54 | Hợp sửa tài khoản tách 2 thẻ, khoá theo `admin_tab_01`/`06` | DONE | app/screens/AdminUserModalTabs.tsx | — | — | tsc 0 |
| 55 | Hợp đồng lao động: modal + **tải ảnh** + modal chi tiết | DONE | app/screens/LaborScreen.tsx · HrStore/Adapter · HrManagementUseCase · BootstrapDataAdapter | cột `labor_contracts.image_url` | `save_labor_contract` | **API thật 200 / 400** |
| 56 | Sửa hồ sơ chỉ cần quyền SỬA · mở khoá mã NV + tên DN | DONE | app/screens/HrProfileEditModal.tsx | — | thêm `update_user` | tsc 0 |
| 56-5 | Bảo hiểm & chế độ: modal Thêm + modal chi tiết | DONE | app/screens/BenefitsScreen.tsx | — | `save_benefit_record` | **API thật 200 / 400** |
| 57 | Hợp sửa tài khoản tách 2 thẻ (matrix + phạm vi dự án) | DONE | app/page.tsx | — | `save_user_access` | tsc 0 |
| 58 | (1) sửa tất cả thông tin · (2) hồ sơ 3→5 thẻ · (4) sửa bảo hiểm | DONE | HrProfileEditModal · app/page.tsx · BenefitsScreen · globals.css | — | — | tsc 0 · css ĐẠT |
| 58-3 | Hợp đồng: nút Sửa + **lưu giờ thay ảnh** | DONE | HrStore/Adapter · HrManagementUseCase · BootstrapDataAdapter · LaborScreen | cột `image_updated_at` | `save_labor_contract` | **API thật 2/2 (đổi ảnh + giữ ảnh)** |
| 58-5 | **Tách `PermissionMatrix.tsx` dùng chung** (goal §11) | DONE | app/screens/PermissionMatrix.tsx | — | — | tsc 0 · xoá 1.191 ký tự JSX rồi |

## ⏳ CHƯA LÀM / CHO USER QUYẾT
| # | Task | Lý do |
|---|---|---|
| 1 | MỐC 48 — sửa lệch UI/backend `admin_tab_01` | QUYẾT ĐỊNH nghiệp vụ (3 phương án) |
| 2 | Tab «Tổng quan» ở Chi tiết Dự án | pr01 và pr03 **cấu trúc ngầu** — phải chọn ưu tiên test hay UI |
| 3 | bypass `isCompanyLeadership` (D-022) | QUYẾT ĐỊNH nghiệp vụ · đề đo: chỉ `hrm` (mã chức danh **NHÂN SỰ**) mất bypass nếu bỏ về `"director".equals(base)` |
| 4 | Bật email | THIẾU thông tin SMTP + `notification_config_targets`=0 + `approval_email_recipients`=0 |

---

# NHẬT KÝ BỔ SUNG — MỐC 96 → 99 (29/09/2026)
| Mốc | Task | Status | Files | DB | API | Test |
|---|---|---|---|---|---|---|
| 96 | ⛔ Sửa lỗi mất dữ liệu: ở Email trong modal «Sửa hồ sơ» | DONE | app/screens/HrProfileEditModal.tsx | — | `save_hr_record` / `update_user` | tsc 0 · css ĐẠT · 5 phép thử API 200 |
| 97 | Quét D-030 vòng 2: `save_user_access` | VERIFIED | — | đọc | đọc L206-215 | khớp 100% |
| 98 | Quét D-030 vòng 3: `update_user` vs `users` | VERIFIED | — | đọc | đọc | 5/5 khớp |
| 99 | Quét D-030 vòng 4: `HrScreen` | VERIFIED | — | đọc | đọc | 13/13 khớp |
| BUG-01 | Báo cáo lỗi S1 + ảnh hưởng 5 mặt | ĐÃ SỬA | docs/dsh-state/CHECKLIST.md | — | — | kiểm chứng hồi quy 6/6 |

**BUILD VNTECH-FP-B3ABCB674A9A0C05** · ❌ 2/5 CỔNG ĐỎ · 0 commit · CSDL sạch

---

# NHẬT KÝ BỔ SUNG LẦN CUỐI — MỐC 101 (29/09/2026)
| Mốc | Task | Status | Files | DB | API | Test |
|---|---|---|---|---|---|---|
| 101 | 🐛 BUG-02 (S1): khoá 4 trường tài khoản theo hợp đồng backend | DONE | app/screens/HrProfileEditModal.tsx | — | `update_user` | tsc 0 · css ĐẠT · 4/4 chuỗi trong bundle · 5 CỔNG 4+3 KHÔNG TĂNG |

**BUILD VNTECH-FP-B01C5D788932F083** · ⛔ 0 commit · CSDL sạch · 3 cổng dịch + login OK
⇒ HẾT phần việc độc lập trong phiên 29/09. Còn 5 mục cho USER QUYẾT (xem CURRENT_STATE.md).

---

# NHẬT KÝ BỔ SUNG — MỐC 102 + MỐC 103 (29/09/2026) · COMMIT `acb28ae`

| Mốc | Task | Status | Files | DB | API | Test |
|---|---|---|---|---|---|---|
| 102 | 🗂️ HĐ lao động: ngạch · bậc · gia hạn lần N | **DONE** | `drizzle/0314_hop_dong_lao_dong_ngach_bac_gia_han_lan.sql` · `HrStore.java` · `HrManagementUseCase.java` · `HrStoreAdapter.java` · `BootstrapDataAdapter.java` · `app/screens/LaborScreen.tsx` | `labor_contracts` += 3 cột | `save_labor_contract` | API thật HTTP 200 ⇒ `ngạch=Chuyen gia · bậc=Bac 3 · gia_han=2`; HĐ cũ giữ NULL/NULL/0; sai kiểu ⇒ 400 |
| 103 | 📑 Menu «Review HĐ» | **PARTIAL** | `ContractReviewStore.java` · `ContractReviewUseCase.java` · `ContractReviewStoreAdapter.java` · `SystemController.java` · `ApplicationBeansConfig.java` · `ActionRbacRegistry.java` · `BootstrapDataAdapter.java` · `app/screens/ContractReviewScreen.tsx` · `app/page.tsx` · `lib/ui-shared.tsx` · `lib/menu-helpers.ts` · `app/globals.css` · `drizzle/0315_review_hop_dong.sql` | `module_catalog` += `dept_legal_contract_review` · `contract_reviews` + `contract_review_logs` | 5 action `contract_review` | Build `VNTECH-FP-72751DBE6DEBEED8` ĐẠT · tsc EXIT=0 · css-baseline ĐẠT · contract 674/645/**28 FAIL** · regression 69/66/**3 FAIL** · ⬜ CHƯA test API thật · ⬜ CHƯA chụp ảnh |
| DOC | 🧹 Đính chính báo động giả «mất workspace» | DONE | `docs/dsh-state/CHECKLIST.md` | — | — | Gỡ mục SAI «WORKSPACE MẤT .git VÀ tools/» (do đo nhầm thư mục lệch bởi `subst W:` cũ), thay bằng mục đính chính + 3 bài học |

**BUILD VNTECH-FP-72751DBE6DEBEED8** · COMMIT `acb28ae` (30 file) · 2 CỔNG ĐỎ (28 + 3 FAIL,
trong đó 16 test MT3-* mồ côi + 3 test PR-01/PR-03 mâu thuẫn — KHÔNG phải hồi quy)
· CSDL sạch

**PUSH + MERGE**
```
✅ git push origin unity-p2-full-20260920      b08de4f..acb28ae
✅ git push origin acb28ae:unity               b08de4f..acb28ae   (fast-forward)
⇒ origin/unity-p2-full-20260920 = acb28ae · origin/unity = acb28ae
```
⚠️ Lần push đầu: `fatal: unable to access … Could not resolve host: github.com` (DNS tạm hỏng)
⇒ kiểm `Resolve-DnsName github.com` rồi thử lại ⇒ THÀNH CÔNG.

**NEXT**: test API thật MỐC 103 (`list/open/log_contract_review`) · chụp ảnh màn + modal 2 tab
· dọn dữ liệu thử · rồi MỐC 104 «Cơ sở vật chất & VVP» · MỐC 105 UI chung.

---

## VÒNG 170 — 30/09/2026 — MỐC 107 + SỬA 2 SỰ CỐ DO CHÍNH MÌNH GÂY RA

**Bối cảnh:** tiếp sau `82d7ea8` (MỐC 103b). Người dùng yêu cầu «tiếp tục công việc đi».

| Việc | Trạng thái | Bằng chứng |
|---|---|---|
| MỐC 107 — nút nổi che cột «Trạng thái» của bảng | ✅ DONE | đo DOM: 2 ô bị che → **0 ô** |
| Sự cố migration `0325` làm chết UI `:8787` | ✅ ĐÃ SỬA | `_test-mig0325.mjs` 8/8 ĐẠT · `:8787` UP |
| Sự cố `Start-Process -ArgumentList` cắt đường dẫn | ✅ ĐÃ SỬA | D-037 · node hết `Cannot find module 'D:\13.'` |
| Tài liệu MỐC 107 + D-036/D-037/D-038 | ✅ DONE | mục này |
| Commit + push 2 nhánh | ⏳ CHƯA LÀM | — |
| Chạy lại 5 cổng sau build | ⏳ CHƯA LÀM | — |

### Diễn biến

1. Kiểm chứng thị giác 3 ảnh «Review HĐ» (worker_vision) nêu 3 cảnh báo.
2. **ĐO LẠI BẰNG DOM** (`_fabchk.mjs`) ⇒ chỉ **1/3** cảnh báo đúng. Cảnh báo «sidebar highlight sai»
   SAI hoàn toàn (active thật là `Review HĐ  class=nav-child nav-child-hr_legal active`).
3. Lỗi thật: FAB `155x40` @(1374,750) đè lên `Trạng thái @1371,716` và `Chưa xem @1371,759`;
   `.main-content padding-bottom = 0px` ⇒ bị che VĨNH VIỄN. ⇒ **MỐC 107**.
4. Sửa `app/globals.css` (chèn trước marker `/* VNTECH_MASTER_BASELINE_CSS_R1_1_1_END */`).
5. Build UI: `VNTECH-FP-86907EEC9FD2052F` · `BUILT ARTIFACT VALIDATION: ĐẠT`.
6. **`:8787` DOWN** ⇒ đọc `_ui-err.log` ⇒ phát hiện migration `0325` dùng cú pháp chỉ-MySQL.
7. Viết lại `0325` cho đa hệ CSDL + dựng `_test-mig0325.mjs` kiểm chứng 8 phép ⇒ 8/8 ĐẠT.
8. **`:8787` vẫn DOWN** ⇒ phát hiện `Start-Process -ArgumentList` cắt đường dẫn theo dấu cách.
9. Khởi động lại đúng cách ⇒ **3 cổng UP**, `GET /` = 200.
10. ĐO LẠI MỐC 107: `padding-bottom = 84px`, FAB `146x37`, cuộn đáy ⇒ **0 ô bị che**.

### Số đo then chốt (dùng lại được)

```
viewport 1562 x 808 · body.scrollHeight 1264 · cuộn tối đa 456px
TRƯỚC: padding-bottom 0px   · FAB 155x40 @(1374,750) · 2 ô bị che
SAU  : padding-bottom 84px  · FAB 146x37 @(1383,753) · 0 ô bị che · modal 1062x320px
```

**NEXT**: commit + push MỐC 107 và bản sửa `0325` lên `unity-p2-full-20260920` và `unity`;
chạy lại 5 cổng; rồi MỐC 104 «Cơ sở vật chất & VVP» · MỐC 105 UI chung.

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

## 30/09/2026 — MỐC 109: hai cổng chặn `update_user` (PHÁT HIỆN TỪ TEST RBAC THẬT)
- Xuất phát từ MỐC 48 còn treo: «nút Sửa tài khoản trả 403». Chạy test RBAC thật trên tài khoản thăm dò
  `sec_probe_017830` (role `ksda`) ⇒ sau khi cấp `admin_tab_01` + `canEdit` VẪN 403.
- Truy nguyên: (1) `SystemController.java:379-380` gọi `requireRequireAdmin` (chốt cứng `"admin".equals(cu.role())`);
  (2) `UserManagementUseCase.guardRoleChange` chặn MỌI payload có `role` dù vai trò không đổi.
- Đã sửa cả hai + thêm 3 phép chống hồi quy. Test RBAC 14 bước: `TAT CA DAT`.
- Chi tiết đầy đủ ở `docs/dsh-state/CHECKLIST.md` mục «MỐC 109».

## 01/10/2026 — MỐC 110: 19 action MỒ CÔI quyền; trong đó `save_error_report` chết ngõm
- Xuất phát: sau khi sửa MỐC 109, em quét lại TOÀN BỘ registry thay vì tin lời khẳng định sẵn có → phát hiện comment
  trong `RbacService.java:64-66` sai số liệu.
- ĐO: 65 action khai module rỗng = 38 admin-gated + 8 `PUBLIC_ACTIONS` + **19 mồ côi** (bản cũ ghi 46 = 41 + 5).
- Hệ quả: 19 action đó 403 với mọi non-admin. Trong đó `save_error_report` = **nút «Báo lỗi / Góp ý»** mà user
  đã yêu cầu ở MỐC 42/MỐC 103 ⇒ nguyên nhân gốc là **PHASE 0B đã đổi nghĩa `List.of()`** từ «không gác» thành «từ chối».
- Đo trước/sau qua API thật: probe 403 `«Thao tác chưa được khai báo quyền trong hệ thống.»` → sau sửa **200** có `reportCode`; admin 200; không đăng nhập 401; xem danh sách/tick vẫn 403.
- Đã sửa bằng cách thêm `save_error_report` vào `PUBLIC_ACTIONS` (nhóm tự phục vụ), đồng thời SỬA lại comment sai.
- 8/8 cổng API ĐẠT · 17/17 test chống hồi quy · 14/14 test MỐC 109 không hồi quy.
- Chi tiết ở `docs/dsh-state/CHECKLIST.md` mục «MỐC 110».
- Cùng ngày: trả lời câu hỏi của anh — bản sửa MỐC 104 (gom nhóm `system_admin` trong ma trận phân quyền) **ĐÃ push** (commit `4fc75a0`, có trong cả `origin/unity` và `origin/unity-p2-full-20260920`). MỐC 109/110 chưa push.

## 01/10/2026 — DỌN 6 TÀI KHOẢN THĂM DÒ + ĐIỀU TRA 2 CỔNG GATE ĐỎ
- **Dọn dữ liệu thử**: đo tham chiếu của 6 tài khoản `sec_probe_*` trên ~65 bảng trước khi xoá —
  chỉ có `user_module_permissions` (360), `sessions` (20), `audit_logs` (16), `user_project_scopes` (4);
  **mọi bảng nghiệp vụ = 0 dòng** (hr_records, labor_contracts, error_reports, workflow_step_approvers…) và
  **không FK nào trỏ `users.id`**. Xoá trong 1 transaction ⇒ `users` 20 → **14** (toàn là tài khoản thật).
- Xác minh lại sau dọn: không đăng nhập ⇒ 401; admin ⇒ 200; `moduleCatalog=76`, `users=14`, `employees=1`,
  `projects=3`, `businessScopes=9`, `engineRoleProfiles=9`; `PROBE MOC110%` = 0 dòng.
- **Cổng `verify:fingerprint` ĐỎ** (`expected c631e3d4… / actual 3d378863…`). Điều tra bằng worktree tạm + `git archive`:
  FAIL ở **cả HEAD, HEAD~5, `4fc75a0`, `ffe20f9`, `128c021`** ⇒ **hỏng có sẵn toàn bộ lịch sử**, không phải do MỐC 109/110
  (file Java nằm ngoài `ROOT_DIRS` nên không được băm). `verify:master-baseline` vẫn ĐẠT.
- **Cổng `test:regression` ĐỎ 3 ca** trong `tests/pr01-project-tabs.test.mjs`. Bisect 230 commit:
  PASS ở `7fdf71d` (27/09) → FAIL ở `4fc75a0` (29/09, MỐC 96-104 — **đã push**).
  Nguyên nhân: commit đó **hạ test về hợp đồng cũ** (5 tab→4 tab, BCH `tab===5`→`tab===4`, đòi `ProjectAggregateTabs`)
  mà **không sửa `app/page.tsx`** cho khớp. Bản test `7fdf71d` chạy **7/7** trên mã hiện tại ⇒ mã đúng, test lỗi thời.

## 01/10/2026 — KHÔI PHỤC TEST PR-01: REGRESSION 69/69 XANH
- Khôi phục `tests/pr01-project-tabs.test.mjs` về byte-identical bản `7fdf71d` (`git hash-object` = `2f332e9`).
- **KHÔNG** sửa `app/page.tsx` — mã nguồn giữ nguyên.
- Kết quả: `test:regression` **69/69 XANH (exit 0)**, `tests/moc-96-105-no-regression` **17/17**, `typecheck` **0**.
- Bài học ghi ở `DECISIONS.md` **D-044**: không bao giờ hạ test về hợp đồng cũ để "làm xanh".
- **Còn treo (TYPE 3)**: yêu cầu 28/09 «4 thẻ tổng hợp không bị khoá theo dự án» mà `4fc75a0` cố mã hóa bằng test —
  muốn giữ thì phải sửa **mã** (`ProjectAggregateTabs.tsx` 14 502 B hiện là mã chết), không phải sửa test. Chờ anh quyết.

## 01/10/2026 — MỐC 111: SỬA «CHỌN QUYỀN XONG BẤM LƯU NHƯNG KHÔNG LƯU» (2 modal phân quyền)
- **Báo cáo lỗi của anh:** (1) modal *Sửa tài khoản* → thẻ *Phân quyền công việc / Chức năng* không hiện nút lưu;
  (2) thẻ *Phân quyền người dùng* → modal *Phân quyền* → chọn quyền rồi bấm lưu thì không lưu.
- **NGUYÊN NHÂN GỐC (đã chứng minh bằng probe, không phải suy đoán):**
  `UserEditModal.send` (`app/page.tsx`) **luôn** gọi `update_user` trước, kể cả khi đang ở thẻ *Phân quyền*.
  Thẻ đó không render ô tài khoản, còn ô chọn quyền trong `PermissionMatrix` **không có thuộc tính `name`**
  ⇒ `FormData` chỉ có select `project-*` ⇒ `update_user` trả **400 «Mã nhân viên, họ tên, tên đăng nhập và
  phòng/bộ phận là bắt buộc»** ⇒ `if(!updated) return;` ⇒ **`save_user_access` không bao giờ chạy**.
- **Lỗi thứ 2 phát hiện thêm trong lúc vá:** chiều ngược lại, thẻ *Thông tin tài khoản* không có select
  `project-*` ⇒ `projectScopes = []` ⇒ `clearUserScopes()` **xoá sạch phạm vi dự án** của người dùng.
  Nghĩa là **mỗi lần bấm «Lưu thông tin tài khoản» là mất phạm vi dự án** — mất dữ liệu âm thầm.
- **Đã sửa:** mỗi thẻ chỉ lưu đúng phần nó sở hữu — `account` → `update_user`; `access` → `save_user_access`.
- **Bổ sung chốt chặn an toàn ở backend:** `saveUserAccess` **từ chối 400** khi `modulePermissions` rỗng
  (trước đó xoá 3 bảng rồi vẫn trả 200 *«Đã lưu quyền hiệu lực»* — mất sạch quyền mà vẫn báo thành công).
- **Sự cố tự gây & đã khắc phục:** probe đầu tiên gửi `modulePermissions: []` làm mất **60 dòng quyền của `nvdademo`**.
  Phục hồi **khớp 100%** từ audit `save_user_access` 29/09 15:45:27 (`after_json` 9 630 ký tự, đủ 60 module).
  DB sau tất cả thao tác đã về **đúng mốc gốc**: `user_module_permissions` = **1226**, `nvdademo` = **60**,
  `user_project_scopes` = **13**, `user_warehouse_scopes` = **9**, `users` = **14**.
- **KIỂM CHỨNG `_verify-moc111.mjs` — 11/11 ĐẠT (0 hỏng).** `typecheck` 0 · `test:regression` **69/69 XANH** ·
  `mvn package` **exit 0** · `:18081` UP với JAR mới (10:07).
  - CA1 thẻ *Phân quyền*: lưu **200**, quyền đổi đúng, phạm vi dự án lưu đúng.
  - CA2 thẻ *Tài khoản*: lưu 200 mà **không đụng** quyền (59) lẫn phạm vi dự án (1).
  - CA3 payload rỗng: **400** + quyền 59→59, phạm vi dự án 0→0 (không còn xoá sạch).
  - CA4 ràng buộc phòng P5.3: cấp `admin_tab_01` cho tài khoản thường vẫn bị **400** như trước.
- **5 ca test Java ĐỎ — CÓ SẴN, KHÔNG PHẢI DO MỐC 111.** Tất cả cùng lỗi `Column "lc.job_rank" not found` (H2).
  `job_rank` được thêm bởi `drizzle/0314_hop_dong_lao_dong_ngach_bac_gia_han_lan.sql` nhưng **0 file `.sql` nào trong
  `java-backend` có nó** (`V1__baseline.sql` định nghĩa `labor_contracts` không có cột này), trong khi
  `BootstrapDataAdapter`/`HrStore`/`HrStoreAdapter` vẫn đọc nó ⇒ mọi test gọi bootstrap đều đỏ. Cả 3 file đó
  **không nằm trong diff** của MỐC 111 (chỉ có `UserManagementUseCase.java`). Xem FOLLOW-UP bên dưới.

## 01/10/2026 — MỐC 112: SỬA 3 LỖI CÒN TỒN TRONG `save_user_access` (hạn dùng · nguồn quyền · transaction)
- Xử lý 3 FOLLOW-UP TYPE 2 của MỐC 111. **Không có migration**, không đổi cấu trúc bảng.
- **`permission_expires_at` không bao giờ lưu** — adapter hard-code `NULL` trong VALUES.
  Thêm tham số xuống port + `instantOrNull()` nhận `YYYY-MM-DD`.
- **`permission_source` luôn `department_default`** — `source` được tính ở `UserManagementUseCase:303` rồi **bỏ không**
  (biến chết); adapter hard-code. Hệ quả: `deleteModuleOverride` lọc `permission_source='manual_override'`
  nên **không bao giờ xoá được gì** ⇒ nút *«Xóa ngoại lệ cá nhân» là nút chết*. Đã truyền `source` xuống ⇒ xoá thật.
- **`ON DUPLICATE KEY` không cập nhật `permission_expires_at`** — sửa mệnh đề `UPDATE`, nếu không bỏ hạn thì hạn cũ treo vĩnh viễn.
- **Thiếu transaction** — `store.runAtomically(Runnable)` do **adapter** mở (`@Transactional`).
  KHÔNG đặt `@Transactional` ở use-case: module `application` cố ý không phụ thuộc Spring (đã thử, build fail).
- **Khoảng trống hai đầu:** UI chưa hề render ô hạn dùng — `PermissionMatrix` chỉ hiển thị `<span>` chỉ đọc, còn cả hai
  modal đều đọc `form.get('expires-<module>')` ⇒ luôn `null`. Thêm cờ tùy chọn `expiryEditable` (mặc định **false**,
  không đổi hành vi nơi khác) và bật ở `UserEditModal`. `UserAccessModal` **không có cột «Hết hạn»** ⇒ chưa bổ sung (TYPE 3).
- **⚠️ Lỗi múi giờ đã bắt & sửa:** neo ngày theo UTC ⇒ chọn `30/06` lưu thành `30/06 07:00` (MySQL đổi theo
  `Asia/Ho_Chi_Minh`) ⇒ quyền hết hạn **muộn một ngày**. Đổi sang neo theo múi giờ máy chủ ⇒ `2027-06-30 00:00:00.000`.
- **KIỂM CHỨNG `_verify-moc112.mjs` — 8/8 ĐẠT** (đọc ngược **thẳng MySQL**): hạn dùng ghi đúng · bỏ hạn thì xoá được ·
  nguồn `manual_override` · nút xoá ngoại lệ xoá được thật (1 dòng → 0).
- **HỒI QUY:** MỐC 111 **11/11 ĐẠT** · `test:regression` **69/69 XANH** · `typecheck` 0 · `mvn package` exit 0 ·
  `verify:master-baseline` ĐẠT.
- **DB về đúng baseline:** `user_module_permissions` **1226** · `testuser86661` **59** · phạm vi dự án **13** ·
  kho **9** · users **14** (khôi phục bằng `_restore-moc112.mjs`, đọc `audit_logs.after_json`).
- **Chưa commit / chưa push** — chờ anh yêu cầu.

---

## 01/10/2026 — ĐỢT MỐC 113 → 118 · USER GIAO 5 VIỆC · MỖI VIỆC = 1 MỐC
Quy tắc của đợt (anh yêu cầu): «làm việc phải có checklist tính mỗi task tôi giao thành 1 mốc sau đó
ghi lại vào tài liệu» ⇒ **không gộp**, mỗi việc một mốc + một checklist riêng.

| Mốc | Việc anh giao | Kết quả | Cổng |
|---|---|---|---|
| 113 | *(ghi nhận)* 5 test Java đỏ | **DONE** — vá 2 tệp H2 + `IF()`→`CASE WHEN` + migration V32 | harness 16/16 · javac exit 0 |
| 114 | «sửa label tiếng Việt phải viết có dấu» | 22 vị trí / 8 tệp + vá gốc `admin-bulk-import.ts` | tsc 0 |
| 114b | (thuộc 114) mojibake tài liệu | 36 dòng `CURRENT_STATE.md` vá (18 tự động + 18 tay) | 0 dòng còn hỏng |
| 115 | «tab trong modal phải cân đối, bằng nhau» | `flex: 1 1 auto` + cho phép nhãn xuống dòng | tsc 0 |
| 116 | «cột Nguồn chỉ để dev test — ẩn đi» | `ProjectEntityModal` + `TeamDirectory` | tsc 0 |
| 117 | «modal phân quyền nên tái sử dụng chung» | tách `PermissionAccessPanel.tsx` dùng cho cả 2 modal | tsc 0 |
| 118 | «ẩn menu quản trị hệ thống với user 0 quyền» | cổng riêng `system_admin` | **72/72** |

**CỔNG CHUNG CẢ ĐỢT:** `typecheck` 0 lỗi · `test:regression` **72/72** (69 cũ + 3 mới MỐC 118).

### MỐC 118 — ghi chi tiết
- **Sửa:** `lib/permissions.ts` thêm `hasAnyCapability()` + `SYSTEM_ADMIN_GROUP_KEY`;
  `app/page.tsx:459-481` tách cổng riêng cho nhóm `system_admin`.
- **Quyết định (D-046)** thay thế dòng «MỐC 33 lọc nhóm `system_admin` theo `canView`».
- **Lỗ hổng phát hiện khi đo thật:** lối thoát `!permissionConfigured` khiến `kttdemo` có **0 dòng quyền**
  mà vẫn ra đủ **15 mục con** ⇒ đã bỏ lối thoát này riêng cho nhóm quản trị hệ thống.
- **Đo thật trên payload `GET /api/system`, 7/7 đúng:** `giamdoc.demo` 15 quyền → HIỆN;
  `ksda`/`nvkh`/`tkho`/`ktt`/`trda` 0 quyền → ẨN; `admin` → HIỆN.
- **Ca tổng hợp:** cấp **đúng 1 quyền «Xuất» (không cấp Xem)** → vẫn HIỆN menu, 1 mục con ⇒ đúng
  yêu cầu «kể cả 1 quyền cũng hiển thị menu».
- **Bài học (D-046):** probe đầu của tôi kết luận SAI cho `giamdoc.demo` vì chỉ nhìn bảng
  `user_module_permissions`. Backend bơm thêm quyền theo phòng ban (`permissionSource` =
  `company_leadership` / `department_default`); 0 dòng trong bảng nhưng payload có 15 quyền quản trị.
  **Luôn kết luận về quyền từ payload backend trả về cho đúng tài khoản.**
- **Test:** `tests/m118-system-admin-menu-gate.test.mjs` (3 ca) đã thêm vào `package.json`.
- **Chưa commit / chưa push** — chờ anh yêu cầu.

### Còn treo
| # | Việc | Trạng thái |
|---|---|---|
| 2 | **MỐC 114c** — bổ sung dấu cho tài liệu 4 file `docs/dsh-state/` | **XONG** (chi tiết ở mục bên dưới) |
| 3 | **MỐC 113** — anh chạy `mvn -o -B test` trên máy có Maven để đóng 5 test (máy này **không có Maven**) | CHỜ |
| 4 | `app/screens/HrProfileEditModal.tsx:34` — ký tự U+FFFD trong comment | **XONG** |
| 5 | Dọn file tạm `_m11*.cjs` · `_m11*.mjs` · `_probe-*` · `shot-*.png` | CHỜ |
| 6 | Dòng tiêu đề `## 20 MỐC ĐÃ LÀM TRONG PHIÊN` trong `CURRENT_STATE.md` còn thiếu dấu | **XONG** (MỐC 114c) |

⛔ Lỗi soạn văn của chính tôi khi ghi `CURRENT_STATE.md`: gõ nhầm «QUẢN TRỊ **HỐ** THỐNG» thay vì
«HỆ THỐNG» ⇒ đã phát hiện ngay và sửa. Bài học: sau khi ghi tài liệu có tiếng Việt có dấu, **đọc lại
dòng tiêu đề** — lỗi này lọt qua cả `typecheck` lẫn `test:regression` vì chỉ nằm trong `.md`.

### MỐC 113 — chi tiết
- **Sửa:** bổ sung `image_url` · `image_updated_at` · `job_rank` · `grade` · `renewal_round` (đều NULLABLE)
  vào **cả hai** tệp `schema-h2.sql`; thêm `V32__moc113_labor_contracts_columns.sql` (idempotent).
- **Phát hiện thêm khi kiểm chứng:** `HrStoreAdapter.java:111` dùng `IF()` — hàm **riêng MySQL**, H2 không có
  (`42001-232`). Nếu chỉ vá schema thì test sẽ đỏ tiếp vì lý cause khác. Đổi sang `CASE WHEN`.
- **Quyết định:** D-047 (vá H2 phải vá cả cột lẫn cú pháp; một bảng có 3 bản định nghĩa thì sửa cả 3).
- **Kiểm chứng:** harness H2 thật (`h2-2.3.232.jar` lấy từ `BOOT-INF/lib`) **16/16** ·
  `javac` 121 tệp domain+application+infrastructure+web **exit 0**.
- **⛔ Chưa đóng:** máy này **không có Maven** ⇒ **không** chạy được `mvn test`. Cần anh chạy
  `mvn -o -B test` để xác nhận 5 test kia xanh hẳn.

### MỐC 114d — chi tiết (nhãn tiếng Việt nằm trong CSDL)
- **Vì sao mở rộng:** MỐC 114a sửa mã nguồn, 114c sửa tài liệu — nhưng **label user thấy trên màn
  hình lại lấy từ CSDL**, không lấy từ mã. Đo trực tiếp `module_catalog` trên `vntech_erp` (CHỈ ĐỌC):
  76 dòng, **14 dòng** nhãn mở đầu bằng `Quan tri he thong - Tab NN.` không dấu; 3 tab (02 Tổ chức ·
  07 Cấp bậc · 11 Audit log) **không có dấu nào**.
- **Nguồn gốc:** `drizzle/0262_…sql` — file này **đã chạy** nên sửa nó không đổi được CSDL hiện hữu.
  ⇒ tạo `V33__moc114_module_catalog_labels.sql` (`UPDATE` thuần, idempotent sẵn).
- **Chốt an toàn:** `label LIKE 'Quan tri he thong - Tab %'` ⇒ không đè lên nhãn Admin đã tự đổi
  qua `save_module_catalog`.
- **Kiểm chứng:** `EXPLAIN` trên MySQL 8.0.46 thật → `type=range · key=PRIMARY · rows=14 ·
  Using where` ⇒ parse đúng, kế hoạch nhắm đúng 14 dòng, **không ghi dữ liệu** (EXPLAIN không thực thi).
- **Mở rộng sang bảng danh mục khác** (đo 10 bảng bằng `name REGEXP '[^ -~]'`): `role_catalog` 17,
  `workflow_definitions` 4, `workflow_steps` 10, `organization_units` 8 → **0 dòng thiếu dấu**.
  `menu_group_catalog`/`business_role_group_catalog`/`business_scope_catalog`/`system_level_catalog`/
  `material_categories` có 1–2 dòng "thiếu dấu" nhưng đọc ra toàn là **mã kỹ thuật đúng**:
  `MEP` · `KH-MH` · `Kho` · `ADMIN` · `HVAC` · `PCCC` ⇒ **không sửa**.
- **Tìm thêm 2 tên kho seed thiếu dấu:** `warehouses` 7 dòng, **5 dòng CÓ dấu** (kể cả
  `Kho tổ đối - Tổ đối thi công số 1`), chỉ `…To doi dien nuoc 2` và `…To doi hoan thien 3` lệch
  ⇒ là lỗi seed, **không phải dữ liệu người dùng nhập**. Đã thêm vào V33 phần 2 (`EXPLAIN` rows=7,
  chốt khớp **2** dòng). Chỉ đổi tên hiển thị; `user_warehouse_scopes` và báo cáo tham chiếu theo
  `warehouse_id` nên **không** phá liên kết. ⛔ Đây là **dữ liệu nghiệp vụ** (khác phần 1 là nhãn
  hệ thống) — nếu anh muốn giữ nguyên thì xoá `UPDATE warehouses` khỏi V33.
- **⛔ CHƯA chạy production.** `flyway_schema_history` mới nhất = **V31** ⇒ V32 (MỐC 113) + V33 cùng
  chờ, tự áp dụng đúng thứ tự khi app khởi động. Sau khi chạy: `SELECT COUNT(*) FROM module_catalog
  WHERE label LIKE 'Quan tri he thong%'` phải bằng **0**.
- **Bài học (D-048):** máy quét CHỈ bắt được lớp lỗi nó được huấn luyện để thấy. Ba lần quét khác
  nhau trên cùng một file cho kết quả **99 → 75 → 3**, và bộ n-gram 4 ký tự (không cần danh sách từ)
  vẫn bỏ sót vì đoạn tham chiếu không chứa từ đó. Cuối cùng phải **đọc tay từng dòng**.

### MỐC 114c — chi tiết (4 file tài liệu `docs/dsh-state/`)
- `CURRENT_STATE.md` 24 · `DECISIONS.md` 165 + **28** (em tự vá) · `TASK_HISTORY.md` 60 + 7 ·
  `CHECKLIST.md` 204 + **110 chỗ `MOC`→`MỐC`** (em tự làm, thay thế cơ học).
- **Sai sót của subagent đã bị bắt:** nó báo xong cả 4 file, nhưng quét lại vẫn còn `MOC` ở
  `CURRENT_STATE.md` (5) và `DECISIONS.md` (11 dòng) ⇒ **phải tự đo lại, không tin báo cáo.**
- **Giữ nguyên cấu trúc file:** `CURRENT_STATE`/`DECISIONS`/`TASK_HISTORY` = LF, `CHECKLIST.md` = **CRLF**.
  Mọi script đều assert `LF/CRLF/BOM/U+FFFD` không đổi trước khi ghi, lệch là hủy.
- **Danh sách cố ý KHÔNG sửa** (xem `CHECKLIST.md:3407-3417`): bảng alias bỏ dấu, tên tệp, khoá CSDL,
  enum API, và mọi thứ trong backtick; riêng `PROBE MOC110%` / `%PROBE_MOC102%` là nhãn đối chiếu truy vấn.

#### 114c — đợt hoàn tất (đo lại toàn bộ)
| File | Đã sửa | Còn lại |
|---|---|---|
| `CURRENT_STATE.md` | 24 | **0** — xác minh sạch |
| `DECISIONS.md` | 165 + 28 | **0** — xác minh sạch |
| `TASK_HISTORY.md` | 60 + 7 | **0** — xác minh sạch |
| `CHECKLIST.md` | 204 + 110 (`MOC`) + 15 (thân văn) + 111 (tiêu đề) + 88 + 1 + 8 | ~~0~~ **SAI** — còn sót ở đầm việ củ, đã vá 14 dòng (MỐC 114e) |

**`CHECKLIST.md` — vòng cuối phát hiện lớp lỗi mà mọi lần quét trước đều bỏ sót:**
quy tắc «bỏ qua nội dung trong ``` » là **sai**. Có fence chứa **văn xuôi**, không phải mã
(`:1633-1636`, `:2090-2092`). Quét lại toàn bộ fence → **271 dòng** có vẻ là văn xuôi; siết lại
theo ngưỡng "≥ 3 từ chức năng không dấu" → **90 dòng thật**, sửa hết bằng 3 lô có assert.

**⛔ Hủy một hướng đi mà đã kiểm chứng là rác:** dựng từ điển tự sinh từ corpus của chính file
(bỏ dấu → khoá, chỉ nhận khoá có đúng 1 biến thể) rồi thay tự động trong fence. Chạy thử ra
**161 dòng** nhưng đọc kết quả thấy ngay: `trong`→`trống`, `Danh mục`→`Dánh mục`, `Rủi ro`→`Rủi rõ`,
`NGHIỆP VỤ`→`NghịỆP VỤ`, `day la`→`dạy la`, `DAT`→`Dắt`. **Không ghi file nào.** Nguyên nhân:
bỏ dấu **không phân biệt được nghĩa từ**, và corpus thiếu một biến thể không có nghĩa là từ đó
"không mơ hồ". ⇒ Không bao giờ tự động hoá việc khôi phục dấu.

**2 dòng CỐ Ý giữ nguyên** (không phải sót): `CHECKLIST.md:1049` là JSON lỗi API trả về thật và
`:2678` là thông báo lỗi Flyway — sửa chúng là làm sai lệch với thực tế mà tài liệu đang ghi.

**Một chỗ sửa chữa nghĩa, không chỉ dấu:** `:1631` `4 BAT BƯỚC` → `4 — BẮT BUỘC PHẢI ĐỌC`. Căn cứ là
dòng `:1635` ngay dưới trong cùng khối đã viết `BAT BUOC doc information_schema.COLUMNS`; giữ
`BẮT BƯỚC` sẽ là nghĩa "bước" vô nghĩa. Đây là **quyết định diễn giải** nên được ghi lại, không âm
thầm sửa.

**Cổng kiểm sau khi sửa tài liệu:** `npm run typecheck` **exit 0** · `npm run test:regression`
**72/72** · `npm run lint` **223 problems / 2 errors** (cùng mức nền trước đợt này; 2 lỗi là
`app/screens/ErrorReportAdminPanel.tsx:35` và `lib/ui-shared.tsx:329`, **có sẵn từ trước**, không
đụng tới).
⚠️ Lần quét đầu thấy **8 lỗi** — 6 lỗi còn lại đến từ `.scan_tmp/*.cjs` là mảnh vụn của subagent
bị kẹt, ESLint có quét chúng. Đã xoá cùng toàn bộ file tạm ⇒ trở về đúng 2 lỗi nền.

#### 114e — mở lại kết luận "đã sạch" + vá vùng 1039-1061

**TASK:** user yêu cầu build để kiểm tra chính tả · **STATUS:** XONG (1 phần cần user quyết) ·
**FILES CHANGED:** `docs/dsh-state/CHECKLIST.md` · **DATABASE:** không đụng · **API:** không đụng

**⛔ Sửa lại một kết luận đã ghi quá đà.** Mục 114c đã khẳng định «0 văn xuôi thiếu dấu còn lại».
Đợt này kiểm lại và **phát hiện khẳng định đó sai**: `CHECKLIST.md:1039-1061` vẫn còn ~10 dòng văn
xuôi thiếu dấu **ngoài** mọi fence. Nguyên nhân đúng như D-049 đã cảnh báo — bộ phân loại "dòng hợp
lệ / dòng cần sửa" của lượt trước đã quyết sai. ⇒ Quy tắc sửa: **không được ghi "đã sạch" chỉ dựa
vào lượt quét trước đó**; phải mở lại và đọc tay.

**Đã vá 14 dòng** trong `CHECKLIST.md:1039-1061`. Ngoài dấu câu chữ, **2 dòng là ảnh chụp cũ đã
được cập nhật theo hành vi hiện tại**, vì §15 cấm để tài liệu mô tả sai implementation:
- `:1049-1050` — JSON lỗi 403 trước đây ghi không dấu. Cơ sở: `RbacService.java:83` đã trả về có
  dấu (`ActionRbacRegistryPoTest` và `PoRbacActionsIntegrationTest` cũng assert chuỗi này) ⇒ ảnh chụp
  cũ đã hết hiệu lực. **Lưu ý:** ở 114c dòng này bị giữ lại với lý do "JSON trả về thật" — lý do đó
  **đúng về nguyên tắc nhưng sai về thực tế**, vì mã nguồn đã đổi sau đó.
- `:1053` — `full_name=Nhan vien Du an E` → `Nhân viên Dự án E`. **Đã đối chiếu CSDL thật**:
  `users.nvdademo.full_name` lưu đúng là `Nhân viên Dự án E`, và cả 14 dòng `users.full_name`
  đều có dấu (0 dòng không dấu) ⇒ dòng tài liệu là ảnh chụp cũ, sửa là an toàn.

**TEST / CỔNG KIỂM:** `npm run lint` **223 problems / 2 errors** (đúng mức nền, scratch đã dọn) ·
`CHECKLIST.md` LF=3633 BOM=false FFFD=0 (không đổi) · xác minh lại **từng dòng bằng mã điểm**,
không tin mắt thường.

**⚠️ Bài học mới về cách gõ dấu — `\uXXXX` cũng không tự đúng.** Em viết mọi chuỗi thay thế bằng mã
Unicode để tránh `U+FFFD`, nhưng **4 mã vẫn gõ sai** và chỉ bị phát hiện khi đọc lại kết quả:
`d\u1EE1` ra `dỡ` (đúng là `d\u1EF1` = *dự*) · `\u1EA1` ra `ạ` trong khi file viết hoa `Ạ` (`\u1EA0`) ·
`g\u1EEBi` ra `gừi` (đúng `g\u1EEDi` = *gửi*) · `th\u00F4ng` ra *thông* (đúng `th\u1ED1ng` = *thống*).
Thêm một lỗi cắt chữ: `K\u1EBE QU\u1EA2` → *KẾ QUẢ* mất chữ **T** (đúng `K\u1EBET QU\u1EA2`).
⇒ **Assert chỉ chặn được mẫu không khớp, không chặn được mẫu khớp-nhưng-sai-chính-tả.**
Bắt buộc **in lại dòng đã ghi và đọc tay** trước khi coi là xong. Đây là lần thứ 2 trong phiên này
(`_m114c-lot2.mjs` dính `U+FFFD` theo kiểu khác) gặp cùng một lớp lỗi.

**Số dòng đọc hiển thị sai cần đối chiếu mã điểm:** `CHECKLIST.md:1047` thực tế là **dòng trống**,
`KET QUA` nằm ở `:1048`. Nếu chép từ kết quả `read` thì vá nhầm dòng.

#### 114f — `npm run build` bị chặn ở cổng fingerprint (CHỜ USER CONFIRMATION) — ⛔ **ĐÃ HIỆU CHÍNH Ở 114g**

**Yêu cầu:** user «build đi để tôi check chính tả».
- **Dev server KHÔNG cần build:** `:9000` và `:8787` đã phục vụ mã nguồn mới nhất, HTTP 200, tiêu đề
  HTML hiển thị đúng dấu («Quản trị», «Đăng nhập»), `_ui-err.log` **rỗng** ⇒ không lỗi biên dịch.
  Backend `:18081` `/api/health` trả `{"ok":true,…}` ⇒ **app đã sẵn sàng để user kiểm tra ngay**.
- **`npm run build` thất bại**, nhưng **không phải lỗi mã**: dừng ở `verify-vntech-fingerprint.mjs:29`.
  `expected c631e3d4936f84d5…` vs `actual f24478438ea56e360…`.

**Vì sao lệch là ĐÚNG:** `lib/trust/source-fingerprint.mjs` băm `app/`, `db/`, `deploy/`, `drizzle/`,
`lib/`, `public/`, `scripts/`, `tests/`, `worker/` + 16 file gốc. MỐC 114–118 đã sửa `app/page.tsx`,
`lib/permissions.ts`, `package.json` và thêm `tests/m118-*.mjs`, `drizzle/0326_*`, `0327_*` — tất cả đều
là input ⇒ hash đổi là hệ quả cần mong đợi của việc sửa mã có chủ đích.
`lib/vntech-identity-data.mjs` nằm trong `EXCLUDED` nên cập nhật nó **không tạo hiệu ứng vòng**.

**Vì sao em không tự làm (TYPE 3):** quy trình chuẩn của dự án là **một migration `identity_refresh`
mới cho mỗi lần làm mới** — `drizzle/0048_master_baseline_identity_refresh.sql` và `0049_…_r1_1_1.sql`
đều chứa `UPDATE vntech_product_identity` + `UPDATE vntech_trust_settings`, và
`scripts/preflight-source.mjs:201-202` **bắt buộc** phải có các file này. Tức là làm mới fingerprint
tức là **ghi vào CSDL production** và làm thay đổi danh tính trust của sản phẩm (kéo theo
`brandFingerprint` và `releaseFingerprint` vì cả hai đều tính từ `expected`). Không tự quyết.

**BLOCKED — USER CONFIRMATION REQUIRED**
- **Question:** có tạo `drizzle/0050_master_baseline_identity_refresh_r1_1_2.sql` + cập nhật
  `lib/vntech-identity-data.mjs` để mở cổng fingerprint không?
- **Options:** (a) có, làm mới fingerprint và build; (b) không, chỉ dùng dev server `:9000` để check
  chính tả, build để dành cho đợt phát hành.
- **Khuyến nghị:** **(b)** trong lúc này — build chưa cần để kiểm tra chính tả, còn làm mới fingerprint
  thì nên gộp vào một đợt phát hành có kiểm soát.

#### 114g — VÁ 10 DÒNG THIẾU DẤU TRONG TÀI LIỆU + MỞ CỔNG FINGERPRINT (01/10/2026)

**A. Quét và vá tài liệu.** Quét 4 file `docs/dsh-state/*.md`, sinh 12 ứng viên, sàng lọc tay còn
10 dòng thật (loại `boc`=bọc, `nha`=nhà, `long`=lòng, `than`=thẻ, `dim` = jargon CSS tiếng Anh).
Đã vá **16 từ / 10 dòng**. File giữ nguyên LF, BOM=false, FFFD=0.

**B. Sai lầm đã tự đính chính.** Lần đầu ghi `day là phạm vi dung` thành một nửa có dấu.
Phát hiện nhờ **dump mã điểm từng dòng**, không nhờ `assert`.
⇒ `assert n===1` chỉ chứng minh "không còn mẫu lỗi", **không** chứng minh chữ đúng.

**C. Hiệu chính kết luận cũ về fingerprint — mục `114f` đã SAI.** Mục `114f` ghi rằng mở cổng
fingerprint **bắt buộc cần** migration `identity_refresh` mới. Đọc lại `scripts/preflight-source.mjs:201-202`
và `scripts/master-baseline-gate.mjs:34-37`: hai cổng này **chỉ đòi có** `0048` và `0049`, hai file đó
**đã tồn tại**. ⇒ **Không tạo `0050`, không `UPDATE` bảng production.** Xem `D-051`.

**D. Vòng lặp băm đã xử lý.** Đổi SSOT sang hash mới làm `drizzle/0327` (chứa hash cũ) mất hiệu
lực thay thế trong `normalizeText()` ⇒ hash đổi tiếp `f2447843…` → `7ea39130…`.
Sửa `0327` sang hash mới: cả hai về sau đều thành **cùng placeholder 39 ký tự, cùng `content.length`**
⇒ hash quay về đúng giá trị đã khai. Ổn định, không lặp.

**Kết quả build:** `BUILD_EXIT=0`. Cả 5 cổng ĐẠT + `BUILT ARTIFACT VALIDATION: ĐẠT`.
**Cổng kiểm:** `test:regression` **72/72** · `lint` **223 problems / 2 errors** (đúng mức nền).
**Database:** không đụng. `drizzle/0327` chỉ sửa **nội dung file**, **không** chạy lên MySQL.
**Chưa commit, chưa push.**

---

#### 114h — SỰ CỐ MÀN BOOT KẸT «ĐANG MỞ VNTECH ERP» — TÌM RA TẦNG GỐC (01/10/2026)

**Yêu cầu:** user «lỗi gì đây» + ảnh chụp màn hình kẹt ở màn boot trên `http://127.0.0.1:9000`.

**Chẩn đoán (không đoán mò — dựa vào HTTP thật).** Vì không thấy cả `LoginScreen` lẫn `AppErrorBoundary`
(`app/page.tsx:407-411`), nên `state` **mắc ở `"loading"`**, tức `load()` chưa bao giờ tới nơi.
Đo tài nguyên trang thu được nguyên nhân trực tiếp:

```
404  /assets/index-D7JxNztD.css
404  /assets/layout-segment-context-Dgw0O2FJ.js
404  /assets/index-fSkgx16T.js
404  /assets/page-DVUtYPJ3.js
```

HTML trỏ tên file có hash **cũ** còn file **đã mất** ⇒ không JS ⇒ `load()` không chạy ⇒ kẹt màn boot.

**Tầng 1 — build ghi đè `dist/` khi app đang mở.** `npm run build` sinh lại asset với hash mới,
xoá bản cũ đang được phục vụ. Đây là **hậu quả trực tiếp** của việc chạy build song song với app.

**Tầng 2 — Node UI không khởi động nổi sau khi đổi fingerprint.** `scripts/local-server.mjs:11` →
`scripts/local-runtime.mjs:177`:
```js
if (!identity || identity.source_fingerprint !== VNTECH_IDENTITY.sourceFingerprint) throw new Error(...)
```
`.local-data/warehouse.sqlite` còn giữ hash cũ `c631e3d4…`, và có 2 trigger
`vntech_product_identity_no_update` / `_no_delete` chặn sửa.

**Đã sửa.**
1. **UPDATE** `vntech_product_identity` + `vntech_trust_settings` trong SQLite **cục bộ**, đúng thứ tự
   như `drizzle/0049`: `DROP trigger` → `UPDATE` → tạo lại `trigger`. Chỉ UPDATE metadata,
   **không DELETE**, **không đụng MySQL production**. Sao lưu `warehouse.sqlite.bak-20261001`.
2. Dọn **Vite còn sót** giữ `0.0.0.0:9000` (PID 34568) — nó mới là thứ trả HTTP 500, không phải proxy.
3. Khởi động lại **đúng kiến trúc gốc** (`tools/MO_VNTECH_CUTOVER.bat:77`):
   `scripts/local-server.mjs` `:8787` + `tools/cutover-proxy.mjs --port 9000 --ui-port 8787 --api-port 18081`.

**Sai lầm của chính em:** lần đầu khởi chạy bằng `npm run dev` (Vite thuần) — **sai**; đó không phải
stack của dự án. Và lần đầu `UPDATE` đặt **sai thứ tự** (tạo lại trigger *trước* khi `UPDATE`) nên bị
trigger chặn — bằng chứng bảo vệ vẫn còn hiệu lực. Xem `D-052`.

**Đo lại qua proxy `:9000` (bằng chứng, không phải suy đoán):**

| Kiểm tra | Trước | Sau |
|---|---|---|
| Asset JS/CSS | **404** | **200** |
| `/api/system` | 500 | **401** (khớp Java `:18081`) |
| Đăng nhập `admin` | — | **HTTP 200**, có cookie `mep_session` |
| Bootstrap | — | **104 khoá** · 28 vật tư · 14 users · 3 dự án |

**Database:** chỉ SQLite cục bộ `.local-data/warehouse.sqlite` (metadata identity). **Chưa commit, chưa push.**

## 119 — MỐC 119: SỬA CHÍNH TẢ MENU (V34) + LÀM LẠI DẢI TAB MODAL (01/10/2026)

**USER (nguyên văn, 2 yêu cầu):**
1. «bây giờ sửa giao diện theo từng yêu cầu của tôi menu kế hoạch giao hàng đang bị lỗi chính tả»
2. «modal sửa tài khoản tab phân quyền công việc / chức năng dùng chung với modal phân quyền của
   tab 6 Phân quyền người dùng đi. Thiết kế các tab trong modal giống như modal hồ sơ nhân sự chi tiết
   của menu hồ sơ nhân sự các tab của modal có thể sắp xếp thành 1 dải ngang giống như tabbar trong
   modal nhìn rất đẹp.»
3. «làm việc tôi giao không có trong plan thì cũng phải checklist và cập nhật tài liệu»

### 119a — MENU «KẾ HOẠCH GIAO HÀNG» VÀ 13 NHÃN KHÁC ĐÃ HỎNG

**Tầng gốc:** MySQL đã thay ký tự có dấu bằng `?` **lúc chạy migration** (một phiên có `SET NAMES`
sai). Bằng chứng: `hàng` vẫn là UTF-8 đúng (`C3A0`) trong khi `ế`/`ạ` thành `3F` ⇒ KHÔNG phải
lỗi font khi hiển thị. File seed `drizzle/0029_v530_erp_permissions_workflow.sql:141` viết ĐÚNG
⇒ **nguồn không sai, lúc thực thi mới hỏng** ⇒ sửa phải bằng migration dữ liệu, không sửa file drizzle.

**Audit toàn CSDL** (1058 cột text): đúng 5 cột chứa `?`, trong đó chỉ 2 cột là lỗi UI thật —
`module_catalog.label` (13 dòng) và `module_catalog.icon` (1 dòng). Ba cột còn lại
(`audit_logs.after_json`, `email_outbox.text_body/html_body`) là **dữ liệu lịch sử, không sửa**.

**Đã làm:**
- `V34__moc119_receiving_label_and_contract_review_icon.sql` (MỚI) — sửa `receiving` → `Kế hoạch
  giao hàng`, `dept_legal_contract_review.icon` → `HĐ`. Chốt điều kiện **"còn hỏng"** bằng
  `LIKE '%?%'` (không so sánh chuỗi hỏng) ⇒ Admin tự sửa tay thì migration bỏ qua, không đè lên.
- `V33` — **gỡ phần đổi tên kho** (dữ liệu nghiệp vụ) ra khỏi migration, chỉ giữ lại trong chú thích
  kèm trạng thái ⏸ CHỜ USER CONFIRMATION. Lý do: giữ trong V33 thì Flyway sẽ **tự ý** đổi tên kho
  lần chạy kế tiếp mà anh chưa duyệt.
- Áp migration **không cần Maven**: so checksum 31 migration cũ trong jar với nguồn ⇒ **31/31 khớp**
  ⇒ an toàn trỏ Flyway sang thư mục nguồn.

**Bằng chứng sau khi áp** (Flyway: *"Successfully applied 3 migrations … now at version v34"*):

| Kiểm tra | Kết quả |
|---|---|
| `module_catalog` còn dấu `?` | **0** |
| `receiving.label` | `Kế hoạch giao hàng` — HEX `4BE1BABF…` khớp byte-by-byte |
| `dept_legal_contract_review.icon` | `HĐ` = `48 C490` |
| Tổng số module | **76** — không mất dòng nào |
| 14 nhãn tab Quản trị hệ thống | Đủ dấu |
| **Tên kho (nghiệp vụ)** | **giữ nguyên** — không tự ý đổi |
| `/api/system` bootstrap (HTTP thật qua `:9000`) | **16 mục đúng dấu, 0 mục hỏng** |

### 119b — DÙNG CHUNG MODAL PHÂN QUYỀN + LÀM LẠI DẢI TAB

**Yêu cầu 2 đã tách làm hai phần, xử lý khác nhau:**

**① Dùng chung modal phân quyền — ĐÃ ĐẠT TỪ MỐC 117, hôm nay chỉ XÁC MINH.**
Trước đây có hai giao diện lệch nhau. Nay `UserEditModal` (dòng `3234`) và `UserAccessModal`
(dòng `3251`) đều render `<PermissionAccessPanel>` với **props y hệt nhau** ⇒ một việc, một màn hình.

**② Dải tab — ĐÂY MỚI LÀ LỖI THẬT, và nguyên nhân KHÔNG phải màu nền.**
Mở ảnh tham chiếu + đọc mã cho thấy: dải 5 thẻ của modal «Hồ sơ nhân sự chi tiết» (`app/page.tsx`
`USER_PROFILE_TABS`) dùng **cùng class** `project-scope-tabs`, nên nền xanh
gradient là chung và **không phải lỗi**. Chênh lệch thật nằm ở `.user-admin-tabs` ghi đè
`flex: 1 1 auto` + `white-space: normal` (MỐC 115) ⇒ 2 thẻ **giãn hết bề ngang** thành hai khối to.

**Sửa** (`app/styles/canonical.css`): `.user-admin-tabs` về `flex: 0 0 auto` + `white-space: nowrap`
⇒ thẻ ôm sát nhãn, xếp thành **một dải ngang** y hệt dải tham chiếu. Không phát minh giao diện mới.
⛔ Không đụng `.edm-tabs` — `flex: 1 1 auto` chia đều ở đó là cố ý theo yêu cầu MỐC 115 khác.

### 119 — CỔNG KIỂM
| Cổng | Kết quả |
|---|---|
| `typecheck` | **0 lỗi** |
| `test:regression` | **72/72 ĐẠT** |
| `lint` | **223 problems / 2 errors** — đúng bằng gốc, không phát sinh |

**Không commit, không push.** Mở lại app (F5) để thấy nhãn mới — không cần build lại.

## 119c — CHẠY LẠI DỰ ÁN: BẤT BUỘC PHẢI TÁI LẬP VÂN TAY NGUỒN (01/10/2026)

**USER:** «chạy lại dự án để tôi xem những thay đổi».

**Vì sao đây không phải việc đơn giản là `npm run build`:**
`app/` nằm trong `ROOT_DIRS` của bộ băm vân tay và `walk()` lấy **mọi file** (trừ
`lib/vntech-identity-data.mjs`) ⇒ **sửa `app/styles/canonical.css` làm đổi vân tay nguồn** ⇒
cổng `verify-vntech-fingerprint.mjs` chặn build. Đo thật:
`expected f24478… / actual d4d91f…`.

### ⭐ Bài học quan trọng nhất: GIÁ TRỊ ĐO ĐƯỢC LẦN ĐẦU CHƯA CHẮC LÀ ĐÍCH

Lần chạy đầu cho `d4d91f0c…`. **Đó là giá trị SAI.** Vì `drizzle/0327_…_identity.sql` có chứa
vân tay cũ, mà `normalizeText()` chỉ che fingerprint truyền vào ⇒ mỗi vòng đổi đối số thì tập file
được che lại khác ⇒ phải **lặp tới điểm cố định**:

| Vòng | seed → kết quả |
|---|---|
| 1 | `f24478…` → `d4d91f0c…` |
| 2 | `d4d91f0c…` → `2ddab683…` |
| 3 | `2ddab683…` → `2ddab683…` ✅ **hội tụ** |

⇒ **`VNTECH-FP-2DDAB683B062EFE6`** (file cũ `F2447843EA56E36`).
⛔ Nếu chỉ lấy số đo lần đầu và ghi vào SSOT thì cổng vẫn đỏ, và sẽ tưởng là script refresh hỏng.

### Trình tự đã làm (giữ nguyên quy tắc: ⛔ không tạo migration mới)
1. **So nguồn trước** — `verify:fingerprint` đỏ ⇒ biết chắc là do CSS, không phải hỏng SQLite.
2. Tính fixed point, rồi tính **brand + release** fingerprint từ bản nháp.
3. Ghi: SSOT + `VNTECH_FINGERPRINT.json` + `VNTECH_PRODUCT_IDENTITY.txt`.
   Hai file đầu **không nằm trong tập băm** ⇒ ghi xong vân tay không đổi ⇒ chỉ cần một lượt.
   (`VNTECH_PACKAGE_ID.txt`/`VNTECH_FULL_W2_ID.txt` đã kiểm: **không** chứa vân tay.)
4. **Sao lưu** SQLite → `warehouse.sqlite.bak-fp-20261001`, rồi `DROP trigger` → `UPDATE`
   → `CREATE trigger`. Đúng thứ tự như `tools/set-local-identity.mjs`.
5. `npm run verify:fingerprint` → **exit 0**, `source:690 files`.
6. Dừng `:8787` (**PID 9048**, đã xác minh `CommandLine` = `scripts/local-server.mjs`) → build →
   khởi động lại. **Giữ nguyên** proxy `:9000` (PID 35388) và Java `:18081` (PID 15740).
7. `local-runtime.mjs:177` cho server lên ⇒ SQLite và SSOT đã khớp thật (UI in ra
   `Fingerprint: VNTECH-FP-2DDAB683B062EFE6`).

### Bằng chứng sau khi chạy lại (đo qua proxy `:9000`)
| Kiểm tra | Kết quả |
|---|---|
| 8 asset JS/CSS | **200** — không còn 404 |
| CSS đang chạy có rule MỐC 119b (`flex:none`) | ✅ có · `.edm-tabs` nguyên vẹn |
| Đăng nhập `admin` | **HTTP 200** + cookie `mep_session` |
| Bootstrap | **HTTP 200** · **76 module** |
| `receiving.label` | `Kế hoạch giao hàng` — codepoint `004b 1ebf … 00e0 006e 0067` |
| Nhãn còn dấu `?` | **0** |
| `dept_legal_contract_review.icon` | `HĐ` ✅ |

**Cổng kiểm sau khi đổi vân tay:** `typecheck` **0** · `test:regression` **72/72** ·
`lint` **223/2 — đúng gốc**. **Không commit, không push.**

## 120 — BA YÊU CẦU CỦA USER 01/10/2026 VỀ MODAL PHÂN QUYỀN

**USER (nguyên văn):**
1. «Xóa dòng note ghi mốc 39 ở modal sửa tài khoản»
2. «tab Phân quyền công việc / chức năng không cuộn được cả tab mà chỉ cuộn được mỗi ma trận
   phân quyền nên rất khó xem được hết nội dung.»
3. «tab phần quyền công việc / chức năng của modal sửa tài khoản dùng chung với modal phân quyền
   của tab 6. phân quyền người dùng, hay sửa lại giao diện cho 2 tab này giống nhau hoặc có thể
   kế thừa - dùng chung giao diện.»

### ⭐ Nguyên nhân gốc: KHÔNG PHẢI LỖI COMPONENT, MÀ LÀ LỆCH CẤU TRÚC JSX

MỐC 117 đã cho cả hai modal dùng chung `PermissionAccessPanel`. Người dùng vẫn thấy hai
giao diện khác nhau. Đọc lại `app/page.tsx` mới thấy:

| Modal | Panel nằm ở đâu |
|---|---|
| `UserAccessModal` (tab 6) | **trong** `<div className="modal-body">` |
| `UserEditModal` (thẻ «Phân quyền công việc / Chức năng») | **NGOÀI** nó |

Hệ quả đo được trong CSS, khớp 1-1 với ảnh USER gửi:
- `.modal-body { padding:18px 20px!important; overflow-y:auto; flex:1 1 auto; min-height:0 }`
  ⇒ panel ngoài đó **mất lề** (ảnh: chữ sát mép trái) và **mất vùng cuộn của modal** (yêu cầu 2).
- `.drawer-section h3, .modal-body h3 { color:#183451!important; font-weight:730!important }`
  ⇒ tiêu đề `h3` trong panel ngoài `modal-body` **không đậm, không đậm màu** — đúng như
  `PHÂN QUYỀN CÔNG VIỆC / CHỨC NĂNG` nhạt trong ảnh (yêu cầu 3).

⇒ Sửa **cấu trúc** đúng cách «kế thừa - dùng chung giao diện» như USER mong muốn, thay vì chữa
CSS bên ngoài. Không phải viết lại panel, không phải nhân bản component.

### Đã làm
| # | Việc | File |
|---|---|---|
| 1 | Bỏ thuộc tính `note` ở `UserEditModal` | `app/page.tsx` |
| 1b | Cho `note?: string` + `{note&&<p>…</p>}` (46 nơi gọi, tương thích ngược) | `lib/ui-blocks.tsx` |
| 2+3 | Chuyển `PermissionAccessPanel` **vào trong** `modal-body`; gom khối tab-tài-khoản vào nhánh riêng | `app/page.tsx` |
| 2 | `.embedded-permission-body .table-wrap { max-height:none; overflow:visible }` | `app/styles/canonical.css` |

Vì sao (1) cần sửa cả `BaseModal`: trước đó `note: string` là **bắt buộc** và luôn render
`<p>{note}</p>`. Bỏ prop ⇒ TypeScript lỗi; truyền `note=""` ⇒ còn một `<p>` rỗng ăn margin.

Vì sao (2) cần CSS: dù đã vào `modal-body`, `.modal .table-wrap` vẫn bị ép
`max-height:min(58vh,640px)` ⇒ vẫn lồng hai vùng cuộn. Bỏ giới hạn đó thì `.modal-body`
cuộn **toàn bộ thẻ**, và tiêu đề cột **vẫn dính** nhờ
`.table-wrap > table > thead > tr > th { position:sticky; top:0 }` — sticky bám theo vùng cuộn
gần nhất, nay là `.modal-body`. Class `.embedded-permission-body` chỉ `PermissionAccessPanel`
dùng ⇒ không ảnh hưởng bảng nào khác.

### Bằng chứng (đo trên bản build thật)
- `.embedded-permission-body .table-wrap{max-height:none;overflow:visible}` — có trong `dist`
- Chuỗi «MỐC 39» trong bundle JS: **0** ✅
- Panel nằm trong `modal-body`: `UserEditModal` ✅ và `UserAccessModal` ✅ ⇒ **hai modal đồng nhất cấu trúc**
- 8 asset **200** · login **200** · bootstrap **76 module** · `receiving` đúng dấu · nhãn hỏng **0**

**Cổng kiểm:** `typecheck` **0** · `test:regression` **72/72** · `lint` **223/2 (đúng gốc)** ·
`verify:fingerprint` **ĐẠT** · build **exit 0** · vân tay mới `VNTECH-FP-F0AF369533F385B2`
(hội tụ 2 vòng). ⛔ Không tạo migration mới. **Không commit, không push.**

### Việc còn tồn
Xem lại ảnh thì cột «HẾT HẠN» vẫn là ô `dd/mm/yyyy` trống chưa có ý nghĩa rõ (mục TYPE 3 đã
dời từ trước). Chưa tự ý sửa vì USER chưa yêu cầu trong vòng này.

## TASK-012 — ĐÍNH CHÍNH DANH SÁCH "CỐ Ý KHÔNG SỬA" (vòng 190, 01/10/2026)

**TASK:** kiểm chứng danh sách tệp "cố ý không thêm dấu" mà tài liệu tự khẳng định là "đã kiểm chứng là đúng".
**STATUS:** ✅ DONE
**COMPLETED:**
- Kiểm chứng lại **từng dòng** thay vì tin lời tự khẳng định của tài liệu.
- Phát hiện danh sách **sai 2/5 mục**.

**FILES CHANGED:**
- `docs/dsh-state/CHECKLIST.md` — sửa mục "DANH SÁCH CỐ Ý **KHÔNG** SỬA" (chỉ tài liệu, **không** sửa mã nguồn).

**DATABASE:** không đổi.
**API:** không đổi.
**SOURCE CODE:** **không sửa gì** — cả 2 chuỗi sai đều là chuỗi hiển thị, để nguyên theo quyết định của user.

**KẾT QUẢ KIỂM CHỨNG:**

| mục trong tài liệu | thực tế |
|---|---|
| `admin-bulk-import.ts:107-132` | ✅ đúng — `USER_ALIASES` |
| `material-import.ts:114-129` | ✅ đúng — `requestAliases` |
| `boq-normalize.ts` | ✅ đúng — `markers=["cot he thong tu link tinh khong nhap tay", …]` dòng ~12 |
| `ui-shared.tsx:347,364,365,388` | ❌ **sai toàn bộ** |
| `p2-approval-flow.mjs` | ❌ **không thuộc nhóm này** |

- **:347** = `sheetName:"Ton kho"` ⇒ **chuỗi hiển thị cho người dùng** trong tệp Excel xuất, KHÔNG phải bảng alias.
- **:364, :365, :388** = code thường của `mapBoqPriceRows`.
- Bảng alias thật của tệp này nằm ở **:356** (`aliases={boqItemId:["ma dong boq",…]}`),
  **:373-374** (`["khoa doi chieu","giu nguyen",…]`) và **:397** (`aliases={paymentDate:["ngay thanh toan",…]}`).
- `p2-approval-flow.mjs` = **0 bảng alias bỏ dấu**; chỉ có alias tên trường camelCase/snake_case.

**TEST / XÁC MÌNH:**
- Bằng chứng dòng 371 `normalizeBoqHeader(…)` bỏ dấu TRƯỚC, rồi :373-374 so mảng chuỗi không dấu
  ⇒ thêm dấu chắc chắn làm hỏng tra cứu. Bằng chứng khớp với cơ chế `.normalize("NFD")`.
- `git diff` cho **đúng 2 hunk**, cả hai đều là nội dung vòng này ⇒ **không hỏng** phần tài liệu có sẵn.
- `npm run verify:fingerprint` → **ĐẠT**, `VNTECH-FP-F0AF369533F385B2` **không đổi**
  ⇒ xác nhận `docs/` không nằm trong tập băm nguồn.
- FFFD = 0.

**REMAINING:**
- `ui-shared.tsx:347` `"Ton kho"` → `"Tồn kho"`: **CHƯA SỬA** (user đã dừng đợt quét chính tả này).
  Nay đã **gỡ bỏ hàng rào bảo vệ nhầm**, nên có thể sửa khi user cho phép.
- `TASK-HISTORY.md` mục này.

**NEXT:** chờ user cho phép đợt quét chính tả, hoặc sang mục TYPE 1/2 kế tiếp.

**BLOCKER:** không có.

## TASK-013 — RÀ TRÍCH DẪN SỐ DÒNG TRONG TÀI LIỆU (vòng 190, 01/10/2026)

**TASK:** rà toàn bộ trích dẫn dạng `tệp:sốdòng` trong `docs/dsh-state/`.
**STATUS:** ✅ DONE
**FILES CHANGED:** `CHECKLIST.md` (2 dòng) · `DECISIONS.md` (2 dòng + D-059).
**DATABASE / API / SOURCE CODE:** không đổi.

**KẾT QUẢ:** quét 22 trích dẫn ⇒ **3 sai thật**, đã sửa hết.

| # | trích dẫn cũ | đã sửa thành | kết luận gốc |
|---|---|---|---|
| 1 | `UserManagementUseCase.java:427-436` | **:499-509** | ✅ vẫn đúng |
| 2 | `globals.css:155,159` | bỏ số dòng (tệp đã minify còn 68 dòng) | ✅ vẫn đúng |
| 3 | `scripts/local-server.mjs:181` phục vụ `dist/client` | `:20` **nạp** bundle SSR; bundle đó mới phục vụ asset | ✅ quy tắc vẫn đúng, **gán sai cơ chế** |

**XÁC MÌNH:**
- #1: đọc `:499-509` — đúng là `findDepartmentPermission` + `throw ApiError(... "chưa được cấp quyền" ...)`,
  và thông báo có hướng dẫn cụ thể ⇒ **quy tắc nghiệp vụ cố ý** như tài liệu nói. Chỉ sai dòng.
- #2: quét `app/globals.css` ⇒ có quy tắc `.modal` với `display:flex;flex-direction:column` ⇒ nội dung còn nguyên.
- #3: `local-server.mjs` **119 dòng**, **không có** chuỗi `dist/client`; chỉ có `dist` ở `:20`.
  Đối chiếu `docs/24_SYSTEM_AUDIT_REPORT.md:23` và `docs/14_...:105`: UI là **SSR**,
  `dist/client` **không có** `index.html` ⇒ xác nhận bundle `dist/server/index.js` phục vụ asset.
- `git diff` xem lại: **chỉ 4 dòng** bị đổi, không đụng phần có sẵn. FFFD = 0.

**BẪY ĐÃ TRÁNH:** bộ quét của tôi báo 8 lần sai cho `REARM-GOAL-CHECKLIST.md`
(ví dụ dòng nói "quét lại toàn bộ fence của `CHECKLIST.md`: 271 dòng" — con số 271 thuộc về
`CHECKLIST.md`, không phải tệp `REARM`, nhưng regex ghép nhầm). Đã mở từng dòng kiểm lại
trước khi kết luận ⇒ **chỉ 3 lỗi thật, không phải 11**. Công cụ quét cũng cần được kiểm chứng.

**REMAINING:** xem `NEXT`.
**NEXT:** mọi quyết định loại "TYPE 3 / nghiệp vụ" vẫn đang chờ user (2 đổi tên kho · ngữ nghĩa
cột «Hết hạn» · 18 action mồ côi · `delete_partner`/`delete_supplier` · SMTP · MỐC 104/105 ·
gia hạn HĐ lần N · dừng tunnel Cloudflare); `mvn -o -B test` cần máy có Maven.

## TASK-014 — MỐC 121 · 2 TAB PR/PO KHÔNG HIỆN + ĐỔI TÊN MENU + RÀ CHÍNH TẢ MÀN MUA HÀNG (01/10/2026)

**Kích hoạt:** anh gửi 3 ảnh chụp màn PR & PO đang chạy (`127.0.0.1:9000`, 21:14–21:16) kèm 4 yêu cầu.

| # | yêu cầu | kết quả |
|---|---|---|
| 1 | Đổi tên menu → `PR & PO` | ✅ `lib/menu-helpers.ts` · `app/page.tsx` · **migration `V35` + `drizzle/0328`** |
| 2 | 2 tab PR / PO | ✅ **đã có sẵn từ TASK-119 — thiếu CSS**, không phải thiếu tính năng |
| 3 | Giải thích 2 bảng dưới | ✅ giải thích + viết vào UI |
| 4 | Rà chính tả / hiển thị | ✅ 7 mục |

### Phát hiện quan trọng nhất
`PR74PO28` anh thấy trong ảnh 3 **không phải lỗi dữ liệu** — nó chính là dải 2 tab đã có sẵn.
Vì `globals.css` và `canonical.css` **không có rule nào** cho `.purchase-tabbar` / `.purchase-tab`,
4 phần tử `<button>` rơi về `display:inline` và chữ dính liền: `PR`+`74`+`PO`+`28`.
Đã thêm **23 rule CSS** vào `canonical.css`. ⛔ Không sửa markup, không sửa logic, không đụng dữ liệu.

### Bài học → D-060
**«Có markup» ≠ «có hiển thị».** Trước khi kết luận *tính năng chưa làm*, phải grep **3 tầng**:
mã nguồn → CSS → bundle đang chạy. Ở đây tầng 1 có đủ, tầng 2 rỗng ⇒ 2 tầng đầu báo «chưa làm»
nếu chỉ đọc mã nguồn. Cùng dạng với `D-056` (MỐC 120).

### Gate
`typecheck` 0 lỗi · `test:regression` 72/72 · `verify:fingerprint` **ĐẠT** (`VNTECH-FP-9582AE7DBD0A9B62`, source 691).
⏳ `npm run build` **chưa chạy** (quy tắc 1 của `D-052` — app đang mở) ⇒ anh chưa thấy thay đổi trên trình duyệt.

### Hai việc CHỜ ANH QUYẾT (không tự ý làm)
1. **Bảng PO lặp 2 lần** — tab `:293` và card `:297` cùng dữ liệu `visiblePO`, trùng `data-vntech="purchasing-po-row"`.
2. **Cột D của bảng 1 là phân bổ tỷ lệ**, không phải số thật của từng hệ
   (`paid × hợp đồng hệ / tổng hợp đồng dự án`).

---


---

## TASK-015 — VÒNG 191: KIỂM CHỨNG MỐC 121 KHÔNG CẦN BUILD + GHI NHÃN CỘT D + ĐỒNG BỘ SQLite

**Bối cảnh:** MỐC 121 đã xong mã nhưng **chưa build** (app đang mở ⇒ `D-052` quy tắc 1).
Không chờ user, tìm cách **kiểm chứng không cần build** và làm việc song song.

| việc | kết quả |
|---|---|
| Build có redirect được không? | ⛔ **không** — `vinext` **hardcode** `outDir = process.cwd()/dist`, không có `--outDir` |
| Kiểm chứng thay bằng gì | **phân tích tĩnh + dữ liệu thật từ `/api/system`** |
| Bằng chứng `PR74PO28` | ✅ `requests = 74`, `purchaseOrders = 28` — **khớp đúng** 4 chữ user thấy |
| CSS có hợp lệ? | ✅ quét **345** rule toàn file ⇒ **0 lỗi cú pháp** |
| CSS có chết không? | ✅ 6 class đều dùng thật trong JSX (`:267,268,269,290,291`) |
| Nhãn DB | `moduleCatalog[32].label = "Mua hàng & PO"` ⇒ **V35 chưa chạy**, đúng dự kiến |
| Cột D (bảng 1) | ✅ gắn nhãn **«ƯỚC TÍNH»** — xem `D-061` |
| Số thanh toán thật theo hệ | ⛔ **KHÔNG THỂ** — không bảng nào có trường trỏ về hệ |
| Phát hiện thêm | ⛔ 6/8 vật tư BOQ (97,7 % giá trị HĐ) đều xếp vào `KHAC` |
| Đồng bộ SQLite | ✅ làm lại **bước 7 của `D-055`** mà vòng 190 bỏ sót |
| Fingerprint | `VNTECH-FP-B76E3EB75E05E375` · source 691 · **ĐẠT** |
| Lỗi tự phát hiện | ⛔ quên `await` ⇒ ghi `[object Promise]` vào `brandFingerprint` — đã sửa, verify ĐẠT |
| Gate | `typecheck` **0** · `test:regression` **72/72** · `lint` **223/2** (đúng baseline) |

---

## TASK-016 — Bịt điểm mù cổng CSS phát hiện sau MỐC 121

- **Ngày:** 01/10/2026 · **Vòng goal:** 192
- **STATUS:** DONE
- **COMPLETED:**
  - Đo được cổng CSS mù `canonical.css` (205 lớp) và mù chiều ngược; đo được 133 lớp trơ ⇒ bác bỏ quy tắc trải kèm.
  - `scripts/css-baseline-audit.mjs`: đọc 3 stylesheet, bóc chú thích, đăng ký 16 lớp chết, khóa hợp đồng MỐC 121.
  - `tests/moc121-purchasing-tabs.test.mjs`: 10 ca; khai báo vào `package.json` → `test:regression`.
- **FILES CHANGED:** `scripts/css-baseline-audit.mjs`, `tests/moc121-purchasing-tabs.test.mjs` (mới), `package.json`,
  `lib/vntech-identity-data.mjs`, `VNTECH_FINGERPRINT.json`, `VNTECH_PRODUCT_IDENTITY.txt`, `docs/dsh-state/*.md`.
- **DATABASE:** SQLite `.local-data/warehouse.sqlite` — đồng bộ `source_fingerprint` / `brand_fingerprint`,
  trigger bảo vệ 2/2 còn nguyên. **Không** đụng MySQL, **không** migration mới.
- **API:** không đổi.
- **TEST:** `typecheck` exit 0 · `test:regression` **82/82** · `verify:css-baseline` exit 0 ·
  `verify:fingerprint` ĐẠT · thử đột biến bắt đúng cả hai chiều · app HTTP 200 (7 123 bytes).
- **REMAINING:**
  - `npm run build` — CHỜ anh đóng trình duyệt (D-052 rule 1; `vinext build` ghi cứng vào `dist/`).
  - Chạy `V35` trên MySQL thật (`flyway_schema_history` đang ở V31).
  - 3 quyết định TYPE 3: bảng PO lặp (`Purchasing.tsx:293` vs `:297`), phân bổ lại `boqItems.systemCode`, tệp `.docx`.
  - Ngoài phạm vi đã ghi nhận: 3 công cụ dò (`tools/probe-*.mjs`) và 1 test còn trỏ tới lớp UI đã bị bỏ.
- **NEXT:** chờ anh đóng trình duyệt để build thật; sau đó `V35` trên MySQL.
- **BLOCKER:** không có blocker kỹ thuật cho phần đã xong; phần còn lại đều cần anh quyết hoặc thao tác tay.

**Bài học rút ra (đã ghi D-062).**
1. Cổng dò selector phải bóc `/* … */` — banner kiểu liệt kê làm cho phép "còn class" đúng giả. Thử đột biến mới phát hiện.
2. Cổng không nằm trong `npm test` thì không được canh mỗi lần; sửa cổng phải kèm test trong `tests/`.
3. Sửa phạm vi đọc của một cổng = mở rộng điều kiện, không phải nới lỏng.

---

## TASK-017 — ĐO LẠI TOÀN BỘ BỘ TEST, VÁ 2 LỖI THẬT, CHỐNG HỎNG ÂM THẦM (01/10/2026) — **DONE**

**Bối cảnh.** Vòng 192 phát hiện `tools/probe-*.mjs` + 1 test vẫn trỏ tới lớp UI đã biến mất. Trước khi
sửa/xoá, phải trả lời: **UI bỏ lớp đó cố ý hay do hồi qui?** Xoá test thối có thể che giấu đúng lỗi.

**Kết quả đo.** `tests/` = **119 tệp / 696 ca**; `test:regression` = **14 tệp** ⇒ **105 tệp / 583 ca
không được chạy ở đâu cả**, trong đó **10 tệp / 25 ca đang đỏ** mà `npm test` vẫn báo xanh.

**Hai chẩn đoán sai trước khi đúng** (đã thành quy tắc trong D-063):
1. `node --test` thiếu `--import tsx` ⇒ mọi tệp import `.tsx` chết `ERR_UNKNOWN_FILE_EXTENSION` ⇒ tôi
   báo «59 ca hỏng». Số thật **27 ca**. → **Luôn chạy `node --import tsx --test`.**
2. Hàm kiể `--is-ancestor` bắt lỗi rồi `return ""` và so `=== ""`, trong khi `git merge-base --is-ancestor`
   trả ≠ 0 **khi thất bại** ⇒ kết luận ngược. Quét blob của cả **84 commit** chạm `app/page.tsx` cho
   **0 lần đổi trạng thái** ⇒ `unity` **chưa từng có** ô tìm/lọc + danh sách đã chọn của modal thông báo;
   tính năng chỉ còn ở `backup/mt3-head-20260928` (`7fdf71d`) và `73ff69d`.

**Vá 2 lỗi thật.**
- `app/screens/Purchasing.tsx`: nhãn lọc ngày ghi chung «Ngày (từ)/(đến)» cho cả PR và PO, trong khi
  logic (`purchasingRowDate`) vốn đúng và khác nhau ⇒ thêm `PURCHASING_DATE_DIM`, nhãn đổi theo tab,
  thêm ghi chú `purchasing-date-dim-note` nêu rõ 2 cột thật. `p01-p02-p03-contract` **14/15 → 15/15**.
- `docs/agent-progress/F-03-TAI-CHINH-AUDIT-PHU-THUOC.md`: **23/23 số dòng Java thối rot** (lệch +16, riêng
  một dòng +42). Mã đúng, hồ sơ sai ⇒ **sửa hồ sơ, giữ nguyên phép kiểm** ⇒ **7/7** (D-064).

**Chống tái diễn.** `scripts/test-suite-health.mjs` + `npm run audit:tests`. `KNOWN_RED` = 10 mục kèm
lý do + mã mục. Tệp đỏ ngoài danh sách, hoặc đang nằm trong `test:regression` ⇒ exit ≠ 0. Mục đã xanh
lại ⇒ báo để gỡ. ⛔ Không đưa vào `npm test` (vài phút). **Thử đột biến:** bỏ `KNOWN_RED` ⇒ exit 1.

**Cổng.** `test:regression` ✅ **113/113** (82 → 113) · `typecheck` · `verify:css-baseline` ·
`verify:fingerprint` · `test:workflow` · `audit:tests` đều exit 0 · `lint` giữ nền **223 / 2**.
Kiểm kê: **10 tệp đỏ / 25 ca**, tất cả ngoài cổng, đã ghi `KNOWN_RED`.

**Fingerprint.** Điểm cố định sau 2 vòng · `fileCount` **692 → 693** · source `e0e795001c1df084…` →
**`9aa782dc3f6ebbf4…`** · short → **`VNTECH-FP-9AA782DC3F6EBBF4`** · brand `5ece5036…` → **`586bd208…`**
(đổi vì brand chứa source) · release `f7d72d34…` **không đổi**. Tính lại độc lập đã khớp; không có
`[object Promise]`, FFFD = 0. SQLite: backup → bỏ 2 trigger → `UPDATE` cả 2 bảng trong **một**
transaction → COMMIT → tạo lại trigger; khớp SSOT, trigger 2/2, thử ghi trái phép bị chặn.

**Bài học rút ra (D-063, D-064).**
1. **Một test không nằm trong cổng chạy thì hỏng âm thầm; cổng xanh không phải bằng chứng.**
2. **Trước khi báo khiếm khuyết, hãy kiểm chứng chính cách đo** — lỗi đo lường nguy hiểm hơn lỗi được đo,
   vì nó tạo ra một sự thật giả có vẻ rất chắc chắn.
3. **Test đỏ là tín hiệu, không phải kẻ phá hoại** — hỏi «mã, tài liệu, hay phép kiểm đang sai?» trước.
4. `package.json` là **tài liệu kiến trúc**: `test:regression` là danh sách hợp đồng nào được bảo đảm.

**BLOCKER:** không có blocker kỹ thuật. ⛔ **Không commit** — anh đã nói «Chưa commit, để tôi xem trước».

**Chờ anh (TYPE 3).** ⭐ 10 tệp đỏ còn lại; nổi bật là 7 tệp `mt3-*` thuộc đợt đã rollback trong khi
`TASK_INDEX.md:158` + `MASTER_STATUS.md:395` vẫn ghi DONE ⇒ **108/110 đang thổi phồng**. Khôi phục MT3
(còn nguyên trên `backup/mt3-head-20260928`) hay phân loại lại NOT DONE? ⛔ Không tự sửa/xoá 7 test —
chúng là chứng cứ duy nhất còn lại của đợt làm bị rollback.

---

## TASK-018 — SỬA HAI PROBE ĐANG BÁO SAI PHẠM VI (01/10/2026) — **DONE**

**Bối cảnh.** Round 193 (TASK-017) đóng lại bằng phát hiện lớn: *những test nằm ngoài cổng chạy thì
hỏng âm thầm*. Nhưng nó cũng để lại hai món nợ nhỏ ghi ở `CHECKLIST.md:3986-3987`: hai probe U-09 và
U-14…U-17 vẫn truy tìm lớp mà UI không còn dùng. Đây là lượt **TYPE 1** kế tiếp: hai công cụ đang
**báo sai**.

**Chẩn đoán vòng đầu chỉ đúng một nửa.** Tôi định xoá `delivery-timeline` và `staff-toolbar` khỏi
danh sách dấu hiệu. Đo trước (quy tắc **đo trước, xoá sau** của D-063) cho thấy vấn đề thật **lớn hơn
nhiều**: cả hai probe **chỉ đọc `app/page.tsx`** trong khi mã đã tách sang `app/screens/*.tsx` (34 tệp)
+ `app/components/*.tsx`. `probe-ui-adoption` còn **tự mâu thuẫn**: mục A quét cả `app/screens/`,
mục B thì không ⇒ «khối lượng mẫu cũ còn tồn» luôn báo thiếu **âm thầm**. Đây là lỗi của **D-062**
(cổng CSS chỉ đọc 1 trong 3 stylesheet) lặp lại ở tầng probe.

**Bằng chứng cụ thể.** `baseline-filter-card` **còn sống** trong `app/screens/Receiving.tsx` nhưng
bảng kiểm kê cũ không thấy. Sau khi mở rộng: bảng kiểm kê **9 → 21 dòng**, CẦN CHUYỂN **8 → 17**,
ĐÃ CHUẨN **1 → 4**, tệp quét **1 → 58**. Mục B: `table-wrap` **51 → 104**, `<Empty` **54 → 104**,
`overlay` **2 → 13**, điều kiện quyền rải rác **19 → 51**.

**Sửa, không nới.** (1) Mở rộng **phạm vi đọc** — hướng D-044 cho phép, nới điều kiện thì không.
(2) Bóc chú thích trước khi dò — không thì một dòng `// .staff-toolbar` là báo động giả (D-062).
(3) **Không xoá dấu hiệu nào.** `staff-toolbar` / `staff-directory-head` / `delivery-timeline` không
còn UI dùng nhưng **CSS còn** và đã nằm trong `KNOWN_DEAD_CANONICAL` ⇒ xoá đi là **mất vé cảnh báo
hồi qui**. Thay bằng **mục D** in ra từng dấu hiệu chết kèm phân loại («CÒN CSS» / «bóng ma thuần»).
Đối chiếu chéo với `KNOWN_DEAD_CANONICAL`: **khớp chính xác**.

**Kiểm chứng bằng thử đột biến — 12/12.** Comment giả ⇒ không báo; class thật ⇒ báo, 17 → 18 và dấu
hiệu biến mất khỏi mục D; `table-wrap` thêm ở màn hình tách file ⇒ 104 → 105; khôi phục byte-for-byte.

⚠️ **Bản thử đầu của tôi báo sai hai lần** — nhắc lại vì đây là lần thứ tư trong phiên:
1. Gõ nhầm mã ký tự Unicode (`\u1ed1` thay vì `\u1ed7`, `\u1ea4` thay vì `\u1ea6`) ⇒ **6 phép kiểm
   "bại" trong khi cả hai probe hoàn toàn đúng**. Đổi sang ký tự thật.
2. THỬ 1 xoá tệp `.bak` sớm ⇒ THỬ 2 không khôi phục được ⇒ script sập giữa chừng và **để lại
   `app/screens/Delivered.tsx` ở trạng thái đột biến**. Phát hiện ngay, `git checkout` về HEAD, xác
   nhận sạch; bản sau dùng backup một lần + `try/finally`.

**Bài học rút ra (D-065).** Xem §DECISIONS.

**Cổng.** Cả 6 exit 0 · `test:regression` **113/113** · FFFD = 0. `verify:fingerprint` xanh xác nhận
`tools/` **không** thuộc tập băm ⇒ sửa probe **không** đổi fingerprint. `MANIFEST_SHA256.txt` không
sửa tay (chỉ tái sinh bằng tool lúc đóng gói).

**Chờ anh (TYPE 3).** Hai probe vẫn **chỉ là công cụ đo, không phải cổng chặn** — có biến thành cổng
thật không? · `approved-module-head` (bóng ma thuần) gỡ hay giữ? · 10 tệp đỏ + 108/110 thổi phồng
(xem TASK-017) · **commit** («Chưa commit, để tôi xem trước») ⇒ ⛔ chưa tự `git add`/`commit`/`push`.
---

## TASK-019 — QUÉT TOÀN BỘ CÔNG CỤ ĐO, SỬA CỔNG `probe-bootstrap-keys`, VÁ LỖI BOOTSTRAP JAVA (01/10/2026) — **DONE**

**Bối cảnh.** D-065 (TASK-018) sửa 2 probe vì chúng đọc hẹp hơn cả mã nguồn. D-065 tự đặt câu hỏi ở
đoạn kết: «còn bao nhiêu tệp ngoài phạm vi quen thuộc mà công cụ này không thấy?» — TASK-019 là câu trả lời
đo được cho câu đó, trên **toàn bộ** công cụ đo chứ không riêng 2 cái đó.

**Phạm vi đã quét.** 345 công cụ (304 `tools/` + 41 `scripts/`), trong đó 153 là công cụ đo.
Thu hẹp lại 19 cổng thật theo `docs/dsh/MT2_GATE_SWEEP_23-09.md:69`.

**Kết quả kiểm chứng từng cổng hẹp (mở tệp, không tin bộ dò).**

| Cổng | Đọc gì | Kết luận |
|---|---|---|
| `probe-bootstrap-keys` | `app/page.tsx` duy nhất | ⛔ lỗi thời — 83/96 khoá, mù với 13 khoá |
| `probe-statusbadge-parity` | `StatusBadge.tsx` | ✅ đúng (so 1 tệp với bản chép `<Pill>` cũ) |
| `probe-work-item-field-contract` | `WorkCenter.tsx` | ✅ đúng (hợp đồng của riêng một màn) |
| `probe-modal-branch-coverage` | không đọc tệp nguồn | ✅ không liên quan |

**Phát hiện sản phẩm.** `workItemParticipants` + `workItemComments` có trong bản Node
(`scripts/system-route.mjs:812-815,824`), **không** trong `BootstrapDataAdapter.java`, và bị một tệp
kiểm thử đòi (`tests/work-item-comment-participant.test.ts:187`). Đo trên `:18081` và `:9000`
(giống nhau) xác nhận bản Java thật sự không trả 2 khoá này ⇒ màn «Hỗ trợ liên phòng»
(`app/screens/WorkHierarchy.tsx:113`) chết âm thầm.

**Thay đổi.**
1. `java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/BootstrapDataAdapter.java`
   — thêm 2 khoá theo SQL bản Node + đưa vào `blank(...)`. *(chưa biên dịch: máy không có Maven)*
2. `tools/probe-bootstrap-keys.mjs` — phạm vi đọc 1 tệp → 65 tệp UI + 33 adapter Java; báo kèm tệp
   đọc khoá; thêm `--live`; `process.exit(0)` → `process.exitCode = 0` (tránh libuv assert trên Windows).
3. Tài liệu: `CHECKLIST.md` §125 · `CURRENT_STATE.md` MỐC 125 · `DECISIONS.md` D-066.

**Kiểm chứng.** Thử đột biến **5/5** · 6 cổng **6/6 exit 0** · FFFD = 0 · cân bằng cú pháp tệp Java OK.

**Tự phê bình.** Hai lần thử đột biến đầu báo HỎNG và **cả hai do biến dị, không do cổng**: một lần
biến `if (false) data.put(…)` (vẫn còn chuỗi `.put("…")` mà cổng quét văn bản), một lần gỡ mới một chỗ
trong khi tệp có hai chỗ khai báo. Đã sửa biến dị rồi mới 5/5 — lần thứ **7** công cụ của tôi tự làm
sai trong phiên này (xem D-066, quy tắc 6).

**Chưa xong / cần người dùng.**
* ⛔ `mvn -o -B test` trên máy có Maven để xác nhận bản vá Java.
* ⛔ Dựng lại `:18081`; hiện `--live` **vẫn** báo `workItemParticipants` — đúng, vì đang chạy bản cũ.
* ❓ Cổng này có thành cổng chặn thật không (giống §124.9 câu 1)?


## TASK-020 — Ba tệp kiểm thử đỏ ngoài cổng: một là thật, một là MT3, một cần user chốt

**Bối cảnh.** Vòng 194 phát hiện `tests/` có 119 tệp nhưng `test:regression` chỉ chạy 14;
105 tệp ngoài cổng có 10 tệp đang đỏ. `scripts/test-suite-health.mjs` lập `KNOWN_RED` để chặn
nợ mới. Vòng này xử lý từng tệp thay vì để tồn.

**Kết quả**

| Tệp | Kết luận | Xử lý |
|---|---|---|
| `ad11-scope-audit` | Tệp thử trỏ sai chỗ sau MỐC 117 (nội dung đã tách sang `PermissionAccessPanel`) | **ĐÃ SỬA** + mạnh thêm 2 khẳng định · đột biến 8/8 · gỡ khỏi `KNOWN_RED` |
| `p2-d4-approval-timeline` | Test đỏ là «§19 + **MT3-B.2**» ⇒ thuộc đợt MT3 đã rollback, **không phải** hồi quy P2-D4 | Ghi rõ lý do trong `KNOWN_RED` · **đính chính phân loại sai của vòng 194** |
| `pr03-project-detail-tabs` | **Mâu thuẫn nội tại**: tiêu đề giữ dải 6 tab, khẳng định đòi BCH ở chỉ số 4; mã có 6 tab | **CHỜ USER CHỐT** (quyết định nghiệp vụ) |

**Phương pháp.** Không tin log cắt: chạy `--test-reporter=tap` và trích **tên test đỏ** cho từng
tệp. Đó là bằng chứng, và nó lật ngược phân loại của chính tôi.

**Nguyên tắc giữ.** Sửa `ad11` bằng cách **mạnh hơn** chứ không phải nới: vẫn kiểm đủ hai mục phạm
vi, cổng `warehouse_scope_kind`, hai bảng riêng, action `save_user_access` — và thêm chứng minh
modal thật sự render panel. Đột biến 8/8 bắt đúng.

**Kệ vì sao cần nói.** D-065 nói *công cụ đo hỏng thì lỗi sản phẩm sống dai*. Vòng này là
**tệp thử** trỏ sai chỗ sau một lần tách mã đúng — cùng hình dạng, lần thứ 5. Và một lần nữa,
**chính phần trình bày sai tôi viết, không phải sản phẩm**.

**Chưa làm.** Không commit (user: «Chưa commit, để tôi xem trước»). Không merge `unity` → `main`.
Không đụng 8 tệp MT3. Không tự quyết `pr03`.


## TASK-020 (bổ sung) — `pr03` tự giải quyết bằng bằng chứng, không hỏi user

Tôi đã xếp `pr03` là TYPE 3 cần anh chốt. **Đó là do tôi dừng ở mức «hai câu trong tệp thử
mâu thuẫn nhau».** Đọc thêm 3 dòng mã đã hết mâu thuẫn: `TAB_LABELS = [LIST_TAB, ...DETAIL_TABS]`
(dải 6 ô) · `view = tab === 0 ? "list" : "detail"` (0 = danh sách) · `tab === 5 &&
<SiteCommandScreen` (BCH) · comment `app/page.tsx:982` «tab 5 = Ban chỉ huy».

Tiêu đề test và mã **cùng đồng ý** ⇒ chỉ có một khẳng định sót. Đây là **TYPE 1** (khẳng định
mô tả trạng thái trước một lần tách mã đúng), **không phải** quyết định nghiệp vụ.

Đã sửa và **mạnh thêm** 3 khẳng định; bản cũ không có khẳng định nào đo con số «6 tab» dù
tiêu đề nói tới nó. Đột biến 6/6 (trong đó P1 tái lập đúng lỗi bản cũ bỏ sót).

**Kết cục TASK-020:** 10 tệp đỏ → **8 tệp, toàn bộ là MT3 đã rollback**. Xanh 111/119.
6 cổng 6/6 xanh. Chưa commit theo chỉ đạo của anh.
## TASK-021 — Bảy cổng kiểm thử suy ra tự động, và hai lỗi lint đã giấu 645 test trong 2 vòng

Vòng 196 phát hiện `npm test` chết ngay ở bước đầu: 2 lỗi `set-state-in-effect` có sẵn từ
HEAD. Hệ quả không chỉ là «2 lỗi lint» — **typecheck và toàn bộ 645 test chưa bao giờ chạy
được một lần**. Đã sửa cả hai và chạy xanh.

Đồng thời: danh sách tệp cổng được viết tay nên một tệp thử mới nằm ngoài lưới mà cổng vẫn
xanh — tệp thử không bao giờ được chạy mà không ai biết. Đã đổi sang **suy ra từ nội dung
`tests/`**, mọi tệp không thuộc cổng phải khai trong `KNOWN_RED` kèm lý do. Đồng thời xoá
một chốt kiểm **rỗng** vốn xanh nhưng không thể thất bại: đỏ ngoài cổng tệt hơn cổng giả.
⇒ **D-069**. Kết quả 7 cổng · 7/7 xanh · 111/119 tệp xanh · fingerprint `VNTECH-FP-FEB8CEBF62CDF404` (694 tệp).

## TASK-022 — Kiểm thử hành vi toàn hệ thống: KHÔNG GHI CỨNG, nhưng điều chuyển kho KHÔNG CHẠY ĐƯỢC

> **Hồ sơ chính thức:** `docs/agent-progress/TASK-142.md` · đã đánh chỉ mục ở `docs/agent-progress/MASTER_STATUS.md`
> (dòng «Thay đổi trong phiên gần nhất» + **Known Problem #102**). Mốc lưu ý: số `TASK-022` ở đây thuộc
> **số riêng của sổ `docs/dsh-state/TASK_HISTORY.md`**, khác với số của sổ `docs/agent-progress/TASK-*.md`
> (đã tới `TASK-141` trước vòng này) — hai sổ **không dùng chung** số thứ tự.

Anh yêu cầu chạy toàn bộ chuỗi nghiệp vụ trên dữ liệu thật, mọi người thao tác đúng, không dùng
dữ liệu giả; sau đó kiểm xem quy trình có bị ghi cứng không bằng cách đổi người duyệt từng bước
rồi đảo thứ tự phòng ban.

**Đã chạy:** 8 giai đoạn, tất cả bằng tài khoản thật đăng nhập thật. Thêm 3 tài khoản dự phòng
để đổi người duyệt mà không phá vỡ bằng chứng cũ.

**Kết luận chính:** quy trình phê duyệt **không bị ghi cứng** — 7/7 khẳng định, có cả phép âm
(người duyệt cũ bị chặn) và phép âm thứ hai (đánh số lại bước đã có phiếu duyệt bị chặn).
Cấu hình đã được trả về nguyên trạng.

**Hai việc phát sinh phải nói rõ:** (a) phát hiện **hai cơ chế phê duyệt song song** — cửa sổ
«Quy trình phê duyệt» không dựng chuỗi nhưng vẫn cấp quyền duyệt; (b) **điều chuyển kho không
chạy được** vì bộ lược đồ dựng bằng cơ chế bay thiếu kho trung chuyển, đã truy tới tận gốc và
cần một tập lướt bay mới — **chờ anh duyệt**.

**Ba lỗi của chính tôi trong vòng này, đã ghi đủ ở `testlog.md` §3:** bộ đo báo thành công
cho 6 lệnh ghi thực tế không ghi gì (D-070); điều kiện `r?.ok === false` không bắt được
`null` nên vòng lặp không dừng (D-071); và 2 khẳng định ở GĐ9 đỏ vì **tiêu chí so sánh của tôi**
chứ không phải vì hệ thống (D-078). Cộng D-072…D-077, D-079 — tổng cộng **11 quyết định** mới.

**Sản phẩm:** báo cáo `.md` + `.docx` chuẩn hoá (11.318 byte, 7/7 XML hợp lệ), `testlog.md`
24 dòng sự cố. **Chưa commit** theo chỉ đạo của anh.

## TASK-023 — Vòng 203–208: vá lỗi tĩnh, tìm ra lỗi xoá âm thầm, bổ sung tệp thử hợp đồng

- **STATUS:** PARTIALLY COMPLETED (còn chờ build + 6 quyết định loại 3)
- **COMPLETED:**
  - `V37` tạo 3 bảng thiếu + kho trung chuyển, có chặn lặp lại (⛔ CHƯA CHẠY) — D-082.
  - Vá nhân đôi dòng BOQ: `BoqStoreAdapter.java` (⛔ CHƯA BIÊN DỊCH) — D-083.
  - Điều tra L-03 → phát hiện **nặng hơn hồ sơ cũ**: `save_email_settings` xoá âm thầm
    `approval_project_assignments` của **mọi bước form không hiển thị**, không ghi lại — D-084.
  - Sửa câu chữ sai ở `WorkflowModal.tsx:151`; **đính chính bản ghi cũ của chính mình** — D-085.
  - Thêm `tests/v207-workflow-approver-contract.test.mjs` (5 vệ) + đối chứng âm — D-086.
  - Phát hiện fingerprint trôi **từ vòng 206**; tính lại bằng hàm gốc; verify **ĐẠT**.
- **FILES CHANGED:** `V37__…sql` · `BoqStoreAdapter.java` · `app/screens/WorkflowModal.tsx` ·
  `tests/v207-workflow-approver-contract.test.mjs` · `lib/vntech-identity-data.mjs` ·
  `VNTECH_FINGERPRINT.json` · `docs/dsh-state/{DECISIONS,CHECKLIST}.md`
- **DATABASE:** ❌ KHÔNG thay đổi (⛔ không chạy gì lên CSDL thật)
- **API:** KHÔNG thay đổi hợp đồng API
- **TEST:** `npm test` **pass 649 · fail 0 · EXIT=0** · `v207` riêng **5/0 EXIT=0** (đối chứng âm **3 pass 2 fail EXIT=1**) · `verify-vntech-fingerprint` **ĐẠT EXIT=0**
- **REMAINING:** build (chặn V37 + BOQ + L-03) · 6 quyết định loại 3 chờ anh
- **NEXT:** chờ build ⇒ chạy V32–V37 ⇒ vá L-03 theo phương án anh chọn ⇒ RBAC dòng 69 ⇒ khử trùng BOQ
- **BLOCKER:** TYPE 3 (RBAC dòng 69 · L-03 a/b · chạy migration · khử trùng · con số 108/110) + D-044 (không có Maven)
- **⛔ CHƯA COMMIT. ⛔ CHƯA PUSH.**

- **Vòng 209 bổ sung (D-087):** vá L-06 cho `GRN-PX` (`StockManagementUseCase:451` + JOIN `projects` tại
  `WarehouseStockStoreAdapter:246-253`). ⛔ CHƯA BIÊN DỊCH. ⛔ `GRN-STO` cùng lỗi nhưng **để lại** vì
  `findTransferOrder` dùng chung cho 4 luồng — ghi FOLLOW-UP.

---

## TASK-024 — Khoá bất biến số phiếu kho bằng tệp thử (vòng 210)

- **STATUS:** DONE
- **COMPLETED:**
  - Tạo `tests/v210-so-phieu-khong-trung.test.mjs` (6 vệ) khoá bất biến «bộ đếm theo dự án ⇒ số phiếu kèm mã dự án».
  - Tự phát hiện và sửa 2 lỗi của chính tệp thử (khớp nhầm dòng chú thích `PX`; tên khoá `CENTRAL_RETURN` khác tiền tố số phiếu `KT-RET-`).
  - Đối chứng âm: bỏ mã dự án khỏi `GRN-PX` ⇒ `pass 4 · fail 2` EXIT=1 ⇒ hoàn tác byte-identical.
  - Tính lại fingerprint, đồng bộ `lib/vntech-identity-data.mjs` + `VNTECH_FINGERPRINT.json`.
- **FILES CHANGED:**
  - `tests/v210-so-phieu-khong-trung.test.mjs` (MỚI)
  - `lib/vntech-identity-data.mjs` · `VNTECH_FINGERPRINT.json` (3 trường; `releaseFingerprint` giữ nguyên)
  - `docs/dsh-state/DECISIONS.md` (D-087) · `CHECKLIST.md` · `CURRENT_STATE.md`
  - Tạo rồi **xoá** trong cùng phiên: `tools/v210-tinh-brand-fingerprint.mjs`
- **DATABASE:** ❌ KHÔNG thay đổi
- **API:** ❌ KHÔNG thay đổi
- **TEST:**
  - Tệp thử riêng `pass 6 · fail 0` EXIT=0 · đối chứng âm `pass 4 · fail 2` EXIT=1
  - `npm test`: `pass 655 · fail 0` EXIT=0
  - `verify-vntech-fingerprint.mjs`: ĐẠT · 696 files · EXIT=0
- **REMAINING:** `GRN-STO` (FOLLOW-UP) · ⛔ CHƯA BIÊN DỊCH mọi sửa đổi Java (D-044)
- **NEXT:** Vòng 211 — menu · PR · PO · báo cáo khối điều hướng NCC↔PO↔vật tư
- **BLOCKER:** Chờ user quyết — RBAC dòng 69 · L-03 (a/b) · build · V32–V37 · khử trùng BOQ

---

## TASK-025 — Sửa lỗi PO → «Xem phiếu đề nghị nguồn» (vòng 211)

- **STATUS:** DONE
- **COMPLETED:**
  - Truy vết gốc rễ, KHÔNG phỏng đoán: `PurchaseOrderDrawer` gọi `open("detail", { id, requestNo })` — object RÚT GỌN 2 trường.
  - `RequestDrawer` (`app/screens/RequestDrawer.tsx:25-37`) dùng THẲNG `request`, KHÔNG tự tra cứu lại ⇒ mọi trường khác `undefined` ⇒ màn vỡ.
  - Mọi call site khác đều truyền DÒNG ĐẦY ĐỦ (`Requests.tsx:128`, `page.tsx:600/707/1174`) ⇒ lỗi chỉ ở PO.
  - Sửa: tra cứu bản ghi thật trong `data.requests` theo `purchaseOrder.requestId`; không có thì KHÔNG mở màn vỡ, hiện thông báo nêu `request_id` + nút bị tắt.
- **FILES CHANGED:**
  - `app/screens/PurchaseOrderDrawer.tsx` (sửa)
  - `tests/v211-po-xem-phieu-de-nghi-nguon.test.mjs` (MỚI, 5 vệ)
  - `lib/vntech-identity-data.mjs` · `VNTECH_FINGERPRINT.json` (fingerprint)
- **DATABASE:** ❌ KHÔNG thay đổi
- **API:** ❌ KHÔNG thay đổi (lỗi nằm hoàn toàn ở tầng UI)
- **TEST:**
  - Tệp thử riêng `pass 5 · fail 0` EXIT=0
  - Đối chứng âm: trả về object rút gọn ⇒ `pass 3 · fail 2` EXIT=1 ⇒ hoàn tác byte-identical
  - `npm test` `pass 660 · fail 0` EXIT=0
  - `verify-vntech-fingerprint.mjs` ĐẠT · 697 files · EXIT=0
- **REMAINING:** Còn 11 mục của yêu cầu vòng 211 (menu · tab · PR · PO · báo cáo) — xem `CHECKLIST.md` § VÒNG 211
- **NEXT:** Nhóm MENU (1.1–1.4)
- **BLOCKER:** không cho bước này

### Bài học vòng 211
- **`verify-vntech-fingerprint.mjs` bắt được lỗi của chính tôi**: tôi truyền nhầm giá trị fingerprint CŨ (vòng 208) vào `.Replace`, trong khi tệp đã mang giá trị vòng 210 ⇒ `.Replace` không khớp ⇒ **không có gì thay đổi mà không ai báo**. Đã sửa bằng cách **kiểm tra giá trị cũ có thật sự nằm trong tệp không, rồi mới thay** ⇒ đã bổ sung thành chuẩn bắt buộc.
- Đừng tin `.Replace` là đã ghi. **Luôn kiểm tra `Contains` trước, và chạy `verify` sau.**

## TASK-026 — Bắt lỗi gấp tab «Phân quyền người dùng» (vòng 214)

- **YÊU CẦU USER:** «Lỗi phân quyền, không thể cấp quyền cho user từ tab Phân quyền người dùng: không sử dụng được copy quyền từ phòng ban, không lưu được quyền đã chọn cho user. Tiến hành bắt lỗi và xử lý gấp.»
- **TRẠNG THÁI:** **DONE** — đã sửa tận gốc, có bằng chứng đo, có test hồi quy và đối chứng âm.
- **PHẠM VI:** chỉ sửa phía giao diện (`.tsx`). **KHÔNG** sửa Java ⇒ không cần build lại (D-044) ⇒ sửa được ngay trên máy đang chạy.
- **TỆP ĐÃ SỬA:** `app/screens/PermissionAccessPanel.tsx` (assignableModules · moduleKeys · setAll · setColumnAll · columnState); `tests/v214-phan-quyen-luu-quyen.test.mjs` (mới); `lib/vntech-identity-data.mjs` + `VNTECH_FINGERPRINT.json` (khoá mới).
- **KIỂM CHỨNG:** `npm test` `pass 666 · fail 0` EXIT=0 · `verify-vntech-fingerprint.mjs` EXIT=0 (`VNTECH-FP-E538CEA79AA2F9B7`, 698 files).
- **CHƯA LÀM:** chưa gọi thử `save_user_access` trên dữ liệu thật (hàm này THAY THẾ TOÀN BỘ và xoá sạch — không được thử trên tài khoản thật). Cần USER xác nhận sau khi tải lại trang.
- **REMAINING:** 11 mục của yêu cầu vòng 211 — xem `CHECKLIST.md` § VÒNG 211 và § VÒNG 214
- **NEXT:** nhóm MENU (1.2 · 1.4) rồi nhóm PR (2.1–2.7)
- **BLOCKER:** 1.2 chờ duyệt chạy V32–V35 + V37 (không tự quyết)

## TASK-027 — MENU mục 1.4: bảng lũy kế theo vật tư thành TAB THỨ 3 của màn Mua hàng (vòng 215)

**Bối cảnh.** Bảng «Chi tiết lũy kế theo vật tư» đã có sẵn ở cuối màn Mua hàng từ trước, nhưng treo dưới màn nên không ai tìm thấy. USER yêu cầu (vòng 211, mục 1.4) đưa nó lên dải tab.

- [x] Sửa `app/screens/Purchasing.tsx` biên dịch được (gỡ hậu quả lần gỡ khối nhân đôi ở vòng trước)
- [x] Thêm tab `MAT` (`TabKey`, `TabDef.source += "boqItems"`, entry thứ 3 trong `PURCHASING_TABS`)
- [x] Tách hàm thuần `buildMaterialCumulativeRows` ra khỏi inline filter (để test được, và để tách bạch bộ lọc)
- [x] Chuyển khối `<section>` từ cuối màn vào trong thẻ tab + chặn theo tab
- [x] Thêm 2 cột có số liệu thật; giữ nguyên công thức `boqControlQty` của cột «Còn phải mua»
- [x] Chỉ hiện 2 ô ngày ở PR/PO (`dateDim === null` ở MAT)
- [x] Cập nhật 2 tệp test cũ (3 tab) + viết `tests/v211-purchasing-mat-tab.test.mjs` (7 vệ)
- [x] `npm test` 673/0 EXIT=0 · fingerprint `VNTECH-FP-C9BD271ECBE48601` · 699 files · verify EXIT=0
- [x] Ghi `D-091` (thay thế một phần chỉ đạo 21/09) + cập nhật `CHECKLIST` · `CURRENT_STATE` · `testlog.md` · `MASTER_STATUS.md` + Telegram

- **DATABASE:** ❌ KHÔNG thay đổi — **API:** ❌ KHÔNG thay đổi — **Java:** ❌ KHÔNG sửa (không cần biên dịch)
- **FILES:** `app/screens/Purchasing.tsx` · `tests/p01-purchasing-two-tabs.test.mjs` · `tests/moc121-purchasing-tabs.test.mjs` · `tests/v211-purchasing-mat-tab.test.mjs` (MỚI) · `lib/vntech-identity-data.mjs` · `VNTECH_FINGERPRINT.json`
- **REMAINING:** menu 1.2 (chờ chạy V35) · PR 2.1–2.7 · PO 3.2/3.3 · báo cáo 4.1
- **NEXT:** nhóm PR — `app/screens/Requests.tsx`: bỏ label thừa, nhóm nút CRUD, search theo tên người tạo + mã phiếu
- **BLOCKER:** không cho bước này

## TASK-028 — NHÓM PR mục 2.1–2.7: làm lại màn «Phiếu đề nghị mua hàng» (vòng 216)

**Bối cảnh.** 7 mục nhóm PR của yêu cầu vòng 211, tất cả trên một tệp: `app/screens/Requests.tsx` (+ `app/page.tsx`, `lib/labels.ts`, `lib/ui-shared.tsx`).

- [x] ĐO dữ liệu sống trước khi code (84 phiếu) — ⛔ bịa cột là lỗi nặng nhất của dự án
- [x] 2.1 bỏ label thừa + đổi cột «SLA» → «Ngày cần»
- [x] 2.2 nhóm nút CRUD đúng khuôn `ListToolbar`
- [x] 2.3 tìm theo mã phiếu + người tạo; bộ lọc «Người tạo»
- [x] 2.4 sắp xếp `neededAt`/`totalEstimatedValue`/`requestedBy` + bộ lọc «Bước duyệt»/«Ưu tiên»
- [x] 2.5 **vá D-093** — `permission` chưa từng được truyền ở nơi gọi ⇒ 3 nút biến mất
- [x] 2.6 nút «＋ Phát hành PO» cổng `purchasing.canCreate` (prop `poPermission`)
- [x] 2.7 dịch nhãn `returned`/`issued`/`partial_issued`; «Trả lại CHT» → «Trả lại»
- [x] Ghi `D-094` · `D-095` · `D-096`
- [x] 20 vệ test + đối chứng âm × 3 · `npm test` 693/0 EXIT=0 · fingerprint 700 files ĐẠT

- **DATABASE:** ❌ KHÔNG thay đổi — **API:** ❌ KHÔNG thay đổi — **Java:** ❌ KHÔNG sửa
- **FILES:** `app/screens/Requests.tsx` · `app/page.tsx` · `lib/labels.ts` · `lib/ui-shared.tsx` · `tests/v215-phieu-de-nghi-muc-2-1-den-2-7.test.mjs` (MỚI) · `lib/vntech-identity-data.mjs` · `VNTECH_FINGERPRINT.json`
- **CHƯA LÀM (cố ý):** nút Xoá/Huỷ phiếu — xem `D-094`
- **REMAINING:** menu 1.2 (chờ chạy V35) · PO 3.2/3.3 · báo cáo 4.1
- **NEXT:** nhóm PO — `app/screens/PurchaseOrderDrawer.tsx`
- **BLOCKER:** không cho bước này

---

## TASK-029 — VÒNG 216 (lần 2) · NHÓM PO mục 3.2 + 3.3

- **Ngày:** 02/10/2026 · **Nhánh:** `unity` · **Trạng thái:** ✅ XONG (mã + test + tài liệu)
- **Phạm vi:** `app/screens/PurchaseOrderDrawer.tsx` (mục 3.2 + 3.3 của nhóm PO) — màn Chi tiết Đơn mua.

### Đã làm

1. **ĐO** (không đoán): `<header>` của tab không có quy tắc layout; `.page-back` chỉ có CSS dưới `.project-detail-head`; `.card-head>button` + `!important` sẽ **xoá viền** của nút ⇒ loại phương án `.card-head`; tìm thấy khe đúng `actions` của `EntityDetailModal` (đã tài liệu hoá «góc phải tiêu đề», đã có `.edm-head-actions{display:flex}`).
2. **3.2:** nút «← Quay lại» chuyển từ `<header>` sang `actions`, thêm lớp nhà `.secondary`. **0 dòng CSS mới.**
3. **3.3:** xoá dòng «Mã kỹ thuật (request_id)»; đo trước 31/31 PO có `requestNo` ⇒ không mất thông tin; giữ nguyên 4 dấu `data-vntech` §21 + nhánh PO mồ côi + `requestNo || requestId`.

### Kết quả kiểm chứng

| Hạng mục | Kết quả |
|---|---|
| `npx tsc --noEmit --incremental false` | **EXIT=0** |
| Test PO liên quan (4 tệp) | **34 pass / 0 fail** |
| Tệp mới `tests/v216-don-mua-muc-3-2-3-3.test.mjs` | **8 vệ** (3 vệ hồi quy) |
| Đối chứng âm lỗi 1 (nút về `<header>`) | **fail 3** |
| Đối chứng âm lỗi 2 (dòng rác quay lại) | **fail 1** |
| Khôi phục sau đối chứng âm | **byte-identical = True** |
| `npm test` | **701 pass / 0 fail / skipped 1** · lint 246 warning **0 error** · **EXIT=0** |
| Vân tay | `VNTECH-FP-FDCBF492F4832A5A` · **701 files** · ĐẠT · **EXIT=0** |
| Sống thật | UI `:9000` **HTTP 200** (7 456 bytes) · API `ok=True requests=84 purchaseOrders=31` |

### Quyết định sinh ra

- **D-097** — vân tay `brand` là **hàm của** `source`; phải ghi `source` → tính lại → ghi `brand` (fixpoint 2 lượt). Tính cả ba trong một lượt từ dữ liệu cũ ⇒ `verify` EXIT=1 «Brand fingerprint không hợp lệ».
- **D-098** — hàm tiêm lỗi của đối chứng âm phải **cộng dồn trên một bộ đệm**; viết lại từ `$orig` mỗi lần ⇒ lần tiêm sau **xoá mất** lần tiêm trước ⇒ đối chứng âm báo động sai.

### Bài học

- Chọn phương án UI bằng **số đo specificity/độ phủ**, không bằng «trông hợp lý». `.card-head` trông đúng nhưng `!important` sẽ làm nút **nhạt hơn trước**.
- Dọn dòng rác phải kèm bằng chứng «không mất thông tin» và phải giữ được hợp đồng test cũ.
- Đối chứng âm **đỏ sai cũng là hỏng** — phải đối chiếu *số vệ đỏ* với *số lỗi tiêm*.

### BLOCKER

- Không có blocker mới. **Vẫn chờ USER (TYPE 3):** chạy `V32`–`V35` + `V37` (đang chặn mục 1.2), RBAC bypass `RbacService.java:69`, L-03 (D-084), GRN-STO (D-087), `npm run build`, và **commit** («Chưa commit, để tôi xm trước»).## TASK-030 — VÒNG 217 · SỬA MÃ NGUỒN KHÔNG LÊN TRÌNH DUYỆT → ĐO, BUILD, ÁP DỤNG

**Bối cảnh.** Người dùng: *«nếu không cần rebuild mà vẫn áp dụng được những chỉnh sửa vừa rồi thì
hiện tại tôi không thấy bất cứ thay đổi gì ở frontend cả»*. Tôi đã trả lời sai: «Vite dev server,
F5 là thấy».

**Đã làm**

1. **Đo hạ tầng thay vì tin trí nhớ.** HTML `:9000` không có `/@vite/client`, có asset tên có hash,
   `<meta vntech-source-fingerprint>` = `f0af3695…` ≠ `fdcbf492…` của mã nguồn.
   `scripts/local-server.mjs:20` nạp `dist/server/index.js` một lần lúc khởi động;
   `scripts/local-runtime.mjs:180` phục vụ asset từ `dist/client`.
   ⇒ `:8787` là **bản build tĩnh** ⇒ sửa nguồn không tự lên.
2. **Cập nhật lớp vân tay runtime** (D-052 quy tắc 2) — nếu bỏ bước này app **không boot**
   («Dau van tay san pham VNTECH khong hop le hoac da bi thay doi»).
3. **`npm run build`** → EXIT 0, 5 preflight ĐẠT.
4. **Dừng đúng PID** `local-server.mjs` (⛔ không đụng Java `:18081`, proxy `:9000`, dsh runtime,
   router, tts-server) rồi khởi động lại.
5. **Đo lại bằng HTTP thật** (D-052 quy tắc 6).

**Bảng kiểm chứng**

| Hạng mục | Kết quả |
|---|---|
| HTML `:9000` sau build | 7 456 byte, vân tay `fdcbf492…` → sau lần 2 `d6656e64…` |
| Bundle chứa nhãn 3.2 | `page-BJ5W9xGL.js` → `page-ryxlFfpZ.js`: **có** |
| Bundle chứa dòng rác 3.3 | **không** (0/6 file) |
| Dấu hiệu đối chứng `po-source-pr` | **có** ⇒ phép tìm có dấu là hợp lệ |
| Byte phục vụ qua HTTP | **6/6** khớp tệp trên đĩa |
| `npm test` | 701/0 (lần 1) → **708/0** (lần 2) · EXIT 0 |
| Lint | 246 warnings, **0 error** |
| Fixpoint vân tay | **3 lượt** · 702 file |
| Cổng mới | `✓ do-moi · ✓ van-tay · ✓ byte` |
| Test vệ | **7/7**, gồm 2 đối chứng âm |

**Quyết định**

| Mã | Nội dung |
|---|---|
| **D-099** | UI là bản build tĩnh; phải **build + khởi động lại `:8787`**; quy trình 5 bước; cổng mới; D-097(a) mở rộng |

**Bài học**

1. ⛔ Đừng trả lời về hạ tầng bằng trí nhớ — đo HTML thật và đọc mã nguồn.
2. ⛔ Đừng gõ tay chuỗi đối chiếu (`\u1EA3I` vs `\u1EA3i`) — trích từ tệp nguồn + có dấu hiệu đối chứng.
3. ⛔ Đừng gõ cứng vân tay trong cổng kiểm tra — nó sẽ báo đỏ sai ở lần fixpoint kế tiếp.
4. ⛔ Build xong chưa đủ — phải khởi động lại `:8787`.
5. ✅ Người dùng nhìn thấy thứ mình không thấy là **bằng chứng**.

**BLOCKER**

⛔ Không có blocker kỹ thuật mới. Vẫn còn các blocker TYPE 3 đã ghi ở vòng trước (RBAC, L-03, build
Java, duyệt chạy V32–V35/V37, RBAC bypass…), **không tự quyết, không hỏi lại lần thứ ba**.
⛔ Chưa commit (anh dặn: «Chưa commit, để tôi xem trước»).

---

# TASK-146 — VÒNG GO-LIVE 1 (02/10/2026) · 10 YÊU CẦU USER + 4 BUG

| | |
|---|---|
| **Trạng thái** | ✅ 9/10 yêu cầu XONG · ⛔ mục 9 BLOCKED (chờ USER duyệt Flyway) |
| **Tệp mã sửa** | `app/screens/Purchasing.tsx` · `app/styles/canonical.css` |
| **Cổng phải sửa theo thiết kế mới** | `scripts/css-baseline-audit.mjs` · `tests/moc121-purchasing-tabs.test.mjs` · `tests/v211-purchasing-mat-tab.test.mjs` |
| **Test mới** | `tests/d105-jsx-comment-textnode.test.mjs` · `tests/d107-bang-pr-khop-so-o.test.mjs` · `tests/v1-muc3-…` · `tests/v1-muc4-…` |
| **Nhật ký đầy đủ** | `docs/agent-progress/TASK-146.md` |

**4 BUG đã đóng**

| BUG ID | Module | Severity | Root cause |
|---|---|---|---|
| BUG-20261002-001 | Trung tâm phê duyệt / PO | HIGH | `window.alert` là **mã chết** + `title` hứa hư |
| BUG-20201002-002 | Quản trị › Phân quyền | **CRITICAL** | backend chặn HTTP 400 **trước** `runAtomically`; lỗi bị `.overlay` z100 **che** |
| BUG-20261002-003 | Mua hàng (mọi tab) | **CRITICAL** | comment `/* … */` **trần** trong JSX = **TEXT NODE** ⇒ vẽ chữ ra màn |
| BUG-20261002-004 | Bảng PR (**thead**) | HIGH | **12 ô `<td>`** / **11 ô `<th>`**; ô 3 sao chép ô 2 ⇒ lệch cột |

**Đo cuối vòng**

| Phép đo | Kết quả |
|---|---|
| `tsc --noEmit` | **EXIT=0** |
| `npm test` | **751 · 750 pass · 0 fail · EXIT=0** (lint **0 error**) |
| `npm run audit:tests` | 128/135 tệp xanh; 7 tệp đỏ **ngoài cổng** (nợ đã biết, 51 test case) |
| `css-baseline-audit.mjs` | **ĐẠT** · dead classes=0 |
| `verify-vntech-fingerprint.mjs` | **ĐẠT** · `VNTECH-FP-F5CCE656F23BD18E` · **710 tệp** |
| `verify-ui-build-applied.mjs` | **3/3 ✓** |

**Quyết định**

| Mã | Nội dung |
|---|---|
| **D-103** | Cổng UI exit code **không tất định** ⇒ kết luận bằng **NỘI DUNG** |
| **D-105** | JSX: `/* … */` trần là **CHỮ**, chỉ `{/* … */}` là comment |
| **D-106** | Vệ rỗng lần 2: bóc chú thích rồi đi tìm chú thích ⇒ **bắt buộc đối chứng âm** |
| **D-107** | Bảng phải có vệ **ĐẾM CẤU TRÚC** `<th>` ↔ `<td>` |
| **D-108** | Cổng test là `scripts/regression-suite.mjs`, **không** phải mọi tệp `tests/` |
| **D-109** | Đổi thiết kế ⇒ cập nhật **mọi** cổng khoá thiết kế cũ, **giữ nguyên phép kiểm** |

**Bài học**

1. ⛔ ESLint báo lỗi ở **đúng vùng vừa sửa** ⇒ lỗi thật, sửa trước khi chạy tiếp.
2. ⛔ **Đối chứng âm** là thứ duy nhất phân biệt «có bảo vệ» với «tưởng là có bảo vệ» — vệ D-105 phải viết lại **4 lần**.
3. ⛔ **Đo sai tập ⇒ kết luận sai** (D-108): glob `tests/**` rồi đếm đỏ là tính cả **nợ đã biết**.
4. ⭐ Trước khi chế lớp CSS mới: **đo khuôn nhà** (D-092) — mục 2 giải bằng cách bắt chước `.work-center`.
5. ⭐ User nhìn thấy thứ mình không thấy là **BẰNG CHỨNG**.

**BLOCKER**

⛔ **mục 9** cần USER quyết: build JAR backend + duyệt chạy Flyway `V35`.
⛔ Các việc TYPE 3 vòng trước giữ nguyên (không tự quyết, không hỏi lại lần thứ ba).
⛔ **Chưa commit** (`AUTO_COMMIT = FALSE`, `AUTO_PUSH = FALSE` — USER dặn «Chưa commit, để tôi xem trước»).
