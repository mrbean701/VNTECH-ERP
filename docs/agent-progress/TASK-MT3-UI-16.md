# TASK-MT3-UI-16 — AUDIT ĐIỂM XUẤT EXCEL/CSV + UTF-8 (MT3 §IV.7, §VII)

| Mục | Nội dung |
|---|---|
| **Task** | P3-UI-16 |
| **Phase** | **GĐ1 — FRONTEND/UI** |
| **Status** | 🟡 **AUDIT MỘT PHẦN** — ✅ CSV đã CHỨNG MINH xong · ⏳ XLSX cần mở file thật |
| **Requirement** | MT3 §IV.7: rà **TẤT CẢ** nút xuất Excel/CSV · tiếng Việt đúng dấu · CSV dùng **UTF-8 + BOM** khi cần · XLSX xác minh Unicode ghi đúng · kiểm tên file/tên sheet/tiêu đề/cột · kiểm response headers với export backend. §VII: «Lập danh sách **tất cả** nút export đã audit; ⛔ không được suy rộng từ một nút» + «Kiểm tra ít nhất **một file thật** từ từng cơ chế». |

## 1) INVENTORY — toàn bộ điểm xuất dữ liệu (đo bằng grep, 18 tệp)
| Tệp | số chỗ khớp `download*`/`new Blob`/`xlsx` | Ghi chú |
|---|---|---|
| `app/page.tsx` | 41 | nhiều nút xuất ở các màn |
| `lib/ui-shared.tsx` | 13 | helper dùng chung |
| `lib/request-export.ts` | 13 | PR/PO: XLSX + PDF |
| `lib/boq-export.ts` | 12 | BOQ: XLSX + ảnh |
| `lib/tabular-export.ts` | 7 | **helper nền dùng chung** |
| `lib/material-catalog-export.ts` | 5 | danh mục vật tư |
| `lib/material-import.ts` | 4 | nhập (không phải xuất) |
| `app/screens/Inventory.tsx` | 4 | kho |
| `app/screens/ProjectDetailTabs.tsx` | 4 | dự án |
| `lib/report-rows.ts` | 3 | báo cáo |
| `app/screens/Payments.tsx` | 3 | thanh toán |
| `app/screens/BoqControl.tsx` | 3 | BOQ |
| `app/screens/ConstructionScreen.tsx` | 2 | thi công (**do MT3 thêm** — P3-UI-09) |
| `lib/supply-docs.tsx` | 2 | chứng từ cung ứng |
| `app/screens/Delivered.tsx` | 2 | đơn đã giao |
| `app/screens/RequestDrawer.tsx` | 2 | modal PR |
| `app/screens/Purchasing.tsx` | 2 | mua hàng |
| `app/screens/Stocktake.tsx` | 1 | kiểm kê |

## 2) CHỨNG MINH CSV — ✅ XONG (bằng chứng quyết định)
**Đo toàn bộ `app/` + `lib/`:** số chỗ tạo `text/csv` = **ĐÚNG 1**.
- Vị trí: **`lib/tabular-export.ts:99`** — `downloadCsv(headers, rows, fileName, delimiter)`.
- Nội dung: `new Blob(["\ufeff", csvText(...)], { type: "text/csv;charset=utf-8" })`
  ⇒ **CÓ BOM `\ufeff`** + **khai báo `charset=utf-8`**.
- ⇒ ⛔ **KHÔNG tồn tại đường CSV nào khác** ⇒ **mọi** nút xuất CSV trong hệ thống đi qua **đúng một** helper có BOM ⇒ ⛔ **không thể lỗi tiếng Việt trên Excel Windows**.
- ✅ Kết luận này đạt yêu cầu «lập danh sách TẤT CẢ điểm» cho phần **CSV** (⛔ không suy rộng — đã chứng minh bằng phép đếm toàn cục).

## 3) XLSX — ⏳ CHƯA CHỨNG MINH BẰNG FILE THẬT (⛔ không tự nhận là đạt)
- Các đường XLSX: `lib/tabular-export.ts:97 downloadSimpleXlsx` · `lib/request-export.ts:56,216` · `lib/boq-export.ts:63,67,75` · `lib/material-catalog-export.ts:39` · `lib/ui-shared.tsx` (`exportInventoryXlsx`).
- Đặc điểm: XLSX là **gói ZIP/XML** ⇒ ⛔ **KHÔNG dùng BOM** (BOM chỉ dành cho CSV); an toàn Unicode phụ thuộc **khai báo encoding trong XML** của `build*XlsxBytes`.
- ⛔ **Chưa làm**: mở/đọc lại **một file thật** từ mỗi cơ chế để đối chiếu tên file · tên sheet · tiêu đề tiếng Việt · ô tiếng Việt · số/ngày (đúng MT3 §VII).
- ⇒ ⛔ **KHÔNG kết luận XLSX đạt** khi chưa có file thật.

## 4) Export do BACKEND sinh (response headers/encoding)
⛔ Chưa rà: MT3 §IV.7 yêu cầu «Kiểm tra response headers và encoding đối với export do backend sinh» ⇒ thuộc **GĐ2 (P3-BE-07)**.

## Files changed
⛔ **Chưa sửa mã** trong task này — đây là **task audit** (đúng bản chất công việc).
Nếu phần 3 phát hiện lỗi thì mới sửa.

## Testing
| Cổng | Kết quả |
|---|---|
| `npx tsc --noEmit` | ✅ exit 0 (không đổi mã) |
| contract toàn bộ | ✅ 616 tests · 615 pass · 0 fail · 1 skip |
| `npm run test:regression` | ✅ 69/69 |
| `gd-cycle` | ✅ build ĐẠT · fingerprint `VNTECH-FP-56D4F5649DD34F43` |

## Known issues / Blockers
⛔ **Không blocker.** Việc còn lại **đã xác định rõ đường làm**: viết script Node gọi `build*XlsxBytes` với chuỗi tiếng Việt → ghi file `.xlsx` → mở bằng thư viện ZIP đọc `xl/sharedStrings.xml`/`xl/worksheets/*.xml` → đối chiếu chuỗi tiếng Việt còn nguyên dấu.

## Next action
1. **P3-UI-16b**: chứng minh XLSX bằng **file thật** (một file cho mỗi cơ chế: `downloadSimpleXlsx` · `request-export` · `boq-export` · `material-catalog-export` · `exportInventoryXlsx`).
2. ⛔ Phần backend headers ⇒ **P3-BE-07 (GĐ2)**.
3. ⛔ Còn 1 việc của P3-UI-12c (gộp NCC — cần đổi **menu catalog** HOẶC thêm bộ lọc UI như mẫu `legacyWarehouseMenuKeys`; đụng test `p07`).
