# TASK-088 — `U-11` BƯỚC 1: TÁCH HELPER DÙNG CHUNG RA `lib/ui-shared.tsx`

- **Mã:** TASK-088 · **Ngày:** 18/09/2026 · **Roadmap:** `U-11` (P1 — Kiến trúc: *"Tách `page.tsx` thành module theo màn hình"*)
- **Định danh nguồn:** head `drizzle/0130_phase1_ui_test_union_source_identity.sql` ⇒ **`VNTECH-FP-864B84D9F05AE3DF`**
- **Trạng thái:** **DONE bước 1/4** — `app/page.tsx` **4037 → 3890 dòng**; còn bước 2–4 (xem mục 5)

## 1. Vì sao lại là "bước 1" mà không tách màn ngay

`docs/agent-progress/U14-U11-KHAO-SAT.md` mục 2 đã chốt thứ tự cắt: **tách HELPER DÙNG CHUNG trước**.
Lý do kỹ thuật (không phải khẩu vị): mọi màn trong `page.tsx` đều gọi các helper/hằng số nằm **cùng tệp**
(`PERM_CAPS`, `ADMIN_HELP_TEXT`, `WORK_STATUS_LABELS`, `format`, `date`, `taskStatusLabel`…). Nếu tách một màn ra
tệp mới ngay, tệp màn đó **buộc phải import ngược từ `page.tsx`** ⇒ **import vòng** (`page.tsx` import màn, màn import
`page.tsx`). Tách helper ra module trung lập trước là cách **gỡ chặn** đó.

## 2. Đã làm gì

| Việc | Kết quả đo được |
|---|---|
| Tạo **`lib/ui-shared.tsx`** (⚠️ phải là `.tsx` vì có component JSX) | **33 khối · 228 dòng** = 31 giá trị + 2 kiểu (`Row`, `ModuleKey`) |
| Giảm **`app/page.tsx`** | **4037 → 3890 dòng** (−147) |
| Công cụ tách **`tools/tach-lat-cat-page.mjs`** | tự **KIỂM ĐIỀU KIỆN AN TOÀN trước khi ghi** (xem mục 3); có `--dry` |
| Công cụ phân tích **`tools/phan-tich-phu-thuoc-page.mjs`** | liệt kê 262 khai báo top-level + tập **LÁ** để chọn lát cắt kế tiếp |

**Nội dung đã chuyển:** bảng nhãn trạng thái (`WORK_STATUS_LABELS` · `WORK_CLOSED` · `PROJECT_STATUS_LABELS` ·
`APPROVAL_STAGE_LABELS` · `APPROVAL_MODE_LABELS` · `APPROVAL_MODE_SHORT` · `DEPT_MODULE_GROUP` · `roleNames`),
hàm định dạng/tiện ích (`format` · `date` · `durationText` · `initials` · `projectPeriod` · `kpiIconName` · `joinCodes` ·
`boqStatusLabel` · `taskStatusLabel` · `canvasJpegBytesForDownload`), hàm chuẩn hoá tiêu đề
(`normalizeBoqHeader` · `normalizeMasterHeader` · `normalizePaymentDate` · `sanitizeUiText` · `truthyCatalog` ·
`materialCatalogTemplateRows`), hằng dùng chung (`PERM_CAPS` · `ADMIN_HELP_TEXT` · `defaultMenuGroups` ·
`NAV_ICON_TYPE` · `NAV_ICON_TONE` · `BOQ_SYSTEM_CODES` · `CODE39` · `UI_NOW_MS`), và 2 kiểu `Row` · `ModuleKey`.

## 3. ⚠️ Điều kiện an toàn của lát cắt (do CÔNG CỤ tự kiểm, không do người đọc lại bằng mắt)

Một khối chỉ được chuyển nếu thân nó **chỉ** dùng: (a) các khai báo **cùng được chuyển trong lượt**, (b) tên có sẵn
của JS/trình duyệt, (c) **không có JSX**, (d) **không dùng kiểu của React** (`ReactNode`…), (e) **không tham chiếu tên
nào đến từ `import`**. ⇒ Tệp mới **không cần import nào** ⇒ **không thể tạo import vòng, không thể thiếu import**.
Công cụ **từ chối ghi** nếu điều kiện vi phạm, và in rõ khối nào bị **để lại** và vì sao ([JSX] / [import]).

## 4. 🔴 BỐN LỖI CỦA CHÍNH TÔI trong lượt này (ghi lại để không lặp)

1. **Ghi module vào `app/lib/…` trong khi alias `@/*` trỏ về GỐC dự án** (`"@/*": ["./*"]` trong `tsconfig.json`) ⇒
   import không giải được ⇒ `tsc` báo **`TS7006: Parameter 'c' implicitly has an 'any' type`** — **lỗi ĐÁNH LỪA**:
   trông như lỗi suy diễn kiểu, thật ra là **lỗi ĐƯỜNG DẪN**. Đúng phải là **`lib/ui-shared.tsx` ở GỐC**.
2. **Tệp không có `export`** ⇒ giữ nguyên văn khai báo (không `export`) thì tệp **không phải là module** ⇒
   `TS2306: File '…/ui-shared.tsx' is not a module` ⇒ mọi thứ nhập về thành `any`. Đã sửa bằng cách **thêm một câu
   `export { … }` / `export type { … }` ở cuối tệp** (giữ nguyên văn từng khối chuyển đi).
3. **Đuôi `.ts` không chứa được JSX** ⇒ `TS1005: ';' expected`. Bộ lọc JSX ban đầu chỉ bắt `<TênHoa` nên **lọt**
   component dùng thẻ thường (`<div>`, `<footer>`, `<button>`). Đã siết bộ lọc: **bắt mọi thẻ**.
4. **TÁI PHẠM lỗi đã ghi trong sổ: dùng `Set-Content -Encoding UTF8` của PowerShell** để thay chuỗi trong tệp test ⇒
   **MOJIBAKE toàn bộ tiếng Việt**. Đã `git checkout --` hoàn tác rồi làm lại **hoàn toàn bằng node (UTF-8)**.
   *(Quy tắc đã có trong sổ từ lâu — lần này vẫn tái phạm ⇒ phải coi là lỗi nghiêm trọng.)*
   Cả 4 lần `app/page.tsx` và tệp test đều được **HOÀN TÁC về trạng thái sạch** rồi chạy lại — **không để lại mã hỏng**.

## 5. Kiểm chứng (refactor thuần ⇒ bằng chứng phải là **ẢNH**, không phải lời khẳng định)

| Cổng | Kết quả |
|---|---|
| `tsc --noEmit` | **EXIT 0** |
| eslint (`app/page.tsx` + `lib/ui-shared.tsx`) | **0 error** · 72 warning (= đúng nền cũ) |
| `npm run build` | **EXIT 0** + `BUILT ARTIFACT VALIDATION: ĐẠT` |
| `master-baseline-gate` | **ĐẠT** (`!important=4950` · `css=400643B`) |
| 🔬 **cổng ảnh 56 ảnh (14 màn × 4 kích thước)** | **TRÙNG NHAU TỪNG BYTE** với lượt trước (`B7E70927…6530`) ⇒ **không đổi 1 điểm ảnh** |
| `npm run test:regression` | **59 pass / 2 fail** = **đúng nền** (2 ca đã biết: `Project management always expands…` · `FULL W2 migration chain…`) |
| `probe-modal-branch-coverage` | **3 ĐẠT · 0 HỎNG** (36 nhánh · 34 tên) |
| Bản phục vụ | `VNTECH-FP-864B84D9F05AE3DF` · UI `:8787` **200** · proxy `:9000` **200** · Java `:18081` **200** |

### 5b. ⚠️ HỒI QUY ĐÃ BẮT ĐƯỢC VÀ ĐÃ VÁ: tầng kiểm thử đọc CỨNG `app/page.tsx`
Sau khi tách helper, `npm run test:regression` tụt từ **59/61 → 57/61** (thêm **2 test đỏ**):
* `Project/BCH navigation is consolidated into one top-level group` — regex tìm literal `groupKey: "site_command", name: "QUẢN LÝ DỰ ÁN"` (nay nằm trong `defaultMenuGroups` ở module mới).
* `MASTER BASELINE R1.1.1 CSS dynamic contracts` — *"Phải đọc được `NAV_ICON_TONE` từ source"* (đã chuyển sang module).
➕ Và `npm run build` **EXIT 1** vì cổng `scripts/preflight-source.mjs` cũng đọc cứng `app/page.tsx`
(*"Navigation hợp nhất Project → BCH chưa đổi nhóm site_command…"*).

**Đã vá đúng gốc — KHÔNG nới lỏng phép kiểm:** mọi literal vẫn **phải tồn tại trong nguồn giao diện**, chỉ đổi
**phạm vi ĐỌC** sang **hợp nhất nguồn giao diện** (`app/page.tsx` + `lib/ui-shared.tsx`, tệp nào chưa có thì bỏ qua):
* `scripts/preflight-source.mjs`: `finalPageSource` = hợp nhất danh sách `CLIENT_SOURCE_FILES`.
* `tests/runtime-admin-boq-regression.test.mjs`: helper `readUiSource()`, thay **9 chỗ**.
* `tests/project-navigation-consolidation.test.mjs` + `tests/mobile-menu-interaction.test.mjs`: mỗi tệp 1 chỗ.
⇒ **Vì sao bắt buộc phải vá:** nếu không, **chính tầng kiểm thử chặn việc tách mà roadmap `U-11` yêu cầu**.

## 6. Việc kế tiếp (bước 2–4 của `U-11`) — ĐÃ ĐO PHỤ THUỘC, KHÔNG ĐOÁN

Công cụ mới **`tools/kiem-tra-phu-thuoc-man.mjs <TênMàn…>`** trả lời được câu "màn này cần gì còn nằm ở `page.tsx`".
Đo 6 màn nhỏ nhất (18/09/2026):

| Màn | Dòng | Phụ thuộc **còn ở `page.tsx`** | Từ `import` |
|---|---|---|---|
| `SealScreen` | 2193–2199 **(7 dòng)** | `AppData` · `CardHead` · `date` · `Empty` | `Row` · `FormEvent` |
| `CorrespondenceScreen` | 2208–2215 (8) | `AppData` · `Kpi` · `CardHead` · `date` · `Empty` | `Row` · `FormEvent` |
| `BenefitsScreen` | 2184–2192 (9) | `AppData` · `Kpi` · `money` · `CardHead` · `date` · `Empty` | `Row` · `FormEvent` |
| `LaborScreen` | 2216–2225 (10) | `AppData` · `Kpi` · `CardHead` · `date` · `money` · `Empty` | `Row` · `FormEvent` · **`UI_NOW_MS`** (⚠️ đang ở `page.tsx`, sẽ phải nhập từ `ui-shared`) |
| `SiteCostScreen` | 2262–2273 (12) | như trên | `Row` · `useState` · `FormEvent` · `ChangeEvent` |
| `CashbankScreen` | 2247–2261 (15) | như trên | `Row` · `useState` · `FormEvent` · `ChangeEvent` |

⇒ **KẾT LUẬN CÓ CĂN CỨ:** tách màn **ngay bây giờ là KHÔNG được** — mọi màn đều cần **`AppData` · `Kpi` · `money` · `CardHead` ·
`date` · `Empty`** đang nằm ở `page.tsx`, tách ra sẽ **import ngược ⇒ import vòng**.
**Việc ĐÚNG của bước 2 (thay cho "tách màn"):** **mở rộng `tools/tach-lat-cat-page.mjs` để chuyển được các khối CÓ JSX và CÓ import**
(nó sẽ phải **sinh dòng import tương ứng trong tệp mới**, ví dụ `import type { ReactNode } from "react"`, `import { StatusBadge } from "@/app/components/ui"`),
rồi chuyển **lô 2** gồm đúng 6 thứ trên + `AppData`. Sau lô 2 thì `SealScreen` (7 dòng) là màn **đầu tiên tách được**.

1. **Bước 2a:** mở rộng công cụ để chuyển khối có JSX/import (giữ nguyên nguyên tắc: **từ chối ghi nếu không chắc**).
2. **Bước 2b:** chuyển **lô 2** (`CardHead` · `Empty` · `Kpi` · `money` · `date` · `AppData`) ⇒ kiểm bằng **cổng ảnh trùng byte**.
3. **Bước 3:** tách `SealScreen` ra `app/screens/SealScreen.tsx` ⇒ lại kiểm **cổng ảnh trùng byte**; sau đó `CorrespondenceScreen`, `BenefitsScreen`…
4. **Bước 4:** **KHÔNG** tách `WorkCenter` / `Requests` / `BoqControl` trong các vòng đầu (phụ thuộc nhiều helper + modal).
5. ⚠️ **Mỗi lần tách phải chạy lại:** `tsc` + eslint + build + **cổng ảnh trùng byte** + `test:regression` + `preflight`
   (**chúng là lưới bắt hồi quy** — chính lưới này đã bắt được 2 test đỏ oan + build EXIT 1 ở bước 1).

