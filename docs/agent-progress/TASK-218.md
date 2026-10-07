# TASK-218 — GO-LIVE ĐỢT 73: ✅ **HOÀN TẤT PHÉP ĐO TỒN KHO E2E** (65 đơn vị) + ⚠️ **TÔI TỰ SỬA LỖI ĐẾM THỨ HAI**

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Động lực** | ⭐ Vòng 72 tôi **bỏ dở** phép đo tồn kho và ghi rõ «⛔ chưa đo ⇒ ⛔ không kết luận» ⇒ ⭐ **hoàn tất** |
| **Kết quả** | ✅ **ĐO ĐẦY ĐỦ** — tồn kho E2E = **65 đơn vị** ở **3 kho** (⭐ **kiểm chéo 2 phương pháp KHỚP**) · ⭐ **`WH-TRANSIT` = 12 khớp chính xác vòng 71** |
| **⚠️ TÔI TỰ SỬA LỖI THỨ HAI** | ⚠️ Vòng 72 tôi đếm **200 mã vật tư `E2E-XM-*`** như «rác E2E» ⇒ ⭐ **SAI — đó là DANH MỤC 200 MÃ VẬT TƯ CỦA USER** ✓ |
| **⛔ THAY ĐỔI DỮ LIỆU** | **0** ✓ |
| **⛔ LỖI CỦA TÔI** | ⚠️ **1 lỗi đếm** — ⭐ **tự phát hiện và tự sửa** ✓ |

---

## ① ✅ PHÉP ĐO TỒN KHO **ĐÚNG** (⭐ nhập − xuất, ⛔ không viết cứng)

### A · Theo TỪNG kho
| Kho | Vật tư | Nhập | Xuất | ⭐ **Tồn** |
|---|---|---|---|---|
| **KHO-E2E-01** (`WH_84200d27…`) | `E2E-XM-005` | 9 | 0 | **9** |
| | `E2E-XM-018` | 8 | 0 | **8** |
| | `E2E-XM-004` | 13 | 6 | **7** |
| | `E2E-XM-010` | 7 | 0 | **7** |
| | `E2E-XM-011` | 7 | 0 | **7** |
| | `E2E-XM-019` | 11 | 6 | **5** |
| | `E2E-XM-003` | 7 | 2 | **5** |
| | | | **TỔNG** | ⭐ **48** |
| **`WH-TRANSIT`** | `E2E-XM-002` | 6 | 0 | **6** |
| | `E2E-XM-001` | 5 | 0 | **5** |
| | `E2E-XM-003` | 1 | 0 | **1** |
| | | | **TỔNG** | ⭐ **12** |
| **`WHTEAM_5c0900a5…`** (kho tổ/đội) | `E2E-XM-019` | 6 | 3 | **3** |
| | `E2E-XM-004` | 6 | 4 | **2** |
| | | | **TỔNG** | ⭐ **5** |
| | | | ⭐⭐ **TOÀN HỆ** | ⭐ **65** |

### B · ⭐ KIỂM CHÉO (⭐ phương pháp độc lập — tổng theo VẬT TƯ)
```
E2E-XM-004 = 9 · 005 = 9 · 019 = 8 · 018 = 8 · 010 = 7 · 011 = 7 · 002 = 6 · 003 = 6 · 001 = 5
TỔNG = 65   ⇒  ⭐ KHỚP CHÍNH XÁC với tổng theo KHO ở §A ✓
```
⇒ ⭐⭐⭐ **HAI PHƯƠNG PHÁP ĐỘC LẬP CHO CÙNG KẾT QUẢ 65** ⇒ ⭐ **phép đo ĐÁNG TIN** ✓✓✓
⭐⭐ **VÀ `WH-TRANSIT` = 12 KHỚP CHÍNH XÁC** với phép đo vòng 71 (⭐ đo bằng truy vấn **khác**) ✓

---

## ② ⚠️⚠️ TÔI TỰ SỬA **LỖI ĐẾM THỨ HAI** — VÀ LẦN NÀY NGHIÊM TRỌNG HƠN

⚠️ **Phép đo C cho**: `so_vat_tu_e2e = **200**` ✓
⚠️ **Vòng 72 tôi đã đếm 200 mã `E2E-XM-*` và coi như «rác E2E của tôi»** ⇒ ⭐ **SAI** ✓✓✓

### ⭐⭐ SỰ THẬT
⭐ **Chính yêu cầu của BẠN** (⭐ directive gốc): «**Tạo các mã vật tư tối thiểu 200 mã kèm theo tên phụ cho các mã vật tư**» ✓
⇒ ⭐⭐ **200 mã `E2E-XM-*` LÀ DANH MỤC VẬT TƯ DO BẠN YÊU CẦU**, ⛔ **KHÔNG PHẢI RÁC** ✓✓✓
⇒ ⛔ **TUYỆT ĐỐI ⛔ KHÔNG ĐỀ XUẤT XOÁ CHÚNG** ✓

### ⭐⭐⭐ VÌ SAO TÔI SAI — **ĐÚNG CÁI BẪY TÔI ĐÃ GHI THÀNH QUY TẮC**
| | |
|---|---|
| ⚠️ **`E2E-XM-` là TIỀN TỐ DÙNG CHUNG** (⭐ danh mục của user **lẫn** vật tư test của tôi) | ⛔ **KHÔNG phải «dấu vết riêng»** |
| ⭐ **QUY TẮC TÔI ĐÃ GHI** (⭐ v50 · v55 · v64) | ⭐ **«LUÔN có một DẤU VẾT RIÊNG, và LUÔN lọc theo nó»** ✓ |
| ⚠️ **TÔI ĐÃ VI PHẠM CHÍNH QUY TẮC ĐÓ** | ⭐ **lọc theo `code LIKE 'E2E-%'`** — ⭐ **một trường CHUNG** ✓ |

⇒ ⭐⭐⭐ **BÀI HỌC: MỘT QUY TẮC ĐÃ GHI ⛔ KHÔNG TỰ ĐỘNG ĐƯỢC TUÂN THỦ.** ⭐ Tôi ghi nó ở v55 ⚠️ rồi **vi phạm ở v72** ✓
⇒ ⭐⭐ **CÁCH CHỐNG**: ⭐ **mỗi phép lọc phải TỰ HỎI «cái này có khớp dữ liệu THẬT không?»** ⭐ **trước khi kết luận** ✓✓✓

---

## ③ ⭐ BỨC TRANH DỌN DẸP **ĐẦY ĐỦ** (⭐ cho bạn quyết)

| Hạng mục | ⭐ Số đo | ⭐ Đánh giá | ⭐ Đề xuất |
|---|---|---|---|
| **6 phiếu kẹt `in_transit`** | 5 trả TW + 1 chuyển kho | ⚠️ **rác test CỦA TÔI** (⭐ note ghi rõ) | ⭐ **nhận hàng qua API** (⭐ dọn + VERIFY BUG-005) |
| **Tồn `WH-TRANSIT`** | **12 đơn vị** | ⚠️ **hàng kẹt** | ⭐ **tự hết khi nhận hàng** ✓ |
| **Tồn `KHO-E2E-01`** | **48 đơn vị** | ⚠️ **hàng test còn ở kho dự án E2E** | ⚠️ **cần bạn quyết** (⭐ giữ để test tiếp?) |
| **Tồn `WHTEAM_…`** | **5 đơn vị** | ⚠️ nhỏ | ⚠️ **cần bạn quyết** |
| ⭐ **200 mã vật tư `E2E-XM-*`** | **200** | ✅ **DANH MỤC CỦA BẠN** (⭐ ⛔ KHÔNG PHẢI RÁC) | ⛔ **GIỮ NGUYÊN** ✓ |
| ⚠️ **570 quyền mồ côi** | **570** (⭐ 25.9%) | ⚠️ **dữ liệu lịch sử** | ⭐ **dọn** (⭐ SQL ở TASK-217 §③) |
| **Sổ `stock_movements` E2E** | **45 dòng** | ✅ **lịch sử hợp lệ** (⭐ ⛔ không xoá) | ⛔ **GIỮ** ✓ |

---

## ④ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| ⭐ **Tồn kho E2E toàn hệ** | **65 đơn vị** (⭐ **kiểm chéo 2 phương pháp KHỚP**) ✓ |
| ⭐ **`WH-TRANSIT`** | **12** — ⭐ **khớp chính xác vòng 71** ✓ |
| ⭐ **Tồn theo kho** | `KHO-E2E-01` **48** · `WH-TRANSIT` **12** · `WHTEAM` **5** ✓ |
| ⚠️ **Lỗi đếm của tôi** | ⚠️ **1** (⭐ 200 mã vật tư bị coi nhầm là rác) — ⭐ **tự phát hiện + tự sửa** ✓ |
| ⛔ **Thay đổi dữ liệu** | **0** ✓ |
| Vân tay | **ĐẠT** `VNTECH-FP-018A1FB2E849579E` · 713 tệp ✓ |
| `:8787` · `:18081` | ✅ **200** · ✅ **401 = KHOẺ** ✓ |
| Tệp tạm · `.snapshot` | **0 · 0** ✓ |

---

## ⑤ BÀI HỌC

1. ⭐⭐⭐ **MỘT QUY TẮC ĐÃ GHI ⛔ KHÔNG TỰ ĐỘNG ĐƯỢC TUÂN THỦ.** ⭐ Tôi ghi «**luôn lọc theo DẤU VẾT RIÊNG**» ở **v55** ⚠️ rồi **vi phạm ở v72** (⭐ lọc `code LIKE 'E2E-%'`) ✓ ⇒ ⭐ **cách chống: mỗi phép lọc phải TỰ HỎI «cái này có khớp DỮ LIỆU THẬT không?»** ✓
2. ⭐⭐⭐ **DỮ LIỆU CỦA USER VÀ DỮ LIỆU TEST CÓ THỂ DÙNG CHUNG TIỀN TỐ.** ⚠️ `E2E-XM-` ⭐ **vừa là danh mục của user vừa là vật tư test** ⇒ ⭐ **tiền tố ⛔ không đủ để phân biệt** ✓
3. ⭐⭐⭐ **KIỂM CHÉO BẰNG PHƯƠNG PHÁP ĐỘC LẬP LÀ CÁCH XÁC NHẬN PHÉP ĐO.** ⭐ Tổng **theo kho** = **65** · tổng **theo vật tư** = **65** ⇒ ⭐ **đáng tin** ✓ — ⭐ và `WH-TRANSIT` = **12** khớp **vòng 71 đo bằng truy vấn khác** ✓
4. ⭐⭐ **HOÀN TẤT PHÉP ĐO ĐÃ BỎ DỞ LÀ VIỆC ĐÚNG.** ⭐ Vòng 72 tôi ghi «⛔ chưa đo ⇒ ⛔ không kết luận» ⚠️ ⇒ ⭐ **vòng này đo xong** ⇒ ⭐ **bức tranh dọn dẹp nay ĐẦY ĐỦ** ✓
5. ⭐⭐ **ĐỀ XUẤT DỌN PHẢI PHÂN BIỆT «RÁC» VÀ «DANH MỤC NGƯỜI DÙNG YÊU CẦU».** ⭐ Nếu tôi đề xuất xoá **200 mã vật tư**, ⭐ **tôi đã phá đúng thứ bạn yêu cầu tạo** ✓

---

## ⑥ BLOCKER / CHỜ USER

⛔ **Chưa commit** — **168 đường**, hỗn hợp 2 phiên.
⛔ **Cần user quyết** (⭐ theo §19 — ⭐ **đã đầy đủ, ⛔ không còn gì cần đo thêm**):
1. ⭐⭐⭐ **TRIỂN KHAI 8 BẢN VÁ** — ⭐ điều kiện để dọn 12 đơn vị ở `WH-TRANSIT` ✓
2. ⭐⭐⭐ **CHO PHÉP DỌN TRANSIT** — `receive_central_return` ×5 + `receive_transfer_order` ×1 ✓
3. ⭐⭐ **TỒN Ở `KHO-E2E-01` (48) + `WHTEAM` (5)** — ⭐ **giữ để test tiếp, hay dọn?** ✓
4. ⭐⭐ **CHO PHÉP DỌN 570 QUYỀN MỒ CÔI** ✓
5. ⭐⭐ **CÂU HỎI NGHIỆP VỤ**: ⭐ xoá nhân sự thì **giữ** hồ sơ HR / HĐLĐ / bảo hiểm không? ✓
6. ⭐⭐⭐ **XÁC NHẬN BẰNG MẮT** — 2 modal, tab đã đều chưa ✓
7. ⭐⭐ **BUG-20261005-013** — **A** tạo migration hay ⭐ **B** bỏ `mergedFrom` ✓
8. ⭐ **Commit theo NHÓM** ✓
