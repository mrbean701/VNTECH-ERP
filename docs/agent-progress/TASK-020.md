# TASK-020 — U-15 (phần StatusBadge): thay 88 chỗ `<Pill>` bằng `<StatusBadge>`

## Status

DONE (kiểm chứng tĩnh đầy đủ; **chưa** kiểm chứng bằng mắt vì cổng ảnh đang bị chặn — xem Known Limitations)

## Objective

Hợp nhất nhãn trạng thái về một nguồn duy nhất: thay toàn bộ `<Pill>` tự tạo trong `app/page.tsx`
bằng `<StatusBadge>` dùng chung (mục U-15), **mà không làm đổi màu** ở bất kỳ chỗ nào.

## Previous State

* `app/page.tsx` có **88 chỗ** `<Pill value={…}/>` và một hàm `Pill` tự định nghĩa logic suy luận màu.
* `StatusBadge` (U-05) đã tồn tại nhưng **chỉ được dùng 2 chỗ** — tức mới dựng khung, chưa áp dụng.
* **Phát hiện quan trọng:** hai hàm suy luận màu **KHÔNG giống hệt nhau**:
  * `<Pill>`: `… || lower === "đạt"` → **SO SÁNH BẰNG**
  * `<StatusBadge>`: `GREEN_HINTS = ["đã","đủ","đạt"]` với `includes` → **CHỨA**
  ⇒ Với giá trị `"Chưa đạt"`: `<Pill>` cho **xanh dương**, `<StatusBadge>` cho **xanh lá** (sai ngữ nghĩa).
  Nếu thay hàng loạt mà không sửa, đó sẽ là **thay đổi giao diện không kiểm chứng được** (cổng ảnh đang chặn).

## Implemented

1. **Sửa `StatusBadge` cho khớp chính xác `<Pill>`**: tách `"đạt"` ra khỏi danh sách `includes` và đưa
   vào danh sách **SO SÁNH BẰNG** (`GREEN_EXACT`). Ghi rõ lý do ngay trong mã.
2. **Viết công cụ chứng minh tương đương** `tools/probe-statusbadge-parity.mjs`:
   * Bản tham chiếu là logic của `<Pill>` chép **nguyên văn** từ `page.tsx`.
   * Hàm `toneOf` của `StatusBadge` được lấy bằng cách **đọc trực tiếp tệp `.tsx`** — lấy **cả hằng số
     lẫn thân hàm** rồi dựng bằng `new Function`. Nhờ vậy **không chép lại logic**, và nếu ai sửa tệp
     thì công cụ phát hiện ngay.
   * Kiểm **163 giá trị**, trong đó **116 giá trị lấy TỰ ĐỘNG từ mã nguồn thật** (`<Pill value="…">`
     và các chuỗi literal trong biểu thức), cộng bộ giá trị biên (rỗng, `null`, `undefined`, số, boolean,
     chuỗi chứa nhiều từ khoá để kiểm thứ tự ưu tiên).
   * Kết quả: **0 khác biệt** ⇒ việc thay thế không thể đổi màu.
3. **Thay 88 chỗ** bằng script **có chốt chặn** (đếm trước, kiểm giả định, chỉ ghi khi sạch) — và
   **gỡ luôn** khai báo `function Pill` (nay không còn ai dùng).

## Files Changed

* `app/components/ui/StatusBadge.tsx` — sửa quy tắc `"đạt"` (đạt tương đương `<Pill>`)
* `app/page.tsx` — 88 chỗ `<Pill>` → `<StatusBadge>`; gỡ khai báo `Pill`
* `tools/probe-statusbadge-parity.mjs` (MỚI)

## Frontend Changes

88 chỗ hiển thị nhãn trạng thái nay dùng component dùng chung. **Không đổi màu** (đã chứng minh).
Gỡ một hàm trùng lặp khỏi `page.tsx`.

## Backend Changes

Không đổi backend.

## Database Changes

No database changes.

## Permission Changes

No permission changes.

## Workflow Changes

No workflow changes.

## Important Decisions

* **Thay hàng loạt chỉ được phép khi đã CHỨNG MINH tương đương.** Khi cổng ảnh không chạy được
  (TASK-B02) thì phải chứng minh ở **mức mã nguồn**, không được thay rồi hy vọng.
* **Khi phát hiện hai bản khác nhau, sửa theo bản ĐANG CHẠY** (`<Pill>` là bản hiện hành), không sửa
  theo bản mới cho "đẹp" — vì mục tiêu là không đổi hành vi.
* `tools/probe-statusbadge-parity.mjs` giữ vai trò **khoá chống tái diễn**: chạy lại bất cứ lúc nào.

## Dependencies

* Dựa trên U-05 (`StatusBadge`) ở TASK-003.
* Mở đường cho phần còn lại của U-15 (`DataTable` — còn **100** bảng tự viết và **100** trạng thái
  rỗng tự viết) và cho U-14/U-16/U-17.

## Known Limitations

* **Chưa kiểm chứng bằng mắt.** Cổng ảnh và bộ probe cần mở rộng sandbox cho Edge headless
  (TASK-B02), hiện chưa có ⇒ chưa có ảnh chụp đối chiếu. Bù lại, đã chứng minh tương đương ở mức
  mã nguồn (163 giá trị, 0 khác biệt) nên **về lý thuyết không thể đổi màu**; nhưng đây vẫn là
  suy luận từ mã, không phải bằng chứng từ ảnh.
* **Bundle đang chạy chưa được build lại** ⇒ giao diện phục vụ trên :9000 vẫn là bản cũ. Cần build
  lại ở bước cuối (theo quy tắc "luôn rebuild ở bước cuối") trước khi người dùng test thủ công.
* Phần `DataTable` của U-15 **chưa làm** (còn 100 chỗ).

## Testing

* `node tools/probe-statusbadge-parity.mjs` → **163 giá trị đã kiểm (116 từ mã nguồn) · 0 KHÁC NHAU · ĐẠT ✅**
* `npx tsc --noEmit --incremental false` → **exit 0 (ĐẠT)**
* `npx eslint app/page.tsx` → **LỖI 0** · CẢNH BÁO 74 (không tăng)
* `node tools/probe-ui-adoption.mjs` → `StatusBadge` **2 → 90 lần dùng thật**; `<Pill>` **88 → 0**;
  `ListToolbar` 10 → 13

## Validation Result

PASS (kiểm chứng tĩnh) — **PARTIAL nếu xét cả kiểm chứng bằng mắt**, vì cổng ảnh đang bị chặn.

## Git Commit

Commit cùng lượt (#21).

## Next Task

TASK-021 — U-15 phần `DataTable` (100 bảng tự viết). Hoặc TASK-014 (U-11) tách `page.tsx`.
Nếu TASK-B02 được gỡ (có quyền mở rộng sandbox) thì **ưu tiên chạy cổng ảnh** để đóng phần kiểm
chứng bằng mắt cho TASK-020 và TASK-008.

## Continuation Notes

* **KỸ THUẬT ĐÁNG DÙNG LẠI — kiểm chứng tương đương khi không chạy được trình duyệt:** đừng import
  tệp `.tsx` (cần `tsx`/`esbuild`, mà esbuild **spawn tiến trình con nên bị EPERM** dưới sandbox).
  Thay vào đó **đọc tệp `.tsx` và lấy ra hằng số + thân hàm**, dựng lại bằng `new Function`. Cách này
  không chép lại logic (nên không lệch theo thời gian) và chạy hoàn toàn trong tiến trình.
* **BẪY ĐÃ VẤP (3 lần liên tiếp trong chính task này):**
  1. Phép kiểm "tệp khác có dùng `<Pill>` thật không" bắt nhầm **chú thích** — lần 1 chỉ bỏ `//`,
     mà tệp lại nhắc trong **chú thích khối**. Phải bỏ **cả hai** kiểu.
  2. Tôi viết `/* */` **bên trong một chú thích khối** → đóng chú thích sớm, script lỗi cú pháp.
     Khi viết công cụ xử lý chú thích thì đừng nhúng ký hiệu chú thích vào chính chú thích.
  3. Đừng chép tay khối mã — dùng script theo số dòng/mẫu có **chốt chặn** và **kiểm lại sau khi ghi**.
* **Nếu ai đó sửa `toneOf` trong `StatusBadge.tsx`:** chạy ngay
  `node tools/probe-statusbadge-parity.mjs` — nó sẽ báo nếu logic lệch khỏi `<Pill>` gốc.
