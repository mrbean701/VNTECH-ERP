# TASK-MT3-BE-06 — Tổng hợp LỊCH SỬ TỔ ĐỘI + phân trang

| Mục | Nội dung |
|---|---|
| **Task** | P3-BE-06 |
| **Phase** | **GĐ2 — BACKEND** |
| **Status** | ✅ **KHẢO SÁT XONG** — ⚠️ **phần CỐT LÕI đã xong ở P3-UI-11** · ⏳ phần **phân trang phía máy chủ** = **API MỚI**, cần user quyết |
| **Requirement** | Tổng hợp lịch sử tổ đội **⛔ không nhân dòng do join** + **phân trang** |

## ✅ 1) PHẦN CỐT LÕI **ĐÃ XONG VÀ CÓ TEST** (ở P3-UI-11)
| Yêu cầu | Trạng thái | Bằng chứng |
|---|---|---|
| **⛔ Không nhân dòng do join** | ✅ **ĐẠT** | `teamHistoryRows(data, team, allocations)` gộp bằng `concat` ⇒ **mỗi chứng từ ĐÚNG 1 dòng**; đã có **test hợp đồng** trong MT3-UI-11 |
| Tổng hợp nhiều nguồn (cấp phát · hoàn trả · nhật ký) | ✅ ĐẠT | khối `TỔNG HỢP CHỨNG TỪ` trong `TeamDirectory.tsx` |
| Tìm · Lọc theo loại · Sắp xếp · mặc định mới nhất | ✅ ĐẠT | 5 tab + khối tổng hợp (MT3-UI-11) |

## ⚠️ 2) PHẦN «PHÂN TRANG»: hiện **KHÔNG có ở cả 2 tầng** — và đây là **API MỚI**
Khảo sát backend: các action nhóm tổ đội **chỉ có ghi** —
`save_team_subcontract` · `save_team_production` · `approve_team_production` · `save_team_payment` · `settle_team_subcontract` · `create_project_team` · `set_project_team_status` · `delete_project_team`.
⇒ ⛔ **KHÔNG có action nào TỔNG HỢP lịch sử tổ đội** ⇒ lịch sử hiện được dựng **ở giao diện** từ dữ liệu bootstrap.
⇒ Muốn «phân trang phía máy chủ» thì phải **THÊM ACTION MỚI** + **2 dòng RBAC** + test ⇒ ⛔ **đây là quyết định kiến trúc**, ⛔ không tự làm.

### Vì sao cần user quyết (⛔ không phải việc hiển nhiên)
| Phương án | Ưu | Nhược |
|---|---|---|
| **(A) Giữ nguyên** (dựng ở giao diện như hiện tại) | ⛔ **0 rủi ro**, ⛔ không thêm API, đã có test | ⛔ không scale khi dữ liệu rất lớn |
| **(B) Thêm action tổng hợp + phân trang ở máy chủ** | scale tốt, đúng chữ «phân trang» | **thêm API mới** (phình bề mặt) · phải chốt **kích thước trang** · phải chốt **khoá sắp xếp** (⛔ nếu tự chọn sẽ lệch với giao diện) |

⚠️ **Bằng chứng định lượng cần cho quyết định**: chưa đo được **số dòng lịch sử thật** của tổ đội lớn nhất ⇒ ⛔ **không đủ dữ liệu để tự kết luận (A) hay (B)**. Đo được thì mới biết có cần (B) không.

## 3) Điều ⛔ KHÔNG được làm dù chọn (B)
- ⛔ **KHÔNG tự chọn khoá sắp xếp** — nếu lệch với `newest` mặc định của giao diện sẽ **mâu thuẫn** giữa 2 tầng.
- ⛔ **KHÔNG tự chọn kích thước trang**.
- ⛔ **KHÔNG đổi lược đồ CSDL** để phục vụ phân trang (chỉ ĐỌC).

## Testing hiện tại (nền vẫn sạch)
| Cổng | Kết quả |
|---|---|
| `mvn -f java-backend/pom.xml test` | ✅ **66/66 ĐẠT** · `BUILD SUCCESS` |
| `tools/verify-java-compile.ps1` | ✅ 115 tệp · 0 lỗi |
| `tsc` · contract (gồm test MT3-UI-11) · regression · `verify:css-baseline` · `verify:master-baseline` | ✅ đều ĐẠT |

## Blockers
⛔ **Cần user quyết (A) hay (B)** + nếu (B) thì **khoá sắp xếp** và **kích thước trang**.
📌 Gộp vào **nhóm câu hỏi đang chờ** (nay **6 việc**) để user trả lời **một lần**.

## Next action
Chuyển sang **P3-BE-04** (phạm vi tab **Phòng ban**: `department` + `level` — **đọc mã là rõ**, ⛔ không cần user quyết) hoặc **P3-BE-03**/**P3-BE-09** tuỳ mức độ phụ thuộc câu hỏi.
📌 **Ghi chú quan trọng về tiến độ**: 4/5 task GĐ2 gần nhất (BE-02 · BE-05 · BE-07 · BE-08) khi đọc mã đều cho thấy **phần lớn yêu cầu ĐÃ ĐƯỢC ĐÁP ỨNG SẴN** ⇒ GĐ2 nhỏ hơn so với bản phân rã ban đầu của tôi. Cần **đo lại toàn bộ GĐ2** thay vì giả định từng task đều có việc lớn.