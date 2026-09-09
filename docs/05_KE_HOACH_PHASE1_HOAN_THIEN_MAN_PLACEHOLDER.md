# KẾ HOẠCH PHÁT TRIỂN PHASE 1 — HOÀN THIỆN 15 MÀN "ĐANG PHÁT TRIỂN"

Bản cập nhật: 09/2026 · Build gốc `5.3.0-MASTER-BASELINE-R1.1.1-FINAL-20260908` · Fingerprint gốc `31cb2728...`
Tài liệu này là **mức thực thi chi tiết** của PHASE 1 trong `docs/04_KE_HOACH_PHAT_TRIEN.md` (giữ hướng chiến lược), bám sát source hiện tại.

---

## 0.0 NHẬT KÝ TRIỂN KHAI THỰC TẾ (cập nhật liên tục)

> 📌 **PHASE 1 & 2 đều ghi ở đây; Phase 2 (2.1–2.3) làm mới fingerprint từ 0062 trở đi, không đổi schema nghiệp vụ (metadata identity-refresh). Từ 0065: PHASE 3 hướng "giữ monolith, làm mượt" — fix bug + tính năng giá trị cao.**

| Vòng | Màn | Migration | Fingerprint mới | Trạng thái |
|---|---|---|---|---|
| A | `site_command` (BCH dự án) | 0050 (identity-refresh) | d45011c9 | ✅ ĐÃ TRIỂN KHAI · gates ĐẠT |
| B | `dept_finance_recovery` (Công nợ tổng hợp) | 0051 (identity-refresh) | c1c0fa07 | ✅ ĐÃ TRIỂN KHAI · gates ĐẠT |
| C | `construction` (Thi công) | 0052 (schema + identity) | 8ed1611e | ✅ ĐÃ TRIỂN KHAI · gates ĐẠT |
| D | `material_norms` (Định mức) | 0053 (schema + identity) | e94d39ff | ✅ ĐÃ TRIỂN KHAI · gates ĐẠT |
| E1 | `dept_finance_payment_plan` (Kế hoạch thanh toán) | 0054 (schema + identity) | 73c738e5 | ✅ ĐÃ TRIỂN KHAI · gates ĐẠT |
| E2 | `dept_finance_advance` (Tạm ứng / Hoàn ứng) | 0055 (schema + identity) | 522cab13 | ✅ ĐÃ TRIỂN KHAI · gates ĐẠT |
| E3 | `dept_finance_site_cost` (Chi phí BCH) | 0056 (schema + identity) | 422acbe0 | ✅ ĐÃ TRIỂN KHAI · gates ĐẠT |
| E4 | `dept_finance_cashbank` (Sổ quỹ & Ngân hàng) | 0057 (schema + identity) | 6bca9d8f | ✅ ĐÃ TRIỂN KHAI · gates ĐẠT |
| E5 | `dept_finance_documents` (Chứng từ kế toán) | 0058 (schema + identity) | 209a68ca | ✅ ĐÃ TRIỂN KHAI · gates ĐẠT |
| F1 | `dept_legal_hr` + `dept_legal_labor` | 0059 (schema + identity) | 93019d4d | ✅ ĐÃ TRIỂN KHAI · gates ĐẠT |
| F2 | Công văn + Văn bản + Con dấu + Bảo hiểm | 0060 (schema + identity) | aff0fbcb | ✅ ĐÃ TRIỂN KHAI · gates ĐẠT |
| Lint-fix | Sửa lint trang admin (impure render, any) | 0061 (identity-refresh) | 6d082737 | ✅ ĐÃ TRIỂN KHAI · gates ĐẠT |
| **2A** | **Nâng cấp màn `reports` (M&E)** — giá trị HĐ theo dự án, công nợ NCC, tồn kho theo HĐ, cảnh báo tồn thiếu, xuất CSV/XLSX/In-PDF | 0062 (identity-refresh) | 091dd4ce | ✅ ĐÃ TRIỂN KHAI · gates ĐẠT |
| **2B** | **Xuất sổ kế toán tổng hợp (MISA/CSV/JSON)** — gộp thu hồi vốn, thanh toán HĐ, tạm ứng, chi phí BCH, sổ quỹ, chứng từ thành bút toán Nợ/Có | 0063 (identity-refresh) | bb293e8a | ✅ ĐÃ TRIỂN KHAI · gates ĐẠT |
| **2C** | **Chất lượng dữ liệu** — action `check_material_alias_conflicts` + UI soát trùng alias; báo cáo đối chiếu 3 luồng hoàn trả/điều chuyển | 0064 (identity-refresh) | caf2d196 | ✅ ĐÃ TRIỂN KHAI · gates ĐẠT |
| **3A** | **Fix test `mobile-menu`** — Windows path (`fileURLToPath`) + cập nhật assertion material_norms (màn đã thành thật) | 0065 (identity-refresh) | 309afa20 | ✅ ĐÃ TRIỂN KHAI · regression **61/61 pass** |
| **3B** | **Dashboard cảnh báo tồn dưới mức tối thiểu** — card chi tiết (mã/tên/kho/tồn/min/thiếu) + nút lập đề nghị | 0066 (identity-refresh) | aea07382 | ✅ ĐÃ TRIỂN KHAI · gates ĐẠT |
| **3C** | **Báo cáo Dashboard quản lý — KH ↔ TH ↔ Ngân sách & Thu hồi vốn** trên màn reports (theo dự án, cảnh báo vượt KH/tiến độ chậm, xuất CSV/XLSX/In-PDF) | 0067 (identity-refresh) | 7500ff13 | ✅ ĐÃ TRIỂN KHAI · gates ĐẠT |
| **3D** | **Màn Inventory** — thêm bộ lọc "chỉ hiện tồn dưới mức tối thiểu" + sắp xếp mã thiếu trầm trọng lên đầu | 0068 (identity-refresh) | 983b4057 | ✅ ĐÃ TRIỂN KHAI · gates ĐẠT |
| **3E** | **Màn Requests** — banner cảnh báo "vật tư đang thiếu tồn trong phạm vi" + nút lập đề nghị ngay | 0069 (identity-refresh) | c287ba8f | ✅ ĐÃ TRIỂN KHAI · gates ĐẠT |
| **3F** | **Xuất PDF tải xuống** cho các báo cáo (helper `reportPdf`, nút ⇩ PDF trên reports + sổ kế toán) | 0070 (identity-refresh) | 37e62f66 | ✅ ĐÃ TRIỂN KHAI · gates ĐẠT |
| **UX-071** | **Điều chỉnh UX/UI** — nút `.primary/.secondary` nhỏ gọn (42→36px, font 12→10, weight 850→750); header bảng wrap (nowrap→normal); ô nhập `payment-entry-inline` cao 34→38px + grid tự co giãn (auto-fit, sửa form nhiều trường bị cụt chữ); **khôi phục encoding UTF-8 globals.css** (trước đây bị ghi sai qua PowerShell 5.1 ANSI) | 0071 (identity-refresh) | 5d92a24a | ✅ ĐÃ TRIỂN KHAI · gates ĐẠT · regression 61/61 |
| **3G** | **Màn Kiểm kê & hoàn trả** — thêm card "Đối chiếu luồng vật tư rời" (điều chuyển + hoàn trả kho tổng) + xuất CSV/XLSX, chuẩn bị hợp nhất 3 luồng | 0072 (identity-refresh) | 9aa26e25 | ✅ ĐÃ TRIỂN KHAI · gates ĐẠT |
| **3H** | **Báo cáo dòng tiền theo dự án** trên dept_finance_recovery — Thu (thanh toán HĐ + sổ quỹ thu) − Chi (tạm ứng + chi phí BCH + sổ quỹ chi), xuất CSV/XLSX/PDF | 0073 (identity-refresh) | 6425f912 | ✅ ĐÃ TRIỂN KHAI · gates ĐẠT |
| **3I** | **Báo cáo "Cảnh báo quá hạn & sắp đến hạn"** trên reports — PO trễ hẹn, nhiệm vụ quá hạn, hợp đồng sắp hết hiệu lực (mức Cao/TB/Thấp) + xuất CSV/XLSX/PDF | 0074 (identity-refresh) | 0c5b81e5 | ✅ ĐÃ TRIỂN KHAI · gates ĐẠT |
| **3J** | **Fix nhãn & menu Quản lý dự án** — cập nhật 15 mô tả nghiệp vụ thật (bỏ cụm "ĐANG PHÁT TRIỂN · ..." trên 15 màn đã hoàn thiện); thu gọn DEVELOPMENT_MODULES (chỉ còn dept_plan_*/dept_project_* workspace); thêm fallback "Chưa có dự án đang hoạt động" khi menu Quản lý dự án chưa có dự án active | 0075 (identity-refresh) | 54394992 | ✅ ĐÃ TRIỂN KHAI · gates ĐẠT · regression 61/61 |
| F2 | Công văn + Văn bản + Con dấu + Bảo hiểm | 0060 (schema + identity) | aff0fbcb | ✅ ĐÃ TRIỂN KHAI · gates ĐẠT |

> 🎉 **HOÀN THÀNH TOÀN BỘ 15 MÀN**: fingerprint hiện tại `VNTECH-FP-6D082737CB73D06F` · source 184 files · migrations 0000..0061. Full build + release gate + master-baseline + css + pg-preflight + workflow E2E + regression (53 pass, 1 pre-existing Windows path bug) đều xác nhận.
| F1–F2 | 6 màn legal | 0059+ (schema + identity) | — | ⏳ CHỜ TRIỂN KHAI |

> ⚠️ **Bài học thực tế quan trọng**: mỗi vòng thay đổi source (kể cả màn không có schema mới) đều **bắt buộc có migration identity-refresh tiếp theo** vì `vntech_product_identity.source_fingerprint` thay đổi theo source; migration head tăng → **release fingerprint và MIGRATION_RANGE/HEAD đều đổi**. Công cụ chuẩn hoá: `node tools/refresh-phase-identity.mjs <head-file.sql> "<phase-label>"` → sau đó `node scripts/generate-release-manifest.mjs` + đủ gates.
> ⚠️ **Lưu ý đã xác minh**: migration identity-refresh từ 0050+ (tên không khớp mẫu `004\d+_...identity_refresh`) **chỉ nên nhúng literal 64-hex `source_fingerprint`** (bị generic normalizer che nên fingerprint bền vững); KHÔNG nhúng brand/release/short vào block vì gây vòng lặp hash. `vntech_trust_settings` giữ giá trị cũ (chỉ cosmetic trong admin, không phải gate).

---

## 0. BỐI CẢNH & RÀNG BUỘC (ĐỌC TRƯỚC KHI LÀM)

### 0.1 Trạng thái nguồn hiện tại của 15 màn
- Toàn bộ 15 màn đang render bằng component `DevelopmentModule` (`app/page.tsx` ~dòng 707–709) và mô tả nằm trong map `titles` (~dòng 154–180).
- 15 màn: **6 tài chính** (`dept_finance_payment_plan`, `dept_finance_recovery`, `dept_finance_advance`, `dept_finance_site_cost`, `dept_finance_cashbank`, `dept_finance_documents`), **6 pháp chế/hành chính** (`dept_legal_hr`, `dept_legal_labor`, `dept_legal_correspondence`, `dept_legal_documents`, `dept_legal_seal`, `dept_legal_benefits`), **3 nghiệp vụ lớn** (`site_command`, `construction`, `material_norms`).

### 0.2 Điều tra dữ liệu đã làm (kết quả nguồn — không phỏng đoán)
| Màn | Nền dữ liệu CÓ SẴN | Nền dữ liệu CÒN THIẾU (cần migration 0050+) |
|---|---|---|
| `site_command` | Org unit `organization_units` `unit_type='site_command'`, `code='BCH'` gắn `project_id`; gán thành viên qua `users.organization_unit_id`; task engine `work_items` | — (chỉ cần UI đọc/ghi membership) |
| `construction` | `work_items` (nhật ký+tiến độ theo task), `production_reports`, `stock_issues`, `attachments` (ảnh hiện trường) | Bảng `construction_daily_logs` (nhật ký), `construction_progress_milestones` nếu muốn chi tiết |
| `material_norms` | `boq_material_components` (`quantity_ratio`, `component_type`) | Bảng `material_norms` (định mức độc lập theo dự án/hạng mục) |
| `dept_finance_recovery` | `capital_recovery_records` + `contract_payments` (đã có action `save_capital_recovery`, `save_contract_payment`) | — (chủ yếu là dashboard tổng hợp + UI) |
| `dept_finance_payment_plan` | `contract_payments`, `purchase_orders` | Bảng `payment_plans` (lịch thanh toán theo HĐ/PO) |
| `dept_finance_advance` | `team_payments` (`payment_type='advance'`) | Bảng `advance_requests` (tạm ứng/hoàn ứng) |
| `dept_finance_site_cost` | `stock_issues`, `work_items` (chi phí BCH) | Bảng `site_expense_claims` (chi phí hiện trường) |
| `dept_finance_cashbank` | — | Bảng `cashbook_entries`, `bank_accounts` |
| `dept_finance_documents` | `email_outbox`, `attachments` | Bảng `accounting_vouchers` (chứng từ) |
| `dept_legal_hr` | `users` (danh sách nhân sự), org units | Bảng `hr_records` (hồ sơ nhân sự chi tiết) |
| `dept_legal_labor` | — | Bảng `labor_contracts` |
| `dept_legal_correspondence` | `work_items` (task pháp chế) | Bảng `official_correspondence` (công văn đến/đi) |
| `dept_legal_documents` | `attachments` | Bảng `legal_documents` (văn bản pháp lý) |
| `dept_legal_seal` | — | Bảng `seal_management`, `authorization_letters` |
| `dept_legal_benefits` | — | Bảng `benefit_records` (bảo hiểm & chế độ) |

### 0.3 Ràng buộc integrity (BẮT BUỘC — nếu vi phạm, build/cài bị chặn)
`app/page.tsx`, `app/globals.css`, `scripts/system-route.mjs`, `db/schema.ts`, `drizzle/0000..0049`, bộ identity, `MANIFEST_SHA256.txt` đều nằm trong 171 file được hash. Xem đầy đủ điều khoản ở `/docs/01` §5.3 và `docs/04` §0.

**Quy trình bắt buộc cho MỌI thay đổi source:**
```
1. Làm trên nhánh riêng (feature/phase1-<screen>).
2. Sửa source → chạy `node scripts/verify-vntech-fingerprint.mjs` (báo fingerprint mới).
3. Refresh identity SSOT bằng ĐÚNG tool (KHÔNG sửa tay):
   lib/vntech-identity-data.mjs + VNTECH_FINGERPRINT.json + VNTECH_PRODUCT_IDENTITY.txt
   + MANIFEST_SHA256.txt (tái sinh) + (nếu đổi migration head) MIGRATION_HEAD.
4. Mỗi bảng mới = 1 migration **append 0050+** (KHÔNG sửa 0000..0049).
5. Chạy đủ gates: verify:release, verify:master-baseline, verify:css-baseline,
   verify:fingerprint, npm test.
```
> ⚠️ Trong `app/globals.css` chỉ được **thêm** class trong block `BEGIN/END` hợp lệ, giữ dưới 400.653 B / 4.950 `!important`. KHÔNG format lại code bằng prettier.

---

## 1. THỨ TỰ ƯU TIÊN (VALUE-FIRST, RỦI RO THẤP → CAO)

Khung quyết định: **màn nào dùng dữ liệu có sẵn thì làm trước** (không cần migration, rủi ro thấp nhất), rồi mới tới màn cần schema mới (migration 0050+), cuối cùng là màn nhiều bảng mới + workflow.

| Thứ tự | Nhóm | Lý do |
|---|---|---|
| **A** | `site_command` (BCH dự án) | Tựa 100% dữ liệu có sẵn; không migration; giá trị thấy ngay |
| **B** | `dept_finance_recovery` (Thu hồi vốn/Công nợ tổng hợp) | Tab tổng hợp từ bảng có sẵn; không migration; nối với dashboard tài chính |
| **C** | `construction` (Thi công) | Là nghiệp vụ nóng nhất, có `work_items`+`production_reports` nền; cần 1 bảng nhật ký mới |
| **D** | `material_norms` (Định mức vật tư) | Nối `boq_material_components`; cần 1 bảng định mức mới |
| **E** | 6 màn `dept_finance_*` còn lại | 3 màn cần 1 bảng mới, 2 màn nhiều bảng (cashbank, documents) |
| **F** | 6 màn `dept_legal_*` | Toàn bộ cần schema mới + workflow; rủi ro/chỉnh lớn nhất |

> Mỗi giai đoạn là **1 vòng release riêng** kèm refresh identity. Không gộp nhiều màn vào một vòng nếu cùng sửa `system-route.mjs`/`page.tsx` theo cách rủi ro.

---

## 2. GIAI ĐOẠN A — site_command (BCH DỰ ÁN) · KHÔNG MIGRATION

**Mục tiêu:** Màn duyệt danh sách Ban chỉ huy theo đúng dự án đang hoạt động; xem thành viên/nhiệm vụ; không tạo tầng quản lý BCH trung gian.

### Việc cần làm
1. **Backend** (`system-route.mjs`): thêm dữ liệu bootstrap cho module `site_command` trong khối `loadAppData` (gần dòng 400–719):
   - Danh sách `organization_units` `unit_type='site_command'` thuộc các `project_id` mà user có quyền (`user_project_scopes`).
   - Thành viên từ `users.organization_unit_id`; gắn `role_name`, online.
   - `work_items` (`department_code='BCH'`) của các dự án để hiển thị nhiệm vụ.
   - Actions cần có (nếu chưa): `save_site_command_member` (gán/gỡ thành viên BCH dự án — kiểm module `org_units` hiện đã có `save_organization_unit` khi `unit_type='site_command'` và `code='BCH'`), `set_site_command_status`.
2. **Frontend** (`app/page.tsx`):
   - Thay `DevelopmentModule` tại case `site_command` bằng màn `SiteCommandScreen` thật:
     - Card tổng quan mỗi BCH (dự án, trạng thái, số thành viên, số nhiệm vụ đang mở).
     - Tab **Thành viên** (thêm/gỡ user, vai trò trong BCH).
     - Tab **Nhiệm vụ** (lọc từ `work_items` theo BCH + trạng thái).
   - Thêm `site_command` vào mảng các screen render thật (gần nơi `DevelopmentModule` được gọi).
3. **CSS**: chỉ thêm class mới trong block hợp lệ (`site-cmd-*`).

### Kiểm soát
- Không chạm schema → không migration mới.
- Chạy đủ 5 gates; refresh identity 1 lần cho vòng A.

---

## 3. GIAI ĐOẠN B — dept_finance_recovery (Thu hồi vốn / Công nợ) · KHÔNG MIGRATION

**Mục tiêu:** Màn Phòng Tài chính xem/thao tác chuỗi thu hồi vốn, công nợ theo dự án — nối thẳng dữ liệu đã có ở những màn `capital_recovery`, `payments`, `production`.

### Việc cần làm
1. **Backend**: trong khối `loadAppData`, khi module `dept_finance_recovery`, trả về:
   - `capital_recovery_records` JOIN `contract_payments` (đã có query tại dòng 656–658 — tái sử dụng).
   - Tổng hợp theo dự án: giá trị hồ sơ, cash received, số dư công nợ (`approved_value − cashReceived`).
   - `production_reports` đã duyệt để liên kết.
   - Quyền: phòng `admin`, `accountant`, `commander`, `project` (dùng `requireRole` như backend tài chính hiện có).
2. **Frontend** (`dept_finance_recovery`): `FinanceRecoveryScreen`
   - Bảng công nợ theo dự án (đầu kỳ, phát sinh, đã thu, còn nợ).
   - Drill-down hồ sơ thu hồi vốn + dòng thanh toán; nút liên kết hồ sơ ↔ thanh toán.
   - Xuất CSV các cột nghiệp vụ.
3. **CSS**: block mới `fin-*`.

> Lưu ý tách: màn `capital_recovery` (chỗ làm việc của BCH/Phòng Dự án) vẫn giữ; `dept_finance_recovery` là **góc nhìn Phòng Tài chính tổng hợp**.

---

## 4. GIAI ĐOẠN C — construction (Thi công) · 1 BẢNG MỚI

**Mục tiêu:** Nhật ký thi công, tiến độ thực địa, nghiệm thu và ảnh hiện trường theo dự án.

### Migration 0050 (append, KHÔNG sửa cũ)
```
CREATE TABLE IF NOT EXISTS construction_daily_logs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL, warehouse_id TEXT,
  work_date TEXT NOT NULL, shift TEXT, -- sáng/chiều/nghỉ
  work_content TEXT, weather TEXT,
  labor_count INTEGER DEFAULT 0, equipment_note TEXT,
  status TEXT DEFAULT 'draft',         -- draft / submitted / approved
  submitted_by TEXT, approved_by TEXT, approved_at TEXT,
  created_at TEXT, updated_at TEXT
);
-- + bảng chi tiết construction_daily_log_items (hạng mục/khối lượng/ảnh) nếu cần
```
> Kiểm tra chuỗi migration head hiện tại (0049) và cập nhật `MIGRATION_HEAD` **trong cùng vòng refresh identity**.

### Việc cần làm
1. **Backend**:
   - Actions: `save_construction_daily_log`, `submit_construction_daily_log`, `approve_construction_daily_log`, `list_construction_daily_logs` (theo project + scope), `delete_construction_daily_log`.
   - Tích hợp upload ảnh hiện trường qua `/api/files` (SSOT đã có) + lưu id vào `attachments`.
   - Tự sinh `work_items` (`department_code='BCH'`, `source_type='construction'`) khi log được duyệt để nối Task Engine.
   - Nối `production_reports`: log thi công đã duyệt có thể là nguồn tham chiếu cho báo cáo sản lượng.
2. **Frontend** (`construction`): `ConstructionScreen`
   - Lịch/ngày nhập nhật ký theo dự án; form thêm hạng mục, khối lượng, nhân công, thiết bị, thời tiết.
   - Upload ảnh hiện trường (nhiều ảnh/dòng).
   - Tab **Nghiệm thu**: danh sách log/submission trạng thái + nút duyệt (theo phân quyền BCH/Phòng Dự án).
   - Tab **Tiến độ**: biểu đồ đơn giản khối lượng kế hoạch vs thực tế (đọc từ `project_boq_items` + log).
3. **CSS**: block `construction-*`.

### Kiểm soát
- Migration 0050 là **append**; không sửa 0000..0049.
- Refresh identity + cập nhật MIGRATION_HEAD + tái sinh MANIFEST.

---

## 5. GIAI ĐOẠN D — material_norms (Định mức vật tư) · 1 BẢNG MỚI

**Mục tiêu:** Định mức tiêu hao theo dự án/hạng mục, độc lập khỏi BOQ/HĐ; dùng để gợi ý ước lượng mua sắm.

### Migration 0051 (append)
```
CREATE TABLE IF NOT EXISTS material_norms (
  id TEXT PRIMARY KEY,
  project_id TEXT, subcategory_id TEXT, item_name TEXT,
  material_id TEXT,                -- mã vật tư gốc (materials)
  base_uom TEXT, quantity_per_unit REAL, -- định mức tiêu hao / đơn vị hạng mục
  unit TEXT, notes TEXT,
  source_component_id TEXT,        -- nối boq_material_components khi lấy từ BOQ
  status TEXT DEFAULT 'active', active INTEGER DEFAULT 1,
  created_by TEXT, created_at TEXT, updated_at TEXT
);
```

### Việc cần làm
1. **Backend**:
   - Actions CRUD: `save_material_norm`, `set_material_norm_status`, `delete_material_norm`, `list_material_norms` (theo project/subcategory/material; lọc active).
   - `estimate_from_norms`: nhập khối lượng hạng mục → gợi ý nhu cầu vật tư = khối lượng × `quantity_per_unit`; đối chiếu `materials`.
   - Tùy chọn nhập định mức từ BOQ (`source_component_id`) để đồng bộ.
2. **Frontend** (`material_norms`): `MaterialNormsScreen`
   - Bảng định mức: hạng mục, vật tư, đơn vị, `quantity_per_unit`, nguồn (thủ công/BOQ).
   - Form thêm/sửa; nút "Ước lượng nhu cầu từ định mức" (nhập khối lượng → xem gợi ý).
   - Liên kết mã vật tư từ `materials` (chống lệch chuẩn hóa).
3. **CSS**: block `norms-*`.

---

## 6. GIAI ĐOẠN E — 6 màn dept_finance_* còn lại

Thứ tự trong vòng: `payment_plan` → `advance` → `site_cost` → `cashbank` → `documents`.

### E1. dept_finance_payment_plan — Kế hoạch thanh toán (1 bảng mới)
- Migration 0052: `payment_plans` (project_id, contract_id/po_id, milestone, planned_date, planned_amount, paid_amount, status).
- Backend: CRUD + đối chiếu thực thu từ `contract_payments`.
- Frontend: bảng lịch thanh toán kỳ hạn, tỷ lệ khoán tiến độ so với `production_reports` đã duyệt.

### E2. dept_finance_advance — Tạm ứng / Hoàn ứng (1 bảng mới)
- Migration 0053: `advance_requests` (project_id, requester, amount, purpose, category [tạm ứng mua/đi công tác/...], status draft→submitted→approved→settled, settlement_value, advance_paid).
- Backend: luồng duyệt đơn giản 1–2 bước (tái dùng pattern approval hiện có); nối `team_payments` nếu tạm ứng tổ đội.
- Frontend: danh sách tạm ứng + hoàn ứng + theo dõi số dư người ứng.

### E3. dept_finance_site_cost — Chi phí Ban chỉ huy (1 bảng mới)
- Migration 0054: `site_expense_claims` (project_id, cost_type, amount, paid_by, claim_date, description, attach_voucher, status).
- Backend: CRUD + phân loại chi phí; nhập từ `stock_issues` (chi phí vật tư) khi muốn.
- Frontend: bảng chi phí theo dự án/kỳ, tổng theo loại, nút duyệt BCH.

### E4. dept_finance_cashbank — Sổ quỹ & Ngân hàng (2 bảng mới)
- Migration 0055: `bank_accounts` (code, bank_name, account_no, branch, balance), `cashbook_entries` (entry_date, account_id, type in/out, amount, counterparty, reference_type/id, note).
- Backend: CRUD, lấy số dư = SUM(in)−SUM(out), đối chiếu giao dịch.
- Frontend: số quỹ/ngân hàng, nhập thu/chi, in sổ quỹ CSV, báo cáo số dư cuối kỳ.

### E5. dept_finance_documents — Chứng từ kế toán (1 bảng mới)
- Migration 0056: `accounting_vouchers` (voucher_no, voucher_date, voucher_type, project_id, description, total_amount, status, files_json gắn `attachments`).
- Backend: CRUD + liên kết chứng từ tới nguồn nghiệp vụ (recovery/payment/advance/site-cost).
- Frontend: danh sách + upload bản scan chứng từ qua `/api/files`; lọc theo loại/kỳ/dự án.

> Mỗi màn E là **sub-phase riêng**: làm áp dụng 1 màn → chạy gates → refresh identity → release. Không gộp 5 màn vào một vòng.

---

## 7. GIAI ĐOẠN F — 6 màn dept_legal_* (rủi ro cao nhất · làm sau cùng)

Toàn bộ đều cần schema + workflow; có thể gom theo **2 đợt** để giảm số vòng refresh:

**Đợt F1 (HR/Labor):**
- Migration 0057 `hr_records` + Migration 0058 `labor_contracts`.
- `dept_legal_hr` (Hồ sơ nhân sự): nối `users`, bổ sung `hr_records` (CCCD, ngày sinh, địa chỉ, trình độ, phòng ban, hợp đồng hiện tại). CRUD.
- `dept_legal_labor` (Hợp đồng lao động): CRUD loại HĐ (thử việc/1 năm/không xác định hạn), trạng thái, cảnh báo hết hạn.
- Tự sinh task `work_items` (`department_code='LEGAL'`) cho việc gia hạn hợp đồng.

**Đợt F2 (Văn thư/Pháp lý):**
- Migration 0059 `official_correspondence` (Công văn đến/đi: loại, số hiệu, ngày, đơn vị gửi/nhận, trích yếu, xử lý nội bộ qua task), 0060 `legal_documents` (văn bản pháp lý + `attachments`), 0061 `seal_management` + `authorization_letters` (Con dấu/Ủy quyền), 0062 `benefit_records` (BHXH/chế độ theo nhân sự).
- Backend: CRUD từng loại + tự sinh task công văn cho người phụ trách (Task Engine).
- Frontend: mỗi màn 1 screen CRUD + lọc; module `dept_legal_documents` hỗ trợ upload/bản scan.

> RỦI RO: vòng F1+F2 đụng nhiều file source (page.tsx, system-route.mjs, schema.ts, globals.css). Phải tách từng đợt, chạy đủ gates và refresh identity giữa các đợt.

---

## 8. MAP THÀNH VIỆC CHO TỪNG VÒNG (CHECKLIST CAM KẾT)

| Vòng | Phạm vi | Migration mới | Động tác bắt buộc cuối vòng |
|---|---|---|---|
| A ✅ | site_command | 0050 (identity-refresh) | + MIGRATION_HEAD, refresh, gates |
| B ✅ | dept_finance_recovery | 0051 (identity-refresh) | + MIGRATION_HEAD, refresh, gates |
| C ✅ | construction | 0052 (schema + identity) | + MIGRATION_HEAD, refresh, gates |
| D ✅ | material_norms | 0053 (schema + identity) | + MIGRATION_HEAD, refresh, gates |
| E1 | payment_plan | 0054 (schema + identity) | + MIGRATION_HEAD, refresh, gates |
| E2 | advance | 0055 (schema + identity) | + MIGRATION_HEAD, refresh, gates |
| E3 | site_cost | 0056 (schema + identity) | + MIGRATION_HEAD, refresh, gates |
| E4 | cashbank | 0057 (schema + identity) | + MIGRATION_HEAD, refresh, gates |
| E5 | documents | 0058 (schema + identity) | + MIGRATION_HEAD, refresh, gates |
| F1 | legal hr + labor | 0059–0060 (schema + identity) | + MIGRATION_HEAD, refresh, gates |
| F2 | legal correspondence/documents/seal/benefits | 0061–0064 (schema + identity) | + MIGRATION_HEAD, refresh, gates |

> Mỗi vòng: thực hiện source → `node scripts/verify-vntech-fingerprint.mjs` (kiểm tra) → **`node tools/refresh-phase-identity.mjs <head>.sql "<label>"`** (đăng ký fingerprint/brand/release + head mới) → `node scripts/generate-release-manifest.mjs` → `npm run verify:*` × 4 → `npm test`. Chỉ merge khi fingerprint mới đã được **đăng ký** vào identity SSOT.

---

## 9. ƯỚC LƯỢNG & ĐỘI LÀM

| Giai đoạn | Ngày công (ước) | Kỹ năng cần |
|---|---|---|
| A + B | 3–5 ng | Frontend React + quen Task Engine |
| C (construction) | 5–8 ng | Backend SQL/migration + React + files upload |
| D (norms) | 3–5 ng | Backend + query BOQ + React |
| E (5 màn finance) | 4–6 ng/màn | Backend + migration + React |
| F (2 đợt legal) | 5–8 ng/đợt | Backend + migration + workflow + React |

> Toàn bộ Phase 1 khả thi trong **6–10 tuần** với 1–2 dev, nếu giữ kỷ luật "1 vòng = 1 release + refresh identity". Phân chia theo thứ tự A→B→C→D→E→F tối đa tạo giá trị sớm và giảm rủi ro.

---

## 10. PITFALL CẦN TRÁNH
1. **Gộp nhiều màn vào 1 vòng** → một lỗi CSS/JS làm hỏng cả release, khó rollback. Luôn tách vòng.
2. **Sửa `0000..0049`** bất kỳ → luôn **append** 0050+.
3. **Tạo dữ liệu giả (seed) khi chốt nghiệp vụ** — các note "ĐANG PHÁT TRIỂN" ghi rõ phải chốt schema/workflow trước; không seed CRUD tài chính/pháp lý giả.
4. **Format lại file SPA/system-route bằng prettier** → đổi fingerprint vô nghĩa, gate chặn. Chỉ thêm dòng, không reformat.
5. **Dùng số xuất kho làm sản lượng/nghiệm thu** (đã ghi rõ trong `production`) — construction phải dùng log thi công/nghiệm thu thật.
6. **Không tạo tầng "Quản lý BCH trung gian"** cho `site_command` — BCH phải gắn trực tiếp dự án (đúng note tại dòng 166).

---

## 11. KẾT LUẬN
Phase 1 là cách **tạo giá trị thấy được nhanh nhất** và ít rủi ro nhất nếu làm đúng quy trình identity. Ưu tiên tuyệt đối: **A (BCH) → B (Công nợ tổng hợp) → C (Thi công) → D (Định mức) → E (Tài chính) → F (Pháp chế)**, mỗi bước là một vòng release tách biệt kèm refresh fingerprint. Dữ liệu và backend cho A, B, và phần lớn C đã sẵn sàng — chỉ cần dựng UI real trên đó; các màn còn lại cần migration 0050+ theo đúng cam kết ở §8.
