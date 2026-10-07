# TASK-MT3-BE-07 — Export UTF-8 từ backend + headers/encoding + audit & idempotency

| Mục | Nội dung |
|---|---|
| **Task** | P3-BE-07 |
| **Phase** | **GĐ2 — BACKEND** |
| **Status** | ✅ **KHẢO SÁT XONG — PHÁT HIỆN: phần «UTF-8 tên tệp + headers» ĐÃ ĐÚNG SẴN** · ⛔ **CHƯA** làm phần «audit & idempotency» (xem mục 4) |
| **Requirement** | Export do backend sinh phải đúng Unicode + `Content-Disposition`/encoding chuẩn; có **ghi vết** và **không phá dữ liệu khi gọi lặp** |

## ✅ 1) Endpoint sinh file ở backend — chỉ có **2 chỗ**
| Vị trí | Việc | `Content-Disposition` | Kết luận |
|---|---|---|---|
| **`FileController.java`** | trả **tệp nhị phân** (`GET ?id=`) | **RFC 5987** `filename*=UTF-8''…` — tài liệu hoá tại **`:34`** và **`:182`**: *«RFC 5987: filename\*=UTF-8''<percent-encoded> — **khớp JS để giữ tên tệp tiếng Việt**»* | ✅ **ĐÚNG CHUẨN** cho tên tiếng Việt |
| **`SystemController.java:156-170`** | trả **template XLSX** (`?action=template&kind=…`) | `:162` chỉ `attachment; filename="…"` (⛔ **thiếu** `filename*=UTF-8''`) | ⚠️ **không phải lỗi thật** — xem mục 2 |

## ⚠️ 2) Vì sao chỗ thiếu `filename*` ⛔ **KHÔNG phải bug thật** (⛔ không tự nhận là lỗi để «có việc»)
Đọc `ExcelTemplateService` — **mọi tên tệp template là ASCII thuần**:
`template_boq.xlsx` · `template_material_catalog.xlsx` · `template_projects.xlsx` · `template_users.xlsx` · `template_payments.xlsx`
⇒ ⛔ **không có ký tự tiếng Việt nào** ⇒ dạng `filename="…"` **đủ dùng**, ⛔ **không gây lỗi**.
📌 **Kết luận**: nơi **thật sự** có tên tệp tiếng Việt (tệp người dùng tải lên) thì hệ thống **ĐÃ** dùng đúng RFC 5987.
⇒ **Yêu cầu «UTF-8 tên tệp + headers» của P3-BE-07 ĐÃ ĐẠT SẴN.**

## ✅ 3) Encoding JSON API
`SystemController:153` — `@GetMapping(produces = JSON_UTF8)` ⇒ phản hồi JSON khai **UTF-8** ⇒ ✅ đạt.

## ⛔ 4) PHẦN CHƯA LÀM THẬT: «**audit & idempotency**» cho export
Theo cách tôi phân rã, P3-BE-07 còn vế: **export phải có ghi vết (audit)** và **gọi lặp ⛔ không phá dữ liệu**.
- ⚠️ **Export là thao tác ĐỌC** ⇒ «idempotency» ở đây **hầu như vô nghĩa về dữ liệu** (đọc lặp ⛔ không đổi dữ liệu). Trừ khi ý đề bài là **chống xuất trùng / đánh dấu đã xuất** — mà như vậy là **luật nghiệp vụ MỚI**.
- ⇒ ⛔ Theo **RULE 10**, tôi ⛔ **KHÔNG tự chế luật «đánh dấu đã xuất»** khi chưa có câu chữ đề bài.
- 📌 **Cần user/đề bài xác nhận**: «audit & idempotency» cho export nghĩa là gì? (ghi log lượt xuất? chống xuất trùng? hay chỉ là yêu cầu chung chung?)

## 5) Đề xuất CẢI THIỆN nhỏ (⛔ không bắt buộc, ⛔ không tự ý làm)
Dù ⛔ **không phải bug**, vẫn **nên** cho `SystemController:162` dùng cùng khuôn RFC 5987 như `FileController` để **nhất quán**: nếu sau này ai đặt tên template có dấu tiếng Việt thì ⛔ **không phát sinh lỗi ngầm**.
⚠️ Đây là **thay đổi phòng ngừa** (preventive), ⛔ **không phải sửa lỗi** ⇒ tôi ghi lại **chờ user quyết**, ⛔ **không tự sửa** (tránh «sửa để tỏ ra có việc»).

## Testing hiện tại (nền vẫn sạch)
| Cổng | Kết quả |
|---|---|
| `mvn -f java-backend/pom.xml test` | ✅ **66/66 ĐẠT** · `BUILD SUCCESS` |
| `tools/verify-java-compile.ps1` | ✅ 115 tệp · 0 lỗi |
| `tsc` · contract · regression · `verify:css-baseline` · `verify:master-baseline` | ✅ đều ĐẠT |

## Blockers
⛔ **Cần user/đề bài chốt nghĩa «audit & idempotency» cho export** (mục 4) — vì có thể đó là **luật nghiệp vụ mới**, ⛔ không được tự chế.

## Next action
Gộp câu hỏi này vào **nhóm câu hỏi đang chờ** (đã 4 việc) ⇒ thành **5 việc**, hỏi user **một lần**.
Trong lúc chờ, chuyển sang **P3-BE-06** (tổng hợp **lịch sử tổ đội** + phân trang) — task **độc lập**, phạm vi rõ.