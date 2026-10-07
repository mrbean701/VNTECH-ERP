# TASK-MT3-F1 — Trung tâm phê duyệt: dải duyệt gọn 4 thông tin + đồng bộ 3 vùng cột

| Mục | Nội dung |
|---|---|
| **Task** | MT3-F1 (gồm F1 = §B.2 và F1b = §B.4) |
| **Phase** | **GĐ1 — FRONTEND/UI** (MT3 §VI.1) |
| **Status** | ✅ **DONE** (2026-09-26) |
| **Requirement** | MT3 §B.2 «Không hiển thị bình luận trực tiếp trên tiến trình; chuyển bình luận vào “Chi tiết”. Mỗi bước chỉ hiển thị: trạng thái · người duyệt/phụ trách · phòng ban · thời gian duyệt» + MT3 §B.4 «Ba vùng (danh sách chờ duyệt · phiếu đang xử lý · hồ sơ chi tiết) phải đồng bộ chiều dài/chiều cao. **Không dùng chiều cao cứng** làm vỡ responsive; dùng layout đồng bộ và vùng cuộn riêng» |

## Implementation
1. **§B.2 — bình luận rời tiến trình:** gỡ khối `data-vntech="approval-step-comment"` khỏi `.approval-flow-step`; thêm vùng mới `data-vntech="approval-detail-comments"` trong khối **Lịch sử xử lý** (vùng Chi tiết) hiển thị theo từng bước: *Bước N · tên bước · người duyệt · phòng ban · nội dung bình luận*, kèm cảnh báo lý do khi thiếu nguồn.
2. **§B.4 — đồng bộ 3 vùng (canonical.css mục 14.7):**
   - `align-items: start` → **`stretch`** (nguyên nhân gốc khiến 3 vùng lệch nhau).
   - `max-height: 650px` (chiều cao cứng) → **`clamp(300px, calc(100vh - 250px), 760px)`** theo viewport.
   - Mỗi vùng thành cột `flex`; **vùng nội dung cuộn riêng** (`.approval-queue-list`, `.approval-flow`, `.approval-meta-pane > dl`), đầu + chân vùng cố định để không mất nút bấm.
   - `@media (max-width: 1100px)`: 3 cột xuống hàng dọc → bỏ giới hạn cao, nội dung tự giãn.

## Files changed
| Tệp | Thay đổi |
|---|---|
| `app/page.tsx` | gỡ bình luận khỏi tiến trình; thêm vùng bình luận ở Chi tiết; bỏ biến `commentView` không dùng |
| `app/styles/canonical.css` | mục **14.6** (CSS vùng bình luận) + **14.7** (đồng bộ 3 vùng) |
| `tests/p2-d4-approval-timeline.test.mjs` | **cập nhật hợp đồng** theo §B.2 (kèm phép đo ngược) |
| `tools/probe-approval-detail-comments.mjs` | **mới** — cổng đo DOM thật §B.2 + §B.4 |

## Frontend changes
Có (4 tệp trên). Không thêm màn/component mới — chỉnh layout kế thừa.

## Backend changes
⛔ **Không có** (MT3 §VI: UI trước, backend ở GĐ2). Không giả lập dữ liệu.

## Database changes
⛔ **Không có** (không migration, không schema).

## API changes
⛔ Không có. Dùng lại payload `approvals[]` (`comment`, `approverName`, `department`, `decidedAt`) đang có sẵn.

## Permission changes
⛔ Không đổi. Nút Duyệt/Trả lại vẫn qua `permitted` + backend `decide_approval` như cũ.

## Workflow changes
⛔ **Không đổi** — chỉ đổi cách hiển thị. Cấu hình duyệt (`approval_stage_catalog` + `approval_project_assignments`) nguyên trạng.

## Testing (đều chạy thật)
| Cổng | Kết quả |
|---|---|
| `probe-approval-detail-comments.mjs` (DOM thật) | ✅ **EXIT=0** — `stepHasCommentLabel: 0`; `detailCommentsBlock: 1` (hiện nội dung thật của phiếu `DNMH-…-0139`); **§B.4: `queue=658 · detail=658 · meta=658 · spread=0`**, `queueScrolls: auto`, `listMaxHeight: none` |
| `probe-approval-horizontal.mjs` | ✅ EXIT=0 — dải vẫn NGANG `o---o`, `sameRow: true` (không hồi quy) |
| `npx tsc --noEmit` | ✅ exit 0 |
| contract | ✅ **579 tests · 578 pass · 0 fail · 1 skip** |
| `npm run test:regression` | ✅ **69/69** |
| `gd-cycle` (identity + build) | ✅ `VNTECH-FP-5A8C36A78AE1753E` (521 tệp) · `BUILT ARTIFACT VALIDATION: ĐẠT` |

## Known issues
1. Ảnh chuẩn visual (`tools/baseline`, 68 ảnh) **chưa** chụp lại sau thay đổi layout ⇒ cổng `probe-visual-regression` sẽ báo lệch cho các màn có ảnh. Sẽ xử lý ở task chụp ảnh chuẩn (MT3-F14).
2. Vùng bình luận chỉ hiện khi phiếu **thật sự có** bình luận (đúng thiết kế, đã đo trên phiếu có 3 bình luận).

## Blockers
⛔ **Không có.**

## Next task
**MT3-F1c** — §B.3: nút «Yêu cầu bổ sung» (UI trước: mở vùng nhập tương tự Bình luận, validate rỗng, ⛔ không `window.prompt`; API/DB để GĐ2).
