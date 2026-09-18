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

## 7. NHẬT KÝ ĐÃ THỰC HIỆN (bước 2 và bước 3) — cùng ngày 18/09/2026

### 7.1. Bước 2 — LÔ 2 (7 khối có JSX + có import) — commit `#182`
Chuyển sang `lib/ui-shared.tsx`: **`AppData`** (kiểu dữ liệu bootstrap) · **`money`** · **`date`** · **`CardHead`** ·
**`Empty`** · **`NavIcon`** · **`Kpi`**. Kết quả: `app/page.tsx` **3890 → 3822**, module **228 → 314 dòng**.
Công cụ được nâng lên **chế độ 2** (`--move=A,B,C`): chuyển được khối **có JSX và có import** và **SINH IMPORT** cho tệp mới
(ánh xạ tên → module lấy từ chính các câu `import` của `page.tsx`; `ReactNode`… → `react`).

**Ba lỗi của chính tôi trong lô 2 (đều bị CỔNG bắt, không lọt):**
1. Công cụ sinh `import … from "@/lib/ui-shared"` **ngay trong chính `lib/ui-shared.tsx`** cho các tên **đã chuyển ở lô 1**
   (`format` · `NAV_ICON_TYPE` · `Row`…) ⇒ `tsc` **`TS2440: Import declaration conflicts with local declaration`**.
   Đã sửa bằng tập **`selfNames`** (tên đã nằm trong module đích thì KHÔNG import lại).
2. Bộ lọc an toàn **báo động giả**: nó coi **mọi ký hiệu** là "tên không rõ nguồn", kể cả **dữ liệu path SVG**
   (`M3 16h13…`), khoá object, tên thuộc tính, biến cục bộ ⇒ in ra hàng trăm dòng buộc tội vô nghĩa.
   Đã thu hẹp về **đúng câu hỏi cần hỏi**: chỉ **CHẶN** khi khối chuyển đi còn tham chiếu một **khai báo top-level của
   `page.tsx` mà không được chuyển** (nguy cơ import vòng).
3. Chú thích `// eslint-disable-next-line @typescript-eslint/no-explicit-any` của `type Row` **bị rơi** khi công cụ ghi lại
   tệp ở lần chạy thứ hai (đoạn "giữ nội dung cũ" cắt từ **dòng khai báo đầu tiên** nên bỏ mất chú thích ngay trên nó)
   ⇒ eslint báo **1 error**. Đã khôi phục chú thích và **dọn 4 tên import thừa** (`NAV_ICON_TONE` · `NAV_ICON_TYPE` ·
   `kpiIconName` · `boqStatusLabel` — nay do module dùng) ⇒ eslint **0 error · 71 warning** (nền 72).

### 7.2. Bước 3 — TÁCH 6 MÀN ĐẦU TIÊN ra `app/screens/` — commit `#183`
Sau lô 2, đo lại bằng `tools/kiem-tra-phu-thuoc-man.mjs`: **6 màn nhỏ nhất đều có cột *"CÒN Ở page.tsx" = 0***
⇒ tách được ngay, không còn nguy cơ import vòng:

| Tệp mới | Dòng | `page.tsx` sau mỗi lần |
|---|---|---|
| `app/screens/SealScreen.tsx` | 7 | 3822 → 3817 |
| `app/screens/CorrespondenceScreen.tsx` | 8 | 3817 → 3810 |
| `app/screens/BenefitsScreen.tsx` | 9 | 3810 → 3802 |
| `app/screens/LaborScreen.tsx` | 10 | 3802 → 3793 |
| `app/screens/SiteCostScreen.tsx` | 12 | 3793 → 3782 |
| `app/screens/CashbankScreen.tsx` | 15 | 3782 → **3768** |

Công cụ thêm `--out=<đường dẫn>` + `--back=<spec>`; **câu import trong mỗi tệp màn do công cụ SINH TỰ ĐỘNG**, ví dụ
`SealScreen.tsx` nhận đúng **4 câu**: `StatusBadge` (`@/app/components/ui`) · `CardHead, Empty, date` (`@/lib/ui-shared`) ·
`type AppData, Row` · `FormEvent` (`react`).

**Kết quả luỹ kế cả 3 bước:** `app/page.tsx` **4037 → 3767 dòng (−270)**; **`app/screens/` 6 tệp mới**;
`lib/ui-shared.tsx` **314 dòng**; eslint **`app/page.tsx` 65 warning** (nền 72 ⇒ **giảm 6**, vì cảnh báo "tham số không dùng"
đi theo màn sang tệp mới), **0 error** toàn bộ.

### 7.3. Bằng chứng kiểm chứng (cả 3 bước — refactor THUẦN nên bằng chứng phải là ẢNH)

| Cổng | Bước 1 | Lô 2 | Tách 6 màn |
|---|---|---|---|
| 🔬 **cổng ảnh 56 ảnh (14 màn × 4 kích thước)** | **TRÙNG BYTE** `B7E70927…6530` | **TRÙNG BYTE** `B7E70927…6530` | **TRÙNG BYTE** `B7E70927…6530` |
| `tsc --noEmit` | EXIT 0 | EXIT 0 | EXIT 0 |
| eslint | 0 error · 72 warning | 0 error · 71 warning | 0 error · **65 warning** (page.tsx) |
| `npm run build` | EXIT 0 | EXIT 0 | EXIT 0 + BUILT ARTIFACT VALIDATION ĐẠT |
| `test:regression` | 59/61 (đúng nền) | 59/61 | 59/61 |
| `master-baseline-gate` | ĐẠT | ĐẠT | ĐẠT |
| Bản phục vụ | `VNTECH-FP-864B84D9F05AE3DF` | `VNTECH-FP-DD4569AE8642395F` | **`VNTECH-FP-2002BED16DE89A0B`** |
| `page.tsx` | 3890 | 3822 | **3767** |


### 7.4. Bước 3 vòng 2 — TÁCH THÊM 4 MÀN — commit `#186`

`app/screens/HrScreen.tsx` (9 dòng) · `DocumentsScreen` (12) · `ConstructionScreen` (25) · `LegalDocsScreen` (8).
`app/page.tsx` **3767 → 3717 dòng**; eslint `page.tsx` **63 warning** (nền 72). **Luỹ kế cả 4 vòng: 4037 → 3717 = giảm 320 dòng.**

**Một màn bị LOẠI và ghi rõ lý do (không đoán):** `FinanceRecoveryScreen` còn phụ thuộc `reportRows` · `reportExport` ·
`reportPdf` · `printReport` (đang ở `page.tsx`) ⇒ tách ngay sẽ tạo **import vòng**; công cụ **từ chối ghi** nên nó không bị đụng tới.

**🔎 PHÁT HIỆN VỀ CHÍNH PHƯƠNG PHÁP KIỂM CHỨNG (quan trọng):** vòng này hash báo cáo cổng ảnh **ĐỔI**
(`B7E70927…6530` → `625D357C…E841`). Đã **đối chiếu từng dòng** bằng `Compare-Object`: **chỉ khác DUY NHẤT** phần ghi chú
*(lần đầu N px)* của màn `01-dashboard` desktop/laptop (8913 → **8923** px · 3653 → **3663** px), còn **mọi con số kết luận
và số ảnh lệch (27/56) giống hệt**. ⇒ Đó là **NHIỄU NỀN ĐÃ BIẾT của cổng ảnh (KP #1)** — không phải thay đổi do tách module.
**Bài học:** khi dùng **so HASH báo cáo** để chứng minh "refactor thuần", phải **bỏ qua phần ghi chú "(lần đầu N px)"**
(đó là số của lần chụp THỨ NHẤT, có thể lệch do nhiễu) và so **CON SỐ KẾT LUẬN**; hash khác thì **chạy lại cổng** hoặc dùng
`--selftest` trước khi kết luận có hồi quy.


### 7.5. Bước 3 vòng 4 — LÔ HELPER XUẤT BÁO CÁO + 2 MÀN `Delivered`/`Inventory` — commit `#190`

**Đúng thứ tự «đo → chuyển phụ thuộc → tách màn»:** đo bằng `tools/kiem-tra-phu-thuoc-man.mjs` thấy
`Delivered` còn phụ thuộc 4 khối và `Inventory` còn 3 khối ⇒ **chuyển 12 helper** sang `lib/ui-shared.tsx`:
`deliveredExportRows` · `exportDeliveredXlsx` · `exportDeliveredCsv` · `downloadDeliveredPdf` · `downloadTabularPdf` ·
`printTabularReport` · **`AttachmentPanel`** · `inventoryExportRows` · `exportInventoryXlsx` · `printInventoryBarcodes` ·
`printInventoryLedger` · `code39Svg` — rồi mới tách **`app/screens/Delivered.tsx`** và **`app/screens/Inventory.tsx`**.

| Bước | `page.tsx` |
|---|---|
| Trước vòng 4 | 3585 |
| Sau khi chuyển 12 helper | 3550 |
| Sau khi tách `Delivered` | 3544 |
| Sau khi tách `Inventory` | **3517** |

**Luỹ kế cả 5 vòng tách: `app/page.tsx` 4037 → 3517 dòng = GIẢM 520 dòng**; `app/screens/` **14 màn**;
`lib/ui-shared.tsx` nay có **53 khối** (helper + giao diện + hằng).

**Kiểm chứng vòng 4:** `tsc` **EXIT 0** · eslint **0 error** (`page.tsx` 72 = đúng nền · `ui-shared` 2 · `app/screens` 19) ·
`npm run build` **EXIT 0** + BUILT ARTIFACT VALIDATION **ĐẠT** · `master-baseline-gate` **ĐẠT** ·
`test:regression` **59/61 (đúng nền)** · cổng ảnh: so báo cáo **sau khi bỏ ghi chú nhiễu `(lần đầu N px)`** ⇒
**0 DÒNG KHÁC BIỆT** ⇒ không đổi 1 điểm ảnh · UI `:8787`/proxy `:9000`/Java `:18081` đều **200**.

## 8. Việc kế tiếp của `U-11` (bước 3 vòng sau / bước 4)

1. **Tách tiếp các màn còn "sạch phụ thuộc":** chạy `tools/kiem-tra-phu-thuoc-man.mjs <TênMàn…>` để tìm màn có
   *"CÒN Ở page.tsx" = 0*; dự kiến lô kế tiếp: `HrScreen` · `DocumentsScreen` · `ConstructionScreen` ·
   `FinanceRecoveryScreen` · `LegalDocsScreen` (kiểm trước, **không đoán**).
2. **Bước 4 (còn lại của `U-11`):** các màn lớn `WorkCenter` / `Requests` / `BoqControl` cần thêm helper ⇒
   lặp lại chu trình: **đo phụ thuộc → chuyển helper sang `ui-shared` → kiểm cổng ảnh trùng byte → tách màn**.
3. ⚠️ **Luôn giữ đủ lưới:** `tsc` + eslint + `npm run build` + **cổng ảnh trùng byte** + `test:regression` + `preflight`
   — chính lưới này đã bắt được **2 test đỏ oan + build EXIT 1** (bước 1), **TS2440** (lô 2), **1 error eslint** (lô 2).


