# TASK-099 — PHASE 3 (`T-09` + `T-08`) + `T-10`: KIẾN TRÚC CÔNG VIỆC · DASHBOARD 3 KHỐI · TÁCH APPROVAL CENTER

- **Mã:** TASK-099 · **Ngày:** 20/09/2026 · **Roadmap:** `docs/25_TODO_ROADMAP.md` §PHASE 3 — CÔNG VIỆC (`T-09`, `T-08`) + dòng `T-10` (module Phê duyệt)
- **Nguồn yêu cầu:** `T-09` «Kiến trúc Task → Team → Thành viên → Hỗ trợ liên phòng (§10)» · `T-08` «Dashboard cá nhân + phòng ban + dự án (§11)» · `T-10` «Tách Approval Center thành module độc lập (§12)» + `docs/24_SYSTEM_AUDIT_REPORT.md`:409 *"Approval Center chưa tách khỏi Công việc"*.
- **Trạng thái:** **`DONE` cả 3 mục** — 7/7 cổng XANH · hợp đồng mới **18 ca ĐẠT** (`t09` 8 · `t08` 6 · `t10` 4).
- **Quyết định đã chốt:** `T-09` **KHÔNG tạo bảng mới** (dùng dữ liệu ĐANG CÓ) · `T-10` **KHÔNG khoá module mới / KHÔNG migration** (dùng khoá ĐÃ CÓ `approvals`) · **KHÔNG build, KHÔNG khởi động dịch vụ**, KHÔNG đụng `ProjectManagement`/BCH của PHASE 4, KHÔNG đổi 5 tab/menu đã chốt ở `T-01`.
- **Commit:** `c2b75f6` (`T-09`) · `967e76d` (`T-08`) · `48d9ac0` (`T-10`) · commit tài liệu cuối cùng.

## 1. `T-09` — KIẾN TRÚC `Task → Team → Thành viên → Hỗ trợ liên phòng` (§10)

**Đã làm:** thêm `app/screens/WorkHierarchy.tsx` (khối thuần + khối UI) và gắn vào tab **«Phòng ban»** của màn Công việc
(`WorkCenter.tsx:25`, `:249`). Mỗi việc vẽ 4 cấp:

| Cấp | Dữ liệu THẬT | Cách nối |
|---|---|---|
| **Task** | `workItems[]` — `id · taskNo · title · projectId · projectCode · departmentCode · assignedTo · assignedToName` (`scripts/system-route.mjs:775`) | 1 dòng = 1 việc trong PHẠM VI ĐƯỢC PHÉP (`T-06`) |
| **Team** | `teams[]` — `id · code · name · trade · projectId · warehouseId` (`:634`) | việc **thuộc** tổ đội khi `teams.projectId === workItems.projectId` (`WorkHierarchy.tsx:44`) |
| **Thành viên** | `teamMembers[]` — `teamId · userId · roleInTeam · joinedAt · leftAt · active · fullName · department` (`BootstrapDataAdapter.java:1200`, bảng `team_members` V14) | chỉ người ĐANG hoạt động (`active=1` & `leftAt` rỗng) — `:47` |
| **Hỗ trợ liên phòng** | (a) `workItemParticipants[]` — `workItemId · userId · userName · roleInTask · roleName` (`scripts/system-route.mjs:783`, bảng `work_item_participants` của `T-04`); (b) thành viên tổ đội khác phòng | phòng của một người lấy `staffDirectory.organizationCode`/`users` hoặc tra TÊN phòng trong `organizationUnits[]` (`:735`) — `:77` |

- **LIÊN KẾT `EntityDetailModal`:** bấm **Team** hoặc **Nhân sự** đều đi qua CỔNG DÙNG CHUNG đã có của PHASE 4 —
  `ProjectEntityModal` (`WorkHierarchy.tsx:214`), chính component này render `<EntityDetailModal` (`ProjectEntityModal.tsx:169`).
  Nút bấm mang mốc `data-entity-kind="team"` (`:179`) / `data-entity-kind="user"` (`:190`, `:201`). **KHÔNG viết modal mới, KHÔNG mở màn mới.**
- **KHÔNG BỊA SỐ (đối chứng âm được test chạy thật):**
  - `teamMembers` là **khoá Java-only** — bootstrap JS (`scripts/system-route.mjs`) **KHÔNG** trả khoá này (đã đo ở `TASK-073`),
    nên khi vắng, cấp «Thành viên» hiện **«chưa có nguồn»** kèm lý do, KHÔNG hiện `0 người`.
  - Người **không tra được phòng** ⇒ **BỊ LOẠI** khỏi «hỗ trợ liên phòng» (không suy diễn), và nguồn ghi rõ thiếu danh bạ.
  - Việc **không có `projectId`** ⇒ `team = null` (không gán bừa tổ đội nào).
- ⚠️ **Lệch có chủ ý so với cột `DB` của roadmap:** dòng `T-09` ghi `TBL` (thêm bảng). Theo chỉ đạo của người dùng,
  **KHÔNG tạo bảng mới** — cây phân cấp suy TRỰC TIẾP từ `workItems + teams + team_members + work_item_participants + userScopes`
  đã có ⇒ **0 migration, 0 dòng schema mới**. Cột `DB` của roadmap **giữ nguyên `TBL`** (ngoài phần được phép sửa: chỉ ô `TT`).

## 2. `T-08` — DASHBOARD 3 KHỐI: cá nhân · phòng ban · dự án (§11)

**Đã làm:** thêm `app/screens/WorkDashboard.tsx` (khối thuần + UI) và gắn vào **tab «Dashboard» (tab số 3)** —
`WorkCenter.tsx:24`, `:290`; **5 tab đã chốt ở `T-01` KHÔNG đổi tên/thứ tự** (chỉ THÊM nội dung).

| Khối | Nguồn THẬT | KPI + bảng/biểu đồ |
|---|---|---|
| **Cá nhân** (`:122`) | `workItems.assignedTo` = tôi (tập `mine` của `T-05`) | Tổng · Hoàn thành · Quá hạn · Tiến độ TB (`progress`) |
| **Phòng ban** (`:134`) | `workItems.departmentCode` trên tập PHẠM VI ĐƯỢC PHÉP (`T-06`) | bảng: Phòng · Tổng · Hoàn thành · Đang mở · Quá hạn · **thanh tỉ lệ** (`task-bar`) |
| **Dự án** (`:154`) | `workItems.projectId` + `projects.code/name` + `userScopes.userId` | KPI dự án có việc · nhân sự theo dự án · bảng có thanh tỉ lệ |

- **KHÔNG gọi API mới:** mọi số tính trong bộ nhớ từ payload (`workDashboard` — `:64`); test khẳng định khối thuần **không có** `fetch(`/`action(`/`await`.
- **KHÔNG BỊA SỐ — có ghi rõ «chưa có nguồn»:** `dashboardSourceOf` (`:41`) phân biệt **0 dòng** với **cột rỗng** và in nguồn kèm số dòng thật;
  chỉ số **KHÔNG có cột trong schema** (tiến độ dự án) hiện thẳng `value={DASHBOARD_NO_SOURCE}` (`:159`) kèm lý do *"projects KHÔNG có cột tiến độ"*;
  cột «Nhân sự» bằng 0 cũng hiện «chưa có nguồn» thay vì `0` (`:161` vùng bảng).
- **Chống hardcode:** test cấm `value="<số>"` trong khối UI ⇒ mọi KPI bắt buộc lấy từ biến tính toán.

## 3. `T-10` — TÁCH APPROVAL CENTER THÀNH MODULE ĐỘC LẬP (§12) — **LÀM ĐƯỢC, chỉ UI + khoá ĐÃ CÓ**

**KHOÁ ĐÃ DÙNG: `approvals`** (khoá module THẬT, ĐÃ CÓ từ trước — **KHÔNG** thêm khoá mới):

| Bằng chứng | Chi tiết |
|---|---|
| `module_catalog` có sẵn dòng `approvals` | `drizzle/0076_phase_menu_11_groups_identity.sql`:35-36 gán nhóm `my_work`; `:76` đặt `sort_order` 50 |
| `MODULE_KEYS` có sẵn | `lib/ui-shared.tsx` — union `ModuleKey` chứa `"approvals"` (KHÔNG có `approval_center`) |
| Màn đã độc lập sẵn | `app/page.tsx:494` — `active === "approvals" && <Approvals data={data} …>` (KHÔNG đụng) |
| Huy hiệu «chờ duyệt» giữ nguyên | `app/page.tsx:439` — `key === "approvals" ? pendingForRole(…)` |

**Việc còn lại thuần HIỂN THỊ MENU (đó là toàn bộ nội dung "tách khỏi Công việc"):**

1. `lib/menu-helpers.ts:136-140` — khai báo tường minh: `approvalCenterMenuKey = "approvals"`, **nhóm menu riêng** `approvalCenterGroup = { groupKey: "approval_center", name: "PHÊ DUYỆT", icon: "PD", sortOrder: 20 }`, và `independentMenuKeys = ["dashboard","approvals"]`.
   - `approval_center` là **KHOÁ NHÓM MENU** (chỉ để xếp chỗ hiển thị) — **KHÔNG** phải khoá module; nhãn nhóm «PHÊ DUYỆT» lấy từ cột **Module** của `docs/25` dòng `T-10` (không tự đặt chữ mới).
2. `app/page.tsx:452` — mọi nhóm **loại** các mục độc lập khỏi `children` (`!independentMenuKeys.includes(item.key)`) ⇒ `approvals` **không còn nằm trong nhóm «CÔNG VIỆC»** (kể cả khi DB gán `group_key='my_work'`).
3. `app/page.tsx:454` — nhóm «CÔNG VIỆC» **vẫn sống** khi `children` rỗng (5 mục của nó do `workMenuChildren` vẽ) ⇒ `T-01` không mất mục nào.
4. `app/page.tsx:461-463` — dựng nhóm riêng chứa ĐÚNG mục `approvals` (lấy từ `allowedModules` ⇒ **đã lọc bằng `modulePermission(data,key).canView`**, không hardcode admin) rồi **sắp lại theo `sortOrder`** ⇒ nhóm «PHÊ DUYỆT» đứng **ngay sau «CÔNG VIỆC» (15)** và trước «QUẢN LÝ DỰ ÁN» (25).
5. **Menu mobile** dùng CHUNG `groupTree` ⇒ nhóm 1-mục tự render thành nút độc lập (`mobile-nav-direct`) — không phải sửa gì thêm.

**Điều kiện BLOCKED đã nêu ở đề bài — ĐÃ KIỂM LÀ KHÔNG XẢY RA (đối chứng chạy trong test):**
`tests/t10-approval-center.test.mjs` quét **toàn bộ** `drizzle/*.sql` + `java-backend/**/db/migration/*.sql` ⇒ **0 tệp** nhắc `approval_center`;
`ModuleKey` không chứa `approval_center`; `modules` (menu-helpers) không có `key: "approval_center"`; **0 dòng `module_catalog`** mới ⇒ **KHÔNG migration**.
⇒ `T-10` **KHÔNG BLOCKED**.

**Bằng chứng cấu trúc menu ĐO THẬT** (chạy chính `lib/menu-helpers.ts` + `lib/workflow-helpers.ts` với `module_catalog` mô phỏng ĐÚNG production):

```
SO NHOM MENU: 11
  [15] my_work · CÔNG VIỆC → (5 muc CONG VIEC ve bang workMenuChildren: Cá nhân · Phòng ban · Giao việc · Dashboard · Báo cáo)
  [20] approval_center · PHÊ DUYỆT → approvals (Trung tâm phê duyệt)
  [25] site_command · QUẢN LÝ DỰ ÁN → …   [28] mep …   [30] purchasing …   [40] warehouse …   [50] finance …   [55] hr_legal …   [60] reports …   [70] material_master …   [80] system_admin …
ModuleKey 'approvals' co trong modules: true | 'approval_center' co trong modules: false
1 dong module_catalog cho approval_center: 0
```

## 4. BẰNG CHỨNG TRACE (Code/DB/API/UI/Permission/Workflow/Data)

| Mặt | Bằng chứng | Tệp : dòng |
|---|---|---|
| **Code (khối thuần chạy thật)** | `T09-PURE-BEGIN/END` (`:31`/`:144`) · `T08-PURE-BEGIN/END` (`:18`/`:105`) — test TRÍCH RA + chạy bằng esbuild | `app/screens/WorkHierarchy.tsx` · `app/screens/WorkDashboard.tsx` |
| **DB** | **Không bảng/cột/migration mới**: `teams` (`:634`), `work_items` (`:775`), `work_item_participants` (`:783`, của `T-04`), `user_project_scopes` (`:749`), `organization_units` (`:735`), `team_members` (V14 — `BootstrapDataAdapter.java:1200`) | `scripts/system-route.mjs` · `java-backend/.../BootstrapDataAdapter.java` |
| **API/Action** | `T-09`/`T-08` **không thêm action**; hành động thật duy nhất của màn vẫn là `update_work_item_status` (board `T-07`) — dashboard/hierarchy chỉ ĐỌC payload | `app/screens/WorkCenter.tsx:161` |
| **UI** | 4 cấp có mốc `data-hierarchy-level="team|members|support"`; 3 khối có mốc `data-dashboard-block="personal|department|project"` + `data-dashboard-source` | `WorkHierarchy.tsx:177-207` · `WorkDashboard.tsx:122/134/154/130/136/161` |
| **Permission** | `WorkHierarchy` nhận `modulePermission(data,"dept_plan_assign")` (`WorkCenter.tsx:249`); mục menu `approvals` đi qua `allowedModules` (đã lọc `canView`) — **không** `isAdminUser` | `app/page.tsx:377`, `:461` |
| **Workflow** | Không đụng: `Approvals` render nguyên trạng; huy hiệu `pendingForRole` giữ nguyên | `app/page.tsx:439`, `:494` |
| **Data** | `teams.projectId ⇄ workItems.projectId`; `teamMembers.teamId/userId/active/leftAt`; `workItemParticipants.workItemId/userId`; `workItems.status/progress/dueAt/completedAt`; `userScopes.userId/projectId` | xem §1–§3 |

## 5. TỆP ĐÃ ĐỔI

| Tệp | Việc | Commit |
|---|---|---|
| `app/screens/WorkHierarchy.tsx` | **mới** — khối thuần 4 cấp + UI + mở `ProjectEntityModal` | `c2b75f6` |
| `app/screens/WorkCenter.tsx` | gắn `WorkHierarchy` (tab «Phòng ban») và `WorkDashboard` (tab «Dashboard») | `c2b75f6` + `967e76d` |
| `tests/t09-task-team-member.test.mjs` | **mới** — hợp đồng 8 ca | `c2b75f6` |
| `app/screens/WorkDashboard.tsx` | **mới** — khối thuần 3 khối + UI (KPI/bảng/thanh) | `967e76d` |
| `tests/t08-work-dashboard.test.mjs` | **mới** — hợp đồng 6 ca | `967e76d` |
| `lib/menu-helpers.ts` | `+` 3 khai báo `T-10` (khoá đã có + nhóm menu riêng + mục độc lập) | `48d9ac0` |
| `app/page.tsx` | loại mục độc lập khỏi `children`, giữ nhóm «CÔNG VIỆC», dựng nhóm «PHÊ DUYỆT» + sắp `sortOrder` | `48d9ac0` |
| `tests/t10-approval-center.test.mjs` | **mới** — hợp đồng 4 ca + đối chứng «không migration» | `48d9ac0` |
| `docs/25_TODO_ROADMAP.md` | ô `TT` (index 10) `T-08`/`T-09`/`T-10` → `**DONE**` | commit tài liệu |
| `docs/agent-progress/MASTER_STATUS.md` | chỉ ô số: DONE `70 → 73`, `63,6 % → 66,4 %`, TODO `39 → 36` (`35,5 % → 32,7 %`), PHASE 3 `7/10 → 10/10` | commit tài liệu |
| `docs/agent-progress/TASK-099.md` | **mới** — hồ sơ này | commit tài liệu |

**KHÔNG đụng:** `AGENTS.md` · `docs/28_*` · mọi `.docx`/`.xlsx` · `drizzle/**` · `java-backend/**` · `scripts/**` · `docs/agent-progress/TASK-094.md…TASK-098.md` · vùng `ProjectManagement`/BCH (PHASE 4) · 5 tab/menu đã chốt ở `T-01`.

## 6. BẢY CỔNG BẮT BUỘC — nguyên văn kết luận

| # | Lệnh | Kết quả |
|---|---|---|
| 1 | `npx tsc --noEmit --incremental false` | `G1_TSC_EXIT=0` — **0 lỗi** |
| 2 | `npm run lint` | `✖ 181 problems (0 errors, 181 warnings)` · `G2_LINT_EXIT=0` — **0 error** (đúng nền 181 warning) |
| 3 | `npm run test:regression` | `ℹ tests 69 · pass 69 · fail 0` · `G3_REG_EXIT=0` — **69/69** |
| 4 | `npm run test:workflow` | `Workflow VNTECH ERP V5.3.0 FULL W2 passed: …` · `G4_WF_EXIT=0` — **ĐẠT** |
| 5 | `node --test tests/t09… tests/t08… tests/t10…` | `ℹ tests 18 · pass 18 · fail 0` · `G5_NEW_EXIT=0` — **18/18 ĐẠT** |
| 6 | `node --import tsx tests/t01-work-menu-probe.mjs` | `═══ KẾT QUẢ: 7 ĐẠT · 0 HỎNG ═══` · `G6_T01_EXIT=0` |
| 7 | `node tools/probe-work-item-field-contract.mjs` | `=== CỔNG HỢP ĐỒNG TRƯỜNG CÔNG VIỆC: 18/18 ĐẠT · 0 HỎNG · 2 GHI NHẬN (bundle cũ) ===` · `G7_FC_EXIT=0` — **không tệ hơn nền** |

## 7. TEST HỢP ĐỒNG: ĐỎ trước → XANH sau

| Tệp | ĐỎ (mã TRƯỚC, test CUỐI) | XANH (mã SAU) |
|---|---|---|
| `tests/t09-task-team-member.test.mjs` | `ℹ tests 8 · pass 7 · fail 1` — `✖ GẮN vào màn Công việc: WorkCenter chưa import khối phân cấp` | `tests 8 · pass 8 · fail 0` |
| `tests/t08-work-dashboard.test.mjs` | `ℹ tests 6 · pass 5 · fail 1` — `✖ WorkCenter chưa import khối dashboard` | `tests 6 · pass 6 · fail 0` |
| `tests/t10-approval-center.test.mjs` | `ℹ tests 4 · pass 3 · fail 1` — `✖ Thiếu khai báo khoá 'approvals' cho Trung tâm phê duyệt` (chạy lại với 2 tệp mã ở bản TRƯỚC `T-10` rồi HOÀN TÁC về `HEAD`, cây làm việc sạch) | `tests 4 · pass 4 · fail 0` |

*Ghi chú trung thực:* vòng ĐỎ đầu của `t10` có **2 ca hỏng**, trong đó **1 ca là lỗi phía TEST** (regex thiếu `[]` khi so khai báo `workMenuItems`) — đã sửa test; con số ĐỎ ở bảng trên là lần chạy SẠCH sau khi sửa.

## 8. PROBE TIẾN ĐỘ LỘ TRÌNH (sau khi sửa)

`node tools/probe-roadmap-progress.mjs` (`PROBE_EXIT=0`):

```
Tổng số mục đọc được: 110
  DONE         73 / 110  (66.4%)
  BLOCKED       1 / 110  (0.9%)
  TODO         36 / 110  (32.7%)
THEO PHASE (DONE / tổng mục của phase):
  PHASE 3 — CÔNG VIỆC        10/10
```

**Đúng kỳ vọng: 73/110 (66,4 %) · PHASE 3 = 10/10** (ô `TT` index 10 của `T-08`/`T-09`/`T-10` = `**DONE**`, không backtick).

## 9. UNKNOWN / cần người dùng quyết

1. **`T-09` lệch cột `DB` của roadmap (`TBL`)** — theo chỉ đạo, KHÔNG tạo bảng mới (cây suy từ dữ liệu có sẵn). Nếu người dùng muốn đúng chữ `TBL` (bảng `task_teams` riêng) thì cần một task KHÁC + migration — **hiện KHÔNG làm**.
2. **`teamMembers` vắng trong payload JS** (khoá Java-only, đã ghi ở `TASK-073`) ⇒ cấp «Thành viên» của `T-09` sẽ hiện «chưa có nguồn» trên stack JS cho tới khi bootstrap JS trả `team_members`. Đây là **giới hạn dữ liệu có thật**, không phải lỗi UI; muốn có số thì phải bổ sung khoá ở `scripts/system-route.mjs` (ngoài phạm vi được phép sửa của lượt này).
3. **`T-10` chưa đổi `module_catalog.group_key` của `approvals`** (DB vẫn ghi `my_work`): việc tách nhóm nằm ở tầng UI (`independentMenuKeys`). Muốn DB phản ánh nhóm `approval_center` thì cần **migration** — **ngoài phạm vi** (đúng ràng buộc đã chốt).
4. **DOM/bundle chưa đo được** (bị cấm build + khởi động dịch vụ): bằng chứng UI là hợp đồng tầng nguồn + probe cấu trúc menu chạy THẬT. **Kiến nghị:** lượt build kế tiếp mở UI xác nhận nhóm «PHÊ DUYỆT» (1 mục) + 3 khối dashboard + cây 4 cấp.
