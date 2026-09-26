-- VNTECH ERP V5.3.0 — PHASE 1 / U-09: CHUẨN HOÁ TOOLBAR DANH SÁCH THEO §5 (ĐỢT 1)
-- (metadata identity refresh)
-- Không đổi nghiệp vụ, không đổi schema. Chỉ cập nhật source fingerprint.
--
-- VÌ SAO: yêu cầu §5 nêu lỗi "toolbar dồn một phía, có cột trống, nút bị đẩy ra ngoài".
-- Kiểm kê bằng công cụ mới tools/probe-list-toolbar-inventory.mjs (quét theo dấu hiệu cấu
-- trúc rồi gắn với HÀM MÀN HÌNH chứa nó, vì app/page.tsx có những dòng dài hàng chục nghìn
-- ký tự nên đọc bằng mắt không đáng tin):
--     CẦN CHUYỂN : 32 hàm màn hình
--     ĐÃ CHUẨN   : 0
--
-- ĐỢT 1 — 3 màn có ĐÚNG lỗi §5 (tiêu đề + nút dồn một hàng, bộ lọc nằm ở card RIÊNG):
--
--   1. Requests        — PHIẾU ĐỀ NGHỊ MUA HÀNG
--   2. WarehouseReceipt— NHẬP KHO
--   3. Inventory       — TỒN KHO & ĐIỀU CHUYỂN
--
-- Việc làm cho mỗi màn:
--   • Thay khối .approved-module-head + .screen-actions bằng MỘT <ListToolbar>:
--     TIÊU ĐỀ + SỐ LƯỢNG (trái) ‖ TÌM · LỌC · SẮP XẾP · HÀNH ĐỘNG (phải).
--   • Gộp card lọc tách rời (.baseline-filter-card + .filter-grid) VÀO chính toolbar đó,
--     thay vì để thành một card riêng phía dưới tiêu đề.
--   • Giữ nguyên toàn bộ state/handler cũ (status, query, fromDate, lowOnly, canUse…) —
--     chỉ đổi chỗ hiển thị, KHÔNG đổi nghiệp vụ, KHÔNG đổi tên hàm action.
--
-- Bộ lọc ngày và các điều khiển không phải select được đưa vào prop `extra` của ListToolbar;
-- ô tìm kiếm dùng prop `search`; select dùng prop `filters`.
--
-- KIỂM CHỨNG ĐÃ CHẠY:
--   • npx tsc --noEmit --incremental false  → ĐẠT (exit 0)
--   • npx eslint app/page.tsx              → 3 lỗi, và đã chứng minh 3 lỗi này CÓ SẴN từ trước
--     bằng cách lint chính bản HEAD (git show HEAD:app/page.tsx): bản HEAD cũng đúng 3 lỗi
--     react-hooks/static-components tại dòng 837/862/866 (hàm TaskTable khai báo trong thân
--     render của WorkCenter — vùng KHÔNG thuộc phạm vi sửa). Số cảnh báo giảm 75 → 74.
--   • Cổng so ảnh: chỉ màn 06-warehouse nằm trong nhóm ảnh chuẩn, nên dự kiến CHỈ màn này lệch,
--     và lệch phải nằm trong vùng toolbar — đây là thay đổi CÓ CHỦ Ý theo §5.
--
-- ĐỢT SAU (chưa làm): 29 hàm còn lại theo kiểm kê — trong đó các màn dùng .filter-grid đơn thuần
-- (DocumentsScreen · CashbankScreen · SiteCostScreen · AdvanceScreen · PaymentPlanScreen ·
-- MaterialNormsScreen · ConstructionScreen · FinanceRecoveryScreen · SiteCommandScreen) là bộ lọc
-- của báo cáo/sổ, ưu thế thấp hơn; nhóm .table-toolbar còn lại cần thêm ô tìm/lọc chuẩn.

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='cb93b6a92ea4368558a95af6f193f1e9a638a846c872d3f96f8606fb47516073'
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
