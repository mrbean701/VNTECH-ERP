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

## ⭐⭐ CHG-20261007-006 — TẠM KHOÁ 4 NÚT CHẾT Ở HUB «KHO VẬT TƯ» + GHI RÕ LÝ DO ⭐⭐
| ⭐ | ⭐ |
|---|---|
| **SESSION** | ⭐ `ERP-SESSION-02` ⭐ (⭐ `app/screens/Inventory.tsx` **thuộc phiên 02** ✓) |
| ⭐ **CATEGORY** | ⭐ **UI_UX** + ⭐ **BUGFIX** (⭐ chuyển «im lặng» ⚠️ → «nói rõ lý do» ✅ ✓) |
| **MODULE** | ⭐ Hub «Kho vật tư» → tab «KHO» + tab «CẤP PHÁT & HOÀN TRẢ» ✓ |
| ⭐⭐ **BEFORE** | ⭐ 4 nút **BẤM ĐƯỢC nhưng ⛔ KHÔNG CÓ GÌ XẢY RA** (⭐ im lặng ⚠️) ⭐ — ⭐ đo thật: `dai` **107.793 → 107.793**, `modal 0` ✓ |
| ⭐⭐ **AFTER** | ⭐ 4 nút ⭐⭐ **BỊ KHOÁ (`disabled`)** ⭐⭐ + ⭐ mỗi nút có **`title`** nêu **mã bug + lý do** ✅ ⭐ + ⭐ **ghi chú trên thanh công cụ** nêu lý do ✅ ✓ |
| **4 NÚT** | ⭐ ① «＋ Tạo kho» ⭐ ② «✎ Sửa» ⭐ ③ «🗑 Xóa» ⭐ ④ «＋ Tạo phiếu cấp phát» ✓ |
| **REASON** | ⭐⭐⭐ `open("warehouse")` / `open("allocate")` ⇒ ⛔ **`app/page.tsx` đủ 40 modal nhưng ⛔ KHÔNG có 2 tên đó** ⭐ `action("delete_warehouse")` ⇒ ⛔ **không tồn tại ở CẢ JS lẫn Java** ⭐⭐⭐ ⇒ ⭐⭐ **chờ backend bổ sung — ⛔ không được bịa nghiệp vụ (§14)** ⭐⭐ ✓ |
| **FILES** | ⭐ `app/screens/Inventory.tsx` ⭐ — ⭐ **14 thêm / 7 xoá** ⭐ ⭐ (⭐ **⛔ GIỮ NGUYÊN `onClick`** ⇒ ⭐ **hoàn nguyên = chỉ bỏ `disabled`** ✓) ✓ |
| ⭐ **IMPACT** | ⭐ Người dùng ⭐⭐ **BIẾT VÌ SAO ⛔ KHÔNG BẤM ĐƯỢC** ⭐⭐ (⛔ hết hiểu nhầm «hệ thống treo») ✅ · ⭐ ✅ **⛔ KHÔNG ảnh hưởng** nút còn lại ✓ |
| **COMPATIBILITY** | ⭐ ✅ **Tương thích ngược** — ⛔ không đổi API · ⛔ không đổi dữ liệu · ⛔ không đổi quyền ✓ |
| ⭐⭐ **TEST** | ⭐ `tsc EXIT=0` ✅ ⭐ `npm run BUILD_EXIT=0` ⭐ `BUILT ARTIFACT VALIDATION: ĐẠT` ✅ ⭐ vân tay `VNTECH-FP-ECCDEC5AB0C8BDF8` ✅ ⭐ server `:8787` PID **1368** ⭐ `:9000` **HTTP 200** ✅<br>⭐⭐ **ĐO TRÊN UI (có ĐỐI CHỨNG DƯƠNG)**: ⭐ **4/4 nút KHOÁ** ✅ ⭐ **3/3 đối chứng dương VẪN CHẠY** ✅ — ⭐ «⇩ Xuất Excel» `disabled=false` ✅ ⭐ «◉ Xem chi tiết kho» `disabled=false` ⭐ **VÀ ĐỔI MÀN THẬT** ✅ ⭐ «＋ Tạo phiếu hoàn trả» `disabled=false` ⭐ **MỞ MODAL THẬT** (`modal 0 → 1`) ✅ ✓ |
| ⭐⭐ **SAI LẦM ĐÃ SỬA (§22) — LẦN 6** | ⭐ Bản đo đầu báo ⭐ **«2/3 đối chứng»** ⚠️ và ⭐ **«ghi chú ⛔ KHÔNG có»** ⚠️ ⇒ ⭐⭐ **CẢ 2 ĐỀU LÀ LỖI PHÉP ĐO** ⭐⭐:<br>⭐ **①** «◉ Xem chi tiết kho» `disabled=true` ⭐ vì ⭐⭐ **nút cần `selectedWhId` — probe ⛔ CHƯA CHỌN thẻ kho** ⭐⭐ ⇒ ⭐ ✅ **chọn thẻ xong ⇒ `disabled=false`** ⭐ ⭐ (⭐ **⛔ không phải lỗi** ✓)<br>⭐ **②** «ghi chú ⛔ KHÔNG có» ⭐ vì ⭐⭐ **chuỗi bị CẮT ở 150 ký tự** — ⭐ phần «TẠM KHOÁ» nằm ở **CUỐI** ⭐⭐ ⇒ ⭐ ✅ **tìm toàn bộ ⇒ CÓ** ⭐ ✓<br>⭐⭐ ⭐ ⇒ ⭐⭐ **PHÉP ĐO PHẢI: (a) ĐỦ ĐIỀU KIỆN TIÊN QUYẾT của đối tượng · (b) ⛔ KHÔNG CẮT DỮ LIỆU** ⭐⭐ ✓ |
| **STATUS** | ⭐⭐ **DONE** ⭐⭐ — ⭐ `tsc` + build + đo UI **đều ĐẠT** ✅ ⭐ (⭐ **nhưng 4 chức năng vẫn ⛔ CHƯA HOẠT ĐỘNG** — ⭐ đây là **giảm thiệt hại UX**, ⛔ không phải đã sửa xong bug ⚠️ ✓) ✓ |
| **RELATED** | ⭐ `BUG-20261007-013` · `-014` · `-015` ⭐ `DEC-20261007-010` ✓ |

## ⭐⭐ CHG-20261007-007 — `app/page.tsx` (LOCK S01) + `app/globals.css` (dùng chung) — **USER ĐÃ CHO PHÉP** ⭐⭐
| ⭐ | ⭐ |
|---|---|
| **SESSION** | ⭐ `ERP-SESSION-02` · **CATEGORY** `UI_UX` + `BUGFIX` ✓ |
| ⭐⭐ **KIỂM CONFLICT TRƯỚC KHI SỬA (§28 — ⭐ BẮT BUỘC)** | ⭐ ① ⭐ `SHARED_STATE.md:16` ghi rõ: ⭐⭐ «`app/page.tsx` đang do **ERP-SESSION-01** giữ ⇒ phiên khác ⛔ **KHÔNG sửa**» ⭐⭐ ⚠️<br>⭐ ② ⭐ `SHARED_STATE.md:467`: ⭐ «⛔ CHỖ SỬA ⛔ KHÔNG THUỘC PHIÊN 03: `app/globals.css` (dùng chung) + `app/page.tsx` (**LOCK S01**)» ⚠️ ⇒ ⭐ **S03 cũng đang cần 2 tệp này** ⚠️<br>⭐ ③ ⭐ `git diff HEAD -- app/page.tsx` = ⭐⭐ **đúng 1 dòng** ⭐⭐ ⇒ ⭐ **⛔ KHÔNG có phiên nào đang sửa dở `page.tsx`** ✅ ⇒ **an toàn để sửa** ✓<br>⭐ ④ ⭐ `git status` ⛔ không thấy `app/page.tsx` bị sửa trước đó ✓ |
| ⭐⭐ **CĂN CỨ ĐƯỢC PHÉP SỬA** | ⭐⭐⭐ **USER CHO PHÉP TRỰC TIẾP** ⭐⭐⭐ (⭐ trả lời qua kênh điện thoại ✓) ⭐ ⛔ **KHÔNG tự ý** ✅ |
| **MODULE** | ⭐ Hub «Kho vật tư» — chức năng **«Thêm nhân sự vào kho»** (`TASK-230` ⑥) ✓ |
| ⭐⭐ **BEFORE → AFTER** | ⭐ **`app/page.tsx`** — ⭐ TỪ: `<Inventory data={data} project={project} open={open} view={warehouseView} />`<br>⭐ THÀNH: `<Inventory data={data} project={project} open={open} view={warehouseView} **action={action}** />` ⭐⭐ **+1 thuộc tính** ⭐⭐ ✓<br>⭐ **`app/globals.css`** — ⭐ **+61 dòng** (⭐ 2 khối `TASK-230`: ⭐ ép `.inventory-approved-grid` **1 cột** ⭐ neo `.approved-inventory-screen` + ⭐ CSS card kho `.warehouse-card`) ⭐ ⚠️ **đã đặt TRƯỚC dấu `/* VNTECH_MASTER_BASELINE_CSS_R1_1_1_END */`** (⭐ test `project-navigation-consolidation.test.mjs:65` bắt buộc tệp **kết thúc bằng dấu đó** ✓) ✓ |
| **REASON** | ⭐ ① ⭐ `page.tsx` thiếu `action={action}` ⇒ ⭐ nút «Lưu phân công» **`disabled` vĩnh viễn** (`BUG-20261007-017`) ✓<br>⭐ ② ⭐ `globals.css` — ⭐ lệch **356px**: `.inventory-approved-grid` còn cột **340px RỖNG** ⇒ ⭐ `1590 − 340 − 16 = **1234**` ✅ khớp số đo ✓ |
| **IMPACT** | ⭐ ✅ `page.tsx`: ⭐ **+1 prop** ⇒ ⭐ nút «Lưu phân công» hoạt động ⭐ + ⭐ **sửa luôn lỗi tiềm ẩn** nút «🗑 Xóa kho» (`action` nay ⛔ không còn `undefined`) ✓<br>⭐ ✅ `globals.css`: ⭐ ⛔ **hết lệch** trên tab XUẤT-NHẬP + CẤP PHÁT-HOÀN TRẢ ⭐ ⚠️ **neo `.approved-inventory-screen`** ⇒ ⛔ **không ảnh hưởng màn khác** ✓ |
| **COMPATIBILITY** | ⭐ ✅ tương thích ngược — ⛔ không đổi API · ⛔ không đổi dữ liệu · ⛔ không đổi quyền ✓ |
| ⭐⭐ **TEST** | ⭐ `tsc EXIT=0` ✅ ⭐ **hồi quy `865 tests · 864 pass · 0 fail`** ✅ ⭐ `BUILD_EXIT=0` · ⭐ `BUILT ARTIFACT VALIDATION: ĐẠT` ✅ ⭐ đo UI: lệch **1590 = 1590** (trước 1234) ✅ |
| **STATUS** | ⭐⭐ **CODE FIXED + TEST PASS** ⭐⭐ — ⚠️ **CHƯA COMMIT** (⭐ user yêu cầu **revert 3 commit** ⇒ ⛔ em ⛔ **không tự commit nữa** ✓) |
| **RELATED** | ⭐ `BUG-20261007-017` · `HANDOFF-20261007-008` · `TASK-230` ✓ |

## ⭐⭐ CHG-20261007-008 — CARD KHO CAO ĐỀU + XOÁ 10 LABEL KỸ THUẬT THỪA (yêu cầu user) ⭐⭐
| ⭐ | ⭐ |
|---|---|
| **SESSION** | ⭐ `ERP-SESSION-02` · **TASK** `TASK-231` · **CATEGORY** `UI_UX` ✓ |
| ⭐⭐ **YÊU CẦU USER (nguyên văn)** | ⭐⭐ «*sửa lại dashboard tồn kho các card đang ở trạng thái **kích thước khác nhau** và **hiển thị không đồng đều**, ngoài ra hãy **loại bỏ các đoạn label thừa** đi*» ⭐⭐ ✓ |
| ⭐⭐⭐ **ĐO TRƯỚC (§16 — ⛔ không đoán)** | ⭐ `chieuCao: { "**202**": 2, "**222**": 10 }` ⇒ ⭐⭐ **LỆCH 20px** ⭐⭐ ⚠️ · ⭐ `chieuRong: { "298": 12 }` (⭐ bề rộng ⛔ KHÔNG lệch ✓)<br>⭐ **NGUYÊN NHÂN GỐC**: ⭐ 2 thẻ **thiếu 1 dòng** «**Dự án:** …» ⚠️ — ⭐ vì kho `transit` (⭐ «Hàng đang vận chuyển») ⛔ **không thuộc dự án** ✓<br>⭐ ⚠️ **PHÁT HIỆN PHỤ**: ⭐ **card KHO ⛔ KHÔNG phải chỗ lệch** — ⭐ 12 thẻ kho ⛔ vẫn đều; ⭐ chỗ lệch là **card trong DASHBOARD TỒN KHO** ⚠️ (⭐ đúng như user nói «*dashboard tồn kho các card*» ✓) ✓ |
| ⭐ **BEFORE → AFTER** | ⭐ **`app/globals.css`**: ⭐ `.approved-inventory-screen .warehouse-card{…}` ⇒ ⭐⭐ **+`min-height:222px`** ⭐⭐ (⭐ đúng bằng max đo được ✓) ✅<br>⭐ **XOÁ 10 đoạn label** ⚠️: ⭐ `WarehouseDashboard.tsx` — ⭐ ① «*Nguồn 8 chỉ số: … → `inventory[]`; nhập → `receipts[].acceptedQty`…*» ② «*Nguồn: `warehouses[]` (id · code · name · type · projectId · projectCode) ghép `inventory[].warehouseId`*» ③ «*Mọi số tính TRỰC TIẾP từ dữ liệu đang có trong payload — không gọi API mới*» ④ «*(W-02 đã xác nhận quan hệ Project : Warehouse là 1:N)*» ⑤ «*Chỉ tính dòng CÓ cấu hình mức tối thiểu (minStock > 0)…*» ⭐ · ⭐ `Inventory.tsx` — ⭐ ⑥ «*Nguồn: `data.inventory` lọc theo `warehouseId`…*» ⑦ «*Nguồn: `data.userWarehouseScopes`… ⚠️ Bản cũ lọc `staffDirectory.warehouseId`…*» ⑧ «*Danh sách kho trong phạm vi dự án bạn được phân quyền. Bấm một thẻ để xem thủ kho, lịch sử…*» (**305 → 37 ký tự**) ⑨ «*Theo dõi tồn theo đúng dự án/kho được phân quyền; điều chuyển phải có xác nhận kho đích*» ⑩ chú thích thẻ «*Bấm để mở chi tiết kho · N vật tư*» ⇒ «*N vật tư · bấm để mở*» ✓ |
| ⭐⭐ **TEST — ĐO LẠI (§24)** | ⭐⭐ **① CARD ĐỀU**: ⭐ `chieuCao: { "**222**": 12 }` ⭐ + ⭐ `chieuRong: { "**298**": 12 }` ⭐ ⇒ ⭐⭐ **LỆCH = 0px** ⭐⭐ ✅ (⭐ trước ⚠️ lệch **20px** ✓)<br>⭐ **② 6/6 label kỹ thuật ĐÃ XOÁ**: ⭐ kiểm bằng `document.body.innerText.includes(…)` ⇒ ⭐ **tất cả `false`** ✅<br>⭐ **③ note còn lại SẠCH**: ⭐ «*Tồn kho theo phạm vi bạn được phân quyền.*» · ⭐ «*Phạm vi: Tất cả dự án được phân quyền · 12 kho · 1185 dòng tồn.*» · ⭐ «*12 kho trong phạm vi được phân quyền.*» · ⭐ «*Chỉ tính vật tư đã đặt mức tồn tối thiểu.*» · ⭐ «*Bấm một thẻ để mở chi tiết kho.*» ⭐ ⛔ **hết thuật ngữ CSDL** ✅ |
| **REGRESSION** | ⭐ `tsc EXIT=0` ✅ ⭐ `npm test` ⇒ **xem kết quả bên dưới** ⭐ `BUILD_EXIT=0` · ⭐ `BUILT ARTIFACT VALIDATION: ĐẠT` ✅ ⭐ ⚠️ **giữ đúng dấu `/* VNTECH_MASTER_BASELINE_CSS_R1_1_1_END */`** ở cuối `globals.css` ✅ (⭐ test `project-navigation-consolidation.test.mjs:65` ✓) ✓ |
| ⭐ **TỆP SỬA** | ⭐ `app/globals.css` (**dùng chung** ⚠️) · ⭐ `app/screens/WarehouseDashboard.tsx` ⭐ `app/screens/Inventory.tsx` — ⭐ **đều thuộc phiên 02** ✅ (⭐ trừ `globals.css` — ⭐ đã có phép của user ✓) ✓ |
| **STATUS** | ⭐⭐ **CODE FIXED + TEST PASS** ⭐⭐ ⚠️ **CHƯA COMMIT** (⭐ user yêu cầu ⛔ phiên 02 không tự commit ✓) |
| **RELATED** | ⭐ `TEST-20261007-037` · `TASK-231` ✓ |

## ⭐⭐ CHG-20261007-009 — GIẢI THÍCH RÕ 2 «ĐỐI CHỨNG NGUỒN» CHO NGƯỜI DÙNG (theo luật user) ⭐⭐
| ⭐ | ⭐ |
|---|---|
| **SESSION** | ⭐ `ERP-SESSION-02` · **TASK** `TASK-231c` · **CATEGORY** `UI_UX` ✓ |
| ⭐⭐ **LUẬT USER (nguyên văn)** | ⭐⭐ «*nếu **đối chứng nguồn** chỉ có tác dụng để **dev check** thì **xóa đi**, còn **không thì giải thích rõ ràng ra***» ⭐⭐ ✓ |
| ⭐⭐⭐ **PHÂN TÍCH — 2 ĐOẠN NÀY PHỤC VỤ AI?** | ⭐⭐ **KẾT LUẬN: PHỤC VỤ **NGƯỜI DÙNG** ⭐⭐ ⛔ **KHÔNG phải chỉ để dev check** ⇒ ⭐ theo luật user: **GIẢI THÍCH RÕ RÀNG RA** (⛔ không xoá) ✅<br>⭐ **LÝ DO (⭐ đo từ mã)**: ⭐ ① `INVENTORY_VALUE_NO_SOURCE_NOTE` ⭐ hiện ở **`note` của ô KPI «Giá trị kho»** (⭐ `WarehouseDashboard.tsx:142` ✓) ⭐ — ⭐ người dùng **nhìn thấy «chưa có nguồn» ở ô TIỀN** ⚠️ ⭐ ⇒ ⭐ **CẦN biết VÌ SAO** ⛔ không phải «dev check» ✅<br>⭐ ② `metrics.lowStockSource` ⭐ hiện ở **dòng empty-state** (⭐ `:235` ✓) ⭐ — ⭐ người dùng thấy «*Không có dòng nào…*» ⚠️ ⭐ ⇒ ⭐ **CẦN biết ĐÃ KIỂM BAO NHIÊU** ✓ |
| ⭐ **BEFORE → AFTER** | ⭐ **(a) «Giá trị kho»**: ⭐ TỪ «*Giá vốn thật chỉ có ở stock_movements.unit_cost, nhưng **payload bootstrap KHÔNG trả khoá stockMovements** (và mọi dòng stock_movements.unit_cost trên **CSDL** hiện đang = 0…)» ⚠️ ⭐ ⇒ ⭐ THÀNH ⭐⭐ «***Chưa tính được giá trị kho: sổ giá vốn (bảng stock_movements) chưa được nạp vào dữ liệu, nên hệ thống để trống thay vì hiện một con số không đúng.***» ⭐⭐ ✅<br>⭐ **(b) empty-state**: ⭐ TỪ «*Không có dòng nào dưới mức tồn tối thiểu (**`inventory[].minStock` · 1185/1185 dòng có giá trị**)*» ⚠️ ⭐ ⇒ ⭐ THÀNH ⭐⭐ «***Không có dòng nào dưới mức tồn tối thiểu (đã kiểm 1185 dòng tồn trong phạm vi).***» ⭐⭐ ✅ |
| ⭐⭐ **RÀNG BUỘC TEST — ⚠️ PHẢI GIỮ CHỮ `stock_movements`** | ⭐ `tests/w04-inventory-dashboard.test.mjs:136`: ⭐ `assert.ok(m.value.note.includes("**stock_movements**"), "Lý do phải nêu nguồn bị thiếu: stock_movements.unit_cost")` ⚠️ ⇒ ⭐ **câu mới VẪN giữ `stock_movements`** (⭐ nhưng nay nằm trong **câu tiếng Việt người dùng đọc được** ✓) ⭐ ⭐ **+ `W-04` vẫn PASS 6/6** ✅ |
| **IMPACT** | ⭐ ⛔ không đổi hành vi · ⭐ ⛔ không đổi dữ liệu · ⭐ chỉ **đổi câu chữ** ⭐ ⭐ ⚠️ **vẫn giữ đủ thuộc tính `data-inventory-source`** (⭐ test `w04:170` đòi ✓) ✅ |
| **TEST** | ⭐ `npx tsx tests/w04-inventory-dashboard.test.mjs` ⇒ ⭐ **`pass 6 · fail 0`** ✅ ⭐ ⭐ **hồi quy toàn bộ: `866 tests · 865 pass · 0 fail`** ✅ ⭐ `tsc EXIT=0` ✅ ⭐ `BUILD_EXIT=0` ✅ ⭐ **quét lại**: ⭐ tab «XUẤT & NHẬP» `[]` · ⭐ tab «CẤP PHÁT» `[]` · ⭐ 4 tab chi tiết `[]` — **SẠCH** ✅ |
| **STATUS** | ⭐⭐ **CODE FIXED + TEST PASS** ⭐⭐ ⛔ **CHƯA COMMIT** (⭐ user chốt «**không commit**» ✓) |
| **RELATED** | ⭐ `CHG-20261007-008` · `TASK-231` ✓ |

## ⭐⭐ CHG-20261007-010 — VIỆT HOÁ 11 CHUỖI NGUỒN TRONG KHỐI «GIẢI THÍCH CHỈ SỐ» ⭐⭐
| ⭐ | ⭐ |
|---|---|
| **SESSION / TASK / CATEGORY** | ⭐ `ERP-SESSION-02` · ⭐ `TASK-231d` · ⭐ `UI_UX` ✓ |
| ⭐⭐ **CĂN CỨ** | ⭐ **Luật user ④**: ⭐ «*nếu **đối chứng nguồn** chỉ có tác dụng để **dev check** thì **xóa đi**, **còn không thì giải thích rõ ràng ra***» ⭐ ⇒ ⭐ em **ĐO** thấy khi mở khối «Giải thích chỉ số» ⚠️ ⭐ hiện cho user **ký hiệu kỹ thuật** ⇒ ⭐ **GIẢI THÍCH RÕ RÀNG RA** ✅ |
| ⭐ **BEFORE → AFTER (⭐ 11 chuỗi)** | ⭐ `label` của 7 chỉ số: ⭐ «`inventory[].balance`» ⇒ «**Số lượng tồn thực tế trong kho**» ⭐ · «`inventory[].available`» ⇒ «**Tồn khả dụng (đã trừ phần giữ chỗ)**» ⭐ · «`inventory[].reserved`» ⇒ «**Số lượng đang bị giữ cho phiếu đề nghị**» ⭐ · «`receipts[].acceptedQty`» ⇒ «**Số lượng đã nhận trên phiếu nhập**» ⭐ · «`issues[].totalQty`» ⇒ «**Số lượng đã xuất trên phiếu xuất**» ⭐ · «`transferOrders[].status`» ⇒ «**Trạng thái phiếu điều chuyển**» ⭐ · «`inventory[].minStock`» ⇒ «**Mức tồn tối thiểu đã đặt của vật tư**» ✅<br>⭐ + ⭐ 4 chuỗi trạng thái: ⭐ «*`payload` KHÔNG trả khoá `stockMovements`*» ⇒ «**chưa có dữ liệu giá vốn**» ⭐ · «*`materials.standardPrice` rỗng/không dòng tồn nào có giá*» ⇒ «**chưa có giá chuẩn trong danh mục vật tư**» ⭐ · «*0 dòng trong phạm vi*» ⇒ «**chưa có dòng nào trong phạm vi**» ⭐ · «*rỗng trong `payload`*» ⇒ «**dữ liệu còn trống**» ✅ |
| ⚠️⚠️ **RÀNG BUỘC — GIỮ NHÃN CHUẨN** | ⭐ Giữ **nguyên** `${INVENTORY_NO_SOURCE}` («**chưa có nguồn**») ⛔ **KHÔNG xoá** ⚠️ — ⭐ vì ⭐ `w04:127` chốt `assert.equal(INVENTORY_NO_SOURCE, "chưa có nguồn")` ⭐ + ⭐ `w04:134/149/153` đòi 3 nguồn **phải chứa nhãn đó** ⛔ (⭐ xem `BUG-20261008-019` ✓) ✓ |
| **IMPACT** | ⭐ ⛔ không đổi hành vi · ⛔ không đổi dữ liệu · ⭐ ⛔ không đổi **giá trị** — ⭐ chỉ **đổi CÁCH GỌI NGUỒN** cho người dùng hiểu ✅ |
| ⭐ **GHI NHẬN (⭐ trả lời «có phải chỉ dev check»)** | ⭐ «**bootstrap :651/661/671/673**» (⭐ số dòng mã nguồn ✓) ⭐ **⛔ KHÔNG BAO GIỜ hiện trên màn hình** ⚠️ (⭐ đo trước + sau khi mở khối giải thích ⇒ `false` ✓) ⇒ ⭐ đó là **metadata trong mã**, ⛔ không phải nhãn UI ⇒ ⭐ **luật user ⛔ không áp dụng**, ⛔ **không xoá** ✅ |
| **TEST** | ⭐ `W-04` **PASS 6/6** ✅ ⭐ hồi quy **`866 · 865 pass · 0 fail`** ✅ ⭐ `tsc=0` · ⭐ `BUILD ĐẠT` ✅ |
| **STATUS** | ⭐⭐ **CODE FIXED + TEST PASS** ⭐⭐ ⛔ **CHƯA COMMIT** (⭐ theo lệnh user ✓) |
| **RELATED** | ⭐ `BUG-20261008-019` · `CHG-20261007-009` · `TEST-20261007-040` ✓ |

## ⭐ CHG-20261007-011 — VIỆT HOÁ NỐT 2 CHUỖI KỸ THUẬT + XÁC MINH 2 CHIỀU ⭐
| ⭐ | ⭐ |
|---|---|
| **SESSION / TASK / CATEGORY** | ⭐ `ERP-SESSION-02` · ⭐ `TASK-231e` · ⭐ `UI_UX` ✓ |
| **BEFORE → AFTER** | ⭐ ① ⭐ `standardPriceSource` (`:146`): ⭐ «*`materials.standardPrice × inventory[].balance` · N/M dòng có giá*» ⇒ ⭐ «*Giá chuẩn trong danh mục vật tư (**materials**) nhân với số lượng tồn · N/M dòng có giá*» ✅<br>⭐ ② ⭐ note CardHead (`:243`): ⭐ «*…phân biệt «0 dòng» với «cột rỗng trong **payload**»…*» ⇒ ⭐ «*…phân biệt «không có dòng nào» với «cột chưa có dữ liệu»…*» ✅ |
| ⚠️ **RÀNG BUỘC** | ⭐ ① ⭐ **GIỮ từ khoá `materials`** ⛔ — ⭐ `w04:**144**`: ⭐ `assert.ok(m.value.standardPriceSource.includes("materials"), "Nguồn giá chuẩn phải nêu `materials.standardPrice`")` ✅ |
| **TEST** | ⭐ `W-04` **PASS 6/6** ✅ ⭐ hồi quy **`866 · 865 pass · 0 fail`** ✅ ⭐ `tsc=0` · ⭐ `BUILD ĐẠT` ✅ ⭐ ⭐ **XÁC MINH 2 CHIỀU**: ⭐ 8/8 nhãn Việt **`true`** ✅ ⭐ **8/8 ký hiệu kỹ thuật `false`** ✅ |
| **STATUS** | ⭐⭐ **CODE FIXED + TEST PASS** ⭐⭐ ⛔ **CHƯA COMMIT** ✓ |
| **RELATED** | ⭐ `TEST-20261007-041` · `CHG-20261007-010` ✓ |

## ⭐⭐⭐ CHG-20261008-012 — BỎ «Ý KIẾN ĐIỀU CHỈNH» + «ĐÃ DUYỆT/ĐỀ XUẤT» (user chốt «C») ⭐⭐⭐
| ⭐ | ⭐ |
|---|---|
| **SESSION / TASK / CATEGORY** | ⭐ `ERP-SESSION-02` · ⭐ **`TASK-232`** · ⭐ `UI_UX` ✓ |
| ⭐⭐⭐ **QUYẾT ĐỊNH USER (⭐ nguyên văn)** | ⭐⭐ «***C đi** mặc dù cột trạng thái **không cần thiết hiển thị đã duyệt** bởi vì khi cấu hình nhóm con thì **kế toán đã kiểm tra rất kỹ rồi** và **không cần ai duyệt** bởi vì **chỉ là đưa nhóm con từ danh mục vật tư gốc (file excel của công ty đang sử dụng) lên hệ thống***» ⭐⭐ ✓ |
| ⭐⭐ **LÝ DO NGHIỆP VỤ (⭐ ghi lại để sau ⛔ không hiểu nhầm)** | ⭐ Nhóm con ⛔ **KHÔNG phải dữ liệu cần duyệt** ⭐ — ⭐ nó chỉ là **bản sao nhóm từ file Excel danh mục vật tư gốc mà công ty ĐANG DÙNG** ⭐ ⇒ ⭐ **kế toán đã kiểm kỹ ở khâu Excel** ⭐ ⇒ ⭐ ⛔ **hệ thống ⛔ không cần bước duyệt nào** ✅ |
| ⭐⭐ **BEFORE → AFTER (⭐ 4 chỗ, `app/page.tsx`)** | ⭐ ① ⭐ **BỎ CỘT** `**<th>Ý kiến điều chỉnh</th>**` ⚠️ ⭐ (⭐ vì luôn trống — ⭐ `adjustmentNote` ⛔ không ai ghi ✓)<br>⭐ ② ⭐ **Ô «Trạng thái»** ⭐ TỪ ⭐ `Number(active)===0?"Đã ẩn":String(reviewStatus\|\|"proposed")==="approved"?"**Đã duyệt**":"**Đề xuất**"` ⚠️ ⭐ ⇒ ⭐ THÀNH ⭐⭐ `Number(active)===0?"Đã ẩn":"**Đang dùng**"` ⭐⭐ ✅<br>⭐ ③ ⭐ **BỎ KPI «Chờ duyệt»** ⭐ — ⭐ vì `review_status` ⛔ không được ghi ⇒ chỉ số **luôn vô nghĩa** ⚠️ ⭐ + ⭐ bỏ hằng `proposed` ✓<br>⭐ ④ ⭐ **Nhãn bộ lọc** ⭐ «*Đang dùng / **đề xuất***» ⇒ ⭐ «***Đang dùng***» ✅ |
| 🔒 **GIỮ NGUYÊN (⭐ quan trọng)** | ⭐ ⛔ **KHÔNG xoá dữ liệu** ⚠️ — ⭐ 2 cột CSDL ⭐ `review_status` ⭐ + ⭐ `adjustment_note` ⭐ **VẪN CÒN** ⭐ ⭐ chỉ ⛔ **không hiển thị** ✅ ⭐ (⭐ user chọn C = «giữ cột nhưng ⛔ không gây hiểu nhầm» ✓) ✓ |
| ⭐⭐ **KIỂM TEST TRƯỚC KHI SỬA (§22)** | ⭐ `grep` 8 mẫu trong `tests/` ⇒ ⭐ ⭐ `Ý kiến điều chỉnh` = **0** ⭐ `reviewStatus` = **0** ⭐ `adjustmentNote` = **0** ⭐ `material-subgroup` = **0** ✅ ⇒ ⭐ **an toàn** ✓ ⭐ (⭐ «Đã duyệt»/«Đề xuất»/«proposed» ⭐ có trong test nhưng thuộc **tính năng KHÁC** — ⭐ ⛔ không liên quan bảng này ✓) ✓ |
| ⭐⭐⭐ **ĐO THẬT TRÊN UI (`:9000`) — ⭐ ĐÃ VÀO ĐÚNG MÀN** | ⭐ ⚠️ **LẦN ĐO 1 SAI**: probe bấm `.nav-child` tên «Danh mục vật tư» ⇒ ⭐ **`KHONG_THAY`** ⚠️ ⇒ ⭐ **4 chữ `false` ⛔ KHÔNG có giá trị** (⭐ chưa vào màn ✓) ⭐ ⭐ **EM ⛔ ĐÃ KHÔNG báo «thành công»** dựa trên số đó ✅<br>⭐ **NGUYÊN NHÂN**: ⭐ mục menu thật là ⭐⭐ «**DANH MỤC VẬT TƯ GỐC**» ⭐⭐ và là ⭐ **`.nav-parent` (cấp 1)** ⚠️ ⭐ ⛔ không phải `.nav-child` ✓<br>⭐⭐ **LẦN ĐO 2 (⭐ ĐÚNG)**: ⭐ `ĐÃ VÀO MÀN = true` ✅ ⇒ ⭐ «Ý kiến điều chỉnh» **`false`** ✅ ⭐ «Đã duyệt» **`false`** ✅ ⭐ «Đề xuất» **`false`** ✅ ⭐ «Chờ duyệt» **`false`** ✅<br>⭐ **HEADER bảng (⭐ 8 cột, trước 9)**: ⭐ `["", "Mã hệ", "Tên hệ M&E", "Mã nhóm con", "Tên nhóm vật tư", "Phạm vi / ví dụ gồm", "Trạng thái", "Thao tác"]` ✅<br>⭐ **Trạng thái từng dòng**: ⭐ «**Đang dùng**» ✅ (⭐ ⛔ không còn «Đã duyệt/Đề xuất» ✓) ⭐ `soCot = 8` ✅ ✓ |
| **REGRESSION** | ⭐ `tsc EXIT=0` ✅ ⭐⭐ **`866 tests · 865 pass · 0 fail`** ⭐⭐ ✅ ⭐ `BUILD_EXIT=0` · ⭐ `BUILT ARTIFACT VALIDATION: ĐẠT` ✅ |
| **STATUS** | ⭐⭐⭐ **CODE FIXED + TEST PASS + VERIFIED** ⭐⭐⭐ ⛔ **CHƯA COMMIT** (⭐ theo lệnh user ✓) |
| ⭐⭐ **BÀI HỌC (§33) — ⭐ «KIỂM ĐÃ VÀO ĐÚNG MÀN CHƯA»** | ⭐⭐ **TRƯỚC khi đọc kết quả đo ⇒ PHẢI kiểm probe ĐÃ VÀO ĐÚNG MÀN** ⭐⭐ ⚠️ ⭐ ⭐ **VÌ SAO**: ⭐ nếu chưa vào màn ⭐ thì **mọi chữ đều `false`** ⚠️ ⇒ ⭐ **dễ báo «đã xoá thành công» trong khi ⛔ chưa hề kiểm gì** ⭐⭐ ⭐ ⭐ **CÁCH LÀM ĐÚNG**: ⭐ thêm 1 phép kiểm **«đã vào màn chưa»** (⭐ `!!document.querySelector(<phần tử đặc trưng của màn>)` ✓) ⭐ và ⭐ **nếu `false` ⇒ KẾT QUẢ ĐO VÔ GIÁ TRỊ** ⛔ ⭐ ⭐ **+ ⭐ LUÔN `grep`/liệt kê TÊN THẬT của menu** trước khi bấm (⭐ ⛔ không đoán tên ✓) ✓ |
| **RELATED** | ⭐ `BUG-20261008-020` · `DEC-20261008-012` · `TEST-20261007-042` ✓ |

## ⭐⭐ CHG-20261008-013 — THÊM 2 HÀM SINH MÃ KHO & TÊN KHO THEO QUY TẮC USER ⭐⭐
| ⭐ | ⭐ |
|---|---|
| **SESSION / TASK / CATEGORY** | ⭐ `ERP-SESSION-02` · ⭐ `TASK-234` · ⭐ `FRONTEND` ✓ |
| ⭐⭐ **BEFORE → AFTER** | ⭐ `lib/warehouse-hub.ts` ⭐: ⭐ **THÊM** ⭐ `WAREHOUSE_CODE_PREFIX = "KD-"` ⭐ + ⭐ `nextWarehouseCode(existingCodes): string` ⭐ + ⭐ `projectWarehouseName(projectName): string` ⭐ — ⭐ ⛔ **không sửa hàm nào có sẵn** (⭐ thuần THÊM ✓) ✅ |
| ⭐⭐ **REASON** | ⭐ **USER CHỐT** (`DEC-20261008-013`): ⭐ mã kho = **`KD-xxx`** (⛔ không trùng) ⭐ + ⭐ tên kho dự án = **`KHO <tên dự án>`** ✅ |
| **FILES** | ⭐ `lib/warehouse-hub.ts` ⭐ + ⭐ `tests/task-234-warehouse-code-name.test.mjs` (⭐ mới ✓) ✓ |
| **IMPACT** | ⭐ ✅ **thuần THÊM** ⇒ ⭐ ⛔ không ảnh hưởng mã có sẵn ⭐ ⭐ ⚠️ **CHƯA NỐI vào UI** ⚠️ — ⭐ vì UI cần **modal `warehouse`** (`page.tsx` ⭐ **thuộc S01** ✓) ⭐ ⇒ ⭐ `HANDOFF-20261008-009` ✅ |
| **COMPATIBILITY** | ⭐ ✅ tương thích ngược ⭐ — ⭐ ⛔ không đổi API · ⛔ không đổi CSDL · ⛔ không đổi quyền ✓ |
| **TEST** | ⭐ `pass 7 · fail 0` ✅ ⭐ **`878 · 877 pass · 0 fail`** ✅ ⭐ `tsc=0` ✅ |
| **STATUS** | ⭐⭐ **CODE COMPLETE + TEST PASS** ⭐⭐ ⚠️ **chờ nối UI** (⭐ S01 ✓) ⛔ **CHƯA COMMIT** ✓ |

## ⭐⭐⭐ CHG-20261008-014 — DỰNG MODAL «TẠO/SỬA KHO» ĐỂ S01 NỐI ⭐⭐⭐
| ⭐ | ⭐ |
|---|---|
| **SESSION / TASK / CATEGORY** | ⭐ `ERP-SESSION-02` · ⭐ `TASK-235` · ⭐ `FRONTEND` ✓ |
| ⭐⭐ **BEFORE → AFTER** | ⭐ **THÊM MỚI** ⭐ `app/screens/WarehouseFormModal.tsx` ⭐ ⚠️ (⭐ ⛔ **không sửa tệp nào có sẵn** ✓) ✅ |
| ⭐⭐ **REASON** | ⭐ ⭐⭐ **GỠ CHỐT THEO §17 «SHARED COMPONENT»** ⭐⭐ ⭐ — ⭐ nút «＋ Tạo kho»/«✎ Sửa» cần `open("warehouse")` ⭐ nhưng `page.tsx` ⛔ **không có modal tên đó** ⚠️ ⭐ và `page.tsx` **thuộc `ERP-SESSION-01`** ⚠️ ⭐ ⇒ ⭐ **phiên 02 dựng component dùng chung** ⇒ ⭐ S01 chỉ **import + thêm 1 case modal** ✅ |
| ⭐ **NỘI DUNG** | ⭐ Dùng ⭐ `BaseModal` ⭐ từ ⭐ `@/lib/ui-blocks` ⭐ (**đúng mẫu có sẵn** ✓) ⭐ + ⭐ 3 ô: ⭐ Dự án · ⭐ Mã kho (⭐ tự sinh `KD-xxx` ✓) · ⭐ Tên kho (⭐ tự đặt `KHO <dự án>` ✓) ⭐ + ⭐ kiểm dữ liệu bằng 4 hàm ở `TASK-234` ⭐ + ⭐ 2 cờ quyền `canEdit`/`canEditCode` ⭐ + ⛔ **KHÔNG có xoá kho** (⭐ quy tắc ③ ✓) ✅ |
| **FILES** | ⭐ `app/screens/WarehouseFormModal.tsx` (⭐ mới ✓) ⭐ + ⭐ `tests/task-235-warehouse-form-modal.test.mjs` (⭐ mới ✓) ✓ |
| **IMPACT** | ⭐ ✅ **thuần THÊM** ⇒ ⛔ không ảnh hưởng mã có sẵn ⭐ ⚠️ **CHƯA có tác dụng trên UI** ⚠️ — ⭐ vì chưa nối `page.tsx` (⭐ S01 ✓) ⭐ ⚠️ **và cần API `save_warehouse`** (⭐ ⛔ backend chưa có ✓) ✅ |
| **COMPATIBILITY** | ⭐ ✅ tương thích ngược ⭐ — ⛔ không đổi API · ⛔ không đổi CSDL · ⛔ không đổi quyền ✓ |
| **TEST** | ⭐ `TASK-235` **6/6 PASS** ✅ ⭐ `TASK-234` **13/13** ✅ ⭐ **`901 · 900 pass · 0 fail`** ✅ ⭐ `tsc=0` · ⭐ lint **0 errors** ✅ |
| **STATUS** | ⭐⭐ **CODE COMPLETE + TEST PASS** ⭐⭐ ⏳ **chờ S01 nối** ⛔ **CHƯA COMMIT** ✓ |

## ⭐⭐⭐ CHG-20261008-015 — LOGIC «GIỮ CHỖ KHI PHIẾU ĐANG XỬ LÝ» (quy tắc ④) ⭐⭐⭐
| ⭐ | ⭐ |
|---|---|
| **SESSION / TASK / CATEGORY** | ⭐ `ERP-SESSION-02` · ⭐ `TASK-236` · ⭐ `FRONTEND` (⭐ logic thuần ✓) ✓ |
| ⭐⭐ **BEFORE → AFTER** | ⭐ `lib/warehouse-hub.ts` ⭐: ⭐ **THÊM** ⭐ `availableToIssue()` ⭐ · ⭐ `validateIssueQuantity()` ⭐ · ⭐ `ISSUE_DONE_STATUS` ⭐ · ⭐ `ISSUE_PENDING_STATUSES` ⭐ · ⭐ `canChangeStockOnIssue()` ⭐ · ⭐ `isIssueHoldingStock()` ⭐ — ⭐ ⛔ **không sửa hàm có sẵn** ✅ |
| ⭐⭐ **REASON** | ⭐ **USER CHỐT quy tắc ④**: ⭐ chỉ phiếu **`hoàn thành`** mới đổi tồn kho ⭐ + ⭐ khi **tạo/chờ duyệt** thì số lượng ở **trạng thái ĐANG XỬ LÝ** ⭐ ⇒ ⭐ ⛔ **user khác không xuất quá phần còn lại** ⭐ — ⭐ ví dụ user: ⭐ **100 − 70 = 30** ✅ |
| **FILES** | ⭐ `lib/warehouse-hub.ts` ⭐ + ⭐ `tests/task-236-issue-reservation.test.mjs` (⭐ mới ✓) ✓ |
| **IMPACT** | ⭐ ✅ **thuần THÊM** ⭐ ⚠️ **CHƯA NỐI vào UI/API** ⚠️ — ⭐ vì cần **backend ghi `stock_reservations` cho phiếu xuất** (⭐ `HANDOFF-20261008-009` ⭐ **S01** ✓) ✅ |
| **COMPATIBILITY** | ⭐ ✅ tương thích ngược ⭐ — ⛔ không đổi CSDL · ⛔ không đổi quyền · ⛔ không đổi API ✓ |
| **TEST** | ⭐ **7/7 PASS** ⭐ — ⭐ **có ca dùng ĐÚNG ví dụ nguyên văn của user** (⭐ 100−70=30 ✓) ✅ |
| **STATUS** | ⭐⭐ **CODE COMPLETE + TEST PASS** ⭐⭐ ⏳ **chờ nối backend** ⛔ **CHƯA COMMIT** ✓ |

## ⭐⭐⭐ CHG-20261008-016 — LOGIC «DỰ ÁN NGỪNG ⇒ HỎI NGỪNG KHO» (quy tắc ③) ⭐⭐⭐
| ⭐ | ⭐ |
|---|---|
| **SESSION / TASK / CATEGORY** | ⭐ `ERP-SESSION-02` · ⭐ `TASK-237` · ⭐ `FRONTEND` (⭐ logic thuần ✓) ✓ |
| ⭐⭐ **BEFORE → AFTER** | ⭐ `lib/warehouse-hub.ts` ⭐: ⭐ **THÊM** ⭐ `projectDeactivationPrompt()` ⭐ · ⭐ `ALLOW_DELETE_WAREHOUSE` ⭐ · ⭐ `WAREHOUSE_DEACTIVATE_ACTIONS` ⭐ · ⭐ `WAREHOUSE_DEACTIVATE_LABELS` ⭐ — ⭐ ⛔ **không sửa hàm có sẵn** ✅ |
| ⭐⭐ **REASON** | ⭐ **USER CHỐT quy tắc ③**: ⭐ ⛔ **không xoá kho** ⭐ ⇒ ⭐ chỉ **ẩn** / **ngừng hoạt động** ⭐ + ⭐ **khi DỰ ÁN ngừng thì HỎI user** ⭐ — ⭐ «*không thì **kệ**, có thì **ngừng***» ⭐ ⇒ ⭐ **hệ thống ⛔ KHÔNG tự ngừng** ✅ |
| **FILES** | ⭐ `lib/warehouse-hub.ts` ⭐ + ⭐ `tests/task-237-project-deactivation.test.mjs` (⭐ mới ✓) ✓ |
| **IMPACT** | ⭐ ✅ **thuần THÊM** ⭐ ⚠️ **CHƯA NỐI vào UI** ⚠️ — ⭐ cần **màn «Ngừng dự án»** (⭐ thuộc **S03** ✓) ⭐ + ⭐ **API đổi trạng thái kho** (⭐ **S01** ✓) ✅ |
| **COMPATIBILITY** | ⭐ ✅ tương thích ngược ⭐ — ⛔ không đổi CSDL · ⛔ không đổi quyền · ⛔ không đổi API ✓ |
| **TEST** | ⭐ **7/7 PASS** ⭐ ✅ |
| **STATUS** | ⭐⭐ **CODE COMPLETE + TEST PASS** ⭐⭐ ⏳ **chờ nối UI** ⛔ **CHƯA COMMIT** ✓ |

## ⭐⭐⭐ CHG-20261008-017 — **BẬT 3 NÚT KHO + ĐỔI «🗑 Xóa» ⇒ «⏹ Ngừng hoạt động»** ⭐⭐⭐
| ⭐ | ⭐ |
|---|---|
| **SESSION / TASK / CATEGORY** | ⭐ `ERP-SESSION-02` · ⭐ `TASK-240` · ⭐ `UI_UX` ✓ |
| ⭐⭐⭐ **ĐIỀU KIỆN ĐÃ ĐỦ (⭐ `ERP-SESSION-01` ĐÃ THI HÀNH `HANDOFF-20261008-009`)** | ⭐ Đo được: ⭐ `ActionRbacRegistry.java:**281**` ⭐ `save_warehouse → ["inventory","central_warehouse"]` ⭐ + ⭐ `:282` ⭐ `set_warehouse_status` ⭐ + ⭐ `:533/534` ⭐ cờ `canEdit` ⭐ + ⭐ `AdminSystemUseCase.java:**317**` ⭐ «*⭐ `save_warehouse` — **HANDOFF-20261008-009 (yêu cầu `ERP-SESSION-02`, phiên 01 thi hành)** — TẠO/SỬA KHO*» ⭐ + ⭐ `:**362**` ⭐ `set_warehouse_status` ⭐ + ⭐ `app/page.tsx:**801**` ⭐ `{modal === "warehouse" && <WarehouseFormModal …` ✅ ⭐ ⭐ **⇒ S01 ĐÃ ĐỌC HANDOFF VÀ THI HÀNH ĐÚNG** ✅ |
| ⭐⭐ **BEFORE → AFTER (⭐ `app/screens/Inventory.tsx` — tệp của phiên 02)** | ⭐ ① ⭐ **«＋ Tạo kho»** ⭐: ⭐ `disabled title="TẠM KHOÁ…"` ⇒ ⭐ **BẬT** `data-vntech="open-warehouse"` ✅<br>⭐ ② ⭐ **«✎ Sửa»** ⭐: ⭐ `disabled` trần ⇒ ⭐ `disabled={!selectedWhId}` ⭐ (⭐ chỉ khoá khi **chưa chọn kho** ⭐ = **đúng thiết kế** ✓) ⭐ `data-vntech="edit-warehouse"` ✅<br>⭐ ③ ⭐⭐ **«🗑 Xóa» ⇒ «⏹ Ngừng hoạt động»** ⭐⭐ ⚠️: ⭐ ⛔ **BỎ `action("delete_warehouse")`** ⭐ (⭐ action ⛔ không tồn tại ✓) ⭐ ⇒ ⭐ gọi ⭐⭐ `action("set_warehouse_status", { warehouseId, active: false })` ⭐⭐ ⭐ `data-vntech="deactivate-warehouse"` ⭐ + ⭐ xác nhận có ghi rõ «*Phiếu kho cũ vẫn giữ nguyên*» ✅<br>⭐ ④ ⭐ **«＋ Tạo phiếu cấp phát»** ⭐: ⭐ **GIỮ `disabled`** ⚠️ ⭐ + ⭐ cập nhật `title` nêu **chính xác 2 việc còn lại của S01** ⭐ (⭐ thêm modal `allocate` + backend ghi `stock_reservations` ✓) ✅ |
| 🔒 **GIỮ ĐÚNG QUY TẮC USER (`DEC-20261008-013` quy tắc ③)** | ⭐ «*Xóa kho: **KHÔNG cho phép** nhưng cho phép **ẩn kho** hoặc **set trạng thái ngừng hoạt động***» ⭐ ⭐ **⇒ ⛔ KHÔNG còn bất kỳ `delete_warehouse` nào trong UI** ⭐ ✅ ⭐ + ⭐ hằng ⭐ `ALLOW_DELETE_WAREHOUSE = false` ⭐ ở `lib/warehouse-hub.ts` ⭐ (⭐ có test kiểm ✓) ✅ |
| ⭐⭐⭐ **ĐO THẬT TRÊN `:8787` (⭐ sau BUILD + restart)** | ⭐ `open-warehouse` ⇒ ⭐ **`disabled = false`** ✅ ⭐ `edit-warehouse` / `deactivate-warehouse` ⇒ ⭐ `disabled = true` ⚠️ (⭐ **vì chưa chọn kho** ⭐ — ⭐ `disabled={!selectedWhId}` ✓) ⭐ `open-allocate` ⇒ ⛔ **không có trong DOM** ⭐ (⭐ thuộc **tab khác** ✓) ⭐ ⭐⭐ **`conNutXoa = 0`** ⭐⭐ ⇒ ⛔ **KHÔNG còn nút «🗑 Xóa»** ✅ ⭐ ⭐⭐ **nút `title` chứa «TẠM KHOÁ» = `[]` (RỖNG)** ⭐⭐ ⇒ ⛔ **KHÔNG còn nút TẠM KHOÁ trên tab KHO** ✅ |
| ⚠️⚠️ **BÀI HỌC LỚN (§33) — ⭐ SỬA MÃ XONG MÀ ⛔ KHÔNG BUILD ⇒ ⛔ KHÔNG THẤY GÌ ĐỔI** | ⭐⭐ **`:8787` PHỤC VỤ BẢN BUILD CŨ** ⭐⭐ ⚠️ ⭐ ⭐ **HỆ QUẢ**: ⭐ người dùng nhìn màn hình **⛔ không thấy thay đổi** ⚠️ ⭐ ⇒ ⭐ **tưởng phiên 02 ⛔ chưa làm gì** ⚠️ ⭐ ⭐⭐ **LUẬT BẮT BUỘC**: ⭐ **sửa mã ⇒ PHẢI `npm run build` + restart `:8787`** ⭐ rồi ⭐ **MỚI đo/nghiệm thu** ✅ ⭐ ⭐ (⭐ đúng quy trình đã ghi: ⭐ `fixpoint-fingerprint` → `set-local-identity` → `build` → restart → đo → test ✓) ✅ |
| ⭐ **LỖI PHÉP ĐO LẦN 6 — ⭐ TỰ PHÁT HIỆN** | ⚠️ Lần đo 1 em dùng regex ⭐ `disabled(\{\|=)` ⭐ ⇒ ⭐ **⛔ BỎ SÓT thuộc tính `disabled` TRẦN** ⚠️ ⭐ ⇒ ⭐ kết quả **SAI** ⚠️ ⭐ ⭐ **SỬA**: ⭐ đổi sang ⭐ `\sdisabled(\s|\{\|=)` ⭐ + ⭐ ⭐ **in NGUYÊN dòng** ⭐ để ⛔ không suy diễn ✅ ⭐ ⭐ **BÀI HỌC**: ⭐ **⛔ không suy diễn từ regex — IN NGUYÊN DÒNG/ĐO DOM** ✅ |
| **TEST** | ⭐ `tsc EXIT=0` ✅ ⭐ ESLint `Inventory.tsx`: ⭐ **0 errors** ✅ ⭐ ⭐ **`npm run typecheck` 0** ⭐ + ⭐ ⭐⭐ **`npm run test:regression` ⇒ `947 tests · 946 pass · 0 fail`** ⭐⭐ ✅ ⭐ `test:workflow` `EXIT=0` ✅ ⚠️ ⭐ `npm test` ⛔ **vẫn chặn bởi lint của S01** (`BUG-20261008-021` ✓) ✅ |
| **STATUS** | ⭐⭐⭐ **CODE COMPLETE + TEST PASS + VERIFIED** ⭐⭐⭐ ⛔ **CHƯA COMMIT** ✓ |
| **RELATED** | ⭐ `HANDOFF-20261008-009` · `DEC-20261008-013` · `BUG-20261008-021` · `TASK-240` ✓ |

## ⭐⭐⭐ CHG-20261008-018 — CHUẨN HOÁ **12 MÃ KHO** VỀ QUY TẮC `KD-xxx` (⭐ USER CHỐT) ⭐⭐⭐
| ⭐ | ⭐ |
|---|---|
| **SESSION / TASK / CATEGORY** | ⭐ `ERP-SESSION-02` · ⭐ `TASK-242` · ⭐ `MIGRATION + DATABASE` ✓ |
| ⭐⭐⭐ **CĂN CỨ (⭐ user nguyên văn)** | ⭐ «*12 mã kho thật thì **sửa lại cho đúng quy tắc**, đây chỉ là **dữ liệu dev không quan trọng** đâu.*» ⭐ + ⭐ «*cho phép **sửa backend***» ⭐ + ⭐ quy tắc `DEC-20261008-013`: ⭐ «*Mã kho sinh theo quy tắc : **KD-xxx***» ✅ |
| ⭐⭐ **ĐO TRƯỚC KHI SỬA (⭐ ⛔ không đoán)** | ⭐ 12/12 kho có mã ⛔ **KHÔNG** theo `KD-xxx` ⚠️ ⭐: ⭐ `KHO-TONG` · `KHO-DA-MAU-01` · `KHO-DA06` · `KHO-DIAG` · `KHO-E2E-01` · `KHO-PRJ-DEMO-01` · `TD-E2E-DA-01-E2E-TD01/02` · `TD-PRJ-DEMO-01-TD-01/02/03` · `TRANSIT` ✅ |
| ⭐⭐⭐ **3 THAY ĐỔI (⭐ phải CÙNG NHAU, ⛔ thiếu 1 là vỡ)** | ⭐ ① ⭐ **MIGRATION MỚI** ⭐ `java-backend/.../db/migration/**V38__session02_warehouse_code_kd_rule.sql**` ⭐ (⭐ `§19` đặt tên theo phiên ✓ · ⭐ **idempotent** — mỗi câu có `WHERE code='<mã cũ>'` ⇒ ⭐ chạy lại ⛔ không đổi gì ✓) ✅<br>⭐ ② ⭐ **SEED** ⭐ `SystemSetupAdapter.java` ⭐: ⭐ `KHO-TONG` ⇒ ⭐ **`KD-001`** ⭐ (⭐ 2 chỗ: `SELECT COUNT(*)` + `INSERT` ✓) ⚠️ ⭐ **VÌ SAO BẮT BUỘC**: ⭐ nếu ⛔ không sửa thì lần khởi tạo sau sẽ tạo kho Tổng mã `KHO-TONG` ⇒ ⭐ **DB cũ và DB mới LỆCH mã** ⚠️ ✅<br>⭐ ③ ⭐ **TEST** ⭐ `tests/w02-project-warehouse-relation.test.mjs:**177-179**` ⭐: ⭐ `assert.ok(central.includes("KHO-TONG"))` ⇒ ⭐ **ĐỔI sang kiểm THEO Ý ĐỊNH** ⭐ (⭐ có ≥1 kho `project_id IS NULL` ⭐ **và** ⭐ có kho `type='central'` ✓) ⚠️ ⭐ **VÌ SAO BẮT BUỘC**: ⭐ test này là ⭐ **`dbTest` ĐỌC CSDL THẬT** ⚠️ ⇒ ⭐ đổi mã ⛔ không sửa test ⇒ ⭐ **ĐỎ** ✅ ⚠️ ⭐ và ⭐ **ý định W-02** là «*quan hệ kho↔dự án là 1:N **tuỳ chọn***» ⭐ — ⛔ **không hề nói mã kho phải là gì** ✅ |
| 🔒 **AN TOÀN — ⭐ 2 QUYẾT ĐỊNH CÓ LÝ DO** | ⭐ ① ⭐⛔ **KHÔNG đổi `TRANSIT`** ⭐ — ⭐ đó là **kho HỆ THỐNG** (`type='transit'`) ⚠️ ⭐ mã nguồn tra theo ⭐ `WHERE type='transit'` ⭐ (`WarehouseStockStoreAdapter:**690**` ✓) ⭐ ⛔ **không tra theo mã** ⇒ ⭐ đổi mã ⛔ không lợi mà ⚠️ **rủi ro** ✅ ⭐ ② ⭐⛔ **KHÔNG đổi `tên` kho** ⭐ — ⭐ user chỉ nói đổi **MÃ** ⚠️ ⇒ ⭐ giữ nguyên tên nghiệp vụ (⭐ «Kho trung tâm» · «Kho tổ đội · Tổ đội 1 — Xây dựng kết cấu» … ✓) ✅ |
| ⭐⭐⭐ **KẾT QUẢ ĐO SAU KHI SỬA (⭐ CSDL dev THẬT)** | ⭐ **11/12 mã ĐÃ ĐÚNG quy tắc** ⭐ ⭐: ⭐ `KD-001` central «Kho trung tâm» ⭐ `KD-002` project «Kho công trường DA-MAU-01» ⭐ `KD-003` site «Kho dự án A06» ⭐ `KD-004` site «Kho chẩn đoán» ⭐ `KD-005` site «Kho dự án E2E Đà Nẵng» ⭐ `KD-006` site «Kho công trường PRJ-DEMO-01» ⭐ `KD-007`…`KD-011` team ⭐ + ⭐ `TRANSIT` **giữ nguyên** ✅<br>⭐⭐ **`nextWarehouseCode()` TRÊN DỮ LIỆU THẬT = `"KD-012"`** ⭐⭐ ⇒ ⭐ **kho MỚI sẽ là KD-012** ✅ ⭐ + ⭐ `validateWarehouseCode("KD-001")` ⇒ ⭐ **`ok=false`** «*đã được dùng cho kho khác*» ⭐ = ⭐ **chặn trùng ĐÚNG** ✅ ⭐ + ⭐ `projectDeactivationPrompt` ⭐ 3 dự án ⇒ `shouldAsk=true` (⭐ 1/1/3 kho ✓) ⭐ ⭐ **⇒ ⭐ MỌI HÀM QUY TẮC CHẠY ĐÚNG TRÊN DỮ LIỆU MỚI** ✅ |
| ⭐ **KHÔNG ĐỔI `id` KHO (⭐ quan trọng)** | ⭐ Chỉ đổi ⭐ `code` ⭐ ⛔ **KHÔNG đổi `id`** ⚠️ ⭐ ⇒ ⭐ **MỌI chứng từ cũ** (⭐ `stock_ledger` · phiếu nhập/xuất ✓) ⭐ trỏ theo `id` ⇒ ⭐ ⛔ **KHÔNG mồ côi** ✅ ⭐ ⭐ **⇒ ĐÂY LÀ LÝ DO ĐỔI `code` AN TOÀN** ✅ |
| **FILES** | ⭐ `V38__session02_warehouse_code_kd_rule.sql` (⭐ mới ✓) ⭐ · ⭐ `SystemSetupAdapter.java` ⭐ · ⭐ `tests/w02-project-warehouse-relation.test.mjs` ✓ |
| ⭐⭐ **⚠️ LỖI CỦA EM — TỰ PHÁT HIỆN & SỬA** | ⭐ ① ⭐⛔ **KẾT LUẬN SAI «không có `mysql.exe`»** ⚠️ — ⭐ em chỉ tìm trong `PATH` ⚠️ ⭐ ⭐ **SỰ THẬT**: ⭐ `mysql.exe` ở ⭐ `C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe` ⭐ (⭐ chính test `w02:34` ghi đường dẫn này ✓) ⭐ ⇒ ⭐ **⛔ kết luận vội trước khi đọc mã test** ⚠️ ✅<br>⭐ ② ⭐ **Test `W-02` ĐỎ OAN** ⚠️ — ⭐ `mysql.exe -N -B` trả **CRLF** (`\r\n`) ⚠️ ⭐ ⇒ ⭐ `split("\n")` để lại ⭐ `"central\r"` ⚠️ ⇒ ⭐ `.includes("central")` = **FALSE** ⚠️ ⭐ ⭐ **SỬA**: ⭐ `split(/\r?\n/)` + ⭐ `.trim()` từng ô ✅ ⭐ ⭐ **BÀI HỌC**: ⭐⛔ **không giả định định dạng XUỐNG DÒNG** ⚠️ ✅ |
| **TEST** | ⭐ `tsc/typecheck EXIT=0` ✅ ⭐ ⭐⭐ **`npm run test:regression` ⇒ `952 tests · 951 pass · 0 fail`** ⭐⭐ ✅ ⭐ `test:workflow EXIT=0` ✅ ⭐ `w02` ⇒ ⭐ **10/10 PASS** ✅ ⚠️ ⭐ `npm test` ⛔ **vẫn chặn bởi lint của S01** (`BUG-20261008-021` ✓) ✅ |
| **STATUS** | ⭐⭐⭐ **CODE + MIGRATION + APPLIED + TEST PASS + VERIFIED** ⭐⭐⭐ ⛔ **CHƯA COMMIT** ✓ |
| **RELATED** | ⭐ `DEC-20261008-013` · `TASK-234` · `HANDOFF-20261008-009` · `BUG-20261008-021` ✓ |

## ⭐⭐⭐ CHG-20261008-019 — HẠ TẦNG «GIỮ CHỖ CHO PHIẾU XUẤT» (quy tắc ④ · bước ③) ⭐⭐⭐
| ⭐ | ⭐ |
|---|---|
| **SESSION / TASK / CATEGORY** | ⭐ `ERP-SESSION-02` · ⭐ `TASK-243` · ⭐ `MIGRATION + DATABASE` ✓ |
| ⭐⭐⭐ **CHẨN ĐOÁN (⭐ đo CSDL thật — ⛔ không suy đoán)** | ⭐ `SHOW COLUMNS FROM stock_reservations` ⭐ ⇒ ⭐ hiện có ⭐ `id · project_id · warehouse_id · material_id · **request_id** · **request_item_id** · quantity · status · reserved_at · released_at · created_by · created_at · updated_at` ⚠️ ⭐ ⭐ **⇒ ⛔ KHÔNG có cột trỏ PHIẾU XUẤT** ⚠️ ✅<br>⭐ `SHOW COLUMNS FROM stock_issues` ⭐ ⇒ ⭐ có ⭐ `**request_id** (YES — nullable)` ⭐ + ⭐ `**status** default **`draft`**` ⭐ (⭐ = «đang xử lý» ✓) ✅<br>⭐ **DỮ LIỆU**: ⭐ `stock_reservations` = ⭐ **0 dòng** ⭐ ⇒ ⭐ **chưa bao giờ được dùng** ✅ |
| ⭐⭐ **QUYẾT ĐỊNH — ⛔ KHÔNG tái dùng `request_id`** | ⭐⚠️ `stock_issues` **CÓ** `request_id` *(nullable — phiếu xuất có thể ⛔ không từ đề nghị)* ⚠️ ⭐ nên **về mặt kỹ thuật nhồi được** ⚠️ ⭐ ⭐ **NHƯNG ⛔ KHÔNG LÀM** ⭐ ⭐: ⭐ `request_id` mà chứa `issue_id` ⇒ ⭐ **⛔ không phân biệt được NGUỒN giữ chỗ** ⚠️ ⭐ ⇒ ⭐ khi RELEASE sẽ ⭐ **NHẢ NHẦM reservation của phiếu ĐỀ NGHỊ khác** ⚠️ ⇒ ⭐ **SAI TỒN KHO** ⚠️ ⭐ ⭐ **⇒ Thêm cột RIÊNG `issue_id`** ⭐ ✅ |
| ⭐⭐ **BEFORE → AFTER** | ⭐ **MIGRATION MỚI** ⭐ `java-backend/.../db/migration/**V39__session02_stock_reservation_issue_id.sql**` ⭐ ⭐ **ĐÃ ÁP VÀO CSDL DEV** ⭐: ⭐ `ALTER TABLE stock_reservations ADD COLUMN **issue_id** VARCHAR(64) NULL` ⭐ + ⭐ `CREATE INDEX **stock_reservations_issue_idx** (issue_id, status)` ⭐ ✅ |
| ⭐⭐⭐ **ĐO LẠI SAU KHI ÁP (⭐ CSDL thật)** | ⭐ `SHOW COLUMNS` ⭐ ⇒ ⭐ cột ⭐ **`issue_id  varchar(64)  YES  MUL  NULL`** ⭐ **ĐÃ CÓ** ✅ ⭐ + ⭐ `SHOW INDEX` ⭐ ⇒ ⭐ `stock_reservations_issue_idx` ⭐ gồm ⭐ 2 cột `issue_id` + `status` ⭐ **ĐÃ CÓ** ✅ |
| 🔒 **AN TOÀN (⭐ 3 lý do)** | ⭐ ① ⭐ Cột MỚI ⭐ **NULLABLE** ⭐ ⇒ ⭐ ⛔ không phá dữ liệu cũ, ⛔ không cần backfill ✅ ⭐ ② ⭐ Công thức tồn kho ⭐ `available = physical − SUM(reserved WHERE status='active')` ⭐ ⛔ **KHÔNG phân biệt nguồn** ⚠️ ⇒ ⭐ thêm cột ⛔ **không phá công thức** ✅ ⭐ ③ ⭐ `stock_reservations` ⭐ **0 dòng** ⭐ ⇒ ⭐ áp lần đầu ⛔ **không rủi ro dữ liệu** ✅ |
| ⭐ **LÀM MỚI ẢNH CHỤP SCHEMA (⭐ việc phụ, có ích)** | ⭐ `tools/_live-schema.tsv` ⭐ **CŨ hơn 38 migration** ⚠️ ⇒ ⭐ 3 tool ⭐ (`probe-java-sql-live` · `probe-java-sql-schema` · `probe-schema-drift`) ⭐ **⛔ KHÔNG KẾT LUẬN được** ⚠️ ⭐ ⇒ ⭐ **đã trích xuất lại** ⭐ (⭐ `1716 dòng` ✓) ✅ ⭐ ⚠️ **ĐÃ KIỂM AN TOÀN TRƯỚC**: ⭐ ⛔ **không test nào** dùng tệp này ⭐ + ⭐ `probe-schema-drift` ⛔ **không nằm trong `npm test`** ✓ ⭐ ⇒ ⭐ **an toàn** ✅ |
| ⭐ **PHÁT HIỆN PHỤ (⭐ ⛔ không phải lỗi của phiên 02)** | ⭐ Sau khi làm mới ⇒ probe báo ⭐ **6 điểm lệch** ⚠️: ⭐ `backup_csl_20261006` · `backup_ump_20261006` · `backup_ump_20261006b` ⭐ (⭐ bảng **backup** ✓) ⭐ + ⭐ `contract_review_logs` · `contract_reviews` · `error_reports` ⭐ ⚠️ ⭐ ⚠️ **LƯU Ý**: ⭐ 3 bảng này ⭐ **có migration `V37**__contract_reviews_review_logs_error_reports_transit_warehouse.sql`** ⚠️ ⭐ nhưng probe ⛔ không thấy ⇒ ⭐ **cần phiên phụ trách điều tra** ⚠️ ⭐ ⭐ **⛔ KHÔNG phải do V38/V39** ⭐ (⭐ em chỉ đổi mã kho + thêm 1 cột ⭐ ⛔ không thêm bảng ✓) ⭐ ⭐ **(so sánh: trước khi làm mới probe nói «KHÔNG KẾT LUẬN» — ⛔ không phải xanh ⇒ nay nói THẬT hơn ✓)** ✅ |
| **TEST** | ⭐ `npm run test:regression` ⇒ ⭐⭐ **`953 tests · 952 pass · 0 fail`** ⭐⭐ ✅ ⭐ `test:workflow EXIT=0` ✅ |
| **STATUS** | ⭐⭐ **HẠ TẦNG XONG (⭐ bước ③/③)** ⭐⭐ ⏳ **còn bước ① ② (Java) — CHƯA làm** ⛔ **CHƯA COMMIT** ✓ |
| **RELATED** | ⭐ `DEC-20261008-013` (quy tắc ④) · `TASK-236` · `TASK-243` · `HANDOFF-20261008-009` ✓ |

## ⭐⭐⭐ CHG-20261008-020 — VIẾT MÃ QUY TẮC ④ CHO PHIẾU XUẤT (3 tệp Java — **BIÊN DỊCH ĐẠT**) ⭐⭐⭐
| ⭐ | ⭐ |
|---|---|
| **SESSION / TASK / CATEGORY** | ⭐ `ERP-SESSION-02` · ⭐ `TASK-243` · ⭐ `BACKEND` ✓ |
| ⭐⭐⭐ **CĂN CỨ** | ⭐ **USER CHỐT** (`DEC-20261008-013` quy tắc ④) ⭐ + ⭐ **user CHO PHÉP sửa backend** ⭐ — ⭐ nguyên văn: «*cho phép **sửa backend***» ⭐ ⚠️ ⭐ (⭐ `§7` — ngoại lệ có **uỷ quyền trực tiếp của user** ✓) ✅ |
| ⭐⭐⭐ **PHÁT HIỆN QUYẾT ĐỊNH (⭐ đo từ mã — ⭐ chính mã cũ ghi ra lỗ hổng)** | ⭐ `StockManagementUseCase.java:150-154` ⭐ có chú thích: ⭐ «*Việc **giải phóng giữ chỗ** vẫn làm ngay tại ① (giữ chỗ là ý định, không phải tồn kho)*» ⭐ + ⭐ `store.releaseReservationsForRequest(...)` ⚠️ ⭐ ⭐⇒ ⭐⛔ **khi TẠO phiếu xuất hệ thống CHỈ NHẢ giữ chỗ của phiếu ĐỀ NGHỊ — ⛔ KHÔNG TẠO giữ chỗ nào cho PHIẾU XUẤT** ⚠️ ⭐ ⭐ **HỆ QUẢ**: ⭐ từ lúc tạo phiếu tới lúc `completed` ⭐ số lượng đó ⛔ **KHÔNG bị giữ** ⇒ ⭐ **2 phiếu xuất cùng chờ duyệt VẪN xuất quá `available` được** ⚠️ ⭐ = ⭐ **ĐÚNG LỖ HỔNG USER MÔ TẢ** ✅ |
| ⭐⭐ **① `WarehouseStockStore.java` (interface)** | ⭐ **THÊM 2 HÀM** *(⭐ chèn sau `releaseReservationsForRequest` `:37`)*: ⭐ `void createIssueReservations(String issueId, Instant now)` ⭐ + ⭐ `void releaseReservationsForIssue(String issueId, Instant now)` ⭐ ⭐ **kèm javadoc TRÍCH NGUYÊN VĂN lời user + nêu rõ lý do ⛔ không tái dùng `request_id`** ✅ |
| ⭐⭐ **② `WarehouseStockStoreAdapter.java`** | ⭐ **CÀI 2 HÀM** — ⭐ theo **đúng mẫu** `RequestStoreAdapter:420` (`createStockReservations`) ⭐ + ⭐ `:171` (`releaseReservationsForRequest` ✓):<br>· ⭐ `createIssueReservations`: ⭐ đọc `stock_issues` lấy `project_id`/`from_warehouse_id`/`issued_by` ⭐ → ⭐ đọc `stock_issue_items` ⭐ ⚠️ **CHỈ phần CHƯA xuất** ⭐ `(quantity-COALESCE(installed_qty,0))>0` ⭐ → ⭐ `INSERT INTO stock_reservations (…,**issue_id**,quantity,status,…)` ⭐ ⭐ `request_id`/`request_item_id` = ⭐ **NULL** ⭐ ⚠️ ⭐ `id` = ⭐ `"RSV_"+UUID` ⭐ ⭐ (⭐ đúng quy ước bảng ✓) ✅<br>· ⭐ `releaseReservationsForIssue`: ⭐ `UPDATE … SET status='released',released_at=?,updated_at=? WHERE issue_id=? AND status='active'` ⭐ ✅<br>⭐ cả 2 ⭐ `@Override @Transactional` ⭐ **theo đúng mẫu** ✅ |
| ⭐⭐ **③ `StockManagementUseCase.java`** | ⭐ **GỌI 2 CHỖ** ⭐:<br>· ⭐ **BƯỚC ①** ⭐ sau `store.insertStockIssue(header, items, now);` ⭐ ⇒ ⭐ `store.createIssueReservations(issueId, now);` ⭐ ⚠️ ⭐ **ĐẶT NGOÀI vòng lặp** ⭐ (⭐ ⛔ nếu trong vòng lặp sẽ tạo **TRÙNG** reservation ✓) ✅<br>· ⭐ **BƯỚC ②** ⭐ sau khi `store.confirmStockIssue(...)` **thành công** ⭐ ⇒ ⭐ `store.releaseReservationsForIssue(issueId, now);` ⭐ ⚠️ ⭐ **ĐẶT SAU** ⭐ (⭐ ⛔ không đặt trước, kẻo **nhả rồi mà xác nhận lỗi** ✓) ✅ |
| ⭐⭐⭐ **BIÊN DỊCH ĐẠT (⭐ quan trọng nhất)** | ⭐ `mvn -f java-backend/pom.xml -pl infrastructure -am compile -DskipTests` ⭐ ⇒ ⭐ `Compiling **66** source files` (application) ⭐ + ⭐ `Compiling **42** source files` (infrastructure) ⭐ ⭐⭐ **`BUILD SUCCESS`** ⭐⭐ ⭐ `MVN_EXIT=0` ✅ ⭐ ⭐ **⇒ ⛔ KHÔNG có lỗi cú pháp/kiểu** ⭐ ⇒ ⭐ **rủi ro «làm hỏng build Java cho mọi phiên» ĐÃ ĐƯỢC LOẠI BỎ** ✅ |
| ⭐⭐ **CÔNG CỤ ĐÃ TÌM ĐƯỢC (⭐ để lần sau ⛔ không mất thời gian)** | ⭐ `mvn.cmd` ⭐ ở ⭐ `C:\Users\PC\.m2\wrapper\dists\apache-maven-3.9.16\…\bin\mvn.cmd` ⚠️ *(⭐ ⛔ KHÔNG có trong `PATH` → phải gọi đường dẫn đầy đủ ✓)* ⭐ + ⭐ `javac` JDK 21 ⭐ + ⭐ `tools/deploy-java-backend.mjs` ⭐ ⚠️ *(⭐ ⛔ không phải `scripts/` ✓)* ✅ |
| ⚠️⚠️ **CHƯA LÀM — CÓ LÝ DO** | ⭐ ① ⭐ **CHƯA DEPLOY** ⚠️ — ⭐ cần **đóng gói jar + restart `:18081`** ⭐ ⭐ nhưng `:18081` là **SERVER DÙNG CHUNG** ⚠️ *(⭐ §36 «BUILD/SERVER COORDINATION» — ⛔ không restart server chung khi chưa phối hợp ✓)* ⭐ ② ⭐ **CHƯA KIỂM HÀNH VI THẬT** ⚠️ — ⭐ cần: ⭐ tạo 2 phiếu xuất cùng vật tư **cùng chờ duyệt** ⇒ ⭐ phiếu 2 **phải bị chặn** ⭐ + ⭐ khi phiếu 1 `completed` ⇒ ⭐ giữ chỗ **phải nhả** ⚠️ ⭐ ⭐ **⇒ ⛔ KHÔNG đánh dấu FIXED** ⭐ (⭐ `§24`: FIXED = code + **TEST PASS** ✓) ✅ |
| **STATUS** | ⭐⭐ **CODE COMPLETE + BIÊN DỊCH ĐẠT** ⭐⭐ ⚠️ **CHƯA DEPLOY · CHƯA KIỂM HÀNH VI** ⇒ ⛔ **KHÔNG phải FIXED** ⛔ **CHƯA COMMIT** ✓ |
| **RELATED** | ⭐ `DEC-20261008-013` · `TASK-236` · `TASK-243` · `CHG-20261008-019` · `HANDOFF-20261008-009` ✓ |
