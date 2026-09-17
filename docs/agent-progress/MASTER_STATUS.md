# MASTER STATUS — VNTECH ERP V5.3.0

> Tệp này là NGUỒN SỰ THẬT về trạng thái toàn cục. Mọi phiên làm việc mới PHẢI đọc tệp này trước.

## Current Master Task

* Master Task: MASTER TASK — ERP/MIS SYSTEM AUDIT, REFACTOR & FEATURE UPGRADE (46 mục)
* Overall status: **IN PROGRESS** — PHASE 1 chưa xong
* Current phase: PHASE 1 — HẠ TẦNG UI DÙNG CHUNG. Song song: hoàn thiện tầng phân quyền phía Java (P0/P1)
* Current task: **TASK-023 (IN PROGRESS)** — kiểm PHẠM VI dự án/kho. Đã nối **47/64** action (**KHO, MUA HÀNG, SẢN LƯỢNG, BOQ đã phủ hết**); **còn 17** (Finance 7, OpsTask 3, ProjectContract 3, Request 2, AdminOps 1, AdminSystem 1)
* Last completed task: TASK-022 + TASK-021b (#23) — thắt 5 cổng vai trò và sửa hồi quy đường ống `roleBase`. Trước đó: TASK-021 (#22) · TASK-020 (#21)
* Next task: TASK-023 lô 2 — nối phạm vi cho `StockManagementUseCase` (13 action có kiểm cả kho)
* Blocked task: TASK-B02 (sandbox chặn Edge headless) · **TASK-B03 (mvn chặn ghi `.m2` ⇒ JAR chưa đóng gói lại)** · TASK-B01 (tên màn Receiving — KHÔNG chặn tiến độ)
* User confirmation required: **YES** — 3 việc: (1) tên hiển thị màn `Receiving` (GIAO NHẬN) lấy từ menu; (2) **cho phép mở rộng sandbox** để chạy cổng ảnh + bộ probe (TASK-B02); (3) **quyết định về `isCompanyLeadership`** (TASK-024)
* Last updated: 2026-09-18 (sau TASK-023 lô 1 — PARTIAL)

## System State

* **Frontend**: Next 16.2.6 + React 19 + TS 5.9 + Tailwind 4; UI render SSR; toàn bộ giao diện nằm trong `app/page.tsx` (4.140+ dòng, 221 hàm top-level — U-11 chưa tách)
* **Backend**: Java Spring Boot 3.5 (target Java 21), Maven đa module Clean Architecture; `SystemController.java` 1.457 dòng, 224 nhánh `case` = **186 action thật + 38 tên chỉ mục SQL**
* **Database**: MySQL 8.0.46; Flyway V1–V16 + drizzle tới `0108`; 121 bảng
* **API**: chỉ 2 route ngoài action (`app/api/system`, `app/api/files`); 186 action trong SystemController; JS tham chiếu 174 · Java **không thiếu action nào** · Java có **thêm 12 action** (đã đính chính ở TASK-018)
* **Authentication**: `login` · `setup` · `logout` · `change_password` · `update_profile_avatar` (PUBLIC_ACTIONS)
* **Authorization — 4 lớp**:
  1. `requireActionModule` — quyền module cho MỌI action không công khai (PHASE 0B).
  2. `requireRole` / `requireRequireAdmin` — theo vai trò, so bằng **mã ENGINE**.
  3. **PHẠM VI dự án/kho** — `AccessScopeService` (`accessScope.requireProjectAccess` / `requireWarehouseAccess`). **Mới có hạ tầng; mới nối 2/64 action.**
  4. Quy tắc P5.3 (không cấp quyền vượt phòng ban).
* **Authorization — NGỮ NGHĨA VAI TRÒ (TASK-021)**: giá trị phân quyền là `COALESCE(role_catalog.base_role, users.role)` = **mã ENGINE** (`commander`/`project`/`engineer`/`warehouse`/`procurement`/`accountant`/`team`/`director`), KHÔNG phải mã chuẩn. Ánh xạ **nhiều-về-một**.
* **Authorization — ĐƯỜNG ỐNG roleBase (TASK-021b)**: use-case dựng `CurrentUser` từ `Principal` PHẢI lấy `roleBase` thật qua `Principal.roleBase()`; nếu không sẽ 403 oan cho mọi tài khoản không phải admin.
* **Workflow**: `WF-MUAHANG` 5 bước tuần tự, mỗi bước cần 1 người duyệt; điều kiện hợp lệ = được gán HOẶC role nằm trong `allowed_role_codes` (so **cả** `role` và `baseRole`)
* **Infrastructure/server**: MySQL **3306** · Java API **18081** · Node SSR **8787** · cutover proxy **9000** (người dùng mở :9000)
* **Tests**: 14 probe hồi quy + cổng ảnh 28 ảnh + `tsc` + eslint; **mới**: `probe-role-code-scan.mjs`, `probe-action-role-parity.mjs`, `probe-action-scope-parity.mjs`, `patch-role-engine-codes.mjs`, `patch-task021b-022.mjs`, `patch-adminops-rolebase.mjs`, `patch-task023-batch1.mjs`, `verify-java-compile.ps1`
* **HẠN CHẾ HIỆN TẠI**: cổng ảnh và các probe UI KHÔNG chạy được (cần mở rộng sandbox cho Edge headless — TASK-B02). JAR Java KHÔNG đóng gói lại được (TASK-B03) ⇒ **mọi sửa đổi backend chưa có hiệu lực lúc chạy**.

## Important Decisions

1. **Không tự suy đoán nghiệp vụ.** Chuỗi audit: Code → DB → API → UI → Permission → Workflow → Dữ liệu hiện có; phân loại CONFIRMED/LIKELY/UNKNOWN/CONFLICT; gặp UNKNOWN ảnh hưởng DB/logic thì DỪNG và báo.
2. **Không push git** cho tới khi TOÀN BỘ công việc xong VÀ người dùng đã test thủ công (chốt 17/09/2026).
3. **Giữ ảnh chuẩn** `tools/baseline/` (28 PNG) và `tools/_tools/_diff` trong kho mã.
4. **Không viết lại mã đang chạy** khi không cần thiết; ưu tiên tái sử dụng.
5. **Mọi lớp CSS của thư viện dùng chung phải có tiền tố** `vt-`.
6. **Cổng ảnh dùng cơ chế chống lỗi giả**: chụp lại khi lệch, chỉ kết luận LỆCH khi cả hai lần đều vượt ngưỡng.
7. **Không tự đặt chữ mới** trong giao diện — mọi chữ phải lấy nguyên văn từ markup cũ.
8. **Phân quyền so bằng mã ENGINE** (`role_catalog.base_role`), không so bằng mã vai trò chuẩn.
9. **Khi port từ JS sang Java phải port cả NGUỒN DỮ LIỆU, không chỉ chuỗi so sánh.**
10. **Không dùng bảng ánh xạ mã-chuẩn→mã-engine trong Java.** Truyền `roleBase` thật từ `role_catalog` xuống.
11. **Mọi thay đổi tầng vai trò phải chạy `tools/probe-action-role-parity.mjs`** (kiểm cả đối chiếu JS↔Java **và** đường ống `roleBase`).
12. **Mọi thay đổi tầng phạm vi phải chạy `tools/probe-action-scope-parity.mjs`** — cổng đo tiến độ nối phạm vi.
13. **Nối phạm vi theo LÔ, không ồ ạt**: mỗi lô phải biên dịch sạch và cổng phải chứng minh tiến độ (bài học: vừa rồi nối 4 use-case một lượt đã tạo hồi quy ở lượt trước).
14. **Giá trị truyền vào hàm kiểm phạm vi phải là giá trị JS dùng** (thường tra từ DB), không phải tham số thô của payload.

## Known Problems

1. **Điều tra CÒN MỞ** — cổng ảnh bất định giữa các phiên (0 px · 20 px · 0 px trên cùng một màn). Đã khoanh vùng tới ô tìm kiếm topbar và loại trừ, **chưa tìm ra nguyên nhân gốc**.
2. **Roadmap từng báo quá** — đã sửa và tách thành U-14…U-17. **Tiến độ áp dụng**: `StatusBadge` **90** · `ListToolbar` **13** · `DataTable` **0** · `PermissionGuard` **0** · timeline **0** · `EntityDetailModal` **0**. Còn lại: **100** bảng tự viết · **100** trạng thái rỗng · **50** điều kiện quyền · **4** modal · **3** dải timeline.
3. **`/api/files` chưa được bảo vệ** (S-05) — người dùng yêu cầu tạm bỏ qua phần bảo mật.
4. ~~5 lỗi mã vai trò trong `ProductionManagementUseCase`~~ **ĐÃ SỬA ở TASK-019, HOÀN THIỆN ở TASK-021**.
5. **`team_members` = 0 dòng** ⇒ màn Tổ đội trống; **`approval_stage_decisions` = 0 dòng** (mã chết).
6. ~~3 lỗi eslint `react-hooks/static-components`~~ **ĐÃ SỬA ở TASK-016**.
7. **Cổng ảnh + probe UI không chạy được** (TASK-B02) — rào cản lớn nhất cho mọi việc UI tiếp theo.
8. ~~`ACTION_CATALOG.json` lệch ~50 action~~ **ĐÍNH CHÍNH Ở TASK-018 — cáo buộc này SAI**.
9. **JAR Java CHƯA đóng gói lại** (TASK-B03) — mọi sửa đổi backend (TASK-019 → 023) **chưa có hiệu lực lúc chạy**; mới kiểm chứng ở mức mã nguồn + biên dịch (`verify-java-compile.ps1`: 102 tệp · 0 lỗi · 156 `.class`).
10. **LỖ HỔNG P0 ĐANG TỒN TẠI — PHẠM VI dự án/kho (TASK-023)**: JS kiểm phạm vi ở **64 action**, Java mới kiểm **2** (đo bằng `tools/probe-action-scope-parity.mjs`). **62 action còn lại vẫn cho phép thao tác trên dự án/kho ngoài phạm vi** nếu tài khoản có quyền module. Hạ tầng đã xong; việc còn lại là nối dần.
11. **`isCompanyLeadership` lệch** (TASK-024) — JS = tập 7 mã HOẶC `base_role==='director'`; Java = `{director, accountant}`. Java **cấp thừa** cho `accountant`, **cấp thiếu** cho `thuky`/`hcpc_truong`. Chờ người dùng quyết định.
12. ~~Vài action Java thiếu `requireRole`~~ **ĐÃ SỬA ở TASK-022** — cổng `probe-action-role-parity` **exit 0**.
13. **Hồi quy TASK-021 đã được sửa ở TASK-021b** — bài học: thêm lớp kiểm mới mà không kiểm **đường ống dữ liệu** nuôi nó thì tạo lỗi nặng hơn lỗi gốc.
14. **`Principal` chưa mang `warehouseScopeKind`** — nhánh kho của `canAccessWarehouse` cần giá trị này; hiện `CurrentUser` có nhưng `Principal` thì không. Phải bổ sung (theo đúng cách đã làm với `roleBase` ở TASK-021b) trước khi nối các action có kiểm kho.
15. **Chưa kiểm chứng tên capability** `canUse`/`canView` mà nhánh kho-central của `AccessScopeService` dùng có khớp dữ liệu thật trong `user_module_permissions` hay không.

## Current TODO

* [x] TASK-021 · Sửa GỐC ngữ nghĩa vai trò (`roleBase` từ `role_catalog`, `requireRole` nhận mã engine) — docs/28
* [x] TASK-021b · Sửa hồi quy đường ống `roleBase` — `default roleBase()` trên `Principal` + controller truyền giá trị thật
* [x] TASK-022 · Thắt 5 cổng vai trò còn hở; cổng `probe-action-role-parity` **exit 0**
* [~] **TASK-023 · Kiểm PHẠM VI dự án/kho — IN PROGRESS, 2/64; còn 62.** Lô 1 xong: hạ tầng `AccessScopeService` + port `AccessScopeStore` + `cancel_request`
* [~] TASK-008 · U-09 đợt 5 — code xong, probe riêng 11/11 ĐẠT (`96c3aa8`, PARTIAL); còn lượt quét hồi quy rộng (chờ quyền)
* [!] TASK-024 · CHỜ QUYẾT ĐỊNH: lệch `isCompanyLeadership`
* [ ] TASK-009 · U-09 đợt 6 — 13 màn còn lại
* [ ] TASK-010 · U-14 — ÁP DỤNG EntityDetailModal
* [ ] TASK-011 · U-15 — ÁP DỤNG DataTable
* [ ] TASK-012 · U-16 — ÁP DỤNG PermissionGuard
* [ ] TASK-013 · U-17 — ÁP DỤNG Approval/ActivityTimeline
* [ ] TASK-014 · U-11 — Tách `page.tsx` thành module theo màn hình
* [ ] TASK-015 · U-12 — Loại `!important` + gộp selector trùng lặp CSS
* [ ] TASK-017 · Điều tra còn mở — nguyên nhân gốc bất định của cổng ảnh
* [!] TASK-B03 · CHẶN: không đóng gói lại được JAR Java (mvn chặn ghi `.m2`)
* [!] TASK-B02 · CHẶN: cổng ảnh + probe UI không chạy được
* [!] TASK-B01 — CHỜ XÁC NHẬN: tên màn Receiving

## PHASE 2–10 (theo docs/25_TODO_ROADMAP.md)

Chưa bắt đầu. Ngoài ra MASTER TASK còn 3 mục **chưa bắt đầu**: §2.1 timeline duyệt phiếu đề nghị mua hàng · §2.2 modal "Tổng hợp giao nhận về phiếu đề nghị gốc" · §2.3 responsive ảnh/hồ sơ vật tư đặc thù.
