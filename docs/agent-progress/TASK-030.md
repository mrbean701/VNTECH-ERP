# TASK-030 — 43 ca bị chặn ở tầng MODULE: thiếu dữ liệu hay hành vi đúng?

**Trạng thái:** DONE · **Ngày:** 18/09/2026 · **Commit:** #36
**Kết luận: ĐÚNG DỮ LIỆU — KHÔNG phải lỗi mã Java.**
**Công cụ:** `tools/probe-module-permission-data.mjs` (đọc chính payload `bootstrap` mà UI dùng)

---

## 1. Vì sao không cần mở rộng sandbox

Payload `bootstrap` (GET `/api/system`) mà **chính giao diện tải về** đã chứa sẵn nội dung các bảng quyền:
`allModulePermissions`, `moduleCatalog`, `staffDirectory`, `userWarehouseScopes`, `departmentModulePermissions`.
Đọc từ đây vừa ít rủi ro hơn `spawn mysql`, vừa đúng đường chạy thật.

## 2. Dữ liệu đo được

| Chỉ số | Giá trị |
|---|---|
| Tổng dòng `user_module_permissions` | **484** |
| Nếu đầy đủ (61 module × 12 người dùng) | 732 |
| Tổng dòng `user_warehouse_scopes` | **0** |
| Tổng dòng `department_module_permissions` | 51 |

Số dòng theo người dùng (một số ví dụ): `kh_nv` 30 · `kh_truong` 30 · `Người dùng kiểm chứng` 30 ·
`cht` 18 · `thu_kho` 18 · `da_nv` 17 · `da_truong` 17 · `thuky` 15 · `accountant` 9.

## 3. Đối chiếu module JS yêu cầu với dữ liệu

| Module JS yêu cầu | Số action cần | Có dòng quyền nào trong hệ thống? |
|---|---|---|
| `stocktake` | 4 | ❌ **0 dòng** |
| `inventory` | 3 | ❌ **0 dòng** |
| `teams` | 3 | ❌ **0 dòng** |
| `warehouse_issue` | 1 | ❌ **0 dòng** |
| `boq` | 1 | ❌ **0 dòng** |
| `purchasing` | 2 | ✅ có dòng (nhưng `da_nv` có `use=0`) |
| `requests` | 2 | ✅ có dòng (`use=1` cho ksda/da_nv/da_truong) |
| `receiving` | 1 | ✅ có dòng |
| `warehouse_receipt` | 1 | ✅ có dòng |

## 4. Kết luận

**5/9 module mà JS yêu cầu có ZERO dòng quyền trong toàn hệ thống.** JS `canUseModule` đọc **chỉ**
từ `user_module_permissions` (`department_module_permissions` là bảng riêng, `canUseModule` **không** dùng),
nên **JS cũng chặn y hệt** Java cho các action cần 5 module đó.

⇒ 43 ca bị chặn ở tầng module là **hành vi đúng theo dữ liệu**, **KHÔNG phải sai lệch mã nguồn**.
Đây là **lỗ hổng dữ liệu/cấu hình**: bảng quyền module chưa được nạp đủ.

**Kiểm chứng chéo làm sáng tỏ thêm:** tài khoản `Kỹ sư dự án (đề nghị mua)/ksda` **có**
`requests view=1 use=1 create=1` — đúng như đo được ở TASK-027: sau khi vá lỗi `roleBase()`,
`create_request` **vượt qua** tầng module và chỉ dừng ở tầng phạm vi. Hai phép đo khớp nhau.

**Ghi nhận trung thực:** con số "484 quyền" từng xuất hiện trong `probe-live-stack` trước đây —
nay đã truy được ý nghĩa chính xác: đó là **số dòng của `user_module_permissions`**, không phải
"số quyền đã cấu hình đầy đủ".

## 5. Hệ quả cần xử lý (không thuộc TASK-030)

Việc nạp đủ `user_module_permissions` là **thao tác dữ liệu/cấu hình của quản trị viên**, không phải
sửa mã. Cần người dùng quyết định:
- (a) Chạy lại cơ chế cấp quyền mặc định theo phòng ban (JS `replaceDepartmentDefaults`) cho các tài khoản;
- (b) hay cấu hình thủ công qua màn "Phân quyền người dùng";
- (c) hay giữ nguyên (chỉ admin dùng được các nghiệp vụ kho/đội thi công).

**KHÔNG tự ý sửa dữ liệu** — đây là dữ liệu nghiệp vụ thật (§16, §45).

## 6. Liên quan tới TASK-029

6 trong số các action bị chặn (`save_team_subcontract`, `save_team_production`, `approve_team_production`,
`save_team_payment`, `settle_team_subcontract`, `create_project_team`) thuộc nhóm **Java CHẶT HƠN JS**
(TASK-029): JS **không kiểm module nào** cho chúng, còn Java bắt buộc module `teams` / `site_command`.
Vì `teams` có **0 dòng**, Java thực tế **chỉ admin** làm được, trong khi JS cho phép theo vai trò.
⇒ Đây là tác động nghiệp vụ định lượng được của TASK-029.
