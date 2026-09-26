# MT2 — PHÂN LOẠI 22 HỢP ĐỒNG CŨ ĐANG ĐỎ (run 23/09/2026)

> **Phát hiện khi chạy TOÀN BỘ bộ hợp đồng frontend** (⛔ không chỉ `npm run test:regression`):
> `node --import tsx --test tests/*.test.mjs` ⇒ **570 test · 547 PASS · 22 FAIL · 1 skip · exit 1**.
> Cổng được duy trì lâu nay (`npm run test:regression`) chỉ chạy **69 test** nên **22 ca này ⛔ không từng hiện ra**.
> Log đầy đủ: `docs/agent-progress/MT2-FULL-CONTRACT-RUN-23-09.log.txt` (158 KB).
> ⚠️ **KHÔNG** được coi là "hỏng mới": một phần là hợp đồng **cũ bị MT2 thay thế** (GOAL §4: MT2 ưu tiên), phần còn lại **phải kiểm mã** trước khi kết luận.
> Ký hiệu verdict: 🔵 **CŨ-BỊ-MT2-THAY-THẾ** (cập nhật hợp đồng + ghi lý do) · 🔴 **NGHI VẤN THẬT** (kiểm mã ngay) · ⚪ **CHƯA PHÂN LOẠI**.

## A. BẢNG PHÂN LOẠI (22 ca)

| # | Tệp hợp đồng | Ca đỏ | Thông điệp đo được | Verdict sơ bộ | Việc phải làm |
|---|---|---|---|---|---|
| 1 | `ad01-account-rename.test.mjs` | bước 1 «Tài khoản» + 12 bước | «Màn Quản trị phải còn ĐÚNG 12 bước» | 🔵 nghi CŨ: MT2 §13.1/P12-01 thêm tab THÔNG BÁO ⇒ số bước đổi | Đếm bước thật trong `admin-governance-pure.ts` rồi cập nhật hợp đồng + lý do |
| 2 | `ad02-account-columns.test.mjs` | ĐÚNG 13 cột | «Phải có ĐÚNG 13 cột» | 🔵 nghi CŨ: MT2 §13.3 đổi bộ cột tài khoản | Chốt danh sách cột thật (P12-04/P12-05) ⇒ cập nhật |
| 3 | `ad02-account-columns.test.mjs` | 2 trường «không nguồn» | «Chỉ 2 trường được phép không nguồn» | ⚪ | Đối chiếu `ACCOUNT_UNSOURCED_REASON` hiện tại |
| 4 | `ad08-dept-filter-bulk-delete.test.mjs` | action xoá quyền phòng ban | «Action phải có trong bảng RBAC (module list rỗng = admin)» | 🔴 **NGHI VẤN BẢO MẬT** | Kiểm `ActionRbacRegistry` có khoá cho action này (⛔ mù quyền = 403 mặc định) |
| 5 | `ad10-system-level-audit.test.mjs` | action xoá (bằng chứng 2 tầng) | «Phải có trong bảng RBAC (admin)» | 🔴 **NGHI VẤN BẢO MẬT** | như #4 |
| 6 | `f03-tai-chinh-audit-deps.test.mjs` | vị trí action của F-03 | «hồ sơ F-03 ghi sai vị trí action» | ⚪ | Kiểm hồ sơ F-03 ⇄ `system-route.mjs` + `SystemController` |
| 7 | `p01-p02-p03-contract.test.mjs` | P-03/c trạng thái | «chọn `awaiting_po` phải khớp qua `supplyStatus`» | ⚪ | Kiểm `status` ⇄ `supplyStatus` ở màn PR |
| 8 | `p07-supplier-partner-split.test.mjs` | 8 điểm chạm cho 2 mục mới | «`activateModule` chưa nhận type `view` mới» | 🔵 nghi CŨ: T-125/MT2 đổi cơ chế mở màn (view) | Xác nhận cơ chế mới rồi cập nhật |
| 9 | `p07-…` | màn đích khoá cũ | «Chưa render `SupplierManager` cho khoá cũ kèm `view`» | ⚪ | Kiểm nhánh render thật trong `page.tsx` |
| 10 | `p07-…` | thứ tự `modules` | «Thứ tự mục menu của khối `modules` đã bị đổi» | 🔵 nghi CŨ: MT2 P8-01 (NCC xuống cuối) đổi thứ tự CÓ CHỦ Ý | Cập nhật hợp đồng theo §6.1 |
| 11 | `p07-…` | `drizzle/**` nhắc `dept_plan_partners` | «Thay đổi trong `drizzle/` là NGOÀI PHẠM VI P-07» | ⚪ | Kiểm drizzle có dòng đó không (nếu có ⇒ hợp đồng cũ sai) |
| 12 | `p12-05-user-identity-model.test.mjs` | user mã trống | «⛔ KHÔNG tự bịa mã cho user đang trống» | ⚪ | Đối chiếu dữ liệu/AD-* hiện tại |
| 13 | `t01-work-menu.test.mjs` | 5 mục menu Công việc | «`work_dashboard` … `view: "kpi"`» | 🔵 **ĐÃ KIỂM**: MT2 §3.1/P5-01 đổi `view` ⇒ `dashboard` | Cập nhật hợp đồng + ghi lý do (§4 ưu tiên MT2) |
| 14 | `t01-…` | đích đến 4 mục | (cùng gốc #13) | 🔵 | như #13 |
| 15 | `t09-task-team-member.test.mjs` | bảng ánh xạ view→tab | «Thiếu bảng ánh xạ view → tab trong WorkCenter» | 🔵 nghi CŨ: MT2 P5-01 đặt tên `WORK_TAB_OF_VIEW` | Đổi hợp đồng theo tên mới (sau khi xác nhận) |
| 16 | `t09-…` | không đổi ánh xạ | «Không được đổi ánh xạ view → tab» | 🔵 | như #15 |
| 17 | `tm04-team-crud.test.mjs` | quyền 3 action tổ đội | «`create_project_team` phải gắn module «site_command»» | 🔴 **NGHI VẤN BẢO MẬT** | Kiểm registry module của action tổ đội |
| 18 | `w01-warehouse-menu.test.mjs` | khoá cũ còn nhánh render | «Khoá cũ `warehouse_issue` đã MẤT nhánh render» | 🔵 **ĐÃ KIỂM**: MT2 §7.6/P9-06 re-point `warehouse_issue` sang màn «Cấp phát & hoàn trả» (`view="list"`); khoá VẪN SỐNG (`menu-helpers.ts:90-95`, `page.tsx:158-159`) | Cập nhật hợp đồng: yêu cầu nhánh render CŨ là lỗi thời |
| 19 | `w01-…` | huy hiệu nhóm KHO | «Huy hiệu phải tính bằng `warehouseMenuBadge`…» | ⚪ | Kiểm hàm badge hiện tại |
| 20 | `w02-project-warehouse-relation.test.mjs` | số đo DB vs audit | «Số đo lại khác con số đã chép trong audit (kho=6, dự án=2, kho gắn dự án=5)» | 🔵 CŨ: **tệp audit cần cập nhật số**, DB đã đổi từ lúc viết | Cập nhật số trong hồ sơ audit (⛔ không sửa DB) |
| 21 | `w03-project-warehouse.test.mjs` | 3 câu ghi 1 batch | «Ba câu ghi phải nằm trong MỘT batch (nguyên tử)» | 🔴 **NGHI VẤN TOÀN VẸN DỮ LIỆU** (§19) | Kiểm `create_project` hiện có còn ghi dự án+kho nguyên tử |
| 22 | `w03-…-flag.test.mjs` | cờ `warehouseBlocked` + cảnh báo | «Thiếu cờ `warehouseBlocked` cho nhánh «Không»» / «phải gỡ cảnh báo BLOCKED…» | 🔴 **NGHI VẤN TOÀN VẸN DỮ LIỆU** | Kiểm nhánh «Không tạo kho» hiện tại |

## B. TỔNG HỢP SƠ BỘ
| Nhóm | Số ca | Ghi chú |
|---|---|---|
| 🔵 CŨ-BỊ-MT2-THAY-THẾ (đã có bằng chứng mã) | **4** (#13, #14, #18, + #10 nghi cao) | Cập nhật hợp đồng **kèm lý do MT2** — ⛔ không sửa mã |
| 🔵 nghi CŨ (cần xác nhận nhanh) | **5** (#1, #2, #8, #15, #16, #20) | Đối chiếu mã 1 lượt rồi cập nhật |
| 🔴 NGHI VẤN THẬT (ưu tiên kiểm mã) | **5** (#4, #5, #17, #21, #22) | 3 bảo mật RBAC · 2 toàn vẹn dữ liệu |
| ⚪ CHƯA PHÂN LOẠI | **8** (#3, #6, #7, #9, #11, #12, #19) | Kiểm tiếp |

## C. QUY TẮC XỬ LÝ (theo GOAL §4 · §7 · §26 · §27)
1. **Mã là chuẩn khi MT2 đã đổi yêu cầu** ⇒ cập nhật hợp đồng, ghi rõ lý do + mốc MT2 ngay tại chỗ.
2. **Nếu chức năng THẬT SỰ mất** (không có nhánh render/không gắn module/không còn batch) ⇒ **sửa mã**, ⛔ không hạ hợp đồng.
3. Mọi cập nhật hợp đồng phải kèm **bằng chứng đo lại** (grep/đoạn mã/màn hình) — ⛔ không "sửa cho xanh".
4. Sau khi xử lý xong ⇒ thêm các tệp này vào **cổng chạy thường xuyên** (hoặc bổ sung `test:regression`) để ⛔ không tái mù.

## D. TRẠNG THÁI
- Đây là **phát hiện MỚI của 23/09/2026**, ⛔ **không** nằm trong 100 dòng task MT2 (là **nợ kỹ thuật của cổng test cũ**), nên **không** đổi bộ đếm 93/100 cho tới khi phân loại xong từng ca.
- Ưu tiên kế tiếp: **5 ca 🔴** (#4, #5, #17, #21, #22) ⇒ kiểm mã; nếu thật thì sửa; nếu cũ thì cập nhật kèm lý do.

---

## E. FIX LOG — 23/09/2026 (MT2-P14-03c): ĐÃ XỬ LÝ 3/5 CA 🔴 BẰNG **SỬA MÃ**

### E.1 — #17 `tm04` · **LỖI THẬT: CHẶN OAN «CHỈ HUY TRƯỞNG»** ⇒ ĐÃ SỬA MÃ
**Nguyên nhân gốc (đo được)**: `ActionRbacRegistry` khai `Map.entry("create_project_team", List.of())` = **MẶC ĐỊNH TỪ CHỐI 403**; mà `SystemController:225` gọi `rbacService.requireActionModule(...)` cho **MỌI action không-public TRƯỚC** `switch` ⇒ `commander` bị **403 ngay**, ⛔ không bao giờ tới được `OpsTaskManagementUseCase.createProjectTeam` (dòng 384 có `rbac.requireRole(["commander","admin"])`).
**Đối chiếu NGUỒN SỰ THẬT JS**: `scripts/system-route.mjs:1699` = `requireRole(user,["commander","admin"])` cho `create_project_team` ⇒ commander **PHẢI** tạo được tổ đội. ⇒ **lệch JS = lỗi thật** (không phải hợp đồng cũ).
**Đã sửa**: `Map.entry("create_project_team", List.of("site_command"))` (module THẬT của phân hệ Tổ đội) — commander có `site_command.canUse` qua **cả 2 cổng** (module + `requireRole`).
**⛔ KHÔNG nới 2 action còn lại** — JS `:1716`/`:1720` = `requireRole(user,["admin"])` ⇒ giữ `List.of()` (admin-only) là ĐÚNG; hợp đồng `tm04` đã được cập nhật lại cho khớp JS (kèm số dòng JS) thay vì đòi `site_command` cho cả 3.

### E.2 — #4 `ad08` + #5 `ad10` · **THIẾU KHAI BÁO REGISTRY (fail-closed, ⛔ không hở quyền)** ⇒ ĐÃ SỬA MÃ
**Đo được**: `delete_department_permission` (controller `:413`) và **5 action màn Cấp bậc** (`save_system_level :423`, `set_system_level_status :428`, `delete_system_level :433`, `set_user_system_level :438`, `system_level_impact :443`) ⛔ **không có dòng nào** trong `ActionRbacRegistry` (grep `system_level` trong registry = **0 hit**).
**Hệ quả thực tế**: rơi vào `getOrDefault(action, List.of())` ⇒ **403 mặc định**; controller lại gác `requireRequireAdmin` ⇒ **admin vẫn qua** ⇒ ⛔ **KHÔNG hở quyền**, nhưng thiếu khai báo ⇒ audit coverage không phân loại được + hợp đồng đỏ.
**Đã sửa**: khai tường minh **6 dòng** nhóm admin-only (`Map.entry("<action>", List.of())`) + **6 dòng capability** `canUse`, đúng quy ước tệp.

### E.3 — BẰNG CHỨNG ĐO LẠI SAU KHI SỬA
| Cổng | Trước | Sau |
|---|---|---|
| `tests/ad08` + `tests/ad10` + `tests/tm04` | 14 ca · **3 đỏ** | **14/14 PASS · exit 0** |
| `tools/probe-action-registry-coverage.mjs` | ✅ | ✅ **0 mù quyền · 0 thiếu capability** (mọi action thuộc 1 trong 4 nhóm hợp lệ) |
| `tools/probe-action-role-parity.mjs` | ✅ | ✅ «tầng vai trò hai bản KHỚP» |
| `tools/probe-action-scope-parity.mjs` | ✅ | ✅ «mọi action JS kiểm phạm vi đều được Java kiểm tương ứng» |
| Java RBAC (`PoRbacActionsIntegrationTest` · `RbacSupplierMaterialTest` · `ProductionRoleCounterProofTest` · `AdminGovernanceIntegrationTest` · `NotificationCenterTest`) | — | **19/19 · 0 Failures · 0 Errors · BUILD SUCCESS** |
| `npm run test:regression` | 69/69 | **69/69 · 0 fail** |

### E.4 — CÒN LẠI (sau lượt 2)
| # | Ca | Kết quả |
|---|---|---|
| #21 | `w03` «Ba câu ghi phải nằm trong MỘT batch (nguyên tử)» | ✅ **ĐÃ XỬ LÝ Ở E.5** |
| #22 | `w03-flag` (cờ `warehouseBlocked`) | ✅ **ĐÃ XỬ LÝ Ở E.5** |
| 16 ca còn lại | gồm 5 ca menu (`t01` ×2 · `t09` ×1 · `w01` ×2), 4 ca `p07`, `ad01`/`ad02`/`f03`/`p01-p02-p03`/`p12-05`/`w02` | 🔵/⚪ — xử lý lượt kế (đã có bằng chứng sơ bộ cho nhóm menu) |

---

## E.5 — FIX LOG LƯỢT 2 (23/09/2026): `w03` — **PHÁT HIỆN LỖI THẬT Ở JAVA: BỎ QUA CỜ «Tạo kho dự án?»**

**Đo được — mâu thuẫn 3 tầng:**
| Tầng | Hành vi |
|---|---|
| **UI** `app/page.tsx:2709-2742` | ĐÃ hỏi «Tạo kho dự án?» (radio Có/Không) và gửi `createWarehouse: createWarehouse === "yes"` |
| **JS** `scripts/system-route.mjs` (nhánh `create_project`) | ĐỌC `payload.createWarehouse`, bọc câu `INSERT INTO warehouses` trong `if (createWarehouse !== false)`, gom `statements` rồi `await env.DB.batch(statements)` ⇒ **nguyên tử + tôn trọng cờ** |
| **Java (trước khi sửa)** | `ProjectManagementUseCase.createProject` gọi `store.insertProjectWithWarehouse(...)` **⛔ KHÔNG đọc cờ** ⇒ **luôn** chèn kho ⇒ người dùng chọn «Không» **vẫn bị sinh kho công trường** ⇒ **lệch hành vi + sai dữ liệu** (MT2 §5.2 · §16 · §19) |

**ĐÃ SỬA MÃ (không đổi CSDL, tương thích ngược):**
1. `ProjectAdminStore.insertProjectWithWarehouse(...)` + `ProjectAdminStoreAdapter` (giữ `@Transactional`): thêm tham số `boolean createWarehouse`; câu `INSERT INTO warehouses` nằm trong `if (createWarehouse)`; dự án + phạm vi **luôn** được ghi.
2. `ProjectManagementUseCase.createProject`: đọc cờ bằng hàm mới `createWarehouseFlag(...)` — **bản sao đúng biểu thức JS** (vắng/null/chuỗi rỗng ⇒ `true`; chỉ `false`/`0`/`"0"`/`"false"`/`"no"` ⇒ `false`) + trả **thông điệp khác nhau** cho 2 nhánh (giống JS).
3. Test Java MỚI `ProjectCreateWarehouseFlagTest` — **3/3 XANH**: ① không gửi cờ ⇒ **CÓ** kho (tương thích ngược) ② cờ `false` ⇒ **0 kho**, dự án + phạm vi vẫn có ③ chuỗi `"no"` ⇒ 0 kho.

**Hợp đồng cũ `tests/w03-project-warehouse.test.mjs`** (hồ sơ trạng thái BLOCKED — chính nó ghi «nếu `create_project` BẮT ĐẦU đọc cờ thì phải gỡ cảnh báo BLOCKED») ⇒ đã **cập nhật theo hiện trạng** kèm lý do: ① batch nay là `await env.DB.batch(statements)` (vẫn NGUYÊN TỬ) ② câu kho nằm trong `if (createWarehouse !== false)` ③ UI **đã bỏ chặn** (không còn `warehouseBlocked`), gửi cờ thật.

**BẰNG CHỨNG ĐO LẠI:**
| Cổng | Trước | Sau |
|---|---|---|
| `tests/w03-project-warehouse.test.mjs` + `…-flag.test.mjs` | 7/10 (3 đỏ) | **10/10 PASS** |
| Java `ProjectCreateWarehouseFlagTest` + `ProjectAdminIntegrationTest` | — | **9/9 · 0 Failures · 0 Errors · BUILD SUCCESS** |
| **Toàn bộ bộ hợp đồng frontend** (`tests/*.test.mjs`) | 570 · 547 PASS · **22 FAIL** | **570 · 553 PASS · 16 FAIL · 1 skip** ⇒ **đã xanh 6 ca** |

**16 CA CÒN LẠI (danh sách chính xác):** `ad01` (1) · `ad02` (2) · `f03` (1) · `p01-p02-p03-contract` (1) · `p07-supplier-partner-split` (4) · `p12-05` (1) · `t01-work-menu` (2) · `t09-task-team-member` (1) · `w01-warehouse-menu` (2) · `w02-project-warehouse-relation` (1).
Trong đó nhóm **menu (§3.1/§7.6/§6.1)** đã có bằng chứng là **CŨ-BỊ-MT2-THAY-THẾ** (`work_dashboard.view` nay là `dashboard`; `warehouse_issue` re-point sang màn «Cấp phát & hoàn trả» nhưng khoá vẫn sống) ⇒ lượt kế cập nhật hợp đồng kèm lý do.

> ⛔ **NO COMMIT · NO PUSH** — mọi sửa đổi nằm trong cây làm việc.

---

## E.6 — FIX LOG LƯỢT 3 (23/09/2026): NHÓM **MENU** — 5 CA, ⛔ **KHÔNG SỬA MÃ** (MT2 đã thay thế hợp đồng cũ)

Nguyên tắc áp dụng: **GOAL §4 — MT2 là nguồn sự thật; khi MT2 đã đổi yêu cầu thì hợp đồng cũ phải cập nhật KÈM LÝ DO**, ⛔ không sửa mã cho vừa hợp đồng cũ.

| Ca | Bằng chứng đo được | Kết luận | Đã làm |
|---|---|---|---|
| `t01` ×2 | `lib/menu-helpers.ts:122` khai `work_dashboard … view: "dashboard"`; chính mã ghi rõ ở `:110-121` rằng `view: "kpi"` là **SAI** (trỏ vào tab KPI) và đã sửa theo **MT2 §3.1 + P5-01** («click menu Công việc ⇒ hiển thị Dashboard NGAY») | 🔵 CŨ-BỊ-MT2-THAY-THẾ | Sửa bảng `EXPECTED` sang `view: "dashboard"` + ghi mốc MT2 |
| `t01` ×1 (đích đến) | grep `<DepartmentTaskWorkspace` = **2 chỗ render THẬT**; nhánh nay có thêm điều kiện `active !== "dept_plan_suppliers"` + nhiều props ⇒ chuỗi hẹp cũ đỏ oan | 🔵 hợp đồng GIÒN (chức năng ⛔ KHÔNG mất) | Cập nhật mẫu regex theo đúng nhánh hiện tại (KH/DA) |
| `t09` ×1 | `WorkCenter.tsx:88` = `{ personal: 0, department: 1, assign: 2, kpi: 3, dashboard: 3, reports: 4 }` (thêm `dashboard`, giữ `kpi`) | 🔵 CŨ-BỊ-MT2-THAY-THẾ | Cập nhật chuỗi kỳ vọng + ghi mốc MT2-P5-01 |
| `w01` ×1 (nhánh render) | `page.tsx` có **2 nhánh THẬT** cho khoá `warehouse_issue`: `… allocateReturnScreenView === "list" && <AllocateReturn …/>` và `… !== "list" && <WarehouseIssueTeams …/>` (MT2-P9-06 §7.6 re-point) ⇒ chuỗi hẹp `active === "warehouse_issue" && <` đỏ oan | 🔵 CŨ-BỊ-MT2-THAY-THẾ (khoá VẪN SỐNG) | Đổi sang 2 khẳng định mới; 5 khoá còn lại vẫn kiểm chuỗi cũ |
| `w01` ×1 (huy hiệu) | `warehouseMenuBadge(item.badgeKeys)` xuất hiện **14 lần** (≥ 4) — hợp đồng cũ chốt cứng `= 4` | 🔵 hợp đồng GIÒN | Đổi sang ngưỡng `>= 4` + in số đo thật |

**BẰNG CHỨNG ĐO LẠI:** `t01` **9/9** · `t09` **8/8** · `w01` **8/8** ⇒ toàn bộ bộ hợp đồng frontend: **570 · 558 PASS · 11 FAIL** (chuỗi tiến triển: **22 → 16 → 11**, đã xanh **11 ca**).

**11 CA CÒN LẠI:** `p07-supplier-partner-split` ×4 · `ad02-account-columns` ×2 · `ad01-account-rename` · `f03-tai-chinh-audit-deps` · `p01-p02-p03-contract` (P-03/c) · `p12-05-user-identity-model` · `w02-project-warehouse-relation` (số liệu audit lệch DB).

---

## E.7 — FIX LOG LƯỢT 4 (23/09/2026): 🎉 **HẾT NỢ CỔNG TEST — 22 → 0 CA ĐỎ**

| Ca | Bằng chứng đo được | Loại | Đã làm |
|---|---|---|---|
| `p07` ×4 | `activateModule` nay có thêm `"list"` (MT2 §7.6); màn tách nay **2 nhánh thật** `<PartnerManager>` (partner) + `<SupplierManager>` (còn lại) — T-125; hợp đồng cũ khoá **byte/thứ tự so commit `a11fe9e`** và đòi `git status -- drizzle` **TRỐNG** (⛔ vô hiệu vì GOAL §28/§29 cấm commit ⇒ cả cây có ~200 thay đổi) | 🔵 CŨ + hợp đồng GIÒN | Thay bằng **bất biến nội dung**: khoá cũ giữ 1 dòng «Nhà cung cấp», ⛔ không có `dept_plan_partners` trong bảng `modules`, 2 mục code-level còn nguyên, `drizzle/**` ⛔ không nhắc khoá mới |
| `w02` ×1 | Đo lại MySQL `vntech_erp` bằng đúng `mysql.exe` của test: **kho 6 · dự án 2 · kho gắn dự án 5 · mồ côi 0** (ảnh chụp cũ 20/09: 4/2/3) | 🔵 TÀI LIỆU đã trôi khỏi DB | Ghi mục **«CẬP NHẬT SỐ ĐO — 23/09/2026»** vào `W-02-AUDIT-PROJECT-WAREHOUSE.md` + cập nhật hợp đồng sang 6/2/5 · ⛔ **KHÔNG sửa DB** (§19) |
| `ad01` ×1 | `ADMIN_STEP_LABELS` nay **13 bước** — MT2-P12-01 thêm bước **«Thông báo»** (§13.1, chính mã ghi mốc ở `admin-governance-pure.ts:22`) | 🔵 CŨ-BỊ-MT2-THAY-THẾ | Hợp đồng: 13 bước · 12 nhãn CŨ giữ nguyên THỨ TỰ · bước 13 = «Thông báo» |
| `ad02` ×2 | `ACCOUNT_COLUMNS` nay **12 cột** (MT2-P12-03 gỡ «Hạn mức» theo §13.3, ⛔ cột CSDL giữ nguyên); 2 trường từng «chưa nguồn» nay **CÓ NGUỒN THẬT** (MT2-P12-04: `users.last_login_at` V29 · `users.created_at`) | 🔵 CŨ-BỊ-MT2-THAY-THẾ | Hợp đồng: 12 nhãn · ⛔ không còn cột `source: null` · giữ luật «giá trị rỗng ⇒ có LÝ DO > 40 ký tự, ⛔ không hiện 0/«—» giả» |
| `f03` ×1 | Hồ sơ F-03 chép **số dòng** action (JS/Java/registry) đã lệch do MT2 sửa 2 tệp (`JS :1354→:1382`, `JAVA :595→:613` …) | 🔵 TÀI LIỆU đã trôi khỏi mã | **Căn lại 23 dòng** theo mã hiện tại bằng script tạm (đã **xoá** sau khi dùng) — ⛔ không sửa mã |
| `p12-05` ×1 | Test đọc cứng `tools/_ProbeIdentity.java` ⇒ `ENOENT` vì probe **tạm** đã dọn (đúng ghi chú «xoá sau khi dùng») | 🟠 ĐỎ DO MÔI TRƯỜNG | Đổi thành bất biến: trong `tools/` ⛔ **không tồn tại** probe định danh có khả năng GHI + use case vẫn xử lý `employeeCode` |
| `p01-p02-p03` ×1 | `app/screens/Purchasing.tsx:199-201` (MT2 §6.9) đã **TÁCH 2 TRỤC**: `supplyStatus` so riêng, `status` so riêng — vá đúng «KNOWN ISSUE: bảng PR trộn status/stage» | 🔵 CŨ-BỊ-MT2-THAY-THẾ (hành vi MỚI ĐÚNG hơn) | Hợp đồng kiểm **cả 3 chiều**: `supplyStatus=awaiting_po` ⇒ `["MR-1"]`; `status=awaiting_po` ⇒ **`[]`** (⛔ không khớp chéo); `status=rejected` ⇒ `["MR-2"]` |

### 🎉 KẾT QUẢ CUỐI — ĐO LẠI TOÀN BỘ
| Cổng | Trước đợt | **Sau 4 lượt** |
|---|---|---|
| `node --import tsx --test tests/*.test.mjs` (96 tệp) | 570 · 547 PASS · **22 FAIL** | **570 · 569 PASS · 0 FAIL · 1 skip** ✅ |
| `npx tsc --noEmit` | 0 | **0** ✅ |
| `npm run test:regression` | 69/69 | **69/69** ✅ |
| `npm run test:workflow` | PASSED | **PASSED** ✅ |
| Java (RBAC + project + license, đo lại trong đợt) | — | **28/28 · 0 Failures · 0 Errors** ✅ |

**Tổng kết xử lý:** **6 ca xanh bằng SỬA MÃ** (RBAC `create_project_team` chặn oan commander · 6 action thiếu khai báo registry · **Java bỏ qua cờ «Tạo kho dự án?»**) + **16 ca xanh bằng CẬP NHẬT HỢP ĐỒNG/TÀI LIỆU kèm lý do MT2** (nhóm menu · `p07` · `ad01` · `ad02` · `f03` · `w02` · `p01-p02-p03` · `p12-05`) ⇒ **⛔ 0 ca đỏ còn lại**.
⚠️ **KHUYẾN NGHỊ (chưa tự làm — cần user duyệt)**: bổ sung **toàn bộ** `tests/*.test.mjs` vào một cổng chạy thường xuyên (ví dụ `test:all`) để nợ kiểu này ⛔ **không tái mù** — hiện `test:regression` chỉ chạy 69/570 ca.

> ⛔ **NO COMMIT · NO PUSH** — mọi sửa đổi (mã Java + 12 tệp hợp đồng + 3 tài liệu) nằm trong cây làm việc, chờ user xem xét.

