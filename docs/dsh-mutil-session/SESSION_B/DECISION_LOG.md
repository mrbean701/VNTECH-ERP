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

## ⭐ DEC-20261008-012 — XỬ LÝ 2 CỘT «TRẠNG THÁI» + «Ý KIẾN ĐIỀU CHỈNH» (⭐ chờ user chọn A/B/C) ⭐
| ⭐ | ⭐ |
|---|---|
| ⭐⭐ **CÂU HỎI USER** | ⭐ «*tại sao lại có trường **Ý kiến điều chỉnh** và **trạng thái đã duyệt và đề xuất** là sao*» ⭐ |
| ⭐ **TRẢ LỜI (⭐ có bằng chứng mã)** | ⭐ ① ⭐ Là **cột CSDL có thật**: ⭐ `material_subcategories.review_status` (⭐ `NOT NULL DEFAULT 'approved'` ✓) ⭐ + ⭐ `adjustment_note` (⭐ NULLABLE ✓) ✓<br>⭐ ② ⭐ UI hiện ở `app/page.tsx:**1448**` ⭐ ⭐ ③ ⭐ ⚠️ **NHƯNG**: ⭐ modal (`:3086`) **⛔ không có 2 ô đó** ⭐ + ⭐ đường Java **⛔ không ghi** (⭐ `MaterialCatalogStore.java:61` · `MaterialCatalogManagementUseCase.java:641` ✓) ⭐ ⇒ ⭐⭐ **«Đã duyệt» = GIÁ TRỊ MẶC ĐỊNH CSDL** ⚠️ ⭐ «Đề xuất» = ⭐ **trường TRỐNG ⇒ UI tự gán** ⚠️ ⭐ «Ý kiến điều chỉnh» = ⭐ **luôn trống** ⭐ ⭐⭐ ⇒ ⭐⭐ **DỮ LIỆU CHẾT — hiển thị gây hiểu nhầm** ⭐⭐ ✓ |
| ⭐ **3 PHƯƠNG ÁN** | ⭐ **A. XOÁ 2 cột** ⭐ (⭐ nhanh, hết hiểu nhầm ✓) ⭐ ⭐ **B. LÀM THẬT** ⭐ (⭐ thêm 2 ô modal + ⭐ sửa Java ⚠️ **thuộc S01** ✓) ⭐ ⭐ **C. GIỮ + GHI RÕ NGUỒN** ⭐ (⭐ «Đã duyệt» ⇒ «**Mặc định hệ thống**» ⚠️ + ⭐ **bỏ cột «Ý kiến điều chỉnh»** vì luôn trống ✓) ✓ |
| ⭐⭐ **KHUYẾN NGHỊ CỦA EM** | ⭐ **C** ⭐ — ⭐ ⛔ không xoá dữ liệu ⭐ mà ⭐ **sửa cho trung thực** ⚠️ ⭐ + ⭐ bỏ cột **luôn trống** ⭐ ⭐ (⭐ theo luật user ④: ⭐ «*chỉ có tác dụng để dev check thì xóa đi*» ⭐ ⇒ ⭐ cột «Ý kiến điều chỉnh» **luôn 💬** ⇒ ⭐ **thừa** ✓) ✓ |
| **STATUS** | ⭐⭐ **OPEN — ⛔ CHƯA SỬA** ⏳ **chờ user chọn A / B / C** ⭐ ⚠️ (⭐ ⛔ không tự ý sửa vì đây là **quyết định về dữ liệu hiển thị** ✓) ✓ |

## ⭐⭐⭐ DEC-20261008-013 — QUY TẮC NGHIỆP VỤ **4 CHỨC NĂNG KHO** (⭐ USER CHỐT 2026-10-08) ⭐⭐⭐
> ⚠️ **ĐÂY LÀ NGUỒN SỰ THẬT** cho việc viết mã 4 chức năng kho. Trích **nguyên văn** lời user + diễn giải.

### ⭐⭐ ① TẠO KHO — **HỎI NGAY KHI LẬP DỰ ÁN** ⭐⭐
| ⭐ | ⭐ |
|---|---|
| ⭐⭐ **USER NGUYÊN VĂN** | «*tạo kho cần có logic **hỏi user từ khi dự án được lập**. có nghĩa là khi **user tạo dự án mới** thì hệ thống sẽ **hỏi có tạo kho cho dự án hay không**, nếu user bấm **có** thì sẽ hiển thị lên màn hình «**Đang tạo kho ...**» (Kho sẽ được tạo với các thông tin cơ bản như **tên kho, mã kho, tên dự án**, ⛔ **chưa cần phải thêm thủ kho hay các thông tin khác** sau này user sẽ tự cấu hình sau), nếu user bấm **không** thì có nghĩa là **kho dự án sẽ được tạo sau (tạo thủ công)**. **Mặc định hệ thống sẽ có 1 kho Tổng***» |
| ⭐ **DIỄN GIẢI** | ⭐ ① ⭐ **Điểm kích hoạt** = ⭐ **lúc TẠO DỰ ÁN MỚI** ⚠️ (⭐ ⛔ không phải từ màn Kho ✓) ⭐ ② ⭐ Hiện **hộp hỏi**: «*Có tạo kho cho dự án này không?*» ⭐ ③ ⭐ **CÓ** ⇒ ⭐ hiện trạng thái «**Đang tạo kho …**» ⭐ + ⭐ tạo kho với **3 thông tin cơ bản**: ⭐ **Tên kho** · ⭐ **Mã kho** · ⭐ **Tên dự án** ⭐ ⚠️ (**⛔ chưa cần** thủ kho/thông tin khác ✓) ⭐ ④ ⭐ **KHÔNG** ⇒ ⭐ kho dự án **tạo sau bằng tay** (⭐ qua nút «＋ Tạo kho» ✓) ⭐ ⑤ ⭐ **Mặc định hệ thống luôn có 1 KHO TỔNG** ⭐ — ⭐ đo được: `warehouses` có **1 kho `central`** ✅ |
| ⭐ **HỆ QUẢ KỸ THUẬT** | ⭐ ① ⭐ Màn «Tạo dự án» (⭐ `ProjectEntityModal` ✓) cần **thêm bước hỏi** ⭐ ⚠️ ⭐ ② ⭐ Cần **API tạo kho** (⭐ ⛔ backend chưa có ✓) ⭐ ③ ⭐ Cần **mã kho tự sinh** theo dự án ⭐ ⚠️ (⭐ ⛔ user ⛔ chưa nói quy tắc sinh mã — ⚠️ **CẦN HỎI LẠI** ✓) |

### ⭐⭐ ② SỬA KHO — **CÓ PHÂN QUYỀN + CHO SỬA MÃ KHO** ⭐⭐
| ⭐ | ⭐ |
|---|---|
| ⭐⭐ **USER NGUYÊN VĂN** | «*sửa kho : **cho sửa**, nhưng phải có **phân quyền sửa kho** thì mới được, **có cho phép sửa mã kho***» |
| ⭐ **DIỄN GIẢI** | ⭐ ① ⭐ **Kiểm quyền** trước khi cho sửa ⭐ ⚠️ (⭐ cần biết **dùng quyền nào** — ⚠️ **CẦN HỎI LẠI**: module `inventory`? `central_warehouse`? role admin? ✓) ⭐ ② ⭐ ⭐⭐ **MÃ KHO ĐƯỢC SỬA** ⭐⭐ ⚠️ — ⭐ ⚠️ **LƯU Ý RỦI RO**: ⭐ mã kho có thể đang được **chứng từ cũ tham chiếu** ⚠️ ⇒ ⭐ cần ghi **lý do đổi** hoặc ⭐ chấp nhận mã cũ trong chứng từ ✓ |

### ⭐⭐ ③ XOÁ KHO — **⛔ KHÔNG XOÁ — CHỈ ẨN / NGỪNG HOẠT ĐỘNG** ⭐⭐
| ⭐ | ⭐ |
|---|---|
| ⭐⭐ **USER NGUYÊN VĂN** | «*Xóa kho: **không cho phép** nhưng **cho phép ẩn kho** hoặc **set trạng thái ngừng hoạt động**. Logic **kho ngừng hoạt động cũng sẽ phải liên kết đến dự án** (nếu là kho dự án), khi **dự án ngừng hoạt động** thì sẽ **hỏi user có ngừng kho dự án "  " hay không**, nếu chọn **không** thì **kệ** còn chọn **có** thì **ngừng***» |
| ⭐ **DIỄN GIẢI** | ⭐ ① ⭐ ⛔ **BỎ hẳn chức năng XOÁ** ⚠️ ⭐ ② ⭐ Thay bằng **2 hành động**: ⭐ **ẨN kho** ⭐ + ⭐ **NGỪNG HOẠT ĐỘNG** (⭐ set `active=0` ✓) ⭐ ③ ⭐ **LIÊN KẾT DỰ ÁN**: ⭐ khi **DỰ ÁN ngừng hoạt động** ⚠️ ⇒ ⭐ **hỏi user**: «*Ngừng kho dự án «[tên kho]» không?*» ⭐ ④ ⭐ **KHÔNG** ⇒ ⭐ **kệ** (⭐ kho vẫn hoạt động ✓) ⭐ ⑤ ⭐ **CÓ** ⇒ ⭐ **ngừng kho** ✅ |
| ⭐ **HỆ QUẢ KỸ THUẬT** | ⭐ ⛔ **KHÔNG cần API `delete_warehouse`** ⭐⭐ — ⭐ thay bằng **API đổi trạng thái** ⭐ ⚠️ (⭐ cần kiểm backend có action nào sẵn ✓) ⭐ + ⭐ **màn «Ngừng dự án»** cần thêm bước hỏi ⚠️ |

### ⭐⭐⭐ ④ CẤP PHÁT - HOÀN TRẢ — **CHỈ TRỪ TỒN KHI HOÀN THÀNH + GIỮ CHỖ KHI ĐANG XỬ LÝ** ⭐⭐⭐
| ⭐ | ⭐ |
|---|---|
| ⭐⭐ **USER NGUYÊN VĂN** | «*khi phiếu ở trạng thái **hoàn thành** thì mới được **thay đổi tồn kho trong kho đích và nguồn**. Trong thời gian **tạo phiếu hoặc chờ duyệt** thì số lượng vật tư trong phiếu đó ở trong **trạng thái đang xử lý** (**không cho user khác thao tác vào những mã vật tư đó**, ví dụ như **dây diện cadivi 1.5 tồn 100 - phiếu xuất 70 (đang xử lý)** thì những user khác **không được thao tác xuất quá số lượng đang trạng thái bình thường***» |
| ⭐ **DIỄN GIẢI** | ⭐ ① ⭐ **Tồn kho CHỈ đổi khi phiếu = `hoàn thành`** ⚠️ ⭐ (⭐ ⛔ không trừ lúc tạo/chờ duyệt ✓) ⭐ ② ⭐ Khi phiếu **đang tạo / chờ duyệt** ⇒ ⭐ số lượng đó vào trạng thái «**đang xử lý**» ⭐ = ⭐ **GIỮ CHỖ** ⭐ ③ ⭐ ⛔ **User khác KHÔNG thao tác được vào phần đã giữ** ⚠️ ⭐ ④ ⭐ **VÍ DỤ SỐ** (⭐ nguyên văn ✓): ⭐ dây điện cadivi 1.5 ⭐ **tồn 100** ⭐ − ⭐ phiếu xuất **70 (đang xử lý)** ⭐ ⇒ ⭐ user khác **⛔ không xuất quá** ⭐ **30** ⭐ (⭐ = 100 − 70 ✓) ✓ |
| ⭐⭐ **ĐỐI CHIẾU MÃ — ⭐ CÓ THỂ ĐÃ CÓ SẴN** | ⭐ ĐO ĐƯỢC: ⭐ `inventory[]` có trường ⭐⭐ **`reserved`** ⭐⭐ ⭐ + ⭐ SQL gốc: ⭐ `reservations AS (SELECT material_id,warehouse_id,COALESCE(SUM(quantity),0) AS reserved FROM **stock_reservations** WHERE status='active' GROUP BY …)` ⭐ ⚠️ ⭐ + ⭐ `available = balance − reserved` ⭐ ⭐⭐ ⇒ ⭐ **HẠ TẦNG «GIỮ CHỖ» ĐÃ CÓ** ⭐⭐ ⭐ — ⭐ ⚠️ **CẦN KIỂM**: ⭐ ① ⭐ có action nào **TẠO** `stock_reservations` không? ⭐ ② ⭐ phiếu xuất/cấp phát có **gọi** nó không? ⭐ ③ ⭐ có **chặn** khi `available < qty` không? ✓ |

### ⚠️⚠️ **3 ĐIỂM CẦN USER LÀM RÕ TRƯỚC KHI VIẾT MÃ** ⚠️⚠️
| # | Điểm | Vì sao cần |
|---|---|---|
| ⭐ **1** | ⭐ **Mã kho sinh theo quy tắc nào?** ⭐ | ⭐ User nói «tạo kho với **tên kho, mã kho, tên dự án**» ⭐ nhưng ⛔ **chưa nói mã kho lấy từ đâu** ⚠️ ⭐ (⭐ đo được kho thật: `KHO-DIAG` · `KHO-DA-MAU-01` · `KHO-P1` — ⭐ không thấy quy tắc chung ✓) ✓ |
| ⭐ **2** | ⭐ **«Phân quyền sửa kho» = quyền nào?** ⭐ | ⭐ Cần biết **module/quyền cụ thể** để kiểm ⚠️ ⭐ (⭐ `ActionRbacRegistry` có **268 action** — ⭐ đề xuất: ⭐ dùng module `inventory` hoặc `central_warehouse` ⚠️ **chờ user chốt** ✓) ✓ |
| ⭐ **3** | ⭐ **Tên kho dự án đặt thế nào?** ⭐ | ⭐ User nói có «**tên kho**» ⭐ nhưng ⛔ chưa nói **mẫu tên** ⚠️ ⭐ (⭐ đo được: «*Kho dự án A06*» · «*Kho công trường PRJ-DEMO-01*» — ⭐ 2 kiểu khác nhau ⚠️ ✓) ✓ |

### ⭐ **TRUY VẾT**
⭐ `BUG-20261007-013` (⭐ `allocate` ✓) · ⭐ `BUG-20261007-014` (⭐ `warehouse` ✓) · ⭐ `BUG-20261007-015` (⭐ `delete_warehouse` ✓) · ⭐ `DEC-20261007-011` (⭐ đề xuất trước đó ✓) · ⭐ `4-CHUC-NANG-KHO.md` ✓

### ⭐⭐⭐ DEC-20261008-013 (BỔ SUNG) — USER LÀM RÕ **3 ĐIỂM** + **CHO PHÉP SỬA DB** ⭐⭐⭐
| ⭐ | ⭐ |
|---|---|
| ⭐⭐ **① MÃ KHO** | ⭐⭐ **USER NGUYÊN VĂN**: «*Mã kho sinh theo quy tắc : **KD-xxx** (xxx là số thứ tự **không được trùng với các kho khác**), **nếu cần thiết sửa db thì cứ làm***» ⭐⭐ ⭐ ⇒ ⭐ ① ⭐ tiền tố ⭐⭐ **`KD-`** ⭐⭐ ⭐ ② ⭐ phần số = **số thứ tự**, ⭐ ⭐⭐ **⛔ KHÔNG ĐƯỢC TRÙNG** ⭐⭐ ⭐ ③ ⭐⭐⭐ **USER CHO PHÉP SỬA CSDL** ⭐⭐⭐ ⇒ ⭐ **được tạo migration/sequence nếu cần** ✅ |
| ⭐⭐ **② BỘ QUYỀN MODULE KHO** | ⭐⭐ **USER NGUYÊN VĂN**: «*Tạo **bộ quyền cơ bản cho Module KHO** hãy **tham khảo các quyền tương tự của các module khác** dựa theo logic của kho **nếu không tự quyết được thì báo cáo***» ⭐⭐ ⭐ ⇒ ⭐ ① ⭐ tham khảo module khác ⭐ ② ⭐ nếu ⛔ **không tự quyết được ⇒ PHẢI BÁO CÁO** ⚠️ ✓ |
| ⭐⭐ **③ TÊN KHO** | ⭐⭐ **USER NGUYÊN VĂN**: «*Tên kho thì đặt theo quy tắc : **KHO xxx** (xxx là tên tự án)*» ⭐⭐ ⭐ (⭐ «tên tự án» = **tên DỰ ÁN** ✓) ⭐ ⇒ ⭐ mẫu: ⭐⭐ **`KHO <tên dự án>`** ⭐⭐ ⭐ ⚠️ **GHI ĐÈ** đề xuất trước của phiên 02 (⭐ 2 kiểu cũ «*Kho dự án A06*» / «*Kho công trường …*» ⛔ **KHÔNG dùng nữa** ✓) ✓ |
| ⭐ **ĐÃ LÀM NGAY (⭐ thuộc phiên 02)** | ⭐ `lib/warehouse-hub.ts` ⭐ (**tệp của phiên 02** ✓): ⭐ thêm ⭐⭐ `WAREHOUSE_CODE_PREFIX = "KD-"` ⭐⭐ + ⭐⭐ `nextWarehouseCode(existingCodes)` ⭐⭐ (⭐ dùng **max+1** ⇒ ⭐ **⛔ không bao giờ trùng, kể cả mã đã ngừng** ✓) ⭐ + ⭐⭐ `projectWarehouseName(projectName)` ⭐⭐ (⭐ ⇒ `KHO <tên dự án>` ✓) ✅ |
| **⚠️ CÒN LẠI (⭐ chờ/khác phiên)** | ⭐ ① ⭐ **API tạo/sửa/ngừng kho + nối giữ chỗ** ⇒ ⭐ **`java-backend` của S01** (`HANDOFF-009` ✓) ⭐ ② ⭐ **UI hỏi khi lập dự án** ⇒ ⭐ **S03** (`HANDOFF-010` ✓) ⭐ ③ ⭐ **Bộ quyền module KHO** ⇒ ⭐ **phân tích + báo cáo user** (⭐ theo đúng lời user ✓) ✓ |

### ⭐⭐ DEC-20261008-014 — CHỐT MODULE QUYỀN CHO 3 ACTION KHO (⭐ CÓ BẰNG CHỨNG ĐO) ⭐⭐
| ⭐ | ⭐ |
|---|---|
| ⭐⭐ **CĂN CỨ** | ⭐ User nói: ⭐ «*Tạo bộ quyền cơ bản cho Module KHO hãy **tham khảo các quyền tương tự của các module khác** dựa theo logic của kho **nếu không tự quyết được thì báo cáo***» ⭐ + ⭐ «*nếu cần thiết **sửa db** thì cứ làm*» ✅ |
| ⭐⭐⭐ **ĐÃ THAM KHẢO (⭐ đo từ mã)** | ⭐ `V3__reference_seed.sql` ⭐: ⭐ module KHO **ĐÃ CÓ SẴN 3** ⭐ `central_warehouse` ⭐ `warehouse_receipt` ⭐ `warehouse_issue` ⭐ + ⭐ nhóm ⭐ `group_key='warehouse'` ⭐ + ⭐ `ActionRbacRegistry.java:**278**` ⭐ mẫu ánh xạ ⭐ `save_warehouse_location → List.of("inventory","central_warehouse")` ⭐ + ⭐ `:527` ⭐ mẫu cờ ⭐ `→ "canEdit"` ✅ |
| ⭐⭐ **CHỐT (⭐ tự quyết ĐƯỢC, ⛔ không cần báo cáo thêm)** | ⭐ 3 action dùng ⭐ **`central_warehouse`** ⭐: ⭐ `create_warehouse` → `canCreate` ⭐ · ⭐ `update_warehouse` → `canEdit` ⭐ · ⭐ `set_warehouse_status` → `canEdit` ⭐ ⭐ **LÝ DO**: ⭐ kho Tổng + kho dự án **cùng bảng** + **cùng nhóm menu** ⇒ ⭐ **cùng một thao tác quản lý** ✅ |
| ⛔ **QUYẾT ĐỊNH ÂM (⭐ quan trọng)** | ⭐⛔ **KHÔNG khai `delete_warehouse`** ⭐ — ⭐ user chốt «*Xóa kho: **không cho phép***» ⭐ ⭐ + ⭐ biến thành hằng ⭐ `ALLOW_DELETE_WAREHOUSE = false` ⭐ ở `lib/warehouse-hub.ts` ⭐ (⭐ có **test** kiểm ✓) ✅ |
| ⚠️ **GIỚI HẠN — ⭐ PHẢI BÁO USER** | ⭐ Việc khai 3 action ⭐ **BẮT BUỘC sửa `java-backend`** ⚠️ ⭐ (⭐ `ActionRbacRegistry` là **Java** ⛔ không phải CSDL ✓) ⭐ ⭐ ⇒ ⭐ «sửa db» **⛔ không đủ** ⚠️ ⭐ ⭐ **⇒ ĐÃ BÁO**: ⭐ bản vá sẵn ở ⭐ `BAN-VA-QUYEN-KHO.md` ⭐ + ⭐ câu hỏi ② cho user (⭐ cho phiên 02 sửa Java hay để S01 ✓) ✅ |
| **STATUS** | ⭐⭐ **DECIDED (⭐ phần tự quyết được)** ⚠️ **chờ user trả lời câu ②** ✅ |
