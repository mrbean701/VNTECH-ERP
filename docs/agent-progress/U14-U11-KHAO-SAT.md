# U-14 + U-11 — HỒ SƠ KHẢO SÁT (chuẩn bị thực thi, chưa đụng mã)

- **Ngày:** 18/09/2026 · **Trạng thái:** KHẢO SÁT XONG — **chờ quyết định / chờ vòng sau thực thi**
- **Nguồn số liệu:** `tools/probe-ui-adoption.mjs` · `tools/probe-modal-branch-coverage.mjs` ·
  `tools/probe-visual-regression.mjs` · `tools/probe-ui-action-coverage.mjs` · `app/page.tsx`

## 1. `U-14` — ÁP DỤNG `EntityDetailModal`: 4 khối `.overlay` KHÔNG phải 4 ứng viên

### 1.1. Sự thật đo được (KP #92)
`EntityDetailModal` **được import nhưng CHƯA BAO GIỜ được render**: quét toàn `app/` chỉ thấy **1 lần**
xuất hiện = dòng `import` (`app/page.tsx:20`), **không có thẻ `<EntityDetailModal …/>` nào**.
Trong khi đó **chú thích tại `app/page.tsx:3496-3497`** lại viết *"`TASK-074` (§8.2) — nội dung này mở ra MODAL RIÊNG
bằng component dùng chung `EntityDetailModal` (U-01)"* — **chú thích mô tả ý định chưa thực hiện**.

### 1.2. Phân loại 4 khối `.overlay` (KHÔNG phải 4 ứng viên)

| # | Khối | Dòng | Có phải "chi tiết thực thể" không? | Kết luận |
|---|---|---|---|---|
| 1 | `BaseModal` | 3510 | ❌ — là **khung chung của ~31 modal** | ⛔ **KHÔNG đụng** (quyết định cũ TASK-076: CSS `.modal` nằm trong `globals.css` **đã đóng băng**; cổng ảnh chưa phủ hết modal ⇒ rủi ro cao) |
| 2 | `ForcedPasswordModal` | 3949 | ❌ — là **chặn bắt buộc**, không phải chi tiết | ⛔ **KHÔNG chuyển** (quyết định cũ: `EntityDetailModal` **luôn render nút ×** ⇒ mất tính "bắt buộc") |
| 3 | Hộp **hướng dẫn phân quyền** | 3405 | ❌ — hộp thoại **tĩnh** (tiêu đề + danh sách + nút "Đã hiểu") | ⚪ Không phù hợp mô hình tab/thực thể |
| 4 | **`drawer` chi tiết phiếu (request detail)** | 3499 | ✅ — chi tiết **một thực thể** (phiếu đề nghị) | ✅ **ỨNG VIÊN THẬT** |

➕ **Khối thứ 5 (cổng đếm KHÔNG thấy vì `className` là BIỂU THỨC, không phải chuỗi tĩnh):**
`page.tsx:3499` dùng `className={isPage ? "overlay page-mode" : "overlay"}` ⇒ bộ đếm theo mẫu `className="overlay`
**bỏ sót**. Danh sách đầy đủ phải tính cả khối này.
**Việc kế tiếp của cổng đếm:** đổi mẫu đếm sang **`className={` + `overlay`** để không bỏ sót (nợ kỹ thuật nhỏ, chưa sửa).

### 1.3. Vì sao CHƯA chuyển ngay (trung thực)
Chuyển `drawer` chi tiết phiếu sang `EntityDetailModal` là **thay đổi giao diện thật** (khung `.drawer` full-height
→ khung `.modal.entity-detail-modal` + thanh tab `.edm-tabs` + `.edm-body`). Người dùng **đang test tay trên `:9000`**
và **đang có 4 quyết định treo** (KP #88 · hover · KP #89 · KP #90) ⇒ **không tự thêm một thay đổi lớn thứ 5**.
✅ **Điểm mới giúp việc này làm được AN TOÀN:** cổng ảnh nay **mở được khung rồi đo** (bước `{ click }` + đo
`getBoundingClientRect`, TASK-086) và **đã có ảnh chuẩn `12-drawer-request-detail__*`** ⇒ sau khi chuyển, cổng sẽ
**chỉ đúng vùng lệch** ở 4 kích thước và **từ chối ĐẠT nếu khung tràn**.

### 1.4. Công thức chuyển (đã soạn sẵn, chỉ cần áp dụng khi được duyệt)
1. `open={true}` · `onClose={close}` · `title` = **nguyên văn** chữ đang có trong `<header>` (không tự đặt chữ mới).
2. `subtitle={<>{request.projectCode} · {request.projectName}</>}` · `entityId={request.requestNo}`.
3. `tabs` = tách **đúng các `<section>` đang có**, giữ nguyên `CardHead`/bảng/`<Empty>` bên trong từng tab:
   * `overview` — `summary-grid request-summary` (10 ô hiện có).
   * `items` — bảng dòng vật tư (giữ nguyên cột + `emptyText` nguyên văn).
   * `approvals` — dải phê duyệt hiện có (nếu đã dùng `ApprovalTimeline` thì **giữ nguyên**, không viết lại).
   * `files` — khối tệp/ảnh hiện có.
4. `footer` — **chuyển y nguyên cụm nút** đang có (kể cả nút in phiếu), nút nào là `type="submit"` của `<form>` thì
   dùng **`<button form="<id-form>">`** (HTML hợp lệ, không cần `onClick`).
5. Giữ nguyên **mọi `onClick`/`stopPropagation`/`action(...)`**; **không** đổi payload.
6. Kiểm chứng: `tsc` · eslint · `npm run build` · **cổng ảnh `--only=12-`** (so với ảnh chuẩn bản CŨ) ·
   `probe-modal-branch-coverage` (không phát sinh nút chết).

## 2. `U-11` — TÁCH `page.tsx`: THỨ TỰ CẮT AN TOÀN (chưa thực thi)

`app/page.tsx` hiện **4037 dòng / 221 hàm top-level** — vẫn là **một tệp khổng lồ**. Cắt sai thứ tự sẽ gặp
**import vòng** (màn mới cần helper còn nằm trong `page.tsx`). Thứ tự đúng:

1. **Bước 1 — tách HELPER DÙNG CHUNG ra trước** (`app/lib/ui-helpers.ts` hoặc tương đương): `date`, `format`,
   `initials`, `taskStatusLabel`, `modulePermission`, `isAdminUser`, `statusLabel`, `poRemainingItems`,
   các hằng `UI_TODAY`/`UI_NOW_MS`… **Đây là bước gỡ chặn import vòng.**
   *Kiểm chứng:* `tsc` + eslint + **cổng ảnh TRÙNG BYTE** (refactor thuần, không được đổi 1 điểm ảnh).
2. **Bước 2 — tách 1 màn NHỎ, tự chứa** để chứng minh khuôn: ví dụ `CashbankScreen` hoặc `SiteCostScreen`
   (nhận `{data, project, action, permission}`), giữ **nguyên văn** toàn bộ chữ.
   *Kiểm chứng:* như bước 1 + màn đó **đã có ảnh chuẩn** (các màn thuộc `my_work`/`purchase`/`finance`).
3. **Bước 3 — mỗi vòng tách 1–2 màn**, ưu tiên màn **đã được cổng ảnh phủ** (01–13, 16) để có bằng chứng tự động.
4. **KHÔNG** tách `WorkCenter`/`Requests`/`BoqControl` trong các vòng đầu (phụ thuộc nhiều helper + modal).

## 3. Điều đã kiểm tra để KHÔNG làm trùng việc

| Lớp lỗi im lặng | Đã có cổng? | Kết quả hiện tại |
|---|---|---|
| `open("X")` mà không có nhánh `modal === "X"` (nút chết) | ✅ **MỚI (TASK-086)** `probe-modal-branch-coverage.mjs` | 36 nhánh · 34 tên · **0 nút chết** |
| `action("x")` mà backend không có | ✅ **ĐÃ CÓ TỪ TRƯỚC** `probe-ui-action-coverage.mjs` | **155/155** action UI gọi đều có ở Java · 0 lỗi |
| Khung vượt viewport | ✅ **MỚI (TASK-086)** cổng ảnh đo khung | **5 khung × 4 kích thước đều nằm trọn** |
| Cột SQL thiếu giữa JS ↔ Java | ✅ `probe-column-parity.mjs` | 0 khoá thiếu cột |
| Nhân dòng / sai số tiền | ✅ `probe-row-duplication.mjs` · `probe-money-consistency.mjs` | 15/15 · 14/14 |
| **Nút KHÔNG mở được gì nhưng KHÔNG dùng `open(...)`** (ví dụ hàm `action` viết sai TÊN ở tham số thứ hai) | ❌ **CHƯA CÓ** | — (ứng viên cổng tiếp theo) |

## 4. Việc kế tiếp (thứ tự đã chốt)

1. **Chờ anh** quyết 4 việc đang treo (KP #88 · hover · KP #89 · KP #90).
2. `U-14` — chuyển `drawer` chi tiết phiếu theo công thức mục 1.4 (khi được duyệt thay đổi giao diện).
3. `U-11` bước 1 — tách helper dùng chung, **kiểm bằng cổng ảnh trùng byte**.
4. Cổng mới: **nút không mở được gì** ngoài `open(...)` (mục 3, dòng cuối).
5. Bổ sung 2 khung còn thiếu vào cổng ảnh: `open("po")` và `open("teamCreate")` (chưa tìm được selector —
   cổng báo `NO_CLICK_TARGET`; **KHÔNG đoán bừa selector**, vòng sau khảo sát nút thật trên 2 màn đó).
