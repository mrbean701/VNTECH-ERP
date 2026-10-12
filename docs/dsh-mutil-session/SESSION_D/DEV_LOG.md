# DEV_LOG — SESSION_D (ERP-SESSION-04)

> Phiên tài liệu ⇒ ⛔ 0 dòng mã sản phẩm thay đổi. Ghi lại **việc đọc/kiểm chứng kỹ thuật** đã làm.

## DEV-20261008-D01 — Xác minh kiến trúc backend thật (đọc mã, không suy đoán)

| Hạng mục | Kết quả [ĐỌC MÃ] |
|---|---|
| Module Maven | `java-backend/{domain,application,infrastructure,web}/pom.xml` ⇒ **Clean Architecture 4 module** đã hiện thực |
| Use case | 25 lớp trong `application/.../service/` (`RequestManagementUseCase` · `PurchaseManagementUseCase` · `StockManagementUseCase` · `ProjectManagementUseCase` · `ProjectContractUseCase` · `BoqManagementUseCase` · `UserManagementUseCase` · `MaterialCatalogManagementUseCase` · `SupplierManagementUseCase` · `FinanceManagementUseCase` · `HrManagementUseCase` · `ContractReviewUseCase` · `ProductionManagementUseCase` · `NotificationManagementUseCase` · `OpsTaskManagementUseCase` · `PartnerManagementUseCase` · `SystemSettingsUseCase` · `AdminSystemUseCase` · `AdminOpsManagementUseCase` · `AuthUseCase` · `BootstrapUseCase` · `FileUseCase` · `ErrorReportUseCase` · `ListActiveProjectsUseCase` · `JsonWriter`) |
| Chuỗi mua hàng | `PurchaseManagementUseCase`: `createPo` L57 · `closePoLine` L210 · `approvePo` L235 · `rejectPo` L240 · `updatePoPrice` L267 · `receiveGoods` L300 · `confirmDelivery` L444 |
| RBAC 2 tầng | `ActionRbacRegistry` — module: `create_request`→`requests` · `decide_approval`→`approvals` · `create_po`/`approve_po`/`reject_po`/`close_po_line`→`purchasing` · `receive_goods`/`confirm_delivery`→`receiving`,`warehouse_receipt` · `save_boq_item`/`save_project_contract`→`boq` · `save_supplier`→`supplier_catalog`; capability: `canCreate`/`canEdit`/`canApprove`/`canUse` |
| Dispatcher | `SystemController` — nhánh `case "…"` cho toàn bộ action (đề nghị, duyệt, PO, giao nhận, kho, dự án, quyền, báo lỗi) |
| Test canh lõi | `RequestApprovalIntegrationTest` · `RequestApprovalOwnerOnlyTest` · `ApprovalSlaAutoRejectTest` · `DirectorPendingApprovalsTest` · `PoRbacActionsIntegrationTest` · `ActionRbacRegistryPoTest` · `RbacSupplierMaterialTest` · `NotificationScopeRbacTest` · `ConstructionRbacEnforcementTest` · `ProjectAdminIntegrationTest` · `ProjectCreateWarehouseFlagTest` |

## DEV-20261008-D02 — Đối chiếu số liệu giữa các tài liệu
- `docs/09` (09/09/2026) nói **monolith JS**, migration `0000..0075`, regression `61/61` ⇒ **lỗi thời**.
- Số liệu hiện hành (có ngày): `SESSION_C/README.md` 08/10 ⇒ migration `0339→0344` · hồi quy **865 test / 864 pass / 0 fail / 1 skip** · `tsc` 0 · `eslint` 0 lỗi · 6 lần `gd-cycle` exit 0.
- `CURRENT_STATE.md` ⇒ 3 dịch vụ `:18081`/`:8787`/`:9000` · đăng nhập `POST /api/system` · `module_catalog` 76 · Flyway `v34`.

## DEV-20261008-D03 — Blocker hạ tầng
Shell harness: `ERR_MODULE_NOT_FOUND: @deepseek-ai/dsh-scope` (profile DSH web) ⇒ ⛔ không chạy được lệnh/gate/go-verify. Đã báo user; khuyến nghị sửa profile trước vòng kiểm định kế tiếp.

## DEV-20261008-D04 — **BẢN ĐỒ TẦNG CỔNG QUYỀN TOÀN HỆ LÕI** (đọc mã, ⛔ không chạy)

**Phát hiện nền**: một action có thể bị chặn ở **2–3 tầng**; **thông điệp lỗi là dấu vân tay của tầng** (`RbacService:82-83` vs `SystemController:1742`).

| Việc đã làm | Kết quả [ĐỌC MÃ] |
|---|---|
| Đọc `SystemController:1120-1199` (chuỗi mua hàng) | **13/13 action dùng `requireCurrentUser`** ⇒ module-gated; mã ghi rõ chủ ý *«⛔ KHÔNG hard-code quyền ở đây»* (`:1138-1140`) |
| Đọc `SystemController:1200-1257` (kho) | **12 action** (`ship_transfer_order` · central return ×3 · stock count ×2 · reconcile · transfer contract ownership · reverse movement · receive transfer · confirm installation · issue_stock) — **tất cả `requireCurrentUser`** ✅ |
| Đọc `SystemController:636-651` (tài chính) | `save_contract_payment` · `import_contract_payments` · `save_team_subcontract` — `requireCurrentUser` ✅ |
| Đọc `SystemController:1430-1448` (NCC) | `save_supplier` · `set_supplier_status` = `requireCurrentUser` ✅ · 🔴 `delete_supplier` = **`requireRequireAdmin`** ⇒ **lệch với registry** (`supplier_catalog`/`canEdit`) |
| Đọc `SystemController:376-423` (phân quyền) | ⭐ **`update_user` = TIỀN LỆ VÀNG**: MỐC 109 **bỏ cổng hard-code** ở controller, để **cổng duy nhất ở tầng ①** + giữ `guardRoleChange` trong use case (`:379-394`, ghi rõ trong mã) · `save_user_access`/`delete_user_module_override`/`create_user`/`set_user_status`/`reset_user_password`/`delete_user` = **`requireRequireAdmin`** (A) |
| Đọc `SystemController:1008-1023` (công việc/tổ đội) | `create_project_team` = `requireCurrentUser` ✅ (+module `site_command`) · `set_project_team_status` = `requireCurrentUser` **nhưng registry RỖNG** ⇒ ⚠️ **M bị 403** (thuộc P-08) |
| **Kết quả tổng** | 🎯 **Chuỗi lõi go-live KHÔNG bị chặn quyền sai** (module-gated đúng) · 🔴 **3 bất nhất quán**: `delete_supplier` (lệch registry↔controller) · PROJECT CRUD (hard-code admin giữa hệ module-gated) · **P-08** (10–12 action RỖNG + không admin-gate) |
| Sản phẩm | `docs/41_MA TRAN QUYEN GO-LIVE_20261008.md` — bảng tra **A / L / M** cho từng action + gợi ý cấu hình module cho 4 phòng + **tiền lệ sửa đúng** (MỐC 109) |

---

## DEV 08/10/2026 (vòng 81–91 · `ERP-SESSION-04`) — **MA TRẬN WORK ĐỘNG** + 3 kỹ thuật mới

| Hạng mục | Nội dung kỹ thuật |
|---|---|
| **RBAC (khoá mới)** | Thêm **1 khoá quyền dùng chung `work`** ở **5 tầng**: `MODULE_KEYS` (Node) · `ActionRbacRegistry` (Java) · `ModuleKey` (TS) · dòng ma trận (`menu-helpers`) · `module_catalog` (CSDL). ⚠️ Khoá **nằm trong `legacyWorkMenuKeys`** ⇒ **có ở MA TRẬN nhưng ⛔ không thành mục menu** (menu đã có `work_hub`) — kỹ thuật: `permissionMenuStructure` đọc thẳng `configuredModules`, còn cây menu lọc qua `legacy*MenuKeys` ⇒ **1 khoá, 2 số phận** |
| **SQL ĐỘNG (chống hardcode)** | Phạm vi `workItems`: mã phòng tra **bằng SUBQUERY** `users.organization_unit_id → organization_units.code` ⇒ chạy đúng cho **11 đơn vị** mà ⛔ không cần thêm trường vào `Context`/`user` (2 đường đều thiếu `organizationCode` ⇒ subquery là cách **duy nhất** giữ được parity + 0 dòng dịch) |
| **Tương thích 2 engine** | Dùng `LIKE '%_truong'` (**⛔ KHÔNG** `'%\_truong'`): MySQL hiểu `\_` là thoát, **SQLite ⛔ không** ⇒ viết dạng chạy được ở **cả hai**. Ghi rõ trong mã + test |
| **An toàn dữ liệu** | `V40`: ① `INSERT IGNORE` + `NOT EXISTS` (idempotent — **đã chứng minh** chạy 2 lần ⛔ không đổi số dòng) ② cấp theo đơn vị bằng **`MAX()` năng lực đang có** ⇒ ⛔ **không nới quyền** ③ **`HAVING`** loại đơn vị ⛔ chưa từng cấu hình (nếu không ⇒ đơn vị bị coi là «đã cấu hình» ⇒ **CHẶN cấp quyền** module khác) |
| **Ma trận phân quyền (FE)** | Ẩn 4 khoá cũ **Ở TẦNG VẼ** (`visibleEntries`) — ⛔ **không** đụng `entries`/`permissionMatrixKeys` ⇒ **zero rủi ro** cho payload FULL-REPLACE; + **bỏ DÒNG NHÓM RỖNG** (kỹ thuật: quét tới tiêu đề cùng cấp) |
| **Chống mất quyền âm thầm** | Tách `bulkKeys = moduleKeys − khoá ẩn` cho `setAll`/`setColumnAll`/`columnState`; `setAll` đổi sang **MERGE** (`{...permissionState, ...}`) để **giữ nguyên** giá trị khoá ẩn thay vì thay cả object |
| **Tooling** | ① `probe-action-parity`: regex bắt **CẢ NHÓM NHÃN** `case "a", "b" ->` (trước chỉ nhãn đầu ⇒ **báo thiếu OAN**) ② `generate-rbac-registry`: **chốt chặn mất dữ liệu** — phát hiện mục ghi tay ⇒ **DỪNG, ⛔ không ghi tệp** (trừ cờ `--allow-drop-handwritten`) |
| **Kỹ thuật khôi phục** | Khôi phục 1 tệp về đúng HEAD **mà ⛔ không dùng `git checkout/reset`**: `git cat-file blob HEAD:<path>` → `cmd /c "... > tmp"` (**byte-chuẩn**) → `Copy-Item`; ⭐ chứng minh bằng `git diff --numstat` = **rỗng** |
| **Kỹ thuật biên dịch** | `javac` KHÔNG Maven cho 1 tệp trong module `infrastructure`: `-cp` = **mọi jar trong `~/.m2`** đặt qua **biến `CLASSPATH`** (⛔ không nhét vào dòng lệnh — vượt giới hạn) + `-sourcepath` 4 module. ⚠️ **@argfile ⛔ KHÔNG dùng được**: đường dẫn có dấu cách ⇒ javac tách sai (`invalid flag: lieu/1.`) |
| **Bài học lớn** | ⛔ «SINH TỰ ĐỘNG» trong chú thích mã **⛔ không** bảo đảm tệp không có phần ghi tay ⇒ **chạy bộ sinh phải `git diff` trước/sau** (xem `BUG-D17`) |

---

## 🔧 CẬP NHẬT KỸ THUẬT (vòng 82–89 · 08/10/2026) — những gì ĐÃ PHÁT TRIỂN/SỬA (không chỉ «task nào»)

| Chủ đề | Nội dung kỹ thuật |
|---|---|
| **Bỏ hardcode phòng ban — đường JS (`BUG-D23`/`CHG-D24`)** | `create_work_item`: `["KH","DA"]` → **tra tồn tại** `organization_units(code=?,active=1)`. `isDepartmentManager`: hàm **sync 1 dòng** → **`async` 1 dòng** với **2 nhánh** (giữ `role.endsWith("_truong") && role.slice(0,-7).toUpperCase()===dept` để ⛔ không hồi quy + nhánh `EXISTS(user_module_permissions … module_key='work' AND can_approve=1)` **kèm** `ou.code=?` ⇒ **đúng đơn vị**). `userCanReceiveDepartmentTask`: thêm vế **thành viên đơn vị thật** (`users.organization_unit_id`). `defaultDepartmentAssignee`: thêm `LEFT JOIN organization_units` + `ORDER BY CASE WHEN ou.code=? THEN 0 ELSE 1 END` ⇒ **ưu tiên cùng đơn vị**. ⭐ **Kỹ thuật 0 dòng dịch**: 12 dòng viết lại **trên chính dòng cũ** (chú thích nhét **trong dòng**) ⇒ tệp vẫn **3452** dòng ⇒ ⛔ vùng khoá `F-03` không xê dịch |
| **Quy tắc an toàn khi đổi `sync` → `async`** | ⛔ **Thiếu `await` = cổng quyền LUÔN CHO QUA** (Promise truthy) — **native bug nguy hiểm nhất của JS** ⇒ kèm theo: `grep` **mọi** điểm gọi + **test ĐẾM số `await`** (`t13-B` đếm **đúng 5**) |
| **Cổng đo phải là cổng THẬT** | `verify-ma-tran-dong.mjs`: chỉ-`console.log` ⇒ **luôn `exit 0`** = ⚠️ **cổng giả**; nay **5 khẳng định + `process.exitCode`** |
| **`process.exit()` + `fetch` = CRASH** | ⚠️ Node **crash lúc thoát** (`UV_HANDLE_CLOSING`) ⇒ mã thoát **-1073740791** **dù kết quả ĐÚNG** ⇒ 📌 dùng **`process.exitCode`**, ⛔ không `process.exit()` (đã áp cho 3 probe, đo lại **exit 0 · crash 0**) |
| **Bài học lồng chuỗi trong JS** | ⛔ **backtick trong template literal** ⇒ phải dùng nháy kép (`"%_truong"`) |
| **Kiểm SQL mà ⛔ không cần chạy server** | Thay bind bằng **giá trị thật** rồi chạy trên MySQL: chứng minh **luật động ĐÚNG** (`trdademo`+`DA`=1 · +`KH`=**KHÔNG**) + **đếm `?` ↔ bind** ở cả 5 câu (2·2·4·4·3·1) |
| **Nghiệm thu LIVE trước BUILD** | Payload ứng dụng = **GET `/api/system`** (⛔ không phải `POST {action:"bootstrap"}`) — ⭐ đọc **mã UI** (`app/page.tsx:345`) để biết cách gọi đúng; jar đang chạy **mới hơn** mã Java ⇒ **nghiệm thu được ngay** (`TEST-D47`: giám đốc **19 = admin** · trưởng phòng **17** · nhân viên **0**) |
| **Kiểm cổng quyền qua E2E** | `create_work_item` → `approve_work_item` → **đối chứng âm** → **dọn** (`CANCELLED`): phát hiện phản hồi **⛔ không trả `id`** ⇒ tra `id` từ CSDL; ⚠️ `id` dạng **`WI_<uuid>`** (⛔ đừng ép regex hex) |
| **Nâng probe thành cổng** | Thêm **khẳng định có mã thoát** + bất biến «4 khoá CŨ ⛔ không được xoá khỏi `module_catalog`» |

---

## 🔧 09/10/2026 (`ERP-SESSION-04` — lượt phiên 4 mới) — **W2 + W3 + đóng cổng drift**: 4 kỹ thuật đáng ghi lại

| Chủ đề | Nội dung kỹ thuật |
|---|---|
| **W2 — «xem việc NGƯỜI KHÁC» mà ⛔ KHÔNG đụng máy chủ** | ⭐ **ĐO TRƯỚC KHI THIẾT KẾ**: payload `workItems` mà admin nhận về **đã gồm 21 dòng của NHIỀU NGƯỜI KHÁC** ⇒ phạm vi **đã do MÁY CHỦ lọc** (`workItemWhere` + `isDepartmentManager`) ⇒ W2 **chỉ là việc GOM LẠI ở giao diện**: khối thuần `workByOwnerGroups(rows)` (mốc `W2-PURE-BEGIN/END`) + bộ chọn «Nhóm của tôi (**mặc định**) / Theo người» ⇒ ⛔ **0 API mới · 0 dòng CSDL · 0 dòng quyền** ⇒ rủi ro thấp, hoàn nguyên dễ ✓ |
| **Nhóm theo KHOÁ ĐỊNH DANH, ⛔ không theo TÊN** | Nhóm theo `assignedTo` (id) + chỉ dùng `assignedToName` làm **NHÃN** ⇒ **2 người TRÙNG TÊN = 2 nhóm** (nếu nhóm theo tên thì bộ đếm của mỗi người **SAI**) — có test khoá (`t14`) ✓ Đây là **cùng lớp lỗi** với «nhóm theo `assignedByName`» mà mắt thường khó thấy |
| **W3 — 2 CỔNG cho nút PHÁ HUỶ (chống «nút chết»)** | Nút «Xoá» **chỉ** hiện khi: ① `modulePermission(data,"work").canEdit` (**năng lực**) ② `String(row.assignedBy) === myId && !WORK_CLOSED.includes(status)` (**luật theo dòng**) — mô phỏng **ĐÚNG** `deleteWorkItem` của Java. ⚠️ **Vì sao phải làm đủ 2 cổng**: nếu chỉ kiểm «tôi là người giao» thì người **thiếu `canEdit`** vẫn thấy nút ⇒ bấm vào ăn **403** = **nút chết** (lớp `BUG-D05`) ✓ |
| **Khai Java-only ⇒ test CŨ đỏ NGAY (⛔ không phải bug)** | Khi WorkCenter bắt đầu gọi `delete_work_item`, `tests/t13` (test **cũ**, viết từ vòng 62) **ĐỎ**: *«mọi action WorkCenter gọi mà Java-only ⇒ PHẢI khai trong `tools/audit-java-only-actions.mjs`»* ⇒ ⭐ phải khai **kèm điều kiện whitelist đã đo** (① `Map.entry` thật ở `ActionRbacRegistry :371`/`:652` ② **0 lần** trong `scripts/system-route.mjs`) ✓ ⇒ 📌 **bài học: thêm 1 lời gọi action mới ⇒ phải soát 3 danh sách khai báo** (`KNOWN_JAVA_ONLY` · `audit-java-only-actions` · danh mục `ACTION_CATALOG`) |
| **`probe-catalog-drift`: «ĐỎ do danh sách trắng CŨ» vs «trôi dạt THẬT»** | Cổng báo `CHƯA BIẾT: 1 → delete_work_item` — ⚠️ **đọc kỹ điều kiện whitelist TRƯỚC khi thêm** (② phải grep JS = **0**) ⇒ đây là **danh sách trắng cũ**, ⛔ không phải trôi dạt thật (lần thứ **3** trong đợt gặp lớp này) ✓ |
| **Cách chọn giữa 2 cách đóng cổng** | S01 đề nghị ① thêm `case` vào `scripts/system-route.mjs` (parity đầy đủ) **hoặc** ② thêm 1 tên vào `KNOWN_JAVA_ONLY` ⇒ ⭐ chọn **②** vì **SAFE/SMALL/ISOLATED**: `scripts/system-route.mjs` có **ngân sách `F-03` (0 dòng ròng)** và đang trong lượt giữ build ⇒ ⚠️ đổi lại phải **ghi NỢ CÓ TÊN** (đường JS ⛔ chưa có action) thay vì im lặng ✓ |
| **Dọn warning lint mà ⛔ không đụng bất biến** | Xoá 2 biến không dùng (`assigned` trong `personalWorkGroups` · `managerDepartments` ở thân `WorkCenter`) ⇒ ⚠️ **KIỂM TRƯỚC**: `tests/t07:175` khoá `workScopeOf().managerDepartments` **KHỚP** `kanbanManagerDepartments(me)` ⇒ ⛔ chỉ xoá **bản sao ở thân component**, ⛔ **KHÔNG** chạm hàm thuần ✓ |
| **Quy trình đóng lượt (⛔ để S01 build sạch)** | Trước khi ghi `RELEASED`: chạy **trọn** `tsc` + `eslint` + `test:regression` + **4 cổng `tools/*`** ⇒ chốt số liệu vào log + handoff **kèm mtime từng tệp đã chạm** ⇒ S01 đối chiếu được **ai sửa tệp nào** (⛔ không suy từ tên tệp — bài học `F-03`/`BUILD ĐỎ`) ✓ |


---

## 🔬 09/10/2026 (≈15:10 · `ERP-SESSION-04`) — **ĐO ĐỘC LẬP** dữ liệu cấp quyền + **NGUỒN DỰNG DÒNG MA TRẬN** (chuẩn bị W4/W5, ⛔ chưa sửa mã)

### A. Nguồn dựng dòng ma trận — **đọc mã + chạy HÀM THẬT trên payload THẬT** (⛔ không suy đoán)
| Bước | Bằng chứng |
|---|---|
| Nguồn vẽ ma trận | `app/page.tsx:300` `permissionMenuStructure(data)` = **`configuredModules(data)`** ∪ **14 khoá `admin_tab_NN`** (📌 `PermissionAccessPanel.tsx:92,106` ghi rõ) |
| `configuredModules` duyệt gì | `lib/workflow-helpers.ts:56` → **`modules.map(...)`** = **mảng CỨNG 64 dòng** trong `lib/menu-helpers.ts:32`, rồi mới ghép **nhãn/`active`/`sortOrder`** từ `module_catalog` |
| ⭐ Hệ quả đo được | `configuredModules(payload thật)` = **64 dòng** · ⛔ **KHÔNG có dòng cho 7/7 khoá** `work_dashboard`·`work_list`·`work_department`·`work_assign`·`work_project`·`work_reports`·`work_others` ⇒ 🔴 **đây CHÍNH LÀ phần W5 còn thiếu** |
| Bẫy đã kiểm | `HUB_TAB_GROUP_KEYS` (`menu-helpers.ts:393`) ⛔ **KHÔNG chứa `my_work`** (dòng 400–402 ghi rõ đã **RÚT** ở VIỆC 1) + nguồn TAB nay là `hubChildrenByGroup` ở `app/page.tsx` ⇒ ✅ thêm 7 dòng vào `modules[]` **⛔ không sinh tab/mục menu mới** |
| ⚠️ Bài học phương pháp | Lần đo ĐẦU: **`login HTTP 502`** (S01 đang restart API) ⇒ payload **rỗng** ⇒ nếu ⛔ không để ý mã HTTP sẽ **kết luận SAI** «catalog ⛔ không có khoá nào» ⇒ ⭐ **5xx ⇒ BỎ SỐ ĐO** |

### B. Dữ liệu cấp quyền — **TỰ ĐO LẠI, ⛔ không tin số cũ** (`mysql.exe -uvntech … vntech_erp`, **chỉ SELECT**)
| Phép đo | Kết quả (09/10/2026 15:10) |
|---|---|
| `module_catalog` | **85** dòng · 7/7 khoá mới **CÓ**, `active=true`, `groupKey='my_work'`, `sortOrder` **91→97** ✓ |
| `user_module_permissions` | **2968** dòng (⚠️ số cũ 2775 ⇒ **+193** do S01 cấp 6 khoá) |
| `department_module_permissions` | **558** dòng |
| 6 khoá `work_*` — cấp cho **TÀI KHOẢN** | ⭐ **28/28 tài khoản HOẠT ĐỘNG** đều có `can_view=1` (**đủ cả 6 khoá**) ⇒ ✅ kiểm chứng ĐỘC LẬP lời S01 (`A09`) |
| 6 khoá `work_*` — cấp theo **ĐƠN VỊ** | **11/11 đơn vị** × 6 khoá, `can_view=1` ✓ |
| 🔎 `work_others` (quyết định `B1` của S01) | ⭐ **0 tài khoản · 0 đơn vị** ⇒ ✅ đúng ràng buộc «**cấp ban đầu = 0**» (§5.3) ⇒ ⛔ **hành vi hiện tại KHÔNG đổi** cho tới khi admin tick |
| Hệ quả cho **W4 (phương án `A`)** | ⭐ Vì **mọi tài khoản hoạt động ĐÃ CÓ ≥1 khoá `work_*`** ⇒ luật lọc tab **⛔ không ẩn tab của ai** ở thời điểm này; «đường lùi» chỉ kích hoạt cho **tài khoản tạo mới sau này** ⇒ ✅ **an toàn go-live** |

### C. Cổng ma trận (chạy lại, chỉ đọc)
`node docs/dsh-mutil-session/SESSION_D/probes/verify-ma-tran-dong.mjs` ⇒ **EXIT 0** (phần dữ liệu): khoá `work` cấp theo **11 đơn vị** · **đúng 3 tài khoản** `canApprove=1` · **11** mã đơn vị thật ⚠️ **kỳ vọng §⑤ của probe ĐÃ CŨ** (đang đòi «hiện đúng **1** dòng *Công việc (mọi phòng ban)*» trong khi **Mô hình B** = **6 khoá tab + `work_others`**) ⇒ ⭐ **phải cập nhật kỳ vọng SAU W5** (⚠️ tệp probe là của phiên 04) ✓

---

## 🔧 09/10/2026 (≈15:16–15:20 · `ERP-SESSION-04`) — **W4 + W5**: 4 kỹ thuật đáng ghi

| Chủ đề | Nội dung kỹ thuật |
|---|---|
| **Gom luật vào KHỐI THUẦN để test CHẠY THẬT (⛔ không chỉ đọc chữ)** | `W4` tách `WORK_TAB_KEYS` + `visibleWorkTabs(canView)` vào mốc `W4-PURE-BEGIN/END`; test `t13-F` **trích khối + `esbuild` + chạy** với 3 kịch bản (0 khoá · 1 khoá · đủ 6) ⇒ ⭐ chứng minh **phương án A** bằng HÀNH VI (⛔ không phải bằng regex) ✓ |
| **⚠️ BẪY «hằng số NGOÀI khối` ⇒ phải NẠP KÈM khi trích** | `visibleWorkTabs` đọc `WORK_TABS_HIDDEN` (hằng cấp module, **ngoài** khối `W4-PURE`) ⇒ lần chạy đầu test **`ReferenceError`**; cách sửa ĐÚNG: **đọc chính hằng đó TỪ MÃ NGUỒN** rồi ghép vào code trích (`hidden + "\n" + block`) — ⛔ **KHÔNG** chép lại giá trị bằng tay (sẽ là «mô phỏng», ⛔ không phải đo) ✓ |
| **Đổi HÌNH THỨC mã ⇒ phải cập nhật test khoá hình thức (⛔ nhưng GIỮ bất biến)** | `W4` đổi dải tab sang `tabsHien[i]` và mở rộng `work_hub.permissionKeys` ⇒ **2 test CŨ ĐỎ** (`t13-D②`: regex đòi `WORK_TABS_HIDDEN.includes(label) ? null`; `t13-A`: regex đòi `"work"` **ở CUỐI** mảng) ⇒ ⭐ sửa test theo **hình thức mới** nhưng **GIỮ NGUYÊN bất biến** («tab ẩn cứng ⛔ không vẽ nút» · «`work_hub` PHẢI nhận khoá `work`») — ⛔ **không nới lỏng** ✓ |
| **`tab` là BIẾN SUY RA (clamp) thay vì sửa 7 nhánh nội dung** | ⚠️ Nội dung tab chọn theo **CHỈ SỐ** (`tab === i`) và 2 tệp test (`t05`/`t14`) **cắt mã theo đúng chuỗi đó** ⇒ cách an toàn nhất: giữ nguyên `tab === i`, đổi `tab` thành **suy ra** từ `tabChon` + clamp (`tabsHien[tabChon] ? tabChon : tab đầu tiên đang hiện`) ⇒ ⭐ đạt mục tiêu an ninh (⛔ không hiện nội dung tab thiếu quyền) mà ⛔ **không đụng 7 nhánh + ⛔ không phá test** ✓ |
| **«Có trong `module_catalog`» ⛔ ≠ «hiện trên ma trận»** | Ma trận dựng theo `configuredModules` = **duyệt `modules[]`** rồi ghép nhãn catalog ⇒ thêm dòng vào `modules[]` mới hiện; ⭐ kiểm chứng bằng **HÀM THẬT + payload THẬT** (`64` dòng → **có 7/7** khoá mới; `my_work` **7 → 14** dòng) ⛔ không tin mã nguồn ✓ |
| **Cổng menu cũng là một bất biến (`lớp D1`)** | `app/page.tsx` lọc mục menu bằng `permissionKeys.find(...canView)` ⇒ thêm khoá tab vào `work_hub.permissionKeys` để người **chỉ có khoá tab** ⛔ không mất lối vào; ⚠️ **đo trước khi thêm**: **0** tài khoản rơi vào ca đó ⇒ thay đổi là **no-op hôm nay** (an toàn) ✓ |
