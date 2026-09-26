# MT2-P12-07 — TOÀN VẸN ĐỊNH DANH NGƯỜI DÙNG (§13.3)

> **Yêu cầu nguồn** (`docs/dsh/MASTER_TASK_2.md:263`):
> «Một số user **chưa có mã** ⇒ audit **identity model** ⇒ bổ sung **User ID** và đảm bảo **khớp với ID
> trong Hồ sơ nhân sự** ⇒ ⛔ **không tạo hai identity khác nhau cho cùng một user**.»
>
> **Deliverable của task** (theo bảng chuẩn `MT2_PHASE_TASK_LIST.md`): *tài liệu + test*.
> ⇒ Tài liệu = **tệp này** · Test = **cổng kiểm tra chạy lại được** + **test hợp đồng bảo vệ chính cổng**.

---

## 1. VÌ SAO CẦN «CỔNG» THAY VÌ CHỈ ĐO MỘT LẦN

MT2-P12-05 đã **đo** identity model trên MySQL thật (kết quả: 0 vi phạm). Nhưng một phép đo trong log
**không bảo vệ** được sau này: ai đó sửa `users` bằng SQL tay, hoặc một migration mới làm mất chỉ mục
UNIQUE, thì «không tạo 2 identity cho 1 user» lại có thể vi phạm mà **không ai biết**.

⇒ Chuyển yêu cầu thành **cổng kiểm tra chạy lại được**: `tools/IdentityIntegrityCheck.java`.

---

## 2. CỔNG KIỂM TRA

**Chạy** (⛔ chỉ đọc — không `INSERT/UPDATE/DELETE/ALTER/DROP/TRUNCATE`):

```powershell
& 'C:\Users\PC\.jdks\openjdk-26.0.2.1\bin\java.exe' `
  -cp '<mysql-connector-j>\mysql-connector-j-9.2.0.jar' `
  'tools\IdentityIntegrityCheck.java'
# đổi CSDL: đặt VNTECH_DB_URL / VNTECH_DB_USER / VNTECH_DB_PASSWORD
```

**Mã thoát** (để dùng làm cổng chặn CI): `0` = sạch · `1` = **có vi phạm định danh**.

### 2.1. LỖI (exit 1) — vi phạm định danh

| # | Kiểm tra | Ý nghĩa |
|---|---|---|
| E1 | `hr_records LEFT JOIN users` → `u.id IS NULL` | Hồ sơ nhân sự trỏ tài khoản **không tồn tại** ⇒ mồ côi |
| E2 | `GROUP BY user_id HAVING COUNT(*)>1` | **1 user có nhiều hồ sơ** ⇒ 2 identity cho 1 người |
| E3 | `GROUP BY employee_code HAVING COUNT(*)>1` | **Trùng mã nhân viên** ⇒ mã không định danh được |
| E4 | `GROUP BY username HAVING COUNT(*)>1` | **Trùng tên đăng nhập** |

### 2.2. CẢNH BÁO (exit 0) — trạng thái dữ liệu đã biết, ⛔ KHÔNG tự sửa

| # | Kiểm tra | Vì sao là cảnh báo chứ không phải lỗi |
|---|---|---|
| W1 | Tài khoản chưa có **mã nhân viên** | Gán mã là **quyết định nghiệp vụ** ⇒ **BLK-06** |
| W2 | Tài khoản chưa có **cấp bậc hệ thống** | Cấp bậc suy ra từ chức danh ⇒ **BLK-02** |
| W3 | Tài khoản chưa có **hồ sơ nhân sự** | Tạo hồ sơ cần dữ liệu nhân sự thật ⇒ **BLK-06** |

⚠️ Cổng **cố ý không tự sửa** các mục W1–W3: tự gán mã/hồ sơ là **bịa dữ liệu nghiệp vụ** (§18/§14).

### 2.3. Xác nhận ràng buộc CSDL còn tồn tại

Cổng in ra 3 chỉ mục UNIQUE từ `information_schema.STATISTICS`. Nếu ai đó xoá chỉ mục ⇒ đầu ra mất
⇒ cổng báo động (đây là lớp bảo vệ **thứ hai**, sau kiểm thử hợp đồng):

- `users_employee_code_uidx` (`employee_code`)
- `users_username_uidx` (`username`)
- `hr_records_uidx_user_id` (`user_id`)

---

## 3. KẾT QUẢ CHẠY THẬT (22/09/2026 · MySQL `vntech_erp` · SAU migration V29)

```text
CSDL: MySQL · schema vntech_erp
✅ OK    Hồ sơ nhân sự trỏ user KHÔNG tồn tại (mồ côi)                 → 0
✅ OK    Một user có nhiều hồ sơ nhân sự                                → 0
✅ OK    Mã nhân viên bị TRÙNG giữa 2 tài khoản                        → 0
✅ OK    Tên đăng nhập bị TRÙNG                                        → 0
⚠️  CẢNH BÁO Tài khoản CHƯA có mã nhân viên (BLK-06)                 → 1  (testuser86661)
⚠️  CẢNH BÁO Tài khoản CHƯA có cấp bậc hệ thống (BLK-02)             → 2  (engineer.demo · ksda.demo)
⚠️  CẢNH BÁO Tài khoản CHƯA có hồ sơ nhân sự                          → 9
ℹ️  Tổng quan: users = 13 · hr_records = 4 · active_users = 13
ℹ️  Ràng buộc UNIQUE phải còn: hr_records_uidx_user_id · users_employee_code_uidx · users_username_uidx
KẾT QUẢ: lỗi=0 · cảnh báo=3 ⇒ ✅ sạch (exit 0)
```

---

## 4. TEST BẢO VỆ CHÍNH CỔNG

`tests/p12-07-identity-integrity-gate.test.mjs` — 5 ca:

1. **⛔ Cổng phải CHỈ ĐỌC** — bóc bỏ chú thích rồi chặn `INSERT/UPDATE/DELETE/ALTER/DROP/TRUNCATE`.
   *(Nếu cổng ghi được dữ liệu thì bản thân nó trở thành nguồn rủi ro mới cho identity.)*
2. **Đủ 4 dạng vi phạm** (E1–E4) — mất 1 kiểm tra ⇒ cổng không còn phủ hết §13.3.
3. **Phân biệt LỖI / CẢNH BÁO** — `System.exit(errors > 0 ? 1 : 0)`; W1–W3 phải là `warn(...)` chứ không phải `error(...)`; cổng không được tự gán mã/hồ sơ.
4. **Ràng buộc UNIQUE còn** trong `V1__baseline.sql` + cổng có kiểm `information_schema`.
5. **Tầng ứng dụng vẫn chặn** tạo user không mã (bảo vệ bản vá P12-05 khỏi bị lùi).

**Chạy:**

```powershell
node --import tsx --test tests/p12-07-identity-integrity-gate.test.mjs   # 5/5
```

---

## 5. PHÒNG NGỪA HỒI QUY (đã có trong quá trình làm)

| Mốc | Nội dung |
|---|---|
| P12-05 | Chặn `createUser` khi `employeeCode` rỗng ⇒ **không tạo mới** tài khoản thiếu mã |
| P12-05 | CSDL: `employee_code` NOT NULL + UNIQUE · `hr_records.user_id` NOT NULL + UNIQUE ⇒ **không tạo 2 identity** |
| P12-07 | Cổng kiểm tra + test bảo vệ ⇒ phát hiện hồi quy **trên dữ liệu thật** |

---

## 6. USER ĐÃ CHỐT (26/09/2026) — ⛔ không còn mục nào «chờ user»

| Mã | Nội dung | Số lượng | **Quyết định của user** | Trạng thái thi hành |
|---|---|---|---|---|
| **BLK-06** | Gán **mã nhân viên** cho tài khoản thiếu mã | 1 (`testuser86661`) | «thiếu mã thì insert vào, đây chỉ là dữ liệu test» | ✅ **XONG** — đã gán `SEC-866610`; **0/19** tài khoản thiếu mã. Nguyên nhân gốc đã vá trong code: `UserManagementUseCase.createUser` chặn `employeeCode` rỗng ⇒ sản phẩm ⛔ không tạo được tài khoản thiếu mã nữa |
| **BLK-06** | Tạo **hồ sơ nhân sự** cho tài khoản chưa có | 4/19 có `hr_records` | (cùng phán quyết «dữ liệu test — không quan trọng hóa») | 🔵 **BÁO CÁO, ⛔ KHÔNG tạo hồ sơ giả** — GOAL §14/§18 cấm bịa dữ liệu nghiệp vụ (họ tên, CCCD, ngày sinh). 6/15 tài khoản thiếu là fixture kiểm thử `sec_probe_*` |
| **BLK-02** | Gán **cấp bậc hệ thống** | 2 (`engineer.demo` · `ksda.demo`) | đề án **①A** (thêm cấp `pho_giam_doc` rank 35) | ✅ **XONG** — `V30` đã áp lên MySQL thật (5 → **6 cấp**); phạm vi xem/giao theo cấp đã có `WorkScopeService` + API `work_scope` + test 10 ca |
| **BLK-04** | Khóa liên kết văn bản pháp lý ↔ công văn | 1 | đề án **②A** (thêm cột khoá) | ✅ **XONG** — `V31` thêm `legal_documents.correspondence_id` (Flyway đã chạy thật `success=1`) + 4 tầng code + test `P10-05` |
| **BLK-05** | User thường có thấy mã vật tư gốc **đã ngừng** không | 1 | «**Cho phép** user thường nhìn thấy» | ✅ **XONG** — bỏ lọc `m.active=1` ở payload `materials` (Java + JS parity), **giữ** cột `active`; **đã chứng minh bằng USER THƯỜNG** `nvdademo` thấy mã `active=0` |
| **BLK-03** | Module RBAC cho 3 action tổ đội (`site_command` vs `teams`) | 3 action | «**Đóng**» | ✅ **ĐÓNG** — xem §6.1 bên dưới (đo lại thực tế, ⛔ không tự đổi quyền) |

### 6.1 BLK-03 — ĐÓNG THEO QUYẾT ĐỊNH USER (đo lại 26/09/2026, ⛔ không suy đoán)

**Nguyên văn quyết định:** `BLK-3: Đóng`.

**ĐO LẠI (khác hồ sơ cũ ở 1 điểm — ghi rõ để không lặp lại số cũ):**

| Action | `ActionRbacRegistry` hiện tại | Ghi chú |
|---|---|---|
| `create_project_team` | `List.of("site_command")` (L88) | ✅ **ĐÃ ĐƯỢC VÁ** (hồ sơ cũ ghi `List.of()`) ⇒ test `tests/tm04-team-crud.test.mjs` nay **5/5 PASS** (trước 4/5) |
| `delete_project_team` | `List.of()` (L125) | ⚠️ vẫn rỗng |
| `set_project_team_status` | `List.of()` (L264) | ⚠️ vẫn rỗng |

**BẰNG CHỨNG ĐO THẬT QUA API** (dùng `teamId` KHÔNG tồn tại ⇒ ⛔ không đụng dữ liệu):

```text
set_project_team_status  · CHT cha.ht (commander) ⇒ HTTP 403 «Thao tác chưa được khai báo quyền trong hệ thống»
set_project_team_status  · admin                ⇒ HTTP 400 «Không tìm thấy tổ đội» (⇒ RBAC cho qua: admin được miễn)
delete_project_team      · CHT cha.ht           ⇒ HTTP 403 «Thao tác chưa được khai báo quyền trong hệ thống»
delete_project_team      · admin                ⇒ HTTP 400 «Không tìm thấy tổ đội»
create_project_team      · CHT cha.ht           ⇒ HTTP 403 «CHT chỉ được tạo tổ đội trong dự án được phân quyền»  ← lỗi ĐÚNG NGHIỆP VỤ, ⛔ không còn là «cổng trắng»
```

**Hệ quả trung thực (⛔ không tô hồng):** 2 action `delete_project_team` / `set_project_team_status` bị chặn ở **tầng registry** cho **mọi tài khoản không phải admin** (admin được miễn nên đi tiếp tới use-case). Trong khi **UI đã khai báo** `module: "site_command"` + `capability: "canUse"` cho **cả 3** action (`app/screens/TeamDirectory.tsx:72-76`) và nút hiện theo `gates.canStop/canDelete = allow("canUse")` ⇒ nếu một tài khoản có `site_command.canUse=1` thì **thấy nút nhưng bị 403** (vi phạm nguyên tắc §17 «UI ⛔ không được hứa điều backend từ chối»).

**VÌ SAO ⛔ KHÔNG TỰ SỬA:** chọn module gác action là **QUYẾT ĐỊNH QUYỀN HẠN** (§13/§21) — user đã chốt «Đóng» ⇒ tôn trọng quyết định, ⛔ không tự đổi RBAC. Ghi lại đúng thực tế + cách sửa 1 dòng nếu sau này user muốn: đổi 2 dòng `List.of()` → `List.of("site_command")` cho khớp ý định đã khai báo ở UI và ở action anh em `create_project_team`.

---

## 7. KẾT LUẬN

- ✅ **4 dạng vi phạm định danh = 0** trên CSDL thật (sau V29).
- ✅ **3 ràng buộc UNIQUE** còn nguyên ⇒ cấu trúc CSDL tự chặn identity trùng.
- ✅ **Cổng kiểm tra chạy lại được** (exit 0/1) + **test hợp đồng 5/5** bảo vệ cổng.
- ⚠️ Trạng thái dữ liệu W1–W3 là **việc nghiệp vụ**, chờ **BLK-02 / BLK-06**.
- ⛔ Không commit · không push.
