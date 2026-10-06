# TASK-156 — GO-LIVE ĐỢT 11: §11 UI/UX — DẢI TAB KHÔNG CÓ CSS + ĐIỂM MÙ CỦA CỔNG

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **BUG** | **BUG-20261005-006** (LOW/MEDIUM — UI §11) |
| **Trạng thái** | ✅ **FIXED · VERIFIED** (cổng mới + đối chứng âm + `npm test` + cổng UI) |
| **Tệp sửa** | `app/page.tsx` (2 chỗ) |
| **Tệp test mới** | `tests/golive-tablist-co-css.test.mjs` (3 vệ) |
| **Vân tay** | `VNTECH-FP-AC3AEB863B93A5E6` · **713 tệp** (trước: 614484381419c595 · 712) |

---

## ① ⛔ TRƯỚC HẾT: KIỂM TOÁN §11 CỦA TÔI **SAI TIÊU CHÍ** — 2 «vi phạm» là GIẢ

Tôi kiểm mọi họ tab bằng **một tiêu chí duy nhất** («có `min-width` + `min-height` không»). Đọc chú thích trong chính CSS thì thấy đây là **các quyết định user ĐÃ DUYỆT**:

| Họ tab | Kết luận của tôi | SỰ THẬT (đọc chú thích trong CSS) |
|---|---|---|
| `.edm-tabs` | ⛔ «thiếu `min-height`» | ✅ **MỐC 115** — user yêu cầu «tab **cân đối và bằng nhau**» ⇒ chọn **`flex: 1 1 auto`** (chia đều phần dư) **thay vì** min-width. Dòng **1163** ghi rõ: «⛔ **KHÔNG đụng `.edm-tabs`** … chia đều ở đó là **CỐ Ý**» |
| `.user-admin-tabs` | ⛔ «thiếu cố định» | ✅ **MỐC 119b** — user nói bản giãn hết bề ngang «**xấu**», nên **cố ý** đổi về `flex: 0 0 auto` cho thẻ «**ôm sát nhãn**» |

⇒ **Không sửa gì.** ⛔ §11 cấm kích thước thay đổi «**bất thường**»; hai họ này dùng **chiến lược khác nhau, đều đã được duyệt**. Đây là lần thứ **7** tôi suýt «sửa» thứ đang đúng — và lần này **chính chú thích trong mã** đã cứu.

---

## ② ⭐ LỖI THẬT TÌM ĐƯỢC: `admin-subtabs` — LỚP **DÙNG MÀ KHÔNG CÓ CSS**

| | |
|---|---|
| **HIỆN TƯỢNG** | 2 dải tab của màn **Quản trị** — bước 2 «Tổ chức» (`AD-05`) và bước 3 «Chức danh» (`AD-06`) — **hoàn toàn không được style** |
| **ROOT CAUSE** | `app/page.tsx` dùng `<div className="admin-subtabs">` nhưng lớp này **KHÔNG tồn tại trong BẤT KỲ stylesheet nào**: `globals.css` `IndexOf(".admin-subtabs")` = **-1** · `canonical.css` = **false** |
| **HỆ QUẢ (§11)** | Dải tab lệch hẳn so với **mọi** dải tab khác trong hệ thống (không vỏ trắng, không viền, không bo góc, không cuộn ngang) ⇒ trái «tab trong cùng một modal phải **đồng nhất**» |
| **SEVERITY** | **LOW/MEDIUM** (UI, không chặn workflow) |
| **FIX** | Theo **đúng quy ước đã ghi trong mã** (MỐC 119b: «⛔ **KHÔNG phát minh giao diện mới**, chỉ cho nó đồng nhất với tham chiếu»): thêm **khuôn nhà** `project-scope-tabs` + `role="tablist"` + `aria-label`; **GIỮ** lớp `admin-subtabs` làm móc dữ liệu |
| **FILES CHANGED** | `app/page.tsx` (**2 chỗ**, chỉ thêm thuộc tính — ⛔ không đổi cấu trúc JSX) |
| **TẠI SAO KHUÔN NHÀ LÀ ĐÚNG** | `globals.css` có rule **TOÀN CỤC** `.project-scope-tabs{…min-height:48px…border-radius:11px…overflow-x:auto}` + `.project-scope-tabs button{height:34px;padding:0 14px…}` ⇒ áp được ở mọi màn, ⛔ không cần CSS mới |
| **STATUS** | **FIXED · VERIFIED** |

---

## ③ ⭐ ĐIỂM MÙ CỦA CỔNG CSS — ĐÃ ĐO

`scripts/css-baseline-audit.mjs` báo **`ĐẠT · dead classes=0`** trong khi giao diện vẫn sai, vì cổng chỉ kiểm **MỘT CHIỀU**:

| Chiều | Cổng cũ | Lỗi `admin-subtabs` thuộc chiều nào |
|---|---|---|
| Lớp **ĐƯỢC ĐỊNH NGHĨA** mà không ai dùng («CSS chết») | ✅ có kiểm | — |
| Lớp **ĐƯỢC DÙNG** mà không định nghĩa | ⛔ **KHÔNG kiểm** | ✔ **chiều này** |

**⛔ VÌ SAO KHÔNG XÂY CỔNG «MỌI LỚP» NGAY:** đo thử toàn bộ `app/**/*.tsx` cho ra **272 «lớp dùng mà không có CSS»**, nhưng **đa số là GIẢ** (`index` · `key` · `String` · `Number` · `onRowClick` · `rowClassName` · `align` · `width` … — là **định danh trong BIỂU THỨC JSX**, không phải lớp CSS). Muốn kiểm đúng phải **phân tích cú pháp JSX thật** ⇒ ⛔ vượt phạm vi GO-LIVE (**§12**).

---

## ④ CỔNG MỚI — `tests/golive-tablist-co-css.test.mjs` (CỐ Ý HẸP, 3 vệ)

| Vệ | Kiểm gì |
|---|---|
| **TABLIST-1** | Mọi phần tử `role="tablist"` có `className` **TĨNH** phải có **ít nhất 1 lớp ĐƯỢC ĐỊNH NGHĨA** trong CSS (quét được **≥10** dải tab, nếu ít hơn ⇒ phép quét HỎNG) |
| **TABLIST-2** | **ĐỐI CHỨNG ÂM**: lớp bịa phải bị coi là KHÔNG định nghĩa · `admin-subtabs` phải KHÔNG có CSS · `project-scope-tabs` PHẢI có CSS |
| **TABLIST-3** | 2 dải tab màn Quản trị **PHẢI** mang khuôn nhà `project-scope-tabs` + `role="tablist"` |

**ĐỐI CHỨNG ÂM CHẠY THẬT:** cài lại lớp cũ ⇒ **`fail=1`** (TABLIST-3 ĐỎ) · khôi phục (tệp giống **100%**) ⇒ **`fail=0`**.

ⓘ **HẠN CHẾ ĐÃ BIẾT (ghi thẳng):** khi thiếu `role="tablist"`, **TABLIST-1 bỏ qua** phần tử đó (nó chỉ quét phần tử *có* `role="tablist"`) ⇒ **TABLIST-3 mới là vệ bắt đúng ca này**. Đã ghi trong mã.

---

## ⑤ CHUỖI BUILD + KIỂM CHỨNG

| Bước | Kết quả |
|---|---|
| Fixpoint | **1 vòng** · `VNTECH-FP-AC3AEB863B93A5E6` · **713 tệp** |
| `verify-vntech-fingerprint.mjs` | **ĐẠT** · brand/release verified |
| `set-local-identity.mjs` | **KHỚP: true** |
| `npx tsc --noEmit` | **EXIT=0** |
| `npm run build` | **ĐẠT** |
| Khởi động lại `:8787` | PID 20256 → **16936** · HTTP **200** · 7123 B |
| Cổng UI `verify-ui-build-applied.mjs` | **3/3 ✓** (`do-moi` 18s · `van-tay` `ac3aeb863b93a5e6` khớp SSOT · `byte` 6/6) |
| `npm test` | **pass 780 · fail 0 · skipped 1 · EXIT=0** (trước 777 ⇒ **+3** từ cổng mới) |
| Test AD-05 cũ | vẫn **3/3 XANH** (⛔ không phá) |

---

## ⑥ BÀI HỌC

1. ⛔⛔ **ĐỪNG ÁP MỘT TIÊU CHÍ LÊN NHIỀU HỌ COMPONENT.** `.edm-tabs` đạt «bằng nhau» bằng **`flex: 1 1 auto`**, `.project-scope-tabs` bằng **`min-width`**, `.user-admin-tabs` **cố ý ôm nhãn**. Kiểm bằng một thước đo duy nhất sinh **2 báo động giả**.
2. ⭐⭐ **CHÚ THÍCH TRONG MÃ LÀ BẢN GHI QUYẾT ĐỊNH CỦA USER.** MỐC 115 và MỐC 119b ghi nguyên văn lời user («tab cân đối và bằng nhau» · bản giãn «**xấu**») ⇒ đọc trước khi sửa. Đây là lần thứ **7** tôi suýt «sửa» thứ đang đúng.
3. ⭐ **CỔNG XANH KHÔNG CÓ NGHĨA LÀ KHÔNG CÓ LỖI** — cổng CSS báo `ĐẠT · dead classes=0` trong khi 2 dải tab **không có CSS nào**. Cổng chỉ kiểm **chiều nó được viết để kiểm**.
4. ⭐ **CỔNG MỚI PHẢI CỐ Ý HẸP.** Đo thử «mọi lớp» cho **272 kết quả, đa số GIẢ** ⇒ xây cổng rộng lúc này là **tạo nợ**, ⛔ không phải chất lượng.
5. ⭐ **SỬA THEO KHUÔN NHÀ, ⛔ KHÔNG PHÁT MINH MỚI** — chỉ thêm 2 thuộc tính vào markup, ⛔ không viết CSS mới, ⛔ không đổi cấu trúc.

---

## ⑦ BLOCKER / CHỜ USER

⛔ **Chưa commit**.
⛔ **Cần user quyết — mục 1 vẫn gấp nhất** (2 bản vá **HIGH** chưa lên sóng):
1. ⭐ **Cho phép `mvn -o -DskipTests package` + khởi động lại Java `:18081`** — pre-flight đã chứng minh **AN TOÀN** (TASK-155); làm việc này **ghi luôn `V35`+`V37`** vào `flyway_schema_history`.
2. **Chốt bất đồng** «ai được nhận hàng ở kho đích» (`receive_transfer_order` ↔ `e2e.tk`) — TASK-154 §③.
3. **4 phiếu trả Kho Tổng kẹt `in_transit` + 9 đơn vị kẹt ở `WH-TRANSIT`** — dọn thế nào?
4. Mở task «thêm thành viên tổ đội»?
5. Commit?
