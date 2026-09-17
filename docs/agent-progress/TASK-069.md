# TASK-069 — Cổng HỢP ĐỒNG KIỂU `AppData` (95 khoá) + vá lỗi thứ 10 của lớp "đường ĐỌC thiếu khoá": `emailOutbox`

**Trạng thái:** ✅ DONE — lỗi đã vá, kiểm chứng lúc chạy **0/6 → 6/6 ĐẠT**, đã commit
**Ngày:** 17/09/2026 · **Nhánh:** `unity`
**Cổng:** `tools/probe-task069-appdata-contract.mjs` (mới)

---

## 1. Vì sao có task này

Hai cổng TĨNH đã xanh, nhưng khi liệt kê phần **không so được** thì lộ **11 khoá Java-only** —
đúng những khoá **chưa từng được đo**. Cổng của TASK-066 chỉ phủ **38 khoá** vì nó trích theo dạng viết
`result.data?.<khoá>`. Task này dùng **nguồn sự thật mạnh hơn**: **khai báo KIỂU `AppData`** trong `app/page.tsx`.

```ts
type AppData = {
  requests: Row[]; … workflowDefinitions: Row[]; workflowSteps: Row[]; workflowStepApprovers: Row[];
  departmentModulePermissions: Row[]; systemLevelCatalog: Row[];
  emailSettings: Row | null; … supplySteps: Row[]; … workItemEvents: Row[];
  teamMembers?: Row[]; activeSessions?: Row[]; formFieldConfigs?: FormFieldConfig[];
};
```

⇒ **95 khoá** (88 BẮT BUỘC + 7 tuỳ chọn) kèm **KIỂU**. Đây là hợp đồng UI cam kết dùng: nếu API thiếu một khoá
BẮT BUỘC thì khối chuẩn hoá **âm thầm** thay `[]`/null ⇒ màn trống mà **không có lỗi nào nổi lên**.

## 2. LƯỢT CHẠY ĐẦU: **0/6 ĐẠT** — bắt đúng một lỗi thật

```
HỎNG  [admin]       88 khoá BẮT BUỘC đều CÓ — thiếu 1: emailOutbox
HỎNG  [nvkhdemo]    … thiếu 1: emailOutbox
HỎNG  [trinhtrench] … thiếu 1: emailOutbox
HỎNG  [nvdademo]    … thiếu 1: emailOutbox
HỎNG  [tkhodemo]    … thiếu 1: emailOutbox
HỎNG  [thukydemo]   … thiếu 1: emailOutbox
```

**`emailOutbox` là khoá BẮT BUỘC trong hợp đồng UI và bị thiếu cho MỌI tài khoản** — đây là
**lỗi thứ 10** của lớp *"đường ĐỌC thiếu khoá"* mà dự án đã gặp. Hệ quả: màn **Hộp thư gửi** luôn rỗng
dù `email_outbox` có dữ liệu (email phê duyệt / giao việc / thư thử đều ghi vào bảng này).

Kiểm chứng nguyên nhân:
* JS `:724`: `const emailOutbox = isAdmin(user) ? await all(...) : [];` — **11 cột** + `requestNo`
  (LEFT JOIN `material_requests`), `ORDER BY eo.queued_at DESC LIMIT 100`;
* JS `:737`: non-admin nhận `result.emailOutbox = []`;
* **Java: KHÔNG một adapter nào nhắc `emailOutbox`** (`grep` toàn `java-backend`).

## 3. Đã vá

Thêm vào `BootstrapDataAdapter` **ngay cạnh `emailRecipients`** (cùng nhóm email, cùng dạng `admin ? query : []`):

```java
data.put("emailOutbox", admin ? query("""
        SELECT eo.id,eo.request_id AS requestId,eo.stage,eo.event,eo.recipients,eo.subject,
               eo.status,eo.attempt_count AS attemptCount,eo.queued_at AS queuedAt,
               eo.sent_at AS sentAt,eo.last_error AS lastError,mr.request_no AS requestNo
        FROM email_outbox eo LEFT JOIN material_requests mr ON mr.id=eo.request_id
        ORDER BY eo.queued_at DESC LIMIT 100""") : List.of());
```

Cổng SQL (`probe-java-sql-live.mjs`) chạy **TRƯỚC** khi build theo đúng quy tắc: vẫn **8 phát hiện** cũ
(nhóm license), **không phát sinh mới** ⇒ câu SQL mới hợp lệ với lược đồ đang chạy.

## 4. Kiểm chứng sau khi build lại (jar 90.911.909 B) — **6/6 ĐẠT**

`[admin]` · `[nvkhdemo]` · `[trinhtrench]` · `[nvdademo]` · `[tkhodemo]` · `[thukydemo]`:
**88/88 khoá BẮT BUỘC đều CÓ và đúng kiểu**.

⇒ Cổng **tự chứng minh CÓ TÁC DỤNG** theo cách mạnh nhất: nó **bắt được một lỗi thật ngay lượt chạy đầu**
(0/6), rồi xác nhận bản vá (6/6) — không phải kiểu cổng "luôn báo sạch".

## 5. Kết quả rà 11 khoá Java-only — **tất cả đều CÓ dữ liệu thật**

| khoá | hợp đồng UI | API | bảng MySQL |
|---|---|---|---|
| `workflowDefinitions` | CÓ | 1 | `workflow_definitions` 1 |
| `workflowSteps` | CÓ | 5 | `workflow_steps` 5 |
| `workflowStepApprovers` | CÓ | 5 | `workflow_step_approvers` 5 |
| `departmentModulePermissions` | CÓ | 51 | `department_module_permissions` 51 |
| `systemLevelCatalog` | CÓ | 5 | `system_level_catalog` 5 |
| `staffDirectory` | CÓ | 12 | `users` 12 |
| `formFieldConfigs` | CÓ | 65 | `form_field_config` 65 |
| `teamMembers` | CÓ | 0 | `team_members` 0 |
| `workItemEvents` | CÓ | 0 | `work_item_events` 0 |
| `supplySteps` | CÓ | 23 | `supply_workflow_steps` 56 (khác **có chủ ý**: JOIN + lọc theo phạm vi dự án) |
| `boqMappingCandidates` | **KHÔNG** | 0 | `boq_mapping_candidates` 0 |

⇒ 10/11 khoá khớp số dòng với bảng nguồn. **`boqMappingCandidates`**: UI **không đọc** (không có trong
`AppData`, 0 lần xuất hiện trong `page.tsx`), JS cũng không trả, bảng rỗng ⇒ **payload chết** (vô hại,
chỉ tốn dung lượng) — ghi lại, **không xoá** (xoá là thay đổi không cần thiết, ngoài phạm vi).

## 6. Giới hạn đã biết (không giấu)

* Cổng chỉ kiểm **SỰ HIỆN DIỆN + KIỂU**, **KHÔNG phán nội dung nghiệp vụ** (rỗng theo vai trò là **hợp lệ**).
* Số-dòng đối chiếu theo **BẢNG ĐẦU TIÊN trong `FROM`** — câu nhiều bảng có thể lệch **có chủ ý**
  (JOIN lọc dòng, như `supplySteps`) ⇒ cổng **in cặp số để người đọc tự phán**, KHÔNG tự kết luận sai.
* Cổng tự cảnh báo nếu số khoá trích từ `AppData` tụt (< 80) — bài học #103.
* Chưa kiểm **trường bên trong** từng dòng của 11 khoá này (mới kiểm khoá + số dòng).

## 7. Hồi quy

`probe-task050-bootstrap` **100/100** · `probe-task058` **18/18** · `probe-task048` **18/18** ·
`probe-task049` **10/10** · `probe-task054` **20/20** · `probe-task062-boq` **19/19** ·
`probe-task063-clauses` **7/7** · `probe-task065` **10/10** · `probe-task066-role-shape` **11/11** ·
`probe-task069-appdata` **6/6** · `probe-put-order` **0 vi phạm** · cổng tập cột **72 khoá / 0 thiếu** ·
cổng mệnh đề **0 lệch**.

## 8. Tệp thay đổi

| Tệp | Thay đổi |
|---|---|
| `java-backend/…/BootstrapDataAdapter.java` | **thêm khoá `emailOutbox`** (admin: 11 cột + `requestNo`, `LIMIT 100`; non-admin `[]`) |
| `tools/probe-task069-appdata-contract.mjs` | **mới** — cổng hợp đồng `AppData` (95 khoá × 6 tài khoản) + đối chiếu số dòng 11 khoá Java-only |
