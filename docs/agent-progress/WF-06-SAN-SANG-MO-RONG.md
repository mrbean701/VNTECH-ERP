# WF-06 — CHUẨN BỊ MỞ RỘNG (nghỉ phép · tăng ca · chấm công bù · form tương lai)

> **Mục lộ trình:** PHASE 8 · `WF-06` (P4) — *"Chuẩn bị mở rộng: nghỉ phép · tăng ca · chấm công bù · form tương lai"*.
> **Bản chất mục này là CHUẨN BỊ (P4)** — không dựng form nghiệp vụ mới. Hồ sơ này ghi **engine đã sẵn sàng tới đâu**, **còn thiếu gì**, và **danh mục việc cần làm khi mở rộng thật**.

---

## 1. KẾT LUẬN NGẮN

**Engine phê duyệt hiện tại ĐÃ đủ tổng quát để nhận một loại phiếu mới (nghỉ phép / tăng ca / chấm công bù) MÀ KHÔNG CẦN SỬA MÃ ENGINE** — chỉ cần:
1. **1 dòng** `workflow_definitions` (định danh quy trình mới qua `module_key`), và
2. **N dòng** `workflow_steps` (các bước của quy trình đó),
3. **module chủ (host module) + form nhập liệu** gọi engine — **phần này CHƯA CÓ** (đây là việc của phase sau, không phải WF-06).

---

## 2. BẰNG CHỨNG ENGINE ĐÃ TỔNG QUÁT (đo trực tiếp, 18/09)

### 2.1. Quy trình định danh bằng `module_key` (không hard-code)
```
WF-MUAHANG-01 | Quy trình mua hàng chuẩn            | module_key=requests            | is_default=1 | active=1
WF-PO-01      | Quy trình phát hành PO               | module_key=purchasing          | is_default=1 | active=1
WF-XUATKHO-01 | Quy trình cấp phát / xuất kho        | module_key=warehouse_issue     | is_default=1 | active=1
WF-NHAPKHO-01 | Quy trình nhập kho (có bước duyệt)   | module_key=warehouse_receipt   | is_default=1 | active=1
```
⇒ **4 module khác nhau dùng CÙNG một engine** ⇒ thêm module mới = **thêm dữ liệu**, không sửa engine ✔
⇒ `is_default` cho phép **nhiều quy trình song song trong cùng một module** và chọn mặc định.

### 2.2. Bước duyệt hoàn toàn bằng dữ liệu — `approval_stage_catalog` (12 cột)
`id, stage_no, name, description, allowed_role_codes, sla_hours, auto_approve_on_submit, active, sort_order, created_at, updated_at, approval_mode`
| Trường | Ý nghĩa cho việc mở rộng |
|---|---|
| `stage_no` | thứ tự bước (1..N) — không giới hạn cứng |
| `allowed_role_codes` | **vai trò được duyệt** ở bước đó (dữ liệu, không phải mã) |
| `sla_hours` | hạn xử lý từng bước |
| `auto_approve_on_submit` | bước tự duyệt khi gửi (dùng cho luồng đơn giản) |
| **`approval_mode`** | **`single` / `any_of` / `all_of`** — 1 người · 1 trong nhiều người · tất cả phải duyệt |
⇒ Mọi thứ cần cho **nghỉ phép/tăng ca/chấm công bù** (duyệt 1 cấp, duyệt nhiều cấp, duyệt đồng thời) **đã có sẵn dạng dữ liệu** ✔

### 2.3. Bước gắn theo QUY TRÌNH, không theo loại phiếu cứng
Liên kết duy nhất cần: **`workflow_steps.workflow_id`** → trỏ tới `workflow_definitions.id`.
⇒ Engine **không biết** "phiếu mua hàng" hay "đơn nghỉ phép" là gì ⇒ nó chỉ biết **quy trình + bước + vai trò** ⇒ **tổng quát thật sự** ✔

### 2.4. Đã có sẵn các cơ chế đi kèm engine (từ các phase trước)
* **Snapshot vai trò/mode vào phiếu** (WF-02, đã kiểm 5/5): phiếu cũ **giữ nguyên luồng** khi catalog đổi ⇒ **an toàn khi thêm/bớt quy trình**.
* **Người được chỉ định theo TỪNG PHIẾU** (`approver_user_id`) — không tra live.
* **Thông báo theo bước** (`task_notifications`) + **SLA** (`sla_hours`) + **lịch sử duyệt** (`approvals`).
* **Engine động WF-05 đã kiểm 5/5**: đổi quy trình khi có phiếu đang chờ ⇒ **phiếu cũ không đổi**.

---

## 3. CÒN THIẾU GÌ ĐỂ CÓ FORM THẬT (danh mục việc của phase sau)

| # | Hạng mục | Loại | Ghi chú |
|---|---|---|---|
| 1 | **Module chủ** cho HR (nghỉ phép/tăng ca/chấm công bù): bảng dữ liệu + API | **MỚI** | ví dụ `leave_requests`, `overtime_requests`; chưa có gì trong repo |
| 2 | **Đăng ký `module_key`** | DỮ LIỆU | `hr_leave`, `hr_overtime`, `hr_time_adjust` |
| 3 | **Quy trình + bước** | DỮ LIỆU | 1 dòng `workflow_definitions` + N dòng `workflow_steps` mỗi quy trình |
| 4 | **Form nhập liệu + màn duyệt** | UI | dùng lại `EntityDetailModal` + `ApprovalTimeline` (đã có) |
| 5 | **Quyền** | DỮ LIỆU | thêm chức năng vào `module_catalog`/`role_catalog` rồi cấp quyền |
| 6 | **Kiểm thử** | TEST | bổ sung ca kiểm vào `tests/workflow-direct.test.ts` cho loại phiếu mới |

---

## 4. VÌ SAO WF-06 KHÔNG DỰNG FORM NGAY (quyết định có lý do)

* **Mục là P4 — "chuẩn bị"**, không phải "triển khai". Dựng form HR **không có trong phạm vi** đã chốt.
* Dựng form HR mà **chưa có nghiệp vụ chốt** (ai duyệt, mấy cấp, SLA bao lâu, có cần HR xác nhận không) sẽ vi phạm nguyên tắc **"KHÔNG tự suy đoán nghiệp vụ"**: cần người dùng chốt trước.
* **Engine đã sẵn sàng** ⇒ khi nghiệp vụ được chốt, việc triển khai là **thêm dữ liệu + form**, **không phải viết lại engine**.

---

## 5. ĐỊNH NGHĨA HOÀN THÀNH (DoD) CỦA WF-06

- [x] **Xác định rõ các ĐIỂM MỞ RỘNG** của engine (mục 2) — kèm số liệu đo được.
- [x] **Chỉ ra phần CÒN THIẾU** khi mở rộng thật (mục 3) — danh mục 6 việc.
- [x] **Ghi lý do** không dựng form HR ngay (mục 4).
- [x] **Không đổi dữ liệu/dữ liệu demo** chỉ để "chuẩn bị" (tránh nhiễu bộ dữ liệu kiểm thử).
- [x] `npm test` **exit 0** và **không có thay đổi mã nào** ⇒ engine nguyên trạng.

---

## 6. KHI NÀO MỞ LẠI (điều kiện chuyển từ "chuẩn bị" sang "triển khai")

Khi người dùng **chốt nghiệp vụ** cho từng loại phiếu:
1. **Ai được gửi** (mọi nhân viên? theo phòng?)
2. **Ai duyệt, mấy cấp, thứ tự** (trưởng phòng → HR → BCH?)
3. **SLA** mỗi cấp bao lâu
4. **Duyệt đồng thời hay tuần tự** (`any_of` / `all_of` / `single`)
5. **Có cần đính kèm** (giấy tờ, ảnh) và **có trừ phép/tính công** không

⇒ Khi có 5 điểm trên, triển khai theo mục 3 là **đường thẳng** (dữ liệu + form + test), **không rủi ro cho engine**.
