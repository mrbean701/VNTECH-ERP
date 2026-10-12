# DEV_LOG — SESSION_B (ERP-SESSION-02)

## DEV-20261006-001
Date: 2026-10-06 | Session: ERP-SESSION-02 | Module: Warehouse | Area: Frontend (khoi logic dung chung)
Development: Tao khoi THUAN lib/warehouse-hub.ts (~233 dong) — khong JSX, khong import UI => test duoc bang Node.
Technical Approach: Tach toan bo logic kho ra khoi component => (a) test bang node --import tsx --test, (b) khong phinh file man hinh, (c) tai dung cho ca hub lan man chi tiet.
Implementation: WAREHOUSE_HUB_TABS (3 tab) · WAREHOUSE_DETAIL_TABS (5 tab) · OUT_IN_SUBTABS · ALLOCATE_RETURN_SUBTABS · SEE_ALL_WAREHOUSE_ROLES=[director,admin] · canSeeAllWarehouses() · warehouseCards() · visibleWarehouseCards() · myProjectIds() · defaultOutInSubtab() · defaultAllocateReturnSubtab() · totalsForWarehouse() · inventoryRowsOfWarehouse().
Dependencies: KHONG them thu vien · KHONG API moi · KHONG migration.
Shared Components: dung lai ListToolbar · DataTable · StatusBadge · Kpi · CardHead tu lib/ui-shared (Goal §17 REUSE).
API: POST /api/system {action:"login"} roi GET /api/system.
Database: chi DOC — khong doi schema.
RBAC: ngoai le director (Ban Lanh dao) + admin (+ IT = admin, vi he thong KHONG co role it) => xem TAT CA kho; thao tac van theo quyen module.
Workflow: tab mac dinh cua subtab chon theo quyen user.
Result: tsc EXIT=0 · 22/22 test khoi thuan.

## DEV-20261006-002
Date: 2026-10-06 | Session: ERP-SESSION-02 | Module: Warehouse | Area: Frontend (man hinh)
Development: Viet lai app/screens/Inventory.tsx thanh HUB 3 TAB + them MAN CHI TIET KHO (thay modal cu).
Technical Approach: tabbar ngoai 3 tab; man chi tiet la early-return if (openWarehouseId) { ... } => la MAN, KHONG phai modal.
Implementation: data-vntech cho moi khoi (warehouse-cards · warehouse-detail-screen · warehouse-detail-back · wd-dashboard · wd-inventory · wd-io · wd-allocate-return · wd-staff) => DO DUOC phan bo tab.
Result: 10/10 khoi noi dung thuoc DUNG 1 tab (KHO=5 · XUAT&NHAP=3 · CAP PHAT=2) — truoc day moi khoi hien o MOI tab.

## DEV-20261006-003
Date: 2026-10-06 | Session: ERP-SESSION-02 | Module: Menu (Warehouse) | Area: Frontend (khai bao menu)
Development: GOM 7 muc -> 1 muc «Kho vat tu» trong lib/menu-helpers.ts.
Technical Approach: muc duy nhat { key:"warehouse_hub", label:"Kho vat tu", moduleKey:"inventory", permissionKeys:[6 khoa kho cu] } · allocateReturnMenuItems -> rong. app/page.tsx:506/523 dung menu tu CHINH 2 mang => KHONG phai sua app/page.tsx.
API: khong co API menu (menu la KHAI BAO TRONG CODE).
RBAC: gom CA 6 khoa kho DA CO => van 0 khoa module moi, khong dong module_catalog.
Result: do lai — label "Kho vat tu" = 1 lan · muc cu = 0 lan · het va cham view voi nhom «Cong viec».

## DEV-20261006-004
Date: 2026-10-06 | Session: ERP-SESSION-02 | Frontend / UI_UX / RBAC
Mô tả kỹ thuật:
1. **Tách màn mới** `app/screens/MaterialCategoryList.tsx` — theo đúng khuôn `MaterialListTable` (Phase 1 U-11):
   `DataTable` + `PermissionGuard` + `StatusBadge` + `CardHead`, state cục bộ cho search/filter/sort,
   xuất CSV qua `lib/tabular-export` (`downloadCsv`, ⛔ không tự viết lại logic Blob).
2. **Nguồn dữ liệu (đo thật, ⛔ không bịa)** — `scripts/system-route.mjs:674` + `:784`:
   `SELECT id,code,name,description,sort_order AS sortOrder,active FROM material_categories`.
   Nhánh `canEditCentral` quyết định `adminMaterialCategories` (bản đầy đủ) vs `materialCategories` (chỉ active=1)
   ⇒ màn đọc `data.adminMaterialCategories || data.materialCategories` như 2 màn anh em đang làm.
3. **RBAC** — 3 action hệ vật tư đều `requireRole(user,["admin"])` ⇒ UI:
   · Thêm/Sửa  → theo `permission.canEdit` (PermissionGuard, nút hiện nhưng disabled khi thiếu quyền)
   · Ẩn/Hiện · Xóa → `isAdminUser(data.user)`
4. **⭐ CHẶN XOÁ ĐÚNG NGHIỆP VỤ** — server chặn xoá hệ còn vật tư (`system-route.mjs:2728-2730`).
   UI phản ánh đúng: nút Xóa **disabled** khi `materialCount(c.id) > 0`, `title` giải thích lý do
   ⇒ không hứa xoá được. Ngoài ra có cột «Số vật tư» để user thấy trước khi bấm.
5. **Cơ chế ẩn/hiện tab** — giữ nguyên CSS `canonical.css:556-559` (`data-active-tab` + `details[data-tab]`);
   ⛔ **0 dòng CSS mới** vì vẫn còn đúng 3 tab.
6. **⭐ BẪY CRLF** — `app/page.tsx` dùng CRLF ⇒ `edit` tool khớp nhiều dòng thất bại (đã gặp ở TASK-226).
   Cách đúng: script Node tách `\r?\n`, sửa, ghi lại bằng `join(eol)` ⇒ **chỉ 8 dòng đổi, không đụng dòng khác**.
   ⛔ Script đếm `<details>` bằng regex trên từng dòng SAI vì các `<details>` lồng nằm CÙNG một dòng
   ⇒ dùng mốc rõ (từ dòng «CÔNG CỤ CHẨN LOẠN» đến dòng ngay trước `data-tab="0"`).

## DEV-20261007-005
Date: 2026-10-07 | Session: ERP-SESSION-02 | Frontend / UI_UX | Module: Kho vat tu (hub)
Mô tả kỹ thuật — DỌN GỌN tab «KHO» (5 thao tác, ⛔ không xóa chức năng):
1. **Bỏ 2 nhãn «Phạm vi dự án» trùng** — regex `<label className="list-toolbar-field"><span>Phạm vi dự án<\/span><strong className="filter-control">[\s\S]*?<\/strong><\/label>`
   ⇒ giữ **1 chỗ** là thanh chọn dự án ở đầu trang (do `app/page.tsx` render qua `ProjectScopeSelect`).
2. **Chuyển 2 nút vào toolbar**: «⇄ Chuyển kho» (`open("transfer")`) + «▤ Thẻ kho» (`printInventoryLedger(filtered)`)
   — trước ở dải tab lạ, nay thêm `data-vntech` để kiểm thử được.
3. **Bỏ hàng 3 KPI trùng** (`Số kho` / `Vật tư đang có` / `Phiếu xuất`) — đã có 4 KPI đầy đủ hơn ở trên.
4. **Bỏ dải tab lạ** `<div className="inventory-tabs">` (TỒN KHO | CHUYỂN KHO | THẺ KHO) — nằm TRONG tab KHO
   nên user dễ tưởng có **5 tab**; nay khối bảng chỉ còn `<section className="card" data-vntech="inventory-table-card">`.
5. **Bỏ danh sách kho thứ 2** (`inventory-warehouse-cards-card`) — trùng 12 cards ở khối «KHO».

⚠️ **BÀI HỌC KỸ THUẬT (ghi để lần sau không lặp):**
  · **LẦN 1 HỎNG**: cắt cả **vỏ bọc** `<div className="inventory-bottom-grid">` nhưng chỉ xoá `</div>}` ở cuối
    ⇒ **lệch JSX** (tsc báo `TS17008`/`TS17002`). ✅ CÁCH ĐÚNG: **chỉ xoá nguyên tố TRỌN VẸN** (từ thẻ mở đến
    thẻ đóng của CHÍNH nó), ⛔ không đụng vỏ bọc cha.
  · **KHÔI PHỤC AN TOÀN**: `git show HEAD:app/screens/Inventory.tsx > app/screens/Inventory.tsx`
    — **chỉ ĐỌC từ git**, ⛔ KHÔNG dùng `git checkout .` / `git reset --hard` (Goal §38).
    Kiểm chứng: `git diff --stat` **RỖNG** + `tsc EXIT=0` ⇒ nội dung khớp HEAD.
  · **`extra={}` sau khi bỏ nội dung ⇒ LỖI JSX** (`TS17000` — «attributes must only be assigned a non-empty expression»)
    ⇒ phải xoá **cả thuộc tính** `extra={}` chứ ⛔ không để rỗng.
  · **`Stop-Process` trên `local-server.mjs` làm CHẾT job runner của DSH** (2 lần, exit `4294967295`)
    ⇒ ✅ CÁCH ĐÚNG: **tách lệnh** hoặc — tốt hơn — **không dừng tiến trình cũ** khi cổng `8787` đã trống,
    chỉ `Start-Process` cái mới.

## DEV-20261007-006
Date: 2026-10-07 | Session: ERP-SESSION-02 | Frontend / UI_UX | Module: Danh mục vật tư + Kho vật tư
Mô tả kỹ thuật:
1. **Xoá `MaterialMatchingWorkspace`** (28 dòng, `app/page.tsx`) — theo yêu cầu user (c). Trước khi xoá, script
   **tự kiểm ⛔ không còn chỗ dùng** (bỏ qua dòng chú thích) ⇒ chỉ xoá khi thật sự mồ côi.
2. **Nút «?» bằng ĐÚNG khuôn `CardHead` có sẵn** — ⚠️ **BẪY ĐÃ GẶP**: lần đầu em truyền
   `action={<button …/>}` (ReactNode) ⇒ **`tsc` LỖI `TS2322`**: `CardHead.action` khai báo **`action?: string`**
   (`lib/ui-shared.tsx:230`), ⛔ không phải ReactNode. Sửa đúng:
   · `action={showHelp ? "Ẩn giải thích chỉ số" : "Giải thích chỉ số"}`
   · `onClick={()=>setShowHelp((v)=>!v)}`
   ⇒ **BÀI HỌC**: trước khi truyền prop cho component dùng chung, **phải đọc chữ ký thật** trong `lib/`.
3. **Bọc khối bằng `{showHelp && (<>…</>)}`** — ⚠️ **BẪY 2**: script sinh dòng đóng `}</>)}` (thừa `}`)
   ⇒ `tsc` lỗi `TS1381`. Sửa còn `</>)}`. ⇒ Khi sinh mã bằng script, **luôn chạy `tsc` ngay** để bắt lỗi cú pháp.
4. **`useState` chưa có import** trong `WarehouseDashboard.tsx` ⇒ thêm `import { useState } from "react";`
   (đặt ngay sau dòng `import` cuối cùng để giữ thứ tự).
5. ⭐ **`taskkill /F /PID` THAY ĐƯỢC `Stop-Process`** để dừng `local-server.mjs` — `Stop-Process` trong pwsh của DSH
   **làm chết job runner** (exit `4294967295`, gặp 2 lần); `taskkill` (tiến trình ngoài) **an toàn**.
   ⛔ Vẫn phải xác minh `CommandLine` chứa `scripts/local-server.mjs` trước khi kill (Goal §36).

## ⭐ DEV-20261008-005 — `TASK-231`: ÉP CARD CAO ĐỀU BẰNG CSS + QUÉT JARGON TỰ ĐỘNG ⭐
| ⭐ | ⭐ |
|---|---|
| **SESSION / TASK** | ⭐ `ERP-SESSION-02` · ⭐ `TASK-231` ✓ |
| ⭐⭐ **KỸ THUẬT ① — ÉP CHIỀU CAO ĐỀU** | ⭐ **ĐO** bằng `getBoundingClientRect()` trên **12 thẻ** ⇒ ⭐ phát hiện **2 mức cao**: ⭐ **202px (2 thẻ)** vs ⭐ **222px (10 thẻ)** ⚠️<br>⭐ **NGUYÊN NHÂN**: ⭐ thẻ kho `transit` ⛔ **không có dòng «Dự án:»** ⇒ ⭐ **thiếu 1 dòng ~20px** ✓<br>⭐ **GIẢI PHÁP**: ⭐ `.approved-inventory-screen .warehouse-card{ min-height:222px }` ⭐ — ⭐ dùng **đúng max đo được** ⭐ ⭐ ✅ **VÌ SAO `min-height` ⛔ không `height`**: ⭐ nếu sau này nội dung dài hơn (⭐ tên thủ kho dài ✓) ⭐ thẻ vẫn **tự cao lên**, ⛔ không tràn ✓ ⭐ ⭐ + ⭐ `align-items:stretch` của grid ⭐ đảm bảo **cùng hàng cùng cao** ✅ |
| ⭐⭐ **KỸ THUẬT ② — QUÉT JARGON TỰ ĐỘNG** | ⭐ Viết probe **duyệt mọi node LÁ** trong `.approved-inventory-screen` ⭐ (⭐ `e.children.length === 0` ⇒ ⭐ lấy **text trực tiếp**, ⛔ không lấy text của cha ✓) ⭐ rồi lọc theo **mẫu JARGON**: ⭐ tên bảng/cột CSDL · ⭐ `§` · ⭐ mã nội bộ `W-0x`/`MT3` · ⭐ `payload`/`backend`/`API` ✓<br>⭐ **VÌ SAO node LÁ**: ⭐ nếu lấy cả node cha ⭐ sẽ **trùng lặp** + ⭐ dính text của con ⚠️ ✓<br>⭐ **LỢI ÍCH**: ⭐ tìm được **19 đoạn** ⭐ trong khi mắt thường chỉ thấy vài đoạn ⭐ ⭐ ⇒ ⭐ **quét tự động > đọc bằng mắt** ✅ |
| ⭐⭐ **KỸ THUẬT ③ — REWORD ⛔ KHÔNG XOÁ PHẦN TỬ** | ⭐ Sau lỗi `data-inventory-source` ⚠️: ⭐ ⛔ **KHÔNG xoá `<p>`/`<Kpi>`** ⭐ mà **đổi CHUỖI `note`** ⭐ ⇒ ⭐ giữ nguyên **thuộc tính `data-*`** ⭐ mà test đòi ✓<br>⭐ **QUY TRÌNH MỚI (⭐ rút ra)**: ⭐ `grep tests/` + `grep app/` cho **từng chuỗi định xoá** ⭐ ⇒ ⭐ chỉ xoá khi **⛔ không nơi nào ràng buộc** ✓ |
| **CONFIG / CẤU HÌNH** | ⭐ ⛔ không đổi. ⭐ ⚠️ `globals.css` **vẫn kết thúc** bằng `/* VNTECH_MASTER_BASELINE_CSS_R1_1_1_END */` ✅ |
| **PERFORMANCE** | ⭐ ⛔ không ảnh hưởng (⭐ `min-height` thuần CSS ✓) ✓ |
| **TEST** | ⭐ `tsc=0` · ⭐ **`865 · 864 pass · 0 fail`** · ⭐ `BUILD ĐẠT` ✅ |

## ⭐ DEV-20261008-006 — `TASK-232/233`: BỎ CỘT DỮ LIỆU CHẾT + KỸ THUẬT AUDIT «CỘT vs Ô NHẬP» ⭐
| ⭐ | ⭐ |
|---|---|
| **SESSION / TASK** | ⭐ `ERP-SESSION-02` · ⭐ `TASK-232` + `TASK-233` ✓ |
| ⭐⭐ **KỸ THUẬT ① — BỎ NHÁNH HIỂN THỊ SAI** | ⭐ Ô «Trạng thái» ⭐ TỪ ⭐ `Number(active)===0?"Đã ẩn":String(reviewStatus\|\|"proposed")==="approved"?"Đã duyệt":"Đề xuất"` ⚠️ ⭐ ⇒ ⭐ THÀNH ⭐ `Number(active)===0?"Đã ẩn":"Đang dùng"` ✅<br>⭐ **VÌ SAO**: ⭐ `review_status` ⛔ **không bao giờ được ghi** từ đường Java (⭐ `MaterialCatalogStore.java:61` ✓) ⇒ ⭐ CSDL tự điền mặc định `'approved'` ⚠️ ⭐ ⇒ ⭐ «Đã duyệt» **⛔ không phản ánh sự thật** ⭐ ⭐ + ⭐ `\|\|"proposed"` ⭐ khiến **trường trống** bị hiện thành **«Đề xuất»** ⚠️ ✓ |
| ⭐⭐ **KỸ THUẬT ② — AUDIT «CỘT vs Ô NHẬP» (⭐ phương pháp MỚI)** | ⭐ **3 bước**: ⭐ ① ⭐ **liệt kê cột HIỂN THỊ** (⭐ trích `header: "…"` / `<th>` ✓) ⭐ ② ⭐ **liệt kê ô NHẬP** của modal sửa (⭐ trích `name="…"` + `<span>nhãn</span>` ✓) ⭐ ③ ⭐ **đối chiếu từng cột** ⇒ ⭐ cột nào **⛔ không có ô nhập** ⇒ ⭐ **nghi dữ liệu chết** ⚠️ ✅<br>⭐ **VÌ SAO CẦN**: ⭐ lỗi «*hiển thị nhưng ⛔ không ai ghi được*» ⭐ **⛔ không lộ ra khi đọc mã từng dòng** ⚠️ ⭐ mà chỉ lộ khi **ĐỐI CHIẾU 2 PHÍA** ✅<br>⭐ **KẾT QUẢ ÁP DỤNG**: ⭐ màn «Danh mục vật tư» ⭐ **3 tab** ⇒ ⭐ **chỉ 1 ca** (⭐ đã sửa ✓) ⭐ — ⭐ 2 tab còn lại **sạch** ✅ |
| ⭐ **KỸ THUẬT ③ — KIỂM 2 CHIỀU KHI SỬA CHỮ** | ⭐ Khi **bỏ/đổi 1 chuỗi** ⇒ ⭐ **đo CẢ 2 CHIỀU**: ⭐ (a) ⭐ **chuỗi cũ ĐÃ MẤT?** ⭐ + ⭐ (b) ⭐ **chuỗi mới ĐÃ HIỆN?** ⚠️ ⭐ ⭐ (⭐ lần này đo 2 chiều đã **tìm thêm 2 chỗ sót** ⭐ ở `:146` + `:243` ✓) ✓ |
| **TEST** | ⭐ `tsc=0` ⭐ **`866 tests · 865 pass · 0 fail`** ⭐ `BUILD ĐẠT` ✅ |

## ⭐ DEV-20261008-007 — `TASK-236/237`: KỸ THUẬT «GIỮ CHỖ» + «NGỪNG KHO THEO DỰ ÁN» ⭐
| ⭐ | ⭐ |
|---|---|
| **SESSION / TASK** | ⭐ `ERP-SESSION-02` · ⭐ `TASK-236` + `TASK-237` ✓ |
| ⭐⭐ **KỸ THUẬT ① — `availableToIssue` = TỒN − GIỮ CHỖ, ⭐ KẸP VỀ 0** | ⭐ Công thức ⭐ `balance − reserved` ⭐ — ⭐ ⚠️ **ĐIỂM QUAN TRỌNG**: ⭐ nếu `reserved > balance` (⭐ dữ liệu lệch ✓) ⭐ thì **KẸP VỀ 0** ⚠️ ⭐ ⛔ **KHÔNG trả số âm** ⭐ — ⭐ vì số âm ⛔ sẽ khiến **kiểm tra `qty > available` luôn đúng** ⇒ ⭐ **chặn MỌI phiếu xuất** ⚠️ ✅ ⭐ + ⭐ **chịu `reserved` thiếu/null** (⭐ payload ⛔ có thể không có trường này ✓) ⭐ + ⭐ **chịu chuỗi số** (`"100"`/`"70"` ✓) ✅ |
| ⭐⭐ **KỸ THUẬT ② — TÁCH «ĐỔI TỒN» KHỎI «GIỮ CHỖ» BẰNG TRẠNG THÁI** | ⭐ 2 hàm ⭐ **độc lập** ⭐: ⭐ `canChangeStockOnIssue(status)` ⭐ (⭐ ⛔ CHỈ `completed` ✓) ⭐ + ⭐ `isIssueHoldingStock(status)` ⭐ (⭐ `draft`/`pending_approval` ⇒ giữ chỗ ✓) ⭐ ⭐ **VÌ SAO TÁCH**: ⭐ theo user ⭐ «*khi phiếu ở trạng thái **hoàn thành** thì **mới được** thay đổi tồn kho*» ⚠️ ⭐ ⇒ ⭐ **2 câu hỏi KHÁC NHAU** ⭐ — ⭐ gộp lại sẽ ⛔ **không biểu diễn được** trạng thái trung gian ✅ |
| ⭐⭐ **KỸ THUẬT ③ — `projectDeactivationPrompt` ⭐ THUẦN HÀM, ⛔ KHÔNG SIDE-EFFECT** | ⭐ Trả ⭐ `{ shouldAsk, warehouses, message }` ⭐ ⭐ ⚠️ **VÌ SAO ⛔ KHÔNG tự ngừng**: ⭐ user chốt «*nếu chọn **không** thì **kệ***» ⚠️ ⭐ ⇒ ⭐ nếu hàm **tự ngừng** thì ⭐ **mất quyền quyết của user** ⚠️ ⭐ ⇒ ⭐ tách **CÂU HỎI** khỏi **HÀNH ĐỘNG** ✅ ⭐ + ⭐ lọc ⭐ **3 điều kiện**: ⭐ đúng `projectId` ⭐ + ⭐ `active !== 0` (⛔ không hỏi lại kho đã ngừng ✓) ⭐ + ⭐ `projectId` phải **có thật** (⛔ kho Tổng có `projectId = null` ⇒ ⛔ không dính ✓) ✅ |
| ⭐ **KỸ THUẬT ④ — HẰNG SỐ THAY VÌ CHUỖI RẢI RÁC** | ⭐ `WAREHOUSE_DEACTIVATE_ACTIONS` ⭐ + ⭐ `WAREHOUSE_DEACTIVATE_LABELS` ⭐ + ⭐ `ALLOW_DELETE_WAREHOUSE` ⭐ ⭐ **VÌ SAO**: ⭐ user chốt «***Xóa kho: không cho phép***» ⚠️ ⭐ ⇒ ⭐ biến nó thành **hằng `false`** ⭐ ⇒ ⭐ **test kiểm được** ⭐ và ⛔ **không ai vô tình bật lại** ✅ |
| **TEST** | ⭐ `TEST-048` **7/7** ⭐ + ⭐ `TEST-049` **7/7** ⭐ ⭐ **hồi quy `915 · 914 pass · 0 fail`** ⭐ ✅ |
