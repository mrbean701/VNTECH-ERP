# MASTER STATUS — VNTECH ERP V5.3.0

> Tệp này là NGUỒN SỰ THẬT về trạng thái toàn cục. Mọi phiên làm việc mới PHẢI đọc tệp này trước.

## Current Master Task

* Master Task: MASTER TASK — ERP/MIS SYSTEM AUDIT, REFACTOR & FEATURE UPGRADE (46 mục)
* Overall status: **IN PROGRESS** — PHASE 1 chưa xong
* Current phase: PHASE 1 — HẠ TẦNG UI DÙNG CHUNG (chiếm phần lớn khối lượng còn lại)
* Current task: TASK-022 — rà soát action Java thiếu `requireRole` so với JS (không phụ thuộc sandbox)
* Last completed task: TASK-021 — sửa **GỐC** ngữ nghĩa vai trò (`roleBase` từ `role_catalog` + `requireRole` nhận mã engine + 13 điểm gọi). Trước đó: TASK-020 (#21) · TASK-019 (#19) · TASK-018 (#18) · TASK-016 (#17)
* Next task: TASK-022 → TASK-023 → (TASK-024 chờ người dùng quyết định)
* Blocked task: TASK-B02 (sandbox chặn Edge headless) · **TASK-B03 (mvn chặn ghi `.m2` ⇒ JAR chưa đóng gói lại)** · TASK-B01 (tên màn Receiving — KHÔNG chặn tiến độ)
* User confirmation required: **YES** — 3 việc: (1) tên hiển thị màn `Receiving` (GIAO NHẬN) lấy từ menu; (2) **cho phép mở rộng sandbox** để chạy cổng ảnh + bộ probe (TASK-B02); (3) **quyết định về `isCompanyLeadership`** (TASK-024) — JS cấp quyền lãnh đạo cho `thuky`/`hcpc_truong` (base_role `director`) nhưng **không** cấp cho `accountant`, Java đang làm ngược lại cả hai chiều
* Last updated: 2026-09-18 (sau TASK-021)

## System State

* **Frontend**: Next 16.2.6 + React 19 + TS 5.9 + Tailwind 4; UI render SSR; toàn bộ giao diện nằm trong `app/page.tsx` (4.140+ dòng, 221 hàm top-level — U-11 chưa tách)
* **Backend**: Java Spring Boot 3.5 (target Java 21), Maven đa module Clean Architecture; `SystemController.java` 1.437 dòng, 224 nhánh `case` = **186 action thật + 38 tên chỉ mục SQL**
* **Database**: MySQL 8.0.46; Flyway V1–V16 + drizzle tới `0108`; 121 bảng
* **API**: chỉ 2 route ngoài action (`app/api/system`, `app/api/files`); 186 action trong SystemController; JS tham chiếu 174 · Java **không thiếu action nào** · Java có **thêm 12 action** (đã đính chính ở TASK-018)
* **Authentication**: `login` · `setup` · `logout` · `change_password` · `update_profile_avatar` (PUBLIC_ACTIONS)
* **Authorization**: 3 lớp — `admin` → tất cả; `isCompanyLeadership` = {director, accountant} → tất cả trừ admin; còn lại cần `user_module_permissions.can_<cap>=1`; kèm quy tắc P5.3 (không cấp quyền vượt phòng ban)
* **Authorization — NGỮ NGHĨA VAI TRÒ (TASK-021)**: giá trị dùng để phân quyền là `COALESCE(role_catalog.base_role, users.role)` = **mã ENGINE** (`commander`/`project`/`engineer`/`warehouse`/`procurement`/`accountant`/`team`/`director`), KHÔNG phải mã chuẩn (`cht`/`da_nv`/`ksda`/`thu_kho`/`kh_nv`). Ánh xạ là **nhiều-về-một**. Mọi so sánh vai trò phải đi qua giá trị này.
* **Workflow**: `WF-MUAHANG` 5 bước tuần tự, mỗi bước cần 1 người duyệt; điều kiện hợp lệ = được gán HOẶC role nằm trong `allowed_role_codes` (so **cả** `role` và `baseRole` — đã đúng từ trước)
* **Infrastructure/server**: MySQL **3306** · Java API **18081** · Node SSR **8787** · cutover proxy **9000** (người dùng mở :9000)
* **Tests**: 14 probe hồi quy + cổng ảnh 28 ảnh (7 màn × 4 kích thước) + `tsc` + eslint; **mới**: `tools/probe-role-code-scan.mjs`, `tools/patch-role-engine-codes.mjs`, `tools/verify-java-compile.ps1` (kiểm chứng biên dịch khi Maven bị chặn)
* **HẠN CHẾ HIỆN TẠI**: cổng ảnh và các probe KHÔNG chạy được vì cần mở rộng sandbox để khởi động Edge headless (named pipe); yêu cầu mở rộng quyền đã bị huỷ (xem TASK-B02). JAR Java KHÔNG đóng gói lại được (TASK-B03).

## Important Decisions

1. **Không tự suy đoán nghiệp vụ.** Chuỗi audit: Code → DB → API → UI → Permission → Workflow → Dữ liệu hiện có; phân loại CONFIRMED/LIKELY/UNKNOWN/CONFLICT; gặp UNKNOWN ảnh hưởng DB/logic thì DỪNG và báo.
2. **Không push git** cho tới khi TOÀN BỘ công việc xong VÀ người dùng đã test thủ công (chốt 17/09/2026).
3. **Giữ ảnh chuẩn** `tools/baseline/` (28 PNG) và `tools/_tools/_diff` trong kho mã.
4. **Không viết lại mã đang chạy** khi không cần thiết; ưu tiên tái sử dụng.
5. **Mọi lớp CSS của thư viện dùng chung phải có tiền tố** `vt-` (bài học: `.timeline` đè CSS sẵn có ở `globals.css:161`).
6. **Cổng ảnh dùng cơ chế chống lỗi giả**: chụp lại khi lệch, chỉ kết luận LỆCH khi cả hai lần đều vượt ngưỡng; ngưỡng giữ nguyên 8 px.
7. **Không tự đặt chữ mới** trong giao diện — mọi chữ phải lấy nguyên văn từ markup cũ.
8. **Phân quyền so bằng mã ENGINE** (`role_catalog.base_role`), không so bằng mã vai trò chuẩn. Mã chuẩn ánh xạ nhiều-về-một sang mã engine; so bằng mã chuẩn sẽ loại oan `da_truong`, `kh_truong`, `kho_tong`, `thuky` và mọi vai trò do quản trị viên tạo thêm (bài học TASK-021).
9. **Khi port từ JS sang Java phải port cả NGUỒN DỮ LIỆU, không chỉ chuỗi so sánh.** TASK-019 đổi chuỗi nhưng bỏ qua việc Java không nạp `roleBase` từ `role_catalog` ⇒ chỉ đúng một nửa (bài học TASK-021).

## Known Problems

1. **Điều tra CÒN MỞ** — cổng ảnh có hiện tượng bất định giữa các phiên (đã đo 0 px · 20 px · 0 px trên cùng một màn). Đã khoanh vùng tới ô tìm kiếm topbar và loại trừ nó, **chưa tìm ra nguyên nhân gốc**.
2. **Roadmap từng báo quá** — U-01/U-02/U-04/U-06/U-07 đánh DONE nhưng số lần DÙNG THẬT = 0. Đã sửa và tách thành U-14…U-17. **Tiến độ áp dụng (đo bằng `tools/probe-ui-adoption.mjs`)**: `StatusBadge` **90** · `ListToolbar` **13** · `DataTable` **0** · `PermissionGuard` **0** · `ApprovalTimeline`/`ActivityTimeline` **0** · `EntityDetailModal` **0**. Còn lại: **100** bảng tự viết · **100** trạng thái rỗng tự viết · **50** điều kiện quyền rải rác · **4** modal tự viết · **3** dải timeline tự viết.
3. **`/api/files` chưa được bảo vệ** (S-05) — người dùng yêu cầu tạm bỏ qua phần bảo mật.
4. ~~5 lỗi mã vai trò trong `ProductionManagementUseCase`~~ **ĐÃ SỬA ở TASK-019, HOÀN THIỆN ở TASK-021**: TASK-019 chỉ đổi chuỗi (`commander`→`cht`, `project`→`da_nv`) nên **vẫn loại oan `da_truong`**; TASK-021 đã đưa về mã engine và cho `requireRole` nhận cả hai.
5. **`team_members` = 0 dòng** ⇒ màn Tổ đội trống; **`approval_stage_decisions` = 0 dòng** (mã chết).
6. ~~3 lỗi eslint có sẵn `react-hooks/static-components`~~ **ĐÃ SỬA ở TASK-016 (U-13)**: `TaskTable` nay ở cấp module; eslint **0 lỗi** (74 cảnh báo).
7. **Cổng ảnh + probe không chạy được** (TASK-B02) — cần mở rộng sandbox cho Edge headless; đây là rào cản lớn nhất cho mọi việc UI tiếp theo.
8. ~~`ACTION_CATALOG.json` lệch ~50 action~~ **ĐÍNH CHÍNH Ở TASK-018 — cáo buộc này SAI**: catalog khớp HOÀN TOÀN với nguồn JS; con số 224 bị tính lẫn **38 tên chỉ mục SQL**. Số đúng: JS 174 action · Java 186 action thật · Java **không thiếu action nào** · Java có **thêm 12 action** đều đã được kiểm quyền. Việc còn lại chỉ là **tài liệu** (catalog chưa ghi 12 action đó).
9. **JAR Java CHƯA đóng gói lại** (TASK-B03) — `mvn package` bị sandbox chặn ghi `C:\Users\PC\.m2`, `mvn -o` thiếu artifact trong local repo. Vì vậy **mọi sửa đổi backend (TASK-019, TASK-021) CHƯA có hiệu lực lúc chạy**; mới chỉ kiểm chứng ở mức mã nguồn + biên dịch (`tools/verify-java-compile.ps1`: 99 tệp · 0 lỗi · 153 `.class`).
10. **`cancel_request` thiếu kiểm quyền dự án** (TASK-023) — JS `scripts/system-route.mjs:1048` có `canAccessProject(user, mr.projectId, true)`; Java không có. Port `ProjectScopeStore` hiện chỉ có `findProjectIdsByUserId`, thiếu mức quyền.
11. **`isCompanyLeadership` lệch** (TASK-024) — JS = tập 7 mã `{director,tgd,ptgd,giam_doc,pho_giam_doc,thuky,thu_ky_tgd}` HOẶC `base_role==='director'`; Java = `{director, accountant}`. Java **cấp thừa** cho `accountant` và **cấp thiếu** cho `thuky`/`hcpc_truong`. Thuộc nhóm bảo mật đang tạm hoãn ⇒ chờ người dùng quyết định.
12. **Vài action Java thiếu `requireRole`** so với JS (vd `create_stock_count` dòng 546, `approve_stock_count` dòng 581) — cần rà soát từng action (TASK-022); **không thêm máy móc** vì Java có thể đã kiểm bằng `requireActionModule`.

## Current TODO

* [x] TASK-021 · **Sửa GỐC ngữ nghĩa vai trò** — `roleBase` từ `role_catalog`, `requireRole` nhận mã engine, 13 điểm gọi về mã engine; docs/28; biên dịch 99 tệp **0 lỗi**
* [~] TASK-008 · U-09 đợt 5 — code xong, probe riêng 11/11 ĐẠT, đã commit `96c3aa8` (PARTIAL); còn lượt quét hồi quy rộng (chờ quyền)
* [ ] TASK-022 · Rà soát action Java **thiếu** `requireRole` so với JS (vd `create_stock_count`, `approve_stock_count`)
* [ ] TASK-023 · Bổ sung mức quyền vào `ProjectScopeStore` rồi thêm `canAccessProject` cho `cancel_request`
* [!] TASK-024 · CHỜ QUYẾT ĐỊNH: lệch `isCompanyLeadership` giữa JS và Java
* [ ] TASK-009 · U-09 đợt 6 — 13 màn còn lại
* [ ] TASK-010 · U-14 — ÁP DỤNG EntityDetailModal (dùng thật 0; còn 4 chỗ .overlay)
* [ ] TASK-011 · U-15 — ÁP DỤNG DataTable (100 bảng + 100 trạng thái rỗng; phần StatusBadge đã xong ở TASK-020)
* [ ] TASK-012 · U-16 — ÁP DỤNG PermissionGuard (0 lần; còn 50 chỗ điều kiện quyền)
* [ ] TASK-013 · U-17 — ÁP DỤNG Approval/ActivityTimeline (0 lần; còn 3 dải tự viết)
* [ ] TASK-014 · U-11 — Tách `page.tsx` (4.140 dòng / 221 hàm) thành module theo màn hình
* [ ] TASK-015 · U-12 — Loại `!important` + gộp selector trùng lặp CSS
* [ ] TASK-017 · Điều tra còn mở — nguyên nhân gốc hiện tượng bất định của cổng ảnh
* [!] TASK-B03 · CHẶN: không đóng gói lại được JAR Java (mvn chặn ghi `.m2`)
* [!] TASK-B02 · CHẶN: cổng ảnh + probe không chạy được (cần mở rộng sandbox cho Edge headless)
* [!] TASK-B01 — CHỜ XÁC NHẬN: tên màn Receiving (không tự đặt chữ; không chặn tiến độ)

## PHASE 2–10 (theo docs/25_TODO_ROADMAP.md)

Chưa bắt đầu. Xem `docs/25_TODO_ROADMAP.md` cho danh sách đầy đủ (P-xx mua hàng, T-xx công việc, PR-xx dự án, W-xx kho, TM-xx tổ đội, AD-xx quản trị, R-xx báo cáo, WF-xx workflow, S-xx bảo mật, MEP PHASE 10).

Ngoài ra MASTER TASK còn 3 mục **chưa bắt đầu** nằm ngoài roadmap PHASE: §2.1 timeline duyệt phiếu đề nghị mua hàng · §2.2 modal "Tổng hợp giao nhận về phiếu đề nghị gốc" · §2.3 responsive ảnh/hồ sơ vật tư đặc thù.
