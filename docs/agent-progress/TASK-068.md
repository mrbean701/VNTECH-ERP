# TASK-068 — QUYẾT ĐỊNH về NHẬT KÝ GHI TRÙNG: hai dòng BỔ SUNG cho nhau, KHÔNG thừa

**Trạng thái:** ✅ DONE (quyết định có bằng chứng — **KHÔNG đổi mã**, và ghi rõ vì sao)
**Ngày:** 17/09/2026 · **Nhánh:** `unity`
**Nguồn:** phát hiện của TASK-067 (Known Problems #64)

---

## 1. Vấn đề

Java sinh **2 dòng** `audit_logs` cho cùng một thao tác, với **mã hành động khác nhau**:

| Lớp | Mã hành động | Ví dụ |
|---|---|---|
| `AuditTrailFilter` (tầng web, P6) | **tên action thô** | `create_request` · `cancel_request` · `decide_approval` · `save_email_settings` |
| Use-case (nghiệp vụ) | **mã nghiệp vụ** (như JS) | `CREATE` · `CANCEL` · `APPROVE_PARTIAL` · `UPDATE` |

JS chỉ ghi **1 dòng/thao tác** (hàm `audit(..., request)` gom cả ngữ cảnh request lẫn chi tiết nghiệp vụ).

## 2. Câu hỏi phải trả lời TRƯỚC khi sửa

> Cách sửa hiển nhiên là cho FILTER bỏ qua các action đã có audit ở use-case. **Nhưng nếu bỏ thì MẤT GÌ?**

## 3. Đo bằng dữ liệu thật — hai dòng KHÔNG cùng chứa một thứ

| action | số dòng | có `ip_address` | có `module_key` |
|---|---|---|---|
| `create_request` (FILTER) | **80** | **80** | 80 |
| `decide_approval` (FILTER) | **173** | **173** | 173 |
| `cancel_request` (FILTER) | 15 | 15 | 15 |
| `save_email_settings` (FILTER) | 6 | 6 | 6 |
| `CREATE` (use-case) | **58** | **0** | **0** |
| `APPROVE_PARTIAL` (use-case) | 13 | **0** | **0** |
| `CANCEL` (use-case) | 15 | **0** | **0** |
| `UPDATE` (use-case) | 8 | **0** | **0** |

⇒ **Dòng FILTER** giữ **IP + module + quyền đã dùng**; **dòng use-case** giữ **mã nghiệp vụ + `before/after` đã lọc theo nghiệp vụ** nhưng **KHÔNG có IP**.

**Vì sao dòng use-case không có IP:** `AuditLogPort.log(userId, action, entityType, entityId, before, after)`
**không nhận ngữ cảnh request** — chỉ FILTER mới có `HttpServletRequest`. JS thì truyền `request` vào `audit(...)`.

## 4. QUYẾT ĐỊNH: **GIỮ CẢ HAI** (không đổi mã)

* Bỏ dòng FILTER ⇒ **mất IP** của 24 action đang ghi cả hai — **mất dấu vết pháp lý**, không chấp nhận.
* Bỏ dòng use-case ⇒ mất **mã nghiệp vụ + chi tiết đã lọc** — cũng mất thông tin.
* Hai dòng **không trùng nội dung**: chúng là *"ai/khi nào/từ đâu"* và *"đã làm gì với đối tượng nào"*.

**Hướng cải thiện ĐÚNG (ghi lại, chưa làm):** mở rộng `AuditLogPort.log(...)` để **nhận ngữ cảnh request**
(IP/user-agent) ⇒ dòng use-case tự đủ thông tin ⇒ **khi đó** mới cho FILTER bỏ qua 24 action ấy.
Điều kiện tiên quyết: phải **kiểm ở mức METHOD** cho từng action (cổng hiện đo theo **LỚP** use-case —
một lớp có audit ở method A vẫn bị tính "có" cho method B).

## 5. Hệ quả đã ghi vào hồ sơ

* Known Problems **#64** nay ghi rõ: *báo động giả đã bác bỏ* + *ghi trùng là **có chủ ý**, kèm lý do và hướng cải thiện*.
* **KHÔNG** thêm 24 action vào `SKIP_ACTIONS` của FILTER (việc đó sẽ mất IP).
* Số dòng `audit_logs` của Java **nhiều hơn** JS cho các thao tác đó — đây là **khác biệt có chủ ý**, đã ghi, không phải lỗi im lặng.

## 6. Giới hạn của kết luận

* Chỉ đo được các action **đã từng chạy**; 24 action "cả hai đều ghi" là danh sách **suy ra từ mã tĩnh**,
  chưa action nào được kiểm ở mức METHOD ⇒ **phần "hướng cải thiện" vẫn cần việc đó trước khi làm**.
* Phép đo `module_key`/`ip_address` để phân biệt hai nguồn ghi dựa trên việc `AuditLogPort.log` **không** điền
  hai cột này — đúng với mã hiện tại, nhưng nếu ai đổi adapter audit thì phép phân biệt này mất hiệu lực.
