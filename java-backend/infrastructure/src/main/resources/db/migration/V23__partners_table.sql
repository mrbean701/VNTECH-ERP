-- VNTECH ERP V5.3.0 — TASK-125 (21/09/2026): «Đối tác» là BẢNG RIÊNG.
-- [CHUỖI MySQL/InnoDB — Flyway] — bản sao DDL của `drizzle/0165_task125_partners_table_identity.sql`
-- (hai chuỗi SONG SONG có chủ đích: JS/SQLite theo `drizzle/`, Java/MySQL theo Flyway — xem `docs/agent-progress/TASK-040.md`).
--
-- QUYẾT ĐỊNH NGUYÊN VĂN CỦA NGƯỜI DÙNG (21/09/2026):
--   ① «Đối tác là bảng riêng»  ⇒ BẢNG `partners` THẬT + MÀN quản lý đối tác THẬT (không mở cùng màn NCC).
--   ② «Cho nhập dữ liệu»       ⇒ INSERT/UPDATE dữ liệu test được phép.
--   ③ «Không cần gộp»          ⇒ giữ nguyên 3 lối vào NCC.
--
-- ⛔ ADDITIVE 100%: CHỈ `CREATE TABLE` mới + `CREATE UNIQUE INDEX`. KHÔNG chạm bảng `suppliers`.
-- Kiểu cột COPY từ `SHOW CREATE TABLE suppliers` (đo trên MySQL `vntech_erp`): varchar(64)/text/tinyint(1)/datetime(3).
-- KHOÁ QUYỀN dùng chung khoá SẴN CÓ `dept_plan_suppliers` ⇒ ⛔ KHÔNG thêm dòng `module_catalog` nào.

CREATE TABLE IF NOT EXISTS `partners` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `tax_code` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `contact_name` text COLLATE utf8mb4_unicode_ci,
  `contact_phone` text COLLATE utf8mb4_unicode_ci,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `partner_type` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'supplier',
  `status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `partners_code_uidx` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
