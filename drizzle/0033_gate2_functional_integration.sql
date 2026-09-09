-- Gate 2 Functional Integration: production, capital recovery, canonical roles and non-duplicated payment semantics.
CREATE TABLE IF NOT EXISTS production_reports (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id),
  report_period TEXT NOT NULL,
  reference_no TEXT,
  description TEXT,
  planned_value REAL NOT NULL DEFAULT 0,
  actual_value REAL NOT NULL DEFAULT 0,
  approved_value REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'submitted',
  submitted_by TEXT REFERENCES users(id),
  approved_by TEXT REFERENCES users(id),
  approved_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(project_id, report_period)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS production_reports_project_period_idx ON production_reports(project_id,report_period);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS capital_recovery_records (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id),
  period_key TEXT NOT NULL,
  reference_no TEXT,
  production_report_id TEXT REFERENCES production_reports(id),
  submitted_value REAL NOT NULL DEFAULT 0,
  approved_value REAL NOT NULL DEFAULT 0,
  invoice_no TEXT,
  invoice_value REAL NOT NULL DEFAULT 0,
  due_date TEXT,
  status TEXT NOT NULL DEFAULT 'preparing',
  note TEXT,
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS capital_recovery_project_period_idx ON capital_recovery_records(project_id,period_key);
--> statement-breakpoint
ALTER TABLE contract_payments ADD COLUMN recovery_record_id TEXT REFERENCES capital_recovery_records(id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS contract_payments_recovery_idx ON contract_payments(recovery_record_id);
--> statement-breakpoint
UPDATE module_catalog SET label='Thanh toán HĐ',updated_at=CURRENT_TIMESTAMP WHERE module_key='payments';
--> statement-breakpoint
UPDATE module_catalog SET label='Thu hồi vốn',updated_at=CURRENT_TIMESTAMP WHERE module_key='capital_recovery';
--> statement-breakpoint
UPDATE users SET role='ksda',updated_at=CURRENT_TIMESTAMP WHERE role='engineer';
--> statement-breakpoint
UPDATE users SET role='cht',updated_at=CURRENT_TIMESTAMP WHERE role='commander';
--> statement-breakpoint
UPDATE users SET role='da_nv',updated_at=CURRENT_TIMESTAMP WHERE role='project';
--> statement-breakpoint
UPDATE users SET role='kh_nv',updated_at=CURRENT_TIMESTAMP WHERE role='procurement';
--> statement-breakpoint
UPDATE users SET role='thu_kho',updated_at=CURRENT_TIMESTAMP WHERE role='warehouse';
--> statement-breakpoint
UPDATE role_catalog SET active=0,description='LEGACY - Gate 2 đã chuyển người dùng sang role chuẩn; giữ bản ghi chỉ để truy vết lịch sử.',updated_at=CURRENT_TIMESTAMP WHERE code IN ('engineer','commander','project','procurement','warehouse');
