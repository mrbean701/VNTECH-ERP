# TASK-102 — PHASE 7 «QUẢN TRỊ HỆ THỐNG»: 16 MỤC `AD-01`…`AD-16` (tuần tự)

- **Ngày:** 2026-09-21
- **Phạm vi:** `docs/25_TODO_ROADMAP.md` PHASE 7 — QUẢN TRỊ HỆ THỐNG (16 mục, tuần tự).
- **Ràng buộc đã tuân thủ:** KHÔNG bảng/cột mới · KHÔNG migration · KHÔNG khoá module mới · KHÔNG sửa
  `scripts/**` · KHÔNG sửa `drizzle/**` · KHÔNG sửa `java-backend/**` · KHÔNG build/khởi động dịch vụ ·
  chỉ dùng `edit`/`write` cho `app/**`, `docs/**`, `tests/**` (không dùng PowerShell ghi tệp tiếng Việt).
- **Tệp được sửa:** `app/page.tsx` (vùng màn Quản trị) · `app/screens/admin-governance-pure.ts` (MỚI — lõi thuần,
  có dấu `AD-PURE-BEGIN/END` để test trích và CHẠY THẬT) · `tests/ad01…ad16-*.test.mjs` (16 tệp hợp đồng) ·
  8 tài liệu audit/BLOCKED · `docs/25_TODO_ROADMAP.md` (cột TT) · `docs/agent-progress/MASTER_STATUS.md` (ô số).

## 1. KẾT QUẢ TỪNG MỤC

| Mục | Việc nguyên văn | Kết quả | Sản phẩm / bằng chứng |
|---|---|---|---|
| `AD-01` | Đổi tên **Nhân sự → Tài khoản** | **DONE** | `ADMIN_STEP_LABELS[0]="Tài khoản"` (nguồn sự thật) · `app/page.tsx:2242` `const steps=ADMIN_STEP_LABELS;` · tiêu đề `DANH SÁCH TÀI KHOẢN` (`:2260`) |
| `AD-02` | 13 cột tài khoản | **DONE** | `ACCOUNT_COLUMNS` (13 cột, đúng thứ tự) + `accountRows()`; «số quyền» = đếm THẬT `user_module_permissions`; 2 trường không nguồn hiện `«chưa có nguồn»` + lý do (`app/page.tsx:1570,1588,1589`) |
| `AD-03` | Bấm tài khoản → User Detail Modal | **DONE** | `AdminStaffList` bấm DÒNG ⇒ `openEntity("user", u)`; `Admin` render `<ProjectEntityModal …>` (`app/page.tsx:2200`) → `EntityDetailModal` (U-01/PR-04), **không** tự dựng modal thứ hai |
| `AD-04` | Sắp xếp mặc định: Trạng thái → Mã tài khoản | **DONE** | `ACCOUNT_DEFAULT_SORT="status"` + `accountSortCompare()`; mặc định `useState(ACCOUNT_DEFAULT_SORT)`; có ghi chú quy tắc trên UI |
| `AD-05` | 2 sub-tab Cơ cấu tổ chức ‖ Tổ đội theo dự án | **DONE** | `ORG_SUB_TABS` + nhánh `{step===2&&…}` với `data-subtab="org-structure"` / `data-subtab="org-teams"` |
| `AD-06` | Tách tab Chức danh / Vai trò; phân biệt Position vs System Role | **DONE** (audit CONFIRMED) | `POSITION_SUB_TABS` + 2 sub-tab; `systemRoles` suy từ `role_catalog.base_role`; tài liệu `AD-06-POSITION-VA-SYSTEM-ROLE.md` |
| `AD-07` (**P0**) | Audit nhóm quyền nghiệp vụ | **DONE** (CONFIRMED) | `AD-07-NHOM-QUYEN-NGHIEP-VU-AUDIT.md` — **KHỚP** kết luận `A-15` (phòng ban = MẪU, KHÔNG phải đường kiểm quyền) + đính chính nhỏ (3 vai trò MẪU/GIỚI HẠN); test kiểm 2 chiều bằng `assert.doesNotMatch` trên `RbacService`/`ModulePermissionStoreAdapter` |
| `AD-08` | Bộ lọc phòng ban + chọn nhiều + Xoá mục đã chọn | **DONE** | `filterDepartments`/`toggleSelection`/`selectedPermissionRows`/`bulkDeleteDepartmentPermissionsEnabled`; UI: ô lọc `data-dept-filter="AD-08"`, checkbox từng dòng, nút «Xóa mục đã chọn (n)» + `window.confirm` + action THẬT `delete_department_permission` |
| `AD-09` | Cân đối lại toolbar phân quyền người dùng | **DONE** | `UserPermissionMatrix` bọc `data-permission-toolbar="AD-09"`; `ListToolbar` đủ 4 phần §5 (tiêu đề/số lượng `count/total/unit` · tìm · 2 lọc · hành động «Bỏ lọc») |
| `AD-10` | Audit + sửa UI nếu cần + kiểm thử kỹ | **DONE** (CONFIRMED) | 🔴 **LỖI THẬT ĐÃ VÁ:** nút «Xóa» cấp bậc gọi API không xác nhận, không chặn cấp bậc đang dùng ⇒ nay `canDeleteLevel` + `disabled` + `window.confirm` (`app/page.tsx:1870,1900`); tài liệu `AD-10-CAP-BAC-AUDIT.md` |
| `AD-11` | Audit 2 sub-tab Project & Warehouse scope | **DONE** (CONFIRMED + đính chính tiền đề) | `AD-11-PHAM-VI-DU-AN-KHO-AUDIT.md`: bước 8 **không có** sub-tab (1 bảng gộp); cặp phạm vi độc lập nằm ở `UserAccessModal` («1. Phạm vi dự án» / «2. Phạm vi kho bắt buộc») ⇒ không cần dựng bản sao |
| `AD-12` | Ghi rõ «Ngoại lệ cá nhân = ghi đè QUYỀN»; giữ nguyên chức năng | **DONE** (chỉ tài liệu) | `AD-12-NGOAI-LE-CA-NHAN-GHI-DE-QUYEN.md`; **0 dòng mã hành vi bị đổi** (test kiểm ngược: xoá `manual_override` ⇒ HỎNG) |
| `AD-13` | Tách riêng cột User và Actor/Performed By | **DONE** | 2 cột riêng `Tài khoản (User)` (từ `audit_logs.user_id`→`users`) và `Người thực hiện (Actor)` (từ `audit_logs.user_name` đóng băng) — `app/page.tsx:2018`; nguồn cột ghi trong `title` |
| `AD-14` | Thêm: hành động · module · thực thể · mã thực thể · thời gian · IP · kết quả · metadata | **BLOCKED** | 6/8 trường CÓ cột và đã hiển thị; `result` + `metadata` **KHÔNG có cột** trong `audit_logs` (17 cột, `information_schema`) ⇒ phải migration (BỊ CẤM) ⇒ `AD-14-AUDIT-LOG-KET-QUA-METADATA-BLOCKED.md` (ghi `**BLOCKED**` + lý do + 2 phương án gỡ) |
| `AD-15` | Audit phụ thuộc; không ảnh hưởng roadmap → ghi backlog | **DONE** (CONFIRMED) | `AD-15-CAU-HINH-PHU-THUOC-AUDIT.md`: 5 khối phụ thuộc của bước 12 + **BACKLOG** 3 mục (`BL-AD15-1…3`), khẳng định **không ảnh hưởng roadmap** |
| `AD-16` | Cho user sửa tên hiển thị · ảnh · liên hệ · mật khẩu | **BLOCKED** | 2/4 trường chạy thật (`update_profile_avatar` · `change_password`); `fullName`/`email` **KHÔNG có action tự phục vụ** ở cả 2 đường ghi ⇒ thêm action phải sửa `scripts/**`+Java (BỊ CẤM) ⇒ `AD-16-TU-SUA-THONG-TIN-BLOCKED.md`; UI chỉ rõ trường nào sửa được + lý do trường còn lại (không dựng nút chết) |

**Tổng:** 14 mục **DONE** · 2 mục **BLOCKED** (`AD-14`, `AD-16`).

## 2. BẰNG CHỨNG TRACE (Code / DB / API / UI / Permission / Data)

| Lớp | Bằng chứng đã đo | Nơi ghi |
|---|---|---|
| **DB** | `audit_logs` = **17 cột** (không có `result`/`metadata`) · `role_catalog` có `base_role` · `user_module_permissions.permission_source` chỉ có `department_default` (1046 dòng) | `information_schema.COLUMNS`, DB `vntech_erp` — dùng trong `tests/ad06` + tài liệu AD-14 |
| **Code (Java)** | `RbacService.java:13` · `ModulePermissionStoreAdapter.java:12,51` (chỉ `user_module_permissions`) · `UserManagementUseCase.java:186,338,380,415,439,450` · `AuditLogAdapter.java:46,63` · `BootstrapDataAdapter.java:1210,1219,1222` · `SystemController.java:236,253,395,415,1040` | `tests/ad07`, `ad13`, `ad10`, `ad16` |
| **Code (route JS)** | `scripts/system-route.mjs:179,2599` (INSERT audit 9 cột) · `:756` (đọc audit `LIMIT 100`) · `:769` (activeSessions) · `:3227` (`change_password`) · `:3243` (`update_profile_avatar`) | `tests/ad14`, `ad16`, `ad02` |
| **UI** | `app/page.tsx` — `AdminStaffList:1521` · `copyFromDepartment:1772` · `delete_department_permission:1680` · `canDeleteLevel:1870` · cột audit `:2018` · `steps=ADMIN_STEP_LABELS:2242` · `DANH SÁCH TÀI KHOẢN:2260` · `AccountSettingsModal:2774` + `data-self-edit:2783` | 16 test hợp đồng |
| **Permission** | `modulePermission(data,"admin")` cho cổng modal tài khoản · `delete_department_permission` bị chặn bởi `bulkDeleteDepartmentPermissionsEnabled(data.user, …)` (chỉ admin, phải chọn mục có thật) · `delete_system_level` vô hiệu khi còn tài khoản giữ cấp bậc | `tests/ad03`, `ad08`, `ad10` |
| **Workflow** | `WorkflowManager` (bước 9) không bị đụng; `canSkipLevels` đọc từ `system_level_catalog` (LIKELY — xem AD-10 §1.5) | tài liệu AD-10 |
| **Data** | «số quyền» = đếm dòng có ≥1 capability (không hard-code) · 2 trường thiếu nguồn ⇒ `null` + `«chưa có nguồn»` (KHÔNG hiện 0 giả) | `tests/ad02` (đối chứng âm: `null` ≠ 0) |

## 3. TRƯỜNG/ACTION THẬT ĐÃ DÙNG (chứng minh không đoán)

- Trường payload: `employeeCode` `username` `fullName` `email` `organizationName/department` `roleName` `role`
  `roleBase` `systemLevelCode` `approvalLimit` `active` `avatarUrl`; cấp bậc: `systemLevelCatalog[].code/name`;
  quyền: `allModulePermissions[].userId/canView…canExport`; nhật ký: `audits[].userId/userName/action/moduleKey/
  entityType/entityId/occurredAt/ipAddress/beforeJson/afterJson/changeDetail/userRole/department/systemLevel/permissionUsed`;
  phòng ban: `departmentModulePermissions[].organizationUnitId/moduleKey/active/canView…`; `organizationUnits[].code/name/unitType/active`.
- Action đã gọi (tất cả **ĐÃ CÓ**): `delete_department_permission` · `save_department_permission` (giữ nguyên) ·
  `save_user_access` · `delete_system_level` · `set_system_level_status` · `update_profile_avatar` · `change_password`.
- **KHÔNG** thêm action nào; **KHÔNG** thêm khoá module; **KHÔNG** sửa `lib/permissions.ts`.

## 4. HỢP ĐỒNG KIỂM CHỨNG (ĐỎ trước → XANH sau)

16 tệp `tests/ad01…ad16-*.test.mjs` (không nằm trong `package.json` ⇒ `test:regression` giữ nguyên số ca).
Mỗi tệp trích khối `AD-PURE-BEGIN/END` của `app/screens/admin-governance-pure.ts`, dịch TS→JS bằng `esbuild`
và **CHẠY THẬT** hàm thuần, kèm **đối chứng âm** ở các mục hành vi:

- `AD-04`: đảo dấu hàm so sánh · ca «đã khoá nhưng mã nhỏ hơn» · bộ so sánh CHỈ-theo-mã phải bị bắt.
- `AD-08`: vai trò thường ⇒ cổng quyền HỎNG · chưa chọn gì ⇒ nút TẮT · đổi tên action ⇒ HỎNG.
- `AD-16`: `editable=true` mà `action=null` ⇒ cổng HỎNG · UI không được có `name="fullName"`/`name="email"`.
- Các mục audit: kiểm **kết luận + bằng chứng** (đọc chính mã nguồn/DB), không chỉ chạy cho có.

**Đường ĐỎ đã ghi nhận:** lần chạy đầu `# tests 59 · pass 34 · fail 25` (khi đó mã nguồn chưa được sửa).
Sau khi hoàn tất: `# tests 59 · pass 59 · fail 0`.

## 5. GHI CHÚ / RỦI RO CÒN LẠI

- `AD-14`, `AD-16` **BLOCKED** — cần người dùng quyết (cho phép migration / cho phép sửa `scripts/**`+Java,
  hoặc sửa nguyên văn yêu cầu). Chi tiết 2 phương án ở từng tài liệu BLOCKED.
- 2 trường «đăng nhập cuối» + «ngày tạo» hiện `«chưa có nguồn»`: muốn có số phải thêm cột vào payload bootstrap
  ⇒ sửa `scripts/**`/Java (ngoài phạm vi).
- `AD-10` §1.5 (`can_skip_levels` có hiệu lực thật) đang **LIKELY** — cần dữ liệu một lượt duyệt vượt cấp thật để nâng lên CONFIRMED.
