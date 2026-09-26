-- V15 — GĐ3: ĐỔI NHÃN MODULE "site_command" THÀNH "Quản lý dự án"
--
-- Vì sao cần migration này: nhãn hiển thị trên menu KHÔNG lấy từ mảng `modules`
-- trong app/page.tsx mà từ `module_catalog` (DB). Hàm configuredModules() ở
-- app/page.tsx dòng ~317 dùng `config?.label || item.label` — tức nhãn trong DB
-- LUÔN THẮNG. Sửa nhãn chỉ ở code sẽ KHÔNG có tác dụng.
--
-- Ngữ cảnh: màn `site_command` đã được chuyển từ "Quản lý Ban chỉ huy" thành
-- màn QUẢN LÝ DỰ ÁN (danh sách dự án + chi tiết 5 tab, trong đó Ban chỉ huy là
-- 1 tab). Nhãn cũ gây hiểu sai về nội dung màn hình.
--
-- Idempotent: UPDATE theo khóa chính nên chạy lại không gây hại.

UPDATE `module_catalog`
SET `label` = 'Quản lý dự án'
WHERE `module_key` = 'site_command';
