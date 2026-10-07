# TASK-206 — GO-LIVE ĐỢT 61: ĐƯỜNG THÀNH CÔNG `cashbook_entry` — **6/6 ĐẠT** · ⭐ **CHỨNG MINH HOÀN SỐ DƯ**

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Việc** | ⭐ Cặp `cashbook_entry` (**sổ quỹ** — bút toán TÀI CHÍNH) |
| **Kết quả** | ✅ **6/6 ĐẠT · EXIT=0** · ⭐ **94 mảng bootstrap ⛔ không đổi** · ⭐ **`cashbookEntries` 2→2** · ⭐ **SỐ DƯ TRƯỚC = SAU** |
| **Bao phủ đường thành công** | **100 → 102** |
| **⭐⭐ ĐÁNG GIÁ NHẤT** | ⭐⭐ **CHỨNG MINH XOÁ BÚT TOÁN HOÀN SỐ DƯ ĐÚNG** + ⭐ **2 chốt chặn CHIỀU ÂM đã chứng minh** |
| **⛔ LỖI CỦA TÔI** | **0** — ⭐ **lần thứ TƯ liên tiếp** |

---

## ① ⭐ HỢP ĐỒNG ĐỌC **NGUYÊN KHỐI** (⭐ quy tắc vòng 57 đã cho 0 lỗi 3 vòng)

| Action | Chốt chặn / đặc điểm |
|---|---|
| `saveCashbookEntry` | **BẮT BUỘC** (theo chốt) `entryDate` · `accountId` · `entryType` ∈ {`IN`,`OUT`} · `amount` **> 0** ⇒ 400 «Sổ quỹ cần ngày, tài khoản, loại Thu/Chi và **số tiền > 0**.» · ⚠️ **`findBankAccount(accountId)` PHẢI TỒN TẠI** ⇒ 400 «Tài khoản không tồn tại.» · ⚠️ `amount` qua `strictNonNegative` ⇒ ⛔ rỗng ⇒ 400 · ⭐ **`entryNo` TỰ SINH** (`SQ-%06d`) · ⚠️ **⛔ KHÔNG trả về `entryId`** |
| `deleteCashbookEntry` | ⭐ **CHỈ 1 CHỐT** — tồn tại ⇒ 400 «Không tìm thấy bút toán.» |

---

## ② ⭐⭐ ĐẶC BIỆT — **SỐ DƯ LÀ GIÁ TRỊ TÍNH RA**, VÀ TÔI ĐÃ KIỂM NÓ

⭐ **PHÁT HIỆN KHI ĐỌC LƯỢC ĐỒ**: ⚠️ bảng `bank_accounts` **⛔ KHÔNG có cột `balance`** — chỉ có **`opening_balance`** ✓
⇒ ⭐⭐ **«SỐ DƯ» = `opening_balance + SUM(IN) − SUM(OUT)`** — ⭐ **giá trị TÍNH RA, ⛔ không lưu sẵn** ✓
⇒ ⭐⭐⭐ **PHÉP KIỂM ĐÚNG**: ⭐ đối chiếu **`SUM(IN)`/`SUM(OUT)` TRƯỚC và SAU** ✓

| | `opening_balance` | `tổng_thu` (IN) | `tổng_chi` (OUT) |
|---|---|---|---|
| **TRƯỚC** | 5.000.000.000 | 2.000.000.000 | 150.000.000 |
| **SAU** | 5.000.000.000 | 2.000.000.000 | 150.000.000 |

⇒ ⭐⭐ **Y HỆT NHAU** ⇒ **CHỨNG MINH XOÁ BÚT TOÁN HOÀN SỐ DƯ ĐÚNG** ✓✓✓
⭐⭐ **VÀ đây là phép kiểm có giá trị thật**: ⭐ **bút toán tài chính** — ⭐ **nếu xoá ⛔ mà số dư ⛔ không hoàn thì SAI DỮ LIỆU TÀI CHÍNH THẬT** ✓

---

## ③ ⭐⭐ HAI CHỐT CHẶN **CHIỀU ÂM** ĐÃ ĐƯỢC CHỨNG MINH

```text
③ save với amount=0 ⇒ phải 400                                    ← ⭐ DAT  (chốt «số tiền > 0»)
④ save với accountId BỊA ⇒ phải 400 «Tài khoản không tồn tại.»     ← ⭐ DAT  (chốt tài khoản)
```
⇒ ⭐⭐ **CẢ HAI CHỐT ĐỀU HOẠT ĐỘNG** — ⛔ không chỉ «đọc thấy trong mã» ✓
⭐⭐ **VÀ CẢ HAI PHÉP KIỂM ĐỀU VÔ HẠI**: ⭐ chốt chặn **chặn nó** ⇒ ⛔ **không có bút toán rác nào được tạo** ✓
⭐ **Đây là lần đầu tôi kiểm HAI chốt chặn chiều âm trong CÙNG một bài** ✓

---

## ④ ✅ KẾT QUẢ — **6/6 ĐẠT · EXIT=0**

```text
[DAT] ① save_cashbook_entry (TẠO THẬT — Thu 1 đồng, ⭐ để đo số dư)
[DAT] ② ĐỌC LẠI — tìm id MỚI bằng SO TẬP ID
[DAT] ③ save với amount=0 ⇒ phải 400 (CHIỀU ÂM — chốt «số tiền > 0»)
[DAT] ④ save với accountId BỊA ⇒ phải 400 «Tài khoản không tồn tại.» (CHIỀU ÂM)
[DAT] ⑤ delete_cashbook_entry (XOÁ THẬT — ⭐ phải HOÀN số dư)
[DAT] ⑥ XOÁ LẦN 2 ⇒ phải 400 «Không tìm thấy bút toán.»
HẬU QUẢ — 94 mảng bootstrap: ✔ KHÔNG mảng nào đổi
ⓘ «cashbookEntries»: 2 → 2
dat 6/6 · that bai 0 · EXIT=0
```

### ✅ KIỂM HẬU QUẢ **BA LỚP** (⭐ lớp thứ ba là MỚI)
| Lớp | Kết quả |
|---|---|
| **Bootstrap** | ✅ **94 mảng ⛔ KHÔNG mảng nào đổi** · ⭐ **`cashbookEntries` 2 → 2** ✓ |
| ⭐⭐ **SỐ DƯ (tính ra)** | ✅ **`opening_balance` · `tổng_thu` · `tổng_chi` ⛔ KHÔNG ĐỔI** ✓ |
| ⭐ **MySQL** | ✅ **`rac_cua_toi = 0`** ✓ |
| `chup-so-dong` | ✅ chỉ `audit_logs` + `sessions` (bình thường) ✓ |

---

## ⑤ ⭐ 5 KỸ THUẬT CŨ — DÙNG CÙNG LÚC, ⛔ 0 LỖI (lần thứ tư liên tiếp)

| # | Kỹ thuật | Vòng gốc | Trả lãi |
|---|---|---|---|
| 1 | **Đọc NGUYÊN KHỐI, ⛔ không lọc** | v57 | thấy **cả 4 điều kiện** của chốt + ⚠️ **`findBankAccount`** ✓ |
| 2 | **SO TẬP ID** | v55 | tìm `entryId` dù API **⛔ không trả về** ✓ |
| 3 | **CHIỀU ÂM** | v54 | ⭐ **2 chốt chặn** chứng minh hoạt động ✓ |
| 4 | **LỌC THEO DẤU VẾT RIÊNG** | v55 | `rac_cua_toi = 0`, ⛔ không báo động giả ✓ |
| 5 | **KIỂM TẦNG XOÁ CON** | v60 | ⭐ vòng này **biến thể**: ⭐ **kiểm GIÁ TRỊ DẪN XUẤT (số dư)** ⛔ không chỉ đếm dòng ✓ |

---

## ⑥ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| Vòng đời `cashbook_entry` | ✅ **6/6 ĐẠT · EXIT=0** |
| Bao phủ **đường thành công** | **100 → 102** |
| ⭐⭐ **Số dư TRƯỚC = SAU** | ✅ **CHỨNG MINH HOÀN SỐ DƯ ĐÚNG** |
| ⭐ **2 chốt chặn CHIỀU ÂM** | ✅ **«số tiền > 0»** + **«tài khoản không tồn tại»** |
| Kiểm hậu quả | ✅ **3 lớp SẠCH** (94 mảng · số dư · MySQL) |
| Bug sản phẩm mới | **0** |
| ⛔ Lỗi của tôi | **0** — ⭐ **lần thứ TƯ liên tiếp** |
| Vân tay | **ĐẠT** `VNTECH-FP-27251D9B7F076176` · 713 tệp — ⛔ không đổi |
| `:18081` | ⛔ vẫn **JAR cũ** ⇒ **7 bản vá chưa lên sóng** |
| Tệp tạm · `.snapshot` | **0 · 0** |

---

## ⑦ BÀI HỌC

1. ⭐⭐⭐ **KIỂM GIÁ TRỊ DẪN XUẤT, ⛔ KHÔNG CHỈ ĐẾM DÒNG.** ⭐ Đếm `cashbookEntries` **2 → 2** là **cần nhưng ⛔ chưa đủ**: ⭐ **cái thật sự quan trọng là SỐ DƯ** — ⭐ **một giá trị TÍNH RA từ các bút toán** ✓ ⭐ **nếu chỉ đếm dòng, tôi ⛔ đã bỏ qua khả năng số dư sai** ✓
2. ⭐⭐ **ĐỌC LƯỢC ĐỒ ĐỂ BIẾT CÁI GÌ LÀ «SỰ THẬT».** ⭐ Tôi phát hiện **`bank_accounts` ⛔ không có cột `balance`** ⇒ ⭐ **số dư là dẫn xuất** ⇒ ⭐ **biết phải kiểm cái gì** ✓
3. ⭐⭐ **MỘT BÀI KIỂM CÓ THỂ CHỨNG MINH NHIỀU CHỐT CHẶN CÙNG LÚC.** ⭐ Lần đầu tôi kiểm **2 chốt chặn chiều âm** trong cùng một bài ✓ — ⭐ **và cả hai đều vô hại** ✓
4. ⭐⭐ **0 LỖI BỐN VÒNG LIÊN TIẾP** (v55 · v56 · v60 · v61) — ⭐ **kỷ luật phương pháp đang hoạt động ổn định** ✓
5. ⭐ **CHỌN CẶP THEO GIÁ TRỊ RỦI RO, ⛔ KHÔNG THEO «DỄ LÀM».** ⭐ Tôi chọn `cashbook_entry` **vì nó là bút toán TÀI CHÍNH** — ⭐ **loại mà sai thì hậu quả nặng nhất** ✓

---

## ⑧ BLOCKER / CHỜ USER

⛔ **Chưa commit** — **167 đường**, hỗn hợp 2 phiên.
⛔ **Cần user quyết** (⭐ chi tiết + mặc định đề xuất trong `docs/agent-progress/BAN-GIAO-GO-LIVE.md`):
1. ⭐⭐⭐ **TRIỂN KHAI 7 bản vá**: `node tools/deploy-java-backend.mjs --dong-y-trien-khai` ⇒ **18 bài nghiệm thu** ⇒ ⭐ **sau đó tôi `VERIFY` end-to-end BUG-012 và BUG-014** ✓
2. ⭐⭐ **BUG-20261005-013** — **A** tạo migration hay ⭐ **B** bỏ `mergedFrom` (đề xuất **B**) ✓
3. ⭐⭐ **5 bản vá CSS** — ⭐ **cần mắt người** ✓
4. ⭐⭐ **1 phép thử GHI** để chốt sự cố quyền ✓
5. ⭐ **Mở rộng tiếp**: `capital_recovery` · `contract_payment` · `site_expense_claim` · `advance_request` · `accounting_voucher` ✓
6. ⭐ **Commit theo NHÓM** ✓
