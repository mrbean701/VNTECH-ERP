# TASK-MT3-UI-05 — Chi tiết mở bằng MODAL + vùng hồ sơ hiển thị đầy đủ (MT3 §IV.8, §E)

| Mục | Nội dung |
|---|---|
| **Task** | P3-UI-05 |
| **Phase** | **GĐ1 — FRONTEND/UI** |
| **Status** | ✅ **DONE** |
| **Requirement** | MT3 §IV.8: chi tiết bản ghi **ưu tiên modal thống nhất**; màn đang dùng side tab/side panel mà yêu cầu chỉ định modal thì **phải chuyển sang modal**. MT3 §E «Đơn hàng đã giao»: «Chi tiết đơn giao hàng phải là modal, không phải side tab. Sửa modal để phần "Ảnh và hồ sơ giao hàng" hiển thị đầy đủ: không bị cắt · có vùng cuộn · có trạng thái rỗng · xử lý file/ảnh lỗi · responsive» |

## Kết quả AUDIT (đọc từ mã — ⛔ không giả định, và **giữ nguyên phần đã đúng**)
| Nội dung | Thực tế đo được | Xử lý |
|---|---|---|
| `ReceiptDrawer.tsx` mở chi tiết bằng gì? | `<div class="overlay"><aside class="modal card receipt-modal">` ⇒ **ĐÃ LÀ MODAL** | ✅ **không sửa lại** (MT3: giữ nguyên phần đã đúng) |
| `.modal` trong CSS | `width:min(900px,96vw); max-height:94vh`, canh giữa trong `.overlay` | ✅ đạt |
| Lớp `.drawer` (side panel) | `globals.css:1023` `width:min(420px); border-left` — **lớp RIÊNG** | chứng minh 2 lớp khác nhau |
| `drawer-body` / `drawer-section` | lớp **lồng bên trong** (tên cũ), ⛔ KHÔNG phải side panel | ⛔ không đụng |
| Vùng hồ sơ cuộn riêng | ⛔ **CHƯA CÓ** | ✅ **đã thêm** |
| Ảnh hỏng | ⛔ `<img>` **không** `onError` ⇒ hiện biểu tượng ảnh vỡ | ✅ **đã thêm** |
| Lỗi tải danh sách hồ sơ | ⛔ `.catch(() => setFiles([]))` — **nuốt im lặng**, user tưởng không có hồ sơ | ✅ **đã sửa — nói thẳng lỗi** |

## Implementation (sửa 1 component dùng chung ⇒ áp cho MỌI màn có hồ sơ)
1. `lib/ui-shared.tsx` → `AttachmentPanel`:
   - `brokenIds` + `markBroken()`: ảnh tải/hỏng ⇒ hiện nhãn **«ẢNH LỖI / Không mở được»** thay vì biểu tượng vỡ; ⛔ ảnh lỗi **không bấm được** (vì không có gì để xem).
   - `loadError`: API lỗi ⇒ hiện `role="alert"` «Không tải được danh sách hồ sơ (…)» ⇒ ⛔ **không** lặng lẽ hiện «chưa có tệp».
   - Giữ nguyên: trạng thái rỗng có sẵn · lightbox · phím ESC · chế độ chỉ-đọc theo `canManage` · tải nhiều tệp.
2. `app/styles/canonical.css` mục **14.9**: `.attachment-panel` có `max-height: min(46vh, 420px)` (⛔ **không px cứng**) + `overflow:auto` ⇒ không bị cắt trong modal; lưới ảnh `auto-fill`; `@media 650px` nới vùng cuộn + thu nhỏ ô ảnh ⇒ **responsive**.

## Files changed
| Tệp | Thay đổi |
|---|---|
| `lib/ui-shared.tsx` | `AttachmentPanel`: xử lý ảnh hỏng + báo lỗi tải |
| `app/styles/canonical.css` | mục **14.9** (vùng cuộn · nhãn ảnh lỗi · responsive) |
| `tests/mt3-ui-05-modal-attachment.test.mjs` | **mới** — 5 test |

## Frontend changes
Có (2 tệp sản phẩm). ⛔ Không đổi API, không đổi luồng tải/xoá tệp.

## Backend changes / Database changes / API changes
⛔ **Không có.** ⛔ Đã kiểm: `/api/files` trả `response.ok ? json : { attachments: [] }` — đó chính là nơi **nuốt lỗi**; sửa ở tầng hiển thị (`AttachmentPanel`) là đúng, ⛔ không sửa backend trong GĐ1.

## Permission changes
⛔ Không đổi. `canManage` (chỉ Chỉ huy trưởng / Nhân viên Phòng Dự án được bổ sung–xoá) giữ nguyên.

## Workflow changes
⛔ Không đổi.

## Testing (đều chạy thật)
| Cổng | Kết quả |
|---|---|
| `tests/mt3-ui-05-modal-attachment.test.mjs` | ✅ **5/5 PASS** — modal không dùng lớp `.drawer` · `.modal` có trần theo viewport · vùng hồ sơ có cuộn riêng + `min(Nvh,…)` + responsive 650px · mọi `<img>` có `onError` · ảnh lỗi không mở lightbox · lỗi tải có `role="alert"` + nói rõ · ⛔ cấm `.catch(() => setFiles([]))` trần · giữ trạng thái rỗng/lightbox/ESC/canManage |
| `npx tsc --noEmit` | ✅ exit 0 |
| contract toàn bộ | ✅ **603 tests · 602 pass · 0 fail · 1 skip** |
| `npm run test:regression` | ✅ **69/69** |
| `gd-cycle` | ✅ build ĐẠT · fingerprint `VNTECH-FP-8E5F6AE597BB6C62` |

## Known issues
1. ⛔ Xác minh bằng mắt (ảnh chuẩn) chưa làm — gom ở **P3-UI-17**.
2. ⛔ `.inventory-transfer-panel` (`Inventory.tsx:88`) là **panel TẠO PHIẾU NHẬP/XUẤT/ĐIỀU CHUYỂN**, ⛔ **không phải** panel xem chi tiết ⇒ MT3 §IV.8 không áp dụng; phần kho (card kho + modal chi tiết) thuộc **P3-UI-10**.

## Blockers
⛔ **Không có.**

## Bài học
Test đầu tiên của tôi **quá chặt**: cấm mọi `className` chứa chữ `drawer`, trong khi `drawer-body`/`drawer-section` chỉ là lớp lồng bên trong ⇒ đỏ **giả**. Đã sửa thành cấm đúng **lớp layout `.drawer`** và bổ sung phép chứng minh 2 lớp này khác nhau. ⛔ Bài học: phép đo phải bám **ý nghĩa yêu cầu**, không bám **tên chuỗi**.

## Next task
**P3-UI-06** — responsive: thêm breakpoint **320/375px** (đo được: hiện có 110 khối `@media`, phủ 768/1024/1440, ⛔ **thiếu mốc 320/375**) + **toggle menu tự ẩn khi đủ chỗ** (MT3 §IV.3) + đo ở 5 mức rộng bắt buộc.
