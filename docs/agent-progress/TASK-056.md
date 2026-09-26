# TASK-056 — CỔNG ĐỐI CHIẾU **TẬP CỘT** SQL giữa JS và Java: **DONE (#94)**

**Trạng thái:** **DONE** — cổng mới `tools/probe-column-parity.mjs`, **có đối chứng dương 4/4**
**Ngày:** 17/09/2026 · **Commit:** #94

---

## 1. Vì sao phải có cổng này

Cổng theo **TÊN KHOÁ** (`probe-bootstrap-keys.mjs`) đã bắt được lớp lỗi *"thiếu khoá"*, nhưng **không** bắt được lớp lỗi *"khoá có mà THIẾU CỘT"* — đã gặp **3 lần liên tiếp**:
1. `constructionDailyLogs` thiếu `itemCount` + `completedQty` ⇒ cột "Khối lượng" luôn 0 (TASK-053);
2. `transferOrders` thiếu 7 trường ⇒ "Đã xuất"/"Đã nhận" luôn 0 (nay đã vá ở TASK-057);
3. lớp *"khoá CÓ khai nhưng giá trị `null`/rỗng theo vai trò"* (`engineRoleProfiles` = null cho mọi tài khoản — known issue #50) mà cổng theo tên khoá cũng **không** thấy.

## 2. Cách làm

* Đọc **câu SQL hai phía**: Java `data.put("KEY", … query("""SQL""") …)` trong `BootstrapDataAdapter.java`; JS `const|let|var KEY = await all(\`SQL\`)` trong `scripts/system-route.mjs`.
* **Tách tập tên cột đầu ra**: tìm danh sách `SELECT` ở mức ngoài cùng (bỏ qua CTE — lấy `SELECT` cuối trước `FROM` đầu), cắt theo dấu phẩy ở mức ngoài cùng (có **mask literal** `'…'`, `"…"`, `` `…` `` để không tách nhầm), rồi mỗi mục lấy `AS <alias>` hoặc định danh cuối.
* So **JS − Java** ⇒ in ra các cột **JS có mà Java thiếu** (kèm chiều ngược lại là "Java thừa").

## 3. ĐỐI CHỨNG DƯƠNG (bắt buộc — vì bộ tách là suy luận văn bản)

Cổng tự kiểm bộ tách bằng **metadata THẬT của MySQL**: dựng **bảng tạm** từ chính câu SQL rồi `SHOW COLUMNS`.

> **Bài học kỹ thuật:** cách `SELECT * FROM (<sql>) x LIMIT 0` **KHÔNG** in dòng tiêu đề trong chế độ `--batch` (đã thử và bị loại) ⇒ phải dùng `CREATE TEMPORARY TABLE … AS <sql>; SHOW COLUMNS …`. Ngoài ra `%s` (placeholder `.formatted(...)` của Java) và `?` (bind) được thay bằng `NULL` để câu SQL hợp lệ.

Nếu bộ tách lệch metadata ⇒ cổng in **HỎNG** và thoát mã 1 (**không cho kết luận** từ danh sách). Lượt chạy cuối: **4/4 khoá kiểm được khớp HOÀN TOÀN** (`constructionDailyLogs` 23/23 cột · `issues` 12/12 · `returns` 11/11 · `companyAvailability` 13/13).

## 4. Kết quả

| Thời điểm | Khoá thiếu cột |
|---|---|
| Lần chạy đầu | **13** khoá |
| Sau khi vá 4 khoá (TASK-057) | **9** khoá |

**9 khoá còn lại** (mỗi khoá **phải đọc cặp SQL hai phía** trước khi kết luận): `workItems` (14 cột **+ thiếu hẳn bộ lọc phòng ban của JS `:715`** ⇒ trả về **tất cả** công việc cho mọi người — nghiêm trọng nhất) · `taskNotifications` (5 cột, lệch cả tên khoá `workItemId`/`taskId`) · `businessRoleGroupScopes` (3) · `roleCatalog` (2) · `organizationUnits` (2, trong đó `effective_` **nghi là hiện vật của bộ tách**) · `accountingVouchers` (2) · `hrRecords` (2, đã đọc mã: thiếu `identityDate`/`identityPlace` — **thật**) · `officialCorrespondence` (2) · `legalDocuments` (2).

## 5. Giới hạn (ghi rõ)
* Chỉ so được **các khoá TRÙNG TÊN** hai phía: **30 khoá** so được, **49 khoá bỏ qua** (JS đặt tên biến khác tên khoá kết quả, ví dụ `rawBusinessRoleGroups` → `businessRoleGroups`).
* `data.put` nhiều nhánh (`admin ? query(A) : query(B)`) thì **hợp** các khối SQL ⇒ nhánh thiếu cột vẫn bị bắt nhưng không quy được về đúng nhánh.
* Mục **không** có `AS` thì lấy định danh cuối ⇒ với biểu thức phức tạp có thể sai (vì vậy mới bắt buộc có đối chứng dương).
* Cổng là **cổng để RÀ**, thoát mã 0 khi đối chứng dương đạt — **không** phải cổng chặn hồi quy.
