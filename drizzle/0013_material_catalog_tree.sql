CREATE TABLE IF NOT EXISTS material_subcategories (
  id TEXT PRIMARY KEY NOT NULL,
  category_id TEXT NOT NULL REFERENCES material_categories(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS material_subcategories_category_code_uidx ON material_subcategories(category_id, code);
CREATE INDEX IF NOT EXISTS material_subcategories_category_idx ON material_subcategories(category_id, sort_order, name);

ALTER TABLE materials ADD COLUMN subcategory_id TEXT REFERENCES material_subcategories(id);
CREATE INDEX IF NOT EXISTS materials_subcategory_idx ON materials(subcategory_id);

INSERT OR IGNORE INTO material_subcategories (id, category_id, code, name, description, sort_order, active, created_at, updated_at)
SELECT 'SUB-UNASSIGNED-' || id, id, 'CHUA_PHAN_NHOM', 'Chưa phân nhóm', 'Nhóm mặc định để giữ nguyên vật tư cũ khi nâng cấp V4.6.4', 9999, 1, datetime('now'), datetime('now')
FROM material_categories;

UPDATE materials
SET subcategory_id = 'SUB-UNASSIGNED-' || category_id
WHERE category_id IS NOT NULL AND (subcategory_id IS NULL OR trim(subcategory_id)='');
