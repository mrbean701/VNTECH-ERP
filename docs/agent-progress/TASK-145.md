# TASK-145 — VÒNG 216 (lần 2) · NHÓM PO: mục 3.2 + mục 3.3

| | |
|---|---|
| **Ngày** | 02/10/2026 |
| **Nhánh** | `unity` (chưa commit — chờ USER xem trước) |
| **Trạng thái** | ✅ XONG — mã + test + tài liệu |
| **Tệp mã sửa** | `app/screens/PurchaseOrderDrawer.tsx` |
| **Tệp test mới** | `tests/v216-don-mua-muc-3-2-3-3.test.mjs` |
| **Mục master task** | Nhóm PO, mục **3.2** và **3.3** |

---

## ① Bối cảnh — vì sao phải đo trước khi sửa

`app/screens/PurchaseOrderDrawer.tsx` có 49 dòng. Nút «← Quay lại» nằm ở **dòng 39**, là phần tử
**cuối cùng** của thẻ `<header>` **không có `className`** trong phần tab của modal.

Nếu chỉ nhìn mã thì có hai cách «hiển nhiên», và **cả hai đều sai**:

| Phương án | Vì sao sai (đo được) |
|---|---|
| Thêm `className="card-head"` cho `<header>` | `.card-head>button { border:0; background:transparent; … }` (`app/globals.css` @11163, riêng 0,1,1) và `.card-head button{…!important}` (@123338) sẽ **xoá viền/nền** của nút và **thắng** mọi quy tắc `.page-back` (0,1,0) ⇒ nút càng **nhạt hơn** trước. |
| Thêm lớp CSS mới `.po-detail-head` | ⛔ Vi phạm quy tắc của phiên: **không tự chế lớp CSS**. |

Vì vậy phải **đo CSS** trước.

## ② Kết quả đo — hai nguyên nhân độc lập

### (a) `<header>` của tab **không có quy tắc layout nào**

Quét mọi quy tắc chứa `header` trong `app/styles/canonical.css`:

- `.entity-detail-modal > header { flex: 0 0 auto; }` (`:1114`) — đây là `<header>` **của chính modal** (`EntityDetailModal.tsx:110`), **không** phải header của tab.
- Các quy tắc còn lại đều gắn với lớp cha cụ thể (`.project-detail-head`, `.card`, `.dashboard-staff-card`, …).

⇒ Không có quy tắc nào khớp một `<header>` trần trong nội dung tab.
`<div>` là `display:block`, `<button>` là `inline-block` ⇒ **xếp dọc**: nút rơi **xuống dưới**
khối tên tài liệu, **lệch trái**.

### (b) `.page-back` **chỉ được CSS hoá dưới `.project-detail-head`**

`canonical.css:346` và `:357` (`:hover`):

```
.project-detail-head .page-back { min-height: var(--vt-control-h); padding: 0 16px; border-radius: 8px;
  border: 1px solid var(--line,#dbe4ee); background:#eef3f8; color:#24507d; … }
```

Màn PO **không** nằm trong `.project-detail-head` ⇒ **nút không có viền, không có nền**.
(Đối chiếu: chỗ duy nhất thật sự nằm trong lớp cha đó là `app/page.tsx:966` + `:972` — nên selector
này **không chết**, chỉ **quá hẹp**.)

⇒ Hai nguyên nhân **cộng lại** đúng triệu chứng người dùng mô tả: nút ở dưới, bên trái, và
không nổi bật.

## ③ Cách sửa — dùng khe **đã có sẵn và đã được tài liệu hoá**

`app/components/ui/EntityDetailModal.tsx:64` đã có sẵn:

```ts
/** Nút hành động ở góc phải tiêu đề. */
actions?: ReactNode;
```

và `canonical.css` đã có:

```css
.edm-head-actions { display: flex; align-items: center; gap: var(--vt-space-3); }
```

⇒ Khe này **đúng là** góc phải tiêu đề, **đã** là hàng flex, **đã** được CSS hoá.

### Mục 3.2

`<button className="page-back" onClick={close} …>← Quay lại</button>` chuyển từ `<header>` sang
`actions`, kèm lớp nhà `.secondary` (`app/globals.css`: `min-height:36px`, viền, nền, bo 7px):

```
width="wide" actions={<button type="button" className="secondary page-back" onClick={close}
  title="Quay lại danh sách đơn mua">← Quay lại</button>} tabs={[…]}
```

Giữ cả hai lớp: `page-back` để giữ ngữ nghĩa, `secondary` để có ngoại hình. Có tiền lệ hai lớp
trên một nút trong cùng dự án (`export-mini danger`, `app/screens/TeamManagement.tsx`).

⭐ **0 dòng CSS mới được thêm.** Đây là tiêu chí chọn phương án.

### Mục 3.3

Xoá `<div><small>Mã kỹ thuật (request_id)</small><strong>{purchaseOrder.requestId}</strong></div>` —
dòng in thẳng UUID kỹ thuật ra màn hình.

**Đo trước khi xoá (API sống, 02/10/2026):**

| Đo | Kết quả |
|---|---|
| Tổng PO | **31** |
| PO **có `requestNo`** | **31 / 31** |
| PO có `requestId` rỗng | **0** |

⇒ Ô «Số phiếu đề nghị» luôn hiện **mã phiếu thật**; UUID chỉ là nhiễu. **Xoá mất 0 thông tin.**

**⛔ Bảo toàn hợp đồng §21** (không xoá):

- `data-vntech="po-source-pr"` · `po-summary-table` · `po-grn-list` · `po-timeline` (4 dấu đo được, còn đủ)
- Tiêu đề «Nguồn PR (phiếu đề nghị)» và câu giải thích `purchase_orders.request_id`
- Nhánh «⚠ PO mồ côi — không truy được PR» + `data-vntech="po-source-pr-orphan"`
- Nút `data-vntech="po-source-pr-open"` với `disabled={!banPR}` (mục 1.4 của vòng 211)
- Ô «Số phiếu đề nghị» = `{purchaseOrder.requestNo || purchaseOrder.requestId}` ⇒ `tests/p2-d2-po-detail.test.mjs:46` vẫn xanh

## ④ Kiểm chứng

| Hạng mục | Lệnh | Kết quả |
|---|---|---|
| Kiểu | `npx tsc --noEmit --incremental false` | **EXIT=0** |
| Test PO liên quan | `p2-d2-po-detail` · `p2-d3-grn-to-po` · `v211-po-xem-phieu-de-nghi-nguon` · `v215-phieu-de-nghi-muc-2-1-den-2-7` | **34 pass / 0 fail** |
| Tệp mới | `tests/v216-don-mua-muc-3-2-3-3.test.mjs` | **8 vệ** (3 vệ hồi quy) |
| **Đối chứng âm 1** | gỡ `actions=`, trả nút về `<header>` | **fail 3** |
| **Đối chứng âm 2** | trả lại dòng «Mã kỹ thuật (request_id)» | **fail 1** |
| Khôi phục | `try/finally` | **byte-identical = True** |
| Toàn bộ | `npm test` | **701 pass / 0 fail / skipped 1** · lint **246 warning / 0 error** · **EXIT=0** |
| Vân tay | `scripts/verify-vntech-fingerprint.mjs` | `ĐẠT · VNTECH-FP-FDCBF492F4832A5A · source:701 files` · **EXIT=0** |
| Sống thật | UI `http://127.0.0.1:9000/` · API `/api/system` | **HTTP 200** (7 456 bytes) · `ok=True authenticated=True requests=84 purchaseOrders=31` |

## ⑤ Quyết định sinh ra

### `D-097` — vân tay `brand` là **hàm của** `source`

`calculateBrandFingerprint(expected)` lấy từ **chính object `expected` vừa sửa**
(`verify-vntech-fingerprint.mjs:30`). Tính cả ba vân tay trong một lượt từ dữ liệu cũ ⇒
`verify` **EXIT=1**: `Error: Brand fingerprint không hợp lệ.`

**Fixpoint 2 lượt:** ghi `source` (`fdcbf492…`, **701** files) → chạy lại script tính → ghi
`brand` (`ef02e9e9…`) → verify ĐẠT. `release` (`f7d72d34…`) **không** phụ thuộc `source` nên
không đổi.

### `D-098` — hàm tiêm lỗi của đối chứng âm phải **cộng dồn**

Lượt đầu: `Inject` đọc và ghi từ `$script:orig` (bản chưa nhiễm) ⇒ lần tiêm thứ hai **xoá mất**
lần tiêm thứ nhất ⇒ `fail 2` nhưng cả hai đều là vệ hồi quy, còn vệ chính vẫn **xanh**.
Sửa bằng `$script:buf` làm nguồn sự thật + `if ($n -ne 1) throw` + reset tường minh giữa
kịch bản ⇒ `fail 3` / `fail 1` đúng ý.

## ⑥ Sai lầm tự phát hiện (ghi lại để không lặp)

1. **Cổng kiểm tra sau khi ghi viết không dấu** (`'Quay lại danh sách'` thay vì `Quay lại danh sách`)
   ⇒ cổng báo «nút cũ còn trong `<header>`» **giả** dù tệp đã sửa đúng. Cổng kiểm tra cũng là mã nguồn.
2. **Test khẳng định `.secondary { min-height }` trong `canonical.css`** — nhưng `.secondary` khai ở `app/globals.css`.
3. **Đếm `"… .page-back {"` bằng 2** — quy tắc thứ hai là `… .page-back:hover {`, nên chuỗi có dấu `{` không khớp. Phải đếm **không kèm `{`**.

## ⑦ Còn lại

- **Vòng 211:** menu **1.2** (mã + `V35` đã soạn, **chờ USER cho chạy** — TYPE 3) · **báo cáo 4.1** (tài liệu điều hướng NCC ↔ PO ↔ vật tư: 1 `.md` + 1 `.docx` chuẩn form nhà).
- **TYPE 3 khác:** RBAC bypass `RbacService.java:69` · L-03 (D-084) · GRN-STO (D-087) · `npm run build` (user phải đóng trình duyệt) · **commit** («Chưa commit, để tôi xm trước»).
- **Hàng đợi tự giải được tiếp theo:** quét `.page-back` còn 4 chỗ dùng cùng lớp (`RequestDrawer.tsx:50`, `TeamManagement.tsx:72`, `TeamDirectory.tsx:442`, `page.tsx:972`) — chỉ `page.tsx` là trong `.project-detail-head`, **3 chỗ còn lại cũng đang trần**; và quét D-093 (component khai prop `permission` nhưng nơi gọi không truyền).