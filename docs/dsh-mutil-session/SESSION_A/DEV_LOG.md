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
