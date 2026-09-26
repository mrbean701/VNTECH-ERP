# PR-01 — ĐẶC TẢ "DANH SÁCH DỰ ÁN THÀNH TAB RIÊNG + TOOLBAR CÂN ĐỐI"

- **Ngày:** 20/09/2026 · **Trạng thái:** CODE XONG (chờ build để đo runtime) · **Nguồn:** roadmap `docs/25` + audit `docs/24` + MySQL thật + mã nguồn thật
- **Nguyên tắc (§45):** mọi kết luận dán nhãn **CONFIRMED / LIKELY / UNKNOWN**, không suy đoán.

## 1. TRACE 7 LỚP (bằng chứng thật)

| Lớp | Kết luận | Bằng chứng (đường dẫn + dòng / tên bảng) |
|---|---|---|
| **Code** | Màn "Quản lý dự án" nằm ở `app/page.tsx` — `ProjectManagement`, gồm nhánh DANH SÁCH và nhánh CHI TIẾT. **Trước `PR-01`**, danh sách và chi tiết là hai **chế độ xem** (`view: "list" \| "detail"`), KHÔNG phải tab. | `app/page.tsx:508` (state `view`), `:564` (`if (view === "list")`), `:604` (`if (!detail) { setView("list") … }`), `:615` (`TABS = ["Tổng quan","Nhân sự","Tổ đội","Kho","Ban chỉ huy"]`) — CONFIRMED |
| **DB** | Bảng thật: `projects` (11 cột: `id,code,name,status,manager_user_id,start_date,planned_end_date,created_at,updated_at,contract_no,contract_name`) · `teams` (10 cột, gồm `project_id`,`warehouse_id`,`leader_user_id`) · `team_members` (9 cột) · `user_project_scopes` (9 cột, gồm `permission`,`joined_at`,`position_name`). **KHÔNG tồn tại bảng `project_members`.** `projects` **KHÔNG có cột tiến độ** (`progress*`). | `information_schema.columns` (query đã chạy) · `information_schema.tables WHERE table_name='project_members'` = **0** · CONFIRMED |
| **API** | Bootstrap (`/api/system` action `load`) trả `projects` **chỉ dự án `status='active'`**, sắp `ORDER BY code`, **ĐÃ lọc theo phạm vi** (`user_project_scopes`; admin = toàn bộ). Bản Java phải khớp: cùng danh sách cột + `WHERE status='active' AND id IN (…)`. Action ghi: `create_project` · `update_project` · `delete_project`. | `scripts/system-route.mjs:571` + scope `:572-575` · `java-backend/infrastructure/.../BootstrapDataAdapter.java:53-56` (comment lỗi bảo mật đã sửa) · `adminProjects` (`status<>'purged'`) `BootstrapDataAdapter.java:1185-1189` · `system-route.mjs:2364/2382/2443` · CONFIRMED |
| **UI** | `ListToolbar` + `DataTable` cho danh sách; dải `.project-scope-tabs` cho chi tiết; màn do `active === "site_command"` render. Nav là nhóm cấp 1 `site_command` = **QUẢN LÝ DỰ ÁN** (`menu_group_catalog`), module con `site_command` = "Quản lý dự án". | `app/page.tsx:441` (call-site), `:567` (ListToolbar danh sách), `:615-629` (dải tab chi tiết) · `app/components/ui/ListToolbar.tsx:66-113` · `menu_group_catalog` / `module_catalog` (MySQL) · CONFIRMED |
| **Permission** | Quyền module 3 tầng: `modulePermission(data,"site_command")` → `canView/canUse/canCreate/canEdit/canApprove/canExport`; cổng màn `accessDenied` (mặc định TỪ CHỐI khi module chưa cấu hình). Dữ liệu dự án **đã bị lọc phạm vi ở backend** (`user_project_scopes`, 14 dòng: write 11 · read 1 · admin 2). Action `create_project`/`update_project`/`delete_project` đòi capability **`canUse`**. | `app/page.tsx:403` (`accessDenied`), `:439` (áp AccessDeniedPanel), `:441` (truyền `permission`) · `lib/permissions.ts:16-18` · `java-backend/.../rbac/ActionRbacRegistry.java:232` (`create_project`→`canUse`), `:262`, `:391` · MySQL `department_module_permissions` 8 dòng · `user_module_permissions` 13 dòng cho `site_command` · CONFIRMED |
| **Workflow** | **KHÔNG có workflow phê duyệt cho Dự án.** `workflow_definitions` có **4 dòng**, `module_key` = `requests` · `warehouse_receipt` · `purchasing` · `warehouse_issue` — **không có `site_command`/`projects`**. ⇒ `PR-01` không phụ thuộc workflow. | MySQL `workflow_definitions` (4 dòng) · `workflow_steps` 11 · `approval_stage_catalog` 5 · CONFIRMED |
| **Data** | `projects` **2 dòng / 2 active**: `DA-MAU-01` (3 nhân sự · 0 tổ đội · 1 kho) · `PRJ-DEMO-01` (11 nhân sự · 1 tổ đội · 2 kho) · `teams` 1 · `team_members` 6 · `user_project_scopes` 14 · kho gắn dự án 3. | MySQL `COUNT(*)` + truy vấn đếm theo dự án (đã chạy) · CONFIRMED |

### Nhãn trung thực
- **CONFIRMED:** toàn bộ bảng/cột, SQL bootstrap, dải tab 5 mục cũ, không có `project_members`, không có workflow dự án.
- **LIKELY (không phải CONFIRMED):** *ngữ nghĩa* của "thành tab riêng" trong câu chữ roadmap. Nguồn duy nhất là `docs/24 §15` mục 8 (*"Danh sách dự án + Ban chỉ huy dự án chưa tách tab"*) + tiền lệ `P-01` (*"Tách MR · PR · PO thành 3 tab riêng"* = **dải tab trong màn**). Không có tài liệu nào nói "danh sách phải là một MODULE menu riêng".
- **UNKNOWN:** không đo được ảnh chuẩn sau thay đổi cho tới khi có bản build mới (xem §4).

## 2. THAY ĐỔI ĐÃ LÀM (nhỏ, có kiểm thử)

`app/page.tsx` — **chỉ trong `ProjectManagement` + 1 dòng call-site**:

1. **Một nguồn nhãn tab:** `LIST_TAB = "Danh sách dự án"` · `DETAIL_TABS = [5 mục cũ]` · `TAB_LABELS = [LIST_TAB, ...DETAIL_TABS]`.
2. **Danh sách trở thành MỘT TAB:** bỏ state `view`, suy ra `view = tab === 0 ? "list" : "detail"`; dải tab `projectTabs` render ở **CẢ hai** chế độ xem (trước đây dải tab chỉ có ở chế độ chi tiết).
3. **Chỉ số tab chi tiết dịch 1..5** (tab 0 là danh sách); nút "Chi tiết ›" mở thẳng tab 1; nút "← Quay lại danh sách" và nhánh `!detail` đưa về `tab = 0`.
4. **Toolbar cân đối theo khuôn §5:** `count` + `total` + `unit="dự án"` (trái) ‖ `search` + `filters` + `sort` + **`actions`** (phải). Nhóm HÀNH ĐỘNG trước đây **TRỐNG** ⇒ thêm nút **`⇩ XUẤT`** (CSV đúng danh sách đang lọc).
5. **QUYỀN=CHECK:** `permission` được truyền thật vào màn (`permission={activePermission}`); nút XUẤT `disabled={!canExport}`; tab chi tiết `disabled` khi chưa chọn dự án.

**Không đổi:** DB · migration · action/API · workflow · CSS (`app/globals.css` không đụng) · dữ liệu.

## 3. KIỂM THỬ

| Cổng | Kết quả |
|---|---|
| `node --test tests/pr01-project-tabs.test.mjs` (**mới**) | **ĐỎ trước khi sửa** (7 ca fail) → **7/7 PASS** sau khi sửa |
| `npx tsc --noEmit` | **exit 0** |
| `npm test` | **61/61 PASS** + `test:workflow` **ĐẠT** |
| `tools/probe-project-screen.mjs` (đã cập nhật hợp đồng 6 tab) | **5 mục KHÔNG ĐẠT** trên bản build ĐANG PHỤC VỤ ⇒ **chứng minh bundle cũ hơn nguồn**, không phải lỗi mã (xem §4) |

Tệp kiểm thử **cố ý KHÔNG** nằm trong `package.json` ⇒ `test:regression` giữ nguyên **61** ca (đúng yêu cầu "61/61").

## 4. GIỚI HẠN ĐO ĐƯỢC (nói rõ, không tô hồng)

- Ứng dụng `:8787` / proxy `:9000` đang phục vụ **BẢN BUILD CŨ**. Bằng chứng DOM lúc chạy (20/09): dải tab trả về `["Tổng quan","Nhân sự","Tổ đội","Kho","Ban chỉ huy"]` — **5 mục**, không có tab `Danh sách dự án`, `list-toolbar-count = 0`, không có nút XUẤT.
- ⇒ **`PR-01` CHƯA được đóng.** Còn chờ: (a) captain **build lại** (`npm run build` / chu trình build), (b) chạy lại `tools/probe-project-screen.mjs` (kỳ vọng **ĐẠT**), (c) chạy `tools/probe-visual-regression.mjs` — **ảnh `02-project` SẼ LỆCH CÓ CHỦ Ý** vì màn danh sách nay có thêm dải tab; cần cập nhật ảnh chuẩn nếu ảnh lệch đúng ở `02-project`.
- `tools/probe-project-screen.mjs` đã được cập nhật theo hợp đồng mới (6 tab, tab 0 quay về danh sách, toolbar có số lượng/tìm/hành động).
