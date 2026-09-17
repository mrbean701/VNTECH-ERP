# TASK-035 — GOAL §8: khi admin đổi workflow, hồ sơ đang pending theo bản CŨ hay bản MỚI?

**Trạng thái:** DONE (điều tra — có kết luận + phân loại; **không tự sửa kiến trúc**)
**Nguồn yêu cầu:** **GOAL §8 WORKFLOW RULE** — *"Nếu admin thay đổi workflow trong khi document đang pending: phải xác định document đó tiếp tục workflow version cũ hay chuyển sang version mới. Không tự quyết định nếu architecture hiện tại chưa xác định."*
**Ngày:** 18/09/2026

---

## 1. KẾT LUẬN NGẮN

> **KHÔNG có version pinning.** Hồ sơ đang chờ **KHÔNG** giữ bản cũ: mọi thuộc tính của bước
> (người duyệt · `approval_mode` · `allowed_role_codes`) được **tra tại thời điểm quyết định** từ
> bảng đang sống. Admin đổi cấu hình ⇒ **hồ sơ đang chờ đổi theo NGAY**.
> `workflow_definitions.version` **tồn tại nhưng KHÔNG hoạt động như versioning.**

## 2. BẰNG CHỨNG (đọc mã + dữ liệu sống, không suy đoán)

### 2.1 Hồ sơ KHÔNG lưu tham chiếu workflow — đo trên dữ liệu sống

`tools/show-bootstrap-array.mjs requests` → trường của `requests[0]`:

```
id · requestNo · projectId · projectCode · projectName · contractId · contractNo
· boqVersionId · boqVersionCode · teamId · teamName · requestedBy · requestedAt
· neededAt · priority · area · purpose · status · supplyStatus
· approvalStage = 5          <-- CHỈ một con số bước
· totalEstimatedValue · itemCount · totalQty · receivedQty · issuedQty · approvals · items · customFields
```

**KHÔNG có** `workflowId`, **KHÔNG có** `workflowVersion`, **KHÔNG có** bất kỳ tham chiếu workflow nào.
`requests[].approvals[]` cũng vậy: `requestId · stage · department · status · approverUserId · approverName
· queuedAt · dueAt · notifiedAt · reminderSentAt · decidedAt · comment` — **chỉ `stage` (số)**.

### 2.2 Bước được tra LIVE khi quyết định

`RequestStoreAdapter.java:270, 283`:
```sql
FROM approvals a LEFT JOIN approval_stage_catalog cfg ON cfg.stage_no = a.stage
```
⇒ tên bước / `allowed_role_codes` / `approval_mode` lấy từ **bảng đang sống theo `stage_no`**,
**không** từ bản chụp tại lúc tạo hồ sơ.

`RequestManagementUseCase.java:473-506` (`canApproveRequestStage`) cũng tra live:
```java
Set<String> pool = store.stageApproverUserIds(projectId, stage);   // bảng P4 đang sống
String owner = sv(stageRow, "ownerUserId");  pool.add(owner);      // phân công đang sống
String role = sv(stageRow, "allowedRoleCodes");                    // catalog đang sống
```

### 2.3 `version` KHÔNG hoạt động như versioning — xác nhận trên CẢ HAI DDL

| Nguồn | Ràng buộc duy nhất trên `workflow_steps` |
|---|---|
| `drizzle/0080_phase_p4_workflow_multi_identity.sql:46` | `UNIQUE INDEX workflow_steps_no_uidx (workflow_id, step_no)` |
| **MySQL đang chạy** `java-backend/.../V8__workflow_multi.sql` | `UNIQUE KEY workflow_steps_no_uidx (workflow_id, step_no)` |

Cột `version` có trong `workflow_definitions` (DEFAULT 1) nhưng **KHÔNG nằm trong khoá duy nhất** của
`workflow_steps` ⇒ **không thể tồn tại song song bước số 1 của bản v1 và bước số 1 của bản v2**.
⇒ Tăng `version` **không** tạo được một phiên bản mới của luồng.

### 2.4 Bảng P4 chỉ được GHI từ màn quản trị, không gắn với nghiệp vụ

`OpsTaskStoreAdapter.java:339-390` là nơi duy nhất ghi `workflow_definitions` / `workflow_step_approvers`
(`save_workflow` · `set_workflow_status` · `delete_workflow`). `workflow_step_approvers` được **seed MỘT LẦN**
từ `approval_project_assignments` ở migration (`drizzle/0080:80-86`) rồi **không** tự đồng bộ lại.

## 3. HỆ QUẢ NGHIỆP VỤ (rủi ro thật)

1. **Đổi người duyệt giữa chừng:** admin sửa `allowed_role_codes` hoặc phân công owner trong lúc hồ sơ
   đang chờ ⇒ hồ sơ đang chờ **đổi người duyệt ngay lập tức**. Không có bản chụp để đối chiếu.
2. **RỦI RO KẸT HỒ SƠ (`LIKELY` — suy từ logic mã, chưa thử):** nếu bước đang chờ bị tắt
   (`approval_stage_catalog.active=0`) hoặc bị xoá, thì `allowed` rỗng ⇒ nhánh
   `return !allowed.isEmpty() && roleEligible` cho **false** với MỌI người ⇒ hồ sơ **không ai duyệt được**
   và cũng **không có đường thoát** trong luồng duyệt.
3. **Không truy vết được "đã duyệt theo luồng nào":** vì không lưu `workflow_id`/`version`, không thể
   tái dựng cấu hình tại thời điểm duyệt ⇒ hạn chế kiểm toán (audit).

## 4. PHÁT HIỆN THÊM — SAI LỆCH JS ↔ JAVA về NGUỒN QUYỀN DUYỆT (`CONFIRMED`)

| | Nguồn quyền duyệt |
|---|---|
| **JS** (`scripts/system-route.mjs`, nguồn sự thật) | **0 tham chiếu** tới `workflow_definitions`, `workflow_steps`, `workflow_step_approvers` (đã kiểm bằng ranh giới từ — 12 khớp trước đó đều là `supply_workflow_steps`, bảng khác hẳn). Chỉ dùng `approval_project_assignments` + `allowed_role_codes`. |
| **Java** (`RequestManagementUseCase.canApproveRequestStage`) | pool = **P4 `workflow_step_approvers`** ∪ owner của bước, **cộng** đường vai trò |

⇒ **Java RỘNG HƠN JS**: người được chỉ định đích danh trong `workflow_step_approvers` duyệt được trên
Java nhưng **không** duyệt được trên JS. Và vì bảng P4 được seed một lần rồi có thể **trôi lệch** so với
`approval_project_assignments`, tập người duyệt hiệu dụng trên Java có thể chứa người **đã bị bỏ phân công**.

**Xếp cùng nhóm với TASK-029** (Java chặt/rộng hơn JS) — cần người dùng quyết định hướng khôi phục.

## 5. PHÁT HIỆN PHỤ — nhánh "bản chụp" trong UI là MÃ CHẾT (nhỏ)

`app/page.tsx:3594`: `const stageRule = currentApproval?.allowedRoleCodes ? currentApproval : stageConfig;`
Nhưng `requests[].approvals[]` **không có** trường `allowedRoleCodes` (đã đo) ⇒ `stageRule` **luôn**
là `stageConfig`. Nhánh "dùng bản chụp" không bao giờ chạy. Hành vi hiện tại **vẫn đúng** (cùng tra live
như Java) nhưng dòng mã gây hiểu nhầm rằng có bản chụp. Chỉ nên dọn khi làm UI, không phải lỗi nghiệp vụ.

## 6. QUYẾT ĐỊNH — KHÔNG tự sửa

GOAL §8 nói rõ: *"Không tự quyết định nếu architecture hiện tại chưa xác định."* Thêm version pinning là
**thay đổi kiến trúc workflow** (thêm bảng/khoá snapshot, đổi đường quyết định, ảnh hưởng dữ liệu đang
chạy) và có thể **phá 20+ bản ghi phê duyệt đang chạy** mà chính migration `0080` nói là phải giữ tương
thích ngược. ⇒ **Chỉ báo cáo**, không triển khai.

## 7. CÂU HỎI CẦN NGƯỜI DÙNG QUYẾT ĐỊNH

> **1.** Khi admin đổi cấu hình bước/phân công trong lúc hồ sơ đang chờ, hành vi **mong muốn** là:
> **(A)** giữ nguyên bản cũ cho hồ sơ đang chạy (cần bổ sung version pinning — thay đổi kiến trúc), hay
> **(B)** áp dụng ngay cấu hình mới (đúng hành vi hiện tại — **không cần sửa gì**)?
> **2.** Có cần **chặn** việc tắt/xoá một bước đang có hồ sơ chờ hay không (để tránh rủi ro kẹt hồ sơ ở mục 3.2)?
> **3.** Về sai lệch ở mục 4: giữ Java rộng hơn (đường P4) hay thu về đúng JS (chỉ legacy)?

## 8. Files Changed

**Không sửa mã.** Chỉ điều tra + ghi hồ sơ (đúng tính chất task discovery).

## 9. Testing / Validation

| Phép kiểm | Kết quả |
|---|---|
| Đo trường dữ liệu sống `requests` / `requests[].approvals` | không có tham chiếu workflow nào |
| Đọc DDL `drizzle/0080` **và** MySQL `V8__workflow_multi.sql` | `UNIQUE (workflow_id, step_no)` — không có `version` |
| Đếm tham chiếu P4 trong JS bằng ranh giới từ | **0** (12 khớp cũ là `supply_workflow_steps`) |
| Đọc `canApproveRequestStage` + `stageApproverUserIds` + `stageApprovalMode` | pool P4 ∪ owner, cộng đường vai trò |

## 10. Next Task

* Chờ người dùng trả lời mục 7. Nếu chọn **(A)** → mở task riêng cho version pinning (thay đổi kiến trúc,
  phải có kế hoạch migration + bảo toàn dữ liệu phê duyệt đang chạy).
* Gộp mục 4 vào nhóm quyết định của **TASK-029**.

## 11. Continuation Notes

1. **Đừng** suy ra "có bảng `workflow_*` nghĩa là có workflow engine". Ba bảng P4 hiện là
   **metadata + màn quản trị**, không điều khiển nghiệp vụ ở phía JS.
2. Khi grep bảng workflow, **phải dùng ranh giới từ** — `supply_workflow_steps` là bảng **khác hẳn**
   (chuỗi cung ứng) và sẽ làm sai số đếm.
3. Muốn xác nhận rủi ro 3.2 bằng thực nghiệm: tắt một bước đang có hồ sơ chờ rồi thử `decide_approval` —
   **nhưng việc này sẽ sửa dữ liệu nghiệp vụ**, nên chỉ làm khi có môi trường thử và người dùng đồng ý.
