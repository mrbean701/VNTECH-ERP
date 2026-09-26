-- KHO VNTECH V5.2.4 FINAL
-- Separate BOQ/HĐ master configuration from procurement cumulative comparison.
-- Link each material request line to the exact BOQ row to avoid double counting.
ALTER TABLE material_request_items ADD COLUMN boq_item_id TEXT REFERENCES project_boq_items(id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS request_items_boq_item_idx ON material_request_items(boq_item_id);
--> statement-breakpoint
INSERT OR IGNORE INTO form_field_config
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
--> statement-breakpoint
-- Purchase/warehouse tracking columns no longer belong to the BOQ/HĐ source table.
UPDATE form_field_config
SET active=0,visible=0,required=0,importable=0,editable=0,updated_at=CURRENT_TIMESTAMP
WHERE form_key='boq'
  AND field_key IN ('receivedQty','varianceContract','varianceRemeasured','issuedQty','stockQty','orderedNotReceivedQty','receivedValue','remainingValue');
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS boq_price_import_batches (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  source_file_name TEXT,
  price_type TEXT NOT NULL DEFAULT 'contract',
  row_count INTEGER NOT NULL DEFAULT 0,
  changed_count INTEGER NOT NULL DEFAULT 0,
  unchanged_count INTEGER NOT NULL DEFAULT 0,
  updated_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS boq_price_import_items (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL REFERENCES boq_price_import_batches(id) ON DELETE CASCADE,
  boq_item_id TEXT NOT NULL REFERENCES project_boq_items(id),
  old_unit_price REAL NOT NULL DEFAULT 0,
  new_unit_price REAL NOT NULL DEFAULT 0,
  changed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS boq_price_import_items_batch_idx ON boq_price_import_items(batch_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS boq_price_import_items_boq_idx ON boq_price_import_items(boq_item_id);
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET version='5.2.4',
    product_description='Hệ thống Quản lý Kho M&E – tách BOQ/HĐ và Lũy kế mua hàng, khóa lũy kế theo dòng BOQ'
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
