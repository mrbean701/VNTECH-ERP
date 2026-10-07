# TASK-MT3-F1c — Nút «Yêu cầu bổ sung» (PHẦN UI của §B.3)

| Mục | Nội dung |
|---|---|
| **Task** | MT3-F1c |
| **Phase** | **GĐ1 — FRONTEND/UI** |
| **Status** | ✅ **DONE (phần UI)** · ⏳ phần backend thuộc GĐ2 |
| **Requirement** | MT3 §B.3: thêm nút «Yêu cầu bổ sung» · chỉ hiện khi có quyền + phiếu đúng trạng thái · click mở **vùng nhập văn bản tương tự Bình luận** · **không dùng `window.prompt`** · **validate nội dung rỗng** · lưu người yêu cầu/thời gian/nội dung/audit (GĐ2) · gửi thông báo (GĐ2) |

## Implementation (phần UI — GĐ1)
1. **Trạng thái riêng** `supplementOpen` / `supplementText` / `supplementError` (⛔ tách khỏi `approvalComment` để không lẫn bình luận duyệt với yêu cầu bổ sung).
2. **Nút** `ⓘ YÊU CẦU BỔ SUNG` gắn `data-vntech="approval-supplement-open"`; `onClick` **mở vùng nhập** (trước đây chỉ `open("detail")` ⇒ **nút giả, không làm gì**).
3. **Vùng nhập** `data-vntech="approval-supplement-form"`: textarea + nút **Huỷ** + nút **Ⓢ Gửi yêu cầu bổ sung**; hiển thị lỗi ở `data-vntech="approval-supplement-error"`.
4. **Validate rỗng**: `if(!supplementText.trim()){ setSupplementError("Vui lòng nhập nội dung cần bổ sung."); return; }` — ⛔ chặn trước khi gọi API, form **không đóng**.
5. **Hiển thị có điều kiện**: `{permitted && supplementOpen && …}` ⇒ chỉ hiện khi user **được duyệt bước này** (`permitted` đã gộp `canUse` + `stageAllowedForUser`), đúng «chỉ hiển thị khi user có quyền và phiếu ở trạng thái cho phép».
6. **CSS** `canonical.css` mục **14.8**; `@media 650px` ⇒ nút xếp **dọc** (⛔ không lệch bên phải, MT3 §IV.2).

## Files changed
| Tệp | Thay đổi |
|---|---|
| `app/page.tsx` | 3 state mới + vùng nhập + nút thật (thay nút giả) |
| `app/styles/canonical.css` | mục **14.8** |
| `tools/probe-approval-detail-comments.mjs` | thêm phép đo §B.3 |

## Frontend changes
Có (3 tệp). Không thêm màn mới.

## Backend changes
⛔ **Không có** — và **đây là khoảng trống thật đã ghi nhận**: action `request_supplement` **CHƯA TỒN TẠI** (đã grep `java-backend`: không có `supplement`). Nút Gửi sẽ gọi action đó ⇒ hiện **báo lỗi**, ⛔ **KHÔNG giả lập thành công**. Phần lưu người yêu cầu · thời gian · audit trail · notification thuộc **GĐ2** theo đúng thứ tự MT3 §VI.

## Database changes
⛔ Không có (GĐ3).

## API changes
🟡 **Hợp đồng API đã chốt (chờ GĐ2 hiện thực):** `request_supplement` · `{ requestId, stage, reason }`.

## Permission changes
⛔ Không đổi RBAC. UI dùng `permitted` sẵn có; ⛔ **backend vẫn phải** chặn khi GĐ2 làm (MT3 §15).

## Workflow changes
⛔ Không đổi luồng duyệt. Yêu cầu bổ sung **không** tự đổi trạng thái phiếu.

## Testing (đều chạy thật)
| Cổng | Kết quả |
|---|---|
| `probe-approval-detail-comments.mjs` (DOM thật) | ✅ **EXIT=0** — §B.2 `stepHasCommentLabel: 0`, `detailCommentsBlock: 1`; §B.4 `queue=detail=meta=658 · spread=0`, `listMaxHeight: none`; **§B.3** `button ✓ opensForm ✓ hasTextarea ✓ submit ✓ emptyBlocked ✓ formStillOpen ✓ noPromptUsed ✓` với lỗi thật *«Vui lòng nhập nội dung cần bổ sung.»* |
| `probe-approval-horizontal.mjs` | ✅ EXIT=0 — dải vẫn NGANG, `sameRow: true` |
| `npx tsc --noEmit` | ✅ exit 0 |
| contract | ✅ 579 tests · 578 pass · 0 fail · 1 skip |
| `npm run test:regression` | ✅ **69/69** |
| `gd-cycle` | ✅ `VNTECH-FP-EA731C95DE0B4C1D` · build ĐẠT |

## Known issues
1. ⛔ Bấm «Gửi yêu cầu bổ sung» sẽ **báo lỗi** vì action chưa tồn tại (đã ghi rõ, không giả lập). Cần GĐ2.
2. Ảnh chuẩn visual chưa chụp lại (gom task MT3-F14).

## Blockers
⛔ **Không có blocker kỹ thuật.** Việc hoàn tất §B.3 **đầy đủ** phụ thuộc GĐ2 (backend) theo đúng thứ tự MT3 §VI — **không phải** blocker.

## Bài học (ghi lại vì lặp 2 lần trong task này)
React cập nhật state **bất đồng bộ** ⇒ probe phải **tách click → chờ render → mới đo**, nếu đo ngay sẽ báo sai (`opensForm:false`, `emptyBlocked:false` giả).

## Next task
**MT3-F3** — toolbar CRUD dùng chung (ưu tiên §20: một component giải quyết nhiều màn): gom Tạo·Sửa·Xoá·Tìm·Sắp xếp·Lọc·Xuất Excel vào `ListToolbar`, dọn 64 `row-actions` + 91 `export-mini` rải rác.
