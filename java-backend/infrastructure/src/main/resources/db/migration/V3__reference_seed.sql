-- ============================================================
-- VNTECH ERP — V3__reference_seed.sql (MySQL 8.0+, utf8mb4)
-- Sinh tự động: node java-backend/tools/generate-reference-seed.mjs
-- ĐỪNG SỬA TAY.
--
-- Mục đích: nạp DANH MỤC NỀN từ monolith JS (drizzle/) mà V2__system_seed còn thiếu.
--   • module_catalog / menu_group_catalog — menu + phân quyền theo module
--   • organization_units — BẮT BUỘC để create_user (thiếu ⇒ HTTP 400)
--   • danh mục vật tư, phạm vi nghiệp vụ, nhóm vai trò, cấu hình biểu mẫu, SLA...
--
-- Nguyên tắc: giữ ĐÚNG thứ tự file migration của JS để bản ghi sau ghi đè bản trước;
-- dùng INSERT IGNORE + ON DUPLICATE KEY UPDATE nên chạy lại an toàn (idempotent).
-- ============================================================

SET NAMES utf8mb4;

-- ───── menu_group_catalog (5 lệnh, từ 0011_menu_tree_groups.sql, 0012_sidebar_accordion_fix.sql, 0029_v530_erp_permissions_workflow.sql, 0037_gate3aa_patch04_departments_site_command.sql, 0040_gate3aa_p9v3_material_master_scope_supplier.sql) ─────
-- nguồn: drizzle/0011_menu_tree_groups.sql
INSERT IGNORE INTO menu_group_catalog (id,group_key,name,icon,active,sort_order,collapsible,system_locked,created_at,updated_at) VALUES
('MGR_PURCHASING','purchasing','Mua hàng','MH',1,20,1,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('MGR_BOQ','boq_contract','BOQ & Hợp đồng','BQ',1,30,1,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('MGR_WAREHOUSE','warehouse','Kho vật tư','KV',1,40,1,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('MGR_TEAMS','teams','Tổ đội','TD',1,50,1,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('MGR_REPORTS','reports','Báo cáo','BC',1,60,1,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('MGR_CATALOG','catalog','Danh mục','DM',1,70,1,0,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('MGR_ADMIN','system_admin','Quản trị hệ thống','QT',1,80,1,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3));

-- nguồn: drizzle/0012_sidebar_accordion_fix.sql
INSERT IGNORE INTO menu_group_catalog (id,group_key,name,icon,active,sort_order,collapsible,system_locked,created_at,updated_at) VALUES
('MGR_OVERVIEW','overview','Tổng quan','OV',1,10,0,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3));

-- nguồn: drizzle/0029_v530_erp_permissions_workflow.sql
INSERT IGNORE INTO menu_group_catalog (id,group_key,name,icon,active,sort_order,collapsible,system_locked,created_at,updated_at) VALUES
('MGR_OVERVIEW','overview','TỔNG QUAN','OV',1,10,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('MGR_DEPARTMENT','department_management','QUẢN LÝ PHÒNG BAN','PB',1,20,1,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('MGR_PROJECT','project_management','QUẢN LÝ DỰ ÁN','DA',1,30,1,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

-- nguồn: drizzle/0037_gate3aa_patch04_departments_site_command.sql
INSERT IGNORE INTO menu_group_catalog(id,group_key,name,icon,active,sort_order,collapsible,system_locked,created_at,updated_at) VALUES
('MGR_SITE_COMMAND','site_command','BAN CHỈ HUY CÔNG TRƯỜNG','BC',1,25,1,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

-- nguồn: drizzle/0040_gate3aa_p9v3_material_master_scope_supplier.sql
INSERT IGNORE INTO menu_group_catalog(id,group_key,name,icon,sort_order,active,collapsible,system_locked,created_at,updated_at)
VALUES('MGR_MATERIAL_MASTER','material_master','DANH MỤC VẬT TƯ GỐC','MV',55,1,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

-- ───── module_catalog (7 lệnh, từ 0010_configurable_modules.sql, 0017_central_master_partial_delivery_permissions.sql, 0026_rc7_payments_suppliers_po.sql, 0029_v530_erp_permissions_workflow.sql, 0031_department_task_engine.sql, 0037_gate3aa_patch04_departments_site_command.sql, 0040_gate3aa_p9v3_material_master_scope_supplier.sql) ─────
-- nguồn: drizzle/0010_configurable_modules.sql
INSERT IGNORE INTO module_catalog (module_key,label,icon,group_name,active,sort_order,system_locked,created_at,updated_at) VALUES
('dashboard','Tổng quan điều hành','OV',NULL,1,10,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('requests','Phiếu đề nghị mua hàng','ĐN','NGHIỆP VỤ',1,20,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('approvals','Trung tâm phê duyệt','PD',NULL,1,30,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('purchasing','Mua hàng & PO','PO',NULL,1,40,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('receiving','Giao nhận công trường','GN',NULL,1,50,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('delivered','Đơn hàng đã giao','DG',NULL,1,60,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('inventory','Tồn kho & điều chuyển','TK','KHO & TỔ ĐỘI',1,70,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('boq','BOQ / Hợp đồng dự án','BQ',NULL,1,80,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('teams','Cấp phát cho tổ đội','TD',NULL,1,90,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('stocktake','Kiểm kê & hoàn trả','KK',NULL,1,100,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('reports','Báo cáo & cảnh báo','BC','QUẢN TRỊ',1,110,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('admin','Danh mục & phân quyền','QT',NULL,1,120,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3));

-- nguồn: drizzle/0017_central_master_partial_delivery_permissions.sql
INSERT IGNORE INTO module_catalog (module_key,label,icon,group_name,group_key,active,sort_order,system_locked,created_at,updated_at)
VALUES ('central_warehouse','Kho Tổng & mã vật tư gốc','KT','Kho vật tư','warehouse',1,405,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3));

-- nguồn: drizzle/0026_rc7_payments_suppliers_po.sql
INSERT IGNORE INTO module_catalog
(module_key,label,icon,group_name,group_key,active,sort_order,system_locked,created_at,updated_at)
VALUES ('payments','Thanh toán HĐ','TT','BOQ & Hợp đồng','boq_contract',1,85,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

-- nguồn: drizzle/0029_v530_erp_permissions_workflow.sql
INSERT IGNORE INTO module_catalog (module_key,label,icon,group_name,group_key,active,sort_order,system_locked,created_at,updated_at) VALUES
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

-- nguồn: drizzle/0031_department_task_engine.sql
INSERT IGNORE INTO module_catalog (module_key,label,icon,group_name,group_key,active,sort_order,system_locked,created_at,updated_at) VALUES
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

-- nguồn: drizzle/0037_gate3aa_patch04_departments_site_command.sql
INSERT IGNORE INTO module_catalog(module_key,label,icon,group_name,group_key,active,sort_order,system_locked,created_at,updated_at) VALUES
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

-- nguồn: drizzle/0040_gate3aa_p9v3_material_master_scope_supplier.sql
INSERT IGNORE INTO module_catalog(module_key,label,icon,group_name,group_key,active,sort_order,system_locked,created_at,updated_at)
VALUES('supplier_catalog','Danh mục Nhà cung cấp','NC','MUA HÀNG','purchasing',1,46,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

-- ───── business_scope_catalog (1 lệnh, từ 0045_patch01_runtime_admin_boq_hardening.sql) ─────
-- nguồn: drizzle/0045_patch01_runtime_admin_boq_hardening.sql
INSERT IGNORE INTO business_scope_catalog(id,code,name,description,active,sort_order,system_locked,created_at,updated_at) VALUES
 ('BSCOPE-FIELD','field_technical','Kỹ thuật hiện trường','Kỹ thuật hiện trường / kỹ sư dự án',1,10,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
 ('BSCOPE-BCH','site_command','Chỉ huy / BCH','Ban chỉ huy công trường',1,20,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
 ('BSCOPE-PROJECT','project_management','Phòng Dự án','Điều phối và kiểm soát dự án',1,30,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
 ('BSCOPE-PLAN','plan_procurement','Phòng Kế hoạch / Mua hàng','Kế hoạch, mua hàng và cung ứng',1,40,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
 ('BSCOPE-FINANCE','finance_accounting','Tài chính / Kế toán','Tài chính và kế toán',1,50,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
 ('BSCOPE-WAREHOUSE','warehouse','Kho','Kho dự án và Kho Tổng',1,60,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
 ('BSCOPE-TEAM','team','Tổ đội','Tổ đội thi công',1,70,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
 ('BSCOPE-LEADERSHIP','leadership','Ban lãnh đạo','Ban giám đốc và phê duyệt cấp công ty',1,80,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
 ('BSCOPE-HCPC','legal_admin','Hành chính Pháp chế','Hành chính, nhân sự và pháp chế',1,90,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

-- ───── business_role_engine_catalog (1 lệnh, từ 0023_role_engine_aliases_source_order.sql) ─────
-- nguồn: drizzle/0023_role_engine_aliases_source_order.sql
INSERT IGNORE INTO business_role_engine_catalog
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

-- ───── business_role_group_catalog (3 lệnh, từ 0020_business_role_groups_ui_preferences.sql, 0029_v530_erp_permissions_workflow.sql, 0045_patch01_runtime_admin_boq_hardening.sql) ─────
-- nguồn: drizzle/0020_business_role_groups_ui_preferences.sql
INSERT IGNORE INTO business_role_group_catalog
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

-- nguồn: drizzle/0029_v530_erp_permissions_workflow.sql
INSERT IGNORE INTO business_role_group_catalog (id,code,name,description,engine_role,active,sort_order,system_locked,created_at,updated_at) VALUES
('BRG-kho-tong','kho_tong','Kho Tổng','Vận hành riêng Kho Tổng, không thao tác kho dự án','warehouse',1,65,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

-- nguồn: drizzle/0045_patch01_runtime_admin_boq_hardening.sql
INSERT IGNORE INTO business_role_group_catalog(id,code,name,description,engine_role,active,sort_order,system_locked,created_at,updated_at)
VALUES('BRG-hcpc','hcpc','Hành chính Pháp chế','Nhóm nghiệp vụ Hành chính Pháp chế','director',1,85,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

-- ───── business_role_group_scopes (9 lệnh, từ 0045_patch01_runtime_admin_boq_hardening.sql) ─────
-- nguồn: drizzle/0045_patch01_runtime_admin_boq_hardening.sql
INSERT IGNORE INTO business_role_group_scopes(id,business_group_id,business_scope_id,is_primary,created_at,updated_at)
SELECT 'BRGS-'||g.id||'-BSCOPE-FIELD',g.id,'BSCOPE-FIELD',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP FROM business_role_group_catalog g WHERE g.engine_role='engineer';

-- nguồn: drizzle/0045_patch01_runtime_admin_boq_hardening.sql
INSERT IGNORE INTO business_role_group_scopes(id,business_group_id,business_scope_id,is_primary,created_at,updated_at)
SELECT 'BRGS-'||g.id||'-BSCOPE-BCH',g.id,'BSCOPE-BCH',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP FROM business_role_group_catalog g WHERE g.engine_role='commander';

-- nguồn: drizzle/0045_patch01_runtime_admin_boq_hardening.sql
INSERT IGNORE INTO business_role_group_scopes(id,business_group_id,business_scope_id,is_primary,created_at,updated_at)
SELECT 'BRGS-'||g.id||'-BSCOPE-PROJECT',g.id,'BSCOPE-PROJECT',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP FROM business_role_group_catalog g WHERE g.engine_role='project';

-- nguồn: drizzle/0045_patch01_runtime_admin_boq_hardening.sql
INSERT IGNORE INTO business_role_group_scopes(id,business_group_id,business_scope_id,is_primary,created_at,updated_at)
SELECT 'BRGS-'||g.id||'-BSCOPE-PLAN',g.id,'BSCOPE-PLAN',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP FROM business_role_group_catalog g WHERE g.engine_role='procurement';

-- nguồn: drizzle/0045_patch01_runtime_admin_boq_hardening.sql
INSERT IGNORE INTO business_role_group_scopes(id,business_group_id,business_scope_id,is_primary,created_at,updated_at)
SELECT 'BRGS-'||g.id||'-BSCOPE-FINANCE',g.id,'BSCOPE-FINANCE',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP FROM business_role_group_catalog g WHERE g.engine_role='accountant';

-- nguồn: drizzle/0045_patch01_runtime_admin_boq_hardening.sql
INSERT IGNORE INTO business_role_group_scopes(id,business_group_id,business_scope_id,is_primary,created_at,updated_at)
SELECT 'BRGS-'||g.id||'-BSCOPE-WAREHOUSE',g.id,'BSCOPE-WAREHOUSE',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP FROM business_role_group_catalog g WHERE g.engine_role='warehouse';

-- nguồn: drizzle/0045_patch01_runtime_admin_boq_hardening.sql
INSERT IGNORE INTO business_role_group_scopes(id,business_group_id,business_scope_id,is_primary,created_at,updated_at)
SELECT 'BRGS-'||g.id||'-BSCOPE-TEAM',g.id,'BSCOPE-TEAM',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP FROM business_role_group_catalog g WHERE g.engine_role='team';

-- nguồn: drizzle/0045_patch01_runtime_admin_boq_hardening.sql
INSERT IGNORE INTO business_role_group_scopes(id,business_group_id,business_scope_id,is_primary,created_at,updated_at)
SELECT 'BRGS-'||g.id||'-BSCOPE-LEADERSHIP',g.id,'BSCOPE-LEADERSHIP',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP FROM business_role_group_catalog g WHERE g.engine_role='director';

-- nguồn: drizzle/0045_patch01_runtime_admin_boq_hardening.sql
INSERT IGNORE INTO business_role_group_scopes(id,business_group_id,business_scope_id,is_primary,created_at,updated_at)
VALUES('BRGS-BRG-hcpc-BSCOPE-HCPC','BRG-hcpc','BSCOPE-HCPC',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

-- ───── organization_units (2 lệnh, từ 0044_w2_admin_import_role_org.sql, 0045_patch01_runtime_admin_boq_hardening.sql) ─────
-- nguồn: drizzle/0044_w2_admin_import_role_org.sql
INSERT IGNORE INTO organization_units
  (id,code,name,unit_type,parent_id,project_id,description,effective_from,effective_to,active,archived_at,sort_order,system_locked,created_at,updated_at)
VALUES
  ('ORG-VNTECH','VNTECH','VNTECH','company',NULL,NULL,'Đơn vị gốc công ty',NULL,NULL,1,NULL,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('ORG-KH','KH','Phòng Kế hoạch','department','ORG-VNTECH',NULL,'Kế hoạch, mua hàng và cung ứng',NULL,NULL,1,NULL,10,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('ORG-DA','DA','Phòng Dự án','department','ORG-VNTECH',NULL,'Điều phối và kiểm soát dự án',NULL,NULL,1,NULL,20,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('ORG-TCKT','TCKT','Tài chính Kế toán','department','ORG-VNTECH',NULL,'Tài chính và kế toán',NULL,NULL,1,NULL,30,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('ORG-HCPC','HCPC','Hành chính Pháp chế','department','ORG-VNTECH',NULL,'Hành chính, nhân sự và pháp chế',NULL,NULL,1,NULL,40,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('ORG-BCH','BCH','Ban chỉ huy công trường','site_command','ORG-VNTECH',NULL,'Đơn vị cha cho BCH động theo dự án',NULL,NULL,1,NULL,50,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

-- nguồn: drizzle/0045_patch01_runtime_admin_boq_hardening.sql
INSERT IGNORE INTO organization_units
  (id,code,name,unit_type,parent_id,project_id,description,effective_from,effective_to,active,archived_at,sort_order,system_locked,created_at,updated_at)
VALUES
  ('ORG-BGD','BGD','Ban giám đốc','department','ORG-VNTECH',NULL,'Ban lãnh đạo công ty',NULL,NULL,1,NULL,5,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('ORG-HCPC','HCPC','Hành chính Pháp chế','department','ORG-VNTECH',NULL,'Hành chính, nhân sự và pháp chế',NULL,NULL,1,NULL,40,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

-- ───── task_sla_policies (1 lệnh, từ 0031_department_task_engine.sql) ─────
-- nguồn: drizzle/0031_department_task_engine.sql
INSERT IGNORE INTO task_sla_policies(department_code,status,responsibility_clock_runs,process_clock_runs,requires_reason,updated_at) VALUES
('KH','NEW',1,1,0,CURRENT_TIMESTAMP),('KH','IN_PROGRESS',1,1,0,CURRENT_TIMESTAMP),
('KH','WAITING_SUPPLIER',0,1,1,CURRENT_TIMESTAMP),('KH','WAITING_CLIENT',0,1,1,CURRENT_TIMESTAMP),('KH','WAITING_APPROVAL',0,1,1,CURRENT_TIMESTAMP),('KH','WAITING_PROJECT',0,1,1,CURRENT_TIMESTAMP),
('KH','BLOCKED',0,1,1,CURRENT_TIMESTAMP),('KH','ON_HOLD',0,0,1,CURRENT_TIMESTAMP),('KH','SUBMITTED',0,1,0,CURRENT_TIMESTAMP),('KH','REWORK',1,1,1,CURRENT_TIMESTAMP),('KH','COMPLETED',0,0,0,CURRENT_TIMESTAMP),('KH','CANCELLED',0,0,1,CURRENT_TIMESTAMP),
('DA','NEW',1,1,0,CURRENT_TIMESTAMP),('DA','IN_PROGRESS',1,1,0,CURRENT_TIMESTAMP),
('DA','WAITING_SUPPLIER',0,1,1,CURRENT_TIMESTAMP),('DA','WAITING_CLIENT',0,1,1,CURRENT_TIMESTAMP),('DA','WAITING_APPROVAL',0,1,1,CURRENT_TIMESTAMP),('DA','WAITING_PROJECT',0,1,1,CURRENT_TIMESTAMP),
('DA','BLOCKED',0,1,1,CURRENT_TIMESTAMP),('DA','ON_HOLD',0,0,1,CURRENT_TIMESTAMP),('DA','SUBMITTED',0,1,0,CURRENT_TIMESTAMP),('DA','REWORK',1,1,1,CURRENT_TIMESTAMP),('DA','COMPLETED',0,0,0,CURRENT_TIMESTAMP),('DA','CANCELLED',0,0,1,CURRENT_TIMESTAMP);

-- ───── form_field_config (3 lệnh, từ 0016_dynamic_forms_boq_request.sql, 0023_role_engine_aliases_source_order.sql, 0024_boq_purchase_separation_integrity.sql) ─────
-- nguồn: drizzle/0016_dynamic_forms_boq_request.sql
INSERT IGNORE INTO form_field_config (id,form_key,field_key,display_name,data_type,source_kind,visible,required,importable,exportable,editable,sort_order,options_json,system_locked,active,created_at,updated_at) VALUES
('FFC-BOQ-001','boq','lineNo','STT theo hợp đồng','number','core',1,0,1,1,1,10,NULL,1,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('FFC-BOQ-016','boq','internalMaterialCode','Mã vật tư (nội bộ)','text','custom',1,0,1,1,1,12,NULL,1,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('FFC-BOQ-017','boq','systemCode','Mã hệ','select','custom',1,1,1,1,1,14,'["DIEN","CTN","HVAC","ELV","PCCC","KHAC"]',1,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('FFC-BOQ-018','boq','subgroupName','Nhóm con (tùy chọn)','text','custom',1,0,1,1,1,16,NULL,1,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('FFC-BOQ-002','boq','itemType','Phân loại trong / ngoài hợp đồng','select','core',1,1,1,1,1,20,'["Trong HĐ","Ngoài HĐ"]',1,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('FFC-BOQ-003','boq','contractMaterialCode','Mã vật tư theo Hợp đồng','text','core',1,0,1,1,1,30,NULL,1,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('FFC-BOQ-004','boq','approvedMaterialCode','Mã vật tư được phê duyệt','text','core',1,0,1,1,1,40,NULL,1,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('FFC-BOQ-005','boq','materialName','Tên vật tư','text','core',1,1,1,1,1,50,NULL,1,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('FFC-BOQ-006','boq','unit','Đơn vị','text','core',1,0,1,1,1,60,NULL,1,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('FFC-BOQ-007','boq','contractQty','Khối lượng BOQ/HĐ','number','core',1,0,1,1,1,70,NULL,1,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('FFC-BOQ-008','boq','remeasuredQty','Khối lượng bóc lại','number','core',1,0,1,1,1,80,NULL,1,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('FFC-BOQ-009','boq','receivedQty','Lũy kế khối lượng vật tư đã nhập về dự án','number','system',1,0,0,1,0,90,NULL,1,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('FFC-BOQ-010','boq','varianceContract','Thừa thiếu so với BOQ/HĐ','number','system',1,0,0,1,0,100,NULL,1,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('FFC-BOQ-011','boq','varianceRemeasured','Thừa thiếu so với bóc lại','number','system',1,0,0,1,0,110,NULL,1,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('FFC-BOQ-012','boq','issuedQty','Xuất kho tổ đội','number','system',1,0,0,1,0,120,NULL,1,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('FFC-BOQ-013','boq','stockQty','Tồn kho','number','system',1,0,0,1,0,130,NULL,1,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('FFC-BOQ-015','boq','orderedNotReceivedQty','Đã đặt nhưng chưa về','number','system',0,0,0,1,0,135,NULL,1,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('FFC-BOQ-014','boq','note','Ghi chú','text','core',1,0,1,1,1,140,NULL,1,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('FFC-RH-001','request_header','projectId','Dự án','select','core',1,1,0,1,1,10,NULL,1,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('FFC-RH-002','request_header','teamId','Tên tổ thi công / Tổ đội','select','core',1,0,0,1,1,20,NULL,1,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('FFC-RH-003','request_header','area','Phạm vi / Khu vực thi công','text','core',1,0,0,1,1,30,NULL,1,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('FFC-RH-004','request_header','neededAt','Ngày cần vật tư tại công trường','date','core',1,1,0,1,1,40,NULL,1,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('FFC-RH-005','request_header','priority','Mức độ','select','core',1,0,0,1,1,50,'["Bình thường","Cao","Khẩn"]',1,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('FFC-RH-006','request_header','purpose','Phạm vi / Ghi chú chung','textarea','core',1,0,0,1,1,60,NULL,1,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('FFC-RL-001','request_line','lineNo','Thứ tự','number','system',1,0,0,1,0,10,NULL,1,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('FFC-RL-002','request_line','contractLineNo','Số thứ tự theo Hợp đồng','number','core',1,0,1,1,1,20,NULL,1,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('FFC-RL-003','request_line','materialName','Tên hàng','text','core',1,1,1,1,1,30,NULL,1,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('FFC-RL-004','request_line','unit','Đơn vị','text','core',1,0,1,1,1,40,NULL,1,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('FFC-RL-005','request_line','materialCode','Mã sản phẩm','text','core',1,0,1,1,1,50,NULL,1,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('FFC-RL-006','request_line','manufacturer','Nhà sản xuất','text','system',1,0,0,1,0,60,NULL,1,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('FFC-RL-007','request_line','origin','Xuất xứ','text','core',1,0,1,1,1,70,NULL,1,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('FFC-RL-008','request_line','approvedSupplier','Nhà cung cấp được duyệt','text','core',1,0,1,1,1,80,NULL,1,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('FFC-RL-009','request_line','contractQty','KL theo Hợp đồng','number','system',1,0,0,1,0,90,NULL,1,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('FFC-RL-010','request_line','stockQty','Tồn kho','number','system',1,0,0,1,0,100,NULL,1,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('FFC-RL-011','request_line','orderedCumulativeQty','KL đã mua lũy kế','number','system',1,0,0,1,0,110,NULL,1,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('FFC-RL-012','request_line','quantity','Khối lượng đề nghị mua đợt này','number','core',1,1,1,1,1,120,NULL,1,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('FFC-RL-013','request_line','cumulativeAfterRequest','Lũy kế khối lượng đợt này','number','system',1,0,0,1,0,130,NULL,1,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('FFC-RL-014','request_line','installationArea','Khu vực thi công','text','core',1,0,1,1,1,140,NULL,1,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('FFC-RL-015','request_line','note','Ghi chú','text','core',1,0,1,1,1,150,NULL,1,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3));

-- nguồn: drizzle/0023_role_engine_aliases_source_order.sql
INSERT IGNORE INTO form_field_config
  (id,form_key,field_key,display_name,data_type,source_kind,visible,required,importable,exportable,editable,sort_order,options_json,system_locked,active,created_at,updated_at)
VALUES
  ('FFC-boq-sourceOrder','boq','sourceOrder','Thứ tự nguồn','number','system',0,0,0,0,0,0,NULL,1,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

-- nguồn: drizzle/0024_boq_purchase_separation_integrity.sql
INSERT IGNORE INTO form_field_config
(id,form_key,field_key,display_name,data_type,source_kind,visible,required,importable,exportable,editable,sort_order,options_json,system_locked,active,created_at,updated_at)
VALUES
('FFC-BP-001','boq_purchase','lineNo','STT theo hợp đồng','text','system',1,0,0,1,0,10,NULL,1,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('FFC-BP-002','boq_purchase','systemCode','Mã hệ','text','system',1,0,0,1,0,20,NULL,1,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('FFC-BP-003','boq_purchase','subgroupName','Nhóm con','text','system',1,0,0,1,0,30,NULL,1,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('FFC-BP-004','boq_purchase','itemType','Trong/Ngoài HĐ','text','system',1,0,0,1,0,40,NULL,1,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('FFC-BP-005','boq_purchase','internalMaterialCode','Mã vật tư nội bộ','text','system',1,0,0,1,0,50,NULL,1,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('FFC-BP-006','boq_purchase','contractMaterialCode','Mã vật tư theo HĐ','text','system',1,0,0,1,0,60,NULL,1,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('FFC-BP-007','boq_purchase','approvedMaterialCode','Mã vật tư được phê duyệt','text','system',0,0,0,1,0,70,NULL,1,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('FFC-BP-008','boq_purchase','materialName','Tên vật tư','text','system',1,0,0,1,0,80,NULL,1,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('FFC-BP-009','boq_purchase','unit','Đơn vị','text','system',1,0,0,1,0,90,NULL,1,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('FFC-BP-010','boq_purchase','contractQty','KL BOQ/HĐ','number','system',1,0,0,1,0,100,NULL,1,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('FFC-BP-011','boq_purchase','remeasuredQty','KL bóc lại / PS đã duyệt','number','system',1,0,0,1,0,110,NULL,1,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('FFC-BP-012','boq_purchase','requestedQty','Lũy kế đã đề nghị','number','system',1,0,0,1,0,120,NULL,1,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('FFC-BP-013','boq_purchase','approvedQty','Lũy kế đã duyệt mua','number','system',1,0,0,1,0,130,NULL,1,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('FFC-BP-014','boq_purchase','orderedQty','Lũy kế PO đã đặt','number','system',1,0,0,1,0,140,NULL,1,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('FFC-BP-015','boq_purchase','receivedQty','THỰC TẾ đã nhập về dự án','number','system',1,0,0,1,0,150,NULL,1,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('FFC-BP-016','boq_purchase','orderedNotReceivedQty','Đã đặt nhưng chưa về','number','system',1,0,0,1,0,160,NULL,1,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('FFC-BP-017','boq_purchase','stockQty','Tồn kho DA (mã vật tư)','number','system',1,0,0,1,0,170,NULL,1,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('FFC-BP-018','boq_purchase','remainingContractQty','Còn thiếu so BOQ/HĐ','number','system',1,0,0,1,0,180,NULL,1,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('FFC-BP-019','boq_purchase','remainingRemeasuredQty','Còn thiếu so bóc lại','number','system',1,0,0,1,0,190,NULL,1,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('FFC-BP-020','boq_purchase','remainingToBuy','Còn phải mua','number','system',1,0,0,1,0,200,NULL,1,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('FFC-BP-021','boq_purchase','unitPrice','Đơn giá HĐ','number','system',0,0,0,1,0,210,NULL,1,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('FFC-BP-022','boq_purchase','contractValue','Giá trị BOQ sau điều chỉnh','number','system',0,0,0,1,0,220,NULL,1,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('FFC-BP-023','boq_purchase','receivedValue','Giá trị đã nhập','number','system',0,0,0,1,0,230,NULL,1,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('FFC-BP-024','boq_purchase','remainingValue','Giá trị còn thiếu','number','system',0,0,0,1,0,240,NULL,1,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('FFC-BP-025','boq_purchase','assessment','Đánh giá','text','system',1,0,0,1,0,250,NULL,1,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

-- ───── material_categories (1 lệnh, từ 0007_dynamic_projects_materials_boq_permissions.sql) ─────
-- nguồn: drizzle/0007_dynamic_projects_materials_boq_permissions.sql
INSERT IGNORE INTO material_categories (id,code,name,description,sort_order,active,created_at,updated_at)
VALUES
 ('CAT-DIEN','DIEN','Điện','Danh mục hệ thống điện',10,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
 ('CAT-ELV','ELV','Điện nhẹ','Danh mục hệ thống điện nhẹ',20,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
 ('CAT-HVAC','HVAC','HVAC','Danh mục điều hòa thông gió',30,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
 ('CAT-CTN','CTN','Cấp thoát nước','Danh mục cấp thoát nước',40,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
 ('CAT-PCCC','PCCC','PCCC','Danh mục phòng cháy chữa cháy',50,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
 ('CAT-KHAC','KHAC','Khác / Chưa phân loại','Có thể đổi tên hoặc bổ sung danh mục mới',999,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3));

-- ───── material_subcategories (1 lệnh, từ 0013_material_catalog_tree.sql) ─────
-- nguồn: drizzle/0013_material_catalog_tree.sql
INSERT IGNORE INTO material_subcategories (id, category_id, code, name, description, sort_order, active, created_at, updated_at)
SELECT 'SUB-UNASSIGNED-' || id, id, 'CHUA_PHAN_NHOM', 'Chưa phân nhóm', 'Nhóm mặc định để giữ nguyên vật tư cũ khi nâng cấp V4.6.4', 9999, 1, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
FROM material_categories;

-- ───── vntech_product_identity (1 lệnh, từ 0014_vntech_product_fingerprint.sql) ─────
-- nguồn: drizzle/0014_vntech_product_fingerprint.sql
INSERT IGNORE INTO vntech_product_identity (id,legal_owner,product_name,product_description,version,source_fingerprint,source_fingerprint_short,created_at) VALUES (
  'VNTECH-KHO-MEP-001',
  'CÔNG TY CỔ PHẦN THƯƠNG MẠI ĐẦU TƯ PHÁT TRIỂN CÔNG NGHỆ VIỆT (VNTECH)',
  'KHO VNTECH',
  'Hệ thống Quản lý Kho M&E – Universal Central Server Edition',
  '4.8.0',
  '86a68b97ab33d33cddf164dd8db99921a9829187a682d972a69aa227389040e2',
  'VNTECH-FP-86A68B97AB33D33C',
  '2026-08-20T00:00:00.000Z'
);

-- ───── vntech_trust_settings (1 lệnh, từ 0043_vntech_trust_lock_foundation.sql) ─────
-- nguồn: drizzle/0043_vntech_trust_lock_foundation.sql
INSERT IGNORE INTO vntech_trust_settings
  (id,trust_mode,enforcement_enabled,tenant_id,company_code,key_id,algorithm,public_key_pem,brand_fingerprint,release_fingerprint,machine_fingerprint,hardware_binding_mode,native_verifier_mode,online_attestation_enabled,license_server_url,last_attested_at,created_at,updated_at)
VALUES
  ('TRUST-ROOT','development',0,'VNTECH-HQ','VNTECH','VNTECH-ROOT-ED25519-2026-01','Ed25519','-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEASRFTGZhWNR/MdNgOF/dikIPzBCmxmmlO5v9TTcYoJdI=
-----END PUBLIC KEY-----','5676760bd5972c4f95abc165298a13162cf0436b61efbeb63bc8ef32aec9d286','448c5b3c923237ac18a090fbe6d6f1b499cd90f2ef140a2877c75b74457fae13',NULL,'foundation','foundation',0,NULL,NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

-- ============================================================
-- TỔNG: 36 lệnh INSERT cho 13 bảng
--     5  menu_group_catalog
--     7  module_catalog
--     1  business_scope_catalog
--     1  business_role_engine_catalog
--     3  business_role_group_catalog
--     9  business_role_group_scopes
--     2  organization_units
--     1  task_sla_policies
--     3  form_field_config
--     1  material_categories
--     1  material_subcategories
--     1  vntech_product_identity
--     1  vntech_trust_settings
-- ============================================================