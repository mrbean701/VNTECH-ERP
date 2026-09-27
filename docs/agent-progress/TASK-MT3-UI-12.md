# TASK-MT3-UI-12 — Mua hàng & Cung ứng: bỏ nút「Xem chi tiết」khỏi thanh công cụ (MT3 §E)

| Mục | Nội dung |
|---|---|
| **Task** | P3-UI-12 (vòng 1 — phần rõ ràng, không mắc thêm) |
| **Phase** | **GĐ1 — FRONTEND/UI** |
| **Status** | ✅ **DONE (thay đổi)** · ⛔ **CÒN NỢ** (xem Known issues) |
| **Requirement** | MT3 §E: «⛔ **Bỏ nút "Xem chi tiết" rời khỏi toolbar CRUD. Chi tiết được mở từ từng dòng/hành động của phiếu.**» |

## Đối chiếu TỪNG YÊU CẦU §E (đo trên mã, ⛔ không giả định)
| Yêu cầu §E | Đo được | Kết quả |
|---|---|---|
| Tạo **2 sub-tab** PR / PO | `Purchasing.tsx:13,48` — đã có **2 tab PR · PO** (PR = `material_requests`, PO = `purchase_orders`) | ✅ **đã đúng từ trước** |
| ⛔ Bỏ nút **「Xem chi tiết」** khỏi toolbar | `Requests.tsx:68` có nút này trong `actions` của `ListToolbar` | ✅ **ĐÃ BỎ** (task này) |
| Chi tiết mở **từ từng dòng** | `Requests.tsx:117` cột «Hành động» có `◉` xem · `✎` sửa → `open("detail", row)` | ✅ đã có sẵn ⇒ bỏ nút toolbar **không mất chức năng** |
| ⛔ Bỏ **card chi tiết cố định** | ⛔ **KHÔNG tồn tại** (grep: `selected` chỉ dùng cho `selected-row` + radio) | ✅ **đã đúng từ trước** |
| 「Vật tư đang thiếu」 **mở modal** | `Requests.tsx:77-94` — `role="dialog" aria-modal="true"`, ⛔ không phải side tab | ✅ **đã đúng từ trước** |
| ⛔ Bỏ 「Chọn dự án」 đầu trang | đã xử lý ở **P3-UI-04** (chuyển vào filter toolbar) | ✅ xong |
| Thêm **filter dự án** | `Requests.tsx` — bộ lọc «Dự án» trong toolbar (P3-UI-04) | ✅ xong |

⚠️ `Purchasing.tsx:297` có `purchase-order-detail-card` — đã kiểm: đây là **bảng DANH SÁCH PO** kèm nút mở chi tiết từng dòng, ⛔ **KHÔNG** phải thẻ chi tiết cố định ⇒ **không xoá** (xoá sẽ mất chức năng).

## Implementation
- Gỡ `<button ... >◉ Xem chi tiết</button>` khỏi nhóm `actions` của thanh công cụ màn Phiếu đề nghị mua hàng.
- Thanh công cụ còn đúng thứ tự §IV.4: `Lập phiếu` (Tạo) · `Nhập Excel` (phụ) · `Xuất Excel` (phụ) + Tìm · Sắp xếp · Lọc.

## Files changed
| Tệp | Thay đổi |
|---|---|
| `app/screens/Requests.tsx` | bỏ nút「Xem chi tiết」khỏi toolbar + ghi chú lý do |

## Frontend changes
Có (1 tệp sản phẩm, 1 dòng + chú thích).

## Backend changes / Database changes / API changes
⛔ **Không có.**

## Permission changes
⛔ Không đổi.

## Workflow changes
⛔ **Không đổi.**

## Testing (đều chạy thật)
| Cổng | Kết quả |
|---|---|
| `npx tsc --noEmit` | ✅ exit 0 |
| contract toàn bộ | ✅ **603 tests · 602 pass · 0 fail · 1 skip** (⛔ **không sửa test nào**) |
| `npm run test:regression` | ✅ **69/69** |
| `gd-cycle` | ✅ build ĐẠT · fingerprint `VNTECH-FP-F6BAAF6874C5F3AF` |

## Known issues — CÒN NỢ của §E (nói thẳng, chưa tính là xong)
1. ⛔ **10 tab cấp cao** của màn «Mua hàng & Cung ứng» chưa dựng (PR & PO & Phiếu đề nghị & Giao nhận công trường & Đơn hàng đã giao & Kế hoạch mua hàng & Đấu thầu & Hợp đồng & Danh mục NCC & Giá & dữ liệu thương mại & Báo cáo) — cần rà cấu trúc menu.
2. ⛔ **Duyệt trong modal** (kiểm tra bước + thẩm quyền ở backend) — thuộc **GĐ2**.
3. ⛔ **Modal thay side tab** cho thao tác「Ghi nhận số lượng giao thực tế」— chưa làm.
4. ⛔ Xác minh bằng mắt (ảnh chuẩn) — **P3-UI-17**.

## Blockers
⛔ **Không có.**

## Next task
**P3-UI-12b** — tiếp §E: dựng **10 tab cấp cao** cho Mua hàng & Cung ứng (rà cấu trúc menu trước khi sửa) + chuyển thao tác「Ghi nhận số lượng giao thực tế」sang **modal**.
