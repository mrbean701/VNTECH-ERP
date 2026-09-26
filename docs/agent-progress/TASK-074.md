# TASK-074 (P-05 / MASTER TASK §8.2) — Đưa "Tổng hợp giao nhận" ra **MODAL RIÊNG**

**Trạng thái:** ✅ DONE (mã) — **cổng kiểu exit 0** · `EntityDetailModal` **0 → 1 lần DANG DUNG** · eslint **0 error**
⚠️ **Kiểm chứng lúc chạy/ảnh vẫn BỊ CHẶN bởi TASK-034** (`dist` cũ hơn nguồn ~13 giờ) — xem mục 5.
**Ngày:** 17/09/2026 · **Nhánh:** `unity`
**Nguồn đặc tả:** `docs/24` §15 dòng 4 — *"'Tổng hợp giao nhận' **bị ép vào layout chi tiết** → cần **modal riêng**"* (nguồn ghi: §8.2) · roadmap `P-05`, phụ thuộc `U-01`.

---

## 1. Hiện trạng trước khi sửa (đo được)

Trong `RequestDrawer`, khối "Tổng hợp giao nhận về phiếu đề nghị gốc" là **một `<section>` nằm giữa
layout chi tiết phiếu**, chứa **bảng 13 cột** (`data-contract="VNTECH_REQUEST_DETAIL_ALL_LINES_V1"`,
**1433 ký tự**, đúng 13 `<th>`) — tức toàn bộ bảng rộng bị **nhồi vào dải dọc của drawer**, đúng như
mô tả "bị ép vào layout chi tiết".

## 2. Đã sửa — chuyển bảng ra modal, **KHÔNG cắt nội dung**

| Phần | Trước | Sau |
|---|---|---|
| Tiêu đề khối | `CardHead` trong drawer | **giữ nguyên** trong drawer (người dùng vẫn thấy lối vào) |
| **Cảnh báo chặn duyệt** (`Số dòng chi tiết tải về không khớp… Không được duyệt cho tới khi tải đủ dữ liệu.`) | trong drawer | **GIỮ NGUYÊN trong drawer** — đây là điều kiện chặn nút Duyệt nên **không được** giấu vào modal |
| Bảng 13 cột | nhồi trong drawer | **chuyển NGUYÊN VĂN** vào `EntityDetailModal` (dùng chung, `U-01`), mở bằng nút `◉ Tổng hợp giao nhận (n dòng)` |

**Chữ trên nút không tự đặt mới:** `◉` là glyph đã dùng cho các nút "xem" hiện có; *"Tổng hợp giao nhận"*
lấy **nguyên văn** từ tiêu đề khối cũ ⇒ đúng quy tắc #7 của dự án (mọi chữ phải lấy từ markup cũ).

**Vì sao đặt modal ở cuối drawer (ngoài `<aside>`, cùng gốc với overlay), không nhét trong `drawer-body`:**
`EntityDetailModal` dựng `.overlay` với `position:fixed`. Mà `.overlay` của drawer có `backdrop-filter`
⇒ **tạo containing block cho phần tử `position:fixed` bên trong**. Đặt modal cùng cấp với `<aside>` để
loại hẳn mọi tương tác containing-block/`overflow` của `drawer-body`, đúng yêu cầu §5/U-10
(**modal KHÔNG được vượt viewport**).

## 3. Kiểm chứng

| # | Phép kiểm | Kết quả |
|---|---|---|
| 1 | `npm run typecheck` (`tsc --noEmit --incremental false`) | **exit 0** — JSX cân bằng (nếu thiếu/thừa thẻ thì `tsc` báo ngay) |
| 2 | Cổng **áp dụng thật** `tools/probe-ui-adoption.mjs` | `EntityDetailModal` **0 → 1 lần DANG DUNG** · `ApprovalTimeline` giữ **1** |
| 3 | `npx eslint app/page.tsx` | **0 error · 72 warning** (mốc nền ghi ở TASK-033 là 74 ⇒ **không phát sinh cảnh báo mới**) |
| 4 | Hậu kiểm của chính script sửa | bảng còn **nguyên 1 lần** · modal gắn **1 lần** · **không còn** bảng ép trong drawer (3/3 ĐẠT) |
| 5 | Cổng ảnh 28 ảnh × 4 kích thước | xem mục 5 — **8/28 ảnh lệch CÓ SẴN** (dữ liệu), giống hệt trước thay đổi |

## 4. Đóng góp vào tiến độ

* `P-05` → **DONE** (mục roadmap).
* `U-01` `EntityDetailModal`: `KHUNG-XONG / AP-DUNG 0` → **`DONE / AP-DUNG 1`** — cùng quy ước đã áp cho
  `U-06` ở TASK-072 (*khung xong nhưng chưa áp dụng thì KHÔNG tính DONE*).
* `U-14` (**ÁP DỤNG** `EntityDetailModal`) **giữ nguyên** `còn 4 chỗ tự viết .overlay`: task này **tạo mới**
  một modal bằng component dùng chung, **không** chuyển hoá chỗ tự viết nào ⇒ **không được trừ số**.

## 5. Giới hạn (ghi rõ, không giấu)

1. 🔴 **KHÔNG kiểm được bằng mắt / bằng probe lúc chạy**: `dist` mới nhất **17/09 09:35:52** vs nguồn
   **17/09 22:49:00** và `scripts/local-server.mjs:20` nạp `dist/server/index.js` **lúc khởi động**
   ⇒ UI đang phục vụ **bundle cũ**, thay đổi này **chưa có hiệu lực lúc chạy**. Đây là **TASK-034**
   (đường găng) — **chờ người dùng cho phép tái lập dấu vân tay nguồn**.
2. Cổng ảnh 28 ảnh **không phủ màn chi tiết phiếu** (Known Problem #68) ⇒ cổng ảnh chỉ chứng minh
   *"không hỏng 7 màn danh sách"*, **không** chứng minh modal mới hiển thị đúng.
3. Bảng trong modal **không có trạng thái rỗng** (phiếu 0 dòng ⇒ chỉ hiện dòng tiêu đề) — **giữ nguyên
   hành vi cũ**, không mở rộng phạm vi; việc thay bằng trạng thái rỗng dùng chung thuộc `U-15`.
4. `§8.2` trong `docs/24` chỉ có **một dòng mô tả** (bảng §15 dòng 4) — không có đặc tả chi tiết hơn về
   bố cục modal, nên phần trình bày bám theo component dùng chung đã có (không tự thiết kế thêm).

## 6. Tệp thay đổi

| Tệp | Thay đổi |
|---|---|
| `app/page.tsx` | `RequestDrawer`: thêm state `summaryOpen`; bảng 13 cột → nút mở modal; gắn `EntityDetailModal` cuối drawer (**+766 ký tự**, bảng chuyển nguyên văn) |
| `docs/25_TODO_ROADMAP.md` | `P-05` → DONE · `U-01` → DONE / AP-DUNG 1 |
| `docs/agent-progress/{MASTER_STATUS,TASK_INDEX}.md` | mốc trạng thái + dòng task |
