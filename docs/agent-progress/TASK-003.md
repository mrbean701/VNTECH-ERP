# TASK-003 — PHASE 1 — Thư viện UI dùng chung + xác minh U-08

## Status

DONE

## Objective

Tạo hạ tầng thành phần giao diện dùng chung (U-01…U-07) và xác minh PHASE 1 bằng cổng ảnh + probe (U-08).

## Previous State

app/page.tsx 4.057 dòng với 31 modal và 27 màn tự viết lại cùng một khuôn; toolbar mỗi màn một kiểu.

## Implemented

* Tạo app/components/ui (8 tệp): StatusBadge, PermissionGuard, ListToolbar, DataTable, Timeline (ApprovalTimeline + ActivityTimeline), EntityDetailModal, index
* Thêm MỤC 14 vào canonical.css dùng token tokens.css
* Chuyển MaterialListTable từ <Pill> sang <StatusBadge> (markup giống hệt ⇒ 0 điểm ảnh lệch)
* PHÁT HIỆN + SỬA lỗi thật: .timeline của MỤC 14 đè .timeline 3 cột có sẵn ở globals.css:161 → đổi sang namespace vt-timeline*, ghi quy tắc tiền tố vt- vào CSS
* Cải tiến probe-visual-regression: --selftest in vị trí nhiễu; loại trừ ký tự số của 3 bộ đếm dữ liệu; ghi bằng chứng cho ngưỡng

## Files Changed

* app/components/ui/*.tsx (8 tệp)
* app/styles/canonical.css
* app/page.tsx
* tools/probe-visual-regression.mjs
* tools/probe-css-budget.mjs
* docs/26_BAO_CAO_XAC_MINH_PHASE1_HA_TANG_UI.md

## Frontend Changes

Thêm thư viện dùng chung; thay 1 chỗ dùng thật (StatusBadge).

## Backend Changes

Không đổi backend.

## Database Changes

Chỉ thêm migration định danh: drizzle/0102 và drizzle/0103 (không đổi schema).

## Permission Changes

PermissionGuard có hàm hasPermission nhưng GHI RÕ đây KHÔNG phải lớp bảo vệ — backend vẫn phải kiểm (đã bật ở TASK-002).

## Workflow Changes

No workflow changes.

## Important Decisions

* Mọi lớp CSS của thư viện dùng chung PHẢI có tiền tố vt-
* Cổng ảnh loại trừ các bộ đếm dữ liệu sống (chỉ ẩn ký tự số, giữ nguyên bố cục)
* Ngưỡng cổng ảnh = 8 px kèm bằng chứng đo được

## Dependencies

U-09 và U-14…U-17 đều dùng thư viện này.

## Known Limitations

* ĐÍNH CHÍNH: kết luận ban đầu cho rằng xung đột .timeline gây ra 28/28 ảnh lệch là SAI — số liệu lệch giống hệt trước/sau khi sửa. Nguyên nhân thật là DỮ LIỆU đổi (PHASE 0B tạo ~9 tài khoản demo + phiếu nhập kho)
* Đã đo mức độ áp dụng: ListToolbar 10 lần, StatusBadge 2 lần, còn lại 0 lần

## Testing

* Cổng ảnh 28/28 lệch 0 điểm ảnh
* 13/13 probe hồi quy ĐẠT
* Build ĐẠT · BUILT ARTIFACT VALIDATION ĐẠT

## Validation Result

PASS

## Git Commit

`7fa59ba` (#11) — chưa push

## Next Task

TASK-004

## Continuation Notes

ĐÍNH CHÍNH quan trọng: khi số đo KHÔNG đổi sau khi sửa thì kết luận nguyên nhân trước đó là SAI. Phải so số đo trước/sau, không suy từ việc vừa sửa chỗ nào. Ngoài ra: KHÔNG dùng Get-NetTCPConnection để kiểm cổng (trả rỗng sai dưới sandbox) — dùng netstat -ano.

