-- VNTECH ERP V5.3.0 PHASE 2 - DEPT_FINANCE_RECOVERY (THU HỒI VỐN / CÔNG NỢ)
-- Metadata-only migration: refresh persisted product identity after Phase 2 source changes.
-- No business workflow, RBAC, BOQ, inventory or transactional data is changed.
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='c1c0fa07e7ca8900dab51c73e2b34ae9bc5bf2494ff491a4d18ca9d619c28a4c'
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
