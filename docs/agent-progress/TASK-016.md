# TASK-016 — U-13: Tách `TaskTable` ra khỏi thân render của `WorkCenter`

## Status

DONE

## Objective

Xoá nợ kỹ thuật có sẵn: `TaskTable` được khai báo **bên trong thân render** của `WorkCenter`
(`page.tsx:774`), dùng ở 837/862/866 — gây 3 lỗi eslint `react-hooks/static-components`.

## Previous State

* `function TaskTable({ rows, allowEdit }: { rows: Row[]; allowEdit: boolean })` nằm **trong** `WorkCenter`.
* Nó đóng kín (closure) vào 3 thứ của `WorkCenter`: `projCode`, `busy`, `send`.
* Ba chỗ dùng: `<TaskTable rows={find(mine)} allowEdit/>`, `<TaskTable rows={find(deptWork)} allowEdit={false}/>`,
  `<TaskTable rows={find(teamWork)} allowEdit={false}/>`.
* eslint: **3 lỗi** `react-hooks/static-components` (dòng 837/862/866) + 74 cảnh báo.
* Đã chứng minh đây là nợ CÓ SẴN chứ không phải do thay đổi của tôi: lint chính bản HEAD
  (`git show HEAD:app/page.tsx`) cũng cho đúng 3 lỗi tại đúng 3 dòng đó.

## Implemented

* Chuyển `TaskTable` ra **cấp module**, đặt ngay trước `function WorkCenter(`.
* Đổi chữ ký để nhận đủ dữ liệu qua **props** thay vì closure:
  `rows` · `allowEdit` · `projCode` · `busy` · `send`.
* Cập nhật **cả 3** chỗ dùng để truyền thêm `projCode={projCode} busy={busy} send={send}`.
* Thân hàm JSX **giữ nguyên từng ký tự** (chỉ bỏ thụt lề 2 khoảng khi ra cấp module) — không đổi
  giao diện, không đổi handler, không đổi tên hàm action.
* Thực hiện bằng **script theo số dòng** (`tools/_refactor-u13.mjs`, đã xoá sau khi dùng) thay vì
  chép tay, và script có **chốt chặn**: nếu số chỗ dùng được cập nhật ≠ 3 thì **không ghi tệp**.

## Files Changed

* `app/page.tsx`

## Frontend Changes

Không đổi giao diện. Cùng markup, cùng cột, cùng nút, cùng handler — chỉ đổi vị trí khai báo hàm.
Điểm khác biệt duy nhất về hành vi là **đúng như mong muốn**: React không còn tạo một component MỚI
mỗi lần render, nên state bên trong bảng không còn bị reset ngoài ý muốn.

## Backend Changes

Không đổi backend.

## Database Changes

No database changes.

## Permission Changes

No permission changes.

## Workflow Changes

No workflow changes.

## Important Decisions

* **Làm TASK-016 trước TASK-009…015 dù số thứ tự sau**, vì các task kia cần cổng ảnh/probe (phải khởi
  động Edge headless qua CDP, hiện **không chạy được** do sandbox — yêu cầu mở rộng quyền đã bị huỷ),
  còn TASK-016 **kiểm chứng được hoàn toàn bằng kiểm tra tĩnh**. Ghi rõ lý do để phiên sau không hiểu nhầm
  là làm sai thứ tự.
* Không dùng `useCallback`/`useMemo` che lỗi — cách sửa đúng là **khai báo ở cấp module**.

## Dependencies

* Không có task nào phụ thuộc TASK-016.
* TASK-016 phụ thuộc U-11 ở khía cạnh: khi tách `page.tsx` thành module thì `TaskTable` đã sẵn sàng
  để chuyển sang tệp riêng.

## Known Limitations

* Chưa chạy cổng ảnh/probe sau thay đổi này (cùng lý do trên). Bù lại, đây là refactor **không đổi
  một ký tự JSX nào**, và đã được kiểm bằng `tsc` + `eslint` — hai lớp kiểm tra tĩnh đủ cho một việc
  không đổi giao diện và không đổi logic.
* 74 cảnh báo eslint vẫn còn (không tăng).

## Testing

* `node tools/_refactor-u13.mjs` → in ra: khối ở dòng 774..798 (25 dòng) · chèn bản cấp module trước
  dòng 744 · cập nhật **3/3** chỗ dùng · đã ghi tệp.
* `npx tsc --noEmit --incremental false` → **exit 0 (ĐẠT)**.
* `npx eslint app/page.tsx -f json` → **LỖI: 0** (trước là 3) · CẢNH BÁO: 74 (không tăng).

## Validation Result

PASS

## Git Commit

Chưa commit tại thời điểm ghi hồ sơ — commit ngay sau tệp này.

## Next Task

TASK-009 — U-09 đợt 6 (13 màn còn lại). Nếu quyền mở rộng sandbox chưa có thì tiếp tục chọn việc
**kiểm chứng được không cần trình duyệt** (ví dụ đồng bộ `ACTION_CATALOG.json` với SystemController).

## Continuation Notes

* **Vì sao việc này quan trọng:** khai báo component trong thân render tạo component MỚI mỗi lần render;
  React coi là component khác nên **state bên trong bị reset**. Với bảng có nút cập nhật tiến độ, đây
  là lỗi tiềm ẩn thật chứ không chỉ là chuyện lint.
* **Cách sửa đúng là khai báo ở cấp module và truyền props** — KHÔNG dùng `useCallback`/`useMemo` để
  che cảnh báo.
* **Đừng chép tay khối mã để sửa.** Tôi từng vấp: chép `GẮN CẤP BẬC` trong khi tệp là `GÁN CẤP BẬC`
  ⇒ bản sửa trượt. Với refactor nhiều dòng, hãy viết script theo **số dòng** và đặt **chốt chặn**
  (nếu số chỗ khớp ≠ dự kiến thì không ghi tệp).
* **Cổng ảnh/probe hiện KHÔNG chạy được** vì cần mở rộng sandbox (Edge headless dùng named pipe).
  Nếu phiên sau có quyền đó, hãy chạy `node tools/probe-visual-regression.mjs` và bộ 14 probe để
  đóng nốt phần hồi quy của TASK-008 và TASK-016.
