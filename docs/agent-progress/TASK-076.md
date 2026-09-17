# TASK-076 (`U-17` + `U-07`) — Hai dải tự viết CUỐI CÙNG đã chuyển sang `ActivityTimeline`

**Trạng thái:** ✅ DONE — `tsc` **exit 0** · cổng áp dụng **`ActivityTimeline` 0 → 2** và **0 chỗ dải tự viết** · eslint **0 error**
**Ngày:** 17/09/2026 · **Nhánh:** `unity` · **Cổng:** `tools/probe-ui-adoption.mjs`
**Nguồn:** `docs/25_TODO_ROADMAP.md` — `U-17` (*"ÁP DỤNG `ApprovalTimeline`/`ActivityTimeline` — dùng thật 0 lần; còn 3 chỗ tự viết dải"*) và `U-07` (`ActivityTimeline` dùng cho mọi lịch sử).

---

## 1. Hiện trạng trước khi sửa

Cổng đếm được **2 chỗ dải lịch sử tự viết** (sau khi TASK-072 đã chuyển dải phê duyệt):

| # | Vị trí | Lớp tự viết |
|---|---|---|
| 1 | Hồ sơ giao nhận → "Lịch sử giao nhận" | `.delivery-timeline` (3 mốc, màu xanh/dương/tím, marker `✓`/`●`) |
| 2 | Chi tiết phiếu → "Tiến trình mua và giao hàng" | `.supply-timeline` (marker `✓`/số thứ tự, "Nhận việc/Hạn", cảnh báo quá hạn đỏ) |

## 2. Đã sửa — dùng component dùng chung, **không cắt nội dung**

| Nội dung cũ | Cách giữ lại |
|---|---|
| 3 mốc "BCH đã xác nhận giao hàng" · "Kho ghi nhận nhận hàng" · "Tạo hồ sơ giao nhận" | `action` của 3 `ActivityItem` — **nguyên văn** |
| Phụ đề từng mốc (BCH công trường · Kho công trường · Theo PO) | `actor` |
| Thời điểm từng mốc | `at` (dùng lại hàm `date()` của tệp) |
| **Mã hoá MÀU** (xanh/dương/tím) | `tone` — `StatusBadge` với `label=""` render **chấm màu** ⇒ màu không mất |
| "Nhận việc: … · Hạn: …" | `detail` — **nguyên văn** |
| Câu mô tả thời gian + **tô đỏ khi quá hạn** | `detail` với `className={timing.late ? "red-text" : ""}` (giữ đúng hành vi cũ) |
| Số thứ tự bước mua/giao (trước là marker `✓`/`index+1`) | **số ở đầu tên bước** (`1. Lập và phát hành PO`) — không mất thông tin bậc |
| Ý kiến bước mua/giao | `detail` `<small>` |
| Trạng thái rỗng của hồ sơ giao nhận | **giữ nguyên** `Empty text="Chưa có giao nhận thực tế để hiển thị lịch sử."` |
| Tiêu đề + ghi chú 2 khối | thành `title`/`note` của component (chữ cũ) |

**Không tự đặt chữ mới** (quy tắc #7 của dự án): mọi chuỗi đều lấy từ markup cũ.
Kích thước tệp **giảm 254 ký tự** (ít markup lặp hơn).

## 3. Kiểm chứng (5 phép)

| # | Phép kiểm | Kết quả |
|---|---|---|
| 1 | `npm run typecheck` | **exit 0** — kể cả phần suy kiểu `tone: "green" as const` / mảng ghép có điều kiện |
| 2 | **Cổng áp dụng thật** `tools/probe-ui-adoption.mjs` | `ActivityTimeline` **0 → 2 lần DANG DUNG** · `ApprovalTimeline` giữ **1** · **"dải phê duyệt/lịch sử tự viết" = 0** |
| 3 | `npx eslint app/page.tsx` | **0 error · 73 warning** (mốc nền 74 ⇒ **không phát sinh cảnh báo mới**) |
| 4 | Hậu kiểm của script sửa (6 phép) | ĐẠT 6/6: 2 lớp cũ **đã hết** · 3 chuỗi chữ cũ **còn nguyên** · đúng **2** `<ActivityTimeline>` |
| 5 | Cổng ảnh 28 ảnh × 4 kích thước | **8/28 ảnh lệch — y hệt trước thay đổi** (2 màn 06/07 đều 0 px) ⇒ không hồi quy |

## 4. Đóng góp tiến độ

* `U-07` (`ActivityTimeline`): `KHUNG-XONG / AP-DUNG 0` → **`DONE / AP-DUNG 2`**.
* `U-17` (**ÁP DỤNG** timeline): → **DONE** (**3 lần dùng thật**: `ApprovalTimeline` 1 + `ActivityTimeline` 2 · **0 chỗ tự viết**).
* **Tiến độ 28 → 30/110 = 27,3 %** (`PHASE 1` lên **7/17**); "khung xong nhưng áp dụng 0" còn **2**.

## 5. Ghi chú quan trọng cho `U-14` (việc kế tiếp)

Đã khảo sát 4 chỗ `.overlay` tự viết: `Admin` · `ReceiptDrawer` · **`BaseModal`** · `ForcedPasswordModal`.
**Kết luận KHÔNG nên đụng `BaseModal`:** nó là **khung chung nội bộ của ~31 modal**, CSS `.modal` nằm trong
**`app/globals.css` — tệp đã ĐÓNG BĂNG** (cổng `master-baseline-gate.mjs`: cấm append sau mốc R1.1.1 END,
hạn mức 400.653 byte, `!important` sát trần 4950), và **cổng ảnh 28 ảnh KHÔNG phủ modal** ⇒ sửa vào đó là
**rủi ro cao mà không có cổng nào bắt lỗi**. `ForcedPasswordModal` cũng **không** chuyển được vì
`EntityDetailModal` **luôn render nút ×**, trong khi modal bắt buộc đổi mật khẩu **không được phép đóng**
(mất tính "bắt buộc"). ⇒ `U-14` cần cách tiếp cận khác (ví dụ bổ sung chế độ `variant` cho component dùng chung),
ghi lại để không làm ẩu.

## 6. Tệp thay đổi

| Tệp | Thay đổi |
|---|---|
| `app/page.tsx` | 2 khối dải → `<ActivityTimeline …/>` (**−254 ký tự**); `delivery-timeline`/`supply-timeline` **không còn** |
| `docs/25_TODO_ROADMAP.md` | `U-07` → DONE / AP-DUNG 2 · `U-17` → DONE |
| `docs/agent-progress/{MASTER_STATUS,TASK_INDEX}.md` | mốc trạng thái + dòng task |
