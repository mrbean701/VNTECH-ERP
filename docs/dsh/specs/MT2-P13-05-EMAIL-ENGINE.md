# Doublecheck spec

## Goal
Đưa luồng email thông báo của hệ thống chạy hoàn toàn ở backend Java theo kiến trúc §15.1, với worker SMTP an toàn và các điểm phát sự kiện chỉ dùng nguồn dữ liệu thực đã được kiểm kê.

## Scope
Trong phạm vi: worker Java đọc cấu hình email_settings và hàng đợi email_outbox; gửi báo cáo Approval, Work, Procurement, Project, Warehouse theo các điểm nghiệp vụ có dữ liệu thật; ghi trạng thái gửi/thất bại và retry; tự nối các sự kiện có sẵn vào NotificationManagementUseCase khi phù hợp. Ngoài phạm vi: tạo bảng log mới, tạo sự kiện milestone hoặc ngưỡng SLA chưa được user chốt, sửa luồng nghiệp vụ, giao diện, hoặc dữ liệu mẫu.

## Acceptance criteria
1. Có worker Java được lên lịch, xử lý `email_outbox` theo claim an toàn và giới hạn số lần thử; không gửi SMTP trực tiếp từ use-case. 2. Thành công ghi sent/sent_at; lỗi ghi failed/attempt_count/next_attempt_at/last_error, không làm mất thư. 3. Các sự kiện Approval/Work/Procurement/Project/Warehouse chỉ được phát tại điểm chuyển trạng thái có bằng chứng nguồn thật. 4. Không thêm sự kiện không có nguồn dữ liệu hoặc luật nghiệp vụ. 5. Kiểm thử đỏ-xanh, test hồi quy và build đều đạt; có ghi nhật ký audit thay đổi và hồ sơ MT2-P13-05.

## Failure modes
SMTP bị từ chối/không phản hồi: giữ thư ở failed, ghi lỗi và lên lịch retry; không báo sent giả. Worker chạy đồng thời: dùng claim có điều kiện để không gửi trùng. Cấu hình thiếu/khóa: bỏ qua lượt gửi, log cảnh báo; không tạo địa chỉ giả. Người nhận không có email hoặc không thuộc phạm vi sự kiện: bỏ qua nhánh đó, không suy diễn người nhận. Migration/schema không tương thích: dừng kiểm thử và sửa tương thích, không xóa dữ liệu.

## Priorities
Ưu tiên tính đúng đắn của luật nghiệp vụ, bằng chứng nguồn sự kiện và an toàn hàng đợi; sau đó tới độ phủ các miền. Tính năng có thể tách riêng chỉ khi không làm sai luồng đã xác minh.

## Non-goals
Không phát triển UI email mới; không tạo dữ liệu giả; không thêm SMTP credential mặc định; không gửi email hàng loạt ngoài sự kiện đã kiểm kê; không commit hoặc push.
