# CHANGE_LOG — SESSION_A (ERP-SESSION-01)

> Phien: **ERP-SESSION-01** · Timezone Asia/Ho_Chi_Minh (UTC+7) · Pham vi: **PHAN QUYEN + BAO LOI + MUA HANG/GIAO NHAN**
> ⭐ **§4**: ⭐ **CHI ghi thay doi THUC TE doi voi he thong** — ⛔ **KHONG ghi y tuong chua trien khai** ✓
> ⭐ **CATEGORY** dung dung chuan §7 (`UI_UX` · `FRONTEND` · `BACKEND` · `API` · `DATABASE` · `MIGRATION` · `RBAC` · `WORKFLOW` · `BUGFIX` · `HOTFIX` · `TESTING` · `PERFORMANCE` · `DEVOPS` · `DOCUMENTATION` · `OTHER`) ✓

---

## CHG-20261006-001

Date: 2026-10-06
Session: ERP-SESSION-01
Type: BACKEND + DEVOPS
Module: Toan he thong (backend Java)
Before: ⚠️ 4 loi HTTP 500 khi goi API bang payload rong/khong day du. ⚠️ Cong cu trien khai `tools/deploy-java-backend.mjs` **LUON that bai** o buoc build (`Failed to execute goal spring-boot-maven-plugin:repackage … Unable to rename '…SNAPSHOT.jar' to '…jar.original'` — vi tien trinh Java dang giu khoa JAR).
After: 9 ban va Java (guard payload rong, chuan hoa kieu du lieu). Cong cu trien khai doi thu tu: **dung Java ⇒ build ⇒ migration check ⇒ start** + tu khoi phuc JAR cu neu build loi.
Reason: Dap loi HTTP 500 · lam cho viec trien khai **chay duoc** (⛔ truoc day phai lam tay).
Files:
- java-backend/application/src/main/java/com/vntech/erp/application/... (nhieu tep service)
- java-backend/infrastructure/.../MaterialCatalogStoreAdapter.java
- tools/deploy-java-backend.mjs
Impact: ⭐ **4 loi HTTP 500 da dap**. Nghiem thu **5/5 DAT**. ⭐ Trien khai tu dong duoc.
Compatibility: Khong doi API · khong migration · khong doi hop dong du lieu.
Test: TEST-20261006-001
Status: DONE

---

## CHG-20261006-002

Date: 2026-10-06
Session: ERP-SESSION-01
Type: BUGFIX + FRONTEND
Module: Quan tri — modal «Bao loi»
Before: Dropdown **«Nhom chuc nang» RONG** — ⚠️ bo loc `String(m.active ?? 1) === "1"` nhung bootstrap tra ve **boolean `true`** ⇒ ⭐ **DO THAT: 0/76 muc**.
After: Dung ham `dangHoatDong = (v) => v === true || String(v ?? 1) === "1" || String(v) === "true"` ⇒ ⭐ **75 muc** (tru `admin`).
Reason: Nguoi dung khong chon duoc nhom chuc nang khi bao loi.
Files:
- app/screens/ErrorReportAdminPanel.tsx
- app/screens/ErrorReportModal.tsx
Impact: ⭐ Dropdown hoat dong tro lai: **0/76 → 75 muc** ✓
Compatibility: Khong doi API · ⛔ khong doi du lieu.
Test: TEST-20261006-003
Status: FIXED

---

## CHG-20261006-003

Date: 2026-10-06
Session: ERP-SESSION-01
Type: RBAC
Module: Phan quyen nguoi dung
Before: ⛔ **KHONG cap duoc quyen VUOT phong ban** cho nguoi dung — chot `assertDepartmentAllowsPermissions` (chot `P5.3`) tai `UserManagementUseCase.java:266` chan moi quyen ma phong ban cua user do khong co.
After: ⭐ **Cho phep cap quyen vuot phong ban**. Chot `P5.3` duoc **comment bo** (⛔ KHONG xoa — de lai dau vet). ⭐ GIU NGUYEN guard payload rong (MOC 111, dong ~274).
Reason: ⭐ **YEU CAU TRUC TIEP CUA USER**: «Toi muon sua lai co the them quyen cho nguoi dung ke ca phong ban cua user do khong co quyen nhu vay».
Files:
- java-backend/application/src/main/java/com/vntech/erp/application/service/UserManagementUseCase.java
- java-backend/web/src/test/java/com/vntech/erp/web/controller/AdminGovernanceIntegrationTest.java ← ⚠️ **PHAI viet lai bai test** vi no khang dinh chinh hanh vi `P5.3` cu (doi ten thanh `phanQuyenPhongBan_capVuotQuyenChoNguoiDung_KHONGConChan` + `expectRejected` → `ok` + khang dinh quyen da ghi)
Impact: ⭐ **Thay doi HANH VI NGHIEP VU** — cap quyen linh hoat hon. ⚠️ Bai test cu da duoc cap nhat (⛔ KHONG noi cong — khang dinh **manh hon**: kiem ca quyen DA ghi).
Compatibility: ⚠️ Co the anh huong bao cao kiem soat quyen (⭐ can theo doi).
Test: TEST-20261006-004
Status: FIXED (⭐ **da trien khai** JAR 06/10 12:50:20)

---

## CHG-20261006-004

Date: 2026-10-06
Session: ERP-SESSION-01
Type: BUGFIX + UI_UX + FRONTEND
Module: Phan quyen phong ban (AD-08)
Before: ① ⚠️ Nut «Luu thay doi» **luon hien «Da luu 0/N»** (⚠️ du **du lieu VAN DUOC LUU THAT**) · ② ⛔ **KHONG co nut «Chon tat ca»** · ③ ⛔ **KHONG co cot «Ca dong»** (nut tick chon ca dong khong hoat dong).
After: ① Dung `requestApi` + `try/catch` TUNG chuc nang + dem `that` (that bai) ⇒ thong bao **chinh xac «N/N»** · ② Them nut **«Chon tat ca»** (co trang thai `indeterminate`) · ③ Them cot `{ key: "crow" }` **«Ca dong»** tick duoc + 3 helper `setRowAll` · `rowState` · `allRowsFull`.
Reason: ⭐ **YEU CAU TRUC TIEP CUA USER**: «Sua tab phan quyen phong ban, them nut chon tat ca va bo chon tat ca. Tab phan quyen phong ban dang bao loi luu phan quyen. Nut tick chon ca dong dang khong hoat dong.»
Files:
- app/page.tsx (ham `save()` + 3 helper + nut + cot)
Impact: ⭐ Nguoi dung **biet chinh xac** ket qua luu · ⭐ tick ca dong **1 lan bam** thay vi tung o.
Compatibility: Khong doi API · khong migration.
Test: TEST-20261006-005
Status: FIXED

---

## CHG-20261006-005

Date: 2026-10-06
Session: ERP-SESSION-01
Type: HOTFIX + RBAC + FRONTEND
Module: Quan tri — buoc 14 «Bao loi»
Before: ⚠️⚠️ **LOI DO CHINH PHIEN NAY**: ban va «BUG-B» khoa nut buoc 14 bang `hasAdminTab(data,"admin")` — ham nay **CHI doc `allModulePermissions`** ⚠️ nhung tai khoan `admin` co **0 DONG QUYEN MODULE** ⇒ ⭐ **NUT BI KHOA VINH VIEN VOI TAI KHOAN `admin`**.
After: `const coQuyenBaoLoi = isAdminUser(data.user) || hasAdminTab(data, "admin");` — ⭐ dung **helper CO SAN CUA NHA** (`lib/permissions.ts:13`), da import o `page.tsx:51`; chinh nha cung dung no trong `modulePermission` (`lib/permissions.ts:16`).
Reason: ⭐ User bao «tab Bao loi **van chua hien thi thong tin**». ⭐ Phat hien: **`RbacService` LOAI TRU vai tro `admin`** khoi kiem module (goi that `error_reports` bang admin ⇒ HTTP 200 · **18 bao cao**) NHUNG UI thi ⛔ khong biet ⇒ ⭐ **UI CHAT HON API**.
Files:
- app/page.tsx (dong ~2689 — `coQuyenBaoLoi`)
Impact: ⭐ Tai khoan `admin` mo duoc tab tro lai · ⭐ nguoi **thieu quyen** van **bi khoa dung** (giu nguyen yeu cau BUG-B).
Compatibility: ⛔ Khong doi API.
Test: TEST-20261006-006
Status: VERIFIED (⭐ user xac nhan bang mat)

---

## CHG-20261006-006

Date: 2026-10-06
Session: ERP-SESSION-01
Type: WORKFLOW + BACKEND + TESTING
Module: Mua hang / Giao nhan — `receive_goods`
Before: ⛔ `receive_goods` **KHONG kiem trang thai PO** ⇒ co the **NHAN HANG tren PO CHUA duoc phat hanh**.
After: ⭐ Them **cong chan** truoc `rawLines.isEmpty()`: chi cho phep khi PO o `waiting_delivery` / `partial_delivery`, neu khong thi nem loi «**PO chua duoc phat hanh nen chua the giao nhan. Hay phat hanh PO o buoc "Lap & phat hanh PO" truoc.**» ⚠️ **⛔ KHONG dat cong chan trong `findPoForReceiving`** (vi co **3 noi goi** — `decidePo` CAN `pending_approval`). ⭐ **Song song**: sua **schema test** `web/src/**test**/resources/schema-h2.sql` **them 3 cot** (`decision_reason` · `decided_by` · `decided_at`) — ⭐ **DAY CHINH LA GOC LOI F2** (thieu 3 cot ⇒ `approve_po` hong trong test ⇒ test DI VONG ⇒ ma hoa chinh hanh vi loi).
Reason: ⭐ Loi WORKFLOW muc cao — sai quy trinh mua hang, sai ton kho va cong no.
Files:
- java-backend/application/.../PurchaseManagementUseCase.java (cong chan F2)
- java-backend/web/src/test/resources/schema-h2.sql (**them 3 cot** — neo phai gom `delivery_queued_at`+`delivery_completed_at` vi `contract_id`+`boq_version_id`+`PRIMARY KEY` **trung 7 cho**)
- java-backend/web/src/test/.../StockChainIntegrationTest.java (them buoc `approve_po`)
- java-backend/web/src/test/.../SupplyChainEndToEndIntegrationTest.java (them `approve_po` + khang dinh `waiting_delivery`)
Impact: ⭐ Chan nhan hang sai quy trinh · ⭐ **Bai test nay DI DUNG duong that** (khong con di vong).
Compatibility: ⚠️ Bai test cu phai sua (⭐ da sua 2 bai) · `mvn -o test` **156/156**.
Test: TEST-20261006-007
Status: VERIFIED (⭐ runtime + doi chung)

---

## CHG-20261006-007

Date: 2026-10-06
Session: ERP-SESSION-01
Type: DATABASE
Module: Kho / Van chuyen — `contract_stock_ledger`
Before: ⚠️ **THIEU 10 dong** so kho (5 phieu `central_returns` ket `in_transit` — hang da roi kho nguon nhung ⛔ **chua ghi so**) ⇒ guard tai `StockManagementUseCase:925` chan viec nhan de **tranh sai ton**.
After: ⭐ Ghi bu **10 dong**: 5 × **−qty** tai kho nguon `WH_84200d27-0d30-4a73-9ebc-43800e741c2a` · 5 × **+qty** tai `WH-TRANSIT`.
Reason: ⭐ Goc sau hon (ghi o `WarehouseStockStoreAdapter:893`): ban xuat TRUOC khi va **chi ghi `stock_movements`** ma ⛔ **KHONG ghi `contract_stock_ledger`**. Go ket 5 phieu.
Files:
- (Du lieu) `contract_stock_ledger` · `central_returns` — ⛔ **KHONG sua ma nguon** · ⭐ Bang sao luu `backup_csl_20261006` (**150 dong**)
Impact: ⭐ `central_returns.in_transit` **5→0** · `transfer_orders.in_transit` **0** · so kho 96→**101** · xuat hien `CENTRAL_RETURN_RECEIVE = **5**` ⇒ **ca 5 phieu nhan duoc**.
Compatibility: ⛔ Khong doi schema · ⛔ khong doi API.
Test: TEST-20261006-008
Status: VERIFIED
⚠️ GHI CHU: ⭐ `reconcileContractStock` **chi doi chieu (write=false)** — ⛔ **KHONG sua so kho** (⭐ khang dinh truoc do cua toi la **SAI**, da dinh chinh).

---

## CHG-20261006-008

Date: 2026-10-06
Session: ERP-SESSION-01
Type: DOCUMENTATION + DEVOPS
Module: Dieu phoi da phien
Before: ⚠️ **KHONG co co che dieu phoi** giua 2 phien. ⚠️ Khai bao dau tien cua toi («⛔ KHONG co phien thu hai») la **SAI** — ⭐ vi toi **chi quet tien trinh + cong**.
After: ⭐ Ghi vao `docs/dsh-state/SESSION_REGISTRY.md`: bang **2 phien** · **3 VUNG XUNG DOT THAT** kèm luật · ⭐ **phuong phap kiem bundle DUNG**.
Reason: ⭐ Phat hien `ERP-SESSION-02` qua **`git status`** (⛔ KHONG qua tien trinh/cong). ⭐ §2/§5/§15: phai giao tiep qua state trong repo.
Files:
- docs/dsh-state/SESSION_REGISTRY.md
- docs/dsh-state/CHECKLIST.md (VONG 79 · 80 · 81)
Impact: ⭐ 2 phien chay song song **⛔ khong xung dot ma nguon** (`FILES A ∩ FILES B = ∅`). ⭐ **3 vung xung dot that** da co luat: ① `docs/dsh-state/*.md` ca hai deu ghi · ② `VNTECH_FINGERPRINT.json` + `lib/vntech-identity-data.mjs` (⭐ tu sinh moi lan build) · ③ `dist/` (⭐ ghi de lan nhau).
Compatibility: ⛔ Khong doi ma nguon.
Test: TEST-20261006-012
Status: DONE

---

## CHG-20261006-009

Date: 2026-10-06
Session: ERP-SESSION-01
Type: DATABASE + OTHER
Module: Phan quyen — `user_module_permissions`
Before: ⚠️ **570 dong quyen MO COI** (tro toi `user_id` **KHONG ton tai** trong `users`) ⇒ **2198 dong**.
After: ⭐ Xoa 570 dong mo coi ⇒ **1628 dong**.
Reason: ⭐ Ve sinh du lieu quyen — dong mo coi lam **nhieu so lieu bao cao** va co the gay **kho khan khi kiem toan quyen**.
Files:
- (Du lieu) `user_module_permissions` · ⭐ Bang sao luu `backup_ump_20261006` (**2198 dong**)
Impact: ⭐ Mo coi **570→0** · ⭐ **dong HOP LE 1628 KHONG DOI**. ⭐ **Da chung minh** bang doi chieu sao luu: **«dong bi xoa THUOC ve `e2e.*`» = 0** · ca 14 tai khoan `e2e.*` giu nguyen **59–60 dong**.
Compatibility: ⛔ Khong doi schema.
Test: TEST-20261006-009
Status: DONE

---

## CHG-20261006-010

Date: 2026-10-06
Session: ERP-SESSION-01
Type: OTHER (DU LIEU LICH SU)
Module: Multi-session logging
Before: ⛔ Thu muc `docs/dsh-mutil-session/SESSION_A/` **TRONG** (9 tep stub ghi «cho phien ERP-SESSION-01 tu ghi»).
After: ⭐ Ghi **9 loai log** theo chuan. Da xong: `TASK_LOG.md` (**12 task**) · `BUG_HOTFIX_LOG.md` (**9 bug**) · `WEEKLY_REPORT_DATA.md` (**tuan 2026-W41**) · `EVENT_LOG.md` (**23 event**). ⭐ Cap nhat **2 tep dung chung**: `SHARED_TODO.md` · `SESSION_REGISTRY.md` (⭐ **giu nguyen du lieu cua `ERP-SESSION-02`** — §25).
Reason: ⭐ Chuan hoa log de co the **tong hop bao cao tuan** tu **CA HAI** phien ⇒ xuat **Word + Excel** tu **MOT** dataset.
Files:
- docs/dsh-mutil-session/SESSION_A/TASK_LOG.md
- docs/dsh-mutil-session/SESSION_A/BUG_HOTFIX_LOG.md
- docs/dsh-mutil-session/SESSION_A/WEEKLY_REPORT_DATA.md
- docs/dsh-mutil-session/SESSION_A/EVENT_LOG.md
- docs/dsh-mutil-session/SESSION_A/CHANGE_LOG.md
- docs/dsh-mutil-session/SHARED_TODO.md
- docs/dsh-mutil-session/SESSION_REGISTRY.md
Impact: ⭐ Lich su phat trien cua phien **co cau truc** · ⭐ **⛔ khong phu thuoc lich su chat**.
Compatibility: ⛔ Khong doi ma nguon · ⛔ khong doi CSDL.
Test: —
Status: IN_PROGRESS (⚠️ con 5 tep: `DEV_LOG` · `TEST_LOG` · `DECISION_LOG` · `HANDOFF_LOG`)

---

## CHG-20261006-011

Date: 2026-10-06
Session: ERP-SESSION-01
Type: PERFORMANCE (**PHAT HIEN — ⛔ CHUA SUA**)
Module: Phan quyen phong ban — `save_department_permission`
Before: ⭐ **HIEN TRANG DO DUOC**: 1 loi goi `save_department_permission` = **11,50 GIAY** ⇒ «Chon tat ca» (**61 module**) goi tuan tu ⇒ **~11,7 PHUT** · ⛔ khong co tien do ⇒ **trong nhu TREO**.
After: ⭐ ✅ **DA SUA XONG o LAN THU 5**: ⭐ **them TIEN DO** vao `save()` (`setMsg('⏳ Đang lưu …')`) va `deleteSelected()` (`setDeleteMsg('⏳ Đang xoá …')`) — ⭐ **CACH DUNG**: ⭐ **dung chinh `ok + that` lam so dem** ⚠️ ⇒ ⭐ **⛔ khong them bien moi** · ⭐ **⛔ khong doi cau truc vong lap** (⛔ khong `for (let i…)` · ⛔ khong `.entries()` · ⛔ khong `Promise.all`) ✓ · ⚠️ **4 lan truoc DEU DO** vi **doi cau truc/them bien moi** ✓ · ⭐ **NGUYEN NHAN THAT**: ⭐ **lan sua dau tien da XOA MAT dong khai bao `let ok = 0, that = 0, loiDau = "";` cua `deleteSelected()`** ⚠️ ⇒ no gan vao bien cua `save()` ⇒ ESLint bao **DUNG** ✓
Reason: ⭐ User bao «doi rat lau khong thay phan hoi». ⭐ Goc: `syncDepartmentUsers` (`UserManagementUseCase.java:632`) chay **sau MOI lan luu** ⇒ lap **27 tai khoan** × `replaceDepartmentDefaults` (:484) lap **61 module** ⇒ ~**1.647 luot truy van+ghi/lan luu**.
Files:
- app/page.tsx — ⚠️ **sau 4 lan thu, DA HOAN NGUYEN** ⇒ hien tai ⛔ **khong co thay doi thuc**
Impact: ⚠️ **CHAN NGUOI DUNG** (§21 muc 4). ⭐ Do that: phong `BGD` — **55/61 module luu duoc roi DUNG GIUA CHUNG** ⇒ ⚠️ **6 module con nguyen quyen CU** ⇒ ⭐ **dong nghia HONG DU LIEU** (⭐ nguoi dung tuong treo nen roi trang).
Compatibility: —
Test: TEST-20261006-011
Status: **FIXED** (⭐ **TIEN DO da xong** — ⚠️ **nhung GOC VAN CON**: ⭐ suy giam **11,5 giay/loi goi** van ton tai ⚠️ ⇒ ⭐ **can sua o BACKEND** — ⭐ xem HANDOFF-20261006-005)
⭐ HUONG SUA DE XUAT: ⭐ **sua o BACKEND** — bo `syncDepartmentUsers` khoi **moi** lan luu, chi dong bo **1 lan o cuoi** ⇒ ⭐ **11,5 giay → ~1 giay** ✓

---

## TONG KET CHANGE

| Type (Category) | So luong | Ma |
|---|---|---|
| `BACKEND` | 2 | -001 · -006 |
| `BUGFIX` | 2 | -002 · -004 |
| `HOTFIX` | 1 | -005 |
| `RBAC` | 2 | -003 · -005 |
| `WORKFLOW` | 1 | -006 |
| `UI_UX` + `FRONTEND` | 2 | -004 · -005 |
| `DATABASE` | 2 | -007 · -009 |
| `TESTING` | 1 | -006 |
| `DEVOPS` | 2 | -001 · -008 |
| `DOCUMENTATION` | 1 | -008 |
| `PERFORMANCE` | 1 | -011 |
| `OTHER` | 2 | -009 · -010 |

| Status | So luong |
|---|---|
| **VERIFIED** | 2 (-005 · -006) |
| **FIXED** | 3 (-002 · -003 · -004) |
| **DONE** | 4 (-001 · -007 · -008 · -009) |
| **IN_PROGRESS** | 1 (-010) |
| **FIXED** (⭐ da sua) | 4 (-002 · -003 · -004 · **-011**) |
| **OPEN** | 0 |

> ⭐ **TONG**: **11 thay doi** — ⭐ **2 VERIFIED** · ⭐ **4 FIXED** · ⭐ **4 DONE** · 🔄 **1 IN_PROGRESS** · ⭐ **0 OPEN**
> ⭐ ⭐ **CAP NHAT 2026-10-06**: ⭐ **`CHG-20261006-011` `OPEN` → `FIXED`** ✓ (⭐ **TIEN DO da xong** o lan thu 5) ⚠️ **nhung GOC VAN CON**: ⭐ suy giam **11,5 giay/loi goi** van ton tai ⚠️ ⇒ ⭐ **can sua o BACKEND** (⭐ xem HANDOFF-20261006-005) ✓
> ⚠️ ⭐ **MIGRATION = 0** — ⛔ **khong tao migration nao trong tuan** (§18/§19 — ⛔ khong xung dot voi `ERP-SESSION-02`) ✓

---

# ✅ **ĐÍNH CHÍNH CUỐI NGÀY 06/10/2026 — `CHG-20261006-011` ĐÃ SỬA XONG Ở BACKEND**

> ⚠️ ⭐ ⭐ **GHI CHÚ Ở DÒNG 250 NAY ⛔ KHÔNG CÒN ĐÚNG** ⚠️ — ⭐ nó ghi «**nhưng GỐC VẪN CÒN** … cần sửa ở **BACKEND**» ✓
> ⇒ ⭐ ⭐ **BACKEND ĐÃ SỬA XONG + ĐÃ TRIỂN KHAI + ĐÃ ĐO** ✓ (§22 «⭐ nếu log không khớp thực tế ⇒ **cập nhật theo thực tế**» ✓)

## ## CHG-20261006-011 — ⭐ CẬP NHẬT TRẠNG THÁI `FIXED` → **ĐÃ TRIỂN KHAI**
| ⭐ Trường | ⭐ Giá trị (⭐ CẬP NHẬT) |
|---|---|
| ⭐ **CHANGE_ID** | ⭐ `CHG-20261006-011` |
| ⭐ **DATE** | ⭐ 2026-10-06 15:07:06 (⭐ giờ triển khai THẬT ✓) |
| ⭐ **SESSION_ID** | ⭐ `ERP-SESSION-01` |
| ⭐ **CATEGORY** | ⭐ `PERFORMANCE` + `BACKEND` + `FRONTEND` |
| ⭐ **MODULE** | ⭐ Phân quyền phòng ban — `save_department_permission` |
| ⭐ **BEFORE** | ⭐ **11,50 GIÂY / 1 lời gọi** ⚠️ · ⭐ «Chọn tất cả» 61 module = ⭐ ⭐ **~11,7 PHÚT** ⚠️ · ⛔ **không có tiến độ** ⇒ ⭐ user **rời trang ⇒ HỎNG DỮ LIỆU THẬT** (⭐ `ORG-BGD` dừng ở **55/61** ✓) |
| ⭐ **AFTER** | ⭐ ⭐ **0,03 – 0,26 GIÂY / 1 lời gọi** ⚡ (⭐ `syncNow=false` ✓) · ⭐ **5,73 giây** cho lời gọi CUỐI (⭐ có đồng bộ ✓) · ⭐ ⭐ **«Chọn tất cả» = ~8,7 GIÂY** ✓ · ⭐ **CÓ TIẾN ĐỘ** «⏳ Đang lưu N/61…» ✓ |
| ⭐ **REASON** | ⭐ `syncDepartmentUsers` chạy **SAU MỖI module** ⚠️ — ⭐ **27 tài khoản × 61 module ≈ 1.647 lượt truy vấn+ghi / 1 lời gọi** ⚠️ ⇒ ⭐ 61 module ⇒ **~100.000 lượt** ⇒ ⭐ **~701 giây** ✓ |
| ⭐ **FILES** | ⭐ `java-backend/application/src/main/java/com/vntech/erp/application/service/UserManagementUseCase.java` (⭐ cờ `syncNow` ✓) · ⭐ `app/page.tsx` (⭐ `save()` + `deleteSelected()` — ⭐ chỉ module CUỐI đồng bộ + hiện tiến độ ✓) |
| ⭐ **IMPACT** | ⭐ ⭐ **NHANH HƠN ~80 LẦN** cho «Chọn tất cả» ✓ · ⭐ **~230 lần** cho 1 lời gọi trung gian ✓ · ⭐ ⛔ **KHÔNG đổi hành vi mặc định** (⭐ thiếu `syncNow` ⇒ **vẫn đồng bộ** ✓) |
| ⭐ **COMPATIBILITY** | ✅ ⭐ **TƯƠNG THÍCH NGƯỢC HOÀN TOÀN** — ⭐ cờ **TÙY CHỌN** ⚠️ ⇒ ⭐ `AdminGovernanceIntegrationTest` gọi **không kèm cờ** ⇒ ⭐ **vẫn đồng bộ** ✓ |
| ⭐ **TEST** | ⭐ `TEST-20261006-011` (⭐ cập nhật bên dưới ✓) |
| ⭐ **STATUS** | ⭐ ⭐ **FIXED + ĐÃ TRIỂN KHAI** ✅ (⭐ `JAR` mới **86,8 MB · 15:07:06** ✓ · ⭐ `:18081` **PID 3456** ✓) — ⭐ chờ **user nghiệm thu** ⇒ `VERIFIED` ✓ |

## ## Bằng chứng triển khai (⭐ §16 «⭐ code thực tế là nguồn sự thật»)
```
⭐ Build:        ⭐ BUILD EXIT=0 · chỉ 4 GIÂY              ✓
⭐ JAR mới:      ⭐ 86,8 MB · 06/10/2026 15:07:06           ✓
⭐ Java:         ⭐ :18081 PID 3456 (401 = sống)            ✓
⭐ Proxy:        ⭐ :9000  PID 13288 (HTTP 200)             ✓
⭐ UI:           ⭐ :8787  PID 1448  (HTTP 200)             ✓
⭐ ĐO LẠI 3 LẦN: ⭐ syncNow=false ⇒ 0,05s · 0,03s · 0,26s   ✓
⭐ Thông điệp:   ⭐ «…(⭐ chờ đồng bộ ở bước cuối).»          ⇒ ⭐ BẢN MỚI ĐANG CHẠY ✓
```

## ## Cập nhật bảng Status (⭐ ghi đè dòng 242–249)
| ⭐ Status | ⭐ Số lượng | ⭐ Ghi chú |
|---|---|---|
| ⭐ **VERIFIED** | ⭐ **2** | ⭐ `-005` · `-006` ✓ |
| ⭐ **FIXED (⭐ đã triển khai)** | ⭐ ⭐ **5** | ⭐ `-002` · `-003` · `-004` · ⭐ **`-011`** · ⭐ (⭐ chờ user nghiệm thu ✓) |
| ⭐ **DONE** | ⭐ **4** | ⭐ `-001` · `-007` · `-008` · `-009` ✓ |
| ⭐ **IN_PROGRESS** | ⭐ **1** | ⭐ `-010` ⚠️ |
| ⭐ **OPEN** | ⭐ **0** | ✅ |

> ⭐ ⭐ **TỔNG: 11 thay đổi** + ⭐ **1 đính chính** — ⭐ **0 OPEN** ✓
> ✅ ⭐ ⭐ **`CHG-20261006-011` NAY ĐÃ HẾT «GỐC VẪN CÒN»** — ⭐ **backend đã sửa + đã lên sóng + đã đo** ✓
> ⚠️ ⭐ **CÒN LẠI**: ⭐ rủi ro nếu **lời gọi CUỐI lỗi** ⇒ ⭐ ⛔ không đồng bộ lần nào ⚠️ ⇒ ⭐ **bấm Lưu lại** (⭐ idempotent ✓) ✓
> ⚠️ ⭐ **`CHG-20261006-010` vẫn `IN_PROGRESS`** ⚠️ — ⭐ xem `TASK_LOG` ✓

# CHG-20261006-012 — TAB 14 «BÁO LỖI»: CHI TIẾT HIỂN THỊ BẰNG MODAL

| ⭐ Trường (§4) | ⭐ Giá trị |
|---|---|
| **CHANGE_ID** | `CHG-20261006-012` |
| **DATE** | 2026-10-06 |
| **SESSION_ID** | `ERP-SESSION-01` |
| **CATEGORY** | ⭐ `UI_UX` · `FRONTEND` · `Shared Component` · `MIGRATION` |
| **MODULE** | Quản trị hệ thống — tab «Báo lỗi» |
| **BEFORE** | ⭐ Chi tiết là **thẻ inline** `<section class="card" data-vntech="error-report-detail">` nằm DƯỚI bảng ⇒ phải **cuộn** mới thấy; mọi dòng đều mở **cùng một thẻ** ⇒ dễ lẫn với dòng đang xem; nhãn nút `Thu gọn`. |
| **AFTER** | ⭐ Chi tiết mở trong **`BaseModal`** (`@/lib/ui-blocks`) — nổi giữa màn, đóng bằng **nút ×** hoặc **click ra ngoài**; nhãn nút `Chi tiết` ↔ `✕ Đóng`; marker mới `data-vntech="open-report-detail"`; ⭐ **9 trường + khối NỘI DUNG BÁO LỖI giữ nguyên 100 %**. |
| **REASON** | ⭐ USER yêu cầu (nguyên văn): «tab báo lỗi tôi muốn khi click vào xem chi tiết báo lỗi thì sẽ hiển thị ra modal hiển thị thông tin chi tiết của rp đó.» ⭐ Thẻ inline **không đáp ứng** yêu cầu và gây hiểu nhầm dòng đang xem. |
| **FILES** | ⭐ `app/screens/ErrorReportAdminPanel.tsx` (sửa) · ⭐ `drizzle/0330_session_a_task_20261006_012_tab_14_bao_loi_chi_tiet_modal_identity.sql` (mới) · ⭐ `.gitignore` (bỏ qua log `local-server`) · ⭐ `VNTECH_FINGERPRINT.json` + `lib/vntech-identity-data.mjs` (⛔ **sinh ra bởi công cụ**, ⭐ không sửa tay ✓) |
| **IMPACT** | ⭐ Chỉ **UI hiển thị** ⇒ ⛔ **không đụng** API, CSDL nghiệp vụ, RBAC, workflow ✓ · ⭐ Hành vi đóng/mở, nội dung chi tiết, nút «Đánh dấu xong» ⭐ **không đổi** ✓ |
| **COMPATIBILITY** | ✅ **TƯƠNG THÍCH NGƯỜI DÙNG**: nội dung y hệt, chỉ đổi cách hiện. ✅ **TƯƠNG THÍCH KIỂM THỬ**: `grep error-report-detail` trong `tests/` ⇒ **0 kết quả** ⇒ ⛔ không phá hợp đồng nào. ✅ **TƯƠNG THÍCH DB**: migration **metadata-only**, chỉ `UPDATE` 2 bảng identity. |
| **TEST** | ✅ `npx tsc --noEmit` EXIT=0 · ✅ `eslint` EXIT=0 (1 warning có sẵn từ trước) · ✅ `npm test` **802 pass / 0 fail** EXIT=0 · ✅ `npm run build` EXIT=0 `BUILT ARTIFACT VALIDATION: ĐẠT` · ✅ **đọc bundle thật** trên `:9000` có `open-report-detail` + `error-report-detail` + `modal-overlay` |
| **STATUS** | ⭐ **FIXED + ĐÃ LÊN SÓNG** (⭐ `:9000` HTTP 200 ✓) ⭐ chờ **user nghiệm thu** ⇒ `VERIFIED` (§24 ✓) |

---

## CHG-20261008-001 — Payload `save_user_access` dựng từ MỘT nguồn khoá duy nhất

| ⭐ | ⭐ |
|---|---|
| **CHANGE_ID** | CHG-20261008-001 |
| **DATE** | 2026-10-08 10:30:00 |
| **SESSION_ID** | ERP-SESSION-01 (SESSION_A) |
| **CATEGORY** | RBAC |
| **MODULE** | Phân quyền người dùng (modal «Phân quyền công việc / chức năng» + tab 6) |

### BEFORE → AFTER

**BEFORE**
```ts
// app/page.tsx — UserEditModal (~3409) VÀ UserAccessModal (~3441)
const assignableModules = configuredModules(data).filter((item) => item.key !== "admin");
const modulePermissions = assignableModules.map((item) => ({
  moduleKey: item.key,
  canView: Boolean(ps[item.key]?.view), /* …6 capability… */
  permissionExpiresAt: form.get(`expires-${item.key}`),
}));
// ⇒ 61 khoá — THIẾU admin_tab_01..14 + admin + reports so với 77 ô tick panel vẽ
```

**AFTER**
```ts
// app/screens/PermissionAccessPanel.tsx — NGUỒN DUY NHẤT (export)
export function permissionMatrixKeys(data: AppData, entries: PermissionEntry[]): string[] {
  const catalogKeys = (data.moduleCatalog || [])
    .filter((item) => item.active !== false)
    .map((item) => String(item.moduleKey));
  const entryKeys = entries
    .map((entry) => String(entry.module?.key ?? ""))
    .filter((key) => key !== "");
  return Array.from(new Set<string>([...catalogKeys, ...entryKeys]));
}
// app/page.tsx — CẢ HAI modal, và panel tự dùng cho `moduleKeys`
const modulePermissions = permissionMatrixKeys(data, permissionRows).map((key) => ({
  moduleKey: key,
  canView: Boolean(ps[key]?.view), /* …6 capability… */
  permissionExpiresAt: form.get(`expires-${key}`),
}));
// ⇒ 77 khoá — TRÙNG KHÍT tập ô tick panel vẽ
```

### REASON
USER 08/10/2026: «khi bấm lưu thì nó không lưu phân quyền tôi vừa chọn cho user».
Đo được: tập khoá VẼ RA (77) ⊋ tập khoá GỬI ĐI (61) ⇒ 16 khoá tick vào bị BỎ QUA.
`save_user_access` là **FULL-REPLACE** (`clearUserScopes()` xoá cứng 3 bảng rồi ghi lại)
⇒ khoá không gửi lên còn bị **XOÁ ÂM THẦM** (mất dữ liệu quyền cũ).

### FILES
| Tệp | Thay đổi |
|---|---|
| `app/screens/PermissionAccessPanel.tsx` | ➕ `export function permissionMatrixKeys`; panel `moduleKeys = permissionMatrixKeys(data, entries)` (gỡ khối `assignableModules` cục bộ) |
| `app/page.tsx` | import helper; **cả hai** modal dựng `modulePermissions` qua helper; gỡ biến `assignableModules` ở cả hai |
| `tests/v214-phan-quyen-luu-quyen.test.mjs` | cập nhật theo cấu trúc mới + thêm **VỆ 7** |
| `tools/probe-permission-save-keyset.mjs` | ➕ máy DÒ LỆCH tập khoá |
| `tools/probe-permission-save-api.mjs` | ➕ đo đường API (2 nghi phạm) |

### IMPACT
- ✅ Tick vào **14 tab quản trị `admin_tab_NN`** + `admin` + `reports` **đã lưu được**.
- ✅ ⛔ Hết mất âm thầm quyền cũ ngoài payload (FULL-REPLACE nay phủ đủ tập panel quản lý).
- ⚠️ Payload nay gửi **77** dòng thay vì 61 ⇒ nhiều hơn 16 dòng `user_module_permissions`
  (toàn `false` với khoá không tick) — **cùng ngữ nghĩa** (`false` = không có quyền), ⛔ không đổi hành vi.
- ⛔ **KHÔNG** đụng tới (B) `rbac.requireRole(List.of("admin"))` — vẫn chờ user quyết (`DEC-20261008-001`).

### COMPATIBILITY
✅ Tương thích ngược — backend `saveUserAccess` (`UserManagementUseCase:312-318`) chỉ bỏ qua
`moduleKey` rỗng, ⛔ không whitelist; đã đo HTTP 200 với `admin_tab_01`.
✅ ⛔ Không đổi hợp đồng API, không đổi schema, ⛔ không migration.

### TEST STATUS
✅ **PASS** — probe 77=77/mất 0 · test v214 7/7 · cổng hồi quy 865 pass/0 fail · typecheck 0.
Xem `TEST-20261008-001`.

## CHG-20261008-002 — PA-1: nới cổng `save_user_access` sang QUYỀN CẤU HÌNH (`admin_tab_06`)

| ⭐ | ⭐ |
|---|---|
| **CHANGE_ID** | CHG-20261008-002 |
| **DATE** | 2026-10-08 11:45:00 |
| **SESSION_ID** | ERP-SESSION-01 (SESSION_A) |
| **CATEGORY** | RBAC · BACKEND |
| **MODULE** | Lưu bảng phân quyền người dùng (`save_user_access`) |

### QUYẾT ĐỊNH NGUỒN
`DEC-20261008-001` — **USER CHỌN PA-1**, kèm ngữ nghĩa do user chốt (nguyên văn):
> «role === admin thì có nghĩa là user đó có toàn quyền và override toàn bộ phân quyền, là user có khả
> năng vượt qua mọi quyền mà không cần cấu hình, user có role === admin là quản trị hệ thống chỉ được
> sử dụng trong trường hợp đặc biệt ngoài ra khi không có việc gì quan trọng thì quản trị hệ thống sẽ
> sử dụng tài khoản ITM hoặc tài khoản tương tự được cấp full quyền.»
⇒ **QUYỀN ĐẾN TỪ CẤU HÌNH**, ⛔ không chỉ từ `role`.

### BEFORE → AFTER (3 TẦNG — đo được, xem `TEST-20261008-003`)
| # | Tệp · vị trí | BEFORE | AFTER |
|---|---|---|---|
| ① | `ActionRbacRegistry.java` `ACTION_MODULES` | `Map.entry("save_user_access", List.of())` ⇒ **rỗng = default-DENY** (PHASE 0B S-03) | `Map.entry("save_user_access", List.of("admin_tab_06"))` |
| ② | `ActionRbacRegistry.java` `ACTION_CAPABILITIES` | `Map.entry("save_user_access", "canUse")` | `Map.entry("save_user_access", "canView")` — **khớp UI**: `hasAdminTab` (`AdminUserModalTabs.tsx:22`) và `canManageUserPermissions` (`app/page.tsx:3433`) đều kiểm `canView === 1` |
| ③ | `UserManagementUseCase.saveUserAccess` | `rbac.requireRole(principalAsCurrent(principal), List.of("admin"))` | `if (!rbac.isAdmin(…)) rbac.requireActionModule(…, "save_user_access")` — **đúng khuôn `update_user`** (MỐC 103) |
| ④ | `SystemController.java` `case "save_user_access"` | `AuthUseCase.CurrentUser cu = requireRequireAdmin(request);` | `… = requireCurrentUser(request, false);` — **đúng khuôn `update_user`** (MỐC 109) |

⛔ Tầng ③④ là **CÙNG LỖI đã vá cho `update_user`** ở MỐC 103/109 nhưng **SÓT `save_user_access`**
⇒ hai sửa đầu trở thành **CODE CHẾT** nếu ⛔ không sửa nốt ③④ (đo được qua việc thông điệp 403 **đổi 3 lần**).

### REASON
USER 08/10/2026: «bấm lưu thì nó không lưu phân quyền tôi vừa chọn cho user» — nguyên nhân (B):
UI cho người có `admin_tab_06` MỞ modal + tick, backend chặn ở **3 tầng** ⇒ **HTTP 403**, ⛔ không lưu gì.

### FILES
- `java-backend/application/…/rbac/ActionRbacRegistry.java` (2 dòng + chú thích)
- `java-backend/application/…/service/UserManagementUseCase.java` (1 khối guard)
- `java-backend/web/…/controller/SystemController.java` (1 case)
- `docs/agent-progress/F-03-TAI-CHINH-AUDIT-PHU-THUOC.md` (cập nhật 23 dòng số dòng Java — §22)
- `tools/probe-permission-save-api.mjs` (sửa phép đo sai + thêm B2b/B3)
- `tools/_fix-f03-lines.mjs` (mới)

### IMPACT
- ✅ Người có **`admin_tab_06` + `canView`** lưu được bảng phân quyền (đo: HTTP 200 + **ghi thật**).
- ✅ `role = admin` vẫn toàn quyền (nhánh `isAdmin`), ⛔ không đổi.
- ✅ Người ⛔ **thiếu quyền** vẫn **403** (đối chứng âm B3) ⇒ cổng ⛔ không hở.
- 🚨 **TÁC DỤNG PHỤ CẦN USER QUYẾT** — xem `BUG-20261008-002`: người có `admin_tab_06` nay có thể
  **tự cấp module `admin`** cho mình, mà module `admin` là cổng của `factory_reset_execute`
  (XOÁ DỮ LIỆU). Đây là hệ quả **trực tiếp của PA-1**, đã báo user, ⛔ CHƯA thêm guard (chờ quyết định).

### COMPATIBILITY
✅ ⛔ không đổi hợp đồng API · ⛔ không migration · ⛔ không đổi schema.
⚠️ Lệch có chủ ý với route JS cũ (`scripts/system-route.mjs`): route đó **KHÔNG được app đang chạy gọi**
(bằng chứng ghi ngay trong tệp, dòng ~3074-3075) ⇒ ⛔ không sửa. Cổng `probe-action-module-parity`
vốn **đã đỏ 64 điểm từ trước** (gồm `update_user` cùng loại) ⇒ thay đổi này thêm **1 dòng** cùng loại.

### TEST STATUS
✅ **PASS** — `tools/probe-permission-save-api.mjs` **EXIT 0** · Java **86/86** · cổng FE **865 pass/0 fail**.
Xem `TEST-20261008-003`.

## CHG-20261008-003 — ⛔ S-1: CHẶN TỰ NÂNG QUYỀN ở `save_user_access` (backend)

| ⭐ | ⭐ |
|---|---|
| **CHANGE_ID** | CHG-20261008-003 |
| **DATE** | 2026-10-08 14:00:00 |
| **SESSION_ID** | ERP-SESSION-01 (SESSION_A) |
| **CATEGORY** | RBAC · BACKEND |
| **MODULE** | `save_user_access` (`UserManagementUseCase`) |

**BEFORE** — ⛔ không có rào: người có `admin_tab_06` (sau PA-1) gọi được `save_user_access`
⇒ ⭐ **tự cấp module `admin`** cho chính mình ⇒ gọi `factory_reset_execute` = **XOÁ SẠCH DỮ LIỆU**
(`ActionRbacRegistry:154` map action đó vào module `admin`; controller ⛔ không `requireRequireAdmin`).

**AFTER** — chèn chốt NGAY TRƯỚC `clearUserScopes()`:
```java
if (!rbac.isAdmin(principalAsCurrent(principal)) && principal.userId().equals(targetUserId)) {
    for (… modulePermissions …) for (String[] cap : selfElevationCaps)
        if (intOf(row.get(cap[0])) == 1 && !rbac.canUseModule(targetUserId, moduleKey, cap[1]))
            throw new AuthUseCase.ApiError("Không được tự cấp thêm quyền cho chính mình. …", 403);
}
```
➕ `RbacService.canUseModule(userId, moduleKey, capability)` — lớp mỏng mở lại port `ModulePermissionStore`
đã nằm sẵn ở `RbacService` ⇒ ⛔ **không** phải đổi constructor của use-case (đổi sẽ lan sang cấu hình
Spring + mọi bài kiểm thử).

**REASON** — `DEC-20261008-002` (user chốt S-1) · nguồn gốc `BUG-20261008-002` (CRITICAL).
**FILES** — `java-backend/application/…/rbac/RbacService.java` · `…/service/UserManagementUseCase.java`
**IMPACT** — ⛔ không đổi hợp đồng API · ⛔ không migration. `role=admin` ⛔ không bị ảnh hưởng (ngoại lệ).
**TEST** — ✅ `TEST-20261008-005` (3 chiều) · Java **86/86**.

---

## CHG-20261008-004 — ✅ M-2: ≥1 quyền trong nhóm quản trị ⇒ HIỆN + VÀO ĐƯỢC màn quản trị

| ⭐ | ⭐ |
|---|---|
| **CHANGE_ID** | CHG-20261008-004 |
| **DATE** | 2026-10-08 14:00:00 |
| **SESSION_ID** | ERP-SESSION-01 (SESSION_A) |
| **CATEGORY** | RBAC · FRONTEND |
| **MODULE** | Menu nhóm «QUẢN TRỊ HỆ THỐNG» + màn «DANH MỤC & PHÂN QUYỀN» |

**BEFORE** — `systemAdminMenuVisible` chỉ xét `configuredModules(data)` (**mảng menu TĨNH**, ⛔ không có
14 khoá `admin_tab_NN`); `accessDenied` và điều kiện render `<Admin/>` thì **CHỈ `isAdminUser`** (role)
⇒ người được cấp `admin_tab_06`: **⛔ không thấy menu**; nếu có thấy thì **thân màn TRỐNG (0 tab)**.

**AFTER**
```ts
const hasAnyAdminGroupPermission = (data.modulePermissions || []).some((p) => {
  const key = String(p.moduleKey || "");
  if (!hasAnyCapability(p)) return false;
  return key === "admin" || /^admin_tab_\d{2}$/.test(key);   // ⭐ nhận CẢ 14 tab
});
const systemAdminMenuVisible = isAdminUser(data.user) || hasAnyAdminGroupPermission;
// accessDenied (nhánh admin)  : !isAdminUser(data.user) && !hasAnyAdminGroupPermission
// render <Admin …/>           : active === "admin" && (isAdminUser(data.user) || hasAnyAdminGroupPermission)
// mục con nhóm quản trị        : systemAdminMenuVisible && (hasAnyCapability(…) || hasAnyAdminGroupPermission)
```

**REASON** — `DEC-20261008-003` (user chốt M-2) + **ý định gốc MỐC 118** («kể cả 1 quyền cũng hiển thị menu»)
+ `BUG-20261008-003`.
**FILES** — `app/page.tsx` (3 chỗ) · `tests/m118-system-admin-menu-gate.test.mjs` (cập nhật theo **ý định gốc**, ⛔ không nới).
**IMPACT** — ✅ người có ≥1 quyền nhóm quản trị vào được màn; ⛔ **KHÔNG** hạ rào tab **12/13/14**
(`ADMIN_LOCKED_TABS` — tab 12 có `FactoryResetAdmin` XOÁ DỮ LIỆU) ✓
**TEST** — ✅ `TEST-20261008-006` E2E **11/11** · cổng FE **924/925 pass · 0 fail**.

## CHG-20261008-005 — ➕ **API TẠO/SỬA KHO + ĐỔI TRẠNG THÁI KHO** (`save_warehouse` · `set_warehouse_status`)

| ⭐ | ⭐ |
|---|---|
| **CHANGE_ID** | CHG-20261008-005 |
| **DATE** | 2026-10-08 16:10:00 |
| **SESSION_ID** | ERP-SESSION-01 (SESSION_A) |
| **CATEGORY** | API · BACKEND |
| **MODULE** | `inventory` + `central_warehouse` (capability `canEdit`) |

**BEFORE** — ⛔ **CHƯA CÓ** 2 action (quét `java-backend/**/*.java` = 0 kết quả). UI ⛔ không thể tạo/sửa/ngừng kho.

**AFTER** — 2 action đi đủ **3 tầng quyền**:
```text
① ActionRbacRegistry : save_warehouse / set_warehouse_status → ["inventory","central_warehouse"] + canEdit
② SystemController   : case "save_warehouse" / "set_warehouse_status" → requireCurrentUser(request)   (⛔ KHÔNG requireRequireAdmin)
③ AdminSystemUseCase : saveWarehouse(principal,payload) · setWarehouseStatus(principal,payload)
                       + accessScope.requireProjectAccess(...) khi tạo kho cho DỰ ÁN
                       + accessScope.requireWarehouseAccess(...) khi sửa / đổi trạng thái
```
➕ 4 hàm store THUẦN THÊM: `upsertWarehouse` · `setWarehouseActive` · `warehouseCodeExists` · `warehouseExists`.
➕ **KHÔNG** thêm khoá mới vào `module_catalog` (dùng lại nhóm của action anh em) ✓

**REASON** — `HANDOFF-20261008-009` (phiên 02 yêu cầu) · thứ tự phiên 02 chốt: **S01 làm API backend trước** → S03 nối UI → S02 bật 4 nút.
**FILES** — `AdminSystemStore.java` · `AdminSystemStoreAdapter.java` · `AdminSystemUseCase.java` · `ActionRbacRegistry.java` · `SystemController.java` · `AdminSystemIntegrationTest.java`
**IMPACT** — ⛔ không đổi hành vi action cũ · ⛔ không migration (bảng `warehouses` đã có sẵn) · ⛔ không đổi chữ ký hàm cũ.
**COMPATIBILITY** — ⭐ Java-only: action ⛔ **chưa có** trong `ACTION_CATALOG` phía JS ⇒ ⚠️ làm tăng độ lệch của
`probe-action-module-parity.mjs` (vốn **đã đỏ sẵn** 64 dòng, ⛔ không do thay đổi này). ⚠️ Cần phiên nào đó
sinh lại catalog khi nối UI — ⛔ **KHÔNG** tự sinh ở đây (hợp đồng ghi rõ catalog sinh TỪ JS).
**TEST** — ✅ `TEST-20261008-007` · **STATUS** ✅ **FIXED + VERIFIED**

---

## TEST-20261008-007 — ✅ **INTEGRATION**: API kho (H2) — 2 ca mới XANH · hồi quy **88/88**

| ⭐ | ⭐ |
|---|---|
| **TEST_ID** | TEST-20261008-007 · **DATE** 2026-10-08 16:10 |
| **SESSION_ID** | ERP-SESSION-01 (SESSION_A) · **TEST_TYPE** INTEGRATION (SpringBootTest + H2 `jdbc:h2:mem:vntech`) |
| **TOOL** | `AdminSystemIntegrationTest` (mở rộng chính bộ test có sẵn — ⭐ §17) |

| Ca | Kỳ vọng | Kết quả |
|---|---|---|
| `saveWarehouse_taoMoiVaChanTrungMa` — tạo `WH-TEST-01` | 200 + `ok` | ✅ |
| ⛔ mã trùng **KHÁC hoa/thường** (`wh-test-01`) | **400** + «Mã kho WH-TEST-01 đã tồn tại.» | ✅ |
| ⛔ thiếu `name` | 400 | ✅ |
| `setWarehouseStatus_ngungRoiBatLaiDuoc` — ngừng `WH-CENTRAL` | 200 | ✅ |
| ⭐ **BẬT LẠI** kho đang `active=0` | **200** (⛔ không được 400) | ✅ |
| ⛔ `id` không tồn tại | 400 | ✅ |

**HỒI QUY** — ✅ `AdminSystemIntegrationTest` **9/9** (trước 7) · ✅ **toàn bộ Java: 88 test · 0 fail · 0 error** (trước 86) · ✅ `tsc` EXIT 0
**MÔI TRƯỜNG** — H2 in-memory (⛔ an toàn với MySQL thật) · build fat jar + chạy lại backend (healthy) · 3 cổng `:8787` `:9000` `:18081` sống ✓
**GHI CHÚ** — ⛔ **CHƯA E2E qua UI**: bước 7 (FE modal `warehouse`/`allocate`) ⛔ chưa làm; ⚠️ và phần `allocate`
**phải phối hợp với phiên đang giữ `app/screens/AllocateReturn.tsx`** (xem `HANDOFF-20261008-002` §40) ✓

## CHG-20261008-006 — ➕ **FE: MODAL KHO** nối vào `page.tsx` (TÁI DÙNG component phiên 02) + ⚠️ **ĐÍNH CHÍNH HỢP ĐỒNG** `warehouseId`

| ⭐ | ⭐ |
|---|---|
| **CHANGE_ID** | CHG-20261008-006 |
| **DATE** | 2026-10-08 16:40:00 |
| **SESSION_ID** | ERP-SESSION-01 (SESSION_A) |
| **CATEGORY** | FRONTEND · API |
| **MODULE** | Kho — `inventory` / `central_warehouse` |

### PHẦN 1 — NỐI FE (bước 7/8 của `HANDOFF-20261008-009`)
⛔ **KHÔNG viết modal mới** — ⭐ **TÁI DÙNG** `app/screens/WarehouseFormModal.tsx` do **`ERP-SESSION-02` dựng**
(§17 «REUSE»), chỉ ➕ 1 import + 1 case trong `app/page.tsx`:
```tsx
{modal === "warehouse" && <WarehouseFormModal
  data={{ warehouses: data.warehouses, projects: data.projects }}
  row={selected} close={() => setModal(null)} submit={action}
  canEdit={modulePermission(data, "inventory").canEdit || modulePermission(data, "central_warehouse").canEdit} />}
```
⭐ `canEdit` do **nơi gọi** quyết định — đúng như component ghi rõ («VIỆC KIỂM QUYỀN thuộc nơi gọi»), dùng
CÙNG nhóm module với tầng RBAC của action ⇒ ⛔ không lệch luật giữa UI và API ✓

### ⚠️⚠️ PHẦN 2 — ĐÍNH CHÍNH `CHG-20261008-005`: LỆCH TÊN KHOÁ GIỮA 2 BÊN (⭐ đã sửa ở PHÍA S01)
📏 **ĐỌC MÃ NƠI GỌI TRƯỚC KHI CHỐT** mới phát hiện: component gửi
`submit("save_warehouse", { **warehouseId**, projectId, code, name })`
⚠️ NHƯNG use-case S01 viết đọc `payload.get("id")` ⇒ ⭐ **«Sửa kho» ⛔ LUÔN bị coi là TẠO MỚI** ⇒ trùng mã ⇒ **400**.
🔎 **QUY ƯỚC NHÀ LÀ `warehouseId`** — chính `saveWarehouseLocation` (action anh em) cũng đọc `warehouseId` ⇒
**S01 SAI**, ⛔ không phải phiên 02.
✅ **FIX Ở PHÍA S01** (`AdminSystemUseCase`), ⛔ **KHÔNG** sửa tệp của phiên 02:
```java
String id = trim(payload.get("warehouseId"));
if (id.isEmpty()) id = trim(payload.get("id"));   // ⭐ nhận CẢ HAI ⇒ ⛔ không vỡ bên nào
```
⚠️ **ĐÃ BUILD LẠI + CHẠY LẠI BACKEND** — ⛔ nếu chỉ build 1 lần trước đó thì **jar đang chạy THIẾU bản vá này** ✓

### PHẦN 3 — HỆ QUẢ BẮT BUỘC: SỬA `F-03`
Việc chèn dòng vào `ActionRbacRegistry.java` làm **bảng action↔số dòng** trong
`docs/agent-progress/F-03-TAI-CHINH-AUDIT-PHU-THUOC.md` **lệch** ⇒ cổng `F-03` ĐỎ.
✅ Chạy **công cụ có sẵn** `tools/_fix-f03-lines.mjs` (⭐ có kiểm khuôn trước khi ghi): cập nhật **23 dòng** ⇒ **F-03 7/7 XANH**.

**TEST** — ✅ `TEST-20261008-008` · **STATUS** ✅ **FIXED + VERIFIED**
**RELATED** — `HANDOFF-20261008-009` · `CHG-20261008-005` · `DEV-20261008-003`

---

## TEST-20261008-008 — ✅ **BUILD + HỒI QUY** sau khi nối FE modal kho & vá `warehouseId`

| ⭐ | ⭐ |
|---|---|
| **TEST_ID** | TEST-20261008-008 · **DATE** 2026-10-08 16:40 |
| **SESSION_ID** | ERP-SESSION-01 (SESSION_A) · **TEST_TYPE** REGRESSION + UI |
| **RELATED** | `CHG-20261008-006` |

| Cổng | Kết quả |
|---|---|
| `npx tsc --noEmit` | ✅ **EXIT 0** |
| `fixpoint-fingerprint` | ✅ FIXPOINT OK |
| `npm run build` | ✅ BUILD SUCCESS + `BUILT ARTIFACT VALIDATION: ĐẠT` |
| `_sync-identity-once` | ✅ `VNTECH-KHO-MEP-001` + `TRUST-ROOT` KHỚP · trigger tạo lại |
| **Cổng UI** `verify-ui-build-applied` | ✅ `dist mới hơn nguồn` · `vân tay khớp SSOT` · **6/6 bundle đúng byte** |
| **Cổng FE** `regression-suite` | ✅ **931 test · 930 pass · 0 fail** (⚠️ trước đó 1 đỏ ở `F-03` — đã sửa bằng công cụ nhà) |
| **Java** `mvn -B test` (chạy lại SAU bản vá `warehouseId`) | ✅ **88 test · 0 fail · 0 error** · `AdminSystemIntegrationTest` **9/9** |
| Triển khai | ✅ build fat jar + chạy lại backend (healthy) · 3 cổng `:8787` `:9000` `:18081` sống |

**GHI CHÚ ⚠️** — ⛔ **CHƯA có E2E bấm-thử modal kho qua UI** (bước 7b chưa làm): phép đo hiện tại mới chứng
minh **biên dịch + bundle + hồi quy**, ⛔ chưa chứng minh «mở modal từ màn Kho ⇒ lưu được».
⭐ Điều kiện cần đã đủ (API sống + component khớp khoá) — cần 1 probe UI màn Kho ở lượt sau ✓

## CHG-20261008-007 — Sửa 4 cổng UI đọc SAI nguồn quyền · vá gương H2 của V39 · thêm công cụ chặn tái phát migration

| ⭐ | ⭐ |
|---|---|
| **CHANGE_ID** | CHG-20261008-007 · **DATE** 2026-10-08 18:30 · **SESSION_ID** ERP-SESSION-01 |
| **CATEGORY** | `FRONTEND` · `DATABASE` · `DEVOPS` |
| **RELATED** | `BUG-20261008-009` · `BUG-20261008-012` · `BUG-20261008-011` · `DEV-20261008-008` |

### ① Sửa 4 cổng UI đọc sai nguồn quyền (`BUG-20261008-009`)
| | |
|---|---|
| **BEFORE** | `app/page.tsx`: `canViewAudit` · **`canAdministerStaff`** · `canManageRole` · **`canManageUserPermissions`** đọc `(data.allModulePermissions \|\| []).some(…)` — ⚠️ trường này bootstrap **CHỈ gửi khi `admin === true`** (`BootstrapDataAdapter.java:943`) ⇒ ⭐ với **mọi non-admin** mảng **RỖNG** ⇒ 4 cổng **LUÔN `false`** ⇒ **quyền uỷ nhiệm vô hiệu** trên giao diện ✓ |
| **AFTER** | 4 cổng đọc **`data.modulePermissions`** (quyền của **chính** người đăng nhập — ⭐ nguồn **luôn có**); ⛔ **KHÔNG** đụng **7 chỗ** còn lại đọc quyền **NGƯỜI KHÁC** (bảng tài khoản · KPI · ngoại lệ · nhân sự kho · ứng viên duyệt) |
| **REASON** | ⭐ đóng **cả họ** bug «quyền uỷ nhiệm vô hiệu» (`BUG-005/006/008/009`) — cùng một điểm yếu kiến trúc «2 nguồn quyền» |
| **FILES** | `app/page.tsx` (4 dòng) · `tests/self-permission-source.test.mjs` (**mới** — 5 ca, ⭐ có **đối chứng âm** cấm thay bừa) |
| **IMPACT** | ⭐ Người được uỷ nhiệm `admin_tab_01/06/11` nay **dùng được** các chức năng tương ứng; ⛔ không đổi hành vi với `role=admin` (nhánh `isAdminUser` chặn trước) |
| **COMPATIBILITY** | ✅ Tương thích ngược — ⛔ không đổi API, ⛔ không đổi CSDL |
| **TEST** | ✅ `tsc` = 0 · ✅ 5 ca mới · ✅ cổng FE **955 test · 954 pass · 0 fail** |
| **STATUS** | ✅ **VERIFIED** |

### ② Vá `schema-h2.sql` — thiếu gương `issue_id` của V39 (`BUG-20261008-012`)
| | |
|---|---|
| **BEFORE** | `java-backend/web/src/test/resources/schema-h2.sql`: bảng `stock_reservations` **⛔ thiếu** cột `issue_id` ⇒ mã mới của S2 `INSERT … issue_id …` ⇒ **`BadSqlGrammarException`** ⇒ **2 test LỖI** (`StockIssueWorkflowSteps345Test` · `SupplyChainEndToEndIntegrationTest`) |
| **AFTER** | Thêm **1 dòng** `` `issue_id` VARCHAR(64) NULL `` (⭐ **đúng kiểu của `V39`**: `NULL`, ⛔ không `NOT NULL`) |
| **REASON** | ⚠️ Schema H2 của test **chưa cập nhật kịp** MySQL — ⛔ **không phải lỗi sản phẩm** |
| **FILES** | `java-backend/web/src/test/resources/schema-h2.sql` (**1 dòng**) |
| **TEST** | ✅ `Tests run: 88, Failures: 0, Errors: 0` · **BUILD SUCCESS** |
| **STATUS** | ✅ **FIXED** |

### ③ Thêm công cụ chặn tái phát `BUG-20261008-011` (`DEV-20261008-008`)
| | |
|---|---|
| **BEFORE** | ⛔ Không có cách nào phát hiện trước migration **sắp chạy** mà ⛔ không idempotent ⇒ sự cố `V39` (🔴 **backend DOWN**) chỉ lộ ra **khi khởi động** |
| **AFTER** | `tools/check-migration-idempotency.mjs` (**mới**, ⭐ **chỉ ĐỌC**): lọc theo `flyway_schema_history` ⇒ chỉ xét migration **SẮP CHẠY** ⇒ dò `ADD COLUMN`/`CREATE INDEX`/`CREATE TABLE`/`ADD CONSTRAINT` ⛔ thiếu guard |
| **REASON** | ⭐ **phòng ngừa** loại lỗi đã làm **chết cả hệ thống**; ⛔ không sửa tệp migration của phiên khác (§19) |
| **FILES** | `tools/check-migration-idempotency.mjs` (**mới**) |
| **IMPACT** | ⛔ Không ảnh hưởng runtime/CSDL — ⭐ công cụ vận hành, chạy trước khi deploy |
| **TEST** | ✅ Mặc định: **38 tệp · 0 đang chờ ⇒ ⛔ không rủi ro** · ⭐ **ĐỐI CHỨNG ÂM** `--tat-ca`: gắn cờ **9/38, có đúng `V39`** ⇒ ⭐ phép dò **CÓ THỂ ĐỎ** ✓ |
| **STATUS** | ✅ **DONE** (⭐ đề nghị S2 xử lý **tận gốc** V39 — đã báo) |

### ④ Sửa phép đo của probe E2E (⛔ không phải thay đổi sản phẩm — ⭐ ghi để minh bạch)
| | |
|---|---|
| **BEFORE** | `tools/probe-grant-1-perm-e2e.mjs`: đổi danh tính ⛔ không nạp lại trang · đếm nút ⛔ không chờ bảng render · kỳ vọng **sai đề** ⇒ `12/13 + 1 finding` |
| **AFTER** | `dangNhapLai` (login + nạp lại) · `choBangTaiKhoan` (**poll**) · phép kiểm theo **hợp đồng thật** + **2 phép kiểm §22** (width & vùng tiêu đề **bất biến**) |
| **TEST** | ⭐ **15/15 ĐẠT · hết `finding`** |
| **STATUS** | ✅ **DONE** |

## BUG-20261008-013 (KHÉP) — ✅ **USER CHỐT `U-1` + ĐÃ THI HÀNH + ĐÃ ĐO**: người uỷ nhiệm quản trị nay thấy dữ liệu **TRONG PHẠM VI**

| ⭐ | ⭐ |
|---|---|
| **BUG_ID** | BUG-20261008-013 · **STATUS** ✅ **FIXED (code + test) + VERIFIED (đo runtime)** |
| **DATE** | 2026-10-08 20:15 · **SESSION** ERP-SESSION-01 |
| **QUYẾT ĐỊNH** | ⭐ **USER chốt `U-1`**: người được uỷ nhiệm thấy tài khoản **TRONG PHẠM VI của mình** (⛔ không toàn bộ như admin) ✓ |

### 🔧 ĐÃ SỬA GÌ (⭐ 1 tệp, ⛔ không đụng nhánh admin ⇒ **zero regression**)
`java-backend/…/persistence/BootstrapDataAdapter.java`:
1. **Thêm khối U-1** — `if (!admin)` ⇒ nếu có **≥1 quyền nhóm quản trị** (`admin`/`admin_tab_*`, `can_view=1`, còn hạn — ⭐ dùng **đúng khuôn truy vấn `modulePermissions`** sẵn có) thì nạp:
   · `users` = **chính mình** ∪ **người cùng dự án trong phạm vi** (`ctx.visibleProjectIds()`)
   · `adminProjects` = chỉ dự án trong phạm vi · `userScopes` = chỉ scope thuộc dự án trong phạm vi
   ⛔ **GIỮ admin-only** (⭐ U-1 ⛔ không áp): `allModulePermissions` · `emailOutbox` · `emailRecipients` ✓
2. ⭐ **Vị trí nạp: SAU `blank(...)`** — ⚠️ vì `blank` là **GHI ĐÈ CÓ CHỦ ĐÍCH (CƠ CHẾ AN NINH)** ✓

### ⚠️⚠️ 3 CÁI BẪY TÔI ĐÃ TRẢ GIÁ (⭐ ghi đủ để ⛔ không lặp)

| # | Bẫy | 📏 Đo được | ✅ Đáp án đúng |
|---|---|---|---|
| 1 | Nạp U-1 **TRƯỚC** `blank(...)` | ⛔ `soUsers = 0` **dù SQL trả đúng** (8 tài khoản) ⇒ ⭐ `blank` **xoá sạch** | **Nạp SAU `blank`** |
| 2 | Sửa `blank` thành «chỉ điền khi **THIẾU**» | ⛔ **LÀM ĐỎ test an ninh** `RequestOverdueReasonTest` MT2-P4-02 («user cấp THẤP ⛔ KHÔNG được thấy vùng duyệt ⇒ **phải bị `blank`**») | ⛔ **KHÔNG đổi ngữ nghĩa `blank`** — nó là **an ninh**, ⛔ không phải tiện ích |
| 3 | Dời khối bằng **script PowerShell** dò `}` theo `^\s{8}\}` (⚠️ dấu đóng thật ở **4 space**) | ⛔ **LỖI BIÊN DỊCH** `[2140,1] class, interface, enum, or record expected` (code lạc sau `}` của class) | ⭐ **Khôi phục từ HEAD + vá bằng `edit` có NEO chính xác** (đọc tệp trước) ✓ |

📌 **BÀI HỌC (D-102)**: ⛔ **đừng dùng script dò ngoặc để DI CHUYỂN khối mã** (⚠️ ngoặc trong SQL/comment làm sai phép đếm) — ⭐ dùng công cụ sửa có **neo văn bản** và **đọc định dạng thật trước khi vá** ✓
📌 **BÀI HỌC (D-103)**: trong hệ này `blank(...)` là **cơ chế AN NINH** (xoá-trắng theo cấp bậc) — ⛔ **tuyệt đối không đổi ngữ nghĩa**; muốn dữ liệu sống sót thì **nạp SAU nó** ✓

### 📏 NGHIỆM THU (⭐ đo runtime trên trình duyệt thật — ⛔ không chỉ đọc mã)
| Phép đo | Trước | **Sau** |
|---|---|---|
| `data.users` của người uỷ nhiệm (non-admin, `ksda`) | ⛔ **0** | ⭐ **12** |
| `data.userScopes` | ⛔ 0 | ⭐ **12** |
| Dòng bảng tài khoản | 1 | ⭐ **12** |
| Nút «Sửa tài khoản» | ⛔ 0 | ⭐ **12** |
| Modal sửa tài khoản | ⛔ không mở được | ⭐ **MỞ được** (5 tab + select vai trò) |

⇒ ⭐ **4 cổng `page.tsx` (`BUG-009`) nay CHẠM TỚI ĐƯỢC + CHẠY ĐÚNG ở runtime** ⇒ ⭐ **`BUG-009` khép nốt phần đo runtime** ✓
| Cổng | Kết quả |
|---|---|
| Java `mvn -B test` | ✅ **88/88** (0 failure · 0 error — ⭐ **kể cả test an ninh MT2-P4-02**) |
| Probe E2E `probe-grant-1-perm-e2e.mjs` | ✅ **17/17 ĐẠT · hết `finding`** |
| Cổng FE | ✅ **955 test · 954 pass · 0 fail** |
| Cổng UI | ✅ **6/6 bundle đúng byte** · vân tay `bb706f1202490077` |
| CSDL kho | ✅ **12 / 5 / 10** (khớp audit) |
