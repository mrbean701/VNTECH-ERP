# TASK-048 — NHẬT KÝ KIỂM TOÁN luồng Phiếu đề nghị: **5/6 mốc DONE (#87)**, mốc thứ 6 tách sang TASK-054

**Trạng thái:** **DONE (5/6 mốc, đã kiểm chứng lúc chạy 18/18)** · mốc `APPROVE_PARTIAL` ⇒ **TASK-054** (có lý do, không bỏ quên)
**Ngày:** 17/09/2026 · **Commit:** #69 (đo) · #70 (hồ sơ) · **#87 (port + kiểm chứng)**

---

## 1. Đã port 5/6 mốc, nguyên văn hợp đồng JS

| # | JS | action | Java | Kiểm chứng lúc chạy |
|---|---|---|---|---|
| 1 | `:980` | `CREATE` | ✔ `createRequest` (ngay sau `insertRequest`) | **ĐẠT** — 1 dòng `audit_logs`, `after_json` có `requestNo` |
| 2 | `:994` | `EDIT_RETURNED` | ✔ `updateReturnedRequest` | **ĐẠT** — `after_json` = `{"neededAt":"2026-12-30","priority":"high","area":"…","purpose":"…","lineCount":1}` |
| 3 | `:1019` | `RESUBMIT` | ✔ `resubmitRequest` | **ĐẠT** — `{"confirmedStage":1,"restartStage":1,"comment":""}` |
| 4 | `:1030` | `DELETE_RETURNED` | ✔ `deleteRequest` — **audit TRƯỚC khi xoá**, đúng thứ tự JS (1030 audit → 1031 batch DELETE) | **ĐẠT** — dấu vết **còn lại sau khi phiếu biến mất** |
| 5 | `:1062` | `CANCEL` | ✔ `cancelRequest` | **ĐẠT** — `{"reason":"probe TASK-048 hủy phiếu"}` |
| 6 | `:1101` | `APPROVE_PARTIAL` | ✘ **chưa** — xem mục 5 | không kiểm được (chưa port) |

**Hai cái bẫy đã tránh được nhờ đọc nguyên văn JS (bài học #13):**
* `EDIT_RETURNED.after.priority` = giá trị **THÔ** `clean(payload.priority)` — **không** phải giá trị đã mặc định hoá `"normal"` truyền vào `UPDATE` (probe kiểm đúng điều này: `priority:"high"`).
* `RESUBMIT.after.comment` = `clean(payload.comment)` **THÔ** — **không** phải biến `comment` cục bộ đã bị mặc định hoá thành `"CHT GỬI LẠI: …"` (probe kiểm: `"comment":""`).

## 2. Cổng kiểm chứng mới — `tools/probe-task048-audit-requests.mjs` (**18/18 ĐẠT**)

Cổng cũ `probe-task043-custom-fields.mjs` **chỉ** kiểm được mốc `CREATE`. Bốn mốc còn lại chỉ xảy ra khi phiếu đi qua `returned_to_requester`, nên probe mới **LÁI ĐÚNG LUỒNG NGHIỆP VỤ**:
* **Phiếu A:** tạo → Owner **từ chối** → `returned_to_requester` → sửa → gửi lại → từ chối lần 2 → **hủy**. Kiểm **chuỗi audit đúng thứ tự**: `CREATE → EDIT_RETURNED → RESUBMIT → CANCEL`.
* **Phiếu B:** tạo → từ chối → **xoá** ⇒ kiểm `DELETE_RETURNED` **sống sót sau khi phiếu bị xoá** + `before_json` giữ đúng 5 trường `mr` như JS.
* **DỌN SẠCH có kiểm chứng:** mọi bảng nghiệp vụ trở về **đúng số dòng ban đầu** (`material_requests` 17 · `material_request_items` 35 · `approvals` 100 · `approval_stage_decisions` 0 · `request_comments` 0 · `procurement_allocations` 91 · `custom_field_values` 0). `audit_logs` là bảng **append-only** — probe **không** xoá dấu vết kiểm toán (đó là bằng chứng).
* Đối chứng dương TRƯỚC khi vá: `SELECT COUNT(*) FROM audit_logs WHERE entity_type='material_request'` = **0** (in ra ở đầu probe).

## 3. 🔴 CỔNG `probe-audit-coverage.mjs` ĐÃ ĐO SAI — con số "152 action" là **HIỆN VẬT**

Bản cũ lấy **tên BIẾN** trong `SystemController` (`requestManagementUseCase` — camelCase) rồi tra vào bảng khoá theo **tên LỚP** (`RequestManagementUseCase` — PascalCase) ⇒ tra **không bao giờ khớp** ⇒ `CẢ HAI ĐỀU GHI` luôn = **0** và "khe hở" luôn = **ĐÚNG số action JS có audit (152)** — tức một **hằng số**, không phải phép đo. Cổng này **không có đối chứng dương** nên sai lặng lẽ.

**Đã sửa** (chuẩn hoá PascalCase + **thêm đối chứng dương** `186/186 nhánh case tra được lớp`). Số ĐÚNG:

| Chỉ số | Trước (sai) | Sau (đúng) |
|---|---|---|
| Khe hở "JS ghi mà Java không ghi" | 152 | **128** |
| "Cả hai đều ghi" | 0 | **24** action |
| Lớp use-case có audit | 2/21 | **3/21** |

⚠️ **Mọi tài liệu ghi "152 action" đều phải đọc lại thành 128.** Khe hở vẫn rất lớn (128 hành động) nhưng **không** phải con số cũ.

## 4. Lỗi của chính tôi ở lượt này (ghi lại đầy đủ)

1. **Phép kiểm `CREATE` trong `probe-task043-custom-fields.mjs` CHƯA BAO GIỜ CHẠY** — bản trước gọi `q1(requestId)`, hàm **không tồn tại** ⇒ probe **ném lỗi**, nhưng tôi đọc dòng "19/20 ĐẠT" và tưởng phép kiểm đã chạy và HỎNG. Sự thật: probe **dừng sớm**, 7 phép kiểm sau không chạy. Đã sửa (`q`) ⇒ probe này nay **27/27 ĐẠT**.
2. **Câu SQL dọn dẹp trong `finally` bị hỏng vì gộp nhiều câu** — `procurement_allocations` **không có** cột `request_id` (cột thật `request_item_id`) ⇒ lệnh mysql dừng tại câu 5, **6 câu sau không chạy** ⇒ dữ liệu probe còn nằm lại (phiếu A `cancelled` + 1 dòng vật tư + 1 dòng phân bổ). Đã dọn tay có kiểm chứng + sửa probe thành **mỗi câu một lần chạy, gom lỗi, không câu nào chặn câu nào**.
3. **Lại nuốt `stderr`** (`2>$null`) khiến lần chạy ĐẠT-hết vẫn thoát mã 1 mà tôi không thấy lý do; nguyên nhân là một dòng *thông tin* đọc cột không tồn tại (`document_sequences.sequence_key/last_value` — cột thật `document_type`/`last_number`). Đã bọc `try/catch` để dòng thông tin **không bao giờ** làm hỏng kết quả. **Bài học #15 lặp lại với chính tôi.**

## 5. Vì sao mốc thứ 6 (`APPROVE_PARTIAL`) tách sang **TASK-054**

Không thể "chỉ thêm một lời gọi audit": nhánh `all_roles` trong JS (`:1087-1103`) có **3 hành vi Java CHƯA port**, và lời gọi audit **nằm giữa** chúng:

1. `roleCode = matchedApprovalRole(user, stageConfig) || (isAdmin(user) ? required.find(code => !approved.has(code)) || "" : "")` — **Java thiếu hẳn nhánh ADMIN điền vai trò còn thiếu** (Java ném lỗi nếu không khớp vai trò).
2. JS tính `missing` = vai trò bắt buộc **chưa** xác nhận; nếu còn thiếu ⇒ **cập nhật comment tiến độ và RETURN SỚM (không chuyển bước)**. **Java hiện CHUYỂN BƯỚC ngay** khi một vai trò xác nhận — chú thích trong mã tự nhận *"đơn giản: tiếp tục như single"*.
3. Chỉ sau đó mới `audit(...,"APPROVE_PARTIAL",...)`.

⇒ Đây là **lỗi đúng/sai của luồng duyệt song song**, phải port **cả hành vi**, có probe riêng. Ép nó vào TASK-048 sẽ là "port nửa vời" đúng thứ tôi đã cảnh báo. Hồ sơ: **`docs/agent-progress/TASK-054.md`**.
**Dữ liệu hiện tại có bước `all_roles` hay không: cần đo trước khi làm TASK-054** (nếu không có thì phải kiểm bằng cách khác — nêu trong hồ sơ 054).

## 6. Tệp đã sửa (#87)

* `java-backend/application/.../service/RequestManagementUseCase.java` — 5 lời gọi `auditLog.log(...)` + import `AuditLogPort`/`MiniJson` + tham số constructor.
* `java-backend/web/.../config/ApplicationBeansConfig.java` — nối `AuditLogPort` vào `requestManagementUseCase`.
* `tools/probe-task048-audit-requests.mjs` — **mới** (18/18).
* `tools/probe-task043-custom-fields.mjs` — sửa lỗi `q1` ⇒ nay **27/27**.
* `tools/probe-audit-coverage.mjs` — sửa phép tra lớp + thêm **đối chứng dương** (152 ⇒ **128**).
