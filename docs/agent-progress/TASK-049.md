# TASK-049 — `create_request`: Java YẾU HƠN JS **3 phép kiểm Owner** của bước duyệt (+ `merge_material_master`)

**Trạng thái:** **CONFIRMED ở mức mã — CHƯA sửa** (known issue #39). Hồ sơ này là bản đặc tả để port trong một lượt.
**Nguồn:** rà `create_request` khi làm TASK-041/TASK-043. **Ngày:** 17/09/2026

---

## 1. Lệch gì (đối chiếu nguyên văn hai phía)

| # | JS `requireWorkflowAssignment` (`scripts/system-route.mjs:442-452`) | Java `RequestManagementUseCase:213-222` |
|---|---|---|
| 1 | có phân công cho (dự án, bước) | **có** ✓ |
| 2 | `ownerActive === 1` | **có** ✓ (`isOne(gi(assignment,"ownerActive"))`) |
| 3 | **vai trò Owner phải nằm trong `allowedRoleCodes` của bước** — so **cả** `users.role` **và** `role_catalog.base_role`: `allowed.includes(ownerBase.role) \|\| allowed.includes(ownerBase.baseRole)` | **KHÔNG KIỂM** |
| 4 | **Owner phải có `user_project_scopes`** cho dự án (trừ khi là `admin`): `SELECT 1 FROM user_project_scopes WHERE user_id=? AND project_id=? AND permission IN ('read','write','approve','admin')` | **KHÔNG KIỂM** |

**Hệ quả:** trên Java, một Owner **sai vai trò** (không thuộc bước) hoặc **không được phân quyền dự án** vẫn được gán làm người duyệt bước đó ⇒ phiếu chuyển tới **người không có quyền** xử lý. Trên JS hai trường hợp này **bị chặn 400** với thông điệp:
* *"Owner {ownerName} không thuộc vai trò được phép của Bước {stageNo} – {stageName}."*
* *"Owner {ownerName} chưa được phân quyền dự án này."*

## 2. Kế hoạch port (một lượt)

1. Trong `createRequest`, sau khi có `assignment` và `stage`: lấy `role`/`baseRole` của Owner (đã có `store.findUserRoleInfo(userId)` từ luồng duyệt — dùng lại, **không viết truy vấn mới**), tách `allowedRoleCodes` của bước theo `,` (đã có helper tương đương ở luồng duyệt).
2. Nếu `allowed` khác rỗng và **không** chứa `role` **cũng không** chứa `baseRole` ⇒ `Api(...)` với **nguyên văn JS** (kèm tên Owner + số bước + tên bước).
3. Kiểm phạm vi: `SELECT 1 FROM user_project_scopes WHERE user_id=? AND project_id=? AND permission IN ('read','write','approve','admin') LIMIT 1` — **trừ khi** `role == 'admin'` ⇒ nếu không có dòng nào thì `Api(...)` nguyên văn thứ hai.
4. **Bơm thêm dữ liệu cần cho thông điệp:** JS dùng `assignment.ownerName` — port phải trả `ownerName` trong `workflowAssignment` (đã có `u.full_name AS ownerName`) và đọc **cả hai dạng khoá** (`ownerName`/`owner_name`) do bẫy `SELECT *` đã gặp ở TASK-045.
5. **Kiểm chứng:** mở rộng probe TASK-043 (đã tạo phiếu thật + tự dọn) thêm 2 nhánh:
   * tạm gán Owner **sai vai trò** cho bước 1 ⇒ `create_request` phải **400 nguyên văn** và **KHÔNG tạo phiếu**;
   * tạm gán Owner **đúng vai trò nhưng không có `user_project_scopes`** ⇒ **400 nguyên văn**;
   * khôi phục phân công trong `finally` + khẳng định số dòng `approval_project_assignments` về **đúng 5** như trước.
6. Cập nhật `MASTER_STATUS`/`TASK_INDEX`, commit.

## 3. Kèm theo trong cùng lượt (khuyến nghị) — `merge_material_master`

JS **xoá** mã nguồn (`DELETE FROM materials WHERE id=?`, `system-route.mjs:2670`) sau khi chuyển alias/mã ngoài/lịch sử đổi mã sang mã đích; Java chỉ đặt `active=0` + đổi mã thành `<code>_X` (`MaterialCatalogStoreAdapter:420-422`).
⇒ **Cần người dùng quyết định hành vi đúng** (xoá hẳn hay lưu trữ) — nếu chọn xoá thì port theo JS; nếu chọn lưu trữ thì **sửa cả JS** để hai bên khớp (không tự chọn).

## 4. Giới hạn của hồ sơ này
Chưa kiểm chứng **lúc chạy** — cần sửa phân công thật nên phải làm trong một lượt có probe và tự khôi phục (bước 5). Bằng chứng hiện có là **đọc mã hai phía** (CONFIRMED ở mức mã).
