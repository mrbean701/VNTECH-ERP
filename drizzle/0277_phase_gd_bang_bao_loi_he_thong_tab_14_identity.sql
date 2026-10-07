-- USER 29/09/2026 (MOC 42) - BANG `error_reports` cho chuc nang BAO LOI o TAB 14.
--
-- YEU CAU: user bam nut bao loi canh nut doi mau nen -> modal (tieu de · muc can bao loi ·
-- noi dung) -> gui len luu -> ADMIN xem danh sach o tab 14 «Bao loi» va tick «da xu ly».
--
-- §10 DA KIEM TRA: `production_reports` (bao cao san xuat) va `stock_issues` (loi ton kho)
-- la NGHIEP VU KHAC ⇒ tao bang MOI, khong tai dung lai.
--
-- `module_key` cua muc loi: dung KEY cua module trong `module_catalog` de admin chon muc;
-- ⛔ loai tru module `admin` theo yeu cau user (khong bao loi ve chinh man quan tri).
--
-- created_at / updated_at la VARCHAR(32) nhu cac bang khac cua he thong (khong phai
-- DATETIME) => KHONG duoc DEFAULT CURRENT_TIMESTAMP (ERROR 1067). Backend gan gia tri khi INSERT.
--
-- INDEX: MySQL cho phep `KEY ...` trong CREATE TABLE, NHUNG SQLite (engine cua test)
-- KHONG => loi `near "KEY": syntax error` lam 5 file test CRASH (mat 47 test).
-- => bo khai bao KEY trong CREATE TABLE; truy van dung cot truc tiep (nho nho) + UNIQUE report_code.
-- COLLATE: phai ghi ro `utf8mb4_unicode_ci` — MySQL server mac dinh la 0900_ai_ci,
-- JOIN voi bang cu (unicde) se loi ERROR 1267 «Illegal mix of collations».

CREATE TABLE IF NOT EXISTS `error_reports` (
  `id` VARCHAR(64) NOT NULL,
  `report_code` VARCHAR(32) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `module_key` VARCHAR(64) NOT NULL,
  `content` TEXT NOT NULL,
  `user_id` VARCHAR(64) NULL,
  `username` VARCHAR(64) NULL,
  `full_name` VARCHAR(255) NULL,
  `employee_code` VARCHAR(64) NULL,
  `organization_unit_id` VARCHAR(64) NULL,
  `organization_name` VARCHAR(255) NULL,
  `status` VARCHAR(16) NOT NULL DEFAULT 'open',
  `resolved_at` VARCHAR(32) NULL,
  `resolution_note` TEXT NULL,
  `created_at` VARCHAR(32) NOT NULL DEFAULT '1970-01-01 00:00:00',
  `updated_at` VARCHAR(32) NOT NULL DEFAULT '1970-01-01 00:00:00',
  PRIMARY KEY (`id`),
  UNIQUE (`report_code`)
);
-- ⛔ MySQL: them `ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
--    (CSDL thuc MySQL van dung COLLATE nay — quan trong, tranh loi ERROR 1267 khi JOIN).
--    NHUNG engine cua bai test la SQLite ⇒ bo het phuong sau `)` trong file nay de portable.

-- ⛔ `UNIQUE KEY ...` (MySQL) cung khong hop le tren SQLite => chi dung `UNIQUE (...)`.
-- Index `status` / `user_id` / `created_at` tao bang CREATE INDEX rieng de portable.

