# PHASE 2 — SO SÁNH ĐẶC TẢ `phase2.md` VỚI PHASE 2 CỦA MASTER TASK + TIẾN ĐỘ

- **Ngày lập:** 22/09/2026 · **Task:** TASK-113 · **HEAD khi lập:** `5150eda` · nhánh `unity`
- **Chế độ:** CHỈ ĐỌC mã nguồn/CSDL + GHI TÀI LIỆU. **KHÔNG** build · **KHÔNG** start/stop dịch vụ · **KHÔNG** `INSERT/UPDATE/DELETE/ALTER/DROP/TRUNCATE`
- **Tài liệu này viết cho người dùng đọc** — trả lời đúng 2 câu: *đã giải quyết được gì* và *còn lại gì*.

---

## 0. CÂU TRẢ LỜI NGẮN (đọc 30 giây)

| Câu hỏi | Trả lời | Số |
|---|---|---|
| Đặc tả `phase2.md` (31 mục) đã đạt bao nhiêu? | **19/31 mục ĐÃ LÀM** · 10/31 một phần · 2/31 chưa làm | **61,3 %** đã làm (và **77,4 %** nếu tính mục một phần là nửa) |
| Phase 2 của **master task** (`P-01…P-09`) có phải cùng nội dung với `phase2.md`? | **KHÔNG.** Hai thứ khác nhau: `P-01…P-09` là **việc UI/menu/phân quyền** lấy từ `docs/24`; `phase2.md` là **đặc tả quy trình PR→Duyệt→PO→GRN** | xem §2 |
| `P-01…P-09` đã đánh DONE thêm được mục nào? | **KHÔNG mục nào.** Giữ nguyên **3/9** (`P-04` · `P-05` · `P-06`) | xem §3 |
| Vì sao không tăng? | Vì 6 mục còn lại (`P-01`,`P-02`,`P-03`,`P-07`,`P-08`,`P-09`) **đều CHƯA có bằng chứng đạt**; và phần đã làm được của `phase2.md` **không có mã `P-*`** nên không được cộng vào lộ trình 110 mục | §3.2 · §5 |
| Tiến độ tổng master task | **DONE 98/110 · BLOCKED 2 · TODO 10** — **giữ nguyên trước/sau** | §6 |

---

## 1. HAI THỨ "PHASE 2" KHÁC NHAU — ĐÂY LÀ GỐC CỦA MỌI NHẦM LẪN

| | **Phase 2 của MASTER TASK** | **`phase2.md` (đặc tả người dùng gửi)** |
|---|---|---|
| Tệp | `docs/25_TODO_ROADMAP.md` § *PHASE 2 — MUA HÀNG & CUNG ỨNG* | `docs/agent-progress/PHASE2-REQUIREMENTS-USER.md` |
| Số mục | **9 mục** `P-01…P-09` | **31 mục** (§1…§31), 878 dòng |
| Nội dung | Tách tab MR/PR/PO · sắp xếp · lọc · Approval Timeline · modal Tổng hợp giao nhận · hồ sơ vật tư · menu NCC/Đối tác · liên kết Supplier · sửa 5 chỗ `requireRole` | Quy trình PR → duyệt động → tách nhiều PO → nhiều GRN → đối soát số lượng → hoàn tất PO/PR · versioning workflow · RBAC · 12 test case |
| Nguồn gốc | `docs/24_SYSTEM_AUDIT_REPORT.md` §15 | Người dùng gửi trực tiếp |
| Đã xác nhận từ trước | `PHASE2-GAP-ANALYSIS.md:32` — *"**PHASE 2 chỉ 9 mục `P-01…P-09`, KHÔNG có quy trình PR/PO**"* | — |

> ⚠️ **Kết luận quan trọng:** công sức PHASE 2 trong các TASK-103…111 **chủ yếu phục vụ `phase2.md`**, mà `phase2.md` **không có mã dòng trong lộ trình 110 mục**. Vì vậy *"đã làm rất nhiều"* và *"DONE của lộ trình không tăng"* **cả hai đều đúng** — không phải mâu thuẫn, mà là **hai hệ đếm khác nhau**.

---

## 2. VIỆC 1 — BẢNG SO SÁNH `P-01…P-09` ⇒ `phase2.md` (sản phẩm chính)

Cách đọc: **nguyên văn yêu cầu** → **mục `phase2.md` tương ứng** → **đã giải quyết gì (bằng chứng cụ thể)** → **còn thiếu gì** → **trạng thái**.

### `P-01` — Tách MR · PR · PO thành 3 tab riêng
- **Nguyên văn:** *"Tách **MR · PR · PO** thành 3 tab riêng"* (P2 · phụ thuộc `U-03` · QUYỀN=CHECK)
- **`phase2.md` tương ứng:** **không có mục nào** (đặc tả không nói về tab; gần nhất là §20 — danh sách PO con trong chi tiết PR, và §21 — chi tiết PO).
- **Đã giải quyết gì:** **Đặc tả đã xong, mã thì KHÔNG.** `P01-TAB-SPEC.md` đã chốt ngữ nghĩa **bằng dữ liệu thật** (MR = `status='pending_approval'` **7 dòng** · PR = `status='approved'` **10 dòng** · PO = `data.purchaseOrders` **7 dòng**) và xác minh **không có bảng `purchase_requests`** (`information_schema` = 0). Mã đã từng làm (`4dddf33`) rồi **bị rollback có chủ ý** — commit `0c7318b` *"[ROLLBACK P-01 + TAM DUNG] Tra P-01 ve nguyen trang theo yeu cau user (chua chot PHASE 2)"*, xoá 40 dòng ở `app/screens/Purchasing.tsx`, xoá màn ảnh `20-purchasing-tabs` + 4 ảnh chuẩn.
- **Đo lại 22/09 (HEAD `5150eda`):** `app/screens/Purchasing.tsx:21` vẫn `requests=data.requests.filter(…row.supplyStatus==="awaiting_po")` ⇒ **1 bảng gộp, 0 tab**.
- **Còn thiếu:** toàn bộ phần UI (thanh 3 tab + 3 bảng). **Nguyên nhân là QUYẾT ĐỊNH của người dùng**, không phải bế tắc kỹ thuật.
- **Trạng thái:** **TODO** (cột Việc đã ghi rõ việc rollback + bằng chứng).

### `P-02` — Sắp xếp mặc định `created DESC`; Completed/Rejected xuống cuối
- **Nguyên văn:** *"Sắp xếp mặc định `created DESC`; Completed/Rejected xuống cuối"* (phụ thuộc `P-01`)
- **`phase2.md` tương ứng:** **không có mục nào.**
- **Đã giải quyết gì:** **không có** — phụ thuộc `P-01` đang TODO; màn Mua hàng hiện **không có thanh sắp xếp** nào để sửa.
- **Trạng thái:** **TODO**.

### `P-03` — Lọc theo Trạng thái · Ngày · Phòng ban · Người tạo · NCC · Dự án
- **Nguyên văn:** *"Lọc theo Trạng thái · Ngày · Phòng ban · Người tạo · NCC · Dự án"* (phụ thuộc `P-01`)
- **`phase2.md` tương ứng:** **không có mục nào** (§19–§21 nói về *hiển thị*, không nói về *bộ lọc*).
- **Đã giải quyết gì:** **không có** — `Purchasing.tsx:21` chỉ có 1 bộ lọc cứng (`project` + `supplyStatus==="awaiting_po"`), chưa có 6 chiều lọc.
- **Trạng thái:** **TODO**.

### `P-04` — Approval Timeline trong chi tiết phiếu (§8.1)
- **Nguyên văn:** *"**Approval Timeline** trong chi tiết phiếu (§8.1)"* (phụ thuộc `U-06`)
- **`phase2.md` tương ứng:** **§19 (APPROVAL TIMELINE UI)** + **§21 (PO detail: Timeline/Activity)**.
- **Đã giải quyết gì (2 lớp bằng chứng):**
  1. **Khung + áp dụng thật** — TASK-072: `ApprovalTimeline` (`app/components/ui/Timeline.tsx`) từ **0 lần dùng** → **dùng thật** ở `app/screens/RequestDrawer.tsx`, ánh xạ đủ **6 trường §8.1** (số bước · tên bước · người duyệt · phòng ban từ **cột thật** `approvals.department` · thời gian `decidedAt`+`dueAt` · trạng thái · **ý kiến `comment`**). Cổng `tools/probe-ui-adoption.mjs` ghi **0 → 1 lần DÙNG THẬT**; `tsc --noEmit` exit 0.
  2. **Vá nốt phần §19 còn thiếu (dải tự viết)** — TASK-110 mục §3: `lib/p2-approval-timeline.ts` (hàm thuần, nguồn **cột thật** `approvals.decided_at`→`decidedAt`, `approvals.comment`→`comment`; thiếu nguồn trả **«chưa có nguồn» + lý do**, KHÔNG bịa ngày) + `app/page.tsx` thêm 2 dấu đo `data-vntech="approval-step-decided-at"` / `"approval-step-comment"`; **test `tests/p2-d4-approval-timeline.test.mjs` 3 pass/0 fail**.
- **Còn thiếu (ghi trung thực):** TASK-110 §7 UNKNOWN #2 — 2 dấu đo mới **chưa có bằng chứng DOM lúc chạy** (lượt đó **cấm build**). Đây là *hạn chế đã khai báo*, không phải mục chưa làm.
- **Trạng thái:** **DONE** (giữ nguyên; cột Việc đã bổ sung bằng chứng 22/09).

### `P-05` — Tổng hợp giao nhận → modal riêng (§8.2)
- **Nguyên văn:** *"**Tổng hợp giao nhận** → modal riêng (§8.2)"* (phụ thuộc `U-01`)
- **`phase2.md` tương ứng:** **§21 (PO detail UI — xem GRN list, đối chiếu số lượng, không ép vào layout chi tiết)**.
- **Đã giải quyết gì:** TASK-074 — chuyển **NGUYÊN VĂN** bảng 13 cột (`data-contract="VNTECH_REQUEST_DETAIL_ALL_LINES_V1"`, dài 1433 ký tự từng bị **ép giữa** dải dọc của `RequestDrawer`) vào **`EntityDetailModal`** dùng chung, mở bằng nút `◉ Tổng hợp giao nhận (n dòng)`; **giữ lại trong drawer phần cảnh báo chặn duyệt** (*"Số dòng chi tiết tải về không khớp… Không được duyệt cho tới khi tải đủ dữ liệu."*) — tức điều kiện chặn nút Duyệt **không bị giấu** vào modal. Cổng: `tsc --noEmit` exit 0 · `EntityDetailModal` **0 → 1 lần DÙNG THẬT** · hậu kiểm script 3/3.
- **Còn thiếu:** cổng ảnh **không phủ màn chi tiết phiếu**; `dist` lúc đó cũ hơn nguồn ~13 giờ (Known Problem #68) ⇒ *"không hỏng màn khác"* đã chứng minh, *"modal hiển thị đúng lúc chạy"* chưa.
- **Trạng thái:** **DONE**.

### `P-06` — Hồ sơ vật tư đặc thù: ảnh/tệp xem được, không tràn khung (§8.3)
- **Nguyên văn:** *"Hồ sơ vật tư đặc thù: ảnh/tệp xem được, không tràn khung (§8.3)"*
- **`phase2.md` tương ứng:** **§21 (PO detail — tài liệu/đính kèm xem được)**.
- **Đã giải quyết gì:** TASK-075 — trước khi sửa, `AttachmentPanel` chỉ có **chip CHỮ** `ẢNH`/`TỆP` + link tải ⇒ **không hề thấy ảnh**; đã thêm **dải ảnh xem trước** `.attachment-photos` (`repeat(auto-fill,minmax(132px,1fr))`) + **ô ảnh thu nhỏ 42px** (`object-fit:cover`, cao chặn cứng 118px) + `overflow-wrap:anywhere` ⇒ **hết tràn khung**, không cắt nội dung. Cổng mới `tools/probe-task075-attachments.mjs` **22/22 ĐẠT**: hợp đồng tên trường UI↔API · **byte PNG thật trùng khớp từng byte** · **401 khi không cookie** · 6 phép kiểm tĩnh CSS/JSX · **4 đối chứng âm**.
- **Bài học kèm theo (đáng nhớ):** `app/globals.css` là **tệp ĐÓNG BĂNG** — `scripts/master-baseline-gate.mjs` **chặn** append sau mốc chuẩn và **hạn mức ≤ 400.653 byte** ⇒ CSS mới phải vào `app/styles/canonical.css`.
- **Trạng thái:** **DONE**.

### `P-07` — Tách Nhà cung cấp / Đối tác thành menu độc lập (§17)
- **Nguyên văn:** *"Tách **Nhà cung cấp / Đối tác** thành menu độc lập (§17)"* (phụ thuộc `S-07` · QUYỀN=CHECK)
- **`phase2.md` tương ứng:** **§12 (PO TRACKING — Supplier)** + **§17 (DATA RELATIONSHIP)**.
- **Đã giải quyết gì:** chỉ có màn **NCC đơn nhất** — `app/screens/SupplierManager.tsx` (3.916 B) dùng chung qua khoá menu **đã có** (`supplier_catalog`, `dept_plan_suppliers`). **Chưa tách 2 menu độc lập** NCC ‖ Đối tác.
- **Còn thiếu:** tách menu (NEW) — không có bằng chứng nào cho thấy đã làm.
- **Trạng thái:** **TODO**.

### `P-08` — Liên kết Supplier ↔ MR/PR/PO ↔ Material
- **Nguyên văn:** *"Liên kết Supplier ↔ MR/PR/PO ↔ Material"* (P3 · phụ thuộc `P-07`)
- **`phase2.md` tương ứng:** **§12** + **§17** + **§21 (click-through PO↔GRN↔PR)**.
- **Đã giải quyết gì:** **một phần, nằm ở phía `phase2.md` chứ không phải ở mục này** — liên kết PO→Supplier có thật (`purchase_orders.supplier_id`, `create_po` gom PO theo `supplierId`), và **truy vết đã đạt cổng**: `p2-reference-integrity` **15/15 cặp 0 mồ côi**. Ngoài ra D3 (TASK-110) đã bịt **chiều GRN → PO** (`lib/p2-po-trace.ts#purchaseOrderForReceipt` + `data-vntech="grn-source-po"`).
- **Còn thiếu:** phần **menu/liên kết kiểu mục `P-08` chưa làm** (phụ thuộc `P-07` đang TODO).
- **Trạng thái:** **TODO**.

### `P-09` — Sửa 5 chỗ `requireRole` dùng mã vai trò cũ ở `ProductionManagementUseCase`
- **Nguyên văn:** *"Sửa **5 chỗ `requireRole` dùng mã vai trò cũ** ở `ProductionManagementUseCase`"* (phụ thuộc `S-07` · QUYỀN=CHECK)
- **`phase2.md` tương ứng:** **§22 (PERMISSION / RBAC — kiểm ở backend, không chỉ ẩn nút)**.
- **Đã giải quyết gì:** **kế hoạch đã chứng minh nhưng CHƯA ÁP DỤNG** — `P09-FIX-PLAN.md` + commit `76c6a5e` ghi rõ *"chua ap dung"*.
- **Đo lại 22/09 (HEAD `5150eda`):** 5 lời gọi **vẫn nguyên mã cũ** — `ProductionManagementUseCase.java:217` / `:239` / `:264` = `List.of("admin","commander","project")`, `:283` = `List.of("admin","commander","accountant","project")`, `:309` = `List.of("admin","commander","accountant")`.
- **⚠️ ĐÍNH CHÍNH TIỀN ĐỀ (phát hiện mới, quan trọng):** `RbacService.java:80` nay kiểm **CẢ HAI** mã: `!roles.contains(user.role()) && !roles.contains(user.roleBase()) && !isAdmin(user)`. Nghĩa là **nếu `roleBase` có giá trị** thì `cht`/`da_truong` **vẫn qua** (qua `roleBase` = `commander`/`project`) ⇒ chưa có bằng chứng *"từ chối oan còn tái hiện"*. Muốn đóng mục này cần **1 ca test** chứng minh: user `role=cht` **ĐƯỢC phép** và `engineer` **bị chặn**.
- **Còn thiếu:** sửa 5 call site + ca test đối chứng.
- **Trạng thái:** **TODO**.

### 2.1 Bảng tổng hợp `P-01…P-09`

| Mục | `phase2.md` tương ứng | Đã giải quyết gì (bằng chứng cốt lõi) | Còn thiếu | TT |
|---|---|---|---|---|
| `P-01` | *(không có)* | Đặc tả xong bằng dữ liệu thật (`P01-TAB-SPEC.md` 7/10/7); mã **đã rollback** (`0c7318b`) | Toàn bộ UI 3 tab | **TODO** |
| `P-02` | *(không có)* | — | Chờ `P-01` | **TODO** |
| `P-03` | *(không có)* | — | 6 chiều lọc; chờ `P-01` | **TODO** |
| `P-04` | **§19** · §21 | `ApprovalTimeline` dùng thật (0→1) + `decidedAt`/`comment` từ cột thật; test D4 **3/0** | Chưa có bằng chứng DOM lúc chạy (chưa build) | **DONE** |
| `P-05` | §21 | Bảng 13 cột → `EntityDetailModal`; 0→1 lần dùng thật; `tsc` 0 | Cổng ảnh không phủ drawer | **DONE** |
| `P-06` | §21 | `probe-task075-attachments` **22/22 ĐẠT** (byte PNG thật) | — | **DONE** |
| `P-07` | §12 · §17 | Chỉ có 1 màn NCC dùng khoá menu sẵn có | Tách 2 menu độc lập | **TODO** |
| `P-08` | §12 · §17 · §21 | Truy vết đạt **15/15 cặp 0 mồ côi**; D3 GRN→PO đã bịt | Phần menu; chờ `P-07` | **TODO** |
| `P-09` | **§22** | Kế hoạch xong (`76c6a5e`); **5 call site vẫn mã cũ**; `RbacService:80` đã nhận cả `roleBase` | Sửa 5 call site + 1 ca test | **TODO** |

---

## 3. BẢNG NGƯỢC — 31 MỤC `phase2.md` ⇒ ĐÃ LÀM / MỘT PHẦN / CHƯA LÀM

Quy ước: **✔ ĐÃ** = có bằng chứng chạy được · **◐ MỘT PHẦN** = có phần thật, còn phần thiếu **đã ghi rõ** · **✗ CHƯA** = không có hoạt động nào cho mục đó.

| § | Mục đặc tả | Kết quả | Bằng chứng / lý do |
|---|---|---|---|
| 1 | MỤC TIÊU (tiếp triển khai Phase 2) | ✔ ĐÃ | 9 hồ sơ TASK-103…111 + 3 cổng + tài liệu này |
| 2 | BẮT BUỘC đọc tài liệu (kể cả sơ đồ/ảnh) | ✔ ĐÃ | `PHASE2-GAP-ANALYSIS.md` §1.2: bóc **32/32 nhãn** từ `Quy trình đặt hàng.docx`, dựng lại **SVG→PNG 1400×900** từ toạ độ EMU; **khai báo trung thực** hạn chế vision 429/502 + Word COM treo |
| 3 | Nguyên tắc audit trước, gán nhãn CONFIRMED/…/UNKNOWN | ✔ ĐÃ | Gap analysis §0 quy ước nhãn + mọi dòng 1 nhãn |
| 4 | Khả năng loại bỏ MR (9 câu hỏi) | ✔ ĐÃ | Kết luận **MR = REQUIRED**: `material_requests` là **nguồn DUY NHẤT** của PR/PO/GRN + 92 allocation + 100 approval; còn **6 câu hỏi chờ người dùng** (§9 gap analysis) |
| 5 | Business flow mục tiêu PR→Duyệt→PO→GRN | ✔ ĐÃ | 3 cổng đo: truy vết **5/5 chặng** · tách PO **ĐẠT** · toàn vẹn **15/15** |
| 6 | Luồng duyệt 4 bước (Thư ký TGĐ→DA→KH→Giám đốc) | ◐ MỘT PHẦN | Đã cấu hình **bằng DỮ LIỆU** 4 bước `single` (§2.2 TASK-106) và **bỏ hard-code**; nghiệm thu LIVE thấy bước 2·3·4·5 + **bước 1 `CHT xác nhận` để `active=0`** ⇒ chưa 「4 bước」 tuyệt đối. **3 nguồn lệch nhau** (tài liệu 2 bước · hệ thống 5 · đặc tả 4) ⇒ **còn chờ người dùng chốt Q2** |
| 7 | **WORKFLOW VERSIONING** (bất biến theo phiếu) | ◐ MỘT PHẦN | **Không có versioning đúng §7**: cột `version` đã bị **xoá có chủ ý** (Flyway V19), `UNIQUE(code)` chặn tạo V2, PR/PO không có `workflow_id`/`workflow_version` ⇒ **test Case 9 phải `skip` và có test riêng đo khoảng trống**. **Cơ chế thay thế có thật**: `approvals` là **instance ghi cứng lúc tạo phiếu** + `allowed_role_codes_snapshot`/`approval_mode_snapshot` ⇒ phiếu cũ **không** đổi theo cấu hình |
| 8 | Chỉ tạo PO khi PR duyệt đủ | ✔ ĐÃ | `scripts/system-route.mjs:1382` — chặn `mr.status!=="approved"`; **test §25 Case 1 pass** |
| 9 | 1 PR → NHIỀU PO | ✔ ĐÃ | Lược đồ `purchase_orders.request_id` **nullable, không UNIQUE**; mã `:1394` gom theo `supplierId`. **Cổng `p2-split-po-audit`: SỐ THẬT 1 MR đã tách ≥2 PO (max 2 PO/1 PR)**; **test Case 12 pass** |
| 10 | Logic tách PO + 4 loại số lượng | ✔ ĐÃ | **4 loại cột thật** (`requested_qty` · `approved_purchase_qty` · `ordered_qty` · `received_qty` · `closed_qty`); tách ở **mức DÒNG** qua `purchase_order_items.request_item_id`; test Case 7/8/11 pass |
| 11 | Material code + quantity validation | ✔ ĐÃ | `:1384` `sourceMap` từ `material_request_items WHERE request_id=?` + `:1386` `if(!source) throw` (chặn VT ngoài PR) và `if(ordered+next > approved+1e-9) throw` (chặn vượt). **Cổng: 59/59 dòng PR không đặt vượt**; test Case 8 pass |
| 12 | PO TRACKING (Supplier→Remaining) | ◐ MỘT PHẦN | Cột **đủ** (`supplier_id`·`ordered_at`·`eta`·`status`·`delivery_queued_at`·`delivery_completed_at`·`received_qty`·`closed_qty`) nhưng **`purchase_order_items.unit_price = 0` cho 27/27 dòng** ⇒ `total_value = 0` cho **17/17 PO** (chính `create_po` bind 0) ⇒ báo cáo tiền theo PO **vô nghĩa**. Là **quyết định tài chính — chờ người dùng** |
| 13 | 1 PO → NHIỀU GRN | ✔ ĐÃ | `goods_receipts.purchase_order_id` **không UNIQUE**; **cổng: 22/22 GRN** truy được về PO và **22/22 có ≥1 dòng GRI** (trước là 6/16 = 37,5 %); test Case 11 pass |
| 14 | PO COMPLETION theo Received ≥ Ordered | ✔ ĐÃ | `:1555` `fullyDelivered = SUM(received)+accepted+SUM(closed) >= SUM(ordered)-1e-9` ⇒ `:1559` `completed`. **Test Case 5 (70/100 ⇒ chưa xong) + Case 6 (60+40 ⇒ xong) pass** |
| 15 | PR COMPLETION suy từ PO | ✔ ĐÃ | `:1561` `requestCompleted` + `:1563` `nextRequestStatus` + `:1568` `UPDATE material_requests`. **Test Case 3 (3 PO xong ⇒ PR xong) + Case 4 (2 xong 1 dở ⇒ PR KHÔNG xong) pass** |
| 16 | PR completion **suy ở BACKEND**, PO cancelled không tự hoàn thành | ◐ MỘT PHẦN | Backend tự tính (**không** để frontend quyết); **test Case 10 pass** (reject PO không đụng `material_requests`). **Thiếu cờ `is_complete`/`completed_at`**: hiện mã hoá thành **chuỗi** `supply_status` ⇒ chưa phân biệt đủ **7 tình huống** §16 |
| 17 | DATA RELATIONSHIP & truy vết đầy đủ | ◐ MỘT PHẦN | **Có đường đi và nay đã sạch**: cổng truy vết **5/5 chặng** (A1 PO 17/17 · A2 dòng POI 27/27 · A3 GRN 22/22 · A4 dòng SL 2/2 · B1 GRN có dòng GRI 22/22) + toàn vẹn **15/15 cặp 0 mồ côi**. **Thiếu**: **0 khoá ngoại trên toàn 123 bảng** (`referential_constraints` = 0; **266 cột `*_id` chỉ là quy ước**) ⇒ CSDL **không tự chặn** dữ liệu mồ côi; **không có bảng PR riêng** (`purchase_requests` = 0) |
| 18 | KHÔNG tạo duplicate data logic | ✔ ĐÃ | Tái dùng `material_requests`/`purchase_orders`/`goods_receipts`/`supply_workflow_steps`; **không có bảng PR thứ hai**; tài liệu `TASK-111` giải thích cơ chế mã `<PREFIX>_<GUID>` |
| 19 | APPROVAL TIMELINE UI (đủ 6 trường + 5 trạng thái) | ✔ ĐÃ | `ApprovalTimeline` dùng thật ở `RequestDrawer` (6/6 trường §8.1) + vá dải tự viết ở `app/page.tsx`; **test D4 3 pass/0 fail**; trạng thái lấy từ instance thật |
| 20 | PR → PO UI (khối PO con + PR STATUS) | ✗ CHƯA | **Không có khối danh sách PO con** bên trong chi tiết phiếu. Chỉ có đường **vòng**: màn Mua hàng → mở chi tiết PO (`po-detail`). Việc `P-01` bị rollback làm phần 「tab PR」 càng trống. **⇒ VẪN LÀ VIỆC PHẢI LÀM** (§5 mục 3) |
| 21 | PO DETAIL UI (Source PR · Ordered/Received/Remaining · GRN list · click-through) | ◐ MỘT PHẦN | Modal `poDetail` có thật (`PurchaseOrderDrawer.tsx`) + D3 bịt **GRN → PO** (`purchaseOrderForReceipt`, `data-vntech="grn-source-po"`, nhánh thiếu nguồn nói rõ). **Thiếu** khối **Remaining tổng hợp đầu PO** và màn chi tiết PO độc lập |
| 22 | PERMISSION / RBAC ở **backend** cho 11 hành động | ◐ MỘT PHẦN | `requireRole`/`requireActionModule` + `canAccessProject`/`canAccessWarehouse` có ở **mọi** action · `MODULE_BY_ACTION`/`PERMISSION_BY_ACTION` (`system-route.mjs:11-27`) · **nghiệm thu LIVE**: 3 vai trò tạo phiếu **HTTP 200** (hết 403), vai trò `khv`/`procurement` vào đúng bước 4 · `RbacService.java:80` nhận **cả** `role` và `roleBase`. **Thiếu điểm kiểm quyền RIÊNG** cho `Split PO` / `Complete PO` / `Complete PR` (chúng xảy ra như **hệ quả** trong `create_po`/`confirm_delivery`) ⇒ **liên quan trực tiếp `P-09`** |
| 23 | DYNAMIC WORKFLOW — **KHÔNG hard-code** | ✔ ĐÃ | Đã **bỏ literal** bước 101/102/103 ở **cả 2 engine**: `scripts/system-route.mjs:1744` giờ tra `approval_stage_catalog` (thiếu ⇒ lỗi rõ ràng); `app/page.tsx` suy từ `stageKind`; `RequestStoreAdapter.java` lọc `stage_kind='approval'`; `BootstrapDataAdapter.java` trả `stageKind`. Đổi bước/người duyệt/SLA **không cần sửa mã** |
| 24 | BACKWARD COMPATIBILITY (§24 cấm DROP/DELETE) | ✔ ĐÃ | Các migration PHASE 2 đều **ADDITIVE** (`stage_kind` + dòng cấu hình; Flyway V21; `drizzle/0161`); seed test **chỉ INSERT 81 dòng + UPDATE 18 giá trị**, **0 câu** `DROP/DELETE/TRUNCATE` (TASK-108 §2/§3); `P-01` **rollback sạch** trả nguyên trạng (đúng §24) |
| 25 | 12 TEST CASE BẮT BUỘC | ✔ ĐÃ | **Chạy lại 22/09: `13 test · 12 pass · 1 skip · 0 fail`.** **11/12 case chạy thật** trên engine thật (SQLite in-memory + gọi thẳng `POST/GET` của route); **Case 9 `skip` CÓ TÀI LIỆU** + có **test riêng đo bằng chứng khoảng trống** (chính sách chống "xanh giả"). Tệp là **lưới an toàn cho LOGIC**, bằng chứng MySQL thật nằm ở 3 cổng |
| 26 | TODO ENFORCEMENT (gọi TODO tool thật) | ✔ ĐÃ | `todo_write` được gọi ở **mỗi** đợt TASK-103…113 (đầu/cuối task), không chỉ nói suông |
| 27 | TELEGRAM PROGRESS REPORT | ◐ MỘT PHẦN | Cơ chế `notify` **có và đã dùng** (ràng buộc trong `AGENTS.md`). **Chưa có bằng chứng trong repo** xác nhận **mọi** mốc START/DONE/BLOCKED của `P-*` đều đã gửi ⇒ chỉ dám ghi *một phần* |
| 28 | CONTINUOUS EXECUTION | ◐ MỘT PHẦN | Vòng 「làm → test → cổng → cập nhật hồ sơ → commit」 được thực hiện liên tục qua TASK-103…111; nhưng có **điểm dừng có chủ ý** (`0c7318a` *"TAM DUNG"* theo yêu cầu user) ⇒ không thể ghi "đã chạy liên tục không dừng" |
| 29 | PHASE 2 COMPLETION CONDITION (20 hạng mục) | ✗ CHƯA | **Không được** đánh dấu PHASE 2 = COMPLETE: còn **Workflow Versioning**, **Workflow Mã/Version trên phiếu**, **khối PO con §20**, **Remaining đầu PO**, **điểm kiểm quyền Split/Complete**, **giá PO = 0**, **0 FK**. Chưa có bảng đối chiếu 20 hạng mục ⇒ chưa thể "verify toàn bộ" |
| 30 | FIRST ACTION — 12 bước (audit TRƯỚC, không code ngay) | ✔ ĐÃ | Bước **1→11 XONG**: `PHASE2-GAP-ANALYSIS.md` (audit 3 chiều) + **`TASK-103.md` §5 (TODO đầy đủ)**. Bước **12 (implementation) đã bắt đầu** qua TASK-106…111 |
| 31 | SUCCESS CRITERIA (TRACEABILITY…TODO TRACKING) | ◐ MỘT PHẦN | **Traceability ◐** · **Quantity Control ✔** · **Material Code Control ✔** · **Workflow Versioning ✗ (thiếu)** · **RBAC ◐** · **Audit ✔** (`result` đã có cột, 895/895 dòng khác NULL, xác nhận qua API+DB) · **Testing ✔** · **Telegram ◐** · **TODO Tracking ✔** |

### 3.1 CÁCH ĐẾM — để người đọc tự kiểm lại

| Nhóm | Số mục | Danh sách § |
|---|---|---|
| **✔ ĐÃ LÀM** | **19** | 1 · 2 · 3 · 4 · 5 · 8 · 9 · 10 · 11 · 13 · 14 · 15 · 18 · 19 · 23 · 24 · 25 · 26 · 30 |
| **◐ MỘT PHẦN** | **10** | 6 · 7 · 12 · 16 · 17 · 21 · 22 · 27 · 28 · 31 |
| **✗ CHƯA LÀM** | **2** | 20 · 29 |

**⇒ SỐ CHỐT: ✔ ĐÃ = 19/31 · ◐ MỘT PHẦN = 10/31 · ✗ CHƯA = 2/31** (19 + 10 + 2 = **31** ✔).
**Tỷ lệ:** *đã làm* = **19/31 = 61,3 %** · *đã làm + nửa phần một phần* = 19 + 5 = 24/31 = **77,4 %** · *còn lại thật sự phải làm* = **12/31 = 38,7 %**.

> ⚠️ Trung thực về **độ chắc** của từng nhóm: **✔** = có cổng đo/cổng test **chạy lại được**; **◐** = có phần chạy thật **và** phần thiếu đã ghi rõ; **✗** = không có hoạt động nào.

---

## 4. "ĐÃ GIẢI QUYẾT ĐƯỢC GÌ" — GOM THEO GIÁ TRỊ NGHIỆP VỤ

1. **Toàn bộ chuỗi PR → Duyệt → PO → GRN nay chạy thật và đo được.** 3 cổng trên **CSDL thật `vntech_erp`** đều **ĐẠT**: truy vết **5/5 chặng 0 mồ côi**, tách PO **1 MR đã tách 2 PO**, toàn vẹn tham chiếu **15/15 cặp 0 mồ côi** (809 dòng, đối chiếu chéo 2 cách đếm khớp).
2. **Không hard-code luồng duyệt nữa.** Bước 101/102/103 từng là literal `? :` trong mã (`system-route.mjs:1744`) **đã đưa về dữ liệu** `approval_stage_catalog` ở **cả 2 engine**; admin đổi người duyệt/SLA **không cần sửa mã**.
3. **Mọi vai trò tạo được phiếu đề nghị (hết 403).** Nghiệm thu **LIVE** (`probe-p2-live-approval.mjs` **11 ĐẠT · 0 HỎNG**): `kh_nv`/`procurement` · `thuky`/`director` · `ksda`/`engineer` đều **HTTP 200**; và luật **«người tạo không tự duyệt»** có hiệu lực thật (bước trùng vai trò bị miễn, có vết `source="creator_role_waived"`).
4. **Số lượng không bị đặt vượt.** **59/59 dòng PR** không dòng nào vượt số đã duyệt; **0 dòng lệch tổng rollup**; 8 test case số lượng/hoàn tất **pass** (Case 1–8, 10–12).
5. **PR completion do BACKEND suy ra** từ PO/GRN (`:1561`/`:1563`/`:1568`), và **PO bị huỷ KHÔNG tự hoàn thành PR** (Case 10).
6. **Dữ liệu bẩn đã được vá có kiểm soát.** `PO-0011.request_id=NULL` **đã gán đúng PR cha suy từ chính dòng PO**; **10 GRN rỗng dòng đã lấp**; cổng toàn vẹn từ **exit 1 → exit 0**.
7. **Cổng đo tự phát hiện lỗi của chính nó.** `p2-reference-integrity.mjs` từng đếm **222 dòng NULL hợp lệ thành mồ côi** (ngược chú thích) ⇒ **cổng không thể về 0**; đã tách hàm thuần `mucDoMoCoi()` + **test đỏ→xanh** (13/13) và **báo cả 2 con số** (335 = 113 treo + 222 NULL) để **không che giấu** gì.
8. **12 test case bắt buộc đã thành lưới an toàn thật.** Chạy lại: **12 pass / 1 skip / 0 fail**; Case 9 **skip có tài liệu** + **test riêng đo khoảng trống** thay vì hạ kỳ vọng.

## 5. "CÒN LẠI GÌ" — 6 VIỆC CHẶN, XẾP THEO MỨC

| # | Việc còn lại | Mức | Vì sao chặn | Cần ai |
|---|---|---|---|---|
| 1 | **Workflow Versioning (§7)** — phiếu giữ bất biến bản workflow đã áp dụng | **P0** | Cột `version` **đã bị xoá có chủ ý** (V19), `UNIQUE(code)` chặn V2, PR/PO không có `workflow_id`/`version`. Hiện **chỉ có cơ chế thay thế** (snapshot trên `approvals`) | **Người dùng chốt Q3** (làm đủ §7 hay chấp nhận snapshot) |
| 2 | **Chốt luồng duyệt đúng (Q2)** — tài liệu 2 bước · hệ thống 5 · đặc tả 4 | **P0** | Sai thẩm quyền duyệt là rủi ro pháp lý/tài chính; **3 nguồn lệch nhau hoàn toàn** | **Người dùng chốt** |
| 3 | **Khối PO con trong chi tiết PR (§20)** + **Remaining đầu PO (§21)** | **P0** | Người dùng **không theo dõi được** PR đã tách thành PO nào / còn thiếu bao nhiêu | Làm được ngay |
| 4 | **Điểm kiểm quyền riêng** cho `Split PO` / `Complete PO` / `Complete PR` (§22) | P1 | 3 hành động **không tồn tại như action** ⇒ không có cổng quyền độc lập (**liên quan `P-09`**) | Cần sửa `scripts/**` + Java |
| 5 | **`unit_price`/`total_value` = 0** (27/27 dòng · 17/17 PO) | P1 | Mọi báo cáo **tiền theo PO vô nghĩa**; chính `create_po` bind 0 và `update_po_price` **không cập nhật lại** `total_value` | **Quyết định tài chính — người dùng** |
| 6 | **0 khoá ngoại / 266 quan hệ chỉ theo quy ước** | P1 | CSDL **không chặn** bản ghi mồ côi ⇒ cổng đo là **lưới an toàn duy nhất** | Quyết định kiến trúc |

---

## 6. VIỆC 2 — CẬP NHẬT TIẾN ĐỘ (chỉ ô có bằng chứng)

### 6.1 `docs/25_TODO_ROADMAP.md` — chỉ sửa **cột Việc**, **KHÔNG** đổi ô TT

| Mục | Ô TT trước | Ô TT sau | Vì sao |
|---|---|---|---|
| `P-01` | `**TODO**` | `**TODO**` | Chỉ có **đặc tả**; mã đã **rollback** (`0c7318b`) ⇒ không đủ bằng chứng |
| `P-02` | `TODO` | `TODO` | Phụ thuộc `P-01`; màn hiện **không có thanh sắp xếp** để sửa |
| `P-03` | `TODO` | `TODO` | Phụ thuộc `P-01`; chỉ có 1 bộ lọc cứng, **không** có 6 chiều |
| `P-04` | `DONE` | `DONE` | Giữ nguyên (đã có); **bổ sung** bằng chứng 22/09 vào cột Việc |
| `P-05` | `DONE` | `DONE` | Giữ nguyên (đã có); **bổ sung** bằng chứng (TASK-074) |
| `P-06` | `DONE` | `DONE` | Giữ nguyên (đã có); **bổ sung** bằng chứng cổng 22/22 |
| `P-07` | `TODO` | `TODO` | Chưa tách 2 menu |
| `P-08` | `TODO` | `TODO` | Phụ thuộc `P-07` |
| `P-09` | `TODO` | `TODO` | 5 call site **vẫn mã cũ**; thiếu ca test đối chứng |

**⇒ Không mục `P-*` nào được nâng lên DONE.** Đây **không phải** thiếu nỗ lực: **19/31 mục của `phase2.md` đã đạt** (§3.1) — nhưng chúng **không có mã dòng `P-*`** nên theo đúng luật "cổng chỉ đếm roadmap", **không được cộng vào 110 mục**.

**Khoá hợp đồng mới (test đỏ→xanh):** `tests/p2-25-roadmap-status-cell.test.mjs` — **8 ca**, khoá: mọi dòng có **đúng 12 ô** (ô TT = index 10 = `cells[length-2]`, **ô cuối rỗng**), ô TT không chứa chữ giải thích, **DONE+DOING+FRAME_ONLY+BLOCKED+TODO = 110**, PHASE 2 đúng **9 dòng**, lý do ghi ở **cột Việc**. **ĐỎ 4/8 → XANH 8/8**.

### 6.2 `docs/agent-progress/MASTER_STATUS.md` — kiểm ô SỐ

| Ô | Trước | Sau | Nguồn |
|---|---|---|---|
| `DONE` | 98 | **98** | probe §6.3 |
| `%` DONE | 89,1 % | **89,1 %** | 98/110 |
| `BLOCKED` | 2 | **2** | F-01 · W-03 |
| `TODO` | 10 | **10** | 6 × `P-*` + F-02…F-05 |
| dòng `PHASE 2 — MUA HÀNG` | 3 / 9 | **3 / 9** | `P-04` · `P-05` · `P-06` |

**⇒ KHÔNG có ô số nào phải sửa** (đã khớp cổng). **Tổng 98 + 2 + 10 = 110** ✔ (kiểm bằng `tests/p2-25-roadmap-status-cell.test.mjs` ca *"DONE + DOING + FRAME_ONLY + BLOCKED + TODO = 110"*).
**Đã rà:** MASTER_STATUS chỉ có **1 dòng** PHASE 2 (`:30`) — **không** có dòng PHASE 2 thứ hai cần sửa.

### 6.3 KẾT QUẢ `node tools/probe-roadmap-progress.mjs` — trước / sau

```
TRƯỚC (HEAD 5150eda)                      SAU (sau khi sửa cột Việc)
Tổng số mục đọc được: 110                 Tổng số mục đọc được: 110
  DONE         98 / 110  (89.1%)            DONE         98 / 110  (89.1%)
  BLOCKED       2 / 110  (1.8%)             BLOCKED       2 / 110  (1.8%)
  TODO         10 / 110  (9.1%)             TODO         10 / 110  (9.1%)
  PHASE 2 — MUA HÀNG          3/9           PHASE 2 — MUA HÀNG          3/9
  (không có nhóm OTHER)                     (không có nhóm OTHER)
```

**Khớp số đã ghi ở §6.2** ✔ · **DONE + BLOCKED + TODO = 98 + 2 + 10 = 110** ✔
**Kỳ vọng đề bài** ("DONE tăng 98 → cao hơn **nếu** có `P-*` đủ bằng chứng; **nếu không** mục nào đủ ⇒ **giữ nguyên 98** và ghi rõ lý do — đó cũng là kết quả ĐẠT") ⇒ **đúng nhánh thứ hai**, và lý do đã ghi ở §6.1.

---

## 7. TỆP ĐÃ SỬA / TẠO TRONG LƯỢT NÀY

| Tệp | Loại | Nội dung |
|---|---|---|
| `docs/25_TODO_ROADMAP.md` | **sửa** | **chỉ cột Việc** của 9 dòng `P-01…P-09`; **ô TT giữ nguyên**; mọi dòng vẫn **đúng 12 ô** |
| `docs/agent-progress/PHASE2-SO-SANH-VA-TIEN-DO.md` | **MỚI** | tài liệu này (bảng so sánh + bảng ngược 31 mục + kết luận) |
| `docs/agent-progress/TASK-113.md` | **MỚI** | nhật ký + bằng chứng + commit |
| `tests/p2-25-roadmap-status-cell.test.mjs` | **MỚI (untracked theo ràng buộc)** | 8 ca khoá hợp đồng ô TT; **ĐỎ 4/8 → XANH 8/8**; **cố ý** để untracked (ràng buộc: *"tệp test để untracked"*) |

**KHÔNG đụng:** `app/**` · `lib/**` · `scripts/**` · `java-backend/**` · `drizzle/**` · `tests/**` (chỉ TẠO tệp test mới) · `AGENTS.md` · `docs/28_*` · `.docx/.xlsx` · `tools/baseline/**` · `docs/agent-progress/TASK-094…112.md`.
**KHÔNG** `INSERT/UPDATE/DELETE/ALTER/DROP/TRUNCATE` · **KHÔNG** build · **KHÔNG** start/stop dịch vụ · **KHÔNG** `git add -A` · **KHÔNG** push.

---

## 8. CÒN CHỜ NGƯỜI DÙNG QUYẾT (không tự chọn)

1. **Q2 — luồng duyệt đúng là mấy bước?** 2 (tài liệu) / 4 (đặc tả) / 5 (hệ thống đang chạy).
2. **Q3 — versioning workflow:** làm đủ §7 (cần migration) hay chấp nhận cơ chế snapshot hiện có?
3. **Q6 — giá PO:** có điền `unit_price` theo đơn giá hợp đồng để `total_value` hết 0 không?
4. **Thứ tự ưu tiên tiếp theo:** `P-01` (3 tab — người dùng đã yêu cầu rollback) hay việc **P0 số 3** (khối PO con trong chi tiết PR §20) trước?

*Hết tài liệu. Nhật ký thực thi, phép đo nguyên văn và commit: `docs/agent-progress/TASK-113.md`.*
