-- ══════════════════════════════════════════════════════════════════════════════
-- MT2 §10.4 (đề án ②A user chốt 26/09/2026) — KHÓA VĂN BẢN PHÁP LÝ ↔ CÔNG VĂN
-- ══════════════════════════════════════════════════════════════════════════════
-- VÌ SAO:
--   `legal_documents` (văn bản pháp lý) và `official_correspondence` (công văn) là HAI bảng
--   độc lập, KHÔNG có khoá liên kết ⇒ không tra cứu được «văn bản này sinh ra từ công văn nào»
--   và ngược lại (đây là khối chặn BLK-04 của MT2).
--   Theo phương án ②A đã được user duyệt: THÊM MỘT CỘT KHOÁ, ⛔ KHÔNG tạo bảng mới,
--   ⛔ KHÔNG nhân bản dữ liệu công văn sang bảng văn bản pháp lý.
--
-- AN TOÀN (GOAL §19 — không phá dữ liệu lịch sử):
--   • Cột NULL cho phép ⇒ dòng cũ KHÔNG bị ảnh hưởng, vẫn đọc/ghi bình thường.
--   • ⛔ KHÔNG đặt ràng buộc FK cứng: dữ liệu hiện có tham chiếu công văn đã bị dọn ở một số nơi;
--     ràng buộc cứng sẽ làm migration FAIL. Tầng ứng dụng chịu trách nhiệm kiểm tra hợp lệ.
--   • ⛔ KHÔNG sửa lại file migration đã chạy (đổi checksum Flyway) ⇒ đây là file MỚI V31.
-- ══════════════════════════════════════════════════════════════════════════════
ALTER TABLE `legal_documents`
  ADD COLUMN `correspondence_id` VARCHAR(64) NULL AFTER `scope`;

-- Tra cứu văn bản theo công văn (màn Văn bản pháp lý chọn/tra cứu công văn).
CREATE INDEX `idx_legal_documents_correspondence` ON `legal_documents` (`correspondence_id`);
