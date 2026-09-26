# TASK-025 — Sửa `SlaComplianceWorker` lỗi `bad SQL grammar` (worker SLA chưa bao giờ chạy)

**Trạng thái:** DONE · **Ngày:** 18/09/2026 · **Commit:** #34
**Nguồn gốc:** log server ghi WARN đều đặn mỗi giờ (08:02 / 09:02 / 10:02 / 11:02)
**Phân loại:** CONFIRMED (có đủ chuỗi bằng chứng Code → DB → API/Worker → hậu quả)

---

## 1. Hiện tượng

Log `java-backend` lặp đúng mỗi giờ một dòng WARN, không bao giờ thành công:

```
WARN c.v.e.i.worker.SlaComplianceWorker : SLA worker lỗi: ... bad SQL grammar ...
```

Vì worker ném lỗi ở bước SQL đầu tiên, **toàn bộ ba việc định kỳ của nó chưa từng được thực thi**:
đánh dấu bước cung ứng quá hạn, xử lý kế hoạch thanh toán quá hạn, nhắc xác nhận BCH.

## 2. Truy vết (không suy đoán)

### 2.1 Code

`infrastructure/.../SlaStoreAdapter.java` → `markStepOverdue` chạy:

```sql
UPDATE supply_workflow_steps SET status='overdue', overdue_at=?, updated_at=? WHERE id=? AND status='pending'
```

### 2.2 DB — cột `overdue_at` KHÔNG tồn tại ở bất kỳ đâu

| Nguồn lược đồ | Vị trí | Kết quả |
|---|---|---|
| MySQL baseline (Flyway V1) | `V1__baseline.sql:1795-1810` | **không có** `overdue_at` |
| SQLite runtime (drizzle) | `drizzle/0005_*.sql:31-49` | **không có** `overdue_at` |
| Toàn bộ `drizzle/0000`–`0108` | grep `overdue_at` | **0 kết quả** |

⇒ Đây là cột do phía Java **tự bịa ra**, không phải lược đồ thật.

### 2.3 JS tham chiếu

`scripts/system-route.mjs` (nguồn sự thật hành vi) **không hề dùng `overdue_at`** — nó chỉ ghi
`status='overdue'` + `updated_at`. Vậy cột này còn **thừa về mặt nghiệp vụ**, không chỉ sai về lược đồ.

## 3. Bản sửa

Bỏ hẳn cột bịa khỏi câu lệnh, giữ nguyên ngữ nghĩa nghiệp vụ (chỉ chuyển `pending` → `overdue`):

```sql
UPDATE supply_workflow_steps SET status='overdue', updated_at=? WHERE id=? AND status='pending'
```

Điều kiện `AND status='pending'` được giữ để **không ghi đè** bước đã `done`/`cancelled` (tính bất biến).
Một khối chú thích dài ngay trên câu lệnh ghi lại bằng chứng để đời sau không "khôi phục" lại cột sai.

## 4. Kiểm chứng

### 4.1 Biên dịch + đóng gói
| Bước | Kết quả |
|---|---|
| `verify-java-compile.ps1` | **102 file · 0 lỗi · 157 `.class` · exit 0** |
| `mvn -DskipTests package` | **BUILD SUCCESS** · jar `90,886,038 bytes` (fat jar — `repackage` thành công) |

### 4.2 Chạy thật — bằng chứng quyết định
Khởi động lại Java API (background job `pwsh-47`, PID 16952), `/actuator/health` = 200, proxy `:9000` = 200.

**Trước:** `WARN ... bad SQL grammar` (mỗi giờ)
**Sau:**
```
2026-09-17T11:57:05.037+07:00  INFO 16952 --- [vntech-erp-java] [scheduling-1]
  c.v.e.i.worker.SlaComplianceWorker : SLA worker: 29 supply steps quá hạn;
  0 payment plans quá hạn; 4 BCH chờ xác nhận.
```

Worker chạy trọn vẹn cả ba nhánh lần đầu tiên, và **xử lý thật 29 bước** (chuyển sang `overdue`).

## 5. Tác động dữ liệu (ghi nhận trung thực)

29 bước cung ứng được chuyển `pending` → `overdue`. Đây **chính là hành vi được thiết kế** của worker
(trước đây không xảy ra vì worker chết). Không phải mất/hỏng dữ liệu: bước chỉ đổi trạng thái,
không xoá, và điều kiện `status='pending'` bảo đảm không đụng vào bước đã hoàn tất.

## 6. Bài học

1. **Worker chết âm thầm là loại lỗi nguy hiểm nhất** — hệ thống vẫn chạy, UI vẫn mượt, chỉ có tác vụ nền
   thầm lặng không bao giờ hoàn thành. Log WARN lặp theo chu kỳ là dấu hiệu phải điều tra ngay.
2. **Không tin tên cột do code gợi ý** — phải tra tận lược đồ (`V1__baseline`, `drizzle/`) và đối chiếu JS.
   Một cột "nghe rất hợp lý" (`overdue_at`) vẫn có thể không tồn tại.
3. Khi sửa SQL hỏng, phải chạy lại tiến trình và **đọc log thật** — biên dịch thành công không chứng minh SQL đúng.

## 7. Kết luận

TASK-025 **DONE**. Không còn dòng WARN nào; worker SLA hoạt động đúng thiết kế.
Không phát sinh việc tồn đọng. Không chặn task nào khác.
