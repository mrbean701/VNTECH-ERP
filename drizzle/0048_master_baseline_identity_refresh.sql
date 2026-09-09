-- VNTECH ERP V5.3.0 MASTER BASELINE CLEANUP R1.1
-- Metadata-only migration: refresh persisted product/trust identity after canonical source cleanup.
-- No business workflow, RBAC, BOQ, inventory or transactional data is changed.
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET product_name='VNTECH ERP',
    product_description='Quản trị & Điều hành – Nền tảng quản trị tổng thể nội bộ VNTECH',
    version='5.3.0',
    source_fingerprint='1ee04465fdcc3afd7022e1a777f9a2f60827b6e5209f275aeb7634fcfa086dec',
    source_fingerprint_short='VNTECH-FP-1EE04465FDCC3AFD'
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
--> statement-breakpoint
UPDATE vntech_trust_settings
SET brand_fingerprint='7d0d321521ffc5df245d9cdb5846c0444ed3ca48f7e3675766ff99a936d19224',
    release_fingerprint='8ce80c96b9067ee9db4a01ab88e13edab0d4396e9a305561d3fd18d4a4593c00',
    updated_at=CURRENT_TIMESTAMP
WHERE id='TRUST-ROOT';
