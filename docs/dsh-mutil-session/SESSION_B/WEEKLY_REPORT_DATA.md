# WEEKLY_REPORT_DATA — SESSION_B (ERP-SESSION-02)
> Du lieu phai tong hop TU LOG, KHONG suy doan.
> **Revision 2 — 2026-10-06 10:45** (bo sung TASK-227 + BUG-010→012 + xac minh TASK-226).
>   · Revision 1 (`2026-10-06`) ghi TASK-226 «DONE (da build)» — **SAI**: luc do CHUA nghiem thu.
>     Nay sua dung theo luat «⛔ khong bao cao thanh qua chua duoc xac minh» (§22).
>   · ⛔ Khong xoa du lieu cu — chi sua trang thai cho dung su that va bo sung muc moi.

# WEEK 2026-W41

## Session
ERP-SESSION-02

## Period
2026-10-05 -> 2026-10-11

## Completed Tasks
| TASK_ID | Module | Objective | Status | Test | Evidence |
|---|---|---|---|---|---|
| TASK-226 | Kho vat tu (hub) | Gom 7 muc menu -> 1 muc «Kho vat tu»; hub 3 tab (KHO · XUAT & NHAP · CAP PHAT & HOAN TRA); DASHBOARD TON KHO ngay dau tab KHO; cards kho (Ten·Ma·Du an·Ton); man chi tiet 5 tab + nut quay lai | **VERIFIED** | TEST-20261006-020 | anh `anh-chung-task-226/hub-kho-3-tab.png` |
| TASK-227 | Danh muc vat tu | Bo khoi trong treo o tab «Danh sach vat tu»; doi ten tab nhom -> «Danh muc nhom vat tu»; THEM tab «Danh muc he vat tu»; BO tab «Ma vat tu goc» | **VERIFIED** | TEST-20261006-018 · TEST-20261006-019 | anh `anh-chung-task-227/` (3 tab) |

## In Progress
- TASK-227 — cho user quyet cho dat 2 cong cu «So sanh/Doi chieu BOQ» + «Soat trung alias»
  (da go khoi hub, ⛔ CHUA xoa code — luat «⛔ khong xoa chuc nang»).

## UI/UX
### TASK-226 — hub «Kho vat tu»
- Tabbar 3 tab: KHO · XUAT & NHAP · CAP PHAT & HOAN TRA; tab mac dinh = KHO.
- Tab KHO: dashboard ton kho 8 chi so + cards kho (Ten · Ma · Du an · Ton hien tai) + toolbar tim/sap xep/xuat Excel.
- Tab XUAT&NHAP + CAP PHAT&HOAN TRA: subtabbar theo quyen + 2 danh sach + nut Tao · Tim · Sap xep · Loc.
- MAN CHI TIET KHO (thay modal): nut «Quay lai man KHO» + 5 tab (Dashboard kho · Ton kho · Xuat-Nhap ·
  Cap phat-Hoan tra · Nhan su).
- Menu nhom KHO: 7 muc -> 1 muc «Kho vat tu».
- 10/10 khoi noi dung thuoc DUNG 1 tab (truoc day hien o MOI tab).

### TASK-227 — man «Danh muc vat tu»
- ⛔ BO khoi «CONG CU CHAN LOAN» (SO SANH/DOI CHIEU BOQ + SOAT TRUNG ALIAS) dang DE len tab
  «Danh sach vat tu» — dung anh user chi ra.
- Tab «Danh sach vat tu» nay CHI con: bang vat tu 11 cot + 6 o loc/sap xep + nut Them vat tu / Xuat CSV.
- Tab «Danh muc nhom vat tu» (doi ten tu «Danh muc nhom con ma vat tu goc»).
- Tab MOI «Danh muc he vat tu»: 8 cot (Ma he · Ten he · Mo ta · Thu tu · So nhom · So vat tu ·
  Trang thai · Thao tac) + nut Them/Sua/An/Xoa + Tim/Loc/Sap xep/Xuat CSV.
- ⛔ BO tab «Ma vat tu goc».
- **BUG-20261006-012**: tab 1 & tab 2 **TRUOC DAY TRANG** (`<details>` thieu `open` => do that h=0px)
  — nay ca 3 tab h=947px.

## Frontend
- `lib/warehouse-hub.ts` (**MOI** · khoi THUAN) · `app/screens/Inventory.tsx` (254 -> ~500 dong) ·
  `lib/menu-helpers.ts` (gom menu 7->1).
- `app/screens/MaterialCategoryList.tsx` (**MOI**, 116 dong) — tai dung khuon `MaterialListTable`:
  `DataTable` + `PermissionGuard` + `StatusBadge` + `CardHead` + `downloadCsv`.
- `app/page.tsx` — `MATERIAL_TABS` 3 phan tu moi · xoa 8 dong khoi trong treo · them `open` cho
  2 `<details data-tab>` · don 3 dong bien thua.
- `app/styles/canonical.css` — ⛔ **hoan nguyen** (da thu `!important` de mo `<details>` =>
  **khong hieu qua** trong Blink).
- `npx tsc --noEmit` **EXIT=0**.

## Backend/API
- ⛔ **Khong doi API, khong doi schema.** Dung lai 3 action co san (do that `scripts/system-route.mjs`):
  `save_material_category` (:2693) · `set_material_category_status` (:2718) · `delete_material_category` (:2725)
  — ca 3 `requireRole(user,["admin"])`.

## Database
- ⛔ Khong co migration moi. Bang dung: `material_categories`
  (`id·code·name·description·sort_order·active`) — do that `scripts/system-route.mjs:674` + `:784`.
- Vân tay nguon: `VNTECH-FP-B7D4A52E0EFD921C` (718 tep) · BUILD EXIT=0 · BUILT ARTIFACT VALIDATION **DAT**.

## RBAC/Workflow
- Man he vat tu: Them/Sua theo `permission.canEdit`; An/Hien + Xoa chi `isAdminUser`.
- ⭐ UI phan anh DUNG chan nghiep vu cua server (`system-route.mjs:2728-2730`): he **con vat tu =>
  nut Xoa DISABLE** + `title` giai thich. Do that: Dien 9 · HVAC 4 · Thep 30 -> disabled;
  `E2E-MALFORM-CODE` 0 -> enabled.
- `BUG-20261007-002` (S01 sua): `moduleKey: item.moduleKey` — `viewable` chi con vai tro CONG QUYEN.

## Bugs
| BUG_ID | Severity | Feature | Status | Root Cause |
|---|---|---|---|---|
| BUG-20261006-005 | HIGH | Anh chuan hoi quy thi giac thoai hoa (5 anh duy nhat) | **FIXED** (da chup lai **56 anh duy nhat**) | ghi de luc DB chua khoi tao |
| BUG-20261006-006 | HIGH | Cong anh so sai man (11-modal-request ≡ 08-requests) | OPEN | selector da chet, `nav` khong duoc kiem |
| BUG-20261006-007 | MEDIUM | Bao xanh gia trong MASTER_STATUS.md:426 / TASK_INDEX.md:160 | OPEN | «0 px lech» ghi khi anh chua duoc nhin |
| BUG-20261006-008 | CRITICAL | app :9000 khong boot (404 bundle) | **FIXED** (S01) | server cache HTML cu |
| BUG-20261006-009 | CRITICAL | login tra 401 | **FIXED** (het sau commit S01) | nghi van commit `3dd2431` |
| BUG-20261006-010 | HIGH | hub «Kho vat tu» khong bao gio render | **FIXED + VERIFIED** | `moduleKey: viewable` thay vi `item.moduleKey` |
| BUG-20261006-011 | HIGH | sau build, server tra bundle cu => 404 | **FIXED** | `local-server.mjs` cache HTML o RAM |
| BUG-20261006-012 | HIGH | tab 1 & 2 man Danh muc vat tu TRANG | **FIXED + VERIFIED** | `<details>` thieu thuoc tinh `open` |

## Hotfixes
BUG-20261006-011 (khoi dong lai `:8787` dung PID) · BUG-20261006-012 (them `open`).

## Testing
- `npx tsc --noEmit` -> **EXIT 0** (nhieu lan).
- `npm run test:regression` -> **803 test · 802 pass · 0 fail · 1 skip** (PASS).
- E2E that tren `:9000` (Edge headless + CDP): TEST-20261006-014 -> 020.

## Important Changes
- CHG-20261006-001 — cau truc tab man «Danh muc vat tu» (4 yeu cau user).
- Luu y van hanh: **sau MOI lan `npm run build` phai khoi dong lai `:8787`** (BUG-011).
- Quy trinh build dung: `node tools/fixpoint-fingerprint.mjs` -> `node tools/set-local-identity.mjs`
  -> `npm run build`. ⛔ Thieu buoc 2 => server tu choi khoi dong («Dau van tay san pham ... khong hop le»).

## Decisions
| DEC_ID | Decision | Reason |
|---|---|---|
| DEC-20261006-001 | ⛔ KHONG xoa chuc nang «So sanh/Doi chieu BOQ» + «Soat trung alias» — chi go khoi hub vat tu | luat repo «⛔ khong xoa chuc nang»; cho user quyet cho dat |
| DEC-20261006-002 | Sua tab trang bang **thuoc tinh `open`**, ⛔ khong bang CSS `!important` | do that: CSS `display` ⛔ khong mo duoc `<details>` dong trong Blink |
| DEC-20261006-003 | Probe DOM dung **`textContent`**, ⛔ khong dung `innerText` | `innerText` tra RONG o Edge headless => bao sai ket qua |

## Blockers/Risks
| Risk | Severity | Detail |
|---|---|---|
| S01 **CHUA COMMIT** ban sua `moduleKey` + 63 anh chuan + 87 tep | **CAO** | mat ban sua neu checkout/reset => loi quay lai. Da ghi HANDOFF-20261006-004 |
| `tools/baseline` 63 anh chua commit | CAO | cong hoi quy thi giac khong co ban chuan tren GitHub |
| BUG-20261006-006/007 con OPEN | TRUNG BINH | cong anh van co the bao xanh gia |

## Remaining Work
- Cho S01 commit + push (HANDOFF-20261006-004).
- Cho user quyet cho dat 2 cong cu BOQ / soat trung alias.
- Sua BUG-20261006-006 (cong anh kiem `nav`) + BUG-20261006-007 (sua bao xanh gia).

## Next Week
- Nghiem thu lai cong anh hoi quy sau khi baselines duoc commit.
- Ra cac man khac co cung loi `<details>` thieu `open` (cung khuon tab).

---

## 📌 BỔ SUNG (Revision 3 · 07/10/2026) — TASK-228 + ĐÍNH CHÍNH CỔNG ẢNH
> Ghi bằng **APPEND** (⛔ không sửa bảng cũ ở Revision 2).

### Completed Tasks (bổ sung)
| TASK_ID | Module | Objective | Status | Test | Evidence |
|---|---|---|---|---|---|
| TASK-228 | Kho vật tư (hub) | Dọn gọn tab «KHO» theo yêu cầu user 07/10 («sắp xếp quá lộn xộn»): bỏ 3 khối trùng + 2 nhãn «Phạm vi dự án» trùng; **chuyển** 2 nút «Chuyển kho»/«Thẻ kho» vào toolbar | **VERIFIED** | TEST-20261007-022 · TEST-20261007-024 · TEST-20261007-025 | ảnh `anh-hub-kho-07-10/` (trước/sau) |

### Chỉ số đo được (TASK-228)
- Tab «KHO»: **6.202px → 4.949px** (giảm ~20%) · 10 → 9 khối
- Tab «XUẤT & NHẬP» 2.040px · 3 khối · 1 bảng · 30 dòng (**sạch**)
- Tab «CẤP PHÁT & HOÀN TRẢ» 2.953px · 3 khối · 3 bảng · 48 dòng (**sạch**)
- ⛔ **Không hỏng chức năng**: bộ lọc dự án còn tác dụng (KPI 1.235→0) · «⇄ Chuyển kho» mở panel · bộ lọc «Kho» còn

### Bugs (cập nhật trạng thái)
| BUG_ID | Status cũ | Status nay | Ghi chú |
|---|---|---|---|
| BUG-20261006-005 | FIXED | **FIXED** | ảnh chuẩn nay **56 ảnh duy nhất** (trước 5) |
| BUG-20261006-007 | OPEN | **FIXED** | đã ghi khối ĐÍNH CHÍNH bằng APPEND vào `MASTER_STATUS.md` + `TASK_INDEX.md` |

### Testing (bổ sung)
- `TEST-20261007-023` — **cổng ảnh cho TÍN HIỆU THẬT**: 34/68 lệch · 3 màn **0 px**
  (`11-modal-request` · `12-drawer-request-detail` · `19-report-center`) · 2 màn lệch lớn **đã giải thích**
  (TASK-227 đổi màn Danh mục vật tư · ảnh `16-modal-receipt` chụp lúc hub chưa render) · 2 màn lệch nhỏ = nhiễu.

### Blockers/Risks (bổ sung)
| Risk | Severity | Detail |
|---|---|---|
| `tools/baseline` **ĐÃ CŨ** | **CAO** | cổng báo 34/68 lệch; cần chụp lại — ⛔ chưa được user cho phép chạy `--update` |
| S01 **CHƯA COMMIT** (~93 tệp) | **CAO** | nguy cơ mất bản sửa `moduleKey` + 68 ảnh chuẩn (`HANDOFF-20261006-004`) |

### Remaining Work (bổ sung)
- Chờ user cho phép **chụp lại ảnh chuẩn** (`--update`).
- Chờ user quyết chỗ đặt 2 công cụ «So sánh BOQ» + «Soát trùng alias».
- Chờ user quyết 2 khối «giải thích» trong tab KHO (giữ / thu vào nút «?» / bỏ).
- **BUG-20261006-006 còn OPEN**: cổng ảnh ⛔ không kiểm `nav` ⇒ màn điều hướng sai vẫn báo PASS.

---

# ⭐⭐⭐ CẬP NHẬT 2026-10-07 (buổi chiều) — `ERP-SESSION-02` ⭐⭐⭐

> ⭐ Ghi **APPEND** (Goal §25 `NO_LOG_OVERWRITE = TRUE`) ⭐ ⛔ **không sửa khối cũ** ✓
> ⭐ Tuần ISO: **2026-W41** · ⭐ 2026-10-05 → 2026-10-11 · ⭐ Phiên: **`ERP-SESSION-02`**

## Session
`ERP-SESSION-02` (⭐ đăng ký tại `docs/dsh-state/SESSION_REGISTRY.md` ✓)

## Completed Tasks (bổ sung sau 10:25)
| TASK | Tên | Kết quả |
|---|---|---|
| **TASK-229** | Theo **2 quyết định user** | ⭐ **(c) BỎ HẲN** 2 công cụ «So sánh BOQ» + «Soát trùng alias» (⭐ xoá `MaterialMatchingWorkspace` 28 dòng ✓) · ⭐ **(b) THU** 2 khối «giải thích» vào **nút «?»** (⭐ `WarehouseDashboard.tsx` ✓) · ⭐ **(1) chụp lại ảnh chuẩn** ✓ |

## UI/UX
- ⭐ Tab «KHO» hub Kho vật tư: **6.202px → 4.949px** (TASK-228) → ⭐⭐ **4.052px** mặc định khi thu «?» (TASK-229) ⇒ ⭐ **giảm 35%** ⭐ (⭐ bấm «?» ⇒ 4.949px · bấm lại ⇒ 4.052px ✓)
- ⭐ **§22 KIỂM TAB TRONG MODAL**: ⭐⭐⭐ **ĐẠT** ⭐⭐⭐ — ⭐ modal «Sửa tài khoản» ⭐ 2 tab ⭐⭐ **609px / 609px · lệch 0px** ⭐⭐ · `flex=1 1 0px` ✅
- ⭐ **TẠM KHOÁ 4 NÚT CHẾT** + ghi rõ lý do (`disabled` + `title`) ⭐ 3/3 **đối chứng dương vẫn chạy** ✅

## Frontend
- ⭐ `app/screens/MaterialCategoryList.tsx` (**MỚI** · 116 dòng · TASK-227 ✅)
- ⭐ `app/screens/Inventory.tsx` (TASK-228 **6 thêm/10 xoá** · BUG-014/015 **14 thêm/7 xoá** ✓)
- ⭐ `app/screens/WarehouseDashboard.tsx` (TASK-229 ✓)
- ⭐ `app/page.tsx` (TASK-227: bỏ khối trồng tréo · 3 tab · S01 sửa `moduleKey` ✓)

## Backend/API
- ⭐ ⛔ **KHÔNG sửa backend** trong phiên này ⚠️
- ⭐ **PHÁT HIỆN (kiểm chứng độc lập cho S01)**: ⭐⭐ **LỆCH RBAC 2 PHÍA** ⭐⭐ — ⭐ frontend `lib/approval-helpers.ts:15` `stageAllowedForUser` **chỉ kiểm `allowedRoleCodes` + admin bypass** ⚠️ ⭐ backend `RequestManagementUseCase.java:902-914` `canApproveRequestStage` **đòi user nằm trong `stageApproverUserIds(projectId,stage)` ∪ `ownerUserId`** ✓ ⇒ ⭐ **giải thích CHÍNH XÁC bug `decide_approval` của S01** ✅

## RBAC/Workflow
- ⭐ ⭐ **RBAC MISMATCH (phát hiện lớn)** ⭐: ⭐ **`admin` ⛔ KHÔNG bypass ở backend** ⚠️ nhưng **frontend bypass** ⇒ ⭐ **nút bật cho người ⛔ không có quyền duyệt bước đó** ⚠️ ⇒ ⭐ **bấm ⇒ backend 403 ⇒ UI ⛔ không đổi** ✓
- ⭐ **3 hướng sửa** đã ghi cho S01: ⭐ (a) frontend kiểm thêm pool ⭐ (b) UI **hiện lỗi backend** ⭐ (c) **kiểm DỮ LIỆU** phân công ⚠️

## Bugs (bổ sung)
| BUG_ID | Severity | Status | Nội dung ngắn |
|---|---|---|---|
| `BUG-20261007-013` | **HIGH** | **OPEN** (⭐ nút đã khoá ✓) | «＋ Tạo phiếu cấp phát» gọi `open("allocate")` — **⛔ không có modal `allocate`** |
| `BUG-20261007-014` | **HIGH** | **OPEN** (⭐ nút đã khoá ✓) | «＋ Tạo kho» + «✎ Sửa» gọi `open("warehouse")` — ⛔ **không có modal `warehouse`** ⭐ + ⛔ **không có `WarehouseModal`** ⭐ + ⛔ **không có action `save_warehouse`** |
| `BUG-20261007-015` | **HIGH** | **OPEN** (⭐ nút đã khoá ✓) | «🗑 Xóa kho» gọi `action("delete_warehouse")` — ⛔ **không tồn tại ở CẢ JS lẫn Java** (⭐ đo 2 chiều ✓) |
| `BUG-20261007-016` | **LOW** | **OPEN** | Ghi chú `AdminUserModalTabs.tsx:39-41` **LỖI THỜI** (⭐ ⛔ không sửa — §7 ✓) |
| `BUG-20261006-012` | HIGH | **FIXED** ✅ | Tab 1+2 màn «Danh mục vật tư» **TRẮNG** do `<details>` thiếu `open` (⭐ đo `h=0px → 947px` ✓) |

## Testing (bổ sung)
- ⭐ `TEST-20261007-027` — ⭐ **hồi quy rộng §25**: ⭐ **54/54 mục menu render OK · 0 màn trống · 0 không bấm** (11 nhóm) ✅ + ⭐ **chứng minh ⛔ không hồi quy** ✓
- ⭐ `TEST-20261007-028` — **phương pháp quét lớp lỗi + GIỚI HẠN** (⭐ quét ③ `<button>` **⛔ KHÔNG đáng tin** ⇒ **tự dừng, ⛔ không báo số** ✓)
- ⭐ `TEST-20261007-029` — ⭐ **§22 tab trong modal: ĐẠT** (609/609px ✓)
- ⭐ **HỒI QUY `npm test`**: ⭐⭐ **803 test · 802 pass · 0 fail · 1 skip** ⭐⭐ ✅ `TEST_EXIT=0` ✅
- ⭐ **BUILD**: ⭐ `tsc EXIT=0` ✅ ⭐ `npm run build` **thành công** ✅ ⭐ `BUILT ARTIFACT VALIDATION: ĐẠT` ✅ ⭐ vân tay **`VNTECH-FP-ECCDEC5AB0C8BDF8`** ✓

## Important Changes
| CHANGE_ID | Category | Before → After |
|---|---|---|
| `CHG-20261007-006` | **UI_UX + BUGFIX** | ⭐ 4 nút bấm mà **⛔ im lặng** → ⭐ **bị KHOÁ + có `title` nêu lý do** + ghi chú thanh công cụ ⭐ (⛔ giữ `onClick` ⇒ hoàn nguyên 1 bước ✓) |
| ⭐ **MERGE `unity` → `main`** | **DEVOPS** | ⭐ **5 ĐỢT** · ⭐⭐ **0 XUNG ĐỘT** mọi đợt ⭐⭐ · ⭐ `main` **nay có TOÀN BỘ nội dung `unity`** ✅ · `3bf6af2` → `044deb1` → `666c4cb` → `f38294e` → **`a908782`** ✓ |

## Decisions
| DEC_ID | Quyết định |
|---|---|
| `DEC-20261007-008` | ⭐ **USER QUYẾT**: ⭐⭐ **merge `unity` → `main` NGAY** ⭐⭐ |
| `DEC-20261007-009` | ⭐ **USER QUYẾT**: ⭐ **`BUG-006` GIAO `ERP-SESSION-01`** ⭐ |
| `DEC-20261007-010` | ⭐ **4 nút chết** ⇒ ⭐ **phương án (b) TẠM KHOÁ + GHI RÕ LÝ DO** ⭐ (⭐ user ⛔ chưa trả lời ⇒ ⭐ **ghi rõ giả định** ✓) |

## Handoffs
| HANDOFF_ID | From → To | Nội dung |
|---|---|---|
| `HANDOFF-20261007-005` | ⭐ `02` → `01` | ⭐ `BUG-006`: ⭐ **3 màn ảnh chuẩn chụp SAI MÀN** ⚠️ (`11` **trùng byte** `08` · `16` `NO_CLICK_TARGET` · `19` `NO_GROUP()`) + ⚠️ **`nav` ⛔ không được kiểm** (L428) ⇒ ⭐ **cổng ảnh vẫn có thể báo XANH GIẢ** ⚠️ |
| ⭐ **Khối phối hợp trong `SESSION_REGISTRY.md`** | ⭐ `02` → `01` | ⭐ ① `BUG-20261007-003` **đổi trạng thái** ⇒ ⭐ **đề nghị đóng** ✓ ⭐ ② ⭐ **kiểm chứng độc lập `decide_approval`**: ⭐⭐ **RBAC MISMATCH** ⭐⭐ (⭐ kèm 3 hướng sửa ✓) |

## Blockers/Risks (cập nhật — ⭐ 2 mục cũ ĐÃ GIẢI QUYẾT ✅)
| Risk | Severity | Detail |
|---|---|---|
| ⭐ ~~`tools/baseline` **ĐÃ CŨ**~~ | ✅ **ĐÃ GIẢI QUYẾT** | ⭐ **ĐÃ chụp lại**: **68 ảnh · 60 ẢNH DUY NHẤT** ⭐ (⭐ trước: 5 ✓) — ⭐ **ĐÃ COMMIT + PUSH** ✅ |
| ⭐ ~~S01 **CHƯA COMMIT**~~ | ✅ **ĐÃ GIẢI QUYẾT** | ⭐ **ĐÃ commit + push** trong `7a033a0` (**116 tệp**) ✅ |
| ⭐⭐ **4 chức năng kho ⛔ CHƯA HOẠT ĐỘNG** | **CAO** ⚠️ | ⭐ đã tạm khoá nhưng ⛔ **chưa có chức năng thật** ⚠️ ⇒ ⭐⛔ **CẦN QUY TẮC NGHIỆP VỤ TỪ USER** ⭐ |
| ⭐⭐ **RBAC MISMATCH** (`decide_approval`) | **CAO** ⚠️ | ⭐ frontend kiểm **role** ⭐ backend đòi **pool phân công** ⚠️ ⭐ **thuộc `ERP-SESSION-01`** ⇒ ⭐ **đã giao qua state CHUNG** ✅ |
| `BUG-006` — cổng ảnh ⛔ không kiểm `nav` | **CAO** ⚠️ | ⭐ **vẫn OPEN** ⭐ ⭐ **đã giao `ERP-SESSION-01`** ✅ |

## Remaining Work (cập nhật)
- ⭐ 🔴 **CHỜ USER**: ⭐ **quy tắc nghiệp vụ** cho ⭐ ① modal **«Tạo/Sửa kho»** ⭐ ② action **`delete_warehouse`** ⭐ ③ **«phiếu cấp phát»** ⚠️
- ⭐ ⏳ **CHỜ `ERP-SESSION-01`**: ⭐ `BUG-006` ⭐ + **RBAC mismatch `decide_approval`** ✓
- ⭐ **`BUG-20261007-016`** — ⭐ chờ **xác minh phân vai** tệp `AdminUserModalTabs.tsx` ⏳

## Next Week
- ⭐ Hoàn thiện **CRUD kho** sau khi có quy tắc nghiệp vụ ⭐ (⭐ modal + API + kiểm quyền ✓)
- ⭐ Xử lý **RBAC mismatch** toàn hệ (⭐ rà chỗ khác có cùng kiểu lệch frontend/backend ⚠️)
- ⭐ Sửa **cổng ảnh hồi quy** để ⛔ hết **báo xanh giả** ⚠️
