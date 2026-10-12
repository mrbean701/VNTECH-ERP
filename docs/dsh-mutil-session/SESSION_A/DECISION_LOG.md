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

---

# 🧭 **4 QUYẾT ĐỊNH MỚI — 06/10/2026** (⭐ §11 «TASK COMPLETION LOGGING»)

## ## DEC-20261006-011 — ⭐ `syncNow` LÀ CỜ **TÙY CHỌN**, MẶC ĐỊNH = ĐỒNG BỘ
| ⭐ | ⭐ |
|---|---|
| **CATEGORY** | ⭐ `BACKEND` + `RBAC` + ⭐ **Technical Direction** |
| **BỐI CẢNH** | ⚠️ `save_department_permission` mất **11,50 giây** ⚠️ vì `syncDepartmentUsers` chạy **sau MỖI module** ⚠️ ⇒ ⭐ «Chọn tất cả» 61 module ⇒ ⭐ **~11,7 PHÚT** ✓ |
| **QUYẾT ĐỊNH** | ⭐ Thêm cờ **TÙY CHỌN** `syncNow` ⭐ — ⭐ **thiếu cờ ⇒ `dongBoNgay = true`** ⇒ ⭐ **VẪN ĐỒNG BỘ như cũ** ✓ |
| **VÌ SAO ⛔ KHÔNG bỏ đồng bộ mặc định** | ⭐ **TƯƠNG THÍCH NGƯỢC** ⚠️ — ⭐ `AdminGovernanceIntegrationTest` gọi **không kèm cờ** ⚠️ ⇒ ⭐ nếu mặc định `false` thì ⭐ **test đó ⛔ sẽ đỏ** và ⭐ **quyền user ⛔ không được cập nhật** ✓ |
| **ĐÁNH ĐỔI** | ✅ ⭐ **An toàn**: ⛔ không phá vỡ lời gọi nào hiện có ✓ · ⚠️ **Nhược điểm**: ⭐ nếu **lời gọi CUỐI lỗi** ⇒ ⭐ **⛔ không đồng bộ lần nào** ⚠️ ⇒ ⭐ **bấm Lưu lại** (⭐ hàm **idempotent** ✓) |
| **LIÊN QUAN** | ⭐ `CHG-20261006-011` · ⭐ `DEV-20261006-010` · ⭐ `TEST-20261006-011` ✓ |

## ## DEC-20261006-012 — ⭐ CÔNG CỤ PHẢI **ĐỢI JAR NHẢ KHOÁ**, ⛔ KHÔNG «ĐỢI N GIÂY CỐ ĐỊNH»
| ⭐ | ⭐ |
|---|---|
| **CATEGORY** | ⭐ `DEVOPS` + ⭐ **Technical Direction** |
| **BỐI CẢNH** | ⚠️ `tools/deploy-java-backend.mjs` đợi **3 giây cố định** + ⭐ **CHỈ kiểm «cổng đã trống»** ⚠️ ⇒ ⭐ **build LUÔN thất bại** ⚠️ (`repackage` ⛔ không rename được JAR ✓) |
| **QUYẾT ĐỊNH** | ⭐ Thay bằng ⭐ **«ĐỢI ĐẾN KHI JAR THỰC SỰ NHẢ KHOÁ»** — ⭐ **PHÉP THỬ RENAME** ⭐ (⭐ `Move($j,"$j.lk")` rồi `Move` ngược lại ✓), ⭐ tối đa **60 giây** ✓ |
| **VÌ SAO** | ⚠️ ⭐ **CỔNG TRỐNG ⛔ KHÔNG BẢO ĐẢM JAR ĐÃ NHẢ KHOÁ** ⚠️ — ⭐ đo được: ⭐ JVM giữ handle trên JAR **thêm ~2 GIÂY** nữa sau khi cổng đã đóng ✓ |
| **ĐÁNH ĐỔI** | ✅ ⭐ **Chắc chắn đúng** (⭐ kiểm **trạng thái thật** thay vì **đoán bằng thời gian** ✓) · ⚠️ **Nhược điểm**: ⭐ nếu JAR bị giữ mãi thì ⭐ **dừng sau 60 giây** ⚠️ (⭐ ⛔ không build hỏng ✓) |
| **LIÊN QUAN** | ⭐ `DEV-20261006-010` ③ ✓ |

## ## DEC-20261006-013 — ⛔ **KHÔNG KILL `java.exe` CỦA DỰ ÁN KHÁC**
| ⭐ | ⭐ |
|---|---|
| **CATEGORY** | ⭐ `DEVOPS` + ⭐ **Technical Direction** (§36 ✓) |
| **BỐI CẢNH** | ⚠️ Trên máy có **3 tiến trình `java.exe`** ⚠️ — ⭐ 2 trong đó là ⭐ **DỰ ÁN KHÁC**: ⭐ `Phan mem Purchasing\Backend\mep-backend` ⭐ (⭐ `com.mep.mepbackend.MepBackendApplication` ✓) ⚠️ |
| **QUYẾT ĐỊNH** | ⭐ **CHỈ dừng PID đã XÁC MINH `cmdline` chứa `vntech-erp-web`** ✓ — ⛔ **tuyệt đối ⛔ không `Stop-Process` theo TÊN** ⚠️ |
| **VÌ SAO** | ⚠️ `Stop-Process -Name java` sẽ ⭐ **GIẾT ỨNG DỤNG CỦA USER** ⚠️ — ⭐ và ⭐ §36: ⭐ **phải xác định ĐÚNG PID/process trước** ✓ |
| **ĐÃ KIỂM** | ✅ ⭐ 2 tiến trình dự án khác ⛔ **KHÔNG giữ JAR của VNTECH** (⭐ chứng minh bằng **phép thử rename** ✓) |

## ## DEC-20261006-014 — ⛔ **KHÔNG GỘP «DỪNG SERVICE + BUILD + START» VÀO MỘT LỆNH DÀI**
| ⭐ | ⭐ |
|---|---|
| **CATEGORY** | ⭐ `DEVOPS` + ⭐ **Technical Direction** |
| **BỐI CẢNH** | 🚨 ⭐ **MỘT lệnh triển khai BỊ NGẮT GIỮA CHỪNG** ⚠️ ⇒ ⭐ nó đã: ① **DỪNG Java** ⇒ ② **`mvn package` GHI ĐÈ JAR** (⭐ còn **0,1 MB** = dở dang ⚠️) ⇒ ③ **BỊ NGẮT** trước khi build xong + trước khi start lại ⇒ ⭐ ⭐ **Java CHẾT + proxy `:9000` CHẾT** ⚠️✓ |
| **QUYẾT ĐỊNH** | ⭐ ⭐ **LUẬT MỚI**: ⭐ **tách thành các lệnh NGẮN** ✓ ⭐ **hoặc** ⭐ chạy **`run_in_background`** ⭐ để ⛔ **không thể bị ngắt khi hết lượt** ✓ |
| **VÌ SAO** | ⚠️ ⭐ Lệnh bị ngắt ⇒ ⭐ **kết quả KHÔNG RÕ** ⚠️ — ⭐ mà **service đã bị dừng** ⇒ ⭐ **hệ thống chết** ✓ |
| **RỦI RO ẨN KÈM THEO** | 🚨 ⭐ Sau sự cố, ⭐ **JAR trên đĩa = 0,1 MB (HỎNG)** ⚠️ **NHƯNG Java vẫn trả 401 = SỐNG** ⚠️ ⇒ ⭐ nó chạy bằng **CLASSES ĐÃ NẠP TRONG RAM** ⚠️ ⇒ ⭐ ⭐ **NẾU RESTART (hoặc MÁY RESTART) ⇒ ⛔ KHÔNG KHỞI ĐỘNG LẠI ĐƯỢC** ⚠️✓ — ⭐ **ĐÃ KHÔI PHỤC** từ bản lùi **86,8 MB** ✓ |
| **BÀI HỌC** | ⭐ **«Cổng trống» và «API trả 401» ⛔ KHÔNG chứng minh ARTIFACT TRÊN ĐĨA lành** ⚠️ ⇒ ⭐ **PHẢI KIỂM KÍCH THƯỚC/TEM THỜI GIAN của tệp** ✓ |
| **LIÊN QUAN** | ⭐ `EVT-20261006-025/026/027` ✓ · ⭐ `BUG-20261007-001` (⭐ cùng đợt ✓) |

---

## ## Cập nhật bảng đếm CATEGORY (⭐ thay bảng ở dòng 172–180)
| ⭐ Category | ⭐ Số lượng | ⭐ Mã |
|---|---|---|
| ⭐ **DEVOPS** | ⭐ **5** | ⭐ `-001` · `-008` · ⭐ **`-012`** · ⭐ **`-013`** · ⭐ **`-014`** ✓ |
| ⭐ **BACKEND** | ⭐ **1** | ⭐ **`-011`** ✓ |
| ⭐ **Technical Direction** | ⭐ **10** | ⭐ `-001` · `-002` · `-005` · `-006` · `-007` · `-008` · `-009` · ⭐ **`-011`** · ⭐ **`-012`** · ⭐ **`-013`** · ⭐ **`-014`** ✓ |
| ⭐ `FRONTEND` · `RBAC` · `WORKFLOW` · `DATABASE` · `Business Logic` | ⭐ không đổi ✓ |

> ⭐ ⭐ **TỔNG CUỐI: 14 quyết định** ✓
> ⭐ ⭐ **LUẬT QUAN TRỌNG NHẤT ĐƯỢC THÊM**:
> ④ ⭐ **«Cổng trống» ⛔ KHÔNG bảo đảm JAR đã nhả khoá ⇒ PHẢI kiểm bằng PHÉP THỬ RENAME** (`-012`) ✓
> ⑤ ⭐ **⛔ KHÔNG gộp «dừng + build + start» vào MỘT lệnh dài** ⇒ ⭐ **tách lệnh NGẮN** hoặc ⭐ **`run_in_background`** (`-014`) ✓
> ⑥ ⭐ **⛔ KHÔNG kill `java.exe` theo TÊN** — ⭐ **chỉ dừng PID đã xác minh `cmdline`** (`-013`) ✓

---

## ## DEC-20261006-015 — ⛔ **KHÔNG BAO GIỜ GHI VÂN TAY VÀO MIGRATION** (⭐ bẫy vòng lặp vô hạn)
| ⭐ | ⭐ |
|---|---|
| **CATEGORY** | ⭐ `DEVOPS` + ⭐ **Technical Direction** |
| **BỐI CẢNH** | ⭐ Tôi tạo `drizzle/0330_…_identity.sql` để đồng bộ `vntech_product_identity` sau khi sửa mã ⇒ ⭐ **build ĐẠT** ✓ |
| **BẪY** | ⚠️ ⭐ Migration **ghi vân tay của CHÍNH NÓ** ⇒ ⭐ sửa dòng ghi chú trong migration ⇒ ⭐ `drizzle` nằm trong `ROOT_DIRS` ⇒ ⭐ **VÂN TAY ĐỔI** ⇒ ⭐ phải sửa lại migration ⇒ ⭐ **VÒNG LẶP VÔ HẠN** ⚠️ |
| **BẰNG CHỨNG ĐO ĐƯỢC** | ⭐ Chạy `fixpoint-fingerprint` sau khi **xoá** 0330 ⇒ ⭐ vân tay về đúng `e7195a489f98ef32…` (**717 files**) ⭐ ⭐ ⇒ ⭐ ⭐ **CHÍNH LÀ GIÁ TRỊ SAU KHI SỬA MODAL** ⭐ ⭐ ⇒ ⭐ **0330 HOÀN TOÀN KHÔNG CẦN THIẾT** ✓ |
| **QUYẾT ĐỊNH** | ⭐ ⭐ **XOÁ 0330** ⭐ — ⭐ **user chọn** (⭐ hỏi qua `ask_user_question` ✓) ⭐ ⭐ vì CSDL đã đồng bộ đúng (⭐ 4/4 trường KHỚP ✓) ⭐ và `verify-vntech-fingerprint` ĐẠT ✓ |
| **VÌ SAO ĐÚNG** | ⭐ ⭐ **VÂN TAY SAU KHI SỬA MÃ ĐÃ LÀ `e7195a48…`** ⭐ ⭐ ⇒ ⭐ **KHÔNG CẦN** migration nào cả ✓ ⭐ ⭐ Migration chỉ cần khi **CSDL LỆCH** ⭐ ⭐ — ⭐ và khi đó ⭐ **chỉ cần UPDATE 2 bảng metadata** ⭐ ⭐ ⛔ **không cần tệp SQL** ✓ |
| **LUẬT MỚI** | ⭐ ⭐ **⛔ KHÔNG ghi vân tay vào migration** ⭐ ⭐ ⇒ ⭐ **chỉ UPDATE trực tiếp CSDL** (⭐ có BACKUP ✓) ⭐ ⭐ ⇒ ⭐ **tránh vòng lặp vô hạn** ✓ |
| **LIÊN QUAN** | ⭐ `EVT-20261006-032` · ⭐ `CHG-20261006-013` ✓ |

---

## ## Cập nhật bảng đếm CATEGORY (⭐ thay bảng ở dòng 238–240)
| ⭐ Category | ⭐ Số lượng | ⭐ Mã |
|---|---|---|
| ⭐ **DEVOPS** | ⭐ **6** | ⭐ `-001` · `-008` · `-012` · `-013` · `-014` · ⭐ **`-015`** ✓ |
| ⭐ **Technical Direction** | ⭐ **11** | ⭐ `-001` · `-002` · `-005` · `-006` · `-007` · `-008` · `-009` · `-011` · `-012` · `-013` · `-014` · ⭐ **`-015`** ✓ |
| ⭐ `BACKEND` · `FRONTEND` · `RBAC` · `WORKFLOW` · `DATABASE` · `Business Logic` | ⭐ không đổi ✓ |

> ⭐ ⭐ **TỔNG CUỐI: 15 quyết định** ✓
> ⭐ ⭐ **LUẬT MỚI NHẤT**:
> ⑦ ⭐ **⛔ KHÔNG ghi vân tay vào migration** — ⭐ **chỉ UPDATE trực tiếp CSDL** (⭐ có BACKUP ✓) ⇒ ⭐ **tránh vòng lặp vô hạn** (`-015`) ✓

---

## DEC-20261007-016

Date: 2026-10-07
Session: ERP-SESSION-01
Category: RBAC / Phân quyền

**Quyết định:** Xác nhận phân quyền hệ thống hoạt động đúng qua 2 kịch bản test API.

**Ngữ cảnh:**
- Kịch bản 1: Cấp full quyền admin (`module_key=admin`) cho user `e2e.kh` (role=`kh_truong`) → bootstrap trả `admin: canView=1`, 60 modules
- Kịch bản 2: Chỉ cấp 1 tab (`module_key=admin_tab_01`) → bootstrap trả `admin: NOT FOUND`, `admin_tab_01: canView=1`
- Cả 2 đều PASS

**Hệ quả:**
- Phân quyền module-level trong `user_module_permissions` hoạt động đúng
- Bootstrap API trả đúng danh sách module theo quyền đã cấp
- Quyền admin_tab_XX cho phép truy cập từng tab riêng biệt trong Quản trị hệ thống
- Cần phân biệt rõ: `module_key=admin` = toàn quyền admin, `module_key=admin_tab_NN` = quyền 1 tab cụ thể

**Rủi ro:** KHÔNG — phân quyền đã được verify qua CSDL + API

---

## DEC-20261007-018

Date: 2026-10-07
Session: ERP-SESSION-01
Category: RBAC

**Quyết định:** Phát hiện mâu thuẫn phân quyền QTHS qua test UI thật.

**Ngữ cảnh:**
- Kịch 1: Cấp `admin` module perm cho user role=`kh_trường` → nav group hiện nhưng nội dung "CHƯA ĐƯỢC PHÂN QUYỀN"
- Kịch 2: Chỉ cấp `admin_tab_01` → nav group không hiện (đúng hành vi)
- Root cause: `page.tsx:625` dùng `isAdminUser(data.user)` kiểm `role === "admin"`, KHÔNG kiểm `modulePermissions`

**Hệ quả:**
- Phân quyền module-level (`user_module_permissions`) chỉ mở nav group, không mở nội dung
- Nội dung QTHS bị chặn bởi hardcode `isAdminUser` (role-based)
- Cần user quyết định: sửa hay giữ nguyên

**Rủi ro:** User được cấp admin perm nhưng không thể sử dụng ⇒ UX confusion

---

## DEC-20261008-001 — ⏸ CHỜ USER: ai được quyền LƯU bảng phân quyền? (backend chặn theo `role`, UI cho theo quyền module)

| ⭐ | ⭐ |
|---|---|
| **DEC_ID** | DEC-20261008-001 |
| **DATE** | 2026-10-08 10:35:00 |
| **SESSION_ID** | ERP-SESSION-01 (SESSION_A) |
| **LĨNH VỰC** | RBAC · Authorization |
| **TRẠNG THÁI** | ⏸ **CHỜ USER QUYẾT** — ⛔ DSH ⛔ không tự chọn phương án |

### BỐI CẢNH (đo được, ⛔ không suy đoán)
`tools/probe-permission-save-api.mjs` — tạo user probe role `engineer`, admin cấp cho họ quyền
module **`admin`** (bootstrap của chính họ xác nhận CÓ), rồi chính họ gọi `save_user_access`:

```
[B2] User (role≠admin, có quyền «admin») gọi save_user_access:
     HTTP 403 · Thao tác chưa được khai báo quyền trong hệ thống. Liên hệ quản trị viên.
```

### MÂU THUẪN
| Phía | Luật hiện tại | Hệ quả |
|---|---|---|
| **UI** (`app/page.tsx`) | cho MỞ modal phân quyền nếu `isAdminUser` **HOẶC** có `admin_tab_01` **HOẶC** quyền module `admin` | người dùng **thấy** modal, **tick được** |
| **Backend** (`UserManagementUseCase.saveUserAccess:259`) | `rbac.requireRole(principalAsCurrent(principal), List.of("admin"))` — **chỉ role `admin`** | bấm Lưu ⇒ **403**, ⛔ không lưu gì |

⇒ Trải nghiệm: mở được, tick được, bấm Lưu **không lưu** (đúng triệu chứng user báo).
⚠️ Liên quan `BUG-20261007-004` (đang OPEN) — cùng gốc «quyền module vs role» ở `isAdminUser`.

### CÁC PHƯƠNG ÁN (user chọn — DSH ⛔ không tự áp mặc định)

**PA-1 — Nới backend theo QUYỀN MODULE (khớp UI)**
Cho phép ai có quyền module `admin` **hoặc** `admin_tab_01` được gọi `save_user_access`.
✅ Khớp với thứ UI đang cho phép ⇒ hết mâu thuẫn, hết 403.
⚠️ Mở rộng quyền hạn ở tầng nguy hiểm (ghi quyền người khác) ⇒ cần cân nhắc audit.

**PA-2 — Siết UI theo ROLE (khớp backend)**
Chỉ `role === "admin"` mới thấy nút «Lưu»/mở modal phân quyền; người chỉ có quyền module
`admin` chỉ **xem**, ⛔ không sửa.
✅ An toàn nhất, giữ nguyên luật backend. ⚠️ Có thể chặn đúng người user muốn giao việc.

**PA-3 — Giữ nguyên + báo lỗi rõ ràng ở UI**
⛔ Không đổi luật; chỉ đổi UX: nếu role ≠ `admin` thì ẩn/disable nút «Lưu» kèm thông báo
«Chỉ tài khoản có vai trò Quản trị viên được lưu bảng phân quyền».
✅ Rủi ro thấp nhất, ⛔ không đụng authorization. ⚠️ Triệu chứng «không lưu được» vẫn còn.

### KHUYẾN NGHỊ KỸ THUẬT (⛔ không phải quyết định — user vẫn phải chốt)
PA-3 an toàn nhất để ⛔ không mở rộng quyền trong giai đoạn GO-LIVE; PA-1 đúng với ý định UI
hiện tại nhưng là **thay đổi authorization** nên cần user phê duyệt tường minh.

### LIÊN QUAN
- BUG-20261008-001 (nguyên nhân (B)) · BUG-20261007-004 (OPEN, cùng gốc)
- Ghi chú cũ đã có trong mã: `app/screens/Inventory.tsx:259` «backend `saveUserAccess` =
  `requireRole(…, List.of("admin"))`» — ⚠️ nay đã thành mâu thuẫn thật, ⛔ không chỉ là ghi chú.

### HÀNH ĐỘNG CỦA DSH
⛔ **DỪNG** — ⛔ không tự vá (B). Đã ghi log + báo user. Khi user chốt ⇒ thi hành đúng phương án.

## DEC-20261008-001 (KẾT THÚC) — ✅ USER CHỌN **PA-1** + CHỐT NGỮ NGHĨA `role === admin`

| ⭐ | ⭐ |
|---|---|
| **DEC_ID** | DEC-20261008-001 |
| **DATE** | 2026-10-08 11:40:00 |
| **SESSION_ID** | ERP-SESSION-01 (SESSION_A) |
| **TRẠNG THÁI** | ✅ **ĐÃ CÓ QUYẾT ĐỊNH — đã thi hành** (trước đó ⏸ chờ user) |
| **LĨNH VỰC** | RBAC · Authorization |

### USER CHỌN: **PA-1** — nới backend theo QUYỀN MODULE (khớp UI hiện tại)

### 📍 USER CHỐT NGỮ NGHĨA `role === "admin"` (nguyên văn — dùng làm chuẩn cho mọi việc sau)
> «role === admin thì có nghĩa là user đó có **toàn quyền và override toàn bộ phân quyền**, là user có
> khả năng **vượt qua mọi quyền mà không cần cấu hình**, user có role === admin là **quản trị hệ thống
> chỉ được sử dụng trong trường hợp đặc biệt** ngoài ra khi không có việc gì quan trọng thì quản trị hệ
> thống sẽ sử dụng tài khoản **ITM** hoặc tài khoản tương tự **được cấp full quyền**.»

⇒ **HỆ QUẢ THIẾT KẾ (chuẩn để tra cứu về sau):**
| | `role === "admin"` | Tài khoản thường được cấp quyền (vd **ITM**) |
|---|---|---|
| Bản chất | **Break-glass** — toàn quyền, override, ⛔ không cần cấu hình | Quyền đến **TỪ CẤU HÌNH** (`user_module_permissions`) |
| Khi nào dùng | **Trường hợp đặc biệt** | **Việc thường ngày** |
| Cách cấp | Có sẵn theo role | Cấp qua ma trận phân quyền |

✅ **PA-1 khớp đúng mô hình này**: quyền phải đến từ **CẤU HÌNH**, ⛔ không chỉ từ `role`
⇒ một tài khoản kiểu ITM được cấp `admin_tab_06` **PHẢI** lưu được bảng phân quyền.
✅ Đúng với tài liệu thiết kế đã có: `docs/dsh-state/CHECKLIST.md:1318` — «"Phân quyền công việc /
Chức năng" ⇒ `admin_tab_06` (Tab 06) **hoặc** `role=admin`».

### ĐÃ THI HÀNH
`CHG-20261008-002` — sửa **3 tầng** (registry · use-case · controller) theo đúng khuôn `update_user`
(MỐC 103/109). Đo: **EXIT 0** (`TEST-20261008-003`). ⛔ Không migration, ⛔ không đổi hợp đồng API.

---

## DEC-20261008-002 — ⏸ **CHỜ USER**: PA-1 mở đường **tự leo thang tới `factory_reset_execute`** — có chặn không?

| ⭐ | ⭐ |
|---|---|
| **DEC_ID** | DEC-20261008-002 |
| **DATE** | 2026-10-08 11:50:00 |
| **SESSION_ID** | ERP-SESSION-01 (SESSION_A) |
| **TRẠNG THÁI** | ⏸ **CHỜ USER QUYẾT** — ⛔ DSH ⛔ không tự chọn |
| **LĨNH VỰC** | RBAC · BẢO MẬT |

### VẤN ĐỀ (chi tiết + bằng chứng mã: `BUG-20261008-002`)
Người có `admin_tab_06` (sau PA-1) **tự cấp cho mình module `admin`** ⇒ gọi được
`factory_reset_execute` (**XOÁ SẠCH DỮ LIỆU**), ⛔ không cần admin can thiệp.

### PHƯƠNG ÁN (user chọn)
| PA | Nội dung |
|---|---|
| **S-1** | Chặn **tự** nâng quyền: non-admin ⛔ không được gửi khoá `admin` (+ `admin_tab_12/13/14`) khi lưu quyền |
| **S-2** | ⛔ Không chặn — coi `admin_tab_06` là quyền quản trị cấp cao (khớp mô hình ITM full quyền) |
| **S-3** | Siết ở ĐÍCH: `factory_reset_execute/preview` đổi cổng sang **`role = admin`** (thêm `requireRequireAdmin`) |

### ⛔ HÀNH ĐỘNG CỦA DSH
🚨 Đã **BÁO ĐỘNG Telegram CRITICAL** + ghi `BUG-20261008-002` + dòng 9 bảng điều khiển `SESSION_C/README.md`.
⛔ **DỪNG** — ⛔ không tự thêm guard (là **chính sách phân quyền**, có thể xung đột mô hình ITM của user).
Khi user chốt ⇒ thi hành đúng phương án + đo lại + hồi quy.

## DEC-20261008-003 — ⏸ CHỜ USER: có cho **uỷ quyền khu «Quản lý hệ thống» từ giao diện** không?

| ⭐ | ⭐ |
|---|---|
| **DEC_ID** | DEC-20261008-003 |
| **DATE** | 2026-10-08 12:25:00 |
| **SESSION_ID** | ERP-SESSION-01 (SESSION_A) |
| **LĨNH VỰC** | RBAC · UI/UX · Chính sách cấp quyền |
| **TRẠNG THÁI** | ⏸ **CHỜ USER QUYẾT** — ⛔ DSH ⛔ không tự chọn |
| **PHÁT SINH TỪ** | Yêu cầu test E2E của user 08/10/2026 → `TEST-20261008-004` · `BUG-20261008-003` |

### CÂU HỎI
User yêu cầu: «cấp 1 quyền cho user bất kì thông qua modal Phân quyền công việc / chức năng sau đó
vào tài khoản của user đó thực hiện **truy cập vào quản lý hệ thống**».
📏 **ĐO ĐƯỢC: hiện ⛔ KHÔNG THỂ** — ma trận **75 dòng** (14 `admin_tab_NN` + 61 module nghiệp vụ)
**⛔ KHÔNG có dòng cho module `admin`**, mà menu «QUẢN TRỊ HỆ THỐNG» lại **chỉ** hiện khi có
**module `admin`** (`app/page.tsx:486-487`).
⇒ **Cần user quyết**: khu quản trị có được **uỷ quyền bằng cấu hình** hay ⛔ chỉ role `admin`?

### 3 PHƯƠNG ÁN
| PA | Nội dung |
|---|---|
| **M-1** | **Thêm dòng module `admin` («Danh mục & phân quyền») vào ma trận** ⇒ cấp được quyền vào khu quản trị |
| **M-2** | **Đổi luật MENU**: cho `admin_tab_NN` cũng làm hiện nhóm «QUẢN TRỊ HỆ THỐNG» (cấp Tab 06 là vào được) |
| **M-3** | **Giữ nguyên**: khu quản trị ⛔ chỉ `role = admin`; ⛔ không uỷ quyền qua UI |

### ⚠️ QUAN TRỌNG — QUYẾT **CÙNG LÚC** VỚI `DEC-20261008-002`
`BUG-20261008-002` (🚨 CRITICAL): người có `admin_tab_06` **tự cấp module `admin`** ⇒ gọi được
`factory_reset_execute` (**XOÁ DỮ LIỆU**). Chọn **M-1** mà ⛔ không xử lý `BUG-20261008-002` thì
**mở rộng** đường leo thang đó ra giao diện. ⇒ ⭐ **nên quyết 2 việc này cùng nhau.**

### HÀNH ĐỘNG CỦA DSH
⛔ **DỪNG** — đã ghi `BUG-20261008-003` + dòng 10 bảng điều khiển + báo user kèm bằng chứng đo.
Khi user chốt ⇒ thi hành đúng phương án + đo lại E2E + hồi quy.

## DEC-20261008-002 (KẾT THÚC) — ✅ USER CHỌN **S-1**: chặn TỰ NÂNG QUYỀN (⛔ trừ `role=admin`)

| ⭐ | ⭐ |
|---|---|
| **DEC_ID** | DEC-20261008-002 |
| **DATE** | 2026-10-08 14:00:00 |
| **SESSION_ID** | ERP-SESSION-01 (SESSION_A) |
| **TRẠNG THÁI** | ✅ **ĐÃ CÓ QUYẾT ĐỊNH — đã thi hành + VERIFIED** |
| **LĨNH VỰC** | RBAC · BẢO MẬT |

### 📍 USER CHỐT (nguyên văn)
> «1. chặn tự nâng quyền cho mình, ngoại lệ chỉ có tài khoản ADMIN thích làm gì thì làm.»

⇒ **LUẬT**: người gọi ⛔ **KHÔNG** phải `role = admin` thì ⛔ **không được CẤP THÊM** quyền cho **CHÍNH MÌNH**.
⭐ VẪN CHO PHÉP: sửa quyền người KHÁC · **thu hồi** quyền của mình · **giữ nguyên** quyền đang có
⇒ chỉ chặn chiều **ĐI LÊN**, ⛔ không chặn chiều đi xuống ✓
⭐ **NGOẠI LỆ**: `role = admin` ⛔ không bị ràng buộc gì (đúng mô hình break-glass ở `DEC-20261008-001`).

### ĐÃ THI HÀNH
`CHG-20261008-003` — 2 tệp backend, đặt chốt **TRƯỚC** `clearUserScopes()` (bài học MỐC 111).
📏 Đo 3 chiều (`TEST-20261008-005`): B4 tự cấp `admin` ⇒ **403** · B5 giữ nguyên ⇒ **200** · B6 cấp người khác ⇒ **200**.

---

## DEC-20261008-003 (KẾT THÚC) — ✅ USER CHỌN **M-2**: ≥1 quyền trong nhóm quản trị ⇒ HIỆN menu

| ⭐ | ⭐ |
|---|---|
| **DEC_ID** | DEC-20261008-003 |
| **DATE** | 2026-10-08 14:00:00 |
| **SESSION_ID** | ERP-SESSION-01 (SESSION_A) |
| **TRẠNG THÁI** | ✅ **ĐÃ CÓ QUYẾT ĐỊNH — đã thi hành + VERIFIED** |
| **LĨNH VỰC** | RBAC · UI/UX menu |

### 📍 USER CHỐT (nguyên văn)
> «2. check xem user chỉ cần có 1 quyền trong nhóm quản trị thì sẽ hiện menu quản trị»

### ⭐ ĐÂY ⛔ KHÔNG PHẢI LUẬT MỚI — LÀ **Ý ĐỊNH GỐC MỐC 118** (user 01/10/2026, nguyên văn):
> «ẩn menu quản trị hệ thống đối với tất cả các user không được cấp bất cứ 1 quyền nào trong nhóm phân
>  quyền hệ thống … **kể cả 1 quyền cũng hiển thị menu**.»
📌 Bản cũ làm **CHƯA ĐỦ**: `systemAdminMenuVisible` chỉ xét `configuredModules(data)` = **MẢNG MENU TĨNH**,
mà 14 khoá `admin_tab_NN` ⛔ **KHÔNG** nằm trong đó (MỐC 31 đã bỏ 14 menu con khỏi menu) ⇒ cấp bao nhiêu
`admin_tab_NN` cũng ⛔ không hiện menu. 📏 ĐO: `TEST-20261008-004` (`nav groups` thiếu `system_admin`).

### ĐÃ THI HÀNH — **3 CỔNG** (⛔ phải đủ cả 3 mới dùng được, đo từng cổng một)
| # | Vị trí | BEFORE | AFTER |
|---|---|---|---|
| ① | `page.tsx` `systemAdminMenuVisible` | chỉ `configuredModules` (thiếu `admin_tab_NN`) | ➕ bộ đếm `hasAnyAdminGroupPermission` (nhận `admin` **VÀ** `admin_tab_NN`) |
| ② | `page.tsx` `accessDenied` (nhánh `admin`) | `!isAdminUser(...)` = **CHỈ role** | `!isAdminUser && !hasAnyAdminGroupPermission` |
| ③ | `page.tsx` render `<Admin …/>` | `active==="admin" && isAdminUser(...)` = **CHỈ role** | ➕ `\|\| hasAnyAdminGroupPermission` |

⚠️ Sửa ① mà ⛔ không sửa ②③ ⇒ **menu hiện nhưng thân màn TRỐNG** (⭐ đã ĐO THẬT: 0 tab · 238 ký tự · không
có `.permission-steps`) ⇒ ghi lại làm bài học (D-096).

### ⛔ GIỮ NGUYÊN (⛔ không nới)
`ADMIN_LOCKED_TABS` / tab **12 · 13 · 14** vẫn **CHỈ `role = admin`** — trong đó tab 12 có
`FactoryResetAdmin` (**XOÁ DỮ LIỆU**) ⇒ ⛔ không hạ rào ✓

## DEC-20261008-004 — ⏸ CHỜ USER QUYẾT: có áp **chính sách PA-1** cho **33 chốt quyền** còn lại ở backend không?

| ⭐ | ⭐ |
|---|---|
| **DEC_ID** | DEC-20261008-004 · **DATE** 2026-10-08 19:50 |
| **TRẠNG THÁI** | ⏸ **CHỜ USER** — ⛔ DSH không tự đổi (là **chính sách phân quyền**) |
| **LĨNH VỰC** | RBAC · BACKEND · mô hình «uỷ nhiệm bằng cấu hình» |

### 📏 ĐO ĐƯỢC — cùng lớp bug với `BUG-006/008/009` nhưng ở **TẦNG API**
Quét `java-backend/**` (⛔ trừ `target/`): có **~60 chỗ** `rbac.requireRole(principal, List.of("admin"))`.
Trong **nhóm S01**, hai use-case chiếm **33 chỗ**:
| Use-case | Số hàm | Danh sách |
|---|---|---|
| **`UserManagementUseCase`** | **15** | `createUser` · `deleteUser` · `resetUserPassword` · `setUserStatus` · `setUserSystemLevel` · `saveRoleCatalog` · `setRoleStatus` · `deleteRoleCatalog` · `saveSystemLevel` · `setSystemLevelStatus` · `deleteSystemLevel` · `saveDepartmentPermission` · `deleteDepartmentPermission` · `rebuildDepartmentPermissions` · `deleteUserModuleOverride` |
| **`AdminSystemUseCase`** | **18** | `saveOrganizationUnit` · `setOrganizationUnitStatus` · `saveMenuGroup` · `setMenuGroupStatus` · `deleteMenuGroup` · `saveModuleCatalog` · `setModuleStatus` · `saveFormFieldConfig` · `deleteFormFieldConfig` · `reorderFormFields` · `reorderMenuLayout` · `saveBusinessScope` · `setBusinessScopeStatus` · `deleteBusinessScope` · `saveBusinessRoleGroup` · `setBusinessRoleGroupStatus` · `deleteBusinessRoleGroup` · `saveEngineRoleProfile` |

⚠️ **HỆ QUẢ** (⭐ cùng một họ với 5 bug FE đã vá): người được uỷ nhiệm `admin_tab_01` (Tài khoản) ·
`admin_tab_02` (Tổ chức) · `admin_tab_03` (Chức danh/vai trò) … vẫn nhận **HTTP 403** vì tầng use-case
**khoá cứng `role = admin`** ⇒ ⭐ **mô hình «uỷ nhiệm bằng cấu hình» bị chặn ở API**, ⛔ dù UI đã cho vào ✓

### 🔎 ĐỐI CHIẾU TIỀN LỆ (⭐ chính user đã quyết ca này rồi)
`DEC-20261008-001` ⇒ **USER CHỐT PA-1**: «`role === admin` … chỉ dùng trong **trường hợp đặc biệt**; việc
thường ngày dùng tài khoản ITM **được cấp full quyền**» ⇒ đã bỏ `requireRole(List.of("admin"))` ở
`saveUserAccess` và thay bằng **quyền cấu hình** (`admin_tab_06` + `canView`) ✓
`SystemController:419` ghi rõ: «② `UserManagementUseCase.saveUserAccess` `requireRole(…, List.of("admin"))` — **ĐÃ SỬA**»
⇒ ⭐ **33 chỗ còn lại là CÙNG một lớp** — hiện **chưa ai xử lý** ✓

### 3 PHƯƠNG ÁN
| PA | Nội dung |
|---|---|
| **B-1** | ⭐ **Áp PA-1 cho cả 33 hàm**: bỏ `requireRole(admin)`, để tầng ① (`ActionRbacRegistry` — đã khai module/`admin_tab_NN`) quyết định. ⚠️ Kèm rà từng action xem registry đã khai module CHƯA (⛔ chỗ nào `List.of()`/`List.of("admin")` thì phải khai bổ sung) |
| **B-2** | **Áp có chọn lọc**: chỉ 5 hàm thuộc 3 tab đang dùng thật (`admin_tab_01/02/03`) — ⛔ giữ admin-only cho các hàm còn lại |
| **B-3** | **Giữ nguyên 33 chốt** — ⭐ mọi thao tác cấu hình hệ thống vẫn **chỉ `role=admin`**, ⛔ không uỷ nhiệm được |

### ⚠️ RỦI RO NẾU CHỌN B-1 (⭐ phải nói rõ)
33 thao tác này gồm cả **`deleteUser` · `resetUserPassword` · `deleteRoleCatalog`** ⚠️ ⇒ mở theo cấu hình nghĩa là
**người có tab tương ứng XOÁ được tài khoản / đổi mật khẩu người khác** ⇒ ⭐ phải chắc `admin_tab_01` chỉ cấp cho
người thật sự tin cậy (⭐ đúng tinh thần «ITM được cấp full quyền» của user, ⚠️ nhưng cần user xác nhận) ✓

### HÀNH ĐỘNG CỦA S01
⛔ **DỪNG** — đã đo, đã liệt kê đủ 33 hàm, ⛔ **không tự đổi** (bài học `BUG-20261008-002`: tự thêm/bỏ chốt quyền
mà không hỏi là **vượt quyền quyết định**). Chờ user chốt B-1/B-2/B-3 ⇒ thi hành + viết cổng hợp đồng như PA-1.

## DEC-20261008-004 (ĐÍNH CHÍNH) — ❌ **RÚT LẠI**: 33 chốt quyền backend **NHẤT QUÁN**, ⛔ **KHÔNG phải bug**, ⛔ **không cần quyết**

| ⭐ | ⭐ |
|---|---|
| **DEC_ID** | DEC-20261008-004 · **TRẠNG THÁI** ❌ **WITHDRAWN (rút lại)** — thay bằng kết luận đo được dưới đây |
| **DATE** | 2026-10-08 20:10 · **SESSION** ERP-SESSION-01 |
| **NGUYÊN NHÂN RÚT** | ⭐ **S01 ĐÃ BÁO ĐỘNG SAI** — đếm số cổng mà ⛔ chưa đối chiếu **tầng đối diện** |

### ⚠️ SAI Ở ĐÂU (⭐ ghi để ⛔ không lặp)
Tôi thấy **~60 chỗ** `requireRole(…, List.of("admin"))` và **kết luận vội** rằng «33 chốt ở nhóm tôi là cùng lớp `PA-1` ⇒ uỷ nhiệm bị chặn ở API» ⛔
⇒ ⭐ **THIẾU BƯỚC ĐỐI CHIẾU**: phải xem `ActionRbacRegistry` khai gì cho **cùng action**, vì
**mảng rỗng `List.of()` = default-DENY** (PHASE 0B) ⇒ ⭐ **tầng ① cũng đã chặn y hệt** ⇒ hai tầng **NHẤT QUÁN** ✓

### 📏 ĐO LẠI — bảng ánh xạ đầy đủ 33 hàm → action → registry
| Kết luận | Số hàm | Ý nghĩa |
|---|---|---|
| ✅ **NHẤT QUÁN** (`registry = []` ⇒ default-DENY, khớp `requireRole(admin)`) | **31** | `create_user` · `delete_user` · `reset_user_password` · `set_user_status` · `save_role_catalog` · `save_system_level` · `save_organization_unit` · `save_menu_group` · `save_module_catalog` · `save_form_field_config` · `save_business_scope` · `save_business_role_group` · `save_engine_role_profile` … ⭐ **cố ý admin-only ✅** |
| ✅ **NHẤT QUÁN ở CẢ 3 TẦNG** | **2** | `save_department_permission` · `rebuild_department_permissions` — 📏 kiểm trực tiếp: `SystemController:440/:450` dùng **`requireRequireAdmin`** (tầng ②) + use-case `requireRole(admin)` (tầng ③) + **⛔ không khai registry** ⇒ tầng ① default-DENY ⇒ ⭐ admin-only **cả 3 tầng** ✓ |
| ⚠️ Lệch thật | **0** | 🎯 **⛔ KHÔNG có** |

⇒ ⭐ **B-3 («giữ nguyên») CHÍNH LÀ HIỆN TRẠNG** ⇒ ⛔ **không cần user quyết gì**, ⛔ **không sửa gì** ✓

### 📌 LUẬT RÚT RA (D-099) — ⭐ QUAN TRỌNG
> **Một chốt quyền chỉ là «THỪA/LỆCH» khi tầng ĐỐI DIỆN sẽ CHO PHÉP lời gọi đó.**
> ⭐ **ĐẾM SỐ CỔNG ⛔ không đủ** — phải **đối chiếu TỪNG CẶP** (chốt role ⇄ khai báo module của cùng action) ✓
> ⚠️ Ngược lại với `PA-1`: ở đó registry khai **`admin_tab_06`** (⇒ tầng ① **CHO PHÉP**) mà use-case vẫn `requireRole(admin)` ⇒ ⭐ **mới thật sự chặn oan** ✓

### ✅ VIỆC ĐÃ LÀM ĐÚNG (⛔ không uổng)
⭐ **S01 ⛔ đã KHÔNG tự sửa 33 chốt quyền** khi chưa đủ căn cứ ⇒ ⭐ nếu đã sửa thì **đã hạ rào 31 thao tác quản trị hệ thống** (⚠️ `delete_user` · `reset_user_password` · `delete_role_catalog`) ⛔ mà ⛔ không có căn cứ nào ✓
📌 Tinh thần §41 («SAFE · SMALL · ISOLATED») + bài học `BUG-20261008-002` đã giữ đúng ✓

## DEC-20261008-014 — 🔴 **ĐO LẠI CẢNH BÁO «THỔI PHỒNG TIẾN ĐỘ»**: lựa chọn **(b) khôi phục MT3 LÀ BẤT KHẢ THI** (đo được, ⛔ không suy đoán)

| ⭐ | ⭐ |
|---|---|
| **DEC_ID** | DEC-20261008-014 · **DATE** 2026-10-09 · **SESSION** ERP-SESSION-01 · **CATEGORY** TECHNICAL DIRECTION |
| **BỐI CẢNH** | `docs/agent-progress/MASTER_STATUS.md` (L60+) mang **CẢNH BÁO TIẾN ĐỘ** từ 01/10/2026: con số **108/110 (98,2%)** «đang THỔI PHỒNG, CHƯA CHỐT» + ⚠️ **chờ user chốt (a)/(b)** |
| **VẤN ĐỀ** | ⚠️ Cảnh báo đó **chưa từng được đưa tới user** trong các phiên gần đây ⇒ ⛔ **quyết định treo nhiều ngày** trong khi nó ảnh hưởng **con số tiến độ chính thức của dự án** ✓ |

### 📏 ĐO LẠI HÔM NAY (⭐ mọi con số đều chạy lại được)
| # | Phép đo | Kết quả | Ý nghĩa |
|---|---|---|---|
| 1 | `node tools/probe-roadmap-progress.mjs` (đọc **nguyên văn cột TT** của `docs/25_TODO_ROADMAP.md`) | **DONE 108/110 (98,2%)** · BLOCKED 1 · TODO 1 | ⭐ **cổng ⛔ KHÔNG hỏng**, nó chỉ **chép lại lời khai của roadmap** ⇒ ⚠️ «thổi phồng» nằm ở **CỘT TT**, ⛔ không ở cổng |
| 2 | `tests/*.test.mjs` | **158 tệp** (trước 01/10: **119**) | ⭐ số test **đã tăng mạnh** ⇒ cảnh báo cũ «chỉ chạy 14 tệp» **đã cũ** |
| 3 | `KNOWN_RED` | **8 tệp — ⭐ TẤT CẢ đều là MT3** (7 ghi rõ `MT3-*` + `p2-d4-approval-timeline` mang dấu `MT3-B.2`) | ⭐ lỗ hổng **HẸP và ĐỊNH DANH ĐƯỢC** = **đúng 8 tệp test** ✓ |
| 4 | `git log --oneline unity..backup/mt3-head-20260928` | **0 commit** | 🔴 **MT3-head là TỔ TIÊN của `unity`** ⇒ ⛔ **không có gì để khôi phục** |
| 5 | `git diff --shortstat unity...backup/mt3-head-20260928` | **rỗng (0 thay đổi)** | 🔴 khôi phục nhánh đó **⛔ KHÔNG ĐỔI GÌ** ⇒ ⭐ **lựa chọn (b) là NO-OP** |
| 6 | `git log --oneline backup/mt3-head..unity` | unity **đi trước 58 commit** | unity đã tiến rất xa (MỐC 117–126) |
| 7 | `git cat-file -e backup/mt3-head:lib/material-alias.ts` | **CÓ** (và **cũng CÓ** ở `unity`) | ⚠️ tệp mà test `mt3-be-05-material-alias-search` cần **ĐÃ CÓ** ⇒ test đó đỏ vì **lý do KHÁC**, ⛔ không phải «thiếu tệp do rollback» ✓ |
| 8 | `backup/mt3-worktree-20260928` | **1 commit** duy nhất phía MT3 (ảnh chụp worktree) | ⭐ đây là **thứ DUY NHẤT** khác `unity` — cần soi riêng nếu muốn ✓ |

### 🎯 KẾT LUẬN (⭐ đổi hẳn khung quyết định)
1. 🔴 **Lựa chọn (b) — «khôi phục UI MT3 từ `backup/mt3-head-20260928`» — ⛔ BẤT KHẢ THI**: nhánh đó **⛔ không chứa commit nào** mà `unity` chưa có ⇒ khôi phục = **⛔ không làm gì** ✓
2. ⚠️ **Lựa chọn (a) — «đánh lại các mục MT3 là CHƯA LÀM»** — vẫn **đúng hướng nhưng ⛔ KHÔNG nên làm hàng loạt**: ⭐ nay biết **chính xác 8 tệp test** đại diện cho lỗ hổng ⇒ chỉ cần rà **8 tệp đó** ⇒ ánh xạ sang **đúng số mục roadmap** liên quan (⚠️ **⛔ không phải toàn bộ MT3**) ✓
3. ⭐ **CÁCH LÀM ĐỀ XUẤT (mới) — (c)**: **rà TỪNG tệp trong 8 tệp `KNOWN_RED`** để phân định: ① tệp đỏ vì **tính năng thiếu thật** ⇒ đánh lại mục roadmap tương ứng = CHƯA LÀM ✓ ② tệp đỏ vì **lý do khác** (⚠️ đã có bằng chứng: `material-alias.ts` **có mặt**) ⇒ **sửa được ngay** ✓
   ⇒ ⭐ Việc này **nhỏ, đo được, ⛔ không phá gì** — ⛔ khác hẳn rủi ro «merge lại 1 tháng mã» mà cảnh báo cũ lo ✓

### 📌 BÀI HỌC **D-107**
> ⚠️ **Một «lựa chọn chờ user chốt» có thể ĐÃ HẾT HIỆU LỰC** nếu mã đã tiến hoá ⇒ ⭐ **trước khi hỏi lại user, hãy ĐO LẠI tiền đề của câu hỏi** ✓
> ⛔ Đừng để một quyết định treo nhiều ngày vì **tiền đề của nó đã sai** ✓

## DEC-20261008-015 — 🛑 **USER CHỐT: MT3 ĐÃ ROLLBACK ⇒ TỪ NAY ⛔ KHÔNG LẤY MT3 LÀM CĂN CỨ CHO CÔNG VIỆC SẮP TỚI** (đóng hẳn câu hỏi (a)/(b) đang treo)

| ⭐ | ⭐ |
|---|---|
| **DEC_ID** | DEC-20261008-015 · **DATE** 2026-10-09 · **SESSION** ERP-SESSION-01 · **CATEGORY** TECHNICAL DIRECTION |
| **NGUỒN** | ⭐ **QUYẾT ĐỊNH CỦA USER** (nguyên văn): «**MT3 đã rollback không lấy MT3 làm căn cứ cho công việc sắp tới nữa**» ✓ |
| **PHẠM VI** | ⛔ **ĐÓNG** toàn bộ nhánh công việc liên quan MT3 · ⛔ **KHÔNG** khôi phục MT3 · ⛔ **KHÔNG** lấy 8 tệp test MT3 làm danh sách việc |

### ✅ HỆ QUẢ (⭐ áp NGAY, ⛔ không cần bàn lại)
1. 🛑 **Câu hỏi (a)/(b) trong `MASTER_STATUS.md` được ĐÓNG**: ⛔ **không** «đánh lại mục MT3 để làm tiếp», ⛔ **không** «khôi phục UI MT3» ✓
   ⭐ Và thực tế **(b) vốn đã bất khả thi** — đo được: `git log unity..backup/mt3-head-20260928` = **0 commit** · `git diff --shortstat unity...<nhánh>` = **rỗng** ✓
2. 🧊 **8 tệp `KNOWN_RED` = NỢ CŨ ĐÓNG BĂNG** (MT3): giữ trong danh sách để cổng ⛔ **không giấu nợ mới**, ⚠️ nhưng ⛔ **KHÔNG** là «việc cần làm» và ⛔ **KHÔNG** là căn cứ cho công việc sắp tới ✓
3. ⛔ **KHÔNG** dùng mã `MT3-*` (MT3-BE-05 · MT3-UI-04/12d/13/14/25/28 · MT3-B.2) làm tiêu chí nghiệm thu hay lộ trình ✓
4. ⭐ **Con số tiến độ 108/110 (98,2%)**: giữ nguyên nghĩa «**theo lời khai cột TT của roadmap**» — ⚠️ và nay **⛔ không còn bị coi là «đang chờ xử lý MT3»** nữa ✓
5. ⚠️ **Nếu một hành vi MT3 được nhắc lại vì lý do NGHIỆP VỤ khác** (⭐ vd user yêu cầu trực tiếp tính năng đó) ⇒ ⭐ **làm như TÍNH NĂNG MỚI**, ⛔ **không** vin vào «khôi phục MT3» ✓

### 📏 BẰNG CHỨNG KÈM (⭐ đo 09/10/2026, chạy lại được)
| # | Phép đo | Kết quả |
|---|---|---|
| 1 | `git log --oneline unity..backup/mt3-head-20260928` | **0 commit** ⇒ ⛔ không có gì để khôi phục |
| 2 | `git diff --shortstat unity...backup/mt3-head-20260928` | **rỗng** ⇒ khôi phục = **⛔ không đổi gì** |
| 3 | `git log --oneline backup/mt3-head..unity` | unity **đi trước 58 commit** |
| 4 | `tests/*.test.mjs` | **158 tệp** (cảnh báo 01/10 nói «119 tệp, chạy 14» ⇒ **đã cũ**) |
| 5 | `KNOWN_RED` | **8 tệp — TẤT CẢ là MT3** ⇒ lỗ hổng **hẹp, đã đóng băng** ✓ |
| 6 | Chạy 8 tệp bằng `node --import tsx --test` | ⚠️ **7/8 tệp đỏ vì KỲ VỌNG MT3** (vd «phải dùng CƠ CHẾ DÙNG CHUNG §14», «nhóm warehouse chỉ 1 mục ⇒ KHÔNG được bật tab», «MT3 §B.2: bình luận không được hiện trực tiếp trên tiến trình») ⇒ ⭐ **đều là đặc tả MT3**, ⛔ không phải lỗi sản phẩm hiện tại ✓ |
| 7 | Lý do ghi cho `mt3-be-05` trong cổng | ⚠️ **SAI**: cổng ghi «`lib/material-alias.ts` **chỉ tồn tại ở nhánh MT3**» — ⭐ **đo lại: tệp CÓ ở CẢ HAI nhánh** ⇒ lý do đúng là **thiếu HÀNH VI alias**, ⛔ không phải thiếu tệp ✓ |

### 📌 BÀI HỌC **D-108**
> 🛑 **Một đợt đã ROLLBACK thì phải ĐÓNG HẲN trong state** — ⚠️ nếu để nó nằm mãi trong danh sách nợ/kế hoạch thì
> **mọi phiên sau đều tưởng đó là việc phải làm** ⇒ ⭐ tốn công rà lại và **dễ kéo dự án quay về hướng đã bị bỏ** ✓
> ⭐ Ghi rõ **«ĐÓNG BĂNG — ⛔ không lấy làm căn cứ»** ngay cạnh danh sách nợ ✓

## DEC-20261008-016 — 🛑 **CHỈ ĐẠO CỦA USER: MASTER TASK 1 & 2 ĐÃ XONG ⇒ ⛔ KHÔNG RÀ SOÁT LẠI · CÔNG VIỆC NAY DO USER GIAO TRỰC TIẾP**

| ⭐ | ⭐ |
|---|---|
| **DEC_ID** | DEC-20261008-016 · **DATE** 2026-10-09 · **SESSION** ERP-SESSION-01 · **CATEGORY** TECHNICAL DIRECTION |
| **NGUỒN** | ⭐ **CHỈ ĐẠO CỦA USER** (nguyên văn): «**Master task 1 và 2 đã được đánh dấu là đã xong không rà soát lại nữa, công việc hiện tại được giao việc trực tiếp bởi** [user]» ✓ |

### 🎯 HỆ QUẢ (⭐ áp NGAY)
1. 🛑 **MASTER TASK 1 & 2 = ĐÓNG**: ⛔ **KHÔNG** rà soát lại · ⛔ **KHÔNG** đối chiếu tiến độ · ⛔ **KHÔNG** đánh lại trạng thái mục · ⛔ **KHÔNG** lấy roadmap/`MASTER_STATUS`/danh sách 110 mục làm nguồn chọn việc ✓
2. 🎯 **NGUỒN CÔNG VIỆC DUY NHẤT = USER GIAO TRỰC TIẾP** ⇒ ⛔ **DỪNG** cơ chế «tự tìm việc kế tiếp từ backlog» (§46 bước «FIND NEXT TASK») khi ⛔ chưa có chỉ định của user ✓
3. ⛔ **KHÔNG tự nhận** các loại việc sau nếu user ⛔ chưa giao: rà cổng đỏ cũ · dọn nợ kỹ thuật · đối chiếu tài liệu–mã · kiểm kê tiến độ · rà `KNOWN_RED`/MT3 ✓
4. ✅ **VẪN LÀM NGAY** (⛔ không cần chờ giao): ① việc user giao trực tiếp ② **bug CRITICAL/HIGH do user báo** ③ sửa hậu quả do chính phiên này gây ra ④ cập nhật **state/log** theo quy trình ✓

### 📏 VIỆC ĐANG LÀM DỞ — ĐÃ DỪNG THEO CHỈ ĐẠO (⭐ ghi lại kết quả đo để ⛔ không mất công)
Trước chỉ đạo, S01 đang rà 2 cổng RBAC đỏ. **Kết quả đo đã có** (⭐ ghi lại, ⛔ không tiếp tục):
| # | Cổng | Kết quả đo | Phân định |
|---|---|---|---|
| 1 | `tools/probe-action-module-parity.mjs` | **68 điểm lệch** (capability khớp **184/215**) — phần lớn là **LỆCH CAPABILITY**: JS cũ dùng **`canUse`**, Java dùng **`canCreate`/`canEdit`/`canApprove`/`canView`** | ⚠️ Java **chi tiết hơn** (siết đúng thao tác) ⇒ **khác biệt có chủ đích của bản viết lại**, ⛔ không phải lỗi mới ✓ |
| 2 | `tools/probe-catalog-drift.mjs` | **7 action «CHƯA BIẾT»**: `error_reports` · `manage_contract_review` · `mark_error_report_resolved` · `request_supplement` · `save_error_report` · `save_warehouse` · `set_warehouse_status` | ✅ **ĐÃ KIỂM TẬN NƠI**: **CẢ 7 action đều khai ĐỦ `module` + `capability`** trong `ActionRbacRegistry` (vd `save_warehouse` → `List.of("inventory","central_warehouse")` + `canEdit`) ⇒ ⛔ **KHÔNG có lỗ hổng an ninh**, chỉ là **chưa khai vào danh sách Java-only đã biết** ✓ |

⇒ ⭐ **KẾT LUẬN**: 2 cổng đỏ đó **⛔ không phải rủi ro an ninh**; việc còn lại chỉ là **sổ sách** (khai 7 action vào danh sách Java-only) ⇒ 🛑 **DỪNG** theo chỉ đạo, ⛔ không làm tiếp khi chưa được giao ✓

### 📌 BÀI HỌC **D-109**
> 🎯 Khi user chuyển sang **«giao việc trực tiếp»** thì **nguồn chọn việc đổi hẳn** —
> ⛔ đừng tiếp tục «công nhân tự chọn mục kế tiếp» từ backlog, ⚠️ vì như vậy là **làm việc user ⛔ không yêu cầu** và **dễ đụng vùng đã đóng** ✓
> ⭐ Vẫn **giữ nguyên** nghĩa vụ: bug CRITICAL do user báo · sửa hậu quả do mình gây · cập nhật state/log ✓

## DEC-20261009-017 — 🛑 **CHỜ USER QUYẾT: BUILD UI cần ĐỔI VÂN TAY SẢN PHẨM** (⛔ S01 không tự làm)

| Trường | Nội dung |
|---|---|
| **DEC_ID** | `DEC-20261009-017` · **DATE** 2026-10-09 · **SESSION** `ERP-SESSION-01` · **CATEGORY** DEVOPS · RELEASE |
| **LOẠI** | 🛑 **QUYẾT ĐỊNH CỦA USER** — S01 ⛔ **DỪNG**, ⛔ không tự áp mặc định (luật dừng-chờ-quyết-định) |

### 1. VIỆC ĐANG CHẶN (đo được, ⛔ không suy đoán)
`node tools/verify-ui-build-applied.mjs --port=8787` ⇒ **«KẾT LUẬN: BẢN CHẠY CŨ»** ⚠️
| Phép đo | Kết quả |
|---|---|
| `dist/` (bản UI đang phục vụ) | **08/10 16:13:31** |
| Mã FE sửa HÔM NAY | `app/screens/PermissionAccessPanel.tsx` **12:40:20** · `PermissionMatrix.tsx` **12:39:32** · `lib/menu-helpers.ts` **12:15** · `app/page.tsx` (**S4**) |
⇒ 🔴 **Thay đổi giao diện phân quyền WORK của S4 ⛔ CHƯA hiện ra trên UI đang chạy** ✓

### 2. VÌ SAO ⛔ KHÔNG BUILD ĐƯỢC NGAY
`npm run build` ⇒ **EXIT 1** với cổng chặn:
```
Error: Source fingerprint không hợp lệ:
   expected bb706f12024900770b0cdefd691c0a7c5d775b29fece3153ea5372d7bc424454
   actual   aa2…            (vì mã nguồn FE đã đổi hôm nay)
```
⭐ Muốn build **BẮT BUỘC** chạy `tools/fixpoint-fingerprint.mjs` (chốt lại vân tay nguồn) ⇒
⚠️ **ĐỔI VÂN TAY SẢN PHẨM** ⇒ ảnh hưởng **MỌI PHIÊN** (các cổng so vân tay/`verify-ui-build-applied`/gói phát hành phải chạy lại) ✓

### 3. ⚠️ 3 PHƯƠNG ÁN (⛔ S01 không tự chọn)
| # | Phương án | Hệ quả |
|---|---|---|
| **(a)** ⭐ **Cho S01 build NGAY** | Chạy `fixpoint-fingerprint` → `npm run build` → dừng **ĐÚNG** PID `scripts/local-server.mjs` → khởi động lại `:8787` → chạy lại cổng `verify-ui-build-applied` | ✅ Thay đổi phân quyền WORK (ẩn khoá cũ + 2 action mới) **hiện ra ngay** ⚠️ **đổi vân tay** ⇒ phiên khác phải chạy lại cổng · ⚠️ nếu S4 còn sửa FE ⇒ phải build lại lần nữa |
| **(b)** **Chờ S4 dừng sửa rồi build 1 lần** | S01 chờ tín hiệu `RELEASED` từ S4 | ✅ ⛔ tránh build 2 lần ⚠️ UI vẫn là bản cũ tới lúc đó |
| **(c)** **Giữ nguyên, ⛔ không build** | — | ✅ ⛔ không đổi vân tay ⚠️ 🔴 **thay đổi của S4 ⛔ không bao giờ hiện** trên UI ⇒ người dùng ⛔ không thấy được kết quả phân quyền mới |

### 4. TRẠNG THÁI AN TOÀN (⭐ quan trọng — ⛔ không có hư hại)
✅ `dist/` **nguyên vẹn** (08/10 16:13:31) · ✅ `:8787` (pid **14028**) **CHƯA bị dừng** · ✅ `:9000` · `:18081` sống · ✅ CSDL **12/5/10/28** ⛔ không đổi · ✅ **0 commit/push** ✓
📌 **TÌNH TRẠNG**: `BLOCKED` — chờ user quyết (a)/(b)/(c) ✓

> ⏰ **CẬP NHẬT 2026-10-09**: đã hỏi user qua kênh sk_user (kèm 4 phương án a/b/c/d) ⇒ ⛔ **HẾT THỜI HẠN 15 phút, user CHƯA trả lời** ⇒ ⭐ theo **luật dừng-chờ-quyết-định** (memory #3): S01 ⛔ **KHÔNG tự áp mặc định**, ⛔ **KHÔNG build**, ⛔ ⛔ **KHÔNG chạy ixpoint-fingerprint** ⇒ dist/ **nguyên vẹn** (08/10 16:13:31) · :8787 (pid 14028) **⛔ chưa dừng** · 3 cổng sống · CSDL **12/5/10/28** ⛔ không đổi · **0 commit** ✓ ⏳ **TÌNH TRẠNG: BLOCKED — chờ user quyết (a)/(b)/(c)/(d)** ✓

## DEC-20261009-018 — ⏳ **3 VIỆC CHỜ USER QUYẾT** (S01 DỪNG vòng lặp, ⛔ không tự áp phương án mặc định)

| **DEC_ID** | `DEC-20261009-018` · **DATE** 2026-10-09 · **SESSION** `ERP-SESSION-01` · **CATEGORY** COORDINATION · RELEASE |
|---|---|
| **BỐI CẢNH** | Việc user giao (**phân quyền nhóm «Công việc» + phối hợp S4**) ⭐ **ĐÃ XONG & ĐÃ ĐO**: `CHG-20261009-012` (6 action) · `DEV-20261009-011` (định danh **ALPHA TEST** + **build EXIT 0** + cổng UI **3/3 ĐẠT**) · **102/102 Java** · **959/958/0 FE** · `tsc` 0 ✓ |
| **LUẬT ÁP DỤNG** | ⭐ **Luật dừng-chờ-quyết-định** (user chốt 2026-10-09): chạm **quyết định của user** ⇒ **DỪNG** vòng lặp goal, ⛔ **không tự áp phương án mặc định** rồi chạy tiếp ✓ |

### ⏳ 3 VIỆC CHỜ QUYẾT (⚠️ mỗi việc S01 ⛔ **không tự quyết** — có lý do cụ thể)
| # | Việc | Vì sao **phải** chờ user | Phương án S01 đề xuất |
|---|---|---|---|
| **1** | **Đồng bộ nhãn sản phẩm ở banner `docs/**` (59 chỗ) + `AGENTS.md`** sang `ALPHA TEST 2026.10` | ⚠️ `docs/**` = phạm vi **`ERP-SESSION-04`**; `AGENTS.md` = **tệp GOAL/điều lệ** của CẢ cụm; ⚠️ **11 chỗ vân tay cũ** nằm trong **báo cáo LỊCH SỬ** ⇒ ⛔ không được viết lại lịch sử (luật `D-105`) | ⭐ **Đồng bộ banner** (nhãn «Sản phẩm:») nhưng ⛔ **GIỮ NGUYÊN** các báo cáo mốc cũ (R1.1.1/CLEANUP…) ✓ |
| **2** | **`MANIFEST_SHA256.txt` lệch** ⇒ `npm run test:release-static` **EXIT 1** | ⚠️ Tệp **git-tracked** = **sổ sách PHÁT HÀNH**; ⭐ **ĐO ĐƯỢC: ⛔ không phải do S01** (tệp bị lệch có mtime **26/09**, manifest **01/10** ⇒ **nợ cũ**) | ⭐ Làm mới manifest bằng **công cụ dự án** (`scripts/generate-release-manifest.mjs`) **sau khi** chốt có build lại jar không ✓ |
| **3** | **`docs/38 §7` — module nào cho CRUD DỰ ÁN** (chặn `T-05` mà S4 giao S01) | ⚠️ Đây là **quyết định NGHIỆP VỤ/quyền** (ai được tạo/sửa/xoá dự án) — ⛔ S01 ⛔ không tự chọn module | ⭐ Chờ user trả lời 5 câu trong `docs/38` §7 ⇒ S01 thi hành `T-05` (`ActionRbacRegistry` + `update_project` `canUse→canEdit`) ✓ |

### ✅ 2 VIỆC S01 ĐÃ CHỐT **KHÔNG** LÀM (⛔ để ⛔ không sinh nợ giả)
- 🚫 **`BUG-20261008-D03`** (12 action «mồ côi») = **BÁO ĐỘNG GIẢ** — đo 4 chiều **12/12** (`ADMIN_ONLY_ACTIONS` có · route JS `requireRole(["admin"])` có · `case` có · registry 0/12) ⇒ ⭐ **Java = JS** ⇒ ⛔ **0 dòng mã đổi** ✓ (bằng chứng `TEST-20261009-020`, đã gửi `HANDOFF-20261009-A06` đề nghị S4 đóng `CANCELLED`) ✓
- ⚠️ **`tools/probe-catalog-drift.mjs` EXIT 1** — ⛔ **không sửa vì là tệp của `ERP-SESSION-04`** (đã gửi `HANDOFF-20261009-A05` kèm **6 tên** + bằng chứng: 6 action Java-only mới) ✓

### 📌 TRẠNG THÁI CUỐI LƯỢT (đo được — ⛔ không suy diễn)
`:8787` **17980** · `:9000` **5584** · `:18081` **22264** (health 200) · nhãn sản phẩm **`VNTECH ERP V5.3.0 ALPHA TEST 2026.10`** · vân tay **`VNTECH-FP-C37A1809D58C5856`** · cổng UI **3/3 ĐẠT** · **⛔ 0 commit** (71 tệp chưa commit — đúng luật user) ✓

## DEC-20261009-019 — 🛑 **CHỜ USER CHỐT MÔ HÌNH MA TRẬN «CÔNG VIỆC»** (sau khi đã thi hành phần quyền truy cập)

| **DEC_ID** | `DEC-20261009-019` · **DATE** 2026-10-09 (≈14:12) · **SESSION** `ERP-SESSION-01` · **CATEGORY** RBAC · UI_UX |
|---|---|
| **ĐÃ THI HÀNH (⛔ không cần chốt)** | ✅ `create_self_work_item` thêm khoá `work` (registry) · ✅ `work` cấp **can_view** cho **11/11 phòng ban** + **28/28 tài khoản hoạt động** ⇒ ⭐ **«mọi user truy cập được Công việc»** đã ĐÚNG ở tầng dữ liệu ✓ |
| **🛑 CHỜ CHỐT (ảnh hưởng cả `ERP-SESSION-04`)** | ⚠️ User yêu cầu ma trận *«phù hợp với **từng tab, từng chức năng** trong Công việc»* ⇒ có **2 mô hình**, ⛔ tôi **không tự chọn** ✓ |
| **Mô hình A — 1 khoá + 6 năng lực (ĐANG CÓ)** | Ma trận hiện **1 dòng «Công việc (dùng chung mọi phòng ban)»** với 6 ô: Xem · Thao tác · Tạo · Sửa · Duyệt · Xuất ⇒ ✅ **đơn giản, dữ liệu đã sẵn**, ⛔ không cần migration ⚠️ nhưng **⛔ không tách được quyền theo TỪNG TAB** (ví dụ «được xem Báo cáo nhưng ⛔ không được Giao việc») ✓ |
| **Mô hình B — khoá riêng cho TỪNG TAB/CHỨC NĂNG** | Tạo khoá mới cho từng tab Công việc (đo từ `WorkCenter`: «**Danh sách công việc**» · «**Được giao**» (đang ẩn) · «**Phòng ban/Tổ đội**» · «**Giao việc**» · «**Dự án**» · «**Báo cáo**» · «**Trung tâm phê duyệt**») ⇒ ⭐ **đúng nguyên văn** yêu cầu user ✓ ⚠️ nhưng cần: `module_catalog` mới + `ActionRbacRegistry` (LOCK S01) + ma trận UI (S4) + cấp quyền lại ✓ |
| **ĐỀ XUẤT CỦA S01** | ⭐ **Mô hình B** (đúng yêu cầu «từng tab, từng chức năng») — ⚠️ nếu chọn B, S01 đề nghị **giữ `work` làm khoá CHA** («truy cập nhóm Công việc» = mọi user ✓) + **7 khoá con** cho 7 tab ✓ ⇒ ⛔ không phá quyền hiện có và ⛔ không mở rộng quá mức ✓ |

### ✅ CẬP NHẬT `DEC-20261009-019` — **USER ĐÃ CHỐT: MÔ HÌNH B** (2026-10-09 ≈14:20)
> Trả lời trực tiếp: **«B — mỗi TAB 1 khoá riêng»** ✓ ⇒ ⭐ **S01 đã thi hành xong phần DỮ LIỆU** (`TEST-20261009-024` · `CHG-20261009-014`): 6 khoá tab + cấp `can_view` cho 11 phòng/28 tài khoản + 6 nhãn ở `app/page.tsx` ✓ ⏳ Còn: dải tab `WorkCenter.tsx` + hiển thị ma trận (**phạm vi ERP-SESSION-04**, `HANDOFF-20261009-A09`) + **build** (đang chờ `RELEASED`) ✓

## DEC-20261009-020 — ⭐ **S01 QUYẾT MÔ HÌNH QUYỀN CÔNG VIỆC** (đúng thẩm quyền user giao 08/10) — **B1 + `canEdit` cho xoá**

| **DEC_ID** | `DEC-20261009-020` · **DATE** 2026-10-09 (≈14:30) · **SESSION** `ERP-SESSION-01` · **CATEGORY** RBAC |
|---|---|
| **THẨM QUYỀN** | ⭐ **Nguyên văn user (08/10/2026, ghi tại `SESSION_D/probes/KE-HOACH-PHAN-QUYEN-CONG-VIEC.md` §3)**: *«việc **phân quyền** như nào sẽ thuộc về **session 1** hãy làm công việc của mình theo đặc tả tôi vừa gửi»* ⇒ ⭐ **S01 quyết B1/B2 và công tắc xoá**; **S04 làm phần chức năng** ✓ |
| **ĐÃ CHỌN** | ⭐ **(A) = B1** (thêm **1 dòng ma trận** `work_others` = «Việc của NGƯỜI KHÁC (xem · sửa · duyệt)») ⇒ ⛔ **KHÔNG đổi lược đồ CSDL** · ⛔ **KHÔNG migration** · ⭐ đúng cách đã làm cho `work` và `project_admin` ✓ · ⭐ **(B) = `canEdit`** cho XOÁ việc của bản thân (⛔ không thêm `canDelete`) ✓ |
| **⚠️ VÌ SAO ⛔ KHÔNG CHỌN B2** | B2 cần **4 cột capability mới** (`canViewOthers`/`canEditOthers`/`canApproveOthers`/`canDeleteOwn`) ⇒ 🔴 **đổi lược đồ + migration `drizzle`** ⇒ ⚠️ **đổi vân tay gói** giữa GO-LIVE khi đang có **lệnh đóng băng build** ⇒ ⚠️ rủi ro ⛔ không tương xứng; ⭐ B1 **diễn đạt ĐỦ** đặc tả user (2 vế «của bản thân» / «của người khác»), B2 chỉ **chi tiết hơn** ⇒ ⭐ **ghi lại làm nợ có tên** nếu user muốn tách rời từng quyền sau này ✓ |
| **CÁCH THI HÀNH (ai làm gì)** | 📤 **S01**: ① khai `work_others` trong `module_catalog` (đã làm) + nhãn ma trận `app/page.tsx` ② **action mới `delete_work_item`** (Java `SystemController`+use-case+registry, capability **`canEdit`**, ⛔ chỉ xoá việc **DO MÌNH tạo**, ⛔ không xoá việc đã `COMPLETED`) ③ **cưỡng chế `work_others`** trong use-case (phạm vi vẫn do máy chủ suy ✅ §5.1 của S04) ④ test + giữ `probe-action-registry-coverage` **exit 0** ✓ — 🔹 **S04**: đường JS nếu cần parity, nút «Xoá» UI (W3), khối «xem việc người khác» (W2), ma trận UI ✓ |
| **⚠️ RÀNG BUỘC ĐÃ CAM KẾT VỚI S04** (`§5` kế hoạch của họ) | ⛔ **cấp ban đầu = 0** cho `work_others` (⛔ không tick sẵn cho ai ⇒ hành vi hiện tại ⛔ không đổi) ✓ · ⛔ không nới quyền ở giao diện ✓ · ⛔ không CSS dùng chung ✓ · mọi tuyên bố phải kèm **phép đo** ✓ |

## DEC-20261009-021 — ⚠️ **CHỜ USER QUYẾT: khoá `work_others` (B1) THI HÀNH THẾ NÀO?** — ⛔ S01 KHÔNG tự siết quyền

**Bối cảnh ĐO được (09/10/2026 ≈15:40)**:
- ⭐ Khoá `work_others` **đã có**: 1 dòng ma trận (`lib/menu-helpers.ts` — S04) + 1 dòng `ActionRbacRegistry` (**L368**, S01) + `module_catalog` (S01) · ⚠️ **cấp ban đầu = 0** ✓
- ⚠️ **NHƯNG backend ⛔ CHƯA thi hành khoá này**: «việc của NGƯỜI KHÁC» hiện do **`WorkScopeService.scopeOf(userId, role)`** quyết theo **VAI TRÒ/CẤP BẬC**, ⛔ không theo ma trận:
  `Kind.SELF` (nhân viên) · `Kind.DEPARTMENT` (trưởng phòng, `level_rank ≥ 30`) · `Kind.COMPANY` (phó GĐ `≥ 35` + giám đốc) ⇒ `canViewDepartmentWork = kind != SELF` ✓
- ⛔⛔ **RỦI RO NẾU SIẾT MÙ**: khoá đang **cấp 0** ⇒ nếu bắt buộc phải có khoá mới xem được việc người khác thì **MỌI trưởng phòng + phó GĐ + giám đốc MẤT quyền đang có** ⇒ ⭐ S01 **DỪNG, ⛔ không tự quyết** (luật: chạm quyết định của user ⇒ chờ user) ✓

**3 PHƯƠNG ÁN ĐỂ USER CHỌN**:
| # | Phương án | Ảnh hưởng |
|---|---|---|
| **A** | ⭐ **CỘNG THÊM** (khuyến nghị): giữ nguyên phạm vi theo vai trò; khoá `work_others` = **cấp THÊM** cho người cần xem việc người khác ngoài phạm vi vai trò | ✅ ⛔ **0 phá vỡ** hành vi hiện tại · ✅ an toàn go-live · ⚠️ cần 1 luật rõ ở use-case (hợp của 2 nguồn) |
| **B** | **THAY THẾ**: chỉ ai có khoá mới xem được việc người khác (bỏ phạm vi vai trò) | ⚠️ **PHẢI cấp bù NGAY** cho mọi trưởng phòng/phó GĐ/giám đốc (⚠️ dữ liệu: nhiều tài khoản) + migration ⇒ ⚠️ rủi ro go-live |
| **C** | **GIỮ NGUYÊN (khoá để trống)**: khoá tồn tại trong ma trận nhưng ⛔ chưa thi hành | ✅ 0 rủi ro · ⚠️ admin tick cũng ⛔ chưa có tác dụng ⇒ **nợ có tên** (⚠️ nửa vời nếu user tưởng tick là có quyền) |

**TRẠNG THÁI**: ⏸ **DỪNG vòng lặp goal chờ user quyết** (đúng luật dừng-chờ-quyết-định) ✓ ⛔ S01 ⛔ **KHÔNG** tự áp phương án nào ✓

## DEC-20261009-022 — 📐 **ĐỀ XUẤT PHÂN TẦNG QUYỀN MODULE «CÔNG VIỆC»** (user yêu cầu đề xuất 09/10/2026)

**USER NGUYÊN VĂN**: «*Ma trận phân quyền đang sai, tôi vẫn thấy ghi chú quyền Công việc -> phòng dự án, phân quyền phải theo tab (chức năng). Hiện tại module Công việc đang có 6 tab, cần ít nhất 6 quyền theo 6 tab này, ngoài ra các tab Danh sách công việc và Phòng ban/tổ đội mỗi tab còn 2 tab con nữa xem xét từ đặc tả hệ thống hãy đề xuất cho tôi những sub tab này có cần phân quyền rõ ràng hay không hay là check theo chức vụ*»

**⚠️ NGUYÊN NHÂN «MA TRẬN SAI» — ĐO ĐƯỢC (⛔ không suy đoán)**: 4 khoá **CŨ theo PHÒNG** vẫn **sinh dòng ma trận** kèm `subGroup` «Phòng Kế hoạch» / «Phòng Dự án»:
`dept_plan_tasks` (sort 10) · `dept_project_tasks` (20) · `dept_plan_assign` (30) · `dept_project_assign` (40) — ⚠️ chúng **đã bị ẩn khỏi MENU** (`legacyWorkMenuKeys`) nhưng **⛔ CHƯA bị ẩn khỏi MA TRẬN** (ma trận đọc `configuredModules` ⇒ ⛔ không qua bộ lọc menu) ✓

**📐 ĐỀ XUẤT PHÂN TẦNG (3 tầng)**:
| Tầng | Cơ chế | Trạng thái |
|---|---|---|
| **① TAB (chức năng)** | **6 khoá ma trận** = 6 tab: `work_dashboard` · `work_list` · `work_department` · `work_assign` · `work_project` · `work_reports` | ✅ **ĐÃ CÓ** (09/10/2026 · Mô hình B · cấp `can_view` cho 11 phòng/28 tk) |
| **② PHẠM VI DỮ LIỆU** (xem việc ai) | ⭐ **THEO CHỨC VỤ/CẤP BẬC** — ⛔ KHÔNG cấp qua ma trận: nhân viên = việc mình · trưởng phòng (cấp ≥30) = **phòng mình** · phó GĐ (≥35)/giám đốc = **mọi phòng** (`WorkScopeService`) | ✅ **ĐANG CHẠY** (⛔ không đổi) |
| **③ SUB-TAB** | ⭐ **Phân loại theo BẢN CHẤT** (xem bảng dưới) | 📐 **ĐỀ XUẤT** |

**③ SUB-TAB — ĐỀ XUẤT CỤ THỂ (đo từ mã, ⛔ không bịa)**:
| Sub-tab (đo được) | Bản chất | ⭐ ĐỀ XUẤT |
|---|---|---|
| «Của tôi» · «Đã giao» (tab *Danh sách công việc* — `PERSONAL_GROUPS`) | ⭐ **CHỈ dữ liệu CỦA CHÍNH MÌNH** (việc mình làm · việc mình giao) | ⛔ **KHÔNG khoá riêng** — ai vào được tab (`work_list`) thì thấy cả 2 nhóm ✓ |
| «**Theo người**» (cách xem thứ 2 của tab *Danh sách* — `W2`) | ⚠️ **XEM DỮ LIỆU NGƯỜI KHÁC** | ✅ **DÙNG khoá `work_others`** (⭐ đúng bản chất B1 · theo **phương án A** user vừa chốt) ⇒ xem được nếu **(trong phạm vi chức vụ) HOẶC (được cấp `work_others`)** ✓ |
| «Việc phòng ban của tôi» · «Việc của tổ đội tôi tham gia» (tab *Phòng ban/ Tổ đội* — `deptTab`) | ⭐ **2 LÁT CẮT của CÙNG một phạm vi ĐƯỢC PHÉP** (server đã thu hẹp ✓) | ⛔ **KHÔNG khoá riêng** — **theo chức vụ/phạm vi** ✓ (⚠️ cấp khoá riêng ⇒ phải cấp đủ cho mọi trưởng phòng ⇒ phình + dễ chặn oan ✓) |
| Kanban / Cây («chế độ xem», đang tạm ẩn) | Chỉ là **cách hiển thị** cùng dữ liệu | ⛔ **KHÔNG** |

**⭐ CHỐT ĐỀ XUẤT**: **6 khoá TAB + 1 khoá `work_others` = 7 khoá** ✓ ⛔ **không** thêm khoá cho sub-tab nội bộ ✓ ➕ **XOÁ 4 DÒNG CŨ theo phòng** khỏi ma trận ✓ (⚠️ ⛔ **KHÔNG xoá khai báo** — chúng còn dùng ở nơi khác; chỉ **⛔ không render thành dòng ma trận** ✓)
**CHỜ USER XÁC NHẬN** trước khi thi hành (⚠️ đổi cấu trúc ma trận = quyết định của user) ✓

## DEC-20261009-023 — ⛔ **RÚT ĐỀ XUẤT ĐỔI NHÃN DÒNG `work`** (đo được: sẽ phá 2 test — ⛔ không đáng)

**Bối cảnh**: S01 từng đề xuất (trong `HANDOFF-A18`) đổi nhãn dòng ma trận `work` từ «Công việc (mọi phòng ban)» thành «Công việc — Quyền thao tác (tạo / sửa / xoá việc)» ✓
**⚠️ ĐO ĐƯỢC TRƯỚC KHI LÀM (⭐ đúng luật: ĐO rồi mới sửa)**:
- ⚠️ `tests/t13-work-progress-cell.test.mjs` **L301**: `assert.match(sql, /'work','Công việc \(mọi phòng ban\)'/)` ⇒ khoá **chuỗi SQL** ✓
- ⚠️ cùng tệp **L380**: `assert.match(menuHelpers, /\{ key: "work", label: "Công việc \(mọi phòng ban\)",/)` ⇒ khoá **chuỗi mã** ✓
- ⇒ đổi nhãn phải sửa **3 nơi**: `lib/menu-helpers.ts:47` (tệp dùng chung của S04) + `module_catalog.label` (CSDL) + **`tests/t13` (tệp test của S04)** ✓
**⛔ QUYẾT ĐỊNH: RÚT ĐỀ XUẤT** — ① nhãn «mọi phòng ban» là **QUYẾT ĐỊNH CÓ CHỦ Ý của user 08/10** (phương án A: khoá dùng chung mọi phòng ban) ⛔ **không phải lỗi** ✓ ② lợi ích chỉ là **làm rõ nhãn** ⇒ ⛔ **không xứng** với rủi ro chạm tệp dùng chung + test của phiên khác (luật §41 SAFE·SMALL·ISOLATED·REVERSIBLE) ✓
**⚠️ BÀI HỌC (lần 3 trong ngày)**: «cải tiến» suy đoán **đều bị ĐO bác bỏ** — ① `MATRIX_HIDDEN_MODULE_KEYS` (**đã đúng sẵn**) ② banner tài liệu (**đã đồng bộ sẵn**) ③ đổi nhãn `work` (**sẽ phá 2 test**) ⇒ ⭐ **LUẬT TỰ ÁP: mọi «việc nên làm» phải qua ĐO trước khi mở tệp** ✓

## DEC-20261009-024 — ⛔ **KẾT LUẬN «KHÔNG PHẢI BUG» có BẰNG CHỨNG**: ma trận ⛔ không có dòng module `admin` là **ĐÚNG THIẾT KẾ**

**Nguồn nghi vấn**: header của `tools/_probe-matrix-rows.mjs` hỏi «ma trận có DÒNG để cấp module `admin` («Danh mục & phân quyền») — thứ mà menu «QUẢN TRỊ HỆ THỐNG» đòi — hay không?» và probe tự trả lời **⛔ KHÔNG** ✓ ⇒ ⚠️ S01 điều tra (phạm vi ADMIN ✓)

**⚠️ 2 CẢNH BÁO GIẢ ĐÃ TỰ GỠ BẰNG ĐO (⭐ không sửa gì cả)**:
① ⚠️ «Số dòng trong probe LỖI THỜI»: probe trỏ `app/page.tsx:486-487` — nay là chú thích tab «Dashboard» của Công việc ⛔ **không liên quan** (tệp đã dài thêm ✓) ⇒ ⛔ **không suy ra bug từ số dòng cũ** ✓
② ⚠️ «21 dòng `user_module_permissions.module_key='admin'` có bị XOÁ khi lưu (lớp `BUG-D19`)?» ⇒ ✅ **KHÔNG**: `permissionMatrixKeys` (`PermissionAccessPanel.tsx` L110–117) dựng payload = **`data.moduleCatalog`** ∪ `entryKeys` ⇒ ⭐ **`admin` VẪN nằm trong tập GỬI LÊN** ✓ (⛔ không phải suy từ `entries` ✓)

**📏 BẰNG CHỨNG ĐO ĐƯỢC**:
| Câu hỏi | Kết quả |
|---|---|
| Java có cưỡng chế khoá `admin`? | ⛔ **KHÔNG** — `"admin"` xuất hiện **3 lần ở vị trí GIÁ TRỊ**, cả 3 là **danh sách VAI TRÒ** `List.of("project_admin","admin")` (`create_project` L93 · `delete_project` L139 · `update_project` L326 — ⭐ chính 3 dòng S01 vá hôm nay ✓) ⇒ **⛔ không action nào gắn module `admin`** ✓ |
| FE có dùng module `admin` làm cổng? | ⛔ Không (chỉ `page.tsx:3001` trong modal dự án) ✓ |
| Menu «QUẢN TRỊ HỆ THỐNG» gate bằng gì? | ⭐ `systemAdminMenuVisible = isAdminUser(user) \|\| hasAnyAdminGroupPermission` (`page.tsx` L537 ✓) ⇒ **VAI TRÒ `admin`** hoặc **≥1 khoá `admin_tab_NN`** (14 khoá **CÓ** trong ma trận ✓) ✓ |
| `admin` có trong `module_catalog`? | ✅ CÓ (`Danh mục & phân quyền` · group `system_admin` · sort 10 ✓) ⇒ ⭐ bị **loại CHỦ Ý** khỏi dòng ma trận (`page.tsx:311` `filter((item)=>item.key!=="admin")` ✓) ✓ |

**📌 GHI NHẬN THÊM (⚠️ vô hại — ⛔ S01 KHÔNG tự xoá, chờ user nếu muốn dọn)**: 21 dòng cấp `admin` trong CSDL **toàn bộ là tài khoản TEST**: `probe_grant1_*` ×17 (10 cái `active=0`) · `probe_permsave_*` ×2 · `e2e.bgd` · `e2e.kh` · `giamdoc.demo` (3 tài khoản test — quyền **vô hiệu** vì khoá ⛔ không phải cổng nào) · `hrm` (0 hết) ✓

**⭐ GIÁ TRỊ CỦA LƯỢT NÀY**: điều tra **đóng một nghi vấn bằng bằng chứng**, ⛔ **không «sửa» một thứ vốn đã đúng** (⚠️ đúng bài học bị lặp nhiều lần trong ngày: **đo trước, kết luận sau**) ✓

## DEC-20261009-026 — ⏸ **CHỜ USER CHỌN**: xử lý «quản trị bị mù» với **4 khoá cũ đã ẩn** (168 quyền `department_default` còn hiệu lực)

**BỐI CẢNH (đo được, `TEST-20261009-041`)**: ⭐ 4 khoá `dept_plan_tasks` · `dept_project_tasks` · `dept_plan_assign` · `dept_project_assign` **⛔ KHÔNG chết** — chúng gate **8 action** trong `ActionRbacRegistry.java` (`create_work_item` · `approve_work_item` · `add_work_item_comment` · `update_work_item_progress` · `reassign_work_item` · `create_self_work_item` · `set_work_item_participant` · `mark_task_notification_read`) và CSDL có **168 dòng** cấp **tự động theo phòng ban** (`permission_source='department_default'` ✓).

**ĐÃ KIỂM (⛔ KHÔNG mất dữ liệu)**: lưu ma trận chỉ xoá **`manual_override` theo từng khoá** ⇒ 168 dòng `department_default` **⛔ không bị chạm** ✓ · ⛔ **không bypass** (registry vẫn enforce ✓) · ✅ đã có cơ chế **HỢP** từ `BUG-20261008-014` ✓.

**HỆ QUẢ CÒN LẠI**: admin **⛔ không nhìn/thu hồi** 168 quyền đó trong ma trận ⇒ **quản trị bị «mù» một phần** ✓ (⚠️ hệ quả của quyết định «ẩn» của user — ⛔ S01 không tự sửa ✓).

**3 PHƯƠNG ÁN**: **(A)** ⭐ *giữ ẩn* + **1 dòng ghi chú/tổng đếm** trong tab (0 rủi ro, làm ngay) · **(B)** thêm **nút «Hiện khoá cũ»** (mặc định vẫn ẩn, sửa `PermissionAccessPanel` — tệp S01 ✓) · **(C)** bỏ hẳn 4 khoá khỏi RBAC thủ công ⇒ ⚠️ **lớn, ⛔ không nên trong ALPHA** ✓.

**KHUYẾN NGHỊ S01**: ⭐ **(A)** ✓ — ⏸ **chờ user chọn** ✓

## DEC-20261009-027 — ⏸ **CHỜ USER QUYẾT**: vai trò **`accountant` (kế toán) và `director` (giám đốc) đi qua MỌI danh sách quyền** (trừ action `admin`) — có giữ nguyên không?

**BẰNG CHỨNG (đo được, `TEST-20261009-042` + đọc mã)**:
* `java-backend/.../rbac/RbacService.java` **L98–99**: `isCompanyLeadership(user)` = `List.of("director", "accountant").contains(user.role())` ✓
* **L115**: `if (isCompanyLeadership(user) && !required.contains("admin")) return;` ⇒ ⭐ **đi qua mọi action** ✓
* ⭐ **Đo thật trên hệ thống ĐANG CHẠY**: tài khoản `kttdemo` (`role=accountant`) gọi `approve_work_item` và `delete_work_item` ⇒ **⛔ KHÔNG bị 403** (trong khi `ksda.demo` `role=ksda` và `nvkhdemo` `role=kh_nv` **bị 403** ✓) ⇒ ⭐ **hành vi được xác nhận trên bản chạy** ✓
* ⭐ **Mã tự ghi chú** (`RbacService` L79–80): «*`RbacService` cho **`director`/`accountant`** đi qua **mọi** danh sách không chứa `"admin"` (nhánh `isCompanyLeadership`) ⇒ ⛔ chưa khớp với route JS*» ⇒ ⭐ **port «nguyên trạng» từ bản JS cũ**, ⛔ **không phải lỗi mới** ✓

**VÌ SAO CẦN QUYẾT**: ⚠️ với ERP thật, «**kế toán**» là vai trò **nghiệp vụ văn phòng** ⛔ không phải ban lãnh đạo ⇒ ⭐ việc kế toán **duyệt/xoá được công việc của mọi phòng** là **rủi ro phân quyền** (⚠️ §20 «AUTHORIZATION» — ⚠️ mức **MEDIUM–HIGH về chính sách**, ⛔ không phải lỗ hổng mới vì là hành vi có từ bản cũ ✓)

**3 PHƯƠNG ÁN**: **(A)** ⭐ *giữ nguyên* (đúng bản cũ) + ghi **1 dòng cảnh báo** vào tài liệu phân quyền ✓ · **(B)** **bỏ `accountant`** khỏi `isCompanyLeadership` (⚠️ chỉ còn `director` — ⚠️ chạm 1 dòng Java + **phải chạy lại test Java 110 ca** + build ✓) · **(C)** giữ `accountant` nhưng **thêm danh sách action được phép** (⚠️ lớn nhất, cần user liệt kê ✓)

**KHUYẾN NGHỊ S01**: ⭐ **(A)** trong giai đoạn ALPHA (⛔ không đổi chính sách quyền giữa kỳ test ✓) — ⚠️ nhưng **phải ghi rõ vào tài liệu** để ⛔ không quên trước GO-LIVE ✓

> ### ✅ ĐÓNG `DEC-20261009-027` (17:40 · `ERP-SESSION-01`) — **⛔ KHÔNG cần user quyết lại: đây là hành vi ĐÃ ĐƯỢC USER QUYẾT từ 18/09/2026**
> ⭐ Khi lập bản đồ vai trò, S01 tìm thấy ghi chú quyết định **trong chính mã nguồn**: `scripts/system-route.mjs` **L403–413** — «**Q2 (18/09/2026) — NGƯỜI DÙNG QUYẾT: "giữ Java, sửa JS"** cho lớp lệch `isCompanyLeadership` (**`TASK-024`**)» ✓
> ⭐ Ghi chú đó nói **đúng y điều S01 đo được hôm nay**: «`RbacService.isCompanyLeadership` = `List.of("director","accountant")` → dùng cho **CỔNG QUYỀN HÀNH ĐỘNG** ⇒ *Java cấp THỪA cho `accountant`*» ✓ — ⚠️ tức là **hành vi CỐ Ý**, có **cổng kiểm** `tools/probe-task024-leadership-parity.mjs` ✓
> ⇒ ⭐ **KẾT LUẬN**: `accountant` đi qua cổng quyền **⛔ KHÔNG phải lỗ hổng mới, ⛔ KHÔNG phải việc cần quyết lại** ✓ — ⭐ S01 **rút lại câu hỏi** (⛔ không để user phải quyết lại điều đã quyết ✓) và **giữ nguyên hành vi** (đúng lựa chọn «giữ Java» của user ✓) ✓
> ⚠️ **BÀI HỌC (lần 13)**: ⭐ **TRƯỚC khi biến một phát hiện thành «câu hỏi cho user» ⇒ phải TRA XEM ĐÃ CÓ QUYẾT ĐỊNH CŨ CHƯA** (⭐ tìm trong mã: các khối `// ... NGƯỜI DÙNG QUYẾT`/`Q1/Q2`/`TASK-0xx` ✓ + `DECISION_LOG` ✓ + các probe parity ✓) — ⚠️ hôm nay S01 suýt khiến user quyết lại một việc họ đã chốt cách đây 3 tuần ✓

> ### ✅ ĐÓNG 2 CÂU HỎI CHỜ-USER bằng QUYẾT ĐỊNH CŨ + MÃ ĐANG CHẠY (17:50 · `ERP-SESSION-01`) — ⭐ áp dụng ngay bài học 13
> **Áp dụng bài học 13** («tra quyết định cũ TRƯỚC khi hỏi user»): S01 soát 5 việc đang chờ ⇒ **2 việc thực ra ĐÃ CÓ ĐÁP ÁN** ✓
>
> **① ĐÓNG câu «phạm vi khoá `work_others`: phòng mình hay mọi phòng?»** — ⭐ **ĐÁP ÁN: CẢ HAI, TUỲ CHỨC VỤ** (đúng nguyên tắc user đã chốt «**THEO CHỨC VỤ/CẤP BẬC** — ⛔ KHÔNG cấp qua ma trận», `DECISION_LOG` L798–808 + `CHANGE_LOG` L976 «USER CHỐT `A` · giữ nguyên phạm vi theo chức vụ» ✓)
> * ⭐ **Bằng chứng = CÂU LỆNH ĐANG CHẠY** (`BootstrapDataAdapter.workItemWhere` L1576–1595): `workAll = admin || isWorkCompanyScope(roleCode, roleBase)` ⇒ **mọi phòng** (`1=1`) ✓; người thường ⇒ `assigned_to = mình` **HOẶC** (cùng **phòng mình** **VÀ** một trong: đơn vị `site_command` + dự án ✓ / chức danh `%_truong` ✓ / `work.can_approve=1` ✓ / ⭐ **`work_others.can_view=1`** — **VẾ OR thứ 4** mới thêm 09/10 theo `DEC-20261009-021` (phương án A — **cộng thêm** ✓, tôn trọng `permission_expires_at` ✓))
> * ⭐ Mã tự ghi chú: «*mở **THÊM** phạm vi «việc NGƯỜI KHÁC trong **PHÒNG mình**» … ⛔ KHÔNG lấy mất quyền của bất kỳ ai (trưởng phòng/phó GĐ/giám đốc giữ nguyên)*» ✓
> ⇒ ⭐ **Kết luận**: **trưởng phòng ⇒ phòng mình** · **giám đốc/ban lãnh đạo ⇒ mọi phòng** — **đã chạy ĐÚNG như user quyết** ⇒ ⛔ **không cần user quyết gì thêm** ✓ · ⭐ **S01 có thể tự nghiệm thu** (đã đo trước đó: 0 → 19 → 0 việc khi cấp/xoá khoá ✓)
>
> **② THU HẸP câu «đề xuất sub-tab»** — ⭐ user **đã chốt NGUYÊN TẮC**: «**SUB-TAB ⇒ Phân loại theo BẢN CHẤT**» (`DECISION_LOG` L809–810 ✓) ⇒ ⭐ đề xuất `DEC-20261009-022` của S01 (6 khoá TAB + `work_others` ✓) **là CÁCH THỰC HIỆN nguyên tắc đó**, ⛔ không phải đề xuất mới ⇒ ⚠️ **chỉ còn cần user xác nhận ĐÚNG DANH SÁCH 7 khoá** ✓ (⚠️ không phải «có làm sub-tab hay không» ✓) ✓
> ⚠️ **Ghi nhận thêm**: `ActionRbacRegistry` **L368** khẳng định: `delete_work_item` **CHỈ khoá `work`** — ⛔ **KHÔNG** gắn `work_others` («xoá việc của NGƯỜI KHÁC» ⛔ không được phép) ✓ ⇒ ⭐ khớp với đo thật ở `TEST-20261009-042` ✓
