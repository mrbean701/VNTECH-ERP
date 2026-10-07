# TASK-157 — GO-LIVE ĐỢT 12: ĐO HỆ THỐNG DIỆN RỘNG «LỚP DÙNG MÀ KHÔNG CÓ CSS»

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **BUG** | **BUG-20261005-007** (MEDIUM — UI §11) |
| **Trạng thái** | 📋 **ĐÃ ĐO + LẬP HỒ SƠ** · ⛔ **CHƯA SỬA** (đưa vào **HOTFIX QUEUE** theo §4) |
| **Sản phẩm** | `docs/agent-progress/GO-LIVE-lop-thieu-css.md` (**171 dòng**) |
| **Mã nguồn sửa** | ⛔ **KHÔNG** — vòng này chỉ ĐO, nên **vân tay không đổi**, ⛔ không cần build lại |

---

## ① CÁCH ĐO (tinh hơn phép đo cũ)

| | |
|---|---|
| **Nguồn** | `app/**/*.tsx` — **chỉ** lấy `className="…"` là **CHUỖI TĨNH** |
| ⛔ **Loại trừ** | `className={…}` và `` className={`…`} `` — đó là **BIỂU THỨC**, chứa định danh JS (`index`, `key`, `String`, `onRowClick`…) **không phải lớp CSS** |
| **Đối chiếu** | **CẢ 4** stylesheet: `app/globals.css` · `app/styles/canonical.css` · `app/styles/font-floor.css` · `app/styles/tokens.css` |

⛔ **Vì sao phải lọc:** phép đo đầu (lẫn biểu thức) cho **272 kết quả, ĐA SỐ GIẢ**. Lọc còn chữ tĩnh ⇒ **130**, và các tên đều là **lớp UI thật** (`kanban-board`, `modal-head`, `admin-table`, `kpi-label`…).

---

## ② KẾT QUẢ

| Chỉ số | Số |
|---|---|
| Lớp từ chuỗi tĩnh | **696** |
| **Lớp KHÔNG có CSS** | **130** |
| **… có thẻ chỉ mang ĐÚNG lớp đó** | **53** ← tín hiệu cao nhất |
| Thẻ dùng `className` tĩnh chỉ có **1 lớp** | **1813 / 2197** |

**Top lớp có thẻ chỉ mang đúng nó:** `aggregate-toggle-row` (4) · `mobile-dash-icon` (4) · `receiving-kpi-button` (4) · `kpi-label` (3) · `kpi-value` (3) · `modal-head` (2) · `readonly-field` (2) · `stack-form` (2) …

---

## ③ ⛔ VÌ SAO ĐÂY LÀ LỖI **THẬT** (đã loại 3 khả năng báo động giả)

1. **Đã kiểm 14/14 lớp mẫu** ⇒ **không** lớp nào có CSS ở **bất kỳ** tệp nào trong 4 tệp.
2. **Không có** bộ chọn thuộc tính kiểu `[class*=…]` / `[class^=…]` trong toàn bộ CSS ⇒ **không thể style gián tiếp**.
3. **1813/2197** thẻ chỉ mang **ĐÚNG 1 lớp** ⇒ lớp đó không có CSS thì thẻ **không được style gì**.
4. Đây đúng **chiều NGƯỢC** của cổng `scripts/css-baseline-audit.mjs`: cổng bắt *CSS chết* (định nghĩa mà không dùng), ⛔ **không** bắt *lớp dùng mà không định nghĩa*.
   ⇒ Cổng báo **`ĐẠT · dead classes=0`** trong khi giao diện vẫn thiếu style. **Cổng xanh ≠ không có lỗi.**

---

## ④ ⛔ VÌ SAO **CHƯA SỬA Ồ ẠT** — có lý do, không phải bỏ quên

| Lý do | Căn cứ |
|---|---|
| Thêm CSS cho **130 lớp** là thay đổi **LỚN**, ⛔ vượt «SMALL SAFE FIX» | **§12** — giữa GO-LIVE ⛔ không refactor lớn |
| Ở đây **không kiểm chứng bằng mắt được** (không có trình duyệt) ⇒ sửa 130 lớp CSS mà không nhìn = **rủi ro cao** | §17 — ⛔ không tuyên bố khi chưa kiểm |
| Mức **MEDIUM** ⇒ theo **§4** phải vào **HOTFIX QUEUE**, xử lý theo thứ tự phù hợp | §4 |
| Nhiều lớp có thể là **móc dữ liệu/kiểm thử cố ý để trống** ⇒ phải **phân loại theo từng màn** trước khi sửa | §9 — ⛔ không sửa nhiều phần không liên quan |
| Vòng này đã có sẵn **93 dòng `git status` chưa commit**; mở rộng thêm làm **tăng rủi ro** cho lần rà soát của user | §18 |

⭐ **Việc ĐÚNG đã làm:** **đo cho hết** + **lập hồ sơ có địa chỉ từng tệp** ⇒ user (hoặc phiên sau) **sửa theo từng màn**, có kiểm chứng bằng mắt.

---

## ⑤ ĐỀ XUẤT CÁCH XỬ LÝ (khi user cho phép)

1. **Rà theo màn, không theo danh sách phẳng.** Ưu tiên **53 lớp có thẻ chỉ mang đúng lớp đó** (tín hiệu cao nhất).
2. **Với mỗi màn**: mở màn đó, đối chiếu thẻ đang trông thế nào ⇒ quyết định: (a) **gán khuôn nhà** đã có (như `admin-subtabs` → `project-scope-tabs` ở TASK-156), hay (b) **thêm rule mới** nếu là thành phần đặc thù.
3. ⛔ **Không phát minh giao diện mới** — luôn ưu tiên (a).
4. **Bổ sung cổng** `css-baseline-audit.mjs` theo chiều còn thiếu **SAU KHI** đã dọn xong, nếu không cổng sẽ đỏ ngay vì 130 lớp tồn đọng — ⛔ thứ tự ngược lại sẽ tạo cổng đỏ vĩnh viễn.

---

## ⑥ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| Lớp không CSS | **130** (đo được, có hồ sơ) |
| Trong đó có thẻ chỉ mang đúng nó | **53** |
| Vân tay | **ĐẠT** `VNTECH-FP-AC3AEB863B93A5E6` · **713 tệp** — ⛔ **không đổi** (vòng này không sửa mã) |
| `npm test` | giữ nguyên **780 pass · 0 fail** (không có mã nào đổi) |
| Tệp tạm | **0** |
| `:18081` | ⛔ vẫn **JAR cũ** ⇒ **2 bản vá HIGH chưa lên sóng** |

---

## ⑦ BÀI HỌC

1. ⛔⛔ **LỌC ĐÚNG NGUỒN TRƯỚC KHI ĐẾM.** Phép đo đầu lẫn `className={…}` (biểu thức JSX) ⇒ **272 kết quả, đa số GIẢ**; lọc còn **chuỗi tĩnh** ⇒ **130 kết quả, đều là lớp UI thật**. Cùng họ D-108 («đo sai tập ⇒ kết luận sai»).
2. ⛔ **ĐO THIẾU TẬP CŨNG SAI** — tôi suýt chỉ đối chiếu **2** stylesheet trong khi có **4**; nếu vậy con số đã bị **thổi lên**.
3. ⛔ **LOẠI TRỪ KHẢ NĂNG STYLE GIÁN TIẾP TRƯỚC KHI KẾT LUẬN** — phải kiểm cả bộ chọn thuộc tính `[class*=…]` rồi mới dám nói «không có CSS».
4. ⭐ **CỔNG XANH KHÔNG CÓ NGHĨA LÀ KHÔNG CÓ LỖI** — cổng chỉ kiểm **chiều nó được viết để kiểm**. (Đã gặp lần thứ 2 trong 2 vòng.)
5. ⭐ **ĐO CHO HẾT rồi mới sửa** — 130 lớp là việc **lớn**; giữa GO-LIVE thì **đo + lập hồ sơ + xếp hàng** đúng hơn là sửa ồ ạt không kiểm chứng được (§12 · §17).

---

## ⑧ BLOCKER / CHỜ USER

⛔ **Chưa commit**.
⛔ **Cần user quyết — 6 việc, mục 1 vẫn gấp nhất:**
1. ⭐ **Cho phép `mvn -o -DskipTests package` + khởi động lại Java `:18081`** — **2 bản vá HIGH chưa lên sóng**; pre-flight đã chứng minh **AN TOÀN** (TASK-155); làm việc này **ghi luôn `V35`+`V37`** vào `flyway_schema_history`.
2. **BUG-20261005-007** — xử lý 130 lớp thiếu CSS theo màn (xem hồ sơ), hay để lại?
3. **Chốt bất đồng** «ai được nhận hàng ở kho đích» (`receive_transfer_order` ↔ `e2e.tk`) — TASK-154 §③.
4. **4 phiếu trả Kho Tổng kẹt `in_transit` + 9 đơn vị kẹt ở `WH-TRANSIT`** — dọn thế nào?
5. Mở task «thêm thành viên tổ đội»?
6. Commit?
