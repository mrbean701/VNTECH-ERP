# KỊCH BẢN KIỂM THỬ — để anh test trực tiếp trên hệ thống

| | |
|---|---|
| **Ngày soạn** | 06/10/2026 |
| **Mục đích** | ⭐ Anh yêu cầu *«dọn dữ liệu rác rồi nhập lại dữ liệu để tôi test»* ⇒ ⭐ tài liệu này **hướng dẫn test theo trình tự**, dùng **đúng dữ liệu đã kiểm kê** — ⛔ anh không phải tự nghĩ ra |
| **Trạng thái** | ⛔ **Dữ liệu chưa được dọn/nhập lại** (⭐ đang **tạm dừng** theo yêu cầu) — ⭐ nhưng **mọi thứ cần test ĐÃ CÓ SẴN** (xem `KIEM-KE-DU-LIEU-TEST.md`) |
| **Môi trường** | UI qua proxy **`:9000`** (hệ thật: Java `:18081` → MySQL `vntech_erp`) |
| ⚠️ **Lưu ý** | ⭐ Tài liệu mô tả theo **CHỨC NĂNG** (⛔ không theo đường dẫn menu chính xác) vì **tên menu trên giao diện có thể khác** — ⭐ anh tìm theo tên chức năng |

---

## ① TÀI KHOẢN ĐỂ TEST

⭐ **Mật khẩu chung cho tất cả tài khoản `e2e.*`**: `Vn@2026Test`

| Tài khoản | ⭐ Vai trò / dùng để làm gì | ⭐ Bằng chứng đã chạy được |
|---|---|---|
| **`admin`** | ⭐ Quản trị: tạo tài khoản · phòng ban · phân quyền · xem **chi tiết báo lỗi** | ⭐ mật khẩu `Admin123456@` |
| **`e2e.khnv`** | ⭐ **Phòng Kế hoạch** — lập phiếu đề nghị mua · **lập PO** | ✅ đã tạo PO thành công (`create_po` ok) |
| **`e2e.kt`** | ⭐ **Kế toán** — **phê duyệt / phát hành PO** | ✅ đã phát hành PO thành công (`approve_po` ok) |
| **`e2e.tk`** | ⭐ **Thủ kho** — **giao nhận hàng** (nhập kho) | ✅ đã nhận hàng thành công (`receive_goods` ok) |
| **`e2e.cht`** | ⭐ **Chỉ huy trưởng** — **BCH xác nhận giao hàng** | ✅ đã xác nhận thành công (`confirm_delivery` ok) |
| **`e2e.thuky`** | ⭐ **Thư ký TGĐ** — duyệt **bước 2** của luồng mua hàng | ✅ đã duyệt (`decide_approval` ok) |
| **`e2e.project`** | ⭐ **Phòng Dự án** — duyệt **bước 3** · ⚠️ **là tài khoản DUY NHẤT nhận được việc qua `create_work_item`** | ✅ đã duyệt |
| **`e2e.chtsa`** | ⭐ Duyệt bước duyệt | ✅ đã duyệt |
| **`e2e.bgd`** | ⭐ **Ban Giám đốc** — duyệt **bước 5 (Giám đốc)** | ✅ đã duyệt |
| **`e2e.ns`** | ⭐ **Nhân sự** — thêm **hồ sơ nhân sự / hợp đồng lao động / bảo hiểm** | ⓘ theo tên tài khoản |
| **`e2e.to`** | ⭐ **Tổ đội** — xuất kho cho tổ đội · tổ đội **trả lại vật tư** | ⓘ theo tên tài khoản |
| **`e2e.ksda`** | ⭐ **Kỹ sư dự án** — lập phiếu đề nghị mua | ⓘ theo tên tài khoản |
| **`e2e.thukysa`** · **`e2e.kh`** · **`e2e.diag`** | ⭐ Các vai trò bổ trợ | ⓘ theo tên tài khoản |

> ⭐ **Tổng: 28 tài khoản** (14 là `e2e.*`) · **11 phòng ban** · **17 vai trò đang bật**

---

## ② KỊCH BẢN 1 — QUẢN TRỊ: TÀI KHOẢN · PHÒNG BAN · PHÂN QUYỀN

| Bước | Tài khoản | ⭐ Việc cần làm | ⭐ Kết quả mong đợi |
|---|---|---|---|
| 1.1 | `admin` | Vào chức năng **quản trị người dùng** → xem danh sách | ⭐ Thấy **28 tài khoản** |
| 1.2 | `admin` | **Tạo 1 tài khoản mới** thuộc 1 phòng ban | ✅ Tạo được; tài khoản xuất hiện trong danh sách |
| 1.3 | `admin` | Mở tài khoản vừa tạo → **gán quyền theo chức năng** | ✅ Lưu được; ⭐ **kiểm cột «nguồn quyền»** phải là **«ghi đè cá nhân»** (⛔ không phải «mặc định phòng ban») — ⚠️ đây là lỗi **`BUG-20261005-003`** đã vá nhưng **chưa triển khai**, nên **có thể còn sai** ⇒ ⭐ **nếu thấy sai, báo lại ngay** |
| 1.4 | `admin` | **Xoá 1 dòng quyền** của tài khoản đó | ✅ Xoá được |
| 1.5 | `admin` | ⚠️ **Thử xoá 1 dòng quyền bằng mã bịa** (nếu giao diện cho phép) | ⭐ Kỳ vọng **báo lỗi** — ⚠️ lỗi `BUG-20261011` **đã vá nhưng chưa triển khai** ⇒ có thể còn trả «thành công» oan |
| 1.6 | `admin` | **Xoá tài khoản** vừa tạo | ✅ Xoá được; tài khoản biến khỏi danh sách |

---

## ③ KỊCH BẢN 2 — NHÂN SỰ: HỒ SƠ · HỢP ĐỒNG · BẢO HIỂM

| Bước | Tài khoản | ⭐ Việc cần làm | ⭐ Kết quả mong đợi |
|---|---|---|---|
| 2.1 | `e2e.ns` | Vào chức năng **hồ sơ nhân sự** → xem danh sách | ⭐ Thấy **26 hồ sơ** |
| 2.2 | `e2e.ns` | **Thêm 1 hồ sơ nhân sự mới** (điền đầy đủ thông tin cá nhân) | ✅ Lưu được |
| 2.3 | `e2e.ns` | Vào **hợp đồng lao động** → **tạo hợp đồng** cho nhân sự vừa thêm | ⭐ Thấy **26 hợp đồng** hiện có; ✅ tạo thêm được |
| 2.4 | `e2e.ns` | Vào **bảo hiểm & chế độ** → thêm bản ghi | ⭐ Thấy **52 bản ghi** hiện có; ✅ thêm được |
| 2.5 | `e2e.ns` | **Sửa** hồ sơ vừa tạo (đổi 1 trường) | ✅ Lưu được, dữ liệu đổi đúng |
| 2.6 | `e2e.ns` | **Xoá** hồ sơ vừa tạo | ✅ Xoá được |
| 2.7 | `admin` | ⭐ **Kiểm quyền**: đăng nhập tài khoản **không thuộc phòng nhân sự** → thử vào hồ sơ nhân sự | ⭐ Kỳ vọng **bị chặn** (⛔ không xem được) |

---

## ④ KỊCH BẢN 3 — ⭐ **LUỒNG MUA HÀNG** (quan trọng nhất — 04 bước duyệt + 03 bước cung ứng)

⭐ **Cấu trúc luồng chuẩn**: **Bước 2** Thư ký TGĐ → **Bước 3** Phòng Dự án → **Bước 4** Phòng Kế hoạch → **Bước 5** Giám đốc → **Bước 101** Lập & phát hành PO → **Bước 102** Giao nhận → **Bước 103** BCH xác nhận
⭐ **Bước 1 (CHT) đang TẮT** ⇒ phiếu mới **sinh ra ở bước 2** — ⭐ **đúng thiết kế, ⛔ không phải lỗi**

| Bước | Tài khoản | ⭐ Việc cần làm | ⭐ Kết quả mong đợi |
|---|---|---|---|
| 3.1 | `e2e.ksda` (hoặc `e2e.khnv`) | **Lập phiếu đề nghị mua hàng**: chọn dự án · thêm 2–3 dòng vật tư (⭐ dùng mã `E2E-*`) · kho nhận | ✅ Lưu được; ⭐ trạng thái = **chờ duyệt**, **bước = 2** |
| 3.2 | `e2e.thuky` | Mở phiếu → **Duyệt** | ✅ Qua **bước 3** |
| 3.3 | ⭐ **ĐỔI NGƯỜI**: `e2e.project` | Mở cùng phiếu → **Duyệt** | ✅ Qua **bước 4** — ⭐ **đây là phép thử «đổi user trong workflow»** |
| 3.4 | ⭐ **ĐỔI NGƯỜI**: `e2e.khnv` | Mở cùng phiếu → **Duyệt** | ✅ Qua **bước 5** |
| 3.5 | ⭐ **ĐỔI NGƯỜI**: `e2e.bgd` | Mở cùng phiếu → **Duyệt** | ✅ Phiếu chuyển **đã duyệt**, chờ lập PO |
| 3.6 | `e2e.khnv` | **Lập PO** từ phiếu đã duyệt | ✅ Tạo được PO; ⭐ trạng thái PO = **chờ phát hành** |
| 3.7 | `e2e.kt` | ⭐ **PHÁT HÀNH PO** (duyệt PO) | ✅ PO chuyển **chờ giao hàng** — ⚠️ **(F1)** lỗi này **ĐÃ VÁ** ⇒ ⭐ nếu vẫn **403**, báo lại ngay |
| 3.8 | `e2e.tk` | **Nhận hàng** (nhập kho) cho PO đã phát hành | ✅ Tạo phiếu nhập; ⭐ **tồn kho tăng** |
| 3.9 | `e2e.cht` | **BCH xác nhận giao hàng** | ✅ Phiếu chuyển **hoàn tất** |
| 3.10 | ⚠️ **PHÉP THỬ ÂM (quan trọng)**: `e2e.tk` | ⭐ **Thử nhận hàng cho 1 PO CHƯA phát hành** (⭐ có **04 PO** đang «chờ phát hành») | ⚠️ **Hiện tại vẫn nhận được = LỖI F2** ⇒ ⭐ **báo lại để tôi vá** (⭐ kỳ vọng đúng: **phải bị chặn**) |
| 3.11 | `admin` | Xem **lịch sử duyệt** của phiếu | ✅ Thấy đủ **04 bước** + người duyệt từng bước |

⭐ **Dữ liệu sẵn có để test**: **91 phiếu mua** (⭐ **12 phiếu đã hoàn tất chuỗi**) · **31 PO** · **7 nhà cung cấp**

---

## ⑤ KỊCH BẢN 4 — **XUẤT – NHẬP KHO**

| Bước | Tài khoản | ⭐ Việc cần làm | ⭐ Kết quả mong đợi |
|---|---|---|---|
| 4.1 | `e2e.tk` | Xem **danh sách phiếu nhập kho** | ⭐ Thấy **36 phiếu** |
| 4.2 | `e2e.tk` | **Tạo phiếu nhập kho** (có ảnh giao hàng) | ✅ Lưu được; tồn kho tăng |
| 4.3 | `e2e.tk` | **Tạo phiếu xuất kho** | ⭐ Thấy **32 phiếu** hiện có; ✅ tạo được |
| 4.4 | `e2e.tk` | **Tạo phiếu chuyển kho** (kho A → kho trung chuyển) | ⭐ Thấy **06 phiếu**; ✅ tạo được |
| 4.5 | `e2e.tk` | **Nhận hàng ở kho đích** của phiếu chuyển | ✅ Hàng về kho đích; ⭐ **sổ kho ghi đúng** |
| 4.6 | `e2e.tk` | **Trả hàng về kho trung tâm** | ⚠️ **(BUG-20261005-005)** lỗi này **đã vá nhưng chưa triển khai** ⇒ ⭐ **nếu phiếu bị kẹt ở «đang vận chuyển», báo lại ngay** |
| 4.7 | `admin` | Xem **sổ kho** (lịch sử xuất nhập) | ⭐ Thấy **96 dòng**; ⭐ **kiểm số dư khớp** với phiếu nhập/xuất |

---

## ⑥ KỊCH BẢN 5 — **CẤP PHÁT – HOÀN TRẢ** (cho tổ đội)

| Bước | Tài khoản | ⭐ Việc cần làm | ⭐ Kết quả mong đợi |
|---|---|---|---|
| 5.1 | `admin` | Xem **tổ đội** | ⭐ Thấy **05 tổ đội · 15 thành viên** |
| 5.2 | `e2e.to` | **Xuất kho cho tổ đội** (cấp phát vật tư) | ✅ Tạo được phiếu xuất cho tổ đội |
| 5.3 | `e2e.to` | **Tổ đội trả lại vật tư** (hoàn trả) | ✅ Tạo được phiếu hoàn trả — ⭐ **luồng này CHẠY SẠCH** (⭐ 9/9 phiếu hiện có đã nhận) |
| 5.4 | `e2e.tk` | **Nhận lại vật tư** tổ đội trả | ✅ Hàng nhập lại kho; tồn kho tăng |
| 5.5 | `admin` | Kiểm **sổ kho** sau khi hoàn trả | ✅ Có dòng nhập tương ứng |

---

## ⑦ KỊCH BẢN 6 — ⭐ **BÁO LỖI – GÓP Ý** (câu hỏi anh nêu: **admin có xem được chi tiết không?**)

| Bước | Tài khoản | ⭐ Việc cần làm | ⭐ Kết quả mong đợi |
|---|---|---|---|
| 6.1 | ⭐ **1 tài khoản thường** (ví dụ `e2e.ksda`) | Vào chức năng **báo lỗi – góp ý** → **gửi 1 báo lỗi MỚI** với nội dung mô tả rõ + (nếu có) ảnh | ✅ Gửi được; ⭐ ghi lại **mã báo lỗi** |
| 6.2 | ⭐ **`admin`** | Mở **danh sách báo lỗi** | ⭐ Thấy **16 báo lỗi** (13 đang mở) — ⭐ **kiểm báo lỗi vừa gửi CÓ trong danh sách** |
| 6.3 | ⭐ **`admin`** | **Mở CHI TIẾT** báo lỗi vừa gửi | ⭐ **PHẢI xem được**: nội dung · người gửi · thời gian · ảnh đính kèm 👈 ⭐ **đây chính là điều anh cần xác nhận** |
| 6.4 | `admin` | **Đánh dấu «đã xử lý»** báo lỗi đó | ✅ Chuyển trạng thái — ⚠️ **(BUG-20261005-008)** đã vá nhưng **chưa triển khai** ⇒ ⭐ nếu **mở lại bị lỗi**, báo lại |
| 6.5 | `admin` | ⭐ **Kiểm quyền**: đăng nhập tài khoản **⛔ không có quyền admin** → thử xem báo lỗi của người khác | ⭐ Kỳ vọng **bị chặn** |

---

## ⑧ KỊCH BẢN 7 — ⭐ **THÔNG BÁO WEB** (+ email noti)

| Bước | Tài khoản | ⭐ Việc cần làm | ⭐ Kết quả mong đợi |
|---|---|---|---|
| 7.1 | `admin` | Xem **cấu hình thông báo** | ⚠️ Hiện **chỉ có 01 cấu hình** ⇒ ⚠️ **cần thêm cấu hình** mới test đầy đủ được |
| 7.2 | `admin` | **Tạo 1 cấu hình thông báo** kênh `web` có **thời gian hiệu lực** (từ ngày → đến ngày) | ✅ Lưu được |
| 7.3 | `e2e.project` | Đăng nhập → xem **chuông thông báo** | ⭐ Thấy **huy hiệu số** (⭐ hiện có **12 thông báo công việc**) |
| 7.4 | `e2e.project` | **Bấm vào 1 thông báo** | ✅ Đánh dấu đã đọc; huy hiệu giảm |
| 7.5 | `e2e.project` | **«Đánh dấu tất cả đã đọc»** | ✅ Huy hiệu **giảm phần thông báo hệ thống** — ⚠️ ⭐ **lưu ý**: nút này **CỐ Ý ⛔ không xoá thông báo CÔNG VIỆC** (⭐ thiết kế: 2 cơ chế song song) ⇒ ⭐ **huy hiệu có thể ⛔ không về 0 hoàn toàn** — ⛔ **đây KHÔNG phải lỗi** |
| 7.6 | `admin` | Xem **hộp thư gửi đi** (email) | ⭐ Kiểm **email noti** có được xếp hàng chờ gửi không |

---

## ⑨ ⚠️ **NHỮNG LỖI ĐÃ BIẾT — ĐỪNG NHẦM LÀ LỖI MỚI**

| # | Hiện tượng | ⭐ Bản chất |
|---|---|---|
| 1 | ⚠️ **04 lỗi 500 vẫn xảy ra** (xem danh mục vật tư · xem phụ thuộc vật tư · lưu chứng từ KT ngày sai · trả hàng kho TW) | ⭐ **ĐÃ VÁ nhưng CHƯA TRIỂN KHAI** ⇒ ⭐ **báo lại nếu gặp** |
| 2 | ⚠️ **Nhận hàng cho PO chưa phát hành vẫn thành công** | ⭐ **LỖI F2 — chưa vá** (⭐ kế hoạch đã lập) |
| 3 | ⚠️ **Hàng kẹt ở kho trung chuyển** (12 đơn vị / 06 phiếu) | ⭐ **Đã biết** — do lỗi `-005`, ⭐ **sẽ tự hết khi triển khai** |
| 4 | ⚠️ **Huy hiệu chuông ⛔ không về 0** sau «đánh dấu tất cả đã đọc» | ⭐ **THIẾT KẾ CỐ Ý** (⭐ 2 cơ chế song song: thông báo hệ thống vs thông báo công việc) — ⛔ **không phải lỗi** |
| 5 | ⚠️ **Người đúng vai trò vẫn duyệt được dù ⛔ không được phân công dự án** | ⭐ **CHỜ ANH CHỐT ĐẶC TẢ (F4)** — ⛔ không phải lỗi mã (⭐ chú thích trong mã ghi là **chủ ý**) |
| 6 | ⚠️ **Không tạo được phiếu kiểm kê để test** | ⭐ **`stock_counts` = 0** — ⚠️ **cần nhập thêm dữ liệu** |
| 7 | ⚠️ **Không test đầy đủ được thông báo web** | ⭐ **`notification_configs` = 1** — ⚠️ **cần thêm cấu hình** |
| 8 | ⚠️ **Xoá nhân sự xong vẫn còn hồ sơ HR / HĐLĐ / bảo hiểm** | ⭐ **CHỜ ANH CHỐT CHÍNH SÁCH** (⭐ nếu muốn **giữ** ⇒ hiện tại **đã đúng**) |

---

## ⑩ ⭐ CÁCH BÁO LẠI KHI GẶP LỖI (giúp tôi sửa nhanh nhất)

⭐ Anh chỉ cần gửi **4 thông tin** — ⛔ không cần mô tả dài:

```text
1. Đang đăng nhập tài khoản nào?   (ví dụ: e2e.khnv)
2. Đang ở chức năng nào?           (ví dụ: Phiếu đề nghị mua hàng)
3. Bấm nút gì / làm gì?            (ví dụ: bấm «Duyệt» trên phiếu DNMH-…)
4. Thấy gì?                        (ví dụ: hiện dòng chữ «Thao tác chưa được khai báo quyền»)
```
⭐ **Tôi sẽ tự tra log + mã nguồn + CSDL** ⇒ ⛔ **không cần anh mô tả lại thông tin hệ thống đã có**.

---

## ⑪ ⭐ THỨ TỰ ĐỀ XUẤT KHI TEST

1. ⭐ **Kịch bản 3 (luồng mua hàng)** — quan trọng nhất, ⭐ **có phép thử «đổi user»** (bước 3.3–3.5) và **phép thử âm F2** (bước 3.10)
2. ⭐ **Kịch bản 6 (báo lỗi)** — ⭐ trả lời câu hỏi anh nêu: **admin có xem được chi tiết không**
3. **Kịch bản 4 (xuất–nhập kho)** · **Kịch bản 5 (cấp phát–hoàn trả)**
4. **Kịch bản 2 (nhân sự)** · **Kịch bản 1 (quản trị)**
5. **Kịch bản 7 (thông báo)** — ⚠️ cần thêm cấu hình trước

---

## ⑫ ⚠️ GHI CHÚ MINH BẠCH

- ⭐ **Mọi con số trong tài liệu này ĐO TRỰC TIẾP từ CSDL thật ngày 06/10/2026** (⭐ xem `KIEM-KE-DU-LIEU-TEST.md`), ⛔ không suy đoán.
- ⚠️ **Cột «Bằng chứng đã chạy được»** chỉ ghi ✅ cho tài khoản **thực sự có bằng chứng trong biên chứng kiểm thử**; ⭐ các tài khoản còn lại ghi ⓘ **theo tên tài khoản** (⛔ tôi **chưa có bằng chứng** chúng đã thao tác nghiệp vụ đó) — ⭐ anh kiểm tra thực tế giúp tôi.
- ⭐ **Tài liệu này ⛔ KHÔNG thay đổi gì trong hệ thống** — chỉ là **hướng dẫn test**.
