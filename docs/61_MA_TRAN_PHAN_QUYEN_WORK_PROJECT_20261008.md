# MA TRẬN PHÂN QUYỀN — NHÓM **WORK** & **PROJECT** (đo thật, 08/10/2026)

Phiên soạn: **`ERP-SESSION-04`** (`SESSION_D`) · Trạng thái: **ĐÃ ĐO — ⏳ chờ 3 quyết định nghiệp vụ**
Nguồn sự thật: ① `ActionRbacRegistry.java` (module/capability **đang cưỡng chế**) · ② `scripts/system-route.mjs` (route JS + `ACTION_MODULE`/`ACTION_CAPABILITY`) · ③ `SystemController.java` (action đã port Java) · ④ **CSDL THẬT** `module_catalog` (**76 khoá**, đo qua bootstrap) · ⑤ `java-backend/ACTION_CATALOG.md` (bản kiểm kê **sinh từ JS** — ⛔ có hợp đồng riêng, xem §4)

---

## 1. MA TRẬN **WORK** (8 action) — đo thật

| Action | Module (Java — đang cưỡng chế) | Capability | Có ở JS | Có ở Java | Vai trò CRUD | Ghi chú |
|---|---|---|---|---|---|---|
| `create_work_item` | `dept_plan_assign`, `dept_project_assign` | `canCreate` | ✅ | ✅ | **C** | ✅ đúng |
| `create_self_work_item` | `dept_plan_tasks`, `dept_project_tasks` | `canUse` | ⛔ | ✅ | **C** (tự tạo) | ⚠️ **Java-only** ⇒ ⛔ không có trong route JS/`ACTION_CATALOG` (⚠️ theo hợp đồng, §4) |
| `update_work_item_progress` | `dept_plan_tasks`, `dept_project_tasks` | `canEdit` | ✅ | ✅ | **U** | ✅ đúng |
| `update_work_item_status` | `dept_plan_tasks`, `dept_project_tasks`, `dept_plan_assign`, `dept_project_assign` | **`canEdit`** | ✅ | ✅ | **U + Duyệt(COMPLETED) + Từ chối(REWORK)** | 🟠 **«Duyệt» dùng `canEdit`, ⛔ không phải `canApprove`** — xem §3 Q2 |
| `reassign_work_item` | `dept_plan_assign`, `dept_project_assign` | `canEdit` | ✅ | ✅ | **U** (đổi người) | ✅ đúng |
| `add_work_item_comment` | `dept_plan_tasks`, `dept_project_tasks`, `dept_plan_assign`, `dept_project_assign` | `canUse` | ✅ | 🔴 **⛔ KHÔNG** | **U** (nhận xét) | 🔴 **trên bản chạy (Java) gọi sẽ 400** ⇒ đúng lý do nút «Nhận xét» tạm ẩn (`docs/57 §4.4` có mã port dán sẵn) |
| `set_work_item_participant` | `dept_plan_assign`, `dept_project_assign` | `canEdit` | ✅ | 🔴 **⛔ KHÔNG** | **U** (người tham gia) | 🔴 **như trên** |
| `mark_task_notification_read` | `dept_plan_tasks`, `dept_project_tasks` | `canView` | ✅ | ✅ | **R** | ✅ đúng |
| **(D — xoá)** | — | — | — | — | ⛔ **không có action xoá** | ⭐ **theo thiết kế**: huỷ việc = `update_work_item_status` → `CANCELLED` ✅ |

## 2. MA TRẬN **PROJECT** (7 action) — đo thật

| Action | Module (Java) | Capability | JS | Java | Vai trò | Ghi chú |
|---|---|---|---|---|---|---|
| `create_project` | 🔴 **RỖNG** | `canUse` | ✅ | ✅ | **C** | 🔴 **⛔ KHÔNG có trong ma trận ⇒ ⛔ không thể cấp cho ai** (chỉ lọt qua «admin/lãnh đạo») |
| `update_project` | 🔴 **RỖNG** | `canUse` | ✅ | ✅ | **U** | 🔴 như trên |
| `delete_project` | 🔴 **RỖNG** | `canUse` | ✅ | ✅ | **D** | 🔴 như trên |
| `bulk_import_projects` | 🔴 **RỖNG** | `canUse` | ✅ | ✅ | **C** (hàng loạt) | 🔴 như trên (**đã vào `ADMIN_ONLY_ACTIONS` ✅**) |
| `create_project_team` | ✅ `site_command` | `canUse` | ✅ | ✅ | **C** (tổ đội) | ⭐ **đã vào ma trận** ⚠️ nhưng `ACTION_CATALOG.md` ghi **RỖNG ⇒ TÀI LIỆU STALE** |
| `set_project_team_status` | 🔴 **RỖNG** | `canUse` | ✅ | ✅ | **U** (ngừng/khôi phục) | ⚠️ **cố ý admin-only** theo `TM-04` (route JS = `requireRole(["admin"])`) |
| `delete_project_team` | 🔴 **RỖNG** | `canUse` | ✅ | ✅ | **D** (tổ đội) | ⚠️ **cố ý admin-only** theo `TM-04` |
| **(Approve)** | — | — | — | — | ⛔ **không có action phê duyệt DỰ ÁN** | ⚠️ dự án không có luồng duyệt riêng (duyệt nằm ở `approvals`/chứng từ ✅) |

## 3. ⚠️ PHÁT HIỆN & **3 QUYẾT ĐỊNH** — ⭐ TRẠNG THÁI CẬP NHẬT 08/10/2026

> **CẬP NHẬT (vòng 81–82, `ERP-SESSION-04`)**: **Q2 ✅ ĐÓNG** · **Q3 ✅ ĐÓNG** · **Q1 🛑 ĐANG CHỜ — CÓ SỐ ĐO MỚI LÀM THAY ĐỔI CÂU TRẢ LỜI**.

### Q1 — **Dự án: `create_project` / `update_project` / `delete_project` cấp cho AI?** 🛑 **CHỜ USER QUYẾT LẠI (có số đo mới)**
Hiện trạng ĐO ĐƯỢC (2 đường): **cả 3 action đều `requireRole(user, ["admin"])` NGAY DÒNG ĐẦU của handler**
(`scripts/system-route.mjs:2519` · `:2547` · `:2608`) · registry Java = `List.of()` (⛔ không gắn module) ⇒ **admin-only** trên cả 2 đường (⚠️ Java còn lọt `director`/`accountant` qua nhánh học-vị).

> 🔴 **SỐ ĐO MỚI LÀM PHƯƠNG ÁN (c) ĐỔI BẢN CHẤT** — ĐO trên CSDL thật: khoá `dept_project_plan` (khoá mà (c) định dùng) đang có **`can_create=1` ở 8/8 ĐƠN VỊ** và **42 TÀI KHOẢN** đã có `can_create=1`; `project_progress`/`site_command`/`dept_project_tasks` **cũng 8/8 đơn vị `can_create=1`**.
> ⇒ Thi hành (c) **theo nghĩa đen** = mở quyền tạo dự án cho **42 tài khoản** (hiện chỉ admin) ⇒ ⚠️ **NỚI QUYỀN RẤT LỚN** giữa golive, ⛔ không phải «chỉ Phòng Dự án» như tên module gợi ý (mẫu quyền phòng ban là **dùng chung 8×60**, ⛔ không phân biệt phòng).

| Phương án (CHỌN LẠI) | Cách làm | Hệ quả ĐO ĐƯỢC |
|---|---|---|
| **(A1) Giữ admin-only** ⭐ *(an toàn nhất — đề xuất)* | Thêm **cả 3** action vào `ADMIN_ONLY_ACTIONS` (như `P-08`) | ✅ Siết đúng bằng route JS · ✅ chặn luôn `director`/`accountant` đi lọt trên Java · ⛔ ma trận ⛔ không cấp được CRUD dự án |
| **(A2) Mở ĐÚNG Phòng Dự án** *(đúng ý «(c)» nhưng phải sửa DỮ LIỆU)* | `create_project`→`dept_project_plan`+`canCreate` · `update_project`→`+canEdit` · **KÈM** đặt `can_create=0` cho **7 đơn vị còn lại** ở `department_module_permissions` **VÀ** `can_create=0` cho **42 dòng `user_module_permissions`** | ⭐ **ĐÃ ĐO LẠI (08/10, phiên 04) — TÁC ĐỘNG HẸP HƠN LO NGẠI**: khoá `dept_project_plan` ⛔ **KHÔNG được action nào dùng làm cổng** (ĐO: **0 lần** trong `ActionRbacRegistry.java`; 1 lần trong JS chỉ là **danh sách khoá** `MODULE_KEYS:14`, ⛔ không gác action) ⇒ gắn nó cho `create_project` **⛔ không làm action nào khác đổi quyền** ✅ · ⚠️ **NHƯNG vẫn phải sửa dữ liệu 42 tài khoản** (nếu không ⇒ **42 TK tạo được dự án**) ⇒ chi phí/rủi ro nằm ở **DỮ LIỆU**, ⛔ không ở mã |
| **(A3) Khoá riêng cho CRUD dự án** *(sạch nhất, giống cách đã làm cho WORK)* | Tạo **1 khoá module mới** (vd `project_admin`) + cấp **theo NGƯỜI** qua ma trận; `create/update` → khoá đó (`canCreate`/`canEdit`); `delete_project` → **admin-only** | ✅ Admin quyết định ai tạo/sửa dự án (⛔ không phụ thuộc mẫu phòng ban) · ✅ ⛔ không đụng 42 dòng quyền hiện có · ⚠️ cần 1 migration + đồng bộ 2 đường (như `V40`) |

### Q2 — **«Duyệt xong» (COMPLETED) của CÔNG VIỆC: `canEdit` hay `canApprove`?** ✅ **ĐÓNG — user chốt (b)**
✅ **ĐÃ THI HÀNH**: tách action **`approve_work_item`** với capability **`canApprove`** (⛔ dùng chung thân xử lý ⇒ **0 dòng dịch** trên 2 tệp bị cổng `F-03` khoá) · FE gọi đúng action theo trạng thái · ➕ ⭐ **BÙ HỒI QUY ĐO ĐƯỢC** (`BUG-D18`): 4 khoá WORK cũ có `can_approve=0` ở BCH·DA·HCPC·KH·TCKT ⇒ tách action xong thì **quản lý phòng bị 403** ⇒ đã cấp `can_approve=1` trên khoá `work` cho **đúng 3 tài khoản `%_truong`** (`V40` §3) ⇒ **khôi phục đúng hành vi cũ**, ⛔ không mở cho nhân viên.

### Q3 — **Port 2 action WORK sang Java?** ✅ **ĐÓNG HẲN — user chốt (a), `ERP-SESSION-01` đã thi hành + `VERIFIED` LIVE**
`add_work_item_comment` + `set_work_item_participant` nay **ĐÃ CÓ** trên Java (`SystemController.java:1510` · `:1515`, capabilities `canUse`/`canEdit` trong registry) và **đo LIVE `:18081` = HTTP 200** (đối chứng âm ẩn danh = **401**) ⇒ `probe-action-parity` báo **«Action của JS mà Java THIẾU: 0»** = ⭐ **PARITY JS↔JAVA HOÀN TẤT**.
➡️ **Việc còn lại (⛔ không phải của Q3)**: đảo cổng canary **`COMMENTS_READY=false`** để **hiện nút «Nhận xét»** — đã ghi `HANDOFF-20261008-D12` → `ERP-SESSION-03` (đúng luật dự án `docs/55:205`).

## 4. ⚠️ VỀ `ACTION_CATALOG.md/json` — **⛔ KHÔNG sửa** (đã có chốt của dự án)
> `TASK-022b` (**đã ĐÓNG**): *«`ACTION_CATALOG` **CÓ HỢP ĐỒNG là "sinh từ nguồn JS"** và đang đúng (174 mục, khớp JS 0 lệch); 12 action Java-only **⛔ ĐÚNG LÀ không thuộc danh mục**. **Thêm vào sẽ TẠO SAI LỆCH GIẢ** và **phá cổng** `probe-action-parity` / `probe-catalog-drift` (cả hai đang xanh).»*
⇒ ⭐ Vì vậy: **⛔ KHÔNG thêm** `create_self_work_item` hay action Java-only nào vào `ACTION_CATALOG` ✅. **Ma trận phân quyền ĐÚNG cần bổ sung = ma trận TRONG ỨNG DỤNG** (`module_catalog` × 6 quyền) + **ánh xạ action→module trong `ActionRbacRegistry`** ✅.

## 5. BẰNG CHỨNG ĐO ĐƯỢC (chạy lại được)
```powershell
node docs\dsh-mutil-session\SESSION_D\probes\audit-work-project-matrix.mjs .        # đối chiếu 4 nguồn
node docs\dsh-mutil-session\SESSION_D\probes\audit-matrix-modules.mjs http://127.0.0.1:9000   # module_catalog THẬT (76 khoá)
```
* ✅ **`module_catalog` = 76 khoá**, **TẤT CẢ** module Work/Project **đều có mặt** (`dept_plan_tasks` · `dept_project_tasks` · `dept_plan_assign` · `dept_project_assign` · `dept_project_plan` · `project_progress` · `dept_project_pda` · `site_command`) ⇒ ⭐ **ma trận module ⛔ không thiếu gì** — **thiếu ở ÁNH XẠ action→module** ✅
* 6 quyền của ma trận: `canView`(Xem) · `canUse`(Thao tác) · `canCreate`(Tạo) · `canEdit`(Sửa) · `canApprove`(Duyệt) · `canExport`(Xuất) — ⛔ **không có `canDelete`** ⇒ ⭐ **quy ước dự án: XOÁ = `canEdit`** (tiền lệ `delete_project_contract → boq + canEdit` ✅)
