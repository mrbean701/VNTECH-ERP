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
