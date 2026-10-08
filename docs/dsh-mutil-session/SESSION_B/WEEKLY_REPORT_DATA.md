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

---

# ⭐⭐ BỔ SUNG 2026-10-08 — `TASK-230` (HUB «KHO VẬT TƯ» THEO 7 YÊU CẦU USER) ⭐⭐

> ⚠️ **Ghi chú nguồn (§14 — ⛔ không suy đoán)**: mục này tổng hợp **CHỈ** từ các log đã ghi:
> `TASK_LOG` · `CHG-20261007-007` · `TEST-20261007-035` · `TEST-20261007-036` · `BUG-20261007-017` · `EVT-20261007-046` · `HANDOFF-20261007-008` · `DEC-20261007-011`.

## Session
`ERP-SESSION-02` (VNTECH `ERP-SESSION-02` = `SESSION_B`)

## Period
2026-10-08

## Completed Tasks
| Task | Nội dung | Trạng thái |
|---|---|---|
| `TASK-230` | Hub «Kho vật tư» làm lại theo **7 yêu cầu user**: ① card kho **6 thông tin** + **nổi bật** ② xoá dòng note «Ba tab…» ③④ **sửa lệch 356px** ⑤ **bấm 1 lần** vào card ⇒ mở màn chi tiết kho ⑥ **5 tab** có search/sort/filter + nút tạo phiếu + **modal thêm nhân sự kho** | ⭐ **DONE** — `TEST-20261007-036` **7/7 ĐẠT** ✅ |

## UI/UX
- ⭐ **Card kho THÊM 4 thông tin** (yêu cầu user ①): **Tồn kho** · **Số mã đang thiếu** · **Thủ kho** · **Trạng thái hoạt động** — đo được: **12 thẻ** hiện đủ 6 mục ✅
- ⭐ **Card «NỔI BẬT»**: **ĐO ĐƯỢC** trước đây ⛔ **KHÔNG có rule CSS nào** cho `.warehouse-card` ⇒ thêm khối riêng: `background-image = linear-gradient(160deg, …)` · `box-shadow = rgba(22,50,88,.06)` · viền gradient trái · **hover nâng lên** · chip trạng thái · **cam** khi có mã thiếu ✅
- ⭐⭐ **SỬA LỆCH 356px** (yêu cầu ③④): `.inventory-approved-grid{grid-template-columns:minmax(0,1fr) **340px**;gap:16px}` ⇒ cột 340px **RỖNG** ⇒ `1590 − 340 − 16 = **1234**` ✅ **khớp CHÍNH XÁC số đo** ⇒ ép 1 cột (neo `.approved-inventory-screen`) ⇒ **tabBar · khối XUẤT-NHẬP · khối CẤP PHÁT · DANH SÁCH đều = 1590px** ✅
- ⭐ **Xoá dòng note** «Ba tab của cùng một màn: …» (yêu cầu ②) ✅
- ⭐ **Bấm 1 LẦN** vào card ⇒ mở màn chi tiết kho (yêu cầu ⑤; trước phải **bấm đúp**) ✅ — **đo được** `false → true` ✅

## Frontend
- ⭐ `app/screens/Inventory.tsx` (**+283/−37**): card 6 thông tin · `isAdmin` · nhãn nhiệm vụ · lọc/sắp xếp cho **màn chi tiết kho** · **modal thêm nhân sự** · **5 toolbar** cho 5 tab ✅
- ⭐ `app/globals.css` (**+61**): 2 khối `TASK-230` — ⚠️ **đặt TRƯỚC dấu** `/* VNTECH_MASTER_BASELINE_CSS_R1_1_1_END */` ✅
- ⚠️ `app/page.tsx` (**+1 thuộc tính**, **tệp LOCK của `ERP-SESSION-01`** — ⭐ **USER CHO PHÉP**): `<Inventory … **action={action}** />` ✅

## Backend/API
- ⛔ **KHÔNG thay đổi backend.** ⭐ **Nguồn ghi `user_warehouse_scopes` = action CÓ SẴN `save_user_access`** (đo `UserManagementUseCase.java:258`) — ⚠️ **`requireRole(…, List.of("admin"))`** ⇒ ⭐ **ADMIN-ONLY** ✅ + có **chốt MỐC 111** chống xoá sạch quyền ✅
- ⚠️ **`saveUserAccess` là FULL-REPLACE** (`clearUserScopes()` xoá cứng 3 bảng) ⇒ modal **gửi ĐỦ 3 nhóm** `projectScopes` + `warehouseScopes` + `modulePermissions` ✅ (⛔ gửi thiếu sẽ **mất phạm vi khác** của tài khoản ⚠️) ✅

## Database
- ⛔ **KHÔNG migration mới.** ⭐ **Nguồn dữ liệu ĐO TỪ SQL** (`BootstrapDataAdapter.java`): `warehouses[]` = `id·code·name·type·projectId·parentWarehouseId` ⛔ **không có `active`** (chỉ `WHERE active=1`) · ⛔ **không có `keeperUserId`** · `inventory[]` **CÓ `minStock`** · ⭐ **`userWarehouseScopes[]`** = `userId·warehouseId·permission·warehouseCode·warehouseName·type·projectId` ✅

## RBAC/Workflow
- ⭐ Nút «**＋ Thêm nhân sự**» **chỉ hiện khi `role === "admin"`** — ⭐ **KHỚP ĐÚNG backend** (`requireRole(admin)`) ⇒ ⛔ **không tạo nút chết** ✅
- ⭐ Nhiệm vụ với kho = tập giá trị **CSDL thật** `user_warehouse_scopes.permission` (đo `AccessScopeService:31`): `read` · `write` · `approve` · `admin` ✅

## Bugs
| BUG | Mức | Nội dung | Trạng thái |
|---|---|---|---|
| `BUG-20261007-017` | **HIGH** | ⚠️ `<Inventory>` ⛔ **KHÔNG nhận prop `action`** (`page.tsx:741` thiếu `action={action}`) ⇒ nút «Lưu phân công» **`disabled` VĨNH VIỄN** ⚠️ + ⭐ **lỗi tiềm ẩn có sẵn**: nút «🗑 Xóa kho» dựa `action` ⇒ **luôn false** | ⭐ **FIXED + `TEST-035` PASS** (đo `disabled: true → false` ✅) |
| ⭐ **BUG NGUỒN (phát hiện trong `TASK-230` ⑥)** | **HIGH** | ⚠️ Tab «Nhân sự» màn chi tiết kho **LUÔN RỖNG** — vì lọc `data.staffDirectory` theo `u.warehouseId` ⛔ **TRƯỜNG KHÔNG TỒN TẠI** (đo SQL: `staffDirectory` ⛔ không có `warehouseId`) | ⭐ **FIXED** — dùng **`userWarehouseScopes`** ⇒ nay **28 nhân sự** hiện ra ✅ |

## Hotfixes
- ⭐ `CHG-20261007-007`: `page.tsx` +1 prop · `globals.css` +61 dòng ✅
- ⭐ **Tự sửa 1 lỗi DO CHÍNH EM**: em **append CSS SAU dấu** `…_END */` ⇒ ⭐ **test `project-navigation-consolidation.test.mjs:65` ĐỎ** ⚠️ ⇒ đã **đảo lên TRƯỚC dấu** ⇒ **865 · 864 pass · 0 fail** ✅

## Testing
| TEST | Nội dung | Kết quả |
|---|---|---|
| `TEST-20261007-035` | Nút «Lưu phân công» — **đúng thứ tự đo** | ⭐ **PASS** — `disabled` **true → false** ✅ · 28 ứng viên · hiện Chức danh/Phòng ban · nhiệm vụ `read,write,approve,admin` ✅ |
| `TEST-20261007-036` | ⭐⭐ **HỒI QUY ĐẦY ĐỦ 7 YÊU CẦU** trên build hiện tại | ⭐⭐ **7/7 ĐẠT** ⭐⭐ ✅ |
| Hồi quy chung | `tsc` · `npm test` · `npm run build` | ✅ `tsc=0` · ⭐ **865 · 864 pass · 0 fail** · ✅ **BUILD ĐẠT** · vân tay `VNTECH-FP-171C114C26ACB7AF` ✅ |

## Important Changes
⭐ **3 tệp mã** (⚠️ **CHƯA COMMIT** — user yêu cầu ⛔ phiên 02 không tự commit): `app/screens/Inventory.tsx` · `app/globals.css` · `app/page.tsx` ✅
⭐ **ĐÃ SAO LƯU RA NGOÀI REPO**: `%TEMP%\vntech-session02-backup-20261008-090633.patch` (61 KB · 454 dòng) + `.local-data/_backup-session02.patch` ✅

## Decisions
⭐ `DEC-20261007-011` — **đề xuất quy tắc nghiệp vụ 4 chức năng kho**, ⭐ **lấy từ SCHEMA THẬT** (`CREATE TABLE warehouses` + 4 câu `INSERT`) ⇒ ⭐ chuyển «**xin quy tắc**» ➜ «**duyệt đề xuất**» ✅ (⛔ **CHƯA viết mã** — §14 ✓)

## Handoffs
⭐ `HANDOFF-20261007-008` → **`ERP-SESSION-01` + `ERP-SESSION-03`**: phiên 02 **đã sửa 2 tệp NGOÀI phạm vi** (⭐ ⚠️ **có phép của user**): `app/page.tsx` (LOCK S01) + `app/globals.css` (DÙNG CHUNG) ✅
⭐ **ĐÃ CHECK CONFLICT TRƯỚC**: `git diff HEAD -- app/page.tsx` = **đúng 1 dòng** ⇒ ⛔ **KHÔNG ai sửa dở** ✅
⭐ **ĐÃ BÁO** tại **state dùng chung**: `SHARED_STATE.md` + `docs/dsh-state/SESSION_REGISTRY.md` ✅

## Blockers/Risks
| # | Nội dung | Mức |
|---|---|---|
| ① | ⚠️ `origin/unity` **VẪN CÒN 2 commit** của phiên 02 (`c8d42ac` · `8d9c303`) ⇒ xoá khỏi remote **BẮT BUỘC force-push** ⇒ ⚠️ **nguy hiểm** cho `ERP-SESSION-01`/`-03` đang hoạt động ⇒ ⛔ **KHÔNG tự làm** ⏳ **chờ user** | **CAO** |
| ② | ⚠️ **8 tệp chưa commit** (3 mã + 5 log) ⇒ ⚠️ **rủi ro bị phiên khác `git add -A` cuốn vào** (S03 đang có **112 tệp** chưa commit) ⇒ ⭐ **đã sao lưu patch** ✅ · ⏳ **chờ user cho commit** | **TRUNG BÌNH** |
| ③ | 🔴 **CHẶN từ trước**: thiếu **quy tắc nghiệp vụ** cho **4 chức năng kho** (`BUG-20261007-013/014/015`) ⇒ ⭐ **đã có đề xuất `DEC-011`** ⏳ **chờ user duyệt** | **CAO** |
| ④ | ⏳ `BUG-006` + lệch RBAC `decide_approval` ⇒ **đã giao `ERP-SESSION-01`** | **CAO** |

## Remaining Work
⭐ ① Chờ user quyết **force-push** ② Chờ user cho **commit** ③ Chờ user **duyệt `DEC-011`** ④ Chờ `ERP-SESSION-01` sửa **`BUG-006`** + lệch RBAC `decide_approval` ⑤ Chờ S01/S03 **xác nhận `HANDOFF-008`** ✅

## Next Week
⭐ Sau khi user duyệt `DEC-011` ⇒ **viết mã 4 chức năng kho** (`open("warehouse")` · `open("allocate")` · `action("delete_warehouse")`) — ⛔ hiện **TẠM KHOÁ** ✅

---

# ⭐⭐ BỔ SUNG 2026-10-08 (tiếp) — `TASK-231`: CARD KHO CAO ĐỀU + DỌN LABEL JARGON ⭐⭐

> ⚠️ **Nguồn (§14 — ⛔ không suy đoán)**: chỉ tổng hợp từ `CHG-20261007-008` · `TEST-20261007-037` · `TEST-20261007-038`.

## Session
`ERP-SESSION-02`

## Period
2026-10-08

## Completed Tasks
| Task | Nội dung | Trạng thái |
|---|---|---|
| `TASK-231` | ⭐ Yêu cầu user: «*sửa lại dashboard tồn kho các card đang ở trạng thái **kích thước khác nhau** và **hiển thị không đồng đều**, ngoài ra hãy **loại bỏ các đoạn label thừa** đi*» | ⭐ **DONE** — `TEST-037` + `TEST-038` **PASS** ✅ |

## UI/UX
- ⭐⭐ **CARD CAO ĐỀU** — ⭐ **ĐO TRƯỚC (⛔ không đoán)**: ⭐ `chieuCao { "**202**": 2, "**222**": 10 }` ⇒ ⭐⭐ **LỆCH 20px** ⭐⭐ ⚠️ · ⭐ `chieuRong { "298": 12 }` (⭐ ⛔ không lệch ✓)<br>⭐ **NGUYÊN NHÂN GỐC**: ⭐ 2 thẻ **thiếu 1 dòng** «**Dự án:** …» ⚠️ — ⭐ vì kho `transit` ⛔ **không thuộc dự án** ✓<br>⭐ ⚠️ **PHÁT HIỆN PHỤ**: ⭐ **card KHO ⛔ KHÔNG phải chỗ lệch** (⭐ 12 thẻ vốn đã đều ✓) — ⭐ chỗ lệch là **card trong `DASHBOARD TỒN KHO`** ⭐ (⭐ đúng như user nói «*dashboard tồn kho **các card***» ✓) ✓<br>⭐ **FIX**: ⭐ `app/globals.css` ⭐⭐ **+`min-height:222px`** ⭐⭐ (⭐ bằng đúng max đo được ✓) ⇒ ⭐⭐ **ĐO SAU: `chieuCao { "222": 12 }` · LỆCH = 0px** ⭐⭐ ✅ |
- ⭐⭐ **DỌN LABEL JARGON** — ⭐ **18 đoạn** đã xoá/reword ⚠️:<br>⭐ **Đợt 1 (10 đoạn)**: ⭐ «*Nguồn 8 chỉ số: … → `` `inventory[]` ``…*» · ⭐ «*Nguồn: `` `warehouses[]` `` (id · code · name · type · projectId · projectCode) ghép `` `inventory[].warehouseId` ``*» · ⭐ «*Mọi số tính TRỰC TIẾP từ dữ liệu trong payload*» · ⭐ «*(W-02 đã xác nhận quan hệ Project : Warehouse là 1:N)*» · ⭐ «*Chỉ tính dòng CÓ cấu hình mức tối thiểu (`` `minStock` `` > 0)…*» · ⭐ «*Nguồn: `` `data.inventory` `` lọc theo `` `warehouseId` ``…*» · ⭐ «*Nguồn: `` `data.userWarehouseScopes` ``…*» · ⭐ «*Danh sách kho… Bấm một thẻ để xem thủ kho, lịch sử xuất/nhập…*» (**305 → 37 ký tự**) · ⭐ «*Theo dõi tồn theo đúng dự án/kho được phân quyền…*» · ⭐ chú thích thẻ ✅<br>⭐ **Đợt 2 (8 đoạn — ⭐ quét tự động toàn hub, 7 màn)**: ⭐ «*Σ balance*» · ⭐ «*`stock_reservations`*» · ⭐ «*Σ `acceptedQty`*» · ⭐ «*Σ `totalQty`*» · ⭐ «*Σ quantity × `unit_cost` từ `stock_movements`*» · ⭐ «*Gộp hai mục cũ theo **MT3 §F**…*» · ⭐ «***§7.5** — … backend chưa khai báo action*» · ⭐ «*(**§14/§20**)*» ✅<br>⭐⭐ **KẾT QUẢ QUÉT LẦN 2**: ⭐ tab «XUẤT & NHẬP» ⭐ **`[]` SẠCH** · ⭐ tab «CẤP PHÁT & HOÀN TRẢ» ⭐ **`[]` SẠCH** · ⭐ **4 tab màn chi tiết kho** ⭐ **`[]` SẠCH** ✅ |

## Frontend
- ⭐ `app/globals.css` (⭐ **dùng chung** — ⚠️ có phép user ✓): ⭐ **+`min-height:222px`** ✅
- ⭐ `app/screens/WarehouseDashboard.tsx`: ⭐ xoá 2 khối «Nguồn…» · ⭐ reword 5 note KPI ✅
- ⭐ `app/screens/Inventory.tsx`: ⭐ reword 3 note toolbar + 1 chú thích thẻ ✅

## Testing
| TEST | Nội dung | Kết quả |
|---|---|---|
| `TEST-20261007-037` | Đo card đều + 6 label kỹ thuật đã mất | ⭐ **PASS** — `{222:12}` lệch **0px** · **6/6 `false`** ✅ |
| `TEST-20261007-038` | Quét toàn hub (7 màn) tìm jargon + reword 8 chỗ | ⭐ **PASS** — 3 màn **`[]` SẠCH** ✅ |
| Hồi quy | `tsc` · `npm test` · `npm run build` | ✅ `tsc=0` · ⭐ **`865 · 864 pass · 0 fail`** · ✅ **BUILD ĐẠT** ✅ |

## Bugs
| BUG | Mức | Nội dung | Trạng thái |
|---|---|---|---|
| ⭐ **TEST ĐỎ do chính phiên 02** | **HIGH** | ⚠️ Xoá **cả phần tử** mang thuộc tính ⭐ `data-inventory-source` ⭐ ⇒ ⭐ test **`W-04` ĐỎ** ⚠️ (`tests/w04-inventory-dashboard.test.mjs:170` — ⭐ test ⭐ **chỉ đòi THUỘC TÍNH TỒN TẠI**, ⛔ không đòi chữ dài ✓) | ⭐ **FIXED** — giữ thuộc tính + **đổi chữ thành NGẮN** ⇒ `W-04` **PASS 6/6** ✅ **+ vẫn đạt yêu cầu user** ✅ |

## Important Changes
⭐ **2 đoạn «ĐỐI CHỨNG NGUỒN» ⛔ KHÔNG XOÁ** — ⭐ **có bằng chứng mã** ⚠️:<br>⭐ ① «*Giá vốn thật chỉ có ở `` `stock_movements.unit_cost` ``…*» = hằng `INVENTORY_VALUE_NO_SOURCE_NOTE` ⇒ ⭐ **`w04:136`**: ⭐ `assert.ok(m.value.note.includes("stock_movements"), "Lý do phải nêu nguồn bị thiếu")` ⛔<br>⭐ ② «*Không có dòng nào dưới mức tồn tối thiểu (`` `inventory[].minStock` `` · 1185/1185…)*» = `metrics.lowStockSource` ⇒ ⭐ **`w04:81`**: ⭐ `assert.ok(metric.source && …, "Chỉ số «…» thiếu khai báo NGUỒN")` ⛔<br>⇒ ⭐⭐ **LÀ «ĐỐI CHỨNG NGUỒN» CÓ CHỦ ĐÍCH** (⭐ chống bịa số ✓) ⭐ ⛔ **KHÔNG PHẢI label thừa** ⭐ ⇒ ⭐ **ĐÃ BÁO USER, ⛔ không tự xoá** ✅

## Decisions
⭐ **BÀI HỌC (§33) — ⭐⭐ «XOÁ CHỮ ≠ XOÁ PHẦN TỬ»** ⭐⭐ — ⭐ **2 lần trong CÙNG 1 task** ⚠️: ⭐ lần 1 `data-inventory-source` ⚠️ · ⭐ lần 2 `INVENTORY_VALUE_NO_SOURCE_NOTE` + `metrics.lowStockSource` ⚠️<br>⇒ ⭐ **TRƯỚC khi xoá/đổi 1 đoạn chữ trên UI ⇒ PHẢI `grep` ① `tests/` ② JS** xem đoạn đó có bị **ràng buộc** không ✅<br>⇒ ⭐ **CÁCH PHÂN BIỆT**: ⭐ nói về **cấu trúc kỹ thuật nội bộ** (⭐ «`MT3 §F`» · «*backend chưa khai báo action*» ✓) ⇒ **THỪA** ⭐; ⭐ nói **VÌ SAO số này không có / lấy từ đâu** (⭐ đối chứng âm ✓) ⇒ **CẦN** ✅

## Blockers/Risks
| # | Nội dung | Mức |
|---|---|---|
| ① | ⚠️ `origin/unity` **vẫn còn 2 commit** của phiên 02 ⇒ xoá **bắt buộc force-push** ⚠️ (⭐ nguy hiểm cho S01/S03 ✓) ⇒ ⛔ **chưa làm, chờ user** | **CAO** |
| ② | ⚠️ Nhiều tệp **chưa commit** (⭐ 3 mã + 6 log ⚠️) ⇒ ⭐ đã **sao lưu patch** ra ngoài repo ✅ · ⏳ **chờ user cho commit** | **TRUNG BÌNH** |
| ③ | 🔴 **CHẶN**: thiếu **quy tắc nghiệp vụ** 4 chức năng kho ⇒ ⭐ **đã có `DEC-011`** ⏳ chờ duyệt | **CAO** |
| ④ | ⏳ `BUG-006` + lệch RBAC `decide_approval` ⇒ **đã giao S01** | **CAO** |

## Remaining Work
⭐ Chờ user: ⭐ ① force-push ⭐ ② cho commit ⭐ ③ duyệt `DEC-011` ⭐ ④ quyết 2 đoạn «đối chứng nguồn» ⭐ · ⭐ Chờ `HANDOFF-008` được S01/S03 xác nhận ✅

## Next Week
⭐ Duyệt `DEC-011` ⇒ **viết mã 4 chức năng kho** (⛔ hiện TẠM KHOÁ) ✅

---

# ⭐⭐ BỔ SUNG 2026-10-08 (cuối) — `TASK-231c` + `TASK-231d`: LÀM RÕ «ĐỐI CHỨNG NGUỒN» THEO LUẬT USER ⭐⭐

> ⚠️ **Nguồn (§14)**: chỉ từ `CHG-20261007-009` · `CHG-20261007-010` · `BUG-20261008-019` · `TEST-20261007-039` · `TEST-20261007-040`.

## Session
`ERP-SESSION-02`

## Period
2026-10-08

## Completed Tasks
| Task | Nội dung | Trạng thái |
|---|---|---|
| `TASK-231c` | **Luật user ④**: «*nếu **đối chứng nguồn** chỉ có tác dụng để **dev check** thì **xóa đi**, **còn không thì giải thích rõ ràng ra***» ⇒ ⭐ **ĐO** để xác định phục vụ ai ⇒ ⭐ **viết lại 2 đoạn** cho user đọc được | ⭐ **DONE** — `TEST-039` **PASS** ✅ |
| `TASK-231d` | ⭐ **Truy tiếp**: khối «Giải thích chỉ số» **HIỆN** cho user **7 chuỗi ký hiệu kỹ thuật** ⚠️ ⇒ ⭐ **Việt hoá 11 chuỗi** | ⭐ **DONE** — `TEST-040` **PASS** ✅ |

## UI/UX
- ⭐⭐ **2 «ĐỐI CHỨNG NGUỒN» — ⛔ KHÔNG CHỈ ĐỂ DEV CHECK** ⭐⭐ (⭐ đo từ mã ✓):<br>⭐ ① `INVENTORY_VALUE_NO_SOURCE_NOTE` ⭐ hiện ở **`note` ô KPI «Giá trị kho»** (`WarehouseDashboard.tsx:142`) ⇒ ⭐ người dùng **thấy «chưa có nguồn» ở chỗ đáng ra là SỐ TIỀN** ⚠️ ⭐ ⇒ **CẦN biết vì sao** ✅<br>⭐ ② `metrics.lowStockSource` ⭐ hiện ở **dòng empty-state** (`:235`) ⇒ ⭐ **CẦN biết đã kiểm bao nhiêu** ✅<br>⇒ ⭐ theo luật user: ⭐⭐ **GIẢI THÍCH RÕ RÀNG RA** ⭐⭐ (⛔ không xoá) ✅
- ⭐ **VIẾT LẠI (2 đoạn)**: ⭐ (a) «*…payload bootstrap KHÔNG trả khoá stockMovements… trên CSDL…*» ⇒ ⭐⭐ «***Chưa tính được giá trị kho: sổ giá vốn (bảng stock_movements) chưa được nạp vào dữ liệu, nên hệ thống để trống thay vì hiện một con số không đúng.***» ⭐⭐ ✅<br>⭐ (b) «*…(`inventory[].minStock` · 1185/1185 dòng có giá trị)*» ⇒ ⭐⭐ «***…(đã kiểm 1185 dòng tồn trong phạm vi).***» ⭐⭐ ✅
- ⭐⭐ **VIỆT HOÁ 11 CHUỖI NGUỒN trong khối «Giải thích chỉ số»** ⭐⭐ (⭐ đo được: khối này **HIỆN** cho user khi bấm «Giải thích chỉ số» ✓): ⭐ «`inventory[].balance`» ⇒ «**Số lượng tồn thực tế trong kho**» ⭐ «`inventory[].available`» ⇒ «**Tồn khả dụng (đã trừ phần giữ chỗ)**» ⭐ «`inventory[].reserved`» ⇒ «**Số lượng đang bị giữ cho phiếu đề nghị**» ⭐ «`receipts[].acceptedQty`» ⇒ «**Số lượng đã nhận trên phiếu nhập**» ⭐ «`issues[].totalQty`» ⇒ «**Số lượng đã xuất trên phiếu xuất**» ⭐ «`transferOrders[].status`» ⇒ «**Trạng thái phiếu điều chuyển**» ⭐ «`inventory[].minStock`» ⇒ «**Mức tồn tối thiểu đã đặt của vật tư**» ⭐ + ⭐ 4 chuỗi trạng thái: «*payload KHÔNG trả khoá stockMovements*» ⇒ «**chưa có dữ liệu giá vốn**» ⭐ «*materials.standardPrice rỗng*» ⇒ «**chưa có giá chuẩn trong danh mục vật tư**» ⭐ «*0 dòng trong phạm vi*» ⇒ «**chưa có dòng nào trong phạm vi**» ⭐ «*rỗng trong payload*» ⇒ «**dữ liệu còn trống**» ✅
- ⭐⭐ **GHI NHẬN QUAN TRỌNG — «bootstrap :651/661/671/673»** ⭐⭐ (⭐ số dòng mã nguồn ⚠️) ⭐ **⛔ KHÔNG BAO GIỜ hiện trên màn hình** ✅ (⭐ đo `document.body.innerText` **trước VÀ sau** khi mở khối giải thích ⇒ ⭐ đều `false` ✓) ⇒ ⭐ **là metadata trong mã**, ⛔ không phải nhãn UI ⇒ ⭐ **luật user ⛔ không áp dụng, ⛔ không xoá** ✅

## Frontend
- ⭐ `app/screens/WarehouseDashboard.tsx` — ⭐ viết lại **2 đoạn** + ⭐ **11 chuỗi** + ⭐ **7 nhãn `label`** ✅
- ⭐ `docs/dsh-mutil-session/SESSION_B/**4-CHUC-NANG-KHO.md**` — ⭐ **TÀI LIỆU MỚI** (⭐ 76 dòng ✓) ⭐ giải thích **4 chức năng kho** bằng **ngôn ngữ nghiệp vụ** (⛔ không thuật ngữ kỹ thuật) ⭐ + ⭐ **sơ đồ vị trí nút** ⭐ + ⭐ **8 ô đề xuất cho «Tạo kho»** ⭐ + ⭐ **3 điều kiện chặn xoá** ⭐ + ⭐ **3 câu hỏi cho «phiếu cấp phát»** ⭐ + ⭐ **PHẦN ANH ĐIỀN** ✅

## Bugs
| BUG | Mức | Nội dung | Trạng thái |
|---|---|---|---|
| `BUG-20261008-019` | **HIGH** | ⚠️ ⭐⭐ **Em LẪN «jargon» với «NHÃN TRẠNG THÁI CHUẨN»** ⭐⭐ — ⭐ khi dọn jargon em **xoá luôn** hằng `INVENTORY_NO_SOURCE` («**chưa có nguồn**») ⚠️ ⇒ ⭐ **TEST ĐỎ 3 LẦN LIÊN TIẾP** ⭐ (`w04:**134**` → `**149**` → `**153**` — ⭐ **3 chỗ khác nhau** ⚠️) | ⭐ **FIXED** — ⭐ **trả lại nhãn chuẩn** + ⭐ **chỉ Việt hoá phần lý do phía sau** ⇒ ⭐ `W-04` **PASS 6/6** ✅ |

## Testing
| TEST | Nội dung | Kết quả |
|---|---|---|
| `TEST-20261007-039` | Viết lại 2 «đối chứng nguồn» cho user đọc được | ⭐ **PASS** — `W-04` **6/6** · ⭐ hồi quy **`866 · 865 pass · 0 fail`** ✅ |
| `TEST-20261007-040` | Việt hoá 11 chuỗi nguồn (sau **3 lần ĐỎ** ⚠️) | ⭐ **PASS** — ⭐ đo UI: ⛔ hết `inventory[].balance` · `receipts[].acceptedQty` · `transferOrders[].status` · «payload KHÔNG trả khoá» ✅ |
| Hồi quy | `tsc` · `npm test` · `npm run build` | ✅ `tsc=0` · ⭐ **`866 · 865 pass · 0 fail`** · ✅ **BUILD ĐẠT** ✅ |

## Important Changes
⭐ ⛔ **KHÔNG commit · KHÔNG push · KHÔNG force-push** ⭐ — ⭐ **theo lệnh user** (⭐ «*không push*» · «*không commit*» ✓) ⚠️ ⭐ ⚠️ `origin/unity` **vẫn còn 2 commit cũ** của phiên 02 — ⭐ **GIỮ NGUYÊN** ✅

## Decisions
| DEC | Nội dung |
|---|---|
| ⭐ **QUY TẮC GIT MỚI (⭐ user chốt, ⭐ ĐÃ GHI NHỚ VĨNH VIỄN)** | ⭐⭐ «***không hỏi có push hay commit hay không, nếu tôi cho phép thì làm không thì đừng hỏi.***» ⭐⭐ ⇒ ⭐ **MẶC ĐỊNH = KHÔNG commit · KHÔNG push · KHÔNG force-push** ⭐ ⭐ ⛔ **không hỏi lại** ✅ |
| ⭐ **BÀI HỌC (§33) — «JARGON» ≠ «NHÃN TRẠNG THÁI CHUẨN»** | ⭐ **jargon** = *tên bảng/cột CSDL · số dòng mã nguồn · `payload`/`bootstrap`* ⇒ **XOÁ** ⭐; ⭐ **nhãn chuẩn** = *hằng số có `assert.equal(...)` trong test · quy ước toàn app* ⇒ ⭐ **GIỮ NGUYÊN** ✅<br>⭐ **QUY TRÌNH**: ⭐ trước khi sửa 1 chuỗi ⇒ ⭐ **`grep` nó trong `tests/`** ⇒ ⭐ nếu có `assert…includes(<HẰNG SỐ>)` thì ⭐ **⛔ không bỏ hằng số đó**, ⭐ chỉ đổi **phần chữ phía sau** ✅ |

## Blockers/Risks
| # | Nội dung | Mức |
|---|---|---|
| ① | 🔴 **CHẶN DUY NHẤT**: ⭐ chờ **user điền quy tắc 4 chức năng kho** (⭐ tài liệu `4-CHUC-NANG-KHO.md` ⭐ — ⭐ đã soạn sẵn **PHẦN ANH ĐIỀN** ✓) ⇒ ⭐ **4 nút vẫn TẠM KHOÁ** (`BUG-20261007-013/014/015`) ✅ | **CAO** |
| ② | ⏳ `BUG-006` + lệch RBAC `decide_approval` ⇒ **đã giao `ERP-SESSION-01`** ✅ | **CAO** |
| ③ | ⚠️ Nhiều tệp **chưa commit** (⭐ theo lệnh user ⛔ không commit ✓) ⭐ — ⭐ đã **sao lưu patch** ra ngoài repo ✅ | **THẤP** |

## Remaining Work
⭐ ① ⏳ **Chờ user điền quy tắc** 4 chức năng kho ⇒ ⭐ **viết mã ngay** ⭐ ② ⏳ Chờ `ERP-SESSION-01` sửa `BUG-006` ✅

## Next Week
⭐ **Viết mã 4 chức năng kho** (⭐ Tạo kho · Sửa kho · Xóa kho · Tạo phiếu cấp phát ✓) — ⛔ hiện **TẠM KHOÁ** ⏳ **chờ user điền quy tắc** ✅

---

# ⭐⭐ BỔ SUNG 2026-10-08 (chốt) — `TASK-231e`: XÁC MINH 2 CHIỀU + DỌN SẠCH 100% KÝ HIỆU KỸ THUẬT ⭐⭐

> ⚠️ **Nguồn (§14)**: chỉ từ `CHG-20261007-011` · `TEST-20261007-041`.

## Session
`ERP-SESSION-02`

## Period
2026-10-08

## Completed Tasks
| Task | Nội dung | Trạng thái |
|---|---|---|
| `TASK-231e` | ⭐ **Tự phát hiện lỗ hổng kiểm chứng**: sau `TEST-040` em mới đo **«ký hiệu cũ ĐÃ MẤT»** mà ⛔ **chưa đo «nhãn mới ĐÃ HIỆN»** ⚠️ ⇒ ⭐ **ĐO LẠI 2 CHIỀU** ⇒ tìm thêm **2 chỗ** rồi dọn sạch | ⭐ **DONE** — `TEST-041` **PASS** ✅ |

## UI/UX
- ⭐⭐ **ĐO 2 CHIỀU** (⭐ ⛔ không được chỉ kiểm 1 chiều ✓):<br>⭐ **Chiều 1 — nhãn tiếng Việt ĐÃ HIỆN?** ⭐✅ **8/8 `true`** ✅<br>⭐ **Chiều 2 — ký hiệu kỹ thuật CÒN không?** ⭐⭐⭐ **8/8 `false`** ⭐⭐⭐ ✅ (⭐ `inventory[].` · `receipts[].` · `issues[].` · `transferOrders[].` · `materials.` · ⭐⭐ **`payload`** ⭐⭐ · `bootstrap :` · `stockMovements` ✓) ✓
- ⭐⭐ **2 CHỖ TÌM THÊM ĐƯỢC NHỜ ĐO 2 CHIỀU** ⭐⭐: ⭐ ① ⭐ `standardPriceSource` (`WarehouseDashboard.tsx:**146**`, ⭐ **hiện** ở `:201`) ⭐ «*`materials.standardPrice × inventory[].balance` · N/M dòng*» ⇒ ⭐ «*Giá chuẩn trong danh mục vật tư (**materials**) nhân với số lượng tồn · N/M dòng*» ⚠️ **giữ từ khoá `materials`** (⭐ `w04:**144**` bắt buộc ⛔ ✓) ⭐ · ⭐ ② ⭐ note CardHead (`:243`) ⭐ «*…«0 dòng» với «cột rỗng trong **payload**»…*» ⇒ ⭐ «*…«không có dòng nào» với «cột chưa có dữ liệu»…*» ✅
- ⭐ **GHI NHẬN**: ⭐ hằng ⭐ `INVENTORY_METRICS[].source` ⭐ (⭐ chứa «*`inventory[].balance — … (bootstrap :651)`*» ✓) ⭐ **chỉ được EXPORT** (`:258`) ⭐ và **tiêu thụ bởi TEST** ⭐ — ⛔ **KHÔNG `.map()`/render** ⚠️ ⇒ ⭐ **⛔ không bao giờ hiện trên màn hình** ✅ ⇒ ⭐ **luật user ④ ⛔ không áp dụng** ⇒ ⭐ **GIỮ NGUYÊN** ✅

## Frontend
- ⭐ `app/screens/WarehouseDashboard.tsx` — ⭐ sửa **2 chuỗi** (`:146` · `:243`) ✅

## Testing
| TEST | Nội dung | Kết quả |
|---|---|---|
| `TEST-20261007-041` | ⭐ **Lấp lỗ hổng kiểm chứng — đo 2 chiều** | ⭐ **PASS** — ⭐ chiều 1: **8/8 nhãn Việt `true`** ✅ ⭐ chiều 2: **8/8 ký hiệu kỹ thuật `false`** ⭐ ⭐ hồi quy **`866 · 865 pass · 0 fail`** ✅ · `tsc=0` · `BUILD ĐẠT` ✅ |

## Important Changes
⭐ ⛔ **KHÔNG commit · KHÔNG push** — ⭐ **theo lệnh user** ✓ ⭐ ⚠️ `origin/unity` **vẫn còn 2 commit cũ** của phiên 02 ⇒ ⭐ **GIỮ NGUYÊN** (⭐ ⛔ không hỏi lại ✓) ✅

## Decisions
⭐ **BÀI HỌC (§33) — «KIỂM 1 CHIỀU = KIỂM CHƯA ĐỦ»** ⭐⭐ — ⭐ khi **thay 1 chuỗi** ⚠️ ⇒ ⭐ **PHẢI đo CẢ 2 CHIỀU**: ⭐ *cũ ĐÃ MẤT* ⭐ **VÀ** ⭐ *mới ĐÃ HIỆN* ⚠️ ⭐ ⭐ **VÌ SAO**: ⭐ nếu nhãn mới **⛔ không hiện** (⭐ lỗi render ✓) ⭐ thì test vẫn **XANH GIẢ** ⚠️ ⭐ — ⭐ và trong ca này **đo 2 chiều đã TÌM THÊM ĐƯỢC 2 CHỖ SÓT** ✅ ⭐ ⭐ **HỆ QUẢ THỰC TẾ**: ⭐ nếu chỉ kiểm 1 chiều ⭐ em đã **báo sai là «đã sạch»** trong khi còn **2 ký hiệu kỹ thuật** trên màn hình ⚠️ ✓

## Blockers/Risks
| # | Nội dung | Mức |
|---|---|---|
| ① | 🔴 **CHẶN DUY NHẤT**: ⭐ chờ **user điền quy tắc 4 chức năng kho** (⭐ tài liệu `4-CHUC-NANG-KHO.md` ✓) ⇒ ⭐ **4 nút vẫn TẠM KHOÁ** (`BUG-20261007-013/014/015`) ✅ | **CAO** |
| ② | ⏳ `BUG-006` + lệch RBAC `decide_approval` ⇒ **đã giao `ERP-SESSION-01`** ✅ | **CAO** |
| ③ | ⚠️ Nhiều tệp chưa commit (⭐ theo lệnh user ✓) ⭐ — ⭐ đã **sao lưu patch** ra ngoài repo ✅ | **THẤP** |

## Remaining Work
⭐ ① ⏳ **Chờ user điền quy tắc** 4 chức năng kho ⇒ ⭐ **viết mã ngay** ⭐ ② ⏳ Chờ `ERP-SESSION-01` sửa `BUG-006` ✅

## Next Week
⭐ **Viết mã 4 chức năng kho** (⭐ Tạo kho · Sửa kho · Xóa kho · Tạo phiếu cấp phát ✓) — ⛔ hiện **TẠM KHOÁ** ⏳ **chờ user điền quy tắc** ✅

---

# ⭐⭐ BỔ SUNG 2026-10-08 — `TASK-232`: BỎ 2 CỘT «DỮ LIỆU CHẾT» Ở «DANH MỤC NHÓM VẬT TƯ» (user chốt «C») ⭐⭐

> ⚠️ **Nguồn (§14)**: chỉ từ `BUG-20261008-020` · `CHG-20261008-012` · `DEC-20261008-012` · `TEST-20261007-042`.

## Session
`ERP-SESSION-02`

## Period
2026-10-08

## Completed Tasks
| Task | Nội dung | Trạng thái |
|---|---|---|
| `TASK-232` | ⭐ **User hỏi** «*tại sao lại có trường **Ý kiến điều chỉnh** và **trạng thái đã duyệt/đề xuất***» ⇒ ⭐ tra mã ⇒ phát hiện **2 cột là DỮ LIỆU CHẾT** ⇒ ⭐ user chốt **«C»** ⇒ ⭐ **đã bỏ** | ⭐ **DONE** — `TEST-042` **PASS** ✅ |

## UI/UX
- ⭐⭐ **PHÁT HIỆN (⭐ bằng chứng mã)**: ⭐ cột «**Trạng thái**» ⭐ và «**Ý kiến điều chỉnh**» ⭐ trong bảng «DANH MỤC NHÓM VẬT TƯ» (`app/page.tsx:**1448**`) ⭐ là **dữ liệu chết** ⚠️ ⭐:<br>⭐ ① ⭐ **Modal ⛔ KHÔNG có 2 ô đó** ⚠️ ⭐ — ⭐ `MaterialSubcategoryModal` (`:3086`) ⭐ chỉ có **4 ô**: ⭐ *Hệ M&E cha* · *Tên nhóm vật tư* · *Thứ tự hiển thị* · *Mô tả* ✓<br>⭐ ② ⭐ **Đường Java ⛔ không ghi** ⚠️ ⭐ — ⭐ chính mã Java ghi: ⭐ `MaterialCatalogStore.java:**61**` «*⇒ 3 cột kia **không bao giờ được ghi** từ đường Java*» ⭐ + ⭐ `MaterialCatalogManagementUseCase.java:**641**` «*`review_status` KHÔNG được ghi ⇒ nhận **GIÁ TRỊ MẶC ĐỊNH của CSDL = 'approved'***» ✓<br>⭐⭐ ⇒ ⭐ **«Đã duyệt» = giá trị MẶC ĐỊNH của CSDL** ⚠️ ⭐ «**Đề xuất**» = ⭐ **trường TRỐNG ⇒ UI tự gán** `\|\|"proposed"` ⚠️ ⭐ «**Ý kiến điều chỉnh**» = ⭐ **LUÔN TRỐNG** (⭐ chỉ hiện 💬 ✓) ⭐ ⭐⭐ **⇒ HIỂN THỊ GÂY HIỂU NHẦM** ⭐⭐ ✅
- ⭐⭐⭐ **LÝ DO NGHIỆP VỤ (⭐ user nêu nguyên văn)** ⭐⭐⭐: «***khi cấu hình nhóm con thì kế toán đã kiểm tra rất kỹ rồi** và **không cần ai duyệt** bởi vì **chỉ là đưa nhóm con từ danh mục vật tư gốc (file excel của công ty đang sử dụng) lên hệ thống***» ⭐ ⭐ ⇒ ⭐ **nhóm con ⛔ KHÔNG phải dữ liệu cần duyệt** — ⭐ nó chỉ là **bản sao nhóm từ file Excel công ty ĐANG DÙNG** ⭐ ⇒ ⭐ **⛔ không cần bước duyệt nào** ✅
- ⭐⭐ **ĐÃ SỬA 4 CHỖ (`app/page.tsx`)** ⭐⭐: ⭐ ① ⭐ **BỎ CỘT** `<th>Ý kiến điều chỉnh</th>` ✅ ⭐ ② ⭐ **Ô «Trạng thái»** ⇒ ⭐ chỉ còn ⭐ `Number(active)===0?"Đã ẩn":"**Đang dùng**"` ⭐ (⭐ bỏ nhánh `review_status` ✓) ⭐ ③ ⭐ **BỎ KPI «Chờ duyệt»** ⭐ (⭐ luôn vô nghĩa ✓) ⭐ ④ ⭐ **Nhãn lọc** «*Đang dùng / đề xuất*» ⇒ ⭐ «***Đang dùng***» ✅
- 🔒 **GIỮ NGUYÊN**: ⭐ ⛔ **KHÔNG xoá dữ liệu** ⚠️ — ⭐ 2 cột CSDL ⭐ `review_status` + `adjustment_note` ⭐ **vẫn còn** ⭐ ⭐ chỉ ⛔ **không hiển thị** ✅

## Testing
| TEST | Nội dung | Kết quả |
|---|---|---|
| `TEST-20261007-042` | ⭐ Đo thật tab «Danh mục nhóm vật tư» sau khi bỏ 2 cột | ⭐ **PASS** — ⭐ vào màn `true` ✅ ⭐ 4 chữ jargon `false` ✅ ⭐ header **8 cột** (⭐ trước 9 ✓) ⭐ dòng hiện **«Đang dùng»** ✅ |
| Hồi quy | `tsc` · `npm test` · `npm run build` | ✅ `tsc=0` · ⭐ **`866 · 865 pass · 0 fail`** · ✅ **BUILD ĐẠT** ✅ |

## Bugs
| BUG | Mức | Nội dung | Trạng thái |
|---|---|---|---|
| `BUG-20261008-020` | **MEDIUM** | ⚠️ 2 cột «Trạng thái» + «Ý kiến điều chỉnh» là **dữ liệu chết** — ⭐ hiển thị **gây hiểu nhầm** («Đã duyệt» ⛔ không phải ai duyệt ⚠️) | ⭐ **FIXED + VERIFIED** ✅ |

## Decisions
| DEC | Nội dung |
|---|---|
| `DEC-20261008-012` | ⭐ 3 phương án A/B/C ⭐ ⇒ ⭐ **user chốt «C»** ⭐ = ⭐ **giữ cột CSDL nhưng ⛔ không hiển thị gây hiểu nhầm** ✅ |

## Important Changes
⭐ ⛔ **KHÔNG commit · KHÔNG push** — ⭐ **theo lệnh user** ✓

## Blockers/Risks
| # | Nội dung | Mức |
|---|---|---|
| ① | 🔴 **CHẶN**: ⏳ chờ **user điền quy tắc 4 chức năng kho** (⭐ `4-CHUC-NANG-KHO.md` ✓) ⇒ ⭐ 4 nút vẫn TẠM KHOÁ ✅ | **CAO** |
| ② | ⏳ `BUG-006` + lệch RBAC `decide_approval` ⇒ **đã giao `ERP-SESSION-01`** ✅ | **CAO** |
| ③ | ⚠️ Nhiều tệp chưa commit (⭐ theo lệnh user ✓) ⭐ — ⭐ đã sao lưu patch ✅ | **THẤP** |

## Remaining Work
⭐ ① ⏳ **Chờ user điền quy tắc** 4 chức năng kho ⭐ ② ⏳ Chờ `ERP-SESSION-01` sửa `BUG-006` ✅

## Next Week
⭐ **Viết mã 4 chức năng kho** — ⛔ hiện TẠM KHOÁ ⏳ chờ user điền quy tắc ✅

---

# ⭐ BỔ SUNG 2026-10-08 — `TASK-233`: AUDIT «CỘT DỮ LIỆU CHẾT» TOÀN MÀN DANH MỤC VẬT TƯ ⭐

> ⚠️ **Nguồn (§14)**: chỉ từ `TEST-20261007-043`.

## Session
`ERP-SESSION-02` · ## Period 2026-10-08

## Completed Tasks
| Task | Nội dung | Trạng thái |
|---|---|---|
| `TASK-233` | ⭐ **Audit cùng loại lỗi** user vừa tìm ra (`BUG-20261008-020`) trên **toàn màn «Danh mục vật tư»** — câu hỏi: *còn cột nào «hiển thị nhưng ⛔ không ai ghi được» không?* | ⭐ **DONE** — `TEST-043` ✅ |

## UI/UX
- ⭐ **Phương pháp**: ⭐ ① liệt kê **cột hiển thị** ⭐ ② liệt kê **ô nhập** của modal sửa ⭐ ③ **đối chiếu từng cột** ⇒ cột nào ⛔ không có ô nhập ⇒ **nghi dữ liệu chết** ✅
- ⭐⭐ **Bảng «DANH MỤC NHÓM VẬT TƯ»** ⇒ ⚠️ **CÓ lỗi** (⭐ 2 cột `review_status`/`adjustment_note` ⛔ không ai ghi ✓) ⭐ — ⭐ **đã sửa ở `TASK-232`** ✅
- ⭐⭐⭐ **Bảng «MÃ VẬT TƯ GỐC» ⇒ ⛔ KHÔNG CÓ CỘT CHẾT** ⭐⭐⭐ — ⭐ modal `MaterialModal` (`app/page.tsx:**3101**`) ⭐ có **10 ô nhập** ⭐; ⭐ **đối chiếu 8/8 cột dữ liệu: TẤT CẢ đều có ô nhập** ✅ ⭐ (⭐ Mã ⇒ `code` · Tên ⇒ `name` · Hệ M&E ⇒ `categoryId` · Nhóm ⇒ `subcategoryId` · ĐVT ⇒ `unit` · Quy cách ⇒ `specification` · Hãng ⇒ `brand` · Tồn tối thiểu ⇒ `minStock` ✓) ✓
- ⚠️ **PHẠM VI KẾT LUẬN**: ⭐ **chỉ 2 bảng đã kiểm** ⚠️ ⭐ — ⛔ **KHÔNG suy rộng** ra các màn khác (⭐ chưa kiểm ✓) ✓
- ⭐ **Ghi nhận phụ (⛔ không phải lỗi)**: ⭐ modal có **2 ô NHẬP ⛔ không hiện thành cột** — ⭐ *Alias* (`aliasText`) ⭐ + ⭐ *Lý do đổi mã* (`codeChangeReason`) ⭐ ⇒ ⭐ là **ô nhập phụ** ✓

## Testing
| TEST | Nội dung | Kết quả |
|---|---|---|
| `TEST-20261007-043` | Audit «cột dữ liệu chết» — kết quả đầy đủ | ⭐ **PASS** — ⭐ «Mã vật tư gốc» **8/8 cột có ô nhập** ✅ |

## Decisions
⭐ **BÀI HỌC (§33)**: ⭐ ① ⭐⭐ **MỘT LỖI USER TÌM RA ⇒ PHẢI ĐI TÌM CÙNG LOẠI Ở CHỖ KHÁC** ⭐⭐ (⭐ ⛔ không sửa xong 1 ca rồi dừng ✓) ⭐ ② ⭐⭐ **KẾT QUẢ ÂM CŨNG LÀ KẾT QUẢ** ⭐⭐ (⭐ «⛔ không có cột chết» xác nhận ⛔ không phải lỗi diện rộng ✓) — ⚠️ **NHƯNG phải GHI RÕ PHẠM VI**, ⛔ không suy rộng ✅

## Blockers/Risks
| # | Nội dung | Mức |
|---|---|---|
| ① | 🔴 **CHẶN**: ⏳ chờ **user điền quy tắc 4 chức năng kho** (⭐ `4-CHUC-NANG-KHO.md` ✓) ⇒ 4 nút vẫn TẠM KHOÁ ✅ | **CAO** |
| ② | ⏳ `BUG-006` + lệch RBAC `decide_approval` ⇒ **đã giao `ERP-SESSION-01`** ✅ | **CAO** |
| ③ | ⚠️ Tệp chưa commit (⭐ theo lệnh user ✓) ⭐ — ⭐ đã sao lưu patch ✅ | **THẤP** |

## Remaining Work
⭐ ① ⏳ **Chờ user điền quy tắc** 4 chức năng kho ⭐ ② ⏳ Chờ `ERP-SESSION-01` sửa `BUG-006` ⭐ ③ *(tuỳ chọn)* mở rộng audit «cột dữ liệu chết» sang **các màn khác** — ⛔ chưa làm ✅

## Next Week
⭐ **Viết mã 4 chức năng kho** — ⛔ hiện TẠM KHOÁ ⏳ chờ user điền quy tắc ✅

### ⭐ BỔ SUNG (tiếp `TASK-233`) — `TEST-20261007-044`: AUDIT **TOÀN MÀN** «DANH MỤC VẬT TƯ» HOÀN TẤT ⭐
| ⭐ | ⭐ |
|---|---|
| **Nguồn (§14)** | ⭐ chỉ từ `TEST-20261007-044` ✓ |
| ⭐⭐ **LÝ DO LÀM TIẾP** | ⭐ `TEST-043` mới kiểm **2/3 tab** ⚠️ ⇒ ⭐⭐ **CHƯA ĐỦ để nói «màn sạch»** ⭐⭐ ⭐ — ⭐ theo bài học §33 (**audit phải đủ toàn màn** + **tìm cùng loại ở chỗ khác** ✓) ✓ |
| ⭐⭐⭐ **KẾT QUẢ TAB «DANH SÁCH VẬT TƯ»** | ⭐ **11 cột hiển thị** (– 1 cột Thao tác = **10 cột dữ liệu**) ⭐ ⭐⭐ **ĐỐI CHIẾU 10/10 — TẤT CẢ ĐỀU CÓ Ô NHẬP** ⭐⭐: ⭐ `code` · `name` · **`aliasText`** · `categoryId` · `subcategoryId` · `unit` · `specification` · `brand` · `minStock` · (Trạng thái ⇒ `set_material_status`) ✅ ⭐ ⭐⭐ **⇒ ⛔ KHÔNG có cột dữ liệu chết** ⭐⭐ ✅ |
| ⭐⭐⭐ **KẾT LUẬN TOÀN MÀN (3 TAB)** | ⭐ ① **Danh sách vật tư** ⇒ ⛔ không có cột chết ✅ ⭐ ② **Danh mục nhóm vật tư** ⇒ ⚠️ **CÓ 2 cột chết** ⇒ **ĐÃ SỬA** (`TASK-232`) ✅ ⭐ ③ **Danh mục hệ vật tư** ⇒ 5 trường CSDL có thật + modal có ô nhập ✅<br>⭐⭐⭐ **⇒ TOÀN MÀN CHỈ CÓ ĐÚNG 1 CA «CỘT DỮ LIỆU CHẾT» — ĐÃ SỬA XONG** ⭐⭐⭐ ✅ |
| ⚠️ **PHẠM VI (⭐ ghi rõ)** | ⭐ **CHỈ 3 tab màn «Danh mục vật tư»** ⚠️ ⭐ — ⛔ **KHÔNG suy rộng** ra màn khác (⭐ chưa kiểm ✓) ✓ |
| ⭐⭐ **BÀI HỌC (§33) BỔ SUNG** | ⭐ ① ⭐⭐ **AUDIT PHẢI ĐỦ *TOÀN MÀN*, ⛔ KHÔNG DỪNG Ở TAB ĐẦU TIÊN** ⭐⭐ ⭐ ② ⭐⭐ **LUÔN GHI RÕ *PHẠM VI* KẾT LUẬN** ⭐⭐ — ⭐ câu đúng là «**màn X sạch**», ⛔ KHÔNG phải «**hệ thống sạch**» ✅ |
| **TRUY VẾT** | ⭐ `TEST-20261007-044` · `TEST-20261007-043` · `TASK-232` · `TASK-233` ✓ |

---

# ⭐⭐⭐ BỔ SUNG 2026-10-08 — `TASK-234`: QUY TẮC SINH MÃ KHO / TÊN KHO (USER CHỐT) ⭐⭐⭐

> ⚠️ **Nguồn (§14)**: chỉ từ `DEC-20261008-013` · `CHG-20261008-013` · `TEST-20261008-045` · `TEST-20261008-046`.

## Session / Period
`ERP-SESSION-02` · 2026-10-08

## Completed Tasks
| Task | Nội dung | Trạng thái |
|---|---|---|
| `TASK-234` | ⭐ **User chốt 4 quy tắc nghiệp vụ kho** + ⭐ làm rõ **3 điểm** ⭐ ⇒ ⭐ phiên 02 **làm ngay phần thuộc phạm vi mình** (`lib/warehouse-hub.ts`) | ⭐ **DONE (phần phiên 02)** — `TEST-045` + `TEST-046` ✅ |

## Decisions
⭐⭐⭐ **`DEC-20261008-013` — QUY TẮC 4 CHỨC NĂNG KHO (⭐ trích NGUYÊN VĂN user)** ⭐⭐⭐
| # | Quy tắc |
|---|---|
| ① | **Tạo kho khi LẬP DỰ ÁN** — hỏi «Có tạo kho không?» ⇒ **CÓ**: hiện «**Đang tạo kho…**» + tạo với **tên kho · mã kho · tên dự án** (⛔ chưa cần thủ kho) · **KHÔNG**: tạo sau bằng tay · **Mặc định có 1 kho Tổng** |
| ② | **Sửa kho: có PHÂN QUYỀN** + ⭐ **cho sửa MÃ KHO** |
| ③ | **⛔ KHÔNG XOÁ** — chỉ **ẩn** / **ngừng hoạt động** + **khi DỰ ÁN ngừng thì HỎI user** có ngừng kho không |
| ④ | Chỉ đổi tồn khi phiếu **HOÀN THÀNH** · khi **tạo/chờ duyệt** ⇒ số lượng ở **trạng thái ĐANG XỬ LÝ** ⇒ ⛔ user khác không thao tác được — *cadivi 1.5 tồn 100 − xuất 70 ⇒ người khác ⛔ không xuất quá 30* |
| ⭐ **3 điểm làm rõ** | ⭐ **mã kho = `KD-xxx`** (⛔ không trùng) ⭐ + ⭐ **cho phép sửa CSDL** ⭐ · ⭐ **bộ quyền module KHO** (tham khảo module khác, ⛔ không tự quyết thì báo cáo ✓) · ⭐ **tên kho = `KHO <tên dự án>`** ✅ |

## Frontend
⭐ `lib/warehouse-hub.ts` ⭐ (**+4 hàm mới, ⛔ không sửa hàm có sẵn**): ⭐ `WAREHOUSE_CODE_PREFIX = "KD-"` ⭐ · ⭐ `nextWarehouseCode()` ⭐ · ⭐ `projectWarehouseName()` ⭐ · ⭐ `validateWarehouseCode()` ⭐ · ⭐ `validateProjectWarehouseName()` ✅
⭐ **QUYẾT ĐỊNH KỸ THUẬT**: ⭐ `nextWarehouseCode` dùng **`max + 1`** ⛔ **không «lấp lỗ»** ⚠️ ⭐ VÌ ⭐ nếu tái dùng số của kho đã ngừng ⇒ ⭐ **chứng từ cũ trỏ NHẦM sang kho mới** ⚠️ ⭐ (⭐ user yêu cầu «⛔ không được trùng» ✓) ✓
⭐ **`validateWarehouseCode` có tham số `currentCode`** ⭐ — ⭐ **BỎ QUA CHÍNH NÓ khi SỬA** ⚠️ ⭐ (⭐ nếu ⛔ không thì sửa-kho-mà-giữ-mã sẽ bị báo «trùng» SAI ✓) ✓

## Testing
| TEST | Nội dung | Kết quả |
|---|---|---|
| `TEST-20261008-045` | 7 ca: sinh mã `KD-xxx` + tên kho | ⭐ **PASS** |
| `TEST-20261008-046` | 6 ca: kiểm mã khi TẠO/SỬA + kiểm tên | ⭐ **PASS** — ⭐ **`currentCode` bỏ qua chính nó** chứng minh bằng test ✅ |
| | **TỔNG** | ⭐⭐ **13/13 PASS** ⭐⭐ |
| Hồi quy | `npm test` · `tsc` | ✅ **`884 tests · 883 pass · 0 fail`** · ✅ `tsc=0` ✅ |

## Bugs
| BUG | Mức | Nội dung | Trạng thái |
|---|---|---|---|
| ⭐ **Lỗi của chính phiên 02** | **MEDIUM** | ⚠️ Thêm 2 hàm mới nhưng ⛔ **quên thêm vào `import` của test** ⇒ ⭐ **5 test ĐỎ** ⚠️ ⭐ ⚠️ `tsc=0` ⛔ **không bắt được** (⭐ vì `lib` import `.ts` trong test `.mjs` ✓) | ⭐ **FIXED** — bổ sung import ⇒ **13/13** ✅ ⭐ **BÀI HỌC**: *thêm hàm mới ⇒ PHẢI kiểm `import` của test* |

## Blockers/Risks
| # | Nội dung | Mức |
|---|---|---|
| ① | 🔴 **CHẶN — CẢ 4 CHỨC NĂNG CHẠM VÙNG PHIÊN KHÁC** ⚠️: ⭐ `page.tsx` + `java-backend` ⇒ **S01** (`HANDOFF-009` ✓) ⭐ · ⭐ `ProjectEntityModal.tsx` ⇒ **S03** (`HANDOFF-010` ✓) ⭐ ⭐ ⇒ ⭐ **§7: phiên 02 ⛔ không tự sửa** ✅ | **CAO** |
| ② | ⏳ **CHỜ USER** xác nhận **2 điều về quyền**: ⭐ ① dùng module `central_warehouse` cho cả 3 action? ⭐ ② cho phiên 02 sửa `java-backend` hay để S01? | **CAO** |
| ③ | ⏳ `BUG-006` + lệch RBAC `decide_approval` ⇒ **đã giao `ERP-SESSION-01`** | **CAO** |
| ④ | ℹ️ ⭐ **PHÁT HIỆN**: ⭐ module KHO **đã có sẵn 4** (`central_warehouse` · `warehouse_issue` · `warehouse_receipt` · `inventory`) ⇒ ⛔ **không cần tạo module mới** ✅ | **THẤP** |

## Remaining Work
⭐ ① ⏳ Chờ **S01** API + modal (`HANDOFF-009`) ⭐ ② ⏳ Chờ **S03** UI hỏi khi lập dự án (`HANDOFF-010`) ⭐ ③ ⏳ Chờ **user** xác nhận 2 điều về quyền ⭐ ④ ⭐ **Phiên 02 sẵn sàng**: 4 hàm quy tắc đã xong + test 13/13 ✅

## Next Week
⭐ Nối 4 hàm quy tắc vào modal «Tạo/Sửa kho» + bật lại 4 nút đang TẠM KHOÁ ✅

---

# ⭐⭐⭐ BỔ SUNG 2026-10-08 — `TASK-235` + `TASK-236`: MODAL KHO + LOGIC «GIỮ CHỖ» ⭐⭐⭐

> ⚠️ **Nguồn (§14)**: chỉ từ `CHG-20261008-014/015` · `TEST-20261007-047` · `TEST-20261008-048`.

## Session / Period
`ERP-SESSION-02` · 2026-10-08

## Completed Tasks
| Task | Nội dung | Trạng thái |
|---|---|---|
| `TASK-235` | ⭐ **Dựng modal «Tạo/Sửa kho»** thành **component dùng chung** (§17) ⇒ S01 chỉ cần **import + nối** ⛔ không phải tự viết | ⭐ **DONE** — `TEST-047` 6/6 ✅ |
| `TASK-236` | ⭐ **Logic «giữ chỗ»** (quy tắc ④) ⇒ `availableToIssue` + `validateIssueQuantity` + 3 hằng trạng thái | ⭐ **DONE** — `TEST-048` 7/7 ✅ |

## UI/UX
- ⭐ `app/screens/WarehouseFormModal.tsx` ⭐ — ⭐ dùng ⭐ `BaseModal` ⭐ từ ⭐ `@/lib/ui-blocks` ⭐ (**đúng mẫu có sẵn** — `HrProfileEditModal`/`BenefitsScreen`… ✓) ⭐ ⭐ **§17 REUSE đạt** ⭐ ✅ ⭐ 3 ô: ⭐ Dự án · ⭐ Mã kho (⭐ tự sinh `KD-xxx` ✓) · ⭐ Tên kho (⭐ tự đặt `KHO <dự án>` ✓) ⭐ + ⭐ 2 cờ quyền `canEdit`/`canEditCode` ⭐ + ⛔ **KHÔNG có xoá kho** (⭐ quy tắc ③ ✓) ✅
- ⭐ **Quy tắc ④ — «giữ chỗ»**: ⭐ `availableToIssue(100, 70) === 30` ⭐ — ⭐ **đúng ví dụ nguyên văn của user** (⭐ «*cadivi 1.5 tồn 100 − phiếu xuất 70 (đang xử lý)*» ✓) ⭐ + ⭐ `validateIssueQuantity(31, 100, 70).ok === false` (⭐ ⛔ chặn xuất quá ✓) ✅

## Frontend
- ⭐ `lib/warehouse-hub.ts` ⭐ — ⭐ **tổng cộng 10 hàm/hằng mới** ở 3 task (⭐ 234/235/236 ✓) ⭐ ⚠️ **thuần THÊM**, ⛔ không sửa hàm có sẵn ✅
- ⭐ `app/screens/WarehouseFormModal.tsx` ⭐ (⭐ mới ✓) ✅

## Testing
| TEST | Nội dung | Kết quả |
|---|---|---|
| `TEST-20261007-047` | Modal kho — 6 ca cấu trúc | ⭐ **PASS 6/6** |
| `TEST-20261008-048` | Quy tắc ④ giữ chỗ — 7 ca | ⭐ **PASS 7/7** ⭐ (⭐ có ca dùng **đúng ví dụ user** ✓) |
| | **TỔNG 3 task** | ⭐ **13 + 6 + 7 = 26 ca PASS** ⭐ |
| Hồi quy | `tsc` · `npm run lint` · `npm test` | ✅ `tsc=0` · ✅ lint **0 errors** · ✅ **`908 tests · 907 pass · 0 fail`** ✅ |

## Bugs
| BUG | Mức | Nội dung | Trạng thái |
|---|---|---|---|
| ⭐ **Lỗi của chính phiên 02** | **MEDIUM** | ⚠️ ① ⭐ **ESLint CẤM `any`** — ⭐ viết `Record<string, any>` ⇒ 2 lỗi lint ⚠️ mà ⭐⭐ **`tsc=0` ⛔ KHÔNG bắt được** ⭐⭐ · ② ⭐ **Test dò CHỮ quá thô** ⇒ ⭐ khớp **chú thích + chuỗi `note`** ⇒ **ĐỎ OAN** ⚠️ · ③ ⚠️ **Cắt chuỗi bằng PowerShell** ⇒ **cắt cụt mất dấu `/`** cuối regex ⇒ **Parse error** | ⭐ **FIXED cả 3** — ⭐ + ghi **3 bài học §33** ✅ |

## Decisions
⭐⭐ **3 BÀI HỌC MỚI (§33)** ⭐⭐:
① ⭐⭐ **`tsc=0` ⛔ KHÔNG đủ** ⭐⭐ — ⭐ **ESLint bắt được lỗi `any`** mà `tsc` ⛔ bỏ qua ⇒ ⭐ **PHẢI chạy `npm run lint`** ✅
② ⭐⭐ **TEST DÒ CHỮ LÀ QUÁ THÔ** ⭐⭐ — ⭐ phải **bỏ chú thích** + ⭐ **kiểm Ô NHẬP/phần tử**, ⛔ không kiểm chữ ⚠️ ✅
③ ⭐⭐ **CHẠY ĐÚNG SCRIPT DỰ ÁN** ⭐⭐ — ⭐ ⛔ **không tự chế lệnh** (⭐ `npx eslint .` thiếu `--ignore-pattern dist` ⇒ ⭐ **báo 4 lỗi GIẢ trong `dist/`** ⚠️) ✅

## Blockers/Risks
| # | Nội dung | Mức |
|---|---|---|
| ① | 🔴 **CẢ 4 CHỨC NĂNG CHẠM VÙNG PHIÊN KHÁC** ⚠️: ⭐ `page.tsx` + `java-backend` ⇒ **S01** (`HANDOFF-009` ✓) ⭐ · ⭐ `ProjectEntityModal.tsx` ⇒ **S03** (`HANDOFF-010` ✓) ⭐ ⇒ ⭐ **§7: phiên 02 ⛔ không tự sửa** ✅ | **CAO** |
| ② | ⏳ **CHỜ USER** xác nhận **2 điều về quyền** ⭐ (⭐ module `central_warehouse` cho 3 action? ⭐ cho phiên 02 sửa `java-backend`? ✓) | **CAO** |
| ③ | ⏳ `BUG-006` + lệch RBAC `decide_approval` ⇒ **đã giao `ERP-SESSION-01`** | **CAO** |
| ④ | ℹ️ ⭐ **Phần LOGIC của phiên 02 ĐÃ XONG HẾT** ⭐ — ⭐ 26 ca test PASS ⭐ ⇒ ⭐ **chỉ còn chờ nối** ✅ | **THẤP** |

## Remaining Work
⭐ ① ⏳ Chờ **S01** nối modal + API + ghi `stock_reservations` cho phiếu xuất (`HANDOFF-009`) ⭐ ② ⏳ Chờ **S03** hỏi khi lập dự án (`HANDOFF-010`) ⭐ ③ ⏳ Chờ **user** xác nhận 2 điều về quyền ⭐ ④ ⭐ **Phiên 02**: bật lại 4 nút TẠM KHOÁ khi backend sẵn sàng ✅

## Next Week
⭐ Nối 10 hàm quy tắc vào modal + bật 4 nút ✅

### ⭐⭐ BỔ SUNG (tiếp) — `TASK-237`: HOÀN TẤT **CẢ 4 QUY TẮC KHO** (phần logic phiên 02) ⭐⭐

> ⚠️ **Nguồn (§14)**: chỉ từ `CHG-20261008-016` · `TEST-20261008-049` · `EVT-20261008-050`.

| ⭐ | ⭐ |
|---|---|
| **Completed Tasks** | ⭐ `TASK-237` — ⭐ quy tắc ③ phần còn lại: ⭐ **«dự án ngừng ⇒ HỎI user có ngừng kho không»** ⭐ ⇒ ⭐ **DONE** ✅ |
| **UI/UX** | ⭐ `projectDeactivationPrompt(project, warehouses)` ⭐ trả ⭐ `{ shouldAsk, warehouses, message }` ⭐ ⭐⭐ **⛔ KHÔNG side-effect** ⭐⭐ — ⭐ đúng lời user «*không thì **kệ***» ⇒ ⭐ **hệ thống ⛔ không tự ngừng kho** ✅ ⭐ + ⭐ `ALLOW_DELETE_WAREHOUSE = false` ⭐ + ⭐ 2 hành động `hide`/`deactivate` với nhãn «*Ẩn kho*»/«*Ngừng hoạt động*» ✅ |
| **Frontend** | ⭐ `lib/warehouse-hub.ts` ⭐ — ⭐ **TỔNG 4 TASK = 16 hàm/hằng mới** ⭐ (⭐ 234: 5 ⭐ 235: modal ⭐ 236: 6 ⭐ 237: 4 ✓) ⭐ ⚠️ **thuần THÊM** ✅ |
| **Testing** | ⭐ `TEST-20261008-049` ⭐ **7/7 PASS** ⭐ ✅ ⭐⭐ **TỔNG 4 TASK: 13 + 6 + 7 + 7 = 33 ca PASS** ⭐⭐ ⭐ **Hồi quy `915 tests · 914 pass · 0 fail`** ✅ ⭐ lint **0 errors** ✅ |
| **Bugs** | ⭐ **Lỗi nhỏ của phiên 02** ⚠️: ⭐ tên test bị **mojibake** UTF-8 ⚠️ ⇒ ⭐ **đã sửa** ✅ ⭐ ⭐ **BÀI HỌC**: ⭐ ghi tiếng Việt qua công cụ `write` ⭐ **đúng encoding**, ⛔ hạn chế ghép chuỗi qua PowerShell ✅ |
| ⭐⭐ **Decisions** | ⭐⭐ **HOÀN TẤT CẢ 4 QUY TẮC — phần logic thuộc phiên 02 ĐÃ XONG 100%** ⭐⭐ ⭐ ① `KD-xxx` + `KHO <dự án>` ⭐ ② sửa + kiểm mã (`currentCode`) ⭐ ③ ⛔ không xoá + hỏi khi dự án ngừng ⭐ ④ giữ chỗ (⭐ ví dụ user `100−70=30` ✓) ✅ |
| **Blockers/Risks** | ⭐ ① 🔴 **CHẶN**: ⭐ `page.tsx` + `java-backend` ⇒ **S01** (`HANDOFF-009`) ⭐ · ⭐ `ProjectEntityModal.tsx` ⇒ **S03** (`HANDOFF-010`) ⇒ ⭐ **§7: phiên 02 ⛔ không tự sửa** ⭐ **CAO** ⭐ ② ⏳ **CHỜ USER** xác nhận **2 điều về quyền** ⭐ **CAO** ⭐ ③ ⏳ `BUG-006` + RBAC `decide_approval` ⇒ **S01** ⭐ **CAO** ✅ |
| **Remaining Work** | ⭐ ⏳ Chờ **S01** nối modal + API + `stock_reservations` ⭐ ⏳ Chờ **S03** hỏi khi lập dự án ⭐ ⏳ Chờ **user** xác nhận quyền ⭐ ⭐ **sau đó: phiên 02 BẬT 4 nút TẠM KHOÁ** ✅ |

### ⭐⭐ BỔ SUNG (tiếp) — `TASK-239`: BẢN VÁ QUYỀN MODULE KHO + TRẢ LỜI CÂU ① CỦA USER ⭐⭐

> ⚠️ **Nguồn (§14)**: chỉ từ `DEC-20261008-014` · `HANDOFF-20261008-009` (bổ sung) · `BAN-VA-QUYEN-KHO.md`.

| ⭐ | ⭐ |
|---|---|
| **Completed Tasks** | ⭐ `TASK-239` — ⭐ đo nguồn định nghĩa quyền + **viết sẵn bản vá** cho S01 dán ⭐ ⇒ ⭐ **DONE** ✅ |
| ⭐⭐⭐ **KẾT LUẬN ĐO ĐƯỢC (⭐ trả lời câu ① của user)** | ⭐ ⭐ **module KHO ĐÃ CÓ SẴN 3** ⭐ ⭐ — ⭐ đo từ `V3__reference_seed.sql` ⭐: ⭐ `central_warehouse` (⭐ «Kho Tổng & mã vật tư gốc» · `sort_order=405` ✓) ⭐ `warehouse_receipt` (⭐ «Nhập kho» · 51 ✓) ⭐ `warehouse_issue` (⭐ «Xuất kho» · 52 ✓) ⭐ + ⭐ nhóm menu ⭐ `group_key = 'warehouse'` = ⭐ **«KHO VẬT TƯ»** ⭐ ⭐ ⇒ ⭐ **⛔ KHÔNG cần tạo module mới · ⛔ KHÔNG cần thêm dòng CSDL** ✅ |
| ⭐⭐⭐ **PHÁT HIỆN LỚN — ⚠️ «SỬA DB» ⛔ KHÔNG ĐỦ** | ⭐ Quyền **MODULE** ⭐ = ⭐ **DỮ LIỆU CSDL** ⭐ (`module_catalog` ⭐ đọc bởi `ModulePermissionStore` ✓) ⚠️ ⭐ ⭐⭐ **NHƯNG quyền ACTION = JAVA** ⭐⭐ (`ActionRbacRegistry` — ánh xạ `action → module` + `action → cờ canCreate/canEdit/…` ✓) ⚠️ ⭐ ⇒ ⭐ user cho phép «*sửa db thì cứ làm*» ⭐ **⛔ KHÔNG đủ** ⚠️ ⭐ ⭐ **HỆ QUẢ**: ⭐ 3 action mới ⭐ **BẮT BUỘC sửa `java-backend`** ⭐ = ⭐ **vùng S01** ⇒ ⭐ **câu hỏi ② vẫn cần user trả lời** ✅ |
| **Decisions** | ⭐ `DEC-20261008-014` ⭐ — ⭐ **CHỐT được (⭐ ⛔ không cần báo cáo thêm)**: ⭐ 3 action dùng ⭐ **`central_warehouse`** ⭐ (⭐ `create_warehouse`→`canCreate` ⭐ `update_warehouse`→`canEdit` ⭐ `set_warehouse_status`→`canEdit` ✓) ⭐ ⭐ **LÝ DO**: ⭐ kho Tổng + kho dự án **cùng bảng** + **cùng nhóm menu** ⇒ **cùng thao tác quản lý** ✅ ⭐ ⛔ **QUYẾT ĐỊNH ÂM**: ⭐ **⛔ KHÔNG khai `delete_warehouse`** ⭐ ✅ |
| **Frontend/Backend** | ⭐ **BẢN VÁ SẴN** ⭐ `docs/dsh-mutil-session/SESSION_B/**BAN-VA-QUYEN-KHO.md**` ⭐ — ⭐ **6 dòng Java** (⭐ 3 map action→module ⭐ + 3 map action→cờ ✓) ⭐ ⇒ ⭐ S01 **chỉ việc DÁN** ⛔ không phải tự viết ✅ |
| **Testing** | ⭐ Hồi quy sau cùng: ⭐ **`919 tests · 918 pass · 0 fail`** ⭐ `tsc=0` ⭐ lint **0 errors** ✅ |
| **Blockers/Risks** | ⭐ ① 🔴 **CHỜ USER** câu ② (⭐ cho phiên 02 sửa Java hay để S01 ✓) + ⭐ ③ (⭐ 12 mã kho cũ ✓) ⭐ **CAO** ⭐ ② ⏳ **CHỜ S01** 5 việc (`HANDOFF-009`) ⭐ ③ ⏳ **CHỜ S03** 1 việc (`HANDOFF-010`) ⭐ **CAO** ✅ |
| **Remaining Work** | ⭐ ⏳ Chờ user ②③ ⭐ ⏳ Chờ S01 dán bản vá + nối modal + API ⭐ ⏳ Chờ S03 ⭐ ⭐ **sau đó: phiên 02 BẬT 4 nút TẠM KHOÁ** ✅ |

### ⭐⭐⭐ BỔ SUNG (tiếp) — `TASK-240` + `TASK-241`: BẬT 3 NÚT KHO + KIỂM ĐẦU-CUỐI ⭐⭐⭐

> ⚠️ **Nguồn (§14)**: chỉ từ `CHG-20261008-017` · `TEST-20261008-053` · `TEST-20261008-054`.

| ⭐ | ⭐ |
|---|---|
| **Completed Tasks** | ⭐ `TASK-240` — ⭐ **bật 3 nút kho** ⭐ (⭐ `ERP-SESSION-01` đã thi hành `HANDOFF-009` ✓) ⭐ · ⭐ `TASK-241` — ⭐ **kiểm đầu-cuối E2E** ⭐ ⇒ ⭐ **DONE** ✅ |
| ⭐⭐⭐ **UI/UX — ⭐ ĐÃ BẬT NÚT** | ⭐ `app/screens/Inventory.tsx` ⭐: ⭐ ① ⭐ **«＋ Tạo kho»** ⭐ `disabled` ⇒ ⭐ **BẬT** ⭐ `data-vntech="open-warehouse"` ✅ ⭐ ② ⭐ **«✎ Sửa»** ⭐ ⇒ ⭐ `disabled={!selectedWhId}` ⭐ (⭐ khoá chỉ khi **chưa chọn kho** — đúng thiết kế ✓) ✅ ⭐ ③ ⭐⭐ **«🗑 Xóa» ⇒ «⏹ Ngừng hoạt động»** ⭐⭐ ⛔ **BỎ `delete_warehouse`** ⭐ ⇒ ⭐ gọi ⭐ `action("set_warehouse_status", { warehouseId, active: false })` ⭐ ⭐ = ⭐ **đúng quy tắc ③ user chốt** ✅ ⭐ ④ ⭐ **«＋ Tạo phiếu cấp phát»** ⭐ **giữ khoá** ⚠️ (⭐ chưa có modal `allocate` ✓) ✅ |
| ⭐⭐⭐ **KIỂM ĐẦU-CUỐI E2E — ⭐ BẰNG CHỨNG MẠNH NHẤT** | ⭐ Bấm «＋ Tạo kho» trên `:9000` ⭐ ⇒ ⭐ **MODAL MỞ THẬT** ⭐: ⭐ `coOverlay=**true**` ⭐ `tieuDe=«**Tạo kho**»` ⭐ ⭐ **`coOHap=["projectId","code","name"]`** ⭐ (⭐ **ĐÚNG 3 Ô** = ⭐ **quy tắc ①** ✓) ⭐ `coNutQuyTac=true` ⭐ `nut=["×","Huỷ","Tạo kho →"]` ⭐ ⭐⭐ **`giaTriMaKho="KD-001"`** ⭐⭐ ⇒ ⭐ **`nextWarehouseCode()` CHẠY THẬT TRÊN UI** ⭐ ⭐ + ⭐ đóng «Huỷ» ⇒ ⭐ `overlay=**false**` ✅ ⭐ ⭐ **⇒ CHUỖI: nút → `open("warehouse")` → `page.tsx:801` → `WarehouseFormModal` → mã tự sinh `KD-001`** ✅ |
| **Testing** | ⭐ `TEST-053` ⭐ đo DOM 4 nút ⭐ ⇒ ⭐ **`conNutXoa = 0`** ✅ ⭐ **nút «TẠM KHOÁ» = `[]`** ✅ ⭐ · ⭐ `TEST-054` ⭐ **E2E PASS** ✅ ⭐ Hồi quy ⭐ **`947 · 946 pass · 0 fail`** ⭐ ✅ |
| ⭐⭐ **Bugs** | ⭐ **`BUG-20261008-021`** ⭐ **CAO** ⚠️: ⭐ `app/page.tsx:**2875**` ⭐ `react-hooks/set-state-in-effect` ⭐ ⇒ ⭐ **CHẶN `npm test`** ⚠️ (⭐ `npm test = lint && …` ✓) ⭐ ⭐ **⛔ KHÔNG PHẢI CỦA PHIÊN 02** ⭐ (⭐ thay đổi của phiên 02 trên `page.tsx` **chỉ 1 dòng ở L741** ⭐ vs ⭐ lỗi ở **L2875** ✓) ⭐ ⇒ ⭐ **vùng `ERP-SESSION-01`** (⭐ màn **ADMIN «Phân quyền người dùng»** ✓) ⭐ ⇒ ⭐ **BÁO CÁO, ⛔ KHÔNG TỰ SỬA** (`§20` ✓) ✅ |
| ⭐⭐⭐ **3 BÀI HỌC MỚI (§33)** | ⭐ ① ⭐⭐ **SỬA MÃ XONG MÀ ⛔ KHÔNG BUILD ⇒ ⛔ KHÔNG THẤY GÌ ĐỔI** ⭐⭐ (⭐ `:8787` phục vụ bản cũ ⚠️) ⭐ ② ⭐⭐ **`disabled = false` ⛔ KHÔNG PHẢI «NÚT HOẠT ĐỘNG»** ⭐⭐ — ⭐ phải **BẤM THẬT + ĐO KẾT QUẢ** ✅ ⭐ ③ ⭐⭐ **`0 errors` HÔM QUA ⛔ KHÔNG ĐẢM BẢO `0 errors` HÔM NAY** ⭐⭐ — ⭐ nhiều phiên cùng sửa ⇒ ⭐ **PHẢI chạy hồi quy NGAY TRƯỚC khi báo cáo** ✅ |
| **Blockers/Risks** | ⭐ ① ⚠️ **`npm test` bị chặn** bởi `BUG-20261008-021` (⭐ của S01 ✓) ⭐ **CAO** ⭐ ② ⏳ **CHỜ USER** câu ②③ ⭐ ③ ⏳ **CHỜ S01** modal `allocate` + `stock_reservations` ⭐ ④ ⏳ **CHỜ S03** ✅ |
| **Remaining Work** | ⭐ ⏳ Chờ user ②③ ⭐ ⏳ S01: modal `allocate` → ⭐ **rồi phiên 02 bật nút cuối cùng** ⭐ ⏳ S03: hỏi khi lập dự án ✅ |
