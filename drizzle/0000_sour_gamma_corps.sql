CREATE TABLE `approvals` (
	`id` text PRIMARY KEY NOT NULL,
	`request_id` text NOT NULL,
	`stage` integer NOT NULL,
	`department` text NOT NULL,
	`approver_user_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`due_at` text,
	`decided_at` text,
	`comment` text,
	`decision_snapshot` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`request_id`) REFERENCES `material_requests`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`approver_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `approvals_request_stage_uidx` ON `approvals` (`request_id`,`stage`);--> statement-breakpoint
CREATE INDEX `approvals_queue_idx` ON `approvals` (`status`,`stage`,`due_at`);--> statement-breakpoint
CREATE TABLE `attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`file_name` text NOT NULL,
	`storage_key` text NOT NULL,
	`mime_type` text NOT NULL,
	`uploaded_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `attachments_entity_idx` ON `attachments` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`before_json` text,
	`after_json` text,
	`ip_address` text,
	`occurred_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `audit_logs_entity_idx` ON `audit_logs` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `audit_logs_user_date_idx` ON `audit_logs` (`user_id`,`occurred_at`);--> statement-breakpoint
CREATE TABLE `goods_receipt_items` (
	`id` text PRIMARY KEY NOT NULL,
	`receipt_id` text NOT NULL,
	`purchase_order_item_id` text NOT NULL,
	`received_qty` real NOT NULL,
	`accepted_qty` real DEFAULT 0 NOT NULL,
	`rejected_qty` real DEFAULT 0 NOT NULL,
	`lot_no` text,
	`qc_result` text DEFAULT 'pending' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`receipt_id`) REFERENCES `goods_receipts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`purchase_order_item_id`) REFERENCES `purchase_order_items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `goods_receipt_items_po_line_idx` ON `goods_receipt_items` (`purchase_order_item_id`);--> statement-breakpoint
CREATE TABLE `goods_receipts` (
	`id` text PRIMARY KEY NOT NULL,
	`receipt_no` text NOT NULL,
	`purchase_order_id` text NOT NULL,
	`warehouse_id` text NOT NULL,
	`received_by` text NOT NULL,
	`received_at` text NOT NULL,
	`delivery_note_no` text,
	`qc_status` text DEFAULT 'pending' NOT NULL,
	`document_status` text DEFAULT 'pending' NOT NULL,
	`posting_status` text DEFAULT 'unposted' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`received_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `goods_receipts_no_uidx` ON `goods_receipts` (`receipt_no`);--> statement-breakpoint
CREATE INDEX `goods_receipts_po_idx` ON `goods_receipts` (`purchase_order_id`);--> statement-breakpoint
CREATE TABLE `material_request_items` (
	`id` text PRIMARY KEY NOT NULL,
	`request_id` text NOT NULL,
	`line_no` integer NOT NULL,
	`material_id` text NOT NULL,
	`work_package_code` text,
	`boq_code` text,
	`route_tag` text,
	`installation_area` text,
	`requested_qty` real NOT NULL,
	`stock_allocation_qty` real DEFAULT 0 NOT NULL,
	`approved_purchase_qty` real DEFAULT 0 NOT NULL,
	`ordered_qty` real DEFAULT 0 NOT NULL,
	`received_qty` real DEFAULT 0 NOT NULL,
	`issued_qty` real DEFAULT 0 NOT NULL,
	`installed_qty` real DEFAULT 0 NOT NULL,
	`line_status` text DEFAULT 'pending' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`request_id`) REFERENCES `material_requests`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `request_items_line_uidx` ON `material_request_items` (`request_id`,`line_no`);--> statement-breakpoint
CREATE INDEX `request_items_material_idx` ON `material_request_items` (`material_id`);--> statement-breakpoint
CREATE TABLE `material_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`request_no` text NOT NULL,
	`project_id` text NOT NULL,
	`team_id` text,
	`source_warehouse_id` text,
	`requested_by` text NOT NULL,
	`requested_at` text NOT NULL,
	`needed_at` text NOT NULL,
	`priority` text DEFAULT 'normal' NOT NULL,
	`area` text NOT NULL,
	`purpose` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`approval_stage` integer DEFAULT 0 NOT NULL,
	`total_estimated_value` real DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_warehouse_id`) REFERENCES `warehouses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`requested_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `material_requests_no_uidx` ON `material_requests` (`request_no`);--> statement-breakpoint
CREATE INDEX `material_requests_project_status_idx` ON `material_requests` (`project_id`,`status`);--> statement-breakpoint
CREATE INDEX `material_requests_needed_idx` ON `material_requests` (`needed_at`);--> statement-breakpoint
CREATE TABLE `materials` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`system` text NOT NULL,
	`specification` text,
	`brand` text,
	`unit` text NOT NULL,
	`standard_price` real DEFAULT 0 NOT NULL,
	`min_stock` real DEFAULT 0 NOT NULL,
	`requires_cocq` integer DEFAULT false NOT NULL,
	`requires_mar` integer DEFAULT false NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `materials_code_uidx` ON `materials` (`code`);--> statement-breakpoint
CREATE INDEX `materials_system_idx` ON `materials` (`system`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`manager_user_id` text,
	`start_date` text,
	`planned_end_date` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_code_uidx` ON `projects` (`code`);--> statement-breakpoint
CREATE TABLE `purchase_order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`purchase_order_id` text NOT NULL,
	`request_item_id` text NOT NULL,
	`line_no` integer NOT NULL,
	`ordered_qty` real NOT NULL,
	`unit_price` real NOT NULL,
	`received_qty` real DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'ordered' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`request_item_id`) REFERENCES `material_request_items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `purchase_order_items_line_uidx` ON `purchase_order_items` (`purchase_order_id`,`line_no`);--> statement-breakpoint
CREATE INDEX `purchase_order_items_request_idx` ON `purchase_order_items` (`request_item_id`);--> statement-breakpoint
CREATE TABLE `purchase_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`po_no` text NOT NULL,
	`project_id` text NOT NULL,
	`supplier_id` text NOT NULL,
	`receiving_warehouse_id` text NOT NULL,
	`buyer_user_id` text NOT NULL,
	`ordered_at` text NOT NULL,
	`eta` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`total_value` real DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`receiving_warehouse_id`) REFERENCES `warehouses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`buyer_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `purchase_orders_no_uidx` ON `purchase_orders` (`po_no`);--> statement-breakpoint
CREATE INDEX `purchase_orders_project_status_idx` ON `purchase_orders` (`project_id`,`status`);--> statement-breakpoint
CREATE INDEX `purchase_orders_eta_idx` ON `purchase_orders` (`eta`);--> statement-breakpoint
CREATE TABLE `stock_count_items` (
	`id` text PRIMARY KEY NOT NULL,
	`stock_count_id` text NOT NULL,
	`material_id` text NOT NULL,
	`book_qty_snapshot` real NOT NULL,
	`actual_qty` real NOT NULL,
	`variance_qty` real NOT NULL,
	`reason` text,
	`approved_adjustment_qty` real DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`stock_count_id`) REFERENCES `stock_counts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `stock_count_items_uidx` ON `stock_count_items` (`stock_count_id`,`material_id`);--> statement-breakpoint
CREATE TABLE `stock_counts` (
	`id` text PRIMARY KEY NOT NULL,
	`count_no` text NOT NULL,
	`project_id` text NOT NULL,
	`warehouse_id` text NOT NULL,
	`count_type` text NOT NULL,
	`counted_at` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`approved_by` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `stock_counts_no_uidx` ON `stock_counts` (`count_no`);--> statement-breakpoint
CREATE INDEX `stock_counts_warehouse_date_idx` ON `stock_counts` (`warehouse_id`,`counted_at`);--> statement-breakpoint
CREATE TABLE `stock_movements` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`material_id` text NOT NULL,
	`from_warehouse_id` text,
	`to_warehouse_id` text,
	`movement_type` text NOT NULL,
	`quantity` real NOT NULL,
	`unit_cost` real DEFAULT 0 NOT NULL,
	`occurred_at` text NOT NULL,
	`reference_type` text NOT NULL,
	`reference_id` text NOT NULL,
	`posted_by` text NOT NULL,
	`reversal_of_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`from_warehouse_id`) REFERENCES `warehouses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`to_warehouse_id`) REFERENCES `warehouses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`posted_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `stock_movements_balance_idx` ON `stock_movements` (`project_id`,`material_id`,`to_warehouse_id`);--> statement-breakpoint
CREATE INDEX `stock_movements_reference_idx` ON `stock_movements` (`reference_type`,`reference_id`);--> statement-breakpoint
CREATE INDEX `stock_movements_date_idx` ON `stock_movements` (`occurred_at`);--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`tax_code` text,
	`contact_name` text,
	`phone` text,
	`lead_time_days` integer DEFAULT 0 NOT NULL,
	`rating` real DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `suppliers_code_uidx` ON `suppliers` (`code`);--> statement-breakpoint
CREATE TABLE `teams` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`trade` text NOT NULL,
	`project_id` text NOT NULL,
	`warehouse_id` text NOT NULL,
	`leader_user_id` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`leader_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `teams_code_uidx` ON `teams` (`code`);--> statement-breakpoint
CREATE INDEX `teams_project_idx` ON `teams` (`project_id`);--> statement-breakpoint
CREATE TABLE `user_project_scopes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`project_id` text NOT NULL,
	`permission` text DEFAULT 'read' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_project_scope_uidx` ON `user_project_scopes` (`user_id`,`project_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_code` text NOT NULL,
	`full_name` text NOT NULL,
	`username` text NOT NULL,
	`password_hash` text,
	`role` text NOT NULL,
	`department` text NOT NULL,
	`approval_limit` real DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_employee_code_uidx` ON `users` (`employee_code`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_uidx` ON `users` (`username`);--> statement-breakpoint
CREATE TABLE `warehouses` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`project_id` text,
	`parent_warehouse_id` text,
	`keeper_user_id` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`keeper_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `warehouses_code_uidx` ON `warehouses` (`code`);--> statement-breakpoint
CREATE INDEX `warehouses_project_idx` ON `warehouses` (`project_id`);