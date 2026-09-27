# TASK-MT3-BE-02 — Danh sách CHỜ DUYỆT: sắp xếp + giữ phiếu quá hạn SLA thêm 72h

| Mục | Nội dung |
|---|---|
| **Task** | P3-BE-02 |
| **Phase** | **GĐ2 — BACKEND** |
| **Status** | 🟡 **KHẢO SÁT XONG** · ⏳ **CHƯA SỬA MÃ** (⛔ không tự nhận DONE) |
| **Requirement** | MT3 §B.1: danh sách phiếu **chờ duyệt** phải **sắp xếp** đúng và **giữ phiếu quá hạn SLA thêm 72 giờ** (⛔ không biến mất sớm). ⚠️ Cặp đôi với **P3-BE-03** (quá 72h ⇒ **tự từ chối**, idempotent). |

## KẾT QUẢ KHẢO SÁT (đo trên mã — ⛔ không giả định)
### 1) Chuỗi dữ liệu THẬT của danh sách chờ duyệt (đã lần theo đủ 3 tầng)
| Tầng | Vị trí |
|---|---|
| **Giao diện** | `app/screens/WorkCenter.tsx:51` — gọi `POST /api/system {action:"director_pending_approvals"}` (ghi chú `:37`: MT2-P4-03, backend **tự chặn 403 theo CẤP BẬC**) |
| **Điều khiển** | `SystemController.java:1353` — `case "director_pending_approvals"` |
| **Nghiệp vụ** | `OpsTaskManagementUseCase.java:101` — `directorPendingApprovals(Principal)` (ngưỡng cứng `level_rank >= 30` theo ghi chú `WorkScopeService.java:17`) |
| **Lưu trữ** | **`OpsTaskStore.pendingApprovalsForRoleCodes(List<String>)`** — khai `OpsTaskStore.java:132` · cài đặt **`OpsTaskStoreAdapter.java:560`** |

### 2) ⚠️ SỰ THẬT QUAN TRỌNG: **ĐÃ CÓ `ORDER BY`** — ⛔ không phải «chưa sắp xếp»
Câu SQL hiện tại (`OpsTaskStoreAdapter.java:560`):
```sql
SELECT id,stage,department,entity_type AS "entityType",entity_id AS "entityId",
       request_id AS "requestId",due_at AS "dueAt",approver_user_id AS "approverUserId",
       allowed_role_codes_snapshot AS "allowedRoleCodesSnapshot"
FROM approvals WHERE status='pending' ORDER BY due_at,id
```
⇒ **Đã sắp theo `due_at` rồi `id`** (hạn gần nhất lên trước).
⚠️ **⇒ PHẢI ĐỌC NGUYÊN VĂN MT3 §B.1 TRƯỚC KHI SỬA** để biết thứ tự mong muốn có **khác** thứ tự hiện tại không (ví dụ: phiếu **QUÁ HẠN lên đầu**, rồi mới tới hạn gần). ⛔ **KHÔNG tự đổi thứ tự khi chưa có câu chữ của đề bài.**

### 3) ⚠️ VỀ «GIỮ QUÁ HẠN 72 GIỜ» — hiện **KHÔNG có bộ lọc thời gian nào**
- Truy vấn **⛔ không lọc theo `due_at`** ⇒ mọi phiếu `status='pending'` đều được trả về, **kể cả quá hạn rất lâu**.
- ⇒ **«Giữ 72h» hiện đã đúng ở nghĩa «không lọc mất sớm»**, NHƯNG **chưa có mốc 72h nào được thể hiện**:
  ⛔ chưa có chỗ nào **phân biệt** phiếu *trong hạn* · *quá hạn ≤72h (phải giữ)* · *quá hạn >72h (phải tự từ chối — P3-BE-03)*.
- ⇒ **Phần việc thật của P3-BE-02** rất có thể là: **thể hiện/đánh dấu mốc 72h** + **làm rõ thứ tự ưu tiên**, ⛔ **không phải** «thêm điều kiện giữ» (vì hiện không hề lọc mất).
- 📌 **Ghi chú dữ liệu**: hạn của bước = `approvals.due_at`, đặt lúc tạo = `now + approval_stage_catalog.sla_hours * 3600` (mặc định 8 giờ khi chưa cấu hình) — nguồn: chú thích `RequestManagementUseCase.decideApproval` (MT2-P1-07/P4 §4.4). ⛔ **KHÔNG dùng `task_sla_policies`** (đó là SLA CÔNG VIỆC, ⛔ không có cột thời lượng).

### 4) Liên quan trực tiếp với P3-BE-03 (⛔ không tách rời)
- **P3-BE-03** = **quá hạn +72h ⇒ TỰ ĐỘNG TỪ CHỐI**, phải **idempotent** (gọi lại ⛔ không phá dữ liệu) + **7 test biên**.
- ⇒ Hai task là **hai nửa của cùng một luật 72h**: `due_at + 72h`. Phải **chốt nguyên văn §B.1** rồi làm **liền mạch**, ⛔ tránh sửa 2 lần cùng một truy vấn.

## Files dự kiến phải sửa (⏳ khi triển khai)
`OpsTaskStoreAdapter.java:560` (truy vấn + thứ tự + mốc 72h) · có thể `OpsTaskManagementUseCase.java:101` (lọc/đánh dấu) · `OpsTaskStore.java:132` (nếu đổi chữ ký) · test mới trong `web/src/test/...`.

## Testing hiện tại (nền vẫn sạch — đo sau P3-BE-01)
| Cổng | Kết quả |
|---|---|
| `mvn -f java-backend/pom.xml test` | ✅ **65/65 ĐẠT** · `BUILD SUCCESS` |
| `tools/verify-java-compile.ps1` | ✅ 115 tệp · 0 lỗi |
| `tsc` · contract · regression · `verify:css-baseline` · `verify:master-baseline` | ✅ đều ĐẠT |

## Blockers
⛔ **Không blocker cứng.** ⚠️ Cần **đọc nguyên văn MT3 §B.1** (quy tắc 72h + thứ tự mong muốn) **trước khi sửa** — ⛔ nếu tự đoán thứ tự sẽ **phá hành vi đang chạy** (vi phạm RULE 13).

## 🛑 BLOCKED — CẦN USER CHỐT (đã hỏi, hết thời gian chờ, chưa được trả lời)

### Bằng chứng về việc KHÔNG truy xuất được nguyên văn §B.1
- Tìm **khắp dự án** tệp master task 3: ⛔ **KHÔNG có tệp nào** (`docs/` chỉ có hồ sơ tiến độ của tôi; grep `MASTER TASK 3` chỉ khớp `MASTER_STATUS.md` + `TASK_INDEX.md` do tôi viết).
- ⇒ Nguyên văn §B.1 nằm ở **phần hội thoại đã bị NÉN** khỏi context ⇒ ⛔ **không đọc lại được**.
- ⇒ Theo **RULE 10 (⛔ không tự phát minh nghiệp vụ)**, tôi **KHÔNG tự chọn** thứ tự/mốc 72h.

### GIẢ ĐỊNH MẶC ĐỊNH tôi đang áp dụng (⛔ không đổi hành vi đang chạy — theo RULE 13)
| Câu hỏi | **Mặc định tôi áp dụng** | Lý do chọn mặc định này |
|---|---|---|
| Thứ tự danh sách | **GIỮ NGUYÊN `ORDER BY due_at, id`** (hạn gần nhất trước) | ⛔ Đổi thứ tự khi chưa có câu chữ đề bài = **phá hành vi đang chạy**; hiện đã sắp xếp ⇒ nhiều khả năng **đã đạt** §B.1 |
| «Giữ quá hạn 72h» | **GIỮ NGUYÊN** (không lọc thời gian ⇒ quá hạn vẫn hiển thị) | Truy vấn hiện **không lọc** ⇒ đã đúng nghĩa «⛔ không lọc mất sớm»; ⛔ thêm bộ lọc lúc này = **tự phát minh luật** |
| Ai tự từ chối sau 72h | **⛔ CHƯA làm** (thuộc P3-BE-03) | Đây là **luật nghiệp vụ mới** ⇒ ⛔ tuyệt đối không tự chế khi chưa có §B.1 |

⚠️ **Kết luận trung thực**: theo mặc định an toàn, **P3-BE-02 nhiều khả năng ĐÃ ĐẠT sẵn** (`ORDER BY` có sẵn + ⛔ không lọc mất sớm). Việc **chắc chắn còn thiếu** là **P3-BE-03** (tự từ chối sau 72h) — nhưng đó là **luật nghiệp vụ**, ⛔ **không được tự chế**.
⇒ ⛔ **KHÔNG tuyên bố P3-BE-02 DONE** vì chưa có câu chữ đề bài để đối chiếu.

### ❓ Cần user trả lời đúng 3 câu (đã gửi qua kênh chọn phương án, chưa có phản hồi)
1. Thứ tự danh sách chờ duyệt: **giữ nguyên** · quá hạn lên đầu · khác?
2. «Giữ quá hạn 72h»: giữ tới `hạn+72h` rồi tự từ chối · giữ vô hạn · khác?
3. Cơ chế tự từ chối: **khi đọc danh sách** (không cần job) · cần bộ định thời nền · khác?

### ➡️ KHÔNG chờ — chuyển sang task GĐ2 **KHÔNG phụ thuộc** câu trả lời này
Theo đúng tinh thần GOAL («⛔ không chờ USER nếu công việc tiếp theo đã rõ»), tôi chuyển sang **P3-BE-05** (tìm vật tư theo **tên chính + alias**) — task backend **độc lập**, ⛔ không liên quan luật 72h, và tôi **đã có nền tảng** từ P3-UI-13 (biết alias hiện lưu dạng **chuỗi phân tách `;`**).

## Next action
**P3-BE-05** — tìm vật tư theo tên chính + alias (backend). Quay lại **P3-BE-02/03 ngay khi user chốt luật 72h**.