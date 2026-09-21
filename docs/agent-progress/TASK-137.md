# TASK-137 — Sửa 5 điểm form “Lập đề nghị cấp vật tư” (theo phản hồi người dùng 21/09/2026)

**Trạng thái:** mã đã sửa + đã commit ở `151d1ef`; hồ sơ này ghi lại **kiểm định độc lập** và **2 điểm chặn runtime**.
**Phạm vi:** `app/page.tsx` · `lib/form-fields.ts` · `docs/agent-progress/TASK-137.md`.

## 0. Ghi chú nguồn gốc (quan trọng cho captain)

Khi worker này bắt đầu định vị và chuẩn bị ghi tệp (≈13:13–13:15 21/09/2026), **một worker song song trong
cùng workspace đã áp dụng đúng 5 điểm và commit `151d1ef`** (`app/page.tsx` mtime 13:13:56,
`lib/form-fields.ts` 13:14:45). Vì vậy:

- **KHÔNG** có ghi đè nào từ worker này lên 2 tệp mã (lệnh `edit` đầu tiên bị từ chối: *“file changed since it was read”*).
- Worker này chuyển sang **kiểm định độc lập** bản đã commit + ghi hồ sơ này.
- Kỷ luật red→green: **không thực hiện được** vì mã đã bị đổi và commit trước khi lượt sửa đầu tiên của worker này
  hạ cánh (không còn trạng thái “đỏ” để quan sát). Đây là hạn chế của lượt chạy, không phải bỏ qua quy trình.

## 1. Năm điểm đã sửa (trước → sau) — đối chiếu `git show 151d1ef`

| # | Tệp:dòng | Trước | Sau |
|---|---|---|---|
| 1 | `app/page.tsx:2354` | `{lockedProject||data.projects.length===1?<strong className="locked-project-value">…` ⇒ tài khoản 1 dự án bị **ẩn select** | `{lockedProject?<strong …` ⇒ **luôn hiện `<select name="projectId">`** trừ khi khoá theo màn hình ngoài; **không bắt buộc** |
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
  `:93-94` `resolveContractOrNull(...)` **(không còn ném 400 khi dự án không có hợp đồng)** ·
  `:318` `header.put("projectId", projectId)` ⇒
  `RequestStoreAdapter.java:252-257` `INSERT INTO material_requests (…,project_id,…) VALUES (?,…)` (bind nguyên giá trị rỗng).
  Cột đã được nới NULL: `V24__material_request_project_nullable.sql` (`MODIFY COLUMN project_id VARCHAR(64) … NULL`).
- **Đính chính nhỏ (không phải lỗi chặn):** nhánh Java **lưu chuỗi rỗng `''`**, không phải literal `NULL`
  (không có `nvl(projectId)` trước khi bind). Đúng như yêu cầu “NULL/''”, nhưng nếu muốn đúng literal `NULL`
  thì cần thêm 1 dòng `nvl` — **ngoài phạm vi TASK-137**, captain quyết.

## 3. Grep 5 chuỗi cũ

| Chuỗi | Vùng `RequestModal` (`app/page.tsx:2336–2364`) | Toàn `app/page.tsx` | `lib/form-fields.ts` | Toàn workspace (`app lib scripts tests drizzle tools java-backend`) |
|---|---|---|---|---|
| `— Chọn dự án cụ thể —` | **0** | **0** | **0** | **0** |
| `Chọn hợp đồng` | **0** | 1 (`:1059`, màn **SO SÁNH & MAPPING BOQ** — ngoài phạm vi) | **0** | 2 (`app/page.tsx:1059`, `app/screens/BoqControl.tsx:71`) |
| `Chọn phiên bản BOQ` | **0** | **0** | **0** | **0** |
| `Phạm vi / Khu vực thi công` | **0** | **0** | **0** | 2 — **seed migration** `drizzle/0016_dynamic_forms_boq_request.sql:69`, `java-backend/…/db/migration/V3__reference_seed.sql:270` (ngoài phạm vi, xem §5) |
| `data.projects.length===1?<strong` | **0** | **0** | **0** | **0** |

## 4. Cổng kiểm thử trên `151d1ef` (chạy lại độc lập, 21/09/2026)

| Cổng | Kết quả |
|---|---|
| `npx tsc --noEmit` | **0 lỗi** (`exit 0`) |
| `npm run test:workflow` | **ĐẠT** (`exit 0`, không có assertion nào fail) |
| `npm run test:regression` | **67/69** (`ℹ tests 69 · pass 67 · fail 2`) — xem §4b |

### 4b. 2 test đỏ **có trước TASK-137**, không do TASK-137 gây ra

`tests/runtime-admin-boq-regression.test.mjs` vẫn khẳng định **hợp đồng UI cũ** mà chính người dùng đã yêu cầu bỏ:

- `:226` `assert.match(ui,/Đang ở Tất cả dự án: chọn một dự án cụ thể để lập phiếu/)`
  — chuỗi này **đã bị bỏ ở `bd3e90e` (TASK-136)**.
- `:303` `assert.match(page,/Bạn có chắc chắn muốn gửi phiếu này\?/)` — popup xác nhận **đã bị bỏ theo yêu cầu người dùng** ở `bd3e90e`.

Chứng minh đỏ có trước: `git show 94d103a:app/page.tsx` (HEAD ngay trước TASK-137) **không** chứa cả hai chuỗi
(kiểm bằng script: `contains(...) => False`), chuỗi thật tại đó là
`“có thể để trống — hệ thống dùng dự án mặc định trong phạm vi tài khoản”`.
⇒ Bộ regression **đã đỏ từ `bd3e90e` (TASK-136)**; con số “69/69” chỉ đúng trước `bd3e90e`.
File test này **ngoài 3 tệp được phép của TASK-137** nên worker này **không tự sửa**; cần captain quyết
(cập nhật 2 assertion về hợp đồng mới, hoặc tách việc đó thành task riêng).

## 5. ⛔ HAI ĐIỂM CHẶN RUNTIME (thuộc captain — ngoài phạm vi 3 tệp của TASK-137)

Root cause chung: **UI :8787 được phục vụ bởi stack JS**, không phải Java.
`scripts/universal-server.mjs:96-99` định tuyến **mọi** `GET/POST /api/system` sang `scripts/system-route.mjs`.

1. **Ô “Dự án” để trống ⇒ :8787 vẫn TỪ CHỐI lập phiếu.**
   `scripts/system-route.mjs:1006`
   `if (!projectId || !lines.length) throw new Error("Phiếu đề nghị phải có dự án và ít nhất một dòng vật tư.");`
   (kèm `:1012` `canAccessProject`, `:1013-1014` bắt buộc tìm thấy dự án, `:1017` truy vấn BOQ theo `project_id`).
   ⇒ Việc “bỏ chốt phải có dự án” mới chỉ có ở **Java** (`94d103a`); **stack JS đang chạy :8787 chưa có**.
   Muốn test UI :8787 đạt yêu cầu “lưu rỗng”, phải port nhánh `projectId` rỗng sang `scripts/system-route.mjs`
   (cho ghi `NULL`, bỏ 3 chốt phụ thuộc `projectId`) — **cần captain quyết vì file này ngoài phạm vi TASK-137**.
2. **Nhãn ô “Ghi chú” sẽ KHÔNG đổi trên UI dù đã sửa mã.**
   `label()` = `fieldConfig(data.formFieldConfigs,"request_header","area")?.displayName || "Ghi chú"`
   (`app/page.tsx:2348`) và `fieldConfig` → `mergedFormFields` **cho bản ghi CSDL đè lên default mã nguồn**
   (`lib/form-fields.ts:99-107`, `:119-121`). Dữ liệu đang chạy (`GET /api/system` ← `form_field_config`) vẫn là:
   `.local-data/warehouse.sqlite` → `request_header.area` = **`Phạm vi / Khu vực thi công`**;
   kèm `request_header.neededAt` = **`Ngày cần vật tư tại công trường`** + `required=1`,
   `request_header.projectId.required = 1` (ô Dự án ở form không dùng `required()` nên không hiện `*`, nhưng vẫn là dữ liệu cũ).
   ⇒ Cần **cập nhật DỮ LIỆU**, một trong hai cách (captain chọn):
   - Đổi qua màn **Quản trị → Cấu hình hệ thống → Cấu hình riêng · Đầu phiếu đề nghị → “area” → Tên hiển thị = `Ghi chú`**;
   - hoặc migration dữ liệu cho mọi môi trường (dev SQLite + MySQL/Java):
     `UPDATE form_field_config SET display_name='Ghi chú' WHERE form_key='request_header' AND field_key='area';`
     (tuỳ chọn: đồng bộ luôn `neededAt` = `Ngày cần`, `required=0` nếu muốn khớp TASK-136).

## 6. Việc captain cần làm

1. **Rebuild bundle web** (`gd-cycle`) rồi test lại trên UI **:8787** (TASK-137 **không** build/không start-stop dịch vụ).
2. Xử lý **§5.1** (stack JS `scripts/system-route.mjs`) nếu muốn “để trống Dự án” chạy được thật trên :8787.
3. Xử lý **§5.2** (dữ liệu `form_field_config`) nếu muốn UI hiện đúng chữ **“Ghi chú”**.
4. Quyết định **§4b** (2 assertion regression cũ — đỏ từ TASK-136).
