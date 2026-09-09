-- VNTECH V4.8.0 - Universal Central Server Edition
-- Giữ nguyên Product ID và cập nhật dấu phiên bản / fingerprint nguồn.
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET version='4.8.0',
    product_description='Hệ thống Quản lý Kho M&E – Universal Central Server Edition',
    source_fingerprint='86a68b97ab33d33cddf164dd8db99921a9829187a682d972a69aa227389040e2',
    source_fingerprint_short='VNTECH-FP-86A68B97AB33D33C'
WHERE id='VNTECH-KHO-MEP-001';
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS server_deployment_metadata (
  id TEXT PRIMARY KEY NOT NULL,
  deployment_mode TEXT NOT NULL,
  database_engine TEXT NOT NULL,
  storage_mode TEXT NOT NULL,
  public_url TEXT,
  node_name TEXT,
  installed_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
INSERT OR IGNORE INTO server_deployment_metadata
(id,deployment_mode,database_engine,storage_mode,public_url,node_name,installed_at,updated_at)
VALUES ('SERVER','legacy-local','sqlite','local',NULL,NULL,datetime('now'),datetime('now'));
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
