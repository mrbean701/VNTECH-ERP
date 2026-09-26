-- VNTECH ERP V5.3.0 PHASE MENU-11 — TÁI CẤU TRÚC MENU & TAB PHÂN QUYỀN (metadata identity refresh)
-- Không đổi schema/nghiệp vụ; chỉ cập nhật source fingerprint sau khi:
-- (1) tách menu 7 -> 11 nhóm nghiệp vụ (thêm my_work / mep / finance / hr_legal / reports;
--     giải tán department_management / project_management / boq_contract / catalog),
-- (2) tách tab "Nhân sự & tổ chức" thành 2 tab riêng: Nhân sự | Tổ chức (Tổ chức có cấu hình tổ đội),
-- (3) dropdown phòng ban/dự án chỉ hiển thị tên đơn vị,
-- (4) ẩn/hiện chức năng theo modulePermissions (có fallback chống khoá nhầm khi chưa seed quyền).
-- Bản MySQL tương ứng: java-backend/.../db/migration/V4__menu_restructure.sql

-- 1) NHÓM MENU MỚI
INSERT OR IGNORE INTO menu_group_catalog (id, group_key, name, icon, active, sort_order, collapsible, system_locked, created_at, updated_at) VALUES
  ('my_work',  'my_work',  'CÔNG VIỆC CỦA TÔI',    'NV',  1, 15, 1, 0, datetime('now'), datetime('now')),
  ('mep',      'mep',      'MEP',                  'MEP', 1, 28, 1, 0, datetime('now'), datetime('now')),
  ('finance',  'finance',  'TÀI CHÍNH – KẾ TOÁN',  'TC',  1, 50, 1, 0, datetime('now'), datetime('now')),
  ('hr_legal', 'hr_legal', 'HÀNH CHÍNH – PHÁP CHẾ','HC',  1, 55, 1, 0, datetime('now'), datetime('now'));
--> statement-breakpoint

-- 2) CHUẨN HÓA NHÓM ĐANG CÓ
UPDATE menu_group_catalog SET name = 'QUẢN LÝ DỰ ÁN',        icon = 'DA', sort_order = 25, collapsible = 1 WHERE group_key = 'site_command';
--> statement-breakpoint
UPDATE menu_group_catalog SET name = 'MUA HÀNG & CUNG ỨNG', icon = 'MH', sort_order = 30, collapsible = 1 WHERE group_key = 'purchasing';
--> statement-breakpoint
UPDATE menu_group_catalog SET name = 'KHO VẬT TƯ',           icon = 'KV', sort_order = 40, collapsible = 1 WHERE group_key = 'warehouse';
--> statement-breakpoint
UPDATE menu_group_catalog SET name = 'TỔ ĐỘI',               icon = 'TD', sort_order = 45, collapsible = 1 WHERE group_key = 'teams';
--> statement-breakpoint
UPDATE menu_group_catalog SET name = 'BÁO CÁO',              icon = 'BC', sort_order = 60, collapsible = 1 WHERE group_key = 'reports';
--> statement-breakpoint
UPDATE menu_group_catalog SET name = 'DANH MỤC VẬT TƯ GỐC',  icon = 'MV', sort_order = 70, collapsible = 0 WHERE group_key = 'material_master';
--> statement-breakpoint
UPDATE menu_group_catalog SET name = 'QUẢN TRỊ HỆ THỐNG',    icon = 'QT', sort_order = 80, collapsible = 1 WHERE group_key = 'system_admin';
--> statement-breakpoint

-- 3) GÁN LẠI NHÓM CHO TỪNG CHỨC NĂNG
UPDATE module_catalog SET group_key = 'my_work' WHERE module_key IN
  ('dept_plan_tasks','dept_project_tasks','dept_plan_assign','dept_project_assign','approvals');
--> statement-breakpoint
UPDATE module_catalog SET group_key = 'site_command' WHERE module_key IN
  ('site_command','project_progress','construction','production','capital_recovery');
--> statement-breakpoint
UPDATE module_catalog SET group_key = 'mep' WHERE module_key IN
  ('dept_project_plan','dept_project_pda','dept_project_shop','dept_project_boq',
   'boq','dept_project_material','dept_project_issues','dept_project_asbuilt');
--> statement-breakpoint
UPDATE module_catalog SET group_key = 'purchasing' WHERE module_key IN
  ('requests','purchasing','receiving','delivered','supplier_catalog',
   'dept_plan_supply_plan','dept_plan_rfq','dept_plan_tender','dept_plan_purchasing',
   'dept_plan_supply','dept_plan_contracts','dept_plan_suppliers','dept_plan_price_data');
--> statement-breakpoint
UPDATE module_catalog SET group_key = 'warehouse' WHERE module_key IN
  ('warehouse_receipt','warehouse_issue','inventory','stocktake','material_norms','central_warehouse');
--> statement-breakpoint
UPDATE module_catalog SET group_key = 'teams' WHERE module_key IN ('teams');
--> statement-breakpoint
UPDATE module_catalog SET group_key = 'finance' WHERE module_key IN
  ('dept_finance_payment_plan','dept_finance_recovery','dept_finance_advance',
   'dept_finance_site_cost','dept_finance_cashbank','dept_finance_documents',
   'dept_project_payment','payments');
--> statement-breakpoint
UPDATE module_catalog SET group_key = 'hr_legal' WHERE module_key IN
  ('dept_legal_hr','dept_legal_labor','dept_legal_benefits',
   'dept_legal_correspondence','dept_legal_documents','dept_legal_seal');
--> statement-breakpoint
UPDATE module_catalog SET group_key = 'reports' WHERE module_key IN
  ('reports','dept_plan_alerts','dept_project_alerts','dept_plan_kpi','dept_project_kpi');
--> statement-breakpoint
UPDATE module_catalog SET group_key = 'material_master' WHERE module_key IN ('material_catalog');
--> statement-breakpoint
UPDATE module_catalog SET group_key = 'system_admin' WHERE module_key IN ('admin');
--> statement-breakpoint

-- 4) SẮP XẾP CHỨC NĂNG TRONG TỪNG NHÓM
UPDATE module_catalog SET sort_order = CASE module_key
  WHEN 'dept_plan_tasks' THEN 10 WHEN 'dept_project_tasks' THEN 20
  WHEN 'dept_plan_assign' THEN 30 WHEN 'dept_project_assign' THEN 40
  WHEN 'approvals' THEN 50 ELSE sort_order END WHERE group_key = 'my_work';
--> statement-breakpoint
UPDATE module_catalog SET sort_order = CASE module_key
  WHEN 'site_command' THEN 10 WHEN 'project_progress' THEN 20
  WHEN 'construction' THEN 30 WHEN 'production' THEN 40
  WHEN 'capital_recovery' THEN 50 ELSE sort_order END WHERE group_key = 'site_command';
--> statement-breakpoint
UPDATE module_catalog SET sort_order = CASE module_key
  WHEN 'dept_project_plan' THEN 10 WHEN 'dept_project_pda' THEN 20
  WHEN 'dept_project_shop' THEN 30 WHEN 'dept_project_boq' THEN 40
  WHEN 'boq' THEN 50 WHEN 'dept_project_material' THEN 60
  WHEN 'dept_project_issues' THEN 70 WHEN 'dept_project_asbuilt' THEN 80
  ELSE sort_order END WHERE group_key = 'mep';
--> statement-breakpoint
UPDATE module_catalog SET sort_order = CASE module_key
  WHEN 'requests' THEN 10 WHEN 'purchasing' THEN 20 WHEN 'receiving' THEN 30
  WHEN 'delivered' THEN 40 WHEN 'dept_plan_supply_plan' THEN 50 WHEN 'dept_plan_rfq' THEN 60
  WHEN 'dept_plan_tender' THEN 70 WHEN 'dept_plan_purchasing' THEN 80
  WHEN 'dept_plan_supply' THEN 90 WHEN 'dept_plan_contracts' THEN 100
  WHEN 'dept_plan_suppliers' THEN 110 WHEN 'supplier_catalog' THEN 120
  WHEN 'dept_plan_price_data' THEN 130 ELSE sort_order END WHERE group_key = 'purchasing';
--> statement-breakpoint
UPDATE module_catalog SET sort_order = CASE module_key
  WHEN 'warehouse_receipt' THEN 10 WHEN 'warehouse_issue' THEN 20
  WHEN 'inventory' THEN 30 WHEN 'stocktake' THEN 40
  WHEN 'material_norms' THEN 50 WHEN 'central_warehouse' THEN 60
  ELSE sort_order END WHERE group_key = 'warehouse';
--> statement-breakpoint
UPDATE module_catalog SET sort_order = CASE module_key
  WHEN 'dept_finance_payment_plan' THEN 10 WHEN 'dept_finance_recovery' THEN 20
  WHEN 'dept_finance_advance' THEN 30 WHEN 'dept_finance_site_cost' THEN 40
  WHEN 'dept_finance_cashbank' THEN 50 WHEN 'dept_finance_documents' THEN 60
  WHEN 'dept_project_payment' THEN 70 WHEN 'payments' THEN 80
  ELSE sort_order END WHERE group_key = 'finance';
--> statement-breakpoint
UPDATE module_catalog SET sort_order = CASE module_key
  WHEN 'dept_legal_hr' THEN 10 WHEN 'dept_legal_labor' THEN 20
  WHEN 'dept_legal_benefits' THEN 30 WHEN 'dept_legal_correspondence' THEN 40
  WHEN 'dept_legal_documents' THEN 50 WHEN 'dept_legal_seal' THEN 60
  ELSE sort_order END WHERE group_key = 'hr_legal';
--> statement-breakpoint
UPDATE module_catalog SET sort_order = CASE module_key
  WHEN 'reports' THEN 10 WHEN 'dept_plan_alerts' THEN 20
  WHEN 'dept_project_alerts' THEN 30 WHEN 'dept_plan_kpi' THEN 40
  WHEN 'dept_project_kpi' THEN 50 ELSE sort_order END WHERE group_key = 'reports';
--> statement-breakpoint
UPDATE module_catalog SET sort_order = 10 WHERE group_key IN ('teams','material_master','system_admin');
--> statement-breakpoint

-- 5) LOẠI BỎ NHÓM KHÔNG CÒN CHỨC NĂNG
DELETE FROM menu_group_catalog
 WHERE group_key IN ('department_management','project_management','boq_contract','catalog');

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='e73331367dee18e918b5d5d3f75d3c2dc162d0f6e7da0e3bee8b9058e97bc2c1'
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
