# TASK-182 — GO-LIVE ĐỢT 37: KIỂM §11 «TAB TRONG MODAL» — ⛔ KHÔNG CÓ LỖI (2 «phát hiện» là **LỖI TRÍCH XUẤT CỦA TÔI**)

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Mục tiêu** | §11 — *«Các tab trong cùng một modal phải có kích thước đồng nhất»* |
| **Kết quả** | ✅ **KHÔNG có vi phạm §11** · ⛔ **2 «phát hiện» ban đầu đều là LỖI TRÍCH XUẤT của chính tôi** |
| **Mã nguồn sửa** | ⛔ **KHÔNG** (chỉ kiểm) |
| **Vân tay** | ⛔ **không đổi** |

---

## ① ĐO ĐƯỢC — **20 thanh tab** trong `app/`

| Lớp | Số | Có rule riêng? |
|---|---|---|
| **`project-scope-tabs`** | **14** | ✅ **True** — khuôn nhà chính |
| `edm-tabs` | 2 | ✅ **True** |
| `user-admin-tabs` | 2 | ✅ **True** |
| `purchase-tabbar` | — | ✅ **True** |

⇒ ⭐ **MỌI thanh tab đều mang một lớp CÓ RULE** ⇒ ⭐ **§11 «tab trong cùng modal đồng nhất» ĐƯỢC THỎA** ✓

---

## ② ⛔ HAI «PHÁT HIỆN» BAN ĐẦU — VÀ CẢ HAI ĐỀU **SAI**

Phép dò của tôi ban đầu báo **2 chỗ `role="tablist"` không có lớp tab**, và tôi **suýt kết luận là lỗi §11**. ⛔ **Đọc kỹ thì cả hai là LỖI TRÍCH XUẤT CỦA TÔI:**

### ⛔ «A · `AdminUserModalTabs.tsx:41` không có className»
```jsx
41: // MỐC 115 — thêm `user-admin-tabs`: dải thẻ NÀY nằm trong modal nên không thuộc scope
42: <div className="project-scope-tabs user-admin-tabs" role="tablist" aria-label="user-admin-tabs" …>
```
⛔ **Dòng 41 là DÒNG CHÚ THÍCH** — phần tử thật ở **dòng 42** và **CÓ `project-scope-tabs`** ✓
⭐⭐ **VÀ chính chú thích ghi rõ** `user-admin-tabs` **được thêm để VÁ lỗi lệch chiều rộng tab** (MỐC 115) — *«chỉ nhận rule chung `[role="tablist"]` ⇒ 2 thẻ co theo độ dài chữ, lệch nhau rõ»* ⇒ ⭐ **vấn đề này ĐÃ được xử lý từ trước** ✓

### ⛔ «B · `page.tsx:2638` dùng lớp `stack` cho tablist»
```jsx
2638: {step===2&&<div className="stack"><div className="project-scope-tabs admin-subtabs" role="tablist" …>
```
⛔ **`stack` nằm ở thẻ CHA**; `role="tablist"` nằm ở thẻ **CON** và có **`project-scope-tabs admin-subtabs`** ✓

---

## ③ ⛔ NGUYÊN NHÂN GỐC CỦA CẢ HAI SAI LẦM — **CÙNG MỘT THÓI**

⛔ Phép dò của tôi lấy `className=` **THEO DÒNG** ⛔ **chứ không lấy theo PHẦN TỬ có `role="tablist"`** ⇒
- dòng chú thích bị nhận là phần tử (ca A)
- lớp của **thẻ cha** bị nhận là lớp của tablist (ca B)

⭐⭐ **BÀI HỌC: TRÍCH XUẤT THEO DÒNG ⛔ KHÔNG ĐÁNG TIN VỚI JSX.** Một dòng JSX có thể chứa **nhiều thẻ**, **chú thích**, và **nhiều `className`** ⇒ ⭐ **muốn biết lớp của một phần tử, phải đọc ĐÚNG THẺ đó** ✓
⭐ **Đây là LẦN THỨ HAI trong phiên** tôi mắc lỗi **đọc một dòng mà ⛔ không đọc ngữ cảnh** (lần đầu: kết luận «sai tài khoản» từ grep ở TASK-179, đã rút lại ở TASK-180) ✓

---

## ④ ⭐ GIÁ TRỊ THẬT CỦA VÒNG NÀY

| Việc | Kết quả |
|---|---|
| ⭐ **Đóng câu hỏi §11 «tab trong modal»** | ✅ **CÓ BẰNG CHỨNG** — **20/20** tablist mang lớp **có rule** |
| ⭐ **Xác nhận MỐC 115 còn hiệu lực** | ✅ `user-admin-tabs` **vẫn tồn tại** và **vẫn có rule** — bản vá chống lệch chiều rộng tab **còn nguyên** |
| ⭐ **Bắt được lỗi phương pháp của chính tôi** | ✅ **TRƯỚC khi báo cáo** (⛔ không gửi cảnh báo sai như TASK-175) |
| ⛔ **Bug sản phẩm mới** | **0** |

⭐⭐ **MỘT VÒNG «⛔ KHÔNG TÌM THẤY LỖI» VẪN LÀ KẾT QUẢ CÓ GIÁ TRỊ** — nó **đóng một câu hỏi của §11 bằng bằng chứng**, ⛔ thay vì để nó treo lơ lửng như «chưa kiểm» ✓

---

## ⑤ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| Thanh tab kiểm | **20/20** mang lớp **có rule** ✓ |
| Vi phạm §11 | ⛔ **KHÔNG** |
| «Phát hiện» sai của tôi | **2** — ⛔ **đều do trích xuất theo DÒNG** |
| Bug sản phẩm mới | **0** |
| Vân tay | **ĐẠT** `VNTECH-FP-C1B45AAAF31BFCF2` · 713 tệp — ⛔ không đổi |
| `:18081` | ⛔ vẫn **JAR cũ** ⇒ **5 bản vá chưa lên sóng** |

---

## ⑥ BÀI HỌC

1. ⛔⛔ **TRÍCH XUẤT THEO DÒNG ⛔ KHÔNG ĐÁNG TIN VỚI JSX.** Một dòng có thể chứa **nhiều thẻ** · **chú thích** · **nhiều `className`** ⇒ ⭐ **muốn biết lớp của một phần tử, phải đọc ĐÚNG THẺ đó** ✓
2. ⛔⛔ **ĐÂY LÀ LẦN THỨ HAI TRONG PHIÊN tôi mắc CÙNG MỘT THÓI** — đọc một dòng mà ⛔ không đọc ngữ cảnh (lần đầu ở TASK-179). ⭐ **Khi một lỗi lặp lại, nó ⛔ không còn là «sơ suất» mà là LỖ HỔNG PHƯƠNG PHÁP** ⇒ phải **sửa cách làm**, ⛔ không chỉ sửa kết luận ✓
3. ⭐⭐ **KIỂM TRƯỚC KHI BÁO CÁO ĐÃ CỨU TÔI LẦN NÀY.** Tôi ⛔ **không gửi cảnh báo** cho 2 «phát hiện» — ⭐ khác hẳn TASK-175 nơi tôi **gửi cảnh báo khẩn sai** ✓ **Thói quen «đọc mã trước khi kết luận» đang hình thành và có tác dụng thật** ✓
4. ⭐ **MỘT VÒNG «KHÔNG CÓ LỖI» VẪN LÀ KẾT QUẢ.** Nó **đóng một câu hỏi §11 bằng bằng chứng** ⇒ ⛔ không để tồn tại trạng thái «chưa ai kiểm» ✓
5. ⭐ **TÌM RA BẢN VÁ CŨ CÒN HIỆU LỰC CŨNG LÀ KẾT QUẢ.** `user-admin-tabs` (MỐC 115) **vẫn có rule** ⇒ ⭐ **bản vá chống lệch chiều rộng tab ⛔ không bị mất** ✓

---

## ⑦ BLOCKER / CHỜ USER

⛔ **Chưa commit** — **129 đường**, hỗn hợp 2 phiên.
⛔ **Cần user quyết:**
1. ⭐⭐ **Cho phép triển khai 5 bản vá Java** (1 lệnh): `node tools/deploy-java-backend.mjs --dong-y-trien-khai`.
2. ⭐ **Xác nhận 4 bản vá CSS bằng mắt** (`modal-head` · `receiving-kpi-button` · `requests-shortage-card` · `page-collapse`).
3. ⭐⭐ **Cho phép 1 phép thử GHI** để chốt cơ chế quyền (câu hỏi **duy nhất** còn lại của chuỗi đó).
4. **`e2e.project` có đúng là vai trò lập phiếu đề nghị mua hàng không?**
5. **Commit theo NHÓM hay gộp?** · `stack-form` · **BUG-20261009** · **«ai nhận hàng ở kho đích»** · **dọn Transit** · **khoá ngoại**.
