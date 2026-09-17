# TASK-054 — NHÁNH DUYỆT SONG SONG `all_roles`: Java **chuyển bước sớm** + thiếu nhánh ADMIN + thiếu audit `APPROVE_PARTIAL`

**Trạng thái:** **CHƯA SỬA — đặc tả sẵn để port một lượt** (tách ra từ TASK-048 để không port nửa vời)
**Ngày:** 17/09/2026 · **Nguồn:** đối chiếu nguyên văn khi port 5/6 mốc audit của TASK-048 (#87)

---

## 1. Ba lệch hành vi, đối chiếu nguyên văn

| # | JS `scripts/system-route.mjs:1087-1103` | Java `RequestManagementUseCase.decideApproval` |
|---|---|---|
| 1 | `const required = stageRoleCodes(stageConfig)` — danh sách vai trò **bắt buộc** của bước (từ `allowed_role_codes`) | **không có** khái niệm `required` |
| 2 | `const approved = new Set(rows.map(r => r.roleCode))` — các vai trò **đã** xác nhận (DISTINCT `approval_stage_decisions`) | chỉ có `stageDecisionRoleExists(...)` (**một** vai trò) |
| 3 | `roleCode = matchedApprovalRole(...) ‖ (isAdmin(user) ? required.find(code => !approved.has(code)) ‖ "" : "")` — **ADMIN được điền vai trò còn thiếu** | Java: `if (roleCode.isEmpty()) throw Api(...)` ⇒ **thiếu hẳn nhánh admin** |
| 4 | Nếu còn vai trò thiếu ⇒ `UPDATE approvals SET comment = "Đã xác nhận a/b; còn chờ: …"` + `audit(..., "APPROVE_PARTIAL", …)` + **`return` SỚM — KHÔNG chuyển bước** | Java: ghi 1 quyết định rồi **đi tiếp xuống** `updateApprovalDecision(...)` ⇒ **CHUYỂN BƯỚC dù chưa đủ vai trò** (chú thích trong mã tự ghi *"đơn giản: tiếp tục như single nếu chưa đủ ở phiên bản này"*) |
| 5 | `audit(user.id,"APPROVE_PARTIAL","material_request",requestId,mr,{stage,stageName:stageConfig.name,roleCode,missing},request)` | **chưa có** |

**Bản chất:** lỗi **đúng/sai của luồng duyệt song song** — với bước `all_roles` cấu hình ≥2 vai trò, Java cho phép **một** vai trò duyệt là hồ sơ chuyển bước, tức **vô hiệu hoá** ràng buộc "mọi vai trò phải xác nhận".

## 2. Việc phải làm

1. `RequestStore`: thêm `List<String> stageDecisionRoles(String requestId, int stage)` (DISTINCT `role_code` WHERE `decision='approved'`) + cài trong `RequestStoreAdapter` (bảng `approval_stage_decisions.role_code` đã có sẵn — Java đã INSERT cột này).
2. `RequestManagementUseCase.decideApproval`: port **nguyên trạng** khối `all_roles` (mục 1 ở trên), gồm **nhánh admin điền vai trò thiếu**, cập nhật comment tiến độ, **RETURN SỚM**, và `auditLog.log(..., "APPROVE_PARTIAL", ...)`.
3. Kiểm chứng — **phải xác định trước bằng phép đo**: `SELECT stage_no,approval_mode,allowed_role_codes FROM approval_stage_catalog WHERE active=1 AND approval_mode='all_roles'`.
   * Nếu **có** bước `all_roles` thật ⇒ probe lái: tạo phiếu ở bước đó → 1 vai trò xác nhận → **khẳng định hồ sơ CHƯA chuyển bước** + có dòng `PROGRESS`/`APPROVE_PARTIAL` + `missing` đúng → vai trò thứ 2 xác nhận → **mới** chuyển bước.
   * Nếu **không có** bước nào ⇒ **KHÔNG tự tạo** cấu hình duyệt (dữ liệu workflow thuộc quyền người dùng): kiểm bằng **test đơn vị với `RequestStore` giả** trong `java-backend/application/src/test`, và ghi rõ trong báo cáo là *chưa kiểm được end-to-end trên dữ liệu thật*.
4. Cập nhật `MASTER_STATUS`/`TASK_INDEX`, commit.

## 3. Vì sao KHÔNG nhét vào TASK-048
Lời gọi audit nằm **giữa** ba hành vi chưa port; thêm audit mà không port hành vi sẽ tạo **dấu vết sai** (ghi "đã xác nhận một phần" trong khi mã vẫn chuyển bước) — tệ hơn là không ghi. Xem `TASK-048.md` mục 5.
