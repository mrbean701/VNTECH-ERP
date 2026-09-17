# TASK-051 — `data.user` THIẾU 2 TRƯỜNG: cờ "bắt buộc đổi mật khẩu" KHÔNG BAO GIỜ hiện

**Trạng thái:** **DONE — đã vá cùng lượt với TASK-050.** Commit **#85**.
**Ngày:** 17/09/2026 · **Lớp lỗi:** đường ĐỌC thiếu trường (lần thứ **11**)

---

## 1. Bằng chứng hai phía

| Nguồn | Nội dung |
|---|---|
| **JS** `scripts/system-route.mjs:181` (và `:189`) | `SELECT u.id, u.full_name AS fullName, u.username, u.email, u.role, COALESCE(rc.base_role,u.role) AS roleBase, COALESCE(rc.name,u.role) AS roleName, **rc.warehouse_scope_kind AS warehouseScopeKind**, u.department, u.avatar_url AS avatarUrl, **u.must_change_password AS mustChangePassword** …` ⇒ **10 trường** |
| **Java** `SystemController.java:158-166` (trước khi vá) | chỉ ghi **8** trường: `id`, `fullName`, `username`, `role`, `roleBase`, `roleName`, `department`, `avatarUrl` ⇒ **thiếu `warehouseScopeKind` + `mustChangePassword`** |

## 2. Hệ quả ĐO ĐƯỢC (không suy đoán)

* `app/page.tsx:565`:
  `useState<string|null>(data.user.mustChangePassword ? "forcePassword" : (linkedRequest ? "detail" : null))`
  ⇒ modal **bắt buộc đổi mật khẩu** chỉ mở khi cờ này **truthy**. Trên lõi Java cờ là `undefined` ⇒ **modal KHÔNG BAO GIỜ mở**.
* Đây là **cửa duy nhất** trong UI đọc cờ đó: `grep mustChangePassword` toàn bộ thư mục `app/` chỉ ra **1 dòng** (`:565`). UI **không** đọc cờ từ phản hồi `login` (dù `AuthUseCase.LoginResult` của Java **có trả** `mustChangePassword`) ⇒ trước khi vá, việc bắt buộc đổi mật khẩu **chết hoàn toàn** ở lõi Java.
* **Mức ảnh hưởng trên dữ liệu HIỆN TẠI: 0 tài khoản** — đo trên MySQL: `SELECT COUNT(*) FROM users WHERE must_change_password=1` = **0** (cả 12 tài khoản đều `0`). Vậy lỗi là **tiềm ẩn**: nó chỉ lộ khi quản trị viên đặt cờ (đặt lại mật khẩu / tạo tài khoản mới). **Ghi trung thực: chưa có ca hỏng thật, nhưng đường bảo vệ đã bị vô hiệu.**

## 3. Cách vá

`SystemController` — ghi thêm 2 trường **ngay tại chỗ dựng `userMap`**:
`userMap.put("warehouseScopeKind", user.get().warehouseScopeKind());` và
`userMap.put("mustChangePassword", user.get().mustChangePassword());`
(`AuthUseCase.CurrentUser` **đã có sẵn** cả hai — `AuthUseCase.java:63-65`; không cần sửa truy vấn.)

## 4. Kiểm chứng

`tools/probe-task050-bootstrap.mjs` (mục 2) khẳng định:
* `[admin] data.user.mustChangePassword là boolean` — **ĐẠT**
* `[admin] data.user.warehouseScopeKind có mặt` — **ĐẠT**

**Giới hạn:** với dữ liệu hiện tại cờ luôn `false` và `warehouseScopeKind` luôn `null` (mọi vai trò đều NULL), nên probe chỉ chứng minh **khoá tồn tại + đúng kiểu**, **chưa** chứng minh được luồng modal thật (cần một tài khoản có cờ = 1 — thuộc kiểm thử thủ công của người dùng).

## 5. Phát hiện phụ (rộng hơn, chưa sửa)

`data.user` của JS còn **không** có `organizationUnitId`/`organizationCode`… (JS cũng chỉ 10 trường) ⇒ **không** đề xuất thêm gì ngoài JS.
