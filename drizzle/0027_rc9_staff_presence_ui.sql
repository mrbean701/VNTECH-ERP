-- KHO VNTECH V5.2.5 RC9 - 2026-08-26
-- Danh bạ nhân sự + trạng thái online/offline theo heartbeat phiên đăng nhập.
-- Không xóa, đổi hoặc làm mất dữ liệu lịch sử.
ALTER TABLE sessions ADD COLUMN last_seen_at TEXT;
--> statement-breakpoint
UPDATE sessions SET last_seen_at=created_at WHERE last_seen_at IS NULL;
