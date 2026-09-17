# TASK-072 (P-04 / MASTER TASK §2.1) — Áp dụng `ApprovalTimeline` vào chi tiết phiếu đề nghị (§8.1)

**Trạng thái:** ✅ DONE — mã đã sửa, **4 cổng kiểm chứng đều xanh**, đã commit
**Ngày:** 17/09/2026 · **Nhánh:** `unity`
**Nguồn đặc tả:** `docs/24_SYSTEM_AUDIT_REPORT.md` §15 mục 3 (*"Phiếu: phần duyệt thiếu thông tin (người duyệt/phòng ban/thời gian) → cần Approval Timeline"*, nguồn §8.1) + `docs/25_TODO_ROADMAP.md` dòng **`P-04`**.

---

## 1. Vì sao có task này — chuyển từ chuỗi "cổng kiểm" sang **thực thi MASTER TASK**

Sau 10 task vá lỗi port, TODO chuyển sang **phần thực thi sản phẩm**. Chọn `P-04` vì:
* **không phụ thuộc** mục nào khác trong roadmap (dependencies = `U-06` **đã xong** — component đã tồn tại);
* có **đặc tả rõ** (6 thông tin bắt buộc mỗi bước);
* có **cổng đo sẵn** để chứng minh (`probe-ui-adoption.mjs` + `probe-visual-regression.mjs`).

## 2. Hiện trạng trước khi sửa — thiếu đúng thứ cổng đo được

* `ApprovalTimeline` **đã tồn tại** (`app/components/ui/Timeline.tsx`, dùng chung, có CSS `.vt-timeline*`) và **đã được import** trong `app/page.tsx`… **nhưng CHƯA HỀ được render** ⇒ cổng adoption ghi **`ApprovalTimeline U-06: 0 lần — CHUA AP DUNG`** (đúng như `MASTER_STATUS` mục "Tiến độ áp dụng UI dùng chung": timeline **0**).
* Màn chi tiết phiếu (`RequestDrawer`) tự dựng **`<div className="timeline">`** (lớp CŨ, không phải `vt-timeline`) với **1467 ký tự JSX** trong 1 dòng; thông tin người duyệt/phòng ban **chỉ hiện khi bước đã xử lý**, và lấy phòng ban bằng cách **dò `data.staffDirectory`** thay vì dùng cột `approvals.department` đã có sẵn.

## 3. Đã sửa

Thay khối tự viết bằng **component dùng chung**, ánh xạ đủ 6 trường §8.1:

| §8.1 yêu cầu | Nguồn dữ liệu dùng |
|---|---|
| **Số bước** | `approval.stage` |
| **Tên bước** | `approvalStages[].name` (cấu hình) → dự phòng `approval.department` → `Bước N` |
| **Người duyệt** | `approval.approverName` (Java đã LEFT JOIN `users`) |
| **Phòng ban** | `approval.department` (cột thật) → dự phòng dò `staffDirectory` |
| **Thời gian** | `approval.decidedAt` (quyết định) + `approval.dueAt` (hạn, hiện khi chưa duyệt) |
| **Trạng thái** | `status`: `approved` / `rejected` / `cancelled`→`skipped` / bước hiện tại→`pending` / còn lại→`waiting` (component hiển thị **nhãn chữ** + `StatusBadge`) |
| **Ý kiến** | `approval.comment` |

Kèm chú thích trong mã nêu rõ nguồn §8.1 và lý do ánh xạ `cancelled → skipped`.

## 4. Kiểm chứng — 4 cổng, đều có bằng chứng

| # | Cổng | Trước | Sau |
|---|---|---|---|
| 1 | **`probe-ui-adoption.mjs`** (lượt dùng THẬT của thư viện dùng chung) | `ApprovalTimeline` **0 lần** | **1 lần — DANG DUNG** (`app/page.tsx ×1`) |
| 2 | **`npx tsc --noEmit`** (cổng kiểu của dự án, thuộc `npm test`) | — | **exit 0** |
| 3 | **UI phục vụ được** (`GET :8787/` và qua proxy `:9000/`) | — | **HTTP 200**, **không** có marker lỗi biên dịch |
| 4 | **`probe-visual-regression.mjs`** (Edge headless qua CDP, 28 ảnh chuẩn) | — | **8/28 ảnh lệch — ĐÃ CHỨNG MINH LÀ CÓ SẴN, không do thay đổi này** |

### 4.1 Cách chứng minh 8 ảnh lệch là **có sẵn** (đối chứng bằng THỰC NGHIỆM)

Cổng ảnh báo 8/28 ảnh lệch ở màn **`05-material`** — màn này **không chứa** drawer vừa sửa. Nên đã chạy **đối chứng**:
`git stash push app/page.tsx` → chạy lại cổng ảnh → **vẫn 8/28 ảnh lệch y hệt** → `git stash pop` (khôi phục nguyên trạng, đã kiểm `git status`).
⇒ **Thay đổi này KHÔNG thêm ảnh lệch nào.** Nguyên nhân lệch có sẵn: **dữ liệu đổi** (đúng như đính chính ở `TASK-003.md`: số liệu lệch giống hệt trước/sau khi sửa CSS).

## 5. Giới hạn & việc còn lại (ghi rõ, không giấu)

1. **Thông tin BỊ MẤT so với bản cũ** (đánh đổi có ý thức): bản cũ hiển thị thêm *"Nhận hồ sơ: `queuedAt`"*, *"Đã gửi email `notifiedAt`"* và câu mô tả thời gian (`timing.text`). Component dùng chung **chưa có chỗ** cho 3 thứ này ⇒ **đề xuất mở rộng `ApprovalStep`** thêm `queuedAt`/`notifiedAt` (hạng mục sau), **không** tự ý nhét vào trường khác.
2. **Cổng ảnh KHÔNG phủ drawer này**: 28 ảnh chuẩn chỉ gồm 7 màn danh sách (dashboard · project · work · team · material · warehouse · admin) — **không** có màn chi tiết phiếu. Vì vậy cổng ảnh xác nhận *"không hỏng màn khác"*, **không** xác nhận *"drawer mới hiển thị đúng"* ⇒ cần **probe mở drawer bằng headless** (hạng mục sau).
3. **Còn 2 chỗ dải phê duyệt/lịch sử tự viết** khác trong `page.tsx` (`approval-flow` ở Trung tâm phê duyệt + `supply-timeline`) — P-04/U-06 chỉ yêu cầu chi tiết phiếu; phần còn lại thuộc `U-17`.
4. Bản đồ trạng thái `cancelled → skipped` là **suy luận hợp lý theo từ vựng của component**, chưa có đặc tả riêng cho trạng thái "đã huỷ bước".

## 6. Tệp thay đổi

| Tệp | Thay đổi |
|---|---|
| `app/page.tsx` | import thêm `type ApprovalStep`; thay khối tự viết (1467 ký tự) bằng `<ApprovalTimeline …>` (1197 ký tự) |
| `docs/25_TODO_ROADMAP.md` | dòng `P-04` → **DONE** (nguồn sự thật tiến độ) |
| `docs/agent-progress/MASTER_STATUS.md` · `TASK_INDEX.md` | cập nhật trạng thái + dòng task |
