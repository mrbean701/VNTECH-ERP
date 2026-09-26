-- VNTECH ERP V5.3.0 RC1 DEPT FIX 1 - 2026-08-28
-- Department management Task Engine: separate Planning/Project domains, automatic SLA from assigned_at, in-app + email notifications.

CREATE TABLE IF NOT EXISTS work_items (
  id TEXT PRIMARY KEY NOT NULL,
  task_no TEXT NOT NULL,
  department_code TEXT NOT NULL,
  work_group TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  project_id TEXT,
  source_module TEXT,
  source_type TEXT,
  source_id TEXT,
  source_no TEXT,
  work_step TEXT NOT NULL,
  dedupe_key TEXT NOT NULL,
  task_origin TEXT NOT NULL DEFAULT 'manual',
  assigned_to TEXT NOT NULL,
  assigned_by TEXT NOT NULL,
  assigned_at TEXT NOT NULL,
  due_at TEXT,
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'NEW',
  progress INTEGER NOT NULL DEFAULT 0,
  required_output TEXT,
  waiting_reason TEXT,
  waiting_started_at TEXT,
  submitted_at TEXT,
  completed_at TEXT,
  completed_by TEXT,
  cancelled_at TEXT,
  cancelled_by TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(task_no),
  UNIQUE(dedupe_key)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS work_items_department_idx ON work_items(department_code,status,assigned_to,due_at);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS work_items_project_idx ON work_items(project_id,department_code,status);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS work_items_source_idx ON work_items(source_type,source_id,work_step);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS work_item_events (
  id TEXT PRIMARY KEY NOT NULL,
  work_item_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  actor_user_id TEXT NOT NULL,
  previous_assignee TEXT,
  new_assignee TEXT,
  reason TEXT,
  detail_json TEXT,
  occurred_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS work_item_events_task_idx ON work_item_events(work_item_id,occurred_at);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS task_notifications (
  id TEXT PRIMARY KEY NOT NULL,
  work_item_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'in_app',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  read_at TEXT,
  sent_at TEXT,
  last_error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS task_notifications_user_idx ON task_notifications(user_id,read_at,created_at);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS task_sla_policies (
  department_code TEXT NOT NULL,
  status TEXT NOT NULL,
  responsibility_clock_runs INTEGER NOT NULL DEFAULT 1,
  process_clock_runs INTEGER NOT NULL DEFAULT 1,
  requires_reason INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(department_code,status)
);
--> statement-breakpoint
INSERT OR IGNORE INTO task_sla_policies(department_code,status,responsibility_clock_runs,process_clock_runs,requires_reason,updated_at) VALUES
('KH','NEW',1,1,0,CURRENT_TIMESTAMP),('KH','IN_PROGRESS',1,1,0,CURRENT_TIMESTAMP),
('KH','WAITING_SUPPLIER',0,1,1,CURRENT_TIMESTAMP),('KH','WAITING_CLIENT',0,1,1,CURRENT_TIMESTAMP),('KH','WAITING_APPROVAL',0,1,1,CURRENT_TIMESTAMP),('KH','WAITING_PROJECT',0,1,1,CURRENT_TIMESTAMP),
('KH','BLOCKED',0,1,1,CURRENT_TIMESTAMP),('KH','ON_HOLD',0,0,1,CURRENT_TIMESTAMP),('KH','SUBMITTED',0,1,0,CURRENT_TIMESTAMP),('KH','REWORK',1,1,1,CURRENT_TIMESTAMP),('KH','COMPLETED',0,0,0,CURRENT_TIMESTAMP),('KH','CANCELLED',0,0,1,CURRENT_TIMESTAMP),
('DA','NEW',1,1,0,CURRENT_TIMESTAMP),('DA','IN_PROGRESS',1,1,0,CURRENT_TIMESTAMP),
('DA','WAITING_SUPPLIER',0,1,1,CURRENT_TIMESTAMP),('DA','WAITING_CLIENT',0,1,1,CURRENT_TIMESTAMP),('DA','WAITING_APPROVAL',0,1,1,CURRENT_TIMESTAMP),('DA','WAITING_PROJECT',0,1,1,CURRENT_TIMESTAMP),
('DA','BLOCKED',0,1,1,CURRENT_TIMESTAMP),('DA','ON_HOLD',0,0,1,CURRENT_TIMESTAMP),('DA','SUBMITTED',0,1,0,CURRENT_TIMESTAMP),('DA','REWORK',1,1,1,CURRENT_TIMESTAMP),('DA','COMPLETED',0,0,0,CURRENT_TIMESTAMP),('DA','CANCELLED',0,0,1,CURRENT_TIMESTAMP);
--> statement-breakpoint

-- Complete Department Management menu. Planning and Project remain separate business domains.
INSERT OR IGNORE INTO module_catalog (module_key,label,icon,group_name,group_key,active,sort_order,system_locked,created_at,updated_at) VALUES
('dept_plan_supply_plan','Kế hoạch mua hàng & cung ứng','KH','QUẢN LÝ PHÒNG BAN','department_management',1,23,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('dept_plan_rfq','Xin giá vật tư','RF','QUẢN LÝ PHÒNG BAN','department_management',1,25,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('dept_plan_purchasing','Mua hàng vật tư thiết bị','MH','QUẢN LÝ PHÒNG BAN','department_management',1,26,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('dept_plan_supply','Cung ứng vật tư cho dự án','CU','QUẢN LÝ PHÒNG BAN','department_management',1,27,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('dept_plan_contracts','Hợp đồng các loại','HD','QUẢN LÝ PHÒNG BAN','department_management',1,28,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('dept_plan_suppliers','Nhà cung cấp / Đối tác','NC','QUẢN LÝ PHÒNG BAN','department_management',1,29,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('dept_plan_price_data','Giá & dữ liệu thương mại','DG','QUẢN LÝ PHÒNG BAN','department_management',1,30,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('dept_plan_kpi','KPI & hiệu suất nhân viên','KP','QUẢN LÝ PHÒNG BAN','department_management',1,31,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('dept_plan_alerts','Báo cáo & cảnh báo','CB','QUẢN LÝ PHÒNG BAN','department_management',1,32,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('dept_project_pda','PDA / Điều phối dự án','PD','QUẢN LÝ PHÒNG BAN','department_management',1,35,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('dept_project_plan','Kế hoạch triển khai dự án','KH','QUẢN LÝ PHÒNG BAN','department_management',1,37,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('dept_project_shop','Shopdrawing & trình duyệt','SD','QUẢN LÝ PHÒNG BAN','department_management',1,38,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('dept_project_boq','BOQ & bóc tách khối lượng','BQ','QUẢN LÝ PHÒNG BAN','department_management',1,39,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('dept_project_material','Kiểm soát vật tư & đặt hàng','VT','QUẢN LÝ PHÒNG BAN','department_management',1,40,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('dept_project_issues','Phát sinh / RFI / RFQ / NCR','PS','QUẢN LÝ PHÒNG BAN','department_management',1,41,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('dept_project_asbuilt','Hoàn công','HC','QUẢN LÝ PHÒNG BAN','department_management',1,42,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('dept_project_payment','Thanh toán / Quyết toán','TT','QUẢN LÝ PHÒNG BAN','department_management',1,43,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('dept_project_kpi','KPI & hiệu suất nhân viên','KP','QUẢN LÝ PHÒNG BAN','department_management',1,45,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('dept_project_alerts','Báo cáo & cảnh báo','CB','QUẢN LÝ PHÒNG BAN','department_management',1,46,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
--> statement-breakpoint
UPDATE module_catalog SET sort_order=21,updated_at=CURRENT_TIMESTAMP WHERE module_key='dept_plan_tasks';
UPDATE module_catalog SET sort_order=22,updated_at=CURRENT_TIMESTAMP WHERE module_key='dept_plan_assign';
UPDATE module_catalog SET label='Đấu thầu',sort_order=24,updated_at=CURRENT_TIMESTAMP WHERE module_key='dept_plan_tender';
UPDATE module_catalog SET sort_order=34,updated_at=CURRENT_TIMESTAMP WHERE module_key='dept_project_tasks';
UPDATE module_catalog SET sort_order=36,updated_at=CURRENT_TIMESTAMP WHERE module_key='dept_project_assign';
UPDATE module_catalog SET label='Đấu thầu kỹ thuật',sort_order=44,updated_at=CURRENT_TIMESTAMP WHERE module_key='dept_project_tender';
--> statement-breakpoint

-- Existing department staff inherit the new department modules. Admin remains unrestricted in backend.
INSERT OR IGNORE INTO user_module_permissions(id,user_id,module_key,can_view,can_use,can_create,can_edit,can_approve,can_export,permission_expires_at,created_at,updated_at)
SELECT 'UMP-DEPT-KH-'||u.id||'-'||m.module_key,u.id,m.module_key,1,1,1,1,CASE WHEN u.role='kh_truong' THEN 1 ELSE 0 END,1,NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
FROM users u LEFT JOIN role_catalog r ON r.code=u.role
JOIN module_catalog m ON m.module_key LIKE 'dept_plan_%'
WHERE COALESCE(r.base_role,u.role)='procurement';
--> statement-breakpoint
INSERT OR IGNORE INTO user_module_permissions(id,user_id,module_key,can_view,can_use,can_create,can_edit,can_approve,can_export,permission_expires_at,created_at,updated_at)
SELECT 'UMP-DEPT-DA-'||u.id||'-'||m.module_key,u.id,m.module_key,1,1,1,1,CASE WHEN u.role='da_truong' THEN 1 ELSE 0 END,1,NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
FROM users u LEFT JOIN role_catalog r ON r.code=u.role
JOIN module_catalog m ON m.module_key LIKE 'dept_project_%'
WHERE COALESCE(r.base_role,u.role)='project';
--> statement-breakpoint
