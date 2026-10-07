# TASK-MT3-UI-0928 — CHỈNH SỬA GIAO DIỆN THEO YÊU CẦU USER

- **Task**: TASK-MT3-UI-0928
- **Requirement**: (a) toolbar & nhóm nút nằm ngang (b) dải phê duyệt rút gọn, bước đã duyệt hiện tên + thời gian (c) khung nhập bình luận xuống dưới label (d) 3 khung bằng nhau (e) label nằm trên toolbar
- **Current state**: Hoàn tất, đo thật trên Edge headless, 4 cổng xanh
- **Implementation**:
  - `app/globals.css` — khối CSS mới (2 tầng label/toolbar + nhóm nút ngang + 3 khung bằng nhau + bình luận grid)
  - `app/page.tsx` — bỏ mô tả bước dài, ưu tiên bước đã duyệt, gộp thời gian duyệt vào dòng phụ, phòng thủ `?? ""`
  - `tools/toolbar-horizontal-20260928.css` — khối CSS gốc (nguồn sự thật để tái tạo)
- **Backend changes**: ⛔ KHÔNG
- **Database changes**: ⛔ KHÔNG (0 Flyway migration mới)
- **Testing**: `tsc` EXIT=0 · contract 579/578/**0 fail** · regression 69/69 · css-baseline ĐẠT · đo thật 4 màn
- **Known issue**: 3 màn + 2 tab chưa đo tới được bằng probe (khớp nhãn sidebar) — **cần user gửi ảnh nếu còn lỗi**
- **Remaining**: xác nhận bằng mắt của user trên tunnel
- **Next task**: `§21` Final Audit lại + `§12` khi có toàn văn
