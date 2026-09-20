# TASK-105 — PHASE 2 §20 + §21: UI KHỐI «PO CON» TRONG CHI TIẾT PR · MÀN CHI TIẾT PO

- **Ngày:** 21/09/2026
- **Loại:** **IMPLEMENT UI** (2 màn còn thiếu của PHASE 2 theo GAP §7 nhóm **D1/D2**) — **KHÔNG sửa backend**.
- **Tiền nhiệm:** `TASK-103` (AUDIT + GAP ANALYSIS) · `TASK-104` (bộ cổng đo/gate PHASE 2). TASK-105 mở mới cho 2 màn UI.
- **Đặc tả nguồn:** `docs/agent-progress/PHASE2-REQUIREMENTS-USER.md` §20 (PR → PO UI) · §21 (PO detail UI) · §19 (đã có sẵn `ApprovalTimeline`).
- **GAP nguồn:** `docs/agent-progress/PHASE2-GAP-ANALYSIS.md` §5.2 (2 dòng **P0 CONFIRMED THIẾU**) + §10 nhóm **D**.

---

## 1. PHẠM VI (đúng như đã chốt, KHÔNG mở rộng)

| Loại | Tệp |
|---|---|
| **Sửa** | `app/screens/RequestDrawer.tsx` (D1) · `app/screens/Purchasing.tsx` (D2) · `app/page.tsx` (**CHỈ** vùng phiếu đề nghị / mua hàng — thêm modal `poDetail`) |
| **Tạo mới** | `app/screens/PurchaseOrderDrawer.tsx` (màn §21) · `lib/p2-po-trace.ts` (hàm thuần dùng chung) · `tests/p2-d1-pr-child-po.test.mjs` · `tests/p2-d2-po-detail.test.mjs` |
| **KHÔNG đụng** | `scripts/**` · `java-backend/**` · `drizzle/**` · `AGENTS.md` · `docs/28_*` · `.docx/.xlsx` · `tools/baseline/**` · `docs/agent-progress/TASK-094…104.md` |
| **KHÔNG làm** | build · khởi động/dừng dịch vụ (UI 8787 / proxy 9000 / Java 18081) · tạo bảng/cột/migration · **action/API mới** · `git add -A` · `git push` |

> ✅ Không có tệp nào ngoài danh sách "Sửa/Tạo mới" bị thay đổi bởi lượt này (xem §6).

---

## 2. TÊN TRƯỜNG THẬT ĐÃ DÙNG (chứng minh KHÔNG đoán)

Nguồn duy nhất: payload bootstrap `scripts/system-route.mjs` (đọc trực tiếp, không suy diễn) + cột thật đã đo ở `PHASE2-GAP-ANALYSIS.md` §2.4.

| Bảng/cột thật | Payload UI dùng | Nơi đọc | Nơi ghi trong mã |
|---|---|---|---|
| `purchase_orders.request_id` (nullable, **KHÔNG** unique) | `requestId` | `system-route.mjs:653` | `lib/p2-po-trace.ts` (`childPurchaseOrdersFor`, `isOrphanPurchaseOrder`) |
| `material_requests.request_no` | `requestNo` | `system-route.mjs:653` (`LEFT JOIN material_requests`) | `PurchaseOrderDrawer.tsx` (khối `po-source-pr`) |
| `purchase_order_items.ordered_qty` | `orderedQty` | `system-route.mjs:657` | `quantityAudit()` |
| `purchase_order_items.received_qty` | `receivedQty` | `:657` | `quantityAudit()` |
| `purchase_order_items.closed_qty` | `closedQty` | `:657` | `quantityAudit()` |
| `purchase_order_items.remaining_qty` (tính trong SQL) | `remainingQty` | `:657` | bảng dòng PO (chỉ hiện theo **DÒNG**, không dùng làm tổng PO) |
| `purchase_order_items.request_item_id` | `requestItemId` | `:657` | ghi chú tách PO mức dòng |
| `goods_receipts.purchase_order_id` (**KHÔNG** unique) | `purchaseOrderId` | `:661` | `receiptsForPurchaseOrder()` |
| `goods_receipt_items.receipt_id` (**KHÔNG** có `goods_receipt_id`) | tổng hợp thành `itemCount` | `:661` (`GROUP BY gra.receipt_id`) | `receiptItemCount()`, `isEmptyReceipt()` |
| `goods_receipt_items.accepted_qty` / `received_qty` | `acceptedQty` / `actualDeliveredQty` | `:661` | bảng GRN |
| `purchase_orders.ordered_at` / `eta` / `delivery_queued_at` / `delivery_completed_at` | `orderedAt` / `eta` / `deliveryQueuedAt` / `deliveryCompletedAt` | `:653` | `purchaseOrderTimeline()` |

**Chặn tên trường SAI bằng test (không chỉ bằng ghi chú):**
- `tests/p2-d2-po-detail.test.mjs` có `assert.doesNotMatch(source, /goodsReceiptId|goods_receipt_id/)` ⇒ **không** được dùng `goodsReceiptId`/`goods_receipt_id`.
- `tests/p2-d1-pr-child-po.test.mjs` có `assert.doesNotMatch(..., /goodsReceiptId/)` + `numeric(undefined) === 0` nhưng `hasField({orderedQty: 0}, "orderedQty") === true` (phân biệt **thiếu nguồn** với **số 0 thật**).

**Cổng dữ liệu 1 PR → N PO:** `purchase_orders.request_id` nullable/không unique ⇒ `childPurchaseOrdersFor()` lọc theo `requestId` (**không** giả định 1-1). Dữ liệu thật hiện `0 MR có ≥2 PO` ⇒ nhánh N PO **chưa có bằng chứng dữ liệu**, chỉ có bằng chứng lược đồ + mã (đã khai báo ở `PHASE2-GAP-ANALYSIS.md` §2.8).

---

## 3. D1 — §20 «ĐƠN MUA (PO) SINH TỪ PHIẾU NÀY» (TRONG CHI TIẾT PR)

**Tệp:** `app/screens/RequestDrawer.tsx` (khối `data-vntech="request-child-pos"`) · `app/page.tsx` (truyền `data` + `open`) · `lib/p2-po-trace.ts`.

| Yêu cầu §20 | Cách làm | Dấu đo được |
|---|---|---|
| Liệt kê PO có `request_id` = PR đang xem | `childPurchaseOrdersFor(data, request.id)` | `data-vntech="child-po-row"` |
| Mã PO · nhà cung cấp · trạng thái | `poNo` · `supplierName` · `statusLabel(po)` | tiêu đề cột + `StatusBadge` |
| **Tiến độ nhận** `ordered` ↔ `received` ↔ `remaining` | `deliveryProgress(po)` (tổng hợp ĐẦU PO, không lấy `remainingQty` của dòng) | 3 cột «Đã đặt / Đã nhận / Còn lại» |
| Chưa có PO ⇒ **«Chưa có PO nào»** (không bảng rỗng vô nghĩa) | nhánh `!childPos.length` | `data-vntech="request-child-pos-empty"` |
| Thiếu dữ liệu ⇒ **«chưa có nguồn» + lý do**, KHÔNG bịa số | nhánh `progress.audit.hasData === false` + `audit.reason` | `colSpan={3}` chứa `chưa có nguồn — {reason}` |
| Mỗi dòng PO **bấm được** sang màn chi tiết PO (§21) | `onClick={() => open("poDetail", po)}` | `data-vntech="child-po-open"` |

---

## 4. D2 — §21 MÀN CHI TIẾT PO (4 PHẦN, ĐÚNG THỨ TỰ)

**Tệp mới:** `app/screens/PurchaseOrderDrawer.tsx` — dựng trên khung dùng chung `EntityDetailModal`; mở bằng `modal === "poDetail"` trong `app/page.tsx`; mở thêm từ màn Mua hàng (`app/screens/Purchasing.tsx`, khối `data-vntech="purchasing-pos"`).

| # | Phần §21 | Dấu đo | Nội dung thật |
|---|---|---|---|
| 1 | **Source PR** | `po-source-pr` + `po-source-pr-orphan` | Có PR ⇒ hiện `requestNo` + `requestId` + nút mở lại phiếu; `request_id = NULL` ⇒ hiện nguyên văn **«⚠ PO mồ côi — không truy được PR.»** (KHÔNG giấu). Dữ liệu thật có đúng 1 ca: `PO-PRJ-DEMO-01-2026-0011` |
| 2 | **Ordered / Received / Remaining** | `po-summary-table` | `quantityAudit()` từ `orderedQty`/`receivedQty`/`closedQty`/`actualDeliveredQty`; thiếu nguồn ⇒ `po-summary-nosource` + `audit.reason`; kèm bảng **từng dòng PO** (`poLineLabel`) |
| 3 | **Danh sách GRN** | `po-grn-list` + `po-grn-empty-warning` | Mã · ngày · trạng thái BCH · QC · **SỐ DÒNG** · thực giao · chấp nhận; **GRN rỗng dòng ⇒ cảnh báo ĐỎ** `inline-alert danger` (dữ liệu thật `10/16` GRN rỗng dòng) |
| 4 | **Timeline** | `po-timeline` | **TÁI DÙNG** `ActivityTimeline` (`app/components/ui/Timeline.tsx`) — KHÔNG viết mới; sự kiện dựng bằng `purchaseOrderTimeline()` từ mốc THẬT (`orderedAt` · `eta` · `deliveryQueuedAt` · từng GRN `receivedAt` · `deliveryCompletedAt`); PO không có mốc ⇒ mảng RỖNG → dải hiện «Chưa có mốc thời gian» |

**Click-through:** §20 → §21 (`open("poDetail", po)`) · §21 → nguồn PR (`openSourceRequest`) · §21 → GRN (`open("receiptDetail", receipt)`) · Mua hàng → §21.

---

## 5. TEST HỢP ĐỒNG — ĐỎ TRƯỚC → XANH SAU

Mẫu theo `tests/t01-work-menu.test.mjs` (đọc mã nguồn + `node --test`), **bổ sung tầng hàm thuần**: 2 tệp test `import` trực tiếp `lib/p2-po-trace.ts` và đo trên **dữ liệu thật** (hình dạng payload + bản ghi mồ côi `PO-0011`).

### D1 — `tests/p2-d1-pr-child-po.test.mjs` (6 ca)

**ĐỎ (trước khi có khối UI):**
```
✔ §20 — lọc PO con ĐÚNG theo `requestId` … PO mồ côi KHÔNG lọt vào
✔ §20 — tiến độ nhận của từng PO con: ordered ↔ received ↔ remaining …
✖ §20 — nguồn GRN của một PO con dùng ĐÚNG tên trường thật (`purchaseOrderId`), KHÔNG có `goodsReceiptId`
      AssertionError: expected … not to match /goodsReceiptId|goods_receipt_id\b/   ← regex chưa loại phần ghi chú
✖ §20 — RequestDrawer VẼ khối PO con …
      AssertionError: RequestDrawer.tsx THIẾU khối PO con (`data-vntech="request-child-pos"`) của §20
✖ §20 — nhánh «Chưa có PO nào» … và «chưa có nguồn» + LÝ DO
      AssertionError: RequestDrawer.tsx THIẾU khối PO con (`data-vntech="request-child-pos"`) của §20
✖ §20 — cổng nối vào màn chi tiết phiếu: `page.tsx` truyền `purchaseOrders` + `open`
      AssertionError: RequestDrawer chưa được truyền `open` ⇒ dòng PO con không bấm được
exit code: 1
```

**XANH (sau khi implement):**
```
✔ … 6/6  (node --import tsx --test tests/p2-d1-pr-child-po.test.mjs)
```

### D2 — `tests/p2-d2-po-detail.test.mjs` (6 ca)

**ĐỎ (trước khi có màn §21 — lúc đó `PurchaseOrderDrawer.tsx` chỉ là bản tạm):**
```
✖ §21.1 — Source PR … PO MỒ CÔI hiện RÕ        AssertionError: THIẾU khối §21 `data-vntech="po-source-pr"`
✖ §21.2 — Ordered / Received / Remaining …      AssertionError: THIẾU khối §21 `data-vntech="po-summary-table"`
✖ §21.3 — danh sách GRN … GRN RỖNG DÒNG cảnh báo AssertionError: THIẾU khối §21 `data-vntech="po-grn-list"`
✖ §21.4 — Timeline: TÁI DÙNG dải thời gian       AssertionError: THIẾU khối §21 `data-vntech="po-timeline"`
✖ §21 — tầng màn hình: 4 phần theo ĐÚNG thứ tự   AssertionError: Thiếu một trong 4 phần bắt buộc của §21
exit code: 1
```
**2 lượt ĐỎ trung gian đã ghi lại (lỗi của TEST, đã sửa test chứ không hạ chuẩn):** (a) literal `PO` của test **thiếu `orderedAt`** ⇒ hàm đúng nhưng ca «Phát hành PO» không thể đạt — test đã được bổ sung mốc thật; (b) 3 khẳng định soi **sai phạm vi** khối JSX (hàm được gọi ở thân component, không nằm trong khối được cắt) ⇒ đã chuyển khẳng định sang `source` thay vì khối.

**XANH (sau khi implement):**
```
✔ §21.1 · ✔ §21.2 · ✔ §21.3 · ✔ §21.4 · ✔ §21 — tầng màn hình · ✔ §21 — màn Mua hàng cũng mở được chi tiết PO
node --import tsx --test tests/p2-d1-pr-child-po.test.mjs tests/p2-d2-po-detail.test.mjs
ℹ tests 12   ℹ pass 12   ℹ fail 0
```

---

## 6. CỔNG ĐO (chạy thật, dán nguyên văn)

### 6.1 Lượt đo ĐẦU (ngay sau 3 commit đầu)

| # | Cổng | Lệnh | Kết quả | Kết luận |
|---|---|---|---|---|
| 1 | Typecheck | `npx tsc --noEmit` | `tsc-exit=0` (0 lỗi) | ✅ ĐẠT |
| 2 | Lint | `npm run lint` | `✖ 186 problems (0 errors, 186 warnings)` → `lint-exit=0` | ✅ ĐẠT (0 error; nền warning) |
| 3 | Regression | `npm run test:regression` | `ℹ tests 69 · ℹ pass 60 · ℹ fail 9` | ❌ **CHƯA XANH — 9 ca hỏng, KHÔNG do lượt này** (xem §7.1) |
| 4 | Workflow | `npm run test:workflow` | `Workflow VNTECH ERP V5.3.0 FULL W2 passed: …` | ✅ ĐẠT |
| 5 | 2 test mới | `node --import tsx --test tests/p2-d1-*.test.mjs tests/p2-d2-*.test.mjs` | `tests 12 · pass 12 · fail 0` | ✅ ĐẠT |
| 6 | Probe T-01 | `node --import tsx tests/t01-work-menu-probe.mjs` | `═══ KẾT QUẢ: 7 ĐẠT · 0 HỎNG ═══` | ✅ ĐẠT |
| 7 | Probe project screen | `node tools/probe-project-screen.mjs` | `KẾT LUẬN: ĐẠT ✅` | ✅ ĐẠT |

**Lint 186 warning toàn nền** (không phát sinh từ lượt này): `lib/**` cũ + `tools/**` cũ + `app/page.tsx` (import không dùng có từ trước). Riêng 4 tệp của lượt này lint sạch: `npx eslint lib/p2-po-trace.ts app/screens/PurchaseOrderDrawer.tsx app/screens/RequestDrawer.tsx app/screens/Purchasing.tsx → eslint-exit=0`.

### 6.2 Lượt đo LẠI (theo yêu cầu "test xanh sau thay đổi") — luồng song song đã tiến thêm

Cây làm việc đã đổi **do luồng khác** (`M lib/approval-helpers.ts`, `M scripts/system-route.mjs`, `M lib/vntech-identity-data.mjs`, **mới** `?? drizzle/0161_p2_pr_approval_dynamic_default.sql`, `?? lib/p2-approval-flow.mjs`) — **không phải tệp của TASK-105**. Lượt đo lại:

| # | Cổng | Lệnh | Kết quả | Kết luận |
|---|---|---|---|---|
| 1 | Typecheck | `npx tsc --noEmit` | `TSC_EXIT=0` | ✅ ĐẠT |
| 2 | Lint | `npm run lint` | `✖ 184 problems (0 errors, 184 warnings)` → `LINT_EXIT=0` | ✅ ĐẠT |
| 3 | Regression | `npm run test:regression` | `ℹ tests 69 · ℹ pass **68** · ℹ fail **1**` | ❌ **CHƯA XANH — 1 ca, KHÔNG do lượt này** (xem §7.2) |
| 4 | Workflow | `npm run test:workflow` | `AssertionError: Dự án chưa được phân công 01 Owner hợp lệ cho Bước 0 – Thư ký Tổng giám đốc … 400 !== 200` (`workflow-direct.test.ts:137`) | ❌ **CHƯA XANH — do Ownership assignment mới** (xem §7.2) |
| 5 | 2 test mới | `node --import tsx --test tests/p2-d1-*.test.mjs tests/p2-d2-*.test.mjs` | `ℹ tests 12 · ℹ pass 12 · ℹ fail 0` → `NEWTESTS_EXIT=0` | ✅ ĐẠT |
| 6 | Probe T-01 | `node --import tsx tests/t01-work-menu-probe.mjs` | `═══ KẾT QUẢ: 7 ĐẠT · 0 HỎNG ═══` → `PROBE1_EXIT=0` | ✅ ĐẠT |
| 7 | Probe project screen | `node tools/probe-project-screen.mjs` | `KẾT LUẬN: ĐẠT ✅` → `PROBE2_EXIT=0` | ✅ ĐẠT |

**Tệp của TASK-105 phủ định nguyên nhân:** `lib/p2-po-trace.ts` **không import gì** (hàm thuần); 4 tệp còn lại chỉ là JSX client + `page.tsx`; **không tệp nào được `scripts/**`/`app/api/**` import** ⇒ không thể tạo 400/500 trong `bootstrap`/`create_request`.

---

## 7. HAI CỔNG 3 & 4 CHƯA XANH — NGUYÊN NHÂN ĐÃ ĐO (KHÔNG thuộc phạm vi lượt này)

### 7.1 Lượt đo đầu — 9 ca hỏng (bootstrap 500)

**9 ca hỏng của `test:regression` là HỎNG NỀN, đã đo bằng cách so sánh CÙNG một môi trường:**

| Lần đo | Thay đổi của lượt này | Kết quả `test:regression` |
|---|---|---|
| Có thay đổi (D1+D2 trên đĩa) | có | `tests 69 · pass 60 · **fail 9**` |
| `git stash --include-untracked` đúng 7 tệp của lượt này | **không** | `tests 69 · pass 60 · **fail 9**` (y hệt) |

⇒ **9 ca hỏng có TRƯỚC và ĐỘC LẬP với thay đổi của TASK-105** (mọi tệp của lượt này đều bị loại khỏi cây làm việc khi đo nền).

**Nguyên nhân gốc đã chẩn đoán (script chẩn đoán tạm, chạy NGOÀI repo):**
```
GET /api/system/bootstrap  →  HTTP 500
LỖI: no such column: stage_kind
```
`stage_kind` **KHÔNG tồn tại** trong lược đồ/drizzle hiện tại; nó được **thêm vào `scripts/system-route.mjs` bởi một luồng công việc KHÁC đang chạy song song trên cùng workspace** (cây làm việc hiện có `M scripts/system-route.mjs` + **mới** `?? lib/p2-approval-flow.mjs`, `?? drizzle/0159_*.sql`, `?? drizzle/0160_*.sql`, `?? tests/p2-approval-dynamic.test.mjs`, `?? tests/p2-25-pr-po-grn-cases.test.mjs` — **không phải thay đổi của TASK-105**). Bộ test regression dựng SQLite từ `drizzle/*.sql` nên cột này vắng ⇒ bootstrap 500 ⇒ 8 ca phụ thuộc bootstrap + `tests/work-item-comment-participant.test.ts` hỏng theo.

### 7.2 Lượt đo lại — 1 ca regression + cổng 4 (Ownership assignment)

Luồng song song đã bổ sung `drizzle/0161_p2_pr_approval_dynamic_default.sql` ⇒ **lỗi `stage_kind` ĐÃ HẾT** (9 → 1 ca). Ca còn lại và cổng 4 nay cùng một nguyên nhân:

```
✖ ĐNMH preview/enrich + tạo phiếu PostgreSQL-safe theo Contract/BOQ Version
  AssertionError: Dự án chưa được phân công 01 Owner hợp lệ cho Bước 0 – Thư ký Tổng giám đốc.
                  Quản trị viên cần cấu hình “Phân công xử lý theo dự án”.   400 !== 200
`npm run test:workflow` → cùng AssertionError tại `tests/workflow-direct.test.ts:137`
```
Nguồn: kiểm tra Ownership **mới** tại `scripts/system-route.mjs:524`. Đây là hệ quả của luồng động hoá luồng duyệt (`lib/approval-helpers.ts` + `lib/p2-approval-flow.mjs`) đang sửa **cùng workspace**, không phải của 2 màn UI.

**Không tự sửa:** sửa đòi hỏi đụng `scripts/**`, `lib/approval-helpers.ts` hoặc seed `drizzle/**` — **ngoài phạm vi TASK-105**; đúng lệnh *"nếu buộc sửa tệp khác ⇒ DỪNG, báo BLOCKED"*. **Cổng 3 và 4 để lại cho luồng đang giữ luồng-duyệt-động.**

---

## 8. COMMIT (từng màn, KHÔNG `git add -A`, KHÔNG push)

| Màn | Commit | Nội dung |
|---|---|---|
| **D1 (§20)** | `caa742d` | `PHASE 2 (section 20) - PR detail child PO block with real field names` |
| **D2 (§21)** | `acadda4` | `PHASE 2 (section 21) - PO detail screen with source PR, quantity audit, GRN list and timeline` |
| Hệ quả D2 (lint 0 error cho helper dùng chung) | `8f81834` | `PHASE 2 (section 21) - keep p2 trace helper lint-clean (no explicit any)` |

Các tệp **không thuộc** TASK-105 (vd `scripts/system-route.mjs`, `lib/vntech-identity-data.mjs`, `AGENTS.md`, `drizzle/0159_*`) **KHÔNG được stage** trong 3 commit trên.

---

## 9. UNKNOWN / BLOCKED / CÂU HỎI

| # | Nội dung | Loại |
|---|---|---|
| 1 | **Cổng 3 + 4 CHƯA XANH sau lượt đo lại**: regression `68/69` (`ĐNMH preview/enrich …`) và `test:workflow` (`workflow-direct.test.ts:137`) **cùng một nguyên nhân** — kiểm tra Ownership mới tại `scripts/system-route.mjs:524`: *«Dự án chưa được phân công 01 Owner hợp lệ cho Bước 0 – Thư ký Tổng giám đốc»* `400 !== 200`. Luồng động hoá luồng duyệt đang chạy song song (`lib/approval-helpers.ts`, `lib/p2-approval-flow.mjs`, `drizzle/0161_*.sql`) là nguồn của kiểm tra này | **BLOCKED (ngoài phạm vi)** — cần luồng đang giữ luồng-duyệt-động seed `project_workflow_assignments` (hoặc nới kiểm tra Ownership cho luồng mặc định), rồi đo lại cổng 3 + 4 |
| 1b | Tiến triển đã đo giữa 2 lượt: lỗi nền `no such column: stage_kind` **đã hết** sau `drizzle/0161_p2_pr_approval_dynamic_default.sql` (9 → 1 ca hỏng) | CONFIRMED — chỉ luồng song song sửa được phần còn lại |
| 2 | Nhánh **1 PR → N PO** chỉ có bằng chứng **lược đồ + mã**; dữ liệu thật `0 MR có ≥2 PO` ⇒ **chưa chứng minh được bằng dữ liệu** | UNKNOWN (đã khai báo từ TASK-103 §2.8) |
| 3 | `10/16 GRN rỗng dòng`: UI nay **cảnh báo** đúng, nhưng **không tự vá dữ liệu** (không được tạo/sửa dữ liệu ở lượt này) | UNKNOWN — chờ quyết định Q5 của `PHASE2-GAP-ANALYSIS.md` §9 |
| 4 | §21 yêu cầu «click PO → GRN → PO → PR»: đã có §20↔§21, §21↔GRN, §21→PR, Mua hàng→§21. **GRN → PO** (từ `ReceiptDrawer`) **chưa thêm** (ngoài phạm vi 2 màn được giao; `ReceiptDrawer.tsx` không nằm trong danh sách tệp được phép sửa) | UNKNOWN — cần xác nhận có mở rộng phạm vi sang `ReceiptDrawer.tsx` hay không |

---

## 10. KẾT LUẬN TRUNG THỰC (không đóng việc khi cổng chưa xanh)

**Phần thuộc TASK-105 thì XANH và có bằng chứng tái lập:** cổng 1 (tsc 0) · cổng 2 (lint 0 error) · cổng 5 (12/12 test hợp đồng mới) · cổng 6 (7 ĐẠT/0 HỎNG) · cổng 7 (ĐẠT).
**Hai cổng KHÔNG được đóng:** cổng 3 (regression `68/69`, thiếu 1 so với mốc ≥69) và cổng 4 (`test:workflow` FAIL) — **cả hai do kiểm tra Ownership ngoài phạm vi**, đã đo và có đường dẫn dòng mã cụ thể. TASK-105 **KHÔNG tự nhận đã hoàn tất toàn bộ 7 cổng**.

---

*Hết TASK-105. Bằng chứng thô: 4 commit §8 · 2 tệp test §5 · script chẩn đoán cổng 3 chạy ngoài repo (không thêm tệp vào repo để giữ đúng phạm vi).*
