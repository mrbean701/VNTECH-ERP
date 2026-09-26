# TASK-037 — Rà cổng quyền của 12 action JAVA-ONLY

**Trạng thái:** DONE (điều tra — 0 rủi ro hiện tại; **1 điểm cổng mong manh** cần người dùng quyết)
**Nguồn:** GOAL §7 (authorization bắt buộc ở backend) · tiếp nối TASK-022b / TASK-036
**Ngày:** 18/09/2026 · **Commit:** #43

---

## 1. Câu hỏi đã kiểm

`RbacService.requireActionModule` có nhánh **MẶC ĐỊNH TỪ CHỐI** khi action khai `module = []`:

```java
if (PUBLIC_ACTIONS.contains(action)) return;
required = ActionRbacRegistry.modulesFor(action);
if (isAdmin(user)) return;                       // admin luôn qua
if (isCompanyLeadership(user) && !required.contains("admin")) return;
if (required.isEmpty())
    throw 403 "Thao tác chưa được khai báo quyền trong hệ thống.";   // <-- TỪ CHỐI
```

**8 trong 12** action Java-only có `module = []`. ⇒ Chúng bị **từ chối với mọi người trừ admin**.
Câu hỏi: việc từ chối đó có **chính đáng** (vốn đã chỉ admin dùng) hay đang **chặn oan chức năng thật**?

## 2. Bằng chứng — `tools/audit-java-only-actions.mjs`

| action | module | cổng ở controller | UI gọi? |
|---|---|---|---|
| `create_self_work_item` | `[dept_plan_tasks, dept_project_tasks]` | chỉ cần đăng nhập | **CÓ** |
| `delete_department_permission` | `[]` | **requireRequireAdmin** | không |
| `delete_system_level` | `[]` | **requireRequireAdmin** | CÓ |
| `delete_workflow` | `[admin]` | chỉ cần đăng nhập | CÓ |
| `rebuild_department_permissions` | `[]` | **requireRequireAdmin** | không |
| `save_department_permission` | `[]` | **requireRequireAdmin** | CÓ |
| `save_system_level` | `[]` | **requireRequireAdmin** | CÓ |
| `save_workflow` | `[admin]` | chỉ cần đăng nhập | CÓ |
| `set_system_level_status` | `[]` | **requireRequireAdmin** | CÓ |
| `set_user_system_level` | `[]` | **requireRequireAdmin** | CÓ |
| `set_workflow_status` | `[admin]` | chỉ cần đăng nhập | CÓ |
| `system_level_impact` | `[]` | **requireRequireAdmin** | không |

```
Action Java-only                        : 12
Có module rỗng (mặc định từ chối)        : 8
Rủi ro (rỗng module + KHÔNG chặn admin)  : 0
```

## 3. KẾT LUẬN PHẦN 1 — việc mặc định từ chối là **CHÍNH ĐÁNG**

Cả **8/8** action có `module = []` **đều đã được controller chặn bằng `requireRequireAdmin`** ⇒ chúng vốn
đã chỉ admin dùng được. Nhánh mặc-định-từ-chối **không** chặn oan chức năng nào.
(`create_self_work_item` có module thật nên đi theo đường kiểm quyền module bình thường.)

**Không phát hiện rủi ro nào ở phần này.** Phân loại: `CONFIRMED`.

## 4. KẾT LUẬN PHẦN 2 — một cổng **MONG MANH** cần lưu ý

Ba action **quản trị workflow** — `save_workflow` · `set_workflow_status` · `delete_workflow` — **KHÔNG**
được chặn bằng vai trò. Chúng chỉ cần **đăng nhập**, và cổng thật là quyền **module `admin`**
(`requireActionModule` kiểm `canUseModule(userId, "admin", …)`).

Đo dữ liệu thật (`tools/probe-module-permission-data.mjs`, bổ sung mục mới):

```
Số dòng quyền cho module 'admin': 0
Trong đó canUse = 1            : 0
Tài khoản KHÔNG phải admin mà có canUse=1: 0
```

⇒ **Hôm nay đúng**: chỉ admin vào được (bằng nhánh `isAdmin` trong `requireActionModule`), vì **không ai**
có module `admin`.

**Nhưng cơ chế khác hẳn các action quản trị còn lại** — chúng dùng `requireRequireAdmin` (chặn theo vai trò).
Hệ quả tiềm ẩn: nếu về sau có ai **được cấp quyền module `admin`** (qua màn "Phân quyền người dùng", hoặc
qua cơ chế cấp mặc định theo phòng ban), tài khoản đó **quản trị được workflow** mà **không** phải admin.

* Hôm nay: **không gây hại** (`0` dòng quyền module `admin`).
* Phân loại rủi ro: `CONFIRMED` (cơ chế) · mức độ **THẤP–TRUNG BÌNH (tiềm ẩn)** — phụ thuộc vào việc quyền
  module `admin` có bị cấp cho người khác hay không.

## 5. CÂU HỎI CẦN NGƯỜI DÙNG QUYẾT ĐỊNH

> Có nên thêm chặn **theo vai trò admin** cho 3 action quản trị workflow
> (`save_workflow`, `set_workflow_status`, `delete_workflow`) — để **nhất quán** với các action quản trị
> khác và để quyền quản trị workflow **không phụ thuộc** vào một dòng quyền module có thể bị cấp nhầm?
> * **(A)** Có — thêm `requireRequireAdmin` (thay đổi cổng quyền; cần xác nhận vì đây là hành vi phân quyền).
> * **(B)** Không — giữ nguyên: quyền quản trị workflow **là** một quyền module, cấp được cho người khác là **đúng thiết kế**.

**KHÔNG tự sửa**: đây là quyết định về mô hình phân quyền (GOAL §7 + §3 cấm tự phát minh nghiệp vụ).

## 6. Files Changed

* `tools/audit-java-only-actions.mjs` (mới) — rà cổng quyền 12 action Java-only
* `tools/probe-module-permission-data.mjs` — thêm mục "AI CÓ QUYỀN MODULE 'admin'?"
* `docs/agent-progress/TASK-037.md` (mới), `TASK-INDEX.md`, `MASTER_STATUS.md`
* **Không sửa mã nguồn.**

## 7. Testing / Validation

| Phép kiểm | Kết quả |
|---|---|
| `node tools/audit-java-only-actions.mjs` | **exit 0** — 0 rủi ro; 8/8 module-rỗng đều `requireRequireAdmin` |
| `node tools/probe-module-permission-data.mjs` | 0 dòng quyền module `admin`; 0 tài khoản không-admin có `canUse=1` |

## 8. Dependencies

* Kế thừa từ **TASK-022b** (12 action Java-only) và **TASK-036** (lớp P4 xây dở dang).
* Liên quan quyết định **TASK-029** (Java chặt/rộng hơn JS) — cùng chủ đề mô hình quyền.

## 9. Limitations

* Phép kiểm "UI gọi?" chỉ dò **tên action dạng chuỗi** trong `app/page.tsx`; nếu UI gọi qua biến động thì
  không phát hiện được. Với 12 action này, kết quả khớp với kỳ vọng nên độ tin cậy đủ.
* Chưa kiểm được **giá trị** `isCompanyLeadership` có mở đường cho nhóm lãnh đạo tới các action này không —
  với module `[admin]` thì `isCompanyLeadership` **không** được miễn (`!required.contains("admin")` là sai),
  nên kết luận ở mục 4 vẫn đúng.

## 10. Next Task

* Chờ người dùng trả lời mục 5. Nếu chọn **(A)** → sửa 3 nhánh `case` trong `SystemController.java`
  + chạy lại `probe-action-role-parity.mjs` và `audit-java-only-actions.mjs`.

## 11. Continuation Notes

1. **Đừng** kết luận "action không có ai gọi là chết" — `delete_department_permission`,
   `rebuild_department_permissions`, `system_level_impact` không thấy UI gọi nhưng vẫn có thể được gọi
   qua API trực tiếp; chúng vẫn được controller bảo vệ đúng.
2. Khi rà cổng quyền, phải xét **cả ba** tầng: `requireActionModule` (module) · `requireRequireAdmin`/`requireRole`
   (vai trò) · `AccessScopeService` (phạm vi). Một action "không thấy chặn admin" có thể vẫn được chặn bởi module.
3. `requireActionModule` có nhánh **mặc định từ chối** khi `module = []` — nhớ điều này khi thêm action mới:
   khai `module` rỗng **không** phải là "không kiểm gì" mà là **chỉ admin**.
