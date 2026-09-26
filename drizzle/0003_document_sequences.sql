CREATE TABLE `document_sequences` (
	`id` text PRIMARY KEY NOT NULL,
	`document_type` text NOT NULL,
	`project_id` text NOT NULL,
	`year` integer NOT NULL,
	`last_number` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `document_sequences_scope_uidx` ON `document_sequences` (`document_type`,`project_id`,`year`);
