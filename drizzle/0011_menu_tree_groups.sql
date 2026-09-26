CREATE TABLE IF NOT EXISTS menu_group_catalog (
  id TEXT PRIMARY KEY NOT NULL,
  group_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '▦',
  active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  collapsible INTEGER NOT NULL DEFAULT 1,
  system_locked INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO menu_group_catalog (id,group_key,name,icon,active,sort_order,collapsible,system_locked,created_at,updated_at) VALUES
('MGR_PURCHASING','purchasing','Mua hàng','MH',1,20,1,1,datetime('now'),datetime('now')),
('MGR_BOQ','boq_contract','BOQ & Hợp đồng','BQ',1,30,1,1,datetime('now'),datetime('now')),
('MGR_WAREHOUSE','warehouse','Kho vật tư','KV',1,40,1,1,datetime('now'),datetime('now')),
('MGR_TEAMS','teams','Tổ đội','TD',1,50,1,1,datetime('now'),datetime('now')),
('MGR_REPORTS','reports','Báo cáo','BC',1,60,1,1,datetime('now'),datetime('now')),
('MGR_CATALOG','catalog','Danh mục','DM',1,70,1,0,datetime('now'),datetime('now')),
('MGR_ADMIN','system_admin','Quản trị hệ thống','QT',1,80,1,1,datetime('now'),datetime('now'));

ALTER TABLE module_catalog ADD COLUMN group_key TEXT;

UPDATE module_catalog SET group_key=NULL, group_name=NULL, sort_order=10 WHERE module_key='dashboard';
UPDATE module_catalog SET group_key='purchasing', group_name='Mua hàng', sort_order=20 WHERE module_key='requests';
UPDATE module_catalog SET group_key='purchasing', group_name='Mua hàng', sort_order=30 WHERE module_key='approvals';
UPDATE module_catalog SET group_key='purchasing', group_name='Mua hàng', sort_order=40 WHERE module_key='purchasing';
UPDATE module_catalog SET group_key='purchasing', group_name='Mua hàng', sort_order=50 WHERE module_key='receiving';
UPDATE module_catalog SET group_key='purchasing', group_name='Mua hàng', sort_order=60 WHERE module_key='delivered';
UPDATE module_catalog SET group_key='warehouse', group_name='Kho vật tư', sort_order=70 WHERE module_key='inventory';
UPDATE module_catalog SET group_key='boq_contract', group_name='BOQ & Hợp đồng', sort_order=80 WHERE module_key='boq';
UPDATE module_catalog SET group_key='teams', group_name='Tổ đội', sort_order=90 WHERE module_key='teams';
UPDATE module_catalog SET group_key='warehouse', group_name='Kho vật tư', sort_order=100 WHERE module_key='stocktake';
UPDATE module_catalog SET group_key='reports', group_name='Báo cáo', sort_order=110 WHERE module_key='reports';
UPDATE module_catalog SET group_key='system_admin', group_name='Quản trị hệ thống', sort_order=120 WHERE module_key='admin';
UPDATE module_catalog SET label='Chờ giao hàng' WHERE module_key='receiving' AND label='Giao nhận công trường';
