# AD-07 (**P0**) — AUDIT: NHÓM QUYỀN NGHIỆP VỤ / PHÂN QUYỀN PHÒNG BAN CÓ THAM GIA KIỂM QUYỀN KHÔNG?

> Mục master task: `AD-07` — nguyên văn `docs/25_TODO_ROADMAP.md`: «Audit + giải thích cấu trúc nhóm quyền
> nghiệp vụ», ưu tiên **P0**, phụ thuộc `A-15` (**đã ĐÓNG**).
>
> **KẾT LUẬN CỦA `A-15` PHẢI ĐƯỢC TÔN TRỌNG:** người dùng đã kết luận **phân quyền phòng ban = MẪU (template)**
> phục vụ nút «Sao chép từ phòng ban», **KHÔNG phải đường kiểm quyền**. Audit này KIỂM LẠI bằng mã nguồn
> và **KHẮP** với kết luận đó — đồng thời ghi rõ phần mạnh hơn một «template thuần».

## 1. KẾT LUẬN (CONFIRMED / LIKELY / UNKNOWN)

| # | Khẳng định | Kết luận | Bằng chứng (tệp:dòng) |
|---|---|---|---|
| 1 | **Nhóm quyền nghiệp vụ KHÔNG tham gia kiểm quyền** — cổng kiểm quyền lúc chạy CHỈ đọc `user_module_permissions` | **CONFIRMED** | `java-backend/.../rbac/RbacService.java:13` · `java-backend/.../persistence/ModulePermissionStoreAdapter.java:12,51` (đều chỉ `FROM user_module_permissions ump`) |
| 2 | `department_module_permissions` **KHÔNG phải đường kiểm quyền**: không xuất hiện trong `RbacService` và `ModulePermissionStoreAdapter` | **CONFIRMED** | grep hai tệp trên: **0** lần khớp `department_module_permissions` (test `ad07` kiểm bằng `assert.doesNotMatch`) |
| 3 | `department_module_permissions` được dùng làm **MẪU**: khi tạo/đổi vai trò tài khoản, hệ thống **sao** quyền phòng ban vào `user_module_permissions` với nguồn `department_default` | **CONFIRMED** | `java-backend/.../service/UserManagementUseCase.java:338` (`replaceDepartmentDefaults`) · `:355` chú thích gốc «department_module_permissions là nguồn chính» · `UserAdminStoreAdapter.java` khai `permission_source='department_default'` |
| 4 | Ngoài «MẪU», bảng phòng ban còn là **GIỚI HẠN khi GHI**: chặn cấp cho người quyền mà phòng chưa có (P5.3). Đây là kiểm lúc GHI, KHÔNG phải cổng lúc CHẠY | **CONFIRMED** | `UserManagementUseCase.java:186` gọi · `:380-411` `assertDepartmentAllowsPermissions` (ném `AuthUseCase.ApiError`) · `:388` `store.departmentModulePermissions()` |
| 5 | Khi sửa quyền phòng ban, hệ thống **đồng bộ lại** quyền người trong phòng | **CONFIRMED** | `UserManagementUseCase.java:415` `saveDepartmentPermission` → `:439` `syncDepartmentUsers(Instant.now())` · `:450` định nghĩa |
| 6 | Nút «Sao chép từ phòng ban» trên UI là **đường tiêu thụ MẪU** (đúng mô tả A-15) | **CONFIRMED** | `app/page.tsx:1772` `copyFromDepartment` — đọc `deptPermsOf(u.organizationUnitId)` rồi gọi `action("save_user_access", …)` (ghi vào QUYỀN NGƯỜI DÙNG, không ghi bảng phòng ban) |
| 7 | Có bao nhiêu tài khoản đang mang nguồn `manual_override` (ngoại lệ cá nhân) trên dữ liệu sống? | **LIKELY 0 ở thời điểm đo** | `SELECT permission_source, COUNT(*) FROM user_module_permissions GROUP BY permission_source` → chỉ trả **`department_default` = 1046**; chưa có dòng `manual_override` nào |

> ⚠️ **ĐÍNH CHÍNH NHỎ (không phá kết luận A-15):** phân quyền phòng ban KHÔNG chỉ là «mẫu để bấm nút sao chép».
> Nó còn (a) **tự động seed** quyền cho tài khoản khi tạo/đổi vai trò, (b) **chặn** cấp quyền vượt phòng khi lưu
> (`assertDepartmentAllowsPermissions`), (c) **đồng bộ lại** khi phòng đổi. Cả 3 vai trò này đều là **MẪU / GIỚI HẠN**,
> **KHÔNG** phải cổng kiểm quyền lúc chạy ⇒ **kết luận cốt lõi của A-15 VẪN ĐÚNG**.

## 2. SƠ ĐỒ CẤU TRÚC (nguồn: payload bootstrap + MySQL)

```
role_catalog (CHỨC DANH/Position)
   ├─ code ─────────────────────────────► users.role            (gán cho tài khoản)
   ├─ base_role ────────────────────────► SYSTEM ROLE ──► ActionRbacRegistry / RbacService (KIỂM QUYỀN)
   ├─ business_group_id ────────────────► business_role_group_catalog  (NHÓM QUYỀN NGHIỆP VỤ)
   └─ default_organization_unit_id ─────► organization_units    (đơn vị mặc định)

business_role_group_catalog ──(business_role_group_scopes)──► business_scope_catalog  (PHẠM VI nghiệp vụ)

department_module_permissions (MẪU + GIỚI HẠN khi ghi — theo PHÒNG BAN)
   ├─ seed ─► user_module_permissions (permission_source='department_default')
   └─ tiêu thụ trên UI ─► nút «Sao chép từ phòng ban» (app/page.tsx:1772)

user_module_permissions (QUYỀN HIỆU LỰC — CỔNG KIỂM QUYỀN THẬT)
   └─ permission_source ∈ {department_default, manual_override}

ngoại lệ cá nhân ─► permission_source='manual_override'  (xem AD-12)
```

## 3. GIẢI THÍCH CẤU TRÚC «NHÓM QUYỀN NGHIỆP VỤ» (yêu cầu nguyên văn của AD-07)

1. **PHÒNG/BỘ PHẬN** (`organization_units`) = cơ cấu tổ chức; **PHẠM VI NGHIỆP VỤ** (`business_scope_catalog`) = phạm vi công việc.
2. **NHÓM QUYỀN NGHIỆP VỤ** (`business_role_group_catalog` + `business_role_group_scopes`) = gom một/nhiều phạm vi nghiệp vụ.
3. **CHỨC DANH** (`role_catalog`) tham chiếu Nhóm quyền nghiệp vụ + mang `base_role` (System Role).
4. **TÀI KHOẢN** (`users.role` → chức danh) nhận quyền hiệu lực trong `user_module_permissions`.
5. **Quyền hiệu lực** được nạp từ MẪU phòng ban; ngoại lệ cá nhân là **ghi đè** (AD-12).

## 4. PHẠM VI — KHÔNG ĐỔI KIẾN TRÚC / KHÔNG ĐỔI HÀNH VI

- Audit này **KHÔNG đổi kiến trúc** và **KHÔNG đổi hành vi**: chỉ bổ sung khối giải thích trên màn Nhóm quyền (nếu cần)
  và tài liệu này. Mọi hành vi `department_default` / `manual_override` / chặn vượt phòng giữ **nguyên**.
- KHÔNG thêm bảng/cột, KHÔNG migration, KHÔNG khoá module mới.

Hợp đồng kiểm chứng: `tests/ad07-role-group-audit.test.mjs` — kiểm **HAI CHIỀU** (đường kiểm quyền KHÔNG đọc bảng
phòng ban; đường ghi CÓ dùng bảng phòng ban làm mẫu/giới hạn) + kiểm tài liệu này có verdict, có trích dẫn tệp.
