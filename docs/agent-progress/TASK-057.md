# TASK-057 — 4 khoá bootstrap **thiếu CỘT**: `issues` · `returns` · `transferOrders` · `productIdentity` — **DONE (#94)**

**Trạng thái:** **DONE — kiểm chứng lúc chạy 93/93** (probe `probe-task050-bootstrap.mjs` mở rộng)
**Ngày:** 17/09/2026 · **Phát hiện bởi:** cổng mới `tools/probe-column-parity.mjs` (TASK-056)

---

## 1. Bốn khoá đã vá (đều đã **đọc cặp SQL hai phía** trước khi kết luận)

| Khoá | JS | Java trước | Ảnh hưởng NGƯỜI DÙNG (đo được trong `app/page.tsx`) |
|---|---|---|---|
| `issues` | `:615` | thiếu `si.received_by_name AS receivedByName` và `COALESCE(sia.installed_qty,0) AS installedQty` (thiếu cả `SUM(installed_qty)` ở truy vấn con) | `:963` cột **"Người nhận"** trống; `:2219` cột **"Đã xác nhận lắp"** của bảng *Lũy kế xuất / hoàn theo tổ đội* **luôn 0** |
| `returns` | `:619` | thiếu `mr.returned_by_name AS returnedByName` | `:965` cột **"Người trả"** trống |
| `transferOrders` | `:713` | chỉ **14/21** cột: thiếu `sourceProjectId`, `destinationProjectId`, `approvedAt`, `shippedAt`, `receivedAt`, `shippedQty`, `receivedQty`; và **thiếu bộ lọc theo kho** của `:714` | `:1745` bảng *Phiếu điều chuyển đang xử lý*: **"Đã xuất"/"Đã nhận" luôn 0**; `:2238` lọc theo dự án sai (thiếu `sourceProjectId`/`destinationProjectId`). **Bảo mật:** trước đây thủ kho thấy phiếu điều chuyển của **mọi** kho |
| `productIdentity` | `:666` | trả `id` thay vì `id AS productId` | `data.productIdentity.productId` là **`undefined`** (UI đang đọc hằng số `VNTECH_BRAND` nên chưa lộ, nhưng hợp đồng dữ liệu phải khớp JS) |

**Kèm theo (dọn kỹ thuật):** chuyển `roleBaseClean` + `scopeKind` **lên đầu `load()`** vì nay dùng cho **3** bộ lọc (`:622` xoá trắng kho tổng, `:714` lọc điều chuyển theo kho, `:728-737` xoá trắng theo module).

## 2. Kiểm chứng lúc chạy

`tools/probe-task050-bootstrap.mjs` mở rộng **mục 6** → **93/93 ĐẠT** (trước 87/87), trong đó **đối chiếu GIÁ TRỊ theo TỪNG DÒNG với MySQL** (không chỉ "có tên cột"):
* `data.issues` có đủ 2 cột mới **và** `receivedByName` + `installedQty` **khớp MySQL từng dòng** ✔
* `data.returns` có `returnedByName` **và** khớp MySQL từng dòng ✔
* `data.productIdentity.productId` = `id` trong MySQL ✔
* `data.transferOrders`: **giới hạn nói rõ** — bảng `transfer_orders` đang **0 dòng** nên chỉ **cổng TĨNH** (`probe-column-parity.mjs`, so tập cột với JS) kiểm được phần cột; probe in thẳng *"KHÔNG kiểm được giá trị lúc chạy"* và **không** tính là ĐẠT.

**Cổng khác (không hồi quy):** `probe-column-parity.mjs` **13 → 9** khoá thiếu cột (4 khoá vừa vá đã **sạch**), đối chứng dương 4/4 · `probe-java-sql-live.mjs` **không phát sinh mới** (vẫn đúng 8 phát hiện nhóm 6 license) · `probe-schema-drift.mjs` **0 lệch**.

## 3. Còn lại — đã ghi thành việc riêng

9 khoá còn thiếu cột (chi tiết ở `TASK-056.md` mục 4). **Nghiêm trọng nhất: `workItems`** — Java thiếu **14 cột** và **thiếu hẳn mệnh đề lọc phòng ban của JS `:715`** ⇒ hiện trả **toàn bộ công việc của mọi phòng ban cho mọi tài khoản** (vừa sai dữ liệu hiển thị vừa lộ dữ liệu). Đã lên kế hoạch thành **TASK-058**.
