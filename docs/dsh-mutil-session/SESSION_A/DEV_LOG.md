# DEV_LOG — SESSION_A (ERP-SESSION-01)

> Phien: **ERP-SESSION-01** · Timezone Asia/Ho_Chi_Minh (UTC+7) · Pham vi: **PHAN QUYEN + BAO LOI + MUA HANG/GIAO NHAN**
> ⭐ **§4**: ⭐ DEV_LOG phai mo ta **DA PHAT TRIEN/SUA KY THUAT GI** — ⛔ **KHONG chi noi «task nao da lam»** ✓

---

## DEV-20261006-001

Date: 2026-10-06
Session: ERP-SESSION-01
Module: Toan he thong (backend Java)
Area: **Backend** + **DevOps**
Development: ⭐ **9 ban va Java** de dap **4 loi HTTP 500** khi API nhan payload rong/khong day du + ⭐ **sua cong cu trien khai**.
Technical Approach: ⭐ Voi moi API loi: **doc NGAN XEP LOI THAT** (⛔ khong doc ma roi suy doan) ⇒ xac dinh dong gay loi ⇒ them guard **payload rong** + **chuan hoa kieu du lieu** (⭐ nhieu loi do kieu du lieu bootstrap tra ve khac kieu ma FE gia dinh). ⚠️ ⭐ **1 loi do CHINH TOI gay ra**: **25 dong `//` nam TRONG text block `"""` cua Java** ⇒ ⭐ trong Java, `//` **NAM TRONG chuoi** (⛔ khong phai comment) ⇒ **chuoi tieng Viet bi gui xuong MySQL nhu cau lenh SQL** ⚠️ ⇒ HTTP 500. ⭐ Sua: **chuyen `//` ra NGOAI text block**. ⭐ Cong cu trien khai: doi thu tu thanh **dung Java ⇒ build ⇒ migration check ⇒ start** (⭐ vi tien trinh Java **giu khoa JAR** ⇒ `spring-boot-maven-plugin:repackage` **khong rename duoc** ⇒ build **LUON that bai**) + ⭐ **tu khoi phuc JAR cu** neu build loi hoac thieu migration.
Implementation: 9 tep service Java + `MaterialCatalogStoreAdapter.java` + `tools/deploy-java-backend.mjs` (⭐ quet toan bo `java-backend` xac nhan **chi 1 tep** bi loi `//` trong text block).
Dependencies: ⛔ Khong them thu vien · ⛔ khong API moi · ⛔ khong migration.
Shared Components: —
API: `POST /api/system` · `GET /api/system` (bootstrap).
Database: ⭐ **Chi DOC** trong buoc nay.
RBAC: —
Workflow: —
Result: ⭐ **4 loi HTTP 500 da dap** · nghiem thu **5/5 DAT** · `preview_material_dependencies` ⇒ **HTTP 200 · 237 vat tu**.

---

## DEV-20261006-002

Date: 2026-10-06
Session: ERP-SESSION-01
Module: Quan tri — bao loi
Area: **Frontend** + **API**
Development: ⭐ Sua **2 loi doc du lieu** o man bao loi: ① danh sach bao loi **RONG voi moi tai khoan** · ② dropdown «Nhom chuc nang» **RONG**.
Technical Approach: ① ⭐ **NGUYEN NHAN GOC**: man bao loi doc `res?.reports` tu `submit(...)` — ⚠️ nhung `action()` trong `page.tsx` **KHONG tra payload** (⭐ tra `undefined` khi thanh cong ⇒ ⭐ **chinh nha da ghi canh bao o `page.tsx:318-319`**) ⇒ ⭐ `res?.reports` **luon `undefined`**. ⭐ Sua: doi prop thanh **`submit={requestApi}`** (⭐ ham **CO tra JSON** va **NEM LOI** khi HTTP khong OK). ② ⭐ Bo loc `String(m.active ?? 1) === "1"` ⚠️ nhung bootstrap tra ve **boolean `true`** (⛔ khong phai so `1`) ⇒ ⭐ moi dong deu bi loai. ⭐ Sua: ham `dangHoatDong = (v) => v === true || String(v ?? 1) === "1" || String(v) === "true"`.
Implementation: `app/page.tsx` (doi prop buoc 14) · `app/screens/ErrorReportAdminPanel.tsx` · `app/screens/ErrorReportModal.tsx`.
Dependencies: ⛔ Khong them thu vien.
Shared Components: ⭐ `requestApi` — ⭐ **ham dung chung cua nha** (⭐ ⛔ khong viet ham moi).
API: `error_reports` ⇒ **HTTP 200 · 18 bao cao**.
Database: ⭐ Chi DOC.
RBAC: ⭐ Lat sau phat hien: **`RbacService` loai tru vai tro `admin`** khoi kiem module.
Workflow: —
Result: ⭐ **USER XAC NHAN BANG MAT** «da hien thi bao loi» · ⭐ dropdown **0/76 → 75 muc**.

---

## DEV-20261006-003

Date: 2026-10-06
Session: ERP-SESSION-01
Module: Phan quyen nguoi dung + phong ban
Area: **RBAC** + **Backend** + **Frontend**
Development: ⭐ ① Bo chot `P5.3` cho phep **cap quyen VUOT phong ban** · ② Sua tab phong ban «**bao loi luu**» · ③ Them **«Chon tat ca»** + cot **«Ca dong»**.
Technical Approach: ① ⭐ Chot `assertDepartmentAllowsPermissions(targetUserId, target, payload)` (`UserManagementUseCase.java:266`) chan moi quyen vuot phong ban ⇒ ⭐ **comment bo** (⛔ KHONG xoa — de lai dau vet) + ⭐ **GIU NGUYEN** guard payload rong (MOC 111, dong ~274). ⚠️ ⭐ **PHAI viet lai bai test** `AdminGovernanceIntegrationTest` vi no **khang dinh chinh hanh vi `P5.3` cu** ⇒ ⭐ doi ten thanh `phanQuyenPhongBan_capVuotQuyenChoNguoiDung_KHONGConChan` + doi `expectRejected(...)` → `ok(...)` + ⭐ **khang dinh MANH HON** (kiem ca quyen **DA duoc ghi**). ② ⭐ **CUNG LOI `action()`** nhu DEV-002: `if (await action(…)) ok++;` ⇒ `ok` **LUON = 0** ⇒ thong bao **luon «Da luu 0/N»** ⚠️ **DU du lieu VAN DUOC LUU THAT** ⇒ ⭐ nguoi dung **tuong la loi luu**. ⭐ Sua: `requestApi` + `try/catch` **TUNG** chuc nang (⭐ 1 chuc nang loi ⛔ **khong chan** cac chuc nang con lai) + ⭐ dem them `that` + hien ro. ③ ⭐ Them `FULL_CAPS` · `selectAll` · `setRowAll` · `rowState` · `allRowsFull` + nut **«Chon tat ca»** + cot `{ key: "crow" }` **«Ca dong»** (⭐ co `el.indeterminate`).
Implementation: `UserManagementUseCase.java` · `AdminGovernanceIntegrationTest.java` · `app/page.tsx` (ham `save()` + 3 helper + nut + cot).
Dependencies: ⛔ Khong them thu vien · ⛔ khong migration.
Shared Components: ⭐ `PermissionAccessPanel` (⭐ panel dung chung — ⭐ **da kiem: KHONG can sua**, CSS day du trong `app/styles/canonical.css` §11).
API: `save_department_permission` · `delete_department_permission` · `save_user_access`.
Database: ⭐ `department_module_permissions` · `user_module_permissions`.
RBAC: ⭐ **THAY DOI HANH VI NGHIEP VU** — cap quyen linh hoat hon.
Workflow: —
Result: ⭐ `mvn -o test` **156/156** · ⭐ **7/8 chuoi dac trung CO trong bundle** `:8787` va `:9000`.

---

## DEV-20261006-004

Date: 2026-10-06
Session: ERP-SESSION-01
Module: Quan tri — buoc 14 (kiem quyen)
Area: **RBAC** + **Frontend**
Development: ⭐ ① Khoa nut buoc 14 khi **thieu quyen** (yeu cau user) · ② ⚠️ **Sua loi DO CHINH TOI gay ra**: nut bi **KHOA OAN** voi tai khoan `admin`.
Technical Approach: ① Lan 1: dung helper nha `hasAdminTab(data, "admin")` (⭐ kiem `allModulePermissions` co `canView === 1`). ⚠️⚠️ **NHUNG DO CHINH TOI GAY RA BUG**: tai khoan `admin` **KHONG co dong quyen module nao** (⭐ **DO THAT**: `so_dong_quyen = 0` · `allModulePermissions` cua chinh `admin` = **0**) ⇒ ⭐ `hasAdminTab` tra **FALSE** ⇒ ⭐ **NUT BI KHOA VINH VIEN**. ⭐ **VI SAO API VAN CHAY**: ⭐ **`RbacService` LOAI TRU vai tro `admin`** khoi kiem module (⭐ goi that `error_reports` bang `admin` ⇒ **HTTP 200 · 18 bao cao**) ⚠️ **NHUNG UI thi ⛔ khong biet** ⇒ ⭐ **UI CHAT HON API**. ② ⭐ SUA DUNG: `isAdminUser(data.user) || hasAdminTab(data, "admin")` — ⭐ dung **helper CO SAN CUA NHA** (`lib/permissions.ts:13`: `user.role === "admin" || roleBase(user) === "admin"`), ⭐ da import o `page.tsx:51`, ⭐ **chinh nha cung dung no** trong `modulePermission` (`lib/permissions.ts:16`).
Implementation: `app/page.tsx` (dong ~2689 — `coQuyenBaoLoi`).
Dependencies: ⛔ Khong them thu vien.
Shared Components: ⭐ `isAdminUser` · `hasAdminTab` — ⭐ **helper dung chung cua nha**.
API: —
Database: ⭐ Chi DOC (`user_module_permissions` · `allModulePermissions`).
RBAC: ⭐ **BAI HOC QUAN TRONG**: ⭐ **`hasAdminTab` ⛔ KHONG thay the duoc `isAdminUser`** — ⭐ **kiem quyen module PHAI LUON tinh ca vai tro `admin`** ✓
Workflow: ⭐ **Giu nguyen so thu tu buoc** (⛔ KHONG loc mang — ⭐ loc se lam `index` lech ⇒ **sai luon cac buoc sau**).
Result: ⭐ **USER XAC NHAN BANG MAT** ⇒ `VERIFIED`.

---

## DEV-20261006-005

Date: 2026-10-06
Session: ERP-SESSION-01
Module: Mua hang / Giao nhan (**F2**)
Area: **Workflow** + **Backend** + **Testing** + **Database (schema test)**
Development: ⭐ Them **cong chan trang thai PO** cho `receive_goods` + ⭐ **sua GOC LOI o schema test**.
Technical Approach: ⭐ **GOC LOI** (⭐ **doc tu NGAN XEP LOI THAT**, sau **3 lan doan sai**): `java-backend/web/src/**test**/resources/schema-h2.sql` **THIEU 3 cot** (`decision_reason` · `decided_by` · `decided_at`) ma **MySQL that DA CO** (do migration `V18__wf_b2_po_decision.sql`) ⇒ ⭐ `approve_po` **KHONG chay duoc trong bai test** (`JdbcSQLSyntaxErrorException: Column "decision_reason" not found` tai `PurchaseStoreAdapter.decidePo:268`) ⇒ ⭐ cac bai test phai **DI VONG** — goi thang `receive_goods` tren PO **chua phat hanh** ⇒ ⭐ **vo tinh MA HOA chinh hanh vi cua loi F2**. ⭐ Sua: ① **them 3 cot** vao schema test (⚠️ **neo phai gom `delivery_queued_at`+`delivery_completed_at`** vi `contract_id`+`boq_version_id`+`PRIMARY KEY` **trung 7 cho**) · ② **cong chan** trong `PurchaseManagementUseCase.receiveGoods` — ⚠️ **⛔ KHONG dat trong `findPoForReceiving`** vi co **3 noi goi** — ⭐ `decidePo` **CAN** `pending_approval`. ③ `StockChainIntegrationTest`: them buoc `approve_po` (⚠️ ⭐ tep nay **KHONG co static import `assertEquals`**, chi co `assertTrue`). ④ `SupplyChainEndToEndIntegrationTest`: them `approve_po` + khang dinh `waiting_delivery`.
Implementation: `schema-h2.sql` · `PurchaseManagementUseCase.java` · `StockChainIntegrationTest.java` · `SupplyChainEndToEndIntegrationTest.java`.
Dependencies: ⛔ Khong them thu vien · ⛔ khong migration.
Shared Components: ⭐ `findPoForReceiving` — ⚠️ **co 3 noi goi** ⇒ ⛔ **khong duoc dat cong chan o day**.
API: `receive_goods` ⇒ ⭐ **HTTP 400** voi PO `pending_approval`.
Database: ⭐ **Schema test** (`web/src/test/resources/`) — ⚠️ **⛔ KHONG phai** `web/src/**main**/resources/db/demo/schema-h2.sql` (⭐ **sua tep nay ⛔ KHONG co tac dung** voi test).
RBAC: —
Workflow: ⭐ **Cong chan F2**: chi cho phep khi PO o `waiting_delivery`/`partial_delivery`.
Result: ⭐ `mvn -o test` **156/156** · ⭐ **VERIFIED runtime** (⭐ HTTP 400 + dung thong diep + **⛔ KHONG ghi du lieu** — ⭐ doi chung `status` khong doi · `so_GRN` khong tang).
⚠️ **BAI HOC**: ⭐ **`mvn -o test` 156/156 ⛔ KHONG chung minh SQL chay duoc** (H2 de tinh hon MySQL) · ⭐ **1 tep schema co the co NHIEU BAN** (`main/` vs `test/`) ⇒ ⭐ **phai xac dinh ban NAO dang duoc dung TRUOC khi sua** ✓

---

## DEV-20261006-006

Date: 2026-10-06
Session: ERP-SESSION-01
Module: Kho / Van chuyen (**BUG-20261005-005**)
Area: **Database** + **Integration**
Development: ⭐ Go ket **5 phieu** `central_returns` ket `in_transit` bang cach **ghi bu so kho**.
Technical Approach: ⭐ **NGUYEN NHAN GOC** (⭐ ghi o `WarehouseStockStoreAdapter:893`): ban xuat TRUOC khi **chi ghi `stock_movements`** ma ⛔ **KHONG ghi `contract_stock_ledger`** ⇒ ⭐ so kho **THIEU** ⇒ guard tai `StockManagementUseCase:925` («So lieu Transit vat ly/Contract khong du; dung nhan de tranh sai ton») **chan viec nhan** ⇒ phieu ket. ⭐ Sua: ⭐ **sao luu TRUOC** (`backup_csl_20261006` — **150 dong**) ⇒ ⭐ ghi bu **10 dong** (5 × **−qty** tai kho nguon `WH_84200d27-0d30-4a73-9ebc-43800e741c2a` · 5 × **+qty** tai `WH-TRANSIT`) ⇒ ⭐ thu nhan lai **ca 5 phieu**.
Implementation: ⭐ **Chi du lieu** — ⛔ **KHONG sua ma nguon**.
Dependencies: —
Shared Components: —
API: (⭐ thu qua UI/API nhan hang)
Database: ⭐ `contract_stock_ledger` · `central_returns` · `stock_movements`.
RBAC: —
Workflow: ⭐ Go ket buoc «Nhan hang tu Kho Tong».
Result: ⭐ `in_transit` **5→0** · so kho **96→101** · xuat hien `CENTRAL_RETURN_RECEIVE = **5**`.
⚠️ **DINH CHINH**: ⭐ Toi tung khang dinh «`reconcileContractStock` sua duoc so kho» — ⭐ **SAI**, no **chi doi chieu (`write=false`)** ✓

---

## DEV-20261006-007

Date: 2026-10-06
Session: ERP-SESSION-01
Module: Du lieu quyen (**don mo coi**)
Area: **Database** + **Performance** (do luong du lieu)
Development: ⭐ Xoa **570 dong quyen MO COI** trong `user_module_permissions`.
Technical Approach: ⭐ **Sao luu TRUOC** (`backup_ump_20261006` — **2198 dong**) ⇒ ⭐ `DELETE c FROM user_module_permissions c WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = c.user_id)` ⇒ ⭐ **DOI CHIEU SAO LUU** de **chung minh ⛔ khong pha du lieu**.
Implementation: ⭐ **Chi du lieu** — ⛔ khong sua ma nguon.
Dependencies: —
Shared Components: —
API: —
Database: ⭐ `user_module_permissions`.
RBAC: ⭐ Don mo coi giup **so lieu quyen chinh xac** hon.
Workflow: —
Result: ⭐ 2198→**1628** · mo coi **570→0** · ⭐ **hop le 1628 KHONG DOI** · ⭐ **«dong bi xoa thuoc `e2e.*`» = 0** ✓

---

## DEV-20261006-008

Date: 2026-10-06
Session: ERP-SESSION-01
Module: Phan quyen phong ban (**BUG-20261007-001**)
Area: **Frontend** + **Performance** + **DevOps** (phuong phap do)
Development: ⭐ **CHAN DOAN** nguyen nhan «luu phan quyen phong ban **doi rat lau**» — ⛔ **CHUA SUA XONG**.
Technical Approach: ① ⭐ **DO THOI GIAN 1 LOI GOI** bang `Invoke-WebRequest` + `Stopwatch` ⇒ ⭐ **11,50 GIAY** (⭐ thong diep API tra ve **tu to cao** nguyen nhan: «**dong bo lai 27 tai khoan**»). ② ⭐ **DOC MA BACKEND**: `syncDepartmentUsers` (`UserManagementUseCase.java:632`) chay **SAU MOI lan luu** ⇒ lap **27 tai khoan dang hoat dong** × `replaceDepartmentDefaults` (:484) lap **61 module** ⇒ ⭐ **~1.647 luot truy van+ghi cho MOT lan luu**. ③ ⭐ **DOI CHIEU CSDL THAT**: phong `ORG-BGD` — `updated_at` chay **13:33:19 → 13:40:09 (~7 phut)** roi **DUNG** ⇒ ⭐ **55/61 module DA luu** · ⚠️ **6 module CHUA** (⭐ van giu `updated_at = 2026-09-18`) ⇒ ⭐ **ket luan: user TUONG TREO nen ROI TRANG ⇒ du lieu luu DO DANG** ⚠️ (⭐ **dong nghia HONG DU LIEU**, ⛔ khong chi la van de UI). ④ ⚠️ **THU SUA 4 LAN — CA 4 LAN BI ESLint DO**: them **TIEN DO** + **goi SONG SONG theo LO 4**. ⭐ **NGUYEN NHAN THAT cua viec ESLint do** (⭐ tim ra o lan thu 5): ⭐ **lan sua DAU TIEN da XOA MAT dong khai bao `let ok = 0, that = 0, loiDau = "";` cua `deleteSelected()`** ⇒ no **gan vao bien cua `save()`** ⇒ ⭐ ESLint bao **DUNG**: «**Cannot reassign variables declared outside of the component/hook**». ⭐ Da **them lai dong khai bao** ⇒ `npm test` **XANH**.
Implementation: `app/page.tsx` — ⚠️ ⭐ **sau 4 lan thu, DA HOAN NGUYEN VE BAN GOC** ⇒ hien tai ⛔ **khong co thay doi thuc**.
Dependencies: ⚠️ ⭐ **Luat ESLint (React Compiler) trong `eslint.config.*`** — ⭐ **phai doc ky TRUOC khi sua**.
Shared Components: ⚠️ `save()` va `deleteSelected()` — ⭐ **cung khuon, cung loi** (⭐ sua 1 ham phai sua ca 2).
API: `save_department_permission` · `delete_department_permission`.
Database: `department_module_permissions` · `user_module_permissions`.
RBAC: —
Workflow: ⭐ Luu phan quyen phong ban ⇒ **dong bo quyen nhan su**.
Performance: ⭐ **DIEM NONG**: 11,50 giay/lan goi · **~1.647 luot ghi/lan**.
Result: ⛔ **CHUA FIXED**. ⭐ Chan doan **XONG** · ⭐ `npm test` **EXIT=0 · pass 802 · fail 0** tren ban goc.
⭐ **HUONG SUA DE XUAT** (⭐ **tot hon sua o frontend**): ⭐ **sua o BACKEND** — bo `syncDepartmentUsers` khoi **MOI** lan luu, ⭐ **chi dong bo 1 LAN O CUOI** ⇒ ⭐ **11,5 giay → ~1 giay** ✓
⭐ **BAI HOC**: ⭐ **MOT loi goi API 11,5 giay = dau hieu backend lam viec NANG GAP BOI** ⇒ ⭐ **phai DO thoi gian 1 loi goi** TRUOC khi doan «treo» hay «loi» ✓ · ⭐ **VA**: ⭐ **khi `edit` thay mot KHOI DAI ⇒ PHAI giu lai MOI dong khai bao** ✓

---

## DEV-20261006-009

Date: 2026-10-06
Session: ERP-SESSION-01
Module: DevOps / Dieu phoi da phien
Area: **DevOps** + **Documentation** + **Performance (do luong)**
Development: ⭐ Thiet lap **co che dieu phoi 2 phien** + ⭐ **phuong phap KIEM BUNDLE DUNG** + ⭐ **thiet lap log chuan hoa**.
Technical Approach: ① ⭐ **Phat hien phien khac bang `git status`** — ⛔ **KHONG bang tien trinh/cong** (⭐ khai bao dau tien cua toi «⛔ khong co phien thu hai» la **SAI**). ② ⭐ Phan loai **toan bo** duong trong `git status` ⇒ chung minh **`FILES A ∩ FILES B = ∅`**. ③ ⭐ Ghi vao `docs/dsh-state/SESSION_REGISTRY.md`: **3 VUNG XUNG DOT THAT** + luat: ① `docs/dsh-state/*.md` (ca hai deu ghi) · ② `VNTECH_FINGERPRINT.json` + `lib/vntech-identity-data.mjs` (⭐ **tu sinh moi lan build**) · ③ `dist/` (⭐ **ghi de lan nhau**). ④ ⭐ **PHUONG PHAP KIEM BUNDLE DUNG** (⭐ toi da **sai 6 lan** truoc khi tim ra): ⭐ **ⓐ dung `href`** (⛔ khong chi `src` — Next.js dung `<link rel="modulepreload" href="…">`) · ⭐ **ⓑ TAI VE DIA roi doc** (⛔ dung doc `Content` truc tiep) · ⭐ **ⓒ tim chuoi RAW** (⭐ bundle luu tieng Viet **RAW**, ⛔ KHONG escape) · ⭐ **ⓓ ⛔ dung tim TEN BIEN NOI BO** (minify doi ten — ⭐ **chi tim CHUOI VAN BAN / KHOA DOI TUONG**) ✓ ⑤ ⭐ **Thiet lap log chuan hoa** `SESSION_A/` theo chuan moi (9 loai log) + ⭐ cap nhat **2 tep dung chung** (⭐ **giu nguyen du lieu cua `ERP-SESSION-02`** — §25).
Implementation: `docs/dsh-state/SESSION_REGISTRY.md` · `docs/dsh-state/CHECKLIST.md` (VONG 79/80/81) · `docs/dsh-mutil-session/SESSION_A/**` · `docs/dsh-mutil-session/{SHARED_TODO,SESSION_REGISTRY}.md`.
Dependencies: —
Shared Components: ⭐ `docs/dsh-state/*.md` · `VNTECH_FINGERPRINT.json` · `lib/vntech-identity-data.mjs` · `dist/`.
API: —
Database: —
RBAC: —
Workflow: ⭐ `verify-ui-build-applied.mjs --port=8787` ⇒ ⭐ **phai thay `✓ byte 6/6`** + **`KET LUAN: BAN CHAY DUNG BAN DA BUILD MOI NHAAT`** TRUOC khi bao user test ✓
Result: ⭐ 2 phien chay song song **⛔ khong xung dot ma nguon** · ⭐ **28 duong** phan loai het (**13 cua toi + 8 cua phien 02**) · ⭐ log chuan hoa bat dau.
⚠️ **BANG CHUNG ve `dist/`**: ⭐ bundle trang doi **3 LAN** trong mot phien — `page-CQTVKoge.js` → `page-CygT2G3w.js` (⭐ **THIEU 2 ban va cua toi** ⇒ ⭐ **user bao DUNG, ⛔ KHONG phai cache**) → `page-CcbWX2ln.js` (⭐ du 7 ban va) ✓

---

## TONG KET DEV

| Area | So luong entry |
|---|---|
| Frontend | 5 (-002 · -003 · -004 · -008 · -009) |
| Backend | 2 (-001 · -005) |
| API | 2 (-002 · -003) |
| Database | 3 (-005 · -006 · -007) |
| RBAC | 3 (-003 · -004 · -007) |
| Workflow | 2 (-005 · -006) |
| Testing | 1 (-005) |
| Performance | 2 (-007 · -008) |
| DevOps | 2 (-001 · -009) |
| Integration | 1 (-006) |
| Shared Component | 4 (-002 · -003 · -004 · -009) |
| Documentation | 1 (-009) |

> ⭐ **TONG**: **9 entry DEV** — ⭐ trong do **2 entry la CHAN DOAN** (-008 · -009) va ⭐ **1 entry ⛔ CHUA SUA XONG** (-008) ✓
> ⭐ **DIEM NONG KY THUAT CHUA GIAI QUYET**: ⭐ **`save_department_permission` = 11,50 giay/lan** (⭐ ~1.647 luot ghi/lan luu) ⇒ ⭐ **uu tien sua o BACKEND** ✓

---

# ✅ **DEV-20261006-010 — ĐÃ GIẢI QUYẾT ĐIỂM NÓNG KỸ THUẬT** (⭐ §11 «TASK COMPLETION LOGGING»)

> ⭐ Dòng 203 ghi «**CHƯA GIẢI QUYẾT**» ⚠️ ⇒ ⭐ **NAY ĐÃ GIẢI QUYẾT + ĐÃ LÊN SÓNG + ĐÃ ĐO** ✓

| ⭐ Trường | ⭐ Giá trị |
|---|---|
| **DEV_ID** | `DEV-20261006-010` |
| **DATE** | 2026-10-06 15:07:06 |
| **SESSION_ID** | `ERP-SESSION-01` |
| **AREA** | ⭐ `Backend` + `Frontend` + `DevOps` + ⭐ `Performance` |
| **MODULE** | ⭐ Phân quyền phòng ban — `save_department_permission` |
| **TASK** | `TASK-20261006-011` · **BUG** `BUG-20261007-001` · **CHG** `CHG-20261006-011` |

## ## 🔧 **ĐÃ PHÁT TRIỂN GÌ** (⭐ §4 «DEV_LOG phải mô tả **đã phát triển/sửa KỸ THUẬT gì**»)

### ① **Backend — cờ TÙY CHỌN `syncNow`** (⭐ `UserManagementUseCase.java` dòng ~591)
```java
boolean dongBoNgay = !"false".equalsIgnoreCase(trim(payload.get("syncNow")));
Instant now = Instant.now();
store.upsertDepartmentPermission(idGenerator.next("DMP"), organizationUnitId, moduleKey, ...);
int synced = dongBoNgay ? syncDepartmentUsers(now) : 0;
return "Đã lưu quyền phòng ban cho chức năng “" + moduleKey + "”"
        + (dongBoNgay ? "; đồng bộ lại " + synced + " tài khoản."
                      : " (⭐ chờ đồng bộ ở bước cuối).");
```
⭐ **Thiếu cờ ⇒ `dongBoNgay = true`** ⇒ ⭐ **VẪN ĐỒNG BỘ** ⚠️ ⇒ ⭐ **tương thích ngược HOÀN TOÀN** ✓

### ② **Frontend — chỉ đồng bộ module CUỐI + HIỆN TIẾN ĐỘ** (⭐ `app/page.tsx`)
```tsx
const dongBoNgay = moduleKey === changed[changed.length - 1];
setMsg(`⏳ Đang lưu ${ok + that}/${changed.length} chức năng… (⭐ vui lòng ⛔ đừng rời trang)`);
await requestApi("save_department_permission", {
  organizationUnitId: deptId, moduleKey, syncNow: dongBoNgay, ...draft[moduleKey] });
```
⭐ **61 lần đồng bộ → 1 lần** ✓ · ⭐ **tiến độ dùng chính `ok + that`** (⛔ **không thêm biến mới** — ⭐ tránh luật ESLint React Compiler ✓)
⭐ **Áp dụng cho CẢ `save()` VÀ `deleteSelected()`** ✓

### ③ **DevOps — sửa công cụ triển khai** (⭐ `tools/deploy-java-backend.mjs`)
⭐ Thay «đợi **3 giây cố định** + ⭐ **CHỈ kiểm cổng đã trống**» ⚠️
⇒ ⭐ «**ĐỢI ĐẾN KHI JAR THỰC SỰ NHẢ KHOÁ**» ⭐ — ⭐ **PHÉP THỬ RENAME**, tối đa **60 giây** ✓
⭐ **Vì sao**: ⚠️ **cổng trống ⛔ KHÔNG bảo đảm JAR đã nhả khoá** ⚠️ ⇒ ⭐ `spring-boot-maven-plugin:repackage` ⛔ **không rename được** ⇒ ⭐ **build LUÔN thất bại** ✓

## ## 📊 **SỐ ĐO — TRƯỚC / SAU** (⭐ ⛔ không suy đoán)
| ⭐ Chỉ số | ⭐ TRƯỚC | ⭐ **SAU** | ⭐ Cải thiện |
|---|---|---|---|
| ⭐ `syncNow=false` (⭐ trung gian) | ⭐ 11,50 giây | ⭐ ⭐ **0,03 – 0,40 GIÂY** | ⭐ ⭐ **~288 lần** ⚡ |
| ⭐ `syncNow=true` (⭐ module cuối) | ⭐ 11,50 giây | ⭐ **5,73 giây** | ⭐ vẫn đồng bộ ✓ |
| ⭐ ⭐ **«Chọn tất cả» 61 module** | ⭐ ⭐ **~11,7 PHÚT** | ⭐ ⭐ **~8,7 GIÂY** | ⭐ ⭐ **~80 lần** 🚀 |

⭐ **Nguyên nhân gốc ĐO ĐƯỢC**: ⭐ `syncDepartmentUsers` (⭐ dòng ~632 ✓) lặp **27 tài khoản hoạt động** × ⭐ mỗi tài khoản gọi `replaceDepartmentDefaults` (⭐ dòng ~484 ✓) lặp **61 module** ⇒ ⭐ ⭐ **~1.647 lượt truy vấn+ghi cho MỘT lời gọi** ⚠️

## ## 🧪 **KIỂM CHỨNG**
| ⭐ | ⭐ |
|---|---|
| ⭐ `npm test` | ✅ **EXIT=0 · pass 802 · fail 0 · 0 errors** ✓ |
| ⭐ `mvn -o test` | ✅ **EXIT=0** ✓ |
| ⭐ `npm run build` | ✅ **EXIT=0 · cổng UI 3/3** ✓ |
| ⭐ **Triển khai** | ✅ ⭐ **BUILD EXIT=0 · chỉ 4 GIÂY** ⇒ ⭐ **JAR 86,8 MB · 15:07:06** ⇒ ⭐ `:18081` **PID 3456** (401) ✓ |
| ⭐ **Đo qua `:9000`** | ✅ ⭐ **5 LẦN**: 0,05 · 5,73 (⭐ có đồng bộ) · 0,03 · 0,04 · 0,40 giây ✓ |

## ## ⚠️ **BÀI HỌC KỸ THUẬT** (⭐ §9 «ROOT CAUSE REQUIRED»)
1. ⭐ ⭐ **MỘT lời gọi API 11,5 giây = backend làm việc NẶNG GẤP BỘI** ⚠️ ⇒ ⭐ **PHẢI ĐO thời gian 1 lời gọi** TRƯỚC khi kết luận «treo»/«lỗi» ✓
2. ⭐ ⭐ **THIẾU TIẾN ĐỘ ⇒ user RỜI TRANG ⇒ dữ liệu lưu DỞ DANG** ⚠️ — ⭐ **đó là HỎNG DỮ LIỆU THẬT**, ⛔ không chỉ là vấn đề UI ✓
3. ⭐ ⭐ **Khi `edit` thay KHỐI DÀI ⇒ PHẢI GIỮ LẠI MỌI DÒNG KHAI BÁO** ⚠️ — ⭐ mất **4 vòng** vì ⛔ xoá mất `let ok = 0, that = 0, loiDau = "";` ✓
4. ⭐ ⭐ **Thời gian build NÓI LÊN nguyên nhân lỗi**: ⭐ **1 GIÂY = sai thư mục** (⛔ không có POM ✓) · ⭐ **~1 PHÚT = JAR bị khoá** (⚠️ `repackage` không rename được ✓)
5. ⭐ ⭐ **Cổng trống ⛔ KHÔNG có nghĩa là JAR đã nhả khoá** ⚠️ — ⭐ phải kiểm bằng **PHÉP THỬ RENAME** (⭐ đo được: **~2 giây** nữa ✓)

## ## Cập nhật bảng đếm AREA (⭐ thay bảng ở dòng 187–200)
| ⭐ Area | ⭐ Số entry |
|---|---|
| ⭐ **Frontend** | ⭐ **6** (⭐ `-002` · `-003` · `-004` · `-008` · `-009` · ⭐ **`-010`** ✓) |
| ⭐ **Backend** | ⭐ **3** (⭐ `-001` · `-005` · ⭐ **`-010`** ✓) |
| ⭐ **Performance** | ⭐ **3** (⭐ `-007` · `-008` · ⭐ **`-010`** ✓) |
| ⭐ **DevOps** | ⭐ **3** (⭐ `-001` · `-009` · ⭐ **`-010`** ✓) |
| ⭐ `API` · `Database` · `RBAC` · `Workflow` · `Testing` · `Integration` · `Shared Component` · `Documentation` | ⭐ không đổi ✓ |

> ⭐ ⭐ **TỔNG CUỐI: 10 entry DEV** ✓
> ✅ ⭐ ⭐ **ĐIỂM NÓNG KỸ THUẬT Ở DÒNG 203 NAY ⛔ KHÔNG CÒN** — ⭐ `save_department_permission` **11,50 giây → 0,03 giây** ✓
> ⚠️ ⭐ **CÒN LẠI**: ⚠️ đoạn «đợi nhả khoá» của công cụ ⭐ **mới qua dry-run** ⇒ ⭐ cần kiểm **runtime** ở lần triển khai THẬT kế tiếp ✓

---

# DEV-20261006-011 — TAB 14 «BÁO LỖI»: XEM CHI TIẾT BẰNG MODAL (⭐ REUSE SHARED COMPONENT)

| ⭐ Trường | ⭐ Giá trị |
|---|---|
| **DEV_ID** | `DEV-20261006-011` |
| **DATE** | 2026-10-06 ~17:30 → 18:20 |
| **SESSION_ID** | `ERP-SESSION-01` |
| **AREA** | `UI_UX` · `FRONTEND` · `Shared Component` · `MIGRATION` · `DEVOPS` |
| **MODULE** | Quản trị hệ thống — tab «Báo lỗi» |
| **TASK** | `TASK-20261006-012` · **CHG** `CHG-20261006-012` |

## YÊU CẦU USER (nguyên văn)
> «tab báo lỗi tôi muốn khi click vào xem chi tiết báo lỗi thì sẽ hiển thị ra modal hiển thị thông tin chi tiết của rp đó.»

## ĐÃ PHÁT TRIỂN GÌ (§4 — mô tả KỸ THUẬT, không chỉ nói task)
### ① Frontend — thay thẻ inline bằng modal dùng chung
- `app/screens/ErrorReportAdminPanel.tsx`: `<section className="card" data-vntech="error-report-detail">`
  (chi tiết nằm DƯỚI bảng ⇒ phải cuộn mới thấy, và mọi dòng đều mở chung một thẻ ⇒ dễ lẫn dòng)
  ⇒ `BaseModal` của `@/lib/ui-blocks` (`{ title, note?, close, children }`, click overlay = đóng).
- ⭐ **TÁI DÙNG, KHÔNG TẠO MODAL MỚI** (§17): `BaseModal` đã có sẵn, 8 màn khác đang dùng.
- ⭐ **NỘI DUNG GIỮ NGUYÊN 100 %**: 9 trường `<dl class="error-report-detail-list">` + khối
  `.error-report-content` «NỘI DUNG BÁO LỖI» ⇒ chỉ đổi CÁCH HIỂN THỊ, không mất trường nào.
- ⭐ **Nhãn nút theo ngữ nghĩa modal**: `Chi tiết` ↔ `✕ Đóng` (trước ghi `Thu gọn` — ⛔ chỉ đúng khi là thẻ inline).
- ⭐ Marker mới `data-vntech="open-report-detail"` để probe đo được **mà không cần cập nhật test khác**.

### ② Migration — đồng bộ metadata identity (⭐ ⛔ BẮT BUỘC, không phải tuỳ chọn)
- `drizzle/0330_session_a_task_20261006_012_tab_14_bao_loi_chi_tiet_modal_identity.sql`
- Mẫu theo `0049_master_baseline_identity_refresh_r1_1_1.sql`: `DROP TRIGGER` → `UPDATE vntech_product_identity`
  → `CREATE TRIGGER` lại → `UPDATE vntech_trust_settings`.
- ⭐ **Metadata-only**: ⛔ không đụng dữ liệu nghiệp vụ, RBAC, BOQ, kho.

### ③ DevOps — quy trình vân tay (⭐ đã ghi thành LUẬT ở `SESSION_REGISTRY.md` §⑦)
- `node tools/fixpoint-fingerprint.mjs` phải **BẤT ĐỘNG** (chạy 2 vòng, cùng giá trị) trước khi build.
- ⭐ **SỬA MÃ ⇒ VÂN TAY ĐỔI ⇒ PHẢI CÓ MIGRATION IDENTITY ⇒ UI MỚI LÊN ĐƯỢC** — đã xảy ra 2 lần trong 2 tuần.

## SỐ ĐO (không suy đoán)
| ⭐ | ⭐ |
|---|---|
| ⭐ `npx tsc --noEmit` | ✅ **EXIT=0** |
| ⭐ `npx eslint app/screens/ErrorReportAdminPanel.tsx` | ✅ **EXIT=0** — 1 warning `exhaustive-deps` dòng 82 **có sẵn từ trước**, ⛔ không do thay đổi này |
| ⭐ `npm test` | ✅ **pass 802 · fail 0 · EXIT=0** |
| ⭐ Kiểm hồi quy | ⭐ `grep error-report-detail` trong `tests/` ⇒ **0 test nào đo màu này** ⇒ ⛔ thay đổi không phá hợp đồng nào |
| ⭐ `npm run build` | ✅ **EXIT=0** · `BUILT ARTIFACT VALIDATION: ĐẠT` |
| ⭐ Vân tay nguồn | `8d70c6207c94f35dd6e4b59d050abb32f9d110c8a964300b032bdb0984c51b46` (⭐ **bất động 2 vòng**) |
| ⭐ Đối chiếu CSDL sau áp migration | ✅ **CẢ 4 TRƯỜNG KHỚP** (source · short · brand · release) |
| ⭐ Đọc **bundle thật** trên `:9000` | ✅ `open-report-detail` ✓ `error-report-detail` ✓ `modal-overlay` ✓ `error-report-tab` ✓ ⇒ `jsxs(BaseModal, { title: 'CHI TIẾT …', children: [dl…] })` |

## ⚠️ SỰ CỐ TỰ GÂY — GHI TRUNG THỰC (§22)
⭐ Tôi restart `local-server.mjs` **trước khi** build lại ⇒ nó không khởi động được ⇒ `:9000` trả 404 ⇒ **UI chết**.
⇒ Đã khôi phục đủ 5 bước (fixpoint ×2 → đọc SSOT+đối chiếu CSDL → tạo migration → áp (có BACKUP) → khởi động lại) ⇒ `:9000` HTTP 200.

## 💡 BÀI HỌC KỸ THUẬT
1. ⭐ ⭐ **BUILD TRƯỚC, RESTART SAU** — `npm run build` ⛔ **không cần server sống** ⇒ ⭐ vừa nhanh vừa an toàn.
2. ⭐ ⭐ **Thêm migration ⇒ vân tay đổi LẦN NỮA** ⇒ ⭐ phải chạy lại fixpoint (⭐ đo được: `e7195a48…` → `8d70c620…`).
3. ⭐ **Đọc trạng thái CSDL trước khi áp migration** — nếu không, dễ ghi nhầm vân tay (⭐ lần đầu tôi ghi `e7195a48…` trong khi SSOT đã là `8d70c620…`).
4. ⭐ **`scripts/set-local-identity.mjs` KHÔNG TỒN TẠI** (MODULE_NOT_FOUND) và **`scripts/local-start.sh` chạy `wrangler dev`, KHÁC kiến trúc** ⇒ ⭐ kiểm tệp thật trước khi chạy.

## DEV-20261008-001 — Nguyên tắc «MỘT NGUỒN KHOÁ» cho ma trận phân quyền (RBAC)

| ⭐ | ⭐ |
|---|---|
| **DEV_ID** | DEV-20261008-001 |
| **DATE** | 2026-10-08 10:30:00 |
| **SESSION_ID** | ERP-SESSION-01 (SESSION_A) |
| **LĨNH VỰC** | Frontend · RBAC · Shared Component |

### ĐÃ PHÁT TRIỂN/SỬA GÌ (kỹ thuật, ⛔ không chỉ nói task nào)

**1. Gốc kỹ thuật của lỗi — HAI tập khoá song song cho CÙNG một ma trận**

Ma trận phân quyền bị dựng bởi **hai đường độc lập**:
- **Đường VẼ** (`PermissionAccessPanel`): dựng `moduleKeys` từ `data.moduleCatalog`
  (`String(item.moduleKey)`) ∪ `entries` (dòng ma trận từ `permissionMenuStructure`) ⇒ **77 khoá**.
- **Đường GỬI** (`UserEditModal` / `UserAccessModal`): map qua `configuredModules(data)`
  ⇒ **61 khoá**.

`configuredModules` lặp mảng MENU tĩnh `lib/menu-helpers.ts:32` rồi làm giàu từ catalog
⇒ **khoá nào không có trong menu thì không bao giờ đi qua nó**. Ba nhóm khoá rơi vào đó:
| Nhóm | Vì sao rớt |
|---|---|
| `admin_tab_01..14` | có trong `module_catalog` nhưng **MỐC 31 đã bỏ 14 menu con** khỏi mảng menu |
| `admin` | bị lọc cứng `item.key !== "admin"` ở đường gửi |
| `reports` | `configuredModules` dùng `Boolean(config.active)`; dòng catalog có `active: 0` ⇒ `false` ⇒ rớt. ⚠️ Panel lọc bằng `item.active !== false` ⇒ **`0 !== false` là TRUE** ⇒ panel VẪN vẽ |

⇒ Đây là **bất đối xứng giữa hai phép chuẩn hoá `active`**: so sánh ngặt (`!== false`) vs
`Boolean()` (`truthy`). Cùng một dòng dữ liệu, hai hàm trả hai kết quả khác nhau.

**2. Bản vá — gom về MỘT hàm thuần, export dùng chung**

`permissionMatrixKeys(data, entries)` là **hàm THUẦN** (chỉ đọc `data` + `entries`, ⛔ không
state, ⛔ không hook) ⇒ gọi được ở cả ba nơi mà ⛔ không tạo vòng import:
- `PermissionAccessPanel.tsx` export (nơi đã có `countChangedPermissions` được `page.tsx` import sẵn — khuôn cũ).
- `page.tsx` import thêm một tên, ⛔ không tạo module mới, ⛔ không đổi kiến trúc.

**3. Vì sao HỢP hai nguồn mà ⛔ không chọn một nguồn**
`save_user_access` là **FULL-REPLACE** (`clearUserScopes()` xoá cứng `user_project_scopes`,
`user_warehouse_scopes`, `user_module_permissions` rồi ghi lại) ⇒ **khoá nào không gửi lên là
bị XOÁ**. Panel lại nạp sẵn state cho MỌI khoá nó biết (`moduleKeys`) rồi gửi lại nguyên trạng
⇒ dùng HỢP để ⛔ không âm thầm mất quyền cũ của tài khoản.

**4. Máy DÒ LỆCH để ⛔ không tái phát**
`tools/probe-permission-save-keyset.mjs` chạy bằng `node --import tsx`:
- tập PAYLOAD = gọi **hàm ĐÃ SHIP** (import thật),
- tập PANEL = **dựng lại ĐỘC LẬP** công thức panel vẽ.
Hai tập phải TRÙNG ⇒ nếu ai đó sửa helper lệch khỏi thứ panel vẽ, phép đo **ĐỎ**.
⛔ Không vòng quanh (không tự chứng minh chính mình).

### 💡 BÀI HỌC KỸ THUẬT (§33 — đánh số tiếp)
**(D-089) Khi hai phía của một hợp đồng dữ liệu cùng đọc một danh mục, chúng phải gọi CHUNG
một hàm — ⛔ không được "cùng đọc một bảng" mà mỗi bên tự lọc.** Vòng 214 đã vá đúng phía
PANEL; phía MODAL vẫn giữ biểu thức riêng nên lệch lại 16 khoá. Bản vá "đúng một nửa" vẫn
để nguyên triệu chứng người dùng.

**(D-090) `!== false` và `Boolean()` KHÔNG tương đương trên dữ liệu thật.** `active: 0`
(`0 !== false` → TRUE) lọt qua bộ lọc này nhưng rớt qua bộ lọc kia. Khi một cột CSDL có thể
là `0 / "0" / false / "false" / null`, ⛔ đừng so sánh ngặt với một giá trị duy nhất — dùng
**một hàm chuẩn hoá duy nhất** (khuôn đã có: `isModuleActive`, MỐC 104).

**(D-091) FULL-REPLACE + tập khoá thiếu = MẤT DỮ LIỆU ÂM THẦM.** API vẫn trả 200 «Đã lưu quyền
hiệu lực» nên ⛔ không có triệu chứng nào ngoài việc quyền biến mất. Với mọi API full-replace,
phải đo **tập khoá gửi đi ⊇ tập khoá hiển thị** trước khi ký «FIXED».

### ⚠️ CÒN LẠI (⛔ không tự quyết)
(B) `UserManagementUseCase.saveUserAccess:259` = `rbac.requireRole(…, List.of("admin"))`
⇒ user role ≠ `admin` dù ĐƯỢC CẤP quyền module `admin` vẫn **HTTP 403** khi lưu.
Đây là **quyết định phân quyền**, ⛔ không phải lỗi kỹ thuật thuần ⇒ chờ user (`DEC-20261008-001`).

## DEV-20261008-002 — Bài học: sửa RBAC phải kiểm **ĐỦ 3 TẦNG**, ⛔ không chỉ 1–2

| ⭐ | ⭐ |
|---|---|
| **DEV_ID** | DEV-20261008-002 |
| **DATE** | 2026-10-08 11:45:00 |
| **SESSION_ID** | ERP-SESSION-01 (SESSION_A) |
| **LĨNH VỰC** | Backend · RBAC · Authorization |

### KIẾN TRÚC THẬT CỦA MỘT CỔNG QUYỀN (đo được, ⛔ không suy đoán)
Một action đi qua **3 tầng độc lập**; sửa thiếu một tầng ⇒ hai tầng kia thành **CODE CHẾT**:

```
POST /api/system
   │
   ├─ ① SystemController.post()  → rbacService.requireActionModule(user, action)   [dòng ~230]
   │     · tra ActionRbacRegistry.modulesFor(action)  (rỗng ⇒ 403 default-DENY)
   │     · isAdmin ⇒ qua · C-level ⇒ qua nếu module ⛔ không chứa "admin"
   │     · còn lại: canUseModule(userId, module, capabilityFor(action))
   │
   ├─ ② SystemController  case "<action>"  → requireRequireAdmin() HOẶC requireCurrentUser()   [tầng hay bị QUÊN]
   │     · ⛔ `requireRequireAdmin` = CỨNG `role === "admin"` ⇒ vô hiệu hoá ① và ③
   │
   └─ ③ UseCase.<action>()  → rbac.requireRole(...) / rbac.requireActionModule(...)   [tầng nghiệp vụ]
```

### 💡 BÀI HỌC KỸ THUẬT (§33 — đánh số tiếp)
**(D-092) Sửa quyền ở tầng registry/use-case mà ⛔ KHÔNG rà tầng CONTROLLER là sửa VÔ HIỆU.**
Tiền lệ trong chính repo: MỐC 103 sửa registry (`update_user` → `admin_tab_01`) + use-case
(`requireAccountUpdateRight`) — nhưng **MỐC 109 phải vá lại** vì `case "update_user"` vẫn gọi
`requireRequireAdmin` ⇒ hai sửa trước thành **code chết**.
🔁 **PA-1 hôm nay lặp ĐÚNG vết xe đó cho `save_user_access`**: MỐC 103/109 sửa `update_user` mà
**sót action anh em cùng họ** ⇒ 3 tầng vẫn chặn ⇒ user báo «mở được, tick được, bấm Lưu ⛔ không lưu».

**(D-093) THÔNG ĐIỆP 403 LÀ DẤU VÂN TAY CỦA TẦNG ĐANG CHẶN — dùng nó để loại trừ.**
Ba tầng có ba câu khác nhau; đổi mã rồi đo lại thấy câu đổi ⇒ biết **chính xác** đã đi qua tầng nào:
| Câu 403 | Tầng |
|---|---|
| «Thao tác **chưa được khai báo quyền** trong hệ thống» | ① registry khai **rỗng** (default-DENY) |
| «Tài khoản **chưa được cấp đúng quyền** cho thao tác này» | ① `canUseModule` trả false |
| «Tài khoản **không có quyền thực hiện nghiệp vụ này**» | ② `requireRequireAdmin` |

**(D-094) Khi sửa mã làm DỊCH SỐ DÒNG, ⛔ phải rà mọi tài liệu/test KHOÁ THEO SỐ DÒNG.**
PA-1 thêm **16 dòng** chú thích vào `SystemController.java` ⇒ hồ sơ `F-03` (bảng action ↔ số dòng)
lệch **23/23** dòng ⇒ `tests/f03-tai-chinh-audit-deps.test.mjs` đỏ.
✅ Cách xử lý ĐÚNG (§22): **sửa TÀI LIỆU cho khớp mã thật**, ⛔ không nới test.
📏 Đo trước khi sửa: **lệch JS = 0 · lệch JAVA = 23, đều đúng +16** ⇒ dịch đều ⇒ sửa cơ học, an toàn.
⚠️ Và ⛔ phải KIỂM KHUÔN sau khi ghi: bản vá đầu của tôi ghi **thiếu dấu `:` cột JS** ⇒ test khớp
**0 dòng** (báo «chỉ đọc được 0 dòng action») — lỗi *im lặng về ngữ nghĩa* nhưng *ồn ào về khuôn*.
⇒ Công cụ `tools/_fix-f03-lines.mjs` nay có **2 chốt**: khôi phục `.bak` + **kiểm khuôn ≥ 20 dòng TRƯỚC KHI GHI**.

### GHI CHÚ VẬN HÀNH (build/restart backend)
⚠️ **`mvn package` SẼ ĐỎ nếu backend đang chạy**: `spring-boot:repackage` cần đổi tên
`*.jar` → `*.jar.original`, mà JVM đang `java -jar` **giữ khoá tệp trên Windows** ⇒
`Unable to rename … .jar.original`. Đo được: build đỏ, chỉ còn **jar THIN 73 KB** (⛔ `java -jar` không chạy).
✅ Quy trình ĐÚNG (đã dùng, downtime ~1 phút): **xác định ĐÚNG PID theo cổng** (`Get-NetTCPConnection -LocalPort 18081`)
→ `Stop-Process -Id <pid>` (**⛔ không `Stop-Process node`, ⛔ không kill mọi java** — máy còn 2 tiến trình java
của DỰ ÁN KHÁC) → `mvn -pl web -am package` (ra fat jar ~91 MB) → chạy lại **đúng lệnh cũ**
`java -jar web\target\vntech-erp-web-0.1.0-SNAPSHOT.jar --server.port=18081` trong `java-backend`.
⚠️ Lưới an toàn: `web/target/backup/` giữ **5 fat jar** cũ nếu build hỏng.

## DEV-20261008-003 — KỸ THUẬT: DỰNG **LÁT CẮT DỌC API KHO** (`save_warehouse` · `set_warehouse_status`)

| ⭐ | ⭐ |
|---|---|
| **DEV_ID** | DEV-20261008-003 |
| **DATE** | 2026-10-08 16:10:00 |
| **SESSION_ID** | ERP-SESSION-01 (SESSION_A) |
| **TASK** | `HANDOFF-20261008-009` (phiên 02 giao) — bước 1-3/8 |

### ⭐ NGUYÊN TẮC ĐÃ THEO (⛔ không tự chế)
1. **§17 TÁI DÙNG**: ⛔ KHÔNG tạo port mới — dùng lại **`AdminSystemStore`** (nơi đã có
   `findWarehouse` + `upsertWarehouseLocation`), ⛔ KHÔNG tạo adapter mới — dùng
   **`AdminSystemStoreAdapter`**; ⛔ KHÔNG tạo use-case mới — dùng **`AdminSystemUseCase`**.
2. **⭐ KHUÔN 3 TẦNG**: copy y hệt action anh em **`save_warehouse_location`** đã chạy được
   (`ActionRbacRegistry:278` + `SystemController:545` + `AdminSystemUseCase:297`) ⇒ ⛔ không phát minh.
3. **Schema ĐỌC TỪ NGUỒN THẬT**: `java-backend/web/src/test/resources/schema-h2.sql:2090` —
   `warehouses(id,code,name,type,project_id,parent_warehouse_id,keeper_user_id,active,created_at,updated_at)`.
4. **⚠️ ĐỌC TÊN HÀM TRƯỚC KHI VIẾT** (⛔ không đoán): xác minh `idGenerator.next(...)`,
   `accessScope.requireProjectAccess(...)`, `accessScope.requireWarehouseAccess(...)`,
   `store.warehouseCodeExists(...)` **CÓ THẬT** rồi mới gọi ⇒ biên dịch **LẦN ĐẦU ĐÃ ĐẠT** ✓

### 5 TỆP ĐÃ SỬA/BỔ SUNG (đúng 1 lát cắt dọc)
| Tệp | Nội dung |
|---|---|
| `application/…/port/out/AdminSystemStore.java` | ➕ `upsertWarehouse` · `setWarehouseActive` · `warehouseCodeExists` · `warehouseExists` (⭐ **4 hàm THUẦN THÊM** — ⛔ không đổi chữ ký hàm cũ, bài học `insertUser`) |
| `infrastructure/…/AdminSystemStoreAdapter.java` | ➕ 4 impl — INSERT/UPDATE `warehouses`; `project_id`/`parent_warehouse_id`/`keeper_user_id` **rỗng ⇒ NULL** (⛔ không ghi `''` = trỏ sai) |
| `application/…/service/AdminSystemUseCase.java` | ➕ `saveWarehouse` · `setWarehouseStatus` |
| `application/…/rbac/ActionRbacRegistry.java` | ➕ 2 action × **CẢ 2 bảng** (modules `inventory`+`central_warehouse` · capability `canEdit`) |
| `web/…/controller/SystemController.java` | ➕ 2 case dùng `requireCurrentUser(request)` ⛔ **KHÔNG** `requireRequireAdmin` (bài học 3 tầng) |

### ⚠️⚠️ 2 CÁI BẪY ĐÃ PHÁT HIỆN + TRÁNH (⭐ giá trị chính của vòng này)
| # | Bẫy | Vì sao nguy hiểm | Cách tránh |
|---|---|---|---|
| ① | **`store.findWarehouse(id)` LỌC `active=1`** (`AdminSystemStoreAdapter`) | Dùng nó cho `set_warehouse_status` ⇒ kho VỪA NGỪNG bị coi là «không còn tồn tại» ⇒ ⛔ **khoá vĩnh viễn, ⛔ KHÔNG BAO GIỜ bật lại được** ⚠️ | ➕ `warehouseExists(id)` tra **⛔ không lọc trạng thái** + test `setWarehouseStatus_ngungRoiBatLaiDuoc` **khoá lại hành vi này** |
| ② | `warehouses.code` là **DANH TÍNH NGHIỆP VỤ** (phiếu kho trỏ theo MÃ) | Cho trùng mã ⇒ phiếu nhập/xuất **trỏ sai kho** ⇒ sai tồn kho | ➕ `warehouseCodeExists(code, excludeId)` so **⛔ không phân biệt hoa/thường** + chặn trước khi ghi + test `saveWarehouse_taoMoiVaChanTrungMa` |

### ⛔ CỐ Ý KHÔNG LÀM (tôn trọng quyết định phiên khác)
⛔ **KHÔNG có `delete_warehouse`** — phiên 02 chốt `ALLOW_DELETE_WAREHOUSE = false`; xoá kho sẽ làm
**mồ côi** phiếu nhập/xuất lịch sử ⇒ «ngừng hoạt động» (`active=0`) là đường duy nhất ✓

### BẰNG CHỨNG
✅ `mvn -B -DskipTests compile` **BUILD SUCCESS ngay lần đầu** · ✅ 2 ca test mới **XANH** (9/9 trong
`AdminSystemIntegrationTest`) · ✅ **hồi quy Java toàn bộ: 88 test · 0 fail · 0 error** (trước: 86)
✅ build fat jar + chạy lại backend (healthy) · ✅ 3 cổng sống `:8787` `:9000` `:18081`

## DEV-20261008-004 — 🎯 **ĐÓNG CẢ HỌ BUG «QUYỀN UỶ NHIỆM VÔ HIỆU»**: audit TOÀN REPO mọi chỗ dùng `allModulePermissions`

| ⭐ | ⭐ |
|---|---|
| **DEV_ID** | DEV-20261008-004 · **DATE** 2026-10-08 19:30 |
| **SESSION_ID** | ERP-SESSION-01 (SESSION_A) |
| **TASK** | Rà gốc cả HỌ bug (§9 ROOT_CAUSE_REQUIRED) — ⛔ không chỉ vá từng ca |

### 🔎 VÌ SAO PHẢI RÀ GỐC
Trong MỘT phiên có **5 bug cùng một họ** (quyền **uỷ nhiệm** qua cấu hình ⛔ vô hiệu trên giao diện):
`BUG-005` (thiếu cổng) · `BUG-006` (sai nguồn) · `M-2` (thiếu cổng) · `BUG-008` (sai nguồn) · `BUG-009` (sai nguồn ×4).
⇒ ⭐ Đây **KHÔNG phải lỗi lẻ** mà là **điểm yếu kiến trúc**: hệ có **2 nguồn quyền** —
`data.modulePermissions` (của **chính** người đăng nhập — ⭐ nguồn LUÔN có) và
`data.allModulePermissions` (của **MỌI** người — ⚠️ `BootstrapDataAdapter.java:943` **CHỈ đổ khi `admin === true`**).
⚠️ Nhầm nguồn ⇒ **LUÔN false với non-admin** ⇒ uỷ nhiệm vô hiệu ✓

### 📏 AUDIT — TOÀN BỘ 11 CHỖ DÙNG TRONG `app/**` + `lib/**`
| # | Vị trí | Lọc theo | Phân loại | Kết luận |
|---|---|---|---|---|
| 1 | `AdminUserModalTabs.tsx:41` (`hasAdminTab`) | chính mình | **SAI** | ✅ đã vá (`BUG-008`) |
| 2 | `page.tsx:3317` `canViewAudit` | chính mình (`=== uid`) | **SAI** | ✅ đã vá (`BUG-009`) |
| 3 | `page.tsx:3322` `canAdministerStaff` | chính mình | **SAI** | ✅ đã vá |
| 4 | `page.tsx:3463` `canManageRole` | chính mình (`data.user?.id`) | **SAI** | ✅ đã vá |
| 5 | `page.tsx:3524` `canManageUserPermissions` | chính mình | **SAI** | ✅ đã vá |
| 6 | `page.tsx:1726` `userPermissionSpec` | **tham số `userId`** | người khác | ✅ **ĐÚNG** |
| 7 | `page.tsx:1733` | `permissionSource==="manual_override"` (mọi người) | người khác | ✅ **ĐÚNG** |
| 8 | `page.tsx:1808` → `accountRows(...)` | bảng tài khoản (mọi người) | người khác | ✅ **ĐÚNG** |
| 9 | `page.tsx:2198` `permsOf(userId)` · `:2228` KPI | tham số / mọi người | người khác | ✅ **ĐÚNG** |
| 10 | `page.tsx:2916` `perm.userId===row.id` | dòng = **người khác** | người khác | ✅ **ĐÚNG** |
| 11 | `Inventory.tsx:487` | `uid = staffPickId` (**nhân sự được chọn**) | người khác | ✅ **ĐÚNG** |
| 12 | `PermissionAccessPanel.tsx:72` · `:177` | `userId` của người ĐANG SỬA | người khác | ✅ **ĐÚNG** |
| 13 | `workflow-helpers.ts:26` | `u.id` = ứng viên duyệt | người khác | ✅ **ĐÚNG** |

⇒ 🎯 **KHÔNG còn chỗ nào dùng nhầm nguồn.** 5 chỗ SAI đã vá (⛔ 4 chỗ thuộc `page.tsx` = tệp S01), 8 chỗ còn lại **đúng** ✓

### 🛡️ 3 CỔNG TĨNH ĐÃ ĐỂ LẠI (⛔ chặn tái phát cả họ)
| Tệp | Khoá điều gì |
|---|---|
| `tests/has-admin-tab-source.test.mjs` (**6 ca**) | `hasAdminTab` nhận **cả 2 nguồn** + đối chứng âm ⛔ không cấp quyền người khác |
| `tests/self-permission-source.test.mjs` (**5 ca**) | ⭐ **MỌI** cổng tự-kiểm trong `page.tsx` ⛔ không được đọc `allModulePermissions`; **+ ĐỐI CHỨNG ÂM**: các chỗ đọc quyền **người khác** ⭐ **phải GIỮ** `allModulePermissions` (⚠️ cấm bừa sẽ **PHÁ màn quản trị**) |
| `tests/warehouse-modal-contract.test.mjs` (**6 ca**) | modal ⇄ API kho (⛔ không tái phát lệch khoá `id`/`warehouseId`) |

⭐ Cả 3 cổng **đã chứng minh CÓ THỂ ĐỎ** bằng đối chứng âm thật (tạm phá ⇒ ĐỎ ⇒ khôi phục ⇒ hash khớp ⇒ XANH) ✓

### ⚠️ BÀI HỌC QUAN TRỌNG NHẤT (D-098) — ⭐ TÔI SUÝT TỰ PHÁ
Khi vá `BUG-009`, tôi định **thay hàng loạt** `allModulePermissions` → `modulePermissions`.
⭐ **ĐẾM TRƯỚC** ⇒ hoá ra có **9 chỗ**, trong đó **7 chỗ đọc quyền NGƯỜI KHÁC là ĐÚNG**
⇒ nếu thay bừa thì **XOÁ DỮ LIỆU QUYỀN của người khác khi ghi FULL-REPLACE** (bảng tài khoản/KPI/nút ngoại lệ/nhân sự kho) ⚠️
⇒ ✅ Chỉ sửa **đúng những chỗ có `=== uid`/`=== data.user?.id`** (tự-kiểm) ✓
📌 **LUẬT**: *đổi NGUỒN DỮ LIỆU là thay đổi ngữ nghĩa, ⛔ không phải refactor cơ học* — ⭐ **đếm + phân loại trước khi thay** ✓

### BẰNG CHỨNG
✅ `tsc` EXIT 0 · ✅ test mới **5/5** + **6/6** · ✅ build + triển khai (vân tay `5720a8dd…` khớp SSOT · **6/6 bundle đúng byte**) · ✅ cổng FE **950/952 pass · 1 đỏ** (⚠️ là `TM-04` của `ERP-SESSION-03` — đã báo `BUG-20261008-010`, ⛔ không thuộc S01)

## DEV-20261008-005 — 🔎 **AUDIT 3 TẦNG QUYỀN TOÀN HỆ**: tìm MỌI ca «tầng trên CHO PHÉP mà tầng dưới vẫn khoá `role=admin`» (lớp PA-1)

| ⭐ | ⭐ |
|---|---|
| **DEV_ID** | DEV-20261008-005 · **DATE** 2026-10-08 20:40 |
| **SESSION** | ERP-SESSION-01 · **TASK** đóng **cả lớp** bug thay vì vá từng ca |

### 🎯 TIÊU CHÍ (⭐ theo luật `D-099` vừa rút ra — ⛔ KHÔNG đếm cổng)
> Một ca **LỆCH THẬT** ⇔ **tầng ① CHO PHÉP** (action có khai **module khác rỗng**) ⭐ **MÀ** tầng ②
> (`SystemController` gọi `requireRequireAdmin()`) **hoặc** tầng ③ (use-case `rbac.requireRole(…, List.of("admin"))`) **vẫn khoá role** ✓

### ⚠️⚠️ PHÉP ĐO CỦA TÔI **SAI 2 LẦN** TRƯỚC KHI ĐÚNG (⭐ ghi để ⛔ không lặp)
| Lần | ⛔ Sai thế nào | Hệ quả | ✅ Sửa |
|---|---|---|---|
| 1 | Khớp **chuỗi trần** `requireRequireAdmin` | Báo **10 ca** — ⚠️ gồm cả `save_user_access` **tôi đã sửa** ⇒ **dương tính giả** | Đòi **lời gọi** `requireRequireAdmin(` (có ngoặc) ⇒ còn **8** |
| 2 | Vẫn khớp **TRONG COMMENT** | ⚠️ `update_user` bị báo oan — vì chú thích **MỐC 109** ghi nguyên văn `requireRequireAdmin(request)` (mô tả lỗi CŨ) | ⭐ **CẮT COMMENT trước khi khớp** ⇒ còn **7** |
| ✅ | **KIỂM CHỨNG ĐƯỢC**: 2 ca đã sửa trước đây (`update_user`–MỐC 109 · `save_user_access`–PA-1) đều trả **`False`** | ⇒ ⭐ phép dò **ĐÚNG** | — |

📌 **LUẬT (D-100)**: ⛔ **đừng bao giờ grep CODE bằng chuỗi trần** — ⭐ phải **bỏ comment** và **khớp LỜI GỌI**
(⚠️ chú thích trong repo này **thường viết lại mã CŨ để giải thích** ⇒ dễ khớp oan nhất) ✓

### 📏 KẾT QUẢ — **7 ca lệch thật** trên **216 action** có khai module
| # | Action | Tầng ① khai | Bị chặn ở | Phân loại |
|---|---|---|---|---|
| 1 | **`delete_supplier`** | `supplier_catalog` (**module nghiệp vụ**) | ② | 🟠 **LỆCH THẬT** — người có `supplier_catalog` **quản lý** được NCC nhưng ⛔ **không XOÁ** được |
| 2 | **`delete_partner`** | `supplier_catalog` | ② | 🟠 **LỆCH THẬT** (cùng lớp) |
| 3 | `set_project_status` | `admin` | ②+③ | ✅ **CỐ Ý** — đóng dự án là thao tác phá hoại |
| 4 | `factory_reset_execute` | `admin` | ③ | ✅ **CỐ Ý** — rào an toàn (**XOÁ DỮ LIỆU**) |
| 5 | `factory_reset_preview` | `admin` | ③ | ✅ **CỐ Ý** (cùng nhóm) |
| 6 | `install_license_foundation` | `admin` | ③ | ✅ **CỐ Ý** (bản quyền) |
| 7 | `request_license_transfer` | `admin` | ③ | ✅ **CỐ Ý** (bản quyền) |

⭐ **4-7 giữ nguyên là ĐÚNG**: chúng gate trên module **`admin`** = «Quản trị hệ thống» — mà theo mô hình user chốt,
**module `admin` VẪN có thể cấp cho tài khoản ITM** ⇒ ⭐ rào `role=admin` ở tầng ③ chính là
**phòng thủ theo chiều sâu** cho các thao tác **phá hoại/bản quyền** ⇒ ⛔ **KHÔNG gỡ** ✓

### ⏭ VIỆC KẾ TIẾP (⭐ chưa làm — ⛔ không nhận «đã xong»)
🟠 **2 ca `delete_supplier`/`delete_partner`**: cần
① đọc `case` tương ứng để xác nhận tầng ②, ② **cân nhắc kỹ**: đây là **XOÁ** (⛔ không phải sửa) nên ⚠️ có thể
**cố ý** siết (giống 4-7) ⇒ ⭐ **PHẢI đo `set_supplier_status`** (khoá mềm) xem hệ đã có đường «ngừng dùng NCC» chưa:
· Nếu **đã có** khoá mềm ⇒ ⭐ gỡ chốt ② cho `delete_*` là hợp lý (theo tiền lệ `PA-1`).
· Nếu **chưa có** ⇒ ⚠️ **giữ nguyên** + báo user (vì xoá cứng là đường duy nhất ⇒ cần thận trọng) ✓

## DEV-20261008-006 — ✅ CHỐT: lệch 3 tầng **= 0** (7 ca bị gắn cờ đều CỐ Ý) — họ bug «quyền uỷ nhiệm» ĐÃ ĐÓNG

📏 **ĐO NỐT**: hệ **ĐÃ CÓ đường KHOÁ MỀM** cho đúng 2 ca `delete_*` bị nghi: `set_supplier_status` · `set_partner_status`
(đều `supplier_catalog` + `canEdit`) ⇒ ⭐ **CÙNG KHUÔN tiền lệ kho** (phiên 02 chốt `ALLOW_DELETE_WAREHOUSE=false`
⇒ dùng `set_warehouse_status`) ✓
⇒ ⭐ Chốt tầng ② ở `delete_supplier`/`delete_partner` là **CỐ Ý — phòng thủ cho XOÁ CỨNG** (⚠️ xoá NCC/đối tác làm
**mồ côi** PO · phiếu nhận · công nợ) ⇒ ⛔ **KHÔNG gỡ** — vẫn có đường an toàn «ngừng dùng» ✓

| Tầng đã rà | Số chỗ | SAI thật | Trạng thái |
|---|---|---|---|
| **FE** — cổng UI tự-kiểm quyền (`allModulePermissions`) | 13 | **5** | ✅ đã vá (`BUG-006` · `BUG-008` · `BUG-009`) |
| **BE** — `requireRole(admin)` trong use-case (nhóm S01) | 33 hàm | **0** | ✅ nhất quán (registry cũng default-DENY) |
| **BE** — lệch 3 tầng theo tiêu chí `D-099` | **216 action** | **0** | ✅ 7 ca gắn cờ đều **CỐ Ý** (phá hoại · bản quyền · xoá cứng) |

🎯 **Họ bug «quyền uỷ nhiệm vô hiệu» ĐÃ ĐÓNG** — ⛔ không còn ca nào cần sửa.
⭐ Detector **đã tự kiểm chứng**: 2 ca sửa trước đây (`update_user`–MỐC 109 · `save_user_access`–PA-1) đều trả `False` ⇒ ⛔ không «xanh giả» ✓
📌 **2 luật mới**: `D-099` (chỉ gọi là lệch khi **tầng đối diện CHO PHÉP**) · `D-100` (**⛔ không grep code bằng chuỗi trần** — phải bỏ comment + khớp LỜI GỌI).

## BUG-20261008-011 — 🔴 **CRITICAL: BACKEND DOWN do migration V39 ⛔ KHÔNG IDEMPOTENT** (Flyway FAILED) ⇒ đã khôi phục dịch vụ

| ⭐ | ⭐ |
|---|---|
| **BUG_ID** | BUG-20261008-011 · **DATE** 2026-10-08 15:57→16:18 · **SESSION** ERP-SESSION-01 (phát hiện + khôi phục) |
| **SEVERITY** | 🔴 **CRITICAL** (`SYSTEM DOWN` — §20/§45: ưu tiên tuyệt đối) |
| **MODULE** | BACKEND · DEVOPS · `stock_reservations` (giữ chỗ phiếu xuất) |
| **NGUỒN** | User: «rebuild áp dụng tất cả các thay đổi của các session» |

### 🔎 TRIỆU CHỨNG (đo được)
`mvn package` **ĐẠT** nhưng khi chạy jar: **backend ⛔ KHÔNG khởi động** —
```
FlywayMigrateException: Script V39__session02_stock_reservation_issue_id.sql failed
SQL State 42S21 · Error Code 1060 · Message: Duplicate column name 'issue_id'
Caused by: ... SpringApplication: Application run failed  ⇒ :18081 DOWN
```

### 🎯 NGUYÊN NHÂN GỐC (⭐ đối chiếu CSDL thật, ⛔ không suy đoán)
`V39` (migration **của `ERP-SESSION-02`**) gồm 2 câu:
1. `ALTER TABLE stock_reservations ADD COLUMN issue_id VARCHAR(64) NULL …`
2. `CREATE INDEX stock_reservations_issue_idx ON (issue_id, status)`
📏 **CSDL MySQL ĐÃ CÓ CẢ HAI** (cột `issue_id varchar(64) NULL` + index `stock_reservations_issue_idx(issue_id,status)`)
⇒ ⚠️ **MySQL ⛔ KHÔNG hỗ trợ `ADD COLUMN IF NOT EXISTS`** ⇒ câu 1 **trùng** ⇒ Flyway đánh dấu **FAILED** (`flyway_schema_history.success=0`) ⇒ Spring Boot **từ chối khởi động** ✓
⚠️ **Hệ quả chuỗi**: kể cả jar CŨ cũng ⛔ không chạy được (Flyway thấy migration lỗi trong lịch sử) ⇒ ⭐ **cả hệ thống chết**, ⛔ không chỉ bản mới.

### ✅ CÁCH KHÔI PHỤC (⭐ tối thiểu · ⛔ KHÔNG sửa tệp migration của phiên khác, ⛔ KHÔNG sửa mã nghiệp vụ)
📏 **Bước 0 — CHỨNG MINH** ý định của V39 **đã được thoả mãn đầy đủ** (cả cột + index đều có, đúng kiểu `varchar(64) NULL`) ✓
⛔ ⇒ **KHÔNG cần chạy lại** câu nào ⇒ chỉ cần sửa **lịch sử Flyway**:
```sql
UPDATE flyway_schema_history SET success=1 WHERE version='39' AND success=0;   -- 1 dòng
```
⇒ Backend khởi động lại **OK**: `Schema vntech_erp is up to date` · `Started VntechErpApplication` · ⛔ **0 ERROR** ✓

### ⚠️ KHUYẾN NGHỊ CHO `ERP-SESSION-02` (⛔ S01 không tự sửa tệp của họ — §19)
V39 cần **chịu được môi trường đã có cột** (⚠️ nhiều máy/DB đã có `issue_id` từ trước). Cách an toàn: dùng
`INFORMATION_SCHEMA` để **chỉ `ADD COLUMN` khi cột CHƯA tồn tại** (MySQL ⛔ không có `IF NOT EXISTS`), hoặc
tách câu `CREATE INDEX` ra migration riêng. ⭐ Nếu để nguyên: **mọi máy đã có cột sẽ ⛔ chết ở lần khởi động kế tiếp** ✓

---

## BUG-20261008-012 — 🟠 **2 test Java LỖI vì `schema-h2.sql` ⛔ THIẾU GƯƠNG `issue_id`** (⛔ không phải lỗi sản phẩm)

| ⭐ | ⭐ |
|---|---|
| **SEVERITY** | 🟠 MEDIUM (⚠️ nhưng **chặn điều kiện «build không lỗi»** để commit) |
| **TRIỆU CHỨNG** | `mvn test`: **88 run · 0 failure · 2 ERRORS** ⇒ BUILD FAILURE — `StockIssueWorkflowSteps345Test.steps345_fullFlow` + `SupplyChainEndToEndIntegrationTest.fullSupplyChain` |
| **LỖI THẬT** | `BadSqlGrammarException … INSERT INTO stock_reservations (…,issue_id,…)` |
| **NGUYÊN NHÂN GỐC** | Mã mới của S2 ghi `issue_id`, **MySQL đã có cột (V39)** — ⚠️ nhưng `web/src/test/resources/schema-h2.sql` **chưa có gương** ⇒ H2 (test) ⛔ thiếu cột ✓ |
| **FIX** | Thêm **1 dòng** `` `issue_id` VARCHAR(64) NULL `` vào `CREATE TABLE stock_reservations` — ⭐ **đúng kiểu của V39** (⚠️ `NULL`, ⛔ không `NOT NULL`) ✓ |
| **KẾT QUẢ** | ⭐ `Tests run: 88, Failures: 0, Errors: 0` · **BUILD SUCCESS** ✓ (⭐ và cổng FE **955 test · 954 pass · 0 fail**) |

---

## DEV-20261008-007 — 🚀 **REBUILD TOÀN HỆ + COMMIT + PUSH `unity`** (user chốt: «không lỗi thì commit + push + merge vào unity»)

| # | Việc | Kết quả ĐO được |
|---|---|---|
| 1 | `tsc --noEmit` cây gộp | ✅ **0** |
| 2 | FE: `fixpoint` → `npm run build` → sync identity | ✅ `BUILT ARTIFACT VALIDATION: ĐẠT` · vân tay **`VNTECH-FP-BB706F1202490077`** khớp SSOT |
| 3 | Cổng UI `verify-ui-build-applied --port=8787` | ✅ `do-moi` · `van-tay bb706f1202490077` · **`byte 6/6`** |
| 4 | BE: `mvn test` | ✅ **88/88** (0 failure · 0 error) |
| 5 | BE: `mvn -DskipTests -pl web -am package` | ✅ jar **91.051.684 B @ 16:18:08** |
| 6 | 3 cổng `:8787` `:9000` `:18081` | ✅ LISTEN · `:9000/api/system` → **401** (đúng, cần đăng nhập) |
| 7 | CSDL kho (bất biến) | ✅ **12 / 5 / 10** khớp `W-02-AUDIT` |
| 8 | **Git** | ✅ commit `0119160` (**292 tệp · +28.717 / −547**) → merge `origin/unity` (**2 commit của phiên khác** — TASK-230 hub Kho) → **merge `defccb1`** → **PUSH** `8d9c303..defccb1 unity -> unity` ✓ |

### ⚠️ 2 BÀI HỌC (⭐ ghi để ⛔ không lặp)
1. **`git add -A` trong repo ĐA PHIÊN là NGUY HIỂM** — nó gom cả thay đổi của phiên khác (⭐ lần này là chủ đích theo yêu cầu user, ⚠️ nhưng phải **kiểm mất mát**: đã đối chiếu `Inventory.tsx` **744 > 723 dòng** · `globals.css` **129 > 124** · log `SESSION_B` **386 + 150 dòng còn nguyên** ⇒ ⭐ **⛔ KHÔNG mất việc của ai** ✓)
2. **Gặp xung đột khi merge ⇒ ⛔ đừng chọn bừa `--ours`/`--theirs`** — ⭐ phải **ĐO** bản nào mới hơn (so **số dòng + dấu hiệu đặc trưng** của phiên kia) rồi mới chốt ✓

## DEV-20261008-008 — 🛡️ CÔNG CỤ CHẶN TÁI PHÁT `BUG-20261008-011`: dò migration SẮP CHẠY mà ⛔ **KHÔNG IDEMPOTENT**

| ⭐ | ⭐ |
|---|---|
| **DEV_ID** | DEV-20261008-008 · **DATE** 2026-10-08 18:20 · **SESSION** ERP-SESSION-01 |
| **TỆP MỚI** | `tools/check-migration-idempotency.mjs` (⭐ **chỉ ĐỌC** — ⛔ không sửa mã, ⛔ không ghi CSDL) |
| **MỤC ĐÍCH** | ⚠️ `BUG-011` xảy ra vì một migration `ADD COLUMN` trên CSDL **đã có cột** ⇒ Flyway FAILED ⇒ 🔴 **backend DOWN**. ⭐ Công cụ này **phát hiện TRƯỚC** loại rủi ro đó ✓ |

### 🔎 CÁCH LÀM (⭐ lọc cho ⛔ không nhiễu)
1. Đọc `flyway_schema_history` (**chỉ SELECT**) ⇒ biết migration nào **ĐÃ áp dụng**;
2. Chỉ xét migration **SẮP CHẠY** (⭐ tức sẽ chạy ở lần khởi động tới — ⛔ không báo hàng loạt tệp đã chạy xong);
3. Trong đó, dò các câu ⛔ **không chịu được môi trường đã có sẵn đối tượng**:
   `ADD COLUMN` · `CREATE INDEX` · `CREATE TABLE` · `ADD CONSTRAINT` — ⚠️ **MySQL ⛔ KHÔNG có `IF NOT EXISTS`** cho `ADD COLUMN`/`CREATE INDEX`;
4. Bỏ qua tệp **đã tự bảo vệ** (có `IF NOT EXISTS` / `INFORMATION_SCHEMA` / `PROCEDURE` / `PREPARE`).

### 📏 KẾT QUẢ ĐO
| Lần chạy | Kết quả |
|---|---|
| **Mặc định** (chỉ tệp đang chờ) | `Tổng 38 tệp · đã áp dụng 38 · SẮP CHẠY 0` ⇒ ✅ ⛔ **không có rủi ro hiện tại** |
| ⭐ **`--tat-ca`** (**đối chứng âm** — quét CẢ 38) | ⚠️ **9/38** bị gắn cờ, ⭐ **gồm đúng `V39__session02_stock_reservation_issue_id.sql`** — ca THẬT đã làm sập hệ thống ✓ |

⇒ ⭐ **PHÉP DÒ CHỨNG MINH ĐƯỢC LÀ CÓ THỂ ĐỎ** (⛔ không phải «xanh giả» — ⭐ đúng luật tôi đã đặt ra: *cổng phải chứng minh được khả năng ĐỎ*) ✓

### ⚠️ DIỄN GIẢI ĐÚNG (⭐ ⛔ không thổi phồng)
9 tệp bị gắn cờ **ĐỀU ĐÃ ÁP DỤNG** trên CSDL này ⇒ ⭐ **hiện ⛔ KHÔNG có rủi ro**.
⚠️ Rủi ro chỉ xảy ra khi **dựng CSDL MỚI / khôi phục từ bản sao đã có một phần đối tượng** — ⭐ đúng tình huống đã xảy ra hôm nay (CSDL đã có cột `issue_id` trước khi V39 chạy).
📌 **ĐỀ NGHỊ**: trước mỗi lần **rebuild/deploy lên máy khác**, chạy `node tools/check-migration-idempotency.mjs` (⭐ 1 lệnh, chỉ đọc) ✓

### 🎯 DANH SÁCH 9 TỆP BỊ GẮN CỜ (⭐ để tham chiếu)
`V1__baseline.sql` · `V12__audit_log_enrich.sql` · `V17__workflow_dynamic_approvals.sql` · `V18__wf_b2_po_decision.sql` ·
`V25__mt2_approval_overdue_reason_and_user_signature.sql` · `V28__mt2_supplier_email.sql` · `V29__mt2_user_last_login.sql` ·
`V31__mt2_p10_05_legal_document_correspondence_link.sql` · ⭐ **`V39__session02_stock_reservation_issue_id.sql`**

### ⚠️ GIỚI HẠN CÓ Ý (⭐ ghi rõ để ⛔ không tin quá mức)
· Đây là **dò TĨNH theo mẫu câu** — ⛔ **không thay** việc chạy thử trên CSDL bản sao;
· Việc nhận diện «có guard» là **thô** (⛔ không phân tích ngữ nghĩa SQL);
· ⛔ Không đánh giá migration đã áp dụng (chúng đã chạy xong ⇒ ⛔ không còn rủi ro ở lần khởi động tới).

## DEV-20261008-009 — 🔧 **GIỮ `jar = mã` + KIỂM CỔNG AUDIT SAU KHI SỬA `KNOWN_RED`** (⭐ hậu quả do chính phiên này)

| ⭐ | ⭐ |
|---|---|
| **DEV_ID** | DEV-20261008-009 · **DATE** 2026-10-09 · **SESSION** ERP-SESSION-01 · **MODULE** DEVOPS · BACKEND |
| **VÌ SAO** | ⭐ Nghĩa vụ **③④** của chỉ đạo `DEC-20261008-016`: **sửa hậu quả do chính phiên gây ra** + **giữ state/log đúng** ✓ |

### 🔴 PHÁT HIỆN 1 — **JAR ĐANG CHẠY LỆCH MÃ** (⚠️ hậu quả của chính phiên này)
| Mốc | Thời gian |
|---|---|
| JAR đóng gói | **09:41:49** |
| `UserManagementUseCase.java` sửa lần cuối (đổi `hopThemKhongXoa` **private → package-private**) | **09:44:15** ⚠️ **SAU** khi đóng gói |
⇒ ⚠️ Bản chạy **thiếu** thay đổi 09:44 (⭐ chỉ là **đổi phạm vi truy cập**, ⛔ không đổi hành vi — nhưng **`jar ≠ mã`** thì ⛔ không được để lâu) ✓

**✅ ĐÃ SỬA**: build lại + chạy lại
| Phép kiểm | Kết quả |
|---|---|
| Dừng **ĐÚNG PID** | ✅ PID **2456** (`:18081`) — ⛔ không kill hàng loạt |
| `mvn -B -DskipTests -pl web -am package` | ✅ **EXIT 0** |
| JAR mới | **10:01:58** (86,8 MB) ⇒ ⭐ **`jar = mã`** ✓ |
| Chạy lại | ✅ `Started VntechErpApplication` · ⛔ **0 ERROR** |
| 3 cổng | ✅ `:8787` (pid 14028) · `:9000` (pid 5584) · `:18081` (**pid 6048**) |
| `health` | ✅ **200** |
| **Bất biến CSDL** | ✅ **12 / 5 / 10** (⛔ không đổi) |

### 🟢 PHÁT HIỆN 2 — **CỔNG AUDIT VẪN LÀNH** sau khi tôi sửa chuỗi lý do `KNOWN_RED`
⚠️ Tôi gọi **sai tên** công cụ (`scripts/audit-tests.mjs` ⛔ không tồn tại) ⇒ ✅ tên đúng là `scripts/test-suite-health.mjs` (npm: `audit:tests`) ✓
```
node scripts/test-suite-health.mjs   →  EXIT 0  ✅
  Tổng tệp      : 162 tệp · 1006 test case
  Xanh          : 155 tệp
  ĐỎ            : 7 tệp · 24 case
  Trong gate    : 154 tệp · 955 test case     ← ⭐ KHỚP cổng FE (955 test)
  Ngoài gate    : 8 tệp / 51 case — NỢ ĐÃ BIẾT, cố ý không chạy (theo KNOWN_RED)
```
⇒ ⭐ Sửa của tôi (⛔ **chỉ chuỗi lý do + chú thích**) **⛔ không làm hỏng cổng** ✓

### 📌 GHI NHẬN NHỎ (⛔ không hành động — MT3 đã đóng theo `DEC-20261008-015`)
⚠️ Audit đếm **7 tệp ĐỎ**, còn `KNOWN_RED` khai **8 mục** ⇒ ⭐ chênh **1 mục** (⚠️ `mt3-ui-28-requests-permission` ⛔ không xuất hiện trong danh sách đỏ) ⇒ có thể tệp đó **nay đã xanh** nhưng vẫn bị loại khỏi cổng ✓
🛑 **⛔ KHÔNG xử lý**: MT3 đã **đóng băng** ⇒ việc dọn `KNOWN_RED` ⛔ **không phải việc cần làm** (chỉ ghi nhận để ⛔ không ai bất ngờ) ✓

### ✅ KẾT LUẬN
⭐ **Hệ thống ở trạng thái NHẤT QUÁN sau phiên**: `jar = mã` ✓ · cổng audit **EXIT 0** ✓ · 3 cổng sống ✓ · `health` 200 ✓ · **CSDL 12/5/10** ✓

## DEV-20261009-010 — 🔧 **PORT 2 ACTION WORK CÒN THIẾU SANG JAVA** (đóng `docs/61` **Q3**) — `ERP-SESSION-01`

| Trường | Nội dung |
|---|---|
| **DEV_ID** | `DEV-20261009-010` · **DATE** 2026-10-09 · **SESSION** `ERP-SESSION-01` · **MODULE** BACKEND · RBAC |
| **NGUỒN VIỆC** | ⭐ User giao trực tiếp: «Phối hợp cùng s4 để xử lý phân quyền cho nhóm chức năng Công việc, làm đúng phạm vi của mình, thông báo cho s4 biết» |

### VẤN ĐỀ (đo được, ⛔ không suy đoán)
`add_work_item_comment` · `set_work_item_participant` **CÓ QUYỀN** trong ma trận (`ActionRbacRegistry` **L16/L314** ·
`system-route.mjs` **`:26`/`:38`** · `module_catalog`) nhưng ⛔ **KHÔNG có `case` nào trong `SystemController`**
⇒ gọi API = **400 «chưa triển khai»** ⇒ **2 quyền «MA»** trên đường Java (nút «Nhận xét» phải tạm ẩn — `docs/57 §4.4`) ✓

### ĐÃ LÀM (4 tệp — ⭐ **CHỈ THÊM Ở CUỐI**, ⛔ không chèn giữa)
| # | Tệp | Nội dung |
|---|---|---|
| 1 | `application/.../port/out/OpsTaskStore.java` | ➕ 3 hàm port: `insertWorkItemComment` · `workItemParticipantExists` · `upsertWorkItemParticipant` |
| 2 | `infrastructure/.../OpsTaskStoreAdapter.java` | ➕ 3 hàm cài đặt (INSERT bình luận · EXISTS người tham gia · UPSERT theo `(work_item_id,user_id)`) |
| 3 | `application/.../service/OpsTaskManagementUseCase.java` | ➕ `addWorkItemComment` · `setWorkItemParticipant` + **luật truy cập dùng CHUNG** `requireWorkItemAccess` (**port `system-route.mjs:501-515`**) + 3 hằng số |
| 4 | `web/.../controller/SystemController.java` | ➕ 2 `case` **đặt CUỐI switch, SAU mọi `case` gắn số dòng** (đúng quy ước `save_error_report` L1498) |
| 5 | `web/src/test/resources/schema-h2.sql` | ➕ 2 bảng `work_item_comments`/`work_item_participants` — ⚠️ **TRƯỚC ĐÂY THIẾU** trong schema test H2 (dù **MySQL THẬT đã có** — đo `SHOW CREATE TABLE`) ⇒ **đồng bộ schema test theo CSDL thật** |
| 6 | `web/src/test/.../WorkItemCommentParticipantPortTest.java` | ➕ **MỚI** — 5 ca, **có ĐỐI CHỨNG ÂM** |

### ⚠️ LUẬT TRUY CẬP PORT NGUYÊN (JS `:501-515`)
Quản trị viên → luôn được · **Người ĐƯỢC GIAO** việc → bình luận + thêm người tham gia · **Trưởng phòng** cùng phòng → cả hai ·
Người **ĐANG** trong `work_item_participants` → bình luận · còn lại → cổng quyền module (đã cưỡng chế ở tầng action) ✓
⚠️ **⛔ KHÔNG nới quyền**: cổng `ActionRbacRegistry` GIỮ NGUYÊN (`canUse`/`canEdit`) — đây chỉ là **cài đặt handler** ✓

### 🔴 PHÁT HIỆN LỆCH NHỎ (⭐ báo S4, ⛔ không tự sửa tệp S4)
Handler JS còn lặp **4 khoá `dept_*`** (⛔ **KHÔNG** gồm khoá chung `work`) ⇒ người chỉ có `work`+`canUse` bị JS **chặn OAN**
ở handler, trong khi **route-level JS đã cho qua** ⇒ ⭐ đề nghị S4 căn lại (`HANDOFF-20261009-A02` §D1) ✓

### ➕ BỔ SUNG DEV-20261009-010 — bài test thứ 2: `WorkApprovePermissionSplitTest` (3 ca, 2 đối chứng âm) khoá **RUNTIME** hợp đồng quyền duyệt công việc (`approve_work_item` = `canApprove` · luật trưởng phòng). ⭐ Lý do: trước đó chỉ có kiểm tra CHUỖI KHAI BÁO (`t13`/`t07`) ⇒ hồi quy `BUG-D18` ⛔ không cổng nào bắt được ✓

## DEV-20261009-011 — 🏷️ **ĐỔI ĐỊNH DANH SẢN PHẨM SANG «ALPHA TEST 2026.10» + BUILD UI** (user chốt phương án **d**)

| Trường | Nội dung |
|---|---|
| **DEV_ID** | `DEV-20261009-011` · **DATE** 2026-10-09 · **SESSION** `ERP-SESSION-01` · **MODULE** DEVOPS · RELEASE |
| **NGUỒN** | ⭐ User chốt phương án **(d)**: «Build + đổi **PHIÊN BẢN SẢN PHẨM** sang **ALPHA TEST**» — khớp bộ tài liệu `DOC-ALPHA-TEST-2026.10` (80 tệp) ✓ |

### 1. CHUỖI THI HÀNH (⭐ ⛔ KHÔNG đoán bước nào — mỗi bước do CỔNG của dự án chỉ ra)
| # | Bước | Kết quả |
|---|---|---|
| 1 | `npm run build` (lần đầu) | 🔴 **EXIT 1** — `Source fingerprint không hợp lệ` (expected `bb706f12…` ≠ actual) ⇒ ⭐ phải **fixpoint** trước |
| 2 | `node tools/fixpoint-fingerprint.mjs` | ✅ **FIXPOINT OK** — vân tay nguồn mới `cc2e15bd…` (sau khi sửa các tệp phản chiếu: `c37a1809…`) |
| 3 | `npm run build` (lần 2) | 🔴 **EXIT 1** — *«`Dockerfile` chưa đồng bộ định danh FULL W2»* ⇒ ⭐ **đọc cổng thật** `scripts/preflight-source.mjs:250-255` (chỉ **2 tệp**: `Dockerfile` + `deploy/docker-compose.yml`, phải chứa **`BUILD` + `PACKAGE` + `UI_CONTRACT`**) |
| 4 | Sửa **6 tệp phản chiếu**: `Dockerfile` · `deploy/docker-compose.yml` · `.env.example` · `VNTECH_FULL_W2_ID.txt` · `VNTECH_PRODUCT_IDENTITY.txt` · `README.md` | ✅ `FULL W2 SOURCE PREFLIGHT: ĐẠT · 5.3.0-ALPHA-TEST-2026.10` |
| 5 | `npm run build` (lần 3) | 🔴 **EXIT 1** — *«`VNTECH_FINGERPRINT.json` không khớp SSOT tại `releaseBuild`»* ⇒ sửa `releaseBuild` ⇒ ✅ qua |
| 6 | `npm run build` (lần 4) | 🔴 **EXIT 1** — *«Release fingerprint không hợp lệ»* ⇒ ⚠️ công cụ `refresh-phase-identity.mjs` **EXIT 64** (cần tham số) ⇒ ⭐ **tự tính** bằng CHÍNH thư viện dự án (`calculateReleaseFingerprint`) = `1f7ebad2…` ⇒ ghi vào SSOT + JSON ⇒ ✅ qua |
| 7 | `node tools/_sync-identity-once.mjs` | ✅ `.local-data/warehouse.sqlite` **KHỚP** + trigger bảo vệ tạo lại ✓ |
| 8 | **`npm run build`** | 🎉 **EXIT 0 — built trong 26 giây** · `dist/` mới **13:34** ✓ |
| 9 | Chạy lại `:8787` (**dừng ĐÚNG PID** `local-server.mjs`) | ✅ pid **17980** |

### 2. CỔNG NGHIỆM THU — **ĐẠT CẢ 3**
```
✓ do-moi    dist/ moi hon nguon 49s · 116 tep nguon da doi
✓ van-tay   HTML mang c37a1809d58c5856 · khop SSOT
✓ byte      6/6
KET LUAN: BAN CHAY DUNG BAN DA BUILD MOI NHAT.
```
### 3. ĐỊNH DANH MỚI (⛔ chỉ đổi **NHÃN**, giữ mã kỹ thuật)
| Trường | Trước | Sau |
|---|---|---|
| `release.name` | `VNTECH ERP V5.3.0 MASTER BASELINE R1.1.1` | ⭐ **`VNTECH ERP V5.3.0 ALPHA TEST 2026.10`** |
| `release.build` | `5.3.0-MASTER-BASELINE-R1.1.1-FINAL-20260908` | ⭐ **`5.3.0-ALPHA-TEST-2026.10`** |
| `release.uiContractId` | `VNTECH-UI-V5.3.0-MASTER-BASELINE-…` | ⭐ **`VNTECH-UI-V5.3.0-ALPHA-TEST-2026.10`** |
| `release.uiGeneration` | `VNTECH-MASTER-BASELINE-R1.1.1-UI-V5.3.0` | ⭐ **`VNTECH-ALPHA-TEST-2026.10-UI-V5.3.0`** |
| `sourceFingerprint` | `bb706f1202490077…` | ⭐ **`c37a1809d58c5856…`** (`VNTECH-FP-C37A1809D58C5856`) |
| `brandFingerprint` | `c6990f5f…` | ⭐ **`8abd517e…`** |
| `releaseFingerprint` | `e41f1239…` | ⭐ **`1f7ebad2…`** |
| `packageId` · 3 dấu hợp đồng (`uiBuildMarker`/`functionalUiMarker`/`regressionContract`) | — | ⛔ **GIỮ NGUYÊN** (định danh kỹ thuật + hợp đồng byte-level của cổng) ✓ |

### 4. ⚠️ TỒN ĐỌNG BÁO CÁO (⛔ KHÔNG tự sửa)
| # | Việc | Vì sao ⛔ không tự sửa |
|---|---|---|
| 1 | **59 chỗ** còn nhãn BUILD cũ + **11 chỗ** vân tay cũ — **chủ yếu trong `docs/**`** (banner tài liệu + báo cáo LỊCH SỬ) | ⭐ `docs/**` = phạm vi **`ERP-SESSION-04`** · ⚠️ và các báo cáo mốc cũ là **ghi chép lịch sử** ⇒ ⛔ không viết lại lịch sử (luật `D-105`) |
| 2 | `test:release-static` **EXIT 1** — `SHA256 không khớp` ở `_javac-verify/BOOT-INF/classes/…/ApplicationBeansConfig.class` | ⚠️ **⛔ không phải tệp S01 sửa** (lớp Java của bản build lại) — là **sổ sách băm** của bước BUILD, ⛔ không do đổi định danh ✓ |
| 3 | `tools/probe-catalog-drift.mjs` **EXIT 1** — 6 action Java-only mới (`HANDOFF-D14`) chưa nằm trong `KNOWN_JAVA_ONLY` | ⚠️ tệp **của `ERP-SESSION-04`** (họ vừa sửa 12:47) ⇒ đã gửi `HANDOFF-20261009-A05` đề nghị thêm 6 tên ✓ |

## DEV-20261009-012 — 🔧 **VÁ CỔNG «SHA256 không khớp»** (nguyên nhân gốc: manifest 01/10 do BẢN CÔNG CỤ CŨ sinh, còn 384 dòng _javac-verify/** mà công cụ HIỆN TẠI đã loại) ⇒ ✅ erify-full-release **EXIT 0** (7506 tệp · _javac-verify 384→0) · ⚠️ 	est:release-static còn đỏ ở tầng **«Brand fingerprint»** (SSOT cũ hơn cây nguồn do FE đang bị sửa) ⇒ ⭐ **GIỮ BUILD** (luật `D-111`) + gửi `HANDOFF-20261009-A07` xin xác nhận `RELEASED` ✓

## DEV-20261009-013 — 🧩 **Thiết kế 2 tầng quyền cho nhóm Công việc** (khoá TAB vs khoá THAO TÁC)

**BỐI CẢNH**: user báo ma trận phân quyền Công việc «hardcode chỉ có phòng kế hoạch và dự án» và chốt **Mô hình B** (mỗi tab một khoá) + luật **«mọi user đều truy cập được Công việc; quyền thao tác theo phân quyền»**.

**THIẾT KẾ ĐÃ ÁP (2 tầng, ⛔ KHÔNG trộn)**:
| Tầng | Khoá | Quyết định điều gì | Ai cấp |
|---|---|---|---|
| **① TRUY CẬP TAB** | `work_dashboard` · `work_list` · `work_department` · `work_assign` · `work_project` · `work_reports` (+ `approvals` có sẵn) | **Thấy/được vào TAB nào** trong màn «Công việc» | ✅ mặc định **`can_view` cho MỌI user** (11 phòng · 28 tài khoản) ⇒ «mọi user truy cập được Công việc» ✓ |
| **② THAO TÁC** | khoá cha **`work`** + 6 năng lực `can_view/use/create/edit/approve/export` | **Được GHI/duyệt/xuất gì** (đối chiếu `ActionRbacRegistry`) | admin tick **từng người** trong ma trận ✓ |

**⚠️ CÁC ĐIỂM KỸ THUẬT ĐÃ ĐO (⛔ không đoán)**: ① tên tab lấy từ `WorkCenter.tsx:94` (⛔ không bịa) — «Được giao» **đang ẩn** (`WORK_TABS_HIDDEN`, quyết định 08/10) ⇒ ⛔ không tạo khoá ✓ ② «Trung tâm phê duyệt» đã có khoá `approvals` ⇒ ⛔ không tạo trùng ✓ ③ `work_hub` ⛔ **không phải action** (là khoá MỤC MENU, `lib/menu-helpers.ts:150`) ⇒ ⛔ không khai quyền ✓ ④ ⚠️ **Phạm vi DỮ LIỆU ⛔ không đổi**: `can_view` gác **action**, còn phạm vi vẫn do use-case tính động (`workScope.scopeOf(cu.id(), cu.role())`) ⇒ nhân viên chỉ thấy dữ liệu trong phạm vi mình ✓
**⚠️ RỦI RO ĐÃ NHẬN DIỆN**: `UserManagementUseCase.replaceDepartmentDefaults` ⚠️ **ghi đè** dòng `department_default` khi admin lưu phân quyền của một user ⇒ ⭐ **có chủ ý** (mặc định phòng) ⇒ khi admin đổi quyền phòng thì mức mặc định của các user trong phòng đó đổi theo ✓ (⭐ muốn cố định thì phải tick thành `manual_override`) ✓

## DEV-20261009-021 — MENU «CÔNG VIỆC»: **bấm nhóm = mở THẲNG màn Công việc** (yêu cầu TRỰC TIẾP của user)

- **Tệp**: `app/page.tsx` (LOCK `ERP-SESSION-01`) — 2 khối trong hàm dựng sidebar (`groupTree.map`)
- **Cách làm (⚠️ quyết định kỹ thuật, ⛔ không phải sửa vặt)**: hợp đồng test `tests/p6-08-menu-single-item.test.mjs` khẳng định theo **CHUỖI NGUYÊN VĂN** (`page.indexOf("groupKey === approvalCenterGroup.groupKey && group.children.length === 1")`) ⇒ ⭐ **GIỮ NGUYÊN VĂN khối cũ** (L758) + **thêm khối MỚI riêng** cho `my_work` (L773) ⇒ ⛔ không phải sửa test của phiên khác, ⛔ không phá hợp đồng ✓
- **Điều kiện ĐO được của khối mới**: `groupKey === "my_work" && group.children.length === 0 && workMenuChildren.length === 1` ⇒ ⭐ hội tụ sau khi S04 rút `project_admin` khỏi menu; ⚠️ nếu nhóm còn mục con khác ⇒ **tự rơi về hành vi cũ** (nhóm xổ ra) ⇒ ⛔ không đổi cấu trúc menu ngoài yêu cầu ✓
- **Bẫy đã gặp + đã sửa trong cùng lượt**: lần đầu tôi gộp 2 điều kiện vào 1 `if` ⇒ ⛔ **đổi chuỗi** ⇒ `P6-08` **ĐỎ** (⚠️ test đọc theo chuỗi, ⛔ không theo hành vi) ⇒ tách lại ⇒ **3/3 PASS** ✓
- **Đo**: `typecheck` **EXIT 0** ✓ · `P6-08` **3/3** ✓ ⚠️ (còn `T-13` đỏ = **việc ĐANG DỞ của S04**: đo `lib/menu-helpers.ts` 15:23:18 + `tests/t13` 15:23:32 ⇒ lỗi *«`work` chưa bị ẩn khỏi CÂY MENU ⇒ người dùng thấy **2 mục Công việc**»*) ✓
- ⚠️ **Phát hiện kèm (giao S04)**: lỗi user thấy gồm **CẢ** khoá `work` (nhãn «Công việc (mọi phòng ban)») **hiện thành mục menu thứ 2** — ⛔ không chỉ `project_admin` ✓

## DEV-20261009-022 — 📐 **ĐẶC TẢ SẴN-SÀNG-ÁP: thi hành `work_others` theo phương án A** (user đã chốt) — ⛔ chưa sửa mã

**PHÁT HIỆN ĐO ĐƯỢC (⛔ không suy đoán)**:
1. ⭐ **«Theo người» (W2) ở FE KHÔNG phải nguồn dữ liệu mới**: `WorkCenter.tsx` gom nhóm theo `assignedTo` **TRONG `scopedWork`** (tập đã thu hẹp ✓, L374 ghi rõ «⛔ không bao [gồm ngoài phạm vi]») + UI **tự tắt sửa** với việc của người khác (L381) ⇒ ⭐ **biên an ninh thật nằm ở SERVER** ✓
2. ⭐ **`OpsTaskStore` (port) ⛔ KHÔNG có hàm liệt kê việc theo phạm vi** ⇒ việc được **thu hẹp ngay trong PAYLOAD bootstrap** ✓ (đúng chú thích `WorkCenter.tsx` L26 «thu hẹp trong payload, không mở rộng quyền»)
3. ⭐ **ĐIỂM THI HÀNH CHÍNH XÁC**: `java-backend/infrastructure/.../persistence/BootstrapDataAdapter.java` **L1544–1595** — SQL chọn `workItems` có **3 nhánh phạm vi** (port nguyên văn JS `:715-718`):
   · `departmentForRole(user)=='KH'` ⇒ việc phòng KH ✓
   · `departmentCodeForUser(user)=='BCH'` ⇒ việc ban chỉ huy ✓
   · **còn lại ⇒ `wi.assigned_to=?` = CHỈ việc CỦA MÌNH** ✓
   + **L1586** đã có **khuôn REUSE**: nhánh quản lý gate bằng `EXISTS (… ump.module_key='work' AND ump.can_approve=1)` ✓
4. ⭐ Có sẵn **`ModulePermissionStore.canUseModule(userId, moduleKey, capability)`** (port ✓) dùng bởi `AccessScopeService` ✓ ⇒ ⛔ không cần viết cơ chế mới (luật §17 REUSE ✓)

**📐 ĐẶC TẢ ÁP (phương án A — CỘNG THÊM, ⛔ 0 mất quyền)**:
- Trong nhánh **«chỉ việc của mình»** (`wi.assigned_to=?`), thêm **OR** một `EXISTS` mới trên `user_module_permissions` (⚠️ **cùng khuôn L1586**, ⛔ không phát minh cơ chế khác):
  `OR EXISTS (SELECT 1 FROM user_module_permissions ump2 WHERE ump2.user_id=? AND ump2.module_key='work_others' AND ump2.can_view=1 AND (ump2.permission_expires_at IS NULL OR ump2.permission_expires_at > NOW()))`
  ⇒ ⭐ tài khoản **được cấp `work_others`** sẽ thấy thêm **việc trong PHÒNG mình** (⚠️ **mức hẹp nhất có nghĩa** — chốt an toàn; ⚠️ muốn rộng hơn (mọi phòng) thì user xác nhận thêm 1 dòng ✓)
- ⚠️ **BIND THAM SỐ**: thêm **1 dấu `?`** ⇒ phải thêm **1 giá trị bind ĐÚNG VỊ TRÍ** (⚠️ L1589 ghi rõ «Thứ tự bind PHẢI khớp thứ tự dấu ?» ⇒ đây là **điểm dễ sai nhất** ✓)
- ⚠️ **⛔ KHÔNG đụng** 2 nhánh KH/BCH (⇒ ⛔ 0 mất quyền trưởng phòng/phó GĐ/giám đốc ✓ — đúng ràng buộc «CỘNG THÊM» ✓)
- **TEST BẮT BUỘC (2 chiều)**: ① tài khoản **KHÔNG** có khoá ⇒ payload **y như cũ** (chỉ việc mình) ✓ ② tài khoản **CÓ** khoá ⇒ thấy thêm việc phòng mình ✓ · ➕ `probe-action-registry-coverage` **vẫn 0 mù quyền** ✓ · Java suite ⛔ 0 fail ✓
- ⚠️ **VÌ SAO CHƯA ÁP TRONG LƯỢT NÀY**: phiên đã rất dài; ⚠️ sửa SQL bind sai vị trí = **lỗi im lặng nguy hiểm** (⚠️ trả SAI dữ liệu cho người dùng) ⇒ ⭐ **thà giao đặc tả chính xác + áp ở lượt đầu kế tiếp với đầu óc sạch** ✓ (luật: ⛔ không đoán · ⛔ không vá nửa vời ✓)

## DEV-20261009-018 — ⭐ **KÊNH KIỂM MỚI: MỞ UI THẬT BẰNG TRÌNH DUYỆT** (09/10/2026 ≈18:45 · `ERP-SESSION-01`)

**Thay đổi cách làm (tooling, ⛔ 0 dòng mã sản phẩm):** ⭐ từ nay S01 **kiểm UI SỐNG** thay vì chỉ suy từ mã ✓ — ⭐ **địa chỉ ĐÚNG là `http://127.0.0.1:9000/`** (proxy cutover ✓ — vào thẳng dashboard, đã đăng nhập ✓); ⚠️ **`http://127.0.0.1:8787/` trả login 401** với tài khoản demo ⇒ ⛔ đừng dùng để kiểm ✓.

**Kỹ thuật (ghi để ⛔ không mò lại):**
* ① Điền form đăng nhập bằng selector `input[name="username"]` và `input[type="password"]` ✓
* ② ⚠️ **Click THẬT (`trusted: true`) hay bị `CDP did not respond within 5s`** trên trang này ⇒ ⭐ **click JS thường là đủ cho SPA** ✓
* ③ Nhóm menu **bung/thu bằng click nhóm cha** (`button.nav-parent` ✓); mục con có class `nav-child` ✓
* ④ ⭐ Mẫu DOM đáng nhớ: mục menu **1 cấp** = `button.nav-dashboard-direct.nav-single-direct` ✓ (⭐ chính là «Công việc»/«Trung tâm phê duyệt» ✓)

**GIÁ TRỊ:** ⭐ kiểm được **bằng mắt** những thứ mà đọc mã ⛔ không kết luận chắc: menu thật ✓ · modal có/không ✓ · ô tìm kiếm ✓ ⇒ ⭐ dùng **chuẩn bị bằng chứng** cho 4 điểm user cần thử (⚠️ vẫn ⛔ **không thay user xác nhận cuối** ✓ luật §24).

### 🧭 BỔ SUNG `DEV-20261009-018` — **đường đi màn phân quyền** (≈19:15)
* Menu: «**QUẢN TRỊ HỆ THỐNG**» → «**DANH MỤC & PHÂN QUYỀN**» (`button.nav-child.nav-child-system_admin` ✓)
* Trong màn: tab «**5 Phân quyền phòng ban**» · «**6 Phân quyền người dùng**» (⚠️ **chữ số là phần tử RIÊNG** ⇒ tìm theo đúng chuỗi có số sẽ ⛔ không khớp ✓)
* ⚠️ Tab «Phân quyền người dùng» = **danh sách 74 người** (MÃ NV · HỌ TÊN · PHÒNG BAN · CHỨC DANH · CẤP BẬC · QUYỀN · CẢNH BÁO ✓) — ⛔ **chưa phải bảng khoá module**
* ⚠️ Chọn **tài khoản theo `startsWith` tên mục menu** (⭐ ⛔ dùng `nth-of-type` rất dễ trỏ sai — S01 đã trỏ nhầm 1 lần ✓)
