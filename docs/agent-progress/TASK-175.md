# TASK-175 — GO-LIVE ĐỢT 30: ⛔ BÁO ĐỘNG SAI VỀ QUYỀN — VÀ ⛔ TÔI ĐÃ GỬI CẢNH BÁO KHẨN SAI NGUYÊN NHÂN

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Việc** | Quét hồi quy toàn hệ thống ⇒ 2 bài **tụt điểm** ⇒ điều tra |
| **Kết luận** | ⛔ **TÔI ĐÃ SAI HAI LẦN LIÊN TIẾP** trong cùng một cuộc điều tra · ⭐ **và đã gửi một CẢNH BÁO KHẨN sai nguyên nhân** |
| **Mã nguồn sửa** | ⛔ **KHÔNG** |

---

## ① KẾT QUẢ QUÉT HỒI QUY TOÀN HỆ THỐNG (23 bài)

| Nhóm | Kết quả |
|---|---|
| **Hồi quy backend `mvn -o test`** | ✅ **19 + 38 + 13 + 86 = 156 test · 0 fail · 0 error · EXIT=0** |
| `go-live-vong-doi-cap-bac` · `go-live-vong-doi-ncc-doi-tac` | ✅ **6/6** · **8/8** |
| `go-live-bao-loi-va-thong-bao` | ✅ **9/9** |
| `go-live-doc-tat-ca-va-doi-mat-khau` | ✅ **8/8** |
| `go-live-kiem-chot-chan-update-set-bulk` · `go-live-kiem-save-payload-rong` | ✅ **EXIT=0** |
| `giai-doan-04` · `05b` · `08a` · `08c` · `05a` · `05-06` | ✅ ĐẠT |
| ⚠️ **`giai-doan-09`** | ⛔ **EXIT=1** — dừng ở bước **9.A2** |
| ⚠️ **`go-live-chuoi-kho`** | ⛔ **5/9** (từng **9/9**) |
| `giai-doan-01` · `02` · `07` · `08b` · `go-live-vong-doi-kho` · `go-live-bao-loi-danh-dau-xong` · `go-live-kiem-an-toan-delete` · `go-live-phu-toan-bo-delete` | ⓘ lệch **đã biết/đã ghi** (điều kiện cạn · chờ bản vá chưa triển khai) |

**TRIỆU CHỨNG CHUNG CỦA 2 BÀI TỤT ĐIỂM** — ⛔ **tất cả đều là lỗi QUYỀN**:
```text
create_request · issue_stock_confirm · confirm_stock_issue · return_stock · create_transfer_order
→ "Tài khoản chưa được quản trị viên cấp đúng quyền cho thao tác này."
```
⇒ ⛔ **lỗi QUYỀN, ⛔ không phải logic/dữ liệu** — dữ liệu nghiệp vụ ⛔ **không mất**.

---

## ② ⛔ SAI LẦN THỨ NHẤT — TÔI GÁN TỘI CHO `delete_department_permission` MÀ ⛔ KHÔNG ĐỌC NHẬT KÝ TRƯỚC

Tôi **kết luận ngay** rằng **BUG-20261010** (`delete_department_permission` ⛔ không kiểm tồn tại + chạy `syncDepartmentUsers` vô điều kiện) là thủ phạm — vì bài test của tôi đã gọi action đó — **rồi gửi CẢNH BÁO KHẨN** với kết luận đó.

⛔ **NHẬT KÝ KIỂM TOÁN BÁC BỎ HOÀN TOÀN:**

| Bản ghi trong `audit_logs` hôm nay | Số lần | Thời gian |
|---|---|---|
| `save_department_permission` | **23** | **00:56:48 → 00:59:02** |
| `save_user_access` | **9** | **00:59:02 → 00:59:03** |
| **`delete_department_permission`** | ⛔ **KHÔNG CÓ BẢN GHI NÀO** | — |

⇒ ⭐ **`delete_department_permission` ⛔ KHÔNG hề được gọi** ⇒ giả thuyết của tôi **SAI** ✓
⇒ ⭐ **Thứ ghi đè là `save_department_permission` ×23 + `save_user_access` ×9** lúc **00:56–00:59**.
⚠️ **`save_user_access` là action REPLACE-ALL** — chính là action mà ghi chú vận hành của tôi đánh dấu «⛔ **không chạy ẩu**».

⛔⛔ **BÀI HỌC: ĐỌC NHẬT KÝ KIỂM TOÁN TRƯỚC KHI GÁN TỘI.** Tôi đã có sẵn `audit_logs` với `before_json`/`after_json` mà ⛔ **không dùng** — chỉ một truy vấn là đủ bác bỏ giả thuyết.

---

## ③ ⛔ SAI LẦN THỨ HAI — TÔI SUY «HỎNG» TỪ THÀNH PHẦN MODULE

Tôi thấy `e2e.to` (tài khoản **tổ đội**) có quyền `dept_finance_*` · `dept_legal_*` · `dept_plan_*` ⇒ kết luận «bị gán mẫu của **mọi phòng ban** ⇒ hỏng».

⛔ **ĐO LẠI THÌ SAI:**

| Module kiểm | Số đơn vị **CÓ** module đó |
|---|---|
| `central_warehouse` | **8 / 8** |
| `dept_legal_labor` | **8 / 8** |
| `dept_plan_rfq` | **8 / 8** |
| `dept_project_boq` | **8 / 8** |

⭐ `department_module_permissions` = **478 dòng = 8 đơn vị × 60 module** ⇒ ⭐ **mẫu mặc định DÙNG CHUNG cho MỌI đơn vị** ⇒ việc `e2e.to` có module của phòng ban khác là **BÌNH THƯỜNG THEO THIẾT KẾ** ✓

⭐ **VÀ** `e2e.to` có **60/60 module** ⇒ **quyền ⛔ KHÔNG bị tước**, mà là **đủ theo mẫu mặc định** — chỉ **cờ** khác nhau theo đơn vị (vd `central_warehouse`: `can_view=1` nhưng `can_use=0` ⇒ ⭐ **Phòng Dự án ⛔ không được DÙNG kho tổng theo thiết kế** ⇒ `issue_stock_confirm` bị chặn **đúng**).

---

## ④ ✅ SỰ THẬT ĐO ĐƯỢC — VÀ ĐIỀU TÔI ⛔ **KHÔNG** BIẾT

### Đo được (chắc chắn)
| Phép đo | Giá trị |
|---|---|
| `user_module_permissions` | **2198 dòng** |
| `permission_source` | **100% `department_default`** · ⭐ **`manual_override` = 0** |
| `updated_at` = **hôm nay** | **1628 / 2198 dòng (74%)** |
| `audit_logs` hôm nay | `save_department_permission` **23** · `save_user_access` **9** (00:56–00:59) · ⛔ **không** `delete_department_permission` |
| `department_module_permissions` | **478 = 8 × 60** (dùng chung) |
| Bản sao lưu DB | ⛔ **KHÔNG có** |
| `audit_logs.before_json` cho các bản ghi quyền | ⛔ **NULL** ⇒ ⛔ **không khôi phục được từ nhật ký** |

### ⛔ Điều tôi ⛔ **KHÔNG** biết (nói thẳng)
1. ⛔ **Ai/khi nào** chạy 23 `save_department_permission` + 9 `save_user_access` lúc **00:56–00:59** — ⛔ tôi **không chứng minh được** đó là phiên này hay phiên trước.
2. ⛔ **Trước đó các tài khoản E2E có `manual_override` hay không** — ⛔ **không có ảnh chụp nào** để đối chiếu.
3. ⇒ ⭐ **Nên ⛔ tôi ⛔ KHÔNG kết luận «có mất quyền» hay «không mất».** ⭐ **DẤU HIỆU DUY NHẤT** là **vi sai**: `giai-doan-09` từng **10/10** và `go-live-chuoi-kho` từng **9/9** ⇒ ⭐ **có gì đó đã đổi** giữa hai thời điểm — ⛔ nhưng **cái gì** thì ⛔ **chưa chứng minh được**.

---

## ⑤ ĐỀ XUẤT (⛔ KHÔNG tự làm — cần user quyết)

| # | Việc | Vì sao cần user |
|---|---|---|
| 1 | ⭐ **Khôi phục `manual_override` cho tài khoản test** | ⛔ Tôi **không biết** bộ quyền đích của từng tài khoản; ⛔ và `save_user_access` là **replace-all** ⇒ ⛔ **không được chạy ẩu** |
| 2 | ⭐ **Hoặc sửa KỲ VỌNG của bài test** cho khớp thiết kế | `e2e.to` là **Phòng Dự án** mà `central_warehouse.can_use=0` **theo thiết kế** ⇒ bài `giai-doan-09`/`go-live-chuoi-kho` có thể đang **đòi hỏi sai** |
| 3 | ⭐ **Có bản sao lưu MySQL ngoài repo không?** | ⛔ Trong repo **không có**; nếu user có backup thì khôi phục chính xác được |
| 4 | ⭐ **Từ nay ⛔ tôi sẽ ⛔ KHÔNG chạy `delete_department_permission` / `save_user_access` / `save_department_permission` trên hệ thống thật** cho tới khi có bản vá + có mắt người | — |

---

## ⑥ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| Hồi quy backend | ✅ **156/156 · EXIT=0** |
| Quét E2E | **23 bài** — 2 bài tụt điểm ⚠️ (nguyên nhân **quyền**, ⛔ chưa xác định được nguồn) |
| Báo động sai tôi đã gửi | ⛔ **1 CẢNH BÁO KHẨN sai nguyên nhân** ⇒ **đã đính chính** |
| Số lần tôi sai trong cuộc điều tra này | ⛔ **2** |
| Bug sản phẩm mới | **0** |
| Vân tay | **ĐẠT** `VNTECH-FP-C1B45AAAF31BFCF2` · 713 tệp — ⛔ không đổi |
| `:18081` | ⛔ vẫn **JAR cũ** ⇒ **5 bản vá chưa lên sóng** |

---

## ⑦ BÀI HỌC

1. ⛔⛔ **ĐỌC NHẬT KÝ KIỂM TOÁN TRƯỚC KHI GÁN TỘI.** Tôi có sẵn `audit_logs` (`before_json`/`after_json`) mà ⛔ không dùng; **một truy vấn** đã bác bỏ giả thuyết — nhưng tôi đã **gửi cảnh báo khẩn trước khi kiểm**.
2. ⛔⛔ **VI SAU LÀ DẤU HIỆU, ⛔ KHÔNG PHẢI BẰNG CHỨNG NGUYÊN NHÂN.** «Bài test từng ĐẠT, nay ⛔ không» chứng minh **có gì đó đã đổi**, ⛔ **không** chứng minh **cái gì** đã đổi.
3. ⛔⛔ **ĐỪNG SUY SỰ THẬT TỪ «TRÔNG CÓ VẺ SAI».** `e2e.to` có module của phòng ban khác **trông sai** — nhưng **mẫu mặc định dùng chung 8×60** ⇒ **đúng thiết kế**. ⭐ Muốn biết «sai» phải **đo mẫu**, ⛔ không phải **đọc danh sách**.
4. ⭐⭐ **CẢNH BÁO KHẨN CẦN MỨC BẰNG CHỨNG CAO HƠN, ⛔ KHÔNG THẤP HƠN.** §14 nói «gửi ngay» — nhưng ⛔ **gửi ngay ⛔ không có nghĩa là gửi ⛔ không kiểm**. ⭐ **Một cảnh báo khẩn sai còn tệ hơn một cảnh báo chậm**: nó **định hướng sai** người xử lý.
5. ⭐ **NÓI RÕ ĐIỀU ⛔ KHÔNG BIẾT.** Tôi ⛔ **không** kết luận «có mất quyền» hay «không mất» — vì ⛔ **không có ảnh chụp trước đó**. ⭐ **Thiếu ảnh chụp là lỗ hổng của chính quy trình đo**, cần ghi lại.

---

## ⑧ BLOCKER / CHỜ USER

⛔ **Chưa commit** — **122+ đường**, hỗn hợp 2 phiên.
⛔ **Cần user quyết — KHẨN:**
1. ⭐⭐ **Tài khoản test có bị mất quyền `manual_override` không?** — ⛔ tôi **không chứng minh được**; cần user xác nhận **bộ quyền đích** hoặc **có backup MySQL ngoài repo không**.
2. ⭐⭐ **Hoặc**: kỳ vọng của `giai-doan-09` / `go-live-chuoi-kho` có **sai thiết kế** không? (`e2e.to` = Phòng Dự án, `central_warehouse.can_use=0` **theo mẫu**)
3. ⭐ **Cho phép triển khai 5 bản vá Java** (1 lệnh): `node tools/deploy-java-backend.mjs --dong-y-trien-khai`.
4. ⭐ **Xác nhận 4 bản vá CSS bằng mắt**.
5. `stack-form` · **commit theo nhóm** · BUG-20261009 · «ai nhận hàng ở kho đích» · dọn Transit · CRUD 6 thực thể · khoá ngoại.
