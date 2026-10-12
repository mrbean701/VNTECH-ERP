> **VNTECH ERP — BỘ TÀI LIỆU PHIÊN BẢN `ALPHA TEST`**
> · Phiên bản tài liệu: **`DOC-ALPHA-TEST-2026.10`** · Ngày cập nhật: **08/10/2026** · Phiên soạn: `ERP-SESSION-01`
> · Sản phẩm: `V5.3.0-MASTER-BASELINE-R1.1.1` · Cổng: `:8787` (UI) · `:9000` (cutover) · `:18081` (API Java)
> · ⚠️ Trạng thái: **ALPHA TEST** — tài liệu phản ánh bản ĐANG CHẠY; ⛔ chưa phải bản phát hành chính thức.
> · 📌 Nguồn sự thật: **mã nguồn + CSDL thật** (mọi số liệu đều ĐO được, ⛔ không suy đoán).

# BÁO CÁO KẾ HOẠCH GO-LIVE & PHÁT TRIỂN LÕI — VNTECH ERP V5.3.0 (MEP)

Phiên lập: `ERP-SESSION-04` (`SESSION_D`) · Ngày: **08/10/2026** · Nhánh: `unity`
Trạng thái nguồn: 3 phiên song song đang chạy (`ERP-SESSION-01/02/03`) — xem `docs/dsh-mutil-session/SESSION_REGISTRY.md`

> **Tài liệu này THAY THẾ phần định hướng của `docs/09_KE_HOACH_GO_LIVE_VA_PHAT_TRIEN_LOI_MEP.md`.**
> `docs/09` lập 09/09/2026 khi hệ thống **còn là monolith JS** (fingerprint `54394992`, migration `0000..0075`, regression `61/61`).
> Từ đó đến nay hệ thống **đã cutover sang backend Java + MySQL**, số migration lên `0344`, hồi quy lên **865 test**.
> ⇒ Mọi số liệu trong `docs/09` về kiến trúc/gate **đã lỗi thời**; tài liệu này lấy số liệu mới nhất có ngày tháng.

## 0. CẢNH BÁO PHƯƠNG PHÁP (đọc trước)

1. **Phiên này KHÔNG chạy lại được cổng kiểm nào.** Shell của harness hỏng:
   `ERR_MODULE_NOT_FOUND: Cannot find package '@deepseek-ai/dsh-scope' imported from C:\Users\PC\.dsh\profiles\web\node_modules\@deepseek-ai\dsh-skill\lib\index.js`
   ⇒ mọi lệnh `node`/`npm`/`git` (kể cả `Write-Output probe`) đều thoát ngay. Đây là **lỗi hạ tầng DSH**, không phải lỗi dự án.
2. Vì vậy báo cáo này phân định rõ 2 loại dữ kiện:
   - **[ĐO]** — số đo có ngày, do chính các phiên 01/02/03 ghi trong log (`SESSION_A/B/C`, `SHARED_STATE`, `CURRENT_STATE`).
   - **[ĐỌC MÃ]** — điều phiên này **tự đọc trong mã nguồn hiện tại** (đường dẫn + dòng cụ thể).
3. ⛔ Không có kết luận nào dưới đây là **xác nhận bằng mắt** — model phiên này không đọc được ảnh.

---

## 1. MÔ TẢ HỆ THỐNG (HIỆN TRẠNG)

### 1.1 Kiến trúc triển khai — 3 dịch vụ + 1 CSDL

```
Người dùng → :9000  cutover-proxy (tools/cutover-proxy.mjs)
                ├── /api/*        → :18081  Java backend (Spring Boot, JAR)
                └── còn lại       → :8787   Node UI (scripts/local-server.mjs, phục vụ dist/)
                                            └── MySQL (dữ liệu nghiệp vụ thật)
```
**[ĐO]** (`docs/dsh-state/CURRENT_STATE.md`, `SESSION_REGISTRY.md` ngày 06–07/10/2026): cả 3 dịch vụ ở trạng thái `200`;
đăng nhập bằng `POST /api/system` với `{action:"login",username,password}` → `200` + cookie `mep_session`;
không cookie ⇒ `401` (**đúng thiết kế**). Lệnh khởi động proxy **bắt buộc đủ cờ** (`--port 9000 --ui-port 8787 --api-port 18081`), thiếu cờ ⇒ `EADDRINUSE`.

### 1.2 Backend Java — Clean Architecture 4 module **[ĐỌC MÃ]**

| Module | Vai trò | Bằng chứng |
|---|---|---|
| `java-backend/domain` | Thực thể + value object thuần (`Project`, `ProjectStatus`) | `domain/src/main/java/.../domain/**` |
| `java-backend/application` | Use case + cổng vào/ra + RBAC (`ActionRbacRegistry`, `RbacService`) | 25 use case trong `application/.../service/` |
| `java-backend/infrastructure` | Adapter JPA/MySQL (`ProjectRepositoryAdapter`, `PurchaseStoreAdapter`, `BootstrapDataAdapter`…) | `infrastructure/.../persistence/**` |
| `java-backend/web` | `SystemController` (1 dispatcher duy nhất) + test tích hợp | `web/.../controller/SystemController.java` |

⇒ **Định hướng "Java Clean Architecture + MySQL" (trước đây là `docs/06`, ghi ở trạng thái "tạm hoãn") NAY ĐÃ LÀ HIỆN THỰC.** Đây là thay đổi lớn nhất so với mọi tài liệu lập trước 01/10/2026.

### 1.3 Nghiệp vụ lõi → use case **[ĐỌC MÃ]**

| Nghiệp vụ lõi | Use case Java | Ghi chú |
|---|---|---|
| Đề nghị mua + luồng duyệt | `RequestManagementUseCase` | `create_request`, `resubmit_request`, `decide_approval`, `request_supplement` |
| Đơn mua hàng (PO) | `PurchaseManagementUseCase` | `createPo` (L57), `closePoLine` (L210), `approvePo` (L235), `rejectPo` (L240), `updatePoPrice` (L267), `receiveGoods` (L300), `confirmDelivery` (L444) |
| Kho / xuất–nhập–điều chuyển | `StockManagementUseCase` | khớp hub «Kho vật tư» 3 tab của phiên 02 |
| Dự án / BOQ / hợp đồng | `ProjectManagementUseCase`, `ProjectContractUseCase`, `BoqManagementUseCase` | `create_project`, `save_boq_item`, `save_project_contract` |
| Vật tư / nhà cung cấp | `MaterialCatalogManagementUseCase`, `SupplierManagementUseCase`, `PartnerManagementUseCase` | chống trùng alias theo mã gốc |
| Phòng ban / người dùng / phân quyền | `UserManagementUseCase`, `AdminSystemUseCase`, `AdminOpsManagementUseCase` | nền cho workflow (§1.5) |
| Tài chính / sản lượng / nhân sự / hợp đồng review | `FinanceManagementUseCase`, `ProductionManagementUseCase`, `HrManagementUseCase`, `ContractReviewUseCase` | ngoài lõi mua hàng |
| Hạ tầng | `AuthUseCase`, `BootstrapUseCase`, `FileUseCase`, `SystemSettingsUseCase`, `NotificationManagementUseCase`, `ErrorReportUseCase`, `ListActiveProjectsUseCase` | |

### 1.4 Luồng duyệt đơn — cơ chế & bằng chứng

**[ĐỌC MÃ]** Action chuỗi lõi đều **có khai báo RBAC hai tầng** trong
`java-backend/application/src/main/java/com/vntech/erp/application/rbac/ActionRbacRegistry.java`:

| Action | Module (tầng 1) | Capability (tầng 2) |
|---|---|---|
| `create_request` | `requests` | `canCreate` |
| `resubmit_request` | `requests` | `canEdit` |
| `decide_approval` | `approvals` | `canApprove` |
| `save_approval_stage` | (rỗng ⇒ chỉ `canUse`) | `canUse` |
| `create_po` | `purchasing` | `canCreate` |
| `approve_po` / `reject_po` | `purchasing` | `canApprove` |
| `close_po_line` | `purchasing` | `canApprove` |
| `receive_goods` / `confirm_delivery` | `receiving`, `warehouse_receipt` | `canCreate` / `canApprove` |
| `issue_stock` / `create_transfer_order` | `teams`,`warehouse_issue` / `inventory` | `canCreate` |

**[ĐỌC MÃ]** Bộ test Java chứng minh luồng & phân quyền đã có người canh:
`RequestApprovalIntegrationTest` · `RequestApprovalOwnerOnlyTest` (**chỉ Owner của bậc được duyệt**) ·
`ApprovalSlaAutoRejectTest` (**SLA quá hạn**) · `DirectorPendingApprovalsTest` (**hộp chờ Giám đốc**) ·
`PoRbacActionsIntegrationTest` · `ActionRbacRegistryPoTest` · `RbacSupplierMaterialTest` ·
`ConstructionRbacEnforcementTest` · `NotificationScopeRbacTest`.

**[ĐO]** (`SESSION_REGISTRY.md` ngày 06/10): `mvn -o test` **156/156** · `npm test` **780→802 pass / 0 fail**.
**[ĐO]** (`SESSION_C/README.md` ngày 08/10): hồi quy `865 test · 864 pass · 0 fail · 1 skip` · `tsc` 0 · `eslint` 0 lỗi.

### 1.5 Phân quyền phòng ban (nền workflow)

**[ĐỌC MÃ]** `RbacService` chặn **fail-closed**: action chưa khai module ⇒ `403` (không mặc định cho qua);
`save_error_report` nằm trong `PUBLIC_ACTIONS` (mọi user đã đăng nhập).
**[ĐO]** (`CURRENT_STATE.md`): `module_catalog` = **76 module** · `users` = **14 tài khoản thật** · `projects` = 3–5 ·
quyền `user_module_permissions` = **1226 dòng**; backend **bơm thêm quyền theo phòng ban** (`permissionSource` = `company_leadership` / `department_default`)
⇒ ⛔ **bảng quyền trống KHÔNG có nghĩa là user không có quyền** — phải đo trên payload thật.

### 1.6 Dữ liệu & định danh

- **Migration**: `drizzle/*.sql` (áp cho **cả SQLite UI lẫn MySQL**) + `java-backend/**/db/migration/V*.sql` (Flyway MySQL).
  **[ĐO]** Flyway schema đã lên **v34**; dải `drizzle` đã tới **0344**.
- **Quy tắc bắt buộc (đã trả giá)**: sửa mã nguồn ⇒ **nguồn vân tay đổi** ⇒ phải chạy `node tools/gd-cycle.mjs "<NHÃN>"` (fixpoint + fingerprint + artifact);
  migration `*_identity.sql` là metadata-only, ⛔ không đụng dữ liệu nghiệp vụ.
- **[ĐO]** vân tay nguồn gần nhất trong `SHARED_STATE`: `VNTECH-FP-AF5B84E9A7B25888` (732 files) → các vòng sau đã tiến tới
  `F3C1C8BA…`, `344D1DA5…` và HTML fingerprint đang phục vụ `d826dd0b33dbb3cd` (`SESSION_C/README.md`, migration `0344`).

---

## 2. CHỨC NĂNG ĐÃ SẴN SÀNG GO-LIVE (LÕI)

| # | Nhóm chức năng lõi | Màn hình | Backend | Bằng chứng | Kết luận |
|---|---|---|---|---|---|
| 1 | **Phiếu đề nghị mua** (tạo/sửa/gửi lại/huỷ/nhập Excel) | `requests`, `RequestModal`, `RequestDrawer` | `create_request`, `update_returned_request`, `resubmit_request`, `cancel_request`, `delete_request`, `preview_request_import` | test workflow + `v215-*` | ✅ GO-LIVE |
| 2 | **Duyệt đơn 5 bậc theo Owner + SLA + email** | `approvals`, `ApprovalStageModal` | `decide_approval`, `save_approval_stage`, `set_approval_stage_status` | `RequestApprovalIntegrationTest` · `RequestApprovalOwnerOnlyTest` · `ApprovalSlaAutoRejectTest` | ✅ GO-LIVE |
| 3 | **Lập & phát hành PO** (1 phiếu → nhiều PO/nhiều hệ/nhiều chuyến) | `purchasing` | `create_po`, `approve_po`, `reject_po`, `update_po_price`, `close_po_line` | `PoRbacActionsIntegrationTest` · `ActionRbacRegistryPoTest` | ✅ GO-LIVE |
| 4 | **Giao nhận hàng** | `receiving`, `delivered`, `ReceiptModal/ReceiptDrawer`, `PurchaseOrderDrawer` | `receive_goods`, `confirm_delivery` | **F2 đã đóng**: `receive_goods` chặn sai trạng thái PO ⇒ `400` | ✅ GO-LIVE |
| 5 | **Kho**: nhập/xuất/điều chuyển/kiểm kê/hoàn trả | Hub «Kho vật tư» 3 tab + màn chi tiết kho 5 tab | `issue_stock`, `return_stock`, `create/approve/ship/receive_transfer_order`, `create/approve_stock_count`, hoàn trả kho tổng | `warehouse-hub` 22/22 · `w04` · regression | ✅ GO-LIVE (**user đã nghiệm thu TASK-226**) |
| 6 | **Vật tư**: catalog, ĐVT, alias chống trùng, mapping BOQ, định mức | `material_catalog`, `MaterialCategoryList` 3 tab, `material_norms`, `boq` | 33 action | `warehouse-hub` · `w01` · cổng alias | ✅ GO-LIVE |
| 7 | **Nhà cung cấp / đối tác** | `supplier_catalog` | `save_supplier`, `set_supplier_status`, `delete_supplier` | `RbacSupplierMaterialTest` | ✅ GO-LIVE |
| 8 | **Dự án / BOQ / hợp đồng / thanh toán HĐ** | `site_command`, `ProjectDetailTabs` (5 tab), `boq`, `payments`, `teams` | `create_project`, `update_project`, `bulk_import_projects`, `save_boq_item`, `save_project_contract`, `save_contract_payment` | `ProjectAdminIntegrationTest` · `ProjectCreateWarehouseFlagTest` | ✅ GO-LIVE |
| 9 | **Phòng ban · người dùng · RBAC · ngoại lệ cá nhân** | Quản trị hệ thống (15 mục), `PermissionAccessPanel`, `UserEditModal` | `save_organization_unit`, `set_organization_unit_member`, `save_user_access`, `save_engine_role_profile`, `save_business_role_group`, `bulk_import_users`, `update_user` | `AdminGovernanceIntegrationTest` · `m118-*` (3 test) · MỐC 111/112 (11/11, 8/8) | ✅ GO-LIVE |
| 10 | **Báo lỗi / Góp ý** cho mọi user | nút nổi + tab 14 Quản trị | `save_error_report` (PUBLIC), `error_reports`, `mark_error_report_resolved` | `_test-error-report-rbac` **8/8** | ✅ GO-LIVE |
| 11 | **Báo cáo & xuất tệp** (CSV/XLSX/PDF, UTF-8 BOM) | `reports`, các màn có nút xuất | `reportExport`/`reportPdf` + 13 đường xuất | cổng `mt3-c03` (BOM 5 ca) · `mt3-c10` (ngày) · quét enum = **0 rò** | ✅ GO-LIVE |
| 12 | **Hiển thị tiếng Việt & định dạng** | toàn hệ | `lib/status-labels.ts` (**nguồn nhãn duy nhất**, 10 domain) | `mt3-c04` 13 ca · `mt3-c09` 4 ca · `mt3-c10` 4 ca | ✅ GO-LIVE |

**Kết luận §2: chuỗi lõi «đề nghị → duyệt → PO → giao nhận → kho → kiểm kê/hoàn trả» đã đủ điều kiện go-live về mặt mã.**

---

## 3. CHỨC NĂNG **KHÔNG** NÊN MỞ TRONG BẢN GO-LIVE (khuyến nghị)

| # | Vùng | Lý do (đo được) | Đề xuất |
|---|---|---|---|
| 1 | **25 màn workspace phòng ban** (`dept_plan_*`, `dept_project_*`) | `DepartmentTaskWorkspace` chỉ có 1 form «Giao việc bổ sung» — mỏng so với tên màn | Ẩn khỏi menu go-live; mở sau khi có nghiệp vụ rõ |
| 2 | 4 nút kho đang **tạm khoá** (`Tạo kho`, `Sửa`, `Xóa`, `Tạo phiếu cấp phát`) | `open("allocate")` **không có modal** trong `page.tsx` (40 modal, thiếu `allocate`) — phiên 02 đã khoá + ghi lý do | Giữ khoá, mở khi quy tắc nghiệp vụ được chốt |
| 3 | Các màn phụ trợ (công văn, con dấu, bảo hiểm, tài chính chuyên sâu) | Có CRUD thật nhưng **ngoài lõi MEP** | Giữ nguyên, ⛔ không mở rộng trước go-live |
| 4 | `HANDOFF-C15` — **4 tệp màn mồ côi** (mã chết) | Chưa xác định nối lại/xoá; xoá là hành động **phá huỷ** | Treo, chờ S01/user quyết sau go-live |

---

## 4. CÁC BƯỚC TRIỂN KHAI (KẾ HOẠCH CHI TIẾT)

### GĐ 0 — Chốt quyết định đang treo (TRƯỚC mọi việc khác) · chủ: **USER**
Đây là các việc **chỉ user quyết được**, đang chặn một phần công việc:
1. `DEC-20261007-C11` — **quy ước phần trăm** (giữ nguyên / 1 chữ số + dấu `,` / số nguyên) ⇒ ảnh hưởng ~22 chỗ.
2. `HANDOFF-C02` — nợ BE `UserManagementUseCase` (`fullName` là trường duy nhất không có fallback): (a) thêm fallback hay (b) tách thông điệp nêu đích danh trường thiếu.
3. `HANDOFF-C13/C14` — nợ FE (ngày ISO ở `Inventory.tsx` và `app/page.tsx`) ⇒ cần S01/S02 thi hành.
4. **Bật email duyệt**: cần `smtp_host` · `username` · `password` · `sender_email` · `base_url`, **và 2 tầng chặn khác đang rỗng**: `notification_config_targets` = 0 · `approval_email_recipients` = 0 ⇒ **dù có SMTP vẫn không gửi được**.
5. **Nghiệm thu bằng mắt** 3 bản vá UI (modal «Chi tiết đơn giao hàng», thẻ trạng thái, nhãn «Tên đăng nhập»).
6. (Tùy chọn) cấp mật khẩu 1 tài khoản **không phải admin** để chạy 4 action HR bằng user thật.

### GĐ 1 — Chuẩn bị go-live (1–2 tuần) · ưu tiên cao nhất
| Bước | Việc | Kết quả kỳ vọng | Ai |
|---|---|---|---|
| A1 | Nạp **dữ liệu thật**: dự án, phòng ban, người dùng, NCC, vật tư, BOQ, định mức | menu Quản lý dự án + workspace chạy thật (hiện `projects` chỉ 3–5 dòng demo) | user + S01 |
| A2 | Chốt **5 bậc duyệt** thực tế (bậc nào · Owner nào · SLA giờ · `auto_approve_on_submit`) | luồng duyệt khớp quy trình VNTECH | user + S01 |
| A3 | Chốt **ma trận phân quyền** 4 phòng × nhóm nghiệp vụ + ngoại lệ cá nhân | không duyệt nhầm / không lộ dữ liệu | user |
| A4 | **Bật SMTP + 2 bảng người nhận** (`notification_config_targets`, `approval_email_recipients`) | email duyệt & cảnh báo hoạt động | user |
| A5 | **Diễn tập end-to-end 1 phiếu thật** trên dữ liệu thật | xác nhận sẵn sàng (đây là cổng go-live thật sự) | user + S01 |
| A6 | **Ẩn 25 màn phòng ban mỏng** + giữ 4 nút kho ở trạng thái khoá | tránh người dùng vào màn rỗng | S02/S03 |
| A7 | **Dọn dứt điểm 3 phiên**: commit/merge (theo luật user «chưa cho phép thì ⛔ không commit»), chốt 1 HEAD sạch | cây nguồn tất định ⇒ vân tay ổn định | user + cả 3 phiên |
| A8 | **Sao lưu + kịch bản rollback**: backup MySQL, backup `.local-data/warehouse.sqlite`, giữ JAR bản lùi (86,8 MB) | quay lui được trong ≤15 phút | S01 |

### GĐ 2 — Cutover (1 ngày, làm ngoài giờ)
1. Đóng băng thay đổi mã (freeze) — ⛔ không phiên nào sửa mã trong ngày cutover.
2. Backup MySQL + xác nhận dung lượng/khôi phục thử.
3. `node tools/gd-cycle.mjs "<NHÃN CUTOVER>"` ⇒ build + fixpoint + artifact (ĐẠT cả 3).
4. Khởi động **đúng thứ tự**: Java `:18081` → UI `:8787` → proxy `:9000`; đo `200` + đăng nhập thật.
5. Chạy `node tools/verify-ui-build-applied.mjs --port=8787` ⇒ phải thấy **«BẢN CHẠY ĐÚNG BẢN ĐÃ BUILD MỚI NHẤT»**.
6. Smoke test 12 mục ở §2 (mỗi mục 1 thao tác đọc + 1 thao tác ghi có kiểm chứng CSDL).
7. Mở cho nhóm dùng thật (đề nghị / duyệt / mua hàng / kho) theo lớp.

### GĐ 3 — Hypercare (2 tuần đầu) · ưu tiên tuyệt đối cho lỗi người dùng
- Kênh nhận lỗi **đã có sẵn trong sản phẩm**: nút «Báo lỗi / Góp ý» → tab 14 Quản trị (mọi user dùng được).
- Mỗi bản vá: **test trước – sửa – regression – `gd-cycle` – verify bundle** (đúng khuôn đang dùng).
- Theo dõi: `email_outbox` tồn, phiếu quá SLA, PO trễ hẹn, tồn dưới định mức.

### GĐ 4 — Hoàn thiện lõi & mở rộng (sau ổn định)
- Hoàn thiện **báo cáo mua hàng chuyên sâu** (tiến độ PO theo NCC, tỉ lệ giao đúng hạn, so sánh giá).
- **Cảnh báo chủ động qua email** (PO trễ, đề nghị quá SLA, tồn dưới định mức) — dispatcher đã có sẵn.
- Hoàn thiện **workspace phòng ban** khi đã có nghiệp vụ rõ.
- Tối ưu khi dữ liệu lớn (**phân trang server**) — hiện `GET /api/system` trả ~1,37 MB bootstrap.

---

## 5. ĐỀ XUẤT (KHUYẾN NGHỊ ƯU TIÊN)

| Ưu tiên | Đề xuất | Vì sao |
|---|---|---|
| **P0** | **Chốt GĐ 0 + A1–A5 trước khi mở go-live** | Thành công go-live hiện quyết định bởi **cấu hình & dữ liệu**, không phải mã |
| **P0** | **Hợp nhất 3 phiên thành 1 HEAD sạch, commit theo danh sách tệp của từng phiên** (⛔ không `git add -A`) | Hiện có hàng chục tệp chưa commit trải 3 phiên ⇒ rủi ro mất việc/rối lịch sử |
| **P1** | **Sao lưu tự động theo lịch + diễn tập phục hồi** | Đã có `local-backup`; chưa có lịch chạy |
| **P1** | **Vá 4 cổng đo lệch** (`probe-responsive-5widths` xanh rỗng, `probe-toolbar-vertical` 8 báo động giả, `probe-task075` D2 đỏ oan, `probe-action-registry-coverage` 6 mục mù quyền) | Đã 3 lần cổng nói quá số đo ⇒ cổng sai làm mất thời gian & mất niềm tin |
| **P2** | **Sửa `tools/probe-*` để thiếu mục tiêu ⇒ `SKIP/BLOCKED`** thay vì `ĐẠT` | Luật đã ghi trong `SHARED_STATE` §34 |
| **P2** | **Ghi lại "runbook go-live" 1 trang** (thứ tự dịch vụ, cờ proxy, PID, lệnh build) | Lệnh khởi động `:9000` từng **không được ghi ở đâu** (đã gây sự cố) |
| **P3** | Cân nhắc gộp `docs/09` vào tài liệu này và đánh dấu lỗi thời | Tránh 2 kế hoạch mâu thuẫn |

---

## 6. PHƯƠNG HƯỚNG PHÁT TRIỂN TƯƠNG LAI

### 6.1 Ngắn hạn (0–1 tháng, sau go-live)
1. Hoàn thiện báo cáo mua hàng & cảnh báo email (§GĐ 4).
2. Đóng nợ kỹ thuật đã ghi tên: 4 tệp màn mồ côi, ngày ISO còn sót, quy ước phần trăm.
3. Dọn dữ liệu mồ côi: 40 dòng `attachments` không tới được qua API; tài khoản thăm dò `sec_probe_*` (đã dọn 6/6 — xác nhận lại).

### 6.2 Trung hạn (1–3 tháng)
4. **Mobile/PDA hiện trường** (`dept_project_pda`): nhận hàng/nghiệm thu tại công trường.
5. **Tích hợp kế toán**: mở rộng sổ kế toán tổng hợp + xuất MISA/JSON sang đối chiếu tự động.
6. **KPI & phân tích**: thời gian duyệt trung bình theo bậc, hiệu suất NCC, tiến độ PO.
7. **Đa kho/đa công ty** nếu mở rộng quy mô (đã có nền Kho Tổng + kho dự án).

### 6.3 Dài hạn (3–12 tháng)
8. **Hoàn thiện Java Clean Architecture**: bổ sung use case cho phần còn nằm ở `app/page.tsx` (đang là "monolith UI" — 40 modal),
   tách dần theo Strangler Fig; giữ UI hiện tại làm lớp trình bày.
9. **Quan sát & vận hành**: health-check, cảnh báo dịch vụ, log tập trung, backup PITR.
10. **Kiểm thử tự động E2E** (Playwright) cho 12 mục lõi để mỗi lần cutover không phải smoke test tay.

---

## 7. RỦI RO & GIẢM THIỂU

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Cấu hình 5 bậc duyệt/SLA lệch thực tế | **Cao** | A5 diễn tập trên phiếu thật |
| Không có email duyệt (SMTP + 2 bảng người nhận rỗng) | **Cao** | A4; phương án dự phòng: thông báo trong app + điện thoại |
| Sai phân quyền ⇒ duyệt nhầm / lộ dữ liệu | **Cao** | A3 + test Owner/SLA hiện có + `RbacService` fail-closed |
| Mất dữ liệu khi cutover | **Cao** | A8 backup + thử phục hồi; giữ JAR bản lùi |
| 3 phiên chưa commit ⇒ mất việc khi reset/build | **Cao** | A7; ⛔ cấm `git reset --hard` / `git clean -fd` (luật §38) |
| Vân tay đổi giữa lúc build ⇒ UI không lên | Trung bình | Chuỗi `gd-cycle` + ⛔ không sửa mã khi đang build (đã có luật D-055) |
| Người dùng vào màn rỗng (25 màn phòng ban) | Trung bình | A6 ẩn khỏi menu |
| `GET /api/system` phình (1,37 MB) khi dữ liệu lớn | Thấp | Phân trang server (GĐ 4) |
| Shell harness hỏng (phiên này) ⇒ không chạy được gate | Trung bình | Sửa/khởi động lại profile DSH trước vòng kiểm định kế tiếp |

---

## 8. KẾT LUẬN

**Mã nguồn lõi đã sẵn sàng go-live.** Chuỗi nghiệp vụ trọng tâm — *đề nghị mua → duyệt 5 bậc theo Owner/SLA → nhiều PO → giao nhận → nhập/xuất kho → kiểm kê/hoàn trả* — tồn tại **thật** ở backend Java
(use case + `ActionRbacRegistry` hai tầng quyền) và **có test canh** (`RequestApproval*`, `PoRbac*`, `ApprovalSla*`, `DirectorPending*`, 156 test Java + 865 test hồi quy).
Nền phụ trợ cần cho workflow (phòng ban · người dùng · RBAC · ngoại lệ cá nhân · dự án/BOQ/hợp đồng) cũng đã có màn + action + test.

**Rào cản còn lại KHÔNG phải code mà là:** (1) các quyết định treo ở GĐ 0 (quy ước phần trăm, SMTP + bảng người nhận, nợ BE/FE đã giao),
(2) dữ liệu thật & cấu hình duyệt thật (A1–A3), (3) diễn tập end-to-end (A5), và (4) hợp nhất 3 phiên thành một HEAD sạch (A7).

**Đề xuất hành động ngay:** chốt GĐ 0 trong tuần này; song song A1+A2 và A4; đặt lịch A5 + GĐ 2 sau khi A1–A4 xanh.

---

## 9. PHỤ LỤC — NGUỒN DỮ KIỆN

| Nguồn | Nội dung dùng |
|---|---|
| `docs/dsh-state/CURRENT_STATE.md` | kiến trúc 3 dịch vụ, API/đăng nhập, `mvn test`, 76 module, số user/dự án, bài học D-025…D-063 |
| `docs/dsh-state/SESSION_REGISTRY.md` · `docs/dsh-mutil-session/SESSION_REGISTRY.md` | 3 phiên, phạm vi giữ tệp, quy trình build Java 4 bước, luật vân tay D-055 |
| `docs/dsh-mutil-session/SHARED_STATE.md` | vân tay/build gần nhất, 23 khối cảnh báo & luật phối hợp |
| `docs/dsh-mutil-session/SESSION_C/README.md` (08/10/2026) | trạng thái mới nhất: migration `0339→0344`, 865 test, 24 màn quét, 9 cổng mới, các handoff đang mở |
| `docs/dsh-mutil-session/SHARED_TODO.md` | việc đang mở theo từng phiên (S01/S02/S03) |
| `java-backend/**` (**đọc mã phiên này**) | 4 module Maven, 25 use case, `ActionRbacRegistry`, `SystemController`, `PurchaseManagementUseCase` |
| `docs/14_KE_HOACH_CUTOVER_THUC_THI_JAVA_MYSQL.md` · `docs/29_RUNBOOK_BUILD_VA_CHAY_JAVA_BACKEND.md` | chi tiết cutover & runbook build |
