package com.vntech.erp.application.port.out;

import com.vntech.erp.domain.entity.User;

import java.time.Instant;
import java.util.Optional;

/**
 * Port lưu phiên đăng nhập. Token thô do application sinh; chỉ lưu SHA-256(token) (như JS).
 * Bảng `sessions`: token_hash, user_id, expires_at, ip_address, user_agent, last_seen_at, created_at.
 */
public interface SessionStore {

    void create(String sessionId, String userId, String tokenHash, Instant expiresAt,
                String ipAddress, String userAgent, Instant createdAt);

    /** User hợp lệ: token khớp, chưa hết hạn, tài khoản active. Sau khi tìm thấy thì cập nhật last_seen_at. */
    Optional<User> findActiveUserByValidToken(String tokenHash, Instant now);

    void touchLastSeen(String tokenHash, Instant now);

    void deleteByTokenHash(String tokenHash);

    /** Xóa session theo id (revoke_session — admin). Trả false nếu không tồn tại. */
    boolean deleteById(String sessionId);

    /** Đăng xuất toàn bộ thiết bị của user (revoke_user_sessions — admin). */
    int deleteByUserId(String userId);

    /** Đổi mật khẩu: xóa mọi session của user TRỪ session hiện tại (tokenHash giữ lại). */
    int deleteByUserIdExceptTokenHash(String userId, String keepTokenHash);

    /** Thông tin session cho audit (revoke): userId + username. */
    Optional<SessionInfo> findInfoById(String sessionId);

    record SessionInfo(String id, String userId, String username) { }
}