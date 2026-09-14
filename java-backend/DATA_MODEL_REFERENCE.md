# DATA MODEL REFERENCE — VNTECH ERP (nguồn cho MySQL/Flyway)

- Nguồn: `drizzle/0000..0075` (76 migration, dialect SQLite/Postgres) — branch `unity`
- Tổng bảng: **114**
- Mục tiêu: sinh `V1__baseline.sql` dialect MySQL 8.4 (utf8mb4, DATETIME(3) thay TEXT timestamp)

## Nhóm nghiệp vụ (ước theo tên bảng)

### Tài chính / pháp chế (16)

- `accounting_vouchers`
- `advance_requests`
- `bank_accounts`
- `benefit_records`
- `capital_recovery_records`
- `cashbook_entries`
- `construction_daily_log_items`
- `construction_daily_logs`
- `contract_payments`
- `hr_records`
- `labor_contracts`
- `legal_documents`
- `payment_plans`
- `production_reports`
- `seal_management`
- `site_expense_claims`

### Khác (33)

- `approval_email_recipients`
- `approval_project_assignments`
- `approval_stage_catalog`
- `approval_stage_decisions`
- `contract_ownership_transfers`
- `goods_receipt_items`
- `material_code_history`
- `material_external_codes`
- `material_mapping_history`
- `material_mar_approvals`
- `material_norms`
- `material_request_items`
- `material_return_items`
- `material_returns`
- `material_uom_conversions`
- `menu_group_catalog`
- `module_catalog`
- `official_correspondence`
- `project_archives`
- `project_close_checks`
- `purchase_order_items`
- `request_comments`
- `server_deployment_metadata`
- `task_notifications`
- `task_sla_policies`
- `team_payments`
- `team_production_records`
- `team_settlements`
- `team_subcontracts`
- `ui_display_settings`
- `warehouse_locations`
- `work_item_events`
- `work_items`

### Mua hàng / phê duyệt (4)

- `approvals`
- `material_requests`
- `purchase_orders`
- `supply_workflow_steps`

### Security / audit / trust (18)

- `attachments`
- `audit_logs`
- `custom_field_values`
- `email_outbox`
- `email_settings`
- `form_field_config`
- `sessions`
- `user_module_permissions`
- `user_project_scopes`
- `user_warehouse_scopes`
- `users`
- `vntech_attestation_events`
- `vntech_license_installations`
- `vntech_license_transfer_requests`
- `vntech_product_identity`
- `vntech_release_signatures`
- `vntech_trust_audit`
- `vntech_trust_settings`

### BOQ / mapping (11)

- `boq_change_history`
- `boq_import_batches`
- `boq_mapping_audit`
- `boq_mapping_candidates`
- `boq_mapping_runs`
- `boq_material_components`
- `boq_price_import_batches`
- `boq_price_import_items`
- `boq_source_items`
- `material_embeddings`
- `project_boq_items`

### Master data (17)

- `boq_versions`
- `business_role_engine_catalog`
- `business_role_group_catalog`
- `business_role_group_scopes`
- `business_scope_catalog`
- `company_settings`
- `document_sequences`
- `material_aliases`
- `material_categories`
- `material_subcategories`
- `materials`
- `organization_units`
- `project_contracts`
- `projects`
- `role_catalog`
- `suppliers`
- `teams`

### Kho / tồn (15)

- `central_return_items`
- `central_returns`
- `contract_stock_ledger`
- `contract_stock_reconciliations`
- `goods_receipts`
- `procurement_allocations`
- `stock_count_items`
- `stock_counts`
- `stock_issue_items`
- `stock_issues`
- `stock_movements`
- `stock_reservations`
- `transfer_order_items`
- `transfer_orders`
- `warehouses`

## Chi tiết từng bảng

### `accounting_vouchers`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| voucher_no | TEXT | ✅ |  |  |  |
| voucher_date | TEXT | ✅ |  |  |  |
| voucher_type | TEXT | ✅ |  |  |  |
| project_id | TEXT |  |  |  |  |
| description | TEXT |  |  |  |  |
| total_amount | REAL | ✅ |  | 0 |  |
| status | TEXT | ✅ |  | draft |  |
| files_json | TEXT |  |  |  |  |
| created_by | TEXT | ✅ |  |  |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- UNIQUE `accounting_vouchers_inline_unique` (voucher_no)
- `idx_accounting_vouchers_date` (voucher_date)
- `idx_accounting_vouchers_type` (voucher_type)

### `advance_requests`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| request_no | TEXT | ✅ |  |  |  |
| project_id | TEXT |  |  |  |  |
| requester_id | TEXT | ✅ |  |  |  |
| amount | REAL | ✅ |  | 0 |  |
| purpose | TEXT | ✅ |  |  |  |
| category | TEXT | ✅ |  | purchase |  |
| status | TEXT | ✅ |  | draft |  |
| advance_paid | REAL | ✅ |  | 0 |  |
| settlement_value | REAL | ✅ |  | 0 |  |
| settled_at | TEXT |  |  |  |  |
| note | TEXT |  |  |  |  |
| created_by | TEXT | ✅ |  |  |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- UNIQUE `advance_requests_inline_unique` (request_no)
- `idx_advance_requests_project` (project_id)
- `idx_advance_requests_status` (status)
- `idx_advance_requests_requester` (requester_id)

### `approval_email_recipients`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| project_id | TEXT | ✅ |  |  |  |
| stage | INTEGER | ✅ |  |  |  |
| emails | TEXT | ✅ |  |  |  |
| active | INTEGER | ✅ |  | 1 |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- UNIQUE `approval_email_recipients_scope_uidx` (project_id, stage)

FK:
- `project_id` → `projects(id)`

### `approval_project_assignments`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| project_id | TEXT | ✅ |  |  |  |
| stage | INTEGER | ✅ |  |  |  |
| owner_user_id | TEXT | ✅ |  |  |  |
| cc_emails | TEXT |  |  |  |  |
| active | INTEGER | ✅ |  | 1 |  |
| updated_by | TEXT |  |  |  |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- UNIQUE `approval_project_assignments_inline_unique` (project_id, stage)
- `approval_project_assignments_owner_idx` (owner_user_id, active)
- `approval_project_assignments_project_idx` (project_id, stage, active)

### `approval_stage_catalog`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| stage_no | INTEGER | ✅ |  |  |  |
| name | TEXT | ✅ |  |  |  |
| description | TEXT |  |  |  |  |
| allowed_role_codes | TEXT | ✅ |  |  |  |
| sla_hours | INTEGER | ✅ |  | 8 |  |
| auto_approve_on_submit | INTEGER | ✅ |  | 0 |  |
| active | INTEGER | ✅ |  | 1 |  |
| sort_order | INTEGER | ✅ |  | 0 |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |
| approval_mode | TEXT | ✅ |  | single |  |

### `approval_stage_decisions`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| request_id | TEXT | ✅ |  |  |  |
| stage | INTEGER | ✅ |  |  |  |
| role_code | TEXT | ✅ |  |  |  |
| user_id | TEXT | ✅ |  |  |  |
| decision | TEXT | ✅ |  |  |  |
| comment | TEXT |  |  |  |  |
| decided_at | TEXT | ✅ |  |  |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- UNIQUE `approval_stage_decisions_inline_unique` (request_id, stage, role_code)

### `approvals`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| request_id | TEXT | ✅ |  |  |  |
| stage | INTEGER | ✅ |  |  |  |
| department | TEXT | ✅ |  |  |  |
| approver_user_id | TEXT |  |  |  |  |
| status | TEXT | ✅ |  | pending |  |
| due_at | TEXT |  |  |  |  |
| decided_at | TEXT |  |  |  |  |
| comment | TEXT |  |  |  |  |
| decision_snapshot | TEXT |  |  |  |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |
| queued_at | TEXT |  |  |  |  |
| notified_at | TEXT |  |  |  |  |
| reminder_sent_at | TEXT |  |  |  |  |
| allowed_role_codes_snapshot | TEXT |  |  |  |  |
| approval_mode_snapshot | TEXT | ✅ |  | single |  |

Indexes:
- UNIQUE `approvals_request_stage_uidx` (request_id, stage)
- `approvals_queue_idx` (status, stage, due_at)

FK:
- `request_id` → `material_requests(id)`
- `approver_user_id` → `users(id)`

### `attachments`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| entity_type | TEXT | ✅ |  |  |  |
| entity_id | TEXT | ✅ |  |  |  |
| file_name | TEXT | ✅ |  |  |  |
| storage_key | TEXT | ✅ |  |  |  |
| mime_type | TEXT | ✅ |  |  |  |
| uploaded_by | TEXT | ✅ |  |  |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- `attachments_entity_idx` (entity_type, entity_id)

FK:
- `uploaded_by` → `users(id)`

### `audit_logs`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| user_id | TEXT |  |  |  |  |
| action | TEXT | ✅ |  |  |  |
| entity_type | TEXT | ✅ |  |  |  |
| entity_id | TEXT | ✅ |  |  |  |
| before_json | TEXT |  |  |  |  |
| after_json | TEXT |  |  |  |  |
| ip_address | TEXT |  |  |  |  |
| occurred_at | TEXT | ✅ |  |  |  |

Indexes:
- `audit_logs_entity_idx` (entity_type, entity_id)
- `audit_logs_user_date_idx` (user_id, occurred_at)

FK:
- `user_id` → `users(id)`

### `bank_accounts`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| code | TEXT | ✅ |  |  |  |
| bank_name | TEXT | ✅ |  |  |  |
| account_no | TEXT | ✅ |  |  |  |
| branch | TEXT |  |  |  |  |
| currency | TEXT | ✅ |  | VND |  |
| opening_balance | REAL | ✅ |  | 0 |  |
| active | INTEGER | ✅ |  | 1 |  |
| created_by | TEXT | ✅ |  |  |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- UNIQUE `bank_accounts_inline_unique` (code)

### `benefit_records`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| benefit_no | TEXT | ✅ |  |  |  |
| user_id | TEXT | ✅ |  |  |  |
| benefit_type | TEXT | ✅ |  |  |  |
| provider | TEXT |  |  |  |  |
| start_date | TEXT |  |  |  |  |
| end_date | TEXT |  |  |  |  |
| monthly_amount | REAL | ✅ |  | 0 |  |
| status | TEXT | ✅ |  | active |  |
| note | TEXT |  |  |  |  |
| created_by | TEXT | ✅ |  |  |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- UNIQUE `benefit_records_inline_unique` (benefit_no)
- `idx_benefit_user` (user_id)

### `boq_change_history`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| project_id | TEXT | ✅ |  |  | projects(id) |
| contract_id | TEXT |  |  |  | project_contracts(id) |
| boq_version_id | TEXT |  |  |  | boq_versions(id) |
| source_item_id | TEXT |  |  |  | boq_source_items(id) |
| project_boq_item_id | TEXT |  |  |  | project_boq_items(id) |
| action_type | TEXT | ✅ |  |  |  |
| before_json | TEXT |  |  |  |  |
| after_json | TEXT |  |  |  |  |
| reason | TEXT |  |  |  |  |
| actor_user_id | TEXT |  |  |  | users(id) |
| created_at | TEXT | ✅ |  |  |  |

Indexes:
- `boq_change_history_scope_idx` (project_id, contract_id, boq_version_id, created_at)

### `boq_import_batches`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT |  | ✅ |  |  |
| project_id | TEXT | ✅ |  |  | projects(id) |
| version_no | INTEGER | ✅ |  |  |  |
| source_file_name | TEXT |  |  |  |  |
| active | INTEGER | ✅ |  | 1 |  |
| row_count | INTEGER | ✅ |  | 0 |  |
| imported_by | TEXT | ✅ |  |  | users(id) |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |
| contract_id | TEXT |  |  |  | project_contracts(id) |
| boq_version_id | TEXT |  |  |  | boq_versions(id) |

Indexes:
- UNIQUE `boq_import_batches_project_version_uidx` (project_id, version_no)
- `boq_import_batches_project_active_idx` (project_id, active, version_no)
- UNIQUE `boq_import_batches_contract_version_uidx` (contract_id, version_no)
- `boq_import_batches_boq_version_idx` (boq_version_id, active)

### `boq_mapping_audit`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT |  | ✅ |  |  |
| source_item_id | TEXT | ✅ |  |  | boq_source_items(id) |
| run_id | TEXT |  |  |  | boq_mapping_runs(id) |
| old_material_id | TEXT |  |  |  | materials(id) |
| new_material_id | TEXT | ✅ |  |  | materials(id) |
| action_type | TEXT | ✅ |  |  |  |
| final_score | REAL |  |  |  |  |
| score_detail_json | TEXT |  |  |  |  |
| provider | TEXT |  |  |  |  |
| reason | TEXT |  |  |  |  |
| save_alias | INTEGER | ✅ |  | 0 |  |
| actor_user_id | TEXT | ✅ |  |  | users(id) |
| created_at | TEXT | ✅ |  |  |  |

Indexes:
- `boq_mapping_audit_source_idx` (source_item_id, created_at)

### `boq_mapping_candidates`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT |  | ✅ |  |  |
| run_id | TEXT | ✅ |  |  | boq_mapping_runs(id) |
| source_item_id | TEXT | ✅ |  |  | boq_source_items(id) |
| material_id | TEXT | ✅ |  |  | materials(id) |
| rank_no | INTEGER | ✅ |  |  |  |
| history_score | REAL | ✅ |  | 0 |  |
| technical_score | REAL | ✅ |  | 0 |  |
| system_score | REAL | ✅ |  | 0 |  |
| uom_score | REAL | ✅ |  | 0 |  |
| fuzzy_score | REAL | ✅ |  | 0 |  |
| embedding_score | REAL | ✅ |  | 0 |  |
| final_score | REAL | ✅ |  | 0 |  |
| hard_conflict | INTEGER | ✅ |  | 0 |  |
| conflict_reason | TEXT |  |  |  |  |
| provider | TEXT |  |  |  |  |
| status | TEXT | ✅ |  |  |  |
| created_at | TEXT | ✅ |  |  |  |

Indexes:
- UNIQUE `boq_mapping_candidates_run_source_rank_uidx` (run_id, source_item_id, rank_no)
- `boq_mapping_candidates_source_score_idx` (source_item_id, final_score)

### `boq_mapping_runs`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT |  | ✅ |  |  |
| batch_id | TEXT | ✅ |  |  | boq_import_batches(id) |
| project_id | TEXT | ✅ |  |  | projects(id) |
| scope | TEXT | ✅ |  | unmapped |  |
| provider | TEXT | ✅ |  |  |  |
| provider_fallback | INTEGER | ✅ |  | 0 |  |
| top_k | INTEGER | ✅ |  | 5 |  |
| thresholds_json | TEXT | ✅ |  |  |  |
| weights_json | TEXT | ✅ |  |  |  |
| run_by | TEXT | ✅ |  |  | users(id) |
| created_at | TEXT | ✅ |  |  |  |
| contract_id | TEXT |  |  |  | project_contracts(id) |
| boq_version_id | TEXT |  |  |  | boq_versions(id) |

Indexes:
- `boq_mapping_runs_batch_idx` (batch_id, created_at)

### `boq_material_components`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT |  | ✅ |  |  |
| source_item_id | TEXT | ✅ |  |  | boq_source_items(id) |
| material_id | TEXT | ✅ |  |  | materials(id) |
| component_type | TEXT | ✅ |  | main |  |
| quantity_ratio | REAL | ✅ |  | 1 |  |
| component_uom | TEXT |  |  |  |  |
| is_required | INTEGER | ✅ |  | 1 |  |
| source_method | TEXT | ✅ |  | manual |  |
| approved_by | TEXT |  |  |  | users(id) |
| approved_at | TEXT |  |  |  |  |
| note | TEXT |  |  |  |  |
| active | INTEGER | ✅ |  | 1 |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- UNIQUE `boq_material_components_uidx` (source_item_id, material_id, component_type)
- `boq_material_components_source_idx` (source_item_id, active)

### `boq_price_import_batches`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT |  | ✅ |  |  |
| project_id | TEXT | ✅ |  |  | projects(id) |
| source_file_name | TEXT |  |  |  |  |
| price_type | TEXT | ✅ |  | contract |  |
| row_count | INTEGER | ✅ |  | 0 |  |
| changed_count | INTEGER | ✅ |  | 0 |  |
| unchanged_count | INTEGER | ✅ |  | 0 |  |
| updated_by | TEXT |  |  |  | users(id) |
| created_at | TEXT | ✅ |  | CURRENT_TIMESTAMP |  |

### `boq_price_import_items`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT |  | ✅ |  |  |
| batch_id | TEXT | ✅ |  |  | boq_price_import_batches(id) |
| boq_item_id | TEXT | ✅ |  |  | project_boq_items(id) |
| old_unit_price | REAL | ✅ |  | 0 |  |
| new_unit_price | REAL | ✅ |  | 0 |  |
| changed | INTEGER | ✅ |  | 0 |  |
| created_at | TEXT | ✅ |  | CURRENT_TIMESTAMP |  |

Indexes:
- `boq_price_import_items_batch_idx` (batch_id)
- `boq_price_import_items_boq_idx` (boq_item_id)

### `boq_source_items`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT |  | ✅ |  |  |
| batch_id | TEXT | ✅ |  |  | boq_import_batches(id) |
| project_id | TEXT | ✅ |  |  | projects(id) |
| source_order | INTEGER | ✅ |  |  |  |
| source_row | INTEGER |  |  |  |  |
| contract_line_ref | TEXT |  |  |  |  |
| row_role | TEXT | ✅ |  | material |  |
| boq_code | TEXT |  |  |  |  |
| contract_code | TEXT |  |  |  |  |
| contract_material_code | TEXT |  |  |  |  |
| approved_material_code | TEXT |  |  |  |  |
| contract_material_name | TEXT |  |  |  |  |
| unit | TEXT |  |  |  |  |
| contract_qty | REAL | ✅ |  | 0 |  |
| remeasured_qty | REAL | ✅ |  | 0 |  |
| unit_price | REAL | ✅ |  | 0 |  |
| item_type | TEXT | ✅ |  | contract |  |
| note | TEXT |  |  |  |  |
| source_system_code | TEXT |  |  |  |  |
| source_subgroup_name | TEXT |  |  |  |  |
| raw_source_json | TEXT |  |  |  |  |
| mapped_material_id | TEXT |  |  |  | materials(id) |
| standard_material_name_snapshot | TEXT |  |  |  |  |
| mapping_status | TEXT | ✅ |  | unmapped |  |
| project_boq_item_id | TEXT |  |  |  | project_boq_items(id) |
| mapped_by | TEXT |  |  |  | users(id) |
| mapped_at | TEXT |  |  |  |  |
| active | INTEGER | ✅ |  | 1 |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |
| contract_id | TEXT |  |  |  | project_contracts(id) |
| boq_version_id | TEXT |  |  |  | boq_versions(id) |

Indexes:
- `boq_source_items_batch_order_idx` (batch_id, source_order)
- `boq_source_items_project_status_idx` (project_id, mapping_status, active)
- `boq_source_items_material_idx` (mapped_material_id, active)
- `boq_source_items_contract_version_idx` (contract_id, boq_version_id, mapping_status, active)

### `boq_versions`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| project_id | TEXT | ✅ |  |  | projects(id) |
| contract_id | TEXT | ✅ |  |  | project_contracts(id) |
| version_no | INTEGER | ✅ |  |  |  |
| version_code | TEXT | ✅ |  |  |  |
| version_name | TEXT |  |  |  |  |
| revision_type | TEXT | ✅ |  | original |  |
| source_file_name | TEXT |  |  |  |  |
| status | TEXT | ✅ |  | active |  |
| active | INTEGER | ✅ |  | 1 |  |
| effective_at | TEXT |  |  |  |  |
| approved_at | TEXT |  |  |  |  |
| created_by | TEXT |  |  |  | users(id) |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- UNIQUE `boq_versions_inline_unique` (contract_id, version_no)
- `boq_versions_project_contract_idx` (project_id, contract_id, active, version_no)

### `business_role_engine_catalog`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT |  | ✅ |  |  |
| engine_key | TEXT | ✅ |  |  |  |
| company_code | TEXT | ✅ |  |  |  |
| display_name | TEXT | ✅ |  |  |  |
| description | TEXT |  |  |  |  |
| active | INTEGER | ✅ |  | 1 |  |
| sort_order | INTEGER | ✅ |  | 100 |  |
| system_locked | INTEGER | ✅ |  | 1 |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

### `business_role_group_catalog`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT |  | ✅ |  |  |
| code | TEXT | ✅ |  |  |  |
| name | TEXT | ✅ |  |  |  |
| description | TEXT |  |  |  |  |
| engine_role | TEXT | ✅ |  |  |  |
| active | INTEGER | ✅ |  | 1 |  |
| sort_order | INTEGER | ✅ |  | 100 |  |
| system_locked | INTEGER | ✅ |  | 0 |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

### `business_role_group_scopes`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| business_group_id | TEXT | ✅ |  |  | business_role_group_catalog(id) |
| business_scope_id | TEXT | ✅ |  |  | business_scope_catalog(id) |
| is_primary | INTEGER | ✅ |  | 0 |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- UNIQUE `business_role_group_scopes_inline_unique` (business_group_id, business_scope_id)
- `business_role_group_scopes_group_idx` (business_group_id, is_primary)

### `business_scope_catalog`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| code | TEXT | ✅ |  |  |  |
| name | TEXT | ✅ |  |  |  |
| description | TEXT |  |  |  |  |
| active | INTEGER | ✅ |  | 1 |  |
| sort_order | INTEGER | ✅ |  | 100 |  |
| system_locked | INTEGER | ✅ |  | 0 |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- UNIQUE `business_scope_name_uq` (lower(trim(name)

### `capital_recovery_records`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| project_id | TEXT | ✅ |  |  | projects(id) |
| period_key | TEXT | ✅ |  |  |  |
| reference_no | TEXT |  |  |  |  |
| production_report_id | TEXT |  |  |  | production_reports(id) |
| submitted_value | REAL | ✅ |  | 0 |  |
| approved_value | REAL | ✅ |  | 0 |  |
| invoice_no | TEXT |  |  |  |  |
| invoice_value | REAL | ✅ |  | 0 |  |
| due_date | TEXT |  |  |  |  |
| status | TEXT | ✅ |  | preparing |  |
| note | TEXT |  |  |  |  |
| created_by | TEXT |  |  |  | users(id) |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- `capital_recovery_project_period_idx` (project_id, period_key)

### `cashbook_entries`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| entry_no | TEXT | ✅ |  |  |  |
| entry_date | TEXT | ✅ |  |  |  |
| account_id | TEXT | ✅ |  |  |  |
| entry_type | TEXT | ✅ |  |  |  |
| amount | REAL | ✅ |  | 0 |  |
| counterparty | TEXT |  |  |  |  |
| reference_type | TEXT |  |  |  |  |
| reference_id | TEXT |  |  |  |  |
| note | TEXT |  |  |  |  |
| created_by | TEXT | ✅ |  |  |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- UNIQUE `cashbook_entries_inline_unique` (entry_no)
- `idx_cashbook_account` (account_id, entry_date)
- `idx_cashbook_type` (entry_type)

### `central_return_items`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| central_return_id | TEXT | ✅ |  |  | central_returns(id) |
| material_id | TEXT | ✅ |  |  | materials(id) |
| proposed_qty | REAL | ✅ |  |  |  |
| counted_qty | REAL | ✅ |  | 0 |  |
| accepted_qty | REAL | ✅ |  | 0 |  |
| rejected_qty | REAL | ✅ |  | 0 |  |
| condition_status | TEXT | ✅ |  | usable |  |
| unit_cost | REAL | ✅ |  | 0 |  |
| rejection_reason | TEXT |  |  |  |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |
| contract_id | TEXT |  |  |  | project_contracts(id) |

Indexes:
- `central_return_items_return_idx` (central_return_id, material_id)

### `central_returns`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| return_no | TEXT | ✅ |  |  |  |
| source_project_id | TEXT | ✅ |  |  | projects(id) |
| source_warehouse_id | TEXT | ✅ |  |  | warehouses(id) |
| central_warehouse_id | TEXT | ✅ |  |  | warehouses(id) |
| requested_by | TEXT | ✅ |  |  | users(id) |
| requested_at | TEXT | ✅ |  |  |  |
| approved_by | TEXT |  |  |  | users(id) |
| approved_at | TEXT |  |  |  |  |
| received_by | TEXT |  |  |  | users(id) |
| received_at | TEXT |  |  |  |  |
| status | TEXT | ✅ |  | pending_approval |  |
| note | TEXT |  |  |  |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- `central_returns_status_idx` (status, requested_at)

### `company_settings`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| company_name | TEXT | ✅ |  |  |  |
| stage_1_department | TEXT | ✅ |  | BCH / Chỉ huy trưởng |  |
| stage_2_department | TEXT | ✅ |  | Phòng Dự án |  |
| stage_3_department | TEXT | ✅ |  | KH-MH / Tài chính |  |
| approval_sla_hours | INTEGER | ✅ |  | 24 |  |
| slow_moving_days | INTEGER | ✅ |  | 60 |  |
| negative_stock_blocked | INTEGER | ✅ |  | true |  |
| updated_by | TEXT |  |  |  |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |
| stage_1_sla_hours | INTEGER | ✅ |  | 8 |  |
| stage_2_sla_hours | INTEGER | ✅ |  | 8 |  |
| stage_3_sla_hours | INTEGER | ✅ |  | 8 |  |
| po_sla_hours | INTEGER | ✅ |  | 24 |  |
| bch_confirmation_sla_hours | INTEGER | ✅ |  | 8 |  |

FK:
- `updated_by` → `users(id)`

### `construction_daily_log_items`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| log_id | TEXT | ✅ |  |  |  |
| boq_item_id | TEXT |  |  |  |  |
| item_name | TEXT | ✅ |  |  |  |
| location | TEXT |  |  |  |  |
| planned_qty | REAL | ✅ |  | 0 |  |
| completed_qty | REAL | ✅ |  | 0 |  |
| unit | TEXT |  |  |  |  |
| labor_hours | REAL | ✅ |  | 0 |  |
| photo_attachment_id | TEXT |  |  |  |  |
| note | TEXT |  |  |  |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- `idx_cdli_log` (log_id)

### `construction_daily_logs`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| log_no | TEXT | ✅ |  |  |  |
| project_id | TEXT | ✅ |  |  |  |
| warehouse_id | TEXT |  |  |  |  |
| work_date | TEXT | ✅ |  |  |  |
| shift | TEXT | ✅ |  | sang |  |
| weather | TEXT |  |  |  |  |
| work_content | TEXT |  |  |  |  |
| labor_count | INTEGER | ✅ |  | 0 |  |
| equipment_note | TEXT |  |  |  |  |
| status | TEXT | ✅ |  | draft |  |
| submitted_by | TEXT |  |  |  |  |
| approved_by | TEXT |  |  |  |  |
| approved_at | TEXT |  |  |  |  |
| cancelled_by | TEXT |  |  |  |  |
| cancelled_at | TEXT |  |  |  |  |
| note | TEXT |  |  |  |  |
| created_by | TEXT | ✅ |  |  |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- UNIQUE `construction_daily_logs_inline_unique` (log_no)
- `idx_cdl_project_date` (project_id, work_date)
- `idx_cdl_status` (status)

### `contract_ownership_transfers`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| transfer_no | TEXT | ✅ |  |  |  |
| warehouse_id | TEXT | ✅ |  |  | warehouses(id) |
| material_id | TEXT | ✅ |  |  | materials(id) |
| source_project_id | TEXT | ✅ |  |  | projects(id) |
| source_contract_id | TEXT | ✅ |  |  | project_contracts(id) |
| destination_project_id | TEXT | ✅ |  |  | projects(id) |
| destination_contract_id | TEXT | ✅ |  |  | project_contracts(id) |
| quantity | REAL | ✅ |  |  |  |
| reason | TEXT | ✅ |  |  |  |
| source_reference_type | TEXT |  |  |  |  |
| source_reference_id | TEXT |  |  |  |  |
| status | TEXT | ✅ |  | posted |  |
| posted_by | TEXT | ✅ |  |  | users(id) |
| posted_at | TEXT | ✅ |  |  |  |
| created_at | TEXT | ✅ |  |  |  |

Indexes:
- UNIQUE `contract_ownership_transfers_no_uidx` (transfer_no)
- `contract_ownership_transfers_contract_idx` (source_contract_id, destination_contract_id, posted_at)

### `contract_payments`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT |  | ✅ |  |  |
| project_id | TEXT | ✅ |  |  | projects(id) |
| payment_date | TEXT | ✅ |  |  |  |
| reference_no | TEXT |  |  |  |  |
| description | TEXT | ✅ |  |  |  |
| amount | NUMERIC | ✅ |  | 0 |  |
| note | TEXT |  |  |  |  |
| created_by | TEXT |  |  |  | users(id) |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |
| recovery_record_id | TEXT |  |  |  | capital_recovery_records(id) |

Indexes:
- `contract_payments_project_date_idx` (project_id, payment_date)
- `contract_payments_recovery_idx` (recovery_record_id)

### `contract_stock_ledger`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| project_id | TEXT | ✅ |  |  | projects(id) |
| contract_id | TEXT | ✅ |  |  | project_contracts(id) |
| warehouse_id | TEXT | ✅ |  |  | warehouses(id) |
| material_id | TEXT | ✅ |  |  | materials(id) |
| movement_type | TEXT | ✅ |  |  |  |
| quantity_delta | REAL | ✅ |  |  |  |
| occurred_at | TEXT | ✅ |  |  |  |
| reference_type | TEXT | ✅ |  |  |  |
| reference_id | TEXT | ✅ |  |  |  |
| reference_item_id | TEXT |  |  |  |  |
| counterparty_contract_id | TEXT |  |  |  | project_contracts(id) |
| actor_user_id | TEXT |  |  |  | users(id) |
| note | TEXT |  |  |  |  |
| created_at | TEXT | ✅ |  |  |  |

Indexes:
- `contract_stock_ledger_balance_idx` (project_id, contract_id, warehouse_id, material_id, occurred_at)
- `contract_stock_ledger_reference_idx` (reference_type, reference_id, reference_item_id)

### `contract_stock_reconciliations`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| project_id | TEXT | ✅ |  |  | projects(id) |
| warehouse_id | TEXT | ✅ |  |  | warehouses(id) |
| material_id | TEXT | ✅ |  |  | materials(id) |
| physical_qty | REAL | ✅ |  |  |  |
| contract_qty | REAL | ✅ |  |  |  |
| difference_qty | REAL | ✅ |  |  |  |
| status | TEXT | ✅ |  |  |  |
| checked_by | TEXT | ✅ |  |  | users(id) |
| checked_at | TEXT | ✅ |  |  |  |
| note | TEXT |  |  |  |  |
| created_at | TEXT | ✅ |  |  |  |

Indexes:
- `contract_stock_reconciliations_scope_idx` (project_id, warehouse_id, status, checked_at)

### `custom_field_values`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| form_key | TEXT | ✅ |  |  |  |
| entity_id | TEXT | ✅ |  |  |  |
| field_key | TEXT | ✅ |  |  |  |
| value_text | TEXT |  |  |  |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- UNIQUE `custom_field_values_inline_unique` (form_key, entity_id, field_key)
- `custom_field_values_entity_idx` (form_key, entity_id)

### `document_sequences`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| document_type | TEXT | ✅ |  |  |  |
| project_id | TEXT | ✅ |  |  |  |
| year | INTEGER | ✅ |  |  |  |
| last_number | INTEGER | ✅ |  | 0 |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- UNIQUE `document_sequences_scope_uidx` (document_type, project_id, year)

FK:
- `project_id` → `projects(id)`

### `email_outbox`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| request_id | TEXT |  |  |  |  |
| stage | INTEGER |  |  |  |  |
| event | TEXT | ✅ |  |  |  |
| recipients | TEXT | ✅ |  |  |  |
| subject | TEXT | ✅ |  |  |  |
| text_body | TEXT | ✅ |  |  |  |
| html_body | TEXT | ✅ |  |  |  |
| status | TEXT | ✅ |  | queued |  |
| attempt_count | INTEGER | ✅ |  | 0 |  |
| next_attempt_at | TEXT |  |  |  |  |
| queued_at | TEXT | ✅ |  |  |  |
| sent_at | TEXT |  |  |  |  |
| last_error | TEXT |  |  |  |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- `email_outbox_queue_idx` (status, next_attempt_at, queued_at)
- `email_outbox_request_idx` (request_id, stage, event)

FK:
- `request_id` → `material_requests(id)`

### `email_settings`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| enabled | INTEGER | ✅ |  | 0 |  |
| smtp_host | TEXT |  |  |  |  |
| smtp_port | INTEGER | ✅ |  | 587 |  |
| security | TEXT | ✅ |  | starttls |  |
| username | TEXT |  |  |  |  |
| password | TEXT |  |  |  |  |
| sender_email | TEXT |  |  |  |  |
| sender_name | TEXT | ✅ |  | MEP Warehouse |  |
| base_url | TEXT |  |  |  |  |
| updated_by | TEXT |  |  |  |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

FK:
- `updated_by` → `users(id)`

### `form_field_config`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| form_key | TEXT | ✅ |  |  |  |
| field_key | TEXT | ✅ |  |  |  |
| display_name | TEXT | ✅ |  |  |  |
| data_type | TEXT | ✅ |  | text |  |
| source_kind | TEXT | ✅ |  | core |  |
| visible | INTEGER | ✅ |  | 1 |  |
| required | INTEGER | ✅ |  | 0 |  |
| importable | INTEGER | ✅ |  | 1 |  |
| exportable | INTEGER | ✅ |  | 1 |  |
| editable | INTEGER | ✅ |  | 1 |  |
| sort_order | INTEGER | ✅ |  | 0 |  |
| options_json | TEXT |  |  |  |  |
| system_locked | INTEGER | ✅ |  | 0 |  |
| active | INTEGER | ✅ |  | 1 |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- UNIQUE `form_field_config_inline_unique` (form_key, field_key)

### `goods_receipt_items`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| receipt_id | TEXT | ✅ |  |  |  |
| purchase_order_item_id | TEXT | ✅ |  |  |  |
| received_qty | REAL | ✅ |  |  |  |
| accepted_qty | REAL | ✅ |  | 0 |  |
| rejected_qty | REAL | ✅ |  | 0 |  |
| lot_no | TEXT |  |  |  |  |
| qc_result | TEXT | ✅ |  | pending |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |
| contract_id | TEXT |  |  |  | project_contracts(id) |
| boq_version_id | TEXT |  |  |  | boq_versions(id) |
| boq_item_id | TEXT |  |  |  | project_boq_items(id) |

Indexes:
- `goods_receipt_items_po_line_idx` (purchase_order_item_id)
- `goods_receipt_items_contract_boq_idx` (contract_id, boq_version_id, boq_item_id)

FK:
- `receipt_id` → `goods_receipts(id)`
- `purchase_order_item_id` → `purchase_order_items(id)`

### `goods_receipts`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| receipt_no | TEXT | ✅ |  |  |  |
| purchase_order_id | TEXT | ✅ |  |  |  |
| warehouse_id | TEXT | ✅ |  |  |  |
| received_by | TEXT | ✅ |  |  |  |
| received_at | TEXT | ✅ |  |  |  |
| delivery_note_no | TEXT |  |  |  |  |
| qc_status | TEXT | ✅ |  | pending |  |
| document_status | TEXT | ✅ |  | pending |  |
| posting_status | TEXT | ✅ |  | unposted |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |
| certificate_status | TEXT | ✅ |  | pending |  |
| delivery_document_status | TEXT | ✅ |  | pending |  |
| bch_confirmation_status | TEXT | ✅ |  | pending |  |
| bch_confirmed_by | TEXT |  |  |  |  |
| bch_confirmed_at | TEXT |  |  |  |  |
| bch_comment | TEXT |  |  |  |  |
| contract_id | TEXT |  |  |  | project_contracts(id) |
| boq_version_id | TEXT |  |  |  | boq_versions(id) |

Indexes:
- UNIQUE `goods_receipts_no_uidx` (receipt_no)
- `goods_receipts_po_idx` (purchase_order_id)

FK:
- `purchase_order_id` → `purchase_orders(id)`
- `warehouse_id` → `warehouses(id)`
- `received_by` → `users(id)`

### `hr_records`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| user_id | TEXT | ✅ |  |  |  |
| full_name | TEXT | ✅ |  |  |  |
| identity_no | TEXT |  |  |  |  |
| identity_date | TEXT |  |  |  |  |
| identity_place | TEXT |  |  |  |  |
| birth_date | TEXT |  |  |  |  |
| birthplace | TEXT |  |  |  |  |
| permanent_address | TEXT |  |  |  |  |
| phone | TEXT |  |  |  |  |
| education_level | TEXT |  |  |  |  |
| joined_date | TEXT |  |  |  |  |
| position | TEXT |  |  |  |  |
| note | TEXT |  |  |  |  |
| created_by | TEXT | ✅ |  |  |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- UNIQUE `hr_records_inline_unique` (user_id)
- `idx_hr_records_name` (full_name)

### `labor_contracts`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| contract_no | TEXT | ✅ |  |  |  |
| user_id | TEXT | ✅ |  |  |  |
| contract_type | TEXT | ✅ |  |  |  |
| start_date | TEXT |  |  |  |  |
| end_date | TEXT |  |  |  |  |
| signing_date | TEXT |  |  |  |  |
| salary | REAL | ✅ |  | 0 |  |
| status | TEXT | ✅ |  | active |  |
| note | TEXT |  |  |  |  |
| created_by | TEXT | ✅ |  |  |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- UNIQUE `labor_contracts_inline_unique` (contract_no)
- `idx_labor_contracts_user` (user_id)
- `idx_labor_contracts_status` (status)

### `legal_documents`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| doc_no | TEXT | ✅ |  |  |  |
| doc_type | TEXT | ✅ |  |  |  |
| title | TEXT | ✅ |  |  |  |
| issue_date | TEXT |  |  |  |  |
| issuer | TEXT |  |  |  |  |
| effective_date | TEXT |  |  |  |  |
| expiry_date | TEXT |  |  |  |  |
| scope | TEXT |  |  |  |  |
| attachment_id | TEXT |  |  |  |  |
| status | TEXT | ✅ |  | active |  |
| created_by | TEXT | ✅ |  |  |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- UNIQUE `legal_documents_inline_unique` (doc_no)
- `idx_legal_docs_type` (doc_type)

### `material_aliases`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| material_id | TEXT | ✅ |  |  | materials(id) |
| alias_name | TEXT | ✅ |  |  |  |
| normalized_name | TEXT | ✅ |  |  |  |
| verified | INTEGER | ✅ |  | 1 |  |
| active | INTEGER | ✅ |  | 1 |  |
| created_by | TEXT |  |  |  | users(id) |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- UNIQUE `material_aliases_inline_unique` (normalized_name)
- `material_aliases_material_idx` (material_id, active)

### `material_categories`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| code | TEXT | ✅ |  |  |  |
| name | TEXT | ✅ |  |  |  |
| description | TEXT |  |  |  |  |
| sort_order | INTEGER | ✅ |  | 0 |  |
| active | INTEGER | ✅ |  | 1 |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

### `material_code_history`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| material_id | TEXT | ✅ |  |  | materials(id) |
| old_code | TEXT | ✅ |  |  |  |
| new_code | TEXT | ✅ |  |  |  |
| reason | TEXT | ✅ |  |  |  |
| changed_by | TEXT | ✅ |  |  | users(id) |
| changed_at | TEXT | ✅ |  |  |  |

Indexes:
- `material_code_history_material_idx` (material_id, changed_at)

### `material_embeddings`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT |  | ✅ |  |  |
| material_id | TEXT | ✅ |  |  | materials(id) |
| provider | TEXT | ✅ |  |  |  |
| model | TEXT | ✅ |  |  |  |
| semantic_hash | TEXT | ✅ |  |  |  |
| vector_json | TEXT | ✅ |  |  |  |
| dimension | INTEGER | ✅ |  |  |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- UNIQUE `material_embeddings_provider_uidx` (material_id, provider, model)

### `material_external_codes`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| material_id | TEXT | ✅ |  |  |  |
| code_type | TEXT | ✅ |  |  |  |
| owner_key | TEXT | ✅ |  |  |  |
| external_code | TEXT | ✅ |  |  |  |
| active | INTEGER | ✅ |  | 1 |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- UNIQUE `material_external_codes_inline_unique` (code_type, owner_key, external_code)
- `material_external_codes_material_idx` (material_id, active)

### `material_mapping_history`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT |  | ✅ |  |  |
| material_id | TEXT | ✅ |  |  | materials(id) |
| source_normalized | TEXT | ✅ |  |  |  |
| source_text | TEXT | ✅ |  |  |  |
| system_code | TEXT |  |  |  |  |
| unit | TEXT |  |  |  |  |
| confirm_count | INTEGER | ✅ |  | 1 |  |
| last_confirmed_by | TEXT | ✅ |  |  | users(id) |
| last_confirmed_at | TEXT | ✅ |  |  |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- UNIQUE `material_mapping_history_uidx` (material_id, source_normalized)
- `material_mapping_history_source_idx` (source_normalized, confirm_count)

### `material_mar_approvals`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| project_id | TEXT | ✅ |  |  |  |
| material_id | TEXT | ✅ |  |  |  |
| approval_no | TEXT |  |  |  |  |
| status | TEXT | ✅ |  | pending |  |
| approved_at | TEXT |  |  |  |  |
| approved_by | TEXT |  |  |  |  |
| note | TEXT |  |  |  |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- UNIQUE `material_mar_approvals_inline_unique` (project_id, material_id)
- `material_mar_approval_idx` (project_id, material_id, status)

### `material_norms`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| norm_code | TEXT | ✅ |  |  |  |
| project_id | TEXT |  |  |  |  |
| subcategory_id | TEXT |  |  |  |  |
| item_name | TEXT | ✅ |  |  |  |
| material_id | TEXT |  |  |  |  |
| base_uom | TEXT |  |  |  |  |
| quantity_per_unit | REAL | ✅ |  | 0 |  |
| unit | TEXT |  |  |  |  |
| source_component_id | TEXT |  |  |  |  |
| source_type | TEXT | ✅ |  | manual |  |
| notes | TEXT |  |  |  |  |
| status | TEXT | ✅ |  | active |  |
| active | INTEGER | ✅ |  | 1 |  |
| created_by | TEXT | ✅ |  |  |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- UNIQUE `material_norms_inline_unique` (norm_code)
- `idx_material_norms_project` (project_id)
- `idx_material_norms_material` (material_id)
- `idx_material_norms_status` (status)

### `material_request_items`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| request_id | TEXT | ✅ |  |  |  |
| line_no | INTEGER | ✅ |  |  |  |
| material_id | TEXT | ✅ |  |  |  |
| work_package_code | TEXT |  |  |  |  |
| boq_code | TEXT |  |  |  |  |
| route_tag | TEXT |  |  |  |  |
| installation_area | TEXT |  |  |  |  |
| requested_qty | REAL | ✅ |  |  |  |
| stock_allocation_qty | REAL | ✅ |  | 0 |  |
| approved_purchase_qty | REAL | ✅ |  | 0 |  |
| ordered_qty | REAL | ✅ |  | 0 |  |
| received_qty | REAL | ✅ |  | 0 |  |
| issued_qty | REAL | ✅ |  | 0 |  |
| installed_qty | REAL | ✅ |  | 0 |  |
| line_status | TEXT | ✅ |  | pending |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |
| estimated_unit_price | REAL | ✅ |  | 0 |  |
| contract_line_no | INTEGER |  |  |  |  |
| origin | TEXT |  |  |  |  |
| approved_supplier | TEXT |  |  |  |  |
| note | TEXT |  |  |  |  |
| delivered_qty | REAL | ✅ |  | 0 |  |
| closed_qty | REAL | ✅ |  | 0 |  |
| close_reason | TEXT |  |  |  |  |
| boq_item_id | TEXT |  |  |  | project_boq_items(id) |
| contract_id | TEXT |  |  |  | project_contracts(id) |
| boq_version_id | TEXT |  |  |  | boq_versions(id) |

Indexes:
- UNIQUE `request_items_line_uidx` (request_id, line_no)
- `request_items_material_idx` (material_id)
- `request_items_boq_item_idx` (boq_item_id)
- `material_request_items_contract_boq_idx` (contract_id, boq_version_id, boq_item_id)

FK:
- `request_id` → `material_requests(id)`
- `material_id` → `materials(id)`

### `material_requests`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| request_no | TEXT | ✅ |  |  |  |
| project_id | TEXT | ✅ |  |  |  |
| team_id | TEXT |  |  |  |  |
| source_warehouse_id | TEXT |  |  |  |  |
| requested_by | TEXT | ✅ |  |  |  |
| requested_at | TEXT | ✅ |  |  |  |
| needed_at | TEXT | ✅ |  |  |  |
| priority | TEXT | ✅ |  | normal |  |
| area | TEXT | ✅ |  |  |  |
| purpose | TEXT |  |  |  |  |
| status | TEXT | ✅ |  | draft |  |
| approval_stage | INTEGER | ✅ |  | 0 |  |
| total_estimated_value | REAL | ✅ |  | 0 |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |
| supply_status | TEXT | ✅ |  | approval_pending |  |
| contract_id | TEXT |  |  |  | project_contracts(id) |
| boq_version_id | TEXT |  |  |  | boq_versions(id) |

Indexes:
- UNIQUE `material_requests_no_uidx` (request_no)
- `material_requests_project_status_idx` (project_id, status)
- `material_requests_needed_idx` (needed_at)

FK:
- `project_id` → `projects(id)`
- `team_id` → `teams(id)`
- `source_warehouse_id` → `warehouses(id)`
- `requested_by` → `users(id)`

### `material_return_items`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| return_id | TEXT | ✅ |  |  |  |
| material_id | TEXT | ✅ |  |  |  |
| quantity | REAL | ✅ |  |  |  |
| accepted_qty | REAL | ✅ |  | 0 |  |
| rejected_qty | REAL | ✅ |  | 0 |  |
| condition | TEXT | ✅ |  | usable |  |
| reason | TEXT |  |  |  |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |
| contract_id | TEXT |  |  |  | project_contracts(id) |

Indexes:
- `material_return_items_return_idx` (return_id)

FK:
- `return_id` → `material_returns(id)`
- `material_id` → `materials(id)`

### `material_returns`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| return_no | TEXT | ✅ |  |  |  |
| project_id | TEXT | ✅ |  |  |  |
| team_id | TEXT | ✅ |  |  |  |
| to_warehouse_id | TEXT | ✅ |  |  |  |
| returned_by_name | TEXT | ✅ |  |  |  |
| received_by | TEXT |  |  |  |  |
| returned_at | TEXT | ✅ |  |  |  |
| status | TEXT | ✅ |  | pending |  |
| note | TEXT |  |  |  |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- UNIQUE `material_returns_no_uidx` (return_no)
- `material_returns_project_idx` (project_id, returned_at)
- `material_returns_team_idx` (team_id, returned_at)

FK:
- `project_id` → `projects(id)`
- `team_id` → `teams(id)`
- `to_warehouse_id` → `warehouses(id)`
- `received_by` → `users(id)`

### `material_subcategories`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| category_id | TEXT | ✅ |  |  | material_categories(id) |
| code | TEXT | ✅ |  |  |  |
| name | TEXT | ✅ |  |  |  |
| description | TEXT |  |  |  |  |
| sort_order | INTEGER | ✅ |  | 0 |  |
| active | INTEGER | ✅ |  | 1 |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |
| scope_examples | TEXT |  |  |  |  |
| review_status | TEXT | ✅ |  | approved |  |
| adjustment_note | TEXT |  |  |  |  |

Indexes:
- UNIQUE `material_subcategories_category_code_uidx` (category_id, code)
- `material_subcategories_category_idx` (category_id, sort_order, name)

### `material_uom_conversions`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| material_id | TEXT | ✅ |  |  |  |
| from_uom | TEXT | ✅ |  |  |  |
| to_uom | TEXT | ✅ |  |  |  |
| factor | REAL | ✅ |  |  |  |
| active | INTEGER | ✅ |  | 1 |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- UNIQUE `material_uom_conversions_inline_unique` (material_id, from_uom, to_uom)

### `materials`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| code | TEXT | ✅ |  |  |  |
| name | TEXT | ✅ |  |  |  |
| system | TEXT | ✅ |  |  |  |
| specification | TEXT |  |  |  |  |
| brand | TEXT |  |  |  |  |
| unit | TEXT | ✅ |  |  |  |
| standard_price | REAL | ✅ |  | 0 |  |
| min_stock | REAL | ✅ |  | 0 |  |
| requires_cocq | INTEGER | ✅ |  | false |  |
| requires_mar | INTEGER | ✅ |  | false |  |
| active | INTEGER | ✅ |  | true |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |
| category_id | TEXT |  |  |  | material_categories(id) |
| subcategory_id | TEXT |  |  |  | material_subcategories(id) |

Indexes:
- UNIQUE `materials_code_uidx` (code)
- `materials_system_idx` (system)
- `materials_subcategory_idx` (subcategory_id)

### `menu_group_catalog`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| group_key | TEXT | ✅ |  |  |  |
| name | TEXT | ✅ |  |  |  |
| icon | TEXT | ✅ |  | ▦ |  |
| active | INTEGER | ✅ |  | 1 |  |
| sort_order | INTEGER | ✅ |  | 0 |  |
| collapsible | INTEGER | ✅ |  | 1 |  |
| system_locked | INTEGER | ✅ |  | 0 |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

### `module_catalog`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| module_key | TEXT | ✅ | ✅ |  |  |
| label | TEXT | ✅ |  |  |  |
| icon | TEXT | ✅ |  |  |  |
| group_name | TEXT |  |  |  |  |
| active | INTEGER | ✅ |  | 1 |  |
| sort_order | INTEGER | ✅ |  | 0 |  |
| system_locked | INTEGER | ✅ |  | 1 |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |
| group_key | TEXT |  |  |  |  |

### `official_correspondence`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| doc_no | TEXT | ✅ |  |  |  |
| direction | TEXT | ✅ |  |  |  |
| doc_type | TEXT | ✅ |  |  |  |
| issue_date | TEXT |  |  |  |  |
| sender_name | TEXT |  |  |  |  |
| receiver_name | TEXT |  |  |  |  |
| summary | TEXT |  |  |  |  |
| internal_handler | TEXT |  |  |  |  |
| status | TEXT | ✅ |  | received |  |
| result_note | TEXT |  |  |  |  |
| created_by | TEXT | ✅ |  |  |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- UNIQUE `official_correspondence_inline_unique` (doc_no)
- `idx_correspondence_status` (status)
- `idx_correspondence_date` (issue_date)

### `organization_units`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| code | TEXT | ✅ |  |  |  |
| name | TEXT | ✅ |  |  |  |
| unit_type | TEXT | ✅ |  |  |  |
| parent_id | TEXT |  |  |  |  |
| project_id | TEXT |  |  |  |  |
| description | TEXT |  |  |  |  |
| effective_from | TEXT |  |  |  |  |
| effective_to | TEXT |  |  |  |  |
| active | INTEGER | ✅ |  | 1 |  |
| archived_at | TEXT |  |  |  |  |
| sort_order | INTEGER | ✅ |  | 100 |  |
| system_locked | INTEGER | ✅ |  | 0 |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- UNIQUE `organization_units_name_uq` (lower(trim(name)
- `organization_units_parent_idx` (parent_id, active, sort_order)
- `organization_units_project_idx` (project_id, unit_type, active)

### `payment_plans`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| plan_no | TEXT | ✅ |  |  |  |
| project_id | TEXT | ✅ |  |  |  |
| contract_id | TEXT |  |  |  |  |
| po_id | TEXT |  |  |  |  |
| milestone | TEXT |  |  |  |  |
| planned_date | TEXT |  |  |  |  |
| planned_amount | REAL | ✅ |  | 0 |  |
| paid_amount | REAL | ✅ |  | 0 |  |
| status | TEXT | ✅ |  | planned |  |
| note | TEXT |  |  |  |  |
| created_by | TEXT | ✅ |  |  |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- UNIQUE `payment_plans_inline_unique` (plan_no)
- `idx_payment_plans_project` (project_id)
- `idx_payment_plans_status` (status)

### `procurement_allocations`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| project_id | TEXT | ✅ |  |  | projects(id) |
| contract_id | TEXT | ✅ |  |  | project_contracts(id) |
| boq_version_id | TEXT |  |  |  | boq_versions(id) |
| boq_item_id | TEXT |  |  |  | project_boq_items(id) |
| material_id | TEXT | ✅ |  |  | materials(id) |
| request_item_id | TEXT |  |  |  | material_request_items(id) |
| purchase_order_item_id | TEXT |  |  |  | purchase_order_items(id) |
| receipt_item_id | TEXT |  |  |  | goods_receipt_items(id) |
| stage | TEXT | ✅ |  |  |  |
| quantity | REAL | ✅ |  | 0 |  |
| reference_no | TEXT |  |  |  |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- `procurement_allocations_contract_boq_idx` (contract_id, boq_version_id, boq_item_id, stage)
- `procurement_allocations_trace_idx` (request_item_id, purchase_order_item_id, receipt_item_id)

### `production_reports`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| project_id | TEXT | ✅ |  |  | projects(id) |
| report_period | TEXT | ✅ |  |  |  |
| reference_no | TEXT |  |  |  |  |
| description | TEXT |  |  |  |  |
| planned_value | REAL | ✅ |  | 0 |  |
| actual_value | REAL | ✅ |  | 0 |  |
| approved_value | REAL | ✅ |  | 0 |  |
| status | TEXT | ✅ |  | submitted |  |
| submitted_by | TEXT |  |  |  | users(id) |
| approved_by | TEXT |  |  |  | users(id) |
| approved_at | TEXT |  |  |  |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- UNIQUE `production_reports_inline_unique` (project_id, report_period)
- `production_reports_project_period_idx` (project_id, report_period)

### `project_archives`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| project_id | TEXT | ✅ |  |  |  |
| project_code | TEXT | ✅ |  |  |  |
| project_name | TEXT | ✅ |  |  |  |
| file_name | TEXT | ✅ |  |  |  |
| sha256 | TEXT | ✅ |  |  |  |
| byte_size | INTEGER | ✅ |  | 0 |  |
| record_count | INTEGER | ✅ |  | 0 |  |
| attachment_count | INTEGER | ✅ |  | 0 |  |
| schema_version | TEXT | ✅ |  |  |  |
| status | TEXT | ✅ |  | verified |  |
| generated_by | TEXT | ✅ |  |  |  |
| generated_at | TEXT | ✅ |  |  |  |
| downloaded_at | TEXT |  |  |  |  |
| purged_at | TEXT |  |  |  |  |
| purge_audit_id | TEXT |  |  |  |  |

Indexes:
- `project_archives_project_idx` (project_id, generated_at)
- `project_archives_status_idx` (status, generated_at)

### `project_boq_items`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| project_id | TEXT | ✅ |  |  | projects(id) |
| line_no | INTEGER | ✅ |  |  |  |
| boq_code | TEXT |  |  |  |  |
| contract_code | TEXT |  |  |  |  |
| material_id | TEXT | ✅ |  |  | materials(id) |
| description | TEXT |  |  |  |  |
| contract_qty | REAL | ✅ |  | 0 |  |
| unit_price | REAL | ✅ |  | 0 |  |
| note | TEXT |  |  |  |  |
| active | INTEGER | ✅ |  | 1 |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |
| item_type | TEXT | ✅ |  | contract |  |
| remeasured_qty | REAL | ✅ |  | 0 |  |
| variation_status | TEXT | ✅ |  | none |  |
| variation_ref | TEXT |  |  |  |  |
| variation_approved_at | TEXT |  |  |  |  |
| contract_material_code | TEXT |  |  |  |  |
| approved_material_code | TEXT |  |  |  |  |
| source_order | INTEGER |  |  |  |  |
| contract_line_ref | TEXT |  |  |  |  |
| row_role | TEXT | ✅ |  | material |  |
| parent_source_order | INTEGER |  |  |  |  |
| outline_level | INTEGER | ✅ |  | 0 |  |
| source_sheet | TEXT |  |  |  |  |
| source_row | INTEGER |  |  |  |  |
| contract_id | TEXT |  |  |  | project_contracts(id) |
| boq_version_id | TEXT |  |  |  | boq_versions(id) |
| source_item_id | TEXT |  |  |  | boq_source_items(id) |

Indexes:
- `project_boq_line_uidx` (project_id, line_no)
- `project_boq_material_idx` (project_id, material_id)
- `project_boq_source_order_idx` (project_id, source_order)
- `project_boq_items_contract_version_idx` (project_id, contract_id, boq_version_id, source_order)

### `project_close_checks`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| project_id | TEXT | ✅ |  |  |  |
| check_key | TEXT | ✅ |  |  |  |
| status | TEXT | ✅ |  | pending |  |
| detail | TEXT |  |  |  |  |
| checked_by | TEXT |  |  |  |  |
| checked_at | TEXT |  |  |  |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- UNIQUE `project_close_checks_inline_unique` (project_id, check_key)

### `project_contracts`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| project_id | TEXT | ✅ |  |  | projects(id) |
| contract_no | TEXT | ✅ |  |  |  |
| contract_name | TEXT | ✅ |  |  |  |
| contract_type | TEXT | ✅ |  | main |  |
| parent_contract_id | TEXT |  |  |  | project_contracts(id) |
| status | TEXT | ✅ |  | active |  |
| is_primary | INTEGER | ✅ |  | 0 |  |
| signed_at | TEXT |  |  |  |  |
| effective_from | TEXT |  |  |  |  |
| effective_to | TEXT |  |  |  |  |
| note | TEXT |  |  |  |  |
| created_by | TEXT |  |  |  | users(id) |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- UNIQUE `project_contracts_inline_unique` (project_id, contract_no)
- `project_contracts_project_status_idx` (project_id, status, is_primary)

### `projects`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| code | TEXT | ✅ |  |  |  |
| name | TEXT | ✅ |  |  |  |
| status | TEXT | ✅ |  | active |  |
| manager_user_id | TEXT |  |  |  |  |
| start_date | TEXT |  |  |  |  |
| planned_end_date | TEXT |  |  |  |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |
| contract_no | TEXT |  |  |  |  |
| contract_name | TEXT |  |  |  |  |

Indexes:
- UNIQUE `projects_code_uidx` (code)

### `purchase_order_items`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| purchase_order_id | TEXT | ✅ |  |  |  |
| request_item_id | TEXT | ✅ |  |  |  |
| line_no | INTEGER | ✅ |  |  |  |
| ordered_qty | REAL | ✅ |  |  |  |
| unit_price | REAL | ✅ |  |  |  |
| received_qty | REAL | ✅ |  | 0 |  |
| status | TEXT | ✅ |  | ordered |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |
| system_code | TEXT |  |  |  |  |
| planned_delivery_at | TEXT |  |  |  |  |
| delivered_qty | REAL | ✅ |  | 0 |  |
| closed_qty | REAL | ✅ |  | 0 |  |
| close_reason | TEXT |  |  |  |  |
| closed_by | TEXT |  |  |  | users(id) |
| closed_at | TEXT |  |  |  |  |
| contract_id | TEXT |  |  |  | project_contracts(id) |
| boq_version_id | TEXT |  |  |  | boq_versions(id) |
| boq_item_id | TEXT |  |  |  | project_boq_items(id) |

Indexes:
- UNIQUE `purchase_order_items_line_uidx` (purchase_order_id, line_no)
- `purchase_order_items_request_idx` (request_item_id)
- `purchase_order_items_contract_boq_idx` (contract_id, boq_version_id, boq_item_id)

FK:
- `purchase_order_id` → `purchase_orders(id)`
- `request_item_id` → `material_request_items(id)`

### `purchase_orders`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| po_no | TEXT | ✅ |  |  |  |
| project_id | TEXT | ✅ |  |  |  |
| supplier_id | TEXT | ✅ |  |  |  |
| receiving_warehouse_id | TEXT | ✅ |  |  |  |
| buyer_user_id | TEXT | ✅ |  |  |  |
| ordered_at | TEXT | ✅ |  |  |  |
| eta | TEXT |  |  |  |  |
| status | TEXT | ✅ |  | draft |  |
| total_value | REAL | ✅ |  | 0 |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |
| request_id | TEXT |  |  |  |  |
| delivery_queued_at | TEXT |  |  |  |  |
| delivery_completed_at | TEXT |  |  |  |  |
| contract_id | TEXT |  |  |  | project_contracts(id) |
| boq_version_id | TEXT |  |  |  | boq_versions(id) |

Indexes:
- UNIQUE `purchase_orders_no_uidx` (po_no)
- `purchase_orders_project_status_idx` (project_id, status)
- `purchase_orders_eta_idx` (eta)

FK:
- `project_id` → `projects(id)`
- `supplier_id` → `suppliers(id)`
- `receiving_warehouse_id` → `warehouses(id)`
- `buyer_user_id` → `users(id)`

### `request_comments`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| request_id | TEXT | ✅ |  |  |  |
| user_id | TEXT | ✅ |  |  |  |
| comment | TEXT | ✅ |  |  |  |
| visibility | TEXT | ✅ |  | internal |  |
| created_at | TEXT | ✅ |  |  |  |

Indexes:
- `request_comments_request_idx` (request_id, created_at)

FK:
- `request_id` → `material_requests(id)`
- `user_id` → `users(id)`

### `role_catalog`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| code | TEXT | ✅ |  |  |  |
| name | TEXT | ✅ |  |  |  |
| description | TEXT |  |  |  |  |
| base_role | TEXT | ✅ |  | engineer |  |
| active | INTEGER | ✅ |  | 1 |  |
| sort_order | INTEGER | ✅ |  | 0 |  |
| system_locked | INTEGER | ✅ |  | 0 |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |
| business_group_id | TEXT |  |  |  |  |
| warehouse_scope_kind | TEXT |  |  |  |  |
| default_organization_unit_id | TEXT |  |  |  | organization_units(id) |

### `seal_management`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| seal_no | TEXT | ✅ |  |  |  |
| seal_name | TEXT | ✅ |  |  |  |
| seal_type | TEXT | ✅ |  |  |  |
| custodian | TEXT |  |  |  |  |
| registered_date | TEXT |  |  |  |  |
| status | TEXT | ✅ |  | active |  |
| usage_note | TEXT |  |  |  |  |
| created_by | TEXT | ✅ |  |  |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- UNIQUE `seal_management_inline_unique` (seal_no)

### `server_deployment_metadata`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| deployment_mode | TEXT | ✅ |  |  |  |
| database_engine | TEXT | ✅ |  |  |  |
| storage_mode | TEXT | ✅ |  |  |  |
| public_url | TEXT |  |  |  |  |
| node_name | TEXT |  |  |  |  |
| installed_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

### `sessions`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| user_id | TEXT | ✅ |  |  |  |
| token_hash | TEXT | ✅ |  |  |  |
| expires_at | TEXT | ✅ |  |  |  |
| ip_address | TEXT |  |  |  |  |
| user_agent | TEXT |  |  |  |  |
| created_at | TEXT | ✅ |  |  |  |
| last_seen_at | TEXT |  |  |  |  |

Indexes:
- UNIQUE `sessions_token_uidx` (token_hash)
- `sessions_user_idx` (user_id)

FK:
- `user_id` → `users(id)`

### `site_expense_claims`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| claim_no | TEXT | ✅ |  |  |  |
| project_id | TEXT | ✅ |  |  |  |
| cost_type | TEXT | ✅ |  |  |  |
| amount | REAL | ✅ |  | 0 |  |
| paid_by | TEXT |  |  |  |  |
| claim_date | TEXT |  |  |  |  |
| description | TEXT |  |  |  |  |
| voucher_attachment_id | TEXT |  |  |  |  |
| status | TEXT | ✅ |  | draft |  |
| approved_by | TEXT |  |  |  |  |
| approved_at | TEXT |  |  |  |  |
| created_by | TEXT | ✅ |  |  |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- UNIQUE `site_expense_claims_inline_unique` (claim_no)
- `idx_site_expense_project` (project_id)
- `idx_site_expense_status` (status)
- `idx_site_expense_type` (cost_type)

### `stock_count_items`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| stock_count_id | TEXT | ✅ |  |  |  |
| material_id | TEXT | ✅ |  |  |  |
| book_qty_snapshot | REAL | ✅ |  |  |  |
| actual_qty | REAL | ✅ |  |  |  |
| variance_qty | REAL | ✅ |  |  |  |
| reason | TEXT |  |  |  |  |
| approved_adjustment_qty | REAL | ✅ |  | 0 |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- UNIQUE `stock_count_items_uidx` (stock_count_id, material_id)

FK:
- `stock_count_id` → `stock_counts(id)`
- `material_id` → `materials(id)`

### `stock_counts`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| count_no | TEXT | ✅ |  |  |  |
| project_id | TEXT | ✅ |  |  |  |
| warehouse_id | TEXT | ✅ |  |  |  |
| count_type | TEXT | ✅ |  |  |  |
| counted_at | TEXT | ✅ |  |  |  |
| status | TEXT | ✅ |  | draft |  |
| approved_by | TEXT |  |  |  |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- UNIQUE `stock_counts_no_uidx` (count_no)
- `stock_counts_warehouse_date_idx` (warehouse_id, counted_at)

FK:
- `project_id` → `projects(id)`
- `warehouse_id` → `warehouses(id)`
- `approved_by` → `users(id)`

### `stock_issue_items`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| issue_id | TEXT | ✅ |  |  |  |
| material_id | TEXT | ✅ |  |  |  |
| request_item_id | TEXT |  |  |  |  |
| quantity | REAL | ✅ |  |  |  |
| installed_qty | REAL | ✅ |  | 0 |  |
| work_package_code | TEXT |  |  |  |  |
| installation_area | TEXT |  |  |  |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |
| contract_id | TEXT |  |  |  | project_contracts(id) |

Indexes:
- `stock_issue_items_issue_idx` (issue_id)
- `stock_issue_items_material_idx` (material_id)

FK:
- `issue_id` → `stock_issues(id)`
- `material_id` → `materials(id)`
- `request_item_id` → `material_request_items(id)`

### `stock_issues`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| issue_no | TEXT | ✅ |  |  |  |
| project_id | TEXT | ✅ |  |  |  |
| from_warehouse_id | TEXT | ✅ |  |  |  |
| team_id | TEXT | ✅ |  |  |  |
| request_id | TEXT |  |  |  |  |
| issued_by | TEXT | ✅ |  |  |  |
| received_by_name | TEXT | ✅ |  |  |  |
| approved_by | TEXT |  |  |  |  |
| issued_at | TEXT | ✅ |  |  |  |
| status | TEXT | ✅ |  | draft |  |
| signed_at | TEXT |  |  |  |  |
| note | TEXT |  |  |  |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- UNIQUE `stock_issues_no_uidx` (issue_no)
- `stock_issues_project_idx` (project_id, issued_at)
- `stock_issues_team_idx` (team_id, issued_at)

FK:
- `project_id` → `projects(id)`
- `from_warehouse_id` → `warehouses(id)`
- `team_id` → `teams(id)`
- `request_id` → `material_requests(id)`
- `issued_by` → `users(id)`
- `approved_by` → `users(id)`

### `stock_movements`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| project_id | TEXT | ✅ |  |  |  |
| material_id | TEXT | ✅ |  |  |  |
| from_warehouse_id | TEXT |  |  |  |  |
| to_warehouse_id | TEXT |  |  |  |  |
| movement_type | TEXT | ✅ |  |  |  |
| quantity | REAL | ✅ |  |  |  |
| unit_cost | REAL | ✅ |  | 0 |  |
| occurred_at | TEXT | ✅ |  |  |  |
| reference_type | TEXT | ✅ |  |  |  |
| reference_id | TEXT | ✅ |  |  |  |
| posted_by | TEXT | ✅ |  |  |  |
| reversal_of_id | TEXT |  |  |  |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |
| contract_id | TEXT |  |  |  | project_contracts(id) |
| destination_contract_id | TEXT |  |  |  | project_contracts(id) |

Indexes:
- `stock_movements_balance_idx` (project_id, material_id, to_warehouse_id)
- `stock_movements_reference_idx` (reference_type, reference_id)
- `stock_movements_date_idx` (occurred_at)
- `stock_movements_reference_idx` (reference_type, reference_id)
- `stock_movements_warehouse_material_idx` (from_warehouse_id, to_warehouse_id, material_id, occurred_at)

FK:
- `project_id` → `projects(id)`
- `material_id` → `materials(id)`
- `from_warehouse_id` → `warehouses(id)`
- `to_warehouse_id` → `warehouses(id)`
- `posted_by` → `users(id)`

### `stock_reservations`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| project_id | TEXT | ✅ |  |  |  |
| warehouse_id | TEXT | ✅ |  |  |  |
| material_id | TEXT | ✅ |  |  |  |
| request_id | TEXT |  |  |  |  |
| request_item_id | TEXT |  |  |  |  |
| quantity | REAL | ✅ |  |  |  |
| status | TEXT | ✅ |  | active |  |
| reserved_at | TEXT | ✅ |  |  |  |
| released_at | TEXT |  |  |  |  |
| created_by | TEXT | ✅ |  |  |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- `stock_reservation_balance_idx` (warehouse_id, material_id, status)
- `stock_reservation_request_idx` (request_id, request_item_id, status)

### `suppliers`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| code | TEXT | ✅ |  |  |  |
| name | TEXT | ✅ |  |  |  |
| tax_code | TEXT |  |  |  |  |
| contact_name | TEXT |  |  |  |  |
| phone | TEXT |  |  |  |  |
| lead_time_days | INTEGER | ✅ |  | 0 |  |
| rating | REAL | ✅ |  | 0 |  |
| active | INTEGER | ✅ |  | true |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- UNIQUE `suppliers_code_uidx` (code)

### `supply_workflow_steps`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| request_id | TEXT | ✅ |  |  |  |
| purchase_order_id | TEXT |  |  |  |  |
| receipt_id | TEXT |  |  |  |  |
| step | TEXT | ✅ |  |  |  |
| status | TEXT | ✅ |  | pending |  |
| queued_at | TEXT | ✅ |  |  |  |
| due_at | TEXT |  |  |  |  |
| completed_at | TEXT |  |  |  |  |
| completed_by | TEXT |  |  |  |  |
| comment | TEXT |  |  |  |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- `supply_workflow_request_idx` (request_id, step, queued_at)
- `supply_workflow_status_idx` (status, due_at)

FK:
- `request_id` → `material_requests(id)`
- `purchase_order_id` → `purchase_orders(id)`
- `receipt_id` → `goods_receipts(id)`
- `completed_by` → `users(id)`

### `task_notifications`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| work_item_id | TEXT | ✅ |  |  |  |
| user_id | TEXT | ✅ |  |  |  |
| channel | TEXT | ✅ |  | in_app |  |
| title | TEXT | ✅ |  |  |  |
| body | TEXT | ✅ |  |  |  |
| status | TEXT | ✅ |  | PENDING |  |
| read_at | TEXT |  |  |  |  |
| sent_at | TEXT |  |  |  |  |
| last_error | TEXT |  |  |  |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- `task_notifications_user_idx` (user_id, read_at, created_at)

### `task_sla_policies`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| department_code | TEXT | ✅ | ✅ |  |  |
| status | TEXT | ✅ | ✅ |  |  |
| responsibility_clock_runs | INTEGER | ✅ |  | 1 |  |
| process_clock_runs | INTEGER | ✅ |  | 1 |  |
| requires_reason | INTEGER | ✅ |  | 0 |  |
| updated_at | TEXT | ✅ |  |  |  |

### `team_payments`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| project_id | TEXT | ✅ |  |  | projects(id) |
| team_id | TEXT | ✅ |  |  | teams(id) |
| subcontract_id | TEXT | ✅ |  |  | team_subcontracts(id) |
| production_record_id | TEXT |  |  |  | team_production_records(id) |
| payment_date | TEXT | ✅ |  |  |  |
| payment_type | TEXT | ✅ |  | progress |  |
| reference_no | TEXT |  |  |  |  |
| description | TEXT | ✅ |  |  |  |
| amount | REAL | ✅ |  | 0 |  |
| note | TEXT |  |  |  |  |
| created_by | TEXT |  |  |  | users(id) |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- `team_payments_subcontract_idx` (subcontract_id, payment_date)

### `team_production_records`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| project_id | TEXT | ✅ |  |  | projects(id) |
| team_id | TEXT | ✅ |  |  | teams(id) |
| subcontract_id | TEXT | ✅ |  |  | team_subcontracts(id) |
| period_key | TEXT | ✅ |  |  |  |
| reference_no | TEXT |  |  |  |  |
| description | TEXT |  |  |  |  |
| submitted_value | REAL | ✅ |  | 0 |  |
| approved_value | REAL | ✅ |  | 0 |  |
| status | TEXT | ✅ |  | submitted |  |
| submitted_by | TEXT |  |  |  | users(id) |
| approved_by | TEXT |  |  |  | users(id) |
| approved_at | TEXT |  |  |  |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- UNIQUE `team_production_records_inline_unique` (subcontract_id, period_key)
- `team_production_project_idx` (project_id, team_id, period_key)

### `team_settlements`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| project_id | TEXT | ✅ |  |  | projects(id) |
| team_id | TEXT | ✅ |  |  | teams(id) |
| subcontract_id | TEXT | ✅ |  |  | team_subcontracts(id) |
| settlement_no | TEXT | ✅ |  |  |  |
| approved_production_value | REAL | ✅ |  | 0 |  |
| adjustment_value | REAL | ✅ |  | 0 |  |
| final_value | REAL | ✅ |  | 0 |  |
| paid_value | REAL | ✅ |  | 0 |  |
| remaining_value | REAL | ✅ |  | 0 |  |
| status | TEXT | ✅ |  | draft |  |
| settled_at | TEXT |  |  |  |  |
| note | TEXT |  |  |  |  |
| created_by | TEXT |  |  |  | users(id) |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- UNIQUE `team_settlements_inline_unique` (subcontract_id, settlement_no)
- `team_settlements_subcontract_idx` (subcontract_id, status)

### `team_subcontracts`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| project_id | TEXT | ✅ |  |  | projects(id) |
| team_id | TEXT | ✅ |  |  | teams(id) |
| contract_no | TEXT | ✅ |  |  |  |
| contract_name | TEXT | ✅ |  |  |  |
| scope_text | TEXT |  |  |  |  |
| contract_value | REAL | ✅ |  | 0 |  |
| start_date | TEXT |  |  |  |  |
| end_date | TEXT |  |  |  |  |
| status | TEXT | ✅ |  | draft |  |
| signed_at | TEXT |  |  |  |  |
| note | TEXT |  |  |  |  |
| created_by | TEXT |  |  |  | users(id) |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- UNIQUE `team_subcontracts_inline_unique` (project_id, contract_no)
- `team_subcontracts_team_idx` (team_id, status)

### `teams`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| code | TEXT | ✅ |  |  |  |
| name | TEXT | ✅ |  |  |  |
| trade | TEXT | ✅ |  |  |  |
| project_id | TEXT | ✅ |  |  |  |
| warehouse_id | TEXT | ✅ |  |  |  |
| leader_user_id | TEXT |  |  |  |  |
| active | INTEGER | ✅ |  | true |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- UNIQUE `teams_code_uidx` (code)
- `teams_project_idx` (project_id)
- `teams_project_active_idx` (project_id, active)

FK:
- `project_id` → `projects(id)`
- `warehouse_id` → `warehouses(id)`
- `leader_user_id` → `users(id)`

### `transfer_order_items`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| transfer_order_id | TEXT | ✅ |  |  |  |
| material_id | TEXT | ✅ |  |  |  |
| requested_qty | REAL | ✅ |  |  |  |
| approved_qty | REAL | ✅ |  | 0 |  |
| shipped_qty | REAL | ✅ |  | 0 |  |
| received_qty | REAL | ✅ |  | 0 |  |
| rejected_qty | REAL | ✅ |  | 0 |  |
| lost_qty | REAL | ✅ |  | 0 |  |
| note | TEXT |  |  |  |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |
| source_contract_id | TEXT |  |  |  | project_contracts(id) |
| destination_contract_id | TEXT |  |  |  | project_contracts(id) |

Indexes:
- `transfer_order_items_order_idx` (transfer_order_id, material_id)

### `transfer_orders`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| transfer_no | TEXT | ✅ |  |  |  |
| source_warehouse_id | TEXT | ✅ |  |  |  |
| destination_warehouse_id | TEXT | ✅ |  |  |  |
| source_project_id | TEXT |  |  |  |  |
| destination_project_id | TEXT |  |  |  |  |
| transit_warehouse_id | TEXT | ✅ |  |  |  |
| requested_by | TEXT | ✅ |  |  |  |
| requested_at | TEXT | ✅ |  |  |  |
| approved_by | TEXT |  |  |  |  |
| approved_at | TEXT |  |  |  |  |
| shipped_by | TEXT |  |  |  |  |
| shipped_at | TEXT |  |  |  |  |
| received_by | TEXT |  |  |  |  |
| received_at | TEXT |  |  |  |  |
| status | TEXT | ✅ |  | requested |  |
| reason | TEXT |  |  |  |  |
| note | TEXT |  |  |  |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- UNIQUE `transfer_orders_inline_unique` (transfer_no)
- `transfer_orders_status_idx` (status, requested_at)
- `transfer_orders_source_idx` (source_warehouse_id, status)
- `transfer_orders_destination_idx` (destination_warehouse_id, status)

### `ui_display_settings`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT |  | ✅ |  |  |
| scope_key | TEXT | ✅ |  |  |  |
| settings_json | TEXT | ✅ |  |  |  |
| updated_by | TEXT |  |  |  |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

### `user_module_permissions`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| user_id | TEXT | ✅ |  |  | users(id) |
| module_key | TEXT | ✅ |  |  |  |
| can_view | INTEGER | ✅ |  | 0 |  |
| can_use | INTEGER | ✅ |  | 0 |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |
| can_create | INTEGER | ✅ |  | 0 |  |
| can_edit | INTEGER | ✅ |  | 0 |  |
| can_approve | INTEGER | ✅ |  | 0 |  |
| can_export | INTEGER | ✅ |  | 0 |  |
| permission_expires_at | TEXT |  |  |  |  |
| permission_source | TEXT | ✅ |  | manual_override |  |

Indexes:
- UNIQUE `user_module_permission_uidx` (user_id, module_key)

### `user_project_scopes`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| user_id | TEXT | ✅ |  |  |  |
| project_id | TEXT | ✅ |  |  |  |
| permission | TEXT | ✅ |  | read |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- UNIQUE `user_project_scope_uidx` (user_id, project_id)

FK:
- `user_id` → `users(id)`
- `project_id` → `projects(id)`

### `user_warehouse_scopes`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| user_id | TEXT | ✅ |  |  |  |
| warehouse_id | TEXT | ✅ |  |  |  |
| permission | TEXT | ✅ |  | read |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- UNIQUE `user_warehouse_scopes_inline_unique` (user_id, warehouse_id)
- `user_warehouse_scope_user_idx` (user_id)

### `users`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| employee_code | TEXT | ✅ |  |  |  |
| full_name | TEXT | ✅ |  |  |  |
| username | TEXT | ✅ |  |  |  |
| password_hash | TEXT |  |  |  |  |
| role | TEXT | ✅ |  |  |  |
| department | TEXT | ✅ |  |  |  |
| approval_limit | REAL | ✅ |  | 0 |  |
| active | INTEGER | ✅ |  | true |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |
| email | TEXT |  |  |  |  |
| avatar_url | TEXT |  |  |  |  |
| organization_unit_id | TEXT |  |  |  |  |
| must_change_password | INTEGER | ✅ |  | 0 |  |
| password_reset_at | TEXT |  |  |  |  |
| password_reset_by | TEXT |  |  |  |  |

Indexes:
- UNIQUE `users_employee_code_uidx` (employee_code)
- UNIQUE `users_username_uidx` (username)
- UNIQUE `users_email_uidx` (email)

### `vntech_attestation_events`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| license_id | TEXT |  |  |  |  |
| machine_fingerprint | TEXT |  |  |  |  |
| request_nonce | TEXT |  |  |  |  |
| server_response_json | TEXT |  |  |  |  |
| status | TEXT | ✅ |  |  |  |
| attempted_at | TEXT | ✅ |  |  |  |
| next_attempt_at | TEXT |  |  |  |  |
| error_message | TEXT |  |  |  |  |

### `vntech_license_installations`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| license_id | TEXT | ✅ |  |  |  |
| tenant_id | TEXT | ✅ |  |  |  |
| company_code | TEXT | ✅ |  |  |  |
| product_id | TEXT | ✅ |  |  |  |
| key_id | TEXT | ✅ |  |  |  |
| payload_json | TEXT | ✅ |  |  |  |
| signature_base64 | TEXT | ✅ |  |  |  |
| status | TEXT | ✅ |  |  |  |
| valid_from | TEXT |  |  |  |  |
| valid_until | TEXT |  |  |  |  |
| machine_fingerprint | TEXT |  |  |  |  |
| verification_detail_json | TEXT |  |  |  |  |
| installed_by | TEXT |  |  |  |  |
| installed_at | TEXT | ✅ |  |  |  |
| last_verified_at | TEXT |  |  |  |  |
| revoked_at | TEXT |  |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- `vntech_license_status_idx` (status, valid_until)

### `vntech_license_transfer_requests`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| license_id | TEXT |  |  |  |  |
| source_machine_fingerprint | TEXT |  |  |  |  |
| destination_machine_fingerprint | TEXT |  |  |  |  |
| recovery_code_hash | TEXT |  |  |  |  |
| reason | TEXT | ✅ |  |  |  |
| status | TEXT | ✅ |  | requested |  |
| requested_by | TEXT |  |  |  |  |
| requested_at | TEXT | ✅ |  |  |  |
| approved_at | TEXT |  |  |  |  |
| completed_at | TEXT |  |  |  |  |
| detail_json | TEXT |  |  |  |  |

### `vntech_product_identity`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| legal_owner | TEXT | ✅ |  |  |  |
| product_name | TEXT | ✅ |  |  |  |
| product_description | TEXT | ✅ |  |  |  |
| version | TEXT | ✅ |  |  |  |
| source_fingerprint | TEXT | ✅ |  |  |  |
| source_fingerprint_short | TEXT | ✅ |  |  |  |
| created_at | TEXT | ✅ |  |  |  |

### `vntech_release_signatures`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| release_fingerprint | TEXT | ✅ |  |  |  |
| manifest_sha256 | TEXT | ✅ |  |  |  |
| key_id | TEXT | ✅ |  |  |  |
| signature_base64 | TEXT |  |  |  |  |
| verification_status | TEXT | ✅ |  | unsigned_development |  |
| verified_at | TEXT |  |  |  |  |
| created_at | TEXT | ✅ |  |  |  |

### `vntech_trust_audit`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| event_type | TEXT | ✅ |  |  |  |
| actor_user_id | TEXT |  |  |  |  |
| trust_mode | TEXT | ✅ |  |  |  |
| enforcement_enabled | INTEGER | ✅ |  |  |  |
| license_id | TEXT |  |  |  |  |
| machine_fingerprint | TEXT |  |  |  |  |
| detail_json | TEXT |  |  |  |  |
| occurred_at | TEXT | ✅ |  |  |  |

### `vntech_trust_settings`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| trust_mode | TEXT | ✅ |  | development |  |
| enforcement_enabled | INTEGER | ✅ |  | 0 |  |
| tenant_id | TEXT | ✅ |  |  |  |
| company_code | TEXT | ✅ |  |  |  |
| key_id | TEXT | ✅ |  |  |  |
| algorithm | TEXT | ✅ |  |  |  |
| public_key_pem | TEXT | ✅ |  |  |  |
| brand_fingerprint | TEXT | ✅ |  |  |  |
| release_fingerprint | TEXT | ✅ |  |  |  |
| machine_fingerprint | TEXT |  |  |  |  |
| hardware_binding_mode | TEXT | ✅ |  | foundation |  |
| native_verifier_mode | TEXT | ✅ |  | foundation |  |
| online_attestation_enabled | INTEGER | ✅ |  | 0 |  |
| license_server_url | TEXT |  |  |  |  |
| last_attested_at | TEXT |  |  |  |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

### `warehouse_locations`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| warehouse_id | TEXT | ✅ |  |  |  |
| code | TEXT | ✅ |  |  |  |
| name | TEXT | ✅ |  |  |  |
| location_type | TEXT | ✅ |  | bin |  |
| secure | INTEGER | ✅ |  | 0 |  |
| active | INTEGER | ✅ |  | 1 |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- UNIQUE `warehouse_locations_inline_unique` (warehouse_id, code)

### `warehouses`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| code | TEXT | ✅ |  |  |  |
| name | TEXT | ✅ |  |  |  |
| type | TEXT | ✅ |  |  |  |
| project_id | TEXT |  |  |  |  |
| parent_warehouse_id | TEXT |  |  |  |  |
| keeper_user_id | TEXT |  |  |  |  |
| active | INTEGER | ✅ |  | true |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- UNIQUE `warehouses_code_uidx` (code)
- `warehouses_project_idx` (project_id)

FK:
- `project_id` → `projects(id)`
- `keeper_user_id` → `users(id)`

### `work_item_events`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| work_item_id | TEXT | ✅ |  |  |  |
| event_type | TEXT | ✅ |  |  |  |
| from_status | TEXT |  |  |  |  |
| to_status | TEXT |  |  |  |  |
| actor_user_id | TEXT | ✅ |  |  |  |
| previous_assignee | TEXT |  |  |  |  |
| new_assignee | TEXT |  |  |  |  |
| reason | TEXT |  |  |  |  |
| detail_json | TEXT |  |  |  |  |
| occurred_at | TEXT | ✅ |  |  |  |
| created_at | TEXT | ✅ |  |  |  |

Indexes:
- `work_item_events_task_idx` (work_item_id, occurred_at)

### `work_items`

| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |
|---|---|---|---|---|---|
| id | TEXT | ✅ | ✅ |  |  |
| task_no | TEXT | ✅ |  |  |  |
| department_code | TEXT | ✅ |  |  |  |
| work_group | TEXT | ✅ |  |  |  |
| title | TEXT | ✅ |  |  |  |
| description | TEXT |  |  |  |  |
| project_id | TEXT |  |  |  |  |
| source_module | TEXT |  |  |  |  |
| source_type | TEXT |  |  |  |  |
| source_id | TEXT |  |  |  |  |
| source_no | TEXT |  |  |  |  |
| work_step | TEXT | ✅ |  |  |  |
| dedupe_key | TEXT | ✅ |  |  |  |
| task_origin | TEXT | ✅ |  | manual |  |
| assigned_to | TEXT | ✅ |  |  |  |
| assigned_by | TEXT | ✅ |  |  |  |
| assigned_at | TEXT | ✅ |  |  |  |
| due_at | TEXT |  |  |  |  |
| priority | TEXT | ✅ |  | normal |  |
| status | TEXT | ✅ |  | NEW |  |
| progress | INTEGER | ✅ |  | 0 |  |
| required_output | TEXT |  |  |  |  |
| waiting_reason | TEXT |  |  |  |  |
| waiting_started_at | TEXT |  |  |  |  |
| submitted_at | TEXT |  |  |  |  |
| completed_at | TEXT |  |  |  |  |
| completed_by | TEXT |  |  |  |  |
| cancelled_at | TEXT |  |  |  |  |
| cancelled_by | TEXT |  |  |  |  |
| active | INTEGER | ✅ |  | 1 |  |
| created_at | TEXT | ✅ |  |  |  |
| updated_at | TEXT | ✅ |  |  |  |

Indexes:
- UNIQUE `work_items_inline_unique` (task_no)
- UNIQUE `work_items_inline_unique` (dedupe_key)
- `work_items_department_idx` (department_code, status, assigned_to, due_at)
- `work_items_project_idx` (project_id, department_code, status)
- `work_items_source_idx` (source_type, source_id, work_step)
