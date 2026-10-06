# TASK-202 — GO-LIVE ĐỢT 57: ĐƯỜNG THÀNH CÔNG `benefit_record` — **5/5 ĐẠT** · ⭐ **4 KỸ THUẬT CŨ ĐƯỢC ÁP DỤNG CÙNG LÚC**

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Việc** | ⭐ Cặp `benefit_record` («tạo được mà ⛔ chưa từng xoá được») |
| **Kết quả** | ✅ **5/5 ĐẠT · EXIT=0** · ⭐ **94 mảng bootstrap ⛔ không đổi** · ⭐ **`benefitRecords` 52 → 52** · ⭐ **MySQL `rac_cua_toi = 0`, `tong = 52`** |
| **Bao phủ đường thành công** | **94 → 96** |
| **⭐ ĐIỂM ĐÁNG GHI** | ⭐⭐ **4 bài học từ 4 vòng trước được áp dụng CÙNG LÚC — và CẢ 4 đều trả lãi** |
| **⛔ LỖI CỦA TÔI** | **0** — ⭐ không lỗi bài kiểm, ⛔ không phép đo sai |
| **Sản phẩm** | `tools/e2e/go-live-thanh-cong-bao-hiem.mjs` |

---

## ① ⭐ HỢP ĐỒNG ĐỌC **TRỌN** TỪ MÃ (`HrManagementUseCase`)

| Action | Chốt chặn / đặc điểm |
|---|---|
| `saveBenefitRecord` | **BẮT BUỘC** `userId` + `benefitType` ⇒ 400 «Bảo hiểm & chế độ cần nhân sự và loại.» · ⚠️ **`userId` PHẢI TỒN TẠI** ⇒ 400 «Nhân sự không tồn tại.» · ⚠️⚠️ **`monthlyAmount` dùng `strictNonNegative`** ⇒ ⛔ **RỖNG BỊ TỪ CHỐI** («Mức đóng hàng tháng không được để trống.») ⇒ ⭐ **PHẢI GỬI `0`** · ⭐ **`benefitNo` TỰ SINH** (`BH-%05d`) · ⚠️ **⛔ KHÔNG trả về `benefitId`** · ⚠️ **⛔ KHÔNG có chốt chống trùng** |
| `deleteBenefitRecord` | ⭐ **CHỈ 1 CHỐT** — tồn tại ⇒ 400 «Không tìm thấy bản ghi.» |

⭐ **DỮ LIỆU THẬT ĐỌC TỪ CSDL**: user `USR_e66f85ff-…` (`e2e.bgd`) · `benefitType` thật = **`BHXH`** (26 dòng) / `BHYT` (26) · **52 bản ghi** ⇒ ⭐ phải về đúng **52** · mảng **`benefitRecords`** (`BootstrapDataAdapter:1518`) · `monthly_amount` **NOT NULL default 0** ✓

---

## ② ⭐⭐ BỐN BÀI HỌC TỪ BỐN VÒNG TRƯỚC — ÁP DỤNG **CÙNG LÚC**, CẢ 4 ĐỀU TRẢ LÃI

| # | Bài học | Vòng gốc | ⭐ Trả lãi thế nào ở vòng này |
|---|---|---|---|
| **1** | ⭐⭐ **ĐỌC TRỌN KHỐI VALIDATE** (⛔ không chỉ `payload.get`) | **TASK-199** | ⭐ **BẮT ĐƯỢC BẪY `monthlyAmount`** — nếu chỉ đọc các dòng `payload.get` thì tôi ⛔ **không thấy `strictNonNegative`** và sẽ gửi rỗng ⇒ **400** ✓ |
| **2** | ⭐⭐ **SO TẬP ID TRƯỚC/SAU** (khi API ⛔ không trả về id) | **TASK-201** | ⭐ **tìm được `benefitId`** dù `save_benefit_record` ⛔ **không trả về id** ✓ |
| **3** | ⭐⭐ **KIỂM CHỐT CHẶN THEO CHIỀU ÂM** | **TASK-200** | ⭐ **gọi `delete` với id BỊA ⇒ 400** ⇒ **chốt tồn tại ĐÃ ĐƯỢC CHỨNG MINH LÀ HOẠT ĐỘNG** ✓ |
| **4** | ⭐⭐ **LỌC RÁC THEO DẤU VẾT RIÊNG CỦA BÀI KIỂM** | **TASK-201** | ⭐ **`DAU_VET = "TASK-202"`** ⇒ MySQL `rac_cua_toi = 0` ⛔ **không báo động giả** (⭐ như `user_id` hay `code LIKE 'E2E%'` đã gây ra) ✓ |

⭐⭐ **ĐÂY LÀ GIÁ TRỊ TÍCH LUỸ CỦA PHƯƠNG PHÁP**: ⭐ **vòng này ⛔ không phát minh gì mới** — ⭐ **chỉ áp dụng 4 bài học cũ** ⇒ ⭐ **0 lỗi, 1 lượt chạy đúng ngay** ✓✓✓
⭐ **VÀ bảng trên là bằng chứng**: ⭐ **mỗi bài học đều có một hành động cụ thể đã cứu một lỗi cụ thể** — ⛔ không phải «bài học suông» ✓

---

## ③ ✅ KẾT QUẢ — **5/5 ĐẠT · EXIT=0**

```text
[DAT] ① save_benefit_record (TẠO THẬT)
[DAT] ② ĐỌC LẠI — tìm id MỚI bằng SO TẬP ID (⛔ không quét mọi mảng)
[DAT] ③ delete với ID BỊA ⇒ phải 400 «Không tìm thấy bản ghi.» (CHIỀU ÂM)
[DAT] ④ delete_benefit_record (XOÁ THẬT — DỌN SẠCH)
[DAT] ⑤ XOÁ LẦN 2 ⇒ phải 400 «Không tìm thấy bản ghi.»
HẬU QUẢ — 94 mảng bootstrap: ✔ KHÔNG mảng nào đổi
ⓘ «benefitRecords»: 52 → 52
dat 5/5 · that bai 0 · EXIT=0
```

### ✅ KIỂM HẬU QUẢ **HAI LỚP**
| Lớp | Kết quả |
|---|---|
| **Bootstrap** | ✅ **94 mảng ⛔ KHÔNG mảng nào đổi** · ⭐ **`benefitRecords` 52 → 52** ✓ |
| ⭐ **MySQL** (⭐ lọc theo **dấu vết riêng** `note LIKE '%TASK-202%'`) | ✅ **`rac_cua_toi = 0`** · ✅ **`tong = 52`** ⇒ ⭐ **y hệt trạng thái gốc** ✓ |
| `chup-so-dong` | ✅ chỉ `audit_logs` +2 + `sessions` +1 ✓ |

---

## ④ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| Vòng đời `benefit_record` | ✅ **5/5 ĐẠT · EXIT=0** |
| Bao phủ **đường thành công** | **94 → 96** (43% → **44%**) |
| ⭐ **4 kỹ thuật cũ áp dụng cùng lúc** | ✅ **cả 4 đều trả lãi** (⭐ bảng ở §②) |
| ⭐ Chốt chặn **CHIỀU ÂM** | ✅ **id bịa ⇒ 400** ⇒ **chốt tồn tại HOẠT ĐỘNG** |
| Kiểm hậu quả | ✅ **2 lớp SẠCH** (`52 → 52` · `rac_cua_toi = 0`) |
| Bug sản phẩm mới | **0** |
| ⛔ Lỗi của tôi | **0** — ⭐ **không lỗi bài kiểm, ⛔ không phép đo sai** |
| Vân tay | **ĐẠT** `VNTECH-FP-27251D9B7F076176` · 713 tệp — ⛔ không đổi |
| `:18081` | ⛔ vẫn **JAR cũ** ⇒ **7 bản vá chưa lên sóng** |
| Tệp tạm · `.snapshot` | **0 · 0** |

---

## ⑤ BÀI HỌC

1. ⭐⭐⭐ **BỐN BÀI HỌC CŨ ÁP DỤNG CÙNG LÚC CHO 0 LỖI VÀ 1 LƯỢT CHẠY ĐÚNG NGAY.** ⭐ **Vòng này ⛔ không phát minh gì mới** — ⭐ **chỉ dùng lại 4 kỹ thuật đã kiếm được ở 4 vòng trước** ⇒ ⭐ **đó là giá trị TÍCH LUỸ của phương pháp** ✓
2. ⭐⭐ **MỖI BÀI HỌC PHẢI GẮN VỚI MỘT HÀNH ĐỘNG CỤ THỂ.** ⭐ Bảng ở §② cho thấy ⭐ **từng bài học đã cứu một lỗi CỤ THỂ** ⇒ ⭐ **bài học gắn hành động thì dùng lại được; bài học suông thì ⛔ không** ✓
3. ⭐⭐ **ĐỌC HÀM HELPER, ⛔ KHÔNG CHỈ HÀM CHÍNH.** ⭐ Bẫy `monthlyAmount` nằm ở `strictNonNegative` — ⭐ **một hàm private ở CUỐI tệp** ⇒ ⭐ **nếu chỉ đọc phần thân hàm chính thì ⛔ không thấy** ✓
4. ⭐⭐ **CÙNG MỘT KHUÔN DÙNG LẠI ĐƯỢC CHO NHIỀU CẶP.** ⭐ `benefit_record` **gần như y hệt** `labor_contract` ⇒ ⭐ **bài kiểm viết nhanh, ⛔ không phải nghĩ lại từ đầu** ✓ — ⭐ **nhưng vẫn phải đọc mã** vì ⚠️ **có 1 khác biệt (`monthlyAmount` bắt buộc)** ✓
5. ⭐ **3 CẶP «TẠO ĐƯỢC MÀ CHƯA TỪNG XOÁ ĐƯỢC» CÒN LẠI: `boq_item` · `workflow`** ⇒ ⭐ **khuôn đã sẵn sàng** ✓

---

## ⑥ BLOCKER / CHỜ USER

⛔ **Chưa commit** — **158 đường**, hỗn hợp 2 phiên.
⛔ **Cần user quyết:**
1. ⭐⭐⭐ **TRIỂN KHAI** (1 lệnh): `node tools/deploy-java-backend.mjs --dong-y-trien-khai` ⇒ ⭐ **7 bản vá** + **15 bài nghiệm thu** — ⭐ **sau đó tôi `VERIFY` end-to-end BUG-012 và BUG-014** ✓
2. ⭐⭐ **BUG-20261005-013** — **A** tạo migration hay **B** bỏ `mergedFrom`?
3. ⭐ **Xác nhận 5 bản vá CSS bằng mắt.**
4. ⭐⭐ **Cho phép 1 phép thử GHI** để chốt cơ chế quyền.
5. ⭐ **Còn 2 cặp «tạo được mà chưa từng xoá được»**: `boq_item` · `workflow` ✓
6. **Commit theo NHÓM hay gộp?** · **dọn Transit** · **khoá ngoại**.
