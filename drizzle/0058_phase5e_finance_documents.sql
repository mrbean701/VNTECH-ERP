-- VNTECH ERP V5.3.0 PHASE 5E - DEPT_FINANCE_DOCUMENTS (CHỨNG TỪ KẾ TOÁN)
-- Quản lý chứng từ kế toán liên kết nguồn nghiệp vụ cho Phòng Tài chính.
-- Business migration: tạo bảng nghiệp vụ chứng từ kế toán.

CREATE TABLE IF NOT EXISTS accounting_vouchers (
  id TEXT PRIMARY KEY NOT NULL,
  voucher_no TEXT NOT NULL,
  voucher_date TEXT NOT NULL,
  voucher_type TEXT NOT NULL,
  project_id TEXT,
  description TEXT,
  total_amount REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  files_json TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(voucher_no)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_accounting_vouchers_date ON accounting_vouchers(voucher_date);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_accounting_vouchers_type ON accounting_vouchers(voucher_type);
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='209a68ca947f0c8943976ad2c22d344bb5db8b792fdae7dd4431fe85c607d78e'
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