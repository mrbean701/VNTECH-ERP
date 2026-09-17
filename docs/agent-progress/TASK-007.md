# TASK-007 — U-09 đợt 4 — Danh sách nhân sự + Danh bạ nội bộ + phát hiện roadmap báo quá

## Status

DONE

## Objective

Chuẩn hoá toolbar danh sách nhân sự và danh bạ nội bộ; đồng thời kiểm tra tính trung thực của roadmap.

## Previous State

Admin bước 1 dùng .table-toolbar thô, ô tìm kiếm nằm sâu trong AdminStaffList; StaffDirectory có hai khối rời (.staff-directory-head + .staff-toolbar).

## Implemented

* Admin bước 1: .table-toolbar thô → ListToolbar có TÌM + số lượng + nút ＋; ô tìm kiếm chuyển từ AdminStaffList lên toolbar, prop onQuery bỏ hẳn
* StaffDirectory: gộp hai khối rời thành MỘT ListToolbar
* Sửa probe-staff-full: tìm ô nhập ở CẢ HAI vị trí VÀ thêm phép kiểm bắt buộc ô tìm kiếm phải LỌC THẬT
* Cổng ảnh: thêm cơ chế CHỐNG LỖI GIẢ — chụp lại khi lệch, chỉ kết luận LỆCH khi cả hai lần đều vượt ngưỡng
* Loại trừ thêm .global-search (ô tìm kiếm topbar) kèm bằng chứng đo được
* PHÁT HIỆN: roadmap báo quá — U-01/U-02/U-04/U-06/U-07 đánh DONE nhưng số lần DÙNG THẬT = 0; đã sửa cột TT theo số đo và tách phần áp dụng thành U-14…U-17
* Viết công cụ đo tools/probe-ui-adoption.mjs

## Files Changed

* app/page.tsx
* tools/probe-staff-full.mjs
* tools/probe-visual-regression.mjs
* tools/probe-ui-adoption.mjs
* docs/25_TODO_ROADMAP.md
* docs/26_BAO_CAO_XAC_MINH_PHASE1_HA_TANG_UI.md
* docs/27_BAO_CAO_U09_CHUAN_HOA_TOOLBAR.md

## Frontend Changes

Admin bước 1 và StaffDirectory chuyển sang khuôn §5; mọi chữ giữ nguyên văn.

## Backend Changes

Không đổi backend.

## Database Changes

Chỉ thêm migration định danh drizzle/0107.

## Permission Changes

No permission changes.

## Workflow Changes

No workflow changes.

## Important Decisions

* Không nới ngưỡng cổng ảnh để né lỗi giả — thay bằng cơ chế bắt lỗi phải TÁI HIỆN ĐƯỢC
* Chỉ ẩn KÝ TỰ SỐ của bộ đếm và ẩn ô tìm kiếm topbar; không giấu lỗi giao diện nào
* Khối lượng áp dụng >300 điểm chạm ⇒ áp dụng theo từng màn gắn vào các phase nghiệp vụ, KHÔNG quét một lần

## Dependencies

TASK-008…TASK-013 kế thừa bộ loại trừ + cơ chế chống lỗi giả + số đo mức độ áp dụng.

## Known Limitations

* KHÔNG xác định được nguyên nhân gốc của hiện tượng bất định giữa các phiên (đã ghi rõ trong mã là điều tra còn mở)
* 4 select phụ và ô số dòng/trang của AdminStaffList vẫn nằm trong thân danh sách — cần nâng state lên màn cha mới đưa lên toolbar được

## Testing

* tsc ĐẠT · build ĐẠT (VNTECH-FP-5AECE2C2223AAC1E, head 0107, manifest 801)
* Cổng ảnh ĐẠT 28/28 HAI LẦN LIÊN TIẾP với cơ chế chống lỗi giả
* probe-staff-full ĐẠT sau khi sửa, với bằng chứng lọc thật: tìm Nguyễn 12 dòng → 0 dòng
* eslint không phát sinh cảnh báo mới (3 lỗi có sẵn + 74 cảnh báo)

## Validation Result

PASS

## Git Commit

`9148212` (#15) — chưa push

## Next Task

TASK-008

## Continuation Notes

BÀI HỌC LỚN: đổi bộ loại trừ của cổng ảnh thì PHẢI chụp lại ảnh chuẩn ngay, nếu không cổng báo lệch toàn bộ (đã xảy ra: 28/28 lệch vì ảnh chuẩn cũ vẫn có ô tìm kiếm). Và: 'đã tạo tệp' KHÔNG phải 'đã dùng' — hãy đo số lần gọi thật bằng tools/probe-ui-adoption.mjs.

