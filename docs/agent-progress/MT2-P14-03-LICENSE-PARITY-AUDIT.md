# MT2-P14-03 · AUDIT LUỒNG LICENSE — **LỖI PARITY, ⛔ KHÔNG PHẢI LỆCH SCHEMA** (23/09/2026)

> Kết quả điều tra 8 tham chiếu cột mà `tools/probe-java-sql-schema.mjs` báo ở `SystemSettingsStoreAdapter`.
> Kết luận: **đây là LỖI MÃ (port theo hợp đồng JS CŨ)** — giống hệt lớp lỗi `TASK-040` đã đặt tên
> («26 lỗi mã · 0 lệch lược đồ»). ⛔ **KHÔNG** thêm cột vào MySQL để «khớp» mã sai.

## 1. Bằng chứng

| Vế | Nội dung | Nguồn |
|---|---|---|
| **JS hiện hành (CHUẨN)** | action `install_license_foundation` nhận `payload.licenseEnvelope` (JSON), **xác minh chữ ký** `verifyLicenseEnvelope(...)`, rồi `INSERT INTO vntech_license_installations(id,license_id,tenant_id,company_code,product_id,key_id,payload_json,signature_base64,status,valid_from,valid_until,machine_fingerprint,verification_detail_json,installed_by,installed_at,last_verified_at,revoked_at,updated_at)` + ghi `vntech_trust_audit` (`LICENSE_VERIFIED` / `LICENSE_REJECTED`) | `scripts/system-route.mjs` (~`:1998-2025`) |
| **JS hiện hành — chuyển license** | `request_license_transfer` nhận `licenseId` + `destinationMachineFingerprint` (phải là **SHA-256 64 hex**) + `reason` (**bắt buộc**), lấy `sourceMachineFingerprint` từ `TRUST_STATE`/`vntech_trust_settings` | `scripts/system-route.mjs` (~`:2026+`) |
| **Lược đồ THẬT** | `vntech_license_installations`: `id · license_id · tenant_id · company_code · product_id · key_id · payload_json · signature_base64 · status · valid_from · valid_until · machine_fingerprint · verification_detail_json · installed_by · installed_at · last_verified_at · revoked_at · updated_at` · `vntech_license_transfer_requests`: `id · license_id · source_machine_fingerprint · destination_machine_fingerprint · recovery_code_hash · reason · status · requested_by · requested_at · approved_at · completed_at · detail_json` | `V*__…sql` (Flyway) |
| **Java đang chạy** | `SystemSettingsUseCase.installLicenseFoundation` đọc `licenseKey`/`companyName`/`edition` ⇒ gọi port ⇒ adapter `INSERT … (id,license_key,company_name,edition,status,activated_by,…)` | `SystemSettingsUseCase.java:210-218` · `SystemSettingsStoreAdapter.java:116-131` |
| **Java — chuyển license** | đọc `licenseId`/`toCompanyName`/`reason` ⇒ adapter `INSERT … (id,license_id,to_company_name,reason,status,…)` và `UPDATE … SET status='transfer_requested'` | `SystemSettingsUseCase.java:220-231` · `SystemSettingsStoreAdapter.java:134-145` |

⇒ 8 cột Java dùng **⛔ không tồn tại ở CẢ lược đồ MySQL lẫn drizzle/SQLite**:
`license_key · company_name · edition · activated_by · activated_at · created_at` (installations) và `to_company_name · created_at` (transfer_requests).

## 2. Hệ quả thực tế
Admin bấm «Kích hoạt license» / «Yêu cầu chuyển license» ⇒ Java chạy SQL sai cột ⇒ **lỗi SQL (HTTP 500)**, ⛔ tính năng không hoạt động; đồng thời **mất bước xác minh chữ ký** mà JS có (Java hiện ⛔ không verify envelope).

## 3. Đường sửa (⛔ không suy diễn nghiệp vụ — BÁM NGUYÊN JS)
1. **Port**: đổi hợp đồng `SystemSettingsStore` sang đúng bộ cột thật
   - `installLicenseFoundation(...)`: nhận `licenseId/tenantId/companyCode/productId/keyId/payloadJson/signatureBase64/validFrom/validUntil/machineFingerprint/verificationDetailJson/installedBy/now` (gói trong 1 record để ⛔ tránh 13 tham số rời).
   - `requestLicenseTransfer(licenseId, sourceFingerprint, destinationFingerprint, reason, requestedBy, now)`.
2. **Use case**: đọc `licenseEnvelope` (chuỗi JSON ⇒ parse), **xác minh Ed25519** bằng khoá công khai trong `vntech_trust_settings` hàng `TRUST-ROOT` (`V3__reference_seed.sql:361` — có sẵn `Ed25519` + PEM) ⇒ hợp lệ thì ghi installations + `vntech_trust_audit` `LICENSE_VERIFIED`; ⛔ không hợp lệ ⇒ ghi `LICENSE_REJECTED` + trả lỗi (đúng thông điệp JS).
3. **Chuyển license**: validate `destinationMachineFingerprint` = 64 hex, `reason` bắt buộc, `sourceMachineFingerprint` lấy từ trust settings — trả về đúng thông điệp JS.
4. **Test**: H2 fixture (đã có bảng + hàng `TRUST-ROOT`) — ca âm (envelope sai ⇒ 400/REJECTED, ⛔ không ghi installations) · ca dương (envelope đúng ⇒ 200, đọc lại thấy hàng installations + audit) · probe SQL ⇒ **8 mismatch = 0**.
5. ⛔ **KHÔNG** đổi migration/lược đồ để chiều theo mã sai (giữ nguyên nguyên tắc `TASK-040`).

## 4. Trạng thái
- `MT2-P14-03` (QA DB) **vẫn BLOCKED** cho tới khi hết 8 mismatch. → ✅ **ĐÃ GỠ 23/09/2026 — `P14-03 = DONE`** (xem §5).
- ➕ **Task mới `MT2-P14-03b`** được tạo để làm đường sửa ở §3 (⛔ không cần user quyết vì hợp đồng đã có sẵn trong repo: JS là nguồn sự thật bản port).
- Việc **bắt buộc cần user** duy nhất còn lại của nhóm license: ⛔ **không có** — khác với P5-03/P5-04 (ngưỡng «phó GĐ») và P10-05 (`correspondence_id` — cột mới là lựa chọn nghiệp vụ).

---

## 5. ✅ KẾT QUẢ THI HÀNH 23/09/2026 — P14-03b DONE ⇒ P14-03 DONE

**Đã làm (đúng 5 bước §3):**

| Bước | Nội dung | Tệp |
|---|---|---|
| ① | Lớp **MỚI** xác minh envelope = port 1-1 `lib/trust/{canonical-json,license-schema,license-verifier}.mjs`: canonical JSON (sắp khoá **đệ quy**), validate schema, **Ed25519** bằng JDK `java.security` (⛔ không thêm dependency) | `java-backend/application/src/main/java/com/vntech/erp/application/trust/LicenseEnvelopeVerifier.java` |
| ② | Port sang hợp đồng THẬT: `readTrustIdentity()` · `installLicenseFoundation(Map)` · `recordTrustAudit(...)` · `requestLicenseTransfer(licenseId, source, destination, reason, …)` | `application/.../port/out/SystemSettingsStore.java` |
| ③ | Adapter: ghi **ĐÚNG 18 cột** `vntech_license_installations` + 12 cột `vntech_license_transfer_requests` (**`status='requested'`**) + `vntech_trust_audit`; ⛔ bỏ 8 cột không tồn tại; ⛔ bỏ `UPDATE … status='transfer_requested'` (JS không làm); dùng **UPDATE-then-INSERT** để chạy trên CẢ MySQL và H2 | `infrastructure/.../SystemSettingsStoreAdapter.java` |
| ④ | Use case: đọc `licenseEnvelope`; hợp lệ ⇒ ghi + `LICENSE_VERIFIED` + trả thông điệp Development Mode; ⛔ không hợp lệ ⇒ `LICENSE_REJECTED` + 400 «License không hợp lệ: …»; validate `reason` bắt buộc + fingerprint 64-hex | `application/.../service/SystemSettingsUseCase.java` |
| ⑤ | Tầng web parse chuỗi JSON của `licenseEnvelope` (giữ đúng câu lỗi JS «Nội dung license không phải JSON hợp lệ.») | `web/.../SystemController.java` |

**BẰNG CHỨNG (đo trong phiên):**
- Test MỚI `java-backend/web/src/test/java/com/vntech/erp/web/controller/LicenseFoundationParityTest.java` ⇒ **4/4 XANH**: canonical JSON ⇄ JS · chữ ký hợp lệ ⇒ 200 + hàng license (đủ `tenant_id/company_code/product_id/key_id/status=verified_development`) + audit `LICENSE_VERIFIED` · **chữ ký SAI ⇒ 400 + ⛔ KHÔNG ghi hàng + audit `LICENSE_REJECTED`** · chuyển license: thiếu lý do ⇒ 400, fingerprint sai ⇒ 400, hợp lệ ⇒ 200 + `status='requested'` + audit `TRANSFER_REQUESTED`.
- **Full Java**: `mvn -pl web -am test` ⇒ **Tests run: 61, Failures: 0, Errors: 0 · BUILD SUCCESS** (⚠️ số baseline ghi cũ «42 test · 3 Failures có sẵn» nay **KHÔNG còn đúng** — 3 ca đó đã xanh).
- `node tools/probe-java-sql-schema.mjs` ⇒ **«KẾT LUẬN: không thấy tham chiếu bảng/cột sai trong SQL tĩnh (INSERT/UPDATE) ✅»** (127 bảng · 1615 cột · 108 tệp Java; **8 mismatch license = 0**).
- `node tools/probe-schema-drift.mjs` ⇒ **«tệp migration TÁI LẬP ĐƯỢC DB đang chạy (0 lệch) ✅»**.
- `node tools/p2-reference-integrity.mjs` ⇒ **«ĐẠT — 15/15 cặp quan hệ không có dòng mồ côi»**.

**🎓 BÀI HỌC MỚI (đã trả giá 1 vòng test):** **H2 trả NHÃN CỘT VIẾT HOA** (`TENANTID`) còn MySQL giữ camelCase (`tenantId`) ⇒ `queryForList` + `out.putAll(row)` làm **mọi giá trị RỖNG** trên H2; triệu chứng đo được: «keyId không thuộc Trust Root đang cấu hình» + «Không khởi tạo được bộ xác minh Ed25519: Unable to decode key» + «không thuộc tenant/công ty» (⛔ trông như lỗi CHỮ KÝ nhưng thật ra là lỗi ĐỌC CẤU HÌNH). Đã vá bằng tra khoá **không phân biệt hoa/thường**.

**Trạng thái:** ✅ **P14-03b = DONE** · ✅ **P14-03 = DONE** ⇒ **PHASE 14 = 5/6** (còn `P14-05` final audit, chờ user gỡ blocker còn lại) · MT2 **92/100 = 92,0 %**. ⛔ NO COMMIT · NO PUSH.
