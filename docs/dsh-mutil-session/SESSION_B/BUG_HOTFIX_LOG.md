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

## BUG-20261006-008
Date: 2026-10-06 | Session: ERP-SESSION-02 | Module: DevOps / Trien khai | Feature: Server UI phuc vu build | Severity: **CRITICAL** | Source: INTERNAL_TEST
Problem: App tren `:9000` **KHONG BAO GIO BOOT XONG** — ket o `.auth-page` «Dang mo VNTECH ERP» > 30 giay. Cong anh hoi quy thi giac
  vì vay **KHONG THE chup dung manh nao** (17 man × 4 kich thuoc = 68 anh chi la MAN NEN boot).
Impact: ⛔ **CHAN TOAN BO CONG KIEM TRA HINH ANH** · ⛔ **KHONG THE nghiem thu TASK-226 bang cong** (cung sai) ·
  ⛔ moi lan build moi lam tinh huong xau hon hon (HTML cu vs asset moi).
Root Cause: **HTML duoc serve no tro toi hash tai nguyen CU** (`index-DrGoA0VD.js` · `page-DdkxN2Fj.js` ·
  `layout-segment-context-CfvhuIcI.js`) trong khi `dist/client/assets/` da bi **build lai luc 17:22** san
  `index-BVZQBH_9.js` · `page-DFsU9Xvb.js` ⇒ **404 ca 3 file** ⇒ `Failed to fetch dynamically imported module` ⇒ app treo.
  Bang chung: console trinh duyet that bat duoc 6 loi 404/1 exception; doi chieu hash HTML vs hash tren dia khong trung nhau.
Fix: ⛔ **CHUA sua** — thuoc ERP-SESSION-01/van hanh may chu (Goal §7/§28). De xuat: server UI phai doc **`dist/` cung thu muc**
  voi HTML (hoac khoi dong lai server sau moi lan build) + them kiem tra khoi dong bang HTTP 200 tung file hash.
Files Changed: ⛔ (chua)
Test: TEST-20261006-013 | Regression: N/A | Verification: bat console trinh duyet that · doi chieu hash HTML vs dist
Status: **OPEN** | Related Task: TASK-20261006-226 | Related Bug: BUG-20261006-005 · BUG-20261006-006

## BUG-20261006-009
Date: 2026-10-06 | Session: ERP-SESSION-02 | Module: Auth / Session | Feature: Dang nhap he thong | Severity: **CRITICAL** | Source: INTERNAL_TEST
Problem: Login qua `/api/system` tra **401** (truoc do 200) → trang ket o man «Dang nhap he thong», khong boot duoc.
  ⇒ khong truy cap duoc menu «Kho vật tư», khong the nghiem thu TASK-226.
Impact: ⛔ CHAN TOAN BO nghiem thu · cong anh hoi quy thi giac cung khong chay duoc (khong co phien).
Root Cause: **CHUA XAC DINH** — nhung co su lien he thoi diem manh me: ERP-SESSION-01 commit `3dd2431` (17:23:51)
  "chore: bo migration 0330 (ghi van tay cua chinh no => **vong lap vo han**); van tay e7195a48 · **718 files** · verify DAT"
  xay ra DUNG TRUOC khi login chuyen 200 → 401. Kiem tra khac: 5 tai nguyen HTML deu 200, `dist/` khong doi tu 17:22:47.
Fix: ⛔ CHUA sua — can ERP-SESSION-01 kiem tra/rollback commit `3dd2431`.
Files Changed: ⛔ (chua)
Test: TEST-20261006-014 | Regression: N/A | Verification: do login that bang CDP, doi chieu thoi diem voi git log
Status: **OPEN** | Related Task: TASK-226 | Related Bug: BUG-20261006-008

## BUG-20261006-010
Date: 2026-10-06 | Session: ERP-SESSION-02 | Module: Menu (Warehouse) | Feature: Hub «Kho vật tư» | Severity: **HIGH** | Source: INTERNAL_TEST
Problem: Bam menu «Kho vật tư» KHONG BAO GIO chuyen sang man hub — van o dashboard. Do that 12 giay van
  `manInventory: false · warehouseCards: false · tabbarHub: 0 · cardsKho: 0`.
  ⭐ Bang chung phu: bundle client `dist/client/assets/page-DFsU9Xvb.js` **CO** chua `warehouse_hub` ⇒ code da build dung.
Impact: ⛔ **CHAN TOAN BO yêu cầu cua user** — hub 3 tab, cards kho, man chi tiet 5 tab DEU chua the nghiem thu.
Root Cause: **NGHI VAN** — `app/page.tsx:506-510`:
  ```js
  const viewable = item.permissionKeys.find((key) => modulePermission(data, key).canView);
  if (permissionConfigured && !viewable) return [];
  return [{ ..., moduleKey: viewable ?? item.permissionKeys[0], ... }];
  ```
  · `permissionConfigured` (dong 463) = `isAdminUser(data.user) || (data.modulePermissions||[]).length > 0` → admin = true.
  · `viewable` = permissionKey DAU TIEN co canView. `warehouseMenuItems[0].moduleKey = "inventory"` nhung
    `permissionKeys = ["central_warehouse","warehouse_receipt","warehouse_issue","inventory","stocktake","material_norms"]`
    → neu `central_warehouse` co canView ⇒ `moduleKey` = "central_warehouse" (SAI, phai la "inventory").
  · Hoac neu khong key nao co canView ⇒ `return []` ⇒ `warehouseMenuChildren = []` ⇒ nut menu khong render.
Fix: ⛔ CHUA sua — can ERP-SESSION-01 kiem tra. De xuat: dung `item.moduleKey` (da khai bao dung) thay vi `viewable`,
  hoac dung `viewable` chi de kiem tra ton tai, KHONG de dinh nghia `moduleKey`.
Files Changed: ⛔ (chua)
Test: TEST-20261006-016 | Regression: N/A | Verification: do that 12 giay + grep bundle + doc ma nguon
Status: **OPEN** | Related Task: TASK-226 | Related Bug: BUG-20261006-006

## BUG-20261006-011
Date: 2026-10-06 | Session: ERP-SESSION-02 | Module: DevOps | Feature: Build & phục vụ | Severity: **HIGH** | Source: INTERNAL_TEST
Problem: Sau `npm run build`, HTML do server `:8787` trả về vẫn trỏ bundle **CŨ** ⇒ 404 tài nguyên ⇒ app **không boot**.
  (`index-CKA0Et7W.js` yêu cầu, trên đĩa chỉ có `index-Dyg1xiQf.js`)
Impact: ⛔ mọi thay đổi vừa build **không thấy được** trên :9000 — dễ tưởng code sai.
Root Cause: `scripts/local-server.mjs` **cache HTML ở RAM**; tiến trình cũ khởi động **09:05:03**,
  `dist/` build **09:34:14** ⇒ server phục vụ bản HTML cũ ⇒ hash asset không tồn tại trên đĩa.
Fix: dừng **đúng PID** (xác minh `CommandLine` = `scripts/local-server.mjs`) rồi khởi động lại ⇒ 200.
  ⛔ KHÔNG dùng `Stop-Process node` (Goal §36 — có thể giết DSH runner/session khác).
Files Changed: ⛔ (không đổi mã nguồn — lỗi vận hành)
Test: TEST-20261006-018 | Regression: N/A | Verification: bundle trên đĩa == HTML server trả ⇒ HTTP 200
Status: **FIXED** (đã xác minh) | Related Bug: BUG-20261006-008 (cùng dấu hiệu 404 bundle)
Notes: ⚠️ Đây là lỗi **tái diễn** ⇒ mọi session sau khi `npm run build` đều phải khởi động lại `:8787`.

## BUG-20261006-012
Date: 2026-10-06 | Session: ERP-SESSION-02 | Module: Danh mục vật tư | Feature: Tab (chế độ tab) | Severity: **HIGH** | Source: INTERNAL_TEST
Problem: **Tab 1 và tab 2 của màn «Danh mục vật tư gốc» KHÔNG BAO GIỜ HIỆN NỘI DUNG** — chỉ thấy khung trắng.
Impact: ⛔ 2/3 tab của màn này vô dụng từ trước tới nay (bug CÓ SẴN, ⛔ không phải do TASK-227).
  ⛔ Đây là lý do thật khiến user nói tab «trồng tréo» — tab 0 thì quá nhiều khối, còn tab 1/2 thì TRẮNG.
Root Cause: **`<details>` thiếu thuộc tính `open`** ⇒ trạng thái `closed` ⇒ nội dung bên trong bị ẩn.
  CSS `canonical.css:557-559` chỉ đặt `display: block` cho **chính thẻ `<details>`**, ⛔ KHÔNG mở được
  nội dung bên trong khi thiếu `open` (Blink ẩn nội dung `<details>` đóng bằng cơ chế nội bộ, `display`
  của phần tử con ⛔ không thắng được).
  **BẰNG CHỨNG ĐO THẬT trên :9000** (`getBoundingClientRect`):
  ```
  TRƯỚC:  tab 0 (CÓ open)  → details h = 947px  ✅ hiện   (tbody 237 dòng)
          tab 1 (THIẾU open)→ details h =   0px  ⛔ TRẮNG
          tab 2 (THIẾU open)→ details h =   0px  ⛔ TRẮNG  (dù tbody có 17 dòng!)
  SAU :   tab 0 → 947px ✅ · tab 1 → 947px ✅ · tab 2 → 947px ✅
  ```
Fix: thêm `open` cho `details[data-tab="1"]` và `details[data-tab="2"]` trong `app/page.tsx`
  (tab 0 đã có sẵn ⇒ đó là bằng chứng cách sửa ĐÚNG). Trong chế độ TAB, `summary` đã bị CSS ẩn
  (`.material-catalog-screen details[data-tab] > summary { display:none }`) nên ⛔ không cần thu gọn được.
Files Changed: `app/page.tsx` (2 dòng — thêm ` open` vào thẻ mở `<details>`)
Test: TEST-20261006-019 | Regression: 802/803 | Verification: đo lại chiều cao 3 tab = 947px + ảnh chụp
Status: **FIXED** | Related Task: TASK-227 | Related Change: CHG-20261006-001
Notes:
  · ⚠️ **BẪY khi kiểm tra**: regex `/\bopen\b/` khớp NHẦM prop `open={open}` truyền cho component con
    (khác hoàn toàn nghĩa với thuộc tính `open` của `<details>`) ⇒ lần sửa đầu **báo sai là "đã có open"**.
    Cách đúng: chỉ xét phần **THẺ MỞ** (`line.slice(0, line.indexOf(">")+1)`).
  · ⚠️ **BẪY 2**: đã thử sửa bằng CSS `details[data-tab] > .module-section-collapse-body { display:block !important }`
    ⇒ ⛔ **KHÔNG hiệu quả** trong Blink. Đã **hoàn nguyên** dòng CSS đó, ⛔ không để lại `!important` thừa (§41).

## BUG-20261006-007 — CẬP NHẬT (07/10/2026): ĐÃ SỬA ĐÍNH CHÍNH
Date: 2026-10-07 | Session: ERP-SESSION-02 | Severity: **MEDIUM** | Status: **FIXED**
Vấn đề (đã nêu 06/10): `docs/agent-progress/MASTER_STATUS.md` (dòng 26 · 367 · 426) và `TASK_INDEX.md` (dòng 160)
  ghi «**68 ảnh chụp lại + đối chiếu 0 px lệch**» — **BÁO XANH GIẢ**.
Bằng chứng (đo 06/10): 68 tệp PNG nhưng chỉ **5 ẢNH DUY NHẤT** (SHA256) và cả 5 là **trang setup lần đầu**
  «Thiết lập hệ thống của công ty»; commit `7fdf71f`… chính xác là **`7fdf71d` (27/09/2026)** thay ảnh chuẩn
  lúc **CSDL chưa khởi tạo** ⇒ cổng so **setup với chính nó**.
FIX (07/10/2026): ghi khối **«🔴 ĐÍNH CHÍNH — CỔNG ẢNH CHUẨN»** bằng **APPEND** (⛔ không ghi đè) vào:
  · `docs/agent-progress/MASTER_STATUS.md` (cuối tệp — nêu rõ sửa dòng 26/367/426)
  · `docs/agent-progress/TASK_INDEX.md` (cuối tệp — nêu rõ sửa dòng 160 / MT3-F14)
  Nội dung: sự thật đã đo · nguyên nhân gốc · **tình trạng mới** (56 ảnh duy nhất · cổng 34/68 lệch = tín hiệu THẬT ·
  3 màn 0 px · 2 màn lệch lớn ĐÃ GIẢI THÍCH) · **bài học** («phải kiểm SỐ ẢNH DUY NHẤT, ⛔ không chỉ đếm số tệp»).
Test: TEST-20261006-015 (đo 56 ảnh duy nhất) · TEST-20261007-023 (chạy cổng: 34/68) | Verification: đọc lại 2 tệp
Status: **FIXED** | Related Bug: BUG-20261006-005 (FIXED) · BUG-20261006-006 (OPEN)
## ⭐⭐⭐ TASK-229 — 2 QUYẾT ĐỊNH CỦA USER + CHỤP LẠI ẢNH CHUẨN ⭐⭐⭐

> ⭐ **ĐỔI CÁCH GHI LOG (07/10/2026)** — user chỉ thị: «**không đếm task theo master task và master task 2 nữa,
> bây giờ là giai đoạn golive, hãy bám sát theo goal và xem cách thức mà session 1 ghi log rồi làm theo**».
> ⇒ Từ mốc này SESSION_B ghi log **theo khuôn `SESSION_A`** (bảng `| ⭐ | ⭐ |` · dày bằng chứng · dẫn **§ của GOAL** ·
> có mục **«SAI LẦM ĐÃ SỬA»** + **«BÀI HỌC»**), ⛔ **KHÔNG** đếm theo `MASTER TASK 1/2/3` và ⛔ **KHÔNG** ghi `TASK_INDEX.md`.

| ⭐ | ⭐ |
|---|---|
| **SESSION** | ⭐ `ERP-SESSION-02` |
| **YÊU CẦU** *(nguyên văn, 07/10)* | ⭐⭐ «**1. cho phép chụp lại ảnh. 2. c 3. b**» ⭐⭐ — trả lời 3 câu em hỏi: ① **cho phép** chụp lại ảnh chuẩn · ② chọn **(c) BỎ HẲN** 2 công cụ BOQ/soát-trùng-alias · ③ chọn **(b) THU** 2 khối «giải thích» vào **nút «?»** |
| **PHẠM VI** | ⭐ `app/page.tsx` (**thuộc SESSION-02** sau khi S01 đã release — xem `SESSION_REGISTRY.md:417`) · ⭐ `app/screens/WarehouseDashboard.tsx` · ⭐ `tools/baseline/*.png` |
| **② BỎ HẲN 2 CÔNG CỤ** | ⭐ Xoá hàm `MaterialMatchingWorkspace` ⭐⭐ **28 dòng** ⭐ — ⭐ **TRƯỚC KHI XOÁ đã tự kiểm «mồ côi»**: quét cả tệp, bỏ qua dòng chú thích ⇒ ⛔ không còn chỗ dùng thật ✓ |
| | ⭐ **BẰNG CHỨNG ĐO TRÊN UI THẬT** (`:9000`, login `200`): ⭐ `conSoSanhBOQ` = **false** ⭐ `conSoatTrungAlias` = **false** ⭐ `conCongCuChanLoan` = **false** ✓ ⭐ tabbar vẫn đủ **3 tab** ✓ |
| **③ THU VÀO NÚT «?»** | ⭐ Thêm `import { useState }` + state `showHelp` + nút ⭐ **«Giải thích chỉ số →» / «Ẩn giải thích chỉ số →»** ⭐ cạnh tiêu đề **DASHBOARD TỒN KHO**; bọc 2 khối bằng `{showHelp && (<>…</>)}` ✓ |
| | ⭐ **BẰNG CHỨNG ĐO TRÊN UI THẬT — TOGGLE 3 TRẠNG THÁI** ✓<br>· **TRƯỚC** : nút «Giải thích chỉ số →» · `khoiGiaTriKho`=**false** · `khoiNguonDuLieu`=**false** · trang **4.052px** ✓<br>· **SAU bấm** : nút «Ẩn giải thích chỉ số →» · `khoiGiaTriKho`=**true** · `khoiNguonDuLieu`=**true** · trang **4.949px** ✓<br>· **BẤM LẠI** : về **4.052px** ✓ ⇒ ⭐ **toggle hoạt động đúng cả 2 chiều** ✓ |
| | ⭐ **KẾT QUẢ TỔNG**: tab «KHO» ⭐⭐ **6.202px → 4.052px** ⭐⭐ (⭐ giảm **2.150px ≈ 35 %** ⭐ so với TASK-228) ✓ |
| **① CHỤP LẠI ẢNH CHUẨN** | ⭐ `node tools/probe-visual-regression.mjs --update` ⭐ (⛔ **KHÔNG** tự chạy trước đây vì chưa được phép — chỉ chạy **sau khi user cho phép** ✓) |
| | ⭐ **KẾT QUẢ**: **68 ảnh** ⭐⭐ **60 ẢNH DUY NHẤT** ⭐⭐ (⭐ trước: **5** ⚠️) ⇒ ⭐ **cổng có giá trị phân biệt** ✓ |
| ⭐⭐ **🚨 PHÁT HIỆN TRONG LÚC CHỤP — `BUG-006` LỘ RA Ở CHÍNH ẢNH MỚI** | ⭐⭐⭐ **3 màn CHỤP SAI MÀN** ⭐⭐⭐ vì `nav` **thất bại** mà cổng **VẪN GHI ảnh** ⚠️<br>· ⭐ `11-modal-request` — ⭐⭐ **hash GIỐNG HỆT `08-requests`** ⭐⭐ = `497158D6415958FA` ⇒ ⭐ **chụp MÀN GỐC, ⛔ không phải modal** ✓<br>· ⭐ `16-modal-receipt` — ⭐ `nav=NO_CLICK_TARGET` (4/4 viewport) ✓<br>· ⭐ `19-report-center` — ⭐ `nav=NO_GROUP()` (desktop + laptop) ✓<br>⭐⭐ ⇒ **ảnh chuẩn 3 màn này VẪN là BÁO XANH GIẢ** ⚠️ — cổng sẽ **mãi báo «0 px»** dù màn sai ⭐⭐ |
| **⛔ PHÂN VAI (RỦI RO XUNG ĐỘT)** | ⭐ ⭐ **`tools/probe-visual-regression.mjs` thuộc `ERP-SESSION-01`** ⚠️ (⭐ họ vừa sửa lúc **07/10 08:52** — ⭐ thêm `--dump-nav` + sửa `child:N` ⭐ **76 dòng chưa commit** ✓) ⇒ ⭐⭐ **SESSION-02 ⛔ KHÔNG TỰ SỬA** (§7) ⭐⭐ ⇒ ⭐ **ĐÃ HỎI USER**: em sửa hay để S01? ⏳ chờ trả lời ✓ |
| **⭐ SAI LẦM ĐÃ SỬA (§22)** | ⭐ **① Truyền `action={<button…/>}` cho `CardHead`** ⇒ ⭐⭐ `tsc` **LỖI `TS2322`** ⭐⭐ vì ⭐ `CardHead.action` khai báo **`action?: string`** ⭐ (`lib/ui-shared.tsx:230`) ⭐ ⛔ **không phải ReactNode** ⚠️ ⇒ ✅ sửa đúng khuôn: `action={showHelp ? "Ẩn…" : "Giải thích chỉ số"}` + `onClick={…}` ✓ |
| | ⭐ **② Script sinh dòng đóng `}</>)}`** (⭐ **thừa 1 dấu `}`**) ⇒ ⭐ `tsc` **LỖI `TS1381`** ⚠️ ⇒ ✅ sửa còn `</>)}` ✓ ⭐ *(⭐ lần sửa đầu em `Replace("}}</>)}", …)` ⭐ **KHÔNG khớp** vì văn bản thật chỉ có **MỘT** `}` ⚠️ — ⭐ đã **đọc lại tệp** để lấy chuỗi đúng thay vì đoán ✓)* |
| | ⭐ **③ `useState` chưa được import** trong `WarehouseDashboard.tsx` ⚠️ ⇒ ✅ thêm `import { useState } from "react";` **sau dòng `import` cuối** để giữ thứ tự ✓ |
| **⭐⭐ BÀI HỌC (§33) — «đổi cách ghi log»** | ⭐ ⭐⭐ **ĐẾM THEO MASTER TASK LÀ SAI Ở GIAI ĐOẠN GO-LIVE** ⭐ ⭐⭐ — ⭐ user chỉ thị rõ ⚠️ ⇒ ⭐⭐ bám **§ của GOAL** + **khuôn `SESSION_A`** ⭐ ⭐⭐ ⛔ **KHÔNG** báo `DONE/110` nữa ✓ |
| | ⭐ ⭐⭐ **MỘT CỔNG GHI ẢNH CHUẨN PHẢI ⛔ TỪ CHỐI GHI KHI `nav` THẤT BẠI** ⭐ ⭐⭐ — ⭐ nếu không ⭐ nó **biến lỗi điều hướng thành «ảnh chuẩn»** ⚠️ ⭐ ⇒ ⭐⭐ **báo xanh giả VĨNH VIỄN** ⭐ ⭐⭐ (⭐ đúng loại lỗi của `BUG-20261006-007` ⚠️) ✓ |
| | ⭐ ⭐ **Kiểm «ảnh chuẩn có giá trị» = đếm ẢNH DUY NHẤT (SHA256), ⛔ KHÔNG đếm SỐ TỆP** ⭐ ⭐ — ⭐ 68 tệp mà chỉ **5 ảnh** ⚠️ · ⭐ 68 tệp mà **60 ảnh** ✓ ⭐ ⭐ (⭐ hoặc 68 tệp mà `11` **trùng byte** `08` ⚠️) ✓ |
| | ⭐ ⭐ **`taskkill /F /PID` THAY ĐƯỢC `Stop-Process`** ⭐ ⭐ — ⭐ `Stop-Process` trong pwsh của DSH ⭐⭐ **làm CHẾT job runner** ⭐⭐ (⭐ exit `4294967295` ⭐ **gặp 2 lần** ⚠️) ⭐ còn `taskkill` (⭐ **tiến trình ngoài** ✓) **an toàn** ✓ ⭐ ⛔ vẫn phải **xác minh `CommandLine`** trước khi kill (§36) ✓ |
| ⭐ **KIỂM THỬ (§24 · §25)** | ⭐ `npx tsc --noEmit` ⭐⭐ **EXIT=0** ✓ ⭐ `npm run test:regression` ⭐⭐ **803 test · 802 pass · 0 fail · 1 skip** ✓ |
| ⭐ **QUY TRÌNH TRIỂN KHAI** | ⭐ `fixpoint-fingerprint` → ⭐⭐ `VNTECH-FP-C55438BF8585733C` ✓ → ⭐ `set-local-identity` **KHỚP** ✓ → ⭐ `npm run build` ⭐⭐ **EXIT=0** ✓ + ⭐ **BUILT ARTIFACT VALIDATION ĐẠT** ✓ → ⭐ `taskkill` PID `16648` (⭐ **đã xác minh cmdline `scripts/local-server.mjs`** ✓) → ⭐ restart PID `15716` → ⭐ `:8787` **listen** ✓ → ⭐ bundle ⭐ **khớp** `index-CwSaGWwu.js` ✓ |
| **STATUS** | ⭐⭐⭐ **FIXED** ⭐⭐⭐ *(⭐ = **CODE + TEST PASS** theo §24 ✓ — ⚠️ **TRỪ** 3 màn ảnh chuẩn ⛔ **CHƯA đạt** vì `BUG-006` ⚠️)* |
| ⭐ **TRUY VẾT** | ⭐ `CHG-20261007-003` · `DEV-20261007-006` · `TEST-20261007-026` · `EVT-20261007-031` |

---

## ⭐⭐ BUG-20261007-013 — NÚT «＋ TẠO PHIẾU CẤP PHÁT» LÀ **NÚT CHẾT** (bấm ⛔ không có gì xảy ra) ⭐⭐

| ⭐ | ⭐ |
|---|---|
| **SESSION** | ⭐ `ERP-SESSION-02` *(⭐ tệp `app/screens/Inventory.tsx` **thuộc phiên 02** ✓)* |
| **SEVERITY** | ⭐⭐ **HIGH** ⚠️ (⭐ **chặn người dùng tạo phiếu cấp phát** + ⭐ **im lặng** ⇒ user tưởng hệ thống treo ✓) |
| **SOURCE** | ⭐ `ERP-SESSION-01` phát hiện (`BUG-20261007-003`) ⭐ ⭐ **SESSION-02 KIỂM CHỨNG LẠI ĐỘC LẬP** theo §16 (⛔ không tin state cũ) ✓ |
| **PHẠM VI KIỂM** | ⭐ `app/screens/Inventory.tsx:389` ⭐ `app/page.tsx` (⭐ **đếm đủ 40 modal** ✓) ⭐ `app/screens/AllocateReturn.tsx:1-10` ✓ |
| **BẰNG CHỨNG MÃ** | ⭐ `Inventory.tsx:389` → ⭐⭐ `onClick={()=>open("allocate")}` ⭐⭐<br>⭐ `page.tsx` **đủ 40 modal**: `access · accountSettings · approvalStageMaster · boqItem · boqVersion · businessGroupMaster · categoryMaster · centralReceive · centralReturn · count · detail · email · errorReport · forcePassword · hrProfileEdit · install · issue · materialMaster · materialMerge · materialSubcategoryMaster · menuGroupMaster · moduleMaster · notificationConfig · po · poDetail · projectContract · projectMaster · receipt · receiptDetail · request · return · roleMaster · systemLevelMaster · teamCreate · transfer · user · userEdit · userProfile · userProfileHr · workflowMaster` ⭐⭐⭐ ⛔ **KHÔNG CÓ `allocate`** ⭐⭐⭐ ✓<br>⭐ grep `allocate` toàn `app/page.tsx`: ⭐ **chỉ** ra `import { AllocateReturn }` · `allocateReturnMenuItems` · `useState allocateReturnView` — ⭐⭐ **toàn bộ là MÀN (screen), ⛔ KHÔNG phải modal** ⭐⭐ ✓ |
| ⭐⭐ **BẰNG CHỨNG ĐO TRÊN UI THẬT** (`:9000`) | ⭐ login `200` · boot OK ⇒ hub Kho → tab **«CẤP PHÁT & HOÀN TRẢ»** (⭐ subtab đo được: `["Cấp phát","Hoàn trả"]` ✓)<br>⭐ **① «＋ Tạo phiếu cấp phát»**: `có nút = true` · `TRƯỚC bấm {overlay:0, modal:0, dialog:0}` · `bấm = DA_BAM` (⭐ **KHÔNG disabled** ✓) · ⭐⭐ `SAU bấm {overlay:0, modal:0, dialog:0}` ⭐⭐ ⇒ ⛔ **KHÔNG MỞ GÌ CẢ** ✓<br>⭐ **② «＋ Tạo phiếu hoàn trả»**: `bấm = DA_BAM` ⇒ ⭐⭐ `SAU bấm {overlay:1, modal:1}` ⭐⭐ + modal **«Hoàn trả vật tư dư — Không cho hoàn vượt tồn đội; hàng hỏng không cộng lại tồn sử dụng…»** ⇒ ✅ **CHẠY ĐƯỢC** ✓ |
| **ROOT CAUSE — ĐÃ CHỨNG MINH** | ⭐⭐⭐ `open("allocate")` ⇒ `setModal("allocate")` ⭐ ⇒ ⭐⭐ **không có nhánh `modal === "allocate"` nào** ⇒ **render RỖNG** ⭐⭐ ⇒ ⭐⭐ nút bấm **thành công về mặt kỹ thuật** nhưng ⛔ **không có tác dụng gì** ⚠️ ⭐⭐⭐ ⭐ *(⭐ đối chứng DƯƠNG: `open("return")` ⇒ **CÓ** modal ⇒ mở thật ✓ ⇒ ⭐ chứng minh cơ chế `open()` **hoạt động tốt**, ⛔ không phải lỗi `open`)* ✓ |
| ⭐ **ĐÃ LOẠI TRỪ** | ⭐ ① ⛔ **không phải nút bị khoá** — đo `disabled = false` ✓ ⭐ ② ⛔ **không phải `onClick` không chạy** — ⭐ nút **anh em cùng chỗ** `open("return")` **mở được modal** ✓ ⭐ ③ ⛔ **không phải thiếu quyền** — `admin` ✓ ⭐ ④ ⛔ **không phải sai tab/subtab** — đo được đang ở subtab «Cấp phát» ✓ ⭐ ⑤ ⛔ **không phải tên modal viết khác kiểu** — grep bỏ khoảng trắng vẫn ⛔ **0 kết quả** ✓ |
| ⛔ **VÌ SAO ⛔ CHƯA TỰ SỬA** | ⭐⭐ `app/screens/AllocateReturn.tsx:5-6` **NGUYÊN VĂN TRONG MÃ**: ⭐ «⚠️ Logic nghiệp vụ + workflow + quyền sẽ triển khai **SAU khi business rule được xác định** ⇒ hiện tại **CHỈ triển khai cấu trúc UI/list/tab/data foundation**. ⛔ **Không tự suy diễn nghiệp vụ** (§14)» ⭐⭐ ⇒ ⭐ ⛔ **tự tạo modal cấp phát = BỊA NGHIỆP VỤ** ⇒ ⭐ ⭐ **PHẢI CÓ QUY TẮC TỪ USER** ⚠️ ✓ |
| ⭐ **ĐỀ XUẤT (chờ user quyết)** | ⭐ **(a)** trỏ nút sang **màn đã có** «Cấp phát cho tổ đội» (⭐ `teams` group) ⭐ **(b)** làm **modal tạo phiếu cấp phát mới** — ⭐ **cần user cho quy tắc nghiệp vụ** ⭐ **(c)** ⭐⭐ **TẠM KHOÁ nút + ghi rõ «chờ quy tắc nghiệp vụ»** ⭐⭐ (⭐ ⛔ không để bấm mà **im lặng** ⚠️) ⭐ **(d)** giữ nguyên ✓ |
| **ẢNH HƯỞNG** | ⭐ Hub «Kho vật tư» → tab «CẤP PHÁT & HOÀN TRẢ» → subtab «Cấp phát» ⭐ ⚠️ (⭐ ⛔ **không** ảnh hưởng subtab «Hoàn trả» — nút đó chạy đúng ✓) |
| **STATUS** | ⭐⭐ **OPEN** ⚠️ — ⭐ **ĐÃ CHỨNG MINH ROOT CAUSE** ✓ · ⛔ **CHƯA SỬA** (⭐ chờ user cho quy tắc nghiệp vụ ✓) |
| **RELATED** | ⭐ `BUG-20261007-003` (S01 ghi) · `TASK-228` (⭐ em sửa `Inventory.tsx` nhưng ⛔ **không đụng 2 nút này** ✓) |

---

## ⭐⭐⭐ BUG-20261007-014 — **LỚP LỖI**: 3 NÚT CRUD KHO ⛔ KHÔNG LÀM GÌ (quét hệ thống mới thấy) ⭐⭐⭐

| ⭐ | ⭐ |
|---|---|
| **SESSION** | ⭐ `ERP-SESSION-02` *(⭐ `app/screens/Inventory.tsx` **thuộc phiên 02** ✓)* |
| **SEVERITY** | ⭐⭐⭐ **HIGH** ⚠️ (⭐ **CRUD kho ⛔ không dùng được** + ⭐ **im lặng** ⇒ user tưởng hệ thống treo ✓) |
| **SOURCE** | ⭐ **ERP-SESSION-02 tự quét hệ thống** ⭐ — ⭐ nảy ra từ `BUG-20261007-013`: ⭐ **đối chiếu MỌI `open("X")` với 40 modal thật** ✓ |
| ⭐ **PHƯƠNG PHÁP QUÉT (⭐ tái dùng được)** | ⭐ `①` trích **40 tên modal** từ `modal === "…"` trong `app/page.tsx` ⭐ `②` quét MỌI `open("…")` trong **`app/**`** ⭐ `③` **đối chiếu 2 tập** ⭐ ⭐ ⇒ ⭐ **tự động phát hiện nút gọi modal không tồn tại** ✓ |
| **KẾT QUẢ QUÉT** | ⭐ **39 tên** được truyền vào `open("…")` ⭐ ⇒ ⭐ **37 tên CÓ modal** ✅ ⭐ ⭐ **2 tên ⛔ KHÔNG CÓ modal**: ⭐⭐ `"allocate"` (1 chỗ) ⭐ + ⭐⭐ `"warehouse"` (**2 chỗ**) ⭐⭐ ✓ |
| **BẰNG CHỨNG MÃ** | ⭐ `Inventory.tsx:326` → `onClick={()=>open("warehouse")}` ⭐ «＋ Tạo kho» ✓<br>⭐ `Inventory.tsx:327` → `if(w)open("warehouse",w)` ⭐ «✎ Sửa» ✓<br>⭐ `Inventory.tsx:389` → `open("allocate")` ⭐ «＋ Tạo phiếu cấp phát» ✓<br>⭐⭐ `page.tsx` **40 modal** — ⛔ **KHÔNG có `warehouse`** · ⛔ **KHÔNG có `allocate`** ⭐⭐ ✓<br>⭐ grep hàm `*Warehouse*` trong `page.tsx`: ⭐ chỉ ra **MÀN** (`WarehouseApp` · `WarehouseReceipt` · `CentralWarehouse` · `WarehouseIssueTeams`) ⛔ **không có modal nào** ✓ |
| ⭐⭐ **BẰNG CHỨNG ĐO TRÊN UI THẬT** — **ĐO ĐỦ** | ⭐⭐ **ĐO 4 CHỈ SỐ** (⭐ không chỉ `modal` ⚠️): ⭐ `h1` · ⭐ `dai` (độ dài nội dung màn) · ⭐ `modal` · ⭐ `manChiTiet` ✓<br>⭐ **① «＋ Tạo kho»** : `dai` **107.793 → 107.793** ⛔ **KHÔNG ĐỔI** · `hub` vẫn `true` · `modal 0` ⇒ ❌ **NÚT CHẾT** ✓<br>⭐ **② «✎ Sửa»** (⭐ đã chọn card trước ✓) : `dai` **107.793 → 107.793** ⇒ ❌ **NÚT CHẾT** ✓<br>⭐ **③ ✅ ĐỐI CHỨNG DƯƠNG — «◉ Xem chi tiết kho đang chọn»** : ⭐⭐ `dai 107.793 → 898` · `hub true → false` · `manChiTiet false → true` ⭐⭐ ⇒ ✅ **ĐỔI MÀN THẬT** ⇒ ⭐⭐⭐ **CHỨNG MINH PHÉP ĐO PHÁT HIỆN ĐƯỢC THAY ĐỔI** ⭐⭐⭐ ✓ |
| **ROOT CAUSE — ĐÃ CHỨNG MINH** | ⭐⭐⭐ `open("warehouse")` / `open("allocate")` ⇒ `setModal("warehouse"/"allocate")` ⭐ ⇒ ⛔ **không có nhánh `modal === …` nào** ⇒ **render RỖNG** ⭐⭐⭐ ⭐ *(⭐ cùng một nguyên nhân với `BUG-20261007-013` ⇒ ⭐⭐ **ĐÂY LÀ MỘT LỚP LỖI, ⛔ không phải lỗi lẻ** ⭐⭐)* ✓ |
| **ĐÃ LOẠI TRỪ** | ⭐ ① ⛔ **không phải nút bị khoá** — đo `disabled = false` ✓ ⭐ ② ⛔ **không phải `onClick` không chạy** — ⭐ **đối chứng dương cùng màn ĐỔI MÀN được** ✓ ⭐ ③ ⛔ **không phải thiếu quyền** — `admin` ✓ ⭐ ④ ⛔ **không phải màn không re-render** — ⭐ `dai` **đo được thay đổi** ở đối chứng ✓ |
| ⭐⭐ **SAI LẦM ĐÃ SỬA (§22) — LẦN 3 TRONG PHIÊN** | ⭐⭐ Bản đo đầu chỉ đếm **`modal`** ⚠️ ⇒ ⭐ nút **«◉ Xem chi tiết kho đang chọn»** (⭐ **biết chắc CHẠY ĐƯỢC** — ⭐ mở **MÀN** chi tiết, ⛔ không phải modal) ⭐⭐ **cũng ra «modal=0»** ⭐⭐ ⇒ ⭐⭐⭐ **TIÊU CHÍ ĐO THIẾU ⇒ suýt kết luận SAI rằng nút đó cũng chết** ⚠️ ⭐⭐⭐ ⭐ ✅ **SỬA: đo THÊM `h1` + `dai` + `manChiTiet`** ⇒ ⭐ mới phân biệt được «mở modal» / «đổi màn» / «không gì» ✓ |
| **VÌ SAO ⛔ CHƯA TỰ SỬA** | ⭐ ⛔ **KHÔNG có `WarehouseModal` nào trong mã** ⭐ và ⭐ ⛔ **KHÔNG có action `save_warehouse`** trong `scripts/system-route.mjs` ⭐ (⭐ chỉ có `save_warehouse_location` — ⭐ là **vị trí trong kho**, ⛔ khác việc) ⇒ ⭐⭐ **làm nút chạy được = PHẢI VIẾT MỚI cả modal + API** ⭐⭐ ⇒ ⭐ **cần user quyết** ⚠️ (⭐ §14: ⛔ không tự suy diễn nghiệp vụ ✓) |
| **ẢNH HƯỞNG** | ⭐ Hub «Kho vật tư» → tab «KHO»: ⭐⭐ **toàn bộ CRUD kho ⛔ không dùng được** ⭐⭐ (⭐ Tạo · Sửa ⭐) ⚠️ · ⭐ tab «CẤP PHÁT & HOÀN TRẢ» → «Tạo phiếu cấp phát» ⚠️<br>⭐ ✅ **KHÔNG ảnh hưởng**: 12 cards kho (⭐ chọn được ✓) · nút «Xem chi tiết» ✓ · «Xuất Excel» ✓ · tab «XUẤT & NHẬP» ✓ · «Tạo phiếu hoàn trả» ✓ |
| **STATUS** | ⭐⭐ **OPEN** ⚠️ — ⭐ **ĐÃ CHỨNG MINH ROOT CAUSE + ĐÃ ĐO** ✓ · ⛔ **CHƯA SỬA** (⭐ chờ user ✓) |
| **RELATED** | ⭐ `BUG-20261007-013` (⭐ cùng lớp) · `TASK-228` ✓ |

---

## ⭐⭐⭐ BUG-20261007-015 — NÚT «🗑 XÓA KHO» GỌI ACTION **KHÔNG TỒN TẠI** + ⭐⭐ SAI LẦM ĐO LỚN (§22) ⭐⭐

| ⭐ | ⭐ |
|---|---|
| **SESSION** | ⭐ `ERP-SESSION-02` · ⭐ tệp `app/screens/Inventory.tsx` **thuộc phiên 02** ✓ |
| **SEVERITY** | ⭐⭐ **HIGH** ⚠️ (⭐ «Xóa kho» ⛔ không hoạt động + ⭐ **im lặng/lỗi khó hiểu** ✓) |
| **BẰNG CHỨNG MÃ** | ⭐ `Inventory.tsx:328` → `action("delete_warehouse", { warehouseId: w.id })` ✓<br>⭐⭐ `delete_warehouse` **0 lần** trong **TOÀN BỘ** `scripts/system-route.mjs` ⛔ ⭐ **VÀ** ⭐ **0 lần** trong **`ActionRbacRegistry.java` + `SystemController.java`** ⛔ ⭐⭐ ⇒ ⭐⭐ **KHÔNG tồn tại ở CẢ 2 backend** ⭐⭐ ✓ |
| **ROOT CAUSE** | ⭐⭐⭐ `action("delete_warehouse")` ⇒ backend ⛔ **không có nhánh xử lý** ⇒ ⭐ **không xóa được** ⚠️ ⭐⭐⭐ ⭐ *(⭐ **CÙNG HỌ** với `BUG-013`/`014`: ⭐ UI gọi tên ⛔ **không tồn tại** ở backend/modal* ✓) |
| ⭐⭐⭐ **SAI LẦM ĐÃ SỬA (§22) — SAI **NGUỒN SỰ THẬT**, ⭐⭐ suýt báo **16 BUG GIẢ** ⭐⭐** | ⭐ Bản quét 1 đối chiếu `action("…")` với **`scripts/system-route.mjs`** ⇒ ⭐ ⚠️ ra **16 tên thiếu** ⭐⚠️<br>⭐⭐ **NHƯNG `system-route.mjs:3074` GHI NGUYÊN VĂN**: ⭐⭐⭐ «⚠️ **ROUTE NÀY KHÔNG ĐƯỢC APP ĐANG CHẠY GỌI: API thật là Java `:18081`**» ⭐⭐⭐<br>⭐⭐ VÀ `tools/cutover-proxy.mjs:6`: «Người dùng → Node SSR (:8787) ──**proxy `/api/`\*──> Java API (:18081)**» ⭐ `:39` ⇒ `API_PREFIXES = ["/api/system", …]` ⭐⭐ ⇒ ⭐⭐⭐ **DANH SÁCH ACTION THẬT NẰM Ở JAVA** ⭐⭐⭐<br>⭐⭐ ⇒ **ĐỔI NGUỒN sang `ActionRbacRegistry.java` + `SystemController.java`** ⇒ ⭐⭐⭐ **16 → 1** ⭐⭐⭐ ⭐ ⇒ ⭐⭐ **15 tên kia là DƯƠNG TÍNH GIẢ** ⚠️ ⭐⭐ ✓ |
| ⭐⭐ **ĐỐI CHỨNG 2 CHIỀU (⭐ để ⛔ không lặp §22)** | ⭐⭐ **CHIỀU ÂM** — 3 tên **đã biết là CHẾT** (⭐ đo thật ở `BUG-013`/`014`) ⭐ phải ra «KHÔNG CÓ»: ⭐ `delete_warehouse` = **KHÔNG** ✅ · `save_warehouse` = **KHÔNG** ✅ · `allocate` = **KHÔNG** ✅ ✓<br>⭐⭐ **CHIỀU DƯƠNG** — 3 tên **đã biết là SỐNG** ⭐ phải ra «CÓ»: ⭐ `login` = **CÓ** ✅ · `save_material` = **CÓ** ✅ · `check_material_alias_conflicts` = **CÓ** ✅ ✓<br>⭐⭐⭐ ⇒ ⭐⭐⭐ **PHÉP ĐO ĐÚNG CẢ 2 CHIỀU** ⭐⭐⭐ ⇒ ⭐ **kết quả 1 tên tin được** ✓ |
| **KẾT QUẢ QUÉT CHÍNH THỨC** | ⭐ **133 action** UI gọi ⭐ ⇒ ⭐⭐ **132 CÓ trong Java** ✅ ⭐ ⭐ **1 ⛔ KHÔNG CÓ**: `delete_warehouse` ⭐ ⭐ (⭐ Java có **268 action** ✓) ✓ |
| ⭐ **BÀI HỌC (§33)** | ⭐ ⭐⭐ **PHẢI XÁC ĐỊNH «NGUỒN SỰ THẬT» TRƯỚC KHI QUÉT** ⭐ ⭐⭐ — ⭐ em quét `scripts/system-route.mjs` ⚠️ ⭐ mà **chính tệp đó tự ghi «⛔ KHÔNG ĐƯỢC APP GỌI»** ⭐ ⭐⭐ ⇒ ⭐⭐ **16 «bug» mà thật ra chỉ 1** ⭐⭐ ⭐ ⭐ **⇒ ⛔ đừng tin «tệp có vẻ liên quan» — phải đọc nó nói gì về chính nó** ✓ |
| | ⭐ ⭐ **MỌI PHÉP QUÉT PHẢI CÓ ĐỐI CHỨNG CẢ 2 CHIỀU** ⭐ ⭐ — ⭐ **chiều âm** (⭐ biết chắc SAI ⭐ phải ra SAI) ⭐ + ⭐ **chiều dương** (⭐ biết chắc ĐÚNG ⭐ phải ra ĐÚNG) ✓ ⭐ ⭐ (⭐ trong phiên này em **sai 4 lần** vì thiếu đối chứng: menu «2/2» giả · `innerText` rỗng · `modal` thiếu ⭐ · **quét nhầm backend** ⚠️) ✓ |
| **ẢNH HƯỞNG** | ⭐ Hub «Kho vật tư» → tab «KHO» → «🗑 Xóa» ⭐ ⚠️ · ⭐ ✅ **KHÔNG ảnh hưởng** phần còn lại (⭐ 132/133 action khác đều có backend ✓) |
| **STATUS** | ⭐⭐ **OPEN** ⚠️ — ⭐ **ĐÃ CHỨNG MINH ROOT CAUSE** ✓ · ⛔ **CHƯA SỬA** (⭐ cần user quyết: ⭐ viết API `delete_warehouse` ⭐ hoặc ⭐ khoá nút ✓) |
| **RELATED** | ⭐ `BUG-20261007-013` · `BUG-20261007-014` (⭐ cùng họ: UI gọi tên ⛔ không tồn tại ✓) |

---

## ⭐ BUG-20261007-016 — GHI CHÚ TRONG MÃ LỖI THỜI (`AdminUserModalTabs.tsx`) — **DOCUMENTATION** ⭐
| ⭐ | ⭐ |
|---|---|
| **SESSION** | ⭐ `ERP-SESSION-02` ⛔ **CHƯA XÁC MINH PHÂN VAI** ⚠️ (⭐ ⛔ **KHÔNG sửa** — ⭐ §7 ✓) |
| **SEVERITY** | ⭐ **LOW / UI** (⭐ ⛔ **không ảnh hưởng chạy** — ⭐ chỉ **gây hiểu nhầm cho người đọc mã** ⚠️ ✓) |
| **VỊ TRÍ** | ⭐ `app/screens/AdminUserModalTabs.tsx:39-41` ⭐ (⭐ ghi chú «MỐC 115» ✓) |
| **GHI CHÚ NÓI** | ⭐ «…chỉ nhận rule chung `[role="tablist"]` (`flex: 0 0 auto`) ⇒ ⭐⭐ **2 thẻ co theo độ dài chữ, lệch nhau rõ** ⭐⭐» ⚠️ |
| ⭐ **THỰC TẾ ĐO ĐƯỢC** | ⭐⭐⭐ `getComputedStyle(button).flex = ` **`1 1 0px`** ⭐⭐ 2 tab **`609px` / `609px`** ⇒ ⭐⭐ **LỆCH 0px — ĐÃ CHIA ĐỀU** ⭐⭐ ✅ |
| **ROOT CAUSE** | ⭐ Đã có rule **sau** ghi đè thành `flex:1 1 0` ⚠️ ⭐ nhưng ⭐⛔ **ghi chú ⛔ không được cập nhật** ✓ |
| **ĐỀ XUẤT** | ⭐ Cập nhật ghi chú cho khớp mã hiện tại ⭐ ⛔ **KHÔNG phải việc của phiên 02 nếu tệp ⛔ không thuộc phiên 02** ⇒ ⭐ **chờ xác nhận phân vai** ⏳ |
| **STATUS** | ⭐⭐ **OPEN** ⭐⭐ — ⭐ **ĐÃ ĐO + ĐÃ CHỨNG MINH** ✅ · ⛔ **CHƯA SỬA** (⭐ chờ xác nhận chủ sở hữu tệp ✓) |
| **RELATED** | ⭐ `TEST-20261007-029` · `EVT-20261007-040` ✓ |

---

## ⭐⭐⭐ BUG-20261007-017 — `<Inventory>` ⛔ **KHÔNG NHẬN PROP `action`** ⇒ nút «Lưu phân công» DISABLED VĨNH VIỄN ⭐⭐⭐
| ⭐ | ⭐ |
|---|---|
| **SESSION** | ⭐ `ERP-SESSION-02` · **MODULE** Kho vật tư · ⭐ **SEVERITY HIGH** ⚠️ (⭐ chặn chức năng admin ⭐ **thêm nhân sự vào kho** ✓) |
| ⭐⭐ **PHÁT HIỆN KHI NÀO** | ⭐ Khi **đo THẬT** `TASK-230` ⑥b trên `:9000` ⇒ ⭐ `nút Lưu disabled? **true**` ⚠️ ⇒ ⭐ truy nguyên ⇒ ⭐⭐ **không phải lỗi modal, mà là THIẾU PROP Ở NƠI GỌI** ⭐⭐ ✓ |
| ⭐⭐⭐ **BẰNG CHỨNG MÃ (⭐ dòng cụ thể)** | ⭐ `app/page.tsx:741`: ⭐⭐ `<Inventory data={data} project={project} open={open} view={warehouseView} />` ⭐⭐ ⇒ ⛔ **KHÔNG có `action={action}`** ⚠️<br>⭐ trong khi ⭐ `app/screens/Inventory.tsx:57` khai: ⭐ `function Inventory({ data, project, open, action, view = null }: { …; action?: (name: string, payload: Row) => Promise<boolean>; … })` ⭐ ⇒ ⭐ **`action` LUÔN `undefined`** ⚠️<br>⭐ **ĐỐI CHỨNG**: ⭐ cùng dòng đó ⭐ `<CentralWarehouse … **action={action}** … />` ⭐⭐ **CÓ truyền** ⭐⭐ ⇒ ⭐ chứng minh `action` **có sẵn** ở `page.tsx`, ⭐ chỉ **thiếu ở `<Inventory>`** ✅ |
| ⭐⭐ **ẢNH HƯỞNG (⭐ 2 chỗ)** | ⭐ ① ⭐ Nút «**Lưu phân công**» (`data-vntech="wd-staff-save"`, `disabled={!staffPickId||!action}`) ⇒ ⭐⭐ **⛔ không bao giờ bấm được** ⭐⭐ ✓<br>⭐ ② ⛔ **LỖI TIỀM ẨN CÓ SẴN**: ⭐ nút «🗑 Xóa kho» dùng `if(w && **action** && window.confirm(…))` ⇒ ⭐ **`action` undefined ⇒ ⛔ điều kiện LUÔN false** ⇒ ⭐ kể cả khi backend có action thì nút **vẫn ⛔ không làm gì** ⚠️ ⭐ ⭐ (⭐ thêm một lý do nút Xóa chết ✓) |
| ⭐⭐ **CÁCH SỬA (⭐ 1 DÒNG)** | ⭐ `app/page.tsx:741` ⭐ thêm ⭐⭐ `action={action}` ⭐⭐ vào thẻ `<Inventory …>` ⇒ ⭐ **xong** ✅ |
| ⛔⛔ **VÌ SAO ⛔ CHƯA TỰ SỬA (§7 PHÂN VAI)** | ⭐ **`app/page.tsx` THUỘC `ERP-SESSION-01`** ⚠️ (⭐ ghi rõ ở `SHARED_STATE.md` §«Đang giữ» ✓) ⇒ ⭐ **§7** cấm phiên 02 sửa ⛔ · ⭐ **§18** cấm sửa vùng phiên khác ⛔ ⭐ ⭐ ⇒ ⭐ **ĐÃ GHI `HANDOFF-20261007-007` CHO S01** ⭐ + ⭐ **BÁO USER** ✅ |
| **STATUS** | ⭐⭐ **OPEN** ⭐⭐ — ⭐ **ĐÃ CHỨNG MINH ROOT CAUSE bằng mã + đo thật** ✅ · ⛔ **CHƯA SỬA** (⭐ chờ S01 hoặc user cho phép ✓) |
| **RELATED** | ⭐ `TASK-230` · `HANDOFF-20261007-007` ✓ |

---

## ⭐⭐ BUG-20261008-018 — XOÁ **CẢ PHẦN TỬ** MANG `data-inventory-source` ⇒ TEST `W-04` ĐỎ ⚠️ (⭐ do CHÍNH PHIÊN 02) ⭐⭐
| ⭐ | ⭐ |
|---|---|
| **SESSION / MODULE** | ⭐ `ERP-SESSION-02` · ⭐ `TASK-231` · ⭐ **SEVERITY HIGH** ⚠️ (⭐ chặn hồi quy ✓) |
| ⭐⭐ **NGUỒN PHÁT HIỆN** | ⭐ `npm test` sau khi dọn label ⚠️ ⇒ ⭐⭐ **1 test ĐỎ** ⭐⭐ — ⭐ `W-04 — UI KHÔNG hardcode: mọi KPI lấy từ khối tính toán, **in rõ NGUỒN**…` ⭐ ⚠️ |
| ⭐⭐⭐ **BẰNG CHỨNG (⭐ dòng cụ thể)** | ⭐ `tests/w04-inventory-dashboard.test.mjs:170` ⇒ ⭐ `AssertionError: **Thiếu dòng in NGUỒN dữ liệu**` ⚠️<br>⭐ Dòng assert: ⭐⭐ `assert.match(component, /data-inventory-source/, "Thiếu dòng in NGUỒN dữ liệu")` ⭐⭐ ✓ |
| ⭐⭐ **ROOT CAUSE (⭐ ⛔ không đoán — đọc test)** | ⭐ Test ⭐ **CHỈ đòi THUỘC TÍNH `data-inventory-source` TỒN TẠI** ⚠️ ⭐ — ⭐ ⛔ **KHÔNG đòi đoạn chữ dài** ✓<br>⭐ Phiên 02 ⭐ **xoá NGUYÊN 2 phần tử `<p>`** mang thuộc tính đó ⚠️ ⇒ ⭐ **thuộc tính biến mất** ⇒ ⭐ **assert ⛔ không khớp** ✓ |
| ⭐⭐⭐ **FIX (⭐ hài hoà cả 2 — ⛔ không phải chọn 1)** | ⭐⭐⭐ **GIỮ thuộc tính + ĐỔI chữ thành NGẮN** ⭐⭐⭐:<br>⭐ `<p className="muted" **data-inventory-source="eight-metrics"**>**Số liệu tính trực tiếp từ dữ liệu kho hiện có.**</p>` ✅<br>⇒ ⭐ **`W-04` PASS 6/6** ✅ ⭐ **+ VẪN đạt yêu cầu user «xoá label thừa»** ✅ (⭐ ⛔ không còn chữ jargon ✓) ✓ |
| **FILES_CHANGED** | ⭐ `app/screens/WarehouseDashboard.tsx` ✓ |
| **TEST** | ⭐ `npx tsx tests/w04-inventory-dashboard.test.mjs` ⇒ ⭐ **`pass 6 · fail 0`** ✅ ⭐ Hồi quy toàn bộ: ⭐ **`865 · 864 pass · 0 fail`** ✅ |
| **REGRESSION** | ⭐ ✅ `tsc=0` · ⭐ ✅ `BUILD ĐẠT` · ⭐ ✅ `W-04` xanh ✓ |
| **VERIFICATION** | ⭐ ✅ **ĐÃ VERIFY** (⭐ đo lại `innerText` ⇒ ⭐ 6/6 chuỗi jargon = `false` ✓) ✓ |
| ⭐⭐⭐ **STATUS** | ⭐⭐⭐ **FIXED + VERIFIED** ⭐⭐⭐ ✅ |
| ⭐⭐ **BÀI HỌC (§33)** | ⭐⭐ **XOÁ CHỮ ≠ XOÁ PHẦN TỬ** ⭐⭐ — ⭐ một phần tử UI có thể mang **thuộc tính / class / id mà test hoặc JS đang dùng** ⚠️ ⭐ ⭐ ⇒ ⭐⭐ **TRƯỚC khi xoá 1 khối UI ⇒ PHẢI `grep` ① `tests/` ② `app/`/`lib/` cho các `data-*` · `id` · `class` của khối đó** ⭐⭐ ✓<br>⭐ **LẦN THỨ 2 TRONG CÙNG 1 TASK** ⚠️ (⭐ lần 1: `data-inventory-source` ⚠️ · ⭐ lần 2: `INVENTORY_VALUE_NO_SOURCE_NOTE` + `metrics.lowStockSource` ⚠️ — ⭐ may là **grep trước** nên ⛔ không xoá ✓) ✓ |
| **RELATED** | ⭐ `TASK-231` · `CHG-20261007-008` · `TEST-20261007-037` ✓ |

---

## ⭐⭐ BUG-20261008-019 — EM XOÁ NHẦM **NHÃN TRẠNG THÁI CHUẨN** «chưa có nguồn» ⇒ TEST `W-04` ĐỎ **3 LẦN LIÊN TIẾP** ⚠️ ⭐⭐
| ⭐ | ⭐ |
|---|---|
| **SESSION / MODULE** | ⭐ `ERP-SESSION-02` · ⭐ `TASK-231d` · ⭐ **SEVERITY HIGH** ⚠️ (⭐ chặn hồi quy 3 lần ✓) |
| ⭐⭐ **BỐI CẢNH** | ⭐ Theo **luật user ④**: ⭐ «*nếu đối chứng nguồn **chỉ** có tác dụng để **dev check** thì **xóa đi**, **còn không thì giải thích rõ ràng ra***» ⭐ ⇒ ⭐ em **viết lại 11 chuỗi nguồn** trong khối «Giải thích chỉ số» sang **tiếng Việt** ⚠️ |
| ⭐⭐⭐ **LỖI — ⭐ EM LẪN 2 THỨ KHÁC NHAU** | ⭐⭐ **«chưa có nguồn» = NHÃN TRẠNG THÁI CHUẨN TOÀN APP** ⭐⭐ ⛔ **KHÔNG phải jargon** ⚠️ — ⭐ nhưng em **xoá nó** cùng lúc với việc xoá jargon ⚠️<br>⭐ **BẰNG CHỨNG (⭐ test chốt)**: ⭐ `w04:**127**`: ⭐ `assert.equal(INVENTORY_NO_SOURCE, "**chưa có nguồn**")` ⛔ ⭐ — ⭐ đây là **hằng số CHUẨN**, ⭐ khớp quy ước `DASHBOARD_NO_SOURCE` của `T-08` (⭐ ghi ngay ở `WarehouseDashboard.tsx:53` ✓) ✓ |
| ⭐⭐ **3 LẦN ĐỎ LIÊN TIẾP (⭐ sai ở 3 CHỖ khác nhau)** | ⭐ **Lần 1** ⭐ `w04:**134**`: ⭐ `m.value.source.includes(INVENTORY_NO_SOURCE)` ⛔ ⭐ — ⭐ em đổi `value.source` thành `"Chưa có dữ liệu giá vốn"` ⇒ ⭐ **mất nhãn** ⚠️<br>⭐ **Lần 2** ⭐ `w04:**149**`: ⭐ `noPrice.value.standardPriceSource.includes(INVENTORY_NO_SOURCE)` ⛔ ⭐ — ⭐ em đổi thành `"Chưa có giá chuẩn trong danh mục vật tư"` ⇒ ⭐ **mất nhãn** ⚠️<br>⭐ **Lần 3** ⭐ `w04:**153**`: ⭐ `empty.totalSource.includes(INVENTORY_NO_SOURCE)` ⛔ ⭐ — ⭐ em đổi 2 nhánh trong `inventorySourceOf` bỏ `${INVENTORY_NO_SOURCE}` ⇒ ⭐ **mất nhãn** ⚠️ |
| ⭐⭐⭐ **FIX** | ⭐ **GIỮ nhãn chuẩn** `${INVENTORY_NO_SOURCE}` («chưa có nguồn») ⭐ + ⭐ **CHỈ Việt hoá phần LÝ DO phía sau** ⭐:<br>⭐ `value.source` ⇒ ⭐ `${INVENTORY_NO_SOURCE} — **chưa có dữ liệu giá vốn**` ✅<br>⭐ `standardPriceSource` ⇒ ⭐ `${INVENTORY_NO_SOURCE} — **chưa có giá chuẩn trong danh mục vật tư**` ✅<br>⭐ `inventorySourceOf` ⇒ ⭐ `${INVENTORY_NO_SOURCE} — ${label}: **chưa có dòng nào trong phạm vi**` ⭐ / ⭐ `…: **dữ liệu còn trống**` ✅<br>⭐ + ⭐ **7 nhãn `label` Việt hoá**: ⭐ «*Số lượng tồn thực tế trong kho*» ⭐ «*Tồn khả dụng (đã trừ phần giữ chỗ)*» ⭐ «*Số lượng đang bị giữ cho phiếu đề nghị*» ⭐ «*Số lượng đã nhận trên phiếu nhập*» ⭐ «*Số lượng đã xuất trên phiếu xuất*» ⭐ «*Trạng thái phiếu điều chuyển*» ⭐ «*Mức tồn tối thiểu đã đặt của vật tư*» ✅ |
| **TEST** | ⭐ `npx tsx tests/w04-inventory-dashboard.test.mjs` ⇒ ⭐⭐ **`pass 6 · fail 0`** ⭐⭐ ✅ ⭐ ⭐ **hồi quy toàn bộ `866 tests · 865 pass · 0 fail`** ✅ ⭐ `tsc EXIT=0` ✅ ⭐ `BUILD_EXIT=0` ✅ |
| ⭐⭐ **ĐO TRÊN UI (sau build)** | ⭐ Khối «Giải thích chỉ số» ⭐ **⛔ KHÔNG còn** ⚠️: ⭐ «`inventory[].balance` · 1185/1185 dòng có giá trị» ⭐ «`receipts[].acceptedQty` · 36/36» ⭐ «`issues[].totalQty` · 30/30» ⭐ «`transferOrders[].status` · 7/7» ⭐ «`inventory[].minStock` · 1185/1185» ⭐ «*chưa có nguồn — **payload KHÔNG trả khoá stockMovements***» ✅<br>⭐ **«bootstrap :651/661/671/673» ⛔ KHÔNG BAO GIỜ hiện trên màn hình** (⭐ đo cả trước và sau khi mở khối giải thích ⇒ ⭐ đó là **metadata trong mã**, ⛔ không phải nhãn UI ✓) ✅ |
| **VERIFICATION** | ⭐ ✅ **ĐÃ VERIFY** (⭐ đo `document.body.innerText` trên `:9000` ✓) ✅ |
| ⭐⭐⭐ **STATUS** | ⭐⭐⭐ **FIXED + VERIFIED** ⭐⭐⭐ ✅ |
| ⭐⭐ **BÀI HỌC (§33) — ⭐ RẤT QUAN TRỌNG** | ⭐⭐ **«JARGON» ≠ «NHÃN TRẠNG THÁI CHUẨN»** ⭐⭐ ⚠️ — ⭐ khi dọn chữ kỹ thuật ⛔ **KHÔNG được xoá hằng số/nhãn CHUẨN của app** (⭐ ở đây là `INVENTORY_NO_SOURCE` = «chưa có nguồn» ⚠️) ⭐ ⭐ ⭐⭐ **CÁCH PHÂN BIỆT**: ⭐ **jargon** = *tên bảng/cột CSDL · số dòng mã nguồn · `payload`/`bootstrap`* ⇒ **XOÁ** ⭐; ⭐ **nhãn chuẩn** = *hằng số có `assert.equal(...)` trong test · quy ước toàn app* ⇒ **GIỮ NGUYÊN** ✅<br>⭐⭐ **QUY TRÌNH BẮT BUỘC**: ⭐ trước khi sửa 1 chuỗi ⇒ ⭐ **`grep` chuỗi đó trong `tests/`** ⭐ ⇒ ⭐ nếu **có `assert…includes(<HẰNG SỐ>)`** thì ⭐ **⛔ KHÔNG được bỏ hằng số đó**, ⭐ chỉ được **đổi phần chữ phía sau** ⚠️ ✓ |
| **RELATED** | ⭐ `TASK-231d` · `CHG-20261007-010` · `w04-inventory-dashboard.test.mjs` ✓ |

---

## ⭐⭐ BUG-20261008-020 — 2 CỘT «TRẠNG THÁI» + «Ý KIẾN ĐIỀU CHỈNH» LÀ **DỮ LIỆU CHẾT** — HIỂN THỊ GÂY HIỂU NHẦM ⚠️ ⭐⭐
| ⭐ | ⭐ |
|---|---|
| **SESSION / MODULE** | ⭐ `ERP-SESSION-02` · ⭐ **Danh mục vật tư** → tab **«Danh mục nhóm vật tư»** · ⭐ **SEVERITY MEDIUM** ⚠️ (⭐ gây hiểu nhầm, ⛔ không mất dữ liệu ✓) |
| ⭐⭐ **NGUỒN PHÁT HIỆN** | ⭐⭐ **USER HỎI** ⭐⭐ (⭐ nguyên văn): «*Danh mục vật tư: tab Danh mục nhóm vật tư, **tại sao lại có trường Ý kiến điều chỉnh và trạng thái đã duyệt và đề xuất là sao***» ⭐ ⭐ ⇒ ⭐ **nghi vấn về 2 cột** ⇒ ⭐ **TRA MÃ** ⛔ không trả lời theo trí nhớ ✓ |
| ⭐⭐⭐ **BẰNG CHỨNG ① — CỘT CÓ THẬT TRONG CSDL** | ⭐ `material_subcategories` ⭐ có ⭐ **`review_status`** (⭐ `NOT NULL DEFAULT 'approved'` ✓) ⭐ + ⭐ **`adjustment_note`** (⭐ NULLABLE ✓) ⭐ + ⭐ `scope_examples` ⭐ — ⭐ đo từ ⭐ `java-backend/.../BootstrapDataAdapter.java:225-229` (⭐ SQL `SELECT … ms.review_status AS reviewStatus, ms.adjustment_note AS adjustmentNote …` ✓) ✅ |
| ⭐⭐⭐ **BẰNG CHỨNG ② — UI HIỆN 2 CỘT (`app/page.tsx:1448`)** | ⭐ Header bảng: ⭐ `… <th>Phạm vi / ví dụ gồm</th> <th>**Trạng thái**</th> <th>**Ý kiến điều chỉnh**</th> …` ✓<br>⭐ Ô **Trạng thái**: ⭐ `Number(row.active)===0 ? "Đã ẩn" : String(row.reviewStatus**||"proposed"**)==="approved" ? "Đã duyệt" : "Đề xuất"` ⚠️<br>⭐ Ô **Ý kiến điều chỉnh**: ⭐ `sanitizeUiText(row.adjustmentNote**||"💬"**)` ⚠️ |
| ⭐⭐⭐ **BẰNG CHỨNG ③ — ⛔ KHÔNG AI GHI ĐƯỢC 2 CỘT NÀY** | ⭐ ① ⭐ **MODAL ⛔ KHÔNG CÓ 2 TRƯỜNG** ⚠️ — ⭐ `MaterialSubcategoryModal` (`app/page.tsx:**3086**`) ⭐ **chỉ có 4 ô**: ⭐ «Hệ M&E cha *» ⭐ «Tên nhóm vật tư *» ⭐ «Thứ tự hiển thị» ⭐ «Mô tả» ⭐ ⇒ ⭐ **người dùng ⛔ KHÔNG THỂ nhập «Trạng thái» hay «Ý kiến điều chỉnh»** ⚠️<br>⭐ ② ⭐ **ĐƯỜNG JAVA ⛔ KHÔNG GHI** ⚠️ — ⭐ chính **mã Java ghi rõ** ⭐⭐ `MaterialCatalogStore.java:**61**`: ⭐ «*⇒ 3 cột kia **không bao giờ được ghi** từ đường Java: `review_status` của nhóm con sửa lẽ ra phải…*» ⚠️ ⭐ + ⭐ `MaterialCatalogManagementUseCase.java:**641**`: ⭐ «*`review_status` KHÔNG được ghi ⇒ nhận **GIÁ TRỊ MẶC ĐỊNH của CSDL = 'approved'***» ⚠️ ⭐ (⭐ `:654`: «*(Hai cột còn lại `scope_examples`/`adjustment_note` là NULLABLE — JS cũng không ghi.)*» ✓) ✓ |
| ⭐⭐⭐ **KẾT LUẬN — VÌ SAO THẤY «Đã duyệt» / «Đề xuất»** | ⭐ **«Đã duyệt»** ⭐ = ⭐ **GIÁ TRỊ MẶC ĐỊNH của CSDL** ⚠️ ⭐ — ⭐ ⛔ **KHÔNG phải «có ai đó đã duyệt»** ⚠️ ⭐ ⭐ (⭐ vì `review_status` ⛔ không được ghi ⇒ CSDL tự điền `'approved'` ✓)<br>⭐ **«Đề xuất»** ⭐ = ⭐ khi trường **TRỐNG/null** ⭐ ⇒ ⭐ UI **tự gán** `||"proposed"` ⚠️ ⭐ — ⭐ ⛔ không phải «ai đó đề xuất» ✓<br>⭐ **«Ý kiến điều chỉnh»** ⭐ = ⭐ **LUÔN TRỐNG** ⚠️ ⇒ ⭐ chỉ hiện **💬** ⭐ — ⭐ ⛔ **không bao giờ có nội dung** ✓<br>⭐⭐⭐ **⇒ 2 CỘT NÀY LÀ «DỮ LIỆU CHẾT»: HIỂN THỊ NHƯNG ⛔ KHÔNG AI NHẬP ĐƯỢC, ⛔ KHÔNG AI DUYỆT ĐƯỢC** ⭐⭐⭐ ⚠️ |
| ⭐⭐ **TÁC HẠI (⭐ vì sao MEDIUM)** | ⭐ «**Đã duyệt**» ⭐ **gây hiểu nhầm** ⚠️ — ⭐ người dùng tưởng nhóm vật tư **đã được duyệt chính thức** ⭐ nhưng thực tế ⛔ **chưa ai duyệt** ⭐ ⭐ (⭐ đúng loại «**hiện số/trạng thái mà ⛔ không có thật**» ✓) ✓ |
| **ĐỀ XUẤT (⏳ chờ user quyết — ⛔ CHƯA SỬA)** | ⭐ **A. XOÁ 2 cột khỏi bảng** ⭐ — ⭐ nhanh, ⛔ không gây hiểu nhầm nữa ⭐ ⚠️ nhưng **mất khả năng hiển thị nếu sau này làm thật** ⭐<br>⭐ **B. LÀM THẬT** ⭐ — ⭐ thêm 2 ô vào modal + ⭐ sửa Java ghi 2 cột ⚠️ ⭐ (⭐ `java-backend` **thuộc `ERP-SESSION-01`** ⇒ ⭐ phải **bàn giao** ✓) ⭐ ⭐ **đắt hơn** ✓<br>⭐ **C. GIỮ CỘT NHƯNG GHI RÕ NGUỒN** ⭐ — ⭐ đổi nhãn «Đã duyệt» ⇒ «**Mặc định hệ thống**» ⚠️ + ⭐ bỏ cột «Ý kiến điều chỉnh» ⭐ (⭐ vì luôn trống ✓) ✓ |
| **STATUS** | ⭐⭐ **OPEN** ⭐⭐ — ⭐ **đã tra rõ nguyên nhân bằng mã** ✅ · ⛔ **CHƯA SỬA** (⭐ chờ user chọn A/B/C ✓) |
| **RELATED** | ⭐ `TASK-227` (⭐ tab này do phiên 02 làm ✓) · `MaterialCatalogStore.java:58-71` · `MaterialCatalogManagementUseCase.java:365-395/641-654` ✓ |

### ⭐ BỔ SUNG THAM CHIẾU — `BUG-20261008-020` thuộc `TASK-232` + `TASK-233`
| ⭐ | ⭐ |
|---|---|
| ⭐ **RELATED_TASK** | ⭐ `TASK-232` (⭐ **sửa** ✓) ⭐ + ⭐ `TASK-233` (⭐ **audit cùng loại** ✓) ✓ |
| ⭐ **RELATED_CHANGE** | ⭐ `CHG-20261008-012` · ⭐ `DEC-20261008-012` ✓ |
| ⭐ **TEST** | ⭐ `TEST-20261007-042` (⭐ sửa ✓) · ⭐ `TEST-20261007-043` · ⭐ `TEST-20261007-044` (⭐ audit ✓) ✓ |
| ⭐⭐ **TRẠNG THÁI CUỐI** | ⭐⭐ **FIXED + VERIFIED** ⭐⭐ — ⭐ header **8 cột** ⭐ 4 chuỗi jargon **`false`** ⭐ dòng hiện **«Đang dùng»** ⭐ + ⭐ **audit toàn màn: ⛔ không còn ca nào** ✅ |

## 🚨🚨 BUG-20261008-021 — **LỖI LINT CHẶN TOÀN BỘ `npm test`** — ⚠️ **KHÔNG PHẢI CỦA PHIÊN 02** 🚨🚨
| ⭐ | ⭐ |
|---|---|
| **SESSION PHÁT HIỆN / MODULE** | ⭐ `ERP-SESSION-02` (⭐ **phát hiện** ⛔ không sửa ✓) · ⭐ `app/page.tsx` → màn **ADMIN «PHÂN QUYỀN NGƯỜI DÙNG»** ✓ |
| ⭐⭐⭐ **SEVERITY** | ⭐⭐ **CAO** ⭐⭐ ⚠️ — ⭐ **`npm test` = `npm run lint && …`** ⚠️ ⭐ ⇒ ⭐ **lint đỏ ⇒ ⛔ TOÀN BỘ SUITE TEST KHÔNG CHẠY** ⚠️ ⭐ ⭐ **ẢNH HƯỞNG MỌI PHIÊN** ⭐⭐ ✅ |
| ⭐⭐⭐ **BẰNG CHỨNG (⭐ đo chính xác)** | ⭐ `npx eslint . --ignore-pattern dist --ignore-pattern .next -f json` ⭐ ⇒ ⭐ **`TONG_LOI = 1`** ⭐ ⚠️<br>⭐⭐ **FILE**: ⭐ `app/page.tsx` ⭐ **`L2875:106`** ⭐ ⭐ **RULE**: ⭐ `react-hooks/set-state-in-effect` ⭐ ⭐ **MESSAGE**: ⭐ «*Calling setState synchronously within an effect can trigger cascading renders*» ✓<br>⭐ **DÒNG LỖI**: ⭐ `useEffect(() => { if (!duocXemBuoc(step)) { const dau = steps.findIndex((_, i) => duocXemBuoc(i + 1)); **setStep**(dau >= 0 ? dau + 1 : 0); } }, [step, data.user?.id]);` ⚠️<br>⭐ **VỊ TRÍ**: ⭐ ngay trên ⭐ `L2877 title="PHÂN QUYỀN NGƯỜI DÙNG"` ⭐ ⇒ ⭐ thuộc màn **ADMIN** ✅ |
| ⭐⭐ **XÁC MINH ⛔ KHÔNG PHẢI CỦA PHIÊN 02** | ⭐ Thay đổi của phiên 02 trên `app/page.tsx` ⭐ **CHỈ 1 DÒNG** ⭐ ở ⭐ **L741** ⭐ (⭐ `<Inventory … action={action} />` ⭐ cho `BUG-20261007-017` ✓) ⚠️ ⭐ ⭐ Lỗi ở ⭐ **L2875** ⭐ — ⭐ **cách xa 2000+ dòng** ⭐ ⛔ **không liên quan** ✅ |
| ⭐⭐ **QUY KẾT THEO LUẬT `§7`** | ⭐ ⭐ `app/page.tsx` + ⭐ **màn ADMIN** ⭐ ⇒ ⭐ **THUỘC `ERP-SESSION-01`** ⭐ (⭐ «*SESSION 1 sở hữu **PR&PO – ADMIN***» ✓) ⚠️ ⭐ ⇒ ⭐⛔ **phiên 02 ⛔ KHÔNG sửa** ⚠️ ⭐ ⇒ ⭐ **BÁO CÁO** theo ⭐ **`§20`** (⭐ REPORT BUG → BUG_TRACKING → **NOTIFY SESSION_01** ✓) ✅ |
| ⭐ **ĐỀ XUẤT SỬA (⭐ gợi ý, ⛔ không tự làm)** | ⭐ 3 cách: ⭐ (a) ⭐ **Tính trong `useMemo`/`useState` khởi tạo** ⭐ thay vì `useEffect` + `setState` ⭐ (b) ⭐ **Gọi `setStep` trong callback** ⭐ (⭐ `requestAnimationFrame`/event ✓) ⭐ (c) ⭐ **Tắt rule cho đúng dòng đó** ⭐ + ⭐ ghi lý do (`// eslint-disable-next-line react-hooks/set-state-in-effect`) ⚠️ ⭐ ⭐ **KHUYẾN NGHỊ**: ⭐ **(a)** ⭐ — ⭐ đúng tinh thần React 19 ⭐ (⭐ https://react.dev/learn/you-might-not-need-an-effect ✓) ✅ |
| **STATUS** | ⭐⭐ **OPEN — ⏳ CHỜ `ERP-SESSION-01`** ⭐⭐ ⚠️ ⭐ ⛔ **phiên 02 ⛔ không tự sửa** ✅ |
| ⭐⭐ **GHI CHÚ VỀ THỜI ĐIỂM** | ⭐ Lúc ⭐ `TEST-051` *(round 105)* ⭐ lint **0 errors** ✅ ⚠️ ⭐ ⇒ ⭐ lỗi này ⭐ **XUẤT HIỆN SAU ĐÓ** ⚠️ ⭐ — ⭐ do ⭐ **phiên khác** ⭐ đang sửa `page.tsx` ✅ |
