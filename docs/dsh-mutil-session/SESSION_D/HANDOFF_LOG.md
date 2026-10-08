# HANDOFF_LOG — SESSION_D (ERP-SESSION-04)

## HANDOFF-20261008-D01 — Kết quả audit JOBS & PROJECT + 8 việc sẵn sàng giao

| Trường | Giá trị |
|---|---|
| **HANDOFF_ID** | `HANDOFF-20261008-D01` |
| **DATE** | 2026-10-08 |
| **FROM** | `ERP-SESSION-04` (SESSION_D) |
| **TO** | `ERP-SESSION-01` (chủ `app/page.tsx` + `java-backend/**`) · `ERP-SESSION-02` (chủ `lib/menu-helpers.ts`) · **USER** (quyết định nghiệp vụ) |
| **TASK** | Bàn giao kết quả audit 2 vùng JOBS/PROJECT + danh sách việc đã sẵn sàng thực thi |
| **REASON** | Toàn bộ việc sửa FE của 2 vùng này nằm trong tệp **đang bị 2 phiên kia giữ** ⇒ phiên 04 ⛔ không tự sửa (Goal §7/§19) |

### AFFECTED FILES (nơi CẦN sửa — ⛔ không phải nơi phiên 04 đã sửa)
| # | Tệp | Thuộc | Việc |
|---|---|---|---|
| 1 | `app/page.tsx` | **S01** | **T-02** vá 2 chỗ ngày ISO thô của dự án (P-05) · **T-03** disable + tooltip nút tạo/sửa/xoá dự án (P-01, FE-first) |
| 2 | `java-backend/application/.../rbac/ActionRbacRegistry.java` | **S01** | **T-05** khai module cho `create_project`/`update_project`/`delete_project`/`bulk_import_projects`; xét `set_project_status` (`:282`) + `update_project` capability (`:553` `canUse`→`canEdit`) |
| 3 | `lib/menu-helpers.ts` (+ `app/page.tsx`) | **S02** (+S01) | **T-04** cấp `active` key riêng cho 2 mục «Phòng ban»/«Giao việc» (J-01) · **T-07** ẩn 22 màn phòng ban mỏng (J-02) |
| 4 | 4 tệp mồ côi: `ProjectAggregateTabs.tsx` · `SiteCommandCreateModal.tsx` · `WarehouseCreateModal.tsx` · `TeamManagement.tsx` | **user/S01** | **T-06** quyết A (nối lại) / B (xoá) / C (giữ + ghi chú) — xoá là **phá huỷ** |

### CURRENT STATE (đo được)
- Audit **xong**: `docs/38_AUDIT_JOBS_PROJECT_20261008.md` — 11 phát hiện (**P-01…P-07**, **J-01…J-03**, **X-01/X-02**).
- **P-01** là nghẽn thật: 4 action dự án khai `List.of()` ⇒ **403** với user nghiệp vụ (`RbacService.java:64-83`).
- **P-02**: `set_project_status` module `admin` ⇒ **director không đóng/mở dự án** được.
- **JOBS**: cấu trúc đủ, RBAC đủ, chỉ 3 điểm nhỏ (J-01/J-02/J-03).
- ⛔ Phiên 04 **chưa chạy được** test/UI: shell harness hỏng (`@deepseek-ai/dsh-scope`) ⇒ **P-01/P-02/P-07 mới chỉ chứng minh bằng ĐỌC MÃ**, chưa có phép thử runtime.

### REQUIRED ACTION
1. **USER quyết 5 câu** ở `docs/38` §7 (module nào cho CRUD dự án · ai đóng/mở dự án · 4 tệp mồ côi · "4 thẻ tổng hợp" · ẩn 22 màn phòng ban).
2. **S01** nhận **T-02**, **T-03** (FE) và **T-05** (BE, sau khi user chốt).
3. **S02** nhận **T-04**, **T-07**.
4. **Phiên nào làm** thì chạy `tsc` + `test:regression` + (nếu sửa `lib/**`·`app/**`) **`gd-cycle`** theo luật `D-055`; ⛔ **không commit/push** khi chưa được user cho phép.
5. Khi shell hoạt động lại: chạy **6 phép đo** ở `SESSION_D/TEST_LOG.md` §TEST-...1.1 để **chứng minh runtime** P-01/P-02/P-07/J-01.

### RISK
| Rủi ro | Mức | Ghi chú |
|---|---|---|
| Sửa RBAC dự án theo hướng **mở ra** quá mức | **Cao** | Phải giữ **đối chứng âm**: user không có quyền vẫn phải 403 (bài học MỐC 110 §7) |
| Xoá 4 tệp mồ côi làm mất tính năng `WarehouseCreateModal` (thêm kho cho dự án đã có) | Trung bình | Ưu tiên **C** (giữ + ghi chú) trước khi xoá |
| Sửa 2 tệp bị LOCK khi phiên khác đang sửa ⇒ conflict | **Cao** | Phải **READ lại tệp** trước khi ghi + thông báo trong `SHARED_STATE` |
| Không chạy được test (shell hỏng) mà vẫn báo "đã xác minh" | **Cao** | ⛔ Tuyệt đối không; phiên này ghi rõ **`OPEN`/chưa đo runtime** |

### TEST REQUIRED
- `npx tsc --noEmit` · `npm run test:regression` (mốc nền 865/864/0/1)
- Test mới cho RBAC dự án: user thường ⇒ 403, được cấp module ⇒ 200 (**đối chứng âm bắt buộc**)
- UI: so `h1` sau khi bấm mục menu (⛔ không bấm theo chỉ số)

### STATUS
`OPEN` — chờ user quyết + S01/S02 nhận việc.

---

## 🆕 CẬP NHẬT 08/10/2026 (vòng 52 · `ERP-SESSION-04`) — 3 BÀN GIAO MỚI SAU KHI XONG 7 VIỆC «CÔNG VIỆC»

### HANDOFF-20261008-D05 — `ERP-SESSION-04` → **chủ `java-backend/**`**
| Trường | Nội dung |
|---|---|
| TASK | Bổ sung trạng thái **`REWORK`** («Yêu cầu làm lại») vào backend Java |
| REASON | UI mới (việc 3) có nút **«Yêu cầu làm lại»** gửi `status: "REWORK"`. Node **CÓ** (`scripts/system-route.mjs:260` `TASK_STATUSES`) nhưng **Java THIẾU** (`OpsTaskManagementUseCase.java:23-24` = `NEW·IN_PROGRESS·SUBMITTED·COMPLETED·BLOCKED·WAITING·ON_HOLD·CANCELLED`) ⇒ ⚠️ **sẽ 400 nếu go-live chạy backend Java** |
| AFFECTED_FILES | `java-backend/**/OpsTaskManagementUseCase.java` (+ hợp đồng trạng thái FE↔BE nếu có) |
| CURRENT_STATE | Node: chạy đúng (test Node XANH) · Java: **thiếu giá trị** ⇒ ⛔ chức năng «Yêu cầu làm lại» **chưa dùng được trên đường Java** |
| REQUIRED_ACTION | Thêm `REWORK` vào `TASK_STATUSES` Java + nhánh chuyển trạng thái + (nếu có) thông báo cho người thực hiện; chạy lại bộ test Java |
| RISK | **MEDIUM** — ⛔ không mất dữ liệu, nhưng **chặn 1 nhánh nghiệp vụ** của việc 3 |
| STATUS | `OPEN` (⛔ phiên 04 **không được uỷ quyền** sửa `java-backend/**`) |

### HANDOFF-20261008-D06 — `ERP-SESSION-04` → **chủ `drizzle/**` (migration)**
| Trường | Nội dung |
|---|---|
| TASK | Xử lý **`BUG-D06`**: **40 nhóm TRÙNG SỐ migration** (`0225`→`0315`), tổng **391 file** trong khi chuỗi kỳ vọng **351** (`0000..0350`) |
| REASON | `tools/verify-release.mjs` + `test:release-static` **ĐỎ**: *«Migration chain phải có đúng 351 file (0000..0350), nhận 391»* ⇒ ⛔ **chặn cổng phát hành** |
| AFFECTED_FILES | `drizzle/**` (+ `tools/verify-release.mjs` nếu cần điều chỉnh chuỗi) |
| CURRENT_STATE | `MIGRATION_HEAD` = `0352_phase_gd_workcenter_7_viec_cong_viec_user_08_10_2_identity.sql` (⛔ **2 migration 0351/0352 do `gd-cycle` tự sinh** trong phiên này — **0351/0352 là SỐ MỚI, ⛔ không trùng**) |
| REQUIRED_ACTION | Đổi tên/đánh số lại 40 cặp trùng **theo đúng quy trình** ⚠️ **cảnh báo**: bộ theo dõi `__mep_migrations` khoá theo **TÊN FILE ĐẦY ĐỦ** (`scripts/migrate-postgres.mjs:245,298-300` + `scripts/local-runtime.mjs:142-158`) ⇒ **đổi tên migration ĐÃ ÁP DỤNG sẽ làm nó CHẠY LẠI** ⇒ phải có kế hoạch (bảng đối chiếu tên cũ↔mới) |
| RISK | **HIGH** nếu làm ẩu (chạy lại migration) · ⛔ phiên 04 ⛔ không tự sửa |
| STATUS | `OPEN` |

### HANDOFF-20261008-D07 — `ERP-SESSION-04` → **chủ `app/globals.css` / `app/styles/**`**
| Trường | Nội dung |
|---|---|
| TASK | Xử lý **`BUG-D07`**: **19 class CSS CHẾT** (không nơi nào dùng) |
| REASON | `npm run verify:css-baseline` **ĐỎ** ⇒ chặn cổng |
| AFFECTED_FILES | `app/globals.css`, `app/styles/**` (hoặc chỗ khai báo class) |
| CURRENT_STATE | 19 class: `compact-file` · `filter-control` · `mapping-status-*`×9 · `matching-*`×5 · `material-matching-toolbar` · `material-matching-v2` |
| REQUIRED_ACTION | Xoá class chết **hoặc** đưa vào danh sách miễn trừ **có căn cứ** (⛔ không sửa mù) ⚠️ **sửa `globals.css` ⇒ ĐỔI VÂN TAY** ⇒ **BẮT BUỘC chạy `gd-cycle`** sau đó |
| RISK | **LOW** (cosmetic) nhưng **chặn cổng** |
| STATUS | `OPEN` |

### HANDOFF-20261008-D08 — `ERP-SESSION-04` → **phiên đang sửa `java-backend/**`**
| Trường | Nội dung |
|---|---|
| TASK | Cập nhật **số dòng** trong `docs/agent-progress/F-03-TAI-CHINH-AUDIT-PHU-THUOC.md` (hoặc đổi cổng kiểm) sau khi sửa `SystemController.java` |
| REASON | `F-03` **ĐỎ 23 mục** vì tài liệu ghi số dòng cũ (mtime tài liệu **11:42:52** < **14:29:07** của `SystemController.java`) ⇒ **chặn `npm run test:regression`** cho MỌI phiên |
| AFFECTED_FILES | `docs/agent-progress/F-03-TAI-CHINH-AUDIT-PHU-THUOC.md` · `java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java` · (tuỳ chọn) `tests/f03-tai-chinh-audit-deps.test.mjs` |
| CURRENT_STATE | `git status --porcelain java-backend` = **10 tệp `.java` bị sửa** (⛔ phiên 04 không chạm) · hồi quy `929·927·FAIL 1·1` |
| REQUIRED_ACTION | Cập nhật lại 23 số dòng (hoặc ⭐ **bỏ so số dòng, chỉ so `case "…"` có tồn tại** — số dòng luôn cũ sau mỗi lần sửa mã) |
| RISK | **MEDIUM** — ⛔ không hỏng chức năng, nhưng **mọi phiên đều thấy hồi quy ĐỎ** ⇒ dễ che lỗi thật |
| STATUS | `OPEN` |

### HANDOFF-20261008-D09 — `ERP-SESSION-04` → **`ERP-SESSION-01`** (chủ `app/page.tsx`)
| Trường | Nội dung |
|---|---|
| TASK | Sửa tiêu đề trang `<h1>` của màn **`WorkCenter`** ⇒ hiện **«Công việc»** (thay vì «KPI & hiệu suất nhân viên») |
| REASON | ⭐ **Do «việc 1/hub» gây ra**: mục hub `work_hub` ⛔ không khai `moduleKey` ⇒ `page.tsx` lấy `permissionKeys[0]` XEM ĐƯỢC = `dept_plan_kpi` ⇒ **mọi tab** đều mang tiêu đề KPI (bảng tiêu đề ở `app/page.tsx:133`, `<h1>{title[0]}</h1>` ở dòng ~769) |
| AFFECTED_FILES | `app/page.tsx` (⚠️ **đang bị S01 sửa** — cần đọc tươi ngay trước khi sửa) · (tuỳ chọn) `lib/menu-helpers.ts` nếu muốn khai `moduleKey` cho hub |
| CURRENT_STATE | Mã hub đã chạy; chỉ **tiêu đề** sai ngữ cảnh · bằng chứng: `docs/dsh-mutil-session/SESSION_D/uat-tab7-phongban-todoi.png` |
| REQUIRED_ACTION | Khi `workCenterView !== null` ⇒ đặt tiêu đề «Công việc» (+ phụ đề theo tab). ⚠️ **giữ nguyên** bẫy đã đảo: `if (view === "dashboard") return "dashboard";` phải **đứng TRƯỚC** nhánh `dept_plan_*_tasks` |
| RISK | **LOW** (chỉ chữ hiển thị) — nhưng ⚠️ sửa `page.tsx` khi phiên khác đang ghi ⇒ **nguy cơ mất bản sửa** ⇒ phải đọc tươi + commit nhỏ |
| STATUS | `OPEN` |

### ⭐ CẬP NHẬT `HANDOFF-20261008-D09` — **ĐÃ ĐÓNG: `ERP-SESSION-04` TỰ SỬA (vòng 55)**
- **Lý do tự sửa thay vì chờ S01**: đây là hồi quy **do chính «việc 1/hub» của `ERP-SESSION-04` gây ra** (không phải việc của S01) ⇒ ⭐ **ai gây thì người đó dọn** (§7/§42).
- **Cách làm an toàn đã tuân thủ**: ⛔ không ghi đè cả tệp; chỉ **thay ĐÚNG 2 đoạn** bằng `edit` (S01 cũng sửa theo đoạn) ⇒ ⛔ không làm mất bản sửa của S01.
- **Kết quả**: `tsc` = **0** · `t13` **5/5 PASS** · hồi quy **`930·928·FAIL 1·1`** (1 lỗi = `BUG-D08` của phiên khác).
- ⏳ **Tồn**: chưa **build lại** ⇒ UI chưa thấy tiêu đề mới (cần `gd-cycle` khi mọi phiên dừng sửa).
- **STATUS**: `DONE` (code+test) · **COMPLETED_BY**: `ERP-SESSION-04` · **COMPLETED_AT**: 2026-10-08

---

### 🔴 HANDOFF-20261008-D10 — `ERP-SESSION-04` → **chủ `scripts/**` (Node) + chủ `java-backend/**`**
| Trường | Nội dung |
|---|---|
| TASK | **Thêm thông báo cho NGƯỜI GIAO khi việc chuyển sang `COMPLETED`** (yêu cầu **6c** của user) |
| REASON | ⭐ **ĐÃ ĐO**: `queueTaskNotice` (`scripts/system-route.mjs:277-283`) **chỉ được gọi khi GIAO** (`:293` tạo việc · `:1278` giao lại); handler **`update_work_item_status` (`:1274-1275`)** ⛔ **KHÔNG gọi hàm thông báo nào** ⇒ chuyển `COMPLETED` ⇒ **⛔ không ai được báo**. ⚠️ **Java cũng thiếu** (có mã dán sẵn ở `docs/57 §4.4`) ⇒ **thiếu ở CẢ 2 đường** |
| AFFECTED_FILES | `scripts/system-route.mjs` (nhánh `update_work_item_status`, thêm hàm kiểu `queueCompletionNotice`) · `java-backend/**` (dán `docs/57 §4.4`) |
| CURRENT_STATE | ✅ **6b (báo khi ĐƯỢC GIAO) đã có** (`task_notifications` channel `in_app` + `email_outbox` event `task_assigned`) · 🔴 **6c (báo khi HOÀN THÀNH) ⛔ chưa có** |
| REQUIRED_ACTION | Thêm nhánh `COMPLETED` ⇒ ghi **1 hàng `task_notifications` cho `assigned_by`** + **1 hàng `email_outbox` event `task_completed`**; ⚠️ cân nhắc ⛔ không tự báo khi **người xác nhận chính là người giao**; + **test** (sau «Duyệt xong» phải có hàng thông báo cho người giao) |
| RISK | **HIGH** — thiếu tính năng user yêu cầu; ⛔ không mất dữ liệu |
| STATUS | `OPEN` (⛔ phiên 04 **không được uỷ quyền** sửa `scripts/**`/`java-backend/**`) |
| ⚠️ **ĐÍNH CHÍNH (vòng 65)** | Câu *«Java cũng thiếu»* ở dòng trên là **SAI** ⇒ ⭐ **ĐÃ KIỂM MÃ JAVA**: `OpsTaskManagementUseCase.java:385` **`notifySafely("COMPLETED".equals(next) ? "TASK_COMPLETED" : "TASK_STATUS_CHANGED")`** ⇒ ✅ **Java CÓ** phát thông báo khi `COMPLETED` (theo **cấu hình `notification_configs`**, ⚠️ không cấu hình khớp thì ⛔ không phát ⇒ ⛔ **không đảm bảo đúng người giao**). ⇒ 🔴 **Node ⛔ THIẾU HOÀN TOÀN** (`system-route.mjs:1274-1275`) ⇒ ⭐ **Node KÉM HƠN Java** ⇒ **REQUIRED_ACTION (bản sửa lại)**: ① Node đạt **parity** bằng `notifySafely("TASK_COMPLETED")` ② *(khuyến nghị)* **cả hai** đường ghi thêm **1 hàng `task_notifications` cho `assigned_by`** (⛔ không phụ thuộc cấu hình) ③ ⚠️ cân nhắc ⛔ không tự báo khi người xác nhận chính là người giao ④ **test** (sau «Duyệt xong» ⇒ có thông báo tới `assigned_by`) |

---

### 🔴 HANDOFF-20261008-D11 — `ERP-SESSION-04` → **chủ `drizzle/**` + chủ `tools/gd-cycle.mjs`**
| Trường | Nội dung |
|---|---|
| TASK | **Xử lý `BUG-D06`** — 40 nhóm trùng số migration đang làm **ĐỎ cổng phát hành** (`test:release-static`) |
| REASON | ⭐ **ĐO THẬT**: `393` file · `353` mã số (0000..0352) · **40 nhóm trùng** ⇒ `verify-full-release.mjs:17` throw «phải có đúng 353 file, nhận 393» ⇒ ⚠️ **chặn go-live**. ⚠️ **Nguyên nhân gốc**: **HAI dòng tính năng chạy `gd-cycle` SONG SONG** ⇒ cùng cấp một số kế tiếp (dấu vết đa phiên) |
| AFFECTED_FILES | `scripts/verify-full-release.mjs` (hằng `expectedMigrationCount`) · `tools/gd-cycle.mjs` (cách cấp số) · ⚠️ **(chỉ nếu chọn phương án A)** 40 file `drizzle/*_identity.sql` |
| CURRENT_STATE | 🔴 Cổng phát hành **KHÔNG ĐẠT** · ✅ `FULL W2 SOURCE PREFLIGHT: ĐẠT` · ✅ **40 file trùng là `*_identity.sql` (metadata refresh, ⛔ KHÔNG đổi schema) và IDEMPOTENT** (`DROP … IF EXISTS`/`CREATE`) ⇒ chạy lại **an toàn** · ⚠️ `__mep_migrations` khoá theo **TÊN ĐẦY ĐỦ** (4 nơi) ⇒ **đổi tên file = bị coi là mới = CHẠY LẠI** |
| REQUIRED_ACTION | ⭐ **Thứ tự an toàn (chi tiết + bằng chứng ở `docs/59`)**: **BƯỚC 1 (C)** sửa bộ sinh số `gd-cycle` = **MAX+1** + **lock chống chạy song song** (⛔ dừng sinh thêm trùng) ⇒ **BƯỚC 2 (B)** tách số đếm trong cổng: `schema` vs `*_identity.sql` ⇒ ✅ **cổng xanh mà ⛔ KHÔNG đụng CSDL** ⇒ **BƯỚC 3 (A)** chỉ khi cần mã số duy nhất tuyệt đối: đánh số lại 40 file (đã chứng minh an toàn ✅) |
| RISK | 🔴 **HIGH cho go-live** (cổng phát hành đỏ) · 🟢 Thấp cho dữ liệu (identity idempotent) · ⚠️ Rủi ro của (A): 40 file bị **chạy lại** ở MỌI môi trường |
| STATUS | `OPEN` — ⛔ phiên 04 **không sở hữu** `drizzle/**`/`tools/**` ⇒ **không sửa gì** (chỉ đọc + soạn phác đồ `docs/59`) |
