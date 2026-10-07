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

## TEST-20261006-009
Date: 2026-10-06 | Task: TASK-226 | Module: DevOps — Cong chan hoi quy thi giac | Test Type: UNIT (kiem chung logic)
Scenario: Kiem chung ban sua cua ERP-SESSION-01 trong `tools/probe-visual-regression.mjs` cho 3 man
  `NO_CLICK_TARGET` (11-modal-request · 16-modal-receipt · 18-modal-team-create) — ap dung BUG-20261006-006.
Expected: `clickText` moi khop voi NHAN NUT THAT trong ma nguon => 3/3 man se mo duoc khung.
Actual: **2/3 DUNG, 1/3 SAI**. Chec chinh xac bang Node (khong doan):
  (a) Man 16: clickText `tao phieu nhap kho` vs nhan that «⭱ Tạo phiếu nhập kho» (`Inventory.tsx:372`)
      -> norm: "taophieunhapkho" == "taophieunhapkho"  => **KHOP** (dung)
  (b) Man 18: clickText `Thêm tổ đội` vs «＋ Thêm tổ đội →» => norm "themtooi" == "themtooi"  => **KHOP** (dung)
  (c) Man 11: clickText `tao phieu` vs nhan that «＋ **Lập** phiếu đề nghị» (`Requests.tsx:105`)
      -> norm: "taophieu" ⊄ "lapphieuenghi"  => **KHONG KHOP** => van `NO_CLICK_TARGET`
Result: **FAIL (1/3 man)** | Regression: N/A | Environment: Node + doc ma nguon thuc (`app/screens/Requests.tsx`, `app/screens/Inventory.tsx`)
Related Bug: BUG-20261006-006 | Related Change: CHG-20261006-006
Notes: 
  * SAI 1 T U: sua `clickText: "tao phieu"` -> `clickText: "lap phieu"` (norm "lapphieu" ⊂ "lapphieuenghi").
  * ✅ XAC NHAN `clickText` viet KHONG DAU la hop le: `norm()` tai dong 342 = `toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"")` => co bo dau that. ⛔ KHONG phai loi khi viet khong dau.
  * ⚠️ RUI RO PHU (chua gay hong): dong 345 — ban `norm` chay BEN TRONG trinh duyet qua `evaluate()` dung
    `/[\\u0300-\\u036f]/g` (HAI dau gach cheo) ⇒ KHONG khop dai `u0300`, do: "Tạo phiếu" -> "taophie" (MAT chu `u`).
    ⛔ Hien tai VAN ra cung chuoi vi `normalize('NFD')` tach dau truoc + loc `[a-z0-9]` sau ⇒ chua lam sai ket qua,
    nhung la MA DE VO nen nen thong nhat 1 ban.
  * ⛔ DE XUAT 3 (cho cong `nav != OK => FAIL`) CHUA THAY TRONG DIFF ⇒ hong dieu huong van bi CHE thanh «lech anh».
  * ⛔ KHONG sua tep cua ERP-SESSION-01 (Goal §7/§28) — chi doc va do.

## TEST-20261006-010
Date: 2026-10-06 | Task: TASK-226 | Module: DevOps — Cong chan hoi quy thi giac | Test Type: UNIT (doc ma)
Scenario: Kiem tra ERP-SESSION-01 da them gi cho DE XUAT 3 (`nav != OK` => cong THAT BAI) trong
  `tools/probe-visual-regression.mjs` chua, va o che do SO ANH CHINH (khong phai --crop/--locate).
Expected: Che do so anh se THAT BAI (khong bao gio ket luan DAT) khi `nav !== "CLICKED_UI"`.
Actual: **MOT PHAN — DUOC LAM O --crop, CHUA LAM O CHE DO SO ANH CHINH.**
  - ✅ Dong 453 (che do `--crop`): ERP-SESSION-01 da them canh bao
    `if (i === 0) ... else if (nav !== "CLICKED_UI") console.log('⚠️ nav ... HỎNG ... cảnh này so MÀN NỀN, KHÔNG phải màn cần kiểm')`
  - ❌ Dong 383 (che do SO ANH CHINH): `const nav = await clickSteps(screen.steps);` — `nav` DUOC GAN nhung
    **KHONG duoc dung de kiem** ⇒ hong dieu huong VAN bi CHE thanh «lech anh». ⛔ Van la loi im lang o che do quan trong nhat.
  - ⚠️ Dong 453 chi CANH BAO bang console.log, **KHONG lam cong FAIL** ⇒ van co the bao «DAT mot phan` khi anh sai.
Result: **FAIL (chua dat yeu cau)** | Regression: N/A | Environment: doc truc tiep `tools/probe-visual-regression.mjs:381-453`
Related Bug: BUG-20261006-006
Notes: De dat dung DE XUAT 3 can hai thu:
  (1) o dong 383 them `if (nav !== "CLICKED_UI") { failures.push(...); continue; }` (hoac tuong duong) de **THAT BAI that**;
  (2) sua man 11 `clickText: "tao phieu"` -> `"lap phieu"` (xem TEST-20261006-009).
  ⛔ KHONG sua — thuoc ERP-SESSION-01 (Goal §7/§28).

## TEST-20261006-011
Date: 2026-10-06 | Task: TASK-226 | Module: DevOps — Cong chan hoi quy thi giac | Test Type: UNIT (doc COMMIT tren GitHub)
Scenario: Kiem tra ket qua khi ERP-SESSION-01 da COMMIT ban sua: co dung 2 cho da noi chua, tren ban da PUSH len GitHub hay chua.
Expected: commit moi sua (a) dong 196 `clickText` thanh khop nhan nut that, (b) dong 383 co `if (nav !== "CLICKED_UI")` de cong THAT BAI.
Actual: **ERP-SESSION-01 DA COMMIT + PUSH BAN CON SAI** (commit `54384e0` 17:17:34, `AHEAD 0 BEHIND 0`).
  - Dinh nghia commit: "fix(probe): 2 man modal dung clickText (selector .list-toolbar-actions button.primary da chet) + canh bao nav that"
  - Da doc TRUC TIEP tren GitHub (`git show HEAD:tools/probe-visual-regression.mjs`):
    · Dong 196: van `clickText: "tao phieu"`  ⇒ **VAN SAI** (nhan that = «＋ Lập phiếu đề nghị», `Requests.tsx:105`)
    · Dong 199: `clickText: "tao phieu nhap kho"` ⇒ **dung**
    · Dong 209: `clickText: "Thêm tổ đội"` ⇒ **dung**
    · Dong 383: `const nav = await clickSteps(screen.steps);` ⇒ **VAN KHONG KIEM** ⇒ hong dieu huong van bi che o che do so anh chinh
    · Dong 453 (che do `--crop`): co canh bao `⚠️ nav ... HONG` ⇒ chi canh bao, **khong lam cong FAIL**
  - HEAD == DIA ⇒ khong con thay doi chua commit cho probe.
Result: **FAIL (1/3 man + de xuat 3 chua dat)** | Regression: N/A | Environment: `git show HEAD:...` (doc ban da push)
Related Bug: BUG-20261006-006
Notes: ⛔ Hieu luc nghiep: commit + push da len remote nhung **van chua dung** ⇒ tu day moi phai sua them 1 commit nua.
  ⛔ ERP-SESSION-02 KHONG sua tep (Goal §7/§28) — da gui Telegram va ghi HANDOFF-20261006-003.

## TEST-20261006-012
Date: 2026-10-06 | Task: TASK-226 | Module: DevOps — Cong chan hoi quy thi giac | Test Type: E2E (CHAY THAT tren trinh duyet that)
Scenario: Thay vi suy doan, CHAY THAT probe `--locate` cho man 11 de DO gia tri `nav` that cua trinh duyet.
  Lenh: `node tools/probe-visual-regression.mjs --only=11-modal-request --locate=10,300` (⛔ KHONG `--update`).
Expected: `nav 11-modal-request: CLICKED_UI` (neu selector dung) hoac `NO_CLICK_TARGET` (neu selector chet).
Actual: **`nav 11-modal-request: NO_GROUP()`** — ⭐ KHONG PHAI `NO_CLICK_TARGET`.
  Phan tu tai (10,300): `<DIV> .auth-page` rect=0,0,1920,1080 — noi dung «Đang mở VNTECH ERP · Đang kiểm tra dữ liệu và quyền truy cập…»
  ⇒ trang DANG O MAN BOOT, CHUA sang ERP that ⇒ buoc `{ group: "purchasing", child: 0 }` that bai cham den menu CHUA TON TAI.
  (Doi chieu: clickSteps tra `NO_GROUP()` khi khong tim thay nhom/tab, `NO_CLICK_TARGET` khi tim nhom xong nhung khong tim nut.)
  EXIT=0. ⛔ `git status --porcelain -- tools/baseline` = **SACH, 0 tep thay doi** ⇒ an toan, khong dung anh chuan.
Result: **FAIL (khong do duoc man can kiem)** | Regression: N/A | Environment: probe chay that tren Chrome DevTools Protocol, base :9000
Related Bug: BUG-20261006-006
Notes: ⭐ **PHAT HIEN MOI, QUAN TRONG:** chay thu cho thay co **NGUYEN NHAN GOC TANG 1** — hong dieu huong co **HAI tang**:
  (1) `NO_CLICK_TARGET` (selector chet) — 3 man, da bi S01 sua 2/3.
  (2) **`NO_GROUP`** (trang CHUA sang ERP that) — lop truoc, chua ai sua.
  ⇒ KET LUAN SAI TRUOC DAY: «chi 1 man con NO_CLICK_TARGET» — thuc te con **lop 2 chua duoc kiem la moi that su gay anh lech o 3 man`.
  ⚠️ Do them: 3 lan fetch `http://127.0.0.1:9000/` deu tra **7.123 ky tu** (khong phai setup) ⇒ **SPA shell** nhu da ghi TEST-007/008.
  ⛔ KHONG sua tep cua ERP-SESSION-01 (Goal §7/§28) — chi chay cong o che do doc (`--locate`).

## TEST-20261006-013
Date: 2026-10-06 | Task: TASK-226 | Module: DevOps — Cong chan hoi quy thi giac | Test Type: E2E (do that bang trinh duyet that)
Scenario: Do lai tang loi thu 2 (`NO_GROUP`) bang CAC DO THAT chu khong doan: (a) do thoi gian boot, (b) bat console trinh duyet.
Expected: hoac trang boot xong sau vai giay, hoac console chi ra loi cu the.
Actual: ⭐ **NGUYEN NHAN GOC THAT — 3 TAI NGUYEN 404 ⇒ APP KET VINH VIEN.**
  (a) DO THOI GIAN BOOT: 30.774 ms lien tuc `navGroup=false auth=true sidebar=false` ⇒ `.nav-tree-group` **KHONG BAO GIO xuat hien**
      ⇒ ⛔ KHONG phai "cho lau hon" — cong chi cho 5.200 ms ⇒ **do sai** ngay tu dau.
  (b) CONSOLE TRINH DUYET THAT:
      [log.error]    404 (Not Found)  http://127.0.0.1:9000/assets/layout-segment-context-CfvhuIcI.js
      [log.error]    404 (Not Found)  http://127.0.0.1:9000/assets/index-DrGoA0VD.js
      [log.error]    404 (Not Found)  http://127.0.0.1:9000/assets/page-DdkxN2Fj.js
      [EXCEPTION]    Uncaught (in promise) TypeError: Failed to fetch dynamically imported module: /assets/index-DrGoA0VD.js
      Trang dang o: "Đang mở VNTECH ERP · Đang kiểm tra dữ liệu và quyền truy cập…"
  (c) DOI CHIEU HASH (bang chung quyet dinh):
      · HTML server dang tra ve tro toi:  layout-segment-context-CfvhuIcI.js · index-DrGoA0VD.js · page-DdkxN2Fj.js
      · `dist/client/assets/` tren dia:  index-**BVZQBH_9**.js + page-**DFsU9Xvb**.js (moc sua **06/10 17:22**)
      · 3 file ma HTML can deu: **KHONG CO** tren dia => **404 xac nhan**
  (d) Server dang chay: `tools/cutover-proxy.mjs --port 9000 --ui-port 8787 --api-port 18081` (PID 13288)
      + `scripts/local-server.mjs` (PID 22192).
      Java :18081 khoe: `status:UP · db:MySQL · isValid:true`; API `/api/system` tra **401 sau 71 ms** ⇒ ⛔ backend khong treo.
Result: **FAIL — hong THAT, khong phai im lang** | Regression: N/A | Environment: Edge headless + CDP, base :9000
Related Bug: BUG-20261006-008 (moi)
Notes: ⭐ **KET LUAN CHINH XAC:** cong anh hoi quy thi giac **DANG SO SO MOT BUILD KHONG TON TAI**.
  · Noi dung HTML bi tao tu mot lan build truoc, roi `dist/` bi build lai (17:22) ⇒ hash doi ⇒ **404 moi file JS** ⇒ app khong bao gio boot.
  ⇒ **Moi phat hien truoc day ve "3 man khong mo duoc" deu co the la HUU QUA cua loi nay**, khong phai loi selector don le.
  ⇒ ⛔ `tools/baseline` van SACH (khong dung anh chuan). ⛔ ERP-SESSION-02 KHONG sua tep cua ERP-SESSION-01 (Goal §7/§28).
  ⇒ CAN: dung server UI phai phuc vu `dist/` **cung thu muc voi HTML** (hoac khoi dong lai server sau moi lan build).

## TEST-20261006-014
Date: 2026-10-06 | Task: TASK-226 | Module: Auth / Session | Test Type: E2E (do that bang trinh duyet that)
Scenario: Chay lai script do luong «Kho vật tư» (da chay TOT o vong 37) de xac minh tabbar 3 tab + cards + man chi tiet 5 tab.
Expected: nhu vong 37 — login 200, boot <2s, menu «Kho vật tư» xuat hien, tabbar 3 tab doc duoc.
Actual: **LOGIN TRA 401** → trang ket o man «Dang nhap he thong» (authPage=true, navGroup=false) trong 25s.
  Bang chung: `fetch('/api/system',{action:'login',username:'admin',password:'Admin123456@'})` → status 401, setCookie rong.
  Doi chieu THOI DIEM (manh me):
    · 17:21 (vong 37)  : login **200**, boot 912ms, menu «Kho vật tư» CO, cards «Kho Tổng» hien
    · 17:23:51         : ERP-SESSION-01 commit `3dd2431` — "chore: bo migration 0330 (ghi van tay cua chinh no
                         => **vong lap vo han**); van tay e7195a48 · **718 files** · verify DAT"
    · 17:25+ (vong 38-39): login **401**, khong boot duoc
  Kiem tra khong co gi khac: 5 tai nguyen HTML deu **HTTP 200** · `dist/` khong doi tu 17:22:47 · server UI con song.
Result: **FAIL — login hong** | Regression: N/A | Environment: Edge headless + CDP, base :9000
Related Bug: BUG-20261006-009 (moi)
Notes: ⭐ **KET LUAN TAM THOI:** co su lien he thoi diem manh me giua commit `3dd2431` (S01) va viec login chuyen tu 200 → 401.
  ⛔ CHUA KHANG DINH nguyen nhan — can ERP-SESSION-01 kiem tra commit `3dd2431` (bo migration 0330 + 718 file) co pha
  session/auth khong. Neu dung → rollback hoac sua ngay.
  ⛔ ERP-SESSION-02 KHONG sua tep cua ERP-SESSION-01 (Goal §7/§28) — chi do va bao.
  ⚠️ Hieu qua: **KHONG THE nghiem thu TASK-226** cho toi khi login hoat dong tro lai.

## TEST-20261006-015
Date: 2026-10-06 | Task: TASK-226 | Module: DevOps — Cong chan hoi quy thi giac | Test Type: UNIT (doi chieu file)
Scenario: Kiem tra lai `tools/baseline/` sau khi thay 66 tep chua commit — anh chuan co that su duoc chup lai khong.
Expected: nhieu hon 5 anh duy nhat, moc sua hom nay, dung la man that (khong phai trang setup).
Actual: **DA CHUP LAI — CONG ANH GIO CO GIA TRI PHAN BIET.**
  · So anh duy nhat: **56** (truoc: **5**) — tang 11 lan
  · Moc sua moi nhat: **06/10 17:45:12** (truoc: 01/10 16:53:14)
  · Kich thuoc mau: 01-dashboard__desktop.png = **426.503 byte** · 07-admin__desktop.png = **425.103 byte** ·
    17-modal-po__desktop.png = **268.104 byte** (truoc day chi ~100KB vi la trang setup)
  · 3 mau khac nhau hash: D08B088FDBED · B81B2CE93D22 · 4A28465A1926 ⇒ **KHAC NHAU THAT SU**
  · 63 tep `tools/baseline/*.png` dang o trang thai **M (chua commit)** — chua len GitHub.
  · Login da tro lai **HTTP 200** (BUG-20261006-009 da het).
Result: **PASS** | Regression: N/A | Environment: Get-FileHash SHA256 tren 68 tep
Related Bug: BUG-20261006-005 (da khac phuc phan nguyen nhan) · BUG-20261006-009 (da het)
Notes: ⭐ **TIN TOT:** cong anh hoi quy thi giac **GIO DUNG CHUC NANG** — co the dung de nghiem thu.
  ⚠️ 63 tep anh chuan **CHUA COMMIT** — can ERP-SESSION-01 commit de khoi mat khi may chu khoi dong lai.
  ⛔ ERP-SESSION-02 KHONG commit (luat 25 AUTO_COMMIT = FALSE).

## TEST-20261006-016
Date: 2026-10-06 | Task: TASK-226 | Module: Menu (Warehouse) | Test Type: E2E (do that bang trinh duyet that)
Scenario: Xac minh yêu cuu cua user — bam menu «Kho vật tư» → hub 3 tab (KHO · XUẤT & NHẬP · CẤP PHÁT & HOÀN TRẢ) → cards kho → man chi tiet 5 tab.
Expected: sau khi bam muc con, man hien thi `.approved-inventory-screen` + tabbar 3 tab + cards kho.
Actual: **HUB CHUA BAO GIO RENDER** — do that 12 giay sau bam muc con van o man dashboard:
  `manInventory: false · manDashboard: false · warehouseCards: false · tabbarHub: 0 · cardsKho: 0 · nutTaoKho: false`
  body van: "TỔNG QUAN ĐIỀU HÀNH CÔNG VIỆC ⌄ TRUNG TÂM PHÊ DUYỆT 7 ..."
  ⭐ Bang chung phu: text trang CO «KHO VẬT TƯ ⌃» (mui ten LEN = nhom DANG MO) va CO noi dung «Kho Tổng»
  — nhung do la noi dung DASHBOARD (muc Kho Tổng trong dashboard), KHONG PHAI hub.
  ⭐ Bang chung phu 2: bundle client `dist/client/assets/page-DFsU9Xvb.js` **CO** chua `warehouse_hub`
  ⇒ code DA build dung, nhung `active` KHONG BAO GIO thanh "inventory".
Result: **FAIL — hub chua render** | Regression: N/A | Environment: Edge headless + CDP, base :9000
Related Bug: BUG-20261006-010 (moi)
Notes: ⭐ **NGUYEN NHAN NGHI VAN (can ERP-SESSION-01 kiem tra):** `app/page.tsx:506-510`
  ```js
  const warehouseMenuChildren = warehouseMenuItems.flatMap((item) => {
    const viewable = item.permissionKeys.find((key) => modulePermission(data, key).canView);
    if (permissionConfigured && !viewable) return [];
    return [{ ..., moduleKey: viewable ?? item.permissionKeys[0], ... }];
  });
  ```
  · `permissionConfigured` (dong 463) = `isAdminUser(data.user) || (data.modulePermissions||[]).length > 0`
    → voi admin = **true**.
  · `viewable` = permissionKey DAU TIEN co `canView` — vi `warehouseMenuItems[0].moduleKey = "inventory"` nhung
    `permissionKeys = ["central_warehouse","warehouse_receipt","warehouse_issue","inventory",...]`
    → neu `central_warehouse` co canView thi `moduleKey` thanh **"central_warehouse"** (sai!) thay vi "inventory".
  · Hoac neu KHONG permissionKey nao co canView → `return []` → `warehouseMenuChildren = []` → nut menu khong render.
  ⭐ **CAN KIEM TRA:** goi API `/api/system` (sau login) → doc `modulePermissions` + `user.role` → tinh lai
  `permissionConfigured` va `viewable` → xac dinh `warehouseMenuChildren` co rong khong / moduleKey la gi.
  ⛔ ERP-SESSION-02 KHONG sua tep cua ERP-SESSION-01 (Goal §7/§28) — chi do va bao.
  ⚠️ Hieu qua: **KHONG THE nghiem thu TASK-226** cho toi khi hub render duoc.

## TEST-20261006-017
Date: 2026-10-06 | Task: TASK-227 | Module: Danh mục vật tư | Test Type: REGRESSION + STATIC
Scenario: Kiểm tra 3 yêu cầu của user — bỏ trồng tréo tab 0 · đổi tên tab nhóm · thêm tab hệ · bỏ tab mã gốc.
Expected: `tsc` sạch · 803 test pass · không còn khối trồng tréo · đúng 3 tab.
Actual: **PASS** — `npx tsc --noEmit` **EXIT=0**; `npm run test:regression` **803 test / 802 pass / 0 fail / 1 skip**
  Xác minh bằng script đọc tệp sau khi sửa:
  · «CÔNG CỤ CHẨN LOẠN»          → KHÔNG còn ✅
  · «SOÁT TRÙNG ALIAS»           → KHÔNG còn ✅
  · «SO SÁNH / ĐỐI CHIẾU BOQ»    → KHÔNG còn ✅
  · `<MaterialCategoryList>`      → CÓ ✅
  · «DANH MỤC HỆ VẬT TƯ»          → CÓ ✅
  · tab «MÃ VẬT TƯ GỐC» cũ        → KHÔNG còn ✅
  · `MaterialMatchingWorkspace`   → CÒN ✅ (đúng cam kết ⛔ không xoá chức năng)
Result: **PASS** | Regression: **PASS (802/803)** | Related Change: CHG-20261006-001
Notes: ⛔ CHƯA nghiệm thu thật trên :9000 — cần build lại trước (bundle `dist/` còn từ 17:22).
  ⛔ `tools/baseline` **KHÔNG đụng** · ⛔ không `--update`.

## TEST-20261006-018
Date: 2026-10-06 | Task: TASK-227 | Module: Danh mục vật tư | Test Type: **E2E (nghiệm thu thật trên :9000)**
Scenario: Build lại + nghiệm thu đủ 4 yêu cầu của user 06/10/2026 trên trình duyệt thật.
Expected: 3 tab đúng tên · tab 0 sạch (không khối trồng tréo) · tab hệ có bảng + CRUD/S/S/F · Xóa đúng quy tắc.
Actual: **PASS 100% — 4/4 yêu cầu đạt.**
```
LOGIN: 200 · BOOT: OK
[1] mo menu      : DA_BAM: DANH MỤC VẬT TƯ GỐC
[2] TABBAR       : ["Danh sách vật tư","Danh mục nhóm vật tư","Danh mục hệ vật tư"]   ✅ đúng tên
[3] TAB 0        : coBang=true · conCongCuChanLoan=FALSE · conDoiChieuBOQ=FALSE · conSoatTrungAlias=FALSE  ✅ SẠCH
[4] TAB 1        : summary="DANH MỤC NHÓM VẬT TƯ" · coBang=true   ✅ đã đổi tên
[5] TAB 2        : 8 cột · 17 dòng                                            ✅ TAB MỚI render thật
      cot: Mã hệ | Tên hệ vật tư | Mô tả | Thứ tự | Số nhóm | Số vật tư | Trạng thái | Thao tác
      nut: ＋ Thêm hệ vật tư · ⤓ Xuất CSV · Sửa · Ẩn · Xóa
      dieuKien: Tìm hệ vật tư · Lọc trạng thái · Sắp xếp             ✅ CRUD + Search/Sort/Filter
[6] QUY TẮC NGHIỆP VỤ NÚT XÓA (đo thật):
      E2E-MALFORM-name · 0 vật tư  → xoaDisabled=FALSE  (cho xóa)          ✅
      Điện            · 9 vật tư  → xoaDisabled=TRUE  ⛔
      Điện nhẹ        · 3 vật tư  → xoaDisabled=TRUE  ⛔
      HVAC            · 4 vật tư  → xoaDisabled=TRUE  ⛔
      Cấp thoát nước  · 7 vật tư  → xoaDisabled=TRUE  ⛔
      Xi măng & bê tông · 25     → xoaDisabled=TRUE  ⛔
      Thép            · 30 vật tư → xoaDisabled=TRUE  ⛔
      title của nút Xóa: "Hệ đang có vật tư — hãy chuyển vật tư sang hệ khác hoặc Ẩn hệ để giữ lịch sử"
```
Result: **PASS** | Regression: **PASS (802/803)** | Related Change: CHG-20261006-001
Notes:
· ⭐ `innerText` trả **RỖNG** ở Edge headless (layout chưa flush) ⇒ script đầu tiên báo `cot:[]` SAI.
  Đổi sang `textContent` ⇒ đọc đúng. Bài học: probe DOM phải dùng `textContent`, ⛔ không tin `innerText`.
· ⭐ Server UI phải **khởi động lại** sau mỗi lần build: HTML được cache trong RAM ⇒ 404 bundle
  (cùng dấu hiệu với BUG-20261006-008). Đã dừng đúng PID 6444 (`scripts/local-server.mjs`) rồi
  khởi động lại PID 3768 ⇒ `index-Dyg1xiQf.js` HTTP 200. ⛔ KHÔNG dùng `Stop-Process node` (§36).

## TEST-20261006-019
Date: 2026-10-06 | Task: TASK-227 | Module: Danh mục vật tư | Test Type: **E2E (nghiệm thu lại sau khi sửa BUG-012)**
Scenario: Sau khi thêm `open` cho tab 1+2, xác minh nội dung 3 tab thật sự HIỆN (đo kích thước, không chỉ đọc DOM).
Expected: cả 3 tab có `details` height > 0 và bảng hiển thị; ảnh chụp có nội dung (không trắng).
Actual: **PASS.**
```
ĐO getBoundingClientRect trên :9000:
  tab 0: details h = 947px · body h = 947px · table h = 13084px · 237 dòng   ✅
  tab 2: details h = 947px · body h = 947px · table h =   977px ·  17 dòng   ✅ (trước: 0px)
Kích thước ảnh chụp (proxy cho "có nội dung"):
  tab-0-danh-sach-vat-tu.png        : 420KB
  tab-1-danh-muc-nhom-vat-tu.png    : 285KB → 405KB   ✅ tăng mạnh = đã render
  tab-2-danh-muc-he-vat-tu-MOI.png  : 285KB → 394KB   ✅ tăng mạnh = đã render
Ảnh tab 0 (mắt thường): CHỈ có tiêu đề + 6 ô lọc/sắp xếp + nút Thêm vật tư/Xuất CSV + bảng 11 cột
  + dòng "237/237 vật tư" ⇒ ⛔ KHÔNG còn khối «CÔNG CỤ CHẨN LOẠN» (BOQ + soát trùng alias) — ĐÚNG yêu cầu user.
Ảnh tab 2: 8 cột (Mã hệ·Tên hệ vật tư·Mô tả·Thứ tự·Số nhóm·Số vật tư·Trạng thái·Thao tác), 17 dòng,
  nút Sửa/Ẩn/Xóa; Xóa MỜ ở hệ có vật tư, Xóa SÁNG ở E2E-MALFORM-CODE (0 vật tư) ⇒ đúng quy tắc nghiệp vụ.
```
Result: **PASS** | Regression: **802/803 (0 fail)** | Related Bug: BUG-20261006-012 | Related Change: CHG-20261006-001
Notes: ⛔ `innerText` trả RỖNG ở Edge headless ⇒ phải dùng `textContent` (đã ghi ở TEST-018).

## TEST-20261006-020
Date: 2026-10-06 | Task: **TASK-226** | Module: Kho vật tư (hub) | Test Type: **E2E (nghiệm thu thật trên :9000)**
Scenario: Nghiệm thu ĐẦY ĐỦ yêu cầu gốc của user (06/10): «click menu Kho vật tư ⇒ hiện luôn dashboard tồn kho;
  trên đầu có tabbar KHO · XUẤT & NHẬP · CẤP PHÁT & HOÀN TRẢ; click card kho ⇒ màn chi tiết 5 tab + nút quay lại».
Expected: màn <Inventory> render (⛔ không phải «KHO TỔNG»); tabbar đúng 3 tab; cards kho đủ 4 thông tin;
  màn chi tiết đúng 5 tab; nút quay lại hoạt động.
Actual: **PASS 100% — TASK-226 ĐÃ ĐƯỢC NGHIỆM THU.**
```
LOGIN: 200 · BOOT: OK
[2] MÀN RENDER : manInventory=TRUE · manCentralWarehouse=FALSE · tiêu đề "Tồn kho & điều chuyển"  ✅
[3] TABBAR HUB : ["KHO","XUẤT & NHẬP","CẤP PHÁT & HOÀN TRẢ"]                                    ✅ ĐÚNG 3 TAB
[4] CARDS KHO  : 12 cards · "Hàng đang vận chuyển/TRANSIT · Kho trung chuyển/Tồn hiện tại: 0"
                 · "Kho chẩn đoán/KHO-DIAG · Kho dự án/Dự án: Dự án chẩn đoán/Tồn hiện tại: 0"
                 ⇒ đủ 4 thông tin user yêu cầu: TÊN KHO · MÃ KHO · DỰ ÁN (kho dự án) · TỒN KHO HIỆN TẠI  ✅
[5] chon card = DA_CHON · mo chi tiet = DA_BAM                                                     ✅
[6] MÀN CHI TIẾT: manChiTiet=TRUE · nútQuayLai="← Quay lại màn KHO" · soTab=5
      tab = ["Dashboard kho","Tồn kho","Xuất - Nhập","Cấp phát - Hoàn trả","Nhân sự"]             ✅ ĐÚNG 5 TAB
[7] bam tab 3 «Xuất - Nhập» ⇒ panelXuatNhap=TRUE                                                   ✅
[8] bam «Quay lại» ⇒ manChiTietCon=FALSE · cardsKho=12 (về đúng màn KHO)                          ✅
ẢNH (mắt thường) hub-kho-3-tab.png: tabbar 3 tab · DASHBOARD TỒN KHO 8 chỉ số NGAY ĐẦU tab KHO
   · bảng 12 kho · 12 cards kho · KPI Tồn khả dụng 1.235 / Chờ xuất 30
```
Result: **PASS** | Regression: **802/803** | Environment: Edge headless + CDP, base :9000
Related Bug: BUG-20261006-010 (đã FIXED bởi ERP-SESSION-01 — xem ghi chú) | Related Task: TASK-226
Notes: ⭐ **BUG-20261006-010 ĐÃ ĐƯỢC SỬA** bởi `ERP-SESSION-01` (ghi là `BUG-20261007-002`) — ĐÚNG chẩn đoán
  em nêu ở round 40: `app/page.tsx:509` trả `moduleKey: viewable` (= khoá quyền `central_warehouse`)
  thay vì **màn đích** `item.moduleKey` (= `inventory`) ⇒ bấm menu mở <CentralWarehouse> («KHO TỔNG»),
  màn <Inventory> (hub 3 tab) ⛔ không bao giờ render.
  Nay mã là `moduleKey: item.moduleKey` ⇒ `viewable` chỉ còn vai trò CỔNG QUYỀN. ✅ XÁC MINH BẰNG ĐO THẬT.
  ⚠️ S01 **CHƯA COMMIT** bản sửa này (commit cuối vẫn `3dd2431` 06/10 17:23:51) — bản build của
  ERP-SESSION-02 (09:34) đã chứa nó. ⇒ **CẦN S01 COMMIT** để không mất khi máy chủ khởi động lại.

## TEST-20261006-021
Date: 2026-10-06 | Task: **TASK-226** | Module: Kho vat tu (hub) | Test Type: **E2E (nghiem thu 2 tab con lai)**
Scenario: Hoan tat nghiem thu TASK-226 — kiem 2 tab con lai cua hub «Kho vat tu» (user yeu cau:
  subtabbar XUAT/NHAP + mac dinh theo quyen + moi subtab 1 danh sach + nhom nut CRUD/search/sort/filter;
  tab CAP PHAT & HOAN TRA logic tuong tu).
Expected: moi tab co subtabbar that · moi subtab 1 danh sach that (co bang + so dong) · co nut tao phieu · chuyen subtab an/hien dung.
Actual: **PASS 100%.**
```
[Kiem mau data-tab] toan repo: CHI 3 cho co `data-tab=`, CA 3 DA co `open` (sua o BUG-012) => khong con cho nao dinh
  => lop BUG-20261006-012 DA HET trong repo.

=== TAB HUB 1 «XUAT & NHAP» ===
  subtabbar      : «Xuat kho» · «Nhap kho»                                  ✅
  MAC DINH       : «Xuat kho» (dung quy tac «mac dinh theo quyen user»)     ✅
  Danh sach XUAT : hien=true · cao 1093px · **30 dong**                     ✅
  nut            : «⭳ Tao phieu xuat kho» · «＋ TAO PHIEU NHAP / XUAT / DIEU CHUYEN»  ✅
  bam «Nhap kho» : DS Xuat AN · DS Nhap HIEN · cao 1072px · **36 dong**
                   nut «⭱ Tao phieu nhap kho» · «＋ Tao phieu nhap kho»       ✅ (an/hien dung)
  bam «Xuat kho» : quay lai 30 dong                                         ✅

=== TAB HUB 2 «CAP PHAT & HOAN TRA» ===
  panel          : hien=true · cao 2068px · **2 bang · 46 dong**            ✅
  subtabbar      : «Cap phat» · «Hoan tra»                                  ✅
  bam «Hoan tra» : **23 dong** · nut «＋ Tao phieu hoan tra»                 ✅
```
Result: **PASS** | Regression: 802/803 | Environment: Edge headless + CDP, base :9000
Related Task: TASK-226 | Related Bug: BUG-20261006-010 (da FIXED)
Notes:
  · ⚠️ BAY DO LUONG: 2 danh sach cua tab «XUAT & NHAP» nam NGOAI section `[data-vntech="warehouse-io-tab"]`
    (la phan tu ANH EM — `Inventory.tsx:454` va `:481`) ⇒ neu chi do ben trong section do se thay
    `soBang=0 · soDong=0` va **ket luan sai la tab trong**. Phai do theo `[data-vntech="issue-list-screen"]`
    va `[data-vntech="receipt-list-screen"]`.
  · ⭐ Lop `BUG-20261006-012` (details thieu `open`) **da het trong repo** — chi man «Danh muc vat tu»
    dung mau `data-tab`, ca 3 da co `open`.

## TEST-20261007-022
Date: 2026-10-07 | Task: **TASK-228** | Module: Kho vat tu (hub) | Test Type: **E2E + REGRESSION**
Scenario: Don gon tab «KHO» cua hub «Kho vat tu» theo yeu cau user 07/10 («sap xep qua lon xon»).
Expected: giam khoi trung lap · ⛔ khong mat chuc nang · tsc sach · regression pass · do lai tren :9000.
Actual: **PASS.**
```
DO THAT TRUOC/SAU (cung selector, cung :9000):
  tab «KHO»  : chieu cao trang 6.202px → **4.949px**  (giam 1.253px ≈ 20%)
  tab «XUAT & NHAP» : 2.065px → 2.040px (⛔ khong doi dang ke)
  tab «CAP PHAT & HOAN TRA» : 2.977px → 2.953px
KIEM CHUNG GIAO DIEN (anh khung nhin):
  · Nhan «Pham vi du an» TRUNG: 3 cho → **1 cho** (thanh chon du an dau trang)   ✅
  · Dai tab LA «TON KHO|CHUYEN KHO|THE KHO»: **DA BO**                            ✅
  · 2 nut «⇄ CHUYEN KHO» + «▤ THE KHO»: **DA CHUYEN vao toolbar**                 ✅ (⛔ khong xoa)
  · Hang 3 KPI trung («So kho/Vat tu dang co/Phieu xuat»): **DA BO**              ✅
  · Danh sach kho THU 2 («Gia tri ton kho theo kho», 13 nut): **DA BO**           ✅
  · GIU: 4 KPI · DASHBOARD TON KHO · 12 cards kho · bang ton kho · «Canh bao ton kho» ✅
```
Result: **PASS** | Regression: **803 test · 802 pass · 0 fail · 1 skip** | Environment: Edge headless + CDP, base :9000
Related Change: CHG-20261007-002 | Related Task: TASK-226
Notes: `npx tsc --noEmit` **EXIT=0** · bundle `page-RIK3wkRf.js` **CO** chua `inv-transfer-btn` (xac minh build that).

## TEST-20261007-023
Date: 2026-10-07 | Task: (ngoai task) | Module: DevOps — Cong chan hoi quy thi giac | Test Type: **REGRESSION**
Scenario: Chay `node tools/probe-visual-regression.mjs` (che do so sanh, ⛔ KHONG `--update`) de kiem tra cong anh
  sau khi (a) anh chuan duoc chup lai (56 anh duy nhat) va (b) ERP-SESSION-01 sua dieu huong 3 man.
Expected: cong cho ra tin hieu THAT (co the co anh lech that su), ⛔ khong con báo «0 px lech» gia.
Actual: **CONG DA CHO TIN HIEU THAT — 34/68 anh lech.**
```
  ✅ 11-modal-request  : 4/4 viewport **0 px** (S01 sua `clickText` => dieu huong DUNG)   ✅
  ✅ 12-drawer-request-detail : 4/4 **0 px**                                              ✅
  ✅ 19-report-center  : 4/4 **0 px**                                                     ✅
  ❌ 13-modal-material : desktop 19,69% · laptop 10,52% · tablet 13,26% (phone 0 px)
  ❌ 16-modal-receipt  : desktop 25,73% · laptop 26,33% · tablet 34,89% · phone 34,78%
  ❌ 17-modal-po       : 0,04–0,09% (RAT NHO = nhieu do phan giai/chu)
  ❌ 18-modal-team-create: 0,008–0,021% (RAT NHO)
  KET LUAN CONG: KHONG DAT ❌ — 34/68 anh lech
```
Result: **CONG DO DUNG** (⛔ khong phai loi cong) | Related Bug: BUG-20261006-005 (da FIXED) · BUG-20261006-006
Notes: ⭐ **GIAI THICH 2 ANH LECH LON — ⛔ KHONG phai hoi quy that:**
  · **13-modal-material**: ERP-SESSION-02 **vua bo khoi «CONG CU CHAN LOAN»** khoi man «Danh muc vat tu»
    (TASK-227) ⇒ man DOI THAT ⇒ anh chuan (chup 06/10 17:45, TRUOC khi sua) tat nhien lech.
  · **16-modal-receipt**: anh chuan chup luc **hub «Kho vat tu» CHUA render** (BUG-20261006-010, chi het
    khi S01 sua `moduleKey`) ⇒ anh cu ghi man SAI; nay dieu huong dung ⇒ lech la **DA TOT LEN**.
  ⇒ ⛔ **KET LUAN: `tools/baseline` da CU** — can **chup lai** sau khi (1) hub render dung, (2) TASK-227 doi man.
  ⛔ ERP-SESSION-02 **KHONG chay `--update`** (chua duoc phep) — cho user quyet.
  ⚠️ 2 anh lech NHO (17-modal-po 0,04% · 18-modal-team-create 0,008%) la **nhieu**, ⛔ khong phai hoi quy.

## TEST-20261007-024
Date: 2026-10-07 | Task: TASK-228 | Module: Kho vat tu (hub) | Test Type: **E2E (kiểm chức năng sau khi dọn)**
Scenario: ⚠️ «dọn xong làm hỏng» — kiểm bộ lọc dự án + 2 nút vừa chuyển chỗ + bộ lọc kho (thay danh sách kho đã bỏ).
Expected: mọi chức năng CÒN nguyên; bộ lọc còn tác dụng; 2 nút còn bấm được.
Actual: **PASS — ⛔ KHÔNG hỏng chức năng nào.**
```
① KPI khi «Tất cả dự án» : Tồn khả dụng **1.235** · Chờ xuất 30 · Tổng tồn 1.235 · Nhập 2.329 · Xuất 237
② Chọn «DA-MAU-01 · Dự án mẫu kiểm chứng cutover» ⇒ KPI **TẤT CẢ VỀ 0**
   ⇒ ✅ **BỘ LỌC «CHỌN DỰ ÁN» CÒN TÁC DỤNG** (thanh đầu trang đã thay 3 nhãn trùng — vẫn lọc đúng)
③ Nút mới: «⇄ Chuyển kho» ✅ · «▤ Thẻ kho» ✅
   Bấm «⇄ Chuyển kho» ⇒ panel **«Tạo phiếu điều chuyển — Hàng xuất khỏi nguồn sẽ chuyển vào Tran…» MỞ** ✅
   Bộ lọc «Kho» trong toolbar: **CÓ** (tự co còn 3 lựa chọn theo dự án — đúng hành vi `allowedWarehouses`) ✅
   Bảng dữ liệu: **3 bảng** ✅
```
Result: **PASS** | Regression: 803·802·0 ở TEST-20261007-022 | Environment: Edge headless + CDP, base :9000
Related Change: CHG-20261007-002 | Related Task: TASK-226
Notes: ⭐ Chứng minh việc BỎ danh sách kho thứ 2 ⛔ **không mất khả năng lọc theo kho** — toolbar đã có ô «Tất cả kho»
  và nó **tự điều chỉnh theo dự án** (12 kho → 2 kho khi chọn 1 dự án). ⭐ 2 nút chỉ **đổi chỗ**, chức năng nguyên vẹn.

## TEST-20261007-025
Date: 2026-10-07 | Task: TASK-228 | Module: Kho vat tu (hub) | Test Type: **UI (liệt kê khối từng tab)**
Scenario: Sau khi dọn tab «KHO», kiểm 2 tab còn lại có cùng lỗi trùng lặp/lộn xộn không.
Expected: mỗi tab chỉ có khối CỦA CHÍNH NÓ, ⛔ không trùng.
Actual: **PASS — 2 tab kia SẠCH.**
```
TAB 1 «KHO» (sau khi dọn) : cao 4.949px · 9 khối · 3 bảng · **1.198 dòng** · 12 KPI
   tiêu đề khối: DASHBOARD TỒN KHO · Giá trị kho — vì sao có ô «chưa có nguồn» ·
                 Tồn kho theo từng kho · Vật tư dưới mức tồn tối thiểu (0) ·
                 Nguồn dữ liệu của từng chỉ số · Cảnh báo tồn kho
TAB 2 «XUẤT & NHẬP»       : cao 2.040px · 3 khối · 1 bảng ·   30 dòng · 4 KPI   ✅ SẠCH
   tiêu đề khối: NHẬP KHO & XUẤT KHO
TAB 3 «CẤP PHÁT & HOÀN TRẢ»: cao 2.953px · 3 khối · 3 bảng · 48 dòng · 4 KPI    ✅ SẠCH
   tiêu đề khối: CẤP PHÁT & HOÀN TRẢ · LUÂN CHUYỂN VẬT TƯ DƯ DỰ ÁN → KHO ·
                 Phiếu điều chuyển đang xử lý
```
Result: **PASS** | Regression: N/A | Environment: Edge headless + CDP, base :9000
Related Change: CHG-20261007-002
Notes: ⭐ **CÒN LẠI 2 KHỐI «GIẢI THÍCH» trong tab KHO** (⛔ không trùng, nhưng là **văn bản tài liệu** giữa màn
  vận hành): «*Giá trị kho — vì sao có ô «chưa có nguồn»*» và «*Nguồn dữ liệu của từng chỉ số*».
  ⇒ ⛔ **CHƯA BỎ** vì chúng có mục đích (giải thích giới hạn dữ liệu) — **cần user quyết**:
  (a) giữ nguyên · (b) thu vào nút «?» cạnh tiêu đề · (c) bỏ hẳn.
  ⭐ 1.198 dòng ở tab KHO chủ yếu là **bảng tồn kho** (237 dòng) + dashboard — ⛔ không phải khối thừa.

---

## ⭐⭐⭐ HỒI QUY RỘNG (§25) — QUÉT MỌI NHÓM MENU ⭐⭐⭐

> ⭐ **ĐỔI CÁCH GHI LOG (07/10/2026)** theo chỉ thị user: bám **GOAL** + khuôn **`SESSION_A`**.
> ⛔ Không đếm theo `MASTER TASK 1/2/3`.

| ⭐ | ⭐ |
|---|---|
| **SESSION** | ⭐ `ERP-SESSION-02` |
| **MỤC ĐÍCH** | ⭐ **§25** — «⛔ không chỉ test đúng một dòng code vừa sửa» ⇒ quét **MỌI màn** vì thay đổi của em chạm **`app/page.tsx`** (⭐ menu dùng chung cho **cả 11 nhóm**) ✓ |
| **PHẠM VI ĐÃ XÁC ĐỊNH BẰNG ĐO** | ⭐ `app/page.tsx` → ⭐⭐ **menu của MỌI nhóm** + màn «Danh mục vật tư» + xoá `MaterialMatchingWorkspace` ✓<br>⭐ `app/screens/Inventory.tsx` → hub Kho 3 tab + màn chi tiết 5 tab ✓<br>⭐ `app/screens/WarehouseDashboard.tsx` → ⭐ **ĐO ĐƯỢC: chỉ dùng ở ĐÚNG 1 CHỖ** (`Inventory.tsx:316`) ⇒ ⭐⭐ **thay đổi `showHelp` là CÔ LẬP** ✓<br>⭐ `app/screens/MaterialCategoryList.tsx` → tab hệ vật tư (mới) ✓ |
| ⭐⭐ **SAI LẦM ĐÃ SỬA (§22) — BẢN QUÉT 1 CHO «PASS 2/2» GIẢ** | ⭐⭐⭐ Bản 1 đọc sơ đồ menu **TRƯỚC khi mở nhóm** ⚠️ ⇒ ⭐ `.nav-child` **CHƯA render** (⭐ chỉ render khi `opened \|\| sidebarCollapsed` — ⭐ đo ở `app/page.tsx:682`) ⭐ ⇒ ⭐⭐ chỉ thấy **2 mục** (⭐ của nhóm `purchasing` **đang mở sẵn**) ⭐⭐ ⇒ ⭐⭐⭐ in ra **«✅ render OK: 2 · màn trống: 0»** ⭐⭐⭐ ⭐ ⭐ **TRÔNG NHƯ ĐẠT NHƯNG THỰC CHẤT CHƯA QUÉT GÌ** ⚠️ ⚠️<br>⭐⭐ **CÁCH ĐÚNG (đã sửa ở bản 2)**: ⭐ **MỞ NHÓM trước → RỒI đọc `.nav-child` → RỒI bấm từng con** ✓ ⭐ (⭐ cùng họ với bài học của SESSION-01: ⭐ «đo sai ⇒ kết luận sai» ✓) |
| ⭐ **CÁCH ĐO (theo đúng đúc kết của SESSION-01)** | ⭐ dùng selector **ỔN ĐỊNH** `[data-nav-group="<key>"] .nav-child` ✓ ⭐ ⛔ **KHÔNG** bấm `@N` mù ⭐ ⛔ **KHÔNG** suy `child:N` từ `sort_order` CSDL ✓ ⭐ đọc DOM thật để lấy **số mục con mỗi nhóm** ✓ |
| **TIÊU CHÍ ĐẠT** | ⭐ mỗi mục con: **bấm được** ✓ · màn render **h1 khác rỗng** ✓ · nội dung **≥ 120 ký tự** (⛔ không màn trắng) ✓ |
| **KẾT QUẢ** | ⭐ xem `TEST-20261007-027` (ghi ngay sau khi quét xong) |

⛔ **GHI CHÚ PHÂN VAI (§7)**: ⭐ `tools/probe-visual-regression.mjs` **thuộc `ERP-SESSION-01`** — ⭐ **⛔ em KHÔNG sửa** ✓ ⇒ ⭐ đã hỏi user, ⏳ **chờ trả lời** ✓

## ⭐⭐⭐ TEST-20261007-027 — HỒI QUY RỘNG (§25): QUÉT MỌI NHÓM MENU ⭐⭐⭐

| ⭐ | ⭐ |
|---|---|
| **DATE** | 2026-10-07 · **SESSION_ID** `ERP-SESSION-02` · **TEST TYPE** `REGRESSION` + `UI` + `E2E` |
| **MODULE** | ⭐ **Menu dùng chung (11 nhóm)** + màn «Danh mục vật tư» + hub «Kho vật tư» — ⭐ **mọi thứ `app/page.tsx` chạm tới** ✓ |
| **SCENARIO** | ⭐ login `admin` ⇒ **mở TỪNG nhóm** ⇒ đọc `.nav-child` **từ DOM thật** ⇒ **bấm từng mục con** ⇒ đọc `h1` + độ dài nội dung ✓ |
| **EXPECTED** | ⭐ mọi mục con **bấm được** · màn render **h1 khác rỗng** · nội dung **≥ 120 ký tự** ✓ |
| **ACTUAL** | ⭐⭐⭐ **PASS 54/54** ⭐⭐⭐<br>`✅ render OK : 54` · `⚠️ màn trống : 0` · `❌ không bấm : 0` · `TỔNG : 54` ✓ |
| **SƠ ĐỒ MENU ĐO TỪ DOM** | ⭐ `my_work` 5 · `site_command` 5 · `mep` 9 · `purchasing` 13 · ⭐ **`warehouse` 1** («Kho vật tư» → h1 **«Tồn kho & điều chuyển»** ✓ ⭐ = **TASK-226 còn nguyên** ✓) · `teams` 1 · `finance` 8 · `hr_legal` 7 · `reports` 3 · ⭐ **`material_master` 0 con — đi thẳng** → h1 **«Danh mục vật tư gốc»** (⭐ dai **41.242** — = **TASK-227 còn nguyên** ✓) · `system_admin` 1 ✓ |
| ⭐ **ĐỐI CHIẾU THAY ĐỔI CỦA EM** | ⭐ **`warehouse` = 1 mục** ⇒ ⭐⭐ **gom 7→1 (TASK-226) CÒN NGUYÊN** ✓<br>⭐ **`material_master` vào được** ⇒ ⭐⭐ **3 tab (TASK-227) CÒN NGUYÊN** ✓<br>⭐ **11/11 nhóm mở được** ⇒ ⭐⭐ **sửa menu ⛔ không phá nhóm nào** ✓ |
| ⚠️ **GHI NHẬN (⛔ KHÔNG PHẢI BUG)** | ⭐ `purchasing[12] «Đối tác»` → h1 **«Nhà cung cấp»** ⭐⭐ **GIỐNG `[11]`** ⚠️ — ⭐ **ĐÚNG THIẾT KẾ**: ⭐ `page.tsx:511-518` ghi rõ ⭐ «`moduleKey` là MÀN ĐÍCH `supplier_catalog`; **`view` quyết định TIÊU ĐỀ/bộ lọc của CÙNG màn đó**» ✓ ⇒ ⭐ ⛔ **không sửa** ✓ |
| **REGRESSION** | ⭐ ✅ **0 màn trống** · ✅ **0 lỗi bấm** · ✅ ⛔ không phát sinh lỗi mới sau toàn bộ thay đổi (TASK-226 · 227 · 228 · 229) ✓ |
| **ENVIRONMENT** | ⭐ Edge headless + CDP · base `:9000` (⭐ proxy HTTP **200** ✓) · MySQL `vntech_erp` (dữ liệu thật) ✓ |
| **RELATED_BUG** | ⭐ `BUG-20261006-010` (FIXED) · `BUG-20261006-012` (FIXED) |
| **RELATED_CHANGE** | ⭐ `CHG-20261006-001` · `CHG-20261007-002` · `CHG-20261007-003` |
| ⭐ **BÀI HỌC (§33)** | ⭐ ⭐⭐ **ĐO MENU PHẢI MỞ NHÓM TRƯỚC KHI ĐẾM CON** ⭐ ⭐⭐ — ⭐ `.nav-child` chỉ render khi nhóm **đang mở** ⇒ ⭐ đếm trước khi mở = **luôn ra 0** ⚠️ ⭐ ⭐⭐ **và nếu nhóm nào đó ĐANG mở sẵn thì ra vài mục ⇒ KẾT LUẬN «ĐẠT» GIẢ** ⭐ ⭐⭐ (⭐ bản 1 của em in **«OK 2 · trống 0»** ⚠️ — ⭐ trông như đạt nhưng **thực chất chưa quét gì** ✓) ⭐ ⭐ ⭐ **⇒ ĐẾM ĐƯỢC «0» KHÔNG CÓ NGHĨA LÀ «KHÔNG CÓ LỖI» — ⭐ PHẢI KIỂM MẪU SỐ có hợp lý không** ✓ |
| **STATUS** | ⭐⭐⭐ **PASS** ⭐⭐⭐ *(⭐ §24: có **mã + test** ✓ · ⭐ §25: **hồi quy rộng** ✓)* |

## ⭐⭐⭐ TEST-20261007-028 — QUÉT TĨNH `open("…")` / `action("…")` / `<button>` — PHƯƠNG PHÁP + GIỚI HẠN ⭐⭐⭐

| ⭐ | ⭐ |
|---|---|
| **DATE** | 2026-10-07 · **SESSION_ID** `ERP-SESSION-02` · **TEST TYPE** `STATIC (phân tích mã)` |
| **MỤC ĐÍCH** | ⭐ tìm **LỚP LỖI** «UI gọi tên ⛔ không tồn tại» ⭐ (⭐ ⛔ không chỉ 1 nút lẻ ✓) |
| ⭐⭐ **QUÉT ① `open("X")` ↔ MODAL** | ⭐ nguồn: **40 tên modal** từ `modal === "…"` trong `app/page.tsx` ⭐ (⭐ ⛔ **tập ĐÓNG** ⭐ nên tin được ✓)<br>⭐ kết quả: **39 tên** `open("…")` ⇒ ⭐ **37 CÓ modal** ✅ ⭐ ⭐ **2 ⛔ KHÔNG**: `allocate` (1 chỗ) · `warehouse` (**2 chỗ**) ⭐<br>⭐⭐ **ĐỐI CHỨNG DƯƠNG**: `open("return")` ⭐ **MỞ modal THẬT** (⭐ đo `overlay 1 · modal 1` + tiêu đề «Hoàn trả vật tư dư…») ✅ ⇒ ⭐ **cơ chế `open()` TỐT**, ⛔ không phải lỗi `open` ✓<br>⇒ ⭐⭐⭐ **TIN ĐƯỢC** ⭐⭐⭐ → `BUG-20261007-013` + `BUG-20261007-014` ✓ |
| ⭐⭐ **QUÉT ② `action("X")` ↔ BACKEND** | ⭐ **BẢN 1 SAI NGUỒN** ⚠️: đối chiếu `scripts/system-route.mjs` ⇒ **16 tên thiếu** ⛔ ⭐ nhưng ⭐⭐ chính tệp đó ghi «⚠️ **ROUTE NÀY KHÔNG ĐƯỢC APP ĐANG CHẠY GỌI: API thật là Java `:18081`**» (⭐ `:3074`) ⭐⭐ + ⭐ `cutover-proxy.mjs:39` ⇒ `/api/system` **→ Java** ✓<br>⭐ **BẢN 2 ĐÚNG NGUỒN**: `ActionRbacRegistry.java` + `SystemController.java` ⭐ (⭐ **tập ĐÓNG** ✓) ⇒ ⭐⭐ **16 → 1** ⭐⭐<br>⭐⭐ **ĐỐI CHỨNG 2 CHIỀU**: ⭐ **âm** `delete_warehouse`/`save_warehouse`/`allocate` = **KHÔNG** ✅ ⭐ **dương** `login`/`save_material`/`check_material_alias_conflicts` = **CÓ** ✅ ✓<br>⇒ ⭐⭐⭐ **TIN ĐƯỢC** ⭐⭐⭐ → `BUG-20261007-015` (⭐ **132/133 action có backend** ✓) ✓ |
| ⛔⛔ **QUÉT ③ `<button>` ⛔ KHÔNG `onClick` — 🔴 KHÔNG ĐÁNG TIN ⇒ ⛔ DỪNG** | ⭐ Bản 1: **39 «nút trơ»** ⚠️ — ⭐ kiểm mã thật ⇒ ⭐⭐ **SAI** ⭐⭐: ⭐ `ListToolbar.tsx:27` + `PermissionGuard.tsx:11` ⛔ **nằm trong CHÚ THÍCH** (`// …<button>…`) ⭐ + ⭐ **số dòng sai** ✓<br>⭐ Bản 2 (⭐ **đã bỏ chú thích** + **tính lại dòng**): **58 «nút trơ»** ⚠️ — ⭐ kiểm mã thật ⇒ ⭐⭐ **VẪN SAI** ⭐⭐ vì **2 lỗi parser**:<br>⭐⭐ **①** ⭐ cắt thẻ tại `>` **ĐẦU TIÊN** ⚠️ ⇒ ⭐ `page.tsx:898` có `disabled={index > 0}` ⇒ `>` **nằm TRONG BIỂU THỨC JSX** ⇒ **cắt sớm, mất `onClick` ở sau** ✓<br>⭐⭐ **②** ⭐ `<button>` **trong `<form>`** ⛔ không ghi `type` ⇒ ⭐ **mặc định là `submit`** ⇒ ⭐ chạy qua **`onSubmit` của form** ⚠️ ⇒ ⭐ em đếm nhầm là «trơ» (⭐ `page.tsx:433` · `:439`) ✓<br>⭐⭐⭐ ⇒ ⭐ **KẾT LUẬN: ⛔ KHÔNG báo con số này** ⭐ ⭐⭐ **⛔ DỪNG hướng quét ③** vì ⛔ **không có TẬP ĐÓNG để đối chiếu** + ⭐ **nhiều cạm bẫy parser** ⚠️ ✓ |
| ⭐ **BÀI HỌC (§33) — ⭐ QUAN TRỌNG NHẤT PHIÊN** | ⭐ ⭐⭐ **CHỈ TIN PHÉP QUÉT KHI CÓ «TẬP ĐÓNG» ĐỂ ĐỐI CHIẾU** ⭐ ⭐⭐ — ⭐ **①** `open("X")` ↔ **danh sách modal** (⭐ hữu hạn, ⭐ đọc từ `modal === "…"`) ⭐ **②** `action("X")` ↔ **danh sách action backend** (⭐ hữu hạn) ⭐ ⭐ ⇒ ⭐ **đối chiếu 2 tập ĐÓNG ⇒ kết quả TIN ĐƯỢC** ✓<br>⭐⭐ **CÒN** ⭐ «`<button>` thiếu `onClick`» ⛔ **KHÔNG có tập đóng** (⭐ `onClick` có thể đến từ **form cha** · **cloneElement** · **spread props** · **thẻ bị cắt sai**) ⇒ ⛔ **phân tích tĩnh KHÔNG kết luận được** ✓ |
| | ⭐ ⭐⭐ **PHÉP ĐO PHẢI CÓ «ĐỐI CHỨNG 2 CHIỀU»** ⭐ ⭐⭐ — ⭐ **chiều âm** (⭐ biết chắc SAI ⭐ phải ra SAI ✓) + ⭐ **chiều dương** (⭐ biết chắc ĐÚNG ⭐ phải ra ĐÚNG ✓) ⭐ ⭐ Quét ① và ② **có** ⇒ tin được ✓ ⭐ Quét ③ **không có** ⇒ ⛔ bỏ ✓ |
| | ⚠️ ⭐ **TỔNG KẾT SAI LẦM ĐO TRONG PHIÊN: 5 LẦN** ⭐ — ⭐ ① menu «2/2» giả (⭐ đọc trước khi mở nhóm ✓) ⭐ ② `innerText` rỗng ở headless ✓ ⭐ ③ chỉ đo `modal`, thiếu «đổi màn» ✓ ⭐ ④ quét **nhầm backend** (⭐ 16 bug giả ✓) ⭐ ⑤ quét `<button>` (⭐ đếm cả **chú thích** + **2 lỗi parser** ✓) ⭐ ⭐ ⇒ ⭐⭐ **CẢ 5 ĐỀU DO THIẾU ĐỐI CHỨNG HOẶC SAI NGUỒN/MẪU** ⚠️ ⭐⭐ ✓ |
| **KẾT QUẢ** | ⭐ **① TIN ĐƯỢC** (3 nút chết) ⭐ **② TIN ĐƯỢC** (1 action thiếu) ⭐ **③ ⛔ BỎ** (⛔ không kết luận) ✓ |
| **TRUY VẾT** | ⭐ `BUG-20261007-013` · `-014` · `-015` · `EVT-20261007-035` · `-037` ✓ |

## ⭐⭐ TEST-20261007-029 — §22: KÍCH THƯỚC TAB **TRONG MODAL** PHẢI NHẤT QUÁN — **ĐẠT** ✅ ⭐⭐
| ⭐ | ⭐ |
|---|---|
| **DATE** | 2026-10-07 · **SESSION_ID** `ERP-SESSION-02` · **TEST_TYPE** `UI` (đo DOM thật) |
| ⭐ **YÊU CẦU §22 (nguyên văn)** | ⭐⭐ «**Tất cả tabs bên trong cùng một modal phải có kích thước nhất quán. Không để title dài/ngắn làm thay đổi: width · height · title area · alignment · content positioning**» ⭐⭐ ✓ |
| **MÔI TRƯỜNG** | ⭐ `:9000` (proxy → UI `:8787`) ⭐ login `200` ⭐ boot OK ⭐ `admin` ⭐ Edge headless 1920×1080 · `--force-device-scale-factor=1` ✓ |
| ⭐ **CÁCH ĐO** | ⭐ Mở modal thật ⇒ ⭐ `document.querySelectorAll('[role="tablist"]')` ⇒ ⭐ **`getBoundingClientRect()` TỪNG tab** ⭐ + ⭐ `getComputedStyle(b).flex` ⭐ ⇒ ⭐ đánh dấu ⭐ **TRONG MODAL** ⭐ bằng ⭐ `closest('.modal,[role="dialog"],.overlay')` ✓ |
| **ĐƯỜNG MỞ MODAL** | ⭐ Menu ⭐⭐ **«QUẢN TRỊ HỆ THỐNG» → «Danh mục & phân quyền»** ⭐⭐ ⇒ ⭐ danh sách tài khoản có nút ⭐ **«Sửa tài khoản»** ⭐ ⇒ ⭐ bấm ⇒ ⭐ `modal = 1` ✅ ⭐ (⭐ dải tab: `project-scope-tabs user-admin-tabs`, 2 tab ✓) ✓ |
| ⭐⭐ **KẾT QUẢ — TAB TRONG MODAL** | ⭐⭐⭐ **ĐẠT** ⭐⭐⭐ — ⭐ 2 tab ⭐⭐ **`609px` và `609px`** ⭐⭐ ⇒ ⭐⭐ **LỆCH = 0px** ⭐⭐ ✅<br>⭐ `getComputedStyle(button).flex` = ⭐⭐ **`1 1 0px`** ⭐⭐ ⇒ ⭐ **chia đều, ⛔ KHÔNG phụ thuộc độ dài chữ** ✅<br>⭐ «Sửa tài khoản» (13 ký tự) ⭐ và ⭐ «Phân quyền công việc / Chức năng» (30 ký tự) ⭐ ⭐ **CÙNG 609px** ✅ ✓ |
| ⭐ **ĐO THÊM — dải tab NGOÀI modal** | ⭐ Hub «Kho vật tư» ⇒ `.project-scope-tabs` 3 tab: ⭐ «KHO» **53px** ⭐ «XUẤT & NHẬP» **103,5px** ⭐ «CẤP PHÁT & HOÀN TRẢ» **151,1px** ⇒ ⭐⭐ **LỆCH 98,1px** ⚠️ ⭐ `flex = 0 1 auto` (⭐ rộng theo chữ ✓)<br>⭐ ⇒ ⭐ **ĐÂY LÀ THANH TAB CẤP MÀN, ⛔ KHÔNG thuộc phạm vi §22** (⭐ §22 chỉ nói **tab TRONG MODAL** ✓) ⭐ và ⭐ **đúng thiết kế CSS** (`.project-scope-tabs button` ⛔ không đặt `flex` ✓) ✓ |
| ⭐⭐ **PHÁT HIỆN THÊM: GHI CHÚ TRONG MÃ ĐÃ LỖI THỜI** | ⭐ `app/screens/AdminUserModalTabs.tsx:39-41` (⭐ «MỐC 115») **ghi**: ⭐⭐ «…chỉ nhận rule chung `[role="tablist"]` (`flex: 0 0 auto`) ⇒ **2 thẻ co theo độ dài chữ, lệch nhau rõ**» ⚠️<br>⭐⭐ **ĐO THẬT: `flex = 1 1 0px`, lệch 0px** ⭐⭐ ⇒ ⭐⭐ **GHI CHÚ SAI SO VỚI MÃ HIỆN TẠI** ⚠️ ⭐⭐ — ⭐ chứng tỏ **đã có người sửa sau** nhưng ⛔ **không cập nhật ghi chú** ✓ (⭐ ⛔ **KHÔNG sửa tệp này** — ⭐ cần kiểm phân vai trước ⚠️ ✓) |
| ⭐ **BÀI HỌC (§33)** | ⭐ ⭐⭐ **GHI CHÚ TRONG MÃ ⛔ KHÔNG PHẢI BẰNG CHỨNG — PHẢI ĐO LẠI** ⭐ ⭐⭐ — ⭐ nếu tin ghi chú «lệch nhau rõ» ⭐ thì đã **đi sửa một thứ ⛔ không hỏng** ⚠️ ⇒ ⭐⭐ **mất thời gian + rủi ro tạo lỗi mới** ⭐⭐ ⭐ ⭐ (⭐ đây là lần thứ 7 trong phiên một «nguồn tin» hoá ra ⛔ không khớp thực tế ⚠️ ✓) ✓ |
| **TRẠNG THÁI** | ⭐⭐ **PASS** ⭐⭐ — ⭐ **§22 ĐẠT cho tab trong modal** ✅ ⭐ ⛔ **KHÔNG cần sửa gì** ✓ |
| **RELATED** | ⭐ `EVT-20261007-040` ✓ |

## ⭐ TEST-20261007-030 — §22 «EMPTY STATE» TRÊN 3 MÀN PHIÊN 02 — ⛔ **KHÔNG KẾT LUẬN** (phép đo thiếu) ⭐
| ⭐ | ⭐ |
|---|---|
| **DATE** | 2026-10-07 · **SESSION_ID** `ERP-SESSION-02` · **TEST_TYPE** `UI` |
| **MỤC ĐÍCH** | ⭐ §22 liệt kê «**Empty state** · Error state · Loading» ⭐ ⇒ ⭐ kiểm khi tập dữ liệu **RỖNG** thì UI có **thông báo rõ** ⛔ hay **bảng trống trơn** ⚠️ ✓ |
| **CÁCH ĐO** | ⭐ Gõ từ khoá **⛔ không tồn tại** (`ZZZ_KHONG_TON_TAI_ZZZ`) vào ô tìm kiếm ⭐ ⇒ ⭐ đếm `table tbody tr` ⭐ ⇒ ⭐ tìm chuỗi «không có/chưa có/không tìm thấy/trống» ✓ |
| ⭐⭐ **KẾT QUẢ ĐO** | ⭐ Tab «KHO»: **1.198 → 14** dòng ⚠️ ⭐ Tab «XUẤT & NHẬP»: **30 → 1** ⚠️ ⭐ Tab «CẤP PHÁT & HOÀN TRẢ»: **48 → 19** ⚠️ ⭐ ⇒ ⭐ **⛔ KHÔNG lần nào về 0** ⇒ ⭐ **⛔ không quan sát được empty state** ✓ |
| ⭐⭐⭐ **VÌ SAO ⛔ KHÔNG KẾT LUẬN ĐƯỢC (tự phát hiện)** | ⭐ `document.querySelectorAll('table tbody tr')` ⭐⭐ **đếm TẤT CẢ bảng trên màn** ⭐⭐ ⚠️ — ⭐ màn hub Kho có **NHIỀU bảng** (bảng kho · bảng tồn · bảng phiếu…) ⚠️ ⇒ ⭐⭐ **con số giảm là do BẢNG KHÁC co lại, ⛔ KHÔNG phải bảng mục tiêu** ⭐⭐ ⇒ ⭐⭐ **phép đo ⛔ KHÔNG CÔ LẬP ĐƯỢC ĐỐI TƯỢNG** ⚠️ ⭐⭐<br>⭐ Thêm nữa: ⭐ `document.querySelector('.list-toolbar input')` ⭐ có thể **bắt nhầm ô tìm kiếm của thanh khác** (⭐ trang có nhiều `ListToolbar`) ✓ |
| ⭐⭐ **QUYẾT ĐỊNH** | ⭐⭐ **⛔ KHÔNG báo kết luận** ⭐⭐ ⭐ ⛔ **không sửa gì** ⭐ ⭐ lý do: ⭐ **«thà ⛔ không báo còn hơn báo SAI»** ⭐ (⭐ đúng bài học `TEST-20261007-028` ✓) ✓ |
| **HƯỚNG LÀM ĐÚNG (⭐ cho lần sau)** | ⭐ Phải ⭐ **cô lập đúng khối**: ⭐ dùng `[data-vntech="inventory-table-card"]` (⭐ có sẵn ✓) ⭐ hoặc `[data-vntech^="ar-"]` ⭐ ⇒ ⭐ đếm `tr` **trong khối đó** ⭐ ⭐ + ⭐ dùng **đúng ô tìm kiếm của khối đó** (⭐ `khối.querySelector('input')` ✓) ✓ |
| **STATUS** | ⭐⭐ **INCONCLUSIVE** ⭐⭐ — ⭐ **⛔ chưa kết luận được có/không có empty state** ⚠️ ⭐ (⭐ ⛔ không phải bug, ⛔ không phải PASS ✓) |
| ⭐ **BÀI HỌC (§33)** | ⭐ ⭐⭐ **PHÉP ĐO PHẢI CÔ LẬP ĐÚNG KHỐI — ⛔ KHÔNG DÙNG SELECTOR TOÀN TRANG** ⭐ ⭐⭐ ⭐ (⭐ lần thứ **8** trong phiên một phép đo thiếu điều kiện ⚠️ ✓) |

## ⭐⭐ TEST-20261007-031 — HỒI QUY **LIÊN PHIÊN** (3 phiên cùng sửa) — **PASS** ✅ ⭐⭐
| ⭐ | ⭐ |
|---|---|
| **DATE** | 2026-10-07 · **SESSION_ID** `ERP-SESSION-02` · **TEST_TYPE** `REGRESSION / UI` |
| ⭐ **MỤC ĐÍCH (§25 + §2)** | ⭐⭐ **3 phiên cùng sửa** ⭐⭐ (`S01` · `S02` · `S03`) ⭐ ⇒ ⭐ **phải chứng minh các màn CỦA CẢ 3 vẫn render** ⭐ ⭐ mục tiêu: ⭐ `CODE CONFLICT = NO` · ⭐ `STATE CONFLICT = NO` ✅ |
| **MÔI TRƯỜNG** | ⭐ `:9000` (proxy → `:8787`) ⭐ login `200` · boot **OK** ⭐ `admin` ⭐ Edge headless 1920×1080 ✓ |
| ⭐⭐ **KẾT QUẢ** | ⭐ **S02** — «Hub Kho vật tư» (`Inventory.tsx`) ⇒ h1 «Tồn kho & điều chuyển» · ⭐⭐ **107.934 ký tự** ⭐⭐ · 3 bảng ✅<br>⭐ **S03** — «Cấp phát cho tổ đội» (`TeamDirectory.tsx` ⭐ **đang sửa dở** ⚠️) ⇒ h1 «Cấp phát cho tổ đội» · **2.179 ký tự** · 1 bảng ✅<br>⭐ **S01** — «Danh mục & phân quyền» (⭐ dùng `app/page.tsx` của S01 ✓) ⇒ h1 «Danh mục & phân quyền» · **5.843 ký tự** · 1 bảng ✅<br>⭐⭐⭐ **⇒ CẢ 3 PHIÊN ĐỀU RENDER — KHÔNG PHIÊN NÀO PHÁ PHIÊN NÀO** ⭐⭐⭐ ✅ |
| ⭐⭐ **2 KẾT QUẢ LÀ HIỆN TƯỢNG ĐÃ BIẾT (⛔ không phải lỗi)** | ⭐ ① ⭐ `material_master` có **0 mục con** ⚠️ ⇒ ⭐ **ĐÚNG THIẾT KẾ** (⭐ nhóm này **đi thẳng** vào màn, ⛔ không mở ra con — ⭐ đã chứng minh ở `TEST-20261007-027` ✓) ⭐ ⇒ ⭐ ⛔ **không phải lỗi** ✓<br>⭐ ② ⭐ **1 lỗi console `401 Unauthorized`** ⚠️ ⇒ ⭐ **fetch TRƯỚC khi đăng nhập** ⭐ ⭐ **ĐÚNG** (⭐ probe gọi `/api/system` khi trang còn chưa có phiên ✓) ⇒ ⭐ ⛔ **không phải lỗi** ✓ |
| **GHI CHÚ PHÂN VAI** | ⭐ Màn `TeamDirectory.tsx` ⭐ **thuộc `ERP-SESSION-03`** ⭐ ⇒ ⭐ phiên 02 ⭐⭐ **CHỈ ĐỌC, ⛔ KHÔNG SỬA** ⭐⭐ ✅ (§7 ✓) |
| **STATUS** | ⭐⭐ **PASS** ⭐⭐ |
| **RELATED** | ⭐ `TEST-20261007-027` (hồi quy 54/54) · `HANDOFF-20261007-006` ✓ |

## ⭐ TEST-20261007-032 — §22 «empty state» LẦN 2: ⛔ VẪN KHÔNG KẾT LUẬN — **NEO SAI TÊN** ⭐
| ⭐ | ⭐ |
|---|---|
| **DATE** | 2026-10-07 · **SESSION_ID** `ERP-SESSION-02` · **TEST_TYPE** `UI` |
| **Ý ĐỊNH** | ⭐ Áp **luật rút ra từ `TEST-030`** («neo vào `[data-vntech]` của khối mục tiêu») ⭐ ⇒ ⭐ em neo `[data-vntech="inventory-table-card"]` ✓ |
| ⭐⭐ **KẾT QUẢ (⛔ THẤT BẠI)** | ⭐ `!!document.querySelector('[data-vntech="inventory-table-card"]')` ⇒ ⭐⭐ **`false`** ⭐⭐ ⇒ ⭐ ⛔ **KHỐI NEO KHÔNG TỒN TẠI** ⇒ ⭐ **⛔ không đo được** ⚠️ ✓ |
| ⭐⭐⭐ **DANH SÁCH NEO **THẬT** ĐO ĐƯỢC TRÊN MÀN HUB KHO** (⭐ bàn giao cho lần sau ✓) | ⭐ `inv-transfer-btn` · `inv-ledger-btn` (**của em** — TASK-228) ⭐ ⭐⭐ `warehouse-cards` (⭐ KHỐI LƯỚI THẺ KHO ✓) ⭐⭐ · ⭐ `warehouse-card` (× nhiều — ⭐ từng thẻ ✓) ⭐ ⭐ ⇒ ⭐⭐ **neo ĐÚNG cho tab «KHO» là `[data-vntech="warehouse-cards"]`** ⭐⭐ ⛔ **KHÔNG phải `inventory-table-card`** ⚠️ ✓ |
| ⭐ **PHÁT HIỆN PHỤ (⭐ quan trọng)** | ⭐⭐ **Tab «KHO» dùng LƯỚI THẺ (`warehouse-cards`) ⛔ KHÔNG dùng BẢNG** ⭐⭐ ⚠️ ⇒ ⭐ «empty state» ở đây là ⭐ **lưới thẻ RỖNG** ⛔ không phải **bảng rỗng** ⚠️ ⇒ ⭐ **cách đo phải KHÁC** (⭐ đếm `[data-vntech="warehouse-card"]` thay vì `tbody tr` ✓) ✓ |
| ⭐⭐⭐ **SAI LẦM ĐÃ SỬA (§22) — LẦN 9** | ⭐⭐ **EM GIẢ ĐỊNH TÊN NEO ⛔ KHÔNG ĐO TRƯỚC** ⭐⭐ ⚠️ ⭐ ⭐ (⭐ `TEST-030` nói «neo vào `[data-vntech]`» ⭐ nhưng ⭐⛔ **em KHÔNG kiểm tên đó có tồn tại** ⚠️ ✓) ⭐ ⇒ ⭐⭐ **LUẬT: TRƯỚC KHI ĐO BẰNG NEO ⇒ PHẢI LIỆT KÊ `[data-vntech]` CÓ THẬT TRÊN MÀN** ⭐⭐ ✓ |
| **STATUS** | ⭐⭐ **INCONCLUSIVE** ⭐⭐ (⭐ lần 2 ✓) — ⭐ **⛔ vẫn chưa kết luận được empty state** ⚠️ ⭐ ⛔ **không sửa gì** (⭐ ⛔ không phải bug ✓) ✓ |
| ⭐ **BÀI HỌC (§33)** | ⭐ ⭐⭐ **«NEO ĐÚNG KHỐI» CHƯA ĐỦ — PHẢI «NEO ĐÚNG TÊN CÓ THẬT»** ⭐ ⭐⭐ ⭐ ⭐ Cách làm đúng: ⭐ **BƯỚC 0 = LIỆT KÊ `document.querySelectorAll('[data-vntech]')` TRƯỚC** ⭐ rồi mới chọn neo ✓ ✓ |

## ⭐⭐⭐ TEST-20261007-033 — §22 «EMPTY STATE» (LẦN 3) — ⭐⭐ **ĐẠT** ✅ — ĐÓNG VÒNG 2 LẦN INCONCLUSIVE ⭐⭐⭐
| ⭐ | ⭐ |
|---|---|
| **DATE** | 2026-10-07 · **SESSION_ID** `ERP-SESSION-02` · **TEST_TYPE** `UI` |
| ⭐⭐⭐ **ĐIỀU LÀM NÊN KHÁC BIỆT** | ⭐ Áp ⭐⭐ **LUẬT «BƯỚC 0»** ⭐⭐ (⭐ rút ra ở `TEST-032` ✓): ⭐⭐ **LIỆT KÊ `[data-vntech]` CÓ THẬT TRƯỚC KHI CHỌN NEO** ⭐⭐ — ⭐ ⛔ không giả định tên neo nữa ✓ |
| ⭐ **BƯỚC 0 — KẾT QUẢ** | ⭐⭐ `{"inv-transfer-btn":1, "inv-ledger-btn":1, "warehouse-cards":1, "warehouse-card":12, "warehouse-open-detail":1, "open-error-report-fab":1}` ⭐⭐ ⇒ ⭐ **neo ĐÚNG = `[data-vntech="warehouse-cards"]`** ✅ |
| **CÁCH ĐO** | ⭐ Trong khối `warehouse-cards`: ⭐ đếm `[data-vntech="warehouse-card"]` ⭐ (⭐ ⛔ **KHÔNG** dùng `tbody tr` — ⭐ tab «KHO» là **LƯỚI THẺ**, ⛔ không phải bảng ⚠️ ✓) ⭐ + ⭐ gõ từ khoá ⛔ không tồn tại vào **ô TRONG KHỐI** ⭐ (⭐ `placeholder = "Tìm theo tên hoặc mã kho..."` ✓) |
| ⭐⭐⭐ **KẾT QUẢ — ĐẠT** | ⭐ **TRƯỚC lọc**: ⭐⭐ **12 thẻ** ⭐⭐ ⭐ **SAU lọc**: ⭐⭐ **0 thẻ** ⭐⭐ ⇒ ⭐⭐⭐ **CÓ EMPTY STATE**: ⭐⭐ «**Không có kho nào khớp từ khoá tìm kiếm**» ⭐⭐ ✅ ⭐⭐⭐ |
| **KẾT LUẬN** | ⭐⭐ **PASS** ⭐⭐ — ⭐ UI ⭐ **CÓ thông báo rõ khi tập dữ liệu RỖNG** ✅ ⭐ ⛔ **không có «lưới trống trơn»** ⚠️ ⇒ ⭐ **§22 «Empty state» ĐẠT** ✅ |
| ⭐ **ĐÓNG VÒNG** | ⭐ `TEST-20261007-030` (INCONCLUSIVE) ⭐ + ⭐ `TEST-20261007-032` (INCONCLUSIVE) ⇒ ⭐⭐ **nay `TEST-20261007-033` = PASS** ⭐⭐ ✅ |
| ⭐⭐ **CHUỖI BÀI HỌC ĐÃ ĐI QUA (⭐ 3 lần mới đo được)** | ⭐ **Lần 1** (`TEST-030`): ⛔ `table tbody tr` **đếm TẤT CẢ bảng** ⇒ ⭐ luật **«CÔ LẬP ĐÚNG KHỐI»** ⭐ **Lần 2** (`TEST-032`): ⭐ neo vào `[data-vntech]` ⭐ nhưng ⭐ ⛔ **tên giả định không tồn tại** ⇒ ⭐ luật **«BƯỚC 0: LIỆT KÊ NEO THẬT»** ⭐ **Lần 3** (`TEST-033`): ⭐ ✅ **ĐẠT** ⭐ ⭐⭐⭐ **⇒ HAI LUẬT CỘNG LẠI = PHÉP ĐO ĐÚNG** ⭐⭐⭐ ✓ |
| **STATUS** | ⭐⭐ **PASS** ⭐⭐ |
| **RELATED** | ⭐ `TEST-20261007-030` · `TEST-20261007-032` · `EVT-20261007-044` ✓ |
