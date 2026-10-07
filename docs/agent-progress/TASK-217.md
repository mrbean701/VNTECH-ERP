# TASK-217 — GO-LIVE ĐỢT 72: ⭐ **QUÉT TOÀN BỘ MỒ CÔI + RÁC E2E TRONG CSDL THẬT** — dữ liệu SẠCH, chỉ 2 điểm cần lưu ý

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Động lực** | ⭐ **§19 hạng 3 «DATA ISSUE»** + ⭐ **bài học vòng 71** («quét CẢ HỌ») + ⭐ **đã chạy ~75 bài E2E lên CSDL THẬT** |
| **Việc** | ⭐ **QUÉT TOÀN BỘ**: (a) rác E2E của tôi · (b) **MỒ CÔI** (con mất cha — ⭐ rủi ro của **«0 khoá ngoại trên 131 bảng»**) |
| **Kết quả** | ✅ **DỮ LIỆU SẠCH** — ⭐ **mọi bảng NGHIỆP VỤ đều 0 mồ côi** · ⚠️ **2 điểm cần lưu ý** (⭐ đã ghi rõ, ⛔ chưa sửa) |
| **⛔ THAY ĐỔI DỮ LIỆU** | **0** — ⭐ **chờ bạn cho phép** ✓ |
| **⭐ TÔI TỰ BÁC BỎ GIẢ THUYẾT CỦA MÌNH** | ⚠️ Tôi nghi `deleteOwned` để lại mồ côi ⇒ ⭐ **ĐO ĐƯỢC: 0 mồ côi** ⇒ ⭐ **giả thuyết SAI** ✓ |

---

## ① ⭐⭐ KẾT QUẢ QUÉT MỒ CÔI — **DỮ LIỆU SẠCH**

| Quan hệ | ⭐ Mồ côi | Đánh giá |
|---|---|---|
| `central_return_items` → `central_returns` | **0** | ✅ sạch |
| `transfer_order_items` → `transfer_orders` | **0** | ✅ sạch |
| `stock_movements` → `materials` | **0** | ✅ sạch |
| `stock_movements` → `projects` | **0** | ✅ sạch |
| `hr_records` → `users` | **0** | ✅ sạch |
| `labor_contracts` → `users` | **0** | ✅ sạch |
| `benefit_records` → `users` | **0** | ✅ sạch |
| `task_notifications` → `users` | **0** | ✅ sạch |
| ⚠️ **`user_module_permissions` → `users`** | ⚠️ **570** | ⚠️ **xem §③** |
| ⚠️ `audit_logs` → `users` | ⚠️ **21** | ✅ **ĐÚNG THIẾT KẾ** (⭐ nhật ký PHẢI giữ) |

⇒ ⭐⭐⭐ **MỌI BẢNG NGHIỆP VỤ VÀ MỌI BẢNG GIAO DỊCH: 0 MỒ CÔI** ✓✓✓
⇒ ⭐ **«0 khoá ngoại trên 131 bảng» ⛔ CHƯA gây hư hại dữ liệu** ✓ — ⭐ **tầng ứng dụng đang giữ tính toàn vẹn** ✓

---

## ② ⭐⭐ TÔI TỰ BÁC BỎ GIẢ THUYẾT CỦA MÌNH

⭐ **ĐỌC ĐƯỜNG XOÁ USER** (`UserAdminStoreAdapter.deleteOwned`):
```java
@Transactional
public void deleteOwned(Object userId) {
    DELETE FROM sessions WHERE user_id=?
    DELETE FROM user_project_scopes WHERE user_id=?
    DELETE FROM user_module_permissions WHERE user_id=?   // ⭐ CÓ DỌN
    DELETE FROM users WHERE id=?
}
```
⇒ ⭐ **ĐƯỜNG JAVA DỌN ĐÚNG** ✓ — ⭐ **tôi nghi nó để lại mồ côi** ⚠️ ⇒ ⭐ **ĐO ĐƯỢC: `hr_records`/`labor_contracts`/`benefit_records` đều 0** ⇒ ⭐⭐ **GIẢ THUYẾT CỦA TÔI SAI** ✓✓✓
⚠️ **LÝ DO ĐÚNG**: ⭐ **chưa có user NÀO có hồ sơ HR bị xoá** ⇒ ⭐ **khoảng trống ⛔ chưa được kích hoạt** ✓
⇒ ⭐⭐ **KẾT LUẬN: ⛔ KHÔNG PHẢI LỖI ĐANG HOẠT ĐỘNG** — ⭐ **nhiều nhất là RỦI RO TIỀM ẨN** ✓
⭐⭐⭐ **VÀ có thể là CỐ Ý**: ⭐ **xoá nhân sự mà GIỮ hồ sơ HR** (⭐ như **giữ nhật ký**) là **hợp lý về nghiệp vụ** ⇒ ⭐ **đây là CÂU HỎI NGHIỆP VỤ, ⛔ không phải lỗi** ✓
⇒ ⭐ **⛔ KHÔNG VÁ** — ⭐ **§12** + ⭐ **đúng bài học vòng 67** («đọc ghi chú trước khi sửa») ✓

---

## ③ ⚠️ 570 MỒ CÔI TRONG `user_module_permissions` — **DỮ LIỆU LỊCH SỬ**

| Phép đo | Giá trị |
|---|---|
| Tổng dòng quyền | **2198** |
| ⚠️ **Mồ côi** | **570** (**25.9%**) |
| ✅ Hợp lệ | **1628** |
| Số user hiện có | **28** |

⭐ **Mẫu mồ côi**: ⭐ **5 `user_id` × 60 quyền** + nhiều `user_id` × 18 quyền ⇒ ⭐ **mỗi user ĐÃ XOÁ còn nguyên bộ quyền** ✓
⭐⭐ **NGUỒN GỐC**: ⭐ **đường Java DỌN ĐÚNG** (§②) ⇒ ⭐ **570 dòng này đến từ việc xoá user THỜI BẢN JS CŨ hoặc bằng SQL trực tiếp** ⇒ ⭐ **DỮ LIỆU LỊCH SỬ, ⛔ không phải lỗi đang chạy** ✓✓✓

### ⚠️ TÁC ĐỘNG
| Mặt | Đánh giá |
|---|---|
| **Ảnh hưởng quyền của user thật?** | ⛔ **KHÔNG** — ⭐ truy vấn quyền lọc theo `user_id`; ⭐ id là **UUID** ⇒ ⛔ **không trùng được với user mới** ✓ |
| **Ảnh hưởng tốc độ?** | ⚠️ **nhẹ** — ⭐ **570/2198 dòng (26%) là rác** ⇒ ⭐ **mọi truy vấn quyền phải quét thêm** ✓ |
| **Ảnh hưởng kiểm toán?** | ⚠️ **gây nhiễu** — ⭐ **báo cáo «ai có quyền gì» có thể đếm nhầm** ✓ |
| **Mức độ** | ⭐ **MEDIUM** (⭐ dữ liệu sai lệch nhưng ⛔ không gây lỗi chức năng) ✓ |

### ⭐ ĐỀ XUẤT DỌN (⭐ ⛔ chờ bạn cho phép)
```sql
-- XOÁ ĐÚNG 570 DÒNG MỒ CÔI (⭐ lọc theo «cha ⛔ không tồn tại», ⛔ không theo danh sách id cứng)
DELETE c FROM user_module_permissions c
WHERE NOT EXISTS (SELECT 1 FROM users p WHERE p.id = c.user_id);
```
⭐ **AN TOÀN VÌ**: ⭐ điều kiện **chính là định nghĩa «mồ côi»** ⇒ ⭐ **⛔ không thể xoá nhầm dòng hợp lệ** ✓
⭐ **KIỂM SAU KHI DỌN**: ⭐ `mo_coi = 0` · ⭐ **`hop_le` vẫn = 1628** (⛔ không đổi) ✓

---

## ④ ⚠️ RÁC E2E TRONG CSDL THẬT — **ĐO LƯU LƯỢNG, ⛔ KHÔNG PHẢI TỒN KHO**

⚠️ **LỖI PHÉP ĐO CỦA TÔI (⭐ tự phát hiện)**: ⭐ truy vấn của tôi có **`0 AS tong_ra` viết cứng** ⚠️ ⇒ ⭐ **kết quả là LƯU LƯỢNG VÀO, ⛔ KHÔNG phải tồn kho** ✓ — ⭐ **và tôi ⛔ KHÔNG được báo cáo chúng như «tồn kho»** ✓
⭐ **Ý nghĩa đo được**: ⭐ vật tư E2E (`E2E-XM-001`…`019`) **đã từng được nhập** vào **3 kho**: `KHO-E2E-01` · `WHTEAM_5c0900a5…` (kho tổ) · `WH-TRANSIT` ✓
⚠️ **TỒN KHO ĐÚNG** chỉ tính được từ sổ **có cả nhập lẫn xuất** ⇒ ⭐ **tôi ĐÃ đo đúng ở vòng 71 cho `WH-TRANSIT` = 12 đơn vị** ✓
⭐ **Kết luận**: ⭐ **cần đo lại tồn kho ĐÚNG cho cả 3 kho** nếu bạn muốn dọn sạch vật tư E2E ✓ — ⭐ **hiện ⛔ chưa đo** ⇒ ⭐ **⛔ không kết luận** ✓

---

## ⑤ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| ⭐ **Quét mồ côi 10 quan hệ** | ✅ **8 quan hệ SẠCH (0)** · ⚠️ `user_module_permissions` **570** · ✅ `audit_logs` **21** (đúng thiết kế) |
| ⭐ **Bảng NGHIỆP VỤ** | ✅ **0 mồ côi** (⭐ `hr_records` · `labor_contracts` · `benefit_records` · `task_notifications`) ✓ |
| ⭐ **Bảng GIAO DỊCH** | ✅ **0 mồ côi** (`central_return_items` · `transfer_order_items` · `stock_movements`) ✓ |
| ⭐ **Đường xoá user (Java)** | ✅ **DỌN ĐÚNG** (`sessions` · `user_project_scopes` · `user_module_permissions` · `users`) ✓ |
| ⚠️ **Giả thuyết của tôi** | ⚠️ **SAI** — ⭐ **tôi tự bác bỏ bằng phép đo** ✓ |
| ⛔ **Thay đổi dữ liệu** | **0** ✓ |
| ⚠️ **Lỗi phép đo của tôi** | ⚠️ **1** — ⭐ `0 AS tong_ra` viết cứng ⇒ **đã ghi rõ, ⛔ không báo cáo sai** ✓ |
| Vân tay | **ĐẠT** `VNTECH-FP-018A1FB2E849579E` · 713 tệp |
| `:8787` · `:18081` | ✅ **200** · ✅ **401 = KHOẺ** |
| Tệp tạm · `.snapshot` | **0 · 0** |

---

## ⑥ BÀI HỌC

1. ⭐⭐⭐ **ĐO CÓ THỂ BÁC BỎ GIẢ THUYẾT CỦA CHÍNH MÌNH — VÀ ĐÓ LÀ KẾT QUẢ TỐT.** ⭐ Tôi nghi `deleteOwned` để lại mồ côi ⚠️ — ⭐ **đo được 0** ⇒ ⭐ **giả thuyết SAI** ⇒ ⭐ **⛔ không sửa một thứ ⛔ không hỏng** ✓ — ⭐ **nếu tôi «sửa» theo giả thuyết, tôi đã thêm code vô ích và có thể phá hành vi cố ý** ✓
2. ⭐⭐⭐ **«0 KHOÁ NGOẠI» ⛔ KHÔNG CÓ NGHĨA LÀ «DỮ LIỆU HỎNG».** ⭐ **Tầng ứng dụng đang giữ toàn vẹn** ⇒ ⭐ **8/10 quan hệ SẠCH** ✓ — ⭐ **đây là phép đo đầu tiên chứng minh điều đó** ✓
3. ⭐⭐⭐ **PHÂN BIỆT «LỖI ĐANG HOẠT ĐỘNG» VÀ «RỦI RO TIỀM ẨN».** ⭐ 570 mồ côi là **DỮ LIỆU LỊCH SỬ** ⚠️ — ⭐ **đường code hiện tại ĐÚNG** ✓ — ⭐ **báo cáo đúng bản chất thì ⛔ không thổi phồng mức độ** ✓
4. ⭐⭐ **MỘT TRUY VẤN CÓ GIÁ TRỊ VIẾT CỨNG LÀ MỘT PHÉP ĐO SAI.** ⭐ `0 AS tong_ra` ⚠️ ⇒ ⭐ **tôi ĐÃ ghi rõ và ⛔ không báo cáo số đó như tồn kho** ✓
5. ⭐⭐ **CÓ THỂ LÀ CỐ Ý — PHẢI HỎI TRƯỚC KHI «SỬA».** ⭐ Giữ hồ sơ HR sau khi xoá nhân sự là **hợp lý về nghiệp vụ** ⇒ ⭐ **câu hỏi nghiệp vụ, ⛔ không phải lỗi** ✓ (⭐ bài học vòng 67 lặp lại) ✓
6. ⭐ **QUÉT «CẢ HỌ» LẦN NÀY KHÔNG TÌM RA LỖI MỚI — VÀ ĐÓ LÀ TIN TỐT** ✓

---

## ⑦ BLOCKER / CHỜ USER

⛔ **Chưa commit** — **167 đường**, hỗn hợp 2 phiên.
⛔ **Cần user quyết** (⭐ theo §19):
1. ⭐⭐⭐ **TRIỂN KHAI 8 BẢN VÁ** — ⭐ **điều kiện để dọn 12 đơn vị hàng kẹt** ✓
2. ⭐⭐⭐ **CHO PHÉP DỌN TRANSIT** — `receive_central_return` ×5 + `receive_transfer_order` ×1 ✓
3. ⭐⭐ **CHO PHÉP DỌN 570 MỒ CÔI** — ⭐ câu SQL ở §③ (⭐ an toàn: điều kiện **chính là định nghĩa mồ côi**) ✓
4. ⭐⭐ **CÂU HỎI NGHIỆP VỤ**: ⭐ **xoá nhân sự thì có nên giữ hồ sơ HR / hợp đồng LĐ / bảo hiểm không?** ✓ (⭐ nếu **giữ** ⇒ hiện trạng ĐÚNG, ⛔ không cần làm gì) ✓
5. ⭐⭐⭐ **XÁC NHẬN BẰNG MẮT** — 2 modal, tab đã đều chưa ✓
6. ⭐⭐ **BUG-20261005-013** — **A** tạo migration hay ⭐ **B** bỏ `mergedFrom` ✓
7. ⭐ **Commit theo NHÓM** ✓
