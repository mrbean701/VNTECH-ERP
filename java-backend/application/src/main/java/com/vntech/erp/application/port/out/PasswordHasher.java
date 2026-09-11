package com.vntech.erp.application.port.out;

/**
 * Port mật khẩu — do application định nghĩa, infrastructure implement.
 * Định dạng hash phải tương thích monolith JS: `pbkdf2$<iterations>$<saltHex>$<hashHex>`
 * (PBKDF2-SHA256, mặc định 600.000 vòng) để người dùng KHÔNG phải đổi mật khẩu khi migrate.
 */
public interface PasswordHasher {

    /** Sinh hash mới (salt ngẫu nhiên 16 bytes, 600.000 vòng như JS). */
    String hash(String password);

    /** Verify theo định dạng JS; từ chối nếu không phải pbkdf2 hoặc iterations < 210.000. */
    boolean verify(String password, String storedHash);

    /** Số iterations lưu trong hash (0 nếu không parse được) — dùng để quyết định rotate hash. */
    int storedIterations(String storedHash);
}