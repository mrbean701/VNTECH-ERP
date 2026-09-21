# TASK-130 — TEST LUỒNG CẤP PHÁT + XUẤT KHO (`WF-XUATKHO-01`) BẰNG ĐÚNG TÀI KHOẢN TỪNG VAI TRÒ

- **Ngày**: 2026-09-21 · **Nhánh**: `unity-p2-full-20260920`
- **Commit**: `6efcdc5` (probe) · `0b24724` (đặt mật khẩu demo + đối chứng âm đúng cho `decide_approval`)
- **Kết luận ngắn**: `issue_stock` chạy **ĐÚNG VAI TRÒ** (`tkhodemo` **HTTP 200**, phiếu `posted` ngay),
  quyền bị chặn **ĐÚNG** (2 đối chứng âm **403**), tồn kho + `stock_movements` **ĐÚNG SỐ**.
  **PHÁT HIỆN THẬT**: nghiệp vụ xuất kho **KHÔNG** đi qua chuỗi duyệt `WF-XUATKHO-01` —
  `stock_issues` sinh ra **đã `posted`** trong **1 lệnh HTTP**, và `WF-XUATKHO-01` (2 bước
  CHT → Kế toán) **có trong dữ liệu nhưng KHÔNG có mã nào đọc nó**.

---

## 1. Payload `issue_stock` — trường BẮT BUỘC *(dẫn chứng tệp:dòng)*

**Bản Java (đường đang phục vụ `:9000` → `:18081`)**

| Việc | Tệp:dòng |
|---|---|
| Nhận action | `java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java:1179-1185` |
| Thân xử lý | `java-backend/application/src/main/java/com/vntech/erp/application/service/StockManagementUseCase.java:53-162` |
| Ghi DB | `java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/WarehouseStockStoreAdapter.java:111-170` |

| Trường | Bắt buộc | Điều kiện kiểm (Java:53-123) | Kiểu |
|---|---|---|---|
| `projectId` | ✔ | `accessScope.requireProjectAccess(..., write)` (:58) | string |
| `fromWarehouseId` | ✔ | `requireWarehouseAccess` (:60) + `findActiveWarehouse` phải thuộc **đúng** dự án (:74) | string |
| `teamId` | ✔ | `findTeam(teamId, projectId)` — tổ đội phải thuộc dự án (:66) | string |
| `requestId` | ✔ | `findRequestForIssue` + MR phải `status ∈ {approved, ordered, partial_received, received, partial_issued}` (:68-73) | string |
| `lines[]` | ✔ | ≥ 1 dòng, mỗi dòng: `materialId` + `requestItemId` + `quantity > 0`; dòng phải khớp `(requestItemId, requestId, materialId)` trong `material_request_items` (:87-123) | array |
| `lines[].contractId` | ✖ | tuỳ chọn — suy từ dòng MR rồi MR header; **rỗng cả 3 ⇒ 400 “MR thiếu Contract ownership.”** (:95-98) | string |
| `lines[].workPackageCode` / `installationArea` | ✖ | tuỳ chọn (:119-120) | string |
| `receivedByName` / `note` | ✖ | tuỳ chọn (:135,:139) | string |
| **`issuedBy` / `approvedBy` / `status`** | ✖ | **KHÔNG nhận từ payload** — `issuedBy=approvedBy=principal.userId()` (:134,:136), `status` bind **cứng `"posted"`** (adapter :121) | — |

**Bản JS tham chiếu** — `scripts/system-route.mjs:1725-1729` (payload y hệt: `projectId, fromWarehouseId,
teamId, requestId, lines[].materialId/quantity/requestItemId`), `:32` khai capability `issue_stock: "canCreate"`,
`:17` khai module `issue_stock: ["teams","warehouse_issue"]`. Java phản chiếu đúng:
`java-backend/application/src/main/java/com/vntech/erp/application/rbac/ActionRbacRegistry.java:88`
(`"issue_stock" → ["teams","warehouse_issue"]`) và `:273` (`→ "canCreate"`).

**Vai trò được phép** — `StockManagementUseCase.java:54`:
`rbac.requireRole(..., List.of("warehouse","commander","admin"))` ⇒ **chỉ `thu_kho`/`warehouse`, `cht`/`commander`, `admin`**.

---

## 2. Phiếu xuất ĐÃ TẠO THẬT

| | |
|---|---|
| `issue_no` | **`PX-PRJ-DEMO-01-2026-0016`** (`ISS_238979be-d696-4d11-a117-a732212f014e`) — lượt `--apply` cuối |
| Người tạo | **`tkhodemo`** (`USR_8984cf69-c2d7-4162-bb4f-03ab51427e1e` · `thu_kho`/`warehouse`) ⇒ **HTTP 200** ✔ |
| Kho nguồn → kho nhận | `KHO-PRJ-DEMO-01` (`WH_51e0f009-…`) → **kho tổ đội `TD-PRJ-DEMO-01-TD-01`** (`WHTEAM_3d658322-…`) của tổ **`TD-01`** (`TEAM_8c1fecd9-…`) |
| Số dòng | **2** (`stock_issue_items`: `SMII_5858a33a-…`, `SMII_93dd09c9-…`) |
| Số lượng | **KHAC-VLXD-004 ×5 cây** + **KHAC-VLXD-005 ×10 bao** · `installed_qty = 0` cả 2 dòng ✔ |
| `request_id` | **CÓ gắn**: `MR_f4636c1c-85db-4b32-bf03-9592c17ed591` (phiếu `DNMH-PRJ-DEMO-01-2026-0136`, `status=approved`) |
| Các lượt chạy khác | `PX-PRJ-DEMO-01-2026-0013` (`ISS_f3b64e29-…`) · `…-0015` (`ISS_2e1b3654-…`) — cùng vai trò `tkhodemo`, đều **200** |

---

## 3. Chuỗi duyệt `WF-XUATKHO-01` — HTTP code THẬT & `status` sau mỗi bước

| Bước | Ai | Action | HTTP | `stock_issues.status` sau bước |
|---|---|---|---|---|
| (tạo) | `tkhodemo` | `issue_stock` | **200** | **`posted`** ← *sinh ra đã posted, KHÔNG có `draft`/`pending`* |
| 1 | `cha.ht` | `decide_approval{requestId:issueId, stage:1}` | **400** | `posted` (không đổi) |
| 2 | `kttdemo` | `decide_approval{requestId:issueId, stage:2}` | **400** | `posted` (không đổi) |

`400` = `"Không tìm thấy đơn yêu cầu."`. ⚠ **400 ở đây là ĐỐI CHỨNG ÂM ĐẠT** (đúng thiết kế hiện tại),
không phải HỎNG: `decide_approval` **chỉ** nhận `material_requests`
(`RequestManagementUseCase.java:600` → `RequestStore.findRequestForApproval`), nên truyền `issueId` vào là 400.
Cảnh báo hệ thống tự trả về khi tạo phiếu (`SystemController.java:1183` → `RequestStoreAdapter.java:22-33`):
> `"stock_issue ISS_238979be-…: chưa có bản ghi phê duyệt nào (quy trình động chưa khởi tạo) — vẫn cho phép theo chế độ CHỈ CẢNH BÁO."`

### 3.1 ⛔ TRẢ LỜI CÂU HỎI CỦA CAPTAIN: xuất kho **CÓ** đi qua chuỗi duyệt `WF-XUATKHO-01` KHÔNG?

**KHÔNG.** Bằng chứng (tệp:dòng):

1. **`status` bind cứng** — `WarehouseStockStoreAdapter.java:113-121`:
   `INSERT INTO stock_issues (…, status, …) VALUES (…, "posted", …)` ⇒ phiếu **đã posted** ngay trong
   lệnh INSERT đầu tiên; **không tồn tại** trạng thái `draft`/`pending_approval` cho phiếu xuất.
2. **Không có action nào khởi tạo chuỗi duyệt cho `stock_issue`** — grep toàn bộ
   `java-backend/**/*.java` cho `(approve|reject|confirm|submit|decide)_issue` ⇒ **0 kết quả**;
   `decide_approval` (`SystemController.java:1063-1070` → `RequestManagementUseCase.decideApproval`)
   chỉ nhận `material_requests`.
3. **`WF-XUATKHO-01` chỉ là dữ liệu “mồ côi”**: `workflow_definitions` có `WF-XUATKHO` /
   `WF-XUATKHO-01` (`module_key='warehouse_issue'`, `is_default=1`, `active=1`) và `workflow_steps`
   có `WFS-XK-1` (`Cha huy truong / BCH xac nhan`, `single`, `required_permission=canApprove`,
   approver `cha.ht`) + `WFS-XK-2` (`Ke toan xac nhan`, `single`, `canApprove`, approver `kttdemo`).
   Nhưng grep `warehouse_issue` trong `java-backend/**/*.java` chỉ ra **2 chỗ**: `ActionRbacRegistry.java:88`
   (ánh xạ RBAC) và `BootstrapDataAdapter.java:1703` (lọc module cho bootstrap) — **không chỗ nào** đọc
   `workflow_steps` của `WF-XUATKHO` để sinh bản ghi duyệt. Khớp với SQL: `SELECT COUNT(*) FROM approvals WHERE entity_type='stock_issue'` = **0**.
4. **Cơ chế hiện có chỉ là CHỈ CẢNH BÁO**: `RequestStoreAdapter.java:22-33` trả mảng `warnings`,
   không ném lỗi ⇒ `SystemController.java:1183` đính `warnings` vào response 200.
5. Thứ duy nhất được ghi thêm sau khi xuất là **`supply_workflow_steps`** (bước tổng `step='issue'`,
   `status='completed'`) — `StockManagementUseCase.java:150` → `WarehouseStockStoreAdapter.java:204-213`;
   **không phải** 2 bước `cha.ht` → `kttdemo`.

⇒ **Đây là phát hiện thật (gap giữa cấu hình workflow và mã thi hành).** Hai cách khắc phục ĐỀ XUẤT
(**không tự làm**, cần người dùng quyết vì chạm `java-backend/**`):
- **(A) Nối dây**: thêm nhánh `stock_issue` cho `decideApproval` + tạo `approvals` khi `issue_stock`
  (bước 1 `cha.ht` `canApprove` → bước 2 `kttdemo` `canApprove`), đổi `stock_issues.status` bind cứng
  `"posted"` thành `"pending_approval"` rồi chỉ chuyển `posted` khi duyệt xong.
- **(B) Sửa dữ liệu/UI**: tắt `WF-XUATKHO` (`UPDATE workflow_definitions SET active=0 WHERE id='WF-XUATKHO'`)
  và nêu rõ trong UI rằng xuất kho **không** có bước duyệt.

---

## 4. Hệ quả tồn kho — SQL + số THẬT

### 4.1 `stock_movements` — CÓ phát sinh dòng cho phiếu xuất ✔

```sql
SELECT id,movement_type,material_id,from_warehouse_id,to_warehouse_id,quantity,reference_type,reference_id,posted_by
FROM stock_movements WHERE reference_id='ISS_238979be-d696-4d11-a117-a732212f014e';
```
| movement_type | material | from → to | qty | posted_by |
|---|---|---|---|---|
| `SMI` | `MAT_fc920779-…` (KHAC-VLXD-004) | `WH_51e0f009-…` → `WHTEAM_3d658322-…` | **5** | `tkhodemo` |
| `SMI` | `MAT_c3ff35ff-…` (KHAC-VLXD-005) | `WH_51e0f009-…` → `WHTEAM_3d658322-…` | **10** | `tkhodemo` |

Tổng `stock_movements` `movement_type='SMI'`: **3 → 9** sau 3 lượt `--apply` (mỗi phiếu 2 dòng ✔).
Kèm **4 dòng `contract_stock_ledger`** mỗi phiếu (kho nguồn **−qty**, kho tổ đội **+qty**) — đúng multi-contract.

### 4.2 Tồn kho TRƯỚC/SAU (bảng tồn THẬT = tổng hợp `stock_movements`, đúng cách mã tính tồn:
`WarehouseStockStoreAdapter.java:52-58`)

| Chỉ số | TRƯỚC (baseline đầu ngày) | SAU (3 lượt probe) | Δ |
|---|---|---|---|
| Tồn `KHO-PRJ-DEMO-01` · KHAC-VLXD-004 | **59** | **44** | **−15** (3 lượt × 5) ✔ |
| Tồn `KHO-PRJ-DEMO-01` · KHAC-VLXD-005 | **148** | **118** | **−30** (3 lượt × 10) ✔ |
| Tồn kho tổ đội `TD-PRJ-DEMO-01-TD-01` · KHAC-VLXD-004 | **1** | **16** | **+15** ✔ |
| Tồn kho tổ đội `TD-PRJ-DEMO-01-TD-01` · KHAC-VLXD-005 | **2** | **32** | **+30** ✔ |
| Cặp 2 vật tư ở kho nguồn (tổng) | 207 | 162 | −45 |
| Cặp 2 vật tư ở kho tổ đội (tổng) | 3 | 48 | +45 |

⇒ **Bảo toàn vật lý tuyệt đối** (kho nguồn −45 = kho tổ đội +45). Không có bảng tồn riêng
(`SHOW TABLES LIKE '%stock%'` → `contract_stock_ledger`, `contract_stock_reconciliations`,
`stock_count_items`, `stock_counts`, `stock_issue_items`, `stock_issues`, `stock_movements`,
`stock_reservations`) ⇒ tồn là **sổ cái `stock_movements`**, đúng thiết kế.

### 4.3 `stock_issue_items` — đúng số dòng + số lượng ✔

```sql
SELECT material_id,request_item_id,quantity,installed_qty,contract_id,work_package_code,installation_area
FROM stock_issue_items WHERE issue_id='ISS_238979be-d696-4d11-a117-a732212f014e';
```
| material | request_item | quantity | installed_qty | contract_id |
|---|---|---|---|---|
| `MAT_c3ff35ff-…` | `MRI_45b4eda3-…` | **10.0000** | **0.0000** | `PCON_78092ea4-…` |
| `MAT_fc920779-…` | `MRI_f5b8a193-…` | **5.0000** | **0.0000** | `PCON_78092ea4-…` |

Tổng `stock_issue_items`: **6 → 12** (6 dòng mới, mỗi phiếu 2 dòng, **đúng** payload) ✔

---

## 5. QUYỀN — 2 đối chứng âm (dán HTTP code thật)

| # | Đối chứng âm | Tài khoản | HTTP | Nguyên văn |
|---|---|---|---|---|
| A | user **KHÔNG có quyền** gọi `issue_stock` | `engineer.demo` (ksda) | **403** ✔ | `Tài khoản không có quyền thực hiện nghiệp vụ này.` (`StockManagementUseCase.java:54` → `RbacService.java:81`) |
| A2 | user **KHÔNG có quyền** gọi `issue_stock` | `giamdoc.demo` (director) | **403** ✔ | *(y hệt)* — `giamdoc.demo` có `can_create` nhưng **sai vai trò** nghiệp vụ |
| B | duyệt **SAI BƯỚC** | `kttdemo` duyệt bước 1 | **403** ✔ | `Tài khoản không có quyền tại dự án.` (`RequestManagementUseCase.java:603` → `AccessScopeService.java:109`) |

**Đối chứng DƯƠNG tương ứng (chống “chặn oan”, không chỉ toàn 403):**
`cha.ht` **HTTP 200** và `kttdemo` **HTTP 200** khi đăng nhập; `tkhodemo` **HTTP 200** khi `issue_stock`
(ràng buộc thủ kho của task), và **lượt trước khi cấp phạm vi kho thì `receive_goods` của `tkhodemo`
đã từng 403** — nay `user_warehouse_scopes` có 12 dòng `write` (đo lại: 4 dòng ở `KHO-PRJ-DEMO-01`,
trong đó có `USR_8984cf69-…`= `tkhodemo`) ⇒ **gate kho hoạt động đúng cả 2 chiều**.

⚠️ **`requireActionModule` KHÔNG phải cổng chặn ở đây**: `user_module_permissions` cho **mọi** tài khoản demo
`warehouse_issue.can_create = 1` (đo: 12/12 user) ⇒ lệnh 403 của đối chứng A đến từ **cổng VAI TRÒ**
(`requireRole`), không phải cổng module — đúng như tài liệu `ProductionRoleCounterProofTest`.

---

## 6. TRẠNG THÁI PHIẾU ĐỀ NGHỊ (`material_requests`) sau khi xuất kho

```sql
SELECT id,status,approval_stage,supply_status FROM material_requests WHERE id='MR_f4636c1c-85db-4b32-bf03-9592c17ed591';
SELECT id,requested_qty,issued_qty,installed_qty,line_status FROM material_request_items WHERE request_id='MR_f4636c1c-…';
```

| Cột | TRƯỚC | SAU (3 lượt xuất) |
|---|---|---|
| `material_requests.status` | `approved` | **`approved`** ← **KHÔNG đổi** ⚠ |
| `material_requests.approval_stage` | `5` | `5` (không đổi) |
| `material_requests.supply_status` | `awaiting_po` | **`awaiting_po`** ← **KHÔNG đổi** ⚠ |
| `material_request_items.issued_qty` (VLXD-004) | **0.0000** | **15.0000** ✔ |
| `material_request_items.issued_qty` (VLXD-005) | **0.0000** | **30.0000** ✔ |
| `material_request_items.line_status` | `approved` | **`approved`** ← **KHÔNG đổi** ⚠ (đáng lẽ `issued`) |
| `stock_reservations` (active) | 0 | 0 |

**Đọc kết quả**: khâu **tiến độ cấp phát ĐÚNG** (`issued_qty` cộng dồn khớp 15/25 và 30/60),
nhưng **cột trạng thái KHÔNG phản ánh việc đã xuất kho**:
- `WarehouseStockStoreAdapter.java:185-191` (`updateRequestItemIssued`) chỉ cộng `issued_qty`/`installed_qty`
  và đặt `line_status='issued'` **chỉ khi** `issued_qty+received_qty >= requested_qty` — với cấp một phần
  (5/25, 10/60) thì `line_status` **giữ nguyên** ⇒ **không có giá trị nào cho “cấp một phần”**.
- `material_requests.status`/`supply_status` **không có lệnh UPDATE nào** trong luồng xuất kho
  (`issueStock` chỉ gọi `updateRequestItemIssued`, `releaseReservationsForRequest`,
  `insertSupplyWorkflowStepIssued` — `StockManagementUseCase.java:141-150`).
⇒ **PHÁT HIỆN THẬT #2**: sau khi xuất kho, phiếu đề nghị vẫn `approved` / `awaiting_po` —
người dùng **không thể nhìn phiếu đề nghị để biết “đã cấp phát hay chưa”**; chỉ đọc được ở
`material_request_items.issued_qty` (hoặc qua màn phiếu xuất). Cần quyết định: đặt thêm `partial_issued`
khi `0 < issued < requested`, và `issued` khi đủ.

---

## 7. Kết quả probe

```
node tools/probe-stock-issue-flow.mjs            # in kế hoạch, KHÔNG gọi HTTP
node tools/probe-stock-issue-flow.mjs --apply    # thực thi
```

| Lượt | Kết quả | Ghi chú |
|---|---|---|
| 1 (chưa đặt mật khẩu) | **9/12** | ❌ `kttdemo` **401** (mật khẩu không phải `Vntech@2026`) ⇒ 2 bước đối chứng âm dùng `kttdemo` ra 401 **giả** |
| 2 (sau khi thêm admin `update_user`) | **17/19** | ❌ 2 bước `decide_approval(issueId)` bị đếm HỎNG dù **400 là đúng** ⇒ kỳ vọng sai của probe |
| 3 (chốt bản đầu) | **19/19 bước ĐẠT** | 0 bước HỎNG |
| 4 (**lượt chạy sáng 21/09 — phát hiện probe tự cạn dữ liệu**) | **15/18** | ❌ `issue_stock` **400 “số lượng cấp lũy kế vượt nhu cầu MR”** — **KHÔNG phải lỗi hệ thống**: chính 3 lượt probe trước đã cấp **hết** `MR_f4636c1c-…` (`issued_qty` 25/25). ⇒ probe hard-code 1 phiếu ⇒ **không chạy lại được** |
| **5 (bản tự chọn phiếu — chốt)** | **19/19 bước ĐẠT** | chạy lại lần 2 ⇒ vẫn **19/19** (tự nhảy sang phiếu kế tiếp) ✔ |

### 7.1 ĐÃ SỬA PROBE THÀNH “TỰ CẤP DỮ LIỆU” (repeatable)

`tools/probe-stock-issue-flow.mjs` — bỏ hard-code `MR_f4636c1c-…`, thêm `pickRequest(boot)`:

| Điều kiện lọc (đo từ bootstrap, không đoán) | Lý do |
|---|---|
| `request.projectId = PRJ-DEMO-01` + `status ∈ {approved, ordered, partial_received, received, partial_issued}` | đúng điều kiện cho phép cấp phát ở `StockManagementUseCase.java:71-73` |
| dòng còn `requested_qty − issued_qty ≥ 1` | tránh 400 «cấp lũy kế vượt nhu cầu MR» (:110-111) |
| **`(materialId, contractId)` PHẢI có dòng `contractStockBalances` ở kho nguồn, số dư ≥ 1** | tránh 400 «Contract không đủ tồn kế toán tại kho nguồn» — lỗi đo được với phiếu `0002` (`material_request_items.contract_id = PCON_a6d9b6a3-…` nhưng kho nguồn chỉ có ownership `PCON_78092ea4-…`) |
| gửi kèm `lines[].contractId` tường minh | loại bỏ nhánh suy diễn `line → MR header → rỗng` (:95-98) |
| `issueQty = min(5, còn dư, ownership)` | luôn cấp một phần ⇒ đo được cả `partial` |

**Bằng chứng repeatable:** lượt 5 tạo `PX-PRJ-DEMO-01-2026-0024`; lượt 6 (chạy lại ngay) tự chọn phiếu
khác và tạo `PX-PRJ-DEMO-01-2026-0025` — **cả hai 19/19**.

### 7.2 ĐO LẠI HỆ QUẢ sau bản tự chọn phiếu (lượt 5)

```sql
SELECT id,issue_no,status,issued_by,from_warehouse_id,team_id,request_id FROM stock_issues
 WHERE id='ISS_95fd0b7d-37e8-4334-944e-febd7d96d36f';
```
| Cột | Giá trị |
|---|---|
| `issue_no` | **`PX-PRJ-DEMO-01-2026-0024`** |
| `status` | **`posted`** (sinh ra đã posted — lặp lại đúng kết luận mục 3.1) |
| `issued_by` | `USR_8984cf69-…` = **`tkhodemo`** |
| `from_warehouse_id` → `team_id` | `WH_51e0f009-…` → `TEAM_8c1fecd9-…` (TD-01) |
| `request_id` | `MR_62b3e402-…` (**0002 của lượt 4 bị loại**; lượt 5 chọn `DNMH-PRJ-DEMO-01-2026-0154`) |

| Đo | Giá trị |
|---|---|
| `stock_issue_items` | **2 dòng**, `quantity=5` mỗi dòng, `installed_qty=0`, `contract_id=PCON_78092ea4-…` ✔ |
| `stock_movements` | **2 dòng `SMI`**, `WH_51e0f009-… → WHTEAM_3d658322-…`, qty **5** & **5**, `posted_by=tkhodemo` ✔ |
| `contract_stock_ledger` | 4 dòng: kho nguồn **−5/−5**, kho tổ đội **+5/+5** ✔ |
| `approvals` `entity_type='stock_issue'` | **0** (lặp lại: không có chuỗi duyệt) |
| Tổng `stock_issues` / `stock_issue_items` / `SMI` | **12 / 20 / 17** |

**Trạng thái phiếu đề nghị (lượt 5, phiếu `…-0154`)**: `status` = **`approved`** (không đổi),
`approval_stage` = `5`, `supply_status` = **`awaiting_bch_confirmation`** (không đổi sau xuất kho);
`material_request_items.issued_qty` **0 → 10** (5+5) ✔, `line_status` = **`delivered_pending_confirmation`**
⇒ **củng cố phát hiện #2**: chỉ số lượng đổi, **cột trạng thái phiếu đề nghị vẫn không phản ánh việc đã xuất kho**.

---

## 8. Cổng kiểm

| Cổng | Kết quả |
|---|---|
| `npx tsc --noEmit` | **exit 0** (0 lỗi) ✔ — chạy lại sau bản tự-chọn-phiếu |
| `npm run test:regression` | **tests 69 · pass 69 · fail 0** · exit 0 ✔ |
| `npm run test:workflow` | **ĐẠT** ✔ (`Workflow VNTECH ERP V5.3.0 FULL W2 passed: …`) |
| Java `mvn -pl web -am test` | **KHÔNG chạy** — đợt này **không sửa dòng Java nào** (`git show --stat`: chỉ `tools/probe-stock-issue-flow.mjs`) |
| `node tools/probe-stock-issue-flow.mjs --apply` | **19/19 bước ĐẠT** (2 lượt liên tiếp đều 19/19) ✔ |

## 9. BLOCKED / UNKNOWN — cần người dùng quyết

1. **BLOCKED (cần quyết định thiết kế)** — xuất kho **không** đi qua `WF-XUATKHO-01` (mục 3.1).
   Đề xuất (A) nối dây hay (B) tắt workflow. **Không tự sửa `java-backend/**`.**
2. **BLOCKED (cần quyết định dữ liệu)** — `material_requests.status`/`supply_status`/`line_status`
   **không đổi** sau khi xuất (mục 6). Đề xuất: thêm nhánh cập nhật `partial_issued`/`issued`.
3. **LỖI THẬT nhỏ (chưa sửa — ngoài ràng buộc cho phép? cần xác nhận)**:
   `WarehouseStockStoreAdapter.java:205-212` dùng `ON DUPLICATE KEY UPDATE` cho `supply_workflow_steps`,
   nhưng bảng **KHÔNG có UNIQUE key** (`SHOW INDEX` → chỉ `PRIMARY(id)` + `supply_workflow_request_idx(request_id,step,queued_at)` non-unique)
   ⇒ mỗi lần xuất cùng một MR **chèn thêm 1 dòng `step='issue'`** (đo: `MR_f4636c1c-…` có **4 dòng**
   `issue/completed` sau 3 lượt) ⇒ **nhân bản vết nghiệp vụ**. Cách sửa đề xuất: thêm `UNIQUE KEY (request_id, step)`
   (migration) **hoặc** đổi sang `UPDATE … ; INSERT IF NOT EXISTS` trong adapter.
   ⚠ **KHÔNG tự chạy DDL** và **không tự sửa Java** — chờ người dùng quyết.
4. **UNKNOWN**: 6 phiếu `pending_approval` ở bước 5 của luồng mua hàng (từ TASK-128) vẫn còn —
   ngoài phạm vi TASK-130.
5. **Dữ liệu do probe sinh (ĐÃ GHI, không phải DDL)**: các phiếu xuất `PX-PRJ-DEMO-01-2026-0013/0015/0016`
   (phiếu 0136) và **`…-0017/0018/0019/0020/0021/0022/0023/0024/0025`** (bản tự-chọn-phiếu) + các dòng
   tương ứng trong `stock_issue_items`, `stock_movements`, `contract_stock_ledger`,
   `supply_workflow_steps`; `material_request_items.issued_qty` của các phiếu MR đã dùng đã tăng
   (do probe). Tổng hiện tại: **12 `stock_issues` · 20 `stock_issue_items` · 17 movement `SMI`**.
   Nếu cần hoàn tác ⇒ **SQL hoàn tác phải do captain chạy**.
