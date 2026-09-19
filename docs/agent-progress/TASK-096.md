# TASK-096 — PHASE 3 (`T-01`): TÁCH MENU «CÔNG VIỆC» THÀNH 5 MỤC (CÁ NHÂN · PHÒNG BAN · GIAO VIỆC · DASHBOARD · BÁO CÁO)

- **Mã:** TASK-096 · **Ngày:** 20/09/2026 · **Roadmap:** `T-01` (`docs/25_TODO_ROADMAP.md` §PHASE 3 — CÔNG VIỆC)
- **Nguồn yêu cầu:** roadmap `T-01` (P2, phụ thuộc `U-03` — đã DONE) + `docs/24_SYSTEM_AUDIT_REPORT.md` ~dòng 408: *"Màn công việc chưa tách menu con theo quyền"*.
- **Trạng thái:** **`DONE`** — 5 cổng XANH · hợp đồng `tests/t01-work-menu.test.mjs` **8/8 ĐẠT** (ĐỎ 7/8 → XANH 8/8).
- **Quyết định đã chốt (PHƯƠNG ÁN A):** KHÔNG migration · KHÔNG sửa `scripts/**` · KHÔNG sửa `MODULE_KEYS` · KHÔNG thêm dòng `module_catalog`.
- **Commit:** `9b325c5` (test hợp đồng + probe) · `6502deb` (3 tệp mã nguồn).

## 1. 5 mục menu — nhãn · khoá menu · đích đến THẬT · cổng quyền THẬT

| # | Nhãn | Khoá menu (mới, khai báo trong code) | `view` | Đích đến THẬT | `permissionKeys` (lọc bằng `modulePermission(data, key).canView`) |
|---|---|---|---|---|---|
| 1 | **Cá nhân** | `work_personal` | `personal` | `WorkCenter` tab **Cá nhân** | `dept_plan_tasks` **hoặc** `dept_project_tasks` |
| 2 | **Phòng ban** | `work_department` | `department` | `WorkCenter` tab **Phòng ban** | `dept_plan_assign` **hoặc** `dept_project_assign` |
| 3 | **Giao việc** | `work_assign` | `assign` | **`DepartmentTaskWorkspace`** (GIỮ NGUYÊN) | `dept_plan_assign` **hoặc** `dept_project_assign` |
| 4 | **Dashboard** | `work_dashboard` | `kpi` | `WorkCenter` tab **Dashboard** | `dept_plan_kpi` **hoặc** `dept_project_kpi` |
| 5 | **Báo cáo** | `work_reports` | `reports` | `WorkCenter` tab **Báo cáo** | `dept_plan_alerts` **hoặc** `dept_project_alerts` |
| 6 | *(giữ nguyên)* **Trung tâm phê duyệt** | `approvals` | — | `Approvals` (không đụng) | như cũ — `T-10` tách riêng sau |

Khoá menu là **khoá ẢO chỉ để hiển thị menu**; `active` của ứng dụng **luôn là khoá nghiệp vụ THẬT** (`dept_*`) nên quyền · tiêu đề màn · tìm kiếm · thông báo · `accessDenied` giữ nguyên hành vi.

## 2. Rủi ro số 1 của phương án A — NHÃN có hiển thị đúng không? (ĐÃ ĐO)

Cơ chế: `lib/workflow-helpers.ts`:52 — `label: … (config?.label || item.label)` ⇒ khoá **có** dòng `module_catalog` lấy nhãn từ **DB**, khoá **không có** lấy nhãn trong **code**.

**Không thể đo DOM**: nhánh `T-01` **bị CẤM build** (`npm run build`) và **cấm khởi động dịch vụ** (UI :8787 · proxy :9000 · Java :18081) ⇒ không có bundle mới để mở trình duyệt. Vì vậy đã chứng minh bằng **2 lớp đo được**:

1. **Probe chạy THẬT** `tests/t01-work-menu-probe.mjs` (`node --import tsx tests/t01-work-menu-probe.mjs`) — import **chính** `workMenuItems` + `configuredModules()`, mô phỏng `module_catalog` ĐÚNG production:
   - nhãn khai báo = `"Cá nhân" · "Phòng ban" · "Giao việc" · "Dashboard" · "Báo cáo"` ✔
   - **ĐỐI CHỨNG ÂM:** 4 khoá `dept_*` đi qua đường nhãn DB cho `"Nhiệm vụ nhân viên đang làm"` / `"Giao việc & Kiểm soát hoàn thành"` — **KHÔNG trùng** 5 nhãn chốt ⇒ dùng lại khoá cũ là **SAI NHÃN** (đây là lý do phải có 5 khoá mới).
   - `0/5` khoá mới có dòng `module_catalog` ⇒ nhãn **không thể** bị DB đè. Kiểm chéo: `Select-String "work_personal|work_department|work_assign|work_dashboard|work_reports" drizzle/*.sql java-backend/**/*.sql` = **0** kết quả.
   - **Kết quả: 7 ĐẠT · 0 HỎNG** (exit 0). Probe **KHÔNG** nằm trong gate `package.json`.
2. **Hợp đồng ở tầng nguồn** `tests/t01-work-menu.test.mjs`: nhãn vẽ ra ở `app/page.tsx`:452/465 là `<span>{item.label}</span>` **trực tiếp** từ `workMenuItems` (không đi qua `configuredModules`) ⇒ nhãn hiển thị = nhãn khai báo.

⇒ **Kết luận:** nhãn lấy từ code, đúng 5 nhãn chốt. Phần còn lại (mở trình duyệt đọc DOM thật) **chỉ làm được sau khi có bản build mới** — xem §9.

## 3. Ẩn 4 mục cũ · giữ `approvals` · điều kiện KHÔNG hồi quy

- `lib/menu-helpers.ts`:115 — `legacyWorkMenuKeys = [dept_plan_tasks, dept_project_tasks, dept_plan_assign, dept_project_assign]`.
- `app/page.tsx`:436 — cây nhóm lọc `!legacyWorkMenuKeys.includes(item.key)` ⇒ menu chỉ còn 5 mục mới + `approvals`.
- `approvals` **KHÔNG** nằm trong danh sách ẩn; nó vốn đã ở nhóm `my_work` và `sort_order=50` (`drizzle/0076_phase_menu_11_groups_identity.sql`:35-36,76) ⇒ tự nhiên thành **mục thứ 6**, đúng chủ ý `T-10`.
- **KHÔNG hồi quy «Giao việc»:** `app/page.tsx`:351 `workCenterViewFor()` trả `null` cho `view="assign"` ⇒ rơi về nhánh CŨ (`app/page.tsx`:469) và mở `DepartmentTaskWorkspace` y như 2 mục assign cũ (màn giao việc chi tiết **không mất lối vào**). Không đụng logic `T-03`/`T-04` (bình luận + người tham gia).
- Khoá cũ **vẫn là khoá thật**: quyền, `titles[active]`, tìm kiếm toàn cục (`app/page.tsx`:397), và thông báo công việc (`setActive(dept_plan_tasks|dept_project_tasks)`) đều chạy nguyên.
- Huy hiệu (badge) việc chưa xong **không mất**: `groupBadge` cộng thêm badge của 5 mục mới (`app/page.tsx`:444·458).

## 4. Cổng quyền THẬT (không hardcode «chỉ admin»)

`app/page.tsx`:373-377:

```tsx
const workMenuChildren = workMenuItems.flatMap((item) => {
  const viewable = item.permissionKeys.find((key) => modulePermission(data, key).canView);
  if (permissionConfigured && !viewable) return [];
  return [{ key: item.key, label: item.label, view: item.view, moduleKey: viewable ?? item.permissionKeys[0] }];
});
```

- Đúng **một** cổng cho mỗi mục: `modulePermission(data, permissionKey).canView` (`lib/permissions.ts`) — **không** `isAdminUser`, **không** hardcode.
- Giữ nguyên chính sách cũ của menu (`permissionConfigured` = tài khoản chưa cấu hình quyền chi tiết thì vẫn thấy theo vai trò) ⇒ không khoá nhầm toàn bộ người dùng.
- Cặp khoá **khác nhau** giữa Cá nhân (`…_tasks`) và Phòng ban (`…_assign`); mục «Giao việc» **cố ý** dùng chung cổng với «Phòng ban».
- 5 mục mới **không** nằm trong `modules` ⇒ **không** lọt vào ma trận phân quyền admin (`configuredModules` dùng ở màn Phân quyền) ⇒ không sinh dòng quyền giả.

## 5. Màn `WorkCenter` — 5 tab đúng thứ tự

- `app/screens/WorkCenter.tsx`:29 — `const WORK_TABS = ["Cá nhân", "Phòng ban", "Giao việc", "Dashboard", "Báo cáo"];`
- `:30` — `const WORK_TAB_OF_VIEW: Record<WorkMenuView, number> = { personal: 0, department: 1, assign: 2, kpi: 3, reports: 4 };`
- Giữ nguyên 3 tab cũ: `Việc của tôi` → **Cá nhân** (`:96`) · `Phòng ban / tổ đội` → **Phòng ban** (`:124`) · `KPI & báo cáo` → **Báo cáo** (`:172`). Form «Giao việc cho nhân viên» tách sang tab **Giao việc** (`:135`); KPI tổng hợp → tab **Dashboard** (`:159`).
- Tab «Báo cáo» (`:182`) **TÁI DÙNG** `ReportView` + `lib/report-catalog.ts` (các định nghĩa nguồn `workItems`: `R-05a/b/c`) — **không viết màn mới**.

## 6. Test hợp đồng ĐỎ → XANH (nguyên văn kết luận)

Chạy: `node --test tests/t01-work-menu.test.mjs`

**ĐỎ (mã TRƯỚC `T-01`, ĐÚNG tệp test cuối — checkout 3 tệp về `9b325c5`):**

```
ℹ tests 8
ℹ pass 1
ℹ fail 7        (RED_EXIT=1)
✖ 5 mục menu ĐÚNG nhãn · ĐÚNG nhóm · ĐÚNG đích đến (tab) · cổng quyền RIÊNG từng mục
✖ cổng quyền THẬT: mỗi mục lọc bằng `modulePermission(data, permissionKey).canView`
✖ 4 mục `dept_*` CŨ bị ẨN khỏi menu
✖ menu (sidebar + mobile) dựng 5 mục MỚI của nhóm «CÔNG VIỆC», vẫn GIỮ `approvals` làm mục thứ 6
✖ ĐÍCH ĐẾN: 4 mục → `WorkCenter` đúng tab; «Giao việc» → `DepartmentTaskWorkspace` (GIỮ NGUYÊN)
✖ WorkCenter TÁI DÙNG `ReportView` + `lib/report-catalog.ts` cho tab «Báo cáo»
✖ giữ nguyên hành vi 3 tab cũ
✔ «Cá nhân» và «Phòng ban» KHÔNG dùng chung cổng quyền   ← ca chỉ đọc BẢNG CHỐT nên ĐỎ/ĐỎ đều xanh
```

**XANH (mã SAU `T-01`):**

```
ℹ tests 8
ℹ pass 8
ℹ fail 0        (GREEN_EXIT=0)
```

## 7. NĂM CỔNG BẮT BUỘC — nguyên văn kết luận

| Cổng | Lệnh | Kết luận |
|---|---|---|
| 1 | `npx tsc --noEmit --incremental false` | `TSC_EXIT=0` — **0 lỗi** |
| 2 | `npm run lint` | `✖ 180 problems (0 errors, 180 warnings)` · `LINT_EXIT=0` — **0 error** (đúng nền 180 warning) |
| 3 | `npm run test:regression` | `ℹ tests 69 · pass 69 · fail 0` · `REG_EXIT=0` — **69/69, KHÔNG giảm** |
| 4 | `npm run test:workflow` | `Workflow VNTECH ERP V5.3.0 FULL W2 passed: …` · `WF_EXIT=0` — **ĐẠT** |
| 5 | `node --test tests/t01-work-menu.test.mjs` | `pass 8 · fail 0` — **tất cả ĐẠT** |

## 8. Probe tiến độ lộ trình (sau khi sửa)

`node tools/probe-roadmap-progress.mjs` (`PROBE_EXIT=0`):

```
Tổng số mục đọc được: 110
  DONE         63 / 110  (57.3%)
  BLOCKED       1 / 110  (0.9%)
  TODO         46 / 110  (41.8%)
  PHASE 3 — CÔNG VIỆC         4/10
```

Đúng kỳ vọng: **DONE 63/110 (57.3%)** · **PHASE 3 = 4/10** (TT dòng `T-01` = `**DONE**`, ô thứ 11/index 10).

## 9. Tệp đã đổi

| Tệp | Việc |
|---|---|
| `lib/menu-helpers.ts` | `+` `WorkMenuView` · `workMenuItems` (5 mục) · `legacyWorkMenuKeys` (4 khoá ẩn) |
| `app/page.tsx` | menu 5 mục (sidebar + mobile) · lọc 4 khoá cũ · cổng quyền từng mục · `workCenterViewFor` · nhánh render `WorkCenter`/`DepartmentTaskWorkspace` |
| `app/screens/WorkCenter.tsx` | 5 tab đúng thứ tự · tách form giao việc · tái dùng `ReportView` |
| `tests/t01-work-menu.test.mjs` | **mới** — hợp đồng `T-01` (8 ca) |
| `tests/t01-work-menu-probe.mjs` | **mới** — probe nhãn (7 ĐẠT), chạy tay bằng `--import tsx` |
| `docs/25_TODO_ROADMAP.md` | ô TT dòng `T-01` → `**DONE**` |
| `docs/agent-progress/MASTER_STATUS.md` | chỉ ô số: DONE `62 → 63`, `56,4 % → 57,3 %`, PHASE 3 `3/10 → 4/10` |

**KHÔNG đụng:** `scripts/**` · `drizzle/**` · `java-backend/**/migration/**` · `lib/workflow-helpers.ts` · vùng `ProjectManagement`/PR-01 · `AGENTS.md` · `docs/28_*` · mọi `.docx`/`.xlsx` · các tệp identity `VNTECH_*`/`lib/vntech-identity-data.mjs`/`drizzle/0156_*`.

## 10. UNKNOWN / cần người dùng quyết

1. **DOM chưa đo được** (bị cấm build/khởi động dịch vụ): bằng chứng hiện có là probe chạy thật + hợp đồng tầng nguồn. **Kiến nghị:** lượt build kế tiếp chạy `node tools/probe-project-screen.mjs`/mở UI và xác nhận 5 nhãn + 6 dòng nhóm «CÔNG VIỆC».
2. **`T-05`/`T-06` (phụ thuộc `T-01`) đã đủ điều kiện bắt đầu** — nhưng phần «việc cá nhân: của tôi · được giao · do tôi tạo» và «giới hạn phạm vi phòng ban» **chưa** làm ở đây (ngoài phạm vi `T-01`).
3. Tab «Giao việc» trong `WorkCenter` chỉ là **form giao việc** (bản đầy đủ vẫn ở `DepartmentTaskWorkspace` qua mục menu số 3) — nếu người dùng muốn tab này cũng là bản đầy đủ thì cần một mục riêng (ngoài `T-01`).
4. Tiêu đề màn (topbar) khi đang ở mục «Cá nhân» vẫn hiện nhãn DB `Nhiệm vụ nhân viên đang làm` (giữ nguyên hành vi cũ, không đổi tên module thật) — muốn đổi thì phải đụng tiêu đề module, ngoài phạm vi `T-01`.
