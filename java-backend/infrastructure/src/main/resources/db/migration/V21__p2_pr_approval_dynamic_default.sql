-- VNTECH ERP V5.3.0 — PHASE 2 (§6 · §23 · §24) · LUỒNG DUYỆT PR ĐỘNG + MẶC ĐỊNH THEO ĐẶC TẢ + QUYỀN TẠO PR
-- [CHUỖI MySQL/InnoDB — Flyway] — bản sao DDL/DML của `drizzle/0161_p2_pr_approval_dynamic_default.sql`
-- (chuỗi SQLite dùng cho dev/local + bộ test trong bộ nhớ). Hai chuỗi SONG SONG có chủ đích: JS/SQLite theo
-- `drizzle/`, Java/MySQL theo Flyway — xem `docs/agent-progress/TASK-040.md`.
--
-- CHỈ ĐẠO NGƯỜI DÙNG (21/09/2026):
--   (1) «luồng duyệt chính là workflow động… workflow thay đổi thì luồng duyệt cũng thay đổi theo.»
--   (2) «mỗi tác nhân đóng vai trò như 1 người duyệt, không tính người tạo đơn (canCreatePR).»
--   (3) «đây là luồng duyệt của đơn đề nghị mua hàng nên tất cả các user đều có quyền tạo, hãy tự động thêm
--        quyền cho các user hiện tại.»
--   (5) «không xoá bất cứ table hay trường nào khi chưa hỏi.»
--
-- RÀNG BUỘC: tệp này CHỈ **THÊM** — thêm 1 cột, thêm các dòng cấu hình còn thiếu, thêm dòng quyền còn thiếu.
-- KHÔNG xoá bảng · KHÔNG xoá cột · KHÔNG xoá dữ liệu · KHÔNG làm rỗng bảng. Dữ liệu phiếu đang chạy
-- (`approvals` + các cột snapshot) KHÔNG bị chạm ⇒ §24 tương thích ngược: phiếu CŨ vẫn hiển thị và vẫn chạy
-- đúng luồng đã tạo, chỉ phiếu MỚI dùng cấu hình mới.

-- ═══════════════════════════════════════════════════════════════════════════════════════════════════════════
-- (1) PHÂN LOẠI BƯỚC NGAY TRONG DỮ LIỆU — bỏ mốc cứng `stage_no < 100` ở `scripts/system-route.mjs`
--     approval = bước duyệt HỒ SƠ (vào chuỗi duyệt phiếu) · supply = bước CUNG ỨNG/xử lý (101/102/103)
-- ═══════════════════════════════════════════════════════════════════════════════════════════════════════════
SET @col_exists := (SELECT COUNT(*) FROM information_schema.columns
                     WHERE table_schema = DATABASE() AND table_name = 'approval_stage_catalog' AND column_name = 'stage_kind');
SET @ddl := IF(@col_exists = 0,
  'ALTER TABLE approval_stage_catalog ADD COLUMN stage_kind VARCHAR(16) NOT NULL DEFAULT ''approval''',
  'DO 0');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE approval_stage_catalog SET stage_kind = 'approval' WHERE stage_kind IS NULL OR stage_kind = '';

-- ═══════════════════════════════════════════════════════════════════════════════════════════════════════════
-- (2) MẶC ĐỊNH ĐÚNG ĐẶC TẢ §6 — Thư ký TGĐ → Phòng Dự án → Phòng Kế hoạch → Giám đốc (mỗi tác nhân 1 người duyệt)
--     Bước 1 (CHT xác nhận nhu cầu) NGỪNG áp dụng cho phiếu mới (active=0) — không thuộc 4 tác nhân của đặc tả,
--     và «người tạo đơn tự xác nhận» nay do DỮ LIỆU vai trò quyết định (lib/p2-approval-flow.mjs).
-- ═══════════════════════════════════════════════════════════════════════════════════════════════════════════
UPDATE approval_stage_catalog SET name='CHT xác nhận nhu cầu', active=0, auto_approve_on_submit=0, stage_kind='approval', updated_at=NOW(3) WHERE stage_no=1;
UPDATE approval_stage_catalog SET name='Thư ký Tổng giám đốc', description='Kiểm tra hồ sơ và duyệt chuyển Phòng Dự án (bước 1/4 của đặc tả §6)', allowed_role_codes='thuky,thu_ky_tgd', approval_mode='single', sla_hours=12, auto_approve_on_submit=0, active=1, sort_order=10, stage_kind='approval', updated_at=NOW(3) WHERE stage_no=2;
UPDATE approval_stage_catalog SET name='Phòng Dự án', description='Kiểm tra BOQ, khối lượng, lũy kế, tồn kho, hàng chờ giao và phát sinh (bước 2/4 của đặc tả §6)', allowed_role_codes='project,da_nv', approval_mode='single', sla_hours=24, auto_approve_on_submit=0, active=1, sort_order=20, stage_kind='approval', updated_at=NOW(3) WHERE stage_no=3;
UPDATE approval_stage_catalog SET name='Phòng Kế hoạch', description='Tiếp nhận nhu cầu, ưu tiên tồn/điều chuyển trước mua, chuẩn bị RFQ và PO (bước 3/4 của đặc tả §6)', allowed_role_codes='procurement,kh_nv', approval_mode='single', sla_hours=24, auto_approve_on_submit=0, active=1, sort_order=30, stage_kind='approval', updated_at=NOW(3) WHERE stage_no=4;
UPDATE approval_stage_catalog SET name='Giám đốc', description='Phê duyệt cuối trước khi chuyển hồ sơ sang Mua hàng & PO (bước 4/4 của đặc tả §6)', allowed_role_codes='director,tgd,giam_doc', approval_mode='single', sla_hours=12, auto_approve_on_submit=0, active=1, sort_order=40, stage_kind='approval', updated_at=NOW(3) WHERE stage_no=5;

-- Nếu CSDL chưa từng có các bước 2..5 (bản cài mới/tối giản) thì THÊM vào — không ghi đè dòng đang có.
INSERT INTO approval_stage_catalog (id,stage_no,name,description,allowed_role_codes,approval_mode,sla_hours,auto_approve_on_submit,active,sort_order,stage_kind,created_at,updated_at)
SELECT 'ASTAGE-2',2,'Thư ký Tổng giám đốc','Kiểm tra hồ sơ và duyệt chuyển Phòng Dự án (bước 1/4 của đặc tả §6)','thuky,thu_ky_tgd','single',12,0,1,10,'approval',NOW(3),NOW(3)
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM (SELECT stage_no FROM approval_stage_catalog) c WHERE c.stage_no=2);
INSERT INTO approval_stage_catalog (id,stage_no,name,description,allowed_role_codes,approval_mode,sla_hours,auto_approve_on_submit,active,sort_order,stage_kind,created_at,updated_at)
SELECT 'ASTAGE-3',3,'Phòng Dự án','Kiểm tra BOQ, khối lượng, lũy kế, tồn kho, hàng chờ giao và phát sinh (bước 2/4 của đặc tả §6)','project,da_nv','single',24,0,1,20,'approval',NOW(3),NOW(3)
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM (SELECT stage_no FROM approval_stage_catalog) c WHERE c.stage_no=3);
INSERT INTO approval_stage_catalog (id,stage_no,name,description,allowed_role_codes,approval_mode,sla_hours,auto_approve_on_submit,active,sort_order,stage_kind,created_at,updated_at)
SELECT 'ASTAGE-4',4,'Phòng Kế hoạch','Tiếp nhận nhu cầu, ưu tiên tồn/điều chuyển trước mua, chuẩn bị RFQ và PO (bước 3/4 của đặc tả §6)','procurement,kh_nv','single',24,0,1,30,'approval',NOW(3),NOW(3)
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM (SELECT stage_no FROM approval_stage_catalog) c WHERE c.stage_no=4);
INSERT INTO approval_stage_catalog (id,stage_no,name,description,allowed_role_codes,approval_mode,sla_hours,auto_approve_on_submit,active,sort_order,stage_kind,created_at,updated_at)
SELECT 'ASTAGE-5',5,'Giám đốc','Phê duyệt cuối trước khi chuyển hồ sơ sang Mua hàng & PO (bước 4/4 của đặc tả §6)','director,tgd,giam_doc','single',12,0,1,40,'approval',NOW(3),NOW(3)
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM (SELECT stage_no FROM approval_stage_catalog) c WHERE c.stage_no=5);

-- ═══════════════════════════════════════════════════════════════════════════════════════════════════════════
-- (3) BƯỚC CUNG ỨNG 101/102/103 VÀO DANH MỤC — trước đây KHÔNG có trong `approval_stage_catalog` mà khai bằng
--     literal `? :` trong `scripts/system-route.mjs:1744` + trong UI ⇒ quản trị viên KHÔNG thể đổi người
--     duyệt/SLA của 3 bước then chốt. `approval_project_assignments` đang có dòng cho 101/102/103 nhưng thiếu
--     cấu hình tương ứng ⇒ trước đây việc kiểm tra Owner dùng nhánh literal.
-- ═══════════════════════════════════════════════════════════════════════════════════════════════════════════
INSERT INTO approval_stage_catalog (id,stage_no,name,description,allowed_role_codes,approval_mode,sla_hours,auto_approve_on_submit,active,sort_order,stage_kind,created_at,updated_at)
SELECT 'ASTAGE-101',101,'Lập & phát hành PO','Phòng Kế hoạch lập và phát hành đơn mua hàng','procurement,kh_nv,kh_truong','single',24,0,1,110,'supply',NOW(3),NOW(3)
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM (SELECT stage_no FROM approval_stage_catalog) c WHERE c.stage_no=101);
INSERT INTO approval_stage_catalog (id,stage_no,name,description,allowed_role_codes,approval_mode,sla_hours,auto_approve_on_submit,active,sort_order,stage_kind,created_at,updated_at)
SELECT 'ASTAGE-102',102,'Giao nhận','Thủ kho xác nhận giao nhận theo PO','warehouse,thu_kho','single',24,0,1,120,'supply',NOW(3),NOW(3)
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM (SELECT stage_no FROM approval_stage_catalog) c WHERE c.stage_no=102);
INSERT INTO approval_stage_catalog (id,stage_no,name,description,allowed_role_codes,approval_mode,sla_hours,auto_approve_on_submit,active,sort_order,stage_kind,created_at,updated_at)
SELECT 'ASTAGE-103',103,'BCH xác nhận giao hàng','Ban chỉ huy xác nhận chất lượng/khối lượng thực nhận','commander,cht','single',24,0,1,130,'supply',NOW(3),NOW(3)
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM (SELECT stage_no FROM approval_stage_catalog) c WHERE c.stage_no=103);

-- ═══════════════════════════════════════════════════════════════════════════════════════════════════════════
-- (4) USER MỚI — MẪU quyền PHÒNG BAN cho module `requests` (Phiếu đề nghị mua hàng): MỌI tài khoản đều có
--     quyền TẠO. `UserManagementUseCase.replaceDepartmentDefaults:355` coi `department_module_permissions`
--     là «nguồn chính» ⇒ user tạo SAU migration này tự động có `can_create=1` khi tạo tài khoản.
--     CHỈ cấp view/use/create/export — TUYỆT ĐỐI KHÔNG cấp can_approve (không mở quyền duyệt cho mọi người).
-- ═══════════════════════════════════════════════════════════════════════════════════════════════════════════
INSERT INTO department_module_permissions (id,organization_unit_id,module_key,can_view,can_use,can_create,can_edit,can_approve,can_export,active,updated_by,created_at,updated_at)
SELECT CONCAT('DMP-P2REQ-', o.id), o.id, 'requests', 1, 1, 1, 0, 0, 1, 1, 'PHASE-2', NOW(3), NOW(3)
  FROM organization_units o
 WHERE o.active = 1
   AND NOT EXISTS (SELECT 1 FROM department_module_permissions d WHERE d.organization_unit_id = o.id AND d.module_key = 'requests');

-- ═══════════════════════════════════════════════════════════════════════════════════════════════════════════
-- (5) USER HIỆN CÓ — tự động THÊM quyền TẠO phiếu đề nghị mua hàng (chỉ đạo 3):
--     (5a) bản ghi đã có nhưng `can_create=0` ⇒ BẬT can_create (giữ nguyên can_edit/can_approve/can_export);
--     (5b) bản ghi còn THIẾU ⇒ THÊM mới. KHÔNG xoá dòng nào, KHÔNG hạ quyền ai.
-- ═══════════════════════════════════════════════════════════════════════════════════════════════════════════
UPDATE user_module_permissions
   SET can_view = 1, can_use = 1, can_create = 1, updated_at = NOW(3)
 WHERE module_key = 'requests' AND (can_create = 0 OR can_view = 0 OR can_use = 0);

INSERT INTO user_module_permissions (id,user_id,module_key,can_view,can_use,can_create,can_edit,can_approve,can_export,permission_expires_at,permission_source,created_at,updated_at)
SELECT CONCAT('UMP-P2REQ-', u.id), u.id, 'requests', 1, 1, 1, 0, 0, 1, NULL, 'department_default', NOW(3), NOW(3)
  FROM users u
 WHERE u.role <> 'admin'
   AND NOT EXISTS (SELECT 1 FROM user_module_permissions p WHERE p.user_id = u.id AND p.module_key = 'requests');
