# MT2-P3-09 — GRN SINH TỪ LỆNH ĐIỀU CHUYỂN (STO)

> Trạng thái: **IN_PROGRESS — audit xong, chưa code** (⛔ không code nửa vời)
> Phase: **PHASE 3 — BACKEND SERVICE & API** (MT2)
> Ngày audit: 22/09/2026

## 1. YÊU CẦU — NGUYÊN VĂN MT2 §7.4 (`docs/dsh/MASTER_TASK_2.md:195-196`)

```text
## 7.4. Tạo phiếu nhập
Cho phép **tạo phiếu nhập từ STO/phiếu xuất kho**: nếu phiếu liên quan đã có **kho đi/kho đến**
⇒ **tự động fill**; nếu chưa có ⇒ cho user nhập.
```

⇒ Yêu cầu gồm **HAI nguồn**: ① **STO** (lệnh điều chuyển) ② **phiếu xuất kho**.
Điểm cốt lõi: **kho đi / kho đến** lấy từ phiếu nguồn và **tự động điền** vào phiếu nhập.

## 2. HIỆN TRẠNG — BẰNG CHỨNG ĐỌC MÃ (không suy đoán)

### 2.1. Nguồn ② PHIẾU XUẤT KHO — **ĐÃ CÓ, ĐẦY ĐỦ**
| Tầng | Vị trí |
|---|---|
| Port | `WarehouseStockStore:102` `stockIssueGrnLines(issueId)` · `:109` `insertStockIssueGrn(header, items, now)` · `:116` `markStockIssueGrnCreated(issueId, receiptId, userId, now)` |
| Adapter | `WarehouseStockStoreAdapter:430` `insertStockIssueGrn` · `:460` `markStockIssueGrnCreated` |
| Use-case | `StockManagementUseCase:311` `create_issue_grn` (**WF-XUATKHO-01 BƯỚC ⑤**, TASK-133) → `:384` insert → `:385` mark |
| Controller | `SystemController:1224` `case "create_issue_grn"` |
| RBAC | `ActionRbacRegistry:44` `create_issue_grn → receiving` · `:259` `create_issue_grn → canCreate` |
| Số phiếu | `receipt_no` riêng dòng **`GRN-PX`** (theo chú thích `WarehouseStockStore:105-106`) |
| Test | `StockIssueWorkflowSteps345Test` (bước ⑤) · `SupplyChainEndToEndIntegrationTest:274` |

### 2.2. Nguồn ① STO (LỆNH ĐIỀU CHUYỂN) — **CÓ STO NHƯNG ⛔ KHÔNG CÓ ĐƯỜNG SINH GRN**
| Hạng mục | Bằng chứng |
|---|---|
| Bảng | `transfer_orders` · `transfer_order_items` **CÓ THẬT** |
| Cột `transfer_orders` | `id · transfer_no · source_warehouse_id · destination_warehouse_id · source_project_id · destination_project_id · transit_warehouse_id · requested_by/at · approved_by/at · shipped_by/at · received_by/at · status · reason · note · created_at · updated_at` |
| Port STO hiện có | `WarehouseStockStore:134` `findTransferOrder` · `:135` `transferOrderItems` · `:136` `insertTransferOrder` |
| Action STO hiện có | `ActionRbacRegistry` `create_transfer_order` · `approve_transfer_order` · `ship_transfer_order` · `receive_transfer_order` (module `inventory`) |
| **Thiếu** | ⛔ **KHÔNG có** `transferOrderGrnLines` · `insertTransferOrderGrn` · `markTransferOrderGrnCreated` · action `create_transfer_grn` · `case "create_transfer_grn"` |

**⇒ KẾT LUẬN GAP**: MT2 §7.4 yêu cầu tạo phiếu nhập từ **cả hai** nguồn; nguồn **phiếu xuất kho đã xong**,
nguồn **STO bị thiếu toàn bộ đường sinh GRN** ⇒ đây là phần phải làm.

## 3. KẾ HOẠCH THI HÀNH (noi theo ĐÚNG mẫu của phiếu xuất kho — §15 REUSE, ⛔ không tạo kiến trúc mới)

1. **Port** `WarehouseStockStore` — thêm 3 hàm soi gương bản của phiếu xuất:
   - `List<Map<String,Object>> transferOrderGrnLines(String transferId)`
   - `void insertTransferOrderGrn(Map<String,Object> header, List<Map<String,Object>> items, Instant now)`
   - `boolean markTransferOrderGrnCreated(String transferId, String receiptId, String userId, Instant now)` *(chốt chặn trạng thái, ⛔ không sinh GRN lần hai — giống `WHERE status='completed'` của bản phiếu xuất)*
2. **Adapter** `WarehouseStockStoreAdapter` — cài 3 hàm, **số phiếu riêng dòng `GRN-STO`** (⛔ không lẫn `GRN-PX`),
   kho đích = `destination_warehouse_id`, kho nguồn = `source_warehouse_id` ⇒ **tự động điền** theo MT2 §7.4.
3. **Use-case** `StockManagementUseCase` — thêm `createTransferGrn` soi gương `create_issue_grn:311-390`
   (kiểm quyền → kiểm trạng thái STO → dựng header/items ⇒ insert ⇒ mark; **⛔ không cần duyệt, chỉ cần QUYỀN**).
4. **RBAC** `ActionRbacRegistry` — `create_transfer_grn → receiving` + `create_transfer_grn → canCreate`.
5. **Controller** `SystemController` — thêm `case "create_transfer_grn"`.
6. **Test H2 ĐỎ→XANH** soi gương `StockIssueWorkflowSteps345Test`:
   - DƯƠNG: STO ở trạng thái hợp lệ ⇒ sinh **1** GRN, `receipt_no` dòng `GRN-STO`, kho đi/đến **tự điền đúng**
   - ÂM: STO sai trạng thái ⇒ **400** và ⛔ **không** sinh GRN; gọi lần hai ⇒ ⛔ **không** sinh GRN thứ hai; thiếu quyền ⇒ **403**
7. **UI** (Phase 9 màn Kho): nút «Tạo phiếu nhập từ lệnh điều chuyển» + tự điền kho — làm cùng đợt UI Kho.

## 4. GHI CHÚ KỸ THUẬT / RỦI RO
- `BootstrapDataAdapter` JOIN `goods_receipts gr JOIN purchase_orders po` (ghi ở `WarehouseStockStore:99`)
  ⇒ **GRN không gắn PO sẽ VÔ HÌNH trên UI** ⚠️ ⇒ phải kiểm cách GRN từ phiếu xuất đang lách điểm này
  (mã `GRN-PX` đã chạy thật) ⇒ **làm y hệt** cho `GRN-STO`, ⛔ không phát minh cách khác.
- ⛔ KHÔNG thêm bảng/cột mới nếu `transfer_orders` đã đủ (đã đủ: có `status` + `received_at`).
- ⛔ KHÔNG đụng dữ liệu thật; test bằng H2.

## 5. VIỆC KẾ TIẾP
- Bước 1–2 (port + adapter) → bước 3 (use-case) → bước 4–5 (RBAC + controller) → bước 6 (test) → bước 7 (UI, gộp Phase 9).

## 6. NHẬT KÝ THI HÀNH

### 22/09/2026 — BƯỚC ①+② XONG (compile sạch)
- **Files Changed**: `java-backend/application/src/main/java/com/vntech/erp/application/port/out/WarehouseStockStore.java`
  (+3 khai báo) · `java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/WarehouseStockStoreAdapter.java`
  (+3 cài đặt).
- **API Changed**: ⛔ chưa (mới có port + adapter; use-case/controller ở bước ③–⑤).
- **DB Changed**: ⛔ KHÔNG — dùng nguyên `goods_receipts`/`goods_receipt_items`/`transfer_orders`/`transfer_order_items`
  ⇒ ⛔ không migration, ⛔ không thêm bảng/cột.
- **RBAC Changed**: ⛔ chưa (bước ④).
- **Chi tiết**:
  - `transferOrderGrnLines(transferId)` — SELECT từ `transfer_order_items ⋈ transfer_orders`, trả
    `materialId · quantity (= COALESCE(received_qty, shipped_qty, approved_qty, requested_qty, 0)) · contractId
    (= destination_contract_id) · purchaseOrderItemId · purchaseOrderId · transferOrderItemId`.
  - `insertTransferOrderGrn(header, items, now)` — soi gương `insertStockIssueGrn`:
    `qc_status='passed'` · `document_status/certificate_status/delivery_document_status='complete'` ·
    `bch_confirmation_status='confirmed'` · `posting_status='posted'` ⇒ ⛔ không sinh vòng QC/duyệt.
  - `markTransferOrderGrnCreated(...)` — chốt chặn `WHERE id=? AND status='received'` ⇒ chưa nhận hàng
    (hoặc đã sinh GRN ⇒ `status='grn_created'`) trả `false` ⇒ use-case sẽ ⇒ **400** và ⛔ không sinh thêm GRN.
- **Tests**: `mvn -B -pl infrastructure -am compile` ⇒ Domain **SUCCESS** · Application **SUCCESS** ·
  Infrastructure **SUCCESS** · EXIT = 0 ✔ (chưa có test hành vi — bước ⑥).
- **Lỗi em tự gây & tự sửa**: viết sai tên cột `t.to_destination_project_id` (đúng là `t.destination_project_id`)
  ⇒ phát hiện & sửa NGAY trước khi compile ⇒ ⛔ không lọt vào bản build.
- **Known Issues giữ nguyên**: `goods_receipts.purchase_order_id` là **NOT NULL**; STO thuần kho có thể ⛔ không có PO
  ⇒ điền chuỗi rỗng (⛔ không bịa PO). Hệ quả: bootstrap JOIN `goods_receipts ⋈ purchase_orders` ⇒ GRN không gắn PO
  **vô hình trên UI** — đây là hành vi SẴN CÓ của đường phiếu xuất (`GRN-PX`), ⛔ không sửa khác đi ở đây.
- **Next Task**: bước ③ `StockManagementUseCase.createTransferGrn` (soi gương `create_issue_grn:311-390`) →
  ④ RBAC `create_transfer_grn` → ⑤ `SystemController` → ⑥ test H2 ĐỎ→XANH.

### 22/09/2026 — BƯỚC ③+④+⑤ XONG (compile 5/5 module sạch)
- **Files Changed**: `StockManagementUseCase.java` (+`createTransferGrn`) ·
  `ActionRbacRegistry.java` (+2 khoá) · `SystemController.java` (+`case "create_transfer_grn"`).
- **API Changed**: **CÓ** — action mới `create_transfer_grn` (payload: `transferId` bắt buộc,
  `toWarehouseId` tuỳ chọn, `note` tuỳ chọn) ⇒ trả `{message, transferId, transferNo, receiptId, receiptNo}`.
- **DB Changed**: ⛔ KHÔNG.
- **RBAC Changed**: **CÓ** — `create_transfer_grn → receiving` (module) + `create_transfer_grn → canCreate`
  (capability). ⛔ **0 module mới**, ⛔ 0 khoá `module_catalog` mới (dùng lại `receiving`).
- **Workflow Changed**: ⛔ KHÔNG vòng duyệt nào (§7.4: chỉ cần QUYỀN). Vai trò:
  `requireRole(["warehouse","engineer","admin"])` — **y hệt** ⑤ của phiếu xuất.
- **Chi tiết `createTransferGrn`**: kiểm vai trò → tìm STO (thiếu ⇒ 404-style 400) → **chốt trạng thái
  `received`** (chưa nhận ⇒ 400 nêu rõ trạng thái hiện tại) → phạm vi dự án (`destinationProjectId`,
  lùi `sourceProjectId`) → **kho nhận TỰ ĐỘNG** = `destinationWarehouseId`, chỉ khi rỗng mới lấy
  `toWarehouseId` (§7.4 «tự động fill») → kiểm kho hoạt động đúng dự án → lấy dòng
  (`transferOrderGrnLines`) → **chốt PO** như `create_issue_grn` → số phiếu **`GRN-STO-<năm>-<0000>`**
  dòng số riêng `GRN-STO:project:year` → `insertTransferOrderGrn` → `markTransferOrderGrnCreated`
  (thất bại ⇒ 400 «Không sinh thêm phiếu nhập thứ hai»).
- **⚠️ QUYẾT ĐỊNH DỰA TRÊN DỮ LIỆU THẬT (⛔ không suy đoán)**: đo trên CSDL ⇒ **32/32 GRN đều gắn PO,
  0 GRN có `purchase_order_id` rỗng**; `goods_receipts.purchase_order_id` và
  `goods_receipt_items.purchase_order_item_id` đều **NOT NULL** ⇒ `createTransferGrn` **GIỮ NGUYÊN độ chặt**
  của đường phiếu xuất: dòng nào ⛔ không tra được PO ⇒ **400** (⛔ KHÔNG tạo GRN với PO rỗng — mẫu dữ liệu
  toàn hệ thống CHƯA từng có; tự tạo sẽ phá bất biến — §18/§20).
- **Tests**: `mvn -B -pl web -am compile` ⇒ Clean Architecture · Domain · Application · Infrastructure ·
  **Web** đều **SUCCESS** · EXIT = 0 ✔ (⛔ chưa có test HÀNH VI — bước ⑥).
- **Known Issues (giữ nguyên + mới)**: ① bootstrap JOIN `goods_receipts ⋈ purchase_orders` ⇒ GRN không gắn PO
  vô hình trên UI (hành vi sẵn có của `GRN-PX`) ② nếu nghiệp vụ cho phép điều chuyển **thuần kho không có PO**
  thì cần một quyết định RIÊNG của người dùng (đổi ràng buộc NOT NULL hoặc mở ngoại lệ) — ⛔ em không tự quyết.
- **Next Task**: bước ⑥ **test H2 ĐỎ→XANH** soi gương `StockIssueWorkflowSteps345Test`.

### 22/09/2026 — AUDIT CHI PHÍ BƯỚC ⑥ (chưa viết test)
- **Phát hiện (⛔ không đoán — đo `information_schema`)**: vì `createTransferGrn` **giữ chốt PO**
  (32/32 GRN đều gắn PO), test hành vi phải seed đủ chuỗi NOT NULL:
  ```text
  warehouses        : id · code · name · type · created_at · updated_at
  material_requests : id · request_no · requested_by · requested_at · needed_at · area · …
  purchase_orders   : id · po_no · project_id · supplier_id · receiving_warehouse_id · buyer_user_id · ordered_at · …
  purchase_order_items: id · purchase_order_id · request_item_id · line_no · ordered_qty · unit_price · …
  transfer_orders   : id · transfer_no · source_warehouse_id · destination_warehouse_id · transit_warehouse_id · requested_by · requested_at · …
  transfer_order_items: id · transfer_order_id · material_id · requested_qty · …
  ```
  ⇒ ~40 dòng seed + harness đăng nhập nếu dựng FILE MỚI.
- **Quyết định (§15 REUSE, ⛔ không dựng trùng)**: **mở rộng `SupplyChainEndToEndIntegrationTest`**
  (`java-backend/web/src/test/java/com/vntech/erp/web/controller/SupplyChainEndToEndIntegrationTest.java:274`)
  — tệp này **ĐÃ seed đủ chuỗi** MR → PO → PO items → receipt → issue cho `create_issue_grn`,
  và đã có sẵn cookie/hạ tầng ⇒ chỉ cần thêm **nhánh lệnh điều chuyển (STO)** vào cùng ngữ cảnh.
- **Test sẽ khẳng định (bước ⑥)**: ① dương — STO `received` ⇒ **200**, có **1** GRN, `receipt_no` bắt đầu
  `GRN-STO-`, `warehouse_id` = **kho nhận của STO (tự điền)**; ② âm — STO sai trạng thái ⇒ **400** và ⛔ 0 GRN;
  ③ âm — gọi lần hai ⇒ **400** («Không sinh thêm phiếu nhập thứ hai») và ⛔ vẫn 1 GRN;
  ④ âm — thiếu quyền tạo ⇒ **403**.
- **Next Task**: viết nhánh STO trong `SupplyChainEndToEndIntegrationTest` ⇒ chạy ĐỎ trước, rồi XANH.

### 22/09/2026 — BƯỚC ⑥ VIẾT TEST (nhánh STO) — **TEST BẮT ĐƯỢC 2 LỖI THẬT CỦA EM** (đang sửa)
- **Files Changed**: `SupplyChainEndToEndIntegrationTest.java` — thêm **nhánh STO** ngay sau khẳng định ⑤,
  **tái dùng ĐÚNG PO** mà `fullSupplyChain()` đã tạo qua API (cùng `p_e2e` + `m_e2e`) ⇒ ⛔ không seed thêm MR/PO;
  chỉ thêm 1 **kho đích** (`wh_e2e_dest`), 1 `transfer_orders` (`to_e2e`, `status='received'`) + 1 dòng
  `transfer_order_items` (`toi_e2e`, `m_e2e`, `requested_qty=4`, `received_qty=4`), rồi 3 mốc:
  **⑥a âm** sai trạng thái ⇒ 400 + ⛔ 0 GRN · **⑥b dương** ⇒ 200, `GRN-STO-`, kho nhận **tự điền**, `posted`, gắn PO,
  đúng 1 dòng · **⑥c âm** gọi lần hai ⇒ 400 + ⛔ vẫn 1 GRN.
- 🔴 **LỖI #1 EM TỰ GÂY (test bắt)**: `transferOrderGrnLines` nhúng **subquery vô hướng `ORDER BY … LIMIT 1`**
  ⇒ H2 ném **`JdbcSQLSyntaxErrorException`** (MySQL chấp nhận, H2 ⛔ không) ⇒ đã đổi sang **tra PO bằng Java**
  (1 truy vấn cho cả dự án ✔).
- 🔴 **LỖI #2 EM TỰ GÂY (test bắt tiếp)**: truy vấn tra PO dùng **`poi.material_id`** ⇒ H2 báo
  **`Column "poi.material_id" not found`** ⇒ **`purchase_order_items` của H2 LỆCH schema so với MySQL**
  (lỗi có sẵn của dự án, ⛔ không phải do MT2) ⇒ cách tra PO phải **soi gương `stockIssueGrnLines`**
  (hàm này đã chạy xanh trên H2 ở bước ⑤ ⇒ nó dùng đường khác) — **việc kế tiếp**.
- 🔴 **LỖI #3 EM TỰ GÂY (compile)**: dùng `assertNotNull(...)` nhưng lớp test ⛔ không static-import hàm này
  ⇒ đã đổi sang `assertTrue(... != null && !isEmpty())` ✔.
- **Tests hiện tại**: `mvn -B -pl web -am test` ⇒ **Tests run: 44 · Failures: 3 · Errors: 1** ⇒ ⚠️ **CHƯA ĐẠT**
  (3 Đỏ = baseline `ProductionRoleCounterProofTest` ✔; 1 Error = nhánh STO mới, đang sửa ✔).
- **Next Task**: soi gương `stockIssueGrnLines` (đọc SQL thật của nó) ⇒ sửa `transferOrderGrnLines` cho
  **chạy đúng ở CẢ H2 và MySQL** ⇒ chạy lại tới khi **44 / 3 ĐỎ CÓ SẴN / 0 Errors** ⇒ mới đánh **P3-09 DONE**.
