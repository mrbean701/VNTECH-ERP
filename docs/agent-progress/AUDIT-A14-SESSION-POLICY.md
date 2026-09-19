# AUDIT A-14 — CHÍNH SÁCH THỜI HẠN PHIÊN + THU HỒI PHIÊN (P1)

- **Ngày:** 20/09/2026 · **Trạng thái:** HOÀN THÀNH · **Kết luận tổng:** ✅ **CÓ chính sách rõ ràng và ĐẦY ĐỦ** (khác biệt lớn so với A-13)
- **Phương pháp (§45):** đọc **bảng DB thật** + **mã nguồn thật** (`SessionStore` / `AuthUseCase` / `SessionJpaEntity`). **Không suy đoán.**

## 1. BẰNG CHỨNG — DB (CONFIRMED)

Bảng **`sessions`** (thật, từ `information_schema`):
`id` · `user_id` · **`token_hash`** · **`expires_at`** · `ip_address` · `user_agent` · `created_at` · **`last_seen_at`**

- ✅ **Token lưu dạng BĂM (SHA-256)** — không lưu token thô (giảm thiệt hại nếu lộ DB).
- ✅ **Có `expires_at`** ⇒ phiên **có hạn** (không phải phiên vĩnh viễn).
- ✅ **Có `last_seen_at`** ⇒ theo dõi được phiên đang hoạt động (phục vụ admin rà soát).
- Bảng `users` có `must_change_password` · `password_reset_at` · `password_reset_by` · `active`.

## 2. BẰNG CHỨNG — MÃ NGUỒN (CONFIRMED)

**`SessionStore` (hợp đồng):**
| Hàm | Ý nghĩa |
|---|---|
| `create(sessionId, userId, tokenHash, expiresAt, …)` | Tạo phiên **kèm hạn** |
| `findActiveUserByValidToken(tokenHash, now)` | **Ép hạn khi tra cứu** (`expires_at` so với `now`) |
| `touchLastSeen(tokenHash, now)` | Cập nhật `last_seen_at` |
| `deleteByTokenHash` | Đăng xuất **1 thiết bị** |
| `deleteById(sessionId)` | **Admin thu hồi 1 phiên** (`revoke_session`) |
| `deleteByUserIdExceptTokenHash(userId, keep)` | **Đổi mật khẩu ⇒ thu hồi MỌI phiên khác**, giữ phiên hiện tại |
| `deleteByUserId(userId)` | **Thu hồi TẤT CẢ phiên của 1 user** (`revoke_user_sessions`) |
| `findInfoById` | Thông tin phiên để **ghi audit** (userId + username) |

**`AuthUseCase`:**
- **Thời hạn phiên: `SESSION_HOURS = 24 giờ`** (`Instant.now().plus(Duration.ofHours(SESSION_HOURS))`).
- **Khoá đăng nhập: `LOGIN_MAX_FAILURES = 10`** ⇒ tạm khoá **15 phút** (thông báo 429 khi bị khoá).
- Lỗi đăng nhập trả **401 chung** ⇒ **không lộ tài khoản có tồn tại hay không**.
- **`revoke_session`** (admin, 1 phiên) + ghi **`REVOKE_SESSION`** vào audit.
- **`revoke_user_sessions`** (admin, toàn bộ thiết bị của 1 user) + ghi **`REVOKE_USER_SESSIONS`**.
- **Đổi mật khẩu** ⇒ `deleteByUserIdExceptTokenHash` + trả `otherSessionsRevoked: true`; chính sách mật khẩu **8+ (hoa/thường/số/ký tự đặc biệt)**.
- Kiểm thử có ca **`currentUser_rejectsExpiredSession()`** ⇒ **hành vi hết hạn được test**.

## 3. KẾT LUẬN (trả lời đúng câu hỏi audit)

1. **Phiên có thời hạn?** ⇒ **CONFIRMED có** — **24 giờ** (hằng số `SESSION_HOURS`), ép tại thời điểm tra cứu.
2. **Thu hồi phiên được không?** ⇒ **CONFIRMED có, 4 đường**: logout 1 thiết bị · admin thu hồi 1 phiên · admin thu hồi toàn bộ thiết bị của 1 user · **đổi mật khẩu tự thu hồi mọi thiết bị khác**.
3. **Có vết kiểm toán cho thao tác thu hồi?** ⇒ **CONFIRMED có** (`REVOKE_SESSION`, `REVOKE_USER_SESSIONS`).

## 4. ĐIỂM CẦN LƯU Ý (không phải lỗi, nhưng nên biết)

| # | Điểm | Mức |
|---|---|---|
| N1 | Phiên **cố định 24 giờ, không có cơ chế gia hạn/trượt** theo hoạt động (`last_seen_at` **được ghi** nhưng **không** dùng để kéo dài phiên) ⇒ người dùng đang làm việc vẫn bị hết hạn giữa chừng | P2 |
| N2 | **Khoá tài khoản (`active=false`)**: hợp đồng hiện có `deleteByUserId` — cần **xác nhận có được gọi khi admin khoá user** (chưa thấy call-site trong lượt này) ⇒ **UNKNOWN** | P1 |
| N3 | Chưa thấy cơ chế **dọn phiên hết hạn** định kỳ (bảng `sessions` sẽ phình theo thời gian) | P2 |

- **N1/N2/N3 nêu để theo dõi; KHÔNG tự ý sửa mã** (audit chỉ kết luận + khuyến nghị).

## 5. KHUYẾN NGHỊ (chờ user quyết định)

1. Xác nhận & bổ sung **thu hồi phiên khi khoá/vô hiệu tài khoản** (`active=false` ⇒ `deleteByUserId`) — *ưu tiên vì liên quan truy cập tồn dư*.
2. Cân nhắc **trượt hạn phiên** (sliding expiration) dựa trên `last_seen_at` để giảm phiền người dùng.
3. Thêm **job dọn phiên hết hạn** (theo `expires_at`) để bảng `sessions` không phình.
