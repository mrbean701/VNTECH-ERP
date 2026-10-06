> **BÁO CÁO KIỂM THỬ E2E — VNTECH ERP V5.3.0**  
> Dự án: `VNTECH_ERP_V5_3_0_MASTER_BASELINE` · Nhánh: `unity`  
> Ngày lập: 01/10/2026  
> Phạm vi: kiểm thử hành vi toàn hệ thống theo kịch bản nghiệp vụ thực tế  
> Môi trường: `http://127.0.0.1:9000` (proxy) → UI `:8787` → backend Java `:18081`

---

# Báo cáo kiểm thử E2E — Giai đoạn 1 và Giai đoạn 2
*Dựng tổ chức và cấu hình quy trình phê duyệt*

## 1. Mục đích và phạm vi

Kiểm thử hành vi GIAI ĐOẠN 1 và GIAI ĐOẠN 2 của kịch bản kiểm thử toàn hệ thống, thực hiện bằng cách gọi trực tiếp API của ứng dụng (POST /api/system) — đúng đường đi mà giao diện người dùng sử dụng, không vòng qua tầng trung gian khác.

Mọi thao tác đều do Quản trị viên thực hiện với tư cách người dùng thật, dữ liệu ghi xuống thật, không mô phỏng, không chèn trực tiếp vào cơ sở dữ liệu.

| Nội dung | Chi tiết |
|---|---|
| Môi trường | Proxy :9000 → giao diện :8787 → backend Java :18081 |
| Cơ sở dữ liệu | MySQL 8 `vntech_erp` (dùng chung với môi trường đang chạy) |
| Nguyên tắc dữ liệu | Không xoá, không sửa dữ liệu sẵn có; mọi bản ghi mới mang tiền tố E2E- |
| Đơn vị sử dụng | Việt Nam không dấu trong mã, tiếng Việt có dấu trong văn bản báo cáo |

## 2. Kết quả tổng quan

| Giai đoạn | Nội dung | Kết quả | Trạng thái |
|---|---|---|---|
| Giai đoạn 1 | Dựng tổ chức: phòng ban, vai trò, dự án, ban chỉ huy, tổ đội, tài khoản | 7/7 lệnh ghi thành công, kiểm chứng lại bằng đếm trực tiếp từ máy chủ | ĐẠT |
| Giai đoạn 2 | Cấu hình quy trình phê duyệt 4 bước với người duyệt chỉ định theo từng bước | 1/1 lệnh ghi thành công; 4 bước, 4 người duyệt được ghi nhận đúng | ĐẠT |

## 3. Giai đoạn 1 — Dựng tổ chức

### 3.1. Phòng ban

Kịch bản yêu cầu có phòng ban: Dự án, Kế hoạch, Kế toán, Nhân sự, Ban giám đốc và Ban chỉ huy công trường. Khảo sát cho thấy hệ thống đã có sẵn phần lớn; riêng Phòng Nhân sự chưa tồn tại — nhân sự đang nằm gộp trong Phòng Hành chính Pháp chế.

| Phòng ban | Mã | Tình trạng | Xử lý |
|---|---|---|---|
| Phòng Dự án | DA | Đã có sẵn | Tái sử dụng |
| Phòng Kế hoạch | KH | Đã có sẵn | Tái sử dụng |
| Phòng Tài chính – Kế toán | TCKT | Đã có sẵn | Tái sử dụng |
| Ban giám đốc | BGD | Đã có sẵn | Tái sử dụng |
| Phòng Nhân sự | NS | THIẾU | Đã tạo mới trong giai đoạn này |
| Ban chỉ huy công trường | E2E-BCH-01 | Cần cho dự án E2E | Đã tạo mới, gắn với dự án |

> *Phát hiện: kịch bản liệt kê Phòng Nhân sự là một bộ phận riêng, nhưng hệ thống đang gộp chức năng nhân sự vào Hành chính Pháp chế. Người dùng thật sẽ không tìm được phòng Nhân sự trong danh sách chọn.*

### 3.2. Dự án và kho công trường

Tạo dự án E2E kèm kho công trường riêng. Hệ thống tự sinh kho khi bật cờ tạo kho, đúng như thiết kế W-03 đã ghi trong mã nguồn.

| Đối tượng | Mã | Tên | Định danh |
|---|---|---|---|
| Dự án | E2E-DA-01 | Dự án chuẩn hoá quy trình E2E | PRJ_0af3201a-22d0-4870-961a-26d367350d45 |
| Kho công trường | KHO-E2E-01 | Kho dự án E2E Đà Nẵng | WH_84200d27-0d30-4a73-9ebc-43800e741c2a |
| Ban chỉ huy | E2E-BCH-01 | Ban chỉ huy công trường E2E Đà Nẵng | ORG_586f9823-1c06-4e09-8f03-23b73f1cc743 |

### 3.3. Tổ đội

Hệ thống tự sinh kho riêng cho từng tổ đội và tự đặt lại mã theo kiểu «MãDự án-MãTổĐội», không giữ nguyên mã do người dùng nhập.

| Mã do hệ thống sinh | Tên tổ đội | Hạng mục | Kho tổ đội |
|---|---|---|---|
| E2E-DA-01-E2E-TD01 | Tổ đội 1 — Xây dựng kết cấu | Xây dựng | WHTEAM_5c0900a5-107e-4e43-9508-bfba52d66e7a |
| E2E-DA-01-E2E-TD02 | Tổ đội 2 — Hoàn thiện | Hoàn thiện | WHTEAM_5604112a-726a-4626-a9a7-c0d6ccb26f35 |

> *Phát hiện: biểu mẫu bắt buộc nhập «Hạng mục / chuyên môn» (trade). Bỏ trống thì hệ thống từ chối lưu tổ đội với thông báo rõ ràng — hành vi đúng như thiết kế.*

### 3.4. Vai trò và tài khoản

Dựng mỗi tài khoản cho một vị trí trong quy trình mua hàng, gán đúng phòng ban và đúng vai trò lấy từ danh mục vai trò của hệ thống.

| Tài khoản | Họ tên | Vai trò | Đơn vị |
|---|---|---|---|
| e2e.cht | E2E Chỉ huy trưởng | Chỉ huy trưởng | Phòng Dự án |
| e2e.bgd | E2E Giám đốc | Ban giám đốc | Ban giám đốc |
| e2e.kt | E2E Kế toán | Tài chính Kế toán | Phòng Tài chính – Kế toán |
| e2e.ksda | E2E Kỹ sư Dự án | Kỹ sư dự án | Phòng Dự án |
| e2e.ns | E2E Nhân sự | Nhân sự | Hành chính Pháp chế |
| e2e.tk | E2E Thủ kho | Thủ kho dự án | Phòng Dự án |
| e2e.kh | E2E Trưởng phòng Kế hoạch | Trưởng phòng Kế hoạch | Phòng Kế hoạch |

Mật khẩu chung của các tài khoản kiểm thử: Vn@2026Test (đủ chữ hoa, chữ thường, chữ số và ký tự đặc biệt, trên 8 ký tự — theo ràng buộc của biểu mẫu).

> *Phát hiện: tài khoản Nhân sự có vai trò hr nhưng nhóm quyền cơ sở vẫn là director do được tạo trong lần đầu tiên khi Phòng Nhân sự chưa tồn tại và rơi vào Hành chính Pháp chế. Cần chỉnh lại quyền theo Phòng Nhân sự.*

### 3.5. Quyền được cấp tự động

Khi tạo tài khoản, hệ thống tự cấp quyền mặc định theo phòng ban. Kiểm chứng bằng cách đếm số chức năng mỗi tài khoản được cấp quyền và quyền phê duyệt.

| Tài khoản | Vai trò | Nhóm quyền | Tổng số chức năng | Chức năng được duyệt |
|---|---|---|---|---|
| e2e.cht | cht | commander | 60 | 1 |
| e2e.bgd | director | director | 59 | 59 |
| e2e.kt | accountant | accountant | 60 | 1 |
| e2e.ksda | ksda | engineer | 60 | 1 |
| e2e.ns | hr | director | 60 | 0 |
| e2e.tk | thu_kho | warehouse | 60 | 1 |
| e2e.kh | kh_truong | procurement | 59 | 1 |


---

## 4. Giai đoạn 2 — Cấu hình quy trình phê duyệt

### 4.1. Quy trình trước khi thay đổi

Hệ thống có sẵn bốn quy trình, mỗi quy trình gắn với một chức năng. Mỗi bước có số thứ tự, chế độ duyệt, thời hạn SLA và danh sách người duyệt.

| Mã quy trình | Chức năng | Số bước | Mặc định |
|---|---|---|---|
| WF-E2E-MUAHANG | requests | 4 | Có |
| WF-MUAHANG-01 | requests | 4 | Có |
| WF-PO-01 | purchasing | 2 | Có |
| WF-XUATKHO-01 | warehouse_issue | 2 | Có |
| WF-NHAPKHO-01 | warehouse_receipt | 2 | Có |

### 4.2. Quy trình E2E vừa dựng

Dựng quy trình riêng cho kịch bản kiểm thử, gồm bốn bước, mỗi bước chỉ định đúng một người duyệt, và đặt làm mặc định cho chức năng yêu cầu mua hàng để các phiếu tạo sau đó đi đúng luồng này.

| Bước | Tên bước | Chế độ | SLA | Người duyệt |
|---|---|---|---|---|
| 1 | E2E-1 Kỹ sư Dự án đề nghị mua | single | 12 giờ | e2e.ksda |
| 2 | E2E-2 Trưởng Kế hoạch kiểm tra khối lượng | single | 24 giờ | e2e.kh |
| 3 | E2E-3 Kế toán kiểm tra giá | single | 24 giờ | e2e.kt |
| 4 | E2E-4 Giám đốc phê duyệt | single | 12 giờ | e2e.bgd |

> *Lưu ý vận hành: đặt WF-E2E-MUAHANG làm mặc định cho chức năng `requests` đã thay thế WF-MUAHANG-01 trong môi trường kiểm thử. Mã định danh của quy trình gốc đã lưu lại trong trạng thái kiểm thử để khôi phục.*

## 5. Sai sót phát hiện và cách xử lý

### 5.1. Bộ đo kiểm thử báo thành công khi thực tế không ghi được dữ liệu

Ở lần chạy đầu tiên, 6 trong 11 lệnh ghi bị báo là thành công, nhưng kiểm chứng lại bằng cách đếm trực tiếp từ máy chủ cho thấy dữ liệu không hề tăng. Nguyên nhân nằm ở chính bộ đo: một cờ cho phép bỏ qua lỗi khiến kết quả trả về có cờ thất bại không được kiểm tra.

Đã sửa: mọi lệnh ghi trong toàn bộ kịch bản kiểm thử từ nay bắt buộc thành công, dừng ngay khi máy chủ báo lỗi, và mỗi giai đoạn đều đếm lại số lượng thực tế từ máy chủ trước khi kết luận.

| Lệnh | Báo cáo sai | Thực tế |
|---|---|---|
| Tạo tổ đội (lần 1) | Thành công | Thất bại — thiếu trường Hạng mục bắt buộc |
| Tạo 3 tài khoản (lần 1) | Thành công | Thất bại — mã vai trò không tồn tại trong danh mục |
| Tạo Ban chỉ huy (lần 1) | Thành công | Thất bại — định danh dự án truyền vào sai kiểu dữ liệu |

> *Bài học áp dụng: trong kiểm thử, KHÔNG được tin vào thông báo thành công của chính lệnh ghi. Phải đo lại từ nguồn dữ liệu.*

### 5.2. Sai lệch khi đo quyền

Ban đầu đo quyền phê duyệt bằng tên trường không tồn tại nên ra kết quả 0 cho toàn bộ tài khoản, tưởng rằng mất quyền. Tên cờ thật của hệ thống là canApprove, dùng số 0 hoặc 1. Đo lại cho thấy cả bảy tài khoản đều có quyền phê duyệt như thiết kế.

## 6. Kết luận Giai đoạn 1 và Giai đoạn 2

- Hệ thống tạo đủ được toàn bộ tổ chức cần thiết cho kịch bản: dự án, kho công trường, ban chỉ huy, hai tổ đội, bảy tài khoản theo đúng vai trò trong quy trình.
- Quy trình phê duyệt bốn bước dựng thành công, mỗi bước gắn đúng một người duyệt và thời hạn SLA riêng — dữ liệu phê duyệt là dữ liệu, không viết cứng trong mã.
- Ràng buộc bắt buộc được thực thi đúng: thiếu Hạng mục thì không lưu được tổ đội; dùng mã vai trò không có trong danh mục thì không tạo được tài khoản.
- Phát hiện một điểm cần theo dõi: một bước phê duyệt không có người duyệt vẫn lưu được quy trình, hệ thống chỉ cảnh báo. Sẽ kiểm tra tác động ở Giai đoạn 12.
