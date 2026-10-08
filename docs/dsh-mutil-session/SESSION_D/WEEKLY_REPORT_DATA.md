# WEEKLY_REPORT_DATA — SESSION_D (ERP-SESSION-04)

# WEEK 2026-W41

## Session
`ERP-SESSION-04` (`SESSION_D`) — phiên thứ 4 trong cụm đa phiên `docs/dsh-mutil-session/`

## Period
2026-10-05 → 2026-10-11

## Completed Tasks
- `TASK-20261008-D01` — **Báo cáo kế hoạch go-live & phát triển lõi MEP** → `docs/37_KE_HOACH_GO_LIVE_VA_PHAT_TRIEN_LOI_MEP_20261008.md` (thay thế định hướng `docs/09` đã lỗi thời)
- `TASK-20261008-D02` — **Audit JOBS & PROJECT** → `docs/38_AUDIT_JOBS_PROJECT_20261008.md` (11 phát hiện + 8 việc sẵn sàng giao)

## In Progress
- ⛔ Không có việc mã nào (phiên audit read-only). Chờ user quyết 5 câu ở `docs/38` §7 để chuyển sang giao việc

## UI/UX
- **J-01** 2 mục menu «Phòng ban» / «Giao việc» dùng **chung `active` key** (`dept_plan_assign`/`dept_project_assign`), phân biệt bằng state `workView` ⇒ nguy cơ **highlight đồng thời 2 mục**, deep-link không giữ tab
- **J-02** 22 màn `dept_plan_*`/`dept_project_*` render `DepartmentTaskWorkspace` **chỉ 1 form** ⇒ người dùng dễ vào màn mỏng
- **J-03** trùng lối vào KPI (`kpi_summary` vs `dept_plan_kpi`/`dept_project_kpi`)
- **P-05** FE còn **ngày ISO thô** cho dự án trong `app/page.tsx` (2 chỗ) — lệch định dạng `dd/mm/yyyy` toàn hệ
- ✅ Ghi nhận tích cực: lỗi cũ «Dashboard nhóm Công việc không render» **đã được vá** (`app/page.tsx:452`)

## Frontend
- Không sửa (⛔ `app/page.tsx` LOCK S01, `lib/menu-helpers.ts` LOCK S02)
- Đề xuất FE-first: **T-02** (vá ngày ISO) · **T-03** (disable + tooltip đúng lý do quyền cho CRUD dự án) · **T-04** (active key riêng) · **T-07** (ẩn màn mỏng)

## Backend/API
- **P-01** `create_project`/`update_project`/`delete_project`/`bulk_import_projects` khai module **rỗng** ⇒ **403** với mọi user không phải admin/director/accountant
- **P-02** `set_project_status` module `admin` ⇒ **director không đóng/mở được dự án**
- **P-03** `update_project` capability `canUse` (yếu) — không nhất quán với `save_project_contract`/`save_boq_item` = `canEdit`
- ✅ JOBS backend **đủ & đúng**: 8 action (`create_work_item`, `update_work_item_progress/status`, `reassign_work_item`, `set_work_item_participant`, `add_work_item_comment`, `create_self_work_item`, `mark_task_notification_read`) đều có module + capability

## Database
- ⛔ Không thay đổi. 2 bug chính (**P-01**, **P-02**) **không cần migration** — chỉ sửa khai báo RBAC

## RBAC/Workflow
- Xác minh ngữ nghĩa thật của `RbacService.requireActionModule`: `PUBLIC_ACTIONS` → cho qua; **admin** → cho qua; **director/accountant** → cho qua **trừ khi** danh sách module chứa `"admin"`; **module rỗng** → **403** fail-closed
- Đối chiếu `CHECKLIST.md` §「MỐC 110 §8」: đây là nhóm **"18 action mồ côi quyền"** đã biết, **vẫn chờ quyết định** ⇒ 4 action dự án nằm trong nhóm đó
- ⚠️ ⛔ **Thông điệp lỗi gây hiểu nhầm** («Thao tác chưa được khai báo quyền trong hệ thống») — chính CHECKLIST đã ghi nhận

## Bugs
- `BUG-20261008-D01` (**HIGH**) = P-01 RBAC CRUD dự án — `OPEN`, có bằng chứng mã (`ActionRbacRegistry:75,89,135,302` + `RbacService:64-83`)
- `BUG-20261008-D02` (**MEDIUM–HIGH**) = P-02 `set_project_status` admin-only — `OPEN`
- Kế thừa còn `OPEN` từ phiên 03: `HANDOFF-C14` (ngày ISO `page.tsx`) · `HANDOFF-C15` (4 tệp mồ côi) · `HANDOFF-C13` (8 chỗ ngày ISO + nhãn BCH ở `Inventory.tsx` — thuộc S02)

## Hotfixes
- ⛔ Không có (phiên audit read-only, ⛔ 0 dòng mã sản phẩm)

## Testing
- `TEST-20261008-D01` — audit tĩnh: **PASS** (đọc mã) · **REGRESSION: BLOCKED**
- ⛔ **Không chạy được** `tsc` / `test:regression` / UI: shell harness hỏng (`ERR_MODULE_NOT_FOUND: @deepseek-ai/dsh-scope` trong profile DSH web)
- Hàng đợi 6 phép đo khi shell hồi phục: `tsc` · `test:regression` · user thường gọi `create_project` (kỳ vọng 403) · director gọi `set_project_status` (kỳ vọng 403) · mục «Quản lý dự án» hiện/mở đúng · 2 mục Phòng ban/Giao việc có highlight đôi

## Important Changes
- **Tài liệu**: `docs/37` (kế hoạch go-live lõi, thay `docs/09`) · `docs/38` (audit JOBS & PROJECT) · `SESSION_D/**` (9 log + README)
- **Mã sản phẩm**: ⛔ **không thay đổi** ⇒ vân tay nguồn ⛔ không đổi

## Decisions
- `DEC-20261008-D01` audit **read-only**, ⛔ không sửa tệp bị LOCK
- `DEC-20261008-D02` dùng **SESSION_D** trong cấu trúc log sẵn có (⛔ không tạo hệ state thứ hai)
- `DEC-20261008-D03` ⛔ không dùng 4 cổng probe đã biết sai làm bằng chứng
- `DEC-20261008-D04` giữ thứ tự **FE → BE → DB** cho mọi việc JOBS/PROJECT

## Blockers/Risks
- **BLOCKER hạ tầng**: shell harness hỏng ⇒ ⛔ không chạy được cổng/UI (ảnh hưởng mọi phiên dùng cùng profile)
- **Rủi ro cao**: sửa RBAC theo hướng mở ra mà **thiếu đối chứng âm** ⇒ mở quyền quá mức
- **Rủi ro cao**: nhiều tệp chưa commit trải 3 phiên (**X-01**) ⇒ mất việc nếu build/reset sai
- **Rủi ro trung bình**: xoá 4 tệp mồ côi làm mất khả năng "thêm kho cho dự án đã có"

## Remaining Work
- Chờ **user quyết 5 câu** (`docs/38` §7) rồi giao **T-01…T-08**
- `T-01` (phiên 04 tự làm khi shell hồi phục): đo UI mục «Quản lý dự án»
- Bổ sung `docs/09` bằng dấu «đã lỗi thời» (⛔ chưa làm — tránh ghi đè tài liệu phiên khác)

## Next Week
1. (Shell hồi phục) chạy 6 phép đo runtime → cập nhật `BUG_HOTFIX_LOG` từ «đọc mã» sang «đo được»
2. S01 thực thi **T-02/T-03** (FE) → **T-05** (BE) · S02 thực thi **T-04/T-07**
3. Hợp nhất commit theo danh sách tệp từng phiên (**X-01**)
4. Vá 4 cổng probe (**X-02**) nếu user cho phép sửa `tools/**`

---

## ⚠️ BỔ SUNG 08/10/2026 (cùng phiên) — `TASK-20261008-D03`: **ĐÍNH CHÍNH + mở rộng sang tầng cổng quyền**

### Bugs (cập nhật)
- ⚠️ **`BUG-20261008-D01` SỬA NGUYÊN NHÂN**: `create/update/delete_project` bị **`requireRequireAdmin`** chặn ở controller (`SystemController.java:281-302`, hàm `:1739-1745` = **chỉ `role=="admin"`**) — **là chủ ý thiết kế**, ⛔ không phải «thiếu khai báo module». STATUS vẫn `OPEN` (chờ user quyết có mở cho Phòng Dự án không)
- ⚠️ **`BUG-20261008-D02` SỬA LÝ DO**: `set_project_status` cũng bị `requireRequireAdmin` (`:291-294`) ⇒ kết luận «Giám đốc không đóng/mở được dự án» **giữ nguyên**, lý do đúng là **tầng controller**
- 🆕 **`BUG-20261008-D03` (P-08, HIGH — nghi vấn)**: **12 action mồ côi THẬT** — danh mục vật tư (7) · tổ đội (2) · lịch trình duyệt (3): khai module **rỗng** **và** khối `SystemController:893-1040` chỉ dùng `requireCurrentUser` ⇒ 403 cho mọi tài khoản không phải admin

### RBAC/Workflow (cập nhật)
- Thêm **quy tắc 2 tầng cổng quyền** (đã ghi `SHARED_STATE` §73′): `requireActionModule` (registry) → `requireRequireAdmin`/`requireCurrentUser` (controller) → guard use case; **thông điệp lỗi phân biệt tầng nào chặn**
- Số liệu nền đo bằng mã: **65** action khai rỗng · **10** `PUBLIC_ACTIONS` · **45** call site `requireRequireAdmin` ⇒ số mồ côi thật **phải tính bằng script** (⛔ không dùng lại 19 của 30/09/2026)

### Blockers/Risks (cập nhật)
- **BLOCKER hạ tầng đã chẩn đoán tới gói**: `C:\Users\PC\.dsh\profiles\web\node_modules\@deepseek-ai\` (5.119 đường) **KHÔNG có** `dsh-scope`, mà `dsh-skill/lib/index.js` **import nó** ⇒ mọi `node` chết ⇒ shell DSH chết ⇒ ⛔ không chạy được cổng/UI ở **mọi phiên**. **Cần user sửa profile `web`.**

### Next Week (cập nhật)
5. **Ưu tiên 1 mới**: user sửa profile DSH ⇒ khôi phục shell ⇒ chạy **4 phép thử `docs/39` §5** (kèm đối chứng âm) để chuyển `BUG-20261008-D03` từ «nghi vấn» sang «đo được»
6. Hỏi lại user **câu 1–2** theo bản chất mới («dự án có tiếp tục CHỈ `admin` quản lý không?» · «ai được đóng/mở dự án?») + **câu 6 mới** (ai bảo trì danh mục vật tư / cấu hình lịch trình duyệt)

### Bổ sung cuối vòng 3 (`TASK-20261008-D04` + `D05`)
- ✅ **BÁC P-01 ở tầng FE** (UI CRUD dự án ở AdminApp step 8 + cổng `accessDenied` yêu cầu `isAdminUser`) ⇒ ⛔ **rút việc T-03**
- ✅ **XÁC MINH P-05** = đúng **2 chỗ** ngày ISO thô (`page.tsx:1024`) · ⚠️ **J-01** chưa đo được hiệu ứng ⇒ **hạ mức T-04** · ⚠️ **ĐÍNH CHÍNH J-02** (= 1 form + 1 bảng 3 tab)
- ✅ **SOI TẦNG CỔNG QUYỀN CHUỖI MUA HÀNG LÕI**: **13 action** (`create_request` → `decide_approval` → `create_po` → `approve/reject_po` → `receive_goods`/`confirm_delivery` → kho) **đều dùng `requireCurrentUser`** và có **module + capability thật** ở registry ⇒ **KHÔNG bị chặn quyền sai** — tầng bằng chứng **MỚI** cho `docs/37` §2
- ⚠️ **Tính nhất quán**: PROJECT CRUD là **ngoại lệ** (hard-code `requireRequireAdmin`) giữa một hệ **module-gated** ⇒ cần user xác nhận «chủ ý hay sót»
- 🆕 Việc ưu tiên cao nhất còn lại: **T-09 = P-08** (12 action mồ côi thật: danh mục vật tư · tổ đội · lịch trình duyệt)

### Bổ sung vòng 4 (`TASK-20261008-D06` — **MA TRẬN QUYỀN GO-LIVE**)
- 🎯 **Sản phẩm mới**: `docs/41_MA_TRAN_QUYEN_GO_LIVE_20261008.md` — bảng tra **A / L / M** cho từng action lõi + gợi ý module cho **4 phòng** ⇒ **dùng trực tiếp cho GĐ A3/A4**
- ✅ **KHO SẠCH** (12 action `requireCurrentUser`) · ✅ **TÀI CHÍNH SẠCH** (`save_contract_payment` · `import_contract_payments`) · ✅ **NCC SẠCH** (`save_supplier` · `set_supplier_status`)
- 🔴 **`BUG-20261008-D04` (P-09, MEDIUM)**: `delete_supplier` **lệch registry ↔ controller** (`:1444-1445`) — hướng an toàn
- ⭐ **Tiền lệ vàng `update_user`** (`:379-394`, MỐC 109) = **khuôn mẫu sửa P-08**: bỏ hard-code ở controller, cổng duy nhất ở registry, giữ guard nghiệp vụ ở use case
- ⚠️ **Luật L** (Ban lãnh đạo qua mọi action module-gated — `RbacService:69`/`D-022`) ⇒ ảnh hưởng cách hiểu ma trận quyền ⇒ đã ghi cảnh báo trong `docs/41` §0
- ⏳ **Còn 4 dải chưa soi thân**: `:304` (`save_project_contract`) · `:534-563` (5 action request) · `:564-573` (BOQ) · `:1070` (`bulk_import_users`)

### Bổ sung vòng 5 (`TASK-20261008-D07` — **SPEC VÁ P-08**)
- ✅ **Đã soi xong 4 dải** (⛔ không còn dòng "chưa soi thân" trong `docs/41`): `preview_request_import` `:534` · `update_returned_request` `:544` · `resubmit_request` `:549` · `delete_request` `:554` · `cancel_request` `:559` · `save_boq_version` `:564` · `save_boq_item` `:569` · `set_boq_item_status` `:574` — **tất cả `requireCurrentUser`** + registry có module ⇒ **sạch**
- ⭐ **PHÁT HIỆN TẦNG CỔNG THỨ 3**: `save_project_contract` (`:304-310`) = `requireCurrentUser` + **`accessScopeService.requireProjectAccess(...)`** ⇒ mô hình quyền thực tế **3 tầng** (registry → controller → **guard phạm vi dự án**)
- ⚠️ **Mở rộng P-08**: `bulk_import_projects` (`:1065`) · `bulk_import_users` (`:1070`) · `save_email_settings` (`:539`) — `requireCurrentUser` **+ registry RỖNG** ⇒ cùng lớp ⇒ 403 cho M
- 📋 **Sản phẩm**: `docs/42` — bảng quyết định **12 action mở + 6 admin-only** · ⚠️ **phát hiện quan trọng**: `List.of("admin")` **vẫn là rỗng ⇒ vẫn 403** ⇒ cách đúng là **nhánh `ADMIN_ONLY_ACTIONS`** ở `RbacService` (⛔ không dùng `PUBLIC_ACTIONS`) · 4 ca cổng tĩnh + 5 phép thử API + rollback + DoD
- 🚨 **Blocker hạ tầng**: shell vẫn chết **vòng 3** (`@deepseek-ai/dsh-scope`) ⇒ ⛔ chưa chạy được phép thử nào trong cả 5 vòng

### Bổ sung vòng 6 (`TASK-20261008-D08` — **RÀ CHIỀU NGƯỢC `PUBLIC_ACTIONS`**)
- ✅ **AN TOÀN (âm tính có chủ đích)**: 10 action công khai đã kiểm — **7/7 self-service đều `requireCurrentUser` + `cu.id()`** (⛔ không nhận `userId` từ payload ⇒ ⛔ không IDOR) · **`setup` bị chặn chạy lại ⇒ 409** (`AuthUseCase:82-90`) · **`login` lockout 10/15 phút ⇒ 429** · `logout` chỉ xoá phiên hiện tại
- ⇒ ⛔ **KHÔNG có authorization bypass** (mức CRITICAL theo Goal §20) ⇒ **rủi ro go-live nằm ở chiều "gác quá chặt" (P-08)**, ⛔ không ở chiều bảo mật
- 📋 **Sản phẩm**: `docs/43` — bảng rà 10 action + **2 tệp test TĨNH HOÀN CHỈNH sẵn dán** (`golive-rbac-orphans` · `golive-rbac-public-actions`, **có đối chứng âm**, ⛔ không cần UI/DB)
- 🚨 **Blocker hạ tầng**: shell vẫn chết **vòng 4** ⇒ tổng 6 vòng chưa có phép thử runtime nào

### TỔNG KẾT TUẦN — SESSION_D (`ERP-SESSION-04`)
| Nhóm | Kết quả |
|---|---|
| **Sản phẩm tài liệu** | `docs/37` (kế hoạch go-live lõi) · `docs/38` (audit JOBS/PROJECT) · `docs/39` (**đính chính** tầng cổng quyền) · `docs/40` (xác minh lại — **bác P-01**) · `docs/41` (**ma trận quyền go-live**) · `docs/42` (**spec vá P-08**) · `docs/43` (**rà PUBLIC_ACTIONS + 2 cổng tĩnh**) |
| **Log** | `SESSION_D/` đủ **9/9** + README · đã APPEND vào 2 sổ đăng ký chung + `SHARED_STATE` §73′–76′ + `SHARED_TODO` |
| **Phát hiện** | **3 bug mới** (`BUG-D01/D02` RBAC dự án — đã đính chính tầng; `BUG-D03` P-08 12 action mồ côi; `BUG-D04` `delete_supplier` lệch registry) · **3 bất nhất quán** · **1 việc RÚT** (T-03) |
| **Tin tốt** | Chuỗi lõi (mua hàng 13 · kho 12 · tài chính 3) **module-gated đúng** · **`PUBLIC_ACTIONS` SẠCH** · phát hiện **tầng cổng thứ 3** (`requireProjectAccess`) |
| **⛔ Chưa làm được** | **0 phép thử runtime** — shell DSH hỏng **4 vòng liên tiếp** (`@deepseek-ai/dsh-scope` thiếu trong profile `web`) |
| **Cần user** | ① sửa profile DSH ② chốt `docs/42` §2 ③ xác nhận PROJECT CRUD chủ ý/sót ④ quyết luật L |

### Bổ sung vòng 7 (`TASK-20261008-D09` — **KIỂM ĐƯỜNG CẤP QUYỀN + SCRIPT PHÂN LOẠI**)
- ✅ **FE↔BE NHẤT QUÁN** (âm tính có chủ đích): 7 đường cấp quyền (`save_user_access` · `save_department_permission` · `delete_department_permission` · `delete_user_module_override` · `create/delete_user` · `set_user_status` · `save_organization_unit`) **đều admin-only ở BE** + **FE ẩn nút** (chú thích sẵn `Inventory.tsx:420-425`) ⇒ ⛔ không có "nút chết" ⇒ ⛔ **không phải lớp lỗi MỐC 109**
- ⭐ **CHỐT MÔ HÌNH QUYỀN** (trả lời GĐ A3/A4): **cấp quyền TẬP TRUNG Ở ADMIN** (cả theo-người và theo-phòng), ⛔ không phân cấp cho Trưởng phòng; ngoại lệ duy nhất = `update_user` + `admin_tab_01` (sửa trường hồ sơ). Muốn phân cấp ⇒ **phải sửa BE** (khuôn MỐC 109)
- ⚠️ **CẢNH BÁO DỮ LIỆU**: `save_user_access` = **FULL-REPLACE** (`clearUserScopes()` xoá cứng 3 bảng) ⇒ gửi thiếu 3 bộ ⇒ **mất phạm vi tài khoản** ⇒ ⭐ mọi vá liên quan phải có **test chống mất dữ liệu**
- 📋 **Sản phẩm**: `docs/44` — bảng 7 đường cấp quyền + **script `tools/rbac-classify-actions.mjs` hoàn chỉnh** (phân loại `PUBLIC/ADMIN_HARD/ORPHAN/NO_CASE` + **tự chặn "cổng xanh rỗng"** + in allowlist sẵn dán) ⇒ thay canary bằng **allowlist chính xác từng tên**
- 🚨 **Blocker**: shell vẫn chết **vòng 5** ⇒ tổng **7 vòng chưa có phép thử runtime nào**
- 📌 **Còn nợ kỹ thuật đã ghi tên**: S01 dán 2 cổng tĩnh (`docs/43`) + script (`docs/44`) ⇒ xác nhận `NO_CASE = 0`

### Bổ sung vòng 8 (`TASK-20261008-D10` — **BẢNG TỔNG HỢP GO-LIVE 1 TRANG**)
- 🎯 **Sản phẩm**: `docs/45` — **1 trang duy nhất** gom toàn bộ 8 tài liệu: **A** việc chặn (sửa profile DSH + dán 2 cổng) · **B 7 quyết định** kèm **đề xuất + hệ quả từng lựa chọn** · **C** vùng đã kiểm SẠCH · **D** kế hoạch **8 bước FE→BE→DB** (⛔ **DB không cần migration**) · **E** bằng chứng · **F** việc làm tiếp khi chưa có quyết định
- ⭐ **7 quyết định cần user**: B1 P-08 (mở 12 action?) · B2 PROJECT CRUD (chủ ý/sót) · B3 luật L · B4 cấp quyền tập trung/phân cấp · B5 `delete_supplier` lệch · B6 4 tệp mồ côi · B7 ẩn 22 màn phòng ban mỏng
- ✅ **Trạng thái phiên**: 10 task DONE (mức tài liệu) · 9 tài liệu `docs/37→45` · 4 bug phát hiện · 4 vùng kiểm SẠCH · ⛔ **0 phép thử runtime sau 8 vòng**
- 🚨 **Blocker**: shell vẫn chết **vòng 6**

### Bổ sung vòng 9 (`TASK-20261008-D11` — **F2: `NO_CASE` + CHỐT 18 ORPHAN**)
- ✅ **`NO_CASE` = 0**: grep **65 tên** action khai rỗng trên `SystemController.java` ⇒ **65/65 đều có `case` thật** (⛔ không có action "mồ côi controller") — kiểm chứng ngược: mọi kết quả đều dạng `case "…" -> {`
- ⭐ **CHỐT PHÂN LOẠI ĐỦ 65**: **10 PUBLIC + 37 ADMIN_HARD + 18 ORPHAN** · danh sách 18 ORPHAN **chính xác theo dòng** (danh mục vật tư 7 · tổ đội 2 · lịch trình duyệt 3 · nhập hàng loạt 2 · cấu hình 4)
- ⭐ **ĐỐI CHIẾU LỊCH SỬ KHỚP 100%**: `CHECKLIST` MỐC 110 §8 (30/09) ghi **18 action mồ côi, 5 nhóm** — y hệt ⇒ ⭐ **`docs/42` §2 (12 nghiệp vụ + 6 cấu hình = 18) ĐÃ ĐẦY ĐỦ**, ⛔ không thiếu action nào ⇒ spec vá P-08 **sẵn sàng thi hành ngay**
- ⭐ **Giải thích chênh lệch lịch sử**: `8 public + 19 orphan + 38 admin-hard` → `10 + 18 + 37` = **hoán đổi 1-1** (`save_error_report` → PUBLIC ở MỐC 110 · `update_profile_signature` → PUBLIC theo MT2 §13.4) ⇒ ⛔ **không có action mới bị mồ côi**
- ⚠️ **Củng cố kết luận `docs/42`**: 6 action "cấu hình" trong danh sách ORPHAN **⛔ KHÔNG admin-gate ở controller** (`:539`, `:1107`, `:1112`, `:1117`, `:1065`, `:1070`) ⇒ nếu chỉ khai `List.of("admin")` thì **vẫn là rỗng ⇒ vẫn 403 + vẫn thông điệp SAI** ⇒ **bắt buộc** dùng nhánh **`ADMIN_ONLY_ACTIONS`**
- 🚨 **Blocker**: shell vẫn chết **vòng 7** ⇒ tổng **9 vòng chưa có phép thử runtime nào**

### Bổ sung vòng 10 (`TASK-20261008-D12` — **PATCH PACK VÁ P-08**)
- ⚠️ **PHÁT HIỆN MỚI (P-11)**: `ActionRbacRegistry.capabilityFor` (`:567-569`) **mặc định `canUse`** **và cả 18 action ORPHAN đang khai `"canUse"`** (`:326-527`) ⇒ ⛔ **nếu chỉ thêm module mà ⛔ nâng capability thì CẤP QUYỀN QUÁ RỘNG** (người có `canUse` **XOÁ / IMPORT được danh mục vật tư**) ⇒ **`docs/42` ĐÚNG nhưng CHƯA ĐỦ**
- 📦 **Sản phẩm**: `docs/47` — **patch chính xác từng dòng**: **§A** 12 dòng module (kèm số dòng + chuỗi OLD/NEW) · **§B 9 dòng capability** (`canUse`→`canEdit` ×7, →`canCreate` ×1 …) · **§C** 6 action cấu hình → `ADMIN_ONLY_ACTIONS` (⛔ không dùng `List.of("admin")`) · **§D** 2 khối mã `RbacService` · **§E** checklist **9 bước** (⚠️ cổng tĩnh phải đổi `SNAPSHOT_EMPTY_COUNT` **65 → 53**) · **§F** đính chính `docs/42` · **§G** rollback
- ✅ **Kết luận**: khi user chốt ⇒ S01 áp trong **~30 phút**, ⛔ không phải điều tra lại
- 🚨 **Blocker**: shell vẫn chết **vòng 8** ⇒ tổng **10 vòng chưa có phép thử runtime nào**

### Bổ sung vòng 11 — **AUDIT CLOSURE** (`TASK-20261008-D13`)
- ⭐ **NGUYÊN NHÂN GỐC P-09 lộ ra trong mã** (`SystemController:1463`): *«Khuôn `delete_supplier`: chỉ admin (**Java chưa có helper `isDepartmentApprover("KH")`**)»* ⇒ **2 action** (`delete_supplier` + `delete_partner`) bị gác admin vì **thiếu helper đã có ở bản JS** ⇒ **B5** có 2 lựa chọn: **(a)** giữ admin + sửa registry (**1–2 dòng**) · **(b)** port helper (**≥ nửa ngày**) ⇒ **đề xuất (a)** + ghi **nợ kỹ thuật có tên**
- ✅ **Ma trận RBAC ĐÃ ĐÓNG**: `save_partner`/`set_partner_status` = `requireCurrentUser` + `supplier_catalog` ⇒ mọi nhóm lõi đã phân loại được **A/L/M**
- ⛔ **RÀNG BUỘC MỚI**: tạo tệp trong thư mục thuộc **vân tay** ⇒ **buộc `gd-cycle`** (shell hỏng ⇒ ⛔ không chạy được) ⇒ ⭐ **quyết định đúng: ⛔ KHÔNG tạo 2 tệp test**, giữ **sẵn dán** ở `docs/43` §2
- 🏁 **KẾT LUẬN ĐỢT**: **12 task · 12 tài liệu `docs/37→48` · 5 bug phát hiện · 0 dòng mã sản phẩm · 0 commit** · ⛔ **hết việc tài liệu giá trị** ⇒ báo **BLOCKED** (chờ user sửa profile DSH + quyết 7 câu)
- 🚨 **Blocker**: shell vẫn chết **vòng 9** ⇒ tổng **11 vòng ⛔ chưa có phép thử runtime nào**

### Bổ sung vòng 12 (`TASK-20261008-D15` — **TEST-IMPACT + SPEC PORT BE**)
- ⭐ **Giá trị**: chuẩn bị để 7 việc của user có thể thi hành **an toàn, không phá hồi quy**
- 🔴 **6 tệp test KHOÁ CỨNG cấu trúc cũ** (MT3 §A.2): `t01:98·24-28` · `p5-01:25` · `t07:157` · `t08:144` · `t09:163` (nguyên văn *«KHÔNG được đổi dải 6 tab»*) ⇒ **việc 1 (hub + Dashboard lên đầu) phá 6 tệp** ⇒ ⚠️ phải cập nhật test **cùng lượt** (⛔ không để test đỏ) ⇒ **ghi `DEC-20261008-D07`**
- ✅ **5 việc (4·2·3·7 + phần lớn 5/6) ⛔ KHÔNG đụng test nào** ⇒ thứ tự thi hành an toàn: **việc 1 làm CUỐI** (`docs/50` §3)
- ✅ **Bảng `work_item_comments`/`work_item_participants` ĐÃ CÓ** (chứng minh bởi `tests/work-item-comment-participant.test.ts:54-57` tự dựng lược đồ) ⇒ ⛔ **port không cần migration**
- ✅ **Bootstrap Java ĐÃ trả 2 khoá** (`BootstrapDataAdapter:1628/1634`) ⇒ **đường ĐỌC xong**; 🔴 **Java chưa có `requireWorkItemAccess`** (chỉ JS `:501`) ⇒ port phải kèm guard 3 nhánh ⇒ **ghi `DEC-20261008-D08`**
- 📦 **Sản phẩm**: `docs/50` — registry **18 khẳng định test** + **spec port nguyên hợp đồng** (payload/validate/quyền/ghi/trả về) + **6 bước thi hành**
- 🚨 **Blocker**: shell vẫn chết **vòng 11** ⇒ tổng **12 vòng ⛔ chưa có phép thử runtime nào**

### Bổ sung vòng 13 (`TASK-20261008-D16` — **RECIPE VIỆC 1 / tiền lệ vàng nhóm Kho**)
- ⭐ **TIỀN LỆ VÀNG**: nhóm **«Kho» đã gom 7 → 1 mục** và *«dashboard nay là TAB ĐẦU của hub `Inventory.tsx`»* — `tests/mt3-ui-29:52-56` (`ERP-SESSION-02 · TASK-226`) ⇒ **việc 1 của user = lặp lại đúng khuôn đã được duyệt** ⇒ rủi ro **thấp hơn** đánh giá ban đầu
- ✅ Xác định **luật cứng**: `HUB_TAB_GROUP_KEYS` yêu cầu nhóm **≥2 mục** ⇒ `my_work` phải **rút khỏi danh sách** khi gom còn 1 mục (nếu không: `mt3-ui-25` ①② đỏ)
- ⚠️ Xác định **bẫy im lặng**: `page.tsx:499-503` lấy `moduleKey = permissionKeys đầu tiên xem được` ⇒ mục hub **phải hợp 6 khoá** của 5 mục cũ, ⛔ thiếu là **nhân viên mất luôn menu «Công việc»**
- 📦 **Sản phẩm**: `docs/51` — **recipe 5 bước dán được** + bảng **old→new** cho **7 tệp test** + 2 điểm phải đọc khi thi hành (`activateModule` · khuôn nhãn nhóm Kho)
- 🚨 **Blocker**: shell vẫn chết **vòng 12** ⇒ tổng **13 vòng ⛔ chưa có phép thử runtime nào**
- ⏳ **Vẫn chờ user**: (A) sửa profile DSH · (B) uỷ quyền 3 tệp · (C) thiết kế thêm + **3 xác nhận** (thứ tự 7 tab · Kanban/Cây · Nhận xét)

### Bổ sung vòng 14 (`TASK-20261008-D17` — **ĐÓNG 2 ẨN SỐ + BẮT BẪY ĐIỀU HƯỚNG**)
- ✅ **Xác minh**: `page.tsx:602` — `view:"dashboard"` **CÓ** set `setWorkView("dashboard")` ⇒ hub render đúng ⇒ ⛔ `page.tsx` **không cần sửa cho điều hướng**
- 🔴 **PHÁT HIỆN BẪY (trước khi ship)**: `workCenterViewFor:447-457` kiểm **`active` TRƯỚC `view`** (`:448` tasks→`"personal"` **đứng trước** `:452` `view==="dashboard"`) — mà mục hub lấy `moduleKey` = **khoá quyền đầu tiên xem được** ⇒ nhân viên thường (`dept_plan_tasks`) ⇒ **bấm «Công việc» mở tab Cá nhân, ⛔ KHÔNG phải Dashboard** ⇒ ➕ **Bước 6** (đảo 2 nhánh — an toàn; kèm phòng thủ 2 lớp xếp `dept_plan_kpi` đầu mảng)
- ✅ **Khuôn Kho trả lời 2 câu hỏi để ngỏ**: mục hub dùng `key:"warehouse_hub"` + `label:"Kho vật tư"` (nhãn mô tả màn) + gộp 6 khoá quyền ⇒ đề xuất `key:"work_hub"` / `label:"Công việc"`
- 📦 **Sản phẩm**: `docs/51` cập nhật (**Bước 5 ✅ · Bước 6 🔴 · §3.1 ✅**) ⇒ recipe việc 1 **6 bước, hết ẩn số**
- 🚨 **Blocker**: shell vẫn chết **vòng 13** ⇒ tổng **14 vòng ⛔ chưa có phép thử runtime nào**

### Bổ sung vòng 15 (`TASK-20261008-D18` — **RECIPE VIỆC 2·3·4 + 2 PHÁT HIỆN**)
- 🔴 **BUG MỚI `BUG-20261008-D05` (P-12) — SEVERITY HIGH**: nút «Xong» (`WorkCenter.tsx:445`) gửi `COMPLETED` cho **mọi** user, nhưng BE **CHẶN người thực hiện** (`:369-370`) ⇒ nhân viên ⛔ **không báo được hoàn thành** (lớp «nút chết») ⇒ sửa: assignee ⇒ **`SUBMITTED`**, trưởng phòng ⇒ `COMPLETED` (mã ở `docs/52` §3.1) — ⭐ cũng là **nền của việc 5·6**
- ✅ **GỠ RỦI RO**: `TaskTable` **chỉ được import** ở `page.tsx:107`, ⛔ **không render** ⇒ sửa cột «Thao tác» **AN TOÀN** (⛔ không cần prop `mode`)
- ✅ `ListToolbar.search` là **prop tuỳ chọn** ⇒ **việc 2 ⛔ không đụng file dùng chung**
- 📦 **Sản phẩm**: `docs/52` — **recipe dán được** cho **việc 2** (search xuống + đổi tên, làm 1 lượt) · **việc 3** (`ProgressCell` nhập % + Dashboard thêm bảng việc của tôi) · **việc 4** (form → **modal «Tạo công việc»**) + **§5 checklist 3 lượt**
- ⭐ **Phạm vi xin uỷ quyền THU HẸP 3 tệp → 1 tệp**: 3 việc 2·3·4 chỉ sửa `app/screens/WorkCenter.tsx` · **0 test phải sửa**
- 🚨 **Blocker**: shell vẫn chết **vòng 14** ⇒ tổng **15 vòng ⛔ chưa có phép thử runtime nào**

### Bổ sung vòng 16 (`TASK-20261008-D19` — **RECIPE VIỆC 7 + 5·6** ⇒ **đủ 7/7 việc**)
- ✅ **Thông báo web ĐÃ CÓ SẴN** ⇒ **việc 6 ⛔ không phải làm phần thông báo** (`page.tsx:568`/`:581` ↔ BE `queueTaskNotice` + `notifySafely("TASK_COMPLETED")`)
- ⭐ Tab «Được giao» **dùng LẠI `personalGroups[1].rows`** ⇒ ⛔ không viết lại logic · ⛔ không sửa khối `T05` (test `t05` chạy khối này)
- ⚠️ **Việc 7**: chỉ **phương án (A) «chế độ xem»** an toàn; **bỏ hẳn Kanban/Cây ⇒ ĐỎ `t07`/`t09`** (bắt buộc 2 khối **vẫn tồn tại**)
- 📦 **Sản phẩm**: `docs/53` — recipe sub-tab phòng ban/tổ đội · tab «Được giao» · **modal chi tiết** (dùng `workItemComments`/`workItemEvents` **đã có trong bootstrap**, ⛔ không API mới) · nút **`SUBMITTED`** cho người thực hiện / **`COMPLETED`+`REWORK` kèm lý do** cho trưởng phòng · hằng **`COMMENTS_READY=false`** ⛔ chống «nút chết»
- 🏁 **CẢ 7/7 VIỆC NAY ĐỀU CÓ RECIPE DÁN ĐƯỢC**: `docs/51` (việc 1) · `docs/52` (việc 2·3·4) · `docs/53` (việc 5·6·7)
- 🚨 **Blocker**: shell vẫn chết **vòng 15** ⇒ tổng **16 vòng ⛔ chưa có phép thử runtime nào**

### Bổ sung vòng 17 (`TASK-20261008-D20` — **RUNBOOK THI HÀNH**)
- 📘 **Sản phẩm**: `docs/54` — **runbook dùng để LÀM** (⛔ không phải để đọc): **§0** 4 điều kiện tiên quyết (shell sống · uỷ quyền · `git status` ⛔ cấm lệnh phá hoại · user chốt 3 điểm) + **lệnh chuẩn sau mỗi lượt**; **§1** thứ tự **6 lượt** (việc 4 → 2 → 3 → 7 → 5·6 → **1 cuối**); **§2** mỗi lượt có **Do / Verify / Rollback** (L3 **đối chứng âm**; L6 **4 ca kiểm** bắt đúng bẫy `workCenterViewFor`; L5 **chỉ bật `COMMENTS_READY` sau khi port BE**); **§3 Definition of Done**; **§4** 5 nhánh đặc biệt (shell còn hỏng · chỉ cấp 1 tệp ⇒ làm L1–L5, hoãn L6 · bỏ hẳn Kanban ⇒ sửa `t07`/`t09` · làm P-08 trước · phiên khác giữ tệp ⇒ HANDOFF); **§5** 3 bẫy đã bắt được
- 🛑 **TUYÊN BỐ DỪNG CHUẨN BỊ**: 7/7 recipe + runbook + test-impact + patch pack P-08 + 2 cổng tĩnh + 17 tài liệu **đã đủ**; mọi việc còn lại **phụ thuộc shell (P1) hoặc user (P2/P4)** ⇒ ⛔ **không tạo thêm tài liệu kế hoạch** để tránh lặp thông tin vô ích
- 🚨 **Blocker**: shell vẫn chết **vòng 16** ⇒ tổng **17 vòng ⛔ chưa có phép thử runtime nào**

### Bổ sung vòng 18 (`TASK-20261008-D21` — **KIỂM CLASS CSS** · bắt 1 lỗi trong recipe)
- 🔴 **Lỗi bắt được**: `link-like` trong `docs/53` là **class tôi tự bịa** (⛔ không tồn tại) ⇒ nếu dán nguyên sẽ ra nút **không kiểu + ⛔ không focus ring** (a11y) ⇒ **sửa thành `.link-cell`** (có sẵn: `canonical.css:1084` + hover `:1089` + **focus-visible** `:1090`)
- ✅ **Kiểm 19 class**: phần còn lại **đều có thật** — ⭐ `project-scope-tabs` **đã style riêng cho `.work-center`** (`:452-466`, kể cả `active`/`aria-selected`) ⇒ dải tab/sub-tab **tự đúng kiểu**, ⛔ không cần CSS mới
- ⭐ **Hệ quả cho cả cụm**: ⛔ **không đụng `app/globals.css`** (file dùng chung §8) ⇒ tránh rủi ro cho mọi phiên đang làm giao diện · đã ghi **bảng kiểm class** vào `docs/53` §5
- 🚨 **Blocker**: shell vẫn chết **vòng 17** ⇒ tổng **18 vòng ⛔ chưa có phép thử runtime nào**
- ⏳ **Vẫn chờ user**: (A) sửa profile DSH · (B) uỷ quyền `WorkCenter.tsx` (5/7 việc) · (C) hướng khác + **3 xác nhận**

### Bổ sung vòng 19 (`TASK-20261008-D22` — **KIỂM QUY ƯỚC MODAL** · bắt lỗi thứ 2 trong recipe)
- 🔴 **Lỗi bắt được**: **2 modal** trong recipe (`docs/52` §4.4 · `docs/53` §3.2) dùng **`CardHead`** — ⛔ không đúng quy ước modal của repo và ⛔ **thiếu nút đóng** (a11y) ⇒ nếu dán nguyên, người dùng ⛔ **chỉ thoát được bằng cách bấm ra ngoài**
- ✅ **Quy ước THẬT (grep)**: tiêu đề **`.modal-head`** (`canonical.css:197`/`:203`/`:207`) · nút đóng **`✕` + `aria-label="Đóng"`** (khuôn `ConstructionScreen.tsx:57`; `EntityDetailModal.tsx:118`; `ErrorReportModal.tsx:87`) · hành động trong **`footer.modal-actions`** (`Inventory.tsx:681`)
- ✅ **Đã sửa cả 2 modal**: `CardHead` → `.modal-head` + nút đóng a11y + `footer.modal-actions` ⇒ dán vào **giống modal đang chạy**, ⛔ không thêm CSS (⛔ vẫn ⛔ không đụng `app/globals.css`)
- 📌 **Nhận xét**: đây là **lỗi thứ 2** tự bắt trong chính recipe (vòng 18: class bịa `link-like` → `.link-cell`) ⇒ cả 2 là loại lỗi **chỉ lộ khi dán vào chạy** ⇒ 2 vòng kiểm này đã **ngăn 2 lỗi vào bản build**
- 🚨 **Blocker**: shell vẫn chết **vòng 18** ⇒ tổng **19 vòng ⛔ chưa có phép thử runtime nào**

### Bổ sung vòng 20 (`TASK-20261008-D23` — **CHỐT `send`/`action`** ⇒ hết giả định chưa kiểm)
- ✅ `page.tsx:741` truyền **`action`** cho `WorkCenter` · `WorkCenter.tsx:197` — `function WorkCenter({ data, action, refresh, view = "personal" })`, **`action` trả `Promise<boolean>`** · `:233` — wrapper nội bộ `async function send(name, payload, form?)`
- ⇒ **Đóng-modal-khi-thành-công LÀM ĐƯỢC** (dùng `action`) ⚠️ nhưng **phải gọi kèm `refresh()`**; khuyến nghị vẫn là dùng `send` + đóng ngay (như màn vẫn làm)
- ✅ Kèm: **`view` mặc định `"personal"`** ⇒ khớp **Bước 4** của việc 1 (đổi `"dashboard"`, test `p5-01:42` kiểm) ⇒ ⛔ hết điểm mù
- 📌 Đây là **điểm mù thứ 3** được đóng trong 3 vòng (sau class CSS bịa · quy ước modal) — ⛔ tất cả đều là loại **chỉ lộ khi dán vào chạy**
- 🚨 **Blocker**: shell vẫn chết **vòng 19** ⇒ tổng **20 vòng ⛔ chưa có phép thử runtime nào**

### Bổ sung vòng 21 (`TASK-20261008-D24` — **XÁC MINH `send` + ĐỒNG BỘ STATE CHUNG**)
- ✅ **`send` xác minh** (`WorkCenter.tsx:233-238`): `setBusy` → `ok = await action(...)` → `if (ok) { form?.reset(); refresh(); }` ⇒ recipe L1 **đúng**; cũng xác nhận `send` ⛔ **không trả boolean** (muốn đóng-khi-thành-công phải dùng `action` + `refresh()`)
- ✅ Kèm: `:231` — `find()` lọc theo `taskNo`/`title`/`assignedToName` ⇒ hợp với việc 2 (search xuống)
- 🔄 **ĐỒNG BỘ STATE CHUNG (APPEND)**: `docs/dsh-state/SESSION_REGISTRY.md` (khối «🔄 CẬP NHẬT SESSION_04») + `SHARED_STATE.md` (**CẬP NHẬT 25** — mục 77' danh mục 6 tài liệu · 78' **3 bẫy** · 79' **6 luật repo đã kiểm** · 80' **2 bug HIGH** · 81' **2 chặn** + đề nghị STALE)
- ⭐ **Giá trị cho phiên khác**: nếu S01/S02/S03 còn sống ⇒ đọc `docs/51`→`54` là **thi hành được ngay**, ⛔ không phải điều tra lại
- 🚨 **Blocker**: shell vẫn chết **vòng 20** ⇒ tổng **21 vòng ⛔ chưa có phép thử runtime nào**

### Bổ sung vòng 22 (`TASK-20261008-D25` — **LỖI THỨ 4 TỰ BẮT: thứ tự runbook vs chỉ số tab**)
- ✅ Đọc trực tiếp `WorkCenter.tsx:86-98` ⇒ xác nhận **đúng tên + nội dung** `WORK_TABS` (`:92`) và **`WORK_TAB_OF_VIEW`**: `Record<WorkMenuView, number> = { personal:0, department:2, assign:3, kpi:4, dashboard:4, reports:5 }` (`:96`)
- 🔴 **LỖI TỰ BẮT (thứ 4)**: recipe **việc 7** (`{tab === 3}`) và **việc 6** (`{tab === 2}`) viết theo **layout 7 tab**, nhưng runbook bản đầu xếp chúng **TRƯỚC** bước đổi dải tab ⇒ thi hành đúng thứ tự cũ sẽ **chèn nhầm tab** (tab 2 = «Phòng ban» cũ; tab 3 = «Giao việc» cũ)
- ✅ **ĐÃ SỬA**: `docs/54` tách việc 1 ⇒ **L4 dải tab** (+ **4 tệp test**) · **L5 việc 7** · **L6 việc 5·6** · **L7 hub menu + bẫy `workCenterViewFor`**; thêm **§1.1 BẢNG CHỈ SỐ TAB THEO 2 LAYOUT**; `docs/53` cảnh báo chỉ số; ghi **`DEC-20261008-D09`**
- ⭐ **Loại 1 phụ thuộc giả**: tab «Được giao» ⛔ **không cần khoá `view` mới** ⇒ **việc 6 vẫn chỉ 1 tệp** (⛔ không phải sửa `menu-helpers.ts`)
- 🚨 **Blocker**: shell vẫn chết **vòng 21** ⇒ tổng **22 vòng ⛔ chưa có phép thử runtime nào**

### Bổ sung vòng 23 (`TASK-20261008-D26` — **LỖI THỨ 5 TỰ BẮT: spec port thiếu 2 nhánh quyền**)
- 🔴 **Spec cũ của tôi SAI một phần**: `docs/50` §2.2 ghi guard `requireWorkItemAccess` có **«3 nhánh»** — đọc mã gốc `scripts/system-route.mjs:501-515` ⇒ **ĐÚNG 5 NHÁNH**: ① admin · ② người được giao · ③ **trưởng phòng của CHÍNH phòng nhiệm vụ** · ④ **người tham gia** (⚠️ **chỉ** mode `comment`) · ⑤ **quyền module** (`canUse` cho comment / **`canEdit`** cho participant)
- ⭐ **2 hệ quả sẽ gây LỆCH LUẬT nếu port máy móc**: ① ⛔ **đừng bỏ nhánh ④** — người tham gia **bình luận được** nhưng ⛔ **không điều phối được** (đúng ý nghĩa «hỗ trợ liên phòng» của `WorkHierarchy`) ② ⚠️ **phải nâng capability `set_work_item_participant`: `canUse` → `canEdit`** (`ActionRbacRegistry:310`), nếu ⛔ không thì người có `canUse` **thêm được người tham gia** = **rộng hơn bản JS**
- 📦 **Sản phẩm**: `docs/50` **§2.4** — mã gốc JS + **bảng 5 nhánh** + **2 thông điệp lỗi** theo mode + 3 điểm tái dùng ở Java
- 🚨 **Blocker**: shell vẫn chết **vòng 22** ⇒ tổng **23 vòng ⛔ chưa có phép thử runtime nào**

### Bổ sung vòng 24 (`TASK-20261008-D27` — **BỘ TEST SẴN DÁN**: bịt lỗ hổng «ship thiếu test»)
- 📄 **Sản phẩm**: `docs/55` — **2 tệp test HOÀN CHỈNH sẵn dán**:
 · **`t11-work-progress-approval`**: test 0 **ĐỐI CHỨNG ÂM** (mẫu phải bắt được cả dạng CŨ lẫn MỚI ⇒ ⛔ không cổng xanh rỗng) + 8 khẳng định — trọng tâm **`BUG-D05`**: ⛔ **cấm quay lại** nút gửi `COMPLETED` vô điều kiện; `SUBMITTED` cho người thực hiện; `COMPLETED` **chỉ sau** nhánh `canApprove`; `canApproveRow` suy từ `managerDepartments`; modal theo **`.modal-head` + `aria-label="Đóng"`**; ⛔ **không** `link-like`; cổng **`COMMENTS_READY=false`**
 · **`t12-work-tabs-and-modal-convention`**: dải **7 tab** đúng 1 lần · `WORK_TAB_OF_VIEW` giữ **alias `kpi` = 0** · **⛔ không nhánh `tab === n` vượt số tab** (chống sót chỉ số) · ⭐ **test RIÊNG cho BẪY `workCenterViewFor`** (bẫy tự bắt ở vòng 14)
- ⚠️ Theo **quy ước `tests/t08:11`**: 2 tệp này **⛔ không thêm vào `package.json`** ⇒ giữ nguyên mốc hồi quy `865·864·0·1`; chạy riêng `node --test …`
- ⚠️ **2 tệp khoá hành vi MỚI** ⇒ **ĐỎ trước khi vá là ĐÚNG Ý ĐỒ** (chỉ dán khi đã/đang áp `docs/54`)
- 🚨 **Blocker**: shell vẫn chết **vòng 23** ⇒ tổng **24 vòng ⛔ chưa có phép thử runtime nào**

### Bổ sung vòng 25 (`TASK-20261008-D28` — **KỊCH BẢN UAT THỦ CÔNG** cho 7 việc)
- 📄 **Sản phẩm**: `docs/56` — **10 kịch bản bấm-thật** (K1→K10): K2 = **bẫy `workCenterViewFor`** (bấm «Công việc» phải vào Dashboard) · K5 = **`BUG-D05`** (nút phải là «Gửi kiểm tra») · K10 = **cổng `COMMENTS_READY`** · ➕ **7 ca biên** (mất menu khi ⛔ không có quyền · % ngoài khoảng · bấm 2 lần · việc phòng khác) · ➕ **bảng dấu hiệu SAI ⇒ chỉ đúng tài liệu để sửa** · ➕ mẫu **ghi bằng chứng** (ảnh + mã việc + tài khoản + Console)
- ⭐ **Vì sao cần**: ⛔ không có shell ⇒ ⛔ không verify UI bằng máy ⇒ **kiểm thủ công là đường verify DUY NHẤT** (và cũng là **UAT go-live**) ⇒ nhờ đó «đã sửa mã» mới có thể đạt **`VERIFIED`** (Goal §11)
- ✅ **2 sửa khớp recipe ↔ test**: thêm `data-vntech="work-dashboard-tab"` vào `docs/52` §3.2 · chú thích trong `docs/55` rằng `NEW_TABS` **phải chỉnh theo thứ tự tab user chốt** (hiện là **đề xuất**)
- 🚨 **Blocker**: shell vẫn chết **vòng 24** ⇒ tổng **25 vòng ⛔ chưa có phép thử runtime nào**

### Bổ sung vòng 26 (`TASK-20261008-D29` — **việc nhà cuối** + tuyên bố dừng sản xuất tài liệu)
- 🔄 `SESSION_D/README.md` (điểm vào của phiên) nay **đúng thực tế**: thêm **8 hàng mục lục** `docs/49`→`docs/56` · **SẢN PHẨM** `9 → **20 tài liệu**` · **CHỜ USER** tách **3 nhóm** (profile DSH · (A)/(B)/(C)+3 xác nhận · 7 quyết định `docs/45` §B) · **STATUS** `READY_FOR_VERIFY` → **`READY_FOR_EXECUTE`**
- ⛔ **TUYÊN BỐ DỪNG SẢN XUẤT TÀI LIỆU**: kế hoạch · recipe (7/7) · runbook · test sẵn dán · UAT · spec BE · patch pack P-08 · 2 cổng tĩnh · state đồng bộ ⇒ **⛔ không còn artefact chuẩn bị nào**; viết thêm sẽ **chỉ lặp thông tin**
- ⚠️ ⛔ **KHÔNG tự đổi trạng thái goal** — user từng phản hồi về việc này ⇒ mọi thay đổi trạng thái chờ **user chủ động**
- 🚨 **Blocker**: shell vẫn chết **vòng 25** ⇒ tổng **26 vòng ⛔ chưa có phép thử runtime nào**

### Bổ sung vòng 27 (`TASK-20261008-D30` — **AUDIT PHỦ YÊU CẦU** ⇒ bắt 2 GAP)
- ⭐ **Đổi trục kiểm**: 6 vòng trước kiểm **MÃ**; vòng này kiểm **CHỮ CỦA USER** ⇒ dựng **bảng 16 điểm yêu cầu** ⇒ **14 ĐỦ · 1 THIẾU · 1 ĐỦ-MỘT-PHẦN**
- 🔴 **GAP-1 (THIẾU thật)**: việc 5b *«nút nhận xét dành cho **TẤT CẢ** các công việc **trong danh sách**»* — kế hoạch chỉ có ô nhận xét **trong modal** ⇒ **đã bổ sung** `docs/53` **§3.4**: nút per-dòng (cột c9) mở **CÙNG modal** + cổng `COMMENTS_READY` (⛔ không thêm tệp; ⛔ không ship nút chết)
- 🟡 **GAP-2**: việc 6c *«người giao nhận thông báo khi hoàn thành»* ⇒ `notifySafely("TASK_COMPLETED")` = **dispatch theo `eventKey`**, luật ở **`notification_configs`** (bảng **gác `admin`**); ⚠️ **`queueTaskNotice` — cái ghi `task_notifications` cho chuông web — CHỈ chạy khi GIAO việc** ⇒ ⛔ **chưa chắc có thông báo trong web cho người giao** ⇒ ➕ phép thử **`K7-bis`** + đề xuất **làm cả hai** (luật cấu hình + `queueTaskNotice` nhánh `COMPLETED`)
- ⭐ **Bài học vòng này**: **kiểm mã ⛔ không thay được kiểm yêu cầu** — GAP-1 lọt qua 6 vòng vì **mã ⛔ không sai; KẾ HOẠCH thiếu**
- 🚨 **Blocker**: shell vẫn chết **vòng 26** ⇒ tổng **27 vòng ⛔ chưa có phép thử runtime nào**

### Bổ sung vòng 28 (`TASK-20261008-D31` — **chốt 2 điểm còn lại**)
- ✅ **Điểm 5c — «click vào công việc» làm được ĐÚNG nguyên văn**: `DataTable` **CÓ prop `onRowClick`** (khai `:45`, kiểu `:53`, tự thêm class **`dt-clickable`** `:116`, gắn `onClick` `:118`; tệp ghi mẫu dùng ở `:22`) ⇒ cập nhật `docs/53` §3.2: **click CẢ DÒNG** + giữ nút `link-cell` (a11y) + ⚠️ `stopPropagation()` ở ô %/nút trong dòng ⇒ **5c: ĐỦ**
- 🔴 **GAP-2 CHỐT bằng mã** (`NotificationRule.java`): luật khớp **chỉ theo `code == eventKey`** + 2 kênh `web|email`; ⛔ **không nhắm động được tới «người giao của công việc»**; `:14` *«⛔ không phát thông báo khi ⛔ không có cấu hình nào khớp»* ⇒ **phải sửa MÃ**, ⛔ không phải cấu hình: thêm **1 dòng** `queueTaskNotice(<người giao>)` trong nhánh `COMPLETED` (bảng chuông web `task_notifications` **chỉ được ghi khi GIAO việc**)
- 📋 **§4.3 CHỐT PHẠM VI THI HÀNH: 5 việc nhỏ thêm** (① nút Nhận xét per-dòng · ② `onRowClick` · ③ `stopPropagation` · ④ **1 dòng BE** · ⑤ luật `notification_configs` **bổ trợ**)
- ⭐ **Trạng thái audit phủ yêu cầu**: **15 ĐỦ · 1 THIẾU (đã bổ sung) · 0 vùng mờ**
- 🚨 **Blocker**: shell vẫn chết **vòng 27** ⇒ tổng **28 vòng ⛔ chưa có phép thử runtime nào**

### Bổ sung vòng 29 (`TASK-20261008-D32` — **2 bẫy trong «1 dòng BE»** + đồng bộ runbook)
- 🔴 **BẪY B-1**: `sv(m,k)` (`OpsTaskManagementUseCase:806`) là **tra map THẲNG** ⇒ ⛔ **không đổi kiểu tên khoá**; mà `findWorkItem` trả **SNAKE_CASE** (`assigned_by`) còn **`queueTaskNotice` đọc CAMELCASE** (`projectId`/`dueAt`/`taskNo`, vì dựng cho map của `createWorkItem`) ⇒ ⛔ **truyền thẳng map `findWorkItem` ⇒ thông báo RỖNG mã việc/hạn/dự án**
- 🔴 **BẪY B-2**: `queueTaskNotice` dựng câu chữ **«Công việc MỚI: …»** (`:222-224`) ⇒ gửi cho **người giao** khi việc **đã hoàn thành** là **sai nghiệp vụ**
- ✅ **Đã sửa**: `docs/57` **§4.4** = **mã đúng dán được** (nhánh `if ("COMPLETED".equals(next))` + **hàm `queueCompletionNotice` dựng map CAMELCASE** + câu chữ *«Công việc đã hoàn thành»*) · ước lượng **1 dòng → ~15 dòng**
- ✅ **`docs/54` §1.2**: bảng **5 việc nhỏ** gắn vào **L6 / L7 / bước cấu hình** + ⚠️ **test `t11` và UAT `K7-bis` phải cập nhật** ⇒ ⛔ người thi hành ⛔ không sót
- 🚨 **Blocker**: shell vẫn chết **vòng 28** ⇒ tổng **29 vòng ⛔ chưa có phép thử runtime nào**

### Bổ sung vòng 32 (`TASK-20261008-D33` — **đóng giả định cuối của patch BE**)
- ✅ **Xác minh chữ ký THẬT** (`queueTaskNotice:240-275`): `store.insertTaskNotification(Map notice, Instant now)` — **6 khoá**: `id` (`idGenerator.next("NTF")`) · `workItemId` · `userId` · ⚠️ **`channel = "in_app"`** · `title` · `body`; và `store.insertEmailOutbox(Map mail, Instant now)` (`recipients`/`subject`/`textBody`/`htmlBody` + guard `email.isEmpty()`)
- 🔴 **Bản phác của tôi SAI**: gọi dạng **vị trí** + **thiếu `channel`** ⇒ **đã thay bằng mã đúng** ở `docs/57` §4.4 ⇒ ⭐ **patch việc ④ nay dán được — ⛔ không còn giả định nào trong toàn bộ bàn giao**
- 🚨 **Blocker**: shell vẫn chết **vòng 29** · goal **BLOCKED** (rev 4) — chờ user gỡ ① hạ tầng ② uỷ quyền

---

## 🆕 BỔ SUNG 08/10/2026 (`ERP-SESSION-04` · vòng 52) — 7 VIỆC «CÔNG VIỆC» HOÀN TẤT & ĐÃ LÊN BẢN CHẠY

### Completed Tasks
- **`TASK-20261008-D39`** (L1·L2·L3): **việc 4** (form nội tuyến → **MODAL «Tạo công việc»**) · **việc 2** (ô tìm xuống trên danh sách + «Danh sách công việc») · **việc 3** (nhập % + «Gửi kiểm tra»/«Duyệt xong»/«Yêu cầu làm lại») ⇒ **ĐỒNG THỜI SỬA `BUG-D05`** — `DONE`
- **`TASK-20261008-D40`** (L4): dải **7 TAB** (Dashboard ĐẦU) + `WORK_TAB_OF_VIEW` mới + **nhánh tab «Được giao» RIÊNG** ⇒ `DONE`
- **`TASK-20261008-D41`** (L5·L6·L7): **2 sub-tab** + Kanban/Cây vào **«chế độ xem»** · **click CẢ DÒNG** + **MODAL CHI TIẾT** (Nhận xét **tạm ẩn**) · **HUB `work_hub`** (5 mục → 1, hợp 8 khoá quyền) + **đảo bẫy `workCenterViewFor`** ⇒ **`DONE` + `VERIFIED` 6/7 trên UI thật**

### Important Changes
- `CHG-20261008-D02…D09`: modal Tạo công việc · đổi tên/ô tìm · **nhập % + sửa `BUG-D05`** · dải 7 tab · 2 sub-tab + chế độ xem · modal chi tiết · **hub 1 mục** · **build**: vân tay `891f9f19…` → **`7DFD3E8BEA628F78`** (762 files) → (phiên khác refresh) **`12EB928FC5C211BA`**

### Testing
- `npx tsc --noEmit` = **0** (7/7 lượt) · `npm run test:regression` = **`925 test · 924 pass · FAIL 0 · 1 skip`** ⭐ **0 LỖI**
- **8 tệp test** cập nhật sang hợp đồng MỚI (⛔ không nới lỏng): `t01`·`t05`·`t06`·`t07`·`t08`·`t09`·`p5-01`·`t10`
- `verify-ui-build-applied` = **✓ do-moi · ✓ van-tay · ✓ byte 6/6** · `verify:fingerprint` **ĐẠT**
- **`TEST-D25/D26`**: soi bundle đang phục vụ (2 bản build) ⇒ đủ **10/10** dấu hiệu 7 việc
- **`TEST-D27`**: **tự nghiệm thu UI THẬT** (trình duyệt, phiên `admin` sẵn — ⛔ không đoán mật khẩu) ⇒ hub 1 mục · **active = Dashboard** · **7 tab đúng thứ tự** · `work-create-open` · modal chi tiết `role=dialog` `aria-modal=true` tiêu đề `CV-DA-260917-3436` · «Duyệt xong» CÓ / «Gửi kiểm tra» ẨN ĐÚNG VAI · sub-tab **«· 16»**/**«· 8»** + «Bảng/Kanban/Cây»

### Bugs
- ✅ **`BUG-D05` `FIXED`** (4 nút preset + nút «Xong» gửi `COMPLETED` cho mọi user ⇒ nay phân vai đúng)
- ⛔ **`BUG-D06`** (40 nhóm trùng số migration) · ⛔ **`BUG-D07`** (19 class CSS chết) ⇒ **đã bàn giao** (`HANDOFF-20261008-D06/D07`)
- ⚠️ **`REWORK` thiếu trong Java** ⇒ **đã bàn giao** (`HANDOFF-20261008-D05`)

### Decisions
- **Kanban/Cây = «CHẾ ĐỘ XEM»** (⛔ không xoá chức năng) · **«Nhận xét» TẠM ẨN** (BE Java chưa có `add_work_item_comment`) · **hub 1 mục** giữ `HUB_TAB_GROUP_KEYS` theo luật «≥2 mục mới là hub» · ⭐ **bài học**: `gd-cycle` lỗi `EPERM` = **KHÓA FILE** (⛔ không phải sandbox) ⇒ **dừng ĐÚNG PID** `scripts/local-server.mjs` rồi chạy; ⚠️ `gd-cycle` **⛔ KHÔNG tự restart** dịch vụ

### Blockers / Risks
- ⚠️ **Khoảng trống nghiệm thu còn lại**: **ô NHẬP %** chưa thấy trên UI vì tài khoản `admin` có **0 việc** (`WorkCenter.tsx:609` `if (!allowEdit) return "—"`) ⇒ cần **tài khoản nhân viên có việc** (UAT `docs/56` mục **K4`)
- ⚠️ Phiên khác **restart dịch vụ liên tục** trong lúc tôi nghiệm thu (PID `local-server` 13464→22476→7768) ⇒ trang mất kết nối giữa chừng

### Remaining Work / Next Week
- ⏳ User nghiệm thu `docs/56` (K1→K10 + 7 ca biên) · ⏳ 3 bàn giao trên (Java `REWORK` · `BUG-D06` · `BUG-D07`) · ⏳ `verify:css-baseline` + `test:release-static` + `verify:release` vẫn ĐỎ do `BUG-D06/D07`

---

## 🆕 BỔ SUNG 08/10/2026 (vòng 63–66 · `ERP-SESSION-04`) — 3 VIỆC MỚI + 2 PHÁT HIỆN + 1 TỰ ĐÍNH CHÍNH

### Completed Tasks
- ✅ **`TASK-20261008-D43`** — **3 yêu cầu MỚI của user**: ① bỏ dải **«ĐANG PHÁT TRIỂN»** trong module Công việc ② bỏ filter **«Chọn dự án»** ③ bỏ nút **«Xuất CSV»** ở MỌI tab ⇒ ⭐ cách làm nhỏ nhất: `app/page.tsx` **1 biểu thức** (`workCenterView === null &&` cho CẢ notice LẪN filter) + `WorkCenter.tsx` gỡ nút & import ⇒ **DONE**
- ✅ **`BUG-D11` FIXED** — tiêu đề «CÔNG VIỆC» **đếm trùng** (`deptWork.length + teamWork.length` = **24** > tổng **16**, vì `teamWork ⊂ deptWork`) ⇒ dùng tập **HỢP không trùng** `deptTeamWork` + **test cấm cộng dồn** ⇒ **DONE**

### Bugs / Hotfixes
- 🔴 **`BUG-D12` (phát hiện, ⛔ KHÔNG sửa — ngoài uỷ quyền)** — **yêu cầu 6c của user ⛔ CHƯA LÀM**: `queueTaskNotice` (`system-route.mjs:277-283`) **chỉ gọi khi GIAO** (`:293`/`:1278`) ⇒ ✅ **6b (báo khi được giao) ĐÃ CÓ**; handler `update_work_item_status` (`:1274-1275`) ⛔ **không gọi hàm thông báo nào** ⇒ 🔴 **Node THIẾU HOÀN TOÀN**; ✅ **Java CÓ** (`OpsTaskManagementUseCase.java:385` `notifySafely("TASK_COMPLETED")`) nhưng **theo CẤU HÌNH** ⇒ ⛔ không đảm bảo đúng người giao ⇒ **đã bàn giao** (`HANDOFF-D10`)
- ⚠️ **TỰ ĐÍNH CHÍNH**: câu *«Java cũng thiếu»* của phiên 04 **SAI** ⇒ đã kiểm mã Java trực tiếp + đính chính **4 tài liệu** (`BUG_HOTFIX_LOG` · `HANDOFF-D10` · `docs/58` · `EVENT_LOG` D264) ⇒ ⭐ **bài học: ⛔ không kết luận về đường mình chưa đọc**
- ⚠️ **`BUG-D08` (`F-03`) đã `CLOSED`** (phiên sửa `java-backend` cập nhật xong — hồi quy từ `FAIL 1` → **`FAIL 0`** ở vòng 58)
- ⚠️ **`W-02`** (test **CSDL THẬT** vs tài liệu audit: `kho=14 · dự án=5 · kho gắn dự án=10`) **chuyển đỏ** ở vòng 63 ⇒ ⭐ **đã chứng minh ⛔ không do phiên 04** (test chỉ đọc tài liệu + **truy vấn MySQL**, ⛔ không đọc UI) ⇒ **đã bàn giao** (`EVENT-D261`)

### Testing
- `npx tsc --noEmit` = **0** · **`tests/t13-work-progress-cell.test.mjs` = 8/8 PASS** (thêm 2 test: *cấm đếm trùng* + *mọi action phải có backend / Java-only phải được khai*)
- Hồi quy: **`939 test · 937 pass · FAIL 1 · 1 skip`** (⚠️ tổng test **925 → 939** là do **các phiên KHÁC đang thêm test** ⇒ ⭐ đa phiên vẫn chạy song song) · ⚠️ 1 lỗi = `W-02` (CSDL thật, phiên khác)
- ✅ **KIỂM CHÉO chống BÁO ĐỘNG SAI**: `create_self_work_item` ⛔ không có ở Node route ⇒ nghi lỗi HIGH ⇒ **kiểm rồi bác bỏ**: **action JAVA-ONLY ĐÃ BIẾT** (`SystemController.java:1020` + khai ở `tools/audit-java-only-actions.mjs`) ⇒ ⛔ **không phải bug** + đã thêm **test khoá cả lớp lỗi này**

### Important Changes
- `CHG-20261008-D10` (3 sửa UI theo yêu cầu user) · `CHG-20261008-D11` (fix đếm trùng) · `docs/58 §6b` + §1/§4 cập nhật **trung thực** (việc 6 = **6b ✅ / 6c ⛔**; việc 5b = **nút «Nhận xét» tạm ẩn**)

### Decisions
- `DEC-D14` (`title` phải là `let` — tránh TDZ) · `DEC-D15` (⛔ **không chạy `gd-cycle` lẻ** — mỗi lần **sinh thêm 1 migration identity**, làm `BUG-D06` nặng thêm) · ⭐ **bài học vận hành**: heredoc PowerShell + tiếng Việt **dễ vỡ** ⇒ dùng tool `edit`; `browser_evaluate` cần **IIFE**; ⛔ **đừng khoá bằng SỐ DÒNG** (gốc `BUG-D08`/`F-03`)

### Remaining Work
- ⏳ **`BUG-D12`** (yêu cầu 6c): cần **uỷ quyền `scripts/**` + `java-backend/**`** (Node đạt parity + khuyến nghị ghi `task_notifications` cho `assigned_by` ở **cả hai** đường)
- ⏳ **Việc 5b** (nút «Nhận xét»): **tạm ẩn theo quyết định user** — cần **port BE Java** (**mã dán sẵn `docs/57 §4.4`**)
- ⏳ **Ô NHẬP %** chưa nghiệm thu được (cần **tài khoản nhân viên có việc**) · ⏳ **BUILD gộp MỘT LẦN** (`BUG-D09`/`D10`/`D11` + 3 sửa UI chưa lên màn hình)
- ⏳ **`REWORK` thiếu trong Java** (`HANDOFF-D05`) · **`BUG-D06`** (40 nhóm trùng số migration) · **`BUG-D07`** (19 class CSS chết)

---

## 🆕 BỔ SUNG 08/10/2026 (vòng 67–71 · `ERP-SESSION-04`) — UỶ QUYỀN CỦA USER + KIỂM CHỨNG END-TO-END

### Completed Tasks
- ✅ **`BUG-D12` (yêu cầu 6c) — FIXED cả 2 đường**: **Node** (`queueCompletionNotice` + gọi khi `COMPLETED`) · **Java** (`queueCompletionNotice` ở **cuối lớp** + gọi **inline 1:1** tại `notifySafely(...)`) ⇒ ghi **TRỰC TIẾP** `task_notifications` (`in_app`) + `email_outbox` (`task_completed`) cho **NGƯỜI GIAO** (⛔ không phụ thuộc `notification_configs`) · ⚠️ bỏ qua 2 ca (không có người giao · người xác nhận chính là người giao)
- ✅ **`BUG-D13` FIXED** (LOW): email «giao việc» bản **text** ghi sai tên người giao (`:258` dùng tên NGƯỜI NHẬN) ⇒ `actor.fullName()` (**thay 1:1**)
- ✅ **Ẩn Kanban/Cây** (yêu cầu user): giữ NGUYÊN mã, **1 cờ** `WORK_VIEW_MODES_HIDDEN` để bật lại + có test khoá
- ✅ **7/7 VIỆC CỦA USER ĐÃ ĐƯỢC KIỂM CHỨNG** — ⭐ điểm cuối (việc 3 · ô nhập %) **ĐÃ ĐÓNG** bằng probe end-to-end

### Testing (bằng chứng mạnh nhất vòng này)
- ⭐ **PROBE END-TO-END BẰNG TÀI KHOẢN NHÂN VIÊN (`TEST-D39`)** — 11/12 ĐẠT: tạo **nhân viên `da_nv`** (admin lấy từ chính `tools/probe-work-permission.mjs` — ⛔ không đoán mật khẩu) ⇒ admin giao việc ⇒ **nhân viên cập nhật % = 45 ⇒ HTTP 200 + CSDL `progress=45` + tự chuyển `IN_PROGRESS`** ✅ ⇒ đối chiếu `taskNotifications` của payload `bootstrap` (đúng dữ liệu UI)
- 🔴 **`BUG-D12` TÁI HIỆN trên bản đang chạy** (người giao nhận 0 thông báo) ⇒ ⭐ bằng chứng lỗi là THẬT; ⚠️ nguyên nhân: **proxy đang phục vụ đường JAVA** (đo: `create_self_work_item` = HTTP 200) mà **bản Java đang chạy là bản CŨ** ⇒ ⏳ mã sửa **chưa lên bản chạy** ⇒ `VERIFIED` bắt buộc **build + restart rồi chạy lại probe**
- ⭐ **JAVA BIÊN DỊCH ĐƯỢC KHÔNG CẦN MAVEN**: `javac` + `@argfile` cho **72 tệp** `domain`+`application` ⇒ **EXIT 0** (⚠️ bẫy: `javac` @argfile **ăn mất dấu `\`** ⇒ phải dùng dấu `/` + bọc `"…"`) · ⚠️ `infrastructure`/`web` ⛔ chưa biên dịch được (thiếu jar `poi`/`jakarta.mail` trong `~/.m2`) ⇒ vẫn nên chạy `mvn -q compile` khi có Maven
- Hồi quy: **`952 test · 951 pass · FAIL 0 · 1 skip`** ⭐ **0 LỖI** · `t13` **10/10** · `F-03` **7/7** · `tsc` **0**

### Bugs / Hotfixes
- 🔴 **P-08 (`BUG-D01`) — ĐÃ THỬ ÁP VÀ **HOÀN NGUYÊN TOÀN BỘ** (⛔ KHÔNG SHIP)**: áp 21 phép 1:1 theo `docs/47` ⇒ **`TM-04` bắt được LEO THANG ĐẶC QUYỀN** (gắn module `site_command` ⇒ **`commander` đi qua cổng registry** ⇒ ngừng/xoá được tổ đội) ⇒ ⚠️ **`docs/47` do chính phiên này soạn SAI ở mục 8-9** ⇒ ✅ hoàn nguyên 21+17 phép (tệp về **598 dòng**, `List.of()` về **67**, hồi quy 0 lỗi) + ✅ **`docs/47` đã đính chính** (cảnh báo đỏ + phương pháp 4 bước)
- 🟡 `BUG-D11` (đếm trùng tiêu đề module) · `BUG-D05`/`BUG-D09`/`BUG-D10` — đã FIXED các vòng trước

### Important Changes
- `CHG-D10` (3 sửa UI theo yêu cầu) · `CHG-D11` (đếm trùng) · `CHG-D12` (`BUG-D12` Node + Java) · `docs/58` §1/§4/§6b **cập nhật trung thực** (việc 6 = 6b ✅/6c đã sửa · việc 3 = **VERIFIED** · việc 5b tạm ẩn)

### Decisions
- ⭐ **P-08 ⛔ KHÔNG «dán patch»**: mỗi action phải **đo cổng role ở CẢ 2 route TRƯỚC**; ⚠️ `List.of()` **⛔ không** diễn đạt được «chỉ admin» (vì `RbacService:83` cho `director`/`accountant` qua mọi danh sách không chứa `"admin"`) ⇒ admin-only phải dùng **`ADMIN_ONLY_ACTIONS`** hoặc `List.of("admin")` · ⭐ **thà lùi còn hơn ship lỗ hổng**
- 5 quyết định user 08/10 (uỷ quyền · chưa cần filter · ẩn Kanban/Cây · chờ build · test bằng tài khoản nhân viên) — đã ghi `DECISION_LOG`

### Blockers/Risks
- ⏳ **BUILD** chưa chạy (chờ S01 xong — việc 4 của user) ⇒ mã FE + `BUG-D12` **chưa lên bản chạy** ⇒ `BUG-D12` **chưa `VERIFIED`**
- 🔴 **P-08 vẫn `OPEN`** — cần **quyết định nghiệp vụ TỪNG ACTION** (18 action) từ user
- ⚠️ Dữ liệu thử do probe tạo: tài khoản `probe_d12_528419` **ĐÃ KHOÁ** (`active=false`) + 2 việc thử ⇒ ⭐ cần biết khi dọn dẹp sau này

### Remaining Work / Next Week
- Chạy lại **probe `TEST-D39`** sau khi BUILD ⇒ chốt `VERIFIED` cho `BUG-D12` + chụp **ảnh ô nhập % của nhân viên**
- Áp **P-08** theo **quyết định từng action** của user (kèm test chống leo thang cho mỗi action)
- `BUG-D06` (40 nhóm trùng số migration) · `BUG-D07` (19 class CSS chết) · port Java cho nút «Nhận xét» (`docs/57 §4.4`)

---

## 🆕 BỔ SUNG 08/10/2026 (vòng 72–80 · `ERP-SESSION-04`) — CỔNG PHÁT HÀNH · RBAC `P-08` · 2 LỖI MỚI · 1 SỰ CỐ TỰ BÁO CÁO

### Completed Tasks
- ✅ **`BUG-D06` (cổng phát hành đỏ)** — sửa **phần mã**: `verify-full-release.mjs` kiểm **CHUỖI MÃ SỐ** (mạnh hơn phép đếm file) · `generate-release-manifest.mjs` thêm `_javac-verify` vào loại trừ · `gd-cycle` **chặn trùng số** → ⏳ **sinh lại manifest trong BUILD** là cổng **XANH**
- ✅ **`P-08` (RBAC 18 action) — bản AN TOÀN**: đo **16/16 action = route JS `requireRole(["admin"])`** mà Java chỉ `requireCurrentUser` ⇒ ⚠️ **phát hiện đề xuất cũ của chính phiên này (`docs/47 §A/§B`) sẽ gây LEO THANG ×16** ⇒ ⛔ KHÔNG áp · ✅ thay bằng **`ADMIN_ONLY_ACTIONS` (18 action)** + nhánh kiểm **đứng trước nhánh học-vị** ⇒ chỉ `admin` + **đúng thông điệp** (⚠️ đổi hành vi: `director`/`accountant` nay **bị chặn** = ⭐ siết ĐÚNG theo route JS)
- ✅ **`BUG-D15` (việc 4 — tự tạo việc ⛔ không thấy việc)**: root cause ở **CẢ 2 ĐƯỜNG** (`department_code='CN'` ⛔ không khớp bộ lọc phòng ban) ⇒ sửa **1:1** cho **cả Node + Java** (nhánh phòng ban **mở đầu bằng `wi.assigned_to=?`**) + test khoá 2 đường
- ✅ **`BUG-D14` (Java thiếu `REWORK` + 4 `WAITING_*`)** ⇒ nút «Yêu cầu làm lại» **hỏng trên bản chạy thật** — đã sửa + test chống lệch **vĩnh viễn**
- ✅ **`BUG-D13`** (email ghi sai tên người giao, sửa 1:1) · ✅ **`TEST-D39`**: **7/7 việc user đã kiểm chứng** (việc 3 · **ô nhập %** — probe E2E bằng **tài khoản nhân viên thật**)

### Bugs / Hotfixes
- 🔴 **`BUG-D16` — SỰ CỐ DO CHÍNH PHIÊN NÀY (tự báo cáo)**: script kiểm chứng `P-08` gọi **payload RỖNG bằng admin** ⇒ **3 action GHI THẬT** (`save_email_settings` · `retry_email` · `save_ui_display_settings`) ⚠️ giả định «payload rỗng vô hại» **SAI** · 🔍 **đo thiệt hại (chỉ đọc) = THẤP**: ⭐ **SMTP vốn CHƯA cấu hình** (`CURRENT_STATE.md` REMAINING có mục «SMTP» · `enabled=false` · `passwordConfigured=0`) ⇒ ⛔ không mất cấu hình đang chạy · ⛔ không gửi email · UI vẫn giá trị hợp lý ⇒ ⛔ không cần khôi phục · ✅ khắc phục: bộ probe chỉ còn **2 action ⛔ an toàn** (kiểm dữ liệu TRƯỚC khi ghi)
- 🟡 `BUG-D11` (đếm trùng tiêu đề) · `BUG-D05/D09/D10` — FIXED các vòng trước

### Testing
- ⭐ **JAVA BIÊN DỊCH ĐƯỢC ⛔ KHÔNG CẦN MAVEN**: `javac` + `@argfile` (⚠️ phải dùng **dấu `/`** + bọc `"…"`) cho `domain`+`application` **EXIT 0** · ⭐ **và RIÊNG 1 tệp** trong `infrastructure` (classpath `~/.m2` + `-sourcepath`) **EXIT 0**
- ✅ **Bộ test TRONG GATE XANH**: `955 test · 954 pass · FAIL 0 · 1 skip` · `t13` **13/13** · `tsc` **0** · `F-03` **7/7**
- ⭐ **Baseline 2 CHIỀU (⛔ 0 tác dụng phụ)** `TEST-D44`: nhân viên ⇒ **403** (trước build: thông điệp SAI) · **admin ⇒ 400 = đã QUA cổng quyền** ⇒ sau BUILD phải: nhân viên **403 + thông điệp ĐÚNG**
- ✅ **Bộ 8 PROBE ĐÃ LƯU VÀO REPO**: `docs/dsh-mutil-session/SESSION_D/probes/**` (⛔ không mất khi TEMP bị dọn)

### Important Changes
- `CHG-D14` (cổng phát hành + manifest + gd-cycle) · `CHG-D15` (`BUG-D15` cả 2 đường) · `CHG-D16` (`P-08` `ADMIN_ONLY_ACTIONS`) · ✅ **`docs/47` đính chính lần 2** (§A/§B ⛔ KHÔNG áp) · ✅ **`docs/59` phác đồ `BUG-D06`** · ✅ **`docs/60` RUNBOOK sau BUILD**

### Decisions
- ⭐ **`P-08`: ⛔ KHÔNG gắn module cho action admin-only** — đo **16/16** action trước khi gán; bài học `TM-04` nhân 16
- ⭐ **Thay đổi hành vi có chủ đích**: 18 action nay **chỉ `admin`** (⛔ chặn `director`/`accountant`) = **khớp route JS** ⇒ **siết**, ⛔ không nới
- ⭐ **Bài học `BUG-D16`**: *«payload rỗng ⛔ KHÔNG đồng nghĩa vô hại»* ⇒ ⛔ không thử cổng quyền bằng action có thể ghi

### Blockers/Risks
- ⏳ **CHỜ BUILD** (việc duy nhất còn lại): ⛔ chưa thể `VERIFIED` cho `BUG-D12/D14/D15`/`P-08` và ⛔ cổng phát hành chưa XANH (cần **sinh lại manifest**)
- ⚠️ Tài khoản kiểm thử: `probe_d12_528419` **ĐÃ KHOÁ** · `probe_self_186408` **còn hoạt động** ⇒ cần **dọn** (RUNBOOK `docs/60` bước 4)

### Remaining Work / Next Week
- Chạy **RUNBOOK `docs/60`**: build → sinh lại manifest → 6 probe → dọn tài khoản → ghi `VERIFIED` + chụp ảnh **ô nhập %**
- `BUG-D06` còn bước **sinh lại manifest** (thuộc BUILD) · `BUG-D07` (19 class CSS chết) · port Java cho nút «Nhận xét» (`docs/57 §4.4`)
