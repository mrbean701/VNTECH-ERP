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
