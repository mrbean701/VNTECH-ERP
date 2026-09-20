# TASK-115 — Vá lược đồ H2 của TEST để cổng tích hợp Java xanh trở lại

- **Mốc xuất phát:** `c968988` (HEAD) — cổng `mvn -B -pl web -am test` **ĐỎ** `Tests run: 29, Failures: 3, Errors: 8`.
- **Ngày đo:** 22/09/2026 (log JVM ghi `2026-09-21T…+07:00` — lệch múi giờ log).
- **Phạm vi được phép sửa:** `java-backend/web/src/test/resources/**`, `java-backend/**/src/test/**`,
  `docs/agent-progress/TASK-115.md`. **Đã sửa đúng 3 tệp, KHÔNG chạm `src/main/**`** (xem §7).
- **Kết luận ngắn:** vá được **3 gốc lược đồ test + 1 gốc cấu hình test** ⇒ **11 ca đỏ → 7 ca đỏ**;
  7 ca còn lại **KHÔNG phải lỗi lược đồ test** mà là **5 khiếm khuyết mã nghiệp vụ** (`src/main/**`)
  ⇒ **BLOCKED** theo ràng buộc "không sửa mã nghiệp vụ" (chi tiết §5, §6).

---

## 1. Bảng TRƯỚC / SAU (nguyên văn dòng tổng)

| Cổng (lệnh) | TRƯỚC (`c968988`) | SAU (working tree TASK-115) |
|---|---|---|
| `mvn -B -pl web -am test` | `[ERROR] Tests run: 29, Failures: 3, Errors: 8, Skipped: 0` ⛔ BUILD FAILURE | `[ERROR] Tests run: 29, Failures: 6, Errors: 1, Skipped: 0` ⛔ BUILD FAILURE |
| `mvn -B -pl application -am test` | Domain `19/0/0` + Application `16/0/0` ✅ BUILD SUCCESS | `[INFO] Tests run: 19, Failures: 0, Errors: 0, Skipped: 0` (Domain) · `[INFO] Tests run: 16, Failures: 0, Errors: 0, Skipped: 0` (Application) ✅ BUILD SUCCESS |
| `mvn -B -pl domain -am test` | `19/0/0` ✅ BUILD SUCCESS | `[INFO] Tests run: 19, Failures: 0, Errors: 0, Skipped: 0` ✅ BUILD SUCCESS |

Trong cùng lượt `-pl web -am`: Domain `19/0/0` ✅ · Application `16/0/0` ✅ · Infrastructure `10/0/0` ✅ · **Web `29/6/1` ⛔**.

**Vì sao `Failures` tăng 3 → 6 mà tổng số đỏ lại GIẢM 11 → 7?**
4 ca trước đây chết ở tầng SQL (`Errors`) sau khi vá lược đồ **không còn lỗi SQL** nhưng lộ ra **lỗi nghiệp vụ 400 nằm sẵn bên dưới**
(quy tắc "người tạo không tự duyệt" của commit `42f91be`) ⇒ chúng **chuyển từ `Errors` sang `Failures`**, không phải lỗi mới.
Số đỏ thực: **11 → 7**; trong 7 ca còn lại, **0 ca** có gốc là lược đồ H2.

### 4 ca đã XANH LẠI sau lượt này

| # | Ca (class#method) | Lỗi TRƯỚC (nguyên văn) | Gốc đã vá |
|---|---|---|---|
| 1 | `SystemControllerAuthTest#login_wrongPassword_returns401_sameVietnameseMessage` | `BadSqlGrammarException … INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, before_json, after_json, ip_address, result, occurred_at)` | thiếu cột `audit_logs.result` |
| 2 | `AdminGovernanceIntegrationTest#auditLog_ghiMoiThayDoi_vaKhongGhiDangNhap` | `AssertionFailedError: save_department_permission phải được ghi nhật ký ==> expected: <true> but was: <false>` (đường ghi nhật ký ném lỗi nên không có dòng nào) | thiếu cột `audit_logs.result` |
| 3 | `AdminGovernanceIntegrationTest#workflow_quyTrinhMacDinh_khongChoXoa` | `BadSqlGrammarException … INSERT INTO workflow_definitions (id,code,name,is_default,active,sort_order,created_at,updated_at) VALUES (… ,1,1,1,10,?,?)` (8 cột / 9 giá trị) | lỗi **giá trị thừa** trong chính tệp test |
| 4 | `SystemControllerAuthTest#fullAuthFlow_setupLoginBootstrapLogout` | (a) `Column "stage_kind" not found` → (b) sau khi vá (a): `Column "u.password_reset_at" not found` | 2 lớp: thiếu `stage_kind` + `ddl-auto` của profile test |

---

## 2. Đã thêm/bỏ gì (tệp : dòng) và LÝ DO

### 2.1 `java-backend/web/src/test/resources/schema-h2.sql`

| Dòng | Thay đổi | Lý do |
|---|---|---|
| `2277-2284` | Khối chú thích `[TASK-115]` giải thích vì sao 2 cột dưới bị thiếu | truy vết cho người sau |
| `2285` | `ALTER TABLE approval_stage_catalog ADD COLUMN IF NOT EXISTS stage_kind varchar(16) NOT NULL DEFAULT 'approval';` | `V21__p2_pr_approval_dynamic_default.sql` thêm cột này; `RequestStoreAdapter.java:158,165` (`WHERE active=1 AND stage_kind='approval'`) và `BootstrapDataAdapter.java:731` (`COALESCE(stage_kind,'approval')`) đọc nó |
| `2286` | `ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS result varchar(32) NOT NULL DEFAULT 'ok';` | `V22__ad14_audit_log_result.sql` thêm cột này; `AuditLogAdapter.java:56-61,73-90` ghi nó ở **cả 2 đường ghi** nhật ký |

**Vì sao phải viết tay vào `schema-h2.sql`:** generator `java-backend/tools/generate-h2-test-schema.mjs:70`
chỉ bắt `ALTER TABLE … ADD COLUMN` **literal**; V21/V22 tạo cột bằng **DDL động**
(`SET @ddl := IF(...); PREPARE … EXECUTE`) nên generator **không sinh** 2 dòng này.
⚠️ Hệ quả cần nhớ: **chạy lại generator sẽ xoá 2 dòng 2285-2286** — nếu muốn bền, phải mở rộng regex của
`tools/generate-h2-test-schema.mjs` (ngoài phạm vi TASK-115).

### 2.2 `java-backend/web/src/test/resources/application-test.yml`

| Dòng | Thay đổi | Lý do |
|---|---|---|
| `18` | `ddl-auto: create-drop` → **`ddl-auto: none`** | Hibernate tạo lại `users`/`sessions`/`projects` theo entity ⇒ **mất** cột `users.password_reset_at` / `password_reset_by` (CÓ trong MySQL thật và CÓ trong `CREATE TABLE users` của `schema-h2.sql`, nhưng entity `UserJpaEntity` không khai báo) ⇒ `UserAdminStoreAdapter` ném `Column "u.password_reset_at" not found`. `none` làm **lược đồ H2 = chính `schema-h2.sql`**, ĐÚNG như production (`application.yml:14` cũng `ddl-auto: none`) |
| `5-9` | Khối chú thích `[TASK-115]` | ghi lại lý do + lỗi nguyên văn |
| `3` | Thay dòng cũ "JPA ddl-auto tạo users/sessions trước…" bằng ghi chú "không còn đúng" | dòng cũ đã sai và gây hiểu nhầm chính là nguyên nhân của lỗi này |

Ghi chú kỹ thuật: khi ghi lại `application-test.yml`, **BOM ở đầu tệp bị mất** (diff hiện `-﻿#` → `+#`).
Đã kiểm: YAML + Spring đọc bình thường, cổng chạy được (xem §8). Đây là thay đổi ngoài ý muốn, chỉ ở 1 byte đầu tệp.

**Bằng chứng đã loại phương án "chỉ thêm ALTER cho `users`":** đã thử thêm
`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_at TIMESTAMP(3)` rồi chạy
`-Dtest=SystemControllerAuthTest` ⇒ **vẫn** `Column "u.password_reset_at" not found`
(tức DDL của Hibernate chạy SAU script và xoá cột vừa thêm) ⇒ đã **gỡ 2 ALTER vô hiệu** đó khỏi tệp,
không để lại rác.

### 2.3 `java-backend/web/src/test/java/com/vntech/erp/web/controller/AdminGovernanceIntegrationTest.java`

| Dòng | Thay đổi | Lý do |
|---|---|---|
| `190` | Bỏ **1 giá trị thừa** trong `VALUES`: `…,'Quy trình mặc định',1,1,1,10,?,?)` → `…,'Quy trình mặc định',1,1,10,?,?)` | Commit `c382b47` (PHASE 8 · WF-03) xoá cột `version` khỏi **danh sách cột** nhưng **quên giá trị** `1` (giá trị của `version`) ⇒ 8 cột / 9 giá trị ⇒ `Column count does not match`. Giá trị `10` là `sort_order` (giữ nguyên) |

**Đã cân nhắc và KHÔNG chọn:** thêm cột `version` trở lại `workflow_definitions` của H2. Lý do: MySQL thật
**không còn** cột này (V19 + đo trực tiếp §3), nên thêm lại chỉ để che một lỗi thật của mã nghiệp vụ (§6 #2).

---

## 3. Đối chiếu lược đồ MySQL THẬT (chỉ ĐỌC — `information_schema` / `SELECT`)

```sql
-- approval_stage_catalog
stage_kind   varchar(16)  NO   approval
-- audit_logs
result       varchar(32)  NO   ok
-- workflow_definitions: KHÔNG có cột `version`
-- material_subcategories
review_status varchar(255) NO  approved
SELECT @@sql_mode;  -- ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION
SELECT version FROM workflow_definitions LIMIT 1;
-- ERROR 1054 (42S22) at line 1: Unknown column 'version' in 'field list'
```

⇒ Kiểu + DEFAULT của 2 cột đã thêm vào H2 **khớp 100%** MySQL thật; và `version` đúng là **đã bị xoá ở MySQL**.

---

## 4. 3 ca "dây chuyền" — có TỰ HẾT không?

| Ca dây chuyền (theo giả thuyết của lượt giao việc) | Kết quả đo | Ghi chú |
|---|---|---|
| `AdminGovernanceIntegrationTest#auditLog_ghiMoiThayDoi_vaKhongGhiDangNhap` | **TỰ HẾT** ✅ | hết ngay sau khi thêm `audit_logs.result` (nó chính là hệ quả của gốc #3) |
| `SystemControllerAuthTest#fullAuthFlow_setupLoginBootstrapLogout` | **HẾT nhưng phải vá 2 LỚP** ✅ | lớp 1 `stage_kind`; lớp 2 lộ ra lỗi mới: `Column "u.password_reset_at" not found` (§2.2) |
| `AdminCatalogChainIntegrationTest#adminCatalogChain` (409) | **KHÔNG TỰ HẾT** ⛔ | gốc là mã nghiệp vụ (§6 #1), không phải lược đồ |
| `SystemControllerAuthTest#unknownAction_returns400_notImplementedContract` (401) | **KHÔNG TỰ HẾT** ⛔ | gốc là cổng RBAC ở tầng controller (§6 #5) |

---

## 5. Bảng 7 ca CÒN ĐỎ — gốc KHÔNG thuộc lược đồ test (BLOCKED)

Tất cả 7 ca dưới đây **không thể** sửa bằng lược đồ H2 hay tệp test-setup: gốc nằm ở `src/main/**`
(**bị CẤM sửa** trong lượt này). **Không sửa mã nghiệp vụ.**

| # | Ca | Lỗi nguyên văn (rút gọn) | Gốc (mã nghiệp vụ) | Đề xuất 1 dòng (chờ duyệt) |
|---|---|---|---|---|
| 1 | `AdminCatalogChainIntegrationTest#adminCatalogChain` | `AssertionError: Response status expected:<200> but was:<409>` — body: `{"ok":false,"error":"Dữ liệu vi phạm ràng buộc của hệ thống (trùng hoặc thiếu tham chiếu).…"}` | `MaterialCatalogStoreAdapter.java:199-205` (`insertSubcategory`) truyền **NULL tường minh** cho cột `material_subcategories.review_status` (NOT NULL DEFAULT 'approved' trên MySQL thật, `sql_mode` có `STRICT_TRANS_TABLES`). Đo lại trên H2 độc lập: `NULL not allowed for column "review_status" [23502-232]`. Bản JS gốc `scripts/system-route.mjs:2673` **không liệt kê** cột này ⇒ DEFAULT áp dụng ⇒ lệch parity | Bỏ `review_status`/`adjustment_note` khỏi câu INSERT (hoặc truyền `'approved'`/NULL-có-ý-nghĩa) trong `MaterialCatalogStoreAdapter.insertSubcategory` |
| 2 | `AdminGovernanceIntegrationTest#workflow_multiLuong_anyOf_allOf_vaCacTruongHopBiChan` | `BadSqlGrammarException … INSERT INTO workflow_definitions (id,code,name,description,module_key,project_id,is_default, active,version,sort_order,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,1,1,?,?,?,?)` | `OpsTaskStoreAdapter.java:463-475` vẫn ghi cột `version` (cả `UPDATE … version=version+1` lẫn INSERT) sau khi `V19__drop_workflow_definitions_version.sql:4` xoá cột. MySQL thật: `ERROR 1054 Unknown column 'version'` ⇒ **lỗi production thật**, không chỉ H2 | Bỏ `version` khỏi INSERT và bỏ `version=version+1` khỏi UPDATE (giống việc `49da107` đã làm cho các câu SELECT) |
| 3 | `RequestApprovalIntegrationTest#requestFlow_createAndApprove` | `AssertionError: Status expected:<200> but was:<400>` — `{"error":"Hồ sơ chưa đến bước duyệt này hoặc đã được xử lý."}` | `RequestManagementUseCase.java:222-232` + `:352-372` (commit `42f91be`): bước mà **người lập phiếu** khớp vai trò duyệt bị **bỏ qua**. Test seed bước 1 với `allowed_role_codes='engineer,commander,admin'` và admin vừa là người tạo ⇒ bước 1 bị bỏ qua, `approval_stage` = 2 ⇒ `decide_approval stage=1` chạm `:607-608` ⇒ 400 | Cần quyết định sản phẩm: hoặc (a) cập nhật **seed của test** để người duyệt bước 1 KHÁC người tạo, hoặc (b) giới hạn luật "người tạo không tự duyệt" cho luồng mặc định |
| 4 | `RequestApprovalIntegrationTest#requestFlow_rejectReturnsToRequester` | `JSON path "$.error" expected:<Bắt buộc nhập lý do trả lại / từ chối hồ sơ.> but was:<Hồ sơ chưa đến bước duyệt này hoặc đã được xử lý.>` | **cùng gốc #3** (chặn sớm hơn ở `:607-608` nên không tới được kiểm tra "thiếu lý do" ở `:713-714`) | như #3 |
| 5 | `StockChainIntegrationTest#stockChain_transferReturnStocktakeReconcile` | `AssertionError: Response status expected:<200> but was:<400>` (body `Hồ sơ chưa đến bước duyệt này hoặc đã được xử lý.`) | **cùng gốc #3** (`StockChainIntegrationTest.java:80-101`) | như #3 |
| 6 | `SupplyChainEndToEndIntegrationTest#fullSupplyChain` | `AssertionError: Response status expected:<200> but was:<400>` (body `Hồ sơ chưa đến bước duyệt này hoặc đã được xử lý.`) | **cùng gốc #3** (`SupplyChainEndToEndIntegrationTest.java:89-123`) | như #3 |
| 7 | `SystemControllerAuthTest#unknownAction_returns400_notImplementedContract` | `AssertionError: Status expected:<400> but was:<401>` | `SystemController.java:205-208`: cổng RBAC chạy **TRƯỚC** `switch`, mọi action không công khai đều cần phiên ⇒ khách ẩn danh nhận 401 trước khi tới nhánh `default` trả 400 (`:1196-1199`). Test (`:136-143`) gửi request **không cookie** | Quyết định hợp đồng: hoặc (a) test phải đăng nhập trước khi gọi action lạ (giữ 401 cho ẩn danh — an toàn hơn), hoặc (b) cho action lạ đi qua cổng RBAC để trả 400 |

---

## 6. Lệnh đã chạy (nguyên văn, đúng toolchain đã chỉ định)

```powershell
$jdk = "C:\Users\PC\.jdks\openjdk-26.0.2.1"
$mvnBin = "C:\Users\PC\.m2\wrapper\dists\apache-maven-3.9.16-bin\5grr65jo27hi51sujmtcldfovl\apache-maven-3.9.16\bin"
$env:JAVA_HOME = $jdk; $env:Path = "$jdk\bin;$mvnBin;$env:Path"; cd java-backend

# TRƯỚC (HEAD c968988): Tests run: 29, Failures: 3, Errors: 8
& (Join-Path $mvnBin 'mvn.cmd') -B -pl web -am test

# SAU khi vá 3 gốc lược đồ + tệp test: Tests run: 29, Failures: 6, Errors: 2  (Errors 8 -> 2)
& (Join-Path $mvnBin 'mvn.cmd') -B -pl web -am test

# Thí nghiệm cô lập cho ca AdminCatalog (đọc đúng câu SQL gây 409)
& (Join-Path $mvnBin 'mvn.cmd') -B -pl web -am test "-Dtest=AdminCatalogChainIntegrationTest" "-Dsurefire.failIfNoSpecifiedTests=false" "-Dlogging.level.org.springframework.jdbc=DEBUG"

# Thí nghiệm cô lập cho ca fullAuthFlow (chứng minh ALTER cho `users` bị Hibernate xoá)
& (Join-Path $mvnBin 'mvn.cmd') -B -pl web -am test "-Dtest=SystemControllerAuthTest" "-Dsurefire.failIfNoSpecifiedTests=false"

# SAU khi đổi ddl-auto=none (ĐO CUỐI): Tests run: 29, Failures: 6, Errors: 1
& (Join-Path $mvnBin 'mvn.cmd') -B -pl web -am test
& (Join-Path $mvnBin 'mvn.cmd') -B -pl application -am test   # BUILD SUCCESS
& (Join-Path $mvnBin 'mvn.cmd') -B -pl domain -am test        # BUILD SUCCESS
```

**Probe H2 độc lập (không sửa repo, chạy ngoài `java-backend`)** — dùng để lấy **lỗi nguyên văn** của ca AdminCatalog
(`schema-h2.sql` **chạy sạch 167/167 câu lệnh**, tức bản thân lược đồ không còn lỗi cú pháp):

```powershell
# C:\Users\PC\AppData\Local\Temp\h2probe\H2Probe.java
& "$jdk\bin\java.exe" -cp "$env:USERPROFILE\.m2\repository\com\h2database\h2\2.3.232\h2-2.3.232.jar" `
  H2Probe.java "...\java-backend\web\src\test\resources\schema-h2.sql"
# -> schema statements ok=167 failed=0
# -> INSERT material_subcategories FAILED -> JdbcSQLIntegrityConstraintViolationException:
#    NULL not allowed for column "review_status" … [23502-232]
```

**MySQL thật (chỉ ĐỌC):** `information_schema.COLUMNS` cho 3 bảng + `SELECT @@sql_mode;` + `SELECT version FROM workflow_definitions LIMIT 1;`
(câu cuối trả `ERROR 1054 (42S22)`, xác nhận cột đã bị xoá ở MySQL).

---

## 7. Tệp đã sửa & commit

| Tệp | Loại | Ghi chú |
|---|---|---|
| `java-backend/web/src/test/resources/schema-h2.sql` | sửa | +10 dòng (khối chú thích 2277-2284 + 2 ALTER 2285-2286) |
| `java-backend/web/src/test/resources/application-test.yml` | sửa | `ddl-auto: none` + chú thích; BOM đầu tệp bị mất |
| `java-backend/web/src/test/java/com/vntech/erp/web/controller/AdminGovernanceIntegrationTest.java` | sửa | 1 dòng: bỏ giá trị thừa trong `VALUES` |
| `docs/agent-progress/TASK-115.md` | mới | tệp này |

**Commit:** xem `git log --oneline -2` (2 commit ASCII, xem mục cuối tệp này khi cần).
Không `git add -A`; **không** chạm `src/main/**`, `app/**`, `lib/**`, `scripts/**`, `drizzle/**`;
2 tệp `tests/p2-25-*.test.mjs` giữ nguyên **untracked**.

---

## 8. Điều KHÔNG khẳng định (giới hạn của lượt đo này)

- **KHÔNG** khẳng định cổng `mvn -pl web -am test` đã xanh: sau lượt này vẫn `29/6/1` (7 ca đỏ ở §5).
- **KHÔNG** khẳng định luật "người tạo không tự duyệt" (`42f91be`) là sai — đó là **quyết định sản phẩm**;
  lượt này chỉ chứng minh nó là **nguyên nhân** của 4 ca đỏ #3-#6.
- **KHÔNG** khẳng định ca #1 (`review_status`) và ca #2 (`version`) chỉ ảnh hưởng test: cả hai đều **đã đối chiếu
  MySQL thật** và đều là **lỗi production** (NULL vào cột NOT NULL; ghi cột đã bị xoá).
- **KHÔNG** chạy `package`, **KHÔNG** start/stop dịch vụ (`8787` · `9000` · `18081`), **KHÔNG** ghi vào MySQL thật.
- **CHƯA** kiểm chứng nhánh (a)/(b) của mục #3-#6 và #7 — cần quyết định của người dùng/captain.
