-- VNTECH ERP PATCH10 · Multi-contract / BOQ version / contract stock ownership
-- Authoritative chain: Project -> Contract -> BOQ Version -> BOQ Item -> Material Mapping.
-- Physical rule: one project warehouse remains physical stock; accounting ownership is separated by Contract.

CREATE TABLE IF NOT EXISTS project_contracts (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id),
  contract_no TEXT NOT NULL,
  contract_name TEXT NOT NULL,
  contract_type TEXT NOT NULL DEFAULT 'main',
  parent_contract_id TEXT REFERENCES project_contracts(id),
  status TEXT NOT NULL DEFAULT 'active',
  is_primary INTEGER NOT NULL DEFAULT 0,
  signed_at TEXT,
  effective_from TEXT,
  effective_to TEXT,
  note TEXT,
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(project_id,contract_no)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS project_contracts_project_status_idx ON project_contracts(project_id,status,is_primary);
--> statement-breakpoint
INSERT OR IGNORE INTO project_contracts(id,project_id,contract_no,contract_name,contract_type,status,is_primary,created_at,updated_at)
SELECT 'PCON_LEGACY_'||p.id,p.id,
       CASE WHEN trim(COALESCE(p.contract_no,''))<>'' THEN trim(p.contract_no) ELSE p.code||'-HD01' END,
       CASE WHEN trim(COALESCE(p.contract_name,''))<>'' THEN trim(p.contract_name) ELSE 'Hợp đồng chính - '||p.name END,
       'main','active',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
FROM projects p;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS boq_versions (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id),
  contract_id TEXT NOT NULL REFERENCES project_contracts(id),
  version_no INTEGER NOT NULL,
  version_code TEXT NOT NULL,
  version_name TEXT,
  revision_type TEXT NOT NULL DEFAULT 'original',
  source_file_name TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  active INTEGER NOT NULL DEFAULT 1,
  effective_at TEXT,
  approved_at TEXT,
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(contract_id,version_no)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS boq_versions_project_contract_idx ON boq_versions(project_id,contract_id,active,version_no);
--> statement-breakpoint
INSERT OR IGNORE INTO boq_versions(id,project_id,contract_id,version_no,version_code,version_name,revision_type,source_file_name,status,active,created_by,created_at,updated_at)
SELECT 'BQVER_'||b.id,b.project_id,c.id,b.version_no,'V'||b.version_no,
       'BOQ V'||b.version_no,'original',b.source_file_name,
       CASE WHEN b.active=1 THEN 'active' ELSE 'superseded' END,b.active,b.imported_by,b.created_at,b.updated_at
FROM boq_import_batches b
JOIN project_contracts c ON c.project_id=b.project_id AND c.is_primary=1;
--> statement-breakpoint
INSERT OR IGNORE INTO boq_versions(id,project_id,contract_id,version_no,version_code,version_name,revision_type,status,active,created_at,updated_at)
SELECT 'BQVER_LEGACY_'||p.id,p.id,c.id,1,'V1','BOQ V1','original','active',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
FROM projects p JOIN project_contracts c ON c.project_id=p.id AND c.is_primary=1
WHERE NOT EXISTS(SELECT 1 FROM boq_versions v WHERE v.contract_id=c.id);
--> statement-breakpoint

ALTER TABLE boq_import_batches ADD COLUMN contract_id TEXT REFERENCES project_contracts(id);
--> statement-breakpoint
ALTER TABLE boq_import_batches ADD COLUMN boq_version_id TEXT REFERENCES boq_versions(id);
--> statement-breakpoint
UPDATE boq_import_batches SET contract_id=(SELECT c.id FROM project_contracts c WHERE c.project_id=boq_import_batches.project_id AND c.is_primary=1 LIMIT 1)
WHERE contract_id IS NULL;
--> statement-breakpoint
UPDATE boq_import_batches SET boq_version_id='BQVER_'||id WHERE boq_version_id IS NULL AND EXISTS(SELECT 1 FROM boq_versions v WHERE v.id='BQVER_'||boq_import_batches.id);
--> statement-breakpoint
DROP INDEX IF EXISTS boq_import_batches_project_version_uidx;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS boq_import_batches_contract_version_uidx ON boq_import_batches(contract_id,version_no);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS boq_import_batches_boq_version_idx ON boq_import_batches(boq_version_id,active);
--> statement-breakpoint

ALTER TABLE boq_source_items ADD COLUMN contract_id TEXT REFERENCES project_contracts(id);
--> statement-breakpoint
ALTER TABLE boq_source_items ADD COLUMN boq_version_id TEXT REFERENCES boq_versions(id);
--> statement-breakpoint
UPDATE boq_source_items SET contract_id=(SELECT b.contract_id FROM boq_import_batches b WHERE b.id=boq_source_items.batch_id),boq_version_id=(SELECT b.boq_version_id FROM boq_import_batches b WHERE b.id=boq_source_items.batch_id)
WHERE contract_id IS NULL OR boq_version_id IS NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS boq_source_items_contract_version_idx ON boq_source_items(contract_id,boq_version_id,mapping_status,active);
--> statement-breakpoint

ALTER TABLE project_boq_items ADD COLUMN contract_id TEXT REFERENCES project_contracts(id);
--> statement-breakpoint
ALTER TABLE project_boq_items ADD COLUMN boq_version_id TEXT REFERENCES boq_versions(id);
--> statement-breakpoint
ALTER TABLE project_boq_items ADD COLUMN source_item_id TEXT REFERENCES boq_source_items(id);
--> statement-breakpoint
UPDATE project_boq_items SET source_item_id=(SELECT s.id FROM boq_source_items s WHERE s.project_boq_item_id=project_boq_items.id LIMIT 1)
WHERE source_item_id IS NULL;
--> statement-breakpoint
UPDATE project_boq_items SET contract_id=COALESCE((SELECT s.contract_id FROM boq_source_items s WHERE s.id=project_boq_items.source_item_id),(SELECT c.id FROM project_contracts c WHERE c.project_id=project_boq_items.project_id AND c.is_primary=1 LIMIT 1)),boq_version_id=COALESCE((SELECT s.boq_version_id FROM boq_source_items s WHERE s.id=project_boq_items.source_item_id),(SELECT v.id FROM boq_versions v WHERE v.project_id=project_boq_items.project_id AND v.active=1 ORDER BY v.version_no DESC LIMIT 1))
WHERE contract_id IS NULL OR boq_version_id IS NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS project_boq_items_contract_version_idx ON project_boq_items(project_id,contract_id,boq_version_id,source_order);
--> statement-breakpoint

ALTER TABLE boq_mapping_runs ADD COLUMN contract_id TEXT REFERENCES project_contracts(id);
--> statement-breakpoint
ALTER TABLE boq_mapping_runs ADD COLUMN boq_version_id TEXT REFERENCES boq_versions(id);
--> statement-breakpoint
UPDATE boq_mapping_runs SET contract_id=(SELECT b.contract_id FROM boq_import_batches b WHERE b.id=boq_mapping_runs.batch_id),boq_version_id=(SELECT b.boq_version_id FROM boq_import_batches b WHERE b.id=boq_mapping_runs.batch_id)
WHERE contract_id IS NULL OR boq_version_id IS NULL;
--> statement-breakpoint

ALTER TABLE material_requests ADD COLUMN contract_id TEXT REFERENCES project_contracts(id);
--> statement-breakpoint
ALTER TABLE material_requests ADD COLUMN boq_version_id TEXT REFERENCES boq_versions(id);
--> statement-breakpoint
ALTER TABLE material_request_items ADD COLUMN contract_id TEXT REFERENCES project_contracts(id);
--> statement-breakpoint
ALTER TABLE material_request_items ADD COLUMN boq_version_id TEXT REFERENCES boq_versions(id);
--> statement-breakpoint
UPDATE material_requests SET contract_id=(SELECT c.id FROM project_contracts c WHERE c.project_id=material_requests.project_id AND c.is_primary=1 LIMIT 1),boq_version_id=(SELECT v.id FROM boq_versions v WHERE v.project_id=material_requests.project_id AND v.active=1 ORDER BY v.version_no DESC LIMIT 1)
WHERE contract_id IS NULL;
--> statement-breakpoint
UPDATE material_request_items SET contract_id=COALESCE((SELECT b.contract_id FROM project_boq_items b WHERE b.id=material_request_items.boq_item_id),(SELECT r.contract_id FROM material_requests r WHERE r.id=material_request_items.request_id)),boq_version_id=COALESCE((SELECT b.boq_version_id FROM project_boq_items b WHERE b.id=material_request_items.boq_item_id),(SELECT r.boq_version_id FROM material_requests r WHERE r.id=material_request_items.request_id))
WHERE contract_id IS NULL OR boq_version_id IS NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS material_request_items_contract_boq_idx ON material_request_items(contract_id,boq_version_id,boq_item_id);
--> statement-breakpoint

ALTER TABLE purchase_orders ADD COLUMN contract_id TEXT REFERENCES project_contracts(id);
--> statement-breakpoint
ALTER TABLE purchase_orders ADD COLUMN boq_version_id TEXT REFERENCES boq_versions(id);
--> statement-breakpoint
ALTER TABLE purchase_order_items ADD COLUMN contract_id TEXT REFERENCES project_contracts(id);
--> statement-breakpoint
ALTER TABLE purchase_order_items ADD COLUMN boq_version_id TEXT REFERENCES boq_versions(id);
--> statement-breakpoint
ALTER TABLE purchase_order_items ADD COLUMN boq_item_id TEXT REFERENCES project_boq_items(id);
--> statement-breakpoint
UPDATE purchase_orders SET contract_id=COALESCE((SELECT r.contract_id FROM material_requests r WHERE r.id=purchase_orders.request_id),(SELECT c.id FROM project_contracts c WHERE c.project_id=purchase_orders.project_id AND c.is_primary=1 LIMIT 1)),boq_version_id=(SELECT r.boq_version_id FROM material_requests r WHERE r.id=purchase_orders.request_id)
WHERE contract_id IS NULL;
--> statement-breakpoint
UPDATE purchase_order_items SET contract_id=(SELECT ri.contract_id FROM material_request_items ri WHERE ri.id=purchase_order_items.request_item_id),boq_version_id=(SELECT ri.boq_version_id FROM material_request_items ri WHERE ri.id=purchase_order_items.request_item_id),boq_item_id=(SELECT ri.boq_item_id FROM material_request_items ri WHERE ri.id=purchase_order_items.request_item_id)
WHERE contract_id IS NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS purchase_order_items_contract_boq_idx ON purchase_order_items(contract_id,boq_version_id,boq_item_id);
--> statement-breakpoint

ALTER TABLE goods_receipts ADD COLUMN contract_id TEXT REFERENCES project_contracts(id);
--> statement-breakpoint
ALTER TABLE goods_receipts ADD COLUMN boq_version_id TEXT REFERENCES boq_versions(id);
--> statement-breakpoint
ALTER TABLE goods_receipt_items ADD COLUMN contract_id TEXT REFERENCES project_contracts(id);
--> statement-breakpoint
ALTER TABLE goods_receipt_items ADD COLUMN boq_version_id TEXT REFERENCES boq_versions(id);
--> statement-breakpoint
ALTER TABLE goods_receipt_items ADD COLUMN boq_item_id TEXT REFERENCES project_boq_items(id);
--> statement-breakpoint
UPDATE goods_receipts SET contract_id=(SELECT po.contract_id FROM purchase_orders po WHERE po.id=goods_receipts.purchase_order_id),boq_version_id=(SELECT po.boq_version_id FROM purchase_orders po WHERE po.id=goods_receipts.purchase_order_id)
WHERE contract_id IS NULL;
--> statement-breakpoint
UPDATE goods_receipt_items SET contract_id=(SELECT poi.contract_id FROM purchase_order_items poi WHERE poi.id=goods_receipt_items.purchase_order_item_id),boq_version_id=(SELECT poi.boq_version_id FROM purchase_order_items poi WHERE poi.id=goods_receipt_items.purchase_order_item_id),boq_item_id=(SELECT poi.boq_item_id FROM purchase_order_items poi WHERE poi.id=goods_receipt_items.purchase_order_item_id)
WHERE contract_id IS NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS goods_receipt_items_contract_boq_idx ON goods_receipt_items(contract_id,boq_version_id,boq_item_id);
--> statement-breakpoint

ALTER TABLE stock_issue_items ADD COLUMN contract_id TEXT REFERENCES project_contracts(id);
--> statement-breakpoint
UPDATE stock_issue_items SET contract_id=(SELECT ri.contract_id FROM material_request_items ri WHERE ri.id=stock_issue_items.request_item_id) WHERE contract_id IS NULL;
--> statement-breakpoint
ALTER TABLE material_return_items ADD COLUMN contract_id TEXT REFERENCES project_contracts(id);
--> statement-breakpoint
ALTER TABLE central_return_items ADD COLUMN contract_id TEXT REFERENCES project_contracts(id);
--> statement-breakpoint
ALTER TABLE transfer_order_items ADD COLUMN source_contract_id TEXT REFERENCES project_contracts(id);
--> statement-breakpoint
ALTER TABLE transfer_order_items ADD COLUMN destination_contract_id TEXT REFERENCES project_contracts(id);
--> statement-breakpoint
ALTER TABLE stock_movements ADD COLUMN contract_id TEXT REFERENCES project_contracts(id);
--> statement-breakpoint
ALTER TABLE stock_movements ADD COLUMN destination_contract_id TEXT REFERENCES project_contracts(id);
--> statement-breakpoint
UPDATE stock_movements SET contract_id=(SELECT c.id FROM project_contracts c WHERE c.project_id=stock_movements.project_id AND c.is_primary=1 LIMIT 1) WHERE contract_id IS NULL AND project_id IS NOT NULL;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS procurement_allocations (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id),
  contract_id TEXT NOT NULL REFERENCES project_contracts(id),
  boq_version_id TEXT REFERENCES boq_versions(id),
  boq_item_id TEXT REFERENCES project_boq_items(id),
  material_id TEXT NOT NULL REFERENCES materials(id),
  request_item_id TEXT REFERENCES material_request_items(id),
  purchase_order_item_id TEXT REFERENCES purchase_order_items(id),
  receipt_item_id TEXT REFERENCES goods_receipt_items(id),
  stage TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 0,
  reference_no TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS procurement_allocations_contract_boq_idx ON procurement_allocations(contract_id,boq_version_id,boq_item_id,stage);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS procurement_allocations_trace_idx ON procurement_allocations(request_item_id,purchase_order_item_id,receipt_item_id);
--> statement-breakpoint
INSERT OR IGNORE INTO procurement_allocations(id,project_id,contract_id,boq_version_id,boq_item_id,material_id,request_item_id,stage,quantity,created_at,updated_at)
SELECT 'PAL_MR_'||ri.id,r.project_id,ri.contract_id,ri.boq_version_id,ri.boq_item_id,ri.material_id,ri.id,'MR',ri.requested_qty,ri.created_at,ri.updated_at
FROM material_request_items ri JOIN material_requests r ON r.id=ri.request_id WHERE ri.contract_id IS NOT NULL;
--> statement-breakpoint
INSERT OR IGNORE INTO procurement_allocations(id,project_id,contract_id,boq_version_id,boq_item_id,material_id,request_item_id,purchase_order_item_id,stage,quantity,created_at,updated_at)
SELECT 'PAL_PO_'||poi.id,po.project_id,poi.contract_id,poi.boq_version_id,poi.boq_item_id,ri.material_id,poi.request_item_id,poi.id,'PO',poi.ordered_qty,poi.created_at,poi.updated_at
FROM purchase_order_items poi JOIN purchase_orders po ON po.id=poi.purchase_order_id JOIN material_request_items ri ON ri.id=poi.request_item_id WHERE poi.contract_id IS NOT NULL;
--> statement-breakpoint
INSERT OR IGNORE INTO procurement_allocations(id,project_id,contract_id,boq_version_id,boq_item_id,material_id,request_item_id,purchase_order_item_id,receipt_item_id,stage,quantity,created_at,updated_at)
SELECT 'PAL_GRN_'||gri.id,po.project_id,gri.contract_id,gri.boq_version_id,gri.boq_item_id,ri.material_id,poi.request_item_id,gri.purchase_order_item_id,gri.id,'RECEIPT',gri.accepted_qty,gri.created_at,gri.updated_at
FROM goods_receipt_items gri JOIN purchase_order_items poi ON poi.id=gri.purchase_order_item_id JOIN purchase_orders po ON po.id=poi.purchase_order_id JOIN material_request_items ri ON ri.id=poi.request_item_id WHERE gri.contract_id IS NOT NULL;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS contract_stock_ledger (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id),
  contract_id TEXT NOT NULL REFERENCES project_contracts(id),
  warehouse_id TEXT NOT NULL REFERENCES warehouses(id),
  material_id TEXT NOT NULL REFERENCES materials(id),
  movement_type TEXT NOT NULL,
  quantity_delta REAL NOT NULL,
  occurred_at TEXT NOT NULL,
  reference_type TEXT NOT NULL,
  reference_id TEXT NOT NULL,
  reference_item_id TEXT,
  counterparty_contract_id TEXT REFERENCES project_contracts(id),
  actor_user_id TEXT REFERENCES users(id),
  note TEXT,
  created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS contract_stock_ledger_balance_idx ON contract_stock_ledger(project_id,contract_id,warehouse_id,material_id,occurred_at);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS contract_stock_ledger_reference_idx ON contract_stock_ledger(reference_type,reference_id,reference_item_id);
--> statement-breakpoint
INSERT OR IGNORE INTO contract_stock_ledger(id,project_id,contract_id,warehouse_id,material_id,movement_type,quantity_delta,occurred_at,reference_type,reference_id,actor_user_id,note,created_at)
SELECT 'CSL_FROM_'||sm.id,sm.project_id,sm.contract_id,sm.from_warehouse_id,sm.material_id,sm.movement_type,-sm.quantity,sm.occurred_at,sm.reference_type,sm.reference_id,sm.posted_by,'Legacy backfill from physical stock movement',sm.created_at
FROM stock_movements sm WHERE sm.project_id IS NOT NULL AND sm.contract_id IS NOT NULL AND sm.from_warehouse_id IS NOT NULL;
--> statement-breakpoint
INSERT OR IGNORE INTO contract_stock_ledger(id,project_id,contract_id,warehouse_id,material_id,movement_type,quantity_delta,occurred_at,reference_type,reference_id,actor_user_id,note,created_at)
SELECT 'CSL_TO_'||sm.id,sm.project_id,COALESCE(sm.destination_contract_id,sm.contract_id),sm.to_warehouse_id,sm.material_id,sm.movement_type,sm.quantity,sm.occurred_at,sm.reference_type,sm.reference_id,sm.posted_by,'Legacy backfill from physical stock movement',sm.created_at
FROM stock_movements sm WHERE sm.project_id IS NOT NULL AND COALESCE(sm.destination_contract_id,sm.contract_id) IS NOT NULL AND sm.to_warehouse_id IS NOT NULL;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS contract_ownership_transfers (
  id TEXT PRIMARY KEY NOT NULL,
  transfer_no TEXT NOT NULL,
  warehouse_id TEXT NOT NULL REFERENCES warehouses(id),
  material_id TEXT NOT NULL REFERENCES materials(id),
  source_project_id TEXT NOT NULL REFERENCES projects(id),
  source_contract_id TEXT NOT NULL REFERENCES project_contracts(id),
  destination_project_id TEXT NOT NULL REFERENCES projects(id),
  destination_contract_id TEXT NOT NULL REFERENCES project_contracts(id),
  quantity REAL NOT NULL,
  reason TEXT NOT NULL,
  source_reference_type TEXT,
  source_reference_id TEXT,
  status TEXT NOT NULL DEFAULT 'posted',
  posted_by TEXT NOT NULL REFERENCES users(id),
  posted_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS contract_ownership_transfers_no_uidx ON contract_ownership_transfers(transfer_no);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS contract_ownership_transfers_contract_idx ON contract_ownership_transfers(source_contract_id,destination_contract_id,posted_at);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS contract_stock_reconciliations (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id),
  warehouse_id TEXT NOT NULL REFERENCES warehouses(id),
  material_id TEXT NOT NULL REFERENCES materials(id),
  physical_qty REAL NOT NULL,
  contract_qty REAL NOT NULL,
  difference_qty REAL NOT NULL,
  status TEXT NOT NULL,
  checked_by TEXT NOT NULL REFERENCES users(id),
  checked_at TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS contract_stock_reconciliations_scope_idx ON contract_stock_reconciliations(project_id,warehouse_id,status,checked_at);
--> statement-breakpoint

ALTER TABLE material_subcategories ADD COLUMN scope_examples TEXT;
--> statement-breakpoint
ALTER TABLE material_subcategories ADD COLUMN review_status TEXT NOT NULL DEFAULT 'approved';
--> statement-breakpoint
ALTER TABLE material_subcategories ADD COLUMN adjustment_note TEXT;
--> statement-breakpoint
UPDATE material_subcategories SET scope_examples=COALESCE(scope_examples,description) WHERE scope_examples IS NULL;
