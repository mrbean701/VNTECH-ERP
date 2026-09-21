# TASK-137 — Sửa 5 điểm form “Lập đề nghị cấp vật tư” (theo phản hồi người dùng 21/09/2026)

**Trạng thái:** mã đã sửa + đã commit ở `151d1ef`; hồ sơ này ghi lại **kiểm định độc lập** + **hiện trạng runtime đã đo LIVE**.
**Phạm vi:** `app/page.tsx` · `lib/form-fields.ts` · `docs/agent-progress/TASK-137.md`.

## 0. Ghi chú nguồn gốc (quan trọng cho captain)

Khi worker này bắt đầu định vị và chuẩn bị ghi tệp (≈13:13–13:15 21/09/2026), **một worker song song trong
cùng workspace đã áp dụng đúng 5 điểm và commit `151d1ef`** (`app/page.tsx` mtime 13:13:56,
`lib/form-fields.ts` 13:14:45). Vì vậy:

- **KHÔNG** có ghi đè nào từ worker này lên 2 tệp mã (lệnh `edit` đầu tiên bị từ chối: *“file changed since it was read”*).
- Worker này chuyển sang **kiểm định độc lập** bản đã commit + ghi hồ sơ này (commit `4e2ae54`).
- Kỷ luật red→green: **không thực hiện được** vì mã đã bị đổi và commit trước khi lượt sửa đầu tiên của worker này
  hạ cánh (không còn trạng thái “đỏ” để quan sát). Đây là hạn chế của lượt chạy, không phải bỏ qua quy trình.

## 1. Năm điểm đã sửa (trước → sau) — đối chiếu `git show 151d1ef`

| # | Tệp:dòng | Trước | Sau |
|---|---|---|---|
| 1 | `app/page.tsx:2354` | `{lockedProject\|\|data.projects.length===1?<strong className="locked-project-value">…` ⇒ tài khoản 1 dự án bị **ẩn select** | `{lockedProject?<strong …` ⇒ **luôn hiện `<select name="projectId">`** trừ khi khoá theo màn hình ngoài; **không bắt buộc** |
| 2 | `app/page.tsx:2354` | `<option value="">— Chọn dự án cụ thể —</option>` · `<small>…data.projects.length===1?"Tự nhận theo phạm vi tài khoản":…</small>` | `<option value="">— Tùy chọn (để trống) —</option>` · `<small>{lockedProject?"Đồng bộ theo dự án đang chọn ở màn hình ngoài":"Không bắt buộc: có thể để trống — phiếu sẽ không thuộc dự án nào"}</small>` |
| 3 | `app/page.tsx:2355` + `:2356` | `<option value="">Chọn hợp đồng</option>` · `<option value="">Chọn phiên bản BOQ</option>` | `<option value="">— Tùy chọn (để trống) —</option>` (cả hai); giữ hiển thị, **bỏ `required`** |
| 4 | `app/page.tsx:2357` | `<option value="">Mua mới / chưa xác định</option>` (ô **Kho**) | **GIỮ NGUYÊN** (lựa chọn có chủ đích): đã là mục “để trống” và mang nghĩa nghiệp vụ “mua mới/chưa xác định”; vẫn không `required` |
| 5 | `app/page.tsx:2359` + `lib/form-fields.ts:72` | `label("area","Phạm vi / Khu vực thi công")` · placeholder `"Tầng / khu / phạm vi"` · default `displayName:"Phạm vi / Khu vực thi công"` | `label("area","Ghi chú")` · placeholder `"Ghi chú cho phiếu (không bắt buộc)"` · default `displayName:"Ghi chú"` |

Kèm theo trong cùng commit: `lib/form-fields.ts:71` đổi `projectId.required` **true → false**.

**Luồng đối chiếu Excel KHÔNG bị đụng:** nút `↻ Đối chiếu lại` vẫn `disabled={!contractId||!boqVersionId}` (`app/page.tsx:2361`), `preview()` vẫn chặn khi thiếu Dự án/Hợp đồng/BOQ (`app/page.tsx:2349`).

## 2. Xác nhận gửi giá trị rỗng (client) và đường ghi phía server

- **Client gửi `""`:** `app/page.tsx:2340` `const [projectId,setProjectId]=useState(initialRequestProject)`;
  `app/page.tsx:2354` `<select name="projectId" value={projectId} … onChange={(e)=>setProjectId(e.target.value)}>` với
  `<option value="">— Tùy chọn (để trống) —</option>`; `app/page.tsx:2351`
  `const payload=Object.fromEntries(new FormData(event.currentTarget)); if(await submit("create_request",{...payload,projectId,contractId,boqVersionId,lines}))close();`
  ⇒ `projectId` là **state React**, bằng `""` khi chọn mục để trống (state ghi đè mọi giá trị form).
- **Server Java (đã xong ở `94d103a`):**
  `RequestManagementUseCase.java:65` `String projectId = trim(payload.get("projectId"));` ·
  `:74-75` chỉ còn chốt “phải có ít nhất 1 dòng vật tư” (**bỏ chốt “phải có dự án”**) ·
  `:80-82` chỉ kiểm phạm vi khi `!projectId.isEmpty()` ·
  `:86` `project == null` khi rỗng ·
  `:93-94` `resolveContractOrNull(...)` (**không còn ném 400 khi dự án không có hợp đồng**) ·
  `:318` `header.put("projectId", projectId)` ⇒
  `RequestStoreAdapter.java:252-257` `INSERT INTO material_requests (…,project_id,…) VALUES (?,…)`.
  Cột đã được nới NULL: `V24__material_request_project_nullable.sql` (`MODIFY COLUMN project_id VARCHAR(64) … NULL`).
- **Giá trị lưu là `''` hay `NULL`:** `header.put("projectId", projectId)` bind **chuỗi rỗng `''`**
  (không có `nvl(projectId)` trước khi bind). Probe của worker song song (`132caac`) báo MySQL là `NULL`;
  worker này **không kiểm chứng lại được qua API** vì chính truy vấn danh sách loại bỏ mọi phiếu
  `project_id` rỗng/NULL (§5c). Yêu cầu “ghi NULL/''” vẫn thoả; muốn đúng literal `NULL` thì cần thêm 1 dòng `nvl`.

## 3. Grep 5 chuỗi cũ

| Chuỗi | Vùng `RequestModal` (`app/page.tsx:2336–2364`) | Toàn `app/page.tsx` | `lib/form-fields.ts` | Toàn workspace (`app lib scripts tests drizzle tools java-backend`) |
|---|---|---|---|---|
| `— Chọn dự án cụ thể —` | **0** | **0** | **0** | **0** |
| `Chọn hợp đồng` | **0** | 1 (`:1059`, màn **SO SÁNH & MAPPING BOQ** — ngoài phạm vi) | **0** | 2 (`app/page.tsx:1059`, `app/screens/BoqControl.tsx:71`) |
| `Chọn phiên bản BOQ` | **0** | **0** | **0** | **0** |
| `Phạm vi / Khu vực thi công` | **0** | **0** | **0** | 2 — **seed migration** `drizzle/0016_dynamic_forms_boq_request.sql:69`, `java-backend/…/db/migration/V3__reference_seed.sql:270` (ngoài phạm vi; dữ liệu CSDL đang chạy đã là “Ghi chú” — xem §5) |
| `data.projects.length===1?<strong` | **0** | **0** | **0** | **0** |

## 4. Cổng kiểm thử trên `151d1ef` (chạy lại độc lập, 21/09/2026)

| Cổng | Kết quả |
|---|---|
| `npx tsc --noEmit` | **0 lỗi** (`exit 0`) |
| `npm run test:workflow` | **ĐẠT** (`exit 0`, không assertion nào fail) |
| `npm run test:regression` | **67/69** (`ℹ tests 69 · pass 67 · fail 2`) — xem §4b |

### 4b. 2 test đỏ **có trước TASK-137**, không do TASK-137 gây ra

`tests/runtime-admin-boq-regression.test.mjs` vẫn khẳng định **hợp đồng UI cũ** mà chính người dùng đã yêu cầu bỏ:

- `:226` `assert.match(ui,/Đang ở Tất cả dự án: chọn một dự án cụ thể để lập phiếu/)` — chuỗi này **đã bị bỏ ở `bd3e90e` (TASK-136)**.
- `:303` `assert.match(page,/Bạn có chắc chắn muốn gửi phiếu này\?/)` — popup xác nhận **đã bị bỏ theo yêu cầu người dùng** ở `bd3e90e`.

Chứng minh đỏ có trước: `git show 94d103a:app/page.tsx` (HEAD ngay trước TASK-137) **không** chứa cả hai chuỗi
(kiểm bằng script: `contains(...) => False`); chuỗi thật tại đó là
`“có thể để trống — hệ thống dùng dự án mặc định trong phạm vi tài khoản”`.
⇒ Bộ regression **đã đỏ từ `bd3e90e` (TASK-136)**; con số “69/69” chỉ đúng trước `bd3e90e`.
File test này **ngoài 3 tệp được phép của TASK-137** nên worker này **không tự sửa**; cần captain quyết
(cập nhật 2 assertion về hợp đồng mới, hoặc tách thành task riêng).

## 5. Hiện trạng RUNTIME đã ĐO LIVE (21/09/2026, sau khi dịch vụ được khởi động lại 13:16)

Topology đang chạy (đọc `Win32_Process.CommandLine`):

| Cổng | Tiến trình | Vai trò |
|---|---|---|
| `:9000` | `tools/cutover-proxy.mjs --port 9000 --ui-port 8787 --api-port 18081` | **stack người dùng**: UI lấy từ :8787, `/api/system` → Java |
| `:8787` | `scripts/local-server.mjs` | UI + `/api/system` **engine JS** (`scripts/system-route.mjs`) |
| `:18081` | `java` backend | API nghiệp vụ + MySQL |

**Đo trên stack :9000 (Java/MySQL) — nơi người dùng thao tác:**

| Phép đo | Kết quả | Kết luận |
|---|---|---|
| `GET :9000/api/system` → `data.formFieldConfigs` (request_header) | `area` = **“Ghi chú”**, `neededAt` = “Ngày cần”, `projectId.required = 0` | **Nhãn “Ghi chú” sẽ hiện đúng** trên stack này — dữ liệu CSDL đã được cập nhật, KHÔNG cần thêm migration dữ liệu |
| `POST :9000 create_request` với `projectId/contractId/boqVersionId/sourceWarehouseId` đều rỗng (`tools/probe-request-no-project.mjs`, commit `132caac`) | **HTTP 200** · phiếu `DNMH-CTY-2026-0001` | **“Lưu rỗng” đã chạy thật** trên nhánh Java |

⇒ Với stack :9000, TASK-137 **khả thi**, chỉ còn chờ **rebuild bundle UI**.

### 5b. Hai điều CHỈ còn đúng với engine JS khi gọi TRỰC TIẾP `:8787` (dev, CSDL `.local-data/warehouse.sqlite`)

1. **Lập phiếu với Dự án để trống bị 400.**
   `scripts/local-server.mjs:23-25,72-75` định tuyến `/api/system` sang `scripts/system-route.mjs`, mà
   `scripts/system-route.mjs:1006`:
   `if (!projectId || !lines.length) throw new Error("Phiếu đề nghị phải có dự án và ít nhất một dòng vật tư.");`
   (kèm `:1012` `canAccessProject`, `:1013-1014` bắt buộc tìm thấy dự án, `:1017` truy vấn BOQ theo `project_id`).
   ⇒ Bản vá “bỏ chốt phải có dự án” **mới chỉ có ở Java**; nếu captain test UI **trực tiếp :8787** (không qua proxy :9000)
   thì thao tác để trống Dự án **vẫn thất bại**.
2. **Dữ liệu `form_field_config` của SQLite dev còn tên cũ:** `area` = “Phạm vi / Khu vực thi công”,
   `neededAt` = “Ngày cần vật tư tại công trường” + `required=1`, `projectId.required=1`.
   `label()` (`app/page.tsx:2348`) → `fieldConfig` → `mergedFormFields` (`lib/form-fields.ts:99-107,119-121`) cho
   **bản ghi CSDL đè default mã nguồn** ⇒ trên :8787 nhãn vẫn là chữ CŨ.
   Sửa: `UPDATE form_field_config SET display_name='Ghi chú' WHERE form_key='request_header' AND field_key='area';`
   (hoặc đổi trong màn **Quản trị → Cấu hình hệ thống → Cấu hình riêng · Đầu phiếu đề nghị**).

### 5c. ⛔ LỖI THẬT (severity cao) trên stack Java: phiếu không-dự-án **BIẾN MẤT** khỏi danh sách + không mở được để duyệt

Truy vấn danh sách phiếu dùng **INNER JOIN** `projects`, nên mọi phiếu có `project_id` NULL/rỗng bị loại:

- `java-backend/…/BootstrapDataAdapter.java:62-81` (`data.requests` — màn **Phiếu đề nghị**):
  `FROM material_requests mr` · `JOIN projects p ON p.id=mr.project_id` · `… WHERE mr.project_id IN (%s)`.
- `java-backend/…/RequestStoreAdapter.java:311-320` (`findRequestForApproval`): cũng `JOIN projects p ON p.id=mr.project_id`
  ⇒ phiếu không-dự-án **không mở được ở màn duyệt**.

**Bằng chứng đo LIVE:** bootstrap admin trên :9000 có 63 phiếu, **0** phiếu có `projectId` rỗng/NULL — tức phiếu
`DNMH-CTY-2026-0001` (đã tạo HTTP 200 theo probe `132caac`) **không thể xuất hiện** trong danh sách.
⇒ Probe cũ chỉ kiểm `HTTP 200` nên **không phát hiện** hệ quả này. Cần sửa 2 truy vấn sang `LEFT JOIN projects`
(+ xử lý `projectCode/projectName` rỗng ở UI) — **`java-backend/**` ngoài phạm vi TASK-137**, thuộc captain.

## 6. Việc captain cần làm

1. **Rebuild bundle web** (`gd-cycle`) rồi test lại UI (stack **:9000**, UI :8787 + API Java :18081).
   TASK-137 **không** build/không start-stop dịch vụ (đã tuân thủ).
2. **§5c (ưu tiên cao):** sửa 2 truy vấn INNER JOIN `projects` để phiếu không-dự-án hiện được trong danh sách và mở được khi duyệt.
3. **§5b.1:** nếu muốn dùng được UI **trực tiếp :8787** (engine JS) thì phải port nhánh `projectId` rỗng sang `scripts/system-route.mjs`.
4. **§5b.2:** cập nhật dữ liệu `form_field_config` của CSDL dev SQLite (hoặc chỉ dùng stack :9000 — đã đúng “Ghi chú”).
5. **§4b:** cập nhật 2 assertion regression cũ (`tests/runtime-admin-boq-regression.test.mjs:226,303`) về hợp đồng UI mới.
