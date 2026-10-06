# TASK-143 — BẮT LỖI GẤP TAB «PHÂN QUYỀN NGƯỜI DÙNG» (vòng 214)

**Trạng thái:** ✅ **ĐÃ SỬA TẬN GỐC** · `npm test` **666 pass · 0 fail** EXIT=0 · vân tay nguồn `VNTECH-FP-E538CEA79AA2F9B7` (698 tệp) `verify` ĐẠT EXIT=0 · **chưa commit theo chỉ đạo của người dùng**.
**Ngày:** 02/10/2026 · **Người giao:** trực tiếp, yêu cầu gấp (không thuộc 110 mục master task).
**Phạm vi ghi tệp:** `app/screens/PermissionAccessPanel.tsx` · `tests/v214-phan-quyen-luu-quyen.test.mjs` (mới) · `lib/vntech-identity-data.mjs` · `VNTECH_FINGERPRINT.json` · `docs/dsh-state/*` · `testlog.md`.

---

## ① YÊU CẦU (nguyên văn)

> Lỗi phân quyền, không thể cấp quyền cho user từ tab Phân quyền người dùng: không sử dụng được copy quyền từ phòng ban, không lưu được quyền đã chọn cho user. Tiến hành bắt lỗi và xử lý gấp.

---

## ② NGUYÊN NHÂN GỐC — ĐO ĐƯỢC, KHÔNG SUY ĐOÁN

`app/screens/PermissionAccessPanel.tsx` dựng danh sách chức năng từ `data.moduleCatalog` bằng:

```ts
const assignableModules = (data.moduleCatalog || []).filter(
  (item) => Boolean(item.enabled !== false) && item.key !== "admin",
);
```

**Đo trên `GET /api/system` (76 dòng `moduleCatalog`):** một dòng có khoá
`active, groupKey, groupName, icon, label, moduleKey, sortOrder, systemLocked`.
⛔ **Không có `key`. ⛔ Không có `enabled`.**

⇒ `item.key === undefined` cho **cả 76 dòng**, và `.filter()` vẫn giữ hết ⇒ `Object.fromEntries(...)` **gộp 76 dòng thành MỘT khoá `"undefined"`** (đo được: `Object.keys(permissionState) === ["undefined"]`).

### Chuỗi gây hại (đo từng bước, không kết luận bừa)

| # | Mắt xích | Hậu quả người dùng thấy |
|---|---|---|
| 1 | State khởi tạo chỉ có khoá `"undefined"` | Ma trận hiện ô tick **TRỐNG** cho cả tài khoản **đang có quyền** |
| 2 | Phần vẽ dùng `entry.module.key` (**đúng**) nên tra `permissionState[đúng-khoá]` | ⇒ luôn trả `undefined` ⇒ ô luôn trống |
| 3 | `setAll` / `setColumnAll` / `columnState` đều dựng state bằng `assignableModules` (khoá `undefined`) | Bấm «Chọn tất cả» hoặc checkbox đầu cột ⇒ state chỉ còn khoá `undefined` |
| 4 | `page.tsx:3214` đọc `ps[item.key]` theo khoá **đúng** | ⇒ **76 module TẤT CẢ `false`** |
| 5 | Java `UserManagementUseCase:274` chỉ chặn payload **rỗng**; `:500` bỏ qua module có `want == 0` | ⇒ cổng P5.3 **không chạy** |
| 6 | `:278` `clearUserScopes(targetUserId)` | ⛔ **XÓA SẠCH toàn bộ quyền**, rồi chèn 76 dòng toàn `0` |
| 7 | `:312` trả «Đã lưu quyền hiệu lực…» | ⇒ **HTTP 200 + thông báo thành công + mất sạch quyền** |

**Đây chính là «không lưu được quyền đã chọn cho user».**

### Vì sao «copy quyền từ phòng ban» cũng bị quy cho là hỏng

`copyFromDepartment` ([page.tsx:2003](app/page.tsx#L2003)) dựng payload **trực tiếp từ `departmentModulePermissions`** ⇒ nó **tự thân đúng**, không qua panel. Nhưng sau khi copy, quản trị viên mở «Sửa quyền», thấy ô tick trống (mắt xích 1), bấm Lưu hoặc một nút hàng loạt ⇒ **kết quả copy bị xoá ngay**.

**Đo kiểm chứng nút copy (không chạy lệnh ghi — hàm này xóa thay thế toàn bộ):** mô phỏng payload của `copyFromDepartment` cho **cả 28 tài khoản** rồi áp **đúng quy tắc cổng P5.3**:

| Kết quả | Số tài khoản |
|---|---|
| Sao chép thành công | **27 / 28** |
| Phòng ban chưa cấu hình quyền nào | 1 — `admin` (đúng thiết kế) |

⇒ **Nút copy ở phía máy chủ KHÔNG hỏng.** Lỗi nằm ở phần hiển thị/lưu sau đó.

---

## ③ BỐN GIẢ THUYẾT SAI ĐÃ BỊ LOẠI TRỪ TRƯỚC KHI VÁ

Ghi lại vì nếu vá theo chúng thì máy sẽ **vẫn hỏng** mà lại mang thêm thay đổi chết:

| Giả thuyết | Kết luận | Bằng chứng |
|---|---|---|
| `intOf(Boolean)` trả 0 nên payload boolean hỏng | ❌ **Sai** | [UserManagementUseCase.java:715](java-backend/application/src/main/java/com/vntech/erp/application/service/UserManagementUseCase.java#L715): `"true"` ⇒ 1, `"false"` ⇒ 0 |
| `assertDepartmentAllowsPermissions` đọc `can_view` trong khi adapter trả camelCase | ❌ **Sai** | [UserAdminStoreAdapter.java:287](java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/UserAdminStoreAdapter.java#L287) dùng `SELECT *` ⇒ trả **khoá rắc** |
| Cổng P5.3 chặn nên copy/save trả 400 | ❌ **Sai** | Đo: **0 / 478** dòng quyền phòng ban bật mà thiếu `can_view` ⇒ cổng không chặn trường hợp nào |
| Ngoại lệ cấp bật tự động toàn quyền hỏng (`autogrant` vs `autoGrantAll`) | ❌ **Sai** | [UserAdminStoreAdapter.java:340](java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/UserAdminStoreAdapter.java#L340) alias `l.auto_grant_all AS autogrant` ⇒ đúng khoá Java đọc |

⇒ **KHÔNG sửa dòng Java nào.** Chỉ sửa `.tsx` ⇒ kiểm tra được ngay bằng `npm test`, **không cần build lại** (D-044).

---

## ④ CÁCH SỬA

```ts
const assignableModules = (data.moduleCatalog || [])
  .filter((item) => item.active !== false)                 // cột `active` thật
  .map((item) => ({ ...item, key: String(item.moduleKey) }));  // cột `module_key` thật

const moduleKeys = Array.from(new Set<string>(
  assignableModules.map((item) => item.key)
    .concat(entries.map((entry) => String(entry.module?.key ?? "")).filter((key) => key !== "")),
));
```

`moduleKeys` là khoá **hợp nhất**: danh mục module ∪ các dòng ma trận **thật sự được vẽ** (`entry.module?.key`, đúng đường truy cập mà [PermissionMatrix.tsx:78](app/screens/PermissionMatrix.tsx#L78) dùng). Ba nơi còn lại chuyển sang `moduleKeys`: `useState` khởi tạo · `setAll` · `setColumnAll` · `columnState`.

---

## ⑤ KIỂM CHỨNG

| Cổng | Kết quả |
|---|---|
| `tests/v214-phan-quyen-luu-quyen.test.mjs` | ✅ **6/6** · EXIT=0 |
| **Đối chứng âm** (tạm tháo bản vá trên tệp thật) | ✅ `fail 1` EXIT=1 · khôi phục **byte-identical** (`-ceq` True) |
| `npm test` (lint + kiểu + hồi quy + quy trình) | ✅ **666 pass · 0 fail** EXIT=0 (nền 660 + 6 vệ mới) |
| `node scripts/verify-vntech-fingerprint.mjs` | ✅ `VNTECH-FP-E538CEA79AA2F9B7` · source 698 files · brand/release verified · EXIT=0 |

**Vệ 5 của tệp thử là khoá lỗi:** nó chạy ngược **biểu thức cũ** trên 76 dòng giả lập và **bắt buộc phải ra đúng một khoá `"undefined"`** — nếu ai đó vô tình dọn dòng dữ liệu mô phỏng thì vệ này đỏ trước khi lỗi quay lại.

---

## ⑥ CÒN LẠI — CẦN NGƯỜI DÙNG

| # | Việc | Vì sao chưa tự làm |
|---|---|---|
| 1 | **Tải lại trang (Ctrl+F5) rồi thử lại** 2 thao tác trên dữ liệu thật | `save_user_access` là **thay thế toàn bộ rồi xoá** — tôi không được tự chạy trên tài khoản thật |
| 2 | ⏔ Lớp phòng vệ phía máy chủ: `saveUserAccess` nên **từ chối rõ ràng** payload mà mọi module đều không có quyền, thay vì âm thầm thay thế toàn bộ | Cần biên dịch Java — máy này không có Maven (D-044) |
| 3 | ⛔ Commit | Người dùng: «Chưa commit, để tôi xm trước». **Nhánh `unity`, không merge `main`.**

⛔ **Chưa commit, chưa push.** Ghi chú thêm: `giamdoc.demo` đang có **17 chức năng vượt quyền phòng ban** (gồm `admin`, `admin_tab_01..04`) ⇒ bấm «Sao chép từ phòng ban» cho tài khoản này sẽ **gỡ** 17 quyền đó. Đây là hệ quả đúng của nghĩa «sao chép = ghi đè bằng quyền phòng ban», nhưng cần nói rõ với người dùng.