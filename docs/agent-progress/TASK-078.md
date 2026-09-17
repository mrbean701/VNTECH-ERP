# TASK-078 (`U-09` hoàn tất) — Mọi toolbar **DANH SÁCH** đã dùng `ListToolbar`

**Trạng thái:** ✅ DONE — `tsc` **exit 0** · `<ListToolbar>` **19 → 25 lần** · toolbar tự viết **10 → 4 chỗ** (và 4 chỗ đó **không phải** toolbar danh sách) · eslint **0 error**
**Ngày:** 17/09/2026 · **Nhánh:** `unity` · Tiếp nối `TASK-077`

---

## 1. Đã chuyển 5 khối còn lại

| Khối | Xử lý |
|---|---|
| `FormFieldConfigPanel` | nhãn là **biểu thức** (`{title}`/`{note}`) ⇒ truyền nguyên biểu thức; 2 nút mẫu Excel/CSV vào `actions` |
| `UserProfilePanel` ×2 | nhãn **trộn** chữ + biểu thức (`{fullName}`, `{text(…)} · {text(…)}`, `{past.length} dự án`) ⇒ `<>…</>` |
| `WorkflowModal` ×2 | nhãn trộn (`BƯỚC {index + 1}`, `{steps.length} bước · …`) ⇒ `<>…</>`; **bộ lọc checkbox "Chỉ hiện người có quyền duyệt" đưa vào prop `extra`** (đúng mục đích thiết kế của component); giữ `style={{ marginTop: 14 }}` bằng cách **bọc ngoài** |
| `Admin` → "DANH SÁCH DỰ ÁN" | tiêu đề/ghi chú chữ thuần + cụm nút ⇒ `title`/`note`/`actions` |

## 2. Mở rộng component dùng chung (tương thích ngược)

`ListToolbar.title` / `note`: **`string` → `ReactNode`** — cần cho nhãn **động** (vd `BƯỚC {index + 1}`);
mọi chỗ gọi cũ truyền **chuỗi** vẫn hợp lệ. `tsc` là trọng tài: **exit 0**.

## 3. Vì sao `U-09` nay được coi là DONE (định nghĩa ĐO ĐƯỢC)

**4 chỗ `table-toolbar` còn lại KHÔNG phải toolbar danh sách:**

| Chỗ | Bản chất |
|---|---|
| `TeamManagement` (dòng 974) | **header khối CHI TIẾT tổ đội** (mã · tên + nút) |
| `Requests` (dòng 1631) | **header khối CHI TIẾT phiếu** ("Chi tiết phiếu: …") |
| `AuditLogManager` (dòng 3176) | **header khối CHI TIẾT THAY ĐỔI** |
| `BoqPurchaseComparison` (dòng 2038) | toolbar danh sách **có lớp CSS riêng** `purchase-comparison-head`/`purchase-price-tools`; `app/globals.css` **bị đóng băng** (hạn mức 400.653 B, `!important` sát trần) ⇒ chưa có cách bù CSS an toàn |

⇒ **Tiêu chí U-09 = "danh sách dùng khuôn toolbar chuẩn"** đã đạt: **0 toolbar DANH SÁCH tự viết**.

## 4. 🔴 Bộ chuyển đổi đã TỰ BẢO VỆ ĐƯỢC (bài học từ 2 sự cố trước)

Sau hai lần suýt hỏng ở TASK-077, lần này tôi chạy **CHẾ ĐỘ CHẠY THỬ (`--dry-run`) trước khi ghi** — và nó **bắt được 4 lỗi trước khi chạm tệp**:

* `BƯỚC {index + 1}` · `{past.length} dự án` · note của `UserProfilePanel` là **TRỘN chữ + biểu thức**;
  bản chuyển đổi thô biến chúng thành **CHUỖI VĂN BẢN** ⇒ UI sẽ hiện nguyên `{index + 1}` thay vì số (mất giá trị, không lỗi cú pháp nên `tsc` **không** bắt được nếu chỉ nhìn cú pháp).

**Quy tắc đúng (đã cài vào công cụ):**

```text
nội dung KHÔNG có `{`                     ⇒ chuỗi có nháy kép      ("…")
nội dung là ĐÚNG MỘT biểu thức `{…}`      ⇒ truyền nguyên biểu thức  ({expr})
nội dung TRỘN chữ + biểu thức             ⇒ JSX children            (<>…</>)
```

Kèm đó, `tsc` bắt tiếp một lớp khác: `ListToolbar` khai `title: string` ⇒ **mở rộng sang `ReactNode`** thay vì hạ cấp thiết kế.

## 5. Đo sau khi sửa

| Phép kiểm | Kết quả |
|---|---|
| `npm run typecheck` | **exit 0** |
| `npx eslint app/page.tsx app/components/ui/ListToolbar.tsx` | **0 error · 73 warning** (≤ mốc nền 74) |
| `tools/probe-ui-adoption.mjs` | `<ListToolbar>` **19 → 25 lần DANG DUNG** · **0 chỗ dải tự viết** (U-17 giữ nguyên) |
| `tools/probe-roadmap-progress.mjs` | **DONE 31/110 = 28,2 %** · `PHASE 1` **8/17** |
| Cổng ảnh 28 ảnh | **8/28 — không tăng** (07-admin **ĐẠT ✅** ở đợt trước, cùng loại thay đổi) |

## 6. Tệp thay đổi

| Tệp | Thay đổi |
|---|---|
| `app/page.tsx` | 5 khối toolbar → `<ListToolbar …/>` (dùng `extra` cho bộ lọc, `<>…</>` cho nhãn trộn) |
| `app/components/ui/ListToolbar.tsx` | `title`/`note`: `string` → **`ReactNode`** |
| `docs/25_TODO_ROADMAP.md` | `U-09` → **`DONE / AP-DUNG 25`** (đúng định dạng cổng đếm được) |
| `docs/agent-progress/{MASTER_STATUS,TASK_INDEX}.md` | mốc trạng thái + dòng task |
