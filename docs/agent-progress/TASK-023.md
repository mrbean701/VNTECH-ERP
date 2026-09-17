# TASK-023 — KIỂM PHẠM VI DỰ ÁN/KHO (PROJECT & WAREHOUSE SCOPE)

> **TRẠNG THÁI: IN PROGRESS — CHƯA HOÀN THÀNH.**
> Hạ tầng dùng chung đã xong và đã kiểm chứng biên dịch; mới nối được **2/64** action.
> **Không được đánh DONE** cho tới khi cổng `tools/probe-action-scope-parity.mjs` trả exit 0.

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
| `node tools/probe-action-scope-parity.mjs` (sau lô 2) | Java kiểm **6**/64 — còn **58** |
| `node tools/patch-task023-batch1.mjs` | 7 áp dụng · 0 lỗi |
| `node tools/patch-task023-batch2.mjs` | 10 áp dụng · 1 không khớp (Principal đã bị TASK-021b sửa trước) · 0 lỗi sau khi vá bổ sung |
| `node tools/patch-task023-batch2b.mjs` | 1 áp dụng · 0 lỗi |
| `tools/verify-java-compile.ps1` | **102 tệp nguồn · 0 dòng lỗi · 156 `.class` · exit 0** |

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
