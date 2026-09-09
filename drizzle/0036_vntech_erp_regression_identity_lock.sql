-- VNTECH ERP V5.3.0 RC1 GATE3A UIUXFIX2 regression identity/configuration lock.
-- Do not alter historical migrations; this migration moves persisted active settings forward.
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET product_name='VNTECH ERP',
    product_description='Quản trị & Điều hành – Nền tảng quản trị tổng thể nội bộ VNTECH',
    version='5.3.0'
WHERE id='VNTECH-KHO-MEP-001';
--> statement-breakpoint
UPDATE email_settings
SET sender_name='VNTECH ERP', updated_at=CURRENT_TIMESTAMP
WHERE sender_name IS NULL OR trim(sender_name)='' OR upper(trim(sender_name))='KHO VNTECH';
--> statement-breakpoint
UPDATE ui_display_settings
SET settings_json='{"designVersion":"v530-uiuxfix2-v4","fontFamily":"Segoe UI","baseFontSize":16,"headingFontSize":28,"materialNameSize":16,"materialCodeSize":15,"textColor":"#132238","mutedColor":"#63748b","materialNameColor":"#132238","materialCodeColor":"#1769e0","rowDensity":"normal"}',
    updated_at=CURRENT_TIMESTAMP
WHERE scope_key='company_default'
  AND (settings_json IS NULL OR settings_json NOT LIKE '%"designVersion":"v530-uiuxfix2-v4"%');
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
