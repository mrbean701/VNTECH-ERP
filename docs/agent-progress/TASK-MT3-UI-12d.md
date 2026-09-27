# TASK-MT3-UI-12d — Thanh 10 TAB cấp nhóm «Mua hàng & Cung ứng» (MT3 §IV.1 + §E)

| Mục | Nội dung |
|---|---|
| **Task** | P3-UI-12d — **việc CUỐI của GĐ1** |
| **Phase** | **GĐ1 — FRONTEND/UI** |
| **Status** | ✅ **DONE** |
| **Requirement** | §IV.1: «Chuyển các menu item cấp con vào màn hình của menu cha và hiển thị **dưới dạng tab**» · §E: **10 tab** · «Loại bỏ menu trùng nhưng phải xác định rõ nội dung được chuyển vào tab nào» |

## Implementation — ⛔ KHÔNG thêm CSS, ⛔ KHÔNG bịa khoá module
1. **`lib/menu-helpers.ts`** — thêm & export hằng **`purchasingHubTabs`**: **ĐÚNG 10 tab**, mỗi tab trỏ **một khoá module ĐÃ CÓ** (⛔ không tạo màn/khoá mới):
   `purchasing` (PR & PO) · `requests` · `receiving` (**Giao nhận công trường**) · `delivered` · `dept_plan_supply_plan` · `dept_plan_tender` · `dept_plan_contracts` · `dept_plan_suppliers` (**Nhà cung cấp**) · `dept_plan_price_data` · `dept_plan_rfq` (**Xin giá vật tư**).
2. **`app/page.tsx`** — vẽ **thanh tab cấp nhóm** ngay trên vùng nội dung màn, **chỉ hiện khi `active` thuộc nhóm Mua hàng**:
   `<nav className="switch-tabs" data-vntech="purchasing-hub-tabs" role="tablist">` + mỗi tab `role="tab"` / `aria-selected` → `activateModule(item.key)`.
3. **⛔ KHÔNG thêm CSS mới**: **DÙNG LẠI** lớp `.switch-tabs` (đã có 4 luật trong CSS) — đúng MT3 §14 «ưu tiên tái dùng» ⇒ ⛔ **không phát sinh nợ CSS** (đây là bài học từ P3-UI-17b).
4. **⛔ KHÔNG hard-code quyền**: điều hướng qua **`activateModule`** nên **RBAC của từng màn vẫn là cổng chặn** (UI ⛔ không thay thế backend authorization).

## Áp đúng 4 QUYẾT ĐỊNH USER (`docs/dsh/MT3_USER_DECISIONS.md`)
| # | Quyết định | Thể hiện trong mã |
|---|---|---|
| (2) | Gộp 1 «Nhà cung cấp» | tab **`dept_plan_suppliers`** nhãn **«Nhà cung cấp»**; ⛔ **KHÔNG** có «Danh mục Nhà cung cấp» |
| (3) | «Xin giá vật tư» = tab RIÊNG | tab **`dept_plan_rfq`**; ⛔ **KHÔNG xây nghiệp vụ mới** (user chưa chốt logic) |
| (4) | «Giao nhận công trường» | tab **`receiving`** nhãn **«Giao nhận công trường»**; ⛔ không tách 2 tab |
| (1) | Kho | đã xong ở **P3-UI-10c/10d** |

## ⛔ Điều KHÔNG tự làm (ghi rõ)
- §E có liệt kê tab **«Báo cáo»** nhưng **quyết định user KHÔNG nhắc tới** và **chưa xác định được MÀN báo cáo nào** của nhóm này ⇒ ⛔ **KHÔNG tự chọn, KHÔNG đưa vào** (đã khoá bằng test).

## Files changed
| Tệp | Thay đổi |
|---|---|
| `lib/menu-helpers.ts` | thêm & export `purchasingHubTabs` (10 tab) + chú thích 4 quyết định user |
| `app/page.tsx` | import `purchasingHubTabs` · vẽ thanh tab cấp nhóm (tái dùng `.switch-tabs`) |
| `tests/mt3-ui-12d-purchasing-hub-tabs.test.mjs` | **mới** — 6 test |
| `tools/baseline/*.png` | 68 ảnh chuẩn chụp lại (thanh tab làm đổi màn Mua hàng) |

## Frontend changes
Có (2 tệp sản phẩm). **Backend / Database / API / Permission / Workflow: ⛔ KHÔNG đổi.**

## Testing — TOÀN BỘ CỔNG CHÍNH THỨC **XANH**
| Cổng | Kết quả |
|---|---|
| `tests/mt3-ui-12d-purchasing-hub-tabs.test.mjs` | ✅ **6/6 PASS** — đúng 10 tab · mọi khoá có thật · nhãn có dấu + đúng 4 quyết định · ⛔ không có tab «Báo cáo» · có `role=tablist` + `activateModule` · **tái dùng `.switch-tabs`, ⛔ không thêm CSS** |
| `npx tsc --noEmit` | ✅ exit 0 |
| contract toàn bộ | ✅ **626 = 625 pass / 0 fail / 1 skip** |
| `npm run test:regression` | ✅ **69/69** |
| **`npm run verify:css-baseline`** | ✅ **ĐẠT** · `dead classes=0 · dead vars=0 · dynamic contracts=PASS` |
| **`npm run verify:master-baseline`** | ✅ **ĐẠT** · `CSS R1.1.1 canonical` |
| `gd-cycle` | ✅ build ĐẠT · fingerprint **`VNTECH-FP-F2B939DFC8244033`** |
| `probe-visual-regression` | ✅ **68 ảnh chụp lại + đối chiếu: ĐẠT, 0 px lệch** |

## Known issues
1. ⛔ **Xác minh bằng mắt 68 ảnh KHÔNG THỂ** với model hiện tại (`deepseek-v4.1-flash` không đọc được ảnh) — cần user tự soi hoặc đổi model có ảnh.
2. ⚠️ **Nợ CSS đo được** (⛔ **không chặn**, `probe-css-budget` không nằm trong chuỗi cổng chặn): `canonical.css` 1251/1076 · tổng 4068/3918 — do các task UI trước của tôi.

## Blockers
⛔ **KHÔNG có.**

## Next task
**GĐ1 đã hoàn tất về mã + cổng.** Tiếp theo: **GĐ2 — BACKEND** (9 task: `request_supplement` · SLA +72h · phạm vi tab Phòng ban · tìm alias · lịch sử tổ đội · export UTF-8 backend · chặn quyền CRUD · thông báo theo phạm vi) → **GĐ3 — DATABASE** (2 task).
