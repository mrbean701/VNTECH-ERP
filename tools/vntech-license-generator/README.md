# VNTECH License Generator Foundation

Đây là nền móng công cụ phát hành license tách khỏi runtime ERP. Công cụ chỉ nhận private key qua đường dẫn ngoài cây source khi được người có thẩm quyền vận hành; private key không được ghi vào source, database, Docker image, installer hoặc release ZIP.

W2 chưa bật License Enforcement. Quy trình Production sau này phải dùng HSM/KMS hoặc kho khóa ngoại vi, dual-control, audit và cơ chế revoke/transfer được phê duyệt.

Ví dụ vận hành sau khi được phê duyệt:

`node tools/vntech-license-generator/generate-license.mjs --payload /secure/request.json --private-key /secure/vntech-root-private.pem --output /secure/license.json`

Script từ chối private key nằm bên trong thư mục source.
