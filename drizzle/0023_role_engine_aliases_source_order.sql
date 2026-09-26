-- KHO VNTECH V5.2.3 FINAL: editable company codes/names for technical permission engines.
CREATE TABLE IF NOT EXISTS business_role_engine_catalog (
  id TEXT PRIMARY KEY,
  engine_key TEXT NOT NULL UNIQUE,
  company_code TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 100,
  system_locked INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO business_role_engine_catalog
  (id,engine_key,company_code,display_name,description,active,sort_order,system_locked,created_at,updated_at)
VALUES
  ('BRE-engineer','engineer','engineer','Kỹ sư công trường','Thực hiện nghiệp vụ hiện trường',1,1,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('BRE-commander','commander','commander','Chỉ huy trưởng','Quản lý Ban chỉ huy công trường',1,2,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('BRE-project','project','project','Phòng Dự án','Điều phối và kiểm soát dự án',1,3,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('BRE-procurement','procurement','procurement','KH-MH','Kế hoạch và mua hàng',1,4,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('BRE-accountant','accountant','accountant','Kế toán / Tài chính','Kiểm soát ngân sách và tài chính',1,5,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('BRE-warehouse','warehouse','warehouse','Thủ kho','Nhập xuất và kiểm soát kho',1,6,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('BRE-team','team','team','Tổ đội','Nhận và hoàn trả vật tư',1,7,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('BRE-director','director','director','Ban giám đốc','Theo dõi và phê duyệt',1,8,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('BRE-admin','admin','admin','Quản trị hệ thống','Quản trị toàn hệ thống',1,9,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

-- The source order is an internal value generated from the original Excel row.
-- It must never be requested from users or exposed in the normal BOQ template.
INSERT OR IGNORE INTO form_field_config
  (id,form_key,field_key,display_name,data_type,source_kind,visible,required,importable,exportable,editable,sort_order,options_json,system_locked,active,created_at,updated_at)
VALUES
  ('FFC-boq-sourceOrder','boq','sourceOrder','Thứ tự nguồn','number','system',0,0,0,0,0,0,NULL,1,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

UPDATE form_field_config
SET visible=0,
    required=0,
    importable=0,
    exportable=0,
    editable=0,
    sort_order=0,
    updated_at=CURRENT_TIMESTAMP
WHERE form_key='boq' AND field_key='sourceOrder';

DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET version='5.2.3',
    product_description='Hệ thống Quản lý Kho M&E – tùy biến mã/tên nhóm quyền, nhãn quyền nền và thứ tự BOQ tự động'
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
