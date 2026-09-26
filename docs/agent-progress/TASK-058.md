# TASK-058 — `workItems` + `workItemEvents`: **DONE (#96)** — vá lỗ hổng "không có WHERE" (lộ dữ liệu giữa các phòng ban)

**Trạng thái:** **DONE — kiểm chứng lúc chạy 18/18, có ĐỐI CHỨNG DƯƠNG đo được** (trước khi vá: **4/18**, mọi tài khoản thấy **7/7** dòng của mọi phòng ban)
**Ngày:** 17/09/2026 · **Commit:** #96 · **Nguồn:** cổng tập cột TASK-056 (known issue #58)

---

## 1. Lỗi (đo được bằng probe, không chỉ đọc mã)

| | Trước #96 | Sau #96 |
|---|---|---|
| Mệnh đề `WHERE` của JS `:715` | **KHÔNG CÓ** ⇒ mọi tài khoản nhận **toàn bộ** công việc của mọi phòng ban/dự án | **port đủ 4 nhánh** |
| Cột | 18 cột, **hai tên sai** (`assigneeUserId`/`assigneeName` thay vì `assignedTo`/`assignedToName`) ⇒ UI đọc khoá không tồn tại ⇒ **trống**; thiếu `projectCode`/`projectName`/`sourceModule`/`sourceType`/`sourceId`/`sourceNo`/`assignedBy`/`assignedByName`/`waitingReason`/`waitingStartedAt`/`submittedAt`/`active` | **29 cột** như JS `:717` |
| `workItemEvents` | trả sự kiện của **MỌI** công việc, thiếu `actorName`/`previousAssignee`/`newAssignee` | **chỉ** sự kiện của công việc trong phạm vi (JS `:718`) + đủ cột |
| `LIMIT` | 500 | **1000** (như JS) |

## 2. Bộ lọc đã port — nguyên văn 4 nhánh JS `:715-716`

| Nhánh | Điều kiện | Binds |
|---|---|---|
| admin | `1=1` | — |
| **KH** (`departmentForRole==='KH'`, tức `base_role='procurement'`) | `(wi.department_code='KH' AND (wi.assigned_to=? OR EXISTS(SELECT 1 FROM role_catalog rc WHERE rc.code=? AND rc.code='kh_truong')))` | `userId`, `roleCode` |
| **DA** (`base_role='project'`) | như trên với `'DA'` / `'da_truong'` | `userId`, `roleCode` |
| **BCH** (`departmentCodeForUser==='BCH'`) | `(wi.department_code='BCH' AND (wi.assigned_to=? OR wi.project_id IS NULL OR wi.project_id IN (<phạm vi dự án>)))` | `userId`, các `projectId` |
| còn lại | `wi.assigned_to=?` — **chỉ việc CỦA MÌNH** | `userId` |

Kèm **2 helper port nguyên văn**: `departmentForRole` (JS `:246`) và `departmentCodeForUser` (JS `:388`, xét **CHUỖI PHÒNG BAN** đã bỏ dấu trước rồi mới tới mã vai trò) + `stripDiacritics` theo đúng cách JS (`NFD` + xoá khối dấu; `đ` **không** bị tách, giống JS).
`BootstrapDataPort.Context` được bổ sung trường **`department`** (nguồn: `users.department`).

## 3. Kiểm chứng — `tools/probe-task058-work-items.mjs`

`work_items` đang **rỗng (0 dòng)** nên probe **tự dựng 7 dòng TẠM** (KH×3 · DA×2 · BCH×2) + **2 sự kiện**, rồi đăng nhập **6 tài khoản THẬT** và khẳng định tập hiển thị; **dọn sạch có kiểm chứng** (`0 → 0` dòng).

**ĐỐI CHỨNG DƯƠNG (đo trên jar trước khi vá): 4/18 ĐẠT** — cả 5 tài khoản khác vai trò đều thấy **đủ `T1..T7`**.

**Sau khi vá: 18/18 ĐẠT:**

| Tài khoản | Vai trò/phòng | Thấy | Nhánh được chứng minh |
|---|---|---|---|
| `admin` | admin | **T1–T7 (7)** | `1=1` |
| `nvkhdemo` | `kh_nv` / procurement | **T1,T5** | KH — **chỉ việc của mình** |
| `trinhtrench` | `kh_truong` / procurement | **T1,T5,T6** | KH — **`EXISTS(role kh_truong)`** ⇒ thấy cả việc KH giao người khác |
| `nvdademo` | `da_nv` / project | **T2** | DA |
| `tkhodemo` | `thu_kho` (department *"Ban chỉ huy công trường"*) | **T3,T4** | BCH (`assigned_to` + `project_id IS NULL` + dự án trong phạm vi) |
| `thukydemo` | `thuky` (HCPC) | **T7** (mang mã phòng DA) | nhánh cuối — **chỉ việc giao cho mình** |

Thêm: **29 cột đủ** trên mọi dòng · `projectCode`/`projectName` có giá trị (JOIN `projects`) · `assignedToName`/`assignedByName` **có giá trị** (trước đây khoá không tồn tại) · **sự kiện được lọc theo phạm vi** (KH/DA chỉ thấy sự kiện của công việc mình thấy) · đối chứng âm: **không tài khoản nào thấy việc/sự kiện ngoài phạm vi**.

**Cổng khác không hồi quy:** `probe-column-parity` **9 → 8 khoá** (workItems đã sạch; đối chứng dương 4/4) · `probe-task050-bootstrap` **93/93** · `probe-task048` **18/18** · `probe-task049` **10/10** · `probe-task054` **20/20** · cổng tĩnh còn **1 khoá** (`user` — dương tính giả) · `probe-java-sql-live` **không phát sinh mới**.

## 4. Lỗi của chính tôi ở lượt này
Câu `INSERT` dựng fixture liệt kê **32 cột nhưng chỉ 31 giá trị** ⇒ `ERROR 1136` ⇒ lần chạy probe đầu báo HỎNG ở phần dựng dữ liệu. Đã sửa thành chỉ cấp **17 cột NOT NULL** (các cột còn lại cho phép `NULL`).

## 5. Việc kế tiếp
**8 khoá còn thiếu cột** (TASK-056 mục 4) — trong đó 3 khoá cùng thiếu `createdBy`/`createdByName` (`accountingVouchers`, `officialCorrespondence`, `legalDocuments`), `hrRecords` thiếu `identityDate`/`identityPlace`, `taskNotifications` thiếu 5 cột **và lệch cả tên khoá** (`workItemId` vs `taskId`). ⇒ **TASK-059**.
