# TASK-184 — GO-LIVE ĐỢT 39: KIỂM TÀI LIỆU ⇄ SỰ THẬT — ⭐ BẮT ĐƯỢC **ĐIỂM LÙI SAI 8 COMMIT**

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Việc** | ⭐ Lặp lại phép kiểm **đã từng tìm ra lỗi hỏng thật** (TASK-178): **đối chiếu `CURRENT_STATE` với sự thật đo được** |
| **Kết quả** | ⚠️ **2 chỗ lệch** ⇒ ✅ **đã sửa** · ⭐ **1 trong đó là VẤN ĐỀ AN TOÀN GIT** |
| **Tệp sửa** | `docs/dsh-state/CURRENT_STATE.md` (2 dòng) — ⛔ ngoài `ROOT_DIRS` |
| **Vân tay** | ⛔ **không đổi** |

---

## ① ⭐ PHÉP KIỂM: ĐỐI CHIẾU **TÀI LIỆU** ⇄ **SỰ THẬT ĐO ĐƯỢC**

| Trường | Tài liệu ghi | **ĐO ĐƯỢC** | |
|---|---|---|---|
| Nhánh | `unity` | **`unity`** | ✅ khớp |
| Vân tay nguồn | `VNTECH-FP-27251D9B7F076176` · 713 tệp | **`VNTECH-FP-27251D9B7F076176` · 713 tệp** | ✅ khớp |
| **HEAD / điểm lùi** | ⚠️ **`82d7ea8`** | ⭐ **`cae2815`** | ⛔ **LỆCH — VÀ LÀ VẤN ĐỀ AN TOÀN** |
| Files chưa commit | ⚠️ **125 đường** | **131 đường** | ⚠️ **lệch 6** |

---

## ② ⭐⭐ PHÁT HIỆN QUAN TRỌNG NHẤT — **ĐIỂM LÙI SAI 8 COMMIT**

Tài liệu ghi **«Điểm lùi \| `82d7ea8`»**. ⭐ **ĐO LẠI**:

| Phép đo | Kết quả |
|---|---|
| `git cat-file -t 82d7ea8` | **`commit`** ⇒ ⚠️ **commit CÓ THẬT** (⛔ không phải bịa) |
| Nội dung | `82d7ea8` · **30/09/2026** · «fix: MOC 103b — ten nguoi review lay tu users.full_name + sua du lieu mojibake CSDL» |
| `82d7ea8` có phải **tổ tiên** của HEAD? | ✅ **Có** |
| ⭐ **Số commit từ `82d7ea8` ĐẾN HEAD** | ⛔ **8 COMMIT** |
| **HEAD thật** | ⭐ **`cae2815`** · **01/10/2026** · «docs: bo sung ke hoach kiem thu alpha theo bo phan + D-057» |

⛔⛔ **HỆ QUẢ NẾU DÙNG SAI**: nếu ai đó «lùi về điểm lùi» theo tài liệu, họ sẽ ⛔ **MẤT 8 COMMIT** (gồm `4d8d7b0` bỏ tsbuildinfo · `73e520b` xoá 5 ảnh · `53b4e8b` tái lập vân tay · `5e729aa` migration **V32–V34** · `950bb3e` lưu cột «hết hạn» quyền …) ✓
⇒ ⭐⭐ **ĐÂY LÀ VẤN ĐỀ AN TOÀN GIT (goal §18), ⛔ không phải lỗi chính tả.** Một «điểm lùi» **sai** nguy hiểm hơn **⛔ không có điểm lùi**: nó khiến người xử lý **tin rằng mình đang lùi an toàn** ✓

### ✅ ĐÃ SỬA
```diff
- | Điểm lùi | `82d7ea8` |
+ | **HEAD / điểm lùi ĐÚNG** | ⭐ **`cae2815`** — «docs: bo sung ke hoach kiem thu alpha…» · **01/10/2026**
+   ⛔ **ĐÍNH CHÍNH (TASK-184)**: dòng cũ ghi `82d7ea8` — ⚠️ commit đó **CÓ THẬT** nhưng **CÁCH HEAD 8 COMMIT**
+   ⇒ ⛔ **dùng nó làm điểm lùi sẽ MẤT 8 COMMIT** ✓ |
```
⭐ **Ghi kèm LÝ DO sai** (⛔ không chỉ thay số) để phiên sau ⛔ **không lặp lại** ✓

---

## ③ ⚠️ CHỖ LỆCH THỨ HAI — «125 đường» → **131 đường**

| | |
|---|---|
| Tài liệu ghi | **125 đường** (đo ở TASK-178) |
| **Đo nay** | ⭐ **131 đường** |
| **Nguyên nhân** | ⭐ **chính các tài liệu của phiên này** (`TASK-179` … `TASK-184`, `GO-LIVE-…`) ⇒ ⭐ **tài liệu ĐÚNG khi viết, nhưng LỆCH sau đó** ✓ |

⇒ ✅ **Đã sửa thành «131 đường»** + ghi rõ **phần tăng thêm là tài liệu `TASK-179…184` của phiên này** ✓
⭐ **Và giữ nguyên thông tin quan trọng**: «**HỖN HỢP 2 PHIÊN**» — 56 đường phiên GO-LIVE · 58 đường phiên trước ✓

---

## ④ ✅ NHỮNG THỨ **KIỂM RA LÀ ĐÚNG** (⛔ không sửa)

| Thứ | Vì sao ⛔ không sửa |
|---|---|
| **30+ vân tay `VNTECH-FP-…` khác nhau** trong tệp | ⭐ **ĐÓ LÀ LỊCH SỬ**, ⛔ không phải mâu thuẫn — mỗi mốc ghi vân tay tại thời điểm đó ✓ |
| `CHECKLIST.md` **6922 dòng** · `testlog.md` **573 dòng** | ✅ khớp với số tôi ghi trong các TASK ✓ |
| `TASK-*.md` mới nhất theo **tên** là `TASK-MT3-UI-27.md` | ⭐ **do sắp xếp CHỮ CÁI** (`MT3` > `183`) — ⛔ **không phải tài liệu thiếu**, chỉ là **tên khác quy ước** ✓ ⚠️ **Lưu ý cho phiên sau: ⛔ đừng tìm task mới nhất bằng cách sắp tên** ✓ |

---

## ⑤ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| Chỗ lệch tài liệu ⇄ sự thật | **2** — ⚠️ **cả hai đã sửa** |
| ⭐ Trong đó là **vấn đề an toàn** | **1** — **điểm lùi sai 8 commit** ⇒ ✅ **đã sửa** |
| Tệp sửa | `docs/dsh-state/CURRENT_STATE.md` (**2 dòng**) · **CRLF thuần giữ nguyên** ✓ · **1426 dòng** |
| Bug sản phẩm mới | **0** |
| Vân tay | **ĐẠT** `VNTECH-FP-27251D9B7F076176` · 713 tệp — ⛔ không đổi |
| `:18081` | ⛔ vẫn **JAR cũ** ⇒ **5 bản vá Java chưa lên sóng** |

---

## ⑥ BÀI HỌC

1. ⭐⭐ **KIỂM TÀI LIỆU ⇄ SỰ THẬT LÀ PHÉP KIỂM CÓ LÃI — LẦN THỨ HAI NÓ TÌM RA LỖI THẬT.** TASK-178 phát hiện tài liệu lạc hậu **25 vòng**; vòng này phát hiện **điểm lùi sai 8 commit** ✓ ⭐ **Cùng một phép kiểm, hai lần tìm ra vấn đề khác nhau** ⇒ ⭐ **nên làm ĐỊNH KỲ, ⛔ không chỉ khi nghi ngờ** ✓
2. ⛔⛔ **«ĐIỂM LÙI SAI» NGUY HIỂM HƠN «⛔ KHÔNG CÓ ĐIỂM LÙI».** Điểm lùi sai khiến người xử lý **tin rằng mình đang lùi an toàn** — ⭐ ⛔ không có điểm lùi thì họ **biết mình phải cẩn thận** ✓
3. ⭐ **MỘT COMMIT «CÓ THẬT» ⛔ CHƯA CHẮC LÀ «ĐÚNG CẦN DÙNG».** `82d7ea8` **tồn tại và là tổ tiên của HEAD** — nhưng **cách 8 commit** ⇒ ⭐ **kiểm sự tồn tại ⛔ KHÔNG đủ; phải kiểm KHOẢNG CÁCH** ✓
4. ⭐ **GHI KÈM LÝ DO KHI SỬA, ⛔ không chỉ thay số.** Dòng mới nói rõ **vì sao** dòng cũ sai ⇒ ⭐ phiên sau ⛔ **không "sửa lại" về số cũ** ✓
5. ⭐ **PHÂN BIỆT «LỊCH SỬ» VỚI «MÂU THUẪN».** 30+ vân tay khác nhau trong một tệp **⛔ không phải lỗi** — đó là **bản ghi theo thời gian** ✓ ⭐ **Một phép kiểm tốt phải ⛔ không báo động nhầm loại này** ✓

---

## ⑦ BLOCKER / CHỜ USER

⛔ **Chưa commit** — **131 đường**, hỗn hợp 2 phiên.
⛔ **Cần user quyết:**
1. ⭐⭐ **Cho phép triển khai 5 bản vá Java** (1 lệnh): `node tools/deploy-java-backend.mjs --dong-y-trien-khai`.
2. ⭐ **Xác nhận 5 bản vá CSS bằng mắt** (`modal-head` · `receiving-kpi-button` · `requests-shortage-card` · `page-collapse` · `stack-form`).
3. ⭐⭐ **Cho phép 1 phép thử GHI** để chốt cơ chế quyền (câu hỏi **duy nhất** còn lại của chuỗi đó).
4. **`e2e.project` có đúng là vai trò lập phiếu đề nghị mua hàng không?**
5. **Commit theo NHÓM hay gộp?** · **BUG-20261009** · **«ai nhận hàng ở kho đích»** · **dọn Transit** · **khoá ngoại**.
