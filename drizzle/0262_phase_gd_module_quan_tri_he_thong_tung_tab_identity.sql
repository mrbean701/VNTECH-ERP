-- USER 28/09/2026 (MOC 31) -- 14 KHOA QUYEN TUNG TAB cho man Quan tri he thong.
-- Moi menu con cua nhom "Quan tri he thong" = 1 TAB, theo thu tu 1..14.
-- GHI CHU: dung INSERT thuan (khong ON DUPLICATE KEY UPDATE) vi 5 file test
-- chay tren engine KHAC MySQL (SQLite) => cu phap do lam chung crash.
-- Flyway chay moi migration DUNG 1 LAN nen INSERT thuan la du.

INSERT INTO `module_catalog` (`module_key`,`label`,`icon`,`group_name`,`active`,`sort_order`,`system_locked`,`created_at`,`updated_at`,`group_key`) VALUES
  ('admin_tab_01','Quan tri he thong - Tab 01. Tài khoản','QT',NULL,1,1,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,'system_admin'),
  ('admin_tab_02','Quan tri he thong - Tab 02. Tổ chức','QT',NULL,1,2,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,'system_admin'),
  ('admin_tab_03','Quan tri he thong - Tab 03. Chức danh / vai trò','QT',NULL,1,3,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,'system_admin'),
  ('admin_tab_04','Quan tri he thong - Tab 04. Nhóm quyền nghiệp vụ','QT',NULL,1,4,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,'system_admin'),
  ('admin_tab_05','Quan tri he thong - Tab 05. Phân quyền phòng ban','QT',NULL,1,5,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,'system_admin'),
  ('admin_tab_06','Quan tri he thong - Tab 06. Phân quyền người dùng','QT',NULL,1,6,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,'system_admin'),
  ('admin_tab_07','Quan tri he thong - Tab 07. Cấp bậc hệ thống','QT',NULL,1,7,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,'system_admin'),
  ('admin_tab_08','Quan tri he thong - Tab 08. Phạm vi dự án & kho','QT',NULL,1,8,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,'system_admin'),
  ('admin_tab_09','Quan tri he thong - Tab 09. Workflow phê duyệt','QT',NULL,1,9,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,'system_admin'),
  ('admin_tab_10','Quan tri he thong - Tab 10. Ngoại lệ cá nhân','QT',NULL,1,10,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,'system_admin'),
  ('admin_tab_11','Quan tri he thong - Tab 11. Audit log','QT',NULL,1,11,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,'system_admin'),
  ('admin_tab_12','Quan tri he thong - Tab 12. Cấu hình hệ thống','QT',NULL,1,12,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,'system_admin'),
  ('admin_tab_13','Quan tri he thong - Tab 13. Thông báo','QT',NULL,1,13,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,'system_admin'),
  ('admin_tab_14','Quan tri he thong - Tab 14. Báo lỗi','QT',NULL,1,14,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,'system_admin');

