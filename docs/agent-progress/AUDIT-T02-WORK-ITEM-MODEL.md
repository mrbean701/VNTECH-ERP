# T-02 — AUDIT MÔ HÌNH DỮ LIỆU CÔNG VIỆC (`work_items`)

- **Ngày:** 20/09/2026 · **Trạng thái:** HOÀN THÀNH · **PHASE 3 — CÔNG VIỆC** (mục gốc; `T-03`/`T-04` phụ thuộc báo cáo này)
- **Phương pháp (§45):** đọc **cột/bảng/dữ liệu THẬT** trong MySQL. Không suy đoán. Phân loại **CÓ / THIẾU / UNKNOWN**.

## 1. `work_items` — 32 cột, **8 dòng thật**

```
id · task_no · department_code · work_group · title · description · project_id
source_module · source_type · source_id · source_no · work_step · dedupe_key · task_origin
assigned_to · assigned_by · assigned_at · due_at · priority · status · progress · required_output
waiting_reason · waiting_started_at · submitted_at · completed_at · completed_by
cancelled_at · cancelled_by · active · created_at · updated_at
```
**Độ phủ dữ liệu thật:** `progress` **8/8** · `cancelled_at` **4/8** · `due_at` **6/8**

## 2. CÁC BẢNG NỀN TẢNG ĐÃ CÓ (CONFIRMED)

| Bảng | Cột | Vai trò |
|---|---|---|
| **`work_item_events`** | `work_item_id` · `event_type` · `from_status` · `to_status` · `actor_user_id` · **`previous_assignee`** · **`new_assignee`** · `reason` · `detail_json` · `occurred_at` | **NHẬT KÝ SỰ KIỆN đầy đủ** — bao trùm cả **TaskHistory** và **lịch sử đổi người** |
| `task_notifications` | `work_item_id` · `user_id` · `channel` · `title` · `body` · `status` · `read_at` · `sent_at` · `last_error` | Thông báo theo người/kênh (có trạng thái + lỗi) |
| `task_sla_policies` | `department_code` · `status` · `responsibility_clock_runs` · `process_clock_runs` · `requires_reason` | Chính sách SLA **theo phòng × trạng thái** |
| `request_comments` | `request_id` · `user_id` · `comment` · `visibility` | Bình luận **chỉ cho PHIẾU**, **không** cho `work_item_id` |

## 3. ĐỐI CHIẾU VỚI YÊU CẦU

### T-03 — “Bổ sung trường còn thiếu: tiến độ · huỷ lúc · ghi chú · tệp”
| Yêu cầu | Kết luận | Bằng chứng |
|---|---|---|
| **tiến độ** | ✅ **ĐÃ CÓ** | `work_items.progress` (8/8 dòng có giá trị) |
| **huỷ lúc** | ✅ **ĐÃ CÓ** | `cancelled_at` + `cancelled_by` (4 dòng đã huỷ) |
| **ghi chú** | ⚠️ **CHỈ 1 TRƯỜNG** `description` — **KHÔNG có luồng bình luận nhiều dòng** cho công việc | `request_comments` khoá theo `request_id` ✗ |
| **tệp** | ❓ **UNKNOWN** — có bảng dùng chung `attachments` | **cột thật:** id · entity_type · entity_id · file_name · storage_key · mime_type · uploaded_by · created_at · updated_at (số dòng: 11) — *chưa xác định được có khoá `work_item_id` hay không* |
### T-04 — `TaskAssignment · TaskComment · TaskAttachment · TaskHistory · TaskParticipant`
| Yêu cầu | Kết luận | Bằng chứng |
|---|---|---|
| **TaskAssignment** | ✅ **ĐÃ CÓ** | `assigned_to/assigned_by/assigned_at` + **`work_item_events.previous_assignee/new_assignee`** |
| **TaskHistory** | ✅ **ĐÃ CÓ (đầy đủ)** | **`work_item_events`** (`event_type`·`from_status`·`to_status`·`actor_user_id`·`reason`·`detail_json`·`occurred_at`) |
| **TaskComment** | ❌ **THIẾU** | không có bảng bình luận theo `work_item_id` (chỉ có `request_comments` cho phiếu) |
| **TaskAttachment** | ❓ **UNKNOWN** | cùng lý do mục “tệp” ở trên |
| **TaskParticipant** | ❌ **THIẾU** | không có bảng người tham gia/theo dõi; gần nhất là `task_notifications.user_id` (chỉ là người **nhận thông báo**, không phải người tham gia) |

## 4. KẾT LUẬN CHO `T-03` VÀ `T-04`

**KHÔNG cần làm lại những gì đã có** (đây là giá trị chính của audit):
- **tiến độ · huỷ lúc · TaskAssignment · TaskHistory** ⇒ **ĐÃ CÓ**, chỉ cần **dùng/lộ ra UI** (thuộc `T-05`…`T-07`), **không cần thêm bảng/cột**.

**Việc THẬT SỰ còn thiếu (danh sách ngắn để `T-03`/`T-04` làm):**
1. **Bình luận công việc** (`work_item_comments` hoặc mở rộng `request_comments`) — **THIẾU (CONFIRMED)**.
2. **Người tham gia/theo dõi công việc** (`work_item_participants`) — **THIẾU (CONFIRMED)**.
3. **Tệp đính kèm theo công việc** — **UNKNOWN**: phải xác minh bảng `attachments` có khoá tới `work_item_id` không **trước khi** tạo bảng mới (tránh tạo trùng).
4. **Ghi chú nhiều dòng** ngoài `description` — phụ thuộc mục 1.

## 5. KHUYẾN NGHỊ & CẢNH BÁO

- **Trước khi tạo bảng mới:** xác minh **khoá liên kết** của `attachments` (mục 3) để **không tạo trùng** — đúng bài học “kiểm trước khi thêm”.
- **Mọi bảng mới phải ghi rõ `COLLATE=utf8mb4_unicode_ci`** (bài học đã kiểm chứng: thiếu COLLATE ⇒ lỗi `Illegal mix of collations` ⇒ **toàn bộ UI 500**).
- **Không đổi tên/không bỏ cột** đang có dữ liệu thật (`status`, `progress`, `cancelled_at` đã có 8/8 · 4/8 dòng) — thay đổi chỉ **thêm**.
