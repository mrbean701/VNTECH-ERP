# TASK-039 — Ba chỗ lệch làm 2 action admin lỗi HTTP 500 và 1 cấu hình ghi được mà không đọc ra

**Trạng thái:** DONE — đã kiểm chứng **lúc chạy** (probe 10/10, exit 0)
**Nguồn phát hiện:** đọc **log của Java đang chạy** (cùng cách đã tìm ra TASK-025)
**Ngày:** 18/09/2026 · **Commit:** #45

---

## 1. Bằng chứng từ log (không suy đoán)

```
ERROR ... Field 'scope_key' doesn't have a default value
  INSERT INTO ui_display_settings (id,settings_json,updated_by,updated_at) VALUES ('UI',?,?,?)
  ← SystemSettingsStoreAdapter.upsertUiDisplaySettings:31 → SystemController:1027

ERROR ... Unknown column 'settings_json' in 'field list'
  INSERT INTO vntech_trust_settings (id,settings_json,updated_by,updated_at) VALUES ('TRUST',?,?,?)
  ← SystemSettingsStoreAdapter.upsertTrustSettings:46 → SystemController:1032
```

⇒ Hai action admin **`save_ui_display_settings`** và **`save_trust_development_settings`** trả **HTTP 500**
mỗi lần được gọi. (Log ghi nhận đúng lúc probe TASK-027 gọi chúng — tức probe đã **làm lộ** lỗi này.)

## 2. Lược đồ THẬT (đọc mã, không đoán)

| Bảng | Cột |
|---|---|
| `ui_display_settings` (drizzle `0020`) | `id · scope_key NOT NULL UNIQUE · settings_json NOT NULL · updated_by · created_at NOT NULL · updated_at NOT NULL` |
| `vntech_trust_settings` (`V1__baseline.sql:2173-2193`) | `id · trust_mode · enforcement_enabled · tenant_id · company_code · key_id · algorithm · public_key_pem · brand_fingerprint · release_fingerprint · machine_fingerprint · hardware_binding_mode · native_verifier_mode · online_attestation_enabled · license_server_url · last_attested_at · created_at · updated_at` — **KHÔNG có `settings_json`** |
| `vntech_trust_audit` (`V1__baseline.sql:2160-2171`) | `id · event_type · actor_user_id · trust_mode · enforcement_enabled · license_id · machine_fingerprint · detail_json · occurred_at` |

## 3. Ba chỗ lệch — Java không khớp JS (nguồn sự thật)

| | JS (`scripts/system-route.mjs`) | Java TRƯỚC khi vá |
|---|---|---|
| `ui_display_settings` — ghi | `id='UI-company'`, `scope_key='company_default'`, có `created_at` | `id='UI'`, **thiếu `scope_key` + `created_at`** ⇒ error 1364 |
| `ui_display_settings` — đọc | theo `scope_key='company_default'` | theo `id='UI'` |
| `ui_display_settings` — **bootstrap đọc** | `scope_key='company_default'` | **`scope_key='GLOBAL'`** ⇒ **ghi được mà không bao giờ đọc ra** |
| `vntech_trust_settings` — ghi | `UPDATE` `trust_mode/enforcement_enabled/online_attestation_enabled/license_server_url` `WHERE id='TRUST-ROOT'` + 1 dòng audit | **`INSERT` cột `settings_json` không tồn tại**, lại dùng `id='TRUST'` |
| `save_trust_development_settings` — payload | `licenseServerUrl` | `{developerMode, allowTestData, debugLogging, apiSandbox}` |
| — kiểm tra | **chặn bật enforcement** + **bắt buộc HTTPS** | **không có** |
| — thông điệp | "Đã lưu cấu hình nền; License Enforcement và Online Attestation vẫn tắt theo thiết kế." | "Đã lưu cấu hình môi trường phát triển." |

⇒ Không chỉ sai cú pháp SQL: Java **port sai cả nguồn dữ liệu lẫn nghiệp vụ** (vi phạm quyết định #9:
*"khi port từ JS sang Java phải port cả NGUỒN DỮ LIỆU"*).

## 4. Bản vá (port lại đúng JS)

**`SystemSettingsStore` (port)** — đổi chữ ký cho khớp thực tế lược đồ:
```java
void updateTrustDevelopmentSettings(String auditId, String licenseServerUrl, String actorUserId, Instant now);
```

**`SystemSettingsStoreAdapter`** — 4 phương thức:
```sql
INSERT INTO ui_display_settings (id,scope_key,settings_json,updated_by,created_at,updated_at)
VALUES ('UI-company','company_default',?,?,?,?)
ON DUPLICATE KEY UPDATE settings_json=VALUES(settings_json),updated_by=VALUES(updated_by),updated_at=VALUES(updated_at)

UPDATE vntech_trust_settings
   SET trust_mode='development',enforcement_enabled=0,online_attestation_enabled=0,
       license_server_url=?,updated_at=?
 WHERE id='TRUST-ROOT'

INSERT INTO vntech_trust_audit (id,event_type,actor_user_id,trust_mode,enforcement_enabled,license_id,
       machine_fingerprint,detail_json,occurred_at) VALUES (?,?,?,?,?,?,?,?,?)
```
Hai hàm **đọc** cũng sửa theo JS (`scope_key='company_default'`, `license_server_url WHERE id='TRUST-ROOT'`).
Ghi chú: cả hai hàm đọc **trước đây là mã chết** (khai báo nhưng **không nơi nào gọi**) — vẫn sửa để không
để lại mìn cho người gọi sau.

**`SystemSettingsUseCase.saveTrustDevelopmentSettings`** — port nghiệp vụ JS: chặn bật Production
Enforcement, bắt buộc HTTPS cho `licenseServerUrl`, dùng `idGenerator.next("TA")` cho id audit, trả
**nguyên văn** thông điệp của JS.

**`BootstrapDataAdapter`** — sửa chỗ lệch thứ ba: `scope_key='GLOBAL'` → `scope_key='company_default'`.

## 5. 🔍 Chỗ lệch thứ BA do **CHÍNH PHÉP KIỂM CỦA TÔI** bắt được

Sau khi vá 2 lỗi 500, probe báo **9/10**: hai action trả **200**, nhưng **`uiDisplaySettings` đọc lại ra `null`**.
Nếu chỉ kiểm "hết 500" thì đã kết luận xong và **bỏ sót** việc cấu hình **ghi được nhưng không bao giờ hiện ra**.
Chính phép kiểm "đọc lại sau khi ghi" đã lộ ra `BootstrapDataAdapter` đọc `scope_key='GLOBAL'`.

**Bằng chứng chỗ lệch này là duy nhất:** quét toàn kho Java + drizzle, chỉ có **một** nơi dùng `'GLOBAL'`
(chính `BootstrapDataAdapter:594`), còn đường ghi và JS đều dùng `'company_default'`.

## 6. Kiểm chứng

| Bước | Kết quả |
|---|---|
| Hậu kiểm bản vá (`tools/patch-task039-settings-500.mjs`) | **11/11 ĐẠT** |
| `verify-java-compile.ps1` | **SUCCEEDED** — 102 tệp, 0 lỗi, 155 `.class` |
| `mvn -DskipTests package` | **thành công** — fat jar **90.884.756 bytes** (13:24:08) |
| Java khởi động lại | `/actuator/health` **200** (PID 18504) |
| **Probe lúc chạy** (`tools/probe-settings-fix.mjs`) | **10/10 ĐẠT · exit 0** |

Kết quả probe:
```
save_ui_display_settings        -> HTTP 200  Đã lưu giao diện hiển thị.
save_ui_display_settings #2     -> HTTP 200  (upsert chạy được)
save_trust_development_settings -> HTTP 200  Đã lưu cấu hình nền; License Enforcement và Online Attestation vẫn tắt theo thiết kế.
  · cố bật enforcementEnabled   -> HTTP 400  Bản W2 đang khóa ở Development Mode. …
  · URL http:// (không HTTPS)   -> HTTP 400  License Server URL phải dùng HTTPS.
uiDisplaySettings đọc lại       -> {"id":"UI-company","scopeKey":"company_default","settingsJson":"{\"theme\":\"light\",…"}
```

## 7. An toàn dữ liệu khi kiểm chứng

Cả hai action **ghi** cấu hình. Để không đổi cấu hình/giao diện thật, probe **đọc giá trị hiện tại rồi ghi
lại đúng giá trị đó**, và gọi trust ở trạng thái đang có (development/0/0/url rỗng). Nhờ vậy chứng minh được
đường ghi mà **không thay đổi cấu hình**.

## 8. Files Changed

* `java-backend/application/.../port/out/SystemSettingsStore.java` — chữ ký mới + javadoc lý do
* `java-backend/infrastructure/.../persistence/SystemSettingsStoreAdapter.java` — 4 phương thức
* `java-backend/application/.../service/SystemSettingsUseCase.java` — port nghiệp vụ JS
* `java-backend/infrastructure/.../persistence/BootstrapDataAdapter.java` — `scope_key` cho khớp
* `tools/patch-task039-settings-500.mjs`, `tools/probe-settings-fix.mjs` (mới)
* `docs/agent-progress/TASK-039.md` (mới), `TASK_INDEX.md`, `MASTER_STATUS.md`

**Database / API / Permission / Workflow:** không đổi lược đồ, không thêm/bớt action, không đổi cổng quyền.
Chỉ sửa **câu lệnh SQL** cho khớp lược đồ sẵn có và **port lại nghiệp vụ JS**.

## 9. Decisions

1. **Port theo JS** thay vì "sửa cho chạy": vì JS là nguồn sự thật và Java đang sai cả nguồn dữ liệu lẫn
   nghiệp vụ (quyết định #9).
2. **Sửa luôn 2 hàm đọc chết** thay vì để nguyên — tránh mìn cho người gọi sau.
3. **Không thêm cột `settings_json`** vào `vntech_trust_settings`: làm vậy là mở rộng lược đồ để chiều theo
   một port sai, trong khi JS không hề lưu JSON ở bảng này.

## 10. Limitations

* Probe gọi action bằng **tài khoản admin** trên đường chạy thật `:9000`; chưa kiểm giao diện vẽ lại giá trị
  vừa ghi (cần bản dựng UI — đang chặn ở TASK-034). Tuy nhiên `uiDisplaySettings` đã đọc lại được từ
  `bootstrap`, tức **đường dữ liệu UI sẽ dùng đã đúng**.
* Chưa chạy `mvn test` (bộ test Java) — nhưng đã xác nhận **không test nào** tham chiếu 2 phương thức này.

## 11. Next Task

* Bản dựng UI (TASK-034) sẽ cho phép kiểm nốt phần hiển thị của cấu hình vừa ghi.

## 12. Continuation Notes

1. **Bài học:** biên dịch sạch **không** chứng minh SQL đúng (đúng như TASK-025). Phải **gọi thật và đọc
   phản hồi**.
2. **Bài học quan trọng hơn:** nếu chỉ kiểm "hết 500" thì đã **bỏ sót** chỗ lệch thứ ba. Phép kiểm **"ghi
   xong ĐỌC LẠI"** mới là phép kiểm đủ — hãy giữ nó cho mọi thay đổi có ghi dữ liệu.
3. Khi thấy một cặp **ghi/đọc** cùng một bảng, **luôn so khoá mà hai bên dùng** (`id` vs `scope_key`,
   `'TRUST'` vs `'TRUST-ROOT'`, `'GLOBAL'` vs `'company_default'`). Lệch khoá ⇒ ghi được mà không đọc ra.
4. Phép kiểm khẳng định vùng sắp sửa (assert trước khi ghi) đã **cứu một lần**: script dừng lại vì lệch
   1 dòng thay vì sửa nhầm. Giữ thói quen này.
