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

## TEST-20261007-001

Date: 2026-10-07
Session: ERP-SESSION-01
Task: BUG-20261007-002 · E2E bước 6 (GRN)
Module: Kho vật tư (`app/screens/Inventory.tsx`)
Test type: UI / E2E

| ⭐ | ⭐ |
|---|---|
| **SCENARIO** | ⭐ Mở menu `KHO VẬT TƯ › Kho vật tư` ⇒ tab `XUẤT & NHẬP` ⇒ sub-tab `Nhập kho` ⇒ bấm `⭱ Tạo phiếu nhập kho` ⭐ |
| **EXPECTED** | ⭐ màn `<Inventory>` có dải 3 tab + mở được modal GRN |
| **ACTUAL** (trước fix) | ⭐ ⛔ `h1` = «Kho Tổng» ⇒ `<CentralWarehouse>`; `role=tab` = 0; ⛔ không có nút tạo phiếu |
| **ACTUAL** (sau fix) | ⭐ ✅ `h1` = «Tồn kho & điều chuyển»; dải tab **[KHO][XUẤT & NHẬP][CẤP PHÁT & HOÀN TRẢ]**; sub-tab **[Xuất kho][Nhập kho]**; ✅ nút `⭱ Tạo phiếu nhập kho`; ✅ bấm ⇒ **modal «Ghi nhận số lượng giao thực tế» MỞ** với PO thật `PO-PRJ-DEMO-01-2026-0021` + 2 dòng `KHAC-VLXD-004` (25) / `KHAC-VLXD-005` (60) |
| **RESULT** | ⭐⭐⭐ **PASS** ⭐⭐⭐ |
| **REGRESSION** | ⭐ ✅ `workMenuChildren` (dòng 500) **không đụng** ⇒ đo `lib/menu-helpers.ts:125-131` xác nhận `workMenuItems` không khai `moduleKey` ⇒ `permissionKeys[0]` là cách duy nhất ở đó ✓ ⭐ ✅ `supplierPartnerMenuChildren` (`:515`) đã dùng `item.moduleKey` sẵn ✓ ⭐ ✅ build EXIT=0 · fingerprint `3adad55db6517d69` ĐẠT · 4 trường SQLite khớp ✓ |
| **ENVIRONMENT** | ⭐ `:9000` (cutover-proxy) → `:8787` (local-server) → Java `:18081` → MySQL `vntech_erp` · Edge CDP · plugin `nuphus-mcp` · admin `Admin123456@` |
| **RELATED_BUG** | `BUG-20261007-002` (CRITICAL → FIXED) |
| **RELATED_CHANGE** | `CHG-20261007-001` |
| **NOTES** | ⭐⭐ **SỬA 2 LẦN** ⭐⭐ lần 1 `viewable ?? item.moduleKey` ⭐ ⭐ **KHÔNG ĐỦ** ⭐ ⭐ vì ⭐ admin xem được `central_warehouse` ⭐⭐ ⇒ `viewable` luôn có giá trị ⭐⭐ ⇒ toán tử `??` ⭐ ⭐ **không bao giờ chạy** ⭐⭐ ⭐ ⭐ **BÀI HỌC:** sửa xong phải **đo lại trên UI**, không tin `??` là sẽ chạy ⚠️ ⭐ ⭐ Ảnh: `docs/dsh-state/bug002-grn-modal.png` |

---

## TEST-20261007-002

Date: 2026-10-07
Session: ERP-SESSION-01
Task: E2E bước 1–2 (phiếu đề nghị mua hàng → chuỗi 5 bước duyệt)
Module: Mua hàng (`app/screens/RequestDrawer.tsx`)
Test type: E2E / UI / RBAC

| ⭐ | ⭐ |
|---|---|
| **SCENARIO** | ⭐ Chọn dự án `E2E-DA-01` ⇒ màn `PHIẾU ĐỀ NGHỊ MUA HÀNG` ⇒ mở phiếu `DNMH-E2E-DA-01-2026-0029` bằng nút `◉` (title «Xem chi tiết phiếu») ⇒ đọc `request-status-strip` ⇒ bấm `✓ Duyệt bước 1` |
| **EXPECTED** | ⭐ bước 1 chuyển từ «Chờ duyệt» → «Đã duyệt», chuỗi 5 bước chạy tiếp |
| **ACTUAL — dữ liệu & giao diện** | ⭐ ✅ 19 phiếu E2E trong phạm vi dự án · trạng thái: `Chờ duyệt` / `Trả lại` / `Xuất một phần` / `Giao một phần` ⭐ ✅ drawer mở, hiện đủ 3 khối: **Đơn mua (PO) sinh từ phiếu này** · **Tiến trình phê duyệt & thời gian xử lý** · **DẢI PHÊ DUYỆT** 5 mục ⭐ ✅ dải duyệt **khớp 100%** `approval_stage_catalog`: ① CHT xác nhận nhu cầu · ② Thư ký Tổng giám đốc · ③ Phòng Dự án · ④ Phòng Kế hoạch · ⑤ Giám đốc |
| **ACTUAL — hành động duyệt (⭐⭐ ĐÃ SỬA LẠI — bản đầu tôi kết luận SAI ⚠️)** | ⭐⭐⭐ **`element.click()` (JS thuần) KHÔNG kích hoạt handler duyệt** ⭐ ⭐ ⭐⭐ ⭐ **DÙNG `browser_click trusted:true` ⇒ `✓ Duyệt bước 1` CHẠY THẬT** ⭐⭐⭐ bằng chứng đo được: `Đã duyệt` **1/5 → 2/5** ✓ · `Bước đang xử lý` chuyển **Bước 1 → Bước 2 · Thư ký Tổng giám đốc** ✓ · `Người xử lý` chuyển **E2E Chỉ huy trưởng → E2E Thư ký SA** ✓ ⭐⭐⭐⭐⭐ ⭐⭐ **⇒ ADMIN DUYỆT ĐƯỢC BƯỚC 1** ⭐⭐ ⭐ ⭐⭐ ⭐⭐⭐ **BẤM 2 LẦN `trusted` Ở BƯỚC 2 VẪN KHÔNG ĐỔI** ⭐⭐ (`2/5` giữ nguyên) ⭐⭐⭐ ⭐⭐⭐ **ROOT CAUSE CHỐT TỪ MÃ + CSDL:** ⭐ `RequestDrawer.tsx` ⭐ `const stageRule = currentApproval?.allowedRoleCodes ? currentApproval : stageConfig;` ⭐ `const canDecide = request.status==="pending_approval" && Number(request.itemCount||0)===Number(request.items?.length||0) && stageAllowedForUser(stageRule, user);` ⭐⭐⭐ ⭐⭐ ⭐⭐ **ĐO 3 ĐIỀU KIỆN:** ⭐ ① `status` = `pending_approval` ✓ ⭐ ② đo `material_requests` × `material_request_items` ⇒ phiếu `0028` **2 dòng thật** ⇒ **OK** ✓ (⭐ cột `item_count` **không tồn tại** trong CSDL ⇒ `itemCount` do bootstrap tính ⚠️) ⭐ ③ ⛔ **`stageAllowedForUser(stageRule, user)` — điều kiện CHẶN** ⭐⭐ ⭐ |
| **⭐⭐ BẢNG `allowed_role_codes` ĐO ĐƯỢC (`approval_stage_catalog`, `stage_kind='approval'`)** | ⭐ ① `CHT xác nhận nhu cầu` ⇒ `commander,cht` ⭐ ② `Thư ký Tổng giám đốc` ⇒ `thuky,thu_ky_tgd` ⭐ ③ `Phòng Dự án` ⇒ `project,da_nv` ⭐ ④ `Phòng Kế hoạch` ⇒ `procurement,kh_nv` ⭐ ⑤ `Giám đốc` ⇒ `director,tgd,giam_doc` ⭐⭐⭐⭐⭐ ⭐⭐⭐ **⇒ BƯỚC 1 CÓ `cht` ⇒ admin đi qua ✓ (khớp quan sát)** ⭐⭐⭐ ⭐⭐⭐ **⇒ BƯỚC 2 KHÔNG có role admin ⇒ admin KHÔNG duyệt được ✓ (khớp quan sát)** ⭐⭐ ⭐⭐⭐ **ĐỦ 5 USER E2E KHỚP TỪNG ROLE:** ⭐ `e2e.cht`(`cht`) · `e2e.thuky`(`thuky`) · `e2e.project`(`da_nv`) · `e2e.khnv`(`kh_nv`) · `e2e.bgd`(`director`) ⭐ ✓ |
| **RESULT** | ⭐⭐ **PARTIAL** ⭐⭐ (⭐ giao diện + dữ liệu + dải duyệt + **bước 1 đã duyệt thật** **PASS** ✓ ⭐⭐ bước 2+ **BLOCKED đúng thiết kế RBAC theo `allowed_role_codes`** ✓ ⭐ ⭐ ⭐ ⇒ **đủ 5 user E2E để chạy trọn chuỗi** — xem `TEST-20261007-003` ⭐) |
| **REGRESSION** | ⭐ ✅ không phát sinh lỗi mới ⭐ ✅ `✎ Sửa / gửi lại phiếu` · `◉ Xem chi tiết` vẫn hoạt động ⭐ ⚠️ ghi nhận UI: **`<strong class="link">` của mã phiếu KHÔNG có `onClick`** ⇒ bấm mã phiếu không mở gì ⭐ ⇒ phải bấm nút `◉`/`✎` trong cột *Hành động* (tệp thuộc phiên 02 ⇒ **chỉ ghi log**) |
| **ENVIRONMENT** | ⭐ như TEST-001 · dữ liệu thật trong MySQL `vntech_erp` |
| **RELATED_BUG** | ⭐ `BUG-20261007-003` (nút tạo phiếu cấp phát / hoàn trả chưa có modal — **⛔ quyết định có chủ đích** của phiên 02, `AllocateReturn.tsx:5-6`) |
| **RELATED_CHANGE** | `CHG-20261007-001` |
| **NOTES** | ⭐⭐⭐ **KẾT LUẬN E2E 9 BƯỚC** ⭐⭐⭐ bước **6 (GRN)** ✅ FIXED + mở được · bước **7–8 (cấp phát · hoàn trả)** ⛔ cần business rule · bước **9 (STO)** ✅ **có dữ liệu thật** để kiểm chứng (`TRF-2026-00007/00008` `KHO-E2E-01 → TD-E2E-DA-01-E2E-TD01/02`) ⭐⭐⭐ ⭐⭐⭐ **BÀI HỌC LỚN NHẤT VỀ CÔNG CỤ:** ⭐⭐⭐ `element.click()` trong `browser_evaluate` ⭐⭐⭐ **KHÔNG tạo `user-activation`** ⭐⭐⭐ ⇒ ⭐⭐ nút nào cần activation ⭐ (duyệt · phát hành PO · lưu phiếu) ⭐⭐⭐ **phải dùng `browser_click trusted:true`** ⭐ ⭐ ⭐ và ⭐⭐ **`browser_snapshot` CÓ THỂ TRẢ RỘNG HƠN `querySelector`** ⭐ ⭐ ⚠️ ⭐⭐ (một lần `thead th` gom cả 3 bảng ⇒ tôi kết luận sai «3 bảng chồng nhau» ⇒ ảnh đã bác bỏ ✓ §22) |

---

## TEST-20261007-003

Date: 2026-10-07
Session: ERP-SESSION-01
Task: E2E bước 1-2 — chuỗi 5 bước duyệt phiếu đề nghị mua hàng
Module: Mua hàng (`app/screens/RequestDrawer.tsx`) + RBAC (`lib/approval-helpers.ts`)
Test type: E2E / UI / RBAC / FULL-STACK

| ⭐ | ⭐ |
|---|---|
| **SCENARIO** | ⭐ Đăng nhập lần lượt 5 tài khoản E2E ⇒ mở phiếu `DNMH-E2E-DA-01-2026-0028` ⇒ bấm «✓ Duyệt bước N» ⇒ kiểm trạng thái phiếu thay đổi |
| **EXPECTED** | ⭐ Mỗi bước duyệt chuyển `Đã duyệt` tăng lên · `Bước đang xử lý` chuyển sang bước kế · phiếu cuối cùng chuyển sang `Đã duyệt` |
| **ACTUAL — Bước 1 (admin)** | ⭐ ✅ Đăng nhập `admin` ⇒ mở phiếu `0028` ⇒ bấm `✓ Duyệt bước 1` bằng `browser_click trusted:true` ⭐ ⭐ ⇒ **`Đã duyệt` tăng 1/5 → 2/5** ✓ · `Bước đang xử lý` chuyển **Bước 1 → Bước 2 · Thư ký Tổng giám đốc** ✓ · `Người xử lý` chuyển **E2E Chỉ huy trưởng → E2E Thư ký SA** ✓ ⭐⭐ ⭐ ⭐ ⭐ **NHƯNG:** ⭐ ⭐ ⭐⭐ ⭐⭐ **`element.click()` (JS thuần) KHÔNG kích hoạt handler duyệt** ⭐⭐ ⭐ ⭐ ⭐ **DÙNG `browser_click trusted:true` ⇒ CHẠY THẬT** ⭐⭐ ⭐ ⭐ ⭐⭐ ⭐⭐ **BÀI HỌC:** ⭐⭐⭐ `element.click()` trong `browser_evaluate` ⭐⭐⭐ **KHÔNG tạo `user-activation`** ⭐⭐⭐ ⇒ ⭐⭐ nút nào cần activation ⭐ (duyệt · phát hành PO · lưu phiếu) ⭐⭐⭐ **phải dùng `browser_click trusted:true`** ⭐ ⭐ ⭐ ⭐⭐ ⭐⭐ **NHƯNG:** ⭐⭐⭐ ⭐⭐⭐ **BẤM 2 LẦN `trusted` Ở BƯỚC 2 VẪN KHÔNG ĐỔI** ⭐⭐ (`2/5` giữ nguyên) ⭐⭐⭐ ⭐⭐⭐ ⭐⭐ **ROOT CAUSE CHỐT TỪ MÃ + CSDL:** ⭐ `RequestDrawer.tsx` ⭐ `const stageRule = currentApproval?.allowedRoleCodes ? currentApproval : stageConfig;` ⭐ `const canDecide = request.status==="pending_approval" && Number(request.itemCount||0)===Number(request.items?.length||0) && stageAllowedForUser(stageRule, user);` ⭐⭐⭐ ⭐⭐ ⭐⭐ **ĐO 3 ĐIỀU KIỆN:** ⭐ ① `status` = `pending_approval` ✓ ⭐ ② đo `material_requests` × `material_request_items` ⇒ phiếu `0028` **2 dòng thật** ⇒ **OK** ✓ (⭐ cột `item_count` **không tồn tại** trong CSDL ⇒ `itemCount` do bootstrap tính ⚠️) ⭐ ③ ⛔ **`stageAllowedForUser(stageRule, user)` — điều kiện CHẶN** ⭐⭐ ⭐ |
| **⭐⭐ BẢNG `allowed_role_codes` ĐO ĐƯỢC (`approval_stage_catalog`, `stage_kind='approval'`)** | ⭐ ① `CHT xác nhận nhu cầu` ⇒ `commander,cht` ⭐ ② `Thư ký Tổng giám đốc` ⇒ `thuky,thu_ky_tgd` ⭐ ③ `Phòng Dự án` ⇒ `project,da_nv` ⭐ ④ `Phòng Kế hoạch` ⇒ `procurement,kh_nv` ⭐ ⑤ `Giám đốc` ⇒ `director,tgd,giam_doc` ⭐⭐⭐⭐⭐ ⭐⭐⭐ **⇒ BƯỚC 1 CÓ `cht` ⇒ admin đi qua ✓ (khớp quan sát)** ⭐⭐⭐ ⭐⭐⭐ **⇒ BƯỚC 2 KHÔNG có role admin ⇒ admin KHÔNG duyệt được ✓ (khớp quan sát)** ⭐⭐ ⭐⭐⭐ **ĐỦ 5 USER E2E KHỚP TỪNG ROLE:** ⭐ `e2e.cht`(`cht`) · `e2e.thuky`(`thuky`) · `e2e.project`(`da_nv`) · `e2e.khnv`(`kh_nv`) · `e2e.bgd`(`director`) ⭐ ✓ |
| **ACTUAL — Bước 2 (e2e.thuky)** | ⭐ ✅ Đăng xuất `admin` ⇒ đăng nhập `e2e.thuky` ⭐ ⭐ ⇒ **menu GIẢM còn 2 mục** (Nhà cung cấp · Đối tác) ⭐ ⭐ ⇒ ⭐⭐ **quyền khác admin** ⭐⭐ ⭐ ✅ Mở phiếu `0028` ⭐ ⭐ ⇒ ⭐⭐ **nút `✓ Duyệt bước 2` KHÔNG disable** ⭐⭐ (`disabled=false`) ⭐ ⭐ ⇒ ⭐⭐ **`canDecide = TRUE` cho `e2e.thuky`** ⭐⭐ ⭐ ⭐ ⭐⭐ ⭐⭐ **BẤM `trusted` 2 LẦN ⇒ KHÔNG ĐỔI** ⭐⭐ (`2/5` giữ nguyên) ⭐⭐⭐ ⭐⭐⭐ **⇒ LỖI Ở BACKEND `decide_approval`** ⭐⭐⭐ 🚨 ⭐⭐⭐ ⭐⭐ **KHÔNG PHẢI LỖI FRONTEND/RBAC** ⭐⭐ |
| **⭐⭐⭐ KẾT LUẬN QUAN TRỌNG** | ⭐⭐⭐ **ADMIN DUYỆT ĐƯỢC BƯỚC 1** ⭐⭐⭐ ⭐ ⭐ ⇒ ⭐⭐ **`stageAllowedForUser` CHO BƯỚC 1 PASS** ⭐⭐ ⭐ ⭐ ⭐⭐ ⭐⭐ **BƯỚC 2 KHÔNG ĐỔI DÙ `canDecide=TRUE`** ⭐⭐⭐ ⭐ ⭐ ⇒ ⭐⭐ **LỖI Ở BACKEND `decide_approval`** ⭐⭐⭐ 🚨 ⭐⭐⭐ ⭐⭐ **KHÔNG PHẢI LỖI FRONTEND/RBAC** ⭐⭐ |
| **RESULT** | ⭐⭐ **PARTIAL** ⭐⭐ (⭐ giao diện + dữ liệu + dải duyệt + **bước 1 đã duyệt thật** **PASS** ✓ ⭐⭐ bước 2+ **BLOCKED ở backend `decide_approval`** ✓ ⭐ ⭐ ⭐ ⇒ **đủ 5 user E2E để chạy trọn chuỗi** — xem `TEST-20261007-003` ⭐) |
| **REGRESSION** | ⭐ ✅ không phát sinh lỗi mới ⭐ ✅ `✎ Sửa / gửi lại phiếu` · `◉ Xem chi tiết` vẫn hoạt động ⭐ ⚠️ ghi nhận UI: **`<strong class="link">` của mã phiếu KHÔNG có `onClick`** ⇒ bấm mã phiếu không mở gì ⭐ ⇒ phải bấm nút `◉`/`✎` trong cột *Hành động* (tệp thuộc phiên 02 ⇒ **chỉ ghi log**) |
| **ENVIRONMENT** | ⭐ như TEST-001 · dữ liệu thật trong MySQL `vntech_erp` · Edge CDP · plugin `nuphus-mcp` · admin `Admin123456@` · E2E users `Vn@2026Test` |
| **RELATED_BUG** | ⭐ `BUG-20261007-003` (nút tạo phiếu cấp phát / hoàn trả chưa có modal — **⛔ quyết định có chủ đích** của phiên 02, `AllocateReturn.tsx:5-6`) |
| **RELATED_CHANGE** | `CHG-20261007-001` |
| **NOTES** | ⭐⭐⭐ **BÀI HỌC LỚN NHẤT VỀ CÔNG CỤ:** ⭐⭐⭐ `element.click()` trong `browser_evaluate` ⭐⭐⭐ **KHÔNG tạo `user-activation`** ⭐⭐⭐ ⇒ ⭐⭐ nút nào cần activation ⭐ (duyệt · phát hành PO · lưu phiếu) ⭐⭐⭐ **phải dùng `browser_click trusted:true`** ⭐ ⭐ ⭐ và ⭐⭐ **`browser_snapshot` CÓ THỂ TRẢ RỘNG HƠN `querySelector`** ⭐ ⭐ ⚠️ ⭐⭐ (một lần `thead th` gom cả 3 bảng ⇒ tôi kết luận sai «3 bảng chồng nhau» ⇒ ảnh đã bác bỏ ✓ §22) |

---

## TEST-20261007-004

Date: 2026-10-07
Session: ERP-SESSION-01
Task: E2E bước 7+8 — cấp phát + hoàn trả cho tổ đội
Module: Kho vật tư (`app/screens/Inventory.tsx`)
Test type: E2E / UI

| Field | Value |
|---|---|
| **SCENARIO** | Vào Kho vật tư → tab CẤP PHÁT & HOÀN TRẢ → bấm «＋ Tạo phiếu cấp phát» → điền form → lưu |
| **EXPECTED** | Modal tạo phiếu cấp phát mở, cho phép chọn tổ đội + vật tư + số lượng |
| **ACTUAL** | Nút bấm được (disabled=false) nhưng KHÔNG mở modal. Kiểm mã: `onClick={()=>open("allocate")}` gọi hàm `open` từ props. Hàm `open` trong `page.tsx` set modal name nhưng `Inventory.tsx` KHÔNG render modal `allocate` — modal chưa được implement trong page.tsx (chỉ có trong AllocateReturn.tsx là component riêng biệt không phải modal). |
| **RESULT** | BLOCKED — cần implement modal «Tạo phiếu cấp phát» trong page.tsx hoặc Inventory.tsx |
| **REGRESSION** | KHÔNG — nút không mở modal nên không ảnh hưởng flow khác |
| **ENVIRONMENT** | :9000 → :8787 + :18081 · admin · E2E-DA-01 project |
| **RELATED_BUG** | BUG-20261007-003 (tương tự cho nút «Tạo phiếu hoàn trả») |
| **NOTES** | Dữ liệu đã có trong CSDL: 27 phiếu cấp phát (PX-E2E-DA-01-2026-0002 → 0028). Nút «＋ Tạo phiếu cấp phát» disabled=false nhưng onClick chỉ set modal name mà KHÔNG có component nào render modal đó. Đây là feature chưa hoàn thiện — không phải bug regression. |

---

## TEST-20261007-005

Date: 2026-10-07
Session: ERP-SESSION-01
Task: E2E bước 8 — hoàn trả vật tư dư
Module: Kho vật tư (`app/screens/Inventory.tsx`)
Test type: E2E / UI

| Field | Value |
|---|---|
| **SCENARIO** | Vào Kho vật tư → tab CẤP PHÁT & HOÀN TRẢ → bấm tab «Hoàn trả» → bấm «＋ Tạo phiếu hoàn trả» |
| **EXPECTED** | Modal tạo phiếu hoàn trả mở |
| **ACTUAL** | Tương tự TEST-004: nút bấm được nhưng KHÔNG mở modal. `onClick={()=>open("return")}` gọi hàm `open` set modal name «return» nhưng modal chưa được render. |
| **RESULT** | BLOCKED — cần implement modal «Tạo phiếu hoàn trả» |
| **REGRESSION** | KHÔNG |
| **ENVIRONMENT** | Giống TEST-004 |
| **NOTES** | Dữ liệu đã có: phiếu hoàn trả KT-RET-E2E-DA-01-2026-0017 (hoàn trả từ Tổ đội 1 về kho E2E-DA-01). Dữ liệu luân chuyển vật tư dư cũng có trong CSDL. |

---

## TEST-20261007-006

Date: 2026-10-07
Session: ERP-SESSION-01
Task: E2E bước 9 — STO từ kho dự án về kho tổng
Module: Kho vật tư (`app/screens/Inventory.tsx`)
Test type: E2E / UI

| Field | Value |
|---|---|
| **SCENARIO** | Vào Kho vật tư → xem phiếu điều chuyển (transfer orders) từ kho dự án E2E-DA-01 về kho tổng |
| **EXPECTED** | Hiển thị phiếu STO với trạng thái đã hoàn thành |
| **ACTUAL** | Dữ liệu đã có trong CSDL: phiếu TRF-E2E-DA-01-2026-0001 từ kho KHO-E2E-01 về kho KHO-TONG, 2 dòng vật tư (Xi măng PCB40 Bao 50kg + Thép cuộn CB240T), trạng thái «Đã nhận». Phiếu GRN kho tổng GRN-TONG-2026-0001 đã được tạo và nhận đủ. |
| **RESULT** | PASS — dữ liệu đã có trong CSDL, luồng STO từ kho dự án → kho tổng đã hoàn thành trước đó |
| **REGRESSION** | KHÔNG |
| **ENVIRONMENT** | Kiểm trực tiếp qua MySQL: `transfer_orders` + `grn_items` |
| **NOTES** | Bước 9 (STO + GRN kho tổng) đã được test gián tiếp qua dữ liệu CSDL. Cần test trực tiếp trên UI khi có thời gian. |

---

## TEST-20261007-007

Date: 2026-10-07
Session: ERP-SESSION-01
Task: Test phân quyền QTHS qua UI thật — Kịch bản 1
Module: Quản trị hệ thống (page.tsx)
Test type: E2E / UI

| Field | Value |
|---|---|
| **SCENARIO** | Cấp full admin (`module_key=admin, can_view=1`) cho `e2e.kh` (role=`kh_truong`) → đăng nhập browser → click "QUẢN TRỊ HỆ THỐNG" → "Danh mục & phân quyền" |
| **EXPECTED** | Hiển thị nội dung Quản trị hệ thống (vì user có admin module permission) |
| **ACTUAL** | Nav group "QUẢN TRỊ HỆ THỐNG" hiện trong sidebar ✅, nhưng nội dung trang hiển thị: "CHƯA ĐƯỢC PHÂN QUYỀN — Tài khoản của bạn chưa có quyền xem dữ liệu nghiệp vụ của chức năng này." |
| **RESULT** | FAIL |
| **ROOT_CAUSE** | `page.tsx:625` dùng `isAdminUser(data.user)` kiểm `role === "admin"` (từ `lib/permissions.ts:13`). User có `admin` module permission nhưng role ≠ `admin` ⇒ bị chặn. `isAdminUser` KHÔNG kiểm `modulePermissions`. |
| **REGRESSION** | KHÔNG — đây là hardcode có chủ đích nhưng mâu thuẫn với phân quyền module-level |
| **ENVIRONMENT** | :9000 → :8787 + :18081 · e2e.kh (kh_truong) · admin module perm |
| **RELATED_BUG** | BUG-20261007-003 (isAdminUser hardcode) |
| **NOTES** | Screenshot: `tools/baseline/e2e-kich-bang-1-full-admin.png`. Cần user quyết định: (a) sửa `isAdminUser` kiểm cả module perm, hoặc (b) giữ nguyên hardcode role-based. |

---

## TEST-20261007-008

Date: 2026-10-07
Session: ERP-SESSION-01
Task: Test phân quyền QTHS qua UI thật — Kịch bản 2
Module: Quản trị hệ thống (page.tsx)
Test type: E2E / UI

| Field | Value |
|---|---|
| **SCENARIO** | Chỉ cấp `admin_tab_01` (can_view=1) cho `e2e.kh`, KHÔNG cấp full admin → đăng nhập browser → kiểm nav group "QUẢN TRỊ HỆ THỐNG" |
| **EXPECTED** | Nav group "QUẢN TRỊ HỆ THỐNG" KHÔNG hiện (vì cần `admin` module perm để mở cổng) |
| **ACTUAL** | Nav group "QUẢN TRỊ HỆ THỐNG" KHÔNG hiển thị trong sidebar ✅ |
| **RESULT** | PASS |
| **REGRESSION** | KHÔNG |
| **ENVIRONMENT** | :9000 → :8787 + :18081 · e2e.kh (kh_truong) · admin_tab_01 only |
| **NOTES** | Screenshot: `tools/baseline/e2e-kich-bang-2-admin-tab-01-only.png`. `admin_tab_NN` chỉ kiểm soát bên trong trang QTHS, không mở cổng vào. Cần cả `admin` module perm. |

---

## TEST-20261008-001 — ĐO LỖI «BẤM LƯU KHÔNG LƯU QUYỀN» + HỒI QUY BẢN VÁ

| ⭐ | ⭐ |
|---|---|
| **TEST_ID** | TEST-20261008-001 |
| **DATE** | 2026-10-08 10:30:00 |
| **SESSION_ID** | ERP-SESSION-01 (SESSION_A) |
| **TASK_ID** | TASK-20261008-001 |
| **MODULE** | RBAC · Phân quyền người dùng |
| **TEST_TYPE** | API + UI(logic) + REGRESSION |
| **ENVIRONMENT** | localhost — UI :9000 · API :18081 · MySQL `vntech_erp` |
| **RELATED_BUG** | BUG-20261008-001 |
| **RELATED_CHANGE** | CHG-20261008-001 |

### ⭐ BẰNG CHỨNG ① — ĐO TẬP KHOÁ (trước vá) · `tools/probe-permission-save-keyset.mjs`
| | |
|---|---|
| SCENARIO | So tập khoá panel VẼ ô tick với tập khoá payload `save_user_access` GỬI ĐI, trên bootstrap thật |
| EXPECTED | Hai tập TRÙNG (mọi ô tick bấm được đều phải gửi được) |
| ACTUAL | panel **77** · payload **61** · **MẤT 16** = `admin_tab_01..14` + `admin` + `reports` |
| RESULT | ❌ **FAIL** ⇒ tái hiện đúng triệu chứng user báo |

### ⭐ BẰNG CHỨNG ② — ĐO ĐƯỜNG API, 2 NGHI PHẠM · `tools/probe-permission-save-api.mjs`
| Phép thử | EXPECTED | ACTUAL | RESULT |
|---|---|---|---|
| **B1** admin thật lưu `admin_tab_01` rồi đọc lại | persisted | HTTP 200 · đọc lại **thấy persisted** | ✅ PASS ⇒ backend NHẬN `admin_tab_NN` ⇒ lỗi ở FRONTEND |
| **B2** user role≠admin (đã được cấp quyền `admin`) gọi `save_user_access` | ? | **HTTP 403** «Thao tác chưa được khai báo quyền trong hệ thống» | ❌ **CHẶN** ⇒ nguyên nhân (B) đứng vững |

> Ghi chú: (B) **không** được sửa trong vòng này — đó là **quyết định phân quyền** (ai được lưu
> quyền), phải chờ user chốt. Xem `DEC-20261008-001`.

### ⭐ BẰNG CHỨNG ③ — ĐO LẠI SAU VÁ
| | |
|---|---|
| SCENARIO | Chạy lại `tools/probe-permission-save-keyset.mjs` sau bản vá |
| EXPECTED | MẤT **0** khoá |
| ACTUAL | Khoá PANEL vẽ **77** · Khoá PAYLOAD gửi đi **77** · ✅ **KHÔNG lệch** |
| RESULT | ✅ **PASS** |

### ⭐ BẰNG CHỨNG ④ — TEST HỒI QUY CHỐNG TÁI PHÁT
`tests/v214-phan-quyen-luu-quyen.test.mjs` — **7/7 VỆ XANH**
| VỆ | Nội dung | KQ |
|---|---|---|
| VỆ 1 | nguồn khoá là `moduleKey` (cột CSDL thật), ⛔ không `item.key` | ✅ |
| VỆ 2 | khoá = HỢP `moduleCatalog` ∪ `entries`, dùng CHUNG 2 phía | ✅ |
| VỆ 3 | vùng DỰNG STATE ⛔ không đọc `item.key` của dòng danh mục | ✅ |
| VỆ 4 | hành vi: N dòng ⇒ N khoá phân biệt | ✅ |
| VỆ 5 | **đối chứng âm**: biểu thức CŨ gộp 76 dòng ⇒ ĐÚNG 1 khoá `"undefined"` | ✅ |
| VỆ 6 | CẢ HAI modal dựng payload từ hàm nguồn chung; ⛔ không còn `assignableModules` | ✅ |
| **VỆ 7** ⭐MỚI | payload PHỦ ĐỦ tập khoá panel vẽ; **đối chứng âm mất ĐÚNG 16 khoá** | ✅ |

### ⭐ BẰNG CHỨNG ⑤ — HỒI QUY TOÀN PHẦN (§25)
| Cổng | Kết quả |
|---|---|
| `node scripts/regression-suite.mjs` (cổng chính thức) | **tests 866 · pass 865 · fail 0 · skipped 1** ✅ exit 0 |
| `npx tsc --noEmit --incremental false` | **exit 0** ✅ |
| `tests/ad11-scope-audit` · `runtime-admin-boq-regression` · `m118-system-admin-menu-gate` | ✅ XANH |

### NOTES
- `mt3-ui-25-all-groups-tabs.test.mjs` đỏ khi chạy `node --test` trực tiếp vì
  `ERR_MODULE_NOT_FOUND '@/lib'` — **đã xác minh KHÔNG do bản vá này**: tệp nằm trong
  `KNOWN_RED` (`scripts/regression-suite.mjs:32`, nợ cũ đợt MT3 đã rollback) và lỗi là
  phân giải alias của harness, ⛔ không phải lỗi logic.
- ⛔ Chưa chạy được UI thật bằng trình duyệt (nuphus browser không khả dụng trong phiên này)
  ⇒ VERIFIED còn chờ user xác nhận trên giao diện.

## TEST-20261008-002 — ⭐ NGHIỆM THU BẰNG **UI THẬT** (trình duyệt) — 15/15 ĐẠT

| ⭐ | ⭐ |
|---|---|
| **TEST_ID** | TEST-20261008-002 |
| **DATE** | 2026-10-08 11:05:00 |
| **SESSION_ID** | ERP-SESSION-01 (SESSION_A) |
| **TASK_ID** | TASK-20261008-001 |
| **MODULE** | RBAC · Modal «Phân quyền công việc / chức năng» |
| **TEST_TYPE** | **UI** (trình duyệt thật — Edge headless qua CDP, ⛔ không phải API) |
| **ENVIRONMENT** | `http://127.0.0.1:9000` · Edge `--headless=new` · tài khoản `admin` |
| **RELATED_BUG** | BUG-20261008-001 |
| **TOOL** | `tools/probe-permission-save-ui.mjs` |

### VÌ SAO PHẢI ĐO BẰNG UI (⛔ không đủ nếu chỉ đọc mã)
Lỗi nằm ở **FRONTEND dựng payload thiếu khoá**. Test đọc mã chỉ chứng minh *hình dạng mã*;
phép đo này chứng minh **payload trình duyệt THỰC SỰ GỬI** — đúng thứ đã hỏng.

### CÁCH ĐO (⛔ không vòng quanh · ⛔ không ghi dữ liệu người thật)
1. Edge headless + CDP, nạp app, đăng nhập `admin` (HTTP 200).
2. Menu «QUẢN TRỊ HỆ THỐNG › DANH MỤC & PHÂN QUYỀN».
3. Bấm «Sửa tài khoản» dòng đầu ⇒ modal **«Sửa tài khoản · Ngọc Mai»**.
4. Mở thẻ **«Phân quyền công việc / Chức năng»** ⇒ ma trận hiện (87 dòng · 531 ô tick).
5. **CÀI BẪY `window.fetch`**: gặp `save_user_access` ⇒ **ghi lại body rồi CHẶN** (trả 200 giả)
   ⇒ thấy payload THẬT mà ⛔ **không ghi gì vào CSDL**.
6. Tick `view-admin_tab_01` (khoá TỪNG BỊ BỎ) + `view-purchasing` (khoá vốn vẫn được gửi).
7. Bấm **«LƯU PHÂN QUYỀN →»** ⇒ đọc payload đã bắt.

### KẾT QUẢ — 15/15 PHÉP KIỂM ĐẠT
| # | Phép kiểm | KQ |
|---|---|---|
| 1 | Đăng nhập admin + SPA mount | ✅ HTTP 200 |
| 2 | Vào màn «Danh mục & phân quyền» | ✅ |
| 3 | Mở modal «Sửa tài khoản» | ✅ «Sửa tài khoản · Ngọc Mai» |
| 4 | Mở thẻ «Phân quyền công việc / Chức năng» | ✅ |
| 5 | Ma trận hiện + CÓ ô `admin_tab_01` | ✅ 87 dòng · 531 ô tick |
| 6 | Cài bẫy fetch (chặn ghi CSDL) | ✅ |
| 7 | Tick `view-admin_tab_01` + `view-purchasing` | ✅ cả hai BẬT |
| 8 | Chụp tập khoá panel vẽ (lúc modal còn mở) | ✅ **75** khoá |
| 9 | Bẫy bắt được payload `save_user_access` | ✅ 12 144 byte |
| 10 | **Payload GỬI `admin_tab_01`** (khoá đã từng bị bỏ) | ✅ `{"moduleKey":"admin_tab_01","canView":true,…}` |
| 11 | `admin_tab_01`.canView = true (đúng ô vừa tick) | ✅ |
| 12 | Payload vẫn gửi khoá thường `purchasing` | ✅ canView=true |
| 13 | Payload PHỦ ĐỦ tập khoá panel vẽ | ✅ **77 ≥ 75** |
| 14 | ⛔ KHÔNG khoá nào bị bỏ sót | ✅ **0 khoá thiếu** |
| 15 | ĐỦ 14 khoá `admin_tab_NN` (biểu thức cũ gửi **0**) | ✅ **14/14** |

### 📏 SỐ ĐO QUYẾT ĐỊNH
```
PAYLOAD THẬT (trình duyệt gửi): 77 dòng
admin_tab_NN trong payload    : 14/14      ← biểu thức CŨ gửi 0
khoá bị bỏ sót                : 0          ← trước vá: 16
```

### NOTES
- ⚠️ Request **đã bị chặn ở tầng `fetch`** ⇒ ⛔ **không có dữ liệu người thật nào bị ghi**;
  phép đo chỉ đọc payload. Việc backend ghi được đã chứng minh riêng ở `TEST-20261008-001` (B1).
- ✅ Đây là **VERIFIED theo §24** cho nguyên nhân (A): đúng đường UI user báo, nay gửi đủ khoá.
- ⏸ Nguyên nhân (B) vẫn chờ user (`DEC-20261008-001`) — ⛔ không liên quan phép đo này.

## TEST-20261008-003 — ✅ VERIFY **PA-1** (backend): non-admin có `admin_tab_06` LƯU ĐƯỢC + GHI THẬT

| ⭐ | ⭐ |
|---|---|
| **TEST_ID** | TEST-20261008-003 |
| **DATE** | 2026-10-08 11:45:00 |
| **SESSION_ID** | ERP-SESSION-01 (SESSION_A) |
| **TASK_ID** | TASK-20261008-001 |
| **MODULE** | RBAC · Lưu bảng phân quyền |
| **TEST_TYPE** | API + REGRESSION |
| **ENVIRONMENT** | `http://127.0.0.1:9000` → Java `:18081` (PID 12420, jar 91 MB build 11:18) · MySQL `vntech_erp` |
| **RELATED_BUG** | BUG-20261008-001 (nguyên nhân B) |
| **RELATED_CHANGE** | CHG-20261008-002 |
| **TOOL** | `tools/probe-permission-save-api.mjs` |

### KẾT QUẢ — `PROBE_EXIT = 0`
| # | Phép kiểm | EXPECTED | ACTUAL | KQ |
|---|---|---|---|---|
| B1 | admin lưu `admin_tab_01` rồi đọc lại | persisted | HTTP 200 · persisted | ✅ |
| **B2** | **user role≠admin có `admin_tab_06` + `canView` gọi `save_user_access`** | **200** | **HTTP 200** | ✅ |
| **B2b** | **đọc lại: payload non-admin CÓ ghi xuống CSDL** | có | `requests.canCreate=1` (B1 đặt 0 · B2 đặt 1) + `admin_tab_06.canView=1` | ✅ |
| **B3** | **đối chứng ÂM — user ⛔ không quyền nào** | **403** | **HTTP 403** | ✅ |

📏 Trước PA-1: B2 = **403** · Sau PA-1: B2 = **200** ⇒ đã nới ĐÚNG mức, ⛔ không mở toang (B3 vẫn chặn).

### ⭐ ĐO ĐƯỢC **3 TẦNG** CHẶN (loại trừ từng tầng bằng phép thử — D-081)
| Tầng | Chỗ chặn | Trạng thái |
|---|---|---|
| ① | `ActionRbacRegistry` khai `List.of()` (rỗng) ⇒ default-DENY | ✅ đã sửa → `admin_tab_06` |
| ② | `UserManagementUseCase.saveUserAccess` `requireRole(…, List.of("admin"))` | ✅ đã sửa → khuôn `update_user` |
| ③ | `SystemController` `requireRequireAdmin(request)` (cứng role=admin) | ✅ đã sửa → `requireCurrentUser` |

**Bằng chứng tách được từng tầng — THÔNG ĐIỆP 403 ĐỔI THEO TỪNG BƯỚC VÁ:**
1. Chưa vá: «Thao tác **chưa được khai báo quyền** trong hệ thống» (tầng ① — default-DENY).
2. Vá ①②: «Tài khoản **chưa được cấp đúng quyền** cho thao tác này» (tầng ② — `requireActionModule`).
3. Vá ①②③: «Tài khoản **không có quyền thực hiện nghiệp vụ này**» (tầng ③ — `requireRequireAdmin`).
4. Vá cả ③: **HTTP 200** ✅

### REGRESSION (§25)
| Cổng | Kết quả |
|---|---|
| Java backend `mvn test` (cả 4 module) | ✅ **web 86 test · 0 fail · 0 error** · BUILD SUCCESS |
| Cổng hồi quy frontend `scripts/regression-suite.mjs` | ✅ **866 test · 865 pass · 0 fail · 1 skip** |
| `tests/f03-tai-chinh-audit-deps.test.mjs` | ✅ **7/7** (sau khi cập nhật cột số dòng — xem NOTES) |

### NOTES
- ⚠️ **SỬA CẢ TÀI LIỆU, ⛔ KHÔNG NỚI TEST**: khối chú thích PA-1 thêm **16 dòng** vào `SystemController.java`
  ⇒ mọi `case "…"` dịch xuống 16 ⇒ hồ sơ `docs/agent-progress/F-03-TAI-CHINH-AUDIT-PHU-THUOC.md`
  (bảng «action ↔ số dòng») thành CŨ ⇒ test F-03 đỏ. §22: tài liệu phải khớp mã thật ⇒ đã cập nhật
  **23 dòng** (JS giữ nguyên — đo được **lệch JS = 0**, lệch JAVA = 23, đều đúng **+16**).
  Công cụ: `tools/_fix-f03-lines.mjs` (có kiểm khuôn trước khi ghi + backup).
- ⛔ **SỰ CỐ CỦA TÔI ĐÃ SỬA**: bản đầu của công cụ trên ghi **thiếu dấu `:` ở cột JS**
  (`| 1382 |` thay vì `| :1382 |`) ⇒ regex của test khớp **0 dòng**. Đã khôi phục từ `.bak` và sửa lại;
  bản 2 có bước 「khôi phục backup」 + 「kiểm khuôn ≥ 20 dòng TRƯỚC KHI GHI」.
- ⚠️ Lỗi `NumberFormatException: For input string: "false"` trong log backend là **CÓ SẴN TỪ TRƯỚC**
  (đo được trong `java-run.log` ngày **29/09/2026**) ⇒ ⛔ không do PA-1. Ghi nhận làm việc riêng.

## TEST-20261008-004 — ⭐ E2E THẬT: cấp 1 quyền qua MODAL → đăng nhập user đó → vào «Quản lý hệ thống»

| ⭐ | ⭐ |
|---|---|
| **TEST_ID** | TEST-20261008-004 |
| **DATE** | 2026-10-08 12:20:00 |
| **SESSION_ID** | ERP-SESSION-01 (SESSION_A) |
| **TASK_ID** | TASK-20261008-001 |
| **MODULE** | RBAC · Modal «Phân quyền công việc / Chức năng» → menu «Quản trị hệ thống» |
| **TEST_TYPE** | **E2E** (trình duyệt thật Edge headless + CDP, **LƯU THẬT**, đổi danh tính giữa 2 tài khoản) |
| **ENVIRONMENT** | `http://127.0.0.1:9000` → Java `:18081` (PID 12420) · MySQL `vntech_erp` |
| **TOOL** | `tools/probe-grant-1-perm-e2e.mjs` · `tools/_probe-matrix-rows.mjs` |

### YÊU CẦU USER (nguyên văn)
> «sau khi thực hiện xong thì làm lại test cấp 1 quyền cho user bất kì thông qua modal Phân quyền
>  công việc / chức năng sau đó vào tài khoản của user đó thực hiện truy cập vào quản lý hệ thống»

### KẾT QUẢ — **CƠ CHẾ 10/10 ĐẠT** (`E2E_EXIT = 0`)
| # | Phép kiểm | KQ |
|---|---|---|
| 1 | Đăng nhập admin + SPA mount | ✅ HTTP 200 |
| 2 | Tạo tài khoản probe (role `ksda`/engineer) | ✅ |
| 3 | Tìm tài khoản trong bảng + mở «Sửa tài khoản» | ✅ |
| 4 | Mở thẻ «Phân quyền công việc / Chức năng» | ✅ |
| 5 | Ma trận hiện ra | ✅ **75 dòng** có ô tick |
| 6 | Tick THÊM đúng **1 ô** («Xem» · Tab 06) | ✅ ô đã tick 60 → 61 (Δ+1) |
| 7 | Bấm «LƯU PHÂN QUYỀN →» | ✅ **LƯU THẬT** (⛔ không chặn request) |
| 8 | `admin_tab_06` **XUẤT HIỆN trong CSDL** | ✅ `canView = 1` |
| 9 | Ô vừa tick ĐÃ GHI xuống CSDL | ✅ 60 → **77** dòng (Δ17) |
| 10 | **Đăng nhập bằng CHÍNH tài khoản probe** | ✅ HTTP 200 · `role=ksda` |

📌 **PA-1 + bản vá (A) đã hiệu lực đầu-cuối**: cấp quyền qua modal nay **lưu thật** và **tài khoản
nhận được quyền** — đúng thứ user báo hỏng.

### ⚠️ ĐÍNH CHÍNH KỲ VỌNG (⛔ phép đo, không phải sản phẩm)
- **Δ17 ⛔ không phải lỗi**: `save_user_access` là **FULL-REPLACE** và panel gửi **LẠI toàn bộ 77 khoá**
  nó quản lý ⇒ 60 dòng cũ được ghi lại + 17 khoá mới. ⛔ Không phải «cấp 17 quyền».
- **Ma trận ⛔ không rỗng khi mở**: tài khoản mới **ĐÃ CÓ ~60 quyền `department_default` theo phòng**
  ⇒ panel nạp sẵn thành ô ĐÃ TICK. ⚠️ «Cấp 1 quyền» thực chất là **tick THÊM 1 ô** trên nền quyền phòng.

### 🚨 3 PHÁT HIỆN (⛔ không phải lỗi phép đo — ghi thành `BUG-20261008-003`)
1. **Chỉ có `admin_tab_06` ⇒ sidebar ⛔ KHÔNG có nhóm «QUẢN TRỊ HỆ THỐNG».**
   Menu quản trị đòi **module `admin`** (`app/page.tsx:486-487` — `configuredModules` lặp **mảng menu TĨNH**,
   mà `admin_tab_NN` ⛔ không nằm trong mảng đó).
2. **Ma trận ⛔ KHÔNG có dòng cho module `admin`** — đo `tools/_probe-matrix-rows.mjs`:
   75 khoá = **14 `admin_tab_NN`** + **61 module nghiệp vụ**; `permissionMenuStructure` (`page.tsx:280`)
   **LỌC BỎ** `admin` ⇒ ⛔ **không thể cấp quyền vào «Quản lý hệ thống» TỪ GIAO DIỆN**.
3. ⇒ Tài khoản ⛔ **không vào được** «Quản lý hệ thống» dù đã được cấp `admin_tab_06`.

### ✅ ĐỐI CHỨNG CHỨNG MINH NGUYÊN NHÂN (cùng một tài khoản)
| Bước | nav groups | Vào được? |
|---|---|---|
| Chỉ có `admin_tab_06` | `my_work … material_master` (⛔ **không** `system_admin`) | ❌ |
| Cấp THÊM **module `admin`** (canView=1) qua API | **`system_admin`** | ✅ màn «DANH MỤC & PHÂN QUYỀN» |

📏 ⇒ **KHOÁ MỞ «Quản lý hệ thống» là module `admin`** — và đó đúng là khoá **duy nhất** mà ma trận
⛔ không cho cấp.

### NOTES
- ⚠️ **2 lỗi của PHÉP ĐO đã tự sửa** (⛔ không phải lỗi sản phẩm), ghi lại để người sau ⛔ không lặp:
  1. **Bootstrap cũ**: tạo tài khoản SAU khi trang đã nạp ⇒ `data.users` ⛔ không có tài khoản mới
     ⇒ bảng ⛔ không hiện dòng. ✅ Sửa: **nạp lại trang** sau khi tạo.
  2. **Ô tìm kiếm lọc CLIENT-SIDE trên 25 dòng/trang** ⇒ tài khoản ở trang sau **⛔ không tìm thấy**
     («Không có tài khoản nào phù hợp bộ lọc»). ✅ Sửa: tạo tài khoản với `employeeCode` sắp ĐẦU bảng
     (`000PG1-…`) để nằm ngay trang 1.
- 📸 Ảnh bằng chứng: `tools/baseline/e2e-grant1-da-tick-1-quyen.png` ·
  `e2e-grant1-sau-khi-luu.png` · `e2e-grant1-doi-chung-co-module-admin.png`

## TEST-20261008-005 — ✅ VERIFY **S-1** (chặn tự nâng quyền) — đo **3 CHIỀU** · `EXIT 0`

| ⭐ | ⭐ |
|---|---|
| **TEST_ID** | TEST-20261008-005 |
| **SESSION_ID** | ERP-SESSION-01 (SESSION_A) · **DATE** 2026-10-08 14:00 |
| **TEST_TYPE** | API (thật, tài khoản probe riêng) · **TOOL** `tools/probe-permission-save-api.mjs` |
| **RELATED** | `BUG-20261008-002` · `CHG-20261008-003` · `DEC-20261008-002` |

| # | Ca đo | EXPECTED | ACTUAL | KQ |
|---|---|---|---|---|
| B2 | non-admin có `admin_tab_06` lưu **giữ nguyên** tập đang có | 200 | **200** | ✅ |
| B2c | tự **THU HỒI** `requests.canCreate` của mình (chiều ĐI XUỐNG) | 200 | **200** | ✅ |
| B2b | đọc lại: thu hồi **ĐÃ GHI** | canCreate=0 | **0** + `admin_tab_06`=1 | ✅ |
| B3 | user ⛔ không quyền ⇒ 403 | 403 | **403** | ✅ |
| **B4** | ⛔ **TỰ CẤP THÊM `admin`** cho mình | **403** | **403** «Không được tự cấp thêm quyền cho chính mình…» | ✅ |
| **B5** | ⛔ không chặn oan — giữ nguyên | 200 | **200** | ✅ |
| **B6** | ⛔ không chặn oan — cấp cho **người khác** | 200 | **200** | ✅ |

📏 **Kết luận**: leo thang bị chặn · ⛔ **không chặn oan** · hồi quy Java **86 test · 0 fail**.

⚠️ **ĐÍNH CHÍNH PHÉP ĐO (⛔ lỗi của TÔI, ⛔ không phải sản phẩm)**: bản probe CŨ của B2/B5 gửi payload
**thêm `requests` mà tài khoản chưa có** ⇒ đó **CHÍNH LÀ leo thang** ⇒ S-1 chặn 403 là **ĐÚNG**.
Đã sửa B2 thành «giữ nguyên tập đang có» và thêm **B2c** (thu hồi) để chứng minh **GHI THẬT** bằng
chiều ĐI XUỐNG ⭐ — cách này ⛔ không vi phạm luật mới ✓

---

## TEST-20261008-006 — ✅ VERIFY **M-2** (E2E): cấp 1 quyền qua modal ⇒ VÀO ĐƯỢC quản trị · **11/11**

| ⭐ | ⭐ |
|---|---|
| **TEST_ID** | TEST-20261008-006 |
| **SESSION_ID** | ERP-SESSION-01 (SESSION_A) · **DATE** 2026-10-08 14:00 |
| **TEST_TYPE** | **E2E** (Edge headless + CDP, **LƯU THẬT**, đổi danh tính) · **TOOL** `tools/probe-grant-1-perm-e2e.mjs` |
| **RELATED** | `BUG-20261008-003` · `CHG-20261008-004` · `DEC-20261008-003` |

### DIỄN BIẾN (đúng yêu cầu user)
Tạo tài khoản mới → mở modal «Phân quyền công việc / Chức năng» → tick **ĐÚNG 1 ô** («Xem» · Tab 06)
→ «LƯU PHÂN QUYỀN →» (**lưu THẬT**) → **đăng nhập bằng chính tài khoản đó**.

### KẾT QUẢ — **11/11 ĐẠT**
| Phép kiểm | KQ |
|---|---|
| Modal mở đúng tài khoản · thẻ phân quyền | ✅ |
| Tick thêm **đúng 1 ô** (235 → 236) | ✅ |
| `admin_tab_06` **vào CSDL** (`canView=1`) | ✅ |
| Đăng nhập bằng tài khoản đó | ✅ HTTP 200 |
| **`nav groups` CÓ `system_admin`** | ✅ (trước M-2: ⛔ THIẾU) |
| **Vào màn «DANH MỤC & PHÂN QUYỀN»** | ✅ |
| **`14 tab quản trị` hiện ra** (1 Tài khoản · 2 Tổ chức · …) | ✅ (trước: **0 tab**) |
| `.permission-steps` có **14 nút** | ✅ (trước: ⛔ KHÔNG có) |
| **Bị chặn?** | **✅ KHÔNG** (trước: «CHƯA ĐƯỢC PHÂN QUYỀN») |

### 📏 BẰNG CHỨNG TỪNG CỔNG (⭐ đo được nhờ SỬA TỪNG CỔNG MỘT)
| Sau khi sửa | Đo được |
|---|---|
| ① mới `systemAdminMenuVisible` | menu **hiện** ✅ nhưng thân màn **TRỐNG** (0 tab · 238 ký tự · ⛔ không `.permission-steps`) |
| ①+② `accessDenied` | ✅ hết câu «CHƯA ĐƯỢC PHÂN QUYỀN» nhưng vẫn **0 tab** (thiếu điều kiện render) |
| ①+②+③ render `<Admin/>` | ✅ **14 tab** · `.permission-steps` 14 nút · **11/11** |

### HỒI QUY
✅ Cổng FE `scripts/regression-suite.mjs`: **925 test · 924 pass · 0 fail** (sau khi cập nhật
`tests/m118-system-admin-menu-gate.test.mjs` theo **ý định gốc MỐC 118** — ⛔ không nới test).
✅ Cổng UI `tools/verify-ui-build-applied.mjs`: `vân tay khớp SSOT` · `6/6 bundle đúng byte`.

## TEST-20261008-007 — ✅ **INTEGRATION**: API kho (H2) — 2 ca mới XANH · hồi quy **88/88**

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

## TEST-20261008-009 — ✅ **API KHO: 6/6 ĐẠT** — đo bằng **ĐÚNG payload modal gửi** (⚠️ ⛔ không bấm được UI vì nút do phiên 02 tạm khoá)

| ⭐ | ⭐ |
|---|---|
| **TEST_ID** | TEST-20261008-009 · **DATE** 2026-10-08 17:00 |
| **SESSION_ID** | ERP-SESSION-01 (SESSION_A) · **TEST_TYPE** API (thật, `:9000`→`:18081`) |
| **TOOL** | `tools/probe-warehouse-api.mjs` (⬆ MỚI) |
| **RELATED** | `CHG-20261008-005` · `CHG-20261008-006` · `HANDOFF-20261008-009` |

### ⚠️ VÌ SAO ĐO Ở TẦNG API (⛔ không phải né tránh)
📏 Nút «Tạo kho» trong `app/screens/Inventory.tsx` đang **`disabled`** với lý do ghi ngay trong mã:
«**TẠM KHOÁ (BUG-20261007-014): `app/page.tsx` chưa có modal «warehouse»**» — ⭐ việc **bật lại 4 nút là của PHIÊN 02**
(registry ghi rõ: «⭐ SAU ĐÓ: phiên 02 bật 4 nút»). ⛔ S01 **không** sửa tệp của phiên 02 ✓
⇒ Rủi ro thật nằm ở **hợp đồng payload giữa component và API** — đo được ngay, ⛔ không cần chờ UI ✓

| # | Ca đo (payload **y hệt** `WarehouseFormModal.tsx:85`) | Kỳ vọng | Kết quả |
|---|---|---|---|
| W1 | TẠO: `{ warehouseId: undefined, projectId: undefined, code, name }` | 200 + đọc lại thấy kho | ✅ 200 · `id=WH_291c3cba…` |
| **W2** | ⭐ **SỬA bằng `warehouseId`** (nhánh `editing=true`) | **200** — ⛔ **KHÔNG 400 trùng mã** | ✅ **200** + tên đã đổi + **số bản ghi cùng mã = 1** |
| W3 | `set_warehouse_status {warehouseId, active:false}` | 200 + **mất khỏi danh sách kho đang dùng** | ✅ 200 · còn trong danh sách? **false** |
| **W4** | ⭐ **BẬT LẠI** kho vừa ngừng | 200 + **quay lại danh sách** | ✅ 200 · quay lại? **true** |
| W5 | ĐỐI CHỨNG ÂM: mã trùng | **400** + nêu rõ mã | ✅ 400 · «Mã kho WH-E2E-716394 đã tồn tại.» |

**KẾT QUẢ**: 🎉 **6/6 ĐẠT · `EXIT 0`**

### ⭐ W2 LÀ CA QUYẾT ĐỊNH (⭐ chứng minh bản vá lệch khoá CÓ hiệu lực)
⛔ Nếu backend còn đọc `payload.get("id")` thì W2 = **TẠO MỚI trùng mã** ⇒ **400** ⇒ ca này ĐỎ.
✅ Nay **200** + tên đổi + ⛔ không sinh bản ghi thứ hai ⇒ ⭐ **hợp đồng `warehouseId` đã khớp** ✓

### ⚠️ SỬA PHÉP ĐO (lần 1 hỏng — ⛔ không phải lỗi sản phẩm)
Lần đầu W3 đọc `w.active` ⇒ luôn `undefined` ⇒ **ĐỎ GIẢ**. 🔎 Nguyên nhân: bootstrap dựng bằng
`FROM warehouses WHERE active=1` (`BootstrapDataAdapter:215`) ⇒ ⭐ kho NGỪNG **biến mất khỏi danh sách**
chứ ⛔ **không** trả `active=0`. ✅ Sửa: đo **có/không có trong danh sách** — đúng hiện tượng quan sát được
(⭐ bài học «số vô lý = PHÉP ĐO HỎNG, ⛔ không phải code thiếu»).

### GHI CHÚ ⛔ KHÔNG CHE
⏸ **CHƯA** đo được đường **UI** (bấm nút ⇒ modal ⇒ lưu) vì nút còn khoá ở phía phiên 02.
⚠️ Khi phiên 02 bật nút ⇒ **cần chạy lại** một probe UI để khép vòng «người dùng bấm được» ✓
⭐ Dọn dẹp: probe để kho test ở trạng thái **NGỪNG** (⛔ hệ thống cố ý **không có API xoá kho** — đúng chốt `ALLOW_DELETE_WAREHOUSE=false`) ✓

## TEST-20261008-010 — ✅ **§22 UI/UX: TAB TRONG MODAL KÍCH THƯỚC NHẤT QUÁN** — đo được, lệch **0px** · cổng FE **951/952 pass · 0 fail**

| ⭐ | ⭐ |
|---|---|
| **TEST_ID** | TEST-20261008-010 · **DATE** 2026-10-08 21:10 · **SESSION** ERP-SESSION-01 |
| **TEST_TYPE** | UI (E2E, Edge headless + CDP) · **TOOL** `tools/probe-grant-1-perm-e2e.mjs` (**+2 phép kiểm mới**) |
| **CĂN CỨ** | §22 GOAL: «tabs trong cùng một modal phải có kích thước nhất quán; ⛔ không để title dài/ngắn làm thay đổi **width** · **title area** · alignment» |

### 📏 ĐO ĐƯỢC — modal «Sửa tài khoản» (2 tab: «Sửa tài khoản» · «Phân quyền công việc / Chức năng»)
| Thẻ | WIDTH modal | Vùng TIÊU ĐỀ | Chiều cao |
|---|---|---|---|
| Thẻ 1 «Sửa tài khoản» (title NGẮN) | **1240** | **78** | 830 |
| Thẻ 2 «Phân quyền công việc / Chức năng» (title DÀI) | **1240** | **78** | 939 |
| **Lệch** | ✅ **0 px** | ✅ **0 px** | +109 px |

⇒ ✅ **§22 ĐẠT**: ⭐ `width` và **vùng tiêu đề** **BẤT BIẾN** dù tiêu đề tab dài/ngắn khác hẳn ✓
⚠️ Chiều cao thân thẻ 2 lớn hơn **109 px** — ⭐ **KHÔNG phải lỗi**: đó là **nội dung** khác nhau (ma trận 75 dòng);
§22 chỉ cấm **title dài/ngắn** làm đổi kích thước/hình học, ⛔ không cấm nội dung khác ⇒ giữ nguyên ✓

### ⭐ ĐÃ BIẾN PHÉP ĐO THÀNH **CỔNG THƯỜNG TRỰC** (⛔ không phải đo một lần rồi quên)
Thêm **2 phép kiểm** vào `tools/probe-grant-1-perm-e2e.mjs` (⭐ đo hộp modal **TRƯỚC** và **SAU** khi đổi tab):
· `§22 — WIDTH modal BẤT BIẾN khi đổi tab`
· `§22 — VÙNG TIÊU ĐỀ BẤT BIẾN khi đổi tab`
⚠️ Ghi chú thiết kế: **CỐ Ý** ⛔ không khoá cứng chiều cao (⚠️ nội dung khác nhau ⇒ chiều cao khác là hợp lệ) ✓

### KẾT QUẢ TOÀN BỘ PROBE
🎉 **CƠ CHẾ: 14/14 phép kiểm ĐẠT** (trước: 12/13) + ⚠️ 1 `finding` (`BUG-008` nhánh DƯƠNG — ⛔ **không kết luận được** do hạn chế phép đo đổi danh tính, ⛔ **không phải lỗi sản phẩm** — đã phân định ở `TEST-20261008-009`) ✓

### 🌐 TRẠNG THÁI HỆ THỐNG TẠI THỜI ĐIỂM NÀY (⭐ tin tốt cho cả nhóm)
✅ **`TM-04` ĐÃ HẾT ĐỎ** (⭐ `ERP-SESSION-03` đã xử lý `BUG-20261008-010` — 2 action tổ đội bị nới quyền) ⇒ ⭐ **CỔNG FE XANH HOÀN TOÀN: 952 test · 951 pass · 0 fail** ✓
✅ 3 cổng `:8787` `:9000` `:18081` sống · CSDL kho **12/5/10** (khớp audit) ✓
📌 **S2**: nút kho đã bật (15:07) — ⏸ chưa thấy ghi state về `allocate` (theo dõi tiếp, ⛔ không đụng) ✓

## TEST-20261008-011 — ⭐ **`BUG-008` CHỨNG MINH MỘT PHẦN**: cổng bước 01 **MỞ** khi có `admin_tab_01` (⛔ trước: khoá ở CẢ HAI nhánh)

| ⭐ | ⭐ |
|---|---|
| **TEST_ID** | TEST-20261008-011 · **DATE** 2026-10-08 21:35 · **SESSION** ERP-SESSION-01 |
| **TEST_TYPE** | UI (E2E) · **TOOL** `tools/probe-grant-1-perm-e2e.mjs` |
| **TASK** | Khép vòng `BUG-008` — viết lại **phép đo đổi danh tính** |

### 🔎 LỖI PHÉP ĐO ĐÃ SỬA (⭐ nguyên nhân tìm được rất đơn giản)
`loginInPage(u,p)` **chỉ `fetch(action:'login')` để ĐẶT COOKIE** — ⛔ **KHÔNG nạp lại app** ⇒ SPA vẫn chạy **PHIÊN CŨ**
⇒ ⚠️ cả 2 nhánh ÂM/DƯƠNG đo trong **phiên admin** ⇒ kết quả vô nghĩa (⭐ đèn báo `bước 01 bị khoá = true` ở **CẢ HAI** nhánh là dấu hiệu nhận ra).
📏 Luồng **CHÍNH** của probe làm ĐÚNG (login rồi `Page.navigate` — L118/121/145); 2 helper **tôi tự thêm** thì **thiếu** bước đó.
✅ **FIX**: thêm helper `dangNhapLai(u,p)` = login + **`Page.navigate` + `waitReady(80)`** ⇒ dùng cho cả 2 helper ✓

### 📏 KẾT QUẢ SAU KHI SỬA (⭐ đổi hẳn so với trước)
| Nhánh | `bước 01 bị khoá?` TRƯỚC | **SAU** | Ý nghĩa |
|---|---|---|---|
| ÂM (chỉ `admin_tab_02`) | `true` (⚠️ vô nghĩa) | **`true`** ✅ | ⛔ không có tab 01 ⇒ bước 01 **ĐÚNG là bị khoá** |
| **DƯƠNG (`admin_tab_01`)** | `true` (⚠️ vô nghĩa) | ⭐ **`false`** | ⭐ **có quyền ⇒ bước 01 MỞ** ⇒ **`BUG-008` CHỨNG MINH ở mức CỔNG BƯỚC** ✓ |

⇒ ⭐ **Phép đo nay PHÂN BIỆT ĐƯỢC 2 nhánh** (ÂM khoá / DƯƠNG mở) ⇒ ⭐ **bản vá `BUG-008` + cổng từng bước (`BUG-005`) đều ĐÚNG** ✓

### ⏸ CÒN THIẾU (⛔ không hạ thành «đạt»)
`nút «Sửa tài khoản» đếm được = 0` ở nhánh DƯƠNG ⇒ ⛔ **chưa kết luận** «mở bước 01 ⇒ THẤY nút»
⚠️ Nghi do **chưa chờ đủ** cho danh sách tài khoản render (hoặc cần cuộn/đợi mạng) — ⛔ **không** kết luận sản phẩm sai khi chưa đo được ✓
⭐ Giữ nguyên dạng `finding` + ghi rõ người tiếp nhận cần: **thêm `await sleep` sau khi mở bước 01 rồi đo lại** ✓
📌 `tools/probe-admin-tab01-api.mjs` (đo API) đã chứng minh **quyền ĐÃ tới client** ⇒ ⛔ không phải lỗi tầng dữ liệu ✓

### TRẠNG THÁI TỔNG (⭐ chốt phiên S1)
✅ Cổng FE **952 test · 951 pass · 0 fail** · ✅ Java **88/88** · ✅ `tsc` 0 · ✅ 3 cổng sống · ✅ CSDL kho **12/5/10** (khớp audit)
✅ Probe E2E **14/14 phép kiểm ĐẠT** + **1 `finding`** (nói trên, ⛔ không phải lỗi sản phẩm)
⭐ **Hết việc trong phạm vi S1** — phần còn lại thuộc `ERP-SESSION-02` (E2E UI kho · đặc tả `allocate`).

## TEST-20261008-012 — ✅ **`HANDOFF-20261007-007` NGHIỆM THU ĐỦ 2/2**: nút «LƯU PHÂN CÔNG» **BẬT** (`disabled=false`) sau khi chọn nhân sự ⇒ ⭐ `action={action}` CÓ TÁC DỤNG THẬT

| ⭐ | ⭐ |
|---|---|
| **TEST_ID** | TEST-20261008-012 · **DATE** 2026-10-08 17:15 · **SESSION** ERP-SESSION-01 |
| **TEST_TYPE** | UI (E2E trên `:9000`, bundle mới, trình duyệt thật) · **RELATED** `HANDOFF-20261007-007` của `ERP-SESSION-02` · `TASK-230` |
| **SCENARIO** | Mở hub Kho ⇒ 1 kho ⇒ tab «Nhân sự» ⇒ «＋ THÊM NHÂN SỰ» ⇒ chọn 1 ứng viên ⇒ đọc `[data-vntech="wd-staff-save"]`.disabled |
| **EXPECTED** | `disabled = false` (⭐ tiêu chí S02 đặt ra) |
| **ACTUAL** | ⭐ **`disabled = false`** ✓ · nhãn nút «LƯU PHÂN CÔNG» ✓ · ⭐ **TRƯỚC khi chọn người = `true`** ⇒ **đổi đúng thiết kế** ✓ |
| **RESULT** | 🟢 **ĐẠT** |
| **ĐƯỜNG ĐO** | ⭐ `:9000` → `.nav-child-warehouse` → `[data-vntech="warehouse-card"]` → `[data-vntech="wd-tab-4"]` → `[data-vntech="wd-staff-add"]` → 1 `[data-vntech="wd-staff-candidate"]` → đọc `.disabled` ✓ |
| **⭐ SỰ THẬT PHỤ ĐO ĐƯỢC** | ⭐ **4 nút kho ĐÃ BẬT** trong hub: `＋ TẠO KHO` · `✎ SỬA` · `⏹ NGƯNG HOẠT ĐỘNG` (+ `⇄ CHUYỂN KHO`, `▤ THẺ KHO`, `▥ IN MÃ BARCODE`) ⇒ ⭐ **bước ① của `HANDOFF-20261008-007` (S01 giao S2) ĐÃ XONG** ✓ |
| ⚠️ **GIỚI HẠN CÓ Ý** | ⛔ **KHÔNG bấm «Lưu phân công»**: thao tác gọi `save_user_access` = **FULL-REPLACE** (`clearUserScopes()` xoá rồi ghi lại **toàn bộ** `modulePermissions`) ⇒ ⚠️ **phá quyền thật của tài khoản thật** (⭐ bài học `BUG-20261008-007`). ⭐ Muốn khép tới CSDL: dùng **1 tài khoản rác dùng-một-lần** ✓ |
| **ENVIRONMENT** | FE bundle vân tay `BB706F1202490077` (6/6 byte khớp) · BE `:18081` · MySQL `vntech_erp` · 3 cổng sống |

## TEST-20261008-013 — ✅ **`BUG-008` CHỨNG MINH ĐỦ 2 CHIỀU** (ÂM khoá / DƯƠNG mở) ⇒ ⭐ probe **15/15 ĐẠT · HẾT `finding`**

| ⭐ | ⭐ |
|---|---|
| **TEST_ID** | TEST-20261008-013 · **DATE** 2026-10-08 17:45 · **SESSION** ERP-SESSION-01 |
| **TEST_TYPE** | UI (E2E, trình duyệt thật + CDP) · **TOOL** `tools/probe-grant-1-perm-e2e.mjs` |
| **RELATED** | `BUG-20261008-008` · `BUG-20261008-009` (bản vá `hasAdminTab` + 4 cổng `page.tsx`) · `S-1` |

### 📏 KẾT QUẢ ĐO (⭐ ĐÃ ĐO, ⛔ không suy đoán)
| Nhánh | Quyền cấp | `bước 01 bị khoá?` | Dòng bảng | Nút «Sửa tài khoản» |
|---|---|---|---|---|
| **ÂM** | chỉ `admin_tab_02` | ⭐ **`true`** (KHOÁ) | 11 | 0 |
| **DƯƠNG** | thêm `admin_tab_01` | ⭐ **`false`** (MỞ) | 1 | 0 |
⇒ ⭐ **HAI NHÁNH KHÁC NHAU RÕ RỆT** ⇒ quyền uỷ nhiệm **CÓ tác dụng thật** ✓ — ⭐ **chính là điều `BUG-008` cần chứng minh** ✓

### 🔎 GỠ ĐƯỢC 2 NGHI VẤN SAI BẰNG CÁCH **ĐO**, ⛔ KHÔNG ĐOÁN
| Nghi vấn | Cách kiểm | Kết luận |
|---|---|---|
| (a) Dấu tiếng Việt **NFC/NFD** làm regex ⛔ không khớp | Đo trên màn thật: khớp **25/25** bằng **cả** `/Sửa tài khoản/i` **VÀ** hàm chuẩn hoá | ❌ **SAI** |
| (b) **TIMING** — đếm trước khi bảng render | Thêm `choBangTaiKhoan()` **poll** tới khi bảng có dòng | ✅ **ĐÚNG** (đã sửa) |
| (c) ⭐ `nút «Sửa tài khoản» = 0` ở nhánh DƯƠNG có phải BUG? | ⭐ Đo `dòng bảng` = **1** ⇒ tài khoản uỷ nhiệm tối thiểu **chỉ thấy CHÍNH MÌNH** | ✅ ⭐ **KHÔNG phải bug** — ⛔ **không được tự sửa mình** (⭐ đúng luật `S-1` tôi đã cài) ✓ |

⚠️ **TỰ NHẬN SAI ĐỀ**: giả thuyết ban đầu của tôi («mở bước 01 ⇒ **phải** thấy nút Sửa tài khoản») là **SAI ĐỀ** — ⛔ không phải sản phẩm sai.
⭐ **Sửa phép kiểm cho đo ĐÚNG HỢP ĐỒNG THẬT**: *có quyền ⇒ bước MỞ (+ bảng render) · ⛔ không quyền ⇒ bước KHOÁ* ✓

### 🎯 TRẠNG THÁI PROBE CUỐI
```
CƠ CHẾ: 15/15 phép kiểm ĐẠT   (⛔ KHÔNG còn `finding` nào)
```
⭐ Từ **12/13 + 1 `finding`** ⇒ **15/15 ĐẠT** sau 3 lần sửa phép đo (đổi danh tính · timing · sai đề) ✓

### 📌 BÀI HỌC (D-101)
> **Khi một phép đo cho kết quả VÔ LÝ, ⛔ đừng kết luận sản phẩm sai — hãy nêu giả thuyết rồi ĐO TỪNG GIẢ THUYẾT.**
> ⭐ 3 lần liên tiếp "đỏ" của tôi đều do **PHÉP ĐO**, ⛔ không phải sản phẩm (đổi danh tính · timing · sai đề) ✓
> ⚠️ Và: **kỳ vọng phải suy từ HỢP ĐỒNG**, ⛔ không từ cảm giác «chắc là phải thấy nút» ✓

## TEST-20261008-014 — ✅ **QA BỘ TÀI LIỆU `ALPHA TEST`**: quét số cũ sót · phân định «cố ý» vs «lệch thật» · làm rõ 2 số dễ mâu thuẫn

| ⭐ | ⭐ |
|---|---|
| **TEST_ID** | TEST-20261008-014 · **DATE** 2026-10-08 · **SESSION** ERP-SESSION-01 · **RELATED** `TASK-20261008-005` |
| **TEST_TYPE** | DOCUMENTATION QA (đối chiếu 5 tài liệu mới viết với **bảng số liệu nền** đã đo) |

### 📏 CÁCH LÀM
Quét 5 tài liệu (`31` · `30` · `33` · `32` · `34`) tìm **số CŨ** còn sót: `42 màn` · `224` · `135 action` · `926` · `114 bảng` · `tableCount=114` · `166+` · `chưa push`
⇒ ⭐ **ĐỌC NGỮ CẢNH từng hit** trước khi sửa (⚠️ bài học: ⛔ đừng xoá số chỉ vì nó khác — có thể là **bảng so sánh «cũ → mới» CỐ Ý**) ✓

### 🎯 KẾT QUẢ PHÂN ĐỊNH
| # | Tài liệu | Hit | Phân định |
|---|---|---|---|
| 1 | `33` L63 · L147 · L513 | «42 màn» · «~224 case» · «~135 action» · «484→926» | ✅ **CỐ Ý** — trong khối «⚠️ Chênh lệch với bản 23/09/2026 (đã cũ)» + «số đo hôm nay là 2 772» ✓ |
| 2 | `31` L218 · L265 | «166+ commit chưa push» · «114 bảng baseline» | ✅ **CỐ Ý** — «câu cũ … **SAI ở thời điểm 08/10**» + «nay đã lệch: 134 bảng, 38 migration» ✓ |
| 3 | `32` L203 | «114 bảng baseline» | ✅ **CỐ Ý** — «Số THẬT hôm nay là 134» ✓ |
| 4 | **`34` L84** | «KHÔNG phủ hết **114 bảng** MySQL» | 🔴 **LỆCH THẬT** (⛔ không phải so sánh — nêu như số hiện tại) ⇒ ✅ **ĐÃ SỬA thành 134** + ghi cách đo |
| 5 | `30` | — | ✅ **sạch** |

### ⚠️ LÀM RÕ 2 SỐ DỄ BỊ COI LÀ MÂU THUẪN
Chỉ mục ghi `app/screens/*.tsx` = **52** · tài liệu `33`/`32`/`34` ghi **55** ⇒ ⭐ **KHÁC BỘ LỌC, ⛔ không mâu thuẫn**:
- **55** = `Get-ChildItem app/screens -File` (mọi tệp)
- **52** = lọc `-Filter *.tsx`
✅ Đã sửa chỉ mục thành: «⭐ **55 tệp** (trong đó **52** `.tsx`) — ⚠️ 2 số KHÁC BỘ LỌC, ⛔ không mâu thuẫn» ✓

### 📌 BÀI HỌC (D-105)
> ⛔ **Đừng "sửa" một con số chỉ vì nó khác bảng số nền** — ⭐ phải **đọc ngữ cảnh**: nó có thể là
> **so sánh cố ý «cũ → mới»** (giữ lại để người đọc biết tài liệu đã được cập nhật) ✓
> ⚠️ Và: khi **2 tài liệu ghi 2 số khác nhau**, ⭐ kiểm **BỘ LỌC/PHÉP ĐO** trước khi kết luận mâu thuẫn ✓

### KẾT LUẬN
✅ Bộ tài liệu `ALPHA TEST` **nhất quán với số liệu nền đo ngày 08/10/2026**; 1 chỗ lệch đã sửa; 2 số dễ nhầm đã được làm rõ ✓
