# TASK-216 — GO-LIVE ĐỢT 71: ⭐ **ĐO CHÍNH XÁC HÀNG KẸT `WH-TRANSIT`** — 12 đơn vị · 6 phiếu · **toàn bộ là rác E2E của tôi**

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Động lực** | ⭐ **§19 xếp «DATA ISSUE» (hạng 3) TRÊN «UI polish» (hạng 8)** ⇒ ⭐ **5 vòng vừa rồi là UI (LOW)** ⇒ ⭐ **chuyển sang vấn đề DỮ LIỆU** |
| **Việc** | ⭐ **ĐO CHÍNH XÁC** hàng kẹt ở `WH-TRANSIT`: phiếu nào · vật tư nào · bao nhiêu · **của ai** |
| **Kết quả** | ⭐⭐ **ĐÃ ĐO ĐẦY ĐỦ** · ⭐ **XÁC NHẬN toàn bộ là RÁC E2E của tôi** (⛔ ⛔ không đụng vật tư thật) · ⭐ **ĐÃ XÁC ĐỊNH CÁCH DỌN ĐÚNG** |
| **⛔ THAY ĐỔI DỮ LIỆU** | **0** — ⭐ **⛔ không tự sửa dữ liệu thật khi chưa được phép** ✓ |
| **⛔ LỖI CỦA TÔI** | ⚠️ **1 số liệu tôi ghi SAI TRƯỚC ĐÂY** — ⭐ **nay đã đo lại và sửa** ✓ |

---

## ① ⭐ PHÉP ĐO ĐẦY ĐỦ

### A · 6 phiếu kẹt `in_transit`
| Loại | Số phiếu | Mã |
|---|---|---|
| `central_returns` | **5** | `KT-RET-PRJ-2026-0007` · `-0008` · `-0009` · `-0010` · `-0012` |
| `transfer_orders` | **1** | `TRF-2026-00007` |

⭐ **Tạo lúc**: **05/10 02:29 → 04:27** (⭐ **hôm nay**) ✓

### B · ⭐ **XÁC NHẬN LÀ RÁC E2E CỦA TÔI** (⭐ bằng chứng từ chính dữ liệu)
| Bằng chứng | Giá trị |
|---|---|
| **`note` của 5 phiếu trả** | ⭐ «**GO-LIVE** · trả vật tư dự (có tổn thất) \| đồng ý chuyển vật tư dự về Kho Tổng» ⇒ ⭐ **do script E2E của tôi** ✓ |
| **`note` của phiếu chuyển kho** | ⭐ «**Kiểm thử chuỗi STO 5 bước**» ⇒ ⭐ **do script E2E của tôi** ✓ |
| **Vật tư** | ⭐ **`E2E-XM-002`** (×4 phiếu) · **`E2E-XM-003`** (×1) · `E2E-XM-001` (trong sổ) ⇒ ⭐ **TOÀN vật tư TEST** ✓ |
| **Kho nguồn** | ⭐ **`WH_84200d27-0d30-4a73-9ebc-43800e741c2a`** = **KHO-E2E-01** ✓ |

⇒ ⭐⭐⭐ **KẾT LUẬN: 100% là rác kiểm thử của tôi** ⇒ ⛔ **KHÔNG có vật tư thật nào bị ảnh hưởng** ✓✓✓

### C · ⭐ **TỒN KHO TÍNH RA TẠI `WH-TRANSIT`** (⭐ từ sổ `stock_movements`)
```
E2E-XM-002  →  6
E2E-XM-001  →  5
E2E-XM-003  →  1
TỔNG        →  12 đơn vị
```
⚠️ **TÔI PHẢI TỰ SỬA SỐ LIỆU CŨ CỦA MÌNH**: ⭐ các vòng trước tôi ghi «**9 đơn vị**» ⚠️ — ⭐ **NAY ĐO ĐƯỢC LÀ 12** ✓ **(⭐ 9 là con số tôi suy ra, ⛔ không đo)** ✓

### D · ⭐ `stock_movements` — hàng ĐANG Ở ĐÂU
| `movement_type` | Số dòng | Từ → Đến | Thời điểm |
|---|---|---|---|
| **`CENTRAL_RETURN_SHIP`** | **6** | `KHO-E2E-01` → **`WH-TRANSIT`** | 05/10 02:29–04:27 |
| **`TRF_SHIP`** | **5** | `KHO-E2E-01` → **`WH-TRANSIT`** | 05/10 02:27 |

⇒ ⭐ **hàng đã RỜI kho nguồn và ĐANG nằm ở `WH-TRANSIT`** — ⭐ **chưa về Kho Tổng** ✓

---

## ② ⭐ NGUYÊN NHÂN — VÀ NÓ **CHÍNH LÀ `BUG-20261005-005`**

⭐ `BUG-20261005-005` (**HIGH**): «**trả hàng kho trung tâm KHÔNG ghi sổ kho**» ⇒ ⭐ **phía NHẬN chưa ghi sổ** ⇒ ⭐ **phiếu kẹt `in_transit`, hàng kẹt ở kho trung chuyển** ✓
⭐ **Trạng thái bản vá**: ✅ **`FIXED`** + qua hồi quy **156/156** ⚠️ **nhưng ⛔ CHƯA TRIỂN KHAI** ⇒ ⭐ **`:18081` vẫn là JAR 01/10** ⇒ ⭐ **lỗi vẫn đang xảy ra** ✓✓✓

---

## ③ ⭐⭐ CÁCH DỌN ĐÚNG — **VÀ NÓ VERIFY LUÔN BUG-005**

### ⭐ CÁCH ĐỀ XUẤT (⭐ ⛔ KHÔNG phải xoá bằng SQL)
```text
① TRIỂN KHAI 8 bản vá  (⭐ trong đó có BUG-20261005-005)
② Gọi `receive_central_return` cho 5 phiếu  KT-RET-PRJ-2026-0007/0008/0009/0010/0012
③ Gọi `receive_transfer_order` cho 1 phiếu  TRF-2026-00007
   ⇒ ⭐ hàng về Kho Tổng ĐÚNG NGHIỆP VỤ
   ⇒ ⭐ sổ `stock_movements` có dòng nhận ⇒ ⭐ TỒN KHO ở WH-TRANSIT về 0
   ⇒ ⭐⭐ VÀ `BUG-20261005-005` ĐƯỢC `VERIFIED` END-TO-END
```
⭐⭐ **VÌ SAO CÁCH NÀY TỐT HƠN XOÁ SQL**:
1. ⭐ **Đúng nghiệp vụ** — ⭐ **hàng thật sự đi về Kho Tổng**, ⛔ không phải biến mất ✓
2. ⭐⭐ **VERIFY luôn `BUG-005`** — ⭐ **cách duy nhất để chuyển nó từ `FIXED` → `VERIFIED`** ✓✓✓
3. ⭐ **⛔ không xoá lịch sử** — ⭐ **giữ sổ `stock_movements` toàn vẹn** ⇒ ⭐ **đúng tinh thần «chống mất lịch sử»** ✓
4. ⭐ **⛔ không cần SQL trực tiếp** trên CSDL thật ✓

### ⚠️ LƯU Ý KHI THỰC HIỆN
- ⚠️ `receive_transfer_order` **đòi `inventory.canApprove`** ⇒ ⭐ **cần tài khoản có quyền đó** (⭐ `e2e.tk` ⛔ không có ⇒ ⭐ **dùng `admin`**) ✓
- ⭐ **5 phiếu `central_returns`** — ⚠️ `counted_qty`/`accepted_qty` **đang = 0** ⇒ ⭐ **bước nhận có thể cần số đếm** ⇒ ⭐ **kiểm hợp đồng `receive_central_return` trước khi gọi** ✓
- ⛔ **TÔI ⛔ KHÔNG TỰ LÀM** — ⭐ **đây là thao tác GHI trên CSDL THẬT** ⇒ ⭐ **chờ bạn cho phép** ✓

---

## ④ ⚠️ TÔI TỰ SỬA SỐ LIỆU SAI CỦA MÌNH

| | ⭐ Số cũ tôi đã ghi | ⭐ SỐ ĐO ĐƯỢC |
|---|---|---|
| Hàng kẹt ở `WH-TRANSIT` | ⚠️ «**9 đơn vị**» | ⭐ **12 đơn vị** (`E2E-XM-002`=6 · `E2E-XM-001`=5 · `E2E-XM-003`=1) |
| Phiếu kẹt | ⚠️ «**4** central returns» | ⭐ **5 central returns + 1 transfer order = 6** |

⇒ ⭐⭐ **BÀI HỌC**: ⭐ **con số tôi ghi trước đây là SUY RA, ⛔ không đo** ⚠️ — ⭐ **nay ĐO và SỬA** ✓
⭐⭐ **ĐÚNG QUY TẮC TỰ ĐẶT**: «⛔ **never invent numbers** — every figure must be measured» ✓ — ⭐ **và khi phát hiện số cũ sai, PHẢI ghi rõ và sửa** ✓

---

## ⑤ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| ⭐ **Phiếu kẹt `in_transit`** | **6** (5 trả TW + 1 chuyển kho) |
| ⭐ **Hàng kẹt `WH-TRANSIT`** | **12 đơn vị** (⭐ **đo từ sổ `stock_movements`**) |
| ⭐ **Chủ sở hữu** | ⭐ **100% rác E2E của tôi** (⭐ note + vật tư `E2E-XM-*` + kho `KHO-E2E-01`) |
| ⛔ **Vật tư thật bị ảnh hưởng** | **0** ✓ |
| ⭐ **Nguyên nhân** | `BUG-20261005-005` — ⭐ **FIXED, ⛔ chưa triển khai** ✓ |
| ⭐ **Cách dọn** | ⭐ **triển khai → nhận hàng qua API** ⇒ **dọn sạch + VERIFY BUG-005** ✓ |
| ⛔ **Thay đổi dữ liệu** | **0** — ⭐ chờ bạn cho phép ✓ |
| ⛔ **Lỗi của tôi** | ⚠️ **1 số liệu cũ SAI** (⭐ «9» vs **12**) — ⭐ **đã đo lại và ghi rõ** ✓ |
| Vân tay | **ĐẠT** `VNTECH-FP-018A1FB2E849579E` · 713 tệp |
| `:8787` · `:18081` | ✅ **200** · ✅ **401 = KHOẺ** |
| Tệp tạm · `.snapshot` | **0 · 0** |

---

## ⑥ BÀI HỌC

1. ⭐⭐⭐ **§19 LÀ BẢN ĐỒ ƯU TIÊN — VÀ TÔI ĐÃ ĐI LỆCH.** ⭐ 5 vòng vừa rồi là **UI polish (hạng 7-8)** ⚠️ trong khi ⭐ **một vấn đề DỮ LIỆU (hạng 3) nằm đó** ✓ — ⭐ **số liệu kẹt có từ 02:29 hôm nay mà tôi chỉ ĐO BÂY GIỜ** ✓ ⇒ ⭐ **bài học: định kỳ ĐỌC LẠI §19 và tự hỏi «mình đang làm hạng mấy?»** ✓
2. ⭐⭐⭐ **ĐO TRƯỚC, KẾT LUẬN SAU — VÀ ĐO LẠI SỐ CŨ.** ⭐ Tôi từng ghi «**9 đơn vị**» ⚠️ — ⭐ **số ĐO ĐƯỢC là 12** ✓ ⇒ ⭐ **một con số ⛔ không đo là một con số ⛔ không đáng tin** ✓
3. ⭐⭐⭐ **XÁC ĐỊNH CHỦ SỞ HỮU TRƯỚC KHI DỌN.** ⭐ Tôi kiểm **`note` + mã vật tư + kho nguồn** ⇒ ⭐ **kết luận 100% là rác của tôi** ⇒ ⭐ **mới dám đề xuất dọn** ✓ — ⭐ **nếu ⛔ không kiểm, tôi có thể đã đề xuất xoá dữ liệu THẬT** ✓
4. ⭐⭐ **CHỌN CÁCH DỌN VỪA DỌN VỪA VERIFY.** ⭐ Thay vì xoá SQL (⭐ nhanh nhưng ⛔ không verify gì) ⭐ **chọn đường nghiệp vụ** ⇒ ⭐ **dọn sạch + chuyển `BUG-005` từ `FIXED` → `VERIFIED`** ✓
5. ⭐ **⛔ KHÔNG TỰ GHI VÀO CSDL THẬT.** ⭐ Tôi **đo, phân tích, đề xuất** ⚠️ **và DỪNG ở đó** ✓

---

## ⑦ BLOCKER / CHỜ USER

⛔ **Chưa commit** — **166 đường**, hỗn hợp 2 phiên.
⛔ **Cần user quyết**:
1. ⭐⭐⭐ **TRIỂN KHAI 8 BẢN VÁ** — ⭐ **nay có thêm lý do thứ hai**: ⭐ **nó là điều kiện để DỌN 12 đơn vị hàng kẹt** ✓
2. ⭐⭐⭐ **CHO PHÉP DỌN TRANSIT** — ⭐ **sau triển khai, cho tôi gọi `receive_central_return` ×5 + `receive_transfer_order` ×1** ✓ (⭐ **thao tác GHI trên CSDL THẬT**) ✓
3. ⭐⭐⭐ **XÁC NHẬN BẰNG MẮT** — 2 modal, tab đã đều chưa ✓
4. ⭐⭐ **BUG-20261005-013** — **A** tạo migration hay ⭐ **B** bỏ `mergedFrom` ✓
5. ⭐⭐ **1 phép thử GHI** để chốt sự cố quyền ✓
6. ⭐ **Commit theo NHÓM** ✓
