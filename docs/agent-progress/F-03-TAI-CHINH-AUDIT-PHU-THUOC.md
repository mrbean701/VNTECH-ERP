# F-03 — TÀI CHÍNH: AUDIT PHỤ THUỘC + CHUẨN BỊ KIẾN TRÚC

> **Nguyên văn mục lộ trình** (`docs/25_TODO_ROADMAP.md:225`, PHASE 10 — MODULE TƯƠNG LAI):
> «`F-03` | Tài chính | **Audit phụ thuộc, chuẩn bị kiến trúc** — **không triển khai nghiệp vụ** | P5 | F-01 | - | - | - | - | TODO»
>
> **Nguyên văn tiêu đề PHASE 10** (`docs/25_TODO_ROADMAP.md:219`): «# PHASE 10 — MODULE TƯƠNG LAI
> (**CHỈ AUDIT + CHUẨN BỊ KIẾN TRÚC**)».
>
> ⇒ **BẢN CHẤT MỤC NÀY = AUDIT** (báo cáo + kết luận CONFIRMED/LIKELY/UNKNOWN), **KHÔNG phải sửa mã**.
> ⇒ **NGOÀI PHẠM VI (đúng nguyên văn «không triển khai nghiệp vụ»)**: không dựng bảng, không thêm action,
> không dựng màn, không migration, không seed dữ liệu, **0 dòng mã nghiệp vụ tài chính**.

- **HEAD khi đo:** `729be05` · **nhánh:** `unity` · **ngày đo:** 22/09/2026.
- **CSDL đọc (chỉ ĐỌC):** MySQL 8.0 · schema `vntech_erp` · `mysql.exe -uvntech -pvntech vntech_erp`.

---

## 0. PHƯƠNG PHÁP & GIỚI HẠN (nói trước để không thổi phồng)

| Nguồn | Cách lấy | Ghi chú |
|---|---|---|
| Lược đồ + số dòng | `information_schema.tables/.columns/.statistics` + `SELECT COUNT(*)` | chỉ ĐỌC, không ghi |
| Đường ghi JS | `scripts/system-route.mjs` (`action === "<tên>"`) | tệp: **dòng** |
| Đường ghi Java | `java-backend/.../SystemController.java` (`case "<tên>":`) | tệp: **dòng** |
| Ma trận quyền | `java-backend/application/src/main/java/com/vntech/erp/application/rbac/ActionRbacRegistry.java` | tệp: **dòng** |
| Khai báo module | `scripts/system-route.mjs:14` (`MODULE_KEYS`, **61 khoá**) · `lib/menu-helpers.ts` | tệp: **dòng** |
| Giao diện | `app/page.tsx` · `app/screens/*.tsx` | tệp: **dòng** |

> ⚠️ **BÀI HỌC ĐO LƯỜNG (CONFIRMED — đã tự bắt lỗi giữa lượt):** lần đo đầu dùng
> `information_schema.tables.table_rows` và nhận **số SAI** (ví dụ `payment_plans` = 4,
> `capital_recovery_records` = 0, `approvals` = 100, `approval_stage_catalog` = 5, `team_subcontracts` = 1).
> `table_rows` của InnoDB là **ƯỚC LƯỢNG**. Đo lại bằng `COUNT(*)`:
> `payment_plans` = **3** · `capital_recovery_records` = **1** · `approvals` = **124** ·
> `approval_stage_catalog` = **8** · `team_subcontracts` = **0**.
> ⇒ **Mọi số trong hồ sơ này là `COUNT(*)`** (SQL ghi kèm dưới). Số nào KHÔNG có nguồn
> ⇒ ghi **«chưa có nguồn» + lý do**, KHÔNG bịa.

---

## 1. TỔNG QUAN HỆ TÀI CHÍNH ĐANG CÓ (đo được)

**Quy mô schema:** `123` bảng · `1574` cột
(`SELECT COUNT(*) FROM information_schema.tables/columns WHERE table_schema='vntech_erp';`) — con số `121 bảng`
trong `docs/24`/`MASTER_STATUS` là **mốc cũ**, nay đã `123` (thêm `audit_logs.result` không đổi bảng;
2 bảng tăng thêm là `work_item_comments`/`work_item_participants` — TASK-103). **CONFIRMED.**

**23 hành động GHI có thật ở CẢ HAI đường** (JS + Java) — mỗi dòng đã đối chiếu trực tiếp mã nguồn:

| # | Action | JS (`scripts/system-route.mjs`) | Java (`SystemController.java`) | Module (`ActionRbacRegistry.java`) |
|---|---|---|---|---|
| 1 | `save_capital_recovery` | :1354 | :595 | :136 |
| 2 | `delete_capital_recovery` | :1365 | :600 | :57 |
| 3 | `save_contract_payment` | :1368 | :605 | :139 |
| 4 | `import_contract_payments` | :1375 | :610 | :86 |
| 5 | `delete_contract_payment` | :1378 | :655 | :60 |
| 6 | `save_production_report` | :1331 | :585 | (nhóm `production`) |
| 7 | `approve_production_report` | :1338 | :590 | (nhóm `production`) |
| 8 | `save_team_payment` | :1390 | :630 | :164 (`teams`) |
| 9 | `settle_team_subcontract` | :1393 | :650 | :196 (`teams`) |
| 10 | `save_payment_plan` | :2136 | :660 | :157 |
| 11 | `set_payment_plan_status` | :2142 | :665 | :187 |
| 12 | `delete_payment_plan` | :2145 | :670 | :70 |
| 13 | `save_advance_request` | :2148 | :675 | :115 |
| 14 | `settle_advance_request` | :2154 | :680 | :195 |
| 15 | `delete_advance_request` | :2157 | :685 | :51 |
| 16 | `save_site_expense_claim` | :2160 | :690 | :162 |
| 17 | `approve_site_expense_claim` | :2166 | :695 | :19 |
| 18 | `delete_site_expense_claim` | :2169 | :805 | :78 |
| 19 | `save_bank_account` | :2172 | :700 | :130 |
| 20 | `save_cashbook_entry` | :2178 | :705 | :137 |
| 21 | `delete_cashbook_entry` | :2184 | :710 | :58 |
| 22 | `save_accounting_voucher` | :2187 | :715 | :114 |
| 23 | `delete_accounting_voucher` | :2193 | :720 | :50 |

**Kết luận: CONFIRMED** — 23/23 action có **đủ 2 đường ghi** (parity JS ↔ Java), đúng kiến trúc dự án
(Java phục vụ action GHI; action ĐỌC do SSR/RSC).

### 1.1. Bảng dữ liệu tài chính + số dòng THẬT

```sql
SELECT 'payment_plans',COUNT(*) FROM payment_plans UNION ALL
SELECT 'contract_payments',COUNT(*) FROM contract_payments UNION ALL
SELECT 'capital_recovery_records',COUNT(*) FROM capital_recovery_records UNION ALL
SELECT 'advance_requests',COUNT(*) FROM advance_requests UNION ALL
SELECT 'site_expense_claims',COUNT(*) FROM site_expense_claims UNION ALL
SELECT 'bank_accounts',COUNT(*) FROM bank_accounts UNION ALL
SELECT 'cashbook_entries',COUNT(*) FROM cashbook_entries UNION ALL
SELECT 'accounting_vouchers',COUNT(*) FROM accounting_vouchers UNION ALL
SELECT 'project_contracts',COUNT(*) FROM project_contracts UNION ALL
SELECT 'production_reports',COUNT(*) FROM production_reports UNION ALL
SELECT 'team_payments',COUNT(*) FROM team_payments UNION ALL
SELECT 'team_settlements',COUNT(*) FROM team_settlements UNION ALL
SELECT 'team_subcontracts',COUNT(*) FROM team_subcontracts UNION ALL
SELECT 'team_production_records',COUNT(*) FROM team_production_records;
```

| Bảng | `COUNT(*)` | Vai trò trong chuỗi tài chính | Trạng thái bằng chứng |
|---|---:|---|---|
| `payment_plans` | **3** | Kế hoạch thanh toán theo mốc (hợp đồng/PO) | CONFIRMED |
| `contract_payments` | **2** | Tiền thực thu / thanh toán hợp đồng | CONFIRMED |
| `capital_recovery_records` | **1** | Hồ sơ thu hồi vốn theo kỳ | CONFIRMED |
| `advance_requests` | **0** | Tạm ứng / hoàn ứng | CONFIRMED (bảng CÓ, dữ liệu rỗng) |
| `site_expense_claims` | **0** | Chi phí Ban chỉ huy | CONFIRMED (bảng CÓ, dữ liệu rỗng) |
| `bank_accounts` | **1** | Sổ quỹ & ngân hàng (tài khoản) | CONFIRMED |
| `cashbook_entries` | **2** | Sổ quỹ (bút toán quỹ) | CONFIRMED |
| `accounting_vouchers` | **0** | Chứng từ kế toán | CONFIRMED (bảng CÓ, dữ liệu rỗng) |
| `project_contracts` | **4** | Hợp đồng dự án (nguồn của kế hoạch thanh toán) | CONFIRMED |
| `production_reports` | **2** | Sản lượng đã duyệt (nguồn của thu hồi vốn) | CONFIRMED |
| `team_payments` | **0** | Thanh toán tổ đội (sổ giao khoán độc lập) | CONFIRMED |
| `team_settlements` | **0** | Quyết toán tổ đội | CONFIRMED |
| `team_subcontracts` | **0** | Hợp đồng giao khoán | CONFIRMED — ⚠️ **0 dòng** (ước lượng cũ ghi 1 ⇒ sai) |
| `team_production_records` | **0** | Sản lượng tổ đội đã duyệt | CONFIRMED |

### 1.2. Cột then chốt (nguồn: `information_schema.columns`, ordinal_position)

- **`payment_plans` (14 cột):** `id` · `plan_no` · `project_id` · `contract_id` · `po_id` · `milestone` ·
  `planned_date` · `planned_amount` · `paid_amount` · `status`(default `planned`) · `note` ·
  `created_by` · `created_at` · `updated_at`.
- **`contract_payments` (11 cột):** `id` · `project_id` · `payment_date` · `reference_no` · `description` ·
  `amount` · `note` · `created_by` · `created_at` · `updated_at` · **`recovery_record_id`** (nối về hồ sơ thu hồi vốn).
- **`capital_recovery_records` (14 cột):** `id` · `project_id` · `period_key` · `reference_no` ·
  **`production_report_id`** · `submitted_value` · `approved_value` · `invoice_no` · `invoice_value` ·
  `due_date` · `status`(default `preparing`) · `note` · `created_by` · `created_at` · `updated_at`.
- **`advance_requests` (15 cột):** `id` · `request_no` · `project_id`(NULL được) · `requester_id` · `amount` ·
  `purpose` · `category`(default `purchase`) · `status`(default `draft`) · `advance_paid` · `settlement_value` ·
  `settled_at` · `note` · `created_by` · `created_at` · `updated_at`.

### 1.3. Quan hệ giữa các bảng — đo bằng INDEX (MySQL KHÔNG khai FOREIGN KEY)

`information_schema.statistics` trên 4 bảng lõi:

| Bảng | Index | Cột |
|---|---|---|
| `payment_plans` | `PRIMARY` / `payment_plans_uidx_plan_no` / `idx_payment_plans_project` / `idx_payment_plans_status` | `id` / `plan_no` / `project_id` / `status` |
| `contract_payments` | `PRIMARY` / `contract_payments_project_date_idx` / `contract_payments_recovery_idx` | `id` / `project_id,payment_date` / `recovery_record_id` |
| `capital_recovery_records` | `PRIMARY` / `capital_recovery_project_period_idx` | `id` / `project_id,period_key` |
| `advance_requests` | `PRIMARY` / 2 unique/index | `id` / `request_no` · `project_id` · `requester_id` · `status` |

**CONFIRMED: 0 FOREIGN KEY** trên 4 bảng này (MySQL chỉ có INDEX) — **khớp kết luận `W-02`**
(«FK khai ở drizzle, MySQL chỉ có INDEX»).

**LIKELY (rủi ro toàn vẹn tham chiếu, đo được — KHÔNG phải lỗi đang xảy ra):**
`payment_plans.contract_id` và `payment_plans.po_id` **KHÔNG có index nào** trong
`information_schema.statistics` ⇒ (a) truy vấn «kế hoạch theo hợp đồng/PO» phải quét bảng, và
(b) không có ràng buộc nào chặn `contract_id`/`po_id` trỏ vào bản ghi đã bị xoá.
Cùng loại: `capital_recovery_records.production_report_id` không có index.
**Chưa kết luận là lỗi** vì 3 dòng `payment_plans` hiện tại chưa phát sinh bất thường — cần đo khi có
dữ liệu lớn hơn. **UNKNOWN:** có bao nhiêu dòng `payment_plans` trỏ vào `contract_id`/`po_id` không tồn tại
(**chưa có nguồn** — phải chạy `LEFT JOIN … IS NULL` trên dữ liệu thật; ngoài phạm vi audit này vì
đó là kiểm tra DỮ LIỆU, không phải phụ thuộc KIẾN TRÚC).

---

## 2. PHỤ THUỘC (điều mục này yêu cầu: «audit phụ thuộc»)

### 2.1. Phụ thuộc DỮ LIỆU — tài chính đọc gì của module khác

| Tài chính phụ thuộc vào | Bằng chứng (tệp:dòng) | Loại | Kết luận |
|---|---|---|---|
| `projects` (mọi bảng tài chính đều có `project_id`) | `scripts/system-route.mjs:743,747,750,751,786,787` (JOIN `projects p`) | CỨNG | CONFIRMED |
| `project_contracts` (`payment_plans.contract_id`) | `payment_plans` cột `contract_id` (information_schema) | MỀM (NULL được) | CONFIRMED |
| `purchase_orders` (`payment_plans.po_id`) | `payment_plans` cột `po_id` (information_schema) | MỀM (NULL được) | CONFIRMED |
| `production_reports` (nguồn giá trị thu hồi vốn) | `scripts/system-route.mjs:747` (`LEFT JOIN production_reports pr`) | MỀM | CONFIRMED |
| `team_subcontracts` + `teams` (sổ giao khoán) | `scripts/system-route.mjs:750,751,1390,1393` | CỨNG (JOIN, không LEFT) | CONFIRMED |
| `team_production_records` (trần thanh toán tổ đội) | `scripts/system-route.mjs:1390` (`SUM(approved_value) … status='approved'`) | CỨNG (luật nghiệp vụ) | CONFIRMED |
| `users` (người tạo/người yêu cầu) | `scripts/system-route.mjs:786,787` (`LEFT JOIN users`) | MỀM | CONFIRMED |
| `contract_stock_ledger` / `contract_stock_reconciliations` | 2 bảng CÓ thật, `COUNT(*)` = 23 / 0 | 2 chiều (kho ↔ hợp đồng) | CONFIRMED (bảng tồn tại) |

### 2.2. Phụ thuộc QUYỀN — 8 khoá module, KHÔNG có khoá mới nào

`scripts/system-route.mjs:14` khai **61 khoá** `MODULE_KEYS`; trong đó nhóm tài chính/pháp chế gồm:

| Khoá module | Nhãn (`lib/menu-helpers.ts`) | Dòng | `module_catalog` (dữ liệu thật) |
|---|---|---|---|
| `dept_finance_payment_plan` | Kế hoạch thanh toán | :60 | CÓ · nhóm `finance` · `active=1` · `system_locked=1` |
| `dept_finance_recovery` | Thu hồi vốn / Công nợ | :61 | CÓ · `finance` · `active=1` · `system_locked=1` |
| `dept_finance_advance` | Tạm ứng / Hoàn ứng | :62 | CÓ · `finance` · `active=1` · `system_locked=1` |
| `dept_finance_site_cost` | Chi phí Ban chỉ huy | :63 | CÓ · `finance` · `active=1` · `system_locked=1` |
| `dept_finance_cashbank` | Sổ quỹ & Ngân hàng | :64 | CÓ · `finance` · `active=1` · `system_locked=1` |
| `dept_finance_documents` | Chứng từ kế toán | :65 | CÓ · `finance` · `active=1` · `system_locked=1` |
| `payments` | Thanh toán HĐ | :78 | CÓ · nhóm `BOQ & Hợp đồng` · `active=1` · `system_locked=0` |
| `capital_recovery` | Thu hồi vốn | :76 | CÓ · nhóm `QUẢN LÝ DỰ ÁN` · `active=1` · `system_locked=1` |

SQL (`module_catalog`): `SELECT module_key,label,group_name,active,system_locked FROM module_catalog
WHERE module_key LIKE 'dept_finance%' OR module_key IN ('payments','capital_recovery');`
Ngoài ra 2 khoá dùng chung cho tài chính: `production` (nhóm `QUẢN LÝ DỰ ÁN`) · `construction`.
`group_key` có thật `finance` (7 dòng) + `hr_legal` (6 dòng) — `SELECT group_key,COUNT(*) … GROUP BY group_key`.

**CONFIRMED:** hệ tài chính hiện chạy trên **8 khoá module ĐÃ CÓ** + **capability 4 mức**
(`canView`/`canCreate`/`canEdit`/`canApprove`/`canUse` — xem `ActionRbacRegistry.java:213…353`
và `scripts/system-route.mjs:31,40`).

### 2.3. Phụ thuộc GIAO DIỆN

| Màn / nhãn | Bằng chứng | Kết luận |
|---|---|---|
| Menu tài chính (6 nhãn `Kế hoạch thanh toán` · `Thu hồi vốn / Công nợ` · `Tạm ứng / Hoàn ứng` · `Chi phí Ban chỉ huy` · `Sổ quỹ & Ngân hàng` · `Chứng từ kế toán`) | `app/page.tsx:126,127,128,129,130,131` | CONFIRMED |
| Khối màn tài chính trong trang tổng | `app/page.tsx:191,193,307,1310,1345,1358` | CONFIRMED |
| Màn riêng đã tách | `app/screens/SiteCostScreen.tsx:24` · `app/screens/DocumentsScreen.tsx:24,26` | CONFIRMED |
| Nhãn màn trong `menu-helpers` | `lib/menu-helpers.ts:60-65` | CONFIRMED |

### 2.4. Phụ thuộc ENGINE PHÊ DUYỆT (dùng chung, KHÔNG hard-code)

- `workflow_definitions` = **4 dòng** (`SELECT code,module_key,is_default,active FROM workflow_definitions`):
  `WF-MUAHANG-01|requests` · `WF-PO-01|purchasing` · `WF-XUATKHO-01|warehouse_issue` · `WF-NHAPKHO-01|warehouse_receipt`.
  **⇒ 0 quy trình cho tài chính, 0 cho HR** (CONFIRMED — `module_key` tài chính `payments`/`dept_finance_*` **chưa có dòng nào**).
- `workflow_steps` = **11 dòng** · `workflow_step_approvers` = **5 dòng** · `approval_stage_catalog` = **8 dòng**
  (13 cột, gồm `approval_mode` default `single`, `stage_kind` default `approval`) ·
  `approvals` = **124 dòng**.
- **CONFIRMED:** engine định danh bằng `module_key` (`workflow_definitions.module_key`, 12 cột) —
  thêm quy trình tài chính = **thêm DỮ LIỆU**, không sửa mã (khớp kết luận `WF-06`).

---

## 3. KHOẢNG TRỐNG ĐO ĐƯỢC («ABSENCE» — cái KHÔNG tồn tại cũng là bằng chứng)

```sql
SELECT table_name FROM information_schema.tables WHERE table_schema='vntech_erp'
 AND (table_name LIKE '%budget%' OR table_name LIKE '%ledger%' OR table_name LIKE '%tax%'
   OR table_name LIKE '%invoice%' OR table_name LIKE '%period%' OR table_name LIKE '%expense%'
   OR table_name LIKE '%account%');
-- KẾT QUẢ: accounting_vouchers · bank_accounts · contract_stock_ledger · site_expense_claims
```

| Hạng mục tài chính | Hiện trạng ĐO ĐƯỢC | Kết luận |
|---|---|---|
| **Sổ cái / bút toán kép** | **0 bảng** `journal`/`ledger` (chỉ `contract_stock_ledger` — sổ kho theo hợp đồng, KHÔNG phải sổ kế toán) | CONFIRMED thiếu |
| **Kỳ kế toán / khoá sổ** | **0 bảng** `%period%`; `capital_recovery_records.period_key` là **text tự do**, không có bảng kỳ | CONFIRMED thiếu |
| **Hóa đơn (nhiều hóa đơn / 1 hồ sơ, thuế)** | **0 bảng** `%invoice%`; hóa đơn chỉ là **2 CỘT** `invoice_no` + `invoice_value` trên `capital_recovery_records` | CONFIRMED thiếu |
| **Thuế (GTGT/TNCN)** | **0 bảng** `%tax%`; **0 cột** `%tax%` | CONFIRMED thiếu |
| **Ngân sách / dự toán chi phí** | **0 bảng** `%budget%` | CONFIRMED thiếu |
| **Đối chiếu công nợ phải thu/phải trả** | **0 bảng**; `team_settlements.remaining_value` là **1 cột** trên bản ghi quyết toán | CONFIRMED thiếu |
| **`accounting_vouchers` có dữ liệu hay không** | `COUNT(*)` = **0** ⇒ đường ghi chứng từ kế toán **CHƯA từng chạy thật** | CONFIRMED (0 dòng) |
| **Ngoại tệ / tỷ giá** | **0 cột** `%currency%`/`%rate%` (chưa quét thấy) | LIKELY thiếu — cần quét lại toàn bộ 1574 cột trước khi kết luận cứng |

---

## 4. CHUẨN BỊ KIẾN TRÚC (điểm cắm cho module tài chính tương lai — **THIẾT KẾ, CHƯA THI CÔNG**)

> ⛔ Mục này **KHÔNG** tạo bảng/action/migration nào. Nó ghi **vị trí cắm** để khi người dùng chốt
> nghiệp vụ thì việc triển khai là **đường thẳng**. Mọi DDL ở đây là **ĐỀ XUẤT DẠNG VĂN BẢN**,
> **CHƯA ÁP DỤNG** (lý do: (a) chưa có nghiệp vụ chốt — nguyên văn mục là «không triển khai nghiệp vụ»;
> (b) chuỗi migration phải thêm **ĐỒNG THỜI** `drizzle/NNNN_*.sql` (SQLite) **và**
> `java-backend/.../db/migration/Vnn__*.sql` (MySQL) — nhánh `java-backend/**` **ngoài phạm vi tượng này**,
> thêm lệch một nửa sẽ tạo **drift lược đồ** đã bị chính dự án ghi nhận ở `TASK-104`).

| # | Điểm cắm | Đề xuất (additive) | Vì sao / bằng chứng |
|---|---|---|---|
| 1 | Sổ kế toán | `finance_ledger_entries` (id, period_id, project_id, voucher_id, account_code, debit, credit, currency, occurred_at) | §3: 0 bảng sổ cái |
| 2 | Kỳ kế toán | `finance_periods` (id, code, start_date, end_date, locked) | `period_key` đang là text tự do |
| 3 | Hóa đơn | `finance_invoices` (id, recovery_record_id, invoice_no, invoice_date, value, tax_rate, tax_value) | hóa đơn đang là 2 cột |
| 4 | Ngân sách | `finance_budgets` + `finance_budget_lines` (project_id, cost_code, planned/actual) | 0 bảng ngân sách |
| 5 | Khoá quyền | **KHÔNG** thêm khoá mới cho 6 màn ĐÃ CÓ (`dept_finance_*`); chỉ thêm khoá cho màn MỚI + 1 dòng `module_catalog` (nhóm `finance`) + 1 dòng `MODULE_KEYS` + 1 dòng `modules` ở `lib/menu-helpers.ts` | 4 nơi phải khớp (code+dữ liệu) |
| 6 | Ma trận quyền | 2 dòng mỗi action trong `ActionRbacRegistry.java` (module + capability) | 23 action hiện tại đều có đúng dạng này |
| 7 | Engine duyệt | 1 dòng `workflow_definitions(module_key='finance_<x>')` + N dòng `workflow_steps` | engine đã tổng quát (mục 2.4) |
| 8 | Parity | mỗi action mới phải có **CẢ** `scripts/system-route.mjs` **VÀ** `SystemController.java` | 23/23 action tài chính hiện có đủ 2 đường |
| 9 | Đường ĐỌC | `bootstrap`/SSR trả dữ liệu (không phải Java) | MASTER_STATUS: «Tầng Java chỉ phục vụ action GHI» |

---

## 5. KẾT LUẬN & PHỤ THUỘC KHAI BÁO `F-01`

| # | Kết luận | Mức | Bằng chứng |
|---|---|---|---|
| 1 | Hệ tài chính hiện có **14 bảng + 23 action GHI (đủ 2 đường) + 8 khoá module + 6 màn** | **CONFIRMED** | §1, §2 |
| 2 | Chuỗi nghiệp vụ lõi: **Sản lượng → Hồ sơ thu hồi vốn → Duyệt → Hóa đơn → Tiền thực thu** | **CONFIRMED** | `scripts/system-route.mjs:1354-1379` (thông điệp trả về mô tả đúng chuỗi) |
| 3 | Engine duyệt **đã tổng quát**: thêm quy trình tài chính = thêm DỮ LIỆU | **CONFIRMED** | `workflow_definitions.module_key` + `approval_stage_catalog.approval_mode` (mục 2.4) |
| 4 | **Thiếu 6 hạng mục kiến trúc** (sổ cái · kỳ kế toán · hóa đơn/ thuế · ngân sách · công nợ · ngoại tệ) | **CONFIRMED** (riêng ngoại tệ: **LIKELY**) | §3 |
| 5 | `payment_plans.contract_id`/`po_id` + `capital_recovery_records.production_report_id` **không có index** | **LIKELY** rủi ro toàn vẹn | §1.3 |
| 6 | Số dòng phải đọc bằng `COUNT(*)`; `table_rows` của InnoDB **sai** | **CONFIRMED** | §0 |
| 7 | **Phụ thuộc khai báo `F-01` (spec MEP) KHÔNG chặn phần AUDIT này** | **LIKELY** | xem dưới |

**Về ô «Phụ thuộc = F-01» của `F-03`:** `F-01` là «**Làm rõ nghiệp vụ MEP** với người dùng (8 module chưa rõ
phạm vi)» và đang **BLOCKED**. Đo được: **8 khoá MEP** (`dept_project_pda|plan|shop|boq|material|issues|asbuilt|tender`)
nằm ở `lib/menu-helpers.ts:48,50-55,57` và nhóm `mep` trong `module_catalog` (8 dòng);
**toàn bộ 14 bảng + 23 action tài chính ở §1 KHÔNG dùng bảng MEP nào** ⇒ *phần audit + chuẩn bị kiến trúc của
`F-03` chạy được độc lập*. Giao nhau duy nhất: khoá `dept_project_payment` («Thanh toán / Quyết toán»,
nhóm `finance`, thuộc «Phòng Dự án») — nếu người dùng muốn **phạm vi tài chính riêng cho MEP** thì phần đó
**vẫn chờ `F-01`**. Kết luận: `F-03` **thi hành được ở phần audit**; phần nghiệp vụ MEP-tài chính thì **vẫn BLOCKED** (ngoài mục này).

---

## 6. CÂU HỎI CẦN NGƯỜI DÙNG CHỐT (quyết định NGHIỆP VỤ/TÀI CHÍNH — không tự suy đoán)

| # | Câu hỏi | Vì sao chặn | Trạng thái |
|---|---|---|---|
| 1 | Áp **chuẩn mực kế toán** nào (TT200/VAS? có sổ cái bút toán kép không?)? | Quyết định `finance_ledger_entries` có tồn tại hay không | **BLOCKED** (chờ người dùng) |
| 2 | **Kỳ kế toán** theo tháng/quý/năm và **có khoá sổ** không? | `period_key` hiện là text tự do, không ràng buộc | **BLOCKED** |
| 3 | **Hóa đơn**: 1 hồ sơ thu hồi vốn được nhiều hóa đơn? Có tách **thuế GTGT**? | Hiện chỉ 2 cột `invoice_no`/`invoice_value` ⇒ phải biết trước khi tách bảng | **BLOCKED** |
| 4 | **Ngân sách/dự toán chi phí** có nằm trong phạm vi ERP không? | Nếu không ⇒ không dựng `finance_budgets` | **BLOCKED** |
| 5 | **KP #83**: tiền THỰC thu **1,5 tỷ** > giá trị hợp đồng **673.250.000** — xử lý thế nào? | Đây là **lệch DỮ LIỆU thật** đã ghi ở `MASTER_STATUS` (TASK-084); sửa dữ liệu cần người dùng duyệt | **BLOCKED** (chưa xử lý) |
| 6 | Có cần **ngoại tệ/tỷ giá** không? | Chưa có cột nào ⇒ phải biết trước khi thiết kế | **BLOCKED** |

---

## 7. ĐỊNH NGHĨA HOÀN THÀNH CỦA `F-03` (đối chiếu nguyên văn mục)

- [x] **Audit phụ thuộc**: dữ liệu (2.1) · quyền (2.2) · giao diện (2.3) · engine (2.4) — **có tệp:dòng + SQL**.
- [x] **Chuẩn bị kiến trúc**: 9 điểm cắm, gồm đường migration 2 chuỗi + parity 2 đường ghi (§4).
- [x] **«Không triển khai nghiệp vụ»**: **0** bảng · **0** action · **0** dòng `scripts/**` · **0** `drizzle/**` bị sửa.
- [x] **Không bịa số**: mọi số có SQL; số không có nguồn ghi rõ **«chưa có nguồn»** (§1.3, §3).
- [x] **Mọi kết luận gắn CONFIRMED/LIKELY/UNKNOWN** (§5).
- [x] **Không xoá gì**: hồ sơ chỉ ĐỌC CSDL; 0 `DROP`/`DELETE`/`UPDATE`/`INSERT`/`ALTER`.

**Hồ sơ này là sản phẩm của `F-03`.** Cổng kiểm chứng máy: `tests/f03-tai-chinh-audit-deps.test.mjs`
(đối chiếu **mọi** action/bảng/khoá nêu trong hồ sơ với mã nguồn thật — hồ sơ sai là test ĐỎ).
Số liệu sống: `node scripts/phase10-architecture-gate.mjs` (đọc lại MySQL, đối chiếu ảnh chụp số dòng).
