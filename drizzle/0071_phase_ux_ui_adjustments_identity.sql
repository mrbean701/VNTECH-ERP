-- VNTECH ERP V5.3.0 PHASE UX-071 - UI/UX ADJUSTMENTS (metadata identity refresh)
-- Không đổi schema/nghiệp vụ; chỉ cập nhật source fingerprint sau khi điều chỉnh UX/UI:
-- (1) nút .primary/.secondary nhỏ gọn hơn (min-height 42→36, font 12→10, weight 850→750),
-- (2) header bảng wrap thay vì cắt (white-space normal),
-- (3) ô nhập payment-entry-inline cao hơn (34→38) và grid tự co giãn (auto-fit),
-- (4) khôi phục encoding UTF-8 của globals.css (trước đó bị ghi sai qua PowerShell 5.1 ANSI).

DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='5d92a24a6855e900317f9d3b977cc5d8d2bfada7ea77c11d77f9109af8657021'
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