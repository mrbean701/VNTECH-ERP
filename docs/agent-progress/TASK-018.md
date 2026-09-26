# TASK-018 — Đối chiếu action giữa bản JS tham chiếu và bản Java đã port

## Status

DONE

## Objective

Xác minh cáo buộc trong báo cáo audit (docs/24) rằng `ACTION_CATALOG.json` **lệch khoảng 50 action**
so với SystemController, và xử lý nếu đúng.

## Previous State

* `docs/24_SYSTEM_AUDIT_REPORT.md` ghi: SystemController có **224 nhánh `case`**, `ACTION_CATALOG.json`
  có **174 action** ⇒ "catalog lệch 50 action".
* Catalog được **SINH TỰ ĐỘNG** bởi `java-backend/tools/generate-action-catalog.mjs` từ
  `scripts/system-route.mjs` (bản JS tham chiếu) — **không phải** từ Java.
* Chưa ai đối chiếu đúng hai nguồn với nhau.

## Implemented

* Viết `tools/probe-action-parity.mjs`: trích tập action từ **cả hai nguồn** (nhánh
  `action === "xxx"` trong JS và nhánh `case "xxx"` trong Java), rồi phân loại
  chỉ-có-ở-JS · chỉ-có-ở-Java · có-ở-cả-hai; đồng thời đối chiếu với catalog trên đĩa.
* **Phát hiện regex đếm sai:** SystemController có NHIỀU `switch`, trong đó một cái duyệt **tên chỉ
  mục SQL**. Regex bắt hết `case` nên tính cả 38 tên như `materials_code_uidx`, `users_username_uidx`,
  `primary_key_f` thành "action". Đã tách nhóm theo mẫu tên chỉ mục (`_uidx`, `_idx`, `_key`…).
* Kiểm giá trị module của 12 action chỉ có ở Java trong `ActionRbacRegistry.java`.

## Files Changed

* `tools/probe-action-parity.mjs` (MỚI)
* `docs/24_SYSTEM_AUDIT_REPORT.md` (đính chính)
* `docs/agent-progress/MASTER_STATUS.md` · `TASK_INDEX.md`

## Frontend Changes

Không đổi giao diện.

## Backend Changes

Không đổi mã backend — đây là việc **đo và đối chiếu**.

## Database Changes

No database changes.

## Permission Changes

**Không phát hiện lỗ hổng.** Cả 12 action chỉ có ở Java đều đã được kiểm quyền:
1 action có module thật · 8 action để danh sách module RỖNG (cơ chế admin-guard: rỗng ⇒ chỉ admin) ·
3 action ghi rõ `["admin"]`.

## Workflow Changes

No workflow changes.

## Important Decisions

* **ĐÍNH CHÍNH báo cáo audit:** cáo buộc "catalog lệch 50 action" là **SAI**. Số đo đúng:
  * JS: **174** action · Java: **224** nhánh `case` thô, trong đó **38 là tên chỉ mục SQL** ⇒
    **186 action thật**.
  * Có ở cả hai: **174** · Chỉ có ở JS: **0** · Chỉ có ở Java: **12**.
  * Catalog khớp **hoàn toàn** với nguồn JS (0 lệch cả hai chiều) ⇒ **catalog KHÔNG cũ**.
  * Kết luận đúng: **bản port KHÔNG thiếu action nào**; Java có **thêm 12 action** so với bản JS.
* Việc cần làm chỉ là **tài liệu**: ghi lại 12 action Java-only để catalog không âm thầm bỏ sót.

## Dependencies

* Liên quan TASK-002 (bật kiểm quyền ở tầng action) — cơ chế admin-guard mà 11/12 action này dựa vào
  được thiết lập ở TASK-002.

## Known Limitations

* Catalog vẫn **không chứa 12 action Java-only** vì bộ sinh chỉ đọc nguồn JS. Muốn đưa vào phải sửa
  bộ sinh cho biết cả nguồn Java **hoặc** thêm mục ghi chú tay — chưa làm trong task này.
* 38 tên chỉ mục SQL vẫn nằm trong `switch` của SystemController; chúng không phải action nhưng làm
  **mọi phép đếm thô bằng regex trở nên sai** — cần nhớ khi viết công cụ đo sau này.

## Testing

* `node tools/probe-action-parity.mjs` → in đầy đủ các con số nêu trên.
* Kiểm registry: 12/12 action đều có mặt trong `ActionRbacRegistry.java` với module xác định
  (1 có module thật · 8 rỗng = admin-guard · 3 ghi rõ `admin`).

## Validation Result

PASS

## Git Commit

Commit cùng lượt (#18).

## Next Task

TASK-009 — U-09 đợt 6 (13 màn còn lại) khi cổng ảnh/probe chạy được lại; nếu chưa, chọn việc kiểm
chứng được bằng script.

## Continuation Notes

* **Đừng lặp lại sai lầm cũ:** đếm `case` trong SystemController bằng regex thô sẽ tính cả **38 tên
  chỉ mục SQL**. Luôn dùng `tools/probe-action-parity.mjs` (đã tách nhóm) thay vì tự viết lại phép đếm.
* **Catalog là dẫn xuất của bản JS**, không phải của Java. Khi cần biết "Java có đủ action chưa",
  hãy so **JS ↔ Java**, đừng so catalog ↔ Java.
* 12 action Java-only là **tính năng thêm khi port** (phân quyền phòng ban · cấp bậc hệ thống ·
  workflow · việc tự tạo). Chúng **đã được kiểm quyền đầy đủ**; chỉ thiếu tài liệu trong catalog.
