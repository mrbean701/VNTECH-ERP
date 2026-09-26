# TASK-112 — PHASE 2 §25: **ĐỦ 12/12 TEST CASE BẮT BUỘC** (NHÓM A: 1→6 · NHÓM B: 7→12)

- **Ngày:** 22/09/2026 (nhóm A) · **23/09/2026** (nhóm B) · **Nhánh:** `unity`
- **HEAD khi làm nhóm A:** `84f7c24` (`[PHASE 2 - DOCS] TASK-113`) · **HEAD trước lượt nhóm B:** `7b2e8fb` (`TASK-112` nhật ký 6 ca đầu)
- **Sản phẩm:** `tests/p2-s25-a-6cases.test.mjs` (**6 ca đầu**) + `tests/p2-s25-b-6cases.test.mjs` (**MỚI — 6 ca cuối**) + nhật ký này.
- **Ràng buộc đã tuân thủ:** **KHÔNG** `INSERT/UPDATE/DELETE/ALTER/DROP/TRUNCATE` (mọi truy vấn MySQL đều là `SELECT`
  và mỗi lần gọi đều kèm `SET SESSION TRANSACTION READ ONLY` ⇒ CSDL tự từ chối lệnh ghi) · **KHÔNG** build ·
  **KHÔNG** start/stop dịch vụ (8787 · 9000 · 18081) · **KHÔNG** sửa `scripts/**`, `java-backend/**`, `drizzle/**`,
  `app/**`, `lib/**`, `AGENTS.md`, `docs/28_*`, `.docx/.xlsx`, `tools/baseline/**`, `docs/agent-progress/TASK-094…111.md` ·
  **KHÔNG** `git add -A` · **KHÔNG** push · **KHÔNG** dùng PowerShell ghi tệp có tiếng Việt (chỉ tool `write`/`edit`).
- **Phạm vi:** **ĐỦ 12 CA**. Nhóm A (1→6) ở §2–§7; nhóm B (7→12) ở §8–§13.

---

## 1. NGUYÊN VĂN 12 CA (§25) — ✅ = ĐÃ LÀM (12/12)

Nguồn: `docs/agent-progress/PHASE2-REQUIREMENTS-USER.md` **mục 25 — TEST CASE BẮT BUỘC** (*«Phải tạo/điều chỉnh test cho tối thiểu các trường hợp»*),
trích nguyên văn từng ca (giữ đúng cách xuống dòng của đặc tả):

| # | Nguyên văn (§25) | TT | Khối `test()` ở tệp nào |
|---|---|---|---|
| **Case 1** | `PR` → `chưa approve đủ` → `không được tạo PO` | **✅** | `tests/p2-s25-a-6cases.test.mjs` |
| **Case 2** | `PR` → `approve đủ` → `tạo PO` | **✅** | `tests/p2-s25-a-6cases.test.mjs` |
| **Case 3** | `PR` → `3 PO` → `tất cả PO completed` → `PR completed` | **✅** | `tests/p2-s25-a-6cases.test.mjs` |
| **Case 4** | `PR` → `3 PO` → `2 completed` → `1 incomplete` → `PR incomplete` | **✅** | `tests/p2-s25-a-6cases.test.mjs` |
| **Case 5** | `PO ordered = 100` · `GRN received = 70` → `PO incomplete` | **✅** | `tests/p2-s25-a-6cases.test.mjs` |
| **Case 6** | `PO ordered = 100` · `GRN1 = 60` · `GRN2 = 40` → `PO completed` | **✅** | `tests/p2-s25-a-6cases.test.mjs` |
| **Case 7** | `PR item = 100` · `PO001 = 60` · `PO002 = 40` → `valid` | **✅** | `tests/p2-s25-b-6cases.test.mjs` |
| **Case 8** | `PR item = 100` · `PO001 = 60` · `PO002 = 60` → `reject / prevent over-allocation` | **✅** | `tests/p2-s25-b-6cases.test.mjs` |
| **Case 9** | `PR001` → `Workflow V1` · `Workflow changed → V2` · `PR001 continues V1` · `PR002 uses V2` | **✅ (tài liệu hoá khoảng trống + BLOCKED)** | `tests/p2-s25-b-6cases.test.mjs` |
| **Case 10** | `PO cancelled` → `verify PR completion logic` | **✅** | `tests/p2-s25-b-6cases.test.mjs` |
| **Case 11** | `Multiple GRN for one PO` → `quantity aggregation correct` | **✅** | `tests/p2-s25-b-6cases.test.mjs` |
| **Case 12** | `Multiple PO from one PR` → `source relationship preserved` | **✅** | `tests/p2-s25-b-6cases.test.mjs` |

> Audit `docs/agent-progress/PHASE2-GAP-ANALYSIS.md` §25 đã chốt: *«Test xanh là **baseline**, **chưa đủ phủ 12 case §25**:
> **Case 9 bất khả thi** (thiếu tính năng versioning), 5 case thiếu assert, 6 case phủ sót»*. Lượt này đóng **cả 6 ca phủ sót còn lại**
> bằng **assert thật**; **riêng Case 9 KHÔNG được làm cho xanh** mà được **tài liệu hoá đúng khoảng trống** (xem §10).

**11/12 ca có khẳng định thật và ĐẠT trên mã + dữ liệu hiện tại. 1/12 (Case 9) là TÀI LIỆU HOÁ KHOẢNG TRỐNG + BLOCKED.**
Các **khoảng trống dữ liệu** (không phải khoảng trống tính năng) được ghi trung thực ở §7 và §13.

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

## 7. SÁU CA CÒN LẠI (7→12) — ✅ **ĐÃ LÀM ĐỦ Ở LƯỢT NHÓM B** (§9–§13)

Bảng dưới giữ nguyên cột «kế hoạch đã vạch ở lượt nhóm A» để đối chiếu, cột cuối ghi **trạng thái thật sau lượt nhóm B**:

| Ca | Kế hoạch đã vạch ở lượt A | Trạng thái thật sau lượt B | Chặn |
|---|---|---|---|
| **Case 7** (60+40 = 100 ⇒ valid) | Tái dùng `dongVuotSoLuong`/`lechTong` của `tools/p2-split-po-audit.mjs` | ✅ **ĐÃ LÀM** — §9 | — |
| **Case 8** (60+60 ⇒ chặn vượt) | Test **gọi được** chốt chặn `create_po` | ✅ **ĐÃ LÀM** — §9 (trích **khối** `if (…) throw` inline, không chép luật) | — |
| **Case 9** (V1/V2 versioning) | Chờ người dùng chốt Q3 | ✅ **ĐÃ LÀM** dạng **tài liệu hoá khoảng trống**, KHÔNG làm cho xanh — §10 | **BLOCKED (cần Q3)** |
| **Case 10** (PO cancelled ⇒ PR?) | Viết bản **hợp đồng nguồn** | ✅ **ĐÃ LÀM** — §11 | — |
| **Case 11** (nhiều GRN/1 PO) | Mở rộng: 3 GRN trên 1 PO, chống nhân đôi | ✅ **ĐÃ LÀM** — §12 | — |
| **Case 12** (nhiều PO/1 PR) | Giữ quan hệ nguồn **cả hai chiều** | ✅ **ĐÃ LÀM** — §13 | — |

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

HEAD **trước** lượt nhóm A: `84f7c24`. **Không** push.

---
---

# PHẦN B — LƯỢT NHÓM B: 6 TEST CASE CUỐI (7→12) · ĐỦ 12/12

- **Sản phẩm MỚI:** `tests/p2-s25-b-6cases.test.mjs` (**đúng 6 khối `test()`**, 3 tầng đo, chạy offline).
- **HEAD trước lượt B:** `7b2e8fb` (`[PHASE 2 - DOCS] TASK-112: nhat ky 12 ca muc 25 (nguyen van) …`) · **Nhánh:** `unity`
- **Ràng buộc:** giống nhóm A và **giữ đủ** — không `INSERT/UPDATE/DELETE/ALTER/DROP/TRUNCATE`, không build, không
  start/stop dịch vụ, không sửa `scripts/**`/`lib/**`/`app/**`/`drizzle/**`/`java-backend/**`/`AGENTS.md`/`docs/28_*`/
  `.docx/.xlsx`/`tools/baseline/**`/`TASK-094…111.md`, không `git add -A`, không push, chỉ tool `write`/`edit` để ghi tệp tiếng Việt.

## 9. SÁU CA 7→12 — yêu cầu · tầng đo · assert CHÍNH · kết quả

Một tệp duy nhất: **`tests/p2-s25-b-6cases.test.mjs`** — **mỗi ca = ĐÚNG 1 khối `test()`** (6 khối, không khối phụ).

| Ca | Yêu cầu của đặc tả | Assert CHÍNH (đo được, không phải "chạy không lỗi") | Kết quả |
|---|---|---|---|
| **7** | `PR item = 100` · `PO001 = 60` · `PO002 = 40` ⇒ **valid** | **[1]** `childPurchaseOrdersFor` gom đúng **2** PO của PR (PO của PR khác KHÔNG lọt) ⇒ `Σ ordered = 100` đúng bằng hạn mức · **[2]** **thi hành chính chốt chặn của engine** ⇒ 2 dòng 60+40 **KHÔNG** bị chặn, `addedByItem` ghi nhận **đã đặt đủ 100**; biên: `101 > 100+1e-9` ⇒ **chặn**; `100+1e-9` ⇒ không chặn; `100+2e-9` ⇒ chặn; `+DUNG_SAI_SL` và `+DUNG_SAI_SL/2` ⇒ **đều chặn** (ghi nhận trung thực: dung sai chốt **1e-9 khắt khe hơn** dung sai cột DECIMAL 1e-4) · **[3] dữ liệu thật:** 59 dòng PR · **đặt vượt = 0** · **lệch rollup = 0** · đặt đủ hạn mức = 18 (30,5%) | **ĐẠT** |
| **8** | `PR item = 100` · `PO001 = 60` · `PO002 = 60` ⇒ **reject / prevent over-allocation** | **[1]** nhận diện 60+60 = **120 > 100**; `dongVuotSoLuong` xếp dòng vào nhóm VƯỢT với `vuot = 20` · **[2] chốt THẬT của engine là cộng dồn TRONG CÙNG lượt gọi** ⇒ chặn **đúng dòng thứ 2**, giá trị bị chặn = **120**, phần đã ghi nhận **DỪNG ở 60**; chống hồi quy: xét riêng `60 ≤ 100` ⇒ **không** chặn (nên phải đo `next`, không đo `qty`), còn `60 + 60` khi CSDL đã có 60 ⇒ **chặn** · **[3] dữ liệu thật:** dòng vượt hạn mức = **0**; **đối chứng chống đo rỗng**: `UNIQUE(request_item_id) = 0` (lược đồ **cho phép** tách nhiều PO ⇒ 0 vi phạm là nhờ chốt ứng dụng, không phải nhờ lược đồ chặn) | **ĐẠT** |
| **9** | `PR001` → `Workflow V1` · `Workflow changed → V2` · `PR001 continues V1` · `PR002 uses V2` | **⚠️ TÀI LIỆU HOÁ KHOẢNG TRỐNG (KHÔNG làm cho xanh).** Khẳng định tính năng **CHƯA tồn tại**: nguồn engine **0** tham chiếu `workflow_id` / `workflow_version` / `publish_workflow_version|revise_workflow`; MySQL thật: `material_requests` + `purchase_orders` **KHÔNG** có cột `workflow_id`/`workflow_version`; `workflow_definitions.version` **đã bị xoá (Flyway V19)**; `workflow_steps.version` không có; **1** unique trên `workflow_definitions.code` (chính ràng buộc chặn tạo V2); **0** bảng `*workflow_version*`. Đo **cơ chế thay thế CÓ THẬT**: `approvals.allowed_role_codes_snapshot` + `approval_mode_snapshot` tồn tại và engine đọc bằng `COALESCE(NULLIF(a.…_snapshot,''),cfg.…)` sau `LEFT JOIN approval_stage_catalog` ⇒ phiếu cũ **không** đổi theo cấu hình mới (nhưng là snapshot **từng bước**, KHÔNG phải versioning **cả luồng**). 4 việc phải làm để "làm thật" được ghi thẳng vào `diagnostic` | **ĐẠT hợp lệ** (11/12 ca mới có khẳng định thật; riêng ca này cố ý khẳng định **khoảng trống**) · **BLOCKED — cần người dùng chốt Q3** |
| **10** | `PO cancelled` ⇒ **verify PR completion logic** | **[1]** PO bị hủy (`received 0/100`) ⇒ `deliveryProgress(...).complete === false`, `remaining === 100`, `percent === 0` — **hủy KHÔNG được biến thành «đã đóng»** · **[2]** `requestCompleted(0/100) === false`, và chỉ `true` khi phần thiếu được **ĐÓNG** bằng `closed_qty` (đóng là hành động riêng, không phải hệ quả của hủy); cổng hủy là `UPDATE purchase_orders SET status='cancelled',decision_reason=?,decided_by=?,decided_at=?`, chỉ PO `pending_approval` mới hủy được, thông điệp engine nguyên văn *«PR vẫn mở để xử lý lại.»*; **bằng chứng PHỦ ĐỊNH:** trích thân cổng hủy và khẳng định nó **KHÔNG** đụng `purchase_order_items`/`material_request_items`/`material_requests` · **[3] dữ liệu thật:** **17** PO · PO bị hủy = **0** · PO hủy thiếu hồ sơ = **0** · **PR hoàn tất trong khi còn PO con bị hủy = 0** | **ĐẠT** |
| **11** | `Multiple GRN for one PO` ⇒ **quantity aggregation correct** | **[1]** `receiptsForPurchaseOrder` gom **đúng 3** chuyến của PO (KHÔNG lấy chuyến của PO khác) ⇒ `Σ = 40+35+25 = 100` — không bỏ sót, không nhân đôi; **chỉ riêng chuyến đầu (40) là chưa đủ** (chứng minh phép đo phải là cộng dồn) · **[2]** công thức engine: `fullyDelivered(0, 40) = false` → `(40, 35) = false` → `(75, 25) = **true**` → `(75, 24) = false` (cộng dồn **đủ** mới xanh, chống làm tròn); tập trạng thái hợp lệ suy trực tiếp từ `nextStatus` của engine · **[3] dữ liệu thật:** **7** PO có ≥2 chuyến (6 trong miền công thức, 1 còn `pending_approval`); **hoàn tất mà thiếu = 0** · **trạng thái lạ = 0** · **hoàn tất mà tổng GRN thiếu = 0** · **dòng PO vượt tổng chuyến chấp nhận = 0** · **dòng nhận vượt số đặt = 0** · đã nhận đủ = 2 · PO 3 chuyến đã xác nhận 210/210 `completed` | **ĐẠT** |
| **12** | `Multiple PO from one PR` ⇒ **source relationship preserved** | **[1] CẢ HAI CHIỀU:** `childPurchaseOrdersFor(PR-12)` ⇒ đúng `[PO-A, PO-B]` (không gộp PO của PR khác, không lọc mất); `purchaseOrderForReceipt` ⇒ GRN của PO-B quay về **đúng PO-B** (không ghép bừa sang PO-A); PO-A **không** "mượn" chuyến của PO-B; GRN trỏ PO không tồn tại ⇒ `null` (hiện «chưa có nguồn»); `isOrphanPurchaseOrder` phân biệt đúng có/không `requestId` · **[2]** engine bắt buộc ghi `request_id` trên PO và `request_item_id` trên **từng dòng** PO · **[3] dữ liệu thật:** **17/17 (100 %)** PO truy được về PR · mồ côi = **0** · **dòng PO trỏ về dòng PR của PHIẾU KHÁC = 0** · **1** PR có ≥2 PO · **PR tách ≥2 nhà cung cấp = 1** · `UNIQUE(purchase_orders.request_id) = 0` | **ĐẠT** |

## 10. TẦNG ĐO CỦA NHÓM B — thêm hình thức trích THỨ HAI (vẫn không chép luật vào test)

Giữ nguyên 3 tầng của nhóm A; **bổ sung** một cách trích mới vì chốt chặn của Case 8 **không phải** `const`:

| Tầng | Đo cái gì | Vì sao KHÔNG thể "xanh giả" |
|---|---|---|
| **[1] HÀM THUẦN THẬT** | `lib/p2-po-trace.ts` (`childPurchaseOrdersFor` · `receiptsForPurchaseOrder` · `purchaseOrderForReceipt` · `isOrphanPurchaseOrder` · `rowKey` · `deliveryProgress` · `numeric`) — chính hàm màn UI đang dùng | Test **gọi** hàm sản phẩm; hàm sai ⇒ test đỏ. Không có bản logic nào được chép lại |
| **[2a] `congThucEngine` (như nhóm A)** | Trích `const <tên> = …;` của `scripts/system-route.mjs` rồi **thi hành** (`requestCompleted` · `fullyDelivered` · `nextStatus`) | Luật không nằm trong test ⇒ engine đổi luật là đỏ ngay |
| **[2b] `trichKhoi` (MỚI — cho Case 7/8)** | Trích **KHỐI LỆNH** `if (<biểu thức>) throw new Error('số lượng đặt vượt số đã được duyệt mua…')` của `create_po` rồi **thi hành biểu thức đó**. Vì sao buộc phải có: chốt "vượt phân bổ" là `if (…) throw …` **inline** trong callback `forEach`, **không phải** `const … = …;` — `congThucEngine` sẽ không trích được gì. Và đây là **chốt DUY NHẤT ở tầng máy chủ**, nên nếu chép lại phép so sánh vào test thì engine nới lỏng chốt mà test **vẫn xanh** | Test thi hành **chính biểu thức của engine** (`numberValue(source.orderedQty)+next > numberValue(source.approvedQty)+1e-9`). Bộ chạy `chayChotPhanBo` mô phỏng **đúng** vòng `forEach` + `addedByItem` của engine, không thêm luật nào |
| **[3] DỮ LIỆU THẬT (MySQL, CHỈ ĐỌC)** | Bất biến dạng **«số vi phạm = 0»**, số liệu quyết định bằng **hàm thuần của `tools/lib/p2-gates.mjs`** (`doQuanHe` · `dongVuotSoLuong` · `lechTong` · `ketLuan` · `tiLe` · `DUNG_SAI_SL`) — **tái dùng**, và đo cả `information_schema` (`columns` · `statistics` · `tables`) để chứng minh ràng buộc lược đồ | Mỗi ca có **đối chứng chống đo rỗng** (`dong.length > 0` · `soDong > 0` · `trongMien.length > 0` · `datDu > 0` · `duHang > 0` · `nhom.length > 0` · `wfDef > 0 && wfStep > 0`). Không kết nối được MySQL ⇒ `skip` kèm lý do, **KHÔNG tính là ĐẠT** |

**Hai lỗi của CHÍNH TEST đã gặp và sửa (không hạ chuẩn kỳ vọng nào):**
1. `trichKhoi` ban đầu neo vào `throw new Error("số lượng đặt vượt…")` với **dấu ngoặc kép**, nhưng engine dùng
   **template literal** `` new Error(`Dòng PO ${index+1}: số lượng đặt vượt…`) `` ⇒ mẫu trích **sửa để khớp nguồn THẬT**
   (`\((?:\`|")(?:Dòng PO \$\{index\+1\}: )?`), **giữ nguyên** toàn bộ assert.
2. Assert biên của Case 7 ban đầu giả định `100 + DUNG_SAI_SL/2` **không** bị chặn; đo thực tế cho thấy dung sai của
   **chính phép so sánh** là `1e-9` (≠ `DUNG_SAI_SL` = 1e-4 của cột `DECIMAL(18,4)`). Assert được **thay bằng phép đo
   đúng ngưỡng** (`+1e-9` không chặn, `+2e-9` chặn) và **ghi nhận trung thực** rằng chốt engine khắt khe hơn dung sai cột.

## 11. BẰNG CHỨNG ĐỎ → XANH (nhóm B, nguyên văn — chạy TRƯỚC lần XANH nào)

Phương án ĐỎ được phép: **tạm ẩn thư viện/hàm nguồn** bằng `Rename-Item` **trong `try/finally` của CÙNG một lệnh**
⇒ tệp được khôi phục kể cả khi test lỗi. Nhờ nạp thư viện **ĐỘNG**, mỗi ca chỉ phụ thuộc đúng thư viện nó dùng
⇒ ĐỎ có **định vị theo ca**.

| Lần | Trạng thái | Lệnh | Kết quả nguyên văn | Đỏ ở đâu |
|---|---|---|---|---|
| **1** | **ĐỎ-A — tạm ẩn `lib/p2-po-trace.ts`** | `node --import tsx --test tests/p2-s25-b-6cases.test.mjs` | `ℹ tests 6 · pass 1 · fail 5 · skipped 0` · ✖ Case 7 · ✖ Case 8 · ✔ Case 9 · ✖ Case 10 · ✖ Case 11 · ✖ Case 12 · `DO-A_EXIT=1` · khôi phục: `ton tai=True residue=False` | Case **7, 8, 10, 11, 12** — **đúng 5 ca** dùng `lib/p2-po-trace.ts`, **đúng** ca không dùng nó (Case 9) vẫn xanh |
| **2** | **ĐỎ-B — tạm ẩn `scripts/system-route.mjs`** | như trên | `✖ tests\p2-s25-b-6cases.test.mjs (242.34ms)` · `ℹ tests 1 · pass 0 · fail 1 · skipped 0` · `DO-B_EXIT=1` · khôi phục: `ton tai=True residue=False` | **Toàn tệp** — mọi ca phụ thuộc nguồn engine THẬT, kể cả **Case 9** (khẳng định khoảng trống trên chính nguồn engine) |
| **3** | **XANH** | như trên | `ℹ tests 6 · pass 6 · fail 0 · skipped 0 · duration_ms 1196.2549` · `XANH_EXIT=0` | — |
| **4** | **KIỂM RESIDUE** | `git status --short lib/ scripts/` | `M lib/vntech-identity-data.mjs` **(thay đổi CÓ TRƯỚC của lượt khác)** · `scripts/` **sạch** | **0 residue** từ phép đo ĐỎ |

> Nhóm A (1→6) giữ bằng chứng ĐỎ→XANH riêng: ngày 22/09/2026 · `ĐỎ-A` (ẩn `lib/p2-po-trace.ts`) `pass 2 · fail 4` ⇒ đỏ Case 3,4,5,6;
> `ĐỎ-B` (ẩn `lib/p2-approval-flow.mjs`) `pass 4 · fail 2` ⇒ đỏ Case 1,2; `XANH` `pass 6 · fail 0`. Chi tiết ở §4 phía trên.

## 12. CÁC CỔNG ĐÃ CHẠY LẠI (nhóm B, nguyên văn)

| Cổng | Lệnh | Kết quả | exit |
|---|---|---|---|
| Typecheck | `npx tsc --noEmit` | **0 lỗi** (`TSC_EXIT=0`) | **0** |
| Lint | `npm run lint` | `✖ 186 problems (0 errors, 186 warnings)` — **0 error**; `npx eslint tests/p2-s25-b-6cases.test.mjs` = **0 problem** ⇒ lượt này **không thêm cảnh báo nào** | **0** |
| Regression | `npm run test:regression` | `ℹ tests 69 · pass 69 · fail 0 · skipped 0` | **0** |
| Workflow | `npm run test:workflow` | `Workflow VNTECH ERP V5.3.0 FULL W2 passed: four-stage spec approvals/email/SLA → multi-PO/multi-delivery → strict material master → contract stock → inherited/override permissions → configurable groups/roles/UI → user safety.` | **0** |
| **6 ca CŨ (a)** | `node --import tsx --test tests/p2-s25-a-6cases.test.mjs` | `ℹ tests 6 · pass 6 · fail 0 · skipped 0` | **0** |
| **6 ca MỚI (b)** | `node --import tsx --test tests/p2-s25-b-6cases.test.mjs` | `ℹ tests 6 · pass 6 · fail 0 · skipped 0` + **6 dòng `diagnostic`** số liệu thật | **0** |
| Ứng dụng (menu) | `node --import tsx tests/t01-work-menu-probe.mjs` | `═══ KẾT QUẢ: 7 ĐẠT · 0 HỎNG ═══` | **0** |
| Ứng dụng (màn dự án) | `node tools/probe-project-screen.mjs` | `KẾT LUẬN: ĐẠT ✅` | **0** |
| Cổng đo truy vết | `node tools/p2-trace-audit.mjs` | `KẾT LUẬN: ĐẠT — 5/5 chặng truy vết đầy đủ (0 mồ côi).` · `FOREIGN KEY thật: 0` | **0** |
| Cổng đo tách PO | `node tools/p2-split-po-audit.mjs` | `KẾT LUẬN: ĐẠT — không có dòng nào đặt vượt số lượng và không lệch tổng rollup.` · `SỐ THẬT: MR có ≥ 2 PO = 1 · Số PO nhiều nhất/1 MR = 2 · MR có ≥1 PO = 16/35` | **0** |
| Cổng đo toàn vẹn | `node tools/p2-reference-integrity.mjs` | `KẾT LUẬN: ĐẠT — 15/15 cặp quan hệ không có dòng mồ côi.` | **0** |

## 13. SỐ LIỆU THẬT ĐÃ ĐO Ở LƯỢT B + ĐIỀU **KHÔNG** ĐƯỢC KHẲNG ĐỊNH (trung thực)

Số chốt trên `vntech_erp` tại lượt B: **MR 35 · PO 17 · GRN 22 · dòng PO 27 · dòng PR 59** ·
PO truy được về PR **17/17 (100 %)** · PO mồ côi **0** · dòng PO trỏ lệch phiếu **0** ·
dòng PR đặt vượt hạn mức **0** · dòng PR lệch rollup **0** · dòng nhận vượt số đặt **0** ·
PO có ≥2 chuyến **7** · PR có ≥2 PO **1** (tách **2 nhà cung cấp**) · PO bị hủy **0** ·
`workflow_definitions` **4** dòng · `workflow_steps` **11** dòng.

**SÁU điều KHÔNG khẳng định** (3 điều của nhóm A giữ nguyên + **3 phát hiện mới** của nhóm B):

1. *(nhóm A)* **«Đủ số lượng ⇔ PR `completed`» là SAI trên dữ liệu thật.** Đo được **13** PR đã đủ số lượng nhưng
   **không** mang trạng thái `completed` — chủ yếu do `approved_purchase_qty = 0` khi tồn kho đã đáp ứng.
   Vì vậy Case 3/4 **chỉ** assert **một chiều đúng** + công thức engine hai chiều.
2. *(nhóm A)* **Chiều KHẲNG ĐỊNH của Case 3 chưa có ca thật:** hiện **không** PR nào tách **3 PO**, **không** PR nào ở
   `supply_status = 'completed'` ⇒ vế «PR completed» chỉ được chứng minh ở **tầng hàm thuần + công thức engine**.
3. *(nhóm A)* **B1 «1 PR → N PO» là bằng chứng NĂNG LỰC, KHÔNG phải cổng** ⇒ trong Case 2/12 nó được **báo cáo**, không dùng làm ngưỡng.
4. **🆕 Đường đi xác nhận BCH CHƯA TỪNG CHẠY THẬT (đính chính một suy đoán SAI của chính lượt này).**
   Ban đầu nhóm B nghi `goods_receipts` thiếu cột `request_id` trong khi cổng BCH vẫn đọc `receipt.requestId`.
   **Đã kiểm lại và SAI:** dòng 1573 của `scripts/system-route.mjs` ánh xạ `po.request_id AS requestId`
   qua `JOIN purchase_orders po ON po.id=gr.purchase_order_id` ⇒ `receipt.requestId` lấy từ **PO**, **không** từ
   `goods_receipts`; cả 3 chỗ dùng (`requestTotals`, `requestExceptions`, `UPDATE material_requests`) đều hợp lệ.
   **Điều còn lại thật sự là khoảng trống:** `goods_receipts.bch_confirmation_status` đặt `'confirmed'` cho **22/22**
   chuyến nhưng **0** PO ở trạng thái `cancelled` và **0** PR ở `supply_status = 'completed'` ⇒ nhánh kết luận của
   `confirm_delivery` **chưa có ca chạy thật** để đối chiếu. Lượt B **không tự kết luận** nhánh đó đúng hay sai
   (ràng buộc: chỉ đọc ⇒ không thể kích hoạt xác nhận BCH để dựng bằng chứng chạy thật) — đây là **UNKNOWN** đã ghi rõ.
5. **🆕 Dữ liệu mầm P2 làm số đã nhận trên dòng PO CHẬM hơn tổng chuyến đã chấp nhận.** Đo được **7/7** dòng PO nhiều
   chuyến có `received_qty` **nhỏ hơn** `Σ accepted_qty` (ví dụ `PO-PRJ-DEMO-01-2026-0011`: dòng `20` nhưng 2 chuyến
   `20+20 = 40`). Nguyên nhân đã xác định: hiệu ứng **dữ liệu mầm `P2SEED_FILL`** (chuyến chưa được **BCH xác nhận** nên
   theo thiết kế **không** được cộng vào dòng). Vì vậy nhóm B **KHÔNG** dùng quan hệ này làm cổng; **cổng** chỉ dùng
   bất biến nghiêm ngặt thật sự đúng (`received ≤ Σ accepted` = 0 vi phạm; `received+closed ≤ ordered` = 0 vi phạm;
   `completed ⇒ đủ số` = 0 vi phạm) và ghi số «chậm cộng» ra `diagnostic`. **Không hạ chuẩn, chỉ không kết luận quá mức.**
6. **🆕 Hai nguồn lược đồ ĐANG LỆCH NHAU.** `drizzle/0080_phase_p4_workflow_multi_identity.sql` vẫn khai cột
   `` `version` int NOT NULL DEFAULT 1 `` trên `workflow_definitions`, còn `java-backend/.../V19__drop_workflow_definitions_version.sql`
   là `ALTER TABLE workflow_definitions DROP COLUMN version;` ⇒ MySQL thật **không còn** cột này. Lượt B **không sửa**
   `drizzle/**` (ngoài phạm vi) — chỉ **ghi nhận** để lượt sau xử lý.

## 14. TỆP ĐÃ THÊM + COMMIT (nhóm B)

| Tệp | Trạng thái | Ghi chú |
|---|---|---|
| `tests/p2-s25-b-6cases.test.mjs` | **MỚI** | 6 khối `test()`, 6 ca cuối §25, 3 tầng đo, chạy offline (`node --import tsx --test …`) |
| `docs/agent-progress/TASK-112.md` | **CẬP NHẬT** | Bảng 12/12 + §9–§14 (nhóm B) |
| `tools/lib/p2-gates.mjs` | **KHÔNG ĐỔI** | **Tái dùng** `doQuanHe`/`dongVuotSoLuong`/`lechTong`/`ketLuan`/`tiLe`/`DUNG_SAI_SL` — **không cần export thêm hàm nào** ⇒ **ngữ nghĩa cổng giữ nguyên 100 %** |

Commit (ASCII, nhỏ, **không** `git add -A`; 2 tệp `tests/p2-25-*.test.mjs` giữ **untracked**):

| # | Hash | Nội dung |
|---|---|---|
| 3 | **`6419000`** | `[PHASE 2 - TEST] TASK-112: 6 test case cuoi muc 25 (case 7-12) …` — chỉ tệp `tests/p2-s25-b-6cases.test.mjs` (**1 file changed, 643 insertions**) |
| 4 | *(chính commit chứa tệp nhật ký này)* | `[PHASE 2 - DOCS] TASK-112: nhat ky du 12/12 ca muc 25 (nhom B case 7-12) …` — chỉ tệp `docs/agent-progress/TASK-112.md` |

HEAD **trước** lượt B: `7b2e8fb`. **Không** push.

## 15. KIỂM CHỨNG LẠI TRÊN CÂY ĐÃ COMMIT (chống «xanh trên cây đã đổi»)

Sau khi commit xong, **không** sửa thêm dòng mã nào; mọi cổng ở §12 được **chạy lại lần hai** trên cây hiện tại để
bảo đảm «lần chạy xanh» thuộc **đúng** bản đã commit, không phải một cây trung gian nào khác.

| Phép kiểm | Lệnh | Kết quả |
|---|---|---|
| Tệp test có khớp HEAD không? | `git diff --quiet HEAD -- tests/p2-s25-b-6cases.test.mjs` | exit **0** (khớp HEAD, **0** thay đổi chưa commit) |
| Hash nội dung tệp test | `git rev-parse HEAD:tests/p2-s25-b-6cases.test.mjs` **so với** `git hash-object tests/p2-s25-b-6cases.test.mjs` | **`014b9de3e0488851d41243be1f49dbd4198b0f9d`** — **GIỐNG NHAU** |
| Tệp nguồn `lib/`·`scripts/`·`app/` bị sửa chưa commit? | `git status --porcelain lib/ scripts/ app/` | chỉ ` M lib/vntech-identity-data.mjs` — **thay đổi CÓ TRƯỚC** của lượt khác, **không** thuộc TASK-112 và **không** được tệp test này import |
| `tools/lib/p2-gates.mjs` có đổi không? | `git status --porcelain tools/` | **không xuất hiện** ⇒ cổng giữ nguyên ngữ nghĩa |

**Chạy lại lần hai (nguyên văn, trên cây đã commit):**

| Cổng | Kết quả | exit |
|---|---|---|
| 6 ca mới (b) | `✔ Case 7 · ✔ Case 8 · ✔ Case 9 · ✔ Case 10 · ✔ Case 11 · ✔ Case 12` ⇒ `ℹ tests 6 · pass 6 · fail 0 · skipped 0 · duration_ms 1464.5015` | **0** |
| 6 ca cũ (a) | `ℹ tests 6 · pass 6 · fail 0 · skipped 0` | **0** |
| Regression | `ℹ tests 69 · pass 69 · fail 0 · skipped 0` | **0** |
| Workflow | `Workflow VNTECH ERP V5.3.0 FULL W2 passed: …` | **0** |
| Typecheck | `npx tsc --noEmit` → 0 lỗi | **0** |
| Lint | `✖ 186 problems (0 errors, 186 warnings)` | **0** |
| `p2-trace-audit` | `KẾT LUẬN: ĐẠT — 5/5 chặng truy vết đầy đủ (0 mồ côi).` | **0** |
| `p2-split-po-audit` | `KẾT LUẬN: ĐẠT — không có dòng nào đặt vượt số lượng và không lệch tổng rollup.` | **0** |
| `p2-reference-integrity` | `KẾT LUẬN: ĐẠT — 15/15 cặp quan hệ không có dòng mồ côi.` | **0** |
| Menu probe | `═══ KẾT QUẢ: 7 ĐẠT · 0 HỎNG ═══` | **0** |
| Màn dự án probe | `KẾT LUẬN: ĐẠT ✅` | **0** |


