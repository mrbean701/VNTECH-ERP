# TASK-MT3-UI-04 — Bỏ khối «Chọn dự án» độc lập ở đầu trang (MT3 §IV.5)

| Mục | Nội dung |
|---|---|
| **Task** | P3-UI-04 |
| **Phase** | **GĐ1 — FRONTEND/UI** |
| **Status** | ✅ **DONE** |
| **Requirement** | MT3 §IV.5: «Bỏ tất cả khối "Chọn dự án" độc lập ở đầu trang. Nếu phân hệ vẫn cần chọn dự án, chuyển thành filter hoặc control trong toolbar CRUD. ⛔ Không làm mất phạm vi dự án hiện tại hoặc quyền truy cập dự án.» |

## Sửa lại audit trước khi làm (⛔ audit cũ của tôi SAI 2 điểm)
| Điểm | Audit cũ (sai) | Thực tế đo lại |
|---|---|---|
| Số nơi còn khối chọn dự án | 5 | **3** (đọc kỹ mới ra) |
| `TeamDirectory.tsx:550` | "còn chọn dự án" | ✅ **đã là filter trong toolbar** — không cần sửa |
| `Inventory.tsx:53` · `AllocateReturn.tsx:37` | "còn chọn dự án" | ⛔ là **dải tab** (`.project-scope-tabs`), KHÔNG phải bộ chọn dự án — ⛔ **không được đụng** |
| `Requests.tsx:62` | "khối chọn dự án" | là **dải chip báo phạm vi** (chỉ đọc) sau toolbar |
| Bị bỏ sót | — | `page.tsx` còn **2** chip nữa ở màn **Tiến độ dự án** và **Trung tâm phê duyệt** |

## Implementation — chuyển 3 chỗ thành BỘ LỌC có chọn được
1. **`Requests.tsx` (Phiếu đề nghị mua hàng)** — bỏ dải chip; thêm bộ lọc **«Dự án»** vào `extra` của `ListToolbar` (cùng hàng với bộ lọc «Từ ngày»), gọi đúng prop `onProject`.
2. **`page.tsx` — `DepartmentTaskWorkspace` (Phòng ban)** — chip chỉ đọc → `<label class="list-toolbar-field">` + `select`, dùng prop `onProject`.
3. **`page.tsx` — `ProjectProgress` (Tiến độ dự án)** — chip chỉ đọc → bộ lọc `select`, dùng `onProject`.
4. **`page.tsx` — `Approvals` (Trung tâm phê duyệt)** — chip chỉ đọc → bộ lọc `select` trong `approval-filter-row`, dùng `onProject`.

⛔ **GIỮ NGUYÊN**: logic lọc `data.requests.filter(row => project === "ALL" || row.projectId === project)` và `projectMatchesFilters(...)` — phạm vi dự án **không bị mất**. Không tạo state mới; chỉ dùng prop `onProject` sẵn có.

## Files changed
| Tệp | Thay đổi |
|---|---|
| `app/page.tsx` | 3 chỗ (Phòng ban · Tiến độ dự án · Trung tâm phê duyệt) |
| `app/screens/Requests.tsx` | 1 chỗ (bỏ chip · thêm filter trong toolbar) |
| `tests/mt3-ui-04-no-project-block.test.mjs` | **mới** — 6 test |

## Frontend changes
Có (2 tệp sản phẩm). ⛔ Không đổi hành vi lọc, không đổi payload.

## Backend changes / Database changes / API changes / Permission changes / Workflow changes
⛔ **Không có** — đây thuần là vị trí đặt control; quyền truy cập dự án vẫn do backend kiểm soát như cũ (GOAL §15).

## Testing (đều chạy thật)
| Cổng | Kết quả |
|---|---|
| `tests/mt3-ui-04-no-project-block.test.mjs` | ✅ **6/6 PASS** — không còn khối «Dự án» rời (đếm theo số khớp) · đúng **3** bộ lọc có select · mỗi bộ lọc giữ «Tất cả dự án» · logic lọc cũ còn nguyên · màn không bị đụng |
| `npx tsc --noEmit` | ✅ exit 0 (⚠️ lần đầu **ĐỎ** vì tôi dùng `setProject` thay vì prop `onProject` ⇒ đã sửa) |
| contract toàn bộ | ✅ **598 tests · 597 pass · 0 fail · 1 skip** |
| `npm run test:regression` | ✅ **69/69** |
| `gd-cycle` | ✅ build ĐẠT · fingerprint `VNTECH-FP-A82F55F7F16D7BCC` |

## Known issues
1. ⛔ Xác minh bằng mắt (ảnh chuẩn) chưa làm — gom ở **P3-UI-17**.
2. ⛔ Chip lớp `global-project-scope-chip` **vẫn còn trong CSS** dù không còn dùng ở các màn đã sửa ⇒ có thể dọn ở task dọn dẹp (⛔ chưa xác minh còn chỗ nào dùng không).

## Blockers
⛔ **Không có.**

## Bài học (2 lần trong task này — đã ghi để không lặp lại)
1. ⛔ **Audit cũ sai** ⇒ phải ĐỌC TỪNG DÒNG trước khi sửa; `.project-scope-tabs` (dải tab) ≠ bộ chọn dự án.
2. ⛔ Sửa 1 tên định danh sai (`setProject` thay vì prop `onProject`) bị **`tsc` bắt ngay** ⇒ giữ `tsc` trong vòng kiểm là bắt buộc, ⛔ không bỏ qua.

## Next task
**P3-UI-05** — modal thay side panel: màn **Đơn hàng đã giao** (`ReceiptDrawer` — MT3 §E nêu đích danh, phần «Ảnh và hồ sơ giao hàng» phải đủ + có vùng cuộn + trạng thái rỗng + xử lý lỗi) và màn **Kho** (`Inventory.tsx:86` — `<aside class="card inventory-transfer-panel">`).
