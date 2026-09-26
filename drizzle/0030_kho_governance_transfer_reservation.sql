-- VNTECH ERP V5.3.0 RC1 KHO FIX 1 - 2026-08-28
-- P0 warehouse governance: strict Material Master mapping, general transfers, transit, reservation, MAR/document gates and project close checks.

CREATE TABLE IF NOT EXISTS material_external_codes (
  id TEXT PRIMARY KEY NOT NULL,
  material_id TEXT NOT NULL,
  code_type TEXT NOT NULL,
  owner_key TEXT NOT NULL DEFAULT '',
  external_code TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(code_type, owner_key, external_code)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS material_external_codes_material_idx ON material_external_codes(material_id, active);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS material_uom_conversions (
  id TEXT PRIMARY KEY NOT NULL,
  material_id TEXT NOT NULL,
  from_uom TEXT NOT NULL,
  to_uom TEXT NOT NULL,
  factor REAL NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(material_id, from_uom, to_uom)
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS material_mar_approvals (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL,
  material_id TEXT NOT NULL,
  approval_no TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_at TEXT,
  approved_by TEXT,
  note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(project_id, material_id)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS material_mar_approval_idx ON material_mar_approvals(project_id, material_id, status);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS stock_reservations (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL,
  warehouse_id TEXT NOT NULL,
  material_id TEXT NOT NULL,
  request_id TEXT,
  request_item_id TEXT,
  quantity REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  reserved_at TEXT NOT NULL,
  released_at TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS stock_reservation_balance_idx ON stock_reservations(warehouse_id, material_id, status);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS stock_reservation_request_idx ON stock_reservations(request_id, request_item_id, status);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS transfer_orders (
  id TEXT PRIMARY KEY NOT NULL,
  transfer_no TEXT NOT NULL,
  source_warehouse_id TEXT NOT NULL,
  destination_warehouse_id TEXT NOT NULL,
  source_project_id TEXT,
  destination_project_id TEXT,
  transit_warehouse_id TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  requested_at TEXT NOT NULL,
  approved_by TEXT,
  approved_at TEXT,
  shipped_by TEXT,
  shipped_at TEXT,
  received_by TEXT,
  received_at TEXT,
  status TEXT NOT NULL DEFAULT 'requested',
  reason TEXT,
  note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(transfer_no)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS transfer_orders_status_idx ON transfer_orders(status, requested_at);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS transfer_orders_source_idx ON transfer_orders(source_warehouse_id, status);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS transfer_orders_destination_idx ON transfer_orders(destination_warehouse_id, status);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS transfer_order_items (
  id TEXT PRIMARY KEY NOT NULL,
  transfer_order_id TEXT NOT NULL,
  material_id TEXT NOT NULL,
  requested_qty REAL NOT NULL,
  approved_qty REAL NOT NULL DEFAULT 0,
  shipped_qty REAL NOT NULL DEFAULT 0,
  received_qty REAL NOT NULL DEFAULT 0,
  rejected_qty REAL NOT NULL DEFAULT 0,
  lost_qty REAL NOT NULL DEFAULT 0,
  note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS transfer_order_items_order_idx ON transfer_order_items(transfer_order_id, material_id);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS warehouse_locations (
  id TEXT PRIMARY KEY NOT NULL,
  warehouse_id TEXT NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  location_type TEXT NOT NULL DEFAULT 'bin',
  secure INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(warehouse_id, code)
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS project_close_checks (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL,
  check_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  detail TEXT,
  checked_by TEXT,
  checked_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(project_id, check_key)
);
--> statement-breakpoint

INSERT OR IGNORE INTO warehouses (id,code,name,type,project_id,parent_warehouse_id,keeper_user_id,active,created_at,updated_at)
VALUES ('WH-TRANSIT','TRANSIT','Hàng đang vận chuyển','transit',NULL,NULL,NULL,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
--> statement-breakpoint

UPDATE projects SET status='active' WHERE status IS NULL OR status='';
--> statement-breakpoint
