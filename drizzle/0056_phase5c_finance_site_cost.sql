-- VNTECH ERP V5.3.0 PHASE 5C - DEPT_FINANCE_SITE_COST (CHI PHÍ BAN CHỈ HUY)
-- Theo dõi chi phí hiện trường theo dự án cho Phòng Tài chính.
-- Business migration: tạo bảng nghiệp vụ chi phí hiện trường.

CREATE TABLE IF NOT EXISTS site_expense_claims (
  id TEXT PRIMARY KEY NOT NULL,
  claim_no TEXT NOT NULL,
  project_id TEXT NOT NULL,
  cost_type TEXT NOT NULL,
  amount REAL NOT NULL DEFAULT 0,
  paid_by TEXT,
  claim_date TEXT,
  description TEXT,
  voucher_attachment_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  approved_by TEXT,
  approved_at TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(claim_no)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_site_expense_project ON site_expense_claims(project_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_site_expense_status ON site_expense_claims(status);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_site_expense_type ON site_expense_claims(cost_type);
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='422acbe04906a6cfdf1934c98865e04d74eabf3f04396d85f88a6b902a064572'
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