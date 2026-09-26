ALTER TABLE material_request_items ADD COLUMN estimated_unit_price REAL NOT NULL DEFAULT 0;
UPDATE material_request_items
SET estimated_unit_price = COALESCE((SELECT standard_price FROM materials WHERE materials.id = material_request_items.material_id), 0)
WHERE estimated_unit_price = 0;
