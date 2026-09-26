CREATE TABLE IF NOT EXISTS business_role_group_catalog (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  engine_role TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 100,
  system_locked INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO business_role_group_catalog
  (id,code,name,description,engine_role,active,sort_order,system_locked,created_at,updated_at)
VALUES
  ('BRG-engineer','engineer','Kỹ sư công trường','Nhóm nghiệp vụ hiện trường','engineer',1,10,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('BRG-commander','commander','Chỉ huy trưởng','Quản lý Ban chỉ huy công trường','commander',1,20,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('BRG-project','project','Phòng Dự án','Điều phối và kiểm soát dự án','project',1,30,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('BRG-procurement','procurement','KH-MH','Kế hoạch và mua hàng','procurement',1,40,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('BRG-accountant','accountant','Kế toán / Tài chính','Kiểm soát ngân sách và tài chính','accountant',1,50,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('BRG-warehouse','warehouse','Thủ kho','Nhập xuất và kiểm soát kho','warehouse',1,60,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('BRG-team','team','Tổ đội','Nhận và hoàn trả vật tư','team',1,70,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('BRG-director','director','Ban giám đốc','Theo dõi và phê duyệt','director',1,80,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('BRG-admin','admin','Quản trị hệ thống','Quản trị toàn hệ thống','admin',1,1,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

ALTER TABLE role_catalog ADD COLUMN business_group_id TEXT;
UPDATE role_catalog
SET business_group_id=(SELECT id FROM business_role_group_catalog g WHERE g.code=role_catalog.base_role)
WHERE business_group_id IS NULL;

CREATE TABLE IF NOT EXISTS ui_display_settings (
  id TEXT PRIMARY KEY,
  scope_key TEXT NOT NULL UNIQUE,
  settings_json TEXT NOT NULL,
  updated_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity SET version='5.2.0',product_description='Hệ thống Quản lý Kho M&E – tùy biến vai trò, giao diện và đối chiếu BOQ' WHERE id='VNTECH-KHO-MEP-001';
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
