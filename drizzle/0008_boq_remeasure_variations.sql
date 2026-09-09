ALTER TABLE project_boq_items ADD COLUMN item_type TEXT NOT NULL DEFAULT 'contract';
--> statement-breakpoint
ALTER TABLE project_boq_items ADD COLUMN remeasured_qty REAL NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE project_boq_items ADD COLUMN variation_status TEXT NOT NULL DEFAULT 'none';
--> statement-breakpoint
ALTER TABLE project_boq_items ADD COLUMN variation_ref TEXT;
--> statement-breakpoint
ALTER TABLE project_boq_items ADD COLUMN variation_approved_at TEXT;
--> statement-breakpoint
UPDATE project_boq_items SET remeasured_qty=contract_qty WHERE remeasured_qty=0 AND contract_qty<>0;
