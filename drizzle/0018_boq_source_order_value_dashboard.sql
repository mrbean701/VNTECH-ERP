-- KHO VNTECH V5.0.0: preserve the exact BOQ/contract source structure and value basis.
ALTER TABLE project_boq_items ADD COLUMN source_order INTEGER;
ALTER TABLE project_boq_items ADD COLUMN contract_line_ref TEXT;
ALTER TABLE project_boq_items ADD COLUMN row_role TEXT NOT NULL DEFAULT 'material';
ALTER TABLE project_boq_items ADD COLUMN parent_source_order INTEGER;
ALTER TABLE project_boq_items ADD COLUMN outline_level INTEGER NOT NULL DEFAULT 0;
ALTER TABLE project_boq_items ADD COLUMN source_sheet TEXT;
ALTER TABLE project_boq_items ADD COLUMN source_row INTEGER;

UPDATE project_boq_items
SET source_order=line_no,
    contract_line_ref=CAST(line_no AS TEXT)
WHERE source_order IS NULL;

CREATE INDEX IF NOT EXISTS project_boq_source_order_idx
ON project_boq_items(project_id,source_order);
