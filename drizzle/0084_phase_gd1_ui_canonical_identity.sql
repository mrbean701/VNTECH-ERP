-- VNTECH ERP V5.3.0 GIAI ĐOẠN 1 — CHUẨN HOÁ GIAO DIỆN (metadata identity refresh)
-- Không đổi nghiệp vụ và không đổi schema. Chỉ cập nhật source fingerprint sau khi:
--
--   (1) thêm `app/styles/canonical.css` — TẦNG CHUẨN HOÁ nạp SAU globals.css, sửa các
--       lỗi hiển thị đã ĐO ĐƯỢC bằng tools/probe-layout-audit.mjs:
--         • `.table-wrap` cuộn được nhưng KHÔNG hiển thị thanh cuộn (đo tại 768x1024)
--         • 32 phần tử cờ chữ < 9px ở cả 3 kích thước màn hình
--         • `.table-wrap` bị định nghĩa lại 26 lần với 9 giá trị max-height xung đột
--       Nội dung: thanh cuộn nhìn thấy rõ trên mọi vùng cuộn; MỘT định nghĩa .table-wrap
--       duy nhất; sàn cỡ chữ 10px (vẫn nhân --user-font-scale); nhịp dọc thống nhất;
--       4 điểm ngắt responsive (1440 / 1024 / 768 / 520).
--
--   (2) nạp tầng đó trong `app/layout.tsx` NGAY SAU globals.css để bảo đảm thứ tự ưu tiên.
--
-- GHI CHÚ KỸ THUẬT: trên Chromium/Edge hiện đại, khi đã khai báo `scrollbar-color` thì
-- các rule `::-webkit-scrollbar` bị BỎ QUA — vì vậy tầng chuẩn hoá dùng thuộc tính chuẩn
-- `scrollbar-color` + `scrollbar-width: auto` và KHÔNG khai báo ::-webkit-scrollbar,
-- tránh việc hai cơ chế triệt tiêu nhau (đúng nguyên nhân thanh cuộn bị vô hình).

-- Giai đoạn 1 không thay đổi cấu trúc dữ liệu.

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='20eb608e4b0c72a8abc89fbde5576721b9063d5b7d53ad8a4bcd1d0138eaa48c'
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
