ALTER TABLE users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN password_reset_at TEXT;
ALTER TABLE users ADD COLUMN password_reset_by TEXT;

CREATE TABLE IF NOT EXISTS project_archives (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL,
  project_code TEXT NOT NULL,
  project_name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  byte_size INTEGER NOT NULL DEFAULT 0,
  record_count INTEGER NOT NULL DEFAULT 0,
  attachment_count INTEGER NOT NULL DEFAULT 0,
  schema_version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'verified',
  generated_by TEXT NOT NULL,
  generated_at TEXT NOT NULL,
  downloaded_at TEXT,
  purged_at TEXT,
  purge_audit_id TEXT
);
CREATE INDEX IF NOT EXISTS project_archives_project_idx ON project_archives(project_id,generated_at);
CREATE INDEX IF NOT EXISTS project_archives_status_idx ON project_archives(status,generated_at);
