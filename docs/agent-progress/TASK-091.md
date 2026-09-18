# TASK-091 — `U-14`: CHUYỂN `drawer` CHI TIẾT PHIẾU SANG `EntityDetailModal` (bước 1/6 XONG: khảo sát + bằng chứng TRƯỚC)

- **Ngày mở:** 18/09/2026 · **Trạng thái:** `DANG-LAM 1/6` (khảo sát xong, **chưa đụng mã**)
- **Nguồn:** MASTER TASK PHASE 1 UI/UX (`U-14`) · KP #92 · công thức chuyển ở `U14-U11-KHAO-SAT.md` §1.4

## 1. Vì sao việc này làm được AN TOÀN ngay bây giờ

1. **4 quyết định treo đã chốt xong** (KP #88 · hover · KP #89 · KP #96) ⇒ không còn thay đổi lớn nào chồng lên.
2. **Cổng ảnh đã phủ đúng màn này và đang ĐẠT:** `12-drawer-request-detail` — màn có bước `{ click }` mở drawer,
   **4/4 kích thước lệch 0 px** (đo lại 18/09 trước khi sửa: `tools/probe-visual-regression.mjs --only=12-`).
3. **Cổng đo khung** (`getBoundingClientRect`) sẽ **từ chối ĐẠT** nếu khung mới tràn khung nhìn.

## 2. Bản đồ kỹ thuật ĐO ĐƯỢC (không suy đoán)

| Thành phần | Vị trí | Ghi chú |
|---|---|---|
| `EntityDetailModal` | `app/components/ui/EntityDetailModal.tsx:44` | API: `open` · `onClose` · `title` · `subtitle` · `entityId` · `tabs[]` (`key`/`label`/`content`/`badge`/`permission`) · `footer` · `actions` · `width` · `loading` · `error` · `emptyText` · `canView`. Có **Esc để đóng**; tab mặc định = `visibleTabs[0]`; tự lọc tab theo `permission`. |
| **`RequestDrawer`** (ứng viên thật) | `app/page.tsx:2894` | **TOÀN BỘ JSX NẰM TRONG MỘT DÒNG 9.254 ký tự** (`<div className={isPage ? "overlay page-mode" : "overlay"} …><aside className={isPage ? \`drawer request-drawer is-page…\`}>…`). Hàm chỉ có 2 dòng vật lý (2894 JSX + 2895 `}`). |
| `ReceiptDrawer` | `app/page.tsx:2903` | drawer "XÁC NHẬN GIAO HÀNG THỰC TẾ" — **1 dòng 4.635 ký tự**; **cũng là chi tiết thực thể** ⇒ **ứng viên thứ 2** (khảo sát ở bước 2). |
| `BaseModal` | `app/page.tsx:2905` | ⛔ KHÔNG đụng (khung chung ~31 modal, CSS đóng băng). |

**Hệ quả kỹ thuật quan trọng:** vì mỗi drawer là **một dòng khổng lồ**, mọi sửa đổi phải dùng **mỏ neo + splice**
(cùng kỷ luật `tools/don-kp96-cay-du-an.mjs`: công cụ **TỰ CHỐI GHI** nếu mỏ neo không khớp đúng 1 lần) và
`tsc`/eslint/cổng ảnh làm trọng tài.

## 3. Công thức chuyển (6 bước, theo `U14-U11-KHAO-SAT.md` §1.4)

1. `open={true}` · `onClose={close}` · `title` = **nguyên văn** chữ trong `<header>` hiện có.
2. `subtitle={<>{request.projectCode} · {request.projectName}</>}` · `entityId={request.requestNo}`.
3. `tabs` = tách **đúng các `<section>` đang có** — dự kiến: `overview` (summary-grid) · `items` (bảng dòng vật tư) ·
   `approvals` (dải phê duyệt **đang dùng `ApprovalTimeline`** — giữ nguyên) · `files` (khối tệp/ảnh).
4. `footer` = **chuyển y nguyên** cụm nút (kể cả nút in phiếu); nút `type="submit"` của `<form>` ⇒ dùng
   **`<button form="<id-form>">`** (HTML hợp lệ, không cần `onClick`).
5. Giữ **mọi** `onClick`/`stopPropagation`/`action(...)`; **không đổi payload**.
6. Kiểm chứng: `tsc` · eslint · `npm run build` · **cổng ảnh `--only=12-`** (so ảnh chuẩn bản CŨ) ·
   `probe-modal-branch-coverage` (không phát sinh nút chết) · **đo khung không tràn**.

## 4. Bằng chứng TRƯỚC khi sửa (đã lưu)

```
▸ 12-drawer-request-detail  —  Phiếu đề nghị — drawer chi tiết
   ✅ desktop  lệch 0 px · ✅ laptop 0 px · ✅ tablet 0 px · ✅ phone 0 px
KẾT LUẬN: ĐẠT ✅ — không có vùng lệch nào (4 ảnh đã đối chiếu)
```

⇒ Sau khi chuyển, cổng **buộc phải LỆCH** ở màn này (đây là thay đổi giao diện **có chủ đích**): cách đọc kết quả là
**so vùng lệch + đo khung + kiểm bằng mắt ảnh mới**, **không** kỳ vọng 0 px. Sau khi xác nhận đúng ⇒ `--update`
riêng màn này để chốt ảnh chuẩn mới (ghi rõ trong hồ sơ là **thay đổi có chủ đích**).

## 5. Việc kế tiếp (bước 2/6)

1. Đọc trọn dòng 2894 (9.254 ký tự) + phần còn lại của `EntityDetailModal` (dòng 90–158).
2. Viết công cụ chuyển `tools/chuyen-drawer-sang-edm.mjs` (mỏ neo + tự chối) — **không sửa tay dòng khổng lồ**.
3. Chạy khô → in kế hoạch → áp dụng → chạy chuỗi kiểm chứng bước 6.
4. Khảo sát `ReceiptDrawer` (ứng viên thứ 2) **sau khi** màn đầu xong ⇒ tách thành vòng riêng.
