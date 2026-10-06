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
