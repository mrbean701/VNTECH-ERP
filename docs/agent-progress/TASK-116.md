# TASK-116 — PHASE 10: `F-03` · `F-04` · `F-05` (audit tài chính + kiến trúc hành chính/lịch)

- **Mốc xuất phát:** `729be05` (HEAD, nhánh `unity`) · **ngày:** 22/09/2026 · MySQL 8.0 schema `vntech_erp` (chỉ ĐỌC).
- **Phạm vi được giao:** **CHỈ `F-03`, `F-04`, `F-05`** của PHASE 10.
  ⛔ **`F-01` + `F-02` KHÔNG làm** (cả hai thuộc **phạm vi nghiệp vụ MEP** — người dùng CHƯA cung cấp spec;
  `F-01` đang `BLOCKED` trong roadmap) ⇒ **không suy đoán phạm vi MEP**.
- **Commit:** `241a634` (F-03) · `0d2d641` (F-04) · `a980876` (F-05) · commit tài liệu tiến độ (dưới cùng, xem `git log`).

---

## 1. NGUYÊN VĂN 5 MỤC PHASE 10 (chép từ `docs/25_TODO_ROADMAP.md`)

| ID | Module | Việc (nguyên văn) | Ưu tiên | Phụ thuộc | DB | API | UI | QUYỀN | TT (trước) |
|---|---|---|---|---|---|---|---|---|---|
| `F-01` | MEP | **Làm rõ nghiệp vụ MEP với người dùng** (8 module chưa rõ phạm vi) | P5 | cần spec | - | - | - | - | **BLOCKED** |
| `F-02` | MEP | Roadmap MEP: thiết bị · bản vẽ · BOQ · lắp đặt · nghiệm thu · bàn giao | P5 | F-01 | TBL | - | - | - | TODO |
| `F-03` | Tài chính | Audit phụ thuộc, chuẩn bị kiến trúc — **không triển khai nghiệp vụ** | P5 | F-01 | - | - | - | - | TODO |
| `F-04` | Hành chính | Kiến trúc: chấm công · lịch làm việc · nghỉ phép | P5 | WF-06 | TBL | - | - | - | TODO |
| `F-05` | Hành chính | Lịch: ngày làm việc · nghỉ phép · ngày lễ · tăng ca · chấm công | P5 | F-04 | TBL | - | NEW | - | TODO |

**Tiêu đề PHASE 10 (nguyên văn):** «# PHASE 10 — MODULE TƯƠNG LAI (**CHỈ AUDIT + CHUẨN BỊ KIẾN TRÚC**)»
⇒ cả 3 mục **KHÔNG phải triển khai nghiệp vụ**: sản phẩm = **hồ sơ audit/kiến trúc** + **cổng máy kiểm chứng**.

⛔ **`F-01`/`F-02` KHÔNG NẰM TRONG LƯỢT NÀY**: `F-01` vẫn **BLOCKED** (chờ spec MEP của người dùng).
Đo được phạm vi MEP ĐANG CÓ trong mã/dữ liệu (không suy đoán gì thêm): **8 khoá MEP**
(`dept_project_pda` · `dept_project_plan` · `dept_project_shop` · `dept_project_boq` · `dept_project_material` ·
`dept_project_issues` · `dept_project_asbuilt` · `dept_project_tender`) ở `lib/menu-helpers.ts:48-57` +
nhóm `mep` trong `module_catalog` (**8 dòng**, `active=1`) — **KHÔNG** đụng tới chúng trong lượt này.

---

## 2. BẢN CHẤT TỪNG MỤC & SẢN PHẨM

| Mục | Bản chất (theo nguyên văn) | Sản phẩm lượt này |
|---|---|---|
| `F-03` | **AUDIT** («Audit phụ thuộc, chuẩn bị kiến trúc — không triển khai nghiệp vụ») | **Báo cáo** `docs/agent-progress/F-03-TAI-CHINH-AUDIT-PHU-THUOC.md` |
| `F-04` | **CHUẨN BỊ KIẾN TRÚC** (`TBL`) | **Thiết kế** `docs/agent-progress/F-04-HANH-CHINH-KIEN-TRUC.md` (lược đồ mục tiêu 8 bảng + 7 action NEW) |
| `F-05` | **CHUẨN BỊ KIẾN TRÚC** cho **lớp LỊCH + CHẤM CÔNG** (`TBL` + `API NEW`) | **Thiết kế** `docs/agent-progress/F-05-LICH-KIEN-TRUC.md` (2 bảng + 5 action NEW + luật lịch) |

**Đã KHÔNG nâng phạm vi:** `0` dòng `app/**` · `lib/**` · `scripts/system-route.mjs` · `drizzle/**` bị sửa;
**0** migration; **0** DDL/API áp dụng; **0** ghi/xoá trên CSDL thật (mọi câu lệnh MySQL đều là `SELECT`/`information_schema`).

---

## 3. BẰNG CHỨNG CHÍNH (tệp:dòng · SQL · số đo)

### 3.1 `F-03` — 14 bảng · 23 action · 8 khoá module
- **23/23 action tài chính có ĐỦ 2 đường ghi** (JS + Java), mỗi action có dòng ma trận quyền:
  ví dụ `save_payment_plan` (`scripts/system-route.mjs:2136` ↔ `SystemController.java:660` ↔
  `ActionRbacRegistry.java:157`) · `save_capital_recovery` (`:1354` ↔ `:595` ↔ `:136`) ·
  `save_contract_payment` (`:1368` ↔ `:605` ↔ `:139`). Bảng đầy đủ 23 dòng ở hồ sơ §1.
- **Số dòng THẬT** (`SELECT COUNT(*)`): `payment_plans` **3** · `contract_payments` **2** ·
  `capital_recovery_records` **1** · `advance_requests` **0** · `site_expense_claims` **0** ·
  `bank_accounts` **1** · `cashbook_entries` **2** · `accounting_vouchers` **0** · `project_contracts` **4** ·
  `production_reports` **2** · `team_payments` **0** · `team_settlements` **0** · `team_subcontracts` **0** ·
  `team_production_records` **0**.
- 🔴 **TỰ BẮT LỖI ĐO (bài học):** lần đo đầu dùng `information_schema.tables.table_rows` cho **số SAI**
  (InnoDB ước lượng): `payment_plans` 4→**3** · `capital_recovery_records` 0→**1** · `approvals` 100→**124** ·
  `approval_stage_catalog` 5→**8** · `team_subcontracts` 1→**0** ⇒ **mọi số đã đổi sang `COUNT(*)`**.
- **Thiếu (ABSENCE — có SQL):** 0 bảng sổ cái · 0 bảng kỳ kế toán · 0 bảng hóa đơn/thuế · 0 bảng ngân sách ·
  0 cột ngoại tệ. **LIKELY (rủi ro):** `payment_plans.contract_id`/`po_id` và
  `capital_recovery_records.production_report_id` **không có index** (`information_schema.statistics`);
  **0 FOREIGN KEY** trên 4 bảng lõi (khớp `W-02`).
- **Kết luận:** CONFIRMED 6/7; LIKELY 1 (phụ thuộc khai báo `F-01` **không chặn phần audit** — 14 bảng/23 action
  tài chính không dùng bảng MEP nào).

### 3.2 `F-04`/`F-05` — 0 bảng · 0 mã · 10 bảng đề xuất · 12 action đề xuất
- **Chưa có gì:** `SELECT COUNT(*) FROM information_schema.tables WHERE … LIKE '%leave%' OR '%holiday%' OR
  '%attendance%' OR '%overtime%' OR '%shift%' OR '%calendar%' OR '%timesheet%' OR '%payroll%'` ⇒ **0** (trên **123** bảng).
  Cột mang nghĩa lịch/ca trong **1574** cột: **đúng 1** — `construction_daily_logs.shift` (ca **thi công**, KHÁC nghiệp vụ).
  Chuỗi `attendance`/`leave_request`/`overtime_request` ở 4 lớp (`scripts/**` · `java-backend/**` · `drizzle/*.sql` · `app/**`) = **0/0/0/0**.
- **Neo ĐANG CÓ:** `users` **13** dòng · 18 cột (có `employee_code`, `organization_unit_id`) · `hr_records` **4** dòng ·
  `labor_contracts` **2** · `benefit_records` **1** · `organization_units` **8**; 3 khoá `dept_legal_*` (nhóm `hr_legal`)
  + 7 action HR đủ 2 đường ghi (`save_hr_record` `:2196` ↔ `:725`, …).
- **Tái dùng engine WF-06 (CONFIRMED):** `workflow_definitions` **4** dòng (`requests` · `purchasing` ·
  `warehouse_issue` · `warehouse_receipt`) — **0 cho HR**; cột `workflow_definitions.module_key` CÓ THẬT;
  `workflow_steps` **11** dòng · `workflow_step_approvers` **5** · `approval_stage_catalog` **8** dòng/13 cột
  (`approval_mode` default `single`) · `approvals` **124** ⇒ thêm loại phiếu = **thêm DỮ LIỆU, không sửa mã**.
- **10 bảng đề xuất (CHƯA ÁP DỤNG, 100% `hr_*`, 0 trùng 123 bảng đang có):**
  F-04: `hr_shift_definitions` · `hr_employee_shifts` · `hr_work_calendars` · `hr_calendar_days` ·
  `hr_leave_types` · `hr_leave_balances` · `hr_leave_requests` · `hr_overtime_requests`;
  F-05: `hr_attendance_records` · `hr_attendance_periods`.
- **12 action ĐỀ XUẤT — đã đo 0/0/0** (JS · Java · ma trận quyền) cho **từng tên**:
  F-04: `save_shift_definition` · `assign_employee_shift` · `save_work_calendar` · `save_calendar_day` ·
  `save_leave_type` · `save_leave_request` · `save_overtime_request`;
  F-05: `save_attendance_record` · `import_attendance` · `lock_attendance_period` ·
  `compute_leave_balance` · `set_leave_request_status`.

---

## 4. CỔNG ĐÃ CHẠY (số THẬT, đo trên cây làm việc cuối)

| # | Cổng | Kết quả |
|---|---|---|
| 1 | `npx tsc --noEmit` | **exit 0** (không lỗi) |
| 2 | `npm run lint` | **0 error** · **186 warning** = **đúng nền cũ** (đã gỡ 1 warning mới do chính lượt này sinh ra: `readdirSync` không dùng ở cổng mới) |
| 3 | `npm run test:regression` | **69/69 PASS · 0 fail** (exit 0) |
| 4 | `npm run test:workflow` | **ĐẠT** — «Workflow VNTECH ERP V5.3.0 FULL W2 passed» (exit 0) |
| 5 | **Test mới** `node --test tests/f03-tai-chinh-audit-deps.test.mjs tests/f04-f05-hanh-chinh-lich-kien-truc.test.mjs` | **ĐỎ 5/16 → XANH 16/16 · 0 fail** (đỏ trước khi có hồ sơ + cổng; xanh sau) |
| 6 | `node --import tsx tests/t01-work-menu-probe.mjs` | **7 ĐẠT · 0 HỎNG** (exit 0) |
| 7 | `node tools/probe-project-screen.mjs` | **KẾT LUẬN: ĐẠT** (exit 0) |
| 8 | `node tools/p2-trace-audit.mjs` | **ĐẠT** — 5/5 chặng truy vết đầy đủ (0 mồ côi) |
| 9 | `node tools/p2-split-po-audit.mjs` | **ĐẠT** — không dòng nào vượt số lượng, không lệch rollup |
| 10 | `node tools/p2-reference-integrity.mjs` | **ĐẠT** — 15/15 cặp quan hệ 0 dòng mồ côi |
| 11 | **Cổng mới** `node scripts/phase10-architecture-gate.mjs` | **ĐẠT — 0 cổng hỏng · 0 DRIFT số dòng** (đọc-only; 123 bảng khớp ảnh chụp, 26 số dòng khớp `COUNT(*)`, 10 bảng đề xuất 0 va chạm, 12 action đề xuất 0/0/0, 23 action F-03 đúng dòng 2 đường ghi) |
| 12 | `node --test tests/p2-25-roadmap-status-cell.test.mjs` | **8/8 PASS** — hợp đồng ô TT 12 ô vẫn nguyên |

⚠️ **Tệp untracked `tests/p2-25-pr-po-grn-cases.test.mjs`** (của lượt khác, phải giữ untracked) khi chạy riêng
**HỎNG sẵn** với `ERR_MODULE_NOT_FOUND: app/api/system/route` — **không phải hồi quy của lượt này**
(tệp không đọc roadmap/F-03/F-04/F-05; đã kiểm `git status` = `??`). Không sửa, không commit.

### 4.1. CHẠY LẠI TOÀN BỘ CỔNG SAU THAY ĐỔI CUỐI (HEAD `bff5972`, cây đã commit — không còn thay đổi chưa commit)

| Cổng | Kết quả CHẠY LẠI |
|---|---|
| `npx tsc --noEmit` | **TSC_EXIT=0** |
| `npm run lint` | **186 problems (0 errors, 186 warnings)** · `LINT_EXIT=0` — đúng nền cũ |
| `node --test tests/f03-… + tests/f04-f05-… + tests/p2-25-roadmap-status-cell` | **24 tests · 24 pass · 0 fail** |
| `npm run test:regression` | **69 tests · 69 pass · 0 fail** · `REG_EXIT=0` |
| `npm run test:workflow` | **«Workflow VNTECH ERP V5.3.0 FULL W2 passed»** · `WF_EXIT=0` |
| `node --import tsx tests/t01-work-menu-probe.mjs` | **7 ĐẠT · 0 HỎNG** · `T01_EXIT=0` |
| `node tools/probe-project-screen.mjs` | **KẾT LUẬN: ĐẠT** · `PRJ_EXIT=0` |
| `node tools/p2-trace-audit.mjs` | **EXIT=0** (5/5 chặng, 0 mồ côi) |
| `node tools/p2-split-po-audit.mjs` | **EXIT=0** (không vượt số lượng, rollup khớp) |
| `node tools/p2-reference-integrity.mjs` | **EXIT=0** (15/15 cặp, 0 mồ côi) |
| `node scripts/phase10-architecture-gate.mjs` | **ĐẠT — 0 cổng hỏng · 0 cảnh báo DRIFT số dòng** · `GATE_EXIT=0` |

⇒ **Không có lần chạy nào sau thay đổi mà thiếu kết quả**: lần chạy lại này diễn ra trên **đúng cây đã commit cuối** (`bff5972`), sau khi đã gỡ 1 warning lint do cổng mới sinh ra.

### `tools/probe-roadmap-progress.mjs` — TRƯỚC / SAU

```text
TRƯỚC (729be05)                              SAU (sau khi cập nhật cột TT)
DONE        98 / 110  (89.1%)                DONE       101 / 110  (91.8%)
BLOCKED      2 / 110  (1.8%)                 BLOCKED      2 / 110  (1.8%)
TODO        10 / 110  (9.1%)                 TODO         7 / 110  (6.4%)
PHASE 10 — TƯƠNG LAI    0/5  (chặn 1)         PHASE 10 — TƯƠNG LAI    3/5  (chặn 1)
```

Ô **TT** của 3 mục ghi **CHÍNH XÁC `**DONE**`** (đúng 12 ô/dòng — cổng `p2-25-roadmap-status-cell` 8/8 PASS);
lý do/giải thích đặt ở **cột «Việc»**, KHÔNG nhét vào ô TT.

---

## 5. TỆP ĐÃ ĐỔI / TẠO

| Tệp | Loại | Commit |
|---|---|---|
| `docs/agent-progress/F-03-TAI-CHINH-AUDIT-PHU-THUOC.md` | MỚI — hồ sơ audit tài chính | `241a634` |
| `tests/f03-tai-chinh-audit-deps.test.mjs` | MỚI — hợp đồng máy cho F-03 | `241a634` |
| `scripts/phase10-architecture-gate.mjs` | MỚI — cổng đo PHASE 10 (đọc-only MySQL) | `241a634` |
| `docs/agent-progress/F-04-HANH-CHINH-KIEN-TRUC.md` | MỚI — kiến trúc hành chính | `0d2d641` |
| `docs/agent-progress/F-05-LICH-KIEN-TRUC.md` | MỚI — kiến trúc lịch/chấm công | `a980876` |
| `tests/f04-f05-hanh-chinh-lich-kien-truc.test.mjs` | MỚI — hợp đồng máy cho F-04/F-05 | `a980876` |
| `docs/25_TODO_ROADMAP.md` | SỬA — ô TT 3 mục (`TODO`→`**DONE**`) + lý do ở cột Việc | commit tài liệu |
| `docs/agent-progress/MASTER_STATUS.md` | SỬA — **chỉ ô số**: DONE 98→**101** · TODO 10→**7** · PHASE 10 0/5→**3/5** (giữ 101+2+7 = 110) | commit tài liệu |
| `docs/agent-progress/TASK-116.md` | MỚI — nhật ký này | commit tài liệu |

**KHÔNG đụng:** `AGENTS.md` · `docs/28_*` · mọi `.docx`/`.xlsx` · `tools/baseline/**` ·
`docs/agent-progress/TASK-094…115.md` · `app/**` · `lib/**` · `scripts/system-route.mjs` · `drizzle/**` ·
`java-backend/**`. **KHÔNG** build · **KHÔNG** start/stop dịch vụ · **KHÔNG** `git add -A` · **KHÔNG** push ·
2 tệp `tests/p2-25-*.test.mjs` **vẫn untracked**.

---

## 6. TRẠNG THÁI ĐỀ XUẤT

| Mục | Cổng xanh? | Trạng thái đề xuất | Ghi chú |
|---|---|---|---|
| `F-03` | ✅ (đủ 12 cổng, riêng cổng 3 mục phụ thuộc phần còn lại của PHASE 10) | **`**DONE**`** | Audit + chuẩn bị kiến trúc xong; **6 câu nghiệp vụ tài chính chờ người dùng chốt** (hồ sơ §6) — KHÔNG chặn việc đóng mục audit |
| `F-04` | ✅ | **`**DONE**`** | Kiến trúc xong (8 bảng + 7 action NEW, DDL CHƯA ÁP DỤNG); **8 câu nghiệp vụ chờ chốt** (hồ sơ §6) |
| `F-05` | ✅ | **`**DONE**`** | Kiến trúc lịch/chấm công xong (2 bảng + 5 action NEW); **7 câu nghiệp vụ chờ chốt** (hồ sơ §4) |
| `F-01` | — | **giữ `**BLOCKED**`** | Chờ spec nghiệp vụ MEP — **KHÔNG** làm trong lượt này |
| `F-02` | — | **giữ `TODO`** | Phụ thuộc `F-01` — **KHÔNG** làm trong lượt này |

⛔ **Chưa mục nào được đóng ở mức "triển khai nghiệp vụ"**: cả 3 mục là **AUDIT/KIẾN TRÚC**, đúng nguyên văn PHASE 10.
Việc thi công thật (bảng + action + màn + migration) **chờ người dùng chốt nghiệp vụ** — danh mục câu hỏi ở từng hồ sơ.

---

## 7. BLOCKED / UNKNOWN & CÂU HỎI CHO NGƯỜI DÙNG

| # | Câu hỏi | Mục | Trạng thái |
|---|---|---|---|
| 1 | Áp **chuẩn mực kế toán** nào (TT200/VAS? sổ cái bút toán kép?) | F-03 | **BLOCKED** |
| 2 | **Kỳ kế toán** tháng/quý/năm + có khoá sổ? | F-03 | **BLOCKED** |
| 3 | **Hoá đơn/thuế**: 1 hồ sơ thu hồi vốn được nhiều hoá đơn? tách GTGT? | F-03 | **BLOCKED** |
| 4 | **Ngân sách/dự toán chi phí** có trong phạm vi ERP? | F-03 | **BLOCKED** |
| 5 | **KP #83**: tiền THỰC thu **1,5 tỷ** > hợp đồng **673.250.000** — xử lý thế nào? (đã ghi ở `TASK-084`) | F-03 | **BLOCKED** |
| 6 | Có cần **ngoại tệ/tỷ giá**? | F-03 | **BLOCKED** |
| 7 | **Mấy ca**/ngày? Ca gãy tính công thế nào? | F-04 | **BLOCKED** |
| 8 | **Tuần làm việc chuẩn** (thứ 7 có làm?) | F-04 | **BLOCKED** |
| 9 | **Ai duyệt, mấy cấp, thứ tự** + **SLA** cho đơn nghỉ phép & tăng ca? | F-04 | **BLOCKED** |
| 10 | **Cách trừ phép** (ngày làm việc vs dương lịch · nửa ngày · chuyển năm sau) + **hạn mức phép năm** | F-04 | **BLOCKED** |
| 11 | Chấm công **nguồn nào** (tay · file · thiết bị)? | F-05 | **BLOCKED** |
| 12 | **Hệ số tăng ca** (thường/đêm/ngày lễ)? | F-05 | **BLOCKED** |
| 13 | **Kỳ công** = tháng dương lịch hay kỳ lương 26→25? Bảng công có phải **nguồn tính lương**? | F-05 | **BLOCKED** |
| 14 | **Ngày lễ** cập nhật hằng năm theo Bộ luật Lao động VN? | F-05 | **UNKNOWN** |
