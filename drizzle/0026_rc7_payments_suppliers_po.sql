-- KHO VNTECH V5.2.5 RC7 - 2026-08-26
-- Thanh toán HĐ + cấu hình NCC/PO nhiều NCC. Không xóa/đổi dữ liệu cũ.
CREATE TABLE IF NOT EXISTS contract_payments (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  payment_date TEXT NOT NULL,
  reference_no TEXT,
  description TEXT NOT NULL,
  amount NUMERIC(20,0) NOT NULL DEFAULT 0,
  note TEXT,
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS contract_payments_project_date_idx ON contract_payments(project_id,payment_date);
--> statement-breakpoint
INSERT OR IGNORE INTO module_catalog
(module_key,label,icon,group_name,group_key,active,sort_order,system_locked,created_at,updated_at)
VALUES ('payments','Thanh toán HĐ','TT','BOQ & Hợp đồng','boq_contract',1,85,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
