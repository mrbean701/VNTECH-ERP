-- VNTECH PRODUCT OWNERSHIP MARKER
-- Legal owner: CÔNG TY CỔ PHẦN THƯƠNG MẠI ĐẦU TƯ PHÁT TRIỂN CÔNG NGHỆ VIỆT (VNTECH)
-- Product ID: VNTECH-KHO-MEP-001
-- Source fingerprint: 86a68b97ab33d33cddf164dd8db99921a9829187a682d972a69aa227389040e2
CREATE TABLE IF NOT EXISTS vntech_product_identity (
  id TEXT PRIMARY KEY NOT NULL,
  legal_owner TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_description TEXT NOT NULL,
  version TEXT NOT NULL,
  source_fingerprint TEXT NOT NULL,
  source_fingerprint_short TEXT NOT NULL,
  created_at TEXT NOT NULL
);
--> statement-breakpoint
INSERT OR IGNORE INTO vntech_product_identity (id,legal_owner,product_name,product_description,version,source_fingerprint,source_fingerprint_short,created_at) VALUES (
  'VNTECH-KHO-MEP-001',
  'CÔNG TY CỔ PHẦN THƯƠNG MẠI ĐẦU TƯ PHÁT TRIỂN CÔNG NGHỆ VIỆT (VNTECH)',
  'KHO VNTECH',
  'Hệ thống Quản lý Kho M&E – Universal Central Server Edition',
  '4.8.0',
  '86a68b97ab33d33cddf164dd8db99921a9829187a682d972a69aa227389040e2',
  'VNTECH-FP-86A68B97AB33D33C',
  '2026-08-20T00:00:00.000Z'
);
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
