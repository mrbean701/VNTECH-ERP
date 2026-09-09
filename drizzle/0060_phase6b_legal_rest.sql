-- VNTECH ERP V5.3.0 PHASE 6B - DEPT_LEGAL CORRESPONDENCE / DOCUMENTS / SEAL / BENEFITS
-- Văn thư & pháp lý: công văn đến-đi, văn bản pháp lý, con dấu/ủy quyền, bảo hiểm & chế độ.
-- Business migration: tạo bảng nghiệp vụ văn thư - pháp lý.

CREATE TABLE IF NOT EXISTS official_correspondence (
  id TEXT PRIMARY KEY NOT NULL,
  doc_no TEXT NOT NULL,
  direction TEXT NOT NULL,
  doc_type TEXT NOT NULL,
  issue_date TEXT,
  sender_name TEXT,
  receiver_name TEXT,
  summary TEXT,
  internal_handler TEXT,
  status TEXT NOT NULL DEFAULT 'received',
  result_note TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(doc_no)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_correspondence_status ON official_correspondence(status);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_correspondence_date ON official_correspondence(issue_date);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS legal_documents (
  id TEXT PRIMARY KEY NOT NULL,
  doc_no TEXT NOT NULL,
  doc_type TEXT NOT NULL,
  title TEXT NOT NULL,
  issue_date TEXT,
  issuer TEXT,
  effective_date TEXT,
  expiry_date TEXT,
  scope TEXT,
  attachment_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(doc_no)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_legal_docs_type ON legal_documents(doc_type);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS seal_management (
  id TEXT PRIMARY KEY NOT NULL,
  seal_no TEXT NOT NULL,
  seal_name TEXT NOT NULL,
  seal_type TEXT NOT NULL,
  custodian TEXT,
  registered_date TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  usage_note TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(seal_no)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS benefit_records (
  id TEXT PRIMARY KEY NOT NULL,
  benefit_no TEXT NOT NULL,
  user_id TEXT NOT NULL,
  benefit_type TEXT NOT NULL,
  provider TEXT,
  start_date TEXT,
  end_date TEXT,
  monthly_amount REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  note TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(benefit_no)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_benefit_user ON benefit_records(user_id);
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='aff0fbcb8b888d9932a264806d2576387f5f070ade2665801effa173fb122fe2'
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