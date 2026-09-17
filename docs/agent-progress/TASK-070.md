# TASK-070 — Cổng ĐỘ PHỦ TRƯỜNG cho 10 khoá Java-only: trường API trả về có DỮ LIỆU THẬT không?

**Trạng thái:** ✅ DONE — cổng mới, **8/8 ĐẠT · 2 phép đo KHÔNG thực hiện được** (nói rõ, không tính ĐẠT); đã commit
**Ngày:** 17/09/2026 · **Nhánh:** `unity`
**Cổng:** `tools/probe-task070-field-coverage.mjs` (mới)

---

## 1. Vì sao có task này

TASK-069 mới kiểm được **khoá + SỐ DÒNG** của 11 khoá Java-only. Lớp lỗi còn lại là **TRƯỜNG BÊN TRONG**:
khoá CÓ, số dòng ĐÚNG, nhưng một trường **luôn rỗng** vì port sai alias hoặc không `SELECT` cột đó —
đúng dạng đã gặp nhiều lần trong dự án:

* `roleCatalog.businessGroupName` luôn `"—"` (TASK-059) ⇒ cột "Nhóm nghiệp vụ" trống;
* `constructionDailyLogs.itemCount`/`completedQty` luôn `0` (TASK-053) ⇒ cột "Khối lượng" trống;
* `materials.adminMaterials` thiếu hãng/ĐVT/tồn tối thiểu (TASK-040).

## 2. Cách đo (độc lập với mã Java — chỉ đọc SQL + MySQL)

1. Lấy **câu SQL** của từng khoá từ chính adapter (mô-đun dùng chung `tools/lib/sql-parity-extract.mjs`).
2. Lấy **tập trường** API trả về (danh sách `SELECT … AS alias`).
3. Với mỗi trường, suy **tên cột nguồn** bằng `camel → snake_case`; nếu cột đó **có thật** trong bảng nguồn thì đo
   trên MySQL: `COUNT(*)` và `COUNT(*) WHERE cột IS NOT NULL [AND cột <> '']`.
4. So với payload THẬT: nếu MySQL **có dữ liệu** mà **mọi dòng API đều rỗng** ⇒ **HỎNG**. Nếu MySQL cũng rỗng ⇒
   **bỏ qua** (không có gì để chứng minh — **KHÔNG tính ĐẠT**).

**Bẫy đã gặp khi viết cổng (ghi lại):** vị từ `cột <> ''` làm MySQL 8 báo
`ERROR 1525: Incorrect DATETIME value: ''` với cột `DATETIME` ⇒ cổng phải đọc **`DATA_TYPE`** từ
`information_schema` và chỉ thêm điều kiện chuỗi cho cột thuộc họ văn bản.

## 3. KẾT QUẢ: **8/8 ĐẠT · 2 phép đo không thực hiện được**

| khoá | dòng | trường | đối chiếu được | không đối chiếu được | kết quả |
|---|---|---|---|---|---|
| `workflowDefinitions` | 1 | 11 | 11 | 0 | ĐẠT (10 trường có dữ liệu ở cả hai phía) |
| `workflowSteps` | 5 | 10 | 10 | 0 | ĐẠT (9) |
| `workflowStepApprovers` | 5 | 7 | 4 | `fullName`, `employeeCode`, `role` | ĐẠT (4) |
| `departmentModulePermissions` | 51 | 12 | 10 | `organizationCode`, `organizationName` | ĐẠT (10) |
| `systemLevelCatalog` | 5 | 9 | 8 | `rank` | ĐẠT (8) |
| `staffDirectory` | 12 | 12 | 9 | `roleName`, `organizationCode`, `organizationName` | ĐẠT (8) |
| `formFieldConfigs` | 65 | 15 | 15 | 0 | ĐẠT (15) |
| `supplySteps` | 23 | 11 | 11 | 0 | ĐẠT (11) |
| `teamMembers` | **0** | 12 | — | — | **bỏ qua** (không có dòng) |
| `workItemEvents` | **0** | 12 | — | — | **bỏ qua** (không có dòng) |

⇒ **Không tìm thấy lỗi "trường luôn rỗng"** trong 8 khoá đo được. Đây là **kết quả ÂM có kiểm chứng**, kèm
danh sách **rõ ràng** phần chưa kiểm được — không được đọc thành "10 khoá đã hoàn toàn đúng".

## 4. Phần CHƯA kiểm được (ghi rõ, không giấu)

1. **7 trường đặt alias KHÁC tên cột nguồn** nên cổng không đối chiếu được:
   `fullName` · `employeeCode` · `role` (workflowStepApprovers) · `organizationCode` · `organizationName`
   (departmentModulePermissions, staffDirectory) · `roleName` · `rank` (systemLevelCatalog).
   Đây **đúng là nhóm dễ ẩn lỗi nhất** (đều là trường dẫn xuất/JOIN) ⇒ cần phép đo riêng.
2. **2 khoá rỗng dữ liệu**: `teamMembers` (bảng `team_members` 0 dòng) và `workItemEvents`
   (`work_item_events` 0 dòng) ⇒ không có dòng để kiểm trường.
   **Bù lại một phần:** `workItemEvents` **đã** được kiểm ở cổng khác — `tools/probe-task058-work-items.mjs`
   **tự dựng 7 `work_items` + 2 `work_item_events` TẠM**, đăng nhập 6 tài khoản thật, và **18/18 ĐẠT**
   (kèm dọn sạch). `teamMembers` thì **chưa** có cổng nào kiểm.
3. Câu JOIN nhiều bảng: cổng chỉ tìm cột trên **bảng ĐẦU TIÊN trong `FROM`** ⇒ có thể bỏ sót cột của bảng sau.
4. Cổng **KHÔNG phán nội dung nghiệp vụ** — chỉ phán *"DB có dữ liệu mà API trả rỗng"*.

## 5. Quan hệ với "13 khoá trùng tên bỏ qua"

Cổng TĨNH (`probe-column-parity.mjs` / `probe-clause-parity.mjs`) bỏ qua các khoá mà **hai phía đặt tên biến khác nhau**.
Với **cổng HỢP ĐỒNG `AppData`** của TASK-069 (**95 khoá × 6 tài khoản**), phép kiểm **khoá + kiểu** nay phủ được
**12/13** khoá Java-only (chỉ `boqMappingCandidates` nằm ngoài vì UI **không đọc** nó — đã xác nhận là **payload chết**).
⇒ Phần "13 khoá bỏ qua" **về mặt KHOÁ** đã được cổng mạnh hơn phủ; phần còn lại là **TRƯỜNG BÊN TRONG** (mục 4.1).

## 6. Tệp thay đổi

| Tệp | Thay đổi |
|---|---|
| `tools/probe-task070-field-coverage.mjs` | **mới** — cổng độ phủ trường (đọc `DATA_TYPE` để tránh lỗi 1525), in rõ trường không đối chiếu được + phép đo bỏ qua |
| `docs/agent-progress/MASTER_STATUS.md` | CURRENT TASK → TASK-071 · LAST COMPLETED → TASK-070 · Known Problems bổ sung phần chưa kiểm được |
| `docs/agent-progress/TASK_INDEX.md` | dòng TASK-070 |
