-- ============================================================================
-- VNTECH ERP V5.3.0 — TASK-080 đợt 2E: VÁ LIÊN KẾT NGƯỢC CỦA BOQ (chống ĐẾM TRÙNG)
-- ============================================================================
-- TRIỆU CHỨNG ĐO ĐƯỢC: payload `boqItems` trả **16 dòng** cho dự án PRJ-DEMO-01 trong khi
-- `project_boq_items` chỉ có **8 dòng** ⇒ màn Thanh toán hiển thị **giá trị hợp đồng GẤP ĐÔI**
-- (1.346.500.000 đ thay vì 673.250.000 đ thật).
--
-- TRUY VẾT (không suy đoán):
--   · `BootstrapDataAdapter:554` nối `LEFT JOIN boq_source_items bsi ON bsi.project_boq_item_id=pbi.id`
--     — tức sản phẩm dùng LIÊN KẾT NGƯỢC từ dòng nguồn về dòng BOQ.
--   · Còn một khối nữa GỘP các dòng nguồn **CHƯA ÁNH XẠ** (`project_boq_item_id IS NULL`) vào CÙNG
--     mảng `boqItems` (JS `system-route.mjs:653`, Java cùng quy tắc).
--   · Dữ liệu thật: 8 dòng `project_boq_items` đều có `source_item_id` trỏ tới `boq_source_items`,
--     NHƯNG cột ngược `boq_source_items.project_boq_item_id` lại **NULL cả 8** ⇒ dòng nguồn bị coi là
--     "chưa ánh xạ" ⇒ bị gộp thêm lần thứ hai ⇒ **nhân đôi mọi dòng BOQ**.
--   · Sản phẩm CÓ ghi cột ngược khi ánh xạ thật (`BoqManagementUseCase:186` "đồng bộ lại
--     project_boq_item_id trên source item"; `setSourceItemActive`). ⇒ Dữ liệu hiện tại **VI PHẠM
--     BẤT BIẾN CỦA CHÍNH SẢN PHẨM**, không phải lỗi mã.
--
-- CÁCH VÁ: khôi phục liên kết ngược từ liên kết xuôi đang có (1-1, đã kiểm: mỗi dòng BOQ trỏ tới một
-- dòng nguồn riêng). KHÔNG tạo/xoá bản ghi nào; chỉ điền cột đang NULL.
--
-- Bản sao lưu: tools/_backup-boq-source-link-truoc-TASK080E.txt
-- Áp dụng: mysql -uvntech -pvntech --default-character-set=utf8mb4 vntech_erp < tools/task080e-fix-boq-source-link.sql
-- ============================================================================

UPDATE boq_source_items b
  JOIN project_boq_items p ON p.source_item_id = b.id
   SET b.project_boq_item_id = p.id
 WHERE b.project_boq_item_id IS NULL;

-- ============================================================================
-- NGHIỆM THU: kỳ vọng chua_anh_xa = 0 và so_dong_boq_moi_du_an = so_dong_nguon
-- ============================================================================
SELECT b.project_id,
       COUNT(*) AS so_dong_nguon,
       SUM(b.project_boq_item_id IS NULL) AS chua_anh_xa,
       (SELECT COUNT(*) FROM project_boq_items p WHERE p.project_id = b.project_id) AS so_dong_boq
FROM boq_source_items b GROUP BY b.project_id;
