> **VNTECH ERP — BỘ TÀI LIỆU PHIÊN BẢN `ALPHA TEST`**
> · Phiên bản tài liệu: **`DOC-ALPHA-TEST-2026.10`** · Ngày cập nhật: **08/10/2026** · Phiên soạn: `ERP-SESSION-01`
> · Sản phẩm: `V5.3.0-MASTER-BASELINE-R1.1.1` · Cổng: `:8787` (UI) · `:9000` (cutover) · `:18081` (API Java)
> · ⚠️ Trạng thái: **ALPHA TEST** — tài liệu phản ánh bản ĐANG CHẠY; ⛔ chưa phải bản phát hành chính thức.
> · 📌 Nguồn sự thật: **mã nguồn + CSDL thật** (mọi số liệu đều ĐO được, ⛔ không suy đoán).

# AUDIT **JOBS** & **PROJECT** — VNTECH ERP V5.3.0 (MEP)

Phiên: `ERP-SESSION-04` (`SESSION_D`) · Ngày: **08/10/2026** · Nhánh `unity` · Kiểu: **read-only audit** (⛔ 0 dòng mã sản phẩm thay đổi)
Mục đích: **rà 2 vùng JOBS và PROJECT trước khi user giao việc** — chỉ ra cái gì đang chạy, cái gì hỏng/nghẽn, vùng nào bị khoá bởi phiên khác.

## 0. PHƯƠNG PHÁP & GIỚI HẠN (đọc trước để không hiểu sai báo cáo)

| | |
|---|---|
| **Nguồn sự thật** | **MÃ ĐANG CHẠY** (Goal §16). Đã đọc trực tiếp: `lib/menu-helpers.ts` · `app/page.tsx` · `app/screens/*` · `ActionRbacRegistry.java` · `RbacService.java` · `SystemController.java` · `OpsTaskManagementUseCase.java` · `PurchaseManagementUseCase.java` |
| **[ĐỌC MÃ]** | Kết luận phiên này **tự đọc trong mã** (có `file:line`) |
| **[ĐO]** | Số liệu **do phiên khác đo**, có ngày, ghi trong `docs/dsh-state/**` · `docs/dsh-mutil-session/**` |
| ⛔ **KHÔNG KIỂM ĐƯỢC Ở PHIÊN NÀY** | Shell harness **hỏng** (`ERR_MODULE_NOT_FOUND: @deepseek-ai/dsh-scope` — profile DSH web) ⇒ **không chạy được** `tsc`/test/UI/probe. ⇒ **Không có kết luận runtime nào** (chưa xác nhận 403 thật, chưa xác nhận menu hiển thị). Mọi việc "cần đo" được đánh dấu rõ ở §5/§7 |
| ⛔ **KHÔNG dùng làm bằng chứng** | 4 cổng đo đã biết sai: `probe-responsive-5widths` (**xanh rỗng**), `probe-toolbar-vertical` (**8 báo động giả**), `probe-task075` (D2 **đỏ oan**), `probe-action-registry-coverage` (**6 "mù quyền" = báo động giả**) |

---

## 1. BẢN ĐỒ **JOBS** (nhóm menu «CÔNG VIỆC» = `my_work`)

### 1.1 Khai báo menu & màn đích **[ĐỌC MÃ]**
`lib/menu-helpers.ts:125-132` — `workMenuItems` **5 mục**; `app/page.tsx:442-457` (`workCenterViewFor`) + `:498/602/653/741` (render).

| Mục menu | `view` | `permissionKeys` | Màn đích thực tế |
|---|---|---|---|
| Dashboard | `dashboard` | `dept_plan_kpi`, `dept_project_kpi` | `WorkCenter` tab **Dashboard** |
| Cá nhân | `personal` | `dept_plan_tasks`, `dept_project_tasks` | `WorkCenter` tab **Cá nhân** |
| Phòng ban | `department` | `dept_plan_assign`, `dept_project_assign` | `WorkCenter` tab **Phòng ban** |
| Giao việc | `assign` | `dept_plan_assign`, `dept_project_assign` | **`DepartmentTaskWorkspace`** (cố ý — `workCenterViewFor` trả `null` cho `assign`) |
| Báo cáo | `reports` | `dept_plan_alerts`, `dept_project_alerts` | `WorkCenter` tab **Báo cáo** |

Ngoài ra `dept_plan_kpi`/`dept_project_kpi` (nhóm Báo cáo/KPI) và `kpi_summary` (`lib/menu-helpers.ts:237-238`) cùng mở `WorkCenter` view `kpi`.

### 1.2 Màn & thành phần liên quan **[ĐỌC MÃ]**
`WorkCenter.tsx` (**hub 5 tab**: dashboard · personal · department · kpi · reports) — có import `WorkDashboard`, `WorkHierarchy`, `WorkKanban` (`WorkCenter.tsx:28-30`).
⇒ ✅ **3 tệp đó KHÔNG mồ côi** (khác 4 tệp ở §2.4) — bằng chứng đối chứng: chúng được `WorkCenter` import và render (`:370`, `:375`, `:419`).

### 1.3 Backend — đủ action & đúng RBAC 2 tầng **[ĐỌC MÃ]**
`OpsTaskManagementUseCase.java`: `createWorkItem` L146 · `createSelfWorkItem` L307 · `updateWorkItemProgress` L338 · `updateWorkItemStatus` L357 · `reassignWorkItem` L390 · `markTaskNotificationRead` L409 · `workScope` L55.

| Action | Module | Capability |
|---|---|---|
| `create_work_item` | `dept_plan_assign`, `dept_project_assign` | `canCreate` |
| `create_self_work_item` | `dept_plan_tasks`, `dept_project_tasks` | `canUse` |
| `update_work_item_progress` | tasks | `canEdit` |
| `update_work_item_status` | tasks + assign | `canEdit` |
| `reassign_work_item` / `set_work_item_participant` | assign | `canEdit` |
| `add_work_item_comment` | 4 module | `canUse` |
| `mark_task_notification_read` | tasks | `canView` |

> ⇒ **JOBS không có action mồ côi quyền** (khác PROJECT §2.3).

### 1.4 Test canh vùng JOBS **[ĐO — danh sách tệp]**
`t01-work-menu` · `t05-personal-work` · `t06-department-scope` · `t07-kanban-board` · `t08-work-dashboard` · `t09-task-team-member` · `p5-01-work-menu-dashboard` · `p6-01…p6-08` (dashboard/queue/timeline/quá hạn) · `pr06-bch-crud`.

### 1.5 Kết luận JOBS
✅ **Cấu trúc đầy đủ, RBAC đúng, có test** — vùng này **không nghẽn go-live**.
⚠️ 3 điểm cần biết (không phải lỗi chặn): xem **J-01**, **J-02**, **J-03** ở §3.

---

## 2. BẢN ĐỒ **PROJECT**

### 2.1 Menu & màn đích **[ĐỌC MÃ]**
| Menu | Nhóm | Màn đích |
|---|---|---|
| **Quản lý dự án** (`site_command`) | `site_command` | `page.tsx:740` → **`<ProjectManagement …>`** |
| Tiến độ & sản lượng dự án | `project_management` | `page.tsx:740` → `<ProjectProgress>` |
| Thi công · Sản lượng · Thu hồi vốn · BOQ/HĐ dự án · Thanh toán HĐ · Tổ đội theo dự án | `project_management` | `ConstructionScreen` · `Production` · … |
| (Tab 5 trong chi tiết dự án) Ban chỉ huy | — | `app/page.tsx:1007` → `<SiteCommandScreen>` (`:1584`) |

⚠️ **Thay đổi kiến trúc menu**: cây workspace theo từng dự án (`PROJECT_WORKSPACE_ITEMS`) **không còn tồn tại** trong `app/page.tsx` hiện tại — grep `PROJECT_WORKSPACE_ITEMS` / `project-workspace-empty` / `Chưa có dự án đang hoạt động` ⇒ **0 kết quả**. ⇒ Bản vá "fallback menu Quản lý dự án" của vòng trước **đã bị thay thế** bởi hệ menu mới (`configuredMenuGroups`). **Cần đo lại trên UI** (P-07).

### 2.2 Backend **[ĐỌC MÃ]**
`ProjectManagementUseCase` + `ProjectContractUseCase` + `BoqManagementUseCase` + `ProductionManagementUseCase`.
Action chính: `create_project` · `update_project` · `delete_project` · `set_project_status` · `bulk_import_projects` · `create_project_team` · `save_boq_item` · `save_boq_version` · `save_project_contract`.

### 2.3 🔴 PHÁT HIỆN P0 — **RBAC dự án đang CHẶN người dùng nghiệp vụ**
`RbacService.requireActionModule` (`java-backend/application/.../rbac/RbacService.java:64-91`) — thứ tự:
```java
if (PUBLIC_ACTIONS.contains(action)) return;          // L66
List<String> required = ActionRbacRegistry.modulesFor(action);  // L67
if (isAdmin(user)) return;                            // L68  ← admin: cho qua
if (isCompanyLeadership(user) && !required.contains("admin")) return; // L69 ← director/accountant
if (required.isEmpty()) throw 403 "Thao tác chưa được khai báo quyền trong hệ thống."; // L70-83
```
Mà trong `ActionRbacRegistry.java`, các action dự án **khai module RỖNG `List.of()`**:

| Action | Dòng | Hệ quả ĐO ĐƯỢC từ mã |
|---|---|---|
| `create_project` | `:89` | **403** với mọi tài khoản **không phải** admin/director/accountant |
| `update_project` | `:302` | **403** (như trên) ⇒ trưởng phòng dự án **không sửa được** dự án |
| `delete_project` | `:135` | **403** |
| `bulk_import_projects` | `:75` | **403** |

**Đây KHÔNG phải phát hiện mới** — đã ghi ở `docs/dsh-state/CHECKLIST.md` §「MỐC 110 §8」 (**"18 action mồ côi quyền"**, dòng ~3049-3058) và `docs/dsh-state/CURRENT_STATE.md` (**REMAINING**), trạng thái: **chờ user quyết từng action thuộc module nào**. Bảng gợi ý của chính dự án có `bulk_import_projects` → `List.of("admin")`, `save_project_team…` → "module dự án, `canEdit`" — **chưa áp dụng**.

**Tác động go-live**: nếu người dùng nghiệp vụ (KS/PM Phòng Dự án) phải tạo/sửa dự án ⇒ **không làm được**, lỗi hiển thị *«Thao tác chưa được khai báo quyền trong hệ thống»* (thông báo gây hiểu nhầm — chính CHECKLIST đã ghi nhận).
**Hiện trạng là fail-closed (an toàn)**, ⛔ không phải lỗ hổng bảo mật — nhưng là **nghẽn nghiệp vụ**.

### 2.4 🔴 PHÁT HIỆN P1 — 4 tệp màn **MỒ CÔI** (2 thuộc PROJECT) **[ĐO + ĐỌC MÃ]**
`HANDOFF-20261007-C15` (đo lại vòng 42 — 2026-10-08 — **vẫn còn đúng**): **0 tham chiếu** trong `app/**` + `lib/**`:
`app/screens/ProjectAggregateTabs.tsx` · `app/screens/SiteCommandCreateModal.tsx` · `app/screens/WarehouseCreateModal.tsx` · `app/screens/TeamManagement.tsx` (chỉ 2 tệp **test** nhắc tên).
**Hệ quả nghiệp vụ đáng chú ý**: `WarehouseCreateModal.tsx:7-10` mô tả chức năng **thêm kho công trường cho dự án đã có** (dùng action `update_project`) — nhưng tệp **không được nối** ⇒ hiện **chỉ tạo được kho kèm lúc tạo dự án** (khớp ghi nhận cũ: "⛔ KHÔNG có `create_warehouse`").
Quyết định cần: **A** nối lại · **B** xoá (phá huỷ) · **C** giữ + ghi chú "chưa dùng".

### 2.5 ⚠️ Các điểm P1/P2 khác của PROJECT
| Mã | Vấn đề | Bằng chứng |
|---|---|---|
| **P-02** | `set_project_status` → module **`admin`** ⇒ **Ban lãnh đạo (director/accountant) KHÔNG đóng/mở được dự án**: ngoại lệ L69 bị loại vì danh sách **có chứa `"admin"`** | `ActionRbacRegistry.java:282`, `:526` + `RbacService.java:69` |
| **P-03** | `update_project` capability = **`canUse`** (yếu nhất) trong khi `save_project_contract`/`save_boq_item` = `canEdit` ⇒ không nhất quán | `ActionRbacRegistry.java:553` vs `:455`, `:485` |
| **P-05** | **FE**: `app/page.tsx` còn in **ngày ISO thô** cho dự án (`{row.startDate||"—"}` ×2) ⇒ lệch định dạng `dd/mm/yyyy` toàn hệ. Module `project_progress` vẫn tồn tại | `HANDOFF-20261007-C14` (đo lại vòng 42: **còn đúng**) — ⛔ tệp **LOCK phiên 01** |
| **P-06** | Mâu thuẫn kỳ vọng: yêu cầu 28/09 «4 thẻ danh sách TỔNG HỢP không khoá theo dự án» vs cấu trúc tab **theo dự án** hiện tại; `ProjectAggregateTabs` thành mã chết; test `pr01`/`pr03` từng mâu thuẫn nhau (đã vá `pr01` về 5 tab, `test:regression` xanh) | `docs/dsh-state/CURRENT_STATE.md` (mục "B · verify:fingerprint / BLOCKED TYPE 3") |
| **P-07** | Sau khi cây project-workspace bị gỡ, **cần đo lại** mục «Quản lý dự án» (nhóm `site_command`, **chỉ 1 mục**) có hiển thị & mở đúng `ProjectManagement` không — trước đây nhóm này từng **trống** | `lib/menu-helpers.ts:74` · `app/page.tsx:740` · grep `PROJECT_WORKSPACE_ITEMS` = **0** |

---

## 3. TỔNG HỢP PHÁT HIỆN (theo mức ưu tiên go-live)

| Mã | Vùng | Mức | Tóm tắt | Sửa ở đâu (thứ tự user chốt: **FE → BE → DB**) |
|---|---|---|---|---|
| **P-01** | PROJECT | 🔴 **P0** | `create/update/delete_project` + `bulk_import_projects` khai module rỗng ⇒ **403 với mọi user không phải admin/Ban lãnh đạo** | **FE trước**: ẩn/disable nút + thông báo đúng lý do. **BE sau**: khai module (theo quyết định §7) |
| **P-02** | PROJECT | 🟠 P1 | `set_project_status` = module `admin` ⇒ **director không đóng/mở dự án** | BE 1 dòng (đổi/đổi thêm module) |
| **P-05** | PROJECT | 🟠 P1 | FE còn **ngày ISO thô** ở `page.tsx` (2 chỗ dự án) | **FE** — ⛔ LOCK S01 (phải handoff) |
| **P-04** | PROJECT+JOBS | 🟠 P1 | **4 tệp màn mồ côi**; mất khả năng "thêm kho cho dự án đã có" | Quyết định A/B/C (xoá = phá huỷ) |
| **P-03** | PROJECT | 🟡 P2 | `update_project` capability `canUse` không nhất quán | BE (cùng lượt với P-01) |
| **P-07** | PROJECT | 🟡 P2 | Cần **đo UI** mục «Quản lý dự án» (nhóm 1 mục) | Đo (FE verify) |
| **P-06** | PROJECT | 🟡 P2 | Chốt yêu cầu "4 thẻ tổng hợp" (A: đóng + xoá mã chết · B: dựng lại) | Quyết định user |
| **J-01** | JOBS | 🟡 P2 | «Phòng ban» và «Giao việc» **dùng chung `active` key** (`dept_plan_assign`); phân biệt nhờ state `workView` ⇒ **có thể highlight đồng thời 2 mục**, deep-link không giữ tab | **FE**: cấp `active` key riêng |
| **J-02** | JOBS | 🟡 P2 | 22 màn `dept_plan_*`/`dept_project_*` → `DepartmentTaskWorkspace` **chỉ 1 form** ⇒ dễ vào màn mỏng | Ẩn khỏi menu go-live (thuộc User/S02) |
| **J-03** | JOBS | 🔵 P3 | Trùng lối vào KPI (`kpi_summary` vs `dept_plan_kpi`/`dept_project_kpi`) | FE (gom 1 lối) |
| **X-01** | QUY TRÌNH | 🟠 P1 | Hàng chục tệp chưa commit trải 3 phiên ⇒ rủi ro mất việc khi build/reset | Hợp nhất theo **danh sách tệp từng phiên** (⛔ không `git add -A`) |
| **X-02** | CÔNG CỤ | 🟡 P2 | 4 cổng probe đo lệch (xanh rỗng / đỏ oan) | Sửa `tools/probe-*` (⛔ không thuộc phiên này) |

---

## 4. VÙNG BỊ **KHOÁ** — luật phối hợp (⛔ tránh conflict)

| Vùng | Phiên giữ | Nguồn |
|---|---|---|
| `app/page.tsx` · `java-backend/**` · `docs/dsh-state/**` | **ERP-SESSION-01** | `SESSION_REGISTRY.md` |
| `app/screens/Inventory.tsx` · `lib/warehouse-hub.ts` · `lib/menu-helpers.ts` · `tests/w0*` | **ERP-SESSION-02** | `SHARED_STATE.md` |
| `HrProfileEditModal.tsx` · `TeamDirectory.tsx` · `lib/status-labels.ts` · `lib/labels.ts` · `lib/report-catalog.ts` · `lib/request-export.ts` · `public/templates/*` · `tests/mt3-c0*` | **ERP-SESSION-03** | `SESSION_C/README.md` |
| `docs/37*`, `docs/38*`, `docs/dsh-mutil-session/SESSION_D/**` | **ERP-SESSION-04 (phiên này)** | tệp này |

⇒ **Hệ quả trực tiếp**: **mọi việc sửa FE của JOBS/PROJECT đều rơi vào `app/page.tsx` hoặc `lib/menu-helpers.ts` = 2 tệp ĐANG BỊ GIỮ** ⇒ ⛔ phiên này **không tự sửa**; phải **HANDOFF** cho S01/S02 (hoặc user giao trực tiếp cho họ).

---

## 5. DANH SÁCH VIỆC **SẴN SÀNG GIAO** (đúng thứ tự FE → BE → DB)

| # | Việc | Loại | Tệp | Chủ sở hữu | Test/cổng cần chạy |
|---|---|---|---|---|---|
| **T-01** | **Đo UI**: mục «Quản lý dự án» có hiện + mở đúng `ProjectManagement`? 5 tab dự án đủ? (P-07) | FE verify | — | **S04 (tôi)** | so `h1` sau khi bấm (đúng kỹ thuật đã ghi ở `SESSION_C/TEST_LOG` §C20) |
| **T-02** | **FE**: 2 chỗ **ngày ISO thô** của dự án → `date(...)` (P-05) | FE | `app/page.tsx` | **S01** (handoff C14) | `tsc` + `mt3-c10` |
| **T-03** | **FE**: nút tạo/sửa/xoá dự án — disable + tooltip nêu **đúng** lý do quyền (chuẩn bị cho P-01) | FE | `app/page.tsx` (ProjectManagement) | **S01** | `tsc` + test quyền |
| **T-04** | **FE**: cấp `active` key riêng cho 2 mục «Phòng ban»/«Giao việc» (hết highlight đôi) (J-01) | FE | `lib/menu-helpers.ts` + `app/page.tsx` | **S02 + S01** | `t01-*` · `p5-01-*` |
| **T-05** | **BE**: khai module + capability cho 4 action dự án (P-01) + `set_project_status` (P-02) + `update_project` `canUse→canEdit` (P-03) | BE | `java-backend/application/.../ActionRbacRegistry.java` | **S01** | `ActionRbacRegistryPoTest` · test RBAC dự án mới |
| **T-06** | Quyết + thi hành **4 tệp mồ côi** (P-04) | cả | 4 tệp + test | **user/S01** | nếu xoá ⇒ `test:regression` phải xanh |
| **T-07** | Ẩn 22 màn phòng ban mỏng khỏi menu go-live (J-02) | FE | `lib/menu-helpers.ts` | **S02** | `w01`/`t01` |
| **T-08** | Hợp nhất commit theo từng phiên (X-01) | quy trình | — | **user + 3 phiên** | ⛔ **không** `git add -A` |

---

## 6. KẾT LUẬN & KHUYẾN NGHỊ

1. **JOBS (Công việc) đã đủ dùng cho go-live**: menu 5 mục → `WorkCenter` 5 tab + `DepartmentTaskWorkspace`, backend 8 action **đủ module + capability**, 15+ tệp test canh. Chỉ còn 3 điểm nhỏ (**J-01** highlight đôi · **J-02** màn phòng ban mỏng · **J-03** trùng lối KPI).
2. **PROJECT có 1 nghẽn P0 thật**: **RBAC dự án** (`create/update/delete_project` khai module rỗng ⇒ 403 với người dùng nghiệp vụ). Đây là **việc đầu tiên nên giao**, và vì tệp là `java-backend/**` (BE — **LOCK S01**) nên theo thứ tự user chốt: **làm FE trước** (T-03: disable + thông báo đúng lý do để người dùng không tưởng "hệ thống hỏng"), **rồi BE** (T-05).
3. **Dead code 4 tệp** cần quyết sớm vì một trong số đó (`WarehouseCreateModal`) đang **chôn** một khả năng nghiệp vụ (thêm kho cho dự án đã có).
4. ⛔ **Không sửa trực tiếp** `app/page.tsx` / `lib/menu-helpers.ts` — thuộc S01/S02 ⇒ dùng **HANDOFF** (`HANDOFF-20261008-D01`).
5. ⛔ **Không commit/push** (luật user) — toàn bộ phát hiện nằm ở tài liệu.

## 7. CÂU HỎI CẦN **USER** QUYẾT (trước khi giao việc)

| # | Câu hỏi | Đề xuất của tôi |
|---|---|---|
| 1 | Ai được **tạo/sửa/xoá dự án**? | Tạo/sửa → module `site_command` + `canUse`/`canEdit` (Phòng Dự án); **xoá** → `admin` |
| 2 | Ai được **đóng/mở dự án** (`set_project_status`)? | `site_command` + `canEdit` (gỡ khỏi `admin`) — hiện **director cũng không làm được** |
| 3 | **4 tệp mồ côi**: nối lại / xoá / ghi chú? | **C** (giữ + ghi chú) cho `WarehouseCreateModal` (khả năng nghiệp vụ còn giá trị) · **B** (xoá) cho `ProjectAggregateTabs` nếu chọn Phương án A ở câu 4 |
| 4 | Yêu cầu «4 thẻ TỔNG HỢP» (28/09): **A** đóng yêu cầu hay **B** dựng lại? | **A** (cấu trúc tab theo dự án đang chạy) |
| 5 | **22 màn phòng ban mỏng**: ẩn khỏi menu go-live? | **Có** (ẩn) |

---

## 8. PHỤ LỤC — BẰNG CHỨNG ĐÃ ĐỌC

| Tệp | Dòng/dùng để chứng minh |
|---|---|
| `lib/menu-helpers.ts` | `:74` menu «Quản lý dự án» · `:75-81` nhóm `project_management` · `:125-132` `workMenuItems` · `:237-238` `kpi_summary` |
| `app/page.tsx` | `:442-457` `workCenterViewFor` (**L452 = bản vá lỗi Dashboard cũ**) · `:498/602/653` state `workView` · `:740` render `ProjectManagement`/`ProjectProgress` · `:741` WorkCenter vs `DepartmentTaskWorkspace` · `:1007`, `:1584` `SiteCommandScreen` |
| `java-backend/application/.../rbac/RbacService.java` | `:64-91` thứ tự kiểm quyền + nhánh **`required.isEmpty()` ⇒ 403** · `:60-62` `isCompanyLeadership` = `director`,`accountant` |
| `java-backend/application/.../rbac/ActionRbacRegistry.java` | `:16,102,162,166,248-253,290,305-306` (JOBS) · `:75,89,135,282,302,455,485,526,553` (PROJECT) |
| `java-backend/application/.../service/OpsTaskManagementUseCase.java` | `:55,101,146,307,338,357,390,409,421,465,484,500,527,598,629,650,759,767,778` |
| `java-backend/web/.../controller/SystemController.java` | `:1030-1182` nhánh action duyệt/PO/giao nhận/thầu |
| `docs/dsh-mutil-session/SESSION_C/HANDOFF_LOG.md` | `:262-274` `HANDOFF-C15` (4 tệp mồ côi) · `:297-301` C13/C14/C15 còn `OPEN` |
| `docs/dsh-state/CHECKLIST.md` | `:3040-3061` §7 bài học + §8 **18 action mồ côi quyền** (danh sách + gợi ý) |
| `docs/dsh-state/CURRENT_STATE.md` · `SESSION_REGISTRY.md` · `SHARED_STATE.md` | kiến trúc 3 dịch vụ · danh sách LOCK · vân tay/build (**[ĐO]**, có ngày) |

---

## 9. ĐÍNH CHÍNH & BỔ SUNG (đọc tiếp `docs/dsh-state/SESSION_REGISTRY.md` §699-725 — **quan trọng cho việc giao task**)

| # | Điều chỉnh | Chi tiết | Ảnh hưởng tới việc giao |
|---|---|---|---|
| 1 | `app/page.tsx` **không còn thuần S01** | **S02 đã sửa 1 dòng** (`action={action}` tại **L741**) **theo lệnh user** — ghi ở `HANDOFF-20261007-008` | Khi ai sửa `page.tsx`: **đọc lại tệp trước**, ⛔ **không revert** dòng đó; báo S02 nếu đang có thay đổi chưa commit |
| 2 | `app/globals.css` là **tệp DÙNG CHUNG** | S02 đã thêm **61 dòng** (neo `.approved-inventory-screen`) **theo lệnh user** | Mọi CSS mới **BẮT BUỘC chèn TRƯỚC dấu** `/* VNTECH_MASTER_BASELINE_CSS_R1_1_1_END */` — test `project-navigation-consolidation.test.mjs:65` kiểm tệp **kết thúc** bằng dấu đó |
| 3 | **Git đang lệch** | Ghi nhận 2026-10-08: `unity` LOCAL = `fb83648` · `origin/unity` = `8d9c303` ⚠️; user từng yêu cầu S02 **revert 3 commit** ⇒ S02 **đã dừng commit/push** | **X-01** (§3) trở nên cấp thiết hơn: phải **user quyết** trước khi hợp nhất; ⛔ **không** `git add -A` |
| 4 | **Trình tự bắt buộc khi sửa tệp** (bài học S02 tự nhận) | `CHECK ai giữ` → `CHECK ai sửa dở` → `XIN PHÉP` → `SỬA` → `GHI LOG` → `BÁO STATE CHUNG` | Mọi task **T-02…T-07** phải đi đúng trình tự này trước khi chạm `app/page.tsx` / `lib/menu-helpers.ts` / `app/globals.css` |

### 9.1 Nhắc lại 2 luật đo lường áp cho mọi phép kiểm của audit này
1. **`scrollHeight > clientHeight` ⛔ KHÔNG chứng minh «nội dung bị cắt»** (`SHARED_STATE` §73) — phải **đo từng con** + đọc `textContent`; **rỗng/hoạ tiết = cắt CÓ Ý**.
2. **Một con số đỏ từ cổng ⛔ không phải một lỗi** — phải **đo bằng công cụ thứ hai** + **đọc bản chất khối** trước khi sửa (`SHARED_STATE` §31/§40).

---

## 10. ⚠️ **ĐÍNH CHÍNH QUAN TRỌNG (08/10/2026, sau khi đọc tiếp `SystemController.java`)** — đọc `docs/39_DINH_CHINH_AUDIT_TANG_CONG_QUYEN_20261008.md`

| Mã | Điều **`docs/38` đã viết (chưa chính xác)** | **SỰ THẬT ĐỌC TỪ MÃ** |
|---|---|---|
| **P-01** | «4 action dự án khai module **rỗng** ⇒ 403» (ngụ ý thiếu khai báo module) | `create_project`/`update_project`/`delete_project` bị **`requireRequireAdmin`** chặn ở **controller** (`SystemController.java:281-284`, `:286-289`, `:296-302`; định nghĩa `:1739-1745` = **chỉ `role=="admin"`**) ⇒ **là CHỦ Ý**, ⛔ không phải thiếu sót. Khai báo module rỗng chỉ là **tầng thứ hai** (và sinh **thông điệp khác**) |
| **P-02** | «module `admin` ⇒ ngoại lệ Ban lãnh đạo bị loại» | `set_project_status` cũng bị **`requireRequireAdmin`** (`:291-294`) ⇒ **chỉ `admin`**. Kết luận «Giám đốc không đóng/mở được dự án» **VẪN ĐÚNG**, nhưng **lý do là tầng controller** |
| **P-03** | «`update_project` capability `canUse` không nhất quán» | Đúng về khai báo, nhưng **vô hiệu trên thực tế** (cổng controller chặn trước) ⇒ chỉ là **nợ nhất quán** |
| 🆕 **P-08** | — | **Nhóm mồ côi THẬT**: `save/set/delete_material_category` · `save/set/delete_material_subcategory` · `import_material_catalog` · `set_project_team_status` · `delete_project_team` · `save_approval_stage` · `set_approval_stage_status` · `delete_approval_stage` — khai **rỗng** và **KHÔNG** bị admin-gate (`SystemController:893-1040` dùng `requireCurrentUser`) ⇒ **403** với mọi tài khoản không phải admin (nghi vấn **CAO**, ⛔ chưa có phép thử) |

> ⛔ Vì vậy: **câu 1 và câu 2** ở §7 phải **hỏi lại theo bản chất** — *«có muốn dự án CHỈ `admin` quản lý không?»* — ⛔ **không** phải *«khai module nào?»*. Chi tiết + phép thử bắt buộc: `docs/39` §1, §4, §5.
