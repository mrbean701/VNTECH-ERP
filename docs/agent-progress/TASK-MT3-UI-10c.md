# TASK-MT3-UI-10c — Kho: chuyển «Luân chuyển vật tư dư» vào «Cấp phát & hoàn trả» (theo QUYẾT ĐỊNH USER)

| Mục | Nội dung |
|---|---|
| **Task** | P3-UI-10c |
| **Phase** | **GĐ1 — FRONTEND/UI** |
| **Status** | ✅ **DONE (chuyển chỗ hiển thị)** · ⛔ còn 1 bước dọn đường cũ (xem Known issues) |
| **Requirement** | Trả lời trực tiếp của user (26/09/2026) cho câu hỏi 2 mục thừa của MT3 §F: «Tồn vật lý kho tổng **chính là dashboard rồi**, luân chuyển vật tư là **1 phần của cấp phát & hoàn trả** - Xuất&nhập kho» |

## Diễn giải quyết định (⛔ ghi nguyên văn ở `docs/dsh/MT3_USER_DECISIONS.md`)
| Mục | Quyết định user | Hành động đã làm |
|---|---|---|
| «Tồn vật lý Kho Tổng» | **CHÍNH LÀ dashboard** ⇒ ⛔ không phải mục thừa | **GIỮ NGUYÊN** — ⛔ không xoá |
| «Luân chuyển vật tư dư dự án → Kho Tổng» | Là **một phần của «Cấp phát & hoàn trả»** – Nhập/Xuất kho | ✅ **ĐÃ CHUYỂN** danh sách vào tab «Cấp phát & hoàn trả» của màn Kho |

## Implementation
Trong `app/screens/Inventory.tsx`, tab **«Cấp phát & hoàn trả»** (tab 3) nay có thêm khối:
- Tiêu đề phụ **«LUÂN CHUYỂN VẬT TƯ DƯ DỰ ÁN → KHO»** + bảng từ `data.centralReturns`:
  Phiếu/dự án · Đề nghị · Chấp nhận/từ chối · Ảnh · Trạng thái · Xử lý.
- ⛔ **Giữ đủ nghiệp vụ cũ** (⛔ không xoá gì):
  - `approve_central_return` — nút **Duyệt** khi `pending_approval` (chỉ hiện khi có `action`).
  - `open("centralReceive", row)` — nút **Kiểm đếm** khi `in_transit`.
  - `AttachmentPanel entityType="central_return"` — hồ sơ ảnh (giữ như bản cũ).
- Trạng thái rỗng: «Chưa có phiếu chuyển vật tư dư nào.»
- Thêm import `AttachmentPanel` từ `@/lib/ui-shared`.

## Files changed
| Tệp | Thay đổi |
|---|---|
| `app/screens/Inventory.tsx` | khối luân chuyển vật tư dư trong tab «Cấp phát & hoàn trả» + import `AttachmentPanel` |

## Frontend changes
Có (1 tệp sản phẩm).

## Backend changes / Database changes / API changes
⛔ **Không có.** Dùng action sẵn có `approve_central_return` + modal `centralReceive` (đã ở tầng app ⇒ dùng được từ mọi màn).

## Permission changes
⛔ Không đổi. Nút Duyệt vẫn phụ thuộc `action` + trạng thái phiếu; ⛔ backend vẫn là tầng quyết định.

## Workflow changes
⛔ **Không đổi luồng**: đề nghị → duyệt → vận chuyển → kiểm đếm → nhận. Chỉ **đổi chỗ hiển thị**.

## Testing (đều chạy thật)
| Cổng | Kết quả |
|---|---|
| `npx tsc --noEmit` | ✅ exit 0 |
| contract toàn bộ | ✅ **616 tests · 615 pass · 0 fail · 1 skip** (⛔ không sửa test nào) |
| `npm run test:regression` | ✅ **69/69** |
| `gd-cycle` | ✅ build ĐẠT · fingerprint `VNTECH-FP-79AADCA5A0B74FDE` |

## Known issues (⛔ còn 1 bước dọn)
1. ⛔ **Đường cũ chưa gỡ**: `app/page.tsx` **dòng ~1151** vẫn còn khối «Luân chuyển vật tư dư dự án → Kho Tổng» trong màn `CentralWarehouse`.
   - **Bằng chứng đây là ĐƯỜNG CŨ**: `lib/menu-helpers.ts:141` ghi rõ `central_warehouse` **«bị ẨN KHỎI MENU nhưng VẪN là khoá nghiệp vụ THẬT»**, nay menu dùng `warehouse_hub` nhãn «Kho».
   - ⛔ **Chưa gỡ trong vòng này** vì đó là **một dòng rất dài (~1.5k ký tự)**; ⛔ **không sửa mù** khi chưa đọc chính xác từng ký tự. Cần gỡ bằng công cụ sửa văn bản sau khi đọc đúng dòng, rồi chạy lại đủ cổng.
   - ⚠️ Hệ quả tạm thời: danh sách này **xuất hiện ở 2 nơi** (màn Kho mới + màn `central_warehouse` cũ đã ẩn menu) ⇒ ⛔ **không sai nghiệp vụ**, nhưng cần dọn để hết trùng.
2. ⛔ Xác minh bằng mắt (ảnh chuẩn) — **P3-UI-17**.

## Blockers
⛔ **Không có.**

## Next task
**P3-UI-12b** — Mua hàng: dựng 10 tab theo **4 quyết định user vừa chốt** (gộp 1 «Nhà cung cấp» · «Xin giá vật tư» = tab riêng · đổi tên «Kế hoạch giao hàng» → «Giao nhận công trường») — xem bảng 10 tab ở `docs/dsh/MT3_USER_DECISIONS.md`.
