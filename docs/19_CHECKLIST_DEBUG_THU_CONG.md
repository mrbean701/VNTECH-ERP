# 19 — CHECKLIST DEBUG THỦ CÔNG & NHẬT KÝ THAY ĐỔI

Ngày: 15/09/2026 · Người lập: Agent phát triển · Cập nhật: sau khi xong **P0 → P7**
Kế hoạch gốc: `docs/18` · Lộ trình 5 giai đoạn: `docs/17`

> Mục đích: bạn tự kiểm tra từng mục dưới đây trên giao diện. Mỗi mục ghi rõ **cách làm**, **kết quả mong đợi**.
> Ký hiệu: ✅ đã sửa & đã kiểm chứng tự động · 🟡 đã sửa, **cần bạn nghiệm thu tay**
>
> **Nguyên tắc**: mỗi mục có **kết quả mong đợi** rõ ràng. Khi một mục KHÔNG đạt, ghi vào bảng cuối
> tài liệu kèm ảnh chụp màn hình và Console (F12). **Không sửa dữ liệu thật** để "làm cho nó chạy".

---

## 0. TRƯỚC KHI TEST — BẮT BUỘC ĐỌC

### 0.1 🔴 PHẢI MỞ ĐÚNG CỔNG

| Cổng | Có dữ liệu? | Ghi chú |
|---|---|---|
| **http://127.0.0.1:9000** | ✅ **CÓ** | **MỞ CỔNG NÀY** — proxy → API sang Java → **MySQL** |
| http://127.0.0.1:8787 | ❌ KHÔNG | Node UI trực tiếp → API sang **SQLite rỗng** ⇒ giao diện trắng |

**Đây chính là nguyên nhân "DB có dữ liệu nhưng frontend không hiển thị gì".** Không phải bug backend.

**Tài khoản**: `admin` / `Admin123456@`

### 0.2 Xem dữ liệu trong DB cho ĐÚNG tiếng Việt

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u vntech -pvntech --default-character-set=utf8mb4 vntech_erp -e "SELECT username, full_name FROM users;"
```
⚠️ **Thiếu `--default-character-set=utf8mb4` sẽ thấy `D? �n m?u`** — đó là lỗi HIỂN THỊ của công cụ, **không phải** dữ liệu hỏng.

### 0.3 Khởi động lại toàn bộ hệ thống

> 🔴 **BẮT BUỘC** sau mỗi lần khởi động lại máy/DSH: Java API, Node UI và Proxy đều là
> tiến trình con nên **sẽ chết hết**; chỉ MySQL sống sót (Windows service).

**Cách 1 — bấm đúp `tools/MO_VNTECH_CUTOVER.bat`** (khuyến nghị).
Script tự tìm JDK, tự kiểm tra MySQL, **bỏ qua dịch vụ đang chạy** (bấm nhiều lần không tạo
tiến trình trùng), chờ dịch vụ sẵn sàng rồi in bảng kiểm tra cuối cùng.

**Cách 2 — chạy tay 3 lệnh:**

```powershell
# LƯU Ý: 'java' KHÔNG có trong PATH của máy — phải dùng đường dẫn đầy đủ.
# Java API (:18081)
Start-Process -FilePath "C:\Users\PC\.jdks\openjdk-26.0.2.1\bin\java.exe" `
  -ArgumentList '-jar','web\target\vntech-erp-web-0.1.0-SNAPSHOT.jar','--server.port=18081' `
  -WorkingDirectory "$PWD\java-backend" -WindowStyle Hidden
# Node UI (:8787) rồi Proxy (:9000)
Start-Process node -ArgumentList 'scripts\local-server.mjs' -WorkingDirectory $PWD -WindowStyle Hidden
Start-Process node -ArgumentList 'tools\cutover-proxy.mjs','--port','9000','--ui-port','8787','--api-port','18081' -WorkingDirectory $PWD -WindowStyle Hidden
```

Kiểm tra đủ **4 cổng**: `3306` MySQL · `18081` Java · `8787` Node UI · `9000` Proxy.

**Nếu Proxy báo `ECONNREFUSED 127.0.0.1:9000`** → proxy chưa chạy (hoặc đã chết), không phải
lỗi backend. Chạy lại Cách 1.

**Nếu giao diện treo ở dòng "Đang kiểm tra dữ liệu và quyền truy cập…"** → thường do Node UI
đang phục vụ HTML trỏ tới bundle JS **không tồn tại** (build lại trong lúc Node UI còn chạy).
Kiểm tra bằng `node tools/probe-page-assets.mjs` (phải in `ALL ASSETS OK`).

### 0.4 Đăng nhập & kiểm tra nền

| # | Việc | Kết quả mong đợi | ✔ |
|---|---|---|---|
| 0.4.1 | Đăng nhập `admin` / `Admin123456@` | Vào được Tổng quan điều hành | ☐ |
| 0.4.2 | Kiểm tra `http://127.0.0.1:9000/api/health` | `{"ok":true,...,"backend":"java-clean-arch"}` | ☐ |
| 0.4.3 | Mở Console (F12) → tab Console | **Không có lỗi đỏ** nào | ☐ |
| 0.4.4 | Nhập sai mật khẩu **10 lần** rồi thử lại đúng | Bị khóa 15 phút (thông báo rõ). Chỉ hết khóa khi khởi động lại Java | ☐ |

---

## 1. ĐỢT P0/P1 — ĐÃ KIỂM CHỨNG TỰ ĐỘNG ✅

| # | Việc | Kết quả | ✔ |
|---|---|---|---|
| 1.1 | F12 → Network → request `api/system` → Response Headers | `Content-Type: application/json;charset=UTF-8` | ☐ |
| 1.2 | `SELECT version,description,success FROM flyway_schema_history;` | Có **V3 · reference seed · 1** | ☐ |
| 1.3 | Tạo 1 user mới **không gán dự án nào** → đăng nhập → xem danh sách dự án | Thấy **0 dự án** (trước đây thấy toàn bộ) | ☐ |
| 1.4 | Quản trị → Nhân sự → **+ Thêm người dùng** | **HTTP 200** (trước đây 400 "Phòng/bộ phận không tồn tại") | ☐ |
| 1.5 | Đếm dữ liệu danh mục nền | `module_catalog` 61 · `menu_group_catalog` 12 · `organization_units` 8 · `material_categories` 6 · `form_field_config` 65 | ☐ |

---

## 2. ĐỢT P2 — MENU 11 NHÓM & TÁCH TAB 🟡

### 2.1 Menu bên trái

| # | Việc | Kết quả mong đợi | ✔ |
|---|---|---|---|
| 2.1.1 | Đếm các mục menu cấp 1 (không tính nút "TỔNG QUAN ĐIỀU HÀNH") | Đúng **11 nhóm**: CÔNG VIỆC CỦA TÔI · QUẢN LÝ DỰ ÁN · MEP · MUA HÀNG & CUNG ỨNG · KHO VẬT TƯ · TỔ ĐỘI · TÀI CHÍNH – KẾ TOÁN · HÀNH CHÍNH – PHÁP CHẾ · BÁO CÁO · DANH MỤC VẬT TƯ GỐC · QUẢN TRỊ HỆ THỐNG | ☐ |
| 2.1.2 | Tìm nhóm tên **"Khác"** | **KHÔNG còn** nhóm tạm nào | ☐ |
| 2.1.3 | Mở từng nhóm, đếm chức năng con | **Không nhóm nào rỗng** (riêng DANH MỤC VẬT TƯ GỐC là liên kết trực tiếp, bấm vào mở luôn màn) | ☐ |
| 2.1.4 | Bấm **MEP** | Có 9 chức năng, gồm "Đấu thầu" | ☐ |
| 2.1.5 | Bấm **TÀI CHÍNH – KẾ TOÁN** | 8 chức năng | ☐ |
| 2.1.6 | Bấm **HÀNH CHÍNH – PHÁP CHẾ** | 6 chức năng | ☐ |

### 2.2 Màn "Phân quyền người dùng" — cấu trúc tab

| # | Việc | Kết quả mong đợi | ✔ |
|---|---|---|---|
| 2.2.1 | Vào **QUẢN TRỊ HỆ THỐNG → Danh mục & phân quyền** | Màn "PHÂN QUYỀN NGƯỜI DÙNG" mở ra | ☐ |
| 2.2.2 | Đếm số tab | Đúng **12 tab**: Nhân sự · Tổ chức · Chức danh / vai trò · Nhóm quyền nghiệp vụ · Phân quyền phòng ban · Phân quyền người dùng · Cấp bậc hệ thống · Phạm vi dự án & kho · Workflow phê duyệt · Ngoại lệ cá nhân · Audit log · Cấu hình hệ thống | ☐ |
| 2.2.3 | Lần lượt bấm **cả 12 tab** | Tab nào cũng mở được, **không tab nào trắng**, Console không lỗi | ☐ |
| 2.2.4 | Tab **2 = Tổ chức** | Thấy mục **"Tổ đội theo dự án"** phía trên "Cơ cấu tổ chức canonical" | ☐ |
| 2.2.5 | Trong tab Tổ chức, mở dropdown **Đơn vị cấp trên** | Chỉ hiện **TÊN** đơn vị, **KHÔNG** có tiền tố mã | ☐ |

---

## 3. ĐỢT P3 — HỒ SƠ NHÂN SỰ CHI TIẾT 🟡

| # | Việc | Kết quả mong đợi | ✔ |
|---|---|---|---|
| 3.1 | Tab **Nhân sự** → bấm vào một dòng người dùng | Mở panel **"Hồ sơ nhân sự chi tiết"** | ☐ |
| 3.2 | Xem phần đầu panel | Có: Mã nhân viên · Chức danh · Phòng ban · Mã đơn vị · Vai trò hệ thống · Tên đăng nhập · Email · Điện thoại | ☐ |
| 3.3 | Xem mục **Thông tin cá nhân** | Có CCCD, ngày sinh, nơi sinh, địa chỉ, trình độ, ngày vào làm (chưa lập hồ sơ thì hiện thông báo) | ☐ |
| 3.4 | Xem mục **Dự án đã và đang tham gia** | Dự án đang hoạt động **xếp trên**; dự án đã kết thúc/rời **xếp dưới, bị làm mờ** và có thanh phân cách "Đã kết thúc / đã rời" | ☐ |
| 3.5 | Xem **chức vụ trong từng dự án** | Hiện tên bước duyệt nếu nhân sự được phân công duyệt | ☐ |
| 3.6 | Mở **HÀNH CHÍNH – PHÁP CHẾ → Hồ sơ nhân sự**, bấm một dòng | Mở cùng panel **và có thêm mục "Đơn từ & giấy tờ liên quan"** | ☐ |
| 3.7 | Kiểm tra chức danh hiển thị | Tiếng Việt **có dấu đầy đủ** ("Chỉ huy trưởng", KHÔNG phải "Ch? huy tr??ng") | ☐ |

---

## 4. ĐỢT P4 — WORKFLOW ĐA LUỒNG 🟡

| # | Việc | Kết quả mong đợi | ✔ |
|---|---|---|---|
| 4.1 | Tab **Workflow phê duyệt** | Thấy quy trình **"Quy trình mua hàng chuẩn"** với 5 bước | ☐ |
| 4.2 | Bấm **Xem bước** | Mỗi bước hiện: số bước · tên · **cách xác nhận** · SLA · **người duyệt đích danh** | ☐ |
| 4.3 | Kiểm tra bước 5 | Cách xác nhận = **"Tất cả"** (chuyển từ `all_roles` cũ) | ☐ |
| 4.4 | Bấm **＋ Thêm quy trình** | Modal mở với: mã, tên, chức năng, dự án, mặc định, và **khối CÁC BƯỚC DUYỆT** | ☐ |
| 4.5 | Đổi dropdown **Cách xác nhận** | Đủ 3 lựa chọn: `Một người duyệt` · `Một trong nhiều người duyệt là qua` · `Tất cả người duyệt phải xác nhận` | ☐ |
| 4.6 | Xem danh sách người duyệt | Mỗi ứng viên có nhãn **"Có quyền duyệt"** hoặc **"Chưa có quyền duyệt"** | ☐ |
| 4.7 | Tạo thử: 2 bước (bước 1 = "Một trong nhiều" + 2 người; bước 2 = "Tất cả" + 2 người) → Lưu | Lưu thành công, quy trình mới xuất hiện trong danh sách | ☐ |
| 4.8 | Thử **"Một người duyệt"** nhưng tick **2 người** → Lưu | **Bị chặn**: "chỉ được chỉ định đúng một người" | ☐ |
| 4.9 | Thử **bỏ trống người duyệt** → Lưu | **Bị chặn**: "chưa chỉ định người duyệt" | ☐ |
| 4.10 | **Xóa** quy trình vừa tạo thử | Xóa được | ☐ |
| 4.11 | Thử xóa **"Quy trình mua hàng chuẩn"** | **Bị chặn**: "quy trình mặc định — chỉ được ngừng áp dụng, không được xóa" | ☐ |
| 4.12 | Mở khối **"Cấu hình bậc duyệt cũ"** (thu gọn cuối tab) | Vẫn xem/sửa được 5 bậc duyệt cũ | ☐ |

---

## 5. ĐỢT P5 — PHÂN QUYỀN PHÒNG BAN · NGƯỜI DÙNG · CẤP BẬC 🟡

### 5.1 Tab "Phân quyền phòng ban"

| # | Việc | Kết quả mong đợi | ✔ |
|---|---|---|---|
| 5.1.1 | Mở dropdown chọn phòng ban | Chỉ hiện **TÊN phòng**, không kèm mã; **không còn phòng trùng tên** | ☐ |
| 5.1.2 | Chọn **Phòng Kế hoạch** | Bảng chức năng với 6 cột: Xem · Thao tác · Tạo · Sửa · Duyệt · Xuất | ☐ |
| 5.1.3 | Tick thử vài ô | Dòng đó đổi nền vàng và hiện nhãn **"Chưa lưu"** | ☐ |
| 5.1.4 | Bấm **Lưu thay đổi** | "Đã lưu N chức năng và đồng bộ lại quyền của nhân sự trong phòng" | ☐ |
| 5.1.5 | Bấm **Cấp nhóm Kế hoạch / Dự án / Tài chính / Hành chính** | Tự tick sẵn bộ quyền của nhóm tương ứng | ☐ |
| 5.1.6 | Bấm **Bỏ chọn tất cả** | Toàn bộ ô bị bỏ tick | ☐ |

### 5.2 Tab "Phân quyền người dùng"

| # | Việc | Kết quả mong đợi | ✔ |
|---|---|---|---|
| 5.2.1 | Xem bảng | Hiện **tất cả tài khoản** với cột: Mã NV · Họ tên · Phòng ban · Chức danh · Cấp bậc · Quyền · **Cảnh báo** | ☐ |
| 5.2.2 | Gõ tên một người vào ô tìm kiếm | Danh sách lọc ngay | ☐ |
| 5.2.3 | Gõ **mã nhân viên** (vd `NV-KH`) | Lọc đúng người đó | ☐ |
| 5.2.4 | Chọn một **phòng ban** ở dropdown | Chỉ còn người thuộc phòng đó | ☐ |
| 5.2.5 | Chọn một **cấp bậc** ở dropdown | Chỉ còn người giữ cấp bậc đó | ☐ |
| 5.2.6 | Bấm **Chi tiết** một người | Hiện các chip quyền kèm nguồn (`ngoại lệ` nếu là quyền thủ công) | ☐ |
| 5.2.7 | Bấm **Sao chép từ phòng ban** | Hỏi xác nhận, ghi đè quyền chức năng bằng quyền phòng. **Phạm vi dự án và kho phải giữ nguyên** | ☐ |
| 5.2.8 | Xem cột **Cảnh báo** | Người có quyền mà phòng ban không có sẽ hiện **"N vượt phòng ban"** và chip đỏ "⚠ phòng ban chưa có" | ☐ |

### 5.3 ⚠️ Kiểm tra QUAN TRỌNG — ràng buộc & KHÔNG mất dữ liệu

| # | Việc | Kết quả mong đợi | ✔ |
|---|---|---|---|
| 5.3.1 | Chọn một người thuộc **Phòng Kế hoạch**, ghi nhớ số quyền + số phạm vi dự án (tab Chi tiết) | Ghi lại con số | ☐ |
| 5.3.2 | Vào **Phạm vi dự án & kho**, gán người đó vào 1 dự án | Lưu thành công | ☐ |
| 5.3.3 | Thử cấp cho người đó một chức năng mà **phòng Kế hoạch chưa có** (vd "Hồ sơ nhân sự") | **Bị CHẶN**: "Phòng ban … chưa được cấp quyền cho chức năng …" | ☐ |
| 5.3.4 | **Ngay sau khi bị chặn**, kiểm tra lại số quyền và số phạm vi dự án | **KHÔNG ĐỔI** — đây là điều quan trọng nhất: yêu cầu bị từ chối **không được** xóa dữ liệu | ☐ |
| 5.3.5 | Vào **Phân quyền phòng ban** cấp "Hồ sơ nhân sự" cho Phòng Kế hoạch, rồi quay lại cấp cho người đó | Lần này **thành công** | ☐ |

### 5.4 Tab "Cấp bậc hệ thống"

| # | Việc | Kết quả mong đợi | ✔ |
|---|---|---|---|
| 5.4.1 | Xem bảng cấp bậc | Đủ **5 cấp**: Nhân viên · Trưởng nhóm/Tổ đội · Trưởng phòng · Giám đốc · **Tổng giám đốc (CEO)** | ☐ |
| 5.4.2 | Cột "Tự động toàn quyền" | Giám đốc = **Có**; Tổng giám đốc = **Có** | ☐ |
| 5.4.3 | Cột "Duyệt vượt cấp" | **Tổng giám đốc = Có**; các cấp khác = Không | ☐ |
| 5.4.4 | Chọn **Tổng giám đốc (CEO)** ở dropdown cấp bậc | Hiện **thông báo**: cấp bậc này TỰ ĐỘNG có toàn quyền **và** được DUYỆT VƯỢT CẤP, không cần thêm tên vào quy trình | ☐ |
| 5.4.5 | Chọn tài khoản + cấp bậc **Nhân viên** → **Xếp cấp bậc** | Lưu thành công, cột Cấp bậc của người đó đổi | ☐ |
| 5.4.6 | Thử **Xóa** cấp bậc đang có người giữ | **Bị chặn**: "Còn N tài khoản đang giữ cấp bậc này…" | ☐ |
| 5.4.7 | **＋ Thêm cấp bậc**, tick "Tự động có toàn quyền" | Khối cảnh báo trong modal nói rõ cấp bậc sẽ tự động được cấp toàn quyền khi lưu | ☐ |

---

## 6. ĐỢT P6 — AUDIT LOG 🟡

| # | Việc | Kết quả mong đợi | ✔ |
|---|---|---|---|
| 6.1 | Tab **Audit log** | Mở được, hiện 4 thẻ: lượt thay đổi · phát sinh hôm nay · người đã thao tác · chức năng bị tác động | ☐ |
| 6.2 | Xem bảng nhật ký | Có cột: Thời gian · Người thực hiện · **Phòng ban** · **Cấp bậc** · Chức năng · **Quyền dùng** · Hành động · Chi tiết | ☐ |
| 6.3 | Thực hiện một thao tác thay đổi (vd sửa chức danh) → quay lại tab, **tải lại trang** | Xuất hiện **bản ghi mới** với tên bạn, phòng ban, quyền đã dùng | ☐ |
| 6.4 | Bấm **Xem** ở một bản ghi | Mở chi tiết: khung "Dữ liệu gửi lên (sau)", thông tin đối tượng, loại, mã bản ghi | ☐ |
| 6.5 | Lọc theo **người dùng** | Bảng chỉ còn bản ghi của người đó | ☐ |
| 6.6 | Lọc theo **chức năng** | Bảng chỉ còn bản ghi của chức năng đó | ☐ |
| 6.7 | Chọn **Từ ngày / Đến ngày** | Bảng lọc theo khoảng ngày | ☐ |
| 6.8 | Gõ từ khóa (vd `save_`) | Bảng lọc theo từ khóa | ☐ |
| 6.9 | Bấm **Xóa lọc** | Về danh sách đầy đủ | ☐ |
| 6.10 | **Đăng xuất rồi đăng nhập lại**, kiểm tra nhật ký | **KHÔNG** có bản ghi nào cho hành động `login` (đúng thiết kế) | ☐ |
| 6.11 | Thử thao tác **thất bại** (vd xóa cấp bậc đang dùng) rồi xem nhật ký | Thao tác thất bại **không** sinh bản ghi | ☐ |

---

## 7. ĐỢT P7 — TEST TỰ ĐỘNG & DỌN DỮ LIỆU ✅

| # | Việc | Kết quả | ✔ |
|---|---|---|---|
| 7.1 | `mvn package` trong `java-backend` | **BUILD SUCCESS** · **69 test / 0 fail** (domain 14 · application 16 · infrastructure 10 · web **29**) | ☐ |
| 7.2 | Test quản trị mới `AdminGovernanceIntegrationTest` | **5/5 xanh**: workflow any_of/all_of + chặn cấu hình sai; ràng buộc phòng ban + KHÔNG mất dữ liệu; cấp bậc auto-grant + chặn xóa; audit ghi đúng + không ghi login | ☐ |
| 7.3 | `SELECT COUNT(*) FROM organization_units;` | **8** (đã gộp từ 13 — không còn đơn vị trùng mã/tên) | ☐ |
| 7.4 | Kiểm tra tham chiếu mồ côi sau khi gộp | 0 người dùng mồ côi · 0 quyền mồ côi | ☐ |

---

## 8. HỒI QUY — CÁC LUỒNG NGHIỆP VỤ CHÍNH

> Mục đích: chắc chắn các thay đổi P2–P7 **không làm hỏng** nghiệp vụ đang chạy.

| # | Việc | Kết quả mong đợi | ✔ |
|---|---|---|---|
| 8.1 | **Tổng quan điều hành** | 2 dự án, tổng giá trị hợp đồng hiển thị đúng, KPI đầy đủ | ☐ |
| 8.2 | Mở **Phiếu đề nghị mua hàng** | Danh sách hiện dữ liệu, không trắng | ☐ |
| 8.3 | Mở **Trung tâm phê duyệt** | Hiện các phiếu đang chờ đúng theo vai trò | ☐ |
| 8.4 | Mở **Kho vật tư → Tồn kho** | Số liệu tồn hiển thị | ☐ |
| 8.5 | Mở **Mua hàng & PO** | Danh sách PO hiển thị | ☐ |
| 8.6 | Mở **Hồ sơ nhân sự** (Hành chính – Pháp chế) | 4 hồ sơ hiển thị | ☐ |
| 8.7 | Đăng nhập bằng một tài khoản **KHÔNG phải admin** (nếu có mật khẩu) | Menu hiển thị theo quyền; **không** bị trắng màn hình | ☐ |
| 8.8 | Thu gọn / mở rộng menu trái | Hoạt động, trạng thái được ghi nhớ sau khi tải lại | ☐ |
| 8.9 | Đổi giao diện Sáng / Tối | Chuyển được, không mất dữ liệu đang xem | ☐ |
| 8.10 | Mở tab **Tổ chức** — xem danh sách đơn vị | **Không còn đơn vị trùng tên** (đã gộp 13 → 8) | ☐ |

---

## 9. NẾU GẶP LỖI KHI TEST

| Hiện tượng | Nguyên nhân thường gặp | Xử lý |
|---|---|---|
| Giao diện trắng / "Internal Server Error" | Mở **`:8787`** thay vì **`:9000`**; hoặc API Java lỗi | Mở lại `http://127.0.0.1:9000`. Kiểm tra `:9000/api/health` |
| **Toàn bộ** giao diện lỗi sau khi thêm bảng mới | Sai **collation** (`utf8mb4_0900_ai_ci` vs `utf8mb4_unicode_ci`) → JOIN lỗi 1267 | Bảng mới phải ghi rõ `COLLATE=utf8mb4_unicode_ci` |
| Trang kẹt ở "Đang kiểm tra dữ liệu và quyền truy cập…" | Bundle cũ: HTML trỏ tới file JS không còn tồn tại (404) | **Dừng Node UI rồi build lại**, sau đó khởi động lại |
| Tiếng Việt hiện `D? �n` khi xem DB | Thiếu `--default-character-set=utf8mb4` | Thêm cờ đó (dữ liệu vẫn đúng) |
| Không đăng nhập được | Sai mật khẩu / khóa 15 phút | `node tools/fix-login.mjs admin "Admin123456@"` rồi **khởi động lại Java** |
| Một chức năng biến mất khỏi menu | `module_catalog.group_key` trỏ tới nhóm không tồn tại | Chạy truy vấn kiểm tra ở §10 (phải rỗng) |
| Nhật ký Audit log trống | Chưa thao tác thay đổi nào, hoặc thao tác bị lỗi (chỉ ghi khi 2xx) | Thực hiện một thao tác lưu thành công rồi tải lại trang |
| Cấp quyền cho người dùng bị chặn | Phòng ban chưa được cấp quyền đó (đúng thiết kế P5.3) | Cấp ở tab "Phân quyền phòng ban" trước |

---

## 10. LỆNH CHẨN ĐOÁN NHANH

```powershell
# 1) Bốn cổng dịch vụ
foreach ($p in 3306,18081,8787,9000) {
  if (netstat -ano | Select-String ":$p\s+.*LISTENING") { "OK $p" } else { "DOWN $p" }
}

# 2) Bootstrap trả gì / có lỗi mã hoá không
$env:U="admin"; $env:P="Admin123456@"
node tools/diag-frontend-data.mjs http://127.0.0.1:9000
node tools/diag-utf8.mjs

# 3) Soi tên trường thật của bootstrap (viết UI đúng field, không đoán)
node tools/inspect-bootstrap.mjs http://127.0.0.1:9000 admin "Admin123456@" "systemLevelCatalog,departmentModulePermissions"

# 3b) Smoke nhanh toàn chuỗi proxy -> Java -> MySQL (phải in ALL PASS)
node tools/probe-live-stack.mjs

# 3c) Giao diện có trỏ tới bundle JS tồn tại không (phải in ALL ASSETS OK)
node tools/probe-page-assets.mjs

# 4) Nghiệm thu tự động từng đợt (đều phải exit 0)
node tools/probe-menu-11.mjs       http://127.0.0.1:9000 admin "Admin123456@"   # P2
node tools/probe-user-profile.mjs  http://127.0.0.1:9000 admin "Admin123456@"   # P3
node tools/probe-workflow.mjs      http://127.0.0.1:9000 admin "Admin123456@"   # P4
node tools/probe-p5.mjs            http://127.0.0.1:9000 admin "Admin123456@"   # P5
node tools/probe-p6.mjs            http://127.0.0.1:9000 admin "Admin123456@"   # P6

# 5) Kiểm tra schema & dữ liệu
$mysql = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
& $mysql --default-character-set=utf8mb4 -uvntech -pvntech vntech_erp -e "SELECT version,description,success FROM flyway_schema_history ORDER BY installed_rank;"
& $mysql --default-character-set=utf8mb4 -uvntech -pvntech vntech_erp -e "SELECT COUNT(*) FROM audit_logs;"
# Chức năng mồ côi (phải rỗng):
& $mysql --default-character-set=utf8mb4 -uvntech -pvntech vntech_erp -e "SELECT m.module_key FROM module_catalog m LEFT JOIN menu_group_catalog g ON g.group_key=m.group_key WHERE m.group_key IS NOT NULL AND g.group_key IS NULL;"
# Đơn vị trùng (phải rỗng):
& $mysql --default-character-set=utf8mb4 -uvntech -pvntech vntech_erp -e "SELECT code FROM organization_units GROUP BY code HAVING COUNT(*)>1;"
```

---

## 11. NHẬT KÝ THAY ĐỔI (P0 → P7)

### 11.1 Migration (Flyway)

| Version | Nội dung |
|---|---|
| V1–V2 | baseline + seed hệ thống |
| **V3** | reference seed: `module_catalog` 61 · `menu_group_catalog` 12 · `organization_units` · `material_categories` · `form_field_config` 65 |
| **V4** | tái cấu trúc menu 7 → 11 nhóm nghiệp vụ |
| **V5** | vá chức năng `dept_project_tender` bị bỏ sót |
| **V6** | sửa mã hoá `role_catalog` (bản đầu, khớp 0 dòng) |
| **V7** | sửa mã hoá `role_catalog` — khớp theo `code` |
| **V8** | workflow đa luồng: `workflow_definitions` · `workflow_steps` · `workflow_step_approvers` + seed quy trình mặc định |
| **V9** | sửa collation 3 bảng workflow (lỗi 1267) |
| **V10** | `department_module_permissions` · `system_level_catalog` · `users.system_level_code` + seed 5 cấp bậc |
| **V11** | đổi `system_level_catalog.rank` → `level_rank` (tránh từ khoá MySQL 8) |
| **V12** | mở rộng `audit_logs` thêm 7 cột ngữ cảnh + index |
| **V13** | gộp đơn vị tổ chức trùng (13 → 8) |

### 11.2 Mã nguồn chính

| # | File | Thay đổi |
|---|---|---|
| 1 | `app/page.tsx` | 12 tab quản trị · `WorkflowManager`/`WorkflowModal` · `DepartmentPermissionManager` · `UserPermissionMatrix` · `SystemLevelManager`/`SystemLevelModal` · `AuditLogManager` · `UserProfilePanel` · menu 11 nhóm |
| 2 | `BootstrapDataAdapter.java` | lọc dự án theo quyền · bù 21+ trường · workflow · quyền phòng ban · cấp bậc · audit đầy đủ |
| 3 | `AuditTrailFilter.java` (**mới**) | ghi nhật ký tự động cho MỌI action POST thành công |
| 4 | `UserManagementUseCase.java` | ràng buộc phòng ban (kiểm tra TRƯỚC khi xoá quyền) · CRUD cấp bậc · quyền phòng ban |
| 5 | `OpsTaskManagementUseCase.java` | `save_workflow` (ghi nguyên tử) · `set_workflow_status` · `delete_workflow` |
| 6 | `RequestManagementUseCase.java` | `any_of`/`all_of` có hiệu lực thật ở runtime |
| 7 | `UserJpaEntity.java` | thêm `system_level_code` (H2 `create-drop` xoá cột ALTER) |
| 8 | `generate-h2-test-schema.mjs` | hiểu `ADD COLUMN` · `CHANGE COLUMN` · bảng thêm sau V1 |
| 9 | `seed-demo.mjs` | thêm `--default-character-set=utf8mb4` (nguyên nhân mất dấu chức danh) |
| 10 | `AdminGovernanceIntegrationTest.java` (**mới**) | 5 test quản trị P4/P5/P6 |
| 11 | `tools/probe-*.mjs` (**mới**) | `probe-menu-11` · `probe-user-profile` · `probe-workflow` · `probe-p5` · `probe-p6` · `probe-live-stack` · `probe-page-assets` |
| 12 | `tools/MO_VNTECH_CUTOVER.bat` | **SỬA LỖI KHỞI ĐỘNG** — xem 11.4 |

### 11.4 Sửa lỗi script khởi động `MO_VNTECH_CUTOVER.bat` (15/09/2026)

Script cũ **không khởi động được Java API** — bấm vào chỉ có giao diện mà không có backend
(mọi lời gọi `/api/*` đều hỏng). Ba lỗi, đều đã kiểm chứng bằng thực nghiệm:

| # | Lỗi | Nguyên nhân | Cách sửa |
|---|---|---|---|
| 1 | Java không chạy | `set JAVA_HOME=…` và `"%JAVA_HOME%\bin\java.exe"` nằm **cùng một dòng lệnh**. `cmd.exe` mở rộng `%JAVA_HOME%` **trước khi** lệnh `set` kịp chạy ⇒ đường dẫn rỗng ⇒ `The system cannot find the path specified` | Dùng biến `JAVA_EXE` đặt ở dòng riêng; có dò JDK dự phòng trong `C:\Users\PC\.jdks\*` và `PATH` |
| 2 | Vòng chờ không chờ | `timeout /t N` báo `ERROR: Input redirection is not supported` khi stdin bị chuyển hướng ⇒ thoát ngay ⇒ script kiểm tra cổng khi Java chưa kịp khởi động | Thay bằng `ping -n N+1 127.0.0.1 >nul` (không phụ thuộc stdin) |
| 3 | Sai mật khẩu | In ra `Vntech@2026` (không còn đúng) | In đúng `Admin123456@` |

Ngoài ra script nay **bỏ qua dịch vụ đang chạy** (bấm nhiều lần không tạo tiến trình trùng),
tự chờ và in bảng kiểm tra 3 cổng ở cuối, và dò JDK thay vì hard-code.

**Đã kiểm chứng:** chạy nguội (cả 3 dịch vụ đều tắt) → cả 3 khởi động, bảng kiểm tra in
`[OK]` cả 3; chạy lại lần 2 → cả 3 in "Da chay - bo qua", không tạo trùng.

### 11.3 Gate đã chạy

| Gate | Kết quả |
|---|---|
| `mvn package` | ✅ BUILD SUCCESS · 69 test / 0 fail |
| `verify-vntech-fingerprint` | ✅ ĐẠT |
| `master-baseline-gate` | ✅ ĐẠT |
| `css-baseline-audit` | ✅ ĐẠT · 2725 dòng · 4950 `!important` |
| `verify-full-release` | ✅ exit 0 · migrations 0000..**0083** |
| `typecheck` · `eslint` | ✅ exit 0 · 0 lỗi |
| regression Jest/Node | ✅ 23/23 |
| `probe-live-stack` (proxy→Java→MySQL) | ✅ ALL PASS · 9/9 số liệu + UTF-8 |
| `probe-page-assets` | ✅ ALL ASSETS OK · 6/6 bundle |
| `probe-menu-11` (12 tab, trình duyệt thật) | ✅ ĐẠT · không lỗi JS |
| Probe tự động P2–P6 | ✅ tất cả exit 0 |

---

## 12. BẢNG GHI LỖI

| # | Mục checklist | Hiện tượng | Ảnh chụp | Mức độ | Ghi chú |
|---|---|---|---|---|---|
| 1 | | | | ☐ Thấp ☐ Vừa ☐ Nặng | |
| 2 | | | | ☐ Thấp ☐ Vừa ☐ Nặng | |
| 3 | | | | ☐ Thấp ☐ Vừa ☐ Nặng | |

---

## 13. PHỤ LỤC — BẢN ĐỒ TÍNH NĂNG ↔ ĐỢT

| Đợt | Tính năng | Tab / màn hình | Probe tự động |
|---|---|---|---|
| P0 | charset UTF-8 · 21 trường bootstrap · lọc dự án theo quyền | Toàn hệ thống | `diag-frontend-data.mjs` |
| P2 | Menu 7 → 11 nhóm · tách tab Nhân sự \| Tổ chức · menu theo quyền | Menu trái · 12 tab | `probe-menu-11.mjs` |
| P3 | Hồ sơ nhân sự chi tiết · dự án đã/đang tham gia · đơn từ | Tab Nhân sự · Hồ sơ nhân sự | `probe-user-profile.mjs` |
| P4 | Workflow đa luồng · `any_of` / `all_of` · người duyệt theo quyền | Tab Workflow phê duyệt | `probe-workflow.mjs` |
| P5 | Quyền phòng ban · ma trận quyền người dùng · cấp bậc hệ thống | 3 tab P5 | `probe-p5.mjs` |
| P6 | Nhật ký kiểm toán mọi thay đổi | Tab Audit log | `probe-p6.mjs` |
| P7 | Test tự động + dọn dữ liệu trùng | — | `AdminGovernanceIntegrationTest` (JUnit) |

---

**Trạng thái tổng**: **P0 ✅ · P1 ✅ · P2 ✅ · P3 ✅ · P4 ✅ · P5 ✅ · P6 ✅ · P7 ✅ — hoàn tất toàn bộ kế hoạch `docs/18`.**
Các mục đánh dấu 🟡 cần bạn nghiệm thu tay trên giao diện.
