# TASK-MT3-UI-12c — Gộp 2 mục «Nhà cung cấp» thành 1 (MT3 §E · QUYẾT ĐỊNH USER #2)

| Mục | Nội dung |
|---|---|
| **Task** | P3-UI-12c |
| **Phase** | **GĐ1 — FRONTEND/UI** |
| **Status** | ✅ **DONE** |
| **Requirement** | MT3 §E: «Loại bỏ menu trùng nhưng phải xác định rõ nội dung được chuyển vào tab nào» + QUYẾT ĐỊNH USER 26/09/2026: «**Gộp thành 1 "Nhà cung cấp"**» |

## ⛔ ĐÍNH CHÍNH SUY LUẬN SAI CỦA TÔI (ghi để không lặp)
Ở vòng trước tôi suy luận «màn chuẩn là `dept_plan_suppliers`, `supplier_catalog` là khoá cũ» ⇒ **SAI một nửa**.
**Sự thật đo được** (`lib/menu-helpers.ts` khối P-07 + `app/page.tsx:435-437`):
- Mục menu **«Nhà cung cấp»** + **«Đối tác»** được **KHAI BÁO TRONG CODE** (`supplierPartnerMenuItems`), cùng `moduleKey: "dept_plan_suppliers"`, khác nhau ở `view` (`supplier`/`partner`).
- Dòng `modules` của `dept_plan_suppliers` **ĐÃ bị ẩn** khỏi cây menu từ P-07 (`legacySupplierPartnerMenuKeys = ["dept_plan_suppliers"]`).
- ⛔ **Khoá mã CŨ `supplier_catalog` («Danh mục Nhà cung cấp») KHÔNG nằm trong danh sách ẩn** ⇒ nó **VẪN hiện** trong cây menu ⇒ **đây chính là mục TRÙNG cần gộp**.
- ⚠️ `app/page.tsx:435-437` viết «moduleKey là MÀN ĐÍCH `supplier_catalog`» là **chú thích CŨ/SAI** — `lib/menu-helpers.ts` khối P-07 ghi rõ **«KHÔNG trỏ sang `supplier_catalog`»** (lý do: `accessDenied` tính theo `active` ⇒ trỏ khoá khác sẽ chặn quyền oan).

## Implementation (⛔ 1 dòng, đúng mẫu có sẵn — không tạo cơ chế mới)
```ts
// TRƯỚC:  const legacySupplierPartnerMenuKeys: ModuleKey[] = ["dept_plan_suppliers"];
// SAU  :  const legacySupplierPartnerMenuKeys: ModuleKey[] = ["dept_plan_suppliers", "supplier_catalog"];
```
⇒ Mục menu duy nhất còn lại là **«Nhà cung cấp»** (+ «Đối tác» theo P-07).
⛔ **KHÔNG xoá gì**: khoá `supplier_catalog` **VẪN SỐNG** — quyền · tiêu đề màn · tìm kiếm · nhánh render `SupplierManager` giữ nguyên (đúng nguyên tắc «khoá vẫn sống, chỉ ẩn khỏi menu» mà nhóm Kho đã dùng).

## Files changed
| Tệp | Thay đổi |
|---|---|
| `lib/menu-helpers.ts` | thêm `"supplier_catalog"` vào `legacySupplierPartnerMenuKeys` (+ chú thích quyết định user) |
| `tests/p07-supplier-partner-split.test.mjs` | **cập nhật ĐÚNG 1 phép kiểm** cho khớp quyết định user (giữ nguyên 8 phép kiểm còn lại) |

## Frontend / Backend / Database / API / Permission / Workflow changes
Chỉ **ẩn 1 mục menu trùng**. ⛔ **KHÔNG** đổi quyền · ⛔ **KHÔNG** đổi màn · ⛔ **KHÔNG** đổi API · ⛔ **KHÔNG** đổi CSDL.

## Testing (đều chạy thật)
| Cổng | Kết quả |
|---|---|
| `npx tsc --noEmit` | ✅ exit 0 |
| `tests/p07-supplier-partner-split.test.mjs` | ✅ **9/9 PASS** (sau khi cập nhật 1 phép kiểm) |
| contract toàn bộ | ✅ **620 tests · 619 pass · 0 fail · 1 skip** |
| `npm run test:regression` | ✅ **69/69** |
| `gd-cycle` | ✅ build ĐẠT · fingerprint `VNTECH-FP-A40ACA8D6F052D70` |

## Lỗi tôi đã mắc và tự sửa trong task này
- Chèn **chú thích xen giữa `const` và tên biến** ⇒ chuỗi `const legacySupplierPartnerMenuKeys: …` không còn liền mạch ⇒ test hợp đồng `includes(...)` **HỎNG** (dù `tsc` vẫn xanh). **Sửa**: đặt toàn bộ chú thích **TRÊN** dòng `const`. **Bài học**: khi hợp đồng kiểm bằng `includes` một dòng literal, ⛔ không được chèn gì vào giữa dòng đó.

## Known issues
1. ⚠️ `tests/p07-supplier-partner-split-probe.mjs` (probe CŨ, ⛔ **không** thuộc bộ contract `*.test.mjs`) hỏng sẵn **2 phép kiểm** vì nó đòi `page.tsx` render `SupplierManager view="partner"` — trong khi `page.tsx:64` ghi rõ **«KHÔNG còn dùng chung `SupplierManager view="partner"`»**. ⇒ **lỗi CÓ SẴN, ⛔ không do thay đổi này**. Cần quyết định: xoá probe cũ hay cập nhật — ⛔ chưa tự xoá.
2. ⛔ Xác minh bằng mắt (ảnh chuẩn) — **P3-UI-17**.

## Blockers
⛔ **Không có.**

## Next task
**P3-UI-12d** — dựng **thanh 10 tab** cho màn «Mua hàng & Cung ứng» (gồm tab riêng «Xin giá vật tư» theo QUYẾT ĐỊNH USER #3). Mẫu tham chiếu: `warehouseMenuItems` + `warehouse_hub`.
Sau đó: **P3-UI-10d** (dọn đường cũ màn Kho) · **P3-UI-17** (ảnh chuẩn) → chuyển **GĐ2**.
