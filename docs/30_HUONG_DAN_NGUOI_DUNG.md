> **VNTECH ERP — BỘ TÀI LIỆU PHIÊN BẢN `ALPHA TEST`**
> · Phiên bản tài liệu: **`DOC-ALPHA-TEST-2026.10`** · Ngày cập nhật: **08/10/2026** · Phiên soạn: `ERP-SESSION-01`
> · Sản phẩm: `V5.3.0-MASTER-BASELINE-R1.1.1` · Cổng: `:8787` (UI) · `:9000` (cutover) · `:18081` (API Java)
> · ⚠️ Trạng thái: **ALPHA TEST** — tài liệu phản ánh bản ĐANG CHẠY; ⛔ chưa phải bản phát hành chính thức.
> · 📌 Nguồn sự thật: **mã nguồn + CSDL thật** (mọi số liệu đều ĐO được, ⛔ không suy đoán).

# HƯỚNG DẪN SỬ DỤNG VNTECH ERP V5.3.0 — DÀNH CHO NGƯỜI DÙNG

Bản cập nhật: **08/10/2026** · Hệ thống nội bộ VNTECH — Quản trị & Điều hành.

Tài liệu này viết cho **người dùng cuối**: kỹ sư, nhân viên kế hoạch, thủ kho, kế toán, tổ đội, lãnh đạo và quản trị viên. ⛔ Bạn **không cần biết lập trình** để dùng tài liệu này. Nếu bạn là lập trình viên / quản trị hệ thống, xem thêm `docs/34_TAI_LIEU_DEV.md`; bản hướng dẫn ngắn gọn hơn ở `docs/03_HUONG_DAN_NGUOI_DUNG.md`.

> ⚠️ **Đang là bản ALPHA TEST:** mọi tên màn, tên nút trong tài liệu đều lấy **đúng theo phần mềm đang chạy**. Nếu trên màn hình bạn thấy khác tài liệu ⇒ báo IT kèm ảnh chụp (xem §8).

---

## MỤC LỤC

| # | Mục | Nội dung chính |
|---|---|---|
| 1 | [Đăng nhập & thoát](#1-đăng-nhập--thoát) | Địa chỉ truy cập · quy tắc mật khẩu · đổi mật khẩu · đăng xuất · tài khoản demo |
| 2 | [Điều hướng menu theo nhóm](#2-điều-hướng-menu-theo-nhóm) | 12 nhóm menu · tab bên trong màn · phạm vi dự án |
| 3 | [Quy trình nghiệp vụ xương sống](#3-quy-trình-nghiệp-vụ-xương-sống) | Đề nghị mua → phê duyệt → đặt hàng → giao nhận → nhập kho → xuất kho/cấp phát |
| 4 | [4 chức năng kho](#4-bốn-chức-năng-kho-tạo-kho--sửa-kho--ngừng-hoạt-động--thêm-nhân-sự) | Tạo kho · Sửa kho · Ngừng hoạt động · Thêm nhân sự vào kho |
| 5 | [Phân quyền](#5-phân-quyền--ai-thấy-gì-làm-được-gì) | 6 mức quyền · 14 bước quản trị (`admin_tab_01..14`) · nguyên tắc uỷ nhiệm |
| 6 | [Thủ thuật hằng ngày](#6-thủ-thuật-hằng-ngày) | Tìm nhanh · lọc · cỡ chữ · mật độ dữ liệu · xuất Excel |
| 7 | [Tình huống thường gặp & cách xử lý](#7-tình-huống-thường-gặp--cách-xử-lý) | Không thấy menu · nút bị khoá · lưu không thành công · dữ liệu trống |
| 8 | [Liên hệ hỗ trợ](#8-liên-hệ-hỗ-trợ--tài-liệu-liên-quan) | Cách báo lỗi · tài liệu liên quan |

---

## 1. ĐĂNG NHẬP & THOÁT

### 1.1 Địa chỉ truy cập

| Kênh | Địa chỉ | Khi nào dùng |
|---|---|---|
| **Cổng chính (khuyến nghị)** | `http://127.0.0.1:9000` | Dùng hằng ngày — cổng vào thống nhất của hệ thống |
| Giao diện trực tiếp | `http://127.0.0.1:8787` | Khi cổng chính gặp sự cố (IT hướng dẫn) |
| Máy chủ API Java | `http://127.0.0.1:18081` | Chỉ để IT kiểm tra hệ thống, người dùng ⛔ không cần mở |

- Nên dùng trình duyệt **Chrome / Edge**.
- Trên máy phòng ban: chạy tệp **`01_MO_VNTECH_ERP_WINDOWS.bat`** ở thư mục phần mềm để mở chương trình.

### 1.2 Màn hình đăng nhập

1. Mở trình duyệt → vào địa chỉ ở §1.1. Trang **«Đăng nhập hệ thống»** hiện ra.
2. Nhập **«Tên đăng nhập»** (ví dụ `nvdademo`) và **«Mật khẩu»**.
3. Cần xem lại mật khẩu đã gõ: bấm nút con mắt **◉ / ẨN** trong ô mật khẩu.
4. Muốn máy nhớ tên đăng nhập cho lần sau: tích **«Ghi nhớ đăng nhập»**.
5. Bấm **«ĐĂNG NHẬP»** (khi hệ thống đang kiểm tra, nút hiện «ĐANG KIỂM TRA…»).

| Bạn gặp | Cách làm |
|---|---|
| Quên mật khẩu | Bấm **«Quên mật khẩu?»** → hệ thống nhắc: *Liên hệ Quản trị viên hệ thống để Reset mật khẩu. Sau khi đăng nhập bằng mật khẩu tạm, hệ thống sẽ bắt buộc đổi mật khẩu mới.* |
| Báo sai mật khẩu | Kiểm tra CapsLock / bàn phím tiếng Việt. ⚠️ Sai **10 lần** trong **15 phút** (theo tài khoản + máy) ⇒ tài khoản **tạm khoá 15 phút**, chờ rồi thử lại. |
| Không có tài khoản | Nhờ **Quản trị viên** tạo tài khoản và cấp quyền (xem §5). |

### 1.3 Quy tắc mật khẩu

- Tối thiểu **8 ký tự**, phải có **chữ hoa**, **chữ thường**, **số** và **ký tự đặc biệt**.
- Nếu Quản trị viên vừa **reset mật khẩu**: lần đăng nhập kế tiếp hệ thống hiện hộp thoại **«BẮT BUỘC ĐỔI MẬT KHẨU»** — nhập *Mật khẩu tạm thời / hiện tại*, *Mật khẩu mới*, *Xác nhận mật khẩu mới* rồi bấm **«Đổi mật khẩu và tiếp tục →»**. Trong lúc chưa đổi xong, các chức năng nghiệp vụ **bị khoá**.

### 1.4 Đổi mật khẩu & thoát hệ thống

1. Bấm vào **tên / ảnh đại diện** của bạn ở **góc trên bên phải**.
2. Hộp chọn hiện ra gồm: **CỠ CHỮ** (A− / A / A+) · **MẬT ĐỘ DỮ LIỆU** (THOÁNG / VỪA / CHẶT) · **«Cài đặt tài khoản»** · **«Đăng xuất»**.
3. Đổi mật khẩu: bấm **«Cài đặt tài khoản»** → mục **«Đổi mật khẩu»** (Mật khẩu hiện tại / Mật khẩu mới / Xác nhận mật khẩu mới) → **«Cập nhật mật khẩu»**. Tại đây bạn cũng tự đổi được **«Ảnh đại diện»** (JPG/PNG/WebP, tối đa 2 MB).
4. Thoát: bấm **«Đăng xuất»**. ⚠️ Hãy đăng xuất khi rời máy dùng chung.

### 1.5 Tài khoản demo (dùng cho đào tạo — ⛔ không kèm mật khẩu trong tài liệu)

| Tài khoản | Vai trò | Ý nghĩa khi thực hành |
|---|---|---|
| `admin` | Quản trị toàn hệ thống | Cấp quyền, cấu hình, tạo kho, thêm nhân sự vào kho |
| `cha.ht` | Chỉ huy trưởng (BCH) | Duyệt đề nghị mua **bậc 1** |
| `thukydemo` | Thư ký TGĐ | Duyệt đề nghị mua **bậc 2** |
| `nvdademo` | Nhân viên dự án (DA) | Duyệt đề nghị mua **bậc 3** |
| `nvkhdemo` | Nhân viên kế hoạch (KH) | Duyệt đề nghị mua **bậc 4** |
| `trdademo` | Trưởng phòng DA | Duyệt đề nghị mua **bậc 5** |
| `trinhtrench` | Trưởng phòng KH | Xem nghiệp vụ phòng Kế hoạch |
| `tkhodemo` | Thủ kho (BCH) | Nhập kho · xuất kho · xác nhận xuất |
| `kttdemo` | Kế toán trưởng (TCKT) | Nghiệp vụ tài chính – kế toán |

> Mật khẩu do **Quản trị viên** cấp (⛔ không ghi trong tài liệu). Bộ dữ liệu mẫu dùng mã dự án **`PRJ-DEMO-01`**.

---

## 2. ĐIỀU HƯỚNG MENU THEO NHÓM

### 2.1 Nguyên tắc chung

- Menu nằm ở **thanh bên trái (Sidebar)**, chia thành **12 nhóm**; mỗi nhóm xổ ra các mục con.
- ⭐ **Menu chỉ hiện khi bạn được cấp quyền:** mục không có quyền ⇒ ẩn; nhóm không còn mục nào ⇒ **cả nhóm tự ẩn**.
- Nhóm có **≥ 2 mục**: khi mở một mục, hệ thống hiện **dải tab** để chuyển nhanh giữa các mục trong nhóm.
- Bấm **tên nhóm cha** chỉ để **mở/đóng (xổ/thu)** nhóm — ⛔ không mở màn hình.
- **Thanh trên (Topbar)** gồm: nút ☰ (điện thoại) · ô **tìm nhanh** · nút đổi **sáng/tối ☀/☾** · chuông **thông báo** · tên tài khoản.

### 2.2 Bảng 12 nhóm menu và mục chính

| Nhóm | Mục / màn chính bên trong |
|---|---|
| **TỔNG QUAN** | Tổng quan điều hành (Dashboard: thẻ KPI, việc chờ xử lý) |
| **CÔNG VIỆC** | **Công việc** — mở màn trung tâm công việc với 7 tab: Dashboard · Danh sách công việc · Được giao · Phòng ban/ Tổ đội · Giao việc · Dự án · Báo cáo |
| **QUẢN LÝ DỰ ÁN** | Quản lý dự án — chi tiết dự án có dải tab **Tổng quan · Nhân sự · Tổ đội · Kho · Ban chỉ huy**; có nút **「＋ TẠO CÔNG VIỆC」** và **「⇩ XUẤT」** |
| **MEP** | PDA / Điều phối dự án · Kế hoạch triển khai dự án · Shopdrawing & trình duyệt · BOQ & bóc tách khối lượng · Kiểm soát vật tư & đặt hàng · Phát sinh / RFI / RFQ / NCR · Hoàn công · Đấu thầu kỹ thuật |
| **MUA HÀNG & CUNG ỨNG** | 10 tab cấp nhóm: **PR & PO** · Phiếu đề nghị mua hàng · Giao nhận công trường · Đơn hàng đã giao · Kế hoạch mua hàng & cung ứng · Đấu thầu · Hợp đồng · **Nhà cung cấp** · Giá & dữ liệu thương mại · Xin giá vật tư. (Màn **Nhà cung cấp** có thêm mục **Đối tác**.) |
| **KHO VẬT TƯ** | **Kho vật tư** — một màn duy nhất với 3 tab: **KHO** · **XUẤT & NHẬP** · **CẤP PHÁT & HOÀN TRẢ** |
| **TỔ ĐỘI** | **Tổ đội theo dự án** — danh sách tổ đội, sản lượng, thanh toán/quyết toán tổ đội; nút **「＋ Tạo tổ đội」** |
| **TÀI CHÍNH – KẾ TOÁN** | Kế hoạch thanh toán · Thu hồi vốn / Công nợ · Tạm ứng / Hoàn ứng · Chi phí Ban chỉ huy · Sổ quỹ & Ngân hàng · Chứng từ kế toán |
| **HÀNH CHÍNH – PHÁP CHẾ** | Hồ sơ nhân sự · Hợp đồng lao động · Công văn đến / đi · Văn bản pháp lý · Con dấu / Ủy quyền · Bảo hiểm & Chế độ · Review HĐ |
| **BÁO CÁO** | Báo cáo & cảnh báo · KPI & hiệu suất nhân viên |
| **DANH MỤC VẬT TƯ GỐC** | Danh mục vật tư gốc — nhóm vật tư theo **Hệ M&E**, mã vật tư, quy cách, hãng, tồn tối thiểu; nút **「＋ Thêm vật tư」**, **「⇩ Xuất Excel」**, **「⇧ Nhập Excel」** |
| **QUẢN TRỊ HỆ THỐNG** | **Phân quyền & Cấu hình hệ thống** — 14 bước quản trị (xem §5.3) |

> Ngoài 12 nhóm trên, menu còn một nhóm riêng **PHÊ DUYỆT** chứa mục **Phê duyệt đơn hàng** (trung tâm phê duyệt — xem §3.3).

### 2.3 Các tab quan trọng bên trong màn

| Màn | Dải tab |
|---|---|
| **Kho vật tư** | `KHO` (dashboard tồn kho + danh sách kho) · `XUẤT & NHẬP` (2 sub-tab **XUẤT** / **NHẬP**) · `CẤP PHÁT & HOÀN TRẢ` (2 sub-tab **CẤP PHÁT** / **HOÀN TRẢ**) |
| **Chi tiết một kho** | `Dashboard kho` · `Tồn kho` · `Xuất - Nhập` · `Cấp phát - Hoàn trả` · `Nhân sự` |
| **PR & PO** | `PR` · `PO` · `Chi tiết lũy kế theo vật tư` |
| **Công việc** | `Dashboard` · `Danh sách công việc` · `Được giao` · `Phòng ban/ Tổ đội` · `Giao việc` · `Dự án` · `Báo cáo` |

### 2.4 Phạm vi dự án (rất quan trọng)

- Trên đầu mỗi màn nghiệp vụ có ô **«Chọn dự án»**; nếu tài khoản chỉ được cấp **1 dự án**, hệ thống hiện **«Dự án được phân quyền»** và khoá lại (không đổi được).
- Chọn **«Tất cả dự án»** chỉ để **xem tổng hợp**. ⚠️ Một số thao tác (xuất kho, tạo tổ đội, xác nhận lắp đặt…) **bắt buộc chọn một dự án cụ thể** — nếu để «Tất cả», hệ thống báo: *“Vui lòng chọn một dự án để thực hiện nghiệp vụ…”*.
- Kho của dự án **chỉ hiện với người được thêm vào dự án đó**; Ban Giám đốc và quản trị viên được xem mọi kho (⚠️ chỉ là quyền **xem**, không kèm quyền ghi).

---

## 3. QUY TRÌNH NGHIỆP VỤ XƯƠNG SỐNG

### 3.1 Dòng chảy tổng quát

```
① Lập PHIẾU ĐỀ NGHỊ MUA (DNMH/MR)
      ↓
② PHÊ DUYỆT nhiều bậc (Trung tâm phê duyệt — có SLA)
      ↓
③ Lập ĐƠN MUA HÀNG (PO) theo từng nhà cung cấp
      ↓
④ GIAO NHẬN: nhà cung cấp giao → BCH ghi nhận số lượng thực tế
      ↓
⑤ NHẬP KHO (phiếu nhập) → tồn kho tăng
      ↓
⑥ XUẤT KHO / CẤP PHÁT cho tổ đội → tồn kho giảm
      ↓
⑦ HOÀN TRẢ vật tư dư · ĐIỀU CHUYỂN giữa kho · KIỂM KÊ · XÁC NHẬN ĐÃ LẮP ĐẶT
```

### 3.2 Bước ① — Lập phiếu đề nghị mua

1. Menu **MUA HÀNG & CUNG ỨNG** → tab **Phiếu đề nghị mua hàng**.
2. Bấm **「＋ Lập phiếu đề nghị」** → mở phiếu **«ĐỀ NGHỊ CẤP VẬT TƯ»**.
3. Chọn **Dự án** (bắt buộc theo phạm vi của bạn); có thể chọn tiếp **Hợp đồng / BOQ Version** để đối chiếu khối lượng (không bắt buộc).
4. Thêm các **dòng vật tư**: mã vật tư, số lượng, đơn vị, ngày cần, ghi chú.
5. Kiểm tra rồi **gửi phiếu**. ⚠️ Sau khi gửi, phiếu **vào luồng phê duyệt ngay và không tự thu hồi**.
6. Lập nhiều phiếu cùng lúc: dùng **「⇧ Nhập Excel」** (tải tệp theo mẫu) và **「⇩ Xuất Excel」** để xuất danh sách.

### 3.3 Bước ② — Phê duyệt (Trung tâm phê duyệt)

1. Menu nhóm **PHÊ DUYỆT** → **Phê duyệt đơn hàng**. Màn chỉ hiển thị **phiếu thuộc quyền duyệt của bạn**.
2. Cột trái là **«DANH SÁCH PHIẾU CHỜ DUYỆT»** (kèm dự án, nhà cung cấp, giá trị, thời gian chờ).
3. Bấm một phiếu → khung phải hiện **«PHIẾU ĐANG XỬ LÝ»**: **«SLA còn lại»**, **«Hạn duyệt»** và sơ đồ **«QUY TRÌNH PHÊ DUYỆT (Bước x/N)»** cho biết bước nào đã xong, bước nào đang chờ ai.
4. Ghi ý kiến vào ô **«BÌNH LUẬN»** (bắt buộc khi trả lại hoặc khi quá hạn).
5. Chọn một trong các nút: **「✓ DUYỆT」** · **「↩ TRẢ LẠI」** · **「ⓘ YÊU CẦU BỔ SUNG」** · **「◉ CHI TIẾT」**.
6. ⚠️ **Quá hạn SLA:** phiếu vẫn duyệt được nhưng **bắt buộc nhập lý do** vào ô «BÌNH LUẬN»; nếu chưa nhập, hệ thống hiện cảnh báo *“⚠️ Bước này đã QUÁ HẠN SLA. Bắt buộc nhập lý do duyệt quá hạn vào ô BÌNH LUẬN.”* và **2 nút Duyệt / Trả lại bị mờ**.

**Theo dõi phiếu đang ở đâu:** mở chi tiết phiếu (tab **Chi tiết phiếu**) — dải thông tin hiện **«Trạng thái đơn»**, **«Bước đang xử lý»**, **«Người xử lý»**, **«Đã duyệt: x/y bước»**.

> 📌 **Số bậc duyệt là dữ liệu cấu hình, không cố định.** Với bộ dữ liệu mẫu `PRJ-DEMO-01`, quy trình gồm **5 bậc**: 1 Chỉ huy trưởng → 2 Thư ký TGĐ → 3 Nhân viên dự án → 4 Nhân viên kế hoạch → 5 Trưởng phòng DA. Quản trị viên thêm/bớt bước, đổi tên bước, đổi **thời hạn xử lý (giờ)** và cách xác nhận tại bước **«Workflow phê duyệt»** (§5.3).

### 3.4 Bước ③ — Đặt hàng (PO)

1. Menu **MUA HÀNG & CUNG ỨNG** → tab **PR & PO**.
2. Xem danh sách: tab **PR** (phiếu đề nghị) · tab **PO** (đơn mua) · tab **Chi tiết lũy kế theo vật tư** (đối chiếu khối lượng BOQ/Hợp đồng với đã lập PO).
3. Bấm **「＋ PHÁT HÀNH PO」** → phiếu **«Phát hành PO từ phiếu đã duyệt»**: chọn **phiếu nguồn**, **Kho nhận**, **Ngày giao mặc định**; gán **nhà cung cấp theo từng dòng**.
   - Một dòng có thể gán nhà cung cấp khác nhau; **nhiều nhà cung cấp ⇒ hệ thống tự tách thành nhiều PO**.
   - Lập hàng loạt: dùng **「⇩ Mẫu Excel lập PO」** → điền → **「⇧ Nhập Excel/CSV」**.
4. Công cụ khác: **「⇩ TẢI MẪU PO」**, **「⇧ NHẬP PO EXCEL」**, **「⇩ TẢI MẪU ĐƠN GIÁ HĐ」**, **「⇧ NHẬP ĐƠN GIÁ HĐ」**, **「↺ ĐẶT LẠI LỌC/SẮP XẾP」**; mở chi tiết bằng **「Xem chi tiết PR」** / **「Xem chi tiết PO」**.

### 3.5 Bước ④ — Giao nhận (BCH ghi nhận hàng về)

1. Menu **MUA HÀNG & CUNG ỨNG** → tab **Giao nhận công trường** (màn **Kế hoạch giao hàng**).
2. Xem nhanh bằng 4 thẻ KPI: **«Lịch giao hôm nay»**, **«Trễ hạn»**, **«Sắp đến hạn (3 ngày)」**, **«Nhà cung cấp đang giao」** (bấm thẻ để xem danh sách).
3. Bấm **「Ghi nhận」** ở dòng PO → hộp thoại **«Ghi nhận số lượng giao thực tế»**:
   - Chọn **Đơn đặt hàng (PO)**; nhập **Số phiếu giao hàng** của nhà cung cấp.
   - Khai **Chứng chỉ / CO-CQ** (Đã có / Chưa có / Không yêu cầu) và **Giấy giao hàng kèm theo**.
   - Nhập **«Thực giao lần này»** cho từng vật tư + **Lô / serial**.
4. Lưu lại. ⚠️ Có thể giao **thiếu hoặc thừa**; hệ thống chỉ nhận tối đa số đã đặt và **lưu riêng phần chênh lệch**, giao được **nhiều đợt**.
5. Theo dõi các PO **đã giao xong** ở tab **Đơn hàng đã giao**.

### 3.6 Bước ⑤ — Nhập kho

1. Menu **KHO VẬT TƯ** → tab **XUẤT & NHẬP** → sub-tab **NHẬP**.
2. Bấm **「＋ Tạo phiếu nhập kho」** (hoặc **「⭳ Tạo phiếu nhập」** trong màn chi tiết kho).
3. Chọn PO/kho nhận, kiểm tra số lượng thực nhận, chứng từ, ảnh giao hàng → lưu.
4. Danh sách phiếu nhập có bộ lọc theo **«Xác nhận BCH»** (Chờ xác nhận / Đã xác nhận / Từ chối) và cột **CO/CQ**.

### 3.7 Bước ⑥ — Xuất kho / cấp phát cho tổ đội

1. Menu **KHO VẬT TƯ** → tab **XUẤT & NHẬP** → sub-tab **XUẤT**.
2. Bấm **「＋ Tạo phiếu xuất」** (hoặc nút **「＋ TẠO PHIẾU NHẬP / XUẤT / ĐIỀU CHUYỂN」**) → hộp thoại **«Cấp phát vật tư cho tổ đội»**:
   - Chọn **MR đã duyệt**, **Tổ đội nhận vật tư**, nhập **Người nhận / Đội trưởng**; **Kho xuất** do hệ thống xác định theo dự án (ô này chỉ đọc).
   - Hệ thống hiện **tồn kho** và **còn nhu cầu** từng dòng để bạn cấp đúng số.
3. Bấm **「Ghi sổ cấp phát →」** để lưu phiếu.

**Phiếu xuất đi qua 5 bước nghiệp vụ** (⚠️ nhớ kỹ để không hiểu nhầm là “mất tồn”):

| Bước | Việc gì | Tồn kho có đổi? |
|---|---|---|
| ① Lập phiếu xuất | Phiếu mới ở trạng thái **chờ Chỉ huy trưởng duyệt** | ⛔ **Không đổi** |
| ② Chỉ huy trưởng duyệt | Phiếu chuyển sang **đã duyệt** | ⛔ Không đổi |
| ③ Xác nhận xuất kho | **Đây là bước duy nhất ghi sổ kho**: kho nguồn **giảm**, kho tổ đội **tăng** | ✅ Có đổi |
| ④ Xác nhận hoàn tất | Thủ kho xác nhận phiếu đã xuất đủ | Không đổi thêm |
| ⑤ Sinh phiếu nhập cho tổ đội | Phiếu nhập kho của tổ đội được tạo | Theo bước ③ |

> ⭐ **Vì sao thiết kế như vậy:** phiếu **chưa được duyệt thì chưa trừ kho** — tránh việc lập phiếu xong là mất tồn oan.

### 3.8 Các nghiệp vụ kho – tổ đội còn lại

| Bạn cần | Vào đâu | Nút / hộp thoại |
|---|---|---|
| Trả vật tư dư về kho | KHO VẬT TƯ → tab **CẤP PHÁT & HOÀN TRẢ** → sub-tab **HOÀN TRẢ** | **「＋ Tạo phiếu hoàn trả」** — không cho hoàn vượt tồn của tổ đội; hàng hỏng không cộng lại tồn sử dụng |
| Chuyển vật tư giữa kho | KHO VẬT TƯ → tab **KHO** → thanh công cụ | **「⇄ Chuyển kho」** → **«Tạo phiếu điều chuyển»** (chọn kho nguồn, kho đích, vật tư, số lượng). Hàng ra khỏi kho nguồn vào **Transit**; **chỉ tăng tồn kho đích sau khi kho đích xác nhận nhận** |
| Kiểm kê – đối chiếu | KHO VẬT TƯ → tab **KHO** | **«Lập phiếu kiểm kê»** (loại **Định kỳ / Đột xuất**); chênh lệch do **người có quyền duyệt** xác nhận, ⛔ **không tự sửa tay** |
| Xác nhận vật tư đã lắp | QUẢN LÝ DỰ ÁN hoặc KHO VẬT TƯ | **「✓ Xác nhận đã lắp」** → **«Xác nhận vật tư đã lắp đặt»** (không xác nhận vượt số đã cấp) |
| In tem / thẻ kho | KHO VẬT TƯ → tab **KHO** | **「▥ In mã Barcode」**, **「▤ Thẻ kho」**, **「⇩ Xuất Excel」** |

---

## 4. BỐN CHỨC NĂNG KHO (TẠO KHO · SỬA KHO · NGỪNG HOẠT ĐỘNG · THÊM NHÂN SỰ)

### 4.1 Chúng nằm ở đâu?

Menu **KHO VẬT TƯ** → tab **KHO** → khối **danh sách kho**. Thanh công cụ có:

```
[ ＋ Tạo kho ]   [ ✎ Sửa ]   [ ⏹ Ngừng hoạt động ]   [ ⇩ Xuất Excel ]
   (ô Tìm theo tên/mã kho)      (Sắp xếp: Tên A→Z · Tên Z→A · Nhiều vật tư trước)

┌────────┐ ┌────────┐ ┌────────┐   ← bấm vào THẺ KHO để chọn kho
│  Kho 1 │ │  Kho 2 │ │  Kho 3 │
└────────┘ └────────┘ └────────┘
[ ◉ Xem chi tiết kho đang chọn ]
```

> ⚠️ **「✎ Sửa」 và 「⏹ Ngừng hoạt động」 chỉ bấm được sau khi bạn đã chọn một kho** (bấm vào thẻ kho). Chưa chọn kho ⇒ hai nút này bị mờ.

### 4.2 ① Tạo kho

1. Bấm **「＋ Tạo kho」** → hộp thoại **«Tạo kho»**.
2. Chọn **Dự án**:
   - Chọn một dự án ⇒ đây là **kho dự án**.
   - Để nguyên **「— Kho Tổng / không gắn dự án —」** ⇒ tạo **Kho Tổng**.
3. **「Mã kho *」**: hệ thống **tự sinh** theo quy tắc `KD-xxx` (ví dụ `KD-001`); bạn có thể sửa nhưng **không được trùng** kho khác.
4. **「Tên kho *」**:
   - Kho **dự án**: tên **tự đặt theo tên dự án** dạng `KHO <tên dự án>` (ô chỉ đọc).
   - **Kho Tổng**: bạn tự nhập tên.
5. Đọc dòng quy tắc ngay dưới form: *“Quy tắc: mã kho **KD-xxx** (không trùng kho khác) · tên kho dự án `KHO <tên dự án>`.”*
6. Bấm **「Tạo kho →」** để lưu (hoặc **「Huỷ」** để bỏ).

> 📌 Kho mới **chỉ cần Mã kho · Tên kho · Dự án**; **thủ kho và các thông tin khác cấu hình sau** (xem §4.5).

### 4.3 ② Sửa kho

1. Bấm vào **thẻ kho** cần sửa → bấm **「✎ Sửa」**.
2. Hộp thoại **Sửa kho** hiện ra (tiêu đề kèm mã kho, ví dụ *«Sửa kho KD-001»*) với thông tin hiện tại.
3. Sửa **Mã kho** (⚠️ cho phép sửa, nhưng phải đúng quy tắc `KD-xxx` và **không trùng**) và/hoặc **Tên kho**.
4. Bấm **「Lưu kho →」**.
5. Nếu bạn **không có quyền sửa kho**, hệ thống hiện dòng đỏ: *“Bạn không có quyền sửa kho.”* và nút lưu bị mờ ⇒ liên hệ Quản trị viên cấp quyền.

### 4.4 ③ Ngừng hoạt động (thay cho “xoá kho”)

1. Bấm vào **thẻ kho** cần ngừng → bấm **「⏹ Ngừng hoạt động」**.
2. Hệ thống hỏi xác nhận: *“Ngừng hoạt động kho `<tên kho>`? **Phiếu kho cũ vẫn giữ nguyên.**”* → đồng ý.
3. Kết quả: kho **không còn xuất hiện** trong danh sách kho đang dùng; **toàn bộ chứng từ cũ vẫn tra cứu được** (đúng nguyên tắc giữ lịch sử).
4. ⛔ **Hệ thống KHÔNG có nút xoá kho** — đây là **chủ trương**, không phải lỗi: xoá kho sẽ làm mất dấu chứng từ. Kho lập nhầm ⇒ **ngừng hoạt động**.
5. Cần **dùng lại** kho đã ngừng ⇒ liên hệ **Quản trị viên** (hệ thống có sẵn khả năng bật lại kho).

### 4.5 ④ Thêm nhân sự vào kho

1. Bấm vào **thẻ kho** → bấm **「◉ Xem chi tiết kho đang chọn」** để mở **màn chi tiết kho** (có nút **「← Quay lại màn KHO」**).
2. Chuyển sang tab **`Nhân sự`** (tab thứ 5).
3. Bấm **「＋ Thêm nhân sự」** → hộp thoại **«THÊM NHÂN SỰ VÀO KHO»** (tiêu đề kèm tên kho đang mở).
4. Ô **「Tìm nhân sự」**: gõ **tên · mã nhân viên · phòng ban** để lọc.
5. Bấm chọn **một dòng nhân sự** trong bảng → khối **«NHÂN SỰ ĐÃ CHỌN»** hiện *Họ tên · Mã nhân viên · Chức danh · Phòng ban · Email*.
6. Chọn **「Nhiệm vụ của nhân sự này đối với kho」**:

| Lựa chọn | Nghĩa |
|---|---|
| **Chỉ xem (read)** | Chỉ tra cứu kho, không ghi |
| **Được ghi (write) — thủ kho** | Được nhập/xuất kho — dùng cho thủ kho |
| **Được duyệt (approve)** | Được duyệt nghiệp vụ kho |
| **Quản trị kho (admin)** | Toàn quyền với kho này |

7. Bấm lưu để gán (hoặc **「Huỷ」** để bỏ). Danh sách nhân sự của kho hiện ở bảng **«NHÂN SỰ CỦA KHO»** (Họ tên · Mã NV · Chức danh · Phòng ban · **Nhiệm vụ với kho**), có ô tìm riêng.

> ⚠️ **Hiện tại nút「＋ Thêm nhân sự」chỉ hiện với tài khoản Quản trị viên** (`admin`) — vì thao tác ghi phạm vi kho bị máy chủ chặn theo vai trò quản trị. Người dùng khác **vẫn xem được** danh sách nhân sự của kho nhưng ⛔ không thêm được ⇒ nhờ Quản trị viên.

### 4.6 Quyền cần có cho 4 chức năng này

| Chức năng | Quyền cần | Ghi chú |
|---|---|---|
| Tạo kho | Quyền **Tạo** của chức năng quản lý kho | Nhóm quyền kho (`Kho Tổng` + `Tồn kho & điều chuyển`) |
| Sửa kho | Quyền **Sửa** | ⭐ “Cho sửa, nhưng phải được **phân quyền sửa kho** mới được” |
| Ngừng hoạt động | Quyền **Sửa** (đổi trạng thái kho) | Không phải quyền xoá (hệ thống không có xoá kho) |
| Thêm nhân sự vào kho | Vai trò **Quản trị viên** | Xem §4.5 |

> 🔒 **Còn một nút đang khoá (cố ý):** trong tab `CẤP PHÁT & HOÀN TRẢ` → sub-tab **CẤP PHÁT**, nút **「＋ Tạo phiếu cấp phát」** hiện vẫn **bị mờ** (đang hoàn thiện nghiệp vụ). Muốn cấp vật tư cho tổ đội, dùng **「＋ Tạo phiếu xuất」** ở tab `XUẤT & NHẬP` (§3.7) — đây là đường **đang chạy được**.

---

## 5. PHÂN QUYỀN — AI THẤY GÌ, LÀM ĐƯỢC GÌ

### 5.1 Sáu mức quyền

Mỗi chức năng được cấp theo **6 mức độc lập**: **Xem · Thao tác · Tạo · Sửa · Duyệt · Xuất**.

- Thiếu **Xem** ⇒ không thấy màn/menu đó.
- Thiếu **Xuất** ⇒ có dữ liệu nhưng nút **「⇩ Xuất Excel」** bị mờ, kèm chú thích như *“Tài khoản chưa được cấp quyền XUẤT của chức năng Quản lý dự án”*.
- Thiếu **Tạo/Sửa/Duyệt** ⇒ nút tương ứng bị mờ, kèm chú thích *“Bạn không có quyền …”*.

### 5.2 Menu, màn hình, nút và dữ liệu — tất cả đều theo quyền

| Lớp | Người dùng thấy gì |
|---|---|
| **Menu** | Mục chỉ hiện khi có quyền **Xem** của (ít nhất) một chức năng trong mục đó; nhóm rỗng **tự ẩn** |
| **Màn hình** | Nếu vào được màn nhưng thiếu quyền xem dữ liệu, màn hiện khối **«CHƯA ĐƯỢC PHÂN QUYỀN»**: *“Tài khoản của bạn chưa có quyền xem dữ liệu nghiệp vụ của chức năng này. Vui lòng liên hệ Quản trị hệ thống nếu cần cấp quyền.”* |
| **Nút bấm** | Nút mờ (`disabled`) kèm **lý do** khi đưa chuột lên |
| **Dữ liệu** | Danh sách tự lọc theo **phạm vi dự án – kho** của bạn; tìm kiếm cũng chỉ trong phạm vi đó (*“Không tìm thấy dữ liệu trong phạm vi quyền hiện tại.”*) |

### 5.3 Mười bốn bước quản trị (`admin_tab_01..14`)

Màn **QUẢN TRỊ HỆ THỐNG** chia thành **14 bước**; mỗi bước là **một khoá quyền riêng** ⇒ có thể cấp **từng bước một** cho từng người (⛔ không còn kiểu “cấp cả màn quản trị”).

| Bước | Tên bước | Khoá quyền | Ghi chú |
|---|---|---|---|
| 01 | Tài khoản | `admin_tab_01` | Tạo/khóa tài khoản, sửa hồ sơ, reset mật khẩu |
| 02 | Tổ chức | `admin_tab_02` | Phòng ban, Ban chỉ huy, tổ đội theo dự án |
| 03 | Chức danh / vai trò | `admin_tab_03` | Vai trò hệ thống |
| 04 | Nhóm quyền nghiệp vụ | `admin_tab_04` | Gom quyền theo nghiệp vụ |
| 05 | Phân quyền phòng ban | `admin_tab_05` | Quyền theo phòng ban |
| 06 | Phân quyền người dùng | `admin_tab_06` | **Ma trận quyền chức năng + phạm vi dự án + phạm vi kho** |
| 07 | Cấp bậc hệ thống | `admin_tab_07` | Cấp bậc tự động toàn quyền / duyệt vượt cấp |
| 08 | Phạm vi dự án & kho | `admin_tab_08` | Giới hạn dự án, kho |
| 09 | Workflow phê duyệt | `admin_tab_09` | Thêm/bớt bước duyệt, tên bước, SLA, cách xác nhận |
| 10 | Ngoại lệ cá nhân | `admin_tab_10` | Cấp riêng cho một người khi thật cần |
| 11 | Audit log | `admin_tab_11` | Nhật ký thao tác |
| 12 | Cấu hình hệ thống | `admin_tab_12` | 🔒 chỉ Quản trị viên (chứa cả Factory Reset, Email/SLA) |
| 13 | Thông báo | `admin_tab_13` | 🔒 chỉ Quản trị viên |
| 14 | Báo lỗi | `admin_tab_14` | 🔒 chỉ Quản trị viên |

- Khi bạn được cấp vài bước, các bước **còn lại bị làm mờ** và đưa chuột lên sẽ thấy lý do, ví dụ: *“⛔ Cần quyền «Quản trị hệ thống › Tab 11. Audit log»”*.
- ⭐ Nguyên tắc: **cấp tối thiểu, đúng việc** — chỉ cấp bước nào người đó thật sự dùng.

### 5.4 ⭐ Nguyên tắc uỷ nhiệm: “được uỷ nhiệm thì thấy ĐÚNG PHẠM VI của mình”

- Người **được uỷ nhiệm quyền quản trị** (ví dụ được cấp *Phân quyền người dùng*) **chỉ thấy trong phạm vi của mình**: chính họ và những người **cùng dự án trong phạm vi được cấp** — ⛔ **không thấy toàn công ty**.
- Một số khu vực **nhạy cảm vẫn chỉ dành cho Quản trị viên**: **toàn bộ ma trận quyền module**, **hộp thư/hàng đợi email**, **danh sách người nhận thông báo**.
- Danh sách **dự án** và **kho** trong các ô chọn cũng tự co lại theo phạm vi: kho dự án chỉ hiện với người **đã được thêm vào dự án đó**.
- ⚠️ Nếu bạn là **trưởng phòng** và muốn tự cấp quyền cho nhân viên trong phòng: hiện hệ thống **chưa phân cấp** việc cấp quyền — hãy gửi yêu cầu cho **Quản trị viên**.

### 5.5 Ai cấp quyền và cấp ở đâu

1. Quản trị viên vào **QUẢN TRỊ HỆ THỐNG** → bước **«Phân quyền người dùng»**.
2. Chọn người dùng → mở **ma trận quyền**: tích các mức **Xem / Thao tác / Tạo / Sửa / Duyệt / Xuất** cho từng chức năng.
3. Chọn **phạm vi dự án** và **phạm vi kho** cho tài khoản đó.
4. Bấm **«Lưu bảng phân quyền →»**.
5. Muốn cấp **từng bước quản trị**: tích đúng dòng `Quản trị hệ thống` tương ứng **bước 01…14** (⚠️ bước 12/13/14 chỉ Quản trị viên).
6. Nhờ **Quản trị viên** cấp — ⛔ người dùng thường **không tự** cấp quyền cho mình hay cho người khác.

---

## 6. THỦ THUẬT HẰNG NGÀY

### 6.1 Tìm nhanh toàn hệ thống

1. Bấm ô tìm kiếm trên **thanh trên**: *“TÌM NHANH DỰ ÁN, PHIẾU, PO, VẬT TƯ…”*.
2. Gõ **từ 2 ký tự** trở lên. Kết quả hiện theo **loại**: *Dự án · Vật tư · Phiếu đề nghị · PO · Tổ đội · Nhiệm vụ*.
3. Bấm một kết quả để mở thẳng màn tương ứng.
4. ⚠️ Kết quả **chỉ trong phạm vi quyền** của bạn — không thấy dữ liệu bạn không được xem.

### 6.2 Tìm / lọc / sắp xếp trong từng màn

- Hầu hết màn danh sách có **thanh công cụ**: ô **tìm** (tên, mã, số phiếu…), **sắp xếp** (A→Z, mới nhất, số lượng lớn nhất…), **bộ lọc** (trạng thái, kho, dự án, mức tồn…).
- Màn **PR & PO** có nút **「↺ ĐẶT LẠI LỌC/SẮP XẾP」** để xoá nhanh mọi điều kiện.
- Màn **Tồn kho** có bộ lọc **「Chỉ tồn dưới mức tối thiểu」** — rất hữu ích để phát hiện vật tư sắp hết.

### 6.3 Cỡ chữ & mật độ dữ liệu (nhớ theo tài khoản)

1. Bấm **tên/ảnh đại diện** ở góc trên phải.
2. **CỠ CHỮ**: **A−** (nhỏ) · **A** (chuẩn) · **A+** (lớn).
3. **MẬT ĐỘ DỮ LIỆU**: **THOÁNG** · **VỪA** · **CHẶT** — chọn **CHẶT** để thấy nhiều dòng hơn trên một màn hình.
4. Hệ thống **ghi nhớ lựa chọn** cho lần đăng nhập sau.

### 6.4 Sáng / tối & làm việc trên điện thoại

- Nút **☀ / ☾** trên thanh trên để đổi **giao diện sáng / tối**.
- Trên điện thoại: menu thu thành nút **☰** (bấm **「THU GỌN MENU」** để đóng); có khối cài đặt nhanh **BÁO LỖI · GIAO DIỆN · MẬT ĐỘ**.

### 6.5 Xuất dữ liệu & in

- Nút **「⇩ Xuất Excel」** có ở hầu hết màn danh sách (danh sách kho, tồn kho, phiếu đề nghị, PR & PO, danh mục vật tư gốc…). Tệp xuất đọc được **đúng tiếng Việt** trên Excel Windows.
- ⚠️ Nút xuất **bị mờ nếu bạn thiếu quyền Xuất** — đưa chuột lên nút để đọc lý do.
- In: **「▥ In mã Barcode」**, **「▤ Thẻ kho」** (màn kho) và **「▣ In phiếu」** (chi tiết phiếu đề nghị).

### 6.6 Thông báo

- Bấm **chuông** trên thanh trên để mở thông báo hệ thống gửi cho bạn.
- Trong cửa sổ thông báo có **「Đánh dấu đã đọc」** và **「Đánh dấu tất cả đã đọc」**.
- ⚠️ Thông báo đọc **một lần**: sau khi đánh dấu đã đọc, thông báo **không hiện lại** — cần lưu nội dung quan trọng thì chụp lại.

### 6.7 Gửi báo lỗi cho IT ngay trong phần mềm

1. Mở mục **BÁO LỖI** (trên thanh trên / khối cài đặt nhanh ở điện thoại).
2. Nhập **tiêu đề** (ví dụ: *“Sai số liệu hợp đồng”*) và **mô tả thật cụ thể**: các bước đã làm, kết quả mong đợi, kết quả thực tế.
3. Bấm **「Gửi báo lỗi」**. Báo lỗi vào thẳng màn quản trị **«Báo lỗi»** để IT xử lý.

---

## 7. TÌNH HUỐNG THƯỜNG GẶP & CÁCH XỬ LÝ

| # | Hiện tượng | Nguyên nhân | Cách xử lý |
|---|---|---|---|
| 1 | **Không thấy menu/mục mình cần** | Tài khoản **chưa được cấp quyền Xem** của chức năng đó (mục không quyền sẽ ẩn; nhóm rỗng tự ẩn) | Gửi yêu cầu **Quản trị viên** cấp quyền — ⛔ **không phải lỗi phần mềm** |
| 2 | Vào màn nhưng hiện khối **«CHƯA ĐƯỢC PHÂN QUYỀN»** | Có đường vào nhưng **thiếu quyền xem dữ liệu** của chức năng đó | Báo Quản trị viên cấp quyền Xem cho đúng chức năng |
| 3 | **Nút bị mờ / bấm không được** (kể cả bước quản trị bị khoá `locked`) | **Thiếu quyền ở đúng bước đó** (Tạo / Sửa / Duyệt / Xuất) | **Đưa chuột lên nút để đọc lý do** (ví dụ *“Bạn không có quyền tạo phiếu đề nghị”*, *“Cần quyền «Quản trị hệ thống › Tab 11. Audit log»”*), rồi xin cấp đúng mức quyền đó |
| 4 | **Lưu không thành công** | Thiếu trường bắt buộc / sai quy tắc dữ liệu (mã kho trùng, tên kho sai mẫu `KHO <tên dự án>`…) hoặc **máy chủ từ chối do thiếu quyền** | Đọc **dải lỗi đỏ** ngay trên form và sửa theo đúng câu báo lỗi; nếu lỗi quyền ⇒ nhờ cấp quyền. ⚠️ **Không đóng trình duyệt giữa chừng** |
| 5 | **Danh sách trống dù chắc chắn có dữ liệu** | (a) đang để phạm vi **«Tất cả dự án»** ở màn bắt buộc chọn dự án; (b) bộ lọc cũ còn giữ; (c) dữ liệu **ngoài phạm vi dự án/kho** của bạn | (a) **chọn một dự án cụ thể** ở ô «Chọn dự án»; (b) bấm **đặt lại lọc**; (c) kiểm tra lại phạm vi được cấp với Quản trị viên |
| 6 | **Quên mật khẩu** | — | Bấm **«Quên mật khẩu?»** (chỉ nhắc liên hệ Quản trị viên) → Quản trị viên **reset** → đăng nhập bằng **mật khẩu tạm** → hệ thống **bắt buộc đổi mật khẩu mới** |
| 7 | Đăng nhập mãi không được, báo sai | Sai quá **10 lần trong 15 phút** ⇒ tạm khoá | **Chờ 15 phút** rồi thử lại; kiểm tra CapsLock |
| 8 | **Phiếu lâu không được duyệt** | Người duyệt chưa xử lý / quá hạn SLA | Mở **chi tiết phiếu** xem **«Bước đang xử lý»** + **«Người xử lý»**, hoặc mở **Phê duyệt đơn hàng** xem **«Hạn duyệt»** rồi nhắc đúng người |
| 9 | **Nghi ngờ tồn kho sai** | Lệch sổ - thực tế | Lập **kiểm kê** (Định kỳ/Đột xuất) → chênh lệch do người có quyền **duyệt điều chỉnh**. ⛔ **Không sửa tay** số tồn |
| 10 | **Vật tư hết ở kho này nhưng kho khác còn** | — | Dùng **「⇄ Chuyển kho」** → **«Tạo phiếu điều chuyển»** (tồn kho đích chỉ tăng sau khi kho đích xác nhận nhận) |
| 11 | Bấm **「＋ Tạo phiếu cấp phát」** không được | Nút này **đang khoá có chủ ý** (nghiệp vụ cấp phát đang hoàn thiện) | Dùng **「＋ Tạo phiếu xuất」** ở tab `XUẤT & NHẬP` để cấp vật tư cho tổ đội |
| 12 | Nút kho **「✎ Sửa」/「⏹ Ngừng hoạt động」mờ** | **Chưa chọn kho** (chưa bấm vào thẻ kho), hoặc thiếu quyền Sửa | Bấm **thẻ kho** để chọn; nếu vẫn mờ ⇒ xin cấp quyền Sửa kho |
| 13 | Không thấy nút **「＋ Thêm nhân sự」** trong tab `Nhân sự` của kho | Nút **chỉ hiện với Quản trị viên** | Nhờ **Quản trị viên** thêm nhân sự vào kho |
| 14 | Muốn **xoá một kho** nhưng không có nút xoá | Hệ thống **cố ý không cho xoá kho** (giữ lịch sử chứng từ) | Dùng **「⏹ Ngừng hoạt động」** |
| 15 | Một số màn hiện dải **«ĐANG PHÁT TRIỂN»** | Hạng mục chưa được hiệu chỉnh sâu: *“Hạng mục này đang phát triển nên chức năng và thông tin có thể hiển thị chưa đúng như yêu cầu của VNTECH.”* | ⛔ **Không phải lỗi** — dùng nghiệp vụ tương ứng ở màn đã hoàn thiện; ghi nhận lại để báo IT nếu cần |
| 16 | Thông báo đã đọc rồi **không thấy lại** | Thông báo **chỉ đọc 1 lần** | Chụp lại nội dung quan trọng trước khi đánh dấu đã đọc |

> 📌 **Nhớ 3 câu này là xử lý được 80% tình huống:**
> 1. **Không thấy menu/màn/nút ⇒ gần như luôn là THIẾU QUYỀN**, không phải lỗi phần mềm.
> 2. **Đưa chuột lên nút bị mờ** — hệ thống luôn ghi rõ lý do.
> 3. **Danh sách trống ⇒ kiểm tra phạm vi (dự án/kho) và bộ lọc trước**, rồi mới kết luận “không có dữ liệu”.

---

## 8. LIÊN HỆ HỖ TRỢ & TÀI LIỆU LIÊN QUAN

### 8.1 Khi nào liên hệ ai

| Việc | Liên hệ |
|---|---|
| Chưa thấy menu/màn/nút cần dùng; cần cấp quyền | **Quản trị viên** (đề nghị nêu rõ: chức năng nào, mức quyền nào, dự án/kho nào) |
| Quên mật khẩu, tài khoản bị khoá, cần đổi thông tin hồ sơ | **Quản trị viên** |
| Lỗi phần mềm, số liệu sai, màn hình trắng | **Phòng IT** (xem §8.2) |
| Sai quy trình nghiệp vụ / cần thêm bước duyệt | **Quản trị viên** (bước **«Workflow phê duyệt»**) |

### 8.2 Báo lỗi cho hiệu quả — nêu đủ 5 thông tin

1. **Màn hình** đang đứng (ví dụ: `Kho vật tư → tab KHO`).
2. **Các bước đã làm** (bấm nút nào, nhập gì).
3. **Kết quả mong đợi** và **kết quả thực tế**.
4. **Nội dung thông báo lỗi** / **mã tham chiếu** nếu có.
5. **Ảnh chụp màn hình** + **thời điểm** xảy ra.

> 💡 Cách nhanh nhất: dùng luôn mục **BÁO LỖI** trong phần mềm (§6.7) — báo lỗi sẽ vào thẳng màn quản trị để IT xử lý.

### 8.3 Tài liệu liên quan

| Tài liệu | Dùng để |
|---|---|
| `docs/03_HUONG_DAN_NGUOI_DUNG.md` | Bản hướng dẫn ngắn gọn theo công việc hằng ngày |
| `docs/33_MO_TA_CHUC_NANG_VA_HE_THONG.md` | Mô tả chức năng toàn hệ thống, danh mục màn hình |
| `docs/16_HUONG_DAN_SEED_DEMO_VA_TAI_KHOAN_MO_RA.md` | Bộ dữ liệu mẫu `PRJ-DEMO-01` và tài khoản demo |
| `docs/36_KIEM_THU_ALPHA_THEO_BO_PHAN_CHUYEN_MON.md` | Kịch bản kiểm thử theo bộ phận (dùng cho đào tạo/nghiệm thu) |
| `docs/34_TAI_LIEU_DEV.md` | Tài liệu kỹ thuật (dành cho lập trình viên) |

---

*Tài liệu thuộc bộ tài liệu `DOC-ALPHA-TEST-2026.10` của hệ thống VNTECH ERP `V5.3.0-MASTER-BASELINE-R1.1.1` — ⚠️ trạng thái **ALPHA TEST**, phản ánh bản **đang chạy** ngày 08/10/2026. Mọi tên màn/nút trong tài liệu đều đối chiếu từ mã nguồn đang chạy. Kèm: `docs/31_TAI_LIEU_BAN_GIAO.md`.*
