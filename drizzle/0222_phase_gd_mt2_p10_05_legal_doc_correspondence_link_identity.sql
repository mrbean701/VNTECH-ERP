-- =============================================================================
-- MT2 §10.4 (đề án ②A, user chốt 26/09/2026) — BẢN MIRROR cho đường drizzle/SQLite
-- =============================================================================
-- 📌 GIỮ PARITY MIGRATION: bản Java/Flyway là
--   `java-backend/infrastructure/src/main/resources/db/migration/V31__mt2_p10_05_legal_document_correspondence_link.sql`
--   (cùng nội dung logic: thêm cột khoá `correspondence_id` cho `legal_documents`).
-- KHÓA VĂN BẢN PHÁP LÝ ↔ CÔNG VĂN: trước đây hai bảng `legal_documents` và
--   `official_correspondence` độc lập, không có khoá liên kết (BLK-04 của MT2).
-- Theo ②A: THÊM MỘT CỘT KHOÁ, ⛔ KHÔNG tạo bảng mới, ⛔ KHÔNG nhân bản dữ liệu.
-- Cột NULL ⇒ dữ liệu cũ KHÔNG bị ảnh hưởng (GOAL §19: an toàn dữ liệu lịch sử).
-- ⚠️ SQLite: `ALTER TABLE … ADD COLUMN` ⛔ KHÔNG có mệnh đề `AFTER` và phải TÁCH
--    lệnh tạo index ra câu lệnh riêng (SQLite chỉ tạo được 1 index mỗi lần).
-- =============================================================================
ALTER TABLE `legal_documents` ADD COLUMN `correspondence_id` TEXT;
CREATE INDEX IF NOT EXISTS `idx_legal_documents_correspondence` ON `legal_documents` (`correspondence_id`);
