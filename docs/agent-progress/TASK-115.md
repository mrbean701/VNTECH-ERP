# TASK-115 — Vá lược đồ H2 của TEST + 5 khiếm khuyết mã nghiệp vụ mà cổng phơi ra

- **Mốc xuất phát:** `c968988` (HEAD) — cổng `mvn -B -pl web -am test` **ĐỎ** `Tests run: 29, Failures: 3, Errors: 8`.
- **Ngày đo:** 22/09/2026 (log JVM ghi `2026-09-21T…+07:00` — lệch múi giờ log).
- **Kết quả cuối:** `Tests run: 29, Failures: 0, Errors: 0, Skipped: 0` · **BUILD SUCCESS** ✔ (exit 0);
  `application` + `domain` vẫn xanh ✔.
- **2 đợt phạm vi:** đợt 1 (cho phép: `web/src/test/resources/**`, `**/src/test/**`, doc) → **29/6/1**;
  đợt 2 (captain mở thêm `src/main/**` cho (a)+(b) + `tools/generate-h2-test-schema.mjs`) → **29/0/0**.

---

## 1. Bảng TRƯỚC / SAU (nguyên văn dòng tổng)

| Cổng (lệnh) | TRƯỚC (`c968988`) | SAU (cuối TASK-115) |
|---|---|---|
| `mvn -B -pl web -am test` | `[ERROR] Tests run: 29, Failures: 3, Errors: 8, Skipped: 0` ⛔ BUILD FAILURE | `[INFO] Tests run: 29, Failures: 0, Errors: 0, Skipped: 0` ✅ **BUILD SUCCESS** (exit 0) |
| `mvn -B -pl application -am test` | Domain `19/0/0` + Application `16/0/0` ✅ BUILD SUCCESS | `[INFO] Tests run: 19, Failures: 0, Errors: 0, Skipped: 0` (Domain) · `[INFO] Tests run: 16, Failures: 0, Errors: 0, Skipped: 0` (Application) ✅ BUILD SUCCESS (exit 0) |
| `mvn -B -pl domain -am test` | `19/0/0` ✅ BUILD SUCCESS | `[INFO] Tests run: 19, Failures: 0, Errors: 0, Skipped: 0` ✅ BUILD SUCCESS (exit 0) |

Mốc trung gian đáng nhớ: **29/6/1** (hết mọi lỗi SQL của lược đồ, còn 7 ca đỏ thuộc `src/main`) → **29/0/0**.
**Số test KHÔNG đổi (29)** — không thêm phương thức test mới; phần khẳng định luật được **gộp vào ca có sẵn**
(xem §3.3) nên tổng số ca giữ nguyên.

---

## 2. ĐỢT 1 — gốc thuộc LƯỢC ĐỒ/CẤU HÌNH TEST (4 ca xanh)

| # | Tệp : dòng | Thay đổi | Lý do (đã đối chiếu MySQL thật) |
|---|---|---|---|
| 1 | `schema-h2.sql:2286-2289` | `+ stage_kind varchar(16) NOT NULL DEFAULT 'approval'` trên `approval_stage_catalog` | `V21` thêm cột; `RequestStoreAdapter:158,165` lọc `stage_kind='approval'`, `BootstrapDataAdapter:731` đọc `COALESCE(stage_kind,'approval')`. V21/V22 tạo cột bằng **DDL ĐỘNG** (`SET @ddl := IF(...) … PREPARE/EXECUTE`) nên regex của generator **không bắt được** |
| 2 | `schema-h2.sql` | `+ result varchar(32) NOT NULL DEFAULT 'ok'` trên `audit_logs` | `V22` thêm cột; `AuditLogAdapter:56-61,73-90` ghi ở **cả 2 đường ghi** nhật ký |
| 3 | `application-test.yml:18` | `ddl-auto: create-drop` → **`none`** | Hibernate tạo lại `users`/`sessions`/`projects` theo entity ⇒ **mất** `users.password_reset_at`/`password_reset_by` (CÓ trên MySQL thật + CÓ trong `CREATE TABLE users` của `schema-h2.sql`) ⇒ `Column "u.password_reset_at" not found`. `none` làm **lược đồ H2 = chính `schema-h2.sql`**, ĐÚNG như production (`application.yml:14`). ⚠️ BOM đầu tệp bị mất khi ghi lại (chỉ 1 byte, YAML đọc bình thường) |
| 4 | `AdminGovernanceIntegrationTest.java:190` | bỏ **1 giá trị thừa** trong `VALUES` (`…,1,1,1,10,?,?` → `…,1,1,10,?,?`) | `c382b47` xoá cột `version` khỏi **danh sách cột** nhưng quên giá trị ⇒ 8 cột/9 giá trị |

**Ca đã xanh lại:** `SystemControllerAuth#login_wrongPassword…` · `AdminGovernance#auditLog_ghiMoiThayDoi…` ·
`AdminGovernance#workflow_quyTrinhMacDinh_khongChoXoa` · `SystemControllerAuth#fullAuthFlow…` (phải vá **2 lớp**:
`stage_kind` rồi `ddl-auto`).

**Đã thử và GỠ LẠI (không để rác):** thêm `ALTER TABLE users ADD COLUMN password_reset_at` vào `schema-h2.sql`
⇒ vẫn `Column "u.password_reset_at" not found`, chứng minh DDL của Hibernate chạy **sau** script và xoá cột vừa thêm.

---

## 3. ĐỢT 2 — 4 việc captain mở phạm vi (đều là LỖI PRODUCTION THẬT)

### 3.1 (a) `MaterialCatalogStoreAdapter.insertSubcategory` — NULL vào cột NOT NULL

- **Sửa:** khi nơi gọi truyền `null` cho `review_status` thì **BỎ CỘT khỏi câu INSERT** để **DEFAULT của CSDL**
  quyết định (`'approved'`); nhánh có giá trị vẫn ghi như cũ. **KHÔNG hard-code `'approved'` trong mã** ✔.
- **Vì sao KHÔNG bỏ cột trong MỌI trường hợp** (khác đề xuất ban đầu, có lý do): bản JS gốc ghi `review_status`
  ở **MÀN nhóm con** — `scripts/system-route.mjs:2709-2715` tính
  `reviewStatus = hợp lệ ? payload : (subcategoryId ? "approved" : "proposed")` rồi chèn **12 cột**;
  chỉ 2 đường còn lại mới bỏ cột (`:2604` luồng NHẬP danh mục, `:2673` nhóm mặc định `CHUA_PHAN_NHOM`).
  Java đã port đúng phép tính đó (`MaterialCatalogManagementUseCase.java:336-338`, luôn khác `null`).
  ⇒ Bỏ cột trong mọi trường hợp sẽ khiến **mọi nhóm con tạo từ màn hình thành `approved` thay vì `proposed`** (sai parity).
- **Bằng chứng gốc:** MySQL thật `material_subcategories.review_status` = `varchar(255) NOT NULL DEFAULT 'approved'`;
  `sql_mode` có `STRICT_TRANS_TABLES`; probe H2 độc lập: `NULL not allowed for column "review_status" [23502-232]`.
  JS `:2673` không liệt kê cột ⇒ DEFAULT áp dụng.

### 3.2 (b) `OpsTaskStoreAdapter.upsertWorkflow` — ghi cột `version` đã bị xoá

- **Sửa:** bỏ `version` khỏi **INSERT** và bỏ `version=version+1` khỏi **UPDATE** (cùng họ với việc `49da107`
  đã sửa cho các câu SELECT).
- **Bằng chứng:** `V19__drop_workflow_definitions_version.sql:4` đã `DROP COLUMN version`; MySQL thật
  `ERROR 1054 (42S22): Unknown column 'version' in 'field list'` ⇒ lỗi production, không chỉ H2.

### 3.3 (c)+(d) — người tạo ≠ người duyệt; 401 cho ẩn danh

- **Luật «người tạo đơn KHÔNG tự duyệt» GIỮ NGUYÊN** (`RequestManagementUseCase:222-232,352-372`, chặn ở `:607-608`);
  **không nới luật**, **không sửa mã nghiệp vụ** cho việc này.
- **Sửa FIXTURE:** thêm `TestActors.java` (mới) — tạo **người lập phiếu** là tài khoản KHÁC với vai trò `kh_nv`
  (không nằm trong `allowed_role_codes` của bước nào) + phạm vi dự án `write` + quyền module `requests`
  (`canCreate`, kèm dòng `module_catalog` mà `ModulePermissionStoreAdapter.canUseModule` JOIN tới) + đăng nhập
  (hash PBKDF2-SHA256 600k đúng định dạng `Pbkdf2PasswordHasher`: `pbkdf2$600000$saltHex$hashHex`).
  Áp dụng cho 3 ca chuỗi: `RequestApprovalIntegrationTest` (2 ca), `StockChainIntegrationTest`,
  `SupplyChainEndToEndIntegrationTest` — phiếu do `kh.nv*` lập, **admin** (owner của bước) duyệt như cũ.
- **Giữ 1 khẳng định LUẬT** (gộp vào `requestFlow_createAndApprove`, KHÔNG thêm ca mới ⇒ tổng vẫn 29):
  lập phiếu bằng **admin** với seed gốc (`allowed_role_codes` của cả 2 bước đều chứa `admin`) rồi khẳng định
  `approvals.decision_snapshot` chứa **`creator_role_waived`**, comment chứa
  «Người lập phiếu trùng vai trò duyệt», và `decide_approval(stage=1)` trả **400**
  «Hồ sơ chưa đến bước duyệt này hoặc đã được xử lý.» ⇒ luật có hiệu lực thật, không chỉ là comment.
- **(d)** `SystemControllerAuthTest#unknownAction…`: cổng RBAC (`SystemController:205-208`) chạy TRƯỚC `switch`
  ⇒ giữ **401 cho khách ẩn danh** (đúng bảo mật, KHÔNG cho action lạ đi qua cổng); ca test nay **setup lấy phiên
  TRƯỚC** rồi mới gọi action lạ ⇒ kỳ vọng **400** «chưa được triển khai» (`:1196-1199`).
- **Lỗi tiềm ẩn lộ ra thêm ở `AdminCatalogChainIntegrationTest`** (sau khi (a) hết 409): `save_approval_stage`
  trả 400 «Vai trò engineer không tồn tại hoặc đang bị ẩn.» vì `OpsTaskManagementUseCase:458-461` kiểm
  `store.activeRoleCodes()` = `SELECT code FROM role_catalog WHERE active=1` mà **H2 test không nạp dữ liệu tham chiếu**.
  ⇒ vá fixture: seed `role_catalog` cho đúng 2 mã ca này dùng (`engineer`, `admin`).

---

## 4. Bền vững: `tools/generate-h2-test-schema.mjs` (đã sửa + đã kiểm chứng)

1. **Giữ khối thủ công:** generator nay **chép lại nguyên văn** mọi thứ giữa
   `-- [H2-MANUAL-START]` và `-- [H2-MANUAL-END]` của `schema-h2.sql` hiện có ⇒ 2 ALTER `stage_kind`/`result`
   **không còn bị xoá** khi sinh lại (đã chạy thử: `Giữ khối thủ công [H2-MANUAL-START..END]: 4 dòng`).
2. **Tôn trọng `DROP COLUMN`:** generator trước đây dựng `workflow_definitions` từ `V8` (có `version`) và
   **không biết `V19` đã DROP** ⇒ sinh lại sẽ **đưa cột `version` trở lại** (âm thầm đảo ngược WF-03).
   Nay đã thêm nhánh `drops`: sinh lại cho kết quả **0 dòng `version`** ✔ (`Xoá cột H2: workflow_definitions.version`).
3. ⚠️ **Vẫn KHÔNG nên chạy generator blindly:** lần sinh lại còn thay đổi khác (thêm 2 bảng từ migration mới:
   `work_item_comments`, `work_item_participants`) ⇒ **phải review `git diff` + chạy lại cổng** trước khi commit.
   Tệp `schema-h2.sql` đang commit là bản **bàn tay** (đã qua cổng xanh), KHÔNG phải bản vừa sinh.

---

## 5. Bằng chứng trên MySQL THẬT (CHỈ ĐỌC — `PREPARE` chỉ phân tích/kiểm cột, KHÔNG thi hành, KHÔNG ghi dữ liệu)

```sql
-- (b) CÂU CŨ (còn version):  ERROR 1054 (42S22): Unknown column 'version' in 'field list'
PREPARE s_old FROM 'INSERT INTO workflow_definitions (…,active,version,sort_order,…) VALUES (…,1,1,…)';
-- (b) CÂU MỚI (đã sửa):        INSERT_OK   ✔ (chuẩn bị được ⇒ câu lệnh hợp lệ trên MySQL thật)
PREPARE s_new FROM 'INSERT INTO workflow_definitions (id,code,name,description,module_key,project_id,is_default,active,sort_order,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,1,?,?,?,?)';
-- (b) UPDATE MỚI:              UPDATE_OK   ✔
PREPARE u_new FROM 'UPDATE workflow_definitions SET code=?,name=?,description=?,module_key=?,project_id=?,is_default=?,sort_order=?,updated_at=? WHERE id=?';
-- (a) INSERT MỚI (bỏ review_status): SUBCAT_INSERT_OK ✔ (CSDL tự điền DEFAULT 'approved')
PREPARE i_new FROM 'INSERT INTO material_subcategories (id,category_id,code,name,description,scope_examples,adjustment_note,sort_order,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,1,?,?)';
-- Ràng buộc chứng minh (a): review_status | IS_NULLABLE=NO | COLUMN_DEFAULT=approved
SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_DEFAULT FROM information_schema.COLUMNS
 WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='material_subcategories' AND COLUMN_NAME='review_status';
-- Lược đồ tham chiếu: stage_kind varchar(16) NO 'approval' · result varchar(32) NO 'ok' · workflow_definitions KHÔNG có version
-- sql_mode = ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION
```

---

## 6. 3 ca "dây chuyền" — kết luận

| Ca | Kết quả | Ghi chú |
|---|---|---|
| `AdminGovernance#auditLog_ghiMoiThayDoi…` | **TỰ HẾT** ✅ | hệ quả trực tiếp của cột `result` |
| `SystemControllerAuth#fullAuthFlow…` | **HẾT sau 2 LỚP** ✅ | lớp 1 `stage_kind`; lớp 2 `users.password_reset_at` (⇒ `ddl-auto: none`) |
| `AdminCatalogChain#adminCatalogChain` | **HẾT sau 3 LỚP** ✅ | lớp 1 `review_status` (mã nghiệp vụ (a)) → lớp 2 `role_catalog` thiếu seed (fixture) → XANH |
| `SystemControllerAuth#unknownAction…` | **HẾT sau khi sửa TEST** ✅ | giữ 401 cho ẩn danh; ca test đăng nhập trước ⇒ 400 |

---

## 7. Lệnh đã chạy (đúng toolchain đã chỉ định)

```powershell
$jdk = "C:\Users\PC\.jdks\openjdk-26.0.2.1"
$mvnBin = "C:\Users\PC\.m2\wrapper\dists\apache-maven-3.9.16-bin\5grr65jo27hi51sujmtcldfovl\apache-maven-3.9.16\bin"
$env:JAVA_HOME = $jdk; $env:Path = "$jdk\bin;$mvnBin;$env:Path"; cd java-backend

& (Join-Path $mvnBin 'mvn.cmd') -B -pl web -am test        # TRƯỚC: 29/3/8 FAILURE → giữa: 29/6/1 → CUỐI: 29/0/0 SUCCESS
& (Join-Path $mvnBin 'mvn.cmd') -B -pl application -am test # Domain 19/0/0 + Application 16/0/0 SUCCESS
& (Join-Path $mvnBin 'mvn.cmd') -B -pl domain -am test      # 19/0/0 SUCCESS

# Cô lập 1 ca + đọc SQL gây lỗi:
& (Join-Path $mvnBin 'mvn.cmd') -B -pl web -am test "-Dtest=AdminCatalogChainIntegrationTest" "-Dsurefire.failIfNoSpecifiedTests=false" "-Dlogging.level.org.springframework.jdbc=DEBUG"

# Sinh lại schema H2 (kiểm chứng nhánh giữ khối thủ công + DROP COLUMN) — sau đó ĐÃ KHÔI PHỤC bản bàn tay:
node java-backend/tools/generate-h2-test-schema.mjs
```

**Probe H2 độc lập** (không sửa repo; `schema-h2.sql` chạy **sạch 167/167** câu lệnh — bản thân lược đồ không còn lỗi cú pháp):
`C:\Users\PC\AppData\Local\Temp\h2probe\H2Probe.java` với `h2-2.3.232.jar`
→ `INSERT material_subcategories FAILED -> … NULL not allowed for column "review_status" [23502-232]`.

---

## 8. Tệp đã sửa & commit

| Tệp | Loại | Nội dung |
|---|---|---|
| `java-backend/web/src/test/resources/schema-h2.sql` | sửa | +2 ALTER (`stage_kind`, `result`) + mốc `[H2-MANUAL-START/END]` |
| `java-backend/web/src/test/resources/application-test.yml` | sửa | `ddl-auto: none` + chú thích (BOM đầu tệp bị mất) |
| `java-backend/web/src/test/java/…/AdminGovernanceIntegrationTest.java` | sửa | bỏ 1 giá trị thừa trong INSERT `workflow_definitions` |
| `java-backend/web/src/test/java/…/TestActors.java` | **mới** | fixture người lập phiếu khác người duyệt + đăng nhập |
| `java-backend/web/src/test/java/…/RequestApprovalIntegrationTest.java` | sửa | người lập phiếu `kh.nv01` + khẳng định luật `creator_role_waived` |
| `java-backend/web/src/test/java/…/StockChainIntegrationTest.java` | sửa | người lập phiếu `kh.nv.stk` |
| `java-backend/web/src/test/java/…/SupplyChainEndToEndIntegrationTest.java` | sửa | người lập phiếu `kh.nv.e2e` |
| `java-backend/web/src/test/java/…/SystemControllerAuthTest.java` | sửa | `unknownAction` setup trước ⇒ 400 |
| `java-backend/web/src/test/java/…/AdminCatalogChainIntegrationTest.java` | sửa | seed `role_catalog` (engineer/admin) |
| `java-backend/infrastructure/…/MaterialCatalogStoreAdapter.java` | sửa (src/main — captain cho phép) | (a) bỏ `review_status` khi `null` |
| `java-backend/infrastructure/…/OpsTaskStoreAdapter.java` | sửa (src/main — captain cho phép) | (b) bỏ `version` khỏi INSERT/UPDATE |
| `java-backend/tools/generate-h2-test-schema.mjs` | sửa | giữ khối thủ công + tôn trọng `DROP COLUMN` |
| `docs/agent-progress/TASK-115.md` | mới | tệp này |

Commit: xem `git log --oneline -6` (commit ASCII, nhỏ, tách theo việc). **Không** `git add -A`; **không** push;
2 tệp `tests/p2-25-*.test.mjs` giữ nguyên **untracked**; **không** chạm `app/**`, `lib/**`, `scripts/**`, `drizzle/**`.

---

## 9. Điều KHÔNG khẳng định (giới hạn của lượt đo này)

- **KHÔNG** khẳng định (a) đã được chứng minh **bằng cách chạy INSERT thật trên MySQL**: ràng buộc «chỉ đọc»
  nên chỉ dùng `PREPARE` (hợp lệ hoá câu lệnh) + `information_schema` (NOT NULL/DEFAULT) + probe H2. Muốn chứng minh
  bằng thi hành thì phải chạy INSERT rồi `ROLLBACK` trên MySQL thật — **chưa làm**.
- **KHÔNG** khẳng định hành vi auto-hoàn-tất luồng khi **mọi** bước đều bị miễn (`allAutoComplete`) là đúng thiết kế —
  lượt này chỉ ghi nhận nó tồn tại (`RequestManagementUseCase:222-232`) và ca khẳng định luật không phụ thuộc vào nó.
- **KHÔNG** kết luận về môi trường MySQL/production: chỉ ĐỌC `information_schema` + `PREPARE`; **không** ghi dữ liệu,
  **không** chạy `mvn package`, **không** start/stop dịch vụ (`8787` · `9000` · `18081`).
- **CHƯA** xử lý: `MaterialCatalogManagementUseCase.java:582` vẫn **hard-code `"approved"`** cho luồng NHẬP danh mục
  (từ bản vá Q3 18/09/2026). Giá trị lưu **trùng** DEFAULT nên không sai kết quả, nhưng vẫn là nguồn sự thật thứ hai —
  nếu muốn dọn tiếp thì truyền `null` để CSDL quyết định (việc nhỏ, cần chạy lại cổng).

---

## 10. Xác nhận XANH trên cây ĐÃ ĐÓNG BĂNG (chạy lại sau khi commit)

Yêu cầu "green gate": cổng phải được chạy **SAU** thay đổi cuối cùng. Đã chạy lại trên `HEAD c1cfd4a`,
working tree **sạch** (không có thay đổi nào trong phạm vi TASK-115):

| Cổng | Kết quả (nguyên văn) | Exit |
|---|---|---|
| `mvn -B -pl web -am test` | Domain `19/0/0` · Application `16/0/0` · Infrastructure `10/0/0` · **Web `Tests run: 29, Failures: 0, Errors: 0, Skipped: 0`** · `BUILD SUCCESS` | **0** |
| `mvn -B -pl application -am test` | `Tests run: 19, Failures: 0, Errors: 0` + `Tests run: 16, Failures: 0, Errors: 0` · `BUILD SUCCESS` | **0** |
| `mvn -B -pl domain -am test` | `Tests run: 19, Failures: 0, Errors: 0, Skipped: 0` · `BUILD SUCCESS` | **0** |

**Bằng chứng "chạy đúng trên nội dung đã đo"** — hash nội dung `git hash-object` **TRƯỚC** và **SAU** khi chạy là
**giống nhau từng byte** (không tệp nào bị test ghi đè):

```
schema-h2.sql                     99b2eb029a48c5d1007e54e68c814dab6bab6924
application-test.yml              4fa6d682a8791197fa20d6f19655d4df12344392
MaterialCatalogStoreAdapter.java  b12f30de59a4c3f9799c1b7467c94052465f9de3
OpsTaskStoreAdapter.java          0d20a00de5613da299c914bbf1578645bb020677
```

`git status --short -- java-backend docs/agent-progress/TASK-115.md` → **rỗng** (sạch) trước và sau lượt chạy.
