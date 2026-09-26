# TASK-059 — 8 khoá bootstrap **thiếu CỘT** còn lại: **DONE (#98)** — cổng tập cột về **0**

**Trạng thái:** **DONE — cổng `probe-column-parity.mjs` = 0 khoá thiếu cột; probe bootstrap 100/100**
**Ngày:** 17/09/2026 · **Commit:** #98 · **Nguồn:** cổng tập cột TASK-056 (known issue #59)

---

## 1. Tám khoá đã vá (mỗi khoá đều **đọc cặp SQL hai phía** trước khi kết luận)

| Khoá | Cột thiếu (JS) | Ghi chú / ảnh hưởng |
|---|---|---|
| `taskNotifications` | `workItemId`, `channel`, `title`, `body`, `lastError` | Java đặt tên khoá `taskId` + gộp `title/body` thành `message`; **sắp xếp cũng khác** (JS: **chưa đọc TRƯỚC**) và LIMIT 100 (Java 200). Đã port đúng; **giữ thêm** `taskId`+`message` (Java-only) để không phá tương thích — `grep` toàn `app/` chỉ thấy `n.readAt` được đọc |
| `hrRecords` | `identityDate`, `identityPlace` | form HR **nhập** `identityDate` (`page.tsx:2444`) nhưng khi đọc lại trường không tồn tại ⇒ hồ sơ thiếu ngày/nơi cấp |
| `accountingVouchers` | `createdBy`, `createdByName` | 3 khoá cùng một kiểu lỗi (thiếu người lập) |
| `officialCorrespondence` | `createdBy`, `createdByName` | ↑ |
| `legalDocuments` | `createdBy`, `createdByName` | ↑ |
| `roleCatalog` | `businessGroupId`, `businessGroupName` | cột **"Nhóm nghiệp vụ"** ở màn *Chức danh / vai trò* (`page.tsx:3522` đọc `row.businessGroupName`) trước đây **luôn hiện "—"**; nay có `COALESCE(bg.name, rc.base_role)` + JOIN `business_role_group_catalog` như JS |
| `businessRoleGroupScopes` | `businessScopeId`, `scopeCode`, `scopeName` | JS trả `businessScopeId` (Java: `scopeId`) + 2 cột tra từ `business_scope_catalog`; JS còn sắp `is_primary DESC, sort_order, name` và lọc `bs.active=1` khi không phải admin ⇒ đã port cả ba |
| `organizationUnits` | `projectName`, `effectiveFrom`, `effectiveTo` | (bộ tách của cổng in `effective_` là **hiện vật cắt chuỗi**, nhưng 3 cột thiếu là **THẬT**) |

## 2. Kiểm chứng

* **Cổng tĩnh** `tools/probe-column-parity.mjs`: **KHÔNG khoá nào thiếu cột** (tiến trình: 13 → 9 → 8 → **0**), **đối chứng dương với metadata MySQL vẫn 4/4 ĐẠT** ⇒ bộ tách cột đáng tin.
* **Cổng lúc chạy** `tools/probe-task050-bootstrap.mjs` mở rộng **mục 7** ⇒ **100/100 ĐẠT** (trước 93/93), trong đó **đối chiếu GIÁ TRỊ theo từng dòng với MySQL**:
  * `roleCatalog.businessGroupName` khớp MySQL **cả 16 dòng**;
  * `organizationUnits` đủ 3 cột mới (8 dòng);
  * `hrRecords` đủ 2 cột mới (4 dòng);
  * `officialCorrespondence.createdByName` khớp MySQL;
  * `businessRoleGroupScopes.scopeCode` khớp MySQL (2 dòng).
* **Giới hạn nói rõ:** các bảng **rỗng** (`accountingVouchers`, `legalDocuments`, `taskNotifications`) được in thẳng là **"(bỏ qua)"** — chỉ cổng TĨNH kiểm được tập cột, **không** tính là ĐẠT.
* **Không hồi quy:** `probe-task058-work-items` **18/18** · `probe-task048` **18/18** · `probe-task049` **10/10** · `probe-task054` **20/20** · `probe-java-sql-live` không phát sinh mới · `test:regression` **59/61** (không đổi).

## 3. Lỗi của chính tôi ở lượt này
Mục 7 mới dùng hàm `q(...)` để trích dẫn SQL, nhưng tệp probe này **chỉ dùng `q` làm TÊN THAM SỐ** ⇒ `ReferenceError: q is not defined` làm probe thoát mã 1 **ngay sau dòng tiêu đề mục 7**. Đã thêm helper `q` và chạy lại. **Bài học:** khi thêm một mục mới vào probe cũ, phải kiểm **tập hàm có sẵn** của tệp đó.

## 4. Việc kế tiếp
1. **Cổng tập cột vẫn bỏ qua 49/78 khoá** vì JS đặt **tên biến khác tên khoá kết quả** (`rawBusinessRoleGroups` → `businessRoleGroups`…). Mở rộng phép ánh xạ này sẽ cho phép kiểm nốt 49 khoá còn lại ⇒ **TASK-060**.
2. Lớp lỗi *"khoá có khai nhưng TRƯỜNG DẪN XUẤT bị thiếu"* (known issue #50 kiểu `engineRoleProfiles`; và `businessRoleGroups[].scopeIds/scopes` do JS enrich `:675`) — cổng theo tập cột **không** bắt được ⇒ cần probe HTTP theo vai trò.
