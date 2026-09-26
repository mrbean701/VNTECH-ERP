# TASK-108 — PHASE 2: ĐƯA 3 CỔNG ĐO VỀ ĐẠT BẰNG DỮ LIỆU TEST (INSERT + UPDATE CÓ KIỂM SOÁT)

**Ngày:** 21/09/2026 · **Người chỉ đạo:** người dùng + captain.

Chỉ đạo nguyên văn của người dùng, theo thứ tự thời gian:

1. «database hiện tại chỉ có dữ liệu test không cần lấy đó làm chuẩn, **có thể insert tuỳ ý miễn là test thành công**»
   — kèm ràng buộc cứng: «**không xoá bất cứ table hay trường nào** khi chưa hỏi».
2. «**ok update dữ liệu để test đi**, dự án còn thiếu phần nào thì tự động cài đặt.»

⇒ Đợt này dùng **INSERT** (đưa dữ liệu thiếu vào) và **UPDATE** (sửa cột của dòng đã tồn tại).
**Tuyệt đối không** `DELETE` · `DROP` · `TRUNCATE` · `ALTER` (không xoá bảng/cột/dòng nào).

**Tệp đã tạo/sửa:**

| Tệp | Loại | Nội dung |
|---|---|---|
| `tools/seed-p2-test-data.mjs` | **MỚI** | Seed **CHỈ INSERT**, idempotent, có `--dry-run` · 81 dòng |
| `tools/fix-p2-test-data.mjs` | **MỚI** | Sửa dữ liệu **CHỈ UPDATE**, idempotent, có `--dry-run` · 18 dòng |
| `tools/p2-reference-integrity.mjs` | sửa (captain cho phép) | Sửa phép gán NULL bị NGƯỢC + đối chiếu chéo |
| `tools/lib/p2-gates.mjs` | sửa tối thiểu | Thêm hàm thuần `mucDoMoCoi()` (test offline được) |
| `tests/p2-gates-tools.test.mjs` | sửa | Thêm 1 ca test: RED trước, GREEN sau |
| `docs/agent-progress/TASK-108.md` | **MỚI** | Hồ sơ này |

**KHÔNG đụng:** `scripts/**` · `java-backend/**` · `drizzle/**` · `app/**` · `lib/**` · `AGENTS.md` ·
`docs/28_*` · `.docx/.xlsx` · `tools/baseline/**` · `docs/agent-progress/TASK-094…107.md`.
**KHÔNG** build · **KHÔNG** khởi động/dừng dịch vụ · **KHÔNG** `git add -A` · **KHÔNG** push ·
`tests/p2-25-pr-po-grn-cases.test.mjs` vẫn **untracked**.

---

## 1. KẾT QUẢ CUỐI — CẢ 3 CỔNG ĐO ĐỀU ĐẠT (exit code 0)

| Cổng | exit TRƯỚC | exit SAU | Kết luận |
|---|---|---|---|
| `node tools/p2-trace-audit.mjs` | **1** | **0** | **ĐẠT — 5/5 chặng truy vết đầy đủ (0 mồ côi)** |
| `node tools/p2-split-po-audit.mjs` | 0 (nhưng UNKNOWN) | **0** | **ĐẠT** + MR có ≥2 PO = **1** |
| `node tools/p2-reference-integrity.mjs` | **1** | **0** | **ĐẠT — 15/15 cặp không có dòng mồ côi** |

### 1.1 Cổng `p2-trace-audit.mjs`

| Mã | Chặng | TRƯỚC | SAU (cuối) | Ngưỡng | Kết luận |
|---|---|---|---|---|---|
| A1 | **PO mồ côi (PR→PO)** | 6/7 = **85,7 %** | **17/17 = 100 %** | mồ côi = 0 | **ĐẠT** ✔ |
| A2 | Dòng POI mồ côi | 13/13 = 100 % | 27/27 = 100 % | mồ côi = 0 | ĐẠT |
| A3 | GRN mồ côi | 16/16 = 100 % | 22/22 = 100 % | mồ côi = 0 | ĐẠT |
| A4 | Dòng SL khai GRN mồ côi | 2/2 = 100 % | 2/2 = 100 % | mồ côi = 0 | ĐẠT |
| B1 | **GRN có dòng GRI** | 6/16 = **37,5 %** | **22/22 = 100 %** | rỗng dòng = 0 | **ĐẠT** ✔ |

### 1.2 Cổng `p2-split-po-audit.mjs`

| Mã | Chặng | TRƯỚC | SAU (cuối) | Ngưỡng | Kết luận |
|---|---|---|---|---|---|
| C1 | Dòng PR đặt VƯỢT số lượng duyệt | 35/35, vi phạm **0** | 53/53, vi phạm **0** | vi phạm = 0 | ĐẠT |
| C2 | Dòng PR lệch tổng rollup | 35/35, lệch **0** | 53/53, lệch **0** | vi phạm = 0 | ĐẠT |
| B1 | **MR có ≥ 2 PO** | **0** (UNKNOWN) | **1** (max **2 PO/1 PR**) | cần bằng chứng | **CÓ BẰNG CHỨNG** ✔ |

MR có ≥ 1 PO: 6/17 → **16/29**. Mục `[3](a)` đối chiếu 2 cách rollup theo PR: **toàn bộ "khớp"**, gồm ca mới
`DNMH-PRJ-DEMO-01-2026-9001` (`220.0000` vs `220.0000`).

### 1.3 Cổng `p2-reference-integrity.mjs` — BÁO CẢ HAI CON SỐ

| Thời điểm | Cách đếm **CŨ** (đếm cả NULL hợp lệ) | Cách đếm **MỚI** (chỉ tham chiếu TREO) |
|---|---|---|
| Baseline (trước mọi thay đổi) | **335 dòng / 10 cặp** | *(chưa có hàm)* |
| **Sau khi sửa cổng, TRƯỚC khi seed** | 335 dòng / 10 cặp | **113 dòng / 9 cặp** |
| Sau khi seed (chưa UPDATE) | 222 dòng / 5 cặp | 0 dòng / 15 cặp |
| **Sau khi UPDATE (cuối)** | **221 dòng / 4 cặp** *(toàn bộ là NULL nghiệp vụ)* | **0 dòng / 15 cặp ⇒ ĐẠT** ✔ |

- **Chứng minh phép sửa cổng chỉ đổi cách đếm NULL, KHÔNG che giấu tham chiếu hỏng:** 335 = 113 (treo) + 222 (NULL).
  Sau khi sửa, cổng vẫn báo **đủ 113** — trùng khớp con số đo độc lập bằng SQL trực tiếp.
- **Số NULL vẫn in riêng** ở cột `NULL (hợp lệ)` — sau khi UPDATE còn: `PA.purchase_order_item_id` 72 ·
  `PA.receipt_item_id` 72 · `SWS.purchase_order_id` 32 · `SWS.receipt_id` 45 · `PO.request_id` **0** (đã sửa ở F1).
- **Đối chiếu chéo LEFT JOIN vs NOT EXISTS:** cả 15 cặp "khớp" ⇒ số liệu đáng tin.

---

## 2. INSERT — 81 DÒNG, 7 CÂU `INSERT IGNORE` (đo thật bằng `COUNT(*)` trước/sau)

| Bảng | +dòng | Vì sao |
|---|---|---|
| `suppliers` | **+1** | Luật thật `create_po` (system-route.mjs **L1439**) **gom PO theo `supplierId`** ⇒ muốn 1 PR ra 2 PO phải có **2 NCC**. CSDL chỉ có 1 NCC hoạt động |
| `material_requests` | **+12** | 9 PR đang bị trỏ tới mà không tồn tại + 2 PR của chuỗi chứng từ khác + 1 PR cho ca tách PO |
| `material_request_items` | **+18** | 14 dòng PR đang bị trỏ tới + 2 dòng "bù cân bằng" + 2 dòng của ca tách PO |
| `purchase_orders` | **+10** | 6 PO đang bị trỏ tới + 2 PO dựng kèm + **2 PO của ca tách PO (cùng `request_id`, khác NCC)** |
| `purchase_order_items` | **+14** | 8 dòng PO đang bị trỏ tới + 4 dòng "bù cân bằng" + 2 dòng của ca tách PO |
| `goods_receipts` | **+6** | 1 phiếu bị trỏ tới từ workflow + 5 phiếu dựng theo `receipt_no` mà `procurement_allocations` nhắc tới |
| `goods_receipt_items` | **+20** | 9 dòng phiếu nhập bị trỏ tới + **10 dòng lấp 10 GRN rỗng** + 1 dòng cho phiếu nhập mới |
| **TỔNG** | **81** | |

Mẫu câu lệnh (mọi câu đều `INSERT IGNORE`, gộp nhiều dòng):

```sql
INSERT IGNORE INTO material_requests (id,request_no,project_id,team_id,source_warehouse_id,requested_by,
  requested_at,needed_at,priority,area,purpose,status,approval_stage,total_estimated_value,created_at,updated_at,supply_status) VALUES ...;

-- ⚠ CỘT THẬT là `receipt_id` (KHÔNG phải `goods_receipt_id` như tài liệu audit cũ ghi)
INSERT IGNORE INTO goods_receipt_items (id,receipt_id,purchase_order_item_id,received_qty,accepted_qty,
  rejected_qty,lot_no,qc_result,created_at,updated_at) VALUES ...;
```

**Idempotent (đo được):** lần 1 **+81** · lần 2 **+0** · lần 3 **+0**. Lý do: phần dựng lại bản ghi thiếu
**dẫn xuất từ dữ liệu** (quét tham chiếu treo trước khi chèn) nên lần sau không còn gì để dựng.

---

## 3. UPDATE — 18 DÒNG, 18 CÂU, CÓ TRƯỚC/SAU TỪNG DÒNG

`tools/fix-p2-test-data.mjs` in ra **giá trị TRƯỚC/SAU của từng dòng** và số dòng **thực sự bị đổi**
(`ROW_COUNT()`), không tin vào "kế hoạch". Kết quả: **18/18 dòng đổi đúng như kế hoạch.**

| Mã | Bảng · cột | Số dòng | TRƯỚC | SAU |
|---|---|---|---|---|
| **F1** | `purchase_orders.request_id` | **1** | `<NULL>` (PO-PRJ-DEMO-01-2026-0011) | `MR_46cee316-73f1-467b-905a-2c74f2bd5ce7` |
| **F2** | `purchase_orders.receiving_warehouse_id` | **1** | `WH_d5340a77-6434-4cf0-a5d4-e2aca5c3e0e3` *(không tồn tại)* | `WH_51e0f009-4873-4cb6-855c-e6e7fea41e4d` |
| **F3** | `goods_receipts.warehouse_id` | **1** | `WH_d5340a77-6434-4cf0-a5d4-e2aca5c3e0e3` *(không tồn tại)* | `WH_51e0f009-4873-4cb6-855c-e6e7fea41e4d` |
| **F4** | `goods_receipts.received_by` | **8** | `Thủ kho G` *(TÊN hiển thị)* | `USR_8984cf69-c2d7-4162-bb4f-03ab51427e1e` |
| **F5** | `material_requests.project_id` | **2** | `PRJ_62845d6e…` / `PRJ_daedb25b…` *(không tồn tại)* | `PRJ_fdbfab20-bf1f-4ad5-8159-7dcc582140c3` |
| **F6** | `purchase_orders.project_id` | **2** | `PRJ_daedb25b…` / `PRJ_62845d6e…` *(không tồn tại)* | `PRJ_fdbfab20-bf1f-4ad5-8159-7dcc582140c3` |
| **F7** | `material_request_items.material_id` | **3** | `MAT_b2eb5c6c…` / `MAT_37d40efe…` / `MAT_3814cf9d…` *(không tồn tại)* | `MAT_c3ff35ff-c562-4814-8b77-5e925e0d0589` |
| | **TỔNG** | **18** | | |

### 3.1 F1 — CHỌN PR NÀO VÀ VÌ SAO (đây là quyết định quan trọng nhất)

PO mồ côi `PO-PRJ-DEMO-01-2026-0011` (`PO_ae923bc9-65c4-4275-b6ab-fc3c81efe97a`) có `request_id = NULL`.
Chọn **`MR_46cee316-73f1-467b-905a-2c74f2bd5ce7`** — không phải theo cảm tính, mà theo **chính dòng của PO**:

```
purchase_order_items POI_9ad954e0-e17b-456f-b6e4-256d52274b17  (ordered_qty = 20, status = received)
        └─ request_item_id → material_request_items MRI_d1f57f9d-7b4f-4939-a854-bbc50f78c69d
                                 └─ request_id → MR_46cee316-73f1-467b-905a-2c74f2bd5ce7
                                       · project_id = PRJ_fdbfab20…  = ĐÚNG dự án của PO  ✔
                                       · status     = 'approved'      = ĐÚNG điều kiện tạo PO (L1427) ✔
```

⇒ PR cha **suy trực tiếp từ dòng PO** (không đoán), lại trùng dự án và đã đủ duyệt.
Điều kiện thật của mã bắt buộc phải có `request_id`: `create_po` (L1427) và `receive_goods` (L1504) đều
`JOIN material_requests` qua `purchase_orders.request_id`; `request_id` NULL thì PO **không nhận hàng được**.

### 3.2 Idempotent + lớp chặn

- `kiemTraChiUpdate()` chặn mọi câu không bắt đầu bằng `UPDATE` hoặc chứa từ khoá cấm ⇒ sai thì **dừng trước
  khi chạm CSDL**. Tệp seed vẫn giữ cam kết **"CHỈ INSERT"** vì phần UPDATE nằm ở tệp riêng.
- Mỗi lần sửa đều **qua bước DÒ** đúng dòng đang hỏng ⇒ **chạy lại lần 2: 0 dòng / 0 câu UPDATE** (đã đo).
- Hai lỗi tự phát hiện khi `--dry-run` và đã sửa trước khi chạy thật: (a) `mysql -N -B` in giá trị NULL ra
  **chuỗi `"NULL"`** làm bộ sinh câu lệnh suýt ghi chuỗi `'NULL'`/NULL vào cột NOT NULL; (b) F6 suy dự án cha
  **trước khi** F5 sửa xong nên vẫn ra id cũ.

---

## 4. PHÁT HIỆN: MỒ CÔI KHÔNG NẰM Ở "3 ID MR"

Đề bài dự đoán mồ côi tập trung ở **3 ID MR**. Đo trực tiếp bằng SQL cho thấy **rộng hơn nhiều**:

| Bảng đích còn thiếu bản ghi | Số ID THẬT |
|---|---|
| `material_requests` | **9** (không phải 3) |
| `material_request_items` | **14** |
| `purchase_orders` / `purchase_order_items` / `goods_receipts` / `goods_receipt_items` | 6 / 8 / 1 / 9 |
| **Tổng dòng mồ côi** | **335 = 113 tham chiếu TREO + 222 NULL** |

Bằng chứng đây là **một đợt seed cũ bị rollback**: dãy `request_no` của dự án mẫu khuyết đúng các số
**0001–0007, 0009**, và `procurement_allocations.reference_no` vẫn trỏ tới chúng. Tệp seed dựng lại PR với
**đúng các số đang khuyết** (bộ đếm `document_sequences` của app đang ở 124 ⇒ không bao giờ sinh trùng).

---

## 5. LỖI CỦA CHÍNH CỔNG ĐO (đã sửa, có test đỏ→xanh)

Bản cũ `tools/p2-reference-integrity.mjs` gán

```js
const rong = q.choNull ? <đếm NULL> : 0;      // p2-gates.mjs: moCoi = rong + treo
```

**NGƯỢC** với chính chú thích dòng 58 của tệp (*"cột cho phép NULL thì NULL KHÔNG tính là mồ côi"*)
⇒ 222 dòng NULL hợp lệ bị đếm thành mồ côi ⇒ cổng **không thể về 0**. Đây là **lỗi công cụ đo**, không phải
lỗi dữ liệu. Cách sửa theo đúng kiến trúc sẵn có: tách quyết định ra hàm thuần `mucDoMoCoi()` trong
`tools/lib/p2-gates.mjs` (viết test **RED trước** → ✖, sửa → **GREEN 13/13**), và cho đối chiếu chéo
`NOT EXISTS` dùng **cùng ngữ nghĩa NULL**. Đã theo đủ 4 điều kiện captain: commit riêng · báo cả 2 con số ·
giữ in số NULL riêng · chứng minh 335 → 113 **trước khi seed**.

---

## 6. RỦI RO CÒN LẠI / CẦN NGƯỜI DÙNG CHỐT

1. **⚠ Trùng `po_no` (rủi ro THẬT, CHƯA xử lý — ngoài phạm vi):** `PO-PRJ-DEMO-01-2026-0011` đang tồn tại
   nhưng `document_sequences` cho PO của dự án mẫu đang ở **10** ⇒ lần tạo PO kế tiếp của ứng dụng sẽ sinh
   **đúng `PO-PRJ-DEMO-01-2026-0011`** ⇒ **vi phạm UNIQUE `purchase_orders_no_uidx`**.
   Sửa cần đụng `document_sequences`/`scripts/**` ⇒ **không tự làm**, chỉ ghi nhận.
2. **Mồ côi CÓ TỪ TRƯỚC trong `procurement_allocations` (18 giá trị / 9 dòng)** — bảng này **không** được đợt
   seed ghi vào, nên đây là mồ côi sẵn có: `project_id` ∈ {`PRJ_370df722…`, `PRJ_62845d6e…`, `PRJ_daedb25b…`}
   (3 dòng mỗi id) và `material_id` ∈ {`MAT_37d40efe…`, `MAT_3814cf9d…`, `MAT_b2eb5c6c…`} (3 dòng mỗi id).
   **Không tự sửa** vì cả 2 cách đều phải *bịa* master data hoặc *đổi nghĩa chứng từ cũ*:
   (a) INSERT dự án/vật tư còn thiếu (phải đặt TÊN mới ⇒ thêm dòng vào danh mục dự án/vật tư **trên UI**);
   (b) UPDATE 18 giá trị về dự án/vật tư có thật (đổi nghĩa 3 chuỗi chứng từ).
3. **`unit_price` = 0 và `total_value` = 0** — đo được: **27/27** dòng PO có `unit_price = 0`, **17/17** PO có
   `total_value = 0`. **Không tự đặt giá** vì: (a) không cổng nào và không luồng nào cần giá để chạy đúng;
   (b) **chính ứng dụng cũng để 0** — `create_po` bind `total_value = 0` (L1440) và `update_po_price` (L1482)
   chỉ sửa `purchase_order_items.unit_price`, **không** cập nhật lại `purchase_orders.total_value`.
   ⇒ Nếu người dùng muốn giá demo, cần cho một đơn giá; đó là **dữ liệu bịa**, không tự thêm.
4. **Ánh xạ `id ↔ request_no` của 9 PR dựng lại là SUY LUẬN**: dữ liệu chỉ chứng minh các `request_no`
   0002–0007 **đang khuyết** và các dòng PR con còn treo; việc id-nào-ứng-số-nào là **quy ước của tệp seed**.
5. **222 → 221 dòng NULL không thể về 0 bằng INSERT** — nhưng với ngữ nghĩa đúng thì **NULL không phải mồ côi**
   ("chưa tới bước đó"), không phải tham chiếu hỏng.
6. **Bất nhất nội tại có sẵn:** 72 dòng `procurement_allocations` ở `stage='PO'`/`'MR'` có
   `purchase_order_item_id = NULL` ⇒ lượng đã đặt ở tầng allocation **không nối được** xuống dòng PO. Tệp seed
   giữ `mri.ordered_qty = SUM(poi.ordered_qty)` (để C2 xanh) nên các dòng PR dựng lại có `ordered_qty = 0`
   dù allocation tầng PO ghi 60/150 — **chưa đối soát được**, cần người dùng quyết có vá không (phải UPDATE).
7. **Đã thêm dữ liệu test vào CSDL `vntech_erp` thật** (81 dòng INSERT + 18 giá trị UPDATE, id mang tiền tố
   `P2SEED`/dải `9xxx`) theo chỉ đạo «insert/update tuỳ ý miễn là test thành công». Muốn gỡ phải `DELETE` —
   đợt này **cấm**, nên cần một lượt được người dùng cho phép riêng.

---

## 7. COMMIT (tách riêng theo yêu cầu của captain)

| # | Commit | Nội dung |
|---|---|---|
| 1 | **`ef8f672`** | `[PHASE 2 - TOOL]` sửa ngược nghĩa NULL ở cổng toàn vẹn (+ `mucDoMoCoi()` + test đỏ→xanh) |
| 2 | **`8b8c8ff`** | `[PHASE 2 - SEED]` `tools/seed-p2-test-data.mjs` — 81 dòng INSERT + ca 1 PR→2 PO |
| 3 | **`db0524c`** | `[PHASE 2 - DOCS]` hồ sơ TASK-108 (bản đầu, lúc mục 5 còn BLOCKED) |
| 4 | **`70888d1`** | `[PHASE 2 - FIX]` `tools/fix-p2-test-data.mjs` — 18 dòng UPDATE, gỡ BLOCKED |
| 5 | **`b436800`** | `[PHASE 2 - DOCS]` cập nhật TASK-108: cả 3 cổng ĐẠT + nhật ký UPDATE |

Nhánh `unity`. Không `git add -A`, không push. (Commit `89e75f5` nằm giữa #3 và #4 là của **phiên khác** —
TASK-109 + 1 tệp Java, không đụng tệp nào của đợt này.)

> Hash của tệp hồ sơ này **đổi mỗi lần `git commit --amend`**; các hash ở bảng trên là của commit **đã chốt**.
> Tra nhanh: `git log --oneline -1 -- tools/seed-p2-test-data.mjs` (và tương tự cho từng tệp).

---

## 8. KIỂM CHỨNG CUỐI — CHẠY LẠI TOÀN BỘ SAU KHI MÃ ĐÃ CHỐT

Chạy trên đúng revision hiện tại (HEAD `b436800`, cây làm việc không còn thay đổi nào của đợt này):

| Phép kiểm | Lệnh | Kết quả |
|---|---|---|
| Kiểu | `npx tsc --noEmit` | **exit 0 · 0 lỗi** |
| Lint | `npm run lint` | **exit 0 · 0 error** (186 warning có sẵn từ trước) |
| Hồi quy | `npm run test:regression` | **exit 0 · 69 tests / 69 pass / 0 fail / 0 cancelled** |
| Luồng nghiệp vụ | `npm run test:workflow` | **exit 0 · "FULL W2 passed"** |
| Test cổng đo | `node --import tsx --test tests/p2-gates-tools.test.mjs` | **exit 0 · 13 tests / 13 pass / 0 fail** |
| Màn dự án | `node tools/probe-project-screen.mjs` | **KẾT LUẬN: ĐẠT ✅** |
| Menu công việc | `node --import tsx tests/t01-work-menu-probe.mjs` | **7 ĐẠT · 0 HỎNG** |
| Cổng trace | `node tools/p2-trace-audit.mjs` | **exit 0 · ĐẠT 5/5 chặng** |
| Cổng split | `node tools/p2-split-po-audit.mjs` | **exit 0 · ĐẠT** |
| Cổng integrity | `node tools/p2-reference-integrity.mjs` | **exit 0 · ĐẠT 15/15 cặp** |

Ghi chú: các commit sau lần chạy này (nếu có) chỉ sửa **tài liệu** (`docs/**`) — phần mã đã kiểm ở trên
(`tools/**`, `tests/p2-gates-tools.test.mjs`) không đổi.

### Cách tái lập / kiểm chứng

```bash
node tools/seed-p2-test-data.mjs --dry-run     # xem kế hoạch INSERT, không chạm CSDL
node tools/seed-p2-test-data.mjs               # chèn (chạy lại = +0 dòng)
node tools/fix-p2-test-data.mjs --dry-run      # xem kế hoạch UPDATE kèm TRƯỚC/SAU
node tools/fix-p2-test-data.mjs                # sửa (chạy lại = 0 dòng)
node tools/p2-trace-audit.mjs                  # ⇒ ĐẠT, exit 0
node tools/p2-split-po-audit.mjs               # ⇒ ĐẠT, exit 0
node tools/p2-reference-integrity.mjs          # ⇒ ĐẠT, exit 0
node --import tsx --test tests/p2-gates-tools.test.mjs   # ⇒ 13/13
```
