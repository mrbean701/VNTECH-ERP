# KIỂM KÊ DỮ LIỆU KIỂM THỬ — đối chiếu với yêu cầu đã giao

| | |
|---|---|
| **Ngày đo** | 06/10/2026 · ⭐ **phép đo CHỈ ĐỌC** (⛔ không ghi gì vào CSDL) |
| **Nguồn** | CSDL thật `vntech_erp` (MySQL) — ⛔ không suy đoán, ⛔ không dùng số cũ |
| **Mục đích** | ⭐ Chuẩn bị cho việc **«dọn dữ liệu rác rồi nhập lại dữ liệu để tôi test»** — ⚠️ **đang tạm dừng chờ bạn cho phép**, tài liệu này chỉ **kiểm kê** |
| **Kết luận ngắn** | ⭐ **Phần lớn dữ liệu kiểm thử ĐÃ CÓ SẴN và đầy đủ.** ⚠️ **Chỉ thiếu 2 thứ** và **cần dọn 3 nhóm rác**. |

---

## ① ⭐ ĐỐI CHIẾU TỪNG YÊU CẦU BẠN ĐÃ GIAO

| # | Yêu cầu | ⭐ Đo được | Kết luận |
|---|---|---|---|
| 1 | ADMIN tạo **tài khoản user – phòng ban** | **28 tài khoản** (14 là `e2e.*`) · **11 phòng ban** · **17 vai trò đang bật** | ✅ **CÓ SẴN** |
| 2 | **Phân quyền cho từng user** | **2.198** dòng quyền — trong đó **1.628 hợp lệ** ⚠️ và **570 mồ côi (25,9%)** | ⚠️ **CÓ, nhưng cần dọn** |
| 3 | **Tạo workflow** | **5 quy trình** · **14 bước** | ✅ **CÓ SẴN** |
| 4 | User **phòng hành chính thêm hồ sơ nhân sự** | **26 hồ sơ nhân sự** · **26 hợp đồng lao động** · **52 bản ghi bảo hiểm & chế độ** | ✅ **CÓ SẴN** |
| 5 | **Lập phiếu đề nghị mua hàng + phê duyệt các cấp** | **91 phiếu** — ⭐ **12 phiếu đã đi hết chuỗi** tới `completed` · 17 chờ lập PO · 14 đang chờ duyệt · 40 đã trả về người lập | ✅ **CÓ SẴN** |
| 6 | **Workflow xuất – nhập kho** | **36 phiếu nhập** · **32 phiếu xuất** · **6 phiếu chuyển kho** · **12 phiếu trả kho trung tâm** · **96 dòng sổ kho** | ✅ **CÓ SẴN** |
| 7 | **Workflow cấp phát – hoàn trả** | **9 phiếu hoàn trả** (⭐ **9/9 `received` — ⛔ KHÔNG kẹt**) · 14 dòng chi tiết · **264 dòng cấp phát mua sắm** | ✅ **CÓ SẴN · CHẠY SẠCH** |
| 8 | ⭐ **200 mã vật tư KÈM THEO TÊN PHỤ** | ⭐ **ĐÚNG 200 mã `E2E-*`** chia **9 nhóm hệ** (`TH` 30 · `ON` 25 · **`XM` 25** · `DD` 24 · `GO` 22 · `VP` 22 · `DC` 18 · `DM` 18 · `BH` 16) ⭐ **VÀ 200/200 mã ĐỀU CÓ TÊN PHỤ ⇒ PHỦ 100%** (tổng hệ thống: **237 vật tư** · **243 tên phụ**) | ✅ **ĐẦY ĐỦ** |
| 9 | **Nhà cung cấp và đối tác** | **7 nhà cung cấp** · **8 đối tác** | ✅ **CÓ SẴN** |
| 10 | **Test việc ĐỔI USER trong workflow** | ⭐ Biên chứng: chức năng duyệt `decide_approval` được gọi bởi **5 tài khoản khác nhau** | ✅ **ĐÃ THỰC HÀNH** |
| 11 | **Đầy đủ dữ liệu từ user đến TỔ ĐỘI** | **5 tổ đội** · **15 thành viên tổ đội** · **5 dự án** · **5 hợp đồng** · **12 kho** · **24 công việc** | ✅ **CÓ SẴN** |
| 12 | **Test chức năng báo lỗi – góp ý** | **16 báo lỗi** — ⭐ **13 đang mở** · 3 đã xử lý | ✅ **CÓ SẴN** |
| 13 | **Test thông báo web** | ⚠️ **1 cấu hình thông báo** · **12 thông báo công việc** | ⚠️ **CÒN MỎNG** |

---

## ② ⚠️ CÒN THIẾU — 2 THỨ

| # | Thiếu gì | ⭐ Số đo | Ảnh hưởng |
|---|---|---|---|
| **1** | ⚠️ **Luồng KIỂM KÊ chưa có dữ liệu** | **`stock_counts` = 0** | ⛔ **Không test được chức năng kiểm kê kho** ⇒ ⭐ cần tạo vài phiếu kiểm kê |
| **2** | ⚠️ **Cấu hình thông báo quá ít** | **`notification_configs` = 1** | ⚠️ **Không test được đầy đủ thông báo web** ⇒ ⭐ cần thêm cấu hình (kênh `web`, có thời gian hiệu lực) |

---

## ③ 🧹 CẦN DỌN — 3 NHÓM RÁC (đã đo, ⛔ chưa dọn)

| # | Rác | ⭐ Số đo | ⭐ Cách dọn (đã soạn) |
|---|---|---|---|
| **1** | **Hàng kẹt ở kho trung chuyển** | **12 đơn vị / 6 phiếu** — 5 phiếu `central_returns` (`KT-RET-PRJ-2026-0007/0008/0009/0010/0012`) + 1 lệnh `transfer_order` (`TRF-2026-00007`) | ⭐ **Nhận hàng qua API** (`receive_central_return` ×5 + `receive_transfer_order` ×1) ⇒ ⭐ **vừa dọn vừa KIỂM CHỨNG luôn bản vá `BUG-20261005-005`** |
| **2** | **Quyền mồ côi** | **570 dòng** (⭐ 25,9% bảng quyền) | ⭐ Xoá theo điều kiện «mồ côi» — ⭐ **an toàn tuyệt đối** vì điều kiện chính là **định nghĩa** mồ côi |
| **3** | **Đơn mua hàng chưa phát hành** | **4 PO** ở `pending_approval` | ⭐ **Phát hành qua `approve_po`** (⭐ lỗi F1 **đã vá** nên nay làm được) ⇒ ⚠️ **nếu không phát hành thì sau khi vá F2 các PO này ⛔ không nhận hàng được** |

---

## ④ ✅ DỮ LIỆU TỐT — DÙNG ĐỂ TEST NGAY

| Nhóm | ⭐ Trạng thái |
|---|---|
| **Cấp phát – hoàn trả** | ⭐ **9/9 phiếu `received`** — luồng **chạy sạch, ⛔ không kẹt** |
| **Báo lỗi – góp ý** | ⭐ **13 báo lỗi đang mở** ⇒ ⭐ dùng ngay để test «user báo lỗi thì tài khoản admin có xem được chi tiết không» |
| **Đổi người duyệt** | ⭐ **5 tài khoản** đã từng duyệt ở các bước khác nhau |
| **Vật tư** | ⭐ **200 mã + 200 tên phụ** phủ 100% ⇒ test nhập phiếu / tra cứu / chống trùng tên phụ |
| **Tài khoản** | ⭐ **14 tài khoản `e2e.*`** đủ vai trò: `e2e.cht` `e2e.chtsa` `e2e.tk` `e2e.khnv` `e2e.project` `e2e.to` `e2e.ksda` `e2e.thuky` `e2e.thukysa` `e2e.kh` `e2e.kt` `e2e.ns` `e2e.bgd` `e2e.diag` |

---

## ⑤ ⭐ ĐỀ XUẤT THỨ TỰ KHI BẠN CHO PHÉP LÀM TIẾP

1. ⭐ **Triển khai 9 bản vá** (⭐ dập **4 lỗi HTTP 500**) → **kiểm chứng end-to-end** ✓
2. ⭐ **Dọn nhóm rác ①** (nhận hàng 6 phiếu kẹt) — ⭐ **đồng thời kiểm chứng bản vá ②** ✓
3. ⭐ **Phát hành 4 PO** đang `pending_approval` (⭐ nhóm rác ③) ✓
4. ⭐ **Dọn 570 dòng quyền mồ côi** (⭐ nhóm rác ②) ✓
5. ⭐ **Bổ sung 2 thứ còn thiếu**: vài **phiếu kiểm kê** + vài **cấu hình thông báo web** ✓
6. ⭐ **Bàn giao để bạn test** — ⭐ **mọi thứ khác đã sẵn sàng** ✓

---

## ⑥ ⚠️ GHI CHÚ MINH BẠCH

- ⭐ **TÔI TỰ SỬA MỘT CÂU TÔI ĐÃ NÓI SAI Ở VÒNG 73**: tôi từng viết «**200 mã `E2E-XM-*`** là danh mục của người dùng» — ⚠️ **SAI**: **`E2E-XM` chỉ có 25 mã**; ⭐ **200 mã là TOÀN BỘ nhóm `E2E-*` chia 9 nhóm hệ**, trong đó `E2E-XM` là **một** nhóm ✓
- ⭐ **«Tên phụ» ⛔ KHÔNG nằm trong bảng `materials`** — ⭐ nó ở bảng riêng **`material_aliases`** (cột `alias_name`, kèm `normalized_name` **UNIQUE** để chống trùng) ✓
- ⚠️ **Chữ `?` khi xem bằng `mysql.exe` là LỖI HIỂN THỊ của console**, ⛔ **không phải dữ liệu hỏng** — ⭐ đã chứng minh: khi điền file Excel, tiếng Việt hiển thị **đúng hoàn toàn** ✓
- ⭐ **Mọi con số trong tài liệu này đều ĐO ĐƯỢC**, ⛔ không suy đoán, ⛔ không lấy từ tài liệu cũ ✓
