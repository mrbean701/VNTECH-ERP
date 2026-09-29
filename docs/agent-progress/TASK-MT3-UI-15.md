# TASK-MT3-UI-15 — Trung tâm thông báo (MT3 §IV.9)

| Mục | Nội dung |
|---|---|
| **Task** | P3-UI-15 |
| **Phase** | **GĐ1 — FRONTEND/UI** |
| **Status** | ✅ **DONE (UI)** · ⛔ «đánh dấu tất cả đã đọc» + backend kiểm quyền gửi thuộc **GĐ2** |
| **Requirement** | MT3 §IV.9: Trung tâm thông báo gồm ① thông báo liên quan trực tiếp tới user (việc được giao · phiếu cần duyệt · bình luận/nhắc tên · thay đổi trạng thái) ② thông báo hệ thống (bảo trì · sự cố · cảnh báo · do quản trị phát hành · sự kiện hệ thống) · phải **phân biệt loại**, **trạng thái đã đọc/chưa đọc** và **đối tượng nhận** |

## ⛔ ĐÍNH CHÍNH SAI SÓT CỦA CHÍNH TÔI (ghi lại để không lặp)
Bản audit trước của tôi **KẾT LUẬN SAI 2 điều**:
1. ❌ «Không có màn/chuông thông báo» → ✅ **SAI**: đã có `notify-button` + huy hiệu + popover `task-notify-popover`.
2. ❌ «`notificationCount` tính mà KHÔNG render» → ✅ **SAI**: nó ĐƯỢC render trong huy hiệu chuông.
**Nguyên nhân**: cả `<header>` là **một dòng rất dài** ⇒ `Select-String` trả về **số dòng của cả dòng khổng lồ**, khiến tôi tưởng biến không được dùng. **Bài học**: với dòng dài phải **đọc trực tiếp bằng `IndexOf`/`Substring`**, ⛔ không kết luận từ grep.

## Khoảng trống THẬT (đo lại sau khi đính chính)
| §IV.9 | Trước | Sau |
|---|---|---|
| Phiếu cần duyệt | ✅ đã có (5 mục) | ✅ + **nhãn nhóm «PHIẾU CẦN DUYỆT (n)»** |
| Việc được giao | ✅ đã có (8 mục, `readAt`) | ✅ + **nhãn nhóm «VIỆC ĐƯỢC GIAO / NHẮC VIỆC (n)»** + **chấm chưa đọc** |
| ⛔ **Thông báo HỆ THỐNG** | ⛔ **THIẾU HOÀN TOÀN** (chỉ hiện ở modal đăng nhập) | ✅ **ĐÃ THÊM nhóm «THÔNG BÁO HỆ THỐNG (n)»** |
| ⛔ Nhãn **phân biệt loại** | ⛔ không có | ✅ **3 nhãn nhóm** + viền trái khác màu cho mục hệ thống |
| Đã đọc/chưa đọc | ⚠️ chỉ công việc | ✅ chấm xanh chưa đọc + `aria-label` |

## Implementation
Trong `app/page.tsx` (popover `task-notify-popover`):
1. Tiêu đề **«Thông báo công việc»** → **«Trung tâm thông báo»**; phụ đề «{n} việc cần xử lý».
2. 3 **nhãn nhóm** (`data-vntech="notify-group-approval|task|system"`), chỉ hiện khi nhóm có dữ liệu.
3. **Nhóm hệ thống**: render `systemNotifications` — ⛔ **DÙNG NGUYÊN BIẾN ĐÃ CÓ** (`(data.systemNotifications||[]).filter(...)`, tức **ĐÃ LỌC Ở BACKEND**: chỉ chưa đọc + không snooze) ⇒ ⛔ **KHÔNG lọc lại ở UI** để tránh lệch quy tắc.
4. **Click mục hệ thống** → gọi **`mark_notification_read` với `configId`** (đúng hợp đồng `NotificationCenterTest.java:119`).
5. **Chấm chưa đọc** `.notify-unread-dot` cho mục công việc chưa đọc.
6. **Trạng thái rỗng** chỉ hiện khi **cả** `notificationCount===0` **và** không có thông báo hệ thống.
7. CSS mục **14.15** trong `canonical.css`.

## Files changed
| Tệp | Thay đổi |
|---|---|
| `app/page.tsx` | popover: tiêu đề · 3 nhãn nhóm · nhóm thông báo hệ thống · chấm chưa đọc · trạng thái rỗng |
| `app/styles/canonical.css` | mục **14.15** |
| `tests/mt3-ui-16b-xlsx-utf8.test.mjs` | **mới** — 4 test (thuộc **P3-UI-16b**) |

## Backend / Database / API changes
⛔ **Không có.** Dùng **API sẵn có**: `mark_task_notification_read` (công việc) · `mark_notification_read` (hệ thống, theo `configId`).

## Permission changes
⛔ Không đổi. ⛔ Backend vẫn là tầng quyết định.

## Workflow changes
⛔ Không đổi luồng; chỉ **hiển thị thêm** nhóm thông báo hệ thống.

## Testing (đều chạy thật)
| Cổng | Kết quả |
|---|---|
| `npx tsc --noEmit` | ✅ exit 0 |
| `tests/mt3-ui-16b-xlsx-utf8.test.mjs` | ✅ **4/4 PASS** (file XLSX thật: giải nén + đối chiếu tiếng Việt + số + ngày + phản chứng mất dấu) |
| contract toàn bộ | ✅ **620 tests · 619 pass · 0 fail · 1 skip** |
| `npm run test:regression` | ✅ **69/69** |
| `gd-cycle` | ✅ build ĐẠT · fingerprint `VNTECH-FP-4467598CF53AFAE9` |

## Known issues
1. ⛔ Chưa có nút **«Đánh dấu tất cả đã đọc»** (MT3 §IV.9 nhắc «đã đọc/chưa đọc»; nút gộp cần API gộp — nếu backend chưa có thì ⛔ không tự bịa ⇒ ghi vào GĐ2).
2. ⛔ **«Đối tượng nhận»** chưa hiển thị trong trung tâm (payload trung tâm chưa trả `recipientMode`/`targets`; ⛔ không suy diễn) ⇒ phụ thuộc **P3-BE-09**.
3. ⛔ Bình luận/nhắc tên + thay đổi trạng thái: chưa xác định có nguồn dữ liệu riêng hay không ⇒ ⛔ **không tự sinh loại mới**.
4. ⛔ Xác minh bằng mắt (ảnh chuẩn) — **P3-UI-17**.

## Blockers
⛔ **Không có.**

## Next task
**P3-UI-16b** đã XONG (ở trên). Tiếp: **P3-UI-12c** (gộp mục Nhà cung cấp) · **P3-UI-12d** (thanh 10 tab) · **P3-UI-10d** (dọn đường cũ) · **P3-UI-17** (ảnh chuẩn).
