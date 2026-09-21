# TASK-141 — 2 việc để tính năng “phiếu đề nghị KHÔNG thuộc dự án” HOẠT ĐỘNG + khôi phục cổng hồi quy

**Trạng thái:** mã đã sửa · test H2 **ĐỎ → XANH** · cổng `tsc 0` · `test:regression` **69/69** · `test:workflow` **ĐẠT**.
**Commit:** `b8d3b49` (VIỆC 1 — LEFT JOIN + test H2 + schema-h2 + probe + hồ sơ này) · `ca104fc` (phần cổng phạm vi `decide_approval` bị cuốn vào commit của nhánh TASK-140 — xem ①).
**Phạm vi ghi tệp (đúng uỷ quyền):** `java-backend/**` · `tests/runtime-admin-boq-regression.test.mjs` *(KHÔNG phải sửa — xem ③)* · `tools/probe-request-no-project.mjs` · `docs/agent-progress/TASK-141.md`.
**⛔ KHÔNG chạm:** `app/page.tsx` (nhánh TASK-139 đang sửa) · `AGENTS.md` · `docs/28_*` · `drizzle/**` · `lib/form-fields.ts` · `tools/baseline/**`.
**⛔ KHÔNG** package / build web / start-stop dịch vụ / `git add -A` / push.

---

## ① VIỆC 1 — 🔴 INNER JOIN `projects` làm phiếu không-dự-án BIẾN MẤT + không mở được để duyệt

### Sửa gì (2 tệp · 3 dòng SQL)

| # | Tệp:dòng (SAU sửa) | TRƯỚC | SAU |
|---|---|---|---|
| 1a | `java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/BootstrapDataAdapter.java:72` | `JOIN projects p ON p.id=mr.project_id` | `LEFT JOIN projects p ON p.id=mr.project_id` |
| 1b | `BootstrapDataAdapter.java:83` | `WHERE mr.project_id IN (%s)` | `WHERE (mr.project_id IS NULL OR mr.project_id='' OR mr.project_id IN (%s))` |
| 1c | `java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/RequestStoreAdapter.java:319` (`findRequestForApproval`) | `JOIN projects p ON p.id=mr.project_id` | `LEFT JOIN projects p ON p.id=mr.project_id` |

### Điều kiện lọc theo PHẠM VI xử lý thế nào (không nới quá mức)

- Nhánh **phiếu không-dự-án** (`mr.project_id IS NULL` **hoặc** `''`) **luôn đi qua**, vì phiếu đó không thuộc dự án nào ⇒ không có phạm vi dự án nào để vi phạm. Đây đúng yêu cầu “user **không có** `user_project_scopes` nào vẫn phải thấy phiếu không-dự-án” (khi `pids` rỗng thì `pidSql = "NULL"`, `IN (NULL)` không bao giờ đúng ⇒ chỉ còn nhánh không-dự-án).
- Nhánh **phiếu thuộc dự án** giữ NGUYÊN `mr.project_id IN (<visibleProjectIds>)` ⇒ user **có** phạm vi vẫn **KHÔNG** thấy phiếu của dự án ngoài phạm vi (ràng buộc bảo mật không đổi).
- **Phát hiện phụ (quan trọng):** luồng lập phiếu ghi **chuỗi rỗng `''`** chứ không phải SQL `NULL` (`RequestManagementUseCase.createRequest` đặt `header.put("projectId", "")` sau `trim(...)`, rồi `RequestStoreAdapter.insertRequest` INSERT thẳng giá trị đó). V24 chỉ nới cột thành NULLABLE, **không** có chuyển `''` → `NULL`. Vì vậy mệnh đề phải nhận **cả `IS NULL` lẫn `=''`** — nếu chỉ thêm `IS NULL` thì bản vá **không có tác dụng** với dữ liệu thật do hệ thống tạo ra.

### Bằng chứng H2 `project_id` NULL: ĐỎ → XANH

Test mới: `java-backend/web/src/test/java/com/vntech/erp/web/controller/RequestNoProjectBootstrapIntegrationTest.java`
Fixture: người lập phiếu `kh_nv` **KHÔNG có dòng `user_project_scopes` nào** ⇒ lập phiếu bỏ trống dự án/HĐ/BOQ/kho; phiếu ép `project_id = NULL`; người duyệt bước 2 là `kh_truong` **cũng KHÔNG có phạm vi dự án**.
Vá thêm cho H2 (test-only, đúng quy ước khối `[H2-MANUAL-START/END]`): `java-backend/web/src/test/resources/schema-h2.sql` thêm `ALTER TABLE material_requests ALTER COLUMN project_id DROP NOT NULL;` (bản H2 sinh từ V1 vẫn `NOT NULL`, Flyway V24 không chạy ở profile test).

```
RED  (giữ INNER JOIN, revert tạm 1a+1b+1c):
  [ERROR] Tests run: 1, Failures: 1 — RequestNoProjectBootstrapIntegrationTest
  AssertionFailedError: phiếu KHÔNG thuộc dự án phải có trong data.requests — hiện chỉ thấy 0 phiếu
  (khớp đúng số đo LIVE của captain: 0/63 phiếu có projectId rỗng)

GREEN (bản vá 1a+1b+1c):
  [INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0 — BUILD SUCCESS
  (test khẳng định: phiếu CÓ trong data.requests · projectId rỗng · projectCode/projectName NULL ·
   approvalStage=1 · admin duyệt bước 1 → approval_stage=2 · người duyệt KHÔNG phạm vi dự án duyệt
   bước 2 → status=approved, supply_status=awaiting_po)
```

**2 chiều của điều kiện phạm vi đều được đo (bổ sung sau lượt chạy đầu):**

- **2b (yêu cầu người dùng):** bootstrap bằng CHÍNH tài khoản nhân viên văn phòng (`kh_nv`, **0 dòng** `user_project_scopes`) ⇒ **thấy** phiếu không-dự-án của mình ✔
- **2c (đối chứng bảo mật — KHÔNG nới quá mức):** dựng thêm dự án `p_out` (ngoài phạm vi) + phiếu gắn `p_out`, rồi bootstrap bằng tài khoản `kh.scoped` **chỉ có phạm vi `p_self`** ⇒ **KHÔNG** thấy phiếu của `p_out` ✔ **nhưng VẪN** thấy phiếu không-dự-án ✔
- Lượt chạy lại sau khi bổ sung 2b/2c: `Tests run: 1, Failures: 0, Errors: 0` — BUILD SUCCESS ✔

### Cổng phạm vi ở `decide_approval` — sửa kèm (bắt buộc để “duyệt được”)

`java-backend/application/src/main/java/com/vntech/erp/application/service/RequestManagementUseCase.java:624-632`:
`accessScope.requireProjectAccess(...)` được gọi **vô điều kiện**; mà `canAccessProject(user, "", …)` **luôn** trả `false` khi `projectId` rỗng (`AccessScopeService.java:67`) ⇒ **mọi** người duyệt không phải admin bị **403 «Tài khoản không có quyền tại dự án.»** ⇒ phiếu công ty lập xong nhưng không ai duyệt được.
Nay: chỉ kiểm phạm vi khi phiếu **THỰC SỰ** thuộc dự án (`if (!requestProjectId.isEmpty())`). Cổng duyệt thật giữ nguyên (`canApproveRequestStage` + RBAC action `decide_approval`). Phiếu thuộc dự án: ràng buộc phạm vi **không đổi**.

> ⚠️ **GHI NHẬN CÔNG LAO:** 7 dòng này **đã bị cuốn vào commit `ca104fc`** (commit của nhánh TASK-140) — nhánh đó `git add` cả tệp sau khi tôi sửa. Nội dung nằm trong `HEAD`, không còn ở working tree; hồ sơ này ghi lại để đối chiếu.

### ⛔ XUNG ĐỘT LIÊN TASK cần captain biết — TASK-140 (đã commit `ca104fc`) chặn duyệt phiếu không-dự-án

`ca104fc` đổi `canApproveRequestStage` thành **CHỈ owner được phân công đích danh** (`approvals.approver_user_id` ∪ `workflow_step_approvers`), **bỏ** nhánh “đúng vai trò của bước”.
Với phiếu **không thuộc dự án nào**, luồng lập phiếu **KHÔNG thể** gán owner: `approval_project_assignments.project_id` là `NOT NULL` nên `createRequest` bỏ qua (`if (projectId.isEmpty()) continue;`) ⇒ `approvals.approver_user_id = NULL`, và `workflow_step_approvers` cho `projectId=''` chỉ khớp **workflow mặc định cấp công ty** (`w.project_id IS NULL AND w.is_default=1`).
⇒ **Hệ quả:** sau TASK-140, phiếu không-dự-án vào tới một bước duyệt sẽ **KHÔNG AI duyệt được** (kể cả admin) **trừ khi** quản trị viên cấu hình workflow mặc định cấp công ty có `workflow_step_approvers` cho bước đó. Đây là mâu thuẫn giữa TASK-140 (siết owner) và yêu cầu “nhân viên văn phòng lập phiếu” (TASK-136/141) — **cần người quyết**.
Bằng chứng: test H2 của tôi chạy trên cây hiện tại (đã có TASK-140) **chỉ xanh** khi `approvals.approver_user_id` của bước 1/bước 2 được gán (test gán thẳng trong DB, đúng cột mà luồng lập phiếu ghi cho phiếu có dự án) — nếu không gán thì bước 3 của test sẽ nhận 400.

### UI: CÓ phải sửa không? ⇒ **KHÔNG** (đo được)

- `GET /api/system` trả `projectCode`/`projectName` = **NULL** (hoặc VẮNG khoá nếu chỗ serialize bỏ null). Nơi hiển thị danh sách/chi tiết phiếu chỉ **render** giá trị (`app/screens/Requests.tsx:57` `<strong>{row.projectCode}</strong>`, `app/screens/RequestDrawer.tsx:46`, `app/page.tsx:474` template literal) — React render `null`/`undefined` **không ném lỗi**; **không** nơi nào gọi phương thức chuỗi trên 2 trường này.
- Hàng đợi phê duyệt (`app/page.tsx:971`) lọc theo `status === "pending_approval"` và (theo dự án đang chọn) `row.projectId === project`; chế độ mặc định của admin là `"ALL"` (`projectAccessAll`) ⇒ phiếu không-dự-án **vào đúng hàng đợi** và bấm mở được.
⇒ **KHÔNG chạm dòng nào của `app/page.tsx` / màn danh sách phiếu.**

---

## ② Probe nâng cấp — `tools/probe-request-no-project.mjs`

Bản cũ (`132caac`) **chỉ** kiểm `create_request` = HTTP 200 nên **không** phát hiện lỗi INNER JOIN. Bản mới kiểm **5 điều** và in `✅/❌` từng điều + tổng kết `n/N`:

1. `create_request` (bỏ trống dự án/HĐ/BOQ/kho) = **HTTP 200**;
2. `GET /api/system` ⇒ phiếu đó **CÓ** trong `data.requests` (khớp theo `purpose` duy nhất, dự phòng theo `requestNo` regex `DNMH-…-YYYY-NNNN`) ⇒ **đã kiểm “phiếu CÓ xuất hiện”**;
3. `projectId` của phiếu **rỗng/NULL**;
4. `approvalStage` = **2** (mặc định; đổi bằng `EXPECT_STAGE=…`) ⇒ phiếu nằm đúng bước sau bước 1 tự xác nhận;
5. phiếu có **`approvals`** (chính dữ liệu UI dùng để mở phiếu ra duyệt) + bước hiện tại có **tên bước**, mã phiếu **không** rỗng tiền tố (`DNMH--…`).

Probe **chỉ ĐỌC** (không gọi `decide_approval` để tránh làm biến đổi dữ liệu LIVE) ⇒ mã thoát `0` = ĐẠT, `2` = có kiểm tra ❌, `1` = không đăng nhập/không có vật tư.

```
node tools/probe-request-no-project.mjs
```

> Kết quả LIVE: **chờ captain** package + restart `:18081` (tôi **không** được phép package/start-stop) rồi chạy lệnh trên.

---

## ③ VIỆC 2 — 2 assertion cũ đòi chuỗi ĐÃ BỊ XOÁ ⇒ **đã xanh 69/69** (không phải sửa lại lần nữa)

Trong lúc tôi kiểm kê, **nhánh song song đã sửa đúng 2 assertion này** ở commit **`88a9ae5`** (TASK-137 green gate) — sửa lại là **trùng việc**, nên tôi **giữ nguyên** và **kiểm chứng lại**:

| | TRƯỚC (đỏ) | SAU (`88a9ae5`, hiện tại) |
|---|---|---|
| 1 | `:226` `assert.match(ui,/Đang ở Tất cả dự án: chọn một dự án cụ thể để lập phiếu/);` | `:227` `assert.match(ui,/Không bắt buộc: có thể để trống — phiếu sẽ không thuộc dự án nào/);` *(kiểm ĐÚNG nhãn mới của ô Dự án)* |
| 2 | `:303` `assert.match(page,/Bạn có chắc chắn muốn gửi phiếu này\?/,'CHT phải xác nhận trước khi gửi phiếu');` | `:310` `assert.doesNotMatch(page,/Bạn có chắc chắn muốn gửi phiếu này\?/,'Gửi phiếu KHÔNG còn popup xác nhận (chỉ đạo người dùng 21/09/2026)');` **+** `:311` `assert.match(page,/Sau khi gửi, phiếu vào luồng phê duyệt ngay và không tự thu hồi\./,'Đầu form phải cảnh báo không thể tự thu hồi sau khi gửi');` |

Cả 2 chỗ đều **giữ tinh thần test** (khẳng định hành vi MỚI có nghĩa), **không** xoá test cho xanh.
**Bằng chứng đo lại (tôi chạy trên cây hiện tại):**

```
npm run test:regression
ℹ tests 69   ℹ pass 69   ℹ fail 0   ℹ cancelled 0   ℹ skipped 0
=== T-03/T-04 CÔNG VIỆC: 14/14 ĐẠT · 0 HỎNG ===
```

**Baseline TRƯỚC khi tôi bắt đầu (đo được):** `67/69` — đỏ tại `tests/runtime-admin-boq-regression.test.mjs:226` và `:303` (2 chuỗi cũ). Sau khi `88a9ae5` vào: **69/69**.

---

## ④ CỔNG BẮT BUỘC (số đo)

| Cổng | Lệnh | Kết quả |
|---|---|---|
| TypeScript | `npx tsc --noEmit` | **0 lỗi** (exit 0) |
| Hồi quy | `npm run test:regression` | **69/69 · fail 0** ✔ |
| Workflow | `npm run test:workflow` | **ĐẠT** — “Workflow VNTECH ERP V5.3.0 FULL W2 passed…” ✔ |
| Java (H2) | `mvn -B -pl web -am test` (shell mới, JDK `openjdk-26.0.2.1`) | **42 test · 3 ĐỎ CÓ SẴN · 0 đỏ mới** — xem bảng bên dưới |
| Test H2 mới | `mvn -B -pl web -am test -Dtest=RequestNoProjectBootstrapIntegrationTest` | **ĐỎ → XANH** (1/1 xanh sau vá) ✔ |

Java toàn bộ (baseline cần so: **39–40 test · 3 ĐỎ CÓ SẴN** ở `ProductionRoleCounterProofTest`):

| Module | Tests | Failures |
|---|---|---|
| domain | 19 | 0 |
| application | 23 | 0 |
| infrastructure | 10 | 0 |
| **web** | **42** | **3 — CHỈ ở `ProductionRoleCounterProofTest`** (`productionRole_cht_duocPhep`, `productionRole_cht_roleBaseSai_vanDuocPhep`, `productionRole_engineer_biChan`) |
| `RequestNoProjectBootstrapIntegrationTest` (mới, TASK-141) | 1 | **0** ✔ |
| `RequestApprovalIntegrationTest` / `RequestApprovalOwnerOnlyTest` / `StockIssueWorkflowSteps345Test` / `SupplyChainEndToEndIntegrationTest` | — | 0 ✔ |

42 = **40 test nền + 2 test mới** (`RequestApprovalOwnerOnlyTest` của TASK-140 và `RequestNoProjectBootstrapIntegrationTest` của TASK-141) ⇒ **3 đỏ vẫn đúng 3 test CÓ SẴN**, không phát sinh đỏ mới. (Bẫy “`Errors: 34` giả do cache LAN” đã tránh: mỗi lượt `mvn` chạy trong **shell mới**.)

---

## CÒN LẠI THUỘC CAPTAIN

1. **Package + restart dịch vụ `:18081`** (tôi bị cấm) rồi chạy `node tools/probe-request-no-project.mjs` ⇒ dán kết quả `n/N` vào hồ sơ.
2. **Quyết mâu thuẫn TASK-140 ↔ TASK-136/141**: phiếu không-dự-án hiện **không có owner** ⇒ cần hoặc (a) cho phép **workflow mặc định cấp công ty** (`workflow_definitions.project_id IS NULL AND is_default=1` + `workflow_step_approvers`) làm nguồn owner cho phiếu không-dự-án, hoặc (b) khôi phục nhánh “đúng vai trò của bước” **chỉ cho phiếu không-dự-án**, hoặc (c) cho phép phân công cấp công ty (nới `approval_project_assignments.project_id`).
3. **Chuẩn hoá dữ liệu:** luồng lập phiếu đang ghi `''` (chuỗi rỗng) thay vì `NULL` cho phiếu không-dự-án. Bản vá đọc được **cả hai**, nhưng nên thống nhất ghi `NULL` (sửa `createRequest`: `header.put("projectId", projectId.isEmpty() ? null : projectId)`).
4. `cancel_request` (dòng ~597) **vẫn** gọi `requireProjectAccess` vô điều kiện ⇒ CHT không phải admin **không** huỷ/xoá được phiếu không-dự-án đã bị trả lại. Tôi **không** sửa (ngoài 2 việc được giao) — cần quyết.

## Nhật ký chạy

- `mvn -pl web -am test -Dtest=RequestNoProjectBootstrapIntegrationTest` (RED, INNER JOIN): `Tests run: 1, Failures: 1` — “hiện chỉ thấy 0 phiếu”.
- `mvn -pl web -am test -Dtest=RequestNoProjectBootstrapIntegrationTest` (GREEN): `Tests run: 1, Failures: 0, Errors: 0` — BUILD SUCCESS.
- `npx tsc --noEmit` → exit 0. `npm run test:regression` → 69/69. `npm run test:workflow` → ĐẠT.
- `mvn -B -pl web -am test` (shell mới) → `Tests run: 42, Failures: 3` (cả 3 ở `ProductionRoleCounterProofTest` — ĐỎ CÓ SẴN) ⇒ BUILD FAILURE **vì 3 đỏ có sẵn**, không có đỏ mới; `RequestNoProjectBootstrapIntegrationTest` xanh 1/1.
