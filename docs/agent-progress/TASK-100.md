# TASK-100 — PHASE 5 (`W-02` + `W-01` + `W-04` + `W-03`): KHO VẬT TƯ

- **Mã:** TASK-100 · **Ngày:** 20/09/2026 · **Roadmap:** `docs/25_TODO_ROADMAP.md` §`PHASE 5 — KHO VẬT TƯ` (`W-01` · `W-02` · `W-03` · `W-04`)
- **Nguồn yêu cầu:** `W-02` «Audit quan hệ Project : Warehouse — xác nhận 1:N» · `W-01` «Tách 5 mục: Kho · Nhập · Xuất · Điều chuyển · Dashboard tồn kho» · `W-04` «Dashboard tồn kho: tổng · khả dụng · giữ chỗ · nhập · xuất · chờ chuyển · sắp hết · giá trị kho (§19)» · `W-03` «Khi tạo dự án: hỏi *"Tạo kho dự án?"* → Có thì tạo kho».
- **Trạng thái:** **`W-02` DONE** · **`W-01` DONE** · **`W-04` DONE** · **`W-03` BLOCKED** (chi tiết §8).
- **Quyết định đã chốt:** `W-01`/`W-04` theo **PHƯƠNG ÁN A — ĐÚNG KHUÔN `T-01`**: 5 mục menu khai **TRONG CODE**, cổng quyền trỏ **khoá ĐÃ CÓ** ⇒ **0 khoá module mới · 0 dòng `module_catalog` · 0 migration**. **KHÔNG build, KHÔNG khởi động/dừng dịch vụ** (đúng ĐIỀU CẤM của đề bài), nên mọi hợp đồng được chốt **ở tầng NGUỒN + tầng CSDL**, đúng cách `tests/t01-work-menu.test.mjs` đã làm.
- **Commit:** `97e480e` (`W-02`) · `b366e04` (`W-01`) · `8105168` (`W-04`) + commit tài liệu cuối cùng.

## 1. `W-02` — QUAN HỆ `Project : Warehouse` LÀ **1:N** — KẾT LUẬN **CONFIRMED**

Báo cáo audit đầy đủ: **`docs/agent-progress/W-02-AUDIT-PROJECT-WAREHOUSE.md`** (tệp riêng, bắt buộc).

| Tầng bằng chứng | Nội dung then chốt |
|---|---|
| **drizzle (ORM)** | `drizzle/0000_sour_gamma_corps.sql:328-344` — `` `project_id` text `` (**NULL-able**) + `FOREIGN KEY (\`project_id\`) REFERENCES \`projects\`(\`id\`)` ⇒ FK nằm ở **cột con** ⇒ **N kho / 1 dự án**; `UNIQUE` chỉ trên **`code`** (`:343`), `project_id` chỉ là **INDEX thường** (`:344`) |
| **Flyway `V1__baseline.sql`** | `:2209-2225` — `project_id VARCHAR(64) NULL`, `UNIQUE warehouses_code_uidx (code)`, `INDEX warehouses_project_idx (project_id)`, **KHÔNG có dòng FK nào** |
| **CSDL MySQL THẬT** | `SHOW CREATE TABLE warehouses` khớp Flyway; `information_schema.key_column_usage … referenced_table_name IS NOT NULL` ⇒ **0 dòng** ⇒ **FK KHÔNG được DB cưỡng chế** (kết luận vẫn CONFIRMED vì đó là *cardinality*, không phải *constraint*) |
| **Dữ liệu THẬT** | `warehouses` = **4** dòng · `projects` = **2** · **`PRJ-DEMO-01` → 2 kho** (một `site` `KHO-PRJ-DEMO-01` + một `team` `TD-PRJ-DEMO-01-TD-01`) · `DA-MAU-01` → 1 kho · **`WH-CENTRAL` (`KHO-TONG`, type `central`) có `project_id IS NULL`** ⇒ quan hệ **tuỳ chọn (0..N)** · **0 dòng mồ côi** |
| **Route THẬT** | `scripts/system-route.mjs:644` (đường ĐỌC `warehouses[]`), `:2404` (`… WHERE project_id=? AND type='site' … ORDER BY created_at **LIMIT 1**` — tác giả phải tự cắt "kho đầu tiên" ⇒ biết là N kho), `:2420/:2429/:2450/:2473` (**4 nhánh INSERT cùng một `projectId`**), `:1634-1637` (**kho TỔ ĐỘI** cũng mang `projectId`) |
| **Java** | `ProjectManagementUseCase.java:54-85` + `ProjectAdminStore.java:13,24,28` + `OpsTaskManagementUseCase.java:353-372` — cùng mô hình (ghi/đọc theo `project_id`, phải `firstSiteWarehouse` để xử lý nhiều kho) |
| **Đối chứng âm** | Không có `UNIQUE(project_id)` đơn cột ở **bất kỳ** migration nào (chỉ có UNIQUE **hỗn hợp** ở các bảng khác: `boq_import_batches` · `approval_stages` …) · không dòng `warehouses.project_id` trỏ tới dự án không tồn tại |

**Giới hạn đã ghi rõ trong báo cáo:** FK **không** được MySQL cưỡng chế; **không** có ràng buộc "mỗi dự án phải có ≥1 kho" (chỉ *ngầm* qua `create_project`); số đo là ảnh chụp 20/09/2026.

## 2. `W-01` — NHÓM MENU «KHO VẬT TƯ» TÁCH THÀNH **ĐÚNG 5 MỤC**

**Đã làm:** `lib/menu-helpers.ts` thêm khối `warehouseMenuItems` (5 mục) + `legacyWarehouseMenuKeys` (6 khoá cũ) + `warehouseMenuViewFor`; `app/page.tsx` dựng 5 mục ở **CẢ menu desktop LẪN menu mobile**.

| # | Nhãn (nguyên văn) | Cổng quyền (khoá **ĐÃ CÓ**) | Đích đến THẬT |
|---|---|---|---|
| 1 | **Kho** | `central_warehouse` | màn `CentralWarehouse` (nhánh `active === "central_warehouse"` — giữ nguyên) |
| 2 | **Nhập** | `warehouse_receipt` | màn Nhập kho (nhánh `active === "warehouse_receipt"` — giữ nguyên) |
| 3 | **Xuất** | `warehouse_issue` | màn Xuất kho (nhánh `active === "warehouse_issue"` — giữ nguyên) |
| 4 | **Điều chuyển** | `inventory` | màn `Inventory` tab «Tồn kho» (nhánh `active === "inventory"`) |
| 5 | **Dashboard tồn kho** | `stocktake` | **TAB** «Dashboard tồn kho» của `Inventory` (`view="dashboard"` — **KHÔNG màn mới, KHÔNG route mới**) |

- **Cổng quyền THẬT:** `item.permissionKeys.find((key) => modulePermission(data, key).canView)` — **KHÔNG** hardcode admin, **KHÔNG** khoá mới. 5 cặp khoá **phân biệt**.
- **6 khoá CŨ bị ẨN KHỎI MENU** (`warehouse_receipt` · `warehouse_issue` · `inventory` · `stocktake` · `material_norms` · `central_warehouse`) nhưng **khoá vẫn SỐNG**: giữ quyền · tiêu đề màn · tìm kiếm · **cả 6 nhánh render** trong `app/page.tsx` đều còn (`grep` từng khoá).
- **Huy hiệu nhóm KHÔNG TỤT:** `warehouseMenuBadge(keys)` cộng theo `badgeKeys` của 5 mục, áp ở **cả desktop lẫn mobile** (cùng cách `T-01` xử lý) — nếu không, huy hiệu nhóm sẽ về 0 vì 6 khoá cũ bị ẩn.
- **Nhóm vẫn sống khi `children` rỗng:** điều kiện lọc `groupTree` thêm nhánh `warehouse && warehouseMenuChildren.length > 0`; nhánh mobile "single child ⇒ điều hướng thẳng" **loại trừ `groupKey === "warehouse"`**.

### ⚠️ 2 KHOÁ CŨ KHÔNG CÒN MỤC MENU — GHI RÕ, KHÔNG GIẤU

`material_norms` («Định mức vật tư») là khoá **duy nhất** trong 6 khoá cũ không được mục nào trỏ tới (5 mục bắt buộc chỉ cần 5 cổng). Vì đề bài chốt **ĐÚNG 5 mục**, khoá này **không còn lối vào từ menu** — **chức năng chưa bị xoá** (nhánh render + quyền riêng vẫn nguyên) nhưng người dùng không đi tới được bằng menu nữa. `stocktake` thì **đã tái dùng** làm cổng cho mục «Dashboard tồn kho» nên vẫn có lối vào (màn Kiểm kê cũ vẫn render khi `active === "stocktake"`).
⇒ **CẦN NGƯỜI DÙNG QUYẾT** (§8 câu 2): (a) giữ đúng 5 mục như hiện tại, (b) cho phép thêm 1 mục thứ 6 «Kiểm kê · Định mức», hay (c) gộp 2 màn đó thành tab trong màn Tồn kho.

## 3. `W-04` — TAB «DASHBOARD TỒN KHO»: ĐỦ **8 CHỈ SỐ** (§19)

**Đã làm:** `app/screens/WarehouseDashboard.tsx` (khối thuần `W04-PURE-BEGIN/END` + UI) gắn vào `app/screens/Inventory.tsx` dưới dạng **tab thứ 2** (`WAREHOUSE_TABS = ["Tồn kho", "Dashboard tồn kho"]`). Tab «Tồn kho» **giữ nguyên** toàn bộ nội dung cũ.

| # | Chỉ số §19 | Nguồn THẬT (đã đo trên payload) |
|---|---|---|
| 1 | Tổng tồn | `inventory[].balance` (Σ nhập − Σ xuất theo `stock_movements` — `system-route.mjs:651`) |
| 2 | Khả dụng | `inventory[].available` (= `balance` − `reserved`) |
| 3 | Giữ chỗ | `inventory[].reserved` (Σ `stock_reservations.status='active'`) |
| 4 | Nhập | `receipts[].acceptedQty` (giữ `actualDeliveredQty` làm dự phòng — `:661`) |
| 5 | Xuất | `issues[].totalQty` (`:671`) |
| 6 | Chờ chuyển | `transferOrders[]` **chưa** `received`/`cancelled` (`:673`) |
| 7 | Sắp hết | `inventory[]` có `minStock > 0` **và** `available < minStock` (mức 0 = "chưa đặt", KHÔNG phải "đã hết") |
| 8 | **Giá trị kho** | **«chưa có nguồn»** + lý do (xem dưới) — kèm chỉ số PHỤ «Giá trị theo giá chuẩn danh mục» = `Σ(inventory[].balance × materials.standardPrice)` |

- **KHÔNG gọi API mới:** khối thuần **không** có `fetch(`/`action(`/`await`; mọi khoá đọc ra đều **đã có** trong `AppData` (`lib/ui-shared.tsx:196-197`) và **đã được bootstrap trả thật** (đo `GET /api/system` trên Java 18081: `inventory` 28 dòng · `receipts` 15 · `issues` 2 · `transferOrders` 0 · `warehouses` 4).
- **KHÔNG hardcode số:** test cấm `value="<số>"` trong khối UI; cả 8 KPI đều nhận biểu thức từ `metrics`.
- **In rõ NGUỒN + số dòng THẬT:** `inventorySourceOf()` phân biệt **«0 dòng»** với **«cột rỗng»**, cả hai đều KHÔNG hiện 0 (đúng khuôn `T-08`).

### 🔴 ĐỐI CHỨNG ÂM «GIÁ TRỊ KHO» — KHÔNG BỊA SỐ

Giá vốn thật chỉ nằm ở **`stock_movements.unit_cost`**. Đo được:
1. **Payload KHÔNG trả khoá `stockMovements`** (đo thật: các khoá liên quan chỉ có `stockCounts` · `contractStockLedger` · `contractStockBalances` · `stockReconciliations`);
2. và trên CSDL thật **`stock_movements.unit_cost` = 0 ở mọi dòng** (5/5) ⇒ kể cả có khoá cũng **không phải giá vốn**.

⇒ Ô «Giá trị kho» hiện **«chưa có nguồn»** + lý do cụ thể, và **CỐ Ý KHÔNG** lấy `purchase_order_items.unitPrice` thay thế (cột đó cũng đang = **0** trên dữ liệu thật ⇒ sẽ in "0 đ" SAI). Chỉ số PHỤ dùng `materials.standardPrice` (13/14 vật tư có giá) và **nói rõ «KHÔNG phải giá vốn»** + chỉ ghi nguồn `materials`, không gọi là giá vốn.

## 4. HỢP ĐỒNG CHẠY ĐƯỢC (4 tệp mới)

| Tệp | Số ca | Nội dung |
|---|---|---|
| `tests/w02-project-warehouse-relation.test.mjs` | **10 ĐẠT** | kết luận CONFIRMED + 5 chữ ký bằng chứng + **đọc CSDL MySQL THẬT** (`SHOW CREATE TABLE`, `information_schema`, `projects × warehouses`) + đối chứng âm UNIQUE/mồ côi |
| `tests/w01-warehouse-menu.test.mjs` | **8 ĐẠT** | đúng 5 mục/nhãn/thứ tự · 5 cổng quyền phân biệt ∈ khoá đã có · **0 khoá module mới** (quét `ModuleKey` + `MODULE_KEYS` + **mọi** migration `drizzle/`) · 6 khoá cũ bị ẩn nhưng **6 nhánh render còn nguyên** · huy hiệu · đích đến |
| `tests/w04-inventory-dashboard.test.mjs` | **6 ĐẠT** | đủ 8 chỉ số §19 · **chạy thật khối thuần** trên fixtures và đối chiếu phép đếm tay (65/55/10/100/15/1/1) · cấm `fetch(`/`action(`/`await`/hardcode · **đối chứng âm giá trị kho** |
| `tests/w03-project-warehouse.test.mjs` | **5 ĐẠT** | action THẬT tồn tại (không bịa API) · câu hỏi Có/Không chỉ khi tạo mới · **nhánh «Không» bị chặn có giải thích** · đối chứng âm (server không đọc cờ bỏ kho) |

**ĐỎ → XANH (đủ cả 4):** mỗi tệp được viết **TRƯỚC** khi sửa mã và đã chạy để thấy **fail** (W-02 10 ca đỏ vì chưa có tệp audit/test đầu; W-01 **8/8 đỏ**; W-04 đỏ vì `WarehouseDashboard.tsx` chưa tồn tại; W-03 **4/6 đỏ**), sau đó mới sửa mã để **xanh**. 3 lỗi của chính TEST đã tự phát hiện và sửa (không nới lỏng khẳng định): regex `UNIQUE(project_id` bắt nhầm **UNIQUE hỗn hợp** của bảng khác ⇒ siết còn **đơn cột**; đọc chữ `unitPrice` trong **chuỗi giải thích** ⇒ chỉ soi **truy cập dữ liệu**; tên tệp audit sai ⇒ sửa cho khớp.

## 5. 8 CỔNG BẮT BUỘC — KẾT QUẢ

| # | Cổng | Kết quả |
|---|---|---|
| 1 | `npx tsc --noEmit` | **EXIT 0** (0 lỗi) |
| 2 | `npm run lint` | **0 error** · **181 warning** (đúng nền; nhánh này **không phát sinh warning mới**) |
| 3 | `npm run test:regression` | **69/69 PASS · 0 FAIL** |
| 4 | `npm run test:workflow` | **passed** (`Workflow VNTECH ERP V5.3.0 FULL W2 passed: five-stage approvals/email/SLA → …`) |
| 5 | 4 tệp test mới | **29 ca ĐẠT · 0 HỎNG** (10 + 8 + 6 + 5) |
| 6 | `node --import tsx tests/t01-work-menu-probe.mjs` | **7 ĐẠT · 0 HỎNG** |
| 7 | `node tools/probe-project-screen.mjs` | **ĐẠT** (dải 6 tab + toolbar cân đối) |
| 8 | `node tools/probe-work-item-field-contract.mjs` | **18/18 ĐẠT · 0 HỎNG · 2 GHI NHẬN** (không tệ hơn nền) |

**Hồi quy hẹp phải sửa cho ĐÚNG (không nới lỏng):** `tests/mobile-menu-interaction.test.mjs:37` khoá cứng chuỗi `directChild=singleChild&&groupKey!=="site_command"?singleChild:null`; nhánh `W-01` **cố ý** thêm điều kiện loại trừ `warehouse` ⇒ cập nhật phép kiểm cho khớp **hành vi mới**, vẫn giữ nguyên tinh thần "nhóm 1 mục con thì điều hướng thẳng".

## 6. `probe-roadmap-progress.mjs` SAU KHI SỬA HỒ SƠ

```
Tổng số mục đọc được: 110
PHÂN LOẠI NGUYÊN VĂN CỘT TT:
  DONE         76 / 110  (69.1%)
  BLOCKED       2 / 110  (1.8%)     ← F-01 (nền) + W-03 (mới)
  TODO         32 / 110  (29.1%)
THEO PHASE:
  PHASE 5 — KHO               3/4    (chặn 1)
```

⇒ **76/110 = 69,1 %** (73 → **+3** đúng bằng số mục đóng thật `W-01` · `W-02` · `W-04`) · **PHASE 5 = 3/4** (không phải 4/4 vì `W-03` bị chặn — **không** ghi khống).

## 7. PHẠM VI TỆP ĐÃ ĐỘNG VÀO

| Tệp | Thay đổi |
|---|---|
| `lib/menu-helpers.ts` | + `warehouseMenuItems` · `legacyWarehouseMenuKeys` · `warehouseMenuViewFor` · type `WarehouseMenuView` |
| `app/page.tsx` | CHỈ vùng menu KHO + nhánh render `inventory` + `ProjectModal` (W-03): import, state `warehouseMenuView`, `warehouseMenuChildren`, `warehouseMenuBadge`, ẩn 6 khoá cũ, dựng 5 mục ở 2 menu, câu hỏi «Tạo kho dự án?» |
| `app/screens/Inventory.tsx` | + 2 tab (`WAREHOUSE_TABS`), prop `view`, nhánh render dashboard |
| `app/screens/WarehouseDashboard.tsx` | **MỚI** — 8 chỉ số §19 (khối thuần + UI) |
| `tests/w0*.test.mjs` (4 tệp) | **MỚI** — hợp đồng từng mục |
| `tests/mobile-menu-interaction.test.mjs` | cập nhật 1 phép kiểm cho khớp hành vi mới |
| `docs/25_TODO_ROADMAP.md` | CHỈ ô `TT` của `W-01`/`W-02`/`W-04` = `**DONE**`, `W-03` = `**BLOCKED**` |
| `docs/agent-progress/MASTER_STATUS.md` | CHỈ các ô số: DONE **73 → 76** · % **66,4 → 69,1** · BỊ CHẶN **1 → 2** · TODO **36 → 32** · dòng `PHASE 5 — KHO` **0/4 → 3/4** |
| `docs/agent-progress/W-02-AUDIT-PROJECT-WAREHOUSE.md` | **MỚI** — báo cáo audit |
| `docs/agent-progress/TASK-100.md` + `TASK_INDEX.md` | **MỚI** / + 1 dòng chỉ mục |

**KHÔNG đụng:** `drizzle/**` · `java-backend/**` · `AGENTS.md` · `docs/28_*` · mọi `.docx`/`.xlsx` · `docs/agent-progress/TASK-094…099.md` · menu nhóm Công việc/Dự án đã chốt.

## 8. ⛔ `W-03` **BLOCKED** + 3 CÂU CẦN NGƯỜI DÙNG QUYẾT

### `W-03` — nhánh «Không» KHÔNG thi hành được (đã DỪNG đúng chỉ đạo)

**Việc ĐÃ LÀM ĐƯỢC (đã commit trong `W-01`/`W-04`… thực tế nằm ở commit `W-01`):** biểu mẫu tạo dự án nay **hỏi thật** «Tạo kho dự án?» với 2 nhánh radio **Có / Không** (chỉ hiện khi **TẠO MỚI**), dẫn căn cứ `W-02` (1:N + `project_id` NULL-able), và **nhánh «Có» chạy trọn vẹn** qua action THẬT `create_project`.

**Lý do nhánh «Không» bị CHẶN — 3 chứng cứ đo được:**
1. `scripts/system-route.mjs:2438-2454` — `create_project` **LUÔN** `INSERT INTO warehouses` (câu INSERT nằm trong `env.DB.batch` cố định); **không có tham số nào** để bỏ kho (đã `grep`: 0 lần `createWarehouse`).
2. **Không tồn tại action xoá/ngưng kho riêng** — chỉ `delete_project_team` xoá kho của **tổ đội** (`:1650`); `grep action === "(delete_warehouse|remove_warehouse|create_warehouse|save_warehouse)"` = **0**.
3. Muốn thi hành phải sửa `scripts/system-route.mjs` — nhưng **`scripts/**` nằm trong DANH SÁCH CẤM** của đợt PHASE 5 ⇒ theo đúng chỉ đạo *"nếu buộc sửa tệp khác ⇒ DỪNG, báo BLOCKED"*, **đã DỪNG** (bản sửa thử đã được **hoàn nguyên**, `git checkout -- scripts/system-route.mjs`, xác nhận 0 lần `createWarehouse`).
4. **KHÔNG im lặng:** chọn «Không» ⇒ hiện khối cảnh báo đỏ (`data-project-warehouse-blocked`) nói rõ nguyên nhân + **khoá nút lưu** (`disabled={warehouseBlocked}`) ⇒ người dùng KHÔNG bị tạo kho trái ý mà không biết.

**Đề xuất để gỡ chặn (chọn 1):**
- **(A) Cho phép sửa máy chủ** — sửa **~4 dòng** trong `scripts/system-route.mjs` (`create_project`): đọc cờ `createWarehouse`, dựng mảng `statements` rồi `if (createWarehouse !== false) statements.push(INSERT kho)`. **Tương thích ngược** (client cũ không gửi cờ ⇒ vẫn tạo kho). Rủi ro thấp, dễ kiểm bằng 1 probe sống (tạo dự án tạm → đếm `warehouses` → xoá).
- **(B) Mở rộng phạm vi cho `scripts/**`** ở đợt sau và làm cùng lúc với `W-03`.
- **(C) Giữ nguyên hành vi cũ** (luôn tạo kho) và **bỏ hẳn câu hỏi** — coi «Tạo kho dự án?» là không cần thiết.

### 3 câu cần người dùng quyết

1. **`W-03`:** chọn (A) cho sửa `scripts/system-route.mjs`, (B) hoãn, hay (C) bỏ câu hỏi? *(Mặc định tôi giữ nguyên: câu hỏi có mặt, nhánh «Không» chặn có giải thích, `W-03` = `BLOCKED`.)*
2. **`W-01` — 2 khoá không còn lối vào menu:** `material_norms` («Định mức vật tư») mất lối vào menu (chức năng còn nguyên). Chọn: (a) giữ **đúng 5 mục** như hiện tại, (b) thêm **mục thứ 6** «Kiểm kê · Định mức», hay (c) gộp 2 màn `stocktake`/`material_norms` thành **tab** trong màn Tồn kho?
3. **`W-04` — «giá trị kho»:** hiện ghi **«chưa có nguồn»** vì `unit_cost` không vào payload (và đang = 0 trên CSDL). Chọn: (a) giữ nguyên (đúng — không bịa), (b) cho phép **bổ sung `stockMovements` vào payload** (cần sửa bootstrap Java/JS — ngoài phạm vi đợt này), hay (c) dùng **giá chuẩn danh mục** làm giá trị chính (có ghi chú rõ «không phải giá vốn»)?
