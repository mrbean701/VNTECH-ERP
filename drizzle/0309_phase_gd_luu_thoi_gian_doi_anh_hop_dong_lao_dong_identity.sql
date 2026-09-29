-- USER 29/09/2026 (MOC 58-3) — luu THOI GIAN THAY DOI ANH hop dong lao dong.
-- ⛔ KHONG khai `DEFAULT CURRENT_TIMESTAMP` (cot TEXT/DATETIME tuy chon => ERROR 1067 o MySQL).
-- ⛔ KHONG dung `KEY ...` / `ENGINE=` (MySQL-only, lam hong test SQLite — xem D-025).
-- ⛔ Khai NULL de migration idempotent va khong ghi de du lieu cu.
ALTER TABLE labor_contracts ADD COLUMN image_updated_at DATETIME NULL;
