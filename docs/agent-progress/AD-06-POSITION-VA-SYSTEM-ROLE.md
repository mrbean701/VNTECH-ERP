# AD-06 — AUDIT: PHÂN BIỆT **CHỨC DANH (POSITION)** VỚI **VAI TRÒ HỆ THỐNG (SYSTEM ROLE)**

> Mục master task: `AD-06` — nguyên văn `docs/25_TODO_ROADMAP.md`: «Tách tab Chức danh / Vai trò;
> **phân biệt rõ Position với System Role**» (module «Chức danh», UI=NEW, QUYỀN=MODEL).
> Đây là mục AUDIT ⇒ kết luận bên dưới ghi CONFIRMED/LIKELY/UNKNOWN kèm BẰNG CHỨNG, không suy đoán.

## 1. KẾT LUẬN

| # | Khẳng định | Kết luận | Bằng chứng |
|---|---|---|---|
| 1 | `role_catalog` là danh mục **CHỨC DANH (Position)**: mã · tên hiển thị · nhóm quyền nghiệp vụ · đơn vị mặc định | **CONFIRMED** | `information_schema.COLUMNS` bảng `role_catalog` (DB `vntech_erp`) trả đúng 14 cột: `code`, `name`, `description`, `base_role`, `active`, `sort_order`, `system_locked`, `created_at`, `updated_at`, `business_group_id`, `warehouse_scope_kind`, `default_organization_unit_id` |
| 2 | `role_catalog.base_role` là **SYSTEM ROLE** — mã kỹ thuật để KIỂM QUYỀN | **CONFIRMED** | `BootstrapDataAdapter.java` trả `COALESCE(rc.base_role,u.role) AS roleBase`; `ActionRbacRegistry.java` khoá bản đồ action → module + capability theo vai trò; `RbacService.java:13` ghi rõ «user thường: cần `user_module_permissions.can_<capability>=1` với module của action» |
| 3 | Hai khái niệm là **HAI LỚP KHÁC NHAU**, không thay thế nhau: Position là dữ liệu nghiệp vụ gán cho người; System Role là mã kỹ thuật của tầng kiểm quyền | **CONFIRMED** | `users.role` trỏ `role_catalog.code` (Position); `users.role` → `rc.base_role` (System Role) được dùng ở cổng kho (`roleBase === "warehouse"`, `app/page.tsx` khối `UserAccessModal`) |
| 4 | `engine_role_profiles` («Quyền nền kỹ thuật») là mô tả hiển thị của từng System Role, KHÔNG cấp thêm quyền | **LIKELY** | `lib/menu-helpers.ts` + khối System Role trong màn Quản trị chỉ ĐỌC `data.engineRoleProfiles`; không thấy đường GHI nào đọc bảng này để cấp quyền |
| 5 | Có bao nhiêu System Role đang thực dùng trong dữ liệu sống? | **UNKNOWN** | Số lượng phụ thuộc dữ liệu `role_catalog.base_role` của từng môi trường; UI hiện đếm THẬT tại chỗ (`systemRoles` trong `app/page.tsx`), không hard-code |

## 2. CẤU TRÚC ĐÃ TRIỂN KHAI (bản vá AD-06)

`app/page.tsx` bước 3 nay có **2 sub-tab** dựng từ một nguồn sự thật `POSITION_SUB_TABS`
(`app/screens/admin-governance-pure.ts`):

1. **Chức danh (Position)** — `data-subtab="position"`: bảng `role_catalog` + cột «System Role» (đọc `row.baseRole`).
2. **Vai trò hệ thống (System Role)** — `data-subtab="system-role"`: nhóm theo `base_role`, hiện «Quyền nền kỹ thuật
   (engineRoleProfiles)» + số chức danh dùng. Khối này **CHỈ ĐỌC**: muốn đổi `base_role` phải sửa dữ liệu danh mục,
   ngoài phạm vi PHASE 7 (không đổi hành vi quyền).

Ngoài dải sub-tab có một khối `inline-alert` giải thích phân biệt ngay trên màn hình (người dùng đọc được, không chỉ trong tài liệu).

## 3. PHẠM VI

- KHÔNG thêm khoá module mới: bước 3 vẫn thuộc module ĐÃ CÓ `admin`.
- KHÔNG migration: cả 2 sub-tab chỉ đọc các cột đã có trong payload bootstrap.
- KHÔNG đổi ngữ nghĩa quyền: `lib/permissions.ts` không bị sửa.

Hợp đồng kiểm chứng: `tests/ad06-position-vs-role.test.mjs` (5 ca, gồm 1 ca đối chứng âm cho nhãn mơ hồ
và 1 ca đọc `information_schema` để chứng minh `base_role` tồn tại THẬT).
