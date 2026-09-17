-- ============================================================================
-- VNTECH ERP V5.3.0 — TASK-080 đợt 2C: cấp quyền GHI theo dự án (MySQL)
-- ============================================================================
-- Chỉ thị người dùng: "từ giờ không hardcode nữa chỉ sử dụng dữ liệu thật, nếu chưa có thì hãy
-- insert đầy đủ để có căn cứ cho việc test luồng và mô phỏng hoạt động thực tế."
--
-- LỖ HỔNG ĐO ĐƯỢC: `user_project_scopes.permission` của MỌI tài khoản ngoài admin đều là 'read'
-- (kể cả Trưởng phòng Dự án và Trưởng phòng Kế hoạch). Trong khi đó cả hai đường đọc/ghi đều dùng
-- ĐÚNG một luật: quyền GHI theo dự án phải nằm trong tập {write, approve, admin}:
--   · JS  `scripts/system-route.mjs:221`  → `["write","approve","admin"].includes(scope.permission)`
--   · Java `AccessScopeService:40/70`      → `WRITE_LEVELS = List.of("write","approve","admin")`
-- ⇒ Hệ quả: MỌI thao tác ghi có phạm vi dự án đều bị chặn (HTTP 403/400) với mọi người dùng thật.
--   Đo cụ thể (chạy thật qua cổng 9000, action `create_work_item` của Trưởng phòng Dự án):
--   `{"ok":false,"error":"Không có quyền tại dự án."}`
--
-- VÌ SAO CHỌN 'write' (và không phải 'approve'):
--   Đã rà TOÀN BỘ mã hai phía: KHÔNG có chỗ nào phân biệt 'approve' với 'write' cho phạm vi dự án —
--   mọi phép kiểm đều hỏi đúng tập {write, approve, admin} (`AccessScopeService:40`,
--   `FileUseCase:35`, `system-route.mjs:221`, `system-route.mjs:448`, `RequestStoreAdapter:317`).
--   Quyền PHÊ DUYỆT thật do `workflow/approval_stage_catalog` quyết định, KHÔNG do phạm vi dự án.
--   ⇒ 'write' là mức TỐI THIỂU ĐỦ DÙNG; KHÔNG cấp 'approve'/'admin' để tránh leo thang quyền.
--
-- ÁNH XẠ (theo vai trò nghiệp vụ thật đang có trong `users` + `role_catalog.base_role`):
--   write: da_truong · kh_truong (trưởng phòng — chính luật giao việc yêu cầu), da_nv · kh_nv (nhân viên),
--          ksda · engineer (kỹ sư hiện trường lập phiếu), cht (chỉ huy trưởng xác nhận BCH),
--          thu_kho · warehouse (thủ kho ghi nhập/xuất)
--   read (GIỮ NGUYÊN — không đổi): accountant (kế toán), director (thư ký/BGĐ), admin (đã là 'admin')
--
-- Bản sao lưu trước khi sửa: tools/_backup-project-scope-truoc-TASK080C.txt
-- Áp dụng: mysql -uvntech -pvntech --default-character-set=utf8mb4 vntech_erp < tools/task080c-seed-project-write-scope.sql
-- ============================================================================

UPDATE user_project_scopes ups
  JOIN users u ON u.id=ups.user_id
  LEFT JOIN role_catalog rc ON rc.code=u.role
   SET ups.permission='write', ups.updated_at=CURRENT_TIMESTAMP
 WHERE ups.permission='read'
   AND u.role <> 'admin'
   AND COALESCE(rc.base_role,u.role) IN ('project','procurement','engineer','commander','warehouse');

-- ============================================================================
-- NGHIỆM THU: kỳ vọng 11 dòng chuyển sang 'write' · 3 dòng còn 'read' (kttdemo/thukydemo/cha.ht?)
-- ============================================================================
SELECT COALESCE(rc.base_role,u.role) AS base_role, ups.permission, COUNT(*) AS so_dong
FROM user_project_scopes ups JOIN users u ON u.id=ups.user_id
LEFT JOIN role_catalog rc ON rc.code=u.role
GROUP BY COALESCE(rc.base_role,u.role), ups.permission ORDER BY ups.permission, base_role;
