# AUDIT A-16 — KIỂM THỬ CROSS-DEPARTMENT / CROSS-PROJECT (P1)

- **Ngày:** 20/09/2026 · **Trạng thái:** HOÀN THÀNH
- **KẾT LUẬN NGẮN:** ✅ **Giới hạn theo DỰ ÁN hoạt động** · ✅ **Chặn thao tác với người dùng không đủ quyền hoạt động** (**0 lỗ hổng lọt qua**) · ⚠️ **Phát hiện 1 LỖI THẬT: khoá nhầm `save_payment_plan`**
- **Phương pháp (§45):** **chạy 3 probe có sẵn** trên hệ thống thật (`:8787`/`:9000` + Java `:18081`) ⇒ **lấy kết quả đo được**, không suy đoán.

## 1. BẰNG CHỨNG ĐO ĐƯỢC (chạy thật, EXIT 0)

### ① `tools/probe-project-visibility.mjs` — giới hạn theo DỰ ÁN
```
Tổng dự án active: 2 · dự án gán cho user này: 0
login engineer: 200
bootstrap engineer:  projects = 0   adminProjects = 0   projectAccessAll = false
✅ có lọc theo quyền
```
⇒ **CONFIRMED:** người dùng **không được gán dự án nào** ⇒ bootstrap trả **0 dự án** (không trả 2 dự án của hệ thống) ⇒ **lọc theo phạm vi dự án hoạt động** ✅

### ② `tools/probe-nonadmin-access.mjs` — CHẶN thao tác với non-admin
```
[H2] login kỹ sư: 200
     save_material: 403 · "Tài khoản chưa được quản trị viên cấp đúng quyền cho thao tác này."
XAC NHAN H2: nguoi dung KHONG phai admin bi CHAN moi thao tac
```
⇒ **CONFIRMED:** tài khoản **không phải admin** bị **403** khi gọi thao tác ngoài quyền ✅

### ③ `tools/probe-rbac-gap.mjs` — có action nào THOÁT kiểm soát không?
```
⇒ 0/5 action THOÁT khỏi kiểm soát phân quyền module
```
⇒ **CONFIRMED:** **không** action nào lọt khỏi kiểm soát phân quyền module ✅

### ④ `tools/probe-security-rbac.mjs` — bảng hành xử mong đợi vs thực tế
```
Hành xử ĐÚNG          : 19/20
❌ LỘT QUA (lỗ hổng)   : 0
⚠️  KHOÁ NHẦM          : 1 — save_payment_plan
```
⇒ **CONFIRMED:** **0 lỗ hổng lọt qua** (không vượt quyền) ✅ — **nhưng có 1 ca KHOÁ NHẦM**.

## 2. PHÁT HIỆN CẦN XỬ LÝ

| # | Phát hiện | Mức | Phân loại |
|---|---|---|---|
| F1 | **`save_payment_plan` bị KHOÁ NHẦM** (người dùng hợp lệ bị 403) ⇒ **không lập được kế hoạch thanh toán** | **P1** (nghiệp vụ) | **CONFIRMED** (probe `probe-security-rbac.mjs`) |
| F2 | `create_user` qua API **không chạy được** trong môi trường probe vì **`organization_units` RỖNG** ⇒ (a) chặn kiểm thử end-to-end, (b) nếu gặp ở môi trường thật thì **không tạo được người dùng** | P1 | **CONFIRMED** (probe `probe-nonadmin-access.mjs`, mục H1) |
| F3 | Probe `probe-security-rbac.mjs` kết luận tổng **“CHƯA ĐẠT”** do ca khoá nhầm ⇒ **cổng kiểm thử an ninh hiện KHÔNG xanh** | P1 | **CONFIRMED** |

## 3. KẾT LUẬN (trả lời đúng câu hỏi audit)

1. **Cross-project (dự án):** ⇒ **CONFIRMED hoạt động đúng** — bootstrap lọc theo `user_project_scopes`; user 0 dự án ⇒ thấy 0.
2. **Cross-department (phòng):** ⇒ **CONFIRMED đúng ở lớp hành động** — non-admin gọi thao tác ngoài quyền ⇒ **403**; **0/5** và **0/20** ca lọt qua ⇒ **không có đường vượt quyền** đã biết.
3. **Rủi ro còn lại:** ⇒ **khoá nhầm (F1)** gây **hỏng nghiệp vụ** (khác bản chất với “lọt qua”), và **nợ dữ liệu (F2)** chặn kiểm thử tạo người dùng.

## 4. KHUYẾN NGHỊ (chờ user quyết định)

1. **Sửa `save_payment_plan`** (F1): đối chiếu `ActionRbacRegistry.modulesFor("save_payment_plan")` với module quyền thực tế của người dùng hợp lệ ⇒ bổ sung/đổi module hoặc capability cho đúng; sau đó **chạy lại `probe-security-rbac.mjs` cho tới khi 20/20**.
2. **Seed `organization_units`** (F2) để luồng tạo người dùng chạy được end-to-end (đây là tiền đề của nhiều kiểm thử).
3. **Đưa 3 probe này vào cổng kiểm thử tự động** (`npm test`/CI) để chống hồi quy phân quyền — vì hiện chúng **chỉ chạy khi được gọi tay**.

*Không tự ý sửa mã/cấu hình trong lượt audit này — chỉ kết luận + khuyến nghị.*
