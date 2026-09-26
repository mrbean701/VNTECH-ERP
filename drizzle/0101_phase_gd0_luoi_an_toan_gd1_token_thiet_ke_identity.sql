-- VNTECH ERP V5.3.0 — GĐ0 + GĐ1 CỦA KẾ HOẠCH CHỈNH SỬA GIAO DIỆN TOÀN DIỆN (metadata identity refresh)
-- Không đổi nghiệp vụ, không đổi schema, KHÔNG ĐỔI MỘT ĐIỂM ẢNH NÀO trên giao diện.
-- Chỉ cập nhật source fingerprint sau khi thêm tầng token thiết kế.
--
-- GĐ0 — DỰNG LƯỚI AN TOÀN (không chạm mã sản phẩm):
--   • tools/probe-visual-regression.mjs — cổng chặn hồi quy thị giác. Chụp 7 màn × 4
--     kích thước (1920×1080, 1366×768, 768×1024, 390×844) bằng Edge thật qua CDP, so
--     từng điểm ảnh với ảnh chuẩn. Có 4 chế độ: mặc định (so và chặn), --update (chụp
--     chuẩn), --selftest (đo nhiễu nền), --locate/--crop (khoanh vùng lệch).
--     Bộ giải mã PNG tự viết bằng `fflate` vì dự án KHÔNG có thư viện ảnh nào.
--   • tools/probe-css-budget.mjs + tools/css-budget.json — đếm nợ CSS và CHẶN TRẦN,
--     chỉ cho phép giảm.
--   • tools/baseline/*.png — 28 ảnh chuẩn đối chiếu.
--
-- GĐ1 — HỆ TOKEN THIẾT KẾ (không đổi hình thức):
--   • Thêm app/styles/tokens.css — một nguồn sự thật duy nhất cho màu sắc, cỡ chữ,
--     khoảng cách, bo góc, đổ bóng, lớp xếp chồng, điểm ngắt responsive và kích thước
--     điều khiển. Nạp ĐẦU TIÊN trong app/layout.tsx.
--   • GOM 16 token đang nằm rải rác về một chỗ, GIÁ TRỊ GIỮ NGUYÊN XI:
--     15 token từ khối `:root` của canonical.css (--vt-gap-1..5, --vt-font-min,
--     --vt-font-min-xs, --vt-control-h, --vt-radius, --vt-scroll-thumb/-hover/-track,
--     --vt-break-desktop/-laptop/-tablet) và --vt-font-floor từ font-floor.css.
--     Đã kiểm chứng không có biến nào bị khai báo trùng giữa các tệp CSS, nên việc
--     chuyển nơi khai báo KHÔNG làm đổi giá trị mà bất kỳ `var(...)` nào nhận được.
--   • ĐẶT TÊN (KHÔNG phát minh giá trị mới) cho các giá trị cứng đang lặp lại nhiều
--     lần: 15 màu, thang cỡ chữ, thang khoảng cách mịn 4px, bo góc, 3 mức đổ bóng,
--     lớp z-index, độ đậm chữ.
--   • Sàn cỡ chữ 10px: giữ tên `--vt-font-min` vì token này ĐÃ TỒN TẠI với đúng giá
--     trị đó — đặt thêm tên thứ hai sẽ vi phạm nguyên tắc "không phát minh giá trị
--     mới". Lý do sàn 10px ghi rõ trong tệp.
--   • tools/gen-font-floor.mjs không còn tự khai báo `:root` nữa; font-floor.css chỉ
--     DÙNG LẠI token --vt-font-floor do tokens.css sở hữu. Vẫn đủ 120 selector được
--     nâng sàn từ 7px–8.8px lên 10px.
--
-- NỢ CSS TRƯỚC VÀ SAU GĐ1 (đo bằng tools/probe-css-budget.mjs):
--   số lần !important            5014 → 5013   (giảm 1)
--   số lần .table-wrap             52 →   48   (giảm 4 — trước đây tính cả trong chú thích)
--   selector định nghĩa trùng    1219 → 1218   (giảm 1)
--   font-size dưới sàn 10px        14 →   14   (giữ nguyên)
--   tổng dòng CSS (ngoài sổ token) 3747 → 3735 (giảm 12)
--   tokens.css: 200 dòng, 0 !important, 1 khối :root, 0 selector trùng
--
-- CHỈ SỐ ĐO ĐƯỢC CỦA GIAO DIỆN CẦN GHI LẠI (đính chính so với báo cáo trước):
--   `Measure-Object -Line` của PowerShell BỎ QUA dòng trống nên các số công bố trước
--   đây bị thấp hơn thực tế. Số ĐÚNG (tổng số dòng, kể cả dòng trống):
--     app/page.tsx              3.899 → 4.057
--     app/globals.css           2.723 → 2.724
--     app/styles/canonical.css    701 →   761 trước GĐ1, 747 sau GĐ1
--     app/styles/font-floor.css   258 →   262 trước GĐ1, 264 sau GĐ1
--   globals.css có 1.183 khối selector bị định nghĩa TRÙNG — đây là lý do gốc khiến
--   4.950 khai báo ưu tiên cao phải tồn tại để phân xử; là căn cứ cho GĐ2.

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='8fc9bc9bab724be24696117b62edc2e4a17b30cfb03e4b8a554fc88b4d5631cc'
WHERE id='VNTECH-KHO-MEP-001';
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS vntech_product_identity_no_update
BEFORE UPDATE ON vntech_product_identity
BEGIN
  SELECT RAISE(ABORT, 'VNTECH product identity is protected.');
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS vntech_product_identity_no_delete
BEFORE DELETE ON vntech_product_identity
BEGIN
  SELECT RAISE(ABORT, 'VNTECH product identity is protected.');
END;
