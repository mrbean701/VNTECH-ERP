-- VNTECH ERP V5.3.0 PHASE 6A - DEPT_LEGAL_HR + DEPT_LEGAL_LABOR
-- Hồ sơ nhân sự chi tiết và hợp đồng lao động cho Phòng Hành chính - Pháp chế.
-- Business migration: tạo bảng nghiệp vụ nhân sự & lao động.

CREATE TABLE IF NOT EXISTS hr_records (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  identity_no TEXT,
  identity_date TEXT,
  identity_place TEXT,
  birth_date TEXT,
  birthplace TEXT,
  permanent_address TEXT,
  phone TEXT,
  education_level TEXT,
  joined_date TEXT,
  position TEXT,
  note TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(user_id)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_hr_records_name ON hr_records(full_name);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS labor_contracts (
  id TEXT PRIMARY KEY NOT NULL,
  contract_no TEXT NOT NULL,
  user_id TEXT NOT NULL,
  contract_type TEXT NOT NULL,
  start_date TEXT,
  end_date TEXT,
  signing_date TEXT,
  salary REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  note TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(contract_no)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_labor_contracts_user ON labor_contracts(user_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_labor_contracts_status ON labor_contracts(status);
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='93019d4d2ed4c57375c5fa4a3ced5c77ad77aef0cc2342841f0189b9146b27b5'
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