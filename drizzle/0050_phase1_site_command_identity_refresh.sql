-- VNTECH ERP V5.3.0 PHASE 1 - SITE_COMMAND (BAN CHỈ HUY CÔNG TRƯỜNG)
-- Metadata-only migration: refresh persisted product identity after Phase 1 source changes.
-- No business workflow, RBAC, BOQ, inventory or transactional data is changed.
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='d45011c9bb0d66ce74c7056cd7be6229e8e361f3dd5316cb87b3aaa6f17b85c7'
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
