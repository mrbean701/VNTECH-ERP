Công việc: 
- Khi click vào công việc thì hiển thị luôn dashboard và đưa dashboard lên đầu menu của công việc hoặc bỏ việc hiển thị menuitem đi vì trong menu công việc đã có các tab đầy đủ thông tin rồi.
- Trong phần giao việc & kiểm soát hoàn thành đang hiển thị theo phòng ban và dự án cái này cần thiết nhưng vẫn chưa đủ phạm vi. Đối với user có chức vụ trưởng phòng trở lên thì có thể xem được công việc của nhân viên trong phòng ban của mình. Đối với user có chức vụ là phó giám đốc trở lên thì có thể xem được công việc của toàn bộ phòng ban và nhân viên trong công ty. Logic giao việc cũng hoạt động tương tự như vậy.

Trung tâm phê duyệt:
- Không được hiển thị card dashboard các phiếu đang chờ duyệt cho user không có quyền quản trị hệ thống hoặc không có chức vụ tương đương hoặc lớn hơn trưởng phòng. Vẫn thiếu card chờ giám đốc duyệt.
- Danh sách phiếu chờ duyệt: khi click vào thì nó hiển thị luôn chi tiết phiếu trong khi ngay cột bên cạnh có bảng thông tin phiếu đang xử lý. Tôi muốn khi click vào 1 phiếu trong danh sách phiếu chờ duyệt thì nó sẽ hiển thị sang phiếu đang xử lý chứ không hiển thị chi tiết ngay, mà trong bảng phiếu đang xử lý sẽ có nút hiển thị chi tiết khi click vào sẽ hiển thị ra modal chi tiết phiếu.
- Phiếu đang xử lý: quy trình phê duyệt đang hiển thị theo dạng cột từ trên xuống không đúng như yêu cầu của tôi về cách thức hiển thị hãy sửa lại theo ý tưởng ví dụ: bước 1 o----o bước 2 o----o bước 3 o----o ....
dứoi mỗi bước sẽ hiển thị ai đã duyệt (tên người duyệt, phòng ban, thời gian duyệt), bước duyệt tiếp theo sẽ không hiển thị thông tin người duyệt và phòng ban mà chỉ hiển thị đang chờ (hoặc pending). Cho hiển thị nút duyệt kể cả khi SLA quá hạn, nhưng bắt buộc phải điền vào lý do (lý do để đơn hàng quá hạn) và có cơ chế tính số lượng đơn hàng quá hạn để xây dựng logic xử lý đơn hàng quá hạn trong tương lai.
- Hồ sơ chi tiết, phần tài liệu đính kèm : chữ và ô chọn tệp tải lên đang bị lỗi font chữ chồng chéo lên nhau.

Quản lý dự án:
- quản lý dự án: danh sách dự án phần hiển thị các nút chức năng search sort filter đang hiển thị theo 1 cột dọc lệch sang bên phải trong khi đó phần bên trái chỉ hiển thị label nhìn rất mất cân đối tôi muốn phân bố lại các nút chức năng nằm ngang bên trên là label "DANH SÁCH DỰ ÁN".
- Các tab trong danh sách dự án đang không hoạt động: Tổng quan, Nhân sự, Tổ đội, Kho, Ban chỉ huy. Tôi muốn khi click vào các tab này thì phải hiển thị được đầy đủ thông tin dạng danh sách và khi click vào chi tiết 1 trong các thông tin hiển thị trong danh sách thì sẽ hiển thị ra modal thông tin chi tiết tương ứng ví dụ: tab nhân sự tôi click vào chi tiết user A thì phải hiển thị ra modal chi tiết về user đó.
- Tiến độ dự án thêm các nút tạo công việc/ nhiệm vụ hoặc cho phép tải lên bản excel tiến độ dự án. Tự tạo ra excel mẫu để user tải về và điền vào excel đó. logic hoạt động và đánh giá tiến độ sẽ do chỉ huy trưởng của dự án đó và trưởng phòng dự án quyết (chưa có mô tả nghiệp vụ), nên hiện tại tôi chỉ cần phần hiển thị.
- Phần thi công, sản lượng, thu hồi vốn chưa có mô tả nghiệp vụ cho phép bỏ qua.

MEP : chưa có mô tả nghiệp vụ -> tạm thời bỏ qua.

Mua hàng & cung ứng:
- Nhà cung cấp: hiển thị xuống dưới cùng của menuitem. Trong phần danh mục nhà cung cấp: hiện đang hiển thị "Danh mục nhà cung cấp dùng cho PO" -> đổi này "Danh mục nhà cung cấp.". Thêm các nút chức năng cho danh mục nhà cung cấp CRUD search sort filter. Tách phần tạo nhà cung cấp thành 1 modal riêng, khi click vào nút tạo nhà cung cấp hoặc thêm nhà cung cấp thì sẽ hiển thị ra modal tạo với các thông tin cơ bản như mã ncc, tên, mã số thuế, người liên hệ, điện thoại, email, ghi chú, trạng thái nhà cung cấp.
- Khi click vào chi tiết nhà cung cấp sẽ hiển thị modal chi tiết, trong modal đó sẽ có thêm 2 tab là PO và danh sách vật tư. 2 tab này sẽ là thông tin về các đơn đặt hàng và vật tư của nhà cung cấp này. Tab PO(NCC) sẽ hiển thị ra danh sách các PO liên quan đến NCC này khi click vào hiển thị chi tiết thì sẽ hiển thị ra chi tiết modal chi tiết PO. Danh sách vật tư sẽ được cập nhật dựa vào các PO đã từng đặt của NCC này hoặc cho phép user tạo thêm vật tư cho nhà cung cấp, ví dụ như khi user tạo PO-001 có đặt dây LAN RJ45 CAT6e nhưng NCC đó chưa có vật tư này thì tự động thêm vào danh mục vật tư của nhà cung cấp (có thông báo hỏi user có thêm vật tư cho NCC hay không).

- Đối tác: hiện chưa có mô tả nghiệp vụ cho chức năng này, cho phép tạm thời bỏ qua.

- Phiếu đề nghị mua hàng: Các nút chức năng đang hiển thị 1 hàng dọc lệch phải nhìn rất mất cân đối, hãy sửa lại thành hàng ngang nằm dứoi label "Phiếu đề nghị mua hàng". Trên danh sách phiếu đang hiển 1 dòng "Vật tư đang thiếu tồn trong phạm vi" tôi không hiểu dòng này, hãy tạo ra 1 card hiện thị cảnh bảo vật tư đang thiếu (hiển thị số lượng mã vật tư đang thiếu check số lượng trong tất cả các kho), khi click vào card sẽ hiển thị ra danh sách vật tư đang thiếu tồn với các thông tin : mã vật tư, tên vật tư, số lượng tồn, số lượng tồn tối thiểu, kho (kho đang thiếu tồn mã vật tư đó), kèm theo nút lập phiếu đề nghị(trong modal tạo phiếu này sẽ tự fill thông tin của vật tư đang thiếu tồn đó, kèm theo các thông tin liên quan đến dự án, kho, BOQ, hợp đồng).

- Mua hàng & PO các nút chức năng đang hiển thị theo dạng cột lệch sang bên phải nhìn rất thiếu cân đối, hãy sửa lại thành hàng ngang ngay bên dưới label "DANH SÁCH PHIẾU ĐỀ NGHỊ MUA (PR)". 
- Bảng danh sách PR đang hiển thị lệch thông tin: cột bước duyệt lại đang hiển thị trạng thái (trạng thái lại có cả issued nhưng thế không ổn vì PR chỉ đến trạng thái hoàn thành là hết rồi), cột bước duyệt thì không hiển thị tên cột. mà chỉ hiển thị số bước.
- Tách bảng danh sách PR và PO thành 2 tab riêng, mỗi tab hiển thị bảng danh sách riêng của mình.
- Giao nhận công trường: tạo các modal dành cho các card dashboard như "Lịch giao hàng hôm nay", "Trễ hẹn", "Sắp đến hạn", "Nhà cung cấp đang giao". Nếu như thiếu logic để xử lý hoặc thiếu bảng dữ liệu để truy xuất thì cứ đề xuất thêm. Các nút chức năng CRUD search sort filter đang không hoạt động. Hiển thị "Ghi nhận số lượng giao thực tế" theo dạng modal chứ không phải kiểu sideform như hiện tại. Thêm chức năng tải ảnh giao hàng cho modal Ghi nhận số lượng giao thực tế, cho phép tải nhiều hình ảnh lên.
- Đơn hàng đã giao: Thêm các nút chức năng search sort fillter. Xác nhận giao hàng thực tế đổi thành "Chi tiết đơn giao hàng" -> chuyển thành modal chứ không hiển thị kiểu sideform như hiện tại, các thông tin trong form đang hiển thị chồng chéo lên nhau, không cho thêm ảnh giao hàng và hồ sơ giao hàng sau khi đơn hàng đã hoàn thành (thủ kho đã nhận hàng) hiển thị hình ảnh dưới dạng bảng click vào thì hiển thị hình ảnh đầy đủ, hiển thị thêm lịch sử giao nhận. Xóa các bảng lịch sử giao nhận, chứng chỉ/tài liệu đã tải lên, ảnh giao hàng ở ngoài danh sách đơn hàng đã giao.

Kho vật tư:
 - Kho: hiển thị các kho theo dạng card, khi click vào card thì hiển thị ra các thông tin của kho đó. Dashboard khi chưa click vào card của từng kho thì hiển thị thông tin tổng hợp, khi click vào từng kho thì hiển thị theo thông tin của kho đó. Hiển thị nút xuất - nhập trong Kho luôn, khi click vào thì sẽ hiện thi ra modal tạo phiếu tương ứng.
- Nhập: Các nút chức năng đang hiện theo dạng cột lệch sang bên phải, hãy sửa lại thành dạng hàng ngang nằm ngay dưới label "Nhập kho". Thêm các nút chức năng sort fillter. Xác nhận giao hàng thực tế đổi thành "Chi tiết đơn giao hàng" -> chuyển thành modal chứ không hiển thị kiểu sideform như hiện tại, các thông tin trong form đang hiển thị chồng chéo lên nhau, không cho thêm ảnh giao hàng và hồ sơ giao hàng sau khi đơn hàng đã hoàn thành (thủ kho đã nhận hàng), hiển thị hình ảnh dưới dạng bảng click vào thì hiển thị hình ảnh đầy đủ, hiển thị thêm lịch sử giao nhận. Tạo phiếu nhập, cho phép tạo phiếu từ sto (phiếu xuất kho), các thông tin kho đến kho đi sẽ được tự động fill nếu như phiếu liên quan có các thông tin đó (nếu không có thì cho phép user tự nhập) khi chọn các đơn - phiếu liên quan sẽ hiển thị ra thông tin của các phiếu đó ở bên dưới, cho phép tải hình ảnh giao hàng và chứng chỉ trong bước này luôn.
- Xuất: thêm các nút chức năng CRUD , search , sort ,filter, hiển thị danh sách các phiếu - đơn xuất kho.
- Cấp phát - hoàn trả(menuitem mới): trong menuitem tạo ra 2 tab cấp phát và hoàn trả. Mỗi tab sẽ hiển thị ra danh sách các đơn - phiếu cấp phát/hoàn trả của riêng nó, tại đây sẽ hiển thị thông tin cơ bản của đơn ví dụ như: mã đơn, người tạo, tổ đội hoặc người nhận, dự án, kho xuất, kho nhập (đối với đơn hoàn trả), sẽ tạo ra logic cấp phát hoàn trả sau kèm theo workflow phê duyệt và quyền.

Tổ đội: Chỉ hiển thị ra danh sách tổ đội, fillter theo dự án.

Tài chính - kế toán : chưa chốt nghiệp vụ cho phép bỏ qua.

Hành chính - pháp chế :
 - Hồ sơ nhân sự: không hiển thị filter chọn dự án. Modal "Hồ sơ nhân sự chi tiết" chia thành 3 tab: thông tin user, thông tin cá nhân (tab đầu tiên), dự án đã và đang tham gia.
- Bảo hiểm & chế độ: không hiển thị filter chọn dự án.
- Công văn đến/Đi : thêm nút tạo công văn, có các thông tin số cv/giấy tờ, hướng, loại, ngày, ngày tạo, gửi, nhận, trích yếu, trạng thái, hình ảnh liên quan (cho phép tải nhiều ảnh). Danh sách công văn thêm nút sửa đối với mỗi công văn.
- Văn bản pháp lý: logic và hiển thị dựa theo công văn đến/đi.


Báo cáo:
- Báo cáo & cảnh báo : hiển thị thông tin tổng hợp chứ không chia menuitem theo phòng ban như hiện tại.
- KPI & hiệu suất nhân viên : hiển thị thông tin tổng hợp chứ không chia menuitem theo phòng ban như hiện tại.

Danh mục vật tư gốc: 
- Tab danh sách vật tư: không hiển thi thông tin của danh sách vật tư và mã vật tư gốc, hãy tìm cách fix lỗi. Tạo các tab riêng dành cho danh sách vật tư, Danh mục nhóm con mã vật tư gốc và mã vật tư gốc, trong các tab này sẽ hiển thị dạng danh sách bao gồm các thông tin của từng loại tab đó. So sánh/Đối chiếu BOQ và soát trùng Alias & chất lượng danh mục chưa chốt nghiệp vụ nên tạm thời bỏ qua.

Quản trị hệ thống:
- Thêm tab thông báo: trong tab này sẽ cấu hình thông báo cho tất cả các user thông qua thông email hoặc notification của phần mềm. Trong tab này sẽ hiển thị các thông tin về danh sách thông báo, có các nút chức năng CRUD search sort fillter. Nút tạo thông báo: có thể chọn loại hình thông báo(thông báo web hoặc qua email), tên thông báo, mã thông báo, nội dung thông báo, người nhận thông báo (có thể chọn từng user hoặc nhiều user, thông báo theo phòng ban, dự án hoặc toàn bộ user), thời gian thông báo (hẹn giờ gửi thông báo) , thời gian kết thúc thông báo (đối với web).
- Tài khoản: bỏ trường hạn mức đi, tôi không hiểu trường này để làm gì, audit đăng nhập cuối và ngày tạo đang không hiển thị được, 1 số user không có mã. Nên có thêm thông tin về ID user fit với thông tin hiển thị trong danh sách nhân sự (menu hồ sơ nhân sự). Thêm chức năng thêm chữ ký trong modal chỉnh sửa hoặc thêm user, cho phép tải ảnh lên (chỉ được tải 1 ảnh, xóa ảnh cũ nếu như tải ảnh mới lên).

Notification(web): thiết kế logic thông báo hệ thống, kho user đăng nhập vào phần mềm sẽ hiển thị ra thông báo của hệ thống dạng modal có nút không nhắc lại hôm nay. Modal hiển thị nội dung thông báo, người tạo thông báo, thời gian phát hành thông báo. Check theo userID để hiển thị thông báo sao cho phù hợp. Thêm nút đánh dấu là đã đọc đối với từng thông báo, thêm nút đánh dấu tất cả đã đọc.

Notifaction(email): thông báo các thông tin liên quan đến các đơn - phiếu có liên quan đến user. Nhắc đến bước duyệt của user, nhắc công việc liên quan đến user.... Hãy đề xuất thêm các thông báo từ các chức năng hiện có của hệ thống

Lập các tài liệu liên quan đến master task, gọi todos khi bắt đầu 1 turn/step, báo cáo công việc qua tele mỗi khi bắt đầu và kết thúc 1 turn/step.
