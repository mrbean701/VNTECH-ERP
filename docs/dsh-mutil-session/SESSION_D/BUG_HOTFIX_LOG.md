# BUG_HOTFIX_LOG — SESSION_D (ERP-SESSION-04)

> ⛔ Phiên này **không sửa mã** (audit only) ⇒ mọi bug ở trạng thái **`OPEN`** (đã phát hiện, đã có bằng chứng mã, **chưa vá**).

## BUG-20261008-D01 — `create/update/delete_project` + `bulk_import_projects` khai module RỖNG ⇒ 403 với người dùng nghiệp vụ

| Trường | Giá trị |
|---|---|
| BUG_ID | `BUG-20261008-D01` (= **P-01** trong `docs/38`) |
| DATE | 2026-10-08 |
| SESSION_ID | `ERP-SESSION-04` |
| MODULE | PROJECT (`site_command` / `project_management`) |
| FEATURE | Tạo · sửa · xoá dự án · nhập Excel dự án |
| SEVERITY | **HIGH** (nghẽn nghiệp vụ; ⛔ **không** phải lỗ hổng bảo mật — fail-closed) |
| SOURCE | Audit tĩnh (đọc mã) — phiên này |
| PROBLEM | 4 action khai `List.of()` ⇒ `RbacService.requireActionModule` ném **403** *«Thao tác chưa được khai báo quyền trong hệ thống»* cho **mọi tài khoản không phải admin / director / accountant** |
| IMPACT | Trưởng phòng Dự án & KS không tạo/sửa/xoá được dự án; thông báo lỗi gây hiểu nhầm là "hệ thống hỏng" |
| ROOT_CAUSE | Ngữ nghĩa `List.of()` đổi từ «không gác quyền» → **«MẶC ĐỊNH TỪ CHỐI»** (PHASE 0B S-03); 18 action chưa được gán module, **chờ quyết định nghiệp vụ** |
| FIX | ⛔ chưa vá (chờ user chốt module). Đề xuất: create/update → `site_command` (`canUse`/`canEdit`) · delete/bulk → `List.of("admin")` |
| FILES_CHANGED | ⛔ không (đề xuất sửa: `java-backend/application/.../rbac/ActionRbacRegistry.java` — **LOCK S01**) |
| TEST | ⛔ chưa chạy (shell hỏng). Khi có shell: gọi action bằng user thường ⇒ kỳ vọng 403 (đối chứng âm: admin ⇒ 200) |
| REGRESSION | Cần chạy `ActionRbacRegistryPoTest` + `test:regression` sau khi vá |
| VERIFICATION | `OPEN` |
| STATUS | **`OPEN`** |
| RELATED_TASK | `TASK-20261008-D02` · việc giao **T-03/T-05** (`docs/38` §5) |
| RELATED_CHANGE | ⛔ không |

## BUG-20261008-D02 — `set_project_status` chỉ admin ⇒ **Ban lãnh đạo không đóng/mở được dự án**

| Trường | Giá trị |
|---|---|
| BUG_ID | `BUG-20261008-D02` (= **P-02**) |
| DATE | 2026-10-08 |
| SESSION_ID | `ERP-SESSION-04` |
| MODULE | PROJECT |
| FEATURE | Đóng / mở dự án (`set_project_status`) |
| SEVERITY | **MEDIUM–HIGH** |
| SOURCE | Audit tĩnh |
| PROBLEM | Module khai `List.of("admin")`; nhánh ưu tiên lãnh đạo bị **loại trừ có chủ đích** khi danh sách chứa `"admin"` (`RbacService.java:69`) ⇒ **director/accountant không thực hiện được** |
| IMPACT | Quy trình đóng dự án (có kiểm tra archive/PO/kho/tổ đội) không ai chạy được ngoài `admin` |
| ROOT_CAUSE | Lựa chọn module `admin` cho nghiệp vụ vận hành dự án |
| FIX | ⛔ chưa vá. Đề xuất: thêm `site_command` (`canEdit`) vào danh sách module |
| FILES_CHANGED | ⛔ không (đề xuất: `ActionRbacRegistry.java:282`, `:526`) |
| TEST | ⛔ chưa chạy — khi có shell: director gọi `set_project_status` (kỳ vọng hiện tại 403) |
| REGRESSION | test RBAC dự án |
| VERIFICATION | `OPEN` |
| STATUS | **`OPEN`** |
| RELATED_TASK | `TASK-20261008-D02` · việc giao **T-05** |

## Ghi nhận khác (⛔ không phải bug mới của phiên này)
- **P-04** 4 tệp màn mồ côi (`HANDOFF-20261007-C15`) — phiên **03** đã báo, **vẫn `OPEN`**, thuộc S01/user.
- **P-05** ngày ISO thô ở `app/page.tsx` (`HANDOFF-20261007-C14`) — phiên **03** đã báo, **vẫn `OPEN`**, ⛔ LOCK S01.
- **X-02** 4 cổng probe đo lệch — đã ghi ở `SHARED_STATE` §34/§40, ⛔ thuộc `tools/**`.

---

## ⚠️ ĐÍNH CHÍNH 08/10/2026 (cùng phiên) — sau khi đọc tiếp `SystemController.java`

### Sửa `BUG-20261008-D01` (P-01) — **nguyên nhân sai tầng**
| Trường | Giá trị (bản đính chính) |
|---|---|
| ROOT_CAUSE (đúng) | `create_project`/`update_project`/`delete_project` bị **`requireRequireAdmin`** chặn ở controller = **chỉ `role == "admin"`** (`SystemController.java:281-284`, `:286-289`, `:296-302`; hàm `:1739-1745`) ⇒ **là CHỦ Ý của hệ thống**, ⛔ không phải «thiếu khai báo module» |
| Vai trò của khai báo rỗng | **Tầng thứ hai** — chỉ khác ở **thông điệp lỗi** («Thao tác chưa được khai báo quyền…» thay vì «Tài khoản không có quyền thực hiện nghiệp vụ này.») |
| Hệ quả cho user | Câu hỏi đúng: **«dự án có tiếp tục CHỈ `admin` quản lý không?»** — CÓ ⇒ chỉ cần cải thiện thông điệp/UX (**FE**); KHÔNG ⇒ sửa **CẢ 2 TẦNG** (**BE**) |
| STATUS | vẫn **`OPEN`** (chờ user) — nhưng **phân loại lại**: đây là **quyết định thiết kế**, ⛔ không phải bug thiếu sót |

### Sửa `BUG-20261008-D02` (P-02) — **lý do đúng là tầng controller**
`set_project_status` bị `requireRequireAdmin` (`:291-294`) ⇒ **chỉ `admin`**, ⛔ không có ngoại lệ Giám đốc/KTT. Kết luận *«Giám đốc không đóng/mở được dự án»* **giữ nguyên**, nhưng **nguyên nhân là cổng controller**, ⛔ không phải `RbacService:69`. STATUS: **`OPEN`**.

### 🆕 `BUG-20261008-D03` (= **P-08**) — nhóm **MỒ CÔI THẬT**: danh mục vật tư · tổ đội · lịch trình duyệt

| Trường | Giá trị |
|---|---|
| BUG_ID | `BUG-20261008-D03` |
| DATE | 2026-10-08 |
| SESSION_ID | `ERP-SESSION-04` |
| MODULE | `material_catalog` (danh mục vật tư) · `site_command` (tổ đội) · `approvals` (lịch trình duyệt) |
| FEATURE | Bảo trì danh mục vật tư · đổi trạng thái/xoá tổ đội · cấu hình lịch trình duyệt |
| SEVERITY | **HIGH** (nghi vấn — chặn nghiệp vụ, ⛔ chưa có phép thử) |
| SOURCE | Audit tĩnh (đọc mã) |
| PROBLEM | 12 action khai **module rỗng `List.of()`** **và** khối `SystemController:893-1040` **không** dùng `requireRequireAdmin` (chỉ `requireCurrentUser`) ⇒ theo `RbacService.java:64-83` ⇒ **403 «Thao tác chưa được khai báo quyền trong hệ thống»** cho **mọi tài khoản không phải admin** |
| IMPACT | Phòng Kế hoạch **có thể không bảo trì được danh mục vật tư** (cần cho go-live) · không cấu hình được lịch trình duyệt (ảnh hưởng **GĐ A2** của `docs/37`) |
| ROOT_CAUSE | Ngữ nghĩa `List.of()` đổi thành **MẶC ĐỊNH TỪ CHỐI** (PHASE 0B) mà 12 action này **chưa được gán module** |
| FIX | ⛔ chưa vá — **phải có phép thử trước** (có thể use case tự guard, chưa loại trừ). Đề xuất: gán module + capability theo `CHECKLIST` MỐC 110 §8 |
| FILES_CHANGED | ⛔ không (đề xuất: `ActionRbacRegistry.java` — **LOCK S01**) |
| TEST | ⛔ **chưa chạy** — kịch bản 4 phép thử ở `docs/39` §5 (kèm **đối chứng âm**) |
| VERIFICATION | `OPEN` |
| STATUS | **`CANCELLED`** (🔔 **BÁO ĐỘNG GIẢ** · đóng 08/10/2026 · theo `REQUIRED ACTION` của `ERP-SESSION-01`) — ⭐ S01 **ĐÃ KIỂM CHỨNG NGƯỢC LẠI** (`TEST-20261009-020`): các mục tôi từng coi là «mồ côi thật» **⛔ KHÔNG mồ côi** ⇒ ⚠️ **kết luận cũ của tôi SAI** ⇒ ⛔ **không sửa mã** · 📌 **BÀI HỌC (cùng lớp `BUG-D24`)**: kết luận từ **một phép đo tại MỘT thời điểm** rồi bị dùng như chân lý ⇒ **phải ghi rõ THỜI ĐIỂM + ĐIỀU KIỆN đo** để biết khi nào nó hết đúng · ⭐ **ĐỐI CHỨNG**: `HANDOFF-D14` (**6 action «mù quyền»**) thì S01 kiểm chứng **LÀ THẬT** ✓ ⇒ `BUG-D22` ⛔ **không** phải báo động giả |
| RELATED_TASK | `TASK-20261008-D03` |
| RELATED_CHANGE | ⛔ không |

> 🔎 **Số liệu nền để phiên sau đo lại**: **65** action khai rỗng · **10** `PUBLIC_ACTIONS` · **45** call site `requireRequireAdmin` ⇒ số mồ côi thật **phải tính bằng script**, ⛔ không dùng lại con số 19 của 30/09/2026.

---

## ⛔ RÚT LẠI MỘT VIỆC — 08/10/2026 (`TASK-20261008-D04`, xác minh lại)

| | |
|---|---|
| **VIỆC ĐÃ ĐỀ XUẤT** | **T-03** (`docs/38` §5): «FE — disable + tooltip nút CRUD dự án để user thường không tưởng hệ thống hỏng» |
| **VÌ SAO RÚT** | ✅ **XÁC MINH ĐƯỢC**: user thường **⛔ KHÔNG CÓ ĐƯỜNG** bấm ra 403 — UI CRUD dự án nằm trong **AdminApp step 8** (`page.tsx:2825`), module `admin` bị cổng `accessDenied = active!=="admin" ? (permissionConfigured && !canView) : !isAdminUser(user)` (`page.tsx:625`) ⇒ màn Admin **chỉ mở cho `admin`**, cộng thêm menu `system_admin` đã ẩn theo **MỐC 118** |
| **KẾT LUẬN MỚI** | Phần còn lại của **P-01 là QUYẾT ĐỊNH NGHIỆP VỤ** («dự án có tiếp tục CHỈ `admin` quản lý?»), ⛔ **không phải việc FE**. Nếu user chọn «KHÔNG» ⇒ sửa **BE 2 tầng** (controller + registry) |
| **BÀI HỌC** | **Đ-04-04**: «UI có nút» ≠ «user bấm được» — phải kiểm **cả 2 tầng FE** (menu hiện? `accessDenied`?) **và BE** trước khi đề xuất sửa FE |

### Đính chính nhẹ mô tả J-02 (kế thừa `docs/09`)
`docs/38` viết «22 màn phòng ban **chỉ có 1 form**» ⇒ **ĐO LẠI trong mã**: `DepartmentTaskWorkspace` (`page.tsx:759-774`) = **1 form «Giao việc bổ sung»** (render khi `assignmentMode`) **+ 1 bảng nhiệm vụ có 3 tab lọc** (Tất cả / Tự động từ nghiệp vụ / Giao việc bổ sung).
⇒ Vẫn **mỏng** (⛔ không phải màn nghiệp vụ đầy đủ) nhưng ⛔ **không phải màn rỗng** — khuyến nghị «ẩn khỏi menu go-live» **vẫn giữ**.
**Đ-04-05**: ⛔ đừng kế thừa mô tả từ tài liệu cũ — phải **đếm trong mã**.

---

## BỔ SUNG 08/10/2026 — `TASK-20261008-D06`: lập **MA TRẬN QUYỀN GO-LIVE** (`docs/41`)

### `BUG-20261008-D04` (= **P-09**, MEDIUM) — `delete_supplier`: registry ↔ controller **LỆCH**
| Trường | Giá trị |
|---|---|
| BUG_ID | `BUG-20261008-D04` |
| MODULE | `supplier_catalog` |
| FEATURE | Xoá nhà cung cấp |
| SEVERITY | **MEDIUM** (hướng **AN TOÀN** — chặt hơn khai báo, ⛔ không hở quyền) |
| PROBLEM | Registry khai `delete_supplier` → `supplier_catalog` + `canEdit` (**⇒ M chạy được**), nhưng controller **hard-code** `requireRequireAdmin` (**⇒ chỉ A**) ⇒ tài liệu/registry nói một đằng, thực thi một nẻo |
| IMPACT | Người được cấp `supplier_catalog`+`canEdit` **⛔ không xoá được NCC** nhưng ⛔ không có thông báo đúng bản chất; `CHECKLIST` §8 từng ghi «2 mâu thuẫn `delete_partner`/`delete_supplier`» — nay **định vị được dòng** (`SystemController:1444-1445`) |
| ROOT_CAUSE | Hai cơ chế phân quyền cùng tồn tại (hard-code ở controller vs module ở registry), ⛔ không có cổng kiểm tính nhất quán |
| FIX | ⛔ chưa vá — **cần user quyết**: giữ admin-only (thì sửa **registry** cho khớp) **hoặc** cho phép M (thì bỏ hard-code — theo tiền lệ MỐC 109) |
| STATUS | **`OPEN`** |
| RELATED_TASK | `TASK-20261008-D06` |

### Ghi nhận (⛔ chưa gọi là bug) — `save_user_access` admin-only **nhất quán ở cả 2 tầng**
Registry RỖNG + controller `requireRequireAdmin` (`:413-414`) ⇒ **chỉ A**, ⛔ **không phải bất nhất quán** ⇒ nhiều khả năng **là chủ ý** (cấp quyền **theo từng người** = admin; còn **quyền theo phòng ban** đi qua action khác). ⏳ Cần user xác nhận, ⛔ không sửa.

### Ghi nhận thiết kế — **luật L** (Ban lãnh đạo) — đã có `D-022` trong `CURRENT_STATE`
`director`/`accountant` **thực thi được MỌI action module-gated bất kể capability** (trừ module chứa `"admin"`) ⇒ ảnh hưởng cách cấu hình go-live: nếu muốn Ban lãnh đạo **chỉ xem**, phải đổi **`RbacService:69`** (BE), ⛔ cấu hình quyền không giải quyết được. Đã ghi vào `docs/41` §0.

---

## ⭐ CHỐT NGUYÊN NHÂN GỐC `BUG-20261008-D04` (P-09) — 08/10/2026 (`TASK-20261008-D13`)

| Trường | Giá trị (bản chốt) |
|---|---|
| **ROOT_CAUSE (từ chính mã)** | `SystemController.java:1463` ghi nguyên văn: *«Khuôn `delete_supplier`: chỉ admin (**Java chưa có helper `isDepartmentApprover("KH")`**)»* ⇒ ⭐ **bản JS monolith CÓ helper `isDepartmentApprover(<phòng>)`, bản Java CHƯA port** ⇒ khi cutover, 2 action này **tạm gác về admin** thay vì cho Trưởng phòng Kế hoạch |
| **PHẠM VI (đã mở rộng)** | **2 action**, ⛔ không phải 1: `delete_supplier` (`:1444-1445`) **và** `delete_partner` (`:1462-1466`) |
| **ĐỐI CHỨNG** | `save_partner` (`:1452`) · `set_partner_status` (`:1457`) = `requireCurrentUser` + module `supplier_catalog` ⇒ ⭐ **chỉ 2 action XOÁ bị gác admin**, các action khác của nhóm **bình thường** |
| **FIX (2 lựa chọn)** | **(a) GIỮ admin-only** (đề xuất cho go-live): sửa **registry** cho khớp + đưa 2 tên vào `ADMIN_ONLY_ACTIONS` (`docs/47` §D) = **1–2 dòng** · **(b) Cho Trưởng phòng Kế hoạch xoá**: **port helper `isDepartmentApprover` sang Java** + thay cổng ở 2 `case` + test = **≥ nửa ngày** |
| **NỢ KỸ THUẬT GHI TÊN** | *«Port `isDepartmentApprover(<phòng>)` từ JS sang Java»* — chỉ cần nếu chọn (b) |
| **STATUS** | **`OPEN`** (chờ user quyết B5 ở `docs/45` §B) |

---

## BUG-20261008-D05 (P-12) — **Nút «Xong» gửi `COMPLETED` trong khi backend CHẶN người thực hiện**

| Trường | Giá trị |
|---|---|
| **BUG_ID** | `BUG-20261008-D05` |
| **DATE / SESSION** | 2026-10-08 · `ERP-SESSION-04` (`SESSION_D`) |
| **MODULE / FEATURE** | JOBS — màn Công việc, bảng nhiệm vụ (cột «Thao tác») |
| **SEVERITY** | **HIGH** (workflow: người thực hiện ⛔ **không thể** báo hoàn thành ⇒ chặn luồng duyệt việc) |
| **SOURCE** | Đọc mã khi soạn recipe việc 3 (`TASK-20261008-D18`) — ⛔ không phải user báo |
| **PROBLEM** | `app/screens/WorkCenter.tsx:445` — nút «Xong» gửi `send("update_work_item_status", { workItemId: r.id, status: "COMPLETED" })` **cho MỌI user** |
| **IMPACT** | Nhân viên (người được giao) bấm «Xong» ⇒ BE từ chối theo luật ⇒ ⛔ **không báo được hoàn thành**; nút **hứa việc hệ thống ⛔ không cho** (lớp lỗi «nút chết» BUG-013/014) |
| **ROOT_CAUSE** | **Lệch FE↔BE**: BE `OpsTaskManagementUseCase.updateWorkItemStatus:369-370` ghi rõ *«Người thực hiện chỉ **Gửi kiểm tra**; **Trưởng phòng**/người có thẩm quyền mới xác nhận **Hoàn thành**.»* — FE ⛔ không phân biệt vai trò, luôn gửi `COMPLETED` |
| **FIX (đề xuất — chưa áp)** | Người thực hiện ⇒ gửi **`SUBMITTED`** («Gửi kiểm tra»); **Trưởng phòng/admin** ⇒ gửi `COMPLETED` («Duyệt xong»). Điều kiện trưởng phòng mô phỏng **đúng luật BE**: `scope.isAdmin ‖ scope.managerDepartments.includes(row.departmentCode)`. Mã dán: `docs/52` §3.1 (`ProgressCell` + `canApproveRow`) |
| **FILES_CHANGED** | ⛔ **chưa sửa** (đợt này read-only) — dự kiến `app/screens/WorkCenter.tsx` |
| **TEST** | ⛔ chưa chạy (shell hỏng) — ⚠️ **⛔ không test nào** đang khoá cột c9 ⇒ cần **thêm test mới** khi vá (đối chứng âm: assignee ⇒ `SUBMITTED`; manager ⇒ `COMPLETED`) |
| **REGRESSION** | Phải kiểm: tab Phòng ban (bảng `allowEdit=false`) · Dashboard · Kanban (đã gọi `update_work_item_status`) |
| **VERIFICATION** | ⛔ chưa — **STATUS = `OPEN`** |
| **RELATED_TASK / CHANGE** | `TASK-20261008-D18` · `docs/52` · liên quan **việc 5·6** của user (duyệt hoàn thành / yêu cầu làm lại) |

---

## 🔴 BUG-20261008-D06 (HIGH) — **Cổng release ĐỎ: 40 NHÓM TRÙNG SỐ migration** trong `drizzle/` (391 ≠ 351)

| Trường | Giá trị |
|---|---|
| **BUG_ID** | `BUG-20261008-D06` |
| **DATE / SESSION** | 2026-10-08 · `ERP-SESSION-04` (`SESSION_D`) |
| **MODULE / FEATURE** | DEVOPS/RELEASE — chuỗi migration `drizzle/**` + cổng `npm run test:release-static` |
| **SEVERITY** | **HIGH** (chặn cổng đóng gói; ⚠️ rủi ro Flyway/Drizzle lỗi vì **2 tệp cùng số hiệu**) |
| **SOURCE** | ⭐ **Chạy cổng THẬT** sau khi shell sống lại (`TASK-20261008-D35`) — ⛔ không phải user báo |
| **PROBLEM** | `npm run test:release-static` ⇒ `Error: Migration chain phải có đúng 351 file (0000..0350), nhận 391.` |
| **IMPACT** | 🔴 **Cổng release ĐỎ** (391 ≠ 351) ⇒ **chặn khâu đóng gói/phát hành theo quy trình dự án** — ⭐ **đây là hệ quả DUY NHẤT chứng minh được**. ✅ **ĐÃ LOẠI TRỪ các rủi ro nặng hơn** (xem «ĐIỀU TRA SÂU» bên dưới): ⛔ **KHÔNG** hỏng khâu chạy migration, ⛔ **KHÔNG** sai định danh cuối, ⛔ **KHÔNG** nhân đôi dữ liệu ⇒ **mức độ đúng = HIGH (quy trình), ⛔ KHÔNG phải CRITICAL** (⚠️ tôi từng nghi «rủi ro Flyway/Drizzle lỗi» — **đã tự bác bỏ bằng đo đạc**) |
| **ROOT_CAUSE** | Đo được: `scripts/verify-full-release.mjs:12-17` đếm tệp khớp `^\d{4}_.+\.sql$` trong `drizzle/` rồi so với `MIGRATION_HEAD + 1` (identity `VNTECH_FULL_W2_ID.txt`: `MIGRATION_HEAD=0350_…` ⇒ **351**). Thực tế **391** ⇒ dư **40**, và **đúng 40 NHÓM TRÙNG SỐ** (mỗi nhóm **2 tệp**): `0225_phase_gd_mt3_f1_trung_tam_phe_duyet_binh_luan_chu_identity.sql` **+** `0225_phase_gd_rut_gon_da_quy_trinh_phe_duyet_bo_mo_ta__identity.sql` (tương tự tới hết dải). ⭐ `391 − 351 = 40` **khớp tuyệt đối**; ⭐ `COUNT_GT_0350 = 0` ⇒ ⛔ **không** có số vượt head ⇒ **nguyên nhân là TRÙNG SỐ**, ⛔ không phải «migration mới vượt head» |
| **FIX (đề xuất — ⛔ chưa áp, ⛔ ngoài phạm vi `SESSION_D`)** | ① Chọn **1 trong 2 tệp** mỗi cặp giữ số cũ, tệp còn lại **đổi số vượt head** (`0351_…`→) **theo đúng thứ tự thời gian**; ② cập nhật `VNTECH_FULL_W2_ID.txt` + `release-identity.mjs` **MIGRATION_HEAD** = tệp cuối; ③ chạy lại `npm run test:release-static` + `npm run verify:release` để chứng minh xanh. ⚠️ **Phải có phiên sở hữu `drizzle/**` làm** + ⛔ **không đổi số tệp đã chạy trên DB thật** (kiểm `MIGRATION_HEAD` đang áp trước) |
| **⚠️⚠️ CẢNH BÁO BẮT BUỘC CHO NGƯỜI SỬA (đo được, vòng 39)** | 🔴 **ĐỔI TÊN TỆP = TỆP ĐÓ BỊ CHẠY LẠI.** Cả 2 đường chạy migration đều đánh dấu **đã-áp theo TÊN TỆP ĐẦY ĐỦ** trong bảng `__mep_migrations`: `scripts/migrate-postgres.mjs:245` (`readdir(drizzle).filter(.sql).sort()`) → `:298-300` (`SELECT name FROM __mep_migrations` ⇒ `pending = migrations.filter(m => !applied.has(m.name))`) → `:359` (`if (applied.has(migration.name)) continue;`); và `scripts/local-runtime.mjs:142-158` (cùng cơ chế). ⇒ ⭐ Nếu DB **đã** áp tệp cũ, **đổi tên** nó ⇒ ⛔ **không còn khớp tên đã ghi** ⇒ **BỊ ÁP LẦN HAI**. ⛔ Vì vậy: chỉ đổi số cho tệp **CHƯA áp** (⚠️ kiểm `SELECT name FROM __mep_migrations` trước), hoặc nếu buộc đổi tên tệp đã áp thì **ghi tên mới vào `__mep_migrations`** cùng giao dịch. ⭐ Phương án an toàn hơn: **giữ nguyên trùng số** và **nới cổng cho khớp thực tế** (⚠️ phải do **user quyết** vì là đổi luật cổng). |
| **🔎 ĐIỀU TRA SÂU (vòng 39 — đo thật, ⛔ không suy đoán)** | ① **Dải trùng**: **40 nhóm, `0225` → `0315`**; ⭐ **`0350` ⛔ KHÔNG bị trùng** ② **Tệp chạy CUỐI theo `sort()`** = `0350_phase_gd_mt3_s03_dot_11_hotfix_hr_chan_ghi_de_ho__identity.sql` = **đúng `MIGRATION_HEAD`** ⇒ ⭐ định danh cuối **ĐÚNG** (⛔ không bị tệp cũ ghi đè) ③ **Trùng NỘI DUNG = 0 nhóm** (`Get-FileHash SHA256` trên cả 391 tệp) ⇒ ⛔ **không** SQL nào bị áp 2 lần ⇒ ⛔ **không có rủi ro nhân đôi dữ liệu** ④ ⚠️ `0346` vs `0347` **cùng tên mô tả** (`dot_8_hotfix_critical_phan_2_key`) nhưng **hash KHÁC** ⇒ ⛔ **không phải bản sao nhầm** ⑤ ⭐ **317/391 tệp là `*_identity.sql`** (81%) — mỗi lần build thêm 1 tệp `UPDATE vntech_product_identity`; ⚠️ cặp trùng `0225`: **cả 2 tệp đều `UPDATE vntech_product_identity`** + có trigger `BEFORE UPDATE` ⇒ trong dải trùng, bảng định danh **bị ghi đè 2 lần tại mỗi mốc số** ⚠️ nhưng vì `0350` chạy **sau cùng** nên **kết quả cuối đúng** ✅ ⑥ ⛔ **KHÔNG có `drizzle/meta/_journal.json`** ⇒ dự án ⛔ **không** dùng drizzle-kit journal; có **2 runner tự viết** (`migrate-postgres.mjs` cho production — gọi từ `deployment-control.mjs:37`; `local-runtime.mjs` cho local) ⇒ ⭐ **KẾT LUẬN: đây là lỗi ĐÁNH SỐ/CỔNG, ⛔ không phải lỗi dữ liệu; mức độ HIGH (quy trình), ⛔ KHÔNG phải CRITICAL** |
| **FILES_CHANGED** | ⛔ **0** — phiên này **read-only** (luật §18/§19: ⛔ không tự sửa `drizzle/**` của phiên khác) |
| **TEST** | ✅ **Đã chạy cổng**: `test:release-static` **exit 1** (lỗi nguyên văn ở trên) · `npm run verify:fingerprint` **exit 0** · `npm run test:regression` **exit 0 · 921/920/0/1** · `npx tsc --noEmit` **0** |
| **REGRESSION** | Sau khi sửa phải chạy lại **cả 4**: `tsc` · `test:regression` · `verify:fingerprint` · `test:release-static` (+ `verify:release`) |
| **VERIFICATION** | ✅ **ĐÃ ĐO** (không chỉ đọc mã) — **STATUS = `OPEN`** (chờ phiên sở hữu) |
| **RELATED_TASK / CHANGE** | `TASK-20261008-D35` · ⚠️ **liên quan chéo phiên**: nhóm trùng `0225` **đã được COMMIT trong git** ⇒ **lỗi CÓ SẴN trong baseline**, ⛔ **không phải** do 21 tệp `drizzle` chưa track (một phần là của phiên 03) |

---

## 🔴 BUG-20261008-D07 (MEDIUM) — **Cổng CSS Đỏ: 19 class CSS CHẾT**

| Trường | Giá trị |
|---|---|
| **BUG_ID** | `BUG-20261008-D07` |
| **DATE / SESSION** | 2026-10-08 · `ERP-SESSION-04` (`SESSION_D`) |
| **MODULE / FEATURE** | UI/CSS — `npm run verify:css-baseline` |
| **SEVERITY** | **MEDIUM** (⛔ không chặn chức năng, nhưng **chặn cổng CSS** + rác bảo trì) |
| **SOURCE** | ⭐ **Chạy cổng THẬT** sau khi shell sống (`TASK-20261008-D35`) |
| **PROBLEM** | `CSS BASELINE AUDIT: KHÔNG ĐẠT · dead CSS classes remain:` **19 class** — `compact-file` · `filter-control` · `mapping-status-already_mapped` · `mapping-status-conflict` · `mapping-status-exact` · `mapping-status-high` · `mapping-status-label` · `mapping-status-low` · `mapping-status-not_found` · `mapping-status-review` · `mapping-status-very_high` · `matching-kpi-row` · `matching-summary` · `matching-table` · `matching-table-wrap` · `matching-toolbar` · `material-matching-toolbar` · `material-matching-v2` |
| **IMPACT** | Cổng CSS ⛔ không đạt ⇒ chặn `verify:release`/CI; CSS chết làm khó phân biệt class còn dùng |
| **ROOT_CAUSE** | ✅ **ĐÃ ĐIỀU TRA XONG (vòng 38) — CỔNG ĐÚNG, ⛔ KHÔNG phải báo động giả**: grep toàn repo cho `material-matching-v2` · `mapping-status-exact` · `matching-toolbar` · `matching-summary` · `compact-file` ⇒ **⛔ KHÔNG một tệp `.tsx/.ts` nào dùng** — chỉ xuất hiện ở: ① `app/globals.css:1` (CSS master baseline, nơi **định nghĩa**) ② `app/styles/canonical.css:37,46` (⚠️ chỉ nằm trong **danh sách selector GỘP** cùng các class CÒN SỐNG: `.table-wrap, .boq-table-wrap, .matching-table-wrap, …`) ③ `tools/toolbar-horizontal-20260928.css:69-77` (⭐ **tệp CÔNG CỤ**, dùng cho bản vá toolbar ngang) ④ các tệp `lib/material-matching-v2.mjs` · `MaterialMatcherV2.java` · `tests/*` chỉ **trùng TÊN**, ⛔ **không phải class CSS**. ⇒ Nguồn gốc: **tàn dư của màn/thanh công cụ «đối chiếu vật tư» (matching) cũ** đã bị gỡ/đổi tên ⇒ **19 class chết THẬT**; ⭐ **đây ⛔ KHÔNG thuộc lớp «cổng báo động giả»** mà phiên 03 đã gặp 3 lần (bài học §31) — đã **tự kiểm giả thuyết «class sinh ĐỘNG»** (`mapping-status-${value}`) và **phủ định** (không có chuỗi nào trong mã nguồn) |
| **FIX (đề xuất — ⛔ chưa áp)** | ① ✅ Điều tra xong: class **chết THẬT** ⇒ xoá **nhánh selector** tương ứng khỏi `app/globals.css` (CSS master baseline) + khỏi **danh sách gộp** ở `app/styles/canonical.css:37,46` ⚠️ **giữ nguyên các class CÒN SỐNG** trong cùng danh sách (`table-wrap` · `boq-table-wrap` · `staff-table` · `boq-main` · …) ② ⛔ **KHÔNG xoá** `tools/toolbar-horizontal-20260928.css` (tệp công cụ, ⛔ ngoài phạm vi CSS ứng dụng) ③ ⚠️ `app/globals.css` mang **mốc `VNTECH_MASTER_BASELINE_CSS_R1_1_1_BEGIN`** ⇒ sửa nó **đổi VÂN TAY** ⇒ **BẮT BUỘC `gd-cycle`** sau khi sửa (luật §16), rồi chạy lại `verify:css-baseline` + `verify:fingerprint` + `test:regression` |
| **FILES_CHANGED** | ⛔ **0** — read-only |
| **TEST** | ✅ `verify:css-baseline` **exit 1** (danh sách trên) — ⚠️ **đối chứng còn lại ĐẠT**: `tsc` 0 · `test:regression` 921/920/0/1 · `verify:fingerprint` ĐẠT · `audit:tests` 158 tệp/976 case |
| **REGRESSION** | Sau khi xử lý: chạy lại `verify:css-baseline` + `test:regression` + `verify:fingerprint` (sửa CSS ⇒ ⚠️ phải `gd-cycle`) |
| **VERIFICATION** | ✅ **ĐÃ ĐO** — **STATUS = `OPEN`** |
| **RELATED_TASK / CHANGE** | `TASK-20261008-D35` · ⚠️ nếu class là **động** thì đây là **lỗi của CỔNG**, ⛔ không phải lỗi CSS (bài học phiên 03 §31: *«một con số đỏ từ cổng ⛔ không phải một lỗi»*) |

---

## 🆕 BUG-20261008-D08 (phát hiện vòng 53 — **⛔ KHÔNG phải của `ERP-SESSION-04`**)

| Trường | Nội dung |
|---|---|
| BUG_ID | `BUG-20261008-D08` |
| NGÀY / SESSION | 2026-10-08 · phát hiện bởi `ERP-SESSION-04` (**người gây: phiên đang sửa `java-backend/**`**) |
| MODULE | TÀI CHÍNH — audit **F-03** (phụ thuộc action JS↔Java) |
| SEVERITY | **MEDIUM** (⛔ không mất dữ liệu, ⛔ không lỗi runtime) — **nhưng CHẶN `npm run test:regression`** |
| SOURCE | Chạy hồi quy sau khi thêm `tests/t13-work-progress-cell.test.mjs` (vòng 53) |
| PROBLEM | `F-03 — MỌI action trong bảng đều đúng DÒNG ở CẢ HAI đường ghi (JS + Java)` **ĐỎ** với **23 mục lệch**, ví dụ: `JAVA :645 không chứa case "save_capital_recovery"` · `:650 delete_capital_recovery` · `:655 save_contract_payment` · … · `:770 delete_accounting_voucher` |
| IMPACT | 🔴 **Hồi quy toàn cục ĐỎ 1 mục** ⇒ mọi phiên đều thấy «có lỗi»; ⚠️ **báo cáo audit F-03 mất giá trị** (số dòng đã cũ) |
| ROOT_CAUSE | **⭐ ĐÃ CHỨNG MINH ⛔ KHÔNG PHẢI do phiên 04**: ① `tests/f03-tai-chinh-audit-deps.test.mjs:16` đọc tài liệu `docs/agent-progress/F-03-TAI-CHINH-AUDIT-PHU-THUOC.md` ghi **số dòng cụ thể** của từng `case "…"` trong `java-backend/web/.../SystemController.java` ② `git status --porcelain java-backend` = **10 tệp `.java` bị SỬA** (⛔ phiên 04 **chưa từng chạm `java-backend/**`**) ③ **mtime `SystemController.java` = 2026-10-08 14:29:07** ⏰ **MỚI HƠN** tài liệu (ghi lúc **11:42:52**) ⇒ phiên khác chèn/xoá dòng trong Java ⇒ **mọi số dòng trong tài liệu lệch** |
| FIX | ⛔ **KHÔNG do phiên 04** ⇒ **BÀN GIAO**: người sửa `SystemController.java` phải **cập nhật lại số dòng** trong `docs/agent-progress/F-03-TAI-CHINH-AUDIT-PHU-THUOC.md` (hoặc dời cổng kiểm sang **so `case "…"` TỒN TẠI**, ⛔ không so số dòng — ⭐ số dòng luôn cũ sau mỗi lần sửa) |
| FILES_CHANGED | ⛔ phiên 04 **không sửa** gì cho bug này |
| TEST | `node --import tsx --test tests/f03-tai-chinh-audit-deps.test.mjs` ⇒ 1 FAIL (`actual` = 23 mục lệch · `expected` = `[]`) |
| REGRESSION | ⚠️ **Hồi quy tổng: `929 test · 927 pass · FAIL 1 · 1 skip`** — 1 lỗi **chính là bug này** (⭐ **0 lỗi do phiên 04**: `t13` mới **4/4 PASS**) |
| VERIFICATION | ✅ Đã chứng minh bằng `git status` + **mtime** (xem ROOT_CAUSE) |
| STATUS | `OPEN` — **đã bàn giao** (`HANDOFF-20261008-D08`) |
| RELATED_TASK | — (phát hiện ngoài phạm vi) |
| RELATED_CHANGE | — |

---

## 🆕 BUG-20261008-D09 (phát hiện vòng 54 — **DO `ERP-SESSION-04` GÂY RA ở «việc 1/hub»** ⇒ cần dọn)

| Trường | Nội dung |
|---|---|
| BUG_ID | `BUG-20261008-D09` |
| NGÀY / SESSION | 2026-10-08 · phát hiện bởi `ERP-SESSION-04` (soi **ảnh chụp UI thật**) |
| MODULE | JOBS — KHỐI «Công việc» (màn `WorkCenter`) |
| SEVERITY | **UI / MEDIUM** (⚠️ gây nhầm hướng: người dùng bấm «Công việc» mà tiêu đề trang ghi «KPI & hiệu suất nhân viên») |
| SOURCE | **Ảnh thật** `docs/dsh-mutil-session/SESSION_D/uat-tab7-phongban-todoi.png` (vòng 54) |
| PROBLEM | Đang ở tab **«Phòng ban/ Tổ đội»** (và trước đó ở **Dashboard**) mà `<h1>` vẫn là **«KPI & HIỆU SUẤT NHÂN VIÊN»** + phụ đề «Theo dõi khối lượng công việc… Phòng Kế hoạch» |
| IMPACT | ⚠️ **Nhầm ngữ cảnh** cho MỌI tab (Dashboard · Danh sách công việc · Được giao · Phòng ban/ Tổ đội · Giao việc · Dự án · Báo cáo) — ⛔ không mất dữ liệu, ⛔ không lỗi chức năng |
| ROOT_CAUSE | ⭐ `app/page.tsx:133` khai tiêu đề theo **KHOÁ MODULE**: `dept_plan_kpi: ["KPI & hiệu suất nhân viên – Phòng Kế hoạch", …]` (+ phụ đề `:200`). `<h1>{title[0]}</h1>` (dòng ~769) lấy `title` theo `active`. ⚠️ Mục **hub `work_hub`** ⛔ không khai `moduleKey` ⇒ `app/page.tsx` suy ra **`permissionKeys[0]` XEM ĐƯỢC** = **`dept_plan_kpi`** (với admin: khoá đầu của hợp 8) ⇒ tiêu đề **LUÔN** là «KPI…» ⛔ bất kể đang ở tab nào. ⚠️ **TRƯỚC khi gộp**, mỗi mục menu có `permissionKeys[0]` riêng (Cá nhân→`dept_plan_tasks`, Báo cáo→`dept_plan_alerts`…) nên tiêu đề **khớp mục đã bấm** ⇒ ⭐ **đây là hồi quy UX do việc 1 gây ra** |
| FIX (đề xuất — ⛔ CHƯA làm) | ⭐ **Nhỏ nhất**: trong `app/page.tsx`, khi màn đang mở là `WorkCenter` (`workCenterView !== null`) thì tiêu đề = **«Công việc»** + phụ đề theo TAB (hoặc lấy `label` của MỤC MENU thay vì khoá module). ⚠️ **⛔ KHÔNG sửa vội**: `app/page.tsx` **đang bị phiên khác sửa liên tục** (mtime đổi trong lúc soi) ⇒ sửa bây giờ có thể **mất bản sửa của họ** (§18/§19/§28) ⇒ **BÀN GIAO** |
| FILES_CHANGED | ⛔ phiên 04 **không sửa** cho bug này (chỉ **ghi log + ảnh bằng chứng**) |
| TEST | ⭐ Cần: test khoá «khi `workCenterView !== null` thì `<h1>` ⛔ không phải khoá module KPI» |
| REGRESSION | ✅ Không ảnh hưởng hồi quy hiện tại (`929 test · 927 pass · FAIL 1` — 1 lỗi là `BUG-D08`) |
| VERIFICATION | ✅ Có **ảnh chụp màn hình thật** làm bằng chứng |
| STATUS | `OPEN` — **đã bàn giao** (`HANDOFF-20261008-D09`) |

### ⭐ CẬP NHẬT `BUG-20261008-D09` (vòng 55) — **ĐÃ SỬA (code + test)**

| Trường | Nội dung |
|---|---|
| STATUS | `OPEN` → ⭐ **`FIXED`** (code fixed + test passed). ⏳ **`VERIFIED`** chờ **build lại** để thấy trên UI |
| FIX (đã làm) | ⭐ 2 sửa NHỎ trong `app/page.tsx`: ① dòng ~647 `const title` → **`let title`** (⚠️ buộc phải `let` vì `workCenterView` khai **SAU** dòng đó — dùng `const` sẽ **lỗi TDZ**) ② **ghi đè sau dòng `const workCenterView = workCenterViewFor(...)`**: `if (workCenterView !== null) title = ["Công việc", "Việc của tôi · việc được giao · phòng ban/tổ đội · dự án · báo cáo — chọn tab bên dưới"];` ⇒ mọi chỗ đọc `title[...]` (topbar + `<h1>`) tự nhận tiêu đề đúng |
| FILES_CHANGED | `app/page.tsx` (**2 khối nhỏ**) · `tests/t13-work-progress-cell.test.mjs` (**+1 test**) |
| TEST | ⭐ `tests/t13-work-progress-cell.test.mjs` nay **5 test — 5/5 PASS**, gồm test mới *«TIÊU ĐỀ TRANG khối «Công việc» ⛔ không được mang tiêu đề module KPI»* (khoá: `title` phải là `let` · phải có ghi đè `["Công việc", …]` khi `workCenterView !== null` · ⭐ **và khoá luôn BẪY**: nhánh `view === "dashboard"` phải đứng TRƯỚC nhánh `dept_plan_*_tasks`) |
| REGRESSION | ✅ **`930 test · 928 pass · FAIL 1 · 1 skip`** (tổng +1 test) — ⚠️ **1 lỗi còn lại = `F-03`/`BUG-D08`** (do phiên khác sửa `java-backend`) ⇒ ⭐ **0 lỗi do phiên 04**; `npx tsc --noEmit` = **0** |
| VERIFICATION | ⏳ **CHƯA thấy trên UI** vì bản chạy chưa build lại (`gd-cycle` cần dừng máy chủ ~1 phút) ⇒ ⛔ **chưa gọi `VERIFIED`** |
| GHI CHÚ ĐA PHIÊN | ⚠️ `app/page.tsx` là **tệp của S01** và **đang bị họ sửa** ⇒ tôi chỉ **thay ĐÚNG 2 đoạn** (⛔ không ghi đè cả tệp; S01 cũng dùng cách sửa theo đoạn) và **đọc tươi ngay trước khi sửa**. ⛔ Nếu S01 đang sửa **cùng 2 dòng này** ⇒ cần soát lại. |

---

## 🆕 BUG-20261008-D10 (phát hiện **vòng 58** khi audit tab «Giao việc» — ⭐ **PHIÊN 04 TỰ SỬA**)

| Trường | Nội dung |
|---|---|
| BUG_ID | `BUG-20261008-D10` |
| NGÀY / SESSION | 2026-10-08 · `ERP-SESSION-04` |
| MODULE | JOBS — tab **«Giao việc»** (`WorkCenter.tsx`) |
| SEVERITY | **MEDIUM** (mất DỮ LIỆU người dùng nhập: «Mô tả» ⛔ không bao giờ lưu được) |
| SOURCE | **Audit UI thật** `:9000` (đọc DOM form) → đối chiếu **mã nguồn** |
| PROBLEM | Form giao việc gửi payload có **`fd.get("description")`** (`WorkCenter.tsx:473`) nhưng form ⛔ **KHÔNG có ô nhập `name="description"`** ⇒ ⭐ **«Mô tả» LUÔN RỖNG** với mọi việc giao từ tab này |
| IMPACT | ⚠️ Người giao việc ⛔ không thể truyền mô tả/yêu cầu chi tiết; ⛔ không lỗi màn hình, ⛔ không mất dữ liệu cũ ⇒ **âm thầm mất thông tin** (khó phát hiện) |
| ROOT_CAUSE | ⭐ **Form thiếu ô nhập** (payload khai `description`); ⚠️ bằng chứng: `grep name="description"` trong `WorkCenter.tsx` chỉ có **1 chỗ ở dòng 377** (modal «Tạo công việc») — ⛔ **không có** trong khối form giao việc (dòng 476-486) |
| FIX | ✅ Thêm ô **«Mô tả»** (`<label className="full"><span>Mô tả</span><textarea name="description" rows={2}/></label>`) vào form giao việc — ⭐ **khuôn giống modal «Tạo công việc»** cùng tệp |
| FILES_CHANGED | `app/screens/WorkCenter.tsx` (**+1 ô nhập**) · `tests/t13-work-progress-cell.test.mjs` (**+1 test**) |
| TEST | ⭐ Test **khoá CẢ LỚP LỖI**: *«MỌI khoá `fd.get("…")` PHẢI có ô nhập `name="…"`»* — quét regex toàn tệp ⇒ ⛔ không thể tái phát dạng «payload đọc mà form thiếu ô» |
| REGRESSION | ✅ **`931 test · 930 pass · FAIL 0 · 1 skip`** ⭐ **0 LỖI** · `npx tsc --noEmit` = **0** · `t13` = **6/6 PASS** |
| VERIFICATION | ✅ Code + test; ⏳ hình ảnh UI cần **build lại** để thấy ô «Mô tả» trên màn hình |
| STATUS | **`FIXED`** (code + test) — ⏳ `VERIFIED` chờ **build** |
| RELATED_TASK | `TASK-20261008-D41` |
| RELATED_CHANGE | — (gom vào CHANGE cuối) |

---

## ⭐ CẬP NHẬT `BUG-20261008-D08` (vòng 58) — **ĐÃ XANH (do phiên khác sửa)**
- ✅ **Hồi quy toàn cục nay: `931 test · 930 pass · FAIL 0 · 1 skip`** ⇒ **`F-03` ĐÃ XANH** ⇒ ⭐ **phiên đang sửa `java-backend` đã cập nhật xong** (số dòng tài liệu khớp lại) ⇒ **`BUG-D08` = `CLOSED`** (⛔ phiên 04 không tự đánh `VERIFIED` cho việc của phiên khác — chỉ ghi **đo được là đã hết đỏ**).

---

## 🆕 BUG-20261008-D11 (phát hiện **vòng 63** từ **ẢNH user gửi** — ⭐ **PHIÊN 04 TỰ SỬA**)

| Trường | Nội dung |
|---|---|
| BUG_ID | `BUG-20261008-D11` |
| NGÀY / SESSION | 2026-10-08 · `ERP-SESSION-04` |
| MODULE | JOBS — tiêu đề module «Công việc» (`ListToolbar` của `WorkCenter`) |
| SEVERITY | **UI / LOW–MEDIUM** (⚠️ **số liệu VÔ LÝ** ⇒ người dùng mất tin vào màn hình) |
| SOURCE | **Ảnh chụp màn hình user gửi**: tiêu đề ghi *«0 việc của bạn · **24** việc phòng ban/tổ đội · **16** tổng»* ⚠️ |
| PROBLEM | **24 > 16** ⇒ số hiển thị **LỚN HƠN TỔNG THẬT** ⇒ vô nghĩa với người đọc |
| ROOT_CAUSE | ⭐ **ĐẾM TRÙNG**: `deptWork` = `scopedWork` với `assignedTo ≠ tôi` ∧ (`isAdmin` ∨ phòng tôi) → **16**; `teamWork` = `scopedWork` với `assignedTo ≠ tôi` ∧ **thành viên tổ đội tôi** → **8**; ⚠️ **`teamWork ⊂ deptWork`** (với tài khoản quản trị) ⇒ tiêu đề cũ dùng **`deptWork.length + teamWork.length`** = **24** ⇒ **cộng dồn 2 tập GIAO NHAU** |
| FIX | ✅ Thêm tập **HỢP (không trùng)** `deptTeamWork = scopedWork.filter(assignedTo ≠ tôi ∧ (điều-kiện-phòng-ban ∨ điều-kiện-tổ-đội))` rồi **tiêu đề dùng `deptTeamWork.length`** · ⛔ **KHÔNG đổi** 2 tập `deptWork`/`teamWork` (2 SUB-TAB vẫn phải hiện **ĐÚNG danh sách của nó**: «· 16» / «· 8») |
| FILES_CHANGED | `app/screens/WorkCenter.tsx` (**+1 tập hợp + đổi 1 biểu thức tiêu đề**) · `tests/t13-work-progress-cell.test.mjs` (**+1 test**) |
| TEST | ⭐ Test khoá: phải có `deptTeamWork` · tiêu đề phải dùng `deptTeamWork.length` · ⛔ **CẤM** chuỗi `deptWork.length + teamWork.length` (đếm trùng) |
| REGRESSION | ✅ `npx tsc --noEmit` = **0** · `t13` = **8/8 PASS** · hồi quy **`939 test · 937 pass · FAIL 1`** (⚠️ lỗi duy nhất = **`W-02`** CSDL thật vs tài liệu audit — **phiên khác**, ⛔ không liên quan) |
| VERIFICATION | ✅ Code + test; ⏳ hình ảnh cần **build** |
| STATUS | **`FIXED`** (code+test) — ⏳ `VERIFIED` chờ **build** |
| RELATED_TASK | `TASK-20261008-D43` |
| RELATED_CHANGE | `CHG-20261008-D11` |

---

## 🔴 BUG-20261008-D12 (**YÊU CẦU 6c CỦA USER ⛔ CHƯA LÀM** — phát hiện **vòng 64**, ⛔ **ngoài uỷ quyền của phiên 04**)

| Trường | Nội dung |
|---|---|
| BUG_ID | `BUG-20261008-D12` |
| NGÀY / SESSION | 2026-10-08 · phát hiện bởi `ERP-SESSION-04` |
| MODULE | JOBS — thông báo công việc (`scripts/system-route.mjs` + `java-backend/**`) |
| SEVERITY | **HIGH — THIẾU CHỨC NĂNG USER ĐÃ YÊU CẦU** (việc 6c) |
| SOURCE | Đọc mã để **kiểm yêu cầu 6 của user** (vòng 64) — ⭐ chưa từng kiểm |
| PROBLEM | ⛔ **Khi một việc chuyển sang `COMPLETED`, NGƯỜI GIAO VIỆC KHÔNG nhận thông báo nào** (⛔ không `task_notifications`, ⛔ không email) |
| IMPACT | ⚠️ Đúng yêu cầu user: *«người giao nhận thông báo khi việc hoàn thành»* ⇒ **thiếu** ⇒ người giao phải tự vào màn để biết việc đã xong |
| ROOT_CAUSE | ⭐ **ĐÃ ĐO**: `queueTaskNotice` (`scripts/system-route.mjs:277-283`) **CHỈ được gọi ở 2 chỗ** — tạo việc (`:293`, qua `createDepartmentTask`) và **giao lại** (`:1278`) ⇒ **đều là lúc GIAO**. Còn handler **`update_work_item_status` (`:1274-1275`)** chỉ `env.DB.batch([UPDATE work_items …, INSERT work_item_events …])` rồi **`return {message}`** ⛔ **KHÔNG gọi bất kỳ hàm thông báo nào** ⇒ ⛔ **không có nhánh `COMPLETED` ⇒ không ai được báo**. ⚠️ **Đường Java cũng thiếu** (đã ghi từ trước; `docs/57 §4.4` có **mã dán sẵn** cho `queueCompletionNotice` + `SystemController`) ⇒ ⭐ **thiếu ở CẢ HAI đường**, ⛔ không phải chỉ là «Java chậm hơn Node» |
| PHẦN ĐÃ CÓ (✅ nói cho chính xác) | ⭐ **6b «thông báo trên web khi được giao việc» = ĐÃ CÓ**: `queueTaskNotice` ghi `task_notifications` (**channel `in_app`**) + `email_outbox` (**event `task_assigned`**) ⇒ bảng «Công việc mới …» hiện trong chuông thông báo ✅ |
| FIX (đề xuất — ⛔ phiên 04 ⛔ KHÔNG tự làm) | **Node**: thêm trong `update_work_item_status` một lời gọi kiểu `queueCompletionNotice(task, assigner, actor, request)` khi `next === 'COMPLETED'` (dùng ĐÚNG khuôn `queueTaskNotice`: 6 khoá `task_notifications` + `channel="in_app"` + hàng `email_outbox` event `task_completed`) · ⚠️ chú ý khi **người xác nhận CHÍNH LÀ người giao** thì vẫn nên ghi nhận (⛔ tránh tự báo cho chính mình ⇒ cân nhắc `assigner.id !== actor.id`) · **Java**: dán `docs/57 §4.4` |
| FILES_CHANGED | ⛔ phiên 04 **không sửa** (⛔ `scripts/**` + `java-backend/**` ⛔ **ngoài uỷ quyền B1+B2**) |
| TEST | ⭐ Cần test: sau khi trưởng phòng bấm **«Duyệt xong»** ⇒ **có 1 hàng `task_notifications` cho `assigned_by`** + 1 hàng `email_outbox` event `task_completed` |
| REGRESSION | ✅ Không ảnh hưởng hồi quy hiện tại (`939·937·FAIL 1` — lỗi = `W-02` của phiên khác) |
| VERIFICATION | ✅ **Đã đo trong mã** (2 lời gọi `queueTaskNotice` + handler ⛔ không gọi hàm thông báo nào) |
| STATUS | `OPEN` — **đã bàn giao** (`HANDOFF-20261008-D10`) |
| RELATED_TASK | `TASK-20261008-D41` (việc 6) |
| RELATED_CHANGE | — |

### 🔴 **ĐÍNH CHÍNH `BUG-D12` (vòng 65 — sau khi KIỂM MÃ JAVA trực tiếp)**: ⚠️ **câu «Java cũng thiếu» ở trên là SAI**
| Trường | Nội dung |
|---|---|
| **BẰNG CHỨNG MỚI (đọc thẳng Java)** | `java-backend/application/.../OpsTaskManagementUseCase.java` — trong `updateStatus`: `:382 store.updateWorkItemStatus(u, now)` → `:383 store.insertWorkItemEvent(...)` → ⭐ **`:385 notifySafely("COMPLETED".equals(next) ? "TASK_COMPLETED" : "TASK_STATUS_CHANGED")`** ⇒ ✅ **Java CÓ phát thông báo** khi chuyển `COMPLETED` |
| **ĐÍNH CHÍNH** | ⛔ **KHÔNG phải «thiếu ở CẢ 2 đường»** mà là: ① 🔴 **Node ⛔ THIẾU HOÀN TOÀN** (`scripts/system-route.mjs:1274-1275` ⛔ không gọi hàm thông báo nào) ⇒ ⭐ **Node KÉM HƠN Java** (khoảng lệch parity) ② ✅ **Java CÓ**, nhưng qua **`notifySafely` = thông báo THEO CẤU HÌNH** (`notification_configs` khớp `code == eventKey`, kênh `web|email`; ⚠️ **không có cấu hình khớp thì ⛔ không phát**) ⇒ ⛔ **không đảm bảo gửi cho ĐÚNG NGƯỜI GIAO** và ⛔ **không ghi hàng `task_notifications` cho `assigned_by`** |
| **HỆ QUẢ CHO YÊU CẦU 6c** | ⚠️ **Đường Java**: người giao nhận được **NẾU** có `notification_configs` cho event `TASK_COMPLETED` chứa họ ⇒ **là việc CẤU HÌNH (ops), ⛔ không phải mã** · 🔴 **Đường Node**: ⛔ **không có gì** ⇒ **thiếu thật** |
| **FIX (bản sửa lại)** | ① **Node**: thêm nhánh `COMPLETED` ⇒ phát **cùng cơ chế như Java** (`notifySafely("TASK_COMPLETED")`) — ⭐ ưu tiên **đạt parity với Java** ② *(khuyến nghị)* **cả hai** đường ghi thêm **1 hàng `task_notifications` cho `assigned_by`** ⇒ người giao **LUÔN** nhận trên web, ⛔ **không phụ thuộc cấu hình** ③ ⚠️ cân nhắc ⛔ không tự báo khi **người xác nhận CHÍNH LÀ người giao** ④ **Test**: sau «Duyệt xong» ⇒ có thông báo tới `assigned_by` |
| **STATUS** | `OPEN` (giữ nguyên) — **đã đính chính**; `HANDOFF-20261008-D10` **cũng đã đính chính** |

### ✅ **THI HÀNH `BUG-D12` — ĐƯỜNG NODE ĐÃ XONG** (vòng 67 · **USER UỶ QUYỀN**)
| Trường | Nội dung |
|---|---|
| **USER UỶ QUYỀN** | ✅ User chốt 08/10/2026: **«ủy quyền»** ⇒ được sửa `scripts/**` + `java-backend/**` |
| **ĐÃ LÀM (Node)** | ✅ Thêm `queueCompletionNotice(task,actor,request)` (`scripts/system-route.mjs`) + gọi trong `update_work_item_status` khi `next==='COMPLETED'` ⇒ ghi **1 hàng `task_notifications`** (channel `in_app`) cho **NGƯỜI GIAO** + **1 hàng `email_outbox`** (event **`task_completed`**) ⭐ **TRỰC TIẾP** ⇒ ⛔ **không phụ thuộc `notification_configs`** (khác đường Java) · ⚠️ bỏ qua 2 ca: việc ⛔ không có người giao (`assigned_by` rỗng) & **người xác nhận chính là người giao** |
| ⭐ **BÀI HỌC VÀNG (đã trả giá 1 lần đỏ)** | ⚠️ Lần đầu tôi chèn hàm **ở giữa tệp** (`cạnh queueTaskNotice`) ⇒ **dịch số dòng** ⇒ **`F-03` ĐỎ** (`tests/f03-…` + tài liệu `docs/agent-progress/F-03-…` **khoá SỐ DÒNG** của các action trong tệp — ⭐ **đúng lớp `BUG-D08`**). ⭐ **CÁCH SỬA ĐÚNG**: ① đặt hàm mới ở **CUỐI TỆP** (function declaration **hoisted** ⇒ gọi được từ handler phía trên) ② gọi **INLINE trên chính dòng dài sẵn có** ⇒ **0 dòng dịch** ⇒ ✅ **`F-03` xanh lại**, ⛔ **không phải sửa 1 số dòng nào trong tài liệu**, ⛔ **không nới lỏng gate**. ⚠️ Bằng chứng: `git diff -U0` chỉ còn `@@ -1275 +1275 @@` (1:1) + `@@ -3405,0 +3406,24 @@` (ở cuối) và tệp về đúng **3429 dòng** |
| **CÒN LẠI (Java)** | ⏳ Đường **Java**: thêm hàng `task_notifications` cho `assigned_by` trong `OpsTaskManagementUseCase.updateStatus` (Java hiện chỉ `notifySafely("TASK_COMPLETED")` = **theo cấu hình**) — ⭐ làm tiếp ở vòng sau |
| **TEST** | ⭐ `tests/t13` **+1 test** khoá: có `queueCompletionNotice` · nhánh `COMPLETED` phải gọi · có INSERT `task_notifications` · có event `task_completed` · có luật ⛔ không tự báo · có luật bỏ qua việc không người giao |
| **REGRESSION** | ✅ **`947 test · 946 pass · FAIL 0 · 1 skip`** ⭐ **0 LỖI** · `t13` **10/10** · `F-03` **7/7** · `tsc` **0** |
| **STATUS** | 🟡 **`FIXED` một phần** (Node ✅ · Java ⏳) — ⏳ `VERIFIED` cần **runtime test với 2 tài khoản** (giao việc ⇒ duyệt xong ⇒ người giao phải thấy thông báo) |

### ✅ **THI HÀNH `BUG-D12` — ĐƯỜNG JAVA (vòng 68)** + ⚠️ **CHƯA BIÊN DỊCH ĐƯỢC (thiếu Maven)** — nói thẳng
| Trường | Nội dung |
|---|---|
| **ĐÃ LÀM (Java)** | ✅ `OpsTaskManagementUseCase.java`: thêm `private void queueCompletionNotice(task, actor, now)` (**ở CUỐI LỚP** — ⛔ không chèn giữa, ⛔ tránh dịch số dòng) + gọi **INLINE 1:1** tại dòng `notifySafely(...)`: `... ; if ("COMPLETED".equals(next)) queueCompletionNotice(task, principal, now);` ⇒ ⭐ ghi **TRỰC TIẾP** `task_notifications` (`channel="in_app"`) cho **NGƯỜI GIAO** + `email_outbox` (event `task_completed`) ⇒ ⭐ **không phụ thuộc `notification_configs`** · ⚠️ **bỏ qua 2 ca**: `assigned_by` rỗng (việc tự tạo) & **người xác nhận chính là người giao** |
| ⭐ **TỰ SOÁT TĨNH (thay cho biên dịch)** | ✅ **MỌI ký hiệu em dùng đều LẤY TỪ CHÍNH TỆP**: `LinkedHashMap` (import `:10`) · `store.findUserContact` (`:231`) · `store.findActiveProject` (`:234`) · `store.insertTaskNotification` (`:248`) · `store.emailBaseUrl()` (`:252`) · `store.insertEmailOutbox` (`:275`) · `html(...)` (`:291`) · `Principal.userId()`/`fullName()` (`:133`/`:135`) · `idGenerator.next("NTF"/"MAIL")` · `sv/trim` (`:806`/`:807`) ⇒ ⛔ không dùng API mới nào |
| 🔴 **CHƯA BIÊN DỊCH ĐƯỢC** | ⛔ **Máy KHÔNG có `mvn`/`mvnw`** (`java-backend\pom.xml` ✅ có nhưng ⛔ `mvnw.cmd` không có · ⛔ `mvn` không có trên PATH · ⛔ không tìm thấy trong JetBrains/Program Files/scoop) ⇒ ⚠️ **JAVA CHƯA ĐƯỢC CHỨNG MINH BIÊN DỊCH** ⇒ ⛔ **KHÔNG gọi `FIXED` cho phần Java** — ⭐ **CẦN**: ai có Maven biên dịch (`mvn -q -pl application -am compile`), hoặc cho em **đường dẫn `mvn`** để em tự chạy |
| **TEST (đã chạy được)** | ✅ `npm run test:regression` = **`947 test · 946 pass · FAIL 0 · 1 skip`** ⭐ **0 LỖI** ⇒ ⭐ **F-03 ⛔ KHÔNG khoá số dòng của tệp Java này** (em thêm **+57 dòng ở CUỐI lớp** mà ⛔ không làm đỏ gate nào) · tệp 811 → **868 dòng** |
| **STATUS** | 🟡 **Node ✅ `FIXED` · Java ⚠️ `FIXED-CODE, CHƯA BIÊN DỊCH`** — ⏳ `VERIFIED` cần **2 tài khoản** (giao việc ⇒ duyệt xong ⇒ người giao phải thấy thông báo) |

### ✅✅ **PHÁ VỠ BẾ TẮC BIÊN DỊCH (vòng 70) — JAVA ĐÃ BIÊN DỊCH THÀNH CÔNG, ⛔ KHÔNG CẦN MAVEN**
| Trường | Nội dung |
|---|---|
| **CÁCH LÀM** | ⭐ Dùng **`javac` thuần** + `@argfile`: `javac -nowarn -encoding UTF-8 -d <temp> "@$env:TEMP\vntech-srcs.txt"` với **72 tệp `.java`** của **`java-backend/domain/src/main/java`** + **`java-backend/application/src/main/java`** (⛔ không cần classpath ngoài vì `application` **chỉ phụ thuộc `domain`**, ⛔ **không Lombok/MapStruct** — đã kiểm `pom.xml`) |
| ⚠️ **BẪY ĐÃ GẶP** | Lần 1 lỗi `error: file not found: D:13. Duong...java-backenddomain...` ⇒ ⭐ **`javac` @argfile ăN MẤT dấu `\`** (đặc trưng Windows) ⇒ **PHẢI dùng dấu `/`** trong argfile (`$_.FullName -replace '\\','/'`) + **bọc `"…"`** vì đường dẫn có **dấu cách** |
| **KẾT QUẢ** | ✅ **`JAVAC_EXIT = 0`** (chỉ có `Note: unchecked or unsafe operations` = cảnh báo bình thường) ⇒ ⭐ **`BUG-D12` (Java) + `BUG-D13` ĐÃ ĐƯỢC CHỨNG MINH BIÊN DỊCH** ✅ |
| ⚠️ **PHẠM VI (nói đúng)** | Chỉ biên dịch **`domain` + `application`** (nơi có thay đổi của em) — **CHƯA** biên dịch `infrastructure`/`web` (cần classpath Spring đầy đủ, ⛔ máy không có Maven ⇒ `~/.m2` chỉ 163 jar, ⛔ chưa chắc đủ) ⇒ ⚠️ **vẫn nên chạy `mvn -q compile` khi có Maven** để chốt toàn bộ; ⭐ nhưng thay đổi của em **⛔ không đổi chữ ký interface nào** (chỉ **gọi** `store.insertTaskNotification`/`insertEmailOutbox` đã có sẵn) ⇒ rủi ro vỡ build toàn cục **rất thấp** |
| **STATUS (cập nhật)** | 🟢 **`FIXED`** (code + **biên dịch 0 lỗi** + hồi quy **`952·951·FAIL 0`**) — ⏳ `VERIFIED` cần **runtime test 2 tài khoản** (giao việc ⇒ «Duyệt xong» ⇒ **người giao** phải thấy thông báo) |
| 🔬 **ĐO THẬT END-TO-END (vòng 71 · `TEST-D39`)** | ⭐ Probe thật với **1 nhân viên `da_nv`** (admin giao việc ⇒ nhân viên cập nhật **% 45** ✅ ⇒ gửi kiểm tra ⇒ admin **Duyệt xong**) ⇒ đối chiếu `taskNotifications` trong payload `bootstrap`: 🔴 **người giao nhận 0 thông báo** ⇒ ⭐ **LỖI ĐÃ TÁI HIỆN ĐƯỢC TRÊN BẢN ĐANG CHẠY** = **bằng chứng lỗi là THẬT** (không phải suy đoán từ đọc mã). ⚠️ **Vì sao bản chạy vẫn lỗi**: probe đo được **proxy đang phục vụ đường JAVA** (`create_self_work_item` = HTTP 200 = action JAVA-ONLY) mà **bản Java đang chạy là bản CŨ** (⛔ chưa build mã của em) ⇒ ⏳ **mã sửa (Node+Java) CHƯA LÊN BẢN CHẠY** ⇒ `VERIFIED` **bắt buộc phải BUILD + restart** rồi chạy lại probe này (⚠️ nhất quán với việc 4 của user: «chờ S01 xong thì build») |
| ✅ **ĐỒNG THỜI (cùng probe)** | ⭐ **VIỆC 3 NAY `VERIFIED`**: nhân viên cập nhật **% = 45** ⇒ HTTP 200 + CSDL `progress=45` + tự chuyển `IN_PROGRESS` ✅ · ✅ `6b` (nhân viên nhận «Công việc mới») |

---

### 🔴 **BẰNG CHỨNG CỔNG PHÁT HÀNH ĐANG ĐỎ — `BUG-D06` (vòng 72 · ⛔ KHÔNG PHẢI CỦA PHIÊN 04, nhưng CHẶN GO-LIVE)**

| Trường | Nội dung |
|---|---|
| **LỆNH ĐÃ CHẠY** | `npm run test:release-static` (`scripts/release-static-gate.mjs` → `scripts/verify-full-release.mjs`) |
| 🔴 **KẾT QUẢ** | **KHÔNG ĐẠT** · ⚠️ `Error: Migration chain phải có đúng **353** file (0000..0352), nhận **393**.` ⇒ **THỪA 40 file** = ⭐ **ĐÚNG `BUG-D06`** (40 nhóm trùng số migration) |
| **PHẦN ĐẠT ĐƯỢC** | ✅ `FULL W2 SOURCE PREFLIGHT: ĐẠT · 5.3.0-MASTER-BASELINE-R1.1.1-FINAL-20260908 · Trust Development Mode` (preflight nguồn **XANH** ✅) |
| **VÌ SAO NẶNG** | ⚠️ Đây là **cổng tĩnh PHÁT HÀNH** ⇒ **go-live ⛔ không thể chốt** khi cổng này đỏ · ⚠️ **số file còn TĂNG theo thời gian** (mỗi lần chạy `gd-cycle` của BẤT KỲ phiên nào cũng **sinh thêm 1 migration identity** — ⭐ chính `DEC-D15` của phiên 04 đã cảnh báo) |
| **CHỦ SỞ HỮU** | ⭐ Chủ **`drizzle/**`** + **`scripts/verify-full-release.mjs`** (danh sách 40 nhóm trùng đã có ở `BUG-D06`/`HANDOFF-D06`) — ⛔ phiên 04 **không sở hữu** |
| ✅ **TIN TỐT (cùng vòng soát)** | ✅ `npm run audit:tests`: **162 tệp · 1003 ca** — **155 tệp XANH**; **7 tệp đỏ = ĐỀN ĐÃ BIẾT** (ngoài gate, `KNOWN_RED`) ⇒ ⭐ **bộ TRONG GATE = 154 tệp / 952 ca** (khớp hồi quy `952·951·FAIL 0`) ⇒ **bộ test LÀNH MẠNH** ✅ |
| **ĐỀ XUẤT** | ① Dừng sinh migration identity mới (`gd-cycle` chỉ khi cần) ② Gộp/dọn 40 nhóm trùng (**có kế hoạch**, ⛔ không xoá mù vì đã có `__mep_migrations` ghi khoá theo **tên đầy đủ**) ③ Cập nhật hằng `expectedMigrationCount` khi dọn xong |

---

## 🔴🔴 BUG-20261008-D14 (**LỆCH BỘ TRẠNG THÁI GIỮA 2 ĐƯỜNG — làm HỎNG nút «Yêu cầu làm lại» TRÊN BẢN CHẠY THẬT**) — ✅ **ĐÃ SỬA (vòng 74)**

| Trường | Nội dung |
|---|---|
| BUG_ID | `BUG-20261008-D14` |
| NGÀY / SESSION | 2026-10-08 · `ERP-SESSION-04` |
| MODULE | JOBS — trạng thái nhiệm vụ (`update_work_item_status`) |
| SEVERITY | 🔴 **HIGH — HỎNG CHỨC NĂNG USER ĐÃ YÊU CẦU trên bản đang chạy** |
| SOURCE | ⭐ **KIỂM CHÉO 2 ĐƯỜNG** sau khi `TEST-D39` phát hiện **proxy đang phục vụ đường JAVA** |
| PROBLEM | 🔴 **Java chỉ có `8` trạng thái**, ⛔ **thiếu `REWORK`** + **4 mã `WAITING_*`** ⇒ ⚠️ nút **«Yêu cầu làm lại»** (**việc 5** của user) và các **cột Kanban** gửi lên sẽ bị Java trả **400 «Trạng thái nhiệm vụ không hợp lệ»** ⇒ **hỏng trên bản chạy THẬT** (⛔ không phải chỉ là «Java chậm hơn Node») |
| ROOT_CAUSE | Hai đường **tiến hoá độc lập**: `scripts/system-route.mjs:260` = **12 mã** (`… WAITING_SUPPLIER/CLIENT/APPROVAL/PROJECT · REWORK …`); `OpsTaskManagementUseCase.java:23-24` = **8 mã** (có `WAITING` chung — mã ⛔ **FE không hề có**) ⇒ ⭐ lệch **cả hai chiều** |
| FIX | ✅ Thêm vào Java: **`REWORK`** + **`WAITING_SUPPLIER` · `WAITING_CLIENT` · `WAITING_APPROVAL` · `WAITING_PROJECT`** (giữ `WAITING` để ⛔ **không phá dữ liệu cũ**) · ✅ thêm 4 mã `WAITING_*` vào **`TASK_WAITING`** (Java) để **đồng bộ luật «phải có lý do»** với Node · ⭐ **sửa 1:1 ⇒ 0 dòng dịch** (`git diff` = `@@ -24,2 +24,2 @@`) |
| FILES_CHANGED | `java-backend/.../OpsTaskManagementUseCase.java` (2 dòng, 1:1) · `tests/t13-work-progress-cell.test.mjs` (**+1 test chống lệch**) · `app/screens/WorkCenter.tsx` (sửa **chú thích cũ** đã lỗi thời — 1:1) |
| TEST | ⭐ Test mới: **mọi mã trạng thái của Node PHẢI có trong Java** (đọc cả 2 tệp) ⇒ ⛔ chặn tái phát **vĩnh viễn** |
| REGRESSION | ✅ `javac` **EXIT 0** (72 tệp `domain`+`application`) · `tsc` = **0** · `t13` = **11/11 PASS** · hồi quy **`953 test · 952 pass · FAIL 0 · 1 skip`** ⭐ **0 LỖI** · tệp Java **868 dòng** (⛔ 0 dịch) |
| VERIFICATION | ✅ code + biên dịch + test; ⏳ **cần BUILD** để lên bản chạy rồi bấm thử «Yêu cầu làm lại» |
| STATUS | 🟢 **`FIXED`** (code + biên dịch + test) — ⏳ `VERIFIED` sau **BUILD** |
| RELATED_TASK | `TASK-20261008-D41` (việc 5) |
| RELATED_CHANGE | `CHG-D13` |

---

## ✅ **`BUG-D06` — ĐÃ SỬA PHẦN MÃ (vòng 75, USER UỶ QUYỀN «làm theo đề xuất»)** + ⚠️ **LỘ NGUYÊN NHÂN ĐỎ THỨ HAI**

| Trường | Nội dung |
|---|---|
| **USER UỶ QUYỀN** | ✅ User chốt: **«làm theo đề xuất»** cho `BUG-D06` (đề xuất của em: **(C) → (B) → (A nếu buộc)**) |
| ✅ **(B) SỬA CỔNG** | `scripts/verify-full-release.mjs`: **bỏ phép so `migrations.length === 353`** (bất khả thi khi có file trùng mã) ⇒ thay bằng **kiểm CHUỖI MÃ SỐ MẠNH HƠN**: mỗi mã `0000..head` phải có **≥1** file · ⛔ không vượt head · ⭐ **một mã chỉ được chứa TỐI ĐA 1 migration KHÔNG-identity** · head phải thuộc mã `head` ✅ |
| ⭐ **LUẬT MỚI ĐÚNG BẢN CHẤT (đo thật 40 nhóm)** | **38 nhóm** = cả hai đều `*_identity.sql` ✅ · **2 nhóm** = 1 file KHÔNG-identity + 1 identity ✅ (vd `0314`) · **0 nhóm** có >1 file KHÔNG-identity ⇒ ⛔ **vẫn CHẶN được lỗi thật** (2 migration schema cùng mã) ⇒ ⭐ **mạnh hơn phép đếm cũ**, ⛔ không nới lỏng |
| ⚠️ **(C) TỰ ĐÍNH CHÍNH + SỬA ĐÚNG** | ⚠️ Giả thuyết ban đầu «`gd-cycle` cấp số theo **số lượng file**» là **SAI** — mã thật (`tools/gd-cycle.mjs:34-36`) **đã dùng `maxN + 1`** ✅ ⇒ ⭐ **nguyên nhân thật = RACE**: **40/40 cặp có `mtime` LỆCH 0 GIÂY** (`10-01 16:53:13`) ⇒ hai phiên `gd-cycle` **ghi ĐỒNG THỜI**. ⭐ Đã thêm **chốt chống trùng** ngay trong `gd-cycle` (thay vì lock file): nếu số kế tiếp **đã tồn tại** ⇒ **NÉM LỖI** (chạy lại là an toàn, ⛔ không bao giờ ghi đè) |
| 🔴 **NGUYÊN NHÂN ĐỎ THỨ HAI (bị lỗi đếm che khuất) — ĐÃ TÌM RA + SỬA** | Sau khi (B) xong, cổng đi tiếp và đỏ ở: `SHA256 không khớp: _javac-verify/BOOT-INF/classes/…ApplicationBeansConfig.class` ⚠️ ⇒ ⭐ **`_javac-verify/`** = thư mục **giải nén Spring Boot để kiểm tra build** (405 file, **mtime 27/09/2026** — ⛔ **không phải của phiên 04**), và **`.gitignore:60` đã ghi `/_javac-verify/`** = **thư mục tạm, ⛔ không thuộc repo** ⇒ ⚠️ **nhưng `MANIFEST_SHA256.txt` (7611 dòng) lại chứa 384 dòng `_javac-verify/**`** ⇒ ⭐ **NGUYÊN NHÂN GỐC: `scripts/generate-release-manifest.mjs` thiếu `_javac-verify` trong `excludedTopDirs`** ⇒ ✅ **ĐÃ SỬA (thêm vào danh sách loại trừ — 1:1, cùng chính sách đã có với `.ai`/`.memsearch`)** |
| ⏳ **BƯỚC CÒN LẠI (⛔ KHÔNG tự làm — theo quyết định «chờ» của user)** | ⚠️ Phải **sinh lại `MANIFEST_SHA256.txt`** (bằng `scripts/generate-release-manifest.mjs`) — ⭐ việc này thuộc **bước BUILD/PHÁT HÀNH** (⛔ không làm lẻ, vì nó sẽ «đóng dấu» cả trạng thái đang dở của các phiên khác) ⇒ ⭐ **sau BUILD, cổng `test:release-static` sẽ XANH** |
| **REGRESSION** | ✅ `npm run test:regression` = **`953 test · 952 pass · FAIL 0 · 1 skip`** ⭐ **0 LỖI** (⛔ 2 tệp `scripts/**` sửa không làm đỏ gate nào) |
| **STATUS** | 🟡 **`FIXED` (phần mã)** — ⏳ `VERIFIED` sau khi **sinh lại manifest trong BUILD** |

---

## 🔴 BUG-20261008-D15 (**VIỆC 4 — «tự tạo việc» xong ⛔ KHÔNG THẤY việc**) — phát hiện **vòng 75** bằng probe E2E

| Trường | Nội dung |
|---|---|
| BUG_ID | `BUG-20261008-D15` |
| NGÀY / SESSION | 2026-10-08 · `ERP-SESSION-04` |
| MODULE | JOBS — «Tự tạo việc» (`create_self_work_item`) + phạm vi hiển thị `workItems` |
| SEVERITY | 🔴 **HIGH (góc nhìn người dùng)** — tạo xong **⛔ không thấy việc của chính mình** ⇒ tưởng như đã mất |
| SOURCE | ⭐ **Probe E2E mới** (`$env:TEMP\probe-viec4.mjs`) — kiểm **việc 4** trên **bản chạy thật (JAVA)** |
| PROBLEM | ✅ Nhân viên `da_nv` **TỰ TẠO ĐƯỢC**: `HTTP 200` · `«Đã tạo CVCN-261008-7629 cho chính bạn.»` ⇒ 🔴 **nhưng `bootstrap.workItems` của chính nhân viên đó = `0` việc** ⛔ **KHÔNG thấy việc vừa tạo** |
| ROOT_CAUSE (⏳ **CHƯA CHỐT — cần điều tra**) | ⚠️ Nghi vấn: phạm vi `workItems` của route **lọc theo phòng ban/dự án** (`workItemWhere`, `scripts/system-route.mjs:805-807`) mà việc tự tạo có `department_code = 'CN'` ⚠️ ⇒ **bị lọc mất** · ⚠️ đường **Java** dùng `AccessScopeService` (SELF/DEPARTMENT/COMPANY) ⇒ cần đo lại |
| IMPACT | ⚠️ Người dùng **mất dấu việc mình vừa tạo** (dù CSDL có) ⇒ hỏng trải nghiệm của **việc 4** (yêu cầu user) |
| NEXT_ACTION | ⭐ **Đo lại có hệ thống** (vòng sau): ① admin `bootstrap` có thấy `CVCN-261008-7629`? ② nhân viên `da_nv` khác có thấy? ③ so `workItemWhere` (Node) vs bộ lọc Java cho hàng `department_code='CN'` ⇒ rồi chốt root cause + sửa |
| FILES_CHANGED | ⛔ chưa sửa (mới ghi nhận) |
| STATUS | `OPEN` — ⚠️ **cần điều tra tiếp** (đã ghi vào todo) |
| RELATED_TASK | `TASK-20261008-D42` (việc 4) |

### ✅ **`BUG-D15` — ĐÃ TÌM RA NGUYÊN NHÂN + SỬA (vòng 76)** — *«tự tạo việc xong ⛔ không thấy việc»*

| Trường | Nội dung |
|---|---|
| 🔬 **ĐO THẬT (lần 2 — probe `probe-d15.mjs`)** | ✅ **ADMIN** (`1=1`) **THẤY** `CVCN-261008-7629` · `dept=CN` · `assignedTo=chính nhân viên` · `status=NEW` ⇒ ⭐ **việc CÓ THẬT trong hệ thống** · ❌ **NHÂN VIÊN đó (role `da_nv`, base `project`)** = **0 việc** (0 hàng `dept='CN'`) ⇒ ⛔ **bị ẩn khỏi chính người tạo** |
| 🎯 **ROOT_CAUSE (chứng minh bằng mã)** | `BootstrapDataAdapter` (đường **JAVA** — bản chạy thật) `:1570-1574`: `depForRole="DA"` ⇒ `WHERE = "(wi.department_code='DA' AND (wi.assigned_to=? OR EXISTS(…'da_truong')))"` ⇒ ⚠️ **việc `department_code='CN'` ⛔ KHÔNG BAO GIỜ khớp** (`scripts/system-route.mjs:805` có **y hệt** logic) ⇒ ⭐ **lỗi lặp ở CẢ 2 ĐƯỜNG** (lớp `BUG-D14`) |
| **FIX** | ⭐ **Luôn cho thấy «việc của CHÍNH MÌNH» TRƯỚC nhánh phòng ban**: `"(wi.assigned_to=? OR (wi.department_code='KH' AND (wi.assigned_to=? OR EXISTS(…))))"` + **bind thêm `userId`** — ⚠️ **⛔ không nới quyền** (vẫn chỉ `assigned_to = chính mình` ✅) |
| **FILES_CHANGED** | ✅ **CẢ 2 ĐƯỜNG**: `java-backend/.../BootstrapDataAdapter.java` (**3 nhánh KH/DA/BCH**, sửa **1:1 ⇒ 12 dòng → 12 dòng, ⛔ 0 dòng dịch**) · `scripts/system-route.mjs` (`:805-806`, **1:1** ⇒ `@@ -805,2 +805,2 @@`) · `tests/t13` (**+1 test khoá cả 2 đường**) |
| **TEST** | ⭐ Test mới: **mỗi nhánh `KH`/`DA`/`BCH` ở CẢ 2 ĐƯỜNG phải MỞ ĐẦU bằng `(wi.assigned_to=? OR (wi.department_code='…' AND (wi.assigned_to=?`** ⇒ ⛔ chặn tái phát |
| **REGRESSION** | ✅ **`node --check scripts/system-route.mjs` = 0** · ✅ ⭐ **`javac` RIÊNG `BootstrapDataAdapter.java` = EXIT 0** (biên dịch được tệp Java vừa sửa, dùng classpath `~/.m2` + sourcepath 3 module) · `tsc` **0** · `t13` **12/12** · hồi quy **`954 test · 953 pass · FAIL 0 · 1 skip`** ⭐ **0 LỖI** |
| ⚠️ **BẪY ĐÃ GẶP & SỬA** | ⚠️ Phép thay literal đầu tiên chỉ khớp **4/5** (thiếu mệnh đề **mở đầu nhánh BCH**) ⇒ ⚠️ tạm thời **bind thừa mà thiếu `?`** (bind mismatch!) ⇒ ✅ **đã phát hiện + sửa ngay** trong lượt kế tiếp (kiểm **số `?` khớp bind** ✅) — ⭐ bài học: **thay literal phải kiểm ĐỦ cặp «mở đầu + kết thúc»** |
| **STATUS** | 🟢 **`FIXED`** (code + biên dịch + test) — ⏳ `VERIFIED` **sau BUILD** (chạy lại `probe-d15`: nhân viên phải THẤY việc `CVCN-…` của mình) |
| RELATED_CHANGE | `CHG-D15` |

---

## ✅✅ **`P-08` — ĐÃ THI HÀNH (vòng 77, USER UỶ QUYỀN «làm theo đề xuất») — bản AN TOÀN, ⛔ KHÔNG theo §A/§B cũ**

| Trường | Nội dung |
|---|---|
| **USER** | ✅ «làm theo đề xuất» (đề xuất của em: đo cổng role TỪNG action trước — bài học `TM-04`) |
| 🔬 **BƯỚC 1 — ĐO (quyết định toàn bộ kế hoạch)** | ⭐ Đo 16/16 action: **route JS = `requireRole(user, ["admin"])`** (CHỈ ADMIN) · **Java chỉ `requireCurrentUser(request)`** (⛔ không có cổng role riêng) ⇒ **registry là cổng DUY NHẤT** |
| 🔴 **PHÁT HIỆN — ĐỀ XUẤT CŨ CỦA CHÍNH EM (`docs/47 §A/§B`) SAI** | ⚠️ Gắn module (`material_catalog`+`canEdit`…) cho các action này ⇒ **ai có `canUse`/`canEdit` ĐI QUA** ⇒ 🔴 **LEO THANG ×16** (⚠️ đúng bài học `TM-04`, nhân lên 16 lần) ⇒ ⛔ **KHÔNG ÁP §A/§B** |
| ✅ **BƯỚC 2 — ÁP (bản đúng)** | ① ⛔ **KHÔNG gắn module nào** (giữ `List.of()` = fail-closed ✅) ② ✅ **`RbacService.ADMIN_ONLY_ACTIONS`** = **18 action** (7 danh mục vật tư + 3 lịch trình duyệt + 2 tổ đội (`TM-04`) + 2 nhập hàng loạt + 4 cấu hình) ③ ✅ nhánh kiểm **đứng TRƯỚC nhánh `isCompanyLeadership`** ⇒ ⭐ **siết ĐÚNG bằng route JS** + **trả ĐÚNG thông điệp** («Tài khoản không có quyền thực hiện nghiệp vụ này.» 403) |
| ⚠️ **THAY ĐỔI HÀNH VI (báo cáo minh bạch)** | ⚠️ Trước đây `director`/`accountant` **đi qua** các action này (vì `List.of()` không chứa `"admin"` ⇒ nhánh học-vị bỏ qua) ⇒ ✅ **nay CHỈ `admin`** — ⭐ **khớp đúng route JS** (vốn đã chỉ admin) ⇒ ⭐ đây là **siết cho ĐÚNG**, ⛔ không phải nới |
| **FILES_CHANGED** | `java-backend/application/.../RbacService.java` (+32 dòng: Set 18 + nhánh kiểm) · `tests/t13` (**+1 test chống leo thang**, 13 assertion) · `docs/47` (**đính chính lần 2**: ⛔ §A/§B cũ chỉ còn giá trị lịch sử) |
| **TEST** | ⭐ 18 action: có trong `ADMIN_ONLY_ACTIONS` · **giữ `List.of()`** (⛔ không gắn module) · nhánh JS là `requireRole(["admin"])` · nhánh admin-only **đứng TRƯỚC** nhánh học-vị |
| **REGRESSION** | ✅ `javac` (domain+application) = **EXIT 0** · `tsc` **0** · `t13` **13/13** · hồi quy **`955 test · 954 pass · FAIL 0 · 1 skip`** ⭐ **0 LỖI** |
| ⚠️ **BẪY ĐÃ GẶP (test của em, ⛔ không phải lỗi mã)** | Test đầu khớp chuỗi **quá chặt** (`requireRole(user,["admin"])` — thiếu dấu cách) + cửa sổ 300 ký tự quá ngắn ⇒ ✅ sửa: **cắt ĐÚNG NHÁNH** (tới `action ===` kế tiếp) + regex **dung sai khoảng trắng** |
| **STATUS** | 🟢 **`FIXED`** (code + biên dịch + test) — ⏳ `VERIFIED` sau **BUILD** (chạy 5 phép thử API ở `docs/42 §4.2`, ⭐ có **đối chứng âm**) |

---

## 🔴 `BUG-20261008-D16` — **SỰ CỐ DO CHÍNH EM: probe gây TÁC DỤNG PHỤ ngoài ý muốn trên hệ thống dùng chung** (tự báo cáo, vòng 79)

| Trường | Nội dung |
|---|---|
| BUG_ID | `BUG-20261008-D16` (INCIDENT — ⭐ **tự phát hiện + tự báo cáo**) |
| SEVERITY | 🔴 **HIGH về QUY TRÌNH** (ghi lên hệ thống dùng chung) · 🟢 **LOW về THIỆT HẠI thực tế** (đã đo) |
| NGUYÊN NHÂN | ⚠️ **Giả định SAI của em**: «payload RỖNG thì mọi action đều TỪ CHỐI trước khi ghi» ⇒ **SAI với 3 action**: `save_email_settings` · `retry_email` · `save_ui_display_settings` (chúng **ghi trước/không cần dữ liệu**) |
| BẰNG CHỨNG | `verify-p08.mjs` gọi bằng **admin** ⇒ `save_email_settings` **HTTP 200** «Đã lưu cấu hình email…» · `retry_email` **200** «Đã xếp lại email…» · `save_ui_display_settings` **200** «Đã lưu giao diện hiển thị.» ⇒ ⚠️ **3 lệnh GHI đã chạy** |
| **ĐO THIỆT HẠI (chỉ đọc)** | `serverInfo` = `{backend:"java-clean-arch", database:"mysql"}` · `emailSettings` = `{enabled:false, smtpHost:null, username:null, senderEmail:null, baseUrl:null, passwordConfigured:0}` · `uiDisplaySettings` = `{theme:"light", language:"vi", dateFormat:"DD/MM/YYYY", updatedAt:"2026-10-08T15:46:25"}` (⭐ `updatedAt` = đúng lúc chạy ⇒ xác nhận có ghi) |
| **KẾT LUẬN THIỆT HẠI** | 🟢 **THẤP**: ⭐ **SMTP VỐN CHƯA CẤU HÌNH** (chứng cứ: `docs/dsh-state/CURRENT_STATE.md` REMAINING có mục **«SMTP»** = việc còn treo; `enabled=false`; `passwordConfigured=0`) ⇒ ⛔ **không mất cấu hình đang chạy** · ✅ `retry_email` ⛔ **không gửi được gì** (SMTP tắt) · ✅ `uiDisplaySettings` vẫn **giá trị hợp lý** (mặc định đúng) ⇒ ⛔ **không cần khôi phục** |
| **KHẮC PHỤC** | ✅ **Sửa script kiểm chứng** chỉ còn **2 action ⛔ AN TOÀN** (`bulk_import_projects` ⇒ 400 «File không có dự án để nhập» · `delete_material_category` ⇒ 400 «Không tìm thấy nhóm vật tư») — ⭐ **cả hai VALIDATE TRƯỚC KHI GHI** ✅ · ⛔ **ngừng mọi lệnh ghi** trên hệ thống dùng chung |
| ⭐ **BÀI HỌC (ghi để phiên sau ⛔ không lặp)** | ⚠️ **«payload rỗng» ⛔ KHÔNG đồng nghĩa «vô hại»**: phải **đọc mã/đo trước**, chỉ dùng action **validate-trước-khi-ghi** để thử cổng quyền; ⛔ **không thử cổng quyền bằng action có thể ghi** trên môi trường dùng chung |
| **STATUS** | ✅ **ĐÃ KHẮC PHỤC** (script an toàn) — ⏳ theo dõi: nếu sau này cần bật SMTP thì **cấu hình lại từ đầu** là đủ ✅ |

### 🟡 **`BUG-20261008-D13` (phát hiện vòng 68 — ⛔ KHÔNG sửa, ngoài phạm vi task)**: email «giao việc» ghi SAI tên ở bản TEXT
| Trường | Nội dung |
|---|---|
| PROBLEM | `queueTaskNotice` (`OpsTaskManagementUseCase.java`): bản **textBody** ghi *«Người giao: …»* bằng **`sv(contact,"fullName")` = tên NGƯỜI NHẬN** (`:258`) ⚠️ trong khi bản **htmlBody** ghi **ĐÚNG** `actor.fullName()` (`:266`) ⇒ 2 bản email **lệch nhau**, bản text ghi **sai người giao** |
| IMPACT | **LOW** (nội dung email, ⛔ không sai dữ liệu/luồng) — ⚠️ nhưng gây hiểu nhầm cho người nhận |
| FIX đề xuất | Đổi `:258` thành `+ "Người giao: " + actor.fullName() + "\n"` (**1 dòng 1:1 ⇒ 0 dòng dịch** ✅) — ⛔ em không tự sửa (ngoài phạm vi `BUG-D12`; ⭐ chờ user/owner quyết) |
| STATUS | ✅ **`FIXED`** (code + **BIÊN DỊCH 0 lỗi** bằng `javac` — xem khối «PHÁ VỮ BẾ TẮC» ở trên) · ✅ đã sửa `:258` ⇒ `actor.fullName()` (**1:1 ⇒ 0 dòng dịch**, `git diff` = `@@ -258 +258 @@`) · ✅ hồi quy **`952·951·FAIL 0`** (⛔ không test nào khẳng định chuỗi email cũ) |

---

## 🔴 P-08 — **ĐÃ THỬ ÁP VÀ **HOÀN NGUYÊN TOÀN BỘ** (vòng 69 · ⛔ **KHÔNG SHIP**) — vì **LEO THANG ĐẶC QUYỀN**

| Trường | Nội dung |
|---|---|
| **VIỆC ĐÃ LÀM** | Áp **21 phép thay 1:1** (12 module + 9 capability) theo `docs/47 §A/§B` bằng thay-thế **literal** (⛔ không regex), mỗi phép **kiểm khớp ĐÚNG 1 lần** ⇒ ✅ 21/21 · số dòng **598 → 598** (⛔ **0 dòng dịch** ✅ bài học F-03) |
| 🔴 **TEST BẮT ĐƯỢC** | **`TM-04` ĐỎ**: «capability + module của 3 action theo registry» ⇒ `tests/tm04-team-crud.test.mjs:62-77` (lý do ghi từ **23/09/2026**): `set_project_team_status` (`:1716`) · `delete_project_team` (`:1720`) ở route **`requireRole(["admin"])`** ⇒ ⛔ **PHẢI giữ `List.of()`** |
| **ROOT CAUSE (đã đọc mã)** | ⚠️ Gắn module `site_command` ⇒ **`commander`** (có `canUse`/`canEdit` của `site_command`) **ĐI QUA** cổng registry ⇒ ⭐ **ngừng/xoá được tổ đội trên đường Java** (vì `SystemController` kiểm action **TRƯỚC** khi use case gọi `requireRole` ⇒ registry là **cổng DUY NHẤT**). ⚠️ **Chính `docs/47` (do em soạn) là SAI ở 2 mục 8-9** |
| **KHẮC PHỤC** | ✅ **Hoàn nguyên 4 phép (2 tổ đội) → rồi hoàn nguyên TOÀN BỘ 17 phép còn lại** để ⛔ **không ship lỗ hổng nào khi chưa phân tích từng action** ⇒ `List.of()` về **67** · số dòng **598** · hồi quy **`952 test · 951 pass · FAIL 0 · 1 skip`** ⭐ **0 LỖI** (`TM-04` xanh lại) · 📐 `git diff --stat` của tệp còn **30+/2−** = **của PHIÊN KHÁC** (⛔ không phải của em) |
| ⭐ **BÀI HỌC** | ① **P-08 KHÔNG phải «dán patch»** — mỗi action phải **đo cổng role ở CẢ 2 route TRƯỚC**, chỉ gắn module khi mức đòi registry **≥** cổng role ② `List.of()` ⛔ **không** diễn đạt được «chỉ admin» (vì `RbacService:83` cho **director/accountant** qua **mọi** danh sách không chứa `"admin"`) ⇒ cần **§C** hoặc `List.of("admin")` ③ ⭐ **Thà lùi còn hơn ship lỗ hổng** (Goal: «NEVER CLAIM FALSE COMPLETION») |
| **STATUS** | 🔴 **`CANCELLED`** (đã hoàn nguyên) — P-08 giữ **`OPEN`**, **cần QUYẾT ĐỊNH NGHIỆP VỤ từng action** (đúng `CHECKLIST §MỐC 110 §8`) · ✅ `docs/47` **đã được đính chính** (cảnh báo đầu tệp) |

---

## 🔴 `BUG-20261008-D17` — BỘ SINH `generate-rbac-registry.mjs` **XOÁ 34 MỤC GHI TAY** (hồi quy NẶNG · tự phát hiện · đã vá)

| Trường | Nội dung |
|---|---|
| **NGÀY / PHIÊN** | 08/10/2026 · `ERP-SESSION-04` (`SESSION_D`) |
| **BỐI CẢNH** | Trong lúc làm **ma trận WORK động** (phương án A), tôi cần thêm khoá `work` vào registry Java ⇒ chạy `node java-backend/tools/generate-rbac-registry.mjs` với giả định **SAI** rằng registry là «**thuần** sinh tự động từ danh mục» |
| 🔴 **HẬU QUẢ ĐO ĐƯỢC** | `git diff --numstat` = **27 xoá / 229 đổi**. Các mục bị xoá gồm **2 nhóm nguy hiểm**: ① **Java-only** (`save_warehouse`, `issue_stock_confirm`, `confirm_stock_issue`, `create_issue_grn`, `create_transfer_grn`, `approve_stock_issue`, `save_notification_config`, `notification_configs`, `notification_log`, `delete_notification_config`, `set_notification_config_status`, `mark_notification_read`/`_snooze`/`_all_read`, `error_reports`, `mark_error_report_resolved`…) ② **BẢN VÁ CÓ TÀI LIỆU** (`Map.entry("approve_po", List.of("purchasing"))` của **TASK-135**, `create_project_team`→`site_command` của **MT2-P14-03c**, `save_error_report`) |
| 🔴 **TEST BẮT ĐƯỢC** | `tests/warehouse-modal-contract.test.mjs` **ĐỎ**: «KHO — 2 action khai ĐỦ ở CẢ HAI bảng RBAC» → `save_warehouse thiếu ở bảng MODULES` |
| ⚠️ **RỦI RO NẾU PHÁT HÀNH** | `approve_po` **quay lại 403 cho MỌI user không phải admin/C-level** (đúng lỗi **TASK-135** đã vá — mua hàng không duyệt được PO) ⇒ hồi quy **nghiệp vụ nặng**, ⛔ không chỉ là lỗi test |
| **CÁCH VÁ** | ① Khôi phục tệp về **đúng HEAD** bằng `git cat-file blob HEAD:<path>` (⛔ **KHÔNG** dùng `git checkout/reset/clean` — luật của phiên) ② Áp lại **2 thay đổi đúng chủ đích** bằng script có **kiểm khớp ĐÚNG 1 lần** (`probes/fix-registry-work.mjs`) ③ **Chốt chặn tận gốc** trong bộ sinh |
| **BẰNG CHỨNG VÁ** | `git diff --numstat` = **12 thêm / 7 sửa** (đúng chủ đích: 7 dòng action += `"work"` + `approve_work_item` modules/capability) · **34 mục ghi tay NGUYÊN VẸN** · `javac` registry = **0** · `warehouse-modal-contract` **6/6** · `t13` **15/15** |
| **CHỐT CHẶN ĐÃ THỬ** | Chạy lại bộ sinh ⇒ in «⛔ DỪNG: file hiện có **34 mục GHI TAY** ⛔ không có trong danh mục — bộ sinh sẽ XOÁ chúng» + `exit 1` · ✅ **hash tệp trước/sau KHÔNG ĐỔI** (đã so bằng `Get-FileHash`) |
| ⭐ **BÀI HỌC** | ① ⛔ **KHÔNG BAO GIỜ chạy bộ sinh trên tệp có sửa tay mà chưa `git diff` trước** ② «SINH TỰ ĐỘNG» trong chú thích mã ⛔ **không** bảo đảm tệp không có phần ghi tay — **đo trước, tin sau** ③ Bộ sinh ⛔ **phải** có cổng chặn mất dữ liệu, không dựa vào việc «người chạy nhớ» |
| **STATUS** | ✅ **FIXED** |

---

## 🔴 `BUG-20261008-D18` — TÁCH ACTION DUYỆT (`Q2-b`) LÀM **QUẢN LÝ PHÒNG MẤT QUYỀN DUYỆT** (tự phát hiện · đã vá bằng dữ liệu)

| Trường | Nội dung |
|---|---|
| **NGÀY / PHIÊN** | 08/10/2026 · `ERP-SESSION-04` (`SESSION_D`) |
| **NGUỒN GỐC** | Quyết định của user cùng ngày (**Q2-b**): «tách action mới + `canApprove`» — tôi đã thi hành (`approve_work_item` với capability `canApprove`) |
| 🔴 **HỒI QUY ĐO ĐƯỢC** | **Trước**: nút «Duyệt» đi qua `update_work_item_status` (**`canEdit`**) ⇒ `kh_truong`·`da_truong` (có `edit=1` trên cặp khoá của phòng mình) **duyệt được**. **Sau khi tách**: đi qua `approve_work_item` (**`canApprove`**) — mà đo `department_module_permissions`: **`can_approve=0`** ở **BCH·DA·HCPC·KH·TCKT** ⇒ **403** khi bấm «Duyệt» |
| **ĐỐI TƯỢNG ẢNH HƯỞNG** | Quản lý phòng **Kế hoạch** + **Dự án** (⚠️ admin/lãnh đạo ⛔ không bị vì đi nhánh `isAdmin`/`isCompanyLeadership` ⇒ **lỗi ẩn**, dễ tưởng «vẫn chạy») |
| **CÁCH VÁ** | `V40` §3 — cấp `can_approve=1` trên khoá `work` cho **ĐÚNG tập tài khoản đã duyệt được trước đây** = `role LIKE '%\_truong'` (**3 tài khoản**: `e2e.kh`·`trinhtrench`·`trdademo`). ⛔ **KHÔNG** cấp ở tầng phòng ban (tầng phòng ban ⇒ **mọi nhân viên trong phòng đều duyệt được**, SAI) |
| ⚠️ **LỖI TRONG BẢN NHÁP CỦA CHÍNH TÔI** | Bản nháp đầu **CHỈ có `UPDATE`** `user_module_permissions … WHERE module_key='work'` ⇒ vì `work` là khoá **MỚI** nên **0 dòng khớp** ⇒ hồi quy ⛔ **KHÔNG được bù** (đã sửa thành `INSERT … WHERE NOT EXISTS` + `UPDATE` phòng vệ) — ⭐ **tự phát hiện trước khi phát hành** |
| **BẰNG CHỨNG** | `user_module_permissions` 2772→**2775** (+3 dòng, `permission_source='manual_override'`) · đọc lại: `e2e.kh`/`trinhtrench`/`trdademo` có `can_approve=1` · chạy lại `V40` ⇒ số dòng **không đổi** (idempotent) |
| 📌 **CÒN TREO** | **TCKT·HCPC·NS·BCH** ⛔ chưa có chức danh `%_truong` ⇒ **chưa biết ai là trưởng phòng** ở các đơn vị đó ⇒ ⛔ **KHÔNG tự đoán** — đã ghi vào `MA_TRAN_WORK_DONG_20261008.md §6` để **user quyết** |
| **STATUS** | ✅ **FIXED** (phần đã biết) · ⏳ **1 phần CHỜ USER QUYẾT** (ai duyệt ở 4 đơn vị còn lại) |

---

## 🟠 `BUG-20261008-D19` — 2 NÚT HÀNG LOẠT SẼ **GHI 0 ÂM THẦM** CHO KHOÁ BỊ ẨN KHỎI MA TRẬN (⚠️ **CHẶN TRƯỚC KHI XẢY RA**)

| Trường | Nội dung |
|---|---|
| **NGÀY / PHIÊN** | 08/10/2026 · `ERP-SESSION-04` (`SESSION_D`) |
| **BỐI CẢNH** | User chốt «**ẩn**» 4 khoá cũ (`dept_plan_*`·`dept_project_*`) khỏi ma trận phân quyền (CHG-D20) |
| ⚠️ **PHÁT HIỆN (điều tra độc lập trước khi sửa)** | `PermissionAccessPanel`: `setAll` (`:211`) và `setColumnAll` (`:222`) lặp trên **`moduleKeys` = HỢP (danh mục ∪ dòng ma trận)** — tức **gồm CẢ khoá bị ẩn**. ⇒ Admin bấm **«□ Bỏ chọn tất cả»** hoặc bỏ tick ở **checkbox ĐẦU CỘT** sẽ **GHI 0** cho 4 khoá **⛔ không còn ô nào trên màn hình** ⇒ ⚠️ **mất quyền ÂM THẦM**, và cảnh báo «đang thay đổi ≥20 quyền» ⛔ **khó bắt** (chỉ dao động ±1 khoá) |
| 🔎 **TRẠNG THÁI THẬT** | ⚠️ **CHƯA từng xảy ra trên bản chạy** (ma trận TRƯỚC ĐÓ còn vẽ đủ 4 khoá ⇒ admin NHÌN THẤY ô tick) ⇒ đây là **lỗi TIỀM ẨN được chặn CÙNG LƯỢT** với việc ẩn — ⛔ **không phải** lỗi đang phát tác. Ghi log theo luật trung thực (`TEST_BEFORE_FIXED`/`NO_FAKE_STATUS`) |
| **CÁCH VÁ** | ① Thêm `bulkKeys = moduleKeys.filter(k => !MATRIX_HIDDEN_MODULE_KEYS.includes(k))` ② `setAll`/`setColumnAll` dùng `bulkKeys` ③ `setAll` đổi sang **MERGE** (`{...permissionState, ...Object.fromEntries(...)}`) để **GIỮ NGUYÊN** giá trị khoá ẩn ④ `columnState` tính trên `bulkKeys` (đầu cột phải phản ánh **đúng những gì admin THẤY**) |
| **BẰNG CHỨNG** | ✅ `tsc` **0** · ⭐ test **`v214` VỆ 8** (mới) khoá **4 bất biến**: ① đủ 4 khoá trong danh sách ẩn ② ẩn ở **tầng vẽ** (`visibleEntries`, ⛔ `entries` không đụng) ③ `permissionMatrixKeys` **⛔ KHÔNG** lọc theo danh sách ẩn (nếu lọc ⇒ **BỊ XOÁ** khi Lưu) ④ 2 nút hàng loạt + `columnState` dùng `bulkKeys`, **⛔ cấm** `moduleKeys.map` trong 2 hàm đó · ✅ hồi quy **`958 · 957 pass · FAIL 0`** |
| **STATUS** | ✅ **FIXED** (⏳ live sau BUILD) — ⚠️ **bài học**: khi ẨN một dòng khỏi màn hình quản trị, **luôn** phải rà **mọi nút HÀNG LOẠT** (chọn/bỏ tất cả, tick đầu cột/dòng) vì chúng thường lặp trên **tập khoá ĐẦY ĐỦ**, ⛔ không phải tập đang hiện |

---

## 🔴 `BUG-20261008-D20` — CỔNG `probe-catalog-drift` **ĐỎ nhưng BỊ CHE** + in **SỐ CỨNG SAI** (phát hiện nhờ vá `BUG-D17`)

| Trường | Nội dung |
|---|---|
| **NGÀY / PHIÊN** | 08/10/2026 · `ERP-SESSION-04` (`SESSION_D`) |
| **PHÂN LOẠI** | `HIGH` (cổng kiểm hợp đồng RBAC — thuộc nhóm cổng chặn go-live) · nguồn: **tự phát hiện** |
| 🔴 **VẤN ĐỀ 1 — ĐỎ BỊ CHE** | `tools/probe-catalog-drift.mjs` so **danh mục (sinh từ JS)** với **`ActionRbacRegistry.java`**. Danh sách `KNOWN_JAVA_ONLY` có **29** tên, nhưng registry có **34** action ngoài nguồn JS ⇒ **7 tên CHƯA BIẾT** ⇒ cổng **ĐỎ (exit 1)**: `error_reports` · `manage_contract_review` · `mark_error_report_resolved` · `request_supplement` · `save_error_report` · `save_warehouse` · `set_warehouse_status` |
| ⭐ **VÌ SAO BỊ CHE (đây là phần quan trọng)** | Trước đó tôi chạy bộ sinh `generate-rbac-registry.mjs` ⇒ nó **XOÁ 34 mục ghi tay** (`BUG-D17`) ⇒ `onlyRegistry` **RỖNG** ⇒ cổng in «ĐÃ BIẾT **0/29** · CHƯA BIẾT **0**» và **KẾT LUẬN XANH** ⇒ ⚠️ **XANH GIẢ**: cổng kiểm tính toàn vẹn của dữ liệu ⛔ **không thể** phát hiện khi chính dữ liệu đó **đã bị xoá** ⇒ **tự vô hiệu** |
| 🔴 **VẤN ĐỀ 2 — SỐ CỨNG SAI** | Câu kết luận in **«12 action Java-only»** (chuỗi cứng) trong khi **ĐO ĐƯỢC 34** ⇒ ⚠️ người đọc tin «12» ⇒ ⛔ **không rà tiếp** |
| **ĐIỀU KIỆN WHITELIST (đã kiểm TỪNG TÊN — ⛔ không thêm mù)** | ① có `Map.entry("<action>", …)` **THẬT** trong `ActionRbacRegistry.java` (kèm chú thích + module ánh xạ: `save_warehouse`/`set_warehouse_status` → `inventory`+`central_warehouse` · `save_error_report` → `List.of()` · `error_reports`/`mark_error_report_resolved` → `admin` · `request_supplement` → `approvals` · `manage_contract_review` → `dept_legal_contract_review`) ② ⛔ **KHÔNG xuất hiện lần nào** trong `scripts/system-route.mjs` (ĐO: **7/7 tên = 0 lần**) ③ đối chiếu tổng: **34 = 27 đã biết + 7 tên này** (khớp tuyệt đối) |
| **CÁCH VÁ** | ① Thêm **7 tên đã kiểm** vào `KNOWN_JAVA_ONLY` **kèm chú thích điều kiện whitelist** (để phiên sau ⛔ không thêm mù) ② Câu kết luận in **SỐ ĐỘNG** `${onlyRegistry.length}` (⛔ bỏ chuỗi cứng «12») |
| **BẰNG CHỨNG** | ✅ Trước: `CHƯA BIẾT: 7` + **exit 1** ⇒ Sau: `ĐÃ BIẾT 34/36 · CHƯA BIẾT 0` + **exit 0** · ✅ câu kết luận nay in **«34 action Java-only»** (đúng số đo) · ✅ `probe-action-parity` **exit 0** (parity JS↔Java **0 thiếu**) |
| **STATUS** | ✅ **FIXED** (cổng XANH trở lại **một cách TRUNG THỰC** — ⛔ không nới điều kiện kiểm: `pass` vẫn đòi `unknownJavaOnly.length === 0` + `catalogHasExtra === false`) |
| **RELATED** | `BUG-D17` (bộ sinh xoá mục ghi tay — nguyên nhân khiến cổng bị che) · `CHG-D22` |

---

## 🟠 `BUG-20261008-D22` — **6 ACTION «MÙ QUYỀN»** (⛔ không có dòng nào trong `ActionRbacRegistry`) — phát hiện khi QUÉT LẠI TOÀN BỘ CỔNG

| Trường | Nội dung |
|---|---|
| **NGÀY / PHIÊN** | 08/10/2026 · `ERP-SESSION-04` (`SESSION_D`) · **nguồn: tự phát hiện** khi quét cổng (`probe-action-registry-coverage`) |
| **SEVERITY** | `MEDIUM` — ⚠️ **chưa chặn người dùng hôm nay** (⚠️ `probe-action-coverage-controller` ĐO: **0 action UI gọi sẽ hỏng** ⇒ 6 action này ⛔ **chưa được UI gọi**) nhưng là **lỗ tiềm ẩn cùng lớp `P-08`** |
| **VẤN ĐỀ** | 6 action dispatch ở controller nhưng ⛔ **KHÔNG có `Map.entry(...)`** trong `ActionRbacRegistry` ⇒ `RbacService.modulesFor()` trả `List.of()` (mặc định) + ⛔ không nằm trong `ADMIN_ONLY_ACTIONS` ⇒ **mọi tài khoản không phải admin nhận 403 với THÔNG ĐIỆP SAI** («Thao tác chưa được khai báo quyền trong hệ thống. Liên hệ quản trị viên.») trong khi bản chất là «chưa khai quyền cho action này» |
| **DANH SÁCH (ĐO ĐƯỢC)** | ① nhóm **«Review HĐ»** (`dept_legal_contract_review`): `list_contract_review` · `open_contract_review` · `save_contract_review` · `log_contract_review` · `delete_contract_review` ② ⭐ **`work_scope`** — payload «phạm vi xem/giao theo cấp» của `WorkScopeService` (**liên quan trực tiếp vùng WORK**) |
| **BẰNG CHỨNG** | ✅ Đã đối chiếu **từng tên**: **6/6 ⛔ KHÔNG có** `Map.entry("<action>", …)` trong `ActionRbacRegistry.java` (grep âm) · ✅ `probe-action-registry-coverage` = **exit 1** với mục «④ ⛔ MÙ QUYỀN … 6» · ✅ **KHÔNG do thay đổi của phiên 04**: 8 action WORK đã sửa **xuất hiện 0 lần** trong danh sách lệch của `probe-action-module-parity` |
| **ĐỐI CHỨNG NỘI BỘ (bất nhất quán trong CÙNG một tính năng)** | ⚠️ Action anh em **`manage_contract_review` CÓ** module `dept_legal_contract_review` (dòng ghi tay) ⇒ cùng nhóm «Review HĐ» mà **5 action mù quyền + 1 action có quyền** ⇒ dấu hiệu **thiếu sót khi thêm tính năng**, ⛔ không phải chủ ý |
| **CÁCH VÁ ĐỀ XUẤT** | ① Nhóm Review HĐ → thêm registry: `list/open` → `dept_legal_contract_review` + **canView** · `save/log` → **canCreate**/**canEdit** · `delete` → **canEdit** (⚠️ theo đúng chuẩn `docs/47`/`P-08`: ⛔ KHÔNG gắn module cho action mà route JS đòi `requireRole(["admin"])`) ② `work_scope` → khoá **`work`** + **canView** (đọc phạm vi CỦA CHÍNH MÌNH ⇒ đúng ngữ nghĩa; ⚠️ hoặc `List.of()` + đưa vào `PUBLIC_ACTIONS` nếu coi là dữ liệu tự phục vụ như `update_profile_signature`) |
| **TRẠNG THÁI** | ✅ **`VERIFIED` (08/10/2026 · 3 cổng XANH — chi tiết ở `EVENT_LOG` vòng 92 + `TEST_LOG` TEST-D55)** — 📤 **theo `HANDOFF-D14` đã ghi** (`java-backend/**` **đã `RELEASED`** và phiên 01 đang chuẩn bị BUILD) ⇒ 📤 **đã ghi `HANDOFF-20261008-D14`** |
| **RELATED** | `P-08` (18 action cùng lớp đã vá) · `docs/47` (tiền lệ) · `probe-action-registry-coverage` |

---

# ✅ NGHIỆM THU **LIVE** 08/10/2026 (vòng 85 · `ERP-SESSION-04`) — PHẠM VI ĐỘNG CÔNG VIỆC **ĐẠT TRÊN BẢN ĐANG CHẠY**

> ⭐ **PHÁT HIỆN QUAN TRỌNG VỀ MỐC BUILD**: tiến trình Java (**PID 10888**) khởi động **đúng `10-09 12:39:04`** chạy `web\target\vntech-erp-web-0.1.0-SNAPSHOT.jar` (**build cùng thời điểm**) ⇒ jar này **SAU** sửa `BootstrapDataAdapter.java` của tôi (**12:34:29**) ⇒ ⭐ **thay đổi phạm vi động ĐÃ CÓ HIỆU LỰC THẬT** — ⛔ **không cần chờ BUILD FE** cho phần Java/CSDL (⚠️ BUILD FE chỉ còn cần cho **giao diện ma trận**).

| Nội dung | Bằng chứng ĐO ĐƯỢC (probe `SESSION_D/probes/probe-nghiem-thu-pham-vi-dong.mjs` · **exit 0**) |
|---|---|
| ⭐ **① «việc của tất cả nhân viên thì GIÁM ĐỐC xem được»** | `giamdoc.demo` (director) thấy **19 việc = ĐÚNG BẰNG admin** · ⚠️ **luật CŨ sẽ chỉ ≈0** (đo CSDL: giám đốc **được giao 0 việc**, ⛔ không có chức danh `%_truong`) ⇒ ✅ **yêu cầu user ĐẠT** |
| ⭐ **② «việc của nhân viên thì TRƯỞNG PHÒNG phòng đó xem được»** | `trdademo` (`da_truong`) thấy **17 việc = ĐÚNG số việc phòng DA (17)** và **≤ giám đốc (19)** ⇒ ✅ **đúng phạm vi phòng, ⛔ không tràn** |
| ⭐ **③ «việc của user nào thì user đó xem»** | `nvkhdemo` (`kh_nv`) = **0** · `ksda.demo` (`ksda`) = **0** — đúng số việc **được giao của chính họ (0)** |
| ➕ **ĐỐI CHỨNG ÂM 1** | nhân viên (**0**) **<** giám đốc (**19**) ⇒ ⛔ **KHÔNG** bị mở toàn công ty |
| ➕ **ĐỐI CHỨNG ÂM 2** | trưởng phòng DA (**17**) **≤** giám đốc (**19**) ⇒ ⛔ không leo thang lên toàn công ty |
| ✅ **Khoá `work` sống trong payload** (nhánh lãnh đạo + cấp theo người) | `giamdoc.demo` **77 module** có `work` (`view=1/use=1/approve=1`) · `trdademo` **61 module** có `work` ✓ · `moduleCatalog` **có `work`** ✓ (⇒ migration `V40` **hiệu lực thật**) |
| ✅ **Quyền duyệt của trưởng phòng** (`BUG-D18`) | ĐO CSDL: **đúng 3 tài khoản `%_truong`** có `work.canApprove=1` (`e2e.kh` · `trinhtrench` · `trdademo`) ⇒ ⭐ bù hồi quy **đã vào bản chạy** |
| ⚠️ **BÀI HỌC ĐO ĐƯỢC (phương pháp)** | Payload ứng dụng ⛔ **KHÔNG** phải `POST {action:"bootstrap"}` (**HTTP 400**) mà là **GET `/api/system`** — đúng như UI gọi (`app/page.tsx:345`). ⚠️ **Probe đầu tiên của tôi đo SAI CÁCH GỌI** ⇒ suýt kết luận sai «hỏng»; sửa theo đúng đường UI ⇒ **ĐẠT**. 📌 Luật rút ra: **khi probe báo đỏ, kiểm CÁCH GỌI trước khi kết luận mã hỏng** |

## Trạng thái sau nghiệm thu (`VERIFIED` = FIXED + ĐO LẠI — luật §24)

| Hạng mục | Trạng thái |
|---|---|
| **Phạm vi động công việc** (3 yêu cầu user + 2 đối chứng âm) | ✅ **`VERIFIED` (LIVE)** |
| Migration `V40` + khoá `work` (catalog + cấp theo người) | ✅ **`VERIFIED` (LIVE)** |
| `BUG-D18` — quyền duyệt của trưởng phòng | ✅ **`VERIFIED` (LIVE — ĐÃ E2E)**: ⭐ trưởng phòng DA `approve_work_item` = **HTTP 200** «Đã chuyển … sang COMPLETED» + ➕ **đối chứng âm** nhân viên = **403** (probe `probe-nghiem-thu-duyet-cong-viec.mjs` · **exit 0** 4/4) |
| **Giao diện ma trận** (ẩn 4 khoá cũ + dòng «Công việc (mọi phòng ban)») | ⏳ **`FIXED`** — ⛔ **chưa `VERIFIED`**: `dist/` = **10-08 16:13:31** < sửa FE **10-09 12:40:20** ⇒ phải **BUILD FE** (⏳ chờ user quyết vân tay) |
| `BUG-D20`/`D21`/`D22` · `CHG-D22`/`D23` | ⏳ `FIXED` — ✅ đã có test + cổng xanh (⛔ chưa có phần nào cần BUILD để `VERIFIED`, ⚠️ trừ `D23` cần build API) |
| ⭐ **`BUG-D19`** — «ẩn 4 khoá cũ» có thể **ghi 0 ÂM THẦM** cho khoá ẩn | ✅ **`VERIFIED` (vế dữ liệu · ĐO BẰNG HÀM THẬT + DỮ LIỆU THẬT)**: `TEST-D53` (`verify-an-khong-mat-quyen.mjs`, **exit 0** 6/6) — nhập **hàm thật** `permissionMatrixKeys` + hằng số thật, chạy trên payload thật: **tập khoá GỬI LÊN = 77** và **đủ 4/4 khoá ẩn** ⇒ `save_user_access` (FULL-REPLACE) ⛔ **KHÔNG xoá** ⇒ ⭐ **không mất quyền** ✓ ⏳ còn **vế vẽ dòng** (xác nhận bằng mắt sau BUILD, đã khoá tĩnh bằng `v214` VỆ 8) |

---

## 🟠 `BUG-20261008-D24` — **UI NÓI SAI với người dùng**: «Nhận xét sẽ bật sau khi backend hoàn tất…» trong khi **BE ĐÃ XONG**

| Trường | Nội dung |
|---|---|
| **NGÀY / PHIÊN** | 08/10/2026 · `ERP-SESSION-04` (`SESSION_D`) · **nguồn: tự phát hiện** khi rà `WorkCenter.tsx` để vá `HANDOFF-D13①` |
| **SEVERITY** | `MEDIUM` (⚠️ **thông tin sai cho người dùng** + ⚠️ **giữ một tính năng ĐÃ SẴN SÀNG ở trạng thái TẮT**) — ⛔ không phải lỗi an ninh/dữ liệu |
| **VẤN ĐỀ** | Modal chi tiết công việc có dòng: «*Nhận xét sẽ bật sau khi backend hoàn tất phần bình luận công việc — hiện ⛔ chưa mở nút để tránh bấm vào là lỗi.*» + chú thích mã: «*BE Java ⛔ CHƯA có handler `add_work_item_comment` (gọi vào trả **400**)*» ⇒ ⚠️ **CẢ HAI nay SAI** |
| **BẰNG CHỨNG ĐO ĐƯỢC (E2E LIVE)** | ⭐ `add_work_item_comment` = **HTTP 200** — «Đã thêm bình luận vào **CV-DA-261009-3020**» · ➕ **đọc lại** trong payload: **1 bình luận** («*[PROBE D12-S4] kiem chung BE da co handler*», bởi *Quản trị viên VNTECH*) ⇒ **BE đã có handler, đã chạy, đã lưu** ✓ · ⚠️ ĐỐI CHỨNG: gọi với `workItemId` **không tồn tại** ⇒ **400** («không tìm thấy nhiệm vụ») — ⛔ **không phải 404** ⇒ chứng tỏ **action CÓ tồn tại** (⚠️ chính mã 400 này là bằng chứng cũ bị hiểu nhầm thành «chưa có handler») |
| **ROOT CAUSE** | Cổng canary cũ (`COMMENTS_READY = false`) được thay bằng **dòng thông báo + chú thích**, dựa trên **phép đo tại thời điểm đó** (BE chưa port). Khi `ERP-SESSION-01` **port xong** (`SystemController.java:1510`), ⚠️ **không ai cập nhật lại FE** ⇒ ghi chú/điều kiện cũ **mục nát** (stale) — đúng loại «kỳ vọng cũ» đã gặp 3 lần ở các probe |
| **FIX** | `CHG-D25`: **BẬT LẠI** phần bình luận (danh sách + ô gửi) — theo luật dự án `docs/55:205`; gỡ dòng thông báo ⛔ sai + chú thích cũ; ⛔ không thêm CSS mới (**ngân sách CSS đã vượt trần**) |
| **KIỂM** | ✅ `tsc` **0** · `t13` **17/17** (test `C` khoá: ⛔ cấm tái xuất hiện `work-comment-pending` và câu «BE Java ⛔ CHƯA có handler»; **bắt buộc** có danh sách + ô gửi + gọi **đúng** `add_work_item_comment`) · `t07` **8/8** |
| **DỮ LIỆU THỬ ĐỂ LẠI** | 1 bình luận `WCM_d778e705-36f8-43d7-a9e3-91848631c9a0` trên chính **việc thử** của tôi (`WI_2f87008b-…`, đã `CANCELLED`) ⇒ ⛔ vô hại |
| **STATUS** | ✅ **FIXED** (⏳ **hiện ra màn hình sau BUILD FE** — ⚠️ ⛔ chưa `VERIFIED` theo §24) |
| **RELATED** | `docs/55:205` (luật «BE xong ⇒ BẬT») · `HANDOFF-D12` (nay **ĐÓNG**) · `TEST-D48` (cùng cách đo E2E) |

---

## 🟠 `BUG-20261008-D23` — **LỆCH 2 ĐƯỜNG: đường JS HARDCODE `["KH","DA"]`** khi giao việc (đường Java thì ĐỘNG)

| Trường | Nội dung |
|---|---|
| **NGÀY / PHIÊN** | 08/10/2026 · `ERP-SESSION-04` (`SESSION_D`) · **nguồn: tự phát hiện** khi đọc handler để viết probe e2e |
| **SEVERITY** | `MEDIUM` — ⚠️ **đường JS ⛔ KHÔNG phải đường đang chạy** (`:9000` phục vụ **Java**) ⇒ ⛔ chưa ảnh hưởng người dùng, ⚠️ nhưng là **lệch hợp đồng 2 đường** + ⭐ **đúng lớp «hardcode phòng ban»** mà user đã phản đối |
| **VẤN ĐỀ** | `scripts/system-route.mjs:1262` — `if(!["KH","DA"].includes(department)) throw new Error("Phòng ban…")` ⇒ trên đường JS **chỉ giao được việc cho 2 phòng KH/DA**, trong khi công ty có **11 đơn vị** (ĐO CSDL: BGD·DA·HCPC·BCH·E2E-BCH-01·E2E-DIAG-BCH·KH·NS·TCKT·VNTECH·VNTECH-01) |
| **ĐỐI CHIẾU ĐƯỜNG JAVA (đang chạy)** | ✅ **ĐỘNG**: `OpsTaskManagementUseCase` gác bằng **luật theo CẤP BẬC** (`system_level_catalog`, ngưỡng **30 = `truong_phong`**) + quyền module ⇒ ⭐ **nghiệm thu LIVE chứng minh**: `trdademo` giao việc phòng **DA** = **HTTP 200** (`TEST-D48`) |
| **TÁC ĐỘNG** | 🔴 Nếu đường JS được dùng lại (fallback/cutover ngược) thì **8/11 đơn vị ⛔ không giao được việc** ⇒ ⚠️ rủi ro go-live |
| **CÁCH VÁ ĐỀ XUẤT** | Bỏ danh sách cứng ⇒ **tra ĐỘNG** từ `organization_units` (như đã làm cho phạm vi `work`) **hoặc** chuyển sang luật cấp bậc như Java. ⚠️ **BẮT BUỘC 0 dòng dịch** (`:1262` nằm **ngoài** vùng khoá `F-03` `:1359-:2164` nhưng sửa nó vẫn **dịch số dòng** của vùng khoá ⇒ phải vá **trên cùng 1 dòng**) |
| **TRẠNG THÁI** | ✅ **FIXED** (`CHG-D24` · 08/10/2026) — ⭐ **user đã cho phép tự thực hiện việc trong phạm vi phiên** ⇒ đã vá **12 dòng, ⛔ 0 dòng dịch** (tệp vẫn **3452** dòng) · ✅ `node --check` **0** · `t13` **16/16** (+1 test `B`) · `t07` **8/8** · ⭐ hồi quy **`959 · 958 pass · FAIL 0`** · ✅ **SQL chạy THẬT trên CSDL** (không rò phòng khác) · ➕ 📤 **`HANDOFF-D15`** → `ERP-SESSION-03`: **2 bản sao ở FE vẫn suy trưởng phòng theo `role` CỨNG** (`WorkCenter.tsx` khối `T06-PURE` · `WorkKanban.tsx:110 kanbanManagerDepartments`) ⇒ ⚠️ cần đồng bộ với luật động mới của backend (⚠️ t07 hiện vẫn **8/8** vì nó so **2 bản sao FE với nhau**) |

---

## 🔴 `BUG-20261009-D27` — **PAYLOAD `workItems` ⛔ KHÔNG LỌC `active`** ⇒ **việc ĐÃ XOÁ MỀM vẫn HIỆN** (làm nút «Xoá» của `W3` trông như ⛔ KHÔNG có tác dụng)

| Trường | Nội dung |
|---|---|
| **NGÀY / PHIÊN / NGUỒN** | `2026-10-09 15:14:10` · `ERP-SESSION-04` (`SESSION_D`) · ⭐ **tự phát hiện** khi nghiệm thu `W2`/`W3` trên **payload THẬT** (probe `verify-w2-w3-tren-payload-that.mjs`) |
| **SEVERITY** | `HIGH` — ⚠️ **số liệu SAI** + ⭐ **tính năng vừa làm (W3) bị VÔ HIỆU về mặt hiển thị** (xoá xong việc **vẫn nằm trên màn**) · ⛔ **KHÔNG phải CRITICAL** (⛔ không mất dữ liệu · ⛔ không lỗ hổng quyền · ⛔ không sập hệ thống) |
| **VẤN ĐỀ** | Câu `SELECT` nguồn `workItems` (**CẢ 2 ĐƯỜNG**) có `SELECT … wi.active` nhưng **mệnh đề `WHERE` ⛔ KHÔNG có điều kiện `wi.active=1`** ⇒ mọi dòng **đã XOÁ MỀM** (`active=0`) **vẫn được trả về** cho giao diện |
| **BẰNG CHỨNG ĐO ĐƯỢC** | ① Probe: payload `admin` = **21** việc nhưng CSDL `active=1` = **22** · `active=0` = **7** ⇒ ⭐ **7 dòng `active=0` NẰM TRONG payload** (đo từng mã: `CV-DA-260917-6690/6847/7918/8934` · `CV-DA-260925-3305` · `CV-DA-261009-3020/9740` — **tất cả `status=CANCELLED` + `active=0`**) ② CSDL: `active=0` = **7** · **7/7 đều `CANCELLED`** (⇒ `active` chỉ được đặt 0 khi **XOÁ MỀM**) ③ Dòng `active=0` ⛔ **không** bị loại ở bất kỳ tầng nào khác (FE chỉ đọc `data.workItems`) |
| **ROOT CAUSE (đo từ mã — ⛔ không suy đoán)** | ① **Đường JS** `scripts/system-route.mjs:807`: `… WHERE \ ORDER BY CASE WHEN wi.status IN ('COMPLETED','CANCELLED') THEN 1 ELSE 0 END …` ⇒ ⛔ **thiếu** `wi.active=1` ② **Đường JAVA (đang chạy)** `BootstrapDataAdapter.java:1610`: `WHERE %s` (`%s` = `workItemWhere`) ⇒ ⛔ **thiếu** `wi.active=1` ⇒ ⭐ **2 đường CÙNG thiếu** (lỗi đối xứng, ⛔ không phải lệch đường) |
| **TÁC ĐỘNG NGƯỜI DÙNG** | ① ⚠️ **W3 mới thêm (`CHG-D28`)**: bấm «Xoá» ⇒ máy chủ **200 + xoá mềm đúng** ⇒ `refresh()` ⇒ ⭐ **dòng ⛔ KHÔNG biến mất** ⇒ người dùng tưởng **nút hỏng** (⚠️ nghiêm trọng về niềm tin, ⛔ không hỏng dữ liệu) ② Số đếm **phồng**: tab «Của tôi»/«Đã giao»/Dashboard + ⭐ **nhóm «Theo người» của W2** đều tính cả việc đã xoá (đo: 7/21 dòng của admin = **33%**) ③ Việc đã xoá hiện `StatusBadge` «Đã huỷ» ⇒ ⚠️ gây hiểu nhầm «đã huỷ» vs «đã xoá» |
| **CÁCH VÁ ĐỀ XUẤT (1 mệnh đề/đường)** | ① JS: `WHERE (\) AND wi.active=1` ② Java: `WHERE (%s) AND wi.active=1` ⚠️ **BẮT BUỘC** giữ **0 dòng dịch** (JS: ngân sách `F-03`; Java: sửa **trên cùng dòng**) · ⚠️ kèm **đối chứng DƯƠNG**: việc `active=1` **phải còn** (⚠️ ⛔ đừng lọc luôn `COMPLETED` — chúng có `active=1` và **phải hiện**) |
| **PHẠM VI / CHỦ SỞ HỮU** | ⚠️ `java-backend/**` = **`ERP-SESSION-01`** (đường đang chạy) · `scripts/**` = ⚠️ **đang trong lượt build của S01** ⇒ ⭐ **⛔ tôi KHÔNG tự sửa** (luật §7/§18 + đang `RELEASED`) ⇒ 📤 **`HANDOFF-20261009-A15`** |
| **⛔ ĐÍNH CHÍNH GHI CHÚ CŨ (quan trọng — mọi phiên đọc)** | ⚠️ `TEST-20261008-D51` (và `SHARED_STATE`) từng ghi: «*2 hàng thử `CANCELLED` + `active=0` ⇒ ⛔ **vô hại** (⛔ không hiện ở màn/danh sách vì `active=0`)*» ⇒ 🔴 **CÂU ĐÓ SAI** — **phép đo hôm nay phủ định**: `active=0` **VẪN HIỆN** (vì `WHERE` ⛔ không lọc `active`) ⇒ ⭐ **bài học: «cờ `active` có trong câu SELECT» ⛔ KHÔNG đồng nghĩa «đã được LỌC»** ✓ |
| **STATUS** | 🔴 `OPEN` — ⏳ **chờ `ERP-SESSION-01`** (họ sở hữu `java-backend/**` + đang chạy chuỗi build) · ⚠️ ⛔ **chưa** `FIXED`/`VERIFIED` (⛔ không tự nhận) |
| **RELATED** | `HANDOFF-20261009-A15` · `CHG-D28` (W3) · `CHG-D27` (W2) · `TEST-20261009-D61` · `verify-w2-w3-tren-payload-that.mjs` |

## 🟡 `BUG-20261009-D28` — **8 việc `active=1` trỏ tới NGƯỜI KHÔNG TỒN TẠI** (rác dữ liệu ⇒ ⛔ vô hình với mọi người)

| Trường | Nội dung |
|---|---|
| **NGÀY / PHIÊN / NGUỒN** | `2026-10-09 15:14:10` · `ERP-SESSION-04` · phát hiện phụ khi truy nguyên `BUG-D27` (so `payload` ↔ CSDL) |
| **SEVERITY** | `LOW` — đây là **rác dữ liệu thử**, ⛔ không ảnh hưởng người dùng (bị loại khỏi payload bởi `JOIN users`) |
| **BẰNG CHỨNG** | `orphan assigned_to = 8` · `orphan assigned_by = 8` (SQL **chỉ đọc**) — **8 mã `CVCN-2609…`** (`CVCN-260919-0314`·`-7476` · `CVCN-260925-3170`·`-4033`·`-4052`·`-4425`·`-5693`·`-8651`) · `dep=CN` · **`title='x'`** ⇒ ⭐ **dấu hiệu rõ của dữ liệu SEED/thử** |
| **VÌ SAO BỊ VÔ HÌNH** | Câu `SELECT` có `JOIN users ua ON ua.id=wi.assigned_to` ⇒ dòng trỏ user ⛔ không tồn tại **bị loại khỏi payload** (⇒ ⛔ không ai thấy, ⛔ không tính vào số nào) |
| **CÁCH XỬ LÝ ĐỀ XUẤT** | ⚠️ **KHÔNG tự xoá** (luật §37 — ⛔ không đụng dữ liệu khi chưa có chủ) ⇒ 📤 đề nghị chủ dữ liệu (**S01**) xác nhận là rác rồi **đặt `active=0`** (⛔ không `DELETE` cứng — giữ vết) |
| **STATUS** | ⚠️ `OPEN` (chờ xác nhận) · **RELATED** `BUG-D27` · `HANDOFF-20261009-A15` |

### ⛔🔴 ĐÍNH CHÍNH `BUG-20261009-D29` (09/10/2026 15:55 · `ERP-SESSION-04`) — **FIX ĐÃ BỊ HOÀN NGUYÊN; BUG ⛔ VẪN `OPEN` — CHỦ: `ERP-SESSION-01`**

> 📌 **NGUYÊN VĂN USER**: «**Ma trận phân quyền không nằm trong phạm vi công việc của mày**» ⇒ ⛔ S04 **không thuộc phạm vi** ⇒ **mọi thay đổi đã hoàn nguyên** (xem `CHANGE_LOG` `CHG-D35` = `CANCELLED (reverted)`).

| Trường | Nội dung |
|---|---|
| **TRẠNG THÁI MỚI** | 🔴 ``OPEN`` — ⚠️ **bug VẪN CÒN** (tôi ⛔ không vá nữa) · 📤 **chuyển cho `ERP-SESSION-01`** (chủ vùng ma trận) |
| **PHÂN TÍCH GIỮ LẠI (đã ĐO, ⛔ không hoàn nguyên phần điều tra — còn nguyên giá trị)** | ① ``PermissionMatrix.tsx:84-86`` **ẩn** 4 khoá cũ ở **TẦNG VẼ** (``visibleEntries``) ✅ ② ⚠️ ``PermissionAccessPanel.tsx`` (bước **«6 Phân quyền người dùng»**) ⛔ **vẫn lặp ``entries.map``** (chỉ ``bulkKeys`` được lọc) ⇒ 📏 **DOM THẬT** hiện 4 dòng: «Nhiệm vụ nhân viên đang làm» ×2 · «Giao việc & Kiểm soát hoàn thành» ×2 ③ ⭐ **CÁCH VÁ ĐỀ XUẤT** (⛔ S04 ⛔ không làm): thêm bộ lọc ở **tầng vẽ** của panel theo ``MATRIX_HIDDEN_MODULE_KEYS`` (⛔ **KHÔNG** lọc ``moduleKeys``/``permissionMatrixKeys`` — tập **GỬI LÊN** phải giữ đủ, nếu ⛔ không là **mất quyền** theo cơ chế FULL-REPLACE) ✓ |
| **BÀI HỌC (giữ lại)** | «Ẩn» phải áp cho **MỌI NƠI VẼ** — `CHG-D20` mới áp ở **1 trong 2** màn ⇒ ⭐ khi ẩn/hiện tài nguyên dùng chung, phải **grep MỌI chỗ vẽ** (`entries.map`/`visibleEntries`) ⛔ không chỉ nơi đầu tiên ✓ |

### ✅⭐ ĐÍNH CHÍNH + KẾT LUẬN `BUG-20261009-D27` (09/10/2026 16:30 · `ERP-SESSION-04`) — **ĐÃ VÁ ĐỦ 2 ĐƯỜNG** (Java: S01 16:24:05 · JS: S04 16:25:52)

| Trường | Nội dung |
|---|---|
| **TRẠNG THÁI MỚI** | ✅ `FIXED` (**mã đủ 2 đường**) — ⏳ `VERIFIED` **chờ**: ① S01 **build lại + restart jar** ② API lên lại ③ S04 chạy `node tools/probe-workitems-active.mjs` ⇒ kỳ vọng **exit 0** (7 mã `CV-DA-*` biến mất) |
| **ĐƯỜNG JAVA** | ✅ **S01 vá 16:24:05**: `BootstrapDataAdapter` — `WHERE (%s) AND wi.active=1` + chú thích ghi rõ `BUG-20261009-D27` (📏 `git diff` xác nhận là thay đổi MỚI) ⇒ ⛔ S04 **KHÔNG chạm** ✓ |
| **ĐƯỜNG JS** | ✅ **S04 vá 16:25:52** (`CHG-D40`): `scripts/system-route.mjs` L807 `WHERE (${workItemWhere}) AND wi.active=1` (⚠️ bọc ngoặc vì `workItemWhere` là OR phức tạp) ⇒ ⭐ **parity 2 đường** — ⚠️ nếu chỉ vá Java thì bản JS vẫn nguyên lỗi khi cutover ✓ |
| 🔴🔴 **ĐÍNH CHÍNH ĐO LƯỜNG CỦA S04 (⚠️ tôi đã BÁO SAI 1 lần)** | cổng `tools/probe-workitems-active.mjs` **BẢN ĐẦU** dùng **cửa sổ 600 ký tự** từ mốc `FROM work_items wi` ⇒ ⚠️ **QUÁ NGẮN** (danh sách SELECT dài ~1.500 ký tự) ⇒ ❌ **từng kết luận «Java THIẾU lọc» là SAI (false negative)** — 📌 **đã sửa**: quét **tới hết câu truy vấn** + ➕ nhánh phân biệt **«mã đã vá NHƯNG bản chạy chưa nạp»** (⚠️ cần build/restart, ⛔ không phải lỗi mã, ⛔ đừng vá lại) ✓ |
| ⚠️ **LỖI CỦA S04 KHI VÁ JS (tự bắt được, đã sửa)** | tôi chèn **3 dòng chú thích** vào `scripts/system-route.mjs` ⇒ **dịch số dòng** ⇒ 🔴 `tests/f03-tai-chinh-audit-deps.test.mjs` **ĐỎ 22 mục** (⚠️ test này **khoá SỐ DÒNG** của tệp JS: đọc `js[line-1]` theo bảng hard-code) ⇒ ✅ **ĐÃ SỬA**: bỏ 3 dòng chú thích, **giữ nguyên số dòng** ⇒ `f03` về **7/7 PASS** ✓ |
| 📌 **KHUYẾN NGHỊ (⚠️ gửi S01 — vùng F-03)** | `tests/f03-tai-chinh-audit-deps.test.mjs` **rất dòn**: ⚠️ **bất kỳ ai chèn/xoá 1 dòng** trong `scripts/system-route.mjs` ở **trước dòng ~2.220** đều làm test đỏ **dù mã đúng** (⚠️ đây chính là bẫy tôi vừa sập) ⇒ ⭐ nên đổi sang **tìm theo nội dung** (`indexOf`/regex) thay vì **số dòng** ✓ |
| **BẰNG CHỨNG ĐO** | `node --check scripts/system-route.mjs` **exit 0** ✓ · cổng: **cả 2 đường ✅ có `wi.active=1`** ✓ · payload: ⏳ **chưa đo** (⚠️ `login HTTP 502` lúc 16:26–16:29 do S01 build — ⭐ cổng trả **exit 2 = KHÔNG ĐỦ SỐ ĐO**, ⛔ không kết luận) ✓ |
### ✅✅ `BUG-20261009-D27` = **VERIFIED** (09/10/2026 16:33 · `ERP-SESSION-04`) — NGHIỆM THU BẰNG CỔNG, ⛔ không phải bằng lời

| Phép đo (16:33, sau build+restart của S01) | Kết quả |
|---|---|
| Cổng `node tools/probe-workitems-active.mjs` | ⭐ **`exit 0`** |
| Đường Java (`BootstrapDataAdapter`) | ✅ có `wi.active=1` |
| Đường JS (`scripts/system-route.mjs`) | ✅ có `wi.active=1` (S04 vá) |
| **PAYLOAD THẬT** (`:9000`, `admin`) | ⭐ `workItems` **21 → 14** · dòng `active=0` = **0** ⇒ ✅ **ĐÚNG 7 mã việc đã xoá mềm BIẾN MẤT**: `CV-DA-260917-6690/6847/7918/8934` · `CV-DA-260925-3305` · `CV-DA-261009-3020/9740` ✓ |

**⇒ KẾT LUẬN**: `BUG-D27` (HIGH) **ĐÃ VÁ ĐỦ 2 ĐƯỜNG + ĐÃ ĐO ĐƯỢC TRÊN BẢN CHẠY** ⇒ nút **«Xoá» (W3)** nay xoá là **DÒNG BIẾN MẤT** (⛔ không còn «xoá xong vẫn nằm trên màn») ✓
**CHUỖI ĐÃ ĐI**: S04 phát hiện (`15:5x`) → S04 làm **cổng máy-kiểm** + bằng chứng → S01 vá **Java** (16:24:05) → S04 vá **JS** (16:25:52, `CHG-D40`) → S01 build/restart → ⭐ **S04 nghiệm thu `exit 0` + payload sạch** ⇒ `VERIFIED` ✓

### 🔴🔴 `BUG-20261009-D30` — **MỌI HÀNH ĐỘNG THẤT BẠI ĐỀU IM LẶNG** (`globalError` ⛔ KHÔNG được render) — ⚠️ CHỦ: `ERP-SESSION-01`

| Trường | Nội dung |
|---|---|
| **NGÀY / PHIÊN / NGUỒN** | 09/10/2026 17:25 · `ERP-SESSION-04` · ⭐ **phát hiện khi TEST GIAO DIỆN THẬT 3 KỊCH BẢN** (user yêu cầu) |
| **SEVERITY** | 🔴 **HIGH (UX → hiểu sai hệ thống)**: user bấm nút ⇒ ⛔ **không có gì xảy ra và ⛔ không có thông báo** ⇒ ⭐ **tưởng nút hỏng / tưởng đã xong** |
| **TRIỆU CHỨNG (ĐO ĐƯỢC)** | Trên màn «Công việc», bấm **«Duyệt xong»** cho việc `CVCN-261009-9917` ⇒ ① API trả **HTTP 400** (`update_work_item_status` **và** `approve_work_item`) ② trạng thái ⛔ không đổi (`REWORK`) ③ 📏 **DOM THẬT**: `document.body.textContent` ⛔ **KHÔNG chứa** chuỗi lỗi («Người thực hiện chỉ Gửi kiểm tra») ⇒ ⭐ **⛔ KHÔNG có thông báo ở bất kỳ đâu** (kiểm cả phần tử ẩn) ✓ |
| **ROOT CAUSE (đọc mã, ⛔ không suy đoán)** | ① `app/page.tsx:435-439` `action()` **CÓ** `setError(message)` khi lỗi ✓ ② `app/page.tsx:444` truyền `globalError={error}` vào `WarehouseApp` ✓ ③ 🔴 `app/page.tsx:497` `WarehouseApp` **nhận `globalError`** — ⚠️ **NHƯNG ⛔ KHÔNG có chỗ nào RENDER nó** (grep `globalError` toàn tệp: chỉ có **2** dòng = khai báo prop + truyền vào) ⇒ ⭐ **lỗi bị NUỐT** ⇒ ⚠️ **ảnh hưởng TOÀN APP**, ⛔ không riêng màn Công việc ✓ |
| **FIX ĐỀ XUẤT (⛔ S04 ⛔ không sửa — tệp của S01)** | render `globalError` (⚠️ TÁI DÙNG khuôn thông báo sẵn có — ⛔ không dựng UI mới): vd banner trong `WarehouseApp` cạnh vùng `toast`; ⭐ và cho **`toast`/`globalError`** hiện ở MỌI màn ✓ |
| **STATUS** | 🔴 `OPEN` — 📤 **đã bàn giao `ERP-SESSION-01`** (`HANDOFF-A28`) |

### 🔴 `BUG-20261009-D34` — **`admin` ⛔ KHÔNG được coi là «quản lý phòng» khi việc thuộc đơn vị ⛔ không phải KH/DA** ⇒ **NÚT CHẾT** — ⚠️ CHỦ: `ERP-SESSION-01`

| Trường | Nội dung |
|---|---|
| **SEVERITY** | 🔴 **HIGH**: FE hiện nút ⇒ user bấm ⇒ ⛔ BH từ chối ⇒ (➕ kết hợp `D30` ⇒ **im lặng hoàn toàn**) |
| **BẰNG CHỨNG (ĐO ĐƯỢC)** | Việc `CVCN-261009-9917` có **`departmentCode = "CN"`** (việc CÁ NHÂN) · `assigned_to` = `admin` ⇒ gọi API **cả 2 action** đều **HTTP 400**: «*Người thực hiện chỉ Gửi kiểm tra; Trưởng phòng/người có thẩm quyền mới xác nhận Hoàn thành.*» ✓ |
| **ROOT CAUSE (đọc mã)** | `OpsTaskStoreAdapter.userIsDepartmentManager` (bản port `TASK-080C`) : **`String expectedRole = "KH"…? "kh_truong" : "DA"…? "da_truong" : null; if (expectedRole == null) return false;`** ⇒ ⚠️ **THOÁT SỚM** trước khi tới câu SQL — mà câu SQL **CÓ** nhánh `u.role='admin'` (`WHERE u.id=? AND (u.role='admin' OR u.role=? OR COALESCE(rc.base_role,u.role)='admin')`) ⇒ 🔴 **nhánh admin KHÔNG BAO GIỜ tới được** khi `department_code` ∉ {KH, DA} (⚠️ gồm `CN` = việc cá nhân, và mọi đơn vị khác như `VNTECH`, `BCH`, `TCKT`…) ✓ |
| **MÂU THUẪN FE/BE** | FE `WorkCenter.canApproveRow`: **`if (scope.isAdmin) return true;`** ⇒ **hiện** nút «Duyệt xong» cho admin; BE lại ⛔ **từ chối** ⇒ ⭐ đúng lớp lỗi «nút chết» (`BUG-D05`) mà dự án đã ghi ✓ |
| **2 PHƯƠNG ÁN (⚠️ S01 quyết — ⛔ S04 không tự chọn)** | **(a)** 🔧 **SỬA BE**: trong `userIsDepartmentManager` kiểm **admin TRƯỚC** (⭐ S04 nghiêng phương án này: SQL đã có ý định admin ⇒ chỉ cần đưa nhánh admin lên trước `expectedRole == null`) — ⭐ **không phá luật nào khác** ✓ **(b)** 🔧 **SỬA FE** (tệp S04): thu `canApproveRow` về ĐÚNG luật BE ⇒ ⚠️ nhưng nếu S01 chọn (a) thì (b) sẽ **ẩn nhầm** nút ⇒ ⛔ **S04 ⛔ KHÔNG sửa cho tới khi S01 chốt** ✓ |
| **STATUS** | 🔴 `OPEN` — 📤 đã bàn giao (`HANDOFF-A28`) |

---

### ⛔ **TỰ SỬA SAI — `BUG-20261009-D30` = `CANCELLED` (09/10/2026 17:33 · `ERP-SESSION-04`)** — ⚠️ **BÁO CÁO CỦA S04 SAI, ĐÃ RÚT LẠI**

> 🔴 **S04 TỰ PHÁT HIỆN VÀ TỰ RÚT LẠI** (⚠️ ⛔ không để báo lỗi sai tồn tại trong log):

| Điều S04 ĐÃ BÁO SAI | **SỰ THẬT (đo lại + đọc mã)** |
|---|---|
| «`globalError` ⛔ KHÔNG được render ở đâu ⇒ mọi lỗi im lặng» | 🔴 **SAI** — mã **CÓ** render: `app/page.tsx` **dòng 849** (⚠️ **dòng JSX khổng lồ bị nén**) chứa **`{globalError && <div className="toast error" role="alert" data-vntech="global-error"><span>⚠</span>{globalError}</div>}`** ✓ ➕ **đã có test riêng**: `tests/v1-loi-api-trong-modal-phai-nhin-thay-duoc.test.mjs` ✓ |
| **VÌ SAO S04 KẾT LUẬN SAI** | ⚠️ S04 dò `grep globalError` ⇒ chỉ thấy **2-3 dòng** vì cả shell JSX **bị nén vào 1 dòng dài** ⇒ ⛔ **tưởng prop không được dùng** — ⭐ **BÀI HỌC: với tệp có dòng JSX khổng lồ, ⛔ KHÔNG kết luận từ grep; PHẢI cắt ngữ cảnh quanh vị trí khớp** ✓ |
| **SỰ THẬT của ca «bấm Duyệt xong không thấy gì»** | 📏 **ĐO ĐƯỢC**: nút **`disabled = true`** (⚠️ **cả dòng có 4/4 nút bị khoá**) ⇒ ⭐ **cú click của S04 bị BỎ QUA, ⛔ KHÔNG hề gửi request** ⇒ ⛔ không có lỗi để hiện ⇒ ⚠️ **không phải lỗi FE** ✓ ➕ ⭐ `requestApi` **CÓ** ném lỗi khi HTTP 400 (`app/page.tsx:345`) ✓ và `action()` **CÓ** `setError` (`:438`) ✓ |
| **VÌ SAO NÚT BỊ KHOÁ** | 📏 `document.visibilityState = **"hidden"**` ⇒ ⚠️ **tab trình duyệt ở chế độ NỀN** ⇒ Chrome **bóp timer/mạng** ⇒ ① `AbortController` 3s ⛔ **không hề bắn** ② fetch từ chính trang **treo vô hạn** (`window.__probe.xong = false` sau > 60s) ③ ⇒ `send()` **treo ở `await action()`** ⇒ **`busy` kẹt `true`** ⇒ nút khoá vĩnh viễn tới khi nạp lại ✓ ➕ ⭐ **API vẫn KHOẺ** khi gọi từ Node: login **576ms** · payload **249ms** ⇒ ⛔ không phải API ✓ |

**⇒ KẾT LUẬN ĐÚNG**: ① **⛔ KHÔNG có lỗi «im lặng»** — cơ chế thông báo lỗi **có thật và có test** ✓ ② `BUG-D34` (nút «Duyệt xong» với việc ∉ {KH,DA}) **VẪN ĐÚNG** (⛔ không liên quan tới việc im lặng — khi request chạy được thì user **thấy thông báo rõ**) ✓

### ℹ️ `GHI-NHAN-20261009-D01` — **QUAN SÁT THẬT (độ ưu tiên THẤP, KHÔNG phải bug nghiệp vụ)**: ⏱️ **`requestApi` ⛔ KHÔNG có timeout/`AbortSignal`** (`app/page.tsx:343`) ⇒ ⚠️ khi request **treo** (⚠️ ca đã đo: tab ở chế độ NỀN) thì `send()` treo ở `await` ⇒ **`busy` kẹt** ⇒ nút khoá + ⛔ **không thông báo** ⇒ user thấy «màn hình đơ» (⚠️ phải nạp lại trang) ✓ ⭐ **GỢI Ý (⛔ S04 không tự sửa — tệp S01)**: `AbortSignal.timeout(...)` cho `requestApi` + hiện thông báo khi hết hạn — ⚠️ **CHỈ làm nếu S01 thấy cần** (⚠️ đây là cải thiện độ bền, ⛔ không phải lỗi đang chặn nghiệp vụ) ✓
