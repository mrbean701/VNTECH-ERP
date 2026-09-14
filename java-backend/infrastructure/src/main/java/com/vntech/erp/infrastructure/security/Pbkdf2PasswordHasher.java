package com.vntech.erp.infrastructure.security;

import com.vntech.erp.application.port.out.PasswordHasher;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.security.spec.InvalidKeySpecException;
import java.util.HexFormat;

/**
 * PBKDF2-SHA256 600.000 vòng — TƯƠNG THÍCH 100% monolith JS:
 *   format `pbkdf2$<iterations>$<saltHex>$<hashHex>`, salt 16 bytes, output 32 bytes (256 bit).
 * => Mật khẩu đã có trong DB hiện tại KHÔNG cần đổi khi migrate sang MySQL.
 */
@Component
public class Pbkdf2PasswordHasher implements PasswordHasher {

    static final int DEFAULT_ITERATIONS = 600_000;
    static final int MIN_ACCEPTED_ITERATIONS = 210_000; // khớp JS: từ chối < 210k
    private static final int SALT_BYTES = 16;
    private static final int KEY_BITS = 256;
    private static final String ALGORITHM = "PBKDF2WithHmacSHA256";

    private final SecureRandom secureRandom = new SecureRandom();

    @Override
    public String hash(String password) {
        byte[] salt = new byte[SALT_BYTES];
        secureRandom.nextBytes(salt);
        byte[] key = derive(password, salt, DEFAULT_ITERATIONS);
        return "pbkdf2$" + DEFAULT_ITERATIONS + "$" + hex(salt) + "$" + hex(key);
    }

    @Override
    public boolean verify(String password, String storedHash) {
        String[] parts = storedHash == null ? new String[0] : storedHash.split("\\$");
        if (parts.length != 4 || !"pbkdf2".equals(parts[0])) return false;
        int iterations;
        try {
            iterations = Integer.parseInt(parts[1]);
        } catch (NumberFormatException e) {
            return false;
        }
        if (iterations < MIN_ACCEPTED_ITERATIONS) return false;
        byte[] salt;
        byte[] expected;
        try {
            salt = fromHex(parts[2]);
            expected = fromHex(parts[3]);
        } catch (IllegalArgumentException e) {
            return false;
        }
        byte[] actual = derive(password, salt, iterations);
        return MessageDigest.isEqual(actual, expected);
    }

    @Override
    public int storedIterations(String storedHash) {
        String[] parts = storedHash == null ? new String[0] : storedHash.split("\\$");
        if (parts.length != 4 || !"pbkdf2".equals(parts[0])) return 0;
        try {
            return Integer.parseInt(parts[1]);
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private byte[] derive(String password, byte[] salt, int iterations) {
        try {
            PBEKeySpec spec = new PBEKeySpec(password.toCharArray(), salt, iterations, KEY_BITS);
            SecretKeyFactory factory = SecretKeyFactory.getInstance(ALGORITHM);
            byte[] key = factory.generateSecret(spec).getEncoded();
            spec.clearPassword();
            return key;
        } catch (NoSuchAlgorithmException | InvalidKeySpecException e) {
            throw new IllegalStateException("PBKDF2 unavailable", e);
        }
    }

    private static String hex(byte[] bytes) {
        return HexFormat.of().formatHex(bytes);
    }

    private static byte[] fromHex(String hex) {
        return HexFormat.of().parseHex(hex);
    }
}