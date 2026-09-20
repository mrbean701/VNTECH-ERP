-- VNTECH ERP V5.3.0 — PHASE 7 (`AD-14`) · NHẬT KÝ KIỂM TOÁN: THÊM CỘT `result`
-- [CHUỖI MySQL/InnoDB — Flyway] — bản sao DDL/DML của `drizzle/0162_ad14_audit_log_result.sql`
-- (hai chuỗi SONG SONG có chủ đích: JS/SQLite theo `drizzle/`, Java/MySQL theo Flyway — xem `docs/agent-progress/TASK-040.md`).
--
-- CHỈ ĐẠO NGƯỜI DÙNG (21/09/2026): «AD-14 thêm result». Nguyên văn mục `AD-14` của `docs/25_TODO_ROADMAP.md`:
--   «Thêm: hành động · module · thực thể · mã thực thể · thời gian · IP · kết quả · metadata»
-- Trước đợt này mục ghi **BLOCKED** vì `audit_logs` thiếu cột `result`/`metadata` và lượt đó CẤM migration.
--
-- `metadata` = **CHÍNH `before_json` + `after_json`** (người dùng chốt) ⇒ KHÔNG thêm cột `metadata`.
--
-- QUY ƯỚC GIÁ TRỊ `result` (đóng, ngắn — ghi cả trong mã nguồn 2 đường ghi):
--   'ok'     — thao tác đã hoàn tất và được ghi nhật ký (trường hợp của MỌI bản ghi hiện có)
--   'denied' — bị từ chối (dùng khi nơi gọi CHỦ ĐỘNG ghi lại một lần từ chối)
--   'failed' — thao tác lỗi (dùng khi nơi gọi CHỦ ĐỘNG ghi lại một lần lỗi)
--
-- ⛔ RÀNG BUỘC CỨNG: CHỈ **THÊM** 1 cột. KHÔNG xoá bảng · KHÔNG xoá cột · KHÔNG xoá dữ liệu · KHÔNG làm rỗng bảng.
--    MySQL điền `'ok'` cho các dòng đã có nhờ DEFAULT (đo được: 895 dòng trước → 895 dòng có `result` sau).

SET @audit_result_exists := (SELECT COUNT(*) FROM information_schema.columns
                              WHERE table_schema = DATABASE() AND table_name = 'audit_logs' AND column_name = 'result');
SET @audit_ddl := IF(@audit_result_exists = 0,
  'ALTER TABLE audit_logs ADD COLUMN result VARCHAR(32) NOT NULL DEFAULT ''ok''',
  'DO 0');
PREPARE audit_stmt FROM @audit_ddl; EXECUTE audit_stmt; DEALLOCATE PREPARE audit_stmt;

-- Không có dòng nào bị để rỗng: bù cho trường hợp cột đã tồn tại nhưng từng cho phép NULL.
UPDATE audit_logs SET result = 'ok' WHERE result IS NULL OR result = '';
