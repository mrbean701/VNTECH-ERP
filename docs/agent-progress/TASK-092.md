# TASK-092 — LÔ QUYẾT ĐỊNH CỦA NGƯỜI DÙNG Q1–Q5 (D5 · isCompanyLeadership · nhập vật tư 409 · can_create · tên vai trò)

- **Ngày:** 18/09/2026 · **Trạng thái:** Q1–Q5 **XONG** (Q4 đã kiểm chứng có ý nghĩa) · Q7–Q10 đang chờ làm tiếp
- **Nguồn:** người dùng trả lời 9 việc chờ duyệt qua Telegram (danh sách em gửi kèm SỐ ĐO LẠI trên CSDL).
- **Bản chạy:** `VNTECH-FP-E18ECD44A46D2229` → **`VNTECH-FP-9CF9D595E2037FF3`**

| # | Người dùng quyết | Kết quả đo được |
|---|---|---|
| **Q1** | (1) cho chạy SQL D5 | ✅ xoá **5** dòng `user_project_scopes` mồ côi · cấp **1** dòng `write` cho `thukydemo` ở PRJ-DEMO-01 ⇒ `create_request` chạy được · **probe TASK-049 5/5 ĐẠT** (tạo phiếu thật + dọn sạch + đối chứng dương) |
| **Q2** | (b) giữ Java, sửa JS | ✅ JS phản chiếu **2 khái niệm** của Java ⇒ **`probe-task024-leadership-parity.mjs` 7/7 ĐẠT** · `kttdemo` +quyền · `thukydemo` −quyền (đúng Java) |
| **Q3** | (b) sửa UI gửi id | ⚠️ **GHI CHÚ CŨ SAI** — gốc thật là **lỗi Java 409** (xem §2) ⇒ đã vá Java ⇒ **probe 4/17 → 17/17 ĐẠT** |
| **Q4** | cấp cho phòng ban | ✅ cấp **405 dòng** (`can_create=1`: 42 → **447**) · giữ `0` ở `dashboard`/`reports`/`approvals`/`material_catalog` · **có file hoàn tác** · ✅ **có ý nghĩa: 29 action gắn capability `canCreate`** |
| **Q5** | (b) đổi CSDL về tên ngắn | ✅ MySQL + SQLite = *"Thư ký Tổng giám đốc"* · migration **`0139`** (idempotent) · **`test:regression` 60/61 → 61/61 — HẾT TEST ĐỎ** |

## 1. Q5 — TÊN VAI TRÒ `thuky`: vì sao test đỏ
Chuỗi migration **tự mâu thuẫn**: `drizzle/0045:90` đặt tên NGẮN *"Thư ký Tổng giám đốc"* (kèm chú thích *"không đồng nhất với Trưởng phòng Hành chính Pháp chế"*), rồi `drizzle/0079:23` đổi về tên DÀI. Test `runtime-admin-boq-regression.test.mjs:78` giữ kỳ vọng tên ngắn ⇒ đỏ.
**Đã làm:** migration mới **`0139_phase1_role_thuky_short_name.sql`** (idempotent, chỉ đổi `name`, giữ `code`/`description`/`ORB-BGD`) + áp vào MySQL và SQLite ⇒ 61/61.

## 2. Q3 — 🔴 LỖI THẬT: NHẬP DANH MỤC VẬT TƯ TRẢ 409 VÀ **KHÔNG GHI VẬT TƯ**
**Ghi chú cũ trong sổ SAI** (*"UI gửi `categoryCode`, Java đọc `categoryId`"*). Đo lại bằng probe có sẵn `probe-task040-nhom3b.mjs` (đã dọn rác trước khi đo): **4/17 ĐẠT**, thao tác nhập trả **HTTP 409**.
**Chuỗi sự việc suy ra từ số đo:** nhóm được **TẠO** (6→7) → nhóm con **KHÔNG** được tạo (8, không phải 9) → vật tư **KHÔNG** có trong danh mục. ⇒ lỗi nằm ở bước tạo **nhóm con**, và cả lô nằm trong 1 transaction nên chỉ nhóm "sót lại".
**So câu SQL hai phía ⇒ tìm ra gốc:**
* JS `system-route.mjs:2604` (luồng NHẬP) ghi **9 cột**: `id,category_id,code,name,description,sort_order,active,created_at,updated_at` ⇒ cột `review_status` nhận **giá trị mặc định của CSDL = `'approved'`**.
* Java gọi hàm dùng chung `insertSubcategory` (**12 cột**, phục vụ MÀN nhóm con) và truyền **`null`** cho `review_status` — cột này **NOT NULL DEFAULT 'approved'** ⇒ `DataIntegrityViolationException` ⇒ **409**.
**Đã vá:** truyền `"approved"` (giá trị lưu **giống hệt JS**) + chú thích ghi rõ gốc, tại `MaterialCatalogManagementUseCase.java`; dựng lại jar (**mvn package EXIT 0**) và khởi động lại Java `:18081` (**200**).
**Kiểm chứng lại 17/17 ĐẠT**, gồm: vật tư **CÓ `category_id` + `subcategory_id`** · nhóm con tự tạo · `system='DIEN'` theo tiền tố · `brand` + `min_stock` ghi được · **nhập lại = CẬP NHẬT** (không tạo trùng) · 2 nhánh chặn đúng **nguyên văn**.
**Dọn sạch dữ liệu probe:** nền về đúng **14 vật tư / 6 nhóm / 8 nhóm con**; rác `ZZPROBE%` = **0/0/0**.

## 3. Q2 — `isCompanyLeadership`: JS phản chiếu ĐÚNG **HAI** khái niệm của Java
Đo trong mã nguồn: Java dùng **hai** định nghĩa khác nhau, JS trước đây chỉ có **một** ⇒ lệch **cả hai chiều**:

| Khái niệm | Java | Dùng cho |
|---|---|---|
| Cổng quyền hành động | `RbacService.isCompanyLeadership` = `{director, accountant}` | `requireActionModule` bỏ qua kiểm module |
| Bộ lọc bootstrap | `BootstrapDataAdapter.isCompanyLeadership` = **7 mã** + `base_role='director'` | lọc dữ liệu bootstrap (đã khớp JS từ TASK-050) |

⇒ JS nay có **`COMPANY_LEADERSHIP_ACTION_CODES = {director, accountant}`** + `isCompanyLeadershipActionGate()` dùng ở **2 chỗ** (`defaultDepartmentPermission`, `canUseModule`), **giữ nguyên** `isCompanyLeadership()` (7 mã + base) cho nhánh bootstrap.
**Tài khoản đổi quyền (đo trên 12 tài khoản thật):** `kttdemo` (accountant) **+quyền** · `thukydemo` (thuky, base=director) **−quyền** — đúng như Java (đường đang phục vụ `:9000`). **Cổng `probe-task024-leadership-parity.mjs` 7/7 ĐẠT** (đọc tập mã từ 3 tệp nguồn, không chép tay; có đối chứng dương).

## 4. Q4 — CẤP `can_create` CHO PHÒNG BAN (và kiểm chứng nó CÓ TÁC DỤNG)
* **Quy tắc suy từ MẪU ĐANG CHẠY** (không tự đặt): 42 dòng đã có `can_create=1` đều là *module của chính phòng đó* (KH→`dept_plan_*` · DA→`dept_project_*` · TCKT→`dept_finance_*` · HCPC→`dept_legal_*`) + vài module liên thông.
* Cấp cho **mọi dòng `can_use=1`** trên module nghiệp vụ; **LOẠI TRỪ 4 module**: `dashboard` · `reports` · `approvals` (đã có `can_approve`, 186 dòng) · `material_catalog` (dữ liệu gốc, luồng nhập yêu cầu **admin**).
* Kết quả: **405 dòng** được cấp ⇒ `can_create=1`: **42 → 447**; còn `0`: **33** dòng (31 thuộc 4 module loại trừ + 2 dòng `can_use=0`).
* **Hoàn tác:** `docs/agent-progress/TASK-092-q4-rollback.sql` (danh sách 405 id, sinh **TRƯỚC** khi ghi).
* ✅ **Kiểm chứng CÓ Ý NGHĨA:** `ActionRbacRegistry` có **186** ánh xạ action→capability, trong đó **29 action gắn `canCreate`** (`create_request` · `create_po` · `issue_stock` · `receive_goods` · `save_production_report` · `save_payment_plan` · `save_capital_recovery` · `save_contract_payment` · `save_correspondence` · `save_hr_record` · `save_labor_contract` · `save_legal_document` · …) ⇒ cấp quyền này **thực sự mở 29 hành động tạo** cho phòng ban, không phải dữ liệu chết.
* **Ghi chú:** SQLite `department_module_permissions` = **0 dòng** ⇒ dữ liệu quyền phòng ban chỉ có ở MySQL (đường Java); Node chỉ đọc nếu có.

## 5. Q1 — D5: dữ liệu chặn luồng lập phiếu
* **Trước:** 5 dòng `user_project_scopes` mồ côi (3 dòng `admin` + 2 dòng `read`) trỏ tới project id HỎNG `PRJ_fdbfab20-…-0000-000000000000`, trong đó **1 dòng có `user_id = NULL`**; `thukydemo` (Owner bước 2, role `thuky`) **không có phạm vi** ở PRJ-DEMO-01 ⇒ `create_request` trả **400** (2 phép kiểm Owner là thật, JS cũng chặn y hệt).
* **Đã làm:** xoá 5 dòng mồ côi + cấp 1 dòng **`write`** cho `thukydemo` ⇒ dòng mồ côi **5 → 0**.
* **Kiểm chứng:** `probe-task049-owner-checks.mjs` **5/5 ĐẠT** — probe **tạo phiếu thật rồi dọn sạch** và khôi phục **đúng số dòng ban đầu của 11 bảng** (kể cả `user_project_scopes`, `approval_project_assignments`).

## 6. ⚠️ LỖI CỦA CHÍNH TÔI TRONG LÔ NÀY (ghi lại)
**Lượt INSERT phạm vi ĐẦU TIÊN thiếu cột `id`** (NOT NULL, không default) ⇒ MySQL báo lỗi, **nhưng script vẫn in "đã cấp 1 dòng phạm vi"** vì **không đọc lại kiểm chứng**, và stderr còn bị che bởi `2>$null` ở tầng gọi ⇒ **KHẲNG ĐỊNH SAI**.
**Đã sửa:** sinh `id` tường minh + **BẮT BUỘC đọc lại xác nhận** trước khi báo thành công (đúng nguyên tắc *"không báo Done nếu chưa test"*). **Bài học:** mọi script ghi dữ liệu phải **đọc lại sau khi ghi**; đừng che stderr khi thao tác ghi.

## 7. Kiểm chứng cuối lô
| Phép kiểm | Kết quả |
|---|---|
| `test:regression` | **61/61 — 0 ĐỎ** (lần đầu trong phiên) |
| `probe-task049-owner-checks.mjs` | 5/5 ĐẠT |
| `probe-task024-leadership-parity.mjs` | 7/7 ĐẠT |
| `probe-task040-nhom3b.mjs` | **17/17 ĐẠT** (trước: 4/17) |
| `mvn -DskipTests package` | **EXIT 0** · jar mới · Java `:18081` **200** |
| `npm run build` | **EXIT 0** + BUILT ARTIFACT VALIDATION **ĐẠT** |
| Dịch vụ | UI `:8787` **200** · proxy `:9000` **200** · Java **200** |
| Định danh | **`VNTECH-FP-9CF9D595E2037FF3`** (MySQL + SQLite + manifest) |
| Dữ liệu probe | dọn sạch: vật tư **14** / nhóm **6** / nhóm con **8** · rác `ZZPROBE%` = 0 |

## 8. Việc kế tiếp (còn 4 việc trong 9 quyết định)
[Q10] khảo sát lại `materials.system` lệch 5/14 mã → [Q9] chỉnh `payment_plans` quá hạn 1,50 tỷ → [Q7] tự khảo sát 2 nút thật để phủ cổng ảnh → **[Q8] đơn giá trong danh mục vật tư gốc → PO lấy giá từ đó + luồng hỏi duyệt khi sửa giá (việc lớn nhất: đụng lược đồ 2 CSDL + Java + UI + luồng phê duyệt)** → sau đó quay lại `U-14`.
