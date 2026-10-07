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

## ⭐⭐ DEC-20261007-010 — XỬ LÝ 4 NÚT CHẾT: CHỌN PHƯƠNG ÁN **(b) TẠM KHOÁ + GHI RÕ LÝ DO** ⭐⭐
| ⭐ | ⭐ |
|---|---|
| **BỐI CẢNH** | ⭐ User ⭐⭐ **⛔ CHƯA TRẢ LỜI** ⭐⭐ câu hỏi này (⭐ trả lời 2/3 — ⭐ chỉ chốt «merge main» + «BUG-006 giao S01» ⚠️) ✓ |
| ⭐ **GIẢ ĐỊNH ĐÃ GHI RÕ (⭐ theo hướng dẫn của kênh hỏi)** | ⭐ ERP-SESSION-02 ⭐⭐ **tiếp tục với PHƯƠNG ÁN ĐỀ XUẤT (b)** ⭐⭐ — ⭐ đã đề xuất **2 lần** với user và **ghi rõ là khuyến nghị** ⭐ ⭐ ⇒ ⭐ **tiến hành + nêu rõ giả định** ✓ |
| ⭐ **CÁC PHƯƠNG ÁN** | ⭐ **(a)** viết **modal + API mới** ⇒ ⭐⛔ **CẦN QUY TẮC NGHIỆP VỤ từ user** ⭐ ⛔ không được tự bịa (§14) ⚠️<br>⭐ **(b)** ⭐⭐ **TẠM KHOÁ + GHI RÕ LÝ DO** ⭐⭐ ⭐ <-- **ĐÃ CHỌN** ✅<br>⭐ **(c)** giữ nguyên ⛔ **để nút bấm mà IM LẶNG** ⚠️ ⇒ ⭐ trái **§22 (error state)** ✗ |
| ⭐ **LÝ DO CHỌN (b) — theo §41** | ⭐ **SAFE** ✅ (⛔ không đổi API/dữ liệu/quyền ✓) ⭐ **SMALL** ✅ (14 thêm/7 xoá ✓) ⭐ **ISOLATED** ✅ (1 tệp, ⛔ không đụng tệp phiên khác ✓) ⭐ **TESTABLE** ✅ (đo được `disabled` ✓) ⭐⭐ **REVERSIBLE** ✅ (⛔ **giữ nguyên `onClick`** ⇒ hoàn nguyên = **bỏ `disabled`** ⭐ **1 bước** ✓) ✓ |
| ⭐ **BÀI HỌC (§33)** | ⭐ ⭐⭐ **NÚT BẤM MÀ ⛔ KHÔNG CÓ GÌ XẢY RA = LỖI UX NGHIÊM TRỌNG HƠN NÚT BỊ KHOÁ** ⭐ ⭐⭐ — ⭐ khoá + **nói rõ lý do** ⇒ ⭐ user **biết đường** ✅ ⭐ im lặng ⇒ ⭐ user **tưởng hệ thống treo** ⚠️ ✓ |
| **STATUS** | ⭐⭐ **DONE** ⭐⭐ — ⭐ `CHG-20261007-006` ⭐ (⛔ **chưa phải đã sửa xong chức năng** — ⭐ vẫn **OPEN** phần **viết modal + API** ⚠️ ✓) |

## ⭐⭐⭐ DEC-20261007-011 — ĐỀ XUẤT QUY TẮC NGHIỆP VỤ 4 CHỨC NĂNG KHO (⛔ KHÔNG BỊA — LẤY TỪ **SCHEMA THẬT**) ⭐⭐⭐
| ⭐ | ⭐ |
|---|---|
| ⭐ **MỤC ĐÍCH** | ⭐⭐ **CHUYỂN «XIN QUY TẮC» (⭐ khó trả lời) ➜ «DUYỆT ĐỀ XUẤT»** ⭐⭐ — ⭐ user chỉ cần **DUYỆT / SỬA**, ⛔ không phải tự soạn từ đầu ✓ |
| ⭐⭐⭐ **NGUỒN — ĐO THẬT, ⛔ KHÔNG SUY DIỄN** | ⭐ `CREATE TABLE warehouses` ⭐ trong `_javac-verify/BOOT-INF/classes/db/demo/schema-h2.sql` ⭐ + ⭐ **xác nhận lại** bởi **4 câu `INSERT INTO warehouses`** trong `scripts/system-route.mjs` ⭐ (`:628` · `:943` · `:1710` · `:2500` ✓) ✓ |
| ⭐⭐ **SCHEMA THẬT CỦA `warehouses`** | ⭐⭐⭐ `id` ⭐ `code` ⭐ `name` ⭐ `type` ⭐ `project_id` (NULL được) ⭐ `parent_warehouse_id` (NULL được) ⭐ `keeper_user_id` (NULL được) ⭐ `active` (mặc định `1`) ⭐ `created_at` ⭐ `updated_at` ⭐⭐⭐ ✓ |
| ⭐⭐ **ĐỀ XUẤT ① — MODAL «TẠO/SỬA KHO»** | ⭐⭐ **ĐÚNG 8 TRƯỜNG NGƯỜI DÙNG NHẬP** ⭐⭐ (⭐ 3 trường hệ thống ⛔ tự sinh: `id` · `created_at` · `updated_at` ✓):<br>⭐ **Mã kho** (`code`) — ⭐ **BẮT BUỘC** ⭐ **DUY NHẤT** ⭐<br>⭐ **Tên kho** (`name`) — ⭐ **BẮT BUỘC** ⭐<br>⭐ **Loại kho** (`type`) — ⭐ **BẮT BUỘC** · ⭐ **chọn từ danh mục** ⚠️ (⭐ đo được **12 kho thật** chia **3 loại**: ⭐ `central` ×1 · `site` ×5 · **nhóm khác ×6** ⚠️ ⇒ ⭐ **CẦN ANH CHỐT DANH MỤC `type`** ✓)<br>⭐ **Dự án** (`project_id`) — ⭐ **chỉ bật khi `type` = kho dự án** ⭐ (⭐ ⛔ để trống = kho ⛔ không thuộc dự án ✓)<br>⭐ **Kho cha** (`parent_warehouse_id`) — ⭐ chọn từ **danh sách kho hiện có** · ⛔ để trống = kho gốc ✓<br>⭐ **Thủ kho** (`keeper_user_id`) — ⭐ chọn từ **danh sách người dùng** · ⛔ để trống được ✓<br>⭐ **Đang hoạt động** (`active`) — ⭐ công tắc ✓ |
| ⭐⭐ **ĐỀ XUẤT ② — ACTION `delete_warehouse`** | ⭐ **ĐIỀU KIỆN CHẶN XÓA** (⭐ đề xuất — ⭐ **CẦN ANH CHỐT** ⚠️): ⭐ ① ⭐ **còn tồn kho** (`inventory.balance > 0` cho kho đó) ⇒ ⛔ **KHÔNG cho xóa** ⭐ ② ⭐ **có chứng từ** (⭐ `goods_receipts` · `stock_issues` · `material_returns` · `transfers` trỏ tới kho) ⇒ ⛔ **KHÔNG cho xóa** ⭐ ③ ⭐ **có kho con** (`parent_warehouse_id` trỏ tới nó) ⇒ ⛔ **KHÔNG cho xóa** ⭐ ④ ⭐ **không vướng gì** ⇒ ⭐⭐ **ĐỀ XUẤT: ⛔ KHÔNG xóa cứng — CHUYỂN `active = 0` (xoá mềm)** ⭐⭐ ⭐ lý do: ⭐ bảng có cột `active` ⭐ ⇒ ⭐ **giữ lịch sử** ✅ ✓ |
| ⭐ **ĐỀ XUẤT ③ — «PHIẾU CẤP PHÁT»** | ⭐⛔ **CHƯA ĐỦ DỮ LIỆU ĐỂ ĐỀ XUẤT** ⚠️ — ⭐ `AllocateReturn.tsx:5-6` ghi rõ «⭐ **⛔ Không tự suy diễn nghiệp vụ** ✓» ⭐ + ⭐ đo thật: ⭐ `issues[]` (29) ⭐ **⛔ KHÔNG có trường `warehouseId`** ⚠️ ⭐ ⇒ ⭐ **CẦN ANH CHO BIẾT**: ⭐ ① phiếu cấp phát gồm **trường nào**? ⭐ ② ⭐ **trừ tồn kho nào** (⭐ `issues` ⛔ không gắn kho ⚠️)? ⭐ ③ có cần **duyệt** không? ✓ |
| ⭐ **BẰNG CHỨNG** | ⭐ `schema-h2.sql` (`CREATE TABLE warehouses`) ⭐ `system-route.mjs:628/943/1710/2500` ⭐ + ⭐ `BUG-20261007-013/014/015` ⭐ `CHG-20261007-006` ✓ |
| **STATUS** | ⭐⭐ **OPEN — CHỜ ANH DUYỆT** ⭐⭐ ⭐ ⛔ **CHƯA VIẾT MÃ** (⭐ §14: ⛔ không bịa nghiệp vụ ✓) ⭐ ⭐ **anh chỉ cần**: ⭐ ✅ **DUYỆT** ⭐ hoặc ✏️ **SỬA** ⭐ hoặc ➕ **BỔ SUNG** ⭐⭐⭐ ③ ⭐⭐⭐ ✓ |
