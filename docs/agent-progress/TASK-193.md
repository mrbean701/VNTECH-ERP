# TASK-193 — GO-LIVE ĐỢT 48: ⭐ **MỞ RỘNG SANG ĐƯỜNG THÀNH CÔNG** — vòng đời `business_role_group` **5/5 ĐẠT**

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Động lực** | ⭐ **TASK-192 đo được chỉ 69/220 (31%) action từng GỌI THÀNH CÔNG** — vì kỹ thuật «ID BỊA ⇒ 400» **chỉ chạy ĐƯỜNG TỪ CHỐI** |
| **Kết quả** | ✅ **Vòng đời đầy đủ: TẠO → ĐỌC LẠI → SỬA → XOÁ → ĐỌC LẠI = 5/5 ĐẠT · EXIT=0** |
| **Bao phủ đường thành công** | **69 → 72** action (+3: `save_` · `set_status_` · `delete_business_role_group`) |
| **Kiểm hậu quả** | ✅ **94 mảng bootstrap ⛔ không đổi** (tạo rồi xoá ⇒ về như cũ) · 131 bảng: chỉ `audit_logs` +3 + `sessions` +1 |
| **Sản phẩm** | `tools/e2e/go-live-thanh-cong-brg.mjs` |
| **⛔ TỰ PHÊ** | **2 lỗi CỦA TÔI** — payload **đoán** tên trường · bài kiểm **báo động giả dây chuyền** |

---

## ① ⭐ KẾT QUẢ — **5/5 ĐẠT · EXIT=0**

```text
[DAT] ① save_business_role_group (TẠO THẬT)
[DAT] ② ĐỌC LẠI — phải THẤY bản ghi vừa tạo
[DAT] ③ set_business_role_group_status (SỬA THẬT)
[DAT] ④ delete_business_role_group (XOÁ THẬT — DỌN SẠCH)
[DAT] ⑤ ĐỌC LẠI — ⛔ không còn bản ghi nào mang mã dọn
KET QUA: dat 5/5 · that bai 0 · EXIT=0
```
⭐ **HẬU QUẢ SẠCH**: **94 mảng bootstrap ⛔ KHÔNG mảng nào đổi** (⭐ **tạo rồi xoá ⇒ về đúng trạng thái cũ** ✓) · `chup-so-dong` 131 bảng: **chỉ `audit_logs` +3** (nhật ký lệnh gọi của tôi) + **`sessions` +1** (phiên của tôi) ⇒ ⭐ **cả hai đều bình thường** ✓

⭐⭐ **VÀ BÀI KIỂM ⛔ KHÔNG TÌM RA BUG** — ⭐ **đường thành công của 3 action này hoạt động ĐÚNG** ✓ — ⭐ **đó cũng là kết quả có giá trị: nó CHỨNG MINH chúng chạy được** ✓

---

## ② ⛔⛔ HAI LỖI **CỦA TÔI** — VÀ CẢ HAI ĐỀU ĐÁNG GHI

### ⛔ Lỗi 1 — **PAYLOAD SAI VÌ TÔI ĐOÁN TÊN TRƯỜNG** (⛔ không đọc mã)
Lần chạy đầu: `save_business_role_group` trả **400 «Tên hoặc quyền nền của nhóm nghiệp vụ chưa hợp lệ.»**
⛔ **Tôi đã gửi**: `groupCode` · `permissions: []` · (⛔ thiếu `engineRole`)
✅ **Mã thật đọc** (`AdminSystemUseCase.saveBusinessRoleGroup`) **dùng**:
```java
String requestedCode = trim(payload.get("code")).toLowerCase();     // ⭐ "code", ⛔ không phải "groupCode"
String engineRole = trim(payload.get("engineRole"));                // ⭐ phải thuộc ALLOWED_ENGINES
List<String> scopeIds = distinctScopeIds(payload.get("scopeIds"));  // ⭐ BẮT BUỘC, ⛔ rỗng thì ném 400
if (name.isEmpty() || !ALLOWED_ENGINES.contains(engineRole)) throw Api("Tên hoặc quyền nền … chưa hợp lệ.");
if (scopeIds.isEmpty()) throw Api("Nhóm quyền phải có ít nhất một Phạm vi nghiệp vụ.");
```
⭐ **Và dữ liệu THẬT** phải đọc từ CSDL: `ALLOWED_ENGINES` = `engineer · commander · project · procurement · accountant · warehouse · team · director` (`AdminSystemUseCase:317`) · `scopeId` thật = **`BSCOPE-BCH`** (từ `business_scope_catalog`, `active=1`) ✓
⭐⭐ **BÀI HỌC: ⛔ ĐỪNG ĐOÁN TÊN TRƯỜNG — ĐỌC MÃ.** ⭐ Và: **tên API ⛔ không suy ra được từ tên action** (`save_business_role_group` ⛔ không nhận `groupCode`) ✓

### ⛔ Lỗi 2 — **BÀI KIỂM BÁO ĐỘNG GIẢ DÂY CHUYỀN**
Khi bước ① hỏng, bài kiểm **vẫn báo ②③④ là THẤT BẠI**, in ra:
```text
② «⛔ save trả 200 nhưng ⛔ KHÔNG thấy bản ghi ⇒ GHI THẤT BẠI ÂM THẦM»   ← ⛔ SAI: save trả 400
④ «⛔ KHÔNG DỌN ĐƯỢC — phải dọn tay!»                                  ← ⛔ SAI: ⛔ không có gì để dọn
```
⇒ ⭐⭐ **Đó là TÍN HIỆU SAI** — người đọc sẽ tưởng có **3 lỗi sản phẩm** trong khi thực tế **chỉ 1 lỗi payload của bài test**, và **⛔ không có gì bị ghi vào CSDL** ✓
✅ **ĐÃ SỬA**: khi ① hỏng ⇒ ②③④ **BỎ QUA CÓ GHI CHÚ** (`[BO QUA]`), ⛔ **không tính là thất bại**, kèm dòng **«⛔ KHÔNG có bản rác nào được tạo ⇒ ⛔ không cần dọn»** ✓
⭐⭐ **CÙNG LOẠI LỖI ĐÃ GẶP** (`tomTatBuoc` thiếu tham số ở TASK-181) ⇒ ⭐ **một bài kiểm báo thất bại giả còn tệ hơn ⛔ không có bài kiểm** ✓

---

## ③ ⭐ PHƯƠNG PHÁP ĐÃ THÀNH CÔNG — DÙNG LẠI CHO CÁC ACTION CÒN LẠI

```text
① ĐỌC MÃ UseCase  ⇒ biết TÊN TRƯỜNG payload + điều kiện hợp lệ (⛔ không đoán)
② ĐỌC CSDL        ⇒ lấy ID/mã THẬT cần thiết (vd scopeId, engineRole hợp lệ)
③ TẠO THẬT        ⇒ payload đúng ⇒ kỳ vọng 200
④ ĐỌC LẠI         ⇒ ⛔ KHÔNG TIN lời hứa 200 — phải THẤY bản ghi (⭐ bắt được «ghi thất bại âm thầm»)
⑤ SỬA + XOÁ THẬT  ⇒ ⛔ nếu ⛔ không xoá được ⇒ BÁO ĐỘNG (⛔ không bỏ qua)
⑥ ĐỌC LẠI         ⇒ xác nhận ĐÃ SẠCH
⑦ KIỂM HẬU QUẢ    ⇒ đối chiếu MỌI mảng bootstrap + `chup-so-dong.mjs`
```
⭐ **Bước ④ là bước quan trọng nhất** — nó phân biệt «API trả 200» với «dữ liệu THẬT SỰ được ghi» ✓
⭐ **Bước ⑥+⑦ chứng minh «tạo rồi xoá ⇒ về như cũ»** — ⭐ **điều kiện để chạy được trên hệ thật** ✓

---

## ④ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| Vòng đời `business_role_group` | ✅ **5/5 ĐẠT · EXIT=0** |
| Bao phủ **đường thành công** | **69 → 72** / 220 (31% → **33%**) |
| Kiểm hậu quả | ✅ **94 mảng bootstrap ⛔ không đổi** · 131 bảng: chỉ `audit_logs` +3 + `sessions` +1 |
| Bug sản phẩm mới | **0** (⭐ **đường thành công của 3 action này ⛔ không có lỗi**) |
| ⛔ Lỗi của tôi | **2** — payload đoán tên trường · báo động giả dây chuyền (**đã sửa cả hai**) |
| Vân tay | **ĐẠT** `VNTECH-FP-27251D9B7F076176` · 713 tệp — ⛔ không đổi |
| `:18081` | ⛔ vẫn **JAR cũ** ⇒ **6 bản vá chưa lên sóng** |
| Tệp tạm · `.snapshot` | **0 · 0** |

---

## ⑤ BÀI HỌC

1. ⭐⭐ **⛔ ĐỪNG ĐOÁN TÊN TRƯỜNG — ĐỌC MÃ.** `save_business_role_group` ⛔ **không** nhận `groupCode`/`permissions`; nó nhận **`code`/`engineRole`/`scopeIds`** ✓ ⭐ **tên API ⛔ không suy ra được từ tên action** ✓
2. ⭐⭐ **ĐỌC CSDL ĐỂ LẤY DỮ LIỆU THẬT.** `scopeId` phải là **`BSCOPE-BCH`** (đọc từ `business_scope_catalog`) và `engineRole` phải thuộc **`ALLOWED_ENGINES`** — ⛔ **cả hai đều ⛔ không đoán được** ✓
3. ⭐⭐ **BƯỚC «ĐỌC LẠI» LÀ BƯỚC QUAN TRỌNG NHẤT.** ⛔ **Không tin lời hứa 200** — phải **THẤY bản ghi** ⇒ ⭐ nó phân biệt «API trả 200» với «dữ liệu THẬT SỰ được ghi» ✓
4. ⭐⭐ **MỘT BÀI KIỂM BÁO THẤT BẠI GIẢ CÒN TỆ HƠN ⛔ KHÔNG CÓ BÀI KIỂM.** ⭐ Bài của tôi in **3 «thất bại»** trong khi thực tế **chỉ 1 lỗi payload** và **⛔ không có gì bị ghi** ⇒ ✅ **sửa: khi bước đầu hỏng thì các bước sau BỎ QUA CÓ GHI CHÚ** ✓
5. ⭐⭐ **CHẠY ĐƯỢC ĐƯỜNG THÀNH CÔNG TRÊN HỆ THẬT ĐÒI HỎI «TẠO RỒI XOÁ VỀ NHƯ CŨ».** ⭐ **94 mảng bootstrap ⛔ không đổi** là **bằng chứng** điều đó ✓ — ⭐ **và đó là điều kiện để được phép chạy trên hệ thật** ✓

---

## ⑥ BLOCKER / CHỜ USER

⛔ **Chưa commit** — **142 đường**, hỗn hợp 2 phiên.
⛔ **Cần user quyết:**
1. ⭐⭐⭐ **TRIỂN KHAI** (1 lệnh): `node tools/deploy-java-backend.mjs --dong-y-trien-khai` ⇒ **6 bản vá**.
2. ⭐⭐⭐ **TIẾP TỤC MỞ RỘNG ĐƯỜNG THÀNH CÔNG** — ⭐ **việc lớn nhất còn lại của GO-LIVE** (hiện **72/220 = 33%**). ⭐ Phương pháp ở §③ **đã được chứng minh** ⇒ đề xuất làm tiếp **theo thứ tự nghiệp vụ**: phiếu đề nghị mua hàng → PO → duyệt → nhập/xuất kho → thanh toán. ⚠️ **Cần bạn xác nhận** vì **chúng GHI dữ liệu nghiệp vụ thật** (⛔ khác `business_role_group` là danh mục phụ).
3. ⭐⭐ **BUG-20261005-013** — **A** tạo migration hay **B** bỏ `mergedFrom`?
4. ⭐ **Xác nhận 5 bản vá CSS bằng mắt.**
5. ⭐⭐ **Cho phép 1 phép thử GHI** để chốt cơ chế quyền.
6. **Commit theo NHÓM hay gộp?** · **BUG-20261009** · **«ai nhận hàng ở kho đích»** · **dọn Transit** · **khoá ngoại**.
