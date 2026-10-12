-- ⭐ HOÀN TÁC việc cấp khoá `work` cho MỌI phòng ban + MỌI tài khoản hoạt động
-- Người thực hiện: `ERP-SESSION-01` · ngày 2026-10-09 · lý do: user chốt «mọi user đều có quyền truy cập vào công việc»
--
-- ⚠️⚠️ ĐIỀU KIỆN LỌC PHẢI DÙNG `permission_source` (⛔ KHÔNG dùng tiền tố id):
--    ĐO ĐƯỢC: 3 dòng `work` CÓ SẴN từ trước (e2e.kh · trinhtrench · trdademo) mang id dạng `UMP-WORK-USR_…`
--    — TRÙNG tiền tố với id do lần cấp này sinh ⇒ lọc theo tiền tố id sẽ ⛔ XOÁ NHẦM quyền của họ ✓
--    Phân biệt ĐÚNG: 3 dòng cũ có `can_use=1` + `permission_source='manual_override'`;
--                    25 dòng mới có `can_use=0` + `permission_source='department_default'` ✓
DELETE FROM user_module_permissions
 WHERE module_key = 'work' AND permission_source = 'department_default'
   AND can_view = 1 AND can_use = 0 AND can_create = 0 AND can_edit = 0;
DELETE FROM department_module_permissions
 WHERE module_key = 'work' AND can_view = 1 AND can_use = 0 AND can_create = 0 AND can_edit = 0
   AND updated_by = 'ERP-SESSION-01/2026-10-09';
-- ⭐ SAU KHI CHẠY PHẢI ĐO LẠI: `SELECT COUNT(*) FROM user_module_permissions WHERE module_key='work'` phải về **3**,
--    và 3 tài khoản e2e.kh/trinhtrench/trdademo phải còn view=1 use=1 create=1 edit=1 ✓
-- ⭐ HOÀN TÁC (phần 2) — 6 KHOÁ TAB Công việc (Mô hình B, user chốt 09/10/2026)
-- Người thực hiện: ERP-SESSION-01 · 2026-10-09
DELETE FROM user_module_permissions
 WHERE module_key IN ('work_dashboard','work_list','work_department','work_assign','work_project','work_reports')
   AND permission_source = 'department_default' AND can_view = 1 AND can_use = 0;
DELETE FROM department_module_permissions
 WHERE module_key IN ('work_dashboard','work_list','work_department','work_assign','work_project','work_reports')
   AND can_view = 1 AND can_use = 0 AND updated_by = 'ERP-SESSION-01/2026-10-09';
-- ⚠️ Cân nhắc TRƯỚC KHI xoá khoá khỏi danh mục (nếu xoá thì ma trận mất dòng):
-- DELETE FROM module_catalog WHERE module_key IN ('work_dashboard','work_list','work_department','work_assign','work_project','work_reports');
