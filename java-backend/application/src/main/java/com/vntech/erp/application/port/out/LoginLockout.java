package com.vntech.erp.application.port.out;

/**
 * Chống brute-force đăng nhập: 10 lần sai / 15 phút theo (ip + username) -> chặn.
 * Port nguyên trạng universal-server.mjs (loginKey = vntech:loginfail:{ip}:{username}).
 */
public interface LoginLockout {

    /** 0 = chưa bị chặn; >=1 = số lần sai hiện tại (nếu >= MAX_FAILURES sẽ bị chặn). */
    int failureCount(String ipAddress, String username);

    void registerFailure(String ipAddress, String username);

    void clearFailures(String ipAddress, String username);
}