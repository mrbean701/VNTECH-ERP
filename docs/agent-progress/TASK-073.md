# TASK-073 — Cổng cho `teamMembers`: khoá Java-only **CHƯA TỪNG ĐƯỢC ĐO**

**Trạng thái:** ✅ DONE — **21/21 ĐẠT**, trong đó **4 phép ĐỐI CHỨNG** chứng minh cổng **báo được HỎNG**
**Ngày:** 17/09/2026 · **Nhánh:** `unity` · **Cổng:** `tools/probe-task073-team-members.mjs`

---

## 1. Vì sao có task này — một khoá "đo được 0 lần" trong suốt dự án

`docs/agent-progress/TASK-070.md` in thẳng dòng: *"**2 phép đo KHÔNG thực hiện được**: `teamMembers`
(bảng 0 dòng) · `workItemEvents`"*. Với `workItemEvents`, TASK-058 đã giải quyết bằng cách **cắm fixture tạm**
trong `finally`. `teamMembers` thì **chưa** — nghĩa là suốt dự án, câu SQL 11 cột này **chưa từng được chạy
với dữ liệu thật**, nên **đúng hay sai đều không biết**. Một khoá như vậy nằm trong nhóm nguy hiểm nhất:
UI có màn "Tổ đội", API có khoá, DB có bảng — nhưng **không có gì chứng minh đường ĐỌC hoạt động**.

## 2. Phát hiện trước khi viết cổng — khoá này là **Java-only**

`grep` toàn bộ JS tham chiếu `scripts/system-route.mjs` cho `team_members` / `teamMembers` = **0 kết quả**
⇒ **bản JS không hề đọc bảng này**. Trong Java, khoá nằm **trong `if (admin)`** (khối dòng 1152–1212).

**Hệ quả (ghi rõ, không suy diễn):** không có bản JS để đối chiếu, nên **không thể** kết luận "Java thừa/thiếu
cột" theo kiểu các cổng parity. Cái ĐO ĐƯỢC là: **đường đọc có trả dữ liệu thật, đúng từng trường, và không
rò rỉ**. UI khai `teamMembers?: Row[]` (**tuỳ chọn** — đúng với thực tế Java-only).

## 3. Cách đo — fixture thật, đối chiếu bằng CÂU VIẾT KHÁC DẠNG

Cắm **2 dòng tạm** vào `team_members` (mức nền **0 dòng**, `teams` 1 dòng, `users` 12):

| Dòng | `user_id` | `joined_at` | `active` | Mục đích |
|---|---|---|---|---|
| `PRB073-A` | người dùng THẬT (`nvkhdemo`) | 01/01/2026 08:00 | 1 | đối chiếu **từng trường** |
| `PRB073-B` | **không tồn tại** (`PRB073-NOUSER`) | 02/01/2026 08:00 | 0 | bẫy **`LEFT JOIN` vs `INNER JOIN`** + thứ tự |

Đối chiếu API ↔ MySQL bằng **câu viết KHÁC DẠNG** (dùng **subquery** `(SELECT name FROM role_catalog WHERE
code=u.role)` thay vì `LEFT JOIN role_catalog` như Java) ⇒ không lặp lại chính câu SQL đang kiểm.

## 4. Kết quả — 21/21 ĐẠT (4 phép là ĐỐI CHỨNG)

| # | Phép kiểm | Kết quả |
|---|---|---|
| C0 | fixture cắm đúng 2 dòng | ĐẠT |
| C1 | API trả **đúng 2 dòng** fixture cho admin (khoá nay CÓ dữ liệu thật) | ĐẠT |
| C2 | **8 trường** khớp MySQL: `fullName` · `employeeCode` · `role` · `roleName` (qua `COALESCE`) · `department` · `teamId` · `roleInTeam` · `joinedAt` | ĐẠT 8/8 |
| C2 | `leftAt` = `null` **giữ nguyên `null`** (không thành chuỗi `"NULL"`) | ĐẠT |
| C3 | **`active` là BOOLEAN** (`typeof=boolean`, dòng A `true` · dòng B `false`) — đo **KIỂU**, đúng lớp lỗi `tinyint(1)` của TASK-052 | ĐẠT |
| C4 | **dòng MỒ CÔI vẫn được trả về** ⇒ Java dùng `LEFT JOIN`, **không** phải `INNER JOIN` (nếu sai thì dòng **biến mất** — đúng lớp lỗi *"thiếu DÒNG"* đã gặp ở `boqItems`) | ĐẠT |
| C5 | dòng mồ côi có trường người dùng **RỖNG**, không bịa dữ liệu | ĐẠT |
| C6 | `ORDER BY tm.team_id,tm.joined_at` — A (01/01) đứng trước B (02/01), vị trí **0 và 1** | ĐẠT |
| C7 | **không rò rỉ**: `thukydemo` **KHÔNG** nhận khoá (`có trong payload: false`, 0 dòng) | ĐẠT |
| C8 | **dọn sạch**: số dòng **trở về đúng mức nền 0** | ĐẠT |
| ĐC | **4 phép ĐỐI CHỨNG**: giống nhau ⇒ phải KHỚP · khác nhau ⇒ phải LỆCH · `null` (API) vs `"NULL"` (mysql `--raw`) ⇒ phải LỆCH · **cố ý so SAI CẶP CỘT** (`fullName ↔ employeeCode`) ⇒ phải LỆCH | ĐẠT 4/4 |

> **Vì sao 4 phép đối chứng là phần quan trọng nhất:** cổng chạy lượt đầu đã **17/17 ĐẠT**. Theo đúng bài học
> #25 của dự án (*"công cụ luôn báo sạch thì vô dụng"*), một con số 17/17 **chưa chứng minh gì** cho tới khi
> chứng minh được **cổng báo được HỎNG**. 4 phép ĐC ở trên làm đúng việc đó — gồm cả bẫy `null` vs `"NULL"`
> của `mysql --raw` và một phép **cố ý so sai cặp cột** để chắc rằng phép so sánh thật sự phân biệt được.

## 5. Giới hạn & việc còn lại (không giấu)

1. **DỮ LIỆU vẫn 0 dòng** ⇒ màn "Tổ đội" vẫn trống. Cổng này chứng minh **đường ĐỌC đúng**, **không** chứng minh
   có dữ liệu. Nạp thành viên tổ đội là **thao tác dữ liệu của quản trị viên** (giống câu hỏi #2 về
   `user_module_permissions`) — **cần người dùng quyết định**, không tự thêm.
2. **Không có bản JS để so** (khoá Java-only) ⇒ **không** kết luận được gì về parity.
3. Chỉ đo **đường ĐỌC** (bootstrap). Chưa đo **đường GHI** thành viên tổ đội (nếu UI có thao tác thêm/xoá).
4. Fixture dùng **1 team có sẵn**; nhánh "tạo team mới rồi thêm thành viên" không nằm trong phạm vi.

## 6. Tệp thay đổi

| Tệp | Thay đổi |
|---|---|
| `tools/probe-task073-team-members.mjs` | **MỚI** — cổng có fixture + đối chiếu khác dạng + 4 đối chứng + dọn dẹp trong `finally` |
| `docs/agent-progress/{MASTER_STATUS,TASK_INDEX}.md` | cập nhật mốc trạng thái + dòng task |
