CREATE TABLE IF NOT EXISTS material_categories (
  id TEXT PRIMARY KEY NOT NULL,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
ALTER TABLE materials ADD COLUMN category_id TEXT REFERENCES material_categories(id);
--> statement-breakpoint
ALTER TABLE projects ADD COLUMN contract_no TEXT;
--> statement-breakpoint
ALTER TABLE projects ADD COLUMN contract_name TEXT;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS project_boq_items (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id),
  line_no INTEGER NOT NULL,
  boq_code TEXT,
  contract_code TEXT,
  material_id TEXT NOT NULL REFERENCES materials(id),
  description TEXT,
  contract_qty REAL NOT NULL DEFAULT 0,
  unit_price REAL NOT NULL DEFAULT 0,
  note TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS project_boq_line_uidx ON project_boq_items(project_id,line_no);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS project_boq_material_idx ON project_boq_items(project_id,material_id);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS user_module_permissions (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id),
  module_key TEXT NOT NULL,
  can_view INTEGER NOT NULL DEFAULT 0,
  can_use INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS user_module_permission_uidx ON user_module_permissions(user_id,module_key);
--> statement-breakpoint
INSERT OR IGNORE INTO material_categories (id,code,name,description,sort_order,active,created_at,updated_at)
VALUES
 ('CAT-DIEN','DIEN','Điện','Danh mục hệ thống điện',10,1,datetime('now'),datetime('now')),
 ('CAT-ELV','ELV','Điện nhẹ','Danh mục hệ thống điện nhẹ',20,1,datetime('now'),datetime('now')),
 ('CAT-HVAC','HVAC','HVAC','Danh mục điều hòa thông gió',30,1,datetime('now'),datetime('now')),
 ('CAT-CTN','CTN','Cấp thoát nước','Danh mục cấp thoát nước',40,1,datetime('now'),datetime('now')),
 ('CAT-PCCC','PCCC','PCCC','Danh mục phòng cháy chữa cháy',50,1,datetime('now'),datetime('now')),
 ('CAT-KHAC','KHAC','Khác / Chưa phân loại','Có thể đổi tên hoặc bổ sung danh mục mới',999,1,datetime('now'),datetime('now'));
--> statement-breakpoint
UPDATE materials SET category_id = CASE
 WHEN lower(system) LIKE '%điện nhẹ%' OR lower(system) LIKE '%dien nhe%' THEN 'CAT-ELV'
 WHEN lower(system) LIKE '%điện%' OR lower(system) LIKE '%dien%' THEN 'CAT-DIEN'
 WHEN lower(system) LIKE '%hvac%' OR lower(system) LIKE '%điều hòa%' OR lower(system) LIKE '%dieu hoa%' THEN 'CAT-HVAC'
 WHEN lower(system) LIKE '%cấp thoát%' OR lower(system) LIKE '%cap thoat%' OR lower(system) LIKE '%nước%' OR lower(system) LIKE '%nuoc%' THEN 'CAT-CTN'
 WHEN lower(system) LIKE '%pccc%' OR lower(system) LIKE '%cháy%' OR lower(system) LIKE '%chay%' THEN 'CAT-PCCC'
 ELSE 'CAT-KHAC' END
WHERE category_id IS NULL;
--> statement-breakpoint
WITH module_keys(module_key) AS (
  VALUES
    ('dashboard'),
    ('requests'),
    ('approvals'),
    ('purchasing'),
    ('receiving'),
    ('delivered'),
    ('inventory'),
    ('boq'),
    ('teams'),
    ('stocktake'),
    ('reports')
)
INSERT INTO user_module_permissions (id,user_id,module_key,can_view,can_use,created_at,updated_at)
SELECT 'UMP-' || lower(hex(randomblob(12))), u.id, m.module_key, 1, 1, datetime('now'), datetime('now')
FROM users u
CROSS JOIN module_keys m
WHERE u.role <> 'admin'
ON CONFLICT(user_id,module_key) DO NOTHING;
