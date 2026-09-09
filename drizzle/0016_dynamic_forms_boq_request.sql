-- KHO VNTECH V4.8.0 FINAL - Dynamic form/column engine + BOQ/request tracking fields
ALTER TABLE project_boq_items ADD COLUMN contract_material_code TEXT;
--> statement-breakpoint
ALTER TABLE project_boq_items ADD COLUMN approved_material_code TEXT;
--> statement-breakpoint
ALTER TABLE material_request_items ADD COLUMN contract_line_no INTEGER;
--> statement-breakpoint
ALTER TABLE material_request_items ADD COLUMN origin TEXT;
--> statement-breakpoint
ALTER TABLE material_request_items ADD COLUMN approved_supplier TEXT;
--> statement-breakpoint
ALTER TABLE material_request_items ADD COLUMN note TEXT;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS form_field_config (
  id TEXT PRIMARY KEY NOT NULL,
  form_key TEXT NOT NULL,
  field_key TEXT NOT NULL,
  display_name TEXT NOT NULL,
  data_type TEXT NOT NULL DEFAULT 'text',
  source_kind TEXT NOT NULL DEFAULT 'core',
  visible INTEGER NOT NULL DEFAULT 1,
  required INTEGER NOT NULL DEFAULT 0,
  importable INTEGER NOT NULL DEFAULT 1,
  exportable INTEGER NOT NULL DEFAULT 1,
  editable INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  options_json TEXT,
  system_locked INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(form_key,field_key)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS custom_field_values (
  id TEXT PRIMARY KEY NOT NULL,
  form_key TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  field_key TEXT NOT NULL,
  value_text TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(form_key,entity_id,field_key)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS custom_field_values_entity_idx ON custom_field_values(form_key,entity_id);
--> statement-breakpoint
INSERT OR IGNORE INTO form_field_config (id,form_key,field_key,display_name,data_type,source_kind,visible,required,importable,exportable,editable,sort_order,options_json,system_locked,active,created_at,updated_at) VALUES
('FFC-BOQ-001','boq','lineNo','STT theo hợp đồng','number','core',1,0,1,1,1,10,NULL,1,1,datetime('now'),datetime('now')),
('FFC-BOQ-016','boq','internalMaterialCode','Mã vật tư (nội bộ)','text','custom',1,0,1,1,1,12,NULL,1,1,datetime('now'),datetime('now')),
('FFC-BOQ-017','boq','systemCode','Mã hệ','select','custom',1,1,1,1,1,14,'["DIEN","CTN","HVAC","ELV","PCCC","KHAC"]',1,1,datetime('now'),datetime('now')),
('FFC-BOQ-018','boq','subgroupName','Nhóm con (tùy chọn)','text','custom',1,0,1,1,1,16,NULL,1,1,datetime('now'),datetime('now')),
('FFC-BOQ-002','boq','itemType','Phân loại trong / ngoài hợp đồng','select','core',1,1,1,1,1,20,'["Trong HĐ","Ngoài HĐ"]',1,1,datetime('now'),datetime('now')),
('FFC-BOQ-003','boq','contractMaterialCode','Mã vật tư theo Hợp đồng','text','core',1,0,1,1,1,30,NULL,1,1,datetime('now'),datetime('now')),
('FFC-BOQ-004','boq','approvedMaterialCode','Mã vật tư được phê duyệt','text','core',1,0,1,1,1,40,NULL,1,1,datetime('now'),datetime('now')),
('FFC-BOQ-005','boq','materialName','Tên vật tư','text','core',1,1,1,1,1,50,NULL,1,1,datetime('now'),datetime('now')),
('FFC-BOQ-006','boq','unit','Đơn vị','text','core',1,0,1,1,1,60,NULL,1,1,datetime('now'),datetime('now')),
('FFC-BOQ-007','boq','contractQty','Khối lượng BOQ/HĐ','number','core',1,0,1,1,1,70,NULL,1,1,datetime('now'),datetime('now')),
('FFC-BOQ-008','boq','remeasuredQty','Khối lượng bóc lại','number','core',1,0,1,1,1,80,NULL,1,1,datetime('now'),datetime('now')),
('FFC-BOQ-009','boq','receivedQty','Lũy kế khối lượng vật tư đã nhập về dự án','number','system',1,0,0,1,0,90,NULL,1,1,datetime('now'),datetime('now')),
('FFC-BOQ-010','boq','varianceContract','Thừa thiếu so với BOQ/HĐ','number','system',1,0,0,1,0,100,NULL,1,1,datetime('now'),datetime('now')),
('FFC-BOQ-011','boq','varianceRemeasured','Thừa thiếu so với bóc lại','number','system',1,0,0,1,0,110,NULL,1,1,datetime('now'),datetime('now')),
('FFC-BOQ-012','boq','issuedQty','Xuất kho tổ đội','number','system',1,0,0,1,0,120,NULL,1,1,datetime('now'),datetime('now')),
('FFC-BOQ-013','boq','stockQty','Tồn kho','number','system',1,0,0,1,0,130,NULL,1,1,datetime('now'),datetime('now')),
('FFC-BOQ-015','boq','orderedNotReceivedQty','Đã đặt nhưng chưa về','number','system',0,0,0,1,0,135,NULL,1,1,datetime('now'),datetime('now')),
('FFC-BOQ-014','boq','note','Ghi chú','text','core',1,0,1,1,1,140,NULL,1,1,datetime('now'),datetime('now')),
('FFC-RH-001','request_header','projectId','Dự án','select','core',1,1,0,1,1,10,NULL,1,1,datetime('now'),datetime('now')),
('FFC-RH-002','request_header','teamId','Tên tổ thi công / Tổ đội','select','core',1,0,0,1,1,20,NULL,1,1,datetime('now'),datetime('now')),
('FFC-RH-003','request_header','area','Phạm vi / Khu vực thi công','text','core',1,0,0,1,1,30,NULL,1,1,datetime('now'),datetime('now')),
('FFC-RH-004','request_header','neededAt','Ngày cần vật tư tại công trường','date','core',1,1,0,1,1,40,NULL,1,1,datetime('now'),datetime('now')),
('FFC-RH-005','request_header','priority','Mức độ','select','core',1,0,0,1,1,50,'["Bình thường","Cao","Khẩn"]',1,1,datetime('now'),datetime('now')),
('FFC-RH-006','request_header','purpose','Phạm vi / Ghi chú chung','textarea','core',1,0,0,1,1,60,NULL,1,1,datetime('now'),datetime('now')),
('FFC-RL-001','request_line','lineNo','Thứ tự','number','system',1,0,0,1,0,10,NULL,1,1,datetime('now'),datetime('now')),
('FFC-RL-002','request_line','contractLineNo','Số thứ tự theo Hợp đồng','number','core',1,0,1,1,1,20,NULL,1,1,datetime('now'),datetime('now')),
('FFC-RL-003','request_line','materialName','Tên hàng','text','core',1,1,1,1,1,30,NULL,1,1,datetime('now'),datetime('now')),
('FFC-RL-004','request_line','unit','Đơn vị','text','core',1,0,1,1,1,40,NULL,1,1,datetime('now'),datetime('now')),
('FFC-RL-005','request_line','materialCode','Mã sản phẩm','text','core',1,0,1,1,1,50,NULL,1,1,datetime('now'),datetime('now')),
('FFC-RL-006','request_line','manufacturer','Nhà sản xuất','text','system',1,0,0,1,0,60,NULL,1,1,datetime('now'),datetime('now')),
('FFC-RL-007','request_line','origin','Xuất xứ','text','core',1,0,1,1,1,70,NULL,1,1,datetime('now'),datetime('now')),
('FFC-RL-008','request_line','approvedSupplier','Nhà cung cấp được duyệt','text','core',1,0,1,1,1,80,NULL,1,1,datetime('now'),datetime('now')),
('FFC-RL-009','request_line','contractQty','KL theo Hợp đồng','number','system',1,0,0,1,0,90,NULL,1,1,datetime('now'),datetime('now')),
('FFC-RL-010','request_line','stockQty','Tồn kho','number','system',1,0,0,1,0,100,NULL,1,1,datetime('now'),datetime('now')),
('FFC-RL-011','request_line','orderedCumulativeQty','KL đã mua lũy kế','number','system',1,0,0,1,0,110,NULL,1,1,datetime('now'),datetime('now')),
('FFC-RL-012','request_line','quantity','Khối lượng đề nghị mua đợt này','number','core',1,1,1,1,1,120,NULL,1,1,datetime('now'),datetime('now')),
('FFC-RL-013','request_line','cumulativeAfterRequest','Lũy kế khối lượng đợt này','number','system',1,0,0,1,0,130,NULL,1,1,datetime('now'),datetime('now')),
('FFC-RL-014','request_line','installationArea','Khu vực thi công','text','core',1,0,1,1,1,140,NULL,1,1,datetime('now'),datetime('now')),
('FFC-RL-015','request_line','note','Ghi chú','text','core',1,0,1,1,1,150,NULL,1,1,datetime('now'),datetime('now'));
