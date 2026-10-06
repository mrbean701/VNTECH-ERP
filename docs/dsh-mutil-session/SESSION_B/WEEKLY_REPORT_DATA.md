# WEEKLY_REPORT_DATA — SESSION_B (ERP-SESSION-02)
> Du lieu phai tong hop TU LOG, KHONG suy doan.

# WEEK 2026-W41

## Session
ERP-SESSION-02

## Period
2026-10-05 -> 2026-10-11

## Completed Tasks
- TASK-20261006-226 — HUB «KHO VAT TU» (3 tab) + man chi tiet kho (5 tab) + GOM MENU 7->1 -> DONE (da build + dang phuc vu).

## In Progress
- Cho user nghiem thu tren :9000 => neu dat thi TASK-226 chuyen VERIFIED.

## UI/UX
- Tabbar 3 tab: KHO · XUAT & NHAP · CAP PHAT & HOAN TRA; tab mac dinh = KHO.
- Tab KHO: dashboard ton kho + cards kho (Ten · Ma · Du an · Ton hien tai) + toolbar tim/sap xep/xuat Excel.
- Tab XUAT&NHAP + CAP PHAT&HOAN TRA: subtabbar theo quyen + 2 danh sach + nut Tao · Tim · Sap xep · Loc.
- MAN CHI TIET KHO (thay modal): nut «Quay lai man KHO» + 5 tab (Dashboard kho · Ton kho · Xuat-Nhap · Cap phat-Hoan tra · Nhan su).
- Menu nhom KHO: 7 muc -> 1 muc «Kho vat tu».
- 10/10 khoi noi dung thuoc DUNG 1 tab (truoc day hien o MOI tab).

## Frontend
- lib/warehouse-hub.ts (MOI · khoi THUAN) · app/screens/Inventory.tsx (254 -> ~500 dong) · lib/menu-helpers.ts (gom menu).
- npx tsc --noEmit EXIT=0.

## Backend/API
- Khong thay doi backend · khong API moi (dung GET /api/system san co).

## Database
- Khong doi schema nghiep vu. Chi sinh migration identity drizzle/0329_phase_gd_task_226_hub_kho_vat_tu_3_tab_gom_menu_7_identity.sql (do gd-cycle).

## RBAC/Workflow
- Ngoai le: director (Ban Lanh dao) + admin (+ IT = admin) => XEM TAT CA kho; thao tac van theo quyen module (DEC-001).
- Kho DU AN chi hien voi thanh vien du an (theo userScopes[]).
- Subtab mac dinh cua tab XUAT&NHAP / CAP PHAT&HOAN TRA chon theo quyen user.

## Bugs
- 4 LOI CO SAN da phat hien & sua: BUG-001 (card hien UUID do doc 3 truong KHONG ton tai) · BUG-002 (tim/sap xep kho KHONG chay + Excel rong) · BUG-003 (nhan loai kho luon sai) · BUG-004 («So phieu xuat» luon = 0 do loc warehouseId KHONG co trong issues[]).
- 1 bug MOI dang MO: BUG-005 — cong anh KHONG DAT 68/68 do anh chuan CU 5 NGAY (KHONG phai loi giao dien) => Status: OPEN, cho user quyet.
- 2 loi logic CUA CHINH PHIEN NAY da tu phat hien & sua: showDashboard sai tab · khoi cap phat tab===3 KHONG bao gio hien.

## Hotfixes
- Sua 4 bug co san + 2 loi logic noi bo => DONE/FIXED, da kiem hoi quy (0 fail).

## Testing
- tests/warehouse-hub.test.mjs — 22/22 PASS.
- npm run test:regression — 803 test · 802 pass · 0 fail · 1 skip (EXIT=0).
- npx tsc --noEmit — EXIT=0.
- BUILD node tools/gd-cycle.mjs — GD_EXIT=0 · PREFLIGHT DAT · FINGERPRINT DAT (VNTECH-FP-121300BEED7174E4 · 716 file) · ARTIFACT DAT.
- Cong anh — KHONG DAT 68/68 (BUG-005, do anh chuan cu 5 ngay).
- 3 dich vu sau build: Java :18081 · UI :8787 · proxy :9000 — deu 200; asset DOI HASH /assets/index-BjTKD8Zf.css.

## Important Changes
- CHG-001 (menu 7->1) · CHG-002 (HUB 3 tab) · CHG-003 (MAN chi tiet kho) · CHG-004 (bugfix 4 loi co san) · CHG-005 (migration identity).
- Tranh xung dot da phien: KHONG sua app/page.tsx (phien khac giu) — menu van gom duoc nho sua lib/menu-helpers.ts.
- Bang chung deploy: bundle dist/server/ssr/assets/page-boWaSNuv.js chua warehouse_hub 3 lan (SSR KHONG minify).

## Decisions
- DEC-001 ngoai le xem tat ca kho · DEC-002 gom 7 muc menu -> 1 · DEC-003 KHONG sua app/page.tsx · DEC-004 tach khoi thuan · DEC-005 KHONG API moi / KHONG migration.

## Blockers/Risks
- RUI RO CAO: cong anh KHONG con gia tri phan biet (anh chuan cu 5 ngay) => mat kha nang phat hien hoi quy thi giac. Can user quyet dinh chup lai anh chuan O TRANG THAI DA BIET LA TOT.
- app/page.tsx do phien khac giu => neu phien do sua lib/menu-helpers.ts theo ban cu (5 muc) se GHI DE viec gom menu.
- Khong con blocker ky thuat nao khac.

## Remaining Work
- User nghiem thu tren :9000 (menu «Kho vat tu» => dashboard + 3 tab; card kho => man chi tiet 5 tab).
- User cho phep COMMIT (luat 25 AUTO_COMMIT = FALSE — phien KHONG tu commit).
- Quyet dinh ve anh chuan cong anh (BUG-005).

## Next Week
- Dong TASK-226 -> VERIFIED sau nghiem thu; commit theo phe duyet cua user.
- Xu ly BUG-005 (chup lai anh chuan) neu user dong y.
- Duy tri ghi log day du 9 loai cho SESSION_B va cap nhat WEEKLY_REPORT_DATA theo tuan.

---

## 🔄 CẬP NHẬT ĐỒNG BỘ LOG (2026-10-06 14:40) — Goal §22 «log phải khớp thực tế»

> Mục này **bổ sung** cho phần WEEK 2026-W41 ở trên (⛔ không sửa phần đã ghi) để số liệu báo cáo tuần **KHỚP** với log thật.

### Số entry THẬT trong log (đếm được)
| Log | Số entry |
|---|---|
| `EVENT_LOG` | **13** (`EVT-20261006-001..013`) |
| `TASK_LOG` | **1** (`TASK-20261006-226`) |
| `DEV_LOG` | **3** (`DEV-…-001..003`) |
| `CHANGE_LOG` | **6** (`CHG-…-001..006`) |
| `TEST_LOG` | **8** (`TEST-…-001..008`) |
| `BUG_HOTFIX_LOG` | **5** (`BUG-…-001..005`) |
| `DECISION_LOG` | **5** (`DEC-…-001..005`) |
| `HANDOFF_LOG` | **2** (`HANDOFF-…-001..002`) |

### BỔ SUNG vào mục «Testing» ở trên (2 lần test CHƯA có trong bản đầu)
- **`TEST-20261006-006`** — INTEGRATION (bundle + render): bundle SSR `dist/server/ssr/assets/page-boWaSNuv.js` chứa `warehouse_hub` **3 lần** · `warehouse_allocate_return` **0** · `warehouse_inbound` **0** ⇒ **thay đổi menu ĐÃ VÀO BẢN CHẠY**; probe `--only=06-warehouse` đăng nhập **HTTP 200** + chụp được **4 ảnh** ⇒ **app RENDER được**. → **PASS**
- **`TEST-20261006-007`** — UI (thử phương pháp): grep HTML máy chủ để xác minh menu → **THẤT BẠI VỀ PHƯƠNG PHÁP**. Phát hiện: (a) cổng login ĐÚNG là **`:9000`** (proxy), ⛔ không phải `:8787`; (b) HTML máy chủ là **SHELL** ⇒ **menu render bằng JS phía trình duyệt (SPA)**.
- **`TEST-20261006-008`** — UI (xác nhận dứt điểm): thử **cookie tường minh** (`mep_session=…`) → HTML **VẪN 7.123 ký tự** = trang đăng nhập ⇒ ⭐ **grep HTML ⛔ VĨNH VIỄN không thể xác minh menu**. Đã thử **hết 3 cách** (cổng sai · `-WebSession` · cookie tường minh) — **CẢ 3 THẤT BẠI VỀ PHƯƠNG PHÁP**, ⛔ **không phải lỗi sản phẩm**.
- ⚠️ **Hệ quả cho báo cáo**: mục «Testing» phải ghi **8 lần test**, trong đó **6 PASS** (`001..006`) và **2 FAIL-VỀ-PHƯƠNG-PHÁP** (`007`,`008`) — ⛔ **KHÔNG được tính là lỗi sản phẩm**.

### BỔ SUNG vào mục «Bugs» ở trên
- `BUG-20261006-005` — cổng ảnh **KHÔNG ĐẠT 68/68** do **ảnh chuẩn `tools/baseline/` CŨ 5 NGÀY** (tất cả cùng mốc **01/10 16:53:14**) ⇒ **lệch HỆ THỐNG**, ⛔ **không phải 68 lỗi** · **Status: OPEN** (⛔ chưa chạy `--update` — tránh **che lỗi**) ⇒ **cần user quyết định**.

### BỔ SUNG vào mục «Important Changes»
- `CHG-20261006-006` — **Documentation**: tạo `docs/dsh-state/00_GOAL_S4_MAPPING.md` (bản đồ ánh xạ Goal §4 ⇄ state thực có) ⇒ ⛔ **không tạo 5 tệp trùng** (tránh **state conflict** + **checklist corruption**).
- **`CHECKLIST UPDATED`** (§42 mục 7): APPEND vào `docs/dsh-state/CHECKLIST.md` — **kiểm chứng `git diff` = `314 thêm · 0 xoá`** ⇒ ⛔ **không xoá gì của phiên khác** ✔
