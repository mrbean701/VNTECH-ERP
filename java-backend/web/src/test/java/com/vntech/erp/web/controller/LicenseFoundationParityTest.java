package com.vntech.erp.web.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vntech.erp.application.trust.LicenseEnvelopeVerifier;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.Signature;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * MT2-P14-03b — <b>PARITY LUỒNG LICENSE (JAVA ⇄ JS)</b>.
 *
 * <p><b>Lỗi phải vá:</b> Java port theo hợp đồng JS <b>CŨ</b> — {@code install_license_foundation} đọc
 * {@code licenseKey/companyName/edition} rồi ghi 6 cột <b>không tồn tại</b>
 * ({@code license_key/company_name/edition/activated_by/activated_at/created_at}); {@code request_license_transfer}
 * ghi {@code to_company_name/created_at} (cũng không tồn tại) ⇒ admin bấm là lỗi SQL (HTTP 500) và ⛔ mất bước
 * xác minh chữ ký. Hợp đồng ĐANG CHẠY của JS ({@code scripts/system-route.mjs} + {@code lib/trust/*}) nhận
 * {@code licenseEnvelope}, xác minh Ed25519, ghi ĐÚNG 18 cột thật + {@code vntech_trust_audit}.
 *
 * <p><b>4 CA ĐO ĐƯỢC:</b>
 * <ol>
 *   <li><b>Chữ ký HỢP LỆ</b> ⇒ 200; hàng {@code vntech_license_installations} CÓ thật; audit {@code LICENSE_VERIFIED}.</li>
 *   <li><b>Chữ ký SAI</b> ⇒ 400 «License không hợp lệ…»; ⛔ KHÔNG ghi bảng cài đặt; audit {@code LICENSE_REJECTED}.</li>
 *   <li><b>Chuyển license thiếu lý do / fingerprint sai định dạng</b> ⇒ 400 (đúng luật JS).</li>
 *   <li><b>Chuyển license hợp lệ</b> ⇒ 200; hàng {@code vntech_license_transfer_requests} {@code status='requested'};
 *       audit {@code TRANSFER_REQUESTED}; ⛔ KHÔNG đổi {@code status} bảng cài đặt (JS không làm vậy).</li>
 * </ol>
 *
 * <p>⚠️ Khoá công khai trong fixture được THAY bằng khoá test (ghi lại {@code public_key_pem} của hàng
 * {@code TRUST-ROOT} trong H2) vì ⛔ không ai giữ private key của Trust Root thật — đây là fixture hợp lệ,
 * vẫn đi qua ĐÚNG đường xác minh Ed25519 của production.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class LicenseFoundationParityTest {

    private static final ObjectMapper JSON = new ObjectMapper();

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbc;

    private Cookie adminCookie;

    // ─────────────────────────── fixture ───────────────────────────

    private void setupAdmin() throws Exception {
        mockMvc.perform(post("/api/system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"action":"setup","companyName":"Công ty VNTECH","fullName":"Quản trị viên",
                                 "username":"admin","password":"VnTech@123"}"""))
                .andExpect(status().isCreated());
        adminCookie = TestActors.login(mockMvc, "admin");
    }

    /** Ghi hàng TRUST-ROOT (nếu thiếu) rồi THAY khoá công khai bằng khoá test ⇒ xác minh Ed25519 chạy thật. */
    private Map<String, Object> seedTrustRoot(String publicKeyPem) {
        Integer rows = jdbc.queryForObject(
                "SELECT COUNT(*) FROM vntech_trust_settings WHERE id='TRUST-ROOT'", Integer.class);
        if (rows == null || rows == 0) {
            jdbc.update("""
                    INSERT INTO vntech_trust_settings
                        (id,trust_mode,enforcement_enabled,tenant_id,company_code,key_id,algorithm,public_key_pem,
                         brand_fingerprint,release_fingerprint,hardware_binding_mode,native_verifier_mode,
                         online_attestation_enabled,created_at,updated_at)
                    VALUES ('TRUST-ROOT','development',0,'VNTECH-HQ','VNTECH','TEST-ROOT-ED25519','Ed25519',?,
                            'test-brand','test-release','foundation','foundation',0,
                            CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)""", publicKeyPem);
        } else {
            jdbc.update("UPDATE vntech_trust_settings SET key_id='TEST-ROOT-ED25519', public_key_pem=?,"
                    + " tenant_id='VNTECH-HQ', company_code='VNTECH', updated_at=CURRENT_TIMESTAMP"
                    + " WHERE id='TRUST-ROOT'", publicKeyPem);
        }
        jdbc.update("""
                INSERT INTO vntech_product_identity
                    (id,legal_owner,product_name,product_description,version,source_fingerprint,
                     source_fingerprint_short,created_at)
                SELECT 'VNTECH-KHO-MEP-001','VNTECH','KHO VNTECH','Universal Central Server Edition','4.8.0',
                       'test-fingerprint','VNTECH-FP-TEST',CURRENT_TIMESTAMP
                 WHERE NOT EXISTS (SELECT 1 FROM vntech_product_identity WHERE id='VNTECH-KHO-MEP-001')""");
        return jdbc.queryForMap("""
                SELECT tenant_id AS tenantId, company_code AS companyCode, key_id AS keyId,
                       public_key_pem AS publicKeyPem
                  FROM vntech_trust_settings WHERE id='TRUST-ROOT'""");
    }

    private static Map<String, Object> claims(String licenseId) {
        Map<String, Object> claims = new LinkedHashMap<>();
        claims.put("schemaVersion", "1.0");
        claims.put("licenseId", licenseId);
        claims.put("tenantId", "VNTECH-HQ");
        claims.put("companyCode", "VNTECH");
        claims.put("productId", "VNTECH-KHO-MEP-001");
        claims.put("issuedAt", Instant.now().minus(1, ChronoUnit.DAYS).toString());
        claims.put("notBefore", Instant.now().minus(1, ChronoUnit.HOURS).toString());
        claims.put("expiresAt", Instant.now().plus(365, ChronoUnit.DAYS).toString());
        return claims;
    }

    private static String publicKeyPem(KeyPair pair) {
        String base64 = Base64.getEncoder().encodeToString(pair.getPublic().getEncoded());
        return "-----BEGIN PUBLIC KEY-----\n" + base64 + "\n-----END PUBLIC KEY-----";
    }

    private static String sign(KeyPair pair, Map<String, Object> payload) throws Exception {
        Signature signer = Signature.getInstance("Ed25519");
        signer.initSign(pair.getPrivate());
        signer.update(LicenseEnvelopeVerifier.canonicalJson(payload).getBytes(StandardCharsets.UTF_8));
        return Base64.getEncoder().encodeToString(signer.sign());
    }

    private static KeyPair newEd25519KeyPair() throws Exception {
        return KeyPairGenerator.getInstance("Ed25519").generateKeyPair();
    }

    // ─────────────────────────── ⓪ canonical JSON ⇄ JS ───────────────────────────

    @Test
    void canonicalJson_khop_dinh_dang_JSON_stringify_cua_JS() {
        Map<String, Object> nested = new LinkedHashMap<>();
        nested.put("b", 1);
        nested.put("a", "x");
        nested.put("z", List.of("k", "m"));
        Assertions.assertEquals("{\"a\":\"x\",\"b\":1,\"z\":[\"k\",\"m\"]}",
                LicenseEnvelopeVerifier.canonicalJson(nested),
                "khoá object phải SẮP theo thứ tự chuỗi như Object.keys().sort() của JS, mảng giữ nguyên thứ tự");
        Assertions.assertEquals("{\"a\":{\"c\":true,\"d\":\"IGNORED\"}}",
                LicenseEnvelopeVerifier.canonicalJson(Map.of("a", Map.of("d", "IGNORED", "c", true))),
                "canonical phải đệ quy xuống object con (và ⛔ không đổi giá trị)");
    }

    // ─────────────────────────── ① chữ ký hợp lệ ───────────────────────────

    @Test
    void install_license_foundation_chu_ky_hop_le_thi_ghi_18_cot_that_va_audit_VERIFIED() throws Exception {
        setupAdmin();
        KeyPair pair = newEd25519KeyPair();
        Map<String, Object> trust = seedTrustRoot(publicKeyPem(pair));
        Map<String, Object> payload = claims("LIC-TEST-OK");
        Map<String, Object> envelope = new LinkedHashMap<>();
        envelope.put("keyId", trust.get("keyId"));
        envelope.put("signature", sign(pair, payload));
        envelope.put("payload", payload);

        // ⚠️ Gửi envelope dưới dạng CHUỖI ⇒ kiểm luôn nhánh `JSON.parse` của tầng web (giống JS).
        String body = JSON.writeValueAsString(Map.of(
                "action", "install_license_foundation",
                "licenseEnvelope", JSON.writeValueAsString(envelope)));

        var result = mockMvc.perform(post("/api/system").cookie(adminCookie)
                        .contentType(MediaType.APPLICATION_JSON).content(body)).andReturn();
        String responseBody = result.getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8);
        Assertions.assertEquals(200, result.getResponse().getStatus(), "body=" + responseBody);
        Assertions.assertTrue(responseBody.contains("Development Mode"), responseBody);
        Assertions.assertTrue(responseBody.contains("\"signatureVerified\":true"), responseBody);

        Integer installed = jdbc.queryForObject(
                "SELECT COUNT(*) FROM vntech_license_installations WHERE license_id='LIC-TEST-OK'", Integer.class);
        Assertions.assertEquals(1, installed, "phải có ĐÚNG 1 hàng license đã xác minh");
        Map<String, Object> row = jdbc.queryForMap(
                "SELECT tenant_id, company_code, product_id, key_id, status, installed_by"
                        + " FROM vntech_license_installations WHERE license_id='LIC-TEST-OK'");
        Assertions.assertEquals("VNTECH-HQ", row.get("tenant_id"));
        Assertions.assertEquals("VNTECH", row.get("company_code"));
        Assertions.assertEquals("VNTECH-KHO-MEP-001", row.get("product_id"));
        Assertions.assertEquals(trust.get("keyId"), row.get("key_id"));
        Assertions.assertEquals("verified_development", row.get("status"));
        Integer verified = jdbc.queryForObject(
                "SELECT COUNT(*) FROM vntech_trust_audit WHERE event_type='LICENSE_VERIFIED'", Integer.class);
        Assertions.assertTrue(verified != null && verified >= 1, "phải ghi nhật ký LICENSE_VERIFIED");
    }

    // ─────────────────────────── ② chữ ký SAI ───────────────────────────

    @Test
    void install_license_foundation_chu_ky_sai_thi_400_khong_ghi_bang_cai_dat() throws Exception {
        setupAdmin();
        KeyPair pair = newEd25519KeyPair();
        Map<String, Object> trust = seedTrustRoot(publicKeyPem(pair));
        Map<String, Object> payload = claims("LIC-TEST-BAD");
        Map<String, Object> envelope = new LinkedHashMap<>();
        envelope.put("keyId", trust.get("keyId"));
        envelope.put("signature", Base64.getEncoder().encodeToString(new byte[64])); // 64 byte 0 ⇒ chữ ký sai
        envelope.put("payload", payload);

        // Ca này gửi envelope dạng ĐỐI TƯỢNG ⇒ kiểm nhánh không-phải-chuỗi.
        String body = JSON.writeValueAsString(Map.of(
                "action", "install_license_foundation", "licenseEnvelope", envelope));

        mockMvc.perform(post("/api/system").cookie(adminCookie)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.ok").value(false))
                .andExpect(jsonPath("$.error", containsString("License không hợp lệ")));

        Integer installed = jdbc.queryForObject(
                "SELECT COUNT(*) FROM vntech_license_installations WHERE license_id='LIC-TEST-BAD'", Integer.class);
        Assertions.assertEquals(0, installed, "⛔ KHÔNG được ghi hàng license khi chữ ký sai");
        Integer rejected = jdbc.queryForObject(
                "SELECT COUNT(*) FROM vntech_trust_audit WHERE event_type='LICENSE_REJECTED'", Integer.class);
        Assertions.assertTrue(rejected != null && rejected >= 1, "phải ghi nhật ký LICENSE_REJECTED");
    }

    // ─────────────────────────── ③④ chuyển license ───────────────────────────

    @Test
    void request_license_transfer_validate_va_ghi_dung_cot_that() throws Exception {
        setupAdmin();
        KeyPair pair = newEd25519KeyPair();
        Map<String, Object> trust = seedTrustRoot(publicKeyPem(pair));
        Map<String, Object> payload = claims("LIC-TEST-TRANSFER");
        Map<String, Object> envelope = new LinkedHashMap<>();
        envelope.put("keyId", trust.get("keyId"));
        envelope.put("signature", sign(pair, payload));
        envelope.put("payload", payload);
        mockMvc.perform(post("/api/system").cookie(adminCookie).contentType(MediaType.APPLICATION_JSON)
                        .content(JSON.writeValueAsString(Map.of("action", "install_license_foundation",
                                "licenseEnvelope", envelope))))
                .andExpect(status().isOk());
        String licenseRowId = jdbc.queryForObject(
                "SELECT id FROM vntech_license_installations WHERE license_id='LIC-TEST-TRANSFER'", String.class);

        // ③ thiếu lý do ⇒ 400 (đúng luật JS «bắt buộc có lý do»)
        mockMvc.perform(post("/api/system").cookie(adminCookie).contentType(MediaType.APPLICATION_JSON)
                        .content(JSON.writeValueAsString(Map.of("action", "request_license_transfer",
                                "licenseId", licenseRowId, "destinationMachineFingerprint", "a".repeat(64)))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("bắt buộc có lý do")));

        // ③ fingerprint sai định dạng ⇒ 400 (JS đòi SHA-256 64 ký tự)
        mockMvc.perform(post("/api/system").cookie(adminCookie).contentType(MediaType.APPLICATION_JSON)
                        .content(JSON.writeValueAsString(Map.of("action", "request_license_transfer",
                                "licenseId", licenseRowId, "destinationMachineFingerprint", "not-a-fingerprint",
                                "reason", "Đổi máy chủ"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("SHA-256")));

        // ④ hợp lệ ⇒ 200 + hàng transfer_request + audit TRANSFER_REQUESTED
        String fingerprint = "b".repeat(64);
        var transferResult = mockMvc.perform(post("/api/system").cookie(adminCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(JSON.writeValueAsString(Map.of("action", "request_license_transfer",
                                "licenseId", licenseRowId, "destinationMachineFingerprint", fingerprint,
                                "reason", "Đổi máy chủ theo kế hoạch")))).andReturn();
        String transferBody = transferResult.getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8);
        Assertions.assertEquals(200, transferResult.getResponse().getStatus(), "body=" + transferBody);

        Map<String, Object> transfer = jdbc.queryForMap(
                "SELECT license_id, destination_machine_fingerprint, reason, status, requested_by,"
                        + " source_machine_fingerprint FROM vntech_license_transfer_requests"
                        + " ORDER BY requested_at DESC LIMIT 1");
        Assertions.assertEquals(licenseRowId, transfer.get("license_id"));
        Assertions.assertEquals(fingerprint, transfer.get("destination_machine_fingerprint"));
        Assertions.assertEquals("requested", transfer.get("status"),
                "JS dùng status='requested' (bản Java CŨ dùng 'pending' — sai hợp đồng)");
        Integer audited = jdbc.queryForObject(
                "SELECT COUNT(*) FROM vntech_trust_audit WHERE event_type='TRANSFER_REQUESTED'", Integer.class);
        Assertions.assertTrue(audited != null && audited >= 1, "phải ghi nhật ký TRANSFER_REQUESTED");
    }
}
