# TASK-122 — `Q1` (phương án **A**, nửa sau): đổi **cách HIỂN THỊ** khi xuất Excel/CSV BOQ — **không lộ GUID**, **không sửa dữ liệu**

- **Ngày**: 20/09/2026 · **Nhánh**: `unity-p2-full-20260920`
- **Trạng thái**: **DONE (chờ user xác nhận)** — 5/5 test hợp đồng XANH · 7/7 cổng ĐẠT · **KHÔNG có câu ghi dữ liệu nào**
- **Phạm vi đã sửa**: `lib/boq-export.ts` (2 chỗ + 1 import) · `lib/boq-line-display.ts` (**MỚI**, hàm thuần) ·
  `tests/q1-boq-export-display.test.mjs` (**MỚI**, hợp đồng) · `tests/q1-boq-line-source-probe.mjs` (**MỚI**, probe) ·
  `tests/q1-boq-export-artifact-probe.mjs` (**MỚI**, probe bytes) · `tests/q1-boq-lines-payload.json` (**MỚI**, bằng chứng) ·
  tệp hồ sơ này
- **Commit**: `a11fe9e` (sửa mã + test hợp đồng) · `495bb4c` (bằng chứng `.xlsx` + mở rộng hợp đồng lên 5 ca) · `ea6824c` (tệp hồ sơ này)
- ⚠️ **KHÔNG cập nhật** `docs/agent-progress/TASK_INDEX.md` / `MASTER_STATUS.md`: tệp đang bị nhánh khác giữ (tránh ghi đè nhau) — captain cập nhật sau.
- ⛔ **KHÔNG** đụng `app/page.tsx`, `app/**`, `scripts/**`, `java-backend/**`, `drizzle/**`, `AGENTS.md`, `docs/28_*`, `.docx/.xlsx`, `tools/baseline/**`, `docs/agent-progress/TASK-094…121.md`

## 1. Yêu cầu (nguyên văn, rút gọn)

`Q1` = chọn phương án **A**: *«giữ khoá kỹ thuật (GUID) nguyên vẹn — **CHỈ** đổi cách **HIỂN THỊ**»* ⇒ **KHÔNG sửa dữ liệu**.
Nửa sau của A (task này): sửa `lib/boq-export.ts:70` (nhánh XLSX) và `:77` (nhánh CSV) để cột **«Mã dòng BOQ»** không còn ghi GUID.

## 2. Nguồn mã THẬT của dòng BOQ — **ĐO, KHÔNG ĐOÁN**

Probe chỉ-đọc `tests/q1-boq-line-source-probe.mjs` (login `admin` + `GET /api/system`, **không ghi gì**), stack đang chạy ở `http://127.0.0.1:9000`, dự án `PRJ-DEMO-01`, **8 dòng `boqItems`** (lưu nguyên văn ở `tests/q1-boq-lines-payload.json`):

| Trường payload | Cột THẬT | Có khoá? | Khác rỗng | Ví dụ |
|---|---|---|---|---|
| `code` | *(dòng BOQ KHÔNG có trường này)* | **0/8** | 0/8 | — |
| `boqCode` | `project_boq_items.boq_code` | 8/8 | **0/8 (= NULL)** | — |
| `lineRef` | *(không tồn tại)* | **0/8** | 0/8 | — |
| `contractLineRef` | `project_boq_items.contract_line_ref` | 8/8 | **0/8 (= NULL)** | — |
| `no` | *(không tồn tại)* | **0/8** | 0/8 | — |
| `lineNo` | `project_boq_items.line_no` | 8/8 | **8/8** | `1` |
| `materialCode` | `materials.code` | 8/8 | **8/8** | `KHAC-VLXD-004` |
| `materialName` | tên vật tư | 8/8 | **8/8** | `Thép hộp 40x40` |
| `sourceOrder` | `project_boq_items.source_order` | 8/8 | **8/8** | `1` |
| `id` | `project_boq_items.id` | 8/8 | **8/8** | `BOQ_36a50087-88f4-49e3-ac5a-fff0631b733d` ← **GUID đang bị xuất ra** |

Nguồn mã: `java-backend/infrastructure/.../BootstrapDataAdapter.java:445-628` (bản Java) và `scripts/system-route.mjs:711-742` (bản JS cũ) — **chỉ đọc**.

> **KẾT LUẬN — KHÔNG BLOCKED**: 2 nguồn ưu tiên số 1 (`boqCode`, `contractLineRef`) **có cột thật nhưng CSDL hiện để NULL (0/8)**;
> dòng BOQ vẫn **CÓ** dữ liệu thật khác để hiển thị: **`materialCode` + `lineNo`** (8/8 dòng). ⇒ Dùng đúng 2 giá trị **đã lưu** này,
> **KHÔNG chế mã mới**, **KHÔNG rơi về `id`**.

## 3. Đã sửa gì

### 3.1 `lib/boq-export.ts` — ĐÚNG 3 dòng

| # | Dòng (sau khi sửa) | Trước | Sau |
|---|---|---|---|
| 1 | `:5-7` | *(không có)* | `import { boqLineDisplayCode } from "@/lib/boq-line-display";` + ghi chú lý do |
| 2 | `:73` (nhánh **XLSX** `downloadBoqPriceTemplateXlsx`) | `…,String(r.id\|\|""),…` | `…,boqLineDisplayCode(r),…` |
| 3 | `:80` (nhánh **CSV** `downloadBoqPriceTemplateCsv`) | `…,String(r.id\|\|""),…` | `…,boqLineDisplayCode(r),…` |

Tiêu đề 2 cột **«Mã dòng BOQ»** giữ nguyên (`:72`, `:79`) ⇒ **cấu trúc 13 cột của tệp xuất KHÔNG đổi**, chỉ đổi **giá trị**.

### 3.2 `lib/boq-line-display.ts` — **MỚI**, hàm thuần (khuôn `lib/p2-po-trace.ts` / `lib/p2-approval-timeline.ts`)

`boqLineDisplayCode(row)` — **KHÔNG import gì**, thứ tự ưu tiên:

1. `code` → `boqCode` → `lineRef` → `contractLineRef` → `no` *(mã dòng BOQ / số dòng hợp đồng — đúng ý phương án A)*
2. Dòng **CHƯA khai mã dòng** (đo thật: 8/8 `boqCode = contractLineRef = NULL`) ⇒ **mã vật tư đã lưu** + **số dòng nguồn**:
   `KHAC-VLXD-004 · Dòng 1`
3. Không có mã vật tư ⇒ **tên vật tư thật** + số dòng nguồn: `Thép hộp 40x40 · Dòng 1`
4. Hết nguồn thật ⇒ **`"chưa có nguồn"`** (`NO_SOURCE_TEXT`, dùng chung với `lib/p2-approval-timeline.ts`)

⛔ **KHÔNG BAO GIỜ** trả `id`/`sourceItemId` (`BOQ_…`/`BQS_…`). Giá trị rỗng/khoảng trắng **không** tính là nguồn; số `0` **là** giá trị thật.

## 4. Xác nhận «GUID không còn xuất hiện» trong cột đó

| Đo | Cách đo | Kết quả |
|---|---|---|
| Dòng **CHỈ có `id`** (GUID) | `boqLineDisplayCode({id:"BOQ_36a50087-…"})` | `"chưa có nguồn"` ✔ |
| 8 dòng BOQ THẬT | `boqLineDisplayCode(payload[i])` | 8/8 có mã nghiệp vụ, **0 GUID** ✔ |
| Tầng NGUỒN | `git diff` + quét `String(r.id` toàn tệp | **0 khớp**; `boqLineDisplayCode(r)` xuất hiện **đúng 2 lần** ✔ |
| BYTES `.xlsx` THẬT | giải nén (fflate) `xl/worksheets/sheet1.xml` | **0/8 GUID**, **không còn chuỗi `BOQ_`/`BQS_`**, vẫn có `KHAC-VLXD-004` + `Thép hộp 40x40` ✔ |
| Khoá kỹ thuật trong CSDL | *(không đụng)* | **NGUYÊN VẸN** — không có câu `INSERT/UPDATE/DELETE/DDL` nào ✔ |

## 5. ĐỎ → XANH (test hợp đồng `tests/q1-boq-export-display.test.mjs`)

**ĐỎ (trước khi sửa mã):**

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '…\lib\boq-line-display.ts'
✖ tests\q1-boq-export-display.test.mjs
ℹ tests 1 · pass 0 · fail 1
```

**ĐỎ (sau khi có hàm thuần, TRƯỚC khi sửa `lib/boq-export.ts`) — đúng cái phải đỏ:**

```
✖ Q1-A ① — `lib/boq-export.ts` vẫn còn ghi `String(r.id…)` ⇒ GUID vẫn lộ ra file xuất
ℹ tests 4 · pass 3 · fail 1
```

**XANH (sau khi sửa):**

```
✔ Q1-A ① — 2 nhánh xuất Excel/CSV giá BOQ KHÔNG còn ghi `String(r.id…)` (nguồn GUID cho người dùng)
✔ Q1-A ② — `boqLineDisplayCode` trả MÃ NGHIỆP VỤ khi dòng BOQ có nguồn (thứ tự ưu tiên đo được)
✔ Q1-A ③ — thiếu MỌI nguồn ⇒ trả ĐÚNG `chưa có nguồn`; KHÔNG BAO GIỜ trả `<PREFIX>_<GUID>`
✔ Q1-A ④ — ĐÚNG 2 mảng dòng (XLSX + CSV) lấy cột thứ 2 từ `boqLineDisplayCode(r)`, không còn `id`
✔ Q1-A ⑤ — KHÔNG thêm INSERT/UPDATE/DELETE/DDL (mã hay SQL); hàm thuần không import gì
ℹ tests 5 · pass 5 · fail 0
```

**Probe bytes `.xlsx` (`tests/q1-boq-export-artifact-probe.mjs`):** `═══ KẾT QUẢ: 7 ĐẠT · 0 HỎNG ═══` — 8 mã hiển thị Excel nhận được:
`KHAC-VLXD-004 · Dòng 1` … `KHAC-VLXD-006 · Dòng 8`.

## 6. Cổng phải xanh — **ĐÃ CHẠY, ĐÃ DÁN**

| Cổng | Lệnh | Kết quả |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | `[tsc exit=0]` ✅ |
| Lint | `npm run lint` | `✖ 186 problems (0 errors, 186 warnings)` → **exit 0** ✅ (toàn warning cũ) |
| Regression | `npm run test:regression` | `tests 69 · pass 69 · fail 0` → **exit 0** ✅ |
| Workflow | `npm run test:workflow` | `Workflow VNTECH ERP V5.3.0 FULL W2 passed` → **exit 0** ✅ |
| Test hợp đồng MỚI | `node --import tsx --test tests/q1-boq-export-display.test.mjs` | `pass 5 · fail 0` ✅ |
| Probe T-01 | `node --import tsx tests/t01-work-menu-probe.mjs` | `═══ KẾT QUẢ: 7 ĐẠT · 0 HỎNG ═══` ✅ |
| Probe màn dự án | `node tools/probe-project-screen.mjs` | `KẾT LUẬN: ĐẠT ✅` → **exit 0** ✅ |
| Probe nguồn mã (mới) | `node --import tsx tests/q1-boq-line-source-probe.mjs` | **exit 0**, in bảng trường thật + ghi bằng chứng ✅ |
| Probe bytes (mới) | `node --import tsx tests/q1-boq-export-artifact-probe.mjs` | `7 ĐẠT · 0 HỎNG` → **exit 0** ✅ |

**KHÔNG build** · **KHÔNG start/stop dịch vụ** (`9000`/`8787`/`18081` do captain quản lý) — 2 probe UI chỉ **GET**.

## 7. UNKNOWN cần người dùng biết (không chặn)

1. **Cột `boq_code` / `contract_line_ref` đang TRỐNG (NULL 8/8)** — đây là **dữ liệu**, không phải lỗi hiển thị.
   Nếu muốn tệp xuất hiện **đúng mã dòng BOQ** (`BQ-3`, `IV.1.1`…) thì phải **nhập mã đó vào dòng BOQ** (thuộc phạm vi khác, cần user cho phép).
   Code đã sẵn sàng: có mã là ưu tiên số 1, không cần sửa gì thêm.
2. Trong CSDL hiện tại, mã hiển thị luôn có dạng **`<mã vật tư> · Dòng <số>`**. Hệ quả: nếu **2 dòng BOQ cùng vật tư** ở 2 dòng nguồn khác nhau thì mã hiển thị vẫn **phân biệt được** (khác số dòng); nhưng nếu **cùng vật tư VÀ cùng số dòng** (dòng lặp) thì mã hiển thị **trùng nhau** — truy vết ngược cần thêm **mã dòng của hợp đồng** (mục 1). Bản ghi vẫn tra được bằng `mã dự án + mã vật tư + số dòng` khi mở hệ thống.
3. `buildBoqXlsxBytes`/`downloadBoqCsv` (xuất BOQ **theo cấu hình cột**) **không** có cột «Mã dòng BOQ»; nếu Admin cấu hình thêm trường khoá `id` vào danh sách Export thì GUID sẽ quay lại ở đường đó — **chưa xử lý trong TASK-122** (ngoài 2 nhánh đã chỉ định).

## 8. CHẠY LẠI TOÀN BỘ CỔNG SAU KHI CHỐT MÃ (bản ghi xác nhận)

Sau commit `bafead8` (chỉ đụng tệp hồ sơ, **không** chạm `lib/**`), toàn bộ cổng được chạy lại trên **đúng cây làm việc hiện tại**:

| # | Cổng | Kết quả đo được |
|---|---|---|
| 1 | `node --import tsx --test tests/q1-boq-export-display.test.mjs` | `✔ ① ② ③ ④ ⑤` · `tests 5 · pass 5 · fail 0` · **exit 0** |
| 2 | `npm run test:regression` | `tests 69 · pass 69 · fail 0` · **exit 0** |
| 3 | `npm run test:workflow` | `Workflow VNTECH ERP V5.3.0 FULL W2 passed` · **exit 0** |
| 4 | `node --import tsx tests/t01-work-menu-probe.mjs` | `═══ KẾT QUẢ: 7 ĐẠT · 0 HỎNG ═══` · **exit 0** |
| 5 | `npx tsc --noEmit` | **exit 0** |
| 6 | `npm run lint` | `187 problems (0 errors, 187 warnings)` · **exit 0** — **0 error** |
| 7 | `node --import tsx tests/q1-boq-export-artifact-probe.mjs` | `═══ KẾT QUẢ: 7 ĐẠT · 0 HỎNG ═══` · **exit 0** |
| 8 | `node tools/probe-project-screen.mjs` | `KẾT LUẬN: ĐẠT ✅` · **exit 0** |
| 9 | `node --import tsx tests/q1-boq-line-source-probe.mjs` | **exit 0** (chỉ đọc, in bảng trường thật) |

**Ghi chú về cảnh báo lint** (không phải lỗi, không chặn): 1 cảnh báo trong `lib/boq-export.ts` là
`'maxCols' is assigned a value but never used` ở dòng 88 — **có SẴN TỪ TRƯỚC** (bản gốc dòng 85, nằm trong `downloadBoqPdf`,
KHÔNG thuộc 3 dòng đã sửa của TASK-122). Tổng cảnh báo toàn repo tăng 186 → 187 là do phiên khác thêm tệp mới
(`lib/p08-nav-trace.ts` / `app/page.tsx` chưa commit) — **số ERROR vẫn là 0**.

## 9. Việc KHÔNG làm (đúng ràng buộc)
- ⛔ **KHÔNG** sửa `app/page.tsx` (nhánh khác đang giữ) — **2 commit của task này KHÔNG chạm tệp đó**
  (`git show --name-only a11fe9e 495bb4c` = 0 dòng `app/page.tsx`; thay đổi `M app/page.tsx` trong working tree là của **phiên khác**, commit gần nhất là `7ac5dc2 [P-07]`)
- ⛔ **KHÔNG** `INSERT/UPDATE/DELETE/ALTER/DROP/TRUNCATE` — chỉ `POST login` + `GET /api/system` (**đọc**)
- ⛔ **KHÔNG** build · **KHÔNG** start/stop dịch vụ · **KHÔNG** `git add -A` · **KHÔNG** push
- ⛔ **KHÔNG** đụng 2 tệp `tests/p2-25-*.test.mjs` (vẫn **untracked** ✔)
- ⛔ **KHÔNG** dùng PowerShell ghi tệp tiếng Việt — mọi tệp do `write`/`edit` tool (hoặc Node UTF-8) ghi
