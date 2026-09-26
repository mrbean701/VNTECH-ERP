# F-05 — HÀNH CHÍNH: **LỊCH** — NGÀY LÀM VIỆC · NGHỈ PHÉP · NGÀY LỄ · TĂNG CA · CHẤM CÔNG

> **Nguyên văn mục lộ trình** (`docs/25_TODO_ROADMAP.md:227`, PHASE 10):
> «`F-05` | Hành chính | **Lịch: ngày làm việc · nghỉ phép · ngày lễ · tăng ca · chấm công** | P5 | **F-04** | **TBL** | **NEW** | - | - | TODO»
>
> **Nguyên văn PHASE 10** (`docs/25_TODO_ROADMAP.md:219`): «# PHASE 10 — MODULE TƯƠNG LAI
> (**CHỈ AUDIT + CHUẨN BỊ KIẾN TRÚC**)».
>
> ⇒ **BẢN CHẤT = CHUẨN BỊ KIẾN TRÚC cho LỚP LỊCH + CHẤM CÔNG**: `TBL` (bảng mới) + `NEW` (action mới)
> ⇒ hồ sơ này gồm **(A) lược đồ lớp lịch/chấm công** và **(B) MẶT API MỚI** — cả hai **CHƯA ÁP DỤNG**.
> ⇒ **NGOÀI PHẠM VI**: không dựng bảng/action/màn thật, không migration, **không triển khai nghiệp vụ**.
- **Phụ thuộc khai báo `F-04`** = «Kiến trúc: chấm công · lịch làm việc · nghỉ phép»
  ⇒ hồ sơ `docs/agent-progress/F-04-HANH-CHINH-KIEN-TRUC.md` **đã xong trong cùng lượt**:
  F-04 sở hữu **8 bảng nền** (ca · phân ca · lịch · ngày đặc biệt · loại nghỉ · số dư phép · đơn nghỉ · đơn tăng ca),
  F-05 sở hữu **lớp BẢNG CÔNG + KỲ CHỐT CÔNG + mặt API** và **KHÔNG khai lại** bảng của F-04.
- **HEAD:** `729be05` · **nhánh:** `unity` · **ngày đo:** 22/09/2026 · MySQL 8.0 `vntech_erp` (chỉ ĐỌC).

---

## 1. HIỆN TRẠNG ĐO ĐƯỢC — LỚP LỊCH/CHẤM CÔNG CHƯA TỒN TẠI

```sql
-- (a) bảng lớp lịch/chấm công
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='vntech_erp'
 AND (table_name LIKE '%attendance%' OR table_name LIKE '%calendar%' OR table_name LIKE '%holiday%'
   OR table_name LIKE '%timesheet%' OR table_name LIKE '%shift%');
-- (b) cột mang nghĩa lịch/ca trong toàn lược đồ
SELECT table_name, column_name FROM information_schema.columns WHERE table_schema='vntech_erp'
 AND (column_name LIKE '%sched%' OR column_name LIKE '%shift%' OR column_name LIKE '%calendar%'
   OR column_name LIKE '%working_day%');
-- (c) tên action/mã nguồn đã có chưa (kết quả: 0 trên cả 4 lớp mã nguồn)
```

| Hạng mục | Số đo THẬT | Kết luận |
|---|---|---|
| Bảng chấm công / lịch / ngày lễ / ca | **0** (trên **123** bảng) | **CONFIRMED: chưa có** |
| Cột nghĩa lịch/ca toàn lược đồ (**1574** cột) | **1**: `construction_daily_logs.shift` | **CONFIRMED — KHÁC nghiệp vụ** (ca thi công công trường, không phải ca làm việc nhân sự) |
| Chuỗi `attendance` trong `scripts/system-route.mjs` · `java-backend/**/*.java` · `drizzle/*.sql` · `app/**` | **0 · 0 · 0 · 0** | **CONFIRMED: chưa từng có mã nào** |
| Chuỗi `leave_request` / `overtime_request` ở 4 lớp trên | **0 · 0 · 0 · 0** | **CONFIRMED: chưa từng có mã nào** |
| **12 action đề xuất** (F-04 + F-05) ở JS / Java / ma trận quyền | **0 / 0 / 0** mỗi tên | **CONFIRMED: đều là action MỚI** |

**Nguồn lịch ĐANG CÓ (không phải bảng công, nhưng phải biết để không dựng trùng):**
`work_items` (việc có hạn), `projects` (ngày bắt đầu/kết thúc), `task_sla_policies`
(ngưỡng cảnh báo theo giờ — bảng CÓ thật), `task_notifications` (**3** dòng).
⇒ Chúng là **lịch CÔNG VIỆC**, KHÔNG phải **lịch LÀM VIỆC của nhân sự** ⇒ không thay thế được `hr_work_calendars`.

---

## 2. LƯỢC ĐỒ LỚP LỊCH/CHẤM CÔNG (ĐỀ XUẤT — **CHƯA ÁP DỤNG**)

> ⛔ **CHƯA ÁP DỤNG** (cùng 3 lý do như F-04 §3: PHASE 10 chỉ audit+chuẩn bị; nghiệp vụ chưa chốt;
> migration phải thêm đồng thời 2 chuỗi mà `java-backend/**` ngoài phạm vi lượt này).
> ⛔ **Additive thuần**: chỉ `CREATE TABLE IF NOT EXISTS`; KHÔNG `DROP`/`TRUNCATE`/xoá dữ liệu.

```sql
-- (9) BẢNG CÔNG — 1 dòng / 1 nhân sự / 1 ngày / 1 ca (khoá duy nhất chống nhân dòng)
CREATE TABLE IF NOT EXISTS `hr_attendance_records` (
  `id` varchar(64) NOT NULL,
  `user_id` varchar(64) NOT NULL,
  `work_date` date NOT NULL,
  `shift_id` varchar(64) DEFAULT NULL,
  `check_in` varchar(5) DEFAULT NULL,
  `check_out` varchar(5) DEFAULT NULL,
  `worked_hours` decimal(6,2) NOT NULL DEFAULT 0.00,
  `overtime_hours` decimal(6,2) NOT NULL DEFAULT 0.00,
  `leave_request_id` varchar(64) DEFAULT NULL,
  `source` varchar(16) NOT NULL DEFAULT 'manual',
  `status` varchar(32) NOT NULL DEFAULT 'recorded',
  `locked` tinyint(1) NOT NULL DEFAULT 0,
  `note` text,
  `created_by` varchar(64) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `hr_attendance_records_uidx_day` (`user_id`,`work_date`,`shift_id`),
  KEY `idx_hr_attendance_records_date` (`work_date`),
  CONSTRAINT `fk_hr_attendance_records_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_hr_attendance_records_shift` FOREIGN KEY (`shift_id`) REFERENCES `hr_shift_definitions` (`id`),
  CONSTRAINT `fk_hr_attendance_records_leave` FOREIGN KEY (`leave_request_id`) REFERENCES `hr_leave_requests` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- (10) KỲ CHỐT CÔNG — khoá sổ bảng công theo kỳ (điều kiện để tính lương sau này)
CREATE TABLE IF NOT EXISTS `hr_attendance_periods` (
  `id` varchar(64) NOT NULL,
  `period_key` varchar(16) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `locked` tinyint(1) NOT NULL DEFAULT 0,
  `locked_at` datetime(3) DEFAULT NULL,
  `locked_by` varchar(64) DEFAULT NULL,
  `note` text,
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `hr_attendance_periods_uidx_key` (`period_key`),
  CONSTRAINT `fk_hr_attendance_periods_locker` FOREIGN KEY (`locked_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**2 bảng mới, tiền tố `hr_`, 0 trùng bảng đang có** (đối chiếu tự động với ảnh chụp 123 bảng —
`scripts/phase10-architecture-gate.mjs` mục [3]). Tổng cả F-04 + F-05 = **10 bảng `hr_*`**.

### 2.1. Luật lịch (dùng DỮ LIỆU của F-04, không thêm bảng)

| Việc cần tính | Nguồn dữ liệu | Công thức đề xuất (CHƯA cài đặt) |
|---|---|---|
| **Ngày làm việc** của một ngày bất kỳ | `hr_work_calendars.week_pattern` + `hr_calendar_days.day_type` | ngày đặc biệt THẮNG tuần chuẩn; `working`/`1` ⇒ làm việc; `holiday`/`0` ⇒ nghỉ |
| **Ngày lễ** | `hr_calendar_days` (`day_type='holiday'`, `work_units=0`) | 1 dòng/1 ngày ⇒ tra cứu O(1) theo `(calendar_id, day_date)` |
| **Nghỉ phép** | `hr_leave_requests` (+ `hr_leave_types`) | `total_days` = số NGÀY LÀM VIỆC trong `[start_date, end_date]` — **trừ ngày lễ** (cần người dùng chốt, §4 câu 1) |
| **Tăng ca** | `hr_overtime_requests` + `hr_attendance_records.overtime_hours` | giờ tăng ca = giờ ghi nhận ngoài ca, đối chiếu đơn đã duyệt |
| **Chấm công** | `hr_attendance_records` | 1 dòng/(người·ngày·ca); `source` ∈ `manual`·`import`·`device`; `locked=1` ⇒ không sửa |
| **Số dư phép** | `hr_leave_balances` | `còn lại = entitled_days + carried_days − used_days` |
| **Công thực tế trong kỳ** | `hr_attendance_periods` + `hr_attendance_records` | `SUM(worked_hours)` và `COUNT` ngày công; kỳ `locked=1` ⇒ chốt số |

---

## 3. MẶT API MỚI (NEW) — **CHƯA CÀI ĐẶT**

Mọi tên dưới đây đã đo **0/0/0** (JS · Java · ma trận quyền) — xem §1. Mỗi action khi thi công phải có
**2 đường ghi** + **2 dòng `ActionRbacRegistry`** (module + capability), đúng khuôn 23 action tài chính
và 7 action HR đã có.

| Action | Khoá module | Capability | Ghi chú thi công |
|---|---|---|---|
| `save_attendance_record` | `dept_legal_hr` | `canCreate` | Ghi bảng công; chặn khi kỳ `locked=1` |
| `import_attendance` | `dept_legal_hr` | `canCreate` | Nhập file bảng công; giới hạn số dòng như `import_contract_payments` (≤ 5.000) |
| `lock_attendance_period` | `dept_legal_hr` | `canApprove` | Chốt kỳ công — hành động quyền cao |
| `compute_leave_balance` | `dept_legal_hr` | `canUse` | Tính lại `used_days` từ đơn ĐÃ DUYỆT (idempotent) |
| `set_leave_request_status` | `dept_legal_hr` | `canEdit` | Huỷ / rút đơn (duyệt thì đi qua `decide_approval` có sẵn) |

**Đường duyệt KHÔNG thêm action:** dùng `decide_approval` (`scripts/system-route.mjs:16`, module `approvals`)
+ 2 `module_key` mới (`hr_leave`, `hr_overtime`) trong `workflow_definitions` — engine WF-06 lo phần còn lại.

---

## 4. CÂU HỎI NGHIỆP VỤ PHẢI CHỐT (không tự suy đoán)

| # | Câu hỏi | Vì sao chặn | Trạng thái |
|---|---|---|---|
| 1 | Nghỉ phép trừ theo **ngày làm việc** (bỏ ngày lễ, bỏ Chủ nhật) hay **ngày dương lịch**? | Quyết định công thức `total_days` | **BLOCKED** |
| 2 | **Nghỉ nửa ngày** có không (0,5 công)? | Quyết định `decimal(6,2)` và luật nhập | **BLOCKED** |
| 3 | **Chấm công nguồn nào**: nhập tay · nhập file Excel · máy chấm công? | Quyết định `source` + có cần cổng thiết bị hay không | **BLOCKED** |
| 4 | **Tăng ca** hệ số bao nhiêu (ngày thường / đêm / ngày lễ)? | Nếu có hệ số ⇒ cần bảng/cột riêng (chưa thiết kế) | **BLOCKED** |
| 5 | **Kỳ công** theo tháng dương lịch hay kỳ lương riêng (26→25)? | Quyết định `hr_attendance_periods.period_key` | **BLOCKED** |
| 6 | **Ngày lễ** theo Bộ luật Lao động VN, có cập nhật hằng năm không? | Quyết định có cần bảng lễ toàn quốc dùng chung hay chỉ dữ liệu theo lịch | **UNKNOWN** |
| 7 | Bảng công có phải **nguồn tính lương** không? | Nếu có ⇒ phải nối `labor_contracts.salary` (F-03 `finance_payroll` — hiện **chưa có nguồn**) | **BLOCKED** |

---

## 5. KẾT LUẬN

| # | Kết luận | Mức | Bằng chứng |
|---|---|---|---|
| 1 | Lớp lịch/chấm công **chưa tồn tại**: 0 bảng · 0 cột · 0 mã ở 4 lớp nguồn | **CONFIRMED** | §1 (SQL + quét mã) |
| 2 | Lớp lịch công việc đang có (`work_items`, `projects`, `task_sla_policies`) **không thay thế** lịch làm việc nhân sự | **CONFIRMED** | §1 |
| 3 | Lược đồ F-05 = **2 bảng** (`hr_attendance_records` · `hr_attendance_periods`), nối F-04, additive thuần | **CONFIRMED** | §2 + cổng đo [3] |
| 4 | **5 action NEW** (tổng 12 cùng F-04) chưa tồn tại ở cả 3 nơi | **CONFIRMED** | §3 + cổng đo [5] |
| 5 | Duyệt phiếu **không cần mã mới** — engine WF-06 nhận bằng `module_key` | **CONFIRMED** | §3 |
| 6 | Luật trừ phép theo ngày làm việc · hệ số tăng ca · kỳ công | **UNKNOWN** — chờ người dùng chốt (§4) | §4 |
| 7 | Hiệu năng/tra cứu bảng công quy mô lớn (nhân sự × 365 ngày) | **UNKNOWN** — chưa có nguồn (chưa có dữ liệu) | — |

---

## 6. ĐỊNH NGHĨA HOÀN THÀNH CỦA `F-05`

- [x] Bao **đủ 5 vế nguyên văn**: ngày làm việc · nghỉ phép · ngày lễ · tăng ca · chấm công (§2.1 + §3).
- [x] `TBL` giả định: **2 bảng mới** (không trùng bảng đang có) — additive thuần (§2).
- [x] `API NEW`: **5 action mới**, kiểm chưa tồn tại ở 3 nơi (§3).
- [x] Nối đúng phụ thuộc **`F-04`**: không khai lại bảng của F-04, chỉ dùng (§2.1).
- [x] Mọi kết luận gắn **CONFIRMED/LIKELY/UNKNOWN**; phần chưa có nguồn ghi **«chưa có nguồn»** (§5).
- [x] **Không triển khai nghiệp vụ** + **DDL/API CHƯA ÁP DỤNG**; **0 xoá dữ liệu**.
- [x] **Cổng máy**: `tests/f04-f05-hanh-chinh-lich-kien-truc.test.mjs` + `node scripts/phase10-architecture-gate.mjs`.
