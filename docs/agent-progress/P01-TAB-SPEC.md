# P-01 — ĐẶC TẢ TÁCH MR · PR · PO THÀNH 3 TAB (đã xác minh bằng dữ liệu THẬT)

- **Ngày:** 20/09/2026 · **Trạng thái:** ĐẶC TẢ XONG (chờ code) · **Nguồn:** MySQL thật + mã nguồn thật
- **Nguyên tắc (§45):** ngữ nghĩa MR/PR/PO **rút ra từ dữ liệu + code**, KHÔNG suy đoán.

## 1. BẰNG CHỨNG (đo được)

### DB — không có bảng PR riêng
`information_schema` cho thấy **KHÔNG có `purchase_requests`**; chỉ có:
`material_requests` (**17 dòng**) · `material_request_items` · `purchase_orders` (**7 dòng**) · `purchase_order_items`

### Phân bố trạng thái THẬT của `material_requests`
| `status` | `supply_status` | `approval_stage` | Số dòng |
|---|---|---|---|
| `pending_approval` | `approval_pending` | 1 | **7** |
| `approved` | `awaiting_bch_confirmation` | 5 | 4 |
| `approved` | `awaiting_po` | 5 | **4** |
| `approved` | `partial_delivery` | 5 | 2 |

### `purchase_orders`
`completed` 2 · `delivered_pending_confirmation` 4 · `pending_approval` 1

### Mã nguồn (bằng chứng độc lập)
`app/screens/Purchasing.tsx:19` lọc **`row.supplyStatus === "awaiting_po"`** trên `data.requests` ⇒ **“PR/PO chờ” được SUY RA từ `material_requests`**, không phải bảng riêng ✔

## 2. NGỮ NGHĨA CHỐT (theo dữ liệu)

| Tab | Nguồn | Điều kiện lọc | Số dòng hiện tại |
|---|---|---|---|
| **MR** — Phiếu đề nghị (chờ duyệt) | `data.requests` | `status === "pending_approval"` | **7** |
| **PR** — Đã duyệt / chuẩn bị lên PO | `data.requests` | `status === "approved"` (mọi `supply_status`: awaiting_bch_confirmation · awaiting_po · partial_delivery) | **10** |
| **PO** — Đơn mua hàng | `data.purchaseOrders` | (tất cả) | **7** |

**Cột hiển thị mỗi tab (lấy từ trường ĐÃ XÁC MINH):**
- MR: `requestNo` · `projectId` · `requestedBy` · `requestedAt` · `neededAt` · `status` · `itemCount` · `totalEstimatedValue`
- PR: như MR + **`supplyStatus`** (giai đoạn cung ứng) + `approvalStage`
- PO: `poNo` · `supplierId` · `orderedAt` · `eta` · `status` · **`totalValue`** (báo cáo R-02c đã xác minh PO dùng `totalValue`)

## 3. KẾ HOẠCH THỰC HIỆN (nhỏ, có kiểm thử)

1. Trong `app/screens/Purchasing.tsx`: thêm **thanh 3 tab** (MR · PR · PO) **kèm số đếm**, state `activeTab` cục bộ (`useState`).
2. Mỗi tab render **một bảng** theo bộ lọc ở mục 2, **giữ nguyên** các khối hiện có đang dùng (bảng hệ thống BOQ + lũy kế vật tư) hoặc đưa vào tab PO (cần đọc kỹ màn hiện tại trước khi di chuyển — **không làm mất chức năng đang có**).
3. **Không đổi API/DB** (chỉ là tổ chức lại UI) ⇒ rủi ro thấp; sau khi sửa: `tsc` + `npm test` + **cổng ảnh** (thêm màn purchasing vào probe nếu chưa có) + build.
4. Ghi rõ trong commit: số dòng mỗi tab **khớp dữ liệu thật** (7 / 10 / 7).

## 4. RỦI RO / LƯU Ý

- **Không** được tự thêm tab “PR” nếu PR không tồn tại như thực thể ⇒ nay đã xác minh: **PR là tập con của `material_requests` (đã duyệt)** ⇒ ghi rõ ngay trên UI để tránh hiểu nhầm.
- Màn hiện tại có **khối BOQ/giá** (nhập giá, tải template) ⇒ khi tách tab **phải giữ nguyên** (nếu di chuyển mà làm hỏng luồng nhập giá thì **tệ hơn** việc không tách) ⇒ **kiểm thử lại luồng nhập giá** sau khi sửa.
