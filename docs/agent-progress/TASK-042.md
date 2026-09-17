# TASK-042 — `retry_email` gọi BẢNG KHÔNG TỒN TẠI ⇒ HTTP 500 (VÀ CẢ MỘT LỚP LỖI CHƯA CÓ CỔNG)

**Trạng thái:** **DONE** — đã sửa + kiểm chứng lúc chạy **9/9**
**Nguồn phát hiện:** rà 9 bảng "Java có `case` nhưng không ghi bảng/cột" (cổng `probe-write-map-triage.mjs`) → soi `email_outbox`
**Ngày:** 17/09/2026

---

## 1. Chuỗi phát hiện

1. Cổng `tools/probe-write-map-drift.mjs` báo `email_outbox`: **JS ghi 16 cột, Java ghi 0**.
2. Cổng phân loại mới `tools/probe-write-map-triage.mjs` chỉ ra: **cả `retry_email` lẫn `save_email_settings` đều CÓ `case` trong Java** ⇒ không phải "chưa port", mà là **thiếu port thật**.
3. Tra mã Java thì thấy `SystemSettingsStoreAdapter.retryEmailQueue` chạy:
   ```sql
   SELECT COUNT(*) FROM email_queue WHERE status='pending'
   ```
   mà lược đồ ĐANG CHẠY **không có bảng `email_queue`** — bảng thật là **`email_outbox`**.
4. **Gọi thật** `retry_email` ⇒ **HTTP 500** (`Internal Server Error`) — bằng chứng không thể chối.
5. Đọc JS `system-route.mjs:1630-1636` thì lộ ra **lỗi thứ hai**: Java **hiểu sai nghiệp vụ** —
   JS **không đếm gì cả**, JS **xếp lại MỘT email theo `emailId`**:
   ```sql
   UPDATE email_outbox SET status='queued',next_attempt_at=?,last_error=NULL,updated_at=? WHERE id=?
   ```
   và trả *"Đã xếp lại email để máy chủ gửi."*

## 2. LỚP LỖI CHƯA CÓ CỔNG — đây mới là phần quan trọng nhất

Cổng `probe-java-sql-live.mjs` từ trước chỉ kiểm **cột của `INSERT`/`UPDATE`** và **bảng của `INSERT`/`UPDATE`**.
Nó **không hề kiểm bảng trong `FROM`/`JOIN`** ⇒ cả lớp lỗi *"SELECT từ bảng không tồn tại"* **không có cổng nào bắt**.

**Đã mở rộng cổng** để kiểm `FROM`/`JOIN` trên lược đồ đang chạy.

### Hai lần công cụ của tôi báo sai (đều phát hiện bằng cách ĐỌC mã, không đoán)

| Lần | Phát hiện | Thực tế | Sửa |
|---|---|---|---|
| 1 | **6** "bảng không tồn tại" | **5 dương tính giả**: `b`, `r`, `owned`, `ids`, `descendants` là **tên CTE**; regex cũ chỉ bắt tên CTE **đầu tiên** sau `WITH` | gom mọi `<tên> AS (` |
| 2 | còn `descendants` | vẫn dương tính giả: CTE viết `WITH RECURSIVE descendants(id) AS (` — tên **có danh sách cột** | thêm dạng `<tên>(…) AS (` |

Kết quả cuối: cổng chỉ còn **đúng `email_queue`** — vừa là **phát hiện thật**, vừa là **đối chứng dương**
(chứng minh cổng không vô dụng). Sau khi vá: **8 phát hiện, toàn bộ là nhóm 6** đang chờ quyết định.

## 3. Đã sửa

| Tầng | Trước | Sau |
|---|---|---|
| `SystemSettingsStore` (port) | `String retryEmailQueue(int limit, Instant now)` | `void requeueEmail(String emailId, Instant now)` + Javadoc nêu rõ bảng đúng và nghiệp vụ JS |
| `SystemSettingsStoreAdapter` | `SELECT COUNT(*) FROM email_queue …` (**bảng không tồn tại**) | `UPDATE email_outbox SET status='queued',next_attempt_at=?,last_error=NULL,updated_at=? WHERE id=?` |
| `SystemSettingsUseCase.retryEmail` | trả *"Hàng đợi email còn N chưa gửi…"* | trả **nguyên văn** *"Đã xếp lại email để máy chủ gửi."* |

## 4. Kiểm chứng lúc chạy — `tools/probe-task042-retry-email.mjs`: **9/9 ĐẠT, exit 0**

jar **90.891.800 bytes** (16:33:12) · API PID **11404** · Flyway `validated 16 migrations` · log **0 ERROR**

| Phép kiểm | Kết quả |
|---|---|
| A. `retry_email` với dòng THẬT (tạm) | **HTTP 200** (trước là **500**) + thông điệp **nguyên văn JS** |
| A. `status` | `failed` → **`queued`** |
| A. `last_error` | `'Lỗi thử tạm'` → **NULL** |
| A. `next_attempt_at` | được đặt |
| A. `attempt_count` | **giữ nguyên 3** (JS không đụng cột này) |
| B. `emailId` không tồn tại | **200** + cùng thông điệp (JS không kiểm tồn tại) |
| C. thiếu `emailId` | **200**, không ném lỗi (đúng JS) |
| Dọn dẹp | `email_outbox` **0 → 0** dòng |

## 5. Phát hiện KÈM THEO — chưa sửa, đã đăng ký

### 5.1 Java KHÔNG có cơ chế gửi email nào

Tra toàn kho Java: **không** `JavaMailSender`, **không** `jakarta.mail`, **không** SMTP client nào.
`email_settings` (SMTP) chỉ được **lưu và đọc**, không bao giờ dùng để gửi; `email_outbox` **chỉ được đọc/xoá**,
**chưa bao giờ được INSERT** từ đường Java.

⇒ Trên đường Java, **không email nào được xếp hàng hay gửi** — kể cả thông báo duyệt. Đây là **khoảng trống
tính năng** (không phải lỗi một dòng), cần một hạng mục riêng; **không tự bịa cơ chế gửi**.

### 5.2 Ba bảng khác cũng "Java có `case` nhưng không ghi"

| Bảng | Action | Nhận định sơ bộ |
|---|---|---|
| `custom_field_values` | `create_request` | Java **chỉ ĐỌC** (`BootstrapDataAdapter:98`) và **XOÁ** (`BoqStoreAdapter:559`), **không bao giờ INSERT** ⇒ **giá trị trường động của phiếu do Java tạo bị mất**. **Đáng sửa tiếp** |
| `material_code_history` | `save_material`, `merge_material_master` | **Không một dòng Java nào** nhắc bảng này ⇒ mất lịch sử đổi mã. Cần đối chiếu JS rồi quyết định |
| `project_archives.purge_audit_id` | `delete_project` | Java đặt `status='purged'` + `purged_at` nhưng không đặt liên kết tới bản ghi audit (JS `:2452`) |

### 5.3 Dương tính giả của cổng BẢN ĐỒ GHI: `users.avatar_url`

Cổng báo Java "không ghi `users.avatar_url`" — **SAI**: `AuthUseCase.updateProfileAvatar` ghi qua **JPA**
(`user.changeAvatar(...)` + `userRepository.save(user)`), tức **không có SQL text để bộ trích đọc**.
⇒ Cổng này **chỉ thấy SQL tĩnh**, không thấy đường JPA. Đã ghi vào giới hạn của cổng.

## 6. Bài học

1. **Cổng chỉ kiểm `INSERT`/`UPDATE` thì mù cả lớp lỗi `SELECT` sai bảng.** Mở rộng phạm vi cổng là cách duy nhất
   để bắt cả lớp — và ngay lần mở rộng đầu tiên đã bắt được một lỗi 500 thật đang tồn tại.
2. **Cổng mới phải được kiểm bằng cách ĐỌC mã khi nó báo lỗi.** 6 → 5 → 1 dương tính giả: nếu tin ngay con số 6
   thì đã "sửa" 5 chỗ đang đúng.
3. **"Có `case`" không có nghĩa là "đã port".** Cần phân biệt *chưa port* (không `case`) với *port thiếu*
   (có `case` nhưng bỏ bước) — đó chính là giá trị của `probe-write-map-triage.mjs`.
