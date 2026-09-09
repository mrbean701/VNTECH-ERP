-- PATCH09 | VNTECH Material Matching Engine V2
-- Contract BOQ source data is immutable business input; enrichment/matching is separate and requires confirmation.
CREATE TABLE IF NOT EXISTS boq_import_batches (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  version_no INTEGER NOT NULL,
  source_file_name TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  row_count INTEGER NOT NULL DEFAULT 0,
  imported_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS boq_import_batches_project_version_uidx ON boq_import_batches(project_id,version_no);
CREATE INDEX IF NOT EXISTS boq_import_batches_project_active_idx ON boq_import_batches(project_id,active,version_no);

CREATE TABLE IF NOT EXISTS boq_source_items (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL REFERENCES boq_import_batches(id),
  project_id TEXT NOT NULL REFERENCES projects(id),
  source_order INTEGER NOT NULL,
  source_row INTEGER,
  contract_line_ref TEXT,
  row_role TEXT NOT NULL DEFAULT 'material',
  boq_code TEXT,
  contract_code TEXT,
  contract_material_code TEXT,
  approved_material_code TEXT,
  contract_material_name TEXT,
  unit TEXT,
  contract_qty REAL NOT NULL DEFAULT 0,
  remeasured_qty REAL NOT NULL DEFAULT 0,
  unit_price REAL NOT NULL DEFAULT 0,
  item_type TEXT NOT NULL DEFAULT 'contract',
  note TEXT,
  source_system_code TEXT,
  source_subgroup_name TEXT,
  raw_source_json TEXT,
  mapped_material_id TEXT REFERENCES materials(id),
  standard_material_name_snapshot TEXT,
  mapping_status TEXT NOT NULL DEFAULT 'unmapped',
  project_boq_item_id TEXT REFERENCES project_boq_items(id),
  mapped_by TEXT REFERENCES users(id),
  mapped_at TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS boq_source_items_batch_order_idx ON boq_source_items(batch_id,source_order);
CREATE INDEX IF NOT EXISTS boq_source_items_project_status_idx ON boq_source_items(project_id,mapping_status,active);
CREATE INDEX IF NOT EXISTS boq_source_items_material_idx ON boq_source_items(mapped_material_id,active);

CREATE TABLE IF NOT EXISTS material_embeddings (
  id TEXT PRIMARY KEY,
  material_id TEXT NOT NULL REFERENCES materials(id),
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  semantic_hash TEXT NOT NULL,
  vector_json TEXT NOT NULL,
  dimension INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS material_embeddings_provider_uidx ON material_embeddings(material_id,provider,model);

CREATE TABLE IF NOT EXISTS boq_mapping_runs (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL REFERENCES boq_import_batches(id),
  project_id TEXT NOT NULL REFERENCES projects(id),
  scope TEXT NOT NULL DEFAULT 'unmapped',
  provider TEXT NOT NULL,
  provider_fallback INTEGER NOT NULL DEFAULT 0,
  top_k INTEGER NOT NULL DEFAULT 5,
  thresholds_json TEXT NOT NULL,
  weights_json TEXT NOT NULL,
  run_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS boq_mapping_runs_batch_idx ON boq_mapping_runs(batch_id,created_at);

CREATE TABLE IF NOT EXISTS boq_mapping_candidates (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES boq_mapping_runs(id),
  source_item_id TEXT NOT NULL REFERENCES boq_source_items(id),
  material_id TEXT NOT NULL REFERENCES materials(id),
  rank_no INTEGER NOT NULL,
  history_score REAL NOT NULL DEFAULT 0,
  technical_score REAL NOT NULL DEFAULT 0,
  system_score REAL NOT NULL DEFAULT 0,
  uom_score REAL NOT NULL DEFAULT 0,
  fuzzy_score REAL NOT NULL DEFAULT 0,
  embedding_score REAL NOT NULL DEFAULT 0,
  final_score REAL NOT NULL DEFAULT 0,
  hard_conflict INTEGER NOT NULL DEFAULT 0,
  conflict_reason TEXT,
  provider TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS boq_mapping_candidates_run_source_rank_uidx ON boq_mapping_candidates(run_id,source_item_id,rank_no);
CREATE INDEX IF NOT EXISTS boq_mapping_candidates_source_score_idx ON boq_mapping_candidates(source_item_id,final_score);

CREATE TABLE IF NOT EXISTS boq_mapping_audit (
  id TEXT PRIMARY KEY,
  source_item_id TEXT NOT NULL REFERENCES boq_source_items(id),
  run_id TEXT REFERENCES boq_mapping_runs(id),
  old_material_id TEXT REFERENCES materials(id),
  new_material_id TEXT NOT NULL REFERENCES materials(id),
  action_type TEXT NOT NULL,
  final_score REAL,
  score_detail_json TEXT,
  provider TEXT,
  reason TEXT,
  save_alias INTEGER NOT NULL DEFAULT 0,
  actor_user_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS boq_mapping_audit_source_idx ON boq_mapping_audit(source_item_id,created_at);

CREATE TABLE IF NOT EXISTS material_mapping_history (
  id TEXT PRIMARY KEY,
  material_id TEXT NOT NULL REFERENCES materials(id),
  source_normalized TEXT NOT NULL,
  source_text TEXT NOT NULL,
  system_code TEXT,
  unit TEXT,
  confirm_count INTEGER NOT NULL DEFAULT 1,
  last_confirmed_by TEXT NOT NULL REFERENCES users(id),
  last_confirmed_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS material_mapping_history_uidx ON material_mapping_history(material_id,source_normalized);
CREATE INDEX IF NOT EXISTS material_mapping_history_source_idx ON material_mapping_history(source_normalized,confirm_count);

-- Future-safe 1 BOQ source item -> 0..N Material components. PATCH09 UI still prioritizes 1:1 mapping.
CREATE TABLE IF NOT EXISTS boq_material_components (
  id TEXT PRIMARY KEY,
  source_item_id TEXT NOT NULL REFERENCES boq_source_items(id),
  material_id TEXT NOT NULL REFERENCES materials(id),
  component_type TEXT NOT NULL DEFAULT 'main',
  quantity_ratio REAL NOT NULL DEFAULT 1,
  component_uom TEXT,
  is_required INTEGER NOT NULL DEFAULT 1,
  source_method TEXT NOT NULL DEFAULT 'manual',
  approved_by TEXT REFERENCES users(id),
  approved_at TEXT,
  note TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS boq_material_components_uidx ON boq_material_components(source_item_id,material_id,component_type);
CREATE INDEX IF NOT EXISTS boq_material_components_source_idx ON boq_material_components(source_item_id,active);
