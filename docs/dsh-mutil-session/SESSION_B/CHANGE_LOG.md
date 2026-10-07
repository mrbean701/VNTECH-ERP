# CHANGE_LOG — SESSION_B (ERP-SESSION-02)

## CHG-20261006-001
Date: 2026-10-06 | Session: ERP-SESSION-02 | Type: UI | Module: Warehouse
Before: Menu nhom KHO co 7 muc roi (Kho · Nhap · Xuat · Dieu chuyen · Dashboard ton kho · Cap phat & hoan tra) — nhieu cua vao CUNG chuc nang.
After: 1 muc «Kho vat tu» mo thang HUB (dashboard ton kho + 3 tab). Muc «Cap phat & hoan tra» gop vao hub.
Reason: Yeu cau user «click vao menu se hien thi luon ra man dashboard ton kho» + 3 tab; 7 muc roi la THUA.
Files: lib/menu-helpers.ts · tests/w01-warehouse-menu.test.mjs · tests/mt3-ui-29-view-collision-diagnostic.test.mjs
Impact: Menu gon hon; KHONG mat chuc nang (6 khoa cu VAN SONG cho quyen/tieu de/tim kiem/nhanh render).
Compatibility: Khong doi API · khong migration · khong khoa module moi.
Test: TEST-20261006-005 | Status: DONE

## CHG-20261006-002
Date: 2026-10-06 | Session: ERP-SESSION-02 | Type: UI | Module: Warehouse
Before: Inventory.tsx la man 4 tab; moi khoi noi dung (bang ton kho, canh bao, phieu dieu chuyen, danh sach xuat...) hien o MOI tab.
After: HUB 3 TAB (KHO · XUAT & NHAP · CAP PHAT & HOAN TRA); moi khoi thuoc DUNG 1 tab; tab KHO co dashboard ton kho + cards kho.
Reason: Yeu cau user ve tabbar 3 tab + dashboard ngay dau man.
Files: app/screens/Inventory.tsx · lib/warehouse-hub.ts · tests/w04-inventory-dashboard.test.mjs
Impact: 10/10 khoi dung 1 tab · tab mac dinh = KHO · khong mat khoi nao.
Compatibility: Hop dong test w04 duoc CAP NHAT (khong noi cong — khang dinh con MANH HON).
Test: TEST-20261006-001..003 | Status: DONE

## CHG-20261006-003
Date: 2026-10-06 | Session: ERP-SESSION-02 | Type: UI | Module: Warehouse
Before: Bam card kho => MODAL chi tiet (khong co nut quay lai, khong chia tab).
After: MAN CHI TIET KHO (early-return) — nut «Quay lai man KHO» + 5 tab: Dashboard kho · Ton kho · Xuat - Nhap · Cap phat - Hoan tra · Nhan su.
Reason: Yeu cau user «click vao se hien thi ra man thong tin chi tiet cua kho (co nut quay lai man KHO)... 5 tab».
Files: app/screens/Inventory.tsx · lib/warehouse-hub.ts
Impact: Modal cu DA XOA (khong con ma chet — xoa co KIEM BIEN 3 DIEM).
Compatibility: Khong doi route · khong doi API.
Test: TEST-20261006-004 | Status: DONE

## CHG-20261006-004
Date: 2026-10-06 | Session: ERP-SESSION-02 | Type: Bugfix | Module: Warehouse
Before: 4 loi co san — card kho hien UUID · tim/sap xep kho KHONG chay · xuat Excel cot Ma/Ten kho RONG · «So phieu xuat» LUON = 0.
After: Card hien TEN KHO; tim/sap xep/Excel chay dung; BO chi so SAI «So phieu xuat».
Reason: Inventory.tsx doc w.warehouseName/warehouseCode/warehouseType KHONG ton tai trong payload; va loc issues[] theo warehouseId KHONG co truong do.
Files: app/screens/Inventory.tsx
Impact: Het thong tin SAI tren man kho. Xem BUG-20261006-001..004.
Test: TEST-20261006-002 | Status: DONE

## CHG-20261006-005
Date: 2026-10-06 | Session: ERP-SESSION-02 | Type: Migration | Module: DevOps
Before: chua co migration cho chu ky GD nay.
After: drizzle/0329_phase_gd_task_226_hub_kho_vat_tu_3_tab_gom_menu_7_identity.sql (do node tools/gd-cycle.mjs sinh).
Reason: Quy trinh du an — moi chu ky GD phai tao migration moi + refresh fingerprint.
Files: drizzle/0329_*_identity.sql · VNTECH_FINGERPRINT.json
Impact: FINGERPRINT DAT VNTECH-FP-121300BEED7174E4 · BUILT ARTIFACT VALIDATION DAT.
Compatibility: Khong doi schema nghiep vu (chi identity).
Test: TEST-20261006-004 | Status: DONE

## CHG-20261006-006
Date: 2026-10-06 | Session: ERP-SESSION-02 | Type: Documentation | Module: Coordination State
Before: Goal §4 liet ke 7 ten tep coordination (CURRENT_STATE · GO_LIVE_CHECKLIST · BUG_TRACKING · HOTFIX_HISTORY ·
MULTI_SESSION_STATE · SESSION_REGISTRY · SESSION_HANDOFF) nhung repo chi co 2 ten khop; 5 ten con lai KHONG ton tai
du da co tep TUONG DUONG (CHECKLIST 7.452d · DECISIONS 2.492d · TASK_HISTORY 1.262d · + lop log moi dsh-mutil-session/).
After: Tao MOI docs/dsh-state/00_GOAL_S4_MAPPING.md (49 dong) — BAN DO ANH XA Goal §4 <=> cau truc state THUC CO,
kem phan vai 3 thu muc (dsh-state / dsh-mutil-session / agent-progress) va bang «ai ghi gi» de tranh ghi trung.
Reason: Goal §4 dan ro «da co cau truc tuong duong thi PHAI dung cau truc hien tai, KHONG tao he thong state thu hai»
=> KHONG tao 5 tep trung lap (tranh state conflict + checklist corruption — Goal §2), ma ghi ban do anh xa.
Files: docs/dsh-state/00_GOAL_S4_MAPPING.md (MOI)
Impact: Nguoi/phien sau TIM DUNG noi luu tung loai du lieu; KHONG co tep trung lap; KHONG dung cham tep cua phien khac.
Compatibility: Tep MOI — KHONG sua/ghi de bat ky tep nao khac trong docs/dsh-state/.
Test: N/A (tai lieu) | Status: DONE

## CHG-20261006-001
Date: 2026-10-06 18:10 | Session: ERP-SESSION-02 | Category: UI_UX / FRONTEND | Module: Danh mục vật tư
BEFORE: Hub «Danh mục vật tư gốc» có **3 tab**: [Danh sách vật tư] · [Danh mục nhóm con mã vật tư gốc] ·
  [Mã vật tư gốc]. Ngoài 3 tab còn khối **«CÔNG CỤ CHẨN LOẠN — §12.3»** gồm 2 khối con
  (SO SÁNH/ĐỐI CHIẾU BOQ + SOÁT TRÙNG ALIAS) **hiện chồng lên tab 0** ⇒ ⛔ trồng tréo thông tin.
AFTER: Hub còn **3 tab** theo đúng yêu cầu user 06/10/2026:
  ① **Danh sách vật tư**        — chỉ còn bảng vật tư + nhóm nút CRUD/Search/Sort/Filter (đã bỏ khối trồng tréo)
  ② **Danh mục nhóm vật tư**    — ĐỔI TÊN từ «Danh mục nhóm con mã vật tư gốc»
  ③ **Danh mục hệ vật tư**      — TAB MỚI: danh sách hệ + CRUD/Search/Sort/Filter
  ⛔ BỎ tab «Mã vật tư gốc».
REASON: user yêu cầu trực tiếp 06/10/2026 (kèm ảnh chụp màn hình chỉ rõ phần trồng tréo).
FILES:
  · `app/screens/MaterialCategoryList.tsx` (**MỚI**, 116 dòng) — màn Danh mục hệ vật tư
  · `app/page.tsx` — thêm import; `MATERIAL_TABS` 3 phần tử mới; xoá khối CÔNG CỤ CHẨN LOẠN (8 dòng);
    đổi tên `<summary>` tab 1; thay tab 2 bằng `<MaterialCategoryList …>`; dọn 3 dòng biến thừa.
IMPACT: ⛔ chức năng `MaterialMatchingWorkspace` + `runAliasCheck` **KHÔNG bị xoá** (còn nguyên trong tệp),
  chỉ tạm không hiển thị ở hub này — ⛔ CẦN USER XÁC NHẬN có đặt vào tab riêng hay bỏ hẳn.
COMPATIBILITY: không đổi API. Dùng lại 3 action có sẵn (đo thật `scripts/system-route.mjs:2693/2718/2725`):
  `save_material_category` · `set_material_category_status` · `delete_material_category` — cả 3 đều
  `requireRole(user, ["admin"])`. Modal biểu mẫu dùng lại `CategoryModal` (đã có sẵn, `modal === "categoryMaster"`).
TEST: `npx tsc --noEmit` EXIT=0 · `npm run test:regression` 803 test / 802 pass / 0 fail / 1 skip
STATUS: **IN_PROGRESS** — chờ build + nghiệm thu thật trên :9000

## CHG-20261007-002
Date: 2026-10-07 10:30 | Session: ERP-SESSION-02 | Category: UI_UX | Module: Kho vat tu (hub)
BEFORE: Tab «KHO» cua hub «Kho vat tu» co **10 khoi · trang cao 6.202px** — user bao «sap xep qua lon xon».
  Do that cu the 6 nhom trung lap:
   ① Toolbar «TON KHO & DIEU CHUYEN» (tim/sap xep/loc/Xuat Excel/In ma)
   ② Hang **4 KPI** (Ton kha dung · Cho nhap · Cho xuat · Canh bao ton thap)
   ③ DASHBOARD TON KHO (8 chi so)
   ④ Khoi «KHO»: toolbar «KHO» + **3 KPI** (So kho · Vat tu dang co · Phieu xuat) + **12 cards kho**
   ⑤ Khoi co **dai tab LA «TON KHO | CHUYEN KHO | THE KHO»** (trong y nhu tab thu 2) + bang ton kho 11 cot
   ⑥ **«Gia tri ton kho theo kho»** = **13 nut kho** (TRUNG 12 cards o ④)
  + Nhan «Pham vi du an» hien **3 lan** (thanh dau trang · trong card «KHO VAT TU» · trong toolbar).
AFTER: Tab «KHO» con **9 khoi · trang cao 4.949px** (giam 1.253px ≈ 20%):
  · ④ BO hang **3 KPI trung** (giu 4 KPI o ② — da du thong tin)
  · ⑥ BO **danh sach kho THU 2** («Gia tri ton kho theo kho» 13 nut) — 12 cards o ④ da hien
       «Ton hien tai + So vat tu» cho TUNG kho; bo loc theo kho ⛔ KHONG mat vi toolbar da co
       o chon «Tat ca kho» (`whFilter`).
  · ⑤ BO **dai tab la** — 2 nut «CHUYEN KHO» / «THE KHO» **CHUYEN vao toolbar** (⛔ khong xoa chuc nang)
  · BO **2 nhan «Pham vi du an» trung** (theo user chot: giu 1 cho — thanh chon du an o dau trang)
REASON: user yeu cau truc tiep 07/10 («snapshoot lai hub Kho vat tu di, toi nhin thay no sap xep qua lon xon»).
FILES: `app/screens/Inventory.tsx` (**6 them / 10 xoa** — sua nho, co lap)
IMPACT: ⛔ khong xoa chuc nang nao: 2 nut duoc CHUYEN cho; bo loc kho van con o toolbar; «Canh bao ton kho» GIU.
COMPATIBILITY: khong doi API/schema. Selector moi: `[data-vntech="inv-transfer-btn"]` · `[data-vntech="inv-ledger-btn"]` · `[data-vntech="inventory-table-card"]`.
TEST: `npx tsc --noEmit` **EXIT=0** · `npm run test:regression` **803·802pass·0fail** · do that lai tren :9000
STATUS: **VERIFIED**

## CHG-20261007-003
Date: 2026-10-07 12:00 | Session: ERP-SESSION-02 | Category: UI_UX / FRONTEND | Module: Danh mục vật tư + Kho vật tư
BEFORE:
  ① Màn «Danh mục vật tư» còn 2 công cụ chẩn đoán **«SO SÁNH & MAPPING BOQ»** + **«SOÁT TRÙNG ALIAS»**
     (đã gỡ khỏi giao diện ở TASK-227 nhưng mã `MaterialMatchingWorkspace` **vẫn còn** trong `app/page.tsx`).
  ② Tab «KHO» của hub «Kho vật tư» còn **2 khối «giải thích»** hiện thẳng giữa màn vận hành:
     «Giá trị kho — vì sao có ô «chưa có nguồn»» + «Nguồn dữ liệu của từng chỉ số» ⇒ tab cao **4.949px**.
AFTER:
  ① **BỎ HẲN 2 công cụ** (user chọn **(c)** 07/10): xoá hàm `MaterialMatchingWorkspace` (**28 dòng**)
     — đã kiểm ⛔ không còn chỗ nào dùng.
  ② **THU 2 khối «giải thích» vào nút «?»** (user chọn **(b)** 07/10): thêm nút
     **«Giải thích chỉ số →» / «Ẩn giải thích chỉ số →»** cạnh tiêu đề DASHBOARD TỒN KHO; 2 khối **ẨN mặc định**,
     hiện khi bấm ⇒ tab «KHO» cao **4.052px** (⛔ mặc định) / 4.949px (khi mở giải thích).
     ⇒ so với ban đầu **6.202px**, mặc định nay giảm **2.150px ≈ 35%**.
REASON: user yêu cầu trực tiếp 07/10 (chọn (c) cho 2 công cụ · (b) cho 2 khối giải thích).
FILES: `app/page.tsx` (xoá 28 dòng) · `app/screens/WarehouseDashboard.tsx` (thêm `useState` + state `showHelp` + nút «?» + bọc 2 khối)
IMPACT: ⛔ KHÔNG mất dữ liệu/chức năng nghiệp vụ: 2 khối giải thích **GIỮ NGUYÊN NỘI DUNG**, chỉ ẩn mặc định.
  2 công cụ chẩn đoán bị bỏ theo yêu cầu user — ⚠️ **còn trong git history** nếu cần khôi phục.
COMPATIBILITY: không đổi API/schema. Dùng ĐÚNG khuôn `CardHead` có sẵn (`action: string` + `onClick`).
TEST: `npx tsc --noEmit` **EXIT=0** · `npm run test:regression` **803·802pass·0fail** · E2E thật trên :9000
STATUS: **VERIFIED**
