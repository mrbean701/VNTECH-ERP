# HƯỚNG DẪN NGƯỜI DÙNG — VNTECH ERP V5.3.0

Bản cập nhật: 23/09/2026 · Hệ thống nội bộ VNTECH — Quản trị & Điều hành.

Tài liệu này dành cho **người dùng cuối** (kỹ sư, nhân viên kế hoạch, thủ kho, kế toán, lãnh đạo, quản trị viên). Nếu bạn là lập trình viên / quản trị hệ thống, hãy đọc `docs/34_TAI_LIEU_DEV.md`.

---

## 1. VÀO HỆ THỐNG

### 1.1 Địa chỉ truy cập
| Kênh | Địa chỉ | Ghi chú |
|---|---|---|
| Giao diện chính (khuyến nghị) | `http://127.0.0.1:9000` | Cổng duy nhất, tự điều phối sang giao diện & API |
| Giao diện trực tiếp (khi cần) | `http://127.0.0.1:8787` | UI monolith JS |
| API Java backend | `http://127.0.0.1:18081/actuator/health` | Chỉ để kiểm tra sức khỏe |

- Nên dùng trình duyệt **Chrome / Edge**.
- Trên máy phòng ban dùng file `01_MO_VNTECH_ERP_WINDOWS.bat` để mở chương trình.

### 1.2 Tài khoản mẫu (bàn giao demo PRJ-DEMO-01)
| Tài khoản | Mật khẩu | Vai trò / mục đích |
|---|---|---|
| `admin` | `Admin123456@` | Quản trị toàn hệ thống |
| `cha.ht` | `VnTech@123` | Chỉ huy trưởng (BCH) — duyệt DNMH bậc 1 |
| `trinhtrench` | `VnTech@123` | Trưởng phòng KH |
| `trdademo` | `VnTech@123` | Trưởng phòng DA — duyệt DNMH bậc 5 |
| `thukydemo` | `VnTech@123` | Thư ký TGĐ — duyệt DNMH bậc 2 |
| `nvdademo` | `VnTech@123` | NV dự án DA — duyệt DNMH bậc 3 |
| `nvkhdemo` | `VnTech@123` | NV kế hoạch KH — duyệt DNMH bậc 4 |
| `tkhodemo` | `VnTech@123` | Thủ kho — xuất/nhập kho |
| `kttdemo` | `VnTech@123` | Kế toán trưởng (TCKT) |

> Tài khoản mẫu dùng cho đào tạo/demo. Kho dữ liệu thật do quản trị viên cấp.

### 1.3 Lần đầu đăng nhập
1. Mở trình duyệt vào `http://127.0.0.1:9000`.
2. Nhập tài khoản/mật khẩu. Nếu hệ thống yêu cầu **đổi mật khẩu**, hãy đổi ngay.
3. Quy tắc mật khẩu: tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
4. Đăng nhập sai **10 lần liên tiếp** → tài khoản bị khóa **15 phút** (chống dò mật khẩu).

### 1.4 Giao diện tổng thể
- **Menu trái (Sidebar):** nhóm chức năng — Tổng quan, Quản lý dự án, Mua hàng & cung ứng, Kho vật tư, Vật tư, Tổ đội, Hệ thống...
- Khi chọn một **dự án**, menu chuyển sang chế độ **QUẢN LÝ DỰ ÁN** (8 nhóm công việc của dự án đó).
- **Thanh trên (Topbar):** đổi giao diện sáng/tối (☀/☾), tìm kiếm toàn hệ thống, thông báo, tên tài khoản.

---

## 2. QUY TRÌNH NGHIỆP VỤ XƯƠNG SỐNG

### 2.1 Luồng Vật tư — Mua hàng (5 bậc duyệt)
```
Kỹ sư lập Phiếu đề nghị mua (DNMH/MR)
  → Duyệt 5 bậc: Chỉ huy trưởng → Thư ký TGĐ → NV dự án → NV kế hoạch → Trưởng phòng DA
  → Lập Đơn mua hàng (PO) theo nhà cung cấp
  → Nhận hàng (GRN) → xác nhận số lượng, chụp ảnh chứng từ
  → Nhập kho / Xuất kho tổ đội / Hoàn trả / Kiểm kê
  → Lắp đặt → nghiệm thu → thu hồi vốn
```

### 2.2 Các bước thao tác chính

**Đề nghị mua (Requests):**
1. Bấm **+ Phiếu đề nghị mua** → chọn Dự án/Hợp đồng/BOQ Version → thêm dòng vật tư (số lượng, cần ngày).
2. Gửi duyệt → phiếu đi qua các bậc theo quy trình; màn hình hiển thị bước đang chờ ai.
3. Theo dõi trên màn **Trung tâm phê duyệt**: Chờ / Đã duyệt / Trả về / Hủy, có **cột SLA** (hạn xử lý).
4. Khi duyệt đủ, hệ thống gợi ý lập **Đơn hàng mua (PO)** theo nhà cung cấp.

**Xét duyệt (Approval Center):**
- Màn này chỉ hiển thị **phiếu thuộc quyền duyệt của bạn**.
- Xem chi tiết → chọn **Duyệt / Trả về** (kèm lý do) / yêu cầu sửa.
- Phiếu **quá hạn SLA** vẫn duyệt được nhưng phải **nhập lý do** (bắt buộc).

**Mua hàng (Purchasing) & Đơn hàng (PO):**
- Quản lý đơn hàng của bạn; làm việc với nhà cung cấp; chọn **Kho nhận**.
- **Nhà cung cấp (Supplier Catalog):** khai báo NCC, đánh giá lead time.
- **Nhận hàng (Receiving):** xác nhận số lượng thực tế, chứng từ CQ/CO, chụp ảnh.

**Kho & tồn kho:**
- **Nhập kho** (Warehouse Receipt), **Xuất kho/Tổ đội** (Warehouse Issue), **Tồn kho** (Inventory).
- **Chuyển kho / Điều chỉnh / Kiểm kê (Stocktake):** dùng đúng chức năng; chênh lệch kiểm kê phải có người duyệt.
- Kho được gán theo từng dự án (`KHO-PRJ-DEMO-01`...), truy vết theo hợp đồng.

**BOQ (Bóc khối lượng / Phát sinh):**
- Duy trì bảng khối lượng BOQ theo Hợp đồng/Version.
- **Gán mã vật tư chuẩn** từng dòng BOQ (hệ thống đề xuất các ứng viên giống → chọn/dung).
- Tạo phiếu đề nghị mua trực tiếp từ BOQ.
- Dòng BOQ nào là **Tiêu đề/ĐVT trống** sẽ **không** vào tìm khớp vật tư.

**Tổ đội / Sản lượng / Thu hồi vốn:**
- **Tổ đội:** khai báo tổ thi công, hợp đồng khoán, sản lượng tổ, thanh toán, quyết toán tổ đội.
- **Sản lượng:** cập nhật tiến độ thi công thực tế hàng kỳ.
- **Thu hồi vốn:** ghi nhận đợt thu hồi theo hợp đồng, đối chiếu thanh toán, kế hoạch giải ngân.

**Công việc (Task/Giao việc):**
- **Trưởng phòng trở lên** xem và giao việc trong phòng ban mình; **Phó GĐ trở lên** xem/giao toàn công ty.
- Màn **Việc của tôi** chỉ hiển thị việc được phân công cho đúng bạn.

---

## 3. QUẢN TRỊ HỆ THỐNG (ADMIN)

Chỉ quản trị viên (`admin`) mới có quyền:
- Tạo/khóa tài khoản người dùng, phân **vai trò** (role) và **quyền module** (xem/tạo/sửa/duyệt/xuất).
- Phân **nhóm quyền nghiệp vụ**, phạm vi tiếp cận theo **Dự án/Kho/Đơn vị**.
- Cấu hình **menu**, **form** (ẩn/hiện/required cột), **email**, **SLA phê duyệt**.
- **Nhập nhanh** danh sách người dùng và dự án (Excel).
- Xem **nhật ký thay đổi** (audit) mọi hành động.
- Cấu hình **thông báo**: Web/Email tới 1 user / nhiều user / phòng ban / dự án / toàn bộ.
- Cấu hình hiển thị công ty (chữ, cỡ chữ, mật độ dòng, ảnh nền).

---

## 4. THỦ THUẬT HÀNG NGÀY

- **Đổi giao diện:** nút ☀/☾ trên thanh trên; hệ thống nhớ theo từng tài khoản.
- **Tìm kiếm nhanh:** ô tìm kiếm thanh trên — gõ tên Dự án, mã Vật tư, số Phiếu, Đơn vị → Enter mở kết quả đầu tiên.
- **Xuất dữ liệu:** hầu hết màn danh sách có nút **Xuất CSV/XLSX**.
- **Làm việc trên điện thoại:** menu thu gọn thành nút ☰; có chế độ theo từng phòng ban.
- **Context Project:** khi đang xử lý việc của dự án, hệ thống báo "đang làm việc theo Dự án X". Muốn quay về tổng chung, mở mục trên cùng / chọn màn không thuộc dự án.
- **Quyền ở đâu thì thấy dữ liệu ở đó:** màn hình, nút bấm và dữ liệu hiển thị **theo quyền**. Không thấy chức năng → liên hệ admin phân quyền, không phải lỗi phần mềm.

---

## 5. XỬ LÝ TÌNH HUỐNG

| Bạn cần | Làm thế nào |
|---|---|
| Mua vật tư mới chưa có mã | Vào **Vật tư → Danh mục vật tư** (admin mở hoặc yêu cầu tạo mã) → lập Phiếu đề nghị mua |
| Phiếu trễ duyệt | Xem cột duyệt → người đang chờ → nhắc họ xử lý trong Approvals |
| Nhận hàng thiếu/thừa | Làm Receiving theo số thực tế; phần thiếu về trạng thái chờ giao tiếp |
| Vật tư hết hàng mà dự án khác có | Hệ thống cảnh báo khi lập PO; muốn điều chuyển → **Chuyển kho** (có phê duyệt) |
| Nghi ngờ tồn kho sai | Tạo **Kiểm kê** → chênh lệch do người duyệt xác nhận, không tự sửa tay |
| Quên mật khẩu | Liên hệ admin đặt lại; lần sau đăng nhập phải đổi mật khẩu |
| Nhận được thông báo | Đọc thông báo trong hộp thư hệ thống; thông báo **chỉ đọc 1 lần** (sau đó đánh dấu đã đọc) |

---

## 6. TÌNH HUỐNG THƯỜNG GẶP

1. **"ĐANG PHÁT TRIỂN"** trên một số màn (Định mức, một số màn Tài chính/Pháp chế...): tính năng mới đang xây dựng — chưa phải lỗi.
2. **"Lỗi giao diện đã được chặn":** nhấn **Tải lại trang**; nếu lặp lại → báo IT kèm ảnh màn hình và thời điểm.
3. **"Internal error + mã tham chiếu":** báo IT **kèm mã tham chiếu** để tra cứu nhật ký nhanh.
4. **Trang chậm:** thử tắt tab cũ, mở lại trang. Hệ thống tự đồng bộ định kỳ.
5. **Đừng tắt trình duyệt giữa chừng khi đang tạo/duyệt phiếu** — một số thao tác cần hoàn tất trong phiên đăng nhập.

---

## 7. LIÊN HỆ HỖ TRỢ

- Gặp lỗi hệ thống, mất quyền, quên mật khẩu, đề xuất tính năng → liên hệ **phòng IT/Quản trị viên**.
- Khi báo lỗi: nêu rõ **màn hình, bước thực hiện, nội dung hiển thị, mã lỗi/mã tham chiếu**, kèm **ảnh chụp màn hình**.

---
*Tài liệu thuộc bộ tài liệu bàn giao hệ thống VNTECH ERP V5.3.0 (23/09/2026). Kèm: `docs/31_TAI_LIEU_BAN_GIAO.md`.*