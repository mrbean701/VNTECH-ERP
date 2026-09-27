# TASK-MT3-UI-10b — Kho: toolbar CRUD + số liệu tổng hợp; ĐỐI CHIẾU 2 mục thừa (MT3 §F)

| Mục | Nội dung |
|---|---|
| **Task** | P3-UI-10b (phần còn nợ của P3-UI-10) |
| **Phase** | **GĐ1 — FRONTEND/UI** |
| **Status** | ✅ **DONE** toolbar CRUD + dashboard tổng hợp · ⛔ **2 mục thừa: CẦN USER CHỐT** (xem Blocker) |

## 1) Toolbar CRUD cho KHO (MT3 §F «Có toolbar CRUD cho kho»)
Dùng `ListToolbar` dùng chung, đúng thứ tự §IV.4:
- **Nhóm chính**: `＋ Tạo kho` · `✎ Sửa` · `🗑 Xóa` (⛔ disable + không làm gì khi chưa chọn kho).
- **Tìm kiếm** theo tên/mã kho · **Sắp xếp** (Tên A→Z · Tên Z→A · Nhiều vật tư trước) · đếm `hiển thị/tổng`.
- **Nhóm phụ**: `⇩ Xuất Excel` — CSV **UTF-8 có BOM** (`downloadCsv`) ⇒ đạt §IV.7.
- Tương tác thẻ: **bấm = CHỌN** (để Sửa/Xóa) · **bấm đúp = mở modal chi tiết** · thêm nút `◉ Xem chi tiết kho đang chọn` (rõ ràng cho người dùng bàn phím/cảm ứng — §IV.3).
- ⛔ Lọc/sắp xếp **chỉ lọc hiển thị**, ⛔ **không** nới phạm vi quyền (`allowedWarehouses` vẫn do backend cấp).

## 2) Số liệu TỔNG HỢP toàn phạm vi (§F «không chỉ một kho»)
3 thẻ số liệu ở tab «Kho»: **Số kho** · **Vật tư đang có** · **Phiếu xuất** — đều tính trên **toàn bộ kho được phép**, ⛔ không chỉ kho đang chọn.

## 3) ĐỐI CHIẾU 2 mục thừa (§F: bỏ «Danh sách luân chuyển vật tư dư dự án → Kho Tổng» và «Tồn vật lý kho tổng»)
**ĐÃ XÁC MINH: cả 2 mục CÓ THẬT** trong `app/page.tsx` (màn `CentralWarehouse`):
- `app/page.tsx:1150` — «**Tồn vật lý Kho Tổng**» + nút *Lập phiếu chuyển vật tư dư*.
- `app/page.tsx:1151` — «**Luân chuyển vật tư dư dự án → Kho Tổng**», có nút **Duyệt** (`approve_central_return`) · **Kiểm đếm** (`centralReceive`) · **bộ hồ sơ ảnh**.
⛔ Trong `scripts/system-route.mjs` chỉ là **tên biến nội bộ** (`physical`), **không** phải mục UI.

**⛔ VÌ SAO TÔI CHƯA XOÁ:** hai khối này chứa **luồng nghiệp vụ thật** (đề nghị → duyệt → vận chuyển → kiểm đếm → nhận về kho). MT3 §C yêu cầu «⛔ **không xoá nghiệp vụ nếu chưa xác định nơi chuyển đến**» ⇒ xoá thẳng sẽ làm mất đường duyệt/khống chế vật tư dư. Cần anh chốt **nơi chuyển tới** (xem Blocker).

## Files changed
| Tệp | Thay đổi |
|---|---|
| `app/screens/Inventory.tsx` | toolbar CRUD kho · state chọn/tìm/sắp xếp · `visibleWarehouses` · 3 KPI tổng hợp · hàm xuất CSV · prop `action` |
| `app/page.tsx` | truyền `action` vào `Inventory` (⛔ đặt SAU `view` để không phá hợp đồng `W-01`) |
| `app/styles/canonical.css` | `.warehouse-card.is-selected` · `.warehouse-card-hint` |

## Frontend changes
Có (2 tệp sản phẩm).

## Backend changes / Database changes / API changes
⛔ **Không có.** Nút **Xóa kho** gọi action `delete_warehouse` (⛔ nếu action này không tồn tại ở backend thì sẽ báo lỗi khi bấm — **cần xác minh ở GĐ2**; tôi **không** giả lập là đã hoạt động).

## Permission changes
⛔ Không hard-code role. Thẻ kho chỉ liệt kê kho trong `allowedWarehouses` (phạm vi backend cấp). ⛔ Chặn API ở backend thuộc **P3-BE-08**.

## Workflow changes
⛔ **Không đổi.**

## Testing (đều chạy thật)
| Cổng | Kết quả |
|---|---|
| `npx tsc --noEmit` | ✅ exit 0 (⚠️ 2 lỗi lần đầu: thừa dấu `}` đóng `<section>` sớm; lệch kiểu `action` — đã sửa) |
| contract toàn bộ | ✅ **603 tests · 602 pass · 0 fail · 1 skip** — ⛔ **KHÔNG sửa test nào** (đã đặt `view` đúng chỗ để giữ hợp đồng `W-01`) |
| `npm run test:regression` | ✅ **69/69** |
| `gd-cycle` | ✅ build ĐẠT · fingerprint `VNTECH-FP-BA8E2094E959B9FA` |

## Blockers — CẦN USER CHỐT (1 việc, ⛔ không tự quyết)
**2 mục thừa §F nên gộp vào đâu?** (a) Gộp vào tab **«Cấp phát & hoàn trả»** (về bản chất là trả vật tư về kho) — tôi **khuyến nghị**; (b) giữ riêng một tab **«Vật tư dư»** trong màn Kho; (c) bỏ hẳn khỏi UI ⇒ ⛔ **nghiep vụ duyệt/kiểm đếm sẽ mất**, tôi **không chọn phương án này**.

## Known issues
1. ⛔ Chưa xác minh `delete_warehouse` có tồn tại ở backend (GĐ2).
2. ⛔ Xác minh bằng mắt (ảnh chuẩn) — **P3-UI-17**.

## Next task
**P3-UI-11** — Tổ đội (§G): 5 tab **Thông tin · Nhân sự · Dự án · Kho · Lịch sử** · tab **Lịch sử** tổng hợp mọi đơn/phiếu của tổ đội, có **Search · Sort · Filter theo loại**, mặc định **mới nhất**, ⛔ **không nhân dòng join** · nút **«Tạo tổ đội»** cho user có quyền.
