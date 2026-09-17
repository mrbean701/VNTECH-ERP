# TASK-080 — KHÔNG HARDCODE: nạp **dữ liệu thật** còn thiếu để test được luồng

**Trạng thái:** 🔄 IN PROGRESS (đợt 1 xong: **quyền phòng ban + quyền người dùng + tổ đội**)
**Ngày:** 17/09/2026 · **Nhánh:** `unity`
**Chỉ thị người dùng (17/09/2026):** *"Từ giờ không hardcode nữa chỉ sử dụng dữ liệu thật, nếu chưa có thì hãy insert đầy đủ để có căn cứ cho việc test luồng và mô phỏng hoạt động thực tế."*

---

## 1. Kiểm kê dữ liệu thật (TRƯỚC khi sửa) — đo bằng SQL, không phỏng đoán

| Hạng mục | Trước | Ý nghĩa |
|---|---|---|
| `department_module_permissions` | **51 dòng** (DA 16 · KH 16 · TCKT 8 · HCPC 6 · BCH 4 · VNTECH 1 · **BGD 0** · **VNTECH-01 0**) | nguồn để hệ thống sinh quyền người dùng |
| **Module có 0 dòng quyền phòng ban** | **22/61** (`boq` · `payments` · `reports` · `teams` · `stocktake` · `inventory` · `warehouse_issue` · `central_warehouse` · `construction` · `production` · `project_progress` · `material_norms` · `delivered` · `site_command` · `capital_recovery` · `dept_legal_*` ×6) | **ngoài admin không ai mở được** (đúng lớp lỗi §6 của audit) |
| `user_module_permissions` | 484 dòng · phủ **39** module | 22 module không có quyền cho bất kỳ ai |
| `team_members` | **0 dòng** | luồng tổ đội không chạy |
| `teams.leader_user_id` | **NULL** | tổ đội không có tổ trưởng |
| `role_catalog.default_organization_unit_id` | **NULL cho 16/16 vai trò** | cơ chế "đơn vị mặc định theo vai trò" chết |
| `work_items` · `email_outbox` · `capital_recovery_records` · `production_reports` | **0** | màn Công việc · Hộp thư gửi · Thu hồi vốn · Sản lượng trống |
| `attachments` | 1 dòng **mồ côi** (chứng từ có PO không tồn tại) + 11 tệp rời trong kho | ảnh thật không tải được |

**Sao lưu trước khi sửa:** `tools/_backup-permissions-truoc-TASK080.txt` (2 bảng quyền · 97,5 KB).

## 2. Đã nạp (đợt 1) — bằng **cơ chế CHUẨN của sản phẩm**, không tự chế

| Việc | Cách làm | Kết quả |
|---|---|---|
| Ma trận quyền phòng ban | `INSERT … SELECT` chỉ cho cặp **(đơn vị × module) CHƯA có**, mức `view+use+export` (BGD thêm `approve`) | **51 → 480 dòng**; **0 module nào còn trống** (ngoài `admin` — cố ý) |
| Quyền người dùng | gọi action **`rebuild_department_permissions`** (chỉ admin) — *"Đã đồng bộ lại quyền mặc định phòng ban cho **11 tài khoản**"* | **484 → 926 dòng**; phủ **39 → 60/60** module |
| Tổ trưởng tổ đội | gán tài khoản BCH thật (`cha.ht`) | tổ đội có tổ trưởng |
| Thành viên tổ đội | thêm **4 tài khoản thật**, `role_in_team` lấy từ `role_catalog.name` | `team_members` **0 → 4** |

**Không tự đặt chữ hiển thị mới:** mọi nhãn lấy từ `role_catalog` / `module_catalog` / `organization_units` có sẵn.

## 3. Kiểm chứng (bằng số, có ĐỐI CHIẾU ngược)

| Phép kiểm | Kết quả |
|---|---|
| So **từng tài khoản** trước (bản sao lưu) ↔ sau | **TĂNG 11 · GIẢM 0 · bằng 1** (admin) ⇒ **không ai bị mất quyền** |
| Tổng dòng `user_module_permissions` | **484 → 926** |
| Số module khác nhau được cấp | **39 → 60/60** |
| Module còn 0 dòng quyền | **chỉ `admin`** (đúng thiết kế: chức năng quản trị chỉ cho tài khoản admin) |
| `teams` / `team_members` qua API | cổng `tools/probe-task073-team-members.mjs` đọc thấy **mức nền 4 dòng thật** và vẫn ĐẠT với fixture |

### 3.1 ⚠️ Một hồi quy tôi TỰ PHÁT HIỆN rồi tự vá (ghi lại đầy đủ)
Lần đồng bộ **đầu tiên** làm tài khoản `thukydemo` (Thư ký TGĐ, đơn vị `VNTECH`) có **15 quyền** —
vì ma trận của đơn vị `VNTECH` chỉ có **1 module**. Nếu dừng ở đó thì **tài khoản lãnh đạo bị khoá gần hết**.
**Đã vá:** bổ sung ma trận đủ **60 module** cho `VNTECH` + `VNTECH-01` (vai trò công ty/lãnh đạo có `approve`)
rồi chạy lại đồng bộ. **Đối chiếu ngược với bản sao lưu xác nhận: `thukydemo` vốn đã 15 trước khi tôi sửa**
⇒ nghi ngờ "giảm quyền" của tôi là **SAI**, và nay anh ta có **60** ✓.

## 4. Quy tắc rút ra (áp cho các phiên sau)

1. **Dữ liệu thật trước, hardcode sau cùng** — mọi màn phải đọc từ DB/API; thiếu dữ liệu thì **nạp**, không bịa trong mã.
2. **Nạp bằng cơ chế của sản phẩm** (`department_module_permissions` + `rebuild_department_permissions`,
   `save_department_permission`…) thay vì INSERT thô vào bảng dẫn xuất — hệ thống tự đồng bộ và tự kiểm luật.
3. **Luôn sao lưu + đối chiếu ngược** trước/sau khi sửa dữ liệu quyền: phép so theo **từng tài khoản** mới
   phát hiện được việc **âm thầm giảm quyền**.
4. Đơn vị **CÔNG TY** (`VNTECH`) và **Ban giám đốc** (`BGD`) phải có ma trận — nếu bỏ trống thì tài khoản
   lãnh đạo **mất quyền** sau mỗi lần đồng bộ.

## 5. Còn lại (đợt sau)

* `role_catalog.default_organization_unit_id` = NULL cho **16/16** vai trò (TASK-032) — cần ánh xạ vai trò → đơn vị.
* `work_items` = 0 · `email_outbox` = 0 · `capital_recovery_records` = 0 · `production_reports` = 0.
* 1 dòng `attachments` mồ côi + 11 tệp rời trong kho.
* **Rà hardcode trong mã**: các chỗ còn hiện giá trị cố định thay vì dữ liệu (vd `Quá hạn <b>{moneyBillion(0)}</b>`
  ở màn thanh toán, `▧ {…?2:0}` số chứng chỉ ở màn Đã giao, `StatusBadge value="Đã nhập kho"` cố định).

## 6. Tệp thay đổi

| Tệp | Nội dung |
|---|---|
| `tools/task080-seed-real-data.sql` | **MỚI** — toàn bộ SQL đã chạy (ma trận quyền + tổ đội), kèm vì-sao và kết quả đo |
| `tools/_backup-permissions-truoc-TASK080.txt` | **MỚI** — sao lưu 2 bảng quyền trước khi sửa |
| `docs/agent-progress/TASK-080.md` | hồ sơ này |
