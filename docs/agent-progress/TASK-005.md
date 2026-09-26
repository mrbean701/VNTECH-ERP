# TASK-005 — U-09 đợt 2 — Màn Phân quyền người dùng + ngưỡng cổng ảnh

## Status

DONE

## Objective

Sửa lỗi §5 nặng nhất (6 nút dồn một phía) và xử lý hiện tượng cổng ảnh chập chờn bằng số đo.

## Previous State

Màn Admin có .approved-module-head với 6 nút dồn hết một phía, không có vùng số lượng.

## Implemented

* Admin: thay khối tiêu đề + 6 nút bằng MỘT ListToolbar (tiêu đề + số lượng tài khoản bên trái, 6 nút bên phải)
* Giữ nguyên handler và thứ tự nút; giữ nguyên chuỗi 11 bước nghiệp vụ
* KHÔNG đưa ô tìm kiếm lên toolbar cấp màn vì adminQuery chỉ áp dụng cho bước 1
* Đo độ ổn định cổng ảnh: 3 lần chạy liên tiếp cho 0 px · 2 px · 0 px; xác định vùng nhiễu là viền bo góc .sidebar-collapse-toggle
* Nâng ngưỡng cổng ảnh 2 px → 8 px KÈM BẰNG CHỨNG ghi trong mã

## Files Changed

* app/page.tsx
* tools/probe-visual-regression.mjs
* docs/27_BAO_CAO_U09_CHUAN_HOA_TOOLBAR.md

## Frontend Changes

Màn PHÂN QUYỀN NGƯỜI DÙNG chuyển sang khuôn §5.

## Backend Changes

Không đổi backend.

## Database Changes

Chỉ thêm migration định danh drizzle/0105.

## Permission Changes

No permission changes.

## Workflow Changes

No workflow changes.

## Important Decisions

* KHÔNG nâng ngưỡng lên 21 px để né huy hiệu đếm — làm vậy là bỏ lọt mọi lỗi nhỏ hơn 21 px; huy hiệu được loại trừ riêng
* Ngưỡng đặt bằng sàn nhiễu đo được, có ghi bằng chứng trong mã

## Dependencies

TASK-006…TASK-009 dùng cùng ngưỡng và bộ loại trừ đã hiệu chỉnh.

## Known Limitations

* Hiện tượng bất định giữa các phiên vẫn chưa tìm ra nguyên nhân gốc — xem TASK-017

## Testing

* tsc ĐẠT · build ĐẠT
* Cổng ảnh: dự đoán chỉ 07-admin lệch → ĐÚNG (24/28 ảnh 0 px)
* OCR xác nhận toolbar đúng khuôn và 12 tab bên dưới nguyên vẹn
* 13/13 probe ĐẠT

## Validation Result

PASS

## Git Commit

`426763c` (#13) — chưa push

## Next Task

TASK-006

## Continuation Notes

Cổng ảnh lúc đạt lúc không thì KHÔNG dùng để chặn được. Cách đo đúng: --selftest (chụp 2 lần cùng màn) để tách nhiễu trong phiên khỏi dao động giữa phiên.

