# TASK-050 — 4 KHOÁ BOOTSTRAP THIẾU + BỘ LỌC QUYỀN: **DONE (#85)**

**Trạng thái:** **DONE — đã port, đã kiểm chứng lúc chạy 87/87.** Commit **#85**.
**Nguồn:** cổng `tools/probe-bootstrap-keys.mjs` (#77) → xác nhận lần lượt ở #78, #79, #80
**Ngày:** 17/09/2026

---

## 1. Kết quả cuối (đo được, không suy đoán)

| Hạng mục | Trước | Sau |
|---|---|---|
| Cổng tĩnh `probe-bootstrap-keys.mjs` | **4 khoá thiếu** (`centralInventory`, `centralReturns`, `companyAvailability`, `constructionDailyLogItems`) | **0 khoá dữ liệu thiếu** (còn `user` = dương tính giả đã kiểm từ trước) · Java khai **127** khoá (trước 123) |
| Cổng mới `probe-task050-bootstrap.mjs` | không tồn tại | **87/87 ĐẠT** (10 phép đo không thực hiện được — ghi rõ lý do) |
| `npm run test:regression` | 59/61 | **59/61** (2 đỏ đã phân loại: TASK-031 · TASK-032) |
| `probe-java-sql-live.mjs` | 8 phát hiện (đều nhóm 6 license) | **8 phát hiện** — **không phát sinh mới** cho 4 truy vấn vừa thêm |
| `probe-schema-drift.mjs` | 0 lệch | **0 lệch** |

### 1b. ĐÍNH CHÍNH mức ảnh hưởng (đo lại tầng UI, không suy đoán)

Đặc tả ban đầu nói "4 màn hình sẽ RỖNG". Đối chiếu `app/page.tsx:374-417` (khối `load()` chuẩn hoá dữ liệu) cho thấy **chính xác hơn**:

* `centralInventory`, `centralReturns`, `companyAvailability` **có** trong danh sách chuẩn hoá (`:393-395`) ⇒ khoá thiếu được ép về `[]`. `constructionDailyLogItems` **không** có trong danh sách đó, **nhưng** chỗ dùng nó là `(data.constructionDailyLogItems||[])` (`:2530`) ⇒ cũng không vỡ.
* ⇒ **Không có màn hình nào CRASH**; hậu quả là **bảng/danh sách rỗng hoặc cột hiện 0** — tức "lỗi âm thầm", đúng loại khó thấy nhất.
* **Ảnh hưởng THẬT trên dữ liệu hiện tại (đo bằng MySQL):** `companyAvailability` **4 dòng** và `constructionDailyLogItems` **2 dòng** đang bị **che hoàn toàn**; còn `centralInventory`/`centralReturns` **rỗng sẵn trong DB** (0 dòng) nên trước/sau **không khác gì trên dữ liệu này** — sửa để **đúng hợp đồng**, không phải vì đang có ca hỏng.
* Thêm một biến thể mới của cùng lớp lỗi: `constructionDailyLogs` **thiếu 2 CỘT** ⇒ xem **TASK-053** (đã vá cùng lượt).

## 2. Phạm vi đã làm

**(a) 4 truy vấn ĐỌC port nguyên trạng từ JS** vào `BootstrapDataAdapter` (giữ nguyên CTE, `WH-CENTRAL`, `status='active'`, `w.type<>'transit'`, `<>0`, `ORDER BY`, `LIMIT`):

| Khoá | Nguồn JS | Số dòng đo được (MySQL) | Java trả |
|---|---|---|---|
| `centralReturns` (+ `items` lồng) | `:620` | 0 (bảng rỗng) | ✓ mảng 0 dòng |
| `centralInventory` (+ `aliasText`) | `:621` | 0 (không có `stock_movements` vào/ra `WH-CENTRAL`) | ✓ mảng 0 dòng |
| `companyAvailability` | `:712` | **4** | ✓ **4 dòng**, đủ **13/13 alias cột** |
| `constructionDailyLogItems` | `:659` | **2** | ✓ **2 dòng**, đủ **11/11 alias cột** |

**(b) Bộ lọc quyền — phát hiện lớn hơn đặc tả:** JS **dựng đủ rồi XOÁ TRẮNG theo module** cho người không phải admin (`:728-737`), và xoá 2 khoá kho tổng theo **vai trò** (`:622`). Bản Java port **KHÔNG CÓ** bộ lọc này (không phải thiếu 4 khoá — thiếu **cả khối**). Đã port nguyên trạng, gồm 7 nhóm module + nhóm chỉ-admin + 2 khoá theo vai trò kho-site.

**(c) Nhánh `modulePermissions` thứ hai bị thiếu (JS `:684`)** — Ban giám đốc/thư ký nhận **mọi module trừ `admin`** với `permissionSource="company_leadership"`. **Bắt buộc port cùng lượt**: bộ lọc ở (b) lấy chính danh sách này làm đầu vào, nên nếu để nguyên thì `thukydemo` sẽ bị **xoá trắng oan** (đo trước khi vá: 15 dòng quyền ⇒ 0 nhóm được giữ).

**(d) Sửa lỗi `tinyint(1)` (TASK-052)** — điều kiện `active instanceof Number` **luôn sai** vì JDBC trả **Boolean** ⇒ `modulePermissions` của admin **luôn rỗng** (0 dòng) dù JS trả đủ **61** dòng. Xem `TASK-052.md`.

**(e) `data.user` thiếu 2 trường (TASK-051)** — thêm `warehouseScopeKind` + `mustChangePassword`. Xem `TASK-051.md`.

**(f) `constructionDailyLogs` thiếu 2 cột (TASK-053)** — `itemCount` + `completedQty` (JS `:658`) ⇒ cột "Khối lượng" của Nhật ký thi công luôn 0. Xem `TASK-053.md`.

## 3. Bằng chứng kiểm chứng (probe mới, nguồn độc lập)

`tools/probe-task050-bootstrap.mjs` — **87/87 ĐẠT**, 5 nhóm phép đo:
1. **Admin**: 4 khoá tồn tại dạng mảng + số dòng khớp **truy vấn MySQL độc lập** + shape cột khớp **alias chép nguyên văn từ JS** (13 và 11 alias).
2. **Admin**: bộ lọc **không** đụng vào `users`/`audits`/`activeSessions`/`serverInfo`/`trustStatus`/`emailSettings` (đối chứng âm: nếu lọc quá tay thì đỏ ngay).
3. **3 tài khoản thật** (`tkhodemo` kho-site · `thukydemo` Ban giám đốc · `nvdademo` dự án): nhóm chỉ-admin bị xoá trắng; nhóm module **tính kỳ vọng ĐỘC LẬP từ `user_module_permissions` trong MySQL** (không dùng lại dữ liệu trong response — tránh lập luận vòng tròn); `centralInventory`/`centralReturns` = `[]` đúng nhánh **vai trò kho-site** (`:622`); **đối chứng dương**: `tkhodemo` vẫn nhận `inventory=14`, `requests=17`, `materials=14`, `staffDirectory=12` dòng.
4. **Ban giám đốc**: `permissionSource=company_leadership`, **60** module (MySQL chỉ có 15 dòng), **không** có module `admin`, `materials` **14 dòng không bị xoá**.

**Giới hạn của phép đo (ghi rõ):** lõi JS cũ **không chạy** (cổng `:9000` proxy `/api/*` → Java; `:8787` là Node SSR) nên **không** so được JSON JS↔Java lúc chạy; thay bằng nguồn độc lập (MySQL + alias chép từ JS). `centralInventory`/`centralReturns` **rỗng trên dữ liệu hiện tại** nên **không kiểm được shape cột** — probe in thẳng dòng "không kiểm được", **không** tính là ĐẠT.

## 4. Tệp đã sửa

* `java-backend/infrastructure/.../persistence/BootstrapDataAdapter.java` — 4 truy vấn + bộ lọc quyền + nhánh Ban giám đốc + sửa `tinyint(1)` + helper `isOne`/`isActiveOne`/`anyModule`/`blank`/`isCompanyLeadership`.
* `java-backend/application/.../port/out/BootstrapDataPort.java` — `Context` thêm `roleCode`, `roleBase`, `warehouseScopeKind`.
* `java-backend/application/.../service/BootstrapUseCase.java` — truyền 3 trường mới.
* `java-backend/web/.../controller/SystemController.java` — `isAdmin` nay đúng như JS (`roleBase==='admin' || role==='admin'`), truyền ngữ cảnh, `data.user` thêm 2 trường.
* `tools/probe-task050-bootstrap.mjs` — **mới** (cổng kiểm chứng lúc chạy).

## 5. PHÁT HIỆN KÈM (chưa sửa — cần quyết định hoặc hồ sơ riêng)

1. **`user_project_scopes` có 5 DÒNG MỒ CÔI** (project_id không tồn tại trong `projects`): `thukydemo` → `PRJ_fdbfab20-bf1f-0000-0000-000000000000`; `admin` → 3 id; **1 dòng của người dùng đã bị xoá** (`USR_250387b4-…`, không còn trong `users`). **Triệu chứng thật:** `thukydemo` nhận `data.projects = []` ⇒ tài khoản Ban giám đốc **không thấy dự án nào**. ⇒ mục **D5** ở `MASTER_STATUS.md`. **KHÔNG tự sửa dữ liệu.**
2. **Bộ lọc dùng `modulePermissions` của Java — vốn thiếu `permission_expires_at` + JOIN nhóm menu** so với JS `:684` ⇒ tập quyền của Java có thể **rộng hơn** ⇒ xoá trắng **ít hơn** JS một chút (không bao giờ nhiều hơn). Bù phần thiếu thuộc **TASK-024**. Đã ghi thẳng trong mã.
3. **JS có lỗ hổng thiết kế (không phải lỗi port):** nếu một tài khoản không phải admin/Ban giám đốc mà **không có dòng `user_module_permissions` nào**, thì JS xoá trắng **toàn bộ** dữ liệu theo module, trong khi UI vẫn dựng menu theo vai trò (`app/page.tsx:559 permissionConfigured`) ⇒ **màn hình hiện nhưng rỗng**. Trên dữ liệu hiện tại **không tài khoản nào** rơi vào ca này (9–30 dòng/người; `admin` được UI che bằng `isAdminUser`). Java nay **khớp JS** ⇒ giữ nguyên, không tự "cải tiến" khác JS.
4. **`transferOrders` của Java thiếu 7 trường** so với JS `:713` (`source_project_id`, `destination_project_id`, `approved_at`, `shipped_at`, `received_at`, `shippedQty`, `receivedQty`) và **thiếu bộ lọc theo kho của vai trò kho** (`:714`). ⇒ đưa vào hàng đợi rà đường ĐỌC tiếp theo.
5. `businessRoleEngineProfiles`/`businessRoleGroups`/`businessScopes` nằm trong `if (admin)` của Java nhưng JS trả cho **mọi** người dùng ⇒ với người thường `engineRoleProfiles` (JS `:726` = `businessRoleEngineProfiles`) là **`null`** ở Java. **Lớp lỗi mới: "khoá CÓ khai nhưng giá trị null/rỗng theo vai trò"** — cổng quét theo tên khoá **không bắt được** dạng này; cần probe HTTP theo từng vai trò (đã có tiền lệ ở probe này).
6. **`data.engineRoleProfiles` = `null` cho MỌI tài khoản (kể cả admin) — lỗi THỨ TỰ GÁN.** Đo được: `engineRoleProfiles=null` ở cả `admin`, `nvdademo`, `tkhodemo`, trong khi `businessRoleEngineProfiles` = **9 dòng** (admin). Nguyên nhân: `data.put("engineRoleProfiles", data.get("businessRoleEngineProfiles"))` chạy ở **dòng 726**, còn `businessRoleEngineProfiles` chỉ được put trong khối `if (admin)` ở **dòng ~826** ⇒ đọc trước khi ghi. JS trả **9 dòng cho mọi người** (`:727`). UI **không vỡ** vì có phòng vệ (`page.tsx:376` ép về `[]`, `:2380` rơi về nhãn mặc định `roleNames`) nhưng **mất nhãn nghiệp vụ của công ty**. ⇒ đưa vào Known Problems #50.
