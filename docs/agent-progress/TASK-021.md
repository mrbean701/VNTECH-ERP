# TASK-021

## Objective

Tìm và sửa **tận gốc** lỗi ngữ nghĩa vai trò (role) giữa monolith JS và bản Java port, sau khi TASK-019 chỉ
phát hiện được 5 chỗ cá biệt bằng may mắn.

## Master Task Requirement

* §45 — Không được tự suy đoán business logic; phải truy Code → DB → API → UI → Permission → Workflow.
* §46 — Ưu tiên P0 (an toàn/dữ liệu) > **P1 (kiến trúc lõi)** > P2 (module lõi).
* §47 — Audit trước, báo cáo, rồi mới sửa.

Thuộc **P1 — Core Architecture**: phân quyền là lõi của toàn hệ thống.

## Previous State

* TASK-019 sửa 5 điểm gọi `requireRole` trong `ProductionManagementUseCase` bằng cách đổi chuỗi
  `commander`→`cht`, `project`→`da_nv`. Cách sửa này **chỉ đúng một nửa**.
* Chưa có công cụ nào quét toàn bộ backend để tìm cùng loại lỗi.
* `roleBase` mà backend trả cho giao diện **không** được nạp từ `role_catalog`.

## Implemented

### Bước 1 — Tạo cổng quét toàn backend

`tools/probe-role-code-scan.mjs` quét 115 tệp `.java`, phân 3 mức:

* **CAO** — mã cũ nằm trong `requireRole` ⇒ chắc chắn sai.
* **TRUNG** — mã cũ trong ngữ cảnh vai trò ⇒ cần đọc tay.
* **THẤP** — chỉ trong chú thích/ngữ cảnh khác.

Kết quả: **0 lỗi mức CAO**, **7 chỗ mức TRUNG**.

### Bước 2 — Truy vết 7 chỗ mức TRUNG (không suy đoán)

Đọc `drizzle/0029:71-80` xác định `role_catalog.base_role` chứa **mã engine cũ**. Đọc `RbacService:70`,
`AuthUseCase:210-212`, `scripts/system-route.mjs:193,210-214` để so hai đường lấy giá trị.

Kết luận `CONFIRMED`: JS phân quyền bằng **mã engine**, Java phân quyền bằng **mã chuẩn** ⇒ lệch hệ thống.

### Bước 3 — Sửa gốc (10 tệp)

| Tệp | Thay đổi |
|---|---|
| `UserRepository.java` | Thêm port `findRoleCatalogInfo(roleCode)` + record `RoleCatalogInfo(baseRole, name, warehouseScopeKind)` |
| `UserRepositoryAdapter.java` | Cài đặt bằng `JdbcTemplate`; đọc `base_role`, `name`, `warehouse_scope_kind`; **không lọc `active`** để đúng `LEFT JOIN` của JS |
| `AuthUseCase.java` | `currentUser()` phân giải `roleBase`/`roleName`/`warehouseScopeKind` từ `role_catalog`, rơi về mã vai trò khi thiếu dòng (đúng `COALESCE`) |
| `RbacService.java` | `requireRole` nhận **cả** mã chuẩn **và** mã engine ⇒ khôi phục nhánh nhiều-về-một |
| `RequestManagementUseCase.java` | Thêm `cancelBaseRole(principal)`; `cancelRequest` so bằng mã engine |
| `ProductionManagementUseCase.java` | 5 điểm gọi → mã engine |
| `StockManagementUseCase.java` | 6 điểm gọi → mã engine |
| `PurchaseManagementUseCase.java` | 4 điểm gọi → mã engine |
| `RequestManagementUseCase.java` | 1 điểm gọi → mã engine |
| `AuthUseCaseTest.java` | Test double cài đặt hợp đồng port mới |

Công cụ: `tools/patch-role-engine-codes.mjs` (13 phép thay thế, mỗi phép kèm số lần xuất hiện mong đợi).

## Frontend Changes

Không sửa mã giao diện. **Nhưng có ảnh hưởng gián tiếp quan trọng**: `/api/system` (action `me`) nay trả
`roleBase` = mã engine đúng như JS, sửa 6 chốt quyền ở `app/page.tsx` (dòng 785, 2222, 3597, 3598, 3612, 4041)
vốn bị hỏng khi chạy trên backend Java. `warehouseScopeKind` cũng nay có giá trị (trước luôn `null`).

## Backend Changes

* Thêm 1 port + 1 record vào tầng application.
* Adapter infrastructure thêm `JdbcTemplate` (constructor 2 tham số).
* 16 điểm gọi `requireRole` không phải `["admin"]` nay dùng mã engine đúng như JS.
* `cancelRequest` không còn chặn oan tài khoản CHT.

## API Changes

Không thêm/bớt action. Chỉ **giá trị** `roleBase`, `roleName`, `warehouseScopeKind` trong payload `me` thay đổi
cho đúng nguồn `role_catalog`.

## Database Changes

**Không có.** Không thêm migration, không đổi schema, không đổi dữ liệu.

## Permission Changes

* Trước: tài khoản `da_truong`, `kh_truong`, `kho_tong`, `thuky` và mọi vai trò do quản trị viên tạo thêm
  bị **403 oan** ở các action yêu cầu vai trò.
* Sau: các tài khoản này được đối xử **đúng như JS** (theo `base_role`).
* Ngoài ra tài khoản `cht`/`da_nv` hết bị chặn oan khi **xóa tệp hồ sơ vật tư** và **hủy phiếu bị trả lại**.

## Workflow Changes

Không đổi định nghĩa workflow. Nhưng `decideApproval`/`matchedApprovalRole` vốn **đã đúng**
(so cả `role` và `baseRole`); nay `requireRole` và `cancelRequest` thống nhất cùng một quy tắc.

## Files Changed

```
java-backend/application/src/main/java/com/vntech/erp/application/port/out/UserRepository.java
java-backend/application/src/main/java/com/vntech/erp/application/rbac/RbacService.java
java-backend/application/src/main/java/com/vntech/erp/application/service/AuthUseCase.java
java-backend/application/src/main/java/com/vntech/erp/application/service/ProductionManagementUseCase.java
java-backend/application/src/main/java/com/vntech/erp/application/service/PurchaseManagementUseCase.java
java-backend/application/src/main/java/com/vntech/erp/application/service/RequestManagementUseCase.java
java-backend/application/src/main/java/com/vntech/erp/application/service/StockManagementUseCase.java
java-backend/application/src/test/java/com/vntech/erp/application/service/AuthUseCaseTest.java
java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/UserRepositoryAdapter.java
tools/probe-role-code-scan.mjs      (mới)
tools/patch-role-engine-codes.mjs   (mới)
tools/verify-java-compile.ps1       (mới)
docs/28_BAO_CAO_LOI_GOC_NGU_NGHIA_VAI_TRO.md (mới)
.gitignore                          (bỏ qua _javac-verify/)
```

## Decisions

1. **Dùng mã engine ở điểm gọi, không dùng danh sách mã chuẩn mở rộng.** Lý do: JS dùng `base_role`, và
   `base_role` là ánh xạ động — quản trị viên tạo vai trò mới trong `role_catalog` thì JS tự cho phép,
   danh sách mã chuẩn cố định sẽ không bao giờ theo kịp.
2. **`requireRole` nhận cả hai** thay vì chỉ mã engine — vừa đúng JS, vừa không phá các điểm gọi còn dùng mã chuẩn.
3. **Không lọc `active=1`** khi đọc `role_catalog` để khớp đúng `LEFT JOIN` của JS (tài khoản đang đăng nhập
   với vai trò vừa bị ngừng hoạt động vẫn phải phân giải được).
4. **Không sửa `isCompanyLeadership`** dù phát hiện lệch — thuộc nhóm bảo mật người dùng đã tạm hoãn, cần
   quyết định riêng (TASK-024).

## Dependencies

* Hiểu đúng TASK-019 (bài học: đổi chuỗi là chưa đủ, phải đổi cả *nguồn dữ liệu*).
* `drizzle/0029` — nguồn xác định `base_role`.
* `scripts/system-route.mjs` — bản tham chiếu hành vi.

## Limitations

* **JAR CHƯA được đóng gói lại** ⇒ thay đổi **chưa có hiệu lực lúc chạy**. `mvn package` bị sandbox chặn ghi
  `C:\Users\PC\.m2`; `mvn -o` thiếu artifact (TASK-B03).
* **Chưa chạy được API test / đăng nhập thật** với tài khoản `da_truong`/`kho_tong` để xác nhận hết 403,
  vì phụ thuộc việc đóng gói lại JAR.
* Chưa kiểm bằng mắt trên giao diện (TASK-B02 chặn cổng ảnh).

## Testing

| Kiểm tra | Kết quả |
|---|---|
| `node tools/probe-role-code-scan.mjs` | 115 tệp · **0 lỗi mức CAO** · 7 chỗ mức TRUNG (đã đọc tay toàn bộ) |
| `node tools/patch-role-engine-codes.mjs` | **13/13** phép thay thế khớp số lượng mong đợi · exit **0** |
| `tools/verify-java-compile.ps1` | **99** tệp nguồn · **0** dòng `error:` · **153** tệp `.class` · exit **0** |

## Validation

* Biên dịch đạt trên **cả 4 module**, gồm lớp mới `UserRepository$RoleCatalogInfo.class` ⇒ hợp đồng port
  giữa application/infrastructure khớp nhau.
* Mọi mã cũ trong `requireRole` đã được xác nhận không còn (cổng quét mức CAO = 0).
* Đối chiếu từng điểm gọi với `scripts/system-route.mjs` (88 chỗ `requireRole`) — bảng đối chiếu đầy đủ
  trong `docs/28`.

## Commit

`#22` (cùng lượt) — xem `git log`.

## Next Task

* **TASK-022** — rà soát các action Java **thiếu** `requireRole` so với JS (ví dụ `create_stock_count`,
  `approve_stock_count`). Phải đối chiếu từng action, **không thêm máy móc** vì Java có thể đã kiểm bằng
  module permission (`requireActionModule`).
* **TASK-023** — bổ sung mức quyền vào `ProjectScopeStore` rồi thêm `canAccessProject` cho `cancel_request`.
* **TASK-024** — chờ người dùng quyết định về `isCompanyLeadership`.

## Continuation Notes

1. Nếu tiếp tục nhánh này, **đọc `docs/28` trước** — tài liệu đó có bảng đối chiếu và toàn bộ chuỗi bằng chứng.
2. **Bất kỳ so sánh vai trò mới nào trong Java phải dùng mã engine**, không dùng mã chuẩn. Nếu cần giá trị
   này ở tầng use-case, dùng `store.findUserRoleInfo(...).baseRole` hoặc mở rộng `CurrentUser.roleBase()`.
3. Khi Maven chạy được, **đóng gói lại JAR là việc ĐẦU TIÊN** để các sửa đổi vai trò có hiệu lực thật, rồi
   mới đăng nhập thử bằng `da_truong`/`kho_tong`/`cht` để xác nhận.
