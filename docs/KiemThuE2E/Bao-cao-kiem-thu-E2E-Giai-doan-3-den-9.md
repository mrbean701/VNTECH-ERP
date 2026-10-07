> **BÁO CÁO KIỂM THỬ E2E — VNTECH ERP V5.3.0**  
> Dự án: `VNTECH_ERP_V5_3_0_MASTER_BASELINE` · Nhánh: `unity`  
> Ngày lập: 02/10/2026  
> Phạm vi: kiểm thử hành vi toàn hệ thống theo kịch bản nghiệp vụ thực tế  
> Môi trường: `http://127.0.0.1:9000` (proxy) → UI `:8787` → backend Java `:18081`

---

# Báo cáo kiểm thử E2E — Giai đoạn 3 đến 9
*Kiểm thử hành vi toàn hệ thống VNTECH ERP V5.3.0 theo kịch bản nghiệp vụ thực tế, không dùng dữ liệu giả*

## 1. Tóm tắt điều hành

Báo cáo này ghi lại kết quả kiểm thử hành vi toàn hệ thống VNTECH ERP V5.3.0 theo kịch bản nghiệp vụ thực tế: quản trị thiết lập danh mục và phân quyền, nhân sự lập hồ sơ và hợp đồng, kế toán cấu hình hệ nhóm vật tư và 200 mã vật tư có tên phụ, ban chỉ huy lập phiếu đề nghị mua hàng, chuỗi phê duyệt 5 bước, phát sinh đơn mua hàng, kho nhận và xuất, cuối cùng là kiểm tra xem chuỗi phê duyệt có bị ghi cứng hay không.

Toàn bộ thao tác được thực hiện bằng tài khoản thật, đăng nhập thật qua cổng ứng dụng, không dùng dữ liệu giả và không dùng đường tắt nào của máy chủ. Mọi kết luận trong báo cáo đều được đối chiếu lại bằng cách đọc lại dữ liệu từ máy chủ sau khi ghi.

| Giai đoạn | Nội dung | Kết quả | Trạng thái |
|---|---|---|---|
| 3 | Nhân sự: hồ sơ, hợp đồng lao động, bảo hiểm | 63/63 thao tác | PASS |
| 4 | Kế toán: hệ nhóm vật tư và 200 mã có tên phụ | 200/200 mã | PASS |
| 5 | Dự án, bảng khối lượng, hợp đồng thi công | Hoàn tất | PASS |
| 6 | Phiếu đề nghị mua hàng của ban chỉ huy | 12/12 thao tác | PASS |
| 7 | Phê duyệt 5 bước, tách và đặt đơn mua hàng | 6/6 thao tác | PASS |
| 8.0 | Phân quyền chức năng theo vai trò nghiệp vụ | 29/29 bước, 7/7 cổng | PASS |
| 8A | Kho nhận hàng, tệp đính kèm, xác nhận giao hàng | 6/6 thao tác | PASS |
| 8B | Điều chuyển kho (vận chuyển nội bộ) | Không thể chạy | FAIL |
| 8C | Xuất kho cho tổ đội và tổ đội trả lại vật tư | Hoàn tất | PASS |
| 9 | Kiểm tra chuỗi phê duyệt có bị ghi cứng | 7/7 khẳng định | PASS |

> *Giai đoạn 8B không phải do kịch bản viết sai, mà do một thiếu sót đã được chứng minh: cơ sở dữ liệu dựng bằng Flyway không có kho trung chuyển. Chi tiết ở mục 8B.*


---

## 2. Giai đoạn 3 — Nhân sự

Vai trò thực hiện: e2e.ns (nhân viên Nhân sự), đăng nhập thật. Kết quả 63/63 thao tác thành công, không có thao tác giả.

| Nội dung | Kết quả | Ghi chú |
|---|---|---|
| Hồ sơ nhân sự | Đạt | Tạo, sửa, tra cứu, lọc theo phòng ban và trạng thái |
| Hợp đồng lao động | Đạt | Gắn với hồ sơ nhân sự tương ứng |
| Bảo hiểm xã hội | Đạt | Số bảo hiểm và mức đóng theo hợp đồng |

> *Phát hiện cần lưu ý: tài khoản e2e.ns đang mang mã vai trò director thay vì hr, nên phạm vi nghiệp vụ của nó rộng hơn một nhân viên nhân sự thật. Xem mục lỗi L-14.*

## 3. Giai đoạn 4 — Kế toán: hệ nhóm vật tư và 200 mã vật tư có tên phụ

Vai trò thực hiện: e2e.kt (Kế toán). Dựng 9 hệ nhóm, 33 nhóm con và 200 mã vật tư, mỗi mã đều có tên phụ để công nhân gọi tắt tại công trường. Kết quả 200/200 mã được tạo thành công với đầy đủ tên phụ.

| Hệ nhóm | Số nhóm con | Số mã vật tư | Có tên phụ |
|---|---|---|---|
| KHAC-VLXD | 8 | 32 | 32/32 |
| KHAC-DN | 7 | 28 | 28/28 |
| KHAC-MAY | 6 | 24 | 24/24 |
| KHAC-DIEN | 6 | 24 | 24/24 |
| KHAC-NUOC | 5 | 20 | 20/20 |
| KHAC-HOA | 5 | 20 | 20/20 |
| KHAC-AN | 5 | 20 | 20/20 |
| KHAC-BAO | 4 | 16 | 16/16 |
| KHAC-NHOM | 4 | 16 | 16/16 |

> *LỖI L-07: sau khi tạo đủ 200 mã, cả 200 mã đều bị gán hệ thống là KHAC thay vì thuộc đúng nhóm đã chọn. Nguyên nhân nằm ở hàm kiểm tra thành viên danh sách mã hệ thống: nó so khớp toàn bộ danh sách thay vì kiểm tra danh sách có chứa mã đó hay không.*


---

## 4. Giai đoạn 5 — Dự án, bảng khối lượng và hợp đồng thi công

Tạo dự án E2E-DA-01 cùng kho công trường và hai tổ đội; lập bảng khối lượng V1 gắn với hợp đồng thi công E2E-HĐ-001; đây là nền cho toàn bộ chuỗi mua hàng và cấp phát vật tư ở các giai đoạn sau.

| Đối tượng | Mã | Vai trò |
|---|---|---|
| Dự án | E2E-DA-01 | Nơi tập trung toàn bộ dữ liệu kiểm thử |
| Kho công trường | KHO-E2E-01 | Kho nguồn của chuỗi nhập, xuất và điều chuyển |
| Tổ đội 1 | E2E-DA-01-E2E-TD01 | Đơn vị nhận vật tư rồi trả lại |
| Hợp đồng thi công | E2E-HĐ-001 | Ràng buộc sở hữu vật tư theo hợp đồng |
| Bảng khối lượng | V1 | Nguồn dòng vật tư thực cho phiếu đề nghị |

> *LỖI L-08: mọi dòng bảng khối lượng đều bị ghi thành hai dòng giống hệt nhau. Nguyên nhân đã được truy tới đúng nhánh cập nhật của câu lệnh ghi: nhánh cập nhật không đưa cột liên kết ngược vào danh sách cập nhật nên liên kết không được lưu, dẫn tới tình trạng dòng cũ không liên kết được hợp nhất vào bảng khối lượng. Việc sửa cần biên dịch Java nên chưa thực hiện trong phiên này.*

## 5. Giai đoạn 6 — Phiếu đề nghị mua hàng

Ban chỉ huy lập 3 phiếu đề nghị mua hàng theo ba nhóm nhu cầu: xi măng cho hạng mục móng, vật tư hoàn thiện tầng 1, thiết bị điện tạm cho công trường. Kết quả 12/12 thao tác.

> *LƯU Ý KIỂM THỬ: hàm tạo phiếu không có tính chất lặp an toàn — mỗi lần gọi lại sinh phiếu mới. Ba phiếu cũ phát sinh từ các lượt chạy trước được giữ nguyên làm bằng chứng, không xoá.*

> *LƯU Ý: trường hợp hợp đồng trên từng dòng vật tư trả về rỗng trong dữ liệu đọc lại, nên khi lập phiếu phải truyền lại hợp đồng ở từng dòng; nếu không, máy chủ báo thiếu quyền sở hữu theo hợp đồng.*


---

## 6. Giai đoạn 7 — Phê duyệt 5 bước và đơn mua hàng

Mỗi phiếu được duyệt đủ 5 bước bởi 5 vai trò khác nhau, sau đó chuyển sang bộ phận mua hàng để tách và đặt đơn. Kết quả 6/6 thao tác.

| Bước | Vai trò duyệt | Thời hạn (giờ) | Kết quả |
|---|---|---|---|
| 1 | CHT xác nhận nhu cầu | 12 | Đạt |
| 2 | Thư ký Tổng giám đốc | 12 | Đạt |
| 3 | Phòng Dự án | 24 | Đạt |
| 4 | Phòng Kế hoạch | 24 | Đạt |
| 5 | Giám đốc | 12 | Đạt |

### 6.1. Tách đơn và đặt đơn

Từ mỗi phiếu đã duyệt, bộ phận mua hàng tách thành 2 đơn, mỗi đơn 3 dòng vật tư, và số lượng đặt bằng một nửa số lượng đã duyệt — điều này chứng minh việc tách dòng thực sự hoạt động.

> *GHI NHẬN: không có hàm riêng cho thao tác tách đơn hay đặt đơn. Cả hai việc này được thực hiện chung trong một hàm tạo đơn mua hàng, bằng cách truyền danh sách dòng với mỗi dòng gắn một dòng phiếu và một mức số lượng.*

> *LỖI L-06 (phát hiện khi kiểm tra cổng quyền): hàm lập phiếu xuất kho chỉ chấp nhận vai trò thủ kho, chỉ huy trưởng hoặc quản trị. Nhân viên Dự án dù được cấp quyền tạo tổ đội vẫn không lập được phiếu xuất. Mô hình nghiệp vụ mà người dùng mô tả là kho dự án lập phiếu xuất, nên cần đối chiếu lại đặc tả.*


---

## 7. Giai đoạn 8 — Chuỗi kho

### 7.1. Phân quyền chức năng theo vai trò (29/29)

Mười một tài khoản E2E được cấp quyền chức năng và phạm vi kho theo đúng vai trò nghiệp vụ, không cấp toàn quyền cho bất kỳ ai. Bảy cổng chức năng then chốt đều mở đúng người.

| Cổng chức năng | Tài khoản | Mức quyền | Trạng thái |
|---|---|---|---|
| Nhận hàng | e2e.tk (Thủ kho) | Tạo | Đạt |
| Xác nhận giao hàng | e2e.cht (Chỉ huy trưởng) | Duyệt | Đạt |
| Tạo điều chuyển | e2e.tk (Thủ kho) | Tạo | Đạt |
| Duyệt điều chuyển | e2e.khnv (Kế hoạch) | Duyệt | Đạt |
| Lập phiếu xuất | e2e.project (Dự án) | Tạo | Đạt |
| Duyệt phiếu xuất | e2e.bgd (Giám đốc) | Duyệt | Đạt |
| Trả vật tư | e2e.to (Tổ trưởng) | Tạo | Đạt |

### 7.2. Ba cổng quyền độc lập — bẫy cấu hình

Hệ thống có ba cổng kiểm tra quyền nối tiếp nhau, mỗi cổng một bảng dữ liệu khác nhau. Chỉ mở một cổng là không đủ:

- Cổng vai trò: kiểm mã vai trò của tài khoản có nằm trong danh sách được phép thực hiện hành động hay không.
- Cổng chức năng: kiểm bảng quyền theo chức năng của người dùng cho đúng mức (xem, dùng, tạo, sửa, duyệt, xuất).
- Cổng phòng ban: kiểm phòng ban của người dùng đã được cấp nền xem chức năng đó hay chưa.
> *BẪY CẦN LƯU Ý KHI VẬN HÀNH: một tài khoản có đủ khoá chức năng nhưng mọi cờ bằng không thì mọi cổng đều trả về lỗi 403. Ngược lại, khi cấp quyền một chức năng có thao tác thật thì bắt buộc phải có dòng cấp nền tương ứng ở cấp phòng ban trước; nếu không, thao tác lưu quyền bị từ chối với thông báo không dễ hiểu. Với người dùng thật được cấp quyền qua giao diện, cần quản trị viên tích cả hai tầng.*

> *LỖI L-05: khi tạo tài khoản và gán danh sách dự án, hệ thống cấp phạm vi dự án ở mức chỉ đọc. Tài khoản vừa tạo không lập được phiếu cho dự án đó cho tới khi quản trị viên nâng mức phạm vi lên ghi.*

> *LỖI L-04: danh sách phân công người duyệt bị xoá sạch toàn hệ thống trước khi ghi lại. Nếu chỉ gửi phân công của một dự án thì các dự án khác mất toàn bộ phân công. Giao diện hiện gửi đủ danh sách nên chưa lộ, nhưng đây là cái bẫy lớn khi gọi trực tiếp.*


---

### 7.3. Kho nhận hàng (Giai đoạn 8A)

Ba phiếu mua hàng được kho tiếp nhận thành ba phiếu nhập, mỗi phiếu kèm một ảnh giao hàng tải lên qua cổng tệp, sau đó chỉ huy trưởng xác nhận giao hàng. Kết quả 6/6.

| Phiếu nhập | Số dòng | Xác nhận của BCH | Hạch sổ | Tệp đính kèm |
|---|---|---|---|---|
| GRN-E2E-DA-01-2026-0001 | 17/17 | Đã xác nhận | Đã hạch | 1 |
| GRN-E2E-DA-01-2026-0002 | 22/22 | Đã xác nhận | Đã hạch | 1 |
| GRN-E2E-DA-01-2026-0003 | 26/26 | Đã xác nhận | Đã hạch | 1 |

> *GHI NHẬN: bước xác nhận giao hàng bắt buộc phải có ít nhất một tệp ảnh đính kèm trên phiếu nhập. Đây là ràng buộc nghiệp vụ đúng, nhưng thông báo lỗi không chỉ rõ cần tải ảnh ở đâu.*

> *GHI NHẬN: khi xác nhận giao hàng, hệ thống tự chuyển trạng thái hồ sơ chứng từ và vận đơn sang hoàn tất, không cần thao tác riêng.*

### 7.4. Điều chuyển kho — KHÔNG THỂ CHẠY (Giai đoạn 8B)

Khi thử tạo phiếu điều chuyển giữa kho công trường và kho khác, máy chủ trả về thông báo: Thiếu kho Transit hệ thống.

Đã truy tới tận gốc nguyên nhân và xác nhận đây là thiếu sót thật, không phải lỗi kịch bản kiểm thử:

- Mã máy chủ tìm kho trung chuyển bằng cách truy vấn bảng kho với điều kiện loại là trung chuyển và đang hoạt động.
- Lược đồ dựng bằng cơ chế bay có bản ghi kho trung chuyển với mã TRANSIT, loại trung chuyển.
- Nhưng bộ lược đồ bay mà máy chủ thực sự chạy không có bản ghi nào như vậy, và cũng không có bất kỳ tập lệnh bay nào tạo ra nó.
- Không có hàm nào trong hệ thống tạo mới một kho; kho chỉ được sinh ra từ dự án, từ tổ đội, hoặc từ dữ liệu khởi tạo.
- Kết quả: ba hành động tạo điều chuyển, duyệt hoàn trả kho trung tâm và tiếp nhận hoàn trả kho trung tâm không thể chạy được trên bất kỳ cơ sở dữ liệu nào đã dựng bằng cơ chế bay.
> *CÁCH KHẮC PHỤC ĐỀ XUẤT: thêm một tập lướt bay sao chép đúng dòng kho trung chuyển đã có trong lược đồ cũ, sau đó khởi động lại máy chủ chạy. Việc này cần người dùng chấp thuận vì liên quan tới lược đồ cơ sở dữ liệu thật. Phiên kiểm thử này không tự ý thay đổi.*

> *TRẠNG THÁI: giai đoạn 8B được ghi nhận là không kiểm thử được, không phải là đạt.*


---

### 7.5. Xuất kho và trả lại vật tư (Giai đoạn 8C)

Chuỗi xuất kho gồm 6 bước với sự tham gia của ba vai trò khác nhau, chạy thành công toàn bộ:

| Bước | Thao tác | Vai trò | Kết quả |
|---|---|---|---|
| 1 | Lập phiếu xuất cho tổ đội | Thủ kho | PX-E2E-DA-01-2026-0002, 3 dòng |
| 2 | Duyệt phiếu xuất | Chỉ huy trưởng | Đạt |
| 3 | Tiến hành xuất kho, ghi giảm kho nguồn tăng kho tổ | Thủ kho | Đạt |
| 4 | Xác nhận đã xuất đủ | Thủ kho | Đạt |
| 5 | Lập phiếu nhập từ phiếu xuất | Thủ kho | GRN-PX-2026-0002, 3 dòng |
| 6 | Tổ đội trả lại vật tư dư | Tổ trưởng | RET-E2E-DA-01-2026-0001, 2 dòng |

#### Phát hiện trong chuỗi xuất kho

- LỖI L-03: cột tên người nhận trên phiếu xuất là bắt buộc nhưng không có trong tài liệu đặc tả; thiếu trường này khiến máy chủ trả về lỗi 403 với thông báo chung chung về vi phạm ràng buộc dữ liệu.
- LỖI L-02: số phiếu nhập sinh từ phiếu xuất và số phiếu nhập sinh từ điều chuyển được đếm theo từng dự án, nhưng mã phiếu in ra không kèm mã dự án và là duy nhất toàn hệ thống. Hệ quả: dự án thứ hai trở đi trong cùng năm chắc chắn gặp lỗi trùng số phiếu ở lần gọi đầu tiên. Phiếu trả vật tư đã có cùng lỗi này và đã được sửa bằng cách thêm mã dự án vào mã phiếu; hai trường hợp còn lại chưa sửa.
- LỖI L-01: dữ liệu đọc lại chỉ liệt kê tồn kho của kho công trường, không có kho tổ đội ở bất kỳ danh sách nào. Vì vậy màn hình tồn kho của kho tổ đội luôn hiển thị rỗng, dù kho đó có vật tư thật.
- GHI NHẬN: trường tồn kho trong dữ liệu đọc lại mang tên còn lại, dự phòng và khả dụng — không phải số lượng. Sai tên trường làm cho mọi lần đọc đều ra số không.

---

## 8. Giai đoạn 9 — Chuỗi phê duyệt có bị ghi cứng không

Đây là câu hỏi trực tiếp của người dùng. Kết luận: KHÔNG bị ghi cứng. Cả việc đổi người duyệt ở từng bước lẫn việc đảo thứ tự các phòng ban tham gia đều thực hiện được và có hiệu lực ngay với các phiếu tạo sau đó.

### 8.1. Chuỗi phê duyệt lấy từ đâu

Chuỗi phê duyệt không lấy từ cửa sổ Quy trình phê duyệt. Nó lấy từ bảng danh mục bước phê duyệt: mỗi bước có một số thứ tự cố định, một danh sách vai trò được phép duyệt và một thời hạn xử lý. Người duyệt cụ thể của từng bước lấy từ bảng phân công người duyệt theo cặp dự án và bước.

| Bước | Vai trò được phép | Người duyệt đang gán | Thời hạn (giờ) |
|---|---|---|---|
| 1 | Chỉ huy, CHT | e2e.cht | 12 |
| 2 | Thư ký TGD | e2e.thuky | 12 |
| 3 | Dự án | e2e.project | 24 |
| 4 | Kế hoạch | e2e.khnv | 24 |
| 5 | Giám đốc | e2e.bgd | 12 |

### 8.2. Kết quả đổi người duyệt

- Đổi người duyệt bước 1 và bước 2 sang hai tài khoản dự phòng cùng vai trò: thay đổi được ghi nhận đúng.
- Tạo phiếu mới: bước 1 và bước 2 của phiếu mới trỏ đúng sang hai người mới; ba bước còn lại giữ nguyên.
- Người duyệt cũ thử duyệt bước 1: bị từ chối, đúng như thiết kế.
- Người duyệt mới duyệt bước 1: được chấp nhận và ghi nhận đúng tên người duyệt.
### 8.3. Kết quả đảo thứ tự phòng ban

- Hoán đổi vai trò được phép và tên của bước 3 (Phòng Dự án) với bước 4 (Phòng Kế hoạch): thay đổi được ghi nhận đúng.
- Chuyển kèm người duyệt của hai bước: bắt buộc, vì máy chủ kiểm tra người duyệt phải thuộc vai trò được phép của đúng bước đó.
- Tạo phiếu mới: vị trí thứ 3 trong chuỗi là Phòng Kế hoạch, vị trí thứ 4 là Phòng Dự án. Thứ tự phòng ban đã đảo thật.
- Thử đánh số lại một bước đã có phiếu duyệt: bị từ chối. Đây là bảo vệ đúng thiết kế vì đánh số lại sẽ làm hỏng lịch sử phê duyệt cũ.
- Sau khi kiểm tra, toàn bộ cấu hình được trả về đúng trạng thái ban đầu và đã đối chiếu lại từ máy chủ.
### 8.4. Kết luận và lưu ý còn lại

Kết luận: quy trình phê duyệt không ghi cứng người duyệt và không ghi cứng thứ tự phòng ban. Cả hai đều là dữ liệu cấu hình, đều đổi được qua giao diện và đều có hiệu lực ngay với phiếu mới.

> *LƯU Ý LỚN NHẤT: cửa sổ Quy trình phê duyệt và chuỗi phê duyệt thực sự là hai cơ chế độc lập cùng tồn tại. Chuỗi phê duyệt được dựng từ danh mục bước phê duyệt, nên sửa các bước trong cửa sổ Quy trình phê duyệt sẽ KHÔNG đổi số bước của chuỗi. Tuy nhiên, người được gán trong cửa sổ Quy trình phê duyệt vẫn có thể duyệt vì máy chủ lấy danh sách người duyệt được phép từ cả hai nơi. Đây là điểm cần làm rõ trong đặc tả và trong giao diện.*

> *LƯU Ý: trong cấu hình thông tin hệ thống vẫn còn ba chuỗi tên phòng ban ghi cứng, mô tả ba bước đầu trong năm bước. Cần xoá hoặc cập nhật để tránh hiểu nhầm.*

> *LƯU Ý: khi lập phiếu, nếu người lập giữ vai trò được phép duyệt của bước đầu thì bước đó bị bỏ qua và ghi nhận người lập là người duyệt với lý do giải trình. Cơ chế không cho người lập tự duyệt đơn của mình đã hoạt động đúng như thiết kế.*


---

## 9. Danh mục lỗi và lưu ý phát hiện

| Mã | Mức | Nội dung | Trạng thái |
|---|---|---|---|
| L-01 | Cao | Dữ liệu đọc lại không có tồn kho của kho tổ đội | Chưa sửa |
| L-02 | Cao | Trùng số phiếu nhập sinh từ phiếu xuất và từ điều chuyển khi có nhiều dự án | Chưa sửa |
| L-03 | Trung bình | Thiếu trường tên người nhận bắt buộc trên phiếu xuất, thông báo lỗi gây hiểu nhầm | Chưa sửa |
| L-04 | Cao | Lưu phân công người duyệt xoá sạch toàn hệ thống | Chưa sửa |
| L-05 | Trung bình | Tạo tài khoản chỉ cấp phạm vi dự án ở mức chỉ đọc | Chưa sửa |
| L-06 | Trung bình | Nhân viên Dự án không lập được phiếu xuất dù có quyền tạo | Chưa sửa |
| L-07 | Cao | Toàn bộ vật tư mới bị gán sai hệ thống | Chưa sửa |
| L-08 | Cao | Mọi dòng bảng khối lượng bị nhân đôi | Chưa sửa — cần biên dịch Java |
| L-09 | Cao | Thiếu kho trung chuyển trong lược độ bay, khiến điều chuyển kho không chạy được | Chờ người dùng chấp thuận |
| L-10 | Thấp | Hai tên phòng ban ghi cứng trong cấu hình thông tin hệ thống | Chưa sửa |
| L-11 | Thấp | Tài khoản nhân sự mang mã vai trò giám đốc | Chưa sửa |
| L-12 | Thấp | Cửa sổ Quy trình phê duyệt và danh mục bước phê duyệt là hai cơ chế song song | Cần làm rõ đặc tả |

> *Không lỗi nào trong danh mục này được sửa trong phiên kiểm thử, vì toàn bộ nằm trong mã máy chủ và môi trường này không có công cụ biên dịch Java. Các sửa đổi đều đã được chỉ rõ đúng vị trí mã nguồn và cần người dùng biên dịch, sau đó chạy lại bộ kiểm thử.*

## 10. Kết quả chạy lại toàn bộ cổng kiểm thử

Sau khi dữ liệu kiểm thử được ghi vào cơ sở dữ liệu thật, bảy cổng kiểm thử của kho mã được chạy lại. Việc này phát hiện thêm ba lỗi ở chính bộ công cụ đo và một nhóm lỗi sản phẩm mà cùng một nguyên nhân với lỗi kho trung chuyển.

### 10.1. Bảng kết quả

| Cổng | Kết quả | Giải thích |
|---|---|---|
| Đăng ký action phủ mọi thao tác | Đạt | Mọi action thuộc một trong bốn nhóm hợp lệ. |
| Đối chiếu vai trò giữa hai bản | Đạt | Hai bảng khớp nhau. |
| Đối chiếu phạm vi dự án | Đạt | Mọi thao tác kiểm phạm vi đều được máy chủ kiểm. |
| Đối chiếu hai bản đăng ký | Đạt | Khớp. |
| Thao tác giao diện không hỏng đường máy chủ | Đạt | Không có thao tác nào mà máy chủ trả lỗi 400. |
| Lệch lược đồ | Không kết luận | Ảnh chụp cũ hơn 35 tệp lướt bay — công cụ đã dừng thay vì ra kết luận sai. |
| Đối chiếu mã với lược đồ | Lỗi thật | Ba bảng máy chủ đọc ghi mà bộ lướt bay chưa hề tạo. |
| Phủ quyền của action | Lỗi thật | Sáu thao tác không có lớp cưỡng chế quyền nào. |

### 10.2. Hai lỗi của chính bộ công cụ đo, đã sửa

- Bộ đối chiếu lệch lược đồ đọc một ảnh chụp cơ sở dữ liệu xuất ngày 25/09/2026, trong khi các tệp lướt bay sinh ra sau đó đã thêm cột mới. Công cụ kết luận cơ sở dữ liệu thiếu sáu cột — nhưng đọc lại cơ sở dữ liệu thật thì các cột đó đều có, và mang giá trị thật. Đã thêm chốt chặn: nếu có bất kỳ tệp lướt bay nào mới hơn ảnh chụp thì công cụ dừng với thông báo không kết luận được, kèm đúng lệnh trích xuất lại.
- Bộ đối chiếu mã với lược đồ tách danh sách cột gán bằng dấu phẩy, nên các hàm có dấu phẩy bị cắt vụn và tên từ khoá bị tưởng thành tên cột. Ba cảnh báo sai đã biến mất sau khi thay bằng bộ tách nhận biết độ sâu ngoặc và dấu nháy.
> *Nguyên tắc chung: một phép đo không lấy được thứ nó đo thì phải nói không đo được, không được đoán. Một cổng kiểm thử báo động giá còn tệ hơn không có cổng.*

### 10.3. Lỗi sản phẩm cùng một nguyên nhân với lỗi kho trung chuyển

| Mã lỗi | Vấn đề | Bằng chứng |
|---|---|---|
| L-09 | Không có kho trung chuyển trong lược đồ dựng bằng cơ chế bay | Có trong lược đồ cũ, không có trong bộ lướt bay; không có thao tác tạo kho nào. |
| L-10 | Ba bảng máy chủ đọc ghi nhưng bộ lướt bay chưa hề tạo | Hai bảng review hợp đồng có trong lược đồ cũ nhưng không có trong bộ lướt bay; bảng báo lỗi thì không có ở cả hai. |
| L-11 | Sáu thao tác không có lớp cưỡng chế quyền | Năm thao tác review hợp đồng và một thao tác phạm vi công việc. |

Ba lỗi này cùng một hình dạng: phía máy chủ đã có tính năng, phía lược đồ dựng mới chưa kịp có bảng tương ứng. Hệ quả là một hệ thống cài mới từ bộ lướt bay sẽ không chạy được các tính năng đó. Đề xuất gộp thành một đợt bổ sung lướt bay thay vì vá từng lỗi.

> *Ngoài ra, một tệp kiểm thử về quan hệ dự án và kho chuyển sang đỏ vì chính dữ liệu kiểm thử này làm thay đổi số đo. Đó là hành vi đúng của tệp thử — nó bám theo dữ liệu thật — và đã được xử lý bằng cách cập nhật tệp audit và khẳng định trong tệp thử, không phải bằng cách sửa dữ liệu.*

## 11. Phương pháp và nguyên tắc đã áp dụng

- Không dùng dữ liệu giả: mọi số liệu trong báo cáo là số liệu thật đọc lại từ máy chủ sau khi ghi.
- Mọi tài khoản dùng trong kịch bản đều đăng nhập thật bằng mật khẩu thật, không dùng đường vòng.
- Không xoá dữ liệu có sẵn trong hệ thống; dữ liệu kiểm thử được đặt tên với tiền tố riêng để nhận dạng.
- Mọi kết luận về lỗi đều kèm vị trí mã nguồn và điều kiện tái hiện.
- Báo cáo này được sinh từ một nội dung duy nhất, nên tệp markdown và tệp word luôn giống hệt nhau về nội dung.
