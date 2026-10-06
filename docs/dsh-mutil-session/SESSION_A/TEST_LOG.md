# TEST_LOG — SESSION_A (ERP-SESSION-01)

> Phien: **ERP-SESSION-01** · Timezone Asia/Ho_Chi_Minh (UTC+7) · Pham vi: **PHAN QUYEN + BAO LOI + MUA HANG/GIAO NHAN**
> ⭐ **§4**: ⭐ Ghi **MOI bai test quan trong** — ⭐ dac biet: **bug fix · hotfix · workflow · RBAC · thay doi CSDL · shared component · thay doi UI quan trong** ✓
> ⭐ **RESULT**: `PASS` / `FAIL` / `PARTIAL` / `N/A` ✓

---

## TEST-20261006-001

Date: 2026-10-06
Session: ERP-SESSION-01
Task: TASK-20261006-001 (9 ban va Java)
Module: Toan he thong (backend Java)
Test Type: API + INTEGRATION
Scenario: Goi lai cac API tung tra HTTP 500 bang payload rong/khong day du (⭐ 5 kich ban nghiem thu) + goi `preview_material_dependencies` voi payload that.
Expected: ⛔ Khong con HTTP 500 · tra HTTP 200 voi du lieu dung.
Actual: ⭐ **5/5 DAT · 0 LOI**. ⭐ `preview_material_dependencies` ⇒ **HTTP 200 · 237 vat tu**.
Result: PASS
Regression: PASS
Environment: `:9000` (proxy → Java `:18081`) · du lieu that MySQL `vntech_erp`
Related Bug: (4 loi HTTP 500)
Related Change: CHG-20261006-001
Notes: ⭐ Trien khai: JAR moc **2026-10-06 12:50:20** · PID **16148**.

---

## TEST-20261006-002

Date: 2026-10-06
Session: ERP-SESSION-01
Task: TASK-20261006-002 (BUG-20261006-001)
Module: Quan tri — bang bao loi
Test Type: API + MANUAL (user)
Scenario: Dang nhap bang tai khoan `admin` ⇒ goi `error_reports` ⇒ mo tab buoc 14.
Expected: ⭐ Danh sach bao loi **hien du** (⛔ khong rong).
Actual: ⭐ API tra **HTTP 200 · 18 bao cao** (⭐ do that bang `Invoke-WebRequest`) · ⭐ **USER XAC NHAN BANG MAT**: «**da hien thi bao loi**».
Result: PASS
Regression: PASS
Environment: `:9000` · tai khoan `admin`
Related Bug: BUG-20261006-001
Related Change: CHG-20261006-002 (⭐ va prop `submit={requestApi}`)
Notes: ⭐ **USER VERIFICATION** ⇒ dieu kien du de chuyen `VERIFIED` (§24).

---

## TEST-20261006-003

Date: 2026-10-06
Session: ERP-SESSION-01
Task: TASK-20261006-003 (BUG-20261006-002)
Module: Quan tri — modal «Bao loi»
Test Type: API + UI
Scenario: ⭐ **DO THAT** bo loc cu vs bo loc moi tren `moduleCatalog` cua bootstrap that.
Expected: Dropdown co **~75 muc** (76 tru `admin`).
Actual: ⭐ Bo loc CU = **0/76 muc** · ⭐ bo loc MOI = **75 muc** ✓
Result: PASS
Regression: PASS
Environment: `:9000` · bootstrap that (`GET /api/system`)
Related Bug: BUG-20261006-002
Related Change: CHG-20261006-002
Notes: ⭐ Nguyen nhan: bootstrap tra **boolean `true`** (⛔ khong phai so `1`).

---

## TEST-20261006-004

Date: 2026-10-06
Session: ERP-SESSION-01
Task: TASK-20261006-004 (BUG-20261006-003)
Module: Phan quyen nguoi dung · Java backend
Test Type: UNIT (integration test Java) + REGRESSION
Scenario: ⭐ `mvn -o test` — ⭐ **toan bo bo test Java** sau khi bo chot `P5.3` va **viet lai** bai `AdminGovernanceIntegrationTest`.
Expected: **156/156 · 0 loi**.
Actual: ⭐ **156/156 · 0 loi** ✓
Result: PASS
Regression: PASS (⭐ bai test cu da duoc cap nhat — ⛔ khong noi cong, khang dinh **manh hon**)
Environment: Maven (H2 in-memory) · `java-backend`
Related Bug: BUG-20261006-003
Related Change: CHG-20261006-003
Notes: ⚠️ ⭐ **`mvn -o test` 156/156 ⛔ KHONG chung minh SQL chay duoc** (H2 de tinh hon MySQL) — ⭐ bai hoc nay da dan den loi F2.

---

## TEST-20261006-005

Date: 2026-10-06
Session: ERP-SESSION-01
Task: TASK-20261006-005 (BUG-20261006-004 + -005)
Module: Phan quyen phong ban (AD-08)
Test Type: UI + INTEGRATION (**KIEM CHUOI DAC TRUNG TRONG BUNDLE PHUC VU**)
Scenario: ⭐ Tai bundle dang phuc vu **tu CA HAI cong** `:8787` va `:9000` ve dia ⇒ tim **chuoi tieng Viet RAW**.
Expected: ⭐ 7/8 chuoi dac trung CO.
Actual: ⭐ **7/8 CO** ✅ — «Khong tai duoc danh sach bao loi» · «Chi tai khoan duoc cap quyen xem bao loi moi mo duoc buoc nay» · «Chon ca dong cho tat ca chuc nang» · «Ca dong» · «crow» · «Nhom chuc nang» · «Da xoa ». ℹ️ 1 chuoi `coQuyenBaoLoi` ⛔ KHONG tim duoc — ⭐ **DUNG LA PHAI VAY** (⭐ ten bien noi bo bi minify doi ten).
Result: PASS
Regression: PASS
Environment: `:8787` + `:9000` · bundle `page-CcbWX2ln.js` (1038,4 KB)
Related Bug: BUG-20261006-004 · -005
Related Change: CHG-20261006-004
Notes: ⭐ **PHUONG PHAP DUNG** (⭐ toi da sai **6 lan** truoc khi tim ra): ⭐ ① dung **`href`** (⛔ khong chi `src`) · ② **tai ve dia** roi doc (⛔ dung doc `Content` truc tiep) · ③ tim chuoi **RAW** (⭐ bundle luu RAW, ⛔ KHONG escape) · ④ ⛔ **dung tim TEN BIEN NOI BO** (minify doi ten) ✓

---

## TEST-20261006-006

Date: 2026-10-06
Session: ERP-SESSION-01
Task: TASK-20261006-006 (BUG-20261006-006)
Module: Quan tri — buoc 14
Test Type: API + MANUAL (user) + REGRESSION
Scenario: ⭐ Do `allModulePermissions` cua **chinh** tai khoan `admin` ⇒ xac dinh `hasAdminTab` tra gi ⇒ sau khi sua, kiem lai bang mat.
Expected: ⭐ `admin` mo duoc tab · ⭐ nguoi thieu quyen **van bi khoa** (giu yeu cau BUG-B).
Actual: ⭐ **DO THAT**: `so_dong_quyen` cua `admin` = **0** · `allModulePermissions` cua chinh `admin` = **0** ⇒ `hasAdminTab` tra **FALSE** ⇒ ⭐ **NUT BI KHOA OAN**. ⭐ Sau khi sua: ⭐ **USER XAC NHAN BANG MAT**.
Result: PASS
Regression: PASS
Environment: `:9000` · MySQL `vntech_erp` · `npm test` **802/0** · build **EXIT=0** · cong UI **3/3**
Related Bug: BUG-20261006-006
Related Change: CHG-20261006-005
Notes: ⭐ **BAI HOC**: `hasAdminTab` ⛔ **khong thay the duoc** `isAdminUser` — ⭐ `RbacService` **loai tru vai tro `admin`** khoi kiem module ⇒ ⭐ **UI phai tinh ca vai tro `admin`**.

---

## TEST-20261006-007

Date: 2026-10-06
Session: ERP-SESSION-01
Task: TASK-20261006-007 (**F2**)
Module: Mua hang / Giao nhan
Test Type: UNIT (integration test Java) + **API runtime** + REGRESSION
Scenario: ① `mvn -o test` (⭐ **toan bo**, sau khi sua schema test + them cong chan + them `approve_po` vao 2 bai). ② ⭐ **KIEM CHUNG RUNTIME**: goi THAT `receive_goods` voi PO `PO-PRJ-DEMO-01-2026-0006` (trang thai `pending_approval`).
Expected: ① **156/156**. ② ⭐ HTTP 400 + thong diep moi + **⛔ KHONG ghi du lieu**.
Actual: ① ⭐ **156/156 · 0 loi**. ② ⭐ **HTTP 400** + dung thong diep «PO chua duoc phat hanh nen chua the giao nhan…» · ⭐ **DOI CHUNG**: `status` **KHONG doi** · `so_GRN` **KHONG tang** ⇒ **cong chan DA NGAN viec ghi**.
Result: PASS
Regression: PASS
Environment: Maven (H2) · `:9000` · MySQL that
Related Bug: BUG-20261006-007 (F2)
Related Change: CHG-20261006-006
Notes: ⚠️ ⭐ **TOI DA DOAN SAI 3 LAN** truoc khi tim ra goc: ① «thieu quyen `purchasing`» ⇒ **SAI** (`RbacService` loai tru `admin`) · ② «chua biet» · ③ **sua SAI TEP** (`web/src/**main**/.../demo/schema-h2.sql`). ⭐ **GOC THAT** chi lo ra khi **DOC NGAN XEP LOI THAT** (`Column "decision_reason" not found` tai `PurchaseStoreAdapter.decidePo:268`).

---

## TEST-20261006-008

Date: 2026-10-06
Session: ERP-SESSION-01
Task: TASK-20261006-008 (BUG-20261005-005)
Module: Kho / Van chuyen
Test Type: DATABASE + INTEGRATION
Scenario: ⭐ Sau khi ghi bu 10 dong `contract_stock_ledger` ⇒ thu nhan lai **ca 5 phieu** `central_returns` dang ket `in_transit`.
Expected: ⭐ Ca 5 phieu nhan duoc · so kho dung.
Actual: ⭐ `central_returns.in_transit` **5→0** · `transfer_orders.in_transit` **0** · so kho (ledger) **96→101** · xuat hien `CENTRAL_RETURN_RECEIVE = **5**` ⇒ ⭐ **ca 5 phieu DA NHAN DUOC**.
Result: PASS
Regression: PASS
Environment: `:9000` · MySQL that · sao luu `backup_csl_20261006` (**150 dong**)
Related Bug: BUG-20261005-005
Related Change: CHG-20261006-007
Notes: ⚠️ ⭐ Toi tung khang dinh «`reconcileContractStock` sua duoc so kho» — ⭐ **SAI**, no **chi doi chieu (write=false)** ⇒ da dinh chinh.

---

## TEST-20261006-009

Date: 2026-10-06
Session: ERP-SESSION-01
Task: TASK-20261006-009 (don 570 dong quyen mo coi)
Module: Phan quyen — CSDL
Test Type: DATABASE + REGRESSION
Scenario: ⭐ **DOI CHIEU BANG SAO LUU** `backup_ump_20261006` (chup **TRUOC** khi xoa) ⇒ xac dinh dong nao bi xoa va **co thuoc `e2e.*` khong**.
Expected: ⭐ Mo coi **570→0** · dong **HOP LE 1628 KHONG DOI** · ⭐ **«dong bi xoa thuoc `e2e.*`» = 0**.
Actual: ⭐ Mo coi **570→0** ✓ · hop le **1628 KHONG DOI** ✓ · ⭐ **«dong bi xoa thuoc `e2e.*`» = 0** ✓ · ca 14 tai khoan `e2e.*` giu nguyen **59–60 dong** ✓
Result: PASS
Regression: PASS
Environment: MySQL that `vntech_erp`
Related Bug: —
Related Change: CHG-20261006-009
Notes: ⭐ **CACH CHUNG MINH «KHONG PHA DU LIEU»**: ⭐ luon **sao luu truoc** + ⭐ **doi chieu so luong theo tung nhom** ✓

---

## TEST-20261006-010

Date: 2026-10-06
Session: ERP-SESSION-01
Task: TASK-20261006-010 (nghiem thu E2E)
Module: Toan he thong
Test Type: **E2E** (8 bo go-live)
Scenario: ⭐ Chay 8 bo E2E trong `tools/e2e/`: `go-live-bao-loi-danh-dau-xong` · `go-live-phu-toan-bo-delete` · `go-live-kiem-30-action-con-lai` · `go-live-kiem-ung-vien-500` · `go-live-kiem-tham-so-meo` · `go-live-thanh-cong-danh-muc-vt` · `go-live-chuoi-kho` · `go-live-thanh-cong-chung-tu-kt`.
Expected: ⭐ **8/8 DAT**.
Actual: ⭐ **7/8 DAT** — bao loi **3/3** · delete **34 PASS** · 30 action **30/30** · payload rong **8/8** · `save_*` meo **49/49** · danh muc VT **7/7** · chung tu KT **6/6** · ⚠️ **chuoi kho 5/9**.
Result: **PARTIAL**
Regression: PASS (⭐ ⛔ **KHONG co regression** tu 7 ban va)
Environment: `:9000` · MySQL that · tai khoan `e2e.*` + `admin`
Related Bug: —
Related Change: —
Notes: ⚠️ ⭐ `go-live-chuoi-kho` **5/9** — ⛔ **HONG vi THIEU QUYEN tai khoan `e2e.*`** (⭐ ca 6 loi CUNG thong diep «Tai khoan chua duoc quan tri vien cap dung quyen cho thao tac nay» = **HTTP 403**). ⭐ **CHUNG MINH ⛔ KHONG do phien nay**: ⭐ doi chieu `backup_ump_20261006` ⇒ `e2e.cht` **60→60**. ⚠️ Can cap 5 module: `teams` · `warehouse_issue` · `approvals` · `stocktake` · `inventory` ⇒ ⭐ **CAN USER CHO PHEP GHI CSDL**.

---

## TEST-20261006-011

Date: 2026-10-06
Session: ERP-SESSION-01
Task: TASK-20261007-001 (BUG-20261007-001)
Module: Phan quyen phong ban (AD-08) + Frontend
Test Type: **REGRESSION** (`npm test` = lint + typecheck + regression + workflow) + **PERFORMANCE** (do thoi gian API) + **DATABASE**
Scenario: ① ⭐ **DO THOI GIAN 1 loi goi** `save_department_permission` tren `:9000`. ② ⭐ Truy van `department_module_permissions` cua phong `ORG-BGD` (⭐ `updated_at` theo thoi gian). ③ ⭐ `npm test` sau khi **hoan nguyen** ve ban goc + **them lai** dong khai bao.
Expected: ① Biet duoc thoi gian 1 loi goi. ② Biet **module nao da luu, module nao chua**. ③ `npm test` **XANH**.
Actual: ① ⭐ **11,50 GIAY** (HTTP 200 · thong diep «Da luu quyen phong ban cho chuc nang "stocktake"; **dong bo lai 27 tai khoan**») ⇒ ⭐ suy ra «Chon tat ca» (61 module) ≈ **701 giay ≈ 11,7 phut**. ② ⭐ `updated_at` chay **13:33:19.122 → 13:40:09.404** (~7 phut) roi **DUNG** ⇒ ⭐ **55/61 module DA luu** · ⚠️ **6 module CHUA** (`dept_plan_contracts` · `dept_plan_price_data` · `dept_plan_suppliers` · `dept_plan_supply` · `payments` · `supplier_catalog` — van giu `updated_at = 2026-09-18`). ③ ⭐ `npm test` **EXIT=0 · pass 802 · fail 0 · 0 errors** ✓
Result: **PARTIAL** (⭐ chan doan **PASS** · ⛔ **sua CHUA xong**)
Regression: PASS
Environment: `:9000` · MySQL that · `npm test` · 27 tai khoan dang hoat dong
Related Bug: BUG-20261007-001
Related Change: CHG-20261006-011
Notes: ⚠️ ⭐ **THU 4 LAN SUA — CA 4 LAN DEU BI ESLint DO**: «**Cannot reassign variables declared outside of the component/hook**». ⭐ **NGUYEN NHAN THAT** (⭐ tim ra o lan thu 5): ⭐ **lan sua DAU TIEN da XOA MAT dong khai bao `let ok = 0, that = 0, loiDau = "";` cua `deleteSelected()`** ⇒ no **gan vao bien cua `save()`** ⇒ ESLint bao **DUNG**. ⭐ Da **them lai** ⇒ **XANH**. ⭐ **LUAT**: **khi `edit` thay mot KHOI DAI ⇒ PHAI giu lai MOI dong khai bao** ✓

---

## TEST-20261006-012

Date: 2026-10-06
Session: ERP-SESSION-01
Task: TASK-20261006-011 (dieu phoi da phien)
Module: DevOps / Dieu phoi
Test Type: INTEGRATION (**PHAN TICH `git status`**)
Scenario: ⭐ Liet ke **toan bo** duong trong `git status` ⇒ phan loai **tung tep** thuoc phien nao.
Expected: ⭐ Xac dinh duoc `FILES A ∩ FILES B` (⭐ **phai = ∅** theo §39).
Actual: ⭐ **28 duong** phan loai het: **13 CUA TOI** + **8 CUA PHIEN 02** · ⭐ ket qua: **«KHONG CO tep nao trung vung cua toi»** ⇒ ⭐ **`FILES A ∩ FILES B = ∅`** ✓
Result: PASS
Regression: N/A
Environment: `git status --short` · `git rev-parse --short HEAD` = `b5ca4cc`
Related Bug: —
Related Change: CHG-20261006-008
Notes: ⭐ **BAI HOC**: ⭐ **phat hien phien khac bang `git status`** — ⛔ **KHONG bang tien trinh/cong** (⭐ khai bao dau tien cua toi «⛔ khong co phien thu hai» la **SAI**, vi toi chi quet **tien trinh + cong**). ⭐ **VA**: ⭐ **van tay doi SO TEP** (713 → 715 → 716 → 717) la **dau hieu gian tiep** co phien khac dang them tep ✓

---

## TONG KET TEST

| Test Type | So luong | Ket qua |
|---|---|---|
| `UNIT` / integration Java | 2 | ⭐ PASS |
| `API` | 3 | ⭐ PASS |
| `UI` (kiem bundle) | 2 | ⭐ PASS |
| `E2E` | 1 | ⚠️ **PARTIAL** (7/8) |
| `REGRESSION` | 4 | ⭐ PASS |
| `DATABASE` | 2 | ⭐ PASS |
| `MANUAL` (user) | 2 | ⭐ PASS |
| `INTEGRATION` (git) | 1 | ⭐ PASS |

| Result | So luong |
|---|---|
| **PASS** | 10 |
| **PARTIAL** | 2 (-010 E2E · -011 chan doan) |
| **FAIL** | 0 |

> ⭐ **TONG**: **12 bai test** — ⭐ **10 PASS** · ⚠️ **2 PARTIAL** · ⛔ **0 FAIL**
> ⭐ **CONG CHINH**: `mvn -o test` **156/156** · `npm test` **EXIT=0 · pass 802 · fail 0** · cong UI **3/3** · van tay **DAT** `VNTECH-FP-7CEDCD452167CDFA` (**717 tep**)

---

# ✅ **TEST-20261006-011 — KẾT QUẢ ĐO CUỐI (⭐ SAU KHI TRIỂN KHAI)** — 06/10/2026

| ⭐ Trường | ⭐ Giá trị |
|---|---|
| ⭐ **TEST_ID** | ⭐ `TEST-20261006-011` |
| ⭐ **DATE** | ⭐ 2026-10-06 (⭐ triển khai **15:07:06** ✓) |
| ⭐ **SESSION_ID** | ⭐ `ERP-SESSION-01` |
| ⭐ **TASK_ID** | ⭐ `TASK-20261006-011` |
| ⭐ **MODULE** | ⭐ Phân quyền phòng ban — `save_department_permission` |
| ⭐ **TEST_TYPE** | ⭐ `API` + `PERFORMANCE` + `REGRESSION` (⭐ ⛔ không còn là «chẩn đoán» ⚠️ ✓) |
| ⭐ **SCENARIO** | ⭐ Gọi **THẬT** qua `:9000` — ⭐ đăng nhập `admin` ⇒ ⭐ `save_department_permission` cho `ORG-BGD` ⭐ với **và** ⭐ không kèm cờ `syncNow` ✓ |
| ⭐ **EXPECTED** | ⭐ `syncNow=false` ⭐ **NHANH hơn hẳn** (⭐ ⛔ không đồng bộ ✓) · ⭐ **thiếu cờ** ⇒ ⭐ **vẫn đồng bộ như cũ** ✓ |
| ⭐ **ACTUAL** | ⭐ ⭐ **ĐÚNG NHƯ MONG ĐỢI** ✓ (⭐ xem bảng dưới ✓) |
| ⭐ **RESULT** | ⭐ ⭐ **PASS** ⭐ (⭐ từ **PARTIAL** ⇒ **PASS** ✓) |
| ⭐ **REGRESSION** | ✅ ⭐ **PASS** — ⭐ `AdminGovernanceIntegrationTest` gọi **không kèm cờ** ⇒ ⭐ **vẫn đồng bộ 27 tài khoản** ✓ |
| ⭐ **ENVIRONMENT** | ⭐ `:9000` (⭐ **proxy thật** → Java `:18081` PID **3456** → MySQL `vntech_erp` ✓) |
| ⭐ **RELATED_BUG** | ⭐ ⭐ **`BUG-20261007-001`** ✓ |
| ⭐ **RELATED_CHANGE** | ⭐ ⭐ **`CHG-20261006-011`** ✓ |

## ## Số đo THẬT (⭐ 4 lần đo, ⭐ ⛔ không suy đoán)
| ⭐ Lần | ⭐ Chế độ | ⭐ Thời gian | ⭐ Thông điệp trả về |
|---|---|---|---|
| ⭐ 1 | ⭐ `syncNow=false` | ⭐ **0,05 giây** | ⭐ «…(⭐ **chờ đồng bộ ở bước cuối**).» ✓ |
| ⭐ 2 | ⭐ `syncNow=true` | ⭐ **5,73 giây** | ⭐ «…; **đồng bộ lại 27 tài khoản**.» ✓ |
| ⭐ 3 | ⭐ `syncNow=false` | ⭐ **0,03 giây** | ⭐ «…(⭐ chờ đồng bộ ở bước cuối).» ✓ |
| ⭐ 4 | ⭐ `syncNow=false` | ⭐ **0,04 giây** | ⭐ «…(⭐ chờ đồng bộ ở bước cuối).» ✓ |

⇒ ⭐ ⭐ **SO VỚI TRƯỚC: 11,50 GIÂY** ⇒ ⭐ ⭐ **NHANH HƠN ~288 LẦN** ⚡ (⭐ lời gọi trung gian ✓)
⇒ ⭐ ⭐ **«CHỌN TẤT CẢ» 61 MODULE**: ⭐ **~11,7 PHÚT → ~8,7 GIÂY** ⇒ ⭐ **NHANH HƠN ~80 LẦN** 🚀

## ## ⭐ ĐÍNH CHÍNH CON SỐ Ở DÒNG 244 và 256 (⭐ §22 «⭐ log phải khớp thực tế»)
| ⭐ Chỉ số cũ | ⭐ Giá trị THẬT |
|---|---|
| ⚠️ dòng 244: ⭐ `E2E` **PARTIAL (7/8)** | ⭐ ⭐ **PASS (8/8)** ⭐ — ⭐ đã cấp quyền `e2e.*` ⇒ ⭐ **8/8 ĐẠT** ✓ |
| ⚠️ dòng 253–254: ⭐ **`PARTIAL` = 2** (⭐ `-010` · `-011` chẩn đoán ⚠️) | ⭐ **`PARTIAL` = 1** (⭐ chỉ còn `-010` ⚠️) — ⭐ **`-011` NAY = PASS** ✓ |
| ⚠️ dòng 252: ⭐ **`PASS` = 10** | ⭐ ⭐ **`PASS` = 12** ✓ |
| ⚠️ **`go-live-chuoi-kho`** ⭐ **5/9 (1/7)** | ⭐ ⭐ **7/7 · 0 lỗi** ✓ |
| ⚠️ dòng 257: ⭐ vân tay `VNTECH-FP-7CEDCD452167CDFA` | ⭐ ⭐ **`VNTECH-FP-DC6A989DC64CF6C8`** (⭐ **717 tệp** ✓) |

## ## Cổng chính THẬT (⭐ đo lại sau triển khai)
```
⭐ `npm test`        ⇒ ✅ EXIT=0 · pass 802 · fail 0 · 0 errors   ✓
⭐ `mvn -o test`     ⇒ ✅ EXIT=0                                  ✓
⭐ `npm run build`   ⇒ ✅ EXIT=0 · cổng UI 3/3                    ✓
⭐ E2E tổng          ⇒ ✅ 8/8 ĐẠT                                 ✓
⭐ Vân tay           ⇒ ✅ ĐẠT · VNTECH-FP-DC6A989DC64CF6C8 · 717 tệp ✓
```

> ⭐ ⭐ **TỔNG CUỐI: 12 bài test** — ⭐ ⭐ **11 PASS** · ⚠️ **1 PARTIAL** (⭐ `-010`) · ⛔ **0 FAIL** ✓
> ⚠️ ⭐ **CÒN LẠI**: ⭐ kiểm **runtime** đoạn «đợi nhả khoá» của `tools/deploy-java-backend.mjs` ⚠️ — ⭐ mới chỉ qua **dry-run** ✓

# TEST-20261006-012 — XÁC MINH MODAL CHI TIẾT «BÁO LỖI»

| ⭐ Trường (§4) | ⭐ Giá trị |
|---|---|
| **TEST_ID** | `TEST-20261006-012` |
| **DATE** | 2026-10-06 |
| **SESSION_ID** | `ERP-SESSION-01` |
| **TASK_ID** | `TASK-20261006-012` |
| **MODULE** | Quản trị hệ thống — tab «Báo lỗi» |
| **TEST_TYPE** | ⭐ `UNIT` + ⭐ `REGRESSION` + ⭐ `BUILD` + ⭐ `RUNTIME` (⭐ **đọc bundle thật trên `:9000`**) |
| **SCENARIO** | ⭐ ① `tsc` toàn dự án ② `eslint` tệp đã sửa ③ `npm test` ④ `grep` xem có test nào đo `error-report-detail` ⑤ `npm run build` ⑥ đọc **bundle đang được `:9000` phục vụ** |
| **EXPECTED** | ⭐ ① 0 lỗi ② 0 lỗi ③ không test mới đỏ ④ 0 test ⑤ build ĐẠT ⑥ bundle chứa marker của modal |
| **ACTUAL** | ⭐ ① **EXIT=0** ② **EXIT=0**, 1 warning `react-hooks/exhaustive-deps` dòng 82 — ⭐ **có sẵn từ trước**, ⛔ không do thay đổi này ③ **pass 802 · fail 0 · EXIT=0** ④ **0 kết quả** ⭐ ⇒ ⛔ thay đổi **không phá** hợp đồng nào ⑤ **EXIT=0** + `BUILT ARTIFACT VALIDATION: ĐẠT` ⑥ `:9000` HTTP 200 ⇒ bundle `page-DdkxN2Fj.js` **1.063.343 byte** ⇒ `open-report-detail` ✓ `error-report-detail` ✓ `modal-overlay` ✓ `error-report-tab` ✓ ⇒ `jsxs(BaseModal, { title: 'CHI TIẾT …', children: [ dl.error-report-detail-list … ] })` ⇒ ⭐ **nội dung NẰM TRONG modal** ✓ |
| **RESULT** | ⭐ **PASS** ⭐ (⭐ riêng phần hành vi người dùng ⭐ **chờ user nghiệm thu** ⇒ chưa `VERIFIED` ✓) |
| **REGRESSION** | ✅ **PASS** — `npm test` 802/0 không đổi so với trước khi sửa ⭐; ⭐ **0 test hợp đồng nào chạm vào màu chi tiết** ⇒ ⛔ không có hồi quy nào bị che ✓; ⚠️ **giới hạn đã biết**: baseline ảnh 68 PNG vẫn hỏng (⚠️ đã ghi sẵn ở TODO ✓) ⇒ ⛔ **không** dùng probe ảnh để kết luận ✓ |
| **ENVIRONMENT** | ⭐ Node v24.19.0 · JDK 21 (Adoptium) · MySQL 8 (không đụng) · UI cục bộ `:8787` (`local-server.mjs` PID 10468) · GO-LIVE `:9000` (`cutover-proxy.mjs --port 9000 --ui-port 8787 --api-port 18081`) · Java `:18081` PID 3456 |
| **RELATED_BUG** | ⭐ ⚠️ **Sự cố tự gây** (⛔ không phải bug sản phẩm): dừng `local-server.mjs` trước khi build ⇒ `:9000` 404 ⇒ khôi phục đủ 5 bước. ⭐ Ghi thành **LUẬT §⑦** trong `docs/dsh-state/SESSION_REGISTRY.md` ✓ |
| **RELATED_CHANGE** | `CHG-20261006-012` |
| **NOTES** | ⭐ ⭐ **VÌ SAO PHẢI CÓ MIGRATION 0330**: sửa mã ⇒ `source_fingerprint` đổi ⇒ bảng `vntech_product_identity` có TRIGGER `RAISE(ABORT, 'VNTECH product identity is protected.')` ⇒ `scripts/local-runtime.mjs:177` từ chối khởi động UI ⇒ `:8787` chết ⇒ `:9000` 404. ⭐ Áp migration xong: **CẢ 4 TRƯỒNG KHỚP** (source · short · brand · release). ⭐ ⚠️ **Thêm migration ⇒ vân tay đổi lần 2** (`e7195a48…` → `8d70c620…`) ⇒ phải chạy lại `fixpoint-fingerprint` ⇒ ⭐ **fixpoint bất động sau 2 vòng liên tiếp, cùng giá trị** ✓ |

---

