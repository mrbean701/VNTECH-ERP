-- ============================================================
-- VNTECH ERP — V2__system_seed.sql (MySQL 8.4 / 8.0, utf8mb4)
-- Sinh tự động từ nguồn JS (drizzle/0009 + drizzle/0029)
-- Đừng sửa tay: chạy java-backend/tools/generate-system-seed.mjs
--
-- Mục đích: nạp dữ liệu hệ thống BẮT BUỘC mà V1__baseline (schema-only) không có.
--   * approval_stage_catalog — 5 bậc phê duyệt; thiếu thì create_request lỗi
--     "Chưa cấu hình bước phê duyệt đang hoạt động" (phát hiện 14/09/2026).
--   * role_catalog — vai trò nền để gán vào bước duyệt.
-- ============================================================

SET NAMES utf8mb4;

-- Vai trò nền (engine roles)
INSERT IGNORE INTO `role_catalog` (`id`,`code`,`name`,`description`,`base_role`,`active`,`sort_order`,`system_locked`,`created_at`,`updated_at`) VALUES
('ROLE-engineer','engineer','Kỹ sư','Lập phiếu đề nghị/nghiệm thu','engineer',1,10,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ROLE-commander','commander','Chỉ huy trưởng','Duyệt cấp BCH','commander',1,20,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ROLE-project','project','Phòng Dự án','Kiểm soát khối lượng/BOQ','project',1,30,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ROLE-procurement','procurement','Phòng Kế hoạch','Mua hàng, nhà cung cấp','procurement',1,40,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ROLE-accountant','accountant','Tài chính Kế toán','Thanh toán, công nợ','accountant',1,50,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ROLE-warehouse','warehouse','Thủ kho','Nhập xuất và kiểm soát kho','warehouse',1,60,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ROLE-team','team','Tổ đội','Nhận, sử dụng và hoàn trả vật tư','team',1,70,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ROLE-director','director','Ban giám đốc','Theo dõi và phê duyệt theo phân quyền','director',1,80,1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3));

-- 5 bậc phê duyệt chuẩn (stage 1..5; bước tùy chỉnh phải ≥100)
INSERT IGNORE INTO `approval_stage_catalog` (`id`,`stage_no`,`name`,`description`,`allowed_role_codes`,`approval_mode`,`sla_hours`,`auto_approve_on_submit`,`active`,`sort_order`,`created_at`,`updated_at`) VALUES
('ASTAGE-1',1,'CHT xác nhận nhu cầu','Kỹ sư dự án lập phiếu; CHT xác nhận nhu cầu dự án','commander,cht','single',12,0,1,10,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ASTAGE-2',2,'Thư ký Tổng giám đốc duyệt','Duyệt đầu tiên sau CHT trước khi chuyển Phòng Dự án','thuky','single',12,0,1,20,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ASTAGE-3',3,'Phòng Dự án kiểm tra khối lượng','Nhân viên chuyên quản kiểm tra khối lượng/BOQ','project,da_nv','single',24,0,1,30,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ASTAGE-4',4,'Phòng Kế hoạch tiếp nhận','Nhân viên Kế hoạch tiếp nhận và chuẩn bị mua hàng','procurement,kh_nv','single',24,0,1,40,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ASTAGE-5',5,'Trưởng phòng Dự án + Kế hoạch xác nhận cuối','Bắt buộc đủ cả hai vai trò xác nhận trước khi được lập PO','da_truong,kh_truong','all_roles',12,0,1,50,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3));

-- Tắt các bậc ngoài phạm vi 5 bậc chuẩn (đồng bộ drizzle/0029)
UPDATE `approval_stage_catalog` SET `active`=0, `updated_at`=CURRENT_TIMESTAMP(3) WHERE `stage_no`>5;
