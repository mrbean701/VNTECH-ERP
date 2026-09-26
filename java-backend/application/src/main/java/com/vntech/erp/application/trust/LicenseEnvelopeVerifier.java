package com.vntech.erp.application.trust;

import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.Signature;
import java.security.spec.X509EncodedKeySpec;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/**
 * MT2-P14-03b — <b>XÁC MINH LICENSE ENVELOPE (Ed25519) — PORT TRUNG THÀNH TỪ JS</b>.
 *
 * <p><b>Vì sao có lớp này:</b> bản Java cũ ở {@code SystemSettingsUseCase.installLicenseFoundation}
 * đọc {@code licenseKey/companyName/edition} — hợp đồng JS <b>CŨ</b> — rồi ghi vào các cột
 * {@code license_key/company_name/edition/activated_by/activated_at/created_at} <b>không tồn tại</b>
 * ở cả lược đồ MySQL lẫn SQLite ⇒ action của admin trả lỗi SQL (HTTP 500) và <b>mất bước xác minh chữ ký</b>.
 * Hợp đồng ĐANG CHẠY của JS nằm ở {@code scripts/system-route.mjs} (action {@code install_license_foundation},
 * ~dòng 1998) và dùng {@code lib/trust/license-verifier.mjs} + {@code lib/trust/license-schema.mjs}
 * + {@code lib/trust/canonical-json.mjs}. Lớp này port 1-1 ba tệp đó:
 * <ol>
 *   <li>{@link #canonicalJson(Object)} — bản sao {@code canonicalJson()} của JS: <b>sắp khoá object theo
 *       thứ tự chuỗi</b> (đệ quy; mảng giữ nguyên thứ tự) rồi serialize KHÔNG khoảng trắng.</li>
 *   <li>{@link #verifyEnvelope(Map, Context)} — bản sao {@code verifyLicenseEnvelope()}: kiểm schema trước,
 *       rồi {@code keyId}, chữ ký Ed25519 trên chuỗi canonical, hiệu lực thời gian, sản phẩm, tenant,
 *       công ty, hardware binding — <b>giữ nguyên chuỗi lý do tiếng Việt</b> của JS.</li>
 *   <li>Khoá công khai lấy từ {@code vntech_trust_settings} hàng {@code TRUST-ROOT}
 *       ({@code V3__reference_seed.sql:361}, Ed25519, PEM SPKI).</li>
 * </ol>
 *
 * <p>⚠️ Khác biệt có chủ ý: JS dùng WebCrypto trong môi trường trình duyệt/worker, Java dùng
 * {@code java.security} (JDK 15+ có Ed25519 sẵn) — cùng thuật toán, cùng khoá, cùng payload ⇒ kết quả như nhau.
 */
public final class LicenseEnvelopeVerifier {

    /** Giá trị {@code schemaVersion} hợp lệ — {@code LICENSE_SCHEMA_VERSION} của JS. */
    public static final String SCHEMA_VERSION = "1.0";

    private LicenseEnvelopeVerifier() {
    }

    /** Bối cảnh xác minh — các giá trị JS lấy từ {@code VNTECH_IDENTITY} + {@code TRUST_STATE}. */
    public record Context(String keyId, String publicKeyPem, String productId, String tenantId,
                          String companyCode, String machineFingerprint, Instant now) {
    }

    /** Kết quả xác minh — tương đương object trả về của JS (đủ 5 trường để trả thẳng cho client). */
    public record Verification(boolean valid, boolean signatureVerified, String status, List<String> reasons,
                               Map<String, Object> claims) {

        public Map<String, Object> toMap() {
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("valid", valid);
            out.put("signatureVerified", signatureVerified);
            out.put("status", status);
            out.put("reasons", reasons);
            out.put("claims", claims);
            return out;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ① canonical JSON — bản sao lib/trust/canonical-json.mjs
    // ─────────────────────────────────────────────────────────────────────────

    /** Bản sao {@code canonicalJson(value)} của JS: sắp khoá object ĐỆ QUY rồi serialize. */
    public static String canonicalJson(Object value) {
        StringBuilder out = new StringBuilder();
        writeCanonical(value, out);
        return out.toString();
    }

    private static void writeCanonical(Object value, StringBuilder out) {
        if (value == null) {
            out.append("null");
            return;
        }
        if (value instanceof Map<?, ?> map) {
            TreeMap<String, Object> sorted = new TreeMap<>();
            for (Map.Entry<?, ?> entry : map.entrySet()) sorted.put(String.valueOf(entry.getKey()), entry.getValue());
            out.append('{');
            boolean first = true;
            for (Map.Entry<String, Object> entry : sorted.entrySet()) {
                if (!first) out.append(',');
                first = false;
                out.append(quote(entry.getKey())).append(':');
                writeCanonical(entry.getValue(), out);
            }
            out.append('}');
            return;
        }
        if (value instanceof List<?> list) {
            out.append('[');
            for (int i = 0; i < list.size(); i++) {
                if (i > 0) out.append(',');
                writeCanonical(list.get(i), out);
            }
            out.append(']');
            return;
        }
        if (value instanceof String text) {
            out.append(quote(text));
            return;
        }
        if (value instanceof Boolean flag) {
            out.append(flag ? "true" : "false");
            return;
        }
        if (value instanceof Number number) {
            out.append(numberText(number));
            return;
        }
        out.append(quote(String.valueOf(value)));
    }

    /** ⚠️ Số nguyên in KHÔNG có phần thập phân (giống JSON.stringify); số thực giữ như Java in. */
    private static String numberText(Number number) {
        if (number instanceof Integer || number instanceof Long || number instanceof Short
                || number instanceof Byte) return String.valueOf(number.longValue());
        double asDouble = number.doubleValue();
        if (asDouble == Math.rint(asDouble) && Math.abs(asDouble) < 1e21) return String.valueOf((long) asDouble);
        return String.valueOf(number);
    }

    /** Escape giống {@code JSON.stringify}: {@code "} {@code \} và ký tự điều khiển; ký tự Unicode giữ nguyên. */
    private static String quote(String text) {
        StringBuilder out = new StringBuilder(text.length() + 2).append('"');
        for (int i = 0; i < text.length(); i++) {
            char ch = text.charAt(i);
            switch (ch) {
                case '"' -> out.append("\\\"");
                case '\\' -> out.append("\\\\");
                case '\n' -> out.append("\\n");
                case '\r' -> out.append("\\r");
                case '\t' -> out.append("\\t");
                case '\b' -> out.append("\\b");
                case '\f' -> out.append("\\f");
                default -> {
                    if (ch < 0x20) out.append(String.format("\\u%04x", (int) ch));
                    else out.append(ch);
                }
            }
        }
        return out.append('"').toString();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ② kiểm schema — bản sao lib/trust/license-schema.mjs
    // ─────────────────────────────────────────────────────────────────────────

    private static String text(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private static boolean blank(Object value) {
        return text(value).trim().isEmpty();
    }

    private static boolean parsableInstant(Object value) {
        try {
            Instant.parse(text(value));
            return true;
        } catch (RuntimeException error) {
            return false;
        }
    }

    /** Bản sao {@code validateLicensePayload()} — ⛔ giữ nguyên câu chữ lý do của JS. */
    public static List<String> validatePayload(Object payload) {
        List<String> errors = new ArrayList<>();
        if (!(payload instanceof Map<?, ?>)) return List.of("Payload license phải là object.");
        Map<?, ?> map = (Map<?, ?>) payload;
        for (String key : List.of("schemaVersion", "licenseId", "tenantId", "companyCode", "productId",
                "issuedAt", "notBefore", "expiresAt")) {
            if (blank(map.get(key))) errors.add("Thiếu trường " + key + ".");
        }
        if (!SCHEMA_VERSION.equals(text(map.get("schemaVersion")))) {
            errors.add("schemaVersion phải là " + SCHEMA_VERSION + ".");
        }
        for (String key : List.of("issuedAt", "notBefore", "expiresAt")) {
            if (!blank(map.get(key)) && !parsableInstant(map.get(key))) {
                errors.add(key + " không phải thời điểm ISO hợp lệ.");
            }
        }
        if (!blank(map.get("notBefore")) && !blank(map.get("expiresAt"))
                && parsableInstant(map.get("notBefore")) && parsableInstant(map.get("expiresAt"))
                && !Instant.parse(text(map.get("expiresAt"))).isAfter(Instant.parse(text(map.get("notBefore"))))) {
            errors.add("expiresAt phải sau notBefore.");
        }
        Object features = map.get("features");
        if (features != null) {
            boolean ok = features instanceof List<?> list
                    && list.stream().allMatch((item) -> item instanceof String);
            if (!ok) errors.add("features phải là mảng chuỗi.");
        }
        Object binding = map.get("machineBinding");
        if (binding != null) {
            boolean okBinding = binding instanceof Map<?, ?> bindingMap
                    && List.of("none", "optional", "required").contains(text(bindingMap.get("mode")));
            if (!okBinding) errors.add("machineBinding.mode phải là none, optional hoặc required.");
            if (okBinding) {
                Object allowed = ((Map<?, ?>) binding).get("allowedFingerprints");
                if (allowed != null) {
                    boolean allowedOk = allowed instanceof List<?> list
                            && list.stream().allMatch((item) -> text(item).matches("(?i)^[a-f0-9]{64}$"));
                    if (!allowedOk) errors.add("machineBinding.allowedFingerprints phải là mảng SHA-256.");
                }
            }
        }
        return errors;
    }

    /** Bản sao {@code validateLicenseEnvelope()}. */
    public static List<String> validateEnvelope(Object envelope) {
        List<String> errors = new ArrayList<>();
        if (!(envelope instanceof Map<?, ?> map)) return List.of("License envelope phải là object.");
        errors.addAll(validatePayload(map.get("payload")));
        if (blank(map.get("keyId"))) errors.add("Thiếu keyId.");
        if (blank(map.get("signature"))) errors.add("Thiếu chữ ký license.");
        return errors;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ③ xác minh chữ ký + ràng buộc — bản sao verifyLicenseEnvelope()
    // ─────────────────────────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    public static Verification verifyEnvelope(Map<String, Object> envelope, Context context) {
        List<String> reasons = new ArrayList<>(validateEnvelope(envelope));
        Map<String, Object> claims = envelope != null && envelope.get("payload") instanceof Map<?, ?> payloadMap
                ? new LinkedHashMap<>((Map<String, Object>) payloadMap)
                : null;
        if (!reasons.isEmpty()) return new Verification(false, false, "invalid_schema", reasons, claims);
        Map<String, Object> payload = (Map<String, Object>) envelope.get("payload");
        if (!text(envelope.get("keyId")).equals(text(context.keyId()))) {
            reasons.add("keyId không thuộc Trust Root đang cấu hình.");
        }
        boolean signatureVerified = false;
        try {
            signatureVerified = verifyEd25519(canonicalJson(payload), text(envelope.get("signature")),
                    context.publicKeyPem());
        } catch (RuntimeException error) {
            reasons.add("Không khởi tạo được bộ xác minh Ed25519: " + error.getMessage());
        }
        if (!signatureVerified && reasons.stream().noneMatch((item) -> item.startsWith("Không khởi tạo"))) {
            reasons.add("Chữ ký license không hợp lệ.");
        }
        Instant now = context.now() == null ? Instant.now() : context.now();
        if (parsableInstant(payload.get("notBefore")) && Instant.parse(text(payload.get("notBefore"))).isAfter(now)) {
            reasons.add("License chưa đến thời điểm hiệu lực.");
        }
        if (parsableInstant(payload.get("expiresAt")) && !Instant.parse(text(payload.get("expiresAt"))).isAfter(now)) {
            reasons.add("License đã hết hạn.");
        }
        if (!text(payload.get("productId")).equals(text(context.productId()))) {
            reasons.add("License không thuộc sản phẩm hiện tại.");
        }
        if (!text(payload.get("tenantId")).equals(text(context.tenantId()))) {
            reasons.add("License không thuộc tenant hiện tại.");
        }
        if (!text(payload.get("companyCode")).equals(text(context.companyCode()))) {
            reasons.add("License không thuộc công ty hiện tại.");
        }
        Object bindingRaw = payload.get("machineBinding");
        Map<String, Object> binding = bindingRaw instanceof Map<?, ?> map
                ? new LinkedHashMap<>((Map<String, Object>) map)
                : Map.of("mode", "none", "allowedFingerprints", List.of());
        if ("required".equals(text(binding.get("mode")))) {
            Object allowed = binding.get("allowedFingerprints");
            boolean contained = allowed instanceof List<?> list
                    && list.stream().anyMatch((item) -> text(item).equals(text(context.machineFingerprint())));
            if (!contained) reasons.add("Máy chủ hiện tại không nằm trong hardware binding của license.");
        }
        boolean valid = reasons.isEmpty() && signatureVerified;
        return new Verification(valid, signatureVerified, reasons.isEmpty() ? "valid" : "invalid", reasons, claims);
    }

    /** Xác minh Ed25519 trên chuỗi canonical — khoá công khai PEM (SPKI, base64) từ Trust Root. */
    static boolean verifyEd25519(String canonicalPayload, String signatureBase64, String publicKeyPem) {
        try {
            byte[] der = Base64.getDecoder().decode(publicKeyPem
                    .replace("-----BEGIN PUBLIC KEY-----", "")
                    .replace("-----END PUBLIC KEY-----", "")
                    .replaceAll("\\s+", ""));
            PublicKey publicKey = KeyFactory.getInstance("Ed25519").generatePublic(new X509EncodedKeySpec(der));
            Signature verifier = Signature.getInstance("Ed25519");
            verifier.initVerify(publicKey);
            verifier.update(canonicalPayload.getBytes(StandardCharsets.UTF_8));
            return verifier.verify(Base64.getDecoder().decode(signatureBase64.replaceAll("\\s+", "")));
        } catch (Exception error) {
            throw new IllegalStateException(error.getMessage(), error);
        }
    }
}
