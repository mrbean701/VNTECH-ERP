# AD-12 — NGOẠI LỆ CÁ NHÂN = GHI ĐÈ QUYỀN (TÀI LIỆU HOÁ, KHÔNG ĐỔI HÀNH VI)

> Mục master task: `AD-12` — nguyên văn `docs/25_TODO_ROADMAP.md`:
> «Ghi rõ **Ngoại lệ cá nhân = ghi đè QUYỀN** vào tài liệu; giữ nguyên chức năng» (phụ thuộc `A-08` ✔ đã ĐÓNG).
>
> ⚠️ Đề bài yêu cầu mục này **CHỈ ghi tài liệu** — **KHÔNG đổi hành vi** chức năng.

## 1. CÂU CHỐT

# **Ngoại lệ cá nhân = ghi đè QUYỀN**

Nghĩa là: ngoại lệ cá nhân **KHÔNG** tạo một cơ chế quyền mới, **KHÔNG** thay thế ma trận quyền chức năng, và
**KHÔNG** phải một lớp kiểm quyền song song. Nó là **một dòng quyền của chính người đó** mang dấu vết nguồn
`permission_source = 'manual_override'`, nằm **cùng bảng** với quyền nền `department_default`; khi cùng
module, dòng `manual_override` **GHI ĐÈ** dòng nền.

## 2. CƠ CHẾ THẬT (bằng chứng, không suy đoán)

| Thành phần | Bằng chứng | Ý nghĩa |
|---|---|---|
| Bảng quyền hiệu lực | `user_module_permissions` | MỘT bảng cho cả quyền nền và ngoại lệ |
| Nguồn quyền nền | `java-backend/.../persistence/UserAdminStoreAdapter.java` — `permission_source='department_default'` | Sinh từ MẪU phòng ban (`replaceDepartmentDefaults`) |
| Nguồn ngoại lệ | cùng tệp — `permission_source='manual_override'` | Ngoại lệ cá nhân ⇒ GHI ĐÈ |
| UI nhận diện | `app/page.tsx` — `String(p.permissionSource) === "manual_override" ? " · ngoại lệ" : ""` | Người dùng THẤY rõ quyền nào là ngoại lệ |
| Cổng kiểm quyền | `java-backend/.../rbac/RbacService.java` + `ModulePermissionStoreAdapter.java` | Chỉ đọc `user_module_permissions.can_<capability>` — ngoại lệ có hiệu lực qua CHÍNH cổng này |
| Đường ghi | action `save_user_access` (`scripts/system-route.mjs`, `SystemController.java`) | Ngoại lệ đi qua cùng action với quyền thường |
| Ràng buộc khi lưu | `UserManagementUseCase.assertDepartmentAllowsPermissions` | Ngoại lệ **vẫn** bị giới hạn: không được vượt quyền PHÒNG BAN đã cấp (trừ admin / cấp bậc `auto_grant_all`) |

## 3. HỆ QUẢ CẦN NHỚ KHI VẬN HÀNH

1. Ngoại lệ cá nhân **không** làm hết hiệu lực các quyền khác của người đó — nó chỉ ghi đè **đúng module** bị đặt ngoại lệ.
2. Ngoại lệ cá nhân **không** mở rộng phạm vi dự án/kho: 3 lớp (`module_permissions` · `user_project_scopes` ·
   `user_warehouse_scopes`) kiểm **độc lập**.
3. Muốn gỡ ngoại lệ ⇒ trả module đó về nguồn `department_default` (hoặc xoá theo phòng ban) — không có bảng riêng
   để «xoá ngoại lệ».
4. Ngoại lệ vẫn bị ràng buộc phòng ban (P5.3) — trừ tài khoản `admin` và cấp bậc `auto_grant_all`.

## 4. PHẠM VI — GIỮ NGUYÊN CHỨC NĂNG

Bản này **KHÔNG đổi hành vi**: không sửa `lib/permissions.ts`, không sửa `UserAdminStoreAdapter`,
không đổi action `save_user_access`, không thêm bảng/cột, không migration.
Hợp đồng kiểm chứng `tests/ad12-exception-doc.test.mjs` kiểm **HAI CHIỀU**: (a) tài liệu có đúng câu chốt + cơ chế
`manual_override` + phạm vi «KHÔNG đổi hành vi»; (b) **mã nguồn vẫn còn nguyên** các dấu vết cơ chế cũ
(đối chứng âm: xoá `manual_override` ⇒ test HỎNG).
