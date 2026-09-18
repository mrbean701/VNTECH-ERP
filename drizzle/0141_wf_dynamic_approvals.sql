-- VNTECH ERP V5.3.0 — [WF]/PHASE 8 — WORKFLOW ĐỘNG: D1 (một bảng duyệt cho MỌI loại chứng từ) + D2 (seed 3 quy trình mới)
-- Người dùng đã xác nhận báo cáo CSDL (18/09). Mục MASTER TASK: WF-04 (hợp nhất 2 hệ) · WF-02/S-08 (snapshot) · P1–P3 của TASK-094.
--
-- ⚠️ KHÁC BIỆT CÓ CHỦ ĐÍCH giữa 2 chuỗi (ghi rõ, không giấu):
--   • MySQL (Flyway V17): ĐỔI được `request_id` thành NULLABLE.
--   • SQLite (file này): KHÔNG đổi được nullability tại chỗ (SQLite cần rebuild bảng) ⇒ `request_id` **vẫn NOT NULL**.
--     Hiện `approvals` (SQLite) **0 dòng** nên chưa ảnh hưởng; khi đường Node cần ghi duyệt cho PO thì phải rebuild bảng
--     (ghi vào việc kế tiếp). TẬP CỘT hai bên vẫn BẰNG NHAU ⇒ cổng `probe-column-parity` giữ ĐẠT.

-- ── D1: thêm 2 cột định danh thực thể + backfill + index ────────────────────────────────────
ALTER TABLE `approvals` ADD COLUMN `entity_type` text;
--> statement-breakpoint
ALTER TABLE `approvals` ADD COLUMN `entity_id` text;
--> statement-breakpoint
UPDATE `approvals` SET `entity_type` = 'material_request', `entity_id` = `request_id` WHERE `entity_type` IS NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `approvals_entity_idx` ON `approvals` (`entity_type`,`entity_id`);
--> statement-breakpoint

-- ── D2: seed 3 QUY TRÌNH ĐỘNG cho 3 module mới (chỉ THÊM, KHÔNG đụng định nghĩa `requests` đang chạy) ──
INSERT INTO `workflow_definitions` (`id`,`code`,`name`,`description`,`module_key`,`project_id`,`is_default`,`active`,`version`,`sort_order`,`created_by`,`created_at`,`updated_at`)
VALUES
 ('WF-PO','WF-PO-01','Quy trình phát hành PO','Duyệt phát hành đơn mua hàng (PO) trước khi cho nhận hàng.','purchasing',NULL,1,1,1,20,'system',datetime('now'),datetime('now')),
 ('WF-XUATKHO','WF-XUATKHO-01','Quy trình cấp phát / xuất kho','Duyệt phiếu xuất kho / cấp phát vật tư cho tổ đội.','warehouse_issue',NULL,1,1,1,30,'system',datetime('now'),datetime('now')),
 ('WF-NHAPKHO','WF-NHAPKHO-01','Quy trình nhập kho (có bước duyệt mới)','Phương án A: THÊM bước duyệt cho phiếu nhập; giữ confirm_delivery là bước BCH xác nhận hàng về.','warehouse_receipt',NULL,1,1,1,40,'system',datetime('now'),datetime('now'));
--> statement-breakpoint
INSERT INTO `workflow_steps` (`id`,`workflow_id`,`step_no`,`name`,`description`,`approval_mode`,`sla_hours`,`allow_skip_level`,`required_permission`,`active`,`created_at`,`updated_at`)
VALUES
 ('WFS-PO-1','WF-PO',1,'Trưởng phòng Kế hoạch duyệt','Xác nhận nhu cầu, nhà cung cấp và giá PO.','single',24,0,'canApprove',1,datetime('now'),datetime('now')),
 ('WFS-PO-2','WF-PO',2,'Kế toán xác nhận','Kiểm tra giá / ngân sách trước khi phát hành PO.','single',24,0,'canApprove',1,datetime('now'),datetime('now')),
 ('WFS-XK-1','WF-XUATKHO',1,'Chỉ huy trưởng / BCH xác nhận','Xác nhận vật tư xuất đúng tổ đội, đúng khối lượng.','single',24,0,'canApprove',1,datetime('now'),datetime('now')),
 ('WFS-XK-2','WF-XUATKHO',2,'Kế toán xác nhận','Đối chiếu giá trị vật tư xuất kho.','single',24,0,'canApprove',1,datetime('now'),datetime('now')),
 ('WFS-NK-1','WF-NHAPKHO',1,'Thủ kho kiểm hàng & xác nhận','Kiểm soát số lượng / chất lượng hàng về.','single',24,0,'canApprove',1,datetime('now'),datetime('now')),
 ('WFS-NK-2','WF-NHAPKHO',2,'Kế toán duyệt ghi tăng tồn','Cho phép ghi TĂNG tồn kho (phương án A).','single',24,0,'canApprove',1,datetime('now'),datetime('now'));
--> statement-breakpoint
-- GHI CHÚ: `workflow_step_approvers` là theo **USER** (`user_id`) ⇒ đợt này ĐỂ TRỐNG có chủ đích
-- (bước duyệt đã khai `required_permission='canApprove'`); khi người dùng chốt danh sách người cụ thể thì thêm dòng,
-- KHÔNG hardcode user vào migration (tránh sai như lớp lỗi "dữ liệu cứng" đã gặp).
