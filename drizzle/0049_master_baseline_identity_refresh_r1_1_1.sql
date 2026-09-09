-- VNTECH ERP V5.3.0 MASTER BASELINE CLEANUP R1.1.1
-- Metadata-only migration: refresh persisted product/trust identity after CSS contract hardening.
-- No business workflow, RBAC, BOQ, inventory or transactional data is changed.
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET product_name='VNTECH ERP',
    product_description='Quản trị & Điều hành – Nền tảng quản trị tổng thể nội bộ VNTECH',
    version='5.3.0',
    source_fingerprint='31cb2728606df468efa00fed311063c86708cd775db620a9cb8d96f097e8a3f2',
    source_fingerprint_short='VNTECH-FP-31CB2728606DF468'
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
SET brand_fingerprint='f78676950be10bee6bf18985dfb39a84f685b09d87ec181696509d6e04caff21',
    release_fingerprint='add41b0f41d3b7753b59ec0ef5fd6d495c1018d5825e2ef64111b7195d3a6a5b',
    updated_at=CURRENT_TIMESTAMP
WHERE id='TRUST-ROOT';
