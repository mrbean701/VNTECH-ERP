# TASK-097 — PHASE 3 (`T-05` · `T-06` · `T-07`): VIỆC CÁ NHÂN 3 NHÓM · PHẠM VI PHÒNG BAN · BOARD KANBAN

- **Mã:** TASK-097 · **Ngày:** 20/09/2026 · **Roadmap:** `T-05`, `T-06`, `T-07` (`docs/25_TODO_ROADMAP.md` §PHASE 3 — CÔNG VIỆC)
- **Phụ thuộc đã DONE trước đó:** `T-01` (5 tab ⇄ 5 mục menu) · `T-03`/`T-04` (trường còn thiếu + `work_item_comments`/`work_item_participants`)
- **Trạng thái:** **`DONE`** — 6 cổng XANH · 3 tệp hợp đồng mới **22/22 ĐẠT** (ĐỎ trước → XANH sau)
- **Commit:** `71a3bef` (`T-05`) · `46fc930` (`T-06`) · `d114967` (`T-07`) · commit tài liệu cuối (roadmap + MASTER_STATUS + tệp này)
- **Phạm vi tệp đã đụng:** `app/screens/WorkCenter.tsx` · `app/screens/WorkKanban.tsx` (**mới**) · `tests/t05-personal-work.test.mjs` · `tests/t06-department-scope.test.mjs` · `tests/t07-kanban-board.test.mjs` · `docs/25_TODO_ROADMAP.md` (1 ô) · `docs/agent-progress/MASTER_STATUS.md` (3 ô số) · tệp này.
  **KHÔNG** đụng `app/page.tsx` (không cần), `lib/ui-shared.tsx` (không cần), `drizzle/**`, `java-backend/**`, `scripts/**`, `AGENTS.md`, `docs/28_*`, `.docx`/`.xlsx`. **KHÔNG** build, **KHÔNG** khởi động/dừng dịch vụ.

## 1. Hợp đồng TÊN TRƯỜNG — ĐO, không đoán

| Khoá payload | Trường THẬT (đo được) | Nguồn |
|---|---|---|
| `workItems[]` | `assignedTo` · `assignedToName` · `assignedBy` · `assignedByName` · `departmentCode` · `projectId` · `priority` · `status` · `progress` · `dueAt` | `scripts/system-route.mjs` (`wi.assigned_to AS assignedTo`, `ua.full_name AS assignedToName`, `wi.assigned_by AS assignedBy`, `ub.full_name AS assignedByName`) |
| `workItems[]` | **KHÔNG có** `createdBy` / `created_by` / `assigneeUserId` / `assigneeName` | payload thật `:9000` (danh sách khoá in ra) + DDL `drizzle/0031_department_task_engine.sql` + Flyway `V1__baseline.sql`:2245 |
| `userScopes[]` | `userId` · `projectId` · `permission` · `projectCode` | `scripts/system-route.mjs` — `userScopes` (bảng `user_project_scopes`) |
| `modulePermissions[]` | `userId` · `moduleKey` · `canView` … | `scripts/system-route.mjs`; `lib/permissions.ts`:18 (`item.moduleKey`, `row?.canView`) |
| `departmentModulePermissions[]` | `organizationUnitId` · `organizationCode` · `moduleKey` · `canView` … | payload thật `:9000` (480 dòng với `admin`) |

**Lỗi im lặng phải tránh (đã có tiền lệ):** `assigneeUserId` / `assigneeName` KHÔNG tồn tại trong `workItems` ⇒ cổng `tools/probe-work-item-field-contract.mjs` chạy lại: **18/18 ĐẠT · 0 HỎNG · 2 GHI NHẬN (bundle cũ)**.
**Hệ quả bắt buộc ghi rõ:** `work_items` KHÔNG có cột "người tạo" ⇒ «**do tôi tạo**» được định nghĩa = **tôi là người GIAO** (`assignedBy`). Đây là điểm cần user xác nhận (xem §6).

## 2. `T-05` — Việc cá nhân: của tôi · được giao · do tôi tạo

| Nhóm (khoá) | Luật lọc (trường THẬT) | Bộ đếm |
|---|---|---|
| **Của tôi** (`mine`) | `assignedTo === tôi` | `mine.length` |
| **Được giao** (`assigned`) | `assignedTo === tôi` **VÀ** `assignedBy !== tôi` | `assigned.length` |
| **Do tôi tạo** (`created`) | `assignedBy === tôi` | `created.length` |

- Khối thuần `PERSONAL_GROUPS` + `personalWorkGroups(rows, myId)` — `app/screens/WorkCenter.tsx`:39-65 (mốc `T05-PURE-BEGIN/END`).
- UI: dải 3 nhóm có **bộ đếm riêng** + **bộ lọc riêng** (`personalGroup` state, mặc định `mine`) tại `app/screens/WorkCenter.tsx` tab 0; bảng bên dưới đổi theo nhóm đang chọn (`find(personalRows)`).
- Không phá `T-01`: tab «Cá nhân» vẫn giữ form `create_self_work_item` và tiêu đề `Danh sách việc của tôi`.

## 3. `T-06` — Việc phòng ban: giới hạn theo phạm vi được phép

- Khối thuần `workScopeOf(data)` + `departmentWorkScope(data, rows)` — `app/screens/WorkCenter.tsx`:67-114 (mốc `T06-PURE-BEGIN/END`).
- Luật **MÔ PHỎNG** nhánh SQL `workItemWhere` của bootstrap (`scripts/system-route.mjs`:773-774) nên **chỉ THU HẸP**, không bao giờ nới:
  - **quản trị** (`role==='admin'`): toàn bộ payload (bootstrap đã là `1=1`);
  - **KH** (`roleBase==='procurement'` hoặc mã phòng `KH`): `departmentCode==='KH'` và (`assignedTo===tôi` **hoặc** tôi là `kh_truong`);
  - **DA** (`roleBase==='project'` hoặc mã phòng `DA`): như trên với `DA`/`da_truong`;
  - **BCH**: `departmentCode==='BCH'` và (`assignedTo===tôi` **hoặc** `projectId` rỗng **hoặc** `projectId` ∈ `userScopes` **của CHÍNH tôi** — `userId===tôi`);
  - **thiếu `canView`** (`modulePermissions` + `departmentModulePermissions` đều không cấp `dept_*`): chỉ còn việc của chính mình.
- **Vá lỗ hổng nới phạm vi:** dòng cũ `myDepts = [...new Set([String(me.organizationCode || ""), "CN"].filter(Boolean))]` cộng cứng mã phòng `"CN"` cho MỌI tài khoản ⇒ **đã gỡ**; test t06 chặn không cho tái xuất hiện.
- UI: tab «Phòng ban» hiện `PHẠM VI ĐƯỢC PHÉP: …` và đếm `N việc NGOÀI phạm vi đã bị ẩn` để người dùng thấy mình đang bị giới hạn (không im lặng).

## 4. `T-07` — Board Kanban: 3 chiều TÁCH BẠCH

| Chiều | Cách thể hiện | Trường dùng |
|---|---|---|
| **Trạng thái** | **CỘT** của bảng — 5 cột phủ **ĐÚNG 12 trạng thái thật** của `WORK_STATUS_LABELS` | `status` |
| **Ưu tiên** | **NHÃN + MÀU** trên thẻ (+ bộ lọc riêng) | `priority` (`critical·urgent·high·normal·low`) |
| **Phân công** | **BỘ LỌC/ĐẾM theo người** ("Người X · N việc") | `assignedTo` + `assignedToName` |

- Tệp mới `app/screens/WorkKanban.tsx` (khối thuần `T07-PURE-BEGIN/END`); gắn vào **tab «Phòng ban»** của `WorkCenter` (`<WorkKanban … onMove={moveStatus}/>`), dùng CHÍNH tập việc đã lọc phạm vi của `T-06`.
- **Lý do đặt ở tab «Phòng ban»:** `T-01` đã chốt cứng **5 tab** (test t01 kiểm nguyên văn `WORK_TABS`) ⇒ không được mở tab/màn mới; «Giao việc» là màn riêng (`DepartmentTaskWorkspace`); để dành tab «Dashboard» cho `T-08`.
- **KÉO-THẢ: CÓ LÀM** và **gọi ACTION THẬT** `update_work_item_status` (`scripts/system-route.mjs`:1227) — không đổi giao diện bằng state cục bộ (test chặn `setRows(`/`setStatus(`).
  - Cổng `kanbanDropGuard` mô phỏng đúng luật backend: (a) chỉ người thực hiện **hoặc** trưởng phòng của phòng đó; (b) `COMPLETED` chỉ trưởng phòng/quản trị; (c) trạng thái Chờ/Blocked/Tạm dừng **bắt buộc có lý do** (ô "Lý do" trên board); (d) trạng thái đích phải hợp lệ và khác trạng thái hiện tại.
  - Cột gộp nhiều trạng thái khai báo **tường minh** `dropStatus` (WAITING→`BLOCKED`, CLOSED→`COMPLETED`); test kiểm `dropStatus ∈ statuses` của chính cột.
  - **Bất biến chống lệch luật:** `workScopeOf` (T-06) và `kanbanManagerDepartments` (T-07) là hai bản sao luật `isDepartmentManager`; test t07 **so hai bản** trên 5 vai trò và đã **bắt được 1 lệch thật** (`admin`) ngay khi viết (đã sửa cho khớp).

## 5. Cổng đã chạy (dán kết luận)

| # | Lệnh | Kết quả |
|---|---|---|
| 1 | `npx tsc --noEmit` | **exit 0** (0 lỗi) |
| 2 | `npm run lint` | **0 error** · 181 warning (nền ~180 như cũ) |
| 3 | `npm run test:regression` | **69/69 pass** · 0 fail (≥ 69) |
| 4 | `npm run test:workflow` | **ĐẠT** — `Workflow VNTECH ERP V5.3.0 FULL W2 passed` (exit 0) |
| 5 | `node --test tests/t05-personal-work.test.mjs tests/t06-department-scope.test.mjs tests/t07-kanban-board.test.mjs` | **22/22 ĐẠT** (t05 6 · t06 8 · t07 8) |
| 6 | `node --import tsx tests/t01-work-menu-probe.mjs` | **7 ĐẠT · 0 HỎNG** (không phá `T-01`) |
| + | `node tools/probe-work-item-field-contract.mjs` | **18/18 ĐẠT · 0 HỎNG · 2 GHI NHẬN (bundle cũ)** |
| + | `node tools/probe-roadmap-progress.mjs` | **DONE 66/110 (60.0 %)** · BLOCKED 1 · TODO 43 · **PHASE 3 = 7/10** |

**ĐỎ trước → XANH sau (3 tệp hợp đồng viết TRƯỚC khi sửa mã nguồn):**

- **ĐỎ:** `node --test <3 tệp>` ⇒ `ℹ tests 9 · pass 0 · fail 9` (t05 + t06 hỏng ở mốc khối thuần chưa tồn tại; t07 hỏng 7 ca, gồm `WorkCenter chưa import board Kanban`, `chưa nối onMove vào action thật update_work_item_status`, `WorkCenter.tsx thiếu khối thuần…`).
- **XANH:** sau khi thêm 2 khối thuần + wiring ⇒ `ℹ tests 22 · pass 22 · fail 0`.

## 6. UNKNOWN / cần user quyết

1. **«Do tôi tạo» = `assignedBy`** (vì `work_items` không có cột người tạo riêng). Nếu user muốn "người tạo" là khái niệm KHÁC người giao (ví dụ người nhập bản ghi nguồn), phải **thêm cột DB** ⇒ vượt phạm vi 3 mục này, cần mục master task mới.
2. **`MASTER_STATUS` còn lệch 1 ô số:** cổng đo TODO = **43** (66+1+1+43 = 111 dòng — roadmap đang có 111 dòng mục), còn dòng `TODO` trong `MASTER_STATUS` ghi **46**. Đề bài chỉ cho sửa 3 ô (DONE / % / PHASE 3) nên **giữ nguyên** ô TODO ⇒ báo user để cập nhật ở đợt sau.
3. **Vị trí board Kanban:** đặt trong tab «Phòng ban» (đã nêu lý do §4). Nếu user muốn board ở mục menu riêng hoặc tab «Dashboard» (`T-08`), đây là quyết định cần chốt — đổi chỗ rất rẻ (1 dòng render).
4. **Cổng quyền `dept_*` phía UI:** nếu tài khoản trưởng phòng chỉ được cấp quyền bằng khoá module KHÁC 4 khoá `dept_plan_*`/`dept_project_*`, UI sẽ chỉ cho họ thấy việc của chính mình (an toàn, không nới quyền) — cần user xác nhận danh sách khoá cấp quyền chuẩn.
5. **Bằng chứng runtime của UI:** nhánh này **bị cấm build/khởi động dịch vụ** ⇒ ảnh/DOM thật của board chỉ đo được **sau khi có bundle mới** (bài học đã ghi nhiều lần trong dự án).
