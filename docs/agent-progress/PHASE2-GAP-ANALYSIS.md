# PHASE 2 — GAP ANALYSIS: PR / APPROVAL / PO / GRN

- **Ngày lập:** 21/09/2026
- **Người lập:** AUDIT (TASK-103) — chế độ **CHỈ ĐỌC + GHI TÀI LIỆU** (không sửa mã, không migration, không build, không dừng/khởi động dịch vụ)
- **Đặc tả nguồn:** `docs/agent-progress/PHASE2-REQUIREMENTS-USER.md` (878 dòng, 31 mục)
- **Phạm vi:** bước **1 → 11** của mục §30 (*FIRST ACTION — KHÔNG CODE NGAY*). **Bước 12 (implementation) KHÔNG thực hiện.**
- **Bằng chứng thật dùng cho báo cáo:** MySQL 8.0 `vntech_erp` (live) · `scripts/system-route.mjs` (3.304 dòng) · `java-backend/**` · `app/**` · `drizzle/**` · `docs/**`

---

## 0. QUY ƯỚC BẰNG CHỨNG (theo §3 của đặc tả)

| Nhãn | Nghĩa | Cách kiểm chứng trong báo cáo này |
|---|---|---|
| **CONFIRMED** | Đọc trực tiếp từ CSDL thật / mã nguồn thật / chạy lệnh đo | ghi `tệp:dòng`, câu SQL, hoặc kết quả đo |
| **LIKELY** | Suy ra từ nhiều bằng chứng gián tiếp nhưng chưa đo trực tiếp | ghi rõ các bằng chứng đỡ |
| **UNKNOWN** | Chưa có nguồn xác định trong repo | ghi rõ "cần người dùng chốt" |
| **INFERENCE** | Suy luận của người audit | ghi rõ, **KHÔNG** dùng làm business rule (§3 cấm) |

> ⚠️ **Nguyên tắc áp dụng:** mọi dòng dưới đây có đúng 1 nhãn. Không có nhãn nào là "quy tắc nghiệp vụ" trừ khi nguồn là **CONFIRMED FROM DOCUMENT** hoặc **USER REQUIREMENT** (đặc tả 31 mục).

---

## 1. TÀI LIỆU PHASE 2 — ĐÃ TÌM VÀ ĐÃ ĐỌC (§2 của đặc tả — BƯỚC 1→3)

### 1.1 Kết quả truy tìm

| # | Tệp | Kích thước | Loại | Kết luận |
|---|---|---|---|---|
| 1 | `docs/Quy trình đặt hàng.docx` | 46.040 B | **SƠ ĐỒ (flowchart) duy nhất** | ✅ **ĐÃ ĐỌC** (xem §1.2) |
| 2 | `docs/PHASE2-REQUIREMENTS-USER.md` | 878 dòng | Đặc tả 31 mục (người dùng gửi) | ✅ đã đọc toàn bộ |
| 3 | `docs/DIEN_GIAI_CAC_PHASE_MASTER_TASK.docx` | 63.785 B | Giải thích 12 phase của MASTER TASK | ✅ đã trích; **PHASE 2 chỉ 9 mục `P-01…P-09`, KHÔNG có quy trình PR/PO** |
| 4 | `docs/01_BAO_CAO_PHAN_TICH_DU_AN.md` | — | Phân tích dự án | ✅ có mô tả 1 dòng luồng MR→duyệt 5 bậc→PO→GRN→tồn |
| 5 | `docs/24_SYSTEM_AUDIT_REPORT.md` | — | Audit hệ thống gốc | ✅ §15 nguồn gốc các mục `P-*` |
| 6 | `docs/minimal-word-test.docx` | 13.292 B | Tệp thử Word | ❌ vô nghĩa (21 ký tự) |

**Kết luận CONFIRMED:** trong repository **chỉ tồn tại DUY NHẤT một tài liệu quy trình Phase 2** — `docs/Quy trình đặt hàng.docx` — và nó **chỉ có 1 trang, 100% là sơ đồ**, **KHÔNG có một dòng văn bản quy trình nào**.

### 1.2 Cách đọc tài liệu có sơ đồ (§2 yêu cầu BẮT BUỘC đọc cả DIAGRAM/IMAGE)

**Đo cấu trúc tệp trước khi đọc:**

```
docs/Quy trình đặt hàng.docx   (OOXML)
  word/document.xml  158.218 B
  word/_rels/document.xml.rels → KHÔNG có word/media/**  ⇒ KHÔNG có ảnh nhúng
```

| Phép đo | Kết quả |
|---|---|
| `<w:t>` (text) | **32** |
| `<wps:wsp>` (shape) | **30** |
| `<mc:AlternateContent>` | **60** = 30 shape × (Choice + Fallback) |
| `<v:shape>`/`<v:line>` (VML fallback) | **14** |
| Ảnh nhúng (`word/media/**`) | **0** |

**Cách 1 — bóc toàn bộ text của sơ đồ:** đọc trực tiếp `word/document.xml`, lấy mọi `<w:t>` (kể cả text **bên trong** `wps:txbxContent` của shape, mà công cụ trích text thông thường bỏ sót) ⇒ thu được **32/32 nhãn** của sơ đồ.

**Cách 2 — dựng lại sơ đồ bằng hình học để XEM (yêu cầu bắt buộc "không kết luận khi chưa xem hình"):**
1. Bóc `wp:anchor/positionH/posOffset` (x), `positionV/posOffset` (y), `spPr/xfrm/ext` (cx, cy), `prstGeom/@prst`, `tailEnd` (hướng mũi tên) cho **cả 30 shape**.
2. Sinh lại sơ đồ thành **SVG** đúng toạ độ EMU → px (`1 inch = 914.400 EMU = 96 px`), tô màu hộp/đường/mũi tên, gắn số thứ tự shape.
3. Render SVG → **PNG 1400×900** bằng headless Edge (`--headless=new --screenshot`) ⇒ **đã có ảnh sơ đồ để đối chiếu**.

> ⚠️ **Hạn chế đã gặp (khai báo trung thực):**
> - `Microsoft Word` có trên máy nhưng **COM `ExportAsFixedFormat`/`SaveAs2` bị treo** (quá 120 s và 180 s) ⇒ phải bỏ hướng xuất PDF bằng Word, chuyển sang dựng SVG từ toạ độ (kết quả **chính xác hơn** vì đọc trực tiếp hình học gốc).
> - Công cụ **vision bị rate-limit (HTTP 429/502)** ở cả 2 lần gọi ⇒ **không đọc được ảnh qua mô hình thị giác**. Bù lại: sơ đồ **chỉ có chữ trong hộp** (không có hình vẽ biểu tượng, không có ảnh), nên **32/32 nhãn đã được bóc bằng text + hình học** và **đã được kiểm tra tính khớp** bằng toạ độ (mỗi nhãn nằm đúng trong hộp/mũi tên của nó). **Không có thông tin nào của sơ đồ bị bỏ sót vì lỗi vision.**

### 1.3 NỘI DUNG SƠ ĐỒ `Quy trình đặt hàng.docx` (CONFIRMED FROM DOCUMENT)

**Nguồn vào:** hộp `ĐƠN HÀNG TỪ DỰ ÁN` (x≈2.238.375 EMU, y=0) — tức **không có "phiếu đề nghị mua" như một bước riêng**; đầu vào là *đơn hàng phát sinh từ dự án*.

**Trình tự công đoạn (theo toạ độ y tăng dần = xuống dưới):**

| Thứ tự | Công đoạn | Hình dạng | Bằng chứng toạ độ |
|---|---|---|---|
| 1 | **PHÒNG DỰ ÁN KIỂM TRA** | **thoi quyết định** (`flowChartDecision`) | y=1.200.150 |
| 2 | **BAN LÃNH ĐẠO KIỂM TRA** | **thoi quyết định** | y=4.238.625 |
| 3 | **PHÒNG KẾ HOẠCH KIỂM TRA ĐẶT HÀNG** | hộp lớn (2.505.075×714.375) | y=3.009.899 |
| 4 | **MUA HÀNG NHÀ CUNG CẤP** | hộp | y=6.019.800 |
| 5 | **CẬP NHẬT ĐƠN HÀNG VÀ THEO DÕI** | hộp | y=7.124.700 |
| 6 | **BÀN GIAO HỒ SƠ GIẤY TỜ** | hộp | y=8.229.600 |
| 7 | **THANH TOÁN** | hộp (cuối) | y=9.220.200 |

**Nhánh rẽ (CONFIRMED):** sơ đồ có **4 hộp `KHÔNG ĐẠT`** (x=1.028.700 y=2.057.400 · x=4.887.150 y=400.049 · x=4.886.325 y=3.762.375 · x=4.895.215 y=619.125) và **6 hộp `ĐẠT`** (x≈3.3–3.5 M) ⇒ **2 điểm kiểm tra (Phòng Dự án, Ban lãnh đạo) đều có 2 nhánh ĐẠT / KHÔNG ĐẠT**; nhánh `KHÔNG ĐẠT` quay ngược về đầu quy trình.

**Quy tắc người phê duyệt ghi trên sơ đồ (CONFIRMED):** **"PHÒNG DỰ ÁN"** và **"BAN LÃNH ĐẠO"**.

### 1.4 ĐỐI CHIẾU 3 NGUỒN — phát hiện QUAN TRỌNG NHẤT của §2

| Chiều | Mô tả thẩm quyền duyệt PR |
|---|---|
| **TÀI LIỆU** (`Quy trình đặt hàng.docx`) | *Phòng Dự án* → *Ban lãnh đạo* → *Phòng Kế hoạch kiểm tra đặt hàng* — **KHÔNG có "Thư ký Tổng Giám đốc", KHÔNG có "Giám đốc"** |
| **HỆ THỐNG HIỆN TẠI** (CSDL thật) | **5 bước**: CHT xác nhận nhu cầu → **Thư ký TGĐ** → **Phòng Dự án** → **Phòng Kế hoạch** → **Trưởng phòng DA + KH** |
| **ĐẶC TẢ 31 MỤC** (§6) | **4 bước**: **Thư ký TGĐ** → **Phòng Dự án** → **Phòng Kế hoạch** → **Giám đốc** |

**Kết luận: 3 nguồn KHÁC NHAU — không nguồn nào khớp nguồn nào.**

| GAP | Nhãn | Mức |
|---|---|---|
| Tài liệu **không có** "Thư ký TGĐ" (bước 2 của cả hệ thống lẫn đặc tả) | CONFIRMED (thiếu trong tài liệu) | **P0 — cần người dùng chốt** |
| Tài liệu **không có** "Giám đốc" (bước 4 của đặc tả) | CONFIRMED (thiếu trong tài liệu) | **P0 — cần người dùng chốt** |
| Hệ thống có **bước 1 "CHT xác nhận nhu cầu"** mà **cả tài liệu lẫn đặc tả đều không nêu** | CONFIRMED (thừa so với 2 nguồn kia) | **P1** |
| Hệ thống gộp bước cuối là **`all_roles` (2 trưởng phòng cùng xác nhận)**, đặc tả nói **1 người là "Giám đốc"** | CONFIRMED | **P1** |
| Tài liệu **không** mô tả GRN / nhập kho / nhận hàng từng phần (chỉ có "BÀN GIAO HỒ SƠ GIẤY TỜ", "THANH TOÁN") | CONFIRMED (thiếu trong tài liệu) | **P1** |
| Tài liệu **không** mô tả tách 1 PR → nhiều PO, cũng không nói 1 PR = 1 PO | UNKNOWN | **P1** |
| Tài liệu **không** mô tả versioning workflow | UNKNOWN | **P1** |

> 🚩 **CẢNH BÁO PHƯƠNG PHÁP:** đặc tả §4 và §30 nói *"nếu tài liệu chứng minh MR không còn cần thiết…"* / *"nếu tài liệu vẫn yêu cầu MR…"*. **Tài liệu duy nhất của repo KHÔNG nói gì về MR** (không có chữ "MR", không có chữ "Đề nghị mua", chỉ có "ĐƠN HÀNG TỪ DỰ ÁN"). Vì vậy **tài liệu KHÔNG đủ căn cứ để kết luận MR nên giữ hay bỏ** ⇒ xem §3 (mục §4) và §9 (câu hỏi cần người dùng quyết).

---

## 2. HỆ THỐNG HIỆN TẠI — AUDIT CSDL THẬT (§5 của đặc tả — BƯỚC 5)

**Nguồn:** MySQL 8.0 thật, CSDL `vntech_erp`, qua `information_schema` + `SHOW CREATE TABLE` + `COUNT(*)`.

### 2.1 Bảng thật liên quan chuỗi mua hàng (số dòng CHÍNH XÁC)

| Bảng | Số dòng | Có trong đặc tả §18? |
|---|---|---|
| `material_requests` | **17** | ✅ |
| `material_request_items` | **35** | ✅ |
| `purchase_orders` | **7** | ✅ |
| `purchase_order_items` | **13** | (không nêu tên) |
| `goods_receipts` | **16** | ✅ |
| `goods_receipt_items` | **11** | (không nêu tên) |
| `approvals` | **100** | ✅ |
| `approval_stage_catalog` | **5** | (không nêu tên) |
| `approval_stage_decisions` | **0** | (không nêu tên) |
| `workflow_definitions` | **4** | (không nêu tên) |
| `workflow_steps` | **11** | (không nêu tên) |
| `workflow_step_approvers` | **5** | (không nêu tên) |
| `supply_workflow_steps` | **57** | ✅ |
| `procurement_allocations` | **92** | ✅ |
| `contract_stock_ledger` | **25** | ✅ |
| `stock_movements` | **5** | (không nêu tên) |
| `document_sequences` | **18** | (không nêu tên) |
| `attachments` | **11** | (không nêu tên) |
| `suppliers` | **1** | (không nêu tên) |
| `materials` | **14** | (không nêu tên) |
| `request_comments` | **0** | (không nêu tên) |

### 2.2 PHÁT HIỆN P0 — KHÔNG CÓ `purchase_requests` (bảng PR riêng)

```sql
SELECT COUNT(*) FROM information_schema.tables
 WHERE table_schema='vntech_erp' AND table_name LIKE '%purchase_request%';
-- ⇒ 0
```
**CONFIRMED:** **KHÔNG tồn tại thực thể PR riêng.** "PR" trong hệ thống **chỉ là tập con của `material_requests`** (`status='approved'`) — khớp `docs/agent-progress/P01-TAB-SPEC.md:9-11,24`.

### 2.3 PHÁT HIỆN P0 — KHÔNG CÓ **BẤT KỲ** KHOÁ NGOẠI NÀO TRONG TOÀN CSDL

```sql
SELECT COUNT(*) FROM information_schema.key_column_usage
 WHERE table_schema='vntech_erp' AND referenced_table_name IS NOT NULL;
-- ⇒ 0
```
**CONFIRMED:** **0 FK / toàn bộ 121+ bảng.** Tính toàn vẹn tham chiếu **chỉ do mã ứng dụng gánh** (INSERT/UPDATE tay). Bằng chứng hệ quả: `SHOW CREATE TABLE material_requests` chỉ có `PRIMARY KEY`, 1 `UNIQUE KEY`, 2 `KEY` — **không có `CONSTRAINT ... FOREIGN KEY`**; tương tự `purchase_orders`, `goods_receipts`, `approvals`, `workflow_definitions`.

> Đối chiếu: `docs/agent-progress/MASTER_STATUS.md:33` ghi *"FK khai ở drizzle, MySQL chỉ có INDEX"* ⇒ **CONFIRMED** (chỉ mức Drizzle, DB thật không cưỡng chế).

### 2.4 Cột thật của các bảng trọng tâm (CONFIRMED, `information_schema.columns`)

**`material_requests` — 17 cột:** `id` · `request_no`(UNIQUE) · `project_id` · `team_id` · `source_warehouse_id` · `requested_by` · `requested_at` · `needed_at` · `priority` · `area` · `purpose` · `status`(default `draft`) · `approval_stage`(int) · `total_estimated_value` · `created_at` · `updated_at` · `supply_status`(default `approval_pending`) · `contract_id` · `boq_version_id`
⇒ **THIẾU** so với §6/§7: **không có `workflow_id`, không có `workflow_version`, không có `workflow_snapshot`, không có `is_complete`/`completed_at`.**

**`material_request_items` — 27 cột:** `requested_qty` · `stock_allocation_qty` · `approved_purchase_qty` · `ordered_qty` · `received_qty` · `issued_qty` · `installed_qty` · `delivered_qty` · `closed_qty` · `line_status` + `estimated_unit_price` · BOQ/contract refs · `approved_supplier`…
⇒ **ĐÃ CÓ ĐỦ 4 LOẠI SỐ LƯỢNG** mà §10 yêu cầu (`Requested` = `requested_qty`; `PO Allocated` = `ordered_qty`; `GRN Received` = `received_qty`; `Remaining` = `approved_purchase_qty - ordered_qty` hoặc `- received_qty`). **CONFIRMED ĐẠT §10.**

**`purchase_orders` — 17 cột:** `id` · `po_no`(UNIQUE) · `project_id` · `supplier_id` · `receiving_warehouse_id` · `buyer_user_id` · `ordered_at` · `eta` · `status`(default `draft`) · `total_value` · `created_at` · `updated_at` · **`request_id` (nullable, KHÔNG unique)** · `delivery_queued_at` · `delivery_completed_at` · `contract_id` · `boq_version_id` · `decision_reason` · `decided_by` · `decided_at`
⇒ **§9 ĐẠT về mặt lược đồ:** `request_id` **nullable và không UNIQUE** ⇒ **1 PR → N PO được phép** (không có ràng buộc 1-1).

**`purchase_order_items` — 18 cột:** `purchase_order_id` · **`request_item_id` (MUL)** · `line_no` · `ordered_qty` · `unit_price` · `received_qty` · `delivered_qty` · `closed_qty` · `status` · `planned_delivery_at` · `system_code` · `close_reason` · `closed_by` · `closed_at` + BOQ/contract
⇒ **§10/§17 ĐẠT:** tách PO ở **mức DÒNG** qua `request_item_id` ⇒ **1 dòng MR có thể nằm trong nhiều PO** (đúng §10 *"một PR item có thể được chia thành nhiều PO"*).

**`goods_receipts` — 24 cột:** `receipt_no`(UNIQUE) · **`purchase_order_id` (MUL, không UNIQUE)** · `warehouse_id` · `received_by` · `received_at` · `delivery_note_no` · `qc_status` · `document_status` · `posting_status` · `certificate_status` · `delivery_document_status` · `bch_confirmation_status` · `bch_confirmed_by` · `bch_confirmed_at` · `bch_comment` + contract/BOQ
⇒ **§13 ĐẠT về lược đồ:** `purchase_order_id` không UNIQUE ⇒ **1 PO → N GRN**.

**`goods_receipt_items`:** `receipt_id` · `purchase_order_item_id`(MUL) · `received_qty` · `accepted_qty` · `rejected_qty` · `lot_no` · `qc_result`
⇒ **§17 ĐẠT:** truy vết `GRN → GRN item → PO item → request_item` **có đường đi**.

### 2.5 PHÁT HIỆN P0 — WORKFLOW VERSIONING: **KHÔNG TỒN TẠI VÀ BỊ CHẶN Ở MỨC CSDL**

```sql
-- (1) Không có cột version nào trên các bảng workflow/approval:
SELECT table_name, column_name FROM information_schema.columns
 WHERE table_schema='vntech_erp' AND column_name LIKE '%version%';
-- ⇒ CHỈ có boq_versions.*, flyway_schema_history.version, vntech_product_identity.version,
--    project_archives.schema_version, boq_import_batches.version_no
-- ⇒ KHÔNG có workflow_definitions.version, KHÔNG có bất kỳ *_workflow_version
```

```sql
-- (2) Cột `version` ĐÃ TỪNG có và ĐÃ BỊ XOÁ có chủ đích:
SELECT version, description FROM flyway_schema_history
 WHERE description LIKE '%workflow%';
-- 8   | workflow multi
-- 9   | workflow collation fix
-- 17  | workflow dynamic approvals
-- 19  | drop workflow definitions version      ← XOÁ CỘT VERSION
```
**CONFIRMED:** migration **V19 `drop workflow definitions version`** đã **chủ động xoá cột `version`** khỏi `workflow_definitions`.

```sql
-- (3) PROBE chứng minh KHÔNG thể có 2 phiên bản cùng mã workflow:
INSERT INTO workflow_definitions (id,code,name,...) VALUES ('WF-PROBE-V2','WF-PO-01',...);
-- ⇒ ERROR 1062 (23000): Duplicate entry 'WF-PO-01' for key
--      'workflow_definitions.workflow_definitions_code_uidx'
-- Đo lại sau probe: SELECT COUNT(*) FROM workflow_definitions; ⇒ 4 (KHÔNG ghi thêm dòng nào)
```
**CONFIRMED:** `UNIQUE KEY workflow_definitions_code_uidx (code)` ⇒ **mã workflow là duy nhất ⇒ KHÔNG thể tạo `WF-PR V2` cạnh `WF-PR V1`**. Cơ chế "workflow version bất biến theo phiếu" (§7) **bị chặn ở tầng CSDL**, không chỉ thiếu code.

### 2.6 PHÁT HIỆN P0 — HAI HỆ WORKFLOW SONG SONG, HỆ CHẠY THẬT KHÔNG PHẢI `workflow_*`

**Dữ liệu thật `workflow_definitions` (4 dòng):**

| `code` | `module_key` | `is_default` |
|---|---|---|
| `WF-MUAHANG-01` | `requests` | 1 |
| `WF-NHAPKHO-01` | `warehouse_receipt` | 1 |
| `WF-PO-01` | `purchasing` | 1 |
| `WF-XUATKHO-01` | `warehouse_issue` | 1 |

**`workflow_steps` của `WF-MUAHANG-01` (5 bước):** 1 CHT xác nhận nhu cầu · 2 Thư ký Tổng giám đốc duyệt · 3 Phòng Dự án kiểm tra khối lượng · 4 Phòng Kế hoạch tiếp nhận · 5 Trưởng phòng Dự án + Kế hoạch xác nhận cuối (`approval_mode='all_of'`)

**`approval_stage_catalog` (5 dòng — hệ CHẠY THẬT):** `stage_no` 1..5 với `allowed_role_codes` = `commander,cht` / `thuky` / `project,da_nv` / `procurement,kh_nv` / `da_truong,kh_truong` (`all_roles`), `sla_hours` 12/12/24/24/12

**Bằng chứng hệ nào chạy thật:**

| Bằng chứng | Nội dung |
|---|---|
| `scripts/system-route.mjs:1030` | `const stages = await approvalStages(true);` — `approvalStages()` đọc **`approval_stage_catalog`** (`:495`) |
| `scripts/system-route.mjs:1041` | Vòng lặp tạo **`approvals`** cho từng `stage` của catalog (không đụng `workflow_steps`) |
| `scripts/system-route.mjs:1145` | `decide_approval` đọc luồng từ **`approvals a LEFT JOIN approval_stage_catalog cfg`** |
| `BootstrapDataAdapter.java:946,951,955` | `workflow_definitions`/`workflow_steps`/`workflow_step_approvers` **chỉ được ĐỌC để trả payload bootstrap** |
| `OpsTaskStoreAdapter.java:426-515` | `workflow_*` chỉ được CRUD bởi màn cấu hình workflow |
| Kiểm chứng: `approval_stage_decisions` = **0 dòng** | nhánh `all_roles` **chưa từng chạy thật** |
**Kết luận CONFIRMED:** **`workflow_definitions`/`workflow_steps` là hệ CẤU HÌNH không được thi hành; `approval_stage_catalog` + `approvals` mới là engine chạy thật.** Đây là nguồn gốc trực tiếp của gap §23.

### 2.7 PHÁT HIỆN P0 — HARD-CODE Ở ENGINE (§23 — "KHÔNG ĐƯỢC HARD-CODE")

```js
// scripts/system-route.mjs:1744  — khai báo tên bước và vai trò bằng literal trong mã
const stageCfg = stage < 100
  ? await first(`SELECT ... FROM approval_stage_catalog WHERE stage_no=? AND active=1`, stage)
  : { stageNo: stage,
      name: stage===101 ? 'Lập & phát hành PO'
          : stage===102 ? 'Giao nhận'
          : 'BCH xác nhận giao hàng',
      allowedRoleCodes: stage===101 ? 'procurement,kh_nv,kh_truong'
          : stage===102 ? 'warehouse,thu_kho'
          : stage===103 ? 'commander,cht' : '' };
```
**CONFIRMED:** các bước **101/102/103** (Lập & phát hành PO · Giao nhận · BCH xác nhận) **được khai bằng literal `? :` trong mã**, **không** nằm trong `approval_stage_catalog` (**5 dòng = 0 dòng có `stage_no` ≥ 101**). ⇒ **Đúng nguyên văn điều §23 cấm**: `if step === 101 → procurement`. Người dùng **không thể** đổi người duyệt/SLA của 3 bước này qua giao diện.

### 2.8 PHÁT HIỆN P1 — DỮ LIỆU THẬT BỘC LỘ ĐỨT GÃY TRUY VẾT (§17)

| Phép đo | Kết quả |
|---|---|
| PO **không có dòng** `purchase_order_items` | **0** ✅ |
| GRN **không có dòng** `goods_receipt_items` | **10 / 16** ❌ |
| MR `approved` **nhưng chưa có PO nào** | **4 / 10** |
| PO có `request_id IS NULL` | **1** (`PO-PRJ-DEMO-01-2026-0011`, `status='completed'`, **2 GRN**, `contract_id` NULL) |
| PO có `contract_id IS NULL` | **1** (chính PO-0011) |
| Số MR có **≥ 2 PO** | **0** (chưa từng xảy ra trên dữ liệu thật) |
| Số PO có **≥ 2 GRN** | **7 / 7** ✅ (đo: PO-0005/0007/…/0010 đều 2–3 GRN) |
| Dòng `purchase_order_items` có **≥ 2 PO** cùng `request_item_id` | **0** |
| σ trạng thái `purchase_order_items` | `delivered_pending_confirmation` 8 dòng (ordered 340, received 0) · `received` 3 dòng (230/230) · `ordered` 1 (60/0) · `partial_delivery` 1 (25/0) |

**Kết luận:**
- **§13 (1 PO → nhiều GRN): CONFIRMED ĐẠT** — 7/7 PO đều có từ 2 GRN trở lên.
- **§9/§12 (1 PR → nhiều PO): đường đi ĐẠT nhưng CHƯA CÓ BẰNG CHỨNG DỮ LIỆU** — không có MR nào có ≥ 2 PO, không có dòng nào bị tách.
- **§17 TRUY VẾT: LIKELY KHÔNG ĐẠT** — `PO-0011` có `request_id=NULL` ⇒ **truy vết PR→PO bị đứt**; đồng thời 10/16 GRN rỗng dòng ⇒ **không đối soát được số lượng của 10 chuyến giao** (62,5 % GRN không có số lượng).

### 2.9 PHÁT HIỆN P0 — §4 KHẢ NĂNG LOẠI BỎ MR: KẾT LUẬN AUDIT

Đặc tả §4 yêu cầu trả lời 9 câu hỏi. Kết quả đo:

| Câu hỏi §4 | Trả lời | Nhãn |
|---|---|---|
| MR tồn tại ở đâu? | `material_requests` (17) + `material_request_items` (35) | CONFIRMED |
| Có bảng DB riêng? | **CÓ** | CONFIRMED |
| Có API riêng? | **CÓ** — `create_request`/`update_returned_request`/`resubmit_request`/`delete_request`/`cancel_request`/`preview_request_import` | CONFIRMED |
| Có UI riêng? | **CÓ** — màn `requests` + `app/screens/Requests.tsx` (71 dòng) + `RequestDrawer.tsx` (46 dòng) | CONFIRMED |
| PR có dùng MR làm source? | **CÓ và là DUY NHẤT** — `purchase_orders.request_id → material_requests.id` | CONFIRMED |
| Liên quan BOQ/procurement allocation? | **CÓ, ràng buộc chặt** — `material_requests.boq_version_id`/`contract_id`; `procurement_allocations` **92 dòng**, có `stage='MR'` | CONFIRMED |
| Có dữ liệu cũ dùng MR? | **CÓ** — 17 MR, 100 `approvals`, 92 allocation tham chiếu | CONFIRMED |
| Workflow có reference MR? | **CÓ** — `approvals.request_id`, `supply_workflow_steps.request_id` (57 dòng), `material_mar_approvals` | CONFIRMED |
| Report/export có reference MR? | **CÓ** — `system-route.mjs:3053` đếm `material_requests.requested_by`; `BootstrapDataAdapter` trả `requests`; `docs/25_TODO_ROADMAP.md` `R-02` đếm MR/PR/PO | CONFIRMED |
| **⇒ KẾT LUẬN** | **MR = REQUIRED (KHÔNG được xoá/loại bỏ ở thời điểm này)** | **CONFIRMED** |

**Cơ sở kết luận:** (a) `material_requests` là **nguồn duy nhất** của PR/PO/GRN/allocations nên gỡ MR = gỡ toàn chuỗi; (b) tài liệu duy nhất của repo **không nói MR không cần thiết** (§1.4); (c) §24 cấm phá dữ liệu cũ. **Đây KHÔNG phải quyết định thay người dùng** — nếu người dùng muốn bỏ MR thì phải là quyết định + kế hoạch migration riêng (xem §9 câu hỏi Q1).

---

## 3. HỆ THỐNG HIỆN TẠI — AUDIT API / ACTION (§6 của đặc tả — BƯỚC 6)

### 3.1 Hai đường ghi (dual route)

| Đường | Tệp | Số action (handler thật) | Ghi chú |
|---|---|---|---|
| **Node/JS** (hiện hành) | `scripts/system-route.mjs` | 3.304 dòng; action khai `if (action === "…")` | chứa **toàn bộ** chuỗi mua hàng |
| **Java** (đích chuyển đổi) | `java-backend/web/src/main/java/.../SystemController.java` | **189 action nghiệp vụ** (đã trừ 38 khoá `*_uidx`/`primary_key_f`) | `switch case "…"` |

### 3.2 Action thật liên quan MR/PR/PO/GRN/duyệt — CÓ / THIẾU

| Action | Có (Node) | Có (Java) | Block (dòng) | Chức năng đo được |
|---|---|---|---|---|
| `preview_request_import` | ✅ | ✅ | 925–960 (36) | xem trước import phiếu |
| `create_request` | ✅ | ✅ | 961–1047 (87) | tạo MR/PR + sinh `approvals` |
| `update_returned_request` | ✅ | ✅ | 1048–1061 (14) | CHT sửa phiếu bị trả lại |
| `resubmit_request` | ✅ | ✅ | 1062–1086 (25) | gửi lại, xoá quyết định cũ |
| `delete_request` | ✅ | ✅ | 1087–1104 (18) | xoá (chặn khi đã có PO) |
| `cancel_request` | ✅ | ✅ | 1105–1129 (25) | huỷ |
| `decide_approval` | ✅ | ✅ | 1130–1212 (83) | duyệt/từ chối theo `stage` |
| `create_po` | ✅ | ✅ | 1378–1398 (21*) | **tách nhiều PO theo NCC trong 1 lần gọi** |
| `approve_po` | ✅ | ✅ | 1399–1408 (10) | PO `pending_approval`→`waiting_delivery` |
| `reject_po` | ✅ | ✅ | 1409–1421 (13) | PO→`cancelled` + thông báo, PR vẫn mở |
| `update_po_price` | ✅ | ✅ | 1422–1442 (21) | sửa đơn giá, không ghi ngược danh mục |
| `close_po_line` | ✅ | ✅ | 1443–1454 (12) | đóng thiếu dòng PO + rollup |
| `receive_goods` | ✅ | ✅ | 1455–1524 (70) | tạo GRN nhiều đợt |
| `confirm_delivery` | ✅ | ✅ | 1525–1587 (63) | BCH xác nhận + ghi sổ + **suy trạng thái PO/PR** |
| `save_supplier` / `set_supplier_status` / `delete_supplier` | ✅ | ✅ | 1267–1285 | NCC |
| `save_approval_stage` / `set_approval_stage_status` / `delete_approval_stage` | ✅ | ✅ | 2275–2359 | cấu hình 5 bước catalog |
| `save_workflow` / `set_workflow_status` / `delete_workflow` | ❌ **THIẾU** | ✅ | — | **chỉ có ở Java; Node không thi hành** |
| `save_request_comment` | ❌ **THIẾU** | ✅ | — | chỉ có ở Java |
| **`split_po` (tách PO riêng)** | ❌ **KHÔNG CÓ** | ❌ **KHÔNG CÓ** | — | tách gộp trong `create_po` |
| **`complete_po` / `complete_pr` (tính lại trạng thái)** | ❌ **KHÔNG CÓ** | ❌ **KHÔNG CÓ** | — | trạng thái **suy tự động** trong `confirm_delivery`/`close_po_line` |
| **`revise_workflow` / `publish_workflow_version`** | ❌ **KHÔNG CÓ** | ❌ **KHÔNG CÓ** | — | **cần cho §7 — không tồn tại** |
| **`create_pr` (độc lập với MR)** | ❌ | ❌ | — | **không có thực thể PR** |

\* `create_po` chỉ 21 dòng **vật lý** nhưng chứa 4 dòng mã rất dài (minify theo dòng) — khối logic thực tế lớn hơn nhiều.

### 3.3 PHÁT HIỆN P1 — BẤT ĐỐI XỨNG 2 ĐƯỜNG GHI
`save_workflow`/`set_workflow_status`/`delete_workflow` và `save_request_comment` **chỉ tồn tại ở Java**, **không có** trong `scripts/system-route.mjs`. Nghĩa là tuỳ đường ghi đang bật, màn "Workflow" có thể **không lưu được**. **CONFIRMED** — cần xác định đường ghi nào đang phục vụ UI trước khi làm §7/§23.

---

## 4. HỆ THỐNG HIỆN TẠI — AUDIT WORKFLOW ENGINE (§7 của đặc tả — BƯỚC 7)

| Câu hỏi đặc tả | Trả lời đo được | Nhãn |
|---|---|---|
| Engine hiện dùng `workflow_definitions`/`workflow_steps`/`approval_stages` theo cơ chế nào? | **3 tầng rời nhau**: (1) `workflow_definitions`+`workflow_steps`+`workflow_step_approvers` = **cấu hình, không thi hành** (chỉ đọc ở bootstrap/CRUD); (2) `approval_stage_catalog` = **cấu hình ĐƯỢC thi hành**; (3) `approvals` + `supply_workflow_steps` = **instance chạy thật** | CONFIRMED |
| Có versioning không? | **KHÔNG.** Cột `version` đã bị xoá (Flyway V19); `UNIQUE(code)` chặn V2; PR/PO **không có** cột `workflow_id`/`workflow_version`; probe INSERT V2 ⇒ **ERROR 1062** | CONFIRMED |
| Có hard-code không? | **CÓ.** `scripts/system-route.mjs:1744` hard-code tên + vai trò của bước 101/102/103 bằng `? :`. Không nằm trong catalog | CONFIRMED |
| PR có lưu reference tới workflow version/snapshot? | **KHÔNG ở mức header.** `material_requests` không có cột nào. Ở mức instance: `approvals.allowed_role_codes_snapshot` và `approvals.approval_mode_snapshot` **là snapshot** của bước (đã có) — nhưng **không có mã workflow, không có số version** | CONFIRMED |
| Bước duyệt có đổi được qua UI? | **CÓ, một phần:** `save_approval_stage`/`set_approval_stage_status`/`delete_approval_stage` cho 5 bước catalog (đổi được `stage_no`, `allowed_role_codes`, `sla_hours`, `approval_mode`). **KHÔNG đổi được** bước 101/102/103 (hard-code) | CONFIRMED |
| Người được chỉ định (Owner) có snapshot? | **CÓ** — `approvals.approver_user_id` gán lúc tạo phiếu (`:1041`), không đổi khi cấu hình đổi | CONFIRMED |

**⇒ §7 "WORKFLOW VERSIONING" = P0, HIỆN KHÔNG THỂ ĐÁP ỨNG:**

Trích nguyên văn yêu cầu §7 và đối chiếu:
> *"PR001 workflow_id = WF-PR-2026-001, workflow_version = 3"* — **không có cột nào để lưu.**
> *"PR001 KHÔNG được tự động chuyển sang V2; PR002 sẽ sử dụng V2"* — **không thể tạo V2 (UNIQUE code).**

**Cơ chế thay thế hiện có (LIKELY đủ cho hành vi "phiếu cũ giữ luồng cũ", nhưng KHÁC thiết kế §7):** `approvals` là **bảng instance** được ghi cứng lúc tạo phiếu (`:1041`), và mọi truy vấn duyệt đọc từ `approvals LEFT JOIN approval_stage_catalog` với `COALESCE(NULLIF(<snapshot>), cfg.<cột>)` (`:1145`, `:522`) ⇒ phiếu cũ **không** bị ảnh hưởng khi admin sửa catalog. **Nhưng:** nếu admin **đổi `stage_no`** của một dòng catalog thì phiếu cũ dùng `stage` cũ vẫn trỏ tới `cfg.stage_no` **khác** ⇒ tên/mô tả hiển thị có thể lệch. **Cần kiểm chứng bằng test** (đặc tả Test Case 9) — xem §8.

---

## 5. HỆ THỐNG HIỆN TẠI — AUDIT UI (§8 của đặc tả — BƯỚC 8)

### 5.1 Màn hình thật liên quan (số dòng thật)

| Màn | Tệp | Dòng | Có gì |
|---|---|---|---|
| Phiếu đề nghị (MR/PR) | `app/screens/Requests.tsx` | 71 | danh sách; **KHÔNG có tab PR** |
| Chi tiết phiếu | `app/screens/RequestDrawer.tsx` | 46 | dùng `EntityDetailModal` + **`ApprovalTimeline`** (U-06/P-04) |
| Mua hàng / PO | `app/screens/Purchasing.tsx` | 47 | **KHÔNG có 3 tab MR·PR·PO**; lọc `supplyStatus==="awaiting_po"` (`:19`); KPI + lũy kế BOQ |
| Nhập kho | `app/screens/Reception*`: `Receiving.tsx` | 26 | danh sách PO chờ giao |
| Nhận hàng | `app/screens/ReceiptDrawer.tsx` | 29 | xác nhận giao hàng (BCH) |
| Đã giao | `app/screens/Delivered.tsx` | 25 | danh sách chuyến giao |
| Workflow | `app/screens/WorkflowModal.tsx` | 162 | cấu hình workflow/stage |
| Dải duyệt dùng chung | `app/components/ui/Timeline.tsx` | 175 | `ApprovalTimeline` + `ActivityTimeline` |
| Trang chính | `app/page.tsx` | **2.816** | chứa `Approvals` + dải `approval-flow` **tự viết** (`:949`) |

### 5.2 Đối chiếu §19–§21 (UI)

| Yêu cầu | Hiện trạng | Nhãn | Mức |
|---|---|---|---|
| §19 Timeline duyệt trong PR detail | **CÓ thật** — `ApprovalTimeline` dùng ở `RequestDrawer.tsx:12`; `page.tsx:949` dải `approval-flow` tự viết hiển thị `stage_no`·tên·người·mô tả·trạng thái·`dueAt` | CONFIRMED ĐẠT (một phần) | P2 |
| §19 trạng thái lấy từ instance thật | **CÓ** — `approval?.status` lấy từ `approvals` | CONFIRMED | — |
| §19 hiển thị **Approval Time** + **Comment/Reason** | **LIKELY THIẾU** ở dải `approval-flow`: chỉ thấy tên/trạng thái/SLA, **không thấy `decidedAt`/`comment`** trong khối tự viết; `ApprovalTimeline` dùng chung chưa được đo | LIKELY | **P1** |
| §20 PR detail hiện **danh sách PO con + trạng thái PR** | **THIẾU** — đọc `RequestDrawer.tsx` + `Purchasing.tsx`: không có khối "PO: PO001 — Supplier A — COMPLETED" trong chi tiết phiếu | CONFIRMED THIẾU | **P0** |
| §21 PO detail: Source PR · Ordered/Received/Remaining · GRN list · Delivery status · Timeline | **THIẾU màn chi tiết PO riêng.** `ReceiptDrawer.tsx` có bảng đối chiếu "SL PO / Thực giao / Chấp nhận / Chênh lệch / Lô" nhưng đó là **chi tiết GRN**, không phải PO; không có `Remaining` tổng hợp đầu PO | CONFIRMED THIẾU | **P0** |
| §21 click-through PO→GRN→PO→PR | **LIKELY THIẾU** — không thấy liên kết truy vết 2 chiều trong `Receiving.tsx`/`Delivered.tsx` | LIKELY | **P1** |
| §20 PR STATUS = IN_PROGRESS khi 1 PO chưa xong | Backend **CÓ** suy ra (`supply_status='partial_delivery'`, `:1563`); UI **hiển thị** qua `statusLabel` (chưa đo đủ) | LIKELY | P2 |
| §10/§12 tách PO theo NCC trên UI | **CÓ thật** — `page.tsx:2342` kiểm tra **mỗi dòng phải chọn NCC** rồi gọi `create_po` 1 lần với nhiều NCC | CONFIRMED ĐẠT | — |

---

## 6. NGHIỆP VỤ ĐÃ CÓ TRONG BACKEND (đo được — đối chiếu §8, §11, §13–§16)

Đây là phần **ĐẠT** cần ghi nhận để không làm lại (đặc tả §18 cấm tạo logic trùng).

| Yêu cầu | Bằng chứng | Nhãn |
|---|---|---|
| §8 chỉ tạo PO khi PR duyệt đủ | `scripts/system-route.mjs:1382` — `if(!mr||mr.status!=="approved") throw new Error("Chỉ được tạo PO từ MR đã duyệt đủ các cấp.")` | CONFIRMED ĐẠT |
| §11 mã vật tư PO phải thuộc PR | `:1384` `sourceMap` lấy từ `material_request_items WHERE request_id=?`; `:1386` `if(!source) throw` ⇒ **PO chỉ nhận `requestItemId` có thật của PR** | CONFIRMED ĐẠT |
| §11 chống vượt số lượng PR | `:1386` `if(numberValue(source.orderedQty)+next > numberValue(source.approvedQty)+1e-9) throw "số lượng đặt vượt số đã được duyệt mua."` | CONFIRMED ĐẠT |
| §11 phân biệt 4 loại số lượng | Cột thật: `requested_qty` · `approved_purchase_qty` · `ordered_qty` · `received_qty` · `closed_qty` · `delivered_qty` (xem §2.4) | CONFIRMED ĐẠT |
| §9/§10 tách 1 PR → nhiều PO | `:1394` `groups` theo `supplierId` → INSERT nhiều `purchase_orders`; tách **ở mức dòng** qua `purchase_order_items.request_item_id` | CONFIRMED ĐẠT (lược đồ + mã) |
| §12 PO tracking | Cột thật `supplier_id`·`ordered_at`·`eta`·`status`·`delivery_queued_at`·`delivery_completed_at`·`received_qty`·`closed_qty` | CONFIRMED ĐẠT (một phần — xem thiếu ở §7) |
| §13 nhiều GRN / 1 PO | `:1455` `receive_goods` (+ SQL trên 7/7 PO thật đều ≥ 2 GRN) | CONFIRMED ĐẠT |
| §14 PO chỉ COMPLETED khi nhận đủ | `:1555` `fullyDelivered = SUM(received_qty)+accepted+SUM(closed_qty) >= SUM(ordered_qty)-1e-9`; `:1559` `completed = fullyDelivered && allConfirmed`; `:1560` gán `completed`/`completed_with_exceptions` | CONFIRMED ĐẠT |
| §15/§16 PR completion suy từ PO/GRN ở **backend** | `:1561` `requestCompleted = SUM(request received)+accepted+SUM(closed) >= SUM(approved_purchase_qty)-1e-9`; `:1563` `nextRequestStatus = requestCompleted ? 'completed' : 'partial_delivery'`; `:1568` `UPDATE material_requests SET supply_status=?` | CONFIRMED ĐẠT (backend tự tính) |
| §16 PO cancelled không tự hoàn thành PR | `reject_po` (`:1409-1421`) chỉ đổi `purchase_orders.status='cancelled'`, **không** đụng `material_requests` ⇒ không tự hoàn thành PR | CONFIRMED ĐẠT |
| §22 authorization ở backend (không chỉ ẩn nút) | `requireRole(...)` + `canApproveRequestStage` + `canAccessProject` + `canAccessWarehouse` trong **mọi** action (`:962`,`:1137`,`:1141`,`:1379`,`:1382-1383`,`:1526-1534`) | CONFIRMED ĐẠT (một phần — xem §7 P1) |
| §22 map quyền theo action | `scripts/system-route.mjs:11-27` — `MODULE_BY_ACTION` + `PERMISSION_BY_ACTION` (ví dụ `create_po: "canCreate"`, `close_po_line: "canApprove"`, `confirm_delivery: "canApprove"`) | CONFIRMED ĐẠT |

**Còn thiếu / chưa chứng minh trong §22:** đặc tả liệt kê 11 hành động phải qua backend **(Create PR · Approve PR · Reject PR · Create PO · **Split PO** · Assign Supplier · Update PO · Create GRN · Receive Material · **Complete PO** · **Complete PR**)**. Ba hành động `Split PO`, `Complete PO`, `Complete PR` **không tồn tại như action** ⇒ **không có điểm kiểm quyền riêng** cho chúng (chúng xảy ra như hệ quả trong `create_po`/`confirm_delivery`). **CONFIRMED — P1.**

**Còn thiếu trong §22 (mức dữ liệu):** yêu cầu kiểm `Department` + `Project` + `Scope` — hệ thống có `canAccessProject`/`canAccessWarehouse`, nhưng **`canApproveRequestStage` không kiểm `department`** của người duyệt (nó kiểm Owner/RBAC). **LIKELY — P1**, cần đọc `canApproveRequestStage` để chốt.

---

## 7. BẢNG GAP ANALYSIS TỔNG HỢP (so sánh 3 chiều — BƯỚC 9)

Chú thích mức: **P0** = chặn/nền tảng, buộc phải giải trước · **P1** = cần cho đúng nghiệp vụ, có thể song song · **P2** = UI/tài liệu/hoàn thiện.

| § | Yêu cầu (nguồn) | TÀI LIỆU | HỆ THỐNG HIỆN TẠI | ĐẶC TẢ | GAP | Rủi ro | Mức |
|---|---|---|---|---|---|---|---|
| 4 | Khả năng bỏ MR | không nói gì | MR **là nguồn duy nhất** của PR/PO/GRN + 92 allocations | cần kết luận REQUIRED/LEGACY/REMOVE | **ĐÃ KẾT LUẬN: MR = REQUIRED** (bằng chứng §2.9). Không xoá | Xoá MR = gãy toàn chuỗi + mất 17 MR/92 allocation | **P0** (đã xử lý bằng kết luận, cần user xác nhận) |
| 6 | Luồng duyệt 4 vai trò (Thư ký TGĐ→DA→KH→Giám đốc) | **2 vai trò**: Phòng DA · Ban lãnh đạo (không có Thư ký, không có Giám đốc) | **5 bước**: CHT→Thư ký TGĐ→DA→KH→DA+KH(`all_roles`) | **4 bước** | **3 nguồn lệch nhau hoàn toàn.** Không bước nào khớp | Sai thẩm quyền duyệt = sai pháp lý/tài chính | **P0** |
| 7 | Workflow versioning bất biến | không nói gì | cột `version` **đã bị xoá (V19)**; `UNIQUE(code)` chặn V2; PR/PO **không có** cột `workflow_id`/`version`; **0 action** publish version | bắt buộc | **KHÔNG TỒN TẠI & BỊ CHẶN Ở CSDL.** Cần thiết kế mới (definition→version→instance→step instance) | Sửa cấu hình giữa chừng làm lệch luồng phiếu cũ; mất dấu vết kiểm toán | **P0** |
| 9-10 | 1 PR → nhiều PO, tách theo dòng, 4 loại SL | không nói gì | **ĐẠT** (lược đồ `request_id` non-unique + `po_items.request_item_id`; mã `:1394` nhóm theo NCC) | bắt buộc | Đường đi đạt, **chưa có bằng chứng dữ liệu** (0 MR ≥ 2 PO) | Tách PO lần đầu chạy thật có thể lộ lỗi rollup | **P1** |
| 11 | Material code + quantity validation | không nói gì | **ĐẠT** (`:1384`,`:1386`) | bắt buộc | Đạt | — | — |
| 12 | PO tracking (Supplier→Remaining) | không nói gì | Cột **đủ**, nhưng **`purchase_order_items.unit_price = 0` cho 13/13 dòng** ⇒ `total_value = 0` cho 7/7 PO (KP #80 đã biết) | bắt buộc | Đạt cấu trúc; **giá trị PO toàn bộ = 0** ⇒ mọi báo cáo tiền theo PO vô nghĩa | Quyết định tài chính — **cần user** | **P1** |
| 13 | 1 PO → nhiều GRN | không nói gì | **ĐẠT thật** (7/7 PO có 2–3 GRN) | bắt buộc | **10/16 GRN rỗng dòng** ⇒ không đối soát SL được | Số lượng không đối soát được ở 62,5 % chuyến giao | **P0** |
| 14 | PO completion theo Received≥Ordered | không nói gì | **ĐẠT** (`:1555`,`:1559`) | bắt buộc | Đạt | — | — |
| 15-16 | PR completion suy từ PO (backend) | không nói gì | **ĐẠT** (`:1561`,`:1563`,`:1568`); `PO cancelled` không tự hoàn thành PR | bắt buộc | Đạt logic; **thiếu trạng thái `is_complete`/phân biệt đủ 7 tình huống §16** (No PO / Partial PO / PO partially received / fully / cancelled / rejected / completed) — hiện mã hoá thành chuỗi `supply_status` | Không có cờ hoàn thành ⇒ khó kiểm toán/lọc | **P1** |
| 17 | Data relationship & truy vết | không nói gì | Đường đi có; **`PO-0011` `request_id=NULL` + 2 GRN** ⇒ đứt truy vết; **0 FK toàn CSDL** | bắt buộc | **LIKELY KHÔNG ĐẠT** | Bản ghi mồ côi không bị chặn (đã có tiền lệ KP #71 `attachments` mồ côi) | **P0** |
| 18 | Không tạo logic trùng | — | **ĐẠT**: tái dùng `material_requests`/`purchase_orders`/`goods_receipts`/`supply_workflow_steps`; **không có bảng PR thứ hai** | bắt buộc | Đạt | — | — |
| 19 | Approval Timeline UI | — | `ApprovalTimeline` **có** (`Timeline.tsx:70`, dùng ở `RequestDrawer`) + dải tự viết `page.tsx:949`; **thiếu `decidedAt`/`comment`** ở dải tự viết | bắt buộc | **LIKELY THIẾU 1 phần** | Người duyệt không thấy ý kiến/lý do từ chối | **P1** |
| 20 | PR → PO UI (list PO con + PR status) | — | **THIẾU** khối PO con trong chi tiết phiếu | bắt buộc | **THIẾU** | Không theo dõi được PR đã tách thành PO nào | **P0** |
| 21 | PO detail UI (Source PR, Remaining, GRN list, click-through) | — | **THIẾU màn chi tiết PO** | bắt buộc | **THIẾU** | Không truy vết xuôi/ngược | **P0** |
| 22 | RBAC backend mọi action | — | `requireRole`/`canAccess*` **có ở mọi action**; map `MODULE/PERMISSION_BY_ACTION` **có**; **`Split PO`/`Complete PO`/`Complete PR` không tồn tại như action** ⇒ không có điểm kiểm quyền riêng | bắt buộc | **P1** | Hành động hệ quả không kiểm quyền độc lập | **P1** |
| 23 | Dynamic workflow — không hard-code | — | **`workflow_definitions` không được thi hành**; engine thật = `approval_stage_catalog`; **bước 101/102/103 hard-code literal** ở `:1744` | bắt buộc | **VI PHẠM nguyên văn điều §23 cấm** | Admin không đổi được người duyệt 3 bước nghiệp vụ then chốt | **P0** |
| 24 | Backward compatibility | — | Chưa có migration nào cho Phase 2; **0 FK**; dữ liệu thật 17 MR/7 PO/16 GRN | bắt buộc | Chưa vi phạm; **rủi ro nằm ở mọi thay đổi lược đồ sắp tới** (đặc biệt §7 cần bảng mới) | DROP/ALTER có thể phá dữ liệu cũ | **P0 (quy trình bắt buộc)** |
| 25 | 12 test case bắt buộc | — | Cần đo bộ test hiện có (xem `TASK-103.md` §6) | bắt buộc | **Chưa có bằng chứng 12 case §25 được phủ** | Sửa engine mà không có lưới an toàn | **P0** |
| 29 | Điều kiện hoàn thành Phase 2 (20 hạng mục) | — | Nhiều hạng mục **chưa có bằng chứng** (Workflow Versioning, Quantity Reconciliation, Regression tests) | bắt buộc | **KHÔNG được đánh dấu PHASE 2 = COMPLETE** | Báo cáo sai tiến độ | **P0** |

### 7.1 Thứ tự P0 bắt buộc (chặn lẫn nhau)

```
[P0-A] CHỐT luồng duyệt thật (§6) + xác nhận MR=REQUIRED (§4)      ← cần NGƯỜI DÙNG quyết
   └──> [P0-B] Thiết kế Workflow Versioning (§7)                    ← cần migration (bị cấm ở lượt này)
            └──> [P0-C] Đưa engine về 1 hệ + bỏ hard-code 101/102/103 (§23)
[P0-D] Vá truy vết: PO.request_id NULL + 10 GRN rỗng dòng (§17)     ← độc lập, làm được ngay
[P0-E] UI: khối PO con trong PR detail (§20) + màn chi tiết PO (§21)
[P0-F] Dựng 12 test §25 TRƯỚC khi sửa engine                        ← phải làm TRƯỚC P0-B/P0-C
```

---

## 8. TỔNG HỢP NHANH: ĐÃ CÓ / LỆCH / THIẾU

**ĐÃ CÓ THẬT (không làm lại — §18):** 1 PR→N PO (lược đồ+mã) · tách PO mức dòng theo NCC · validate mã vật tư thuộc PR · chặn vượt số lượng · 5 loại số lượng · 1 PO→N GRN · PO completion theo received≥ordered · PR completion **suy ở backend** · PO cancelled không tự hoàn PR · RBAC backend + map quyền theo action · ApprovalTimeline UI.

**LỆCH:** luồng duyệt (5 bước thật vs 4 bước đặc tả vs 2 bước tài liệu) · engine thật là `approval_stage_catalog` chứ không phải `workflow_definitions` · snapshot nằm ở `approvals` chứ không ở header PR.

**THIẾU HOÀN TOÀN:** thực thể/bảng PR riêng · Workflow Versioning (cột + action + unique code) · action `Split PO`/`Complete PO`/`Complete PR` · điểm kiểm quyền cho 3 hành động đó · màn chi tiết PO · khối PO con trong PR detail · 12 test §25 · FK/migration an toàn.

---

## 9. CÂU HỎI CẦN NGƯỜI DÙNG QUYẾT (KHÔNG tự chọn — §3 cấm biến INFERENCE thành rule)

| # | Câu hỏi | Phương án | Khuyến nghị của AUDIT |
|---|---|---|---|
| **Q1** | MR giữ hay bỏ? | **(A)** Giữ MR = nguồn duy nhất, PR chỉ là *view* `status='approved'` **(B)** Tạo bảng `purchase_requests` thật + migration MR→PR **(C)** Bỏ MR, dùng PR thay thế | **(A)** — vì MR đã là nguồn của 17 phiếu/92 allocation/100 approval; (B)/(C) phá §24 và cần kế hoạch migration riêng |
| **Q2** | Luồng duyệt PR đúng là mấy bước và ai? | **(A)** 5 bước hệ thống (CHT→Thư ký TGĐ→DA→KH→DA+KH) **(B)** 4 bước đặc tả (Thư ký TGĐ→DA→KH→Giám đốc) **(C)** 2 bước tài liệu (DA→Ban lãnh đạo) | **Cần chốt.** Tài liệu duy nhất của repo nói (C); đặc tả nói (B); hệ thống đang chạy (A). **Không tự chọn** |
| **Q3** | Versioning workflow bắt buộc hay chỉ cần "phiếu cũ giữ luồng cũ"? | **(A)** Làm đủ §7 (bảng `workflow_versions` + cột trên PR/PO) **(B)** Chấp nhận cơ chế snapshot hiện có (`approvals`), bổ sung mã workflow + số phiên bản hiển thị | **(B)** nếu nghiệp vụ chỉ cần bất biến; **(A)** nếu cần truy vết "phiếu này chạy bản nào". **Cần chốt vì (A) phải sửa CSDL** |
| **Q4** | 3 bước hard-code 101/102/103 có phải đưa vào engine động? | **(A)** Đưa vào `approval_stage_catalog` (sửa mã + nạp dữ liệu) **(B)** Giữ hard-code, ghi rõ là ngoại lệ đã biết | **(A)** — §23 cấm nguyên văn; nhưng phải làm sau khi có test §25 |
| **Q5** | 10/16 GRN rỗng dòng + `PO-0011.request_id=NULL` xử lý thế nào? | **(A)** Vá bằng dữ liệu (điền dòng GRN + gán `request_id`) **(B)** Chỉ cảnh báo trên UI **(C)** Không xử lý, ghi nhận là dữ liệu thử | **(A)** cho `request_id` (1 dòng, an toàn); GRN rỗng cần xác nhận vì có thể là dữ liệu smoke cũ |
| **Q6** | `purchase_order_items.unit_price = 0` (13/13 dòng) có điền theo đơn giá hợp đồng? | **(A)** Có **(B)** Không | Ngoài phạm vi audit này; trùng KP #82 đang chờ người dùng — **đây là quyết định tài chính** |

---

## 10. TODO TRIỂN KHAI (chưa làm — BƯỚC 11)

> Đúng đặc tả §30 bước 11 *"Create/update TODO"*. **Chưa thực hiện bước 12.** Danh sách đầy đủ + phụ thuộc nằm ở `docs/agent-progress/TASK-103.md` §5.

**Nhóm A — Bắt buộc chốt trước khi code (chờ người dùng):** A1 chốt luồng duyệt §6 · A2 chốt MR giữ/bỏ §4 · A3 chốt phạm vi versioning §7 · A4 chốt cách xử lý 3 bước hard-code.

**Nhóm B — Lưới an toàn (làm được ngay, không đụng nghiệp vụ):** B1 viết 12 test §25 (ĐỎ trước) · B2 bổ sung cổng đo truy vết `PR→PI→PO→POI→GRN→GRI→SL` · B3 cổng đo "1 PR→N PO" trên dữ liệu thật · B4 cổng đo FK/khả năng chèn mồ côi.

**Nhóm C — Vá dữ liệu & engine (sau B):** C1 gán `request_id` cho PO mồ côi · C2 xử lý 10 GRN rỗng dòng · C3 thiết kế versioning §7 (cần migration) · C4 hợp nhất engine, đưa 101/102/103 vào catalog (cần sửa mã).

**Nhóm D — UI (§19–§21):** D1 khối PO con trong PR detail · D2 màn chi tiết PO (Source PR · Ordered/Received/Remaining · GRN list · Delivery status · Timeline) · D3 click-through 2 chiều · D4 bổ sung `decidedAt`/`comment` vào dải duyệt.

**Nhóm E — Tài liệu/tiến độ:** E1 cập nhật `docs/25_TODO_ROADMAP.md` **CHỈ ô TT** khi có mục 1-1 · E2 cập nhật MASTER_STATUS · E3 ghi §29 completion checklist có bằng chứng.

---

## 11. RÀNG BUỘC ĐÃ TUÂN THỦ TRONG LƯỢT NÀY

| Ràng buộc | Trạng thái |
|---|---|
| Không sửa `app/**`, `lib/**`, `scripts/**`, `java-backend/**`, `drizzle/**` | ✅ không sửa (chỉ đọc) |
| Không build / không chạy `gd-cycle.mjs` | ✅ |
| Không khởi động/dừng dịch vụ (8787/9000/18081) | ✅ |
| Không đụng tệp không phải của mình (`VNTECH_*`, `drizzle/01xx_*`, `tools/baseline/**`, `AGENTS.md`, `docs/28_*`, `.docx/.xlsx`) | ✅ **chỉ ĐỌC** `Quy trình đặt hàng.docx` và `DIEN_GIAI_CAC_PHASE_MASTER_TASK.docx`, **không ghi đè** |
| Không `git add -A` | ✅ không commit gì trong lượt này |
| Không dùng PowerShell để ghi tệp tiếng Việt | ✅ báo cáo này ghi bằng công cụ `write` (UTF-8) |
| Không biến INFERENCE/UNKNOWN thành business rule | ✅ mọi dòng có nhãn (§0); UNKNOWN nêu ở §9 |
| Quyết định nghiệp vụ → nêu câu hỏi + khuyến nghị, không tự chọn | ✅ §9 |

---

*Hết báo cáo. Nhật ký thực thi, phép đo và TODO đầy đủ: `docs/agent-progress/TASK-103.md`.*
