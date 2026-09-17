# PHỤ LỤC CATALOG — 12 ACTION CHỈ CÓ Ở BẢN JAVA

> Sinh ngày 17/09/2026 trong TASK-018. Đọc kèm `ACTION_CATALOG.json` và `ACTION_CATALOG.md`.

## Vì sao có phụ lục này

`ACTION_CATALOG.json` / `ACTION_CATALOG.md` được **SINH TỰ ĐỘNG** bởi
`java-backend/tools/generate-action-catalog.mjs` từ **`scripts/system-route.mjs`** (bản JS tham chiếu).
Bộ sinh **chỉ đọc nguồn JS**, nên **12 action chỉ tồn tại ở bản Java** không xuất hiện trong catalog.

Đây là **lỗ hổng TÀI LIỆU, không phải lỗ hổng bảo mật**: cả 12 action đều **đã được kiểm quyền** trong
`ActionRbacRegistry` (xem cột "Kiểm quyền" bên dưới).

## Bảng 12 action

| # | Action | Kiểm quyền trong `ActionRbacRegistry` | Ý nghĩa |
|---|---|---|---|
| 1 | `create_self_work_item` | modules: `dept_plan_tasks`, `dept_project_tasks` · capability `canUse` | Nhân viên tự tạo việc cho mình |
| 2 | `save_department_permission` | danh sách module **RỖNG** · `canUse` | Chỉ admin (cơ chế admin-guard) |
| 3 | `delete_department_permission` | danh sách module **RỖNG** · `canUse` | Chỉ admin |
| 4 | `rebuild_department_permissions` | danh sách module **RỖNG** · `canUse` | Chỉ admin |
| 5 | `save_system_level` | danh sách module **RỖNG** · `canUse` | Chỉ admin |
| 6 | `delete_system_level` | danh sách module **RỖNG** · `canUse` | Chỉ admin |
| 7 | `set_system_level_status` | danh sách module **RỖNG** · `canUse` | Chỉ admin |
| 8 | `set_user_system_level` | danh sách module **RỖNG** · `canUse` | Chỉ admin |
| 9 | `system_level_impact` | danh sách module **RỖNG** · `canView` | Chỉ admin |
| 10 | `save_workflow` | `["admin"]` · `canUse` | Chỉ admin |
| 11 | `set_workflow_status` | `["admin"]` · `canUse` | Chỉ admin |
| 12 | `delete_workflow` | `["admin"]` · `canUse` | Chỉ admin |

**Cơ chế admin-guard:** theo `RbacService.requireActionModule`, **danh sách module rỗng nghĩa là chỉ
`admin` gọi được** (đã thiết lập ở TASK-002). Vì vậy 8 action ở nhóm rỗng **không phải lỗ hổng**.

## Số đo nền (đo bằng `tools/probe-action-parity.mjs`)

| Chỉ số | Giá trị |
|---|---|
| Action trong bản JS | 174 |
| Nhánh `case` thô trong `SystemController.java` | 224 |
| Trong đó là **tên chỉ mục SQL** (KHÔNG phải action) | 38 |
| **Action thật trong Java** | **186** |
| Có ở cả hai nguồn | 174 |
| **Chỉ có ở JS (Java thiếu)** | **0** |
| **Chỉ có ở Java (thêm khi port)** | **12** (bảng trên) |
| Catalog khớp nguồn JS | **0 lệch cả hai chiều** |

## Cách giữ đồng bộ về sau

1. **Muốn biết "Java có đủ action chưa"** → so **JS ↔ Java** bằng
   `node tools/probe-action-parity.mjs`. **ĐỪNG** so catalog ↔ Java (hai nguồn khác nhau).
2. **ĐỪNG đếm `case` bằng regex thô** trong `SystemController.java`: có **38 tên chỉ mục SQL** nằm
   trong một `switch` khác sẽ bị tính nhầm thành action.
3. **Thêm action mới cho Java** → phải đồng thời:
   * khai báo trong `ActionRbacRegistry` (kèm module **hoặc** để rỗng nếu cố ý chỉ admin), và
   * nếu muốn catalog ghi lại thì **sửa bộ sinh cho biết cả nguồn Java** — hiện bộ sinh chỉ đọc JS.

## Nguồn

* TASK-018 — `docs/agent-progress/TASK-018.md` (điều tra và đính chính báo cáo audit)
* Mục **ĐÍNH CHÍNH** ở cuối `docs/24_SYSTEM_AUDIT_REPORT.md`
