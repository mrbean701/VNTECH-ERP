-- VNTECH ERP V5.3.0 — PHASE 1 / U-09 ĐỢT 2: CHUẨN HOÁ TOOLBAR MÀN PHÂN QUYỀN NGƯỜI DÙNG
-- (metadata identity refresh)
-- Không đổi nghiệp vụ, không đổi schema. Chỉ cập nhật source fingerprint.
--
-- VÌ SAO: màn `Admin` (PHÂN QUYỀN NGƯỜI DÙNG) là màn có lỗi §5 nặng nhất trong kiểm kê —
-- SÁU nút bị dồn hết vào một phía, không có vùng tiêu đề/số lượng cân đối:
--   ⇩ MẪU EXCEL TÀI KHOẢN · ⇧ NHẬP EXCEL TÀI KHOẢN · ⇩ XUẤT TÀI KHOẢN ·
--   ⓘ Hướng dẫn phân quyền · ⚙ Vai trò mặc định · ＋ Thêm người dùng
--
-- ĐÃ SỬA: thay khối .approved-module-head + .screen-actions bằng MỘT <ListToolbar> đúng khuôn §5:
--   TIÊU ĐỀ + SỐ LƯỢNG (trái)  ‖  TÌM · LỌC · SẮP XẾP · HÀNH ĐỘNG (phải).
--   • Tiêu đề giữ nguyên chữ "PHÂN QUYỀN NGƯỜI DÙNG".
--   • Mô tả giữ nguyên nguyên văn chuỗi 11 bước nghiệp vụ.
--   • Số lượng: filteredAdminUsers.length / activeUsers.length (tài khoản đang hoạt động).
--   • Sáu nút giữ NGUYÊN handler và NGUYÊN thứ tự — chỉ đổi vùng chứa.
--
-- KHÔNG đưa ô tìm kiếm vào toolbar này một cách khiên cưỡng: `adminQuery` chỉ áp dụng cho BƯỚC 1
-- (danh sách nhân sự), không áp dụng cho 11 bước còn lại, nên đặt nó ở toolbar cấp màn sẽ gây
-- hiểu sai rằng nó lọc cả màn. Ô tìm kiếm vẫn nằm trong AdminStaffList — việc chuyển nó lên
-- toolbar của riêng bước 1 thuộc đợt sau.
--
-- MÀN NÀY CÓ TRONG BỘ ẢNH CHUẨN (07-admin) nên cổng so ảnh kiểm chứng được trực tiếp.

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='6a346e9989229d07daae18a33901df10c164d80fc7b001484a7387d3affd04ba'
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
