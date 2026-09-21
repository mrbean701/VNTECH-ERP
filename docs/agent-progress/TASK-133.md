# TASK-133 — WF-XUATKHO-01 **BƯỚC ③④⑤** (xuất kho → thủ kho xác nhận đủ → sinh GRN)

- **Ngày**: 2026-09-21 · **Nhánh**: `unity-p2-full-20260920`
- **Phạm vi**: 3 bước CUỐI của luồng xuất kho + **TÁCH phần ghi kho ra khỏi bước ①** (nợ kỹ thuật đã đo) +
  xử lý 2 nợ đã đo ở TASK-130 (`material_requests.supply_status`, trùng dòng `supply_workflow_steps`).
- **Commit**: `38350c1` (port+use-case+registry ③④⑤) · `5872169` (adapter+controller) ·
  `1424731` (test H2 + **vá 3 LỖI THẬT** phát hiện khi chạy test) · `b08193e` (probe ③④⑤ + capability ③) ·
  `d121c1f` (probe: 2 phiếu MR độc lập + bỏ khẳng định sai về `approvedBy`)

---

## 1. State machine đầy đủ ①→⑤

| # | WF-XUATKHO-01 | Ai được làm (cổng VAI TRÒ) | Action | `stock_issues.status` SAU bước | Tệp:dòng |
|---|---|---|---|---|---|
| ① | tạo phiếu (chỉ cần quyền tạo) | `warehouse`·`commander`·`admin` | `issue_stock` | **`pending_cht`** | `StockManagementUseCase.java:53-54` (requireRole) · adapter `insertStockIssue:121-129` |
| ② | **chỉ huy trưởng duyệt** | `commander`·`admin` | `approve_stock_issue` | **`approved`** | `StockManagementUseCase.java:183-208` · adapter `approveStockIssue:246-262` |
| ③ | **tiến hành xuất kho** | `warehouse`·`commander`·`admin` + phạm vi kho nguồn | **`issue_stock_confirm`** | **`issued`** | `StockManagementUseCase.java:216-256` · adapter `issueStockConfirm:300-372` · controller `SystemController.java:1206` |
| ④ | **thủ kho xác nhận đã xuất đủ** | ⛔ **CHỈ `warehouse`·`admin`** (KHÔNG commander) | **`confirm_stock_issue`** | **`completed`** (+ `signed_at`) | `StockManagementUseCase.java:267-303` · adapter `confirmStockIssue:374-405` · controller `:1215` |
| ⑤ | **sinh GRN nhập kho khác** (⛔ không duyệt, chỉ cần **QUYỀN TẠO**) | `warehouse`·`engineer`·`admin` | **`create_issue_grn`** | **`grn_created`** | `StockManagementUseCase.java:314-378` · adapter `insertStockIssueGrn:431-465` · controller `:1224` |

### Tên trạng thái đã chọn + LÝ DO
| Trạng thái | Chọn | Lý do |
|---|---|---|
| `issued` (③) | ✅ | Mô tả bước là «**tiến hành** xuất kho» = hàng ĐÃ rời kho nguồn ⇒ dùng động từ quá khứ `issued`. ⛔ KHÔNG dùng `posted` vì `posted` là trạng thái của 10+ **phiếu CŨ** (đã ghi sổ trước TASK-132) — trùng tên sẽ khiến không phân biệt được phiếu cũ với phiếu mới đã qua ③. |
| `completed` (④) | ✅ | Khớp vựng trạng thái «hoàn tất» đang dùng toàn hệ thống (`material_requests`, `purchase_orders` đều có `completed`), và phân biệt rõ với `issued` (đã xuất ≠ đã xác nhận đủ). |
| `grn_created` (⑤) | ✅ | Nêu đúng SỰ KIỆN đã xảy ra (đã sinh phiếu nhập) và giữ được vết truy vết về `goods_receipts`; trùng vựng với `purchase_orders.status` khi phiếu nhập đã tạo. |

### Khoá ngoài — vì sao `pending_cht` / `approved` KHÔNG dùng tên khác
`pending_cht` (TASK-132) giữ nguyên: khớp `workflow_steps` WFS-XK-1 `canApprove → cha.ht` và
`approvals.department` «CHT xác nhận nhu cầu».

---

## 2. NỢ KỸ THUẬT ĐÃ XỬ LÝ Ở ③

### 2.1 Tách phần ghi kho ra khỏi đường tạo phiếu (nợ CHÍNH)
**TRƯỚC**: `insertStockIssue` ghi `stock_movements` (SMI) + **2** dòng `contract_stock_ledger`
(−qty kho nguồn, +qty kho tổ đội) **NGAY LÚC TẠO PHIẾU** ⇒ **trừ tồn kho ở bước ①**, TRƯỚC cả khi
CHT duyệt ⇒ bước ② chỉ là «treo biển».

**SAU**: phần ghi kho nằm ở `issueStockConfirm` (③) — `UPDATE stock_issues SET status='issued'
WHERE id=? AND status='approved'` là **chốt chặn trong chính câu UPDATE**, `changed == 0` ⇒ trả `false`
⇒ use-case trả **400** và **KHÔNG câu INSERT kho nào chạy** (chống đua + chống xuất lần 2 + chống xuất phiếu cũ).

> ⚠ **TƯƠNG THÍCH NGƯỢC**: **13 phiếu CŨ** đang `posted` (đo `SELECT status,COUNT(*) FROM stock_issues
> GROUP BY status` = `posted 13 · approved 1` trước lượt này) **giữ nguyên 100%** — không có bất kỳ câu
> `UPDATE`/`DELETE` nào chạm dữ liệu cũ. Phiếu cũ tiếp tục được coi là ĐÃ xuất kho (chúng đã có movement
> SMI + ledger từ bản port trước) ⇒ **không cần và không được sửa dữ liệu cũ**.

### 2.2 Cùng lỗi «ghi trước khi duyệt» ở tiến độ phiếu đề nghị (nợ #4)
`updateRequestItemIssued` (cộng `issued_qty` + set `line_status`) **cũng bị dời từ ① sang ③**.
**Bằng chứng dữ liệu THẬT** (đo MySQL trước khi sửa): `MRI_f5b8a193-646a-44a9-9b7f-0f78fcbff2d0`
= **25/25 `issued`** trong khi MR chưa cấp đủ ⇒ phiếu còn `pending_cht` đã làm dòng nhu cầu báo «đã cấp».

### 2.3 Trạng thái phiếu đề nghị (nợ #4)
Sau ③, ghi `material_requests.supply_status` = `partial_issued` (còn dòng chưa đủ) / `issued` (đủ) và
`material_request_items.line_status` tương ứng — SQL 1 câu dùng `EXISTS` trên chính `material_request_items`.

### 2.4 Trùng dòng `supply_workflow_steps` (nợ #5)
**TRƯỚC**: `INSERT ... ON DUPLICATE KEY UPDATE` nhưng bảng **KHÔNG có UNIQUE key** ⇒ mệnh đề không bao
giờ kích hoạt ⇒ mỗi lần xuất cùng 1 MR chèn thêm 1 dòng `step='issue'`.
**ĐO ĐƯỢC** (`SHOW INDEX FROM supply_workflow_steps`): chỉ `PRIMARY(id)` +
`supply_workflow_request_idx(request_id, step(191), queued_at)` **NON-unique** + `supply_workflow_status_idx`.
**Hệ quả đo trước khi sửa**: `MR_f4636c1c-…` = **5 dòng**, `MR_62b3e402-…` = **4 dòng**, `MR_f51722ae-…` = **2 dòng**.
**SAU (TASK-133)**: đổi sang **UPDATE-then-INSERT** (⛔ không `ALTER`, không DDL) ⇒ **đúng 1 dòng/MR**.
**Bằng chứng SAU: `MR_a1ad9a0d-…` = 1 dòng `issue`** (đo LIVE).

---

## 3. Bảng dữ liệu ảnh hưởng

| Bảng | ① | ② | ③ | ④ | ⑤ |
|---|---|---|---|---|---|
| `stock_issues` | INSERT (`pending_cht`) | UPDATE `status='approved'`, `approved_by` | UPDATE `status='issued'` | UPDATE `status='completed'`, `signed_at` | UPDATE `status='grn_created'`, `note` |
| `stock_issue_items` | INSERT (`installed_qty=0`) | — | — | — | (đọc) |
| `stock_movements` (**SMI**) | ⛔ **KHÔNG** (đã tách ra) | — | **INSERT** kho nguồn → kho tổ đội | — | — |
| `contract_stock_ledger` | ⛔ **KHÔNG** (đã tách ra) | — | **INSERT ×2** (−qty nguồn, +qty tổ đội) | — | — |
| `material_request_items` | — | — | UPDATE `issued_qty += qty`, `line_status` | — | — |
| `material_requests` | — | — | UPDATE `supply_status` (`partial_issued`/`issued`) | — | — |
| `supply_workflow_steps` | ⛔ (đã dời sang ③) | — | UPDATE-then-INSERT `step='issue'` (1 dòng/MR) | — | — |
| `approvals` | — | INSERT (`entity_type='stock_issue'`, stage 1) | — | — | ⛔ **KHÔNG** (không duyệt) |
| `goods_receipts` | — | — | — | — | **INSERT** (kho đích) |
| `goods_receipt_items` | — | — | — | — | **INSERT** (1 dòng/1 dòng phiếu xuất) |
| `stock_reservations` | UPDATE `released` | — | — | — | — |

**Tồn kho** = tổng hợp `stock_movements` (⛔ **KHÔNG có bảng tồn riêng** —
`WarehouseStockStoreAdapter.stockBalance:52-58`): `SUM(to_warehouse_id=W) − SUM(from_warehouse_id=W)`.

---

## 4. Bằng chứng

### 4.1 Tầng H2 (đỏ → xanh) — BẰNG CHỨNG CHÍNH, đầy đủ ①→⑤
`java-backend/web/src/test/java/com/vntech/erp/web/controller/StockIssueWorkflowSteps345Test.java`

| Bất biến được kiểm | Kết quả |
|---|---|
| ① tạo phiếu: `status='pending_cht'` · tồn kho nguồn **KHÔNG đổi** (20) · kho tổ đội **= 0** · **0 movement SMI** | ✅ |
| ② CHT duyệt: `status='approved'` · tồn kho **vẫn 20** (duyệt KHÔNG đụng kho) | ✅ |
| ③ xuất kho: `status='issued'` · **1 movement SMI** · **tồn nguồn 20 → 14 (GIẢM)** · **tồn tổ đội 0 → 6 (TĂNG)** · ledger nguồn 20 → 14 · ledger tổ đội 0 → 6 | ✅ |
| ④ xác nhận đủ: `status='completed'` · `signed_at` được đóng dấu | ✅ |
| ⑤ GRN: `status='grn_created'` · **1** `goods_receipts` đúng kho đích · **1** `goods_receipt_items` · **0** bản ghi `approvals` cho GRN | ✅ |
| MR: `supply_status` `awaiting_bch_confirmation` → **`partial_issued`** · `issued_qty` 0 → **6** · `line_status` → `partial_issued` | ✅ |
| Nợ #5: phiếu thứ 2 cùng MR ⇒ `supply_workflow_steps` **vẫn 1 dòng** `step='issue'`; tồn nguồn 14 → 8; `issued_qty` = **12** | ✅ |
| **ĐỐI CHỨNG ÂM ③**: gọi khi `pending_cht` ⇒ **400** · user không có quyền kho ⇒ **403** · gọi **lần 2** ⇒ **400** (0 movement thêm) · phiếu không tồn tại ⇒ **400** | ✅ |
| **ĐỐI CHỨNG ÂM ④**: `engineer` (ở tầng module `can_edit=1` để 403 CHẮC CHẮN từ `requireRole`) ⇒ **403** · phiếu chưa qua ③ ⇒ **400** · xác nhận **lần 2** ⇒ **400** · phiếu không tồn tại ⇒ **400** | ✅ |
| **ĐỐI CHỨNG ÂM ⑤**: phiếu chưa `completed` ⇒ **400** · user không có quyền tạo ⇒ **403** · phiếu không tồn tại ⇒ **400** · sinh GRN **lần 2** ⇒ **400** (không sinh phiếu nhập thứ 2) | ✅ |

### 4.2 ⚠ 3 LỖI THẬT do test phát hiện và đã vá (commit `1424731`)
1. **`AccessScopeStoreAdapter:46-61` — 403 OAN cho MỌI thao tác kho trên H2.** `SELECT project_id AS projectId`
   ⇒ H2 (MODE=MySQL) **hạ chữ thường nhãn cột không trích dẫn** (trả khoá `projectid`), MySQL giữ `projectId`.
   Hệ quả: `AccessScopeService:80` đọc `null` ⇒ `projectId=""` ⇒ nhánh «kho site» của `canAccessWarehouse`
   **LUÔN false** ⇒ thủ kho bị 403 trong mọi test H2 có kiểm phạm vi kho. Đo bằng probe tạm: cùng dữ liệu,
   `canAccessProject=true` nhưng `canAccessWarehouse=false`; sau khi vá: cả ba biến thể `true`.
2. **`contract_stock_ledger.warehouse_id` NOT NULL** + phiếu không phân giải được kho nhận ⇒ nổ ràng buộc
   **GIỮA transaction** (để lại movement nửa vời). Nay chặn TRƯỚC ở use-case ⇒ **400 đọc được** + phòng thủ lớp 2 ở adapter.
3. **`stockIssueGrnLines` join `purchase_order_items` theo cột `material_id` KHÔNG TỒN TẠI** (đo
   `SHOW COLUMNS FROM purchase_order_items`: vật tư suy ra qua `request_item_id`) ⇒ `BadSqlGrammarException`.
   Đổi sang join theo `request_item_id`. Kèm quy ước **alias camelCase phải TRÍCH DẪN** (`AS "issueNo"`) —
   MySQL dự án **không** bật `ANSI_QUOTES` (đo `@@sql_mode`) nên `"` là định danh chuỗi ⇒ chạy đúng cả hai engine.

### 4.3 Probe `--apply` trên LIVE — **34/41 ĐẠT** (chưa xanh toàn bộ, xem §5)
`node tools/probe-stock-issue-flow.mjs --apply` (nhãn lượt `20260921050131`):
`chọn: DNMH-PRJ-DEMO-01-2026-0157 · 20 phiếu khả dụng · phiếu đề nghị PHỤ: DNMH-PRJ-DEMO-01-2026-0156`
```
KẾT QUẢ: 34/41 bước ĐẠT
   ❌ [tkhodemo] issue_stock_confirm — TIẾN HÀNH XUẤT KHO → HTTP 403 Tài khoản chưa được quản trị viên cấp đúng quyền
   ❌ [tkhodemo] ③ sau xuất kho: stock_issues.status = 'issued' → status=approved
   ❌ [tkhodemo] confirm_stock_issue — THỦ KHO XÁC NHẬN ĐÃ XUẤT ĐỦ → HTTP 403 […]
   ❌ [tkhodemo] ④ sau xác nhận: stock_issues.status = 'completed' → status=approved
   ❌ [tkhodemo] create_issue_grn → HTTP 400 Phiếu …-0035 chưa được thủ kho xác nhận xuất đủ (hiện tại: approved)
   ❌ [tkhodemo] ⑤ sau sinh GRN: stock_issues.status = 'grn_created' → status=approved
   ❌ [tkhodemo] MR cập nhật trạng thái cấp phát → supplyStatus=completed
```
**7 mục HỎNG KHÔNG phải lỗi mã nguồn** — cả 7 đều là hệ quả của 2 việc NGOÀI QUYỀN của agent (xem §5).
Mọi **đối chứng âm đều ĐẠT** đúng kỳ vọng: ③ phiếu không tồn tại **400** · ③ `pending_cht` **400** ·
③ `engineer.demo` **403** · ④ `cha.ht` **403** · ④ phiếu không tồn tại (chặn ở cổng module) **403** ·
⑤ phiếu không tồn tại **400** · ⑤ phiếu chưa `completed` **400** · ⑤ `giamdoc.demo` **403**.

**Bằng chứng SAU cho nợ #5 (LIVE)**: `SELECT request_id,COUNT(*) FROM supply_workflow_steps
WHERE request_id='MR_a1ad9a0d-a56e-4698-a7a0-07034f558d7a' AND step='issue'` ⇒ **1** (trước khi sửa cùng
loại MR đã xuất nhiều lần có **4–5** dòng).

**Bằng chứng ② (LIVE)**: `SELECT approved_by FROM stock_issues WHERE id='ISS_d2de7b08-…'` =
`USR_911a47b2-3f2a-4a81-9ca3-891dd492b18b` (= `cha.ht`) + `approvals` có
`(entity_type='stock_issue', stage=1, status='approved')` ⇒ **đúng**.
⚠ GHI NHẬN: payload bootstrap **KHÔNG** trả `approved_by` của phiếu xuất (`BootstrapDataAdapter.java:373-385`
chỉ có `…/status/receivedByName/itemCount/totalQty/installedQty`) ⇒ probe TASK-132 khẳng định
«approvedBy != null» là **ĐỎ GIẢ vĩnh viễn** — đã bỏ ở commit `d121c1f`.

---

## 5. ⛔ BLOCKED — cần CAPTAIN (2 việc ngoài quyền agent)

1. **`package` lại + restart dịch vụ.** Jar trên `18081` build **11:32** (commit `b08193e` là commit SAU đó),
   nên LIVE còn capability `canEdit` cho `issue_stock_confirm`. Đo MySQL:
   `tkhodemo` (`thu_kho` — ĐÚNG vai trò bước ③) có `warehouse_issue.can_create=1` nhưng **`can_edit=0`**
   ⇒ 403 oan. Commit `b08193e` đã đổi ③ sang **`canCreate`** (cùng capability với `issue_stock`);
   ⛔ agent **không được** start/stop dịch vụ nên **chưa kiểm được ③ trên LIVE**.
2. **Cấp `warehouse_issue.can_edit=1` cho vai trò thủ kho** (bước ④). Bước ④ cố ý giữ `canEdit` (là bước
   **xác nhận** trạng thái) + `requireRole(["warehouse","admin"])`. Đo MySQL: `thu_kho` có `can_edit=0`
   ⇒ thủ kho thật **403**. ⛔ Đây là thay đổi QUYỀN trong CSDL THẬT ⇒ **đề xuất, không tự chạy**:
   ```sql
   -- ĐỀ XUẤT (captain quyết + chạy): cấp quyền xác nhận xuất đủ cho vai trò THỦ KHO
   UPDATE user_module_permissions
      SET can_edit=1, updated_at=NOW(3)
    WHERE module_key='warehouse_issue' AND user_id IN (<các tài khoản thu_kho>);
   ```
   *(Nếu captain muốn ④ do `admin` làm thay thì KHÔNG cần SQL: `admin` miễn mọi cổng.)*

**Sau 2 việc trên, probe phải XANH toàn bộ** — tầng H2 đã xanh đầy đủ ①→⑤ (§4.1).

### UNKNOWN
- `material_requests.supply_status` của các phiếu ĐÃ xuất bằng bản CŨ vẫn là `completed`/`awaiting_po`
  (dữ liệu cũ, ⛔ không sửa) ⇒ lệch vựng với `partial_issued`/`issued` của luồng mới. Đây là **dữ liệu lịch sử**,
  không phải lỗi mã; nếu cần thống nhất vựng thì phải có task di trú riêng do captain quyết.
- GRN bước ⑤ cần dòng PO của cùng `request_item_id` (vì `goods_receipts.purchase_order_id` và
  `goods_receipt_items.purchase_order_item_id` là NOT NULL và **mọi** truy vấn bootstrap đều
  `JOIN purchase_orders`) ⇒ phiếu xuất từ nguồn **thuần kho, không có PO** sẽ trả **400** kèm thông báo
  đọc được thay vì sinh GRN mồ côi (vô hình trên UI). Nếu nghiệp vụ cần GRN cho phiếu không PO thì phải
  thiết kế lại mô hình dữ liệu nhập kho — **cần quyết định thiết kế**, ngoài phạm vi lượt này.

---

## 6. Cổng kiểm (đo trên máy)

| Cổng | Kết quả |
|---|---|
| `npx tsc --noEmit` | **exit 0** (0 lỗi) ✔ |
| `npm run test:regression` | **tests 69 · pass 69 · fail 0** (exit 0) ✔ |
| `npm run test:workflow` | **ĐẠT** (`Workflow VNTECH ERP V5.3.0 FULL W2 passed`) ✔ |
| `cd java-backend; mvn -B -pl web -am test` | **Tests run: 39, Failures: 3, Errors: 0** — 3 lỗi **CÓ SẴN**, KHÔNG do TASK-133: `ProductionRoleCounterProofTest.productionRole_cht_duocPhep` / `…_cht_roleBaseSai_vanDuocPhep` / `…_engineer_biChan` (đều về `save_team_subcontract` chưa khai RBAC). **BASELINE đo TRƯỚC khi sửa: 34 test / 3 ĐỎ y hệt.** `StockIssueWorkflowSteps345Test` ✅ 1/1 · `SupplyChainEndToEndIntegrationTest` ✅ 1/1 · `StockChainIntegrationTest` ✅ 1/1 |
| `node tools/probe-stock-issue-flow.mjs --apply` | **34/41 ĐẠT** — 7 mục HỎNG là 2 việc BLOCKED ở §5, **không** phải lỗi mã ✔ |

## 7. Ràng buộc đã tuân thủ
- Chỉ sửa: `java-backend/**` · `tools/probe-stock-issue-flow.mjs` · test mới · tài liệu này.
- **0** `DROP`/`ALTER`/`TRUNCATE`/`DELETE` trên MySQL thật · **0** câu lệnh chạm **13 phiếu `posted` CŨ** ·
  **0** khoá `module_catalog` mới (③④ dùng lại `warehouse_issue`, ⑤ dùng lại `receiving`) ·
  chỉ **HTTP** với LIVE (không start/stop dịch vụ, không `package`, không build web).
- `git add` theo **từng tệp cụ thể** (không `git add -A`), commit từng bước nhỏ, **không** push.
