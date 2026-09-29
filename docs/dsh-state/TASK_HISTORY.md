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

## TASK-038 — PHAN QUYEN TUNG TAB MAN QUAN TRI HE THONG (28/09/2026)

**TASK:** MOC 28 → 37 · phân quyền từng TAB cho màn Quản trị hệ thống
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

## TASK-039 — TACH MODAL SUA TAI KHOAN / PHAAN QUYEN (29/09/2026)

**STATUS:** PARTIALLY COMPLETED (1/2 xong, 3 việc 3-5 con)

| TASK | MOC | NOI DUNG | STATUS |
|---|---|---|---|
| TASK-039-1 | 39a | Boc section quyen trong modal Sua tai khoan theo `canManageUserPermissions` | DONE |
| TASK-039-2 | 39b | Nut «Sua» tab 6 → `open("access", u)` «Sua quyen» | DONE |
| TASK-039-3 | 40 | Tab 8 bo nut sua danh sach Pham vi du an & kho | PENDING |
| TASK-039-4 | 41 | Tab 13 Thong bao nang cao | PENDING |
| TASK-039-5 | 42 | Tab 14 Bao loi day du | PENDING |

**FILES CHANGED:** `app/page.tsx` (L1716 · L1956 · L3067 · L3068)
**DATABASE:** khong doi
**API:** khong doi
**TEST:** build `VNTECH-FP-702F7531E63FB174` · tsc EXIT=0 · 8 FAIL thuoc man Quan ly Du An (khong phai MOC 39)
**COMMIT:** 0

**BAI HOC (D-021 → D-023):** KHONG xoa ca dong JSX. L3068 chua ca `<details>` lan `</details>`
⇒ chi boc trong `{cond && …}` tren cung dong ⇒ khong mat the ⇒ tsc sach ngay.

---

# NHAT KY TASK — PHIEN 29/09/2026 (MOC 39 → 58)

| Moc | Task | Status | Files changed | DB | API | Test |
|---|---|---|---|---|---|---|
| 39 | Modal sua tai khoan tach khoi phan quyen | DONE | app/page.tsx | — | `update_user` | tsc 0 |
| 40 | Nut sua + nut phan quyen dung chung 1 modal | DONE | app/page.tsx | — | — | tsc 0 |
| 41 | Chuong gop 3 nguon thong bao | DONE | app/page.tsx | — | — | tsc 0 |
| 42 | **Tab 14 «Bao loi»** (bang + 3 action + 2 modal) | DONE | drizzle/0277 · ErrorReport* · BootstrapDataAdapter · ApplicationBeansConfig | bang `error_reports` | 3 action moi | **API that 5/5 HTTP 200** |
| 43 | Ke hoach giao hang: tim kiem + sap xep 5 tieu chi | DONE | app/screens/Receiving.tsx | — | — | tsc 0 |
| 44 | Bo chieu loc «Phong ban» o man Du an | DONE | app/page.tsx | — | — | pr02 xanh |
| 45 | Sua loi modal bi cat (do that 2884 vs 737) | DONE | app/globals.css | — | — | do bang GOM |
| 45b | Chan hoi quy 28 modal `<form>` sau khi doi `.modal` | DONE | app/globals.css | — | — | 28/28 OK |
| 46 | (ghi nhom vao 44) | DONE | — | — | — | — |
| 47 | Chung minh phan quyen bang USER THAT (khong phai admin) | DONE | — | xoa quyen tam | — | 3 phep thu that |
| 48 | Phat hien nut «Sua tai khoan» 403 vs `admin_tab_01` | DIAGNOSED | — | — | `UserManagementUseCase:104` | 3 phep thu that |
| 49 | Ho so nhan su: dai o inline -> modal «Lap ho so» | DONE | app/screens/HrScreen.tsx | — | — | tsc 0 |
| 50 | Sua email dispatcher (khuoi email ket) | DONE | scripts/email-dispatcher.mjs | — | — | doc code |
| 51 | **Khoi phuc** nut «Sua tai khoan» (da bi ghi de) | DONE | app/page.tsx | — | — | grep bundle = 1 |
| 52 | Modal «Sua ho so» thay nut «Sua tai khoan» | DONE | app/screens/HrProfileEditModal.tsx · app/page.tsx | — | `save_hr_record` | tsc 0 |
| 53 | Bo nut «Sua quyen» + them 14 `admin_tab_NN` vao ma tran | DONE | app/page.tsx | — | — | do API that |
| 54 | Hop sua tai khoan tach 2 the, khoa theo `admin_tab_01`/`06` | DONE | app/screens/AdminUserModalTabs.tsx | — | — | tsc 0 |
| 55 | Hop dong lao dong: modal + **tai anh** + modal chi tiet | DONE | app/screens/LaborScreen.tsx · HrStore/Adapter · HrManagementUseCase · BootstrapDataAdapter | cot `labor_contracts.image_url` | `save_labor_contract` | **API that 200 / 400** |
| 56 | Sua ho so chi can quyen SUA · mo khoa ma NV + ten DN | DONE | app/screens/HrProfileEditModal.tsx | — | them `update_user` | tsc 0 |
| 56-5 | Bao hiem & che do: modal Them + modal chi tiet | DONE | app/screens/BenefitsScreen.tsx | — | `save_benefit_record` | **API that 200 / 400** |
| 57 | Hop sua tai khoan tach 2 the (matrix + pham vi du an) | DONE | app/page.tsx | — | `save_user_access` | tsc 0 |
| 58 | (1) sua tat ca thong tin · (2) ho so 3→5 the · (4) sua bao hiem | DONE | HrProfileEditModal · app/page.tsx · BenefitsScreen · globals.css | — | — | tsc 0 · css DAT |
| 58-3 | Hop dong: nut Sua + **luu gio thay anh** | DONE | HrStore/Adapter · HrManagementUseCase · BootstrapDataAdapter · LaborScreen | cot `image_updated_at` | `save_labor_contract` | **API that 2/2 (doi anh + giu anh)** |
| 58-5 | **Tach `PermissionMatrix.tsx` dung chung** (goal §11) | DONE | app/screens/PermissionMatrix.tsx | — | — | tsc 0 · xoa 1.191 ky tu JSX roi |

## ⏳ CHUA LAM / CHO USER QUYET
| # | Task | Ly do |
|---|---|---|
| 1 | MOC 48 — sua lech UI/backend `admin_tab_01` | QUYET DINH nghiep vu (3 phuong an) |
| 2 | Tab «Tong quan» o Chi tiet Du an | pr01 va pr03 **cau truc ngau** — phai chon uu tien test hay UI |
| 3 | bypass `isCompanyLeadership` (D-022) | QUYET DINH nghiep vu · de do: chi `hrm` (ma chuc danh **NHAN SU**) mat bypass neu bo ve `"director".equals(base)` |
| 4 | Bat email | THIEU thong tin SMTP + `notification_config_targets`=0 + `approval_email_recipients`=0 |

---

# NHAT KY BO SUNG — MOC 96 → 99 (29/09/2026)
| Moc | Task | Status | Files | DB | API | Test |
|---|---|---|---|---|---|---|
| 96 | ⛔ Sua loi mat du lieu: o Email trong modal «Sua ho so» | DONE | app/screens/HrProfileEditModal.tsx | — | `save_hr_record` / `update_user` | tsc 0 · css DAT · 5 phep thu API 200 |
| 97 | Quet D-030 vong 2: `save_user_access` | VERIFIED | — | doc | doc L206-215 | khop 100% |
| 98 | Quet D-030 vong 3: `update_user` vs `users` | VERIFIED | — | doc | doc | 5/5 khop |
| 99 | Quet D-030 vong 4: `HrScreen` | VERIFIED | — | doc | doc | 13/13 khop |
| BUG-01 | Bao cao loi S1 + anh huong 5 mat | DA SUA | docs/dsh-state/CHECKLIST.md | — | — | kiem chung hoi quy 6/6 |

**BUILD VNTECH-FP-B3ABCB674A9A0C05** · ❌ 2/5 CONG DO · 0 commit · CSDL sach

---

# NHAT KY BO SUNG LAN CUOI — MOC 101 (29/09/2026)
| Moc | Task | Status | Files | DB | API | Test |
|---|---|---|---|---|---|---|
| 101 | 🐛 BUG-02 (S1): khoa 4 truong tai khoan theo hop dong backend | DONE | app/screens/HrProfileEditModal.tsx | — | `update_user` | tsc 0 · css DAT · 4/4 chuoi trong bundle · 5 CONG 4+3 KHONG TANG |

**BUILD VNTECH-FP-B01C5D788932F083** · ⛔ 0 commit · CSDL sach · 3 cong dich + login OK
⇒ HET phan viec doc lap trong phien 29/09. Con 5 muc cho USER QUYET (xem CURRENT_STATE.md).
