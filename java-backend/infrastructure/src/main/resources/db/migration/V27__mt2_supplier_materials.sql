-- ============================================================================
-- V27 — MT2-P1-06 · MT2 §6.3 (TAB “DANH SÁCH VẬT TƯ” CỦA NHÀ CUNG CẤP)
--                 + §6.4 (AUTO-DETECT + HỎI USER KHI TẠO PO)
-- ----------------------------------------------------------------------------
-- MT2 §6.3 chỉ RÕ nguồn dữ liệu của tab “Danh sách vật tư” trong modal chi tiết NCC:
--        PO  →  PO Items  →  Supplier Materials
--   ⇒ bảng này là LIÊN KẾT “NCC ↔ VẬT TƯ” + số liệu tổng hợp từ lịch sử đặt hàng.
-- MT2 §6.4: khi lập PO có vật tư **chưa từng đặt từ NCC đó** thì hệ thống phải HỎI:
--        “Vật tư này chưa có trong danh mục vật tư của nhà cung cấp. Bạn có muốn thêm không?”
--   ⇒ cần tra cứu NHANH (supplier_id, material_id) ⇒ UNIQUE key bên dưới.
-- ----------------------------------------------------------------------------
-- NGUYÊN TẮC (GOAL MT2 §19 · §14 · §18):
--   * CHỈ **TẠO BẢNG MỚI** — ⛔ KHÔNG DROP/DELETE/TRUNCATE · ⛔ KHÔNG sửa bảng hiện có
--   * ⛔ **KHÔNG bịa dữ liệu**: bảng KHÔNG được seed sẵn; dữ liệu sẽ do tầng nghiệp vụ
--     ghi khi PO được tạo/duyệt (backfill lịch sử là việc RIÊNG, phải hỏi người dùng trước)
--   * ⛔ KHÔNG thêm cột nghiệp vụ chưa được MT2 nêu (giá thoả thuận, cam kết, hợp đồng NCC…)
--   * `COLLATE=utf8mb4_unicode_ci` (bài học dự án: thiếu ⇒ “Illegal mix of collations” khi JOIN)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `supplier_materials` (
  `id`               VARCHAR(64) NOT NULL,
  `supplier_id`      VARCHAR(64) NOT NULL COMMENT 'MT2 §6.3 — Nhà cung cấp (bảng suppliers)',
  `material_id`      VARCHAR(64) NOT NULL COMMENT 'MT2 §6.3 — Vật tư (bảng materials)',
  `times_ordered`    INT         NOT NULL DEFAULT 0 COMMENT 'Số lần đã đặt vật tư này từ NCC (tổng hợp từ PO Items)',
  `last_ordered_at`  DATETIME(3) NULL     COMMENT 'Lần đặt gần nhất — dùng để sắp xếp tab “Danh sách vật tư”',
  `last_unit_price`  DECIMAL(18,4) NULL   COMMENT 'Đơn giá ở lần đặt gần nhất (lấy từ purchase_order_items.unit_price)',
  `active`           TINYINT(1)  NOT NULL DEFAULT 1 COMMENT 'Ngừng dùng ⇒ ẩn khỏi gợi ý khi lập PO',
  `created_at`       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `supplier_materials_uq` (`supplier_id`, `material_id`),
  KEY `supplier_materials_material_idx` (`material_id`),
  KEY `supplier_materials_last_idx` (`supplier_id`, `last_ordered_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='MT2 §6.3/§6.4 — liên kết Nhà cung cấp ↔ Vật tư (nguồn: PO → PO Items), dùng cho tab vật tư NCC + auto-detect';
