package com.vntech.erp.infrastructure.security;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Kiểm chứng Pbkdf2PasswordHasher TƯƠNG THÍCH monolith JS.
 * Vector được sinh bằng Node: crypto.pbkdf2Sync('VnTech@123', salt(16B), 600000, 32, 'sha256')
 * => nếu Java cho hash giống nhau nghĩa là migrate dữ liệu KHÔNG đổi mật khẩu người dùng.
 */
class Pbkdf2PasswordHasherTest {

    private final Pbkdf2PasswordHasher hasher = new Pbkdf2PasswordHasher();

    // Vector Node: salt=7bc2300a77e25c4343184775a76d23ca, pass=VnTech@123, 600000 vòng
    private static final String NODE_VECTOR =
            "pbkdf2$600000$7bc2300a77e25c4343184775a76d23ca$cd2c93819a3304b49e70c580142ff24ad512487663e497619d428de154b52fcb";

    @Test
    void verifiesNodeJsVector() {
        assertTrue(hasher.verify("VnTech@123", NODE_VECTOR), "Java phải verify được hash sinh bởi Node (JS reference)");
        assertFalse(hasher.verify("wrong", NODE_VECTOR));
        assertFalse(hasher.verify("VnTech@123", "pbkdf2$600000$abcdef$def"));
        assertFalse(hasher.verify("VnTech@123", null));
        assertFalse(hasher.verify("VnTech@123", "plain$whatever"));
    }

    @Test
    void hashAndVerifyRoundtrip() {
        String stored = hasher.hash("VnTech@123");
        assertTrue(stored.startsWith("pbkdf2$600000$"));
        assertTrue(hasher.verify("VnTech@123", stored));
        assertFalse(hasher.verify("VnTech@124", stored));
    }

    @Test
    void saltIsRandomPerHash() {
        assertNotEquals(hasher.hash("VnTech@123"), hasher.hash("VnTech@123"));
    }

    @Test
    void storedIterationsParsesAndRejects() {
        assertEquals(600_000, hasher.storedIterations(NODE_VECTOR));
        assertEquals(0, hasher.storedIterations("nonsense"));
        assertEquals(0, hasher.storedIterations(null));
    }

    @Test
    void rejectsLowIterationsLikeJsGuard() {
        // JS từ chối iterations < 210.000
        String low = "pbkdf2$100000$7bc2300a77e25c4343184775a76d23ca$cd2c93819a3304b49e70c580142ff24ad512487663e497619d428de154b52fcb";
        assertFalse(hasher.verify("VnTech@123", low));
    }
}