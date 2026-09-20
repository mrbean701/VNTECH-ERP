# TASK-106 — PHASE 2 (§6 · §23 · §24): LUỒNG DUYỆT PR ĐỘNG + CẤP QUYỀN TẠO PR CHO MỌI USER

**Ngày:** 21/09/2026 · **Người chỉ đạo:** người dùng (5 chỉ đạo nguyên văn) + captain (chốt phương án A)
**Phạm vi tệp đã sửa:** `scripts/system-route.mjs` · `lib/**` · `app/**` (vùng duyệt PR) · `drizzle/**` (ADDITIVE) ·
Flyway `java-backend/infrastructure/src/main/resources/db/migration/V21__…sql` · `java-backend/**` (4 điểm engine live, CHỈ source)
· `tests/**`. **KHÔNG xoá bảng/cột/dữ liệu** (ràng buộc cứng #5) · **KHÔNG build** · **KHÔNG restart dịch vụ**.

---

## 1. CHỈ ĐẠO ĐÃ THỰC HIỆN

| # | Chỉ đạo người dùng (nguyên văn rút gọn) | Kết quả |
|---|---|---|
| 1 | «luồng duyệt chính là workflow động… workflow thay đổi thì luồng duyệt cũng thay đổi theo» | ✅ Bước duyệt suy 100 % từ `approval_stage_catalog` (dữ liệu), bỏ literal ở **cả 2 engine (JS + Java)** |
| 2 | «mỗi tác nhân = 1 người duyệt, không tính người tạo đơn (canCreatePR)» | ✅ Mặc định 4 bước `single` đúng đặc tả §6 + luật «người tạo không tự duyệt» (JS + Java) |
| 3 | «đơn đề nghị mua hàng nên tất cả các user đều có quyền tạo» | ✅ Bỏ chốt cứng vai trò (2 tệp JS + 2 tệp Java) + cấp quyền TẠO cho **toàn bộ user hiện có** (12/12) + user mới theo MẪU phòng ban |
| 4 | «database hiện tại chỉ có dữ liệu test… insert tuỳ ý miễn test thành công» | ✅ Đã INSERT tài khoản Giám đốc demo + phân công Owner bước 5 (đo được, xem §5) |
| 5 | ⛔ «không xoá bất cứ table hay trường nào khi chưa hỏi» | ✅ Không một câu `DROP`/`DELETE`/`TRUNCATE` nào; chỉ 1 cột THÊM (`stage_kind`) + dòng cấu hình/quyền |

## 2. VIỆC 1 — BỎ HARD-CODE, LUỒNG SUY TỪ CATALOG

### 2.1 Vị trí hard-code đã xoá

| Tệp:dòng (TRƯỚC) | Nội dung TRƯỚC | SAU |
|---|---|---|
| `scripts/system-route.mjs:1744` | `stage < 100 ? SELECT… : {stageNo: stage, name: stage===101?'Lập & phát hành PO':…, allowedRoleCodes: stage===101?'procurement,kh_nv,kh_truong':…}` | `const stageCfg = await first('SELECT stage_no AS stageNo,name,allowed_role_codes AS allowedRoleCodes FROM approval_stage_catalog WHERE stage_no=? AND active=1', stage)`; thiếu ⇒ lỗi rõ ràng |
| `scripts/system-route.mjs:555` | `stage > 0 && stage < 100 ? … : null` + nhãn cứng `'Mua hàng'` | Tra tên bước theo `stage_no` cho **mọi** bước |
| `scripts/system-route.mjs:495` (`approvalStages`) | `WHERE active=1` (mốc ngầm `stage_no < 100`) | `WHERE active=1 AND stage_kind='approval'` (phân loại bằng **DỮ LIỆU**) |
| `app/page.tsx` (modal email/Owner) | `for (const stageNo of [101,102,103])` + `[[101,"Lập & phát hành PO"],[102,"Giao nhận"],[103,"BCH xác nhận giao hàng"]]` | `supplyStages` / `activeStages` suy từ `data.approvalStages` theo `stageKind` |
| `java-backend/…/RequestStoreAdapter.java:147` | `FROM approval_stage_catalog WHERE active=1 ORDER BY stage_no` | `… WHERE active=1 AND stage_kind='approval'` + trả `COALESCE(stage_kind,'approval') AS stageKind` |
| `java-backend/…/BootstrapDataAdapter.java:729` | không trả `stageKind` | trả `stageKind` để UI phân biệt hai loại bước |
| `scripts/system-route.mjs:962` + `945` | `requireRole(user,["engineer","commander","admin"])` (TẠO phiếu + ĐỐI CHIẾU FILE) | BỎ; quyền vẫn qua `requireActionModule` (`requests`/`canCreate`) + `canAccessProject` |
| `java-backend/…/RequestManagementUseCase.java:63` · `AdminOpsManagementUseCase.java:128` | `rbac.requireRole(…, List.of("engineer","commander","admin"))` | BỎ (đo live: tài khoản `director` bị **403** trước khi vá) |

### 2.2 Cấu hình mặc định 4 bước theo đặc tả §6 (DỮ LIỆU, không phải mã nguồn)

Bảng `approval_stage_catalog` — **chỉ UPDATE dòng đã có + INSERT dòng còn thiếu**, không xoá dòng nào:

| `stage_no` | `stage_kind` | `name` | `allowed_role_codes` | `approval_mode` | SLA | `active` |
|---|---|---|---|---|---|---|
| 1 | approval | CHT xác nhận nhu cầu | `commander,cht` | single | 12 | **0** (ngừng áp dụng cho phiếu mới) |
| 2 | approval | Thư ký Tổng giám đốc | `thuky,thu_ky_tgd` | single | 12 | 1 (bước 1/4) |
| 3 | approval | Phòng Dự án | `project,da_nv` | single | 24 | 1 (bước 2/4) |
| 4 | approval | Phòng Kế hoạch | `procurement,kh_nv` | single | 24 | 1 (bước 3/4) |
| 5 | approval | Giám đốc | `director,tgd,giam_doc` | single | 12 | 1 (bước 4/4) |
| 101 | supply | Lập & phát hành PO | `procurement,kh_nv,kh_truong` | single | 24 | xem §6 |
| 102 | supply | Giao nhận | `warehouse,thu_kho` | single | 24 | xem §6 |
| 103 | supply | BCH xác nhận giao hàng | `commander,cht` | single | 24 | xem §6 |

Nguồn: `drizzle/0161_p2_pr_approval_dynamic_default.sql` (SQLite/dev/test) + Flyway
`V21__p2_pr_approval_dynamic_default.sql` (MySQL). **Đã áp cả 2 chuỗi** (xem §5).

### 2.3 Loại người tạo khỏi chuỗi duyệt

Một nguồn sự thật: `lib/p2-approval-flow.mjs#resolveApprovalFlow(stages, creator)` (dùng cho **tạo mới** và **gửi lại** ở JS;
bản Java có `RequestManagementUseCase#creatorMatchedStageRole` cùng quy tắc):

- Bước mà **người lập phiếu có thẩm quyền duyệt** (`allowed ∩ {role, roleBase} ≠ ∅` — **đúng vị từ** `canApproveStage`
  dùng để cho phép duyệt) ⇒ **bỏ qua bước đó**: `status='approved'`, `approver_user_id = người tạo`,
  `comment` ghi rõ «Người lập phiếu trùng vai trò duyệt của bước N (…) — không tự duyệt đơn của mình»,
  `decision_snapshot.source = "creator_role_waived"`.
- `approval_mode='all_roles'`: chỉ **MIỄN vai trò** của người tạo (`approval_stage_decisions.decision='waived_requester'`),
  vai trò còn lại vẫn phải duyệt; nếu mọi vai trò của bước đều bị miễn ⇒ bỏ qua cả bước.
- Bước bỏ qua **không yêu cầu Owner** (`stageOwners` chỉ nạp cho bước `!autoApproved`) ⇒ không chặn oan việc tạo phiếu.
- Không còn bước chờ ⇒ hồ sơ hoàn tất ngay khi gửi (`complete = true`), giữ nguyên hành vi cũ của «bước tự xác nhận».

### 2.4 Tương thích ngược (§24)

- `decide_approval` **vẫn** đọc luồng của chính phiếu: `FROM approvals a LEFT JOIN approval_stage_catalog cfg … WHERE a.request_id=?`
  ⇒ phiếu đang chạy giữ nguyên số bước/nhãn/thẩm quyền đã snapshot (`allowed_role_codes_snapshot`, `approval_mode_snapshot`).
- 100 dòng `approvals` hiện có **không bị chạm**; đo `SELECT DISTINCT stage FROM approvals` = `1,2,3,4,5` (không đổi).
- Migration chỉ THÊM cột/dòng ⇒ không phá dữ liệu cũ.

## 3. VIỆC 2 — QUYỀN TẠO PR

**Cơ chế thật (đã đọc mã nguồn, không suy đoán):**
- Cổng quyền chạy: `requireActionModule(user,'create_request')` ⇒ `ACTION_MODULE.create_request='requests'`,
  `ACTION_CAPABILITY.create_request='canCreate'` ⇒ đọc `user_module_permissions` (JS) / `RbacService` (Java).
- MẪU quyền nền cho user MỚI: `department_module_permissions` (Java `UserManagementUseCase.replaceDepartmentDefaults:355`
  gọi là «nguồn chính»). JS nay **đọc cùng bảng** (`replaceDepartmentDefaults` + `lib/…`), trước đây JS chỉ dùng switch cứng.
- Mức sàn trong mã: `defaultDepartmentPermission` trả `{view:1,use:1,create:1,edit:0,approve:0,export:1}` cho module `requests`
  ⇒ tài khoản chưa gắn phòng ban vẫn TẠO được, **KHÔNG** tự có quyền DUYỆT.

**Số TRƯỚC/SAU (SQL thật, MySQL `vntech_erp`):**

```sql
-- TRƯỚC (đo 21/09 trước khi cấp):
SELECT u.username,u.role,p.can_create
  FROM users u LEFT JOIN user_module_permissions p ON p.user_id=u.id AND p.module_key='requests'
 ORDER BY u.username;
-- ⇒ chỉ 4 tài khoản có can_create=1 (engineer.demo, ksda.demo, nvdademo, trdademo) + admin không có dòng (đi qua cổng isAdmin)
-- ⇒ HIỆU LỰC THẬT chỉ 3/12 vì còn chốt cứng vai trò kiểu cũ: admin · engineer.demo · ksda.demo
```

```sql
-- SAU (Flyway V21 mục 4+5 + áp tay):
UPDATE user_module_permissions SET can_view=1,can_use=1,can_create=1,updated_at=NOW(3)
 WHERE module_key='requests' AND (can_create=0 OR can_view=0 OR can_use=0);
INSERT INTO user_module_permissions (id,user_id,module_key,can_view,can_use,can_create,can_edit,can_approve,can_export,permission_expires_at,permission_source,created_at,updated_at)
SELECT CONCAT('UMP-P2REQ-',u.id),u.id,'requests',1,1,1,0,0,1,NULL,'department_default',NOW(3),NOW(3)
  FROM users u WHERE u.role<>'admin'
   AND NOT EXISTS (SELECT 1 FROM user_module_permissions p WHERE p.user_id=u.id AND p.module_key='requests');
-- ⇒ 12/12 user có bản ghi quyền `requests` với can_create=1 (sau khi thêm tài khoản Giám đốc demo: 13/13)
-- ⇒ KHÔNG cấp can_approve (đo: `SELECT COUNT(*) … WHERE module_key='requests' AND can_approve=0` giữ nguyên 0 dòng can_approve=1 do đợt này)
```

| Chỉ số (MySQL thật) | TRƯỚC | SAU |
|---|---|---|
| User có bản ghi `requests` với `can_create=1` | 4 (trên 12 user) | **12** (trên 12) → 13/13 sau khi thêm Giám đốc demo |
| User TẠO được phiếu (qua **cả 2** cổng: vai trò cũ + module) | **3** (admin, engineer.demo, ksda.demo) | **12/12** (hết chốt cứng vai trò); còn điều kiện phạm vi dự án: 11/12 user đã có `user_project_scopes` |
| User MỚI | phụ thuộc MẪU phòng ban (8/8 org unit đã có dòng `requests`) | như trên + JS đọc CÙNG bảng ⇒ **cả 2 đường ghi** đều cấp `can_create=1` |

## 4. BẰNG CHỨNG ĐỎ → XANH

### 4.1 `tests/p2-approval-dynamic.test.mjs` (mới, hợp đồng)

| Lần chạy | Kết quả |
|---|---|
| **ĐỎ #1** (chưa có `lib/p2-approval-flow.mjs`) | `ERR_MODULE_NOT_FOUND` · 0 pass / 1 fail |
| **ĐỎ #2** (có lib, chưa sửa engine/migration/UI) | **2 pass / 10 fail** (literal bước 101/102/103 còn nguyên, chưa có migration, UI còn `[[101,`, `create_request` còn chốt vai trò) |
| **ĐỎ #3** (kiểm tra hình dạng dữ liệu engine) | `actual: [0,0,0,0]` vs `expected: [2,3,4,5]` — chính là gốc lỗi «Bước 0» |
| **XANH** | **16 pass / 0 fail** |

Nhóm ca: suy luồng từ catalog (3/4/6 bước + đổi `sort_order`), hình dạng **camelCase** của engine, mặc định 4 bước §6,
người tạo không tự duyệt (single + `all_roles`), ghi vết `waived_requester`, migration chỉ-THÊM, tương thích ngược §24,
quyền TẠO cho mọi user, user mới theo MẪU phòng ban, UI không literal, **JAVA parity (3 ca)**.

### 4.2 RED cho phần Java (đối chiếu `git show HEAD:…`)

| Bằng chứng | HEAD | Sau khi vá |
|---|---|---|
| `creator_role_waived` trong `RequestManagementUseCase.java` | 0 | 1 |
| `creatorMatchedStageRole` | 0 | có (định nghĩa + 2 chỗ gọi) |
| `stage_kind` trong `RequestStoreAdapter.java` | 0 | 2 |
| `List.of("engineer","commander","admin")` trong `RequestManagementUseCase.java` | **1** | **0** |

## 5. ĐO TRÊN HỆ THỐNG THẬT + CSDL THẬT

### 5.1 Nhận diện đường chạy thật

| Cổng | Tiến trình | Vai trò |
|---|---|---|
| 8787 | `node scripts/local-server.mjs` | UI/SQLite cục bộ (0 user) |
| 9000 | `node tools/cutover-proxy.mjs --ui-port 8787 --api-port 18081` | proxy: `/api/*` → **Java** |
| 18081 | `java -jar web/target/vntech-erp-web-0.1.0-SNAPSHOT.jar` | **ENGINE ĐANG CHẠY THẬT** |

### 5.2 Chứng minh HTTP (trước/sau khi vá nguồn Java)

| Phép đo | Kết quả |
|---|---|
| `POST login` (`giamdoc.demo`, vai trò `director`) | **200** ✔ |
| `GET /api/system` (bootstrap) | **200** ✔ (trước đó: 500 «no such column: stage_kind» ở đường SQLite) |
| Chuỗi duyệt bootstrap trả về | **ĐÚNG 4 bước**: 2 Thư ký Tổng giám đốc → 3 Phòng Dự án → 4 Phòng Kế hoạch → 5 Giám đốc |
| `POST create_request` (cùng tài khoản) | **403** «Tài khoản không có quyền thực hiện nghiệp vụ này.» ← từ `RequestManagementUseCase.java:63` (đã vá source, **cần biên dịch lại jar + restart** mới hết) |

### 5.3 Dữ liệu test đã INSERT (chỉ đạo 4)

```sql
-- tài khoản Giám đốc demo (mật khẩu test: GiamDoc@2026; hash PBKDF2-SHA256 600000 vòng đúng định dạng ứng dụng)
INSERT INTO users (…) SELECT 'USR_p2_giamdoc_demo','P2-GD','Giám đốc Demo (luồng duyệt §6)','giamdoc.demo',
  'pbkdf2$600000$…','director','Ban giám đốc',0,1,…,'ORG-BGD',…,'giam_doc' FROM DUAL
 WHERE NOT EXISTS (SELECT 1 FROM (SELECT id FROM users WHERE username='giamdoc.demo') x);
INSERT INTO user_project_scopes (…) SELECT CONCAT('UPS-P2-',p.id),'USR_p2_giamdoc_demo',p.id,'write',…
  FROM projects p WHERE p.status='active' AND NOT EXISTS (…);            -- 2 dự án
INSERT INTO user_module_permissions (…) VALUES 'approvals'(can_approve=1) và 'requests'(can_create=1) …
UPDATE approval_project_assignments SET owner_user_id='USR_p2_giamdoc_demo',…
 WHERE stage=5 AND owner_user_id IN (SELECT id FROM users WHERE role IN ('da_truong','kh_truong'));
```

Kết quả phân công `PRJ-DEMO-01`: bước 2 `thukydemo` (thuky) · 3 `nvdademo` (da_nv) · 4 `nvkhdemo` (kh_nv) ·
5 `giamdoc.demo` (**director**) ⇒ **mọi bước đang hoạt động đều có Owner hợp lệ** (trước: bước 5 là `trdademo`/`da_truong` — không còn hợp lệ với cấu hình §6).

### 5.4 Cổng + cổng đo

| Cổng | Kết quả |
|---|---|
| `npx tsc --noEmit` | **exit 0** ✔ |
| `npm run lint` | **0 error** (184 warning sẵn có) ✔ |
| `npm run test:regression` | **69/69 pass · 0 fail** ✔ |
| `npm run test:workflow` | **ĐẠT** ✔ ("four-stage spec approvals/email/SLA → multi-PO/multi-delivery → …") |
| `tests/p2-approval-dynamic.test.mjs` | **16/16 ĐẠT** ✔ |
| `node --import tsx tests/t01-work-menu-probe.mjs` | **7 ĐẠT · 0 HỎNG** ✔ |
| `node tools/probe-project-screen.mjs` | **ĐẠT** ✔ |
| `node tools/p2-trace-audit.mjs` | KHÔNG ĐẠT — **y hệt baseline**: A1 6/7 (85.7 %), B1 6/16 (37.5 %), 2/5 chặng đứt (A1, B1) |
| `node tools/p2-split-po-audit.mjs` | **ĐẠT** (exit 0) ✔ |
| `node tools/p2-reference-integrity.mjs` | KHÔNG ĐẠT — 10/15 cặp có dòng mồ côi (**tiền tồn tại**: CSDL 0 FK). Đợt này **không chèn dòng nào** vào 4 bảng được cổng đo (`approvals`, `supply_workflow_steps`, `procurement_allocations`, `stock_issue_items`); đã kiểm 0 mồ côi phát sinh từ dữ liệu mới |

### 5.5 Bàn giao cho bản build (TRẠNG THÁI TẠM của dữ liệu)

Vì jar Java đang chạy **chưa** biết `stage_kind`, 3 bước cung ứng trong MySQL thật đang để `active=0`
(**chỉ đổi cột `active`, KHÔNG xoá dòng nào**) ⇒ chuỗi duyệt live = đúng 4 bước §6 và không phát sinh 400 mới.
Sau khi biên dịch lại jar + restart, bật lại đúng 1 câu:

```sql
UPDATE approval_stage_catalog SET active=1 WHERE stage_no IN (101,102,103);
```

## 6. BLOCKED / UNKNOWN

1. **BLOCKED — biên dịch lại jar + restart (ngoài ràng buộc lượt này).** Captain đã kiểm: `mvn` không phải lệnh hợp lệ và
   `java` không có trong PATH ⇒ **cần JDK 26 + Maven (hoặc người có quyền build)**, rồi `java -jar web/target/vntech-erp-web-0.1.0-SNAPSHOT.jar`.
   **Đã kiểm cú pháp ở mức cân bằng `{}`/`()` trên 4 tệp Java** (RequestManagementUseCase `{84,84}→{87,87}`; các tệp khác giữ nguyên chênh lệch), **chưa có javac sạch** ⇒ là UNKNOWN cho tới khi build.
2. **BLOCKED — 3 hành vi trên đường live chỉ có hiệu lực sau khi build lại**: (a) `create_request` hết 403 cho mọi vai trò,
   (b) luật người-tạo-không-tự-duyệt, (c) bật lại 101/102/103 (`active=1`).
3. **UNKNOWN — `resubmit_request` bản Java**: đã sửa bước khởi động lại theo luật loại người tạo, nhưng `RequestStoreAdapter.resubmitRequest`
   (SQL reset) vẫn theo hình dạng «bước đầu tự xác nhận» nên bước bị miễn có thể mang trạng thái `waiting` (không chặn luồng, chỉ lệch nhãn).
   Bản JS đã xử lý đầy đủ. Đề xuất: port nốt khi có lịch build.
4. **UNKNOWN — 2 hệ workflow song song** (`workflow_definitions`/`workflow_steps` chỉ để CẤU HÌNH, engine chạy thật đọc `approval_stage_catalog`):
   lượt này chốt **catalog là nguồn duy nhất được thi hành** (đúng yêu cầu «workflow thay đổi thì luồng duyệt đổi theo» đối với màn Cấu hình luồng phê duyệt).
   Việc hợp nhất 2 hệ (hoặc ghi rõ hệ nào là chính) vẫn là việc riêng của `WF-04`.
5. **Không xoá gì**: đã kiểm mọi tệp migration/thao tác SQL của lượt này **không** có `DROP`/`DELETE`/`TRUNCATE`.

## 7. TỆP ĐÃ THAY ĐỔI

| Nhóm | Tệp |
|---|---|
| Engine JS | `scripts/system-route.mjs` |
| Logic thuần | `lib/p2-approval-flow.mjs` (mới) · `lib/approval-helpers.ts` |
| UI | `app/page.tsx` |
| Engine Java (source) | `java-backend/application/…/RequestManagementUseCase.java` · `java-backend/application/…/AdminOpsManagementUseCase.java` · `java-backend/infrastructure/…/RequestStoreAdapter.java` · `java-backend/infrastructure/…/BootstrapDataAdapter.java` |
| Migration (ADDITIVE) | `drizzle/0161_p2_pr_approval_dynamic_default.sql` (mới) · `java-backend/infrastructure/src/main/resources/db/migration/V21__p2_pr_approval_dynamic_default.sql` (mới) |
| Test | `tests/p2-approval-dynamic.test.mjs` (mới) · `tests/workflow-direct.test.ts` · `tests/runtime-admin-boq-regression.test.mjs` · `tests/p2-25-pr-po-grn-cases.test.mjs` (fixture Owner theo cấu hình 4 bước) |
| Hồ sơ | `docs/agent-progress/TASK-106.md` (tệp này) |
