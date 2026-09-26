-- KHO VNTECH V5.0.0 - Central master catalog, partial delivery aggregation and delegated permissions
CREATE TABLE IF NOT EXISTS material_aliases (
  id TEXT PRIMARY KEY NOT NULL,
  material_id TEXT NOT NULL REFERENCES materials(id),
  alias_name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  verified INTEGER NOT NULL DEFAULT 1,
  active INTEGER NOT NULL DEFAULT 1,
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(normalized_name)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS material_aliases_material_idx ON material_aliases(material_id,active);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS material_code_history (
  id TEXT PRIMARY KEY NOT NULL,
  material_id TEXT NOT NULL REFERENCES materials(id),
  old_code TEXT NOT NULL,
  new_code TEXT NOT NULL,
  reason TEXT NOT NULL,
  changed_by TEXT NOT NULL REFERENCES users(id),
  changed_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS material_code_history_material_idx ON material_code_history(material_id,changed_at);
--> statement-breakpoint
ALTER TABLE material_request_items ADD COLUMN delivered_qty REAL NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE material_request_items ADD COLUMN closed_qty REAL NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE material_request_items ADD COLUMN close_reason TEXT;
--> statement-breakpoint
ALTER TABLE purchase_order_items ADD COLUMN system_code TEXT;
--> statement-breakpoint
ALTER TABLE purchase_order_items ADD COLUMN planned_delivery_at TEXT;
--> statement-breakpoint
ALTER TABLE purchase_order_items ADD COLUMN delivered_qty REAL NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE purchase_order_items ADD COLUMN closed_qty REAL NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE purchase_order_items ADD COLUMN close_reason TEXT;
--> statement-breakpoint
ALTER TABLE purchase_order_items ADD COLUMN closed_by TEXT REFERENCES users(id);
--> statement-breakpoint
ALTER TABLE purchase_order_items ADD COLUMN closed_at TEXT;
--> statement-breakpoint
ALTER TABLE user_module_permissions ADD COLUMN can_create INTEGER NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE user_module_permissions ADD COLUMN can_edit INTEGER NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE user_module_permissions ADD COLUMN can_approve INTEGER NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE user_module_permissions ADD COLUMN can_export INTEGER NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE user_module_permissions ADD COLUMN permission_expires_at TEXT;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS central_returns (
  id TEXT PRIMARY KEY NOT NULL,
  return_no TEXT NOT NULL UNIQUE,
  source_project_id TEXT NOT NULL REFERENCES projects(id),
  source_warehouse_id TEXT NOT NULL REFERENCES warehouses(id),
  central_warehouse_id TEXT NOT NULL REFERENCES warehouses(id),
  requested_by TEXT NOT NULL REFERENCES users(id),
  requested_at TEXT NOT NULL,
  approved_by TEXT REFERENCES users(id),
  approved_at TEXT,
  received_by TEXT REFERENCES users(id),
  received_at TEXT,
  status TEXT NOT NULL DEFAULT 'pending_approval',
  note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS central_returns_status_idx ON central_returns(status,requested_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS central_return_items (
  id TEXT PRIMARY KEY NOT NULL,
  central_return_id TEXT NOT NULL REFERENCES central_returns(id),
  material_id TEXT NOT NULL REFERENCES materials(id),
  proposed_qty REAL NOT NULL,
  counted_qty REAL NOT NULL DEFAULT 0,
  accepted_qty REAL NOT NULL DEFAULT 0,
  rejected_qty REAL NOT NULL DEFAULT 0,
  condition_status TEXT NOT NULL DEFAULT 'usable',
  unit_cost REAL NOT NULL DEFAULT 0,
  rejection_reason TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS central_return_items_return_idx ON central_return_items(central_return_id,material_id);
--> statement-breakpoint
INSERT OR IGNORE INTO module_catalog (module_key,label,icon,group_name,group_key,active,sort_order,system_locked,created_at,updated_at)
VALUES ('central_warehouse','Kho Tổng & mã vật tư gốc','KT','Kho vật tư','warehouse',1,405,1,datetime('now'),datetime('now'));
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET version='5.0.0',
    product_description='Hệ thống Quản lý Kho M&E – Kho Tổng, mã gốc và giao nhận nhiều đợt'
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
