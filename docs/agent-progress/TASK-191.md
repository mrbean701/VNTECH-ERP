# TASK-191 — GO-LIVE ĐỢT 46: BỊT NỐT KHOẢNG TRỐNG BAO PHỦ — **3 action an toàn cuối cùng: 6/6 ĐẠT**

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Việc** | ⭐ Đóng khoảng trống bao phủ còn lại sau TASK-188 (**49 action chưa test ⇒ đã kiểm 30 ⇒ còn 19**) |
| **Kết quả 1** | ✅ **3 action AN TOÀN cuối cùng: 6/6 ĐẠT · EXIT=0 · hậu quả sạch** |
| **Kết quả 2** | ⭐ **16 action còn lại = ĐÚNG danh sách LOẠI TRỪ CÓ LÝ DO** ⇒ ⛔ **0 action vừa chưa test vừa test được** |
| **Kết quả 3** | ✅ **Đo lại bao phủ bằng khớp RANH GIỚI**: **204/220 = 93%** — và ⚠️ **nêu rõ giới hạn của phép đo** |
| **Tệp mới** | `tools/e2e/go-live-kiem-3-action-cuoi.mjs` |
| **Vân tay** | ⛔ **không đổi** |

---

## ① ✅ 3 ACTION AN TOÀN CUỐI CÙNG — **6/6 ĐẠT · EXIT=0**

Tiêu chí (như TASK-188): **payload RỖNG** và **ID BỊA** ⇒ ⛔ **không được 5xx** · ⛔ **không được đổi trạng thái**; ✅ 400 hoặc 200 (không tìm thấy ⇒ không làm gì) đều chấp nhận.

| Action | Payload RỖNG | ID BỊA |
|---|---|---|
| `mark_notification_read` | ✅ ĐẠT | ✅ ĐẠT |
| `mark_notification_snooze` | ✅ ĐẠT | ✅ ĐẠT |
| **`reverse_stock_movement`** | ✅ ĐẠT | ✅ ĐẠT |

```text
KET QUA BỊT KHOẢNG TRỐNG 3 ACTION AN TOÀN: dat 6/6 · that bai 0
EXIT=0
```
**KIỂM HẬU QUẢ 2 LỚP**: ⭐ trong bài — **đối chiếu mọi mảng bootstrap sau TỪNG action**, ⛔ không dòng ⛔ nào ✓ · ⭐ ngoài bài — `chup-so-dong.mjs` **131 bảng**: **chỉ `sessions` +1** (phiên của tôi) ✓

### ⭐ GHI NHẬN ĐÁNG CHÚ Ý: `reverse_stock_movement` **CÓ** KIỂM TRA THAM SỐ
⭐ Nó **⛔ KHÔNG trả 500** với payload rỗng/id bịa — ⭐ **trái hẳn với BUG-20261005-012 và -013** ✓
⇒ ⭐ Cho thấy **lỗi 500 ⛔ không phải vấn đề toàn hệ thống**, mà **tập trung ở một số action** ✓ — ⭐ và **cách tìm ra chúng (gọi action ⇒ soi 5xx) là đúng** ✓

---

## ② ✅ KHOẢNG TRỐNG ĐÃ ĐÓNG — **16 CÒN LẠI = ĐÚNG DANH SÁCH LOẠI TRỪ**

Đo lại bằng **khớp RANH GIỚI** (`"action"` chính xác, ⛔ không khớp chuỗi con):

| | |
|---|---|
| Action THẬT (259 `case` − 39 khoá lỗi MySQL) | **220** |
| ✅ có trong bài test (khớp **ranh giới**) | **204** |
| ⛔ **KHÔNG có** | **16** |

**16 action đó — ⭐ ĐÚNG danh sách loại trừ có lý do:**
`delete_unused_materials` · `factory_reset_execute` · `factory_reset_preview` · `rebuild_department_permissions` · `reorder_menu_layout` · `request_license_transfer` · `request_material_master_from_boq` · `reset_material_catalog_test` · `reset_user_password` · `retry_email` · `revoke_session` · `revoke_user_sessions` · `save_form_field_config` · `save_menu_group` · `save_notification_config` · `update_profile_signature`

| Nhóm | ⛔ Vì sao loại trừ |
|---|---|
| `factory_reset_*` · `reset_*` · `delete_unused_materials` | ⛔ **PHÁ HOẠI** — xoá/đặt lại dữ liệu hàng loạt |
| `rebuild_department_permissions` | ⛔ **đường đi của BUG-20261010** (viết lại quyền hàng loạt) |
| `revoke_session` · `revoke_user_sessions` | ⚠️ **đăng xuất người dùng** — ⭐ `revoke_user_sessions` đặc biệt nguy: id rỗng có thể **đăng xuất chính người gọi** |
| `save_form_field_config` · `save_menu_group` · `save_notification_config` | ⛔ **CẤU HÌNH** — payload rỗng có thể **xoá/ghi đè** |
| `update_profile_signature` | ⛔ **dữ liệu TỰ PHỤC VỤ của chính user** |
| `retry_email` | ⛔ **gửi email thật** |
| `reorder_menu_layout` | ⛔ **đổi bố cục menu cho MỌI người** |
| `request_*` | ⛔ **kích hoạt luồng nghiệp vụ** |

⇒ ⭐⭐ **KẾT LUẬN: ⛔ 0 action vừa «chưa test» vừa «test được an toàn trên hệ thật»** ✓

---

## ③ ✅ ĐO LẠI BAO PHỦ BẰNG KHỚP **RANH GIỚI** — VÀ ⚠️ **NÊU RÕ GIỚI HẠN**

| Phép đo | Kết quả |
|---|---|
| **CŨ** — khớp **chuỗi con** (`bai.Contains('"x"')`) | **204** ✅ |
| **MỚI** — khớp **ranh giới** (regex `"x"` chính xác) | **204** ✅ |
| **LỆCH** | ⭐ **0** ⇒ ⛔ **phép đo cũ ⛔ KHÔNG đếm nhầm** ✓ |

⇒ ⭐ **204/220 = 93%** ✓ — ⭐ và lo ngại của tôi (rằng `save_material` khớp nhầm trong `save_material_norm`) **⛔ KHÔNG có cơ sở** ✓

### ⚠️⚠️ NHƯNG PHẢI NÓI RÕ GIỚI HẠN CỦA CON SỐ NÀY
> ⛔ **«Tên action CÓ XUẤT HIỆN trong tệp test» ⛔ KHÔNG đồng nghĩa «đã được GỌI với dữ liệu CÓ NGHĨA».**

⇒ ⭐ **204/220 là CẬN TRÊN**, ⛔ không phải «đã kiểm hết 93% chức năng» ✓
⭐ **Phép đo MẠNH HƠN** — mà tôi thực sự làm trong phiên này — là: **gọi action + kiểm kết quả đúng + kiểm hậu quả** ✓
⭐ **Và chính phép đo mạnh hơn đó mới tìm ra 2 lỗi 500** (BUG-012 · BUG-013) — ⭐ **trong khi «tên có xuất hiện» thì ⛔ không** ✓

---

## ④ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| 3 action an toàn cuối cùng | ✅ **6/6 ĐẠT · EXIT=0** |
| Kiểm hậu quả | ✅ **2 lớp sạch** (chỉ `sessions` +1) |
| Khoảng trống bao phủ | ✅ **ĐÃ ĐÓNG** — 16 còn lại = **đúng danh sách loại trừ có lý do** |
| Bao phủ (khớp ranh giới) | **204/220 = 93%** — ⚠️ **là CẬN TRÊN**, ⛔ không phải «đã kiểm 93% chức năng» |
| Lỗi 500 tìm thêm | **0** (`reverse_stock_movement` **có** kiểm tham số ✓) |
| Bug sản phẩm mới | **0** |
| Vân tay | **ĐẠT** `VNTECH-FP-27251D9B7F076176` · 713 tệp — ⛔ không đổi |
| `:18081` | ⛔ vẫn **JAR cũ** ⇒ **6 bản vá chưa lên sóng** |
| Tệp tạm · `.snapshot` | **0 · 0** |

---

## ⑤ BÀI HỌC

1. ⭐⭐ **PHÉP ĐO MẠNH HƠN MỚI TÌM RA LỖI — «tên có xuất hiện» thì ⛔ không.** ⭐ **204/220 tên action có trong tệp test** ⛔ **mà 2 lỗi 500 vẫn nằm đó** ⇒ ⭐ **chỉ khi GỌI THẬT + kiểm kết quả + kiểm hậu quả mới lộ ra** ✓
2. ⭐⭐ **KIỂM TRA PHÉP ĐO CỦA CHÍNH MÌNH — kể cả khi nghi ngờ ⛔ không có cơ sở.** Tôi lo «khớp chuỗi con đếm nhầm» ⇒ **đo lại bằng khớp ranh giới** ⇒ ⭐ **lệch = 0** ⇒ ⭐ **lo ngại bị bác bỏ bằng SỐ ĐO, ⛔ không bằng cảm giác** ✓ (⭐ **và nếu lệch thật thì tôi đã phát hiện một lỗi đo** ✓)
3. ⭐⭐ **NÊU RÕ GIỚI HẠN CỦA CON SỐ MÌNH BÁO CÁO.** «93%» **nghe rất tốt** nhưng ⛔ **nghĩa hẹp hơn nhiều** ⇒ ⭐ **nếu ⛔ không nói rõ, người đọc sẽ tin rằng 93% chức năng đã được kiểm** ✓
4. ⭐ **MỘT LỖI 500 ⛔ KHÔNG CÓ NGHĨA CẢ HỆ THỐNG LỖI.** `reverse_stock_movement` **có** kiểm tham số ⇒ ⭐ **lỗi tập trung ở một số action**, ⛔ không phải toàn hệ thống ✓
5. ⭐ **LOẠI TRỪ CÓ LÝ DO LÀ MỘT PHẦN CỦA BAO PHỦ, ⛔ KHÔNG PHẢI «BỎ SÓT».** ⭐ **16/16 đều có lý do ghi rõ từng nhóm** ⇒ ⭐ **phiên sau ⛔ không phải đoán vì sao chúng chưa test** ✓

---

## ⑥ BLOCKER / CHỜ USER

⛔ **Chưa commit** — **140 đường**, hỗn hợp 2 phiên.
⛔ **Cần user quyết:**
1. ⭐⭐⭐ **TRIỂN KHAI** (1 lệnh): `node tools/deploy-java-backend.mjs --dong-y-trien-khai` ⇒ **6 bản vá** — ⭐ sau đó tôi chạy lại E2E để **`VERIFY` end-to-end BUG-20261005-012** (hiện `FIXED`, ⛔ chưa `VERIFIED` trọn vẹn).
2. ⭐⭐ **BUG-20261005-013** — **A** tạo migration hay **B** bỏ `mergedFrom`?
3. ⭐ **Xác nhận 5 bản vá CSS bằng mắt.**
4. ⭐⭐ **Cho phép 1 phép thử GHI** để chốt cơ chế quyền.
5. ⭐ **16 action loại trừ** — có cách test an toàn không (VD **môi trường riêng** / **DB tạm**)?
6. **Commit theo NHÓM hay gộp?** · **BUG-20261009** · **«ai nhận hàng ở kho đích»** · **dọn Transit** · **khoá ngoại**.
