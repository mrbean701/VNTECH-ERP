CREATE TABLE IF NOT EXISTS module_catalog (
  module_key TEXT PRIMARY KEY NOT NULL,
  label TEXT NOT NULL,
  icon TEXT NOT NULL,
  group_name TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  system_locked INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO module_catalog (module_key,label,icon,group_name,active,sort_order,system_locked,created_at,updated_at) VALUES
('dashboard','Tổng quan điều hành','OV',NULL,1,10,1,datetime('now'),datetime('now')),
('requests','Phiếu đề nghị mua hàng','ĐN','NGHIỆP VỤ',1,20,1,datetime('now'),datetime('now')),
('approvals','Trung tâm phê duyệt','PD',NULL,1,30,1,datetime('now'),datetime('now')),
('purchasing','Mua hàng & PO','PO',NULL,1,40,1,datetime('now'),datetime('now')),
('receiving','Giao nhận công trường','GN',NULL,1,50,1,datetime('now'),datetime('now')),
('delivered','Đơn hàng đã giao','DG',NULL,1,60,1,datetime('now'),datetime('now')),
('inventory','Tồn kho & điều chuyển','TK','KHO & TỔ ĐỘI',1,70,1,datetime('now'),datetime('now')),
('boq','BOQ / Hợp đồng dự án','BQ',NULL,1,80,1,datetime('now'),datetime('now')),
('teams','Cấp phát cho tổ đội','TD',NULL,1,90,1,datetime('now'),datetime('now')),
('stocktake','Kiểm kê & hoàn trả','KK',NULL,1,100,1,datetime('now'),datetime('now')),
('reports','Báo cáo & cảnh báo','BC','QUẢN TRỊ',1,110,1,datetime('now'),datetime('now')),
('admin','Danh mục & phân quyền','QT',NULL,1,120,1,datetime('now'),datetime('now'));
