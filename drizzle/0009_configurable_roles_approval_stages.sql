CREATE TABLE IF NOT EXISTS role_catalog (
  id TEXT PRIMARY KEY NOT NULL,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  base_role TEXT NOT NULL DEFAULT 'engineer',
  active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  system_locked INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS approval_stage_catalog (
  id TEXT PRIMARY KEY NOT NULL,
  stage_no INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  allowed_role_codes TEXT NOT NULL DEFAULT '',
  sla_hours INTEGER NOT NULL DEFAULT 8,
  auto_approve_on_submit INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO role_catalog (id,code,name,description,base_role,active,sort_order,system_locked,created_at,updated_at) VALUES
('ROLE-admin','admin','Quản trị hệ thống','Toàn quyền cấu hình hệ thống','admin',1,0,1,datetime('now'),datetime('now')),
('ROLE-engineer','engineer','Kỹ sư công trường','Lập và theo dõi đề nghị vật tư','engineer',1,10,1,datetime('now'),datetime('now')),
('ROLE-commander','commander','Chỉ huy trưởng','Quản lý BCH và xác nhận nghiệp vụ công trường','commander',1,20,1,datetime('now'),datetime('now')),
('ROLE-project','project','Phòng Dự án','Điều phối, kiểm soát hồ sơ dự án','project',1,30,1,datetime('now'),datetime('now')),
('ROLE-procurement','procurement','KH-MH','Kế hoạch - mua hàng','procurement',1,40,1,datetime('now'),datetime('now')),
('ROLE-accountant','accountant','Kế toán / Tài chính','Kiểm soát ngân sách và tài chính','accountant',1,50,1,datetime('now'),datetime('now')),
('ROLE-warehouse','warehouse','Thủ kho','Nhập xuất và kiểm soát kho','warehouse',1,60,1,datetime('now'),datetime('now')),
('ROLE-team','team','Tổ đội','Nhận, sử dụng và hoàn trả vật tư','team',1,70,1,datetime('now'),datetime('now')),
('ROLE-director','director','Ban giám đốc','Theo dõi và phê duyệt theo phân quyền','director',1,80,1,datetime('now'),datetime('now'));

INSERT OR IGNORE INTO approval_stage_catalog (id,stage_no,name,description,allowed_role_codes,sla_hours,auto_approve_on_submit,active,sort_order,created_at,updated_at) VALUES
('ASTAGE-1',1,'BCH / Chỉ huy trưởng','Kiểm tra kỹ thuật, BOQ, kế hoạch','commander',8,1,1,10,datetime('now'),datetime('now')),
('ASTAGE-2',2,'Phòng Dự án / Thư ký','Kiểm soát lũy kế và điều phối','project',8,0,1,20,datetime('now'),datetime('now')),
('ASTAGE-3',3,'KH-MH / Tài chính','Ngân sách, mua hàng và điều kiện','procurement,accountant',8,0,1,30,datetime('now'),datetime('now'));

-- Tách mã người nhận email của chu trình cung ứng khỏi số bước phê duyệt động.
UPDATE OR IGNORE approval_email_recipients SET stage=101 WHERE stage=4;
DELETE FROM approval_email_recipients WHERE stage=4 AND EXISTS (SELECT 1 FROM approval_email_recipients x WHERE x.project_id=approval_email_recipients.project_id AND x.stage=101);
UPDATE OR IGNORE approval_email_recipients SET stage=102 WHERE stage=5;
DELETE FROM approval_email_recipients WHERE stage=5 AND EXISTS (SELECT 1 FROM approval_email_recipients x WHERE x.project_id=approval_email_recipients.project_id AND x.stage=102);
UPDATE OR IGNORE approval_email_recipients SET stage=103 WHERE stage=6;
DELETE FROM approval_email_recipients WHERE stage=6 AND EXISTS (SELECT 1 FROM approval_email_recipients x WHERE x.project_id=approval_email_recipients.project_id AND x.stage=103);
