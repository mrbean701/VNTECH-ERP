# TASK-052 — LỚP LỖI #4: `tinyint(1)` của MySQL trả về **Boolean** ⇒ `modulePermissions` của admin LUÔN RỖNG

**Trạng thái:** **DONE — đã vá cùng lượt với TASK-050.** Commit **#85**.
**Ngày:** 17/09/2026 · **Phát hiện:** trong lúc kiểm chứng TASK-050 (không nằm trong đặc tả ban đầu)

---

## 1. Lỗi là gì

Trong `BootstrapDataAdapter`, hai nhánh dựng `modulePermissions` kiểm cờ `active` bằng:

```java
Object activeVal = mod.getOrDefault("active", 0);
if (activeVal instanceof Number num && num.intValue() == 1) { … }
```

Nhưng `module_catalog.active` là **`tinyint(1)`**, và MySQL Connector/J trả cột này về **`Boolean`**, **không phải `Number`** ⇒ điều kiện **LUÔN SAI** ⇒ danh sách rỗng.

## 2. Đo được (trước khi vá)

| Phép đo | Kết quả |
|---|---|
| `GET /api/system` (admin) → `data.modulePermissions.length` | **0** |
| `GET /api/system` (admin) → `data.moduleCatalog[0]` | `{…"active":true…}` — kiểu trong JSON là **`boolean`**, không phải `1` |
| `typeof data.moduleCatalog[0].active` (mọi tài khoản) | **`boolean`** (100% dòng) |
| **JS** `MODULE_KEYS` vs **MySQL** `module_catalog WHERE active=1` | **61 = 61**, hai tập **TRÙNG KHÍT** (0 lệch cả hai chiều) ⇒ JS/admin phải trả **61 dòng** |
| Sau khi vá | `modulePermissions` của admin = **61 dòng**, `permissionSource="admin"` |

## 3. Vì sao lâu nay không ai thấy

`app/page.tsx:548` — `modulePermission()` trả **toàn quyền cho admin TRƯỚC KHI** đọc danh sách:

```ts
if (isAdminUser(data.user)) return { canView:true, canUse:true, … };
const row = data.modulePermissions.find(…)
```

⇒ màn hình quản trị vẫn đúng, **dấu hiệu duy nhất** là dữ liệu `modulePermissions` rỗng trong JSON. Đây là dạng *"lỗi bị tầng UI che"* — chỉ cổng đo payload mới bắt được.

## 4. Phạm vi ảnh hưởng thật

1. **Nhánh admin** (lỗi có từ trước): `modulePermissions` rỗng, nhưng UI che ⇒ ảnh hưởng **gián tiếp**: bất kỳ mã nào (kể cả UI tương lai) lấy quyền từ danh sách này sẽ thấy admin **không có quyền nào**.
2. **Nhánh Ban giám đốc** (thêm ở TASK-050): nếu **không** vá lỗi này thì `thukydemo` nhận **0** dòng quyền ⇒ bộ lọc quyền của TASK-050 sẽ **xoá trắng toàn bộ dữ liệu** của tài khoản Ban giám đốc (đo trước khi vá: `staffDirectory/requests/inventory/materials/workItems` đều rỗng). ⇒ **hai lỗi phải vá cùng nhau**, nếu tách ra sẽ tạo lỗi mới nghiêm trọng hơn.

## 5. Cách vá

Thêm helper **theo đúng quy ước đã có trong kho** — 5 use-case khác đã có sẵn cùng logic (`AdminSystemUseCase:527`, `ProjectContractUseCase:101`, `PurchaseManagementUseCase:405`, `RequestManagementUseCase:598`, `UserManagementUseCase:596`):

```java
private static boolean isActiveOne(Object value) {
    if (value instanceof Number number) return number.intValue() == 1;
    return Boolean.TRUE.equals(value);
}
```

Dùng cho **cả hai** nhánh (`admin` và `company_leadership`).

## 6. Kiểm chứng

* `tools/probe-task050-bootstrap.mjs` → `[thukydemo] số module > số dòng user_module_permissions trong MySQL — Java=60 · MySQL=15` **ĐẠT**; `[thukydemo] có dòng permissionSource='company_leadership'` **ĐẠT**; `[thukydemo] materials KHÔNG rỗng` **ĐẠT**.
* Tổng: **87/87 ĐẠT**.

## 7. Việc còn lại (đã ghi vào Known Problems #49)

**Quét toàn kho xem còn chỗ nào so `Number` với cột `tinyint(1)` hay không** — đây là **lớp lỗi thứ 4** đã được đặt tên (sau *cột không tồn tại* · *sai ngữ nghĩa* · *thiếu đường ĐỌC*). Lần rà đầu trong `java-backend` cho thấy **chỉ còn 2 chỗ** là hai dòng vừa vá (các chỗ khác đã dùng biến thể `… : Boolean.TRUE.equals(o)`), nhưng phép rà này **chưa tự động hoá** ⇒ cần một cổng riêng.
