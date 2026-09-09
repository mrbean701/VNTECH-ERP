# HƯỚNG DẪN SỬ DỤNG VNTECH ERP — DÀNH CHO NGƯỜI DÙNG

Bản cập nhật: 09/2026 · Phần mềm nội bộ VNTECH — Quản trị & Điều hành

---

## 1. VÀO HỆ THỐNG

### 1.1 Cách mở chương trình
- Mở desktop → chạy file **`01_MO_VNTECH_ERP_WINDOWS.bat`** (hoặc theo hướng dẫn IT).
- Trình duyệt tự mở trang đăng nhập. Nên dùng Chrome/Edge.

### 1.2 Lần đầu sử dụng
- Nếu chưa có tài khoản: nhờ quản trị viên (admin) tạo.
- Lần đăng nhập đầu tiên hệ thống có thể yêu cầu **đổi mật khẩu** — hãy đổi ngay.
- Mật khẩu cần đủ mạnh: tối thiểu 8 ký tự, có cả chữ hoa, chữ thường, số và ký tự đặc biệt.
- Nếu đăng nhập sai nhiều lần liên tiếp, hệ thống tạm khóa 15 phút để bảo mật — chờ rồi thử lại.

### 1.3 Giao diện có những gì
- **Menu trái (Sidebar):** các nhóm chức năng — Tổng quan, Quản lý dự án, Mua hàng, Kho vật tư, Vật tư, Dự án/BCH, Hệ thống (admin)...
- **Thanh trên (Topbar):** đổi sáng/tối (☀/☾), tìm kiếm toàn hệ thống, thông báo, tên tài khoản.
- Khi chọn một **dự án**, menu sẽ chuyển sang chế độ **Quản lý dự án** (8 nhóm công việc của dự án đó).

---

## 2. CÁC MÀN HÌNH CHÍNH (THEO CÔNG VIỆC HẰNG NGÀY)

### 2.1 Tổng quan (Dashboard)
- Xem nhanh: số dự án đang triển khai, giá trị hợp đồng, tiến độ, thu hồi vốn, công việc chờ bạn.
- Toàn bộ số liệu tự cập nhật 15 giây/lần — không cần bấm nút làm mới thủ công.

### 2.2 Đề nghị mua vật tư (Requests)
Luồng: **Kỹ sư lập phiếu → Duyệt theo 5 bậc → Mua hàng (PO) → Nhận hàng → Kho**.
1. Bấm **+ Phiếu đề nghị mua** → chọn Dự án/Hợp đồng/BOQ Version → thêm các dòng vật tư (số lượng, cần ngày).
2. Gửi duyệt → phiếu đi qua các bậc duyệt theo quy trình (phiếu hiển thị bước đang chờ ai).
3. Theo dõi trạng thái trên màn **Duyệt** (Approvals): Chờ / Đã duyệt / Trả về / Hủy — có thời gian SLA (hạn xử lý).
4. Khi được duyệt đủ, hệ thống tự động gợi ý lập **Đơn hàng mua (PO)** theo nhà cung cấp.

Mẹo: màn **Đề nghị mua** trên menu có chữ ĐN — là "Phiếu đề nghị mua hàng", đừng nhầm với Đơn hàng (PO).

### 2.3 Xét duyệt (Approvals) — dành cho người được phân quyền duyệt
- Màn này chỉ hiển thị **phiếu thuộc quyền duyệt của bạn**.
- Xem chi tiết → chọn **Duyệt** / **Trả về** (kèm lý do) / yêu cầu sửa.
- Chú ý cột **SLA** (hạn xử lý) — quá hạn sẽ hiện màu đỏ.

### 2.4 Mua hàng (Purchasing) & Đơn hàng (PO)
- Màn **Mua hàng**: quản lý các đơn hàng của bạn — làm việc với nhà cung cấp, chọn Kho nhận.
- **Nhà cung cấp** (Supplier Catalog): khai báo nhà cung cấp, đánh giá lead time.
- Sau khi nhà cung cấp giao: **Nhận hàng (Receiving)** → xác nhận số lượng/CQ/CO, chụp ảnh chứng từ nếu có.

### 2.5 Kho & Tồn kho
- **Nhập kho** (Warehouse Receipt), **Xuất kho/Tổ đội** (Warehouse Issue), **Tồn kho** (Inventory): tìm theo dự án, xem tồn theo hợp đồng.
- **Chuyển kho / Điều chỉnh**: dùng đúng chức năng Chuyển kho (không tự ý sửa tồn).
- **Kiểm kê** (Stocktake): tạo phiếu kiểm, hệ thống tự so sánh sổ sách với thực tế → nếu chênh lệch phải có người duyệt.

### 2.6 BOQ (Bóc khối lượng / Phát sinh)
- Module **BOQ** nằm trong Project Workspace → dùng để:
  - Duy trì bảng khối lượng BOQ theo Hợp đồng/Version.
  - **Gán mã vật tư chuẩn** cho từng dòng BOQ (hệ thống tự đề xuất các ứng viên giống, bạn chọn/dung).
  - Tạo phiếu đề nghị mua trực tiếp từ BOQ.
- Chú ý dòng BOQ nào là **Tiêu đề/ĐVT trống** sẽ **không được đưa vào tìm khớp vật tư** (đúng quy trình).

### 2.7 Sản lượng, Tổ đội, Thu hồi vốn
- **Sản lượng**: cập nhật tiến độ thi công thực tế hàng kỳ.
- **Tổ đội**: khai báo tổ thi công, hợp đồng khoán, sản lượng tổ, thanh toán & quyết toán tổ đội.
- **Thu hồi vốn**: ghi nhận các đợt thu hồi vốn theo hợp đồng, đối chiếu thanh toán.

### 2.8 Quản trị hệ thống (Admin) — CHỈ dành cho quản trị viên
- Tạo/khóa tài khoản người dùng, phân **vai trò** và **quyền module** (xem/tạo/sửa/duyệt/xuất...).
- Phân **nhóm quyền nghiệp vụ** (engineer/commander/admin...), phạm vi tiếp cận theo **Dự án/Kho/Đơn vị**.
- Cấu hình **menu**, **form** (ẩn/hiện/required cột), **email**, **SLA phê duyệt**.
- **Nhập nhanh danh sách** người dùng (Excel) và dự án (Excel) theo mẫu có sẵn.
- Xem lịch sử thay đổi (audit) của mọi hành động.
- Cấu hình hiển thị công ty (chữ, cỡ chữ, mật độ dòng, ảnh nền...).

---

## 3. THỦ THUẬT DÙNG HÀNG NGÀY

### 3.1 Đổi giao diện
- Bấm nút **☀/☾** trên thanh trên cùng (hoặc trong menu điện thoại) để chuyển **Sáng/Tối**. Hệ thống nhớ theo từng tài khoản.

### 3.2 Tìm kiếm nhanh
- Ô tìm kiếm thanh trên: gõ tên Dự án, mã Vật tư, số Phiếu, Đơn vị... → Enter mở kết quả đầu tiên.

### 3.3 Xuất dữ liệu
- Hầu hết màn danh sách đều có nút **Xuất CSV/XLSX** — dùng để làm báo cáo, gửi email.

### 3.4 Làm việc trên điện thoại
- Mở trình duyệt mobile → menu được thu gọn thành **nút ☰** bên trái; có chế độ theo từng phòng ban; khi mở, hệ thống tự cuộn tới mục đang dùng.

### 3.5 Concept quan trọng cần nhớ
- **Context Project:** khi bạn đang xử lý việc của một dự án (mua sắm, kho, BOQ...), hệ thống báo "đang làm việc theo Dự án X". Muốn quay về màn tổng chung, hãy mở lại mục trên cùng / chọn màn không thuộc dự án.
- **Quyền của bạn ở đâu thì mới thấy dữ liệu ở đó:** màn hình, nút bấm và dữ liệu được hiển thị **theo quyền** — nếu không thấy chức năng, vui lòng liên hệ admin phân quyền, không phải lỗi phần mềm.

---

## 4. LUỒNG XỬ LÝ TÌNH HUỐNG

| Bạn cần | Làm thế nào |
|---|---|
| Mua một loại vật tư mới | Vào **Vật tư → Danh mục vật tư** (admin mở; hoặc gửi yêu cầu tạo mã) → sau đó lập Phiếu đề nghị mua |
| Phiếu bị trễ duyệt | Xem cột duyệt trên phiếu → tên người đang chờ → nhắc họ xử lý trong màn **Approvals** |
| Nhận hàng thiếu/thừa | Làm **Receiving** đúng số thực tế; phần thiếu sẽ về trạng thái chờ giao tiếp (hệ thống tự tính) |
| Vật tư hết hàng mà đang có ở dự án khác | Hệ thống **cảnh báo** khi lập PO; nếu muốn điều chuyển → dùng **Chuyển kho** (có phê duyệt) |
| Nghi ngờ tồn kho sai | Tạo **Kiểm kê** → chênh lệch phải được admin/người duyệt xác nhận, không tự sửa tay |
| Quên mật khẩu | Liên hệ admin → họ đặt lại; lần đăng nhập sau bạn phải đổi mật khẩu |

---

## 5. TÌNH HUỐNG THƯỜNG GẶP & CÁCH ỨNG XỬ

1. **"Đang phát triển" (Development)** xuất hiện trên một số màn (Định mức, Tài chính, Pháp chế...): tính năng mới đang được xây dựng — chưa phải lỗi.
2. **"Lỗi giao diện đã được chặn":** nhấn **Tải lại trang** trên thông báo; nếu lặp lại → báo IT kèm ảnh màn hình và thời điểm.
3. **"Internal error + mã tham chiếu"** xuất hiện: báo IT **kèm mã tham chiếu** để tra cứu nhanh trong nhật ký.
4. **Trang chậm:** thử tắt tab cũ, mở lại trang. Hệ thống tự đồng bộ 15 giây — nếu để nhiều tab/ví dụ tìm kiếm nặng sẽ chậm hơn.
5. **Đừng tắt trình duyệt giữa chừng khi đang tạo/duyệt phiếu** — một số thao tác cần hoàn tất trong phiên đăng nhập (24h).

---

## 6. LIÊN HỆ & HỖ TRỢ
- Gặp lỗi hệ thống, mất quyền, quên mật khẩu, hoặc muốn báo nhu cầu tính năng → liên hệ **phòng IT/Quản trị viên hệ thống**.
- Khi báo lỗi: nêu rõ **màn hình, bước thực hiện, nội dung hiển thị, mã lỗi/mã tham chiếu nếu có**, và **ảnh chụp màn hình** để xử lý nhanh nhất.