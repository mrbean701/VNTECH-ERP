# HANDOFF_LOG — SESSION_B (ERP-SESSION-02)

## HANDOFF-20261006-001
Date: 2026-10-06 | From: ERP-SESSION-02 | To: ERP-SESSION-01 (phien dang giu app/page.tsx) | Task: TASK-226
Reason: Phien nay can gom 7 muc menu -> 1 muc «Kho vat tu», ma menu duoc RENDER o app/page.tsx — tep phien 01 dang giu. NHUNG phien nay phat hien app/page.tsx:506/523 dung menu tu CHINH 2 mang trong lib/menu-helpers.ts => KHONG can sua app/page.tsx => KHONG can handoff thuc thi; ghi lai de phien 01 BIET va KHONG sua lib/menu-helpers.ts chong len.
Affected Files: lib/menu-helpers.ts (phien 02 DA SUA) · app/page.tsx (phien 02 KHONG sua)
Current State: lib/menu-helpers.ts da gom menu; app/page.tsx giu nguyen nhu phien 01 de lai (git diff: 117 them / 9 xoa — CUA PHIEN 01).
Required Action: KHONG can hanh dong. LUU Y: neu phien 01 can doi nhom menu KHO thi DOC lib/menu-helpers.ts TRUOC de khong ghi de.
Risk: Neu phien 01 sua lib/menu-helpers.ts dua tren ban CU (5 muc) thi se GHI DE viec gom menu => mat thay doi. Da ghi ro trong docs/dsh-state/SESSION_REGISTRY.md (muc RELEASE OWNERSHIP cua ERP-SESSION-02) de phien 01 doc duoc.
Status: OPEN (chi la thong bao — KHONG chan) | Completed By: — | Completed At: —

## HANDOFF-20261006-002
Date: 2026-10-06 | From: ERP-SESSION-02 | To: USER / phien van hanh cong nghiem thu | Task: Cong anh thi giac
Reason: Cong anh KHONG DAT 68/68 do anh chuan CU 5 NGAY (tools/baseline/ = 01/10 16:53:14) — xem BUG-20261006-005.
Affected Files: tools/baseline/** (68 PNG) · tools/probe-visual-regression.mjs (phien nay KHONG sua)
Current State: cong anh KHONG con gia tri phan biet; CHUA chay --update (CO Y — tranh che loi).
Required Action: CAN USER QUYET DINH — co cho phep chup lai anh chuan khong? Nen chup o trang thai DA DUOC USER XAC NHAN LA TOT.
Risk: Neu chup lai anh chuan KHI giao dien dang co loi chua phat hien thi cong anh se MAI MAI khong bat duoc loi do (mat kha nang hoi quy).
Status: OPEN | Completed By: — | Completed At: —

## HANDOFF-20261006-003
Date: 2026-10-06 | From: ERP-SESSION-02 | To: ERP-SESSION-01 | Task: BUG-20261006-006 — probe am thanh so sai man (3/17)
Reason: ERP-SESSION-01 da TU SUA `tools/probe-visual-regression.mjs` de fix 3 man `NO_CLICK_TARGET` (moc sua **17:12:48**).
  ERP-SESSION-02 da KIEM CHUNG CHAT doc ma nguon (Node + doc `app/screens/*.tsx`) ⇒ **2/3 DUNG, 1/3 SAI**, va DE XUAT 3 moi
  lam MOT NUA. Phien 01 DA DUOC HUONG DAN CU THE nhung (kiem luc 17:16:50) **CHUA SUA LAI**. ⇒ ghi handoff chinh thuc.
Affected Files: `tools/probe-visual-regression.mjs` (ERP-SESSION-01 sua — ERP-SESSION-02 KHONG sua)
Current State (kiem chuc 17:16:50):
  · Dong 196 van la `{ clickText: "tao phieu" }`  ⇒ **SAI**. Nhan nut THAT o `app/screens/Requests.tsx:105` la
    «＋ **Lập** phiếu đề nghị» ⇒ `norm` = `"lapphieuenghi"`; `norm("tao phieu")` = `"taophieu"` ⇒ **KHONG chua** ⇒ van `NO_CLICK_TARGET`.
  · Dong 383 van la `const nav = await clickSteps(screen.steps);` ⇒ gan `nav` nhung **KHONG dung de kiem**
    ⇒ o **che do so anh CHINH** hong dieu huong **VAN bi che** thanh «lech anh». (Chi dong 453 — che do `--crop` — moi co canh bao.)
  · Dong 453 chi `console.log` ⇒ **KHONG lam cong FAIL**.
Required Action (2 sua, dung nguyen van):
  1) Dong 196: `{ clickText: "tao phieu" }` → `{ clickText: "lap phieu" }`   // norm "lapphieu" ⊂ "lapphieuenghi"
  2) Dong 383, ngay sau `const nav = ...`:
       `if (nav !== "CLICKED_UI") { console.error(\`✗ ${screen.id}: dieu huong hong (${nav}) — BO QUA so anh\`); failures.push(screen.id); continue; }`
     ⇒ de cong THAT BAI THAT thay vi chup man nen.
  3) (Khuyen nghi) Dong 345: bo 1 dau gach cheo thua trong `/[\\u0300-\\u036f]/g` ⇒ hien tai KHONG bo dau
     (`"Tạo phiếu"` → `"taophie"`), chua lam sai ket qua nhung **ma de vo**.
Risk: Neu chi sua (1) ma khong sua (2) ⇒ cung van im lang khi selector chet lai; neu chi sua (2) ⇒ cung con 1 man hong.
Test Required: `node tools/probe-visual-regression.mjs --only=11-modal-request --locate=1` ⇒ can `nav 11-modal-request: CLICKED_UI`
  (⛔ KHONG chay `--update` — anh chuan con cu; xem HANDOFF-20261006-002).
Status: OPEN | Completed By: — | Completed At: —
