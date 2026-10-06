# TASK-149 — GO-LIVE ĐỢT 4: ĐIỀU TRA 0 DÒNG + DỮ LIỆU USER → TỔ ĐỘI

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Trạng thái** | ✅ XONG — 1 nghi vấn được **minh oan**, 1 lỗ hổng chức năng được ghi nhận + bù dữ liệu |
| **Môi trường** | `:9000` → Java `:18081` → MySQL `vntech_erp` |
| **Tệp mới** | `tools/golive-seed-team-members.sql` |
| **Vân tay** | ⛔ **KHÔNG đổi** — đợt này chỉ thêm tệp trong `tools/` và `docs/` (cả hai **ngoài** vân tay) |

---

## ① «0 DÒNG» KHÔNG TỰ ĐỘNG LÀ LỖI — `approval_stage_decisions` ĐƯỢC MINH OAN

**Nghi vấn ban đầu** (tôi ghi ở TASK-147 §7): `approval_stage_decisions` = **0 dòng** trong khi `approvals` = **368 dòng** và **37 PR đã duyệt** ⇒ nghi hệ thống không ghi lịch sử quyết định.

**Điều tra — đọc đúng chỗ ghi, không đoán:**

| Bằng chứng | Nội dung |
|---|---|
| `RequestManagementUseCase.java:723` | `if ("all_roles".equals(sv(stageConfig, "approvalMode")) && "approved".equals(decision)) {` |
| `RequestManagementUseCase.java:742` | `store.insertStageDecision(requestId, stage, roleCode, principal.userId(), "approved", comment, now);` |
| Cấu hình thật (`approval_stage_catalog`) | **8/8 stage đều `approval_mode = single`** (đo qua API: `all_roles` = **0/8**) |

⇒ **Lệnh ghi nằm BÊN TRONG nhánh `all_roles`.** Với cấu hình hiện tại (tất cả `single`), bảng **phải** rỗng.
**KẾT LUẬN: 0 dòng là ĐÚNG THIẾT KẾ — ⛔ KHÔNG phải lỗi.** Đã đóng nghi vấn, không báo động giả.

ⓘ Bảng này chỉ được dùng khi có bước **duyệt song song nhiều vai trò**: `stageDecisionRoles` (đã vai trò nào duyệt) và
`stageDecisionUsers` (`RequestManagementUseCase:785` — loại người đã quyết khỏi danh sách chờ). Ai chuyển một bước sang
`all_roles` thì bảng bắt đầu có dữ liệu — đúng như thiết kế.

---

## ② ⭐ LỖ HỔNG CHỨC NĂNG: **KHÔNG CÓ ĐƯỜNG NÀO THÊM THÀNH VIÊN TỔ ĐỘI**

Yêu cầu user: «*Thêm đầy đủ dữ liệu để test từ user cho đến tổ đội*». Khi bù dữ liệu thì phát hiện:

| Bằng chứng | Nội dung |
|---|---|
| Quét toàn bộ mã nguồn | **0** dòng `INSERT INTO team_members` — **cả JS lẫn Java** |
| `OpsTaskManagementUseCase.java:421-461` | `createProjectTeam` chỉ nhận `projectId · code · name · trade · **leaderUserId**` rồi gọi `insertProjectTeamWithWarehouse(...)` — **không thêm thành viên** |
| UI | chỉ **ĐỌC** `data.teamMembers` (`ProjectAggregateTabs:59` cột «Thành viên», `ProjectDetailTabs:249` «tổ đội của tôi», `ProjectEntityModal:107`) |
| 166 action của API | **không có** action nào quản lý thành viên tổ đội |

⇒ UI **hiển thị** cột «Thành viên» nhưng **không có cách nào thêm thành viên** trong ứng dụng.
⭐ **Lỗ hổng này dự án ĐÃ BIẾT TỪ TRƯỚC** — chính chú thích trong `tools/task080-seed-real-data.sql:67` ghi:
> «TỔ ĐỘI: thiếu TỔ TRƯỞNG và thiếu THÀNH VIÊN (`team_members` = 0 dòng)»

**Trạng thái:** ghi nhận là **lỗ hổng chức năng (MEDIUM)**. ⛔ **KHÔNG tự xây thêm tính năng** — GOAL §12 cấm refactor/làm
tính năng lớn giữa GO-LIVE. Việc đúng đắn trong giai đoạn này là **bù dữ liệu để test được** + ghi lại để user quyết.

---

## ③ ĐÃ BÙ DỮ LIỆU — `tools/golive-seed-team-members.sql`

Theo **đúng quy ước** của `tools/task080-seed-real-data.sql`: `role_in_team` lấy từ `role_catalog.name` (chức danh CHUẨN,
⛔ không tự đặt chữ) · id `TMB_GOLIVE_<12hex>` · idempotent bằng `NOT EXISTS` · ⛔ không xoá/sửa dòng nào đang có.

| Tổ đội | Trước | Sau | Tổ trưởng | Thành viên (đọc qua API thật) |
|---|---|---|---|---|
| `E2E-DA-01-E2E-TD01` | 0 | **4** | `e2e.cht` | `e2e.cht` · `e2e.ksda` · `e2e.project` · `e2e.tk` |
| `E2E-DA-01-E2E-TD02` | 0 | **3** | `e2e.chtsa` | `e2e.chtsa` · `e2e.to` · `e2e.tk` |
| `TD-02` | 0 | **2** | `cha.ht` | `cha.ht` · `ksda.demo` |
| `TD-03` | 0 | **2** | `cha.ht` | `tkhodemo` · `engineer.demo` |
| `PRJ-DEMO-01-TD-01` | 4 | 4 (giữ nguyên) | `cha.ht` | không đụng |

**Tổng `team_members`: 4 → 15** · cả **5/5 tổ đội nay đều có tổ trưởng + thành viên**.
**Xác minh qua API thật** (`:9000`): `bootstrap.teamMembers` = **15**, mỗi dòng kèm `fullName · employeeCode · role · roleName · department`.
**Idempotent:** chạy 2 lần đều `exit=0`, số dòng không đổi.

---

## ④ ⛔ LỖI CỦA CHÍNH TÔI TRONG LẦN CHẠY ĐẦU — KHOÁ id THIẾU `team_id`

Lần chạy đầu **thất bại một phần**:
```
ERROR 1062 (23000) at line 46: Duplicate entry 'TMB_GOLIVE_573d04c73279' for key 'team_members.PRIMARY'
```
**Nguyên nhân:** tôi đặt `id = MD5(username)` — nhưng `e2e.tk` thuộc **cả hai** tổ đội ⇒ cùng `username` ⇒ **trùng khoá chính**.
Mục 4 của chính tệp đó tôi đã viết `MD5(CONCAT(username, t.code))` (đúng), còn mục 2–3 thì không ⇒ **không nhất quán trong cùng một tệp**.

**Bài học:** khi sinh khoá từ dữ liệu, **khoá phải chứa MỌI chiều của quan hệ** — quan hệ nhiều-nhiều thì khoá phải gồm cả hai đầu.
Sửa xong: `4 → 15` dòng, chạy lại 2 lần đều sạch.

---

## ⑤ KIỂM TRA HỒI QUY (GOAL §10)

Sau khi bù dữ liệu, chạy lại **toàn bộ chuỗi kho** trên dữ liệu mới: **9/9 ĐẠT · EXIT=0**
(`PX-E2E-DA-01-2026-0009` → `approved` → `issued` → `completed` · hoàn trả 4 → 5 · điều chuyển 5 · trả Kho Tổng 5).
⇒ Thêm thành viên tổ đội **không phá** nghiệp vụ kho.

---

## ⑥ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| `teamMembers` qua API `:9000` | **15** (trước 4) |
| Tổ đội có tổ trưởng | **5/5** |
| `approval_stage_decisions` | **0** — đúng thiết kế (`all_roles` = 0/8) |
| Chuỗi kho (hồi quy) | **9/9 ĐẠT · EXIT=0** |
| Tệp tạm | **0** |
| Vân tay | **không đổi** (`VNTECH-FP-614484381419C595`) — chỉ thêm `tools/` + `docs/` |

---

## ⑦ BÀI HỌC

1. ⛔⛔ **«0 dòng» KHÔNG tự động là lỗi.** Phải tìm **chỗ GHI** rồi đọc **điều kiện vào nhánh ghi** — ở đây lệnh ghi nằm trong
   nhánh `all_roles`, mà cấu hình thật toàn `single`. Đây là lần thứ **5** trong chuỗi GO-LIVE tôi suýt báo lỗi giả vì
   chỉ nhìn con số mà chưa đọc đường ghi.
2. ⛔ **Khoá sinh từ dữ liệu phải chứa MỌI chiều của quan hệ** — quan hệ nhiều-nhiều thì thiếu một chiều là trùng khoá.
3. ⭐ **Đọc chú thích trong chính repo trước khi kết luận «phát hiện mới»** — lỗ hổng `team_members` đã được ghi từ
   `task080-seed-real-data.sql:67`; việc của tôi là **tiếp nối**, không phải «phát hiện lại».
4. ⭐ **Ghi rõ ranh giới**: bù dữ liệu để test được ≠ đã có tính năng. Tài liệu phải nói thẳng để user không tưởng nhầm.

---

## ⑧ BLOCKER / CHỜ USER

⛔ **Chưa commit** (`AUTO_COMMIT = FALSE`, `AUTO_PUSH = FALSE`).
⛔ **Cần user quyết:**
1. `flyway_schema_history` vẫn ghi tới **V34** trong khi **V35 + V37** đã áp tay ⇒ nên để Flyway tự ghi khi khởi động lại app.
2. **Lỗ hổng «không thêm được thành viên tổ đội»** — có muốn mở task xây tính năng này không (ngoài phạm vi GO-LIVE hiện tại)?
3. Xác nhận các thay đổi đã ghi vào MySQL thật + có commit hay không.
