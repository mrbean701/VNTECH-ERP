# BUG_HOTFIX_LOG — SESSION_B (ERP-SESSION-02)
> 4 bug dau la LOI CO SAN trong repo (KHONG do phien nay tao ra) — phien nay PHAT HIEN + SUA.

## BUG-20261006-001
Date: 2026-10-06 | Module: Warehouse | Feature: Card kho | Severity: MEDIUM | Source: INTERNAL_TEST
Problem: Card kho hien UUID (vd WH_dc5b5734-...) thay vi TEN KHO; nhan loai kho luon sai.
Impact: Nguoi dung KHONG nhan ra kho nao la kho nao — thong tin dinh danh SAI.
Root Cause: Inventory.tsx doc w.warehouseName / w.warehouseCode / w.warehouseType — 3 truong KHONG TON TAI trong data.warehouses[] (payload that chi co id · code · name · type · projectId · parentWarehouseId) => roi ve gia tri du phong la id (UUID).
Fix: Dung dung ten truong that w.name / w.code / w.type (qua warehouseCards() trong khoi thuan).
Files Changed: app/screens/Inventory.tsx · lib/warehouse-hub.ts
Test: TEST-20261006-002 | Regression: PASS | Verification: do tren payload that (12 kho) | Status: FIXED
Related Task: TASK-20261006-226 | Related Change: CHG-20261006-004

## BUG-20261006-002
Date: 2026-10-06 | Module: Warehouse | Feature: Tim kiem / sap xep / xuat Excel danh sach kho | Severity: HIGH | Source: INTERNAL_TEST
Problem: Tim kiem kho KHONG chay · sap xep kho KHONG chay · xuat Excel: cot Ma kho / Ten kho RONG.
Impact: KHONG the tra cuu kho khi co nhieu kho; tep Excel xuat ra VO DUNG.
Root Cause: Cung goc BUG-001 — ham loc/sap xep/xuat doc truong KHONG TON TAI (warehouseName/warehouseCode) => moi so khop deu undefined.
Fix: Loc/sap xep/xuat theo name / code THAT.
Files Changed: app/screens/Inventory.tsx
Test: TEST-20261006-002 | Regression: PASS | Verification: tim theo ten + ma deu tra dung ket qua | Status: FIXED
Related Task: TASK-20261006-226 | Related Change: CHG-20261006-004

## BUG-20261006-003
Date: 2026-10-06 | Module: Warehouse | Feature: Nhan loai kho | Severity: MEDIUM | Source: INTERNAL_TEST
Problem: Nhan loai kho luon hien thi «Kho to doi» cho moi kho.
Impact: Phan loai kho tren man hinh SAI => nguoi dung hieu nham loai kho.
Root Cause: Doc w.warehouseType (KHONG ton tai) => luon roi ve nhanh mac dinh.
Fix: Anh xa w.type that: central -> «Kho Tong» · site -> «Kho du an» · transit -> «Kho trung chuyen».
Files Changed: app/screens/Inventory.tsx · lib/warehouse-hub.ts
Test: TEST-20261006-002 | Regression: PASS | Verification: do tren payload that (1 kho central + 5 kho site) | Status: FIXED
Related Task: TASK-20261006-226 | Related Change: CHG-20261006-004

## BUG-20261006-004
Date: 2026-10-06 | Module: Warehouse | Feature: Chi so «So phieu xuat» tren card kho & modal | Severity: HIGH | Source: INTERNAL_TEST
Problem: «So phieu xuat» LUON = 0 cho moi kho => thong tin SAI (nguoi dung tuong kho chua xuat gi).
Impact: Ra quyet dinh sai dua tren chi so sai.
Root Cause: Code loc data.issues.filter(r => r.warehouseId === w.id) — nhung data.issues[] KHONG co truong warehouseId (do that: chi co id · issueNo · projectId · teamId · projectCode · teamName · issuedAt · status · receivedByName · itemCount · totalQty · installedQty) => mang loc LUON RONG.
Fix: BO chi so SAI khoi card; o MAN CHI TIET KHO loc theo DU AN cua kho va GHI RO NGUON + GIOI HAN TREN UI («Phieu xuat/nhap KHONG co truong kho => loc theo DU AN cua kho ... — KHONG phai «phieu cua rieng kho»»).
Files Changed: app/screens/Inventory.tsx
Test: TEST-20261006-002 | Regression: PASS | Verification: doi chieu ten truong that cua issues[] | Status: FIXED
Related Task: TASK-20261006-226 | Related Change: CHG-20261006-004
Notes: Bai hoc: cung mot ten truong co the CO o danh sach nay va KHONG CO o danh sach khac (receipts[] CO warehouseName, con issues[] thi KHONG co warehouseId) => KHONG duoc suy dien.

## BUG-20261006-005
Date: 2026-10-06 | Module: DevOps | Feature: Cong chan hoi quy thi giac | Severity: HIGH | Source: INTERNAL_TEST
Problem: Cong anh bao KHONG DAT — 68/68 anh lech (48-100%), EXIT=1.
Impact: Cong nghiem thu thi giac KHONG con gia tri phan biet — KHONG the dung de xac nhan «khong doi hinh thuc».
Root Cause: tools/baseline/ chua 68 anh chuan, TAT CA cung moc 01/10/2026 16:53:14 — trong khi hien tai la 06/10/2026 => anh chuan CU 5 NGAY; giua 2 moc co hang tram thay doi cua nhieu phien (110 muc master task + app/page.tsx cua phien khac + viec cua phien nay). Bang chung day la lech HE THONG: MOI man deu lech, ke ca man phien nay CHUA TUNG DUNG; va co man bao KICH THUOC ANH KHAC: chuan 1920x1080 vs nay 1920x9244 (thay doi toan cuc ve chieu dai trang).
Fix: CHUA sua — CHO USER QUYET DINH. KHONG chay --update (cap nhat anh chuan) vi lam vay la CHE LOI. De xuat: chup lai anh chuan o mot trang thai DA DUOC USER XAC NHAN LA TOT, roi moi dung lai cong anh.
Files Changed: (chua — cho quyet dinh)
Test: TEST-20261006-005 | Regression: FAIL | Verification: do moc thoi gian 68 anh chuan | Status: OPEN
Related Task: TASK-20261006-226
Notes: Lan chay cong anh DAU TIEN cho SO RAC vi UI :8787 da CHET luc do. Bai hoc: cong anh lech hang loat >=50% tren MOI man => KIEM DICH VU TRUOC (HTTP 200?), dung ket luan loi giao dien.

## BUG-20261006-006
Date: 2026-10-06 | Session: ERP-SESSION-02 (phat hien boi sub-agent 93fb6719) | Module: DevOps | Feature: Cong chan hoi quy thi giac — dieu huong | Severity: HIGH | Source: INTERNAL_TEST
Problem: 3/17 man cua cong anh AM THAM SO SAI MAN — `11-modal-request` · `16-modal-receipt` · `18-modal-team-create` deu tra
  `NO_CLICK_TARGET` (modal KHONG mo) nhung cong van chup MAN GOC roi so voi anh chuan => bao «lech anh» thay vi bao loi dieu huong.
Impact: Cong bao lech gia; nguoi doc tuong loi giao dien trong khi thuc chat la CONG hong dieu huong => chan doan sai huong.
Root Cause: (a) selector `.list-toolbar-actions button.primary` KHONG con ton tai — `app/components/ui/ListToolbar.tsx:90`
  render `<div className="row-actions list-toolbar-primary">`; nut that nam trong prop `actions` (`app/screens/Requests.tsx:104-105`, `app/screens/Inventory.tsx:489`).
  (b) Man 18: nut «Them to doi» do `CardHead` render nhung CHI nam trong nhanh `orgTab===1` (`app/page.tsx:2831`) => `clickText` khong tim thay.
  (c) ⭐ Cổng CHỈ in `nav` ở chế độ `--locate/--crop/--update`; ở chế độ SO ẢNH thì KHONG in va KHONG kiem => hong dieu huong bi CHE.
Bang chung «so sai man»: so px cua man 11 TRUNG KHOP TUYET DOI voi man 08-requests (1.888.207 / 905.537 / 601.660 / 210.691);
  man 16 gan trung man 06-warehouse.
Fix: ⛔ CHUA sua — can user cho phep (⛔ phien nay khong duoc sua ma nguon). De xuat: sua 3 selector + cho cong THAT BAI khi `nav != OK`.
Files Changed: ⛔ (chua)
Test: TEST-20261006-005 | Regression: N/A | Verification: chay `--locate` tung man, doi chieu so px | Status: OPEN
Related Task: TASK-20261006-226

## BUG-20261006-007
Date: 2026-10-06 | Session: ERP-SESSION-02 (phat hien boi sub-agent 93fb6719) | Module: Documentation | Feature: Tai lieu ghi FALSE GREEN | Severity: HIGH | Source: INTERNAL_TEST
Problem: `docs/agent-progress/MASTER_STATUS.md:426` (P3-UI-17) va `docs/agent-progress/TASK_INDEX.md:160` (MT3-F14) ghi
  «68 anh chup lai + doi chieu **0 px lech**» — trong khi anh chuan thuc te chi la **5 anh TRUNG NHAU** (deu la trang setup).
Impact: Tai lieu ghi nhan mot cong XANH GIA => moi nguoi tin rang hinh thuc da duoc xac minh, thuc te CHUA BAO GIO duoc xac minh.
Root Cause: commit `7fdf71d` (27/09/2026, "MT3: menu items to tabs") thay TOAN BO 68 anh chuan bang anh chup luc CSDL CHUA khoi tao;
  buoc doi chieu sau do so **setup-vs-setup** => 0 px lech. Chinh dong tai lieu do TU THU «xac minh bang mat KHONG THE».
Bang chung: 68 tep -> chi **4 hash** theo viewport; `01-dashboard__desktop.png` · `07-admin__desktop.png` · `17-modal-po__desktop.png`
  = CUNG sha256 `ae2f7cc0…`; `git log -- tools/baseline` xac nhan `7fdf71d` thay ca 68; truoc do (`4d1c129`, 26/09) moi viewport co 15 blob KHAC nhau.
Fix: ⛔ CHUA sua — de xuat DINH CHINH 2 dong tai lieu tren (⛔ khong phai bang chung DAT).
Files Changed: ⛔ (chua)
Test: TEST-20261006-005 | Regression: N/A | Verification: hash 68 tep + git log | Status: OPEN
Related Bug: BUG-20261006-005
