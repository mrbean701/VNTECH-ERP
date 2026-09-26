# F-04 — HÀNH CHÍNH: KIẾN TRÚC **CHẤM CÔNG · LỊCH LÀM VIỆC · NGHỈ PHÉP**

> **Nguyên văn mục lộ trình** (`docs/25_TODO_ROADMAP.md:226`, PHASE 10):
> «`F-04` | Hành chính | **Kiến trúc: chấm công · lịch làm việc · nghỉ phép** | P5 | **WF-06** | **TBL** | - | - | - | TODO»
>
> **Nguyên văn PHASE 10** (`docs/25_TODO_ROADMAP.md:219`): «# PHASE 10 — MODULE TƯƠNG LAI
> (**CHỈ AUDIT + CHUẨN BỊ KIẾN TRÚC**)».
>
> ⇒ **BẢN CHẤT = CHUẨN BỊ KIẾN TRÚC**, không phải triển khai. Hồ sơ này định hình **lược đồ mục tiêu,
> điểm cắm quyền, cách tái dùng engine duyệt WF-06, kế hoạch migration 2 chuỗi** — để khi nghiệp vụ
> được chốt thì việc thi công là **đường thẳng**.
> ⇒ **NGOÀI PHẠM VI**: không dựng bảng thật, không thêm action, không màn hình, không migration,
> **không triển khai nghiệp vụ**. Mọi DDL trong hồ sơ là **ĐỀ XUẤT — CHƯA ÁP DỤNG**.

- **HEAD khi đo:** `729be05` · **nhánh:** `unity` · **ngày đo:** 22/09/2026 · MySQL 8.0 schema `vntech_erp` (chỉ ĐỌC).
- **Mục phụ thuộc khai báo `WF-06`** = «Chuẩn bị mở rộng: nghỉ phép · tăng ca · chấm công bù · form tương lai»
  — trong roadmap **đã `DONE / SAN-SANG-MO-RONG`**, hồ sơ `docs/agent-progress/WF-06-SAN-SANG-MO-RONG.md`.

---

## 1. HIỆN TRẠNG ĐO ĐƯỢC («cái gì CHƯA có» — cũng là bằng chứng)

```sql
-- (a) bảng HR-lịch: đếm bảng theo từ khoá
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='vntech_erp'
 AND (table_name LIKE '%leave%' OR table_name LIKE '%holiday%' OR table_name LIKE '%attendance%'
   OR table_name LIKE '%overtime%' OR table_name LIKE '%shift%' OR table_name LIKE '%calendar%'
   OR table_name LIKE '%timesheet%' OR table_name LIKE '%payroll%' OR table_name LIKE '%work_sched%');
-- (b) cột mang nghĩa lịch/ca
SELECT table_name, column_name FROM information_schema.columns WHERE table_schema='vntech_erp'
 AND (column_name LIKE '%sched%' OR column_name LIKE '%shift%' OR column_name LIKE '%calendar%'
   OR column_name LIKE '%working_day%');
```

| Kết quả | Số đo | Kết luận |
|---|---|---|
| Bảng cho **nghỉ phép / ngày lễ / chấm công / tăng ca / ca làm việc / lịch làm việc / bảng công** | **0** (trên tổng **123** bảng) | **CONFIRMED: chưa có gì** |
| Cột mang nghĩa lịch/ca trong toàn bộ **1574** cột | **1**: `construction_daily_logs.shift` | **CONFIRMED — gần giống nhưng KHÁC nghiệp vụ**: đó là **ca thi công** trong nhật ký công trường (`construction_daily_logs`), không phải ca làm việc/chấm công của nhân sự |

**Neo (anchor) ĐANG CÓ mà kiến trúc mới phải bám vào** (`COUNT(*)` / cột thật):

| Neo | Số đo | Cột dùng được | Vai trò trong thiết kế |
|---|---|---|---|
| `users` | **13** dòng · 18 cột | `id` · `employee_code` · `full_name` · `department` · **`organization_unit_id`** · `approval_limit` · `active` · `email` | **Chủ thể chấm công/nghỉ phép** — KHÔNG tạo bảng nhân viên mới |
| `hr_records` | **4** dòng · 16 cột | `user_id` · `full_name` · `identity_no` · `joined_date` · `position` · `phone` | Hồ sơ nhân sự (ngày vào làm = mốc tính phép) |
| `labor_contracts` | **2** dòng · 13 cột | `user_id` · `contract_type` · `start_date` · `end_date` · `salary` · `status` | Hợp đồng lao động (điều kiện hưởng phép) |
| `benefit_records` | **1** dòng · 13 cột | `user_id` · `benefit_type` · `start_date` · `end_date` · `monthly_amount` | Chế độ/bảo hiểm (nghỉ thai sản, ốm) |
| `organization_units` | **8** dòng | `id` (+ cây đơn vị) | Phạm vi áp lịch làm việc theo đơn vị |
| `role_catalog` | có thật | mã vai trò | Vai trò duyệt (`allowed_role_codes`) |

**Khoá module Hành chính ĐANG CÓ (3 khoá, dùng lại được — KHÔNG cần khoá mới cho 3 màn cũ):**

| Khoá | Nhãn | Khai báo mã | Dữ liệu `module_catalog` |
|---|---|---|---|
| `dept_legal_hr` | Hồ sơ nhân sự | `lib/menu-helpers.ts:66` · `scripts/system-route.mjs:14` | CÓ · nhóm `hr_legal` · `active=1` · `system_locked=1` |
| `dept_legal_labor` | Hợp đồng lao động | `lib/menu-helpers.ts:67` | CÓ · `hr_legal` · `active=1` · `system_locked=1` |
| `dept_legal_benefits` | Bảo hiểm & Chế độ | `lib/menu-helpers.ts:71` | CÓ · `hr_legal` · `active=1` · `system_locked=1` |

Action HR đang có (đủ **2 đường ghi** JS + Java):
`save_hr_record` (`scripts/system-route.mjs:2196` ↔ `SystemController.java:725`) ·
`save_labor_contract` (`:2202` ↔ `:730`) · `set_labor_contract_status` (`:2208` ↔ `:735`) ·
`delete_labor_contract` (`:2211` ↔ `:800`) · `save_benefit_record` (`:2249` ↔ `:785`) ·
`set_benefit_record_status` (`:2255` ↔ `:790`) · `delete_benefit_record` (`:2258` ↔ `:795`).
Ma trận quyền: `ActionRbacRegistry.java:144` (`save_hr_record`) · `:145` (`save_labor_contract`) ·
`:131` (`save_benefit_record`) · `:333/:334/:320` (capability `canCreate`).
**⇒ CONFIRMED: 3 khoá `dept_legal_*` + 7 action đã có, mọi thứ mới phải NỐI VÀO đây, không dựng song song.**

---

## 2. TÁI DÙNG ENGINE DUYỆT `WF-06` (phụ thuộc khai báo — kiểm chứng bằng số)

| Yếu tố engine | Số đo THẬT | Ý nghĩa cho F-04 |
|---|---|---|
| `workflow_definitions` | **4** dòng (`WF-MUAHANG-01`/`requests` · `WF-PO-01`/`purchasing` · `WF-XUATKHO-01`/`warehouse_issue` · `WF-NHAPKHO-01`/`warehouse_receipt`) | **0 quy trình cho HR** ⇒ phải thêm **DỮ LIỆU**, không sửa mã |
| `workflow_definitions.module_key` | cột CÓ THẬT | **Điểm định danh**: `hr_leave`, `hr_overtime` sẽ là 2 giá trị mới của cột này |
| `workflow_steps` | **11** dòng, 11 cột (`workflow_id`, `step_no`, `approval_mode`, `sla_hours`, `allow_skip_level`, `required_permission`, `active`, …) | Bước duyệt khai bằng **dữ liệu** |
| `workflow_step_approvers` | **5** dòng | Người duyệt theo bước |
| `approval_stage_catalog` | **8** dòng · 13 cột (gồm `approval_mode` default `single`, `stage_kind` default `approval`) | Duyệt 1 cấp / `any_of` / `all_of` — **đã có sẵn dạng dữ liệu** |
| `approvals` | **124** dòng | Sổ quyết định duyệt đang chạy thật |
| `task_notifications` | **3** dòng | Thông báo theo bước |
| `attachments` | **11** dòng (`entity_type`) | Đính kèm đơn (giấy tờ, ảnh) — dùng LẠI, không tạo bảng tệp mới |

**Kết luận: CONFIRMED** — engine phê duyệt **đủ tổng quát** để nhận loại phiếu mới **chỉ bằng dữ liệu**
(khớp hồ sơ `WF-06` §2). F-04 vì vậy **không đề xuất sửa engine**, chỉ **cấp `module_key`** cho 2 loại phiếu mới.

---

## 3. LƯỢC ĐỒ MỤC TIÊU (ĐỀ XUẤT — **CHƯA ÁP DỤNG**)

> ⛔ **CHƯA ÁP DỤNG** vì: (a) nguyên văn PHASE 10 là «CHỈ AUDIT + CHUẨN BỊ KIẾN TRÚC»;
> (b) nghiệp vụ (mấy ca, ai duyệt, mấy cấp, SLA, cách trừ phép) **chưa được người dùng chốt** —
> thi công trước là **tự suy đoán nghiệp vụ**; (c) chuỗi migration phải thêm **ĐỒNG THỜI**
> `drizzle/NNNN_*.sql` **và** `java-backend/.../db/migration/Vnn__*.sql` — nhánh `java-backend/**`
> **ngoài phạm vi lượt này**, thêm lệch một nửa sẽ tạo **drift lược đồ** (đã bị ghi nhận ở `TASK-104`).
> ⛔ **Tuyệt đối additive**: chỉ `CREATE TABLE IF NOT EXISTS` + (khi cần) `ALTER TABLE … ADD`.
> KHÔNG `DROP TABLE`/`DROP COLUMN`/`TRUNCATE`/xoá dữ liệu — ràng buộc cứng của người dùng.

```sql
-- (1) CA LÀM VIỆC — danh mục ca (giờ vào/giờ ra, số công quy đổi)
CREATE TABLE IF NOT EXISTS `hr_shift_definitions` (
  `id` varchar(64) NOT NULL,
  `code` varchar(64) NOT NULL,
  `name` text NOT NULL,
  `start_time` varchar(5) NOT NULL,
  `end_time` varchar(5) NOT NULL,
  `break_minutes` int NOT NULL DEFAULT 0,
  `work_units` decimal(6,2) NOT NULL DEFAULT 1.00,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` varchar(64) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `hr_shift_definitions_uidx_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- (2) PHÂN CA cho nhân sự (khoảng hiệu lực) — neo vào users ĐANG CÓ
CREATE TABLE IF NOT EXISTS `hr_employee_shifts` (
  `id` varchar(64) NOT NULL,
  `user_id` varchar(64) NOT NULL,
  `shift_id` varchar(64) NOT NULL,
  `effective_from` date NOT NULL,
  `effective_to` date DEFAULT NULL,
  `note` text,
  `created_by` varchar(64) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_hr_employee_shifts_user` (`user_id`),
  CONSTRAINT `fk_hr_employee_shifts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_hr_employee_shifts_shift` FOREIGN KEY (`shift_id`) REFERENCES `hr_shift_definitions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- (3) LỊCH LÀM VIỆC theo phạm vi (công ty / đơn vị / dự án) — tuần chuẩn 7 ký tự
CREATE TABLE IF NOT EXISTS `hr_work_calendars` (
  `id` varchar(64) NOT NULL,
  `code` varchar(64) NOT NULL,
  `name` text NOT NULL,
  `scope_type` varchar(16) NOT NULL DEFAULT 'company',
  `scope_id` varchar(64) DEFAULT NULL,
  `week_pattern` varchar(20) NOT NULL DEFAULT '1,1,1,1,1,1,0',
  `effective_from` date NOT NULL,
  `effective_to` date DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` varchar(64) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `hr_work_calendars_uidx_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- (4) NGÀY ĐẶC BIỆT của lịch (ngày lễ · ngày làm bù · ngày làm 1 phần) — 1 dòng / 1 ngày
CREATE TABLE IF NOT EXISTS `hr_calendar_days` (
  `id` varchar(64) NOT NULL,
  `calendar_id` varchar(64) NOT NULL,
  `day_date` date NOT NULL,
  `day_type` varchar(16) NOT NULL DEFAULT 'working',
  `work_units` decimal(6,2) NOT NULL DEFAULT 1.00,
  `note` text,
  `created_by` varchar(64) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `hr_calendar_days_uidx_day` (`calendar_id`,`day_date`),
  CONSTRAINT `fk_hr_calendar_days_calendar` FOREIGN KEY (`calendar_id`) REFERENCES `hr_work_calendars` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- (5) LOẠI NGHỈ (phép năm · ốm · thai sản · không lương …) — có trả lương hay không, có cần duyệt hay không
CREATE TABLE IF NOT EXISTS `hr_leave_types` (
  `id` varchar(64) NOT NULL,
  `code` varchar(64) NOT NULL,
  `name` text NOT NULL,
  `paid` tinyint(1) NOT NULL DEFAULT 1,
  `requires_approval` tinyint(1) NOT NULL DEFAULT 1,
  `max_days_per_year` decimal(6,2) NOT NULL DEFAULT 0.00,
  `carry_over` tinyint(1) NOT NULL DEFAULT 0,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `hr_leave_types_uidx_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- (6) SỐ DƯ PHÉP theo năm — hạn mức, chuyển tiếp, đã dùng
CREATE TABLE IF NOT EXISTS `hr_leave_balances` (
  `id` varchar(64) NOT NULL,
  `user_id` varchar(64) NOT NULL,
  `leave_type_id` varchar(64) NOT NULL,
  `period_year` int NOT NULL,
  `entitled_days` decimal(6,2) NOT NULL DEFAULT 0.00,
  `carried_days` decimal(6,2) NOT NULL DEFAULT 0.00,
  `used_days` decimal(6,2) NOT NULL DEFAULT 0.00,
  `note` text,
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `hr_leave_balances_uidx` (`user_id`,`leave_type_id`,`period_year`),
  CONSTRAINT `fk_hr_leave_balances_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_hr_leave_balances_type` FOREIGN KEY (`leave_type_id`) REFERENCES `hr_leave_types` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- (7) ĐƠN NGHỈ PHÉP — nối thẳng vào engine duyệt bằng cột workflow_id
CREATE TABLE IF NOT EXISTS `hr_leave_requests` (
  `id` varchar(64) NOT NULL,
  `request_no` varchar(64) NOT NULL,
  `user_id` varchar(64) NOT NULL,
  `leave_type_id` varchar(64) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `total_days` decimal(6,2) NOT NULL DEFAULT 0.00,
  `reason` text,
  `status` varchar(32) NOT NULL DEFAULT 'draft',
  `workflow_id` varchar(64) DEFAULT NULL,
  `submitted_at` datetime(3) DEFAULT NULL,
  `decided_at` datetime(3) DEFAULT NULL,
  `decided_by` varchar(64) DEFAULT NULL,
  `note` text,
  `created_by` varchar(64) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `hr_leave_requests_uidx_no` (`request_no`),
  KEY `idx_hr_leave_requests_user_date` (`user_id`,`start_date`),
  CONSTRAINT `fk_hr_leave_requests_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_hr_leave_requests_type` FOREIGN KEY (`leave_type_id`) REFERENCES `hr_leave_types` (`id`),
  CONSTRAINT `fk_hr_leave_requests_workflow` FOREIGN KEY (`workflow_id`) REFERENCES `workflow_definitions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- (8) ĐƠN TĂNG CA — cùng khuôn engine duyệt, 1 dòng / 1 ngày / 1 người
CREATE TABLE IF NOT EXISTS `hr_overtime_requests` (
  `id` varchar(64) NOT NULL,
  `request_no` varchar(64) NOT NULL,
  `user_id` varchar(64) NOT NULL,
  `work_date` date NOT NULL,
  `hours` decimal(6,2) NOT NULL DEFAULT 0.00,
  `reason` text,
  `status` varchar(32) NOT NULL DEFAULT 'draft',
  `workflow_id` varchar(64) DEFAULT NULL,
  `submitted_at` datetime(3) DEFAULT NULL,
  `decided_at` datetime(3) DEFAULT NULL,
  `decided_by` varchar(64) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `hr_overtime_requests_uidx_no` (`request_no`),
  KEY `idx_hr_overtime_requests_user_date` (`user_id`,`work_date`),
  CONSTRAINT `fk_hr_overtime_requests_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_hr_overtime_requests_workflow` FOREIGN KEY (`workflow_id`) REFERENCES `workflow_definitions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**8 bảng, 100% tiền tố `hr_`, 0 trùng tên bảng đang có** (đối chiếu tự động với ảnh chụp 123 bảng —
`scripts/phase10-architecture-gate.mjs` mục [3]). Bảng **chấm công** thuộc `F-05`
(`hr_attendance_records` · `hr_attendance_periods`) — xem `docs/agent-progress/F-05-LICH-KIEN-TRUC.md`.

---

## 4. MẶT API MỚI (NEW) — **CHƯA CÀI ĐẶT**

Mọi action dưới đây đã kiểm **CHƯA TỒN TẠI** ở cả 3 nơi (JS `scripts/system-route.mjs` · Java
`SystemController.java` · ma trận `ActionRbacRegistry.java`) — số đo: **0/0/0** cho 12 tên.
Khi thi công, mỗi action phải có **2 đường ghi** (JS + Java) + **2 dòng ma trận quyền** (module + capability).

| Action | Khoá module | Capability | `module_key` engine | Ghi chú thi công |
|---|---|---|---|---|
| `save_shift_definition` | `dept_legal_hr` | `canCreate` | — | Danh mục ca; dùng LẠI khoá `dept_legal_hr` |
| `assign_employee_shift` | `dept_legal_hr` | `canEdit` | — | Phân ca theo khoảng hiệu lực |
| `save_work_calendar` | `dept_legal_hr` | `canEdit` | — | Lịch làm việc theo phạm vi |
| `save_calendar_day` | `dept_legal_hr` | `canEdit` | — | Ngày lễ / ngày làm bù |
| `save_leave_type` | `dept_legal_hr` | `canEdit` | — | Loại nghỉ + hạn mức năm |
| `save_leave_request` | `dept_legal_hr` | `canCreate` | `hr_leave` | Gửi đơn → engine duyệt WF-06 |
| `save_overtime_request` | `dept_legal_hr` | `canCreate` | `hr_overtime` | Gửi đơn tăng ca → engine duyệt WF-06 |

Quyết định duyệt **KHÔNG thêm action mới**: dùng `decide_approval` (`scripts/system-route.mjs:16`,
module `approvals`, capability `canApprove`) — engine đã có, phiếu mới chỉ cần `module_key`.

**Cần thêm DỮ LIỆU (không phải mã):** 1 dòng `module_catalog` cho mỗi màn MỚI (nhóm `hr_legal`),
2 dòng `workflow_definitions` (`hr_leave`, `hr_overtime`) + N dòng `workflow_steps`, và quyền cho
`role_catalog`/`user_module_permissions`.

---

## 5. KẾ HOẠCH THI CÔNG KHI NGHIỆP VỤ ĐƯỢC CHỐT (đường thẳng, không viết lại engine)

| # | Bước | Sản phẩm | Cổng kiểm |
|---|---|---|---|
| 1 | Chốt nghiệp vụ (mục 6) | biên bản chốt | người dùng xác nhận |
| 2 | Migration **2 chuỗi** | `drizzle/NNNN_hr_*.sql` + `java-backend/.../migration/Vnn__hr_*.sql` (additive) | `probe-schema-drift` không xấu đi; H2 test schema |
| 3 | Mã 2 đường ghi | `scripts/system-route.mjs` + `SystemController.java` (+ adapter/store) | `probe-action-parity` · `probe-action-module-parity` |
| 4 | Quyền | `ActionRbacRegistry.java` + `MODULE_KEYS` + `lib/menu-helpers.ts` + `module_catalog` | `probe-action-role-parity` |
| 5 | Engine duyệt | 2 dòng `workflow_definitions` + `workflow_steps` | `tests/workflow-direct.test.ts` (thêm ca loại phiếu mới) |
| 6 | Giao diện | tab + form (dùng lại `EntityDetailModal`/`DataTable`/`ApprovalTimeline`) | `probe-modal-branch-coverage` |
| 7 | Kiểm thử | test hợp đồng cho từng bảng/action | ĐỎ→XANH |

---

## 6. CÂU HỎI NGHIỆP VỤ PHẢI CHỐT TRƯỚC KHI THI CÔNG (KHÔNG tự suy đoán)

| # | Câu hỏi | Ảnh hưởng tới thiết kế | Trạng thái |
|---|---|---|---|
| 1 | **Mấy ca** một ngày? Ca gãy (nghỉ giữa) tính công thế nào? | `hr_shift_definitions.work_units`, `break_minutes` | **BLOCKED** |
| 2 | **Tuần làm việc chuẩn**: thứ 7 có làm? (mẫu mặc định đề xuất `1,1,1,1,1,1,0`) | `hr_work_calendars.week_pattern` | **BLOCKED** |
| 3 | **Ai duyệt, mấy cấp, thứ tự** cho đơn nghỉ phép và tăng ca? | `workflow_steps` (dữ liệu) | **BLOCKED** |
| 4 | **SLA** mỗi cấp (giờ)? Duyệt đồng thời hay tuần tự (`single`/`any_of`/`all_of`)? | `workflow_steps.sla_hours`, `approval_mode` | **BLOCKED** |
| 5 | **Cách trừ phép**: trừ theo ngày làm việc hay ngày dương lịch? Nghỉ nửa ngày? Chuyển phép sang năm sau? | `hr_leave_balances`, `hr_leave_requests.total_days` | **BLOCKED** |
| 6 | **Hạn mức phép năm** theo luật hay theo hợp đồng? | `hr_leave_types.max_days_per_year` | **BLOCKED** |
| 7 | Có cần **đính kèm giấy tờ** (nghỉ ốm/thai sản) không? | dùng lại `attachments` (`entity_type`) | **UNKNOWN** |
| 8 | Chấm công bằng **nguồn nào** (tay / nhập file / thiết bị)? | thuộc `F-05`, bảng `hr_attendance_records.source` | **BLOCKED** |

---

## 7. KẾT LUẬN

| # | Kết luận | Mức | Bằng chứng |
|---|---|---|---|
| 1 | **0 bảng** cho chấm công/lịch làm việc/nghỉ phép/ngày lễ/tăng ca (123 bảng hiện có) | **CONFIRMED** | §1 (SQL đếm bảng) |
| 2 | **3 khoá module + 7 action + 3 bảng neo** HR đã có, đủ 2 đường ghi | **CONFIRMED** | §1 (bảng `file:dòng`) |
| 3 | **Tái dùng được engine WF-06** chỉ bằng dữ liệu (`workflow_definitions.module_key`) | **CONFIRMED** | §2 |
| 4 | Lược đồ mục tiêu **8 bảng** tiền tố `hr_`, không trùng bảng đang có, DDL additive thuần | **CONFIRMED** | §3 + cổng đo mục [3] |
| 5 | **12 action đề xuất** chưa tồn tại ở cả 3 nơi | **CONFIRMED** | §4 + cổng đo mục [5] |
| 6 | Nghiệp vụ (ca · tuần · cấp duyệt · SLA · cách trừ phép) **chưa chốt** ⇒ thi công bây giờ là suy đoán | **CONFIRMED** | §6 |
| 7 | Engine có đủ cho nghỉ phép nửa ngày / nhiều cấp không | **LIKELY** đủ (`approval_mode` + `work_units`) — cần đo khi có dữ liệu thật | §2 |
| 8 | Hiệu năng bảng công khi vài nghìn nhân sự × 365 ngày | **UNKNOWN** — chưa có nguồn (chưa có dữ liệu để đo) | — |

---

## 8. ĐỊNH NGHĨA HOÀN THÀNH CỦA `F-04` (đối chiếu nguyên văn mục)

- [x] **Kiến trúc** cho **chấm công · lịch làm việc · nghỉ phép**: lược đồ mục tiêu + ranh giới F-04/F-05 (§1, §3).
- [x] **Phụ thuộc `WF-06`** được kiểm chứng bằng **số thật** + chỉ rõ **điểm nối** (§2).
- [x] **Điểm cắm quyền/menu/engine** và **kế hoạch thi công 7 bước** (§4, §5).
- [x] **Mọi kết luận gắn CONFIRMED/LIKELY/UNKNOWN**, số nào không có nguồn ghi **«chưa có nguồn»** (§7).
- [x] **Không triển khai nghiệp vụ**: **0** dòng `scripts/**` · `app/**` · `drizzle/**` bị sửa; **0** DDL áp dụng.
- [x] **Additive**: DDL chỉ `CREATE TABLE IF NOT EXISTS`; **0** `DROP`/`TRUNCATE`/xoá dữ liệu.
- [x] **Cổng máy**: `tests/f04-f05-hanh-chinh-lich-kien-truc.test.mjs` + `node scripts/phase10-architecture-gate.mjs`.
