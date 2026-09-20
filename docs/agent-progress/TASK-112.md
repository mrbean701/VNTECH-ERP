# TASK-112 — PHASE 2 §25: 6 TEST CASE ĐẦU (1→6) CỦA 12 CA BẮT BUỘC (NHÓM A)

- **Ngày:** 22/09/2026 · **HEAD khi làm:** `84f7c24` (`[PHASE 2 - DOCS] TASK-113`) · **Nhánh:** `unity`
- **Sản phẩm:** `tests/p2-s25-a-6cases.test.mjs` (**MỚI** — đúng 6 khối `test()`) + nhật ký này.
- **Ràng buộc đã tuân thủ:** **KHÔNG** `INSERT/UPDATE/DELETE/ALTER/DROP/TRUNCATE` (mọi truy vấn MySQL đều là `SELECT`
  và mỗi lần gọi đều kèm `SET SESSION TRANSACTION READ ONLY` ⇒ CSDL tự từ chối lệnh ghi) · **KHÔNG** build ·
  **KHÔNG** start/stop dịch vụ (8787 · 9000 · 18081) · **KHÔNG** sửa `scripts/**`, `java-backend/**`, `drizzle/**`,
  `app/**`, `lib/**`, `AGENTS.md`, `docs/28_*`, `.docx/.xlsx`, `tools/baseline/**`, `docs/agent-progress/TASK-094…111.md` ·
  **KHÔNG** `git add -A` · **KHÔNG** push · **KHÔNG** dùng PowerShell ghi tệp có tiếng Việt (chỉ tool `write`/`edit`).
- **Phạm vi:** **CHỈ 6 CA ĐẦU**. 6 ca sau (7→12) **CHƯA LÀM — lượt sau** (§7).

---

## 1. NGUYÊN VĂN 12 CA (§25) — ✅ = lượt này · ⏳ = CHƯA LÀM

Nguồn: `docs/agent-progress/PHASE2-REQUIREMENTS-USER.md` **mục 25 — TEST CASE BẮT BUỘC** (*«Phải tạo/điều chỉnh test cho tối thiểu các trường hợp»*),
trích nguyên văn từng ca (giữ đúng cách xuống dòng của đặc tả):

| # | Nguyên văn (§25) | TT lượt này |
|---|---|---|
| **Case 1** | `PR` → `chưa approve đủ` → `không được tạo PO` | **✅ ĐÃ LÀM** |
| **Case 2** | `PR` → `approve đủ` → `tạo PO` | **✅ ĐÃ LÀM** |
| **Case 3** | `PR` → `3 PO` → `tất cả PO completed` → `PR completed` | **✅ ĐÃ LÀM** |
| **Case 4** | `PR` → `3 PO` → `2 completed` → `1 incomplete` → `PR incomplete` | **✅ ĐÃ LÀM** |
| **Case 5** | `PO ordered = 100` · `GRN received = 70` → `PO incomplete` | **✅ ĐÃ LÀM** |
| **Case 6** | `PO ordered = 100` · `GRN1 = 60` · `GRN2 = 40` → `PO completed` | **✅ ĐÃ LÀM** |
| **Case 7** | `PR item = 100` · `PO001 = 60` · `PO002 = 40` → `valid` | **⏳ CHƯA LÀM — lượt sau** |
| **Case 8** | `PR item = 100` · `PO001 = 60` · `PO002 = 60` → `reject / prevent over-allocation` | **⏳ CHƯA LÀM — lượt sau** |
| **Case 9** | `PR001` → `Workflow V1` · `Workflow changed → V2` · `PR001 continues V1` · `PR002 uses V2` | **⏳ CHƯA LÀM — lượt sau** (audit: **BẤT KHẢ THI**, xem §7) |
| **Case 10** | `PO cancelled` → `verify PR completion logic` | **⏳ CHƯA LÀM — lượt sau** |
| **Case 11** | `Multiple GRN for one PO` → `quantity aggregation correct` | **⏳ CHƯA LÀM — lượt sau** (đã **dùng một phần** cho Case 6) |
| **Case 12** | `Multiple PO from one PR` → `source relationship preserved` | **⏳ CHƯA LÀM — lượt sau** (đã **dùng một phần** cho Case 2) |

> Audit `docs/agent-progress/PHASE2-GAP-ANALYSIS.md` §25 đã chốt: *«Test xanh là **baseline**, **chưa đủ phủ 12 case §25**:
> **Case 9 bất khả thi** (thiếu tính năng versioning), 5 case thiếu assert, 6 case phủ sót»*. Lượt này đóng **6 ca phủ sót đầu**
> bằng **assert thật**, không phải đếm số ca suông.

---

## 2. SÁU CA ĐÃ LÀM — yêu cầu · tệp · assert chính · kết quả

Một tệp duy nhất: **`tests/p2-s25-a-6cases.test.mjs`** — **mỗi ca = ĐÚNG 1 khối `test()`** (6 khối, không khối phụ).

| Ca | Yêu cầu của đặc tả | Khối `test()` | Assert CHÍNH (đo được, không phải "chạy không lỗi") | Kết quả |
|---|---|---|---|---|
| **1** | PR chưa duyệt đủ ⇒ không tạo PO | `§25 Case 1 — PR chưa duyệt đủ…` | `resolveApprovalFlow(...).complete === false` · `currentStageNo === 2` · `approverStageCount === 4` · `steps.map(stageNo) === [2,3,4,5]` (bước cung ứng 101/102/103 **không** lọt vào chuỗi duyệt) · engine khớp nguyên văn `mr.status!=="approved"` → `throw "Chỉ được tạo PO từ MR đã duyệt đủ các cấp."` · **dữ liệu thật:** `PO trỏ tới PR chưa duyệt = 0/17` · `PO mồ côi = 0` · `tong > 0` (chống đo rỗng) | **ĐẠT** |
| **2** | PR duyệt đủ ⇒ tạo PO | `§25 Case 2 — PR duyệt đủ…` | Trùng vai trò người lập ⇒ `autoApproved === true`, `approverStageCount 4 → 3` (không tự duyệt đơn mình) · engine có `UPDATE material_requests SET status='approved',supply_status='awaiting_po'` · chốt `approved_purchase_qty` · mở bước `"po_creation", "pending"` · PO ghi `request_id` + `.bind(poId,poNo,requestId,` · **dữ liệu thật:** `PO từ PR đã duyệt = 17 > 0` | **ĐẠT** |
| **3** | PR → 3 PO, tất cả completed ⇒ PR completed | `§25 Case 3 — 1 PR = 3 PO đều nhận đủ…` | 3 PO `40+30+30` ⇒ `deliveryProgress(...).complete === [true,true,true]`, `percent=[100,100,100]`, `remaining=[0,0,0]`, `Σordered === 100` · **công thức THẬT của engine** `requestCompleted(100/100) === true` **và** `requestCompleted(70/100) === false` (hai chiều) · `line_status='received'` theo dòng · **dữ liệu thật:** bất biến «PR hoàn tất ⇒ mọi PO con đã xong» = `0` vi phạm trên **17** cặp PR→PO | **ĐẠT** |
| **4** | 2 completed + 1 incomplete ⇒ PR incomplete | `§25 Case 4 — 2 PO xong + 1 PO dở…` | 3 PO `40/30/0` ⇒ `complete === [true,true,false]`, PO dở `remaining === 30`, `percent === 0`, đúng `2/3` xong · `requestCompleted(70/100) === false` **và** `requestCompleted(70+closed30/100) === true` · `nextRequestStatus(false,*) === "partial_delivery"` · **dữ liệu thật:** PR tách `≥2` PO mà còn dở (hiện `MR_P2SEED_SPLIT[awaiting_po 0/150]`) ⇒ **0** trường hợp mang trạng thái hoàn tất | **ĐẠT** |
| **5** | PO ordered 100 · received 70 ⇒ incomplete | `§25 Case 5 — PO đặt 100 · nhận 70…` | `deliveryProgress({100,70,0})` ⇒ `complete === false`, `remaining === 30`, `percent === 70`, `source === "po_header"` · **biên:** thiếu `DUNG_SAI_SL/2` **vẫn** chưa đủ (chống làm tròn thành đủ) · engine: `fullyDelivered(0+70 trên 100) === false`, `fullyDelivered(...,100) === true`, `nextStatus(false,false,true,false) === "partial_delivery"`, `completed = fullyDelivered && allConfirmed` · **dữ liệu thật:** PO «hoàn tất mà còn thiếu» = `0`, đối chứng PO đang dở = `15` | **ĐẠT** |
| **6** | 100 = 60 + 40 ⇒ completed | `§25 Case 6 — PO đặt 100 = chuyến 60 + chuyến 40…` | `receiptsForPurchaseOrder` gom **đúng 2** chuyến của PO-100 (không lấy chuyến của PO khác) ⇒ `Σ acceptedQty === 100` · `deliveryProgress(100/100).complete === true`, `remaining === 0` · engine: `fullyDelivered(60 cũ + 40) === true`, `+35 === false`, thiếu `10×dung sai === false` · `nextStatus(true,true,true,true) === "completed_with_exceptions"` · `SET received_qty=received_qty+?` (cộng dồn nhiều GRN) · **dữ liệu thật:** PO có `≥2` chuyến giao = `7`; «nhận đủ mà chưa hoàn tất» = `0` | **ĐẠT** |

**Không ca nào là "tài liệu hoá khoảng trống"**: cả 6 ca đều có khẳng định thật và **đều ĐẠT** trên mã + dữ liệu hiện tại.
Các **khoảng trống dữ liệu** (không phải khoảng trống tính năng) được ghi trung thực ở **§6**.

---

## 3. BA TẦNG ĐO CỦA MỖI CA (vì sao assert là THẬT, không "xanh giả")

| Tầng | Đo cái gì | Vì sao không thể "xanh giả" |
|---|---|---|
| **[1] HÀM THUẦN THẬT** | `lib/p2-po-trace.ts` (`deliveryProgress` · `quantityAudit` · `receiptsForPurchaseOrder` · `numeric`) và `lib/p2-approval-flow.mjs` (`resolveApprovalFlow`) — chính hàm mã sản phẩm đang dùng | Test **gọi** hàm sản phẩm, **không mô phỏng lại** luật ⇒ hàm sai thì test đỏ; test không thể tự "đúng" nhờ logic chép tay |
| **[2] CÔNG THỨC THẬT CỦA ENGINE** | Trích biểu thức quyết định của `scripts/system-route.mjs` (`fullyDelivered` · `completed` · `nextStatus` · `requestCompleted` · `nextRequestStatus`) rồi **thi hành** nó trên số liệu của đặc tả (100/70 · 60+40 · 3 PO) | Luật **không bị chép lại** vào test ⇒ engine đổi luật là test đỏ ngay; ngược lại cũng không thể "test chép sai luật mà vẫn xanh". Trích không được ⇒ **ĐỎ kèm chỉ dẫn cập nhật mẫu trích** (không bỏ khẳng định). Mẫu `nextStatus` phải neo bằng lookahead `(?=completed\s*\?)` vì tên này còn xuất hiện ở nhật ký thi công/tạm ứng (xem §4 lần chạy 1) |
| **[3] DỮ LIỆU THẬT (MySQL, CHỈ ĐỌC)** | Bất biến dạng **«số vi phạm = 0»** trên CSDL `vntech_erp`; số liệu **quyết định bằng hàm thuần của `tools/lib/p2-gates.mjs`** (`doQuanHe` · `demMrNhieuPo` · `ketLuan` · `tiLe` · `DUNG_SAI_SL`) — **tái dùng**, không viết lại truy vấn đo | Mỗi ca dữ liệu còn có **đối chứng chống đo rỗng** (`tong > 0`, `dangDo > 0`, `poNhieuChuyen > 0`, `conDo.length > 0`) ⇒ không thể ĐẠT nhờ bảng rỗng. Không kết nối được MySQL ⇒ `skip` kèm lý do, **KHÔNG tính là ĐẠT** (cùng quy ước `tests/p2-25-pr-po-grn-cases.test.mjs`) |

---

## 4. BẰNG CHỨNG ĐỎ → XANH (4 lần chạy, nguyên văn)

Phương án ĐỎ được phép: **tạm ẩn thư viện/hàm** — thực hiện bằng `Rename-Item` **trong `try/finally` của CÙNG một lệnh**
nên tệp được khôi phục kể cả khi test lỗi (`git status lib/` sau đó sạch, chỉ còn thay đổi có trước của lượt khác).
Nhờ nạp thư viện **ĐỘNG**, mỗi ca chỉ phụ thuộc đúng thư viện nó dùng ⇒ ĐỎ có **định vị theo ca**.

| Lần | Trạng thái | Lệnh | Kết quả nguyên văn | Đỏ ở đâu |
|---|---|---|---|---|
| **1** | **ĐỎ (lỗi của chính TEST)** | `node --import tsx --test tests/p2-s25-a-6cases.test.mjs` | `ℹ tests 6 · pass 4 · fail 2` — `ReferenceError: clean is not defined` tại `congThucEngine` (mẫu `const nextStatus = …` bắt nhầm khai báo ở **nhật ký thi công**, dòng 1345) | Case **5**, **6** |
| **2** | **ĐỎ-A — tạm ẩn `lib/p2-po-trace.ts`** | như trên | `ℹ tests 6 · pass 2 · fail 4` · ✖ Case 3 · ✖ Case 4 · ✖ Case 5 · ✖ Case 6 (✔ Case 1 · ✔ Case 2) | Case **3,4,5,6** (đúng các ca dùng `deliveryProgress`/`receiptsForPurchaseOrder`) |
| **3** | **ĐỎ-B — tạm ẩn `lib/p2-approval-flow.mjs`** | như trên | `ℹ tests 6 · pass 4 · fail 2` · ✖ Case 1 · ✖ Case 2 (✔ Case 3 · ✔ Case 4 · ✖→✔ Case 5 · ✔ Case 6) | Case **1,2** (đúng các ca dùng `resolveApprovalFlow`) |
| **4** | **XANH** | `node --import tsx --test tests/p2-s25-a-6cases.test.mjs` | `ℹ tests 6 · pass 6 · fail 0 · skipped 0 · duration_ms 727.3342` (exit `0`) | — |

**Sửa lỗi lần 1 KHÔNG nới khẳng định:** thay vì bỏ assert, mẫu trích được **siết** thành
`const\s+nextStatus\s*=\s*(?=completed\s*\?)([^;]+);` (neo lookahead) ⇒ trỏ đúng nhánh BCH xác nhận giao hàng;
2 assert của Case 5/6 **giữ nguyên nội dung**, chỉ đổi cách trích công thức. Đây đúng kỷ luật «lỗi của TEST thì sửa TEST,
không hạ chuẩn kỳ vọng».

---

## 5. CÁC CỔNG ĐÃ CHẠY LẠI TRONG LƯỢT NÀY (nguyên văn, chỉ đọc)

| Cổng | Lệnh | Kết quả | exit |
|---|---|---|---|
| Typecheck | `npx tsc --noEmit` | **0 lỗi** (`TSC_EXIT=0`) | **0** |
| Lint | `npm run lint` | **`✖ 186 problems (0 errors, 186 warnings)`** — **0 error**; cảnh báo **đều có trước**. Khi tệp mới vừa được thêm, lần chạy đầu báo `187` vì tệp mới còn **1 cảnh báo "Unused eslint-disable directive"**; đã **xoá hẳn** dòng `eslint-disable` đó (rule `no-new-func` của dự án không bật) ⇒ `npx eslint tests/p2-s25-a-6cases.test.mjs` = **0 problem**, tổng về lại **186** ⇒ lượt này **không thêm cảnh báo nào** | **0** |
| Regression | `npm run test:regression` | `ℹ tests 69 · pass 69 · fail 0 · skipped 0` | **0** |
| Workflow | `npm run test:workflow` | `Workflow VNTECH ERP V5.3.0 FULL W2 passed: …` | **0** |
| **6 ca mới** | `node --import tsx --test tests/p2-s25-a-6cases.test.mjs` | `ℹ tests 6 · pass 6 · fail 0 · skipped 0` + 6 dòng `diagnostic` số liệu thật | **0** |
| Ứng dụng (menu) | `node --import tsx tests/t01-work-menu-probe.mjs` | `═══ KẾT QUẢ: 7 ĐẠT · 0 HỎNG ═══` | **0** |
| Ứng dụng (màn dự án) | `node tools/probe-project-screen.mjs` | `KẾT LUẬN: ĐẠT ✅` | **0** |
| Cổng đo truy vết | `node tools/p2-trace-audit.mjs` | `KẾT LUẬN: ĐẠT — 5/5 chặng truy vết đầy đủ (0 mồ côi).` · A1 `17/17` · A2 `27/27` · A3 `22/22` · A4 `2/2` · B1 `22/22` · `FOREIGN KEY thật: 0` | **0** |
| Cổng đo tách PO | `node tools/p2-split-po-audit.mjs` | `KẾT LUẬN: ĐẠT — không có dòng nào đặt vượt số lượng và không lệch tổng rollup.` · `SỐ THẬT: MR có ≥ 2 PO = 1 · Số PO nhiều nhất/1 MR = 2 · MR có ≥1 PO = 16/35` | **0** |
| Cổng đo toàn vẹn | `node tools/p2-reference-integrity.mjs` | `KẾT LUẬN: ĐẠT — 15/15 cặp quan hệ không có dòng mồ côi.` · 266 quan hệ quy ước · 809 dòng · **0 mồ côi** | **0** |

> `tests/p2-s25-a-6cases.test.mjs` **CỐ Ý không nằm trong `package.json`** ⇒ `test:regression` giữ nguyên **69/69**.

---

## 6. SỐ LIỆU THẬT ĐÃ ĐO + ĐIỀU **KHÔNG** ĐƯỢC KHẲNG ĐỊNH (trung thực)

Số chốt trên `vntech_erp` tại lượt này: **MR 35 · PO 17 · GRN 22** · PO truy được về PR đã duyệt **17/17 (100 %)** ·
PO mồ côi **0** · PO có `≥2` chuyến giao **7** · MR có `≥2` PO **1** (`MR_P2SEED_SPLIT`, 2 PO) · PO đang dở **15**.

**Ba điều KHÔNG khẳng định** (đã đo và ghi lại để lượt sau không kết luận quá mức):

1. **«Đủ số lượng ⇔ PR `completed`» là SAI trên dữ liệu thật.** Đo được **13** PR đã đủ số lượng
   (`Σreceived+Σclosed ≥ Σapproved`) nhưng **không** mang trạng thái `completed` — chủ yếu do `approved_purchase_qty = 0`
   khi tồn kho đã đáp ứng (đủ về mặt số học nhưng chưa đi qua khâu lập PO/giao nhận). Vì vậy Case 3/4 **chỉ** assert
   **một chiều đúng** (bất biến phủ định «hoàn tất ⇒ con đã xong») + assert công thức engine hai chiều, **không** assert
   quan hệ tương đương hai chiều.
2. **Chiều KHẲNG ĐỊNH của Case 3 chưa có ca thật:** dữ liệu hiện **không** có PR nào tách **3 PO**, và **không** có PR nào
   ở `supply_status = 'completed'` ⇒ vế «PR completed» chỉ được chứng minh ở **tầng hàm thuần + công thức engine**
   (Case 3), còn **tầng dữ liệu** hiện là **UNKNOWN** (đã ghi bằng `diagnostic`, không hạ chuẩn).
3. **B1 «1 PR → N PO» là bằng chứng năng lực, KHÔNG phải cổng** (đúng thiết kế của `tools/p2-split-po-audit.mjs`) ⇒
   trong Case 2 nó được **báo cáo**, không dùng làm ngưỡng ĐẠT/HỎNG.

---

## 7. SÁU CA CÒN LẠI (7→12) — **CHƯA LÀM — LƯỢT SAU**

| Ca | Vì sao chưa làm ở lượt này | Việc phải làm ở lượt sau | Chặn |
|---|---|---|---|
| **Case 7** (60+40 = 100 ⇒ valid) | Ngoài phạm vi «6 ca đầu» | Đã **có sẵn** cơ sở: `tools/p2-split-po-audit.mjs` mục `[2]/[3]` + `dongVuotSoLuong`/`lechTong` ⇒ viết test hợp đồng + dữ liệu thật | — |
| **Case 8** (60+60 ⇒ chặn vượt) | Ngoài phạm vi | Engine đã có chốt `số lượng đặt vượt số đã được duyệt mua.` (`create_po`) ⇒ cần test **gọi được** hàm chặn (SQLite `:memory:` như `tests/p2-25-pr-po-grn-cases.test.mjs`) | — |
| **Case 9** (V1/V2 versioning) | Ngoài phạm vi **và** audit đã chốt **BẤT KHẢ THI** | **Chờ người dùng chốt Q3** (`PHASE2-GAP-ANALYSIS.md` §9). Đo được: `material_requests`/`purchase_orders` **không có** cột `workflow_id`/`workflow_version`; `UNIQUE(code)` chặn tạo WF V2; **drift** giữa `drizzle` (còn `version`) và MySQL thật (đã bỏ) | **BLOCKED (cần Q3)** |
| **Case 10** (PO cancelled ⇒ PR?) | Ngoài phạm vi | Hành vi đã có trong `tests/p2-25-pr-po-grn-cases.test.mjs` (Case 10) ⇒ lượt sau viết bản **hợp đồng nguồn** tương ứng | — |
| **Case 11** (nhiều GRN/1 PO) | Ngoài phạm vi (một phần đã dùng cho Case 6) | Mở rộng: 3 GRN trên 1 PO, chống nhân đôi khi cộng dồn | — |
| **Case 12** (nhiều PO/1 PR) | Ngoài phạm vi (một phần đã dùng cho Case 2) | Mở rộng: giữ quan hệ nguồn **cả hai chiều** (`childPurchaseOrdersFor` + `purchaseOrderForReceipt`) | — |

**UNKNOWN/BLOCKED khác ghi nhận trong lượt này:**

- 📌 **`docs/agent-progress/TASK-104.md` KHÔNG TỒN TẠI** (đã kiểm lại lượt này; vẫn đúng như ghi nhận của `TASK-113.md` §3.2).
  Tệp `tests/p2-25-pr-po-grn-cases.test.mjs` (untracked) có tham chiếu tới `TASK-104.md` ⇒ **nhật ký bị thất lạc**, cần khôi phục.
  Lượt này **không** tạo tệp đó (ngoài phạm vi cho phép).
- `tests/p2-25-pr-po-grn-cases.test.mjs` (12 ca, chạy engine thật trên SQLite `:memory:`) và
  `tests/p2-25-roadmap-status-cell.test.mjs` được **giữ nguyên trạng thái untracked**, không sửa, không commit.
- Lượt này **không** đổi `MASTER_STATUS` / `docs/25_TODO_ROADMAP.md` (ngoài phạm vi cho phép) ⇒ số DONE của lộ trình 110 mục
  **không đổi** vì `tests/**` không phải một mục `P-*`.

---

## 8. TỆP ĐÃ THÊM + COMMIT

| Tệp | Trạng thái | Ghi chú |
|---|---|---|
| `tests/p2-s25-a-6cases.test.mjs` | **MỚI** | 6 khối `test()`, 6 ca đầu §25, 3 tầng đo, chạy offline (`node --import tsx --test …`) |
| `docs/agent-progress/TASK-112.md` | **MỚI** | Nhật ký này |
| `tools/lib/p2-gates.mjs` | **KHÔNG ĐỔI** | Đã **tái dùng** `doQuanHe`/`demMrNhieuPo`/`ketLuan`/`tiLe`/`DUNG_SAI_SL` — không cần export thêm hàm nào ⇒ **ngữ nghĩa cổng giữ nguyên 100 %** |

Commit (ASCII, nhỏ, **không** `git add -A`; 2 tệp `tests/p2-25-*.test.mjs` giữ **untracked**):

| # | Hash | Nội dung |
|---|---|---|
| 1 | **`28ffc40`** | `[PHASE 2 - TEST] TASK-112: 6 test case dau muc 25 (case 1-6) …` — chỉ tệp `tests/p2-s25-a-6cases.test.mjs` (**1 file changed, 457 insertions**) |
| 2 | *(chính commit chứa tệp này)* | `[PHASE 2 - DOCS] TASK-112: nhat ky 12 ca muc 25 …` — chỉ tệp `docs/agent-progress/TASK-112.md` |

HEAD **trước** lượt này: `84f7c24`. **Không** push.
