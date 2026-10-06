# TEST_LOG — SESSION_B (ERP-SESSION-02)

## TEST-20261006-001
Date: 2026-10-06 | Task: TASK-226 | Module: Warehouse | Test Type: UNIT
Scenario: Bo test khoi THUAN lib/warehouse-hub.ts (3 tab · 5 tab chi tiet · ngoai le director/admin · ton theo kho · cards · pham vi du an · subtab theo quyen).
Expected: Tat ca PASS. | Actual: 22/22 PASS.
Result: PASS | Regression: PASS | Environment: node --import tsx --test tests/warehouse-hub.test.mjs
Related Change: CHG-20261006-002 | Notes: khoi thuan => test duoc KHONG can browser.

## TEST-20261006-002
Date: 2026-10-06 | Task: TASK-226 | Module: Toan he thong | Test Type: REGRESSION
Scenario: npm run test:regression — toan bo bo test repo sau khi sua hub + gom menu.
Expected: 0 fail. | Actual: tests 803 · pass 802 · fail 0 · skipped 1.
Result: PASS | Regression: PASS | Environment: npm
Related Bug: BUG-20261006-001..004 | Related Change: CHG-20261006-001..004
Notes: Trong qua trinh lam co luc HONG 4 test vi hop dong w01/mt3-ui-29 ghim cau truc 5 muc cu => da CAP NHAT HOP DONG (KHONG noi cong — khang dinh moi MANH HON).

## TEST-20261006-003
Date: 2026-10-06 | Task: TASK-226 | Module: Frontend TypeScript | Test Type: UNIT (type-check)
Scenario: npx tsc --noEmit. | Expected: 0 loi. | Actual: EXIT=0.
Result: PASS | Regression: N/A | Environment: TypeScript 5.9

## TEST-20261006-004
Date: 2026-10-06 | Task: TASK-226 | Module: DevOps | Test Type: INTEGRATION (build)
Scenario: node tools/gd-cycle.mjs "TASK-226 HUB KHO VAT TU - 3 TAB + GOM MENU 7->1" (sau khi dung DUNG PID :8787 + :9000).
Expected: GD_EXIT=0 + fingerprint DAT + artifact DAT.
Actual: GD_EXIT=0 — migration 0329_* · SOURCE: VNTECH-FP-121300BEED7174E4 · FULL W2 SOURCE PREFLIGHT: DAT · VNTECH FINGERPRINT: DAT (716 file) · BUILT ARTIFACT VALIDATION: DAT · .local-data da khoi phuc.
Result: PASS | Regression: PASS | Environment: Node + Vite 8
Related Change: CHG-20261006-005
Notes: Bang chung deploy: asset CSS DOI HASH /assets/index-BjTKD8Zf.css (cu index-B3UZN44q.css) · bundle dist/server/ssr/assets/page-boWaSNuv.js chua warehouse_hub 3 lan (SSR KHONG minify).

## TEST-20261006-005
Date: 2026-10-06 | Task: TASK-226 | Module: Toan he thong | Test Type: REGRESSION (visual / cong anh)
Scenario: node tools/probe-visual-regression.mjs — 17 man x 4 kich thuoc = 68 anh, so voi tools/baseline/.
Expected: moi man lech <= 8 px.
Actual: KET LUAN: KHONG DAT — 68/68 anh lech · EXIT=1 · moi man lech 48-100%, ke ca man phien nay CHUA TUNG DUNG (01-dashboard · 02-project · 07-admin · 13-modal-material) · co man bao KICH THUOC ANH KHAC: chuan 1920x1080 vs nay 1920x9244.
Result: FAIL | Regression: FAIL | Environment: Chromium headless
Related Bug: BUG-20261006-005
Notes: CHAN DOAN GOC (da do): tools/baseline/ co 68 anh chuan, TAT CA cung moc 01/10/2026 16:53:14, hom nay 06/10 => anh chuan CU 5 NGAY => day la LECH HE THONG do anh chuan qua cu, KHONG phai 68 loi va KHONG do thay doi cua phien nay. KHONG chay --update (che loi) — phai do user quyet dinh va nen chup o trang thai DA BIET LA TOT. Lan chay dau tien con cho SO RAC (48-91%) vi UI :8787 da CHET luc do => bai hoc: cong anh lech hang loat >=50% MOI man => KIEM DICH VU TRUOC (HTTP 200?), dung ket luan loi giao dien.

## TEST-20261006-006
Date: 2026-10-06 | Task: TASK-226 | Module: Menu (Warehouse) | Test Type: INTEGRATION (bundle + render)
Scenario: (a) grep bundle SSR dist/server/ssr/assets/*.js (KHONG minify) tim ma cua muc menu moi;
  (b) chay lai probe CHI 1 MAN: node tools/probe-visual-regression.mjs --only=06-warehouse (4 anh) de xac nhan app RENDER duoc.
Expected: (a) warehouse_hub CO trong bundle · warehouse_allocate_return va warehouse_inbound KHONG con;
  (b) probe dang nhap duoc + chup duoc anh.
Actual: (a) warehouse_hub 3 lan trong dist/server/ssr/assets/page-boWaSNuv.js · warehouse_allocate_return 0 · warehouse_inbound 0;
  (b) Dang nhap admin HTTP 200 · chup duoc 4 anh (desktop/laptop/tablet/phone).
Result: PASS (cho (a) va (b)) | Regression: N/A | Environment: Node + Chromium headless
Related Change: CHG-20261006-001
Notes: (1) Nhan «Kho vat tu» grep trong bundle ra 0 lan la do UNICODE BI ESCAPE trong bundle — KHONG phai loi.
  (2) Da thu grep nhan menu trong HTML may chu render nhung login qua :8787/api/system tra 401 => HTML nhan duoc la
  TRANG DANG NHAP (7.123 ky tu) => khong co menu => grep 0 la DUNG, KHONG phai loi.
  (3) Probe 1 man van bao lech 86% — DONG NHAT voi ket luan BUG-005 (anh chuan cu 5 ngay), KHONG phai loi rieng man kho.
  (4) CHUA xac minh duoc bang MAT (visual) rang man hub hien dung — can user nghiem thu tren :9000.

## TEST-20261006-007
Date: 2026-10-06 | Task: TASK-226 | Module: Menu (Warehouse) | Test Type: UI (thu nghiem phuong phap)
Scenario: Xac minh nhan menu «Kho vat tu» bang cach grep HTML may chu render — thay vi phai mo trinh duyet.
Expected: HTML chua nhan menu => grep thay «Kho vat tu» va KHONG con nhan cu.
Actual: THAT BAI VE PHUONG PHAP. (a) Login http://127.0.0.1:8787/api/system => HTTP 401 (SAI CONG).
  (b) Doc tools/probe-visual-regression.mjs dong 30: const BASE = process.env.PROBE_BASE || "http://127.0.0.1:9000"
  => CONG DUNG la :9000 (proxy), KHONG phai :8787. (c) Login http://127.0.0.1:9000/api/system => HTTP 200 (DUNG).
  (d) NHUNG fetch :9000/ van tra 7.123 ky tu = TRANG DANG NHAP; va CA CAC NHAN MAN KHAC cung 0 lan
  («Tong quan dieu hanh» 0 · «Quan ly du an» 0) => HTML nhan duoc KHONG PHAI trang app.
Result: FAIL (phuong phap) | Regression: N/A | Environment: PowerShell + proxy :9000
Related Change: CHG-20261006-001
Notes: KET LUAN — ung dung nay render MENU BANG JAVASCRIPT PHIA TRINH DUYET (SPA), HTML ban dau chi la shell + trang dang nhap
  => grep HTML KHONG BAO GIO thay menu. Day la GIOI HAN PHUONG PHAP, KHONG phai loi san pham.
  => Cach duy nhat xac minh duoc menu la TRINH DUYET (probe) — ma probe thi dang KHONG DUNG DUOC vi anh chuan cu 5 ngay (BUG-005).
  => Bang chung hien co cho thay doi menu: bundle SSR chua warehouse_hub 3 lan (TEST-006) + app render duoc (TEST-006).
  => NGHIEM THU CUOI CUNG PHAI DO USER THUC HIEN TREN :9000.

## TEST-20261006-008
Date: 2026-10-06 | Task: TASK-226 | Module: Menu (Warehouse) | Test Type: UI (xac nhan gioi han phuong phap — lan cuoi)
Scenario: Thu lan CUOI de grep menu tu HTML: dung COOKIE TUONG MINH thay vi -WebSession
  (nghi -WebSession khong gui cookie qua proxy :9000).
Expected: HTML > 20.000 ky tu (trang app that) va grep thay «Kho vat tu».
Actual: (a) Set-Cookie: mep_session=36cab6e0-...; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400
  (b) Gui cookie tuong minh qua header Cookie => HTML VAN 7.123 ky tu = TRANG DANG NHAP.
Result: FAIL (phuong phap) | Regression: N/A | Environment: proxy :9000
Related Bug: BUG-20261006-005
Notes: KET LUAN DUT DIEM — HTML may chu cua app nay la SHELL (7.123 ky tu) BAT KE co phien hop le hay khong,
  vi MENU DUOC RENDER BANG JAVASCRIPT PHIA TRINH DUYET. => grep HTML VINH VIEN KHONG the xac minh menu.
  => Da thu het 3 cach khong can trinh duyet: (1) :8787/api/system => 401 sai cong; (2) :9000/api/system + -WebSession
  => van trang dang nhap; (3) :9000/api/system + cookie tuong minh => van trang dang nhap. CA 3 DEU THAT BAI VE PHUONG PHAP.
  => CACH DUY NHAT: TRINH DUYET (probe) — ma probe dang KHONG DUNG DUOC vi anh chuan cu 5 ngay (BUG-005).
  => KET LUAN: NGHIEM THU CUOI CUNG BAT BUOC DO USER THUC HIEN TREN :9000. ⛔ Day KHONG phai loi san pham.
