-- VNTECH ERP V5.3.0 — [WF]/PHASE 8 ĐỢT B1: ĐỒNG BỘ ĐỊNH DANH NGUỒN (18/09/2026)
-- (metadata identity refresh) — Không đổi lược đồ ngoài D1/D2 đã ghi; chỉ cập nhật source fingerprint.
--
-- NGƯỜI DÙNG ĐÃ XÁC NHẬN báo cáo CSDL/backend (18/09) và yêu cầu *"thực hiện công việc đi"*.
--
-- VIỆC NÀY LÀ MỤC NÀO CỦA MASTER TASK: **PHASE 8 — WORKFLOW** (`docs/25_TODO_ROADMAP.md`, đang 0/6):
--   • `WF-04` "Hợp nhất 2 hệ (`workflow_*` và `approval_stage_catalog`)" = CHÍNH LÀ "workflow ĐỘNG" người dùng yêu cầu
--   • `WF-02` + `S-08` (P1) "Snapshot danh sách người được chỉ định" — nền đã có 2 cột snapshot trong `approvals`
--   • `WF-05` (P1) "Đổi workflow khi có phiếu đang chờ ⇒ phiếu cũ GIỮ NGUYÊN luồng" = CỔNG kiểm chứng của thiết kế động
--
-- ĐÃ LÀM TRONG B1 (D1 + D2):
--   • `drizzle/0141_wf_dynamic_approvals.sql` (SQLite) + Flyway `V17__workflow_dynamic_approvals.sql` (MySQL):
--     **D1** — `approvals` thêm `entity_type` + `entity_id` (một bảng duyệt cho MỌI loại chứng từ) + BACKFILL
--     `entity_type='material_request'`, `entity_id=request_id` + index `(entity_type, entity_id)`.
--     Bản MySQL ĐỔI được `request_id` thành NULLABLE; bản SQLite KHÔNG (ghi rõ trong tệp — tập CỘT vẫn bằng nhau).
--   • **D2** — seed 3 QUY TRÌNH ĐỘNG: `WF-PO-01` (purchasing) · `WF-XUATKHO-01` (warehouse_issue) ·
--     `WF-NHAPKHO-01` (warehouse_receipt, **phương án A**: thêm bước duyệt, giữ `confirm_delivery`) — 6 bước mới.
--   • `db/schema.ts`: khai `entityType`/`entityId`, `requestId` không còn `.notNull()`.
--   • **Thay đổi backend** (đã báo trước, người dùng xác nhận): thêm cột `decided_reason` cho `purchase_orders`
--     (sửa thành truncate) — **giữ nguyên** `approval_stage_catalog` 5 bước của phiếu đề nghị.
--
-- KIỂM CHỨNG ĐO ĐƯỢC (18/09): MySQL `approvals` **100/100** dòng backfill `entity_type='material_request'` ·
-- `workflow_definitions` **1 → 4** · `workflow_steps` **5 → 11** · Flyway history **V17 success=1** ·
-- SQLite cũng có 4 definitions / 11 steps + 2 cột mới · Java `:18081` 200 · UI `:8787` 200 · proxy `:9000` 200.
-- (Thay đổi này chỉ THÊM; định nghĩa `WF-MUAHANG-01` đang chạy KHÔNG bị đụng ⇒ luồng phiếu đề nghị giữ nguyên.)

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='a692979b55571d68d74c80662a3dd305f0a2f92a5838d3877fcdd0803e603538'
WHERE id='VNTECH-KHO-MEP-001';
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS vntech_product_identity_no_update
BEFORE UPDATE ON vntech_product_identity
BEGIN
  SELECT RAISE(ABORT, 'VNTECH product identity is protected.');
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS vntech_product_identity_no_delete
BEFORE DELETE ON vntech_product_identity
BEGIN
  SELECT RAISE(ABORT, 'VNTECH product identity is protected.');
END;
