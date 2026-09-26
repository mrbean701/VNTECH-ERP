# TASK-036 — GOAL §8: hai cột cấu hình của bước workflow KHÔNG được thi hành ở đâu cả

**Trạng thái:** DONE (điều tra — có kết luận + phân loại; **không tự sửa**)
**Nguồn yêu cầu:** **GOAL §8** — phải xác định rõ *"approver · department · **permission**"* của bước workflow;
và **GOAL §7** — thao tác "duyệt" phải được kiểm quyền ở backend.
**Ngày:** 18/09/2026

---

## 1. Câu hỏi đã kiểm

Hai cột trong `workflow_steps` (bảng P4) tự khai là có vai trò cấu hình quyền:

| Cột | COMMENT trong DDL MySQL `V8__workflow_multi.sql` |
|---|---|
| `required_permission` | *"Quyền cần có để được chọn làm người duyệt"* |
| `allow_skip_level` | *"Cho phép cấp bậc cao hơn duyệt vượt cấp"* |

⇒ Chúng **có thật sự được thi hành** ở đâu không?

## 2. Bằng chứng — quét toàn kho

### 2.1 Trong toàn bộ mã KHÔNG PHẢI SQL: **0 chỗ**

Quét `*.tsx *.ts *.mjs *.js *.sql` (trừ `node_modules`, `target`, `dist`, `.next`) cho cả camelCase lẫn
snake_case (`requiredPermission` | `required_permission` | `allowSkipLevel` | `allow_skip_level`):

```
tổng 9 chỗ — TẤT CẢ đều là SQL:
  drizzle/0080_...sql:37,38,73        (khai báo cột + INSERT seed)
  V8__workflow_multi.sql:16,46,47,80  (khai báo cột + chú thích + INSERT seed)
  schema-h2.sql:2245,2246             (lược đồ cho test)
```

⇒ **KHÔNG một tệp TS/TSX/JS/MJS nào** tham chiếu hai trường này. Nghĩa là **UI không dùng** chúng.

### 2.2 Trong Java: chỉ GHI và HIỂN THỊ, không THI HÀNH

| Vị trí | Việc đang làm |
|---|---|
| `OpsTaskManagementUseCase.java:441-442` | đọc từ payload admin → ghi vào bước |
| `OpsTaskStoreAdapter.java:309` | đọc để trả về màn quản trị |
| `OpsTaskStoreAdapter.java:363,366-367` | INSERT/UPDATE khi lưu workflow |
| `BootstrapDataAdapter.java:569` | đọc để đưa vào payload `bootstrap` |
| `scripts/system-route.mjs` | **0 chỗ** (không tham chiếu) |

**Không nơi nào đọc chúng để quyết định cho phép/từ chối.** Cụ thể đường phê duyệt
(`RequestManagementUseCase.canApproveRequestStage`, `decideApproval`) **không** hề nhắc tới hai cột này.

### 2.3 Form quản trị cũng KHÔNG gửi chúng

`app/page.tsx:3834` là form cấu hình bước; nó có ô cho `slaHours` và `approvalMode` (và tên/mô tả) —
**không có ô nào** cho `allowSkipLevel` hay `requiredPermission`. Khớp với việc cả hai tên không xuất hiện
lần nào trong UI.

## 3. KẾT LUẬN + PHÂN LOẠI

| Nhận định | Phân loại |
|---|---|
| Hai cột tồn tại trong **cả hai** DDL (drizzle `0080` + MySQL `V8`) | `CONFIRMED` |
| Được API admin **parse** và được trả về trong `bootstrap` | `CONFIRMED` |
| **KHÔNG** UI nào render, **KHÔNG** form nào gửi | `CONFIRMED` |
| **KHÔNG** được đọc trong bất kỳ quyết định cấp quyền nào | `CONFIRMED` |
| ⇒ Hôm nay **không gây hại thực tế** (không ai đặt được giá trị qua UI) | `CONFIRMED` |
| ⇒ Rủi ro **TƯƠNG LAI**: thêm ô nhập (hoặc gọi API trực tiếp) sẽ tạo ra **hạn chế "im lặng không tác dụng"** — quản trị viên tưởng đã giới hạn người duyệt, thực tế **không** | `LIKELY` |

**Mức độ: THẤP (tiềm ẩn)** — không phải lỗi đang hoạt động, không rò rỉ quyền (đường phê duyệt vẫn được
kiểm bằng `allowed_role_codes` + pool chỉ định + quyền module). Nhưng đây là **bẫy cấu hình** cần ghi lại.

## 4. Giá trị trả lời cho GOAL §8 — chiều "permission" của bước

> Quyền của một bước workflow **KHÔNG** đến từ `required_permission`.
> Nguồn quyền duyệt thực tế gồm **ba** thứ:
> 1. `approval_stage_catalog.allowed_role_codes` (so cả `role` lẫn `baseRole`)
> 2. pool chỉ định đích danh = `workflow_step_approvers` (P4) ∪ owner của bước (`approval_project_assignments`)
> 3. quyền module `approvals` / `requests.canApprove` ở tầng action
>
> `required_permission` và `allow_skip_level` **không** nằm trong bất kỳ nguồn nào ở trên.

## 5. Củng cố bức tranh tổng thể về lớp P4 (với TASK-035)

Lớp "workflow đa luồng" P4 hiện là một **tính năng xây dựng dở dang**, bằng chứng hội tụ từ **4 phép đo độc lập**:

| Phép đo | Kết quả |
|---|---|
| JS có tham chiếu 3 bảng P4? | **0** (TASK-035) |
| `version` có hoạt động không? | **Không** — `UNIQUE (workflow_id, step_no)` (TASK-035) |
| 2 cột cấu hình có được thi hành không? | **Không** (TASK-036) |
| Action quản trị workflow có ở JS không? | **Không** — Java-only (`save_workflow`…) (TASK-022b) |

⇒ P4 = **bảng dữ liệu + màn quản trị (Java-only) + seed một lần**, **chưa** nối vào nghiệp vụ phía JS và
chưa có versioning thật.

## 6. QUYẾT ĐỊNH — KHÔNG tự sửa

* **Thi hành** `required_permission`/`allow_skip_level` là **thay đổi nghiệp vụ** (ai được duyệt) ⇒ GOAL §8
  cấm tự quyết.
* **Xoá cột** là thay đổi lược đồ ⇒ phải có kế hoạch migration + đánh giá tương thích ngược.

⇒ Chỉ báo cáo + hỏi.

## 7. CÂU HỎI CẦN NGƯỜI DÙNG QUYẾT ĐỊNH

> **1.** `required_permission` (quyền cần có để làm người duyệt bước) — **có cần thi hành thật** không?
> Nếu có, nó nên **thu hẹp** hay **mở rộng** tập người duyệt hiện tại (pool chỉ định ∪ vai trò)?
> **2.** `allow_skip_level` (cấp bậc cao hơn duyệt vượt cấp) — **có cần thi hành** không? Lưu ý: khái niệm
> vượt cấp **đã** được làm cho **cấp bậc hệ thống** (`system_level_catalog.can_skip_levels`, có dùng trong
> `UserManagementUseCase`), nhưng **chưa** làm cho **bước workflow**.
> **3.** Nếu **không** cần thi hành: giữ cột lại (ghi rõ là "dự trữ") hay **gỡ** khỏi lược đồ + payload để
> tránh bẫy cấu hình về sau?

## 8. Files Changed

**Không sửa mã.** Chỉ điều tra + ghi hồ sơ.

## 9. Testing / Validation

| Phép kiểm | Kết quả |
|---|---|
| Quét toàn kho 4 tên trường (camel + snake) trên `*.tsx *.ts *.mjs *.js *.sql` | 9 chỗ, **tất cả là SQL** |
| Quét Java `required_permission`/`requiredPermission` | 5 chỗ — ghi/đọc/hiển thị, **không thi hành** |
| Kiểm `canApproveRequestStage` + `decideApproval` | **không** nhắc tới 2 cột |
| Kiểm form quản trị bước (`page.tsx:3834`) | chỉ có `slaHours` + `approvalMode` |

## 10. Next Task

* Chờ người dùng trả lời mục 7. Nếu chọn "thi hành" → mở task riêng (đổi nghiệp vụ, phải có test quyền).
* Gộp mục 5 vào báo cáo tổng thể về lớp P4.

## 11. Continuation Notes

1. **Đừng** giả định một cột có `COMMENT` mô tả quyền nghĩa là nó **được thi hành**. Kiểm bằng cách quét
   xem có ai **ĐỌC** nó trong nhánh quyết định hay không.
2. Khi grep trường kiểu này, **phải quét cả camelCase lẫn snake_case** — payload dùng camel, DB dùng snake;
   chỉ quét một dạng sẽ kết luận sai.
3. Bẫy cần nhớ: **"cấu hình im lặng không tác dụng"** nguy hiểm hơn "không có cấu hình", vì quản trị viên
   tin rằng mình đã giới hạn được quyền.
