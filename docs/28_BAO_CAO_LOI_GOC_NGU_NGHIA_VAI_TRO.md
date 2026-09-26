# 28 — BÁO CÁO LỖI GỐC: NGỮ NGHĨA VAI TRÒ (ROLE) GIỮA JS VÀ JAVA

**Ngày:** 2026-09-18
**Task:** TASK-021
**Mức độ:** P0 — Permission / Workflow correctness
**Phân loại:** `CONFIRMED` (có bằng chứng code + DB + tài liệu, không suy đoán)

---

## 1. TÓM TẮT

Java backend dùng **mã vai trò chuẩn** (`cht`, `da_nv`, `ksda`, `thu_kho`, `kh_nv`) để so sánh phân quyền, trong khi
monolith JS dùng **mã engine** (`commander`, `project`, `engineer`, `warehouse`, `procurement`) lấy từ
`role_catalog.base_role`.

Vì mã chuẩn ánh xạ **NHIỀU-VỀ-MỘT** sang mã engine, cách so sánh của Java đã:

1. **Loại oan** các chức danh cùng nhóm (`da_truong`, `kh_truong`, `kho_tong`, `thuky`) và mọi vai trò
   do quản trị viên tạo thêm — những tài khoản này JS cho phép nhưng Java trả **403**.
2. **Trả sai `roleBase` cho giao diện**, làm hỏng 6 chốt quyền phía UI.
3. **Chặn oan thao tác xóa tệp** và **hủy phiếu** đối với tài khoản CHT.

---

## 2. CHUỖI BẰNG CHỨNG (READ → UNDERSTAND → VERIFY)

### 2.1 JS lấy vai trò từ đâu

`scripts/system-route.mjs:181` và `:189` — mọi truy vấn dựng phiên đăng nhập đều có:

```sql
COALESCE(rc.base_role,u.role) AS roleBase
FROM users u LEFT JOIN role_catalog rc ON rc.code=u.role
```

`scripts/system-route.mjs:193`

```js
function effectiveRole(user) { return clean(user.roleBase || user.role); }
```

`scripts/system-route.mjs:210-214`

```js
function isAdmin(user) { return effectiveRole(user) === "admin" || user.role === "admin"; }
function requireRole(user, roles) {
    if (!roles.includes(effectiveRole(user)) && !isAdmin(user))
        throw new Error("Tài khoản không có quyền thực hiện nghiệp vụ này.");
}
```

⇒ **JS so quyền bằng mã ENGINE (`base_role`)**, không phải mã chuẩn.

### 2.2 `base_role` thực tế trong DB chứa gì

`drizzle/0029_v530_erp_permissions_workflow.sql:71-80` — seed `role_catalog`:

| `code` (mã chuẩn) | `base_role` (mã engine) |
|---|---|
| `cht` | `commander` |
| `da_nv`, `da_truong` | `project` |
| `ksda` | `engineer` |
| `kh_nv`, `kh_truong` | `procurement` |
| `thu_kho`, `kho_tong` | `warehouse` |
| `thuky`, `hcpc_truong` | `director` |
| `admin` | `admin` |

`drizzle/0033_gate2_functional_integration.sql:60` xác nhận các mã `engineer, commander, project, procurement, warehouse`
đã được đánh dấu **LEGACY, `active=0`** — tức chúng **chỉ còn tồn tại với vai trò mã engine**, không còn là vai trò gán cho người dùng.

`AdminSystemUseCase.java:307-308` cũng liệt kê đúng 8 mã engine này trong `ALLOWED_ENGINES`.

⇒ **`base_role` = "engine role" = mã cũ**: `CONFIRMED`.

### 2.3 Java lấy vai trò từ đâu (TRƯỚC khi sửa)

`AuthUseCase.java:210-212`

```java
.map(u -> new CurrentUser(u.id(), u.fullName(), u.username(), u.email(), u.role(),
        u.role() /* roleBase — refine qua role_catalog ở slice phân quyền */,
        u.role() /* roleName */, null, u.department(), u.avatarUrl(), u.mustChangePassword()));
```

⇒ `roleBase` và `roleName` bị **gán bằng chính mã chuẩn**; `warehouseScopeKind` **luôn null**.
Không hề join `role_catalog` — trái với JS.

`RbacService.java:70` (trước khi sửa)

```java
if (!roles.contains(user.role()) && !isAdmin(user)) { ... }
```

⇒ Java so bằng mã chuẩn.

### 2.4 Hệ quả đã xác định được

**(a) `FileUseCase.java:110`** — chặn oan xóa tệp:

```java
} else if ("material_request".equals(entityType)
        && !List.of("commander", "project").contains(roleBase(user))) {
    throw new ApiError("Chỉ Chỉ huy trưởng hoặc Phòng Dự án được xóa hồ sơ vật tư đặc thù.", 403);
}
```

`roleBase(user)` = `user.roleBase()` = mã chuẩn ⇒ tài khoản `cht`/`da_nv` **không bao giờ khớp** `"commander"`/`"project"`
⇒ chỉ admin xóa được. **SAI** (quá chặt).

Đối chiếu JS đúng — `app/api/files/route.ts:38,186` dùng SQL thật:

```js
if (write && entityType === "material_request" && !["commander","project"].includes(String(user.roleBase || user.role))) return false;
```

⇒ JS lấy `roleBase` từ `COALESCE(rc.base_role,u.role)` ⇒ khớp. Java thì không.

**(b) `RequestManagementUseCase.cancelRequest`** — chặn oan hủy phiếu:

```java
if (!List.of("commander", "admin").contains(principal.role()))   // principal.role() = mã chuẩn "cht"
```

JS `scripts/system-route.mjs:1050` dùng `effectiveRole(user) !== "commander"` (mã engine).

**(c) `RbacService.requireRole`** — 16 điểm gọi bị hụt nhánh. Ví dụ
`StockManagementUseCase` kiểm `["thu_kho","cht","admin"]`, nhưng JS `scripts/system-route.mjs:1510` kiểm
`["warehouse","commander","admin"]`. Tài khoản `kho_tong` (base_role `warehouse`) **bị 403 oan**.

**(d) `SystemController.java:159`** — `userMap.put("roleBase", user.get().roleBase())` trả **mã chuẩn** cho giao diện.
Giao diện dùng `roleBase` cho ít nhất 6 chốt quyền:

| `app/page.tsx` | Điều kiện | Hệ quả khi `roleBase="cht"` |
|---|---|---|
| 785 | `["director","commander"].includes(roleBase(me))` | mất quyền giám sát |
| 2222 | `["commander","project"].includes(roleBase(data.user))` | mất nút "Duyệt điều chỉnh" kiểm kê |
| 3597 | `["commander"].includes(roleBase(user))` | mất quyền sửa phiếu bị trả lại |
| 3598 | `["commander","project"].includes(roleBase(user))` | mất quyền quản lý hồ sơ vật tư |
| 3612 | `["commander","project"].includes(roleBase(user))` | mất nút xác nhận BCH nhận hàng |
| 4041 | `roleBase(userRow) === "warehouse"` | sai phạm vi kho (site/central) |

⇒ **Lỗi nhìn thấy được trên giao diện**, không chỉ là vấn đề nội bộ backend.

**(e) `warehouseScopeKind` luôn `null`** trong khi JS trả `rc.warehouse_scope_kind`, và `app/page.tsx:4041`
dùng giá trị này để phân biệt kho dự án (`site`) và Kho Tổng (`central`).

---

## 3. ĐÍNH CHÍNH TASK-019

TASK-019 trước đó đã sửa 5 điểm gọi trong `ProductionManagementUseCase` từ `commander`→`cht`, `project`→`da_nv`.
Cách sửa đó **đúng một nửa**: nó làm đúng tài khoản `cht`/`da_nv` nhưng **vẫn loại oan** `da_truong`
(base_role `project`). Nay đã đưa các điểm gọi về **mã engine** và cho `requireRole` nhận **cả hai**, nên
nhánh nhiều-về-một được khôi phục đầy đủ.

---

## 4. NỘI DUNG ĐÃ SỬA

| # | Tệp | Thay đổi |
|---|---|---|
| 1 | `UserRepository.java` | Thêm `Optional<RoleCatalogInfo> findRoleCatalogInfo(String roleCode)` + record `RoleCatalogInfo(baseRole, name, warehouseScopeKind)` |
| 2 | `UserRepositoryAdapter.java` | Cài đặt bằng `JdbcTemplate`, đọc `base_role`, `name`, `warehouse_scope_kind` — **không lọc `active`** để đúng `LEFT JOIN` của JS |
| 3 | `AuthUseCase.java` | `currentUser()` nay phân giải `roleBase`/`roleName`/`warehouseScopeKind` từ `role_catalog`, rơi về mã vai trò khi thiếu dòng (đúng `COALESCE`) |
| 4 | `RbacService.java` | `requireRole` nhận **cả** mã chuẩn **và** mã engine |
| 5 | `RequestManagementUseCase.java` | Thêm `cancelBaseRole(principal)`; `cancelRequest` so bằng mã engine |
| 6–9 | `ProductionManagementUseCase`, `StockManagementUseCase`, `PurchaseManagementUseCase`, `RequestManagementUseCase` | 13 phép thay thế đưa danh sách vai trò về **mã engine** đúng như JS |
| 10 | `AuthUseCaseTest.java` | Test double cài đặt hợp đồng port mới |

Công cụ kèm theo:
- `tools/probe-role-code-scan.mjs` — quét toàn bộ `java-backend/**/*.java` tìm mã vai trò cũ, phân mức CAO/TRUNG/THẤP.
- `tools/patch-role-engine-codes.mjs` — áp 13 phép thay thế, **mỗi phép kèm số lần xuất hiện mong đợi**, lệch là dừng.
- `tools/verify-java-compile.ps1` — kiểm chứng biên dịch khi Maven bị chặn.

---

## 5. KIỂM CHỨNG

- `node tools/probe-role-code-scan.mjs` → 115 tệp, **0 lỗi mức CAO** (không còn mã cũ trong `requireRole`).
- `node tools/patch-role-engine-codes.mjs` → **13/13 phép thay thế khớp** số lượng mong đợi, exit 0.
- `tools/verify-java-compile.ps1` → biên dịch **99 tệp nguồn** của 4 module, sinh **153 tệp `.class`**
  gồm cả `UserRepository$RoleCatalogInfo.class`; **không có dòng `error:`** nào.

**Chưa kiểm chứng được (trung thực):** JAR **chưa được đóng gói lại** vì `mvn package` bị sandbox chặn ghi
`C:\Users\PC\.m2` và `mvn -o` thiếu artifact trong local repo (TASK-B03). Vì vậy thay đổi **chưa có hiệu lực
lúc chạy**; mới chỉ được kiểm chứng ở mức mã nguồn + biên dịch.

---

## 6. PHÁT HIỆN CÒN LẠI (chưa sửa — cần quyết định)

### 6.1 `isCompanyLeadership` lệch — TASK-024

- JS `scripts/system-route.mjs:386-387`:
  ```js
  const COMPANY_LEADERSHIP_ROLE_CODES = new Set(["director","tgd","ptgd","giam_doc","pho_giam_doc","thuky","thu_ky_tgd"]);
  function isCompanyLeadership(user){ return !isAdmin(user) && (COMPANY_LEADERSHIP_ROLE_CODES.has(clean(user?.role).toLowerCase()) || effectiveRole(user)==="director"); }
  ```
- Java `RbacService.java:41`: `List.of("director","accountant").contains(user.role())`.

⇒ Java **cấp thừa** cho `accountant` (JS không cấp) và **cấp thiếu** cho `thuky`/`hcpc_truong` (base_role `director`).
Đây là thay đổi quyền hạn → thuộc nhóm bảo mật mà người dùng đã tạm hoãn. **Cần người dùng quyết định trước khi sửa.**

### 6.2 `cancel_request` thiếu kiểm quyền dự án — TASK-023

JS `scripts/system-route.mjs:1048` có `canAccessProject(user, mr.projectId, true)` **trước** khi kiểm vai trò;
Java `cancelRequest` **không có**. Port `ProjectScopeStore` hiện chỉ có `findProjectIdsByUserId`,
thiếu mức quyền (`write`/`approve`/`admin`) ⇒ cần bổ sung trước khi thêm kiểm tra.

### 6.3 Một số action Java thiếu `requireRole` — TASK-022

JS có `requireRole` ở `create_stock_count`/`approve_stock_count` (dòng 1523, 1550) nhưng Java
`createStockCount` (dòng 546) và `approveStockCount` (dòng 581) không có `requireRole`.
Cần rà soát có chủ đích: Java có thể đã chuyển sang kiểm bằng module permission (`requireActionModule`),
nên **không được thêm máy móc** — phải đối chiếu từng action.

---

## 7. BÀI HỌC

1. **Không được giả định `u.role` là giá trị dùng để phân quyền.** Giá trị phân quyền là
   `COALESCE(role_catalog.base_role, u.role)`. Mọi so sánh vai trò phải đi qua giá trị này.
2. **Khi port từ JS sang Java, phải port cả *nguồn dữ liệu*, không chỉ chuỗi so sánh.** TASK-019 đã đổi
   chuỗi nhưng bỏ qua việc `roleBase` của Java không được nạp từ `role_catalog`.
3. **Ánh xạ nhiều-về-một không thể thay bằng ánh xạ 1:1.** `da_nv`→`project` là đúng nhưng thiếu
   `da_truong`→`project`; tương tự `kh_truong`, `kho_tong`, `thuky`.
4. **Quét tự động có giá trị**: 5 lỗi TASK-019 được phát hiện tình cờ; cổng quét toàn backend mới cho thấy
   đây là **lỗi hệ thống**, không phải 5 chỗ cá biệt.

---

## 8. VIỆC TIẾP THEO

- TASK-022: rà soát từng action Java thiếu `requireRole` so với JS.
- TASK-023: bổ sung mức quyền vào `ProjectScopeStore` rồi thêm `canAccessProject` cho `cancel_request`.
- TASK-024: chờ người dùng quyết định về `isCompanyLeadership`.
- TASK-B03: đóng gói lại JAR ở môi trường cho phép ghi `.m2` để thay đổi có hiệu lực thật.
