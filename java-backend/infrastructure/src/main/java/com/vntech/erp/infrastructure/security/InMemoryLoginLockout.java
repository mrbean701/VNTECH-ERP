package com.vntech.erp.infrastructure.security;

import com.vntech.erp.application.port.out.LoginLockout;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Login lockout trong bộ nhớ — tương đương fallback Map của universal-server.mjs
 * (khi không có Redis): key `vntech:loginfail:{ip}:{username}`, TTL 15 phút, max 10 lần.
 * Nếu sau này bật Redis, thay impl bằng Redis-backed (cùng port, không đổi use-case).
 */
@Component
public class InMemoryLoginLockout implements LoginLockout {

    static final long WINDOW_SECONDS = 15 * 60; // 15 phút như JS
    private static final int MAX_FAILURES = 10;

    private record Entry(int count, Instant expiresAt) { }

    private final Map<String, Entry> failures = new ConcurrentHashMap<>();

    @Override
    public int failureCount(String ipAddress, String username) {
        Entry e = failures.get(key(ipAddress, username));
        if (e == null) return 0;
        if (e.expiresAt.isBefore(Instant.now())) {
            failures.remove(key(ipAddress, username));
            return 0;
        }
        return e.count;
    }

    @Override
    public void registerFailure(String ipAddress, String username) {
        String k = key(ipAddress, username);
        Entry prev = failures.get(k);
        int count = prev != null && prev.expiresAt.isAfter(Instant.now()) ? prev.count + 1 : 1;
        failures.put(k, new Entry(count, Instant.now().plusSeconds(WINDOW_SECONDS)));
    }

    @Override
    public void clearFailures(String ipAddress, String username) {
        failures.remove(key(ipAddress, username));
    }

    private static String key(String ip, String username) {
        return "vntech:loginfail:" + (ip == null ? "unknown" : ip) + ":" + (username == null ? "unknown" : username);
    }
}