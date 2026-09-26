ALTER TABLE `company_settings` ADD `po_sla_hours` integer DEFAULT 24 NOT NULL;
--> statement-breakpoint
ALTER TABLE `company_settings` ADD `bch_confirmation_sla_hours` integer DEFAULT 8 NOT NULL;
--> statement-breakpoint
ALTER TABLE `material_requests` ADD `supply_status` text DEFAULT 'approval_pending' NOT NULL;
--> statement-breakpoint
ALTER TABLE `purchase_orders` ADD `request_id` text;
--> statement-breakpoint
ALTER TABLE `purchase_orders` ADD `delivery_queued_at` text;
--> statement-breakpoint
ALTER TABLE `purchase_orders` ADD `delivery_completed_at` text;
--> statement-breakpoint
ALTER TABLE `goods_receipts` ADD `certificate_status` text DEFAULT 'pending' NOT NULL;
--> statement-breakpoint
ALTER TABLE `goods_receipts` ADD `delivery_document_status` text DEFAULT 'pending' NOT NULL;
--> statement-breakpoint
ALTER TABLE `goods_receipts` ADD `bch_confirmation_status` text DEFAULT 'pending' NOT NULL;
--> statement-breakpoint
ALTER TABLE `goods_receipts` ADD `bch_confirmed_by` text;
--> statement-breakpoint
ALTER TABLE `goods_receipts` ADD `bch_confirmed_at` text;
--> statement-breakpoint
ALTER TABLE `goods_receipts` ADD `bch_comment` text;
--> statement-breakpoint
UPDATE `purchase_orders` SET `request_id`=(SELECT mri.`request_id` FROM `purchase_order_items` poi JOIN `material_request_items` mri ON mri.`id`=poi.`request_item_id` WHERE poi.`purchase_order_id`=`purchase_orders`.`id` LIMIT 1),`delivery_queued_at`=`ordered_at` WHERE `request_id` IS NULL;
--> statement-breakpoint
UPDATE `goods_receipts` SET `certificate_status`=CASE WHEN `document_status`='complete' THEN 'complete' ELSE 'missing' END,`delivery_document_status`=CASE WHEN `document_status`='complete' THEN 'complete' ELSE 'missing' END;
--> statement-breakpoint
UPDATE `material_requests` SET `supply_status`=CASE WHEN `status`='pending_approval' THEN 'approval_pending' WHEN `status` IN ('rejected','cancelled') THEN `status` WHEN EXISTS (SELECT 1 FROM `purchase_orders` po WHERE po.`request_id`=`material_requests`.`id`) THEN 'waiting_delivery' WHEN `status`='approved' THEN 'awaiting_po' ELSE 'approval_pending' END;
--> statement-breakpoint
CREATE TABLE `supply_workflow_steps` (
	`id` text PRIMARY KEY NOT NULL,
	`request_id` text NOT NULL,
	`purchase_order_id` text,
	`receipt_id` text,
	`step` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`queued_at` text NOT NULL,
	`due_at` text,
	`completed_at` text,
	`completed_by` text,
	`comment` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`request_id`) REFERENCES `material_requests`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`receipt_id`) REFERENCES `goods_receipts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`completed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `supply_workflow_request_idx` ON `supply_workflow_steps` (`request_id`,`step`,`queued_at`);
--> statement-breakpoint
CREATE INDEX `supply_workflow_status_idx` ON `supply_workflow_steps` (`status`,`due_at`);
--> statement-breakpoint
INSERT INTO `supply_workflow_steps` (`id`,`request_id`,`step`,`status`,`queued_at`,`due_at`,`completed_at`,`completed_by`,`comment`,`created_at`,`updated_at`)
SELECT 'SWF-PO-'||mr.`id`,mr.`id`,'po_creation',CASE WHEN po.`id` IS NULL THEN 'pending' ELSE 'completed' END,COALESCE((SELECT MAX(a.`decided_at`) FROM `approvals` a WHERE a.`request_id`=mr.`id`),mr.`updated_at`),strftime('%Y-%m-%dT%H:%M:%fZ',COALESCE((SELECT MAX(a.`decided_at`) FROM `approvals` a WHERE a.`request_id`=mr.`id`),mr.`updated_at`),'+24 hours'),po.`ordered_at`,po.`buyer_user_id`,'Khởi tạo khi nâng cấp V1.4.0',mr.`created_at`,mr.`updated_at`
FROM `material_requests` mr LEFT JOIN `purchase_orders` po ON po.`request_id`=mr.`id` WHERE mr.`status`='approved';
--> statement-breakpoint
INSERT INTO `supply_workflow_steps` (`id`,`request_id`,`purchase_order_id`,`step`,`status`,`queued_at`,`due_at`,`completed_at`,`completed_by`,`comment`,`created_at`,`updated_at`)
SELECT 'SWF-DEL-'||po.`id`,po.`request_id`,po.`id`,'delivery',CASE WHEN COALESCE((SELECT SUM(poi.`received_qty`) FROM `purchase_order_items` poi WHERE poi.`purchase_order_id`=po.`id`),0)>=COALESCE((SELECT SUM(poi.`ordered_qty`) FROM `purchase_order_items` poi WHERE poi.`purchase_order_id`=po.`id`),0) THEN 'completed' ELSE 'pending' END,po.`ordered_at`,po.`eta`,CASE WHEN COALESCE((SELECT SUM(poi.`received_qty`) FROM `purchase_order_items` poi WHERE poi.`purchase_order_id`=po.`id`),0)>=COALESCE((SELECT SUM(poi.`ordered_qty`) FROM `purchase_order_items` poi WHERE poi.`purchase_order_id`=po.`id`),0) THEN (SELECT MAX(gr.`received_at`) FROM `goods_receipts` gr WHERE gr.`purchase_order_id`=po.`id`) ELSE NULL END,NULL,'Khởi tạo khi nâng cấp V1.4.0',po.`created_at`,po.`updated_at` FROM `purchase_orders` po WHERE po.`request_id` IS NOT NULL;
--> statement-breakpoint
INSERT INTO `supply_workflow_steps` (`id`,`request_id`,`purchase_order_id`,`receipt_id`,`step`,`status`,`queued_at`,`due_at`,`completed_at`,`completed_by`,`comment`,`created_at`,`updated_at`)
SELECT 'SWF-BCH-'||gr.`id`,po.`request_id`,po.`id`,gr.`id`,'bch_confirmation','pending',gr.`received_at`,strftime('%Y-%m-%dT%H:%M:%fZ',gr.`received_at`,'+8 hours'),NULL,NULL,'Chờ BCH xác nhận sau nâng cấp V1.4.0',gr.`created_at`,gr.`updated_at` FROM `goods_receipts` gr JOIN `purchase_orders` po ON po.`id`=gr.`purchase_order_id` WHERE po.`request_id` IS NOT NULL;
