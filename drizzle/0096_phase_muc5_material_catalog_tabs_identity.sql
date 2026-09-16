-- VNTECH ERP V5.3.0 MỤC 5/8 — DANH MỤC VẬT TƯ DẠNG TAB (metadata identity refresh)
-- Không đổi nghiệp vụ và không đổi schema. Chỉ cập nhật source fingerprint sau khi:
--
--   (1) chuyển màn `MaterialCatalogPage` (app/page.tsx) từ 3 khối <details> thu gọn
--       SANG TAB theo yêu cầu «trong phần danh mục vật tư gốc không nên để dropbox nữa
--       mà chuyển sang tab». Thanh tab gồm: "Danh mục vật tư" · "So sánh / Đối chiếu BOQ"
--       · "Soát trùng Alias & chất lượng danh mục".
--
--   (2) CÁCH LÀM có chủ đích: giữ nguyên nội dung 3 khối, chỉ gắn `data-tab` và cho CSS
--       ẩn/hiện theo `data-active-tab` của khối cha. Lý do: các khối này là những chuỗi
--       JSX dài hàng nghìn ký tự nằm trên MỘT dòng; viết lại chúng để lồng <details>
--       sẽ rủi ro hỏng build rất cao. Cách gắn thuộc tính là thay đổi nhỏ, kiểm chứng được.
--
--   (3) thêm CSS tương ứng vào `app/styles/canonical.css` (mục 10).

-- Mục này không thay đổi cấu trúc dữ liệu.

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='32e6e0c6a8cde169d5ba937106b208abc3e60f6b068964717e9ab4726e6d2672'
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
