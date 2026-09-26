-- VNTECH ERP V5.3.0 NỢ MỤC 5/8 — BẢNG DANH SÁCH VẬT TƯ ĐẦY ĐỦ (metadata identity refresh)
-- Không đổi nghiệp vụ và không đổi schema. Chỉ cập nhật source fingerprint sau khi
-- thêm component `MaterialListTable` vào app/page.tsx và render nó ở ĐẦU tab 1 của
-- màn Danh mục vật tư gốc.
--
-- Lý do — hoàn nốt phần còn nợ của mục 5. Nguyên văn yêu cầu người dùng:
--   «Tab đầu tiên sẽ hiển thị danh sách vật tư (sắp xếp theo id), có đầy đủ các thông
--    tin cơ bản về vật tư đó BAO GỒM CẢ TÊN PHỤ ALIAS, hiển thị TẤT CẢ các nút crud áp
--    dụng với tất cả các user nhưng chỉ có các user có perm thì mới được sử dụng tính
--    năng của nút đó, thêm đầy đủ các search sort filter.»
--
-- Ở vòng trước tôi chỉ chuyển được khối sang dạng TAB; bảng cũ (MaterialCatalogManager)
-- KHÔNG có cột alias và KHÔNG vô hiệu hoá nút theo quyền. Vòng này bù đúng 2 thiếu sót đó:
--
--   • Bảng mới 11 cột: Mã vật tư · Tên chuẩn · **Tên phụ (alias)** · Hệ M&E · Nhóm ·
--     ĐVT · Thông số · Hãng · Tồn min · Trạng thái · Thao tác.
--   • Tên phụ lấy từ `materialAliases` (19 dòng) theo materialId, gộp bằng " · ".
--   • Tìm kiếm bao gồm cả alias; lọc theo Hệ / Nhóm / Trạng thái; sắp xếp theo
--     Mã / Tên / Hệ; có ô bật-tắt cột tên phụ.
--   • 3 nút CRUD (Sửa · Hợp nhất · Ngừng) **luôn hiển thị cho mọi user** nhưng
--     `disabled` khi thiếu quyền (canEdit / canCreate / admin) — kèm `title` giải thích
--     vì sao bị vô hiệu hoá.
--   • Mã vật tư hiển thị theo dạng mới `<HỆ>-<NHÓM>-<STT>` từ mục 8/8.

-- Mục này không thay đổi cấu trúc dữ liệu.

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='e36257b2337c1a7153d1d711c255e6ff8f4a7b5ea6d07f00596c456ddcf08dbb'
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
