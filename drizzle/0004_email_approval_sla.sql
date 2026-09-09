ALTER TABLE `company_settings` ADD `stage_1_sla_hours` integer DEFAULT 8 NOT NULL;
--> statement-breakpoint
ALTER TABLE `company_settings` ADD `stage_2_sla_hours` integer DEFAULT 8 NOT NULL;
--> statement-breakpoint
ALTER TABLE `company_settings` ADD `stage_3_sla_hours` integer DEFAULT 8 NOT NULL;
--> statement-breakpoint
ALTER TABLE `approvals` ADD `queued_at` text;
--> statement-breakpoint
ALTER TABLE `approvals` ADD `notified_at` text;
--> statement-breakpoint
ALTER TABLE `approvals` ADD `reminder_sent_at` text;
--> statement-breakpoint
UPDATE `approvals` SET `queued_at`=`created_at` WHERE `stage`=1 OR `decided_at` IS NOT NULL;
--> statement-breakpoint
UPDATE `approvals` SET `queued_at`=(SELECT previous.`decided_at` FROM `approvals` previous WHERE previous.`request_id`=`approvals`.`request_id` AND previous.`stage`=`approvals`.`stage`-1) WHERE `stage`>1 AND `queued_at` IS NULL AND EXISTS (SELECT 1 FROM `approvals` previous WHERE previous.`request_id`=`approvals`.`request_id` AND previous.`stage`=`approvals`.`stage`-1 AND previous.`decided_at` IS NOT NULL);
--> statement-breakpoint
CREATE TABLE `email_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`enabled` integer DEFAULT 0 NOT NULL,
	`smtp_host` text,
	`smtp_port` integer DEFAULT 587 NOT NULL,
	`security` text DEFAULT 'starttls' NOT NULL,
	`username` text,
	`password` text,
	`sender_email` text,
	`sender_name` text DEFAULT 'MEP Warehouse' NOT NULL,
	`base_url` text,
	`updated_by` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `approval_email_recipients` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`stage` integer NOT NULL,
	`emails` text NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `approval_email_recipients_scope_uidx` ON `approval_email_recipients` (`project_id`,`stage`);
--> statement-breakpoint
CREATE TABLE `email_outbox` (
	`id` text PRIMARY KEY NOT NULL,
	`request_id` text,
	`stage` integer,
	`event` text NOT NULL,
	`recipients` text NOT NULL,
	`subject` text NOT NULL,
	`text_body` text NOT NULL,
	`html_body` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`attempt_count` integer DEFAULT 0 NOT NULL,
	`next_attempt_at` text,
	`queued_at` text NOT NULL,
	`sent_at` text,
	`last_error` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`request_id`) REFERENCES `material_requests`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `email_outbox_queue_idx` ON `email_outbox` (`status`,`next_attempt_at`,`queued_at`);
--> statement-breakpoint
CREATE INDEX `email_outbox_request_idx` ON `email_outbox` (`request_id`,`stage`,`event`);
