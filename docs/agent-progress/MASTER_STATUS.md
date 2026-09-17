# MASTER STATUS — VNTECH ERP V5.3.0

> Tệp này là NGUỒN SỰ THẬT về trạng thái toàn cục. Mọi phiên làm việc mới PHẢI đọc tệp này trước.
> Cấu trúc theo GOAL §12. Cập nhật lần cuối: 2026-09-17 (sau **TASK-040 nhóm 1+1b**, commit #47).

## MASTER TASK STATUS

* Master Task: **ERP/MIS SYSTEM AUDIT, REFACTOR & FEATURE UPGRADE (46 mục)** + §2.1/2.2/2.3
* Overall status: **IN PROGRESS** — PHASE 1 (hạ tầng UI dùng chung) chưa xong
* Nguyên tắc: MASTER TASK quyết định PHẢI LÀM GÌ; GOAL quyết định PHẢI LÀM NHƯ THẾ NÀO

## Mốc trạng thái

| Mục | Giá trị |
|---|---|
| CURRENT PHASE | PHASE 1 — hạ tầng UI dùng chung. Song song: hoàn thiện tầng phân quyền Java |
| CURRENT TASK | **TASK-040 nhóm 6** (chờ quyết định) — trong lúc chờ: mở rộng phạm vi audit sang **bản đồ GHI của JS ↔ Java** (tìm tiếp lớp "Java thiếu trường/cột") |
| LAST COMPLETED | **TASK-040 nhóm 3b phần 2 (#54)** — port `import_material_catalog`: nhóm tự tạo từ mã, `system=canonicalMeCode`, thông điệp JS; **vá đường ĐỌC thứ NĂM** (`adminMaterials` thiếu 5 trường); probe **17/17**. Trước đó: **nhóm 3b phần 1 (#52)** · **nhóm 4+5 (#50, #51)** |
| NEXT TASK | Mở rộng audit sang **bản đồ GHI** (`insert`/`update` của JS so với Java theo từng cột) → TASK-034 (gỡ chặn dựng bundle) → render §8.1 → **§8.2** → **§8.3** |
| BLOCKED ITEMS | **TASK-040 nhóm 6** (lệch cấu trúc: `vntech_license_*` cần port cả hệ license + xác minh chữ ký số — thuộc phần **bảo mật** đã yêu cầu tạm hoãn) · **TASK-034** (`npm run build` không dựng lại được UI: dấu vân tay nguồn lệch + bảng identity có **trigger chặn UPDATE** ⇒ phải viết migration) · **TASK-035 mục 7** · **TASK-036 mục 7** · **TASK-037 mục 5** · **TASK-031** · **TASK-032** · **TASK-029** · **TASK-024** · **dữ liệu `user_module_permissions`** · **số SLA thật (24h/8h)** |
| USER CONFIRMATION REQUIRED | **YES** — **11 câu hỏi**, ghi ở mục riêng bên dưới |
| CURRENT BRANCH | `unity` |
| LATEST COMMIT | `d1e0b52` (#47) · **39 commit local CHƯA PUSH** (theo quyết định của người dùng) |

## System State

* **Frontend**: Next 16.2.6 + React 19 + TS 5.9 + Tailwind 4; SSR; gần toàn bộ giao diện trong `app/page.tsx` (~4.140 dòng, 221 hàm — U-11 chưa tách)
* **Backend**: Java Spring Boot 3.5 (target 21, chạy JDK 26), Maven đa module Clean Architecture; `SystemController.java` ~1.481 dòng, 224 nhánh `case` = **186 action thật + 38 tên chỉ mục SQL** (`*_uidx`, chỉ để ánh xạ lỗi unique — **không phải action**)
* **Database**: MySQL 8.0.46; Flyway V1–V16 + drizzle tới `0108`; 121 bảng
* **API**: 2 route (`app/api/system`, `app/api/files`); Java phục vụ **186 action**; JS tham chiếu 174 · Java **không thiếu action nào** · Java có **thêm 12**
* **Tầng Java chỉ phục vụ action GHI** — action ĐỌC do SSR/RSC đảm nhiệm. Đây là lý do phép kiểm quyền sống phải dùng payload rỗng.
* **Infrastructure**: MySQL **3306** · Java API **18081** (PID 37180, background job `pwsh-68`) · Node SSR **8787** · cutover proxy **9000** (người dùng mở `:9000`)
* **JAR**: đã đóng gói lại **thành công** — `vntech-erp-web-0.1.0-SNAPSHOT.jar` **90.888.912 bytes** (17/09 15:48); **mọi sửa đổi backend ĐÃ có hiệu lực lúc chạy**
* **TODO hiện tại**: xem mục CURRENT TODO cuối tệp

## Authentication

* `login` · `setup` · `logout` · `change_password` · `update_profile_avatar` (PUBLIC_ACTIONS)
* `me` và `bootstrap`: **`me` KHÔNG được Java triển khai** (Strangler Fig) — proxy `:9000` định tuyến mọi action sang Java nên `me` trả 400 với admin / 403 với tài khoản thường. **`bootstrap` (GET) chạy tốt** và là đường UI thật sự dùng để nạp toàn bộ dữ liệu.

## Authorization — 4 lớp

1. `requireActionModule` — quyền module cho MỌI action không công khai (PHASE 0B), **mặc định TỪ CHỐI** nếu action chưa khai module
2. `requireRole` / `requireRequireAdmin` — theo vai trò, so bằng **mã ENGINE**; `requireRole` nhận **cả** `role()` và `roleBase()`
3. **PHẠM VI dự án/kho** — `AccessScopeService`; **đã phủ 64/64 action** (cổng `probe-action-scope-parity` 64/64, exit 0)
4. Quy tắc P5.3 (không cấp quyền vượt phòng ban)

### Ngữ nghĩa vai trò (TASK-021, CONFIRMED)

Giá trị phân quyền = `COALESCE(role_catalog.base_role, users.role)` = **mã ENGINE**
(`commander`/`project`/`engineer`/`warehouse`/`procurement`/`accountant`/`team`/`director`), KHÔNG phải mã chuẩn.
Ánh xạ **nhiều-về-một**: `cht→commander` · `da_nv`,`da_truong→project` · `ksda→engineer` ·
`kh_nv`,`kh_truong→procurement` · `thu_kho`,`kho_tong→warehouse` · `thuky`,`hcpc_truong→director`.
Nguồn: `drizzle/0029_v530_erp_permissions_workflow.sql:71-80`.

### Đường ống `roleBase` (TASK-021b + TASK-027)

Use-case dựng `CurrentUser` từ `Principal` **PHẢI** lấy `roleBase` thật qua `Principal.roleBase()`.
Mặc định của interface là `return role()` = **mã chuẩn** ⇒ thiếu override sẽ 403 oan.
**TASK-027 phát hiện 2 nhánh `case` tự dựng lớp vô danh `Principal` tại chỗ (không dùng helper) nên thiếu override** — xem Known Problems #16.

## Workflow

* `WF-MUAHANG` 5 bước tuần tự, mỗi bước cần 1 người duyệt; điều kiện hợp lệ = được gán **HOẶC** role nằm trong `allowed_role_codes` (so **cả** `role` và `baseRole`)
* Dữ liệu: `approval_stage_catalog` 5 bước · `workflow_assignments` 5 dòng · `team_members` **0 dòng** · `approval_stage_decisions` **0 dòng** (mã chết)
* **ĐÃ XÁC ĐỊNH (TASK-035, #40)**: **KHÔNG có version pinning.** Hồ sơ đang pending chỉ lưu `approvalStage` (một con số) — **không** lưu `workflow_id`/`workflow_version`; mọi thuộc tính bước (người duyệt · `approval_mode` · `allowed_role_codes`) được tra **LIVE** tại thời điểm quyết định. ⇒ Admin đổi cấu hình ⇒ **hồ sơ đang chờ đổi theo NGAY**, không giữ bản cũ.
* `workflow_definitions.version` **tồn tại nhưng KHÔNG hoạt động như versioning**: cả `drizzle/0080:46` lẫn MySQL `V8__workflow_multi.sql` đều ràng buộc `UNIQUE (workflow_id, step_no)` — **không có `version`** trong khoá ⇒ không thể tồn tại song song hai phiên bản của cùng một bước. `LIKELY`: tắt/xoá bước đang có hồ sơ chờ ⇒ `allowed` rỗng ⇒ **không ai duyệt được, không có đường thoát**.
* Ba bảng P4 (`workflow_definitions`, `workflow_steps`, `workflow_step_approvers`) là **metadata + màn quản trị**, **không** điều khiển nghiệp vụ phía JS (**0** tham chiếu). Java thì **có** dùng để cấp quyền duyệt (rộng hơn JS) — xếp cùng nhóm quyết định TASK-029.

## Thay đổi trong phiên gần nhất

| Loại | Nội dung |
|---|---|
| DATABASE CHANGES | **Không thêm migration / không đổi lược đồ.** NHƯNG **có sửa DỮ LIỆU CẤU HÌNH bị hỏng**: `email_settings.smtp_port` **1 → 587** · `company_settings.po_sla_hours` **1 → 24** · `bch_confirmation_sla_hours` **1 → 8**. Ba giá trị `1` này do **lỗi port của `save_email_settings` ghi đè** (seed ghi 587; DDL default 24/8; chỉ action đó ghi được 2 cột SLA) ⇒ probe đã đưa về đúng thiết kế. **Cần người dùng xác nhận 24h/8h có đúng nghiệp vụ** (câu hỏi #10) |
| API CHANGES | **Không thêm/bớt action.** Bootstrap Java **thêm 2 khoá** `emailSettings` (chỉ admin, không trả `password`) và `emailRecipients` (chỉ admin) — trước đây **thiếu hẳn** nên UI đọc ra `undefined` |
| WORKFLOW CHANGES | **Không có** |
| PERMISSION CHANGES | **Không đổi quy tắc.** Kiểm chứng §7: `nvdademo` (engine role `project`) gọi `save_email_settings` ⇒ **HTTP 403**; hai khoá bootstrap mới trả `null`/`[]` cho người không phải admin ⇒ không rò rỉ cấu hình SMTP |

## Known Problems

1. **TASK-017 — CÒN MỞ**: cổng ảnh bất định giữa các phiên (0 px · 20 px · 0 px trên cùng một màn). Đã khoanh vùng tới ô tìm kiếm topbar và loại trừ, **chưa ra nguyên nhân gốc**.
2. **Tiến độ áp dụng UI dùng chung**: `StatusBadge` **90** · `ListToolbar` **13** · `DataTable` **0** · `PermissionGuard` **0** · timeline **0** · `EntityDetailModal` **0**. Còn lại: **~100** bảng tự viết · **~100** trạng thái rỗng · **~50** điều kiện quyền · **4** modal · **3** dải timeline.
3. **`/api/files` chưa được bảo vệ** (S-05) — người dùng yêu cầu tạm bỏ qua phần bảo mật.
4. ~~JAR không đóng gói lại được~~ **SAI NAY ĐÃ SỬA** — TASK-B03 DONE. JAR **90.885.239 bytes** (17/09 14:04) đã build và chạy; **mọi sửa đổi backend TỪ TASK-019 trở đi ĐÃ có hiệu lực lúc chạy**.
5. ~~Cổng ảnh + probe UI không chạy được~~ **SAI NAY ĐÃ SỬA** — TASK-B02 DONE. Cổng ảnh **28/28 ĐẠT, 0 px**; riêng probe cần `spawn mysql`/Edge headless vẫn cần mở rộng sandbox (đã xin và chạy được nhiều lần).
6. ~~Lỗ hổng P0 phạm vi: Java mới kiểm 2/64~~ **ĐÃ SỬA Ở TASK-023** — nay **64/64**, cổng `probe-action-scope-parity` 64/64 exit 0.
7. **`team_members` = 0 dòng** ⇒ màn Tổ đội trống; `approval_stage_decisions` = 0 dòng (mã chết).
8. **TASK-029 — Java CHẶT HƠN JS trên 30 action** (chi tiết + tác động ở mục BLOCKED).
9. **Dữ liệu `user_module_permissions` thiếu** — 484/732 dòng; **5 module có 0 dòng**: `boq`, `stocktake`, `inventory`, `teams`, `warehouse_issue`. Đã loại trừ nguyên nhân module/nhóm menu (0 module thiếu, 0 module tắt, 0 nhóm tắt) ⇒ **cấp quyền là đủ**. **`central_warehouse` cũng 0 dòng** ⇒ nhánh kho-central của `canAccessWarehouse` hiện không thể đạt tới vì **dữ liệu**, không phải mã.
10. **Known-problem #15 CŨ ĐÃ ĐÓNG**: tên capability `canView`/`canUse`/… ánh xạ đúng sang cột thật `can_view`/`can_use`/… (`ModulePermissionStoreAdapter:22-24`), mặc định `can_use` khớp JS.
11. **TASK-024 — `isCompanyLeadership` lệch**: JS = tập 7 mã **HOẶC** `base_role='director'`; Java = `{director, accountant}`. Java **cấp thừa** cho `accountant`, **cấp thiếu** cho `thuky`/`hcpc_truong`. Chờ người dùng.
12. ~~TASK-022b — `ACTION_CATALOG` chưa ghi 12 action chỉ có ở Java~~ **ĐÃ ĐÓNG ở #41 — KHÔNG cần sửa**: danh mục có hợp đồng "sinh từ nguồn JS" và đang **đúng** hợp đồng (174 mục, khớp JS 0 lệch); 12 action Java-only đã khai đầy đủ trong bản thi hành `ActionRbacRegistry`. Thêm vào sẽ **tạo sai lệch giả** và phá `probe-action-parity`. Cổng mới: `tools/probe-catalog-drift.mjs` (exit 0).
13. **Sai lệch bản đồ MODULE**: MODULE khớp **156/186**, CAPABILITY khớp **185/186** (`system_level_impact`: JS `canUse` vs Java `canView`).
14. ~~`EntityDetailModal` gây lỗi lint chặn CẢ chuỗi `npm test`~~ **ĐÃ VÁ ở TASK-008 phần 2** — `setState` trong `useEffect` (`react-hooks/set-state-in-effect`) khiến `npm test` dừng ngay ở `lint`, nên `typecheck` + 8 tệp `test:regression` + `test:workflow` **chưa từng chạy**. Nay suy ra tab khi render ⇒ `eslint .` **0 error**, bộ kiểm đã tiến qua `typecheck`.
15. **TASK-031 — cây dự án trong menu bị TẮT ở CẢ HAI nav** (`__site_command_tree_disabled__`, `app/page.tsx:664` và `:678`) ⇒ nhánh `activeSiteProjects.map(...)` là **mã chết**. Sentinel vào ở commit `1c01f39` (16/09) **âm thầm trong một commit không liên quan**, test không được cập nhật. `CONFLICT` — **cần người dùng quyết định**, không tự sửa và **không sửa test cho khớp mã**.
16. **TASK-032 — LỖ HỔNG LIÊN KẾT DỮ LIỆU: 0/16 vai trò trỏ đơn vị mặc định.** `organization_units` có 8 đơn vị đang hoạt động **gồm `BGD` = "Ban giám đốc"**, nhưng `role_catalog.default_organization_unit_id` **null ở mọi vai trò** ⇒ cơ chế "đơn vị mặc định theo vai trò" âm thầm không thể chạy. Lưu ý: **không tệp SQL/Java nào nhắc `default_organization_code`** — đó là tên hiển thị sinh từ JOIN trên `default_organization_unit_id`.
17. ~~Cổng ảnh + `test:regression` không chạy được~~ **ĐÃ RÕ NGUYÊN NHÂN GỐC** — Edge sập khi khởi động: `FATAL:mojo\...\platform_channel.cc:183 Check failed: Access is denied (0x5)` (mojo channel = **named pipe**, sandbox chặn). Node test runner cũng lỗi `spawn EPERM` vì spawn con qua pipe. ⇒ **ràng buộc MÔI TRƯỜNG, không phải lỗi mã**; chạy được khi cấp `danger-full-access`. Chẩn đoán mẫu: `tools/diag-edge-cdp.mjs`. **ĐÃ XÁC NHẬN LẠI ở #47**: chạy `test:regression` có full access ⇒ **59/61 pass** (trước chỉ 58/61 khi bị chặn) — đúng test từng đỏ nay xanh, chứng minh kết luận "dương tính giả do môi trường" là đúng.
18. **TASK-040 nhóm 1 ĐÃ ĐÓNG (#47)** — nhưng khi sửa nhóm này phát hiện **lớp lỗi thứ hai đi kèm lớp SQL**: *port không nguyên trạng* làm **mặc định bị sai âm thầm**. Cụ thể Java kẹp sàn `max(1, …)` **trước** rồi mới so `== 0` ⇒ nhánh mặc định của JS (`|| 587` / `|| 24` / `|| 8`) trở thành **mã chết** ⇒ lưu 1 thay vì 587/24/8. ⇒ **Khi port từ JS, phải đối chiếu cả THỨ TỰ TOÁN HẠNG, không chỉ tên cột.**
19. **Lỗi port đã GHI HỎNG dữ liệu thật** (`smtp_port=1`, `po_sla_hours=1`, `bch_confirmation_sla_hours=1`) — phát hiện vì probe đọc lại DB; đã khôi phục về 587/24/8. Không phải do seed (seed ghi 587, DDL default 24/8). ⇒ **Bài học: "biên dịch sạch" và "HTTP 200" đều KHÔNG chứng minh dữ liệu đúng — phải đối chiếu tầng DB.**
20. **TASK-040 — 3 nhóm còn lại**: nhóm 3b (`import_material_catalog`: UI gửi `categoryCode`, Java đọc `categoryId` ⇒ vật tư nhập vào **mất nhóm**; JS còn tự tạo category/subcategory) và nhóm 6 (`vntech_license_*` — **lệch cấu trúc**, xem mục BLOCKED).
21. **DỮ LIỆU MỒ CÔI (mới, TASK-040 vòng 4)**: `stock_issue_items` **3/5 dòng** trỏ tới `team_id` **không còn tồn tại** (`teams` chỉ có 1 dòng). `findIssueItem` dùng `JOIN teams` (giống y JS) nên các dòng đó bị loại ⇒ `confirm_installation` trả *"Dòng xác nhận lắp đặt không hợp lệ."* **Mã đúng, dữ liệu sai.** Bảng **không có khoá ngoại** nên không gì chặn tham chiếu mồ côi. **KHÔNG tự sửa dữ liệu.**
22. **KHÔNG SUY TÊN ACTION TỪ TÊN PHƯƠNG THỨC** (lỗi của chính tôi ở vòng 4): tôi gọi thử `settle_subcontract` — tên **không tồn tại** — rồi suýt kết luận nhóm 5 là **mã chết**. Tên đúng là **`settle_team_subcontract`** (`SystemController:637`, JS `system-route.mjs:1249`). Bắt được nhờ cổng mới `probe-action-coverage-controller.mjs` báo **0 action thiếu `case`** — mâu thuẫn với kết luận "chưa triển khai".
23. **Cổng đối chiếu với chính các nhánh `case`**: `tools/probe-action-coverage-controller.mjs` → Java phục vụ **224** · JS có mã **174** · UI gọi **119** · **UI gọi mà Java thiếu: 0** · **JS có mã mà Java thiếu: 0** · Java-only **50** (38 tên chỉ mục SQL hợp lệ + 12 action Java-only đã biết). Các cổng cũ chỉ so với danh mục/thanh ghi RBAC, **không** so với nhánh `case` đang phục vụ request.
24. **LỚP LỖI THỨ HAI ĐÃ ĐƯỢC PHỦ CỔNG**: `tools/probe-increment-drift.mjs` săn trường hợp JS **cộng dồn** (`col=col+?`) nhưng Java **ghi đè** (`col=?`) — lớp lỗi mà cổng lược đồ **không thể** bắt. Kết quả: 10 cột JS cộng dồn · **0 ứng viên** trên toàn kho Java, **có đối chứng dương** (`tools/_old-adapter-positive-control.java.txt`).
25. ~~`canonicalMeCode` Java lệch JS~~ **ĐÃ VÁ ở #52**: Java chỉ so **đúng bằng** trong khi JS khớp **tiền tố** ⇒ đo được **7/28 đầu vào lệch** (`Điện lực`, `DIEN123`, `ELV-1`, `PCCC-01`, `DIEN.TU`… bị xếp `KHAC` thay vì đúng hệ M&E) ⇒ **vật tư nhập vào mang `system` sai** (cả nhập BOQ lẫn danh mục vật tư). Nay có `domain/service/MaterialSystemCodes.java` làm **một nguồn sự thật**, `BoqManagementUseCase` uỷ quyền cho nó, kèm **unit test 5 ca** ghi lại đúng 7 ca từng lệch. Cổng đo: `tools/probe-canonical-me-code-drift.mjs`.
26. **Bẫy `(?i)` của Java (lỗi của chính tôi, unit test bắt được)**: `replaceAll("(?i)đ","d")` **KHÔNG** khớp `Đ` — cờ `(?i)` của Java chỉ case-fold ASCII trừ khi bật `UNICODE_CASE` ⇒ mọi đầu vào tiếng Việt rơi về `KHAC`. Phải thay **tường minh** `đ`→`d` và `Đ`→`D` (như `MaterialMatcherV2` đang làm).
27. **TASK-041 — `save_approval_stage` lệch cả HỢP ĐỒNG PAYLOAD lẫn QUY TẮC** (phát hiện bằng cổng mới `tools/probe-write-map-drift.mjs`): Java **bắt buộc trường `code` mà UI không bao giờ gửi** ⇒ action **luôn 400** trước khi tới SQL; cộng thêm **5 trường bị bỏ im lặng** (`description`, `sla_hours`, `approval_mode`, `auto_approve_on_submit`, `sort_order`) ⇒ **admin sửa SLA của bước duyệt, hệ thống báo thành công nhưng SLA KHÔNG đổi**; và **3 quy tắc của JS không được thi hành** (chỉ một bước tự duyệt · chặn đổi số bước khi đã có lịch sử duyệt · chặn tắt bước đang có hồ sơ chờ / tắt bước cuối cùng). Đã đăng ký **TASK-041**, xem `TASK-041.md`. **Chưa sửa** — cần một lượt riêng vì phải đổi hợp đồng payload + ~7 phương thức port + probe có tạo/sửa dữ liệu thật.

## Important Decisions

1. **Không tự suy đoán nghiệp vụ.** Chuỗi audit Code → DB → API → UI → Permission → Workflow → Dữ liệu; phân loại CONFIRMED/LIKELY/UNKNOWN/CONFLICT; gặp UNKNOWN ảnh hưởng DB/logic thì DỪNG và báo.
2. **Không push git** cho tới khi TOÀN BỘ công việc xong VÀ người dùng đã test thủ công (chốt 17/09/2026).
3. **Giữ ảnh chuẩn** `tools/baseline/` (28 PNG) và `tools/_tools/_diff` trong kho mã.
4. **Không viết lại mã đang chạy** khi không cần thiết; ưu tiên tái sử dụng.
5. **Mọi lớp CSS của thư viện dùng chung phải có tiền tố** `vt-`.
6. **Cổng ảnh dùng cơ chế chống lỗi giả**: chụp lại khi lệch, chỉ kết luận LỆCH khi cả hai lần đều vượt ngưỡng.
7. **Không tự đặt chữ mới** trong giao diện — mọi chữ phải lấy nguyên văn từ markup cũ.
8. **Phân quyền so bằng mã ENGINE** (`role_catalog.base_role`), không so bằng mã vai trò chuẩn.
9. **Khi port từ JS sang Java phải port cả NGUỒN DỮ LIỆU**, không chỉ chuỗi so sánh.
10. **Không dùng bảng ánh xạ mã-chuẩn→mã-engine trong Java.** Truyền `roleBase` thật từ `role_catalog` xuống. *(Ngoại lệ có kiểm soát: `requireRole` và `isWarehouseRole` chấp nhận CẢ HAI mã để chống 403 oan — đây là chấp nhận, không phải ánh xạ.)*
11. **Mọi thay đổi tầng vai trò phải chạy `tools/probe-action-role-parity.mjs`.**
12. **Mọi thay đổi tầng phạm vi phải chạy `tools/probe-action-scope-parity.mjs`.**
13. **Nối phạm vi theo LÔ, không ồ ạt** — mỗi lô phải biên dịch sạch và cổng phải chứng minh tiến độ.
14. **Giá trị truyền vào hàm kiểm phạm vi phải là giá trị JS dùng** (thường tra từ DB), không phải tham số thô của payload.
15. **Payload rỗng là cách đo quyền AN TOÀN** trên backend chỉ có action ghi (chốt quyền chạy trước validate) — nhưng phải **loại trừ tường minh** các action nguy hiểm (`factory_reset_*`, `rebuild_department_permissions`, `bulk_import_*`, `install_license_foundation`, `retry_email`, `reorder_*`).
16. **Thông điệp lỗi là dữ liệu chẩn đoán**: phải phân biệt **T1-module** ("chưa được quản trị viên cấp đúng quyền") · **T2-vai trò** ("không có quyền thực hiện nghiệp vụ") · **T3-phạm vi** ("không được … dự án/kho") trước khi buộc tội mã nguồn.
17. **Luôn chuẩn hoá KIỂU trước khi kết luận** — `active` trong payload là **boolean `true`**, không phải số `1`; so `=== 1` từng gây báo động giả 9/9.
18. **Port từ JS sang Java phải đối chiếu cả THỨ TỰ TOÁN HẠNG của biểu thức mặc định**, không chỉ tên cột/bảng. Bằng chứng TASK-040: `Math.max(1, x || 587)` ≠ `Math.max(1, Math.round(x))` rồi mới `if (==0)` — bản Java biến nhánh mặc định thành **mã chết**.
19. **Khi sửa một cặp GHI/ĐỌC, phải kiểm CẢ HAI CHIỀU.** TASK-039 và TASK-040 nhóm 1 đều cho thấy lỗi nằm ở **đường đọc thiếu** (khoá bootstrap không tồn tại) chứ không chỉ ở SQL ghi.
20. **Probe gọi action GHI phải tự chứng minh tính không phá hoại**: sao lưu 2 bảng ra `tools/_backup-*.sql` (đã gitignore), gửi LẠI đúng dữ liệu đang có, chỉ tạo bản ghi tạm rồi xoá, và in ra mọi thay đổi thật.
21. **Probe phải tự nói rõ giới hạn của nó.** `probe-task040-nhom1.mjs` in thẳng dòng *"script KHÔNG tự kiểm DB"* — vì "13/13 ĐẠT" mới chỉ chứng minh tầng HTTP; thiếu bước đối chiếu MySQL là chưa đủ kết luận.
22. **KHÔNG suy tên action từ tên phương thức.** Tên action là **dữ liệu giao kèo** UI ↔ API: phải tra `case "…"` trong `SystemController` hoặc `action === "…"` trong JS. (Bài học vòng 4: `settle_subcontract` không tồn tại ⇒ suýt kết luận sai rằng nhóm 5 là mã chết.)
23. **Với action GHI dữ liệu thật, chứng minh tầng SQL bằng TRANSACTION + ROLLBACK** thay vì tạo/huỷ dữ liệu thật: chạy đúng câu lệnh, đọc kết quả, `ROLLBACK`, rồi khẳng định dữ liệu **nguyên trạng** (`tools/probe-task040-nhom45.sql`). Vẫn phải nói rõ đây **không** phải phép kiểm end-to-end.
24. **Cổng đối chiếu với CHÍNH các nhánh `case` đang phục vụ request** (`probe-action-coverage-controller.mjs`), không chỉ so với danh mục/thanh ghi RBAC — vì một action có thể có SQL + có trong thanh ghi mà **thiếu `case`** ⇒ không bao giờ chạy.
25. **Mọi cổng mới phải có ĐỐI CHỨNG DƯƠNG trên một lỗi đã biết.** Công cụ luôn báo "sạch" thì vô dụng: `probe-increment-drift.mjs` được kiểm bằng tệp chứa nguyên văn câu lệnh cũ (`--extra-file`).

## USER CONFIRMATION REQUIRED (11 câu hỏi)

1. **TASK-029** — 6 action (`save_team_subcontract`, `save_team_production`, `approve_team_production`, `save_team_payment`, `settle_team_subcontract`, `create_project_team`): JS cho phép theo vai trò, Java bắt buộc module `teams` (**0 dòng quyền**) nên **chỉ admin làm được**. Chọn **(A)** khôi phục đúng JS, hay **(B)** giữ Java + nạp đủ dữ liệu quyền module?
2. **Dữ liệu `user_module_permissions`** (484/732; 5 module 0 dòng: `boq`, `stocktake`, `inventory`, `teams`, `warehouse_issue`) — (a) chạy lại cơ chế cấp mặc định theo phòng ban, (b) cấu hình thủ công, hay (c) giữ nguyên?
3. **TASK-024** — `isCompanyLeadership`: giữ `{director, accountant}` hay theo JS (7 mã HOẶC `base_role='director'`)?
4. **TASK-031** — cây dự án trong nhóm **QUẢN LÝ DỰ ÁN** hiện **không hiển thị** danh sách dự án + cây workspace ở **cả desktop và mobile**. Chủ ý (giữ nguyên + cập nhật test) hay tắt nhầm (bật lại)? Hay chỉ muốn một nav có cây?
5. **TASK-032** — (a) có khôi phục `role_catalog.default_organization_unit_id` cho 16 vai trò không (xin xác nhận bảng ánh xạ)? (b) tên vai trò `thuky` chuẩn là **"Thư ký Tổng giám đốc"** (theo test) hay **"Thư ký Tổng giám đốc / Trưởng phòng Hành chính Pháp chế"** (theo dữ liệu đang chạy)?
6. **TASK-034** — cho phép **tái lập dấu vân tay nguồn** để `npm run build` chạy được? Việc này còn phải cập nhật **dòng `vntech_product_identity` trong DB** (vì `local-runtime.mjs:177` ném lỗi nếu lệch) ⇒ **có tác động dữ liệu**. Nếu không làm: bạn test thủ công trên **bundle cũ**.
7. **TASK-035 mục 7** — khi admin đổi cấu hình bước/phân công giữa chừng, hành vi mong muốn: **(A)** giữ bản cũ cho hồ sơ đang chạy (cần version pinning — **thay đổi kiến trúc**) hay **(B)** áp dụng ngay (**đúng hiện tại**)? Và có cần **chặn tắt/xoá** bước đang có hồ sơ chờ (tránh kẹt hồ sơ)?
8. **TASK-036 mục 7** — `required_permission` (quyền cần để làm người duyệt) và `allow_skip_level` (vượt cấp) hiện **không được thi hành ở đâu**: có cần **thi hành** không, hay **gỡ** khỏi lược đồ/payload để tránh bẫy cấu hình về sau?
9. **TASK-037 mục 5** — 3 action quản trị workflow chỉ cần **đăng nhập** + quyền module `admin` (hiện **0 dòng**): **(A)** thêm chặn **vai trò admin** cho nhất quán, hay **(B)** giữ nguyên (coi quản trị workflow là một quyền module — đúng thiết kế)?
10. **Số SLA thật của nghiệp vụ** — lỗi port TASK-040 đã ghi đè `po_sla_hours=1` và `bch_confirmation_sla_hours=1` vào DB thật; probe đã khôi phục về **mặc định do mã JS quy định là 24 giờ (PO)** và **8 giờ (BCH)**. Đây là *mặc định của mã*, **không phải con số nghiệp vụ do bạn công bố**. Hỏi: **24h/8h có đúng không**, hay SLA thật khác để tôi ghi lại đúng? (Nếu khác, sửa qua giao diện Quản trị → Cấu hình email.)
11. **TASK-040 nhóm 6 — hệ license lệch CẤU TRÚC** giữa Java và JS. UI gửi `{licenseEnvelope}` (chuỗi JSON) và JS **xác minh chữ ký số** (`verifyLicenseEnvelope` với public key) rồi ghi theo `claims`; Java lại nhận `licenseKey/companyName/edition` và ghi **6 cột không tồn tại** trong `vntech_license_installations`. Không có cột nào để ánh xạ `edition`/`license_key` ⇒ ánh xạ sẽ là **bịa nghiệp vụ**. Hỏi: **(A)** port đầy đủ hệ license + xác minh chữ ký (thuộc phần bảo mật bạn đã yêu cầu tạm hoãn), hay **(B)** giữ nguyên trạng thái hỏng (HTTP 500) và ghi vào roadmap, hay **(C)** tạm **gỡ** 2 action này khỏi danh mục để người dùng không bấm vào chỗ hỏng?

## CURRENT TODO

* [x] TASK-025 · Sửa `SlaComplianceWorker` hỏng âm thầm mỗi giờ (cột `overdue_at` không tồn tại) — #34
* [x] **TASK-040 nhóm 1+1b · `save_email_settings`** — #47: SQL sai 3 cột ⇒ 500; bootstrap **thiếu 2 khoá đọc**; **4 mặc định JS bị port sai**; khôi phục dữ liệu `smtp_port=587`/`po_sla=24`/`bch_sla=8`. Probe **13/13** · authz **9/9** · regression **59/61**
* [x] **TASK-040 nhóm 2 · `level_rank`** — **ĐÓNG: DƯƠNG TÍNH GIẢ.** Công cụ của tôi bỏ sót `CHANGE COLUMN` nên tố oan `UserAdminStoreAdapter`; DB đang chạy **đúng là `level_rank`**. Đã vá công cụ + thêm cổng đối chiếu lược đồ đang chạy.
* [x] **TASK-040 nhóm 3 · `material_norms` + `materials`** — #49: SQL 6 cột + hợp đồng payload + nghiệp vụ + **đường ĐỌC thiếu `source_type`**; probe **25/25**
* [x] **TASK-040 nhóm 4 · `confirm_installation`** — #50: bỏ cột `status` không tồn tại + **sửa lỗi NGỮ NGHĨA ghi đè → cộng dồn**; SQL chứng minh bằng transaction + ROLLBACK; HTTP **9/9**
* [x] **TASK-040 nhóm 5 · `settle_team_subcontract`** — #50: bỏ `settlement_id`/`settled_at`; probe HTTP **9/9**
* [x] **TASK-040 nhóm 3b phần 2** · port thân `import_material_catalog` — #54: nhóm tự tạo từ mã, `system=canonicalMeCode`, thông điệp JS; **vá đường ĐỌC thứ NĂM** (`adminMaterials` thiếu `specification`/`brand`/`minStock`/`requiresCocq`/mã-tên nhóm); probe **17/17**
* [x] **`canonicalMeCode` gom về một nguồn** — #52: vá **7/28 đầu vào lệch** với JS; unit test **5/5** · domain **19/19**
* [ ] **TASK-041** · `save_approval_stage` + `set_approval_stage_status` — **sai hợp đồng payload** (Java đòi `code` UI không gửi ⇒ luôn 400) + **5 trường bị bỏ im lặng** (SLA!) + **3 quy tắc JS không thi hành**. Chi tiết + kế hoạch: `docs/agent-progress/TASK-041.md`
* [ ] **Mở rộng audit sang BẢN ĐỒ GHI** — cổng `tools/probe-write-map-drift.mjs` đã có; 17 bảng lệch, mới rà kỹ `approval_stage_catalog` (⇒ TASK-041). **Còn 16 bảng cần đọc tiếp**, đáng nghi: `material_subcategories` (`adjustment_note`/`review_status`/`scope_examples`), `project_archives.purge_audit_id`
* [!] **TASK-040 nhóm 6 · CHỜ QUYẾT ĐỊNH** — `vntech_license_*` lệch **cấu trúc** (câu hỏi #11)
* [x] **Cổng mới**: `probe-java-sql-live.mjs` (lược đồ đang chạy) · `probe-schema-drift.mjs` (tệp migration ↔ DB: **0 lệch**) · `probe-increment-drift.mjs` (SET vs cộng dồn, **có đối chứng dương**) · `probe-action-coverage-controller.mjs` (UI ↔ nhánh `case`: **0 thiếu**) · `show-js-lines.mjs`
* [!] **DỮ LIỆU MỒ CÔI** — `stock_issue_items` 3/5 dòng trỏ tới tổ đội không tồn tại (known issue #21) — **KHÔNG tự sửa dữ liệu**
* [!] **SỐ SLA THẬT · CHỜ XÁC NHẬN** — 24h (PO) / 8h (BCH) là mặc định của mã JS, không phải con số nghiệp vụ do người dùng công bố (câu hỏi #10)
* [x] TASK-027 · Kiểm chứng SỐNG bằng tài khoản thật; vá **2 lỗi P0** — #35
* [x] TASK-030 · 43 ca chặn tầng module là **ĐÚNG DỮ LIỆU** — #36
* [!] **TASK-008 phần 2 · Quét hồi quy rộng** — **DONE** (#38): vá lỗi lint chặn cả chuỗi `npm test`; cổng ảnh ĐẠT 28/28 · 0 px; `test:regression` 61 test / 58 PASS; 3 test đỏ **đã phân loại**; tìm ra nguyên nhân gốc rào cản cổng ảnh
* [!] **TASK-031 · CHỜ QUYẾT ĐỊNH** — cây dự án trong menu bị tắt ở cả hai nav
* [!] **TASK-032 · CHỜ QUYẾT ĐỊNH** — 0/16 vai trò trỏ đơn vị mặc định (lỗ hổng liên kết dữ liệu)
* [ ] ~~TASK-022b · Bổ sung 12 action chỉ có ở Java vào `ACTION_CATALOG`~~ **ĐÓNG — KHÔNG cần sửa** (#41): danh mục có hợp đồng "sinh từ nguồn JS" và đang đúng hợp đồng (174 mục, khớp JS 0 lệch); 12 action Java-only đã khai đầy đủ trong bản thi hành. Thêm vào sẽ phá `probe-action-parity`. Cổng mới: `tools/probe-catalog-drift.mjs`
* [ ] TASK-009 · U-09 đợt 6 — 13 màn còn lại
* [ ] TASK-010/011/012/013 · Áp dụng `EntityDetailModal` / `DataTable` / `PermissionGuard` / `ApprovalTimeline`
* [ ] TASK-014 · U-11 — tách `page.tsx`
* [ ] TASK-015 · U-12 — loại `!important` + gộp selector trùng
* [ ] TASK-017 · nguyên nhân gốc cổng ảnh bất định
* [ ] **MASTER TASK §2.1** · timeline luồng duyệt phiếu đề nghị mua hàng
* [ ] **MASTER TASK §2.2** · modal "Tổng hợp giao nhận về phiếu đề nghị gốc"
* [ ] **MASTER TASK §2.3** · responsive ảnh/hồ sơ vật tư đặc thù
* [ ] Đóng gói lại UI bundle trước khi người dùng test thủ công
* [!] TASK-024 · CHỜ QUYẾT ĐỊNH `isCompanyLeadership`
* [!] TASK-029 · CHỜ QUYẾT ĐỊNH mức chặt module

## CONTINUATION NOTES (cho phiên sau)

1. **Đọc theo thứ tự**: tệp này → `TASK_INDEX.md` → `TASK-040.md` (mục 13 = nhóm 1+1b) → `TASK-039.md` → `TASK-030.md`.
2. **KHÔNG chạy lại** các việc đã DONE: TASK-B01/B02/B03, TASK-025, TASK-027, TASK-030, **TASK-040 nhóm 1+1b**.
3. **Chốt quyền ở tầng Java nằm ở ĐẦU mỗi nhánh `case`, TRƯỚC validate** — nhờ vậy payload rỗng đo được CHO/CHẶN mà không ghi dữ liệu.
4. **18 khối `Principal` vô danh** trong `SystemController`; **đã rà toàn bộ**: chỉ 2 khối của `RequestManagement` từng nguy hiểm và đã vá. Nếu thêm nhánh `case` mới có tạo lớp vô danh thì **phải override `roleBase()`** — hoặc tốt hơn là dùng helper `asXxxPrincipal(cu)`.
5. **Trước khi buộc tội mã nguồn**, hãy phân loại 403 theo 3 tầng (quyết định #16) và đối chiếu dữ liệu (`tools/probe-module-permission-data.mjs`).
6. **Java API phải chạy bằng background job**; **TUYỆT ĐỐI KHÔNG** `Start-Process` (tiến trình chết theo cửa sổ) và **KHÔNG** `Stop-Process node`. Chỉ dừng đúng PID đang giữ cổng 18081 trước khi `mvn package`.
7. **Đóng gói**: `JAVA_HOME=C:\Users\PC\.jdks\openjdk-26.0.2.1`; maven wrapper `apache-maven-3.9.16`; `java-backend/.mvn/maven.config` chứa `-Dmaven.repo.local=<workspace>\_m2-repo` (PowerShell làm hỏng `-D` vì đường dẫn có dấu cách). Fat jar phải ≈ **90 MB**; 68 KB nghĩa là `repackage` thất bại.
8. **Thứ tự chẩn đoán**: 4 cổng → `/actuator/health` → `tools/probe-live-stack.mjs` → cổng ảnh.
9. **Vá TASK-040 theo nhóm — quy trình 5 bước bắt buộc** (đúc từ nhóm 1): (1) đọc SQL tương ứng của JS; (2) sửa Java theo JS **kể cả thứ tự toán hạng của mặc định**; (3) **kiểm cả đường ĐỌC** (khoá bootstrap có tồn tại không, tên khoá UI dùng là gì); (4) build lại jar + khởi động lại + gọi thật + **đối chiếu MySQL** (không chỉ HTTP 200); (5) chạy `probe-java-sql-schema.mjs` lại để chắc không còn cột sai.
10. **Jar đang chạy**: nếu sửa mã Java mà KHÔNG build lại + khởi động lại thì mọi probe sẽ đo **bản cũ** — PID hiện tại **2872** (job `pwsh-64`) đang chạy jar có nhóm 1+1b, 3, 4, 5. Trước khi `mvn package` phải dừng **đúng PID đang giữ cổng 18081**.
11. **Bốn cổng phải chạy trước khi kết luận về SQL/ngữ nghĩa** (đúc từ TASK-040): `probe-java-sql-live.mjs` (cột có tồn tại?) → `probe-increment-drift.mjs` (ghi đúng cách?) → đọc lại qua bootstrap (**đường ĐỌC có không?**) → `probe-action-coverage-controller.mjs` (action có `case` không?). Thiếu một cổng là còn một lớp lỗi không nhìn thấy.
12. **Khi chứng minh action GHI**: dùng `transaction + ROLLBACK` cho tầng SQL và chỉ gọi HTTP vào các **nhánh chặn**; luôn ghi rõ giới hạn "chưa test end-to-end".
