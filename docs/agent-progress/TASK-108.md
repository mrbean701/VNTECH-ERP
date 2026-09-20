# TASK-108 — PHASE 2: DỮ LIỆU TEST CHO 3 CỔNG ĐO (CHỈ INSERT) + SỬA LỖI NGỮ NGHĨA NULL CỦA CỔNG TOÀN VẸN

**Ngày:** 21/09/2026 · **Người chỉ đạo:** người dùng («database hiện tại chỉ có dữ liệu test… có thể insert
tuỳ ý miễn là test thành công» + «không xoá bất cứ table hay trường nào khi chưa hỏi») + captain (duyệt kế
hoạch, cho phép sửa 1 lỗi cổng đo kèm 4 điều kiện minh bạch).

**Tệp đã tạo/sửa:**

| Tệp | Loại | Nội dung |
|---|---|---|
| `tools/seed-p2-test-data.mjs` | **MỚI** | Seed idempotent, CHỈ INSERT, có `--dry-run` |
| `tools/p2-reference-integrity.mjs` | sửa (được captain cho phép) | Sửa phép gán NULL bị NGƯỢC + đối chiếu chéo |
| `tools/lib/p2-gates.mjs` | sửa (tối thiểu, thêm 1 hàm thuần) | `mucDoMoCoi()` — quyết định mồ côi, test offline được |
| `tests/p2-gates-tools.test.mjs` | sửa (thêm 1 ca test) | RED trước khi có hàm, GREEN sau |
| `docs/agent-progress/TASK-108.md` | **MỚI** | Hồ sơ này |

**KHÔNG đụng:** `scripts/**` · `java-backend/**` · `drizzle/**` · `app/**` · `lib/**` · `AGENTS.md` ·
`docs/28_*` · `.docx/.xlsx` · `tools/baseline/**` · `docs/agent-progress/TASK-094…107.md`.
**KHÔNG** build · **KHÔNG** khởi động/dừng dịch vụ · **KHÔNG** `git add -A` · **KHÔNG** push ·
`tests/p2-25-pr-po-grn-cases.test.mjs` vẫn **untracked**.

---

## 1. RÀNG BUỘC CHỈ-INSERT VÀ CÁCH ÉP BẰNG MÃ

Người dùng: **chỉ INSERT**, cấm `DELETE` · `UPDATE` · `DROP` · `TRUNCATE` · `ALTER`.
Tệp seed không chỉ *hứa* tuân thủ — nó **chặn bằng mã** ở `kiemTraChiInsert()`: mọi câu lệnh phải bắt đầu
bằng `INSERT` và không được chứa từ khoá ghi nào khác; sai ⇒ ném lỗi **trước khi chạm CSDL**.

**Đã xác nhận 0 câu DELETE/UPDATE/DROP/TRUNCATE/ALTER được dùng trong cả đợt này** ✔
(kể cả tệp cổng: `tests/p2-gates-tools.test.mjs` vẫn xanh — nó quét nguyên văn 3 cổng + lib và không thấy
từ khoá ghi nào; 13/13 ca test đạt).

---

## 2. BẢNG TRƯỚC/SAU — 3 CỔNG ĐO

### 2.1 Cổng `p2-trace-audit.mjs`

| Mã | Chặng | TRƯỚC | SAU | Ngưỡng | Kết luận SAU |
|---|---|---|---|---|---|
| A1 | PO mồ côi (PR→PO) | **6/7 = 85,7 %** | **16/17 = 94,1 %** | mồ côi = 0 | **KHÔNG ĐẠT** (1 NULL — BLOCKED, §5) |
| A2 | Dòng POI mồ côi | 13/13 = 100 % | 27/27 = 100 % | mồ côi = 0 | ĐẠT |
| A3 | GRN mồ côi | 16/16 = 100 % | 22/22 = 100 % | mồ côi = 0 | ĐẠT |
| A4 | Dòng SL khai GRN mồ côi | 2/2 = 100 % | 2/2 = 100 % | mồ côi = 0 | ĐẠT |
| B1 | **GRN có dòng GRI** | **6/16 = 37,5 %** | **22/22 = 100 %** | rỗng dòng = 0 | **ĐẠT** ✔ |

`exit 1` (vì A1) · **B1 đã hết đỏ**: 10 GRN rỗng dòng ⇒ 0.

### 2.2 Cổng `p2-split-po-audit.mjs`

| Mã | Chặng | TRƯỚC | SAU | Kết luận SAU |
|---|---|---|---|---|
| C1 | Dòng PR đặt VƯỢT số lượng duyệt | 35/35, vi phạm **0** | 53/53, vi phạm **0** | ĐẠT |
| C2 | Dòng PR lệch tổng rollup | 35/35, vi phạm **0** | 53/53, vi phạm **0** | ĐẠT |
| B1 | **MR có ≥ 2 PO** | **0** (UNKNOWN) | **1** (max **2 PO/1 PR**) | **CÓ BẰNG CHỨNG** ✔ |

`exit 0` · **KẾT LUẬN: ĐẠT** · MR có ≥1 PO: 6/17 → 15/29.
Mục `[3](a)` (đối chiếu 2 cách rollup theo PR) **toàn bộ "khớp"**, gồm ca mới `DNMH-PRJ-DEMO-01-2026-9001`.

### 2.3 Cổng `p2-reference-integrity.mjs` — BÁO CẢ HAI CON SỐ (điều kiện #2 và #4 của captain)

| Thời điểm | Cách đếm CŨ (đếm NULL hợp lệ là mồ côi) | Cách đếm MỚI (chỉ tham chiếu TREO) |
|---|---|---|
| Trước khi sửa cổng (baseline) | **335 dòng** / 10 cặp | *(chưa có)* |
| **Sau khi sửa cổng, TRƯỚC khi seed** | 335 dòng / 10 cặp | **113 dòng / 9 cặp** |
| **Sau khi seed** | 222 dòng / 5 cặp *(toàn bộ là NULL nghiệp vụ)* | **0 dòng / 15 cặp ⇒ ĐẠT** ✔ |

- **Chứng minh phép sửa chỉ đổi cách đếm NULL, KHÔNG che giấu tham chiếu hỏng:** 335 = 113 (treo) + 222 (NULL).
  Sau khi sửa, cổng vẫn báo **đủ 113** tham chiếu treo — bằng đúng số đo độc lập bằng SQL trực tiếp.
- **Số NULL vẫn được in riêng** ở cột `NULL (hợp lệ)` (72 · 72 · 32 · 45 · 1 …) — không giấu thông tin ✔
- **Đối chiếu chéo LEFT JOIN vs NOT EXISTS:** cả 15 cặp "khớp" ⇒ số liệu đáng tin.

---

## 3. SỐ DÒNG INSERT THEO TỪNG BẢNG (đo thật bằng `COUNT(*)` trước/sau)

| Bảng | Số dòng chèn | Vì sao |
|---|---|---|
| `suppliers` | **+1** | Luật thật `create_po` (system-route.mjs:1439) **gom PO theo `supplierId`** ⇒ muốn 1 PR ra 2 PO phải có **2 NCC**. CSDL chỉ có 1 NCC đang hoạt động ⇒ thêm NCC thứ 2 |
| `material_requests` | **+12** | 9 PR bị rollback (đúng 9 id đang bị trỏ tới) + 2 PR của dự án khác (`DNMH-SC012564…`, `DNMH-SC404767…`) + 1 PR cho ca tách PO |
| `material_request_items` | **+18** | 14 dòng PR đang bị trỏ tới + 2 dòng "bù cân bằng" + 2 dòng của ca tách PO |
| `purchase_orders` | **+10** | 6 PO đang bị trỏ tới + 2 PO dựng kèm (2 dự án khác) + **2 PO của ca tách PO (cùng `request_id`, khác NCC)** |
| `purchase_order_items` | **+14** | 8 dòng PO đang bị trỏ tới + 4 dòng "bù cân bằng" + 2 dòng của ca tách PO |
| `goods_receipts` | **+6** | 1 phiếu bị trỏ tới từ workflow + 5 phiếu dựng theo `receipt_no` mà `procurement_allocations` nhắc tới nhưng chưa tồn tại |
| `goods_receipt_items` | **+20** | 9 dòng phiếu nhập bị trỏ tới + **10 dòng lấp 10 GRN rỗng** + 1 dòng cho phiếu nhập mới (giữ B1 = 100 %) |
| **TỔNG** | **81 dòng** | 7 câu `INSERT IGNORE` (gộp nhiều dòng/câu) |

**SQL đã chạy** — mọi câu đều có dạng `INSERT IGNORE` (idempotent), ví dụ:

```sql
INSERT IGNORE INTO material_requests
  (id,request_no,project_id,team_id,source_warehouse_id,requested_by,requested_at,needed_at,priority,area,
   purpose,status,approval_stage,total_estimated_value,created_at,updated_at,supply_status) VALUES ...;

INSERT IGNORE INTO material_request_items
  (id,request_id,line_no,material_id,requested_qty,stock_allocation_qty,approved_purchase_qty,ordered_qty,
   received_qty,issued_qty,installed_qty,delivered_qty,line_status,created_at,updated_at,estimated_unit_price) VALUES ...;

INSERT IGNORE INTO purchase_orders
  (id,po_no,request_id,project_id,supplier_id,receiving_warehouse_id,buyer_user_id,ordered_at,eta,status,
   total_value,created_at,updated_at) VALUES ...;

INSERT IGNORE INTO purchase_order_items
  (id,purchase_order_id,request_item_id,line_no,ordered_qty,unit_price,received_qty,closed_qty,delivered_qty,
   status,created_at,updated_at) VALUES ...;

INSERT IGNORE INTO goods_receipts
  (id,receipt_no,purchase_order_id,warehouse_id,received_by,received_at,delivery_note_no,qc_status,
   document_status,posting_status,bch_confirmation_status,created_at,updated_at) VALUES ...;

-- ⚠ CỘT THẬT là `receipt_id` (KHÔNG phải `goods_receipt_id` như tài liệu audit cũ ghi)
INSERT IGNORE INTO goods_receipt_items
  (id,receipt_id,purchase_order_item_id,received_qty,accepted_qty,rejected_qty,lot_no,qc_result,
   created_at,updated_at) VALUES ...;

INSERT IGNORE INTO suppliers
  (id,code,name,lead_time_days,rating,active,created_at,updated_at) VALUES ...;
```

Chạy: `node tools/seed-p2-test-data.mjs` · xem trước không chạm CSDL: `node tools/seed-p2-test-data.mjs --dry-run`

### 3.1 IDEMPOTENT — bằng chứng đo được, không phải lời hứa

Tệp seed dựng lại bản ghi thiếu **theo dữ liệu** (truy vấn tham chiếu treo trước khi chèn) ⇒ chạy lần 2
không còn gì để dựng. Cộng thêm `INSERT IGNORE` cho phần ID cố định.

| Lần chạy | Số dòng THỰC TẾ tăng (`COUNT(*)` trước → sau) |
|---|---|
| Lần 1 | **+81** |
| Lần 2 | **+0** ⇒ ✔ IDEMPOTENT |
| Lần 3 | **+0** ⇒ ✔ IDEMPOTENT |

---

## 4. PHÁT HIỆN SỚM QUAN TRỌNG: MỒ CÔI KHÔNG NẰM Ở "3 ID MR"

Giả thuyết ban đầu là mồ côi tập trung ở 3 ID MR (`MR_00b80951…`, `MR_46cee316…`, `MR_77c22ec4…`).
**Đo trực tiếp bằng SQL cho thấy rộng hơn nhiều:**

| Loại | Số lượng THẬT |
|---|---|
| ID `material_requests` đang bị trỏ tới mà không tồn tại | **9** (không phải 3) |
| ID `material_request_items` đang bị trỏ tới mà không tồn tại | **14** |
| ID `purchase_orders` / `purchase_order_items` / `goods_receipts` / `goods_receipt_items` | 6 / 8 / 1 / 9 |
| **Tổng dòng mồ côi** | **335** = **113 tham chiếu TREO** + **222 NULL** |

Chuỗi bằng chứng cho thấy đây là **một đợt seed cũ bị rollback**: dãy `request_no` của dự án mẫu khuyết
đúng các số **0001–0007, 0009**, và `procurement_allocations.reference_no` vẫn trỏ tới chúng. Tệp seed vì
vậy dựng lại PR với **đúng những số đang khuyết** (bộ đếm `document_sequences` của app đang ở **124** nên
không bao giờ sinh trùng các số này).

---

## 5. BLOCKED — MỤC "GÁN `request_id` CHO PO MỒ CÔI" KHÔNG THỂ LÀM BẰNG INSERT ✗

```
PO-PRJ-DEMO-01-2026-0011   id=PO_ae923bc9-65c4-4275-b6ab-fc3c81efe97a   status=completed   request_id = NULL
```

`request_id` là **NULL** (KHÔNG phải trỏ vào một id cụ thể), tức **không có id đích nào để INSERT bù**.
Cột nằm trên **dòng đã tồn tại** ⇒ `INSERT` không sửa được ⇒ **DỪNG mục này**, không làm liều.

**Hệ quả:** chặng **A1 giữ 1 mồ côi** ⇒ cổng `trace` **không thể ĐẠT** bằng INSERT-only.
(Đúng cảnh báo trong đề bài: "nếu `request_id` là NULL ⇒ thì đây là ca khác".)

**Đề xuất (cần người dùng cho phép — chỉ 1 câu, không xoá bảng/cột):**

```sql
-- Chọn một PR đã duyệt của đúng dự án làm cha, ví dụ PR của chính dự án mẫu:
UPDATE purchase_orders
   SET request_id = 'MR_9a49a007-8502-481e-a852-c6fe49b52166'   -- DNMH-PRJ-DEMO-01-2026-0011 (status=approved)
 WHERE id = 'PO_ae923bc9-65c4-4275-b6ab-fc3c81efe97a';
```

Sau câu này: A1 = **17/17 = 100 %** ⇒ cổng `trace` ĐẠT. (Chọn PR nào là quyết định nghiệp vụ, không phải
kỹ thuật — nên để người dùng chốt.)

---

## 6. LỖI CỦA CHÍNH CỔNG ĐO (đã sửa, có test đỏ→xanh)

**Bằng chứng lỗi:** `tools/p2-reference-integrity.mjs` dòng 117 (bản cũ) gán

```js
const rong = q.choNull ? <đếm NULL> : 0;      // rồi p2-gates.mjs: moCoi = rong + treo
```

trong khi chính chú thích dòng 58 của tệp ghi: *"cột có được phép NULL (quy ước nghiệp vụ) thì NULL KHÔNG
tính là mồ côi"*. Phép gán **NGƯỢC** với tài liệu ⇒ 222 dòng NULL hợp lệ bị đếm thành mồ côi ⇒ cổng
**không thể về 0** trên dữ liệu thật. Đây là **lỗi của công cụ đo**, không phải lỗi dữ liệu.

**Cách sửa (theo đúng kiến trúc sẵn có của chính tệp này):** tách quyết định ra hàm thuần `mucDoMoCoi()`
trong `tools/lib/p2-gates.mjs` (đúng như header của lib nói: logic đo tách ra để test offline được), viết
test **RED trước** (`node --import tsx --test tests/p2-gates-tools.test.mjs` → ✖ thiếu hàm), rồi mới sửa
→ **GREEN 13/13**. Đồng thời đối chiếu chéo `NOT EXISTS` phải dùng **cùng ngữ nghĩa NULL**, nếu không sẽ
báo "LỆCH" giả. Số NULL vẫn in riêng ở cột `NULL (hợp lệ)`.

Đã theo đủ 4 điều kiện của captain: (1) commit RIÊNG ✔ · (2) báo cả 2 con số ✔ · (3) giữ in số NULL riêng ✔ ·
(4) chứng minh 335 → 113 **trước khi seed** ✔.

---

## 7. CA THẬT "1 PR → N PO" (đúng luật đọc từ mã, không đoán)

`scripts/system-route.mjs` L1439: `const groups=new Map(); … key=String(line.supplierId)` rồi
`for(const [supplierId,groupLines] of groups)` ⇒ **1 PO = 1 nhà cung cấp**. Muốn 1 PR ra 2 PO thì 2 dòng
phải thuộc **2 NCC khác nhau** — đây là lý do phải thêm NCC thứ 2 (§3).

| Đối tượng | ID | Ghi chú |
|---|---|---|
| PR | `MR_P2SEED_SPLIT` · `DNMH-PRJ-DEMO-01-2026-9001` | `status='approved'`, `supply_status='awaiting_po'` (điều kiện thật để tạo PO: L1427) |
| Dòng PR A | `MRI_P2SEED_SPLIT_A` | đề nghị 100 · duyệt mua **100** · đã đặt **60** |
| Dòng PR B | `MRI_P2SEED_SPLIT_B` | đề nghị 50 · duyệt mua **50** · đã đặt **50** |
| PO #1 | `PO-PRJ-DEMO-01-2026-9001` | NCC cũ `SUP_c0f509fc…`, 60 SP, `pending_approval` (đúng trạng thái `create_po` sinh ra) |
| PO #2 | `PO-PRJ-DEMO-01-2026-9002` | NCC mới `SUP_P2SEED_NCC2`, 50 SP, `pending_approval` |

⇒ **`MR có ≥ 2 PO = 1`**, `SUM(ordered) ≤ approved` (60 ≤ 100 và 50 ≤ 50) và
`mri.ordered_qty == SUM(poi.ordered_qty)` cho **mọi** dòng ⇒ C1/C2 vẫn 0 vi phạm.
Dải số `9xxx` được chọn để **không bao giờ đụng** bộ đếm `document_sequences` (PO đang ở 10, DNMH ở 124).

---

## 8. RỦI RO CÒN LẠI / UNKNOWN

1. **Trùng `po_no` (rủi ro THẬT, chưa xử lý — ngoài phạm vi):** `PO-PRJ-DEMO-01-2026-0011` đang tồn tại
   (chính là PO mồ côi ở §5) nhưng `document_sequences` cho PO của dự án mẫu đang ở **10** ⇒ lần tạo PO kế
   tiếp của ứng dụng sẽ sinh **đúng `…-0011`** ⇒ **vi phạm khoá UNIQUE `purchase_orders_no_uidx`**.
   Đề xuất: cập nhật `document_sequences` (cần người dùng cho phép, và cần động vào cơ chế cấp số).
2. **222 dòng NULL không thể về 0 bằng INSERT** — nhưng với ngữ nghĩa đúng thì **NULL không phải mồ côi**:
   `procurement_allocations.purchase_order_item_id` (72), `receipt_item_id` (72), `supply_workflow_steps.purchase_order_id` (32),
   `receipt_id` (45), `purchase_orders.request_id` (1 — ca §5). Đây là **"chưa tới bước đó"**, không phải tham chiếu hỏng.
3. **Bất nhất nội tại CÓ SẴN của dữ liệu cũ (không do đợt này tạo):** 72 dòng `procurement_allocations` ở
   `stage='PO'`/`'MR'` có `purchase_order_item_id = NULL`, nên lượng đã đặt ở tầng allocation **không nối được**
   xuống dòng PO. Tệp seed giữ `mri.ordered_qty = SUM(poi.ordered_qty)` (để C2 xanh) nên các dòng PR được
   dựng lại có `ordered_qty = 0` dù allocation tầng PO ghi 60/150 — **chưa đối soát được**, cần người dùng quyết
   có vá các `purchase_order_item_id` NULL đó không (phải UPDATE).
4. **Ánh xạ `id ↔ request_no` của 9 PR dựng lại là SUY LUẬN**, không có bằng chứng nối trực tiếp: dữ liệu chỉ
   chứng minh các `request_no` 0002–0007 **đang khuyết** và các dòng PR con của chúng còn treo. Việc gán
   id-nào-ứng-số-nào là **quy ước của tệp seed**, ghi lại đây để người sau kiểm chứng.
5. **Thêm dữ liệu test vào CSDL `vntech_erp` thật** (81 dòng, id mang tiền tố `P2SEED`/dải `9xxx`) theo
   chỉ đạo «insert tuỳ ý miễn là test thành công». Muốn gỡ thì phải `DELETE` — mà đợt này **cấm**, nên cần
   một lượt được người dùng cho phép riêng.

---

## 9. COMMIT (tách riêng theo yêu cầu của captain)

| # | Commit | Nội dung |
|---|---|---|
| 1 | **`ef8f672`** | `[PHASE 2 - TOOL]` sửa ngược nghĩa NULL ở cổng toàn vẹn (+ `mucDoMoCoi()` + test đỏ→xanh) |
| 2 | **`8b8c8ff`** | `[PHASE 2 - SEED]` `tools/seed-p2-test-data.mjs` — 81 dòng INSERT, ca 1 PR→2 PO |
| 3 | **`e68b14e`** | `[PHASE 2 - DOCS]` hồ sơ TASK-108 |

Nhánh `unity`. Không `git add -A`, không push.
