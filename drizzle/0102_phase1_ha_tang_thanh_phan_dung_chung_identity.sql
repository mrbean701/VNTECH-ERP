-- VNTECH ERP V5.3.0 — PHASE 1: HẠ TẦNG THÀNH PHẦN GIAO DIỆN DÙNG CHUNG (metadata identity refresh)
-- Không đổi nghiệp vụ, không đổi schema. Chỉ cập nhật source fingerprint.
--
-- VÌ SAO: hệ thống có 31 modal thực thể độc lập (RequestModal · PoModal · ProjectModal ·
-- MaterialModal · UserModal…) và 27 màn hình, mỗi cái lặp lại cùng một khuôn: mở/đóng, nạp
-- dữ liệu, kiểm quyền, tab, trạng thái rỗng/đang tải/lỗi, responsive. Yêu cầu §4 nói rõ:
-- nhiều module cùng khuôn thì KHÔNG được tạo nhiều implementation độc lập.
--
-- ĐÃ THÊM — thư viện app/components/ui:
--
--   StatusBadge.tsx       (U-05) nguồn duy nhất cho màu trạng thái. Render ĐÚNG markup của
--                               <Pill> cũ nên thay thế tại chỗ không lệch giao diện.
--   PermissionGuard.tsx   (U-04) ẩn/hiện theo quyền + hàm hasPermission dùng ngoài JSX.
--                               Ghi rõ: đây KHÔNG phải lớp bảo vệ — backend vẫn phải kiểm,
--                               và từ PHASE 0B SystemController đã gọi requireActionModule.
--   ListToolbar.tsx       (U-03) khuôn toolbar chuẩn §5: TIÊU ĐỀ + SỐ LƯỢNG ‖ TÌM · LỌC ·
--                               SẮP XẾP · HÀNH ĐỘNG. Sửa lỗi toolbar dồn một phía, cột trống,
--                               nút bị đẩy ra ngoài.
--   DataTable.tsx         (U-02) bảng dùng chung: cột, sắp xếp, bấm cả dòng, và ba trạng
--                               thái ĐANG TẢI · LỖI · RỖNG thống nhất toàn hệ thống.
--   Timeline.tsx          (U-06+U-07) ApprovalTimeline thể hiện đủ 6 thông tin mỗi bước theo
--                               §8.1 (số bước · người duyệt · phòng ban · thời gian · trạng
--                               thái · ý kiến); ActivityTimeline dùng chung cho mọi lịch sử.
--   EntityDetailModal.tsx (U-01+U-10) MỘT khung chi tiết cho User/Project/Warehouse/Team/
--                               Material/Supplier/Task, có tab động, trạng thái rỗng/lỗi/
--                               đang tải/không có quyền, đóng bằng Esc. Giới hạn
--                               max-height + vùng cuộn nội bộ ⇒ KHÔNG BAO GIỜ vượt viewport.
--   index.ts              barrel export.
--
-- CSS: thêm MỤC 14 trong app/styles/canonical.css (canonical.css 747 → 930 dòng), dùng hệ
-- token thiết kế ở tokens.css, KHÔNG thêm giá trị cứng mới, KHÔNG thêm khai báo ưu tiên cao.
--
-- ĐỊNH NGHĨA LẠI CHỈ SỐ "SELECTOR ĐỊNH NGHĨA TRÙNG" trong tools/probe-css-budget.mjs:
-- trước đây tính cả các lần ghi đè trong @media — vốn là CSS hợp lệ và có chủ đích — nên chỉ
-- số bị thổi phồng. Nay chỉ đếm khi selector bị định nghĩa lại NHIỀU LẦN TRONG CÙNG NGỮ CẢNH
-- (cùng tổ hợp at-rule bao ngoài). Số thật: globals.css 1.183 → 739; canonical.css 27 → 0.
-- Trần đã được SIẾT từ 1.219 xuống 747 để khoá mức giảm này lại.
--
-- Chứng minh thư viện chạy được trong ứng dụng thật: MaterialListTable chuyển từ <Pill> sang
-- <StatusBadge> — markup giống hệt nên cổng so ảnh phải cho 0 điểm ảnh lệch.

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='7195bd66ea58ea6d41d4ec3eae408c68d221f56c43882dcc4eb49521016dd5bb'
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
