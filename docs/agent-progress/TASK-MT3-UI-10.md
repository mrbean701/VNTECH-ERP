# TASK-MT3-UI-10 — Kho vật tư: 4 tab cấp cao, danh sách kho dạng card, modal chi tiết (MT3 §F)

| Mục | Nội dung |
|---|---|
| **Task** | P3-UI-10 |
| **Phase** | **GĐ1 — FRONTEND/UI** |
| **Status** | 🟡 **DONE phần cấu trúc tab + card + modal + nhãn** · ⛔ **CÒN NỢ** (xem Known issues) |
| **Requirement** | MT3 §F: 4 tab (**Kho** · **Nhập kho & Xuất kho** · **Tồn kho** · **Cấp phát & hoàn trả**) · «Nhập kho & Xuất kho» = gộp 2 mục cũ + **2 sub-tab** · «Tồn kho» = bản mới của «Dashboard tồn kho» · **Kho**: danh sách **card** · **toolbar CRUD kho** · đổi nhãn **`KHO TỔNG` → `KHO`** · dashboard tổng hợp · **bỏ 2 mục thừa** · click card mở modal chi tiết |

## Khoảng cách đo được (trước khi sửa)
| Mục | Đo được |
|---|---|
| `Inventory.tsx:27` | `WAREHOUSE_TABS = ["Tồn kho", "Dashboard tồn kho"]` ⇒ ⛔ **2 tab**, MT3 yêu cầu **4** |
| `:85` (nay ~L134) | Nhập/Xuất/Chuyển/Thẻ kho là **NÚT thao tác**, ⛔ không phải tab |
| — | ⛔ Không có **danh sách kho dạng card**; ⛔ không có **modal chi tiết kho** |
| `:85` cột «Dự án» | rơi về chuỗi **"Kho Tổng"** ⛔ |
| — | ⛔ Chưa bỏ 2 mục thừa (xem Known issues) |

## Implementation
1. `WAREHOUSE_TABS` → **4 tab** đúng thứ tự §F. `view === "dashboard"` mở thẳng **tab số 2** («Tồn kho» — bản mới của «Dashboard tồn kho»).
2. **Tab «Kho»**: lưới **thẻ kho** (`data-vntech="warehouse-card"`), mỗi thẻ hiện tên · mã · loại · số vật tư · số phiếu xuất; ⛔ chỉ liệt kê kho **trong phạm vi được backend cấp** (`allowedWarehouses`); có trạng thái rỗng.
3. **Modal chi tiết kho** (`data-vntech="warehouse-detail-modal"`): **thủ kho** (theo `staffDirectory.warehouseId`) · mã kho · số liệu · **lịch sử xuất kho** · **danh mục vật tư trong kho** (cả hai có trạng thái rỗng).
4. **Tab «Nhập kho & Xuất kho»**: gộp 2 mục cũ, có **2 sub-tab** (Xuất kho · Nhập kho) + nút tạo phiếu theo sub-tab đang chọn.
5. **Tab «Cấp phát & hoàn trả»**: `ListToolbar` + nút tạo phiếu cấp phát / hoàn trả.
6. **Đổi nhãn** `Kho Tổng` → `Kho` ở cột «Dự án» của bảng tồn kho.
7. ⛔ **Dải nút cũ**: bỏ nút **NHẬP KHO** / **XUẤT KHO** (⛔ đã thành tab/sub-tab ⇒ trùng chức năng); **giữ** `CHUYỂN KHO` + `THẺ KHO` (hành động độc lập, không trùng tab nào).
8. CSS `canonical.css` mục **14.13**: lưới thẻ kho + vùng nút tab; `@media 650px` ⇒ 1 cột, nút xếp dọc.

## Files changed
| Tệp | Thay đổi |
|---|---|
| `app/screens/Inventory.tsx` | 4 tab · card kho · modal chi tiết · sub-tab Nhập/Xuất · tab Cấp phát · nhãn `KHO` · dải nút |
| `app/styles/canonical.css` | mục **14.13** |
| `tests/w04-inventory-dashboard.test.mjs` | cập nhật hợp đồng 2 tab → 4 tab (giữ nguyên các khẳng định cũ) |

## Frontend changes
Có (2 tệp sản phẩm).

## Backend changes / Database changes / API changes
⛔ **Không có.** ⛔ Dùng dữ liệu sẵn có: `data.warehouses` · `data.inventory` · `data.issues` · `data.staffDirectory`.

## Permission changes
⛔ **Không hard-code role.** Card kho chỉ liệt kê `allowedWarehouses` (đã lọc theo phạm vi dự án mà backend cấp).
⛔ **CÒN NỢ (GĐ2)**: MT3 §F yêu cầu «Dữ liệu phải tuân thủ quyền truy cập kho/dự án» ⇒ phải **kiểm chứng bằng user thường** (403 khi gọi API ngoài phạm vi) — **P3-BE-08**.

## Workflow changes
⛔ **Không đổi.** Các mục menu cũ (`Kho` · `Nhập` · `Xuất` · `Điều chuyển` · `Dashboard tồn kho`) **giữ nguyên**; chúng chỉ trỏ vào màn `Inventory` với `view` tương ứng.

## Testing (đều chạy thật)
| Cổng | Kết quả |
|---|---|
| `npx tsc --noEmit` | ✅ exit 0 |
| contract toàn bộ | ✅ **603 tests · 602 pass · 0 fail · 1 skip** |
| `npm run test:regression` | ✅ **69/69** |
| `gd-cycle` | ✅ build ĐẠT · fingerprint `VNTECH-FP-7916C7431D0D69F2` |

## ⚠️ PHẦN CÒN NỢ (không tính là xong — nói thẳng)
1. ⛔ **Toolbar CRUD cho KHO chưa làm** (MT3 §F «Có toolbar CRUD cho kho») — thẻ kho mới chỉ có nút mở chi tiết. ⛔ Cần thêm ở vòng sau.
2. ⛔ **Dashboard ngoài danh sách chưa làm** (§F «Dashboard ngoài danh sách phải hiển thị dữ liệu tổng hợp toàn hệ thống/phạm vi được phép, không chỉ một kho»).
3. ⛔ **2 mục thừa chưa bỏ** (§F «Danh sách luân chuyển vật tư dư dự án → Kho Tổng» và «Tồn vật lý kho tổng») — ⛔ **chưa xác minh được 2 mục này có thật trong mã hay không**; phải đối chiếu tiếp ở vòng sau trước khi xoá (⛔ không xoá mù).
4. ⛔ **Cấu trúc menu nhóm «KHO» chưa rút về 4 tab** ở tầng menu (hiện vẫn 5 mục cũ theo hợp đồng `W-01`) — cần rà lại ở vòng sau vì `W-01` khoá 5 mục đó.
5. ⛔ Xác minh bằng mắt (ảnh chuẩn) — **P3-UI-17**.

## Blockers
⛔ **Không có.**

## Next task
**P3-UI-11** — Tổ đội (§G): tab đúng spec **Thông tin · Nhân sự · Dự án · Kho · Lịch sử** · tab **Lịch sử** phải TỔNG HỢP tất cả đơn/phiếu của tổ đội, có **Search · Sort · Filter theo loại**, mặc định **mới nhất trước**, ⛔ **không nhân dòng bằng join** · thêm nút **«Tạo tổ đội»** cho user có quyền · bỏ khối «Chọn dự án» đầu trang (chuyển vào toolbar).
