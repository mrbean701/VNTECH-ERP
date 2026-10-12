-- ⛔ ROLLBACK — hoàn nguyên việc CẤP `work_others` cho trưởng phòng/giám đốc (thực hiện 09/10/2026 16:29 bởi ERP-SESSION-04)
-- Dùng khi user muốn huỷ: chạy đúng 1 lệnh dưới đây ⇒ xoá ĐÚNG 5 bản ghi đã thêm (⛔ không ảnh hưởng bản ghi nào khác)
DELETE FROM user_module_permissions WHERE id IN (
  'UMP-work_others-USR_c51d95b2-8f98-4f01-9daa-0b64d0037b7d',
  'UMP-work_others-USR_9021140a-3cb4-4a01-a958-d88a3bc8c722',
  'UMP-work_others-USR_a5cd3bc6-f7b4-468f-af3b-103170fc0b2c',
  'UMP-work_others-USR_e66f85ff-96ad-40d5-a632-10be87ab10d5',
  'UMP-work_others-USR_p2_giamdoc_demo'
);
