INSERT OR IGNORE INTO menu_group_catalog (id,group_key,name,icon,active,sort_order,collapsible,system_locked,created_at,updated_at) VALUES
('MGR_OVERVIEW','overview','Tổng quan','OV',1,10,0,1,datetime('now'),datetime('now'));

-- Chỉ đưa Tổng quan vào nhóm cha mới nếu trước đây vẫn đang là mục độc lập.
-- Không ghi đè cách quản trị viên đã tự sắp xếp các chức năng khác.
UPDATE module_catalog
SET group_key='overview', group_name='Tổng quan', sort_order=10, updated_at=datetime('now')
WHERE module_key='dashboard' AND (group_key IS NULL OR group_key='');
