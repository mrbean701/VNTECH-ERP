# TASK-207 — GO-LIVE ĐỢT 62: 🐞 **LỖI 500 THẬT THỨ 3** — `save_accounting_voucher` + ⭐ **ĐÃ VÁ THEO MẪU NHÀ** + ⭐ **PHÂN TÍCH CẢ HỌ LỖI**

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Việc** | ⭐ Cặp `accounting_voucher` («tạo được mà ⛔ chưa từng xoá được») — ⭐ **và nó lộ ra một lỗi 500** |
| **🐞 BUG** | **BUG-20261005-015** — **MEDIUM** · `save_accounting_voucher` ⇒ **HTTP 500** với `voucherDate` ngắn |
| **Trạng thái** | ✅ **`FIXED`** + ✅ **VERIFIED (biên dịch + hồi quy 156/156)** · ⛔ **chưa VERIFIED end-to-end** (⭐ **500 VẪN CÒN trên `:18081`**) |
| **Bao phủ đường thành công** | **102 → 104** |
| **⭐ ĐIỂM ĐẶC BIỆT** | ⭐ **ĐỌC NGUYÊN KHỐI trả lãi lần thứ hai** + ⭐ **quét CẢ HỌ LỖI (10 vị trí, chỉ 1 bị lỗi)** |

---

## ① 🐞 BẰNG CHỨNG ĐO ĐƯỢC (⛔ không phải giả thuyết)

```text
① save_accounting_voucher({voucherDate:"1", voucherType:"E2E", totalAmount:0})
   ⇒ ⚠️⚠️ HTTP 500 «Internal Server Error»
```
⇒ ⭐ Phát hiện bằng **bài kiểm E2E** `tools/e2e/go-live-thanh-cong-chung-tu-kt.mjs` ✓
⭐ **VÀ 5 bước còn lại ĐỀU ĐẠT**: ② tạo thật · ③ so tập ID · ④ **chiều âm** (`voucherType` rỗng ⇒ 400) · ⑤ xoá thật · ⑥ xoá lần 2 ⇒ 400 ✓

---

## ② ⭐⭐⭐ NGUYÊN NHÂN GỐC — **ĐỌC TỪ NGUYÊN KHỐI**

⭐ **Bài học vòng 57 («đọc NGUYÊN KHỐI, ⛔ không lọc») TRẢ LÃI LẦN THỨ HAI** ✓
```java
if (voucherDate.isEmpty() || voucherType.isEmpty()) throw Api("Chứng từ kế toán cần ngày và loại chứng từ.");
// ⛔ chốt chỉ kiểm RỖNG — ⛔ KHÔNG kiểm ĐỘ DÀI/ĐỊNH DẠNG
long n = 1;
try { n = Long.parseLong(store.nextVoucherNo(voucherDate.substring(0, 4))); } catch (Exception ignored) { }  // ⭐ trong try
String voucherNo = "CT-" + voucherDate.substring(0, 4) + "-" + String.format("%04d", n);                    // ⚠️ NGOÀI try
```
⇒ ⭐ `voucherDate` **ngắn hơn 4 ký tự** (đo được: `"1"`) **qua được chốt** ⇒ ⭐ dòng cuối ném **`StringIndexOutOfBoundsException`** ⛔ **KHÔNG BẮT** (⭐ **vì nằm NGOÀI `try`**) ⇒ **500** ✓
⚠️ **CÁI BẪY TINH VI**: ⭐ **`try` bọc ĐÚNG dòng này mà ⛔ KHÔNG bọc dòng kia** ⇒ ⭐ **dòng đầu âm thầm bị nuốt, dòng sau nổ ra 500** ✓

---

## ③ ⭐⭐ PHÂN TÍCH **CẢ HỌ LỖI** — 10 VỊ TRÍ `substring(0,N)` TRÊN THAM SỐ

| # | Vị trí | Mẫu | ⚠️ |
|---|---|---|---|
| 1 | **`FinanceManagementUseCase:308,309`** | `voucherDate.substring(0,4)` | ⛔⛔ **LỖI (đã xác nhận 500)** |
| 2 | `ProductionManagementUseCase:399,400` | `workDate.substring(0,4)` | ✅ **AN TOÀN** — ⭐ **vì `saveConstructionDailyLog` CÓ chốt** `workDate.matches("\\d{4}-\\d{2}-\\d{2}")` |
| 3 | `RequestManagementUseCase:104` | `neededAt.matches("\\d{4}-.*") ? …substring(0,4)… : now()` | ✅ **AN TOÀN** (có regex) |
| 4 | `AdminSystemUseCase:159,214` | `icon.length() > 4 ? icon.substring(0,4) : icon` | ✅ **AN TOÀN** (có kiểm độ dài) |
| 5 | `ErrorReportUseCase:60` | `UUID.randomUUID().toString().substring(0,4)` | ✅ **AN TOÀN** (UUID luôn dài) |
| 6 | `FileUseCase:242` · `OpsTaskManagementUseCase:439,449` | `substring(0,120)` · `substring(0,48)` | ⚠️ **truncation cho giới hạn độ dài** — ⚠️ **chưa kiểm** |

⇒ ⭐⭐ **CHỈ 1/10 VỊ TRÍ BỊ LỖI** — ⭐ **và nó là chỗ DUY NHẤT thiếu chốt định dạng ngày** ✓✓✓
⭐⭐ **ĐIỀU QUAN TRỌNG NHẤT**: ⭐ **chốt đúng ĐÃ TỒN TẠI TRONG MÃ** (⭐ `saveConstructionDailyLog`) ⇒ ⭐ **cách vá là DÙNG LẠI MẪU NHÀ**, ⛔ không tự nghĩ ra ✓

---

## ④ ⭐⭐ VÌ SAO UI ⛔ KHÔNG THẤY — VÀ VÌ SAO VẪN PHẢI VÁ

⭐ **`app/**/DocumentsScreen.tsx`** dùng `<input name="voucherDate" **type="date"** required/>` ✓
⇒ ⭐ **TẦNG HTML LUÔN GỬI `YYYY-MM-DD`** ⇒ **Java giả định điều đó** ⚠️
⚠️ **NHƯNG API GỌI TRỰC TIẾP ĐƯỢC** (curl · client khác · UI tương lai) ⇒ ⭐ **backend PHẢI kiểm** ✓
⇒ ⭐ **ĐÚNG goal §3: «backend là lớp kiểm soát, ⛔ không chỉ ẩn nút ở UI»** ✓✓✓

---

## ⑤ 🔧 BẢN VÁ — **MẪU NHÀ**, ⛔ KHÔNG TỰ NGHĨ RA

```java
if (!voucherDate.matches("\\d{4}-\\d{2}-\\d{2}"))
    throw Api("Ngày chứng từ phải theo định dạng YYYY-MM-DD.");
```
⭐ **CHÍNH LÀ chốt mà `saveConstructionDailyLog` đã có** (⭐ đo ở vòng 60) ✓
⭐ **`SMALL SAFE FIX` §12**: **~4 dòng** · ⛔ **không workaround** · ⛔ **không bọc try** ✓
⭐ **AN TOÀN VỚI UI**: `type="date"` ⛔ **không bao giờ gửi giá trị khác `YYYY-MM-DD`** ⇒ ⛔ không làm hỏng gì ✓
⭐ **+ 20 dòng chú thích** ghi rõ: lỗi · bằng chứng · vì sao UI không thấy · vì sao vẫn phải vá · mẫu nhà nào ✓

### ✅ KIỂM CHỨNG
| Tầng | Kết quả |
|---|---|
| **Biên dịch** | ✅ **`BUILD SUCCESS`** |
| **Hồi quy `mvn -o test`** | ✅ **19+38+13+86 = 156 test · 0 fail · 0 error · EXIT=0** |
| ⛔ **End-to-end** | ⛔ **CHƯA** — ⭐ **500 VẪN CÒN trên `:18081`** cho tới khi triển khai ✓ |

---

## ⑥ ✅ KẾT QUẢ VÒNG — **5/6 ĐẠT** (1 phát hiện lỗi)

```text
[LOI] ① save với voucherDate="1" ⇒ 500 (🐞 LỖI THẬT — đã vá)
[DAT] ② save_accounting_voucher (TẠO THẬT — ngày hợp lệ)
[DAT] ③ ĐỌC LẠI — tìm id MỚI bằng SO TẬP ID
[DAT] ④ save với voucherType RỖNG ⇒ phải 400 (CHIỀU ÂM)
[DAT] ⑤ delete_accounting_voucher (XOÁ THẬT — DỌN SẠCH)
[DAT] ⑥ XOÁ LẦN 2 ⇒ phải 400 «Không tìm thấy chứng từ.»
HẬU QUẢ — 94 mảng bootstrap: ✔ KHÔNG mảng nào đổi
ⓘ «accountingVouchers»: 0 → 0
```
**MySQL**: ✅ `rac_cua_toi = 0` · ✅ `tong = 0` (⭐ **bảng vốn trống ⇒ phải về đúng 0**) ✓

---

## ⑦ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| 🐞 **BUG-20261005-015** | **MEDIUM** · ✅ **`FIXED`** + VERIFIED (hồi quy **156/156**) · ⛔ **chưa end-to-end** |
| Bao phủ **đường thành công** | **102 → 104** |
| ⭐ **Họ lỗi phân tích** | ⭐ **10 vị trí `substring(0,N)` — CHỈ 1 BỊ LỖI** |
| ⭐ Chốt chặn **CHIỀU ÂM** | ✅ `voucherType` rỗng ⇒ 400 |
| Kiểm hậu quả | ✅ **SẠCH** (94 mảng · `accountingVouchers` **0→0** · MySQL **0 rác**) |
| ⛔ Lỗi của tôi | **0** (⭐ bài kiểm chạy đúng ngay — ⭐ **nhờ đọc NGUYÊN KHỐI**) |
| Vân tay | **ĐẠT** `VNTECH-FP-27251D9B7F076176` · 713 tệp — ⛔ không đổi |
| `:18081` | ⛔ vẫn **JAR cũ** ⇒ ⭐ **nay 8 BẢN VÁ chưa lên sóng** |
| Tệp tạm | **0** |

---

## ⑧ BÀI HỌC

1. ⭐⭐⭐ **ĐỌC NGUYÊN KHỐI ĐÃ TRẢ LÃI LẦN THỨ HAI.** ⭐ Vòng 60 thấy chốt `workDate` (⇒ tránh bẫy ngày), ⭐ vòng này thấy **`substring` nằm NGOÀI `try`** ⇒ ⭐ **chính chỗ đó là nguyên nhân** ✓
2. ⭐⭐⭐ **KHI TÌM RA MỘT LỖI, PHẢI QUÉT **CẢ HỌ** LỖI CÙNG MẪU.** ⭐ **10 vị trí, chỉ 1 bị lỗi, 4 vị trí an toàn NHỜ CÓ CHỐT** ⇒ ⭐ **và chốt đúng ĐÃ TỒN TẠI trong mã** ⇒ ⭐ **cách vá là DÙNG LẠI MẪU NHÀ** ✓
3. ⭐⭐ **«UI ⛔ KHÔNG GỬI GIÁ TRỊ ĐÓ» ⛔ KHÔNG PHẢI LÝ DO ĐỂ ⛔ KHÔNG KIỂM Ở BACKEND** (⭐ goal §3) ✓
4. ⭐⭐ **`try` BỌC ĐÚNG DÒNG NÀY MÀ ⛔ KHÔNG BỌC DÒNG KIA LÀ MỘT CÁI BẪY TINH VI.** ⭐ Dòng đầu **âm thầm bị nuốt**, dòng sau **nổ ra 500** ✓
5. ⭐⭐ **KIỂM DỮ LIỆU ĐẦU VÀO LÀ VIỆC CỦA BACKEND, ⛔ KHÔNG PHẢI CỦA HTML.** ⭐ `type="date"` **giúp người dùng**, ⛔ **không bảo vệ API** ✓
6. ⭐ **BÀI KIỂM CHẠY ĐÚNG NGAY LẦN ĐẦU — 0 LỖI CỦA TÔI** (⭐ nhờ **đọc nguyên khối** trước khi viết payload) ✓

---

## ⑨ BLOCKER / CHỜ USER

⛔ **Chưa commit** — **169 đường**, hỗn hợp 2 phiên.
⛔ **Cần user quyết** (⭐ chi tiết trong `docs/agent-progress/BAN-GIAO-GO-LIVE.md`):
1. ⭐⭐⭐ **TRIỂN KHAI 8 BẢN VÁ**: `node tools/deploy-java-backend.mjs --dong-y-trien-khai` ⇒ ⭐ **sau đó tôi `VERIFY` end-to-end BUG-012 · BUG-014 · BUG-015** ✓ — ⭐ **cả 3 đang `FIXED` mà ⛔ chưa `VERIFIED`** ✓
2. ⭐⭐ **BUG-20261005-013** — **A** tạo migration hay ⭐ **B** bỏ `mergedFrom` (đề xuất **B**) ✓
3. ⭐⭐ **5 bản vá CSS** — ⭐ **cần mắt người** ✓
4. ⭐⭐ **1 phép thử GHI** để chốt sự cố quyền ✓
5. ⭐ **Kiểm nốt 3 vị trí truncation** (`FileUseCase:242` · `OpsTaskManagementUseCase:439,449`) ⚠️ — ⭐ tôi làm tiếp được ✓
6. ⭐ **Commit theo NHÓM** ✓
