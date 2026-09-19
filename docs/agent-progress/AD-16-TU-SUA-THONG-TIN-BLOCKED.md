# AD-16 — TỰ SỬA THÔNG TIN CÁ NHÂN (tên hiển thị · ảnh · liên hệ · mật khẩu) ⇒ **BLOCKED** (2/4 trường)

> Mục master task: `AD-16` — nguyên văn `docs/25_TODO_ROADMAP.md`:
> «Cho user sửa thông tin được phép (tên hiển thị · ảnh · liên hệ · mật khẩu)» (phụ thuộc `S-07` ✔).
>
> **TRẠNG THÁI: `**BLOCKED**`** — 2/4 trường đã hoạt động thật; 2/4 trường còn lại **KHÔNG có action tự phục vụ**
> ở bất kỳ đường ghi nào, muốn có phải **thêm action** = sửa `scripts/system-route.mjs` **và**
> `java-backend/**` — cả hai đều **BỊ CẤM** trong nhánh này.

## 1. BẰNG CHỨNG GREP (2 đường ghi, không suy đoán)

| Action tự phục vụ | Đường JS | Đường Java | Dùng cho trường |
|---|---|---|---|
| `update_profile_avatar` | `scripts/system-route.mjs:3243` `if (action === "update_profile_avatar")` | `SystemController.java:253` `case "update_profile_avatar" -> {` | **Ảnh đại diện** ✔ |
| `change_password` | `scripts/system-route.mjs:3227` `if (action === "change_password")` | `SystemController.java:236` `case "change_password" -> {` | **Mật khẩu** ✔ |
| *(không tồn tại)* | — | — | **Tên hiển thị** (`users.full_name`) ✗ |
| *(không tồn tại)* | — | — | **Liên hệ/email** (`users.email`) ✗ |

Phép kiểm chống suy đoán (chạy trong test AD-16): quét MỌI `if (action === "…profile…")` của đường JS ⇒
**đúng 1** kết quả `update_profile_avatar`; đồng thời khẳng định **KHÔNG** tồn tại các tên kiểu
`update_own_profile` / `save_my_profile` / `update_my_contact` / `save_self_profile`.

## 2. PHẦN ĐÃ LÀM ĐƯỢC (2/4 trường — chạy thật)

`AccountSettingsModal` (`app/page.tsx`) — mở từ menu người dùng «Cài đặt tài khoản», **mọi vai trò** đều dùng được
(không gắn cổng admin):

- **Ảnh đại diện**: chọn/xoá ảnh (chỉ JPG/PNG/WebP, ≤ 2 MB, kiểm ở CẢ client và server) → `update_profile_avatar`.
- **Mật khẩu**: đổi mật khẩu có kiểm chính sách (≥8, hoa/thường/số/ký tự đặc biệt) + xác nhận khớp → `change_password`
  (server thu hồi các phiên khác).

Bổ sung của AD-16: khối `data-self-edit="AD-16"` liệt kê **cả 4 trường** từ một nguồn sự thật `SELF_EDIT_FIELDS`,
ghi rõ trường nào sửa được (kèm tên action) và trường nào **chưa có action tự phục vụ** + lý do — để người dùng
không phải đoán vì sao không sửa được tên/liên hệ. **KHÔNG** dựng ô nhập giả cho 2 trường thiếu action (tránh nút chết).

## 3. VIỆC CẦN LÀM ĐỂ GỠ CHẶN (do người dùng quyết)

1. Cho phép sửa `scripts/system-route.mjs` + `java-backend/**` để thêm action kiểu `update_own_profile`
   (nhận `fullName`, `email`; **bắt buộc** kiểm: chỉ sửa chính mình, không đổi `role`/`organization_unit_id`,
   không đổi email trùng người khác, ghi `audit_logs`); **hoặc**
2. Chốt rằng 2 trường đó **chỉ Admin sửa** (đúng hiện trạng `save_user`) và sửa nguyên văn yêu cầu `AD-16`
   từ 4 trường xuống 2 trường (cần người dùng xác nhận).

Hợp đồng kiểm chứng: `tests/ad16-self-edit.test.mjs` — 5 ca, gồm **đối chứng âm**: đánh dấu `editable` mà không có
`action` ⇒ cổng HỎNG; và ca khẳng định UI **không** có `name="fullName"` / `name="email"` (không dựng nút chết).
