-- W2 canonical organization, role and bulk-import integrity foundation.
CREATE TABLE IF NOT EXISTS organization_units (
  id TEXT PRIMARY KEY NOT NULL,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  unit_type TEXT NOT NULL,
  parent_id TEXT,
  project_id TEXT,
  description TEXT,
  effective_from TEXT,
  effective_to TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  archived_at TEXT,
  sort_order INTEGER NOT NULL DEFAULT 100,
  system_locked INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS organization_units_name_uq ON organization_units(lower(trim(name)));
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS organization_units_parent_idx ON organization_units(parent_id,active,sort_order);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS organization_units_project_idx ON organization_units(project_id,unit_type,active);
--> statement-breakpoint
INSERT OR IGNORE INTO organization_units
  (id,code,name,unit_type,parent_id,project_id,description,effective_from,effective_to,active,archived_at,sort_order,system_locked,created_at,updated_at)
VALUES
  ('ORG-VNTECH','VNTECH','VNTECH','company',NULL,NULL,'Đơn vị gốc công ty',NULL,NULL,1,NULL,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('ORG-KH','KH','Phòng Kế hoạch','department','ORG-VNTECH',NULL,'Kế hoạch, mua hàng và cung ứng',NULL,NULL,1,NULL,10,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('ORG-DA','DA','Phòng Dự án','department','ORG-VNTECH',NULL,'Điều phối và kiểm soát dự án',NULL,NULL,1,NULL,20,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('ORG-TCKT','TCKT','Tài chính Kế toán','department','ORG-VNTECH',NULL,'Tài chính và kế toán',NULL,NULL,1,NULL,30,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('ORG-HCPC','HCPC','Hành chính Pháp chế','department','ORG-VNTECH',NULL,'Hành chính, nhân sự và pháp chế',NULL,NULL,1,NULL,40,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('ORG-BCH','BCH','Ban chỉ huy công trường','site_command','ORG-VNTECH',NULL,'Đơn vị cha cho BCH động theo dự án',NULL,NULL,1,NULL,50,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
--> statement-breakpoint
ALTER TABLE users ADD COLUMN organization_unit_id TEXT;
--> statement-breakpoint
UPDATE users SET organization_unit_id='ORG-KH' WHERE organization_unit_id IS NULL AND (lower(department) IN ('kh','phòng kế hoạch','phong ke hoach') OR role IN ('procurement','kh_nv','kh_truong'));
--> statement-breakpoint
UPDATE users SET organization_unit_id='ORG-DA' WHERE organization_unit_id IS NULL AND (lower(department) IN ('da','phòng dự án','phong du an') OR role IN ('project','da_nv','da_truong'));
--> statement-breakpoint
UPDATE users SET organization_unit_id='ORG-TCKT' WHERE organization_unit_id IS NULL AND (lower(department) IN ('tckt','tài chính kế toán','tai chinh ke toan','kế toán / tài chính') OR role='accountant');
--> statement-breakpoint
UPDATE users SET organization_unit_id='ORG-HCPC' WHERE organization_unit_id IS NULL AND (lower(department) IN ('hcpc','hành chính pháp chế','hanh chinh phap che') OR role IN ('thuky','thu_ky_tgd'));
--> statement-breakpoint
UPDATE users SET organization_unit_id='ORG-BCH' WHERE organization_unit_id IS NULL AND role IN ('engineer','commander','warehouse','ksda','cht','thu_kho_da');
--> statement-breakpoint
UPDATE users SET organization_unit_id='ORG-VNTECH' WHERE organization_unit_id IS NULL AND role='admin';
--> statement-breakpoint
UPDATE ui_display_settings SET settings_json=replace(settings_json,'"designVersion":"v530-gate3aa-p10fix3"','"designVersion":"VNTECH-FULL-W2-UI-V5.3.0"'),updated_at=CURRENT_TIMESTAMP WHERE scope_key='company_default';
