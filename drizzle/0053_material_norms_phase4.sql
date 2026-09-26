-- VNTECH ERP V5.3.0 PHASE 4 - MATERIAL_NORMS (ĐỊNH MỨC VẬT TƯ)
-- Định mức tiêu hao vật tư theo dự án/hạng mục, độc lập khỏi BOQ/HĐ.
-- Business migration (not identity refresh): tạo bảng nghiệp vụ định mức.

CREATE TABLE IF NOT EXISTS material_norms (
  id TEXT PRIMARY KEY NOT NULL,
  norm_code TEXT NOT NULL,
  project_id TEXT,
  subcategory_id TEXT,
  item_name TEXT NOT NULL,
  material_id TEXT,
  base_uom TEXT,
  quantity_per_unit REAL NOT NULL DEFAULT 0,
  unit TEXT,
  source_component_id TEXT,
  source_type TEXT NOT NULL DEFAULT 'manual',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  active INTEGER NOT NULL DEFAULT 1,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(norm_code)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_material_norms_project ON material_norms(project_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_material_norms_material ON material_norms(material_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_material_norms_status ON material_norms(status);
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='e94d39ffa3da9d64f3cd636006c8530cb04e364f4b0d926fe95f1fadd0cbdbda'
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