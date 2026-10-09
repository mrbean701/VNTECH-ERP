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
