# TASK-077 (`U-09`) — 6 màn sang `ListToolbar` chuẩn §5

**Trạng thái:** ✅ DONE — `tsc` **exit 0** · `<ListToolbar>` **13 → 19 lần** · toolbar tự viết **16 → 10 chỗ** · eslint **0 error**
**Ngày:** 17/09/2026 · **Nhánh:** `unity` · **Nguồn:** `docs/24` §15 dòng 1 (*"Toolbar danh sách mất cân đối, nút bị dồn một phía"*) · khuôn chuẩn §5

---

## 1. Khảo sát (đo trước khi sửa)

| Số đo | Giá trị |
|---|---|
| Chỗ `className="table-toolbar…"` tự viết | **16** ở **14 hàm** |
| Hàm **chưa** chuẩn hoá | **10** (`Receiving` · `Delivered` · `Payments` · `BoqPurchaseComparison` · `BusinessRoleGroupManager` · `FormFieldConfigPanel` · `TrustLockAdmin` · `UiDisplaySettingsManager` · `UserProfilePanel` ×2 · `WorkflowModal` ×2) |
| `<ListToolbar>` đang dùng | **13** lần ở **11** hàm |

## 2. Đã chuyển 6 màn (mỗi màn một phép đổi KÍN)

| Màn | Trước | Sau |
|---|---|---|
| `Receiving` | `<div className="table-toolbar compact">…Tổng {n} bản ghi…` | `title="Kế hoạch giao hàng"` (**nhãn menu có sẵn**) + `count`/`unit` |
| `Delivered` | `…Đang hiển thị toàn bộ {n} dòng…` | `title="Đơn hàng đã giao"` (**nhãn menu có sẵn**) + `note` **nguyên văn cũ** + `count`/`unit` |
| `BusinessRoleGroupManager` | tiêu đề + ghi chú tự viết | `title`/`note` |
| `UiDisplaySettingsManager` | tiêu đề + ghi chú tự viết | `title`/`note` |
| `TrustLockAdmin` | tiêu đề + ghi chú + nút Thu gọn/Mở chi tiết | `title`/`note` + `actions` |
| `Payments` | `SỔ THANH TOÁN HĐ` + cụm nút | `title` + `actions` (cụm nút **giữ nguyên**) |

**Không tự đặt chữ mới:** tiêu đề lấy từ **nhãn menu trong cấu hình nav** (`receiving`/`delivered` đã có sẵn) hoặc chữ cũ nguyên văn; câu đếm cũ giữ qua `count`/`unit`/`note`.

## 3. Đo sau khi sửa

* `className="table-toolbar…"` tự viết: **16 → 10 chỗ** (8 hàm).
* `<ListToolbar>`: **13 → 19 lần** (17 hàm).
* `npm run typecheck`: **exit 0** · `npx eslint app/page.tsx`: **0 error · 73 warning** (≤ mốc nền 74).
* Kích thước tệp **giảm** (markup toolbar tự viết ít hơn).

## 4. 🔴 SỰ CỐ SUÝT HỎNG — ghi lại để phiên sau không lặp

Bộ chuyển đổi tự động tôi viết phát `title=` + ngoặc nhọn chứa **VĂN BẢN THÔ** (thiếu dấu nháy kép)
⇒ **cú pháp JSX sai**, mà script **đã GHI tệp** (nó không tự kiểm cú pháp). Phát hiện nhờ **đọc lại đầu ra
của chính mình** trước khi chạy `tsc`; đã vá **7 chỗ** (4 `title` + 3 `note`) và lấy **`tsc` làm trọng tài** (exit 0).

**Bài học kèm theo:** **phép hậu kiểm tự viết cũng phải được kiểm.** Bản hậu kiểm đầu của tôi quét mẫu
`(title|note)=\{…\}` và cho **116 dương tính giả** — vì `title={biến}` / `title={a?b:c}` là **HỢP LỆ**.
Phép kiểm đúng phải là *"nội dung trong ngoặc nhọn có phải biểu thức JS không"*, hoặc đơn giản: **giao cho `tsc`**.

## 5. Còn lại (ghi rõ)

| Hàm | Vì sao để lại |
|---|---|
| `FormFieldConfigPanel` · `UserProfilePanel` ×2 · `WorkflowModal` ×2 | nhãn là **biểu thức** và/hoặc có **bộ lọc — hành vi riêng** (checkbox lọc người có quyền duyệt, nút đổi thứ tự bước) |
| `BoqPurchaseComparison` | dùng **lớp CSS riêng** `purchase-comparison-head` / `purchase-price-tools`; `app/globals.css` **bị đóng băng** (hạn mức 400.653 B, `!important` sát trần) nên **không thêm được luật bù** ⇒ chuyển khi có cách bù CSS an toàn |

## 6. Tệp thay đổi

| Tệp | Thay đổi |
|---|---|
| `app/page.tsx` | 6 khối toolbar → `<ListToolbar …/>`; 7 chỗ vá dấu nháy kép |
| `docs/25_TODO_ROADMAP.md` | `U-09` cập nhật **số đo thật** (17 hàm / 19 lần dùng · còn 4 hàm) |
| `docs/agent-progress/{MASTER_STATUS,TASK_INDEX}.md` | mốc trạng thái + dòng task |

## 7. Bằng chứng sau khi DỰNG LẠI BUNDLE + KHỞI ĐỘNG LẠI UI

Vì mỗi lần sửa nguồn đều phải làm mới dấu vân tay rồi dựng lại, phần này là bằng chứng đo trên **bản đang phục vụ thật**:

| Phép kiểm | Kết quả |
|---|---|
| Dấu vân tay mới | head `drizzle/0111_phase1_ui_toolbar_identity.sql` ⇒ **`18c11578…`** (`VNTECH-FP-18C1157899707604`, **244 tệp**), *Fixed point stable: OK*, cổng xác minh **ĐẠT** |
| `npm run build` | **EXIT 0** · `BUILT ARTIFACT VALIDATION: ĐẠT` |
| UI `:8787` | **HTTP 200** · header `x-vntech-source-fingerprint` = **`VNTECH-FP-18C1157899707604`** ⇒ đúng bản mới |
| Proxy `:9000` | **HTTP 200** · Java health **HTTP 200** |
| Bundle client đang phục vụ | **CÓ** `list-toolbar` (thay đổi của task này) cùng `vt-timeline-step` · `entity-detail-modal` · `attachment-photos` · `vt-timeline-activity` |
| **Cổng ảnh 28 ảnh** | **8/28 — KHÔNG TĂNG** so với trước thay đổi |
| **Cổng ảnh riêng `--only=07-admin`** (nơi sửa 3 toolbar) | **ĐẠT ✅** — desktop **2 px** (dưới ngưỡng 8 px), laptop/tablet/phone **0 px** |
