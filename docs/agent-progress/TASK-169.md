# TASK-169 — GO-LIVE ĐỢT 24: ĐÍNH CHÍNH — «130 LỚP THIẾU CSS» LÀ **BÁO ĐỘNG GIẢ**

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **BUG liên quan** | **BUG-20261005-007** — ⛔ **ĐÍNH CHÍNH: PHÉP ĐO SAI** |
| **Kết quả** | ⛔ **KHÔNG kết luận được bằng phân tích tĩnh** · ✅ ca `admin-subtabs` (TASK-156) **vẫn là lỗi THẬT và đã vá ĐÚNG** |
| **Mã nguồn sửa** | ⛔ **KHÔNG** (công cụ sai đã **gỡ bỏ**; `app/page.tsx` **khôi phục nguyên trạng 100%**) |

---

## ① ⛔ TÔI ĐÃ SAI Ở ĐÂU

TASK-157 ghi **BUG-20261005-007 (MEDIUM)**: «**130 lớp dùng mà không có CSS**» — kèm hồ sơ 171 dòng liệt kê từng lớp.

**Phép đo sinh ra con số đó quá thô**: nó chỉ hỏi «CSS có rule `.ten-lop` không». ⛔ **Nó bỏ sót HAI cơ chế style hoàn toàn hợp lệ.**

---

## ② ✅ ĐÍNH CHÍNH — ĐÃ XÁC MINH BẰNG TAY

### Cơ chế ① — **Bộ chọn CHA theo THẺ** (giải thích **129/130**)
Xem thật trong `app/screens/ContractReviewScreen.tsx`:
```jsx
<div className="kpi"><span className="kpi-label">Tổng hợp đồng</span><strong className="kpi-value">{rows.length}</strong></div>
```
Và `app/globals.css`:
```css
.kpi>span { width:42px; height:42px; flex:0 0 42px; border-radius:10px; display:grid; place-items:center; font-weight:900; … }
```
⇒ ⭐ **`.kpi-label` ĐƯỢC STYLE** (vì nó là `<span>` con của `.kpi`) **dù ⛔ không có rule riêng**. Đo bằng tay: `.kpi-label` có rule riêng = **False** ⇒ phép đo cũ kết luận «thiếu CSS» là **SAI**.

### Cơ chế ② — **Lớp KHÁC trên CÙNG phần tử** (giải thích **1/130**)
```jsx
<ol className="vt-timeline vt-timeline-activity">
```
`canonical.css:730` — `.vt-timeline { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }`
⇒ ⭐ Phần tử **được style** qua `vt-timeline`; `vt-timeline-activity` chỉ là **móc phụ** ⇒ ⛔ không phải lỗi.

### ⛔ Còn lại — **CHƯA XÁC ĐỊNH ĐƯỢC**
Tôi **không** tuyên bố «0 lỗ hổng» — vì tôi **chỉ xác minh bằng tay được vài ca tiêu biểu**, ⛔ không phải cả 130.

---

## ③ ⛔⛔ TÔI ĐÃ THỬ VIẾT CÔNG CỤ ĐO LẠI — VÀ **NÓ TỰ THI TRƯỢT**

Viết `tools/kiem-lop-thieu-css.mjs`: kiểm thêm ① bộ chọn cha theo thẻ · ② lớp khác cùng phần tử.

**PHÉP THỬ ĐỐI CHIẾU CA ĐÚNG** (⛔ điều kiện bắt buộc trước khi tin công cụ):
| Bước | Kết quả |
|---|---|
| Chạy trên mã hiện tại | «NGHI THIẾU STYLE THẬT: **0**» |
| **Tạm bỏ `project-scope-tabs` khỏi `admin-subtabs`** (ca **đã xác minh là lỗi THẬT** ở TASK-156) | ⛔ vẫn «**0**» — **KHÔNG bắt được ca đúng** |
| Khôi phục `app/page.tsx` | ✔ **giống bản đầu 100%** |

**NGUYÊN NHÂN**: phép kiểm «rule cha theo thẻ» **quá lỏng với thẻ phổ biến** (`div`/`span`) — trong **~365 KB CSS** thể nào cũng có rule kiểu `.abc div { … }` **khớp mẫu** nhưng ⛔ **không áp dụng** cho phần tử đang xét.

⇒ ⛔ **Công cụ cho CẢM GIÁC AN TOÀN GIẢ** ⇒ **ĐÃ GỠ BỎ** (`tools/kiem-lop-thieu-css.mjs` ⛔ không còn tồn tại).
⭐ **Bài học: công cụ đo PHẢI qua được ĐỐI CHIẾU CA ĐÚNG trước khi được tin.** Nếu tôi đã tin nó, tôi sẽ báo «**0 lỗ hổng**» — một **kết luận sai thứ hai**, ngược chiều với cái sai ban đầu.

---

## ④ ✅ CA DUY NHẤT ĐÃ XÁC MINH LÀ LỖI **THẬT** — VÀ BẢN VÁ LÀ **ĐÚNG**

`admin-subtabs` (TASK-156): trước bản vá, phần tử là `<div className="stack"><div className="admin-subtabs">…`
| Phép kiểm | Kết quả |
|---|---|
| `.admin-subtabs` có rule riêng? | ⛔ **Không** (`globals.css` `IndexOf` = **−1** · `canonical.css` = **False**) |
| Là **lớp DUY NHẤT** trên phần tử đó? | ✔ **Đúng** |
| Có rule cha theo thẻ cho `div` không? | ✔ **`.stack` CHỈ có rule cho `> section` / `> .card`** (canonical.css:157-161) ⇒ ⛔ **không có rule nào cho `div`** |
⇒ ⭐ **Thật sự không được style** ⇒ **bản vá TASK-156 là CẦN THIẾT và ĐÚNG** (thêm khuôn nhà `project-scope-tabs` + `role="tablist"`).

---

## ⑤ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| Kết luận về «130 lớp» | ⛔ **BÁO ĐỘNG GIẢ** — 129 bởi bộ chọn cha · 1 bởi lớp cùng phần tử |
| Công cụ đo lại | ⛔ **đã gỡ** (tự thi trượt đối chiếu ca đúng) |
| `app/page.tsx` sau khi thử | ✔ **giống bản đầu 100%** |
| Ca lỗi THẬT duy nhất | ✅ `admin-subtabs` — vá **đúng** (TASK-156) |
| Bug sản phẩm mới | **0** |
| Vân tay | **ĐẠT** `VNTECH-FP-AC3AEB863B93A5E6` · **713 tệp** — ⛔ không đổi |
| Tệp tạm | **0** |
| `:18081` | ⛔ vẫn **JAR cũ** ⇒ **5 bản vá chưa lên sóng** |

---

## ⑥ BÀI HỌC

1. ⛔⛔ **PHÉP ĐO «LỚP KHÔNG CÓ RULE RIÊNG» ⛔ KHÔNG ĐỒNG NGHĨA «PHẦN TỬ KHÔNG ĐƯỢC STYLE».** CSS có **nhiều cơ chế**: rule riêng · **bộ chọn cha theo thẻ** · **lớp khác cùng phần tử** · thuộc tính kế thừa. Bỏ qua cơ chế nào là **đếm sai**.
2. ⛔⛔ **CÔNG CỤ ĐO PHẢI QUA «ĐỐI CHIẾU CA ĐÚNG» TRƯỚC KHI ĐƯỢC TIN.** Công cụ của tôi **tự thi trượt** — nếu đã tin nó, tôi sẽ báo «**0 lỗ hổng**», tức **sai lần thứ hai ngược chiều**. ⭐ Đây là lần thứ **9** tôi suýt/sắp báo sai trong phiên này.
3. ⭐ **PHÂN TÍCH TĨNH CÓ GIỚI HẠN THẬT — PHẢI NÓI RA.** Kết luận đúng là «**không xác định được**», ⛔ không phải «0» hay «130». Muốn chắc phải **rà bằng MẮT theo từng màn**.
4. ⭐ **MỘT CON SỐ SAI CÓ THỂ SỐNG RẤT LÂU.** «130 lớp thiếu CSS» đã vào hồ sơ + checklist + Telegram như một **MEDIUM bug**. ⛔ Nếu không tự rà lại, nó sẽ **dẫn hướng công sức sai** cho phiên sau. ⭐ **Tự đính chính là phần bắt buộc của công việc, ⛔ không phải việc phụ.**
5. ⭐ **GỠ BỎ CÔNG CỤ SAI LÀ HÀNH ĐỘNG ĐÚNG.** Giữ lại một công cụ không đáng tin **tệ hơn** là không có — vì nó cho **cảm giác an toàn giả**.

---

## ⑦ BLOCKER / CHỜ USER

⛔ **Chưa commit** — **116 đường**, hỗn hợp 2 phiên (xem `GO-LIVE-phan-nhom-commit.md`).
⛔ **Cần user quyết:**
1. ⭐ **Cho phép triển khai** (1 lệnh): `node tools/deploy-java-backend.mjs --dong-y-trien-khai` — **5 bản vá**: BUG-003 · 005 · 008 · 20261010 · 20261011.
2. ⭐ **Bỏ BUG-20261005-007 khỏi hàng đợi MEDIUM?** — theo đính chính này, nó ⛔ **không còn là 130 ca**. Nếu muốn rà thật thì phải **rà bằng mắt theo từng màn** (tôi có thể làm từng màn, mỗi màn một vòng).
3. **Commit theo NHÓM hay gộp?**
4. **BUG-20261009** — «đọc tất cả» có nên xoá cả thông báo công việc?
5. **Chốt bất đồng** «ai được nhận hàng ở kho đích».
6. **4 phiếu trả Kho Tổng kẹt + 9 đơn vị kẹt ở `WH-TRANSIT`**.
7. ⭐ **Tiếp tục vòng đời CRUD cho 6 thực thể còn lại?**
8. ⭐ **Có bổ sung KHOÁ NGOẠI cho 131 bảng?** (hiện **0 FK**).
9. Xoá đăng ký thừa `manage_contract_review`? · 10. Mở task «thêm thành viên tổ đội»?
