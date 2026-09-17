# TASK-008 — U-09 đợt 5 — 3 màn trong tab Quản trị

## Status

IN PROGRESS

## Objective

Chuẩn hoá toolbar cho UserPermissionMatrix, SystemLevelManager, AuditLogManager.

## Previous State

Cả ba dùng .table-toolbar với tiêu đề + số lượng bên trái và ô tìm/lọc dồn trong .row-actions bên phải.

## Implemented

* UserPermissionMatrix: ListToolbar search + filters[phòng ban, cấp bậc]
* SystemLevelManager: ListToolbar filters[tài khoản, cấp bậc] + actions[nút Xếp cấp bậc]
* AuditLogManager: ListToolbar search + filters[người dùng, chức năng] + extra[2 ô ngày] + actions[nút Xóa lọc]
* KHÔNG chuyển khối CHI TIẾT THAY ĐỔI trong hộp thoại audit vì đó không phải toolbar danh sách

## Files Changed

* app/page.tsx

## Frontend Changes

3 màn chuyển sang khuôn §5; giữ nguyên state/handler, không tự đặt chữ mới.

## Backend Changes

Không đổi backend.

## Database Changes

Chỉ thêm migration định danh drizzle/0108.

## Permission Changes

No permission changes.

## Workflow Changes

No workflow changes.

## Important Decisions

* Ba màn này KHÔNG có trong bộ ảnh chuẩn nên cổng ảnh không kiểm được — phải kiểm bằng --locate + OCR ảnh chụp thật

## Dependencies

TASK-009 tiếp tục các màn còn lại.

## Known Limitations

* Chưa build/xác minh tại thời điểm ghi hồ sơ

## Testing

* tsc (chạy cùng bước build)
* Cổng ảnh + 13 probe sau khi build
* Kiểm bằng --locate + OCR cho từng màn vì không có trong bộ ảnh chuẩn

## Validation Result

PARTIAL (đang chạy)

## Git Commit

chưa commit

## Next Task

TASK-009

## Continuation Notes

BẪY đã vấp: tiêu đề màn SystemLevelManager là 'GÁN CẤP BẬC' (chữ A) chứ không phải 'GẮN CẤP BẬC' — tôi chép sai dấu nên bản sửa bị trượt. Luôn in NGUYÊN VĂN khối định sửa trước khi sửa, đừng chép tay.

