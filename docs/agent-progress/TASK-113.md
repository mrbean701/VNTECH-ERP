# TASK-113 — PHASE 2: SO SÁNH `phase2.md` ↔ PHASE 2 CỦA MASTER TASK + CẬP NHẬT TIẾN ĐỘ

- **Ngày:** 22/09/2026 · **HEAD khi làm:** `5150eda` (`[PHASE 2 - DOCS] TASK-111`) · **Nhánh:** `unity`
- **Sản phẩm cho người dùng:** `docs/agent-progress/PHASE2-SO-SANH-VA-TIEN-DO.md` (bảng so sánh + bảng ngược 31 mục + kết luận)
- **Ràng buộc đã tuân thủ:** **KHÔNG** `INSERT/UPDATE/DELETE/ALTER/DROP/TRUNCATE` · **KHÔNG** build · **KHÔNG** start/stop dịch vụ (8787 · 9000 · 18081) · **KHÔNG** `git add -A` · **KHÔNG** push · **KHÔNG** dùng PowerShell ghi tệp tiếng Việt (chỉ tool `write`/`edit`).

---

## 1. KẾT LUẬN TRUNG TÂM (đọc 1 dòng)

**Hai thứ "PHASE 2" là khác nhau.** `P-01…P-09` của master task là **việc UI/menu/phân quyền** (lấy từ `docs/24` §15); `phase2.md` là **đặc tả quy trình PR→Duyệt→PO→GRN**. Công sức TASK-103…111 phục vụ **`phase2.md`**, mà `phase2.md` **không có mã dòng `P-*`** ⇒ **đã làm nhiều nhưng DONE của lộ trình 110 mục KHÔNG tăng**. Cả hai đều đúng, không mâu thuẫn.

**Số chốt:** `phase2.md` = **✔ 19/31 (61,3 %)** · ◐ 10/31 · ✗ 2/31. Lộ trình = **DONE 98 · BLOCKED 2 · TODO 10 = 110** (giữ nguyên trước/sau). PHASE 2 = **3/9**.

---

## 2. VIỆC 1 — BẢNG SO SÁNH (`P-01…P-09` ↔ `phase2.md`)

Bảng đầy đủ nằm ở `PHASE2-SO-SANH-VA-TIEN-DO.md` §2 (+ §2.1 tổng hợp). Tóm tắt 9 dòng:

| Mục | `phase2.md` | Đã giải quyết gì (bằng chứng) | Còn thiếu | TT |
|---|---|---|---|---|
| `P-01` | *(không có)* | `P01-TAB-SPEC.md` chốt ngữ nghĩa **bằng dữ liệu thật** (MR 7 · PR 10 · PO 7); mã **đã rollback** `0c7318b` | Toàn bộ UI 3 tab | **TODO** |
| `P-02` | *(không có)* | — | Chờ `P-01` | **TODO** |
| `P-03` | *(không có)* | — | 6 chiều lọc; chờ `P-01` | **TODO** |
| `P-04` | **§19** | `ApprovalTimeline` **0→1 lần dùng thật**; `lib/p2-approval-timeline.ts` lấy `decided_at`/`comment` cột thật; test D4 **3/0** | Chưa có DOM lúc chạy (chưa build) | **DONE** |
| `P-05` | §21 | Bảng 13 cột → `EntityDetailModal`; `EntityDetailModal` **0→1**; `tsc` 0 | Cổng ảnh không phủ drawer | **DONE** |
| `P-06` | §21 | `probe-task075-attachments.mjs` **22/22 ĐẠT** (byte PNG thật + 4 đối chứng) | — | **DONE** |
| `P-07` | §12 · §17 | Chỉ có **1 màn NCC** dùng khoá menu sẵn có | Tách 2 menu độc lập | **TODO** |
| `P-08` | §12 · §17 · §21 | Truy vết **15/15 cặp 0 mồ côi**; D3 GRN→PO đã bịt | Phần menu; chờ `P-07` | **TODO** |
| `P-09` | **§22** | Kế hoạch xong (`76c6a5e`); **5 call site vẫn mã cũ**; `RbacService:80` đã nhận cả `roleBase` | Sửa 5 call site + 1 ca test | **TODO** |

**Bảng ngược 31 mục** (đã làm / một phần / chưa): `PHASE2-SO-SANH-VA-TIEN-DO.md` §3 + §3.1 (cách đếm để tự kiểm).
**6 việc chặn xếp theo mức:** cùng tài liệu §5.

---

## 3. BẰNG CHỨNG ĐÃ CHẠY LẠI TRONG LƯỢT NÀY (nguyên văn)

### 3.1 Ba cổng đo (chỉ đọc, CSDL thật `vntech_erp`)

| Cổng | Lệnh | Kết quả nguyên văn | exit |
|---|---|---|---|
| Truy vết | `node tools/p2-trace-audit.mjs` | **`KẾT LUẬN: ĐẠT — 5/5 chặng truy vết đầy đủ (0 mồ côi).`** · A1 PO 17/17 · A2 dòng POI 27/27 · A3 GRN 22/22 · A4 dòng SL 2/2 · B1 GRN có GRI 22/22 · **`FOREIGN KEY thật: 0`** | **0** |
| Tách PO | `node tools/p2-split-po-audit.mjs` | **`KẾT LUẬN: ĐẠT`** · C1 **59/59** dòng PR không đặt vượt · C2 **59/59** không lệch rollup · **`SỐ THẬT: 1 MR đã tách ≥ 2 PO`** (max 2 PO/1 PR; MR có ≥1 PO = 16/35) | **0** |
| Toàn vẹn | `node tools/p2-reference-integrity.mjs` | **`KẾT LUẬN: ĐẠT — 15/15 cặp quan hệ không có dòng mồ côi.`** · 123 bảng · **`Khoá ngoại THẬT: 0`** · **266** quan hệ chỉ theo quy ước · 809 dòng · **0 mồ côi** · 2 cách đếm khớp | **0** |

### 3.2 12 test case bắt buộc (§25)

```
node --import tsx --test tests/p2-25-pr-po-grn-cases.test.mjs
ℹ tests 13   ℹ pass 12   ℹ fail 0   ℹ skipped 1
✔ §25 Case 1..8, 10, 11, 12   ✔ §25 Case 9 — bằng chứng khoảng trống
﹣ §25 Case 9 — Workflow versioning V1/V2 [GAP-DOCUMENTED]  (skip có lý do nguyên văn)
```
`Case 9` **skip có tài liệu** + **có test riêng đo khoảng trống** ⇒ đúng chính sách chống "xanh giả".
📌 **Ghi nhận trung thực:** tệp test tham chiếu `docs/agent-progress/TASK-104.md` **KHÔNG TỒN TẠI** (đã kiểm: `docs/agent-progress/` chỉ có `TASK-100…103, 105…111`). Bằng chứng chạy thì **còn**, nhưng **nhật ký TASK-104 bị thất lạc** ⇒ đây là việc cần khôi phục.

### 3.3 Test hợp đồng MỚI (kỷ luật đỏ→xanh của lượt này)

`tests/p2-25-roadmap-status-cell.test.mjs` — **8 ca**, khoá hợp đồng ô trạng thái của roadmap:

| Lần chạy | Kết quả |
|---|---|
| **ĐỎ** (sau khi sửa cột Việc, trước khi sửa test cho khớp dạng ô thật) | **4 pass / 4 fail** — *"mọi dòng mục có ĐÚNG 12 ô"* · *"ô TT thuộc từ vựng cổng"* · *"DONE+…+TODO = 110"* · *"PHASE 2 đúng 9 dòng"* |
| **XANH** (sau khi khoá đúng ô TT = **index 10** = `cells[length-2]`, ô cuối index 11 **rỗng**) | **8 pass / 0 fail · exit 0** |

Bất biến được khoá: (1) mọi dòng **12 ô**, ô cuối rỗng ⇒ ô TT = **index 10**; (2) ô TT thuộc **từ vựng cổng phân loại** (không dòng nào vào `OTHER`); (3) **DONE + DOING + FRAME_ONLY + BLOCKED + TODO = 110**; (4) PHASE 2 đúng **9 dòng `P-01…P-09`**, ô TT chỉ là `**DONE**`/`DONE` · `**BLOCKED**`/`BLOCKED` · `TODO`/`**TODO**`; (5) **lý do ghi ở cột Việc (index 3), KHÔNG nằm ở ô TT**; (6) `P-01` phải ghi rõ **ROLLBACK**; (7) test còn kiểm `tools/probe-roadmap-progress.mjs` **vẫn** đọc ô TT ở `cells[length-2]` (nếu cổng đổi, test báo lệch thay vì âm thầm cho qua).

> **Phát hiện khi viết test (giá trị thật):** bảng có **12 ô** (không phải 11), **ô cuối rỗng** ⇒ **ô TT là index 10**. Nếu ai đó chèn thêm 1 cột mà quên cập nhật, mọi mục **sẽ lệch phase/tiến độ** — test này bắt được.

---

## 4. VIỆC 2 — CẬP NHẬT TIẾN ĐỘ

### 4.1 `docs/25_TODO_ROADMAP.md` — **chỉ cột Việc**, ô TT **KHÔNG** đổi

9 dòng `P-01…P-09` đã được bổ sung bằng chứng/đo lại vào **cột Việc**; **ô TT giữ nguyên**:
`**TODO**` × 3 (`P-01`/`P-02`/`P-03`) · `TODO` × 4 (`P-04`…`P-09` trừ P-04/05/06) · `DONE` × 3 (`P-04`/`P-05`/`P-06`).
**Không mục `P-*` nào được nâng lên DONE** (lý do từng mục ở `PHASE2-SO-SANH-VA-TIEN-DO.md` §6.1).

### 4.2 `docs/agent-progress/MASTER_STATUS.md` — **KHÔNG có ô số nào phải sửa**

Đã kiểm đối chiếu cổng: `DONE 98` · `89,1 %` · `BLOCKED 2` · `TODO 10` · dòng `PHASE 2 — MUA HÀNG 3 / 9` — **tất cả đã khớp**. Rà **chỉ có 1 dòng** PHASE 2 (`:30`) ⇒ không có dòng thứ hai bỏ sót. Tổng **98 + 2 + 10 = 110**.

### 4.3 `node tools/probe-roadmap-progress.mjs` — TRƯỚC / SAU

```
TRƯỚC (HEAD 5150eda)                 SAU (sau khi sửa cột Việc)
Tổng số mục đọc được: 110            Tổng số mục đọc được: 110
  DONE         98 / 110  (89.1%)       DONE         98 / 110  (89.1%)
  BLOCKED       2 / 110  (1.8%)        BLOCKED       2 / 110  (1.8%)
  TODO         10 / 110  (9.1%)        TODO         10 / 110  (9.1%)
  PHASE 2 — MUA HÀNG          3/9      PHASE 2 — MUA HÀNG          3/9
```
Không nhóm `OTHER` nào xuất hiện. **Kỳ vọng của đề bài nêu rõ:** nếu **không** mục nào đủ bằng chứng ⇒ **giữ nguyên 98** + ghi rõ lý do — **đó cũng là kết quả ĐẠT**. Lượt này **rơi đúng nhánh đó**, lý do đã ghi ở §1 + §4.1.

---

## 5. TỆP ĐÃ THAY ĐỔI

| Tệp | Loại | Nội dung |
|---|---|---|
| `docs/25_TODO_ROADMAP.md` | **sửa (chỉ cột Việc, 9 dòng `P-*`)** | ô TT **không đổi**; mọi dòng vẫn **12 ô** |
| `docs/agent-progress/PHASE2-SO-SANH-VA-TIEN-DO.md` | **MỚI** | bảng so sánh + bảng ngược 31 mục + kết luận cho người dùng |
| `docs/agent-progress/TASK-113.md` | **MỚI** | hồ sơ này |
| `tests/p2-25-roadmap-status-cell.test.mjs` | **MỚI — để UNTRACKED** | 8 ca khoá hợp đồng ô TT; **ĐỎ 4/8 → XANH 8/8** |

**KHÔNG đụng:** `app/**` · `lib/**` · `scripts/**` · `java-backend/**` · `drizzle/**` · `AGENTS.md` · `docs/28_*` · `.docx/.xlsx` · `tools/baseline/**` · `docs/agent-progress/TASK-094…112.md`. `AGENTS.md`/`VNTECH_*` vốn **đã dirty từ trước** (không phải do lượt này) ⇒ **không được stage**.

---

## 6. COMMIT

| # | Commit | Nội dung | Tệp |
|---|---|---|---|
| 1 | *(xem `git log`)* | `[PHASE 2 - ROADMAP] P-01..P-09: ghi bang chung/do lai vao cot Viec - o TT giu nguyen (DONE 98 · BLOCKED 2 · TODO 10 · PHASE 2 3/9)` | `docs/25_TODO_ROADMAP.md` |
| 2 | *(xem `git log`)* | `[PHASE 2 - DOCS] TASK-113: so sanh phase2.md (31 muc) voi PHASE 2 master task - 19/31 DA LAM, khong muc P-* nao du bang chung de DONE` | `PHASE2-SO-SANH-VA-TIEN-DO.md` · `TASK-113.md` |

Không `git add -A` · không push · `tests/p2-25-pr-po-grn-cases.test.mjs` **vẫn untracked** (đã kiểm `git ls-files` = rỗng).

---

## 7. BLOCKED / UNKNOWN

- **Không BLOCKED** — mọi phép đo của lượt này (3 cổng + 12 test case + test hợp đồng mới + probe + probe sau khi sửa) **đều chạy được và ĐẠT**.
- **UNKNOWN #1 — nhật ký `TASK-104.md` thất lạc.** `tests/p2-25-pr-po-grn-cases.test.mjs` (dòng 4) trỏ tới `docs/agent-progress/TASK-104.md` nhưng tệp **không tồn tại** (thư mục có `TASK-100…103`, `TASK-105…111`). Ngoài phạm vi được sửa của lượt này (`TASK-094…112.md` bị cấm ghi) ⇒ **không tự tạo lại**; đề nghị một lượt riêng khôi phục hồ sơ + gỡ con trỏ hỏng.
- **UNKNOWN #2 — `P-09` có còn "từ chối oan" thật không?** `P09-FIX-PLAN.md` (§2) khẳng định *"KHÔNG ai có `commander`/`project` ⇒ nếu `roleBase` trống thì danh sách không khớp"*. Đo lại mã cho thấy `RbacService.java:80` **nay kiểm cả `user.role()` và `user.roleBase()`** ⇒ **chưa có bằng chứng tái hiện**. Muốn đóng `P-09` phải có **1 ca test** chứng minh `role=cht` ĐƯỢC phép và `engineer` bị chặn — **đề nghị người dùng/task sau chốt**.
- **UNKNOWN #3 — Telegram (§27).** Không có bằng chứng trong repo xác nhận **mọi** mốc START/DONE/BLOCKED của `P-*` đã gửi ⇒ tài liệu chỉ dám ghi *«một phần»*, không tự nhận "đã gửi đủ".
- **Câu hỏi cần người dùng quyết** (đầy đủ ở `PHASE2-SO-SANH-VA-TIEN-DO.md` §8): **Q2** luồng duyệt mấy bước · **Q3** versioning workflow · **Q6** giá PO = 0 · **thứ tự ưu tiên tiếp theo** (`P-01` 3 tab hay khối PO con §20).
