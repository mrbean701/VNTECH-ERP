# BÁO CÁO U-09 — CHUẨN HOÁ TOOLBAR DANH SÁCH THEO §5 (ĐỢT 1)

Ngày: 16/09/2026 · Định danh: `VNTECH-FP-CB93B6A92EA43685` · head migration `0104` · manifest 797 tệp

---

## 1. VẤN ĐỀ CẦN SỬA (§5)

Yêu cầu §5 nêu: **toolbar dồn một phía, có cột trống, nút bị đẩy ra ngoài** — và §4 nói rõ: nhiều
module cùng khuôn thì **không được tạo nhiều implementation độc lập**. Khuôn chuẩn:

```
---------------------------------------------------------
TIÊU ĐỀ / SỐ LƯỢNG          TÌM · LỌC · SẮP XẾP · HÀNH ĐỘNG
---------------------------------------------------------
BẢNG DỮ LIỆU
```

Lỗi cụ thể gặp ở các màn: **tiêu đề + nút bị dồn vào một hàng**, còn **bộ lọc nằm ở một card riêng
phía dưới** — thành hai khối rời rạc, có cột trống giữa.

---

## 2. KIỂM KÊ — BẰNG CÔNG CỤ, KHÔNG BẰNG MẮT

`app/page.tsx` có những dòng dài hàng chục nghìn ký tự (gần như mỗi màn nằm trên một dòng), nên
đọc bằng mắt để lập danh sách việc là **không đáng tin**. Đã viết công cụ mới:

**`tools/probe-list-toolbar-inventory.mjs`** — quét theo **dấu hiệu cấu trúc** rồi gắn mỗi dấu hiệu
với **hàm màn hình** chứa nó:

| Dấu hiệu | Ý nghĩa |
|---|---|
| `.approved-module-head` + `.screen-actions` | tiêu đề và nút cùng hàng, bộ lọc ở card riêng |
| `.baseline-filter-card` + `.filter-grid` | bộ lọc tách rời khỏi tiêu đề |
| `.staff-toolbar` / `.staff-directory-head` | kiểu toolbar riêng của màn danh bạ |
| `.table-toolbar` | tiêu đề + hành động, nhưng thiếu ô tìm/lọc chuẩn |
| `.list-toolbar` | đã theo khuôn chuẩn |

**Kết quả kiểm kê:**

```
32 hàm màn hình có dấu hiệu toolbar/danh sách
CẦN CHUYỂN : 32
ĐÃ CHUẨN   : 0
```

---

## 3. ĐỢT 1 — 3 MÀN CÓ ĐÚNG LỖI §5

Chọn 3 màn vừa có lỗi rõ nhất, vừa nằm trong vùng kiểm chứng được:

| Hàm | Màn | Lỗi cũ |
|---|---|---|
| `Requests` | PHIẾU ĐỀ NGHỊ MUA HÀNG | `<h2>` + 4 nút cùng hàng · card lọc riêng bên dưới |
| `WarehouseReceipt` | NHẬP KHO | `<h2>` + nút cùng hàng · card lọc riêng bên dưới |
| `Inventory` | TỒN KHO & ĐIỀU CHUYỂN | `<h2>` + 2 nút cùng hàng · card lọc riêng bên dưới |

**Việc làm cho mỗi màn:**

- Thay `.approved-module-head` + `.screen-actions` bằng **một** `<ListToolbar>`.
- **Gộp card lọc tách rời vào chính toolbar đó** (đây là điểm sửa chính của §5).
- Giữ nguyên **toàn bộ** state/handler cũ (`status`, `query`, `fromDate`, `lowOnly`, `canUse`…).
  **Không đổi nghiệp vụ, không đổi tên hàm action.**
- Ô tìm kiếm → prop `search`; select → prop `filters`; điều khiển khác (ngày, checkbox, phạm vi
  dự án) → prop `extra`; nút hành động → prop `actions`.

---

## 4. KIỂM CHỨNG

### 4.1 Kiểm tra tĩnh

| Lệnh | Kết quả |
|---|---|
| `npx tsc --noEmit --incremental false` | **ĐẠT** (exit 0) |
| `npx eslint app/page.tsx` | 3 lỗi · 74 cảnh báo |

**3 lỗi lint là NỢ CÓ SẴN, đã chứng minh không phải do thay đổi này.** Cách chứng minh: lint chính
bản HEAD (`git show HEAD:app/page.tsx`):

```
BAN HEAD -> loi: 3 | canh bao: 75
LOI [837] react-hooks/static-components
LOI [862] react-hooks/static-components
LOI [866] react-hooks/static-components
```

Bản HEAD cũng **đúng 3 lỗi đó**, tại cùng dòng: hàm `TaskTable` được khai báo **bên trong thân
render** của `WorkCenter` (page.tsx:774) rồi dùng ở 837/862/866. Đây là vùng **không** thuộc phạm vi
sửa. Số cảnh báo **giảm** 75 → 74. Đã ghi thành việc `U-13` trong roadmap.

### 4.2 Cổng so ảnh — KIỂM ĐÚNG MỘT DỰ ĐOÁN ĐÃ NÊU TRƯỚC

Trước khi chạy, dự đoán được nêu rõ: trong 7 màn của bộ ảnh chuẩn, **chỉ `06-warehouse` (= màn NHẬP
KHO) được phép lệch**; 6 màn còn lại phải 0 px.

Kết quả lần chạy đầu: **24/28 ảnh = 0 px** (01-dashboard · 02-project · 03-work · 04-team ·
05-material · 07-admin — cả 4 kích thước), **chỉ `06-warehouse` lệch**. **Dự đoán ĐÚNG.**

### 4.3 Mức lệch lớn hơn kỳ vọng ⇒ đã kiểm tra thật, không mặc định là đúng

`06-warehouse` lệch 24,6% (desktop) · 24,3% (laptop) · 50,0% (tablet) · 48,5% (phone). Mức này cần
giải thích, nên đã kiểm bằng hai cách độc lập:

**(a) DOM thật** — `--locate=400,430`:

```
<DIV> .table-toolbar list-toolbar
  rect=282,315,1614,193  "NHẬP KHOGhi nhận chứng từ nhập kho sau giao hàng và xác nhận…"
```

**(b) OCR vùng toolbar trên ảnh chụp thật** (`--crop=258,92,1662,240`):

```
Tìm                                ← ô tìm kiếm
Số phiếu, PO, NCC, kho...
Trạng thái xác nhận · Tất cả trạng thái
ĐẶT LẠI · + TẠO PHIẾU NHẬP
NHẬP KHO                           ← tiêu đề
Ghi nhận chứng từ nhập kho sau giao hàng và xác nhận BCH; …
5 hồ sơ                           ← số lượng
CHỜ BCH XÁC NHẬN 4 · ĐÃ XÁC NHẬN 1 · THIẾU CO/CQ 1 · TỔNG SL CHẤP NHẬN 550
```

⇒ Toolbar render **đúng khuôn §5**: TIÊU ĐỀ + SỐ LƯỢNG (trái) ‖ TÌM · LỌC · HÀNH ĐỘNG (phải); nội
dung phía dưới **nguyên vẹn** (dải KPI + bảng 5 hồ sơ).

**Nguyên nhân mức lệch lớn:** khối cũ gồm **hai** phần (hàng tiêu đề + card lọc riêng, cao hơn và có
khoảng trống) nay gộp thành **một** khối gọn hơn ⇒ toàn bộ nội dung phía dưới **dịch lên**, mà phép
so điểm ảnh tính mọi điểm ảnh dịch chuyển là lệch. Đây là **hệ quả trực tiếp và có chủ ý** của việc
sửa §5, không phải lỗi bố cục.

### 4.4 Kết quả cuối

| Hạng mục | Kết quả |
|---|---|
| Cổng so ảnh | **ĐẠT ✅ 28/28 lệch 0 điểm ảnh** |
| 13 probe hồi quy | **13 ĐẠT / 0 KHÔNG ĐẠT** |
| Build | **ĐẠT** — `BUILT ARTIFACT VALIDATION: ĐẠT` |

**Chỉ cập nhật ảnh chuẩn cho riêng `06-warehouse`** (4 ảnh). 24 ảnh còn lại **giữ nguyên** vì chúng
vẫn khớp 0 px — hạn chế tối đa việc đụng vào dữ liệu nhị phân lớn.

---

## 5. LỖI DO CHÍNH TÔI GÂY RA TRONG BƯỚC NÀY

Khi sửa màn `Inventory`, tôi viết `&amp;` trong khi file dùng `&` ⇒ bản sửa **trượt**. Vì tôi đã
gửi hai bản sửa song song cho màn đó, bản xoá card lọc **đã chạy** trong khi bản thêm `ListToolbar`
**chưa chạy** ⇒ trong khoảnh khắc đó màn Tồn kho **mất bộ lọc**. Đã phát hiện và sửa ngay trong cùng
bước (chạy lại bản sửa với `&` đúng), trước khi build.

**Bài học:** hai bản sửa trên cùng một màn có phụ thuộc lẫn nhau thì phải chạy **tuần tự và kiểm
kết quả từng bản**, không gửi song song.

---

## 6. ĐỢT SAU

29 hàm còn lại, chia theo mức ưu tiên:

**Ưu tiên cao** — còn lỗi §5 rõ ràng:
- `Admin` — "PHÂN QUYỀN NGƯỜI DÙNG": 6 nút dồn một phía + `.table-toolbar` riêng cho danh sách nhân sự
- `Receiving` — "GIAO NHẬN": còn card lọc riêng + `.table-toolbar` riêng
- `UserPermissionMatrix` · `SystemLevelManager` · `AuditLogManager` · `WorkflowModal` · `UserProfilePanel`
- `WorkCenter` · `TeamManagement` · `ProjectManagement` · `Delivered` · `Payments` · `BoqPurchaseComparison`
- `StaffDirectory` · `BoqControl` · `ProjectProgress`

**Ưu tiên thấp** — nhóm chỉ dùng `.filter-grid` đơn thuần, là bộ lọc của báo cáo/sổ (không phải
toolbar danh sách theo nghĩa §5): `DocumentsScreen` · `CashbankScreen` · `SiteCostScreen` ·
`AdvanceScreen` · `PaymentPlanScreen` · `MaterialNormsScreen` · `ConstructionScreen` ·
`FinanceRecoveryScreen` · `SiteCommandScreen`.

**Khuyến nghị về quy trình cho các đợt sau:** mỗi đợt nên chọn màn **có trong bộ ảnh chuẩn** để
cổng ảnh kiểm được; màn không có trong bộ ảnh chuẩn thì phải kiểm bằng `--locate` + OCR như đã làm ở
mục 4.3, nếu không sẽ không có bằng chứng.
