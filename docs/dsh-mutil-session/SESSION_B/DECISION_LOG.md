# DECISION_LOG — SESSION_B (ERP-SESSION-02)

## DEC-20261006-001
Date: 2026-10-06 | Category: BUSINESS (kem RBAC)
Decision: Ngoai le quyen xem kho — director (Ban Lanh dao) + admin (+ IT, vi he thong KHONG co role it nen IT = admin) duoc XEM TAT CA kho (ke ca kho DU AN ma minh KHONG la thanh vien); thao tac van theo quyen module.
Reason: User yeu cau kho DU AN chi hien voi thanh vien du an, NHUNG BAN GIAM DOC/ADMIN/IT can xem duoc tat ca => can ngoai le.
Alternatives Considered: (a) them khoa module warehouse_view_all · (b) hardcode chi admin · (c) ngoai le theo role DA CO.
Selected Solution: (c) — dung dung role da co director/admin trong SEE_ALL_WAREHOUSE_ROLES (khoi thuan) => KHONG them khoa module, khong migration, khong hardcode trong JSX.
Impact: visibleWarehouseCards() tra toan bo kho cho 2 role nay; role khac chi thay kho Tong + kho thuoc du an minh.
Related Task: TASK-20261006-226 | Related Change: CHG-20261006-002
Verification: do tren payload that — user admin => thay 12/12 kho.

## DEC-20261006-002
Date: 2026-10-06 | Category: UI (kem kien truc menu)
Decision: GOM 7 muc menu nhom KHO -> 1 MUC «Kho vat tu».
Reason: User chot yeu cau «click vao menu se hien thi luon ra man dashboard ton kho» + tabbar 3 tab => 7 muc roi la THUA (nhieu cua vao CUNG mot man).
Alternatives Considered: (a) giu 7 muc · (b) gom 3 muc · (c) gom 1 muc.
Selected Solution: (c) — 1 muc warehouse_hub nhan «Kho vat tu», moduleKey: "inventory", permissionKeys = ca 6 khoa kho DA CO.
Impact: Menu gon; 0 khoa module moi · khong dong module_catalog · khong migration; 6 khoa cu VAN SONG (quyen · tieu de · tim kiem · nhanh render).
Related Task: TASK-20261006-226 | Related Change: CHG-20261006-001
Verification: do lai — label "Kho vat tu" 1 lan, muc cu 0 lan.

## DEC-20261006-003
Date: 2026-10-06 | Category: ARCHITECTURE (da phien)
Decision: KHONG sua app/page.tsx de gom menu, du day la tep render menu.
Reason: app/page.tsx:506 (warehouseMenuChildren) va :523 (allocateReturnMenuChildren) dung menu tu CHINH 2 mang warehouseMenuItems / allocateReturnMenuItems trong lib/menu-helpers.ts => doi 2 mang la menu doi theo. Tep app/page.tsx dang do PHIEN KHAC giu => sua vao la xung dot.
Alternatives Considered: (a) sua truc tiep app/page.tsx · (b) cho phien khac nha tep · (c) chi sua lib/menu-helpers.ts.
Selected Solution: (c) — KHONG dung app/page.tsx (Goal §7/§17/§18/§28).
Impact: Tranh hoan toan xung dot da phien; viec gom menu van dat ket qua dung.
Related Task: TASK-20261006-226 | Related Change: CHG-20261006-001
Verification: git diff tren app/page.tsx KHONG co thay doi nao cua phien nay.

## DEC-20261006-004
Date: 2026-10-06 | Category: TECHNICAL (du lieu)
Decision: Tach logic kho ra KHOI THUAN lib/warehouse-hub.ts (khong JSX, khong import UI).
Reason: Can test duoc bang Node ma KHONG phu thuoc browser; va khong phinh file man hinh.
Alternatives Considered: (a) viet logic trong Inventory.tsx · (b) tach khoi thuan · (c) tao module moi + API.
Selected Solution: (b) — khoi thuan + tests/warehouse-hub.test.mjs.
Impact: 22/22 test PASS · logic tai dung cho CA hub VA man chi tiet; tsc van 0.
Related Task: TASK-20261006-226 | Related Change: CHG-20261006-002
Verification: node --import tsx --test tests/warehouse-hub.test.mjs => 22/22.

## DEC-20261006-005
Date: 2026-10-06 | Category: TECHNICAL (du lieu)
Decision: KHONG tao API moi, KHONG migration cho hub kho — chi dung payload san co.
Reason: GET /api/system da tra du warehouses[] (12) · inventory[] (1.185 dong) · issues[] (29) · receipts[] (36) · returns[] (6) · projects[] (5) · userScopes[] (28).
Alternatives Considered: (a) them API rieng cho kho · (b) them truong warehouseId vao issues/returns · (c) dung payload san co.
Selected Solution: (c) — va GHI RO GIOI HAN TREN UI o cho KHONG loc chinh xac duoc (xem BUG-004).
Impact: An toan, KHONG dung database dung chung (Goal §18/§22) => KHONG xung dot schema voi phien khac.
Related Task: TASK-20261006-226 | Related Change: CHG-20261006-002
Verification: do tren payload song — 12 kho · 1.185 dong ton.

## DEC-20261006-004
Date: 2026-10-06 | Session: ERP-SESSION-02 | Category: TESTING / UI_UX | Module: Kho vat tu
Decision: Khi do luong tab co NHIEU KHOI ANH EM (khong long trong 1 section), phai kiem TUNG selector
  cua tung khoi (`[data-vntech="issue-list-screen"]`, `[data-vntech="receipt-list-screen"]`),
  ⛔ KHONG chi do ben trong section cha.
Reason: Do that thuc te: section cha `[data-vntech="warehouse-io-tab"]` chi cao **234px** va co
  `soBang=0 · soDong=0` ⇒ neu chi nhin con so nay se **ket luan sai la tab «XUAT & NHAP» TRONG**,
  trong khi 2 danh sach that (30 dong + 36 dong) nam NGOAI no (`Inventory.tsx:454`, `:481`).
Impact: ⛔ Tranh bao loi gia (false RED) va tranh bo sot bug that (false GREEN) khi nghiem thu.

## ⭐⭐ DEC-20261007-008 — USER QUYẾT: MERGE `unity` → `main` NGAY ⭐⭐
| ⭐ | ⭐ |
|---|---|
| **NGUỒN** | ⭐⭐⭐ **USER** ⭐⭐⭐ — ⭐ trả lời qua **kênh điện thoại** (`ask_user`): ⭐⭐ «**Có, merge ngay**» ⭐⭐ ✓ |
| **BỐI CẢNH** | ⭐ `unity` trước `main` **37 commit** ⭐ (⭐ toàn bộ việc TASK-226→229 + fix `moduleKey` + 68 ảnh chuẩn + log 2 phiên ✓) · ⭐ `main` trước `unity` **2 commit** (⭐ cũ: Initial 08/09 + Merge unity 26/09 ✓) |
| ⭐ **ẢNH HƯỞNG** | ⭐ **KIẾN TRÚC TRIỂN KHAI** ⭐ — ⭐ `origin/main` là **nhánh deploy** (`origin/HEAD -> origin/main`) ⭐ ⇒ ⭐⭐ **`main` nay đã có TOÀN BỘ nội dung mới nhất** ⭐⭐ ⇒ ⭐ **sẵn sàng deploy** ✅ |
| **CÁCH THỰC HIỆN** | ⭐ `git worktree` **tạm** (⛔ không đụng cây làm việc) ⇒ ⭐ merge `origin/unity` vào `origin/main` ⭐ ⇒ ⭐ **0 xung đột** ✅ ⇒ ⭐ push `3bf6af2` ⭐ ⇒ ⭐ xác minh `diff main unity = RỖNG` ✅ |
| **BẰNG CHỨNG** | ⭐ `EVT-20261007-039` ✓ |
| **STATUS** | ⭐⭐ **DONE** ⭐⭐ — ⭐ `origin/main` = `3bf6af2` ⭐ ⭐ **nội dung GIONG HOÀN TOÀN `unity`** ⭐ ✅ |

---

## ⭐⭐ DEC-20261007-009 — USER QUYẾT: `BUG-006` GIAO **SESSION-01** SỬA ⭐⭐
| ⭐ | ⭐ |
|---|---|
| **NGUỒN** | ⭐⭐⭐ **USER** ⭐⭐⭐ — ⭐ trả lời qua kênh điện thoại: ⭐⭐ «**Để SESSION-01 sửa**» ⭐⭐ ✓ |
| ⭐ **LÝ DO (§7 PHÂN VAI)** | ⭐ Tệp `tools/probe-visual-regression.mjs` + `tools/baseline/**` ⭐⭐ **THUỘC `ERP-SESSION-01`** ⭐⭐ ⇒ ⭐ **phiên 02 ⛔ KHÔNG được sửa** ✓ |
| **HỆ QUẢ** | ⭐ ERP-SESSION-02 ⭐⭐ **DỪNG** ⭐⭐ việc theo đuổi `BUG-006` ⭐ · ⛔ **KHÔNG** sửa tệp của S01 ✅ ⭐ ⭐ ⇒ ⭐ `BUG-006` **vẫn OPEN** ⚠️ — ⭐ **3 màn ảnh chuẩn vẫn chụp SAI MÀN** ⚠️ (`11-modal-request` trùng byte `08-requests` · `16` `nav=NO_CLICK_TARGET` · `19` `nav=NO_GROUP()`) ✓ |
| **HÀNH ĐỘNG** | ⭐ Ghi ⭐ `HANDOFF-20261007-005` ⭐ cho S01 ✓ |
| **STATUS** | ⭐ **DONE** (⭐ phần của phiên 02 ✓) — ⭐ `BUG-006` **⛔ KHÔNG do phiên 02 xử lý** ✓ |
