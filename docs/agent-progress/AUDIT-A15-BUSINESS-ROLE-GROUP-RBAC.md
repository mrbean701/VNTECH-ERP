# AUDIT A-15 — NHÓM QUYỀN NGHIỆP VỤ CÓ THAM GIA KIỂM QUYỀN KHÔNG? (P0)

- **Ngày:** 20/09/2026 · **Trạng thái:** HOÀN THÀNH
- **KẾT LUẬN NGẮN:** ❌ **KHÔNG tham gia kiểm quyền (CONFIRMED)** — nhóm quyền nghiệp vụ là **danh mục cấu hình/quản trị**, **không** nằm trong đường kiểm quyền. Đường kiểm quyền **chỉ dùng `module_permissions`**.
- **Phương pháp (§45):** đọc **DB thật** + **thân hàm kiểm quyền thật** + **đếm call-site thật**. Không suy đoán.

## 1. BẰNG CHỨNG — DB (CONFIRMED)

| Bảng | Cột | Số dòng |
|---|---|---|
| `business_role_group_scopes` | `id` · `business_group_id` · `business_scope_id` · `is_primary` | **2** |
| `business_scope_catalog` | `id` · `code` · `name` · `description` · `active` · `sort_order` · **`system_locked`** | **9** |

## 2. BẰNG CHỨNG — ĐƯỜNG KIỂM QUYỀN THẬT (CONFIRMED)

`RbacService.requireActionModule(user, action)` — thân hàm (rút gọn, giữ nguyên thứ tự):
```
if (PUBLIC_ACTIONS.contains(action)) return;                       // 5 action công khai
List<String> required = ActionRbacRegistry.modulesFor(action);     // module yêu cầu cho action
if (isAdmin(user)) return;                                        // admin: qua
if (isCompanyLeadership(user) && !required.contains("admin")) return; // director/accountant: qua hầu hết
if (required.isEmpty()) throw 403;                                // PHASE 0B (S-03): MẶC ĐỊNH TỪ CHỐI
String capability = ActionRbacRegistry.capabilityFor(action);      // canView/canUse/canCreate/...
for (String moduleKey : required)
    if (modulePermissionStore.canUseModule(user.id(), moduleKey, capability)) return;  // ← CHỈ dùng module_permissions
throw 403;
```
⇒ **Đường kiểm quyền chỉ đọc `module_permissions`** (`canUseModule(userId, moduleKey, capability)`).
⇒ **KHÔNG có** tham chiếu nào tới `business_role_group_scopes` / `business_scope_catalog` trong đường này.

## 3. BẰNG CHỨNG — NHÓM QUYỀN NGHIỆP VỤ ĐƯỢC DÙNG Ở ĐÂU

| Nơi | Vai trò | Có phải kiểm quyền? |
|---|---|---|
| `AdminSystemUseCase` / `AdminSystemStore` (`business_role_group_catalog`) | **CRUD ở màn quản trị** | ❌ Không |
| `ActionRbacRegistry` (các entry `save_business_role_group`, `delete_business_scope`, `set_business_scope_status`…) | **TÊN ACTION** quản trị danh mục đó | ❌ Không (chỉ là action key) |
| `BootstrapDataAdapter` / `UserAdminStoreAdapter` | **nạp dữ liệu** cho UI | ❌ Không |
| `RbacService.requireActionModule` | **đường kiểm quyền** | ✅ Có — **nhưng KHÔNG dùng nhóm nghiệp vụ** |

## 4. BẰNG CHỨNG — CALL-SITE CỦA HÀM KIỂM QUYỀN (đếm được)

- **1 call-site thật (production):** `web/.../SystemController.java:207` — `rbacService.requireActionModule(requireCurrentUser(request), action)` ⇒ **mọi action đi qua 1 cổng duy nhất** ✅
- 2 tham chiếu còn lại là **bình luận/tài liệu** (`ActionRbacRegistry.java:9`, `ModulePermissionStoreAdapter.java:43`).

> ✅ **Xác nhận nợ kỹ thuật CŨ đã được vá:** bug “`requireActionModule` được định nghĩa **nhưng 0 lời gọi**” **KHÔNG còn** — nay có call-site thật ở `SystemController`.
> ⚠️ **Nhưng bình luận ở `ModulePermissionStoreAdapter.java:43` vẫn ghi “không nơi nào gọi”** ⇒ **tài liệu lệch với mã** (mức thấp, nên sửa cho khỏi gây hiểu sai về sau).

## 5. KẾT LUẬN (trả lời đúng câu hỏi audit)

1. **Nhóm quyền nghiệp vụ có tham gia kiểm quyền không?** ⇒ **CONFIRMED: KHÔNG.** Chúng là **danh mục quản trị**, không xuất hiện trong đường kiểm quyền.
2. **Vậy hệ thống kiểm quyền bằng gì?** ⇒ **`module_permissions`** (moduleKey + capability) + ngoại lệ **admin** · **director/accountant** · **5 action công khai**.
3. **Có phải lỗ hổng trực tiếp không?** ⇒ **Không phải lỗ hổng cho phép vượt quyền** (đường kiểm quyền đã **default-deny** từ S-03). Nhưng là **rủi ro hiểu nhầm (P0 về vận hành)**: quản trị viên có thể tưởng “gán nhóm quyền nghiệp vụ = cấp quyền” ⇒ **tưởng đã khoá mà thực tế không khoá**.

## 6. KHUYẾN NGHỊ (chờ user quyết định)

1. **Quyết định nghiệp vụ rõ ràng:** nhóm quyền nghiệp vụ là **(a) chỉ danh mục tham chiếu** ⇒ nên **đổi tên/ghi chú “chỉ danh mục, không cấp quyền”** trên UI quản trị; hoặc **(b) có hiệu lực cấp quyền** ⇒ phải **nối vào `RbacService`** (đọc bảng qua một port, không đọc thẳng DB).
2. Sửa **bình luận lệch** ở `ModulePermissionStoreAdapter.java:43`.
3. Bổ sung **test** khoá hành vi: “user không có module_permission ⇒ 403” (đã có mặc định từ chối, cần test để chống hồi quy).

*Không tự ý sửa mã/cấu hình — audit chỉ kết luận + khuyến nghị.*
