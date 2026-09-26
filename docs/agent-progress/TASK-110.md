# TASK-110 — PHASE 2 · NGHIỆM THU LIVE luồng duyệt động (VIỆC 0) + D3 «GRN → PO» + D4 «dải duyệt: thời điểm duyệt + bình luận»

**Ngày:** 20/09/2026 · **Phạm vi:** 1 việc nghiệm thu LIVE + 2 việc UI trong PHASE 2 (mục §19 · §20/§21 của `docs/agent-progress/PHASE2-REQUIREMENTS-USER.md`).
**Tiền đề (đã xong, KHÔNG làm lại):** jar Java mới `java-backend/web/target/vntech-erp-web-0.1.0-SNAPSHOT.jar` (19:13:25) đang chạy **PID 20664** (start 19:15:45) · `:18081 = 200` · 101/102/103 đã bật lại (`stage_kind='supply'`, `active=1`) · 3 cổng đo cũ (`p2-trace-audit` · `p2-split-po-audit` · `p2-reference-integrity`) đã ĐẠT.

---

## 1. VIỆC 0 — NGHIỆM THU **TRÊN ĐƯỜNG LIVE** (`tools/probe-p2-live-approval.mjs`)

Cổng đo: `node tools/probe-p2-live-approval.mjs` → **11 ĐẠT · 0 HỎNG** (exit 0).

**Đường đo:** `:9000` (proxy) ──`/api/*`──> `:18081` (jar Java) ──> MySQL `vntech_erp`.
**Cách lấy phiên (ghi rõ, KHÔNG đoán mật khẩu):** script dùng **chính action `login` của ứng dụng** (`POST /api/system {action:"login"}`) rồi lấy cookie từ header `Set-Cookie`; bộ tài khoản lấy từ probe live ĐÃ CÓ trong repo (`tools/probe-live-rolebase.mjs:9-20`, `tools/probe-live-stack.mjs:6`): admin `Admin123456@`, tài khoản demo `Vntech@2026`. Vai trò/`roleBase` của mỗi phiên được **xác nhận lại bằng GET bootstrap** (`data.user`), không tin nhãn cấu hình.

### 1.1 Đăng nhập ≥ 2 tài khoản vai trò KHÁC NHAU (thực tế 3)

| # | Tài khoản | role | roleBase | `POST login` | GET bootstrap |
|---|---|---|---|---|---|
| 1 | `nvkhdemo` | `kh_nv` | `procurement` | **200** `{"mustChangePassword":false,"ok":true}` | 200 · `data.user.username=nvkhdemo` |
| 2 | `thukydemo` | `thuky` | `director` | **200** `{"mustChangePassword":false,"ok":true}` | 200 · `data.user.username=thukydemo` |
| 3 | `ksda.demo` | `ksda` | `engineer` | **200** `{"mustChangePassword":false,"ok":true}` | 200 · `data.user.username=ksda.demo` |

### 1.2 `POST create_request` bằng vai trò KHÁC — **KHÔNG còn 403**

Mốc đối chiếu: danh sách chốt cứng CŨ tại `RequestManagementUseCase.java:63` = `["engineer","commander","admin"]` ⇒ **mọi vai trò ngoài danh sách này từng bị 403** dù có `requests.canCreate`.

```
REQUEST  create_request (nvkhdemo · kh_nv)
{"projectId":"PRJ_fdbfab20-bf1f-4ad5-8159-7dcc582140c3","neededAt":"2026-09-27",
 "area":"Khu vực nghiệm thu PHASE 2","priority":"normal",
 "lines":[{"materialId":"MAT_082196e5-02d0-45c5-84c2-eb2d0668566b","quantity":1,
           "itemType":"outside_contract","note":"Nghiệm thu PHASE 2 (probe-p2-live-approval) — vai trò khác chốt cứng cũ · người lập nvkhdemo (kh_nv)"}]}

RESPONSE create_request (nvkhdemo · kh_nv) → HTTP 200
{"ok":true,"message":"Đã lập phiếu DNMH-PRJ-DEMO-01-2026-0128 gồm 1 dòng và chuyển tới bước 2."}
```

| Vai trò (NGOÀI chốt cứng cũ) | HTTP | Thân phản hồi THẬT | Số phiếu |
|---|---|---|---|
| `kh_nv` / `procurement` (`nvkhdemo`) | **200** | `{"ok":true,"message":"Đã lập phiếu DNMH-PRJ-DEMO-01-2026-0128 gồm 1 dòng và chuyển tới bước 2."}` | 0128 |
| `thuky` / `director` (`thukydemo`) | **200** | `{"ok":true,"message":"Đã lập phiếu DNMH-PRJ-DEMO-01-2026-0129 gồm 1 dòng và chuyển tới bước 3."}` | 0129 |
| `ksda` / `engineer` (`ksda.demo`) — ĐỐI CHỨNG (trước đây cũng được) | **200** | `{"ok":true,"message":"Đã lập phiếu DNMH-PRJ-DEMO-01-2026-0130 gồm 1 dòng và chuyển tới bước 2."}` | 0130 |

⇒ **403 đã hết thật trên LIVE**: 2/2 vai trò NGOÀI chốt cứng cũ tạo được phiếu (HTTP 200 + `ok:true`).

### 1.3 Luật «NGƯỜI TẠO KHÔNG TỰ DUYỆT» — bước trùng vai trò người lập bị MIỄN

Phiếu đo: `DNMH-PRJ-DEMO-01-2026-0128` · người lập `nvkhdemo` (`kh_nv`/`procurement`) · `id = MR_266e9001-1835-49d3-94fb-6eb1c2b44d00`.
Danh sách bước duyệt dán nguyên văn (nguồn: MySQL `approvals` + đối chiếu `approval_stage_catalog.allowed_role_codes`):

| stage | status | decided_at | vai trò duyệt của bước | approver_user_id |
|---|---|---|---|---|
| 2 | `pending` | `<NULL>` | `thuky,thu_ky_tgd` | `USR_8011a197-…` (thukydemo) |
| 3 | `pending` | `<NULL>` | `project,da_nv` | `USR_76575c08-…` (nvdademo) |
| **4** | **`approved`** | **`2026-09-20 20:05:58.414`** | **`procurement,kh_nv`** | `USR_8869ca60-…` (nvkhdemo — chính người lập) |
| 5 | `pending` | `<NULL>` | `director,tgd,giam_doc` | `USR_p2_giamdoc_demo` |

```
comment       = Người lập phiếu trùng vai trò duyệt của bước 4 (procurement) — không tự duyệt đơn của mình: Phòng Kế hoạch
decision_snap = {"stage":4,"decision":"approved","user":"Nhân viên Kế hoạch F",
                 "at":"2026-09-20T12:28:02.366451200Z","source":"creator_role_waived"}
```

⇒ Bước 4 (trùng vai trò `kh_nv`/`procurement`) **bị MIỄN** (`status='approved'`, có vết `source="creator_role_waived"`), **bước ĐANG CHỜ kế tiếp = bước 2** (KHÔNG phải bước 4) ⇒ luật «người tạo không tự duyệt» có hiệu lực thật, và bước chờ **nhảy sang vai trò kế** đúng thiết kế.

### 1.4 Cột `audit_logs.result` trên LIVE (jar mới)

Sau hành động nghiệp vụ `create_request`, đọc lại qua **API** (bootstrap admin `data.audits`) và **DB**:

```
API  : create_request | entity_id=PRJ_fdbfab20-… | result="ok" | 2026-09-20T20:05:58.585   (100 dòng nhật ký, 11 dòng create_request — MỌI dòng đều có khoá `result`)
DB   : AUD_8d2f697d-1fd0-4ab8-af74-ea255b31ecfe | create_request | result="ok" | 2026-09-20 20:05:58.585
       AUD_b4c564b4-c3b7-4593-8f0f-e0bddea3c57e | create_request | result="ok" | 2026-09-20 20:05:58.520
       AUD_03d4a1e8-0b08-48c7-a938-e9ed6b6678c2 | create_request | result="ok" | 2026-09-20 20:05:58.445
```

⇒ API LIVE **trả về trường `result`** cho dòng nhật ký (jar mới có `al.result AS result` trong `BootstrapDataAdapter`), và **mọi dòng `create_request` có `result` KHÔNG rỗng** (`ok`).

### 1.5 Kiểm chéo «:9000 chỉ là ống dẫn tới CÙNG engine Java»

Gọi thẳng `:18081` bằng cùng tài khoản admin: `login` **200** và bootstrap thấy **CÙNG phiếu `DNMH-PRJ-DEMO-01-2026-0128`** vừa tạo qua `:9000` ⇒ xác nhận chuỗi `:9000 → :18081 (Java) → MySQL`.

---

## 2. VIỆC 1 (D3) — ĐỦ CHIỀU **GRN → PO**

**Trước:** `PurchaseOrderDrawer.tsx` có chiều XUÔI PO → GRN (`data-vntech="po-grn-open"` → `open("receiptDetail", receipt)`) và PO → PR (`po-source-pr-open`), nhưng đứng ở **chi tiết phiếu nhập** thì **không mở được PO nguồn** ⇒ truy vết đứt tại màn đang xem.

**Sau:**
* `lib/p2-po-trace.ts` — thêm hàm thuần **`purchaseOrderForReceipt(data, receipt)`**: tra PO theo cột THẬT `goods_receipts.purchase_order_id` (payload `purchaseOrderId`) ↔ `purchase_orders.id` (payload `id`). Thiếu nguồn ⇒ `null` (không ghép bừa sang PO khác).
* `app/screens/ReceiptDrawer.tsx` — khối mới `data-vntech="grn-source-po"`:
  * nút **`data-vntech="grn-source-po-open"`** → `close(); open("poDetail", sourcePo)` (tái dùng **modal `poDetail`** đã có ở `app/page.tsx`, KHÔNG dựng màn mới);
  * nhánh thiếu nguồn **`data-vntech="grn-source-po-missing"`** (`inline-alert danger`): hiện «**chưa có nguồn** — không truy được PO nguồn» + nói rõ là PO mồ côi/ngoài phạm vi hoặc phiếu nhập không khai `purchase_order_id`.
* `app/page.tsx` — `ReceiptDrawer` được truyền `open={open}` (vùng nhập kho/phiếu đề nghị).

**Tên trường THẬT đã dùng:** `purchaseOrderId` · `id` · `poNo` · `supplierName` · `status` (không dùng `goodsReceiptId`/`goods_receipt_id` — test chặn).

---

## 3. VIỆC 2 (D4) — DẢI DUYỆT: **thời điểm duyệt + bình luận** (đặc tả §19)

**Trước (đúng kết luận `PHASE2-GAP-ANALYSIS.md` §19):** `ApprovalTimeline` (dùng ở chi tiết phiếu) đã có `decidedAt`/`comment`, nhưng **dải tự viết** ở màn Phê duyệt (`app/page.tsx`, khối `approval-flow`) chỉ có số bước · tên · mô tả · người · trạng thái ⇒ **người duyệt không thấy ý kiến/lý do trả lại của các bước trước**.

**Sau:**
* `lib/p2-approval-timeline.ts` (mới, **hàm thuần, KHÔNG import gì** ⇒ test được ở tầng dữ liệu): `approvalDecisionAtView` · `approvalDecisionCommentView` · `NO_SOURCE_TEXT = "chưa có nguồn"`. Nguồn THẬT: `approvals.decided_at` → `decidedAt`, `approvals.comment` → `comment`. Thiếu nguồn ⇒ trả **«chưa có nguồn» + LÝ DO** (bước chưa ra quyết định / bản ghi không kèm trường) — **KHÔNG** lấy `queuedAt`/`dueAt` thay thế, **KHÔNG** bịa ngày.
* `app/page.tsx` — mỗi bước của dải tự viết thêm khối `data-vntech="approval-flow-step"` gồm 2 dấu đo được: **`data-vntech="approval-step-decided-at"`** («Thời điểm duyệt: …») và **`data-vntech="approval-step-comment"`** («Bình luận: …»).
* Dải dùng chung `app/components/ui/Timeline.tsx` **giữ nguyên** (ngoài phạm vi tệp được phép sửa) — chi tiết phiếu vẫn đi qua `ApprovalTimeline` với `at: approval.decidedAt` · `comment: approval.comment` (đã có, test khoá lại).

---

## 4. TEST HỢP ĐỒNG (ĐỎ trước → XANH sau)

| Test | ĐỎ (trước khi sửa) | XANH (sau khi sửa) |
|---|---|---|
| `tests/p2-d3-grn-to-po.test.mjs` | **0 pass / 1 fail** — `SyntaxError: The requested module '../lib/p2-po-trace.ts' does not provide an export named 'purchaseOrderForReceipt'` | **3 pass / 0 fail** |
| `tests/p2-d4-approval-timeline.test.mjs` | **0 pass / 1 fail** — `ERR_MODULE_NOT_FOUND: lib/p2-approval-timeline.ts` | **3 pass / 0 fail** |
| Cả 2 tệp gộp | — | **6 pass / 0 fail** (exit 0) |

Cả 2 tệp đo ở **2 tầng**: (a) hàm thuần với dữ liệu thật hình dạng payload bootstrap; (b) nguồn `app/screens/ReceiptDrawer.tsx` · `app/page.tsx` qua dấu `data-vntech`.

---

## 5. 7 CỔNG BẮT BUỘC

| # | Cổng | Kết quả |
|---|---|---|
| 1 | `npx tsc --noEmit` | **exit 0** (0 lỗi) ✔ |
| 2 | `npm run lint` | **0 error** (186 warning sẵn có) ✔ |
| 3 | `npm run test:regression` | **69 pass / 0 fail / 0 cancelled** · exit 0 ✔ |
| 4 | `npm run test:workflow` | **ĐẠT** — “Workflow VNTECH ERP V5.3.0 FULL W2 passed: four-stage spec approvals/email/SLA → …” ✔ |
| 5 | `node --import tsx --test tests/p2-d3-grn-to-po.test.mjs tests/p2-d4-approval-timeline.test.mjs` | **6 pass / 0 fail** · exit 0 ✔ |
| 6 | `node --import tsx tests/t01-work-menu-probe.mjs` | **7 ĐẠT · 0 HỎNG** ✔ |
| 7 | `node tools/probe-project-screen.mjs` | **KẾT LUẬN: ĐẠT ✅** ✔ |
| + | `node tools/probe-p2-live-approval.mjs` (VIỆC 0) | **11 ĐẠT · 0 HỎNG** · exit 0 ✔ |

---

## 6. TỆP ĐÃ ĐỔI + COMMIT

| Commit | Nội dung | Tệp |
|---|---|---|
| `3e57611` | **VIỆC 0** — probe nghiệm thu LIVE | `tools/probe-p2-live-approval.mjs` (mới, 333 dòng) |
| `7e404b2` | **D3** — đủ chiều GRN → PO | `lib/p2-po-trace.ts` · `app/screens/ReceiptDrawer.tsx` · `app/page.tsx` (truyền `open={open}`) · `tests/p2-d3-grn-to-po.test.mjs` (mới) |
| `03b92ad` | **D4** — dải duyệt có thời điểm duyệt + bình luận | `lib/p2-approval-timeline.ts` (mới) · `app/page.tsx` (import + 2 dấu `data-vntech`) · `tests/p2-d4-approval-timeline.test.mjs` (mới) |

`git diff --stat 37a6e9f..HEAD` = **7 tệp · 657 dòng thêm · 4 dòng bớt**.
**KHÔNG** `git add -A`, **KHÔNG** push, **KHÔNG** build lại, **KHÔNG** start/stop dịch vụ. `tests/p2-25-pr-po-grn-cases.test.mjs` **vẫn untracked** (đã kiểm `git ls-files` = rỗng). Không đụng `scripts/**` · `java-backend/**` · `drizzle/**` · `AGENTS.md` · `docs/28_*` · `tools/baseline/**` · `docs/agent-progress/TASK-094…109.md`.

**Giới hạn đã ghi nhận (kỷ luật):** `app/components/ui/Timeline.tsx` **KHÔNG nằm trong danh sách tệp được phép sửa** của lượt này ⇒ giữ nguyên (chỉ **tái dùng**), nên 2 dấu đo `data-vntech` của D4 nằm ở dải tự viết `app/page.tsx`; dải dùng chung được khoá bằng test ở tầng nguồn (`at`/`comment`/nhãn 5 trạng thái).

## 7. BLOCKED / UNKNOWN

* **Không BLOCKED** — 4/4 phép đo LIVE đều chạy được và ĐẠT (không phải ghi BLOCKED).
* **UNKNOWN #1 (cần người dùng xác nhận nghiệp vụ):** phiếu nghiệm thu thật đã tạo trên LIVE bởi probe (`DNMH-PRJ-DEMO-01-2026-0125…0130`, dự án `PRJ-DEMO-01`, vật tư `MAT_082196e5-…`, dòng `outside_contract`). Đây là **dữ liệu thật trong CSDL** (không xoá) ⇒ cần người dùng chốt: **giữ làm mẫu nghiệm thu** hay **dọn** (thao tác xoá dữ liệu nghiệp vụ KHÔNG được tự làm).
* **UNKNOWN #2:** D3/D4 mới được kiểm ở tầng nguồn + hàm thuần; **chưa build** nên **chưa có bằng chứng DOM lúc chạy** cho 2 dấu `data-vntech` mới (đúng ràng buộc cấm build của lượt này). Cần lượt build + mở drawer GRN / màn Phê duyệt để chụp/xác nhận DOM.
