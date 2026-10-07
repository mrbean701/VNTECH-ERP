# TASK-181 — GO-LIVE ĐỢT 36: DỪNG ĐIỀU TRA QUYỀN VĨNH VIỄN + ✅ 12 ACTION MỚI ĐẠT 12/12

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Việc 1** | ⛔ **DỪNG** điều tra quyền — **7 giả thuyết bị bác bỏ**, ghi nhận trung thực + **lỗi đo của chính tôi** |
| **Việc 2** | ✅ **12 action của 6 thực thể chưa từng test** ⇒ **12/12 ĐẠT · EXIT=0** |
| **Tệp mới** | `tools/e2e/go-live-kiem-6-thuc-the.mjs` (⛔ ngoài `ROOT_DIRS`) |
| **Vân tay** | ⛔ **không đổi** (`tools/` ngoài `ROOT_DIRS`) |

---

## ① ⛔ DỪNG ĐIỀU TRA QUYỀN — **7 GIẢ THUYẾT BỊ BÁC BỎ**

| # | Giả thuyết | Bác bỏ bởi |
|---|---|---|
| ① | Backend ⛔ không lưu cờ | **1989** dòng `can_use=1` |
| ② | `assertDepartmentAllowsPermissions` **kẹp** cờ | Đọc mã: chỉ đọc `can_view`, **throw** |
| ③ | Payload khai `department_default` ⇒ cờ bị bỏ | Đọc mã (`UserManagementUseCase:325`): backend **TỰ TÍNH** |
| ④ | Xoá trắng quyền toàn hệ thống | E2E **726** vs thật **725** dòng `can_use=1` |
| ⑤ | Hàm kiểm **throw 400** vì thiếu `can_view` | **0** dòng `can_view=0` ở mọi đơn vị |
| ⑥ | Đơn vị **59 module** ⇒ throw | Phòng Dự án có **đủ 60** mà vẫn `can_use=0` |
| ⑦ | Lượt quét của tôi gọi `save_user` ⇒ `replaceDepartmentDefaults` | ⛔ **không tool nào gọi `save_user`** |
| ⑧ | Bước 8.2 chạy ⛔ không phải `admin` ⇒ 403 | Đọc mã: dòng **85** `login("admin", …)`, ⛔ không có login nào khác trước 8.2 |

⛔ **CƠ CHẾ VẪN CHƯA RÕ.** ⭐ **Điều CHẮC CHẮN duy nhất**: `e2e.tk` **theo ma trận có `warehouse_issue: GHI`** nhưng **DB ghi `can_use = 0`** ⇒ **bước 8.2 ⛔ chưa bao giờ ghi được cờ**.
⭐ **Cách duy nhất còn lại**: **1 phép thử GHI** (cấp 1 module cho 1 tài khoản rồi đọc lại DB) — ⛔ **cần user cho phép** (là `save_user_access` replace-all).
⭐⭐ **DỪNG LÀ ĐÚNG**: ảnh hưởng **CHỈ tài khoản TEST**, ⛔ **không phải bug sản phẩm** ⇒ đào tiếp là **vi phạm §12** ✓

---

## ② ⛔ LỖI ĐO CỦA CHÍNH TÔI — `MAX(updated_at)` ⛔ KHÔNG PHẢI «MỌI DÒNG»

Tôi đã suy luận: *«`e2e.to` có `MAX(p.updated_at) = 04:27:57` ⇒ **mọi dòng quyền của tài khoản bị ghi lúc 04:27** ⇒ lượt quét của tôi ghi lại»*.

⛔ **SAI VỀ PHƯƠNG PHÁP**: `MAX(updated_at)` chỉ là **dòng MUỘN NHẤT** — ⛔ **không nói gì về các dòng còn lại** ✓
⭐ Và số đo theo ngày (`DATE(updated_at) = 2026-10-05` ⇒ **1628 dòng**) **phù hợp với lô 00:56–00:59** của công cụ E2E ⇒ ⭐ **các dòng ĐÃ được ghi — với cờ của PHÒNG BAN (toàn 0)** ✓

⭐ **BÀI HỌC ĐO LƯỜNG**: `MAX`/`MIN` là **phép đo BIÊN**, ⛔ không phải **phép đo PHÂN BỐ**. Muốn nói «mọi dòng» phải dùng `COUNT(*) ... GROUP BY DATE(updated_at)` ✓

---

## ③ ✅ ĐO LẠI 6 THỰC THỂ — **ĐÍNH CHÍNH GHI CHÚ CŨ**

Ghi chú cũ của tôi nói 6 thực thể có **bộ ba** `save_*` / `set_*_status` / `delete_*`.
⛔ **ĐO LẠI THÌ SAI** — chúng chỉ có **CẶP ĐÔI**:
```text
save_material_norm        → module material_norms              · canCreate   |  delete_material_norm        · canEdit
save_payment_plan         → module dept_finance_payment_plan   · canCreate   |  delete_payment_plan         · canEdit
save_seal                 → module dept_legal_seal             · canCreate   |  delete_seal                 · canEdit
save_legal_document       → module dept_legal_documents        · canCreate   |  delete_legal_document       · canEdit
save_correspondence       → module dept_legal_correspondence   · canCreate   |  delete_correspondence       · canEdit
save_business_role_group  → module []  (KHÔNG cổng module)     · canUse      |  delete_business_role_group  · canUse
```
⭐ **Và cả 12 action đều được UI gọi** ✓ ⇒ **đáng test** ✓

---

## ④ ✅ BÀI KIỂM MỚI — `tools/e2e/go-live-kiem-6-thuc-the.mjs` — **12/12 ĐẠT**

⛔ **BÀI NÀY KHÔNG TẠO DỮ LIỆU.** Nó kiểm **hai khuôn đã xác lập** ở 34 action khác:
| Khuôn | Kỳ vọng | Vì sao quan trọng |
|---|---|---|
| ① `delete_*` với **id BỊA** | **400 «Không tìm thấy …»** | ⛔ trả 200 cho id bịa CHÍNH LÀ **BUG-20261011** đã tìm ra |
| ② `save_*` với **payload RỖNG** | **400** | ⛔ không được ghi **dòng rác** |

**KẾT QUẢ THẬT:**
```text
KET QUA KIỂM 12 ACTION · 6 THỰC THỂ: dat 12/12 · that bai 0
EXIT=0
```
⭐ **12/12 ĐẠT** — mọi `delete_*` trả **400 đúng khuôn**, mọi `save_*` payload rỗng trả **400** ✓

### ⭐ KIỂM HẬU QUẢ (đĩa «KIỂM HẬU QUẢ» — `chup-so-dong.mjs`)
| Bảng | Trước → Sau | |
|---|---|---|
| **`sessions`** | 3265 → **3267** | ✔ **BÌNH THƯỜNG** (phiên do chính tôi đăng nhập) |
| **MỌI BẢNG KHÁC** | ⛔ **KHÔNG ĐỔI** | ✔ **sạch** |

⭐ Và **kiểm ngay trong bài** (đọc lại bootstrap): `materialNorms` 0→0 · `paymentPlans` 4→4 · `seals` 0→0 · `legalDocuments` 0→0 · `correspondences` 0→0 · `businessRoleGroups` 11→11 ⇒ ⭐ **payload rỗng ⛔ KHÔNG ghi dòng rác** ✓

---

## ⑤ ⛔ SỬA LỖI SCRIPT CỦA CHÍNH TÔI — **EXIT=1 GIẢ**

Lần chạy đầu: **12/12 ĐẠT** nhưng **EXIT=1** ⛔ **không phải vì test hỏng** mà vì **tôi gọi sai hàm**:
```js
tomTatBuoc(BC);                                  // ⛔ SAI — hàm cần 2 tham số
tomTatBuoc("KIỂM 12 ACTION · 6 THỰC THỂ", BC);   // ✅ ĐÚNG (client.mjs:95)
```
⇒ `TypeError: Cannot read properties of undefined (reading 'filter')` ⇒ crash sau khi đã in hết kết quả ✓
⭐⭐ **VÌ SAO PHẢI SỬA**: **một script LUÔN exit 1 là TÍN HIỆU SAI** — người sau chạy nó sẽ tưởng **có lỗi sản phẩm**, ⛔ trong khi thực ra **chỉ là lỗi script** ✓ ⭐ **Sửa xong: EXIT=0** ✓

---

## ⑥ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| Điều tra quyền | ⛔ **DỪNG VĨNH VIỄN** — **8 giả thuyết bị bác bỏ** (kể cả 2 giả thuyết vòng này) |
| **Bài kiểm mới** | ✅ **12/12 ĐẠT · EXIT=0** |
| Phủ test action UI | **78/92 → 90/92** ⭐ |
| Kiểm hậu quả | ✅ **chỉ `sessions` tăng** (+2, do đăng nhập) — ⛔ mọi bảng khác không đổi |
| Bug sản phẩm mới | **0** |
| Vân tay | **ĐẠT** `VNTECH-FP-C1B45AAAF31BFCF2` · 713 tệp — ⛔ không đổi |
| `:18081` | ⛔ vẫn **JAR cũ** ⇒ **5 bản vá chưa lên sóng** |

---

## ⑦ BÀI HỌC

1. ⛔⛔ **`MAX`/`MIN` LÀ PHÉP ĐO BIÊN, ⛔ KHÔNG PHẢI PHÉP ĐO PHÂN BỐ.** Tôi suy «mọi dòng ghi lúc 04:27» từ `MAX(updated_at)` — ⛔ **sai phương pháp**; muốn nói «mọi dòng» phải dùng `GROUP BY DATE(...)` + `COUNT(*)` ✓
2. ⭐⭐ **BIẾT DỪNG KHI PHÂN TÍCH TĨNH ĐÃ CẠN.** **8 giả thuyết bị bác bỏ** là **đủ** để kết luận «phải CHẠY THỬ mới biết», ⛔ không phải «đoán thêm giả thuyết thứ 9» ✓ ⭐ Và **ghi lại cả 8** để phiên sau ⛔ không lặp ✓
3. ⭐⭐ **MỘT SCRIPT LUÔN `EXIT=1` LÀ TÍN HIỆU SAI — PHẢI SỬA.** Nó khiến người sau **tưởng có lỗi sản phẩm** ⛔ trong khi chỉ là lỗi script ✓ ⭐ **Tín hiệu sai nguy hiểm ngang kết luận sai.**
4. ⭐ **KIỂM KHUÔN LÀ CÁCH TEST RẺ VÀ AN TOÀN.** 12 action kiểm bằng **2 khuôn 400** mà ⛔ **không tạo một dòng dữ liệu nào** ⇒ ⭐ **phủ được nhiều action với rủi ro bằng 0** ✓
5. ⭐ **ĐÍNH CHÍNH GHI CHÚ CŨ KHI ĐO LẠI THẤY KHÁC.** Tôi từng ghi 6 thực thể có **bộ ba** action — đo lại chỉ có **cặp đôi** ⇒ ⭐ **ghi lại con số đúng**, ⛔ không để ghi chú sai tồn tại ✓

---

## ⑧ BLOCKER / CHỜ USER

⛔ **Chưa commit** — **128 đường**, hỗn hợp 2 phiên.
⛔ **Cần user quyết:**
1. ⭐⭐ **Cho phép triển khai 5 bản vá Java** (1 lệnh): `node tools/deploy-java-backend.mjs --dong-y-trien-khai`.
2. ⭐ **Xác nhận 4 bản vá CSS bằng mắt**.
3. ⭐⭐ **Cho phép 1 phép thử GHI** để chốt cơ chế quyền (câu hỏi **duy nhất** còn lại của chuỗi đó) — hoặc **cho chạy lại `cap-quyen-chuc-nang.mjs`**.
4. **`e2e.project` có đúng là vai trò lập phiếu đề nghị mua hàng không?**
5. **Commit theo NHÓM hay gộp?** · `stack-form` · **BUG-20261009** · **«ai nhận hàng ở kho đích»** · **dọn Transit** · **khoá ngoại**.
