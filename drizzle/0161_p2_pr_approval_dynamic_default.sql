-- VNTECH ERP V5.3.0 — PHASE 2 (§6 · §23 · §24) · LUỒNG DUYỆT PR ĐỘNG + MẶC ĐỊNH THEO ĐẶC TẢ
-- [CHUỖI SQLite] — tệp này chạy trên SQLite (dev/local + `tests/workflow-direct.test.ts` giải nén TOÀN BỘ
-- `drizzle/*.sql` vào một CSDL trong bộ nhớ). DDL MySQL/InnoDB THẬT của cùng thay đổi nằm ở
-- `java-backend/infrastructure/src/main/resources/db/migration/V21__p2_pr_approval_dynamic_default.sql`
-- (hai chuỗi song song: JS/SQLite theo `drizzle/`, Java/MySQL theo Flyway — xem `docs/agent-progress/TASK-040.md`).
--
-- CHỈ ĐẠO NGƯỜI DÙNG (21/09/2026) — nguyên văn:
--   (1) «luồng duyệt chính là workflow động, bao nhiêu bước không quan trọng chỉ cần nó có khả năng flexible…
--        workflow thay đổi thì luồng duyệt cũng thay đổi theo.»
--   (2) «luồng duyệt hiện tại tôi muốn thực hiện là giống như bản đặc tả, mỗi tác nhân đóng vai trò như 1 người
--        duyệt, không tính người tạo đơn.»
--   (3) «tất cả các user đều có quyền tạo» (đơn đề nghị mua hàng).
--   (5) «không xoá bất cứ table hay trường nào khi chưa hỏi.»
--
-- ⇒ TỆP NÀY CHỈ **THÊM**: 1 cột mới (`stage_kind`), 3 dòng bước cung ứng 101/102/103 (trước đây khai bằng literal
--    trong mã nguồn ⇒ quản trị viên KHÔNG đổi được), cấu hình lại 4 bước duyệt + dòng MẪU quyền phòng ban.
--    Ràng buộc #5 tuân thủ tuyệt đối: KHÔNG xoá bảng · KHÔNG xoá cột · KHÔNG xoá dữ liệu · KHÔNG làm rỗng bảng.
--    Dữ liệu phiếu đang chạy (`approvals` + các cột `*_snapshot`) KHÔNG bị chạm ⇒ §24 tương thích ngược.

-- (1) Phân loại bước NGAY TRONG DỮ LIỆU (bỏ mốc cứng `stage_no < 100` trong mã nguồn):
--     'approval' = bước duyệt HỒ SƠ (vào chuỗi duyệt phiếu) · 'supply' = bước CUNG ỨNG/xử lý.
ALTER TABLE approval_stage_catalog ADD COLUMN stage_kind TEXT NOT NULL DEFAULT 'approval';
--> statement-breakpoint

-- (2) MẶC ĐỊNH ĐÚNG ĐẶC TẢ §6 — mỗi tác nhân = MỘT người duyệt, thứ tự:
--     Thư ký Tổng giám đốc → Phòng Dự án → Phòng Kế hoạch → Giám đốc.
--     Không bỏ dòng nào: bước 1 (CHT xác nhận nhu cầu) chuyển sang active=0 vì KHÔNG thuộc 4 tác nhân của đặc tả
--     và chính là «người tạo đơn tự xác nhận» — việc loại người tạo nay do `lib/p2-approval-flow.mjs` làm bằng
--     DỮ LIỆU vai trò (`matchedStageRole`), không phải bằng một bước cứng trong luồng.
UPDATE approval_stage_catalog SET name='CHT xác nhận nhu cầu', active=0, auto_approve_on_submit=0, stage_kind='approval', updated_at=CURRENT_TIMESTAMP WHERE stage_no=1;
--> statement-breakpoint
UPDATE approval_stage_catalog SET name='Thư ký Tổng giám đốc', description='Kiểm tra hồ sơ và duyệt chuyển Phòng Dự án (bước 1/4 của đặc tả §6)', allowed_role_codes='thuky,thu_ky_tgd', approval_mode='single', sla_hours=12, auto_approve_on_submit=0, active=1, sort_order=10, stage_kind='approval', updated_at=CURRENT_TIMESTAMP WHERE stage_no=2;
--> statement-breakpoint
UPDATE approval_stage_catalog SET name='Phòng Dự án', description='Kiểm tra BOQ, khối lượng, lũy kế, tồn kho, hàng chờ giao và phát sinh (bước 2/4 của đặc tả §6)', allowed_role_codes='project,da_nv', approval_mode='single', sla_hours=24, auto_approve_on_submit=0, active=1, sort_order=20, stage_kind='approval', updated_at=CURRENT_TIMESTAMP WHERE stage_no=3;
--> statement-breakpoint
UPDATE approval_stage_catalog SET name='Phòng Kế hoạch', description='Tiếp nhận nhu cầu, ưu tiên tồn/điều chuyển trước mua, chuẩn bị RFQ và PO (bước 3/4 của đặc tả §6)', allowed_role_codes='procurement,kh_nv', approval_mode='single', sla_hours=24, auto_approve_on_submit=0, active=1, sort_order=30, stage_kind='approval', updated_at=CURRENT_TIMESTAMP WHERE stage_no=4;
--> statement-breakpoint
UPDATE approval_stage_catalog SET name='Giám đốc', description='Phê duyệt cuối trước khi chuyển hồ sơ sang Mua hàng & PO (bước 4/4 của đặc tả §6)', allowed_role_codes='director,tgd,giam_doc', approval_mode='single', sla_hours=12, auto_approve_on_submit=0, active=1, sort_order=40, stage_kind='approval', updated_at=CURRENT_TIMESTAMP WHERE stage_no=5;
--> statement-breakpoint

-- (3) BƯỚC CUNG ỨNG 101/102/103 — trước đây KHÔNG có trong danh mục (khai bằng literal `? :` trong
--     `scripts/system-route.mjs:1744` và trong UI) ⇒ quản trị viên KHÔNG thể đổi người duyệt/SLA.
--     Nay đưa vào DANH MỤC để đổi được bằng giao diện; stage_kind='supply' giữ chúng NGOÀI chuỗi duyệt phiếu.
INSERT OR IGNORE INTO approval_stage_catalog (id,stage_no,name,description,allowed_role_codes,approval_mode,sla_hours,auto_approve_on_submit,active,sort_order,stage_kind,created_at,updated_at) VALUES
('ASTAGE-101',101,'Lập & phát hành PO','Phòng Kế hoạch lập và phát hành đơn mua hàng','procurement,kh_nv,kh_truong','single',24,0,1,110,'supply',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('ASTAGE-102',102,'Giao nhận','Thủ kho xác nhận giao nhận theo PO','warehouse,thu_kho','single',24,0,1,120,'supply',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('ASTAGE-103',103,'BCH xác nhận giao hàng','Ban chỉ huy xác nhận chất lượng/khối lượng thực nhận','commander,cht','single',24,0,1,130,'supply',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
--> statement-breakpoint

-- (4) MẪU QUYỀN PHÒNG BAN: đơn đề nghị mua hàng — MỌI tài khoản đều có quyền TẠO. Dòng MẪU này là nguồn để
--     user MỚI được seed quyền nền khi tạo tài khoản (Java `UserManagementUseCase.replaceDepartmentDefaults`
--     coi `department_module_permissions` là «nguồn chính»; JS nay đọc CÙNG bảng này).
--     ⚠️ CHỈ cấp can_view/can_use/can_create/can_export — TUYỆT ĐỐI KHÔNG cấp can_approve.
INSERT OR IGNORE INTO department_module_permissions (id,organization_unit_id,module_key,can_view,can_use,can_create,can_edit,can_approve,can_export,active,updated_by,created_at,updated_at)
SELECT 'DMP-P2REQ-' || o.id, o.id, 'requests', 1, 1, 1, 0, 0, 1, 1, 'PHASE-2', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  FROM organization_units o
 WHERE o.active = 1
   AND NOT EXISTS (SELECT 1 FROM department_module_permissions d WHERE d.organization_unit_id = o.id AND d.module_key = 'requests');
