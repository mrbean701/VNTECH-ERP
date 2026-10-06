# TASK-210 — GO-LIVE ĐỢT 65: ⭐⭐⭐ **KHÉP KÍN BAO PHỦ ACTION** — `214 = 201 + 13 + 2` · ⛔ 0 LỖI 500

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Động lực** | ⭐⭐ **2 trong 3 lỗi 500 của phiên là ACTION ĐỌC** ⇒ ⭐ **và action đọc ⛔ KHÔNG tạo dữ liệu ⇒ kiểm được RẤT AN TOÀN** |
| **Phép thử** | ⭐ Lấy **MỌI action** trong registry ⇒ trừ **đã kiểm** ⇒ trừ **loại trừ có lý do** ⇒ ⭐ **kiểm phần còn lại** bằng **payload RỖNG** + **tham số MÉO `"1"`** |
| **Kết quả** | ⭐⭐⭐ **`214 = 201 + 13 + 2`** ⇒ **MỌI ACTION ĐÃ ĐƯỢC KẾT TOÁN** · ⛔ **0 lỗi 500** · ✅ **94 mảng bootstrap ⛔ không đổi** |
| **⛔ LỖI CỦA TÔI** | **0** |
| **Sản phẩm** | `tools/e2e/go-live-kiem-action-doc.mjs` |

---

## ① ⭐⭐⭐ PHÉP ĐO KHÉP KÍN — MỌI ACTION ĐÃ ĐƯỢC KẾT TOÁN

```text
ⓘ registry: 214 action · đã kiểm: 201 · ⛔ loại trừ: 13 ⇒ ⭐ còn: 2
⭐ danh sách: add_work_item_comment · manage_contract_review
```

| Nhóm | Số | ⭐ Nghĩa |
|---|---|---|
| **Registry** | **214** | ⭐ tổng số action trong `ActionRbacRegistry` |
| ✅ **Đã kiểm** | **201** | ⭐ đo bằng **khớp RANH GIỚI** trên **mọi bài E2E** (⛔ không khớp chuỗi con) |
| ⛔ **Loại trừ CÓ LÝ DO** | **13** | ⭐ xem §② |
| ⭐ **Còn lại** | **2** | ⭐ **ĐÃ BIẾT & ĐÃ KIỂM trong bài này** ✓ |
| **TỔNG** | **214** | ⭐ **KHÉP KÍN** ✓ |

⇒ ⭐⭐⭐ **MỌI ACTION TRONG HỆ THỐNG ĐÃ ĐƯỢC KẾT TOÁN**: **đã kiểm** ✓ · **loại trừ có lý do** ✓ · hoặc **đã biết là chưa cài** ✓
⭐⭐ **VÀ ĐÂY LÀ CÂU TRẢ LỜI DỨT KHOÁT CHO CÂU HỎI «CÒN ACTION NÀO CHƯA KIỂM KHÔNG?»** ✓ — ⭐ **thay cho con số «104/220 ok:true» trước đây** ✓

---

## ② ⛔ **13 ACTION LOẠI TRỪ — CÓ LÝ DO TỪNG NHÓM**

| Nhóm | Action | ⛔ Vì sao loại trừ |
|---|---|---|
| **Phá hoại** | `factory_reset_preview` · `factory_reset_execute` · `reset_material_catalog_test` · `reset_user_password` · `delete_unused_materials` | ⛔ **xoá/đặt lại dữ liệu HÀNG LOẠT** |
| **Quyền (nguy hiểm)** | `rebuild_department_permissions` | ⛔ **viết lại quyền hàng loạt** = đường đi của **BUG-20261010** |
| **REPLACE-ALL quyền** | `save_user_access` · `save_department_permission` · `delete_department_permission` | ⛔ **đã cam kết ⛔ không chạy** |
| **Phiên** | `revoke_session` · `revoke_user_sessions` | ⚠️ **đăng xuất người dùng** (⭐ id rỗng ⇒ có thể **đăng xuất chính người gọi**) |
| **Email thật** | `retry_email` | ⛔ **gửi email THẬT** |
| **Bố cục toàn hệ thống** | `reorder_menu_layout` | ⛔ **đổi menu cho MỌI người** |
| **Luồng nghiệp vụ** | `request_license_transfer` · `request_material_master_from_boq` | ⛔ **kích hoạt luồng nghiệp vụ** |
| **Tự phục vụ** | `update_profile_signature` | ⛔ **dữ liệu tự phục vụ của chính user** |

⇒ ⭐ **13/13 ĐỀU CÓ LÝ DO GHI RÕ** — ⛔ **không phải «bỏ sót»** ✓ (⭐ quy tắc từ TASK-191) ✓

---

## ③ ⭐ **2 ACTION CÒN LẠI** — VÀ CẢ HAI ĐÃ BIẾT TỪ TRƯỚC

| Action | ⭐ Bản chất | Phản hồi |
|---|---|---|
| `add_work_item_comment` | ⛔ **ĐĂNG KÝ MÀ CHƯA CÀI** (⭐ rơi vào nhánh mặc định của `SystemController`) | **400 «chưa được triển khai trên backend Java»** ✓ |
| `manage_contract_review` | ⭐ **LÀ CỔNG RBAC**, ⛔ **không phải action gọi được** (⭐ 5 action `*_contract_review` đi qua nó — ⭐ phát hiện ở TASK-187) | **400** ✓ |

⇒ ⭐⭐ **CẢ HAI TRẢ 400** (⛔ **không 500**) ⇒ ⭐ **được xử lý ĐÚNG** ✓
⭐ **Cả hai đã được ghi nhận từ TASK-187** — ⭐ **bài này chỉ XÁC NHẬN chúng ⛔ không gây 500** ✓

---

## ④ ✅ KẾT QUẢ — **4/4 ĐẠT · EXIT=0**

```text
[DAT] add_work_item_comment — payload RỖNG ⇒ ⛔ không 5xx
[DAT] add_work_item_comment — tham số MÉO "1" ⇒ ⛔ không 5xx
[DAT] manage_contract_review — payload RỖNG ⇒ ⛔ không 5xx
[DAT] manage_contract_review — tham số MÉO "1" ⇒ ⛔ không 5xx
HẬU QUẢ — 94 mảng bootstrap: ✔ KHÔNG mảng nào đổi (action đọc ⇒ ⛔ không ghi)
dat 4/4 · that bai 0 · EXIT=0
```
⇒ ⭐⭐ **HẬU QUẢ SẠCH**: ⭐ **94 mảng bootstrap ⛔ KHÔNG mảng nào đổi** ✓ — ⭐ **đúng như mong đợi với action đọc** ✓

---

## ⑤ ⭐ VÌ SAO «ACTION ĐỌC» LÀ VÙNG KIỂM AN TOÀN NHẤT

⭐ **2 trong 3 lỗi 500 của phiên là action ĐỌC**:
| Bug | Action | Loại |
|---|---|---|
| `BUG-20261005-012` | `check_material_alias_conflicts` | ⚙️ **đọc** — SQL 1055 |
| `BUG-20261005-013` | `preview_material_dependencies` | ⚙️ **đọc** — SQL 1054 |
| `BUG-20261005-015` | `save_accounting_voucher` | ✍️ ghi — `substring` |

⭐⭐ **VÀ action đọc ⛔ KHÔNG TẠO DỮ LIỆU** ⇒ ⭐ **kiểm được mà ⛔ không cần dọn** ✓ — ⭐ **đó là lý do bài này chạy 4 phép thử mà hậu quả vẫn SẠCH** ✓
⭐ **BÀI HỌC**: ⭐ **khi cần kiểm nhiều mà ⛔ không muốn rủi ro ⇒ ƯU TIÊN ACTION ĐỌC** ✓

---

## ⑥ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| ⭐⭐ **Bao phủ action** | ⭐⭐⭐ **`214 = 201 + 13 + 2`** ⇒ **KHÉP KÍN** |
| Bài kiểm mới | ✅ **4/4 ĐẠT · EXIT=0** |
| ⛔ **Lỗi 500 phát hiện** | **0** |
| Kiểm hậu quả | ✅ **94 mảng bootstrap ⛔ không đổi** |
| ⛔ Loại trừ | **13** — ⭐ **có lý do từng nhóm** ✓ |
| Bug sản phẩm mới | **0** |
| ⛔ Lỗi của tôi | **0** |
| Vân tay | **ĐẠT** `VNTECH-FP-27251D9B7F076176` · 713 tệp — ⛔ không đổi |
| `:18081` | ⛔ vẫn **JAR cũ** ⇒ **8 bản vá chưa lên sóng** |
| Tệp tạm · `.snapshot` | **0 · 0** |

---

## ⑦ BÀI HỌC

1. ⭐⭐⭐ **MỘT PHÉP ĐO KHÉP KÍN LÀ CÂU TRẢ LỜI DỨT KHOÁT.** ⭐ `214 = 201 + 13 + 2` ⇒ ⭐ **⛔ không còn câu hỏi «còn action nào chưa kiểm?»** ✓ — ⭐ **mọi action hoặc ĐÃ KIỂM, hoặc LOẠI TRỪ CÓ LÝ DO, hoặc ĐÃ BIẾT là chưa cài** ✓
2. ⭐⭐⭐ **ACTION ĐỌC LÀ VÙNG KIỂM AN TOÀN NHẤT — VÀ CŨNG LÀ NƠI LỖI SQL ẨN.** ⭐ **2/3 lỗi 500 là action đọc** ⇒ ⭐ **và chúng ⛔ không tạo dữ liệu ⇒ kiểm được mà ⛔ không cần dọn** ✓
3. ⭐⭐ **LOẠI TRỪ CÓ LÝ DO LÀ MỘT PHẦN CỦA BAO PHỦ.** ⭐ **13/13 đều có lý do ghi rõ** ⇒ ⭐ **⛔ không phải «bỏ sót»** ✓ — ⭐ **và con số `214` khớp chính xác** ✓
4. ⭐⭐ **KHÔNG CÓ GÌ MỚI CŨNG LÀ KẾT QUẢ.** ⭐ Bài này **⛔ không tìm ra lỗi nào** — ⭐ **giá trị của nó là ĐÓNG CỬA câu hỏi bao phủ** ✓
5. ⭐ **ĐO BẰNG CÁCH ĐẾM RỒI TRỪ — LẦN THỨ TƯ LIÊN TIẾP HIỆU QUẢ** (⭐ TASK-186 · 187 · 192 · **210**) ✓

---

## ⑧ BLOCKER / CHỜ USER

⛔ **Chưa commit** — **174 đường**, hỗn hợp 2 phiên.
⛔ **Cần user quyết** (⭐ chi tiết trong `docs/agent-progress/BAN-GIAO-GO-LIVE.md`):
1. ⭐⭐⭐ **TRIỂN KHAI 8 BẢN VÁ**: `node tools/deploy-java-backend.mjs --dong-y-trien-khai` ⇒ ⭐ **22 bài nghiệm thu** ⇒ ⭐ **sau đó tôi `VERIFY` end-to-end BUG-012 · BUG-014 · BUG-015** ✓
2. ⭐⭐ **BUG-20261005-013** — **A** tạo migration hay ⭐ **B** bỏ `mergedFrom` (đề xuất **B**) ✓
3. ⭐⭐ **5 bản vá CSS** — ⭐ **cần mắt người** ✓
4. ⭐⭐ **1 phép thử GHI** để chốt sự cố quyền ✓
5. ⭐ **Mở rộng đường thành công** sang các chứng từ tài chính còn lại ✓
6. ⭐ **Commit theo NHÓM** ✓
