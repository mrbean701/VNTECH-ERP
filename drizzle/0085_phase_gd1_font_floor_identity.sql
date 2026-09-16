-- VNTECH ERP V5.3.0 GIAI ĐOẠN 1 (tiếp) — SÀN CỠ CHỮ (metadata identity refresh)
-- Không đổi nghiệp vụ và không đổi schema. Chỉ cập nhật source fingerprint sau khi:
--
--   (1) thêm `app/styles/font-floor.css` — FILE SINH TỰ ĐỘNG bởi tools/gen-font-floor.mjs.
--       Công cụ quét globals.css và tìm ra 120 selector đặt cỡ chữ < 9px:
--         8px × 74 · 8.5px × 29 · 7.5px × 6 · 7px × 4 · 8.7px × 2 · 8.3px × 1 ·
--         8.25px × 1 · 8.8px × 1 · 7.7px × 1 · 7.8px × 1
--       Đây là nguyên nhân trực tiếp của lỗi "quá nhiều thông tin, màn hình không
--       hiển thị hết" — chữ bị thu nhỏ để nhét vừa. Khối sinh ra giữ NGUYÊN selector,
--       chỉ nâng sàn lên 10px và VẪN nhân var(--user-font-scale) để tôn trọng tuỳ
--       chọn cỡ chữ của người dùng.
--
--   (2) nạp font-floor.css trong app/layout.tsx SAU canonical.css.
--
-- VÌ SAO SINH TỰ ĐỘNG: liệt kê tay 120 selector sẽ sót và lệch ngay khi globals.css
-- thay đổi. File font-floor.css ghi rõ "KHÔNG SỬA TAY" và kèm bảng đối chiếu
-- selector → cỡ chữ gốc để tra khi cần hoàn tác.

-- Giai đoạn 1 không thay đổi cấu trúc dữ liệu.

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='9ae846acdb0295a29ac597ffb73aaac2287bfc5c1432892a2bd700db0e089123'
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
