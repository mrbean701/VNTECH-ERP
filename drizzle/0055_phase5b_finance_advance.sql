-- VNTECH ERP V5.3.0 PHASE 5B - DEPT_FINANCE_ADVANCE (TẠM ỨNG / HOÀN ỨNG)
-- Quản lý tạm ứng và hoàn ứng cho Phòng Tài chính.
-- Business migration: tạo bảng nghiệp vụ tạm ứng.

CREATE TABLE IF NOT EXISTS advance_requests (
  id TEXT PRIMARY KEY NOT NULL,
  request_no TEXT NOT NULL,
  project_id TEXT,
  requester_id TEXT NOT NULL,
  amount REAL NOT NULL DEFAULT 0,
  purpose TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'purchase',
  status TEXT NOT NULL DEFAULT 'draft',
  advance_paid REAL NOT NULL DEFAULT 0,
  settlement_value REAL NOT NULL DEFAULT 0,
  settled_at TEXT,
  note TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(request_no)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_advance_requests_project ON advance_requests(project_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_advance_requests_status ON advance_requests(status);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_advance_requests_requester ON advance_requests(requester_id);
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='522cab13866e2f9e598fa11b6f9a576e118445bb2c9fdfb531f7e37bb86d77a4'
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