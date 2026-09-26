-- VNTECH ERP V5.3.0 — PHASE 7 (`AD-14`) · NHẬT KÝ KIỂM TOÁN: THÊM CỘT `result`
-- [CHUỖI SQLite] — tệp này chạy trên SQLite (dev/local + các bộ test giải nén TOÀN BỘ `drizzle/*.sql`).
-- DDL MySQL/InnoDB THẬT của cùng thay đổi nằm ở
-- `java-backend/infrastructure/src/main/resources/db/migration/V22__ad14_audit_log_result.sql`.
--
-- CHỈ ĐẠO NGƯỜI DÙNG (21/09/2026): «AD-14 thêm result» — nguyên văn mục `AD-14` của `docs/25_TODO_ROADMAP.md`:
--   «Thêm: hành động · module · thực thể · mã thực thể · thời gian · IP · kết quả · metadata»
-- Trước đợt này mục bị **BLOCKED** vì `audit_logs` thiếu cột `result` và lượt đó bị CẤM migration
-- (`docs/agent-progress/AD-14-AUDIT-LOG-KET-QUA-METADATA-BLOCKED.md`). Nay người dùng CHỈ ĐẠO thêm cột.
--
-- QUYẾT ĐỊNH VỀ `metadata` (người dùng chốt): metadata = **CHÍNH `before_json` + `after_json`** — HAI CỘT ĐÃ CÓ.
--   ⇒ KHÔNG thêm cột `metadata` (tránh dữ liệu trùng nghĩa). Ánh xạ này được ghi trong hồ sơ + hiển thị trên UI.
--
-- ⛔ RÀNG BUỘC CỨNG: tệp này CHỈ **THÊM** 1 cột. KHÔNG xoá bảng · KHÔNG xoá cột · KHÔNG xoá dữ liệu · KHÔNG làm rỗng bảng.
--    Dòng cũ (895 dòng, DB test) đọc ra `'ok'` nhờ DEFAULT — xem lý do ở hồ sơ TASK-107 (mọi bản ghi audit đều
--    được ghi SAU KHI thao tác nghiệp vụ đã hoàn tất: cả 2 đường ghi đều nằm ở cuối nhánh thành công).

-- `result`: kết quả nghiệp vụ của hành động. Từ vựng (ngắn, đóng): 'ok' · 'denied' · 'failed'.
ALTER TABLE `audit_logs` ADD COLUMN `result` TEXT NOT NULL DEFAULT 'ok';
