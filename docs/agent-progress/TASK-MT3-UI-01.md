# TASK-MT3-UI-01 — Toolbar CRUD dùng chung (thứ tự chuẩn MT3 §IV.4)

| Mục | Nội dung |
|---|---|
| **Task** | P3-UI-01 (GĐ1 · loại 2: **shared component**) |
| **Phase** | **GĐ1 — FRONTEND/UI** |
| **Status** | ✅ **DONE (component)** · ⏳ xác minh bố cục render thật chuyển sang **P3-UI-17** |
| **Requirement** | MT3 §IV.4: «Tất cả màn hình có nút chức năng phía trên bảng phải chuẩn hóa thành một toolbar ngang, theo thứ tự: Tạo mới → Sửa → Xóa/ngừng sử dụng → Tìm kiếm → Sắp xếp → Bộ lọc → Chọn dự án/phạm vi → Xuất Excel → thao tác phụ» + §IV.2 «⛔ Không để nút CRUD thành cột dọc lệch bên phải» |

## Vì sao sửa component dùng chung (GOAL §20, MT3 §13)
`ListToolbar` đã được **56 màn** dùng ⇒ sửa **1 component** đúng hơn sửa từng màn (⛔ không copy/paste logic).

## Implementation
1. **Thêm prop `secondaryActions`** — nhóm hành động PHỤ (Xuất Excel · thao tác phụ) để giữ đúng thứ tự chuẩn khi toolbar đầy đủ.
2. **Đổi thứ tự render** (đo được trước khi sửa: hành động ở **CUỐI**, thứ tự *Tìm → Lọc → Sắp xếp* — **sai** §IV.4):
   ```
   [tiêu đề]  ·  [Tạo · Sửa · Xóa]  ·  Tìm → Sắp xếp → Lọc → extra  ·  [Xuất Excel · phụ]
   ```
3. **CSS** `canonical.css`: `.list-toolbar-primary` / `.list-toolbar-secondary` — `display:flex; flex-wrap:wrap` (⛔ **không** `flex-direction:column`).

## Files changed
| Tệp | Thay đổi |
|---|---|
| `app/components/ui/ListToolbar.tsx` | thêm `secondaryActions`; đổi thứ tự render |
| `app/styles/canonical.css` | thêm `.list-toolbar-primary` / `.list-toolbar-secondary` |
| `tests/mt3-ui-01-toolbar-order.test.mjs` | **mới** — 5 test hợp đồng |
| `tools/probe-toolbar-order.mjs` | **mới** — cổng đo DOM (⚠️ xem Known issues) |

## Frontend changes
Có (2 tệp sản phẩm). **Tương thích ngược**: `actions`/`secondaryActions` đều tuỳ chọn ⇒ **không phá 56 nơi gọi cũ** (đã có test khoá điều này).

## Backend changes
⛔ Không có.

## Database changes
⛔ Không có.

## API changes
⛔ Không có.

## Permission changes
⛔ Không đổi RBAC. Ghi chú: §IV.4 còn yêu cầu «nút không được phép sử dụng thì ẨN hoặc DISABLE kèm lý do» — đây là **việc theo từng màn**, thuộc các task F2/F3/F8/F10/F11/F12, **chưa làm trong task này**.

## Workflow changes
⛔ Không đổi.

## Testing
| Cổng | Kết quả |
|---|---|
| `tests/mt3-ui-01-toolbar-order.test.mjs` | ✅ **5/5 PASS** (thứ tự hành động chính → điều khiển → hành động phụ; Tìm→Sắp xếp→Lọc; ⛔ không cột dọc; tương thích ngược) |
| `npx tsc --noEmit` | ✅ exit 0 |
| contract toàn bộ | ✅ **584 tests · 583 pass · 0 fail · 1 skip** |
| `npm run test:regression` | ✅ **69/69** |
| `gd-cycle` | ✅ `VNTECH-FP-1985CDC5EE7BDC09` · build ĐẠT |

## Known issues (không giấu)
1. ⛔ **Xác minh BỐ CỤC RENDER THẬT chưa xong**: `tools/probe-toolbar-order.mjs` đã viết nhưng chưa lấy được phép đo — cổng đo không tìm thấy `.list-toolbar` sau khi điều hướng (đã thử 2 lần: nhãn menu sai «Danh sách dự án», và quét mọi mục sidebar vẫn 0 toolbar). ⛔ **Vì vậy chưa thể khẳng định** thứ tự hiển thị đúng trên màn thật.
   - Cách xác minh: chạy lại probe với màn có toolbar, **hoặc** soi ảnh chuẩn ở task **P3-UI-17** (toolbar luôn nằm trong khung chụp).
2. ⛔ 68 ảnh chuẩn chưa chụp lại (gom ở P3-UI-17).

## Blockers
⛔ **Không có blocker kỹ thuật.** (Việc xác minh bố cục là **known issue**, không phải blocker.)

## Next task
**P3-UI-02** — bảng ánh xạ trạng thái tiếng Việt dùng chung (MT3 §IV.6): gom **17 nơi** khai bảng nhãn về **1 nguồn**; dọn **5 nơi** đang rò mã thô ra UI (`AllocateReturn.tsx:47,59` · `TeamDirectory.tsx:492,504,528` · `ProjectDetailTabs.tsx:221` · `Inventory.tsx:105` · `Delivered.tsx:24`).
