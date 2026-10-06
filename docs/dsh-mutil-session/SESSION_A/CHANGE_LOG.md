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

