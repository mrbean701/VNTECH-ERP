# TASK_LOG — SESSION_D (ERP-SESSION-04)

## TASK-20261008-D01 — Báo cáo kế hoạch GO-LIVE & phát triển lõi MEP

| Trường | Giá trị |
|---|---|
| TASK_ID | `TASK-20261008-D01` |
| DATE | 2026-10-08 |
| SESSION_ID | `ERP-SESSION-04` |
| MODULE | DOCUMENTATION / PLANNING |
| FEATURE | Kế hoạch go-live + phát triển lõi (mua hàng · PO · quy trình mua · luồng duyệt · phòng ban · dự án) |
| OBJECTIVE | 1 báo cáo gồm: đề xuất · mô tả hệ thống · các bước triển khai · chức năng đã sẵn sàng go-live · phương hướng tương lai |
| PRIORITY | P0 |
| STATUS | **DONE** (tài liệu) — ⚠️ chưa `VERIFIED` (chờ user đọc/duyệt) |
| START / END | 2026-10-08 → 2026-10-08 |
| IMPLEMENTATION_SUMMARY | Khảo sát trạng thái thật (3 phiên, Java backend + MySQL + proxy :9000) → đọc mã lõi xác minh chuỗi mua hàng/duyệt đơn/RBAC → viết `docs/37_*.md` (9 mục) |
| FILES_CHANGED | `docs/37_KE_HOACH_GO_LIVE_VA_PHAT_TRIEN_LOI_MEP_20261008.md` (MỚI) · `docs/dsh-mutil-session/SESSION_D/**` (MỚI) |
| RESULT | Hoàn thành; ⛔ chưa chạy gate (blocker shell) ⇒ chỉ dùng số liệu có nguồn+ngày |
| TEST_REFERENCE | Không áp dụng (tài liệu) |
| REMAINING | User đọc/duyệt · (khuyến nghị) đánh dấu `docs/09` đã lỗi thời |
| NEXT_ACTION | Chờ user; nếu chốt GĐ0 → chuyển GĐ1 (dữ liệu + cấu hình) |

---

## TASK-20261008-D02 — **AUDIT JOBS & PROJECT** (trước khi user giao việc)

| Trường | Giá trị |
|---|---|
| TASK_ID | `TASK-20261008-D02` |
| DATE | 2026-10-08 |
| SESSION_ID | `ERP-SESSION-04` |
| MODULE | JOBS (`my_work`) + PROJECT (`site_command`, `project_management`) |
| FEATURE | Audit tĩnh: menu → màn → action → RBAC → test; rà dead code, vùng LOCK, nợ FE |
| OBJECTIVE | «audit lại phần JOBS và PROJECT trước khi tôi giao việc» (user 08/10/2026) |
| PRIORITY | P0 (điều kiện để giao việc) |
| STATUS | **DONE** (audit) — ⚠️ các kết luận **runtime** còn `OPEN` (không đo được) |
| START / END | 2026-10-08 → 2026-10-08 |
| IMPLEMENTATION_SUMMARY | Đọc `lib/menu-helpers.ts` · `app/page.tsx` · `app/screens/*` · `ActionRbacRegistry.java` · `RbacService.java` · `SystemController.java` · `OpsTaskManagementUseCase.java`; đối chiếu `docs/dsh-state/**` + `SESSION_C/HANDOFF_LOG.md`; lập bản đồ 2 vùng + 11 phát hiện + 8 việc sẵn sàng giao |
| FILES_CHANGED | `docs/38_AUDIT_JOBS_PROJECT_20261008.md` (MỚI) · 9 log + README của `SESSION_D` · APPEND vào 2 sổ đăng ký chung + `SHARED_TODO` |
| RESULT | ✅ Audit xong; 🔴 2 bug RBAC (`BUG-20261008-D01/D02`) **mới chỉ chứng minh bằng đọc mã** |
| TEST_REFERENCE | `TEST-20261008-D01` (audit tĩnh PASS · regression **BLOCKED** do shell hỏng) |
| REMAINING | 6 phép đo runtime (hàng đợi ở `TEST_LOG`) · user quyết 5 câu (`docs/38` §7) · S01/S02 nhận T-02…T-07 |
| NEXT_ACTION | Chờ user quyết → giao việc theo thứ tự **FE → BE → DB** |

---

## TASK-20261008-D03 — **ĐÍNH CHÍNH AUDIT + MỞ RỘNG SANG TẦNG CỔNG QUYỀN**

| Trường | Giá trị |
|---|---|
| TASK_ID | `TASK-20261008-D03` |
| DATE | 2026-10-08 |
| SESSION_ID | `ERP-SESSION-04` |
| MODULE | RBAC (2 tầng) — PROJECT · `material_catalog` · `site_command` · `approvals` |
| FEATURE | Rà **tầng cổng quyền**: registry vs controller (`requireRequireAdmin`/`requireCurrentUser`) |
| OBJECTIVE | Sửa kết luận sai tầng của P-01/P-02 + tìm nhóm mồ côi thật |
| PRIORITY | P0 (tránh user quyết trên số liệu sai) |
| STATUS | **DONE** (audit) · các kết luận runtime vẫn `OPEN` |
| START / END | 2026-10-08 → 2026-10-08 |
| IMPLEMENTATION_SUMMARY | Đọc `SystemController.java:258-302`, `:893-1040`, `:1739-1745`; grep 65 action rỗng + 45 call site `requireRequireAdmin`; lập **bản đồ 2 tầng cổng**; phát hiện **P-08** (12 action mồ côi thật) |
| FILES_CHANGED | `docs/39_DINH_CHINH_AUDIT_TANG_CONG_QUYEN_20261008.md` (MỚI) · `docs/38` §10 (sửa) · `SESSION_D/{BUG_HOTFIX,DECISION,EVENT,TASK,WEEKLY}*` (cập nhật) · `README.md` (cập nhật) |
| RESULT | ✅ **P-01/P-02 đã sửa về đúng tầng** (`requireRequireAdmin`) · 🆕 **P-08** = 12 action mồ côi thật (HIGH, nghi vấn) |
| TEST_REFERENCE | ⛔ chưa chạy — kịch bản 4 phép thử + đối chứng âm ở `docs/39` §5 |
| REMAINING | Chạy phép thử khi shell hồi phục · user quyết lại câu 1–2 theo bản chất mới |
| NEXT_ACTION | Gửi Telegram đính chính (đã làm) · chờ user quyết |

---

## TASK-20261008-D04 — **XÁC MINH LẠI CÁC PHÁT HIỆN `docs/38`**

| Trường | Giá trị |
|---|---|
| TASK_ID | `TASK-20261008-D04` |
| DATE | 2026-10-08 |
| SESSION_ID | `ERP-SESSION-04` |
| MODULE | JOBS · PROJECT · RBAC |
| FEATURE | Tự kiểm chứng: bác / xác minh / đính chính từng phát hiện chưa có bằng chứng mã |
| OBJECTIVE | ⛔ Không để user giao việc dựa trên phát hiện sai (sau khi đã sai 1 lần ở `docs/38` P-01) |
| PRIORITY | P0 |
| STATUS | **DONE** (audit) |
| START / END | 2026-10-08 → 2026-10-08 |
| IMPLEMENTATION_SUMMARY | Đọc `page.tsx:596-625`, `:759-774`, `:1024`, `:2818-2829`; kiểm FE **và** BE cho P-01; xác minh P-05; làm rõ cơ chế J-01; đính chính mô tả J-02 |
| FILES_CHANGED | `docs/40_XAC_MINH_LAI_PHAT_HIEN_JOBS_PROJECT_20261008.md` (MỚI) · `SESSION_D/{TEST,EVENT,BUG_HOTFIX,TASK}_LOG.md` (cập nhật) |
| RESULT | ❌ **BÁC P-01** (cả FE+BE cùng chặn — không có đường bấm) ⇒ ⛔ **RÚT VIỆC T-03** · ✅ P-05 xác minh **2 chỗ** (`page.tsx:1024`) · ⚠️ J-01 chưa đo được hiệu ứng ⇒ **hạ mức T-04** · ⚠️ J-02 đính chính mô tả |
| TEST_REFERENCE | `TEST-20261008-D02` (audit tĩnh PASS · regression **BLOCKED** — shell vẫn hỏng, vòng 2) |
| REMAINING | Đo UI 3 việc (P-07, J-01, P-08) khi shell hồi phục |
| NEXT_ACTION | Tiếp `TASK-20261008-D05`: soi tầng cổng quyền chuỗi mua hàng lõi |

---

## TASK-20261008-D05 — **SOI TẦNG CỔNG QUYỀN CHUỖI MUA HÀNG LÕI**

| Trường | Giá trị |
|---|---|
| TASK_ID | `TASK-20261008-D05` |
| DATE | 2026-10-08 |
| SESSION_ID | `ERP-SESSION-04` |
| MODULE | `requests` · `approvals` · `purchasing` · `receiving`/`warehouse_receipt` · `inventory`/`warehouse_issue` |
| FEATURE | Kiểm tầng cổng quyền của 13 action lõi (`create_request` → `decide_approval` → `create_po` → `approve/reject_po` → `receive_goods`/`confirm_delivery` → kho) |
| OBJECTIVE | Xác minh `docs/37` §2 («12 chức năng sẵn sàng go-live») **không bị chặn quyền sai** ở tầng controller — vùng **chưa từng được soi** |
| PRIORITY | P0 (đây là chuỗi go-live chính) |
| STATUS | **DONE** (audit) |
| START / END | 2026-10-08 → 2026-10-08 |
| IMPLEMENTATION_SUMMARY | Đọc `SystemController.java:1120-1199`; đối chiếu `ActionRbacRegistry` (module + capability) cho từng action |
| FILES_CHANGED | `docs/40` §5 (bổ sung) · `SESSION_D/{EVENT,TASK,WEEKLY}*` (cập nhật) |
| RESULT | ✅ **SẠCH**: **13/13 action dùng `requireCurrentUser`** + module/capability thật ⇒ **nghiệp vụ chạy được**; mã ghi rõ chủ ý *«⛔ KHÔNG hard-code quyền ở đây»* (`:1138-1140`) · ⚠️ **PROJECT CRUD là ngoại lệ** (hard-code `requireRequireAdmin`) giữa hệ module-gated ⇒ cần user xác nhận «chủ ý hay sót» |
| TEST_REFERENCE | ⛔ chưa chạy (shell hỏng vòng 2) — kịch bản ở `docs/39` §5 |
| REMAINING | Chạy phép thử khi shell hồi phục · user xác nhận tính nhất quán PROJECT CRUD |
| NEXT_ACTION | **T-09 (P-08)** — xác minh + vá 12 action mồ côi thật (danh mục vật tư ưu tiên cao nhất) sau khi có quyết định + shell |

---

## TASK-20261008-D06 — **MA TRẬN QUYỀN GO-LIVE** (`docs/41`)

| Trường | Giá trị |
|---|---|
| TASK_ID | `TASK-20261008-D06` |
| DATE | 2026-10-08 |
| SESSION_ID | `ERP-SESSION-04` |
| MODULE | RBAC toàn hệ lõi (mua hàng · kho · tài chính · công việc · quản trị) |
| FEATURE | Lập bảng tra **action → module/capability → tầng cổng → ai chạy được (A/L/M)** để user cấu hình phân quyền go-live |
| OBJECTIVE | Biến kết quả audit tầng cổng thành **tài liệu dùng được ngay** cho GĐ A3/A4 của `docs/37` |
| PRIORITY | P1 |
| STATUS | **DONE** (audit) — ⏳ 4 dải chưa soi thân (`:304`, `:534-563`, `:564-573`, `:1070`) |
| START / END | 2026-10-08 → 2026-10-08 |
| IMPLEMENTATION_SUMMARY | Đọc `SystemController` các dải `376-423`, `636-651`, `893-1040`, `1008-1023`, `1120-1257`, `1430-1448`; đối chiếu `ActionRbacRegistry` + `RbacService`; phân loại **A/L/M**; tổng hợp 3 bất nhất quán + tiền lệ sửa đúng |
| FILES_CHANGED | `docs/41_MA_TRAN_QUYEN_GO_LIVE_20261008.md` (MỚI) · `SESSION_D/{DEV,EVENT,BUG_HOTFIX,TASK,WEEKLY}*` |
| RESULT | 🎯 **Chuỗi lõi go-live SẠCH** (module-gated đúng) · 🔴 **3 bất nhất quán** (`delete_supplier` = `BUG-20261008-D04` · PROJECT CRUD · P-08) · ⭐ **tiền lệ vàng `update_user`** = khuôn sửa P-08 |
| TEST_REFERENCE | ⛔ chưa chạy (shell hỏng vòng 2) |
| REMAINING | Soi nốt 4 dải · user xác nhận PROJECT CRUD + luật L · chạy phép thử `docs/39` §5 |
| NEXT_ACTION | Viết **spec sẵn sàng thi hành cho T-09/P-08** (kèm test đối chứng âm) để S01 vá ngay khi được phép |

---

## TASK-20261008-D07 — **SPEC VÁ P-08** + soi nốt 4 dải + phát hiện TẦNG CỔNG THỨ 3

| Trường | Giá trị |
|---|---|
| TASK_ID | `TASK-20261008-D07` |
| DATE | 2026-10-08 |
| SESSION_ID | `ERP-SESSION-04` |
| MODULE | RBAC (`ActionRbacRegistry` · `RbacService` · `SystemController` + access scope) |
| FEATURE | ① Soi nốt 4 dải chưa đọc ② Viết spec thi hành cho nhóm action mồ côi (**P-08**) |
| OBJECTIVE | Biến phát hiện thành **việc thi hành được trong ~30 phút**, ⛔ không phải điều tra lại |
| PRIORITY | P1 |
| STATUS | **DONE** (tài liệu) — ⏳ chờ user chốt bảng quyết định |
| START / END | 2026-10-08 → 2026-10-08 |
| IMPLEMENTATION_SUMMARY | Đọc `SystemController:300-312`, `:530-577`, `:1064-1075`; phát hiện ⭐ **TẦNG ③** (`requireProjectAccess` — guard theo DỰ ÁN, dùng ở `save_project_contract:308-309`); xác nhận `preview_request_import`/`update_returned_request`/`resubmit_request`/`delete_request`/`cancel_request`/`save_boq_*` = `requireCurrentUser`; xác nhận `bulk_import_projects`/`bulk_import_users`/`save_email_settings` = `requireCurrentUser` + **registry rỗng** ⇒ thuộc **P-08**; viết `docs/42` (bảng quyết định 12+6 action · diff mẫu · **nhánh `ADMIN_ONLY_ACTIONS`** · 4 ca cổng tĩnh + 5 phép thử API · rollback) |
| FILES_CHANGED | `docs/42_SPEC_VA_P08_ACTION_MO_COI_QUYEN_20261008.md` (MỚI) · `docs/41` (§1 · §3 điền dải vừa soi) · `SESSION_D/{TASK,EVENT,WEEKLY,README}*` |
| RESULT | ✅ Spec sẵn sàng · ⭐ **học được tầng cổng thứ 3** (project-scope) · ⚠️ **phát hiện quan trọng trong spec**: khai `List.of("admin")` **vẫn là rỗng** ⇒ **vẫn 403** ⇒ cách đúng là **nhánh `ADMIN_ONLY_ACTIONS`** ở `RbacService` (⛔ không dùng `PUBLIC_ACTIONS`) |
| TEST_REFERENCE | ⛔ chưa chạy (shell hỏng **vòng 3**). Cổng tĩnh đề xuất ở `docs/42` §4.1 **chạy được khi shell hồi phục, ⛔ không cần UI/DB** |
| REMAINING | User chốt bảng quyết định `docs/42` §2 → S01 thi hành |
| NEXT_ACTION | Viết sẵn **nội dung cổng tĩnh** `tests/golive-rbac-orphans.test.mjs` (dạng spec mã) để S01 dán vào chạy |

---

## TASK-20261008-D08 — **RÀ CHIỀU NGƯỢC `PUBLIC_ACTIONS`** + **CỔNG TĨNH SẴN DÁN**

| Trường | Giá trị |
|---|---|
| TASK_ID | `TASK-20261008-D08` |
| DATE | 2026-10-08 |
| SESSION_ID | `ERP-SESSION-04` |
| MODULE | RBAC (`RbacService.PUBLIC_ACTIONS` · `SystemController` · `AuthUseCase.setup`) |
| FEATURE | ① Kiểm chiều "mở quá rộng" (authorization bypass) ② Viết sẵn **mã cổng tĩnh** để S01 dán |
| OBJECTIVE | Đóng nốt hướng rủi ro còn lại của RBAC + để lại **cổng chống tái phát** ⛔ không cần UI/DB |
| PRIORITY | P0 (authorization bypass = mức CRITICAL theo Goal §20) |
| STATUS | **DONE** (audit) — ✅ **âm tính có chủ đích** (⛔ không có lỗ hổng) |
| START / END | 2026-10-08 → 2026-10-08 |
| IMPLEMENTATION_SUMMARY | Đọc thân 10 `case` công khai (`:233-258`, `:1371-1389`, `:1472`) + `AuthUseCase:59-110`; xác minh `setup` fail-closed (409 khi đã khởi tạo) + `login` lockout 429; viết `docs/43` gồm **2 tệp test tĩnh hoàn chỉnh** (regex trên mã Java, có **đối chứng âm**) + bảng việc cho S01 |
| FILES_CHANGED | `docs/43_RA_CHIEU_NGƯỢC_PUBLIC_ACTIONS_VA_CONG_TINH_20261008.md` (MỚI) · `SESSION_D/{TEST,TASK,EVENT,WEEKLY,README}*` |
| RESULT | ✅ **SẠCH**: 7/7 action tự phục vụ `requireCurrentUser` + `cu.id()`; `setup` 409 khi đã khởi tạo; `login` lockout; `logout` idempotent ⇒ ⛔ **không có bypass** |
| TEST_REFERENCE | `TEST-20261008-D03` (PASS, đọc mã) · regression ⛔ BLOCKED (shell hỏng vòng 4) |
| REMAINING | S01 dán 2 cổng tĩnh + chạy (kỳ vọng PASS); cập nhật `SNAPSHOT_EMPTY_COUNT` sau khi vá P-08 |
| NEXT_ACTION | Viết `docs/44`: **danh sách 65 action rỗng kèm phân loại** (nghiệp vụ–mở / admin-only / đã có cổng ②) để khoá cổng chính xác hơn (thay canary bằng allowlist đầy đủ) |

---

## TASK-20261008-D09 — **KIỂM ĐƯỜNG CẤP QUYỀN + SCRIPT PHÂN LOẠI 65 ACTION**

| Trường | Giá trị |
|---|---|
| TASK_ID | `TASK-20261008-D09` |
| DATE | 2026-10-08 |
| SESSION_ID | `ERP-SESSION-04` |
| MODULE | RBAC (đường cấp quyền) + công cụ phân loại |
| FEATURE | ① Kiểm 2 chiều FE↔BE cho 6 action cấp quyền (tìm "nút chết" — lớp MỐC 109) ② Viết script phân loại 65 action rỗng |
| OBJECTIVE | Đóng vùng dễ sinh lỗi nhất của RBAC + thay "canary 65" bằng **allowlist chính xác từng tên** |
| PRIORITY | P1 |
| STATUS | **DONE** (audit) — ✅ **âm tính có chủ đích** (⛔ không có nút chết) |
| START / END | 2026-10-08 → 2026-10-08 |
| IMPLEMENTATION_SUMMARY | Đọc `SystemController:413-430`, `:479-485`, `:379-394`; grep FE toàn bộ lời gọi `save_user_access`/`save_department_permission`/`admin_tab_01` (25 kết quả); đọc chú thích trong `Inventory.tsx:415-425`; viết `docs/44` gồm bảng 7 đường cấp quyền + **script `tools/rbac-classify-actions.mjs` hoàn chỉnh** (phân loại PUBLIC / ADMIN_HARD / ORPHAN / NO_CASE + **tự chặn "cổng xanh rỗng"**) |
| FILES_CHANGED | `docs/44_KIEM_DUONG_CAP_QUYEN_VA_SCRIPT_PHAN_LOAI_20261008.md` (MỚI) · `SESSION_D/{TEST,TASK,EVENT,WEEKLY,README}*` |
| RESULT | ✅ **FE↔BE NHẤT QUÁN** ⇒ ⛔ không phải lớp lỗi MỐC 109 ⇒ ⛔ không tạo việc giả · ⭐ **chốt mô hình quyền**: cấp quyền **tập trung ở admin** (⛔ không phân cấp) ⇒ **câu trả lời cho GĐ A3/A4** · 📋 **script phân loại sẵn dán** ⇒ cổng tĩnh sẽ chính xác từng tên |
| TEST_REFERENCE | `TEST-20261008-D04` (PASS, đọc mã) · regression ⛔ BLOCKED (shell hỏng vòng 5) |
| REMAINING | S01 dán + chạy script ⇒ lấy `ORPHAN` thật ⇒ dán vào allowlist cổng tĩnh · xác nhận `NO_CASE = 0` |
| NEXT_ACTION | Viết `docs/45`: **BẢNG TỔNG HỢP GO-LIVE** (1 trang) gom mọi kết quả 7 vòng thành checklist quyết định cho user — ⛔ thay vì rải 8 tài liệu |

---

## TASK-20261008-D10 — **BẢNG TỔNG HỢP GO-LIVE (1 TRANG)**

| Trường | Giá trị |
|---|---|
| TASK_ID | `TASK-20261008-D10` |
| DATE | 2026-10-08 |
| SESSION_ID | `ERP-SESSION-04` |
| MODULE | DOCUMENTATION / GO-LIVE DECISION SUPPORT |
| FEATURE | Gom 8 tài liệu (`docs/37`→`docs/44`) thành **1 bảng quyết định** cho user |
| OBJECTIVE | User ⛔ không phải đọc 8 tài liệu: 1 trang gồm **việc chặn · 7 quyết định (kèm đề xuất) · danh sách đã-sạch · kế hoạch thi hành FE→BE→DB · bằng chứng** |
| PRIORITY | P0 (điều kiện để user ra quyết định & giao việc) |
| STATUS | **DONE** |
| START / END | 2026-10-08 → 2026-10-08 |
| IMPLEMENTATION_SUMMARY | Tổng hợp 8 tài liệu + 10 task + 4 bug + 4 TEST thành: **A** việc chặn (profile DSH + dán cổng) · **B** 7 câu hỏi kèm đề xuất & hệ quả từng lựa chọn · **C** vùng đã kiểm SẠCH · **D** kế hoạch 8 bước (⛔ DB không cần migration) · **E** bằng chứng · **F** việc làm tiếp khi chưa có quyết định |
| FILES_CHANGED | `docs/45_BANG_TONG_HOP_GO_LIVE_20261008.md` (MỚI) · `SESSION_D/{TASK,EVENT,WEEKLY,README}*` |
| RESULT | ✅ 1 trang duy nhất chứa **toàn bộ điểm cần quyết**; nhấn mạnh **B1 (P-08)** là việc nghiệp vụ ảnh hưởng go-live cao nhất |
| TEST_REFERENCE | ⛔ không (tài liệu tổng hợp). Nguồn: `docs/37`…`docs/44` + `SESSION_D/*_LOG.md` |
| REMAINING | User trả lời B1–B7 + sửa profile DSH |
| NEXT_ACTION | Tiếp phần **F** (`docs/45` §F): soi nốt thân `case` các action lõi còn lại + kiểm `NO_CASE` + rà `module_catalog` có **module chết** |

---

## TASK-20261008-D11 — **F2: KIỂM `NO_CASE` + CHỐT 18 ORPHAN**

| Trường | Giá trị |
|---|---|
| TASK_ID | `TASK-20261008-D11` |
| DATE | 2026-10-08 |
| SESSION_ID | `ERP-SESSION-04` |
| MODULE | RBAC — `ActionRbacRegistry` ↔ `SystemController` (chiều "mồ côi controller") |
| FEATURE | Kiểm action khai registry mà ⛔ không có `case` + **chốt danh sách ORPHAN chính xác** |
| OBJECTIVE | Đóng mục **F2** của `docs/45`: xác nhận registry ↔ controller khớp tên, và phân loại **toàn bộ 65** action rỗng |
| PRIORITY | P1 |
| STATUS | **DONE** (audit) — ✅ **âm tính** (NO_CASE = 0) + ⭐ **chốt được 18 ORPHAN khớp lịch sử** |
| START / END | 2026-10-08 → 2026-10-08 |
| IMPLEMENTATION_SUMMARY | Grep **65 tên** action rỗng trên `SystemController.java` ⇒ **65/65 có `case` thật** (⛔ NO_CASE = 0) · phân loại theo **vị trí dòng + `requireRequireAdmin`** ⇒ **10 PUBLIC + 37 ADMIN_HARD + 18 ORPHAN = 65** · đối chiếu `CHECKLIST` MỐC 110 §8 ⇒ **khớp chính xác 18** và **khớp 5 nhóm** ⇒ kết luận **bảng `docs/42` §2 đã đủ** (12 + 6 = 18) |
| FILES_CHANGED | `docs/46_F2_NO_CASE_VA_CHOT_18_ORPHAN_20261008.md` (MỚI) · `SESSION_D/{TASK,EVENT,WEEKLY,README}*` |
| RESULT | ✅ `NO_CASE = 0` · ⭐ **18 ORPHAN chính xác theo từng action + dòng** ⇒ **xác nhận `docs/42` đầy đủ** · ⭐ **giải thích được chênh lệch lịch sử** (`8→10 public`, `19→18 orphan`, `38→37 admin-hard` = hoán đổi 1-1: `save_error_report` + `update_profile_signature`) |
| TEST_REFERENCE | ⛔ chưa chạy (shell hỏng vòng 7) — phương pháp là **grep + đọc dòng**, có kiểm chứng ngược (mọi kết quả đều là `case "…" ->`) |
| REMAINING | Chạy script `docs/44` để **đối chiếu độc lập** con số 18 · vá P-08 theo `docs/42` |
| NEXT_ACTION | Mục **F3** (`docs/45` §F): rà **`module_catalog` (76 module) ↔ action thật** tìm **module chết** (khai mà ⛔ action nào dùng) — ảnh hưởng GĐ A4 |

---

## TASK-20261008-D12 — **PATCH PACK VÁ P-08** (phát hiện thêm yêu cầu sửa CAPABILITY)

| Trường | Giá trị |
|---|---|
| TASK_ID | `TASK-20261008-D12` |
| DATE | 2026-10-08 |
| SESSION_ID | `ERP-SESSION-04` |
| MODULE | RBAC — `ActionRbacRegistry` (module + capability) · `RbacService` (nhánh admin) |
| FEATURE | Biến spec `docs/42` thành **patch chính xác từng dòng** (dán là xong) |
| OBJECTIVE | Khi user chốt ⇒ S01 áp trong **~30 phút**, ⛔ không phải điều tra lại |
| PRIORITY | P0 (điều kiện thi hành) |
| STATUS | **DONE** (tài liệu) — ⏳ chờ user chốt |
| START / END | 2026-10-08 → 2026-10-08 |
| IMPLEMENTATION_SUMMARY | Đọc `ActionRbacRegistry.capabilityFor` (`:567-569`) ⇒ ⚠️ **mặc định `canUse`**; grep xác nhận **cả 18 ORPHAN đang khai `canUse`** (`:326-527`) ⇒ phát hiện **nếu chỉ thêm module thì CẤP QUYỀN QUÁ RỘNG** (người có `canUse` xoá/import được) ⇒ viết `docs/47`: **§A** 12 dòng module · **§B 9 dòng capability** (canUse→canEdit/canCreate) · **§C** 6 action cấu hình → `ADMIN_ONLY_ACTIONS` · **§D** 2 khối mã `RbacService` chính xác · **§E** checklist 9 bước (**cập nhật cổng tĩnh 65→53**) · **§F đính chính `docs/42`** · **§G** rollback |
| FILES_CHANGED | `docs/47_PATCH_PACK_VA_P08_20261008.md` (MỚI) · `SESSION_D/{TASK,EVENT,WEEKLY,README}*` |
| RESULT | ⚠️ **`docs/42` ĐÚNG nhưng CHƯA ĐỦ** — patch đầy đủ phải gồm **cả capability** (⛔ thiếu ⇒ tự tạo lỗ hổng cấp quyền quá rộng) · ✅ patch giờ **chính xác từng dòng** (có số dòng + chuỗi old/new) |
| TEST_REFERENCE | ⛔ chưa chạy (shell hỏng vòng 8) — checklist §E có **đối chứng âm** bắt buộc |
| REMAINING | User chốt `docs/42` §2 **+ bảng capability §B của `docs/47`** ⇒ S01 áp |
| NEXT_ACTION | Mục **F3**: rà module chết (⚠️ cần DB ⇒ nếu shell còn hỏng thì thay bằng **rà `permissionKeys` trong `lib/menu-helpers.ts` ↔ module dùng trong registry** — ⛔ không cần DB) |

---

## TASK-20261008-D13 — **AUDIT CLOSURE** (chốt đợt) + nguyên nhân gốc **P-09**

| Trường | Giá trị |
|---|---|
| TASK_ID | `TASK-20261008-D13` |
| DATE | 2026-10-08 |
| SESSION_ID | `ERP-SESSION-04` |
| MODULE | RBAC (đối tác/NCC) + CLOSURE |
| FEATURE | ① Đóng nốt ma trận nhóm **ĐỐI TÁC** ② Chốt **nguyên nhân gốc P-09** ③ Phát hiện **ràng buộc "thêm tệp ⇒ phải `gd-cycle`"** ④ Kết luận đợt audit |
| OBJECTIVE | Chốt rõ **đã xong gì / còn gì / vì sao ⛔ không làm tiếp được bằng tài liệu** |
| PRIORITY | P0 (chống lặp vô ích) |
| STATUS | **DONE** |
| START / END | 2026-10-08 → 2026-10-08 |
| IMPLEMENTATION_SUMMARY | Đọc `SystemController:1449-1470` ⇒ `delete_partner` **cùng lớp** `delete_supplier` (`requireRequireAdmin`) và **mã ghi rõ NGUYÊN NHÂN GỐC**: *«Java chưa có helper `isDepartmentApprover("KH")`»* · `save_partner`/`set_partner_status` = `requireCurrentUser` ✅ ⇒ **ma trận đóng** · viết `docs/48`: bảng đã-xong · quyết định B5 với **2 lựa chọn có công sức rõ ràng** · **ràng buộc vân tay** (⛔ không tạo tệp mới khi chưa chạy được `gd-cycle`) · **8 bài học Đ-04-01…08** |
| FILES_CHANGED | `docs/48_AUDIT_CLOSURE_20261008.md` (MỚI) · `SESSION_D/{TASK,EVENT,BUG_HOTFIX,WEEKLY,README}*` |
| RESULT | ✅ Ma trận **ĐÓNG** (mọi nhóm lõi đã phân loại A/L/M) · ⭐ **B5 giờ có 2 lựa chọn định lượng**: (a) giữ admin-only = **1–2 dòng** · (b) port helper = **≥ nửa ngày** ⇒ đề xuất **(a)** · ⛔ **kết luận: hết việc tài liệu giá trị** ⇒ báo **BLOCKED** (chờ user + shell) |
| TEST_REFERENCE | ⛔ chưa chạy (shell hỏng **vòng 9**) |
| REMAINING | Toàn bộ §4 của `docs/48` — đều cần **USER** (profile DSH + 7 quyết định) |
| NEXT_ACTION | ⛔ **Không có việc không-bị-chặn tiếp theo** ⇒ dừng vòng lặp tự động, báo BLOCKED có lý do cụ thể |

---

## TASK-20261008-D14 — **KẾ HOẠCH 7 VIỆC KHỐI «CÔNG VIỆC» + AUDIT TAB PHÒNG BAN** (user giao 08/10)

| Trường | Giá trị |
|---|---|
| TASK_ID | `TASK-20261008-D14` |
| DATE | 2026-10-08 |
| SESSION_ID | `ERP-SESSION-04` |
| MODULE | JOBS (`WorkCenter` · menu `my_work` · route trong `page.tsx`) + RBAC/task backend |
| FEATURE | 1) gom 5 mục menu thành **1 hub «Công việc»** + Dashboard lên đầu · 2) search xuống trên danh sách việc cá nhân · 3) Dashboard hiện việc của user + **nhập % hoàn thành** thay nút Thao tác · 4) tự tạo việc → **modal «Tạo công việc»** · 5) đổi tên **«Danh sách công việc»** + **nút Nhận xét** + **modal chi tiết** + trưởng phòng **duyệt/làm lại** · 6) **tab «Được giao»** + thông báo + nút Hoàn thành · 7) **«Phòng ban/ Tổ đội»** 2 sub-tab + **audit** |
| OBJECTIVE | Bàn giao **kế hoạch chính xác từng việc** + **audit tab Phòng ban** trước khi sửa mã |
| PRIORITY | P0 (yêu cầu trực tiếp của user) |
| STATUS | **DONE** (kế hoạch + audit) — ⏳ **chờ user quyết A/B/C** (§5) |
| START / END | 2026-10-08 → 2026-10-08 |
| IMPLEMENTATION_SUMMARY | Đọc `WorkCenter.tsx` **toàn bộ 470 dòng** · `lib/menu-helpers.ts:118-141` · `app/page.tsx` (work routing `:442-457`, `:499-503`, `:598-609`, `:653`) · **BE** `OpsTaskManagementUseCase` (`:146-212` createWorkItem+queueTaskNotice · `:338-355` progress · `:357-388` status) ⇒ lập `docs/49`: **audit 4 khối tab Phòng ban** (3 khối là 3 cách nhìn cùng 1 tập dữ liệu) · **kế hoạch 7 việc có toạ độ dòng** · **đề xuất thứ tự 7 tab** · **4 rủi ro kỹ thuật** (TaskTable dùng chung 2 nơi · 6 tệp test có thể gãy · tab index phải khớp `activateModule` · 3 phiên cùng giữ) · **§4: 7 năng lực BE ĐÃ CÓ** vs **2 action PHẢI PORT** |
| FILES_CHANGED | `docs/49_KE_HOACH_7_VIEC_CONG_VIEC_VA_AUDIT_TAB_PHONG_BAN_20261008.md` (MỚI) · `SESSION_D/{TASK,EVENT}*` |
| RESULT | ⭐ **Tin tốt**: luật user yêu cầu ở việc 5/6 **đã cài sẵn ở BE** — nguyên văn *«Người thực hiện chỉ Gửi kiểm tra; Trưởng phòng/người có thẩm quyền mới xác nhận Hoàn thành.»* (`:369-370`) + thông báo khi giao (`queueTaskNotice`) và khi hoàn thành (`notifySafely("TASK_COMPLETED")`) · 🔴 **1 việc cần BE MỚI**: nút **Nhận xét** vì `add_work_item_comment` **đăng ký mà CHƯA CÀI** ⇒ **400** (đã có bằng chứng cũ: `MASTER_STATUS:732`, `TASK-187/210`, 4 dòng `tools/e2e/bien-chung.jsonl`) · ⇒ **5/7 việc là FE thuần**, 1 việc (6) FE thuần nhờ BE đã có, **1 việc (5) cần port BE** |
| TEST_REFERENCE | ⛔ chưa chạy (shell hỏng **vòng 10**) — §3 đã liệt kê **6 tệp test cần cập nhật cùng lượt** |
| REMAINING | ⏳ **User quyết (A) sửa profile DSH trước · (B) uỷ quyền phạm vi + làm ngay · (C) thiết kế thêm** + xác nhận 3 điểm ở `docs/49` §6 |
| NEXT_ACTION | ⛔ **Chờ user quyết** — ⛔ không sửa 3 tệp thuộc S01/S02/S03 khi chưa uỷ quyền, và ⛔ không đổi vân tay khi chưa chạy được `gd-cycle` |

---

## TASK-20261008-D15 — **TEST-IMPACT REGISTRY + SPEC PORT BE** (chuẩn bị thi hành 7 việc)

| Trường | Giá trị |
|---|---|
| TASK_ID | `TASK-20261008-D15` |
| DATE | 2026-10-08 |
| SESSION_ID | `ERP-SESSION-04` |
| MODULE | JOBS (WorkCenter/menu) + test hồi quy + BE task (comment/participant) |
| FEATURE | Giảm rủi ro cho 7 việc: (1) **test nào sẽ gãy** khi đổi tab/menu (2) **spec port** `add_work_item_comment` |
| OBJECTIVE | ⛔ để việc sửa mã không phá bộ hồi quy và ⛔ không phải điều tra lại khi thi hành |
| PRIORITY | P1 (de-risk cho go-live) |
| STATUS | **DONE** (phân tích) |
| START / END | 2026-10-08 → 2026-10-08 |
| IMPLEMENTATION_SUMMARY | Grep toàn bộ `tests/**` theo `WORK_TABS|workMenuItems|work-tab-|work_*` (66 kết quả) ⇒ **6 tệp test KHOÁ CỨNG cấu trúc hiện tại** (`t01:98/24-28` · `p5-01:25/42` · `t07:157` · `t08:144` · `t09:163/165`) + 2 tệp cần đọc (`mt3-ui-25` · `mt3-ui-29`) · đọc `scripts/system-route.mjs:1276-1314` (JS gốc 2 action) + `tests/work-item-comment-participant.test.ts:1-60` (hợp đồng + tự dựng lược đồ) ⇒ viết `docs/50`: **§1 registry 18 khẳng định** · **§2 spec port** (payload/validate/quyền/ghi/trả về) · **§3 thứ tự 6 bước an toàn** |
| FILES_CHANGED | `docs/50_TEST_IMPACT_VA_SPEC_PORT_BE_CONG_VIEC_20261008.md` (MỚI) · `SESSION_D/{TASK,EVENT,DECISION,WEEKLY}*` |
| RESULT | ⭐ **Xác định được: 5 việc (4·2·3·7 + phần lớn 5/6) ⛔ KHÔNG đụng test nào** ⇒ làm an toàn từng bước; ⚠️ **việc 1 rủi ro nhất** (6 tệp test + `page.tsx` + menu) ⇒ **xếp làm CUỐI** · ✅ **bảng `work_item_comments`/`work_item_participants` ĐÃ CÓ** (`tests/work-item-comment-participant.test.ts:54-57` tự dựng lược đồ từ `drizzle/`) ⇒ ⛔ **không cần migration** · ✅ **bootstrap Java ĐÃ trả 2 khoá** (`BootstrapDataAdapter:1628/1634`; `:1611-1612` nhánh rỗng; `:1625` ghi chú đúng về «chết âm thầm») ⇒ **đường ĐỌC xong** · 🔴 **Java CHƯA có `requireWorkItemAccess`** (chỉ JS `:501`) ⇒ port phải kèm guard 3 nhánh |
| TEST_REFERENCE | ⛔ chưa chạy (shell hỏng **vòng 11**); `docs/50` §1 là **danh sách test phải cập nhật cùng lượt** |
| REMAINING | ⏳ User (A)/(B)/(C) + 3 xác nhận (`docs/49` §6) — sau đó thi hành theo **6 bước** `docs/50` §3 |
| NEXT_ACTION | ⛔ Chờ user; ⛔ không sửa mã/test khi chưa chạy được `tsc`+`test:regression` |

---

## TASK-20261008-D16 — **RECIPE VIỆC 1** (hub «Công việc») theo **tiền lệ VÀNG nhóm «Kho»**

| Trường | Giá trị |
|---|---|
| TASK_ID | `TASK-20261008-D16` |
| DATE | 2026-10-08 |
| SESSION_ID | `ERP-SESSION-04` |
| MODULE | JOBS (menu `my_work` + `WorkCenter` + routing `page.tsx`) |
| FEATURE | Việc 1 của user: **gom 5 mục menu → 1 hub «Công việc»**, Dashboard lên đầu |
| OBJECTIVE | Biến việc **rủi ro nhất** thành **recipe 5 bước dán được** (⛔ không phải quyết định gì thêm khi thi hành) |
| PRIORITY | P1 |
| STATUS | **DONE** (recipe) |
| START / END | 2026-10-08 → 2026-10-08 |
| IMPLEMENTATION_SUMMARY | Phát hiện ⭐ **TIỀN LỆ VÀNG**: nhóm «Kho» **đã gom 7 → 1** và *«dashboard nay là TAB ĐẦU của hub `Inventory.tsx`»* (`tests/mt3-ui-29:52-56`, `ERP-SESSION-02 · TASK-226`) ⇒ việc 1 = **lặp lại khuôn đã được duyệt**, ⛔ không phải thiết kế mới · đọc `HUB_TAB_GROUP_KEYS:369-383` ⇒ `my_work` vào danh sách **nhờ 5 mục** (`:371`) nên **gom còn 1 mục ⇒ BẮT BUỘC rút `my_work`** (luật `:363-368` + test `mt3-ui-25` ①②) · đọc `page.tsx:499-503` ⇒ **`moduleKey = permissionKeys đầu tiên xem được** ⇒ mục hub **PHẢI hợp 6 khoá** của 5 mục cũ, ⛔ nếu thiếu là **nhân viên mất luôn menu** · viết `docs/51`: recipe 5 bước + bảng **old→new** cập nhật 7 tệp test + **2 câu hỏi phải chốt** |
| FILES_CHANGED | `docs/51_RECIPE_VIEC_1_HUB_CONG_VIEC_20261008.md` (MỚI) · `SESSION_D/{TASK,EVENT,WEEKLY}*` |
| RESULT | ⭐ Recipe dán được: **(1)** 1 mục `work_hub` (giữ nguyên chuỗi khai báo kiểu — test `t10:78`) **(2)** rút `my_work` khỏi `HUB_TAB_GROUP_KEYS` + sửa chú thích số liệu **(3)** ⛔ không đổi `legacyWorkMenuKeys` **(4)** dải 7 tab Dashboard-đầu + cập nhật **6 nhánh `tab === n`** (⚠️ chỗ dễ sót nhất) **(5)** kiểm `activateModule` trước khi sửa |
| TEST_REFERENCE | ⛔ chưa chạy (shell hỏng **vòng 12**); `docs/51` §3 có bảng old→new cho `t01`·`p5-01`·`t07`·`t08`·`t09`·`mt3-ui-25`·`mt3-ui-29` |
| REMAINING | ⚠️ **2 điểm phải đọc khi thi hành** (⛔ tôi ⛔ không khẳng định thay): khối `activateModule` `page.tsx:598-609` · **khuôn nhãn** nhóm Kho `menu-helpers:162-188` (tránh sidebar «Công việc → Công việc») |
| NEXT_ACTION | ⛔ Chờ user: (A)/(B)/(C) + xác nhận **thứ tự 7 tab** + **Kanban/Cây** + **Nhận xét** |

---

## TASK-20261008-D17 — **ĐÓNG 2 ẨN SỐ của recipe việc 1** + **PHÁT HIỆN BẪY `workCenterViewFor`**

| Trường | Giá trị |
|---|---|
| TASK_ID | `TASK-20261008-D17` |
| DATE | 2026-10-08 |
| SESSION_ID | `ERP-SESSION-04` |
| MODULE | JOBS (`app/page.tsx` điều hướng · `lib/menu-helpers.ts` khuôn Kho) |
| FEATURE | Xác minh 2 điểm `docs/51` để ngỏ: `activateModule` + khuôn nhãn/key của nhóm Kho |
| OBJECTIVE | Recipe việc 1 **hết ẩn số** ⇒ khi được phép là thi hành máy móc |
| PRIORITY | P1 |
| STATUS | **DONE** |
| START / END | 2026-10-08 → 2026-10-08 |
| IMPLEMENTATION_SUMMARY | Đọc `page.tsx:596-641` (`activateModule`) + `:442-457` (`workCenterViewFor`) + `menu-helpers.ts:160-189` (khối Kho) ⇒ ✅ **`view:"dashboard"` CÓ set `workView`** (`:602`) ⇒ ⛔ `page.tsx` **không cần sửa cho điều hướng** · 🔴 **PHÁT HIỆN BẪY**: `workCenterViewFor` kiểm **`active` TRƯỚC `view`** (`:448` vs `:452`) ⇒ vì mục hub có `moduleKey` = **khoá quyền ĐẦU TIÊN xem được** (`:499-503`), nhân viên thường (`dept_plan_tasks`) ⇒ hàm trả **`"personal"`** ⇒ **bấm «Công việc» mở tab Cá nhân, ⛔ KHÔNG phải Dashboard** ⇒ thêm **Bước 6** (đảo 2 nhánh, kèm lý do an toàn + phòng thủ 2 lớp) · ✅ khuôn Kho trả lời luôn 2 câu hỏi: **`key:"warehouse_hub"`** + **`label` mô tả màn** (`"Kho vật tư"`) ⇒ đề xuất `key:"work_hub"` |
| FILES_CHANGED | `docs/51_RECIPE_VIEC_1_HUB_CONG_VIEC_20261008.md` (cập nhật §2 Bước 5-6 + §3.1) · `SESSION_D/{TASK,EVENT,WEEKLY}*` |
| RESULT | 🔴 **Tránh được 1 lỗi sẽ ship**: nếu chỉ làm theo `docs/49`/`docs/51` bản cũ thì **Dashboard ⛔ không mở** với phần lớn nhân viên (triệu chứng «tab Dashboard ở đầu mà ⛔ không vào Dashboard») · ✅ Recipe nay **6 bước, hết ẩn số** |
| TEST_REFERENCE | ⛔ chưa chạy (shell hỏng **vòng 13**) — ⚠️ `tests/t01:104-111` đọc **mã hàm** `workCenterViewFor` ⇒ **phải chạy lại** sau khi đảo nhánh |
| REMAINING | ⏳ User (A)/(B)/(C) + 3 xác nhận |
| NEXT_ACTION | ⛔ Chờ user; nếu chọn (B) ⇒ thi hành **6 bước** `docs/51` §2 theo thứ tự `docs/50` §3 (việc 1 CUỐI) |

---

## TASK-20261008-D18 — **RECIPE VIỆC 2·3·4** + 2 PHÁT HIỆN MỚI (gỡ rủi ro + 1 bug thật)

| Trường | Giá trị |
|---|---|
| TASK_ID | `TASK-20261008-D18` |
| DATE | 2026-10-08 |
| SESSION_ID | `ERP-SESSION-04` |
| MODULE | JOBS (`app/screens/WorkCenter.tsx` · `app/components/ui/ListToolbar.tsx` đọc) |
| FEATURE | Đưa việc **2 (search xuống) · 3 (nhập % + Dashboard hiện việc của tôi) · 4 (modal «Tạo công việc»)** lên mức **dán được** |
| OBJECTIVE | ⛔ không phải quyết định gì thêm khi thi hành; ⛔ không phá test/hồi quy |
| PRIORITY | P1 |
| STATUS | **DONE** (recipe) |
| START / END | 2026-10-08 → 2026-10-08 |
| IMPLEMENTATION_SUMMARY | `grep TaskTable app/page.tsx` ⇒ **CHỈ dòng 107 (import), ⛔ không render** ⇒ ⭐ **gỡ rủi ro "dùng chung"**: sửa cột c9 **an toàn**, ⛔ không cần prop `mode` · đọc `ListToolbar.tsx:58` ⇒ **`search` là prop TUỲ CHỌN** ⇒ việc 2 ⛔ **không đụng file dùng chung** (⚠️ `tests/ad09:56` khoá chuỗi `export function ListToolbar(`) · đọc `WorkCenter.tsx:401-446` (tab Dashboard + `TaskTable`) + `:318-345` (form tự tạo việc) ⇒ viết `docs/52`: **3 recipe dán được** (đổi cột c9 thành `ProgressCell` nhập %; thêm `TaskTable` vào tab Dashboard; chuyển form vào modal) |
| FILES_CHANGED | `docs/52_RECIPE_VIEC_2_3_4_20261008.md` (MỚI) · `SESSION_D/{TASK,EVENT,WEEKLY}*` |
| RESULT | 🔴 **BUG THẬT MỚI (P-12)**: nút «Xong» (`WorkCenter.tsx:445`) gửi `COMPLETED` — nhưng BE **CHẶN người thực hiện** (`:369-370`) ⇒ **nút hứa việc hệ thống ⛔ không cho** ⇒ sửa = người thực hiện gửi **`SUBMITTED`**, trưởng phòng mới `COMPLETED` (đưa vào **việc 3** + là nền của **việc 5·6**) · ⭐ **3 việc 2·3·4 chỉ sửa DUY NHẤT `WorkCenter.tsx`** ⇒ phạm vi xin uỷ quyền **thu hẹp từ 3 tệp → 1 tệp** |
| TEST_REFERENCE | ⛔ chưa chạy (shell hỏng **vòng 14**) — **⛔ không test nào khoá** cột c9 / vị trí search / form inline ⇒ 3 việc này **0 test phải sửa** |
| REMAINING | ⏳ User (A)/(B)/(C) + 3 xác nhận; ⚠️ cần **uỷ quyền 1 tệp** (`WorkCenter.tsx` — S03) cho 3 việc 2·3·4; **việc 1** vẫn cần 2 tệp còn lại |
| NEXT_ACTION | ⛔ Chờ user; khi có ⇒ làm **B1 việc 4 → B2 việc 2 → B3 việc 3** (`docs/52` §5) trước, rồi mới tới việc 1 (cuối) |

---

## TASK-20261008-D19 — **RECIPE VIỆC 7 + 5·6** ⇒ **hoàn tất bộ recipe cho cả 7 việc**

| Trường | Giá trị |
|---|---|
| TASK_ID | `TASK-20261008-D19` |
| DATE | 2026-10-08 |
| SESSION_ID | `ERP-SESSION-04` |
| MODULE | JOBS (`WorkCenter.tsx` · thông báo `page.tsx`) |
| FEATURE | Việc **7** («Phòng ban/ Tổ đội» 2 sub-tab) + việc **5·6** (chi tiết · nhận xét · tab «Được giao» · duyệt/làm lại) |
| OBJECTIVE | 2 việc cuối lên mức **dán được** ⇒ **cả 7 việc đều có recipe** |
| PRIORITY | P1 |
| STATUS | **DONE** (recipe) |
| START / END | 2026-10-08 → 2026-10-08 |
| IMPLEMENTATION_SUMMARY | Grep `page.tsx` cho `taskNotifications` ⇒ ✅ **thông báo web ĐÃ CÓ SẴN**: `:568` `unreadTaskNotifications` (đếm chưa đọc) + `:581` map `taskNotifications` vào trung tâm thông báo + `:723/734` xử lý đã đọc ⇒ **việc 6 ⛔ không phải viết phần thông báo** · đọc `WorkCenter.tsx:100-149` (`PERSONAL_GROUPS` + `personalWorkGroups`) ⇒ ⭐ tab «Được giao» **dùng LẠI `personalGroups[1].rows`**, ⛔ không viết lại logic và ⛔ **không sửa khối T05** (test `t05` đọc + chạy khối này) · viết `docs/53`: recipe sub-tab 2 phòng ban · tab «Được giao» · **modal chi tiết** (dùng `workItemEvents` + `workItemComments` **đã có trong payload**) · nút **`SUBMITTED`** cho người thực hiện / **`COMPLETED` + `REWORK`** cho trưởng phòng · hằng `COMMENTS_READY=false` ⛔ chống «nút chết» |
| FILES_CHANGED | `docs/53_RECIPE_VIEC_7_VA_5_6_20261008.md` (MỚI) · `SESSION_D/{TASK,EVENT,WEEKLY}*` |
| RESULT | ⭐ **Cả 7 việc nay có recipe dán được** (`docs/51`·`52`·`53`) · ✅ **việc 6 phần thông báo = đã xong sẵn** (BE `queueTaskNotice` + `notifySafely("TASK_COMPLETED")` ↔ FE `taskNotifications`) · ✅ modal chi tiết **⛔ không gọi API mới** (`workItemComments`/`workItemEvents` **đã có trong bootstrap**) · ⚠️ **việc 7**: chỉ **phương án (A) «chế độ xem»** là an toàn; **bỏ hẳn Kanban/Cây sẽ làm ĐỎ `t07`/`t09`** (2 test bắt buộc `<WorkKanban`/`<WorkHierarchy` **vẫn tồn tại**) |
| TEST_REFERENCE | ⛔ chưa chạy (shell hỏng **vòng 15**) — `docs/53` §4 có bảng **test phải sửa theo từng việc** |
| REMAINING | ⏳ User (A)/(B)/(C) + 3 xác nhận; khi làm việc 5 phải **port BE `add_work_item_comment`** (`docs/50` §2) rồi mới bật `COMMENTS_READY` |
| NEXT_ACTION | ⛔ Chờ user. Khi có ⇒ thứ tự: **việc 4 → 2 → 3 → 7 → 5·6 → 1 (cuối)**; mỗi lượt `tsc` + `test:regression` + `gd-cycle` |

---

## TASK-20261008-D20 — **RUNBOOK THI HÀNH** (artefact để LÀM, ⛔ không phải để đọc)

| Trường | Giá trị |
|---|---|
| TASK_ID | `TASK-20261008-D20` |
| DATE | 2026-10-08 |
| SESSION_ID | `ERP-SESSION-04` |
| MODULE | JOBS — quy trình thi hành 7 việc |
| FEATURE | Gộp 5 tài liệu spec thành **1 runbook dùng để thi hành** |
| OBJECTIVE | Phiên thi hành (S01 hoặc phiên sau) chỉ việc **theo bước**, ⛔ không phải đọc lại 5 tài liệu |
| PRIORITY | P1 |
| STATUS | **DONE** |
| START / END | 2026-10-08 → 2026-10-08 |
| IMPLEMENTATION_SUMMARY | Viết `docs/54`: **§0 4 điều kiện tiên quyết** (P1 shell sống · P2 uỷ quyền phạm vi · P3 `git status` + ⛔ cấm lệnh phá hoại · P4 user chốt 3 điểm) kèm **lệnh chuẩn sau mỗi lượt** · **§1 thứ tự 6 lượt** (L1 việc 4 → L6 việc 1) · **§2 định dạng Do/Verify/Rollback** cho từng lượt (L3 có **đối chứng âm**; L6 có **4 ca kiểm bắt đúng bẫy**; L5 chốt `COMMENTS_READY` **chỉ bật sau khi port BE**) · **§3 Definition of Done** · **§4 5 nhánh đặc biệt** (shell còn hỏng · chỉ cấp 1 tệp ⇒ làm L1-L5, hoãn L6 · user bỏ hẳn Kanban ⇒ sửa `t07`/`t09` · làm P-08 trước · phiên khác giữ tệp ⇒ HANDOFF) · **§5 3 bẫy đã bắt được** |
| FILES_CHANGED | `docs/54_RUNBOOK_THI_HANH_7_VIEC_CONG_VIEC_20261008.md` (MỚI) · `SESSION_D/{TASK,EVENT,WEEKLY}*` |
| RESULT | ⭐ Từ đây **không còn artefact chuẩn bị nào cần thêm**: 7/7 recipe + **runbook thi hành** + test-impact + patch pack P-08 + 2 cổng tĩnh; mọi việc còn lại **phụ thuộc shell hoặc quyết định của user** |
| TEST_REFERENCE | ⛔ chưa chạy (shell hỏng **vòng 16**) |
| REMAINING | ⏳ P1 (shell) + P2 (uỷ quyền) + P4 (3 xác nhận) |
| NEXT_ACTION | ⛔ **Dừng chuẩn bị** — chờ user; ⛔ không tạo thêm tài liệu kế hoạch (⛔ tránh lặp thông tin) |

---

## TASK-20261008-D21 — **KIỂM CLASS CSS CỦA 3 RECIPE** (bắt 1 lỗi class tự bịa)

| Trường | Giá trị |
|---|---|
| TASK_ID | `TASK-20261008-D21` |
| DATE | 2026-10-08 |
| SESSION_ID | `ERP-SESSION-04` |
| MODULE | UI — `app/styles/canonical.css` · `app/globals.css` (đọc) |
| FEATURE | Kiểm mọi **class CSS** dùng trong `docs/52`·`docs/53` có **tồn tại thật** ⛔ không |
| OBJECTIVE | ⛔ không để recipe ship **class CSS bịa** ⇒ giao diện hỏng/nút không có focus ring |
| PRIORITY | P1 (chất lượng mã dán) |
| STATUS | **DONE** |
| START / END | 2026-10-08 → 2026-10-08 |
| IMPLEMENTATION_SUMMARY | Grep `app/**/*.css` cho 19 class mà 3 recipe dùng ⇒ 🔴 **bắt được 1 lỗi**: `link-like` là **class tôi tự bịa** (⛔ không tồn tại) — repo có sẵn **`.link-cell`** (`canonical.css:1084`, hover `:1089`, **focus-visible** `:1090`) ⇒ **sửa `docs/53` §3.2** thành `className="link-cell code"` · ✅ còn lại **đều có thật**: `project-scope-tabs` (**⭐ đã style riêng cho `.work-center`** `:452-466` + responsive `:512`) · `list-toolbar` `:745` · `modal` `:1120/1294` · `stack` `:151` · `card` `:181` · `row-actions` `:268` · `form-grid` `:261` · `task-bar` `:473` · `export-mini` `:113` · `kpi-grid` `:284` · ghi thành **§5 bảng kiểm class** trong `docs/53` |
| FILES_CHANGED | `docs/53_RECIPE_VIEC_7_VA_5_6_20261008.md` (§3.2 sửa class + thêm §5) · `SESSION_D/{TASK,EVENT,WEEKLY}*` |
| RESULT | ⭐ **Kết luận quan trọng**: ngoài 1 class đã sửa, **mọi class đều có sẵn** ⇒ ⛔ **không phải thêm CSS** ⇒ ⛔ **không đụng `app/globals.css`** (file dùng chung) — ⭐ tránh được một rủi ro cho **cả cụm** · ⭐ phát hiện phụ: màn Công việc **đã có style riêng cho tab bar** ⇒ dải 7 tab + 2 sub-tab **tự đúng kiểu**, ⛔ không cần CSS mới |
| TEST_REFERENCE | ⛔ chưa chạy (shell hỏng **vòng 17**) — phép kiểm là **grep CSS** (đối tượng tĩnh) |
| REMAINING | ⏳ User (A)/(B)/(C) + 3 xác nhận |
| NEXT_ACTION | ⛔ Không còn việc chuẩn bị; chờ user/shell |

---

## TASK-20261008-D22 — **KIỂM QUY ƯỚC MODAL** (sửa `CardHead` → `.modal-head` trong 2 recipe)

| Trường | Giá trị |
|---|---|
| TASK_ID | `TASK-20261008-D22` |
| DATE | 2026-10-08 |
| SESSION_ID | `ERP-SESSION-04` |
| MODULE | UI — quy ước modal (`app/styles/canonical.css` · các màn đang chạy) |
| FEATURE | Kiểm 2 modal trong recipe có **đúng quy ước modal của repo** ⛔ |
| OBJECTIVE | ⛔ không để recipe dán vào ra modal **lệch chuẩn / thiếu nút đóng a11y** |
| PRIORITY | P1 |
| STATUS | **DONE** |
| START / END | 2026-10-08 → 2026-10-08 |
| IMPLEMENTATION_SUMMARY | Grep `app/**/*.tsx` cho `modal-head|aria-label="Đóng"|className="modal"` ⇒ **quy ước repo**: tiêu đề modal dùng **`.modal-head`** + nút **`✕` có `aria-label="Đóng"`** (`ConstructionScreen.tsx:57` · `EntityDetailModal.tsx:118` · `ErrorReportModal.tsx:87`) và hành động trong **`footer.modal-actions`** (`Inventory.tsx:681`) ⇒ 🔴 **2 recipe của tôi đang dùng `CardHead` trong modal (⛔ không đúng chuẩn + ⛔ thiếu nút đóng a11y)** ⇒ **sửa cả 2**: `docs/52` §4.4 (modal «Tạo công việc») + `docs/53` §3.2 (modal chi tiết) chuyển sang `.modal-head` + `<p className="muted">` cho phần phụ + `footer.modal-actions` |
| FILES_CHANGED | `docs/52_RECIPE_VIEC_2_3_4_20261008.md` · `docs/53_RECIPE_VIEC_7_VA_5_6_20261008.md` · `SESSION_D/{TASK,EVENT,WEEKLY}*` |
| RESULT | ✅ 2 modal nay **đúng chuẩn repo** (`.modal-head` có trong `canonical.css:197`/`:203`/`:207`) + ✅ **có nút đóng `aria-label="Đóng"`** (a11y) + ✅ hành động ở `footer.modal-actions` ⇒ dán vào là **giống các modal đang chạy**, ⛔ không phải sửa CSS |
| TEST_REFERENCE | ⛔ chưa chạy (shell hỏng **vòng 18**) — phép kiểm là **grep mã + grep CSS** |
| REMAINING | ⏳ User (A)/(B)/(C) + 3 xác nhận |
| NEXT_ACTION | ⛔ Không còn việc chuẩn bị |

---

## TASK-20261008-D23 — **KIỂM CHỮ KÝ `WorkCenter` + `send`/`action`** (chốt hành vi đóng modal)

| Trường | Giá trị |
|---|---|
| TASK_ID | `TASK-20261008-D23` |
| DATE | 2026-10-08 |
| SESSION_ID | `ERP-SESSION-04` |
| MODULE | JOBS — `app/page.tsx` (chỗ truyền prop) · `app/screens/WorkCenter.tsx` |
| FEATURE | Chốt **`send` vs `action`** ⇒ quyết định được hành vi **đóng modal khi gửi thành công** |
| OBJECTIVE | ⛔ không để recipe chứa **giả định chưa kiểm** về kiểu trả về |
| PRIORITY | P1 |
| STATUS | **DONE** |
| START / END | 2026-10-08 → 2026-10-08 |
| IMPLEMENTATION_SUMMARY | Đọc `page.tsx:741` ⇒ truyền **`action`** (⛔ không phải `send`) cho `WorkCenter` · grep `WorkCenter.tsx` ⇒ **chữ ký thật** `function WorkCenter({ data, action, refresh, view = "personal" })` (`:197`, `action` trả **`Promise<boolean>`**) + wrapper nội bộ **`async function send(name, payload, form?)`** (`:233`) ⇒ cập nhật `docs/52` §4.4: nêu **2 lựa chọn** (khuyến nghị: `send` + đóng ngay; hoặc `action` + **bắt buộc thêm `refresh()`**) |
| FILES_CHANGED | `docs/52_RECIPE_VIEC_2_3_4_20261008.md` (§4.4) · `SESSION_D/{TASK,EVENT,WEEKLY}*` |
| RESULT | ✅ **Hết giả định**: `action` (boolean) **có** trong scope ⇒ đóng-modal-khi-thành-công **làm được**, ⚠️ nhưng phải gọi kèm `refresh()` · ✅ phát hiện kèm: **`view` mặc định `"personal"`** (`:197`) ⇒ khớp việc **Bước 4** phải đổi `"dashboard"` (test `p5-01:42` kiểm chuỗi này) |
| TEST_REFERENCE | ⛔ chưa chạy (shell hỏng **vòng 19**) — phép kiểm là **đọc mã + grep chữ ký** |
| REMAINING | ⏳ User (A)/(B)/(C) + 3 xác nhận |
| NEXT_ACTION | ⛔ Không còn việc chuẩn bị |

---

## TASK-20261008-D24 — **XÁC MINH `send` + CẬP NHẬT SHARED STATE** (2 sổ đăng ký)

| Trường | Giá trị |
|---|---|
| TASK_ID | `TASK-20261008-D24` |
| DATE | 2026-10-08 |
| SESSION_ID | `ERP-SESSION-04` |
| MODULE | JOBS (`WorkCenter.tsx`) + STATE CHUNG (`docs/dsh-state/SESSION_REGISTRY.md` · `SHARED_STATE.md`) |
| FEATURE | ① Xác minh `send` làm gì (recipe L1 đang khẳng định nó reset form + refresh) ② Cập nhật trạng thái phiên vào 2 sổ chung (đang cũ so với 18 tài liệu) |
| OBJECTIVE | Đóng ẩn số cuối của recipe + ⛔ để phiên khác ⛔ không làm lại việc đã có |
| PRIORITY | P1 |
| STATUS | **DONE** |
| START / END | 2026-10-08 → 2026-10-08 |
| IMPLEMENTATION_SUMMARY | Đọc `WorkCenter.tsx:233-238` ⇒ **`send` xác nhận**: `setBusy(true)` → `ok = await action(...)` → `setBusy(false)` → **`if (ok) { form?.reset(); refresh(); }`** ⇒ ✅ recipe L1 **ĐÚNG** (dùng `send` là lo form + refresh) và ✅ **chỉ refresh khi thành công** · ✅ kèm xác nhận `:231` — `find()` lọc theo `taskNo`/`title`/`assignedToName` ⇒ hợp với việc 2 · **APPEND** vào `docs/dsh-state/SESSION_REGISTRY.md` (khối «🔄 CẬP NHẬT») + `SHARED_STATE.md` (**CẬP NHẬT 25**, mục 77'–81') |
| FILES_CHANGED | `docs/dsh-state/SESSION_REGISTRY.md` (APPEND) · `docs/dsh-mutil-session/SHARED_STATE.md` (APPEND) · `SESSION_D/{TASK,EVENT,WEEKLY}*` |
| RESULT | ✅ **Hết ẩn số về `send`** · ⭐ **STATE CHUNG nay đủ để phiên khác làm tiếp ⛔ không điều tra lại**: 18 tài liệu · **3 bẫy** · **6 luật repo đã kiểm** (modal/`.link-cell`/`action`/`HUB_TAB_GROUP_KEYS`/`TaskTable`/4 test khoá tab) · **2 bug HIGH** · **2 chặn** + đề nghị STALE nếu S01/S02/S03 đã chết |
| TEST_REFERENCE | ⛔ chưa chạy (shell hỏng **vòng 20**) — phép kiểm là **đọc mã** (không phải suy đoán) |
| REMAINING | ⏳ User (A)/(B)/(C) + 3 xác nhận |
| NEXT_ACTION | ⛔ Không còn việc chuẩn bị — ⭐ STATE CHUNG đã đồng bộ với thực tế |

---

## TASK-20261008-D25 — **LỖI THỨ 4 TỰ BẮT: THỨ TỰ RUNBOOK vs CHỈ SỐ TAB** (đã sửa)

| Trường | Giá trị |
|---|---|
| TASK_ID | `TASK-20261008-D25` |
| DATE | 2026-10-08 |
| SESSION_ID | `ERP-SESSION-04` |
| MODULE | JOBS — `WorkCenter.tsx` (dải tab) + RUNBOOK `docs/54` |
| FEATURE | Kiểm nhánh `WORK_TABS`/`WORK_TAB_OF_VIEW` **trực tiếp** (điểm duy nhất còn chưa đọc trong Bước 4) |
| OBJECTIVE | ⛔ không để runbook tự mâu thuẫn (recipe dùng chỉ số tab của layout **chưa tồn tại** ở thời điểm đó) |
| PRIORITY | **P0** (nếu ⛔ không sửa: thi hành theo runbook sẽ **chèn nhầm tab**) |
| STATUS | **DONE** |
| START / END | 2026-10-08 → 2026-10-08 |
| IMPLEMENTATION_SUMMARY | Đọc `WorkCenter.tsx:86-98` ⇒ ✅ **xác nhận đúng tên + nội dung**: `WORK_TABS` (`:92`) = `["Cá nhân","Dự án","Phòng ban","Giao việc","Dashboard","Báo cáo"]` · `WORK_TAB_OF_VIEW` (`:96`) = `Record<WorkMenuView, number> = { personal:0, department:2, assign:3, kpi:4, dashboard:4, reports:5 }` ⇒ 🔴 **phát hiện mâu thuẫn**: recipe việc 7 (§2 `{tab === 3}`) và việc 6 (§3.1 `{tab === 2}`) viết theo **layout 7 tab**, nhưng runbook xếp chúng **trước** bước đổi dải tab ⇒ theo thứ tự cũ sẽ **chèn nhầm tab** (tab 2 = «Phòng ban» cũ, tab 3 = «Giao việc» cũ) ⇒ **SỬA**: ① tách việc 1 thành **L4 (dải tab)** + **L7 (hub menu + `workCenterViewFor`)** ② thêm **§1.1 bảng chỉ số tab theo từng layout** ③ ghi rõ **tab «Được giao» ⛔ KHÔNG cần khoá `view` mới** (vì `WORK_TAB_OF_VIEW` là `Record<WorkMenuView,…>` và tab mới chỉ mở bằng bấm tab bar) ⇒ ⛔ **không phải sửa `menu-helpers.ts`** cho việc 6 |
| FILES_CHANGED | `docs/54_RUNBOOK_THI_HANH_7_VIEC_CONG_VIEC_20261008.md` (§1 + §1.1) · `docs/53_RECIPE_VIEC_7_VA_5_6_20261008.md` (cảnh báo chỉ số) · `SESSION_D/{TASK,EVENT,DECISION,WEEKLY}*` |
| RESULT | ⭐ **Runbook nay tự nhất quán**: L1→L3 (⛔ 0 test) → **L4 dải tab (+ 4 test)** → L5 việc 7 → L6 việc 5·6 → **L7 hub menu** · ✅ Kèm loại bỏ **1 phụ thuộc giả** (việc 6 tưởng phải sửa `menu-helpers.ts` — thực tế **⛔ không**) |
| TEST_REFERENCE | ⛔ chưa chạy (shell hỏng **vòng 21**) — phép kiểm là **đọc mã** (`:86-98`) |
| REMAINING | ⏳ User (A)/(B)/(C) + 3 xác nhận |
| NEXT_ACTION | ⛔ Không còn việc chuẩn bị |

---

## TASK-20261008-D26 — **SPEC PORT `requireWorkItemAccess`: 3 → ĐÚNG 5 NHÁNH** (lỗi thứ 5 tự bắt)

| Trường | Giá trị |
|---|---|
| TASK_ID | `TASK-20261008-D26` |
| DATE | 2026-10-08 |
| SESSION_ID | `ERP-SESSION-04` |
| MODULE | JOBS — BE port (`add_work_item_comment` · `set_work_item_participant`) |
| FEATURE | Đọc **mã gốc JS** của guard `requireWorkItemAccess` để spec port **chính xác** |
| OBJECTIVE | ⛔ không để Java port **thiếu nhánh quyền** (＝ thay đổi luật nghiệp vụ khi cutover) |
| PRIORITY | **P0** (port sai = **lệch luật** giữa JS và Java đúng lúc go-live) |
| STATUS | **DONE** |
| START / END | 2026-10-08 → 2026-10-08 |
| IMPLEMENTATION_SUMMARY | Đọc `scripts/system-route.mjs:498-515` ⇒ 🔴 **spec cũ của tôi ghi «3 nhánh» là THIẾU — mã gốc có ĐÚNG 5 NHÁNH**: ① admin · ② người được giao · ③ **trưởng phòng của CHÍNH phòng nhiệm vụ** · ④ **người tham gia** (⚠️ **chỉ** hợp lệ mode `comment`) · ⑤ **quyền module** với capability **`canUse` (comment) / `canEdit` (participant)** ⇒ cập nhật `docs/50` (**§2.4 mới**: bảng 5 nhánh + 2 **thông điệp lỗi** khác nhau theo mode + 3 hệ quả cho port Java) |
| FILES_CHANGED | `docs/50_TEST_IMPACT_VA_SPEC_PORT_BE_CONG_VIEC_20261008.md` (§2.2 row + **§2.4**) · `SESSION_D/{TASK,EVENT,WEEKLY}*` |
| RESULT | ⭐ **Bắt được 2 điểm sẽ gây lệch luật nếu port máy móc**: ① ⛔ **đừng bỏ nhánh ④** (người tham gia **bình luận được** nhưng ⛔ **không điều phối được** — đúng ý nghĩa «hỗ trợ liên phòng» của `WorkHierarchy`) ② ⚠️ **`set_work_item_participant` phải nâng capability `canUse` → `canEdit`** ở `ActionRbacRegistry:310`, nếu ⛔ không thì người có `canUse` **thêm được người tham gia** = **rộng hơn bản JS** |
| TEST_REFERENCE | ⛔ chưa chạy (shell hỏng **vòng 22**) — phép kiểm là **đọc mã gốc JS** |
| REMAINING | ⏳ User (A)/(B)/(C) + 3 xác nhận; khi port phải làm đủ **5 nhánh + 2 thông điệp + nâng capability** |
| NEXT_ACTION | ⛔ Không còn việc chuẩn bị |

---

## TASK-20261008-D27 — **BỘ TEST SẴN DÁN** cho 7 việc (đúng quy ước «thay đổi phải có test»)

| Trường | Giá trị |
|---|---|
| TASK_ID | `TASK-20261008-D27` |
| DATE | 2026-10-08 |
| SESSION_ID | `ERP-SESSION-04` |
| MODULE | TEST (JOBS — tiến độ/duyệt/điều hướng dải tab) |
| FEATURE | Viết **2 tệp test HOÀN CHỈNH sẵn dán** (`t11` · `t12`) cho hành vi MỚI của 7 việc |
| OBJECTIVE | ⛔ không để thay đổi ship **thiếu test** (đúng quy ước repo); ⛔ không tạo tệp trong `tests/**` khi shell còn hỏng (vân tay ⇒ `gd-cycle`) |
| PRIORITY | P1 |
| STATUS | **DONE** (nội dung test hoàn chỉnh, ⛔ chưa tạo tệp) |
| START / END | 2026-10-08 → 2026-10-08 |
| IMPLEMENTATION_SUMMARY | Đọc **khuôn khung** từ `tests/t08-work-dashboard.test.mjs:1-26` (`read()` helper + **quy ước `:11`**: tệp mới **cố ý ⛔ không nằm trong `package.json`** để giữ số ca hồi quy) ⇒ viết `docs/55`: **`t11-work-progress-approval`** (test 0 **ĐỐI CHỨNG ÂM** + 8 khẳng định: cấm quay lại 4 nút preset · `ProgressCell` cấp module + `type="number"` · **`SUBMITTED`** cho người thực hiện + `COMPLETED` **chỉ sau** nhánh `canApprove` · `canApproveRow` suy từ `managerDepartments` · đổi tên «Danh sách công việc» · tab Dashboard render `TaskTable` của `mine` · tab «Được giao» dùng **`personalGroups[1].rows`** · modal `.modal-head` + `aria-label="Đóng"` + ⛔ không `link-like` · cổng `COMMENTS_READY=false`) + **`t12-work-tabs-and-modal-convention`** (dải 7 tab **đúng 1 lần** · `WORK_TAB_OF_VIEW` giữ alias `kpi` = 0 · **⛔ không nhánh `tab === n` vượt số tab** · **test riêng cho BẪY `workCenterViewFor`**: `view==="dashboard"` phải đứng **TRƯỚC** nhánh `dept_plan_tasks`) |
| FILES_CHANGED | `docs/55_TEST_SAN_DAN_CHO_7_VIEC_20261008.md` (MỚI) · `SESSION_D/{TASK,EVENT,WEEKLY}*` |
| RESULT | ⭐ **Bịt nốt lỗ hổng «ship thiếu test»**: nếu vá theo `docs/51`-`54` mà ⛔ không có test thì lỗi D05 **có thể quay lại** (nút lại gửi `COMPLETED` vô điều kiện) — `t11` **chặn đúng** điều đó · ✅ Kèm **cổng canary** `COMMENTS_READY` ⇒ khi port BE xong **buộc cập nhật test** (⛔ không tắt cổng) · ✅ `t12` có **test riêng cho bẫy `workCenterViewFor`** (bẫy tôi tự bắt ở vòng 14) |
| TEST_REFERENCE | ⛔ chưa chạy được (shell hỏng **vòng 23**) — ⚠️ **khi dán + chạy TRƯỚC khi vá thì ĐỎ là ĐÚNG Ý ĐỒ** (test khoá hành vi MỚI) |
| REMAINING | ⏳ User (A)/(B)/(C) + 3 xác nhận; khi có shell ⇒ dán 2 tệp + chạy `node --test` riêng (⛔ không thêm vào `package.json`) |
| NEXT_ACTION | ⛔ Không còn artefact chuẩn bị nào — ⭐ bộ bàn giao đã ĐẦY ĐỦ |

---

## TASK-20261008-D28 — **KỊCH BẢN UAT THỦ CÔNG** (đường kiểm định DUY NHẤT khi shell hỏng) + 2 sửa khớp recipe↔test

| Trường | Giá trị |
|---|---|
| TASK_ID | `TASK-20261008-D28` |
| DATE | 2026-10-08 |
| SESSION_ID | `ERP-SESSION-04` |
| MODULE | JOBS — kiểm thủ công (UAT) 7 việc |
| FEATURE | **10 kịch bản bấm-thật** + **7 ca biên** + **bảng dấu hiệu sai ⇒ chỉ đúng tài liệu** + mẫu ghi bằng chứng |
| OBJECTIVE | ⛔ không có shell ⇒ ⭐ **kiểm thủ công theo kịch bản là đường verify DUY NHẤT**; đồng thời là **UAT go-live** |
| PRIORITY | P1 |
| STATUS | **DONE** |
| START / END | 2026-10-08 → 2026-10-08 |
| IMPLEMENTATION_SUMMARY | Viết `docs/56`: **§0 chuẩn bị** (3 tài khoản **theo vai** + 1 nhiệm vụ mẫu + **mở Console** ⭐ để bắt lỗi im lặng) · **§1 bảng K1→K10** (mỗi kịch bản có *kết quả MONG ĐỢI* + ô điền thực tế; **K2 = bẫy `workCenterViewFor`**, **K5 = `BUG-D05`**, **K10 = cổng `COMMENTS_READY`**) · **§2 7 ca biên** (mất menu khi ⛔ không có quyền · nhập % ngoài khoảng · bấm 2 lần · việc phòng khác) · **§3 bảng dấu hiệu SAI ⇒ dừng và tra đúng tài liệu** · **§4 mẫu ghi bằng chứng** · **§5 điều kiện kết luận «7 việc ĐẠT»** · ✅ 2 sửa khớp: thêm **`data-vntech="work-dashboard-tab"`** vào recipe `docs/52` §3.2 (để test `t11` có mốc ổn định — khuôn `data-vntech` của dự án) + chú thích trong `docs/55` rằng **`NEW_TABS` phải chỉnh theo thứ tự tab mà user chốt** (hiện là **đề xuất** `docs/49` §2.1) |
| FILES_CHANGED | `docs/56_KICH_BAN_KIEM_THU_CONG_UAT_7_VIEC_20261008.md` (MỚI) · `docs/52_RECIPE_VIEC_2_3_4_20261008.md` (thêm `data-vntech`) · `docs/55_TEST_SAN_DAN_CHO_7_VIEC_20261008.md` (chú thích `NEW_TABS`) · `SESSION_D/{TASK,EVENT,WEEKLY}*` |
| RESULT | ⭐ **Bịt nốt đường kiểm định**: khi ⛔ không chạy được máy, **10 kịch bản bấm-thật** vẫn cho **bằng chứng `VERIFIED`** (đúng Goal §11) · ✅ Kèm **bảng dấu hiệu sai ⇒ chỉ đúng tài liệu** để ⛔ không sửa mò · ✅ 2 sửa nhỏ đảm bảo **recipe ↔ test khớp nhau** (mốc `data-vntech` + cảnh báo thứ tự tab **chưa được user chốt**) |
| TEST_REFERENCE | ⛔ chưa chạy (shell hỏng **vòng 24**) — tài liệu này **là** kịch bản kiểm (thủ công) |
| REMAINING | ⏳ User (A)/(B)/(C) + 3 xác nhận; sau khi vá ⇒ chạy `docs/56` §1 + `docs/55` (2 tệp test) |
| NEXT_ACTION | ⛔ Không còn artefact chuẩn bị — ⭐ bàn giao đủ: kế hoạch · recipe · runbook · test · **UAT** |

---

## TASK-20261008-D29 — **VIỆC NHÀ CUỐI**: mục lục phiên đã đủ 20 tài liệu + trạng thái phiên cập nhật

| Trường | Giá trị |
|---|---|
| TASK_ID | `TASK-20261008-D29` |
| DATE | 2026-10-08 |
| SESSION_ID | `ERP-SESSION-04` |
| MODULE | LOG/STATE — `SESSION_D/README.md` |
| FEATURE | Cập nhật **mục lục 12 → 20 tài liệu** + **SẢN PHẨM/CHỜ USER/STATUS** cho đúng thực tế |
| OBJECTIVE | ⛔ không để **điểm vào của phiên** nói sai (thiếu 8 tài liệu ⇒ người sau ⛔ không biết có `docs/49`→`56`) |
| PRIORITY | P1 (state phải phản ánh thực tế — Goal §6/§16) |
| STATUS | **DONE** |
| START / END | 2026-10-08 → 2026-10-08 |
| IMPLEMENTATION_SUMMARY | Thêm **8 hàng mục lục** (`docs/49`→`docs/56`) vào `SESSION_D/README.md` · sửa **SẢN PHẨM**: `docs/37→45 (9)` ⇒ **`docs/37→56 (20 tài liệu)`** + ghi rõ đã APPEND **CẬP NHẬT 24** (§73′–76′) **và CẬP NHẬT 25** (mục 77′–81′) · sửa **CHỜ USER** (3 nhóm rõ ràng: profile DSH · (A)/(B)/(C) + 3 xác nhận · 7 quyết định `docs/45` §B) · sửa **STATUS**: `READY_FOR_VERIFY` ⇒ **`READY_FOR_EXECUTE`** (bàn giao **ĐỦ**: kế hoạch · recipe · runbook · test · UAT) |
| FILES_CHANGED | `docs/dsh-mutil-session/SESSION_D/README.md` · `SESSION_D/{TASK,EVENT,WEEKLY}*` |
| RESULT | ✅ **Điểm vào của phiên nay đúng thực tế** (20 tài liệu, có mục lục đầy đủ) ⇒ người/phiên sau **⛔ không phải dò** · ⚠️ **THẲNG THẮN**: đây là **việc nhà cuối cùng**; ⛔ **không còn artefact chuẩn bị nào** — mọi việc còn lại **phụ thuộc USER** (profile DSH + uỷ quyền/quyết định) |
| TEST_REFERENCE | ⛔ không áp dụng (tài liệu) |
| REMAINING | ⏳ User (A)/(B)/(C) + 3 xác nhận; ⛔ tôi **không tự đổi trạng thái goal** (user từng phản hồi về việc này) — nếu muốn dừng vòng lặp, user chỉ cần nói |
| NEXT_ACTION | ⛔ **DỪNG sản xuất tài liệu** — chờ user; nếu có shell/uỷ quyền ⇒ thi hành `docs/54` L1→L7 |

---

## TASK-20261008-D30 — **AUDIT PHỦ YÊU CẦU** (đổi trục: kiểm CHỮ CỦA USER, ⛔ không kiểm mã) ⇒ bắt 2 GAP

| Trường | Giá trị |
|---|---|
| TASK_ID | `TASK-20261008-D30` |
| DATE | 2026-10-08 |
| SESSION_ID | `ERP-SESSION-04` |
| MODULE | JOBS — đối chiếu **yêu cầu ↔ kế hoạch** |
| FEATURE | Audit **phủ yêu cầu** 7 việc (16 điểm) + xác minh cơ chế **thông báo** |
| OBJECTIVE | ⛔ không để kế hoạch **thiếu một ý user đã nói** (loại lỗi mà 6 vòng kiểm mã ⛔ không thể bắt) |
| PRIORITY | **P0** |
| STATUS | **DONE** |
| START / END | 2026-10-08 → 2026-10-08 |
| IMPLEMENTATION_SUMMARY | Dựng **bảng đối chiếu 16 điểm yêu cầu** (⛔ không suy diễn, trích nguyên ý user) ⇒ **14 ĐỦ · 1 THIẾU · 1 ĐỦ-MỘT-PHẦN** · đọc `OpsTaskManagementUseCase:108-143` + grep `notification_configs|TASK_COMPLETED` ⇒ phát hiện: `notifySafely` = **`notifications.dispatch(eventKey)`**, luật nằm ở **`notification_configs`** (`NotificationRule` javadoc + `NotificationManagementUseCase:49`), bảng đó **gác `admin`** (`ActionRbacRegistry:52`), và ⚠️ **`queueTaskNotice` (ghi `task_notifications` cho chuông web) CHỈ chạy khi GIAO việc**, ⛔ không thấy trong nhánh `COMPLETED` ⇒ viết `docs/57` |
| FILES_CHANGED | `docs/57_AUDIT_PHU_YEU_CAU_7_VIEC_20261008.md` (MỚI) · `docs/53_RECIPE_VIEC_7_VA_5_6_20261008.md` (**§3.4** bổ sung) · `SESSION_D/{TASK,EVENT,WEEKLY}*` |
| RESULT | 🔴 **GAP-1 (THIẾU thật)**: việc 5b *«nút nhận xét dành cho TẤT CẢ các công việc **trong danh sách**»* — kế hoạch chỉ có ô nhận xét **trong modal** ⇒ **đã bổ sung `docs/53` §3.4** (nút per-dòng ở cột c9, **tái dùng CÙNG modal** + cổng `COMMENTS_READY`, ⛔ không thêm tệp) · 🟡 **GAP-2**: việc 6c *«người giao nhận thông báo khi hoàn thành»* **phụ thuộc CẤU HÌNH** (`notification_configs` — luật `TASK_COMPLETED`) **và chưa chứng minh có thông báo TRONG WEB** (chuông đọc `task_notifications`, mà bảng đó chỉ được ghi khi **giao** việc) ⇒ ➕ thêm phép thử **`K7-bis`** vào UAT + đề xuất **làm cả hai** (cấu hình luật + thêm `queueTaskNotice` nhánh hoàn thành) |
| TEST_REFERENCE | ⛔ chưa chạy (shell hỏng **vòng 26**) — phép kiểm là **đọc mã + đối chiếu yêu cầu**; `K7-bis` bổ sung cho `docs/56` |
| REMAINING | ⏳ User (A)/(B)/(C) + 3 xác nhận; khi thi hành ⇒ thêm **3 việc nhỏ** vào phạm vi: nút Nhận xét per-dòng · luật `notification_configs` `TASK_COMPLETED` · `queueTaskNotice` nhánh `COMPLETED` |
| NEXT_ACTION | ⛔ Chờ user — ⭐ nhưng **phạm vi đã đổi** (việc 5b + 6c có việc mới) ⇒ phải nói rõ khi báo cáo |

---

## TASK-20261008-D31 — **CHỐT 2 ĐIỂM CÒN LẠI**: click-cả-dòng (✅ làm được) + luật thông báo (🔴 phải sửa MÃ)

| Trường | Giá trị |
|---|---|
| TASK_ID | `TASK-20261008-D31` |
| DATE | 2026-10-08 |
| SESSION_ID | `ERP-SESSION-04` |
| MODULE | JOBS (UI `DataTable`) + NOTIFICATION (`NotificationRule`) |
| FEATURE | Chốt 2 điểm mà `docs/57` để ngỏ: **5c** (click cả dòng) · **GAP-2** (thông báo cho người giao) |
| OBJECTIVE | ⛔ không để kết luận dạng «phụ thuộc cấu hình / chưa chắc» ⇒ **phải quyết được** |
| PRIORITY | **P0** (một kết luận đổi **phạm vi thi hành**) |
| STATUS | **DONE** |
| START / END | 2026-10-08 → 2026-10-08 |
| IMPLEMENTATION_SUMMARY | ① Grep `app/components/ui/DataTable.tsx` ⇒ ✅ **CÓ `onRowClick`**: khai ở `:45`, kiểu ở `:53`, tự thêm class **`dt-clickable`** ở `:116`, gắn `onClick` ở `:118`, và **chính tệp ghi mẫu dùng** ở `:22` ⇒ ⭐ yêu cầu *«click vào công việc»* **làm được ĐÚNG nguyên văn** (⛔ không cần chỉ bấm vào mã việc) ⇒ cập nhật `docs/53` §3.2 (dùng `onRowClick` **+** giữ nút `link-cell` cho a11y **+** cảnh báo `stopPropagation()`) · ② Đọc `NotificationRule.java` (38 dòng) ⇒ 🔴 **CHỐT GAP-2**: luật khớp **CHỈ theo `code == eventKey`** + kênh `web|email` (`:18`, `:21-33`), ⛔ **không có logic nhắm NGƯỜI NHẬN ĐỘNG tới «người giao của công việc»**; và `:14` *«⛔ không phát thông báo khi ⛔ không có cấu hình nào khớp»* |
| FILES_CHANGED | `docs/53_RECIPE_VIEC_7_VA_5_6_20261008.md` (§3.2 + `onRowClick`) · `docs/57_AUDIT_PHU_YEU_CAU_7_VIEC_20261008.md` (**§4.1 · §4.2 · §4.3**) · `SESSION_D/{TASK,EVENT,WEEKLY}*` |
| RESULT | ✅ **5c ⇒ ĐỦ** (đổi từ «ĐỦ MỘT PHẦN») · 🔴 **GAP-2 ⇒ KẾT LUẬN: phải sửa MÃ, ⛔ không phải cấu hình** — vì luật cấu hình chỉ nhắm **đích CỐ ĐỊNH**, ⛔ không nhắm được «người giao của chính việc đó»; mà bảng chuông web (`task_notifications`) **chỉ được ghi khi GIAO việc** ⇒ **cần 1 dòng `queueTaskNotice(<người giao>)` trong nhánh `COMPLETED`** · 📋 **§4.3 chốt phạm vi: 5 việc nhỏ thêm** (2 FE + 1 FE `stopPropagation` + 1 dòng BE + 1 luật CFG bổ trợ) |
| TEST_REFERENCE | ⛔ chưa chạy (shell hỏng **vòng 27**) — phép kiểm là **đọc mã** (`DataTable.tsx` · `NotificationRule.java`) |
| REMAINING | ⏳ User (A)/(B)/(C) + 3 xác nhận; ⚠️ khi thi hành ⇒ **phải gộp 5 việc nhỏ** này vào phạm vi (⛔ nếu ⛔ không thì yêu cầu 5b và 6c ⛔ **chưa thoả**) |
| NEXT_ACTION | ⛔ Chờ user — ⭐ nhưng **đã có bằng chứng mã** cho cả 2 kết luận ⇒ khi thi hành là **quyết được**, ⛔ không còn vùng mờ |

---

## TASK-20261008-D32 — **BẮT 2 BẪY TRONG «1 DÒNG BE»** + **ĐỒNG BỘ RUNBOOK với 5 việc mới**

| Trường | Giá trị |
|---|---|
| TASK_ID | `TASK-20261008-D32` |
| DATE | 2026-10-08 |
| SESSION_ID | `ERP-SESSION-04` |
| MODULE | JOBS (BE notification) + RUNBOOK |
| FEATURE | ① Kiểm chính xác **dòng BE** đề xuất ở `docs/57` §4.2 ② Gộp **5 việc nhỏ** (vòng 27–29) vào `docs/54` |
| OBJECTIVE | ⛔ không để đề xuất «1 dòng» tạo **thông báo RỖNG/SAI câu chữ**; ⛔ không để người thi hành theo runbook **sót 5 việc** |
| PRIORITY | **P0** |
| STATUS | **DONE** |
| START / END | 2026-10-08 → 2026-10-08 |
| IMPLEMENTATION_SUMMARY | Đọc `OpsTaskManagementUseCase:806` + `:233-239` + `:194-201` ⇒ 🔴 **2 BẪY trong chính đề xuất của tôi**: **B-1** `sv(m,k)` là **tra map THẲNG** (`m.get(k)`) ⛔ **không đổi kiểu tên khoá**: **B-1a** `findWorkItem` trả **SNAKE_CASE** ⇒ người giao = `sv(task,"assigned_by")`; **B-1b** `queueTaskNotice` lại đọc **CAMELCASE** (`projectId`/`dueAt`/`taskNo` — vì nó dựng cho map của `createWorkItem`) ⇒ ⛔ **truyền thẳng map `findWorkItem` ⇒ mã việc/hạn/dự án RỖNG**; **B-2** `queueTaskNotice` dựng **câu chữ «Công việc MỚI»** (`:222-224`) ⇒ gửi cho người giao khi việc **đã hoàn thành** là **sai nghiệp vụ** ⇒ viết lại §4.4 với **mã đúng (dán được)** + đổi ước lượng **1 dòng → ~15 dòng**; ➕ thêm `docs/54` **§1.2**: bảng **5 việc nhỏ → gắn vào L6/L7/bước cấu hình** + test/UAT phải cập nhật |
| FILES_CHANGED | `docs/57_AUDIT_PHU_YEU_CAU_7_VIEC_20261008.md` (§4.2 sửa + **§4.4** mới) · `docs/54_RUNBOOK_THI_HANH_7_VIEC_CONG_VIEC_20261008.md` (**§1.2**) · `SESSION_D/{TASK,EVENT,WEEKLY}*` |
| RESULT | 🔴 **Chặn được 2 lỗi im lặng** trong việc ④: **thông báo rỗng** (mã việc/hạn/dự án trống do lệch kiểu tên khoá) và **sai câu chữ** («Công việc mới» cho việc đã xong) · ✅ **Runbook nay phản ánh đúng phạm vi** (5 việc nhỏ + test/UAT phải cập nhật) ⇒ người thi hành ⛔ không sót · ⚠️ Ghi rõ tên hàm `store.insertTaskNotification(…)` trong §4.4 là **GIẢ ĐỊNH** ⇒ phải kiểm chữ ký thật trong `TaskStore` khi sửa (⛔ không khẳng định thay) |
| TEST_REFERENCE | ⛔ chưa chạy (shell hỏng **vòng 28**) — phép kiểm là **đọc mã** (`sv()` · `queueTaskNotice` · `createWorkItem`) |
| REMAINING | ⏳ User (A)/(B)/(C) + 3 xác nhận |
| NEXT_ACTION | ⛔ Chờ user; khi thi hành ⇒ theo `docs/54` **§1 (7 lượt) + §1.2 (5 việc nhỏ)** |

---

## TASK-20261008-D33 — **ĐÓNG GIẢ ĐỊNH CUỐI của patch BE** (chữ ký `insertTaskNotification`)

| Trường | Giá trị |
|---|---|
| TASK_ID | `TASK-20261008-D33` |
| DATE | 2026-10-08 |
| SESSION_ID | `ERP-SESSION-04` |
| MODULE | JOBS — BE notification (việc ④ của `docs/54` §1.2) |
| FEATURE | Đọc thân `queueTaskNotice` để **xác minh chữ ký thật**, thay cho **giả định đã tự đánh dấu** |
| OBJECTIVE | ⛔ không để patch chứa **lời gọi sai chữ ký / thiếu trường** |
| PRIORITY | P1 |
| STATUS | **DONE** |
| START / END | 2026-10-08 → 2026-10-08 |
| IMPLEMENTATION_SUMMARY | Đọc `OpsTaskManagementUseCase:240-275` ⇒ ✅ **chữ ký THẬT**: `store.insertTaskNotification(Map notice, Instant now)` với **6 khoá** (`id` = `idGenerator.next("NTF")` · `workItemId` · `userId` · ⚠️ **`channel = "in_app"`** · `title` · `body`); và `store.insertEmailOutbox(Map mail, Instant now)` (`recipients`/`subject`/`textBody`/`htmlBody` + guard `email.isEmpty()`) ⇒ 🔴 **bản phác của tôi SAI**: gọi dạng **vị trí** (`insertTaskNotification(id, userId, title, body, null, now)`) và **thiếu `channel`** ⇒ đã thay bằng **mã đúng** ở `docs/57` §4.4 |
| FILES_CHANGED | `docs/57_AUDIT_PHU_YEU_CAU_7_VIEC_20261008.md` (§4.4 — mã đúng + bảng «đã xác minh») · `SESSION_D/{TASK,EVENT,WEEKLY}*` |
| RESULT | ⭐ **Patch BE việc ④ nay ⛔ KHÔNG còn giả định nào** — dán được, đúng chữ ký, đủ trường; ✅ chốt luôn **khuôn email** nếu muốn gửi email cho người giao |
| TEST_REFERENCE | ⛔ chưa chạy (shell hỏng **vòng 29**) — phép kiểm là **đọc mã** |
| REMAINING | ⏳ User (A)/(B)/(C) + 3 xác nhận — **⛔ không còn điểm mờ nào trong bàn giao** |
| NEXT_ACTION | ⛔ Chờ user |

---

## TASK-20261008-D34 — 🎯 **NGUYÊN NHÂN GỐC LỖI SHELL 31 VÒNG + CÁCH SỬA OFFLINE**

| Trường | Giá trị |
|---|---|
| TASK_ID | `TASK-20261008-D34` |
| DATE | 2026-10-08 |
| SESSION_ID | `ERP-SESSION-04` |
| MODULE | DEVOPS — hạ tầng DSH (profile `web`) |
| FEATURE | Chẩn đoán **nguyên nhân gốc** lỗi `ERR_MODULE_NOT_FOUND: @deepseek-ai/dsh-scope` + phương án sửa **không cần mạng** |
| OBJECTIVE | ⛔ không để blocker hạ tầng kéo dài vô định — **phải chỉ ra được đúng gói thiếu và cách cài** |
| PRIORITY | **P0 (chặn toàn bộ phiên)** |
| STATUS | **DONE** (chẩn đoán) — ⚠️ **việc cài do USER làm** (⛔ tôi không ghi được ngoài workspace) |
| START / END | 2026-10-08 → 2026-10-08 |
| IMPLEMENTATION_SUMMARY | Thay vì chỉ thử lại shell, dùng **công cụ file** (⛔ không cần shell) để chẩn đoán: ① đọc `…\@deepseek-ai\dsh-skill\package.json` ⇒ thấy **`@deepseek-ai/dsh-scope: 0.2.0-rc.2` nằm trong `peerDependencies`** (`:29-33`) ② `glob **/dsh-scope/**` trên `~\.dsh` ⇒ **0 file**; `grep dsh-scope` trên **5.119 đường dẫn** của profile ⇒ **0** (⇒ ⛔ không có bản sao nào để chép) ③ xác nhận **các peer khác ĐÃ CÓ** (`dsh-llm\package.json`, `dsh-util-values\package.json`) ⇒ **chỉ thiếu 1 gói** ④ `grep dsh-scope` trong `%LOCALAPPDATA%\npm-cache\_cacache\index-v5` ⇒ ⭐ **cache ĐÃ CÓ tarball `dsh-scope-0.2.0-rc.2.tgz`** (15.460 B) + cả packument ⇒ **cài được offline** ⑤ đọc `…\profiles\web\package.json` ⇒ profile là package tư nhân `dsh-profile-web`, **`dsh-skill` ⛔ không có trong `dependencies`** (chỉ là dep **gián tiếp** qua bundle) ⇒ giải thích vì sao peer của nó bị bỏ sót |
| FILES_CHANGED | `SESSION_D/{TASK,EVENT}*` (chỉ log — ⛔ **0 dòng mã sản phẩm**) |
| RESULT | 🎯 **Nguyên nhân gốc**: `dsh-skill` cần **peer** `@deepseek-ai/dsh-scope@0.2.0-rc.2` nhưng gói **⛔ không tồn tại** trong profile `web` ⇒ `dsh-skill\lib\index.js` import lúc khởi động ⇒ **mọi lệnh shell của DSH chết trước khi chạy lệnh** (đã kiểm: ⛔ không có mốc `---head---` do tôi đặt). ⭐ **Cách sửa (USER làm)**: `cd %USERPROFILE%\.dsh\profiles\web` → `npm install @deepseek-ai/dsh-scope@0.2.0-rc.2 --offline --no-save` → **khởi động lại DSH** (fallback thủ công: giải nén tarball từ `_cacache\content-v2\sha512\<2>\<2>\<rest>`) |
| TEST_REFERENCE | ⛔ chưa chạy — nhưng đây là **chẩn đoán có bằng chứng file** (package.json peer list · glob 0 kết quả · 5.119-đường-dẫn grep 0 · cache index có tarball) |
| REMAINING | ⏳ USER: cài gói + restart DSH ⇒ nhắn «shell sống rồi»; ⚠️ nếu sau đó lại báo thiếu **gói khác** thì lặp đúng quy trình (cache nhiều khả năng cũng có) |
| NEXT_ACTION | ⛔ Chờ user cài; sau đó tôi chạy `node -v` · `npx tsc --noEmit` · `npm run test:regression` · kiểm vân tay build UI (⛔ **read-only, không cần uỷ quyền tệp**) |

---

## TASK-20261008-D35 — 🎯 **KIỂM THẬT BẰNG SHELL**: 4 cổng ĐẠT · 2 cổng ĐỎ (phát hiện **2 lỗi go-live**)

| Trường | Giá trị |
|---|---|
| TASK_ID | `TASK-20261008-D35` |
| DATE | 2026-10-08 |
| SESSION_ID | `ERP-SESSION-04` |
| MODULE | DEVOPS/VERIFY — chạy cổng thật sau khi shell sống lại |
| FEATURE | `tsc` · `test:regression` · `verify:fingerprint` · `audit:tests` · `verify:css-baseline` · `test:release-static` |
| OBJECTIVE | ⭐ Thay **suy luận từ đọc mã** bằng **bằng chứng đo thật** (Goal §10/§11) |
| PRIORITY | **P0** |
| STATUS | **DONE** (kiểm) — 🔴 để lại **2 lỗi go-live** cho phiên sở hữu |
| START / END | 2026-10-08 → 2026-10-08 |
| IMPLEMENTATION_SUMMARY | Shell sống ⇒ chạy 6 cổng read-only (⛔ 0 dòng mã sửa). ✅ **ĐẠT**: ① `npx tsc --noEmit` → `TSC_EXIT=0` ② `npm run test:regression` → **`tests 921 · pass 920 · fail 0 · cancelled 0 · skipped 1 · todo 0 · 34.9s`**, `exit 0` ③ `npm run verify:fingerprint` → **`VNTECH-FP-830756713F67CAFF · source:760 files · brand/release verified · logo:e3e4e47d0f02`** ④ `npm run audit:tests` → `158 tệp · 976 case · Xanh 151 · ĐỎ 7 (24 case)` nhưng **7 tệp đỏ là ĐÃ BIẾT & cố ý ngoài cổng** (`KNOWN_RED`) ⇒ trong cổng `150 tệp · 925 case` (khớp regression 921 + 4). 🔴 **ĐỎ**: ⑤ **`verify:css-baseline`** → 19 class CSS chết ⑥ **`test:release-static`** → chuỗi migration **391 tệp vs kỳ vọng 351** |
| FILES_CHANGED | `SESSION_D/{TASK,EVENT}*` (chỉ log — ⛔ **0 dòng mã sản phẩm**) |
| RESULT | 🔴 **PHÁT HIỆN 1 (HIGH) — cổng release ĐỎ vì trùng số migration**: `scripts/verify-full-release.mjs:12-17` đếm tệp khớp `^\d{4}_.+\.sql$` trong **`drizzle/`** rồi so với `MIGRATION_HEAD + 1`; `VNTECH_FULL_W2_ID.txt` ghi `MIGRATION_HEAD=0350_…` ⇒ kỳ vọng **351** nhưng có **391** ⇒ **dư 40**. ⭐ **Nguyên nhân gốc đo được**: **40 NHÓM TRÙNG SỐ hiệu** (mỗi nhóm **2 tệp**, từ `0225_…` trở đi, vd `0225_phase_gd_mt3_f1_…` **và** `0225_phase_gd_rut_gon_…`) ⇒ `391 − 351 = 40` **khớp tuyệt đối**; `COUNT_GT_0350 = 0` (⛔ không có số vượt head). ⚠️ **Kiểm git**: **cả 2 tệp `0225_…` đều đã ĐƯỢC COMMIT** ⇒ **lỗi có SẴN trong baseline**, ⛔ **không phải** do 21 tệp `drizzle` chưa track của phiên 03 ⇒ **⛔ KHÔNG thuộc phạm vi tôi (`drizzle/**`)** ⇒ **báo + handoff, ⛔ không tự sửa**. 🔴 **PHÁT HIỆN 2 (MEDIUM) — 19 class CSS chết**: `verify:css-baseline` nêu đích danh `compact-file`, `filter-control`, `mapping-status-*` (9), `matching-*` (5), `material-matching-toolbar`, `material-matching-v2`. ⚠️ **Đính chính mốc cũ của tôi**: hồi quy **`865·864·0·1` là LỖI THỜI** → mốc thật **`921·920·0·1`**; vân tay **`d826dd0b33dbb3cd` → `VNTECH-FP-830756713F67CAFF`** |
| TEST_REFERENCE | ✅ **Đã chạy thật** 6 lệnh có mã thoát (`0,0,0,0,1,1`) — ⭐ **lần đầu trong phiên có bằng chứng runtime** |
| REMAINING | ⏳ USER chọn **B1/B2/B3/C**; ➕ **2 lỗi trên cần phiên sở hữu** (`drizzle/**` · `app/styles/**`) quyết định sửa |
| NEXT_ACTION | Ghi 2 lỗi vào `BUG_HOTFIX_LOG` + báo Telegram + chờ uỷ quyền |

---

## TASK-20261008-D36 — 🔎 **XÁC MINH SÂU `BUG-D06`**: từ «nghi CRITICAL» ⇒ **chứng minh chỉ là lỗi CỔNG/ĐÁNH SỐ (HIGH quy trình)**

| Trường | Giá trị |
|---|---|
| TASK_ID | `TASK-20261008-D36` |
| DATE | 2026-10-08 |
| SESSION_ID | `ERP-SESSION-04` |
| MODULE | DEVOPS/MIGRATION — `drizzle/**` + 2 runner tự viết |
| FEATURE | Xác định **tác động THẬT** của 40 nhóm trùng số migration (⛔ từ chỗ *«rủi ro Flyway/Drizzle lỗi»* ⇒ **kết luận bằng đo đạc**) |
| OBJECTIVE | Goal §9 (**ROOT CAUSE**) + §23 (**FULL-STACK**) + §16 (**đối chiếu state với mã thật**) |
| PRIORITY | **P1** (đổi mức độ của 1 bug HIGH ⇒ đổi cách xử lý) |
| STATUS | **DONE** |
| START / END | 2026-10-08 → 2026-10-08 |
| IMPLEMENTATION_SUMMARY | ⛔ không chấp nhận kết luận suông ⇒ mở **2 runner migration thật** + **đo dữ liệu**: ① `scripts/migrate-postgres.mjs:245` `readdir(drizzle).filter(.sql).sort()` · `:298-300` `SELECT name FROM __mep_migrations` ⇒ `pending = !applied.has(m.name)` · `:359` `if (applied.has(...)) continue;` ② `scripts/local-runtime.mjs:142-158` — **cùng cơ chế, khoá theo TÊN TỆP ĐẦY ĐỦ** ③ `Test-Path drizzle/meta/_journal.json` ⇒ ⛔ **KHÔNG có** (⛔ không dùng drizzle-kit journal) ④ đo dải trùng: **40 nhóm · `0225`→`0315`** · ⭐ **`0350` ⛔ không trùng** · **tệp cuối theo `sort()` = `0350_…` = `MIGRATION_HEAD`** ⑤ `Get-FileHash` toàn bộ **391 tệp** ⇒ **0 nhóm trùng NỘI DUNG**; `0346` vs `0347` **hash khác** ⑥ đọc nội dung 1 cặp trùng ⇒ cả 2 đều `UPDATE vntech_product_identity` + trigger `BEFORE UPDATE`; **317/391** tệp là `*_identity.sql` |
| FILES_CHANGED | `SESSION_D/BUG_HOTFIX_LOG.md` (D06: sửa **IMPACT** + thêm **2 dòng mới**) · `SESSION_D/{TASK,EVENT}*` — ⛔ **0 dòng mã sản phẩm** |
| RESULT | 🔴 **TỰ ĐÍNH CHÍNH kết luận của chính tôi**: phỏng đoán «trùng số ⇒ Flyway/Drizzle lỗi» **SAI** ⇒ ✅ **không hỏng khâu chạy** (khoá theo tên tệp, mỗi tệp áp **đúng 1 lần**), ✅ **định danh cuối ĐÚNG** (`0350` chạy sau cùng), ✅ **⛔ không nhân đôi dữ liệu** (0 nhóm trùng nội dung) ⇒ ⭐ **mức độ đúng = HIGH (chặn CỔNG ĐÓNG GÓI), ⛔ KHÔNG phải CRITICAL · ⛔ không phải lỗi dữ liệu**. ➕ 🔴 **CẢNH BÁO MỚI, quan trọng nhất cho người sửa**: vì `__mep_migrations` khoá theo **TÊN TỆP**, **đổi tên tệp đã áp ⇒ tệp đó BỊ CHẠY LẠI** ⇒ cách sửa phải là **chỉ đổi số tệp CHƯA áp** (kiểm DB trước) **hoặc** ghi tên mới vào bảng, **hoặc** giữ nguyên trùng số và **nới cổng** (user quyết) |
| TEST_REFERENCE | ✅ Phép kiểm = **đọc mã 2 runner** + **đo 391 tệp** (hash/số/sort) — ⛔ **chưa** chạy migration thật lên DB (⚠️ ⛔ không tự ý áp DB — ngoài phạm vi + rủi ro) |
| REMAINING | ⏳ **phiên sở hữu `drizzle/**`** quyết cách xử (⛔ tôi không sửa) · ⏳ user chọn **B1/B2/B3/C** |
| NEXT_ACTION | Bổ sung cảnh báo «đổi tên ⇒ chạy lại» vào `SHARED_STATE` (phiên khác phải biết trước khi đổi tên migration) |

---

## TASK-20261008-D37 — chạy **cổng riêng của dự án** `verify-ui-build-applied` + **đồng bộ runbook** theo số đo thật

| Trường | Giá trị |
|---|---|
| TASK_ID | `TASK-20261008-D37` |
| DATE | 2026-10-08 |
| SESSION_ID | `ERP-SESSION-04` |
| MODULE | DEVOPS/UI-BUILD + tài liệu runbook (`docs/54` — tài liệu CỦA phiên này) |
| FEATURE | Chạy cổng `node tools/verify-ui-build-applied.mjs` + sửa mốc hồi quy lỗi thời trong runbook |
| OBJECTIVE | Goal §16 (*đối chiếu state với mã/build thật*) + §12 (*log* ) + ⛔ không để tài liệu chỉ đường bằng **số sai** |
| PRIORITY | P1 |
| STATUS | **DONE** |
| START / END | 2026-10-08 → 2026-10-08 |
| IMPLEMENTATION_SUMMARY | ① Chạy cổng dự án: **`✗ do-moi` — `dist/` CŨ HƠN nguồn **180s**, nguồn mới nhất **`app\page.tsx`**; `✓ van-tay` HTML mang `830756713f67caff` **khớp SSOT**; `✓ byte` **6/6** bundle đúng byte trên `:9000` ⇒ `KET LUAN: BAN CHAY CU` ② Đối chiếu: đây là **tình trạng đa phiên** (`app/page.tsx` = **LOCK S01** vừa sửa, chưa build) ⇒ ⛔ **không phải lỗi phiên này**, ⛔ **không tự `build`/khởi động lại** (máy chủ dùng chung, luật §36/§37) ③ Sửa `docs/54`: §0 lệnh chuẩn + §3 DoD ⇒ thay mốc lỗi thời **`865·864·0·1`** bằng mốc đo được **`921·920·0·1`**, chèn **cổng bắt buộc `verify-ui-build-applied`** + cảnh báo ⛔ không bắt đầu L1 khi cổng còn ✗ + ghi chú **rác teardown `uv async.c`** (Node/Windows) ⛔ không phải cổng hỏng |
| FILES_CHANGED | `docs/54_RUNBOOK_THI_HANH_7_VIEC_CONG_VIEC_20261008.md` (2 chỗ) · `SESSION_D/{TASK,EVENT}*` — ⛔ **0 dòng mã sản phẩm** |
| RESULT | ✅ Runbook nay **khớp số đo thật** (⛔ hết chỉ đường bằng mốc cũ) + có **điều kiện tiên quyết mới** (cổng UI-build phải ✓) ⇒ ⭐ người thi hành ⛔ không bắt đầu L1 trong trạng thái «bản chạy cũ»; ⚠️ **ghi nhận trung thực**: cổng hiện **✗** và **việc build lại là quyết định của phiên đang sửa `page.tsx` (S01)** — ⛔ không phải của tôi |
| TEST_REFERENCE | ✅ Đã chạy cổng thật (`node tools/verify-ui-build-applied.mjs`) — 3 dấu: `✗ do-moi` · `✓ van-tay` · `✓ byte` |
| REMAINING | ⏳ chờ **S01** build lại sau khi sửa `app/page.tsx` (hoặc user quyết dừng tất cả phiên rồi build) · ⏳ chờ user chọn **B1/B2/B3/C** |
| NEXT_ACTION | ⛔ Không tự build (máy chủ dùng chung) — chờ S01/user |

---

## TASK-20261008-D38 — 📊 **BẢNG SỨC KHOẺ GO-LIVE** (hoàn tất: chạy 8 cổng dự án, ⛔ read-only)

| Trường | Giá trị |
|---|---|
| TASK_ID | `TASK-20261008-D38` |
| DATE | 2026-10-08 |
| SESSION_ID | `ERP-SESSION-04` |
| MODULE | DEVOPS/VERIFY — toàn bộ cổng golive của dự án |
| FEATURE | Chạy nốt 2 cổng còn lại (`verify:master-baseline` · `verify:release`) ⇒ **đủ 8 cổng** |
| OBJECTIVE | Goal §12/§25: trước khi golive phải biết **cổng nào xanh, cổng nào đỏ, vì sao** |
| PRIORITY | P1 |
| STATUS | **DONE** |
| START / END | 2026-10-08 → 2026-10-08 |
| IMPLEMENTATION_SUMMARY | ① `npm run verify:master-baseline` ⇒ **ĐẠT** (`exit 0`): *«MASTER BASELINE GATE: ĐẠT · /api/files SSOT · dual storage DELETE · schema 0047 aligned · identity 0049 · CSS R1.1.1 canonical · !important=3824 · css=379413B»* ② `npm run verify:release` ⇒ **ĐỎ** (`exit 1`) với **ĐÚNG lỗi cũ**: `Migration chain phải có đúng 351 file (0000..0350), nhận 391` ⇒ ⭐ **xác nhận chéo `BUG-D06` chặn 2 cổng** (`test:release-static` + `verify:release`) |
| FILES_CHANGED | `SESSION_D/{TASK,EVENT}*` — ⛔ 0 dòng mã |
| RESULT | 📊 **BẢNG SỨC KHOẺ (đo thật 100%)** — ✅ XANH **5**: `tsc` **0** · `test:regression` **921·920·0·1** · `verify:fingerprint` **ĐẠT `830756713F67CAFF`** · `audit:tests` **158 tệp/976 case** (7 tệp đỏ **đã biết, cố ý ngoài cổng**) · `verify:master-baseline` **ĐẠT** ⚠️ **VÀNG 1**: `verify-ui-build-applied` **✗ do-moi** (bản chạy cũ 180s vs `app/page.tsx` — **việc của S01**) 🔴 **ĐỎ 3** (⛔ chỉ **2 nguyên nhân gốc**): `verify:css-baseline` (**D07** — 19 class chết) · `test:release-static` + `verify:release` (**D06** — 40 nhóm trùng số migration) ⇒ ⭐ **kết luận: cụm chỉ còn ĐÚNG 2 lỗi chặn đóng gói + 1 việc build của S01**; ⛔ không có lỗi thứ ba ẩn |
| TEST_REFERENCE | ✅ 8 cổng đã chạy thật, có mã thoát: `0,0,0,0,0,1(✗ nội dung),1,1,1` |
| REMAINING | ⏳ user chọn **B1/B2/B3/C** · ⏳ S01 build lại · ⏳ 2 lỗi cổng đỏ cần phiên sở hữu |
| NEXT_ACTION | ⛔ Chờ user — ⛔ không tự sửa vùng phiên khác |

---

## TASK-20261008-D39 — 🚀 **THI HÀNH 7 VIỆC (USER ĐÃ UỶ QUYỀN B1+B2)** — L1·L2·L3 XONG

| Trường | Giá trị |
|---|---|
| TASK_ID | `TASK-20261008-D39` |
| DATE | 2026-10-08 |
| SESSION_ID | `ERP-SESSION-04` |
| MODULE | JOBS — khối «Công việc» (`app/screens/WorkCenter.tsx`) |
| FEATURE | **L1 việc 4** (modal «Tạo công việc») · **L2 việc 2** (hạ search + đổi tên «Danh sách công việc») · **L3 việc 3** (tab Dashboard hiện việc của user + **ô nhập %** + **sửa `BUG-D05`**) |
| OBJECTIVE | ⭐ User **chốt qua thẻ quyết định**: **B1+B2** (3 tệp) · thứ tự 7 tab **đồng ý** · Kanban/Cây **giữ dạng chế độ xem** · Nhận xét **tạm ẩn** ⇒ thi hành ngay |
| PRIORITY | **P0** |
| STATUS | **IN_PROGRESS** (L1·L2·L3 xong · L4→L7 chưa) |
| START / END | 2026-10-08 → *(đang làm)* |
| IMPLEMENTATION_SUMMARY | **L1 (việc 4)**: `useState createOpen` + `submitSelfWork` (⚠️ gọi `action` TRỰC TIẾP vì `send` trả `Promise<void>`, ⛔ không biết thành công để đóng modal) ⇒ form nội tuyến → **MODAL «Tạo công việc»** đúng khuôn dự án (`.overlay` → `.modal card` `role=dialog` `aria-modal` → `.modal-head` + ✕ `aria-label="Đóng"` → `.modal-body` → `footer.modal-actions`), nút mở `data-vntech="work-create-open"`, modal `work-create-modal` · **L2 (việc 2)**: ⛔ bỏ `search=` khỏi `ListToolbar` ĐẦU màn + thêm `ListToolbar` **có search NGAY TRÊN** bảng; tiêu đề «Danh sách việc của tôi» → **«Danh sách công việc»** · **L3 (việc 3)**: thêm **`ProgressCell` cấp module** (export) thay 4 nút preset: **ô `type="number"` 0..100** + «Lưu %»; **người thực hiện ⇒ «Gửi kiểm tra» (`SUBMITTED`)** · **người duyệt ⇒ «Duyệt xong» (`COMPLETED`)** + «Yêu cầu làm lại» (`REWORK`) **bắt buộc nhập lý do** (⛔ FE tự chặn `disabled`); `canApproveRow` **mô phỏng ĐÚNG** `isDepartmentManager` (`system-route.mjs:263`: admin · (`KH`∧`kh_truong`) · (`DA`∧`da_truong`) — ⚠️ **BCH không có**) ⇒ ⭐ **`BUG-D05` ĐÃ SỬA**; tab Dashboard thêm bảng «Việc của tôi (Dashboard)» dùng ĐÚNG tập `mine` |
| FILES_CHANGED | `app/screens/WorkCenter.tsx` (chỉ tệp này + 2 test) · `tests/t01-work-menu.test.mjs` · `tests/t05-personal-work.test.mjs` — ⚠️ **CHANGE_LOG/TEST_LOG ghi gộp khi xong L1→L7** |
| RESULT | ✅ `npx tsc --noEmit` = **0** (sau mỗi lượt) · ⚠️ **1 lỗi tự bắt & sửa ngay**: tôi từng đặt **comment JSX giữa danh sách attribute** của `ListToolbar` ⇒ JSX không hợp lệ ⇒ **đã sửa ngay trong cùng lượt** · 🔴 **Hồi quy lượt đầu: `925·919·fail 5·1`** — **2 lỗi do tôi** (`t01:153` + `t05:126` khoá **form nội tuyến cũ**, đúng như `docs/50` §3 dự báo) ⇒ **đã cập nhật 2 test** để khoá **hành vi MỚI** (nút mở + modal + `submitSelfWork` + tiêu đề mới) ⛔ **không nới lỏng** ⇒ ⭐ **`925 test · 922 pass · fail 2 · skip 1`** · ➕ **3 lỗi KHÔNG do tôi**: `m118`×2 + `TM-04` — cả 3 đọc **`app/page.tsx`** (⛔ tôi chưa chạm tệp đó) ⇒ do **S01 sửa dở**; ⭐ **`TM-04` tự xanh ở lần chạy sau ⇒ S01 đã hoàn tất bản sửa của họ**; **còn `MỐC 118`×2** (cổng menu nhóm quản trị) ⛔ **vẫn ĐỎ** |
| TEST_REFERENCE | ✅ chạy thật: `tsc` 0 · hồi quy `925·922·2·1` (báo cáo **tách bạch** lỗi của tôi vs lỗi phiên khác) |
| REMAINING | 🔴 `MỐC 118`×2 (page.tsx — **của S01**, ⛔ không tự sửa) · L4 dải 7 tab · L5 việc 7 · L6 việc 5·6 · L7 việc 1 (cần `git status` lại `page.tsx` trước khi sửa) · `gd-cycle` + CHANGE_LOG/TEST_LOG gộp |
| NEXT_ACTION | L4 (dải 7 tab Dashboard-đầu) — ⚠️ sẽ phải cập nhật tiếp `t01` (chỉ số tab) + `t12` khi dán |

---

## TASK-20261008-D40 — ✅ **L4: DẢI 7 TAB (Dashboard ĐẦU) + NHÁNH «ĐƯỢC GIAO»** — hồi quy còn ĐÚNG 2 lỗi của S01

| Trường | Giá trị |
|---|---|
| TASK_ID | `TASK-20261008-D40` |
| DATE | 2026-10-08 |
| SESSION_ID | `ERP-SESSION-04` |
| MODULE | JOBS — khối «Công việc» (`app/screens/WorkCenter.tsx` + 5 tệp test) |
| FEATURE | **L4** (việc 1 phần dải tab + việc 2 nhãn + việc 6 tab riêng + việc 7 nhãn) |
| OBJECTIVE | User chốt **thứ tự 7 tab**: `Dashboard · Danh sách công việc · Được giao · Phòng ban/ Tổ đội · Giao việc · Dự án · Báo cáo` |
| PRIORITY | **P0** |
| STATUS | **DONE** |
| START / END | 2026-10-08 → 2026-10-08 |
| IMPLEMENTATION_SUMMARY | ① `WORK_TABS` ⇒ **7 tab, Dashboard = 0**; ② `WORK_TAB_OF_VIEW` ⇒ `{ personal: 1, department: 3, assign: 4, kpi: 0, dashboard: 0, reports: 6 }` (⚠️ **giữ alias `kpi: 0`** đúng chủ ý cũ); ③ **7 nhánh `{tab === n &&}`** đổi số (1,2,5,3,4,0,6 theo thứ tự nguồn — ⚠️ **thứ tự tab ⇎ thứ tự nhánh trong nguồn**, mỗi nhánh độc lập); ④ **THÊM NHÁNH MỚI `{tab === 2 &&}`** = tab «Được giao» (`data-vntech="work-assigned-tab"`) — **TÁI DÙNG ĐÚNG** nhóm có sẵn `personalGroups[1].rows` (`assignedRows`, ⛔ không viết lại luật lọc) + `allowEdit` + `canApproveRow`; ⑤ **sửa 3 chú thích LỖI THỜI** trong tệp (`:12-14` ghi «5 tab» · `:88` ghi 4 tab · `:94` ghi `dashboard: 3`) ⇒ nay mô tả **đúng dải 7 tab** (bài học §16: **nguồn sự thật = MÃ**) |
| FILES_CHANGED | `app/screens/WorkCenter.tsx` · `tests/t01-work-menu.test.mjs` · `tests/t05-personal-work.test.mjs` · `tests/t06-department-scope.test.mjs` · `tests/t07-kanban-board.test.mjs` · `tests/t08-work-dashboard.test.mjs` · `tests/t09-task-team-member.test.mjs` — ⚠️ CHANGE_LOG/TEST_LOG vẫn ghi gộp cuối L1→L7 |
| RESULT | ✅ `npx tsc --noEmit` = **0** · ⭐ **hồi quy cuối L4: `925 test · 922 pass · FAIL 2 · 1 skip`** ⇒ **toàn bộ 5 lỗi do L1·L2·L4 đã hết**; 🔴 **2 lỗi CÒN LẠI = `MỐC 118` ×2** — ⚠️ **cả 2 kiểm `app/page.tsx`** (⛔ tệp tôi chưa hề sửa) ⇒ **của S01**, ⛔ không tự sửa. ⚠️ **1 lỗi TÔI tự bắt & sửa**: khi thay khối test `T-01` tôi để **thừa 1 dấu `});`** (khối cũ kết thúc NGOÀI `old_string`) ⇒ `SyntaxError: Unexpected token '}'` ⇒ **sửa ngay** (⭐ bài học: khi thay cả một `test(...)` phải **bao gồm dòng `});` kết thúc** hoặc kiểm lại số dấu ngoặc) |
| TEST_REFERENCE | ✅ chạy thật từng bước: `tsc` 0 · hồi quy `925·922·2·1` · ⚠️ đã **tự bắt** lỗi cú pháp bằng `node --test tests/t01-work-menu.test.mjs` (không để lọt sang hồi quy) |
| REMAINING | L5 (việc 7: 2 sub-tab + Kanban/Cây vào «chế độ xem») · L6 (việc 5·6: modal chi tiết + `onRowClick` + Nhận xét tạm ẩn) · L7 (việc 1: hub) · `gd-cycle` · CHANGE_LOG/TEST_LOG · ⛔ 2 lỗi S01 |
| NEXT_ACTION | **L5** — cập nhật tiếp 2 test còn khoá cấu trúc tab «Phòng ban» (`t06` nội dung · `t07` board) |

---

## TASK-20261008-D41 — 🎉 **L5 + L6 + L7 XONG ⇒ TRỌN 7/7 VIỆC** (mã XONG · ⛔ build DỞ DANG do `EPERM`)

| Trường | Giá trị |
|---|---|
| TASK_ID | `TASK-20261008-D41` |
| DATE / SESSION | 2026-10-08 · `ERP-SESSION-04` |
| MODULE | JOBS — «Công việc» (`app/screens/WorkCenter.tsx` · `lib/menu-helpers.ts` · `app/page.tsx` · 8 tệp test) |
| FEATURE | **L5 việc 7** · **L6 việc 5·6** · **L7 việc 1 (hub)** ⇒ **đủ 7/7 việc của user 08/10/2026** |
| PRIORITY | **P0** |
| STATUS | **DONE (mã + test)** — ⚠️ **CHG-D09 BLOCKED** (build) |
| START / END | 2026-10-08 → 2026-10-08 |
| IMPLEMENTATION_SUMMARY | **L5**: tab «Phòng ban/ Tổ đội» có **2 sub-tab** (`work-dept-subtab-dept`·`-team` + bộ đếm) + Kanban/Cây vào **«chế độ xem»** (`work-dept-view-list\|kanban\|tree`) — ⚠️ **giữ nguyên 2 nhãn cũ** để ⛔ không phá `t06`, ⛔ vẫn để Kanban/Cây trong WorkCenter để ⛔ không phá `t07`/`t09` · **L6**: `ProgressCell` thêm **`stopPropagation()`** (⚠️ bắt buộc khi bật `onRowClick`), `TaskTable` nhận **`onOpenDetail`** + `DataTable onRowClick` (**click CẢ DÒNG**) + ô mã việc `.link-cell` (a11y) + **MODAL CHI TIẾT** `work-detail-modal` (9 trường + nút theo vai) + **«Nhận xét» TẠM ẨN** (`work-comment-pending`) theo **quyết định của user** · **L7**: 5 mục menu ⇒ **1 MỤC HUB `work_hub`** (**hợp 8 khoá quyền**) + **rút `"my_work"`** khỏi `HUB_TAB_GROUP_KEYS` + **ĐẢO 2 NHÁNH** `workCenterViewFor` (⛔ nếu không: bấm «Công việc» mở tab «Danh sách công việc» — **đúng bẫy `docs/51`**) + cập nhật **8 tệp test** |
| FILES_CHANGED | `app/screens/WorkCenter.tsx` · `lib/menu-helpers.ts` · `app/page.tsx` · `tests/{t01-work-menu, t05-personal-work, t06-department-scope, t07-kanban-board, t08-work-dashboard, t09-task-team-member, p5-01-work-menu-dashboard, t10-approval-center}.test.mjs` · `docs/dsh-mutil-session/SESSION_D/{CHANGE_LOG,TEST_LOG,TASK_LOG,EVENT_LOG}.md` — ⚠️ `drizzle/0351_…` + identity files do `gd-cycle` tạo |
| RESULT | 🎉 **HOÀN TẤT 7/7 VIỆC Ở MỨC MÃ + TEST**: `npx tsc --noEmit` = **0** · hồi quy **`925 test · 922 pass · FAIL 2 · 1 skip`** — ⭐ **0 lỗi do phiên này** (2 lỗi còn lại = `MỐC 118`×2 kiểm `app/page.tsx` = **của S01**) · ⚠️ **2 lỗi do tôi đã tự bắt & sửa** (comment JSX giữa attribute · thừa `});` khi thay khối test) · ⭐ **hồi quy ỔN ĐỊNH qua 5 lần chạy** (925·922·2·1 sau các lượt L4→L7) |
| TEST_REFERENCE | ✅ `tsc` 0 (7/7 lượt) · hồi quy `925·919·5` → **`925·922·2`** · `verify-ui-build-applied` **✗** (bản chạy cũ) — xem `TEST_LOG` **TEST-D20…D24** |
| REMAINING | 🔴 **`gd-cycle` DỞ DANG** (`CHG-D09`): identity đã refresh (**`41f07d49…`**, head **`0351`**) nhưng **lỗi `EPERM`** ở bước stash `.local-data` (đích **ngoài workspace** + thư mục **đang bị máy chủ dùng chung giữ**) ⇒ ✅ `.local-data` **nguyên vẹn** · 🔴 **bundle đang phục vụ ⛔ CHƯA có 7 việc** ⇒ **cần `npm run build` + khởi động lại `:8787`** ⚠️ (⛔ **không tự kill máy chủ dùng chung** — luật §36) · ⏳ user nghiệm thu UI · ⛔ 2 lỗi `MỐC 118` của S01 · ⛔ `java-backend` không thuộc uỷ quyền |
| NEXT_ACTION | ⛔ Chờ **user/S01** quyết bước build (⚠️ cần **mọi phiên dừng sửa** để `gd-cycle` chạy trọn — đúng cảnh báo §4 của `SESSION_C`) |

---

## TASK-20261008-D42 — ⭐ **ARTEFACT GO-LIVE: BIÊN BẢN NGHIỆM THU 7 VIỆC** (`docs/58`)

| Trường | Giá trị |
|---|---|
| TASK_ID | `TASK-20261008-D42` |
| DATE / SESSION | 2026-10-08 · `ERP-SESSION-04` |
| MODULE | JOBS — khối «Công việc» (**tài liệu go-live**) |
| FEATURE | **BIÊN BẢN NGHIỆM THU** gom mọi bằng chứng cho 7 việc |
| PRIORITY | **P1** (artefact bàn giao/nghiệm thu) |
| STATUS | **DONE** |
| IMPLEMENTATION_SUMMARY | Tạo `docs/58_BIEN_BAN_NGHIEM_THU_7_VIEC_CONG_VIEC_20261008.md` gồm **7 mục**: §1 **bảng 7/7 việc** (trạng thái + bằng chứng từng việc) · §2 **số liệu chốt** (tsc 0 · hồi quy `930·928·FAIL 1` · vân tay `7DFD3E8BEA628F78` · `gd-cycle` exit 0 · `verify-ui-build-applied` **✓✓✓** · **bundle phục vụ 1.339.923 ký tự đủ 10/10 dấu hiệu**) · §3 **bằng chứng thô** (4 khối JSON đọc DOM + 2 ảnh chụp) · §4 **5 việc còn lại CÓ CHỦ** (ô nhập % · `BUG-D09` chờ build · `BUG-D08` · `REWORK`/Java · `BUG-D06`/`D07`) · ⭐ §5 **5 BƯỚC MỚI bổ sung cho UAT `docs/56`** (tiêu đề trang sau build · ô nhập % với tài khoản nhân viên · 2 vai gửi/duyệt · 3 chế độ xem · «—» đúng vai) · §6 **lệnh tự kiểm lại** · §7 **cam kết phạm vi & an toàn đa phiên** + ⭐ **bài học `gd-cycle`/KHÓA FILE** |
| FILES_CHANGED | `docs/58_BIEN_BAN_NGHIEM_THU_7_VIEC_CONG_VIEC_20261008.md` (**mới**) — ⛔ không đổi mã sản phẩm |
| RESULT | ✅ Tài liệu **chỉ ghi điều ĐÃ ĐO** (Goal §22/§24) ⇒ dùng được để **nghiệm thu / bàn giao go-live**; ⛔ **không tự nhận `VERIFIED`** cho 2 điểm chưa đo được (ô nhập % · thông báo web end-to-end) |
| TEST_REFERENCE | Nguồn của tài liệu = `TEST_LOG` **D20–D30** + `EVENT_LOG` **D208–D252** (⛔ không suy diễn) |
| REMAINING | ⏳ 5 việc ở §4 (có chủ sở hữu) |
| NEXT_ACTION | ⛔ Chờ user: **build MỘT LẦN khi mọi phiên dừng** + cấp **tài khoản nhân viên có việc** (hoặc cho tạo việc thử) để đóng nốt điểm «ô nhập %» |

---

## TASK-20261008-D43 — ⭐ **3 YÊU CẦU MỚI CỦA USER (08/10/2026): dọn UI module «Công việc»**

| Trường | Giá trị |
|---|---|
| TASK_ID | `TASK-20261008-D43` |
| DATE / SESSION | 2026-10-08 · `ERP-SESSION-04` |
| MODULE | JOBS — «Công việc» (UI/UX) |
| FEATURE | ① bỏ dải **«ĐANG PHÁT TRIỂN»** ② bỏ filter **«Chọn dự án»** ③ bỏ nút **«Xuất CSV»** ở MỌI tab |
| PRIORITY | **P1** (user giao trực tiếp) |
| STATUS | **DONE** (code+test) — ⏳ `VERIFIED` chờ **build** |
| IMPLEMENTATION_SUMMARY | ⭐ Cách làm **nhỏ nhất & cô lập**: `app/page.tsx` **đúng 1 biểu thức** — thêm `workCenterView === null &&` vào **CẢ** `ProjectScopeSelect` **LẪN** `DevelopmentNotice` ⇒ ⛔ ẩn trong TOÀN module «Công việc» mà ⛔ **không đụng** danh sách dùng chung `DEVELOPMENT_MODULES` (tránh ảnh hưởng 24 module khác). `WorkCenter.tsx`: gỡ nút `data-vntech="work-export-csv"` khỏi `ListToolbar` + **gỡ import** `downloadCsv` (⚠️ thư viện `lib/tabular-export.ts` **vẫn còn**) + cập nhật 2 chú thích (⛔ không để chú thích lỗi thời) |
| FILES_CHANGED | `app/screens/WorkCenter.tsx` · `app/page.tsx` (⚠️ tệp của S01 — **đã đọc tươi ngay trước khi sửa**; hệ thống chặn khi tệp đổi ⇒ phải đọc lại rồi mới sửa được ✅) |
| RESULT | ✅ `npx tsc --noEmit` = **0** · ⚠️ hồi quy `932 test · 930 pass · FAIL 1` — lỗi duy nhất = **`W-02`** (test **CSDL THẬT** vs tài liệu audit) ⇒ ⭐ **đã chứng minh ⛔ KHÔNG do phiên này** (`w02-project-warehouse-relation.test.mjs` ⛔ không đọc `WorkCenter.tsx`/`page.tsx`; nó vừa đỏ vì **phiên khác thêm kho/dự án** — 2 vòng trước còn xanh) · ⭐ 3 sửa UI **⛔ không phá test nào** |
| TEST_REFERENCE | `TEST_LOG` **TEST-D34** · `CHANGE_LOG` **CHG-D10** · `EVENT_LOG` **D260–D261** |
| REMAINING | ⏳ cần **build** để thấy trên UI · ⚠️ `W-02` cần **chủ tài liệu W-02** cập nhật 3 con số (đã bàn giao) |
| NEXT_ACTION | ⭐ Trả lời câu hỏi user: **Kanban và tab «Cây» dùng để làm gì** — và chờ user quyết **giữ hay bỏ** 2 chế độ xem này |
