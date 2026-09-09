-- VNTECH ERP V5.3.0 PHASE 3 - CONSTRUCTION (THI CÔNG)
-- Nhật ký thi công + chi tiết hạng mục/khối lượng hiện trường theo dự án.
-- Business migration (not identity refresh): tạo bảng nghiệp vụ thi công.

CREATE TABLE IF NOT EXISTS construction_daily_logs (
  id TEXT PRIMARY KEY NOT NULL,
  log_no TEXT NOT NULL,
  project_id TEXT NOT NULL,
  warehouse_id TEXT,
  work_date TEXT NOT NULL,
  shift TEXT NOT NULL DEFAULT 'sang',
  weather TEXT,
  work_content TEXT,
  labor_count INTEGER NOT NULL DEFAULT 0,
  equipment_note TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  submitted_by TEXT,
  approved_by TEXT,
  approved_at TEXT,
  cancelled_by TEXT,
  cancelled_at TEXT,
  note TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(log_no)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS construction_daily_log_items (
  id TEXT PRIMARY KEY NOT NULL,
  log_id TEXT NOT NULL,
  boq_item_id TEXT,
  item_name TEXT NOT NULL,
  location TEXT,
  planned_qty REAL NOT NULL DEFAULT 0,
  completed_qty REAL NOT NULL DEFAULT 0,
  unit TEXT,
  labor_hours REAL NOT NULL DEFAULT 0,
  photo_attachment_id TEXT,
  note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_cdl_project_date ON construction_daily_logs(project_id, work_date);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_cdl_status ON construction_daily_logs(status);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_cdli_log ON construction_daily_log_items(log_id);
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='8ed1611e4acbb1be964f45bd070412cde9b84526d56d7bc0f5809360fcc76cf9'
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
