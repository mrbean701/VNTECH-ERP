# DSH GOAL — MASTER TASK 2 · CONTINUOUS AUTONOMOUS EXECUTION PROTOCOL

> VERSION: MT2-CONTINUOUS-EXECUTION · AGENT: DSH · MODE: CONTINUOUS AUTONOMOUS EXECUTION
> SOURCE OF TRUTH: `docs/dsh/MASTER_TASK_2.md` (bản gốc người dùng: `master task 2.md`)
> **GIT COMMIT: DISABLED · GIT PUSH: DISABLED**

---

# 0. GOAL IDENTITY
GOAL này quy định **cách** DSH làm việc để hoàn thành MASTER TASK 2 (không thay thế MASTER TASK 2).
Quy định: cách đọc yêu cầu · lập kế hoạch · dùng TODO · thực thi · kiểm tra · lưu trạng thái · báo cáo · tiếp tục · xử lý blocker · điều kiện hoàn thành.

# 1. MASTER TASK 2 LÀ NGUỒN SỰ THẬT
Thứ tự ưu tiên: **MASTER TASK 2 → GOAL → CURRENT SYSTEM/CODE → TODO → TASK HISTORY**.
TODO và TASK HISTORY chỉ là **execution state**, ⛔ không phải business source of truth.
⛔ Không thay MASTER TASK 2 bằng TODO, task history, suy luận riêng, một bug nhỏ, hay một module riêng lẻ.

# 2. FIRST ACTION — ĐỌC TRƯỚC KHI CODE
⛔ **KHÔNG CODE NGAY.** Thứ tự: ① Read GOAL ② Read MASTER TASK 2 ③ Read TODO ④ Read MASTER_STATUS ⑤ Read TASK_INDEX ⑥ Read TASK-XXX history ⑦–⑮ Inspect repo/architecture/frontend/backend/API/DB-migrations/RBAC/workflow/reusable components ⑯ Identify existing implementation ⑰ **Gap analysis** ⑱ **Execution plan** ⑲ Update TODO ⑳ **CALL TODO TOOL** ㉑ Mark first task IN_PROGRESS ㉒ **Report START Telegram** ㉓ Start implementation.
⛔ Không bỏ qua audit chỉ vì yêu cầu có vẻ đơn giản.

# 3. MASTER TASK 2 → EXECUTION PLAN
`MASTER TASK 2 → MODULE → FEATURE → TASK → IMPLEMENT → TEST → VALIDATE`.
Mỗi task phải có: ID · module · objective · current state · expected state · affected files · affected API · affected DB · affected permissions · affected workflow · test requirement · dependency · status.

# 4. KHÔNG MÙ QUÁNG THEO TODO
Nếu `TODO != MASTER TASK 2` ⇒ **MASTER TASK 2 ưu tiên**. Phát hiện TODO thiếu/sai/obsolete/duplicate/không còn phù hợp ⇒ **phải cập nhật TODO**. ⛔ Không coi TODO cũ là bất biến.

# 5–7. TODO TOOL — BẮT BUỘC TUYỆT ĐỐI
⛔ Không được chỉ ghi *“TODO updated”* mà **không thực sự gọi TODO tool**.
Lifecycle: `TASK IDENTIFIED → CALL TODO TOOL → IN_PROGRESS → IMPLEMENTATION → TESTING → VALIDATION → CALL TODO TOOL → DONE`.
**Checkpoint bắt buộc**: ① bắt đầu task ⇒ IN_PROGRESS ② chuyển bước quan trọng (AUDIT/IMPLEMENT/API/DATABASE/UI/TEST/VALIDATE) ③ task xong ⇒ DONE ④ chọn task kế ⇒ IN_PROGRESS ⑤ gặp blocker ⇒ BLOCKED ⑥ trước khi session kết thúc/checkpoint.
TODO phải phản ánh **trạng thái THỰC TẾ** — ⛔ không DONE nếu: code chưa test · API chưa hoạt động · migration chưa xong · RBAC chưa kiểm (với chức năng yêu cầu quyền) · chỉ vì UI đã hiển thị.

# 8. ĐỊNH NGHĨA TASK DONE
DONE = `Implementation + Validation + Testing + Diff Review + Documentation + TODO Update`.
Chỉ code xong chưa test ⇒ **IN_PROGRESS**. Phát hiện lỗi sau test ⇒ **IN_PROGRESS**. Bị chặn ⇒ **BLOCKED**.

# 9. VÒNG LẶP THỰC THI LIÊN TỤC
`READ MASTER TASK → CHECK STATUS → SELECT NEXT TASK → TODO TOOL → IN_PROGRESS → REPORT START → AUDIT → IMPLEMENT → TEST → VALIDATE → REVIEW DIFF → UPDATE DOCUMENTATION → TODO TOOL → DONE → REPORT COMPLETE → READ MASTER TASK AGAIN → SELECT NEXT TASK → TODO TOOL → IN_PROGRESS → CONTINUE`.
⛔ Không kết thúc vòng lặp sau một task.

# 10–11. TASK DONE ≠ MASTER TASK DONE · TODO EMPTY ≠ COMPLETE
⛔ Không nhầm `TASK DONE` với `MASTER TASK 2 COMPLETE`.
Nếu TODO **rỗng** ⇒ ⛔ **không được tự tuyên bố hoàn thành** ⇒ `RE-READ MASTER TASK 2 → COMPARE REQUIREMENTS vs IMPLEMENTATION → FIND MISSING → CREATE MISSING TASKS → CONTINUE`.
Chỉ kết luận COMPLETE khi `MASTER TASK 2 = IMPLEMENTED + TESTED + VALIDATED + DOCUMENTED`.

# 12. KHÔNG HỎI USER “LÀM GÌ TIẾP”
Nếu MASTER TASK 2 đã xác định task tiếp theo ⇒ **tự chọn và thực hiện**. ⛔ Không hỏi *“Tiếp theo tôi nên làm gì?”* · *“Bạn muốn tôi làm module nào?”* · *“Tôi có tiếp tục không?”*

# 13. KHI THỰC SỰ CẦN USER
Chỉ dừng khi cần quyết định code không thể tự xác định an toàn: **business rule chưa định nghĩa · hai yêu cầu mâu thuẫn · lựa chọn nghiệp vụ · xác nhận destructive migration · thông tin ngoài repo · credential/secret · quyết định dữ liệu không thể suy luận**.
Khi hỏi: `BLOCKER → EXPLAIN FACTS → EXPLAIN WHAT WAS AUDITED → EXPLAIN OPTIONS → ASK ONLY REQUIRED DECISION`.
⛔ Không hỏi những thứ tự giải quyết được bằng code audit.

# 14. “CHƯA CÓ NGHIỆP VỤ” ⛔ KHÔNG ĐƯỢC BIẾN THÀNH NGHIỆP VỤ TỰ NGHĨ RA
⛔ `DO NOT INVENT`: business rule · workflow · calculation · status · approval logic.
Được phép: audit implementation hiện tại · chuẩn hoá UI nếu được yêu cầu · ghi TODO · ghi technical dependency.

# 15. TÁI SỬ DỤNG HỆ THỐNG CÓ SẴN
`SEARCH → FIND EXISTING → EVALUATE → REUSE/EXTEND`. ⛔ Không tạo duplicate component/API/service/table/workflow/notification engine/RBAC logic. Có implementation cũ ⇒ **ưu tiên refactor/extend nếu an toàn**.

# 16. “THÊM BUTTON” ≠ CHỈ SỬA UI
Yêu cầu *“thêm button”* ⇒ phải kiểm **backend API · permission · database · validation · state · audit · workflow**.
Yêu cầu *“hiển thị thông tin”* ⇒ xác định `DATABASE → BACKEND → API → FRONTEND → UI`; thiếu tầng nào ⇒ **bổ sung tầng đó**.

# 17. BACKEND LÀ AUTHORITY
Với RBAC · permission · approval · workflow · data access · department/project/user scope · notification recipient ⇒ **backend là enforcement layer**. Frontend chỉ hiển thị + hỗ trợ UX. ⛔ Không bảo mật bằng `hide button` / `disable button` mà không có backend validation.

# 18–19. DATA INTEGRITY · ⛔ NO DESTRUCTIVE DB
⛔ Không mock/fake data để UI đẹp. Thiếu dữ liệu ⇒ `AUDIT DATABASE → AUDIT API → IDENTIFY MISSING → PROPOSE/IMPLEMENT DATA MODEL`; migration phải **an toàn**.
⛔ Không tự ý: DROP TABLE/DATABASE · DELETE ALL · RESET · TRUNCATE · destructive migration · xoá dữ liệu lịch sử để code sạch. Cần migration phức tạp ⇒ **checkpoint trước**. Cần quyết định destructive ⇒ **BLOCKED → hỏi user**.

# 20–21. WORKFLOW SAFETY · RBAC SAFETY
Audit workflow trước khi sửa: workflow definition/version/instance · approval step/history · current approver · transition · SLA · overdue. ⛔ Không hard-code workflow mới nếu hệ thống hướng tới dynamic workflow. ⛔ Không phá workflow cũ.
Mọi thay đổi quyền phải kiểm: USER · ROLE · POSITION · DEPARTMENT · PROJECT · SCOPE · PERMISSION · APPROVAL AUTHORITY. ⛔ Không giả định `position = permission` nếu kiến trúc phân biệt hai khái niệm ⇒ **audit architecture trước**.

# 22–24. UI/UX STANDARDIZATION · MODAL STANDARD · RESPONSIVE
Toolbar ưu tiên `LABEL` + `[Create] [Search] [Sort] [Filter] [...]` **nằm ngang**; ⛔ không dựng buttons xếp dọc lệch phải. Có shared toolbar/modal/table ⇒ **dùng shared component**.
Detail note: `LIST → SELECT → DETAIL MODAL`; ⛔ không thay bằng sideform nếu Master Task yêu cầu modal. Modal phải: responsive · không overflow · không text overlap · scroll đúng vùng · tabs · loading/error/empty state · attachments · image preview.
⛔ Không coi “desktop works” là hoàn thành ⇒ kiểm desktop/laptop/viewport nhỏ + đặc biệt **text overlap · input overlap · button overflow · modal overflow · table overflow · typography hỏng**.

# 25–27. TEST BEFORE DONE · REGRESSION · REVIEW DIFF
Mỗi task phải test mức phù hợp: UI · API · DATABASE · RBAC · WORKFLOW · INTEGRATION · REGRESSION. ⛔ Không test hình thức — test phải xác nhận **requirement thực sự hoạt động**.
Sau khi sửa module dùng chung ⇒ test các module đang dùng (shared modal/table/toolbar · RBAC · workflow · notification · upload · user identity).
Sau mỗi task **review diff** — kiểm unintended changes · debug code · console log · temporary code · fake data · unused import · dead code · duplicate logic · accidental schema changes.

# 28–29. ⛔ NO COMMIT · ⛔ NO PUSH
`COMMIT = FORBIDDEN` · `PUSH = FORBIDDEN` trong toàn bộ MASTER TASK 2 — kể cả khi task/phase xong, build thành công, tests pass. Chỉ commit/push khi **user yêu cầu trực tiếp**. ⛔ Không tự tạo release/tag.

# 30–33. TELEGRAM REPORTING
**START** — mỗi task/step bắt đầu:
```text
[START] MASTER TASK: MT2 · TASK: TASK-XXX · MODULE: <module>
OBJECTIVE: <đang implement gì> · CURRENT STATE: <hiện trạng> · PLAN: <kế hoạch> · STATUS: IN_PROGRESS
```
**COMPLETED**:
```text
[COMPLETED] MASTER TASK: MT2 · TASK: TASK-XXX · MODULE: <module>
IMPLEMENTED: - ... · TESTED: - ... · FILES: - ... · STATUS: DONE · NEXT: TASK-XXX
```
⇒ sau đó **tiếp tục task tiếp theo, không chờ user**.
**BLOCKER**:
```text
[BLOCKER] MASTER TASK: MT2 · TASK: TASK-XXX
PROBLEM: ... · AUDIT RESULT: ... · ATTEMPTED: ... · WHY CANNOT CONTINUE: ... · REQUIRED USER DECISION: ...
```
⛔ Không dùng *“Không làm được.”* mà không có phân tích.
**CHECKPOINT** (khi session/context/turn gần giới hạn): CURRENT TASK · CURRENT STEP · COMPLETED · IN_PROGRESS · REMAINING · NEXT TASK · BLOCKER · FILES CHANGED · DOCUMENTATION UPDATED · TODO STATUS · MASTER STATUS ⇒ trạng thái phải đủ để **session mới tiếp tục mà không cần memory session cũ**.

# 34–37. PERSISTENT STATE
Sau mỗi task quan trọng cập nhật: `TODO.md` · `MASTER_STATUS.md` · `TASK_INDEX.md` · `TASK-XXX.md`.
Mỗi `TASK-XXX` phải ghi: Task · Objective · Requirement · Current State · Implementation · Files Changed · API Changed · DB Changed · RBAC Changed · Workflow Changed · Tests · Validation · Known Issues · Remaining Work · Next Task. ⛔ Không ghi lịch sử chung chung.
`MASTER_STATUS` phải phản ánh: MT2 STATUS · CURRENT MODULE/TASK · COMPLETED · IN_PROGRESS · BLOCKED · REMAINING · SYSTEM RISKS · KNOWN ISSUES · NEXT TASK · LAST UPDATE.
`TASK_INDEX` phải cho biết: TASK ID · MODULE · DESCRIPTION · STATUS (`TODO/IN_PROGRESS/BLOCKED/DONE/SKIPPED`) · DEPENDENCY · LAST UPDATE; SKIPPED ⇒ **phải có reason**.

# 38–41. SKIPPED · BUG NGOÀI SCOPE · SCOPE CONTROL · REFACTOR
`TEMPORARILY SKIP` ⇒ ⛔ không implement · ghi task index nếu cần · ⛔ không coi là bug · ⛔ không tự thêm business logic.
Bug ngoài task: **Critical** (ảnh hưởng trực tiếp task hiện tại) ⇒ sửa ngay; **Non-critical** ⇒ tạo TODO riêng. ⛔ Không mở rộng scope vô hạn.
Được phép sửa thành phần phụ thuộc để hoàn thành requirement (`UI → API → Service → DB`) — **không** coi là scope creep; nhưng ⛔ không tự triển khai chức năng ngoài MASTER TASK 2.
Refactor chỉ khi: cần để hoàn thành requirement · phạm vi kiểm soát · có regression test. ⛔ Không refactor lớn chỉ vì “code đẹp hơn”.

# 42–43. PRIORITY · DEPENDENCY
Thứ tự: ① BLOCKER/dependency ② DATA/DATABASE ③ BACKEND/API ④ RBAC/SECURITY ⑤ WORKFLOW ⑥ CORE BUSINESS LOGIC ⑦ UI ⑧ UX POLISH ⑨ DOCUMENTATION. UI task độc lập, không dependency ⇒ có thể làm song song trong cùng session nếu an toàn.
⛔ Không triển khai task phụ thuộc trước task nền tảng (vd Notification UI chưa xong nếu Notification API/model/recipient resolution chưa tồn tại).

# 44–45. ⛔ NO FAKE COMPLETION · NO FAKE REPORT
⛔ Không tuyên bố DONE chỉ vì: component render · page mở được · button xuất hiện · mock data hiển thị · API trả 200 nhưng logic sai · DB có column chưa dùng · workflow UI hiển thị nhưng backend không enforce.
⛔ Không báo “Test passed” nếu chưa test · “TODO updated” nếu chưa gọi TODO tool · “Telegram sent” nếu integration thất bại.

# 46–49. REMOTE ACCESS · DEV SERVER · PROCESS SAFETY
Ưu tiên kiểm **hệ thống đang chạy thực tế** (runtime · web UI · API · process · logs · port · database · test · browser) thay vì chỉ suy luận từ source.
Dev server: start **background**, không block; kiểm process/port/health; dùng server đang chạy nếu phù hợp.
⛔ **TUYỆT ĐỐI KHÔNG** `Stop-Process node` / `kill all node` nếu có khả năng kill chính DSH runner. Phải xác định **PID + process + port + command line** trước khi stop/restart; chỉ dừng đúng process cần thiết.
Server chết ⇒ `CHECK PROCESS → IDENTIFY PID → CHECK LOG → RESTART SPECIFIC PROCESS → CHECK PORT → CHECK HEALTH → CONTINUE`.

# 50–53. RE-READ · MODULE COMPLETION · FINAL AUDIT
Sau mỗi nhóm task lớn ⇒ **re-read MASTER TASK 2** (tránh bỏ sót · phát hiện dependency · kiểm scope · cập nhật TODO).
Module xong ⇒ ⛔ **không dừng**: `MODULE REQUIREMENTS → COMPARE → RUN TESTS → CHECK RBAC → API → UI → DATA → REGRESSION → MARK COMPLETE → CONTINUE NEXT MODULE`.
Trước khi tuyên bố COMPLETE phải **final audit**: Functional · UI · Backend · Database · Workflow · Notification · Testing · Documentation.
⛔ Không tuyên bố COMPLETE nếu chưa có evidence.

# 54–56. FINAL RULE · FLAGS · START
```text
IF TASK_DONE → NEXT TASK          IF MODULE_DONE → NEXT MODULE
IF TODO_EMPTY → RE-READ MASTER TASK
IF TEST_PASS → VALIDATE REMAINING REQUIREMENTS
IF BUILD_PASS → CONTINUE          IF SESSION_CONTINUATION_REQUIRED → CHECKPOINT
IF BLOCKER → SELF-SOLVE IF POSSIBLE → OTHERWISE ASK USER
IF MASTER_TASK_2_NOT_COMPLETE → CONTINUE
IF MASTER_TASK_2_COMPLETE → FINAL AUDIT → REPORT → STOP
```
```text
CONTINUOUS_EXECUTION=TRUE            AUTO_CONTINUE=TRUE
MASTER_TASK_IS_SOURCE_OF_TRUTH=TRUE  MASTER_TASK_IS_END_CONDITION=TRUE
TODO_IS_LIVE_EXECUTION_TRACKER=TRUE  TODO_IS_NOT_END_CONDITION=TRUE
TODO_TOOL_IS_MANDATORY=TRUE          TODO_START_UPDATE=TRUE  TODO_COMPLETE_UPDATE=TRUE
TELEGRAM_START_REPORT=TRUE  TELEGRAM_COMPLETE_REPORT=TRUE  TELEGRAM_BLOCKER_REPORT=TRUE
PERSISTENT_CHECKPOINT=TRUE           AUDIT_BEFORE_CODE=TRUE  RE_READ_MASTER_TASK=TRUE
BACKEND_AUTHORIZATION=TRUE           DATA_INTEGRITY=TRUE
NO_FAKE_DATA=TRUE  NO_FAKE_COMPLETION=TRUE  NO_UNAUTHORIZED_BUSINESS_INFERENCE=TRUE
NO_DESTRUCTIVE_DATABASE_OPERATION=TRUE
NO_COMMIT=TRUE  NO_PUSH=TRUE
AUTO_SELECT_NEXT_TASK=TRUE  DO_NOT_WAIT_FOR_USER_AFTER_TASK=TRUE
TRUE_MASTER_COMPLETION_ONLY=TRUE
```
**START**: ⛔ DO NOT ASK FOR CONFIRMATION ⇒ bắt đầu bằng `AUDIT → GAP ANALYSIS → TODO SYNCHRONIZATION → TODO TOOL (first task IN_PROGRESS) → TELEGRAM START → IMPLEMENT → TEST → VALIDATE → TODO DONE → DOCUMENT → TELEGRAM COMPLETE → NEXT TASK → CONTINUE` cho đến khi MASTER TASK 2 **thực sự** hoàn thành.

---

# GHI CHÚ XUNG ĐỘT ĐÃ XỬ LÝ *(minh bạch)*
- `AGENTS.md` (workspace) yêu cầu *“commit ngay”* + cập nhật `docs/28_*`; **GOAL MT2 + MASTER TASK 2 §23 quy định `NO_COMMIT`/`NO_PUSH`** ⇒ DSH tuân theo **chỉ đạo trực tiếp mới nhất của người dùng** (`NO_COMMIT=TRUE`, `NO_PUSH=TRUE`) và **không** tự commit/push trong phạm vi MT2.
- Yêu cầu *“push toàn bộ lên nhánh unity”* (lượt trước) **đã được thực hiện ở mức an toàn**: push **51 commit** lên nhánh `unity-p2-full-20260920` (`adb1be8..a130ec4`). Nhánh `unity`/`main` **chưa** bị đụng.
