# TASK-023 — KIỂM PHẠM VI DỰ ÁN/KHO (PROJECT & WAREHOUSE SCOPE)

> **TRẠNG THÁI: DONE — 64/64 action.**
> Cổng `tools/probe-action-scope-parity.mjs` **exit 0**; hồi quy **cổng ảnh 28/28 ĐẠT (0 px)**;
> `tools/probe-live-stack.mjs` **ALL PASS**; jar béo **BUILD SUCCESS** và `/actuator/health` = UP.

## LÔ 8 — 10 action cuối (8a: 7 action · 8b: 3 action)

### Lô 8a — OpsTask (3) + Request (2) + AdminOps (1) + AdminSystem (1 kiểm KHO)

| Action | Ghi chú |
|---|---|
| `create_work_item` | JS viết `if(projectId && …)` ⇒ kiểm **CÓ ĐIỀU KIỆN**; công việc phòng ban không gắn dự án vẫn hợp lệ. **Không được** biến thành kiểm vô điều kiện (sẽ chặn oan toàn bộ luồng giao việc nội bộ) |
| `create_project_team` | "CHT chỉ được tạo tổ đội trong dự án được phân quyền." |
| `save_mar_approval` | dự án từ payload |
| `create_request` / `decide_approval` | `decide_approval` lấy `mr.projectId` tra từ DB |
| `preview_request_import` | dự án từ payload |
| `save_warehouse_location` | **kiểm KHO** — cần thêm đường ống `warehouseScopeKind` cho `AdminSystemUseCase` (Principal + principalAsCurrent + `asAdminPrincipal`) |

### Lô 8b — ProjectContractUseCase (3)

Lớp này có chú thích ghi rõ: *"quyền theo canAccessProject — **check ở web**"* ⇒ thiết kế gốc **chủ đích**
kiểm ở tầng web. Đã làm đúng thiết kế đó:

| Action | Cách kiểm |
|---|---|
| `save_project_contract` | kiểm **ngay ở controller** (`projectId` có sẵn trong payload) — JS L801 |
| `set_project_contract_status` | phải tra bản ghi để lấy `row.project_id` (JS L809) ⇒ đưa `Principal` vào phương thức |
| `delete_project_contract` | như trên (JS L813) |

`ProjectContractUseCase` nhận thêm `AccessScopeService`; `SystemController` nhận thêm `AccessScopeService`
ở constructor + helper `asProjectContractPrincipal`.

### Cổng đối chiếu được mở rộng đúng lúc

Sau lô 8b cổng vẫn báo **63/64** vì nó chỉ soi **thân use-case**, mà `save_project_contract` kiểm **ở controller**.
Đã bổ sung: nếu **chính case của controller** có dấu vết kiểm phạm vi thì tính là đã kiểm
(ghi rõ trong mã cổng là để phản ánh thiết kế "check ở web"). Kết quả: **64/64, exit 0**.

## LỖI THỨ NĂM CỦA CÔNG CỤ VÁ — cùng gốc "neo không duy nhất / kiểm quá rộng"

1. **Dương tính giả lần thứ hai** ở `asAdminPrincipal`: phép kiểm "đã có override chưa" dùng **cửa sổ 900 ký tự**
   kể từ chữ ký helper, mà helper liền sau (`asPurchasePrincipal`) có override đó ⇒ cửa sổ bắt sang helper khác
   ⇒ bỏ qua nhầm. **Phát hiện bằng cách đọc lại code**, không tin kết quả "bỏ qua".
   Đã vá bằng neo gồm **cả chữ ký hàm** + **kiểm chứng sau khi sửa** (override phải nằm trong đúng thân hàm).
2. **Thứ tự kiểm idempotency bị sai** (nguyên nhân của cả 4 lỗi trước): với phép "chèn sau dòng neo",
   `from` (dòng neo) **vẫn còn** sau khi chèn ⇒ kiểm `from` trước làm lần chạy thứ hai **chèn lặp**.
   **Đã sửa gốc:** kiểm `to` (nội dung đã-áp-dụng) **TRƯỚC** `from`.
3. Nhờ sửa (2) đã phát hiện và gỡ thêm **1 import bị lặp** (`RbacService` trong OpsTask) —
   script dọn `tools/cleanup-duplicate-requirerole.mjs` nay xử lý **cả import lặp**.

## BÀI HỌC VẬN HÀNH (TASK-028)

Cổng ảnh từng báo **28/28 lệch ~96%** — trông như hồi quy giao diện nhưng **không phải**: tiến trình Java
khởi động bằng `Start-Process` **đã chết**, proxy :9000 trả **502**, nên cả UI không có dữ liệu.
**Thứ tự chẩn đoán đúng: 4 cổng → health → `probe-live-stack` → cổng ảnh.**
Đã ghi vào `docs/29` mục 6.6–6.7: **không dùng `Start-Process` cho Java API**; dùng background job có quản lý.

## CỔNG NGHIỆM THU (theo §11)

| Bước | Bằng chứng |
|---|---|
| Yêu cầu đã hiểu | đối chiếu nguyên văn 64 lời gọi JS |
| Kiến trúc đã kiểm | `AccessScopeService` + port `AccessScopeStore` dùng chung, không vá rải rác |
| Implementation | **64/64** action |
| Frontend tested | **cổng ảnh 28/28 ĐẠT, 0 px** |
| Backend tested | `verify-java-compile.ps1` 102 tệp · 0 lỗi; `mvn package` **BUILD SUCCESS** |
| API tested | `probe-live-stack.mjs` **ALL PASS** |
| Database validated | probe-live-stack: 61 module · 5 bước duyệt · 484 quyền |
| Permission validated | `probe-action-scope-parity` **exit 0** · `probe-action-role-parity` **exit 0** |
| Workflow validated | 5 bước duyệt đọc được từ DB |
| Regression checked | cổng ảnh 28/28 ĐẠT |
| Git diff reviewed + commit | #24…#33 |
| Tài liệu | `TASK-023.md` · `TASK_INDEX.md` · `MASTER_STATUS.md` · `docs/29` |

## Objective

Bịt lỗ hổng P0: bản JS chặn nghiệp vụ theo **phạm vi** dự án/kho, bản Java **không kiểm gì**.

## Master Task Requirement

* §7 — Kiểm quyền phải ở backend (không chỉ ẩn nút ở frontend).
* §36 — Ưu tiên **P0 — Data integrity / Security / Permission / Workflow correctness**.
* §26 — Mọi thay đổi phải kiểm xuyên suốt Frontend → API → Backend → Database → Permission → Workflow.

## Previous State

* Java **không có** hàm kiểm phạm vi nào ở tầng application; chỉ `FileUseCase` dùng
  `FileStore.projectScopePermission` cho việc tải/xóa tệp.
* `ProjectScopeStore` chỉ có `findProjectIdsByUserId` (danh sách), **thiếu mức quyền**.
* `AdminSystemUseCase.java:116` có ghi chú *"JS kiểm tra canAccessProject"* — tức bản port **biết** yêu cầu
  này mà đã bỏ qua.

## Implemented (lô 1 — hạ tầng dùng chung)

### 1. Port mới `AccessScopeStore` (application/port/out)

Ba truy vấn, phản chiếu đúng ba truy vấn của JS `scripts/system-route.mjs:215-242`:

| Phương thức | Truy vấn |
|---|---|
| `projectScopePermission(userId, projectId)` | `SELECT permission FROM user_project_scopes WHERE user_id=? AND project_id=?` |
| `warehouseScopePermission(userId, warehouseId)` | `SELECT permission FROM user_warehouse_scopes WHERE user_id=? AND warehouse_id=?` |
| `findActiveWarehouseBasic(warehouseId)` | `SELECT id,type,project_id AS projectId FROM warehouses WHERE id=? AND active=1` |

### 2. Adapter `AccessScopeStoreAdapter` (infrastructure)

Native SQL qua `JdbcTemplate`, khớp từng chữ với JS.

### 3. Dịch vụ dùng chung `AccessScopeService` (application/rbac)

Port **nguyên trạng** hai hàm JS, giữ đúng từng nhánh:

```text
canAccessProject(userId, role, projectId, write):
  admin → true
  projectId rỗng → false
  không có dòng user_project_scopes → false
  write=false → true;  write=true → permission ∈ {write, approve, admin}

canAccessWarehouse(userId, role, warehouseScopeKind, warehouseId, write):
  admin → true
  kho rỗng / không tồn tại / inactive → false
  base_role = warehouse:
      warehouseScopeKind (mặc định "site") phải khớp loại kho (site/central)
      phải có dòng user_warehouse_scopes; nếu write thì permission ∈ {write, approve, admin}
      kho site  → còn phải qua canAccessProject của dự án chứa kho
      kho central → true
  kho central (vai trò khác) → canUseModule(central_warehouse) HOẶC canUseModule(material_catalog)
  còn lại → theo phạm vi dự án của kho
```

Kèm `requireProjectAccess(...)` / `requireWarehouseAccess(...)` ném **403** với đúng thông điệp của JS.

### 4. Đăng ký bean

`accessScopeService(AccessScopeStore, ModulePermissionStore)` trong `ApplicationBeansConfig`.

### 5. Nối action đầu tiên — `cancel_request`

JS kiểm `canAccessProject(user, mr.projectId, true)` **TRƯỚC** khi kiểm vai trò (JS dòng 1048 rồi 1050).
Java nay làm đúng thứ tự đó.

## Frontend Changes

Không.

## Backend Changes

* 3 tệp mới: `AccessScopeStore.java`, `AccessScopeStoreAdapter.java`, `AccessScopeService.java`.
* `ApplicationBeansConfig`: thêm bean + truyền vào `RequestManagementUseCase`.
* `RequestManagementUseCase`: thêm trường/constructor `AccessScopeService`, kiểm phạm vi trong `cancel_request`.
* `tools/probe-action-scope-parity.mjs` (mới) — cổng đo tiến độ.

## API Changes

Không thêm/bớt action. `cancel_request` nay **thực sự** kiểm phạm vi dự án (trước không).

## Database Changes

**Không có.** Chỉ ĐỌC hai bảng sẵn có `user_project_scopes`, `user_warehouse_scopes` và bảng `warehouses`.

## Permission Changes

* `cancel_request`: nay từ chối (403) khi tài khoản không có phạm vi dự án của phiếu.
* **62 action còn lại vẫn CHƯA kiểm phạm vi** — đây là lỗ hổng đang tồn tại và đã được đo.

## Workflow Changes

Không.

## Files Changed

```
java-backend/application/src/main/java/com/vntech/erp/application/port/out/AccessScopeStore.java   (mới)
java-backend/application/src/main/java/com/vntech/erp/application/rbac/AccessScopeService.java    (mới)
java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/AccessScopeStoreAdapter.java (mới)
java-backend/application/src/main/java/com/vntech/erp/application/service/RequestManagementUseCase.java
java-backend/web/src/main/java/com/vntech/erp/web/config/ApplicationBeansConfig.java
tools/probe-action-scope-parity.mjs  (mới)
tools/patch-task023-batch1.mjs       (mới)
```

## Decisions

1. **Xây một dịch vụ dùng chung, không vá rải rác 64 chỗ.** Mỗi action chỉ thêm 1 dòng gọi; luật nằm một nơi
   ⇒ khi luật phạm vi đổi chỉ sửa một chỗ (§5 architecture first).
2. **Không dùng lại `ProjectScopeStore`** vì port đó chỉ trả danh sách mã dự án, thiếu **mức quyền**
   (`permission`) mà luật JS cần cho nhánh `write`.
3. **Trả 403** thay vì 400 như JS cho các lỗi phân quyền — thống nhất với `requireRole` hiện có của Java.
   Đây là khác biệt **mã trạng thái** đã tồn tại từ trước, không phải khác biệt về hành vi cho phép/từ chối.
4. **Nối theo lô và đo bằng cổng**, không nối ồ ạt một lượt — mỗi lô phải biên dịch sạch và cổng phải
   chứng minh tiến độ.

## Dependencies

* TASK-021 / TASK-021b / TASK-022 — tầng vai trò đã đúng thì mới nói tới tầng phạm vi.
* `scripts/system-route.mjs:215-242` — bản tham chiếu luật phạm vi.

## Limitations

* **62/64 action chưa được nối** — xem danh sách bằng `node tools/probe-action-scope-parity.mjs`.
* **JAR chưa đóng gói lại** (TASK-B03) ⇒ thay đổi chưa có hiệu lực lúc chạy.
* Chưa chạy được API test thật để chứng minh 403 (phụ thuộc TASK-B03).
* `canAccessWarehouse` dùng `ModulePermissionStore.canUseModule(userId, moduleKey, capability)` với
  capability `canUse`/`canView` — **chưa** kiểm chứng bằng dữ liệu thật rằng tên capability trong DB
  khớp đúng hai chuỗi này cho nhánh kho central.

## Testing

| Kiểm tra | Kết quả |
|---|---|
| `node tools/probe-action-scope-parity.mjs` (trước lô 1) | Java kiểm **0**/64 action |
| `node tools/probe-action-scope-parity.mjs` (sau lô 1) | Java kiểm **2**/64 |
| `node tools/probe-action-scope-parity.mjs` (sau lô 2) | Java kiểm **6**/64 |
| `node tools/probe-action-scope-parity.mjs` (sau lô 3) | Java kiểm **17**/64 (nhóm KHO phủ hết) |
| `node tools/probe-action-scope-parity.mjs` (sau lô 4) | Java kiểm **21**/64 (nhóm MUA HÀNG phủ hết) |
| `node tools/probe-action-scope-parity.mjs` (sau lô 5) | Java kiểm **36**/64 (nhóm SẢN LƯỢNG phủ hết) |
| `node tools/probe-action-scope-parity.mjs` (sau lô 6) | Java kiểm **47**/64 — còn **17** |
| `node tools/patch-task023-batch1.mjs` | 7 áp dụng · 0 lỗi |
| `node tools/patch-task023-batch2.mjs` | 10 áp dụng · 1 không khớp (Principal đã bị TASK-021b sửa trước) · vá bổ sung |
| `node tools/patch-task023-batch2b.mjs` | 1 áp dụng · 0 lỗi |
| `node tools/patch-task023-batch3.mjs` | **11 áp dụng · 0 lỗi** |
| `tools/verify-java-compile.ps1` | **102 tệp nguồn · 0 dòng lỗi · 156 `.class` · exit 0** (chạy lại sau lô 2 và lô 3) |

## LÔ 3 — StockManagementUseCase (10 action còn lại)

Nhóm kho đã **phủ hết**. Mỗi action lấy **nguồn giá trị đúng như JS** (tra từ DB khi JS tra từ DB) và đặt
kiểm phạm vi **đúng vị trí** so với các kiểm tra khác:

| Action | Phạm vi | Nguồn giá trị | Thông điệp |
|---|---|---|---|
| `confirm_installation` | dự án (write) | `item.projectId` (DB) | "Tài khoản không có quyền tại dự án này." |
| `create_transfer_order` | kho nguồn (write) | `sourceWarehouseId` (payload) | "Không có quyền lập điều chuyển từ kho nguồn này." |
| `approve_transfer_order` | kho nguồn (write) | `t.sourceWarehouseId` (DB) | "Không có quyền duyệt kho nguồn." |
| `ship_transfer_order` | kho nguồn (write) | `t.sourceWarehouseId` (DB) | "Chỉ thủ kho nguồn/đúng phạm vi mới được xác nhận xuất." |
| `receive_transfer_order` | kho đích (write) | `t.destinationWarehouseId` (DB) | "Chỉ thủ kho đích/đúng phạm vi mới được xác nhận nhận." |
| `create_central_return` | dự án + kho (write) | `projectId`, `sourceWarehouseId` | "Không có quyền tại dự án này." / "…xuất tại kho dự án này." |
| `approve_central_return` | dự án (write) | `row.projectId` (DB) | "Không có quyền tại dự án này." |
| `receive_central_return` | kho Tổng (write) | `row.centralWarehouseId` (DB) | "Chỉ Thủ kho Tổng được nhận phiếu vào Kho Tổng." |
| `reconcile_contract_stock` | dự án + kho — **mức ĐỌC** | `projectId`, `warehouseId` | "Không có quyền đối soát kho này." |
| `transfer_contract_ownership` | dự án + kho (write) | `projectId`, `warehouseId` | "Không có quyền tại dự án/kho này." |
| `reverse_stock_movement` | kho nguồn + kho đích (write) | `mov.from_warehouse_id`, `mov.to_warehouse_id` — **chỉ khi khác rỗng** | "Không có quyền tại kho nguồn." / "…kho đích." |

Hai điểm phải cẩn thận và đã xử lý đúng:

1. **`reconcile_contract_stock` là mức ĐỌC** (`write=false`) — JS dùng `canAccessProject(user, projectId, false)`
   và `canAccessWarehouse(user, warehouseId, false)`. Dùng nhầm mức write sẽ chặn oan người chỉ có quyền xem.
2. **`reverse_stock_movement` chỉ kiểm kho khi kho KHÁC RỖNG** — JS viết `if(mov.from_warehouse_id && !(await …))`.
   Giao dịch không có kho đích là hợp lệ, không được chặn.

Công cụ mới: `tools/show-java-method.mjs` — in thân một phương thức Java theo tên lớp + tên phương thức
(quét khối theo cặp ngoặc, bỏ qua chuỗi/chú thích), dùng để lấy dữ liệu chính xác trước khi vá.

Kiểm chứng bổ sung trước khi vá: đã đọc `WarehouseStockStoreAdapter` để xác nhận **tên khoá thật** —
`findTransferOrder`/`findCentralReturn`/`findIssueItem` alias camelCase, còn `findStockMovement` dùng
`SELECT *` nên khoá là **snake_case**. Không đoán tên khoá.

## LÔ 4 — PurchaseManagementUseCase (4 action)

| Action | Phạm vi dự án | Phạm vi kho |
|---|---|---|
| `create_po` | `mr.projectId` (DB) · "Tài khoản không có quyền mua hàng tại dự án này." | `warehouseId` · "Tài khoản không có quyền thao tác kho nhận PO này." |
| `close_po_line` | `line.projectId` (DB) · "Không có quyền tại dự án này." | — |
| `receive_goods` | `po.projectId` (DB) · "Tài khoản không có quyền giao nhận tại dự án này." | `po.warehouseId` (DB) · "Tài khoản không có quyền thao tác kho nhận hàng này." |
| `confirm_delivery` | `receipt.projectId` (DB) · "Tài khoản không có quyền xác nhận tại dự án này." | `receipt.warehouseId` (DB) · "Tài khoản không có quyền xác nhận tại kho này." |

Cũng đã thêm đường ống `warehouseScopeKind` cho `PurchaseManagementUseCase` (Principal + `principalAsCurrent`
+ `SystemController.asPurchasePrincipal` + bean), và kiểm tra tên khoá thật trong `PurchaseStoreAdapter`.

### Hai lỗi của chính công cụ vá trong lô này (đã tự phát hiện và sửa)

1. **Bỏ qua nhầm `asPurchasePrincipal`**: phép kiểm "đã có `warehouseScopeKind()` chưa" dùng **cửa sổ 1000 ký tự**
   kể từ chữ ký helper, mà `asStockPrincipal` nằm ngay sau và **đã có** override đó ⇒ cửa sổ bắt sang helper
   kế tiếp ⇒ **dương tính giả**, helper thật bị bỏ qua. Phát hiện bằng cách **đọc lại code** sau khi script báo "BO".
2. **Chèn sai vị trí**: bản vá bổ sung dùng `ANCHOR.indexOf("\n") + 1` (sau dòng **đầu** của neo) thay vì
   `ANCHOR.length` (sau dòng **cuối**) ⇒ dòng override rơi vào giữa chữ ký và `return new ...` ⇒ sai cú pháp.
   Đã sửa bằng `patch-task023-batch4c.mjs` và **kiểm chứng lại bằng mắt** trước khi biên dịch.

Bài học: **script báo "bỏ qua" phải được đọc lại code để xác nhận**, không được tin kết quả bỏ qua.

## LÔ 5 — ProductionManagementUseCase (15 action)

Tất cả 15 action chỉ kiểm **phạm vi DỰ ÁN** (không có nhánh kho) ⇒ không cần `warehouseScopeKind`.

| Nhóm | Action | Nguồn giá trị |
|---|---|---|
| Tổ đội/giao khoán | `save_team_subcontract` | `projectId` (payload) |
| | `save_team_production`, `save_team_payment` | `projectId` — JS **gộp** kiểm tồn tại + phạm vi vào **một** thông điệp ⇒ Java cũng gộp vào cùng điều kiện `if` |
| | `approve_team_production` | `rec.project_id` (DB) |
| | `settle_team_subcontract` | `sc.projectId` (DB) |
| Sản lượng | `save_production_report` | `projectId` (payload) |
| | `approve_production_report` | `old.project_id` (DB) |
| Thu hồi vốn | `save_capital_recovery` | `projectId` (payload) |
| | `delete_capital_recovery` | `old.project_id` (DB) |
| Thanh toán HĐ | `save_contract_payment` | `projectId` (payload) |
| | `delete_contract_payment` | `oldPayment.project_id` (DB) |
| | `import_contract_payments` | `projectId` (payload) |
| Nhật ký thi công | `save_construction_daily_log` | `projectId` (payload) |
| | `approve_construction_daily_log`, `delete_construction_daily_log` | `old.project_id` (DB) |

`delete_contract_payment` trước đây Java **bỏ kết quả tra bản ghi** (`store.findContractPayment(paymentId).orElseThrow(...)`),
nên không có `project_id` để kiểm. Đã sửa để **giữ lại bản ghi cũ** — đúng như JS.

### Lỗi thứ ba của công cụ vá trong lượt này (đã tự phát hiện và sửa)

Phép vá `delete_construction_daily_log` dùng neo
`if ("approved".equals(sv(old, "status")) && !"admin".equals(principal.role()))` — nhưng dòng này xuất hiện
**HAI lần** trong tệp (`saveProductionReport` và `deleteConstructionDailyLog`). `String.prototype.replace`
với mẫu **chuỗi** chỉ thay lần **đầu** ⇒ kiểm phạm vi bị chèn vào **`saveProductionReport`** (sai phương thức),
trong khi cổng lại báo phép vá "đã áp dụng" (vì script chỉ kiểm chuỗi tồn tại, không kiểm vị trí).

Phát hiện nhờ **cổng đối chiếu vẫn báo action còn thiếu** ⇒ đọc lại code ⇒ thấy sai chỗ.
Đã sửa bằng `patch-task023-batch5b.mjs`, có **kiểm chứng sau khi sửa**: khối mới phải nằm trong
`deleteConstructionDailyLog` và số lần xuất hiện phải bằng 1 — nếu không thì **không ghi tệp**.

**Bài học bổ sung:** phép vá theo chuỗi phải **kiểm cả vị trí** (hoặc số lần xuất hiện của neo), không chỉ
kiểm "chuỗi đã có mặt". Ba lỗi liên tiếp của công cụ vá trong 2 lượt gần đây đều cùng một gốc: **neo không duy nhất**
hoặc **kiểm tra quá rộng**.

## LÔ 6 — BoqManagementUseCase (11 action)

Tất cả chỉ kiểm **phạm vi DỰ ÁN**. Hai điểm đặc biệt:

1. **`compare_boq_materials` là mức ĐỌC** (`write=false`) — so sánh BOQ không làm thay đổi dữ liệu.
2. **`bulk_boq_item_action` kiểm phạm vi TỪNG DÒNG** trong vòng lặp: chỉ cần **một** dòng ngoài phạm vi là
   chặn **cả lô** — thông điệp riêng "Danh sách có dòng BOQ ngoài phạm vi được cấp quyền." Không được kiểm
   một lần bằng `payload.projectId` vì payload đó có thể không khớp dòng thật.

`BoqManagementUseCase` **chưa từng có** `RbacService` (nó không nằm trong danh sách use-case gọi `requireRole`),
nên phải **thêm mới** import + trường + tham số constructor — không phải sửa dòng có sẵn.

### Cải tiến công cụ vá sau 3 lỗi liên tiếp

Từ lô này, script vá **kiểm số lần xuất hiện của neo TRƯỚC khi thay**; neo khác 1 là **từ chối** phép vá đó
(`NEO KHONG DUY NHAT`). Đây chính là lớp phòng ngừa cho lỗi đã xảy ra ở lô 5. Nhờ vậy lô 6 phát hiện được
2 phép neo sai (Boq chưa có `RbacService`) mà **không ghi tệp** — tránh trạng thái nửa vời.

## LÔ 7 — FinanceManagementUseCase (7 action)

Tất cả chỉ kiểm **phạm vi DỰ ÁN**. Bảng đối chiếu:

| Action | Nguồn giá trị |
|---|---|
| `save_payment_plan` | `projectId` (payload) |
| `set_payment_plan_status`, `delete_payment_plan` | `old.project_id` (DB) |
| `save_advance_request` | `projectId` — JS dùng `nvl`, **rỗng ⇒ 403**, giữ nguyên hành vi |
| `save_site_expense_claim` | `projectId` (payload) |
| `approve_site_expense_claim`, `delete_site_expense_claim` | `old.project_id` (DB) |

### Lỗi thứ tư của công cụ vá — do script TASK-022 gây ra, đã gỡ xong

Đọc lại code để viết lô 7 thì phát hiện các dòng `rbac.requireRole(...)` bị **nhân đôi** ở
`OpsTaskManagementUseCase` (2 chỗ), `StockManagementUseCase` (2 chỗ), `AdminOpsManagementUseCase` (1 chỗ) —
kèm cả chú thích bị lặp.

**Nguyên nhân:** script `patch-task021b-022.mjs` kiểm "đã áp dụng chưa" bằng `includes(edit.from)`, mà
`edit.from` là **dòng chữ ký phương thức** — dòng này **vẫn còn** sau khi chèn nội dung ngay sau nó.
Vì script được chạy hai lần (lần đầu hỏng vì CRLF ở các phép khác), lần thứ hai đã **chèn lần nữa**.

**Tác hại:** không sai nghiệp vụ (cùng một phép kiểm chạy hai lần) nhưng là mã bẩn, và chứng tỏ phép kiểm
idempotency là **sai nguyên tắc**: với phép "chèn sau một dòng neo", không thể dùng chính dòng neo làm dấu
hiệu đã-áp-dụng.

**Đã xử lý:** `tools/cleanup-duplicate-requirerole.mjs` gỡ 5 khối lặp và **quét lại toàn bộ `java-backend`
để khẳng định không còn khối lặp nào** (exit 0).

**Bài học (bổ sung vào danh sách):** phép vá "chèn sau neo" phải kiểm idempotency bằng **nội dung được chèn**
(không phải neo), hoặc chèn vào **vị trí tuyệt đối** đã tính trước.

### Quy trình build/khởi động lại đã được chuẩn hoá

Sau TASK-B03, mỗi lần đổi mã Java phải theo `docs/29`: dừng **đúng PID** trên cổng 18081 → `mvn -DskipTests package`
→ kiểm jar béo ≈ 90 MB → khởi động lại → kiểm `/actuator/health` = UP. Đã áp dụng đúng quy trình này cho lô 7.

## LÔ 2 — StockManagementUseCase (4 action)

Đã thêm đường ống `warehouseScopeKind` (nhánh kho của `canAccessWarehouse` cần giá trị này):

1. `Principal.warehouseScopeKind()` — `default String` trả rỗng ⇒ `AccessScopeService` coi như `"site"` (đúng JS).
2. `principalAsCurrent` truyền giá trị này vào `CurrentUser.warehouseScopeKind`.
3. `SystemController.asStockPrincipal` override trả `cu.warehouseScopeKind()`.
4. `StockManagementUseCase` nhận `AccessScopeService` (trường + constructor + bean).

Bốn action đã nối, **đúng thứ tự JS** (vai trò trước, phạm vi sau) và **đúng nguồn giá trị**:

| Action | Phạm vi dự án | Phạm vi kho |
|---|---|---|
| `issue_stock` | `projectId` (payload) write · "Tài khoản không có quyền cấp phát tại dự án này." | `fromWarehouseId` write · "Tài khoản không có quyền xuất tại kho này." |
| `return_stock` | `projectId` (payload) write · "Tài khoản không có quyền hoàn trả tại dự án này." | `toWarehouseId` write · "Tài khoản không có quyền nhận hoàn trả tại kho này." |
| `create_stock_count` | `projectId` (payload) write — kiểm **TRƯỚC** khi tra kho | `warehouseId` write — kiểm **SAU** khi xác nhận kho thuộc dự án |
| `approve_stock_count` | `count.projectId` (**tra từ DB**) write | `count.warehouseId` (**tra từ DB**) write |

Công cụ mới hỗ trợ lô này: `tools/show-js-scope-checks.mjs` — trích **nguyên văn** lời gọi kiểm phạm vi của JS
theo từng action (kèm số dòng và việc phạm vi được kiểm trước hay sau vai trò), để không phải suy đoán.

## Validation

* Biên dịch đạt trên cả 4 module sau khi thêm port + adapter + service và đổi chữ ký constructor.
* Cổng đối chiếu phạm vi **chạy được** và phản ánh đúng tiến độ (0 → 2).
* Luật phạm vi được port **nguyên trạng** từng nhánh, có đối chiếu số dòng JS trong tài liệu.

## Commit

`#24` (cùng lượt) — commit này ghi trạng thái **PARTIAL**, không phải hoàn thành.

## Next Task

Tiếp tục TASK-023 theo lô, ưu tiên nhóm **có kiểm cả kho** (rủi ro cao hơn):
1. `StockManagementUseCase`: `issue_stock`, `return_stock`, `create_stock_count`, `approve_stock_count`,
   `reconcile_contract_stock`, `transfer_contract_ownership`, `reverse_stock_movement`,
   `create_transfer_order`, `receive_transfer_order`, `create_central_return`, `approve_central_return`,
   `receive_central_return`, `confirm_installation`.
2. `PurchaseManagementUseCase`: `create_po`, `close_po_line`, `receive_goods`, `confirm_delivery`.
3. `RequestManagementUseCase`: `create_request`, `decide_approval`.
4. `ProductionManagementUseCase` / `FinanceManagementUseCase` / `BoqManagementUseCase`: nhóm `save_*`/`delete_*`.

Sau mỗi lô: chạy cổng + biên dịch, rồi cập nhật tài liệu.

## Continuation Notes

1. **Cách nối một action:** thêm `accessScope` vào constructor use-case (và bean tương ứng trong
   `ApplicationBeansConfig`), rồi gọi `accessScope.requireProjectAccess(...)` /
   `requireWarehouseAccess(...)` **đúng thứ tự so với JS** (JS thường kiểm phạm vi TRƯỚC khi kiểm vai trò).
2. **Giá trị truyền vào phải là giá trị JS dùng**, không phải tham số thô của payload: ví dụ `cancel_request`
   dùng `mr.projectId` tra từ DB, không dùng `payload.projectId`.
3. **Đừng quên `warehouseScopeKind`**: nó đến từ `CurrentUser.warehouseScopeKind()` (đã đúng từ TASK-021) —
   nhưng `Principal` hiện **chưa** mang trường này; nếu action nào cần nhánh kho, phải bổ sung tương tự cách
   đã làm với `roleBase` ở TASK-021b.
4. Chạy `node tools/probe-action-scope-parity.mjs` sau mỗi lô để biết còn bao nhiêu action.
