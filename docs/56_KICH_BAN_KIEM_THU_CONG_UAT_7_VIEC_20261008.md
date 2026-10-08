# KỊCH BẢN KIỂM THỦ CÔNG (UAT) 7 VIỆC KHỐI «CÔNG VIỆC» — để **anh tự bấm và đối chiếu**

Phiên: `ERP-SESSION-04` (`SESSION_D`) · Ngày: **08/10/2026** · Nối tiếp `docs/51`→`docs/55`
⭐ **Vì sao có tài liệu này**: shell hỏng suốt phiên ⇒ ⛔ **không có cách nào verify UI bằng máy**. Trong lúc đó, **kiểm thủ công theo kịch bản** là đường kiểm định **duy nhất** — và nó cũng chính là **UAT go-live** mà anh sẽ phải làm.
⚠️ **Chỉ dùng SAU khi đã áp** các lượt trong `docs/54` (L1→L7).

---

## 0. CHUẨN BỊ (5 phút)
| # | Cần gì | Vì sao |
|---|---|---|
| 1 | **3 tài khoản**: ① **Nhân viên** (chỉ có `dept_plan_tasks`/`canUse`) ② **Trưởng phòng** (của **cùng phòng** với việc) ③ **Admin** | Hầu hết lỗi ở 7 việc là **lỗi theo VAI** (ai thấy nút nào) |
| 2 | Dịch vụ đang chạy: Java `:18081` → UI `:8787` (**đúng thứ tự**) | `docs/29` runbook |
| 3 | **1 nhiệm vụ có sẵn** ở trạng thái `NEW` hoặc `IN_PROGRESS`, có `departmentCode` = phòng của Trưởng phòng ở (1) | Để thử luồng % → gửi kiểm tra → duyệt |
| 4 | Mở **DevTools Console** (F12) — dán mỗi bước xong **xem có 400/403 nào không** | ⭐ Bắt lỗi im lặng (`add_work_item_comment` **400** là ca đã biết) |

---

## 1. BẢNG 7 KỊCH BẢN (điền kết quả vào cột cuối)

| # | Việc | Kịch bản | Kết quả MONG ĐỢI | Kết quả thực tế |
|---|---|---|---|---|
| **K1** | **1** — hub «Công việc» | ① Bấm nhóm **«Công việc»** ở sidebar ② xem thanh tab trên màn | ① Có **đúng 1 mục con** «Công việc» (⛔ không còn 5 mục rời) ② Mở ra **tab «Dashboard» đang được chọn** (tab **đầu**) ③ ⛔ **không** hiện màn «CHƯA ĐƯỢC PHÂN QUYỀN» | ☐ |
| **K2** | **1** (bẫy điều hướng) | **Đăng nhập tài khoản NHÂN VIÊN** (chỉ có `dept_plan_tasks`) rồi bấm «Công việc» | ✅ Phải vào **tab «Dashboard»** — ⛔ **KHÔNG** được rơi vào tab «Danh sách công việc» *(đây là bẫy `workCenterViewFor` — `docs/51` Bước 6)* | ☐ |
| **K3** | **2** — search | ① Ở tab «Danh sách công việc», nhìn **phía trên bảng** ② gõ vài ký tự có trong mã việc/tên việc | ① ⛔ **KHÔNG còn** ô tìm ở **đầu màn** ② Có ô tìm **ngay trên danh sách** ③ Bảng **lọc đúng** theo `mã việc / nội dung / người làm` | ☐ |
| **K4** | **3** — nhập % | ① Ở cột cuối bảng, nhập `40` vào ô **%** ② bấm **Lưu** | ① ⛔ **không còn** 4 nút `25/50/75/100%` ② Thanh tiến độ đổi **40%** ③ Trạng thái `NEW` tự chuyển **Đang làm** ④ Console **⛔ không 4xx** | ☐ |
| **K5** | **3 + `BUG-D05`** | Với tài khoản **NHÂN VIÊN**, ở dòng việc của mình: tìm nút gửi hoàn thành | ✅ Nút phải là **«Gửi kiểm tra»** (gửi `SUBMITTED`) — ⛔ **KHÔNG** có nút «Xong» gửi `COMPLETED` *(nút cũ luôn bị BE từ chối — `BUG-20261008-D05`)* | ☐ |
| **K6** | **5** — duyệt / làm lại | **Đăng nhập TRƯỞNG PHÒNG** (cùng phòng với việc): mở việc đang `SUBMITTED` | ① Thấy **«Duyệt xong»** (⇒ `COMPLETED`) **và** **«Yêu cầu làm lại»** ② Làm lại **bắt buộc nhập lý do** (bỏ trống ⇒ ⛔ không gửi) ③ Tài khoản **NHÂN VIÊN** ⛔ **KHÔNG** thấy 2 nút này | ☐ |
| **K7** | **6** — tab «Được giao» + thông báo | ① Trưởng phòng **giao 1 việc mới** cho nhân viên ② Nhân viên xem **chuông thông báo** + tab «Được giao» | ① Có **tab «Được giao»** riêng ② Việc mới **xuất hiện** trong tab đó ③ Nhân viên **nhận được thông báo trên web** (chuông có số chưa đọc) ④ Khi việc `COMPLETED` ⇒ **người giao cũng có thông báo** | ☐ |
| **K8** | **7** — «Phòng ban/ Tổ đội» | Mở tab đó | ① Tên tab là **«Phòng ban/ Tổ đội»** ② Có **2 sub-tab**: «Việc của phòng ban» · «Việc của tổ đội» (có **bộ đếm**) ③ Đổi sub-tab ⇒ **bảng đổi đúng tập** ④ Kanban/Cây: theo phương án đã chốt (**ẩn/hiện bằng nút** hoặc **bỏ**) | ☐ |
| **K9** | **5** — modal chi tiết | ① Bấm **mã việc** ở cột đầu ② thử đóng bằng nút **✕** và bằng **Esc/bấm ra ngoài** | ① Modal mở, tiêu đề + người làm + hạn + **dòng thời gian** + **bình luận** ② Có nút **✕** với tooltip/nhãn **«Đóng»** ③ Console ⛔ không 4xx | ☐ |
| **K10** | **5** — Nhận xét (⚠️ phụ thuộc BE) | Trong modal chi tiết, xem phần bình luận | ⛔ **Nếu CHƯA port BE** ⇒ phải hiện dòng *«Nhận xét sẽ bật sau khi backend hoàn tất…»* và **⛔ KHÔNG có nút gửi** *(nút sẽ trả 400 vì `add_work_item_comment` chưa cài)*. ✅ **Nếu ĐÃ port** ⇒ gửi bình luận được, hiện ngay trong danh sách | ☐ |

---

## 2. CA BIÊN BẮT BUỘC THỬ (⛔ hay bị bỏ sót)
```text
[ ] Nhân viên ⛔ KHÔNG có quyền công việc nào ⇒ mục «Công việc» PHẢI BIẾN MẤT (⛔ không lỗi màn, ⛔ không hiện mục rỗng)
[ ] Nhân viên chỉ có `dept_project_*` (không có `dept_plan_*`) ⇒ vẫn phải vào được hub (mục hub gộp đủ 6 khoá)
[ ] Việc của PHÒNG KHÁC ⇒ Trưởng phòng phòng mình ⛔ KHÔNG được duyệt (kiểm chéo quyền)
[ ] Nhập % ngoài khoảng: `-5` · `150` · chữ `abc` ⇒ phải bị kẹp `0..100` hoặc chặn, ⛔ không lỗi 500
[ ] Bấm «Gửi kiểm tra» 2 lần liên tiếp ⇒ ⛔ không nhân đôi thao tác (nút `disabled` khi `busy`)
[ ] Việc đã `COMPLETED` ⇒ ⛔ không còn nút gửi/duyệt
[ ] Tài khoản admin ⇒ thấy đủ mọi nút (đối chứng DƯƠNG)
```

## 3. DẤU HIỆU SAI ⇒ **DỪNG VÀ BÁO LẠI** (⛔ đừng tự sửa tiếp)
| Dấu hiệu | Nghĩa là | Xem |
|---|---|---|
| Bấm «Công việc» ⇒ mở **tab Cá nhân** | ⛔ chưa làm/⛔ sai **Bước 6** (`workCenterViewFor` đảo nhánh) | `docs/51` §Bước 6 |
| Mục «Công việc» **biến mất** với nhân viên | ⛔ mục hub **thiếu khoá quyền** trong `permissionKeys` | `docs/51` §Bước 1 |
| Nút gửi **403 «Tài khoản không có quyền thực hiện nghiệp vụ này»** | ⛔ gửi `COMPLETED` khi là người thực hiện (đúng `BUG-D05`) | `docs/52` §3.1 |
| Nút **«Nhận xét»** ⇒ **400 «chưa được triển khai trên backend Java»** | ⛔ cổng `COMMENTS_READY` chưa bật / BE chưa port | `docs/50` §2 |
| Console **404** với `dist/…` | ⛔ build UI chưa được phục vụ (chưa `gd-cycle`) | `docs/54` §0 |

## 4. GHI BẰNG CHỨNG (theo văn hoá bằng chứng của dự án)
```text
Mỗi kịch bản: ảnh chụp (PNG) + mã việc + TÀI KHOẢN dùng + kết quả (ĐẠT/⛔KHÔNG) + Console copy nếu có 4xx
Lưu vào:  docs/dsh-mutil-session/SESSION_<phiên thi hành>/TEST_LOG.md  (bảng `TEST-YYYYMMDD-…`, cột ⭐)
⛔ KHÔNG ghi «ĐẠT» khi chưa bấm thật (Goal §24: `FIXED = mã + test đỗ`; `VERIFIED = đã đo lại`)
```

## 5. ✅ ĐIỀU KIỆN KẾT LUẬN «7 VIỆC ĐẠT»
```text
[ ] K1→K10 đều ĐẠT (K10 có thể «ĐẠT-một-phần» nếu BE chưa port — khi đó ghi rõ «chờ port»)
[ ] 7 ca biên ở §2 đã thử
[ ] ⛔ không 4xx/5xx trong Console suốt quá trình
[ ] `npx tsc --noEmit` = 0 · `npm run test:regression` ⛔ không fail mới (mốc 865·864·0·1) · đã `gd-cycle`
[ ] 2 tệp test `docs/55` đã dán + chạy (`node --test …`) và **XANH** sau khi vá
[ ] cập nhật `docs/41` (ma trận) + log + Telegram theo mẫu `SESSION_C/README.md`
```
⚠️ **Nhắc lại ⛔ ranh giới**: ⛔ **không gọi `FIXED`/`VERIFIED`** chỉ vì đã sửa mã — phải có **test đỗ** và **đo lại** (`docs/54` §3).
