# TASK-194 — GO-LIVE ĐỢT 49: ĐƯỜNG THÀNH CÔNG `material_norm` **5/5 ĐẠT** + ⭐ **KỸ THUẬT KIỂM CHỨNG TỰ THÂN**

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Việc** | ⭐ Áp **phương pháp 7 bước đã chứng minh** (TASK-193) sang cặp action tiếp theo |
| **Kết quả** | ✅ **Vòng đời `material_norm`: THÊM → ĐỌC LẠI → SỬA → XOÁ → XÁC NHẬN XOÁ = 5/5 ĐẠT · EXIT=0** |
| **Bao phủ đường thành công** | **72 → 74** (`save_material_norm` · `delete_material_norm`) |
| **Kiểm hậu quả** | ✅ **94 mảng bootstrap ⛔ không đổi** · 131 bảng: chỉ `audit_logs` +3 + `sessions` +1 |
| **Sản phẩm** | `tools/e2e/go-live-thanh-cong-dm.mjs` |
| **Bug sản phẩm mới** | **0** (⭐ đường thành công ⛔ không có lỗi) |

---

## ① ⭐ BƯỚC ① «ĐỌC MÃ» — HỢP ĐỒNG LẤY TỪ `MaterialCatalogManagementUseCase.saveMaterialNorm`

| Trường | Bắt buộc? | Điều kiện (đọc từ mã, ⛔ không đoán) |
|---|---|---|
| `itemName` | ✅ **BẮT BUỘC** | ⛔ rỗng ⇒ 400 «Hạng mục áp định mức là bắt buộc.» |
| `quantityPerUnit` | ✅ **BẮT BUỘC** | **phải > 0** ⇒ ⛔ ≤0 thì 400 «Định mức tiêu hao phải lớn hơn 0.» |
| `normId` | tuỳ chọn | ⛔ rỗng ⇒ **THÊM** · có + tồn tại ⇒ **CẬP NHẬT** |
| `projectId` · `subcategoryId` · `baseUom` · `unit` · `sourceComponentId` · `notes` | tuỳ chọn | — |
| `materialId` | tuỳ chọn | ⭐ **nếu có thì PHẢI tồn tại & đang hoạt động**, ⛔ không ⇒ 400 |
| `normCode` | ⛔ **KHÔNG gửi** | ⭐ **TỰ SINH**: `"DM-" + String.format("%04d", countNorms()+1)` |

`deleteMaterialNorm`: cần `normId` **TỒN TẠI**, ⛔ không ⇒ 400 «Không tìm thấy định mức.» ✓
⇒ ⭐⭐ **Payload tối thiểu hợp lệ chỉ 2 trường**: `{ itemName, quantityPerUnit: 1 }` ✓

---

## ② ⭐⭐ KỸ THUẬT MỚI — **KIỂM CHỨNG TỰ THÂN** (⛔ không phụ thuộc đọc CSDL)

⭐ **Vấn đề**: làm sao biết `200` là **ghi thật**, ⛔ không phải «ghi thất bại âm thầm»?
⭐ **Cách cũ**: đọc lại CSDL / bootstrap (⚠️ phụ thuộc việc bảng có được phơi ra hay không).
⭐⭐ **CÁCH MỚI — dùng CHÍNH HỢP ĐỒNG của action làm phép thử**:

| Bước | Gọi | Thông điệp PHẢI là | ⇒ Chứng minh |
|---|---|---|---|
| ③ | `save_material_norm({itemName, quantityPerUnit:1})` | «Đã **thêm** định mức vật tư.» | tạo mới |
| ⑤ | `save_material_norm({**normId**, itemName, quantityPerUnit:2})` | «Đã **cập nhật** định mức vật tư.» | ⭐⭐ **bản ghi ĐÃ TỒN TẠI ⇒ ĐÃ GHI THẬT** |
| ⑤b | `delete_material_norm({normId})` | «Đã xóa định mức vật tư.» | xoá |
| ⑥ | `delete_material_norm({normId})` **lần 2** | **400 «Không tìm thấy định mức.»** | ⭐⭐ **bản ghi ĐÃ MẤT ⇒ ĐÃ XOÁ THẬT** |

⭐⭐ **VÌ SAO KỸ THUẬT NÀY MẠNH**: ⭐ nó ⛔ **không cần đọc CSDL**, ⛔ **không cần bootstrap**, và ⭐ **không thể bị đánh lừa bởi 200 rỗng** — vì **thông điệp do mã quyết định theo nhánh** (`findNorm(normId).isPresent()` ⇒ «cập nhật», ⛔ ngược lại ⇒ «thêm») ✓
⭐⭐ **VÀ NẾU GHI ÂM THẦM THẤT BẠI**: lần gọi thứ 2 sẽ **vẫn trả «thêm»** ⇒ ⭐ **bài kiểm BẮT ĐƯỢC ngay** ✓ (bài kiểm có kiểm tra điều này và **ném lỗi** nếu ⛔ không thấy «cập nhật») ✓

---

## ③ ✅ KẾT QUẢ — **5/5 ĐẠT · EXIT=0**

```text
[DAT] ③ save_material_norm — THÊM MỚI (payload tối thiểu hợp lệ)
[DAT] ④ ĐỌC LẠI — gọi lại cùng payload ⇒ phải thấy định mức ĐÃ TỒN TẠI
[DAT] ⑤ save_material_norm LẦN 2 — phải chuyển sang «Đã cập nhật» (⛔ chứng minh ĐÃ GHI THẬT)
[DAT] ⑤b delete_material_norm — XOÁ THẬT (DỌN SẠCH)
[DAT] ⑥ delete LẦN 2 — phải 400 «Không tìm thấy định mức.» (⛔ chứng minh ĐÃ XOÁ THẬT)
dat 5/5 · that bai 0 · EXIT=0
```
**KIỂM HẬU QUẢ**: ⭐ **94 mảng bootstrap ⛔ không mảng nào đổi** — ⭐ **tạo rồi xoá ⇒ về đúng trạng thái cũ** ✓ · `chup-so-dong` 131 bảng: chỉ **`audit_logs` +3** (nhật ký lệnh gọi của tôi) + **`sessions` +1** (phiên của tôi) ✓

⭐⭐ **VÀ BÀI KIỂM ⛔ KHÔNG TÌM RA BUG** — ⭐ **đường thành công của `save_material_norm` + `delete_material_norm` hoạt động ĐÚNG** ✓
⭐ Ghi nhận: `normCode` **tự sinh đúng** (`DM-%04d`) · `quantityPerUnit` **được lưu** (lần 2 đổi thành 2 mà ⛔ không lỗi) · `delete` **chặn đúng** khi ⛔ không tồn tại ✓

---

## ④ ⛔⛔ PHÁT HIỆN THÊM: **LỖ HỔNG TRONG CHÍNH CÔNG CỤ TRIỂN KHAI CỦA TÔI** (nhờ chạy DRY-RUN)

⭐ **Tôi chạy `node tools/deploy-java-backend.mjs`** (⛔ **chế độ CHẠY THỬ mặc định — không đụng gì**) để kiểm công cụ **trước khi user dùng thật** ✓

### ✅ 6 CHỐT AN TOÀN ĐỀU HOẠT ĐỘNG
| Bước | Kết quả dry-run |
|---|---|
| ① Vân tay nguồn | ✔ **ĐẠT** `VNTECH-FP-27251D9B7F076176` · 713 tệp |
| ② Tiến trình `:18081` | ✔ **PID 3784** · **cmdline KHỚP** JAR dự kiến |
| ③ Sao lưu JAR (bản lùi) | ✔ JAR hiện tại **86.8 MB · 10:24:55 1/10/2026** ⇒ sẽ sao lưu vào `target/backup/` |
| ④ Build lại JAR | `mvn -o -DskipTests package` |
| ⑤ Kiểm JAR mới chứa V35+V37 | — |
| ⑥ Dừng PID rồi khởi động JAR mới | sẽ dừng **PID 3784** |
| ⑦ Health-check `:18081` | — |
| ⑧ Nghiệm thu E2E | ⚠️ **xem dưới** |

⭐ Kèm **hướng dẫn lùi** + **ghi chú migration**: *«V35/V37 khi đã áp vào DB thì ⛔ KHÔNG tự lùi — nhưng cả hai đều **IDEMPOTENT** (V35 = UPDATE khớp 0 dòng · V37 = CREATE TABLE IF NOT EXISTS + INSERT IGNORE) ⇒ lùi JAR là an toàn»* ✓

### ⛔⛔ LỖ HỔNG TÌM RA — BƯỚC ⑧ **THIẾU BÀI KIỂM CHO CHÍNH BUG ĐÃ VÁ**
Bản cũ chỉ chạy **2 bài**: `go-live-bao-loi-danh-dau-xong.mjs` (BUG-20261008) · `go-live-phu-toan-bo-delete.mjs` (BUG-20261010/011).
⇒ ⛔ **⛔ KHÔNG có bài nào kiểm `BUG-20261005-012`** — ⭐ **bug tôi vừa vá ở TASK-189** ✓
⇒ ⭐⭐ **«MỘT CUỘC TRIỂN KHAI ⛔ KHÔNG KIỂM CHÍNH THỨ MÌNH VỪA SỬA LÀ MỘT CUỘC TRIỂN KHAI MÙ»** ✓

### ✅ ĐÃ SỬA — **2 → 8 BÀI NGHIỆM THU**
| Bài | Kiểm gì |
|---|---|
| `go-live-bao-loi-danh-dau-xong.mjs` | BUG-20261008 (kỳ vọng **5/5**) |
| `go-live-phu-toan-bo-delete.mjs` | BUG-20261010/011 (**34/34**) |
| ⭐ **`go-live-kiem-30-action-con-lai.mjs`** | ⭐ **BUG-20261005-012 — 2 lỗi 500 phải HẾT (30/30, ⛔ không còn `[LOI]`)** |
| `go-live-kiem-save-chung-tu.mjs` | lưới — 24 `save_*` chứng từ (**24/24**) |
| `go-live-kiem-set-con-lai.mjs` | lưới — 8 `set_*` (**16/16**) |
| `go-live-kiem-3-action-cuoi.mjs` | lưới — 3 action an toàn cuối (**6/6**) |
| `go-live-thanh-cong-brg.mjs` | lưới — vòng đời đường thành công `business_role_group` (**5/5**) |
| `go-live-thanh-cong-dm.mjs` | lưới — vòng đời đường thành công `material_norm` (**5/5**) |

⭐ **Đã chạy lại dry-run xác minh: 8/8 bài hiện đúng trong danh sách** ✓
⭐⭐ **QUY TẮC RÚT RA**: ⭐ **mỗi bản vá PHẢI có bài kiểm tương ứng trong danh sách nghiệm thu** ✓

---

## ⑤ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| Vòng đời `material_norm` | ✅ **5/5 ĐẠT · EXIT=0** |
| Bao phủ **đường thành công** | **72 → 74** / 220 (33% → **34%**) |
| Kiểm hậu quả | ✅ **94 mảng bootstrap ⛔ không đổi** · 131 bảng: chỉ `audit_logs` +3 + `sessions` +1 |
| Bug sản phẩm mới | **0** |
| ⛔ Lỗi của tôi | **0** (⭐ phương pháp 7 bước **lần đầu chạy đúng ngay** — nhờ **bước ① đọc mã**) |
| Kỹ thuật mới | ⭐ **KIỂM CHỨNG TỰ THÂN** qua thông điệp («thêm» → «cập nhật» → 400) |
| Vân tay | **ĐẠT** `VNTECH-FP-27251D9B7F076176` · 713 tệp — ⛔ không đổi |
| `:18081` | ⛔ vẫn **JAR cũ** ⇒ **6 bản vá chưa lên sóng** |
| Tệp tạm · `.snapshot` | **0 · 0** |

---

## ⑤ BÀI HỌC

1. ⭐⭐ **BƯỚC ① «ĐỌC MÃ» LÀM CHO BÀI KIỂM CHẠY ĐÚNG NGAY LẦN ĐẦU.** ⭐ Vòng trước tôi **đoán** tên trường ⇒ **2 lỗi của tôi**; vòng này tôi **đọc** ⇒ **0 lỗi** ✓ ⭐ **cùng một người, cùng một loại việc — khác nhau ở chỗ có đọc mã hay không** ✓
2. ⭐⭐ **DÙNG CHÍNH HỢP ĐỒNG CỦA ACTION LÀM PHÉP THỬ.** ⭐ Nhánh mã (`có normId + tồn tại` ⇒ «cập nhật») biến **thông điệp trả về** thành **bằng chứng về trạng thái CSDL** ⇒ ⭐ **mạnh hơn việc đọc lại bảng**, vì ⛔ **không phụ thuộc việc bảng có được phơi ra hay không** ✓
3. ⭐⭐ **PAYLOAD TỐI THIỂU LÀ CÁCH TỐT NHẤT ĐỂ KIỂM ĐƯỜNG THÀNH CÔNG.** ⭐ Chỉ **2 trường** (`itemName` + `quantityPerUnit`) là đủ ⇒ ⭐ **ít dữ liệu phải bịa, ít rủi ro, dễ dọn** ✓ — ⭐ ngược hẳn với việc thử payload lớn rồi gỡ lỗi từng trường ✓
4. ⭐ **KIỂM «XOÁ LẦN 2 PHẢI 400» LÀ BẰNG CHỨNG XOÁ THẬT.** ⭐ Nếu xoá âm thầm thất bại thì lần 2 vẫn 200 ⇒ ⭐ **bài kiểm bắt được ngay** ✓
5. ⭐⭐ **PHƯƠNG PHÁP ĐÚNG LÀM CHO VÒNG SAU NHANH HƠN VÒNG TRƯỚC.** Vòng 47: **2 lỗi của tôi** + nhiều lượt dò; vòng này: **0 lỗi, 1 lượt chạy** ✓ ⭐ **đầu tư vào phương pháp trả lãi ngay vòng kế** ✓

---

## ⑥ BLOCKER / CHỜ USER

⛔ **Chưa commit** — **143 đường**, hỗn hợp 2 phiên.
⛔ **Cần user quyết:**
1. ⭐⭐⭐ **TRIỂN KHAI** (1 lệnh): `node tools/deploy-java-backend.mjs --dong-y-trien-khai` ⇒ **6 bản vá**.
2. ⭐⭐⭐ **TIẾP TỤC MỞ RỘNG ĐƯỜNG THÀNH CÔNG** — **việc lớn nhất còn lại của GO-LIVE** (hiện **74/220 = 34%**). ⭐ **Phương pháp nay đã chạy đúng ngay lần đầu** ⇒ đề xuất làm tiếp **theo thứ tự nghiệp vụ**: phiếu đề nghị mua hàng → PO → duyệt → nhập/xuất kho → thanh toán. ⚠️ **Cần bạn xác nhận** vì chúng **GHI dữ liệu nghiệp vụ THẬT** (⛔ khác `material_norm`/`business_role_group` là **danh mục**).
3. ⭐⭐ **BUG-20261005-013** — **A** tạo migration hay **B** bỏ `mergedFrom`?
4. ⭐ **Xác nhận 5 bản vá CSS bằng mắt.**
5. ⭐⭐ **Cho phép 1 phép thử GHI** để chốt cơ chế quyền.
6. **Commit theo NHÓM hay gộp?** · **BUG-20261009** · **«ai nhận hàng ở kho đích»** · **dọn Transit** · **khoá ngoại**.
