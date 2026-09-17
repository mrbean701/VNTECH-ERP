-- VNTECH ERP V5.3.0 — PHASE 1 / DỮ LIỆU THẬT: NỐI CỘT THIẾU + BỎ HẰNG SỐ GIẢ (TASK-082)
-- (metadata identity refresh)
-- Không đổi nghiệp vụ, không đổi schema. Chỉ cập nhật source fingerprint.
--
-- VÌ SAO: cổng `tools/probe-column-parity.mjs` đối chiếu TẬP CỘT giữa JS (`scripts/system-route.mjs` — SSOT)
-- và Java (`BootstrapDataAdapter` — đường phục vụ thật qua cổng 9000) cho bảng `receipts` và `purchaseOrders`.
-- Phát hiện Java THIẾU 5 cột so với JS ⇒ UI luôn hiển thị giá trị rỗng/0 trên màn "Đã giao":
--   `bchConfirmedByName`, `bchConfirmedAt`, `bchComment`, `deliveryNoteNo`, `attachmentCount`.
-- Đồng thời 3 chỗ trong `app/page.tsx` còn HẰNG SỐ GIẢ:
--   · màn Đã giao — cột "CHỨNG CHỈ": `row.certificateStatus==="complete"?2:0` (số 2 là bịa)
--   · màn Đã giao — cột "TÌNH TRẠNG": `<StatusBadge value="Đã nhập kho"/>` (cố định cho mọi dòng)
--   · màn Thanh toán — "Quá hạn": `moneyBillion(0)` (luôn 0)
-- Nay lấy từ dữ liệu thật: `goods_receipts.certificate_status`, `goods_receipts.posting_status`,
-- `payment_plans.status='overdue'` (do `SlaComplianceWorker` đánh dấu), và `attachments` (entity_type='goods_receipt').
-- Thêm 2 cột dẫn xuất thật cho PO: `certificateCount`, `attachmentCount`.
-- Khối identity bên dưới do `tools/refresh-phase-identity.mjs` sinh theo cơ chế FIXED POINT.

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='b7cd5731a3f4a33de63cf78e29d70cd169a4a9324f53ec48f36cd46e7c774847'
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
