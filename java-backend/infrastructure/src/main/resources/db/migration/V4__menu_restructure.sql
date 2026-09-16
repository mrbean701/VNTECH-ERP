-- ============================================================================
-- V4 — TÁI CẤU TRÚC MENU 7 -> 11 MỤC
-- ----------------------------------------------------------------------------
-- Trước: nhóm "department_management" (QUẢN LÝ PHÒNG BAN) gom 37 chức năng của
--        4 phòng ban vào một menu duy nhất; 12 chức năng lõi không thuộc nhóm nào
--        nên rơi vào nhóm tạm "Khác"; các nhóm rỗng bị ẩn => menu chỉ còn ~7 mục.
-- Sau:   tách theo NGHIỆP VỤ thành 11 nhóm độc lập, mọi chức năng đều có nhóm.
-- ----------------------------------------------------------------------------
-- Bảng bị ảnh hưởng: menu_group_catalog, module_catalog
-- Idempotent: dùng INSERT IGNORE / UPDATE theo khóa, chạy lại không nhân bản.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) NHÓM MENU MỚI
-- ---------------------------------------------------------------------------
INSERT IGNORE INTO menu_group_catalog
  (id, group_key, name, icon, active, sort_order, collapsible, system_locked, created_at, updated_at)
VALUES
  ('my_work',  'my_work',  'CÔNG VIỆC CỦA TÔI',    'NV',  1, 15, 1, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('mep',      'mep',      'MEP',                  'MEP', 1, 28, 1, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('finance',  'finance',  'TÀI CHÍNH – KẾ TOÁN',  'TC',  1, 50, 1, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('hr_legal', 'hr_legal', 'HÀNH CHÍNH – PHÁP CHẾ','HC',  1, 55, 1, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));

-- ---------------------------------------------------------------------------
-- 2) CHUẨN HÓA NHÓM ĐANG CÓ (tên + thứ tự hiển thị)
-- ---------------------------------------------------------------------------
UPDATE menu_group_catalog SET name = 'QUẢN LÝ DỰ ÁN',        icon = 'DA',  sort_order = 25, collapsible = 1 WHERE group_key = 'site_command';
UPDATE menu_group_catalog SET name = 'MUA HÀNG & CUNG ỨNG', icon = 'MH',  sort_order = 30, collapsible = 1 WHERE group_key = 'purchasing';
UPDATE menu_group_catalog SET name = 'KHO VẬT TƯ',           icon = 'KV',  sort_order = 40, collapsible = 1 WHERE group_key = 'warehouse';
UPDATE menu_group_catalog SET name = 'TỔ ĐỘI',               icon = 'TD',  sort_order = 45, collapsible = 1 WHERE group_key = 'teams';
UPDATE menu_group_catalog SET name = 'BÁO CÁO',              icon = 'BC',  sort_order = 60, collapsible = 1 WHERE group_key = 'reports';
UPDATE menu_group_catalog SET name = 'DANH MỤC VẬT TƯ GỐC',  icon = 'MV',  sort_order = 70, collapsible = 0 WHERE group_key = 'material_master';
UPDATE menu_group_catalog SET name = 'QUẢN TRỊ HỆ THỐNG',    icon = 'QT',  sort_order = 80, collapsible = 1 WHERE group_key = 'system_admin';

-- ---------------------------------------------------------------------------
-- 3) GÁN LẠI NHÓM CHO TỪNG CHỨC NĂNG
--    (mọi module phải thuộc một nhóm đang hiển thị, nếu không sẽ bị ẩn)
-- ---------------------------------------------------------------------------

-- 3.1 CÔNG VIỆC CỦA TÔI — việc đang làm, giao việc, phê duyệt
UPDATE module_catalog SET group_key = 'my_work'
 WHERE module_key IN ('dept_plan_tasks','dept_project_tasks','dept_plan_assign','dept_project_assign','approvals');

-- 3.2 QUẢN LÝ DỰ ÁN — gộp nhóm project_management cũ vào site_command
UPDATE module_catalog SET group_key = 'site_command'
 WHERE module_key IN ('site_command','project_progress','construction','production','capital_recovery');

-- 3.3 MEP — thiết kế, BOQ, thi công cơ điện, hoàn công
UPDATE module_catalog SET group_key = 'mep'
 WHERE module_key IN ('dept_project_plan','dept_project_pda','dept_project_shop','dept_project_boq',
                      'boq','dept_project_material','dept_project_issues','dept_project_asbuilt');

-- 3.4 MUA HÀNG & CUNG ỨNG
UPDATE module_catalog SET group_key = 'purchasing'
 WHERE module_key IN ('requests','purchasing','receiving','delivered','supplier_catalog',
                      'dept_plan_supply_plan','dept_plan_rfq','dept_plan_tender','dept_plan_purchasing',
                      'dept_plan_supply','dept_plan_contracts','dept_plan_suppliers','dept_plan_price_data');

-- 3.5 KHO VẬT TƯ
UPDATE module_catalog SET group_key = 'warehouse'
 WHERE module_key IN ('warehouse_receipt','warehouse_issue','inventory','stocktake','material_norms','central_warehouse');

-- 3.6 TỔ ĐỘI
UPDATE module_catalog SET group_key = 'teams' WHERE module_key IN ('teams');

-- 3.7 TÀI CHÍNH – KẾ TOÁN
UPDATE module_catalog SET group_key = 'finance'
 WHERE module_key IN ('dept_finance_payment_plan','dept_finance_recovery','dept_finance_advance',
                      'dept_finance_site_cost','dept_finance_cashbank','dept_finance_documents',
                      'dept_project_payment','payments');

-- 3.8 HÀNH CHÍNH – PHÁP CHẾ
UPDATE module_catalog SET group_key = 'hr_legal'
 WHERE module_key IN ('dept_legal_hr','dept_legal_labor','dept_legal_benefits',
                      'dept_legal_correspondence','dept_legal_documents','dept_legal_seal');

-- 3.9 BÁO CÁO — báo cáo, cảnh báo, KPI
UPDATE module_catalog SET group_key = 'reports'
 WHERE module_key IN ('reports','dept_plan_alerts','dept_project_alerts','dept_plan_kpi','dept_project_kpi');

-- 3.10 DANH MỤC VẬT TƯ GỐC / QUẢN TRỊ HỆ THỐNG
UPDATE module_catalog SET group_key = 'material_master' WHERE module_key IN ('material_catalog');
UPDATE module_catalog SET group_key = 'system_admin'    WHERE module_key IN ('admin');

-- ---------------------------------------------------------------------------
-- 4) SẮP XẾP CHỨC NĂNG TRONG TỪNG NHÓM
-- ---------------------------------------------------------------------------
UPDATE module_catalog SET sort_order = CASE module_key
  WHEN 'dept_plan_tasks'     THEN 10
  WHEN 'dept_project_tasks'  THEN 20
  WHEN 'dept_plan_assign'    THEN 30
  WHEN 'dept_project_assign' THEN 40
  WHEN 'approvals'           THEN 50
  ELSE sort_order END WHERE group_key = 'my_work';

UPDATE module_catalog SET sort_order = CASE module_key
  WHEN 'site_command'     THEN 10
  WHEN 'project_progress' THEN 20
  WHEN 'construction'     THEN 30
  WHEN 'production'       THEN 40
  WHEN 'capital_recovery' THEN 50
  ELSE sort_order END WHERE group_key = 'site_command';

UPDATE module_catalog SET sort_order = CASE module_key
  WHEN 'dept_project_plan'     THEN 10
  WHEN 'dept_project_pda'      THEN 20
  WHEN 'dept_project_shop'     THEN 30
  WHEN 'dept_project_boq'      THEN 40
  WHEN 'boq'                   THEN 50
  WHEN 'dept_project_material' THEN 60
  WHEN 'dept_project_issues'   THEN 70
  WHEN 'dept_project_asbuilt'  THEN 80
  ELSE sort_order END WHERE group_key = 'mep';

UPDATE module_catalog SET sort_order = CASE module_key
  WHEN 'requests'                 THEN 10
  WHEN 'purchasing'               THEN 20
  WHEN 'receiving'                THEN 30
  WHEN 'delivered'                THEN 40
  WHEN 'dept_plan_supply_plan'    THEN 50
  WHEN 'dept_plan_rfq'            THEN 60
  WHEN 'dept_plan_tender'         THEN 70
  WHEN 'dept_plan_purchasing'     THEN 80
  WHEN 'dept_plan_supply'         THEN 90
  WHEN 'dept_plan_contracts'      THEN 100
  WHEN 'dept_plan_suppliers'      THEN 110
  WHEN 'supplier_catalog'         THEN 120
  WHEN 'dept_plan_price_data'     THEN 130
  ELSE sort_order END WHERE group_key = 'purchasing';

UPDATE module_catalog SET sort_order = CASE module_key
  WHEN 'warehouse_receipt'  THEN 10
  WHEN 'warehouse_issue'    THEN 20
  WHEN 'inventory'          THEN 30
  WHEN 'stocktake'          THEN 40
  WHEN 'material_norms'     THEN 50
  WHEN 'central_warehouse'  THEN 60
  ELSE sort_order END WHERE group_key = 'warehouse';

UPDATE module_catalog SET sort_order = CASE module_key
  WHEN 'dept_finance_payment_plan' THEN 10
  WHEN 'dept_finance_recovery'     THEN 20
  WHEN 'dept_finance_advance'      THEN 30
  WHEN 'dept_finance_site_cost'    THEN 40
  WHEN 'dept_finance_cashbank'     THEN 50
  WHEN 'dept_finance_documents'    THEN 60
  WHEN 'dept_project_payment'      THEN 70
  WHEN 'payments'                  THEN 80
  ELSE sort_order END WHERE group_key = 'finance';

UPDATE module_catalog SET sort_order = CASE module_key
  WHEN 'dept_legal_hr'             THEN 10
  WHEN 'dept_legal_labor'          THEN 20
  WHEN 'dept_legal_benefits'       THEN 30
  WHEN 'dept_legal_correspondence' THEN 40
  WHEN 'dept_legal_documents'      THEN 50
  WHEN 'dept_legal_seal'           THEN 60
  ELSE sort_order END WHERE group_key = 'hr_legal';

UPDATE module_catalog SET sort_order = CASE module_key
  WHEN 'reports'             THEN 10
  WHEN 'dept_plan_alerts'    THEN 20
  WHEN 'dept_project_alerts' THEN 30
  WHEN 'dept_plan_kpi'       THEN 40
  WHEN 'dept_project_kpi'    THEN 50
  ELSE sort_order END WHERE group_key = 'reports';

UPDATE module_catalog SET sort_order = 10 WHERE group_key IN ('teams','material_master','system_admin');

-- ---------------------------------------------------------------------------
-- 5) LOẠI BỎ NHÓM KHÔNG CÒN CHỨC NĂNG
--    department_management: đã tách sang my_work/mep/finance/hr_legal/reports/purchasing
--    project_management   : đã gộp vào site_command (code cũng đã bỏ qua nhóm này)
--    boq_contract         : đã gộp vào mep
--    catalog              : nhóm trống, không có chức năng
-- ---------------------------------------------------------------------------
DELETE FROM menu_group_catalog
 WHERE group_key IN ('department_management','project_management','boq_contract','catalog');
