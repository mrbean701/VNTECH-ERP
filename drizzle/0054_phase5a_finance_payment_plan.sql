-- VNTECH ERP V5.3.0 PHASE 5A - DEPT_FINANCE_PAYMENT_PLAN (KẾ HOẠCH THANH TOÁN)
-- Lịch thanh toán theo hợp đồng/PO/milestone cho Phòng Tài chính.
-- Business migration: tạo bảng nghiệp vụ kế hoạch thanh toán.

CREATE TABLE IF NOT EXISTS payment_plans (
  id TEXT PRIMARY KEY NOT NULL,
  plan_no TEXT NOT NULL,
  project_id TEXT NOT NULL,
  contract_id TEXT,
  po_id TEXT,
  milestone TEXT,
  planned_date TEXT,
  planned_amount REAL NOT NULL DEFAULT 0,
  paid_amount REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'planned',
  note TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(plan_no)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_payment_plans_project ON payment_plans(project_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_payment_plans_status ON payment_plans(status);
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='73c738e5636f17659765d05bbb96a5a72ce58eed77fc58dd6cb4bd8e2b596c5a'
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