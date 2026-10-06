# TASK-154 — GO-LIVE ĐỢT 9: QUÉT RỘNG TOÀN HỆ THỐNG BẰNG BỘ E2E

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Mục đích** | §20 «CHECK REMAINING BUGS → CONTINUE»: quét rộng để **tìm bug mới**, không chờ user |
| **Kết quả** | ✅ **Hệ thống ổn định rộng** — chuỗi lớn **91/91 ĐẠT**, workflow động **10/10 ĐẠT** · 1 **bất đồng test↔RBAC** cần chốt |
| **Vân tay** | ⛔ Không đổi |

---

## ① CÁCH QUÉT

Chạy **tuần tự 12 script E2E** (`tools/e2e/giai-doan-01…09`) trên **môi trường THẬT** `:9000` → Java `:18081` → MySQL, thu kết quả từng script.

## ② KẾT QUẢ

| Script | Kết quả | Phân loại |
|---|---|---|
| **`giai-doan-03`** | **`Bước ĐẠT: 91/91 · thất bại 0`** | ✅ **chuỗi nghiệp vụ lớn nhất chạy trọn** |
| **`giai-doan-09`** | **`dat 10/10 · that bai 0`** | ✅ workflow động / chống hardcode |
| `giai-doan-04` | `dat 1/1` | ✅ |
| `giai-doan-05b` | `dat 1/1` — chuỗi phân công hiện đủ 5 bước đúng người, **không mất** phân công dự án khác | ✅ |
| `giai-doan-05-06` | chuỗi 5 bước **approved** đúng owner từng bước | ✅ |
| `giai-doan-08c` | `PX-E2E-DA-01-2026-0009 · completed` · «**cả 4 mốc khớp**» | ✅ |
| `giai-doan-01` | `dat 0/2` — `create_project_team` báo «Mã hoặc tên tổ đội đã tồn tại» | ⓘ **chạy lại trên dữ liệu có sẵn** — ⛔ không phải lỗi |
| `giai-doan-02` | `dat 0/1` — `save_workflow` báo «Mã quy trình đã tồn tại» | ⓘ cùng loại |
| `giai-doan-05a` | `dat 0/0` | ⓘ không còn việc |
| `giai-doan-07` | `dat 0/0` · EXIT=1 — «không có PO nào sang `waiting_delivery`» | ⓘ **điều kiện tiên quyết đã cạn** (mọi PO đã xử lý) |
| `giai-doan-08a` | `dat 0/0` · EXIT=0 | ⓘ hết phiếu nhập chờ BCH |
| **`giai-doan-08b`** | **EXIT=1** — `receive_transfer_order` bị chặn quyền | ⚠️ **bất đồng test ↔ RBAC** (xem ③) |

⇒ **Kết luận quét: KHÔNG phát hiện bug sản phẩm mới.** Các điểm đỏ đều là **dữ liệu đã cạn** hoặc **chạy lại trên dữ liệu có sẵn**, ⛔ không phải lỗi.

---

## ③ ⚠️ BẤT ĐỒNG CẦN CHỐT (MEDIUM) — AI ĐƯỢC NHẬN HÀNG Ở KHO ĐÍCH?

| | |
|---|---|
| **HIỆN TƯỢNG** | `tools/e2e/giai-doan-08b.mjs` bước ④ `receive_transfer_order` chạy bằng **`e2e.tk`** (thủ kho) và **bị chặn**: «Tài khoản chưa được quản trị viên cấp đúng quyền cho thao tác này.» |
| **VÌ SAO** | `giai-doan-08b` đăng nhập `e2e.tk` ở bước ③ (`ship_transfer_order`) rồi **không đăng nhập lại** ⇒ bước ④ vẫn dùng `e2e.tk`. Mà `receive_transfer_order` được RBAC gắn **`inventory · canApprove`**, còn `e2e.tk` chỉ có **`inventory · canEdit`** (đo từ API: `canApprove = 0`). |
| **BẰNG CHỨNG CHIỀU NGƯỢC** | Trong `tools/e2e/go-live-vong-doi-kho.mjs` (đợt 7), **cùng action đó chạy bằng `e2e.khnv` và THÀNH CÔNG** (`TRF-2026-00002…00006` đều `received`) ⇒ **năng lực nhận hàng CÓ tồn tại và hoạt động**, chỉ khác tài khoản. |
| **VÌ SAO KHÔNG TỰ SỬA** | ⛔ **D-044**: khi test đỏ, phải xác định **BÊN NÀO ĐÚNG** rồi sửa phía còn lại — ⛔ không hạ test cho xanh. Ở đây **hai bên đều có lý**:<br>· **RBAC của sản phẩm** nói `receive_transfer_order` cần `inventory.canApprove` (quyền DUYỆT).<br>· **Ý định của bài test** (chú thích dòng 87: «*Thủ kho (e2e.tk) xác nhận nhận tại kho đích*») nói **thủ kho kho đích** phải nhận được.<br>Đây là **quyết định nghiệp vụ**, ⛔ không phải quyết định kỹ thuật của tôi. |
| **HAI LỰA CHỌN** | **(a)** Đúng theo RBAC ⇒ sửa bài test dùng tài khoản có `inventory.canApprove` (như `go-live-vong-doi-kho.mjs`).<br>**(b)** Đúng theo nghiệp vụ ⇒ cấp thêm `inventory.canApprove` cho **thủ kho kho đích** (đổi dữ liệu phân quyền — có ý nghĩa nghiệp vụ). |
| **TRẠNG THÁI** | **REPORTED — chờ user chốt.** ⛔ Không sửa bên nào. |

---

## ④ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| Chuỗi E2E lớn nhất (`giai-doan-03`) | **91/91 ĐẠT** |
| Workflow động (`giai-doan-09`) | **10/10 ĐẠT** |
| Bug sản phẩm MỚI | **0** |
| Bất đồng cần chốt | **1** (`receive_transfer_order` ↔ `e2e.tk`) |
| `mvn -o test` (đo lại cuối vòng) | **148 test · 0 failure · 0 error** |
| Vân tay | **ĐẠT** `VNTECH-FP-614484381419C595` — **không đổi** |
| Tệp tạm | **0** |
| `:18081` | ⛔ vẫn **JAR cũ** ⇒ **2 bản vá HIGH chưa lên sóng** |

---

## ⑤ BÀI HỌC

1. ⭐ **QUÉT RỘNG BẰNG BỘ E2E SẴN CÓ LÀ CÁCH TÌM BUG RẺ NHẤT** — 12 script, ~15 phút, phủ toàn hệ thống; kết quả «91/91» là **bằng chứng ổn định** đáng tin hơn mọi lời khẳng định.
2. ⛔ **ĐỎ KHÔNG LUÔN LÀ BUG.** 4/12 script đỏ vì **dữ liệu đã cạn** hoặc **chạy lại trên dữ liệu có sẵn** (idempotency). Phải **phân loại** trước khi báo.
3. ⛔ **D-044 áp dụng cho CẢ HAI CHIỀU**: không hạ test cho xanh, **và cũng không** tự sửa sản phẩm khi chưa biết bên nào đúng. Gặp bất đồng ⇒ **ghi nhận + chờ chốt**, ⛔ không đoán.
4. ⭐ **So hai bài test cùng chạm một action** (`giai-doan-08b` vs `go-live-vong-doi-kho`) cho ra bằng chứng quyết định: năng lực **có** tồn tại, vấn đề chỉ là **tài khoản nào**.

---

## ⑥ BLOCKER / CHỜ USER

⛔ **Chưa commit**.
⛔ **Cần user quyết — nay 5 việc, mục 1 gấp nhất:**
1. ⭐ **Cho phép `mvn -o -DskipTests package` + khởi động lại Java `:18081`** — đang có **2 BẢN VÁ HIGH CHƯA LÊN SÓNG** (BUG-003 · BUG-005). Làm việc này **ghi luôn `V35`+`V37`** vào `flyway_schema_history`.
2. **Chốt bất đồng ③**: ai được nhận hàng ở kho đích — tài khoản có quyền DUYỆT, hay **thủ kho kho đích**?
3. **4 phiếu trả Kho Tổng kẹt `in_transit` + 9 đơn vị kẹt ở `WH-TRANSIT`** — dọn thế nào sau triển khai?
4. Mở task «thêm thành viên tổ đội»?
5. Commit?

ⓘ **Đính chính câu hỏi cũ:** `AGENTS.md` **KHÔNG** hề nhắc Maven ⇒ **không cần sửa** (câu hỏi trước của tôi dựa trên giả định sai). Định đề cũ chỉ nằm ở `MASTER_STATUS.md` (đã sửa) và nhật ký lịch sử TASK-142/143/144 (⛔ không nên viết lại lịch sử).
