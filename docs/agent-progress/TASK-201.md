# TASK-201 — GO-LIVE ĐỢT 56: ĐƯỜNG THÀNH CÔNG `labor_contract` — **5/5 ĐẠT** · ⭐ **KỸ THUẬT «SO TẬP ID»**

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Việc** | ⭐ Cặp `labor_contract` («tạo được mà ⛔ chưa từng xoá được») |
| **Kết quả** | ✅ **5/5 ĐẠT · EXIT=0** · ⭐ **94 mảng bootstrap ⛔ không đổi** · ⭐ **MySQL: `rac_cua_toi = 0`** · ⭐ **`laborContracts` 26 → 26** |
| **Bao phủ đường thành công** | **91 → 94** |
| **⭐ KỸ THUẬT MỚI** | ⭐⭐ **«SO TẬP ID TRƯỚC/SAU»** — tìm id bản ghi mới khi **API ⛔ không trả về id** |
| **⛔ LỖI CỦA TÔI** | **0** khâu bài kiểm · ⚠️ **1 phép đo của tôi bị rộng** (lọc theo `user_id` ⇒ báo động giả) — **tự phát hiện và sửa** |
| **Sản phẩm** | `tools/e2e/go-live-thanh-cong-hdld.mjs` |

---

## ① ⭐ HỢP ĐỒNG ĐỌC **TRỌN** TỪ MÃ (`HrManagementUseCase`)

| Action | Chốt chặn / đặc điểm |
|---|---|
| `saveLaborContract` | **BẮT BUỘC** `userId` + `contractType` ⇒ 400 «Hợp đồng lao động cần nhân sự và loại hợp đồng.» · ⚠️ **`userId` PHẢI TỒN TẠI** ⇒ 400 «Nhân sự không tồn tại.» · `salary` = `strictNonNegative` · `imageUrl` **chỉ nhận data-URL ảnh** ⇒ ⭐ gửi RỖNG · ⭐ **`contractNo` TỰ SINH**: `"HĐLĐ-" + %05d(nextLaborContractNo())` · ⚠️ **⛔ KHÔNG trả về `contractId`** · ⚠️ **⛔ KHÔNG có chốt chống trùng** (vì mã tự sinh) |
| `deleteLaborContract` | ⭐ **CHỈ 1 CHỐT** — tồn tại ⇒ 400 «Không tìm thấy hợp đồng.» |

⭐ **DỮ LIỆU THẬT ĐỌC TỪ CSDL** (⛔ không đoán): user `USR_e66f85ff-…` (`e2e.bgd`, active) · `contractType` thật = «Hợp đồng xác định thời hạn» (19 dòng) · **hiện có 26 hợp đồng** ⇒ ⭐ phải về đúng **26** ✓ · mảng bootstrap **`laborContracts`** (⭐ đọc từ `BootstrapDataAdapter:1464`) ✓

---

## ② ⭐⭐ KỸ THUẬT MỚI — **«SO TẬP ID TRƯỚC/SAU»**

⭐ **VẤN ĐỀ**: `save_labor_contract` **⛔ KHÔNG trả về `contractId`** ⚠️ (⭐ khác `save_project_contract` ở TASK-200) ⇒ ⭐ **làm sao biết id để xoá?** ✓
⛔ **CÁCH SAI** (⭐ đã mắc ở TASK-195): **quét MỌI mảng** để tìm mã ⇒ ⭐ sẽ khớp `audits` và **lấy nhầm id** ✓
⭐⭐ **CÁCH ĐÚNG — SO TẬP ID**:
```js
const idTruoc = new Set(bs0["laborContracts"].map(r => r.id));   // ⭐ TẬP ID TRƯỚC khi tạo
await call("save_labor_contract", {...});                        // tạo
const idSau = new Set(bs1["laborContracts"].map(r => r.id));     // ⭐ TẬP ID SAU khi tạo
const moi = [...idSau].filter(x => !idTruoc.has(x));             // ⭐ id MỚI
```
⭐ **VÀ bài kiểm KIỂM LUÔN tính đúng đắn**: ⭐ `moi.length === 1` ⇒ **id xác định** ✓ · ⭐ `moi.length === 0` ⇒ **⛔ GHI THẤT BẠI ÂM THẦM** ⇒ **NÉM LỖI** ✓ · ⚠️ `moi.length > 1` ⇒ ⭐ **⛔ không xác định được ⇒ báo động, ⛔ không đoán** ✓
⭐⭐ **VÌ SAO MẠNH**: ⭐ nó ⛔ **chỉ đọc ĐÚNG một mảng** (⛔ không quét mọi mảng) ⭐ **và nó tự phát hiện «ghi âm thầm thất bại»** ✓

---

## ③ ⭐ KIỂM CHỐT CHẶN THEO **CHIỀU ÂM** (⭐ kỹ thuật từ TASK-200, dùng lại)

```text
③ delete với ID BỊA ⇒ phải 400 «Không tìm thấy hợp đồng.»   ← ⭐ DAT
```
⇒ ⭐ **CHỐT TỒN TẠI ĐÃ ĐƯỢC CHỨNG MINH LÀ HOẠT ĐỘNG** — ⛔ **không chỉ «đọc thấy trong mã»** ✓
⭐ **VÀ ở đây chiều âm RẤT RẺ**: `deleteLaborContract` chỉ có 1 chốt ⇒ ⭐ **gọi với id bịa là vô hại** ✓

---

## ④ ✅ KẾT QUẢ — **5/5 ĐẠT · EXIT=0**

```text
[DAT] ① save_labor_contract (TẠO THẬT)
[DAT] ② ĐỌC LẠI — tìm id MỚI bằng SO TẬP ID (⛔ không quét mọi mảng)
[DAT] ③ delete với ID BỊA ⇒ phải 400 «Không tìm thấy hợp đồng.» (CHIỀU ÂM)
[DAT] ④ delete_labor_contract (XOÁ THẬT — DỌN SẠCH)
[DAT] ⑤ XOÁ LẦN 2 ⇒ phải 400 «Không tìm thấy hợp đồng.»
HẬU QUẢ — 94 mảng bootstrap: ✔ KHÔNG mảng nào đổi
ⓘ «laborContracts»: 26 → 26  (⭐ phải BẰNG nhau)
dat 5/5 · that bai 0 · EXIT=0
```

### ✅ KIỂM HẬU QUẢ **HAI LỚP**
| Lớp | Kết quả |
|---|---|
| **Bootstrap** | ✅ **94 mảng ⛔ KHÔNG mảng nào đổi** · ⭐ **`laborContracts` 26 → 26** ✓ |
| ⭐ **MySQL** | ✅ **`rac_cua_toi = 0`** (⭐ lọc theo **dấu vết riêng** `note LIKE '%TASK-201%'`) ✓ |
| `chup-so-dong` | ✅ chỉ `audit_logs` +2 + `sessions` +1 ✓ |

---

## ⑤ ⚠️ LỖI **PHÉP ĐO** CỦA TÔI — TỰ PHÁT HIỆN VÀ SỬA

⭐ **Truy vấn đầu tiên** của tôi: `WHERE user_id='USR_e66f85ff-…'` ⇒ **trả về 1** ⚠️ ⇒ ⭐ **suýt kết luận «còn rác»** ✓
⭐ **SỰ THẬT** (kiểm lại): ⭐ **hợp đồng đó là `HĐLĐ-00005`, tạo `2026-10-02 08:56`** ⇒ ⭐ **DỮ LIỆU E2E CÓ SẴN CỦA USER** (⭐ «E2E-HD-03 · Hồ lập bởi Phòng Nhân sự E2E Giai đoạn 3») ⛔ **không phải rác của tôi** ✓
✅ **SỬA**: lọc theo **dấu vết RIÊNG của bài kiểm** (`note LIKE '%TASK-201%'`) ⇒ ⭐ **`rac_cua_toi = 0`** ✓

⭐⭐ **BÀI HỌC**: ⭐ **KHI KIỂM RÁC, PHẢI LỌC THEO DẤU VẾT RIÊNG CỦA BÀI KIỂM** (mã/nhãn mình tự đặt) — ⛔ **không lọc theo trường chung** (`user_id`, `code LIKE 'E2E%'`) vì ⭐ **dữ liệu THẬT của user cũng khớp** ✓
⭐ **CÙNG LOẠI LỖI ĐÃ GẶP Ở TASK-196** (`code LIKE 'E2E%'` trả **35 dòng** = **danh mục thật của user**) ⇒ ⭐ **đây là lần thứ HAI** ⇒ ⭐ **quy tắc: LUÔN có một dấu vết riêng, và LUÔN lọc theo nó** ✓

---

## ⑥ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| Vòng đời `labor_contract` | ✅ **5/5 ĐẠT · EXIT=0** |
| Bao phủ **đường thành công** | **91 → 94** (41% → **43%**) |
| ⭐ Kỹ thuật mới | ⭐⭐ **«SO TẬP ID TRƯỚC/SAU»** — tìm id khi **API ⛔ không trả về id** |
| ⭐ Chốt chặn **CHIỀU ÂM** | ✅ **id bịa ⇒ 400** ⇒ ⭐ **chốt tồn tại HOẠT ĐỘNG** |
| Kiểm hậu quả | ✅ **2 lớp SẠCH** (`laborContracts` **26 → 26** · `rac_cua_toi = 0`) |
| Bug sản phẩm mới | **0** |
| ⛔ Lỗi bài kiểm của tôi | **0** · ⚠️ **1 phép đo bị rộng** — **tự phát hiện, tự sửa** ✓ |
| Vân tay | **ĐẠT** `VNTECH-FP-27251D9B7F076176` · 713 tệp — ⛔ không đổi |
| `:18081` | ⛔ vẫn **JAR cũ** ⇒ **7 bản vá chưa lên sóng** |
| Tệp tạm · `.snapshot` | **0 · 0** |

---

## ⑦ BÀI HỌC

1. ⭐⭐ **KHI API ⛔ KHÔNG TRẢ VỀ ID, DÙNG «SO TẬP ID TRƯỚC/SAU»** — ⭐ ⛔ **không quét mọi mảng** (sẽ khớp `audits`) ⭐ **và ⛔ không đoán theo tên** ✓ ⭐ **và bài kiểm tự phát hiện được «ghi âm thầm thất bại»** khi tập không đổi ✓
2. ⭐⭐ **KIỂM CHỐT CHẶN THEO CHIỀU ÂM — LẦN THỨ HAI LIÊN TIẾP LÀM ĐƯỢC.** ⭐ Kỹ thuật từ TASK-200 **dùng lại được ngay** khi chốt chặn **có thể kích hoạt vô hại** (⭐ id bịa, chuỗi sai) ✓
3. ⭐⭐ **KHI KIỂM RÁC, PHẢI LỌC THEO DẤU VẾT RIÊNG CỦA BÀI KIỂM.** ⭐ Lọc theo trường chung (`user_id`, `code LIKE 'E2E%'`) **khớp cả dữ liệu THẬT của user** ⇒ **báo động giả** ✓ ⭐ **lần thứ hai mắc ⇒ thành quy tắc** ✓
4. ⭐⭐ **PHÉP ĐO SAI PHẢI ĐƯỢC GHI LẠI, ⛔ KHÔNG ĐƯỢC IM LẶNG SỬA.** ⭐ Tôi **viết rõ** vào nhật ký: truy vấn đầu **sai**, ⭐ **cách sửa**, ⭐ **và vì sao** ✓
5. ⭐ **0 LỖI BÀI KIỂM LẦN THỨ HAI LIÊN TIẾP** — ⭐ nhờ **đọc TRỌN khối validate** (⭐ quy tắc từ TASK-199 đang trả lãi) ✓

---

## ⑧ BLOCKER / CHỜ USER

⛔ **Chưa commit** — **155 đường**, hỗn hợp 2 phiên.
⛔ **Cần user quyết:**
1. ⭐⭐⭐ **TRIỂN KHAI** (1 lệnh): `node tools/deploy-java-backend.mjs --dong-y-trien-khai` ⇒ ⭐ **7 bản vá** + **14 bài nghiệm thu** — ⭐ **sau đó tôi `VERIFY` end-to-end BUG-012 và BUG-014** ✓
2. ⭐⭐ **BUG-20261005-013** — **A** tạo migration hay **B** bỏ `mergedFrom`?
3. ⭐ **Xác nhận 5 bản vá CSS bằng mắt.**
4. ⭐⭐ **Cho phép 1 phép thử GHI** để chốt cơ chế quyền.
5. ⭐ **Còn 3 cặp «tạo được mà chưa từng xoá được»**: `benefit_record` · `boq_item` · `workflow` ✓
6. **Commit theo NHÓM hay gộp?** · **dọn Transit** · **khoá ngoại**.
