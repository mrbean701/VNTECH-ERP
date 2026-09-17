# TASK-081 — Vá màu ô bị mất khi chuyển `DataTable` + **DỰNG LẠI** dữ liệu cha mồ côi

**Trạng thái:** ✅ DONE — `tsc` **exit 0** · eslint **0 error/74** · ảnh từng mồ côi **tải được (HTTP 200, PNG)**
**Ngày:** 17/09/2026 · **Nhánh:** `unity`
**Nguồn:** (1) cổng ảnh báo **8/28 → 10/28** sau TASK-079; (2) chỉ thị người dùng *"Ok dựng lại đi đỡ phải xóa"*.

---

## 1. Phần A — HAI Ô BỊ MẤT LỚP MÀU khi chuyển sang `DataTable` (hồi quy ẨN)

Cách tìm: so **markup bảng GỐC** (`git show f4067d9^:app/page.tsx`) với bản đã chuyển, tìm thuộc tính `<td>`/`<tr>` bị bộ chuyển đổi bỏ qua.

| Bảng | Ô bị mất | Hệ quả |
|---|---|---|
| `WorkCenter` | `<td className={r.late ? "red-text" : ""}>` | cột **"Quá hạn"** mất màu đỏ |
| `ProjectProgress` | `<td className={row.delta<0?"red-text":"green-text"}>` | cột **"CHÊNH LỆCH"** mất màu đỏ/xanh |

⚠️ **Vì sao cổng ảnh KHÔNG bắt được:** dữ liệu hiện tại chưa có dòng nào quá hạn / chênh lệch âm ⇒ cả hai
nhánh đều ra chuỗi rỗng ⇒ ảnh giống nhau. **Đây là hồi quy ẩn** (chỉ lộ khi có dữ liệu thật đúng loại đó).

**Đã sửa:** `DataTable.Column` thêm **`cellClassName?: (row, index) => string | undefined`** và ô dữ liệu áp lớp này;
2 cột trên được gắn `cellClassName` với **đúng biểu thức gốc**.

🔴 **Lỗi off-by-one của tôi khi vá (ghi lại):** tôi tìm dấu nháy đóng của `header` bằng
`indexOf('"', headerAt + 8)` — nhưng `headerAt + 8` **đã là dấu nháy MỞ**, nên `indexOf` trả về chính nó ⇒
chèn vào **giữa chuỗi**: `header: , cellClassName: …CHÊNH LỆCH", render: …` ⇒ `tsc` báo **4 lỗi cú pháp**.
**Đã hoàn tác tệp về commit sạch rồi chèn lại đúng vị trí** (`openQuote + 1`), kèm **hậu kiểm chống `header: ,`**.

## 2. Phần B — DỰNG LẠI dữ liệu cha (thay vì xoá) theo chỉ thị người dùng

Trước: `attachments` **1 dòng mồ côi** (chứng từ có `purchase_order_id` trỏ PO không tồn tại ⇒ Java trả **403**,
ảnh thật **không tải được**) + **10 tệp rời** trong `java-backend/data/files` **không có dòng DB** nào.

**Đã dựng lại (dùng dữ liệu THẬT sẵn có: dự án `PRJ-DEMO-01`, NCC, kho `KHO-DA-MAU-01`, người mua `trinhtrench`, người nhận `tkhodemo`):**

| Việc | Kết quả |
|---|---|
| (a) Tạo **PO còn thiếu** `PO-PRJ-DEMO-01-2026-0011` (số kế tiếp trong dãy thật) cho chứng từ mồ côi | `purchase_orders` **6 → 7** |
| (b) Tạo **10 phiếu nhập** mang **đúng ID** mà đường dẫn tệp đã trỏ tới, gắn vào **PO có thật**, + **10 dòng `attachments`** | `goods_receipts` **6 → 16** · `attachments` **1 → 11** |

**Bẫy đã gặp:** tên tệp `anh-giao-hang-985135.png` ⇒ tôi trích "giờ" = **98** ⇒ MySQL báo
`Incorrect datetime value '2026-02-01 98:51:35.000'` ⇒ **đã thêm kiểm hợp lệ giờ/phút/giây** (không hợp lệ thì dùng 08:30:00).

## 3. Kiểm chứng (bằng số + bằng đường tải thật)

| Phép kiểm | Trước | Sau |
|---|---|---|
| Chứng từ có PO **mồ côi** | 1 | **0** |
| Tệp `attachments` **mồ côi** | 1 | **0** |
| `attachments` có dòng DB | 1 | **11** (đủ 11 tệp trong kho) |
| **Tải ảnh `ATT_38f82d5c…`** (từng 403) | **403** | **HTTP 200 · `image/png` · 70 byte · chữ ký `89 50 4e 47`** ⇒ **tải được ẢNH THẬT** |
| `npm run typecheck` · eslint | — | **exit 0** · **0 error / 74 warning** |

## 4. Ghi chú về cổng ảnh 8/28 → 10/28 (đọc cho đúng, KHÔNG phải hồi quy mã)

Hai ảnh mới lệch là **`01-dashboard` (0 → 4 lỗi)** và **`04-team` (lệch to hơn)**.
**Nguyên nhân là DỮ LIỆU THAY ĐỔI do TASK-080**, không phải mã:
* `04-team`: bảng Tổ đội nay có **4 thành viên thật + tổ trưởng** (trước trống) ⇒ nội dung màn khác hẳn.
* `01-dashboard`: các số liệu tổng hợp đọc từ dữ liệu vừa nạp.
* `02-project`, `03-work`, `06-warehouse`, `07-admin` vẫn **0 px**; `05-material` là **lệch CÓ SẴN từ trước** (đã chứng minh bằng đối chứng `git stash` ở TASK-072).

⇒ **Việc cần làm (không phải sửa mã):** sau khi người dùng xác nhận dữ liệu mới là đúng, **cập nhật ảnh chuẩn**
bằng `node tools/probe-visual-regression.mjs --update` (tiền lệ đã ghi ở `TASK-003.md`: khi số liệu lệch vì **dữ liệu**, đính chính ảnh chuẩn chứ không sửa CSS).

## 5. Tệp thay đổi

| Tệp | Nội dung |
|---|---|
| `app/components/ui/DataTable.tsx` | thêm `cellClassName?: (row, index) => string` + áp vào `<td>` |
| `app/page.tsx` | gắn `cellClassName` cho 2 cột (`WorkCenter` "Quá hạn" · `ProjectProgress` "CHÊNH LỆCH") |
| `tools/task081-rebuild-parents.mjs` | **MỚI** — sinh SQL dựng lại dữ liệu cha từ tệp trong kho + dữ liệu thật |
| `docs/agent-progress/TASK-081.md` | hồ sơ này |

## 2b. 🔴 LỖI THỨ HAI CỦA TÔI trong phần dựng lại — CẮT CHUỖI SAI (tự phát hiện rồi tự vá)

Sau khi dựng, kiểm qua API thì **tên tệp hiện sai**: `7fcd-41e8-843a-08b4620b68b5-anh-giao-hang-985135.png`.
**Nguyên nhân:** tôi tách `attId`/`fileName` bằng **dấu `-` ĐẦU TIÊN**, nhưng khoá tệp có dạng
`ATT_<uuid 4 nhóm>-<tên tệp>` ⇒ `ATT_e84bf5fc` bị cắt cụt và phần uuid còn lại lẫn vào tên hiển thị.

**Đã sửa:** tách theo **MẪU** `^(ATT_[0-9a-f]{8}-…-[0-9a-f]{12})-(.+)$` → sửa **10 dòng** (đúng `id` + đúng tên),
và **vá cả script nguồn** `tools/task081-rebuild-parents.mjs` để lần chạy sau không lặp lỗi.
⇒ Đây là lỗi thứ hai trong cùng một việc — **bài học: kiểm lại KẾT QUẢ qua API sau khi ghi dữ liệu,
không chỉ kiểm số dòng.**

## 3b. Kiểm chứng cuối qua PROXY `:9000` (đúng đường người dùng dùng)

| Chứng từ | Tệp | Tải về |
|---|---|---|
| `GRN_b1cbfe5f…` (**từng mồ côi**) | `anh-giao-hang-161459.png` | **HTTP 200 · image/png · 70 byte · chữ ký `89 50 4e 47`** |
| `GRN_04bd4bcd…` (**vừa dựng lại**) | `anh-giao-hang-985135.png` | **HTTP 200 · image/png · 70 byte · chữ ký `89 50 4e 47`** |
