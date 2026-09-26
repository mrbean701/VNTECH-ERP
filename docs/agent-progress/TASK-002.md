# TASK-002 — PHASE 0B — Bật kiểm quyền RBAC ở tầng action

## Status

DONE

## Objective

Bịt lỗ hổng 15/15 action lọt qua kiểm quyền; đưa hệ thống về đúng 20/20 hành vi mong đợi.

## Previous State

RbacService.requireActionModule() được định nghĩa nhưng KHÔNG có lời gọi nào; SystemController không kiểm quyền theo action ⇒ 15/15 action lọt.

## Implemented

* Thêm PUBLIC_ACTIONS = {login, setup, logout, change_password, update_profile_avatar}
* requireActionModule nay ném 403 khi danh sách module rỗng (trước đó return âm thầm)
* Gán module cho 29 action trong ActionRbacRegistry (140 action có module, trước là 111)
* Tiêm RbacService vào SystemController, bật kiểm tại MỘT điểm duy nhất ngay sau khi đọc action
* Sửa ModulePermissionStoreAdapter.canUseModule: queryForObject → queryForList (nếu không sẽ ném EmptyResultDataAccessException khi user chưa có dòng quyền → HTTP 500)
* Sửa canApproveRequestStage cho phép người được gán HOẶC đúng vai trò
* Sửa 11 lời gọi requireRole dùng mã vai trò trước khi đổi tên

## Files Changed

* java-backend/application/src/main/java/.../rbac/RbacService.java
* java-backend/application/src/main/java/.../rbac/ActionRbacRegistry.java
* java-backend/web/src/main/java/.../SystemController.java
* java-backend/infrastructure/src/main/java/.../ModulePermissionStoreAdapter.java
* tools/probe-security-rbac.mjs
* tools/patch-rbac-registry.mjs

## Frontend Changes

Không đổi giao diện.

## Backend Changes

Bật kiểm quyền ở tầng action; sửa 3 lỗi tiềm ẩn (EmptyResult, requireRole sai mã, canApproveRequestStage chặn sai).

## Database Changes

No database changes.

## Permission Changes

THAY ĐỔI LỚN: lỗ hổng 15/15 → 0; hành vi đúng 20/20; không chặn oan (0 wrong-blocks).

## Workflow Changes

Sửa điều kiện hợp lệ của người duyệt: được gán HOẶC role nằm trong allowed_role_codes.

## Important Decisions

* Kiểm quyền tại MỘT điểm duy nhất (ngay sau khi đọc action) thay vì rải rác
* Đặt PUBLIC_ACTIONS ở tầng service, không hard-code trong controller

## Dependencies

TASK-003 trở đi dựa trên nền phân quyền đã đúng.

## Known Limitations

* 46 action vẫn chưa có module (41 action chỉ admin + 5 public) — cố ý, vì chỉ admin gọi được

## Testing

* probe-security-rbac: 20/20 đúng, 0 lỗ hổng, 0 chặn oan
* 13/13 probe hồi quy ĐẠT sau khi build JAR
* Luồng mua hàng 28/31 (3 lệch có dự kiến)

## Validation Result

PASS

## Git Commit

`3c948cb` (#10) — chưa push

## Next Task

TASK-003

## Continuation Notes

BÀI HỌC: mọi test chạy bằng admin sẽ CHE lỗi phân quyền — phải test bằng tài khoản thường (ksda.demo, cha.ht, thukydemo... mật khẩu Vntech@2026). Sau khi bật kiểm quyền, probe-material-perm từng đỏ vì kích hoạt quy tắc P5.3 vốn đang ngủ (deptConfigured) — đã sửa probe cho đúng, KHÔNG phải lỗi sản phẩm.

