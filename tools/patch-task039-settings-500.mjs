// Vá 2 LỖI 500 của action admin (TASK-039) — port lại ĐÚNG nguồn dữ liệu của JS.
//
// BẰNG CHỨNG TỪ LOG JAVA ĐANG CHẠY:
//   ERROR ... Field 'scope_key' doesn't have a default value
//     INSERT INTO ui_display_settings (id,settings_json,updated_by,updated_at) VALUES ('UI',?,?,?)
//     ← SystemSettingsStoreAdapter.upsertUiDisplaySettings:31 → SystemController:1027
//   ERROR ... Unknown column 'settings_json' in 'field list'
//     INSERT INTO vntech_trust_settings (id,settings_json,updated_by,updated_at) VALUES ('TRUST',?,?,?)
//     ← SystemSettingsStoreAdapter.upsertTrustSettings:46 → SystemController:1032
//
// LƯỢC ĐỒ THẬT (đã đọc, không đoán):
//   ui_display_settings  (drizzle 0020): id · scope_key NOT NULL UNIQUE · settings_json NOT NULL
//                                        · updated_by · created_at NOT NULL · updated_at NOT NULL
//   vntech_trust_settings (V1__baseline:2173-2193): id · trust_mode · enforcement_enabled · tenant_id
//                                        · company_code · key_id · algorithm · public_key_pem
//                                        · brand_fingerprint · release_fingerprint · machine_fingerprint
//                                        · hardware_binding_mode · native_verifier_mode
//                                        · online_attestation_enabled · license_server_url
//                                        · last_attested_at · created_at · updated_at
//                                        ⇒ **KHÔNG có cột `settings_json`**
//   vntech_trust_audit   (V1__baseline:2160-2171): id · event_type · actor_user_id · trust_mode
//                                        · enforcement_enabled · license_id · machine_fingerprint
//                                        · detail_json · occurred_at
//
// JS LÀ NGUỒN SỰ THẬT (scripts/system-route.mjs):
//   ui_display_settings:  INSERT (id,scope_key,settings_json,updated_by,created_at,updated_at)
//                         VALUES ('UI-company','company_default',…)
//                         đọc: WHERE scope_key='company_default'
//   save_trust_development_settings (dòng 1823-1833):
//     · chặn bật enforcementEnabled  · licenseServerUrl bắt buộc HTTPS
//     · UPDATE vntech_trust_settings SET trust_mode='development',enforcement_enabled=0,
//         online_attestation_enabled=0,license_server_url=?,updated_at=? WHERE id='TRUST-ROOT'
//     · ghi 1 dòng vntech_trust_audit event_type='DEVELOPMENT_SETTINGS_UPDATED'
//     · thông điệp: "Đã lưu cấu hình nền; License Enforcement và Online Attestation vẫn tắt theo thiết kế."
import { readFileSync, writeFileSync } from "node:fs";

const PORT = "java-backend/application/src/main/java/com/vntech/erp/application/port/out/SystemSettingsStore.java";
const ADAPTER = "java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/SystemSettingsStoreAdapter.java";
const USECASE = "java-backend/application/src/main/java/com/vntech/erp/application/service/SystemSettingsUseCase.java";

let changed = 0;

// ------------------------------------------------------------------ 1) PORT
{
  const src = readFileSync(PORT, "utf8");
  if (src.includes("updateTrustDevelopmentSettings")) {
    console.log("= port: đã vá trước đó, bỏ qua");
  } else {
    const from = "    void upsertTrustSettings(String json, String updatedBy, Instant now);";
    if (!src.includes(from)) { console.error("HỎNG: không thấy khai báo port cũ"); process.exit(1); }
    const to = `    /**
     * Ghi cấu hình Development Mode — port nguyên trạng JS {@code save_trust_development_settings}.
     *
     * <p><b>Vì sao đổi chữ ký (TASK-039):</b> chữ ký cũ {@code upsertTrustSettings(json, …)} giả định
     * bảng {@code vntech_trust_settings} có cột {@code settings_json} để chứa một khối JSON. Lược đồ
     * thật (V1__baseline:2173-2193) <b>KHÔNG có cột đó</b> ⇒ câu lệnh ném
     * "Unknown column 'settings_json'" ⇒ action trả HTTP 500. JS cũng KHÔNG lưu JSON ở bảng này mà
     * {@code UPDATE} đúng các cột có thật. Nay port theo JS.
     *
     * @param auditId          id dòng audit (JS dùng {@code id("TA")})
     * @param licenseServerUrl URL máy chủ license, đã kiểm HTTPS ở tầng use case; null = không đặt
     * @param actorUserId      người thực hiện (ghi vào audit)
     */
    void updateTrustDevelopmentSettings(String auditId, String licenseServerUrl, String actorUserId, Instant now);`;
    writeFileSync(PORT, src.replace(from, to), "utf8");
    changed++; console.log("✓ port: thay upsertTrustSettings → updateTrustDevelopmentSettings");
  }
}

// ------------------------------------------------------------------ 2) ADAPTER
{
  const src = readFileSync(ADAPTER, "utf8");
  if (src.includes("updateTrustDevelopmentSettings")) {
    console.log("= adapter: đã vá trước đó, bỏ qua");
  } else {
    const lines = src.split(/\r?\n/);
    const at = (n) => lines[n - 1];
    // Khẳng định đúng vùng sắp thay (1-based, theo hồ sơ đã đọc)
    const expects = [
      [29, "@Override @Transactional"],
      [30, "public void upsertUiDisplaySettings"],
      [32, "INSERT INTO ui_display_settings"],
      [39, "readUiDisplaySettings"],
      [40, "WHERE id='UI'"],
      [45, "public void upsertTrustSettings"],
      [47, "INSERT INTO vntech_trust_settings"],
      [54, "readTrustSettings"],
      [57, "}"],
    ];
    for (const [n, needle] of expects) {
      if (!at(n).includes(needle)) {
        console.error(`HỎNG: dòng ${n} không khớp kỳ vọng "${needle}" — DỪNG để không sửa nhầm.`);
        console.error(`      thực tế: ${JSON.stringify(at(n))}`);
        process.exit(1);
      }
    }
    const block = [
      "    @Override @Transactional",
      "    public void upsertUiDisplaySettings(String json, String updatedBy, Instant now) {",
      "        // SỬA LỖI 500 (TASK-039): câu lệnh cũ dùng id='UI' và THIẾU `scope_key` + `created_at`,",
      "        // mà hai cột đó là NOT NULL không có giá trị mặc định ⇒ MySQL trả error 1364",
      "        // \"Field 'scope_key' doesn't have a default value\".",
      "        // Port lại ĐÚNG JS: id='UI-company', scope_key='company_default', có created_at.",
      "        jdbcTemplate.update(\"\"\"",
      "                INSERT INTO ui_display_settings (id,scope_key,settings_json,updated_by,created_at,updated_at)",
      "                VALUES ('UI-company','company_default',?,?,?,?)",
      "                ON DUPLICATE KEY UPDATE settings_json=VALUES(settings_json),updated_by=VALUES(updated_by),",
      "                    updated_at=VALUES(updated_at)\"\"\", json, updatedBy, now, now);",
      "    }",
      "",
      "    @Override",
      "    public Map<String, Object> readUiDisplaySettings() {",
      "        // JS đọc theo scope_key (KHÔNG phải theo id) — xem scripts/system-route.mjs",
      "        Optional<Map<String, Object>> row = first(",
      "                \"SELECT settings_json AS settingsJson FROM ui_display_settings WHERE scope_key='company_default'\");",
      "        return row.orElseGet(Map::of);",
      "    }",
      "",
      "    @Override @Transactional",
      "    public void updateTrustDevelopmentSettings(String auditId, String licenseServerUrl,",
      "                                               String actorUserId, Instant now) {",
      "        // SỬA LỖI 500 (TASK-039): câu lệnh cũ INSERT cột `settings_json` KHÔNG tồn tại trong bảng",
      "        // và dùng id='TRUST' trong khi hàng thật là 'TRUST-ROOT'.",
      "        // Port nguyên trạng JS: UPDATE đúng các cột có thật, rồi ghi 1 dòng audit.",
      "        jdbcTemplate.update(\"\"\"",
      "                UPDATE vntech_trust_settings",
      "                   SET trust_mode='development',enforcement_enabled=0,online_attestation_enabled=0,",
      "                       license_server_url=?,updated_at=?",
      "                 WHERE id='TRUST-ROOT'\"\"\", licenseServerUrl, now);",
      "        jdbcTemplate.update(\"\"\"",
      "                INSERT INTO vntech_trust_audit",
      "                    (id,event_type,actor_user_id,trust_mode,enforcement_enabled,license_id,",
      "                     machine_fingerprint,detail_json,occurred_at)",
      "                VALUES (?,?,?,?,?,?,?,?,?)\"\"\",",
      "                auditId, \"DEVELOPMENT_SETTINGS_UPDATED\", actorUserId, \"development\", 0, null, null,",
      "                \"{\\\"licenseServerUrl\\\":\" + (licenseServerUrl == null ? \"null\" : \"\\\"\" + licenseServerUrl + \"\\\"\")",
      "                        + \",\\\"onlineAttestationEnabled\\\":false}\", now);",
      "    }",
      "",
      "    @Override",
      "    public Map<String, Object> readTrustSettings() {",
      "        // JS đọc license_server_url theo id='TRUST-ROOT'",
      "        Optional<Map<String, Object>> row = first(",
      "                \"SELECT license_server_url AS licenseServerUrl FROM vntech_trust_settings WHERE id='TRUST-ROOT'\");",
      "        return row.orElseGet(Map::of);",
      "    }",
    ];
    const out = [...lines.slice(0, 28), ...block, ...lines.slice(57)].join("\n");
    writeFileSync(ADAPTER, out, "utf8");
    changed++; console.log("✓ adapter: vá 4 phương thức (2 ghi + 2 đọc)");
  }
}

// ------------------------------------------------------------------ 3) USE CASE
{
  const src = readFileSync(USECASE, "utf8");
  if (src.includes("updateTrustDevelopmentSettings")) {
    console.log("= use case: đã vá trước đó, bỏ qua");
  } else {
    const lines = src.split(/\r?\n/);
    if (!lines[252].includes("saveTrustDevelopmentSettings")) {
      console.error("HỎNG: dòng 253 không phải saveTrustDevelopmentSettings — DỪNG.");
      process.exit(1);
    }
    if (lines[261].trim() !== "}") {
      console.error("HỎNG: dòng 262 không phải dấu đóng phương thức — DỪNG.");
      process.exit(1);
    }
    const block = [
      "    /**",
      "     * save_trust_development_settings — port nguyên trạng JS (scripts/system-route.mjs:1823-1833).",
      "     *",
      "     * <p><b>SỬA LỖI (TASK-039):</b> bản cũ nhận payload {developerMode, allowTestData, debugLogging,",
      "     * apiSandbox} và ghi một khối JSON vào cột `settings_json` KHÔNG tồn tại ⇒ HTTP 500. JS không",
      "     * làm vậy: nó chỉ đặt lại trust_mode='development', tắt enforcement/attestation và ghi",
      "     * licenseServerUrl — kèm hai phép kiểm (chặn bật enforcement, bắt buộc HTTPS).",
      "     */",
      "    public Map<String, Object> saveTrustDevelopmentSettings(Principal principal, Map<String, Object> payload) {",
      "        rbac.requireRole(principalAsCurrent(principal), List.of(\"admin\"));",
      "        // JS 1825: bản W2 khóa ở Development Mode, KHÔNG cho bật Production Enforcement.",
      "        Object enforcement = payload.get(\"enforcementEnabled\");",
      "        if (enforcement == Boolean.TRUE",
      "                || List.of(\"1\", \"true\", \"on\").contains(trim(enforcement).toLowerCase())) {",
      "            throw Api(\"Bản W2 đang khóa ở Development Mode. Chỉ được bật Production Enforcement \"",
      "                    + \"bằng quy trình phát hành riêng sau khi chủ sản phẩm chốt.\");",
      "        }",
      "        // JS 1826-1827: URL máy chủ license — rỗng thì null, có thì BẮT BUỘC HTTPS.",
      "        String licenseServerUrl = trim(payload.get(\"licenseServerUrl\"));",
      "        if (!licenseServerUrl.isEmpty() && !licenseServerUrl.toLowerCase(Locale.ROOT).startsWith(\"https://\")) {",
      "            throw Api(\"License Server URL phải dùng HTTPS.\");",
      "        }",
      "        store.updateTrustDevelopmentSettings(idGenerator.next(\"TA\"),",
      "                licenseServerUrl.isEmpty() ? null : licenseServerUrl, principal.userId(), Instant.now());",
      "        // JS 1833: nguyên văn thông điệp trả về.",
      "        return Map.of(\"message\",",
      "                \"Đã lưu cấu hình nền; License Enforcement và Online Attestation vẫn tắt theo thiết kế.\");",
      "    }",
    ];
    const out = [...lines.slice(0, 252), ...block, ...lines.slice(262)].join("\n");
    writeFileSync(USECASE, out, "utf8");
    changed++; console.log("✓ use case: port lại saveTrustDevelopmentSettings theo JS");
  }
}

// ------------------------------------------------------------------ HẬU KIỂM
const p = readFileSync(PORT, "utf8"), a = readFileSync(ADAPTER, "utf8"), u = readFileSync(USECASE, "utf8");
const checks = [
  ["port có chữ ký mới", p.includes("void updateTrustDevelopmentSettings(String auditId, String licenseServerUrl, String actorUserId, Instant now);")],
  // LƯU Ý: KHÔNG kiểm `!p.includes("upsertTrustSettings")` — chuỗi đó HỢP LỆ còn xuất hiện trong
  // javadoc giải thích lý do đổi chữ ký. Phải kiểm đúng dạng KHAI BÁO phương thức.
  ["port KHÔNG còn khai báo upsertTrustSettings", !/void\s+upsertTrustSettings\s*\(/.test(p)],
  ["adapter: ui_display_settings có scope_key", a.includes("INSERT INTO ui_display_settings (id,scope_key,settings_json,updated_by,created_at,updated_at)")],
  ["adapter: dùng id 'UI-company'", a.includes("VALUES ('UI-company','company_default',?,?,?,?)")],
  ["adapter: KHÔNG còn ghi vntech_trust_settings bằng settings_json", !a.includes("INSERT INTO vntech_trust_settings")],
  ["adapter: UPDATE đúng cột + WHERE TRUST-ROOT", a.includes("WHERE id='TRUST-ROOT'")],
  ["adapter: có ghi vntech_trust_audit", a.includes("INSERT INTO vntech_trust_audit")],
  ["use case: chặn bật enforcement", u.includes("Bản W2 đang khóa ở Development Mode")],
  ["use case: bắt buộc HTTPS", u.includes("License Server URL phải dùng HTTPS.")],
  ["use case: dùng idGenerator.next(\"TA\")", u.includes('idGenerator.next("TA")')],
  ["use case: thông điệp nguyên văn của JS", u.includes("Đã lưu cấu hình nền; License Enforcement và Online Attestation vẫn tắt theo thiết kế.")],
];
console.log(`\nĐã sửa ${changed} tệp. Hậu kiểm:`);
let ok = true;
for (const [name, pass] of checks) { console.log(`  ${pass ? "ĐẠT" : "HỎNG"}  ${name}`); if (!pass) ok = false; }
process.exit(ok ? 0 : 1);
