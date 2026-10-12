> **VNTECH ERP — BỘ TÀI LIỆU PHIÊN BẢN `ALPHA TEST`**
> · Phiên bản tài liệu: **`DOC-ALPHA-TEST-2026.10`** · Ngày cập nhật: **08/10/2026** · Phiên soạn: `ERP-SESSION-01`
> · Sản phẩm: `V5.3.0-MASTER-BASELINE-R1.1.1` · Cổng: `:8787` (UI) · `:9000` (cutover) · `:18081` (API Java)
> · ⚠️ Trạng thái: **ALPHA TEST** — tài liệu phản ánh bản ĐANG CHẠY; ⛔ chưa phải bản phát hành chính thức.
> · 📌 Nguồn sự thật: **mã nguồn + CSDL thật** (mọi số liệu đều ĐO được, ⛔ không suy đoán).

# 36 — KẾ HOẠCH KIỂM THỬ ALPHA (THEO BỘ PHẬN CHUYÊN MÔN)

> **Mục đích:** hướng dẫn nhân sự test **từng nhóm chức năng một**, theo đúng **bộ phận chuyên môn** sử dụng.
> **Cách dùng:** mỗi người chỉ test các mục §5–§12 **đúng bộ phận của mình**; mục §13 là ca xuyên bộ phận (do 1 người phụ trách).
> **Nguồn số liệu:** đọc trực tiếp từ mã nguồn (`app/`, `lib/`, `java-backend/`) và CSDL, **không** lấy con số từ tài liệu cũ vì tài liệu đã lệch (xem §16).
> **Quy tắc:** lỗi nghi ngờ do dữ liệu test / hạng mục đã bỏ qua → **KHÔNG báo lỗi**, xem §14 trước khi ghi.

---

## 1. Mục tiêu & phạm vi giai đoạn alpha

| Nội dung | Giá trị |
|---|---|
| Mục tiêu | Phát hiện lỗi chức năng + lỗi phân quyền theo từng bộ phận, **trước khi** nạp dữ liệu thật |
| Đối tượng | Nhân sự các bộ phận: Kế hoạch · Dự án · Ban chỉ huy · Thủ kho · Kế toán · Hành chính–Pháp chế · Ban Giám đốc |
| Hình thức | Mỗi người test **1 nhóm chức năng/lần**, ghi vào file Excel `PHIEU_PHAN_HOI_TEST_VNTECH_ERP_V5_3_0.xlsx` |
| Mức độ | **Alpha** — dữ liệu đang là **bản test (dữ liệu mẫu)**; màn hình còn sửa, một số chỗ hiện chữ «chưa có nguồn» là **có chủ đích** |
| Kỳ vận hành dự kiến | Go-live **05/10** |

**Nguyên tắc bất di bất dịch của đợt test này:**
1. Test **đúng vai trò của bạn**. Bấm nút mà vai trò của bạn **không được phép** mà hệ thống **cho phép** ⇒ đó là **lỗi bảo mật nghiêm trọng** (ghi mức `Nghiêm trọng`).
2. Không sửa dữ liệu bằng tay ngoài phần mềm (không đụng MySQL/SQLite).
3. Mọi lỗi ghi kèm **bước tái hiện** + **ảnh chụp** (nếu lỗi hiển thị).

---

## 2. Điều kiện tiên quyết

| Hạng mục | Giá trị kiểm tra |
|---|---|
| Link truy cập | Do người phụ trách gửi (hiện là link Cloudflare tạm — **đổi mỗi lần khởi động lại server**) |
| Cổng nội bộ | `:9000` (giao diện + API) · `:8787` (giao diện trực tiếp) · `:18081` (API) |
| Trình duyệt | Edge hoặc Chrome bản mới nhất. Test thêm **1 lần ở màn hình nhỏ (1366×768)** |
| Phiếu phản hồi | File Excel `PHIEU_PHAN_HOI_TEST_VNTECH_ERP_V5_3_0.xlsx` — điền **mỗi lỗi 1 dòng** |

### 2.1. Tài khoản test theo vai trò

| Tài khoản | Mật khẩu | Bộ phận / Vai trò | Cấp bậc |
|---|---|---|---|
| `admin` | `Admin123456@` | Quản trị toàn hệ thống | Tổng Giám đốc (50) |
| `thukydemo` | `VnTech@123` | Thư ký Tổng Giám đốc / TP Hành chính – Pháp chế | Trưởng nhóm (20) |
| `trdademo` | `VnTech@123` | Trưởng phòng Dự án | Trưởng phòng (30) |
| `nvdademo` | `VnTech@123` | Nhân viên Phòng Dự án | Nhân viên (10) |
| `trinhtrench` | `VnTech@123` | Trưởng phòng Kế hoạch | Trưởng phòng (30) |
| `nvkhdemo` | `VnTech@123` | Nhân viên Phòng Kế hoạch | Nhân viên (10) |
| `cha.ht` | `VnTech@123` | Chỉ huy trưởng (Ban chỉ huy công trường) | Trưởng nhóm (20) |
| `tkhodemo` | `VnTech@123` | Thủ kho | Trưởng nhóm (20) |
| `kttdemo` | `VnTech@123` | Kế toán trưởng (Tài chính – Kế toán) | Trưởng phòng (30) |

> ⚠️ **CẢNH BÁO 1 — thiếu tài khoản cho Hành chính – Pháp chế:** bộ phận này có **7 module** (`dept_legal_*`: hồ sơ nhân sự, hợp đồng lao động, công văn, văn bản pháp lý, con dấu, bảo hiểm, review hợp đồng) nhưng **không có tài khoản riêng**. Tài khoản gần nhất là `thukydemo` (đồng thời là Thư ký TGĐ). ⇒ **Đề nghị người phụ trách tạo tài khoản HCPC trước khi test bộ phận này.**

> ⚠️ **CẢNH BÁO 2 — mô tả tài khoản `cha.ht` trong tài liệu đã cũ.** Tài liệu hướng dẫn ghi *"duyệt DNMH bậc 1"*, nhưng trong CSDL hiện tại **bước duyệt số 1 (CHT xác nhận nhu cầu) đang bị TẮT (`active=0`)**. Luồng duyệt phiếu đề nghị chạy thật là **4 bước** (xem §4.3). ⇒ **Chỉ huy trưởng KHÔNG duyệt phiếu đề nghị nữa**; người duyệt bước 2 là Thư ký TGĐ. Khi test, anh/chị CHT **không thấy** phiếu ở bước 1 là **đúng**.

---

## 3. Ma trận bộ phận × nhóm chức năng

Mỗi ô là **Mã nhóm chức năng** dùng trong các mục sau. Test theo chiều ngang là việc của bạn.

| Nhóm chức năng (menu) | BGD | KH | DA | BCH | KHO | TCKT | HCPC |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| **TỔNG QUAN** (thẻ KPI, công việc chờ xử lý) | M1 | M1 | M1 | M1 | M1 | M1 | M1 |
| **CÔNG VIỆC** (cá nhân / phòng ban / giao việc / dashboard / báo cáo) | M2 | M2 | M2 | M2 | M2 | M2 | M2 |
| **PHÊ DUYỆT** (trung tâm phê duyệt) | M3 | M3 | M3 | — | — | — | — |
| **QUẢN LÝ DỰ ÁN** (danh sách dự án, BOQ, thi công, tổ đội dự án) | M4 | M4 | M4 | M4 | — | M4 | — |
| **MUA HÀNG & CUNG ỨNG** (PR, PO, nhà cung cấp, giao nhận) | M5 | M5 | M5 | M5 | M5 | — | — |
| **KHO VẬT TƯ** (kho, nhập, xuất, điều chuyển, dashboard tồn kho) | M6 | M6 | — | M6 | **M6** | — | — |
| **CẤP PHÁT & HOÀN TRẢ** (menu mới) | M7 | M7 | — | **M7** | **M7** | — | — |
| **TÀI CHÍNH – KẾ TOÁN** (kế hoạch thanh toán, tạm ứng, chi phí BCH, quỹ, chứng từ) | M8 | — | M8 | — | — | **M8** | — |
| **HÀNH CHÍNH – PHÁP CHẾ** (hồ sơ NV, hợp đồng LD, công văn, văn bản PL, con dấu, bảo hiểm, review HĐ) | M9 | — | — | — | — | — | **M9** |
| **BÁO CÁO** (14 báo cáo tổng hợp + KPI) | M10 | M10 | M10 | M10 | M10 | M10 | M10 |
| **DANH MỤC VẬT TƯ GỐC** (danh sách / nhóm con / mã gốc) | M11 | M11 | M11 | — | M11 | — | — |
| **MEP** | M12 | M12 | M12 | — | — | — | — |
| **QUẢN TRỊ HỆ THỐNG** (14 bước) | M13 | — | — | — | — | — | — |

**Tổng: 13 nhóm chức năng M1–M13.** Mỗi nhóm được chia thành các **chức năng riêng lẻ** có mã `M<nhóm>.<chức năng>` ở §5–§13.

---

## 4. Kiến thức bắt buộc trước khi test

### 4.1. Sáu quyền (capability) — hiển thị ở màn *Quản trị → Phân quyền*

| Mã quyền | Nghĩa | Ví dụ hành vi phụ thuộc |
|---|---|---|
| `canView` | Xem | Thấy menu, mở được màn |
| `canUse` | Thao tác | Dùng chức năng (mở modal, lọc) |
| `canCreate` | Tạo | Nút **Thêm/Tạo**, ghi dữ liệu mới |
| `canEdit` | Sửa | Nút **Sửa**, lưu thay đổi |
| `canApprove` | Duyệt | Nút **Duyệt / Trả lại** ở trung tâm phê duyệt |
| `canExport` | Xuất | Nút **Xuất CSV / Excel** |

> Nguyên tắc của hệ thống: **action chưa được khai quyền thì mặc định TỪ CHỐI** (fail-closed). Nếu bạn thấy nút báo lỗi *"Thao tác chưa được khai báo quyền trong hệ thống"* ⇒ đây là **giới hạn đã biết**, xem §14.1.

### 4.2. Ba tầng phạm vi — quyết định bạn THẤY dữ liệu nào

| Cấp bậc (rank) | Tầm phạm vi | Bạn thấy được |
|---|---|---|
| Từ **Phó Giám đốc** trở lên (≥ 35) | **Toàn công ty** | Mọi dự án, mọi phòng ban |
| **Trưởng phòng** trở lên (≥ 30) | **Phòng ban của bạn** | Dữ liệu thuộc phòng bạn |
| Dưới Trưởng phòng (< 30) | **Cá nhân** | Chỉ việc của bạn được giao |

Có 6 cấp bậc trong hệ thống: `nhan_vien` (10) · `truong_nhom` (20) · `truong_phong` (30) · `pho_giam_doc` (35) · `giam_doc` (40) · `tong_giam_doc` (50).

**Cách kiểm chứng nhanh:** đăng nhập 2 tài khoản khác cấp (ví dụ `nvdademo` nhân viên vs `trdademo` trưởng phòng) cùng mở một màn danh sách. **Số dòng phải khác nhau.** Nếu hai tài khoản thấy **giống như y như r** ở dữ liệu của phòng khác ⇒ **LỖI NGHIÊM TRỌNG (rò rỉ dữ liệu)** — báo ngay.

### 4.3. Luồng duyệt phiếu đề nghị mua hàng — 4 bước (đang chạy thật)

| Bước | Tên bước | Vai trò được duyệt | Thời hạn SLA |
|:-:|---|---|---|
| 1 | ~~CHT xác nhận nhu cầu~~ | **ĐÃ TẮT** (`active=0`) — không dùng | — |
| 2 | Thư ký Tổng Giám đốc | `thuky` | 12 giờ |
| 3 | Phòng Dự án | `project`, `da_nv` | 24 giờ |
| 4 | Phòng Kế hoạch | `procurement`, `kh_nv` | 24 giờ |
| 5 | Giám đốc | `director` | 12 giờ |

- **Cơ chế quá hạn:** đủ 24h chưa duyệt, hệ thống cho duyệt tiếp **nhưng BẮT BUỘC nhập lý do** (nếu quá hạn hơn 72h thì hồ sơ bị **trả lỗi bổ sung** về người lập).
- **Người tạo phiếu KHÔNG được tự duyệt** của chính mình.
- **Quyền duyệt được ghim vào lúc mở bước (snapshot):** sửa cấu hình bước sau này **không** đổi hồ sơ đang chờ.

### 4.4. Sáu đơn vị tổ chức

| Mã | Tên đơn vị | Loại |
|---|---|---|
| `VNTECH` | VNTECH | Công ty |
| `BGD` | Ban giám đốc | Phòng ban |
| `KH` | Phòng Kế hoạch | Phòng ban |
| `DA` | Phòng Dự án | Phòng ban |
| `TCKT` | Tài chính Kế toán | Phòng ban |
| `HCPC` | Hành chính Pháp chế | Phòng ban |
| `BCH` | Ban chỉ huy công trường | Ban chỉ huy dự án |

---

## 5. M1 — TỔNG QUAN (mọi bộ phận)

| Mã | Chức năng cần test | Thao tác kiểm thử | Kết quả mong đợi |
|---|---|---|---|
| M1.1 | Thẻ KPI tổng quan | Mở màn Tổng quan | Các thẻ hiện số liệu; **không** hiện số 0 giả |
| M1.2 | Công việc chờ xử lý | Xem khối "việc chờ bạn" | Chỉ hiện việc **thuộc phạm vi của bạn** (theo §4.2) |
| M1.3 | Phân quyền theo dự án | So số liệu giá trị hợp đồng giữa 2 tài khoản khác phạm vi | Số khác nhau theo phạm vi |
| M1.4 | Mở nhanh từ thẻ | Bấm 1 thẻ KPI | Sang đúng màn tương ứng |
| M1.5 | Thanh điều hướng trái | Kiểm chỉ hiện menu được cấp quyền | Không thấy menu của phòng khác |

## 6. M2 — CÔNG VIỆC (mọi bộ phận)

| Mã | Chức năng cần test | Thao tác kiểm thử | Kết quả mong đợi |
|---|---|---|---|
| M2.1 | Menu Công việc → mở ra **Dashboard** | Bấm menu *Công việc* | Mở thẳng màn Dashboard công việc |
| M2.2 | Đủ 5 mục con | Xem menu con | **Dashboard → Cá nhân → Phòng ban → Giao việc → Báo cáo** (đúng thứ tự) |
| M2.3 | Tab *Cá nhân* — 3 nhóm | Xem 3 nhóm | Của tôi · Được giao · Do tôi tạo |
| M2.4 | Tạo công việc/nhiệm vụ của mình | Tạo 1 việc | Lưu thành công, hiện trong "Của tôi" |
| M2.5 | Cập nhật tiến độ công việc | Sửa tiến độ + ghi chú | Lưu và hiện đúng |
| M2.6 | Chuyển trạng thái công việc | Chuyển Mới → Đang làm → Hoàn thành | Đúng quy tắc; **không** chuyển được trạng thái không hợp lệ |
| M2.7 | Bộ lọc / tìm kiếm / sắp xếp | Lọc theo trạng thái, tìm theo từ khoá, đổi thứ tự cột | Danh sách thu đúng; **không** mất dòng |
| M2.8 | Board Kanban (tab Phòng ban) | Kéo/xem 5 cột trạng thái | Cột khớp trạng thái |
| M2.9 | Cây Task → Tổ đội → Thành viên | Mở tab Phòng ban | Hiện đúng 4 tầng |
| M2.10 | **Phạm vi giao việc theo cấp bậc** | `nvdademo` (nhân viên) vs `trdademo` (trưởng phòng) mở tab *Giao việc* | NV thấy đúng việc của mình; TP thấy thêm việc phòng. **NV KHÔNG giao được việc cho người khác phòng** |

## 7. M3 — TRUNG TÂM PHÊ DUYỆT (BGD · KH · DA)

> Đây là nhóm chức năng quan trọng nhất — nghiệp vụ cốt lõi của công ty.

| Mã | Chức năng cần test | Thao tác kiểm thử | Kết quả mong đợi |
|---|---|---|---|
| M3.1 | Menu 1 cấp | Bấm menu *Phê duyệt* | Vào thẳng màn, **không** phải bấm 2 lần |
| M3.2 | Danh sách → khu "đang xử lý" → **Chi tiết** | Bấm dòng phiếu | Mở **modal chi tiết** (không phải tải file) |
| M3.3 | Dải bước duyệt **ngang** | Mở modal chi tiết | Các bước nằm **cùng hàng**, có đường nối; màn hình hẹp thì tự xuống dọc |
| M3.4 | Thông tin từng bước | Nhìn từng bước | Bước đã xử lý hiện người duyệt + phòng ban + thời gian; bước chưa tới hiện *"Đang chờ / Chưa tới bước này"* |
| M3.5 | **Duyệt** phiếu ở đúng bước của mình | Duyệt bằng `thukydemo` rồi `nvdademo` | Chỉ người có quyền bước đó duyệt được |
| M3.6 | **Không duyệt nhầm bước** | Mở phiếu ở bước 3 bằng tài khoản bước 2 | Hệ thống **từ chối**, không cho duyệt |
| M3.7 | **Trả lại** phiếu | Trả lại kèm lý do | Phiếu về người lập, có ghi lý do |
| M3.8 | Yêu cầu bổ sung | Gửi yêu cầu bổ sung | Người lập nhận được, phiếu dừng lại |
| M3.9 | **Quá hạn SLA → bắt buộc lý do** | Duyệt 1 phiếu đã quá hạn mà để trống ô bình luận | Nút Duyệt **bị khoá**, hiện cảnh báo *"Bước này đã QUÁ HẠN SLA. Bắt buộc nhập lý do duyệt quá hạn"* |
| M3.10 | Ghi lý do quá hạn | Duyệt quá hạn **có** lý do | Duyệt được, lý do được lưu lại xem lại được |
| M3.11 | Card "Chờ Giám đốc duyệt" | Mở Dashboard công việc bằng `admin` / `thukydemo` | Hiện card; bằng tài khoản thấp hơn Trưởng phòng ⇒ **card ẩn** |
| M3.12 | Card "Đơn quá hạn SLA" | Xem Dashboard | Hiện số đơn quá hạn; nếu ghi *"chưa có nguồn"* thì xem §14.3 |
| M3.13 | Tệp đính kèm phiếu | Mở khối tài liệu | Chữ **không chồng**, nút chọn tệp **bấm được**, không tràn ngang |
| M3.14 | Xem ảnh đính kèm | Bấm vào ảnh | Mở **lightbox** xem phóng to (không nhảy sang tab khác) |

## 8. M4 — QUẢN LÝ DỰ ÁN (BGD · KH · DA · BCH)

| Mã | Chức năng cần test | Thao tác kiểm thử | Kết quả mong đợi |
|---|---|---|---|
| M4.1 | Danh sách dự án — toolbar ngang | Xem thanh công cụ | Đặt **ngang hàng** nhãn "DANH SÁCH DỰ ÁN", có tìm/sắp xếp/lọc |
| M4.2 | Lọc 4 chiều | Lọc theo Trạng thái · Quản lý dự án · Phòng ban · Ngày | Lọc đúng, số dòng giảm tương ứng |
| M4.3 | 5 tab chi tiết dự án | Mở 1 dự án | Tổng quan · Nhân sự · Tổ đội · Kho · Ban chỉ huy — **cả 5 đều mở được** |
| M4.4 | Modal chi tiết thực thể | Bấm 1 dòng trong tab Nhân sự | Mở modal đúng loại thực thể |
| M4.5 | Tạo Ban chỉ huy dự án | Bấm *＋ Tạo Ban chỉ huy dự án* (vai trò CHT/quản trị) | Tạo được, tạo kho đi kèm; tài khoản khác **không** thấy nút |
| M4.6 | Đổi trạng thái / xoá dự án | Sửa trạng thái, thử xoá | Có xác nhận; dự án đang có dữ liệu phải cảnh báo |
| M4.7 | Phạm vi dự án | Mở dự án bằng 2 tài khoản khác phạm vi | Tài khoản ngoài phạm vi **không thấy / không mở được** |
| M4.8 | BOQ — phiên bản & dòng | Mở màn BOQ, thêm phiên bản, thêm dòng | Lưu đúng; **không** nhân bản dòng khi nhập từ hệ thống khác |
| M4.9 | BOQ — đơn giá hợp đồng | Sửa đơn giá hợp đồng | Tổng tiền BOQ **không bị nhân đôi**; đối chiếu với giá trị hợp đồng khớp |
| M4.10 | Đối chiếu vật tư BOQ ↔ danh mục | Bấm *So sánh vật tư*, xác nhận ánh xạ | Ra danh sách chênh lệch; xác nhận 1 dòng thì ghi nhận được |
| M4.11 | Nhật ký thi công | Tạo nhật ký, duyệt nhật ký | Lưu và duyệt được; sai khối lượng bị từ chối |
| M4.12 | Sản lượng & thu hồi vốn | Mở màn, lưu báo cáo sản lượng, duyệt, lưu thu hồi vốn | Đủ 4 bước; số tiền thu hồi **không bằng 0** nếu đã nhận khối lượng |
| M4.13 | Danh sách tổ đội dự án | Mở màn TỔ ĐỘI, lọc theo dự án | Lọc đúng theo dự án |

## 9. M5 — MUA HÀNG & CUNG ỨNG (BGD · KH · DA · BCH)

### 9.1. Nhà cung cấp & đối tác (KH chủ trì)

| Mã | Chức năng cần test | Thao tác kiểm thử | Kết quả mong đợi |
|---|---|---|---|
| M5.1 | Menu nhà cung cấp **ở cuối nhóm** | Xem vị trí mục | Mục NCC nằm cuối nhóm Mua hàng |
| M5.2 | Tên mục | Đọc tên | Hiện "**Danh mục nhà cung cấp**" (không phải "…dùng cho PO") |
| M5.3 | CRUD nhà cung cấp | Thêm / Sửa / Ngừng / Xoá | Đủ 8 trường; có xác nhận khi xoá |
| M5.4 | Tìm / sắp xếp / lọc NCC | Thao tác toolbar | Đúng kết quả |
| M5.5 | Modal tạo NCC | Bấm *Chi tiết* → *Thêm* | Mở **modal** đủ trường, không phải sideform |
| M5.6 | Modal chi tiết NCC **3 tab** | Mở modal chi tiết | 3 tab: Thông tin · PO · Danh sách vật tư — đều mở được |
| M5.7 | Vật tư của NCC — thêm/xoá | Mở tab *Danh sách vật tư* | Thêm/xoá được, không trùng |
| M5.8 | **Cảnh báo vật tư NCC chưa có** | Tạo PO với vật tư chưa gắn NCC | Hiện câu hỏi *"Vật tư này chưa có trong danh mục vật tư của nhà cung cấp. Bạn có muốn thêm không?"* — bấm **Có** thì thêm, **Không** thì giữ nguyên |
| M5.9 | Email NCC | Sửa email NCC, mở lại | Email được lưu và hiển thị lại đúng |
| M5.10 | Đối tác | Mở mục Đối tác | Xem §14.2 — nhóm này **tạm bỏ qua** |

### 9.2. Phiếu đề nghị mua hàng (PR)

| Mã | Chức năng cần test | Thao tác kiểm thử | Kết quả mong đợi |
|---|---|---|---|
| M5.11 | Lập phiếu đề nghị | Bấm *Thêm phiếu*, chọn dự án, thêm dòng vật tư, số lượng | Lưu thành công, sinh mã phiếu |
| M5.12 | **Chặn lập phiếu khi thiếu phân công duyệt** | Lập phiếu ở dự án chưa có người duyệt | Báo rõ *"…chưa được phân quyền dự án này"* — đây là **đúng** |
| M5.13 | Nhập từ Excel | Tải mẫu → điền → nạp | Báo xem trước số dòng hợp lệ / không hợp lệ trước khi ghi |
| M5.14 | Toolbar PR ngang + sắp xếp thật | Xem thanh công cụ | Có tìm/sắp xếp/lọc; bấm sắp xếp **thật sự đổi thứ tự** |
| M5.15 | **Card "VẬT TƯ ĐANG THIẾU"** | Mở màn PR | Card hiện danh sách vật tư thiếu; bấm *Lập phiếu* tự điền |
| M5.16 | Trạng thái phiếu tách bạch | Nhìn cột trạng thái | Cột bước duyệt **không** hiện nhầm trạng thái nghiệp vụ |
| M5.17 | Chi tiết phiếu | Mở modal chi tiết | Thấy dòng vật tư, tệp đính kèm, lịch sử |
| M5.18 | Trả lại & sửa lại | Người duyệt trả về → người lập sửa & gửi lại | Vòng lặp hoạt động |
| M5.19 | Huỷ phiếu | Huỷ 1 phiếu | Chuyển trạng thái huỷ, có thông báo cho người tạo |

### 9.3. Đơn mua (PO)

| Mã | Chức năng cần test | Thao tác kiểm thử | Kết quả mong đợi |
|---|---|---|---|
| M5.20 | Tạo PO từ phiếu đề nghị | Chọn phiếu → tạo PO | PO lấy **đơn giá của dòng phiếu**; tổng tiền = Σ(số lượng × đơn giá) |
| M5.21 | PO không có đơn giá | Tạo PO từ dòng phiếu **không** có giá | Ghi **0**, **không** tự bịa giá |
| M5.22 | Sửa giá PO | Sửa đơn giá | Tổng PO cập nhật theo; **không** ghi ngược danh mục vật tư |
| M5.23 | Duyệt / Từ chối PO | Duyệt PO bằng tài khoản có `canApprove` | Duyệt/từ chối được; tài khoản không có quyền bị từ chối |
| M5.24 | Đóng dòng PO | Đóng 1 dòng | Dòng ngừng nhận thêm |
| M5.25 | Tách tab PR / PO | Xem 2 tab | Mỗi tab một danh sách riêng, không lẫn |

### 9.4. Giao nhận công trường (KH · BCH · KHO)

| Mã | Chức năng cần test | Thao tác kiểm thử | Kết quả mong đợi |
|---|---|---|---|
| M5.26 | 4 thẻ giao nhận | Mở màn *Giao nhận công trường* | 4 thẻ (hôm nay / trễ hạn / sắp tới / theo NCC) hiện số liệu |
| M5.27 | Modal chi tiết thẻ | Bấm 1 thẻ | Mở modal chi tiết |
| M5.28 | Nhận hàng (GRN) | Nhận số lượng thực nhận, thêm **nhiều ảnh** | Lưu GRN; ảnh hiện đủ; **không** tràn ngang |
| M5.29 | Chứng chỉ / ảnh | Mở chi tiết phiếu nhập | Cột ảnh hiện **số thật** (không phải số 0), cột BCH xác nhận hiện **tên người** |
| M5.30 | BCH xác nhận giao hàng | CHT bấm *Xác nhận giao hàng* | Cập nhật trạng thái; người khác không xác nhận được |
| M5.31 | Đơn hàng đã giao | Mở màn *Đơn hàng đã giao* | Có tìm/sắp xếp/lọc; bấm dòng mở **modal chi tiết đơn giao hàng** |
| M5.32 | Lịch sử giao nhận | Mở tab lịch sử trong modal | Xem được lịch sử giao nhận của đơn |

## 10. M6 & M7 — KHO VẬT TƯ (BGD · KH · BCH · Thủ kho)

> Phần lõi nghiệp vụ kho — nhóm chức năng nhiều bước nhất. KHO là bộ phận chủ trì.

| Mã | Chức năng cần test | Thao tác kiểm thử | Kết quả mong đợi |
|---|---|---|---|
| M6.1 | Kho hiển thị dạng **thẻ** | Mở màn *Kho vật tư* | Kho hiện dạng thẻ, không phải bảng |
| M6.2 | Dashboard tồn kho **tổng hợp ↔ theo kho** | Chuyển 2 chế độ | Số liệu 2 chế độ khớp nhau |
| M6.3 | 8 chỉ số tồn kho | Xem dashboard | Đủ 8 chỉ số; chỉ số không có nguồn ghi *"chưa có nguồn"* (xem §14.3) |
| M6.4 | Tạo kho cho dự án | Mở modal *＋ Tạo kho cho dự án* | Tạo được; mở nhánh "Không" cũng phải hợp lệ |
| M6.5 | **Nhập kho** — toolbar + sắp xếp/lọc | Mở tab Nhập kho | Toolbar ngang, lọc theo kho và mức tồn thấp |
| M6.6 | Tạo phiếu nhập | Bấm *Nhập* | Mở modal tạo phiếu nhập |
| M6.7 | **Tạo phiếu nhập từ phiếu xuất / điều chuyển** | Từ danh sách phiếu xuất bấm *Tạo phiếu nhập* | Tự điền kho đi → kho đến; số phiếu có tiền tố `GRN-STO` |
| M6.8 | Tải ảnh / chứng chỉ lên phiếu nhập | Gắn nhiều ảnh | Ảnh lưu và hiện; bấm xem phóng to |
| M6.9 | **Xuất kho** — CRUD + tìm/sắp xếp/lọc | Mở tab Xuất kho | Đủ CRUD; danh sách phiếu xuất/đơn xuất đủ **9 cột** |
| M6.10 | Chuỗi cấp phát **4 bước** | Tạo phiếu cấp phát | (1) CHT duyệt → (2) xác nhận ghi tồn → (3) thủ kho xác nhận → (4) tạo phiếu nhập |
| M6.11 | **Cấp phát — Hoàn trả** (menu mới, 2 tab) | Mở menu *Cấp phát & Hoàn trả* | 2 tab: Cấp phát · Hoàn trả |
| M6.12 | Danh sách cấp phát | Xem tab Cấp phát | Có mã đơn / người tạo / tổ đội / dự án / kho xuất (trường không có nguồn hiện "—") |
| M6.13 | Danh sách hoàn trả | Xem tab Hoàn trả | Có **kho nhận** |
| M6.14 | **Xác nhận lắp đặt** | Xác nhận khối lượng lắp đặt | Hợp lệ thì tăng tồn; dòng hỏng báo rõ (xem §14.4) |
| M6.15 | Kiểm kê kho | Tạo phiếu kiểm kê, duyệt điều chỉnh | Có bước duyệt; số lệch hiển thị đúng |
| M6.16 | Điều chuyển kho | Tạo phiếu điều chuyển, duyệt, gửi, nhận | Đủ 4 bước; tồn kho đi/kho đến cập nhật |
| M6.17 | Phân quyền kho | Mở kho bằng 2 tài khoản khác phạm vi kho | Tài khoản ngoài phạm vi **không thấy kho** |
| M6.18 | Định mức vật tư theo dự án | Mở màn định mức, lưu, duyệt | Lưu/duyệt được |

## 11. M8 — TÀI CHÍNH – KẾ TOÁN (BGD · DA · TCKT)

> TCKT chủ trì. Nhóm này **chưa có task riêng trong MT2** (xem §14.5) — test ở mức "dùng được & số liệu khớp", chưa đòi hỏi nghiệp vụ sâu.

| Mã | Chức năng cần test | Thao tác kiểm thử | Kết quả mong đợi |
|---|---|---|---|
| M8.1 | Sổ thanh toán hợp đồng | Mở màn *Sổ thanh toán* | Danh sách kế hoạch + cột *Quá hạn* = số thật tính từ kế hoạch chưa thanh toán |
| M8.2 | Nhập / sửa / xoá khoản thanh toán | Lưu 1 khoản thanh toán | Tổng đã thu cập nhật theo |
| M8.3 | Kế hoạch thanh toán | Thêm / đổi trạng thái / xoá | Đủ 3 thao tác |
| M8.4 | Tạm ứng / hoàn ứng | Lập tạm ứng, quyết toán, xoá | Đủ vòng đời |
| M8.5 | Chi phí Ban chỉ huy | Lập chi phí, duyệt, xoá | Đủ 3 thao tác |
| M8.6 | Sổ quỹ & ngân hàng | Thêm tài khoản ngân hàng, ghi sổ quỹ, xoá | Số dư cập nhật |
| M8.7 | Chứng từ kế toán | Lưu / xoá chứng từ | Đủ 2 thao tác |
| M8.8 | **Đối chiếu tiền** | So số tiền trên màn Thanh toán với tổng hợp đồng | Tổng thu ≤ giá trị hợp đồng (xem §14.6 — dữ liệu hiện đang lệch) |
| M8.9 | Phân quyền TCKT | Đăng nhập `kttdemo` | Thấy đúng nhóm Tài chính; **không** thấy nhóm Mua hàng/Kho nếu chưa cấp quyền |

## 12. M9 — HÀNH CHÍNH – PHÁP CHẾ (HCPC)

| Mã | Chức năng cần test | Thao tác kiểm thử | Kết quả mong đợi |
|---|---|---|---|
| M9.1 | Hồ sơ nhân sự | Mở danh sách hồ sơ | Danh sách hiện; **không** lọc theo dự án |
| M9.2 | Modal hồ sơ **3 tab** | Mở modal sửa hồ sơ | 3 tab: Thông tin user · Thông tin cá nhân · Dự án đã và đang tham gia |
| M9.3 | Sửa hồ sơ — trường nhập được | Sửa ngày/địa danh rồi lưu & mở lại | Giá trị đã nhập **hiển thị lại được** |
| M9.4 | Hợp đồng lao động | Thêm / đổi trạng thái / xoá | Đủ 3 thao tác |
| M9.5 | Công văn đến / đi | Tạo công văn, gắn nhiều ảnh, bấm *Sửa* | Tạo được, sửa được, ảnh hiện đủ |
| M9.6 | Văn bản pháp lý + liên kết công văn | Tạo văn bản pháp lý, chọn công văn liên kết | Lưu liên kết; mở lại vẫn còn liên kết; bỏ liên kết được |
| M9.7 | Con dấu / Ủy quyền | Thêm / ngừng / xoá | Đủ 3 thao tác |
| M9.8 | Bảo hiểm & chế độ | Thêm / ngừng / xoá bản ghi | Đủ 3 thao tác; không lọc theo dự án |
| M9.9 | **Review hợp đồng** | Mở màn, mở 1 hợp đồng, ghi nhận | Xem §14.7 — **cần kiểm chứng ngay, có thể đang lỗi 403** |

## 13. M10 – M13 — BÁO CÁO · DANH MỤC VẬT TƯ · MEP · QUẢN TRỊ

### M10 — BÁO CÁO & KPI (mọi bộ phận)

| Mã | Chức năng cần test | Thao tác kiểm thử | Kết quả mong đợi |
|---|---|---|---|
| M10.1 | Menu báo cáo **tổng hợp** | Xem menu nhóm Báo cáo | 1 mục *Báo cáo & cảnh báo* + 1 mục *KPI & hiệu suất nhân viên* (không chia theo phòng ban) |
| M10.2 | Danh mục 14 báo cáo | Mở màn báo cáo, xem danh sách | Đủ **14** báo cáo dùng chung |
| M10.3 | Mỗi báo cáo có số liệu | Mở từng báo cáo | Có dữ liệu thật; báo cáo không có dữ liệu phải ghi *"chưa có nguồn"* **không** hiện 0 giả |
| M10.4 | Xuất báo cáo | Bấm nút xuất | Tài khoản có `canExport` mới được xuất |

### M11 — DANH MỤC VẬT TƯ GỐC (BGD · KH · DA · KHO)

| Mã | Chức năng cần test | Thao tác kiểm thử | Kết quả mong đợi |
|---|---|---|---|
| M11.1 | 3 tab tách biệt | Xem tab | **Danh sách vật tư** · **Nhóm con mã vật tư gốc** · **Mã vật tư gốc** — tách rõ, không chồng |
| M11.2 | Lọc trạng thái | Lọc "Đã ngừng" | **CÓ** kết quả (không phải luôn rỗng) |
| M11.3 | Tạo/sửa mã vật tư gốc | Thêm mã mới | Hệ thống M&E (Điện/Tách khí/Nước/Điều hòa) suy ra đúng từ nhóm; **không** tự ghi "KHAC" |
| M11.4 | **Hệ M&E đúng** | Kiểm vài mã mẫu (Điện, Tách khí, Nước, Điều hòa) | Phân loại đúng hệ, **không** rơi hết về "Khác" |
| M11.5 | Đổi mã gốc | Đổi mã của 1 vật tư | Bắt buộc nhập lý do; lịch sử đổi mã được ghi |
| M11.6 | Nhóm con thuộc nhóm | Tạo nhóm con thuộc nhóm không tồn tại | Bị từ chối rõ ràng |
| M11.7 | Trùng tên / trùng alias | Tạo trùng | Có thông báo trùng đúng loại |
| M11.8 | Tìm kiếm / sắp xếp / lọc vật tư | Thao tác thanh công cụ | Đúng kết quả |
| M11.9 | Quyền sửa danh mục | Tài khoản không có `canEdit` thử sửa | Không có nút Sửa / bị từ chối |

### M12 — MEP (BGD · KH · DA) — **CHƯA HOÀN THIỆN**

| Mã | Chức năng | Kết quả mong đợi |
|---|---|---|
| M12.1 | 8 mục MEP (PDA/Điều phối, Kế hoạch triển khai, Shopdrawing, BOQ & bóc tách KL, Kiểm soát VT, Phát sinh/RFI/RFQ/NCR, Hoàn công, Đấu thầu kỹ thuật) | Nhóm MEP **đang phát triển**. Menu hiện kèm nhãn *"đang phát triển"*. **Chỉ kiểm tra:** mở được, không lỗi 500. **KHÔNG** báo lỗi vì chưa làm (xem §14.2) |

### M13 — QUẢN TRỊ HỆ THỐNG (chỉ `admin`)

| Mã | Chức năng cần test | Kết quả mong đợi |
|---|---|---|
| M13.1 | 14 bước quản trị | Đủ 14 bước: Tài khoản · Tổ chức · Chức danh/vai trò · Nhóm quyền nghiệp vụ · Phân quyền phòng ban · Phân quyền người dùng · Cấp bậc hệ thống · Phạm vi dự án & kho · Workflow phê duyệt · Ngoại lệ cá nhân · Audit log · Cấu hình hệ thống · Thông báo · Báo lỗi |
| M13.2 | Quản lý tài khoản | Thêm / sửa / ngừng / đặt lại mật khẩu / xoá. Bắt buộc có **mã nhân viên** |
| M13.3 | Chữ ký trên tài khoản | Chọn 1 ảnh chữ ký khi tạo/sửa; mở lại vẫn còn. Chỉ **1 ảnh**, chọn ảnh mới thì thay ảnh cũ |
| M13.4 | Cấu hình cấp bậc hệ thống | Đủ 6 cấp; **không** xoá được cấp đang có người dùng |
| M13.5 | Phân quyền phòng ban | Bật/tắt quyền cho từng module của phòng; xoá dòng quyền |
| M13.6 | Phân quyền người dùng | Cấp 6 quyền cho từng người; có ô "ghi đè ngoại lệ cá nhân" |
| M13.7 | Phạm vi dự án & kho | Gán cho người dùng; mức tối thiểu đủ dùng |
| M13.8 | Cấu hình thông báo | Tạo cấu hình: kênh Web/Email, người nhận (toàn công ty / 1 người / nhiều người / 1 phòng / 1 dự án), giờ gửi, giờ kết thúc |
| M13.9 | Nhật ký kiểm toán | Mỗi thao tác ghi/thay đổi có dòng nhật ký hiển thị |
| M13.10 | **Chặn tài khoản thường** | Đăng nhập `nvdademo` vào nhóm Quản trị | **Không** thấy nhóm Quản trị hệ thống, hoặc thấy nhưng bấm vào báo *«CHƯA ĐƯỢC PHÂN QUYỀN»* — không mở được màn |
| M13.11 | Báo lỗi / góp ý | Bấm nút Báo lỗi trên mọi màn, gửi 1 lỗi; admin xem ở bước *Báo lỗi* | Gửi được, admin thấy, đánh dấu đã xử lý được |

## 14. Những hạng mục KHÔNG được báo là lỗi (đọc trước khi ghi phiếu)

### 14.1. 18 chức năng bị chặn 403 cho TẤT CẢ tài khoản (kể cả admin)

Đọc trực tiếp từ `ActionRbacRegistry.java`: các action dưới đây **không khai module** và **không nằm trong danh sách công khai** ⇒ hệ thống trả lỗi *"Thao tác chưa được khai báo quyền trong hệ thống"*.

`Nhập hàng loạt dự án` · `Nhập hàng loạt người dùng` · `Lưu cấu hình bước duyệt` · `Đặt trạng thái bước duyệt` · `Xoá bước duyệt` · `Lưu nhóm vật tư` · `Đặt trạng thái nhóm vật tư` · `Xoá nhóm vật tư` · `Lưu nhóm con vật tư` · `Đặt trạng thái nhóm con vật tư` · `Xoá nhóm con vật tư` · `Nhập danh mục vật tư` · `Gửi lại email` · `Lưu cấu hình email` · `Lưu cấu hình hiển thị` · `Lưu cấu hình Trust` · `Đặt trạng thái tổ đội dự án` · `Xoá tổ đội dự án`

⇒ **Nếu bấm nút lưu ở các màn: Nhóm con vật tư, Bước duyệt, Cấu hình email, Tổ đội dự án mà báo lỗi 403 ⇒ KHÔNG BÁO LỖI.** Ghi vào cột *Ghi chú* là "chặn quyền 403 – đã biết".

### 14.2. Các nhóm chức năng **cố ý** tạm bỏ qua

| Nhóm | Trạng thái |
|---|---|
| Toàn bộ nhóm **MEP** (8 mục) | Chưa làm. Menu có nhãn *"đang phát triển"* |
| **Đối tác** | Tạm bỏ qua |
| **Tài chính – Kế toán** (mục nghiệp vụ §9 của Master Task 2) | Chưa có đề án; màn hình cơ bản đã có, nghiệp vụ chưa chốt |
| **Thi công / Sản lượng / Thu hồi vốn** (nghiệp vụ sâu) | Chỉ có màn cơ bản |
| **Logic đánh giá tiến độ dự án** | Không có mô tả nghiệp vụ ⇒ % tiến độ dự án **cố ý để trống** |
| **So sánh/Đối chiếu BOQ · Soát trùng Alias · Chất lượng danh mục** | Tạm bỏ qua |
| Nhóm menu **TỔ ĐỘI** | Nhóm khai trong danh mục nhưng **không có mục nào thuộc nhóm** ⇒ **không bao giờ hiển thị**. Màn Tổ đội nằm trong nhóm *Quản lý dự án* |

### 14.3. Chữ «chưa có nguồn» / số 0 / dấu «—» là **có chủ đích**

Một số chỗ hệ thống **không có cột dữ liệu** nên hiện *"chưa có nguồn"* thay vì bịa số: **giá trị kho** ở Dashboard tồn kho · **Người tạo / Kho xuất** ở danh sách cấp phát · **Kho nhận** ở danh sách hoàn trả · **Số đơn quá hạn SLA** khi chưa có nguồn. ⇒ **Đây là đúng thiết kế, KHÔNG BÁO LỖI.**

### 14.4. Dữ liệu mồ côi có sẵn — một số thao tác sẽ báo lỗi **do dữ liệu**

Đo được: **32** dòng cấp phát mồ côi · **15** dòng duyệt mồ côi · **3** dòng xuất kho trỏ tổ đội không tồn tại · **3** dòng BOQ trỏ vật tư không còn · **1** dòng phiếu đề nghị trỏ phiếu không tồn tại · **1** dòng PO trỏ PO không tồn tại.

⇒ Hiện tượng đã biết: bấm **Xác nhận lắp đặt** có thể báo *"Dòng xác nhận lắp đặt không hợp lệ"* dù bạn làm đúng. ⇒ **Ghi rõ dòng dữ liệu nào bị lỗi** (mã phiếu/mã dòng) để đội kỹ thuật dọn.

### 14.5. Tiền dự án PRJ-DEMO-01 đang lệch — không dùng làm chuẩn đối chiếu

Đã ghi nhận: **số tiền đã thu lớn hơn giá trị hợp đồng**, và có dòng PO đơn giá bằng 0. ⇒ Khi test M8.8 (đối chiếu tiền) **dùng dự án khác** hoặc ghi nhận số và báo, **đừng kết luận hệ thống tính sai**.

### 14.6. Mô tả vai trò `cha.ht` đã cũ
Xem §2.1 Cảnh báo 2 — CHT **không** duyệt bước 1 nữa.

### 14.7. ⚠️ CẦN KIỂM CHỨNG NGAY — có thể màn đang lỗi 403

Đọc `ActionRbacRegistry.java`: **5 action của tính năng Review hợp đồng** (`mở`, `ghi nhận`, `lưu`, `xem danh sách`, `xoá`) và **API phạm vi công việc** (`work_scope`) **không được khai module**. Theo nguyên tắc *mặc định từ chối*, các chức năng này **có thể trả 403 cho mọi tài khoản**.

⇒ **Ưu tiên cao:** phần HCPC test mục **M9.9 (Review hợp đồng)** ngay khi bắt đầu. Nếu đúng như dự đoán ⇒ màn này **đang không dùng được** và cần vá trước go-live.

### 14.8. Hai điểm còn lệch chưa có quyết định nghiệp vụ — **đừng báo lỗi kỹ thuật**
1. Vật tư có `system` lệch nhóm ở vài mã (dữ liệu cũ) — chờ quyết định sửa dữ liệu.
2. Bước duyệt "chưa tới bước này" hiện hiển thị *Đang chờ* — đang chờ chốt cách hiển thị.

---

## 15. Quy tắc chấm mức độ lỗi

| Mức | Khi nào dùng | Ví dụ |
|---|---|---|
| **Nghiêm trọng** | Chặn nghiệp vụ / rò rỉ dữ liệu / mất dữ liệu | Không lập được phiếu; thấy dữ liệu của phòng khác; xoá nhầm hàng loạt; số tiền sai |
| **Cao** | Lỗi chức năng chính, có cách khắc phục | Sai số liệu 1 ô; nút bấm không phản ứng; lọc sai |
| **Trung bình** | Lỗi hiển thị / trải nghiệm | Chữ chồng, lệch bố cục, thiếu nhãn |
| **Thấp** | Góp ý cải tiến | Gợi ý thêm bộ lọc, đổi thứ tự cột |

---

## 16. Quy trình đề xuất cho đợt alpha

| Bước | Nội dung | Thời gian |
|:-:|---|---|
| 1 | **P0 — Kiểm chứng 4 mục nghi trở lại:** M9.9 (Review HĐ có 403 không) · luồng duyệt 4 bước M3 · chuỗi cấp phát 4 bước M6.10 · tạo PO lấy đúng đơn giá M5.20 | Ngày 1 |
| 2 | **P0 — Phân quyền:** mỗi người test 3 mục: (a) mình **không** được phép làm gì, (b) mình được phép làm gì, (c) dữ liệu ngoài phạm vi có bị lộ không (§4.2) | Ngày 1–2 |
| 3 | **P1 — Chức năng chính của bộ phận:** mỗi người test §5–§13 đúng bộ phận mình, theo thứ tự mã nhóm | Ngày 2–4 |
| 4 | **P1 — Dữ liệu:** kiểm tra số liệu màn nào hiển thị 0 hoặc "—" dù có dữ liệu thật | Song song |
| 5 | **P2 — Hiển thị & trải nghiệm:** màn hình nhỏ 1366×768, tiếng Việt có dấu, cỡ chữ | Song song |
| 6 | Tổng hợp phiếu, xếp mức độ, chốt danh sách sửa trước go-live | Cuối đợt |

---

## 17. Đối chiếu: các con số trong tài liệu cũ đang **không nhất quán**

Khi trao đổi với đội kỹ thuật, **không** dùng các con số sau làm chuẩn vì chúng mâu thuẫn nhau:

| Nguồn | Con số tiến độ |
|---|---|
| `MT2_PHASE_TASK_LIST.md` | 98/100 hoàn thành, 2 bỏ qua |
| `MT2_EXECUTION_STATE.md` | 74/81 |
| `MASTER_STATUS.md` (26/09) | 79/81 |
| `MT2_CHECKPOINT.md` | 81 |

Con số chắc chắn: **đếm trực tiếp bảng task = 100 dòng · 98 DONE · 2 SKIPPED · 0 BLOCKED** (đã gỡ hết blocker). Con số "81" là do script đếm bỏ sót dòng viết đậm.

**Số liệu chắc chắn lấy từ mã nguồn dùng trong tài liệu này:**
220 action backend · 173 action do giao diện gọi · 76 module · 14 bước quản trị · 6 quyền · 6 cấp bậc · 7 đơn vị tổ chức · 4 bước duyệt đang chạy · 14 báo cáo · 13 nhóm menu.

---

## 18. Bảng theo dõi tiến độ test (điền khi tổng hợp)

| Bộ phận | Người phụ trách | Nhóm chức năng đã test | Số ca đạt | Số lỗi (N/T/cao/nghiêm trọng) | Ngày hoàn thành |
|---|---|---|---|---|---|
| Ban Giám đốc | | M1–M5, M8, M10–M13 | | | |
| Phòng Kế hoạch | | M1–M5, M7, M10, M11, M12 | | | |
| Phòng Dự án | | M1–M5, M8, M10–M12 | | | |
| Ban chỉ huy | | M1, M2, M4, M5, M6, M7, M10 | | | |
| Thủ kho / Kho | | M1, M2, M5–M7, M10, M11 | | | |
| Tài chính – Kế toán | | M1, M2, M4, M8, M10 | | | |
| Hành chính – Pháp chế | | M1, M2, M9, M10 | | | |
| Xuyên bộ phận | | Luồng mua hàng end-to-end | | | |

---

## 19. Phụ lục — Luồng xuyên bộ phận quan trọng nhất (test 1 lần, đủ người)

**Mua hàng từ A → Z:** Kỹ sư/BCH lập phiếu → Thư ký duyệt → Dự án duyệt → Kế hoạch duyệt → Giám đốc duyệt → Kế hoạch tạo PO → Kho nhận hàng (GRN) → CHT xác nhận giao hàng → Tổ đội được cấp phát → Hoàn trả → Kế toán nhập thanh toán.

**Điểm kiểm tra bắt buộc tại mỗi bước:**
1. Đúng người duyệt **và đúng thứ tự** (không đổi bước).
2. Người không đúng vai trò **không** duyệt được.
3. Từng bước lưu lại vết thời gian + người thao tác (xem ở dòng thời gian của phiếu).
4. Cuối chuỗi: **tổng tiền PO khớp tổng tiền phiếu**; **tồn kho tăng** đúng số lượng nhận; **giảm** đúng số lượng cấp phát.
5. Quay lại Dashboard → các thẻ KPI cập nhật đúng.

---

## 📌 LIÊN KẾT BỘ TÀI LIỆU `ALPHA TEST`

Kế hoạch kiểm thử này thuộc **bộ tài liệu phiên bản `DOC-ALPHA-TEST-2026.10`**:
- ⭐ Điểm vào: [`00_INDEX_TAI_LIEU_ALPHA_TEST.md`](00_INDEX_TAI_LIEU_ALPHA_TEST.md)
- Tài liệu nền cần đọc trước khi kiểm thử: [`33_MO_TA_CHUC_NANG_VA_HE_THONG.md`](33_MO_TA_CHUC_NANG_VA_HE_THONG.md) (chức năng) · [`30_HUONG_DAN_NGUOI_DUNG.md`](30_HUONG_DAN_NGUOI_DUNG.md) (cách dùng)
- ⚠️ Cổng kiểm chứng phải xanh TRƯỚC khi bắt đầu kiểm thử: xem §7 của chỉ mục.

---

# PHẦN BỔ SUNG `ALPHA TEST` (08/10/2026) — CÁC CHỨC NĂNG MỚI ⚠️ CHƯA CÓ TRONG M1–M13

> ⚠️ **VÌ SAO BỔ SUNG**: rà tệp này thấy các từ khoá `uỷ nhiệm` · `admin_tab` · `thêm nhân sự` ·
> `giữ chỗ` · `hub` đều **0 lần** ⇒ kế hoạch cũ ⛔ **chưa phủ** phần phân quyền uỷ nhiệm + 4 chức năng kho
> + giữ chỗ tồn kho. ⭐ Tiêu chí dưới đây lấy từ **phép đo THẬT** ngày 08/10/2026 ✓

## M14 — PHÂN QUYỀN UỶ NHIỆM (BGD · ITM · Quản trị hệ thống)

| # | Kịch bản | Các bước | ⭐ Kỳ vọng (đã đo được) | Mức nếu sai |
|---|---|---|---|---|
| **M14-01** | ⛔ **Không tự nâng quyền cho mình** (`S-1`) | Đăng nhập tài khoản **KHÔNG phải** `role=admin` ⇒ mở Quản trị ⇒ bước 6 «Phân quyền người dùng» ⇒ **tự cấp thêm quyền cho CHÍNH MÌNH** ⇒ bấm Lưu | ⛔ **BỊ CHẶN** (lỗi quyền) · ⭐ tài khoản `role=admin` thì **được phép** | 🔴 CRITICAL |
| **M14-02** | ⭐ **Thấy menu Quản trị theo QUYỀN CẤU HÌNH** (`M-2`) | Tài khoản có **≥1** quyền nhóm quản trị (`admin` hoặc `admin_tab_NN`) ⇒ xem menu trái | ⭐ **THẤY** nhóm «QUẢN TRỊ HỆ THỐNG» + **vào được** màn «DANH MỤC & PHÂN QUYỀN» | 🟠 HIGH |
| **M14-03** | ⛔ **Không có quyền ⇒ không thấy** | Tài khoản **⛔ không** có quyền nhóm quản trị nào ⇒ xem menu | ⛔ **KHÔNG thấy** nhóm quản trị; nếu vào bằng URL ⇒ hiện màn **từ chối truy cập** | 🟠 HIGH |
| **M14-04** | ⭐ **Bước thiếu quyền phải BỊ KHOÁ** | Tài khoản chỉ có `admin_tab_02` ⇒ mở màn Quản trị ⇒ quan sát dải **14 bước** | Bước 01 («Tài khoản») **bị khoá** · bấm ⛔ không mở được · ⛔ không có hiện tượng «lọt» sang bước khác | 🟠 HIGH |
| **M14-05** | ⭐⭐ **U-1 — thấy tài khoản TRONG PHẠM VI** | Tài khoản `admin_tab_01` **+ có phạm vi dự án** ⇒ vào bước 01 | Bảng tài khoản **có dữ liệu** (⭐ đo được: **12 dòng** ở ca mẫu) · nút «Sửa tài khoản» **hiện** · mở được modal | 🟠 HIGH |
| **M14-06** | ⭐ **U-1 — ⛔ KHÔNG thấy toàn bộ** | Cùng tài khoản M14-05 ⇒ **đếm** số dòng bảng | Số dòng **NHỎ HƠN** tổng số tài khoản hệ thống (⭐ đo được: **73** tài khoản toàn hệ) ⇒ đúng «lọc theo phạm vi» | 🟠 HIGH |
| **M14-07** | ⛔ **Giữ admin-only** (⭐ U-1 ⛔ không áp) | Tài khoản uỷ nhiệm ⇒ kiểm dữ liệu nhận được | ⛔ **KHÔNG** nhận `allModulePermissions` · `emailOutbox` · `emailRecipients` (⭐ rỗng `[]`) | 🟠 HIGH |
| **M14-08** | Modal «Sửa tài khoản» đủ tab | Mở modal ở M14-05 | Thấy tab **«Sửa tài khoản»** + **«Phân quyền công việc / Chức năng»** (⭐ đo được: **5 tab**) · đổi tab ⇒ **width & vùng tiêu đề ⛔ KHÔNG đổi** (lệch **0px**) | 🟡 MEDIUM |

## M15 — 4 CHỨC NĂNG KHO MỚI (Thủ kho · Quản trị)

| # | Kịch bản | Các bước | ⭐ Kỳ vọng | Mức nếu sai |
|---|---|---|---|---|
| **M15-01** | **Tạo kho** | Hub Kho ⇒ `＋ TẠO KHO` ⇒ nhập mã/tên/loại/dự án ⇒ Lưu | Tạo thành công · ⛔ **trùng mã ⇒ báo lỗi** (đã có test API khoá điều này) | 🟠 HIGH |
| **M15-02** | **Sửa kho** | Chọn 1 kho ⇒ `✎ SỬA` ⇒ đổi tên ⇒ Lưu | Lưu thành công · ⚠️ **dự án gắn kho ⛔ KHÔNG bị mất** (⭐ bẫy đã trả giá: gửi thiếu `projectId` ⇒ ghi `NULL`) | 🟠 HIGH |
| **M15-03** | **Ngừng hoạt động** (⭐ thay cho «Xoá kho») | Chọn kho ⇒ `⏹ NGỪNG HOẠT ĐỘNG` | Kho **⛔ biến khỏi danh sách đang hoạt động** · ⚠️ **⛔ KHÔNG có nút «Xoá kho»** (hệ ⛔ không cho xoá cứng) | 🟠 HIGH |
| **M15-04** | ⭐ **Thêm nhân sự vào kho** | Chọn kho ⇒ tab **«Nhân sự»** ⇒ `＋ THÊM NHÂN SỰ` ⇒ tìm & chọn 1 nhân sự | ⭐ nút «**LƯU PHÂN CÔNG**» chuyển từ **mờ** sang **BẬT** sau khi chọn người (⭐ đo được: `disabled` `true → false`) | 🟠 HIGH |
| **M15-05** | ⚠️ **Thao tác ghi quyền nhân sự là GHI ĐÈ TOÀN PHẦN** | Ở M15-04 ⇒ trước khi bấm Lưu, ghi nhận quyền hiện có của nhân sự đó | ⚠️ Người test **phải biết**: thao tác này **ghi lại toàn bộ** phạm vi/quyền của nhân sự ⇒ ⛔ **chỉ test trên tài khoản thử**, ⛔ **KHÔNG dùng tài khoản thật** | 🔴 CRITICAL (quy tắc an toàn) |

## M16 — GIỮ CHỖ TỒN KHO KHI PHIẾU ĐANG XỬ LÝ (Thủ kho · KH · BCH)

| # | Kịch bản | Các bước | ⭐ Kỳ vọng | Mức nếu sai |
|---|---|---|---|---|
| **M16-01** | **Phiếu xuất đang xử lý ⇒ giữ chỗ** | Tạo 1 phiếu **XUẤT** ở trạng thái nháp/chờ duyệt với vật tư *X* (⭐ vd tồn 100, xuất 70) | Lượng **70** của *X* vào trạng thái **đang xử lý** | 🔴 CRITICAL |
| **M16-02** | ⛔ **Người khác không xuất quá phần còn lại** | Trong lúc phiếu M16-01 **chưa hoàn thành**, tạo phiếu xuất khác cho cùng *X* | ⛔ **Chỉ xuất được tối đa 30** (phần ⛔ không bị giữ chỗ) · vượt ⇒ báo lỗi | 🔴 CRITICAL |
| **M16-03** | **Hoàn thành ⇒ mới đổi tồn** | Duyệt & hoàn thành phiếu M16-01 | ⭐ **Chỉ khi HOÀN THÀNH** tồn kho nguồn/đích mới thay đổi · phần giữ chỗ được **nhả** | 🔴 CRITICAL |
| **M16-04** | **Huỷ phiếu ⇒ nhả giữ chỗ** | Huỷ phiếu ở M16-01 | Phần giữ chỗ được **nhả** ⇒ phiếu khác xuất lại được đủ | 🟠 HIGH |

## 15b. QUY TẮC GHI PHIẾU LỖI CHO M14–M16
- ⭐ **Bắt buộc kèm**: tài khoản test · quyền đã cấp · **số ĐO được** (số dòng bảng, trạng thái nút, mã lỗi HTTP).
- ⛔ **Không** ghi phiếu lỗi dựa trên «cảm giác» — ⚠️ tệp này đã ghi nhận nhiều ca «đỏ do PHÉP ĐO, ⛔ không phải lỗi sản phẩm».
- ⚠️ **Cảnh báo an toàn**: ⛔ **KHÔNG** test M15-04/M15-05 trên tài khoản thật (thao tác ghi đè quyền).
