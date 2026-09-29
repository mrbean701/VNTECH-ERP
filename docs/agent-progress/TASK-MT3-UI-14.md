# TASK-MT3-UI-14 — Quản trị hệ thống: bỏ nhãn trên tab + modal thông báo có tìm/đã chọn (MT3 §I)

| Mục | Nội dung |
|---|---|
| **Task** | P3-UI-14 |
| **Phase** | **GĐ1 — FRONTEND/UI** |
| **Status** | ✅ **DONE (UI)** · ⛔ phần backend kiểm quyền gửi theo phạm vi thuộc **GĐ2 (P3-BE-09)** |
| **Requirement** | MT3 §I: ⛔ **Xoá label/khối «Phân quyền người dùng» nằm phía trên các tab** (chức năng đã chia thành tab) · ⛔ **Không xoá tab hoặc thay đổi quyền hiện có ngoài yêu cầu** · Modal **«Tạo thông báo»**: đối tượng nhận **Toàn bộ · Phòng ban · Dự án · Tùy chọn**; khi chọn **Tùy chọn**: hiện danh sách user · **checkbox** · chọn nhiều · **tìm kiếm/lọc** · nút **Lưu** · khi lưu **hiển thị danh sách user đã chọn trong modal chính** · **bỏ được** user đã chọn · **không mất lựa chọn** khi mở lại |

## Khoảng cách đo được (trước khi sửa)
| Mục | Đo được |
|---|---|
| Nhãn/khối trên tab | `page.tsx:2554` `title="PHÂN QUYỀN NGƯỜI DÙNG"` + `note=` liệt kê 11 bước ⇒ ⛔ **phải bỏ** |
| Modal thông báo | ✅ **ĐÃ CÓ** (`NotificationConfigModal`, MT2-P12-02): `recipientMode ∈ {all,user,users,department,project}` · `targetIds` + `toggleTarget` · validate «Chọn ít nhất 1 đối tượng nhận» · `targets:[{targetType,targetId}]` |
| ⛔ **Tìm/lọc** trong danh sách nhận | ⛔ **CHƯA CÓ** |
| ⛔ **Danh sách đã chọn** + bỏ nhanh | ⛔ **CHƯA CÓ** (chỉ hiện số lượng) |

## Implementation
1. **Bỏ** `title="PHÂN QUYỀN NGƯỜI DÙNG"` + `note=` liệt kê bước ở thanh công cụ **phía trên các tab**; giữ nguyên **13 tab** và mọi quyền.
2. **`targetQuery`** + `filteredTargetOptions`: ô **Tìm trong danh sách** (tên/mã/tài khoản) + trạng thái rỗng khi không khớp.
3. **Khối `data-vntech="notification-target-chosen"`**: hiện **chip** từng mục đã chọn, mỗi chip có nút **✕ bỏ** (kèm `aria-label`).
4. **Đổi loại đối tượng** ⇒ xoá cả `targetIds` **và** `targetQuery` (vì danh sách đổi nguồn).
5. CSS mục **14.14**: chip · khối đã chọn · **danh sách cuộn** `max-height: min(38vh,320px)` (⛔ không px cứng) + `@media 650px`.

## Files changed
| Tệp | Thay đổi |
|---|---|
| `app/page.tsx` | bỏ nhãn trên tab · `targetQuery` + `filteredTargetOptions` · khối đã chọn + chip bỏ · reset khi đổi loại |
| `app/styles/canonical.css` | mục **14.14** |
| `tests/mt3-ui-14-admin-notification.test.mjs` | **mới** — 8 test |

## Frontend changes
Có (2 tệp sản phẩm).

## Backend changes / Database changes / API changes
⛔ **Không có.** Dùng action sẵn có `save_notification_config`.
⛔ **CÒN NỢ (GĐ2 — P3-BE-09)**: MT3 §I yêu cầu «**Backend phải kiểm tra người tạo thông báo có quyền gửi tới phạm vi đã chọn**» + «Thông báo được tạo phải **xuất hiện trong Trung tâm thông báo theo đúng đối tượng**» ⇒ phải kiểm bằng **user thường**.

## Permission changes
⛔ **Không đổi quyền nào.** Chỉ bỏ phần **nhãn hiển thị** thừa; 13 tab và RBAC giữ nguyên (đã khoá bằng test).

## Workflow changes
⛔ **Không đổi.**

## Testing (đều chạy thật)
| Cổng | Kết quả |
|---|---|
| `tests/mt3-ui-14-admin-notification.test.mjs` | ✅ **8/8 PASS** — bỏ nhãn trên tab · **vẫn đủ 13 tab** (gồm «Thông báo») · đủ 5 `recipientMode` · có tìm/lọc + trạng thái rỗng · có khối đã chọn + chip bỏ được · ⛔ lọc KHÔNG làm mất lựa chọn · danh sách cuộn theo viewport + responsive · đổi loại thì reset |
| `npx tsc --noEmit` | ✅ exit 0 |
| contract toàn bộ | ✅ **616 tests · 615 pass · 0 fail · 1 skip** |
| `npm run test:regression` | ✅ **69/69** |
| `gd-cycle` | ✅ build ĐẠT · fingerprint `VNTECH-FP-59EC5C681502501B` |

## Known issues
1. ⛔ Backend kiểm quyền gửi theo phạm vi + thông báo hiển thị đúng đối tượng — **P3-BE-09 (GĐ2)**.
2. ⛔ Xác minh bằng mắt (ảnh chuẩn) — **P3-UI-17**.

## Blockers
⛔ **Không có.**

## Next task
**P3-UI-15** — Trung tâm thông báo (§IV.9): phân biệt **thông báo user** (việc được giao · phiếu cần duyệt · bình luận/nhắc tên · thay đổi trạng thái) với **thông báo hệ thống** (bảo trì · sự cố · cảnh báo · do quản trị phát hành) + trạng thái **đã đọc/chưa đọc** + đối tượng nhận.
