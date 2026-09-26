# TASK-049 — 2 phép kiểm OWNER của bước duyệt: **DONE (#92)** — kèm phát hiện: luồng lập phiếu của PRJ-DEMO-01 bị **CHẶN BỞI DỮ LIỆU**

**Trạng thái:** **DONE (đã port + kiểm chứng 10/10)** · hệ quả dữ liệu ⇒ **D5 trở thành mục CHẶN**
**Ngày:** 17/09/2026 · **Commit:** #83 (hồ sơ) · **#92 (port + kiểm chứng)**

---

## 1. Đã port (nguyên văn JS `requireWorkflowAssignment`, `system-route.mjs:442-452`)

| # | Điều kiện JS | Trước #92 ở Java | Sau #92 |
|---|---|---|---|
| 1 | có phân công cho (dự án, bước) + `apa.active=1` | ✔ | ✔ |
| 2 | `ownerActive === 1` | ✔ | ✔ |
| 3 | **vai trò Owner ∈ `allowedRoleCodes` của bước** — so **cả** `users.role` **và** `rc.base_role` (`:446-447`) | ✘ **KHÔNG KIỂM** | ✔ (dùng lại `store.findUserRoleInfo`, không thêm truy vấn) |
| 4 | **Owner phải có `user_project_scopes`** cho dự án, `permission IN ('read','write','approve','admin')`, **trừ khi chính Owner là `admin`** (`:448-450`) | ✘ **KHÔNG KIỂM** | ✔ (`RequestStore.ownerHasProjectScope`, SQL nguyên văn) |

Thông điệp lỗi **nguyên văn JS**: *"Owner {ownerName} không thuộc vai trò được phép của Bước {stageNo} – {stageName}."* và *"Owner {ownerName} chưa được phân quyền dự án này."*
**Đã xác nhận JS `:966` GỌI hàm này cho MỌI bước** trong `create_request` — nên đây thực sự là một phép kiểm mà bản Java đang **âm thầm bỏ qua**, không phải "tính năng thêm".

## 2. Kiểm chứng lúc chạy — `tools/probe-task049-owner-checks.mjs` **10/10 ĐẠT**

| Nhánh | Cách dựng | Kết quả đo được |
|---|---|---|
| **Sai vai trò** | fixture: đổi Owner bước 1 sang tài khoản khác vai trò | **HTTP 400** · *"Owner Kỹ sư hiện trường (lập phiếu) không thuộc vai trò được phép của Bước 1 – CHT xác nhận nhu cầu."* · **không tạo phiếu** · khôi phục phân công ✔ |
| **Thiếu phạm vi dự án — DỮ LIỆU THẬT, không cần fixture** | không đổi gì: Owner **bước 2** (`thukydemo`) **không có** phạm vi cho PRJ-DEMO-01 | **HTTP 400** · *"Owner Thư ký TGĐ D chưa được phân quyền dự án này."* · **không tạo phiếu** ✔ |
| **Nhánh ĐẠT** | fixture: cấp 1 dòng `user_project_scopes` cho Owner thiếu | **HTTP 200** + phiếu được ghi thật (`DNMH-PRJ-DEMO-01-2026-0051`) rồi dọn sạch ✔ |
| **Khôi phục** | — | mọi bảng về **đúng** số dòng ban đầu (`user_project_scopes` **18**, `approval_project_assignments` **5**) ✔ |

**Đối chứng dương (nói rõ):** trên jar 19:00 (trước #92), **cùng lời gọi đó trả 200 và tạo phiếu thật** — probe TASK-048 (18/18) và TASK-054 (20/20) đều tạo phiếu cho PRJ-DEMO-01 thành công. Vậy 400 hôm nay là **hệ quả của 2 phép kiểm vừa thêm**, không phải lỗi môi trường.

## 3. ⚠️ PHÁT HIỆN: luồng lập phiếu của PRJ-DEMO-01 nay bị **CHẶN BỞI DỮ LIỆU**

* **Triệu chứng:** `create_request` cho PRJ-DEMO-01 trả **400** *"Owner Thư ký TGĐ D chưa được phân quyền dự án này."* ⇒ **không lập được phiếu đề nghị mua** cho dự án này.
* **Nguyên nhân gốc:** dòng `user_project_scopes` của `thukydemo` trỏ tới **project KHÔNG TỒN TẠI** `PRJ_fdbfab20-bf1f-0000-0000-000000000000` ⇒ tài khoản **không có phạm vi** cho PRJ-DEMO-01, trong khi họ đang là **Owner bước 2**. (Cùng gốc với **known issue #51 / D5** — cũng chính là lý do `data.projects = []` với tài khoản này.)
* **Không phải lỗi của bản port:** JS `:966` gọi `requireWorkflowAssignment` cho mọi bước ⇒ **bản JS cũng chặn y hệt**. Bản Java trước đây đang **bỏ qua** phép kiểm, tức nó *cho phép lập phiếu trong khi cấu hình phân công sai*.
* **Cách xử lý (1 dòng, cần người dùng đồng ý — KHÔNG tự sửa dữ liệu):** cấp phạm vi cho Owner bước 2:
  ```sql
  INSERT INTO user_project_scopes (id,user_id,project_id,permission,created_at,updated_at,joined_at)
  VALUES ('SCOPE_fix_d5_thukydemo', '<id của thukydemo>', 'PRJ_fdbfab20-bf1f-4ad5-8159-7dcc582140c3',
          'read', NOW(3), NOW(3), NOW(3));
  ```
  (hoặc dùng giao diện **Quản trị → Phân quyền người dùng** để gán phạm vi dự án — đúng cách nghiệp vụ hơn.)
  **Đồng thời nên dọn 5 dòng phạm vi mồ côi** (D5) để không lặp lại.

## 4. `merge_material_master` — **KHÔNG làm ở lượt này**, đã ghi thành quyết định **D7**
JS **xoá** mã nguồn (`DELETE FROM materials WHERE id=?`, `:2670`) sau khi chuyển alias/mã ngoài/lịch sử đổi mã sang mã đích; Java chỉ `active=0` + đổi mã thành `<code>_X`. Đây là **quy tắc nghiệp vụ** (có xoá hay lưu trữ mã trùng?) ⇒ cần người dùng chốt, không tự chọn. Xem **D7** ở `MASTER_STATUS.md`.

## 5. Giới hạn của phép đo
* Probe chỉ dựng được nhánh "**THÊM** dòng phạm vi"; nhánh `permission='none'` và nhánh "không có dòng nào" cho **cùng kết quả** (câu SQL dùng `permission IN ('read','write','approve','admin')`) nên không cần dựng riêng.
* Đã phải cập nhật **2 probe cũ** (TASK-048, TASK-054) vì chúng tạo phiếu thật: nay chúng **tự cấp TẠM** phạm vi còn thiếu rồi **xoá lại** (số dòng `user_project_scopes` được đưa vào bảng đối chiếu nên phần fixture được kiểm luôn). Sau cập nhật: **18/18** và **20/20**.
* **Lỗi của chính tôi ở lượt này:** lượt chạy probe đầu tiên cho **5/5** nhưng **bỏ qua oan 2 nhánh** vì `mysql --batch --raw` in `NULL` thành **chuỗi `"NULL"`**, không phải chuỗi rỗng — dữ liệu thật đang vi phạm mà phép kiểm lại không chạy. Đã sửa (`isMissing`) và chạy lại ⇒ **10/10**.
