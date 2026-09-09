-- VNTECH ERP PATCH02 - REQ-WORKFLOW-OWNER-001 Single Owner Approval
CREATE TABLE IF NOT EXISTS approval_project_assignments (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL,
  stage INTEGER NOT NULL,
  owner_user_id TEXT NOT NULL,
  cc_emails TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  updated_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(project_id, stage)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS approval_project_assignments_owner_idx ON approval_project_assignments(owner_user_id,active);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS approval_project_assignments_project_idx ON approval_project_assignments(project_id,stage,active);
