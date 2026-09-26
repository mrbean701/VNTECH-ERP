-- VNTECH ERP V5.3.0 — [WF] MÀN CẤU HÌNH WORKFLOW: CHỌN NGƯỜI DUYỆT BẰNG TÌM KIẾM (18/09/2026)
-- (metadata identity refresh) — Không đổi lược đồ; chỉ cập nhật source fingerprint.
--
-- NGƯỜI DÙNG YÊU CẦU (18/09): màn cấu hình workflow hiện **hiển thị các bước + danh sách user được chỉ định**
-- ⇒ **modal rất dài**. Yêu cầu: **chuyển sang dạng TÌM KIẾM user** (admin gõ tên → thêm vào bước duyệt), và
-- **những user được chỉ định duyệt hiển thị Ở DƯỚI danh sách**.
--
-- ĐÃ LÀM (trong `WorkflowModal`, `app/page.tsx`):
--   • Thêm state `approverQuery` (từ khoá tìm kiếm theo TỪNG bước).
--   • Thêm `suggestionsFor(stepKey)`: lọc theo **tên · mã nhân viên · username · phòng ban** (bỏ dấu như các màn khác),
--     **tối đa 8 gợi ý** ⇒ không còn bày toàn bộ danh sách ứng viên.
--   • Thay khối "bày hết ứng viên" bằng: **ô tìm kiếm** + **gợi ý** (chỉ hiện khi có từ khoá) + **DANH SÁCH NGƯỜI ĐÃ CHỈ ĐỊNH
--     hiển thị Ở DƯỚI** (mỗi người 1 dòng có nút **✕ Bỏ**) + **cảnh báo vàng** khi bước chưa có ai.
--   • Giữ nguyên mọi hàm đang chạy (`patchStep`, `toggleApprover`, `candidates`, `shown`) — **không đổi hợp đồng dữ liệu**;
--     việc lưu vẫn dùng `workflow_step_approvers` (`step_id` + `user_id`) như trước.
--   • Đúng chế độ **CHỈ CẢNH BÁO** (quyết định của người dùng): bước chưa có người duyệt **vẫn lưu được**, chỉ cảnh báo.
--
-- KIỂM CHỨNG: `npx tsc --noEmit` **EXIT 0** · `npx eslint app/page.tsx` **0 error** (78 warning = đúng nền cũ).
-- Công cụ sửa: `tools/_wf-ui-tim-nguoi-duyet.mjs` (mỏ neo + **TỰ CHỐI GHI**; lượt chạy khô đầu đã tự chối vì
-- `async function save(...)` xuất hiện 2 lần và mỏ neo dài chép tay khớp 0 lần ⇒ chuyển sang **lấy mỏ neo BẰNG MÁY**).

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='1209fb66eb20c598c057df36eb46b766a042aa80b5381f589734effbff9c5459'
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
