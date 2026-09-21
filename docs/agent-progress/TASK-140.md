# TASK-140 — 2 lỗi thật người dùng đã chốt: (a) F4 cổng duyệt CHỈ owner được phân công · (b) F3 PO có đơn giá/tổng giá trị

**Trạng thái:** mã đã sửa + test H2 **ĐỎ→XANH** cho CẢ HAI lỗi + commit từng việc + cổng kiểm thử XANH.
**Phạm vi ghi tệp (đúng ràng buộc):** `java-backend/application/**` · `java-backend/infrastructure/**` · test mới `java-backend/web/src/test/**` · `docs/agent-progress/TASK-140.md`.
**KHÔNG chạm:** `AGENTS.md` · `docs/28_*` · `.docx/.xlsx` · `tools/**` · `app/**` · `lib/**` · `drizzle/**` · `docs/agent-progress/TASK-094…139.md` · cấu hình duyệt (`approval_stage_catalog` / `approval_project_assignments`) · `approval_stage_catalog.active` của bước 1 (**giữ nguyên `active=0`**).
**Commit:** `ca104fc` (việc 1) · `8397fad` (việc 2) — mỗi việc 1 commit riêng, **không** `git add -A` (⛔ không commit `java-backend/target-full-suite.txt` hay tệp rác).

---

## VIỆC 1 — (a) F4: cổng duyệt CHỈ cho **owner được PHÂN CÔNG ĐÍCH DANH**

| # | Tệp:dòng (sau sửa) | Nội dung |
|---|---|---|
| 1a | `RequestManagementUseCase.java:783-795` | `canApproveRequestStage` nay **chỉ còn MỘT đường đủ điều kiện**: `return pool.contains(userId);` (`:794`). **ĐÃ BỎ** nhánh cũ `(2) THEO VAI TRÒ` — `allowed.contains(userRoleCode) \|\| allowed.contains(baseRole) \|\| "admin".equals(userRoleCode)` (dòng cũ `:777-791`) |
| 1b | `RequestManagementUseCase.java:635` | Thông điệp 400 nói đúng luật mới: `"Bạn không phải Owner được phân công của bước này nên không được phê duyệt."` (bỏ vế “hoặc không đủ RBAC”) |
| 1c | `RequestManagementUseCase.java:250-252` | Cập nhật chú thích TASK-136 (nhánh duyệt THEO VAI TRÒ đã bị bỏ) — **không** đổi hành vi lập phiếu |

**Nguồn owner dùng để duyệt (∪, đều là phân công theo NGƯỜI — `RequestManagementUseCase.java:786-793`):**
1. `approvals.approver_user_id` cho **chính phiếu này ở đúng bước** (`store.findApprovalRow` → `ownerUserId`) — owner đã chốt lúc lập phiếu từ `approval_project_assignments` (project_id + stage → owner_user_id);
2. `store.stageApproverUserIds(projectId, stage)` — phân công nhiều người của quy trình (`workflow_step_approvers`, P4 `all_of`/`any_of`).

⛔ **Không** sửa `approval_stage_catalog` / `approval_project_assignments` / `active` bước 1.

### Test H2 ĐỎ→XANH — `java-backend/web/src/test/java/com/vntech/erp/web/controller/RequestApprovalOwnerOnlyTest.java` (mới)
Mô phỏng **ĐÚNG topology LIVE** `PRJ-DEMO-01`: bước 1 `active=0` (phiếu mới sinh ở bước 2) · owner bước2=`thukydemo` · bước3=`nvdademo` · bước4=`nvkhdemo` · bước5=`giamdoc.demo`; `allowed_role_codes` giữ NGUYÊN như cấu hình thật (bước 4 = `procurement,kh_nv` — nguồn của lỗ hổng); tài khoản `trinhtrench` có `base_role=procurement`; mọi tài khoản đều đã có `approvals.canApprove=1` + phạm vi dự án ⇒ mọi ca ÂM **CHẮC CHẮN** đến từ cổng OWNER, không phải cổng module.

```
RED   (mã CŨ, đã stash để đo): trinhtrench (base_role=procurement, KHÔNG được phân công) duyệt bước 4
      => Status expected:<400> but was:<200>     ← QUA ĐƯỢC CỔNG và LÀM HỒ SƠ CHUYỂN BƯỚC 4
GREEN (mã MỚI):  trinhtrench duyệt bước 4 => 400 "Bạn không phải Owner được phân công của bước này nên không được phê duyệt."
                 + `material_requests.approval_stage` vẫn = 4 + `approvals.status` bước 4 vẫn = `pending`
```

**DƯƠNG (4 owner đúng ⇒ duyệt được hết luồng):** `thukydemo` bước 2 → bước 3 · `nvdademo` bước 3 → bước 4 · `nvkhdemo` bước 4 → bước 5 · `giamdoc.demo` bước 5 → 200 “Đã hoàn tất luồng phê duyệt” (`material_requests.status='approved'`). ✔ **KHÔNG siết quá mức.**
**ÂM (3/3 chặn bằng 400 + hồ sơ KHÔNG đổi bước):** `trinhtrench` bước 4 · **người lập phiếu tự duyệt** bước 4 · `trdademo` bước 5.

---

## VIỆC 2 — (b) F3: PO giữ **ĐƠN GIÁ** của dòng phiếu đề nghị ⇒ `total_value` khác 0

**Kiểm schema trước (MySQL `vntech/vntech` — client `mysql` KHÔNG có trên máy này; đối chiếu nguồn DDL là nguồn sự thật):**
`purchase_order_items.unit_price DECIMAL(18,4) NOT NULL` (`V1__baseline.sql:1498`) · `purchase_orders.total_value DECIMAL(18,4) NOT NULL DEFAULT 0` (`V1__baseline.sql:1532`) — bản sao H2: `java-backend/web/src/test/resources/schema-h2.sql:1426`. Không có cột “thành tiền” nào khác ⇒ `total_value` phải là giá trị dẫn xuất.

| # | Tệp:dòng (sau sửa) | Nội dung |
|---|---|---|
| 2a | `PurchaseStoreAdapter.java:47-58` (`requestSourceItems`) | Thêm `mri.estimated_unit_price AS estimatedUnitPrice` — **nguồn sự thật DUY NHẤT của đơn giá** (trước đây adapter không mang đơn giá nên `createPo` không có gì để đọc) |
| 2b | `PurchaseManagementUseCase.java:118-121` (`createPo`) | `nl.put("unitPrice", Math.max(0, numberValue(ci(source, "estimatedUnitPrice"))));` — đọc từ **chính dòng phiếu đề nghị**; dòng phiếu **KHÔNG có** đơn giá ⇒ **0** (giữ nguyên hành vi cũ, ⛔ **KHÔNG bịa giá** từ BOQ/material/`standard_price`) |
| 2c | `PurchaseStoreAdapter.java:151-154` (`insertPurchaseOrderWithItems`) | `purchase_order_items.unit_price` nay bind `poUnitPrice(line.get("unitPrice"))` (trước: **literal `0`**) — `poUnitPrice` (`:183-193`) trả 0 khi null/không phải số/âm/NaN |
| 2d | `PurchaseStoreAdapter.java:175-181` + `:167` | **MỘT công thức duy nhất** cho `purchase_orders.total_value`: `UPDATE purchase_orders SET total_value=(SELECT COALESCE(SUM(ordered_qty*unit_price),0) FROM purchase_order_items WHERE purchase_order_id=?)` — gọi ngay sau khi ghi đủ các dòng PO |
| 2e | `PurchaseStoreAdapter.java:289` (`updatePoItemPrice`) | **Cùng** `recomputePoTotal(poId)` sau khi sửa đơn giá ⇒ ⛔ **không tạo 2 nguồn sự thật**: tổng luôn = Σ(`ordered_qty` × `unit_price`) của chính các dòng PO |

**Đã rà nơi khác ghi `total_value`:** chỉ có `PurchaseStoreAdapter` (tạo PO + sửa giá) và **engine JS** `scripts/system-route.mjs:1468` (vẫn bind `total_value=0`/`unit_price=0`) — xem §④. `tools/probe-money-consistency.mjs` / `tools/probe-task080e-production.mjs` chỉ **ĐỌC** để so khớp.

### Test H2 ĐỎ→XANH — `java-backend/web/src/test/java/com/vntech/erp/web/controller/PoPriceFromRequestTest.java` (mới)
Chuỗi thật: `setup → seed dự án/kho/NCC → create_request (dòng A có đơn giá 350000, dòng B **không** có đơn giá) → duyệt bước 1 (owner=admin) → create_po`.

```
RED   (mã CŨ): "đơn giá dòng A của PO phải = estimated_unit_price của phiếu ==> expected: <350000.0> but was: <0.0>"
               (nguồn đã kiểm TRƯỚC đó: material_request_items.estimated_unit_price của dòng A = 350000.0 ⇒ dữ liệu phiếu CÓ giá, PO mới là chỗ đánh rơi)
GREEN (mã MỚI): purchase_order_items.unit_price dòng A = 350000.0
                purchase_orders.total_value = 3500000.0 = SUM(ordered_qty*unit_price) (10×350000 + 5×0)
                dòng B KHÔNG có đơn giá          => unit_price = 0.0  (⛔ không bịa giá)
                update_po_price dòng A = 400000  => total_value = 4000000.0 (vẫn khớp công thức dẫn xuất)
```

### SQL TRƯỚC/SAU — mẫu để captain dán khi kiểm LIVE (Tôi KHÔNG chạy được: chưa có MySQL client + ⛔ không package/start/stop)
```sql
-- TRƯỚC (trạng thái lỗi đã đo: 9/9 PO)
SELECT COUNT(*) AS po_total, SUM(total_value=0) AS po_tong_bang_0 FROM purchase_orders;
SELECT COUNT(*) AS dong_po, SUM(unit_price=0) AS dong_gia_bang_0 FROM purchase_order_items;
-- dòng phiếu có giá thật, dùng làm chuẩn đối chiếu:
SELECT mri.request_id, mri.material_id, mri.estimated_unit_price FROM material_request_items mri
 WHERE mri.estimated_unit_price > 0 ORDER BY mri.id DESC LIMIT 5;
-- SAU (tạo 1 PO mới qua UI/probe rồi chạy):
SELECT po.po_no, po.total_value, poi.line_no, poi.ordered_qty, poi.unit_price, poi.request_item_id
  FROM purchase_orders po JOIN purchase_order_items poi ON poi.purchase_order_id = po.id
 WHERE po.request_id = '<requestId vừa tạo>' ORDER BY poi.line_no;
-- BẤT BIẾN (phải trả 0 dòng lệch):
SELECT po.id, po.total_value, COALESCE(SUM(poi.ordered_qty*poi.unit_price),0) AS derived
  FROM purchase_orders po JOIN purchase_order_items poi ON poi.purchase_order_id = po.id
 WHERE po.request_id = '<requestId vừa tạo>'
 GROUP BY po.id, po.total_value HAVING ABS(po.total_value - derived) > 1e-6;
```

---

## ③ CỔNG KIỂM THỬ (đo thật, sau khi sửa)

| Cổng | Kết quả |
|---|---|
| `npx tsc --noEmit` | **exit 0** (0 lỗi) ✔ |
| `npm run test:regression` | **69/69 ĐẠT** (`pass 69 · fail 0`) ✔ |
| `npm run test:workflow` | **ĐẠT** — “Workflow VNTECH ERP V5.3.0 FULL W2 passed …” ✔ |
| `cd java-backend; mvn -B -pl web -am test` (1 lượt, shell MỚI) | **Tests run: 42, Failures: 3** — 3 ĐỎ **CÓ SẴN** đúng `ProductionRoleCounterProofTest` (`productionRole_cht_duocPhep` · `productionRole_cht_roleBaseSai_vanDuocPhep` · `productionRole_engineer_biChan`), y hệt baseline |
| **BASELINE đo TRƯỚC khi sửa** | **Tests run: 39, Failures: 3** (cùng 3 test trên) ⇒ Δ = **+3 test mới, +0 lỗi mới**; 2 test của TASK-140 đều XANH |
| `package` | ⛔ **KHÔNG chạy** (đúng ràng buộc) — dành cho captain ở §④ |

---

## ④ CẦN CAPTAIN LÀM (tôi ⛔ không được package/start/stop) + UNKNOWN

1. **Package + restart để kiểm LIVE:** `mvn -B package -DskipTests` → dừng Java `:18081` theo **PID** → start lại (đúng quy trình hiện hành).
2. **Probe workflow mua hàng:** `node tools/probe-wf-muahang-standard.mjs --apply` ⇒ kỳ vọng **28/28**.
   Ca ❌ duy nhất hiện nay là `trinhtrench` oracle **bước 4**: sau khi siết cổng, nó phải bị chặn **NGAY Ở CỔNG QUYỀN** — thông điệp mới `"Bạn không phải Owner được phân công của bước này nên không được phê duyệt."` (400) **thay vì** đi qua cổng rồi mới vỡ ở “Quyết định không hợp lệ”. Nếu probe của ca đó khớp oracle theo **mã lỗi cụ thể**, cần cập nhật oracle sang thông điệp mới — **tôi không sửa `tools/**`**.
3. **Đo SQL TRƯỚC/SAU** theo mẫu ở §VIỆC 2 sau khi tạo 1 PO mới.

**UNKNOWN / rủi ro còn lại (cần người quyết):**
- **Engine JS có CÙNG lỗi (b)**: `scripts/system-route.mjs:1468` vẫn bind `purchase_orders.total_value=0` và `purchase_order_items.unit_price=0`. Tôi bị ⛔ cấm sửa `tools/**`/`scripts/**` nên **chỉ sửa nhánh Java**. Nếu probe/UI đang chạy trên stack JS `:8787`, PO tạo từ nhánh đó **vẫn 0 giá** ⇒ cần captain quyết có port sang JS hay chốt Java là đường chính.
- **Phiếu KHÔNG thuộc dự án** (`project_id` NULL — TASK-137): `findRequestForApproval` dùng `JOIN projects` (INNER) nên **trước TASK-140 đã không duyệt được** (`decideApproval` ném 400 “Không tìm thấy đơn yêu cầu.” ở `RequestManagementUseCase.java:622`). Việc bỏ nhánh THEO VAI TRÒ **không làm xấu thêm** luồng này (nó đã chết trước), nhưng cũng **không** cứu được nó — vẫn thuộc TASK-137.
- **Dữ liệu owner thiếu** (bước không có `approvals.approver_user_id` và không có phân công nào): theo luật mới ⇒ **không ai duyệt được** bước đó. Đây là chủ ý (“chỉ owner được phân công”); nếu gặp trên dữ liệu thật, xử lý bằng **cấu hình phân công**, ⛔ không nới lại nhánh vai trò.
- **Trong lúc làm, một teammate song song** đã sửa `BootstrapDataAdapter.java` + `schema-h2.sql` + thêm `RequestNoProjectBootstrapIntegrationTest.java` trong **cùng cây làm việc**. Hai commit của tôi **chỉ chứa đúng tệp của TASK-140** (đã kiểm `git diff` từng tệp trước khi commit); cổng Java ở trên chạy trên cây có cả thay đổi của teammate đó và test của họ cũng XANH.
