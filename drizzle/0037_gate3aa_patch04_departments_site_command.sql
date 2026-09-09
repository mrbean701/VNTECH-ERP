-- VNTECH ERP GATE3AA PATCH04 cumulative contract
INSERT OR IGNORE INTO menu_group_catalog(id,group_key,name,icon,active,sort_order,collapsible,system_locked,created_at,updated_at) VALUES
('MGR_SITE_COMMAND','site_command','BAN CHỈ HUY CÔNG TRƯỜNG','BC',1,25,1,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO module_catalog(module_key,label,icon,group_name,group_key,active,sort_order,system_locked,created_at,updated_at) VALUES
('dept_finance_payment_plan','Kế hoạch thanh toán','KT','QUẢN LÝ PHÒNG BAN','department_management',1,47,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('dept_finance_recovery','Thu hồi vốn / Công nợ','TH','QUẢN LÝ PHÒNG BAN','department_management',1,48,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('dept_finance_advance','Tạm ứng / Hoàn ứng','TU','QUẢN LÝ PHÒNG BAN','department_management',1,49,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('dept_finance_site_cost','Chi phí Ban chỉ huy','CP','QUẢN LÝ PHÒNG BAN','department_management',1,50,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('dept_finance_cashbank','Sổ quỹ & Ngân hàng','SQ','QUẢN LÝ PHÒNG BAN','department_management',1,51,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('dept_finance_documents','Chứng từ kế toán','CT','QUẢN LÝ PHÒNG BAN','department_management',1,52,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('dept_legal_hr','Hồ sơ nhân sự','NS','QUẢN LÝ PHÒNG BAN','department_management',1,53,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('dept_legal_labor','Hợp đồng lao động','LD','QUẢN LÝ PHÒNG BAN','department_management',1,54,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('dept_legal_correspondence','Công văn đến / đi','CV','QUẢN LÝ PHÒNG BAN','department_management',1,55,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('dept_legal_documents','Văn bản pháp lý','PL','QUẢN LÝ PHÒNG BAN','department_management',1,56,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('dept_legal_seal','Con dấu / Ủy quyền','CD','QUẢN LÝ PHÒNG BAN','department_management',1,57,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('dept_legal_benefits','Bảo hiểm & Chế độ','BH','QUẢN LÝ PHÒNG BAN','department_management',1,58,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('site_command','Quản lý Ban chỉ huy','BC','BAN CHỈ HUY CÔNG TRƯỜNG','site_command',1,26,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
