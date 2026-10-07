# KẾ HOẠCH DỌN 6 PHIẾU KẸT `in_transit` — đo đủ để làm trong 2–3 lời gọi

| | |
|---|---|
| **Ngày đo** | 06/10/2026 · ⭐ **sau khi đã triển khai 9 bản vá** (JAR 06/10 09:33:25) |
| **Mục đích** | ⭐ Dọn hàng kẹt **VÀ** `VERIFY` bản vá **`BUG-20261005-005`** (⭐ đang ở mức `FIXED`, ⭐ chưa `VERIFIED`) |
| **Trạng thái** | ⛔ **CHƯA LÀM** — ⚠️ cần ~12 lời gọi API, ⭐ ngân sách phiên trước đã cạn ⇒ ⭐ **⛔ không làm vội** (§9: fast but safe) |

---

## ① ĐÍNH CHÍNH 2 CON SỐ SAI CỦA TÔI (⭐ đo lại ngày 06/10)

| Tôi từng nói | ⭐ SỰ THẬT ĐO ĐƯỢC |
|---|---|
| «**12 đơn vị** hàng kẹt ở `WH-TRANSIT`» | ⭐ **5 phiếu `central_returns`, mỗi phiếu 1 dòng, `proposed_qty` = 1,0000** ⇒ ⭐ **~5 đơn vị** ✓ |
| «kho `WH-TRANSIT`» | ⭐ **`id` = `WH-TRANSIT` nhưng `code` = `TRANSIT`** ⚠️ ⇒ ⭐ truy vấn `WHERE code='WH-TRANSIT'` **luôn rỗng** ⇒ ⭐ đó là lý do tôi «không thấy» sổ kho ✓ |

---

## ② DANH SÁCH 6 PHIẾU KẸT

**5 phiếu trả Kho Tổng** (`central_returns`, `status='in_transit'`):

| # | id | số dòng | `proposed_qty` |
|---|---|---|---|
| 1 | `CRET_353fad35-962a-40b2-a668-3c41f4728c62` | 1 | 1,0000 |
| 2 | `CRET_ed56987b-b988-444e-a988-0b3fc48942b6` | 1 | 1,0000 |
| 3 | `CRET_6f3e1066-4b89-48cf-9f5b-2a2dad3372ac` | 1 | 1,0000 |
| 4 | `CRET_64f79a2d-4f4d-4dac-a45a-afd28080a0d4` | 1 | 1,0000 |
| 5 | `CRET_b6dac1c5-9f92-4a3d-ab40-3d5058973b0b` | 1 | 1,0000 |

**1 phiếu điều chuyển kho** (`transfer_orders`, `status='in_transit'`) — ⚠️ truy vấn lấy id bằng:
```sql
SELECT id FROM transfer_orders WHERE status='in_transit';
```
⚠️ **Bảng này ⛔ KHÔNG có cột `order_no`** (⭐ dùng tên khác) và ⛔ **`central_returns` ⛔ không có `project_id`** (⭐ dùng `source_project_id`) ✓

---

## ③ ⭐ XÁC NHẬN `BUG-20261005-005` BẰNG SỔ KHO (⭐ bằng chứng đo được)

`stock_movements` — **96 dòng**, phân bố theo loại:
| `movement_type` | số dòng |
|---|---|
| `SMI` | 38 |
| `GRN` | 37 |
| `RET` | 10 |
| `TRF_SHIP` | ⭐ **6** |
| `CENTRAL_RETURN_SHIP` | ⭐ **5** |

⇒ ⭐ **Sổ kho CÓ ghi chặng GỬI ĐI** (`CENTRAL_RETURN_SHIP` ×5 khớp **đúng 5 phiếu** trả Kho Tổng ⭐ và `TRF_SHIP` ×6 khớp 6 phiếu điều chuyển) ⚠️ **NHƯNG THIẾU CHẶNG NHẬN** ⇒ ⭐ **hàng ra khỏi kho nguồn mà ⛔ không vào kho đích** ⇒ ⭐ **đúng là `BUG-20261005-005`** ✓
📊 **Tồn kho**: `KHO-E2E-01` = **48,0000** · ⚠️ `TRANSIT` = **0,0000** (⭐ đúng như dự đoán: chỉ có chặng gửi, ⛔ không có chặng nhận) ✓

---

## ④ ⭐ HỢP ĐỒNG API (⭐ đọc từ mã, ⛔ không đoán)

### `receive_central_return` — `StockManagementUseCase:895`
```java
String returnId = trim(payload.get("centralReturnId"));
List<?> rawLines = payload.get("lines") ...;                    // ⭐ BẮT BUỘC, không rỗng
if (!"in_transit".equals(sv(row,"status")) || rawLines.isEmpty()) throw ...
accessScope.requireWarehouseAccess(..., "Chỉ Thủ kho Tổng được nhận phiếu vào Kho Tổng.");
if (store.centralReturnImageCount(returnId) < 1)                 // ⚠️⚠️ CỔNG ẢNH
    throw Api("Phải tải ít nhất một ảnh kiểm đếm trước khi Kho Tổng xác nhận.");
// mỗi dòng: centralReturnItemId · countedQty · acceptedQty
if (source==null || counted<0 || accepted<0
    || accepted > counted + 1e-9
    || counted > proposedQty + 1e-9) throw Api("Kết quả kiểm đếm Kho Tổng không hợp lệ.");
```

### `receive_transfer_order` — `StockManagementUseCase:744`
```java
String transferId = trim(payload.get("transferOrderId"));
if (!"in_transit".equals(sv(t,"status"))) throw Api("Phiếu chưa ở trạng thái đang vận chuyển.");
List<?> rawLines = payload.get("lines") ...;
// mỗi dòng khớp theo: transferOrderItemId == item.id
```

---

## ⑤ ⚠️⚠️ TRỞ NGẠI LỚN NHẤT — **CỔNG ẢNH KIỂM ĐẾM** ⭐ **ĐÃ GIẢI MÃ HOÀN TOÀN**

⭐ **`centralReturnImageCount(returnId) < 1` ⇒ CHẶN** ⚠️

### ⭐⭐⭐ ĐIỀU KIỆN CHÍNH XÁC (⭐ đọc từ `WarehouseStockStoreAdapter:839`, ⛔ không đoán)
```java
public long centralReturnImageCount(String returnId) {
    Long n = jdbcTemplate.queryForObject("""
            SELECT COUNT(*) FROM attachments
            WHERE entity_type='central_return' AND entity_id=?
              AND lower(mime_type) LIKE 'image/%'""", Long.class, returnId);
    return n == null ? 0 : n;
}
```
⇒ ⭐ **CẦN ĐÚNG 1 DÒNG trong bảng `attachments`** với:
| Cột | ⭐ Giá trị cần |
|---|---|
| `entity_type` | **`'central_return'`** |
| `entity_id` | **id phiếu** (⭐ 5 id ở mục ②) |
| `mime_type` | ⭐ bắt đầu bằng **`image/`** (⭐ ví dụ `image/png`) |

### ⭐ ĐÃ TÌM: ⛔ **KHÔNG CÓ ACTION NÀO TÊN CHỨA «image» HAY «attach»**
- ⭐ Quét `ActionRbacRegistry`: **0 kết quả** cho cả «image» **và** «attach» ✓
- ⭐ Quét `SystemController`: ⛔ **không có `case` nào** về đính kèm (⭐ chỉ có 1 dòng `Content-Disposition: attachment` khi tải tệp) ✓
- ⭐ Quét toàn `java-backend`: chỉ có **hàm ĐẾM** (`centralReturnImageCount` · `goodsReceiptImageCount`) ⛔ **không có hàm GHI riêng cho ảnh phiếu** ✓

### ⭐⭐⭐ KẾT LUẬN: ẢNH GHI QUA **`FileStore`** (⭐ upload tệp), ⛔ KHÔNG QUA `save_*`
| ⭐ Thành phần | Vị trí |
|---|---|
| ⭐ **Hàm ghi ảnh** | `java-backend/infrastructure/.../persistence/FileStoreAdapter.java:145` — **`insertAttachment(id, entityType, entityId, fileName, storageKey, mimeType, uploadedBy, now)`** ✓ |
| ⭐ **Bảng** | **`attachments`** ✓ |
| ⭐ **Điều kiện cổng** | `entity_type='central_return'` · `entity_id=<id phiếu>` · `lower(mime_type) LIKE 'image/%'` ✓ |

### ⭐⭐⭐ CÁCH LÀM NHANH NHẤT (⭐ phiên sau — đọc 2 tệp này là đủ)
1. ⭐ **`tools/e2e/go-live-vong-doi-kho.mjs`** — ⭐ **CHÍNH LÀ công cụ đã ghi `attachments`** (⭐ quét ra nó ở cả mục `attachments` lẫn `receive_central_return`/`receive_transfer_order`) ⇒ ⭐ **đọc nó để lấy nguyên cách ghi ảnh + cách gọi nhận hàng** ✓
2. ⭐ **`tools/e2e/giai-doan-08a.mjs`** — ⭐ cách tạo **ảnh PNG 1×1 base64** hợp lệ ✓
3. ⭐ **`tools/e2e/client.mjs`** — ⭐ có hàm tải tệp (`taiTep`) ⭐ và ghi biên chứng ✓
⇒ ⭐ **SAO CHÉP cách của `go-live-vong-doi-kho.mjs`** nhưng ⭐ **NHẮM ĐÚNG 5 id ở mục ②** (⛔ đừng chạy lại chính nó vì nó **tạo phiếu mới**) ✓


⚠️ ⛔ **ĐỪNG chạy lại `go-live-chuoi-kho.mjs` / `go-live-vong-doi-kho.mjs`** để «dọn»: ⭐ chúng **TẠO PHIẾU MỚI** (⭐ rất có thể chính chúng đã tạo 5 phiếu kẹt này) ⇒ ⭐ **sẽ đẻ thêm rác** ✓
⇒ ⭐ **phải viết script NHẮM ĐÚNG 6 id ở mục ②** ✓

---

## ⑥ ⭐ KẾ HOẠCH ĐỀ XUẤT (⭐ 2–3 lời gọi khi có ngân sách)

1. ⭐ **Viết 1 script** `tools/e2e/don-transit-ket.mjs`:
   - Đăng nhập `admin` (⭐ hoặc tài khoản có `inventory.canApprove` — ⚠️ `receive_transfer_order` đòi quyền này)
   - Với **5 `central_returns`**: ⭐ tải 1 ảnh kiểm đếm (⭐ ảnh PNG 1×1 base64 như `giai-doan-08a.mjs` dùng) → ⭐ gọi `receive_central_return` với `lines[{centralReturnItemId, countedQty:1, acceptedQty:1}]`
   - Với **1 `transfer_order`**: ⭐ gọi `receive_transfer_order` với `lines[{transferOrderItemId, …}]`
   - ⭐ **In kết quả từng phiếu** (⭐ thành công/thất bại + thông điệp) — ⛔ **không dừng ở lỗi đầu tiên**
2. ⭐ **Chạy script** ⇒ ⭐ **dọn xong 6 phiếu** ✓
3. ⭐ **VERIFY**: ⭐ đếm lại `central_returns`/`transfer_orders` theo `status` (⭐ phải hết `in_transit`) **+** ⭐ đếm `stock_movements` phải **XUẤT HIỆN chặng nhận** (⭐ `CENTRAL_RETURN_RECEIVE` / `TRF_RECEIVE` hoặc tương đương) **+** ⭐ tồn `TRANSIT` phải về **0** và tồn `KHO-TONG` phải **tăng đúng số lượng** ✓
4. ⭐ **Chuyển `BUG-20261005-005` từ `FIXED` ⇒ `VERIFIED`** ✓

## ⑦ ⚠️ LƯU Ý AN TOÀN

- ⛔ **Không xoá phiếu** — ⭐ **nhận hàng** là cách dọn **đúng nghiệp vụ** ✓
- ⭐ **6 phiếu này là dữ liệu KIỂM THỬ** (⭐ `CRET_*` do bài E2E tạo) — ⚠️ **nhưng vẫn dọn theo nghiệp vụ, ⛔ không xoá tay** ✓
- ⚠️ **`central_returns` ⛔ không có cột `project_id`** (⭐ dùng `source_project_id`) · **`transfer_orders` ⛔ không có `order_no`** ⇒ ⭐ **đọc `SHOW COLUMNS` trước khi viết truy vấn** ✓
- ⭐ **Chạy `SHOW COLUMNS` trước mọi truy vấn mới** — ⭐ đã 3 lần dính lỗi tên cột trong phiên này ✓
