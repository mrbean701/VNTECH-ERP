-- VNTECH ERP PATCH01 · Runtime-admin + BOQ hardening
-- Approved scope only: organization/import, dynamic business scope/RBAC mapping,
-- project lifecycle controls, BOQ multi-contract/version CRUD safety,
-- material subgroup bulk controls, M&E canonical alignment and matching safety.

-- 1) Canonical organization units required by the account-import template/runtime.
INSERT OR IGNORE INTO organization_units
  (id,code,name,unit_type,parent_id,project_id,description,effective_from,effective_to,active,archived_at,sort_order,system_locked,created_at,updated_at)
VALUES
  ('ORG-BGD','BGD','Ban giám đốc','department','ORG-VNTECH',NULL,'Ban lãnh đạo công ty',NULL,NULL,1,NULL,5,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('ORG-HCPC','HCPC','Hành chính Pháp chế','department','ORG-VNTECH',NULL,'Hành chính, nhân sự và pháp chế',NULL,NULL,1,NULL,40,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
--> statement-breakpoint

-- 2) Dynamic business-scope catalog. This is a company-owned taxonomy and is not the hidden technical permission engine.
CREATE TABLE IF NOT EXISTS business_scope_catalog (
  id TEXT PRIMARY KEY NOT NULL,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 100,
  system_locked INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS business_scope_name_uq ON business_scope_catalog(lower(trim(name)));
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS business_role_group_scopes (
  id TEXT PRIMARY KEY NOT NULL,
  business_group_id TEXT NOT NULL REFERENCES business_role_group_catalog(id),
  business_scope_id TEXT NOT NULL REFERENCES business_scope_catalog(id),
  is_primary INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(business_group_id,business_scope_id)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS business_role_group_scopes_group_idx ON business_role_group_scopes(business_group_id,is_primary);
--> statement-breakpoint
INSERT OR IGNORE INTO business_scope_catalog(id,code,name,description,active,sort_order,system_locked,created_at,updated_at) VALUES
 ('BSCOPE-FIELD','field_technical','Kỹ thuật hiện trường','Kỹ thuật hiện trường / kỹ sư dự án',1,10,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
 ('BSCOPE-BCH','site_command','Chỉ huy / BCH','Ban chỉ huy công trường',1,20,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
 ('BSCOPE-PROJECT','project_management','Phòng Dự án','Điều phối và kiểm soát dự án',1,30,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
 ('BSCOPE-PLAN','plan_procurement','Phòng Kế hoạch / Mua hàng','Kế hoạch, mua hàng và cung ứng',1,40,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
 ('BSCOPE-FINANCE','finance_accounting','Tài chính / Kế toán','Tài chính và kế toán',1,50,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
 ('BSCOPE-WAREHOUSE','warehouse','Kho','Kho dự án và Kho Tổng',1,60,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
 ('BSCOPE-TEAM','team','Tổ đội','Tổ đội thi công',1,70,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
 ('BSCOPE-LEADERSHIP','leadership','Ban lãnh đạo','Ban giám đốc và phê duyệt cấp công ty',1,80,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
 ('BSCOPE-HCPC','legal_admin','Hành chính Pháp chế','Hành chính, nhân sự và pháp chế',1,90,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO business_role_group_scopes(id,business_group_id,business_scope_id,is_primary,created_at,updated_at)
SELECT 'BRGS-'||g.id||'-BSCOPE-FIELD',g.id,'BSCOPE-FIELD',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP FROM business_role_group_catalog g WHERE g.engine_role='engineer';
--> statement-breakpoint
INSERT OR IGNORE INTO business_role_group_scopes(id,business_group_id,business_scope_id,is_primary,created_at,updated_at)
SELECT 'BRGS-'||g.id||'-BSCOPE-BCH',g.id,'BSCOPE-BCH',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP FROM business_role_group_catalog g WHERE g.engine_role='commander';
--> statement-breakpoint
INSERT OR IGNORE INTO business_role_group_scopes(id,business_group_id,business_scope_id,is_primary,created_at,updated_at)
SELECT 'BRGS-'||g.id||'-BSCOPE-PROJECT',g.id,'BSCOPE-PROJECT',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP FROM business_role_group_catalog g WHERE g.engine_role='project';
--> statement-breakpoint
INSERT OR IGNORE INTO business_role_group_scopes(id,business_group_id,business_scope_id,is_primary,created_at,updated_at)
SELECT 'BRGS-'||g.id||'-BSCOPE-PLAN',g.id,'BSCOPE-PLAN',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP FROM business_role_group_catalog g WHERE g.engine_role='procurement';
--> statement-breakpoint
INSERT OR IGNORE INTO business_role_group_scopes(id,business_group_id,business_scope_id,is_primary,created_at,updated_at)
SELECT 'BRGS-'||g.id||'-BSCOPE-FINANCE',g.id,'BSCOPE-FINANCE',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP FROM business_role_group_catalog g WHERE g.engine_role='accountant';
--> statement-breakpoint
INSERT OR IGNORE INTO business_role_group_scopes(id,business_group_id,business_scope_id,is_primary,created_at,updated_at)
SELECT 'BRGS-'||g.id||'-BSCOPE-WAREHOUSE',g.id,'BSCOPE-WAREHOUSE',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP FROM business_role_group_catalog g WHERE g.engine_role='warehouse';
--> statement-breakpoint
INSERT OR IGNORE INTO business_role_group_scopes(id,business_group_id,business_scope_id,is_primary,created_at,updated_at)
SELECT 'BRGS-'||g.id||'-BSCOPE-TEAM',g.id,'BSCOPE-TEAM',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP FROM business_role_group_catalog g WHERE g.engine_role='team';
--> statement-breakpoint
INSERT OR IGNORE INTO business_role_group_scopes(id,business_group_id,business_scope_id,is_primary,created_at,updated_at)
SELECT 'BRGS-'||g.id||'-BSCOPE-LEADERSHIP',g.id,'BSCOPE-LEADERSHIP',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP FROM business_role_group_catalog g WHERE g.engine_role='director';
--> statement-breakpoint

-- 3) Role -> default organization mapping, so dropdown/import/workflow use the same canonical masters.
ALTER TABLE role_catalog ADD COLUMN default_organization_unit_id TEXT REFERENCES organization_units(id);
--> statement-breakpoint
UPDATE role_catalog SET default_organization_unit_id='ORG-BGD' WHERE code IN ('director','thuky') AND default_organization_unit_id IS NULL;
--> statement-breakpoint
UPDATE role_catalog SET default_organization_unit_id='ORG-KH' WHERE code IN ('kh_truong','kh_nv','procurement') AND default_organization_unit_id IS NULL;
--> statement-breakpoint
UPDATE role_catalog SET default_organization_unit_id='ORG-DA' WHERE code IN ('da_truong','da_nv','project') AND default_organization_unit_id IS NULL;
--> statement-breakpoint
UPDATE role_catalog SET default_organization_unit_id='ORG-TCKT' WHERE code='accountant' AND default_organization_unit_id IS NULL;
--> statement-breakpoint
UPDATE role_catalog SET default_organization_unit_id='ORG-BCH' WHERE code IN ('ksda','cht','engineer','commander','thu_kho','warehouse') AND default_organization_unit_id IS NULL;
--> statement-breakpoint
UPDATE role_catalog SET name='Thư ký Tổng giám đốc',description='Thư ký Tổng giám đốc; tham gia luồng duyệt theo cấu hình, không đồng nhất với Trưởng phòng Hành chính Pháp chế',default_organization_unit_id='ORG-BGD',updated_at=CURRENT_TIMESTAMP WHERE code='thuky';
--> statement-breakpoint
-- 0044 từng tự gán role thuky vào HCPC; chuyển đúng các bản ghi auto-map cũ sang Ban giám đốc.
UPDATE users SET organization_unit_id='ORG-BGD',department='Ban giám đốc',updated_at=CURRENT_TIMESTAMP WHERE role IN ('thuky','thu_ky_tgd') AND organization_unit_id='ORG-HCPC';
--> statement-breakpoint
INSERT OR IGNORE INTO business_role_group_catalog(id,code,name,description,engine_role,active,sort_order,system_locked,created_at,updated_at)
VALUES('BRG-hcpc','hcpc','Hành chính Pháp chế','Nhóm nghiệp vụ Hành chính Pháp chế','director',1,85,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO business_role_group_scopes(id,business_group_id,business_scope_id,is_primary,created_at,updated_at)
VALUES('BRGS-BRG-hcpc-BSCOPE-HCPC','BRG-hcpc','BSCOPE-HCPC',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO role_catalog(id,code,name,description,base_role,business_group_id,warehouse_scope_kind,active,sort_order,system_locked,default_organization_unit_id,created_at,updated_at)
VALUES('ROLE-hcpc-truong','hcpc_truong','Trưởng phòng Hành chính Pháp chế','Quản lý nghiệp vụ Hành chính Pháp chế','director','BRG-hcpc',NULL,1,86,0,'ORG-HCPC',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
--> statement-breakpoint

-- 4) Canonical M&E code alignment. Điện nhẹ uses DNHE everywhere; old ELV is preserved as an import alias in application logic.
UPDATE material_categories SET code='DNHE',name='Điện nhẹ',updated_at=CURRENT_TIMESTAMP WHERE code='ELV' AND NOT EXISTS(SELECT 1 FROM material_categories WHERE code='DNHE');
--> statement-breakpoint
UPDATE materials SET system='DNHE',updated_at=CURRENT_TIMESTAMP WHERE upper(trim(COALESCE(system,'')))='ELV';
--> statement-breakpoint
-- Material Master và BOQ phải dùng cùng mã Hệ M&E canonical. category_id là nguồn chuẩn cho dữ liệu vật tư hiện hữu.
UPDATE materials SET system=(SELECT mc.code FROM material_categories mc WHERE mc.id=materials.category_id),updated_at=CURRENT_TIMESTAMP
WHERE category_id IS NOT NULL AND EXISTS(SELECT 1 FROM material_categories mc WHERE mc.id=materials.category_id AND mc.code IN ('DIEN','CTN','HVAC','DNHE','PCCC','KHAC'));
--> statement-breakpoint
UPDATE boq_source_items SET source_system_code='DNHE',updated_at=CURRENT_TIMESTAMP WHERE upper(trim(COALESCE(source_system_code,'')))='ELV';
--> statement-breakpoint
UPDATE purchase_order_items SET system_code='DNHE' WHERE upper(trim(COALESCE(system_code,'')))='ELV';
--> statement-breakpoint

-- 5) Dedicated BOQ change history in addition to generic audit_logs.
CREATE TABLE IF NOT EXISTS boq_change_history (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id),
  contract_id TEXT REFERENCES project_contracts(id),
  boq_version_id TEXT REFERENCES boq_versions(id),
  source_item_id TEXT REFERENCES boq_source_items(id),
  project_boq_item_id TEXT REFERENCES project_boq_items(id),
  action_type TEXT NOT NULL,
  before_json TEXT,
  after_json TEXT,
  reason TEXT,
  actor_user_id TEXT REFERENCES users(id),
  created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS boq_change_history_scope_idx ON boq_change_history(project_id,contract_id,boq_version_id,created_at);
--> statement-breakpoint

-- 6) DNMH approval flow FINAL 2026-09-04.
-- CHT bấm Gửi = xác nhận cấp 1 ngay; hồ sơ chuyển sang Thư ký TGĐ ở cấp 2.
UPDATE approval_stage_catalog SET name='CHT xác nhận nhu cầu',description='CHT xác nhận nhu cầu khi bấm Gửi; bước này hoàn tất tự động và hồ sơ chuyển ngay sang Thư ký Tổng giám đốc',allowed_role_codes='commander,cht',approval_mode='single',sla_hours=0,auto_approve_on_submit=1,active=1,sort_order=10,updated_at=CURRENT_TIMESTAMP WHERE stage_no=1;
--> statement-breakpoint
UPDATE approval_stage_catalog SET name='Thư ký Tổng giám đốc',description='Kiểm tra hồ sơ và duyệt chuyển Phòng Dự án',allowed_role_codes='thuky,thu_ky_tgd',approval_mode='single',sla_hours=12,auto_approve_on_submit=0,active=1,sort_order=20,updated_at=CURRENT_TIMESTAMP WHERE stage_no=2;
--> statement-breakpoint
UPDATE approval_stage_catalog SET name='Phòng Dự án',description='Kiểm tra BOQ, khối lượng, lũy kế, tồn kho, hàng chờ giao và phát sinh',allowed_role_codes='project,da_nv',approval_mode='single',sla_hours=24,auto_approve_on_submit=0,active=1,sort_order=30,updated_at=CURRENT_TIMESTAMP WHERE stage_no=3;
--> statement-breakpoint
UPDATE approval_stage_catalog SET name='Trưởng phòng Dự án',description='Phê duyệt trách nhiệm dự án, kỹ thuật và khối lượng trước khi trình Trưởng phòng Kế hoạch',allowed_role_codes='da_truong',approval_mode='single',sla_hours=12,auto_approve_on_submit=0,active=1,sort_order=40,updated_at=CURRENT_TIMESTAMP WHERE stage_no=4;
--> statement-breakpoint
UPDATE approval_stage_catalog SET name='Trưởng phòng Kế hoạch',description='Phê duyệt cuối trước khi chuyển hồ sơ sang Mua hàng & PO',allowed_role_codes='kh_truong',approval_mode='single',sla_hours=12,auto_approve_on_submit=0,active=1,sort_order=50,updated_at=CURRENT_TIMESTAMP WHERE stage_no=5;
--> statement-breakpoint
UPDATE approval_stage_catalog SET active=0,auto_approve_on_submit=0,updated_at=CURRENT_TIMESTAMP WHERE stage_no>5;
--> statement-breakpoint
UPDATE role_catalog SET description='Lập và chịu trách nhiệm nhu cầu vật tư tại công trường; bấm Gửi đồng thời là xác nhận cấp 1 và hồ sơ chuyển ngay Thư ký TGĐ. Sau khi gửi không được tự thu hồi; khi phiếu bị trả lại, CHT sửa và gửi lại từ đầu hoặc xóa phiếu chưa phát sinh PO để lập mới.',updated_at=CURRENT_TIMESTAMP WHERE code IN ('cht','commander');
--> statement-breakpoint
UPDATE role_catalog SET description='Kiểm tra hồ sơ đề nghị mua hàng sau CHT và duyệt chuyển Phòng Dự án; trả lại phải nêu lý do.',updated_at=CURRENT_TIMESTAMP WHERE code IN ('thuky','thu_ky_tgd');
--> statement-breakpoint
UPDATE role_catalog SET description='Kiểm tra BOQ, khối lượng, lũy kế, tồn kho, hàng chờ giao và phát sinh của ĐNMH trước khi trình Trưởng phòng Dự án.',updated_at=CURRENT_TIMESTAMP WHERE code IN ('da_nv','project');
--> statement-breakpoint
UPDATE role_catalog SET description='Phê duyệt ĐNMH về trách nhiệm dự án/kỹ thuật/khối lượng trước khi trình Trưởng phòng Kế hoạch.',updated_at=CURRENT_TIMESTAMP WHERE code='da_truong';
--> statement-breakpoint
UPDATE role_catalog SET description='Phê duyệt cuối ĐNMH trước khi chuyển sang Mua hàng & PO.',updated_at=CURRENT_TIMESTAMP WHERE code='kh_truong';
--> statement-breakpoint
UPDATE role_catalog SET description='Thực hiện RFQ/NCC/PO và mua hàng sau khi Trưởng phòng Kế hoạch phê duyệt ĐNMH; không tham gia bước duyệt trước đó.',updated_at=CURRENT_TIMESTAMP WHERE code IN ('kh_nv','procurement');
--> statement-breakpoint
