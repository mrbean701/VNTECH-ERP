CREATE TABLE `company_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`company_name` text NOT NULL,
	`stage_1_department` text DEFAULT 'BCH / Chỉ huy trưởng' NOT NULL,
	`stage_2_department` text DEFAULT 'Phòng Dự án' NOT NULL,
	`stage_3_department` text DEFAULT 'KH-MH / Tài chính' NOT NULL,
	`approval_sla_hours` integer DEFAULT 24 NOT NULL,
	`slow_moving_days` integer DEFAULT 60 NOT NULL,
	`negative_stock_blocked` integer DEFAULT true NOT NULL,
	`updated_by` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `material_return_items` (
	`id` text PRIMARY KEY NOT NULL,
	`return_id` text NOT NULL,
	`material_id` text NOT NULL,
	`quantity` real NOT NULL,
	`accepted_qty` real DEFAULT 0 NOT NULL,
	`rejected_qty` real DEFAULT 0 NOT NULL,
	`condition` text DEFAULT 'usable' NOT NULL,
	`reason` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`return_id`) REFERENCES `material_returns`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `material_return_items_return_idx` ON `material_return_items` (`return_id`);--> statement-breakpoint
CREATE TABLE `material_returns` (
	`id` text PRIMARY KEY NOT NULL,
	`return_no` text NOT NULL,
	`project_id` text NOT NULL,
	`team_id` text NOT NULL,
	`to_warehouse_id` text NOT NULL,
	`returned_by_name` text NOT NULL,
	`received_by` text,
	`returned_at` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`note` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`to_warehouse_id`) REFERENCES `warehouses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`received_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `material_returns_no_uidx` ON `material_returns` (`return_no`);--> statement-breakpoint
CREATE INDEX `material_returns_project_idx` ON `material_returns` (`project_id`,`returned_at`);--> statement-breakpoint
CREATE TABLE `request_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`request_id` text NOT NULL,
	`user_id` text NOT NULL,
	`comment` text NOT NULL,
	`visibility` text DEFAULT 'internal' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`request_id`) REFERENCES `material_requests`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `request_comments_request_idx` ON `request_comments` (`request_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` text NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_uidx` ON `sessions` (`token_hash`);--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `stock_issue_items` (
	`id` text PRIMARY KEY NOT NULL,
	`issue_id` text NOT NULL,
	`material_id` text NOT NULL,
	`request_item_id` text,
	`quantity` real NOT NULL,
	`installed_qty` real DEFAULT 0 NOT NULL,
	`work_package_code` text,
	`installation_area` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`issue_id`) REFERENCES `stock_issues`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`request_item_id`) REFERENCES `material_request_items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `stock_issue_items_issue_idx` ON `stock_issue_items` (`issue_id`);--> statement-breakpoint
CREATE INDEX `stock_issue_items_material_idx` ON `stock_issue_items` (`material_id`);--> statement-breakpoint
CREATE TABLE `stock_issues` (
	`id` text PRIMARY KEY NOT NULL,
	`issue_no` text NOT NULL,
	`project_id` text NOT NULL,
	`from_warehouse_id` text NOT NULL,
	`team_id` text NOT NULL,
	`request_id` text,
	`issued_by` text NOT NULL,
	`received_by_name` text NOT NULL,
	`approved_by` text,
	`issued_at` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`signed_at` text,
	`note` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`from_warehouse_id`) REFERENCES `warehouses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`request_id`) REFERENCES `material_requests`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`issued_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `stock_issues_no_uidx` ON `stock_issues` (`issue_no`);--> statement-breakpoint
CREATE INDEX `stock_issues_project_idx` ON `stock_issues` (`project_id`,`issued_at`);