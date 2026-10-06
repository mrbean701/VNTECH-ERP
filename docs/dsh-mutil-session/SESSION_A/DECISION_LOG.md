# DECISION_LOG — SESSION_A (ERP-SESSION-01)

> Phien: **ERP-SESSION-01** · Timezone Asia/Ho_Chi_Minh (UTC+7) · Pham vi: **PHAN QUYEN + BAO LOI + MUA HANG/GIAO NHAN**
> ⭐ **§4**: ⭐ **CHI ghi quyet dinh co ANH HUONG** den: **Architecture · Business Logic · UI/UX · Database · Workflow · RBAC · Integration · Technical Direction** — ⛔ **KHONG ghi moi suy nghi nho** ✓

---

## DEC-20261006-001

Date: 2026-10-06
Session: ERP-SESSION-01
Category: **DEVOPS** (Technical Direction)
Decision: ⭐ **Doi THU TU trong `tools/deploy-java-backend.mjs` thanh: dung Java ⇒ build ⇒ migration check ⇒ start** (⭐ truoc day: build ⇒ start).
Reason: ⚠️ Cong cu **LUON that bai** o buoc build: `Failed to execute goal spring-boot-maven-plugin:3.5.0:repackage … Unable to rename '…SNAPSHOT.jar' to '…jar.original'` + `The process cannot access the file … being used by another process` ⚠️ — ⭐ vi **tien trinh Java dang chay GIU KHOA file JAR** ✓
Alternatives Considered: (a) build ra ten khac · (b) dung `--force` / bo qua repackage · (c) **dung Java TRUOC khi build**.
Selected Solution: ⭐ **(c)** — ⭐ don gian nhat, ⛔ khong doi cau hinh Maven, ⭐ **dung ban chat van de** (⭐ file bi khoa thi phai **nha khoa truoc**) ✓
Impact: ⭐ Trien khai **chay duoc tu dong** (⛔ truoc day phai lam tay) · ⭐ them **tu khoi phuc JAR cu** neu build loi hoac thieu migration ⇒ ⭐ **⛔ khong de he thong chet** ✓
Related Task: TASK-20261006-001
Related Change: CHG-20261006-001
⭐ GHI CHU: ⚠️ ⭐ **che do `--dry-run` ⛔ KHONG bat duoc loi nay** (⭐ vi no **khong build**) ⇒ ⭐ **phai chay that** moi thay ✓

---

## DEC-20261006-002

Date: 2026-10-06
Session: ERP-SESSION-01
Category: **FRONTEND** (Technical Direction — ⭐ quyet dinh QUAN TRONG NHAT phien)
Decision: ⭐ **Moi khi can DOC KET QUA tu API ⇒ PHAI dung `requestApi`, ⛔ KHONG dung `action`.**
Reason: ⚠️⚠️ ⭐ **`action()` trong `app/page.tsx` ⛔ KHONG tra payload — no tra `undefined` khi thanh cong** ⚠️ (⭐ **CHINH NHA da ghi canh bao o `page.tsx:318-319`**). ⇒ ⭐ Bat ky doan ma nao lam `if (await action(...))` hoac `res?.xxx` tu `action` deu **SAI am tham** ✓
Alternatives Considered: (a) sua `action()` de tra payload (⚠️ **anh huong TOAN BO repo** — ⛔ qua rui ro) · (b) dung `requestApi` tai cho.
Selected Solution: ⭐ **(b)** — `requestApi` **CO tra JSON** va **NEM LOI** khi HTTP khong OK ⇒ ⭐ **an toan va cuc bo** ✓
Impact: ⭐ ⚠️ **QUYET DINH NAY DA CHUA 2 BUG TRONG CUNG MOT NGAY**: `BUG-20261006-001` (danh sach bao loi rong) va `BUG-20261006-004` («Da luu **0/N**» — ⚠️ **du du lieu VAN LUU THAT**) ⇒ ⭐ ca hai deu do **`action()` khong tra payload** ✓
Related Task: TASK-20261006-002 · TASK-20261006-005
Related Change: CHG-20261006-002 · CHG-20261006-004
⭐ **LUAT RUT RA**: ⭐ **`action()` = «goi va quen» (fire-and-forget)** · ⭐ **`requestApi` = «goi va DOC KET QUA»** ⇒ ⭐ **chon theo NHU CAU, ⛔ dung theo thoi quen** ✓

---

## DEC-20261006-003

Date: 2026-10-06
Session: ERP-SESSION-01
Category: **RBAC** (Business Logic)
Decision: ⭐ **BO chot `P5.3`** — `assertDepartmentAllowsPermissions` (`UserManagementUseCase.java:266`) ⇒ ⭐ **cho phep cap quyen VUOT phong ban cho nguoi dung**.
Reason: ⭐ **YEU CAU TRUC TIEP CUA USER**: «Toi muon sua lai co the them quyen cho nguoi dung **ke ca phong ban cua user do khong co quyen nhu vay**.» ⇒ ⭐ Chot `P5.3` chan dung viec nay ✓
Alternatives Considered: (a) giu `P5.3` + them co che ngoai le cho admin · (b) **bo han chot** · (c) chi cho phep voi mot so module.
Selected Solution: ⭐ **(b)** — ⭐ ⚠️ **comment bo** (⛔ **KHONG xoa** — de lai dau vet) + ⭐ **GIU NGUYEN guard payload rong** (MOC 111, dong ~274) ✓
Impact: ⚠️ ⭐ **THAY DOI HANH VI NGHIEP VU** — cap quyen linh hoat hon ⚠️ · ⭐ **PHAI viet lai bai test** `AdminGovernanceIntegrationTest` (⭐ vi no **khang dinh chinh hanh vi `P5.3` cu**) ⇒ ⭐ doi ten thanh `phanQuyenPhongBan_capVuotQuyenChoNguoiDung_KHONGConChan` + `expectRejected` → `ok` + ⭐ **khang dinh MANH HON** (kiem ca quyen **DA duoc ghi**) ✓
Related Task: TASK-20261006-004
Related Change: CHG-20261006-003
⚠️ **RUI RO CON LAI**: ⭐ Quyen vuot phong ban co the **lam bao cao kiem soat quyen kho hon** ⇒ ⭐ **can theo doi** ✓

---

## DEC-20261006-004

Date: 2026-10-06
Session: ERP-SESSION-01
Category: **WORKFLOW** (Architecture)
Decision: ⭐ **Dat cong chan F2 TRONG `receiveGoods`, ⛔ KHONG dat trong `findPoForReceiving`.**
Reason: ⚠️ ⭐ `findPoForReceiving` co **3 NOI GOI** ⚠️ — ⭐ trong do **`decidePo` CAN trang thai `pending_approval`** ✓ ⇒ ⭐ neu dat cong chan o day thi **`decidePo` se bi chan** ⇒ ⭐ **KHONG the phe duyet PO** ✓
Alternatives Considered: (a) dat trong `findPoForReceiving` (⛔ **lam hong `decidePo`**) · (b) dat trong `receiveGoods` · (c) them tham so `requireIssued` cho `findPoForReceiving`.
Selected Solution: ⭐ **(b)** — ⭐ dat tai **dung noi ghi du lieu** ⇒ ⭐ **pham vi hep nhat, rui ro thap nhat** ✓
Impact: ⭐ Chan nhan hang tren PO chua phat hanh · ⭐ **`decidePo` KHONG bi anh huong** ✓
Related Task: TASK-20261006-007
Related Change: CHG-20261006-006
⭐ **LUAT RUT RA**: ⭐ **truoc khi dat guard vao 1 ham ⇒ PHAI dem SO NOI GOI va kiem TUNG noi** ⚠️ — ⭐ ham dung chung thi **pham vi anh huong rong hon ve ngoai** ✓

---

## DEC-20261006-005

Date: 2026-10-06
Session: ERP-SESSION-01
Category: **FRONTEND** (Technical Direction — ⭐ quyet dinh **HOAN NGUYEN**)
Decision: ⭐ **HOAN NGUYEN `save()` va `deleteSelected()` ve BAN GOC** sau khi **4 lan thu** them «TIEN DO + GOI SONG SONG» deu bi **ESLint DO**.
Reason: ⚠️ ⭐ **§24: `FIXED = CODE FIXED + TEST PASSED`** ⚠️ — ⭐ **test DO thi ⛔ KHONG duoc goi `FIXED`** ✓ · ⚠️ ⭐ «TIEN DO» la **NEN CO**, ⛔ **khong dang de `npm test` DO** ✓
Alternatives Considered: (a) tiep tuc thu (⚠️ **da thu 4 lan**) · (b) **hoan nguyen** · (c) **sua o BACKEND** (⭐ **tot hon**).
Selected Solution: ⭐ **(b) truoc** (⭐ de dua he thong ve trang thai **XANH da chung minh**) ⇒ ⭐ roi **(c)** ✓
Impact: ⭐ `npm test` **XANH** tro lai (**EXIT=0 · pass 802 · fail 0**) · ⚠️ User **van con** gap «doi rat lau» ⚠️ — ⭐ nhung **it nhat khong te hon** ✓
Related Task: TASK-20261007-001
Related Change: CHG-20261006-011
⚠️⚠️ **NGUYEN NHAN THAT (⭐ tim ra o LAN THU 5)**: ⭐ **lan sua DAU TIEN da XOA MAT dong khai bao `let ok = 0, that = 0, loiDau = "";` cua `deleteSelected()`** ⚠️ ⇒ ⭐ no **gan vao bien cua `save()`** ⇒ ⭐ ESLint bao **DUNG**: «**Cannot reassign variables declared outside of the component/hook**» ✓
⭐ **LUAT RUT RA (⭐ QUAN TRONG NHAT)**: ⭐ **Khi `edit` thay mot KHOI DAI ⇒ PHAI GIU LAI MOI DONG KHAI BAO** ⚠️ — ⭐ **toi mat 4 vong vi ⛔ khong kiem dong khai bao con hay mat** ✓

---

## DEC-20261006-006

Date: 2026-10-06
Session: ERP-SESSION-01
Category: **RBAC** (Technical Direction)
Decision: ⭐ **Kiem quyen module PHAI LUON tinh ca vai tro `admin`** — dung `isAdminUser(user) || hasAdminTab(data, key)`, ⛔ **KHONG chi dung `hasAdminTab`.**
Reason: ⚠️⚠️ ⭐ **DO CHINH PHIEN NAY GAY RA `BUG-20261006-006`**: ban va dau tien khoa nut buoc 14 bang `hasAdminTab` (⭐ ham **CHI doc `allModulePermissions`**) ⚠️ **NHUNG tai khoan `admin` co 0 DONG QUYEN MODULE** (⭐ **DO THAT**: `so_dong_quyen = 0`) ⇒ ⭐ **NUT BI KHOA VINH VIEN** ✓
Alternatives Considered: (a) cap dong quyen cho `admin` (⚠️ **khong can thiet** — ⭐ `RbacService` **da loai tru** `admin`) · (b) **dung `isAdminUser`** · (c) bo han viec khoa nut.
Selected Solution: ⭐ **(b)** — ⭐ dung **helper CO SAN CUA NHA** (`lib/permissions.ts:13`), ⭐ da import o `page.tsx:51`, ⭐ **chinh nha cung dung no** trong `modulePermission` (`lib/permissions.ts:16`) ✓
Impact: ⭐ `admin` mo duoc tab tro lai (**USER XAC NHAN**) · ⭐ nguoi **thieu quyen VAN bi khoa dung** ✓
Related Task: TASK-20261006-006
Related Change: CHG-20261006-005
⭐ **LUAT RUT RA**: ⭐ ⚠️ **API va UI co the CHAT KHAC NHAU ve quyen** ⚠️ — ⭐ `RbacService` **loai tru vai tro `admin`** khoi kiem module ⚠️ **NHUNG UI thi khong biet** ⇒ ⭐ **UI CHAT HON API** ⇒ ⭐ **phai kiem CA HAI phia khi lam viec voi quyen** ✓

---

## DEC-20261006-007

Date: 2026-10-06
Session: ERP-SESSION-01
Category: **DATABASE** (Technical Direction)
Decision: ⭐ **MOI thao tac ghi/xoa du lieu ⇒ PHAI SAO LUU TRUOC + PHAI CO PHEP DOI CHIEU chung minh ⛔ khong pha du lieu.**
Reason: ⚠️ ⭐ Cac thao tac **xoa 570 dong quyen mo coi** va **ghi bu 10 dong so kho** deu **anh huong du lieu that** ⚠️ — ⭐ neu sai thi **⛔ khong the hoan tac** ✓
Alternatives Considered: (a) chay truc tiep (⚠️ **rui ro cao**) · (b) **sao luu bang `CREATE TABLE … AS SELECT`** · (c) dung transaction.
Selected Solution: ⭐ **(b)** — ⭐ tao bang sao luu rieng (`backup_ump_20261006` · `backup_csl_20261006`) ⇒ ⭐ **co the doi chieu va khoi phuc** ✓
Impact: ⭐ ⭐ **CHUNG MINH DUOC «KHONG PHA DU LIEU»** bang so lieu: ⭐ `backup_ump_20261006` ⇒ **«dong bi xoa THUOC ve `e2e.*`» = 0** · ⭐ ca 14 tai khoan `e2e.*` giu nguyen **59–60 dong** ✓ ⭐ Va **chinh phep doi chieu nay** da **minh oan** cho phien nay khi bai `go-live-chuoi-kho` hong (**HTTP 403**) ✓
Related Task: TASK-20261006-008 · TASK-20261006-009 · TASK-20261006-010
Related Change: CHG-20261006-007 · CHG-20261006-009
⭐ **LUAT RUT RA**: ⭐ **sao luu truoc** + ⭐ **doi chieu theo TUNG NHOM** (⛔ khong chi so tong) ✓

---

## DEC-20261006-008

Date: 2026-10-06
Session: ERP-SESSION-01
Category: **DEVOPS** (Technical Direction — ⭐ phuong phap DO)
Decision: ⭐ **Phuong phap DUNG de kiem «bundle dang phuc vu co ban va chua»**: ⭐ **ⓐ dung `href`** (⛔ khong chi `src`) · ⭐ **ⓑ tai bundle VE DIA roi doc** · ⭐ **ⓒ tim chuoi tieng Viet RAW** (⛔ KHONG escape) · ⭐ **ⓓ ⛔ KHONG tim TEN BIEN NOI BO** (⭐ vi **minify doi ten**) ✓
Reason: ⚠️⚠️ ⭐ **TOI DA DO SAI 6 LAN LIEN TIEP** vi **2 loi phuong phap CHONG NHAU**: ⭐ ① tuong bundle **escape unicode** ⚠️ ⇒ **SAI** (⭐ bundle luu **RAW**) · ⭐ ② tuong Next.js dung `<script src="…">` ⚠️ ⇒ **SAI** (⭐ no dung `<link rel="modulepreload" href="…">`) ✓
Alternatives Considered: (a) **kiem bang CACH NHIN bang mat** — ⛔ khong tu dong hoa duoc · (b) **tin vao cong UI** `verify-ui-build-applied.mjs` (⭐ chi chung minh **byte khop**, ⛔ khong chung minh **co TINH NANG**) · (c) ⭐ **phuong phap 4 buoc tren**.
Selected Solution: ⭐ **(c)** + ⭐ **LUON chay cong UI truoc** ✓
Impact: ⭐ ⚠️ **SUYT KET LUAN SAI**: toi tung noi voi user «**NGHI VAN SO 1: BROWSER CACHE**» ⚠️ — ⭐ **SAI** — ⭐ **bundle luc do THUC SU THIEU** 2 ban va ✓ ⇒ ⭐ **USER BAO DUNG** ✓
Related Task: TASK-20261006-005 · TASK-20261006-011
Related Change: CHG-20261006-008
⭐ **LUAT RUT RA (⭐ §16)**: ⭐ **TRUOC KHI TIN mot ket qua «KHONG CO», PHAI KIEM**: ⭐ ① **phep do co DOC DUOC du lieu that khong?** (⭐ ⚠️ **so vo ly = PHEP DO HONG**, ⛔ khong phai code thieu — ⭐ **dau hieu da gap**: «**so bundle = 0**» · «**tong ky tu CSS = 4**») · ⭐ ② **da kiem HET nguon chua?** · ⭐ ③ **du lieu co bi escape khong?** ✓

---

## DEC-20261006-009

Date: 2026-10-06
Session: ERP-SESSION-01
Category: **FRONTEND** (Technical Direction — ⭐ **CACH SUA DUNG**)
Decision: ⭐ **De hien TIEN DO trong vong lap ⇒ DUNG CHINH bien dem DA CO (`ok + that`), ⛔ KHONG them bien dem moi va ⛔ KHONG doi cau truc vong lap.**
Reason: ⚠️ ⭐ Luat **ESLint (React Compiler)** bao DO «**Cannot reassign variables declared outside of the component/hook**» ⚠️ — ⭐ **4 lan thu truoc deu them bien/cau truc moi** ⇒ ⚠️ **DEU DO** ✓ · ⭐ **NHUNG BAN GOC da dung `ok++`/`that++` TRONG `for...of` VA QUA DUOC LINT** ✓
Alternatives Considered: (a) `for (let i…; i += LO)` (⛔ **DO** — ⭐ `i += LO` cung la gan lai) · (b) `for (const [i, x] of arr.entries())` (⛔ **DO**) · (c) `Promise.all` theo lo (⛔ **DO**) · (d) ⭐ **dung `ok + that`** ✓
Selected Solution: ⭐ **(d)** — ⭐ **khong tao bien moi, khong doi cau truc** ⇒ ⭐ **qua duoc lint** ✓
Impact: ⭐ ⭐ **BUG-20261007-001 DA SUA XONG**: ⭐ `npm test` **EXIT=0 · pass 802 · fail 0 · 0 errors** · ⭐ build **EXIT=0** · ⭐ cong UI **3/3** · ⭐ **ca `:8787` va `:9000` deu co chuoi «⏳ Đang lưu »** ✓
Related Task: TASK-20261007-001
Related Change: CHG-20261006-011
⭐ **LUAT RUT RA**: ⭐ **khi sua ma bi luat lint chan ⇒ ⛔ DUNG them cau truc moi** — ⭐ **hay tim bien/du lieu DA CO trong pham vi cho phep** ✓
⚠️ **CON LAI**: ⭐ Sua o **BACKEND** se tot hon nhieu: ⭐ bo `syncDepartmentUsers` khoi **moi** lan luu, ⭐ **chi dong bo 1 LAN O CUOI** ⇒ ⭐ **11,5 giay → ~1 giay** ✓

---

## DEC-20261006-010

Date: 2026-10-06
Session: ERP-SESSION-01
Category: **DATABASE + RBAC** (Business Logic — ⭐ du lieu kiem thu)
Decision: ⭐ **Cap quyen `e2e.*` o CA HAI TANG: CAP PHONG BAN (`department_module_permissions`) VA CAP NGUOI DUNG (`user_module_permissions`).**
Reason: ⭐ ⭐ **DO THAT**: ⭐ **15 dong quyen DA TON TAI** voi `can_view=1` ⚠️ **NHUNG `can_use=0` · `can_create=0` · `can_edit=0` · `can_approve=0`** ⚠️ va `permission_source = **department_default**` ✓ ⇒ ⭐ ⓐ Cap **chi o nguoi dung** ⇒ ⚠️ **bi `syncDepartmentUsers` GHI DE** moi lan luu phong ban ✓ · ⭐ ⓑ Cap **chi o phong ban** ⇒ ⚠️ **chua co hieu luc NGAY** (⭐ phai cho lan dong bo) ✓
Alternatives Considered: (a) chi cap nguoi dung · (b) chi cap phong ban · (c) **cap CA HAI**.
Selected Solution: ⭐ **(c)** — ⭐ **BEN** (⭐ phong ban) + ⭐ **CO HIEU LUC NGAY** (⭐ nguoi dung) ✓
Impact: ⭐ ⭐ **`go-live-chuoi-kho` TU 5/9 (1/7) → 7/7 · 0 THAT BAI** ✓ · ⭐ E2E **8/8 DAT** ✓ · ⭐ **API xac nhan** `e2e.tk`: `teams`·`warehouse_issue`·`approvals` (**canApprove=1**)·`stocktake`·`inventory` — ⭐ **deu canView=1 · canUse=1** ✓ · ⭐ **DOI CHUNG**: tong **1634 ⛔ KHONG DOI** · `admin` = **0** ✓
Related Task: TASK-20261006-010
Related Change: CHG-20261006-009
⭐ **LUAT RUT RA**: ⭐ **`user_module_permissions` ⛔ KHONG co cot `active`** (⭐ khac `department_module_permissions`) ⚠️ — ⭐ **phai `SHOW COLUMNS` TRUOC khi viet `INSERT`** ✓ · ⭐ **VA**: ⭐ khi dong quyen co `permission_source = department_default` ⇒ ⭐ **sua o CAP PHONG BAN moi BEN** ✓

---

## TONG KET DECISION

| Category | So luong | Ma |
|---|---|---|
| **DEVOPS** | 2 | -001 · -008 |
| **FRONTEND** | 3 | -002 · -005 · -009 |
| **RBAC** | 3 | -003 · -006 · -010 |
| **WORKFLOW** | 1 | -004 |
| **DATABASE** | 3 | -007 · -010 · (010) |
| **Business Logic** | 2 | -003 · -010 |
| **Technical Direction** | 6 | -001 · -002 · -005 · -006 · -007 · -008 · -009 |

> ⭐ **TONG**: **10 quyet dinh** — ⭐ trong do **3 quyet dinh la HOAN NGUYEN / RUT LUI** (-005) va ⭐ **3 quyet dinh sua LOI DO CHINH PHIEN NAY GAY RA** (-005 · -006 · -009) ✓
> ⭐ **3 LUAT QUAN TRONG NHAT**:
> ① ⭐ **`action()` ⛔ KHONG tra payload** ⇒ ⭐ can doc ket qua thi **PHAI dung `requestApi`** (-002) ✓
> ② ⭐ **Khi `edit` thay KHOI DAI ⇒ PHAI giu lai MOI DONG KHAI BAO** (-005) ✓
> ③ ⭐ **Truoc khi tin ket qua «KHONG CO» ⇒ PHAI kiem PHEP DO co doc duoc du lieu that khong** (-008) ✓
