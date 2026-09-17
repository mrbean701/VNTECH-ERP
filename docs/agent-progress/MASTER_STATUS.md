# MASTER STATUS — VNTECH ERP V5.3.0

> Tệp này là NGUỒN SỰ THẬT về trạng thái toàn cục. Mọi phiên làm việc mới PHẢI đọc tệp này trước.

## Current Master Task

* Master Task: MASTER TASK — ERP/MIS SYSTEM AUDIT, REFACTOR & FEATURE UPGRADE (46 mục)
* Overall status: **IN PROGRESS** — PHASE 1 chưa xong
* Current phase: PHASE 1 — HẠ TẦNG UI DÙNG CHUNG (chiếm phần lớn khối lượng còn lại)
* Current task: TASK-008 — U-09 đợt 5 (3 màn trong tab Quản trị)
* Last completed task: TASK-007 — U-09 đợt 4 (commit `9148212`)
* Next task: TASK-009 — U-09 đợt 6 (13 màn còn lại)
* Blocked task: TASK-B01 — tên màn Receiving (chờ người dùng; **KHÔNG chặn tiến độ**)
* User confirmation required: **YES** — 1 việc duy nhất: tên hiển thị màn `Receiving` (GIAO NHẬN) lấy từ menu
* Last updated: 2026-09-17

## System State

* **Frontend**: Next 16.2.6 + React 19 + TS 5.9 + Tailwind 4; UI render SSR; toàn bộ giao diện nằm trong `app/page.tsx` (4.140+ dòng, 221 hàm top-level — U-11 chưa tách)
* **Backend**: Java Spring Boot 3.5 (target Java 21), Maven đa module Clean Architecture; `SystemController.java` 1.437 dòng, 224 nhánh `case`
* **Database**: MySQL 8.0.46; Flyway V1–V16 + drizzle tới `0107`; 121 bảng
* **API**: chỉ 2 route ngoài action (`app/api/system`, `app/api/files`); 224 action trong SystemController; `ACTION_CATALOG.json` còn lệch ~50 action
* **Authentication**: `login` · `setup` · `logout` · `change_password` · `update_profile_avatar` (PUBLIC_ACTIONS)
* **Authorization**: 3 lớp — `admin` → tất cả; `isCompanyLeadership` = {director, accountant} → tất cả trừ admin; còn lại cần `user_module_permissions.can_<cap>=1`; kèm quy tắc P5.3 (không cấp quyền vượt phòng ban)
* **Workflow**: `WF-MUAHANG` 5 bước tuần tự, mỗi bước cần 1 người duyệt; điều kiện hợp lệ = được gán HOẶC role nằm trong `allowed_role_codes`
* **Infrastructure/server**: MySQL **3306** · Java API **18081** · Node SSR **8787** · cutover proxy **9000** (người dùng mở :9000)
* **Tests**: 13 probe hồi quy + cổng ảnh 28 ảnh (7 màn × 4 kích thước) + `tsc` + eslint

## Important Decisions

1. **Không tự suy đoán nghiệp vụ.** Chuỗi audit: Code → DB → API → UI → Permission → Workflow → Dữ liệu hiện có; phân loại CONFIRMED/LIKELY/UNKNOWN/CONFLICT; gặp UNKNOWN ảnh hưởng DB/logic thì DỪNG và báo.
2. **Không push git** cho tới khi TOÀN BỘ công việc xong VÀ người dùng đã test thủ công (chốt 17/09/2026).
3. **Giữ ảnh chuẩn** `tools/baseline/` (28 PNG) và `tools/_tools/_diff` trong kho mã.
4. **Không viết lại mã đang chạy** khi không cần thiết; ưu tiên tái sử dụng.
5. **Mọi lớp CSS của thư viện dùng chung phải có tiền tố** `vt-` (bài học: `.timeline` đè CSS sẵn có ở `globals.css:161`).
6. **Cổng ảnh dùng cơ chế chống lỗi giả**: chụp lại khi lệch, chỉ kết luận LỆCH khi cả hai lần đều vượt ngưỡng; ngưỡng giữ nguyên 8 px.
7. **Không tự đặt chữ mới** trong giao diện — mọi chữ phải lấy nguyên văn từ markup cũ.

## Known Problems

1. **Điều tra CÒN MỞ** — cổng ảnh có hiện tượng bất định giữa các phiên (đã đo 0 px · 20 px · 0 px trên cùng một màn). Đã khoanh vùng tới ô tìm kiếm topbar và loại trừ nó, **chưa tìm ra nguyên nhân gốc**.
2. **Roadmap từng báo quá** — U-01/U-02/U-04/U-06/U-07 đánh DONE nhưng số lần DÙNG THẬT = 0. Đã sửa và tách thành U-14…U-17.
3. **`/api/files` chưa được bảo vệ** (S-05) — người dùng yêu cầu tạm bỏ qua phần bảo mật.
4. **5 lỗi mã vai trò còn lại** trong `ProductionManagementUseCase` (dòng 186/205/228/243/267) — cố ý không sửa vì ngoài phạm vi mua hàng.
5. **`team_members` = 0 dòng** ⇒ màn Tổ đội trống; **`approval_stage_decisions` = 0 dòng** (mã chết).
6. **3 lỗi eslint có sẵn** `react-hooks/static-components` tại `page.tsx:774` (`TaskTable` trong thân render `WorkCenter`) → U-13.

## Current TODO

* [ ] TASK-008 · U-09 đợt 5 — 3 màn tab Quản trị (code xong, đang build + xác minh)
* [ ] TASK-009 · U-09 đợt 6 — 13 màn còn lại
* [ ] TASK-010 · U-14 — ÁP DỤNG EntityDetailModal (dùng thật 0; còn 4 chỗ .overlay)
* [ ] TASK-011 · U-15 — ÁP DỤNG DataTable + StatusBadge (100 bảng + 100 trạng thái rỗng; StatusBadge 2/88)
* [ ] TASK-012 · U-16 — ÁP DỤNG PermissionGuard (0 lần; còn 50 chỗ điều kiện quyền)
* [ ] TASK-013 · U-17 — ÁP DỤNG Approval/ActivityTimeline (0 lần; còn 3 dải tự viết)
* [ ] TASK-014 · U-11 — Tách `page.tsx` (4.140 dòng / 221 hàm) thành module theo màn hình
* [ ] TASK-015 · U-12 — Loại `!important` + gộp selector trùng lặp CSS
* [ ] TASK-016 · U-13 — Tách `TaskTable` ra khỏi thân render `WorkCenter`
* [ ] TASK-017 · Điều tra còn mở — nguyên nhân gốc hiện tượng bất định của cổng ảnh
* [!] TASK-B01 — CHỜ XÁC NHẬN: tên màn Receiving (không tự đặt chữ; không chặn tiến độ)

## PHASE 2–10 (theo docs/25_TODO_ROADMAP.md)

Chưa bắt đầu. Xem `docs/25_TODO_ROADMAP.md` cho danh sách đầy đủ (P-xx mua hàng, T-xx công việc, PR-xx dự án, W-xx kho, TM-xx tổ đội, AD-xx quản trị, R-xx báo cáo, WF-xx workflow, S-xx bảo mật, MEP PHASE 10).
