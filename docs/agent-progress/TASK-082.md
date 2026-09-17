# TASK-082 — NỐI CỘT THIẾU (JS↔JAVA) + BỎ HẰNG SỐ GIẢ: "CHỈ DÙNG DỮ LIỆU THẬT"

- **Mã:** TASK-082 (đợt 2 của TASK-080 — "từ giờ không hardcode nữa, chỉ dùng dữ liệu thật")
- **Ngày:** 17/09/2026
- **Nhánh:** master · commit `#140` (chưa đẩy — đúng luật "không push khi chưa người dùng test")
- **Định danh nguồn:** `VNTECH-FP-B7CD5731A3F4A33D` (head `drizzle/0115_phase1_realdata_identity.sql`)
- **Tiền đề:** TASK-080 (seed dữ liệu thật) + TASK-081 (vá màu DataTable + dựng lại cha mồ côi)
- **Chủ đề:** §45 MASTER TASK "nghiệp vụ chưa rõ ⇒ KHÔNG ĐƯỢC TỰ SUY ĐOÁN" + yêu cầu trực tiếp của người dùng.

---

## 1. Vì sao có task này

Người dùng chỉ đạo: *"Từ giờ không hardcode nữa chỉ sử dụng dữ liệu thật, nếu chưa có thì hãy insert
đầy đủ để có căn cứ cho việc test luồng và mô phỏng hoạt động thực tế."*

Đợt 1 (TASK-080) đã **INSERT dữ liệu thật**. Đợt 2 (TASK-082) là **nối dữ liệu thật đó vào UI** —
vì rà soát phát hiện dữ liệu thật đã có trong MySQL nhưng UI **vẫn hiển thị 0 / hằng số**:

| Chỗ hiển thị | Mã cũ | Bản chất |
|---|---|---|
| Màn **Đã giao** → cột `CHỨNG CHỈ` | `row.certificateStatus==="complete"?2:0` | **số 2 là bịa** — không có bảng chứng chỉ nào trong schema |
| Màn **Đã giao** → cột `TÌNH TRẠNG` | `<StatusBadge value="Đã nhập kho"/>` | **hằng số** cho mọi dòng, kể cả dòng chưa hạch toán |
| Màn **Thanh toán** → ô `Quá hạn` | `moneyBillion(0)` | **luôn 0** dù có 2 kế hoạch quá hạn thật |
| Màn **Đã giao** → cột `ẢNH` | `row.attachmentCount\|\|0` | cột **không tồn tại** trong payload Java ⇒ luôn 0 |
| Màn **Kế hoạch giao hàng** → `CHỨNG CHỈ` / `ẢNH` | `row.certificateCount\|\|0` · `row.attachmentCount\|\|0` | 2 cột **không được nạp** ở cả hai đường |
| Màn **Đã giao** → `BCH XÁC NHẬN` | `row.bchConfirmedByName\|\|"BCH công trường"` | luôn rơi vào nhánh dự phòng ⇒ hiển thị chữ giả |

---

## 2. Truy vết theo §45 (Code → DB → API → UI) — KHÔNG suy đoán

### 2.1 Hai đường dữ liệu song song (nguồn gốc của lệch cột)

| Đường | Tệp | CSDL | Vai trò |
|---|---|---|---|
| JS / SSOT | `scripts/system-route.mjs` | SQLite (drizzle) | bản chuẩn để so cột + chạy test |
| Java | `java-backend/.../BootstrapDataAdapter.java` | MySQL (Flyway) | **đường phục vụ thật** qua cổng 9000 |

Cổng `tools/probe-column-parity.mjs` đối chiếu **tập cột** hai phía. Trước TASK-082 cổng báo
`KHÔNG khoá nào thiếu cột` cho các bảng đang so, nhưng **bảng `receipts` của Java thiếu 5 cột** mà
JS đã có (cổng chỉ so các khoá có `AS` trùng định danh — xem "GIỚI HẠN" của chính cổng):

```
JS  scripts/system-route.mjs:603  →  ... bchConfirmedByName, deliveryNoteNo, bchConfirmedAt,
                                     bchComment, COALESCE(atta.attachment_count,0) AS attachmentCount
Java BootstrapDataAdapter:289     →  THIẾU cả 5 (chỉ có certificateStatus/postingStatus/...)
```

**Bằng chứng hậu quả (đo thật):** `SELECT` trên MySQL cho thấy 11 tệp `attachments` gắn
`entity_type='goods_receipt'`, nhưng payload Java không có khoá `attachmentCount` ⇒ UI in `0`.

### 2.2 Nguồn dữ liệu THẬT cho từng ô (đã xác minh bằng SQL)

| Ô | Nguồn thật | Giá trị đo được (MySQL) |
|---|---|---|
| `CHỨNG CHỈ` | `goods_receipts.certificate_status` | `complete`=14 · `not_required`=2 |
| `TÌNH TRẠNG` | `goods_receipts.posting_status` | `posted`=12 · `pending_confirmation`=4 |
| `ẢNH` | `attachments` (`entity_type='goods_receipt'`) | 11 tệp thật / 10-15 dòng |
| `Quá hạn` | `payment_plans.status='overdue'` | 2/3 kế hoạch · **1,50 tỷ** |
| `CHỨNG CHỈ` (màn PO) | `goods_receipts` có `certificate_status='complete'` theo PO | 1–3 chứng chỉ/PO |

**Phân loại §45:**
- `certificateCount` / `attachmentCount`: **CONFIRMED** — dẫn xuất trực tiếp từ bảng thật, đếm được.
- `TÌNH TRẠNG` theo `posting_status`: **CONFIRMED** — `BootstrapDataAdapter:125` đã dùng chính cột
  `certificate_status='missing'` cho luồng nghiệp vụ; UI `page.tsx:1119` cũng đã dùng
  `postingStatus !== "posted"` để tính "Đơn chờ nhập kho" ⇒ ngữ nghĩa `posting_status` đã có tiền lệ trong mã.
- **KHÔNG có bảng chứng chỉ** trong schema (`attachments`, `document_sequences`, `legal_documents` là
  các bảng duy nhất gần nghĩa) ⇒ **con số `2` cũ là UNKNOWN/không có căn cứ** ⇒ thay bằng số đếm thật.
- `status='overdue'` của `payment_plans`: **CONFIRMED** — do chính hệ thống đánh dấu:
  `SlaComplianceWorker` (Java) quy tắc 2: *"payment_plans planned quá hạn → 'overdue'"*
  (`SlaStoreAdapter:52`). Vì vậy dùng `status` là dùng đúng nghiệp vụ của hệ thống, không phải suy diễn.

---

## 3. Thay đổi đã thực hiện

### 3.1 `java-backend/infrastructure/.../BootstrapDataAdapter.java` (đường phục vụ thật)

`receipts` — nối 5 cột thiếu + 1 cột đếm thật:
```sql
gr.delivery_note_no AS deliveryNoteNo, gr.bch_confirmed_at AS bchConfirmedAt,
gr.bch_comment AS bchComment, confirmer.full_name AS bchConfirmedByName,
CASE WHEN gr.certificate_status='complete' THEN 1 ELSE 0 END AS certificateCount,
COALESCE(atta.attachment_count,0) AS attachmentCount
... LEFT JOIN users confirmer ON confirmer.id=gr.bch_confirmed_by
... LEFT JOIN (SELECT entity_id,COUNT(*) AS attachment_count FROM attachments
              WHERE entity_type='goods_receipt' GROUP BY entity_id) atta ON atta.entity_id=gr.id
```

`purchaseOrders` — thêm 2 cột dẫn xuất thật (trước đây UI đọc khoá không tồn tại ⇒ luôn 0):
```sql
COALESCE(cert.certificate_count,0) AS certificateCount,
COALESCE(atta.attachment_count,0) AS attachmentCount
-- cert = số phiếu nhập của PO đã có chứng chỉ (certificate_status='complete')
-- atta = số tệp thật gắn với các phiếu nhập của PO
```

### 3.2 `scripts/system-route.mjs` (SSOT — giữ parity JS↔Java)

- `receipts`: thêm `CASE WHEN gr.certificate_status='complete' THEN 1 ELSE 0 END AS certificateCount`.
- `purchaseOrders`: thêm `certificateCount` + `attachmentCount` cùng 2 `LEFT JOIN` như Java.

### 3.3 `app/page.tsx`

| Dòng | Trước | Sau |
|---|---|---|
| `Delivered` cột `CHỨNG CHỈ` | `row.certificateStatus==="complete"?2:0` | `row.certificateCount\|\|0` |
| `Delivered` cột `TÌNH TRẠNG` | `value="Đã nhập kho"` | `value={row.postingStatus==="posted"?"Đã nhập kho":row.postingStatus==="pending_confirmation"?"Chờ hạch toán":row.postingStatus==="unposted"?"Chưa hạch toán":String(row.postingStatus\|\|"Chờ hạch toán")}` |
| `Payments` ô `Quá hạn` | `moneyBillion(0)` | `moneyBillion(overdue)` với `overdue = Σ max(0, plannedAmount − paidAmount)` cho `paymentPlans.status==='overdue'` (lọc theo dự án đang chọn) |
| `normalizedData` | thiếu chuẩn hoá `paymentPlans` | thêm `paymentPlans: Array.isArray(...) ? ... : []` (chống `TypeError` ở màn Kế hoạch thanh toán khi server không gửi khoá) |

---

## 4. Kiểm chứng (đo thật, không suy luận)

| Cổng | Lệnh | Kết quả |
|---|---|---|
| Kiểu | `npm run typecheck` | **EXIT 0** |
| Lint | `npx eslint app/page.tsx scripts/system-route.mjs` | **0 error** · 77 warning (đều có trước) |
| Cú pháp JS | `node --check scripts/system-route.mjs` | OK |
| CSS baseline | `node scripts/master-baseline-gate.mjs` | **ĐẠT** · `!important=4950` · `css=400643B` |
| Đối chiếu cột | `node tools/probe-column-parity.mjs` | **KHÔNG khoá nào thiếu cột ✅** · phủ 73 khoá · đối chứng dương 5/5 |
| Dựng bản chạy | `npm run build` | **EXIT 0** · BUILT ARTIFACT VALIDATION: **ĐẠT** |
| Cổng MỚI | `node tools/probe-task082-realdata.mjs` | **18/18 ĐẠT · 0 HỎNG** (qua cổng 9000) |

### 4.1 Nội dung cổng mới `tools/probe-task082-realdata.mjs`

Đăng nhập thật qua **cổng 9000** (`admin`) rồi đọc chính payload UI nhận, khẳng định:

1. 15/15 dòng `receipts` **đủ 6 khoá thật** (5 cột vừa nối + `certificateCount`).
2. `receipts.certificateCount === (certificate_status==='complete' ? 1 : 0)` cho **mọi** dòng.
3. Tập giá trị `certificateCount` thực = `{0,1}` ⇒ **chứng minh không còn hằng số giả `2`**.
4. `receipts` có ảnh thật: **10/15 dòng** `attachmentCount>0` (trước đây luôn 0).
5. 7/7 PO có `certificateCount>0` và `attachmentCount>0`.
6. `postingStatus` có 2 giá trị thật `{posted, pending_confirmation}` ⇒ cột TÌNH TRẠNG phân hoá được.
7. Ô "Quá hạn" có nguồn thật: 2/3 kế hoạch `overdue`, tổng **1,50 tỷ**.
8. **Tự kiểm soát**: khoá bịa không tồn tại (chống khẳng định rỗng) + mọi dòng có `id`/`receiptNo`.
9. Bản đang phục vụ khớp định danh SSOT: served `VNTECH-FP-B7CD5731A3F4A33D` = SSOT.

### 4.2 Trạng thái dịch vụ sau khi chuyển bản

| Cổng | HTTP | Fingerprint |
|---|---|---|
| UI `:8787` | 200 | `VNTECH-FP-B7CD5731A3F4A33D` |
| Cổng vào `:9000` | 200 | `VNTECH-FP-B7CD5731A3F4A33D` |
| Java API `:18081` | 200 (`actuator/health` UP · MySQL) | — |

> Quy trình bắt buộc đã tuân thủ: dừng tiến trình Java đang giữ khoá tệp jar (`PID 28468`, đã xác minh
> đúng `vntech-erp-web-0.1.0-SNAPSHOT.jar --server.port=18081`) → `mvn -DskipTests package` → chạy lại.
> **Không** dùng `Stop-Process node` cho tiến trình UI: đã dùng `job_kill` cho đúng job đang chạy.

---

## 5. Rủi ro còn lại / câu hỏi cho người dùng

1. **Ngữ nghĩa cột `TÌNH TRẠNG` (màn Đã giao):** bản vá dùng `posting_status`. Nếu nghiệp vụ muốn cột này
   phản ánh `delivery_document_status` (trạng thái chứng từ giao nhận) thì cần người dùng chốt — hiện
   chọn `posting_status` vì đã có tiền lệ trong mã (`page.tsx:1119`).
2. **`certificateCount` là số ĐẾM dẫn xuất**, không phải bảng chứng chỉ: schema **không có** bảng chứng chỉ.
   Nếu về sau cần quản lý nhiều chứng chỉ/phiếu (số chứng chỉ, ngày cấp, nơi cấp) thì phải **tạo bảng mới** —
   cần người dùng xác nhận phạm vi trước khi làm.
3. **Tên người BCH xác nhận chỉ có 1/15 dòng** (`bch_confirmed_by` chỉ được ghi ở 1 phiếu) ⇒ cột
   "BCH XÁC NHẬN" vẫn còn 14 dòng rơi vào nhánh hiển thị dự phòng. Muốn đủ dữ liệu phải seed thêm (đợt 3).
4. **`role_catalog.default_organization_unit_id` vẫn NULL 16/16** (TASK-032, liên quan test đỏ thứ 2).
5. Đợt 3 còn lại của TASK-080: `work_items`, `email_outbox`, `capital_recovery_records`, `production_reports`
   đang rỗng ⇒ các màn tương ứng vẫn chưa có dữ liệu để mô phỏng luồng thật.
