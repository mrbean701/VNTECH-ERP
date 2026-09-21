# TASK-126 — 2 VIỆC **HIỂN THỊ** (người dùng đã chốt phương án) · CHỈ ĐỔI CÁCH HIỂN THỊ, ⛔ KHÔNG sửa dữ liệu

**Trạng thái:** DONE (code + test + cổng) · **Ngày:** 2026-09-18 · **Nhánh:** `unity-p2-full-20260920`
**Phạm vi đã sửa:** `app/page.tsx` (5 vùng nhỏ) · `lib/audit-log-display.ts` (MỚI) · `lib/workflow-display.ts` (MỚI) · `tests/q1-q3-display.test.mjs` (MỚI) · `docs/agent-progress/TASK-126.md` (MỚI)
⛔ KHÔNG đụng `scripts/**` · `java-backend/**` · `drizzle/**` · `AGENTS.md` · `docs/28_*` · `tools/baseline/**` · `.docx/.xlsx`
⛔⛔ KHÔNG một câu `INSERT/UPDATE/DELETE/ALTER/DROP/TRUNCATE` nào (chỉ **ĐỌC** dữ liệu) · KHÔNG build · KHÔNG start/stop dịch vụ.

---

## 1. VIỆC ① — `Q1` = **phương án A**: Nhật ký kiểm toán hết lộ GUID

**Hàm thuần mới:** `lib/audit-log-display.ts` — `auditLogDisplay(entityType, recordId, data)` ⇒
`{ subjectLabel (nhãn tiếng Việt của loại đối tượng), recordCode (mã nghiệp vụ), note (lý do thiếu nguồn) }`
· tệp **KHÔNG import gì** (đúng khuôn `lib/boq-line-display.ts`) để test import trực tiếp bằng `node --import tsx`.

**Bất biến chống hồi quy:** `isTechnicalId()` + `safeText()` — hàm **KHÔNG BAO GIỜ** trả chuỗi dạng GUID/UUID
(kể cả có tiền tố miền `PRJ_`/`MR_`/`PO_`/`MAT_`/`USR_`). Test khoá lại bằng `assertNoGuid` trên chính kết quả trả về.

**Nguồn mã nghiệp vụ (tra theo ĐÚNG khoá `id` trong payload, tên trường THẬT):**

| Danh mục payload | Nhãn hiển thị | Trường mã |
| --- | --- | --- |
| `projects` | Dự án | `code` (dự phòng `projectCode`) |
| `requests` | Phiếu đề nghị mua hàng | `requestNo` |
| `purchaseOrders` | Đơn hàng mua sắm (PO) | `poNo` |
| `materials` | Vật tư | `code` |
| `users` | Người dùng | `employeeCode` (dự phòng `username` → `fullName`) |

**2 chỗ đã đổi trong `app/page.tsx` (trước → sau):**

| # | Vùng | TRƯỚC (lộ GUID) | SAU (mã nghiệp vụ) |
| --- | --- | --- | --- |
| 1 | Cột «Mã thực thể» của bảng nhật ký (`AuditLogManager`, `app/page.tsx:2065`) | `<td>{a.entityId \|\| "—"}<small>{a.entityType \|\| ""}</small></td>` — in `PRJ_fdbfab20-…` | `<td title={entityDisplay.note}>{entityDisplay.recordCode}<small>{entityDisplay.subjectLabel}</small></td>` — in `PRJ-DEMO-01` + «Dự án» |
| 2 | Khối «CHI TIẾT THAY ĐỔI» khi bấm *Xem* (`app/page.tsx:2080`) | `Đối tượng: <b>{a.entityId}</b> · Loại: <b>{a.entityType}</b> · Mã bản ghi: <b>{a.id}</b>` — **cả 3 đều là GUID** | `Đối tượng: <b>{entityDisplay.subjectLabel}</b> · Mã bản ghi: <b>{entityDisplay.recordCode}</b> · Loại ghi trong nhật ký: <b>{a.entityType}</b>` |

⇒ **GUID KHÔNG còn hiện ở 2 cột đó**: `entity_id` (GUID) chỉ còn được **dùng để TRA**, không xuất ra UI; `a.id`
(GUID dòng nhật ký) **đã bị bỏ khỏi văn bản hiển thị** (vẫn dùng làm `key`/state nội bộ cho nút *Xem*, không hiển thị).

**Thiếu nguồn ⇒ «chưa có nguồn»** (không bịa, không rơi về GUID) — 3 nhánh đã đo & khoá bằng test:
`entity_id` rỗng (**37/909 dòng thật** như `create_user`, `dept_plan_tasks`) · không tìm thấy bản ghi trong danh mục ·
tìm thấy bản ghi nhưng bản ghi không có mã nghiệp vụ.

⚠️ **Dữ liệu THẬT đã đo — 2 phát hiện buộc phải tra theo `id` chứ không tra theo `entity_type`:**
`audit_logs.entity_type` là **chuỗi tự do**, không phải tên bảng (`requests` 155 · `approvals` 182 ·
`material_request` 147 · `update` 109 · `save` 94 · `create` 41 · `delete` 14 …), và có dòng
`entity_type='requests'` nhưng `entity_id='PRJ_…'` (khoá **DỰ ÁN**). Hàm vì vậy: tra danh mục suy từ `entity_type`
trước, **không thấy thì quét nốt các danh mục còn lại bằng `id`**, và khi 2 loại lệch nhau thì ghi rõ vào `note`
hiện lên `title` («loại ghi trong nhật ký là … nhưng khoá kỹ thuật trỏ tới …») — **không im lặng đổi nhãn**.

---

## 2. VIỆC ② — `Q3` = **phương án B**: hiển thị mã/phiên bản workflow (Case 9)

**Hàm thuần mới:** `lib/workflow-display.ts` — `workflowIdentityView(row)` ⇒ `{ code, codeHasSource, version, versionHasSource, note }`.

### Trường mã/phiên bản lấy từ đâu (nguồn THẬT, không đoán)

* **MÃ ĐỊNH DANH — CÓ NGUỒN:** `workflowDefinitions[].code` ← cột thật `workflow_definitions.code`.
  Nguồn: `java-backend/.../BootstrapDataAdapter.java:946-949` (`SELECT id,code,name,… FROM workflow_definitions`)
  + MySQL thật `vntech_erp` (chỉ-đọc): 4 luồng — `WF-MUAHANG-01` · `WF-PO-01` · `WF-XUATKHO-01` · `WF-NHAPKHO-01`.
* ⛔ **PHIÊN BẢN — KHÔNG CÓ NGUỒN NÀO** (3 đường đo độc lập, KHÔNG suy diễn):
  1. payload bootstrap **không chọn** cột `version` (`BootstrapDataAdapter.java:946-949`);
  2. MySQL thật `information_schema.columns` của `workflow_definitions` = `id,code,name,description,module_key,project_id,is_default,active,sort_order,created_by,created_at,updated_at` ⇒ **KHÔNG có `version`**
     (cột **đã bị xoá** — `java-backend/.../db/migration/V19__drop_workflow_definitions_version.sql`: `ALTER TABLE workflow_definitions DROP COLUMN version;`);
     0 bảng khớp `%workflow_version%`; `approvals` · `approval_stage_catalog` **không có** `workflow_id`/`workflow_version`;
     payload `requests` chỉ có `approvalStage` (một con số) — `BootstrapDataAdapter.java:62-81`.
  ⇒ Trả **ĐÚNG** `NO_SOURCE_TEXT` («chưa có nguồn») kèm lý do; **KHÔNG** lấy `sortOrder`/số bước/`approvalStage` thay phiên bản, **KHÔNG** tự đặt `V1`.

### Chỗ hiển thị đã sửa (`app/page.tsx`)

| # | Vùng | Đã thêm |
| --- | --- | --- |
| 1 | **Dải «QUY TRÌNH PHÊ DUYỆT»** màn Phê duyệt (`app/page.tsx:980`, ngay dưới `<h3>`) | `const approvalChainWorkflow=workflowIdentityView(selected);` + `<p className="muted" title={…note}>Mã luồng: <b>{…code}</b> · Phiên bản: <b>{…version}</b></p>` ⇒ phiếu hiện **«Mã luồng: chưa có nguồn · Phiên bản: chưa có nguồn»** (đúng sự thật: phiếu không có FK luồng), lý do đầy đủ ở tooltip |
| 2 | **Màn «Quy trình phê duyệt»** (`WorkflowManager`, `app/page.tsx:2174`) | `const identity = workflowIdentityView(w);` + `<small title={identity.note}>Mã luồng: <b>{identity.code}</b> · Phiên bản: <b>{identity.version}</b> · …</small>` ⇒ hiện **mã THẬT** `WF-MUAHANG-01` … và **Phiên bản: chưa có nguồn** |

**Ghi chú Case 9:** yêu cầu §7 («PR001 giữ V1») **chưa có chỗ thi hành** vì CSDL không có cột phiên bản luồng;
TASK-126 **không** tự chế trường mới (đúng ràng buộc) — chọn phương án B nên **snapshot hiện có giữ nguyên**
và UI nói thẳng phần thiếu nguồn.

---

## 3. ĐỎ → XANH

**ĐỎ (trước khi sửa `app/page.tsx`, sau khi viết test):**
```
$ node --import tsx tests/q1-q3-display.test.mjs
✖ VIỆC ① — app/page.tsx KHÔNG còn in GUID thô ở cột «Mã thực thể» và ở khối chi tiết
  AssertionError: page.tsx phải dùng hàm thuần mới
✖ VIỆC ② — app/page.tsx có hiển thị mã/phiên bản ở dải duyệt + màn Quy trình phê duyệt
ℹ tests 7 · pass 5 · fail 2
```
(Trước đó 1 bước còn `ERR_MODULE_NOT_FOUND: lib/workflow-display` — đúng RED của "hàm chưa tồn tại".)

**XANH:**
```
$ node --import tsx tests/q1-q3-display.test.mjs
✔ 7/7 (tests 7 · pass 7 · fail 0)
```

**Commit:** `1e83f15` — `[TASK-126] Q1=A nua dau + Q3=B: lib/audit-log-display.ts … + noi app/page.tsx; test q1-q3-display 7/7 DAT`
(4 tệp: `app/page.tsx` +24/-5 · `lib/audit-log-display.ts` 180 dòng · `lib/workflow-display.ts` 98 dòng · `tests/q1-q3-display.test.mjs` 129 dòng).
⚠️ Commit này được tạo trong **cùng worktree dùng chung** (nhánh `unity-p2-full-20260920`) — nội dung là **đúng 4 tệp của TASK-126** với đúng mã đã kiểm ở trên; **KHÔNG** stage `AGENTS.md`/`docs/28_*`/`tools/baseline/**`/`tsconfig.tsbuildinfo`/`.docx`/`.xlsx`/`tests/p2-25-*.test.mjs` (vẫn để nguyên trạng thái cũ).

## 4. Cổng đã chạy

| Cổng | Kết quả |
| --- | --- |
| `npx tsc --noEmit` | **exit 0** |
| `npm run lint` | **0 error** (189 warning — toàn bộ có sẵn, không phát sinh) |
| `npm run test:regression` | **69/69** |
| `npm run test:workflow` | **ĐẠT** |
| `node --import tsx tests/q1-q3-display.test.mjs` (test MỚI) | **7/7 ĐẠT** |
| `node --import tsx tests/t01-work-menu-probe.mjs` | **7 ĐẠT / 0 HỎNG** |
| `node tools/probe-project-screen.mjs` | **ĐẠT** |
| `node tools/probe-p2-ui-dom.mjs` | **5/5** |

## 5. Rủi ro còn lại

* Phần hiển thị mới **chưa được nhìn bằng mắt trên UI đang chạy** (`:8787`) — lượt này **CẤM build/khởi động lại dịch vụ**; `dist` đang chạy vẫn là bản cũ ⇒ muốn thấy trên UI phải build + restart (việc của captain/lượt sau).
* `audit_logs.entity_id` **giữ nguyên GUID** trong CSDL (đúng phương án A) ⇒ tra mã chỉ đúng khi bản ghi còn nằm trong payload đang tải (payload có giới hạn `LIMIT 500` cho `requests`, lọc theo quyền dự án) — hết nguồn thì UI ghi «chưa có nguồn» chứ không bịa.
* Phiên bản luồng: muốn hiện số thật thì phải **sửa CSDL** (dựng `workflow_versions` + cột trên PR/PO) — **ngoài phạm vi** TASK-126.
