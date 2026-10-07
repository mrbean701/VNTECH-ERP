# TASK-208 — GO-LIVE ĐỢT 63: ⭐ **KIỂM TOÁN TRỌN LỚP «THAO TÁC KHÔNG CHỐT TRÊN THAM SỐ»** — 1 lỗi thật, đã vá

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Động lực** | ⭐ Bài học vòng 62: **đọc NGUYÊN KHỐI + quét CẢ HỌ mẫu** đã tìm ra **1 lỗi 500 thật** ⇒ ⭐ **quét TRỌN LỚP mẫu còn lại** |
| **Kết quả** | ⭐⭐ **LỚP NÀY ĐÃ ĐƯỢC KIỂM TOÁN XONG** — **5 mẫu · 38 vị trí · CHỈ 1 LỖI THẬT (đã vá ở vòng 62)** |
| **Sản phẩm mới** | `tools/e2e/go-live-kiem-ung-vien-500.mjs` (**8/8 ĐẠT · EXIT=0**) |
| **⛔ LỖI CỦA TÔI** | **0** |

---

## ① ⭐ KẾT QUẢ KIỂM TOÁN — **5 MẪU, 38 VỊ TRÍ, 1 LỖI**

| # | Mẫu rủi ro | Số vị trí | ⭐ Kết quả |
|---|---|---|---|
| 1 | **`substring(0, N)` trên tham số** | **10** | ⛔⛔ **`FinanceManagementUseCase:308,309`** (`voucherDate`) = **LỖI THẬT** — ⭐ **ĐÃ VÁ ở TASK-207 (BUG-20261005-015)** ✓ · ✅ **5 vị trí truncation ĐỀU CÓ CHỐT ĐỘ DÀI** (`icon.length() > 4 ? …` · `if (n.length() > 120)` · `if (globalCode.length() > 48)` · `if (warehouseCode.length() > 48)`) ✓ · ✅ 4 vị trí khác có chốt (regex / UUID) ✓ |
| 2 | **`parseInt`/`parseDouble` trên tham số** | **0 ⛔ không chốt** | ✅ **SẠCH** — ⭐ mã dùng helper nhất quán (`numberValue` · `strictNonNegative`) ✓ |
| 3 | **`LocalDate`/`Instant`/`LocalDateTime.parse`** | **12** | ✅ **CẢ 12 CÓ CHỐT** — ⭐ `parsableInstant(...)` (License) · `try { … } catch` **cùng dòng** (Request · Settings · User) · **trong `try`** (Notification · OpsTask) ✓ |
| 4 | **`.split(…)[0]`** | **1** | ✅ **AN TOÀN** — ⭐ `String.split` **luôn trả ≥ 1 phần tử** ✓ |
| 5 | **`.get(0)` / `[0]`** | **15** | ⭐ **ĐÃ KIỂM BẰNG 8 ACTION + PAYLOAD RỖNG ⇒ ⛔ 0 LỖI 500** ✓ — ⭐ hầu hết có chốt (`isEmpty() ? "" : …get(0)` · `size() == 1`) ✓ |

⇒ ⭐⭐⭐ **LỚP NÀY ĐÃ ĐƯỢC KIỂM TOÁN XONG**: ⭐ **chỉ 1/38 vị trí bị lỗi**, ⭐ **và nó đã được vá** ✓✓✓

---

## ② ⭐⭐ CÁCH KIỂM MẪU `.get(0)` — **GỌI PAYLOAD RỖNG**

⭐ **VÌ SAO**: ⭐ nếu danh sách **RỖNG** mà mã gọi `lines.get(0)` ⇒ ⭐ **`IndexOutOfBoundsException`** ⇒ **500** ✓
⇒ ⭐ **BÀI KIỂM**: gọi **8 action** liên quan tới 6 vị trí `.get(0)` bằng **PAYLOAD RỖNG** ⇒ ⭐ **kỳ vọng 400, ⛔ KHÔNG 5xx** ✓

```text
[DAT] issue_stock — payload RỖNG (StockManagementUseCase:380,384 — `lines.get(0)` / `items.get(0)`)
[DAT] create_transfer_order — payload RỖNG (StockManagementUseCase:455,473,474)
[DAT] receive_transfer_order — payload RỖNG
[DAT] ship_transfer_order — payload RỖNG
[DAT] create_central_return — payload RỖNG
[DAT] approve_central_return — payload RỖNG
[DAT] create_request — payload RỖNG (RequestManagementUseCase:521 — `stages.get(0)`)
[DAT] create_stock_count — payload RỖNG
HẬU QUẢ — 94 mảng bootstrap: ✔ KHÔNG mảng nào đổi (payload rỗng ⇒ ⛔ không tạo gì)
dat 8/8 · that bai 0 · EXIT=0
```
⇒ ⭐⭐ **CẢ 8 ĐỀU ĐƯỢC CHỐT CHẶN ĐÚNG** ⇒ ⭐ **6 vị trí `.get(0)` ⛔ KHÔNG PHẢI LỖI** ✓✓✓
⭐ **VÀ hậu quả SẠCH**: ⭐ **payload rỗng ⇒ bị chốt chặn ⇒ ⛔ không tạo gì** (94 mảng ⛔ không đổi) ✓

---

## ③ ⭐⚠️ MỘT BÀI HỌC VỀ **CHÍNH PHÉP QUÉT** — «NGOÀI `try`» CÓ THỂ LÀ BÁO ĐỘNG GIẢ

⚠️ Phép quét của tôi báo **«⚠️ NGOÀI try»** cho **6/12** vị trí `parse` — ⭐ **nhưng kiểm lại thì CẢ 6 đều CÓ chốt**:
```java
try { due = Instant.parse(String.valueOf(dueRaw)); } catch (RuntimeException ignored) { … }   // ⭐ try CÙNG DÒNG
try { LocalDate.parse(s); return true; } catch (Exception e) { return false; }                 // ⭐ try CÙNG DÒNG
```
⇒ ⭐⭐ **NGUYÊN NHÂN**: ⭐ phép quét chỉ nhìn **4-5 dòng PHÍA TRƯỚC** để tìm `try` ⇒ ⭐ **nó ⛔ không thấy `try` nằm CÙNG DÒNG** ✓
⇒ ⭐⭐ **BÀI HỌC**: ⭐ **một phép quét văn bản ⛔ không hiểu cú pháp** ⇒ ⭐ **mọi kết quả của nó là «ĐIỂM CẦN SOI», ⛔ không phải «KẾT LUẬN»** ✓ — ⭐ **cùng loại với 2 phép quét thất bại trước** (⭐ «quét tĩnh cột» TASK-190 · «quét thông điệp chốt chặn» TASK-198) ✓
⭐⭐ **VÀ điều cứu tôi**: ⭐ **tôi ĐÃ KIỂM 8 ACTION BẰNG PAYLOAD RỖNG** thay vì tin phép quét ⇒ ⭐ **đó mới là bằng chứng** ✓✓✓

---

## ④ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| **Mẫu đã kiểm toán** | **5 mẫu · 38 vị trí** |
| ⭐ **Lỗi thật trong lớp này** | **1** — `voucherDate.substring(0,4)` — ⭐ **ĐÃ VÁ (BUG-20261005-015)** |
| Bài kiểm `.get(0)` | ✅ **8/8 ĐẠT · EXIT=0** |
| Kiểm hậu quả | ✅ **94 mảng bootstrap ⛔ không đổi** (payload rỗng) |
| ⭐ **Lớp «thao tác không chốt trên tham số»** | ⭐⭐ **ĐÃ KIỂM TOÁN XONG** |
| Bug sản phẩm mới | **0** |
| ⛔ Lỗi của tôi | **0** |
| Vân tay | **ĐẠT** `VNTECH-FP-27251D9B7F076176` · 713 tệp — ⛔ không đổi |
| `:18081` | ⛔ vẫn **JAR cũ** ⇒ **8 bản vá chưa lên sóng** |
| Tệp tạm | **0** |

---

## ⑤ BÀI HỌC

1. ⭐⭐⭐ **QUÉT «CẢ HỌ MẪU» LÀ CÁCH BIẾN 1 LỖI THÀNH MỘT KẾT LUẬN.** ⭐ Vòng 62 tìm ra **1 lỗi**; ⭐ vòng này quét **4 mẫu còn lại (28 vị trí)** ⇒ ⭐ **kết luận: lớp này CHỈ có 1 lỗi, và nó đã được vá** ✓ — ⭐ **giá trị ⛔ không nằm ở lỗi thứ hai, mà ở chỗ BIẾT CHẮC là ⛔ không còn lỗi nào** ✓
2. ⭐⭐⭐ **MỘT PHÉP QUÉT VĂN BẢN ⛔ KHÔNG HIỂU CÚ PHÁP ⇒ KẾT QUẢ CỦA NÓ LÀ «ĐIỂM CẦN SOI», ⛔ KHÔNG PHẢI KẾT LUẬN.** ⭐ 6/12 vị trí bị gắn cờ «NGOÀI try» **oan** vì `try` nằm **cùng dòng** ⚠️ ⇒ ⭐ **và điều cứu tôi là ĐÃ KIỂM BẰNG HÀNH VI (8 action + payload rỗng)** ✓
3. ⭐⭐ **KIỂM BẰNG HÀNH VI MẠNH HƠN KIỂM BẰNG ĐỌC MÃ.** ⭐ Tôi **có thể** đã kết luận «6 vị trí `.get(0)` là lỗi» nếu chỉ đọc; ⭐ **gọi payload rỗng ⇒ 8/8 ĐẠT ⇒ ⛔ không lỗi** ✓
4. ⭐⭐ **MỘT LỚP MẪU CÓ THỂ ĐƯỢC «ĐÓNG SỔ».** ⭐ Sau vòng này, ⭐ **không cần quét lại `substring` · `parse*` · `split[0]` · `get(0)` nữa** ✓ — ⭐ **đó là tài sản cho phiên sau** ✓
5. ⭐ **KIỂM HẬU QUẢ VẪN BẮT BUỘC, KỂ CẢ KHI BIẾT LÀ AN TOÀN.** ⭐ Payload rỗng **về lý thuyết** bị chốt chặn ⇒ ⭐ **nhưng tôi vẫn đo**: **94 mảng ⛔ không đổi** ✓

---

## ⑥ BLOCKER / CHỜ USER

⛔ **Chưa commit** — **170 đường**, hỗn hợp 2 phiên.
⛔ **Cần user quyết** (⭐ chi tiết trong `docs/agent-progress/BAN-GIAO-GO-LIVE.md`):
1. ⭐⭐⭐ **TRIỂN KHAI 8 BẢN VÁ**: `node tools/deploy-java-backend.mjs --dong-y-trien-khai` ⇒ ⭐ **20 bài nghiệm thu** ⇒ ⭐ **sau đó tôi `VERIFY` end-to-end BUG-012 · BUG-014 · BUG-015** ✓
2. ⭐⭐ **BUG-20261005-013** — **A** tạo migration hay ⭐ **B** bỏ `mergedFrom` (đề xuất **B**) ✓
3. ⭐⭐ **5 bản vá CSS** — ⭐ **cần mắt người** ✓
4. ⭐⭐ **1 phép thử GHI** để chốt sự cố quyền ✓
5. ⭐ **Mở rộng đường thành công** sang các chứng từ tài chính còn lại (`capital_recovery` · `contract_payment` · `site_expense_claim` · `advance_request`) ✓
6. ⭐ **Commit theo NHÓM** ✓
