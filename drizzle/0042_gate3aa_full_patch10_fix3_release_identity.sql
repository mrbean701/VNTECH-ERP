-- VNTECH ERP V5.3.0 RC1 GATE3AA FULL PATCH10 FIX3.
-- Move persisted display settings to the single active FULL release contract
-- without replacing any user-selected font, color, density or size values.
UPDATE ui_display_settings
SET settings_json=replace(
      settings_json,
      '"designVersion":"v530-uiuxfix2-v4"',
      '"designVersion":"v530-gate3aa-p10fix3"'
    ),
    updated_at=CURRENT_TIMESTAMP
WHERE scope_key='company_default'
  AND settings_json LIKE '%"designVersion":"v530-uiuxfix2-v4"%';
