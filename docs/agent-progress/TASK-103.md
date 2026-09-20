# TASK-103 — AUDIT + GAP ANALYSIS PHASE 2 (PR / APPROVAL / PO / GRN)

- **Ngày:** 21/09/2026
- **Loại:** **AUDIT + GAP ANALYSIS** — đúng §30 bước **1 → 11** của `docs/agent-progress/PHASE2-REQUIREMENTS-USER.md`. **Bước 12 (implementation) KHÔNG thực hiện.**
- **Chế độ:** CHỈ ĐỌC + GHI TÀI LIỆU. Không sửa mã · không migration · không build · không dừng/khởi động dịch vụ.
- **Sản phẩm chính:** `docs/agent-progress/PHASE2-GAP-ANALYSIS.md`
- **Nguồn đặc tả:** `docs/agent-progress/PHASE2-REQUIREMENTS-USER.md` (878 dòng, 31 mục)
- **Tiền nhiệm:** `TASK-102` (PHASE 7 — Quản trị). TASK-103 mở mới cho Phase 2 mua hàng.

---

## 1. MỤC TIÊU

Thực thi nguyên văn mục §30 — không code trước khi audit:

| Bước §30 | Nội dung | Trạng thái |
|---|---|---|
| 1 | Find Phase 2 purchase workflow document | ✅ |
| 2 | Read the complete document | ✅ (kể cả text bên trong shape) |
| 3 | Render/analyze images and diagrams | ✅ dựng lại SVG→PNG từ toạ độ; ⚠️ vision bị 429 |
| 4 | Extract documented PR → Approval → PO → GRN flow | ✅ |
| 5 | Audit current MR/PR/PO/GRN database | ✅ MySQL thật |
| 6 | Audit current APIs | ✅ Node + Java |
| 7 | Audit current workflow engine | ✅ |
| 8 | Audit current UI | ✅ |
| 9 | Compare DOCUMENT vs CURRENT SYSTEM vs REQUIREMENT | ✅ bảng 3 chiều |
| 10 | Report the gap analysis | ✅ `PHASE2-GAP-ANALYSIS.md` |
| 11 | Create/update TODO | ✅ tài liệu này §5 |
| **12** | **Then begin implementation** | ❌ **KHÔNG LÀM** (đúng lệnh) |

---

## 2. PHÉP ĐO ĐÃ CHẠY (bằng chứng thô)

### 2.1 Trích tài liệu sơ đồ

```powershell
# Mở OOXML
Copy-Item "docs\Quy trình đặt hàng.docx" "$env:TEMP\qt_dathang.zip" -Force
Expand-Archive ... -DestinationPath $env:TEMP\qt_dathang
# ⇒ word/document.xml 158.218 B ; word/_rels/document.xml.rels KHÔNG có word/media/**
# ⇒ 0 ảnh nhúng ⇒ sơ đồ là DRAWING SHAPE (vector), không phải ảnh
```

| Phép đo | Kết quả |
|---|---|
| `<w:t>` | 32 |
| `<wps:wsp>` | 30 |
| `<mc:AlternateContent>` | 60 |
| `<v:shape>` / `<v:line>` | 14 |
| `word/media/**` | 0 |
| `doc.ComputeStatistics(2)` (số trang) | **1** |

**Bóc text:** đọc `word/document.xml`, lấy mọi `<w:t>` **kể cả trong `wps:txbxContent`** (công cụ trích text thường bỏ sót) ⇒ **32/32 nhãn**, ví dụ: `ĐƠN HÀNG TỪ DỰ ÁN` · `PHÒNG DỰ ÁN KIỂM TRA` · `BAN LÃNH ĐẠO KIỂM TRA` · `PHÒNG KẾ HOẠCH KIỂM TRA ĐẶT HÀNG` · `MUA HÀNG NHÀ CUNG CẤP` · `CẬP NHẬT ĐƠN HÀNG VÀ THEO DÕI` · `BÀN GIAO HỒ SƠ GIẤY TỜ` · `THANH TOÁN` · `ĐẠT` ×6 · `KHÔNG  ĐẠT` ×4.

**Dựng lại sơ đồ để XEM:** bóc `wp:anchor/positionH|positionV/posOffset` + `spPr/xfrm/ext` + `prstGeom/@prst` + `ln/tailEnd` cho cả 30 shape → sinh SVG đúng tỉ lệ `914400 EMU = 96 px` → render **PNG 1400×900** bằng `msedge --headless=new --screenshot`.

### 2.2 Đường đọc tài liệu đã THẤT BẠI (ghi để người sau không mất thời gian)

| Cách | Kết quả |
|---|---|
| `Word COM` → `SaveAs([ref]$pdf,17)` | ❌ `Cannot convert ... to type "Object"` |
| `Word COM` → `SaveAs2($pdf,17)` | ❌ **treo > 120 s** (phải kill `WINWORD`) |
| `Word COM` → `ExportAsFixedFormat(...)` | ❌ **treo > 180 s** (phải kill `WINWORD`) |
| `vision_glance` / `read_image` | ❌ **HTTP 429 rate_limit_exceeded** (2 lần), HTTP 502 |
| **Dựng SVG từ toạ độ + headless Edge screenshot** | ✅ **THÀNH CÔNG** |
| Python / ImageMagick / pdftoppm | ❌ không cài |

> **Đánh giá tác động:** vì sơ đồ **chỉ có chữ trong hộp** (0 ảnh nhúng, 0 hình vẽ biểu tượng), nên **32/32 nhãn đã thu đủ bằng text + hình học** và toạ độ đã kiểm chứng từng nhãn nằm đúng hộp của nó. Lỗi vision **không làm mất thông tin** của tài liệu.

### 2.3 CSDL thật (MySQL 8.0, `vntech_erp`)

```sql
-- Số dòng CHÍNH XÁC (COUNT(*), không dùng table_rows ước lượng)
material_requests 17 · material_request_items 35 · purchase_orders 7 · purchase_order_items 13
goods_receipts 16 · goods_receipt_items 11 · approvals 100 · approval_stage_decisions 0
approval_stage_catalog 5 · supply_workflow_steps 57 · procurement_allocations 92
contract_stock_ledger 25 · stock_movements 5 · document_sequences 18 · attachments 11
workflow_definitions 4 · workflow_steps 11 · workflow_step_approvers 5
suppliers 1 · materials 14 · request_comments 0

-- 0 FK toàn CSDL
SELECT COUNT(*) FROM information_schema.key_column_usage
 WHERE table_schema='vntech_erp' AND referenced_table_name IS NOT NULL;   -- ⇒ 0

-- Không có bảng PR
SELECT COUNT(*) FROM information_schema.tables
 WHERE table_schema='vntech_erp' AND table_name LIKE '%purchase_request%'; -- ⇒ 0

-- Không có cột version nào cho workflow
SELECT table_name,column_name FROM information_schema.columns
 WHERE table_schema='vntech_erp' AND column_name LIKE '%version%';
-- ⇒ chỉ boq_versions.*, flyway_schema_history.version, vntech_product_identity.version,
--    project_archives.schema_version, boq_import_batches.version_no

-- Cột `version` đã bị XOÁ có chủ đích:
SELECT version,description FROM flyway_schema_history WHERE description LIKE '%workflow%';
-- 8 workflow multi · 9 workflow collation fix · 17 workflow dynamic approvals
-- 19 drop workflow definitions version        ← ĐÃ XOÁ CỘT VERSION
```

**PROBE chứng minh versioning bị chặn ở CSDL:**
```sql
INSERT INTO workflow_definitions (id,code,name,...) VALUES ('WF-PROBE-V2','WF-PO-01',...);
-- ⇒ ERROR 1062 (23000): Duplicate entry 'WF-PO-01' for key
--     'workflow_definitions.workflow_definitions_code_uidx'
-- Đo lại: SELECT COUNT(*) FROM workflow_definitions; ⇒ 4 (KHÔNG ghi thêm dòng nào)
```

### 2.4 Phép đo dữ liệu bộc lộ đứt gãy truy vết

| Phép đo | Kết quả |
|---|---|
| PO không có dòng `purchase_order_items` | 0 ✅ |
| **GRN không có dòng `goods_receipt_items`** | **10 / 16** ❌ |
| MR `approved` nhưng chưa có PO | 4 / 10 |
| **PO có `request_id IS NULL`** | **1** (`PO-PRJ-DEMO-01-2026-0011`, `status='completed'`, **2 GRN**, `contract_id` NULL) |
| MR có ≥ 2 PO | **0** (chưa từng xảy ra trên dữ liệu thật) |
| PO có ≥ 2 GRN | **7 / 7** ✅ |
| `purchase_order_items` có unit_price = 0 | **13 / 13** dòng |

**Phân bố trạng thái thật `material_requests`:** `pending_approval`/`approval_pending`/stage 1 = **7** · `approved`/`awaiting_bch_confirmation`/5 = 4 · `approved`/`awaiting_po`/5 = **4** · `approved`/`partial_delivery`/5 = 2.
**`purchase_orders`:** `delivered_pending_confirmation` 4 · `completed` 2 · `pending_approval` 1.

### 2.5 Bộ test hiện có liên quan (§25)

| Tệp | Dòng | Nội dung |
|---|---|---|
| `tests/workflow-direct.test.ts` | 391 (56.104 B) | **chuỗi dài nhất**: 5 bậc duyệt → multi-PO → multi-delivery → BCH → xuất kho → điều chỉnh tồn → đóng thiếu |
| `java-backend/.../SupplyChainEndToEndIntegrationTest.java` | 199 | DNMH→PO→GRN→BCH→PX→sản lượng→thu hồi→thanh toán |
| `java-backend/.../RequestApprovalIntegrationTest.java` | 174 | duyệt phiếu |
| `java-backend/.../StockChainIntegrationTest.java` | 168 | chuỗi kho |
| `tests/*.test.mjs` (tổng) | 46 tệp | chỉ 3 tệp liên quan gián tiếp (`t10-approval-center`, `ad06`, `w2`) |

**Cách chạy:** `npm run test:workflow` ⇒ `node --import tsx tests/workflow-direct.test.ts`.
⚠️ **`workflow-direct.test.ts` chạy trên SQLite in-memory** — **XÁC NHẬN bằng mã**, không suy đoán:

```ts
// tests/workflow-direct.test.ts:3,31
import { DatabaseSync } from "node:sqlite";
const sqlite = new DatabaseSync(":memory:");   // ← CSDL TÁCH BIỆT HOÀN TOÀN
```

⇒ chạy bộ test **KHÔNG ghi vào MySQL production** `vntech_erp` (đã kiểm chứng để bảo đảm an toàn dữ liệu thật 17 MR / 7 PO / 16 GRN).
**Hệ quả về độ tin cậy:** test dựng lược đồ từ `drizzle/*.sql` trên SQLite, **khác MySQL thật** ⇒ kết quả xanh **không tự động đúng cho production**; mọi kết luận trong báo cáo gap vẫn phải dựa trên phép đo MySQL thật (§2.3–2.5).

### 2.7 BẰNG CHỨNG CHẠY BỘ TEST (cổng xanh — đo ngày 21/09/2026)

Lệnh: `npm test` ⇒ `lint && typecheck && test:regression && test:workflow`

| Chặng | Kết quả đo |
|---|---|
| `eslint .` | ✅ **0 errors** · 181 warnings (đều là `no-unused-vars`/`no-img-element` tồn đọng sẵn) |
| `tsc --noEmit --incremental false` | ✅ **thoát 0**, không lỗi |
| `test:regression` | ✅ **69 pass · 0 fail · 0 cancelled · 0 skipped · 0 todo** (6.756 s) |
| `test:workflow` | ✅ `Workflow VNTECH ERP V5.3.0 FULL W2 passed: five-stage approvals/email/SLA → multi-PO/multi-delivery → strict material master → contract stock → inherited/override permissions → configurable groups/roles/UI → user safety.` |
| **Tổng** | ✅ **exit code 0 — CỔNG XANH** |

**Phạm vi bằng chứng (khai báo trung thực):** bộ test này **xác nhận baseline của repo**, **KHÔNG** xác nhận "thay đổi của TASK-103" — vì TASK-103 **không sửa dòng mã nào** (chỉ tạo 2 tệp tài liệu). `git status` cho thấy các tệp mã bị ` M` (`lib/vntech-identity-data.mjs`, `VNTECH_*`, `docs/28_*`, `drizzle/0159-0160`) đều có `LastWriteTime` **19–20/09/2026**, **trước** lượt này ⇒ không phải thay đổi của TASK-103.
**Giá trị của phép đo:** cung cấp **mốc xanh trước khi sửa** cho nhóm C (C3/C4 phải sửa `scripts/system-route.mjs`) — đúng yêu cầu "test trước khi sửa engine" ở §5.
**Ghi chú đính chính:** ở bản đầu của tài liệu này tôi ghi "không chạy test vì bị cấm build". Đính chính: `npm test` **không phải** lệnh build/thay đổi mã, và bộ test **cô lập** (SQLite `:memory:`) nên **được phép chạy**; ràng buộc cấm (`node tools/gd-cycle.mjs`, `npm run build`, khởi động/dừng dịch vụ) **vẫn được tuân thủ**.

### 2.6 Đối chiếu §25 — 12 test case bắt buộc

| §25 | Kịch bản | Hiện có? | Bằng chứng |
|---|---|---|---|
| Case 1 | PR chưa duyệt đủ → không tạo PO | **LIKELY CÓ** | `workflow-direct.test.ts:212` `create_po` bị chặn; khớp lỗi `tệp:1382` |
| Case 2 | PR duyệt đủ → tạo PO | **CÓ** | `:169-171` |
| Case 3 | 3 PO đều completed → PR completed | **MỘT PHẦN** | `:296-303` — 2 PO (không phải 3) → `supplyStatus='completed'` |
| Case 4 | 2 completed + 1 incomplete → PR incomplete | **MỘT PHẦN** | `:275-303` — có giai đoạn 1 PO xong 1 PO chưa; chưa assert PR ≠ completed |
| Case 5 | PO ordered 100, GRN 70 → PO incomplete | **LIKELY CÓ** | `:274-281` `remainingQty=15`; chưa assert `PO.status ≠ completed` |
| Case 6 | PO 100 = GRN1 60 + GRN2 40 → completed | **LIKELY CÓ** | `:286-303` (nhiều chuyến, 2 PO) |
| Case 7 | PR item 100 → PO001 60 + PO002 40 = hợp lệ | **CÓ** | `:265-270` 8 + 12 (khác số nhưng cùng lớp) |
| Case 8 | PR item 100 → PO001 60 + PO002 60 → chặn vượt | **LIKELY CÓ** | ràng buộc ở `tệp:1386`; **chưa thấy assert riêng cho ca vượt ở file test** |
| Case 9 | Workflow V1→V2, PR cũ giữ V1, PR mới dùng V2 | ❌ **KHÔNG CÓ** | **hệ thống không có versioning** → không thể viết test |
| Case 10 | PO cancelled → kiểm PR completion | **LIKELY CÓ** | `:213-217` chỉ test `cancel_request` (huỷ MR), **không test `reject_po`** |
| Case 11 | Nhiều GRN cho 1 PO → cộng SL đúng | **LIKELY CÓ** | `:281,301` `actualDeliveredQty` 5→20, `linkedReceiptCount` 1→3 |
| Case 12 | Nhiều PO từ 1 PR → giữ quan hệ nguồn | **CÓ** | `:270,282` `linkedPoCount=2` |

**Kết luận: Case 9 = 0 % (bất khả thi vì thiếu tính năng); 5 case còn thiếu assert minh bạch; 6 case có phủ sót.**

---

## 3. PHÁT HIỆN CHÍNH (tóm tắt 7 điểm; chi tiết + bằng chứng ở `PHASE2-GAP-ANALYSIS.md`)

| # | Phát hiện | Nhãn | Mức |
|---|---|---|---|
| 1 | **Tài liệu Phase 2 duy nhất của repo (`Quy trình đặt hàng.docx`) chỉ có SƠ ĐỒ, 0 dòng văn bản quy trình; và nó mô tả luồng KHÁC cả hệ thống lẫn đặc tả** (2 vai trò: Phòng Dự án + Ban lãnh đạo — không có Thư ký TGĐ, không có Giám đốc) | CONFIRMED | **P0** |
| 2 | **Không tồn tại bảng `purchase_requests`.** "PR" chỉ là tập con `material_requests.status='approved'` | CONFIRMED | **P0** |
| 3 | **Workflow versioning KHÔNG TỒN TẠI và bị CHẶN Ở CSDL:** cột `version` đã bị xoá (Flyway **V19**), `UNIQUE(code)` chặn V2 (probe ⇒ ERROR 1062), PR/PO không có cột `workflow_id`/`workflow_version`, **0 action** publish version | CONFIRMED | **P0** |
| 4 | **Hard-code vi phạm nguyên văn §23:** `scripts/system-route.mjs:1744` khai tên + vai trò bước **101/102/103** bằng literal `? :`; `approval_stage_catalog` chỉ có 5 bước (1–5), **không có bước ≥ 101** | CONFIRMED | **P0** |
| 5 | **Hai hệ workflow song song:** `workflow_definitions`/`workflow_steps` (**chỉ đọc ở bootstrap/CRUD, KHÔNG thi hành**) vs `approval_stage_catalog`+`approvals` (**engine chạy thật**). `approval_stage_decisions` = **0 dòng** ⇒ nhánh `all_roles` chưa từng chạy thật | CONFIRMED | **P0** |
| 6 | **Đứt gãy truy vết §17:** `PO-PRJ-DEMO-01-2026-0011.request_id = NULL` (2 GRN, `completed`) ⇒ không truy được PR; **10/16 GRN rỗng dòng** ⇒ 62,5 % chuyến giao không đối soát được SL; **0 FK toàn CSDL** | CONFIRMED | **P0** |
| 7 | **Đã ĐẠT và không được làm lại (§18):** chặn tạo PO khi PR chưa duyệt đủ (`:1382`) · validate mã vật tư thuộc PR (`:1384-1386`) · chặn vượt SL đã duyệt (`:1386`) · **1 PR→N PO** ở mức dòng (`po_items.request_item_id`) · nhóm PO theo NCC (`:1394`) · **1 PO→N GRN** (7/7 thật) · PO completion theo `received+closed >= ordered` (`:1555-1560`) · **PR completion suy ở BACKEND** (`:1561-1568`) · `reject_po` không tự hoàn thành PR (`:1409-1421`) · RBAC backend + map quyền theo action (`:11-27`) | CONFIRMED | — |

---

## 4. ĐỐI CHIẾU NHANH §25 VÀ §29

- **§25:** Case 9 bất khả thi (thiếu tính năng); 5 case thiếu assert; 6 case có phủ sót ⇒ **chưa đủ lưới an toàn để sửa engine**.
- **§29 (điều kiện hoàn thành Phase 2, 20 hạng mục):** các hạng mục **Workflow Versioning** · **Quantity Reconciliation (GRN rỗng dòng)** · **PO detail UI** · **Regression tests** **CHƯA có bằng chứng** ⇒ **KHÔNG được đánh dấu PHASE 2 = COMPLETE**.

---

## 5. TODO TRIỂN KHAI (CHƯA LÀM — §30 bước 11)

> Thứ tự **bắt buộc** vì có phụ thuộc. Không nhảy cóc: **B trước C** (test trước khi sửa engine), **A trước C** (chốt nghiệp vụ trước khi thiết kế versioning).

### NHÓM A — CHỜ NGƯỜI DÙNG QUYẾT (chặn toàn bộ C)

| ID | Việc | Phụ thuộc | Ghi chú |
|---|---|---|---|
| **A1** | Chốt luồng duyệt PR: 5 bước (hệ thống) / 4 bước (đặc tả) / 2 bước (tài liệu) | — | **P0** — không tự chọn (§9 Q2) |
| **A2** | Chốt MR: REQUIRED / LEGACY / REMOVE | — | **P0** — audit kết luận REQUIRED (9 câu §4 đã trả lời) |
| **A3** | Chốt phạm vi versioning §7: làm đủ (migration) hay chấp nhận snapshot hiện có | A1 | **P0** |
| **A4** | Chốt cách xử lý 3 bước hard-code 101/102/103 | A1 | **P0** |

### NHÓM B — LƯỚI AN TOÀN (làm được NGAY, không đụng nghiệp vụ)

| ID | Việc | Phụ thuộc | Nghiệm thu |
|---|---|---|---|
| **B1** | Viết **12 test §25** (ĐỎ trước, XANH sau) trong `tests/phase2-pr-po-grn.test.ts` | — | 12/12 ca chạy được; Case 9 **ghi rõ là BLOCKED bởi A3** |
| **B2** | Cổng đo truy vết `PR→PI→PO→POI→GRN→GRI→SL` | — | mọi PO phải có `request_id` non-NULL; mọi GRN phải có ≥ 1 dòng |
| **B3** | Cổng đo "1 PR → N PO" + "không vượt SL" trên **dữ liệu thật** | — | `SUM(poi.ordered_qty) ≤ SUM(mri.approved_purchase_qty)` cho mọi MR |
| **B4** | Cổng đo toàn vẹn tham chiếu (vì **0 FK**) | — | liệt kê + đếm bản ghi mồ côi; **SQL lỗi ⇒ ghi KHÔNG kết luận**, không tính ĐẠT |

### NHÓM C — VÁ DỮ LIỆU & ENGINE (sau A + B)

| ID | Việc | Phụ thuộc | Ghi chú |
|---|---|---|---|
| **C1** | Gán `request_id` cho PO mồ côi (`PO-…-0011`) | A2, B2 | 1 câu UPDATE, append-only |
| **C2** | Xử lý **10 GRN rỗng dòng** | A2, B2 | cần chốt Q5 — có thể là dữ liệu smoke |
| **C3** | Thiết kế Workflow Versioning §7 (definition→version→instance→step instance→approval record) | A1, A3, B1 | **cần migration** — §24 append-only, cấm DROP/DELETE ALL |
| **C4** | Hợp nhất 2 hệ workflow + đưa 101/102/103 vào catalog, xoá literal | A1, A4, C3 | **sửa `scripts/system-route.mjs` — hiện bị cấm ở lượt này** |
| **C5** | Thêm action/quyền riêng cho `Split PO` · `Complete PO` · `Complete PR` | C4 | bịt lỗ §22 (3 hành động không có điểm kiểm quyền) |

### NHÓM D — UI (§19–§21)

| ID | Việc | Phụ thuộc |
|---|---|---|
| **D1** | Khối **PO con** trong PR detail: `PO001 — NCC — TRẠNG THÁI` + PR STATUS | A1 |
| **D2** | **Màn chi tiết PO**: Source PR · Supplier · PO Items · Ordered/Received/Remaining · GRN list · Delivery status · Timeline | D1 |
| **D3** | Click-through 2 chiều: PO→GRN · GRN→PO · PO→PR · PR→PO list | D2 |
| **D4** | Bổ sung **Approval Time + Comment/Reason** vào dải duyệt (hiện dải tự viết `page.tsx:949` thiếu) | — |

### NHÓM E — TÀI LIỆU / TIẾN ĐỘ

| ID | Việc | Ghi chú |
|---|---|---|
| **E1** | Cập nhật `docs/25_TODO_ROADMAP.md` **CHỈ ô TT** cho mục có ánh xạ 1-1 (nếu có) | theo `MASTER_STATUS.md:45` |
| **E2** | Cập nhật `MASTER_STATUS.md` khi có mục mới ở Phase 2 | |
| **E3** | Checklist §29 (20 hạng mục) kèm **bằng chứng đo được** cho từng hạng mục | chỉ đóng khi có evidence |

---

## 6. CÂU HỎI MỞ (chuyển `PHASE2-GAP-ANALYSIS.md` §9)

**Q1** MR giữ hay bỏ? · **Q2** Luồng duyệt PR mấy bước, ai? · **Q3** Versioning bắt buộc đến đâu? · **Q4** 3 bước hard-code có đưa vào engine? · **Q5** Xử lý 10 GRN rỗng dòng + PO mồ côi? · **Q6** `unit_price = 0` (13/13) điền theo đơn giá HĐ? *(trùng KP #82 đang chờ người dùng)*

---

## 7. RÀNG BUỘC — TỰ KIỂM

| Ràng buộc | Trạng thái |
|---|---|
| Không sửa `app/**` · `lib/**` · `scripts/**` · `java-backend/**` · `drizzle/**` | ✅ chỉ đọc |
| Không build · không `gd-cycle.mjs` | ✅ |
| Không khởi động/dừng dịch vụ (8787/9000/18081) | ✅ |
| Không ghi đè `.docx` (chỉ ĐỌC) | ✅ dùng **bản copy** trong `%TEMP%`, gốc không đổi |
| Không `git add -A` / commit | ✅ không commit trong lượt này |
| Không dùng PowerShell ghi tệp tiếng Việt | ✅ dùng công cụ `write` (UTF-8) |
| Không biến INFERENCE/UNKNOWN thành business rule | ✅ mọi kết luận gắn nhãn; UNKNOWN ở §9 |

**Tệp tạm đã tạo trong `tools/` (không phải tài liệu sản phẩm):** `tools/_tmp_docx2txt.ps1` · `tools/_tmp_shapes.ps1` · `tools/_tmp_flow_svg.ps1` · `tools/_tmp_render_pdf.ps1` — dùng công cụ bóc tài liệu; **cần xoá** nếu không muốn giữ lại. **Không sửa** tệp nào khác.

---

## 8. KẾT LUẬN TASK-103

1. **Đã hoàn thành bước 1 → 11** của §30; **không làm bước 12** (không sửa mã).
2. **Tài liệu Phase 2 của repo KHÔNG ĐỦ** để làm chuẩn nghiệp vụ: chỉ 1 trang sơ đồ, mô tả **2 vai trò duyệt**, khác cả hệ thống (5 bước) lẫn đặc tả (4 bước). **Đây là gap P0 về nguồn sự thật** — phải chốt bằng người dùng, không suy đoán.
3. **Hệ thống hiện tại mạnh hơn đặc tả ở tầng lược đồ/logic** (1 PR→N PO và 1 PO→N GRN đều đã có thật; PR completion đã suy ở backend) — **không cần xây lại** (§18).
4. **Ba lỗ hổng thật phải bịt:** (a) **Workflow Versioning bị chặn ở CSDL** (V19 xoá cột + `UNIQUE(code)`), (b) **hard-code 3 bước 101/102/103** vi phạm §23, (c) **đứt truy vết**: 1 PO mồ côi + 10/16 GRN rỗng dòng + 0 FK.
5. **Không được đánh dấu PHASE 2 = COMPLETE** (§29).

---

*Hết TASK-103. Báo cáo gap chi tiết: `docs/agent-progress/PHASE2-GAP-ANALYSIS.md`.*
