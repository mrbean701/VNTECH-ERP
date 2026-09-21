# ACTION CATALOG — VNTECH ERP (backend Java mục tiêu)

- Nguồn: `scripts/system-route.mjs` (monolith JS — reference implementation, branch `unity`)
- Tổng action: **182** (write dispatcher + reserved)
- Cột `migrated` = false: action chưa được port sang Java (Strangler Fig — gateway sẽ proxy sang JS legacy).

## Theo module

### (unassigned) (67)

- `approve_po` — 
- `approve_team_production` — 
- `bulk_import_projects` — 
- `bulk_import_users` — 
- `change_password` — 
- `create_project` — 
- `create_project_team` — 
- `create_user` — 
- `delete_approval_stage` — 
- `delete_business_role_group` — 
- `delete_business_scope` — 
- `delete_form_field_config` — 
- `delete_material_category` — 
- `delete_material_subcategory` — 
- `delete_menu_group` — 
- `delete_project` — 
- `delete_project_team` — 
- `delete_role_catalog` — 
- `delete_user` — 
- `delete_user_module_override` — 
- `import_material_catalog` — 
- `install_license_foundation` — 
- `login` — 
- `logout` — 
- `reject_po` — 
- `reorder_form_fields` — 
- `reorder_menu_layout` — 
- `request_license_transfer` — 
- `reset_user_password` — 
- `retry_email` — 
- `revoke_session` — 
- `revoke_user_sessions` — 
- `save_approval_stage` — 
- `save_business_role_group` — 
- `save_business_scope` — 
- `save_email_settings` — 
- `save_engine_role_profile` — 
- `save_form_field_config` — 
- `save_material_category` — 
- `save_material_subcategory` — 
- `save_menu_group` — 
- `save_module_catalog` — 
- `save_organization_unit` — 
- `save_role_catalog` — 
- `save_team_payment` — 
- `save_team_production` — 
- `save_team_subcontract` — 
- `save_trust_development_settings` — 
- `save_ui_display_settings` — 
- `save_user_access` — 
- `set_approval_stage_status` — 
- `set_business_role_group_status` — 
- `set_business_scope_status` — 
- `set_material_category_status` — 
- `set_material_subcategory_status` — 
- `set_menu_group_status` — 
- `set_module_status` — 
- `set_organization_unit_status` — 
- `set_project_team_status` — 
- `set_role_status` — 
- `set_user_status` — 
- `settle_team_subcontract` — 
- `setup` — 
- `update_po_price` — 
- `update_profile_avatar` — 
- `update_project` — 
- `update_user` — 

### admin (3)

- `factory_reset_execute` — canEdit
- `factory_reset_preview` — canView
- `set_project_status` — canEdit

### approvals (1)

- `decide_approval` — canApprove

### boq (15)

- `bulk_boq_item_action` — canEdit
- `clear_boq_version` — canEdit
- `compare_boq_materials` — canUse
- `confirm_boq_material_mappings` — canApprove
- `delete_boq_item` — canEdit
- `delete_project_contract` — canEdit
- `replace_boq_items` — canEdit
- `request_material_master_from_boq` — canCreate
- `save_boq_item` — canEdit
- `save_boq_version` — canEdit
- `save_mar_approval` — canApprove
- `save_project_contract` — canEdit
- `set_boq_item_status` — canEdit
- `set_project_contract_status` — canEdit
- `update_boq_contract_prices` — canEdit

### capital_recovery (2)

- `delete_capital_recovery` — canEdit
- `save_capital_recovery` — canCreate

### central_warehouse (4)

- `approve_central_return` — canApprove
- `create_central_return` — canCreate
- `receive_central_return` — canApprove
- `save_warehouse_location` — canEdit

### construction (3)

- `approve_construction_daily_log` — canApprove
- `delete_construction_daily_log` — canEdit
- `save_construction_daily_log` — canCreate

### dept_finance_advance (3)

- `delete_advance_request` — canEdit
- `save_advance_request` — canCreate
- `settle_advance_request` — canApprove

### dept_finance_cashbank (3)

- `delete_cashbook_entry` — canEdit
- `save_bank_account` — canCreate
- `save_cashbook_entry` — canCreate

### dept_finance_documents (2)

- `delete_accounting_voucher` — canEdit
- `save_accounting_voucher` — canCreate

### dept_finance_payment_plan (3)

- `delete_payment_plan` — canEdit
- `save_payment_plan` — canCreate
- `set_payment_plan_status` — canEdit

### dept_finance_site_cost (3)

- `approve_site_expense_claim` — canApprove
- `delete_site_expense_claim` — canEdit
- `save_site_expense_claim` — canCreate

### dept_legal_benefits (3)

- `delete_benefit_record` — canEdit
- `save_benefit_record` — canCreate
- `set_benefit_record_status` — canEdit

### dept_legal_correspondence (3)

- `delete_correspondence` — canEdit
- `save_correspondence` — canCreate
- `set_correspondence_status` — canEdit

### dept_legal_documents (3)

- `delete_legal_document` — canEdit
- `save_legal_document` — canCreate
- `set_legal_document_status` — canEdit

### dept_legal_hr (1)

- `save_hr_record` — canCreate

### dept_legal_labor (3)

- `delete_labor_contract` — canEdit
- `save_labor_contract` — canCreate
- `set_labor_contract_status` — canEdit

### dept_legal_seal (3)

- `delete_seal` — canEdit
- `save_seal` — canCreate
- `set_seal_status` — canEdit

### dept_plan_assign (5)

- `add_work_item_comment` — canUse
- `create_work_item` — canCreate
- `reassign_work_item` — canEdit
- `set_work_item_participant` — canEdit
- `update_work_item_status` — canEdit

### dept_plan_tasks (4)

- `add_work_item_comment` — canUse
- `mark_task_notification_read` — canView
- `update_work_item_progress` — canEdit
- `update_work_item_status` — canEdit

### dept_project_assign (5)

- `add_work_item_comment` — canUse
- `create_work_item` — canCreate
- `reassign_work_item` — canEdit
- `set_work_item_participant` — canEdit
- `update_work_item_status` — canEdit

### dept_project_tasks (4)

- `add_work_item_comment` — canUse
- `mark_task_notification_read` — canView
- `update_work_item_progress` — canEdit
- `update_work_item_status` — canEdit

### inventory (8)

- `approve_transfer_order` — canApprove
- `create_transfer_order` — canCreate
- `receive_transfer_order` — canApprove
- `reconcile_contract_stock` — canApprove
- `reverse_stock_movement` — canApprove
- `save_warehouse_location` — canEdit
- `ship_transfer_order` — canEdit
- `transfer_contract_ownership` — canApprove

### material_catalog (15)

- `bulk_material_subcategory_action` — canEdit
- `check_material_alias_conflicts` — canView
- `compare_boq_materials` — canUse
- `confirm_boq_material_mappings` — canApprove
- `delete_material` — canEdit
- `delete_selected_materials` — canEdit
- `delete_unused_materials` — canEdit
- `merge_material_master` — canEdit
- `preview_material_dependencies` — canView
- `request_material_master_from_boq` — canCreate
- `reset_material_catalog_test` — canEdit
- `save_material` — canEdit
- `save_material_external_code` — canEdit
- `save_material_uom_conversion` — canEdit
- `set_material_status` — canEdit

### material_norms (4)

- `delete_material_norm` — canEdit
- `estimate_material_norms` — canUse
- `save_material_norm` — canCreate
- `set_material_norm_status` — canEdit

### payments (3)

- `delete_contract_payment` — canEdit
- `import_contract_payments` — canCreate
- `save_contract_payment` — canCreate

### production (2)

- `approve_production_report` — canApprove
- `save_production_report` — canCreate

### purchasing (3)

- `close_po_line` — canApprove
- `create_po` — canCreate
- `save_mar_approval` — canApprove

### receiving (2)

- `confirm_delivery` — canApprove
- `receive_goods` — canCreate

### requests (6)

- `cancel_request` — canEdit
- `create_request` — canCreate
- `delete_request` — canEdit
- `preview_request_import` — canCreate
- `resubmit_request` — canEdit
- `update_returned_request` — canEdit

### site_command (1)

- `set_organization_unit_member` — canEdit

### stocktake (4)

- `approve_stock_count` — canApprove
- `create_stock_count` — canCreate
- `return_stock` — canCreate
- `reverse_stock_movement` — canApprove

### supplier_catalog (6)

- `delete_partner` — canEdit
- `delete_supplier` — canEdit
- `save_partner` — canEdit
- `save_supplier` — canEdit
- `set_partner_status` — canEdit
- `set_supplier_status` — canEdit

### teams (3)

- `confirm_installation` — canEdit
- `issue_stock` — canCreate
- `return_stock` — canCreate

### warehouse_issue (1)

- `issue_stock` — canCreate

### warehouse_receipt (2)

- `confirm_delivery` — canApprove
- `receive_goods` — canCreate

## Toàn bộ (bảng)

| action | module | capability | dispatcher | migrated |
|---|---|---|---|---|
| add_work_item_comment | dept_plan_tasks, dept_project_tasks, dept_plan_assign, dept_project_assign | canUse | ✅ |  |
| approve_central_return | central_warehouse | canApprove | ✅ | ✅ |
| approve_construction_daily_log | construction | canApprove | ✅ | ✅ |
| approve_po |  |  | ✅ |  |
| approve_production_report | production | canApprove | ✅ | ✅ |
| approve_site_expense_claim | dept_finance_site_cost | canApprove | ✅ | ✅ |
| approve_stock_count | stocktake | canApprove | ✅ | ✅ |
| approve_team_production |  |  | ✅ | ✅ |
| approve_transfer_order | inventory | canApprove | ✅ | ✅ |
| bulk_boq_item_action | boq | canEdit | ✅ | ✅ |
| bulk_import_projects |  |  | ✅ | ✅ |
| bulk_import_users |  |  | ✅ | ✅ |
| bulk_material_subcategory_action | material_catalog | canEdit | ✅ | ✅ |
| cancel_request | requests | canEdit | ✅ | ✅ |
| change_password |  |  | ✅ | ✅ |
| check_material_alias_conflicts | material_catalog | canView | ✅ | ✅ |
| clear_boq_version | boq | canEdit | ✅ | ✅ |
| close_po_line | purchasing | canApprove | ✅ | ✅ |
| compare_boq_materials | material_catalog, boq | canUse | ✅ | ✅ |
| confirm_boq_material_mappings | material_catalog, boq | canApprove | ✅ | ✅ |
| confirm_delivery | receiving, warehouse_receipt | canApprove | ✅ | ✅ |
| confirm_installation | teams | canEdit | ✅ | ✅ |
| create_central_return | central_warehouse | canCreate | ✅ | ✅ |
| create_po | purchasing | canCreate | ✅ | ✅ |
| create_project |  |  | ✅ | ✅ |
| create_project_team |  |  | ✅ | ✅ |
| create_request | requests | canCreate | ✅ | ✅ |
| create_stock_count | stocktake | canCreate | ✅ | ✅ |
| create_transfer_order | inventory | canCreate | ✅ | ✅ |
| create_user |  |  | ✅ | ✅ |
| create_work_item | dept_plan_assign, dept_project_assign | canCreate | ✅ | ✅ |
| decide_approval | approvals | canApprove | ✅ | ✅ |
| delete_accounting_voucher | dept_finance_documents | canEdit | ✅ | ✅ |
| delete_advance_request | dept_finance_advance | canEdit | ✅ | ✅ |
| delete_approval_stage |  |  | ✅ | ✅ |
| delete_benefit_record | dept_legal_benefits | canEdit | ✅ | ✅ |
| delete_boq_item | boq | canEdit | ✅ | ✅ |
| delete_business_role_group |  |  | ✅ | ✅ |
| delete_business_scope |  |  | ✅ | ✅ |
| delete_capital_recovery | capital_recovery | canEdit | ✅ | ✅ |
| delete_cashbook_entry | dept_finance_cashbank | canEdit | ✅ | ✅ |
| delete_construction_daily_log | construction | canEdit | ✅ | ✅ |
| delete_contract_payment | payments | canEdit | ✅ | ✅ |
| delete_correspondence | dept_legal_correspondence | canEdit | ✅ | ✅ |
| delete_form_field_config |  |  | ✅ | ✅ |
| delete_labor_contract | dept_legal_labor | canEdit | ✅ | ✅ |
| delete_legal_document | dept_legal_documents | canEdit | ✅ | ✅ |
| delete_material | material_catalog | canEdit | ✅ | ✅ |
| delete_material_category |  |  | ✅ | ✅ |
| delete_material_norm | material_norms | canEdit | ✅ | ✅ |
| delete_material_subcategory |  |  | ✅ | ✅ |
| delete_menu_group |  |  | ✅ | ✅ |
| delete_partner | supplier_catalog | canEdit | ✅ |  |
| delete_payment_plan | dept_finance_payment_plan | canEdit | ✅ | ✅ |
| delete_project |  |  | ✅ | ✅ |
| delete_project_contract | boq | canEdit | ✅ | ✅ |
| delete_project_team |  |  | ✅ | ✅ |
| delete_request | requests | canEdit | ✅ | ✅ |
| delete_role_catalog |  |  | ✅ | ✅ |
| delete_seal | dept_legal_seal | canEdit | ✅ | ✅ |
| delete_selected_materials | material_catalog | canEdit | ✅ | ✅ |
| delete_site_expense_claim | dept_finance_site_cost | canEdit | ✅ | ✅ |
| delete_supplier | supplier_catalog | canEdit | ✅ | ✅ |
| delete_unused_materials | material_catalog | canEdit | ✅ | ✅ |
| delete_user |  |  | ✅ | ✅ |
| delete_user_module_override |  |  | ✅ | ✅ |
| estimate_material_norms | material_norms | canUse | ✅ | ✅ |
| factory_reset_execute | admin | canEdit | ✅ | ✅ |
| factory_reset_preview | admin | canView | ✅ | ✅ |
| import_contract_payments | payments | canCreate | ✅ | ✅ |
| import_material_catalog |  |  | ✅ | ✅ |
| install_license_foundation |  |  | ✅ | ✅ |
| issue_stock | teams, warehouse_issue | canCreate | ✅ | ✅ |
| login |  |  | ✅ | ✅ |
| logout |  |  | ✅ | ✅ |
| mark_task_notification_read | dept_plan_tasks, dept_project_tasks | canView | ✅ | ✅ |
| merge_material_master | material_catalog | canEdit | ✅ | ✅ |
| preview_material_dependencies | material_catalog | canView | ✅ | ✅ |
| preview_request_import | requests | canCreate | ✅ | ✅ |
| reassign_work_item | dept_plan_assign, dept_project_assign | canEdit | ✅ | ✅ |
| receive_central_return | central_warehouse | canApprove | ✅ | ✅ |
| receive_goods | receiving, warehouse_receipt | canCreate | ✅ | ✅ |
| receive_transfer_order | inventory | canApprove | ✅ | ✅ |
| reconcile_contract_stock | inventory | canApprove | ✅ | ✅ |
| reject_po |  |  | ✅ |  |
| reorder_form_fields |  |  | ✅ | ✅ |
| reorder_menu_layout |  |  | ✅ | ✅ |
| replace_boq_items | boq | canEdit | ✅ | ✅ |
| request_license_transfer |  |  | ✅ | ✅ |
| request_material_master_from_boq | material_catalog, boq | canCreate | ✅ | ✅ |
| reset_material_catalog_test | material_catalog | canEdit | ✅ | ✅ |
| reset_user_password |  |  | ✅ | ✅ |
| resubmit_request | requests | canEdit | ✅ | ✅ |
| retry_email |  |  | ✅ | ✅ |
| return_stock | teams, stocktake | canCreate | ✅ | ✅ |
| reverse_stock_movement | inventory, stocktake | canApprove | ✅ | ✅ |
| revoke_session |  |  | ✅ | ✅ |
| revoke_user_sessions |  |  | ✅ | ✅ |
| save_accounting_voucher | dept_finance_documents | canCreate | ✅ | ✅ |
| save_advance_request | dept_finance_advance | canCreate | ✅ | ✅ |
| save_approval_stage |  |  | ✅ | ✅ |
| save_bank_account | dept_finance_cashbank | canCreate | ✅ | ✅ |
| save_benefit_record | dept_legal_benefits | canCreate | ✅ | ✅ |
| save_boq_item | boq | canEdit | ✅ | ✅ |
| save_boq_version | boq | canEdit | ✅ | ✅ |
| save_business_role_group |  |  | ✅ | ✅ |
| save_business_scope |  |  | ✅ | ✅ |
| save_capital_recovery | capital_recovery | canCreate | ✅ | ✅ |
| save_cashbook_entry | dept_finance_cashbank | canCreate | ✅ | ✅ |
| save_construction_daily_log | construction | canCreate | ✅ | ✅ |
| save_contract_payment | payments | canCreate | ✅ | ✅ |
| save_correspondence | dept_legal_correspondence | canCreate | ✅ | ✅ |
| save_email_settings |  |  | ✅ | ✅ |
| save_engine_role_profile |  |  | ✅ | ✅ |
| save_form_field_config |  |  | ✅ | ✅ |
| save_hr_record | dept_legal_hr | canCreate | ✅ | ✅ |
| save_labor_contract | dept_legal_labor | canCreate | ✅ | ✅ |
| save_legal_document | dept_legal_documents | canCreate | ✅ | ✅ |
| save_mar_approval | boq, purchasing | canApprove | ✅ | ✅ |
| save_material | material_catalog | canEdit | ✅ | ✅ |
| save_material_category |  |  | ✅ | ✅ |
| save_material_external_code | material_catalog | canEdit | ✅ | ✅ |
| save_material_norm | material_norms | canCreate | ✅ | ✅ |
| save_material_subcategory |  |  | ✅ | ✅ |
| save_material_uom_conversion | material_catalog | canEdit | ✅ | ✅ |
| save_menu_group |  |  | ✅ | ✅ |
| save_module_catalog |  |  | ✅ | ✅ |
| save_organization_unit |  |  | ✅ | ✅ |
| save_partner | supplier_catalog | canEdit | ✅ |  |
| save_payment_plan | dept_finance_payment_plan | canCreate | ✅ | ✅ |
| save_production_report | production | canCreate | ✅ | ✅ |
| save_project_contract | boq | canEdit | ✅ | ✅ |
| save_role_catalog |  |  | ✅ | ✅ |
| save_seal | dept_legal_seal | canCreate | ✅ | ✅ |
| save_site_expense_claim | dept_finance_site_cost | canCreate | ✅ | ✅ |
| save_supplier | supplier_catalog | canEdit | ✅ | ✅ |
| save_team_payment |  |  | ✅ | ✅ |
| save_team_production |  |  | ✅ | ✅ |
| save_team_subcontract |  |  | ✅ | ✅ |
| save_trust_development_settings |  |  | ✅ | ✅ |
| save_ui_display_settings |  |  | ✅ | ✅ |
| save_user_access |  |  | ✅ | ✅ |
| save_warehouse_location | inventory, central_warehouse | canEdit | ✅ | ✅ |
| set_approval_stage_status |  |  | ✅ | ✅ |
| set_benefit_record_status | dept_legal_benefits | canEdit | ✅ | ✅ |
| set_boq_item_status | boq | canEdit | ✅ | ✅ |
| set_business_role_group_status |  |  | ✅ | ✅ |
| set_business_scope_status |  |  | ✅ | ✅ |
| set_correspondence_status | dept_legal_correspondence | canEdit | ✅ | ✅ |
| set_labor_contract_status | dept_legal_labor | canEdit | ✅ | ✅ |
| set_legal_document_status | dept_legal_documents | canEdit | ✅ | ✅ |
| set_material_category_status |  |  | ✅ | ✅ |
| set_material_norm_status | material_norms | canEdit | ✅ | ✅ |
| set_material_status | material_catalog | canEdit | ✅ | ✅ |
| set_material_subcategory_status |  |  | ✅ | ✅ |
| set_menu_group_status |  |  | ✅ | ✅ |
| set_module_status |  |  | ✅ | ✅ |
| set_organization_unit_member | site_command | canEdit | ✅ | ✅ |
| set_organization_unit_status |  |  | ✅ | ✅ |
| set_partner_status | supplier_catalog | canEdit | ✅ |  |
| set_payment_plan_status | dept_finance_payment_plan | canEdit | ✅ | ✅ |
| set_project_contract_status | boq | canEdit | ✅ | ✅ |
| set_project_status | admin | canEdit | ✅ | ✅ |
| set_project_team_status |  |  | ✅ | ✅ |
| set_role_status |  |  | ✅ | ✅ |
| set_seal_status | dept_legal_seal | canEdit | ✅ | ✅ |
| set_supplier_status | supplier_catalog | canEdit | ✅ | ✅ |
| set_user_status |  |  | ✅ | ✅ |
| set_work_item_participant | dept_plan_assign, dept_project_assign | canEdit | ✅ |  |
| settle_advance_request | dept_finance_advance | canApprove | ✅ | ✅ |
| settle_team_subcontract |  |  | ✅ | ✅ |
| setup |  |  | ✅ | ✅ |
| ship_transfer_order | inventory | canEdit | ✅ | ✅ |
| transfer_contract_ownership | inventory | canApprove | ✅ | ✅ |
| update_boq_contract_prices | boq | canEdit | ✅ | ✅ |
| update_po_price |  |  | ✅ |  |
| update_profile_avatar |  |  | ✅ | ✅ |
| update_project |  |  | ✅ | ✅ |
| update_returned_request | requests | canEdit | ✅ | ✅ |
| update_user |  |  | ✅ | ✅ |
| update_work_item_progress | dept_plan_tasks, dept_project_tasks | canEdit | ✅ | ✅ |
| update_work_item_status | dept_plan_tasks, dept_project_tasks, dept_plan_assign, dept_project_assign | canEdit | ✅ | ✅ |