# TASK-022

## Objective

Rà soát **có hệ thống** xem còn action nào bản JS tham chiếu kiểm vai trò mà bản Java **không kiểm gì**;
đồng thời sửa một **hồi quy do TASK-021 gây ra** (phát hiện trong quá trình rà soát).

## Master Task Requirement

* §45 — Không suy đoán; truy Code → DB → API → UI → Permission.
* §7 — Kiểm quyền phải ở backend; frontend chỉ là UX.
* §36 — Ưu tiên **P0 — Permission / Workflow correctness**.

## Previous State

* TASK-021 đã đưa mọi danh sách vai trò về **mã engine** và cho `requireRole` nhận cả hai.
* Chưa ai kiểm: có action nào JS kiểm vai trò mà Java bỏ trống không.

## Implemented

### A. Cổng đối chiếu mới — `tools/probe-action-role-parity.mjs`

Đọc `scripts/system-route.mjs` (khối `if (action === "x")`) và `SystemController` (khối `case "x" ->`),
quét khối theo **cặp ngoặc có bỏ qua chuỗi/chú thích**, rồi phân 4 nhóm:

| Nhóm | Ý nghĩa |
|---|---|
| **HỞ** | JS yêu cầu vai trò, Java không chặn vai trò ⇒ nguy cơ vượt quyền |
| **CHẶT HƠN** | Java chỉ cho admin, JS cho vai trò khác ⇒ 403 oan (lỗi chức năng) |
| **KHỚP** | cả hai đều chặn vai trò |
| **CHƯA ÁNH XẠ** | JS có action, Java không có `case` |

Kết quả lần đầu: **5 chỗ HỞ** · 0 chặt hơn · 16 khớp · 0 chưa ánh xạ.

### B. Sửa 5 chỗ HỞ (đã đọc tay xác nhận từng phương thức)

| Action | Vai trò theo JS | Nơi thêm |
|---|---|---|
| `create_stock_count` | `warehouse, commander, admin` | `StockManagementUseCase.createStockCount` |
| `approve_stock_count` | `commander, project, admin` | `StockManagementUseCase.approveStockCount` |
| `create_project_team` | `commander, admin` | `OpsTaskManagementUseCase.createProjectTeam` |
| `save_mar_approval` | `project, procurement, admin` | `OpsTaskManagementUseCase.saveMarApproval` |
| `preview_request_import` | `engineer, commander, admin` | `AdminOpsManagementUseCase.previewRequestImport` |

`OpsTaskManagementUseCase` chưa có hạ tầng RBAC ⇒ đã thêm `RbacService` (trường + tham số constructor +
bean trong `ApplicationBeansConfig`) và helper `principalAsCurrent`.

### C. SỬA HỒI QUY DO TASK-021 GÂY RA (quan trọng nhất)

**Triệu chứng:** `principalAsCurrent(p)` dựng `CurrentUser` bằng
`new CurrentUser(..., p.role(), p.role(), p.role(), ...)` — tức **`roleBase = p.role()` = mã CHUẨN**.
Sau khi TASK-021 đổi danh sách vai trò sang **mã engine**, `requireRole` so
`roles.contains(role())` **và** `roles.contains(roleBase())` — cả hai đều là mã chuẩn nên **không bao giờ khớp**
⇒ **mọi tài khoản không phải admin bị 403** trên 16 action.

**Cách sửa (đúng kiến trúc, không dùng bảng ánh xạ tĩnh):**

1. Thêm `default String roleBase() { return role(); }` vào `Principal` — **mặc định rơi về `role()`**
   nên mọi tầng gọi cũ vẫn biên dịch và chạy như trước (tương thích ngược).
2. `SystemController.asXxxPrincipal(cu)` override `roleBase()` trả `cu.roleBase()` — giá trị **thật** đã
   được TASK-021 nạp từ `role_catalog`.
3. `principalAsCurrent(p)` truyền `p.roleBase()` vào `CurrentUser`.

Nhờ đó **vai trò do quản trị viên tạo thêm** cũng hoạt động, vì giá trị đi thẳng từ `role_catalog`
chứ không qua bảng ánh xạ cứng.

Phạm vi: 6 use-case (`Production`, `Stock`, `Purchase`, `Request`, `OpsTask`, `AdminOps`) + 6 helper controller.

### D. Bổ sung chính lớp kiểm tra đã suýt bỏ lọt hồi quy

Cổng đối chiếu nay có thêm mục **"ĐƯỜNG ỐNG roleBase"**: với mọi use-case dùng mã engine, bắt buộc phải có
**cả** `default String roleBase()` **và** `p.roleBase()`. Thiếu một trong hai ⇒ cổng **exit 1**.
Điều kiện này chính là thứ đã thiếu khiến hồi quy lọt qua ở TASK-021.

## Frontend Changes

Không.

## Backend Changes

* 6 use-case: thêm `default roleBase()` vào `Principal`, dùng `p.roleBase()` khi dựng `CurrentUser`.
* `OpsTaskManagementUseCase`: thêm `RbacService` + `principalAsCurrent` + 2 cổng vai trò.
* `ApplicationBeansConfig`: bean `opsTaskManagementUseCase` nhận thêm `RbacService`.
* `SystemController`: 6 helper `asXxxPrincipal` override `roleBase()`.
* 3 use-case khác thêm 3 cổng vai trò còn thiếu.

## API Changes

Không thêm/bớt action. 5 action nay **thực sự** kiểm vai trò ở backend (trước chỉ kiểm quyền module).

## Database Changes

Không.

## Permission Changes

* **Sửa hồi quy:** trước lượt này, sau TASK-021, 16 action sẽ 403 với **mọi** tài khoản không phải admin.
  Nay đã đúng.
* **Thắt 5 action** cho khớp JS: `create_stock_count`, `approve_stock_count`, `create_project_team`,
  `save_mar_approval`, `preview_request_import`.

## Workflow Changes

Không.

## Files Changed

```
java-backend/application/src/main/java/com/vntech/erp/application/service/ProductionManagementUseCase.java
java-backend/application/src/main/java/com/vntech/erp/application/service/StockManagementUseCase.java
java-backend/application/src/main/java/com/vntech/erp/application/service/PurchaseManagementUseCase.java
java-backend/application/src/main/java/com/vntech/erp/application/service/RequestManagementUseCase.java
java-backend/application/src/main/java/com/vntech/erp/application/service/OpsTaskManagementUseCase.java
java-backend/application/src/main/java/com/vntech/erp/application/service/AdminOpsManagementUseCase.java
java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java
java-backend/web/src/main/java/com/vntech/erp/web/config/ApplicationBeansConfig.java
tools/probe-action-role-parity.mjs   (mới)
tools/patch-task021b-022.mjs         (mới)
tools/patch-adminops-rolebase.mjs    (mới)
```

## Decisions

1. **Dùng `default` method trên `Principal`** thay vì bắt 17 interface phải khai báo lại — vừa tương thích
   ngược, vừa không phải sửa các tầng gọi chỉ dùng `["admin"]`.
2. **Không dùng bảng ánh xạ mã-chuẩn→mã-engine trong Java.** Lý do: quản trị viên tạo vai trò mới thì
   bảng cứng sẽ lạc hậu ngay; truyền `roleBase` thật từ `role_catalog` là cách duy nhất luôn đúng.
3. **Không tự động sửa 4 use-case chỉ dùng `["admin"]`** (`ProjectManagement`, `SystemSettings`,
   `UserManagement`, `AdminSystem`) — `isAdmin()` so `role()==="admin"` nên `roleBase` không ảnh hưởng;
   sửa thêm là mở rộng phạm vi không cần thiết (§34).

## Dependencies

* TASK-021 (nguồn `roleBase` thật + ngữ nghĩa mã engine).
* `scripts/system-route.mjs` (bản tham chiếu hành vi).

## Limitations

* **JAR vẫn chưa đóng gói lại** (TASK-B03) ⇒ chưa có hiệu lực lúc chạy; chưa đăng nhập thử được bằng
  `ksda`/`da_truong` để xác nhận hết 403.
* Cổng đối chiếu chỉ so **tầng vai trò**; **không** so tầng quyền module (`requireActionModule`) và
  **không** so kiểm quyền dự án/kho (`canAccessProject`/`canAccessWarehouse`) — phần sau là TASK-023.
* Hồi quy này **được phát hiện nhờ đọc `principalAsCurrent`**, không phải nhờ cổng; cổng đã được bổ sung
  lớp kiểm tương ứng để lần sau bắt được.

## Testing

| Kiểm tra | Kết quả |
|---|---|
| `node tools/probe-action-role-parity.mjs` (trước khi sửa) | 5 HỞ · 0 chặt hơn · 16 khớp |
| `node tools/probe-action-role-parity.mjs` (sau khi sửa) | **0 HỞ · 0 chặt hơn · 21 khớp · đường ống roleBase đầy đủ · exit 0** |
| `node tools/patch-task021b-022.mjs` | 13 áp dụng · 9 bỏ qua (đã có) · **0 lỗi** |
| `node tools/patch-adminops-rolebase.mjs` | 3 áp dụng · **0 lỗi** |
| `tools/verify-java-compile.ps1` | **99 tệp nguồn · 0 dòng lỗi · 153 `.class` · exit 0** |

## Validation

* Cổng đối chiếu **exit 0** ⇒ không còn action nào JS kiểm vai trò mà Java bỏ trống.
* Cả 6 use-case dùng mã engine đều `default=true` và `p.roleBase()=true` ⇒ không còn đường nào dựng
  `CurrentUser` với `roleBase` là mã chuẩn.
* Biên dịch đạt trên cả 4 module sau khi đổi chữ ký constructor của `OpsTaskManagementUseCase`.

## Commit

`#23` (cùng lượt).

## Next Task

* **TASK-023** — bổ sung mức quyền vào `ProjectScopeStore` rồi thêm `canAccessProject`/`canAccessWarehouse`
  cho các action mà JS có kiểm phạm vi dự án/kho (vd `cancel_request`, `create_stock_count`).
* **TASK-024** — chờ người dùng quyết định về `isCompanyLeadership`.

## Continuation Notes

1. **Bất kỳ use-case nào dựng `CurrentUser` từ `Principal` rồi gọi `requireRole` với mã engine đều PHẢI
   có đường ống `roleBase`.** Cổng `tools/probe-action-role-parity.mjs` sẽ báo nếu thiếu.
2. Khi Maven chạy được: **đóng gói lại JAR trước tiên**, rồi đăng nhập thử bằng tài khoản `ksda`
   (`engineer.demo`), `da_truong`, `kho_tong` để xác nhận hết 403.
3. Nếu thêm action mới có kiểm vai trò, nhớ dùng **mã engine** và chạy lại cổng đối chiếu.
