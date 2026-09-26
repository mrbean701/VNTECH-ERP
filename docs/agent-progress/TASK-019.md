# TASK-019 — Sửa 5 lỗi mã vai trò còn sót trong quản lý sản lượng/tổ đội

## Status

DONE (phần mã đã sửa và **đã biên dịch thành công**; chưa đóng gói lại JAR chạy được — xem Known Limitations)

## Objective

Sửa 5 lời gọi `requireRole` trong `ProductionManagementUseCase` đang truyền **mã vai trò TRƯỚC khi
đổi tên** (`"commander"`, `"project"`), khiến người dùng hợp lệ có vai trò `cht` / `da_nv` bị **403 oan**.

## Previous State

* `ProductionManagementUseCase` — 5 dòng dùng mã cũ:
  * dòng 186 `saveTeamSubcontract` → `List.of("admin", "commander", "project")`
  * dòng 205 `saveTeamProduction` → `List.of("admin", "commander", "project")`
  * dòng 228 `approveTeamProduction` → `List.of("admin", "commander", "project")`
  * dòng 243 `saveTeamPayment` → `List.of("admin", "commander", "accountant", "project")`
  * dòng 267 `settleTeamSubcontract` → `List.of("admin", "commander", "accountant")`
* Nhóm việc này **cố ý để lại** khi sửa 11 lời gọi khác ở TASK-002 vì ngoài phạm vi mua hàng.

## Implemented

* Đổi **đúng 5 lời gọi**, chỉ thay mã vai trò, giữ nguyên cấu trúc và danh sách còn lại:
  * `commander` → `cht`
  * `project` → `da_nv`
* Thực hiện bằng **script có chốt chặn**: script đếm số lần xuất hiện của từng mẫu (mong đợi 3 · 1 · 1)
  và **DỪNG, KHÔNG ghi tệp** nếu số đếm không khớp. Sau khi sửa, script tự kiểm lại: **không còn lời
  gọi `requireRole` nào dùng mã cũ**.

## Files Changed

* `java-backend/application/src/main/java/com/vntech/erp/application/service/ProductionManagementUseCase.java`

## Frontend Changes

Không đổi giao diện. Tác động gián tiếp: người dùng `cht` / `da_nv` không còn bị chặn oan ở 5 nghiệp
vụ sản lượng/tổ đội nên các nút tương ứng mới thực sự dùng được.

## Backend Changes

Thay mã vai trò trong điều kiện kiểm quyền của 5 use case: hợp đồng tổ đội · sản lượng tổ đội ·
duyệt sản lượng tổ đội · thanh toán tổ đội · quyết toán hợp đồng tổ đội.

## Database Changes

No database changes.

## Permission Changes

**SỬA LỖI PHÂN QUYỀN.** Trước: người dùng vai trò `cht` hoặc `da_nv` bị **403** ở 5 nghiệp vụ trên.
Sau: họ được phép như thiết kế. `admin` và `accountant` giữ nguyên quyền.

## Workflow Changes

No workflow changes.

## Important Decisions

* **`canonicalRoleCode` là nguồn sự thật duy nhất về mã vai trò.** Đã đối chiếu **cả hai bản**:
  * JS: `function canonicalRoleCode(value) { … ({engineer:"ksda", commander:"cht", project:"da_nv",
    procurement:"kh_nv", warehouse:"thu_kho"})[code] || code; }`
  * Java: `UserManagementUseCase.canonicalRoleCode` (dòng 584) — ánh xạ **giống hệt**.
  ⇒ `requireRole` **luôn phải nhận mã ĐÃ CHUẨN HOÁ**.
* Bằng chứng cùng chuẩn: `PurchaseManagementUseCase` và `RequestManagementUseCase` đã dùng mã chuẩn
  (`"kh_nv"`, `"da_nv"`, `"thu_kho"`, `"cht"`, `"ksda"`) kèm ghi chú *"SỬA LỖI VAI TRÒ"*.

## Dependencies

* Phụ thuộc TASK-002 (bật kiểm quyền ở tầng action) — chính vì TASK-002 đã bật kiểm nên các mã sai
  này mới thành lỗi chặn thật thay vì lỗi ngủ.
* Không task nào phụ thuộc TASK-019.

## Known Limitations

* **CHƯA ĐÓNG GÓI LẠI JAR** ⇒ bản backend đang chạy vẫn là JAR cũ (16/09 15:46) nên **sửa chưa có
  hiệu lực lúc chạy**. Hai rào cản của môi trường:
  1. `mvn package` bị **sandbox chặn ghi** vào `C:\Users\PC\.m2\repository` (ngoài workspace).
  2. `mvn -o` (offline) **thiếu artifact plugin** chưa từng được tải (`plexus-utils:3.5.1`,
     `maven-filtering:3.3.1`, `commons-lang3:3.12.0`…) nên cũng không build được.
  ⇒ Cần chạy `mvn -DskipTests package` ở môi trường có quyền ghi `.m2` **và** có mạng, rồi khởi động
  lại backend để kiểm chứng bằng HTTP.
* Vì chưa chạy lại backend, **chưa có smoke test HTTP** xác nhận người dùng `cht`/`da_nv` hết 403.

## Testing

* Script sửa: in ra `tìm thấy 3 (mong đợi 3)` · `1 (mong đợi 1)` · `1 (mong đợi 1)` rồi mới ghi tệp.
* Kiểm lại sau khi sửa: **không còn lời gọi `requireRole` nào dùng mã cũ**.
* **Biên dịch thật:** giải nén JAR đã build để lấy `BOOT-INF/classes` + **98 jar** phụ thuộc làm
  classpath, rồi `javac -nowarn -encoding UTF-8` lên tệp đã sửa → **exit 0** (chỉ có cảnh báo
  `unchecked` vốn đã tồn tại từ trước, không phải lỗi). ⇒ Thay đổi không làm hỏng kiểu dữ liệu.
* Đã đối chiếu 5 dòng sau khi sửa: cả 5 đều dùng `cht` / `da_nv`.

## Validation Result

PARTIAL — mã đã sửa và **biên dịch PASS**, nhưng chưa đóng gói lại JAR nên chưa có xác nhận lúc chạy.

## Git Commit

Commit cùng lượt (#19).

## Next Task

TASK-009 — U-09 đợt 6 (13 màn còn lại). Nếu cổng ảnh/probe vẫn bị chặn (TASK-B02) thì tiếp tục chọn
việc **kiểm chứng được không cần trình duyệt**.

## Continuation Notes

* **Quy tắc bất di bất dịch:** `requireRole` chỉ nhận **mã vai trò ĐÃ CHUẨN HOÁ**
  (`ksda` · `cht` · `da_nv` · `kh_nv` · `thu_kho`) — không bao giờ dùng `engineer` · `commander` ·
  `project` · `procurement` · `warehouse`. Nguồn sự thật ở `UserManagementUseCase.canonicalRoleCode`.
* **Muốn kiểm chứng lúc chạy:** `mvn -DskipTests package` (cần quyền ghi `.m2` + mạng) → khởi động lại
  backend → gọi HTTP action tương ứng (`save_team_subcontract`, `save_team_production`,
  `approve_team_production`, `save_team_payment`, `settle_team_subcontract`) bằng tài khoản vai trò
  `cht`/`da_nv` và xác nhận **không còn 403**.
* **Cách kiểm chứng khi không build được Maven:** giải nén JAR đã build để lấy classpath
  (`BOOT-INF/classes` + `BOOT-INF/lib/*`), rồi `javac -cp "<classpath>" -d <thư mục tạm> <tệp.java>`.
  Đây là cách tôi đã dùng và cho kết quả exit 0. Nhớ dọn thư mục tạm sau khi xong.
