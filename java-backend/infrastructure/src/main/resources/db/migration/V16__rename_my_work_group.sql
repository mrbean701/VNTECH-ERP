-- V16 — GĐ4: ĐỔI NHÃN NHÓM MENU "CÔNG VIỆC CỦA TÔI" → "CÔNG VIỆC"
--
-- Yêu cầu người dùng: «Trong phần công việc của tôi nên đổi thành "Công việc"».
--
-- Vì sao cần migration: nhãn nhóm menu hiển thị lấy từ `menu_group_catalog` (DB),
-- không phải từ mảng `defaultMenuGroups` trong app/page.tsx — hàm
-- configuredMenuGroups() dùng `dbCatalog` trước rồi mới bù bằng default. Sửa nhãn
-- chỉ ở code sẽ KHÔNG có tác dụng (bài học đã gặp ở V15 với module site_command).
--
-- Nhóm này sau khi đổi tên sẽ chứa cả việc của bản thân, việc phòng ban/tổ đội và
-- KPI — nên tên cũ "CỦA TÔI" không còn đúng phạm vi.
--
-- Idempotent: UPDATE theo khóa chính.

UPDATE `menu_group_catalog`
SET `name` = 'CÔNG VIỆC'
WHERE `group_key` = 'my_work';
