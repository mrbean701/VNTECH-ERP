-- ============================================================================
-- V5 — BỔ SUNG CHỨC NĂNG BỊ BỎ SÓT KHI TÁI CẤU TRÚC MENU (V4)
-- ----------------------------------------------------------------------------
-- Khi V4 giải tán nhóm "department_management", module dept_project_tender
-- ("Đấu thầu" của Phòng Dự án) chưa được gán nhóm mới nên vẫn trỏ tới nhóm đã bị
-- xoá. Hệ quả: chức năng này bị ẩn hoàn toàn khỏi menu (group_key không khớp nhóm
-- nào ⇒ configuredModules lọc bỏ).
--
-- Khắc phục: gộp vào nhóm MEP cùng các chức năng Phòng Dự án khác, chèn giữa
-- "Shopdrawing & trình duyệt" (30) và "BOQ & bóc tách khối lượng" (40).
--
-- Kiểm chứng sau khi chạy:
--   SELECT COUNT(*) FROM module_catalog m
--   LEFT JOIN menu_group_catalog g ON g.group_key = m.group_key
--   WHERE m.group_key IS NOT NULL AND g.group_key IS NULL;   -- phải = 0
-- ============================================================================

UPDATE module_catalog
   SET group_key = 'mep', sort_order = 35
 WHERE module_key = 'dept_project_tender';
