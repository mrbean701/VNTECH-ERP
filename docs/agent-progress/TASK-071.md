# TASK-071 — Cổng đo 7 TRƯỜNG ĐẶT ALIAS KHÁC TÊN CỘT NGUỒN (nhóm TASK-070 không đối chiếu được)

**Trạng thái:** ✅ DONE — **9/9 ĐẠT · 1 phép đo KHÔNG thực hiện được** (nói rõ, không tính ĐẠT); đã commit
**Ngày:** 17/09/2026 · **Nhánh:** `unity`
**Cổng:** `tools/probe-task071-aliased-fields.mjs` (mới)

---

## 1. Vì sao có task này

Cổng TASK-070 đối chiếu trường bằng cách `camel → snake_case` rồi tìm **cột cùng tên** trong bảng nguồn.
Nhóm trường đặt **alias khác** — `u.full_name AS fullName`, `o.code AS organizationCode`,
`` level_rank AS `rank` `` — **không** đối chiếu được bằng cách đó. Và đây **đúng nhóm dễ ẩn lỗi nhất**:
tất cả đều là trường **dẫn xuất / JOIN**, nơi đã từng xảy ra lỗi thật trong dự án
(`roleCatalog.businessGroupName` luôn `"—"` · `constructionDailyLogs.itemCount` luôn `0`).

## 2. Cách đo

Giải mã **biểu thức thật** của từng trường từ câu SQL của adapter:
xây bản đồ `alias → bảng` từ `FROM`/`JOIN`, tìm mục `SELECT` có alias cần đo, lấy **cột nguồn** trong biểu thức,
rồi so *"số dòng có dữ liệu ở cột nguồn (MySQL)"* với *"số dòng API trả KHÔNG rỗng"*.

## 3. Bộ giải mã ĐÃ BỊ CHÍNH ĐỐI CHỨNG BẮT LỖI — 4 ca dựng sẵn

| ca dựng sẵn | kỳ vọng | lượt chạy đầu | sau khi sửa |
|---|---|---|---|
| trường **không có** trong SQL | báo "không giải được" | ĐẠT | ĐẠT |
| alias có **BACKTICK** (`` level_rank AS `rank` ``) | ra `system_level_catalog.level_rank` | **HỎNG** (ra `…level_catalog.rank` — chính là alias) | **ĐẠT** |
| `COALESCE(rc.name,u.role) AS roleName` | lấy cột **đầu tiên** `role_catalog.name` | ĐẠT | ĐẠT |
| `u.full_name AS fullName` | ra `users.full_name` | ĐẠT | ĐẠT |

**Nguyên nhân lỗi của chính tôi:** bộ giải mã để nguyên phần `AS <alias>` khi trích cột ⇒ alias bị hiểu thành
tên cột. Phép sửa: **bỏ `AS <alias>` TRƯỚC** khi trích cột. *Nếu không có đối chứng dựng sẵn, cổng đã cho
kết quả SAI (đo `level_rank` bằng cột `rank` không tồn tại).*

## 4. KẾT QUẢ ĐO — 9/9 ĐẠT

| trường | cột nguồn | MySQL | API |
|---|---|---|---|
| `workflowStepApprovers.fullName` | `users.full_name` (text) | 12/12 | **5/5** |
| `workflowStepApprovers.employeeCode` | `users.employee_code` (varchar) | 11/12 | **5/5** |
| `workflowStepApprovers.role` | `users.role` (text) | 12/12 | **5/5** |
| `departmentModulePermissions.organizationCode` | `organization_units.code` | 8/8 | **51/51** |
| `departmentModulePermissions.organizationName` | `organization_units.name` | 8/8 | **51/51** |
| `systemLevelCatalog.rank` | `system_level_catalog.level_rank` (int) | 5/5 | **5/5** |
| `staffDirectory.roleName` | `role_catalog.name` | 16/16 | **12/12** |
| `staffDirectory.organizationCode` | `organization_units.code` | 8/8 | **11/12** |
| `staffDirectory.organizationName` | `organization_units.name` | 8/8 | **12/12** (qua `COALESCE` dự phòng `users.department`) |

⇒ **Không tìm thấy lỗi "trường alias luôn rỗng"**. `staffDirectory.organizationCode` 11/12 là **hợp lý**
(1 tài khoản chưa gán đơn vị — đúng như dữ liệu nguồn), không phải lỗi port.

## 5. Phần CHƯA kiểm được (ghi rõ, không giấu)

* **`teamMembers`**: bảng `team_members` **0 dòng** ⇒ không có dòng để kiểm 12 trường. **Chưa cổng nào kiểm.**
* Trường hợp `COALESCE(a.x, b.y)`: cổng chỉ đo **cột đầu**; nhánh dự phòng (`b.y`) chưa được kiểm riêng.
* Cột nguồn phải có trong lược đồ đang chạy; alias bảng phải khai trong chính câu SQL đó.

## 6. Trạng thái lớp "TRƯỜNG BÊN TRONG" sau TASK-070 + TASK-071

| nhóm | trạng thái |
|---|---|
| 10 khoá Java-only, trường **trùng tên cột** | ✅ TASK-070 — 8/8 ĐẠT (2 khoá rỗng dữ liệu) |
| 4 khoá, **7 trường alias khác tên cột** | ✅ TASK-071 — 9/9 ĐẠT |
| `workItemEvents` (0 dòng khi không có dữ liệu) | ✅ đã được `probe-task058-work-items.mjs` kiểm bằng **fixture 7 công việc + 2 sự kiện**, 18/18 |
| `teamMembers` | ⚠️ **CHƯA KIỂM** — bảng rỗng, chưa có cổng/cắm fixture |
| 13 khoá trùng tên mà cổng TĨNH bỏ qua | ✅ phủ **12/13 về mặt KHOÁ** bằng cổng HỢP ĐỒNG `AppData` (TASK-069); còn `boqMappingCandidates` = payload chết |

## 7. Tệp thay đổi

| Tệp | Thay đổi |
|---|---|
| `tools/probe-task071-aliased-fields.mjs` | **mới** — bộ giải mã `alias → cột nguồn` + **4 đối chứng dựng sẵn** + đo 9 trường trên dữ liệu thật |
| `docs/agent-progress/MASTER_STATUS.md` | CURRENT TASK → TASK-072 · LAST COMPLETED → TASK-071 |
| `docs/agent-progress/TASK_INDEX.md` | dòng TASK-071 |
