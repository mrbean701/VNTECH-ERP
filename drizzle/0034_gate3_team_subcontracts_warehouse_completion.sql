-- VNTECH ERP V5.3.0 RC1 GATE 3 - team subcontract settlement + warehouse E2E completion.
-- Team commercial contract is independent from the project's main/customer contract.

CREATE TABLE IF NOT EXISTS team_subcontracts (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id),
  team_id TEXT NOT NULL REFERENCES teams(id),
  contract_no TEXT NOT NULL,
  contract_name TEXT NOT NULL,
  scope_text TEXT,
  contract_value REAL NOT NULL DEFAULT 0,
  start_date TEXT,
  end_date TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  signed_at TEXT,
  note TEXT,
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(project_id, contract_no)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS team_subcontracts_team_idx ON team_subcontracts(team_id,status);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS team_production_records (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id),
  team_id TEXT NOT NULL REFERENCES teams(id),
  subcontract_id TEXT NOT NULL REFERENCES team_subcontracts(id),
  period_key TEXT NOT NULL,
  reference_no TEXT,
  description TEXT,
  submitted_value REAL NOT NULL DEFAULT 0,
  approved_value REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'submitted',
  submitted_by TEXT REFERENCES users(id),
  approved_by TEXT REFERENCES users(id),
  approved_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(subcontract_id,period_key)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS team_production_project_idx ON team_production_records(project_id,team_id,period_key);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS team_payments (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id),
  team_id TEXT NOT NULL REFERENCES teams(id),
  subcontract_id TEXT NOT NULL REFERENCES team_subcontracts(id),
  production_record_id TEXT REFERENCES team_production_records(id),
  payment_date TEXT NOT NULL,
  payment_type TEXT NOT NULL DEFAULT 'progress',
  reference_no TEXT,
  description TEXT NOT NULL,
  amount REAL NOT NULL DEFAULT 0,
  note TEXT,
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS team_payments_subcontract_idx ON team_payments(subcontract_id,payment_date);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS team_settlements (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id),
  team_id TEXT NOT NULL REFERENCES teams(id),
  subcontract_id TEXT NOT NULL REFERENCES team_subcontracts(id),
  settlement_no TEXT NOT NULL,
  approved_production_value REAL NOT NULL DEFAULT 0,
  adjustment_value REAL NOT NULL DEFAULT 0,
  final_value REAL NOT NULL DEFAULT 0,
  paid_value REAL NOT NULL DEFAULT 0,
  remaining_value REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  settled_at TEXT,
  note TEXT,
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(subcontract_id,settlement_no)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS team_settlements_subcontract_idx ON team_settlements(subcontract_id,status);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS stock_movements_reference_idx ON stock_movements(reference_type,reference_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS stock_movements_warehouse_material_idx ON stock_movements(from_warehouse_id,to_warehouse_id,material_id,occurred_at);
--> statement-breakpoint
