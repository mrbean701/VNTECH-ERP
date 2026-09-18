// VNTECH PROPRIETARY SOURCE | Owner: CÔNG TY CỔ PHẦN THƯƠNG MẠI ĐẦU TƯ PHÁT TRIỂN CÔNG NGHỆ VIỆT (VNTECH) | Product: VNTECH-KHO-MEP-001 | Fingerprint: SSOT
import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
};

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(), code: text("code").notNull(), name: text("name").notNull(),
  status: text("status").notNull().default("active"), managerUserId: text("manager_user_id"),
  startDate: text("start_date"), plannedEndDate: text("planned_end_date"), contractNo: text("contract_no"), contractName: text("contract_name"), ...timestamps,
}, (table) => [uniqueIndex("projects_code_uidx").on(table.code)]);

export const users = sqliteTable("users", {
  id: text("id").primaryKey(), employeeCode: text("employee_code").notNull(),
  fullName: text("full_name").notNull(), username: text("username").notNull(), email: text("email"), passwordHash: text("password_hash"),
  role: text("role").notNull(), department: text("department").notNull(),
  approvalLimit: real("approval_limit").notNull().default(0),
  active: integer("active", { mode: "boolean" }).notNull().default(true), ...timestamps,
}, (table) => [uniqueIndex("users_employee_code_uidx").on(table.employeeCode), uniqueIndex("users_username_uidx").on(table.username), uniqueIndex("users_email_uidx").on(table.email)]);

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(), userId: text("user_id").notNull().references(() => users.id),
  tokenHash: text("token_hash").notNull(), expiresAt: text("expires_at").notNull(),
  ipAddress: text("ip_address"), userAgent: text("user_agent"), lastSeenAt: text("last_seen_at"), createdAt: text("created_at").notNull(),
}, (table) => [uniqueIndex("sessions_token_uidx").on(table.tokenHash), index("sessions_user_idx").on(table.userId)]);

export const companySettings = sqliteTable("company_settings", {
  id: text("id").primaryKey(), companyName: text("company_name").notNull(),
  stage1Department: text("stage_1_department").notNull().default("BCH / Chỉ huy trưởng"),
  stage2Department: text("stage_2_department").notNull().default("Phòng Dự án"),
  stage3Department: text("stage_3_department").notNull().default("KH-MH / Tài chính"),
  approvalSlaHours: integer("approval_sla_hours").notNull().default(24),
  stage1SlaHours: integer("stage_1_sla_hours").notNull().default(8),
  stage2SlaHours: integer("stage_2_sla_hours").notNull().default(8),
  stage3SlaHours: integer("stage_3_sla_hours").notNull().default(8),
  poSlaHours: integer("po_sla_hours").notNull().default(24),
  bchConfirmationSlaHours: integer("bch_confirmation_sla_hours").notNull().default(8),
  slowMovingDays: integer("slow_moving_days").notNull().default(60),
  negativeStockBlocked: integer("negative_stock_blocked", { mode: "boolean" }).notNull().default(true),
  updatedBy: text("updated_by").references(() => users.id), ...timestamps,
});

export const userProjectScopes = sqliteTable("user_project_scopes", {
  id: text("id").primaryKey(), userId: text("user_id").notNull().references(() => users.id),
  projectId: text("project_id").notNull().references(() => projects.id),
  permission: text("permission").notNull().default("read"), ...timestamps,
}, (table) => [uniqueIndex("user_project_scope_uidx").on(table.userId, table.projectId)]);

export const warehouses = sqliteTable("warehouses", {
  id: text("id").primaryKey(), code: text("code").notNull(), name: text("name").notNull(),
  type: text("type").notNull(), projectId: text("project_id").references(() => projects.id),
  parentWarehouseId: text("parent_warehouse_id"), keeperUserId: text("keeper_user_id").references(() => users.id),
  active: integer("active", { mode: "boolean" }).notNull().default(true), ...timestamps,
}, (table) => [uniqueIndex("warehouses_code_uidx").on(table.code), index("warehouses_project_idx").on(table.projectId)]);

export const userWarehouseScopes = sqliteTable("user_warehouse_scopes", {
  id: text("id").primaryKey(), userId: text("user_id").notNull().references(() => users.id),
  warehouseId: text("warehouse_id").notNull().references(() => warehouses.id),
  permission: text("permission").notNull().default("read"), ...timestamps,
}, (table) => [uniqueIndex("user_warehouse_scope_uidx").on(table.userId, table.warehouseId), index("user_warehouse_scope_user_idx").on(table.userId)]);

export const teams = sqliteTable("teams", {
  id: text("id").primaryKey(), code: text("code").notNull(), name: text("name").notNull(), trade: text("trade").notNull(),
  projectId: text("project_id").notNull().references(() => projects.id),
  warehouseId: text("warehouse_id").notNull().references(() => warehouses.id),
  leaderUserId: text("leader_user_id").references(() => users.id),
  active: integer("active", { mode: "boolean" }).notNull().default(true), ...timestamps,
}, (table) => [uniqueIndex("teams_code_uidx").on(table.code), index("teams_project_idx").on(table.projectId)]);

export const contractPayments = sqliteTable("contract_payments", {
  id: text("id").primaryKey(), projectId: text("project_id").notNull().references(() => projects.id),
  recoveryRecordId: text("recovery_record_id"),
  paymentDate: text("payment_date").notNull(), referenceNo: text("reference_no"), description: text("description").notNull(),
  amount: real("amount").notNull().default(0), note: text("note"), createdBy: text("created_by").references(() => users.id), ...timestamps,
}, (table) => [index("contract_payments_project_date_idx").on(table.projectId, table.paymentDate), index("contract_payments_recovery_idx").on(table.recoveryRecordId)]);

export const productionReports = sqliteTable("production_reports", {
  id: text("id").primaryKey(), projectId: text("project_id").notNull().references(() => projects.id),
  reportPeriod: text("report_period").notNull(), referenceNo: text("reference_no"), description: text("description"),
  plannedValue: real("planned_value").notNull().default(0), actualValue: real("actual_value").notNull().default(0), approvedValue: real("approved_value").notNull().default(0),
  status: text("status").notNull().default("submitted"), submittedBy: text("submitted_by").references(() => users.id),
  approvedBy: text("approved_by").references(() => users.id), approvedAt: text("approved_at"), ...timestamps,
}, (table) => [uniqueIndex("production_reports_project_period_uidx").on(table.projectId, table.reportPeriod)]);

export const capitalRecoveryRecords = sqliteTable("capital_recovery_records", {
  id: text("id").primaryKey(), projectId: text("project_id").notNull().references(() => projects.id),
  periodKey: text("period_key").notNull(), referenceNo: text("reference_no"), productionReportId: text("production_report_id").references(() => productionReports.id),
  submittedValue: real("submitted_value").notNull().default(0), approvedValue: real("approved_value").notNull().default(0),
  invoiceNo: text("invoice_no"), invoiceValue: real("invoice_value").notNull().default(0), dueDate: text("due_date"),
  status: text("status").notNull().default("preparing"), note: text("note"), createdBy: text("created_by").references(() => users.id), ...timestamps,
}, (table) => [index("capital_recovery_project_period_idx").on(table.projectId, table.periodKey)]);

export const suppliers = sqliteTable("suppliers", {
  id: text("id").primaryKey(), code: text("code").notNull(), name: text("name").notNull(),
  taxCode: text("tax_code"), contactName: text("contact_name"), phone: text("phone"),
  leadTimeDays: integer("lead_time_days").notNull().default(0), rating: real("rating").notNull().default(0),
  active: integer("active", { mode: "boolean" }).notNull().default(true), ...timestamps,
}, (table) => [uniqueIndex("suppliers_code_uidx").on(table.code)]);


export const materialCategories = sqliteTable("material_categories", {
  id: text("id").primaryKey(), code: text("code").notNull(), name: text("name").notNull(),
  description: text("description"), sortOrder: integer("sort_order").notNull().default(0),
  active: integer("active", { mode: "boolean" }).notNull().default(true), ...timestamps,
}, (table) => [uniqueIndex("material_categories_code_uidx").on(table.code)]);

export const materialSubcategories = sqliteTable("material_subcategories", {
  id: text("id").primaryKey(), categoryId: text("category_id").notNull().references(() => materialCategories.id),
  code: text("code").notNull(), name: text("name").notNull(), description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0), active: integer("active", { mode: "boolean" }).notNull().default(true), ...timestamps,
}, (table) => [uniqueIndex("material_subcategories_category_code_uidx").on(table.categoryId, table.code), index("material_subcategories_category_idx").on(table.categoryId)]);

export const materials = sqliteTable("materials", {
  id: text("id").primaryKey(), code: text("code").notNull(), name: text("name").notNull(), system: text("system").notNull(), categoryId: text("category_id").references(() => materialCategories.id), subcategoryId: text("subcategory_id").references(() => materialSubcategories.id),
  specification: text("specification"), brand: text("brand"), unit: text("unit").notNull(),
  standardPrice: real("standard_price").notNull().default(0), minStock: real("min_stock").notNull().default(0),
  requiresCocq: integer("requires_cocq", { mode: "boolean" }).notNull().default(false),
  requiresMar: integer("requires_mar", { mode: "boolean" }).notNull().default(false),
  active: integer("active", { mode: "boolean" }).notNull().default(true), ...timestamps,
}, (table) => [uniqueIndex("materials_code_uidx").on(table.code), index("materials_system_idx").on(table.system)]);

export const materialAliases = sqliteTable("material_aliases", {
  id: text("id").primaryKey(), materialId: text("material_id").notNull().references(() => materials.id), aliasName: text("alias_name").notNull(),
  normalizedName: text("normalized_name").notNull(), verified: integer("verified", { mode: "boolean" }).notNull().default(true),
  active: integer("active", { mode: "boolean" }).notNull().default(true), createdBy: text("created_by").references(() => users.id), ...timestamps,
}, (table) => [uniqueIndex("material_aliases_normalized_uidx").on(table.normalizedName), index("material_aliases_material_idx").on(table.materialId, table.active)]);

export const materialCodeHistory = sqliteTable("material_code_history", {
  id: text("id").primaryKey(), materialId: text("material_id").notNull().references(() => materials.id), oldCode: text("old_code").notNull(),
  newCode: text("new_code").notNull(), reason: text("reason").notNull(), changedBy: text("changed_by").notNull().references(() => users.id), changedAt: text("changed_at").notNull(),
}, (table) => [index("material_code_history_material_idx").on(table.materialId, table.changedAt)]);


export const materialExternalCodes = sqliteTable("material_external_codes", {
  id: text("id").primaryKey(), materialId: text("material_id").notNull().references(() => materials.id), codeType: text("code_type").notNull(), ownerKey: text("owner_key").notNull().default(""),
  externalCode: text("external_code").notNull(), active: integer("active", { mode: "boolean" }).notNull().default(true), ...timestamps,
}, (table) => [uniqueIndex("material_external_codes_uidx").on(table.codeType, table.ownerKey, table.externalCode), index("material_external_codes_material_idx").on(table.materialId, table.active)]);

export const materialUomConversions = sqliteTable("material_uom_conversions", {
  id: text("id").primaryKey(), materialId: text("material_id").notNull().references(() => materials.id), fromUom: text("from_uom").notNull(), toUom: text("to_uom").notNull(), factor: real("factor").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true), ...timestamps,
}, (table) => [uniqueIndex("material_uom_conversion_uidx").on(table.materialId, table.fromUom, table.toUom)]);

export const materialMarApprovals = sqliteTable("material_mar_approvals", {
  id: text("id").primaryKey(), projectId: text("project_id").notNull().references(() => projects.id), materialId: text("material_id").notNull().references(() => materials.id),
  approvalNo: text("approval_no"), status: text("status").notNull().default("pending"), approvedAt: text("approved_at"), approvedBy: text("approved_by").references(() => users.id), note: text("note"), ...timestamps,
}, (table) => [uniqueIndex("material_mar_approval_uidx").on(table.projectId, table.materialId), index("material_mar_approval_idx").on(table.projectId, table.materialId, table.status)]);

export const projectBoqItems = sqliteTable("project_boq_items", {
  id: text("id").primaryKey(), projectId: text("project_id").notNull().references(() => projects.id),
  lineNo: integer("line_no").notNull(), sourceOrder: integer("source_order"), contractLineRef: text("contract_line_ref"),
  rowRole: text("row_role").notNull().default("material"), parentSourceOrder: integer("parent_source_order"), outlineLevel: integer("outline_level").notNull().default(0),
  sourceSheet: text("source_sheet"), sourceRow: integer("source_row"), boqCode: text("boq_code"), contractCode: text("contract_code"),
  itemType: text("item_type").notNull().default("contract"),
  materialId: text("material_id").notNull().references(() => materials.id), contractMaterialCode: text("contract_material_code"), approvedMaterialCode: text("approved_material_code"), description: text("description"),
  contractQty: real("contract_qty").notNull().default(0), remeasuredQty: real("remeasured_qty").notNull().default(0),
  unitPrice: real("unit_price").notNull().default(0), variationStatus: text("variation_status").notNull().default("none"),
  variationRef: text("variation_ref"), variationApprovedAt: text("variation_approved_at"), note: text("note"),
  active: integer("active", { mode: "boolean" }).notNull().default(true), ...timestamps,
}, (table) => [index("project_boq_line_uidx").on(table.projectId, table.lineNo), index("project_boq_source_order_idx").on(table.projectId, table.sourceOrder), index("project_boq_material_idx").on(table.projectId, table.materialId)]);

export const boqImportBatches = sqliteTable("boq_import_batches", {
  id: text("id").primaryKey(), projectId: text("project_id").notNull().references(() => projects.id), versionNo: integer("version_no").notNull(), sourceFileName: text("source_file_name"), active: integer("active", { mode: "boolean" }).notNull().default(true), rowCount: integer("row_count").notNull().default(0), importedBy: text("imported_by").notNull().references(() => users.id), ...timestamps,
}, (table) => [uniqueIndex("boq_import_batches_project_version_uidx").on(table.projectId, table.versionNo), index("boq_import_batches_project_active_idx").on(table.projectId, table.active, table.versionNo)]);

export const boqSourceItems = sqliteTable("boq_source_items", {
  id: text("id").primaryKey(), batchId: text("batch_id").notNull().references(() => boqImportBatches.id), projectId: text("project_id").notNull().references(() => projects.id), sourceOrder: integer("source_order").notNull(), sourceRow: integer("source_row"), contractLineRef: text("contract_line_ref"), rowRole: text("row_role").notNull().default("material"), boqCode: text("boq_code"), contractCode: text("contract_code"), contractMaterialCode: text("contract_material_code"), approvedMaterialCode: text("approved_material_code"), contractMaterialName: text("contract_material_name"), unit: text("unit"), contractQty: real("contract_qty").notNull().default(0), remeasuredQty: real("remeasured_qty").notNull().default(0), unitPrice: real("unit_price").notNull().default(0), itemType: text("item_type").notNull().default("contract"), note: text("note"), sourceSystemCode: text("source_system_code"), sourceSubgroupName: text("source_subgroup_name"), rawSourceJson: text("raw_source_json"), mappedMaterialId: text("mapped_material_id").references(() => materials.id), standardMaterialNameSnapshot: text("standard_material_name_snapshot"), mappingStatus: text("mapping_status").notNull().default("unmapped"), projectBoqItemId: text("project_boq_item_id").references(() => projectBoqItems.id), mappedBy: text("mapped_by").references(() => users.id), mappedAt: text("mapped_at"), active: integer("active", { mode: "boolean" }).notNull().default(true), ...timestamps,
}, (table) => [index("boq_source_items_batch_order_idx").on(table.batchId, table.sourceOrder), index("boq_source_items_project_status_idx").on(table.projectId, table.mappingStatus, table.active), index("boq_source_items_material_idx").on(table.mappedMaterialId, table.active)]);

export const materialEmbeddings = sqliteTable("material_embeddings", { id: text("id").primaryKey(), materialId: text("material_id").notNull().references(() => materials.id), provider: text("provider").notNull(), model: text("model").notNull(), semanticHash: text("semantic_hash").notNull(), vectorJson: text("vector_json").notNull(), dimension: integer("dimension").notNull(), ...timestamps, }, (table) => [uniqueIndex("material_embeddings_provider_uidx").on(table.materialId, table.provider, table.model)]);
export const boqMappingRuns = sqliteTable("boq_mapping_runs", { id: text("id").primaryKey(), batchId: text("batch_id").notNull().references(() => boqImportBatches.id), projectId: text("project_id").notNull().references(() => projects.id), scope: text("scope").notNull().default("unmapped"), provider: text("provider").notNull(), providerFallback: integer("provider_fallback", { mode: "boolean" }).notNull().default(false), topK: integer("top_k").notNull().default(5), thresholdsJson: text("thresholds_json").notNull(), weightsJson: text("weights_json").notNull(), runBy: text("run_by").notNull().references(() => users.id), createdAt: text("created_at").notNull(), }, (table) => [index("boq_mapping_runs_batch_idx").on(table.batchId, table.createdAt)]);
export const boqMappingCandidates = sqliteTable("boq_mapping_candidates", { id: text("id").primaryKey(), runId: text("run_id").notNull().references(() => boqMappingRuns.id), sourceItemId: text("source_item_id").notNull().references(() => boqSourceItems.id), materialId: text("material_id").notNull().references(() => materials.id), rankNo: integer("rank_no").notNull(), historyScore: real("history_score").notNull().default(0), technicalScore: real("technical_score").notNull().default(0), systemScore: real("system_score").notNull().default(0), uomScore: real("uom_score").notNull().default(0), fuzzyScore: real("fuzzy_score").notNull().default(0), embeddingScore: real("embedding_score").notNull().default(0), finalScore: real("final_score").notNull().default(0), hardConflict: integer("hard_conflict", { mode: "boolean" }).notNull().default(false), conflictReason: text("conflict_reason"), provider: text("provider"), status: text("status").notNull(), createdAt: text("created_at").notNull(), }, (table) => [uniqueIndex("boq_mapping_candidates_run_source_rank_uidx").on(table.runId, table.sourceItemId, table.rankNo), index("boq_mapping_candidates_source_score_idx").on(table.sourceItemId, table.finalScore)]);
export const boqMappingAudit = sqliteTable("boq_mapping_audit", { id: text("id").primaryKey(), sourceItemId: text("source_item_id").notNull().references(() => boqSourceItems.id), runId: text("run_id").references(() => boqMappingRuns.id), oldMaterialId: text("old_material_id").references(() => materials.id), newMaterialId: text("new_material_id").notNull().references(() => materials.id), actionType: text("action_type").notNull(), finalScore: real("final_score"), scoreDetailJson: text("score_detail_json"), provider: text("provider"), reason: text("reason"), saveAlias: integer("save_alias", { mode: "boolean" }).notNull().default(false), actorUserId: text("actor_user_id").notNull().references(() => users.id), createdAt: text("created_at").notNull(), }, (table) => [index("boq_mapping_audit_source_idx").on(table.sourceItemId, table.createdAt)]);
export const materialMappingHistory = sqliteTable("material_mapping_history", { id: text("id").primaryKey(), materialId: text("material_id").notNull().references(() => materials.id), sourceNormalized: text("source_normalized").notNull(), sourceText: text("source_text").notNull(), systemCode: text("system_code"), unit: text("unit"), confirmCount: integer("confirm_count").notNull().default(1), lastConfirmedBy: text("last_confirmed_by").notNull().references(() => users.id), lastConfirmedAt: text("last_confirmed_at").notNull(), ...timestamps, }, (table) => [uniqueIndex("material_mapping_history_uidx").on(table.materialId, table.sourceNormalized), index("material_mapping_history_source_idx").on(table.sourceNormalized, table.confirmCount)]);
export const boqMaterialComponents = sqliteTable("boq_material_components", { id: text("id").primaryKey(), sourceItemId: text("source_item_id").notNull().references(() => boqSourceItems.id), materialId: text("material_id").notNull().references(() => materials.id), componentType: text("component_type").notNull().default("main"), quantityRatio: real("quantity_ratio").notNull().default(1), componentUom: text("component_uom"), isRequired: integer("is_required", { mode: "boolean" }).notNull().default(true), sourceMethod: text("source_method").notNull().default("manual"), approvedBy: text("approved_by").references(() => users.id), approvedAt: text("approved_at"), note: text("note"), active: integer("active", { mode: "boolean" }).notNull().default(true), ...timestamps, }, (table) => [uniqueIndex("boq_material_components_uidx").on(table.sourceItemId, table.materialId, table.componentType), index("boq_material_components_source_idx").on(table.sourceItemId, table.active)]);

export const userModulePermissions = sqliteTable("user_module_permissions", {
  id: text("id").primaryKey(), userId: text("user_id").notNull().references(() => users.id), moduleKey: text("module_key").notNull(),
  canView: integer("can_view", { mode: "boolean" }).notNull().default(false), canUse: integer("can_use", { mode: "boolean" }).notNull().default(false),
  canCreate: integer("can_create", { mode: "boolean" }).notNull().default(false), canEdit: integer("can_edit", { mode: "boolean" }).notNull().default(false),
  canApprove: integer("can_approve", { mode: "boolean" }).notNull().default(false), canExport: integer("can_export", { mode: "boolean" }).notNull().default(false),
  permissionExpiresAt: text("permission_expires_at"), ...timestamps,
}, (table) => [uniqueIndex("user_module_permission_uidx").on(table.userId, table.moduleKey)]);

export const materialRequests = sqliteTable("material_requests", {
  id: text("id").primaryKey(), requestNo: text("request_no").notNull(),
  projectId: text("project_id").notNull().references(() => projects.id), teamId: text("team_id").references(() => teams.id),
  sourceWarehouseId: text("source_warehouse_id").references(() => warehouses.id),
  requestedBy: text("requested_by").notNull().references(() => users.id), requestedAt: text("requested_at").notNull(),
  neededAt: text("needed_at").notNull(), priority: text("priority").notNull().default("normal"),
  area: text("area").notNull(), purpose: text("purpose"), status: text("status").notNull().default("draft"),
  supplyStatus: text("supply_status").notNull().default("approval_pending"),
  approvalStage: integer("approval_stage").notNull().default(0), totalEstimatedValue: real("total_estimated_value").notNull().default(0), ...timestamps,
}, (table) => [uniqueIndex("material_requests_no_uidx").on(table.requestNo), index("material_requests_project_status_idx").on(table.projectId, table.status), index("material_requests_needed_idx").on(table.neededAt)]);

export const documentSequences = sqliteTable("document_sequences", {
  id: text("id").primaryKey(), documentType: text("document_type").notNull(),
  projectId: text("project_id").notNull().references(() => projects.id), year: integer("year").notNull(),
  lastNumber: integer("last_number").notNull().default(0), updatedAt: text("updated_at").notNull(),
}, (table) => [uniqueIndex("document_sequences_scope_uidx").on(table.documentType, table.projectId, table.year)]);

export const materialRequestItems = sqliteTable("material_request_items", {
  id: text("id").primaryKey(), requestId: text("request_id").notNull().references(() => materialRequests.id),
  lineNo: integer("line_no").notNull(), materialId: text("material_id").notNull().references(() => materials.id), boqItemId: text("boq_item_id").references(() => projectBoqItems.id),
  workPackageCode: text("work_package_code"), boqCode: text("boq_code"), routeTag: text("route_tag"), installationArea: text("installation_area"), contractLineNo: integer("contract_line_no"), origin: text("origin"), approvedSupplier: text("approved_supplier"), note: text("note"),
  requestedQty: real("requested_qty").notNull(), estimatedUnitPrice: real("estimated_unit_price").notNull().default(0), stockAllocationQty: real("stock_allocation_qty").notNull().default(0),
  approvedPurchaseQty: real("approved_purchase_qty").notNull().default(0), orderedQty: real("ordered_qty").notNull().default(0),
  receivedQty: real("received_qty").notNull().default(0), issuedQty: real("issued_qty").notNull().default(0),
  deliveredQty: real("delivered_qty").notNull().default(0), closedQty: real("closed_qty").notNull().default(0), closeReason: text("close_reason"),
  installedQty: real("installed_qty").notNull().default(0), lineStatus: text("line_status").notNull().default("pending"), ...timestamps,
}, (table) => [uniqueIndex("request_items_line_uidx").on(table.requestId, table.lineNo), index("request_items_material_idx").on(table.materialId), index("request_items_boq_item_idx").on(table.boqItemId)]);

export const approvals = sqliteTable("approvals", {
  id: text("id").primaryKey(),
  // [WF] PHASE 8 (18/09) — D1: một bảng duyệt dùng cho MỌI loại chứng từ. `requestId` nay KHÔNG bắt buộc
  // (phiếu đề nghị vẫn dùng; PO/xuất/nhập kho dùng `entityType`+`entityId`). Bản SQLite KHÔNG đổi được
  // nullability tại chỗ nên cột thật vẫn NOT NULL — xem ghi chú trong `drizzle/0141_wf_dynamic_approvals.sql`.
  entityType: text("entity_type"), entityId: text("entity_id"),
  requestId: text("request_id").references(() => materialRequests.id),
  stage: integer("stage").notNull(), department: text("department").notNull(), approverUserId: text("approver_user_id").references(() => users.id),
  status: text("status").notNull().default("pending"), queuedAt: text("queued_at"), dueAt: text("due_at"), notifiedAt: text("notified_at"), reminderSentAt: text("reminder_sent_at"), decidedAt: text("decided_at"),
  comment: text("comment"), decisionSnapshot: text("decision_snapshot"),
  allowedRoleCodesSnapshot: text("allowed_role_codes_snapshot"), approvalModeSnapshot: text("approval_mode_snapshot").notNull().default("single"), ...timestamps,
}, (table) => [uniqueIndex("approvals_request_stage_uidx").on(table.requestId, table.stage), index("approvals_queue_idx").on(table.status, table.stage, table.dueAt)]);

export const approvalStageDecisions = sqliteTable("approval_stage_decisions", {
  id: text("id").primaryKey(), requestId: text("request_id").notNull().references(() => materialRequests.id),
  stage: integer("stage").notNull(), roleCode: text("role_code").notNull(), userId: text("user_id").notNull().references(() => users.id),
  decision: text("decision").notNull(), comment: text("comment"), decidedAt: text("decided_at").notNull(), ...timestamps,
}, (table) => [uniqueIndex("approval_stage_decision_uidx").on(table.requestId, table.stage, table.roleCode), index("approval_stage_decision_request_idx").on(table.requestId, table.stage)]);

// MASTER BASELINE: this schema mirrors migration 0047 exactly. Referential eligibility is
// enforced by the approval assignment service so SQLite/PostgreSQL deployments share one contract.
export const approvalProjectAssignments = sqliteTable("approval_project_assignments", {
  id: text("id").primaryKey(), projectId: text("project_id").notNull(), stage: integer("stage").notNull(),
  ownerUserId: text("owner_user_id").notNull(), ccEmails: text("cc_emails"), active: integer("active", { mode: "boolean" }).notNull().default(true),
  updatedBy: text("updated_by"), ...timestamps,
}, (table) => [uniqueIndex("approval_project_assignments_scope_uidx").on(table.projectId, table.stage), index("approval_project_assignments_owner_idx").on(table.ownerUserId, table.active)]);

export const emailSettings = sqliteTable("email_settings", {
  id: text("id").primaryKey(), enabled: integer("enabled", { mode: "boolean" }).notNull().default(false),
  smtpHost: text("smtp_host"), smtpPort: integer("smtp_port").notNull().default(587), security: text("security").notNull().default("starttls"),
  username: text("username"), password: text("password"), senderEmail: text("sender_email"), senderName: text("sender_name").notNull().default("VNTECH ERP"),
  baseUrl: text("base_url"), updatedBy: text("updated_by").references(() => users.id), ...timestamps,
});

export const approvalEmailRecipients = sqliteTable("approval_email_recipients", {
  id: text("id").primaryKey(), projectId: text("project_id").notNull().references(() => projects.id), stage: integer("stage").notNull(),
  emails: text("emails").notNull(), active: integer("active", { mode: "boolean" }).notNull().default(true), ...timestamps,
}, (table) => [uniqueIndex("approval_email_recipients_scope_uidx").on(table.projectId, table.stage)]);

export const emailOutbox = sqliteTable("email_outbox", {
  id: text("id").primaryKey(), requestId: text("request_id").references(() => materialRequests.id), stage: integer("stage"), event: text("event").notNull(),
  recipients: text("recipients").notNull(), subject: text("subject").notNull(), textBody: text("text_body").notNull(), htmlBody: text("html_body").notNull(),
  status: text("status").notNull().default("queued"), attemptCount: integer("attempt_count").notNull().default(0), nextAttemptAt: text("next_attempt_at"),
  queuedAt: text("queued_at").notNull(), sentAt: text("sent_at"), lastError: text("last_error"), ...timestamps,
}, (table) => [index("email_outbox_queue_idx").on(table.status, table.nextAttemptAt, table.queuedAt), index("email_outbox_request_idx").on(table.requestId, table.stage, table.event)]);

export const requestComments = sqliteTable("request_comments", {
  id: text("id").primaryKey(), requestId: text("request_id").notNull().references(() => materialRequests.id),
  userId: text("user_id").notNull().references(() => users.id), comment: text("comment").notNull(),
  visibility: text("visibility").notNull().default("internal"), createdAt: text("created_at").notNull(),
}, (table) => [index("request_comments_request_idx").on(table.requestId, table.createdAt)]);

export const purchaseOrders = sqliteTable("purchase_orders", {
  id: text("id").primaryKey(), poNo: text("po_no").notNull(), projectId: text("project_id").notNull().references(() => projects.id),
  requestId: text("request_id").references(() => materialRequests.id),
  supplierId: text("supplier_id").notNull().references(() => suppliers.id),
  receivingWarehouseId: text("receiving_warehouse_id").notNull().references(() => warehouses.id),
  buyerUserId: text("buyer_user_id").notNull().references(() => users.id), orderedAt: text("ordered_at").notNull(), eta: text("eta"),
  deliveryQueuedAt: text("delivery_queued_at"), deliveryCompletedAt: text("delivery_completed_at"),
  status: text("status").notNull().default("draft"), totalValue: real("total_value").notNull().default(0), ...timestamps,
}, (table) => [uniqueIndex("purchase_orders_no_uidx").on(table.poNo), index("purchase_orders_project_status_idx").on(table.projectId, table.status), index("purchase_orders_eta_idx").on(table.eta)]);

export const purchaseOrderItems = sqliteTable("purchase_order_items", {
  id: text("id").primaryKey(), purchaseOrderId: text("purchase_order_id").notNull().references(() => purchaseOrders.id),
  requestItemId: text("request_item_id").notNull().references(() => materialRequestItems.id), lineNo: integer("line_no").notNull(),
  orderedQty: real("ordered_qty").notNull(), unitPrice: real("unit_price").notNull(), systemCode: text("system_code"), plannedDeliveryAt: text("planned_delivery_at"),
  deliveredQty: real("delivered_qty").notNull().default(0), receivedQty: real("received_qty").notNull().default(0), closedQty: real("closed_qty").notNull().default(0),
  closeReason: text("close_reason"), closedBy: text("closed_by").references(() => users.id), closedAt: text("closed_at"), status: text("status").notNull().default("ordered"), ...timestamps,
}, (table) => [uniqueIndex("purchase_order_items_line_uidx").on(table.purchaseOrderId, table.lineNo), index("purchase_order_items_request_idx").on(table.requestItemId)]);

export const centralReturns = sqliteTable("central_returns", {
  id: text("id").primaryKey(), returnNo: text("return_no").notNull(), sourceProjectId: text("source_project_id").notNull().references(() => projects.id),
  sourceWarehouseId: text("source_warehouse_id").notNull().references(() => warehouses.id), centralWarehouseId: text("central_warehouse_id").notNull().references(() => warehouses.id),
  requestedBy: text("requested_by").notNull().references(() => users.id), requestedAt: text("requested_at").notNull(), approvedBy: text("approved_by").references(() => users.id),
  approvedAt: text("approved_at"), receivedBy: text("received_by").references(() => users.id), receivedAt: text("received_at"), status: text("status").notNull().default("pending_approval"), note: text("note"), ...timestamps,
}, (table) => [uniqueIndex("central_returns_no_uidx").on(table.returnNo), index("central_returns_status_idx").on(table.status, table.requestedAt)]);

export const centralReturnItems = sqliteTable("central_return_items", {
  id: text("id").primaryKey(), centralReturnId: text("central_return_id").notNull().references(() => centralReturns.id), materialId: text("material_id").notNull().references(() => materials.id),
  proposedQty: real("proposed_qty").notNull(), countedQty: real("counted_qty").notNull().default(0), acceptedQty: real("accepted_qty").notNull().default(0),
  rejectedQty: real("rejected_qty").notNull().default(0), conditionStatus: text("condition_status").notNull().default("usable"), unitCost: real("unit_cost").notNull().default(0), rejectionReason: text("rejection_reason"), ...timestamps,
}, (table) => [index("central_return_items_return_idx").on(table.centralReturnId, table.materialId)]);

export const stockReservations = sqliteTable("stock_reservations", {
  id: text("id").primaryKey(), projectId: text("project_id").notNull().references(() => projects.id), warehouseId: text("warehouse_id").notNull().references(() => warehouses.id), materialId: text("material_id").notNull().references(() => materials.id),
  requestId: text("request_id").references(() => materialRequests.id), requestItemId: text("request_item_id").references(() => materialRequestItems.id), quantity: real("quantity").notNull(), status: text("status").notNull().default("active"),
  reservedAt: text("reserved_at").notNull(), releasedAt: text("released_at"), createdBy: text("created_by").notNull().references(() => users.id), ...timestamps,
}, (table) => [index("stock_reservation_balance_idx").on(table.warehouseId, table.materialId, table.status), index("stock_reservation_request_idx").on(table.requestId, table.requestItemId, table.status)]);

export const transferOrders = sqliteTable("transfer_orders", {
  id: text("id").primaryKey(), transferNo: text("transfer_no").notNull(), sourceWarehouseId: text("source_warehouse_id").notNull().references(() => warehouses.id), destinationWarehouseId: text("destination_warehouse_id").notNull().references(() => warehouses.id),
  sourceProjectId: text("source_project_id").references(() => projects.id), destinationProjectId: text("destination_project_id").references(() => projects.id), transitWarehouseId: text("transit_warehouse_id").notNull().references(() => warehouses.id),
  requestedBy: text("requested_by").notNull().references(() => users.id), requestedAt: text("requested_at").notNull(), approvedBy: text("approved_by").references(() => users.id), approvedAt: text("approved_at"),
  shippedBy: text("shipped_by").references(() => users.id), shippedAt: text("shipped_at"), receivedBy: text("received_by").references(() => users.id), receivedAt: text("received_at"), status: text("status").notNull().default("requested"),
  reason: text("reason"), note: text("note"), ...timestamps,
}, (table) => [uniqueIndex("transfer_orders_no_uidx").on(table.transferNo), index("transfer_orders_status_idx").on(table.status, table.requestedAt)]);

export const transferOrderItems = sqliteTable("transfer_order_items", {
  id: text("id").primaryKey(), transferOrderId: text("transfer_order_id").notNull().references(() => transferOrders.id), materialId: text("material_id").notNull().references(() => materials.id),
  requestedQty: real("requested_qty").notNull(), approvedQty: real("approved_qty").notNull().default(0), shippedQty: real("shipped_qty").notNull().default(0), receivedQty: real("received_qty").notNull().default(0),
  rejectedQty: real("rejected_qty").notNull().default(0), lostQty: real("lost_qty").notNull().default(0), note: text("note"), ...timestamps,
}, (table) => [index("transfer_order_items_order_idx").on(table.transferOrderId, table.materialId)]);

export const warehouseLocations = sqliteTable("warehouse_locations", {
  id: text("id").primaryKey(), warehouseId: text("warehouse_id").notNull().references(() => warehouses.id), code: text("code").notNull(), name: text("name").notNull(), locationType: text("location_type").notNull().default("bin"),
  secure: integer("secure", { mode: "boolean" }).notNull().default(false), active: integer("active", { mode: "boolean" }).notNull().default(true), ...timestamps,
}, (table) => [uniqueIndex("warehouse_locations_uidx").on(table.warehouseId, table.code)]);

export const projectCloseChecks = sqliteTable("project_close_checks", {
  id: text("id").primaryKey(), projectId: text("project_id").notNull().references(() => projects.id), checkKey: text("check_key").notNull(), status: text("status").notNull().default("pending"), detail: text("detail"),
  checkedBy: text("checked_by").references(() => users.id), checkedAt: text("checked_at"), ...timestamps,
}, (table) => [uniqueIndex("project_close_checks_uidx").on(table.projectId, table.checkKey)]);

export const goodsReceipts = sqliteTable("goods_receipts", {
  id: text("id").primaryKey(), receiptNo: text("receipt_no").notNull(),
  purchaseOrderId: text("purchase_order_id").notNull().references(() => purchaseOrders.id),
  warehouseId: text("warehouse_id").notNull().references(() => warehouses.id),
  receivedBy: text("received_by").notNull().references(() => users.id), receivedAt: text("received_at").notNull(),
  deliveryNoteNo: text("delivery_note_no"), qcStatus: text("qc_status").notNull().default("pending"),
  documentStatus: text("document_status").notNull().default("pending"),
  certificateStatus: text("certificate_status").notNull().default("pending"),
  deliveryDocumentStatus: text("delivery_document_status").notNull().default("pending"),
  bchConfirmationStatus: text("bch_confirmation_status").notNull().default("pending"),
  bchConfirmedBy: text("bch_confirmed_by").references(() => users.id), bchConfirmedAt: text("bch_confirmed_at"), bchComment: text("bch_comment"),
  postingStatus: text("posting_status").notNull().default("unposted"), ...timestamps,
}, (table) => [uniqueIndex("goods_receipts_no_uidx").on(table.receiptNo), index("goods_receipts_po_idx").on(table.purchaseOrderId)]);

export const goodsReceiptItems = sqliteTable("goods_receipt_items", {
  id: text("id").primaryKey(), receiptId: text("receipt_id").notNull().references(() => goodsReceipts.id),
  purchaseOrderItemId: text("purchase_order_item_id").notNull().references(() => purchaseOrderItems.id),
  receivedQty: real("received_qty").notNull(), acceptedQty: real("accepted_qty").notNull().default(0),
  rejectedQty: real("rejected_qty").notNull().default(0), lotNo: text("lot_no"), qcResult: text("qc_result").notNull().default("pending"), ...timestamps,
}, (table) => [index("goods_receipt_items_po_line_idx").on(table.purchaseOrderItemId)]);

export const supplyWorkflowSteps = sqliteTable("supply_workflow_steps", {
  id: text("id").primaryKey(), requestId: text("request_id").notNull().references(() => materialRequests.id),
  purchaseOrderId: text("purchase_order_id").references(() => purchaseOrders.id), receiptId: text("receipt_id").references(() => goodsReceipts.id),
  step: text("step").notNull(), status: text("status").notNull().default("pending"),
  queuedAt: text("queued_at").notNull(), dueAt: text("due_at"), completedAt: text("completed_at"), completedBy: text("completed_by").references(() => users.id),
  comment: text("comment"), ...timestamps,
}, (table) => [index("supply_workflow_request_idx").on(table.requestId, table.step, table.queuedAt), index("supply_workflow_status_idx").on(table.status, table.dueAt)]);

export const stockMovements = sqliteTable("stock_movements", {
  id: text("id").primaryKey(), projectId: text("project_id").notNull().references(() => projects.id),
  materialId: text("material_id").notNull().references(() => materials.id),
  fromWarehouseId: text("from_warehouse_id").references(() => warehouses.id), toWarehouseId: text("to_warehouse_id").references(() => warehouses.id),
  movementType: text("movement_type").notNull(), quantity: real("quantity").notNull(), unitCost: real("unit_cost").notNull().default(0),
  occurredAt: text("occurred_at").notNull(), referenceType: text("reference_type").notNull(), referenceId: text("reference_id").notNull(),
  postedBy: text("posted_by").notNull().references(() => users.id), reversalOfId: text("reversal_of_id"), ...timestamps,
}, (table) => [index("stock_movements_balance_idx").on(table.projectId, table.materialId, table.toWarehouseId), index("stock_movements_reference_idx").on(table.referenceType, table.referenceId), index("stock_movements_date_idx").on(table.occurredAt)]);

export const stockIssues = sqliteTable("stock_issues", {
  id: text("id").primaryKey(), issueNo: text("issue_no").notNull(), projectId: text("project_id").notNull().references(() => projects.id),
  fromWarehouseId: text("from_warehouse_id").notNull().references(() => warehouses.id),
  teamId: text("team_id").notNull().references(() => teams.id), requestId: text("request_id").references(() => materialRequests.id),
  issuedBy: text("issued_by").notNull().references(() => users.id), receivedByName: text("received_by_name").notNull(),
  approvedBy: text("approved_by").references(() => users.id), issuedAt: text("issued_at").notNull(),
  status: text("status").notNull().default("draft"), signedAt: text("signed_at"), note: text("note"), ...timestamps,
}, (table) => [uniqueIndex("stock_issues_no_uidx").on(table.issueNo), index("stock_issues_project_idx").on(table.projectId, table.issuedAt)]);

export const stockIssueItems = sqliteTable("stock_issue_items", {
  id: text("id").primaryKey(), issueId: text("issue_id").notNull().references(() => stockIssues.id),
  materialId: text("material_id").notNull().references(() => materials.id), requestItemId: text("request_item_id").references(() => materialRequestItems.id),
  quantity: real("quantity").notNull(), installedQty: real("installed_qty").notNull().default(0),
  workPackageCode: text("work_package_code"), installationArea: text("installation_area"), ...timestamps,
}, (table) => [index("stock_issue_items_issue_idx").on(table.issueId), index("stock_issue_items_material_idx").on(table.materialId)]);

export const materialReturns = sqliteTable("material_returns", {
  id: text("id").primaryKey(), returnNo: text("return_no").notNull(), projectId: text("project_id").notNull().references(() => projects.id),
  teamId: text("team_id").notNull().references(() => teams.id), toWarehouseId: text("to_warehouse_id").notNull().references(() => warehouses.id),
  returnedByName: text("returned_by_name").notNull(), receivedBy: text("received_by").references(() => users.id),
  returnedAt: text("returned_at").notNull(), status: text("status").notNull().default("pending"), note: text("note"), ...timestamps,
}, (table) => [uniqueIndex("material_returns_no_uidx").on(table.returnNo), index("material_returns_project_idx").on(table.projectId, table.returnedAt)]);

export const materialReturnItems = sqliteTable("material_return_items", {
  id: text("id").primaryKey(), returnId: text("return_id").notNull().references(() => materialReturns.id),
  materialId: text("material_id").notNull().references(() => materials.id), quantity: real("quantity").notNull(),
  acceptedQty: real("accepted_qty").notNull().default(0), rejectedQty: real("rejected_qty").notNull().default(0),
  condition: text("condition").notNull().default("usable"), reason: text("reason"), ...timestamps,
}, (table) => [index("material_return_items_return_idx").on(table.returnId)]);

export const stockCounts = sqliteTable("stock_counts", {
  id: text("id").primaryKey(), countNo: text("count_no").notNull(), projectId: text("project_id").notNull().references(() => projects.id),
  warehouseId: text("warehouse_id").notNull().references(() => warehouses.id), countType: text("count_type").notNull(),
  countedAt: text("counted_at").notNull(), status: text("status").notNull().default("draft"), approvedBy: text("approved_by").references(() => users.id), ...timestamps,
}, (table) => [uniqueIndex("stock_counts_no_uidx").on(table.countNo), index("stock_counts_warehouse_date_idx").on(table.warehouseId, table.countedAt)]);

export const stockCountItems = sqliteTable("stock_count_items", {
  id: text("id").primaryKey(), stockCountId: text("stock_count_id").notNull().references(() => stockCounts.id),
  materialId: text("material_id").notNull().references(() => materials.id), bookQtySnapshot: real("book_qty_snapshot").notNull(),
  actualQty: real("actual_qty").notNull(), varianceQty: real("variance_qty").notNull(), reason: text("reason"),
  approvedAdjustmentQty: real("approved_adjustment_qty").notNull().default(0), ...timestamps,
}, (table) => [uniqueIndex("stock_count_items_uidx").on(table.stockCountId, table.materialId)]);


export const formFieldConfig = sqliteTable("form_field_config", {
  id: text("id").primaryKey(), formKey: text("form_key").notNull(), fieldKey: text("field_key").notNull(), displayName: text("display_name").notNull(),
  dataType: text("data_type").notNull().default("text"), sourceKind: text("source_kind").notNull().default("core"),
  visible: integer("visible", { mode: "boolean" }).notNull().default(true), required: integer("required", { mode: "boolean" }).notNull().default(false),
  importable: integer("importable", { mode: "boolean" }).notNull().default(true), exportable: integer("exportable", { mode: "boolean" }).notNull().default(true),
  editable: integer("editable", { mode: "boolean" }).notNull().default(true), sortOrder: integer("sort_order").notNull().default(0), optionsJson: text("options_json"),
  systemLocked: integer("system_locked", { mode: "boolean" }).notNull().default(false), active: integer("active", { mode: "boolean" }).notNull().default(true), ...timestamps,
}, (table) => [uniqueIndex("form_field_config_uidx").on(table.formKey, table.fieldKey), index("form_field_config_form_idx").on(table.formKey, table.sortOrder)]);

export const customFieldValues = sqliteTable("custom_field_values", {
  id: text("id").primaryKey(), formKey: text("form_key").notNull(), entityId: text("entity_id").notNull(), fieldKey: text("field_key").notNull(), valueText: text("value_text"), ...timestamps,
}, (table) => [uniqueIndex("custom_field_values_uidx").on(table.formKey, table.entityId, table.fieldKey), index("custom_field_values_entity_idx").on(table.formKey, table.entityId)]);

export const attachments = sqliteTable("attachments", {
  id: text("id").primaryKey(), entityType: text("entity_type").notNull(), entityId: text("entity_id").notNull(),
  fileName: text("file_name").notNull(), storageKey: text("storage_key").notNull(), mimeType: text("mime_type").notNull(),
  uploadedBy: text("uploaded_by").notNull().references(() => users.id), ...timestamps,
}, (table) => [index("attachments_entity_idx").on(table.entityType, table.entityId)]);

export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(), userId: text("user_id").references(() => users.id), action: text("action").notNull(),
  entityType: text("entity_type").notNull(), entityId: text("entity_id").notNull(), beforeJson: text("before_json"),
  afterJson: text("after_json"), ipAddress: text("ip_address"), occurredAt: text("occurred_at").notNull(),
}, (table) => [index("audit_logs_entity_idx").on(table.entityType, table.entityId), index("audit_logs_user_date_idx").on(table.userId, table.occurredAt)]);

export const roleCatalog = sqliteTable("role_catalog", {
  id: text("id").primaryKey(), code: text("code").notNull(), name: text("name").notNull(), description: text("description"),
  baseRole: text("base_role").notNull().default("engineer"), warehouseScopeKind: text("warehouse_scope_kind"), active: integer("active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0), systemLocked: integer("system_locked", { mode: "boolean" }).notNull().default(false), ...timestamps,
}, (table) => [uniqueIndex("role_catalog_code_uidx").on(table.code)]);

export const approvalStageCatalog = sqliteTable("approval_stage_catalog", {
  id: text("id").primaryKey(), stageNo: integer("stage_no").notNull(), name: text("name").notNull(), description: text("description"),
  allowedRoleCodes: text("allowed_role_codes").notNull().default(""), approvalMode: text("approval_mode").notNull().default("single"), slaHours: integer("sla_hours").notNull().default(8),
  autoApproveOnSubmit: integer("auto_approve_on_submit", { mode: "boolean" }).notNull().default(false), active: integer("active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0), ...timestamps,
}, (table) => [uniqueIndex("approval_stage_catalog_no_uidx").on(table.stageNo)]);

export const menuGroupCatalog = sqliteTable("menu_group_catalog", {
  id: text("id").primaryKey(), groupKey: text("group_key").notNull(), name: text("name").notNull(), icon: text("icon").notNull().default("▦"),
  active: integer("active", { mode: "boolean" }).notNull().default(true), sortOrder: integer("sort_order").notNull().default(0),
  collapsible: integer("collapsible", { mode: "boolean" }).notNull().default(true), systemLocked: integer("system_locked", { mode: "boolean" }).notNull().default(false), ...timestamps,
}, (table) => [uniqueIndex("menu_group_catalog_key_uidx").on(table.groupKey)]);

export const moduleCatalog = sqliteTable("module_catalog", {
  moduleKey: text("module_key").primaryKey(), label: text("label").notNull(), icon: text("icon").notNull(), groupName: text("group_name"), groupKey: text("group_key"),
  active: integer("active", { mode: "boolean" }).notNull().default(true), sortOrder: integer("sort_order").notNull().default(0),
  systemLocked: integer("system_locked", { mode: "boolean" }).notNull().default(true), ...timestamps,
});
