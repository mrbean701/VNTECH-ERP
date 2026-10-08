# SHARED_TODO — SHARED
> File SHARED — phan biet ro theo session. KHONG danh dau task phien khac DONE.

## ERP-SESSION-02
- [x] TASK-226 — HUB «Kho vat tu» 3 tab (KHO · XUAT & NHAP · CAP PHAT & HOAN TRA)
- [x] TASK-226 — Tab KHO: dashboard ton kho + cards kho (Ten · Ma · Du an · Ton hien tai)
- [x] TASK-226 — Ngoai le director/admin (+IT) xem TAT CA kho; kho du an theo thanh vien
- [x] TASK-226 — MAN CHI TIET KHO (nut «Quay lai man KHO» + 5 tab)
- [x] TASK-226 — GOM 7 muc menu -> 1 muc «Kho vat tu»
- [x] TASK-226 — Sua 4 bug co san + 2 loi logic noi bo
- [x] TASK-226 — Cong: tsc 0 · regression 803·802·0 · BUILD GD_EXIT=0
- [ ] TASK-226 — User nghiem thu tren :9000 => chuyen VERIFIED
- [ ] TASK-226 — COMMIT (cho user cho phep — luat 25)
- [ ] BUG-20261006-005 — Anh chuan cong anh (cho user quyet dinh chup lai)
- [ ] Duy tri 9 loai log cho SESSION_B + cap nhat WEEKLY_REPORT_DATA

## ERP-SESSION-01

> ⭐ Pham vi: **PHAN QUYEN + BAO LOI + MUA HANG/GIAO NHAN** · ⭐ Cap nhat 2026-10-06 · ⭐ Chi tiet: `SESSION_A/TASK_LOG.md`

### ⭐ XONG — `VERIFIED` (4)
- [x] `TASK-20261006-002` — BUG-20261006-001 **danh sach bao loi RONG** moi tai khoan (`action()` khong tra payload ⇒ dung `requestApi`) — ⭐ **user xac nhan «da hien thi bao loi»**
- [x] `TASK-20261006-006` — BUG-20261006-006 **nut buoc 14 bi KHOA OAN** (⚠️ loi do chinh phien nay) ⇒ `isAdminUser(...) || hasAdminTab(...)` — ⭐ **user xac nhan**
- [x] `TASK-20261006-007` — **F2** `receive_goods` khong kiem trang thai PO — ⭐ **VERIFIED runtime** (HTTP 400 + dung thong diep + KHONG ghi du lieu)
- [x] `TASK-20261006-008` — BUG-20261005-005 **5 phieu ket `in_transit`** ⇒ da nhan duoc ca 5

### ⭐ XONG — `DONE` (4)
- [x] `TASK-20261006-001` — **9 ban va Java** + sua cong cu trien khai (dap **4 loi HTTP 500**) · nghiem thu 5/5
- [x] `TASK-20261006-009` — don **570 dong quyen mo coi** (2198→1628 · hop le KHONG doi · ⭐ chung minh ⛔ khong xoa dong nao cua `e2e.*`)
- [x] `TASK-20261006-010` — nghiem thu **E2E 8 bo** ⇒ **7/8 DAT · ⛔ KHONG regression**
- [x] `TASK-20261006-011` — **dieu phoi da phien** voi `ERP-SESSION-02` ⇒ chung minh `FILES A ∩ FILES B = ∅`

### ⭐ DA SUA — `FIXED` (cho user nghiem thu) (3)
- [ ] `TASK-20261006-003` — BUG-20261006-002 **dropdown «Nhom chuc nang» rong** (0/76 → **75 muc**) ⇒ cho user xac nhan
- [ ] `TASK-20261006-004` — BUG-20261006-003 **cap quyen VUOT phong ban** (bo chot `P5.3`) — **da trien khai** ⇒ cho user xac nhan
- [ ] `TASK-20261006-005` — BUG-20261006-004 + **-005** («bao loi luu» dem sai + thieu **«Chon tat ca»** + cot **«Ca dong»**) — ⭐ da chung minh CO trong bundle `:8787` va `:9000` ⇒ cho user nghiem thu

### ⚠️ DANG LAM — `OPEN` (1)
- [~] `TASK-20261007-001` — BUG-20261007-001 **«bam chon tat ca ⇒ bam luu ⇒ doi RAT LAU khong thay phan hoi»**
  - ⭐ **Da chan doan xong**: 1 loi goi = **11,50 GIAY** · «Chon tat ca» = **61 module** goi **TUAN TU** ⇒ **~11,7 PHUT** · ⛔ khong co tien do
  - ⭐ **Bang chung CSDL**: phong `BGD` — **55/61 module luu duoc** roi **DUNG GIUA CHUNG** (⚠️ 6 module chua)
  - ⚠️ **⛔ CHUA SUA XONG**: da thu **4 lan** sua o frontend, ca 4 lan bi **ESLint DO** ⇒ **da hoan nguyen ve ban goc** (⭐ `npm test` XANH)

### ⚠️ BLOCKER cua phien nay
- [ ] ⚠️ **Luat ESLint (React Compiler)** chan viec them TIEN DO vao `save()`/`deleteSelected()` — ⭐ **da tim ra nguyen nhan that** (⭐ xoa mat dong khai bao `let ok…` cua `deleteSelected()`) ⇒ ⭐ **nay da sua duoc**
- [ ] ⚠️ **Thieu quyen module tai khoan `e2e.*`** (5 module: `teams` · `warehouse_issue` · `approvals` · `stocktake` · `inventory`) ⇒ **33/76 bai E2E** bi 403 — ⚠️ **can user cho phep GHI CSDL**
- [ ] ⚠️ **Van tay nguon khong hop le** khi ca 2 phien con sua ⇒ chay lai `fixpoint-fingerprint.mjs` khi **CA HAI** dung
- [ ] ⛔ **COMMIT** — ⭐ user da noi «khong commit hay push trong thoi diem nay» ⇒ **13 tep cua phien** con tren dia

### ⭐ LOG CHUAN HOA `SESSION_A/`
- [x] `TASK_LOG.md` — **12 task** (du 13 truong §7)
- [x] `BUG_HOTFIX_LOG.md` — **9 bug** (du 13 truong §11 · ⭐ ghi ro 2 bug do chinh phien gay ra)
- [x] `WEEKLY_REPORT_DATA.md` — **tuan 2026-W41** (du 14 muc §14)
- [ ] `EVENT_LOG.md` · `DEV_LOG.md` · `CHANGE_LOG.md` · `TEST_LOG.md` · `DECISION_LOG.md` · `HANDOFF_LOG.md` — ⚠️ **dang ghi tiep**
- [ ] ⭐ **BUG-20261007-001** — ⭐ them TIEN DO (⭐ nay da biet nguyen nhan ESLint) VA/HOAC **sua BACKEND** (⭐ bo `syncDepartmentUsers` khoi moi lan luu ⇒ **11,5s → ~1s**)
- [ ] ⭐ Cho user nghiem thu 3 bug `FIXED` ⇒ chuyen `VERIFIED`

---

## ERP-SESSION-03

> ⭐ Pham vi (user 2026-10-07): **HOTFIX GO-LIVE theo thu tu FE → BE → DB** · ⭐ Chi tiet: `SESSION_C/TASK_LOG.md`

### ⭐ DA SUA — `FIXED` (cho user nghiem thu) (2)
- [ ] `TASK-20261007-C01` / `BUG-20261007-C01` — **modal «Sua ho so» → tab «Thong tin ca nhan» → sua CCCD**
  bao loi «Ma nhan vien, ho ten, ten dang nhap va phong/bo phan la bat buoc» ⭐ **DA TIM RA ROOT CAUSE + DA VA**
  - ⭐ **Nguyen nhan THẬT**: form **chi render tab dang mo** ⇒ o tai khoan roi khoi DOM ⇒ `update_user` nhan
    payload `{userId}` ⇒ `fullName` RONG; BE `UserManagementUseCase.java:115-125` — `fullName` la truong
    **DUY NHAT khong co fallback** (khac `employeeCode`/`username`) ⇒ **400** dung nguyen van thong diep.
  - ✅ **Ban va (FE-only)**: (a) chi goi `update_user` khi **tab tai khoan that su duoc gui**
    (`fd.has("fullName")`); (b) khi goi thi **luon du 5 truong**, rong ⇒ lay **gia tri hien co**;
    (c) dong bo tai khoan that bai ⇒ **khong dong modal** + bao trung thuc «ho so DA luu».
  - ⛔ ⚠️ **NO BE CHUA SUA** (co y, dung luat FE-first) ⇒ `HANDOFF-20261007-C02` cho `ERP-SESSION-01`.
- [ ] `TASK-20261007-C02` — **audit man To doi + luoc bo thong tin thua/rac** ⭐ **DA LAM**
  - ⭐ Go **15 cho** in ten bang/cot CSDL · khoa payload · ten action · duong dan tep ma nguon ra giao dien
    (card «Nguon du lieu cua 6 tab», dong `<p>` ghi nguon, cac `note`/empty-state, `<small>` ly do CSDL).
  - ✅ **GIU NGUYEN**: khoi du lieu `TM-PURE` (6 test hop dong trich ra chay that), 6 cot danh sach, 5 tab,
    quy tac sap xep TM-02, nut Xuat CSV (UTF-8/BOM), cac cong quyen.
- [ ] `TASK-20261007-C03` / `BUG-20261007-C02` — **AUDIT UTF-8 toan bo nut xuat Excel/CSV** ⭐ **DA LAM**
  - ⭐ Lap bang audit **13 duong xuat** (xem `SESSION_C/DEV_LOG.md` §C03) ⇒ **2/13 LỖI**.
  - ⛔ **Nguyen nhan THAT**: 2 **tep mau CSV tinh THIEU BOM UTF-8** ⇒ Excel (Windows) hien **SAI DAU**:
    `public/templates/Mau_Danh_Muc_Vat_Vu...` → chinh xac: `Mau_Danh_Muc_Vat_Tu_MEP_VNTECH.csv` (241 B)
    + `Mau_Gia_Tri_Doi_Chieu_BOQ_Hop_Dong_VNTECH_V5_1.csv` (1175 B).
  - ✅ **Da va**: them BOM ⇒ **244 B / 1178 B**; ⛔ khong doi noi dung. **Da publish**: ban phuc vu
    `:8787`/:9000` nay tra **244 B / 1178 B · BOM=True**.
  - ✅ **Cong moi** `tests/mt3-c03-export-utf8.test.mjs` (**5 ca**, co **DOI CHUNG AM**): quet de quy
    `public/**` bat buoc BOM; **chay that** XLSX (dung tep → giai nen → doc lai XML) chung minh UTF-8;
    chi `lib/tabular-export.ts` duoc phat `text/csv`.
  - ⚠️ Vi sao ton tai lau: `scripts/template-preflight.mjs` **DAT** nhung ⛔ **khong kiem BOM**.

### ⭐ Cổng đã chạy (SỐ ĐO ĐƯỢC — 2026-10-07)
- [x] `tsc` **0 loi** · `eslint` (moi tep sua/moi) **0 loi · 0 canh bao**
- [x] 9 tệp test hợp đồng của phiên 03: **60 test** (55 + 5 mới) · **0 fail**
- [x] `npm run test:regression`: **816 test · 815 pass · 0 fail · 1 skip** (exit 0)
- [x] `gd-cycle` **2 lần**: PREFLIGHT · FINGERPRINT · ARTIFACT **ĐẠT** (exit 0) ⇒ vân tay **`VNTECH-FP-B28418CE305E837E`** (722 files)
- [x] LIVE `:8787` **200** · `:9000` **200** (khởi động lại bằng PID riêng)
- [x] **Bundle đang phục vụ**: 2 chuỗi bản vá vòng 1 **CÓ** · 3 chuỗi rác **KHÔNG còn** · CSV mẫu **có BOM**
- ✅ **TRUNG THỰC**: cả 3 task đều `FIXED` — ⛔ **CHƯA** `VERIFIED` vì chưa có nghiệm thu của user
- [ ] `TASK-20261007-C04` / `BUG-20261007-C03` — **TRẠNG THÁI ĐƠN/PHIẾU HIỂN THỊ TIẾNG VIỆT (MT3 §IV.6)** ⭐ **DA LAM**
  - ⭐ **DO THAT truoc khi sua**: `partial_issued`→«Partial issued» · `issued`→«Issued» · `awaiting_po`→«Awaiting po» ·
    `posted`→«Posted» · `REWORK`→«REWORK» · `WAITING_SUPPLIER`→«WAITING SUPPLIER»; StatusBadge in nguyen `IN_PROGRESS`.
  - ✅ **4 NGUYEN NHAN GOC da bit**: ① bang nhan DUNG CHUNG thieu **15 ma** chuoi cung ung ·
    ② `StatusBadge` chi dich ma **chu thuong** ⇒ ma VIET HOA cua Cong viec lot nguyen ·
    ③ `lib/labels.ts` fallback ro ma tho — **ke ca 2 duong XUAT TEP** (`supply-docs` · `request-actions`) ·
    ④ `lib/report-catalog.ts` la ban `statusLabel` **thu ba** (Trung tam bao cao ro ma tho) ·
    ⑤ o loc trang thai dung nhan tu ma tho (`Delivered` · `Purchasing`).
  - ✅ **So bang nhan trang thai: 3 → 1** (nguon duy nhat `lib/status-labels.ts`; 2 bang PR/PO dac thu **giu co ly do** + da co fallback chung).
  - ⚠️ **Ton doc lai (neu thang)**: `priority` cua nhiem vu van in ma tho (`high`/`critical`) — **ngoai pham vi trang thai** ⇒ task sau.
  - ✅ Cong moi `tests/mt3-c04-status-vi.test.mjs` (**7 ca**, chay that bang esbuild).
  - ⛔ 2 ca `tests/v215-…` phai cap nhat (chung khoa **VI TRI** bang nhan) — **khong ha chuan**, xem `DEC-20261007-C06`.
- [ ] `TASK-20261007-C05` / `BUG-20261007-C04` — **HET MA TIENG ANH o UU TIEN + LOAI CON DAU** ⭐ **DA LAM**
  - ⭐ **DO TRUOC KHI SUA** (doi chieu o CHON trong form voi bang hien thi): ✅ **6 truong LUU NHAN TIENG VIET**
    (`benefitType` · `docType` cong van · `docType` VB phap ly · `contractType` lao dong · `costType`) ⇒ ⛔ **KHONG sua**
    (tranh doi nham chu da dung); ⛔ **2 truong LUU MA ANH**: `work_items.priority` (`critical|urgent|high|normal|low`)
    va `seals.seal_type` (`company|legal|signature|other`).
  - 🔴 **Phat hien kem (SAI NGHIEP VU, khong chi sai ngon ngu)**: ternary o `WorkCenter` **SOT `critical`**
    ⇒ viec **KHAN CAP** hien **«Thuong»** — nay het.
  - ✅ **Da va (REUSE)**: them domain `priority` (5 muc, khop tung chu voi `KANBAN_PRIORITIES`) + `seal_type` vao
    **bang nhan DUNG CHUNG**; va 5 cho hien thi (`ProjectDetailTabs` · `SealScreen` · `Requests` · `WorkCenter`×2).
    ⛔ **Khong xoa** `KANBAN_PRIORITIES` (con `tone`/`rank`; khoi thuan ⛔ khong duoc import) ⇒ thay bang **CONG KIEM**
    bat 2 bang khong lech nhan.
  - ✅ Cong C04 nay **10/10 PASS** (them 3 ca, gom **doi chung duong**: `critical` ⛔ khong duoc hien «Thuong»).
  - ⚠️ **NO FE da ghi HANDOFF**: `app/page.tsx:3110` in `contractType` du an dang ma `main`/`addendum`
    ⇒ `HANDOFF-20261007-C04` cho `ERP-SESSION-01` (⛔ phien 03 khong sua tep do).
- [ ] `TASK-20261007-C06` / `BUG-20261007-C05` — **MA THO UU TIEN TRONG TEP XUAT + MO RONG CONG SANG `lib/**`** ⭐ **DA LAM**
  - 🔴 **TU PHAT HIEN (lo hong PHAM VI QUET)**: vong 4 toi chi quet `app/screens/**` ⇒ **bo sot dung DUONG XUAT TEP**.
  - ⛔ **Nguyen nhan**: `lib/request-export.ts:25` tu dich Uu tien va **sot `critical`/`low`** ⇒ roi vao `text(value)`
    = **IN MA THO vao tep PDF/XLSX** cua phieu de nghi.
  - ✅ **Mo rong cong ⇒ bat them 2 cho**: `app/screens/RequestDrawer.tsx` (hien «Binh thuong» cho MOI ma la — sai nghiep vu)
    va `app/page.tsx` (⛔ thuoc S01 ⇒ `HANDOFF-20261007-C05`, ghi thanh **NO DA GIAO co ten** trong cong, in ra moi lan chay).
  - ✅ **Da va 2 cho trong quyen phien 03**; cong C04 nay **11 ca** (quet ca `app/**` + `lib/**`).
  - ⭐ **BAI HOC 1**: **`gd-cycle` la BAT BUOC** sau moi sua `lib/**`·`app/**`·`public/**` — do duoc: hoi quy
    **TRUOC build = 827/824/2 DO** (`v217-4/5`: cong bao «dist/ CU HON nguon») ⇒ **SAU build = 827/826/0 DO**.
  - ⭐ **BAI HOC 2**: mot cong chi manh bang **PHAM VI QUET** cua no.
  - ⚠️ **GHI NHAN**: baseline dinh danh dau vao build lan 5 la `0FFB3FBA…` (⛔ khong phai so phien 03 build truoc do
    `810CCA1455BD`) ⇒ **mot phien khac da build xen giua**. Van tay **HIEN HANH: `VNTECH-FP-852E28FC276F90F6`** (726 files).
- [x] `TASK-20261007-C07` — **CHUAN HOA `WEEKLY_REPORT_DATA` THEO §14** ⭐ `DONE` (17/17 muc + dinh chinh moc thoi gian)
- [x] `TASK-20261007-C08` — **CONG HOP DONG §22/§11 «TAB TRONG MODAL NHAT QUAN»** ⭐ `DONE` — ⛔ **KHONG SUA CSS**, chi KHOÁ
  - ⭐ **DO TRUOC**: moi bat bien **DANG DUNG** (`.edm-tabs` co dinh+wrap · `.edm-tabs button` `flex:1 1 auto` — **MOC 115 user** ·
    `.is-active` chi doi MAU ⇒ chieu cao ⛔ khong nhay · `.edm-body` `min-height:120px` · modal chan `88vh` ·
    **ban va §11 DA CO** · dai CAP TRANG van `flex: 0 0 auto` — **MOC 119b**).
  - ⛔⛔ **BẪY ĐÃ GHI 4 LẦN** (`TASK-156`·`212`·`213`·`214`): `canonical.css` ghi **«⛔ KHÔNG đụng `.edm-tabs`»**;
    `CHECKLIST.md`: «…lan thu **7** toi suyt "sua" thu dang dung» + **2 BAO DONG GIA** vi **mot thuoc do cho nhieu ho component**.
  - ✅ **Cong moi** `tests/mt3-c05-modal-tab-sizing.test.mjs` (**8 ca**, ⛔ 0 dong ma san pham doi): khoá bat bien + ⛔ cam 3 hanh vi
    pha hoai (doi `.edm-tabs button` sang `1 1 0` · dung selector bao trum `[role="tablist"]>button` · de ban va §11 ro ra dai cap trang).
  - ✅ **LIVE**: CSS dang phuc vu `:9000` (`index-BjTKD8Zf.css`, **393.497 ky tu**) CO rule §11 + `.edm-tabs button` nguyen ven.
  - ⚠️ **Bai hoc**: tai lieu cu ghi `flex: none` nhung **MA dang chay** ghi `flex: 0 0 auto` ⇒ luot chay dau cong bi DO vi toi viet
    ky vong theo TAI LIEU. ⭐ Goal §16: **nguon su that = ACTUAL CODE**. `test:regression` nay **835 test · 834 pass · 0 fail**. ⛔ khong can build.
- [ ] `TASK-20261007-C09` / `BUG-20261007-C06` — **TEP XUAT «DON HANG DA GIAO» HET MA TIENG ANH** ⭐ **DA SUA + DA BUILD**
  - ⛔ **Phat hien**: `lib/ui-shared.tsx::deliveredExportRows` dua **MA THO** `complete`/`missing`/`not_required` vao **CA XLSX LAN CSV**
    o 2 cot «Chung chi» (CO/CQ) va «Giay giao hang», trong khi `lib/request-export.ts` **da co** ban dich RIENG cho dung 3 gia tri do.
  - ✅ **Da va (REUSE)**: them **2 domain** `certificate_status` + `delivery_document` vao bang nhan DUNG CHUNG (tong **8 domain**);
    `certificateLabel`/`documentLabel` uy quyen bang chung; `deliveredExportRows` di qua `statusLabel(…, domain)`.
  - ✅ **Cong C04 nay 13 ca** (them 2 ca, gom **doi chung am**: cam truyen thang `row.certificateStatus` + cam con ban dich rieng).
  - ✅ **Coordination**: dung **dung PID** UI + proxy (⛔ khong dung Java) → `gd-cycle` lan 6 → khoi dong lai.
  - ✅ **Van tay MOI: `VNTECH-FP-723368DEBABF42EA`** (728 files) · `test:regression` **837 test · 836 pass · 0 fail** ·
    LIVE `:8787`/`:9000` **200** · cong du an **exit 0** («BAN CHAY DUNG BAN DA BUILD MOI NHAT»).
  - ⚠️ **Ton doc lai (neu thang)**: `deliveredExportRows` van xuat `receivedAt`/`bchConfirmedAt` dang **chuoi ISO tho** —
    can user quyet co doi sang `dd/mm/yyyy` khong (⛔ toi khong tu doi vi se lech voi cac tep xuat khac).
- [x] `TASK-20261007-C10` — **DO CHOT 2 YEU CAU GIAO DIEN** ⭐ `DONE` (⛔ 0 dong ma san pham doi)
  - ✅ **(a) MA ENUM TRONG TEP XUAT = DA SACH**: quet TOAN BO ham dung ban ghi xuat trong `lib/**` —
    `inventoryExportRows` + `paymentExportRows` ⛔ **khong co cot enum**; cac duong con lai da va (`C05`/`C09`/vong 3).
  - ⭐ **(b) NUT CRUD 1 HANG NGANG = DAT 14/16 man**. Cong du an bao «8 khoi nhieu HANG» nhung ⛔⛔ **CA 8 LA BAO DONG GIA**:
    ca 8 la **cung 1 ho** `.supplier-admin-row` (4 dong NCC × 2 man). **DO LAI bang cong cu THU HAI**
    (`tools/measure-supplier-row.mjs`): cao **44px** · `display:grid` · **`autoFlow:column`** · moi o cung `@603`
    ⇒ **12 o tren MOT DONG THAT** ⇒ la **hang DU LIEU**, ⛔ khong phai thanh nut.
  - ⭐ **Boi canh**: `MT2` **da sua** ho nay `1182×85 (3 hang) → 1182×59`; **nay 44px** ⇒ tot hon, ⛔ khong hoi quy.
  - ⛔ **KHONG SUA** (⭐ tranh bay «lan thu 7 suyt sua thu dang dung») ⇒ giao **`HANDOFF-20261007-C07`** de sua **CONG CU DO**
    (⛔ thuoc `tools/**` = ma dung chung).
  - ⭐⭐ **LUAT**: mot con so DO tu cong ⛔ **khong phai** mot loi ⇒ phai **do bang cong cu THU HAI** + **doc BAN CHAT khoi** truoc khi sua.
- [~] `TASK-20261007-C12` / `BUG-20261007-C07` — **MODAL «CHI TIET DON GIAO HANG»: 2 khoi Anh/Chung chi** ⚠️ **`OPEN` — CHUA TAI HIEN DUOC**
  - Nguon: ⭐ **user da bao** trong MASTER TASK 3 («muc Anh va ho so giao hang bi an, khong hien thi day du»).
  - ✅ **Dinh chinh tien de**: ⛔ KHONG phai bi an bang dieu kien render — ma CO render ca 2 khoi (kem `AttachmentPanel`).
  - ⭐ **Do TRUOC**: than modal dung `.drawer-body` (lop cua `.drawer`) trong khi khung la `.modal` ⇒ ⛔ thieu `flex:1 1 auto`
    va `min-height:0` (do: `flex:"0 1 auto"` · `min-height:"auto"`). → **Da va 1 dong class** (`drawer-body modal-body`) + build lan 7.
  - ⛔⛔ **DO LAI SAU VA ⇒ PHAN BAC KET LUAN CUA TOI**: CSS da dung (`flex:1 1 auto` · `min-height:0px`) nhung **BO CUC Y HET**
    (than `h=568` · `scrollH == clientH`) va **2 khoi user bao VAN NAM TRONG khung** (587 · 651 < day than 669) o CA HAI lan do
    ⇒ ⭐ **⛔ KHONG tai hien duoc** ⇒ **da HA trang thai `FIXED` → `OPEN`** (⛔ khong bao khong).
  - ✅ Giu viec ghep `modal-body` nhu **GIA CO** (dung nguyen tac; do duoc ⛔ khong doi bo cuc) — ⛔ **khong** ghi la da sua loi user.
  - ⭐ **Bai hoc (lan 4 cua phien)**: **chi so suy dien ⛔ KHONG thay duoc viec TAI HIEN hien tuong** (`biCat` bat nham **khoi BAO**).
  - ⚠️ **CAN USER**: man/duong di · kich thuoc cua so · anh chup · co nhieu tep hay khong ⇒ roi moi do lai duoc.
  - ✅ Cong moi `tests/mt3-c06-modal-body-scroll.test.mjs` (**4 ca**) · `test:regression` **841 test · 840 pass · 0 fail** · van tay **`VNTECH-FP-F3F8A0D3B0C85E17`** (730 files).
- [x] `TASK-20261007-C14` / `BUG-20261007-C07` — ⭐⭐ **TAI HIEN + SUA DUOC LOI USER** (grid co hang ⇒ CAT noi dung) ✅ `FIXED`
  - ⭐ **Doi CACH DO ⇒ TAI HIEN DUOC**: lan truoc do **hinh hoc khoi CHA** (⛔ khong thay loi); lan nay do
    **`scrollHeight` vs `clientHeight` CUA CHINH TUNG KHOI** ⇒ **7/8 khoi bi CAT** (cao **49,2031px**, noi dung **231–294px**)
    · `gridTemplateRows` giai ra 8 hang **~49px** (bi EP vua khung 568) · than `scrollHeight == clientHeight == 568` (⛔ khong thanh cuon).
  - **ROOT CAUSE**: `.drawer-section { overflow:hidden }` ⇒ **kich thuoc toi thieu tu dong = 0** ⇒ hang `auto` trong grid
    co **chieu cao xac dinh** bi **CO xuong vua khung** ⇒ cat noi dung ⇒ ⛔ **khong the toi**.
  - ✅ **VA cuc bo** `app/screens/ReceiptDrawer.tsx`: `style={{ gridAutoRows: "max-content" }}`. ⛔ **KHONG dung `globals.css`/`canonical.css`**
    (⭐ theo **canh bao cua user ve conflict** giua 3 phien).
  - ✅ **DO LAI**: «Anh va ho so giao hang» **49 → 279px** · «Chung chi / Tai lieu» **49 → 279** · «Anh giao hang» **49 → 279** · **`conCat = []` = 0 khoi con bi cat**.
  - ✅ **Cong moi** `tests/mt3-c08-modal-grid-clip.test.mjs` (**3 ca**) · `test:regression` **846 test · 845 pass · 0 fail** ·
    `gd-cycle` lan 8 **DAT** · van tay **`VNTECH-FP-AF5B84E9A7B25888`** (732 files) · cong du an **exit 0**.
  - ⏳ **CHO USER nghiem thu** (cuon thay du Anh + Chung chi) ⇒ moi len `VERIFIED`.
  - ⭐ **BAI HOC (lan 5)**: **DO SAI CHI SO = KET LUAN SAI** — dau hieu CAT nam **O TRONG khoi**, ⛔ khong o toa do khoi cha.
  - ⏳ **TON**: ra cung co che cho than `.drawer-body` (grid) trong **`.drawer`** — cong `C08-2` hien chi phu `.modal`.
- [x] `TASK-20261007-C15` — ⭐ **DONG LOP LOI «grid co hang ⇒ cat noi dung»** + CONG C08 LAM CHINH XAC ✅ `DONE`
  - ✅ **Quet toan bo** `app/**` + `lib/**`: chi **2** tep dung than `.drawer-body` (grid) — `ReceiptDrawer` (**da va**) va `PurchaseOrderDrawer`.
  - ✅ **Do LIVE tep thu 2** («Chi tiet don mua» qua nut `grn-source-po-open`): khung `entity-detail-modal` · than `.edm-body`
    `display=block` · `clientHeight=683 / scrollHeight=1985` ⇒ cuon duoc · khoi **1902px** khong cat · **`conCat = []`** ⇒ **AN TOAN**.
  - ⭐ **PHAN DINH HINH DANG**: `.drawer-body` la **CON TRUC TIEP** cua khung co chieu cao xac dinh ⇒ ⛔ CAT;
    `.drawer-body` **long trong `.edm-body`** (block, cao theo noi dung) ⇒ ✅ AN TOAN. ⇒ **lop loi DA DONG** (chi 1 cho nguy hiem, da sua).
  - ⚠️ **Cong lam CHINH XAC (3 → 4 ca)**: `C08-2` bo cach kiem **theo TEP** (qua tho ⇒ se bao dong gia) ⇒ chi bat **mau NGUY HIEM**;
    them `C08-2b` **khoa hinh dang AN TOAN** (`.edm-body` phai giu `overflow-y:auto`, ⛔ khong `display:grid`).
  - ⚠️ **Cong bat duoc CHINH TOI**: luot dau `C08-2b` DO vi **phep trich cua toi** bat trung mot **CHU THICH** co chu `.edm-body`
    ⇒ bai hoc: **bo chu thich TRUOC khi trich CSS bang indexOf** (da ghi vao chinh ca kiem).
  - ✅ `test:regression` **847 test · 846 pass · 0 fail** · cong C08 **4/4** · cong du an **exit 0** · ⛔ **khong can build** (chi sua `tests/**`).
- [i] 📌 **TUYEN BO MOI CUA USER (07/10/2026)**: **MT1 + MT2 phan bi bo qua DA XONG · MT3 DA ROLLBACK** ⇒
  ⭐ **chi HOTFIX GO-LIVE**, ⛔ khong lam theo checklist MT cu; uu tien **loi user bao** + loi that do duoc.
- [x] `TASK-20261007-C18` — ✅ **DO CSDL THAT ⇒ BIT 3 MA CHUA CO NHAN** + **KHOA SNAPSHOT 21 NHAN** ✅ `FIXED`
  - ⭐ **PHEP DO MOI**: quet **62 cot trang thai** (`information_schema`) → `SELECT DISTINCT` (**chi doc**) → tung gia tri qua **bang nhan dung chung** (esbuild).
    **KET QUA**: 22 gia tri · **3 RO TIENG ANH**: `bch_confirmation_status=confirmed` («Confirmed») · `qc_status=accepted` («Accepted») · `=passed` («Passed»).
  - ⚠️ **DO TIEP ⇒ ⛔ CHUA RO RA MAN HINH**: **5 call site** (`Inventory` · `PurchaseOrderDrawer`×2 · `ReceiptDrawer`×2 · `page.tsx`)
    **deu dich TAY** ⇒ phan loai dung: **LO HONG TIEM AN + TRUNG LAP 5 CHO** (⛔ khong phai loi dang thay).
  - ✅ **VA TAI NGUON**: them **2 domain** `bch_confirmation` + `qc_result` (tong **10 domain**) — ⛔ **KHONG** dua vao
    `DOMAIN_LOOKUP_ORDER` (chua ma **dung chung** `pending`/`rejected` ⇒ tra cheo se **DOI NHAN noi khac** ⇒ HOI QUY). ⛔ khong sua 5 call site (§41).
  - ✅ **Cong moi C09** (`tests/mt3-c09-status-coverage.test.mjs`, **4 ca**) · `test:regression` **851 test · 850 pass · 0 fail** ·
    `gd-cycle` lan 9 **DAT** · van tay **`VNTECH-FP-F3C1C8BA4CECE009`** (735 files) · cong du an **exit 0** · LIVE `:8787`/`:9000` **200**
    · bundle co nhan MOI va ⛔ khong mat nhan CU.
  - ⚠️ **TU DINH CHINH 2 LAN**: snapshot dau toi **doan** ⇒ sai `complete` (that «Đã có») va `in_progress` (that «Đang xử lý»).
    ⭐ **LUAT: snapshot PHAI DO, ⛔ khong viet theo tri nho**.
  - ⏳ **CHO USER** (⚠️ thay doi nay **⛔ khong doi gi nhin thay** — la **phong ngua tai nguon** + **khoa hoi quy**).
- [x] `TASK-20261007-C19` — ✅ **DINH DANG NGAY `dd/mm/yyyy`** (va 4 cho in tho) + **CONG C10** ✅ `FIXED`
  - **Do duoc**: 4 cho **IN NGAY THO** ra bang/the — `Payments.tsx` (**2 cho**: cot «Ngay» + «Den han: …») ·
    `DocumentsScreen.tsx` (cot «Ngay chung tu») · `ProjectTeams.tsx` (ngay thanh toan) ⇒ man hinh hien **`2026-10-07`**
    trong khi moi noi khac hien **`07/10/2026`** (`date()` = `Intl.DateTimeFormat("vi-VN")`) ⇒ ⚠️ khong nhat quan.
  - ⭐ **DAU HIEU CHI MANG**: **ca 3 tep DA `import date` nhung GOI 0 LAN** ⇒ quen dung (⛔ khong phai thieu tien ich).
  - ✅ **VA**: boc `date(...)` cho 4 cho (⛔ khong them import · ⛔ khong doi du lieu · ⛔ khong doi `<input type="date">`).
  - ✅ **Cong moi C10** (`tests/mt3-c10-date-format.test.mjs`, **4 ca**, co **doi chung am**) · `test:regression` **855 test · 854 pass · 0 fail** ·
    `gd-cycle` lan 10 **DAT** · van tay **`VNTECH-FP-344D1DA5553CCA1E`** (737 files) · cong du an **exit 0**.
  - ⛔ **XAC MINH DOM SONG: KHONG HOAN THANH DUOC** — thu 2 luot khong toi duoc man vi
    ⭐ **nhom menu «TAI CHINH – KE TOAN» ⛔ KHONG render muc con** khi bam ⇒ ⏳ **cho user nhin man «So thanh toan hop dong»/«Chung tu»**.
  - ⚠️ **CAN LAM RO (vong sau)**: nhom menu «TAI CHINH – KE TOAN» co muc con hay khong (gioi han probe hay loi that).
  - ⭐ **BAI HOC**: **bam nhan NHOM menu ⛔ khong dieu huong** ⇒ muon ket luan cho MOT man phai **kiem `h1/h2`** sau khi bam.
- [x] `TASK-20261007-C20` — ⭐ **XAC MINH DOM SONG XONG** + **DINH CHINH «nhom menu rong»** ✅ `DONE`
  - ✅ **(a) XAC MINH LIVE**: man «**Thanh toan HD**» (⭐ kiem `h1` = "Thanh toan HD") ⇒ dem `innerText`:
    **ISO `yyyy-mm-dd`: 0** · **`dd/mm/yyyy`: 4** (mau `30/06/2026` · `15/02/2026`) ⇒ ⭐ `TASK-C19` chuyen **`FIXED` → `VERIFIED`**.
  - ⛔⛔ **(b) DINH CHINH PHAT HIEN CUA CHINH PHIEN 03**: «nhom **TAI CHINH – KE TOAN** khong co muc con» la
    ⭐ **GIOI HAN CUA PROBE**, ⛔ **KHONG phai loi UI** — nhom co **7 muc con THAT** (Ke hoach thanh toan · Tam ung/Hoan ung ·
    Chi phi Ban chi huy · So quy & Ngan hang · Chung tu ke toan · Thanh toan/Quyet toan · Thanh toan HD),
    chi hien khi mo nhom bang **`button.nav-parent`** (chevron) cho `aria-expanded="true"` (⛔ bam NHAN nhom thi khong mo).
    ⇒ ⚠️ **bao dong gia thu 6** cua phien ⇒ ⛔ **khong sua gi** · ⛔ khong canh bao CRITICAL.
  - ⭐ **CACH LAM DUNG**: mo nhom bang **`button.nav-parent`** · xac nhan **`aria-expanded="true"`** · sau khi bam muc **kiem `h1/h2`**.
  - ⚠️ **HE QUA**: cac luot «quet 22 man» truoc **mot phan do lai man cu** ⇒ ⛔ khong dung con so do nhu bang chung tuyet doi;
    ✅ nhung ket luan **«lop loi cat noi dung da dong» VAN DUNG** (dua tren **ho khoi `.kpi` do tren man THAT DA TOI**).
- [x] `TASK-20261007-C21` — ⭐ **NANG MUC HANDOFF-C10 (loi `.kpi` la HE THONG)** + ⛔ **DUNG SWEEP sau 5 lan thu** ✅ `DONE`
  - ⭐ **PHAT HIEN MOI**: **MAN THU 3** cung ho loi cat the KPI — «**KPI & hieu suat nhan vien**»: `kpi-green 156/164` · `kpi-red 156/164` (**cat 8px**).
    ⇒ ho `.kpi` bi cat o **≥ 3 man** ⇒ ⭐ **SUA 1 CHO (quy tac `.kpi` trong CSS) LA HET CHO CA 3+ MAN** — ⛔ khong sua tung man.
    ⚠️ Viec sua nam o **CSS dung chung** ⇒ ⛔ phien 03 khong tu sua (theo canh bao conflict cua user).
  - ✅ **Man MOI toi duoc**: «**Bao cao tong hop**» (bam «Bao cao & canh bao») ⇒ **SACH** (0 khoi cat · 0 loi van ban).
  - ⛔⛔ **DUNG SWEEP SAU 5 LAN THU** (ghi thang): ① button/a → 8 muc · ② lop cu → 7 muc · ③ moi `.sidebar *` + bam **theo CHI SO** → 1 man
    · ④ **theo VAN BAN** khop chinh xac → 5 man (nhan **co SO DEM** nhu «Trung tam phe duyet**7**») · ⑤ **bo chu so** → 3 man (lan nhan NHOM ⇒ bam nhom khong dieu huong).
  - ⭐ **CACH DUNG**: doi chieu theo **`h1` MAN DICH** (⛔ khong theo nhan menu) · hoac `data-nav-key` · hoac cong `tools/probe-visual-regression.mjs` (+ lam moi anh chuan).
  - ⚠️ **TU BAO LOI SUA TEP LOG**: khi chen §C22 vao `TEST_LOG.md` toi **xoa nham tieu de §C21** + **dao thu tu C22/C21** ⇒ da **sua ngay** (khoi phuc tieu de + hoan vi 2 khoi; kiem lai `C21@57203 < C22@60062`, moi tieu de 1 lan) ✅.
  - ⛔ **0 thay doi ma san pham** ⇒ cong du an **exit 0** (`344d1da5553cca1e`) · 3 dich vu dang nghe.
- [x] `TASK-20261007-C22` — ⭐ **CHOT ROOT CAUSE `.kpi`** + CHO SUA + **TIEN LE TRONG REPO** ✅ `DONE`
  - ⭐ **DO CHUOI CHA**: the `.kpi` `clientHeight=201`/`scrollHeight=210` (**cat 9px**) · `overflow:hidden` · dai cha `display:grid`
    `gridTemplateRows=203.203px` · `kids=4` · `overflow-y=hidden` ⇒ **ROOT CAUSE**: `.kpi { overflow:hidden }` ⇒ **kich thuoc toi thieu tu dong = 0**
    ⇒ **hang `.kpi-grid` bi CO xuong vua khung** ⇒ cat 8–9px — ⚠️ **CUNG CO CHE** voi `BUG-20261007-C07` (modal GRN).
  - ⭐⭐ **TIEN LE TRONG CHINH REPO**: `.approved-kpi-grid .kpi .kpi-content p { white-space:normal!important; overflow:visible!important; min-height:2.7em!important }`
    ⇒ ⭐ **TAI DUNG CACH DO** cho `.kpi-grid` mac dinh (⛔ khong phat minh cach moi — §17 REUSE); huong 2: `grid-auto-rows: max-content`.
  - ⛔ **KHONG SUA**: CSS o **`app/globals.css`** (dung chung) + markup dai KPI o **`app/page.tsx`** (**LOCK S01**) ⇒ da ghi day du **`HANDOFF-20261007-C10`** (kem **test do duoc**).
  - ⚠️ **TU BAO LOI LAN THU 2**: `edit` cua toi lai **xoa mat tieu de muc ke tiep** (`## HANDOFF-20261007-C11`; lan truoc `## TEST-20261007-C21`)
    vi **`new_string` khong chep lai tieu de nam trong `old_string`** ⇒ **da khoi phuc + kiem cau truc** (11 tieu de, `C10 < C11`, moi cai 1 lan;
    TEST_LOG `C21 < C22 < C23`, 0 manh vun) ⇒ ⭐ **da ghi LUAT vao `SHARED_STATE` §72** (⛔ khong lap lan 3).
- [x] `TASK-20261007-C23` — ⛔⛔ **THU HOI `HANDOFF-C10`**: «cat chu KPI» la **SUY DIEN SAI** (thu pham = **hoa tiet trang tri**) ✅ `DONE`
  - ⭐ **PHEP DO QUYET DINH** — do **TUNG CON** trong the `.kpi` (⛔ khong chi do the): phan tu **DUY NHAT** vuot day the la
    **`<i>` RONG** (`txt=""`) cao **4px**, `position:static`, `display:block`, vuot **8px / 5px / 5px** tren 3 the.
  - ⭐ **DANH TINH**: `.kpi-mini-columns i { width:5px; min-height:4px; border-radius:2px 2px 0 0; background:currentColor }`
    ⇒ **cot cua BIEU DO MINI TRANG TRI** (⚠️ `.kpi-sparkline` da bi `display:none!important`) ⇒ ⛔ **KHONG co CHU nao bi cat**.
  - ⛔⛔ **TU THU HOI**: toi tung noi «ho `.kpi` CAT chu mo ta — LOI HE THONG, uu tien cao» (vong 15/20/21/22 + Telegram) ⇒ **SAI**.
    ⭐ **LOI PHUONG PHAP**: dung `scrollHeight > clientHeight` lam bang chung «cat noi dung» roi **suy dien** ra «cat CHU».
  - ✅ **DA CHAN HAU QUA**: chen khoi **«⛔ DUNG SUA `.kpi` THEO HANDOFF NAY»** duoi tieu de `HANDOFF-C10`
    ⇒ ⛔ **KHONG** them quy tac `.kpi-content p`, ⛔ **KHONG** `grid-auto-rows: max-content`, ⛔ **KHONG dung `.kpi`/`.kpi-grid`**.
    ⚠️ **NGOAI LE**: neu **USER nhin thay CHU bi hut** (kem anh chup) ⇒ mo lai handoff.
  - ⚠️ **CHUA DO TUONG TU** cho `Trung tam phe duyet` (`171/179`) va `KPI & hieu suat NV` (`156/164`) ⇒ ⛔ khong ket luan «cat chu».
  - ⭐ **LUAT MOI (`SHARED_STATE` §73)**: **`scrollHeight > clientHeight` ⛔ KHONG chung minh «noi dung bi cat»** —
    phai **do TUNG CON** + **doc `textContent`**: **co CHU** moi la loi; **RONG/hoa tiet** ⇒ **cat la CO Y**, ⛔ khong sua.
- [x] `TASK-20261007-C13` — **KHU VUC «ANH VA HO SO GIAO HANG»: CONG DU AN BAO DO OAN** ⭐ `DONE`
  - Chay cong du an `tools/probe-task075-attachments.mjs`: **21/22 DAT · HONG duy nhat `D2`**. ⚠️ **MOI ca duong ong DAT**:
    API tra tep · tai tep **trung tung byte** · dung chu ky PNG · khong cookie ⇒ **401** · doi chung du lieu hong.
  - ⭐ **DO LAI ⇒ `D2` DO OAN**: cong doi khop **nguyen van** `src={`/api/files?id=${encodeURIComponent(file.id)}`}` ≥2 lan;
    trong `lib/ui-shared.tsx` chuoi do **0 lan**, nhung `/api/files?id=${encodeURIComponent(` co **6 lan**, trong do
    **3 la the `<img>`** (dai anh `(id)` · o thu nho `String(file.id)` · xem truoc `String(preview.id)`) ⇒ **y nghia ca DA THOA**.
  - ⛔ **KHONG sua ma san pham cho vua chuoi** (luat vong 7/9/11) · ⛔ **khong** sua `tools/**` ⇒ giao **`HANDOFF-20261007-C09`**.
  - ✅ **Cong MOI khoa DUNG y nghia**: `tests/mt3-c07-attachment-imgs.test.mjs` (**2 ca**, bo khop **dung sai** + **doi chung am**
    ghi lai chuoi cong cu = 0) ⇒ ⛔ khong ai doi ma cho vua chuoi.
  - ⭐ **MAU HINH LAP LAI (lan 3 cua phien)**: cong khop **chuoi nguyen van** / **co dieu kien** ⇒ **DO OAN** (D2 · probe-toolbar 8 khoi)
    va **XANH RONG** (probe-responsive) ⇒ **con so tu cong ⛔ khong phai loi, ⛔ cung khong phai bang chung** (SHARED_STATE §40).
  - ⚠️ **`BUG-20261007-C07` VAN `OPEN`** — chinh cong ghi **GIOI HAN: khong do phan render UI** ⇒ ⛔ khong dung ket qua nay de dong bug user.

### ⚠️ ĐANG CHỜ
- [ ] ⭐ **USER nghiệm thu 2 task** trên `:9000` ⇒ mới chuyển `VERIFIED` (⛔ chưa có bằng chứng cuối)
- [ ] ⭐ **USER chốt phương án nợ BE** (`HANDOFF-20261007-C02`): ① cho `fullName` fallback như 2 trường kia,
      hay ② tách thông điệp **nêu đích danh** trường thiếu → rồi giao `ERP-SESSION-01` thi hành
- [ ] ⛔ **COMMIT** — chưa commit (luật user: không push/commit trong giai đoạn này) ⇒ 4 tệp sửa + 1 tệp test MỚI
      + `docs/dsh-mutil-session/SESSION_C/**` còn trên đĩa
- [ ] Duy trì 9 loại log cho `SESSION_C` + cập nhật `WEEKLY_REPORT_DATA` khi có kết quả nghiệm thu

---

## ERP-SESSION-04 (`SESSION_D`) — AUDIT & KẾ HOẠCH (2026-10-08)

> ⭐ Phạm vi: **TÀI LIỆU/AUDIT (read-only)** — ⛔ không giữ tệp sản phẩm nào · ⛔ không commit/push

### ⭐ XONG (2)
- [x] `TASK-20261008-D01` — Báo cáo kế hoạch go-live & phát triển lõi MEP → `docs/37_KE_HOACH_GO_LIVE_VA_PHAT_TRIEN_LOI_MEP_20261008.md`
- [x] `TASK-20261008-D02` — **Audit JOBS & PROJECT** → `docs/38_AUDIT_JOBS_PROJECT_20261008.md` (11 phát hiện + 8 việc T-01…T-08)
- [x] Log phiên: `SESSION_D/` đủ **9/9** + `README.md` · APPEND vào 2 sổ đăng ký + `SHARED_TODO`

### ⛔ ĐANG CHỜ (⛔ phiên 04 tự làm phần này được)
- [ ] **6 phép đo runtime** (`SESSION_D/TEST_LOG.md` §TEST-...1.1) — ⛔ chặn bởi **shell harness hỏng** (`@deepseek-ai/dsh-scope`)
- [ ] Xác nhận `P-01`/`P-02` bằng **phép thử thật** (user thường ⇒ 403 · director `set_project_status` ⇒ 403)
- [ ] Đo UI: mục «Quản lý dự án» có hiện/mở đúng `ProjectManagement` (**P-07**) · 2 mục «Phòng ban»/«Giao việc» có highlight đôi (**J-01**)

### ⭐ GIAO CHO PHIÊN KHÁC (chi tiết `SESSION_D/HANDOFF_LOG.md` → `HANDOFF-20261008-D01`)
- [ ] **S01** — `T-02` (FE: 2 chỗ ngày ISO thô dự án, `app/page.tsx`) · `T-03` (FE: disable + tooltip đúng lý do quyền cho CRUD dự án) · `T-05` (BE: khai module cho 4 action dự án + `set_project_status` + `update_project` `canUse→canEdit`)
- [ ] **S02** — `T-04` (FE: `active` key riêng cho «Phòng ban»/«Giao việc`) · `T-07` (ẩn 22 màn `dept_plan_*`/`dept_project_*` mỏng khỏi menu go-live)
- [ ] **USER quyết 5 câu** (`docs/38` §7): module nào cho CRUD dự án · ai đóng/mở dự án · 4 tệp mồ côi (A/B/C) · «4 thẻ tổng hợp» (A/B) · ẩn 22 màn phòng ban
- [ ] **USER + 3 phiên** — hợp nhất commit theo **danh sách tệp từng phiên** (⛔ **không** `git add -A`) — `X-01`

### ⚠️ CẢNH BÁO PHIÊN 04 GỬI CẢ CỤM
1. ⛔ **KHÔNG dùng 4 cổng probe** làm bằng chứng (`probe-responsive-5widths` **xanh rỗng** · `probe-toolbar-vertical` **8 báo động giả** · `probe-task075` D2 **đỏ oan** · `probe-action-registry-coverage` **6 mù quyền giả**).
2. ⛔ **2 bug RBAC dự án** (`BUG-20261008-D01/D02`) mới chỉ **chứng minh bằng đọc mã** — ⛔ **đừng** ghi `FIXED`/`VERIFIED` khi chưa có phép thử.
3. ⚠️ Sửa RBAC theo hướng **mở ra** ⇒ **BẮT BUỘC** kèm **đối chứng âm** (user không quyền vẫn 403) — bài học MỐC 110 §7.

### ⚠️ BỔ SUNG 08/10/2026 — sau `TASK-20261008-D03` (đính chính + tầng cổng quyền)
- [x] **ĐÍNH CHÍNH P-01/P-02**: nguyên nhân thật là **`requireRequireAdmin`** ở controller (`SystemController.java:281-302`), ⛔ không phải «khai module rỗng» → `docs/39_DINH_CHINH_AUDIT_TANG_CONG_QUYEN_20261008.md`
- [x] Ghi **quy tắc 2 tầng cổng quyền** vào `SHARED_STATE` §73′ (⛔ cả cụm phải đọc trước khi kết luận 403)
- [ ] 🆕 **`BUG-20261008-D03` (P-08, HIGH — nghi vấn)**: 12 action mồ côi thật — **danh mục vật tư (7)** · **tổ đội (2)** · **lịch trình duyệt (3)** ⇒ 403 cho mọi tài khoản không phải admin. **Cần 4 phép thử + đối chứng âm** (`docs/39` §5) trước khi sửa → đề xuất giao **S01** (tệp `ActionRbacRegistry.java` = LOCK S01)
- [ ] 🚨 **BLOCKER hạ tầng**: profile DSH `web` **thiếu gói `@deepseek-ai/dsh-scope`** (đã grep 5.119 đường = 0) ⇒ shell chết ⇒ ⛔ cả cụm không chạy được cổng/UI ⇒ **cần user sửa profile** trước mọi vòng kiểm định
- [ ] Đo lại số mồ côi **bằng script** (`65 rỗng − 10 public − N admin-gate`) — ⛔ không tái sử dụng con số 19 của 30/09/2026
