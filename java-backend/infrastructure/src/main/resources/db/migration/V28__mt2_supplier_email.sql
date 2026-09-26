-- ============================================================================
-- V28 — MT2-P8-04 (DATA) · Nền dữ liệu cho MASTER TASK 2 §6.2
--   §6.2  Create Supplier : "thông tin: Mã NCC · Tên NCC · Mã số thuế ·
--         Người liên hệ · Điện thoại · Email …" ⇒ THIẾU cột `email`.
-- ----------------------------------------------------------------------------
-- ĐO TRƯỚC (tools/_live-schema.tsv — schema THẬT, không cần credential):
--   `suppliers` hiện có ĐÚNG 11 cột: id · code · name · tax_code · contact_name ·
--   phone · lead_time_days · rating · active · created_at · updated_at
--   ⇒ ⛔ KHÔNG có `email` ⇒ migration này THÊM đúng 1 cột.
--
-- NGUYÊN TẮC (GOAL MT2 §19 · MT2 §56):
--   * CHỈ ADD COLUMN — KHÔNG DROP / KHÔNG DELETE / KHÔNG TRUNCATE / KHÔNG sửa kiểu cột
--   * KHÔNG backfill dữ liệu GIẢ — cột để NULL cho tới khi có nghiệp vụ thật điền vào
--   * `TEXT NULL` (không NOT NULL, không DEFAULT) ⇒ hàng cũ KHÔNG bị đụng tới
--   * ⛔ KHÔNG thêm UNIQUE: hệ thống chưa có nghiệp vụ chống trùng email NCC
-- ============================================================================

ALTER TABLE suppliers
  ADD COLUMN email TEXT NULL
  COMMENT 'MT2 §6.2 — email lien he cua nha cung cap (bat buoc tren form Create Supplier)';
