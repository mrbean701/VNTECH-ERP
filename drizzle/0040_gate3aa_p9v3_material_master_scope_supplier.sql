-- VNTECH ERP P9-V3 · Material Master / Kho Tong separation + Supplier Catalog
INSERT OR IGNORE INTO menu_group_catalog(id,group_key,name,icon,sort_order,active,collapsible,system_locked,created_at,updated_at)
VALUES('MGR_MATERIAL_MASTER','material_master','DANH MỤC VẬT TƯ GỐC','MV',55,1,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
--> statement-breakpoint
UPDATE module_catalog
SET label='Danh mục vật tư gốc',group_key='material_master',group_name='DANH MỤC VẬT TƯ GỐC',sort_order=55,active=1,updated_at=CURRENT_TIMESTAMP
WHERE module_key='material_catalog';
--> statement-breakpoint
UPDATE module_catalog
SET label='Kho Tổng',group_key='warehouse',group_name='KHO VẬT TƯ',sort_order=57,active=1,updated_at=CURRENT_TIMESTAMP
WHERE module_key='central_warehouse';
--> statement-breakpoint
INSERT OR IGNORE INTO module_catalog(module_key,label,icon,group_name,group_key,active,sort_order,system_locked,created_at,updated_at)
VALUES('supplier_catalog','Danh mục Nhà cung cấp','NC','MUA HÀNG','purchasing',1,46,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO user_module_permissions(id,user_id,module_key,can_view,can_use,can_create,can_edit,can_approve,can_export,permission_expires_at,permission_source,created_at,updated_at)
SELECT 'UMP_P9V3_SUP_'||u.id,u.id,'supplier_catalog',1,1,1,1,
       CASE WHEN u.role='kh_truong' THEN 1 ELSE 0 END,1,NULL,'department_default',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
FROM users u
LEFT JOIN role_catalog r ON r.code=u.role
WHERE u.active=1 AND (u.role IN ('kh_nv','kh_truong') OR COALESCE(r.base_role,'')='procurement');
