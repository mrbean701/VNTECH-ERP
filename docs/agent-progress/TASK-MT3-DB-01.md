# TASK-MT3-DB-01 — Migration cho lược đồ: **ĐO TRƯỚC → KẾT LUẬN: ⛔ KHÔNG CẦN MIGRATION NÀO**

| Mục | Nội dung |
|---|---|
| **Task** | P3-DB-01 |
| **Phase** | **GĐ3 — DATABASE** |
| **Status** | ✅ **HOÀN TẤT** — kết luận: **⛔ 0 migration cần tạo** (mọi nội dung dự kiến **ĐÃ CÓ SẴN**) |
| **Requirement** | Migration cho: **alias vật tư** · **phạm vi/người nhận thông báo** · **yêu cầu bổ sung** · **trường audit SLA** |

## 🛑 TÔI **KHÔNG TẠO MIGRATION** — và đây là **bằng chứng đo được**, ⛔ không phải bỏ qua
⚠️ **Nguyên tắc đã tuân thủ**: *DATABASE SAFETY* — «inspect schema → relation → dữ liệu hiện có → migration → phụ thuộc → tương thích ngược» **TRƯỚC KHI** thay đổi. Tôi **đo trước**; đo xong thì thấy **⛔ không thiếu gì** ⇒ ⛔ **không tạo migration** (tạo bừa sẽ **phá** một lược đồ đang chạy ổn).

| # | Nội dung GĐ3 dự kiến | **ĐO ĐƯỢC** | Kết luận |
|---|---|---|---|
| 1 | **Bảng tên phụ (alias) riêng** | `CREATE TABLE material_aliases` (xuất hiện ở **nhiều** migration, có cả `IF NOT EXISTS`) — và bảng **đã có cột `normalized_name`** (xem BE-05) | ✅ **ĐÃ CÓ** |
| 2 | **Phạm vi / người nhận thông báo** | **ĐỦ 3 BẢNG**: `notification_configs` · **`notification_config_targets`** · **`notification_user_states`** | ✅ **ĐÃ CÓ** |
| 3 | **Trường cho «yêu cầu bổ sung»** | BE-01 đã chứng minh: dùng lại **`returned_to_requester`** có sẵn + `auditLog` chung ⇒ ⛔ **không cần cột mới** | ✅ **KHÔNG CẦN** |
| 4 | **Trường audit SLA** | `approvals.due_at` · `approval_stage_catalog.sla_hours` · **`approvals_queue_idx`** trên (`status`,`stage`,`due_at`) · `updateApprovalOverdueReason(...)` **đang hoạt động** (dùng thật trong `decideApproval`) | ✅ **ĐÃ CÓ** |

## ⇒ KẾT LUẬN CỐT LÕI
**Lược đồ hiện có ĐÃ ĐỦ** cho cả 4 hạng mục GĐ3 ⇒ **⛔ 0 migration**.
📌 Điều này **nhất quán** với phát hiện ở GĐ2: **5/9 task GĐ2 hoá ra đã đáp ứng sẵn** — vì **nền lược đồ đã được chuẩn bị từ các master task trước (MT2)**. Bản phân rã GĐ3 của tôi đã **giả định thiếu** những thứ thực tế **đã có**.

## Files changed
⛔ **KHÔNG sửa tệp nào** — ⛔ **không tạo migration**, ⛔ không đụng lược đồ. Đây là **task ĐO + KẾT LUẬN**.

## Database changes
⛔ **KHÔNG** — và **đó chính là kết quả đúng** (⛔ không thay đổi vì không cần).

## Testing hiện tại (nền vẫn sạch — chứng minh lược đồ hiện tại đủ dùng)
| Cổng | Kết quả |
|---|---|
| `mvn -f java-backend/pom.xml test` | ✅ **67/67 ĐẠT** · `BUILD SUCCESS` — gồm các test **chạy trên H2 với lược đồ hiện tại**: `NotificationCenterTest` · `NotificationScopeRbacTest` (mới) · `ConstructionRbacEnforcementTest` (mới) · `RequestSupplementIntegrationTest` (mới) · `RequestApprovalIntegrationTest` · … |
| `tools/verify-java-compile.ps1` | ✅ 115 tệp · 0 lỗi |
| `tsc` · contract · regression · `verify:css-baseline` · `verify:master-baseline` | ✅ đều ĐẠT |

⚠️ **Bằng chứng mạnh**: các test **MỚI** của tôi (bổ sung · phạm vi thông báo · quyền Thi công) **chạy XANH trên lược đồ HIỆN CÓ** ⇒ chứng minh **không cần đổi lược đồ**.

## Blockers
⛔ **Không có.** ⚠️ Ghi chú: nếu sau này user chốt **luật mới** (ví dụ cần lưu **lý do bổ sung riêng** hoặc **đánh dấu đã xuất**) thì **mới** phát sinh nhu cầu lược đồ — khi đó làm **đúng quy trình DATABASE SAFETY**. ⛔ Hiện **chưa có** nhu cầu đó.

## Next action
**P3-DB-02** — audit cuối §52 + báo cáo §53 + **chốt 16 tiêu chí §VIII**.