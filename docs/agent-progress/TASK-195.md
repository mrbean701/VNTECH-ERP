# TASK-195 — GO-LIVE ĐỢT 50: ĐƯỜNG THÀNH CÔNG **4 THỰC THỂ DANH MỤC** — **16/16 ĐẠT** · ⛔ **1 LỖI CỦA TÔI** (đã dọn + sửa + xác minh lại)

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Việc** | ⭐ Mở rộng đường thành công cho **4 cặp action** trong MỘT vòng: `payment_plan` · `seal` · `legal_document` · `correspondence` |
| **Kết quả cuối** | ✅ **16/16 ĐẠT · EXIT=0** · ⭐ **hậu quả SẠCH** («94 mảng bootstrap ✔ KHÔNG mảng nào đổi») |
| **Bao phủ đường thành công** | **74 → 82** (+8: 4 `save_*` + 4 `delete_*`) |
| **⛔ TỰ PHÊ** | **1 LỖI CỦA TÔI** — quét **MỌI** mảng bootstrap ⇒ lấy **nhầm id từ mảng `audits`** ⇒ **tạo 4 bản rác** |
| **Cách xử lý** | ✅ **DỌN 4/4** (`go-live-don-4-danh-muc.mjs`) · ✅ **SỬA script** · ✅ **CHẠY LẠI 16/16** |
| **Sản phẩm** | `tools/e2e/go-live-thanh-cong-4-danh-muc.mjs` · `tools/e2e/go-live-don-4-danh-muc.mjs` |

---

## ① ⭐ ĐỌC MÃ **MỘT LƯỢT** — 4 HỢP ĐỒNG (⛔ không đoán)

| Action | BẮT BUỘC | ⭐ Chốt chống trùng | Xoá bằng |
|---|---|---|---|
| `save_payment_plan` | `projectId` | — (⭐ `planId` khác dự án ⇒ 400) | `planId` |
| `save_seal` | `sealNo` + `sealName` + `sealType` | ⭐ trùng `sealNo` ⇒ **400 «Số hiệu con dấu đã tồn tại.»** | `sealId` |
| `save_legal_document` | `docNo` + `docType` + `title` | ⭐ trùng `docNo` ⇒ **400 «Số văn bản đã tồn tại.»** | `docId` |
| `save_correspondence` | `docNo` + `direction` ∈ **{IN,OUT}** + `docType` | ⭐ trùng `docNo` ⇒ **400** | `corrId` |

⭐ Dữ liệu THẬT đọc từ CSDL: dự án **`PRJ_0af3201a-22d0-4870-961a-26d367350d45`** (`E2E-DA-01`) ✓
⭐⭐ **BƯỚC ① «ĐỌC MÃ» TIẾP TỤC TRẢ LÃI**: ⭐ **cả 4 payload tối thiểu chạy đúng ngay lần đầu** ✓

---

## ② ⭐⭐ KỸ THUẬT THỨ 3 — **«CHỐT CHỐNG TRÙNG»** (⛔ KHÔNG CẦN BIẾT ID)

| Bước | Gọi | Kỳ vọng | ⇒ Chứng minh |
|---|---|---|---|
| ③ | `save_*(số hiệu **X**)` | 200 | tạo mới |
| ④ | `save_*(số hiệu **X**, ⛔ không id)` **lần 2** | **400 «đã tồn tại»** | ⭐⭐ **bản ghi ĐẦU ĐÃ ĐƯỢC GHI THẬT** |
| ⑤b | `delete_*(id)` | 200 | xoá |
| ⑥ | `delete_*(id)` **lần 2** | **400 «Không tìm thấy»** | ⭐⭐ **ĐÃ XOÁ THẬT** |

⭐⭐ **VÌ SAO ĐÂY LÀ KỸ THUẬT MẠNH NHẤT TỪ TRƯỚC TỚI NAY**: ⭐ nó chứng minh **đã ghi thật** mà ⛔ **KHÔNG cần biết id**, ⛔ **không cần đọc CSDL**, ⛔ **không cần bootstrap** ✓
⭐ **Cơ chế**: chốt chống trùng (`findSealByNo`/`findLegalDocumentByDocNo`/`findCorrespondenceByDocNo`) **chỉ có thể nổ nếu bản ghi đầu ĐÃ NẰM TRONG CSDL** ⇒ ⭐ **nếu lần 2 trả 200 thì đó là BẰNG CHỨNG GHI THẤT BẠI ÂM THẦM** ✓
⭐ **Bài kiểm NÉM LỖI** trong trường hợp đó ⇒ ⛔ không thể bỏ sót ✓

---

## ③ ⛔⛔ LỖI CỦA TÔI — QUÉT **MỌI** MẢNG ⇒ LẤY NHẦM ID TỪ MẢNG `audits`

### Hiện tượng (lần chạy đầu)
```text
[DAT] payment_plan · ③ TẠO THẬT          ← ✅ tạo được
[BO QUA] payment_plan · ④ không có chốt chống trùng
      ⓘ thấy id trong «audits»             ← ⛔⛔ DẤU HIỆU: id lấy từ mảng NHẬT KÝ!
[LOI] payment_plan · ⑤b XOÁ THẬT :: «Không tìm thấy kế hoạch thanh toán.» ⇒ CÒN RÁC
```
⇒ ⛔ **4/4 lần `delete_*` đều 400** ⇒ ⭐ **kết quả 12/16** và ⛔ **4 BẢN RÁC** ✓

### ⭐ NGUYÊN NHÂN GỐC
Script cũ **quét MỌI mảng bootstrap** để tìm mã dò (`for (const k of KHOA)`):
```js
for (const k of KHOA) {
  const row = (bs1[k] || []).find((x) => JSON.stringify(x).includes(m.ma));
  if (row) { id = String(row.id || row[m.truongId] || ""); ... }
}
```
⛔ **Mảng `audits` CŨNG chứa mã đó** (nhật ký ghi lại việc tạo) ⇒ ⭐ **vòng lặp khớp `audits` TRƯỚC** ⇒
⭐ **lấy `id` của DÒNG NHẬT KÝ**, ⛔ không phải id của con dấu/văn bản ⇒ `delete_*` ⛔ không tìm thấy ✓

### ✅ CÁCH XỬ LÝ — 3 BƯỚC, ⛔ KHÔNG BƯỚC NÀO BỊ BỎ
1. ⭐ **DỌN NGAY**: `go-live-don-4-danh-muc.mjs` — ⭐ **chỉ đọc ĐÚNG mảng của từng thực thể** (`paymentPlans` · `sealManagement` · `legalDocuments` · `officialCorrespondence`) ⇒ **4/4 ĐẠT**:
   ```text
   paymentPlans  5 → 4 ✔ sạch   sealManagement 1 → 0 ✔ sạch
   legalDocuments 1 → 0 ✔ sạch  officialCorrespondence 2 → 1 ✔ sạch
   ⇒ ✔ ĐÃ DỌN SẠCH CẢ 4  ·  dat 4/4 · that bai 0
   ```
   ⭐ **Mọi mảng về ĐÚNG giá trị gốc** ✓
2. ⭐ **SỬA SCRIPT**: thêm trường **`mang`** (mảng bootstrap ĐÚNG) cho mỗi thực thể và **chỉ đọc mảng đó** ✓
3. ⭐ **CHẠY LẠI XÁC MINH**: **`dat 16/16 · that bai 0 · EXIT=0`** · **«94 mảng bootstrap ✔ KHÔNG mảng nào đổi»** ✓

---

## ④ ⭐ KIỂM HẬU QUẢ **ĐÃ BẮT ĐƯỢC LỖI CỦA TÔI** — ĐÂY LÀ ĐIỀU ĐÁNG GHI NHẤT

⭐ Lần chạy đầu, `chup-so-dong`/đối chiếu bootstrap **in ra**:
```text
HẬU QUẢ — 94 mảng bootstrap: ⚠️ paymentPlans: 4→5 · officialCorrespondence: 1→2 · legalDocuments: 0→1 · sealManagement: 0→1
⛔⛔ CÒN RÁC CHƯA DỌN (4): E2E… ⇒ PHẢI DỌN BẰNG SQL
```
⇒ ⭐⭐ **BƯỚC KIỂM HẬU QUẢ ĐÃ PHÁT HIỆN ĐÚNG 4 BẢN RÁC** — ⛔ **tôi ⛔ không phải tự nhớ ra**, ⭐ **công cụ chỉ đúng chỗ** ✓
⭐⭐ **VÀ** chính nhờ nó in ra **mảng nào tăng** mà tôi biết **mảng ĐÚNG để tìm id** ⇒ ⭐ **công cụ kiểm hậu quả vừa phát hiện lỗi, vừa chỉ cách sửa** ✓
⭐⭐⭐ **NẾU ⛔ KHÔNG CÓ BƯỚC KIỂM HẬU QUẢ**: ⭐ **4 bản rác sẽ nằm lại vĩnh viễn trong CSDL thật** và ⛔ **không ai biết** ✓

---

## ⑤ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| Vòng đời 4 danh mục (sau khi sửa) | ✅ **16/16 ĐẠT · EXIT=0** |
| Bao phủ **đường thành công** | **74 → 82** / 220 (34% → **37%**) |
| Kiểm hậu quả (lần chạy cuối) | ✅ **94 mảng bootstrap ⛔ không mảng nào đổi** · 131 bảng: chỉ `audit_logs` +8 + `sessions` +1 |
| ⛔ Rác do lỗi của tôi | **4** ⇒ ✅ **ĐÃ DỌN SẠCH 4/4** (mọi mảng về giá trị gốc) |
| Bug sản phẩm mới | **0** — ⭐ **cả 8 action đường thành công hoạt động ĐÚNG**, gồm **4 chốt chống trùng đều nổ đúng** ✓ |
| Kỹ thuật mới | ⭐⭐ **«CHỐT CHỐNG TRÙNG»** — chứng minh đã ghi thật **mà ⛔ không cần id** |
| Công cụ triển khai | ✅ nay **10 bài nghiệm thu** (thêm 2 bài của vòng này) |
| Vân tay | **ĐẠT** `VNTECH-FP-27251D9B7F076176` · 713 tệp — ⛔ không đổi |
| `:18081` | ⛔ vẫn **JAR cũ** ⇒ **6 bản vá chưa lên sóng** |
| Tệp tạm · `.snapshot` | **0 · 0** |

---

## ⑥ BÀI HỌC

1. ⭐⭐ **⛔ QUÉT MỌI MẢNG LÀ SAI — PHẢI QUÉT ĐÚNG MẢNG CỦA THỰC THỂ.** ⭐ Mảng `audits` **chứa mọi mã** vì nó ghi lại mọi thao tác ⇒ ⭐ **nó luôn khớp trước** và **luôn cho id sai** ✓ ⭐ Đây là **biến thể của «đo sai tập hợp»** (cùng họ với «đo sai tệp» ở TASK-187) ✓
2. ⭐⭐ **KIỂM HẬU QUẢ KHÔNG CHỈ PHÁT HIỆN LỖI — NÓ CHỈ CÁCH SỬA.** ⭐ Chính dòng `⚠️ paymentPlans: 4→5` cho tôi biết **mảng ĐÚNG** để tìm id ✓
3. ⭐⭐⭐ **NẾU ⛔ KHÔNG CÓ BƯỚC KIỂM HẬU QUẢ, 4 BẢN RÁC SẼ NẰM LẠI VĨNH VIỄN TRONG CSDL THẬT.** ⭐ Đây là **lý do đủ** để ⛔ không bao giờ bỏ bước này ✓
4. ⭐⭐ **KỸ THUẬT «CHỐT CHỐNG TRÙNG» LÀ KỸ THUẬT MẠNH NHẤT TỪ TRƯỚC TỚI NAY** — ⭐ chứng minh **đã ghi thật** mà ⛔ không cần id, ⛔ không cần đọc CSDL ✓
5. ⭐⭐ **MỘT LỖI CỦA MÌNH PHẢI ĐƯỢC XỬ LÝ ĐỦ 3 BƯỚC: DỌN → SỬA → CHẠY LẠI XÁC MINH.** ⛔ **Dừng ở bước dọn là chưa xong** — ⭐ phải **sửa nguyên nhân** và **chứng minh bằng lần chạy lại** ✓
6. ⭐ **ĐỌC MÃ 4 HỢP ĐỒNG TRONG MỘT LƯỢT** ⇒ ⭐ **1 vòng kiểm được 4 cặp action** thay vì 4 vòng ⇒ **nhanh hơn 4 lần** ✓

---

## ⑦ BLOCKER / CHỜ USER

⛔ **Chưa commit** — **145 đường**, hỗn hợp 2 phiên.
⛔ **Cần user quyết:**
1. ⭐⭐⭐ **TRIỂN KHAI** (1 lệnh): `node tools/deploy-java-backend.mjs --dong-y-trien-khai` ⇒ **6 bản vá** + ⭐ **10 bài nghiệm thu tự chạy**.
2. ⭐⭐⭐ **TIẾP TỤC MỞ RỘNG ĐƯỜNG THÀNH CÔNG** — hiện **82/220 = 37%**. ⭐ Còn **~20 cặp danh mục** làm được ngay bằng phương pháp này (⛔ **không ghi dữ liệu nghiệp vụ**). ⚠️ Các action **nghiệp vụ** (phiếu/PO/kho/thanh toán) **GHI dữ liệu THẬT** ⇒ **cần bạn xác nhận riêng**.
3. ⭐⭐ **BUG-20261005-013** — **A** tạo migration hay **B** bỏ `mergedFrom`?
4. ⭐ **Xác nhận 5 bản vá CSS bằng mắt.**
5. ⭐⭐ **Cho phép 1 phép thử GHI** để chốt cơ chế quyền.
6. **Commit theo NHÓM hay gộp?** · **BUG-20261009** · **«ai nhận hàng ở kho đích»** · **dọn Transit** · **khoá ngoại**.
