# TASK-MT3-UI-06 — Responsive 5 mức rộng + Toggle menu tự ẩn (MT3 §IV.2, §IV.3)

| Mục | Nội dung |
|---|---|
| **Task** | P3-UI-06 |
| **Phase** | **GĐ1 — FRONTEND/UI** |
| **Status** | ✅ **DONE** |
| **Requirement** | MT3 §IV.2: dùng được ở **320 · 375 · 768 · 1024 · 1440 px**; không tràn viewport; không che nút; bảng rộng cuộn **trong vùng bảng**; tab dài cuộn ngang; modal không vượt viewport; toolbar wrap có kiểm soát, ⛔ không thành cột dọc lệch phải. §IV.3: nút Toggle **chỉ hiện khi menu chưa vừa**, đủ chỗ thì **tự biến mất**; không mất truy cập bằng bàn phím/cảm ứng |

## Khoảng cách đo được trước khi sửa
| Mục | Đo được | Xử lý |
|---|---|---|
| Khối `@media` ở mốc **320/375px** | ⛔ **0 khối** (chỉ có 420/520/650) | ✅ thêm mục **14.10** |
| Nút thu gọn menu | ⛔ **luôn hiện** ở mọi mức rộng | ✅ giờ chỉ hiện khi menu **thật sự tràn dọc** |

## Implementation
1. **`app/page.tsx` — `menuNeedsToggle`**: đo `nav.scrollHeight > nav.clientHeight + 2` ⇒ menu không vừa ⇒ hiện nút. Lắng nghe `resize` + **vòng đo 1 giây** (menu đổi theo quyền user). Khi đã thu gọn thì **luôn** hiện nút (không mất khả năng mở lại).
2. **Giữ hợp đồng cũ**: nút **luôn nằm trong DOM** ngay trước `server-status`, chỉ ẩn bằng `hidden={!menuNeedsToggle}`.
3. **`app/styles/canonical.css` mục 14.10**: khối `375px` (toolbar wrap **theo hàng** · tab cuộn ngang · `.table-wrap` cuộn · modal `100vw/100dvh`) + khối `320px` (siết thêm).

## Files changed
| Tệp | Thay đổi |
|---|---|
| `app/page.tsx` | `menuNeedsToggle` + đo tràn + `hidden` trên nút |
| `app/styles/canonical.css` | mục **14.10** (375px + 320px) |
| `tools/probe-responsive-5widths.mjs` | **mới** — cổng đo 5 mức rộng bằng `Emulation.setDeviceMetricsOverride` |

## Frontend changes
Có (2 tệp sản phẩm). ⛔ Không đổi nội dung menu, không đổi quyền.

## Backend changes / Database changes / API changes / Permission changes / Workflow changes
⛔ **Không có.**

## Testing (đều chạy thật)
| Cổng | Kết quả |
|---|---|
| `tools/probe-responsive-5widths.mjs` | ✅ **EXIT=0** — 320 / 375 / 768 / 1024 / 1440 px: `overflowBy = 0` (**không tràn viewport**), `.table-wrap overflow-x = auto` (bảng cuộn trong vùng), modal vừa khung, toolbar không vỡ cột dọc, **nút thu gọn menu = ẩn** (menu đủ chỗ ⇒ tự ẩn đúng §IV.3) |
| `npx tsc --noEmit` | ✅ exit 0 |
| contract toàn bộ | ✅ **603 tests · 602 pass · 0 fail · 1 skip** |
| `npm run test:regression` | ✅ **69/69** |
| `gd-cycle` | ✅ build ĐẠT · fingerprint `VNTECH-FP-A0BE45851C0E56AC` (535 tệp) |

## Lỗi THẬT bị bắt trong task này (đều đã sửa — ghi để không lặp)
1. 🛑 **Hợp đồng preflight bắt được**: `scripts/preflight-source.mjs:108` bắt chuỗi `</button></nav><div className="server-status"`. Tôi bọc nút trong điều kiện ⇒ **build ĐỎ**. Sửa bằng thuộc tính `hidden` (giữ nguyên cấu trúc DOM) thay vì điều kiện render.
2. ⛔ **`tsc` bắt**: `allowedSignature` dùng trước khi khai báo ⇒ bỏ khỏi mảng phụ thuộc (vòng đo 1 giây đã đủ).
3. ⛔ **Test của chính tôi bắt**: MT3-UI-01 cấm `flex-direction: column` ở toolbar ⇒ tôi đã **hiểu sai §IV.4** (yêu cầu là *wrap THEO HÀNG*, không phải cột dọc) ⇒ sửa CSS giữ `row + wrap`, chỉ cho mỗi nút chiếm trọn 1 hàng.
4. ⚠️ **Probe báo đỏ giả**: lần đầu cổng đo báo «⛔ TRÀN» cho bảng rộng, nhưng MT3 §IV.2 **cho phép** bảng cuộn trong vùng của nó ⇒ sửa phép đo loại trừ phần tử nằm trong vùng cuộn. Sau sửa: **0 dòng TRÀN** ở cả 5 mức.

## Known issues
1. ⛔ Khi bật chế độ mô phỏng **mobile**, Chrome báo bề rộng thực hơn giá trị đặt (vd đặt 320 ⇒ đo 329) ⇒ các con số tràn **0px** vẫn đáng tin, nhưng phải hiểu là **bề rộng hiệu dức**.
2. ⛔ Cổng đo mới chạy trên màn mặc định sau đăng nhập; chạy trên **từng màn** (có bảng/toolbar riêng) thuộc **P3-UI-17**.
3. ⛔ Nút thu gọn hiện/ẩn còn cần soi bằng mắt trên ảnh chuẩn — **P3-UI-17**.

## Blockers
⛔ **Không có.**

## Next task
**P3-UI-07** — menu → tab: **Thi công hiện 0 tab** (cần cấu trúc tab) · **Kho mới có 2 tab** (`Tồn kho`, `Dashboard tồn kho`) trong khi MT3 §F yêu cầu **4 tab** (Kho · Nhập kho & Xuất kho · Tồn kho · Cấp phát & hoàn trả) · **Công việc** cần thêm tab **Dự án** (§A yêu cầu 4 tab: Cá nhân · Dự án · Phòng ban · Báo cáo).
