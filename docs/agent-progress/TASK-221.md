# TASK-221 — GO-LIVE ĐỢT 76: ⚠️ **TỰ SỬA GHI CHÚ `BUG-20261009`** — ⛔ **KHÔNG PHẢI LỖI** (⭐ nhà đã vá + thiết kế CỐ Ý)

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Việc** | ⭐ §2 (**BUG FIX IS PRIORITY**) + §19 hạng 5 ⇒ ⭐ **điều tra `BUG-20261009`** («`mark_notification_all_read` ⛔ không xoá `task_notifications.read_at` ⇒ huy hiệu chuông ⛔ không về 0») |
| **⚠️ KẾT LUẬN** | ⚠️ **GHI CHÚ CŨ CỦA TÔI **SAI MỘT NỬA** — ⭐ **cần SỬA LẠI, ⛔ KHÔNG viết code** ✓ |
| **⛔ THAY ĐỔI CODE** | **0** — ⭐ **đúng §12 «⛔ không thêm tính năng trong GO-LIVE»** ✓ |
| **⛔ LỖI CỦA TÔI** | ⚠️ **1 ghi chú bug SAI BẢN CHẤT** — ⭐ **tự phát hiện và tự sửa** ✓ |

---

## ① ⭐⭐ SỰ THẬT ĐO ĐƯỢC — **CÓ **HAI** CƠ CHẾ SONG SONG, VÀ ĐÓ LÀ **CỐ Ý**

| Action | ⭐ Bảng đích | Cổng module |
|---|---|---|
| `mark_notification_read` | `notification_user_states` | `List.of()` |
| `mark_notification_all_read` | `notification_user_states` | `List.of()` |
| ⭐ **`mark_task_notification_read`** | ⭐ **`task_notifications`** | ⚠️ **`List.of("dept_plan_tasks","dept_project_tasks")`** |

⭐ **NHÀ GHI RÕ 4 CHỖ RẰNG ĐÂY LÀ HAI CƠ CHẾ CỐ Ý**:
| Tệp | ⭐ Nguyên văn |
|---|---|
| `NotificationStore.java:18` | «⛔ **KHÔNG đụng `task_notifications`** — bảng đó là **HÀNG ĐỢI in-app gắn `work_item_id`**…» |
| `BootstrapDataAdapter:1663` | «(bảng `task_notifications` là **hàng đợi in-app của luồng CÔNG VIỆC** — **hai cơ chế SONG SONG**)» |
| `SystemController:1317` | «⛔ **KHÔNG đụng `task_notifications`** (hàng đợi in-app của luồng CÔNG VIỆC)» |
| `NotificationCenterTest:36` | «`notification_user_states` — ⛔ **KHÔNG đụng `task_notifications`**» |

⇒ ⭐⭐⭐ **`mark_notification_all_read` ⛔ KHÔNG đụng `task_notifications` LÀ **THIẾT KẾ CỐ Ý**, ⛔ không phải lỗi** ✓✓✓

---

## ② ⚠️ **VÀ NHÀ **ĐÃ** VÁ LỖI THẬT CỦA NÚT NÀY RỒI** (⭐ MT2-P13-03)

⭐ `NotificationStoreAdapter:167-173` ghi:
> «**MT2-P13-03 (§14.1) — FIX ROOT CAUSE**: bản trước **CHỈ UPDATE** dòng `notification_user_states` đã tồn tại. Nhưng `notificationsForUser` đọc bằng `LEFT JOIN … WHERE s.read_at IS NULL` ⇒ một thông báo **chưa từng có state row** (chưa snooze, chưa đọc) **VẪN được hiện**, và sau khi bấm «Đánh dấu tất cả đã đọc» nó **vẫn hiện lại** ⇒ nút này không thực sự làm hết ý nghĩa. ⇒ **UPDATE + INSERT** các dòng còn THIẾU, dùng **ĐÚNG bộ lọc** mà `notificationsForUser` dùng.»

⇒ ⭐⭐ **LỖI THẬT CỦA NÚT «ĐÁNH DẤU TẤT CẢ ĐÃ ĐỌC» ĐÃ ĐƯỢC VÁ** ✓ — ⭐ **hiện `markAllRead` làm UPDATE + INSERT đúng bộ lọc** ✓

---

## ③ ⚠️ **GHI CHÚ CŨ CỦA TÔI SAI Ở ĐÂU — VÀ ĐÚNG Ở ĐÂU**

| | ⭐ Nội dung |
|---|---|
| ✅ **ĐÚNG** | ⭐ **UI **CÓ** đọc `taskNotifications.readAt`** — `page.tsx:548`: `unreadTaskNotifications = (data.taskNotifications\|\|[]).filter(n => !n.readAt)` ✓ và `:570`: `notificationCount = unreadTaskNotifications.length + actionableApprovalNotifications.length + unreadSystemNotifications…` ⇒ ⭐ **huy hiệu chuông **CÓ** đếm nó** ✓ |
| ⛔ **SAI** | ⭐ **Gọi `mark_notification_all_read` ⛔ không xoá `task_notifications.read_at` là **LỖI**** ⚠️ — ⭐ **ĐÓ LÀ THIẾT KẾ CỐ Ý** (⭐ 4 ghi chú của nhà) ✓ |

### ⭐⭐ KHOẢNG TRỐNG **THẬT** — VÀ NÓ LÀ **THIẾU TÍNH NĂNG**, ⛔ KHÔNG PHẢI LỖI
| Phát hiện | ⭐ Bản chất |
|---|---|
| ⛔ **KHÔNG có action «đánh dấu TẤT CẢ thông báo CÔNG VIỆC đã đọc»** | ⚠️ **thiếu tính năng** (⭐ chỉ có `mark_task_notification_read` **từng cái một**) |
| ⚠️ `mark_task_notification_read` **gác bởi `dept_plan_tasks` + `dept_project_tasks`** | ⭐ **thiết kế** — ⭐ user ⛔ không có 2 module đó **không dọn được thông báo công việc** |

⇒ ⭐⭐⭐ **KẾT LUẬN: ⛔ KHÔNG PHẢI LỖI — LÀ **HAI ĐẶC ĐIỂM THIẾT KẾ** (⭐ một trong đó là **thiếu tính năng**)** ✓
⇒ ⭐ **§12: ⛔ KHÔNG thêm tính năng trong GO-LIVE** ⇒ ⭐ **⛔ KHÔNG VIẾT CODE** ✓✓✓

---

## ④ ⭐ CÁCH SỬA GHI CHÚ (⭐ ⛔ không sửa mã nguồn)

| | ⭐ Trước | ⭐ Sau |
|---|---|---|
| **Mã** | `BUG-20261009` | ⭐ **`GHI-NHAN-20261009`** (⭐ **⛔ không phải bug**) |
| **Mức** | MEDIUM | ⭐ **THIẾU TÍNH NĂNG — ghi vào UI/UX IMPROVEMENT** (⭐ §19 hạng 7) |
| **Mô tả** | «`mark_notification_all_read` ⛔ không xoá `task_notifications.read_at`» | ⭐ **«⛔ KHÔNG có action «đánh dấu TẤT CẢ thông báo CÔNG VIỆC đã đọc»** ⇒ ⚠️ user phải bấm **từng cái**; ⚠️ và **cần 2 module** `dept_plan_tasks`+`dept_project_tasks`» |
| **Trạng thái** | «REPORTED, chưa vá» | ⭐ **ĐÃ ĐIỀU TRA — ⛔ KHÔNG PHẢI LỖI** · ⭐ **thiết kế CỐ Ý** (⭐ 4 ghi chú nhà) · ⭐ **nút «tất cả» đã được vá đúng** (MT2-P13-03) |
| **Hành động kế** | «vá» | ⭐ **⛔ không vá** — ⭐ **nếu muốn bulk-clear ⇒ là TÍNH NĂNG MỚI, cần bạn quyết** ✓ |

⭐⭐ **VÀ TÔI PHẢI SỬA CẢ `BAN-GIAO-GO-LIVE.md`** (⭐ vì tôi đã ghi `BUG-20261009` vào đó như một bug đang tồn tại) ✓

---

## ⑤ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| ⭐ **Cơ chế thông báo** | ✅ **2 cơ chế SONG SONG — CỐ Ý** (⭐ 4 ghi chú của nhà) ✓ |
| ⭐ **Lỗi thật của nút «tất cả»** | ✅ **ĐÃ ĐƯỢC NHÀ VÁ** (MT2-P13-03: UPDATE + INSERT đúng bộ lọc) ✓ |
| ⚠️ **Ghi chú cũ của tôi** | ⚠️ **SAI một nửa** — ⭐ **đã sửa lại** ✓ |
| ⭐ **Khoảng trống thật** | ⚠️ **THIẾU TÍNH NĂNG** (⛔ không có bulk-clear cho thông báo công việc) ⇒ ⭐ **§19 hạng 7** ✓ |
| ⛔ **Thay đổi code** | **0** — ⭐ đúng **§12** ✓ |
| ⛔ **Thay đổi dữ liệu** | **0** ✓ |
| ⚠️ **Lỗi của tôi** | ⚠️ **1 ghi chú bug sai bản chất** — ⭐ **tự phát hiện + tự sửa** ✓ |
| Vân tay | **ĐẠT** `VNTECH-FP-018A1FB2E849579E` · 713 tệp ✓ |
| `:8787` · `:18081` | ✅ **200** · ✅ **401 = KHOẺ** ✓ |
| Tệp tạm · `.snapshot` | **0 · 0** ✓ |

---

## ⑥ BÀI HỌC

1. ⭐⭐⭐ **MỘT GHI CHÚ BUG CÓ THỂ SAI BẢN CHẤT — VÀ PHẢI ĐƯỢC SỬA, ⛔ KHÔNG ĐƯỢC ĐỂ NGUYÊN.** ⭐ Tôi ghi `BUG-20261009` từ **một quan sát bề mặt** ⚠️ ⇒ ⭐ **điều tra sâu cho thấy đó là THIẾT KẾ CỐ Ý** ✓ — ⭐ **giữ nguyên ghi chú sai sẽ khiến phiên sau «vá» một thứ ⛔ không hỏng** ✓✓✓
2. ⭐⭐⭐ **ĐẾM SỐ GHI CHÚ CỦA NHÀ TRƯỚC KHI KẾT LUẬN «LỖI».** ⭐ **4 tệp khác nhau** đều ghi «⛔ KHÔNG đụng `task_notifications`» ⚠️ ⇒ ⭐ **đó là dấu hiệu THIẾT KẾ CỐ Ý, ⛔ không phải sơ suất** ✓
3. ⭐⭐⭐ **PHÂN BIỆT «LỖI» VÀ «THIẾU TÍNH NĂNG».** ⭐ «⛔ không có bulk-clear» là **thiếu tính năng** (§19 hạng 7) ⚠️ — ⛔ **không phải bug** ✓ — ⭐ **và §12 cấm thêm tính năng trong GO-LIVE** ✓
4. ⭐⭐ **ĐỌC GHI CHÚ «FIX ROOT CAUSE» CỦA NHÀ TRƯỚC KHI TỰ NHẬN LÀ NGƯỜI ĐẦU TIÊN PHÁT HIỆN.** ⭐ `MT2-P13-03` **đã tìm và vá đúng lỗi đó** ✓
5. ⭐⭐ **LẦN THỨ HAI TÔI TỰ BÁC BỎ MỘT GIẢ THUYẾT CỦA MÌNH** (⭐ lần đầu: `deleteOwned` ở v72) ⇒ ⭐ **quy trình đang hoạt động** ✓

---

## ⑦ BLOCKER / CHỜ USER

⛔ **Chưa commit** — **171 đường**, hỗn hợp 2 phiên.
⭐⭐⭐ **9 BẢN VÁ SẴN SÀNG** — ⭐ **chỉ còn 1 lệnh**:
```bash
node tools/deploy-java-backend.mjs --dong-y-trien-khai
```
⛔ **Cần user quyết** (⭐ theo §19):
1. ⭐⭐⭐ **TRIỂN KHAI 9 BẢN VÁ** (⭐ **dập 4 lỗi 500**) ✓
2. ⭐⭐⭐ **CHO PHÉP DỌN TRANSIT** (`receive_central_return` ×5 + `receive_transfer_order` ×1) ✓
3. ⭐⭐ **TỒN Ở `KHO-E2E-01` (48) + `WHTEAM` (5)** — giữ hay dọn? ✓
4. ⭐⭐ **CHO PHÉP DỌN 570 QUYỀN MỒ CÔI** ✓
5. ⭐⭐ **CÂU HỎI NGHIỆP VỤ**: xoá nhân sự thì **giữ** hồ sơ HR / HĐLĐ / bảo hiểm không? ✓
6. ⭐⭐⭐ **XÁC NHẬN BẰNG MẮT** — 2 modal, tab đã đều chưa ✓
7. ⭐ **TÍNH NĂNG MỚI?** — ⭐ có muốn thêm **«đánh dấu TẤT CẢ thông báo công việc đã đọc»** không? (⭐ §19 hạng 7 — ⛔ không làm trong GO-LIVE nếu bạn ⛔ không yêu cầu) ✓
8. ⭐ **Commit theo NHÓM** ✓
