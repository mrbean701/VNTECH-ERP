# TASK-198 — GO-LIVE ĐỢT 53: QUÉT **LỖI CHUYỂN NGỮ** CÙNG LOẠI BUG-014 — ⛔ **PHƯƠNG PHÁP NHIỀU BÁO ĐỘNG GIẢ**

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Giả thuyết** | ⭐ BUG-20261005-014 là **lỗi chuyển ngữ** (Java đánh mất chốt chặn của JS) ⇒ ⭐ **hẳn còn ca cùng loại** |
| **Phép thử** | ⭐ **Cơ giới hoá cách BUG-014 lộ ra**: trích **mọi `throw new Error("…")`** trong các khối action của `scripts/system-route.mjs` ⇒ ⭐ **thông điệp nào VẮNG trong cây Java = ứng viên** |
| **Kết quả** | ⛔ **8 ca đã kiểm tay — CẢ 8 LÀ BÁO ĐỘNG GIẢ** ⇒ ⛔ **KHÔNG tìm ra lỗi mới** |
| **Giá trị** | ⭐ **Kết quả ÂM có giá trị**: ⭐ **họ `delete_*` nay đã sạch** · ⭐ **và biết rõ phép quét ⛔ KHÔNG dùng được làm phán quyết** |
| **Mã nguồn sửa** | ⛔ **KHÔNG** |

---

## ① PHÉP THỬ — CƠ GIỚI HOÁ CÁCH BUG-014 LỘ RA

⭐ **BUG-014 lộ ra thế nào**: thông điệp **«Hệ M&E đang có vật tư…»** ⭐ **CÓ** trong JS gốc mà ⛔ **KHÔNG có** trong cây Java ⇒ ⭐ **chốt chặn bị đánh mất khi chuyển ngữ** ✓
⇒ ⭐ **Cơ giới hoá**: với **mỗi khối `if (action === "…")`** trong `scripts/system-route.mjs`, trích mọi `throw new Error("…")` (≥12 ký tự) rồi **kiểm sự tồn tại trong toàn bộ cây Java** ✓

| Phép đo | Kết quả |
|---|---|
| Khối action quét được | **162** |
| Cây Java đối chiếu | **1.527 KB** |
| Khối ⛔ không có `throw` nào (⛔ phép quét không kiểm được) | **7** |
| **Ứng viên** (có thông điệp vắng trong Java) | **~20 action** |

---

## ② ✅ ĐÃ KIỂM TAY **8 CA** — **CẢ 8 LÀ BÁO ĐỘNG GIẢ**

| Action | Thông điệp JS «vắng» | ⭐ Java THỰC TẾ kiểm bằng gì | Kết luận |
|---|---|---|---|
| **`decide_approval`** | «Bạn không phải Owner được phân công…» | ⭐ `accessScope.requireProjectAccess(...)` + `if (!canApproveRequestStage(...)) throw Api("Bạn không phải Owner được phân công của bước này nên không được phê duyệt.")` | ⛔ **GIẢ** (khác chữ) |
| **`reject_po`** | «Tài khoản không có quyền từ chối PO…» | ⭐ `rbac.requireRole(..., List.of("procurement","accountant","admin"))` + `requireProjectAccess` | ⛔ **GIẢ** (⭐ **còn CHẶT hơn JS**) |
| **`delete_supplier`** | «Chỉ Quản trị viên hoặc Trưởng phòng KH…» | ⭐ **RBAC** lo + ⭐ **chốt thông minh hơn**: có PO ⇒ **«Ngừng sử dụng»** thay vì xoá vật lý | ⛔ **GIẢ** (⭐ **tốt hơn**) |
| **`delete_partner`** | «Chỉ Quản trị viên hoặc Trưởng phòng KH…» | ⭐ **RBAC** lo (JS cũng chỉ kiểm phân quyền) | ⛔ **GIẢ** |
| **`delete_material`** | «Không tìm thấy mã vật tư.» | `orElseThrow(() -> Api("Không tìm thấy vật tư."))` | ⛔ **GIẢ** (khác chữ) |
| **`delete_user_module_override`** | «Không tìm thấy ngoại lệ cá nhân cần xóa.» | ⭐ **đã có chốt tồn tại** (tôi vá ở **BUG-20261011**) | ⛔ **GIẢ** |
| **`delete_selected_materials`** | «Chưa chọn mã vật tư.» · «Mỗi lần xử lý tối đa 5.000 mã.» | `if (ids.isEmpty()) throw Api("Chưa chọn vật tư để xóa.")` + ⭐ **là SOFT-DELETE** (`setMaterialActive(false)`), ⛔ không xoá cứng | ⛔ **GIẢ** (khác chữ + khác thiết kế) |
| **`create_request`** | «Tài khoản đã bị khoá…» · «phải có dự án và ít nhất một dòng vật tư.» | `if (rawLines.isEmpty()) throw Api("…ít nhất một dòng vật tư.")` + `accessScope.requireProjectAccess(...)` | ⛔ **GIẢ** (khác chữ) |

---

## ③ ⚠️ **2 KHÁC BIỆT THẬT** — ⛔ NHƯNG LÀ «CHO PHÉP NHIỀU HƠN», ⛔ KHÔNG PHẢI MẤT CHỐT BẢO VỆ

| # | Khác biệt | Đo được | Mức |
|---|---|---|---|
| **1** | **`create_request`: dự án là TUỲ CHỌN ở Java**, ⛔ bắt buộc ở JS | `String projectId = trim(...)` rồi **`if (!projectId.isEmpty())`** mới kiểm quyền (dòng 83-84) — ⭐ JS nói «phải có dự án» | ⚠️ **thấp** — ⭐ **cho phép nhiều hơn**, ⛔ không hở quyền |
| **2** | **`create_request`: ⛔ không có chốt «tài khoản đã bị khoá»** | ⭐ **toàn cây Java ⛔ không có** khái niệm đó; ⭐ **bảng `users` ⛔ KHÔNG có cột `status`/`locked`** (đo bằng `SHOW COLUMNS`) | ⚠️ **thấp** — ⭐ **khái niệm ⛔ không tồn tại trong mô hình Java**, ⛔ không phải chốt bị bỏ |

⛔ **CẢ HAI ⛔ CHƯA ĐƯỢC CHỨNG MINH là lỗi** ⇒ ⭐ **ghi nhận làm «khác biệt cần theo dõi», ⛔ KHÔNG mở bug** ✓ — ⭐ **đúng kỷ luật: ⛔ không kết luận khi chưa đo được thiệt hại** ✓

---

## ④ ✅ GIÁ TRỊ CỦA KẾT QUẢ ÂM

⭐⭐ **HỌ `delete_*` NAY ĐÃ SẠCH** — ⭐ **phép quét ⛔ KHÔNG tìm ra ca nào như BUG-014** ✓ — ⭐ **nghĩa là BUG-014 là ca HIẾM, ⛔ không phải hiện tượng phổ biến** ✓
⭐⭐ **VÀ phép quét TỰ CHỨNG MINH nó đúng**: ⭐ `delete_material_category` **⛔ KHÔNG còn trong danh sách ứng viên** — ⭐ vì **bản vá TASK-197 đã đưa thông điệp «Hệ M&E đang có vật tư…» vào Java** ⇒ ⭐ **nếu chạy phép quét TRƯỚC bản vá, nó SẼ bắt được BUG-014** ✓✓✓

---

## ⑤ ⛔⛔ PHƯƠNG PHÁP NÀY **CÓ TỈ LỆ BÁO ĐỘNG GIẢ RẤT CAO** — ⛔ ĐỪNG DÙNG LÀM PHÁN QUYẾT

| | |
|---|---|
| Ứng viên | **~20** |
| Đã kiểm tay | **8** |
| ⛔ **Báo động giả** | **8/8 = 100%** |
| Lỗi thật tìm thêm | **0** |

⭐⭐ **VÌ SAO TỈ LỆ GIẢ CAO**: ⭐ **Java kiểm bằng `orElseThrow` / RBAC / `accessScope` / điều kiện khác** — ⭐ **và thường DIỄN ĐẠT LẠI thông điệp** ⇒ ⭐ **«thông điệp vắng trong Java» ⛔ KHÔNG có nghĩa là «chốt chặn bị mất»** ✓
⚠️ **VÀ ĐIỂM MÙ**: ⛔ không thấy chốt diễn đạt khác · ⛔ không thấy chốt nằm ở tầng store/adapter · ⛔ 7 khối ⛔ không có `throw` nào thì ⛔ không kiểm được ✓
⭐⭐ **⇒ KẾT LUẬN: DÙNG LÀM «DANH SÁCH ĐỂ SOI», ⛔ KHÔNG DÙNG LÀM «DANH SÁCH LỖI»** ✓ — ⭐ **mỗi ứng viên BẮT BUỘC kiểm tay** ✓

---

## ⑥ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| Khối action quét | **162** · cây Java **1.527 KB** |
| Ứng viên | **~20** |
| ⭐ Đã kiểm tay | **8** — ⛔ **cả 8 là báo động giả** |
| Lỗi thật tìm thêm | **0** |
| ⚠️ Khác biệt thật (chưa chứng minh là lỗi) | **2** — `create_request`: dự án tuỳ chọn · ⛔ không có chốt «tài khoản bị khoá» (⭐ **mô hình Java ⛔ không có khái niệm đó**) |
| ✅ Họ `delete_*` | ⭐ **SẠCH** — ⛔ không còn ca nào như BUG-014 |
| Bug sản phẩm mới | **0** |
| Vân tay | **ĐẠT** `VNTECH-FP-27251D9B7F076176` · 713 tệp — ⛔ không đổi |
| `:18081` | ⛔ vẫn **JAR cũ** ⇒ **7 bản vá chưa lên sóng** |
| Tệp tạm | **0** (đã dọn `tmp-quet-chot-chan.mjs`) |

---

## ⑦ BÀI HỌC

1. ⭐⭐ **MỘT PHÉP QUÉT CÓ TỈ LỆ BÁO ĐỘNG GIẢ 100% THÌ ⛔ KHÔNG PHẢI CÔNG CỤ PHÁT HIỆN — NÓ LÀ DANH SÁCH ĐỂ SOI.** ⭐ **Giá trị thật của nó là ở chỗ nó BUỘC phải kiểm tay 20 ca, ⛔ không phải ở chỗ nó «báo 20 lỗi»** ✓
2. ⭐⭐ **CÙNG MỘT CHỐT CHẶN, JAVA VÀ JS DIỄN ĐẠT KHÁC NHAU LÀ BÌNH THƯỜNG.** ⭐ `orElseThrow` · `requireRole` · `requireProjectAccess` · điều kiện `if` — ⭐ **đều là chốt chặn hợp lệ** ✓
3. ⭐⭐ **KẾT QUẢ ÂM VẪN LÀ KẾT QUẢ.** ⭐ «Họ `delete_*` ⛔ không còn lỗi chuyển ngữ» là **thông tin đáng tin** — ⭐ **và nó định hướng vòng sau ⛔ không quét lại chỗ này** ✓
4. ⭐⭐ **PHÉP QUÉT TỰ CHỨNG MINH NÓ ĐÚNG** — ⭐ `delete_material_category` **⛔ không còn là ứng viên** sau bản vá ⇒ ⭐ **nó SẼ bắt được BUG-014 nếu chạy trước bản vá** ✓
5. ⭐⭐ **«CHO PHÉP NHIỀU HƠN» ⛔ KHÔNG PHẢI «MẤT CHỐT BẢO VỆ».** ⭐ 2 khác biệt thật đều thuộc loại **cho phép nhiều hơn** ⇒ ⭐ **ghi nhận để theo dõi, ⛔ KHÔNG mở bug khi chưa đo được thiệt hại** ✓
6. ⭐ **GHI LẠI PHƯƠNG PHÁP ĐÃ THỬ — CẢ KHI NÓ ⛔ KHÔNG HIỆU QUẢ** (⭐ cùng loại với «quét tĩnh cột» ở TASK-190) ✓

---

## ⑧ BLOCKER / CHỜ USER

⛔ **Chưa commit** — **147 đường**, hỗn hợp 2 phiên.
⛔ **Cần user quyết:**
1. ⭐⭐⭐ **TRIỂN KHAI** (1 lệnh): `node tools/deploy-java-backend.mjs --dong-y-trien-khai` ⇒ ⭐ **7 bản vá** + **11 bài nghiệm thu** — ⭐ **sau đó tôi `VERIFY` end-to-end BUG-012 và BUG-014** ✓
2. ⭐⭐ **BUG-20261005-013** — **A** tạo migration hay **B** bỏ `mergedFrom`?
3. ⭐ **Xác nhận 5 bản vá CSS bằng mắt.**
4. ⭐⭐ **Cho phép 1 phép thử GHI** để chốt cơ chế quyền.
5. ⭐ **2 khác biệt thật ở `create_request`** — có cần khôi phục «dự án bắt buộc» ⛔ không? (⭐ **tôi ⛔ không tự sửa vì chưa chứng minh được thiệt hại**)
6. **Commit theo NHÓM hay gộp?** · **dọn Transit** · **khoá ngoại**.
