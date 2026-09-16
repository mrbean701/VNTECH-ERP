-- VNTECH ERP V5.3.0 — SỬA LỖI "DANH MỤC VẬT TƯ RỖNG VỚI TÀI KHOẢN THIẾU QUYỀN" (metadata identity refresh)
-- Không đổi nghiệp vụ, không đổi schema. Chỉ cập nhật source fingerprint sau khi sửa
-- khối chuẩn hoá bootstrap trong app/page.tsx.
--
-- TRIỆU CHỨNG: tài khoản chỉ có quyền XEM `material_catalog` mở màn Danh mục vật tư gốc
-- thì thấy đúng ghi chú quyền và nút "＋ Thêm vật tư" bị vô hiệu hoá, nhưng bảng hiển thị
-- «0/0 vật tư» — không có dòng nào, nên không thể kiểm chứng nút Sửa/Ngừng bị khoá.
--
-- ĐIỀU TRA: `tools/diagnose-material-scope.mjs` gọi thẳng /api/system cho thấy API KHÔNG hề
-- thiếu dữ liệu — tài khoản thường nhận `materials: 14`, chỉ vắng key `adminMaterials`
-- (BootstrapDataAdapter chỉ gắn khối này cho tài khoản quản trị). Vậy lỗi nằm ở client.
--
-- NGUYÊN NHÂN GỐC: khối chuẩn hoá bootstrap hạ `adminMaterials` vắng mặt thành `[]`:
--     adminMaterials: Array.isArray(...) ? ... : []
-- rồi 5 nơi tiêu thụ đều viết `data.adminMaterials || data.materials`. Trong JavaScript
-- **mảng rỗng là truthy**, nên `[] || data.materials` trả về `[]` và 14 vật tư thật bị bỏ qua.
--
--   • dòng 1734 — MaterialListTable (bảng 11 cột của mục 5/8)
--   • dòng 1809 — MaterialCatalogPage (nhánh chỉ-xem)
--   • dòng 2203 — màn kho vật tư
--   • dòng 3677 — bộ chọn vật tư cho BOQ
--   • dòng 3663/3669/3670 — bộ chọn Hệ / Nhóm (adminMaterialCategories, adminMaterialSubcategories)
--
-- BẢN VÁ: fallback được chuyển về ĐÚNG NGUỒN — cả ba cặp admin/thường
-- (adminMaterials→materials, adminMaterialCategories→materialCategories,
-- adminMaterialSubcategories→materialSubcategories) nay lấy bản thường khi server không
-- gửi bản admin. Sửa một chỗ, cả 5 điểm tiêu thụ cùng đúng, không phải sửa từng nơi.
--
-- Đây là lỗi CÓ SẴN từ trước, không do 8 nhóm yêu cầu gây ra; được phát hiện nhờ probe
-- chiều ngược `tools/probe-material-perm.mjs`.

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='91c8c3b6ee5d6703c5b5c46b25f366d7a0158bcc811d3f3bbd7dca8816fb1c56'
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
