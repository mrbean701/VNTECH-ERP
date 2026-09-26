-- VNTECH ERP V5.3.0 — [WF] PHASE 8 · ĐỢT B2 / D3: trạng thái + QUYẾT ĐỊNH cho ĐƠN MUA HÀNG (PO) — bản SQLite (drizzle)
-- Parity với Flyway `V18__wf_b2_po_decision.sql`. Người dùng đã xác nhận báo cáo CSDL D1–D5 (18/09).
--
-- ĐÃ ĐO TRƯỚC KHI VIẾT: `purchase_orders.status` là **text/varchar** (không phải enum) ⇒ các giá trị mới
-- (`pending_approval`/`approved`/`cancelled`) dùng được ngay; và chưa có cột quyết định nào ⇒ thêm 3 cột NULLABLE.

ALTER TABLE `purchase_orders` ADD COLUMN `decision_reason` text;
--> statement-breakpoint
ALTER TABLE `purchase_orders` ADD COLUMN `decided_by` text;
--> statement-breakpoint
ALTER TABLE `purchase_orders` ADD COLUMN `decided_at` text;
