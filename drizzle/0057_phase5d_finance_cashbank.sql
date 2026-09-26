-- VNTECH ERP V5.3.0 PHASE 5D - DEPT_FINANCE_CASHBANK (SỔ QUỸ & NGÂN HÀNG)
-- Sổ quỹ tiền mặt và tài khoản ngân hàng cho Phòng Tài chính.
-- Business migration: tạo bảng nghiệp vụ quỹ/ngân hàng.

CREATE TABLE IF NOT EXISTS bank_accounts (
  id TEXT PRIMARY KEY NOT NULL,
  code TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_no TEXT NOT NULL,
  branch TEXT,
  currency TEXT NOT NULL DEFAULT 'VND',
  opening_balance REAL NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(code)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS cashbook_entries (
  id TEXT PRIMARY KEY NOT NULL,
  entry_no TEXT NOT NULL,
  entry_date TEXT NOT NULL,
  account_id TEXT NOT NULL,
  entry_type TEXT NOT NULL,
  amount REAL NOT NULL DEFAULT 0,
  counterparty TEXT,
  reference_type TEXT,
  reference_id TEXT,
  note TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(entry_no)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_cashbook_account ON cashbook_entries(account_id, entry_date);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_cashbook_type ON cashbook_entries(entry_type);
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='6bca9d8fb7e48b51cb9437b06476e58d29b1f05501a989d10fc592c4fed0876d'
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