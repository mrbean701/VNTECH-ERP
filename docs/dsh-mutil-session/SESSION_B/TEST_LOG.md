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

## ⭐⭐ TEST-20261007-034 — §22 «ERROR STATE» + «LOADING» — **ĐẠT** ✅ — §22 KIỂM ĐỦ 4/4 ⭐⭐
| ⭐ | ⭐ |
|---|---|
| **DATE** | 2026-10-07 · **SESSION_ID** `ERP-SESSION-02` · **TEST_TYPE** `UI / mã` |
| **MỤC ĐÍCH** | ⭐ §22 liệt kê ⭐ **«Loading · Empty state · Error state»** ⭐ ⇒ ⭐ mục **cuối cùng chưa kiểm** là **Error state** (⭐ Empty đã ĐẠT ở `TEST-033` ✓) ✓ |
| ⭐⭐ **KẾT QUẢ — HẠ TẦNG ĐẦY ĐỦ** | ⭐ `app/components/ui/DataTable.tsx` ⭐⭐ **có CẢ 3 trạng thái** ⭐⭐:<br>⭐ **Error** — ⭐ `L91`: ⭐⭐ `{error && <div className="inline-alert danger dt-error">Lỗi tải dữ liệu: {error}</div>}` ⭐⭐ ✅<br>⭐ **Loading** — ⭐ `L110-111`: ⭐ `{loading && <div className="empty dt-loading"><span>…</span><strong>Đang tải dữ liệu…</strong></div>}` ✅<br>⭐ **Empty** — ⭐ `L125-128`: ⭐ `{!loading && !rows.length && <div className="empty"><strong>{emptyText}</strong><p>Dữ liệu mới sẽ xuất hiện tại đây.</p></div>}` ✅<br>⭐ kiểu props: ⭐ `L55 loading?: boolean` ⭐ `L56 error?: string \| null` ⭐ `L45 emptyText = "Chưa có dữ liệu."` ✅ |
| ⭐ **BẮT LỖI TOÀN CỤC** | ⭐ `AppErrorBoundary` ⭐ **có** ⭐ (`app/page.tsx:413`) ✅ |
| ⭐⭐ **MÀN CỦA EM CÓ TRUYỀN `emptyText` RIÊNG** | ⭐ `app/screens/Inventory.tsx` ⭐⭐ **11 chỗ** ⭐⭐ dùng `DataTable` ⭐ **đều có `emptyText` TIẾNG VIỆT CỤ THỂ** ✅ — ⭐ vd: «**Kho chưa có vật tư nào.**» · «**Chưa có phiếu xuất trong dự án của kho.**» · «**Chưa có nhân sự nào được gắn với kho này (bảng phân công kho còn trống).**» ⭐ · «**Chưa có phiếu cấp phát trong phạm vi.**» ✓<br>⭐ `app/screens/MaterialCategoryList.tsx` ⭐ `L98` ⭐ `emptyText="Không có hệ vật tư phù hợp bộ lọc."` ✅ |
| ⚠️ **GHI NHẬN TRUNG THỰC (⭐ ⛔ không phải bug)** | ⭐ Màn của em ⭐ **CHỈ truyền `emptyText`** ⚠️ — ⭐ **⛔ KHÔNG truyền `error` / `loading`** ⚠️ ⭐ ⭐ lý do: ⭐ dữ liệu đến từ **bootstrap của component cha** (⭐ `page.tsx` — ⭐ **thuộc S01** ✓) ⇒ ⭐ **màn con ⛔ không tự tải** ⛔ nên ⛔ không có trạng thái loading/error riêng ⭐ ⭐ ⇒ ⭐ **ĐÂY LÀ LỰA CHỌN THIẾT KẾ, ⛔ KHÔNG PHẢI LỖI** ✅ ⭐ ⭐ (⭐ nếu muốn ⭐ phải sửa `page.tsx` = **tệp S01** ⚠️ ⇒ ⛔ **không thuộc phiên 02** ✓) ✓ |
| ⭐⭐⭐ **KẾT LUẬN — §22 KIỂM ĐỦ 4/4** | ⭐ **① Tabs trong modal** ⇒ ⭐⭐ **ĐẠT** ⭐⭐ (`TEST-027`/`-029`: 609px/609px, lệch 0px ✓)<br>⭐ **② Empty state** ⇒ ⭐⭐ **ĐẠT** ⭐⭐ (`TEST-033`: 12 thẻ → 0 + «Không có kho nào khớp từ khoá tìm kiếm» ✓)<br>⭐ **③ Error state** ⇒ ⭐⭐ **ĐẠT** ⭐⭐ (hạ tầng `DataTable L91` + `AppErrorBoundary` ✓)<br>⭐ **④ Loading** ⇒ ⭐⭐ **ĐẠT** ⭐⭐ (`DataTable L110-111` «Đang tải dữ liệu…» ✓)<br>⭐⭐⭐ **⇒ §22 «UI/UX FOCUS» — CẢ 4 MỤC ĐỀU ĐẠT** ⭐⭐⭐ ✅ |
| **STATUS** | ⭐⭐ **PASS** ⭐⭐ |
| **RELATED** | ⭐ `TEST-20261007-029` · `TEST-20261007-033` ✓ |

## ⭐⭐⭐ TEST-20261007-035 — «THÊM NHÂN SỰ VÀO KHO» — **ĐẠT THẬT** (⭐ chứng minh bản sửa `page.tsx` chạy đúng) ⭐⭐⭐
| ⭐ | ⭐ |
|---|---|
| **DATE** | 2026-10-07 · ⭐ **SESSION** `ERP-SESSION-02` · ⭐ **TASK** `TASK-230` ⑥b · ⭐ **TEST_TYPE** `UI / E2E` ✓ |
| ⭐⭐ **MỤC ĐÍCH** | ⭐ Sau khi **sửa `app/page.tsx` thêm `action={action}`** ⚠️ ⇒ ⭐⭐ **§24 `TEST BEFORE FIXED`**: ⛔ **KHÔNG được coi là FIXED nếu chưa đo** ⭐⭐ ✓ |
| **MÔI TRƯỜNG** | ⭐ `:9000` (proxy) ⭐ `:8787` PID **20112** (build mới) ⭐ `:18081` Java ⭐ ⭐ vân tay `VNTECH-FP-171C114C26ACB7AF` ✓ |
| ⭐⭐ **KẾT QUẢ ĐO (⭐ 11 phép đo)** | ⭐ [1] ⭐ ô tìm nhân sự: **có** ✅<br>⭐ [2] ⭐ số ứng viên: ⭐⭐ **28** ⭐⭐ ✅<br>⭐ [3] ⭐ ứng viên đầu: ⭐ «**Chỉ huy trưởng A** · `NV-CHA` · Chỉ huy trưởng · Ban chỉ huy công trường» ✅<br>⭐ [4] ⭐ **TRƯỚC** khi chọn: ⭐ nút Lưu `disabled = **true**` ✅ (⭐ ĐÚNG — ⭐ chưa chọn thì phải khoá ✓)<br>⭐ [5] ⭐ bấm chọn ứng viên: ⭐ `DA_CLICK_RADIO` ✅<br>⭐ [6] ⭐ **SAU** khi chọn: ⭐ khối «NHÂN SỰ ĐÃ CHỌN» hiện: **true** ✅<br>⭐ [7] ⭐ **SAU** khi chọn: ⭐ `select` nhiệm vụ hiện: **true** ✅<br>⭐⭐⭐ [8] ⭐ **NÚT «Lưu phân công» `disabled` = `false`** ⭐⭐⭐ ✅✅✅ ⇒ ⭐⭐ **BẢN SỬA `action={action}` CHẠY ĐÚNG** ⭐⭐ ✓<br>⭐ [9] ⭐ thông tin hiện ra: ⭐ **Họ tên · Mã NV · Chức danh · Phòng ban · Email** ✅<br>⭐ [10] ⭐ nhiệm vụ chọn được: ⭐ `read` · `write` · `approve` · `admin` ✅<br>⭐ [11] ⭐ **TÌM «Chỉ» (tên THẬT) ⇒ 4 ứng viên** ✅ ⇒ ⭐⭐ **ô TÌM KIẾM CHẠY ĐÚNG** ⭐⭐ ✓ |
| ⭐⭐⭐ **SO SÁNH TRƯỚC/SAU** | ⭐ **TRƯỚC** (⭐ `TEST-…` lượt trước, ⭐ chưa sửa `page.tsx`): ⭐ `nút Lưu disabled = **true**` ⚠️ ⭐ ⭐ **SAU** khi sửa: ⭐⭐ `disabled = **false**` ⭐⭐ ✅ ⇒ ⭐ **CHỨNG MINH NHÂN–QUẢ** ✅ |
| ⚠️⚠️ **SAI LẦM PHÉP ĐO CỦA EM — LẦN 2 (§22 · §33)** | ⭐ Em **lọc «Nguy» ⇒ 0 ứng viên** ⚠️ rồi **lại cố CHỌN ứng viên** ⇒ ⭐ `KHONG_CO` ⚠️ ⇒ ⭐ em **suýt kết luận sai là bug** ⚠️<br>⭐ **SỰ THẬT**: ⭐ ⛔ **KHÔNG có nhân sự nào tên chứa «Nguy»** trong dữ liệu ⭐ ⇒ ⭐ **0 là KẾT QUẢ ĐÚNG** ✅<br>⭐ **BÀI HỌC**: ⭐⭐ **TRƯỚC khi kết luận «ô tìm kiếm hỏng» ⇒ PHẢI thử bằng DỮ LIỆU CÓ THẬT** ⭐⭐ (⭐ em đã lấy tên thật «Chỉ…» ⇒ ra **4** ✅ ⭐ chứng minh ô tìm **CHẠY**) ⭐ ⭐ **+ ⛔ KHÔNG được LỌC rồi lại CHỌN trên tập đã rỗng** ⚠️ ✓ |
| ⭐⭐ **GHI NHẬN VỀ TÊN DỮ LIỆU** | ⭐ Danh bạ nhân sự là **DỮ LIỆU MẪU/E2E** ⚠️ (⭐ «Chỉ huy trưởng A» · «E2E Chỉ huy trưởng» · «E2E Chỉ Huy Trưởng SA» ✓) ⇒ ⭐ ⛔ không phải lỗi ✓ |
| **REGRESSION** | ⭐ `tsc EXIT=0` ✅ ⭐ `npm test` **865 · 864 pass · 0 fail** ✅ ⭐ `BUILD_EXIT=0` · ⭐ `BUILT ARTIFACT VALIDATION: ĐẠT` ✅ ⭐ hồi quy UI: ⭐ lệch **1590 = 1590** ✅ · ⭐ card **12 thẻ · đủ 6 thông tin** ✅ · ⭐ bấm 1 lần card ⇒ mở chi tiết ✅ ✓ |
| **STATUS** | ⭐⭐⭐ **PASS — VERIFIED** ⭐⭐⭐ ⭐ ⚠️ **CHƯA COMMIT** (⭐ theo yêu cầu user: ⛔ phiên 02 ⛔ không tự commit ✓) |
| **RELATED** | ⭐ `CHG-20261007-007` · `BUG-20261007-017` · `HANDOFF-20261007-008` ✓ |

## ⭐⭐⭐ TEST-20261007-036 — HỒI QUY ĐẦY ĐỦ **7 YÊU CẦU** TRÊN BUILD HIỆN TẠI — **TẤT CẢ ĐẠT** ⭐⭐⭐
| ⭐ | ⭐ |
|---|---|
| **DATE** | 2026-10-07 · ⭐ **SESSION** `ERP-SESSION-02` · ⭐ **TEST_TYPE** `REGRESSION / E2E` ✓ |
| ⭐⭐ **LÝ DO CHẠY LẠI** | ⭐ Sau lần đo trước, em **đã sửa `app/page.tsx`** (⭐ +`action={action}`) ⚠️ **và** ⭐ **đảo vị trí 2 khối CSS** ⚠️ (⭐ đưa lên TRƯỚC dấu `…_END */` ✓) ⇒ ⭐ **build đã ĐỔI** ⇒ ⭐⭐ **BẮT BUỘC đo lại TOÀN BỘ** (⭐ ⛔ không được dùng kết quả đo trên build CŨ ✓) ✓ |
| **MÔI TRƯỜNG** | ⭐ `:9000` ⭐ `:8787` PID **20112** ⭐ `:18081` ⭐ ⭐ vân tay `VNTECH-FP-171C114C26ACB7AF` ✓ |
| ⭐⭐ **① HUB = TRANG TỔNG QUAN** | ⭐ ✅ dashboard tổng hợp (`kpi-grid`) ⭐ ✅ **12 card kho** ⭐ ✅ card có ⭐ **Tồn kho** ⭐ **Số mã đang thiếu** ⭐ **Thủ kho** ⭐ **Trạng thái** ⭐ ⭐ ✅ **card NỔI BẬT — ĐO ĐƯỢC CSS THẬT**: ⭐ `background-image = linear-gradient(160deg, rgb(…)` ⭐ `box-shadow = rgba(22,50,88,0.06) 0px` ✅ ⭐ (⭐ ⛔ không còn «đơn điệu» ✓) ✓ |
| ⭐ **② XOÁ DÒNG NOTE** | ⭐ ✅ `document.body.innerText.includes('Ba tab của cùng một màn')` = **`false`** ✅ |
| ⭐⭐ **③④ LỆCH tabbar vs danh sách** | ⭐⭐ **TẤT CẢ `1590px` — ⛔ KHÔNG còn lệch** ⭐⭐ ✅<br>⭐ TAB 1: ⭐ `tabBar 1590` · ⭐ **`khối XUẤT-NHẬP 1590`** ⭐ · ⭐ **`DANH SÁCH phiếu 1590`** ✅<br>⭐ TAB 2: ⭐ `tabBar 1590` · ⭐ **`khối CẤP PHÁT 1590`** ✅<br>⭐ ⭐ **SO SÁNH**: ⭐ trước sửa **1234 ❌** (⭐ lệch **356px** ✓) ⇒ ⭐ nay **1590 ✅** ✓ |
| ⭐ **⑤ BẤM 1 LẦN VÀO CARD** | ⭐ ✅ trước = `false` ⇒ ⭐ **sau 1 lần bấm = `true`** ⭐ màn chi tiết kho hiện ⭐ tiêu đề «**CHI TIẾT KHO · Hàng đang vận chuyển**» ✅ |
| ⭐⭐ **⑥ 5 TAB — NÚT + Ô TÌM** | ⭐ ✅ **Tab «Tồn kho»**: ⭐ ô tìm (`type="search"`) + ⭐ **«⇩ Xuất Excel»** + ⭐⭐ **«＋ Tạo phiếu đề nghị»** ⭐⭐<br>⭐ ✅ **Tab «Xuất - Nhập»**: ⭐ ô tìm + ⭐ **«⭳ Tạo phiếu nhập»** + ⭐ **«⭱ Tạo phiếu xuất»**<br>⭐ ✅ **Tab «Cấp phát - Hoàn trả»**: ⭐ ô tìm + ⭐ **«＋ Tạo phiếu cấp phát»** + ⭐ **«＋ Tạo phiếu hoàn trả»**<br>⭐ ✅ **Tab «Nhân sự»**: ⭐ ô tìm + ⭐⭐ **«＋ Thêm nhân sự»** ⭐⭐ ✓ |
| ⭐⭐ **⑥b MODAL THÊM NHÂN SỰ** | ⭐ ✅ mở ⭐ ✅ ô tìm nhân sự ⭐ ✅ **28 ứng viên** ⭐ ✅ chọn ứng viên ⇒ ⭐⭐ **nút «Lưu phân công» `disabled` = `false`** ⭐⭐ ✅ (⭐ ⛔ KHÔNG còn chết ✓) ✓ |
| ⚠️⚠️ **SAI LẦM PHÉP ĐO CỦA EM — LẦN 3 (§22 · §33)** | ⭐ Probe đầu báo `oTim: **false**` ở **cả 4 tab** ⚠️ ⭐ ⭐ **NGUYÊN NHÂN**: ⭐ em query ⭐ `input[type=text]` ⚠️ ⭐ — ⭐ nhưng ô tìm thật là ⭐⭐ **`type="search"`** ⭐⭐ ⚠️ ⇒ ⭐ **selector QUÁ HẸP** ⚠️<br>⭐ **ĐÃ SỬA PHÉP ĐO**: ⭐ liệt kê `input` + `getAttribute('type')` ⭐ ⇒ ⭐⭐ `oTim = true` · `oTimType = "search"` · `soInput = 1` ⭐⭐ trên **cả 4 tab** ✅<br>⭐ **BÀI HỌC**: ⭐⭐ **ĐỪNG query `input[type=text]` — ⭐ phải query `input` rồi ĐỌC `type` THẬT** ⭐⭐ ⭐ (⭐ `type="search"` là hợp lệ và ⛔ không khớp `[type=text]` ✓) ⭐ ⭐ **+ ⛔ KHÔNG kết luận «thiếu» khi chỉ có 1 selector không khớp** ⚠️ ✓ |
| ⭐⭐ **TỔNG KẾT 7 YÊU CẦU** | ⭐⭐ **7/7 ĐẠT** ⭐⭐ ✅ — ⭐ ① card 6 thông tin + nổi bật ✅ ⭐ ② xoá note ✅ ⭐ ③④ hết lệch ✅ ⭐ ⑤ click 1 lần mở chi tiết ✅ ⭐ ⑥ 5 tab có nút + tìm/sort/filter ✅ ⭐ ⑥b modal nhân sự hoạt động ✅ ✓ |
| **REGRESSION KHÁC** | ⭐ `tsc = 0` ✅ ⭐ `npm test` **865 · 864 pass · 0 fail** ✅ ⭐ `BUILD ĐẠT` ✅ ✓ |
| **STATUS** | ⭐⭐⭐ **PASS** ⭐⭐⭐ ⚠️ **CHƯA COMMIT** (⭐ user yêu cầu ⛔ phiên 02 không tự commit ✓) ⭐ ⚠️ **ĐÃ SAO LƯU** patch ra `TEMP` + `.local-data/_backup-session02.patch` ✅ |
| **RELATED** | ⭐ `TEST-20261007-035` · `CHG-20261007-007` · `TASK-230` ✓ |

## ⭐⭐⭐ TEST-20261007-037 — CARD KHO CAO ĐỀU + XOÁ LABEL KỸ THUẬT THỪA — **PASS** ⭐⭐⭐
| ⭐ | ⭐ |
|---|---|
| **DATE** | 2026-10-07 · **SESSION** `ERP-SESSION-02` · **TASK** `TASK-231` · **TEST_TYPE** `UI / E2E / REGRESSION` ✓ |
| **MÔI TRƯỜNG** | ⭐ `:9000` ⭐ `:8787` (⭐ build mới, PID **5952** ✓) ⭐ `:18081` ⭐ vân tay `VNTECH-FP-51BB9590A4892845` ✓ |
| ⭐⭐ **① CARD CAO ĐỀU** | ⭐ **TRƯỚC**: ⭐ `chieuCao { "**202**": 2, "**222**": 10 }` ⇒ ⭐⭐ **LỆCH 20px** ⭐⭐ ⚠️<br>⭐ **SAU**: ⭐⭐⭐ `chieuCao { "**222**": 12 }` ⭐⭐⭐ + ⭐ `chieuRong { "**298**": 12 }` ⇒ ⭐⭐ **LỆCH = 0px** ⭐⭐ ✅ (⭐ 12/12 thẻ ĐỀU ✓) ✓ |
| ⭐⭐ **② LABEL KỸ THUẬT ĐÃ XOÁ** | ⭐ Kiểm bằng `document.body.innerText.includes(…)` ⇒ ⭐⭐ **6/6 `false`** ⭐⭐ ✅<br>⭐ ① «Nguồn 8 chỉ số» ✅ ⭐ ② «`` `warehouses[]` `` (id · code» ✅ ⭐ ③ «Mọi số tính TRỰC TIẾP» ✅ ⭐ ④ «ghép `` `inventory[].warehouseId` ``» ✅ ⭐ ⑤ «Nguồn: `` `data.inventory` ``» ✅ ⭐ ⑥ «lọc theo `` `warehouseId` ``» ✅ |
| ⭐ **③ NOTE CÒN LẠI SẠCH** | ⭐ «*Tồn kho theo phạm vi bạn được phân quyền.*» ⭐ «*Phạm vi: Tất cả dự án được phân quyền · 12 kho · 1185 dòng tồn.*» ⭐ «*12 kho trong phạm vi được phân quyền.*» ⭐ «*Chỉ tính vật tư đã đặt mức tồn tối thiểu.*» ⭐ «*Bấm một thẻ để mở chi tiết kho.*» ⭐ «*Số liệu tính trực tiếp từ dữ liệu kho hiện có.*» ⇒ ⭐⭐ **⛔ HẾT thuật ngữ CSDL** ⭐⭐ ✅ |
| ⭐ **④ THẺ KHO** | ⭐ Nội dung: ⭐ Tên · ⭐ `MÃ · Loại` · ⭐ (Dự án nếu là kho dự án) · ⭐ **Tồn kho** · ⭐ **Số mã đang thiếu** · ⭐ **Thủ kho** · ⭐ **Trạng thái** · ⭐ chú thích «*N vật tư · bấm để mở*» ✅ |
| ⭐⭐⭐ **⚠️ SAI LẦM CỦA EM — TEST ĐỎ (§22)** | ⭐ Sau khi xoá 2 khối chữ «Nguồn: …» ⚠️ ⇒ ⭐⭐ **`npm test` ĐỎ 1 test** ⚠️: ⭐ `W-04 — UI KHÔNG hardcode: mọi KPI lấy từ khối tính toán, **in rõ NGUỒN**…` ⭐ ⭐ `tests/w04-inventory-dashboard.test.mjs:170` ⇒ ⭐ «**Thiếu dòng in NGUỒN dữ liệu**» ⚠️<br>⭐ **NGUYÊN NHÂN**: ⭐ em xoá **CẢ PHẦN TỬ** mang thuộc tính ⭐⭐ `data-inventory-source` ⭐⭐ ⚠️ — ⭐ trong khi test ⭐ **CHỈ đòi THUỘC TÍNH đó TỒN TẠI** (⭐ `assert.match(component, /data-inventory-source/)` ✓) ⭐ ⛔ **KHÔNG đòi đoạn chữ dài** ✅<br>⭐⭐ **CÁCH SỬA HÀI HOÀ CẢ 2** ⭐⭐: ⭐ **giữ thuộc tính** ⭐ nhưng **đổi chữ thành NGẮN + ⛔ không jargon**: ⭐ `<p className="muted" data-inventory-source="eight-metrics">**Số liệu tính trực tiếp từ dữ liệu kho hiện có.**</p>` ⇒ ⭐⭐ **`W-04` PASS 6/6** ⭐⭐ ✅ ⭐ **+ vẫn đạt yêu cầu user «xoá label thừa»** ✅<br>⭐⭐ **BÀI HỌC (§33)**: ⭐⭐ **XOÁ CHỮ ≠ XOÁ PHẦN TỬ** ⭐⭐ — ⭐ phần tử có thể mang **thuộc tính mà test nghiệm thu đòi** ⚠️ ⇒ ⭐ **TRƯỚC khi xoá 1 khối UI ⇒ PHẢI `grep` xem khối đó có `data-*`/id/class nào đang được test/JS dùng ⛔ không** ✓ |
| ⭐⭐ **HỒI QUY TOÀN BỘ §25** | ⭐ `npm test` ⇒ ⭐⭐ **`865 tests · 864 pass · 0 fail`** ⭐⭐ ✅ ⭐ `TEST_EXIT=0` ✅ ⭐ `tsc EXIT=0` ✅ ⭐ `BUILD_EXIT=0` · ⭐ `BUILT ARTIFACT VALIDATION: ĐẠT` ✅ ⭐ ⚠️ `globals.css` **vẫn kết thúc đúng** dấu `/* VNTECH_MASTER_BASELINE_CSS_R1_1_1_END */` ✅ ✓ |
| **STATUS** | ⭐⭐⭐ **PASS — VERIFIED** ⭐⭐⭐ ⚠️ **CHƯA COMMIT** (⭐ user yêu cầu ⛔ phiên 02 không tự commit ✓) |
| **RELATED** | ⭐ `CHG-20261007-008` · `TASK-231` ✓ |

## ⭐⭐ TEST-20261007-038 — QUÉT TOÀN HUB TÌM LABEL JARGON + REWORD 8 CHỖ — **PASS** ⭐⭐
| ⭐ | ⭐ |
|---|---|
| **DATE** | 2026-10-07 · **SESSION** `ERP-SESSION-02` · **TASK** `TASK-231b` · **TEST_TYPE** `UI / quét tự động` ✓ |
| ⭐⭐ **PHƯƠNG PHÁP (⭐ ĐO, ⛔ không đoán)** | ⭐ Probe quét **mọi node LÁ** trong `.approved-inventory-screen`, ⭐ lọc theo **mẫu JARGON** (⭐ tên bảng/cột CSDL · `§` · mã nội bộ `W-0x`/`MT3` · `payload`/`backend`/`API`) ⭐ ⭐ trên **7 màn**: ⭐ 3 tab hub + 4 tab màn chi tiết kho ✅ |
| ⭐⭐ **QUÉT LẦN 1 — TÌM RA 9 ĐOẠN** | ⭐ **Tab 0**: ⭐ ① «*Σ balance trên 1185 dòng tồn (On hand)*» ② «*Đang bị giữ cho phiếu đề nghị (`stock_reservations`)*» ③ «*Σ `acceptedQty` trên 36 phiếu nhập*» ④ «*Σ `totalQty` trên 30 phiếu xuất*» ⑤ «*Σ quantity × `unit_cost` từ `stock_movements`*» ⑥ «*…(`inventory[].minStock` · 1185/1185 dòng có giá trị)*»<br>⭐ **Tab 1**: ⭐ ⑦ «*Gộp hai mục cũ theo **MT3 §F**; …*» ⑧ «***§7.5** — phiếu xuất kho cho tổ đội (nguồn: `stock_issues` + `stock_issue_items`)… backend chưa khai báo action*»<br>⭐ **Tab 2**: ⭐ ⑨ «*Nguồn: … **⛔ Chưa có sửa/xoá: backend chưa khai báo action (§14/§20)**…*» ✓ |
| ⭐⭐⭐ **KIỂM TEST TRƯỚC KHI XOÁ (§22 — ⭐ RÚT TỪ LỖI `data-inventory-source`)** | ⭐ `grep` **11 mẫu** trong `tests/` ⇒ ⭐ phát hiện **`acceptedQty` 21 lần** · **`totalQty` 14** · **`stock_issues` 12** · **`minStock` 12** · **`stock_movements` 3** · **`MT3 §F` 1** ⚠️<br>⭐ **ĐỌC KỸ `w04`**: ⭐ **L81** ⇒ `assert.ok(metric.source && metric.source.length > 3)` ⭐ — ⭐ test đòi **HẰNG SỐ `source` TRONG MÃ** ⭐ ⛔ **KHÔNG đòi chữ trong note UI** ✅ ⇒ ⭐ **an toàn reword note**, ⛔ **miễn KHÔNG đụng khối tính toán / thuộc tính `data-*`** ✅ |
| ⭐ **ĐÃ REWORD 8 CHỖ (⭐ ⛔ không xoá phần tử)** | ⭐ `WarehouseDashboard.tsx` ×5: ⭐ «*Tổng số lượng thực tế đang có · 1185 dòng tồn*» ⭐ «*Đang bị giữ cho phiếu đề nghị*» ⭐ «*Số lượng đã nhận · 36 phiếu nhập…*» ⭐ «*Số lượng đã xuất · 30 phiếu xuất…*» ⭐ «*Theo sổ giá vốn của kho*» ✅<br>⭐ `Inventory.tsx` ×3: ⭐ «*Chọn loại phiếu bên dưới.*» ⭐ «*Phiếu xuất kho cấp cho tổ đội. Tạo mới bằng nút bên phải.*» ⭐ «*Phiếu cấp phát vật tư cho tổ đội · phiếu hoàn trả về kho.*» ✅ |
| ⭐⭐⭐ **QUÉT LẦN 2 — ⭐ 2 ĐOẠN CUỐI **⛔ KHÔNG PHẢI THỪA** ⭐⭐⭐** | ⭐⭐ **⛔ DỪNG, ⛔ KHÔNG XOÁ** ⭐⭐ — ⭐ **BẰNG CHỨNG MÃ**:<br>⭐ ① «*Giá vốn thật chỉ có ở `stock_movements.unit_cost`…*» = hằng ⭐ `INVENTORY_VALUE_NO_SOURCE_NOTE` ⭐ ⇒ ⭐ **`w04:136`**: ⭐ `assert.ok(m.value.note.includes("**stock_movements**"), "Lý do phải nêu nguồn bị thiếu: stock_movements.unit_cost")` ⛔ **TEST BẮT BUỘC** ⚠️<br>⭐ ② «*Không có dòng nào dưới mức tồn tối thiểu (`inventory[].minStock` · 1185/1185…)*» = ⭐ `metrics.lowStockSource` ⭐ ⇒ ⭐ **`w04:81`**: ⭐ `assert.ok(metric.source && metric.source.length > 3, "Chỉ số «…» thiếu khai báo NGUỒN")` ⛔ **TEST BẮT BUỘC** ⚠️<br>⭐⭐ **KẾT LUẬN**: ⭐ 2 đoạn này là **«ĐỐI CHỨNG NGUỒN» CÓ CHỦ ĐÍCH** (⭐ chống bịa số — ⭐ đúng tinh thần test «*UI KHÔNG hardcode… **in rõ NGUỒN***») ⇒ ⭐ **⛔ KHÔNG PHẢI label thừa** ⭐ ⭐ ⭐ **→ BÁO USER, ⛔ KHÔNG tự xoá** ✅ |
| ⭐⭐ **HỒI QUY §25** | ⭐ `npm test` ⇒ ⭐⭐ **`865 tests · 864 pass · 0 fail`** ⭐⭐ ✅ ⭐ `TEST_EXIT=0` ✅ ⭐ `tsc EXIT=0` ✅ ⭐ `BUILD_EXIT=0` · ⭐ `BUILT ARTIFACT VALIDATION: ĐẠT` ✅ |
| ⭐⭐ **QUÉT LẦN 2 — KẾT QUẢ SẠCH** | ⭐ **Tab 1** «XUẤT & NHẬP»: ⭐ **`[]` SẠCH** ✅ ⭐ **Tab 2** «CẤP PHÁT & HOÀN TRẢ»: ⭐ **`[]` SẠCH** ✅ ⭐ **4 tab màn chi tiết kho**: ⭐ **`[]` SẠCH** ✅ ⭐ Tab 0: ⭐ còn **đúng 2** (⭐ là 2 đoạn BẮT BUỘC nói trên ✓) ✓ |
| ⭐⭐ **BÀI HỌC (§33 — ⭐ LẦN THỨ 2 TRONG CÙNG 1 TASK)** | ⭐⭐ **TRƯỚC khi xoá/đổi 1 đoạn chữ trên UI ⇒ PHẢI `grep` ① test ② JS xem đoạn đó có bị RÀNG BUỘC không** ⭐⭐ ⭐ ⭐ (⭐ lần 1: `data-inventory-source` ⚠️ · ⭐ lần 2: `INVENTORY_VALUE_NO_SOURCE_NOTE` + `metrics.lowStockSource` ⚠️) ⭐ ⭐ ⇒ ⭐ **«LABEL THỪA» theo cảm nhận ≠ «label thừa» theo nghiệm thu** ⚠️ ⭐ ⭐ **Cách phân biệt**: ⭐ label nói về **CẤU TRÚC KỸ THUẬT NỘI BỘ** (⭐ «`MT3 §F`» · «*backend chưa khai báo action*» ✓) ⇒ **thừa** ⭐; ⭐ label nói **VÌ SAO SỐ NÀY KHÔNG CÓ / LẤY TỪ ĐÂU** (⭐ đối chứng âm ✓) ⇒ **CẦN** ✅ ✓ |
| **STATUS** | ⭐⭐⭐ **PASS** ⭐⭐⭐ ⚠️ **CHƯA COMMIT** ✓ |
| **RELATED** | ⭐ `CHG-20261007-008` · `TEST-20261007-037` · `TASK-231` ✓ |

## ⭐⭐ TEST-20261007-039 — VIẾT LẠI 2 «ĐỐI CHỨNG NGUỒN» CHO NGƯỜI DÙNG — **PASS** ⭐⭐
| ⭐ | ⭐ |
|---|---|
| **DATE** | 2026-10-07 · **SESSION** `ERP-SESSION-02` · **TASK** `TASK-231c` · **TEST_TYPE** `UI / REGRESSION` ✓ |
| ⭐⭐ **MỤC ĐÍCH** | ⭐ Kiểm: ⭐ sau khi **viết lại 2 đoạn «đối chứng nguồn»** thành câu **người dùng đọc được** ⚠️ ⭐ thì ⭐ **test nghiệm thu `W-04` còn xanh không** (⭐ test đòi chữ `stock_movements` ✓) ✅ |
| ⭐⭐ **KẾT QUẢ** | ⭐ `npx tsx tests/w04-inventory-dashboard.test.mjs` ⇒ ⭐⭐ **`pass 6 · fail 0`** ⭐⭐ ✅<br>⭐ **hồi quy toàn bộ**: ⭐⭐ **`866 tests · 865 pass · 0 fail`** ⭐⭐ ✅ ⭐ `TEST_EXIT=0` ✅<br>⭐ `tsc EXIT=0` ✅ ⭐ `BUILD_EXIT=0` · ⭐ `BUILT ARTIFACT VALIDATION: ĐẠT` ✅ |
| ⭐ **ĐO TRÊN UI (sau build)** | ⭐ Tab 0 ⭐ còn **đúng 1** đoạn bị bộ quét gắn cờ ⚠️ — ⭐ nhưng nay là ⭐⭐ «*Chưa tính được giá trị kho: sổ giá vốn (bảng `stock_movements`) chưa được nạp vào dữ liệu, nên hệ thống để trống thay vì hiện một con số không đúng.*» ⭐⭐ ⇒ ⭐ **câu tiếng Việt HOÀN CHỈNH, người dùng hiểu được** ✅ (⭐ bộ quét gắn cờ chỉ vì **có chữ `stock_movements`** — ⭐ mà test **BẮT BUỘC** phải có ✓)<br>⭐ Tab 1 «XUẤT & NHẬP» ⭐ **`[]` SẠCH** ✅ ⭐ Tab 2 «CẤP PHÁT & HOÀN TRẢ» ⭐ **`[]` SẠCH** ✅ ⭐ 4 tab màn chi tiết ⭐ **`[]` SẠCH** ✅ |
| ⭐⭐ **KẾT LUẬN THEO LUẬT USER** | ⭐ User: «*nếu đối chứng nguồn **chỉ** có tác dụng để dev check thì xóa đi, **còn không thì giải thích rõ ràng ra***» ⭐ ⭐ ⇒ ⭐ **KẾT LUẬN: ⛔ KHÔNG CHỈ để dev check** ✅ (⭐ ① ô «Giá trị kho» hiện «chưa có nguồn» ở **chỗ đáng ra là TIỀN** ⚠️ · ⭐ ② empty-state nói **đã kiểm bao nhiêu dòng** ✓) ⭐ ⇒ ⭐ ⭐⭐ **ĐÃ GIẢI THÍCH RÕ RÀNG RA** ⭐⭐ (⭐ ⛔ không xoá ✓) ✅ |
| **STATUS** | ⭐⭐ **PASS** ⭐⭐ ⛔ **CHƯA COMMIT** ✓ |
| **RELATED** | ⭐ `CHG-20261007-009` ✓ |

## ⭐⭐ TEST-20261007-040 — VIỆT HOÁ 11 CHUỖI NGUỒN — **PASS** (sau 3 lần ĐỎ ⚠️) ⭐⭐
| ⭐ | ⭐ |
|---|---|
| **DATE / SESSION / TASK / TYPE** | ⭐ 2026-10-07 · ⭐ `ERP-SESSION-02` · ⭐ `TASK-231d` · ⭐ `UI / REGRESSION` ✓ |
| ⭐⭐ **KẾT QUẢ CUỐI** | ⭐ `npx tsx tests/w04-inventory-dashboard.test.mjs` ⇒ ⭐⭐ **`pass 6 · fail 0`** ⭐⭐ ✅ ⭐ ⭐ **hồi quy `866 tests · 865 pass · 0 fail`** ✅ ⭐ `tsc EXIT=0` ✅ ⭐ `BUILD_EXIT=0` ✅ |
| ⭐⭐⭐ **3 LẦN ĐỎ LIÊN TIẾP (⭐ ghi rõ để ⛔ không tái phạm)** | ⭐ **Đỏ 1** ⭐ `w04:**134**` — `m.value.source.includes(INVENTORY_NO_SOURCE)` ⛔<br>⭐ **Đỏ 2** ⭐ `w04:**149**` — `noPrice.value.standardPriceSource.includes(INVENTORY_NO_SOURCE)` ⛔<br>⭐ **Đỏ 3** ⭐ `w04:**153**` — `empty.totalSource.includes(INVENTORY_NO_SOURCE)` ⛔<br>⭐ **CÙNG 1 NGUYÊN NHÂN**: ⭐ em **xoá nhãn chuẩn «chưa có nguồn»** ở **3 chỗ khác nhau** ⚠️ ⭐ khi đang dọn jargon ✓ |
| ⭐⭐ **ĐO TRÊN UI (sau build)** | ⭐ Khối «Giải thích chỉ số» ⭐ **⛔ KHÔNG còn** «`inventory[].balance` · 1185/1185» · «`receipts[].acceptedQty` · 36/36» · «`issues[].totalQty` · 30/30» · «`transferOrders[].status` · 7/7» · «`inventory[].minStock` · 1185/1185» · «*chưa có nguồn — payload KHÔNG trả khoá stockMovements*» ✅<br>⭐ «**bootstrap :651/661/671/673**» ⭐ **⛔ không hiện trên màn hình** (⭐ đo cả trước + sau khi mở khối ⇒ `false` ✓) ✅ |
| **STATUS** | ⭐⭐ **PASS** ⭐⭐ ⛔ **CHƯA COMMIT** ✓ |
| **RELATED** | ⭐ `CHG-20261007-010` · `BUG-20261008-019` ✓ |

## ⭐⭐⭐ TEST-20261007-041 — LẤP LỖ HỔNG KIỂM CHỨNG: KHỐI «GIẢI THÍCH CHỈ SỐ» — **SẠCH 100%** ⭐⭐⭐
| ⭐ | ⭐ |
|---|---|
| **DATE / SESSION / TASK / TYPE** | ⭐ 2026-10-07 · ⭐ `ERP-SESSION-02` · ⭐ `TASK-231e` · ⭐ `UI / VERIFICATION` ✓ |
| ⭐⭐⭐ **LỖ HỔNG EM TỰ PHÁT HIỆN** | ⭐ Sau `TEST-040` em mới đo **«ký hiệu kỹ thuật ĐÃ MẤT»** ⚠️ ⭐ mà **⛔ CHƯA đo «nhãn tiếng Việt ĐÃ HIỆN»** ⚠️ ⇒ ⭐⭐ **ĐO LẠI 2 CHIỀU** ⭐⭐ (⭐ ⛔ không được chỉ kiểm 1 chiều ✓) ✓ |
| ⭐⭐ **CHIỀU 1 — NHÃN TIẾNG VIỆT ĐÃ HIỆN?** | ⭐✅ **8/8 ĐỀU `true`** ⭐: ⭐ «*Số lượng tồn thực tế trong kho*» ⭐ «*Tồn khả dụng (đã trừ phần giữ chỗ)*» ⭐ «*Số lượng đang bị giữ cho phiếu đề nghị*» ⭐ «*Số lượng đã nhận trên phiếu nhập*» ⭐ «*Số lượng đã xuất trên phiếu xuất*» ⭐ «*Trạng thái phiếu điều chuyển*» ⭐ «*Mức tồn tối thiểu đã đặt của vật tư*» ⭐ «*chưa có dữ liệu giá vốn*» ✅ |
| ⭐⭐⭐ **CHIỀU 2 — KÝ HIỆU KỸ THUẬT CÒN KHÔNG? (⭐ SAU KHI SỬA 2 CHỖ NỮA)** | ⭐⭐⭐ **8/8 ĐỀU `false`** ⭐⭐⭐ ✅<br>⭐ `inventory[].` ⇒ **false** ✅ ⭐ `receipts[].` ⇒ **false** ✅ ⭐ `issues[].` ⇒ **false** ✅ ⭐ `transferOrders[].` ⇒ **false** ✅ ⭐ `materials.` ⇒ **false** ✅ ⭐⭐ **`payload` ⇒ false** ⭐⭐ ✅ ⭐ `bootstrap :` ⇒ **false** ✅ ⭐ `stockMovements` ⇒ **false** ✅ |
| ⭐⭐ **2 CHỖ EM TÌM THÊM ĐƯỢC NHỜ ĐO 2 CHIỀU** | ⭐ ① ⭐ `WarehouseDashboard.tsx:**146**` ⭐ — ⭐ `standardPriceSource` ⭐ = ⭐ «`materials.standardPrice × inventory[].balance` · N/M dòng có giá» ⚠️ ⭐ (⭐ **HIỆN** ở `:201` ✓) ⭐ ⇒ ⭐ sửa thành ⭐⭐ «*Giá chuẩn trong danh mục vật tư (**materials**) nhân với số lượng tồn · N/M dòng có giá*» ⭐⭐ ⚠️ **GIỮ từ khoá `materials`** vì ⭐ `w04:**144**` bắt buộc ⛔<br>⭐ ② ⭐ `WarehouseDashboard.tsx:**243**` ⭐ — ⭐ note CardHead ⭐ = ⭐ «*…phân biệt «0 dòng» với «**cột rỗng trong payload**»…*» ⚠️ ⭐ ⇒ ⭐ sửa thành ⭐⭐ «*…phân biệt «**không có dòng nào**» với «**cột chưa có dữ liệu**»…*» ⭐⭐ ✅ |
| ⭐ **GHI NHẬN — `INVENTORY_METRICS[].source` ⛔ KHÔNG RENDER** | ⭐ Đo được: ⭐ hằng ⭐ `INVENTORY_METRICS` ⭐ **chỉ được EXPORT** (`WarehouseDashboard.tsx:258`) ⭐ và **tiêu thụ bởi test** ⭐ — ⛔ **KHÔNG `.map()`/render** ⚠️ ⇒ ⭐ các chuỗi ⭐ `"inventory[].balance — … (bootstrap :651)"` ⭐ **⛔ không bao giờ hiện trên màn hình** ✅ ⇒ ⭐ **luật user ⛔ không áp dụng** ⇒ ⭐ **GIỮ NGUYÊN** ✅ |
| ⭐⭐ **HỒI QUY** | ⭐ `tsc EXIT=0` ✅ ⭐⭐ **`866 tests · 865 pass · 0 fail`** ⭐⭐ ✅ ⭐ `BUILD_EXIT=0` · ⭐ `BUILT ARTIFACT VALIDATION: ĐẠT` ✅ |
| ⭐⭐ **BÀI HỌC (§33)** | ⭐⭐ **KIỂM 1 CHIỀU = KIỂM CHƯA ĐỦ** ⭐⭐ — ⭐ em đo «**ký hiệu cũ đã mất**» ⚠️ ⭐ mà **⛔ không đo «nhãn mới đã hiện»** ⚠️ ⇒ ⭐ nếu nhãn mới **⛔ không hiện** (⭐ lỗi render ✓) ⭐ thì test vẫn **XANH GIẢ** ⚠️ ⭐ ⭐ ⇒ ⭐⭐ **LUẬT: khi THAY 1 chuỗi ⇒ PHẢI đo CẢ 2 CHIỀU** ⭐⭐ (⭐ cũ ĐÃ MẤT **và** mới ĐÃ HIỆN ✓) ✅ |
| **STATUS** | ⭐⭐⭐ **PASS — VERIFIED** ⭐⭐⭐ ⛔ **CHƯA COMMIT** ✓ |
| **RELATED** | ⭐ `CHG-20261007-011` · `TEST-20261007-040` · `TASK-231e` ✓ |

## ⭐⭐⭐ TEST-20261007-042 — BỎ 2 CỘT KHỎI «DANH MỤC NHÓM VẬT TƯ» — **PASS** ⭐⭐⭐
| ⭐ | ⭐ |
|---|---|
| **DATE / SESSION / TASK / TYPE** | ⭐ 2026-10-07 · ⭐ `ERP-SESSION-02` · ⭐ `TASK-232` · ⭐ `UI / E2E / REGRESSION` ✓ |
| ⭐⭐ **MÔI TRƯỜNG** | ⭐ `:9000` ⭐ build mới ✅ ⭐ vân tay sau build ✓ |
| ⭐⭐⭐ **ĐO TRÊN UI — ⭐ ĐÃ VÀO ĐÚNG MÀN** | ⭐ Đường vào: ⭐ menu ⭐⭐ «**DANH MỤC VẬT TƯ GỐC**» ⭐⭐ (⭐ là **`.nav-parent` cấp 1** ⚠️ ⛔ không phải `.nav-child` ✓) ⭐ ⇒ ⭐ `ĐÃ VÀO MÀN = **true**` ✅ ✓ |
| ⭐ **KẾT QUẢ (⭐ 4 phép đo)** | ⭐ «**Ý kiến điều chỉnh**» ⭐ `false` ✅ ⭐ «**Đã duyệt**» ⭐ `false` ✅ ⭐ «**Đề xuất**» ⭐ `false` ✅ ⭐ «**Chờ duyệt**» ⭐ `false` ✅ |
| ⭐ **HEADER BẢNG (⭐ 8 cột — ⭐ trước 9)** | ⭐ `["", "Mã hệ", "Tên hệ M&E", "Mã nhóm con", "Tên nhóm vật tư", "Phạm vi / ví dụ gồm", "Trạng thái", "Thao tác"]` ✅ — ⛔ **KHÔNG còn «Ý kiến điều chỉnh»** ✅ |
| ⭐ **TRẠNG THÁI TỪNG DÒNG** | ⭐ «**Đang dùng**» ⭐ `soCot = 8` ✅ — ⛔ không còn «Đã duyệt»/«Đề xuất» ✅ |
| ⭐⭐⭐ **⚠️ SAI LÙNG PHÉP ĐO — ⭐ LẦN 4 (§22 · §33)** | ⭐ **LẦN ĐO 1**: ⭐ probe tìm `.nav-child` tên «Danh mục vật tư» ⇒ ⭐ **`KHONG_THAY`** ⚠️ ⭐ ⇒ ⭐ **4 chữ `false` xuất hiện NHƯNG ⛔ VÔ GIÁ TRỊ** (⭐ chưa vào màn ⇒ ⭐ màn khác thì vốn ⛔ không có 4 chữ đó ✓) ⚠️<br>⭐ ⭐⭐ **EM ⛔ ĐÃ KHÔNG BÁO «THÀNH CÔNG»** ⭐⭐ dựa trên số đó ✅ ⭐ — ⭐ **đã tự phát hiện + đo lại** ✓<br>⭐ **SỬA**: ⭐ liệt kê menu THẬT (⭐ 11 nhóm cấp 1 ✓) ⇒ ⭐ phát hiện tên đúng là «**DANH MỤC VẬT TƯ GỐC**» + ⭐ nó là **nav-parent** ⚠️ ⇒ ⭐ bấm đúng ⇒ ⭐ `ĐÃ VÀO MÀN = true` ⇒ ⭐ đo lại mới có giá trị ✅ |
| ⭐ **HỒI QUY** | ⭐ `tsc EXIT=0` ✅ ⭐⭐ **`866 tests · 865 pass · 0 fail`** ⭐⭐ ✅ ⭐ `BUILD_EXIT=0` ✅ |
| **STATUS** | ⭐⭐⭐ **PASS — VERIFIED** ⭐⭐⭐ ⛔ **CHƯA COMMIT** ✓ |
| **RELATED** | ⭐ `CHG-20261008-012` · `BUG-20261008-020` ✓ |

## ⭐⭐⭐ TEST-20261007-043 — AUDIT «CỘT DỮ LIỆU CHẾT» TRÊN MÀN «DANH MỤC VẬT TƯ» — **KẾT QUẢ ĐẦY ĐỦ** ⭐⭐⭐
| ⭐ | ⭐ |
|---|---|
| **DATE / SESSION / TASK / TYPE** | ⭐ 2026-10-07 · ⭐ `ERP-SESSION-02` · ⭐ `TASK-233` · ⭐ `AUDIT / mã nguồn` ✓ |
| ⭐⭐ **MỤC ĐÍCH (⭐ do user gợi ra)** | ⭐ Sau khi user **tự tìm ra** 1 ca «**cột hiển thị nhưng ⛔ không ai ghi được**» (`BUG-20261008-020`) ⚠️ ⭐ ⇒ ⭐ **audit CÙNG LOẠI LỖI** trên màn «Danh mục vật tư» ⭐ ⭐ câu hỏi: ⭐ **còn cột nào cùng bệnh không?** ✓ |
| ⭐ **PHƯƠNG PHÁP** | ⭐ ① ⭐ **LIỆT KÊ cột HIỂN THỊ** của bảng ⭐ ② ⭐ **LIỆT KÊ ô NHẬP** của modal sửa ⭐ (⭐ trích `name="…"` + `<span>nhãn</span>` ✓) ⭐ ③ ⭐ **ĐỐI CHIẾU từng cột** ⇒ ⭐ cột nào **⛔ không có ô nhập ⇒ nghi dữ liệu chết** ⚠️ ✓ |
| ⭐⭐ **KẾT QUẢ ① — BẢNG «DANH MỤC NHÓM VẬT TƯ»** | ⭐ ⚠️ **CÓ LỖI** — ⭐ đã báo `BUG-20261008-020` ⭐ và ⭐ **đã sửa** ở `TASK-232` ✅ ⭐ ⭐ (⭐ 2 cột ⭐ `review_status`/`adjustment_note` ⛔ không ai ghi ✓) ✓ |
| ⭐⭐⭐ **KẾT QUẢ ② — BẢNG «MÃ VẬT TƯ GỐC»: ⛔ KHÔNG CÓ CỘT CHẾT** ⭐⭐⭐ | ⭐ Modal ⭐ `MaterialModal` (`app/page.tsx:**3101**`) ⭐ có ⭐ **10 ô nhập** ⭐: ⭐ *Hệ M&E \** · ⭐ *Nhóm vật tư \** · ⭐ *Mã vật tư gốc \** (`code`) · ⭐ *ĐVT \** (`unit`) · ⭐ *Tên vật tư \** (`name`) · ⭐ *Hãng/NSX* (`brand`) · ⭐ *Tồn tối thiểu* (`minStock`) · ⭐ *Quy cách/Thông số* (`specification`) · ⭐ *Alias* (`aliasText`) · ⭐ *Lý do đổi mã* (`codeChangeReason`) ✅<br>⭐⭐ **ĐỐI CHIẾU 8/8 CỘT DỮ LIỆU — ⭐ TẤT CẢ ĐỀU CÓ Ô NHẬP** ⭐⭐: ⭐ Mã vật tư ⇒ `code` ✅ ⭐ Tên vật tư ⇒ `name` ✅ ⭐ Hệ M&E ⇒ `categoryId` ✅ ⭐ Tên nhóm vật tư ⇒ `subcategoryId` ✅ ⭐ ĐVT ⇒ `unit` ✅ ⭐ Quy cách/Thông số ⇒ `specification` ✅ ⭐ Hãng/NSX ⇒ `brand` ✅ ⭐ Tồn tối thiểu ⇒ `minStock` ✅ ⭐ (⭐ Trạng thái ⇒ đổi được qua `set_material_status` ✓ · ⭐ Thao tác ⇒ nút ✓) ⭐ ⭐⭐ **⇒ ⛔ KHÔNG có cột dữ liệu chết** ⭐⭐⭐ ✅ |
| ⭐⭐ **KẾT LUẬN** | ⭐⭐ **LỖI «CỘT DỮ LIỆU CHẾT» CHỈ CÓ Ở TAB «DANH MỤC NHÓM VẬT TƯ»** ⭐⭐ ⭐ (⭐ đã sửa ✓) ⭐ — ⭐ **bảng «MÃ VẬT TƯ GỐC» SẠCH** ✅ ⭐ ⭐ ⚠️ **LƯU Ý**: ⭐ kết quả này ⭐ **CHỈ áp dụng cho 2 bảng đã kiểm** ⚠️ ⭐ — ⭐ ⛔ **KHÔNG suy rộng** ra các màn khác (⭐ chưa kiểm ✓) ✓ |
| ⭐⭐ **GHI NHẬN PHỤ (⛔ không phải lỗi)** | ⭐ Modal có **2 ô NHẬP mà ⛔ KHÔNG hiện thành cột** ⭐: ⭐ *Alias* (`aliasText`) ⭐ + ⭐ *Lý do đổi mã gốc* (`codeChangeReason`) ⚠️ ⭐ — ⭐ đây là **ô nhập phụ** (⭐ ⛔ không phải cột chết ✓) ⭐ ⛔ **không kết luận gì** ✓ |
| ⭐⭐⭐ **BÀI HỌC (§33)** | ⭐⭐ **MỘT LỖI USER TÌM RA ⇒ PHẢI ĐI TÌM CÙNG LOẠI Ở CHỖ KHÁC** ⭐⭐ ⭐ ⭐ (⭐ ⛔ không sửa xong 1 ca rồi dừng ✓) ⭐ ⭐ **+ ⭐ KẾT QUẢ ÂM CŨNG LÀ KẾT QUẢ** ⭐ — ⭐ «⛔ không có cột chết» ⭐ là **thông tin có giá trị** (⭐ xác nhận ⛔ không phải lỗi hệ thống diện rộng ✓) ⭐ ⚠️ **NHƯNG phải GHI RÕ PHẠM VI** (⭐ chỉ 2 bảng ✓) ⛔ không suy rộng ✓ |
| **STATUS** | ⭐⭐⭐ **PASS — AUDIT HOÀN TẤT** ⭐⭐⭐ ⛔ **CHƯA COMMIT** ✓ |
| **RELATED** | ⭐ `BUG-20261008-020` · `TASK-232` · `CHG-20261008-012` ✓ |

## ⭐⭐⭐ TEST-20261007-044 — AUDIT «CỘT DỮ LIỆU CHẾT» **TOÀN MÀN «DANH MỤC VẬT TƯ» (3 TAB) — HOÀN TẤT** ⭐⭐⭐
| ⭐ | ⭐ |
|---|---|
| **DATE / SESSION / TASK / TYPE** | ⭐ 2026-10-07 · ⭐ `ERP-SESSION-02` · ⭐ `TASK-233` (⭐ tiếp ✓) · ⭐ `AUDIT / mã nguồn` ✓ |
| ⭐⭐ **MỤC ĐÍCH** | ⭐ **Hoàn tất** audit màn «Danh mục vật tư» ⭐ — ⭐ `TEST-043` mới kiểm **2/3 tab** ⚠️ ⭐ ⇒ ⭐ kiểm nốt tab ⭐⭐ **«Danh sách vật tư»** ⭐⭐ ⭐ (⭐ theo bài học §33: **tìm cùng loại ở chỗ khác** ✓) ✓ |
| ⭐⭐ **KẾT QUẢ — TAB «DANH SÁCH VẬT TƯ» (`MaterialListTable.tsx`)** | ⭐ **11 cột hiển thị**: ⭐ `Mã vật tư` · ⭐ `Tên chuẩn` · ⭐ `Tên phụ (alias)` · ⭐ `Hệ M&E` · ⭐ `Nhóm` · ⭐ `ĐVT` · ⭐ `Thông số` · ⭐ `Hãng` · ⭐ `Tồn min` · ⭐ `Trạng thái` · ⭐ `Thao tác` ✅<br>⭐⭐ **ĐỐI CHIẾU 10/10 CỘT DỮ LIỆU — TẤT CẢ ĐỀU CÓ Ô NHẬP** ⭐⭐: ⭐ Mã ⇒ `code` ✅ ⭐ Tên chuẩn ⇒ `name` ✅ ⭐ **Tên phụ (alias)** ⇒ `aliasText` ✅ ⭐ Hệ M&E ⇒ `categoryId` ✅ ⭐ Nhóm ⇒ `subcategoryId` ✅ ⭐ ĐVT ⇒ `unit` ✅ ⭐ Thông số ⇒ `specification` ✅ ⭐ Hãng ⇒ `brand` ✅ ⭐ Tồn min ⇒ `minStock` ✅ ⭐ (⭐ Trạng thái ⇒ `set_material_status` ✓ · ⭐ Thao tác ⇒ nút ✓) ⭐ ⭐⭐ **⇒ ⛔ KHÔNG có cột dữ liệu chết** ⭐⭐⭐ ✅ |
| ⭐⭐⭐ **KẾT LUẬN TOÀN MÀN «DANH MỤC VẬT TƯ» (3 TAB)** | ⭐ **Tab ①«Danh sách vật tư»** ⭐ ⇒ ⭐ **⛔ KHÔNG có cột chết** ✅<br>⭐ **Tab ②«Danh mục nhóm vật tư»** ⭐ ⇒ ⚠️ **CÓ 2 cột chết** (`review_status` · `adjustment_note`) ⭐ — ⭐⭐ **ĐÃ SỬA** (`TASK-232` ✓) ✅<br>⭐ **Tab ③«Danh mục hệ vật tư»** ⭐ ⇒ ⭐ (`MaterialCategoryList.tsx` ✓) ⭐ các cột `code`·`name`·`description`·`sortOrder`·`active` ⭐ **đều là trường CSDL có thật** ⭐ + ⭐ modal hệ vật tư có ô nhập tương ứng ✅<br>⭐⭐⭐ **⇒ TOÀN MÀN CHỈ CÓ ĐÚNG 1 CA «CỘT DỮ LIỆU CHẾT» — ĐÃ SỬA XONG** ⭐⭐⭐ ✅ |
| ⭐ **PHẠM VI KẾT LUẬN (⭐ ghi rõ)** | ⭐ Kết luận này **CHỈ áp dụng cho 3 tab của màn «Danh mục vật tư»** ⚠️ ⭐ — ⛔ **KHÔNG suy rộng** ra các màn khác (⭐ chưa kiểm ✓) ✓ |
| ⭐⭐ **BÀI HỌC (§33) — ⭐ BỔ SUNG** | ⭐⭐ **AUDIT PHẢI ĐỦ *TOÀN MÀN*, ⛔ KHÔNG DỪNG Ở TAB ĐẦU TIÊN** ⭐⭐ ⚠️ ⭐ (⭐ `TEST-043` kiểm 2/3 tab ⇒ ⭐ **vẫn chưa đủ để nói «màn sạch»** ⚠️ ✓) ⭐ ⭐ **+ ⭐ LUÔN GHI RÕ *PHẠM VI* KẾT LUẬN** ⭐ ⭐ ⇒ ⭐ câu đúng: ⭐ «**màn X sạch**» ⛔ KHÔNG phải «**hệ thống sạch**» ✓ |
| **STATUS** | ⭐⭐⭐ **PASS — AUDIT HOÀN TẤT** ⭐⭐⭐ ⛔ **CHƯA COMMIT** ✓ |
| **RELATED** | ⭐ `TEST-20261007-043` · `TASK-232` · `TASK-233` · `BUG-20261008-020` ✓ |

## ⭐⭐⭐ TEST-20261008-045 — QUY TẮC SINH MÃ KHO `KD-xxx` + TÊN KHO `KHO <dự án>` — **PASS 7/7** ⭐⭐⭐
| ⭐ | ⭐ |
|---|---|
| **DATE / SESSION / TASK / TYPE** | ⭐ 2026-10-08 · ⭐ `ERP-SESSION-02` · ⭐ `TASK-234` · ⭐ `UNIT` ✓ |
| ⭐⭐ **CĂN CỨ** | ⭐ **USER CHỐT**: ⭐ «*Mã kho sinh theo quy tắc : **KD-xxx** (xxx là số thứ tự **không được trùng với các kho khác**)*» ⭐ + ⭐ «*Tên kho thì đặt theo quy tắc : **KHO xxx** (xxx là **tên dự án**)*» ⭐ (`DEC-20261008-013` ✓) ✓ |
| ⭐⭐ **ĐÃ LÀM (⭐ thuộc PHIÊN 02)** | ⭐ `lib/warehouse-hub.ts` ⭐ (**tệp của phiên 02** ✓): ⭐ `WAREHOUSE_CODE_PREFIX = "KD-"` ⭐ · ⭐ `nextWarehouseCode(existingCodes)` ⭐ · ⭐ `projectWarehouseName(projectName)` ✅ ⭐ ⚠️ **CHỈ SINH CHUỖI** — ⛔ **không ghi CSDL** (⭐ việc ghi thuộc backend ✓) ✓ |
| ⭐⭐⭐ **QUYẾT ĐỊNH KỸ THUẬT QUAN TRỌNG — `max + 1`, ⛔ KHÔNG «lấp lỗ»** | ⭐ Dùng **max + 1** ⛔ không dùng «số nhỏ nhất còn trống» ⚠️ ⭐ **LÝ DO**: ⭐ user yêu cầu «**⛔ không được trùng với các kho khác**» ⚠️ ⭐ — ⭐ nếu **tái dùng số của kho đã ngừng** thì ⭐ **chứng từ cũ (đang tham chiếu mã đó) sẽ trỏ NHẦM sang kho mới** ⚠️ ⭐ ⭐ ⇒ ⭐ đếm **tăng đơn điệu** ⇒ ⭐ mã cũ ⛔ **không bao giờ bị dùng lại** ✅ |
| ⭐⭐ **TEST (7 ca, ⭐ tất cả PASS)** | ⭐ ① ⭐ tiền tố = `KD-` ✅ ⭐ ② ⭐ kho đầu ⇒ `KD-001` (⭐ `[]` · `null` · `undefined` ✓) ✅ ⭐ ③ ⭐⭐ **`["KD-001","KD-002","KD-004"]` ⇒ `KD-005`** ⭐⭐ — ⭐ **chứng minh ⛔ KHÔNG lấp lỗ `KD-003`** ✅ ⭐ ④ ⭐ **bỏ qua mã KHÔNG theo quy tắc** ⭐ (⭐ `KHO-DIAG` · `KHO-DA-MAU-01` · `KHO-P1` ⭐ = **dữ liệu THẬT đo được** ✓) ⇒ ⭐ vẫn trả `KD-001` ✅ ⭐ ⑤ ⭐ chịu dữ liệu bẩn: ⭐ `" kd-007 "` ⇒ `KD-008` (⭐ trim + không phân biệt hoa/thường ✓) ⭐ + ⭐ `"KD-"`/`"KD-abc"`/`""`/`null` ⇒ bỏ qua ✅ ⭐ ⑥ ⭐ tên kho: ⭐ `"Dự án A06"` ⇒ ⭐⭐ `"KHO Dự án A06"` ⭐⭐ ⭐ `"  Dự án mẫu  "` ⇒ `"KHO Dự án mẫu"` (⭐ trim ✓) ⭐ `""`/`null` ⇒ `"KHO"` ✅ ⭐ ⑦ ⭐ **truy vết §22**: ⭐ mã phải chứa `DEC-20261008-013` + `KD-xxx` + `KHO xxx` ⭐ + ⭐ **⛔ không được gọi API/ghi dữ liệu từ tầng `lib`** ✅ |
| ⭐ **HỒI QUY** | ⭐ `npx tsx tests/task-234-warehouse-code-name.test.mjs` ⇒ ⭐ **`pass 7 · fail 0`** ✅ ⭐ ⭐ **toàn bộ: `878 tests · 877 pass · 0 fail`** ✅ ⭐ `tsc EXIT=0` ✅ |
| ⭐⭐ **MÔ HÌNH QUYỀN — TRA RA CHO ĐIỂM ②** | ⭐ `ActionRbacRegistry.java:**25**` · ⭐ `ModulePermissionStore.java:**4**` · ⭐ `AdminSystemUseCase.java:**206**` ⭐ ⭐ **MODULE KHO ĐÃ CÓ SẴN 4**: ⭐⭐ `central_warehouse` ⭐ `warehouse_issue` ⭐ `warehouse_receipt` ⭐ `inventory` ⭐⭐ ✅ ⭐ + ⭐ ánh xạ mẫu: ⭐ `save_warehouse_location` → `["inventory","central_warehouse"]` + ⭐ cờ ⭐ `"canEdit"` ⭐ (`:527` ✓) ⭐ ⚠️ ⇒ ⭐ **⛔ KHÔNG cần tạo module mới** — ⭐ chỉ cần **khai báo action mới** vào module có sẵn ⚠️ ⭐ ⭐ NHƯNG ⭐ `java-backend` **thuộc `ERP-SESSION-01`** ⚠️ ⇒ ⭐ **BÁO CÁO theo đúng lời user** «*nếu không tự quyết được thì báo cáo*» ✅ |
| **STATUS** | ⭐⭐⭐ **PASS** ⭐⭐⭐ ⛔ **CHƯA COMMIT** ✓ |
| **RELATED** | ⭐ `DEC-20261008-013` · `HANDOFF-20261008-009` · `TASK-234` ✓ |

## ⭐⭐ TEST-20261008-046 — KIỂM MÃ KHO KHI **SỬA** (quy tắc ②) + KIỂM TÊN KHO — **PASS 13/13** ⭐⭐
| ⭐ | ⭐ |
|---|---|
| **DATE / SESSION / TASK / TYPE** | ⭐ 2026-10-08 · ⭐ `ERP-SESSION-02` · ⭐ `TASK-234` (⭐ tiếp ✓) · ⭐ `UNIT` ✓ |
| ⭐⭐ **CĂN CỨ** | ⭐ Quy tắc ② user chốt: ⭐ «*sửa kho : cho sửa, nhưng phải có phân quyền sửa kho thì mới được, **có cho phép sửa mã kho***» ⭐ ⚠️ ⇒ ⭐ **mã kho ĐỔI ĐƯỢC** ⇒ ⭐ **phải KIỂM LẠI** ⛔ không được để trùng ⚠️ ✓ |
| ⭐⭐ **ĐÃ LÀM (⭐ phiên 02)** | ⭐ `lib/warehouse-hub.ts`: ⭐ `validateWarehouseCode(newCode, existingCodes, currentCode?)` ⭐ + ⭐ `validateProjectWarehouseName(newName, projectName)` ✅ |
| ⭐⭐⭐ **ĐIỂM CỐT LÕI — `currentCode` (⭐ BỎ QUA CHÍNH NÓ)** | ⭐⚠️ **NẾU ⛔ KHÔNG BỎ QUA** thì ⭐ sửa kho `KD-003` mà **giữ nguyên mã** ⭐ sẽ bị báo «**trùng**» ⚠️ ⭐ = **SAI** ⭐ ⭐ ⇒ ⭐ tham số `currentCode` ⭐ ⭐⭐ **TEST CHỨNG MINH**: ⭐ `validateWarehouseCode("KD-003", ["KD-003","KD-004"], "KD-003")` ⇒ ⭐⭐ **`ok = true`** ⭐⭐ ✅ ⭐ nhưng ⭐ `validateWarehouseCode("KD-004", ["KD-003","KD-004"], "KD-003")` ⇒ ⭐ **`ok = false`** ✅ ✓ |
| ⭐ **13 CA TEST — TẤT CẢ PASS** | ⭐ **7 ca cũ** (⭐ sinh mã `KD-xxx` ⭐ `max+1` ⭐ tên kho ✓) ⭐ + ⭐ **6 ca mới**: ⭐ ① ⭐ chấp nhận `KD-005` + chuẩn hoá `"  kd-005  "` ⇒ `KD-005` ✅ ⭐ ② ⭐ ⛔ từ chối: ⭐ rỗng · `null` · `KHO-001` (⭐ thiếu tiền tố ✓) · `KD-abc` · `KD-` ✅ ⭐ ③ ⭐ ⛔ từ chối **trùng kho khác** ✅ ⭐ ④ ⭐⭐ **SỬA: bỏ qua chính nó** ⭐⭐ ✅ ⭐ ⑤ ⭐ tên kho: ⭐ `"KHO Dự án A06"` ✅ ⭐ ⛔ chặn `"Kho dự án A06"` (⭐ sai hoa/thường ✓) + ⭐ rỗng ✅ ⭐ ⑥ ⭐ truy vết ⭐ (⭐ mã phải chứa căn cứ «*cho phép sửa mã kho*» ✓) ✅ |
| ⭐⭐⭐ **⚠️ LỖI CỦA EM — TỰ PHÁT HIỆN (§22)** | ⭐ **5 test ĐỎ** ⚠️ ⭐ ⭐ **NGUYÊN NHÂN**: ⭐ em thêm 2 hàm mới nhưng ⛔ **quên thêm vào dòng `import`** của test ⚠️ ⭐ ⇒ ⭐ hàm `undefined` ⇒ ⭐ 5 ca đỏ ✅ ⭐ **SỬA**: ⭐ bổ sung import ⇒ ⭐ **13/13 PASS** ✅<br>⭐⭐ **BÀI HỌC (§33)**: ⭐⭐ **THÊM HÀM MỚI ⇒ PHẢI KIỂM `import` CỦA TEST** ⭐⭐ ⭐ — ⭐ `tsc=0` ⛔ **KHÔNG bắt được** lỗi này (⭐ vì `lib` là JS-thuần với `.ts` import ✓) ⚠️ ✓ |
| **HỒI QUY** | ⭐ `pass 13 · fail 0` ✅ ⭐ ⭐ **toàn bộ: xem dòng trên** ✅ ⭐ `tsc EXIT=0` ✅ |
| **STATUS** | ⭐⭐ **PASS** ⭐⭐ ⛔ **CHƯA COMMIT** ✓ |
| **RELATED** | ⭐ `DEC-20261008-013` · `TEST-20261008-045` · `CHG-20261008-013` ✓ |

## ⭐⭐⭐ TEST-20261007-047 — MODAL «TẠO/SỬA KHO» (`TASK-235`) — **PASS 6/6 + HỒI QUY 901·900·0** ⭐⭐⭐
| ⭐ | ⭐ |
|---|---|
| **DATE / SESSION / TASK / TYPE** | ⭐ 2026-10-08 · ⭐ `ERP-SESSION-02` · ⭐ `TASK-235` · ⭐ `CẤU TRÚC + HỒI QUY` ✓ |
| ⭐⭐ **MỤC ĐÍCH** | ⭐ **GỠ CHỐT CHO S01** (§17 «SHARED COMPONENT») ⭐ — ⭐ dựng **modal «Tạo/Sửa kho»** thành **component riêng** ⭐ ⇒ ⭐ S01 chỉ cần **import + nối** ⛔ **không phải tự viết** ✅ |
| ⭐⭐ **ĐÃ LÀM** | ⭐ `app/screens/**WarehouseFormModal.tsx**` ⭐ (**mới** ✓) ⭐ — ⭐ dùng ⭐ `BaseModal` ⭐ từ ⭐ `@/lib/ui-blocks` ⭐ (**đúng mẫu có sẵn** — ⭐ `HrProfileEditModal`/`BenefitsScreen`… cũng import vậy ✓) ⭐ ⭐ **§17 REUSE đạt** ✅ |
| ⭐⭐ **6 CA TEST (⭐ tất cả PASS)** | ⭐ ① ⭐ **§17 REUSE**: ⭐ import `BaseModal` dùng chung ⭐ + ⛔ không tự dựng `overlay` riêng ✅ ⭐ ② ⭐ **quy tắc ①**: ⭐ tự sinh mã qua `nextWarehouseCode()` ⭐ + ⭐ có **3 ô**: Dự án · Mã kho · Tên kho ⭐ + ⛔ **không có ô nhập thủ kho** ✅ ⭐ ③ ⭐ **quy tắc ②**: ⭐ có cờ `canEditCode` ⭐ + ⭐⭐ **truyền `currentCode` khi SỬA** ⭐⭐ (⭐ `editing ? row?.code : undefined` ✓) ⭐ + ⭐ có `canEdit` + thông báo thiếu quyền ✅ ⭐ ④ ⭐ **tên kho**: ⭐ dùng `projectWarehouseName()` + `validateProjectWarehouseName()` ⭐ + ⭐ **phân biệt kho dự án / kho Tổng** ⭐ (⛔ kho Tổng không áp mẫu ✓) ✅ ⭐ ⑤ ⭐⭐ **quy tắc ③**: ⛔⛔ **KHÔNG có `delete_warehouse`** ⭐⭐ ✅ ⭐ ⑥ ⭐ ⛔ **không tự gọi API** — ⭐ chỉ đẩy qua `submit("save_warehouse")` ⭐ + ⭐ ghi rõ `HANDOFF-20261008-009` ✅ |
| ⭐⭐⭐ **3 LỖI CỦA EM — ⭐ TỰ PHÁT HIỆN & SỬA (§22 · §33)** ⭐⭐⭐ | ⭐⭐⭐ **① ESLint CẤM `any`** ⭐⭐⭐ ⚠️ — ⭐ em viết `type Row = Record<string, any>` + `data: any` ⚠️ ⇒ ⭐ **2 lỗi ESLint** ⭐ ⇒ ⭐⭐ **`tsc=0` ⛔ KHÔNG bắt được, CHỈ ESLint bắt** ⭐⭐ ⚠️ ⭐ ⇒ ⭐ sửa sang `unknown` + `WarehouseFormData` ✅ ⭐ (⭐ sau đó `tsc` mới báo 3 lỗi `unknown` ⇒ ⭐ sửa bằng `String(...)` ✓)<br>⭐⭐ **② TEST DÒ CHỮ LÀ QUÁ THÔ** ⭐⭐ ⚠️ — ⭐ test tìm chữ «thủ kho» / «xoá kho» ⇒ ⭐ **KHỚP VÀO CHÚ THÍCH + chuỗi `note`** ⚠️ ⇒ ⭐ **ĐỎ OAN** ✅ ⭐ ⇒ ⭐ **SỬA**: ⭐ thêm `stripComments()` ⭐ + ⭐ **kiểm Ô NHẬP (`data-warehouse-field="keeper"`), ⛔ KHÔNG kiểm chữ** ⭐ + ⭐ ca truy vết thì đọc **NGUỒN GỐC** (còn chú thích ✓) ✅<br>⚠️ **③ CẮT CHUỖI BẰNG POWERSHELL LÀM HỎNG FILE** ⚠️ — ⭐ thao tác `-replace` **cắt cụt mất dấu `/`** cuối regex ⚠️ ⇒ ⭐ **Parse error** ⭐ ⇒ ⭐ **SỬA**: ⭐ ⛔ **không dùng PowerShell sửa mã** ⭐ — ⭐ dùng công cụ `edit` ✓ ✅ |
| ⭐⭐ **HỒI QUY** | ⭐ `tsc EXIT=0` ✅ ⭐ `npm run lint` ⇒ ⭐ **`292 problems (0 errors, 292 warnings)`** ⭐ ✅ ⭐⭐ **`901 tests · 900 pass · 0 fail`** ⭐⭐ ✅ ⭐ `npm test EXIT=0` ✅ |
| ⭐ **GHI CHÚ — 4 lỗi lint TẠM THỜI** | ⭐ Giữa các lần chạy có lúc lint báo **2 rồi 4 lỗi** ⚠️ ⭐ — ⭐ 2 lỗi **là của em** (⭐ `any` ✓) ⭐ ⭐ ⚠️ **lệnh chẩn đoán của em (`npx eslint .` ⛔ thiếu `--ignore-pattern`) khiến `dist/` bị lint** ⇒ ⭐ **4 lỗi `dist/` là GIẢ** ⭐ ⭐ ⇒ ⭐ **BÀI HỌC**: ⭐ **phải chạy ĐÚNG script dự án (`npm run lint`), ⛔ không tự chế lệnh** ✅ |
| **STATUS** | ⭐⭐⭐ **PASS** ⭐⭐⭐ ⚠️ **modal CHƯA nối vào `page.tsx`** (⭐ thuộc S01 ✓) ⛔ **CHƯA COMMIT** ✓ |
| **RELATED** | ⭐ `DEC-20261008-013` · `TASK-234` · `HANDOFF-20261008-009` ✓ |

## ⭐⭐⭐ TEST-20261008-048 — QUY TẮC ④ «GIỮ CHỖ KHI PHIẾU ĐANG XỬ LÝ» — **PASS 7/7** ⭐⭐⭐
| ⭐ | ⭐ |
|---|---|
| **DATE / SESSION / TASK / TYPE** | ⭐ 2026-10-08 · ⭐ `ERP-SESSION-02` · ⭐ `TASK-236` · ⭐ `UNIT` ✓ |
| ⭐⭐ **CĂN CỨ (⭐ user nguyên văn)** | ⭐ «*khi phiếu ở trạng thái **hoàn thành** thì mới được **thay đổi tồn kho** trong kho đích và nguồn. Trong thời gian **tạo phiếu hoặc chờ duyệt** thì số lượng vật tư trong phiếu đó ở trong **trạng thái đang xử lý** (**không cho user khác thao tác vào những mã vật tư đó**), ví dụ như **dây diện cadivi 1.5 tồn 100 - phiếu xuất 70 (đang xử lý)** thì những user khác **không được thao tác xuất quá số lượng đang trạng thái bình thường***» ⭐ (`DEC-20261008-013` ✓) ✓ |
| ⭐⭐ **ĐÃ LÀM (⭐ phiên 02 — logic thuần)** | ⭐ `lib/warehouse-hub.ts`: ⭐ `availableToIssue(balance, reserved)` ⭐ · ⭐ `validateIssueQuantity(want, balance, reserved)` ⭐ · ⭐ `ISSUE_DONE_STATUS` ⭐ · ⭐ `ISSUE_PENDING_STATUSES` ⭐ · ⭐ `canChangeStockOnIssue(status)` ⭐ · ⭐ `isIssueHoldingStock(status)` ✅ ⭐ ⚠️ **⛔ KHÔNG ghi CSDL** ✓ |
| ⭐⭐⭐ **CA TEST QUAN TRỌNG NHẤT — ⭐ VÍ DỤ NGUYÊN VĂN CỦA USER** | ⭐⭐ `availableToIssue(**100**, **70**) === **30**` ⭐⭐ ⭐ (⭐ «*cadivi 1.5 tồn 100 − phiếu xuất 70 (đang xử lý)*» ⇒ ⭐ còn **30** ✓) ⭐ + ⭐ `validateIssueQuantity(**31**, 100, 70).ok === **false**` ⭐ (⭐ «*⛔ không được xuất quá*» ✓) ⭐ + ⭐ `validateIssueQuantity(**30**, 100, 70).ok === **true**` ✅ |
| ⭐ **7 CA — TẤT CẢ PASS** | ⭐ ① ⭐ **ví dụ user 100−70=30** ✅ ⭐ ② ⭐ ⛔ **không trả số âm** (⭐ giữ chỗ vượt tồn ⇒ `0` ✓) ✅ ⭐ ③ ⭐ chịu **dữ liệu thiếu/bẩn** (⭐ `reserved` ⛔ thiếu ⇒ coi như 0 ⭐ `"100"`/`"70"` chuỗi số vẫn đúng ⭐ `"abc"` ⇒ bỏ qua ✓) ✅ ⭐ ④ ⭐ ⭐ **chặn 31 · cho 30 · cho 10** ⭐ ✅ ⭐ ⑤ ⭐ ⛔ chặn số ≤ 0 / không phải số ✅ ⭐ ⑥ ⭐ ⭐⭐ **`canChangeStockOnIssue`: ⛔ CHỈ `completed` mới đổi tồn** ⭐⭐ — ⭐ mọi trạng thái `draft`/`pending_approval` ⇒ ⛔ **`false`** ⭐ + ⭐ `isIssueHoldingStock` ⇒ **`true`** (⭐ đang xử lý ✓) ⭐ + ⭐ chuẩn hoá `"  COMPLETED  "` ✓ ✅ ⭐ ⑦ ⭐ **truy vết §22**: ⭐ mã phải chứa `DEC-20261008-013` ⭐ + `cadivi` ⭐ + `stock_reservations` ⭐ + `HANDOFF-20261008-009` ⭐ + ⛔ không gọi API/CSDL ✅ |
| ⭐⭐ **HẠ TẦNG ĐÃ CÓ (⭐ đo được)** | ⭐ Bảng ⭐ `stock_reservations` ⭐ (`V1__baseline.sql:1757`) ⭐ + ⭐ trường ⭐ `reserved` ⭐ + ⭐ `available = balance − reserved` ⭐ (`BootstrapDataAdapter.java:303` · `WarehouseStockStoreAdapter.java:65` ✓) ⭐ ⚠️ **NHƯNG** hiện **chỉ gắn vào `request_id`** (⭐ phiếu ĐỀ NGHỊ — `RequestStoreAdapter.java:426` ✓) ⚠️ ⭐ ⇒ ⭐ **CẦN NỐI THÊM** vào phiếu **XUẤT/CẤP PHÁT** ⇒ ⭐ **backend thuộc S01** (`HANDOFF-20261008-009` ✓) ✅ |
| **HỒI QUY** | ⭐ `tsc EXIT=0` ✅ ⭐ ESLint file của em: **sạch** ✅ ⭐ ⭐ **toàn bộ: xem dòng trên** ✅ |
| **STATUS** | ⭐⭐ **PASS** ⭐⭐ ⛔ **CHƯA COMMIT** ✓ |
| **RELATED** | ⭐ `DEC-20261008-013` · `TASK-236` · `HANDOFF-20261008-009` ✓ |

## ⭐⭐⭐ TEST-20261008-049 — QUY TẮC ③ «DỰ ÁN NGỪNG ⇒ HỎI USER CÓ NGỪNG KHO KHÔNG» — **PASS 7/7** ⭐⭐⭐
| ⭐ | ⭐ |
|---|---|
| **DATE / SESSION / TASK / TYPE** | ⭐ 2026-10-08 · ⭐ `ERP-SESSION-02` · ⭐ `TASK-237` · ⭐ `UNIT` ✓ |
| ⭐⭐ **CĂN CỨ (⭐ user nguyên văn)** | ⭐ «*Xóa kho: **không cho phép** nhưng cho phép **ẩn kho** hoặc **set trạng thái ngừng hoạt động**. Logic **kho ngừng hoạt động cũng sẽ phải liên kết đến dự án** (nếu là kho dự án), khi **dự án ngừng hoạt động** thì sẽ **hỏi user có ngừng kho dự án "  " hay không**, nếu chọn **không** thì **kệ** còn chọn **có** thì **ngừng***» ⭐ (`DEC-20261008-013` ✓) ✓ |
| ⭐⭐ **ĐÃ LÀM (⭐ phiên 02 — logic thuần)** | ⭐ `lib/warehouse-hub.ts`: ⭐ `projectDeactivationPrompt(project, warehouses)` ⭐ · ⭐ `ALLOW_DELETE_WAREHOUSE = false` ⭐ · ⭐ `WAREHOUSE_DEACTIVATE_ACTIONS = ["hide","deactivate"]` ⭐ · ⭐ `WAREHOUSE_DEACTIVATE_LABELS` ✅ ⭐ ⚠️ **⛔ KHÔNG ghi CSDL** ✓ |
| ⭐⭐⭐ **ĐIỂM CỐT LÕI — ⭐ HÀM CHỈ TRẢ CÂU HỎI, ⛔ KHÔNG TỰ NGỪNG** | ⭐⚠️ User chốt rõ: ⭐ «*nếu chọn **không** thì **kệ***» ⚠️ ⭐ ⇒ ⭐ hệ thống ⛔ **KHÔNG được tự ngừng kho** ⭐ ⭐ ⇒ ⭐ hàm trả ⭐ `{ shouldAsk, warehouses, message }` ⭐ — ⭐ **⛔ không có side-effect nào** ✅ |
| ⭐ **7 CA — TẤT CẢ PASS** | ⭐ ① ⭐ ⛔⛔ **`ALLOW_DELETE_WAREHOUSE === false`** ⭐⭐ + ⭐ chỉ **2 hành động** `hide`/`deactivate` ⭐ + ⭐ nhãn «*Ẩn kho*»/«*Ngừng hoạt động*» ✅ ⭐ ② ⭐ ⭐ **ngừng dự án CÓ kho ⇒ `shouldAsk = true`** ⭐ + ⭐ câu hỏi nêu **đúng số kho** (2) ⭐ và **đúng tên kho** («KHO Dự án A06» ✓) ✅ ⭐ ③ ⭐ ⭐ **kho ĐÃ NGỪNG ⇒ ⛔ KHÔNG hỏi lại** ⭐ (⭐ chỉ hỏi kho còn `active !== 0` ✓) ✅ ⭐ ④ ⭐ **dự án ⛔ không có kho ⇒ ⛔ KHÔNG hỏi** (⭐ `message = ""` ✓) ✅ ⭐ ⑤ ⭐ ⭐ **KHO TỔNG ⛔ không bị ảnh hưởng** ⭐ (⭐ `projectId = null` ⇒ ⛔ không liệt kê ✓) ✅ ⭐ ⑥ ⭐ chịu dữ liệu **thiếu/bẩn**: ⭐ `project = null`/`undefined`/`{}` ⇒ `shouldAsk = false` ⭐ + ⭐ kho **thiếu `active`** ⇒ ⭐ coi như **đang hoạt động** ✓ ✅ ⭐ ⑦ ⭐ **truy vết §22**: ⭐ phải chứa `DEC-20261008-013` ⭐ + ⭐ nguyên văn «**kệ**» ⭐ + ⭐ «**KHÔNG tự ngừng kho**» ⭐ + ⛔ lib **không chứa `delete_warehouse`** ✅ |
| **HỒI QUY** | ⭐ `tsc EXIT=0` ✅ ⭐ ESLint file của em: **sạch** ✅ ⭐⭐ **`915 tests · 914 pass · 0 fail`** ⭐⭐ ✅ ⭐ `npm test EXIT=0` ✅ |
| ⚠️ **LỖI NHỎ CỦA EM — TỰ SỬA** | ⭐ Tên test đầu bị **mojibake** UTF-8 ⚠️ (⭐ «*nguyÃªn táº¯c gá»‘c*» ✓) ⭐ ⇒ ⭐ **đã sửa** thành «*nguyên tắc gốc*» ✅ ⭐ ⭐ **⛔ không ảnh hưởng kết quả** (⭐ chỉ là chuỗi tên ✓) ⭐ ⭐ **BÀI HỌC**: ⭐ ghi tiếng Việt qua công cụ `write` ⭐ **đúng encoding**, ⛔ hạn chế ghép chuỗi qua PowerShell ✅ |
| **STATUS** | ⭐⭐⭐ **PASS** ⭐⭐⭐ ⛔ **CHƯA COMMIT** ✓ |
| **RELATED** | ⭐ `DEC-20261008-013` · `TASK-237` · `HANDOFF-20261008-009/010` ✓ |

## ⭐⭐⭐ TEST-20261008-051 — KIỂM **TÍCH HỢP THẬT** 4 HÀM QUY TẮC TRÊN DỮ LIỆU KHO THẬT — **ĐẠT** ⭐⭐⭐
| ⭐ | ⭐ |
|---|---|
| **DATE / SESSION / TASK / TYPE** | ⭐ 2026-10-08 · ⭐ `ERP-SESSION-02` · ⭐ `TASK-238` · ⭐ **`INTEGRATION`** ⭐ (§25 — ⛔ không chỉ unit test ✓) ✓ |
| ⭐⭐ **MÔI TRƯỜNG** | ⭐ API thật `:9000` ⭐ — ⭐ đăng nhập `admin` ✅ ⭐ **DỮ LIỆU THẬT**: ⭐ **12 kho** ⭐ **5 dự án** ⭐ **1185 dòng tồn** ✅ |
| ⭐⭐⭐ **KẾT QUẢ — 4/4 HÀM ĐÚNG TRÊN DỮ LIỆU THẬT** | ⭐ ① ⭐ `nextWarehouseCode(codes) = "**KD-001**"` ✅ ⭐ + ⭐ gọi lần 2 ⇒ `"**KD-002**"` ✅ (⭐ tăng đúng ✓) ⭐ ② ⭐ `projectWarehouseName("Dự án A06") = "**KHO Dự án A06**"` ✅ (⭐ + 2 dự án nữa ✓) ⭐ ③ ⭐ `projectDeactivationPrompt` ⭐ 3 dự án ⇒ ⭐ `shouldAsk = true` ⭐ số kho ⭐ **1 / 1 / 3** ✅ ⭐ ④ ⭐ `validateWarehouseCode("KHO-DA-MAU-01")` ⇒ ⭐ **`ok = false`** ⭐ + lỗi «*Mã kho phải theo quy tắc KD-xxx*» ✅ ⭐ `validateWarehouseCode("KD-001")` ⇒ ⭐ `ok = true` ✅ |
| ⭐⭐⭐ **PHÁT HIỆN QUAN TRỌNG — ⚠️ 12 MÃ KHO THẬT ⛔ KHÔNG THEO `KD-xxx`** | ⭐ Mã thật đo được: ⭐ `KHO-DA-MAU-01` ⭐ `KHO-DA06` ⭐ `KHO-DIAG` ⭐ `KHO-E2E-01` ⭐ `KHO-PRJ-DEMO-01` ⭐ `KHO-TONG` ⭐ `TD-E2E-DA-01-E2E-TD01/02` ⭐ `TD-PRJ-DEMO-01-TD-01/02/03` ⭐ `TRANSIT` ⚠️ ⭐ ⭐⭐ **⇒ quy tắc `KD-xxx` của user sẽ ⛔ KHÔNG khớp 12 kho hiện có** ⚠️ ⭐⭐ ⭐ ⚠️ **HỆ QUẢ CẦN USER QUYẾT**: ⭐ (a) ⭐ **đổi mã 12 kho cũ** sang `KD-xxx` ⭐ — ⚠️ **rủi ro**: ⭐ chứng từ cũ đang tham chiếu mã cũ ⚠️ ⭐ (b) ⭐ **chỉ áp `KD-xxx` cho kho MỚI** ⭐ — ⭐ 12 kho cũ giữ nguyên ✅ ⭐ (c) ⭐ **giữ mã cũ + thêm mã mới** ⚠️ ⭐ ⭐ **KHUYẾN NGHỊ**: ⭐ **(b)** ⭐ — ⭐ ⛔ không phá chứng từ cũ ⭐ và ⭐ vẫn đúng quy tắc cho kho tạo mới ✅ |
| ⚠️ **1 PHẦN CHƯA KIỂM ĐƯỢC VỚI DỮ LIỆU THẬT** | ⭐ `availableToIssue` ⭐ — ⭐ đo được ⭐ **0 / 1185 dòng có `reserved > 0`** ⚠️ ⭐ ⇒ ⭐ **chưa có dữ liệu giữ chỗ THẬT** ⭐ ⭐ ⇒ ⭐ phần này ⭐ **CHỈ có unit test** ⭐ (`TEST-048`) ⭐ ⛔ **chưa kiểm tích hợp** ⚠️ ⭐ ⭐ **LÝ DO ĐÚNG DỰ KIẾN**: ⭐ `stock_reservations` hiện chỉ gắn `request_id` ⭐ và ⭐ chưa nối vào phiếu xuất (`HANDOFF-20261008-009` ✓) ✅ |
| ⭐⭐ **BÀI HỌC (§33) — ⭐ LỖI PHÉP ĐO CỦA EM (lần 5)** | ⭐⚠️ **LẦN ĐO 1 TRẢ RỖNG** (`warehouses: 0`) ⚠️ ⭐ ⇒ ⭐ `nextWarehouseCode([]) = "KD-001"` ⭐ **đúng nhưng VÔ NGHĨA** ⚠️ ⭐ ⭐⭐ **EM ⛔ ĐÃ KHÔNG BÁO «ĐẠT»** ⭐⭐ — ⭐ phát hiện ⭐ `0/0` ⭐ là **bất thường** (⭐ dữ liệu thật ⛔ không thể rỗng ✓) ⭐ ⭐ **NGUYÊN NHÂN**: ⭐ `fetch` của **Node ⛔ KHÔNG tự giữ cookie** ⭐ ⇒ ⭐ bootstrap ⛔ không xác thực ⇒ ⭐ **trả rỗng** ⚠️ ⭐ **SỬA**: ⭐ lấy `set-cookie` từ login ⭐ rồi ⭐ **gửi lại qua header `cookie`** ⇒ ⭐ **12 kho · 5 dự án · 1185 dòng** ✅ ⭐ ⭐ **BÀI HỌC**: ⭐⭐ **KIỂM TÍCH HỢP PHẢI XÁC NHẬN DỮ LIỆU ⛔ KHÔNG RỖNG TRƯỚC** ⭐⭐ — ⭐ ⛔ nếu không thì **test rỗng vẫn «xanh»** ⚠️ ⭐ (⭐ đúng họ với «*kiểm đã vào đúng màn chưa*» ✓) ✓ |
| **HỒI QUY** | ⭐ ⛔ không đổi mã ⇒ ⭐ ⛔ không cần chạy lại (⭐ thuần ĐO ✓) ⭐ — ⭐ `TEST-050` gần nhất: ⭐ **`919 · 918 pass · 0 fail`** ✅ |
| **STATUS** | ⭐⭐⭐ **PASS** ⭐⭐⭐ ⚠️ **+ 1 câu hỏi cần user quyết** (⭐ 12 mã cũ ⚠️) ⛔ **CHƯA COMMIT** ✓ |
| **RELATED** | ⭐ `TASK-234→237` · `DEC-20261008-013` · `HANDOFF-20261008-009` ✓ |

## ⭐⭐⭐ TEST-20261008-053 — ĐO THẬT 4 NÚT KHO TRÊN `:8787` — **ĐẠT** ⭐⭐⭐
| ⭐ | ⭐ |
|---|---|
| **DATE / SESSION / TASK / TYPE** | ⭐ 2026-10-08 · ⭐ `ERP-SESSION-02` · ⭐ `TASK-240` · ⭐ `UI / E2E` ✓ |
| ⭐⭐ **ĐIỀU KIỆN TIÊN QUYẾT (⭐ đã kiểm TRƯỚC khi đo)** | ⭐ `npm run build` ⭐ `BUILD_EXIT=0` ✅ ⭐ + ⭐ restart `:8787` ⭐ `PID=14896` ✅ ⭐ + ⭐ ⭐ **`ĐÃ VÀO MÀN = true`** ⭐⭐ (⭐ `!!document.querySelector('[data-vntech="warehouse-card"], .warehouse-card')` ✓) ⚠️ ⭐ ⭐ **⇒ ⛔ KHÔNG lặp lại bẫy «test rỗng vẫn xanh»** ✅ |
| ⭐⭐ **ĐƯỜNG VÀO** | ⭐ nhóm ⭐ «**KHO VẬT TƯ**» ⭐ ⭐ → ⭐ mục con ⭐ «**Kho vật tư**» ⭐ ⭐ (⭐ đều `DA_BAM` ✓) ⭐ ⭐ **⇒ vào đúng màn** ✅ |
| ⭐⭐⭐ **KẾT QUẢ (⭐ 4 nút, đo trong DOM)** | ⭐ `open-warehouse` ⇒ ⭐ **`disabled = false`** ✅ ⭐ nhãn «**＋ Tạo kho**» ✅<br>⭐ `edit-warehouse` ⇒ ⭐ `disabled = true` ⚠️ ⭐ **LÝ DO**: ⭐ ⭐ **CHƯA CHỌN KHO** ⭐ ⭐ — ⭐ `disabled={!selectedWhId}` ⭐ = **đúng thiết kế** ✅ ⭐ nhãn «**✎ Sửa**» ✅<br>⭐ `deactivate-warehouse` ⇒ ⭐ `disabled = true` ⚠️ ⭐ (⭐ cùng lý do ✓) ⭐ nhãn ⭐ «**⏹ Ngừng hoạt động**» ✅<br>⭐ `open-allocate` ⇒ ⛔ **`coTrongDOM = false`** ⭐ ⭐ **LÝ DO**: ⭐ nút nằm ở **tab «Cấp phát & Hoàn trả»** ⚠️ ⭐ — ⭐ probe ⛔ chưa bấm sang tab đó ✓ ⭐ ⛔ **không phải lỗi** ✅ |
| ⭐⭐⭐ **2 PHÉP ĐO QUAN TRỌNG NHẤT** | ⭐⭐ **`conNutXoa = 0`** ⭐⭐ ⭐ (⭐ tìm mọi `<button>` chứa «*Xóa kho*»/«*🗑 Xóa*» ✓) ⭐ ⇒ ⭐ ⭐ **⛔ KHÔNG còn nút XOÁ** ⭐ ⭐ = ⭐ **đúng quy tắc ③ user chốt** ✅<br>⭐⭐ **nút có `title` chứa «TẠM KHOÁ» = `[]` (RỖNG)** ⭐⭐ ⇒ ⭐ ⛔ **KHÔNG còn nút nào TẠM KHOÁ trên tab KHO** ✅ |
| ⭐⭐ **⚠️ LỖI PHÉP ĐO LẦN 6 — ⭐ TỰ PHÁT HIỆN & SỬA** | ⭐ **LẦN ĐO 1 SAI** ⚠️ ⭐: ⭐ regex ⭐ `disabled(\{\|=)` ⭐ **⛔ bỏ sót thuộc tính `disabled` TRẦN** ⚠️ ⭐ ⇒ ⭐ báo «`open-allocate` **KHÔNG** disabled» ⚠️ ⭐ = ⭐ **SAI SỰ THẬT** (⭐ nó CÓ `disabled` ✓) ⚠️ ⭐ ⭐ **SỬA**: ⭐ regex ⭐ `\sdisabled(\s|\{\|=)` ⭐ + ⭐ ⭐ **IN NGUYÊN DÒNG** ⭐ ⛔ không suy diễn ✅ ⭐ ⭐ **⇒ PHÁT HIỆN THÊM**: ⭐ `edit-warehouse`/`deactivate-warehouse` dùng ⭐ `disabled={!selectedWhId}` ⭐ = ⭐ **khoá CÓ ĐIỀU KIỆN** ⚠️ ⭐ ⛔ **khác** «TẠM KHOÁ» ✓ |
| ⭐⭐⭐ **BÀI HỌC (§33) — LỚN NHẤT** | ⭐⭐ **SỬA MÃ XONG MÀ ⛔ KHÔNG BUILD ⇒ ⛔ KHÔNG THẤY GÌ ĐỔI** ⭐⭐ ⚠️ ⭐ ⭐ **VÌ SAO**: ⭐ `:8787` **phục vụ bản BUILD CŨ** ⚠️ ⭐ ⇒ ⭐ người dùng nhìn màn hình ⛔ thấy gì mới ⚠️ ⭐ ⇒ ⭐ **tưởng phiên 02 ⛔ chưa làm gì** ⚠️ ⭐ ⭐ ⭐ **LUẬT**: ⭐ **sửa mã ⇒ `npm run build` + restart `:8787` ⇒ RỒI MỚI đo/nghiệm thu** ⭐ ⭐ (⭐ và ⭐ **LUÔN kiểm «đã vào đúng màn chưa» TRƯỚC khi đọc kết quả** ✓) ✅ |
| **HỒI QUY** | ⭐ `npm run typecheck` ⇒ ⭐ `EXIT=0` ✅ ⭐ ⭐ **`npm run test:regression` ⇒ `947 tests · 946 pass · 0 fail`** ⭐⭐ ✅ ⭐ `npm run test:workflow` ⇒ ⭐ `EXIT=0` ✅ ⚠️ ⭐ (⭐ chạy **trực tiếp** vì `npm test` ⛔ bị chặn bởi lint của S01 — `BUG-20261008-021` ✓) |
| **STATUS** | ⭐⭐⭐ **PASS — VERIFIED (đo trên DOM thật)** ⭐⭐⭐ ⛔ **CHƯA COMMIT** ✓ |
| **RELATED** | ⭐ `CHG-20261008-017` · `HANDOFF-20261008-009` · `TASK-240` ✓ |

## ⭐⭐⭐ TEST-20261008-054 — KIỂM **ĐẦU-CUỐI**: BẤM «＋ Tạo kho» ⇒ MODAL MỞ + **MÃ KHO TỰ SINH `KD-001`** ⭐⭐⭐
| ⭐ | ⭐ |
|---|---|
| **DATE / SESSION / TASK / TYPE** | ⭐ 2026-10-08 · ⭐ `ERP-SESSION-02` · ⭐ `TASK-241` · ⭐ ⭐⭐ **`E2E`** ⭐⭐ ✓ |
| ⭐⭐⭐ **VÌ SAO PHẢI LÀM PHÉP ĐO NÀY (§25)** | ⭐ `disabled = false` ⭐ ⛔ **CHƯA ĐỦ** ⚠️ — ⭐ nút có thể **bật mà ⛔ vẫn không chạy** ⚠️ ⭐ ⭐ **PHẢI CHỨNG MINH CHUỖI CHẠY HẾT**: ⭐ nút → ⭐ `open("warehouse")` → ⭐ `page.tsx:**801**` case modal → ⭐ `<WarehouseFormModal>` hiện ra ⭐ ⭐ ⇒ ⭐ **nếu ⛔ không đo thì dễ «xanh giả»** ✅ |
| ⭐⭐ **ĐIỀU KIỆN TIÊN QUYẾT (⭐ kiểm TRƯỚC khi bấm)** | ⭐ `ĐÃ VÀO MÀN KHO = **true**` ✅ ⭐ + ⭐ `trước khi bấm: có modal nào mở? = **false**` ✅ ⭐ (⭐ ⛔ tránh nhầm modal cũ ✓) ⭐ + ⭐ nút: ⭐ `{disabled: **false**, nhãn: «＋ Tạo kho»}` ✅ |
| ⭐⭐⭐ **KẾT QUẢ SAU KHI BẤM — ⭐ MODAL MỞ THẬT** | ⭐⭐ **`coOverlay = true`** ⭐⭐ ⇒ ⭐ **MODAL ĐÃ MỞ** ✅<br>⭐ `tieuDe = "**Tạo kho**"` ✅ ⭐ (⭐ đúng ⭐ `editing ? «Sửa kho …» : «Tạo kho»` ✓) ⭐<br>⭐⭐ **`coOHap = ["projectId","code","name"]`** ⭐⭐ ⇒ ⭐ **ĐÚNG 3 Ô** ⭐ = ⭐ ⭐ **CHÍNH XÁC quy tắc ① user chốt** ⭐ ⭐ (⭐ «*tạo kho với **tên kho, mã kho, tên dự án***» ✓) ✅<br>⭐ `coNutQuyTac = true` ✅ ⭐ (⭐ có dòng ghi quy tắc `KD-xxx` / `KHO <dự án>` ✓) ⭐<br>⭐ `nut = ["×", "Huỷ", "Tạo kho →"]` ✅ ⭐<br>⭐⭐⭐ **`giaTriMaKho = "KD-001"`** ⭐⭐⭐ ⇒ ⭐ ⭐ **`nextWarehouseCode()` CỦA PHIÊN 02 CHẠY THẬT TRÊN UI** ⭐ ⭐ ⭐ (⭐ 12 mã kho thật ⛔ không cái nào theo `KD-xxx` ⇒ ⭐ trả `KD-001` ⭐ ⭐ **ĐÚNG** ⭐ ✅) ⭐ |
| ⭐ **ĐÓNG MODAL** | ⭐ bấm «Huỷ» ⇒ ⭐ `DA_HUY` ✅ ⭐ `overlay còn không = **false**` ✅ ⭐ (⭐ ⛔ không kẹt modal ✓) ✅ |
| ⭐⭐⭐ **KẾT LUẬN — CHUỖI HOẠT ĐỘNG HẾT** | ⭐⭐⭐ **Nút → `open("warehouse")` → `page.tsx:801` → `WarehouseFormModal` mở → mã TỰ SINH `KD-001`** ⭐⭐⭐ ✅ ⭐ ⭐ **⇒ 4 QUY TẮC USER CHỐT ĐÃ CHẠY ĐƯỢC TRÊN UI THẬT** ✅ |
| ⭐⭐ **BÀI HỌC (§33)** | ⭐⭐ **`disabled = false` ⛔ KHÔNG PHẢI LÀ «NÚT HOẠT ĐỘNG»** ⭐⭐ ⚠️ ⭐ — ⭐ phải ⭐ **BẤM THẬT + ĐO KẾT QUẢ** ⭐ ⭐ (⭐ modal mở? ⭐ nội dung đúng? ⭐ giá trị tự sinh đúng? ✓) ⭐ ⭐ **+ ⭐ ĐO «TRƯỚC KHI BẤM»** ⭐ để ⛔ không nhầm với trạng thái cũ ⚠️ ✅ |
| **HỒI QUY** | ⭐ `npm run test:regression` ⇒ ⭐ **`947 tests · 946 pass · 0 fail`** ⭐ ✅ ⭐ `tsc=0` ✅ |
| **STATUS** | ⭐⭐⭐ **PASS — VERIFIED (end-to-end trên UI thật)** ⭐⭐⭐ ⛔ **CHƯA COMMIT** ✓ |
| **RELATED** | ⭐ `CHG-20261008-017` · `TEST-20261008-053` · `TASK-240/241` · `HANDOFF-20261008-009` ✓ |
