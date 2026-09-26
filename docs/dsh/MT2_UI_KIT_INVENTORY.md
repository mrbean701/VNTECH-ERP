# MT2-P2-01 — KIỂM KÊ COMPONENT DÙNG CHUNG (UI KIT)

> MASTER TASK: MT2 · TASK: **MT2-P2-01** (Phase 2 — Component dùng chung) · 21/09/2026
> ⛔ NO COMMIT · NO PUSH · Đo bằng grep thật trên mã nguồn (không suy đoán ✗)
> ⚠️ **KẾT LUẬN LỚN: UI KIT ĐÃ CÓ SẴN** ⇒ Phase 2 **KHÔNG tạo mới** mà **DÙNG kit có sẵn** *(MT2 §15 REUSE_EXISTING_LOGIC)*

---

# 1. HIỆN TRẠNG `app/page.tsx` — **2.780 dòng, ~110 component/function** ✗

| Nhóm | Ví dụ | Ghi chú |
|---|---|---|
| **Màn hình lớn** (~15) | `WarehouseApp` · `DepartmentTaskWorkspace` · `ProjectManagement` · `ProjectProgress` · `Dashboard` · `Approvals` · `WarehouseReceipt` · `CentralWarehouse` · `MaterialCatalogPage` · `BoqPurchaseComparison` · `BoqValueProgress` · `ProductionReports` · `CapitalRecovery` · `Reports` · `SiteCommandScreen` · `Admin` · `MenuLayoutManager` · `MaterialCatalogManager` · `UserPermissionMatrix` · `DepartmentPermissionManager` · `AuditLogManager` · `WorkflowManager` · `SystemLevelManager` · `OrganizationUnitManager` · `AdminStaffList` | Nên tách dần ra `app/screens/*` |
| **MODAL (~30)** ✗ | `RequestModal` · `PoModal` · `ReceiptModal` · `TeamCreateModal` · `InstallModal` · `IssueModal` · `CountModal` · `ReturnModal` · `TransferModal` · `CentralReturnModal` · `CentralReceiveModal` · `ProjectModal` · `CategoryModal` · `MaterialModal` · `MaterialMergeModal` · `MaterialSubcategoryModal` · `ProjectContractModal` · `BoqVersionModal` · `BoqItemModal` · `MenuGroupModal` · `ModuleCatalogModal` · `BusinessGroupModal` · `RoleCatalogModal` · `ApprovalStageModal` · `SystemLevelModal` · `UserModal` · `UserEditModal` · `UserAccessModal` · `ForcedPasswordModal` · `AccountSettingsModal` · `EmailSettingsModal` | ⚠️ nhiều modal **tự chế layout** thay vì dùng `BaseModal` |
| **Kit nhỏ lẫn trong page** | `ModalFooter` · `HelpTip` · `TriStateCheckbox` · `TrustMetric` · `AccessDeniedPanel` · `DevelopmentNotice` · `ProjectScopeSelect` · `ApprovalDots` · `LoadingScreen` · `ErrorScreen` · `Brand` · `AdminModuleGuide` | Ứng viên đưa vào `ui-kit` |
| **Hàm xuất/nhập/luật** | `draftRequestDocument` · `mapPoPlanningRows` · `mapMaterialCatalogRows` · `downloadUserBulkTemplate` · `exportUsersBulkXlsx` · `exportRequestsXlsx` · `exportCsv` · `printReport` · `reportPdf` · `defaultPoPlans` · `poRemainingItems` · `userOf` · `projectRecord` · `userProjectHistory` · `canonicalRoleOptions` | ⚠️ **logic** — liên quan chỉ đạo “mọi logic ở backend Java” |

---

# 2. ✅ UI KIT **ĐÃ CÓ SẴN** *(PHẢI TÁI DÙNG — ⛔ KHÔNG tạo lại)*

| Component | Nơi định nghĩa | Số lần dùng toàn frontend |
|---|---|---|
| **`CardHead`** | `lib/ui-shared.tsx` | **124** ✔ |
| **`Kpi`** | `lib/ui-shared.tsx` | **73** ✔ |
| **`DataTable`** | *(cần xác định nơi định nghĩa — dùng 32 lần)* | **32** |
| **`BaseModal`** | `lib/ui-blocks.tsx` | **32** ✔ |
| **`ListToolbar`** | ⚠️ **dùng 13 lần nhưng KHÔNG thấy định nghĩa** trong `app/*.tsx` + `app/screens/*.tsx` ⇒ **PHẢI tìm** *(nghi ở `lib/*.tsx` hoặc file khác)* | **13** |
| `Empty` | `lib/ui-shared.tsx` | ✔ |
| `NavIcon` | `lib/ui-shared.tsx` | ✔ |
| `AttachmentPanel` / `FileUpload` | `lib/ui-shared.tsx` / `lib/ui-blocks.tsx` | ✔ (dùng cho MT2 §4.5/§10/§26 upload) |
| `SupplyExportButtons` | `lib/supply-docs.tsx` | ✔ |
| `ProjectDetailTabs` | `lib/ProjectDetailTabs.tsx` | **đúng 5 tab MT2 §5.2** ✔ (`Chung · Nhân sự · Tổ đội · Kho · Lịch sử`) |
| `ProjectEntityModal` + `InfoTable` + `SimpleTable` | `lib/ProjectEntityModal.tsx` | **đúng “click dòng ⇒ modal chi tiết” MT2 §5.2/§5.3** ✔ |
| `RequestDrawer` · `PurchaseOrderDrawer` · `ReceiptDrawer` | `lib/*.tsx` | 3 drawer chi tiết ✔ |
| `ReportView` + `buildToolbarFilters` | `lib/ReportView.tsx` | toolbar lọc cho báo cáo ✔ |
| `MaterialListTable` | `app/screens/MaterialListTable.tsx` | liên quan MT2 §12 (danh mục vật tư gốc) |

---

# 2b. 🎯 **UI KIT CHÍNH THỨC: `app/components/ui/`** *(tìm đúng chỗ — lượt đầu em tìm sai ✗)*

```text
app/components/ui/  = 7 tệp · 661 dòng · barrel export `@/app/components/ui`
  DataTable.tsx         133 d  — `Column<T>` + `DataTable<T>`                          ✔ (32 lần dùng)
  Timeline.tsx          163 d  — **`ApprovalTimeline`** (`ApprovalStepStatus` = approved/rejected/pending/
                                 waiting/skipped) + `ApprovalStep` + `ActivityTimeline`  ✔ (MT2 §4.3)
  EntityDetailModal.tsx 143 d  — `DetailTab` + `EntityDetailModal` + **`GuardedEntityModal`** (kèm
                                 `permission`)                                            ✔ (MT2 §5.2/§5.3/§16)
  ListToolbar.tsx       107 d  — `Option` + `ToolbarFilter` + `ListToolbar`
                                 props: `search` · `filters` · `sort` · `actions` · `extra` ✔ (MT2 §22)
  StatusBadge.tsx        61 d  — `Tone` + `toneOf` + `StatusBadge`                      ✔ (MT2 §6.9)
  PermissionGuard.tsx    41 d  — `PermissionGuard` + `hasPermission`                    ✔ (MT2 §16/§17)
  index.ts               13 d  — barrel
```

## ⇒ MAPPING MT2 §22–24 + §4.3 → KIT ĐÃ CÓ SẴN
| Yêu cầu MT2 | Kit đáp ứng | Việc cần làm |
|---|---|---|
| §22 toolbar `LABEL` + `[Search][Sort][Filter]` **hàng ngang** | **`ListToolbar`** ✔ (đã có search/filters/sort/actions/extra) | Dùng cho mọi màn MT2 yêu cầu; ⛔ không tạo toolbar thứ hai |
| §24 bảng table sort/filter/empty | **`DataTable`** ✔ | Kiểm empty state + ⛔ không overflow |
| §5.2/§5.3 click dòng ⇒ **modal chi tiết (có tab)** | **`EntityDetailModal` + `GuardedEntityModal`** ✔ | Dùng cho 5 tab dự án + NCC 3 tab + hồ sơ nhân sự 3 tab |
| §4.3 timeline duyệt **`bước1 o----o bước2 o----o`** | **`ApprovalTimeline`** ✔ *(cần KIỂM có phải dạng NGANG không — nếu đang dọc thì phải sửa)* | **Kiểm + chỉnh cho đúng dạng ngang** |
| §16/§17 RBAC ở UI | **`PermissionGuard` + `hasPermission`** ✔ | Dùng cho ẩn/hiện nút; ⚠️ **backend vẫn là enforcement** |
| §6.9 hiển thị trạng thái PR | **`StatusBadge` + `toneOf`** ✔ | Dùng để tách `status` vs `approval_stage` |

---

## 3. 🔄 ĐIỀU CHỈNH KẾ HOẠCH PHASE 2 *(theo §15 — REUSE trước khi tạo mới)*

| Task | Kế hoạch CŨ ✗ | **Kế hoạch ĐIỀU CHỈNH** ✔ |
|---|---|---|
| P2-01 | Kiểm kê component | ✅ **DONE** — tài liệu này |
| P2-02 | Tạo `ui-kit/modal.tsx` | **Chuẩn hoá `lib/ui-blocks.tsx:BaseModal`**: rà ~30 modal, chỗ nào tự chế layout ⇒ **chuyển sang dùng `BaseModal`**; bổ sung tabs/loading/error/empty/scroll/image-preview theo MT2 §23 |
| P2-03 | Tạo `ui-kit/toolbar.tsx` | **Tìm nơi định nghĩa `ListToolbar` (đang dùng 13 lần)** ⇒ nếu đã đủ ⇒ **dùng nó** cho mọi toolbar ngang MT2 §22; nếu thiếu sort/filter ⇒ **mở rộng chính nó** ⛔ không tạo bản thứ hai |
| P2-04 | Tạo `ui-kit/table.tsx` | **Tìm `DataTable` (32 lần)** ⇒ chuẩn hoá: sort/filter/search + empty state + ⛔ không overflow (§24) |
| P2-05 | Tạo `ui-kit/card.tsx` + `tabs.tsx` | **`CardHead` (124)** + `Kpi` (73) đã đủ cho card ⇒ ⛔ **không tạo mới**; chỉ bổ sung **tabs** nếu `ProjectDetailTabs` không tái dùng được |
| P2-06 | Tạo `ui-kit/upload.tsx` | **`AttachmentPanel`/`FileUpload` đã có** ⇒ **mở rộng** cho: nhiều ảnh (MT2 §6.12/§26) · xem ảnh full viewer (§27) · **fix font chồng chéo** (§10) · 1 ảnh chữ ký thay ảnh cũ (§13.4) |
| **P2-07 (MỚI)** | — | **Tìm nơi định nghĩa `DataTable`, `ListToolbar`** *(bắt buộc trước P2-03/04)* |
| **P2-08 (MỚI)** | — | **Rà ~30 modal trong `page.tsx`**: modal nào tự chế ⇒ danh sách chuyển sang `BaseModal` |

---

# 4. GHI CHÚ LIÊN QUAN CHỈ ĐẠO KIẾN TRÚC
- `page.tsx` chứa **hàm xuất/nhập/luật** (`exportRequestsXlsx` · `reportPdf` · `poRemainingItems` · `mapPoPlanningRows` · `userProjectHistory` …) ⇒ thuộc danh mục **PHẢI CHUYỂN SANG BACKEND** *(xem `docs/agent-progress/KIEN-TRUC-GD0-KIEM-KE-FRONTEND.md`)* ⇒ các task UI của MT2 phải **không làm tăng thêm** loại logic này trong frontend ✗.
- `PROJECT_DETAIL_SUB_TABS` = `Chung · Nhân sự · Tổ đội · Kho · Lịch sử` — MT2 §5.2 yêu cầu `Tổng quan · Nhân sự · Tổ đội · Kho · Ban chỉ huy` ⇒ ⚠️ **LỆCH TÊN 2 TAB** ⇒ cần đối chiếu khi làm MT2-P7-02 (⛔ không tự đổi tên nếu chưa rõ nghiệp vụ — ghi nhận để hỏi khi tới task).

---

# 5. TIẾP THEO
```
MT2-P2-07 — tìm nơi định nghĩa `DataTable` + `ListToolbar` (grep toàn mã nguồn, kể cả components/)
MT2-P2-02 — rà + chuẩn hoá modal về `BaseModal`
MT2-P2-03/04 — mở rộng `ListToolbar` / `DataTable` theo chuẩn ngang + sort/filter/empty
MT2-P2-06 — mở rộng `AttachmentPanel`: nhiều ảnh · viewer · fix font-overlap · chữ ký 1 ảnh
```
