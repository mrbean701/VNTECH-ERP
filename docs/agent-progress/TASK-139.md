# TASK-139 — 2 sửa giao diện form “Lập đề nghị cấp vật tư”

**Trạng thái:** mã đã sửa + cổng kiểm thử XANH (tsc 0 · regression **69/69** · workflow ĐẠT).
**Phạm vi ghi tệp:** `app/page.tsx` · `tests/runtime-admin-boq-regression.test.mjs` (CHỈ assertion `:230` cũ, theo chỉ đạo captain) · `docs/agent-progress/TASK-139.md`.
**Yêu cầu người dùng (nguyên văn):** *“Nếu như chọn dự án thì cũng cho phép chọn «trống» vì 1 số vật tư không nằm trong hợp đồng, phần boq cũng như vậy. Ngoài ra cho phép tìm kiếm vật tư trong danh mục vật tư gốc, bỏ logic tìm kiếm vật tư theo boq - danh mục vật tư dự án.”*

---

## ① Cho phép chọn TRỐNG ở Hợp đồng / BOQ Version (hết bị đè bởi giá trị mặc định)

| # | Tệp:dòng (sau sửa) | Nội dung |
|---|---|---|
| 1a | `app/page.tsx:2341-2343` | **Thêm cờ “người dùng đã tự chọn”**: `const [contractTouched,setContractTouched]=useState(false); const [boqTouched,setBoqTouched]=useState(false);` |
| 1b | `app/page.tsx:2347` | `const contractId=contracts.some((row)=>String(row.id)===String(contractSelection))?String(contractSelection):(contractTouched?"":String(defaultContract?.id\|\|""));` |
| 1c | `app/page.tsx:2350` | `const boqVersionId=versions.some((row)=>String(row.id)===String(boqVersionSelection))?String(boqVersionSelection):(boqTouched?"":String(defaultVersion?.id\|\|""));` |
| 1d | `app/page.tsx:2358` | Ô **Hợp đồng** `onChange` nay bật cờ trước khi ghi lựa chọn: `setContractTouched(true);setBoqTouched(false);setContractSelection(e.target.value);setBoqVersionSelection("");…` |
| 1e | `app/page.tsx:2359` | Ô **BOQ Version** `onChange`: `setBoqTouched(true);setBoqVersionSelection(e.target.value);…` |
| 1f | `app/page.tsx:2357` | Đổi **Dự án** ⇒ reset cờ về `false` (`setContractTouched(false);setBoqTouched(false)`) ⇒ giữ nguyên UX cũ: hợp đồng/BOQ của dự án mới lại nhận mặc định, không dính lựa chọn của dự án trước |

**Cách làm:** cờ `touched` *(đúng gợi ý — cách an toàn nhất)*.
- **CHƯA chạm** ô nào ⇒ biểu thức chạy y như cũ ⇒ **không phá luồng mặc định** của người dùng không muốn chọn gì ✔
- **ĐÃ chạm** ⇒ tôn trọng **đúng** lựa chọn; chọn `— Tùy chọn (để trống) —` (`""`) ⇒ `contractId`/`boqVersionId` **thực sự rỗng** ✔
- Ràng buộc hợp lệ vẫn giữ: id phải tồn tại trong `contracts`/`versions` của dự án đang chọn (nếu không ⇒ `""`).
- Giữ nguyên: 2 `<option value="">— Tùy chọn (để trống) —</option>`; nút `↻ Đối chiếu lại` vẫn `disabled={!contractId||!boqVersionId}` và `preview()` vẫn chặn khi thiếu Dự án/Hợp đồng/BOQ (đối chiếu Excel **không đổi**).

**Bằng chứng chọn “trống” giữ được rỗng** *(harness đọc CHÍNH mã nguồn: `git show HEAD:app/page.tsx` = bản TRƯỚC, file đang có = bản SAU; hàm dựng từ đúng biểu thức `const contractId=…` / `const boqVersionId=…`)*:

```
[1] RED   HEAD  explicit-empty contractId  = "c1"     ← lỗi cũ: chọn trống bị đè về mặc định
[1] GREEN NOW   explicit-empty contractId  = ""       ← đã sửa: giữ rỗng thật
[1]       HEAD  untouched contractId       = "c1"
[1]       NOW   untouched contractId       = "c1"     ← UX cũ không đổi
[1] RED   HEAD  explicit-empty boqVersionId= "v1"
[1] GREEN NOW   explicit-empty boqVersionId= ""
[1]       NOW   untouched boqVersionId     = "v1"
```

## ② Ô tìm vật tư ⇒ DANH MỤC VẬT TƯ GỐC (`data.materials`), bỏ tìm theo BOQ

| # | Tệp:dòng (sau sửa) | Nội dung |
|---|---|---|
| 2a | `app/page.tsx:2371` | `const materialSearchListId="request-material-catalog-search";` (**1 datalist dùng chung** cho mọi dòng — danh mục gốc lớn hơn BOQ dự án nên không nhân bản DOM theo số dòng) |
| 2b | `app/page.tsx:2386` | Nhánh `key==="materialName"` — mã sau khi sửa: `if(key==="materialName"){const display=String(row.materialName\|\|"");return <input list={materialSearchListId} value={display} placeholder="Gõ mã / tên vật tư để tìm trong danh mục…" onChange={(e)=>{const value=e.target.value;const found=materials.find((m)=>\`${m.code\|\|""} · ${m.name\|\|""}\`===value);if(found)chooseMaterial(index,String(found.id));else setLines(…materialName:value,boqItemId:"",contractLineNo:"",materialId:"",materialCode:"",contractQty:0,matchStatus:"manual",…)} required={req}/>;}` |
| 2c | `app/page.tsx:2385` | `chooseMaterial(index,id)` — điền **từ vật tư gốc**: `materialId`, `materialCode` (`material.code`), `materialName` (`material.name`), `unit`, `unitPrice:Number(material.standardPrice\|\|0)`; **GỠ liên kết BOQ cũ**: `boqItemId:""`, `contractLineNo:""`, `boqCode:""`, `contractQty:0`; đánh dấu `matchStatus:"manual"`, `materialSource:"catalog"` |
| 2d | `app/page.tsx:2388` | `<datalist id={materialSearchListId}>{materials.map((m)=><option key={m.id} value={\`${m.code\|\|""} · ${m.name\|\|""}\`}>{m.unit\|\|""} · {m.specification\|\|m.customFields?.specification\|\|""}</option>)}</datalist>` + hàng có `materialSource==="catalog"` **không** còn bị tô cảnh báo “cần kiểm tra” |

- **Giá trị gợi ý để gõ tìm:** `` `${code} · ${name}` `` **kèm mô tả phụ “ĐVT · thông số”** — gõ được **cả mã lẫn tên** (chuỗi này cũng là giá trị khớp khi bấm chọn, nên không cần phân biệt dấu/không dấu ở tầng so khớp).
- **Đã BỎ** toàn bộ lọc/tìm theo `projectBoq` trong ô này (`projectBoq.find((b)=>…)` và datalist BOQ cũ đều **đã xoá**) ✔
- **GỠ liên kết BOQ cũ khi chọn danh mục gốc:** có ✔ (`boqItemId:""`, `contractLineNo:""`, `boqCode:""`, `contractQty:0`).
- **Giữ nguyên đường BOQ khác (không đụng):** `chooseBoq(...)` (dòng 2384) vẫn còn **nguyên vẹn**; `boqItemId`/`contractLineNo` vẫn được dùng bởi `requestLineContext` cho các cột xám (KL theo HĐ, tồn kho, lũy kế) và bởi luồng **đối chiếu Excel** (`preview_request_import` ⇒ `setLines(result.lines)`, server tự map `boqItemId`).

## ③ `send()` có bị chặn bởi `matchStatus` không — ĐÃ NỚI

`app/page.tsx:2354`:

```
const unresolved=lines.filter((row)=>row.matchStatus&&row.matchStatus!=="exact"&&row.materialSource!=="catalog");
```

Dòng chọn từ **danh mục gốc** mang `materialSource:"catalog"` ⇒ **không bị tính là “chưa map BOQ”** ⇒ gửi phiếu được ✔.
Giữ nguyên hiệu lực chốt cũ cho dòng do **Excel** trả về (`review`/`not_found` vẫn chặn khi có `previewSummary`), và vẫn khớp hợp đồng test TASK-136 (`tests/task136-request-form-optional-fields.test.mjs:100` — nguyên văn `matchStatus&&row.matchStatus!=="exact"` còn nguyên trong biểu thức).

## ④ Grep + Cổng kiểm thử

| Phép đo | Kết quả |
|---|---|
| `grep "để tìm BOQ"` trong `app/page.tsx` | **0** ✔ (toàn workspace chỉ còn: assertion **phủ định** `tests/…:234` và 2 hồ sơ docs trích lịch sử) |
| `grep "boq-material-" + "search"` (mã datalist cũ) toàn workspace | **0** ✔ |
| `npx tsc --noEmit --incremental false` | **0 lỗi** (`exit 0`) ✔ |
| `npm run test:regression` | **69/69 · fail 0** (`ℹ tests 69 · pass 69 · fail 0`, `exit 0`) ✔ |
| `npm run test:workflow` | **ĐẠT** (`Workflow VNTECH ERP V5.3.0 FULL W2 passed`, `exit 0`) ✔ |
| `npx eslint app/page.tsx` | `exit 0` (chỉ còn các warning `no-unused-vars` có sẵn của tệp) |

### ④b Đồng bộ assertion test lỗi thời (`:230` cũ) — CHỈ 1 chỗ, theo chỉ đạo captain

Assertion cũ `assert.match(ui,/Gõ tên \/ mã \/ thông số để tìm BOQ/);` (nay ở **dòng 231**) đã được thay bằng hợp đồng **mới có nghĩa** — không xoá test cho xanh:

```
assert.match(ui,/Gõ mã \/ tên vật tư để tìm trong danh mục/);
assert.doesNotMatch(ui,/để tìm BOQ/);
assert.match(ui,/materialSearchListId/);
```

**Red→green cho chính assertion mới** *(chạy trên `git show HEAD:app/page.tsx` = bản TRƯỚC TASK-139)*:

```
RED  (HEAD): placeholder_moi=false | materialSearchListId=false | doesNotMatch(de tim BOQ)=false   ← 3 phép kiểm ĐỎ
GREEN (bản đang có): npm run test:regression = 69/69 · fail 0                                      ← XANH
```

3 assertion khác trong cùng tệp (`:226`/`:303`/`:304` cũ) do worker TASK-137 đã đồng bộ ở `88a9ae5` — **không chạm lại**.

## ⑤ Còn lại cần captain (ngoài phạm vi worker)

1. **Rebuild bundle web (gd-cycle)** rồi test trên UI `:8787` — sửa `app/**` **không tự lên bundle**:
   - ① chọn Dự án → chọn `— Tùy chọn (để trống) —` ở Hợp đồng **và** BOQ Version ⇒ 2 ô **giữ trống**, nút `↻ Đối chiếu lại` **mờ**;
   - ② gõ **mã hoặc tên** vật tư ⇒ gợi ý lấy từ **danh mục gốc** (không còn dòng BOQ dạng `STT · mã · tên`); chọn 1 gợi ý ⇒ cột **Mã** + **Tên** + **ĐVT** hiện đúng, **KL theo HĐ trống**, dòng gửi được.
2. **CSDL gợi ý:** `.local-data` hiện có ít vật tư; muốn thấy gợi ý phong phú nên đo trên stack có danh mục gốc đầy đủ (`:9000` → `:18087`/Java).

## ⑥ Tồn đọng / rủi ro đã biết (không nằm trong phạm vi 2 tệp được phép sửa)

- `lib/request-context.ts:16` (`requestLineContext`, **ngoài phạm vi**) vẫn tự suy `contractLineNo`/`contractQty` cho **cột xám** theo `materialId` khi dòng không có `boqItemId`/`boqCode` ⇒ vật tư gốc **trùng mã với một dòng BOQ của dự án** vẫn có thể hiện số xám. Payload dòng vẫn gửi `contractQty:0`; đây là hệ quả **có từ trước**, muốn chặt hơn thì phải sửa `lib/` (cần captain quyết).
- `chooseBoq(...)` nay **không còn điểm gọi trên UI** (form **không có** cột chọn dòng BOQ riêng — đã kiểm `lib/form-fields.ts:79-93`: `contractLineNo` là ô **chỉ đọc**). Hàm được **giữ nguyên theo yêu cầu** cho luồng BOQ (đối chiếu Excel / cột BOQ trong tương lai) ⇒ chỉ còn là **mã chờ**, không gây lỗi `tsc`/`lint` (warning `no-unused-vars` cùng loại với hàng chục import có sẵn của tệp).
- TASK-139 **không** chạm `docs/agent-progress/MASTER_STATUS.md` (ngoài phạm vi được phép) ⇒ captain cập nhật % master task nếu cần.
