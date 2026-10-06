# TASK-159 — GO-LIVE ĐỢT 14: LẤP LỖ HỔNG CHO 2 ACTION UI CHƯA HỀ ĐƯỢC KIỂM

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Kết quả** | ✅ `change_password` **6/6 ĐẠT** · ✅ phép thử **CÁCH LY theo user** ĐẠT · 📋 **BUG-20261009 (MEDIUM)** ghi nhận |
| **Tệp mới** | `tools/e2e/go-live-doc-tat-ca-va-doi-mat-khau.mjs` |
| **Mã nguồn sửa** | ⛔ **KHÔNG** ⇒ **vân tay không đổi**, ⛔ không cần build lại |

---

## ① CÁCH TÌM RA — ĐO **SẮC** HƠN

Phép đo trước chỉ hỏi «action có được **NHẮC TỚI** không» ⇒ 212/214. Lần này tách rõ **hai tập khác nhau**:

| Tập | Cách đo | Số |
|---|---|---|
| **Action UI THẬT SỰ gọi** | `submit("x"` · `action("x"` … trong `app/**/*.tsx` | **155** |
| **Action có ĐIỂM GỌI trong bài kiểm** | `tools/e2e/` · `tests/` · `java-backend/web/src/test/` | **86** |
| ⭐ **UI GỌI mà CHƯA HỀ ĐƯỢC KIỂM** | hiệu của hai tập trên | **92** |

⭐ **Nhắc tới ≠ được kiểm.** Đây là chỗ phép đo cũ bỏ sót **92 đường**.

Phân bố 92 đường: `delete_*` **33** · `set_*_status` **22** · `save_*` **12** · `update_*` 5 · `bulk_*` 4 · còn lại 16.

---

## ② CHỌN 2 ĐƯỜNG THEO §19 (DỮ LIỆU / BẢO MẬT) + ĐÚNG YÊU CẦU USER («test thông báo web»)

| # | Action | Vì sao chọn |
|---|---|---|
| A | **`mark_notification_all_read`** | đúng yêu cầu user; UI `page.tsx:3343`; backend `SystemController:1375`. ⭐ Chú thích trong mã nêu **tính chất bảo mật** phải kiểm: «backend lấy `cu.id()` từ phiên ⇒ trạng thái **theo user**, ⛔ không thể đánh dấu global» |
| B | **`change_password`** | **BẢO MẬT** — mọi người dùng đều dùng; UI `page.tsx:3380,3389`; backend `SystemController:259` |

---

## ③ KẾT QUẢ

### B · `change_password` — **6/6 ĐẠT** ✅
| Phép kiểm | Kết quả |
|---|---|
| Đối chứng âm: mật khẩu cũ **SAI** | ✔ chặn — «Mật khẩu hiện tại không đúng.» |
| Đổi mật khẩu | ✔ «Đã đổi mật khẩu thành công.» |
| Đăng nhập bằng mật khẩu **MỚI** | ✔ được |
| ⭐ Mật khẩu **CŨ hết hiệu lực** | ✔ **không** đăng nhập được nữa (⛔ nếu vẫn vào được là **lỗi bảo mật**) |
| Khôi phục mật khẩu gốc | ✔ đăng nhập lại được bằng mật khẩu gốc |

### A · `mark_notification_all_read` — **CÁCH LY ĐẠT** ✅ + **1 PHÁT HIỆN**
| Phép kiểm | Kết quả |
|---|---|
| ⭐ **CÁCH LY theo user** | ✔ `e2e.kh` (0 thông báo) gọi action ⇒ `e2e.project` **KHÔNG bị đụng** (3 → 3) ⇒ **tính chất bảo mật ĐÚNG** |
| Đối chứng âm: chưa đăng nhập | ✔ bị chặn |
| Phạm vi tác dụng | ⓘ **chỉ** xoá thông báo **HỆ THỐNG**; ⛔ **không** đụng thông báo **CÔNG VIỆC** |

---

## ④ 📋 BUG-20261009 (MEDIUM) — BADGE CHUÔNG KHÔNG VỀ 0

| | |
|---|---|
| **MODULE** | Thông báo (chuông) · «Đánh dấu tất cả đã đọc» |
| **SEVERITY** | **MEDIUM** (UX/thiếu chức năng; ⛔ không chặn workflow) |
| **HIỆN TƯỢNG** | Bấm «Đánh dấu tất cả đã đọc» ⇒ hiện «Đã đánh dấu tất cả đã đọc (**0** thông báo)» và **badge chuông KHÔNG về 0** |
| **ROOT CAUSE** | `NotificationStoreAdapter.markAllRead` **chỉ** xử lý thông báo **theo CẤU HÌNH**: `UPDATE/INSERT notification_user_states` ⋈ `notification_configs` (⛔ không đụng `task_notifications.read_at`). Mà badge ở `app/page.tsx:570` lại đếm **cả** `unreadTaskNotifications.length` |
| **BẰNG CHỨNG ĐO ĐƯỢC** | `e2e.project`: 4 chưa đọc ở `task_notifications` trước → **4 sau** khi gọi action; phản hồi «0 thông báo» |
| **⛔ ĐÂY KHÔNG PHẢI «ACTION HỎNG»** | Nó chạy **đúng phạm vi** của nó (thông báo hệ thống). UI **vẫn** đánh dấu được **từng** thông báo công việc qua `mark_task_notification_read` (`app/page.tsx:704,715`) |
| **VẤN ĐỀ THẬT** | ① **TÊN action nói «all» nhưng phạm vi chỉ MỘT nguồn** ⇒ gây hiểu sai; ② ⛔ **thiếu nút đọc-tất-cả cho thông báo CÔNG VIỆC** ⇒ người có nhiều thông báo phải bấm từng cái, badge không bao giờ về 0 |
| **ĐỀ XUẤT** | **(a)** cho `mark_notification_all_read` xoá **cả** `task_notifications` của chính user (khớp trực giác «tất cả» + khớp badge), **hoặc** **(b)** thêm action/nút riêng cho thông báo công việc |
| **STATUS** | 📋 **REPORTED — chờ user chốt** (đổi ngữ nghĩa giữa GO-LIVE ⇒ ⛔ **§12** không tự làm) |

---

## ⑤ ⛔ TÔI ĐÃ TỰ SỬA 2 LỖI TRONG CHÍNH BÀI TEST CỦA MÌNH

| Lỗi của tôi | Sự thật | Đã sửa |
|---|---|---|
| Dùng `e2e.kh`/`e2e.tk` làm người **nhận việc** ⇒ `create_work_item` từ chối («Chưa có nhân sự Phòng Dự án phù hợp/phạm vi dự án») | ⭐ Đo **14 tài khoản E2E**: **CHỈ `e2e.project`** nhận được việc (phải thuộc **Phòng Dự án** *và* trong phạm vi dự án) | Tách thành **2 PHA** (PHA 1 cách ly dùng người 0 thông báo · PHA 2 đọc-hết dùng `e2e.project`) |
| ⛔ **In ra «LỖI BẢO MẬT» khi chưa dựng được điều kiện** (cả hai đều 0 chưa đọc ⇒ `0 === 0` đúng nhưng `> 0` sai) | Đó là **CẢNH BÁO SAI** | Chỉ kết luận khi `truocB.chua > 0`; nếu không ⇒ in **«KHÔNG ĐO ĐƯỢC»**, ⛔ không nói ĐẠT/HỎNG |

---

## ⑥ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| Bài E2E mới | **8/8 ĐẠT · EXIT=0** |
| `change_password` | **6/6 ĐẠT** |
| Cách ly theo user (bảo mật) | ✅ **ĐẠT** |
| Action UI gọi mà chưa hề được kiểm | **92** (đã lấp **2**) |
| Vân tay | **ĐẠT** `VNTECH-FP-AC3AEB863B93A5E6` · **713 tệp** — ⛔ không đổi (vòng này ⛔ không sửa mã nguồn) |
| Tệp tạm | **0** |
| `:18081` | ⛔ vẫn **JAR cũ** ⇒ **3 bản vá chưa lên sóng** |

---

## ⑦ BÀI HỌC

1. ⭐⭐ **«ĐƯỢC NHẮC TỚI» ≠ «ĐƯỢC KIỂM».** Phép đo cũ gộp hai tập làm một ⇒ kết luận «chỉ 2/214 chưa kiểm». Tách ra: **UI gọi 155 · bài kiểm gọi 86 ⇒ 92 đường UI gọi mà CHƯA hề được kiểm**. ⛔ Sai tập ⇒ sai kết luận (họ **D-108**).
2. ⛔⛔ **KHÔNG ĐƯỢC KẾT LUẬN KHI CHƯA DỰNG ĐƯỢC ĐIỀU KIỆN.** Bài của tôi in «⛔⛔ LỖI BẢO MẬT» chỉ vì cả hai vế đều bằng 0 ⇒ **báo động giả**. Thiếu điều kiện thì phải nói **«KHÔNG ĐO ĐƯỢC»**.
3. ⭐⭐ **PHÂN BIỆT «HỎNG» VỚI «KHÁC PHẠM VI».** `mark_notification_all_read` **chạy đúng** phạm vi của nó; cái sai là **TÊN nói «all»** và **badge đếm thêm nguồn khác**. ⛔ Nếu tôi vội gọi đây là «action hỏng 100%» thì đã **báo sai** một lần nữa.
4. ⭐ **ĐO ĐIỀU KIỆN TIÊN QUYẾT TRƯỚC KHI VIẾT PHÉP THỬ.** Mất 2 lượt vì chọn người nhận việc sai; đo 14 tài khoản một lượt là ra ngay `e2e.project`.
5. ⭐ **PHÉP THỬ BẢO MẬT CẦN HAI VẾ.** «Cách ly theo user» chỉ chứng minh được khi **vế đối chứng CÓ dữ liệu** — nếu không, phép thử **rỗng** dù chạy xong không lỗi.

---

## ⑧ BLOCKER / CHỜ USER

⛔ **Chưa commit**.
⛔ **Cần user quyết:**
1. ⭐ **Cho phép `mvn -o -DskipTests package` + khởi động lại Java `:18081`** — **3 bản vá chưa lên sóng** (BUG-003 · BUG-005 · BUG-008); pre-flight đã chứng minh **AN TOÀN**; ghi luôn `V35`+`V37` vào sổ migration.
2. **BUG-20261009** — chọn **(a)** cho «đọc tất cả» xoá cả thông báo công việc, hay **(b)** thêm nút riêng?
3. **BUG-20261005-007** — 130 lớp thiếu CSS: xử lý theo màn hay để lại?
4. **Chốt bất đồng** «ai được nhận hàng ở kho đích».
5. **4 phiếu trả Kho Tổng kẹt + 9 đơn vị kẹt ở `WH-TRANSIT`** — dọn thế nào?
6. **90 action UI gọi còn lại chưa được kiểm** — có muốn tôi lấp tiếp không (ưu tiên `delete_*` · `update_*`)?
7. Xoá đăng ký thừa `manage_contract_review`? · 8. Mở task «thêm thành viên tổ đội»? · 9. Commit?
