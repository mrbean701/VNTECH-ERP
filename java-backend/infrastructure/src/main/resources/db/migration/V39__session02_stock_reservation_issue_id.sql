-- ═══════════════════════════════════════════════════════════════════════════════════════════════
-- ⭐⭐⭐ V39 — GIỮ CHỖ CHO **PHIẾU XUẤT** (⭐ QUY TẮC ④ — USER CHỐT 08/10/2026) ⭐⭐⭐
--
--   NGUỒN (nguyên văn user — `DEC-20261008-013`):
--     «khi phiếu ở trạng thái HOÀN THÀNH thì mới được thay đổi tồn kho trong kho đích và nguồn.
--      Trong thời gian TẠO PHIẾU hoặc CHỜ DUYỆT thì số lượng vật tư trong phiếu đó ở trong trạng thái
--      ĐANG XỬ LÝ (không cho user khác thao tác vào những mã vật tư đó), ví dụ như dây diện cadivi 1.5
--      tồn 100 - phiếu xuất 70 (đang xử lý) thì những user khác không được thao tác xuất quá số lượng
--      đang trạng thái bình thường»
--
--   ⚠️⚠️ VÌ SAO CẦN CỘT MỚI (⭐ đo được, ⛔ không suy đoán):
--     `SHOW COLUMNS FROM stock_reservations` ⇒ hiện CHỈ có `request_id` + `request_item_id`.
--     `createStockReservations` chỉ được GỌI Ở 1 CHỖ: `RequestManagementUseCase.java:820` (phiếu ĐỀ NGHỊ).
--     ⇒ ⛔ phiếu XUẤT không tạo được giữ chỗ ⇒ 2 phiếu xuất cùng `draft`/chờ duyệt VẪN xuất quá được.
--
--   ⛔ VÌ SAO KHÔNG TÁI DÙNG `request_id`:
--     Phiếu XUẤT (`stock_issues`) CÓ cột `request_id` (nullable — phiếu xuất có thể ⛔ không từ đề nghị).
--     Nếu nhồi `issue_id` vào `request_id` thì ⛔ KHÔNG phân biệt được nguồn giữ chỗ ⇒
--     khi RELEASE sẽ ⛔ nhả nhầm reservation của phiếu ĐỀ NGHỊ khác ⇒ SAI TỒN KHO ⚠️
--     ⇒ Thêm cột RIÊNG `issue_id` — ⭐ phân biệt rõ, ⛔ không phá công thức nào.
--
--   🔒 AN TOÀN (⭐ đã kiểm):
--     • Cột MỚI **NULLABLE** ⇒ ⛔ không phá dữ liệu cũ, ⛔ không cần backfill.
--     • Công thức tồn kho `available = physical − SUM(reserved WHERE status='active')`
--       ⛔ KHÔNG phân biệt nguồn ⇒ thêm cột ⛔ không phá gì (⭐ hiện `stock_reservations` = 0 dòng).
--     • ⛔ KHÔNG đổi khoá chính, ⛔ KHÔNG đổi cột cũ.
-- ═══════════════════════════════════════════════════════════════════════════════════════════════

-- ── ① Thêm cột trỏ PHIẾU XUẤT (⭐ NULL = giữ chỗ cho phiếu ĐỀ NGHỊ như hiện nay)
ALTER TABLE `stock_reservations`
    ADD COLUMN `issue_id` VARCHAR(64) NULL COMMENT 'Phiếu xuất đang giữ chỗ (NULL = giữ chỗ cho phiếu đề nghị)' AFTER `request_item_id`;

-- ── ② Index tra theo phiếu xuất (⭐ để RELEASE khi phiếu hoàn thành không phải quét toàn bảng)
CREATE INDEX `stock_reservations_issue_idx` ON `stock_reservations` (`issue_id`, `status`);

-- ⚠️ CHẠY LẠI: MySQL 8 ⛔ không có `ADD COLUMN IF NOT EXISTS` cũ — nếu chạy lần 2 sẽ báo
--    «Duplicate column name» ⇒ ⭐ đó là DẤU HIỆU ĐÃ ÁP THÀNH CÔNG, ⛔ không phải lỗi.
--    (Đã kiểm: `stock_reservations` hiện 0 dòng ⇒ áp lần đầu ⛔ không có rủi ro dữ liệu.)
