# TASK-006 — U-09 đợt 3 — WorkCenter · TeamManagement · ProjectManagement

## Status

DONE

## Objective

Chuẩn hoá 4 khối toolbar trên 3 màn CÓ trong bộ ảnh chuẩn để cổng ảnh kiểm chứng trực tiếp.

## Previous State

4 khối .table-toolbar viết tay với input/select nằm trong .row-actions.

## Implemented

* WorkCenter: danh sách việc → ListToolbar (tiêu đề + chuỗi đếm + ô tìm)
* TeamManagement: DANH SÁCH TỔ ĐỘI → ListToolbar
* ProjectManagement: DANH SÁCH DỰ ÁN → ListToolbar có search + filters[trạng thái] + sort[sắp xếp] (thay 2 select tự chế)
* ProjectManagement: đầu màn chi tiết dự án → ListToolbar + 2 nút trong vùng hành động

## Files Changed

* app/page.tsx
* docs/27_BAO_CAO_U09_CHUAN_HOA_TOOLBAR.md

## Frontend Changes

3 màn chuyển sang khuôn §5; mọi chữ giữ nguyên văn, không tự đặt chữ mới.

## Backend Changes

Không đổi backend.

## Database Changes

Chỉ thêm migration định danh drizzle/0106.

## Permission Changes

No permission changes.

## Workflow Changes

No workflow changes.

## Important Decisions

* Ưu tiên chọn màn CÓ trong bộ ảnh chuẩn để kiểm chứng được
* KHÔNG làm màn Receiving vì màn đó không có tiêu đề sẵn — thêm tiêu đề sẽ là tự đặt chữ

## Dependencies

TASK-007 tiếp tục; Receiving chuyển thành TASK-B01 (chờ xác nhận).

## Known Limitations

* Receiving bị hoãn tới khi có xác nhận tên màn

## Testing

* tsc ĐẠT · build ĐẠT
* Cổng ảnh: dự đoán chỉ 02-project · 03-work · 04-team lệch → ĐÚNG CHÍNH XÁC (4 màn còn lại 0 px)
* OCR xác nhận: 02-project đọc được DANH SÁCH DỰ ÁN 2/2 + Tìm/Trạng thái/Sắp xếp; 04-team đọc được DANH SÁCH TỔ ĐỘI 1/1 + Tìm
* 13/13 probe ĐẠT

## Validation Result

PASS

## Git Commit

`44c0a5e` (#14) — chưa push

## Next Task

TASK-007

## Continuation Notes

Bẫy gặp phải: git commit -m với chuỗi chứa dấu nháy kép bị PowerShell tách tham số → commit thất bại với lỗi pathspec. Quy tắc: KHÔNG dùng dấu nháy kép trong thông điệp commit truyền qua PowerShell.

