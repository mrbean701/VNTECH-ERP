-- VNTECH ERP V5.3.0 RC1 - 2026-08-27
-- Baseline: ERP menu, department separation, warehouse scope lock, 5-step approval with final AND confirmation.

ALTER TABLE role_catalog ADD COLUMN warehouse_scope_kind TEXT;
--> statement-breakpoint
ALTER TABLE approval_stage_catalog ADD COLUMN approval_mode TEXT NOT NULL DEFAULT 'single';
--> statement-breakpoint
ALTER TABLE approvals ADD COLUMN allowed_role_codes_snapshot TEXT;
--> statement-breakpoint
ALTER TABLE approvals ADD COLUMN approval_mode_snapshot TEXT NOT NULL DEFAULT 'single';
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS user_warehouse_scopes (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  warehouse_id TEXT NOT NULL,
  permission TEXT NOT NULL DEFAULT 'read',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(user_id, warehouse_id)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS user_warehouse_scope_user_idx ON user_warehouse_scopes(user_id);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS approval_stage_decisions (
  id TEXT PRIMARY KEY NOT NULL,
  request_id TEXT NOT NULL,
  stage INTEGER NOT NULL,
  role_code TEXT NOT NULL,
  user_id TEXT NOT NULL,
  decision TEXT NOT NULL,
  comment TEXT,
  decided_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(request_id, stage, role_code)
);
--> statement-breakpoint

-- Preserve approval rules for requests already in flight before changing the catalog.
UPDATE approvals
SET allowed_role_codes_snapshot=COALESCE(
      allowed_role_codes_snapshot,
      (SELECT allowed_role_codes FROM approval_stage_catalog s WHERE s.stage_no=approvals.stage),
      ''
    ),
    approval_mode_snapshot=COALESCE(
      NULLIF(approval_mode_snapshot,''),
      (SELECT approval_mode FROM approval_stage_catalog s WHERE s.stage_no=approvals.stage),
      'single'
    );
--> statement-breakpoint

-- Stable warehouse-role semantics: site keepers and central keepers can never cross scopes.
UPDATE role_catalog SET warehouse_scope_kind='site',name='Thủ kho dự án',description='Chỉ thao tác đúng dự án/kho được phân công',updated_at=CURRENT_TIMESTAMP WHERE code='warehouse';
--> statement-breakpoint
UPDATE role_catalog SET name='Kỹ sư dự án',description='Kỹ sư BCH lập Phiếu đề nghị mua hàng',updated_at=CURRENT_TIMESTAMP WHERE code='engineer';
--> statement-breakpoint
UPDATE role_catalog SET name='Nhân viên Phòng Dự án',description='Kiểm tra khối lượng/yêu cầu mua theo dự án',updated_at=CURRENT_TIMESTAMP WHERE code='project';
--> statement-breakpoint
UPDATE role_catalog SET name='Nhân viên Phòng Kế hoạch',description='Kế hoạch kiêm mua hàng, PO và theo dõi giao hàng',updated_at=CURRENT_TIMESTAMP WHERE code='procurement';
--> statement-breakpoint
UPDATE role_catalog SET name='Ban Lãnh đạo',updated_at=CURRENT_TIMESTAMP WHERE code='director';
--> statement-breakpoint

INSERT OR IGNORE INTO business_role_group_catalog (id,code,name,description,engine_role,active,sort_order,system_locked,created_at,updated_at) VALUES
('BRG-kho-tong','kho_tong','Kho Tổng','Vận hành riêng Kho Tổng, không thao tác kho dự án','warehouse',1,65,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
--> statement-breakpoint

INSERT OR IGNORE INTO role_catalog (id,code,name,description,base_role,business_group_id,warehouse_scope_kind,active,sort_order,system_locked,created_at,updated_at) VALUES
('ROLE-kh-truong','kh_truong','Trưởng phòng Kế hoạch','Quản lý Kế hoạch/Mua hàng và xác nhận cuối','procurement','BRG-procurement',NULL,1,41,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('ROLE-kh-nv','kh_nv','Nhân viên Phòng Kế hoạch','Mua hàng, PO, kế hoạch giao hàng','procurement','BRG-procurement',NULL,1,42,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('ROLE-da-truong','da_truong','Trưởng phòng Dự án','Quản lý dự án và xác nhận cuối','project','BRG-project',NULL,1,31,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('ROLE-da-nv','da_nv','Nhân viên Phòng Dự án','Kiểm tra khối lượng đặt hàng','project','BRG-project',NULL,1,32,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('ROLE-thuky','thuky','Thư ký Tổng giám đốc / Trưởng phòng Hành chính Pháp chế','Duyệt sau CHT trước Phòng Dự án','director','BRG-director',NULL,1,15,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('ROLE-cht','cht','Chỉ huy trưởng','Xác nhận nhu cầu dự án','commander','BRG-commander',NULL,1,21,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('ROLE-ksda','ksda','Kỹ sư dự án','Lập Phiếu đề nghị mua hàng tại BCH','engineer','BRG-engineer',NULL,1,11,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('ROLE-thu-kho','thu_kho','Thủ kho dự án','Chỉ đúng dự án và kho được phân công','warehouse','BRG-warehouse','site',1,61,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('ROLE-kho-tong','kho_tong','Thủ kho Tổng','Chỉ thao tác Kho Tổng, không thao tác kho dự án','warehouse','BRG-kho-tong','central',1,66,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
--> statement-breakpoint

-- Backfill warehouse scope for existing project warehouse users.
INSERT OR IGNORE INTO user_warehouse_scopes (id,user_id,warehouse_id,permission,created_at,updated_at)
SELECT 'UWS-'||u.id||'-'||w.id,u.id,w.id,
       CASE WHEN ups.permission IN ('write','approve','admin') THEN 'write' ELSE 'read' END,
       CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
FROM users u
JOIN role_catalog rc ON rc.code=u.role
JOIN user_project_scopes ups ON ups.user_id=u.id
JOIN warehouses w ON w.project_id=ups.project_id AND w.type='site' AND w.active=1
  AND (
    w.keeper_user_id=u.id
    OR (
      w.keeper_user_id IS NULL
      AND 1=(SELECT COUNT(*) FROM warehouses wx WHERE wx.project_id=ups.project_id AND wx.type='site' AND wx.active=1)
    )
  )
WHERE COALESCE(rc.base_role,u.role)='warehouse' AND COALESCE(rc.warehouse_scope_kind,'site')='site';
--> statement-breakpoint

-- ERP top-level menu locked to the approved 6-parent structure.
INSERT OR IGNORE INTO menu_group_catalog (id,group_key,name,icon,active,sort_order,collapsible,system_locked,created_at,updated_at) VALUES
('MGR_OVERVIEW','overview','TỔNG QUAN','OV',1,10,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('MGR_DEPARTMENT','department_management','QUẢN LÝ PHÒNG BAN','PB',1,20,1,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('MGR_PROJECT','project_management','QUẢN LÝ DỰ ÁN','DA',1,30,1,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
--> statement-breakpoint
UPDATE menu_group_catalog SET name='MUA HÀNG',sort_order=40,active=1,updated_at=CURRENT_TIMESTAMP WHERE group_key='purchasing';
--> statement-breakpoint
UPDATE menu_group_catalog SET name='KHO VẬT TƯ',sort_order=50,active=1,updated_at=CURRENT_TIMESTAMP WHERE group_key='warehouse';
--> statement-breakpoint
UPDATE menu_group_catalog SET name='QUẢN TRỊ HỆ THỐNG',sort_order=60,active=1,updated_at=CURRENT_TIMESTAMP WHERE group_key='system_admin';
--> statement-breakpoint
UPDATE menu_group_catalog SET active=0,updated_at=CURRENT_TIMESTAMP WHERE group_key IN ('boq_contract','teams','reports','catalog');
--> statement-breakpoint

INSERT OR IGNORE INTO module_catalog (module_key,label,icon,group_name,group_key,active,sort_order,system_locked,created_at,updated_at) VALUES
('dept_plan_tasks','Nhiệm vụ nhân viên đang làm','NV','QUẢN LÝ PHÒNG BAN','department_management',1,21,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('dept_plan_assign','Giao việc & Kiểm soát hoàn thành','GV','QUẢN LÝ PHÒNG BAN','department_management',1,22,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('dept_plan_tender','Đấu thầu','DT','QUẢN LÝ PHÒNG BAN','department_management',1,23,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('dept_project_tasks','Nhiệm vụ nhân viên đang làm','NV','QUẢN LÝ PHÒNG BAN','department_management',1,24,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('dept_project_assign','Giao việc & Kiểm soát hoàn thành','GV','QUẢN LÝ PHÒNG BAN','department_management',1,25,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('dept_project_tender','Đấu thầu','DT','QUẢN LÝ PHÒNG BAN','department_management',1,26,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('project_progress','Tiến độ dự án','TD','QUẢN LÝ DỰ ÁN','project_management',1,31,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('construction','Thi công','TC','QUẢN LÝ DỰ ÁN','project_management',1,32,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('production','Sản lượng','SL','QUẢN LÝ DỰ ÁN','project_management',1,33,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('capital_recovery','Thu hồi vốn','TH','QUẢN LÝ DỰ ÁN','project_management',1,34,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('warehouse_receipt','Nhập kho','NK','KHO VẬT TƯ','warehouse',1,51,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('warehouse_issue','Xuất kho','XK','KHO VẬT TƯ','warehouse',1,52,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('material_norms','Định mức vật tư theo dự án','ĐM','KHO VẬT TƯ','warehouse',1,56,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('material_catalog','Danh mục mã vật tư (chung toàn công ty)','MV','KHO VẬT TƯ','warehouse',1,58,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
--> statement-breakpoint

UPDATE module_catalog SET label='Tổng quan điều hành',group_key='overview',group_name='TỔNG QUAN',sort_order=10,active=1,updated_at=CURRENT_TIMESTAMP WHERE module_key='dashboard';
UPDATE module_catalog SET label='BOQ / Hợp đồng dự án',group_key='project_management',group_name='QUẢN LÝ DỰ ÁN',sort_order=35,active=1,updated_at=CURRENT_TIMESTAMP WHERE module_key='boq';
UPDATE module_catalog SET label='Thanh toán hợp đồng',group_key='project_management',group_name='QUẢN LÝ DỰ ÁN',sort_order=36,active=1,updated_at=CURRENT_TIMESTAMP WHERE module_key='payments';
UPDATE module_catalog SET label='Tổ đội theo dự án',group_key='project_management',group_name='QUẢN LÝ DỰ ÁN',sort_order=37,active=1,updated_at=CURRENT_TIMESTAMP WHERE module_key='teams';
UPDATE module_catalog SET label='Phiếu đề nghị mua hàng',group_key='purchasing',group_name='MUA HÀNG',sort_order=41,active=1,updated_at=CURRENT_TIMESTAMP WHERE module_key='requests';
UPDATE module_catalog SET label='Phê duyệt đơn hàng',group_key='purchasing',group_name='MUA HÀNG',sort_order=42,active=1,updated_at=CURRENT_TIMESTAMP WHERE module_key='approvals';
UPDATE module_catalog SET label='Mua hàng & PO',group_key='purchasing',group_name='MUA HÀNG',sort_order=43,active=1,updated_at=CURRENT_TIMESTAMP WHERE module_key='purchasing';
UPDATE module_catalog SET label='Kế hoạch giao hàng',group_key='purchasing',group_name='MUA HÀNG',sort_order=44,active=1,updated_at=CURRENT_TIMESTAMP WHERE module_key='receiving';
UPDATE module_catalog SET label='Đơn hàng đã giao',group_key='purchasing',group_name='MUA HÀNG',sort_order=45,active=1,updated_at=CURRENT_TIMESTAMP WHERE module_key='delivered';
UPDATE module_catalog SET label='Tồn kho & điều chuyển',group_key='warehouse',group_name='KHO VẬT TƯ',sort_order=53,active=1,updated_at=CURRENT_TIMESTAMP WHERE module_key='inventory';
UPDATE module_catalog SET label='Kiểm kê & hoàn trả',group_key='warehouse',group_name='KHO VẬT TƯ',sort_order=54,active=1,updated_at=CURRENT_TIMESTAMP WHERE module_key='stocktake';
UPDATE module_catalog SET label='Tồn kho tổng (toàn công ty)',group_key='warehouse',group_name='KHO VẬT TƯ',sort_order=57,active=1,updated_at=CURRENT_TIMESTAMP WHERE module_key='central_warehouse';
UPDATE module_catalog SET label='Phân quyền & Cấu hình hệ thống',group_key='system_admin',group_name='QUẢN TRỊ HỆ THỐNG',sort_order=61,active=1,updated_at=CURRENT_TIMESTAMP WHERE module_key='admin';
UPDATE module_catalog SET active=0,updated_at=CURRENT_TIMESTAMP WHERE module_key='reports';
--> statement-breakpoint

-- Alias permissions inherit the existing real functional modules for existing users.
INSERT OR IGNORE INTO user_module_permissions (id,user_id,module_key,can_view,can_use,can_create,can_edit,can_approve,can_export,permission_expires_at,created_at,updated_at)
SELECT 'UMP-WR-'||user_id,user_id,'warehouse_receipt',can_view,can_use,can_create,can_edit,can_approve,can_export,permission_expires_at,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP FROM user_module_permissions WHERE module_key='receiving';
INSERT OR IGNORE INTO user_module_permissions (id,user_id,module_key,can_view,can_use,can_create,can_edit,can_approve,can_export,permission_expires_at,created_at,updated_at)
SELECT 'UMP-WI-'||user_id,user_id,'warehouse_issue',can_view,can_use,can_create,can_edit,can_approve,can_export,permission_expires_at,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP FROM user_module_permissions WHERE module_key='teams';
INSERT OR IGNORE INTO user_module_permissions (id,user_id,module_key,can_view,can_use,can_create,can_edit,can_approve,can_export,permission_expires_at,created_at,updated_at)
SELECT 'UMP-MC-'||user_id,user_id,'material_catalog',can_view,can_use,can_create,can_edit,can_approve,can_export,permission_expires_at,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP FROM user_module_permissions WHERE module_key='central_warehouse';
--> statement-breakpoint

-- New workflow for NEW requests. Existing requests keep snapshots from above.
UPDATE approval_stage_catalog SET name='CHT xác nhận nhu cầu',description='Kỹ sư dự án lập phiếu; CHT xác nhận nhu cầu dự án',allowed_role_codes='commander,cht',approval_mode='single',sla_hours=12,auto_approve_on_submit=0,active=1,sort_order=10,updated_at=CURRENT_TIMESTAMP WHERE stage_no=1;
UPDATE approval_stage_catalog SET name='Thư ký Tổng giám đốc duyệt',description='Duyệt đầu tiên sau CHT trước khi chuyển Phòng Dự án',allowed_role_codes='thuky',approval_mode='single',sla_hours=12,auto_approve_on_submit=0,active=1,sort_order=20,updated_at=CURRENT_TIMESTAMP WHERE stage_no=2;
UPDATE approval_stage_catalog SET name='Phòng Dự án kiểm tra khối lượng',description='Nhân viên chuyên quản kiểm tra khối lượng/BOQ',allowed_role_codes='project,da_nv',approval_mode='single',sla_hours=24,auto_approve_on_submit=0,active=1,sort_order=30,updated_at=CURRENT_TIMESTAMP WHERE stage_no=3;
INSERT OR IGNORE INTO approval_stage_catalog (id,stage_no,name,description,allowed_role_codes,approval_mode,sla_hours,auto_approve_on_submit,active,sort_order,created_at,updated_at) VALUES
('ASTAGE-4',4,'Phòng Kế hoạch tiếp nhận','Nhân viên Kế hoạch tiếp nhận và chuẩn bị mua hàng','procurement,kh_nv','single',24,0,1,40,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('ASTAGE-5',5,'Trưởng phòng Dự án + Kế hoạch xác nhận cuối','Bắt buộc đủ cả hai vai trò xác nhận trước khi được lập PO','da_truong,kh_truong','all_roles',12,0,1,50,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
--> statement-breakpoint
UPDATE approval_stage_catalog SET active=0,updated_at=CURRENT_TIMESTAMP WHERE stage_no>5;
--> statement-breakpoint

-- Correct product identity columns; protect again after update.
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
