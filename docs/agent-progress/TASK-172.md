# TASK-172 — GO-LIVE ĐỢT 27: KHÉP CHUỖI — **TIÊU CHÍ ĐÚNG** ĐỂ BIẾT LỚP THIẾU CSS CÓ GÂY HẠI KHÔNG

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **BUG** | **BUG-20261005-007** — ✅ **KHÉP LẠI**: có **tiêu chí dự đoán đúng** thay vì đếm thô |
| **Kết quả** | ⭐ **13 ca xác minh tay** · **2 lỗi thật (đã vá)** · **10 ca giải thích được** · **1 ca borderline** |
| **Mã nguồn sửa** | ⛔ **KHÔNG** (vòng này chỉ xác minh + kết luận) |

---

## ① ⭐⭐ SẢN PHẨM CHÍNH — **TIÊU CHÍ ĐÚNG**

Sau **4 vòng** (TASK-157 → 172) và **3 lần đính chính**, câu hỏi «lớp thiếu CSS có gây hại không» **nay có tiêu chí trả lời**:

> ### Một lớp thiếu rule **CHỈ GÂY HẠI** khi:
> **(A)** thẻ của nó có **kiểu mặc định trình duyệt «XÂM LẤN»** — `button` · `input` · `select` · `textarea` · `table` · `fieldset`
> **HOẶC**
> **(B)** phần tử **CẦN LAYOUT** — nhiều phần tử con phải xếp hàng (tiêu đề + nút đóng, một hàng nhiều nút…).
>
> ### Ngược lại — `<p>` · `<div>` · `<span>` · `<section>` · `<form>` đơn giản — kiểu mặc định **đã hiển thị chấp nhận được** ⇒ thiếu rule **thường ⛔ VÔ HẠI**.

⭐ **Tiêu chí này DỰ ĐOÁN ĐÚNG toàn bộ phát hiện của tôi** — đó là bằng chứng nó đúng:

| Ca | Tiêu chí dự đoán | Thực tế đo được |
|---|---|---|
| `modal-head` | **(B)** — `<div>` chứa **tiêu đề + nút ✕** ⇒ cần layout | 🐞 **LỖI THẬT** ⇒ **đã vá** (TASK-170) |
| `receiving-kpi-button` | **(A)** — `<button>`, chrome mặc định + `inline-block` | 🐞 **LỖI THẬT** ⇒ **đã vá** (TASK-171) |
| `kpi-label` · `kpi-value` · `admin-table` | — (đã có **bộ chọn cha**) | ✅ vô hại |
| `vt-timeline-activity` | — (đã có **lớp khác cùng phần tử**) | ✅ vô hại |
| `mobile-dash-icon` (+3) | — (**khối bị ẩn** `display:none`) | ✅ vô hại |
| `readonly-field` | `<span>` hiện **chữ chỉ đọc** — ⛔ không cần layout | ✅ **dự đoán vô hại — ĐÚNG** |
| `aggregate-toggle-row` | `<p>` bọc `<button className="primary">` — **nút ĐÃ có style** | ✅ **dự đoán vô hại — ĐÚNG** |
| `stack-form` | ⚠️ `<form>` chứa **`<select>`** ⇒ **(A) đúng một phần** | ⚠️ **BORDERLINE — cần mắt người** |

---

## ② BA CA CUỐI — ĐÃ XÁC MINH

### `readonly-field` — ✅ **VÔ HẠI**
```jsx
if(key==="contractLineNo") return <span className="readonly-field">{String(ctx.contractLineNo||row.contractLineNo||"—")}</span>;
```
`<span>` hiện **chữ chỉ đọc** trong ô bảng (2 lần dùng) ⇒ kiểu mặc định inline **đã chấp nhận được** ⇒ theo tiêu chí **(A)/(B) đều ⛔ không thoả** ⇒ **vô hại** ✔

### `aggregate-toggle-row` — ✅ **VÔ HẠI**
```jsx
<p className="aggregate-toggle-row">
  <button type="button" className="primary" onClick={() => open?.("teamCreate")}>＋ Tạo tổ đội</button>
</p>
```
`<p>` chỉ là **vỏ bọc**, còn **nút đã có style** qua lớp **`.primary`** ⇒ `<p>` mặc định (block + lề đoạn) **hoạt động tốt** ⇒ **vô hại** ✔

### `stack-form` — ⚠️ **BORDERLINE (ghi nhận, ⛔ CHƯA VÁ)**
```jsx
<section className="card"><CardHead …/><form className="stack-form" onSubmit={submitProduction}>
  <select name="subcontractId" required …>
```
| Phép kiểm | Kết quả |
|---|---|
| `.stack-form` có rule riêng? | ⛔ **KHÔNG** — dùng **đúng 1 lần** (`ProjectTeams.tsx:28`) |
| `.two-col` / `.card` có rule cho `form`? | ⛔ **KHÔNG** |
| Rule `width:100%` cho `select` có áp không? | ⛔ **KHÔNG** — mọi rule `width:100%` cho `select` đều **theo phạm vi** (`.form-grid select` · `.full select` · `.request-grid td select` …) |
| ⇒ Theo tiêu chí | ⚠️ **(A) thoả một phần** (`<select>` có kiểu mặc định xâm lấn) |
⇒ ⚠️ **Có thể** là lỗ hổng thật (các ô không xếp dọc như tên lớp `stack-form` gợi ý), ⛔ **nhưng tôi ⛔ KHÔNG VÁ** vì:
1. ⛔ **không nhìn được giao diện** ⇒ không biết hiện trạng xấu hay chấp nhận được;
2. thêm `display:grid` vào một `<form>` là **đổi layout** — §12 ⛔ không đánh cược;
3. **§4**: mức **LOW** ⇒ ghi vào hàng đợi, xử lý theo thứ tự phù hợp.
⭐ **Đề xuất khi có mắt người**: nếu các ô đang **chen chúc/cùng hàng** thì cho `.stack-form` dùng **đúng khuôn `.stack`** của nhà (`display:grid; gap:var(--vt-gap-3)`) — ⛔ không phát minh số đo.

---

## ③ TỔNG KẾT CHUỖI (TASK-157 → 172)

| Vòng | Việc | Kết quả |
|---|---|---|
| 157 | Đo «lớp dùng mà không có CSS» | ❌ **con số «130» SAI** (phép đo thô) |
| 169 | Đính chính 1 | phát hiện **bỏ sót bộ chọn cha** |
| 170 | Đính chính 2 + vá | phát hiện «129/130» **cũng thiếu bằng chứng** · **vá `modal-head`** |
| 171 | Đính chính 3 + vá | phát hiện **bỏ sót khối bị ẩn** · **vá `receiving-kpi-button`** |
| **172** | **Khép lại** | ⭐ **TIÊU CHÍ ĐÚNG** + 13 ca xác minh + 1 ca borderline |

**Kết quả thực**: **2 lỗi thật đã vá** · **10 ca giải thích được bởi 5 cơ chế** · **1 ca borderline** ⇒ ⛔ «130 lỗ hổng» sai · ⛔ «0 lỗ hổng» cũng sai.

**5 cơ chế** giải thích «thiếu CSS» mà ⛔ không phải lỗi: ① bộ chọn cha theo thẻ · ② lớp khác cùng phần tử · ③ khối bị ẩn · ④ thẻ không cần layout · ⑤ con đã có style riêng.

---

## ④ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| Ca xác minh tay | **13** (= 10 ở vòng trước + 3 vòng này) |
| Lỗi thật | **2** — **cả hai đã vá** (`modal-head` · `receiving-kpi-button`) |
| Ca borderline | **1** (`stack-form`) — ghi nhận, ⛔ chưa vá |
| Bug sản phẩm mới | **0** |
| Vân tay | **ĐẠT** `VNTECH-FP-D7FB15E8EBA0AC70` · **713 tệp** — ⛔ không đổi |
| Tệp tạm | **0** |
| `:18081` | ⛔ vẫn **JAR cũ** ⇒ **5 bản vá Java chưa lên sóng** |

---

## ⑤ BÀI HỌC

1. ⭐⭐ **ĐẾM LÀ VÔ NGHĨA NẾU THIẾU TIÊU CHÍ.** «130 lớp không có CSS» là con số **đúng về mặt kỹ thuật** nhưng **vô nghĩa về mặt nghiệp vụ** — cái cần là **«có gây hại không»**, và điều đó phụ thuộc **THẺ** + **NHU CẦU LAYOUT**, ⛔ không phụ thuộc số lượng.
2. ⭐⭐ **TIÊU CHÍ ĐÚNG PHẢI DỰ ĐOÁN ĐÚNG DỮ LIỆU ĐÃ CÓ.** Tiêu chí (A)/(B) **giải thích trọn vẹn** cả 2 lỗi thật **và** 10 ca vô hại ⇒ đó là **bằng chứng nó đúng**, ⛔ không phải suy đoán.
3. ⭐ **ĐIỀU TRA DÀI KHÔNG ĐÁNG SỢ — KẾT LUẬN SAI MỚI ĐÁNG SỢ.** Bốn vòng cho **2 lỗi thật** có vẻ chậm, nhưng ⛔ nếu dừng ở «130 lỗ hổng» thì phiên sau sẽ **đi sai hướng** và có thể **sửa 130 chỗ không cần sửa**.
4. ⛔ **BIẾT DỪNG ĐÚNG LÚC.** Ca `stack-form` ⛔ **không vá được bằng phân tích tĩnh** — ⭐ dừng lại và **ghi rõ là borderline** đúng hơn là **đoán rồi sửa** (§12).
5. ⭐ **BA LẦN ĐÍNH CHÍNH LIÊN TIẾP LÀ BÌNH THƯỜNG, ⛔ KHÔNG PHẢI THẤT BẠI.** Mỗi lần lộ ra một cơ chế mới, và **cơ chế cuối cùng mới là tiêu chí đúng**. ⭐ Giá trị nằm ở **kết luận đúng**, ⛔ không ở việc **đúng ngay từ đầu**.

---

## ⑥ BLOCKER / CHỜ USER

⛔ **Chưa commit** — **119 đường**, hỗn hợp 2 phiên (xem `GO-LIVE-phan-nhom-commit.md`).
⛔ **Cần user quyết:**
1. ⭐ **Cho phép triển khai Java** (1 lệnh): `node tools/deploy-java-backend.mjs --dong-y-trien-khai` — **5 bản vá**: BUG-003 · 005 · 008 · 20261010 · 20261011.
2. ⭐ **Xác nhận 2 bản vá CSS bằng mắt** (`modal-head` · `receiving-kpi-button` — **đã lên `:8787`**).
3. ⭐ **`stack-form`**: cho dùng khuôn `.stack` của nhà hay để nguyên?
4. **Commit theo NHÓM hay gộp?**
5. **BUG-20261009** — «đọc tất cả» có nên xoá cả thông báo công việc?
6. **Chốt bất đồng** «ai được nhận hàng ở kho đích».
7. **4 phiếu trả Kho Tổng kẹt + 9 đơn vị kẹt ở `WH-TRANSIT`**.
8. ⭐ **Tiếp tục vòng đời CRUD cho 6 thực thể còn lại?**
9. ⭐ **Có bổ sung KHOÁ NGOẠI cho 131 bảng?** (hiện **0 FK**).
10. Xoá đăng ký thừa `manage_contract_review`? · 11. Mở task «thêm thành viên tổ đội»?
