# TASK-132 — WF-XUATKHO-01 **BƯỚC ①②** (tạo phiếu → CHỈ HUY TRƯỞNG duyệt)

- **Ngày**: 2026-09-21 · **Nhánh**: `unity-p2-full-20260920`
- **Phạm vi**: **CHỈ 2 BƯỚC ĐẦU** của luồng xuất kho. Bước ③④⑤ **KHÔNG làm** trong lượt này (xem §5).
- **Commit**: `53299e9` (bước ①) · `6f3a9cd` (bước ② — Java + test + schema H2) · commit `probe-stock-issue-flow.mjs`/tài liệu (bản mới nhất `git log --oneline -1` — nhánh TASK-132 có 4 commit, các bản `--amend` đổi hash nên ghi theo LỐI VÀO ở đây là không bền)

---

## 1. State machine của phiếu xuất (`stock_issues.status`)

| # | Bước WF-XUATKHO-01 | Ai | Action | `stock_issues.status` | Trạng thái trong lượt này |
|---|---|---|---|---|---|
| ① | tạo phiếu (chỉ cần quyền tạo) | thủ kho `tkhodemo` (`thu_kho`) | `issue_stock` | **`pending_cht`** | ✅ **ĐÃ LÀM** |
| ② | **chỉ huy trưởng duyệt** | `cha.ht` (`cht`→`commander`) hoặc `admin` | **`approve_stock_issue`** (MỚI) | **`approved`** | ✅ **ĐÃ LÀM** |
| ③ | tiến hành xuất kho | thủ kho | (chưa có action) | *(đề xuất `posted`)* | ⛔ **CHƯA LÀM** |
| ④ | thủ kho xác nhận đã xuất đủ | thủ kho | (chưa có action) | *(đề xuất `confirmed`)* | ⛔ **CHƯA LÀM** |
| ⑤ | chuyển thành GRN để nhập kho khác | BCH/thủ kho | (chưa có action) | *(đề xuất `grn_created`)* | ⛔ **CHƯA LÀM** |

**Phiếu CŨ (10 phiếu `posted`)**: giữ nguyên — **0 câu UPDATE** chạm dữ liệu cũ (tương thích ngược).

## 2. Tên trạng thái đã chọn + LÝ DO

| Trạng thái | Chọn | Lý do |
|---|---|---|
| `pending_cht` (①) | ✅ đề xuất của captain | Hệ thống **CHƯA có** trạng thái chờ-duyệt nào cho `stock_issues` (đo: `SELECT status,COUNT(*) FROM stock_issues GROUP BY status` = 10/10 `posted`; không có `draft`/`pending*`) ⇒ không có tên sẵn có để tái dùng. `pending_cht` khớp từ vựng nghiệp vụ đang dùng trong DB: `workflow_steps` WFS-XK-1 `canApprove` → `cha.ht`, và `approvals.department` có nhãn «CHT xác nhận nhu cầu». |
| `approved` (②) | ✅ đề xuất của captain | Nhất quán với vựng trạng thái phê duyệt đang dùng toàn hệ thống (`approvals.status` mặc định `pending`, quyết định = `approved`; MR cũng dùng `approved`). Bước ③ sẽ chuyển tiếp sang `posted`. |

## 3. Tệp: dòng đã sửa

| Việc | Tệp:dòng |
|---|---|
| ① bỏ bind cứng `"posted"` → `"pending_cht"` | `java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/WarehouseStockStoreAdapter.java:112-129` (dòng bind mới ở **:129**) |
| ① `approved_by` để NULL khi chờ duyệt (thay `principal.userId()`) | `java-backend/application/src/main/java/com/vntech/erp/application/service/StockManagementUseCase.java:134-140` |
| ② action use-case `approveStockIssue` | `StockManagementUseCase.java:181-206` |
| ② cổng VAI TRÒ `requireRole(["commander","admin"])` | `StockManagementUseCase.java:182` |
| ② case controller `approve_stock_issue` (cạnh `issue_stock`) | `java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java:1186-1200` (case ở **:1193**) |
| ② ghi DB: `UPDATE ... WHERE status='pending_cht'` + `INSERT INTO approvals` | `WarehouseStockStoreAdapter.java:229-252` (find `:231`, approve `:241`) |
| ② khai báo cổng MODULE (dùng lại module `approvals`, **0 khoá `module_catalog` mới**) | `java-backend/application/src/main/java/com/vntech/erp/application/rbac/ActionRbacRegistry.java:29` (module) và `:215` (capability `canApprove`) |
| ② port | `java-backend/application/src/main/java/com/vntech/erp/application/port/out/WarehouseStockStore.java:42-52` |
| Test H2 (đỏ→xanh) | `java-backend/web/src/test/java/com/vntech/erp/web/controller/SupplyChainEndToEndIntegrationTest.java:203-256` |
| Vá schema H2 cho `approvals` | `java-backend/web/src/test/resources/schema-h2.sql:2311-2323` (khối `[H2-MANUAL]`) |
| Probe 2 bước | `tools/probe-stock-issue-flow.mjs` |

**Vì sao cổng MODULE dùng `approvals` mà KHÔNG phải `warehouse_issue`**: đo MySQL thật —
`cha.ht` có `warehouse_issue.can_approve = 0` nhưng `approvals.can_approve = 1`; `engineer.demo` cũng có
`approvals.can_approve = 1`. Nếu khai `warehouse_issue` + `canApprove` thì **chính CHT bị 403 oan**; khai
`approvals` + `canApprove` thì cổng module đi qua cho cả `cha.ht` lẫn `engineer.demo`, và **cổng VAI TRÒ
`requireRole(["commander","admin"])` mới là cái chặn thật** (đúng như đặc tả). ⛔ Không thêm khoá `module_catalog` mới.

## 4. Bằng chứng (đo được, không đoán)

### 4.1 Test H2 — RED → GREEN (trên máy, JDK 26 + Maven 3.9.16)

| Lượt | Kết quả |
|---|---|
| RED (trước khi sửa ①) | `SupplyChainEndToEndIntegrationTest.fullSupplyChain:210` → `expected: <pending_cht> but was: <posted>` |
| RED (sau ①, trước ②) | `fullSupplyChain:226` → 403 với body `"Thao tác chưa được khai báo quyền trong hệ thống."` (action `approve_stock_issue` chưa khai) |
| GREEN (sau ①②) | `SupplyChainEndToEndIntegrationTest — Tests run: 1, Failures: 0` ✅ (assert: `pending_cht` → `approved`, `approvals` có `entity_type='stock_issue'`, `entity_id=issueId`, `stage=1`, `status='approved'`, `approver_user_id`=người duyệt, `approved_by`=người duyệt; **đối chứng âm**: vai trò `kh_nv` (đã được cấp `approvals.canApprove=1` để cổng module đi qua) ⇒ **403 từ `requireRole`**; duyệt lần 2 ⇒ **400** và KHÔNG sinh thêm bản ghi `approvals`; phiếu không tồn tại ⇒ **400**) |

### 4.2 Probe `--apply` trên LIVE (**jar CŨ — chưa nạp mã mới**)

`node tools/probe-stock-issue-flow.mjs --apply` ⇒ **19/23 ĐẠT**, 4 mục HỎNG **đúng là 4 hành vi mới của TASK-132**:

```
✅     1a. [tkhodemo] issue_stock — vai trò thu_kho
      ↳ issueId=ISS_236a69f1-cc65-4e11-b908-4dc6bd441649 · issueNo=PX-PRJ-DEMO-01-2026-0026
❌     1d. BƯỚC ① — phiếu MỚI KHÔNG còn 'posted' (kỳ vọng pending_cht) → status=posted
❌    2.1. [cha.ht] approve_stock_issue — CHỈ HUY TRƯỞNG duyệt → HTTP 403: Thao tác chưa được khai báo quyền trong hệ thống.
❌    2.2. sau duyệt: stock_issues.status = 'approved' → status=posted
❌    2.3. khai báo `approved_by` trên phiếu đã duyệt → approvedBy=(trống)
✅ N-B1.eng. [engineer.demo] duyệt ⇒ HTTP 403 (ĐÚNG — nhưng do action chưa khai, chưa phải cổng vai trò)
✅ N-B2.ghost. [cha.ht] duyệt phiếu không tồn tại ⇒ HTTP 403 (kỳ vọng sau khi lên LIVE: **400**)
```

⚠ **Vì sao HỎNG**: `:18081` vẫn chạy **jar cũ** — mã mới chỉ nằm trong repo (đã commit), **chưa package/restart**.
Không được phép tự start/stop dịch vụ trong lượt này ⇒ captain cần `package` + restart rồi chạy lại probe.
Đây là **RED ở tầng HTTP**, không phải lỗi mã nguồn (tầng H2 đã xanh — §4.1).

### 4.3 Bằng chứng pre-change (THÔ): 10/10 phiếu cũ `posted`, `approvals` không có bản ghi nào cho `ISS%`

`SELECT COUNT(*) FROM approvals WHERE entity_id LIKE 'ISS%'` = **0** (đo trước khi sửa). Cảnh báo hệ thống
trả về khi tạo phiếu: `"stock_issue <id>: chưa có bản ghi phê duyệt nào (quy trình động chưa khởi tạo)"`.

## 5. ⛔ PHẦN CÒN LẠI — BƯỚC ③④⑤ (nhánh sau)

1. **③ Tiến hành xuất kho** — ⚠ **NỢ KỸ THUẬT ĐÃ BIẾT**: hiện `insertStockIssue` ghi **luôn**
   `stock_movements` (SMI, sang kho tổ đội) + `contract_stock_ledger` (−qty ở kho nguồn, +qty ở kho tổ đội)
   **ngay lúc TẠO phiếu** (`WarehouseStockStoreAdapter.java:135-190`). Nghĩa là hàng đã "dịch chuyển" về mặt
   sổ sách trong khi phiếu còn `pending_cht`. Bước ③ **phải tách** phần ghi kho này ra khỏi `issue_stock`
   (chỉ ghi khi phiếu `approved`), nếu không thì việc thêm bước duyệt chỉ là "treo biển" chứ không chặn được gì.
2. **④ Thủ kho xác nhận đã xuất đủ** — action mới (đề xuất `confirm_stock_issue_export`),
   `requireRole(["warehouse","commander","admin"])`, cập nhật `stock_issue_items`/trạng thái.
3. **⑤ Chuyển thành GRN** để nhập kho khác — đẻ `goods_receipts` từ phiếu xuất (kho nhận = kho tổ đội/đội khác).
4. Chưa có action nào **hủy/từ chối** phiếu xuất (đối chứng âm `decision='rejected'` hiện trả **400**).
5. `WF-XUATKHO-01` (2 bước CHT → Kế toán) trong dữ liệu động **vẫn chưa** được đọc bởi mã Java:
   TASK-132 dựng **cổng duyệt CHT tường minh** (1 bước), chưa đọc `workflow_steps`.

## 6. Cổng kiểm (đo trên máy)

| Cổng | Kết quả |
|---|---|
| `npx tsc --noEmit` | **0 lỗi** (exit 0) |
| `npm run test:regression` | **69/69 pass · 0 fail** |
| `npm run test:workflow` | **ĐẠT** (`Workflow VNTECH ERP V5.3.0 FULL W2 passed`) |
| `cd java-backend; mvn -B -pl web -am test` | **Tests run: 34, Failures: 3** — **3 lỗi CÓ SẴN từ trước**, KHÔNG do TASK-132: `ProductionRoleCounterProofTest.productionRole_cht_duocPhep` / `…_cht_roleBaseSai_vanDuocPhep` / `…_engineer_biChan` (đều về `save_team_subcontract` chưa khai trong `ActionRbacRegistry`). **Đã đo baseline trước khi sửa: 34/3 y hệt.** TASK-132: `SupplyChainEndToEndIntegrationTest` ✅ 1/1; `StockChainIntegrationTest` ✅ 1/1; `SystemControllerAuthTest` ✅ 4/4. |

## 7. Ràng buộc đã tuân thủ

- Chỉ sửa: `java-backend/**`, `tools/probe-stock-issue-flow.mjs`, `docs/agent-progress/TASK-132.md`.
- Giữ lại bản sửa CHƯA COMMIT của `tools/probe-stock-issue-flow.mjs` (chọn động phiếu MR còn dư — hữu ích,
  tránh HỎNG GIẢ do cấp lũy kế vượt nhu cầu) rồi phát triển tiếp trên nền đó.
- **0** `DROP`/`ALTER`/`TRUNCATE`/`DELETE` trên MySQL thật; **0** sửa 10 phiếu `posted` cũ; chỉ **HTTP** với LIVE.
- Golden gate `ACTION_CATALOG.json` **không đổi**: file này sinh từ `scripts/system-route.mjs` (JS) — action
  `approve_stock_issue` là **action Java-only**, cố ý không nhét vào danh mục JS (ghi ở đây để captain biết
  khi chạy `tools/probe-action-module-parity.mjs`/`probe-catalog-drift.mjs`).
