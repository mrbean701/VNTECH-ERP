# BUG_HOTFIX_LOG — SESSION_A (ERP-SESSION-01)

> Phien: **ERP-SESSION-01** · Timezone Asia/Ho_Chi_Minh (UTC+7) · Pham vi: **PHAN QUYEN + BAO LOI + MUA HANG/GIAO NHAN**
> ⭐ **CACH DOC**: moi bug 1 entry · ⚠️ bug do CHINH TOI gay ra duoc ghi ro ⛔ khong che giau · ⛔ khong danh `VERIFIED` neu chua co nguoi xac nhan (§24)

---

## BUG-20261006-001

Date: 2026-10-06
Session: ERP-SESSION-01
Module: Quan tri
Feature: Bang bao loi (buoc 14)
Severity: HIGH
Source: USER_TEST
Problem: Danh sach bao loi **RONG voi MOI tai khoan** — ke ca admin.
Impact: KHONG xem duoc bao loi nao ⇒ khong the xu ly su co nguoi dung bao.
Root Cause: `ErrorReportAdminPanel` doc `res?.reports` tu `submit(...)` — nhung `action()` trong `app/page.tsx` **KHONG tra payload** (tra `undefined` khi thanh cong ⇒ ⭐ chinh nha da ghi canh bao o `page.tsx:318-319`). ⇒ `res?.reports` luon `undefined`.
Fix: Doi prop thanh `submit={requestApi}` (`requestApi` CO tra JSON va NEM LOI khi HTTP khong OK).
Files Changed:
- app/page.tsx (buoc 14: `<ErrorReportAdminPanel data={data} submit={requestApi} />`)
Test: TEST-20261006-002
Regression: PASS (`npm test` 802/0)
Verification: ⭐ **USER XAC NHAN BANG MAT**: «da hien thi bao loi»
Status: VERIFIED
Related Task: TASK-20261006-002
Related Change: CHG-20261006-001

---

## BUG-20261006-002

Date: 2026-10-06
Session: ERP-SESSION-01
Module: Quan tri
Feature: Dropdown «Nhom chuc nang» trong modal Bao loi
Severity: MEDIUM
Source: USER_TEST
Problem: Dropdown «Nhom chuc nang» **KHONG hien gi ca** (rong).
Impact: Khong chon duoc nhom chuc nang khi bao loi.
Root Cause: Bo loc `String(m.active ?? 1) === "1"` — nhung bootstrap tra ve **boolean `true`** (⛔ khong phai so 1). ⇒ Moi dong deu bi loai.
Fix: Doi sang ham `dangHoatDong = (v) => v === true || String(v ?? 1) === "1" || String(v) === "true"`.
Files Changed:
- app/screens/ErrorReportAdminPanel.tsx
- app/screens/ErrorReportModal.tsx
Test: TEST-20261006-003
Regression: PASS
Verification: ⭐ DO THAT: bo loc CU = **0/76 muc** · bo loc MOI = **75 muc** (tru `admin`, do bootstrap `moduleCatalog` co 76 dong `active: true`)
Status: FIXED
Related Task: TASK-20261006-003
Related Change: CHG-20261006-002

---

## BUG-20261006-003

Date: 2026-10-06
Session: ERP-SESSION-01
Module: Phan quyen nguoi dung
Feature: Cap quyen cho user
Severity: HIGH
Source: USER_TEST
Problem: Modal **KHONG cap them duoc quyen cho user** neu so luong quyen do **LON HON** so quyen da cap cho PHONG BAN cua user do.
Impact: Khong the cap quyen rieng cho tung nguoi ⇒ chan nghiep vu.
Root Cause: Chot `assertDepartmentAllowsPermissions(targetUserId, target, payload)` (chot `P5.3`) tai `UserManagementUseCase.java:266` chan moi quyen VUOT phong ban.
Fix: Comment bo chot `P5.3` (⛔ KHONG xoa — de lai dau vet). GIU NGUYEN guard payload rong o dong ~274 (MOC 111). Phai viet lai bai test vi no khang dinh chinh hanh vi cu.
Files Changed:
- java-backend/application/src/main/java/com/vntech/erp/application/service/UserManagementUseCase.java
- java-backend/web/src/test/java/com/vntech/erp/web/controller/AdminGovernanceIntegrationTest.java (doi ten thanh `phanQuyenPhongBan_capVuotQuyenChoNguoiDung_KHONGConChan` + `expectRejected` → `ok` + khang dinh quyen da ghi)
Test: TEST-20261006-004
Regression: PASS (`mvn -o test` 156/156)
Verification: Da TRIEN KHAI (JAR 06/10 12:50:20) — ⚠️ cho user xac nhan bang mat
Status: FIXED
Related Task: TASK-20261006-004
Related Change: CHG-20261006-003

---

## BUG-20261006-004

Date: 2026-10-06
Session: ERP-SESSION-01
Module: Phan quyen phong ban (AD-08)
Feature: Nut «Luu thay doi»
Severity: HIGH
Source: USER_TEST
Problem: Tab «Phan quyen phong ban» **bao loi khi luu** — luon hien «Da luu **0/N** chuc nang».
Impact: ⚠️ Nguoi dung TUONG la luu that bai ⇒ bam lai nhieu lan / bo di. ⭐ **THUC TE DU LIEU VAN DUOC LUU THAT** — loi nam o **CAU THONG BAO**, ⛔ khong phai o viec ghi.
Root Cause: `if (await action("save_department_permission", …)) ok++;` — ⚠️ nhung `action()` **KHONG tra payload** ⇒ `ok` **LUON = 0** ⇒ cau thong bao luon «Da luu 0/N».
Fix: Dung `requestApi` + `try/catch` TUNG chuc nang (mot chuc nang loi ⛔ khong chan cac chuc nang con lai) + dem them `that` (that bai) + hien ro trong thong bao.
Files Changed:
- app/page.tsx (ham `save()`)
Test: TEST-20261006-005
Regression: PASS
Verification: ⭐ Da chung minh chuoi dac trung co trong bundle dang phuc vu tren `:8787` VA `:9000`
Status: FIXED
Related Task: TASK-20261006-005
Related Change: CHG-20261006-004

---

## BUG-20261006-005

Date: 2026-10-06
Session: ERP-SESSION-01
Module: Phan quyen phong ban (AD-08)
Feature: Chon nhanh
Severity: MEDIUM
Source: USER_TEST
Problem: (1) Tab **KHONG co nut «Chon tat ca»** / «Bo chon tat ca». (2) **Nut tick chon CA DONG khong hoat dong**.
Impact: Phai tick tung o mot khi cap quyen nhieu chuc nang ⇒ rat cham.
Root Cause: Tab chi co 4 nut chon theo NHOM (`selectGroup`), ⛔ khong co cot «Ca dong» va ⛔ khong co nut chon tat ca.
Fix: Them `FULL_CAPS` · `selectAll` · `setRowAll` · `rowState` · `allRowsFull`; them nut «Chon tat ca» (co trang thai indeterminate); them cot `{ key: "crow" }` «Ca dong».
Files Changed:
- app/page.tsx (3 helper + nut + cot)
Test: TEST-20261006-005
Regression: PASS
Verification: Da chung minh trong bundle (`⏳ Đang lưu`, `Ca dong`, `crow`, aria `Chon ca dong cho tat ca chuc nang`)
Status: FIXED
Related Task: TASK-20261006-005
Related Change: CHG-20261006-004

---

## BUG-20261006-006

Date: 2026-10-06
Session: ERP-SESSION-01
Module: Quan tri
Feature: Kiem quyen mo tab (buoc 14)
Severity: HIGH
Source: USER_TEST
Problem: ⚠️⚠️ **LOI DO CHINH PHIEN NAY GAY RA**. User bao: «tab Bao loi **van chua hien thi thong tin**» — ⭐ **SAU KHI** da va BUG-20261006-001. Tai khoan `admin` **KHONG MO DUOC** tab Bao loi.
Impact: ⭐ **Chan hoan toan** tinh nang bao loi voi tai khoan quan tri cao nhat.
Root Cause: Ban va dau tien («BUG-B») khoa nut buoc 14 bang `hasAdminTab(data, "admin")` — ham nay **CHI doc `allModulePermissions`** ⚠️ NHUNG tai khoan `admin` co **0 DONG QUYEN MODULE** (⭐ DO THAT: `so_dong_quyen = 0` · `allModulePermissions` cua chinh admin = 0) ⇒ `hasAdminTab` tra **FALSE** ⇒ **NUT BI KHOA VINH VIEN**. ⭐ VI SAO API VAN CHAY: `RbacService` **LOAI TRU vai tro `admin`** khoi kiem module (goi that `error_reports` bang admin ⇒ HTTP 200 · 18 bao cao) NHUNG UI thi ⛔ khong biet ⇒ **UI CHAT HON API**.
Fix: `isAdminUser(data.user) || hasAdminTab(data, "admin")` — dung helper CO SAN CUA NHA (`lib/permissions.ts:13`: `user.role === "admin" || roleBase(user) === "admin"`), da import o `page.tsx:51`, chinh nha cung dung no trong `modulePermission` (`lib/permissions.ts:16`).
Files Changed:
- app/page.tsx (dong ~2689 — `coQuyenBaoLoi`)
Test: TEST-20261006-006
Regression: PASS (`npm test` 802/0 · build EXIT=0 · cong UI 3/3)
Verification: ⭐ **USER XAC NHAN BANG MAT** (cung lan voi BUG-001)
Status: VERIFIED
Related Task: TASK-20261006-006
Related Change: CHG-20261006-005
⭐ BAI HOC: **`hasAdminTab` ⛔ KHONG thay the duoc `isAdminUser`** — kiem quyen module **PHAI LUON tinh ca vai tro `admin`** (vi admin di NGOAI qua `RbacService`).

---

## BUG-20261006-007 (F2)

Date: 2026-10-06
Session: ERP-SESSION-01
Module: Mua hang / Giao nhan
Feature: Nhan hang theo PO
Severity: HIGH (loi WORKFLOW)
Source: INTERNAL_TEST
Problem: `receive_goods` **KHONG kiem trang thai PO** ⇒ co the NHAN HANG tren PO **CHUA duoc phat hanh** ⇒ sai quy trinh mua hang.
Impact: Ton kho va cong no bi ghi sai quy trinh; PO chua duyet van giao/nhan duoc.
Root Cause: ⭐ **DOC TU NGAN XEP LOI THAT** (⭐ sau **3 LAN DOAN SAI** — xem DECISION_LOG): `java-backend/web/src/**test**/resources/schema-h2.sql` **THIEU 3 cot** (`decision_reason` · `decided_by` · `decided_at`) ma MySQL that DA CO (do migration `V18__wf_b2_po_decision.sql`) ⇒ `approve_po` **KHONG chay duoc trong bai test** (`JdbcSQLSyntaxErrorException: Column "decision_reason" not found` tai `PurchaseStoreAdapter.decidePo:268`) ⇒ cac bai test phai **DI VONG** — goi thang `receive_goods` tren PO chua phat hanh ⇒ **vo tinh MA HOA chinh hanh vi cua loi F2**.
Fix: (1) Them 3 cot vao schema test (neo phai gom `delivery_queued_at`+`delivery_completed_at` vi `contract_id`+`boq_version_id`+`PRIMARY KEY` trung **7 cho**). (2) Them cong chan trong `PurchaseManagementUseCase.receiveGoods` — ⛔ KHONG dat trong `findPoForReceiving` vi co **3 noi goi**, `decidePo` CAN `pending_approval`. (3) `StockChainIntegrationTest`: them `approve_po`. (4) `SupplyChainEndToEndIntegrationTest`: them `approve_po` + khang dinh `waiting_delivery`.
Files Changed:
- java-backend/web/src/test/resources/schema-h2.sql
- java-backend/application/.../PurchaseManagementUseCase.java
- java-backend/web/src/test/.../StockChainIntegrationTest.java
- java-backend/web/src/test/.../SupplyChainEndToEndIntegrationTest.java
Test: TEST-20261006-007
Regression: PASS (`mvn -o test` 156/156)
Verification: ⭐ **KIEM CHUNG RUNTIME**: goi THAT `receive_goods` voi PO `PO-PRJ-DEMO-01-2026-0006` (`pending_approval`) ⇒ **HTTP 400 + dung thong diep moi**; ⭐ **DOI CHUNG**: `status` KHONG doi · `so_GRN` KHONG tang ⇒ cong chan DA NGAN viec ghi.
Status: VERIFIED
Related Task: TASK-20261006-007
Related Change: CHG-20261006-006
⭐ BAI HOC: **`mvn -o test` 156/156 ⛔ KHONG chung minh SQL chay duoc** (H2 de tinh hon MySQL) · ⭐ **mot tep schema co the co NHIEU BAN** (`main/` vs `test/`) ⇒ phai xac dinh ban NAO dang duoc dung TRUOC khi sua.

---

## BUG-20261005-005

Date: 2026-10-05 → 2026-10-06
Session: ERP-SESSION-01
Module: Kho / Van chuyen
Feature: Nhan hang tu Kho Tong (DON TRANSIT)
Severity: HIGH (du lieu ket)
Source: INTERNAL_TEST
Problem: **5 phieu `central_returns` ket o trang thai `in_transit`** — khong nhan duoc hang.
Impact: Hang nam o kho Transit khong nhap duoc; so kho lech.
Root Cause: Guard tai `StockManagementUseCase:925`: «So lieu Transit vat ly/Contract khong du; dung nhan de tranh sai ton» chan viec nhan. ⭐ **GOC SAU HON** (ghi o `WarehouseStockStoreAdapter:893`): ban xuat TRUOC khi va **chi ghi `stock_movements`** ma **KHONG ghi `contract_stock_ledger`**.
Fix: Ghi bu **10 dong** `contract_stock_ledger` (5 × −qty tai kho nguon `WH_84200d27…` · 5 × +qty tai `WH-TRANSIT`). Co bang sao luu `backup_csl_20261006` (**150 dong**).
Files Changed:
- (Du lieu) `contract_stock_ledger` · `central_returns` — ⛔ KHONG sua ma nguon
Test: TEST-20261006-008
Regression: PASS
Verification: ⭐ `central_returns.in_transit` 5→**0** · `transfer_orders.in_transit` **0** · so kho (ledger) 96→**101** · xuat hien `CENTRAL_RETURN_RECEIVE = **5**` ⇒ ca 5 phieu DA NHAN DUOC
Status: VERIFIED
Related Task: TASK-20261006-008
Related Change: CHG-20261006-007
⚠️ GHI CHU: ⭐ `reconcileContractStock` **chi doi chieu (write=false)** — ⛔ KHONG sua so kho (⭐ khang dinh truoc do cua toi la SAI, da dinh chinh).

---

## BUG-20261007-001

Date: 2026-10-06 → 2026-10-07
Session: ERP-SESSION-01
Module: Phan quyen phong ban (AD-08)
Feature: Nut «Luu thay doi» + «Chon tat ca»
Severity: HIGH (**CHAN NGUOI DUNG** — §21 muc 4)
Source: USER_TEST
Problem: ⭐ User bao nguyen van: «tab phan quyen phong ban khi bam **chon tat ca** -> bam **luu** thi nut luu hien trang thai **dang luu** nhung **doi rat lau khong thay phan hoi**».
Impact: ⭐ **Dong nghia voi HONG DU LIEU**: user tuong treo ⇒ **roi trang** ⇒ ⚠️ du lieu luu **DO DANG** (⭐ do that: **55/61 module luu duoc roi DUNG**, 6 module con nguyen quyen CU).
Root Cause: (1) ⭐ MOT loi goi `save_department_permission` mat **11,50 GIAY** (do that tren `:9000`) — vi backend chay `syncDepartmentUsers` (`UserManagementUseCase.java:632`) **sau MOI lan luu** ⇒ lap qua **27 tai khoan dang hoat dong** × `replaceDepartmentDefaults` (:484) lap qua **61 module** ⇒ ~**1.647 luot truy van+ghi cho MOT lan luu**. (2) «Chon tat ca» = **61 module** ⇒ vong lap frontend goi **TUAN TU 61 lan** ⇒ 61 × 11,5s ≈ **701 giay ≈ 11,7 PHUT**. (3) ⛔ **KHONG co TIEN DO** ⇒ nut chi hien «Dang luu…» ⇒ **trong nhu TREO**.
⭐ BANG CHUNG CSDL (phong `ORG-BGD` · code `BGD` · «Ban giam doc»): `updated_at` chay **13:33:19.122 → 13:40:09.404 (~7 phut)** roi **DUNG GIUA CHUNG** ⇒ **55/61 module DA luu** · ⚠️ **6 module CHUA** (`dept_plan_contracts` · `dept_plan_price_data` · `dept_plan_suppliers` · `dept_plan_supply` · `payments` · `supplier_catalog` — van giu `updated_at = 2026-09-18 00:57:49.455`). 📐 Mẫu số đúng: `module_catalog` co **76 module dang bat** · BGD co **61** ⇒ **15 module ⛔ khong thuoc pham vi phong ban**.
Fix: ⭐ ✅ **DA SUA XONG (lan thu 5)** — ⭐ **CACH DUNG**: ⭐ **DUNG CHINH `ok + that` LAM SO DEM TIEN DO** ⚠️ ⇒ ⭐ **⛔ KHONG them bien dem moi** · ⭐ **⛔ KHONG doi cau truc vong lap** (⛔ khong `for (let i…)` · ⛔ khong `.entries()` · ⛔ khong `Promise.all`) ✓ — ⭐ **vi BAN GOC da dung `ok++`/`that++` trong `for...of` VA QUA DUOC LINT** ✓ · ⭐ ⚠️ **4 lan truoc deu DO** vi **doi cau truc** hoac **them bien moi** ✓
Files Changed:
- app/page.tsx — ham `save()` (⭐ them `setMsg('⏳ Đang lưu …')`) + ham `deleteSelected()` (⭐ them `setDeleteMsg('⏳ Đang xoá …')`)
Test: TEST-20261006-011
Regression: PASS — ⭐ `npm test` **EXIT=0 · pass 802 · fail 0 · 0 errors** · ⭐ `npm run build` **EXIT=0** · ⭐ cong UI **3/3** `KET LUAN: BAN CHAY DUNG BAN DA BUILD MOI NHAAT` ✓
Verification: ⭐ ⭐ **DA CHUNG MINH**: bundle `page-By2laz6E.js` — ⭐ **CA `:8787` VA `:9000` deu CO 2 chuoi tien do** (`⏳ Đang lưu ` ✅ · `⏳ Đang xoá ` ✅) · ⭐ van tay **DAT** `VNTECH-FP-2CD0794B7DD154F2` ✓ · ⚠️ **cho user nghiem thu bang mat** ⇒ chuyen `VERIFIED` ✓
Status: ⭐ **`FIXED`** (⭐ ⛔ **CHUA `VERIFIED`** — ⭐ cho user xac nhan)
Related Task: TASK-20261007-001
Related Change: CHG-20261006-011
⭐ BAI HOC (⭐ QUAN TRONG NHAT PHIEN): ⚠️ **LAN SUA DAU TIEN CUA TOI DA XOA MAT dong khai bao `let ok = 0, that = 0, loiDau = "";` cua `deleteSelected()`** ⇒ no **gan vao bien cua `save()`** ⇒ ESLint bao **DUNG**: «**Cannot reassign variables declared outside of the component/hook**». ⭐ **TOI MAT 4 VONG** vi ⛔ **khong kiem dong khai bao con hay mat**. ⇒ ⭐ **LUAT: khi `edit` thay mot KHOI DAI ⇒ PHAI giu lai MOI dong khai bao** ✓
⭐ VA: **MOT loi goi API 11,5 giay = dau hieu backend lam viec NANG GAP BOI** ⇒ phai **DO thoi gian 1 loi goi** TRUOC khi doan «treo» hay «loi» ✓
⚠️ **CON LAI (⭐ GOC CHUA SUA)**: ⭐ suy giam **11,5 giay/loi goi** van con ⚠️ — ⭐ **phai sua o BACKEND**: ⭐ bo `syncDepartmentUsers` khoi **moi** lan luu, ⭐ **chi dong bo 1 LAN O CUOI** ⇒ ⭐ **11,5 giay → ~1 giay** ✓ (⭐ xem HANDOFF-20261006-005)

---

## TONG KET BUG

| Severity | So luong | Ma |
|---|---|---|
| HIGH / CRITICAL | 6 | -001 · -003 · -004 · -006 · -007(F2) · -20261007-001 |
| MEDIUM | 2 | -002 · -005 |
| (du lieu ket) | 1 | -20261005-005 |

| Status | So luong |
|---|---|
| **VERIFIED** (user/kiem chung xac nhan) | 4 |
| **FIXED** (cho user nghiem thu) | 4 |
| **OPEN** | 0 |
| **DONE** (dot du lieu) | 1 |

> ⭐ **TONG**: **9 bug** — ⭐ **4 VERIFIED** · ⭐ **4 FIXED** · ⭐ **0 OPEN** · ⭐ **1 DONE**
> ⭐ ⭐ **CAP NHAT 2026-10-06**: ⭐ **`BUG-20261007-001` `OPEN` → `FIXED`** ✓ (⭐ **lan sua thu 5** — ⭐ **dung chinh `ok + that` lam so dem TIEN DO** ⚠️ · ⛔ khong them bien moi · ⛔ khong doi cau truc vong lap) ⇒ ⭐ `npm test` **802/0 · 0 errors** · ⭐ build **EXIT=0** · ⭐ cong UI **3/3** · ⭐ **CA `:8787` VA `:9000` co `⏳ Đang lưu ` + `⏳ Đang xoá `** ✓
> ⚠️ ⭐ **2 bug do CHINH PHIEN NAY gay ra** va da sua: `BUG-20261006-006` (khoa nut oan) · ⭐ va **loi ESLint** trong qua trinh sua `BUG-20261007-001` ✓

---

# ✅ **KẾT QUẢ CUỐI — `BUG-20261007-001` ĐÃ GIẢI QUYẾT TRIỆT ĐỂ** (06/10/2026 · §11 «TASK COMPLETION LOGGING»)

## 📊 **SỐ ĐO CUỐI — ĐÃ TRIỂN KHAI + ĐÃ ĐO THẬT** (⭐ qua `:9000`)
| ⭐ Chế độ | ⭐ TRƯỚC | ⭐ **SAU** | ⭐ Cải thiện |
|---|---|---|---|
| ⭐ **`syncNow=false`** (⭐ trung gian) | ⭐ 11,50 giây | ⭐ ⭐ **0,03 – 0,05 GIÂY** | ⭐ **NHANH HƠN ~230 LẦN** ⚡ |
| ⭐ `syncNow=true` (⭐ mặc định) | ⭐ 11,50 giây | ⭐ **5,73 giây** | ⭐ **vẫn đồng bộ** ✓ |
| ⭐ ⭐ **«CHỌN TẤT CẢ» 61 MODULE** | ⭐ ⭐ **~11,7 PHÚT** | ⭐ ⭐ **~8,7 GIÂY** | ⭐ ⭐ **NHANH HƠN ~80 LẦN** 🚀 |

## 🔎 **ROOT CAUSE (⭐ §9 — ĐO THẬT, ⛔ không suy đoán)**
⭐ `syncDepartmentUsers` (`UserManagementUseCase.java:632`) chạy **SAU MỖI lần lưu 1 module** ⚠️:
- ⭐ lặp qua **27 tài khoản đang hoạt động** ✓
- ⭐ mỗi tài khoản ⇒ `replaceDepartmentDefaults` (:484) ⭐ lặp qua **61 module** ✓
⇒ ⭐ ⭐ **~1.647 LƯỢT TRUY VẤN+GHI CHO MỘT LẦN LƯU** ⚠️
⇒ ⭐ «Chọn tất cả» = **61 module** ⇒ FE gọi **TUẦN TỰ 61 lần** ⇒ ⭐ **~100.000 LƯỢT** ⇒ ⭐ **~701 giây ≈ 11,7 PHÚT** ✓
⚠️ ⭐ **VÀ** ⛔ **không có tiến độ** ⇒ ⭐ user **tưởng TREO nên RỜI TRANG** ⚠️
📍 **BẰNG CHỨNG CSDL** (phòng `ORG-BGD`): ⭐ `updated_at` chạy **13:33:19 → 13:40:09** (**~7 phút**) rồi **DỪNG GIỮA CHỪNG** ⚠️ ⇒ ⭐ **55/61 module ĐÃ lưu** · ⚠️ **6 module ⛔ CHƯA** ⇒ ⭐ ⭐ **HỎNG DỮ LIỆU THẬT** (⭐ ⛔ không chỉ là vấn đề UI) ✓

## ✅ **CÁCH SỬA — 2 TẦNG, ⛔ KHÔNG ĐỔI HÀNH VI MẶC ĐỊNH** (§41 «nhỏ · an toàn · hoàn nguyên được»)
| ⭐ Tầng | ⭐ Thay đổi |
|---|---|
| ⭐ **Backend** | ⭐ `UserManagementUseCase.saveDepartmentPermission` (dòng ~591): ⭐ thêm cờ **TÙY CHỌN** `syncNow` — ⭐ `boolean dongBoNgay = !"false".equalsIgnoreCase(trim(payload.get("syncNow")));` ⇒ ⭐ **thiếu cờ ⇒ VẪN ĐỒNG BỘ** ✓ |
| ⭐ **Frontend** | ⭐ `app/page.tsx` hàm `save()` + `deleteSelected()`: ⭐ `const dongBoNgay = moduleKey === changed[changed.length - 1];` ⭐ + `setMsg('⏳ Đang lưu ' + (ok+that) + '/' + changed.length + ' …')` ⇒ ⭐ **chỉ module CUỐI đồng bộ + HIỆN TIẾN ĐỘ** ✓ |
⇒ ⭐ **61 lần đồng bộ → 1 lần** ✓ · ⭐ **⛔ KHÔNG phá lời gọi nào hiện có** (⭐ `AdminGovernanceIntegrationTest` gọi **không kèm `syncNow`** ⇒ ⭐ vẫn đồng bộ ✓)

## 🧪 **TEST + TRIỂN KHAI** (§24: ⭐ `FIXED` = CODE + TEST)
| ⭐ | ⭐ |
|---|---|
| ⭐ `npm test` | ✅ **EXIT=0 · pass 802 · fail 0 · 0 errors** ✓ |
| ⭐ `mvn -o test` | ✅ **EXIT=0** ✓ |
| ⭐ `npm run build` | ✅ **EXIT=0** · ⭐ cổng UI **3/3** ✓ |
| ⭐ **Triển khai Java** | ✅ ⭐ **BUILD EXIT=0 · CHỈ 4 GIÂY** ⇒ ⭐ **JAR mới 86,8 MB · 06/10 15:07:06** ⇒ ⭐ `:18081` **PID 3456** (401 = sống) ✓ |
| ⭐ **Chuỗi tiến độ trong bundle** | ✅ ⭐ **CẢ `:8787` VÀ `:9000`** đều có `⏳ Đang lưu ` + `⏳ Đang xoá ` ✓ |

## ⚠️ **RỦI RO ĐÃ BIẾT (⭐ ghi rõ, ⛔ không che)**
1. ⭐ Nếu **lời gọi CUỐI bị lỗi** ⇒ ⭐ **⛔ không có lần đồng bộ nào** ⚠️ ⇒ ⭐ **bấm Lưu lại** (⭐ hàm **idempotent** — chạy lại vô hại ✓)
2. ⭐ **Sửa này ⛔ KHÔNG giảm chi phí của MỘT lần đồng bộ** ⚠️ — ⭐ nó chỉ **giảm SỐ LẦN đồng bộ** (⭐ 61 → 1 ✓)
3. ⭐ **`deleteSelected()`** ⭐ **đã sửa cùng khuôn** ✓

## 📌 **BÀI HỌC (⭐ §9)**
1. ⭐ ⭐ **MỘT lời gọi API 11,5 giây = dấu hiệu backend làm việc NẶNG GẤP BỘI** ⚠️ ⇒ ⭐ **PHẢI ĐO thời gian 1 lời gọi** TRƯỚC khi đoán «treo» hay «lỗi» ✓
2. ⭐ **THIẾU TIẾN ĐỘ ⇒ user RỜI TRANG ⇒ dữ liệu lưu DỞ DANG** ⚠️ — ⭐ **đó là HỎNG DỮ LIỆU THẬT**, ⛔ không chỉ là vấn đề UI ✓
3. ⭐ ⭐ **Khi `edit` thay một KHỐI DÀI ⇒ PHẢI GIỮ LẠI MỌI DÒNG KHAI BÁO** ⚠️ — ⭐ tôi mất **4 vòng** vì ⛔ xoá mất dòng `let ok = 0, that = 0, loiDau = "";` ✓
4. ⭐ ⭐ **Thời gian build NÓI LÊN nguyên nhân lỗi**: ⭐ **1 GIÂY = sai thư mục** (⛔ không có POM) · ⭐ **~1 PHÚT = JAR bị khoá** (⚠️ `repackage` không rename được) ✓
5. ⭐ ⭐ **Cổng trống ⛔ KHÔNG có nghĩa là JAR đã nhả khoá** ⚠️ — ⭐ phải **kiểm bằng PHÉP THỬ RENAME** ✓ (⭐ đã đo: ⭐ **mất ~2 giây** nữa ✓)

---

## ## 🚨 BUG-20261007-002 — **[CRITICAL]** ⭐ MỞ MENU «KHO VẬT TƯ» ⭐ **KHÔNG MỞ ĐƯỢC PHIẾU NHẬP KHO / XUẤT KHO**
| ⭐ | ⭐ |
|---|---|
| **SESSION** | ⭐ `ERP-SESSION-01` |
| **SEVERITY** | ⭐⭐⭐ **CRITICAL** 🚨 (⭐ **CHẶN TOÀN BỘ LUỒNG MUA HÀNG** ⭐ ⭐ **GRN ⇔ nhập kho ⇔ cấp phát ⇔ hoàn trả ⇔ STO** ⭐) |
| **SOURCE** | ⭐ **phát hiện bằng plugin `nuphus-mcp`** ⭐ ⭐ khi anh hỏi «plugin test frontend được không» |
| **BẰNG CHỨNG ĐO ĐƯỢC (DOM thật)** | ⭐⭐ bấm `[data-nav-group="warehouse"] .nav-child` (nhãn đúng: **«Kho vật tư»**) ⇒ ⭐ `h1` = **«Kho Tổng»** ⭐ ⭐ ⛔ `role=tab` = **0** ⭐ ⭐ ⛔ `.project-scope-tabs` = **0** ⭐ ⭐ ⛔ nút «Tạo phiếu…» = **0** ⭐ ⭐ ⇒ ⭐⭐ **`tabBar` + `<Inventory>` KHÔNG BAO GIỜ RENDER** ⭐⭐ |
| | ⭐ `data-vntech` quan sát được = **chỉ** `reports-summary-menu` · `kpi-summary-menu` · `open-error-report-fab` ⇒ ⭐ **không có** `inventory-tabs` / `warehouse-io-tab` / `wd-tab-*` |
| | ⭐ CSDL (`module_catalog`, `active=1`) ⭐⭐ **CÓ** ⭐ `warehouse_receipt` «Nhập kho» (sort 10) ⭐ ⭐ **VÀ** ⭐ `warehouse_issue` «Xuất kho» (sort 20) ⭐⭐ ⇒ ⭐⭐ **CSDL có · MENU KHÔNG** ⭐⭐ |
| **⭐⭐ ROOT CAUSE — ĐÃ CHỨNG MINH 100%** 🚨 | ⭐⭐⭐ **`app/page.tsx:509`** ⭐⭐⭐<br>`moduleKey: viewable ?? item.permissionKeys[0]`<br>⭐⭐ Dòng này lấy **`moduleKey` = KHOÁ QUYỀN ĐẦU TIÊN** ⭐ ⭐ ⛔ **KHÔNG phải MÀN ĐÍCH** ⚠️<br>⭐ `lib/menu-helpers.ts:171` ⇒ `permissionKeys[0] = "central_warehouse"`<br>⭐⭐ ⇒ ⭐⭐ **`activateModule("central_warehouse")`** ⭐⭐ ⭐ ⭐ **⇒ màn «KHO TỔNG»** ⭐ ⭐⭐ ⭐ ⭐ **ĐÚNG NHÁNH `page.tsx:5465 active === "central_warehouse"`** ⭐⭐ ✓ |
| **⭐⭐ BẰNG CHỨNG KHÉP LẠI** | ⭐ ⭐ Nút menu có `data-nav-icon="warehouse"` ⭐ ⭐ ⭐ **KHÔNG phải `"inventory"`** ⭐⭐ ⇒ ⭐⭐ `item.moduleKey` = `"central_warehouse"` ⭐⭐ ⭐ ⭐ **khớp chính xác dự đoán ở dòng 509** ⭐⭐ ✓ ⭐ ⭐ **Mọi nhánh khác đã loại trừ bằng phép thử** ⭐ ⭐ (① bundle cũ ② quyền ③ thứ tự render ④ lỗi thao tác của tôi) |
| **⭐ PHÁP THỬ CUỐI (⭐⭐ đã chạy ⭐⭐ xem `EVT` kế)** | ⭐⭐⭐ Bấm nút «Xem ngay ›» ⭐ ⭐ **`navigate("inventory")`** ⭐ ⭐ (⭐ `page.tsx:1080` ⭐ `target:"inventory"` ✓ ⭐ **KHÔNG qua menu** ✓) ⭐ ⇒ ⭐⭐ **MÀN CHUYỂN** ⭐⭐ ⇒ ⭐⭐⭐ **click `trusted` CỦA TÔI HOẠT ĐỘNG BÌNH THƯỜNG** ⭐⭐⭐ ⭐ ⭐ **⇒ loại trừ 100% giả thuyết «tôi bấm sai»** ⭐ ⭐ ⇒ ⭐⭐ **BUG THẬT TRONG CODE** ⭐⭐ |
| **⭐ ĐÃ LOẠI TRỪ (4 giả thuyết, ⭐ mỗi cái có phép thử)** | ⭐ ① **bundle cũ** ⛔ — `dist` build **17:22** > sửa code **13:26** ✓ ⭐ ② **thiếu quyền** ⛔ — admin `role='admin'` ⇒ `lib/permissions.ts:16` trả `canView=true` mọi khoá ✓ ⭐ ③ **thứ tự render** ⛔ — `page.tsx:721` 3 nhánh RIÊNG BIỆT @4960/@5361/@5465, không chồng lấn ✓ ⭐ ④ **⭐⭐ LỖI THAO TÁC CỦA TÔI** ⛔ ⭐ — ⭐⭐ đã thử lại bằng `browser_click trusted:true` (⭐ **CDP event thật, có user-activation** ✓) ⭐ với đúng thứ tự: ⭐ mở sidebar ⇒ mở nhóm `warehouse` ⇒ bấm CON «Kho vật tư» ⇒ ⭐⭐ **KẾT QUẢ VẪN `h1` = «Tổng quan điều hành»** ⭐⭐ ⇒ ⭐⭐ **KHÔNG PHẢI do tôi bấm sai** ⚠️ |
| **⭐⭐ SAI LẦM ĐÃ SỬA (⚠️ ghi lại để không lặp lại)** | ⭐ ⭐ Tôi từng kết luận «đang ở màn Báo cáo» dựa trên `data-vntech="reports-summary-menu"` — ⭐ ⭐ **SAI** ⭐ ⭐ đó là ⭐ **marker MENU SIDEBAR** (`page.tsx:682`, `groupKey==="reports"`) ⭐ ⭐ ⛔ **không phải** dấu hiệu màn đang mở ✓ ⭐ (⭐ đã đánh đổi `sidebar-collapsed` bằng JS `click()` ⇒ đổi nhầm màn ⚠️) |
| **⛔ PHÂN VAI (RỦI RO XUNG ĐỘT)** | ⭐ ⭐ **`lib/menu-helpers.ts` + `app/page.tsx` + `app/screens/Inventory.tsx` thuộc `ERP-SESSION-02`** ⚠️ ⭐ ⭐ ⇒ ⭐⭐ **ERP-SESSION-01 KHÔNG ĐƯỢC TỰ SỬA** (§7) ⭐ ⭐ ⇒ ⭐⭐ **VIẾT HANDOFF** ⭐⭐ (`HANDOFF-20261007-001`) |
| **ẢNH HƯỞNG** | ⭐ ⭐ **bước 6 + 7 + 8 + 9 của kịch bản E2E anh yêu cầu** ⭐ (⭐ **GRN · cấp phát tổ đội · hoàn trả · STO**) ⭐ ⭐ ⛔ **KHÔNG CHẠY ĐƯỢC** ⚠️ — ⭐⭐ **CẬP NHẬT: bước 6 ĐÃ mở được ✓ (xem STATUS) · bước 7+8 bị chặn bởi `BUG-20261007-003`** ⭐⭐ |
| ⭐⭐⭐ **BUG-20261007-003 [CRITICAL] — BƯỚC 7+8 E2E BỊ CHẶN (⛔ KHÔNG PHẢI LỖI CODE)** 🚨 | ⭐⭐⭐ Nút **«＋ Tạo phiếu cấp phát»** ⭐ (`Inventory.tsx:393`) ⭐ và ⭐ **«＋ Tạo phiếu hoàn trả»** ⭐ (`:394`) ⭐ ⭐⭐ **GỌI `open("allocate")` / `open("return")`** ⭐ ⭐⭐ ⭐⭐⭐ ⭐ **ĐO `page.tsx`: 40 modal (`detail`·`po`·`receipt`·`issue`·`return`·`transfer`·`count`·…) ⛔ KHÔNG CÓ `"allocate"`** ⭐⭐⭐ ⇒ ⭐⭐⭐ **BẤM KHÔNG MỞ ĐƯỢC GÌ** ⭐⭐⭐ (⭐ đo: `.overlay`=0 · `.modal`=0 · nút **không disabled** ✓ ⇒ `onClick` chạy nhưng modal không tồn tại ⚠️ ⭐ đã thử lại sau khi chọn dự án `E2E-DA-01` ✓ vẫn vậy ✓) ⭐⭐ 🚨<br>⭐⭐⭐ **⛔ ĐÂY KHÔNG PHẢI BUG MÀ LÀ QUYẾT ĐỊNH ĐÃ ĐƯỢC CHẤP NHẬN CỦA `ERP-SESSION-02`** ⭐⭐⭐ — ⭐ `app/screens/AllocateReturn.tsx:5-6` ⭐ ⭐ ⭐ **NGUYÊN VĂN TRONG MÃ:** ⭐ ⭐⭐ «⚠️ Logic nghiệp vụ + workflow + quyền sẽ triển khai **SAU khi business rule được xác định** ⇒ hiện tại **CHỈ triển khai cấu trúc UI/list/tab/data foundation**. ⛔ Không tự suy diễn nghiệp vụ (§14)» ⭐ ⭐⭐ ⭐ ⭐ ⭐ ⇒ ⭐⭐⭐ **ERP-SESSION-01 ⛔ KHÔNG TỰ THÊM MODAL CẤP PHÁT/HOÀN TRẢ** (§14 + §7 ⭐ `Inventory.tsx` thuộc phiên 02) ⭐⭐ ⭐ ⭐ **⇒ BƯỚC 7+8 CẦN `BUSINESS RULE` TỪ USER TRƯỚC KHI LÀM** ⭐⭐ ⭐ ⚠️ |
| ⭐⭐ **⭐ SỬA LỖI ĐO CỦA TÔI (§22)** | ⭐⭐⭐ Tôi từng kết luận «3 bảng CHỒNG LÊN NHAU» ⭐ ⭐ ⭐ **SAI** ⭐⭐ ⭐ — ⭐⭐ nguyên nhân: `document.querySelectorAll('main thead th')` ⭐⭐ gom `thead` **của CẢ 3 BẢNG** ⭐⭐ ⭐ ⭐ ⭐ **CHỤP ẢNH ĐÃ BÁC BỎ** ⭐⭐ (`docs/dsh-state/bug003-allocate-3tables.png`) ⭐⭐ ⇒ 3 bảng xếp **DỌC** đúng thiết kế ✓ ⭐⭐ |
| ⭐⭐ **BẰNG CHỨNG MÀN NÀY CHẠY ĐÚNG** | ⭐⭐ **ẢNH `bug003-allocate-3tables.png` soi bằng mắt ✓** ⭐⭐ ⭐ ① dải tab `[KHO][XUẤT & NHẬP][CẤP PHÁT & HOÀN TRẢ]` (tab 3 đang chọn) ✓ ② **4 thẻ KPI**: Tồn kho đang **48** · Chờ nhận **0** · Chờ xuất **9** · Cảnh báo tồn thấp **0** ✓ ③ sub-tab **[Cấp phát][Hoàn trả]** ✓ ④ **9 phiếu cấp phát** thuộc bộ lọc ⭐ ⭐ `PX-E2E-DA-01-2026-0002` **GRN_CREATED** · `-0003` **PENDING_CHT** · `-0004…-0010` **HOÀN THÀNH** ⭐⭐ ⭐ **⇒ LUỒNG E2E ĐÃ CÓ DỮ LIỆU THẬT TỪ TRƯỚC** ✓ ⭐ ⑤ bảng **「LUÂN CHUYỂN VẬT TƯ DƯ DỰ ÁN → KHO」** — `KT-RET-PRJ-2026-0017…0003` **CHỜ PHÊ DUYỆT** · `-0012/-0011/-0010/-0009` **ĐÃ NHẬN** ⭐⭐ ⭐ **⇒ BƯỚC 8 (HOÀN TRẢ) CÓ DỮ LIỆU** ✓ ⑥ bảng **「Phiếu điều chuyển đang xử lý」** ⭐⭐ `TRF-2026-00008` **KHO-E2E-01 → TD-E2E-DA-01-E2E-TD02** **CHỜ DUYỆT** · `TRF-2026-00007` **→ TD01** **ĐÃ NHẬN** ⭐⭐ ⭐ **⇒ BƯỚC 9 (STO) CÓ DỮ LIỆU** ✓ ⭐⭐ |
| ⭐⭐ **⇒ KẾT LUẬN E2E** | ⭐⭐⭐ **BƯỚC 6 (GRN) = FIXED + mở được ✓** ⭐⭐ ⭐ **BƯỚC 7/8/9 (cấp phát · hoàn trả · STO) ⭐⭐ CHƯA THỂ TẠO MỚI** ⭐⭐⭐ (⭐ nút tạo không có modal ⭐ — xem dòng trên) ⭐⭐ **NHƯNG ⭐⭐ DỮ LIỆU THẬT CHO CẢ 3 BƯỚC ĐÃ TỒN TẠI & HIỂN THỊ ĐÚNG** ⭐⭐ ⇒ ⭐⭐ **CÓ THỂ VERIFY LUỒNG BẰNG CÁCH ĐỌC PHIẾU THẬT** ⭐ ⭐ ⭐ (⭐ `e2e.*` users + approval catalog 5 bước đã đo sẵn ✓) ⭐⭐ |
| ⭐⭐ **LỖI UI NHỎ PHÁT HIỆN THÊM (UI)** | ⭐ `Inventory.tsx:399` ⭐ `<strong className="link">{row.issueNo}</strong>` ⭐⭐ **CÓ `class="link"` (giao diện như link) ⭐ ⛔ NHƯNG KHÔNG CÓ `onClick`** ⭐⭐ ⚠️ ⇒ bấm mã phiếu **không làm gì** ⭐ ⭐ (⭐ tệp thuộc phiên 02 ⇒ **chỉ ghi log, không sửa** ✓) ⭐⭐ |
| **STATUS** | ⭐⭐⭐ **FIXED** ⭐⭐⭐ (⭐ 07/10/2026 · ERP-SESSION-01 tự sửa theo §20/§45 ⭐⭐ phiên 02 đã RELEASE OWNERSHIP ✓) |
| ⭐⭐⭐ **FIX** | ⭐⭐⭐ `app/page.tsx:523` ⭐⭐⭐<br>❌ `- moduleKey: viewable ?? item.permissionKeys[0]`<br>❌ `- moduleKey: viewable ?? item.moduleKey`  ⭐ sửa lần 1 ⭐ ⭐ **KHÔNG ĐỦ** ⭐ ⭐ (admin xem được `central_warehouse` ⇒ `viewable` = khoá đó ⇒ `??` không bao giờ chạy)<br>✅ ⭐⭐⭐ **`+ moduleKey: item.moduleKey`** ⭐⭐⭐ ⭐ ⭐ **MÀN ĐÍCH 100% từ khai báo** ⭐ ⭐<br>⭐ `viewable` GIỮ NGUYÊN vai trò cổng quyền (mất khoá xem ⇒ mục không hiện) ⭐ ⛔ KHÔNG sửa `Inventory.tsx` ⭐ |
| ⭐⭐ **BẰNG CHỨNG ĐÃ FIX (đo trên UI thật)** | ⭐⭐ **Sau** ⭐⭐<br>· `h1` = **«Tồn kho & điều chuyển»** ✓ (thay vì «Kho Tổng»)<br>· dải tab **[KHO] [XUẤT & NHẬP] [CẤP PHÁT & HOÀN TRẢ]** ✓<br>· tab «XUẤT & NHẬP» → sub-tab **[Xuất kho] [Nhập kho]** + nút **«⭱ Tạo phiếu nhập kho»** ✓<br>· bấm nút ⇒ **modal «Ghi nhận số lượng giao thực tế» MỞ** ✓ (`overlay=1`, nút đóng ✓)<br>· modal có PO thật `PO-PRJ-DEMO-01-2026-0021` + 2 dòng vật tư `KHAC-VLXD-004` (25) / `KHAC-VLXD-005` (60) ✓<br>· ảnh: `docs/dsh-state/bug002-grn-modal.png` ⭐⭐ **bằng chứng nhìn được** ⭐⭐ |
| ⭐ **HỒI QUY (§25)** | ⭐ ⭐ `workMenuChildren` (dòng 500) ⭐ **GIỮ NGUYÊN** ⭐ — ⭐ đo `lib/menu-helpers.ts:125-131` ⇒ `workMenuItems` ⭐ **không khai `moduleKey`** ⭐ ⇒ ⭐ `permissionKeys[0]` ở đó **là cách duy nhất** xác định màn ✓ ⭐ ⭐ **KHÔNG đụng dòng đó** ⭐ ⭐ `supplierPartnerMenuChildren` (`:515`) ⭐ đã dùng `item.moduleKey` sẵn ✓ ⭐ ⭐ `allocateReturnMenuChildren` (`:523+`) ⭐ mảng RỖNG ⇒ vô hại ✓ |
| ⭐ **QUY TRÌNH** | ⭐ `fixpoint-fingerprint` ×2 → `3adad55db6517d69` ✓ · verify ĐẠT ✓ · build EXIT=0 ✓ · ⭐ **đồng bộ 4 trường SQLite** (⭐ DROP trigger → UPDATE → CREATE lại ✓ ⭐ **KHÔNG migration** ⭐ DEC-015 ✓) · restart PID đã xác minh cmdline ✓ · `:9000` HTTP 200 ✓ |
| ⭐ **LƯU Ý (⚠️ LỖI PHỤ CHƯA SỬA)** | ⭐⭐ `Inventory.tsx:174` ⭐ `data-warehouse-tab={index===0?"inventory":"dashboard"}` ⭐ ⭐ ⇒ ⭐ **tab 1 và tab 2 CÙNG `="dashboard"`** ⭐ ⭐ ⚠️ ⭐ ⇒ selector `data-warehouse-tab` **KHÔNG phân biệt được** 2 tab ⚠️ ⭐ ⭐ (⭐ không chặn NGƯỜI DÙNG — vẫn bấm được ✓ ⭐ nhưng ⭐ chặn `probe` tự động ⚠️) ⭐ ⭐ ⭐ **TỆP `Inventory.tsx` THUỘC PHIÊN 02 — CHƯA ĐỤNG** ⭐ ⭐ ⭐ |
| ⭐⭐ **BÀI HỌC (§33)** | ⭐ ⭐⭐ **SỬA 1 DÒNG XONG ⛔ CHƯA ĐƯỢC COI LÀ XONG** ⭐ ⭐⭐ ⭐ ⭐ phải **ĐO LẠI TRÊN UI** ⭐ ⭐ ⭐ vì ⭐ `??` có thể ⭐ **không bao giờ chạy** ⭐ ⭐ nếu ⭐ nhánh trái luôn có giá trị ⭐ ⭐ ⚠️ ⭐⭐ (⭐ `viewable` luôn có vì admin xem mọi khoá ✓) ⭐⭐ |

⭐ ⭐ **GHI CHÚ PHỤ — 2 BÀ HỌC TỪ LẦM ĐO NÀY** ⭐ ⭐
```
⭐ ① ⛔ KHÔNG suy `child:N` từ `sort_order` CSDL — probe đếm `.nav-child` theo THỨ TỰ DOM.
⭐    Đã sai 2 lần (màn 16 rồi màn 19). Cách đúng: `browser_evaluate` đọc DOM thật (đã làm, 11 nhóm / 61 mục).
⭐ ② ⚠️ ⛔ KHÔNG bấm `@N` MÙ — đã bấm trượt 2 lần và CHUYỂN NHẦM MÀN (tưởng đang ở «Kho Tổng»
⭐    nhưng thực tế đang ở màn «BÁO CÁO»). Phải dùng SELECTOR ỔN ĐỊNH (`[data-nav-group="x"] .nav-child`).
```
