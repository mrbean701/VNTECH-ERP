# TASK-048 — KHE HỞ `audit(...)`: nhật ký kiểm toán của Java thiếu gần như TOÀN HỆ THỐNG

**Trạng thái:** **ĐANG LÀM** — đã **đo xong** + **chốt lát cắt** + **ghi lại hợp đồng audit của JS** (hồ sơ này); phần port mã **chưa xong**.
**Ngày:** 17/09/2026 · **Commit đo lường:** #69 (`9b39ed7`) · **Hồ sơ này:** #70

---

## 1. Số đo (cổng mới `tools/probe-audit-coverage.mjs`)

| Phía | Số đo |
|---|---|
| JS `scripts/system-route.mjs` | **174 action — 152 action CÓ gọi `audit(...)`** |
| Java `SystemController` + 21 lớp use-case | **186 nhánh `case` — chỉ 2/21 lớp use-case có gọi `auditLog.log(...)`** (`MaterialCatalogManagementUseCase` #68, `ProjectManagementUseCase` #67; cộng `AuthUseCase` dùng cổng này ở 4 chỗ) |
| Kết luận | **152 action JS ghi nhật ký mà Java KHÔNG ghi** |
| Bằng chứng trực tiếp | `SELECT COUNT(*) FROM audit_logs WHERE entity_type='material_request'` = **0 dòng** |

**GIỚI HẠN của phép đo (bắt buộc nói rõ, nếu không sẽ hiểu sai):**
* `AuditTrailFilter` (tầng web) **ghi 1 dòng `audit_logs` cho MỖI request** ⇒ bảng **không trống**, nhưng bản ghi đó chỉ là *"POST action X"* — **không có `before_json`/`after_json` nghiệp vụ** như JS.
* Phép đo Java là **theo LỚP use-case**, không theo từng method: một lớp có audit ở method A vẫn bị tính "có" cho method B ⇒ **phải đọc mã từng luồng** trước khi kết luận.

## 2. Lát cắt chọn làm trước — **6 action luồng Phiếu đề nghị** (P2 lõi)

Java **đã có đủ 6 method** trong `RequestManagementUseCase`: `createRequest` (L53) · `updateReturnedRequest` (L328) · `resubmitRequest` (L357) · `deleteRequest` (L384) · `cancelRequest` (L399) · `decideApproval` (L418) ⇒ **chỉ thiếu lời gọi audit**, không phải viết luồng mới.

**Hợp đồng audit của JS — TRÍCH NGUYÊN VĂN (để port không phải đoán):**

| # | JS | action | entity | before | after |
|---|---|---|---|---|---|
| 1 | `:980` | `CREATE` | `material_request` | `null` | `{ requestNo, projectId, contractId, boqVersionId, lineCount: normalizedLines.length, newMaterialCount: 0, mappingMode: "strict_internal_material", total, dynamicFields: true }` |
| 2 | `:994` | `EDIT_RETURNED` | `material_request` | `mr` (dòng phiếu TRƯỚC khi sửa) | `{ neededAt, priority: clean(payload.priority), area: clean(payload.area), purpose: clean(payload.purpose), lineCount: lines.length }` |
| 3 | `:1019` | `RESUBMIT` | `material_request` | `mr` | `{ confirmedStage: firstStage.stageNo, restartStage: currentStage, comment: clean(payload.comment) }` |
| 4 | `:1030` | `DELETE_RETURNED` | `material_request` | `mr` | `{ reason: clean(payload.reason) \|\| "CHT xóa phiếu bị trả lại để lập mới" }` |
| 5 | `:1062` | `CANCEL` | `material_request` | `mr` | `{ reason }` |
| 6 | `:1101` | `APPROVE_PARTIAL` | `material_request` | `mr` | `{ stage, stageName: stageConfig.name, roleCode, missing }` — chỉ ở nhánh duyệt **nhiều vai trò** (`all_roles`): đã xác nhận một phần, còn `missing` vai trò |

## 3. Kế hoạch port (bước kế tiếp, làm được ngay)

1. `RequestManagementUseCase`: thêm `private final AuditLogPort auditLog;` + tham số constructor; import `AuditLogPort` + `MiniJson` (`application/support/MiniJson.java` — đã có từ #68).
2. Chèn 6 lời gọi đúng **sau** thao tác ghi tương ứng (giống JS: ghi xong mới audit), dùng `MiniJson.stringify(...)` cho `before`/`after`; `mr` của Java là `store.findRequestBasic(requestId)` (đã có sẵn trong mỗi method) — nếu cần before đầy đủ thì dùng dòng `material_requests` hiện có.
3. `ApplicationBeansConfig.requestManagementUseCase(...)`: thêm `AuditLogPort`.
4. Build + mở rộng probe TASK-043 để khẳng định **có dòng `audit_logs` `entity_type='material_request'`** với `action='CREATE'` + `after_json` hợp lệ (hiện **0 dòng**) — đây là bằng chứng "trước → sau".
5. Commit + cập nhật `MASTER_STATUS`/`TASK_INDEX`.

## 4. Sau lát cắt này
Thứ tự đề xuất (theo cổng đo, ưu tiên P2 lõi): **mua hàng/PO** (`purchaseManagementUseCase`) → **kho** (`stockManagementUseCase`) → **tổ đội/sản lượng** (`productionManagementUseCase`) → **nhà cung cấp** (`supplierManagementUseCase`) → **công việc** (`opsTaskManagementUseCase`) → **admin** (`adminOpsManagementUseCase`, `adminSystemUseCase`, `userManagementUseCase`).

> **Đây là hạng mục LỚN (152 action).** Cách làm đúng theo GOAL §11: mỗi lát cắt phải có probe chứng minh **có dòng audit đúng `action`/`entity_type`/`before`/`after`**, không đánh dấu DONE theo số lượng lời gọi đã thêm.
