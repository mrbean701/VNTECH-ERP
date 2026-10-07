# TASK-142 — KIỂM THỬ HÀNH VI TOÀN HỆ THỐNG (E2E) + CHỐNG GHI CỨNG QUY TRÌNH

**Trạng thái:** chạy xong trên dữ liệu thật · **7 giai đoạn xanh · 1 giai đoạn bị chặn bởi lỗi sản phẩm** · báo cáo + nhật ký đã sinh · **chưa commit theo chỉ đạo của người dùng**.
**Phạm vi ghi tệp:** `tools/e2e/*.mjs` (không nằm trong vân tay nguồn) · `docs/KiemThuE2E/*` · `testlog.md` · `docs/dsh-state/*` · `docs/agent-progress/W-02-AUDIT-PROJECT-WAREHOUSE.md` · `tests/w02-project-warehouse-relation.test.mjs` · `tools/probe-schema-drift.mjs` · `tools/probe-java-sql-schema.mjs`.
**Ngày:** 02/10/2026 · **Người giao:** trực tiếp (không thuộc 110 mục master task).

---

## ① YÊU CẦU VÀ CÁCH HIỂU

Người dùng yêu cầu chạy toàn bộ chuỗi nghiệp vụ như một doanh nghiệp thật sử dụng:

> admin dựng phòng ban, người dùng, nhóm quyền, vai trò, chức danh, quy trình, tổ đội, dự án, ban chỉ huy → nhân sự lập hồ sơ · hợp đồng lao động · bảo hiểm → kế toán cấu hình hệ vật tư và **200 mã kèm tên phụ** → mỗi trưởng ban mở **2–3 phiếu đề nghị mua hàng** → người duyệt duyệt từng bước → phiếu thành đơn → tách đơn → đặt đơn → kho nhận → sinh phiếu nhập kho → điều chuyển kho → kho dự án xuất cho tổ đội → tổ đội trả lại vật tư. **Tất cả người dùng đều thao tác đúng, không dùng dữ liệu giả.** Sau đó kiểm tra quy trình có bị ghi cứng không, bằng cách đổi người duyệt từng bước rồi đảo thứ tự các phòng ban tham gia.

Ba ràng buộc tự đặt từ kinh nghiệm các vòng trước, ghi lại thành quy tắc vận hành:

| Ràng buộc | Vì sao |
|---|---|
| **Không dùng dữ liệu giả** — mọi lệnh ghi phải đọc lại xác minh | Một lời «thành công» trả về không phải bằng chứng (**D-070**) |
| **Không xoá dữ liệu có sẵn** — dữ liệu mới đặt tiền tố `E2E-` | Cơ sở dữ liệu đang chạy **không rỗng**: 19 người dùng, 5 dự án, sổ kho |
| **Không suy diễn từ mã nguồn** — mọi kết luận phải đo được trên hệ thống đang chạy | Ba lần khẳng định của tôi sai khi chỉ đọc mã (**D-078**) |

---

## ② KẾT QUẢ 8 GIAI ĐOẠN

| GĐ | Nội dung | Kết quả | Số đo thật |
|---|---|---|---|
| 1 | Dựng tổ chức: phòng ban, chức danh, nhóm quyền, tổ đội, dự án, ban chỉ huy | ✅ 7/7 | Dự án `E2E-DA-01`, kho `KHO-E2E-01`, BCH, 7 đơn vị, 13 tài khoản |
| 2 | Cấu hình quy trình duyệt | ✅ 4/4 | `WF-E2E-MUAHANG` 5 bước · `WF-MUAHANG-01` 4 bước (mặc định công ty) |
| 3 | Nhân sự: hồ sơ · hợp đồng lao động · bảo hiểm | ✅ 63/63 | `hrRecords` 22 · `laborContracts` 22 · `benefitRecords` 44 |
| 4 | Kế toán: 9 hệ vật tư + **200 mã kèm tên phụ** | ✅ 200/200 | `materials` 28 → 228 · `materialAliases` 267 · `materialCategories` 16 · `materialSubcategories` 42 |
| 5 | Dự án · bảng khối lượng · hợp đồng · phiếu đề nghị mua hàng | ✅ 12/12 | 3 phiếu gốc `…-0013..0015` · 3 phiếu sót `…-0016..0018` giữ làm bằng chứng |
| 6 | Duyệt đủ 5 bước · tách đơn · đặt đơn | ✅ 6/6 | 3 đơn `…-0001..0003`; `approve_po` do `e2e.kt` thực hiện |
| 7.0 | Cấp quyền chức năng theo vai trò | ✅ 32/32 | 9 vai trò · 29 cổng chức năng |
| 7.1 | Kho nhận hàng → 3 phiếu nhập · ảnh giao hàng · xác nhận giao hàng | ✅ 6/6 | `GRN-…-0001/0002/0003` |
| **7.2** | **Điều chuyển kho (STO)** | ⛔ **KHÔNG CHẠY ĐƯỢC** | «Thiếu kho Transit hệ thống.» — 0/11 kho có loại `transit` |
| 7.3 | Xuất kho cho tổ đội + tổ đội trả lại vật tư | ✅ 6/6 | `PX-E2E-DA-01-2026-0002` → `GRN-PX-2026-0002` → `RET-E2E-DA-01-2026-0001` |
| 8 | **Chống ghi cứng**: đổi người duyệt + đảo thứ tự phòng ban | ✅ 7/7 | 10/10 bước thành công · cấu hình khôi phục và đối chiếu lại |

---

## ③ CÂU HỎI CỐT LÕI: QUY TRÌNH CÓ BỊ GHI CỨNG KHÔNG?

### Kết luận: **KHÔNG.** Cả hai phép thử đều là dữ liệu cấu hình và đều đổi được.

**Phép thử 1 — đổi người duyệt từng bước.** Phiếu `DNMH-E2E-DA-01-2026-0019` được tạo sau khi đổi người duyệt bước 1 và bước 2:

- Người duyệt **cũ** bị máy chủ **từ chối** — không phải chỉ bị ẩn nút trên giao diện.
- Người duyệt **mới** duyệt được.

**Phép thử 2 — đảo thứ tự phòng ban.** Đổi chỗ `ASTAGE-3` ↔ `ASTAGE-4` (cả tên, mô tả, vai trò được phép, chế độ duyệt, thời hạn, thứ tự). Phiếu `DNMH-E2E-DA-01-2026-0020` cho ra chuỗi đúng như đã hoán:

```
1 CHT  |  2 Thư ký  |  3 Phòng Kế hoạch (e2e.khnv)  |  4 Phòng Dự án (e2e.project)  |  5 Giám đốc
```

**Phép âm thứ ba — bảo vệ thiết kế.** Thử đánh số lại một bước **đã có phiếu duyệt** (`stageNo` 3 → 9) ⇒ **bị từ chối**: `OpsTaskManagementUseCase` cấm đánh số lại bước đang có phê duyệt, để lịch sử không bị đổi nghĩa.

### Cơ chế thật (đọc từ mã, khớp với kết quả đo)

| Tầng | Nguồn dữ liệu | Vai trò |
|---|---|---|
| **A — dựng chuỗi** | `approval_stage_catalog` (`stage_kind='approval'`, `ORDER BY stage_no`) + `approval_project_assignments` (`projectId` + `stage` → `ownerUserId`) | Quyết định phiếu đi qua những bước nào, ai là chủ bước đó |
| **B — tham gia quyền duyệt** | `workflow_definitions` / `workflow_steps` / `workflow_step_approvers`, đọc qua `RequestManagementUseCase.canApproveRequestStage` → `store.stageApproverUserIds` | Cộng thêm người được gán trong cửa sổ «Quy trình phê duyệt» vào nhóm có quyền duyệt |

⭐ **`canApproveRequestStage` đối chiếu theo MÃ ĐỊNH DANH chủ bước** ⇒ đổi chủ bước là **thu hồi được** quyền của người cũ, không chỉ thêm người mới. Đã chứng minh sống.

⚠️ **Lưu ý kiến trúc quan trọng nhất:** cửa sổ «Quy trình phê duyệt» **không** dựng ra chuỗi phê duyệt — nhưng người được gán trong đó **vẫn có quyền duyệt**, vì máy chủ gộp hai nguồn. Giao diện cần nói rõ điều này, nếu không người dùng sẽ tưởng cấu hình ở đó vô nghĩa.

### Khôi phục

Sau khi thử, cấu hình đã được **trả về nguyên trạng** và **đối chiếu lại bằng cách đọc máy chủ** (`tools/e2e/khoi-phuc-quy-trinh.mjs`, EXIT=0):

- `WF-MUAHANG-01` (requests, mặc định công ty) — 4 bước · 4 người duyệt
- `WF-PO-01` (purchasing) — 2/2 · `WF-XUATKHO-01` (warehouse_issue) — 2/2 · `WF-NHAPKHO-01` (warehouse_receipt) — 2/2

⭐ **`WF-E2E-MUAHANG` là quy trình GẮN VỚI DỰ ÁN** (`project_id` có giá trị) nên **không** thay thế mặc định công ty — giữ lại làm bằng chứng. Không cần khôi phục.

---

## ④ LỖI SẢN PHẨM PHÁT HIỆN (L-01 … L-11)

| Mã | Vấn đề | Vị trí | Trạng thái |
|---|---|---|---|
| **L-09** | ⛔ **Bộ lướt bay dựng mới không có kho trung chuyển** mà lược đồ cũ có ⇒ `create_transfer_order`, `approve_central_return`, `receive_central_return` **không gọi được**; lại **không có thao tác tạo kho nào** để tự sửa | `drizzle/0030_kho_governance_transfer_reservation.sql:147` có dòng seed; `java-backend/…/db/migration/` không có · `StockManagementUseCase.java:624` | **Cần tập lướt bay mới + khởi động lại máy chủ — chờ người dùng duyệt** |
| **L-10** | ⛔ **3 bảng** máy chủ đọc ghi mà bộ lướt bay chưa hề tạo: `contract_reviews`, `contract_review_logs` (có trong `drizzle/0315`, **không** trong Flyway), `error_reports` (**không** có ở cả hai) | `ContractReviewStoreAdapter.java:75/82/129/142` · `ErrorReportStoreAdapter.java:46/94` | Đề xuất **gộp chung một đợt** với L-09 |
| **L-11** | 🔴 **ĐÃ SỬA LẠI 02/10 (vòng 199) — câu cũ «6 thao tác không có lớp cưỡng chế quyền nào» là KHÔNG CHÍNH XÁC.** Sự thật đo được nguyên văn: `list_contract_review` trả **HTTP 200 với dữ liệu thật** (`total=2`, hồ sơ `HĐLĐ-00002`) cho `e2e.kt` (kế toán) và `e2e.bgd` (giám đốc) — hai tài khoản mà chính máy chủ xác nhận **KHÔNG có** module `dept_legal_contract_review`. 6 tài khoản còn lại bị 403 ⇒ ranh giới đúng 2/8. Nguyên nhân: `RbacService.java:69` `if (isCompanyLeadership(user) && !required.contains("admin")) return;` ⇒ **vai trò `director` và `accountant` bỏ qua kiểm tra module**. Mở rộng ra **mọi** chức năng chỉ dựa vào lớp cửng ②, chứ không chỉ 6 action này. ✅ **ĐÃ KHÉP LẠI 02/10 (vòng 201) — chỉ còn MỘT lỗi thật: dòng 69.** Phép thử tách hai thông báo 403 của `RbacService` cho thấy registry **đang chạy bình thường**: `save_material`, `save_mar_approval`, `save_material_external_code` trả **B** («đã khai, thiếu quyền») cho `e2e.ns`, còn `list_contract_review` và `work_scope` trả **A** («chưa khai») — dù mã nguồn [ActionRbacRegistry.java:212](java-backend/application/src/main/java/com/vntech/erp/application/rbac/ActionRbacRegistry.java#L212) đã khai. ⇒ **JAR đang chạy cũ hơn mã nguồn**, đúng như D-081 giả định. Hệ quả: **403 cho 6 tài khoản là hành vi ĐÚNG** (chặn fail-closed), **không phải lỗi**; lỗi thật duy nhất là nhánh `isCompanyLeadership` ở dòng 69 bỏ qua kiểm tra module. [RbacService.java:69](java-backend/application/src/main/java/com/vntech/erp/application/rbac/RbacService.java#L69) · `tools/e2e/do-ranh-gi-quyen.mjs` | **Cần `mvn -o -B test`** (D-044) + quyết định nghiệp vụ có muốn `accountant`/`director` bỏ qua module không |
| **L-08** | ⛔ **Mọi dòng bảng khối lượng bị nhân đôi** — 12 lệnh ghi ⇒ 24 dòng | `BoqManagementUseCase.java:186-188` gọi `upsertSourceItem(item,false,now)`; **nhánh `UPDATE` `BoqStoreAdapter.java:161-175` thiếu `project_boq_item_id` trong `SET`** (nhánh INSERT dòng 391 thì có) | Cần biên dịch Java (D-044) |
| **L-06** | Số phiếu nhập sinh từ phiếu xuất và từ điều chuyển **trùng giữa các dự án** | `StockManagementUseCase.java:450-451` (`GRN-PX`) và `:328` (`GRN-STO`): bộ đếm theo `projectId` nhưng **số phiếu không mang dự án**; `return_stock` đã làm đúng dạng `RET-<projectCode>-<năm>-%04d` | Cần biên dịch Java |
| **L-05** | Mã vật tư mới bị gán nhầm **hệ thống** (phần lớn giá trị rơi vào `KHAC`) | `MaterialSystemCodes.contains` | Cần biên dịch Java |
| **L-04** | `save_user_access` cấp phạm vi dự án ở mức **`read`** dù có dòng trong bảng | `Map.has()` kiểm **sự tồn tại**, không kiểm **mức** (D-077) | Cần biên dịch Java |
| **L-03** | `save_email_settings` **xoá toàn cục** `approval_project_assignments` khi `assignments` là mảng; `recipients` bị xoá **vô điều kiện** | `AdminOpsManagementUseCase.java:93-96` · `AdminOpsStoreAdapter.java:65` | Cần biên dịch Java |
| **L-01/02** | `bootstrap.inventory` **chỉ liệt kê kho `type='site'`** ⇒ tổ đội báo «0 tồn» là báo động giả (tồn kho tổ đội nằm ở `contractStockBalances`); `stock_issues.received_by_name` NOT NULL nhưng không tài liệu hoá ⇒ HTTP 409 | `BootstrapDataAdapter` · `WarehouseStockStoreAdapter.java:110` | Đã ghi nhận |

⭐ **L-09 · L-10 · L-11 cùng một hình dạng:** phía máy chủ đã có tính năng, phía lược đồ dựng mới chưa kịp có bảng tương ứng. **Hệ quả: hệ thống cài mới từ bộ lướt bay sẽ không chạy được các tính năng đó.** Đề xuất gộp thành **một đợt bổ sung lướt bay** thay vì vá từng lỗi.

---

## ⑤ BA LỖI CỦA CHÍNH BỘ ĐO ĐÃ SỬA TRONG VÒNG NÀY

Ghi lại công khai vì nguyên tắc «không giấu lỗi của mình trong báo cáo của mình»:

1. **D-070 — bộ đo báo thành công cho 6 lệnh ghi thực tế không ghi gì.** Cờ `lenient` đã nuốt lỗi máy chủ. Đã đổi tên thành `boQuaLoi`, thêm hàm `coThat()` ném lỗi, và **bắt buộc đọc lại + đếm** sau mỗi lệnh ghi.
2. **D-071 — điều kiện dừng vòng lặp không bắt được lỗi.** `buoc()` bắt lỗi rồi trả về `null`, nên `if (r?.ok === false) break;` **không bao giờ chạy** ⇒ quay 8 vòng. Đã sửa thành `if (!r || r.ok === false) break;`.
3. **D-078 — hai khẳng định đỏ vì tiêu chí so sánh, không phải vì hệ thống.** Một khẳng định tự sinh chỉ số từ chính dữ liệu vừa ghi; một khảng đảo ngược điều kiện. Bài học: **luôn so với ảnh chụp GỐC**, không bao giờ dựng kỳ vọng từ đối tượng vừa sửa.

Ngoài ra, trong lúc chạy lại 7 cổng kiểm thử, phát hiện **hai cổng báo sai** — đã sửa:

- `probe-schema-drift` đọc **ảnh chụp** CSDL ngày 25/09 trong khi các tệp lướt bay sinh ra sau đó đã thêm cột ⇒ kết luận **thiếu 6 cột trong khi CSDL thật có đủ** (đọc lại được `jobRank="Chuyên viên"`, `grade="Bậc 3"`, `renewalRound=0`). Đã thêm **chốt chặn**: có tệp lướt bay nào mới hơn ảnh chụp thì công cụ dừng với «KHÔNG KẾT LUẬN» kèm lệnh trích xuất lại.
- `probe-java-sql-schema` tách danh sách cột gán bằng `split(",")` nên hàm có dấu phẩy bị cắt vụn ⇒ báo oan `CURRENT_TIMESTAMP`, `NOT`, `EXISTS` là cột. Đã thay bằng bộ tách nhận biết độ sâu ngoặc và dấu nháy. **3 báo oan → 0.**

Ngoài ra `tests/w02-project-warehouse-relation.test.mjs` chuyển đỏ **vì chính dữ liệu kiểm thử này** đổi số đo (kho 7 → 11, dự án 3 → 5). Đây là hành vi đúng của tệp thử — nó bám dữ liệu thật — nên đã cập nhật **tệp audit** và khẳng định trong tệp thử, ⛔ không sửa dữ liệu để khớp tài liệu.

---

## ⑥ CỔNG KIỂM THỬ SAU KHI KIỂM THỬ

| Cổng | Kết quả |
|---|---|
| `npm test` (lint + kiểu + hồi quy + quy trình) | ✅ **644 pass · 0 fail · 1 skip** · EXIT=0 |
| Đăng ký action phủ mọi thao tác | ✅ Đạt |
| Đối chiếu vai trò · phạm vi dự án · hai bản đăng ký | ✅ Đạt |
| Thao tác giao diện không hỏng trên đường máy chủ | ✅ Đạt — **0** thao tác trả HTTP 400 |
| Lệch lược đồ | ⚠️ **Không kết luận được** (ảnh chụp cũ — chốt chặn mới) |
| Đối chiếu mã với lược đồ | ⛔ Lỗi thật — **L-10** |
| Phủ quyền của action | ⛔ Lỗi thật — **L-11** |
| Vân tay nguồn | ✅ `VNTECH-FP-6F0D53DB64C96848` · 694 tệp · điểm bất biến đạt ở vòng 1 · `verify-vntech-fingerprint` **ĐẠT** |

---

## ⑦ SẢN PHẨM

| Tệp | Nội dung |
|---|---|
| `docs/KiemThuE2E/Bao-cao-kiem-thu-E2E-Giai-doan-3-den-9.md` | Báo cáo đầy đủ, 11 mục |
| `docs/KiemThuE2E/Bao-cao-kiem-thu-E2E-Giai-doan-3-den-9.docx` | Cùng nội dung, chuẩn hoá: A4 · lề 2 cm · Calibri 11pt · tiêu đề 22pt màu `1F4E79` · **12 700 byte · 7/7 phần XML hợp lệ** |
| `docs/KiemThuE2E/Bao-cao-kiem-thu-E2E-Giai-doan-1-va-Giai-doan-2.md` + `.docx` | Hai giai đoạn đầu |
| `testlog.md` | Nhật ký: §2 checklist 8 giai đoạn · §3 **29 dòng sự cố** · §4 tiến độ |
| `docs/dsh-state/DECISIONS.md` | **D-069 … D-079** (11 quyết định) |

Kịch bản kiểm thử nằm ở `tools/e2e/` — thư mục này **không** tham gia vân tay nguồn nên thêm/bớt tệp không làm đổi vân tay.

---

## ⑧ CÒN LẠI — CẦN NGƯỜI DÙNG

| # | Việc | Vì sao chưa tự làm |
|---|---|---|
| 1 | ⛔ Duyệt tập lướt bay bổ sung: kho trung chuyển + `contract_reviews` + `contract_review_logs` + `error_reports` | Số kế tiếp `V32…V35` **đã có sẵn trong kho mã** nhưng **chưa chạy** trên CSDL thật; `V36` còn bị giữ cho 2 việc đổi tên kho đã hoãn ⇒ đề xuất **`V37`** |
| 2 | ⛔ `mvn -o -B test` để biên dịch 5 bản vá Java đã chỉ đúng dòng (L-08, L-06, L-05, L-04, L-03) | **Máy này không có Maven** ⇒ không thể biên dịch Java ở đây (D-044) |
| 3 | ⛔ `npm run build` (cần đóng trình duyệt ở `:9000`) | D-052 quy tắc 1 |
| 4 | ⛔ Chốt lại cách đếm `108/110 (98,2 %)` của master task | Nhánh `unity` **chưa có giao diện cho phần 3** mà `TASK_INDEX.md:158` + `MASTER_STATUS.md:395` đã đánh dấu XONG ⇒ con số đang **thổi phồng**. Đã hỏi ở vòng 196, **chưa được trả lời** |
| 5 | ⛔ Đăng ký quyền cho 6 thao tác mù (L-11) | Cần biên dịch Java |
| 6 | ⛔ Làm rõ trên giao diện rằng cửa sổ «Quy trình phê duyệt» **không** dựng chuỗi nhưng **có** cấp quyền duyệt | Quyết định nghiệp vụ hiển thị — cần người dùng chốt cách diễn đạt |
| 7 | ⛔ `WorkflowModal.tsx:151` cho phép lưu một bước **không có người duyệt**, trong khi máy chủ từ chối | Sửa cần biên dịch; cách xử lý (chặn ngay · cảnh báo rõ hơn) là quyết định nghiệp vụ |

⛔ **Chưa commit, chưa push** — người dùng yêu cầu xem trước. **Nhánh `unity`, không merge `main`.**