# TASK-MT3-UI-02 — Bảng ánh xạ trạng thái tiếng Việt DÙNG CHUNG (MT3 §IV.6)

| Mục | Nội dung |
|---|---|
| **Task** | P3-UI-02 (GĐ1 · loại 2: **shared component**) |
| **Phase** | **GĐ1 — FRONTEND/UI** |
| **Status** | ✅ **DONE** |
| **Requirement** | MT3 §IV.6: tất cả trạng thái hiển thị bằng **tiếng Việt** · ⛔ không hiển thị mã thô (`pending`, `approved`, `rejected`, `cancelled`, `in_progress`…) · **tạo cơ chế ánh xạ dùng chung**, không viết rải rác ở từng màn · giá trị lạ có **fallback an toàn, không làm crash UI** · ⛔ **không đổi mã trạng thái trong DB**, ưu tiên dịch ở tầng hiển thị |

## Khoảng cách đo được trước khi sửa
- **17 nơi** khai bảng nhãn trạng thái rải rác (`Purchasing.tsx:123,128,151` · `report-catalog.ts:19` · `ui-shared.tsx:92,100`).
- **4 chỗ thực sự rò mã thô ra UI**:
  - `AllocateReturn.tsx:61` → `<StatusBadge value={String(row.status)} />`
  - `TeamDirectory.tsx:494 / 506 / 530` → `value={String(row.status || "—")}` (**3 chỗ**)
  - `Inventory.tsx:105` → nhánh `: String(row.status)` (chỉ nhánh `issued` mới có nhãn)
- Ghi chú kiểm tra lại: `Delivered.tsx` và `ProjectDetailTabs.tsx:221` **không** rò mã trạng thái (đã đối chiếu lại, trước đó tôi ghi nhầm) — ⛔ đã sửa lại danh sách cho đúng.

## Implementation
1. **Tệp mới `lib/status-labels.ts`** — nguồn ánh xạ DUY NHẤT:
   - `GENERIC_STATUS_LABELS` — mã thô → nhãn tiếng Việt (vòng đời đơn/phiếu, mở–đóng, kế toán/vật tư).
   - `DOMAIN_STATUS_LABELS` — nhãn riêng theo phân hệ (`project` · `work_item` · `approval_step`), **ưu tiên cao hơn** bảng chung khi trùng mã.
   - `statusLabel(value, domain?)` — tra không phân biệt hoa/thường; **luôn trả chuỗi**, không throw; rỗng/null ⇒ `"—"`; mã lạ ⇒ viết hoá cho đọc được (`zzz_weird_code` → `Zzz weird code`) thay vì lộ nguyên mã.
2. **Dọn 4 chỗ rò mã thô** (5 dòng) — thay bằng `statusLabel(row.status)`.
3. ⛔ **GIỮ NGUYÊN**: các so sánh nghiệp vụ (`row.status === "issued"`) vẫn dùng **mã gốc**; chỉ tầng hiển thị được dịch. Không đổi mã DB, không đổi API.

## Files changed
| Tệp | Thay đổi |
|---|---|
| `lib/status-labels.ts` | **mới** — nguồn ánh xạ dùng chung |
| `app/screens/AllocateReturn.tsx` | import + dòng 61 |
| `app/screens/TeamDirectory.tsx` | import + 3 dòng (494/506/530) |
| `app/screens/Inventory.tsx` | import + dòng 105 (giữ nhãn "Đã xuất") |
| `tests/mt3-ui-02-status-labels.test.mjs` | **mới** — 8 test |

## Frontend changes
Có (4 tệp sản phẩm). ⛔ Không đổi hành vi nghiệp vụ, không đổi payload.

## Backend changes / Database changes / API changes
⛔ **Không có** (đúng thứ tự MT3 §VI: dịch ở tầng hiển thị, ⛔ không migration).

## Permission changes
⛔ Không đổi.

## Workflow changes
⛔ Không đổi.

## Testing (đều chạy thật)
| Cổng | Kết quả |
|---|---|
| `tests/mt3-ui-02-status-labels.test.mjs` | ✅ **8/8 PASS** — dịch đúng 9 mã phổ biến · ⛔ không nhãn nào còn dấu `_` (dấu hiệu chưa dịch) · fallback không throw/không rỗng cho `null/undefined/""/0/false/{}` · ưu tiên nhãn phân hệ · không phân biệt hoa thường · 3 màn đã sửa không còn render mã thô · ⛔ không có bảng nhãn MỚI rải rác trong màn hình |
| `npx tsc --noEmit` | ✅ exit 0 |
| contract toàn bộ | ✅ **592 tests · 591 pass · 0 fail · 1 skip** |
| `npm run test:regression` | ✅ **69/69** |
| `gd-cycle` | ✅ `VNTECH-FP-0899582699D561BC` · build ĐẠT |

## Known issues
1. ⛔ Các bảng nhãn **riêng của Mua hàng** (`PR_STATUS_LABEL` · `PO_STATUS_LABEL` · `SUPPLY_STATUS_LABEL` tại `Purchasing.tsx`) **cố ý giữ lại** — chúng có ngữ nghĩa riêng theo loại phiếu; test đã ghi rõ danh sách được phép để không "quét nhầm". ⛔ Chưa gom chúng vào `lib/status-labels.ts`.
2. ⛔ Một số màn có thể còn dùng bảng riêng cũ (`WORK_STATUS_LABELS`, `PROJECT_STATUS_LABELS` trong `ui-shared.tsx`) song song — đã hoạt động đúng, việc hợp nhất thuộc task dọn dẹp sau.
3. ⛔ Xác minh bằng mắt (ảnh chuẩn) chưa làm — gom ở **P3-UI-17**.

## Blockers
⛔ **Không có.**

## Bài học
Tôi từng ghi nhầm 2 màn (`Delivered`, `ProjectDetailTabs`) là "rò mã thô" khi thực tế kiểm lại thì **không**. ⛔ Bài học: phải **đọc đúng dòng** trước khi kết luận, đừng tin vào ghi chú audit cũ.

## Next task
**P3-UI-04** — bỏ khối «Chọn dự án» độc lập ở đầu trang, chuyển thành control trong toolbar (đo được còn ở: `page.tsx` (10) · `TeamDirectory.tsx` (5) · `Requests.tsx` (1) · `Inventory.tsx` (1) · `AllocateReturn.tsx` (1)).
