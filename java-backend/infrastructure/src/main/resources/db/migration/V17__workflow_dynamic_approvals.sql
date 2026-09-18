-- VNTECH ERP V5.3.0 — [WF]/PHASE 8 — WORKFLOW ĐỘNG: D1 (một bảng duyệt cho MỌI loại chứng từ) + D2 (seed 3 quy trình mới)
-- Người dùng đã xác nhận báo cáo CSDL (18/09). Mục MASTER TASK: WF-04 · WF-02/S-08 · P1–P3 của TASK-094.
-- PARITY với bản SQLite `drizzle/0141_wf_dynamic_approvals.sql` (tập CỘT phải GIỐNG NHAU — cổng `probe-column-parity`).
-- ⚠️ Khác biệt CÓ CHỦ ĐÍCH: bản MySQL ĐỔI được `request_id` thành NULLABLE (SQLite thì không, ghi rõ trong bản kia).

-- ── D1 ──────────────────────────────────────────────────────────────────────────────────────
ALTER TABLE approvals ADD COLUMN entity_type VARCHAR(64) NULL AFTER id;
ALTER TABLE approvals ADD COLUMN entity_id VARCHAR(64) NULL AFTER entity_type;
UPDATE approvals SET entity_type = 'material_request', entity_id = request_id WHERE entity_type IS NULL;
ALTER TABLE approvals MODIFY COLUMN request_id VARCHAR(64) NULL;
CREATE INDEX approvals_entity_idx ON approvals (entity_type, entity_id);

-- ── D2: seed 3 QUY TRÌNH ĐỘNG (chỉ THÊM; KHÔNG đụng `WF-MUAHANG-01` đang chạy) ─────────────
INSERT INTO workflow_definitions (id, code, name, description, module_key, project_id, is_default, active, version, sort_order, created_by, created_at, updated_at)
VALUES
 ('WF-PO','WF-PO-01','Quy trình phát hành PO','Duyệt phát hành đơn mua hàng (PO) trước khi cho nhận hàng.','purchasing',NULL,1,1,1,20,'system',NOW(),NOW()),
 ('WF-XUATKHO','WF-XUATKHO-01','Quy trình cấp phát / xuất kho','Duyệt phiếu xuất kho / cấp phát vật tư cho tổ đội.','warehouse_issue',NULL,1,1,1,30,'system',NOW(),NOW()),
 ('WF-NHAPKHO','WF-NHAPKHO-01','Quy trình nhập kho (có bước duyệt mới)','Phương án A: THÊM bước duyệt cho phiếu nhập; giữ confirm_delivery là bước BCH xác nhận hàng về.','warehouse_receipt',NULL,1,1,1,40,'system',NOW(),NOW());

INSERT INTO workflow_steps (id, workflow_id, step_no, name, description, approval_mode, sla_hours, allow_skip_level, required_permission, active, created_at, updated_at)
VALUES
 ('WFS-PO-1','WF-PO',1,'Trưởng phòng Kế hoạch duyệt','Xác nhận nhu cầu, nhà cung cấp và giá PO.','single',24,0,'canApprove',1,NOW(),NOW()),
 ('WFS-PO-2','WF-PO',2,'Kế toán xác nhận','Kiểm tra giá / ngân sách trước khi phát hành PO.','single',24,0,'canApprove',1,NOW(),NOW()),
 ('WFS-XK-1','WF-XUATKHO',1,'Chỉ huy trưởng / BCH xác nhận','Xác nhận vật tư xuất đúng tổ đội, đúng khối lượng.','single',24,0,'canApprove',1,NOW(),NOW()),
 ('WFS-XK-2','WF-XUATKHO',2,'Kế toán xác nhận','Đối chiếu giá trị vật tư xuất kho.','single',24,0,'canApprove',1,NOW(),NOW()),
 ('WFS-NK-1','WF-NHAPKHO',1,'Thủ kho kiểm hàng & xác nhận','Kiểm soát số lượng / chất lượng hàng về.','single',24,0,'canApprove',1,NOW(),NOW()),
 ('WFS-NK-2','WF-NHAPKHO',2,'Kế toán duyệt ghi tăng tồn','Cho phép ghi TĂNG tồn kho (phương án A).','single',24,0,'canApprove',1,NOW(),NOW());

-- GHI CHÚ: `workflow_step_approvers` theo **USER** (`user_id`) ⇒ đợt này ĐỂ TRỐNG có chủ đích (bước đã khai
-- `required_permission='canApprove'`); KHÔNG hardcode user vào migration.
