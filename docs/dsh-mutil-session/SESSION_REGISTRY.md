# SESSION_REGISTRY — SHARED
> File SHARED — sua theo: READ -> MODIFY CAREFULLY -> PRESERVE OTHER SESSION DATA -> WRITE -> VERIFY.

| Session | Status | Task | Scope | Files | Started | Last Heartbeat |
|---|---|---|---|---|---|---|
| ERP-SESSION-02 | DONE (ma) | TASK-226 — HUB «Kho vat tu» 3 tab + man chi tiet kho 5 tab + gom menu 7->1 | Warehouse / Menu | lib/warehouse-hub.ts (MOI) · app/screens/Inventory.tsx · lib/menu-helpers.ts · tests/warehouse-hub.test.mjs (MOI) · tests/w04-inventory-dashboard.test.mjs · tests/w01-warehouse-menu.test.mjs · tests/mt3-ui-29-view-collision-diagnostic.test.mjs | 2026-10-06 09:00:00 | 2026-10-06 14:00:00 |
| ERP-SESSION-01 | 🟢 **WORKING** | ⭐ **NHOM «PHAN QUYEN + BAO LOI + MUA HANG/GIAO NHAN»** — 12 task: 4 VERIFIED · 4 DONE · 3 FIXED · ⚠️ 1 OPEN | `app/page.tsx` · `java-backend/**` (phan quyen + mua hang) · `java-backend/web/src/test/**` · `docs/dsh-state/**` · `docs/dsh-mutil-session/SESSION_A/**` | app/page.tsx · 6 tep `java-backend/**` · `docs/dsh-state/{CHECKLIST,CURRENT_STATE,SESSION_REGISTRY}.md` · `lib/vntech-identity-data.mjs` · `VNTECH_FINGERPRINT.json` | 2026-10-06 (dau phien) | 2026-10-06 14:1x |
| **ERP-SESSION-03** | 🟢 **WORKING** | `C01` (**CCCD**) · `C02` (**Tổ đội** + dọn rác) · `C03` (**UTF-8 Excel/CSV**) · `C04` (**trạng thái tiếng Việt**) · `C05` (**Ưu tiên + Loại con dấu**) · `C06` (**Ưu tiên ở ĐƯỜNG XUẤT TỆP** + mở rộng cổng sang `lib/**`) | **Frontend hotfix GO-LIVE (user: FE → BE → DB)** | `app/screens/{HrProfileEditModal,TeamDirectory,Delivered,Purchasing,ProjectDetailTabs,SealScreen,Requests,WorkCenter,RequestDrawer}.tsx` · `app/components/ui/StatusBadge.tsx` · `lib/{status-labels,labels,report-catalog,request-export}.ts` · `public/templates/*.csv` (2 tệp) · `tests/mt3-c03-*.test.mjs` + `tests/mt3-c04-status-vi.test.mjs` (**3 MỚI**) · `tests/{tm01-team-list,tm05-team-allocations,moc-96-105-no-regression,v215-phieu-de-nghi-muc-2-1-den-2-7}.test.mjs` · `docs/dsh-mutil-session/SESSION_C/**` | 2026-10-07 16:54:34 | ⭐ **2026-10-07 21:1x** |

> ERP-SESSION-01: phien 02 KHONG tu nhan xet thay — trang thai that DO CHINH PHIEN 01 CAP NHAT.
> Ghi nhan khach quan (do duoc): app/page.tsx moc 2026-10-06 13:41:34, git diff 117 them / 9 xoa; co 1 lan build them ~13:42.
> LUU Y CHO PHIEN 01: lib/menu-helpers.ts DA DUOC ERP-SESSION-02 GOM MENU (5 muc -> 1 muc) => DOC TRUOC KHI SUA de khong ghi de.

### ⭐ ERP-SESSION-01 TU CAP NHAT (2026-10-06 14:1x) — ⭐ thay cho dong «CHUA XAC MINH · (khong ro)»

**CURRENT ACTIVITY (§11)**
```text
SESSION_ID     : ERP-SESSION-01
CURRENT TASK   : Ghi log chuan hoa SESSION_A + BUG-20261007-001
CURRENT STEP   : Ghi 9 loai log (3/9 xong: TASK_LOG · BUG_HOTFIX_LOG · WEEKLY_REPORT_DATA)
STATUS         : WORKING
BLOCKER        : ⚠️ Luat ESLint (React Compiler) — DA TIM RA nguyen nhan that ⇒ nay sua duoc
LOCK           : app/page.tsx · java-backend/** · docs/dsh-state/** · docs/dsh-mutil-session/SESSION_A/**
```

**Trang thai THAT (⭐ do chinh phien 01 cap nhat — §44 «SESSION INDEPENDENCE»)**
| Muc | Gia tri |
|---|---|
| **Task** | ⭐ **12** — 4 `VERIFIED` · 4 `DONE` · 3 `FIXED` (cho user nghiem thu) · ⚠️ 1 `OPEN` |
| **Bug** | ⭐ **9** — 4 `VERIFIED` · 3 `FIXED` · 1 `OPEN` · 1 `DONE` |
| **Test** | ⭐ `mvn -o test` **156/156** · `npm test` **EXIT=0 · pass 802 · fail 0** · cong UI **3/3** |
| **E2E** | ⭐ **7/8 DAT** · ⛔ **0 regression** tu 7 ban va |
| **Pham vi da chung minh** | ⭐ `FILES A ∩ FILES B = ∅` — ⭐ **13 tep cua toi + 8 tep cua phien 02** |
| **Log** | ⭐ `SESSION_A/TASK_LOG.md` · `BUG_HOTFIX_LOG.md` · `WEEKLY_REPORT_DATA.md` **DA GHI** · ⚠️ 6 tep con lai dang ghi |

**⚠️ 2 bug do CHINH PHIEN 01 gay ra (⭐ da tu sua + ghi ro, ⛔ khong che giau)**
1. ⭐ `BUG-20261006-006` — ban va «BUG-B» khoa nut buoc 14 bang `hasAdminTab` (ham **chi doc `allModulePermissions`**) ⇒ nhung tai khoan `admin` co **0 dong quyen** ⇒ **KHOA OAN** ⇒ da sua thanh `isAdminUser(...) || hasAdminTab(...)` · ⭐ **VERIFIED** (user xac nhan)
2. ⭐ **Loi ESLint** khi sua `BUG-20261007-001` — ⭐ **xoa mat dong khai bao `let ok = 0, that = 0, loiDau = "";` cua `deleteSelected()`** ⇒ no gan vao bien cua `save()` ⇒ ESLint bao DUNG «Cannot reassign variables declared outside of the component/hook» ⇒ **da them lai ⇒ XANH**

**⭐ BAI HOC CHIA SE CHO PHIEN 02 — 2 LUAT**
1. ⭐ **`hasAdminTab` ⛔ KHONG thay the duoc `isAdminUser`** — ⭐ tai khoan `admin` co **0 dong `user_module_permissions`** va **`RbacService` LOAI TRU vai tro `admin`** ⇒ ⭐ **kiem quyen module PHAI LUON tinh ca vai tro `admin`** ✓
2. ⚠️ ⭐ **Khi `edit` thay mot KHOI DAI ⇒ PHAI giu lai MOI dong khai bao** — ⭐ toi mat **4 vong** vi ⛔ khong kiem dong khai bao con hay mat ✓

**⚠️ CANH BAO NGUOC CHO PHIEN 01 (⭐ ghi nhan tu phien 02)**: ⭐ `lib/menu-helpers.ts` DA bi phien 02 gom menu (7 muc → 1 muc) ⇒ ⭐ **toi ⛔ KHONG dung toi** ✓

**⭐ PHUONG PHAP KIEM BUNDLE DUNG (⭐ toi da sai 6 lan truoc khi tim ra)** — ⭐ chia se de phien 02 ⛔ khong lap lai
```powershell
# ① lay danh sach bundle — ⭐ dung href, ⛔ KHONG chi src
$fs = [regex]::Matches($html,'(?:href|src)="(/assets/[^"]+\.js)"') | % { $_.Groups[1].Value }
# ② TAI VE DIA roi doc (⛔ dung doc Content truc tiep)
Invoke-WebRequest -Uri $u -OutFile $tmp -UseBasicParsing; $js = [System.IO.File]::ReadAllText($tmp)
# ③ tim chuoi tieng Viet **RAW** — ⭐ bundle luu RAW, ⛔ KHONG escape
$js.Contains('chuoi tieng Viet')
# ⛔ DUNG tim TEN BIEN NOI BO (minify doi ten) — ⭐ chi tim CHUOI VAN BAN / KHOA DOI TUONG
```

## Trang thai dich vu (do 2026-10-06 14:00:00)
| Dich vu | Cong | HTTP |
|---|---|---|
| Java API | 18081 | 200 |
| Node UI | 8787 | 200 |
| Cutover proxy | 9000 | 200 |

---

## ⭐ ERP-SESSION-03 (phiên 03) — TỰ KHAI BÁO + BẰNG CHỨNG (2026-10-07)

**Phạm vi (do chính phiên 03 khai)** — 2 việc, đúng luật user «hotfix GO-LIVE: FE → BE → DB»:
1. `BUG-20261007-C01` / `TASK-20261007-C01` — modal «Sửa hồ sơ» tab «Thông tin cá nhân» sửa **CCCD**
   báo lỗi «Mã nhân viên, họ tên, tên đăng nhập và phòng/bộ phận là bắt buộc».
2. `TASK-20261007-C02` — audit màn **Tổ đội**, lược bỏ thông tin **thừa/rác** (tên bảng/cột CSDL…).

**TỆP PHIÊN 03 GIỮ (LOCK)** — ⛔ các phiên khác không sửa:
`app/screens/HrProfileEditModal.tsx` · `app/screens/TeamDirectory.tsx` ·
`tests/mt3-c03-hotfix-ui.test.mjs` (**mới**) · `tests/tm01-team-list.test.mjs` ·
`tests/tm05-team-allocations.test.mjs` · `tests/moc-96-105-no-regression.test.mjs` ·
`docs/dsh-mutil-session/SESSION_C/**`

**KIỂM CHỨNG GIAO = ∅**: đối chiếu mục «Đang giữ» của S01/S02 ⇒ ⛔ **không trùng tệp nào**.
⛔ Phiên 03 **KHÔNG** đụng `app/page.tsx`, `java-backend/**`, `lib/menu-helpers.ts`,
`lib/warehouse-hub.ts`, `app/screens/Inventory.tsx`.

**Trạng thái THẬT (đo bằng lệnh, ⛔ không suy đoán):**
| Mục | Giá trị |
|---|---|
| `tsc` | **0 lỗi** (exit 0) |
| `eslint` 2 tệp sửa | **0 lỗi** (exit 0) |
| 8 tệp test hợp đồng | **55 test · 55 pass · 0 fail** |
| `npm run test:regression` | **811 test · 810 pass · 0 fail · 1 skip** (exit 0) |
| Build `gd-cycle` | PREFLIGHT · FINGERPRINT · ARTIFACT **ĐẠT** (exit 0) |
| Vân tay MỚI sau build | **`VNTECH-FP-846B70AAA8D06A12`** · source **720 files** · migration `drizzle/0330_phase_gd_session_03_hotfix_cccd_don_rac_to_doi_identity.sql` |
| LIVE `:8787` · `:9000` | **200** · **200** (đã khởi động lại sau build) |
| Bundle đang phục vụ | ✅ CÓ «Hồ sơ nhân sự ĐÃ lưu» · ✅ CÓ «Phiếu cấp phát & hoàn trả của tổ đội» · ⛔ KHÔNG còn «Nguồn dữ liệu của 6 tab» / «TÁI DÙNG logic cấp phát kho» / «mang team_id của tổ đội này» |

> ⚠️ **LƯU Ý CHO 2 PHIÊN CÒN LẠI (quan trọng)**: phiên 03 **đã chạy `gd-cycle`** — chạy được vì lúc đó
> **cây làm việc SẠCH** (chỉ có 4 tệp thay đổi của phiên 03; ⛔ không có tệp dở dang của S01/S02).
> ⇒ Vân tay nguồn mới `VNTECH-FP-846B70AAA8D06A12` là **đúng** cho HEAD `8bfde0d` + bản vá phiên 03.
> ⇒ Nếu S01/S02 **còn tệp sửa dở**, vân tay sẽ **lệch lại** khi họ sửa tiếp — hãy chạy lại `gd-cycle`
> khi **tất cả** đã dừng, đúng cảnh báo cũ của S01.
> ⇒ Dịch vụ đã được **khởi động lại bằng PID riêng** (`local-server.mjs` cho `:8787`,
> `cutover-proxy.mjs` cho `:9000`); Java `:18081` ⛔ **không bị dừng**.

---

## ⭐⭐ ERP-SESSION-04 (`SESSION_D`) — ĐĂNG KÝ PHIÊN MỚI [2026-10-08] (APPEND — ⛔ không sửa khối phiên khác)

| Session | Status | Task | Scope | Files | Started | Last Heartbeat |
|---|---|---|---|---|---|---|
| **ERP-SESSION-04** | 🟢 **WORKING** | `TASK-20261008-D01` báo cáo go-live lõi (`docs/37`) · `TASK-20261008-D02` **audit JOBS & PROJECT** (`docs/38`) | **TÀI LIỆU/AUDIT (read-only)** | `docs/37_*.md` (MỚI) · `docs/38_*.md` (MỚI) · `docs/dsh-mutil-session/SESSION_D/**` (MỚI, đủ 9 log + README) | 2026-10-08 | 2026-10-08 |

### ⛔ PHIÊN 04 KHÔNG GIỮ TỆP SẢN PHẨM NÀO
⛔ Không claim `app/**` · `lib/**` · `java-backend/**` · `tools/**` · `tests/**` ⇒ **FILES(S04) ∩ FILES(S01,S02,S03) = ∅**.
Việc cần sửa ở 3 phiên kia đã ghi **`HANDOFF-20261008-D01`** trong `SESSION_D/HANDOFF_LOG.md`.

### 🔴 GỬI S01 — 2 bug RBAC dự án (bằng chứng **đọc mã**, ⛔ chưa có phép thử runtime)
| ID | Nội dung | Bằng chứng |
|---|---|---|
| `BUG-20261008-D01` (**HIGH**) | `create_project` · `update_project` · `delete_project` · `bulk_import_projects` khai module **rỗng** ⇒ **403** với mọi tài khoản không phải `admin`/`director`/`accountant` ⇒ **nghẽn tạo/sửa dự án** | `ActionRbacRegistry.java:75,89,135,302` + `RbacService.java:64-83` (nhánh `required.isEmpty()` ⇒ throw 403) |
| `BUG-20261008-D02` (**MED–HIGH**) | `set_project_status` khai module **`admin`** ⇒ nhánh ưu tiên lãnh đạo bị loại (danh sách chứa `"admin"`) ⇒ **Giám đốc/Kế toán trưởng không đóng/mở dự án** | `ActionRbacRegistry.java:282,526` + `RbacService.java:69` |

> ⚠️ **Cả 2 KHÔNG phải phát hiện mới** — thuộc **«18 action mồ côi quyền»** đã ghi ở `docs/dsh-state/CHECKLIST.md` §「MỐC 110 §8」, **trạng thái 403 hiện tại là fail-closed (an toàn)** nhưng **thông báo lỗi gây hiểu nhầm** và **nghẽn nghiệp vụ**. Đề xuất của CHÍNH dự án đã có sẵn (gợi ý module) — ⛔ chưa áp dụng, chờ user quyết.

### ⚠️ BLOCKER HẠ TẦNG (ảnh hưởng MỌI phiên)
Shell harness hỏng: `ERR_MODULE_NOT_FOUND: Cannot find package '@deepseek-ai/dsh-scope'`
(từ `C:\Users\PC\.dsh\profiles\web\node_modules\@deepseek-ai\dsh-skill\lib\index.js`) ⇒ ⛔ **không chạy được** `node`/`npm`/`git`/gate/UI.
⇒ Phiên 04 **⛔ chưa chạy lại cổng nào**; mọi số liệu cổng trong `docs/37`/`docs/38` là **số của phiên khác, có ngày**.
⇒ ⚠️ **CẢNH BÁO CHO S01/S02/S03**: khi shell chưa hồi phục thì ⛔ đừng báo «đã chạy lại cổng» — và ⛔ đừng `gd-cycle` (không chạy được).

