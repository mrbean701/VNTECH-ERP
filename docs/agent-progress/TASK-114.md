# TASK-114 — PHASE 2: BẰNG CHỨNG **DOM LÚC CHẠY** CHO 5 DẤU UI MỚI (bundle ĐANG PHỤC VỤ)

- **Ngày:** 22/09/2026 · **HEAD khi làm:** `855d615` (`[PHASE 2 - DOCS] TASK-112`) · **Nhánh:** `unity`
- **Sản phẩm:** `tools/probe-p2-ui-dom.mjs` (probe mới) + nhật ký này
- **Ràng buộc đã tuân thủ:** **KHÔNG** build · **KHÔNG** `npm run build`/`gd-cycle` · **KHÔNG** start/stop dịch vụ (8787 · 9000 · 18081) · **KHÔNG** `INSERT/UPDATE/DELETE/ALTER/DROP/TRUNCATE` (probe chỉ GET + đọc DOM) · **KHÔNG** sửa `app/**`, `lib/**`, `scripts/**`, `java-backend/**`, `drizzle/**`, `AGENTS.md`, `docs/28_*`, `.docx/.xlsx`, `tools/baseline/**`, `docs/agent-progress/TASK-094…113.md` · **KHÔNG** `git add -A` · **KHÔNG** push · 2 tệp `tests/p2-25-*.test.mjs` giữ **untracked** · mọi tệp tiếng Việt ghi bằng tool `write`/`edit` (không dùng PowerShell).

---

## 1. KẾT LUẬN TRUNG TÂM (đọc 1 dòng)

**5/5 dấu UI của PHASE 2 ĐÃ LÊN BUNDLE ĐANG PHỤC VỤ và HIỆN THẬT TRÊN DOM lúc chạy**, in ra **dữ liệu thật** (số PO con, số PO nguồn, `Thời điểm duyệt: 20:05 20/09/2026`, `Bình luận: “Người lập phiếu trùng vai trò duyệt của bước 2 (thuky) …”`).

`node tools/probe-p2-ui-dom.mjs` → **exit 0 · 5/5 ĐẠT · 0 HỎNG · 0 BLOCKED** (chạy **2 lần liên tiếp**, cùng kết quả).

**Đây là mảnh còn thiếu duy nhất của PHASE 2.** `TASK-113` §2 ghi `P-04` = «Chưa có DOM lúc chạy (chưa build)» — lượt này bịt đúng khoảng trống đó bằng công cụ headless THẬT (không suy đoán từ mã nguồn).

### Cách trích asset trước đó đã SAI (và cách đúng)

Chunk chứa toàn bộ UI của PHASE 2 **KHÔNG** được tham chiếu bằng `<script src=…>`. HTML phục vụ tham chiếu nó bằng **`<link rel="modulepreload">`**:

```html
<link rel="modulepreload" href="/assets/page-D3XmqKvP.js" crossorigin=""/>
```

⇒ Grep chỉ theo `src=` **không bao giờ thấy chunk này** ⇒ kết luận `UNKNOWN` là **hệ quả của cách trích sai**, không phải của bundle thiếu. Probe mới trích **mọi `src`/`href` trỏ tới `.js` bất kể thẻ nào** (`<script>`, `<link rel="modulepreload">`, `<link rel="preload" as="script">`) **VÀ** đối chiếu thêm với danh sách asset **trang thật sự nạp** (`performance.getEntriesByType("resource")`) để không bỏ sót chunk nạp động.

---

## 2. BẰNG CHỨNG A — ASSET JS **ĐANG PHỤC VỤ** chứa 5/5 chuỗi dấu

HTML phục vụ ở `:8787` (UI) và `:9000` (proxy) **giống hệt nhau từng byte** (7 123 ký tự / 7 456 bytes UTF-8, SHA-256 `027BD3E1EF48F391754B9C2A9496B53B343C2B738F51945B45B1B8F3B0D5CAE9`), và asset `page-D3XmqKvP.js` cũng giống hệt nhau ở cả hai cổng. Bảng dưới đo qua `:9000` (cổng có API hoạt động để probe đăng nhập):

| Asset JS đang phục vụ (URL THẬT) | Kích thước | 5 chuỗi dấu |
|---|---|---|
| `http://127.0.0.1:9000/assets/layout-segment-context-DlXg0mIT.js` | 283 bytes | 0/5 |
| `http://127.0.0.1:9000/assets/rolldown-runtime-S-ySWqyJ.js` | 694 bytes | 0/5 |
| `http://127.0.0.1:9000/assets/index-1A3R7Bm5.js` | 80 725 bytes | 0/5 |
| `http://127.0.0.1:9000/assets/framework-CXnKph_e.js` | 189 805 bytes | 0/5 |
| **`http://127.0.0.1:9000/assets/page-D3XmqKvP.js`** | **887 978 ký tự / 932 228 bytes** | **5/5 ✔** |

Đếm **chính xác dạng bundle đã minify** (`"data-vntech":\`marker\`` — JSX prop, KHÔNG phải `data-vntech="marker"`):

```
  request-child-pos            raw=3  ·  "data-vntech":`request-child-pos`        = 1
  request-child-pos-empty      raw=1  ·  "data-vntech":`request-child-pos-empty`  = 1
  grn-source-po                raw=4  ·  "data-vntech":`grn-source-po`            = 1
  approval-step-decided-at     raw=1  ·  "data-vntech":`approval-step-decided-at` = 1
  approval-step-comment        raw=1  ·  "data-vntech":`approval-step-comment`    = 1
```

(cột `raw` đếm chuỗi thô nên `request-child-pos` **cộng dồn cả** tiền tố của `request-child-pos-empty`, và `grn-source-po` cộng dồn `grn-source-po-open`/`grn-source-po-missing` — vì vậy phép đếm theo thuộc tính chính xác mới là con số có nghĩa: **mỗi dấu đúng 1 lần**.)

Nguyên văn 260 ký tự quanh lần xuất hiện đầu tiên của `request-child-pos` trong asset:

```
…(0,H.jsxs)(`section`,{className:`drawer-section request-child-pos`,"data-vntech":`request-child-pos`,
children:[(0,H.jsx)(J,{title:`Đơn mua (PO) sinh từ phiếu này`,note:"Truy vết …
```

---

## 3. BẰNG CHỨNG B — 5/5 DẤU **HIỆN THẬT TRÊN DOM LÚC CHẠY** (nội dung text đọc được)

Probe **không hardcode số phiếu**: sau khi đăng nhập nó đọc chính payload bootstrap (`GET /api/system` → `data`) để **chọn ứng viên**, rồi in ra id đã chọn (nhờ vậy probe không lệch khi dữ liệu demo đổi). Dữ liệu demo lúc đo: 35 phiếu · 17 PO · 22 phiếu nhập.

| # | Dấu | Màn / đường tới | Selector | Nội dung text THẬT đọc được | CÓ? |
|---|---|---|---|---|---|
| 1 | `request-child-pos` | Chi tiết **phiếu đề nghị** `DNMH-PRJ-DEMO-01-2026-0003` (deep link `?request=MR_00b80951-…`) — khối «Đơn mua (PO) sinh từ phiếu này» (§20) | `section[data-vntech="request-child-pos"]` | `Đơn mua (PO) sinh từ phiếu này… Mã PO / Nhà cung cấp / Trạng thái / Đã đặt / Đã nhận / Còn lại — PO-PRJ-DEMO-01-2026-9202 · Tổng kho Vật tư Miền Nam · Chờ giao hàng · 360 · 0 · 360 · Xem chi tiết PO` (1 dòng `[data-vntech="child-po-row"]`) | **CÓ ✔** |
| 2 | `request-child-pos-empty` | Chi tiết **phiếu đề nghị** `DNMH-PRJ-DEMO-01-2026-0006` (PR KHÔNG có PO con) — nhánh «Chưa có PO nào» | `div.inline-alert[data-vntech="request-child-pos-empty"]` | `Chưa có PO nào. Phiếu này chưa phát sinh đơn mua — hoặc chưa được lập PO sau khi duyệt đủ.` (0 dòng PO con) | **CÓ ✔** |
| 3 | `grn-source-po` | Chi tiết **phiếu nhập (GRN)** — click-through THẬT: `child-po-open` (PR) → `po-grn-open` (màn chi tiết PO) → drawer GRN | `section[data-vntech="grn-source-po"]` | `Đơn mua (PO) nguồn của chuyến giao này… Số PO nguồn PO-PRJ-DEMO-01-2026-9202 · Mã kỹ thuật (purchase_order_id) PO_2fd3bda0-9233-476a-9831-c6505551cbf0 · Nhà cung cấp Tổng kho Vật tư Miền Nam · Trạng thái đơn mua Chờ giao hàng · ◉ Xem chi tiết đơn mua nguồn` | **CÓ ✔** |
| 4 | `approval-step-decided-at` | Dải duyệt — màn «**Trung tâm phê duyệt**» (nhóm menu `approval_center`), phiếu `DNMH-PRJ-DEMO-01-2026-0129` | `span[data-vntech="approval-step-decided-at"]` — **4 lần** trên dải (5 bước, 4 bước có dòng) | `Thời điểm duyệt: 20:05 20/09/2026` (bước 2 — **DỮ LIỆU THẬT**) · 2 dòng `Thời điểm duyệt: chưa có nguồn (bước chưa ra quyết định nên chưa có thời điểm duyệt)` · `Thời điểm duyệt: 20:05 20/09/2026` (bước 5) | **CÓ ✔** |
| 5 | `approval-step-comment` | như trên | `span[data-vntech="approval-step-comment"]` — **4 lần** | `Bình luận: “Người lập phiếu trùng vai trò duyệt của bước 2 (thuky) — không tự duyệt đơn của mình: Thư ký Tổng giám đốc”` · 2 dòng `… chưa có nguồn (bước chưa ra quyết định nên chưa có ý kiến)` · `Bình luận: “… bước 5 (director) … Giám đốc”` | **CÓ ✔** |

**Dòng có DỮ LIỆU THẬT (không rơi vào nhánh «chưa có nguồn»):** thời điểm duyệt = **2** · bình luận = **2** ⇒ chứng minh dải duyệt **đọc `approvals.decided_at` / `approvals.comment` thật từ payload**, không phải chỗ giữ chỗ.

**Đối chứng ÂM (3 phép đo)** — chứng minh phép chọn `[data-vntech=…]` **phân biệt được theo màn**, không phải «có gì cũng ĐẠT»:

| Màn đang đo | Dấu bắt buộc VẮNG | Kết quả |
|---|---|---|
| Chi tiết phiếu đề nghị (có PO con) | `grn-source-po`=0 · `approval-step-decided-at`=0 · `approval-step-comment`=0 | ✅ ĐẠT |
| Chi tiết phiếu đề nghị (không có PO con) | như trên | ✅ ĐẠT |
| Chi tiết phiếu nhập (GRN) | `request-child-pos`=0 · `request-child-pos-empty`=0 · `approval-step-decided-at`=0 | ✅ ĐẠT |
| Dải duyệt (Trung tâm phê duyệt) | `request-child-pos`=0 · `request-child-pos-empty`=0 · `grn-source-po`=0 | ✅ ĐẠT |

---

## 4. CÁCH CHẠY LẠI (nguyên văn)

```
node tools/probe-p2-ui-dom.mjs [base] [user] [pass]
# mặc định: http://127.0.0.1:9000 · admin · Admin123456@
```

Kết quả 2 lần chạy liên tiếp:

```
  Số dấu thấy trên DOM: 5/5 · Asset JS đang phục vụ chứa đủ 5 chuỗi dấu: CÓ ✔
  Asset chứa đủ 5/5: http://127.0.0.1:9000/assets/page-D3XmqKvP.js
KẾT LUẬN: ĐẠT ✅ — 5/5 dấu có thật trên DOM của bundle ĐANG PHỤC VỤ.
```

`exit 0` = ĐẠT · `exit 1` = HỎNG (màn tới được nhưng thiếu dấu) · `exit 2` = BLOCKED (kèm lý do nguyên văn).

Ảnh chụp từng màn (bằng chứng phụ, ngoài repo): `%TEMP%\vntech-p2-ui-dom\p2-{request-child-pos,request-child-pos-empty,grn-source-po,approval-timeline}.png`.

**Độ bền khi tải chậm:** probe thử mở vỏ ứng dụng **3 lần × 45 s** trước khi kết luận BLOCKED. (Lần chạy đầu trong lượt này gặp 1 nhịp tải chậm và **đã bị bắt đúng** thành BLOCKED thay vì báo HỎNG sai — sau đó bổ sung cơ chế thử lại và 2 lần chạy kế tiếp đều ĐẠT ở **lần nạp thứ 1**.)

---

## 5. BLOCKED

**KHÔNG có mục nào BLOCKED.** Cả 3 màn (chi tiết phiếu đề nghị · chi tiết phiếu nhập · dải duyệt) đều tới được; cả 5 dấu đều có trên DOM.

---

## 6. ĐIỀU **KHÔNG** KHẲNG ĐỊNH (trung thực phạm vi)

1. **Chỉ đo trên 1 tài khoản `admin`.** Chưa đo lại 5 dấu này bằng các vai trò khác (`nvkhdemo` · `thukydemo` · `ksda.demo`) ⇒ chưa khẳng định dấu hiện với mọi vai trò (việc đó thuộc phạm vi phân quyền, không thuộc phạm vi «UI đã lên bundle»).
2. **Số phiếu/dòng là ảnh chụp tại thời điểm đo** trên dữ liệu demo hiện có. Probe tự chọn ứng viên từ payload nên sẽ tiếp tục chạy khi dữ liệu đổi, nhưng **con số cụ thể** trong bảng §3 sẽ khác.
3. **Chỉ chứng minh 5 dấu này.** Các dấu `data-vntech` khác (`po-grn-list`, `child-po-row`, `child-po-open`, `po-grn-open`, `purchasing-po-open`, …) xuất hiện trong luồng đo nhưng **không** phải đối tượng nghiệm thu của TASK-114.
4. **Không đánh giá thẩm mỹ/bố cục** — chỉ khẳng định sự tồn tại + nội dung text của dấu.
5. **`page-D3XmqKvP.js` gắn theo hash nội dung.** Sau một lần build mới, tên asset sẽ đổi ⇒ phải **chạy lại probe**, không được dùng lại URL trong §2 như bằng chứng cho bundle mới.

---

## 7. UNKNOWN + CÂU HỎI

- **UNKNOWN-1:** `:8787` trả `401` cho `POST /api/system` (login) nhưng `GET /api/system` lại `200` ⇒ chưa rõ `:8787` có phải **chỉ phục vụ tệp tĩnh** (không proxy `/api/*`) hay nó giới hạn gì khác. Việc đo DOM vì vậy chạy qua `:9000`; **HTML + asset thì đã chứng minh giống hệt `:8787` từng byte**, nên kết luận «bundle đang phục vụ đã có UI mới» áp dụng cho **cả hai cổng**.
  **Câu hỏi:** `:8787` có được thiết kế là cổng tĩnh (không API) không, hay đang thiếu cấu hình proxy `/api/*`?
- **UNKNOWN-2:** chưa xác định ai/cơ chế nào đã khiến bước grep trước đó chỉ đọc `src=` ⇒ nếu có **script/checklist dùng chung** đang grep theo `src=`, nó sẽ tiếp tục báo `UNKNOWN` sai cho mọi chunk tương lai.
  **Câu hỏi:** có cần thay script/checklist đó bằng cách trích như probe này (`src` + `modulepreload` + `performance resource`) không? (Ngoài phạm vi TASK-114 — cần user quyết.)

---

## 8. TỆP ĐÃ THÊM TRONG LƯỢT NÀY

| Tệp | Loại | Ghi chú |
|---|---|---|
| `tools/probe-p2-ui-dom.mjs` | **mới** | Probe headless: đăng nhập → điều hướng → chờ selector → assert 5 dấu + grep asset + đối chứng âm. Chỉ ĐỌC. |
| `docs/agent-progress/TASK-114.md` | **mới** | Nhật ký này. |

**Không** sửa bất kỳ tệp nào khác. 2 tệp `tests/p2-25-pr-po-grn-cases.test.mjs` và `tests/p2-25-roadmap-status-cell.test.mjs` vẫn **untracked** như trước.
