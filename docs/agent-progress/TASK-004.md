# TASK-004 — U-09 đợt 1 — Chuẩn hoá toolbar 3 màn mua hàng/kho

## Status

DONE

## Objective

Sửa lỗi §5 (toolbar dồn một phía, bộ lọc tách rời) cho 3 màn có lỗi rõ nhất.

## Previous State

Mỗi màn có .approved-module-head (tiêu đề + nút cùng hàng) và card lọc .baseline-filter-card nằm RIÊNG phía dưới.

## Implemented

* Requests (PHIẾU ĐỀ NGHỊ MUA HÀNG): gộp tiêu đề + 4 nút + card lọc thành MỘT ListToolbar
* WarehouseReceipt (NHẬP KHO): gộp tiêu đề + nút + card lọc thành MỘT ListToolbar
* Inventory (TỒN KHO & ĐIỀU CHUYỂN): gộp tiêu đề + 2 nút + card lọc thành MỘT ListToolbar
* Viết công cụ kiểm kê tools/probe-list-toolbar-inventory.mjs (quét theo dấu hiệu cấu trúc, gắn với hàm màn hình)

## Files Changed

* app/page.tsx
* tools/probe-list-toolbar-inventory.mjs
* docs/27_BAO_CAO_U09_CHUAN_HOA_TOOLBAR.md

## Frontend Changes

3 màn chuyển sang khuôn §5: TIÊU ĐỀ + SỐ LƯỢNG (trái) ‖ TÌM · LỌC · SẮP XẾP · HÀNH ĐỘNG (phải). Giữ nguyên state/handler.

## Backend Changes

Không đổi backend.

## Database Changes

Chỉ thêm migration định danh drizzle/0104.

## Permission Changes

No permission changes.

## Workflow Changes

No workflow changes.

## Important Decisions

* Không đổi tên hàm action, không đổi state — chỉ đổi chỗ hiển thị
* Kiểm kê bằng công cụ thay vì đọc mắt, vì page.tsx có dòng dài hàng chục nghìn ký tự

## Dependencies

TASK-005…TASK-009 tiếp tục cùng phương pháp.

## Known Limitations

* LỖI TÔI TỰ GÂY: viết &amp; thay vì & làm bản sửa màn Inventory trượt; do gửi 2 bản sửa song song nên màn đó tạm mất bộ lọc. Đã phát hiện trước khi build và sửa ngay
* Chỉ cập nhật ảnh chuẩn của màn 06-warehouse (4 ảnh)

## Testing

* tsc ĐẠT
* eslint: 3 lỗi có sẵn — đã chứng minh bằng cách lint chính bản HEAD (cùng 3 lỗi tại dòng 837/862/866)
* Cổng ảnh: dự đoán trước là chỉ 06-warehouse được phép lệch → ĐÚNG (24/28 ảnh 0 px)
* Xác nhận bằng --locate + OCR ảnh chụp thật
* 13/13 probe ĐẠT

## Validation Result

PASS

## Git Commit

`8b29344` (#12) — chưa push

## Next Task

TASK-005

## Continuation Notes

PHƯƠNG PHÁP quan trọng: với màn CÓ trong bộ ảnh chuẩn thì nêu DỰ ĐOÁN trước khi chạy cổng rồi kiểm đúng dự đoán. Với màn KHÔNG có trong bộ ảnh chuẩn thì phải kiểm bằng --locate + OCR mới có bằng chứng.

