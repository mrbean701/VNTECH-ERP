# MT2-P4-04 — AUDIT 5 BẢNG ROLE / LEVEL (nhóm quyền · phạm vi · cấp bậc)

> Ngày đo: **25/09/2026** · Nguồn số liệu: **MySQL thật** `vntech_erp` (`127.0.0.1:3306`, user `vntech`) — ⛔ KHÔNG dùng mock, ⛔ KHÔNG suy diễn.
> Schema đọc từ `java-backend/infrastructure/src/main/resources/db/migration/V1__baseline.sql`.
> Nguyên tắc của task: **mở rộng ĐÚNG CHỖ, ⛔ KHÔNG tạo cơ chế quyền mới** — báo cáo này chỉ ĐO và ÁNH XẠ, không đề xuất hệ thống song song.

---

## 1. Số liệu THẬT (đo bằng `SELECT COUNT(*)` trên MySQL)

| # | Bảng | Số dòng | Ghi chú đo được |
|---|---|---|---|
| 1 | `role_catalog` | **16** | 16/16 `active=1` |
| 2 | `business_role_engine_catalog` | **9** | 9/9 `active=1` (9 mã engine) |
| 3 | `business_role_group_catalog` | **11** | 11/11 `active=1` |
| 4 | `business_role_group_scopes` | **2** | ⚠️ gần như RỖNG — xem Phát hiện F1 |
| 5 | `user_module_permissions` | **1403** | `can_view=1` ở **1400** dòng (3 dòng bị tắt) · **61 module** · **49 user** |
| 6 | `user_project_scopes` | **19** | **15 user** có phạm vi dự án |
| 7 | `user_warehouse_scopes` | **12** | **4 user** có phạm vi kho |
| 8 | `system_level_catalog` (nguồn CẤP BẬC) | **5** | `nhan_vien`=10 · `truong_nhom`=20 · `truong_phong`=30 · `giam_doc`=40 (`auto_grant_all=1`) · `tong_giam_doc`=50 (`auto_grant_all=1`) |

### 1.1 `role_catalog` — 16 vai trò chuẩn và `base_role` (mã ENGINE)

| code | base_role | business_group_id | warehouse_scope_kind |
|---|---|---|---|
| accountant | accountant | – | – |
| cht | commander | – | – |
| commander | commander | – | – |
| da_nv | project | – | – |
| da_truong | project | – | – |
| director | director | – | – |
| engineer | engineer | – | – |
| kh_nv | procurement | – | – |
| kh_truong | procurement | – | – |
| ksda | engineer | – | – |
| procurement | procurement | – | – |
| project | project | – | – |
| team | team | – | – |
| thu_kho | warehouse | – | – |
| thuky | director | – | – |
| warehouse | warehouse | – | – |

⚠️ Ánh xạ **NHIỀU-VỀ-MỘT** là chủ ý (đã ghi trong `RbacService.requireRole`): `cht→commander` · `da_nv`/`da_truong→project` · `kh_nv`/`kh_truong→procurement` · `thu_kho→warehouse` · `ksda→engineer` · `thuky→director` ⇒ vì vậy `requireRole` phải so **CẢ** `user.role()` **VÀ** `user.roleBase()`.

### 1.2 `business_role_engine_catalog` (9 mã engine) và `business_role_group_catalog` (11 nhóm)

| engine_key | display_name | ← nhóm `business_role_group_catalog` |
|---|---|---|
| accountant | Kế toán / Tài chính | accountant |
| admin | Quản trị hệ thống | admin |
| commander | Chỉ huy trưởng | commander |
| director | Ban giám đốc | director · **hcpc→director** |
| engineer | Kỹ sư công trường | engineer |
| procurement | KH-MH | procurement |
| project | Phòng Dự án | project |
| team | Tổ đội | team |
| warehouse | Thể kho | warehouse · **kho_tong→warehouse** |

⇒ 11 nhóm trỏ về **9 engine** (2 nhóm gộp: `hcpc`, `kho_tong`) — **khớp** với bảng ánh xạ `base_role` ở §1.1 (⛔ không có engine nào ngoài 9).

---

## 2. Bảng ánh xạ: KHÁI NIỆM → BẢNG → NƠI THI HÀNH

| Khái niệm | Bảng (nguồn sự thật) | Mã đọc/ghi | Điểm THI HÀNH (backend) |
|---|---|---|---|
| **Vai trò chuẩn** | `role_catalog.code` | `UserAdminStoreAdapter.roles()`, `UserManagementUseCase` | `AuthUseCase.CurrentUser.role()` → `RbacService.requireRole` |
| **Vai trò ENGINE** | `role_catalog.base_role` | `roleBase` trong payload đăng nhập | `RbacService.requireRole` (so cả `role()` và `roleBase()`) |
| **Nhóm nghiệp vụ** | `business_role_group_catalog` (code → `engine_role`) | `UserAdminStoreAdapter`, màn Quản trị | chỉ dùng để GOM nhóm hiển thị — quyền vẫn qua `base_role` |
| **Nhóm ↔ phạm vi** | `business_role_group_scopes` | (2 dòng) — ⚠️ xem F1 | ⛔ chưa có điểm thi hành nào đọc bảng này |
| **Quyền theo MODULE** | `user_module_permissions` (`can_view/can_use/can_create/can_edit/can_approve/can_export`) | `ModulePermissionStore.canUseModule` | `RbacService.requireActionModule` + `ActionRbacRegistry` (module + capability) |
| **Phạm vi DỰ ÁN** | `user_project_scopes.permission` (`read`/`write`/…) | `AccessScopeStoreAdapter`, `ProjectScopeStoreAdapter`, `RequestStoreAdapter`, `OpsTaskStoreAdapter` | `AccessScopeService` (`canAccessProject`), bootstrap lọc dự án, giao việc |
| **Phạm vi KHO** | `user_warehouse_scopes.permission` | `AccessScopeStoreAdapter`, `BootstrapDataAdapter` | `AccessScopeService.canAccessWarehouse` (write ⇒ cần `write/approve/admin`) |
| **CẤP BẬC** | `system_level_catalog.level_rank` | `BootstrapDataAdapter`, `OpsTaskStoreAdapter.levelRank` | §4.1: `admin OR level_rank >= 30` cho vùng duyệt + `director_pending_approvals` (403 nếu < 30) |

---

## 3. Phát hiện (chỉ ghi cái ĐO ĐƯỢC)

**F1 — `role_catalog.business_group_id` 100% NULL (16/16) và `business_role_group_scopes` chỉ 2 dòng.**
⇒ Cầu nối «vai trò → nhóm nghiệp vụ → phạm vi» **có bảng nhưng KHÔNG được dùng** trong luồng quyền thật (⛔ không có mã Java nào đọc `business_role_group_scopes` để cấp/ chặn quyền).
**Khuyến nghị (⛔ không tạo cơ chế mới):** hoặc (A) điền dữ liệu qua màn Quản trị hiện có rồi mới nối vào `AccessScopeService`, hoặc (B) giữ nguyên trạng và ghi rõ «chưa dùng». ⛔ KHÔNG tự bịa luật gán phạm vi theo nhóm — cần quyết định nghiệp vụ của user.

**F2 — CẤP BẬC là nguồn DUY NHẤT phân biệt «≥ trưởng phòng» và đang bị THAM CHIẾU CỨNG `>= 30` ở 2 chỗ.**
`BootstrapDataAdapter` (vùng duyệt) và `OpsTaskManagementUseCase` (`director_pending_approvals`) đều dùng hằng `30` kèm chú thích «ĐO từ CSDL». Hiện `truong_phong`=30 trong dữ liệu thật ⇒ ĐÚNG, nhưng nếu đổi `level_rank` của `truong_phong` trong CSDL thì 2 chỗ này lệch âm thầm.
**Khuyến nghị:** giữ nguyên hành vi; nếu sau này muốn đổi ngưỡng ⇒ phải sửa cả 2 chỗ + test `DirectorPendingApprovalsTest`/`RequestOverdueReasonTest`. ⛔ Không đổi lượt này (không có yêu cầu nghiệp vụ).

**F3 — Phạm vi dự án/kho KHÔNG phủ hết user: 15/49 user có phạm vi dự án, 4/49 có phạm vi kho.**
`AccessScopeService` ghi rõ: **không có dòng `user_project_scopes` ⇒ `false`** cho các thao tác bị gác phạm vi (⚠️ có ngoại lệ ĐÃ ĐƯỢC TEST: người lập phiếu không thuộc dự án nào vẫn tạo được PR — `RequestNoProjectBootstrapIntegrationTest`). Đây là **hành vi có chủ đích**, ⛔ KHÔNG phải lỗi ⇒ chỉ ghi nhận để khi cấp tài khoản phải nhớ gán phạm vi.

**F4 — `user_module_permissions`: 1403 dòng / 61 module / 49 user, chỉ 3 dòng `can_view=0`.**
⇒ Ma trận quyền module là **nguồn chính** đang chạy. Không phát hiện dòng mồ côi kiểu module không tồn tại trong phạm vi đo này (đã kiểm bằng sự tồn tại của 61 module khớp `module_catalog` ở các probe trước).

---

## 4. Kết luận task

- **Đã audit**: 5 nhóm bảng (`role_catalog` · `business_role_engine_catalog` · `business_role_group_catalog` · `business_role_group_scopes` · `user_module_permissions`) **+ 2 bảng phạm vi** (`user_project_scopes` · `user_warehouse_scopes`) **+ nguồn cấp bậc** (`system_level_catalog`) — kèm **bảng ánh xạ** đầy đủ khái niệm → bảng → điểm thi hành (§2).
- **⛔ KHÔNG tạo cơ chế quyền mới**, ⛔ không thêm bảng/cột, ⛔ không đổi ngưỡng `level_rank`.
- **Việc cần user quyết (nếu muốn đi tiếp)**: F1 — có dùng cầu nối «nhóm nghiệp vụ ↔ phạm vi» hay không (cần luật nghiệp vụ, ⛔ không suy diễn).
- **Bằng chứng đo**: MySQL `vntech_erp` (bảng số liệu §1, §1.1), mã nguồn ghi tại §2; các cổng test liên quan đã xanh ở các task P4-02/P4-03/P4-05.
