package com.vntech.erp.application.rbac;

import java.util.List;
import java.util.Map;

/**
 * BẢN ĐỒ action -> module/capability (RBAC) — SINH TỰ ĐỘNG từ ACTION_CATALOG.json
 * (nguồn: ACTION_MODULE + ACTION_CAPABILITY của scripts/system-route.mjs).
 * Dùng bởi RbacService.requireActionModule — port nguyên trạng JS.
 */
public final class ActionRbacRegistry {

    private ActionRbacRegistry() { }

    private static final Map<String, List<String>> ACTION_MODULES = Map.ofEntries(
            Map.entry("add_work_item_comment", List.of("dept_plan_tasks", "dept_project_tasks", "dept_plan_assign", "dept_project_assign")),
            Map.entry("approve_central_return", List.of("central_warehouse")),
            Map.entry("approve_construction_daily_log", List.of("construction")),
            // TASK-135 (21/09/2026) — SỬA LỖI ĐO ĐƯỢC: `approve_po` khai MODULE RỖNG ⇒ rơi vào nhánh
            // «mặc định từ chối» của RbacService.requireActionModule (PHASE 0B) ⇒ 403 «Thao tác chưa
            // được khai báo quyền…» cho MỌI user không phải admin/C-level, dù họ có quyền `purchasing`.
            // Bằng chứng LIVE (jar 21/09 11:10, probe `tools/probe-wf-muahang-standard.mjs --apply`):
            // B6b `nvkhdemo` gọi `approve_po` ⇒ 403, trong khi B6a `create_po` của CÙNG user ⇒ 200.
            // Tiền lệ ĐÚNG chuẩn cùng module: `create_po` (:54) và `close_po_line` (:48) = `purchasing`.
            // ⛔ 0 khoá `module_catalog` mới — chỉ dùng khoá SẴN CÓ `purchasing`.
            Map.entry("approve_po", List.of("purchasing")),
            Map.entry("approve_production_report", List.of("production")),
            Map.entry("approve_site_expense_claim", List.of("dept_finance_site_cost")),
            Map.entry("approve_stock_count", List.of("stocktake")),
            // TASK-132 (21/09/2026) — action MỚI cho WF-XUATKHO-01 BƯỚC ② (CHT duyệt phiếu xuất).
            // Cổng MODULE dùng lại module SẴN CÓ `approvals` (+ `canApprove`) — ⛔ 0 khoá `module_catalog`
            // mới: quyền thật của bước này do cổng VAI TRÒ `requireRole(["commander","admin"])` trong
            // `StockManagementUseCase.approveStockIssue` quyết định. Đo MySQL: `cha.ht` có
            // `approvals.can_approve=1` còn `warehouse_issue.can_approve=0` ⇒ nếu khai module
            // `warehouse_issue` thì chính CHT sẽ bị 403 oan.
            Map.entry("approve_stock_issue", List.of("approvals")),
            // TASK-133 (21/09/2026) — 3 action MỚI cho WF-XUATKHO-01 BƯỚC ③④⑤. Cổng MODULE dùng lại các
            // khoá SẴN CÓ trong `module_catalog` (⛔ 0 khoá mới): ③④ dùng `warehouse_issue` (đúng module
            // của `issue_stock` — cùng nghiệp vụ xuất kho), ⑤ dùng `receiving` (đúng module của
            // `receive_goods` — cùng nghiệp vụ TẠO phiếu nhập). Quyền THẬT vẫn do cổng VAI TRÒ
            // `requireRole(...)` trong `StockManagementUseCase` quyết định (khuôn TASK-132).
            Map.entry("issue_stock_confirm", List.of("warehouse_issue")),
            Map.entry("confirm_stock_issue", List.of("warehouse_issue")),
            Map.entry("create_issue_grn", List.of("receiving")),
            // MT2 §7.4 — sinh phiếu nhập từ **LỆNH ĐIỀU CHUYỂN (STO)**: DÙNG LẠI khoá module
            // SẴN CÓ `receiving` (⛔ 0 module mới, ⛔ 0 khoá `module_catalog` mới) — cùng nghiệp vụ TẠO phiếu nhập.
            Map.entry("create_transfer_grn", List.of("receiving")),
            // MT2 §13.1 — «Thêm tab Thông báo» trong màn **Quản trị** ⇒ 2 action cấu hình gác bằng module
            // SẴN CÓ `admin` (⛔ 0 module mới, ⛔ 0 khoá `module_catalog` mới).
            Map.entry("save_notification_config", List.of("admin")),
            // MT2-P3-02 §13.1 — CRUD: **Danh sách (R)** và **Xoá (D)** của tab Thông báo (màn Quản trị).
            Map.entry("notification_configs", List.of("admin")),
            Map.entry("notification_log", List.of("admin")),
            Map.entry("delete_notification_config", List.of("admin")),
            Map.entry("set_notification_config_status", List.of("admin")),
            // MT2 §14 — «Login → Check notifications by userID»: MỌI user đã đăng nhập phải đánh dấu đọc
            // được thông báo CỦA CHÍNH MÌNH ⇒ dùng mẫu `List.of()` = KHÔNG gác module (khuôn `bulk_import_projects`).
            // ⛔ KHÔNG gác bằng module nghiệp vụ nào: nếu gác, user không có module đó sẽ KHÔNG đọc được thông báo.
            Map.entry("mark_notification_read", List.of()),
            Map.entry("mark_notification_snooze", List.of()),
            // MT2 §14 — «Đánh dấu TẤT CẢ đã đọc» NHƯNG chỉ cho CHÍNH user (⛔ không global).
            Map.entry("mark_notification_all_read", List.of()),
            Map.entry("approve_team_production", List.of("teams")),
            Map.entry("approve_transfer_order", List.of("inventory")),
            Map.entry("bulk_boq_item_action", List.of("boq")),
            Map.entry("bulk_import_projects", List.of()),
            Map.entry("bulk_import_users", List.of()),
            Map.entry("bulk_material_subcategory_action", List.of("material_catalog")),
            Map.entry("cancel_request", List.of("requests")),
            Map.entry("change_password", List.of()),
            Map.entry("check_material_alias_conflicts", List.of("material_catalog")),
            Map.entry("clear_boq_version", List.of("boq")),
            Map.entry("close_po_line", List.of("purchasing")),
            Map.entry("compare_boq_materials", List.of("material_catalog", "boq")),
            Map.entry("confirm_boq_material_mappings", List.of("material_catalog", "boq")),
            Map.entry("confirm_delivery", List.of("receiving", "warehouse_receipt")),
            Map.entry("confirm_installation", List.of("teams")),
            Map.entry("create_central_return", List.of("central_warehouse")),
            Map.entry("create_po", List.of("purchasing")),
            Map.entry("create_project", List.of()),
            // MT2-P14-03c (23/09/2026) — SỬA LỖI CHẶN OAN «CHỈ HUY TRƯỞNG»:
            // JS `scripts/system-route.mjs:1699` mở action này bằng `requireRole(user,["commander","admin"])`
            // (⛔ KHÔNG module-gate) ⇒ `commander` ĐƯỢC tạo tổ đội. Nhưng registry để `List.of()` = MẶC ĐỊNH TỪ CHỐI
            // ⇒ `SystemController:225` chặn 403 TRƯỚC khi use case kịp gọi `requireRole(["commander","admin"])`
            // ⇒ **commander ⛔ không tạo được tổ đội** (lệch JS). Nay mở bằng module `site_command` (module THẬT của
            // phân hệ Tổ đội) ⇒ commander có `site_command.canUse` qua được cả 2 cổng (module + requireRole);
            // ⛔ KHÔNG nới cho 2 action còn lại (xem `delete_project_team`/`set_project_team_status` — JS chỉ cho admin).
            Map.entry("create_project_team", List.of("site_command")),
            Map.entry("create_request", List.of("requests")),
            Map.entry("create_stock_count", List.of("stocktake")),
            Map.entry("create_transfer_order", List.of("inventory")),
            Map.entry("create_user", List.of()),
            Map.entry("create_work_item", List.of("dept_plan_assign", "dept_project_assign")),
            Map.entry("decide_approval", List.of("approvals")),
            Map.entry("delete_accounting_voucher", List.of("dept_finance_documents")),
            Map.entry("delete_advance_request", List.of("dept_finance_advance")),
            Map.entry("delete_approval_stage", List.of()),
            Map.entry("delete_benefit_record", List.of("dept_legal_benefits")),
            Map.entry("delete_boq_item", List.of("boq")),
            Map.entry("delete_business_role_group", List.of()),
            Map.entry("delete_business_scope", List.of()),
            Map.entry("delete_capital_recovery", List.of("capital_recovery")),
            Map.entry("delete_cashbook_entry", List.of("dept_finance_cashbank")),
            Map.entry("delete_construction_daily_log", List.of("construction")),
            Map.entry("delete_contract_payment", List.of("payments")),
            Map.entry("delete_correspondence", List.of("dept_legal_correspondence")),
            // MT2-P14-03c (23/09/2026) — BỔ SUNG KHOÁ CÒN THIẾU: action này CHỈ dành cho admin
            // (`SystemController:413` gọi `requireRequireAdmin`) và trước đây ⛔ **không có dòng nào** trong registry
            // ⇒ rơi vào nhánh `getOrDefault(..., List.of())` = MẶC ĐỊNH TỪ CHỐI. Hành vi vẫn AN TOÀN (fail-closed),
            // nhưng thiếu khai báo ⇒ ① hợp đồng `ad08` báo đỏ ② audit coverage không phân loại được action.
            // Nay khai tường minh `List.of()` = nhóm «admin-only» đúng quy ước tệp này.
            Map.entry("delete_department_permission", List.of()),
            Map.entry("delete_form_field_config", List.of()),
            Map.entry("delete_labor_contract", List.of("dept_legal_labor")),
            Map.entry("delete_legal_document", List.of("dept_legal_documents")),
            Map.entry("delete_material", List.of("material_catalog")),
            Map.entry("delete_material_category", List.of()),
            Map.entry("delete_material_norm", List.of("material_norms")),
            Map.entry("delete_material_subcategory", List.of()),
            Map.entry("delete_menu_group", List.of()),
            Map.entry("delete_partner", List.of("supplier_catalog")),
            Map.entry("delete_payment_plan", List.of("dept_finance_payment_plan")),
            Map.entry("delete_project", List.of()),
            Map.entry("delete_project_contract", List.of("boq")),
            Map.entry("delete_project_team", List.of()),
            Map.entry("delete_request", List.of("requests")),
            Map.entry("delete_role_catalog", List.of()),
            Map.entry("delete_seal", List.of("dept_legal_seal")),
            Map.entry("delete_selected_materials", List.of("material_catalog")),
            // MT2-P14-03c (23/09/2026) — 5 action của màn «Cấp bậc hệ thống» TRƯỚC ĐÂY ⛔ KHÔNG có dòng nào
            // trong registry (đo: grep `system_level` trong tệp này = 0) ⇒ rơi vào `getOrDefault(..., List.of())`
            // = MẶC ĐỊNH TỪ CHỐI. Hành vi vẫn AN TOÀN vì `SystemController:423-443` gác bằng `requireRequireAdmin`
            // (admin qua, người khác 403) — nhưng thiếu khai báo ⇒ ① hợp đồng `ad10` đỏ ② audit coverage không
            // phân loại được. Nay khai tường minh nhóm ADMIN-ONLY đúng quy ước tệp.
            Map.entry("delete_system_level", List.of()),
            Map.entry("delete_site_expense_claim", List.of("dept_finance_site_cost")),
            Map.entry("delete_supplier", List.of("supplier_catalog")),
            Map.entry("delete_unused_materials", List.of("material_catalog")),
            Map.entry("delete_user", List.of()),
            Map.entry("delete_user_module_override", List.of()),
            Map.entry("estimate_material_norms", List.of("material_norms")),
            Map.entry("factory_reset_execute", List.of("admin")),
            Map.entry("factory_reset_preview", List.of("admin")),
            Map.entry("import_contract_payments", List.of("payments")),
            Map.entry("import_material_catalog", List.of()),
            Map.entry("install_license_foundation", List.of("admin")),
            Map.entry("issue_stock", List.of("teams", "warehouse_issue")),
            Map.entry("login", List.of()),
            Map.entry("logout", List.of()),
            Map.entry("mark_task_notification_read", List.of("dept_plan_tasks", "dept_project_tasks")),
            Map.entry("merge_material_master", List.of("material_catalog")),
            Map.entry("preview_material_dependencies", List.of("material_catalog")),
            Map.entry("preview_request_import", List.of("requests")),
            Map.entry("reassign_work_item", List.of("dept_plan_assign", "dept_project_assign")),
            Map.entry("receive_central_return", List.of("central_warehouse")),
            Map.entry("receive_goods", List.of("receiving", "warehouse_receipt")),
            Map.entry("receive_transfer_order", List.of("inventory")),
            Map.entry("reconcile_contract_stock", List.of("inventory")),
            // TASK-135 — `reject_po` khai MODULE RỖNG ⇒ 403 «chưa khai báo quyền» (cùng lỗi với `approve_po`).
            // Từ chối PO là quyết định trên CÙNG chứng từ PO ⇒ khai cùng module SẴN CÓ `purchasing`.
            Map.entry("reject_po", List.of("purchasing")),
            Map.entry("reorder_form_fields", List.of()),
            Map.entry("reorder_menu_layout", List.of()),
            Map.entry("replace_boq_items", List.of("boq")),
            Map.entry("request_license_transfer", List.of("admin")),
            Map.entry("request_material_master_from_boq", List.of("material_catalog", "boq")),
            Map.entry("reset_material_catalog_test", List.of("material_catalog")),
            Map.entry("reset_user_password", List.of()),
            Map.entry("resubmit_request", List.of("requests")),
            Map.entry("retry_email", List.of()),
            Map.entry("return_stock", List.of("teams", "stocktake")),
            Map.entry("reverse_stock_movement", List.of("inventory", "stocktake")),
            Map.entry("revoke_session", List.of()),
            Map.entry("revoke_user_sessions", List.of()),
            Map.entry("save_accounting_voucher", List.of("dept_finance_documents")),
            Map.entry("save_advance_request", List.of("dept_finance_advance")),
            Map.entry("save_approval_stage", List.of()),
            Map.entry("save_bank_account", List.of("dept_finance_cashbank")),
            Map.entry("save_benefit_record", List.of("dept_legal_benefits")),
            Map.entry("save_boq_item", List.of("boq")),
            Map.entry("save_boq_version", List.of("boq")),
            Map.entry("save_business_role_group", List.of()),
            Map.entry("save_business_scope", List.of()),
            Map.entry("save_capital_recovery", List.of("capital_recovery")),
            Map.entry("save_cashbook_entry", List.of("dept_finance_cashbank")),
            Map.entry("save_construction_daily_log", List.of("construction")),
            Map.entry("save_contract_payment", List.of("payments")),
            Map.entry("save_correspondence", List.of("dept_legal_correspondence")),
            Map.entry("save_email_settings", List.of()),
            Map.entry("save_engine_role_profile", List.of()),
            Map.entry("save_form_field_config", List.of()),
            Map.entry("save_hr_record", List.of("dept_legal_hr")),
            Map.entry("save_labor_contract", List.of("dept_legal_labor")),
            Map.entry("save_legal_document", List.of("dept_legal_documents")),
            Map.entry("save_mar_approval", List.of("boq", "purchasing")),
            Map.entry("save_material", List.of("material_catalog")),
            Map.entry("save_material_category", List.of()),
            Map.entry("save_material_external_code", List.of("material_catalog")),
            Map.entry("save_material_norm", List.of("material_norms")),
            Map.entry("save_material_subcategory", List.of()),
            Map.entry("save_material_uom_conversion", List.of("material_catalog")),
            Map.entry("save_menu_group", List.of()),
            Map.entry("save_module_catalog", List.of()),
            Map.entry("save_organization_unit", List.of()),
            Map.entry("save_partner", List.of("supplier_catalog")),
            Map.entry("save_payment_plan", List.of("dept_finance_payment_plan")),
            Map.entry("save_production_report", List.of("production")),
            Map.entry("save_project_contract", List.of("boq")),
            Map.entry("save_role_catalog", List.of()),
            Map.entry("save_seal", List.of("dept_legal_seal")),
            Map.entry("save_site_expense_claim", List.of("dept_finance_site_cost")),
            Map.entry("save_supplier", List.of("supplier_catalog")),
            // MT2-P3-05 §6.3/§6.4 — vật tư của nhà cung cấp: cùng module **`supplier_catalog`**
            // như `save_supplier` (⛔ 0 module mới).
            Map.entry("save_supplier_material", List.of("supplier_catalog")),
            // MT2-P4-03 (§4.1) — card «Chờ Giám đốc duyệt»: ĐỌC vùng duyệt ⇒ module **`approvals`**
            // (ĐO: `decide_approval` :86 · `approve_stock_issue` :36 đều dùng `List.of("approvals")`) — ⛔ 0 module mới.
            // ⚠️ Điều kiện «admin HOẶC ≥ trưởng phòng» (§4.1:51) do **USE-CASE** chặn 403 (2 LỚP đúng ý đồ).
            Map.entry("director_pending_approvals", List.of("approvals")),
            // ⚠️ MT2-P4-05 VÁ LỖI CỦA MT2-P3-05: `case "supplier_materials"` (Tab 3) đã thêm ở controller
            // nhưng ⛔ **quên khai khoá** ⇒ `required.isEmpty()` = **default-DENY** ⇒ user có module
            // `supplier_catalog` bị **403 NHẦM** khi xem danh sách vật tư NCC (test P3-05 vẫn xanh vì gọi bằng admin).
            Map.entry("supplier_materials", List.of("supplier_catalog")),
            // ⚠️ MT2-P4-05 bước ② — 4 action thiếu khai báo (bằng chứng: `requireAdmin` ⛔ KHÔNG có trong thân case
            // ⇒ `required.isEmpty()` = default-DENY ⇒ user hợp lệ bị **403 NHẦM**).
            // · `save/set_status/delete_workflow`: quản lý **định nghĩa quy trình** ở màn Quản trị
            //   (`WorkflowModal.tsx:79` · `page.tsx:2194-2195`); `module_catalog` ⛔ không có module `workflow`
            //   ⇒ dùng **`admin`** (đúng nhóm "Quản trị/Danh mục", ⛔ 0 module mới).
            Map.entry("save_workflow", List.of("admin")),
            Map.entry("set_workflow_status", List.of("admin")),
            Map.entry("delete_workflow", List.of("admin")),
            // · `create_self_work_item` (`WorkCenter.tsx:216`): SOI GƯƠNG `mark_task_notification_read` —
            //   đăng ký **2 module** để ai có 1 trong 2 đều làm được (⛔ không tự đặt luật mới).
            Map.entry("create_self_work_item", List.of("dept_plan_tasks", "dept_project_tasks")),
            Map.entry("supplier_material_gaps", List.of("supplier_catalog")),
            Map.entry("save_system_level", List.of()),
            Map.entry("save_team_payment", List.of("teams")),
            Map.entry("save_team_production", List.of("teams")),
            Map.entry("save_team_subcontract", List.of("teams")),
            Map.entry("save_trust_development_settings", List.of()),
            Map.entry("save_ui_display_settings", List.of()),
            Map.entry("save_user_access", List.of()),
            Map.entry("save_warehouse_location", List.of("inventory", "central_warehouse")),
            Map.entry("set_approval_stage_status", List.of()),
            Map.entry("set_benefit_record_status", List.of("dept_legal_benefits")),
            Map.entry("set_boq_item_status", List.of("boq")),
            Map.entry("set_business_role_group_status", List.of()),
            Map.entry("set_business_scope_status", List.of()),
            Map.entry("set_correspondence_status", List.of("dept_legal_correspondence")),
            Map.entry("set_labor_contract_status", List.of("dept_legal_labor")),
            Map.entry("set_legal_document_status", List.of("dept_legal_documents")),
            Map.entry("set_material_category_status", List.of()),
            Map.entry("set_material_norm_status", List.of("material_norms")),
            Map.entry("set_material_status", List.of("material_catalog")),
            Map.entry("set_material_subcategory_status", List.of()),
            Map.entry("set_menu_group_status", List.of()),
            Map.entry("set_module_status", List.of()),
            Map.entry("set_organization_unit_member", List.of("site_command")),
            Map.entry("set_organization_unit_status", List.of()),
            Map.entry("set_partner_status", List.of("supplier_catalog")),
            Map.entry("set_payment_plan_status", List.of("dept_finance_payment_plan")),
            Map.entry("set_project_contract_status", List.of("boq")),
            Map.entry("set_project_status", List.of("admin")),
            Map.entry("set_project_team_status", List.of()),
            Map.entry("set_role_status", List.of()),
            Map.entry("set_seal_status", List.of("dept_legal_seal")),
            Map.entry("set_supplier_status", List.of("supplier_catalog")),
            Map.entry("set_system_level_status", List.of()),
            Map.entry("set_user_status", List.of()),
            Map.entry("set_user_system_level", List.of()),
            Map.entry("set_work_item_participant", List.of("dept_plan_assign", "dept_project_assign")),
            Map.entry("system_level_impact", List.of()),
            Map.entry("settle_advance_request", List.of("dept_finance_advance")),
            Map.entry("settle_team_subcontract", List.of("teams")),
            Map.entry("setup", List.of()),
            Map.entry("ship_transfer_order", List.of("inventory")),
            Map.entry("transfer_contract_ownership", List.of("inventory")),
            Map.entry("update_boq_contract_prices", List.of("boq")),
            // TASK-135 — `update_po_price` khai MODULE RỖNG ⇒ 403 «chưa khai báo quyền» (cùng lỗi).
            // Sửa ĐƠN GIÁ của chính PO ⇒ khai module SẴN CÓ `purchasing` (cùng `create_po`/`close_po_line`).
            Map.entry("update_po_price", List.of("purchasing")),
            Map.entry("update_profile_avatar", List.of()),
            Map.entry("update_project", List.of()),
            Map.entry("update_returned_request", List.of("requests")),
            Map.entry("update_user", List.of()),
            Map.entry("update_work_item_progress", List.of("dept_plan_tasks", "dept_project_tasks")),
            Map.entry("update_work_item_status", List.of("dept_plan_tasks", "dept_project_tasks", "dept_plan_assign", "dept_project_assign"))
    );

    private static final Map<String, String> ACTION_CAPABILITIES = Map.ofEntries(
            Map.entry("add_work_item_comment", "canUse"),
            Map.entry("approve_central_return", "canApprove"),
            Map.entry("approve_construction_daily_log", "canApprove"),
            // TASK-135 — duyệt PO = HÀNH VI PHÊ DUYỆT ⇒ `canApprove` (trước: `canUse`).
            // Tiền lệ cùng module `purchasing`: `close_po_line` (:234) = `canApprove` ✔ (duyệt/đóng dòng PO).
            // Suy ra từ quy ước của chính bản đồ này: MỌI `approve_*` khác đều `canApprove`
            // (approve_central_return/approve_construction_daily_log/approve_production_report/
            //  approve_site_expense_claim/approve_stock_count/approve_transfer_order).
            Map.entry("approve_po", "canApprove"),
            Map.entry("approve_production_report", "canApprove"),
            Map.entry("approve_site_expense_claim", "canApprove"),
            Map.entry("approve_stock_count", "canApprove"),
            Map.entry("approve_stock_issue", "canApprove"), // TASK-132 — bước ② WF-XUATKHO-01
            Map.entry("approve_team_production", "canUse"),
            Map.entry("approve_transfer_order", "canApprove"),
            Map.entry("bulk_boq_item_action", "canEdit"),
            Map.entry("bulk_import_projects", "canUse"),
            Map.entry("bulk_import_users", "canUse"),
            Map.entry("bulk_material_subcategory_action", "canEdit"),
            Map.entry("cancel_request", "canEdit"),
            Map.entry("change_password", "canUse"),
            Map.entry("check_material_alias_conflicts", "canView"),
            Map.entry("clear_boq_version", "canEdit"),
            Map.entry("close_po_line", "canApprove"),
            Map.entry("compare_boq_materials", "canUse"),
            Map.entry("confirm_boq_material_mappings", "canApprove"),
            Map.entry("confirm_delivery", "canApprove"),
            Map.entry("confirm_installation", "canEdit"),
            // TASK-133 — ④ thủ kho xác nhận đã xuất đủ (cập nhật trạng thái phiếu xuất ⇒ canEdit).
            Map.entry("confirm_stock_issue", "canEdit"),
            Map.entry("create_central_return", "canCreate"),
            // TASK-133 — ⑤ sinh GRN nhập kho khác: chỉ cần QUYỀN TẠO (đúng đặc tả «không cần duyệt»).
            Map.entry("create_issue_grn", "canCreate"),
            // MT2 §7.4 — sinh GRN từ lệnh điều chuyển: cũng chỉ cần QUYỀN TẠO (⛔ không vòng duyệt).
            Map.entry("create_transfer_grn", "canCreate"),
            // MT2 §13.1/§13.2 — tạo/sửa và bật/tắt cấu hình thông báo (tab Thông báo của màn Quản trị).
            Map.entry("save_notification_config", "canCreate"),
            Map.entry("notification_configs", "canView"),
            // MT2-P4-05 VÁ THIẾU: `notification_log` khai module `admin` nhưng ⛔ THIẾU capability ⇒ rơi về
            // mặc định `canUse`, trong khi đây là thao tác ĐỌC (soi gương `notification_configs` = canView).
            Map.entry("notification_log", "canView"),
            Map.entry("delete_notification_config", "canEdit"),
            Map.entry("set_notification_config_status", "canEdit"),
            Map.entry("mark_notification_read", "canView"),
            Map.entry("mark_notification_snooze", "canView"),
            Map.entry("mark_notification_all_read", "canView"),
            Map.entry("create_po", "canCreate"),
            Map.entry("create_project", "canUse"),
            Map.entry("create_project_team", "canUse"),
            Map.entry("create_request", "canCreate"),
            Map.entry("create_stock_count", "canCreate"),
            Map.entry("create_transfer_order", "canCreate"),
            Map.entry("create_user", "canUse"),
            Map.entry("create_work_item", "canCreate"),
            Map.entry("decide_approval", "canApprove"),
            Map.entry("delete_accounting_voucher", "canEdit"),
            Map.entry("delete_advance_request", "canEdit"),
            Map.entry("delete_approval_stage", "canUse"),
            Map.entry("delete_benefit_record", "canEdit"),
            Map.entry("delete_boq_item", "canEdit"),
            Map.entry("delete_business_role_group", "canUse"),
            Map.entry("delete_business_scope", "canUse"),
            Map.entry("delete_capital_recovery", "canEdit"),
            Map.entry("delete_cashbook_entry", "canEdit"),
            Map.entry("delete_construction_daily_log", "canEdit"),
            Map.entry("delete_contract_payment", "canEdit"),
            Map.entry("delete_correspondence", "canEdit"),
            Map.entry("delete_form_field_config", "canUse"),
            Map.entry("delete_labor_contract", "canEdit"),
            Map.entry("delete_legal_document", "canEdit"),
            Map.entry("delete_material", "canEdit"),
            Map.entry("delete_material_category", "canUse"),
            Map.entry("delete_material_norm", "canEdit"),
            Map.entry("delete_material_subcategory", "canUse"),
            Map.entry("delete_menu_group", "canUse"),
            Map.entry("delete_partner", "canEdit"),
            Map.entry("delete_payment_plan", "canEdit"),
            Map.entry("delete_project", "canUse"),
            Map.entry("delete_project_contract", "canEdit"),
            Map.entry("delete_project_team", "canUse"),
            Map.entry("delete_request", "canEdit"),
            Map.entry("delete_role_catalog", "canUse"),
            Map.entry("delete_seal", "canEdit"),
            Map.entry("delete_selected_materials", "canEdit"),
            Map.entry("delete_system_level", "canUse"),
            Map.entry("delete_site_expense_claim", "canEdit"),
            Map.entry("delete_supplier", "canEdit"),
            Map.entry("delete_unused_materials", "canEdit"),
            Map.entry("delete_user", "canUse"),
            Map.entry("delete_user_module_override", "canUse"),
            Map.entry("estimate_material_norms", "canUse"),
            Map.entry("factory_reset_execute", "canEdit"),
            Map.entry("factory_reset_preview", "canView"),
            Map.entry("import_contract_payments", "canCreate"),
            Map.entry("import_material_catalog", "canUse"),
            Map.entry("install_license_foundation", "canUse"),
            Map.entry("issue_stock", "canCreate"),
            // TASK-133 — ③ tiến hành xuất kho. Capability chọn `canCreate` (KHÔNG phải `canEdit`) vì đây
            // là CÙNG một hành vi nghiệp vụ với `issue_stock` («thực hiện cấp phát/xuất kho») và vì DỮ
            // LIỆU THẬT của vai trò thủ kho: đo `user_module_permissions` trên MySQL ⇒ `tkhodemo`
            // (thu_kho) có `warehouse_issue.can_create=1` nhưng `can_edit=0`; nếu khai `canEdit` thì chính
            // thủ kho — người ĐÚNG vai trò của bước ③ — bị 403 oan, y hệt cái bẫy TASK-132 đã gặp với
            // `approvals.canApprove` của CHT. Bước ④ vẫn giữ `canEdit` vì đó là bước XÁC NHẬN trạng thái.
            Map.entry("issue_stock_confirm", "canCreate"),
            Map.entry("login", "canUse"),
            Map.entry("logout", "canUse"),
            Map.entry("mark_task_notification_read", "canView"),
            Map.entry("merge_material_master", "canEdit"),
            Map.entry("preview_material_dependencies", "canView"),
            Map.entry("preview_request_import", "canCreate"),
            Map.entry("reassign_work_item", "canEdit"),
            Map.entry("receive_central_return", "canApprove"),
            Map.entry("receive_goods", "canCreate"),
            Map.entry("receive_transfer_order", "canApprove"),
            Map.entry("reconcile_contract_stock", "canApprove"),
            // TASK-135 — TỪ CHỐI PO = hành vi phê duyệt (âm) ⇒ `canApprove` (trước: `canUse`).
            // Cùng cổng với `approve_po`: JS `decidePo()` dùng CHUNG một nhánh cho duyệt và từ chối ⇒
            // nếu tách quyền thì người có quyền duyệt lại không thể từ chối (vô lý nghiệp vụ).
            Map.entry("reject_po", "canApprove"),
            Map.entry("reorder_form_fields", "canUse"),
            Map.entry("reorder_menu_layout", "canUse"),
            Map.entry("replace_boq_items", "canEdit"),
            Map.entry("request_license_transfer", "canUse"),
            Map.entry("request_material_master_from_boq", "canCreate"),
            Map.entry("reset_material_catalog_test", "canEdit"),
            Map.entry("reset_user_password", "canUse"),
            Map.entry("resubmit_request", "canEdit"),
            Map.entry("retry_email", "canUse"),
            Map.entry("return_stock", "canCreate"),
            Map.entry("reverse_stock_movement", "canApprove"),
            Map.entry("revoke_session", "canUse"),
            Map.entry("revoke_user_sessions", "canUse"),
            Map.entry("save_accounting_voucher", "canCreate"),
            Map.entry("save_advance_request", "canCreate"),
            Map.entry("save_approval_stage", "canUse"),
            Map.entry("save_bank_account", "canCreate"),
            Map.entry("save_benefit_record", "canCreate"),
            Map.entry("save_boq_item", "canEdit"),
            Map.entry("save_boq_version", "canEdit"),
            Map.entry("save_business_role_group", "canUse"),
            Map.entry("save_business_scope", "canUse"),
            Map.entry("save_capital_recovery", "canCreate"),
            Map.entry("save_cashbook_entry", "canCreate"),
            Map.entry("save_construction_daily_log", "canCreate"),
            Map.entry("save_contract_payment", "canCreate"),
            Map.entry("save_correspondence", "canCreate"),
            Map.entry("save_email_settings", "canUse"),
            Map.entry("save_engine_role_profile", "canUse"),
            Map.entry("save_form_field_config", "canUse"),
            Map.entry("save_hr_record", "canCreate"),
            Map.entry("save_labor_contract", "canCreate"),
            Map.entry("save_legal_document", "canCreate"),
            Map.entry("save_mar_approval", "canApprove"),
            Map.entry("save_material", "canEdit"),
            Map.entry("save_material_category", "canUse"),
            Map.entry("save_material_external_code", "canEdit"),
            Map.entry("save_material_norm", "canCreate"),
            Map.entry("save_material_subcategory", "canUse"),
            Map.entry("save_material_uom_conversion", "canEdit"),
            Map.entry("save_menu_group", "canUse"),
            Map.entry("save_module_catalog", "canUse"),
            Map.entry("save_organization_unit", "canUse"),
            Map.entry("save_partner", "canEdit"),
            Map.entry("save_payment_plan", "canCreate"),
            Map.entry("save_production_report", "canCreate"),
            Map.entry("save_project_contract", "canEdit"),
            Map.entry("save_role_catalog", "canUse"),
            Map.entry("save_seal", "canCreate"),
            Map.entry("save_site_expense_claim", "canCreate"),
            Map.entry("save_supplier", "canEdit"),
            Map.entry("save_supplier_material", "canEdit"),
            // MT2-P4-03 — hành động **ĐỌC** ⇒ `canView` (⛔ KHÔNG `canApprove` ✗; điều kiện cấp bậc do use-case chặn 403).
            Map.entry("director_pending_approvals", "canView"),
            Map.entry("supplier_materials", "canView"),
            Map.entry("save_workflow", "canCreate"),
            Map.entry("set_workflow_status", "canEdit"),
            Map.entry("delete_workflow", "canEdit"),
            Map.entry("create_self_work_item", "canUse"),
            Map.entry("supplier_material_gaps", "canUse"),
            Map.entry("save_system_level", "canUse"),
            Map.entry("save_team_payment", "canUse"),
            Map.entry("save_team_production", "canUse"),
            Map.entry("save_team_subcontract", "canUse"),
            Map.entry("save_trust_development_settings", "canUse"),
            Map.entry("save_ui_display_settings", "canUse"),
            Map.entry("save_user_access", "canUse"),
            Map.entry("save_warehouse_location", "canEdit"),
            Map.entry("set_approval_stage_status", "canUse"),
            Map.entry("set_benefit_record_status", "canEdit"),
            Map.entry("set_boq_item_status", "canEdit"),
            Map.entry("set_business_role_group_status", "canUse"),
            Map.entry("set_business_scope_status", "canUse"),
            Map.entry("set_correspondence_status", "canEdit"),
            Map.entry("set_labor_contract_status", "canEdit"),
            Map.entry("set_legal_document_status", "canEdit"),
            Map.entry("set_material_category_status", "canUse"),
            Map.entry("set_material_norm_status", "canEdit"),
            Map.entry("set_material_status", "canEdit"),
            Map.entry("set_material_subcategory_status", "canUse"),
            Map.entry("set_menu_group_status", "canUse"),
            Map.entry("set_module_status", "canUse"),
            Map.entry("set_organization_unit_member", "canEdit"),
            Map.entry("set_organization_unit_status", "canUse"),
            Map.entry("set_partner_status", "canEdit"),
            Map.entry("set_payment_plan_status", "canEdit"),
            Map.entry("set_project_contract_status", "canEdit"),
            Map.entry("set_project_status", "canEdit"),
            Map.entry("set_project_team_status", "canUse"),
            Map.entry("set_role_status", "canUse"),
            Map.entry("set_seal_status", "canEdit"),
            Map.entry("set_supplier_status", "canEdit"),
            Map.entry("set_system_level_status", "canUse"),
            Map.entry("set_user_status", "canUse"),
            Map.entry("set_user_system_level", "canUse"),
            Map.entry("set_work_item_participant", "canEdit"),
            Map.entry("system_level_impact", "canUse"),
            Map.entry("settle_advance_request", "canApprove"),
            Map.entry("settle_team_subcontract", "canUse"),
            Map.entry("setup", "canUse"),
            Map.entry("ship_transfer_order", "canEdit"),
            Map.entry("transfer_contract_ownership", "canApprove"),
            Map.entry("update_boq_contract_prices", "canEdit"),
            // TASK-135 — SỬA ĐƠN GIÁ bản ghi đã có ⇒ `canEdit` (trước: `canUse` — mặc định của JS vì
            // `update_po_price` KHÔNG có mặt trong ACTION_CAPABILITY của scripts/system-route.mjs).
            // CĂN CỨ (không đoán): tiền lệ ĐỒNG DẠNG NHẤT trong chính JS — `update_boq_contract_prices`
            // khai `canEdit` (system-route.mjs:34) và handler JS của nó CƯỠNG CHẾ
            // `canUseModule(user,"boq","canEdit")` với lỗi «Chưa được cấp quyền sửa BOQ/Hợp đồng.»
            // (system-route.mjs:3064) ⇒ sửa GIÁ = quyền SỬA ở cả nguồn JS. Java tương ứng
            // `update_boq_contract_prices` (:226 in file này) cũng = `canEdit`.
            // ⚠️ Hệ quả có chủ ý: user chỉ có `purchasing.can_use=1` (không `can_edit`) sẽ bị 403 —
            // đúng quy ước «sửa ⇒ canEdit»; nếu đặc tả muốn rộng hơn thì đổi lại `canUse` (1 dòng).
            Map.entry("update_po_price", "canEdit"),
            Map.entry("update_profile_avatar", "canUse"),
            Map.entry("update_project", "canUse"),
            Map.entry("update_returned_request", "canEdit"),
            Map.entry("update_user", "canUse"),
            Map.entry("update_work_item_progress", "canEdit"),
            Map.entry("update_work_item_status", "canEdit")
    );

    /** Module yêu cầu của action (rỗng = không gated theo module, như JS `!required`). */
    public static List<String> modulesFor(String action) {
        return ACTION_MODULES.getOrDefault(action, List.of());
    }

    /** Capability yêu cầu (canView/canUse/canCreate/canEdit/canApprove/canExport); mặc định canUse. */
    public static String capabilityFor(String action) {
        return ACTION_CAPABILITIES.getOrDefault(action, "canUse");
    }
}
