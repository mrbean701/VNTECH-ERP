-- VNTECH ERP GATE3AA PATCH05 V2 permission inheritance / manual overrides
ALTER TABLE user_module_permissions ADD COLUMN permission_source TEXT NOT NULL DEFAULT 'manual_override';
--> statement-breakpoint
UPDATE user_module_permissions SET permission_source='department_default' WHERE id LIKE 'UMP-DEPT-KH-%' OR id LIKE 'UMP-DEPT-DA-%';
--> statement-breakpoint
-- Existing finance/accountant users inherit Finance modules. Explicit rows on the same module remain authoritative because of UNIQUE(user_id,module_key).
INSERT OR IGNORE INTO user_module_permissions(id,user_id,module_key,can_view,can_use,can_create,can_edit,can_approve,can_export,permission_expires_at,permission_source,created_at,updated_at)
SELECT 'UMP-DEPT-TCKT-'||u.id||'-'||m.module_key,u.id,m.module_key,1,1,1,1,0,1,NULL,'department_default',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
FROM users u LEFT JOIN role_catalog r ON r.code=u.role JOIN module_catalog m ON m.module_key LIKE 'dept_finance_%'
WHERE COALESCE(r.base_role,u.role)='accountant' OR lower(COALESCE(u.department,'')) IN ('tckt','tài chính kế toán','tài chính / kế toán');
--> statement-breakpoint
-- Secretary / Hành chính Pháp chế department defaults.
INSERT OR IGNORE INTO user_module_permissions(id,user_id,module_key,can_view,can_use,can_create,can_edit,can_approve,can_export,permission_expires_at,permission_source,created_at,updated_at)
SELECT 'UMP-DEPT-HCPC-'||u.id||'-'||m.module_key,u.id,m.module_key,1,1,1,1,0,1,NULL,'department_default',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
FROM users u JOIN module_catalog m ON m.module_key LIKE 'dept_legal_%'
WHERE lower(COALESCE(u.department,'')) IN ('hcpc','hành chính pháp chế','phòng hành chính pháp chế') OR lower(u.role) IN ('thuky','thu_ky_tgd');
--> statement-breakpoint
-- BCH shell default: view/use/export only. No fake CRUD.
INSERT OR IGNORE INTO user_module_permissions(id,user_id,module_key,can_view,can_use,can_create,can_edit,can_approve,can_export,permission_expires_at,permission_source,created_at,updated_at)
SELECT 'UMP-DEPT-BCH-'||u.id,u.id,'site_command',1,1,0,0,0,1,NULL,'department_default',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
FROM users u LEFT JOIN role_catalog r ON r.code=u.role
WHERE COALESCE(r.base_role,u.role) IN ('commander','engineer','warehouse') OR lower(COALESCE(u.department,'')) IN ('bch','ban chỉ huy','ban chỉ huy công trường');
