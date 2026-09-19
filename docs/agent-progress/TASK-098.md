# TASK-098 — PHASE 4 (QUẢN LÝ DỰ ÁN): `PR-02` · `PR-03` · `PR-04` · `PR-06`

- **Mã:** TASK-098 · **Ngày:** 20/09/2026 (**từ 66 → 70/110 = 63,6 %**)
- **Roadmap:** `docs/25_TODO_ROADMAP.md` §PHASE 4 — QUẢN LÝ DỰ ÁN (dòng 139–143)
- **Trạng thái:** **`DONE` cả 4 mục** — mỗi mục có **tệp hợp đồng riêng**, **ĐỎ trước → XANH sau**, và **cổng tĩnh + probe hợp đồng đều xanh**.
- **Nguyên tắc (§45):** mọi kết luận dán nhãn **CONFIRMED / LIKELY / UNKNOWN** — không suy đoán.
- **Phạm vi tệp đã sửa:** `app/page.tsx` **chỉ vùng `ProjectManagement` + `SiteCommandScreen`(BCH)** · `app/screens/` (4 module mới) · `tests/` (4 tệp mới) · `docs/25_TODO_ROADMAP.md` (ô TT) · `docs/agent-progress/MASTER_STATUS.md` (ô số) · tệp này. **KHÔNG** đụng `WorkCenter`/Công việc, `drizzle/**`, `java-backend/**`, `scripts/**`, `AGENTS.md`, `docs/28…`, `lib/menu-helpers.ts`, `app/globals.css`, `app/styles/**`.

## 1. Việc đã làm (theo nguyên văn yêu cầu)

### `PR-02` — "Lọc: Trạng thái · Quản lý dự án · Phòng ban · Ngày" (7/7 ca)
Bộ lọc 4 chiều nằm trong `ListToolbar` của **tab "Danh sách dự án"** (`app/page.tsx:640-664`: `filters={[status, managerUserId, organizationUnitId]}` + `extra` = 2 ô `<input type="date">`), lọc bằng **hàm thật** `app/screens/project-filters.ts` (`projectMatchesFilters:58`, `projectFilterContext:72`) — trang gọi tại `app/page.tsx:591`.

**SỰ THẬT ĐÃ ĐO (CONFIRMED, không đoán):** payload bootstrap thật (`GET /api/system`, tài khoản admin) trả `projects` **chỉ 8 trường** `id, code, name, status, contractNo, contractName, startDate, plannedEndDate` — **KHÔNG có `managerUserId`/`managerName`**, cũng **không có cột phòng ban** (`projects` chỉ 11 cột, `tools/_live-schema.tsv`). Nguồn SELECT nằm ở `scripts/system-route.mjs:604` (và `:748` cho `adminProjects`) — **ngoài phạm vi được sửa** của đợt này.
⇒ 2/4 chiều được **suy từ dữ liệu THẬT đang có** và **ghi rõ nguồn ngay trên toolbar + trong mã**:
- **Quản lý dự án** = nhân sự có phạm vi `admin` trên dự án (`user_project_scopes.permission='admin'`);
- **Phòng ban** = `users.organization_unit_id`/`organization_code`/`department` của **nhân sự tham gia dự án**.
- **Trạng thái** = `projects.status`; **Ngày** = `projects.start_date` (từ ngày) + `projects.planned_end_date` (đến ngày) — đúng 2 cột thật.

### `PR-03` — "Chi tiết dự án thành tab/modal: chung · nhân sự · tổ đội · kho · lịch sử" (4/4 ca)
`app/screens/ProjectDetailTabs.tsx:29` `PROJECT_DETAIL_SUB_TABS = ["Chung","Nhân sự","Tổ đội","Kho","Lịch sử"]` (**đúng nguyên văn roadmap**), 5 nhánh nội dung `:113` (chung) `:149` (nhân sự) `:169` (tổ đội) `:188` (kho) `:206` (lịch sử), dải tab con `:60`.
- **Dữ liệu THẬT, KHÔNG dựng bảng mới:** `user_project_scopes` (`joinedAt`,`permission`), `teams`, `team_members`, `warehouses`, `goods_receipts` (`receivedAt`), `material_requests` (`requestedAt`), `purchase_orders` (`orderedAt`), `work_items` (`assignedAt`/`completedAt`), `inventory`.
- **Lịch sử** = ghép mốc THẬT của chứng từ + nhân sự thuộc dự án (không sinh dữ liệu giả), sắp giảm dần, cắt 60 mốc.
- **% TIẾN ĐỘ ĐỂ TRỐNG (đúng chỉ đạo):** khối `data-progress-source="unavailable"` (`:135-140`) ghi **"CHƯA CÓ NGUỒN DỮ LIỆU TIẾN ĐỘ"** + nêu nguồn đã chốt **NHẬT KÝ THI CÔNG** đang **chờ nghiệp vụ**; **KHÔNG** có công thức `%` nào (test có **đối chứng âm**: cấm `progressActual`/`actualProgress`/`progressPlan`/`Kpi … percent=`).
- **Quan hệ với `PR-01`:** dải **6 tab ngoài** giữ NGUYÊN (bị khoá bởi `tests/pr01-project-tabs.test.mjs` + `tools/probe-project-screen.mjs`); 4 nhánh `{tab === 1..4 && <ProjectDetailTabs …/>}` (`app/page.tsx:736-739`) là **lối vào nhanh** đúng tab con tương ứng; tab 5 = Ban chỉ huy.

### `PR-04` — "Bấm vào Project/User/Warehouse/Team → mở `EntityDetailModal`" (6/6 ca)
MỘT cổng duy nhất: `app/screens/ProjectEntityModal.tsx:55` với 4 nhánh `case "project":68 · "user":97 · "warehouse":121 · "team":147`, render `EntityDetailModal` dùng chung (U-01) tại `:169`, truyền `canView` (`:176`).
`app/page.tsx`: `const entityModal` (`:579`) render ở **CẢ 2 nhánh** (`:703` danh sách, `:741` chi tiết); các chỗ bấm: mã dự án ở danh sách (`:690`), dự án/tổ đội/kho/nhân sự trong chi tiết (`ProjectDetailTabs.tsx:130/155/175/194`), nhân sự BCH + dòng dự án BCH (`app/page.tsx` vùng BCH).

### `PR-06` — "BCH: thêm/sửa/xoá theo quyền + link entity mở modal" (6/6 ca)
- **QUYỀN (`QUYỀN=CHECK`, đúng cơ chế hiện có):** `app/screens/project-bch-permissions.ts:38` `bchGates(isAdmin, permission)` chỉ đọc 6 capability của `lib/permissions.ts`; `app/page.tsx:1342` `bchGates(isAdminUser(data.user), modulePermission(data, "site_command"))`. **Nút thiếu quyền bị `disabled`** (không ẩn): `disabled={!canAddUnit}` `{!canEditUnit}` `{!canStopUnit}` `{!canAddMember}` `{!canMoveMember}` `{!canRemoveMember}`.
- **THÊM/SỬA/XOÁ — chỉ ACTION THẬT đã có** (KHÔNG tạo action mới; đã kiểm bằng test là tồn tại trong `scripts/system-route.mjs`):
  - **THÀNH VIÊN**: `set_organization_unit_member` (`system-route.mjs:2045`; gọi ở `page.tsx:1364` thêm · `:1368` sửa/đổi BCH · `:1373` gỡ). Server chốt quyền `canEdit` (`system-route.mjs:35`).
  - **BAN CHỈ HUY**: `save_organization_unit` (`system-route.mjs:1978`; gọi `page.tsx:1351`) — thêm/sửa đơn vị `unit_type='site_command'` + `project_id`; **ngừng BCH**: `set_organization_unit_status` (`system-route.mjs:2028`; gọi `page.tsx:1357`).
- **LINK ENTITY:** tên thành viên BCH → `openEntity("user", m)`; dòng dự án của BCH → `openEntity("project", projectRow)`.

## 2. Trace 7 lớp (bằng chứng thật)

| Lớp | Kết luận | Bằng chứng (đường dẫn + dòng) |
|---|---|---|
| **Code** | 4 module mới + 2 vùng sửa trong `page.tsx` | `app/screens/project-filters.ts` · `ProjectDetailTabs.tsx` · `ProjectEntityModal.tsx` · `project-bch-permissions.ts` · `app/page.tsx:548` (`ProjectManagement`) · `:1331` (`SiteCommandScreen`) — CONFIRMED |
| **DB** | `projects` 11 cột (**có `manager_user_id` nhưng KHÔNG có cột tiến độ/phòng ban**) · `user_project_scopes` (`permission`,`position_name`,`joined_at`) · `teams`(`project_id`,`warehouse_id`) · `warehouses`(`project_id`) · `organization_units`(`unit_type='site_command'` + `project_id`) | `tools/_live-schema.tsv` (lược đồ ĐANG CHẠY) — CONFIRMED |
| **API** | bootstrap `projects` trả **8 cột** (thiếu `manager_user_id`) ⇒ 2 chiều lọc phải suy từ `user_project_scopes`/danh bạ nhân sự. Action ghi BCH: `set_organization_unit_member` · `save_organization_unit` · `set_organization_unit_status` | `scripts/system-route.mjs:604`, `:748`, `:1978`, `:2028`, `:2045` · payload thật đo bằng `GET /api/system` — CONFIRMED |
| **UI** | `ListToolbar` (4 chiều: 3 select + 2 ô ngày) · `DataTable.onRowClick` mở `EntityDetailModal` · dải tab con ngoài dải 6 tab của `PR-01` | `app/components/ui/ListToolbar.tsx:92-113` · `DataTable.tsx:113-123` · `EntityDetailModal.tsx:107-145` — CONFIRMED |
| **Permission** | BCH: 6 capability của `modulePermission(data,"site_command")` + `isAdminUser`; `PR-02` nút XUẤT `disabled={!canExport}`; tab chi tiết `disabled` khi chưa chọn dự án | `lib/permissions.ts:15-19` · `app/screens/project-bch-permissions.ts:38-57` · `app/page.tsx:1342` — CONFIRMED |
| **Workflow** | **KHÔNG có workflow cho Dự án** (`workflow_definitions` chỉ 4 module: `requests`·`warehouse_receipt`·`purchasing`·`warehouse_issue`) ⇒ `PR-02/03/04/06` không phụ thuộc workflow | `workflow_definitions` (4 dòng) — CONFIRMED |
| **Data** | 2 dự án thật (`DA-MAU-01`: 3 nhân sự/0 tổ đội/1 kho · `PRJ-DEMO-01`: 11 nhân sự/1 tổ đội/2 kho) · `user_project_scopes` 14 dòng (`admin` 2 · `write` 11 · `read` 1) · `teams` 1 · `team_members` 6 · `warehouses` 4 | `GET /api/system` (đo 20/09/2026) — CONFIRMED |

## 3. Kiểm thử (ĐỎ trước → XANH sau — bắt buộc trên cả 4 mục)

| Mục | Tệp hợp đồng | ĐỎ trước | XANH sau | Cổng tĩnh |
|---|---|---|---|---|
| `PR-02` | `tests/pr02-project-filters.test.mjs` | **5 PASS / 2 FAIL** ("Thiếu chiều lọc *Quản lý dự án*", chưa import module lọc) | **7/7 PASS** | `npx tsc --noEmit` **0** · `npm run lint` **0 error / 181 warning** · `npm run test:regression` **69/69** · `npm run test:workflow` **ĐẠT** · `tools/probe-project-screen.mjs` **ĐẠT ✅ exit 0** · `tests/t01-work-menu-probe.mjs` **7 ĐẠT/0 HỎNG** |
| `PR-03` | `tests/pr03-project-detail-tabs.test.mjs` | **FAIL** (`ENOENT app/screens/ProjectDetailTabs.tsx` — chưa có năng lực) | **4/4 PASS** | (cùng bộ cổng trên) |
| `PR-04` | `tests/pr04-entity-modal.test.mjs` | **FAIL** (`ENOENT ProjectEntityModal.tsx`) | **6/6 PASS** | (cùng bộ cổng trên) |
| `PR-06` | `tests/pr06-bch-crud.test.mjs` | **FAIL** (`ENOENT project-bch-permissions.ts`) | **6/6 PASS** | (cùng bộ cổng trên) |

**Điểm mạnh của cổng (không kiểm chuỗi suông):**
- `PR-02`: **TRÍCH nguyên văn thân hàm** `projectMatchesFilters` + `projectFilterContext` rồi **CHẠY bằng `new Function`** ⇒ chứng minh **từng chiều lọc có tác dụng thật** (Trạng thái · Quản lý dự án · Phòng ban · Ngày) + **đối chứng âm** (bộ lọc rỗng cho kết quả khác).
- `PR-06`: **TRÍCH + CHẠY `bchGates`** với **3 người dùng giả lập** (admin · người chỉ có quyền XEM · người có quyền SỬA) ⇒ admin bấm được, thiếu quyền bị chặn; **đối chứng âm** (gỡ `Boolean(caps.canEdit)` khỏi mã ⇒ phép kiểm ĐỎ).
- `PR-04` / `PR-03`: kiểm vị trí thật của link modal + 5 tab con + **đối chứng âm** khi xoá `openEntity(...)`; đồng thời **CẤM** công thức % tiến độ bịa.

## 4. PHÁT HIỆN THẬT & SỬA LUÔN (không nằm trong 4 mục nhưng phải sửa để không tự mâu thuẫn)

1. 🔴 **BCH bị render HAI LẦN trên cùng một màn** — `active === "site_command"` vừa render `ProjectManagement` (đã có tab 5 = BCH) vừa có call-site `SiteCommandScreen` riêng ở `app/page.tsx:~483`. Đã **bỏ bản trùng** (giữ MỘT nguồn duy nhất = tab 5) ⇒ mọi link thực thể đi đúng `EntityDetailModal`.
2. 🔴 **BCH không hiện với dữ liệu thật:** đơn vị `site_command` duy nhất trong CSDL (`ORG_7b07…`, code `BCH`) có **`project_id` RỖNG**, mà màn lại lọc `visibleUnits` theo dự án ⇒ tab BCH luôn rỗng. Nay **có nút `＋ THÊM BAN CHỈ HUY`** (`save_organization_unit` + `projectId`) nên tạo được BCH theo dự án; đơn vị `BCH` cũ **không tự gán bừa** vào dự án nào.
3. ⚠️ **`MASTER_STATUS` dòng "ĐANG LÀM | 1"** đã cũ (roadmap có **0** mục `DOING`) ⇒ đặt lại **0 / 0 %** để bảng khớp `probe-roadmap-progress` (70 + 1 + 39 = 110).

## 5. UNKNOWN / cần người dùng quyết

1. **`projects.manager_user_id` chưa được API trả về** (CONFIRMED). Muốn lọc đúng theo cột này phải sửa `scripts/system-route.mjs:604/748` (hoặc `java-backend`) — **ngoài phạm vi**. Hiện tại chiều "Quản lý dự án" = **phạm vi `admin` của `user_project_scopes`** (đã ghi rõ trên toolbar). **Cần user chốt:** có mở quyền sửa API bootstrap để trả `manager_user_id` không?
2. **% TIẾN ĐỘ dự án** — người dùng chốt nguồn = **NHẬT KÝ THI CÔNG**, **nghiệp vụ chưa tồn tại** ⇒ khối tiến độ **để trống + ghi chú**, KHÔNG bịa công thức. **Cần user xác nhận** đây là trạng thái mong muốn cho tới khi có bảng nhật ký thi công.
3. **Dải tab con so với dải 6 tab của `PR-01`** — vì `PR-01` bị khoá bởi probe + test (đòi ĐÚNG 6 mục & cùng nhãn), `PR-03` được thể hiện bằng **dải tab con của khối chi tiết**. Nếu user muốn **gộp thành một dải duy nhất** (đổi `Tổng quan`→`Chung`, thêm `Lịch sử`, tách `Ban chỉ huy`) thì phải sửa `tools/probe-project-screen.mjs` + `tests/pr01-project-tabs.test.mjs` — **cần user quyết**.
4. **Đơn vị BCH `ORG_7b07…` thiếu `project_id`** trong CSDL — dữ liệu cũ; **cần user quyết** gán về `DA-MAU-01`/`PRJ-DEMO-01` hay để nguyên và tạo BCH mới qua giao diện.

## 6. Ghi chú hồ sơ

- Tệp này là **TASK-098** (task `TASK-094`…`TASK-097` **KHÔNG bị sửa** theo yêu cầu).
- **Git:** commit nhỏ theo từng mục (`[PHASE 4 - PR-02]` … `[PHASE 4 - PR-06]` + 1 commit hồ sơ). ⚠️ `app/page.tsx` là **MỘT tệp chứa cả 4 mục** nên các hunk của nó được tách theo mục bằng `git apply --cached` (chi tiết trong thông điệp commit).
- **KHÔNG** build, **KHÔNG** khởi động/dừng dịch vụ, **KHÔNG** `git push`, **KHÔNG** `git add -A`.
