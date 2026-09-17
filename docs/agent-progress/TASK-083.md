# TASK-083 — `U-15` ĐỢT 2: CHUYỂN BẢNG PHẲNG SANG `DataTable`

- **Mã:** TASK-083 · **Ngày:** 18/09/2026 · **Commit:** `#151` … `#165` (14 bảng)
- **Định danh nguồn:** head `drizzle/0123_phase1_ui_datatable9_identity.sql` ⇒ **`VNTECH-FP-ADA2358D8EFD995C`**
- **Trạng thái:** đang làm — **14 bảng phẳng đã chuyển** (`DataTable` **13 → 27** · bảng tự viết **87 → 73** ·
  trạng thái rỗng tự viết **88 → 76**); còn **bảng "cần cân nhắc"** + **~73 bảng KHÔNG chuyển được** (xem mục 3)

## 1. Vì sao có task này

`U-15` (roadmap) yêu cầu thay các bảng tự viết bằng component dùng chung `DataTable` để mọi danh sách có
cùng khuôn: tiêu đề cột · sắp xếp · trạng thái RỖNG/ĐANG TẢI/LỖI · bấm dòng để mở chi tiết.
Số đo bằng `tools/probe-ui-adoption.mjs`: **bảng tự viết 87 chỗ** · `DataTable` dùng thật **13 lần**.

## 2. Đã chuyển (đợt này)

| # | Màn / hàm | Bảng | Ghi chú |
|---|---|---|---|
| 1 | `TeamManagement` | "thành viên đã RỜI tổ đội" (`past`) | 6 cột, có phép tính `days` trong `render` (giữ nguyên công thức) |
| 2 | `ProjectManagement` | "Tổ đội của dự án" (`teams`) | 6 cột; `emptyText` **nguyên văn** từ khối `<Empty>` cũ: *"Dự án chưa có tổ đội."* |
| 3 | `TeamManagement` | "thành viên đang hoạt động" (`activeMembers`) | 8 cột, có nút `Hồ sơ ›`; `emptyText` **nguyên văn** từ `<Empty>` cũ |
| 4 | `TeamManagement` | "tồn kho theo vật tư" (`bal`) | 4 cột; `rowKey` dùng `materialId \|\| index` như khoá cũ |
| 5 | `DepartmentPermissionManager` | **ma trận quyền phòng ban** | 1 cột "Chức năng" + **7 cột ĐỘNG** từ `PERM_CAPS.map` + 1 cột trạng thái; dòng "chưa lưu" **giữ nguyên nền vàng** qua thuộc tính mới **`rowStyle`** |
| 6 | `TeamManagement` | **danh sách tổ đội** (`filtered`) | 9 cột (mã · tên · hạng mục · dự án · kho · thành viên · quyết toán · trạng thái · nút `Chi tiết ›`); giữ nguyên công thức `projOf`/`whOf`/`membersOf`/`settled` |
| 7 | `MaterialCatalogPage` | báo cáo **alias trùng** | 3 cột, khoá theo chỉ số như cũ; `emptyText` nguyên văn *"Không có alias trùng."* |
| 8 | `MaterialCatalogPage` | báo cáo **xung đột alias** | 4 cột; `emptyText` nguyên văn *"Không có xung đột alias với tên chuẩn."* |
| 9 | `MaterialCatalogPage` | **danh mục vật tư (chế độ CHỈ XEM)** | 7 cột; `emptyText` nguyên văn *"Danh mục vật tư chưa có dữ liệu."* |
| 10 | `ProjectManagement` | **danh sách KHO của dự án** | 9 cột (mã · tên · loại · thủ kho · tồn kho · chờ nhập/xuất/duyệt · nút `Xem kho ›`); `emptyText` nguyên văn *"Dự án chưa có kho."* |
| 11 | `BoqControl` | **chi tiết lũy kế theo vật tư** | 10 cột; ⚠️ **GIỮ lớp `resizable-data-table`** qua tham số mới **`tableClassName`** (xem mục 3b) |
| 12 | `Receiving` | **"Kế hoạch giao hàng" (12 cột)** | ✅ **ĐÃ CHUYỂN LẠI THÀNH CÔNG** ở lượt kế tiếp bằng đúng cách ghi ở mục 3c (khoảng trắng sau `=>`, `<span>` thay fragment trần cho ô `▧`, cột chuỗi trả thẳng); giữ nguyên `ordered`/`actual`/`remain`/`pct` |
| 13 | `TeamManagement` | **thông tin dự án của tổ đội** | 6 cột; bảng cũ render **đúng 1 dòng** khi có dự án ⇒ `rows={proj ? [proj] : []}`; `emptyText` **nguyên văn** *"Tổ đội chưa gắn dự án nào."* |
| 14 | `ProjectManagement` | **danh sách dự án (9 cột)** | mã · tên (+`<small>` hợp đồng) · trạng thái · bắt đầu · kết thúc dự kiến · tiến độ · nhân sự · tổ đội · nút `Chi tiết ›`; giữ nguyên `projectOverdueDays(row)` cho `red-text`, `scopesOf().length`, `teamsOf().length`; `emptyText` **nguyên văn** *"Không có dự án phù hợp bộ lọc."* |

**Đo lại sau khi chuyển:** `DataTable` **13 → 27 lần** · bảng tự viết **87 → 73 chỗ** · trạng thái rỗng tự viết **88 → 76 chỗ**.
`app/page.tsx` **4007 dòng** / 221 hàm top-level.

### 2b. ✅ CÁCH KIỂM CHỨNG MẠNH NHẤT CHO VIỆC CHUYỂN BẢNG (đã dùng thật — bảng 14)

Chuyển bảng là **refactor giữ nguyên giao diện**. Cách chứng minh chắc nhất **không phải** là "đọc lại code thấy giống",
mà là **so ảnh chụp toàn bộ 28 màn × 4 kích thước trước/sau**:

```
node tools/probe-visual-regression.mjs            # lần 1: ghi báo cáo SAU khi đổi dữ liệu (đã có trong repo)
node tools/probe-visual-regression.mjs            # lần 2: sau khi chuyển bảng
Get-FileHash <bao-cao-1> -Algorithm SHA256 ; Get-FileHash <bao-cao-2> -Algorithm SHA256
```
Kết quả lượt này: **hai báo cáo TRÙNG NHAU TỪNG BYTE (`867D58DD…D4D3B4`)** ⇒ **không một màn nào đổi một điểm ảnh nào**,
kể cả `02-project` (`✅ 0 px` cả desktop/laptop/tablet/phone). Đây là **bằng chứng mạnh hơn mọi lời khẳng định trong văn bản**.
⇒ **Quy trình từ nay cho mỗi bảng chuyển tiếp:** chạy cổng ảnh **trước** và **sau**, so **hash của báo cáo**;
hash khác ⇒ phải giải thích được từng vùng lệch, không được bỏ qua.

## 3c. ⚠️ BẢNG 12 CỘT (`Receiving` — "Kế hoạch giao hàng"): LỖI CÚ PHÁP JSX, ĐÃ HOÀN TÁC

Lượt này em thử chuyển bảng **kế hoạch giao hàng** (12 cột, `baseline-table`, không có lớp riêng) nhưng
`tsc` báo **3 lỗi** ngay:
```
app/page.tsx(1580,1593): error TS2322: Type 'Element' is not assignable to type '(row: Row, index: number) => ReactNode'
app/page.tsx(1580,1601): error TS2304: Cannot find name 'row'
app/page.tsx(1580,1611): error TS2304: Cannot find name 'row'
```
**Nguyên nhân (đã xác định):** em viết `render:(row)=><>▧ {row.certificateCount||0}</>` — **không có khoảng
trắng sau `=>`**. TypeScript đọc `=><>` thành **danh sách tham số generic rỗng** nên phần `row` phía sau
**không còn nằm trong hàm arrow** ⇒ mất biến `row`. Đây là **cùng họ lỗi với 3 lỗi đã ghi ở TASK-079**
(`key={…}` bị cắt, sai tên biến chỉ số, thiếu `cellClassName`).

**Việc đã làm ngay:** `git checkout -- app/page.tsx` ⇒ **hoàn tác**, `tsc` trở lại **EXIT 0**, `DataTable`
vẫn **24 lần**, bảng tự viết vẫn **76 chỗ** (đúng bằng trước khi thử) ⇒ **không để lại mã hỏng**.

**Cách làm đúng cho vòng sau (đã xác định, chỉ cần áp dụng):**
1. **Luôn có khoảng trắng sau `=>`** khi thân là JSX: `render: (row) => <>…</>` (KHÔNG viết `=><>`).
2. Với ô **trộn chữ + biểu thức** (`▧ {row.certificateCount||0}`) thì bọc bằng fragment và giữ khoảng trắng.
3. Cột nào chỉ trả **chuỗi** thì trả thẳng (`render: (row) => row.poNo`) để bớt JSX.
4. Trước khi ghi: chạy **`tsc` trên bản nháp** (đúng như lượt này) — lỗi bị chặn **trước khi** commit.

⚠️ **Tình trạng sau 14 bảng (đã cập nhật):** bảng 12 cột `Receiving` **đã chuyển xong** (bảng 12 trong mục 2) và
**bảng danh sách dự án 9 cột cũng đã chuyển xong** (bảng 14, đã kiểm bằng cổng ảnh trùng byte). Còn lại:
**`Purchasing` KHÔNG chuyển được** (dùng `<Fragment>` nhóm dòng — `DataTable` không có khái niệm dòng nhóm),
**"yêu cầu phiếu / Requests"** (cần khả năng chọn dòng + lớp `selected-row` trên `<tr>` ⇒ phải mở rộng `DataTable`),
và **`MaterialCatalogPage` bảng danh mục `material-list-table`** (đã có `tableClassName` nên chuyển được).

## 3b. ⚠️ LỚP CSS RIÊNG TRÊN `<table>` — BÀI HỌC ĐÃ TRẢ GIÁ (TASK-083)

Một số bảng cũ mang **lớp định dạng riêng** trên chính thẻ `<table>`; `DataTable` luôn render
`className="baseline-table"` nên **chuyển thẳng là MẤT định dạng**:

| Lớp | CSS thật | Hệ quả nếu bỏ |
|---|---|---|
| `resizable-data-table` | `globals.css:1261-1263` — `table-layout:fixed; width:max-content; min-width:100%` + quy tắc ngắt dòng ô | bảng lũy kế vật tư **mất khuôn cột/ngắt dòng** |
| `data-table` | `globals.css:124` — `tbody tr { cursor:pointer }` | mất con trỏ dòng (bảng Phiếu đề nghị) |
| `material-list-table` | `canonical.css:732` — `td, th { white-space: nowrap }` | ô bị ngắt dòng |

⇒ **Đã mở rộng `DataTable` thêm `tableClassName`** và dùng ngay cho bảng lũy kế.
**Quy trình bắt buộc từ nay:** trước khi chuyển một bảng, phải **grep CSS theo lớp riêng của bảng đó**;
lớp nào có luật thì **truyền vào `tableClassName`**, không được bỏ.

### Mở rộng `DataTable` (điều kiện tiên quyết — đã làm)
Thêm **`rowStyle?: (row, index) => CSSProperties`** vào **props** của component (⚠️ KHÔNG phải vào kiểu `Column` —
lượt đầu em đặt nhầm chỗ và `tsc` báo đúng 2 lỗi, đã sửa). Cần thiết để giữ **tô nền theo trạng thái của cả DÒNG**:
bảng ma trận quyền tô `background:#fff8e6` cho dòng *chưa lưu*.

### Đối chiếu CSS cho bảng `<table>` trần (đã CHỨNG MINH, không suy đoán)
`app/styles/canonical.css` dòng **103–113** style **cùng một danh sách selector** cho
`.table-wrap table th/td` **và** `.baseline-table th/td` ⇒ bảng `<table>` trần nằm trong `.table-wrap` có CSS
**tương đương** `.baseline-table` mà `DataTable` render ⇒ **chuyển được** (trước đây em xếp nhóm này vào
"phải chứng minh CSS" — nay đã chứng minh xong).

**Kiểm chứng:** `tsc --noEmit` **EXIT 0** · eslint **0 error** (73 warning, đều có trước) ·
`master-baseline-gate` **ĐẠT** (`!important=4950` · `css=400643B`) · `npm run build` **EXIT 0**.

**Hai quyết định CÓ CHỦ Ý (ghi để người sau không sửa nhầm):**
1. **KHÔNG truyền `emptyText`** cho bảng này: markup cũ **không có** trạng thái rỗng, nên em dùng **nguyên văn
   mặc định của component dùng chung** (`"Chưa có dữ liệu."`) thay vì **tự đặt chữ mới** — đúng **quy tắc #7**
   của dự án ("mọi chữ phải lấy nguyên văn từ markup cũ"). ⇒ Bảng rỗng nay hiện khối rỗng DÙNG CHUNG thay vì
   `<tbody>` trống — đây chính là mục tiêu `U-15` (88 trạng thái rỗng tự viết ⇒ dùng chung).
2. **Giữ nguyên** công thức `days` (số ngày tham gia) trong `render` của cột cuối, không tách ra ngoài.

## 3. Bộ quét phát hiện: phần lớn bảng còn lại KHÔNG chuyển được bằng máy

Em viết bộ quét phân loại **89 khối `<table>`** trong `app/page.tsx` theo các tiêu chí AN TOÀN
(markup cũ `className="baseline-table"` + dòng do `map` sinh + **không** `style` trên `<tr>` +
**không** `colSpan`/`Fragment` + không phải "dòng tĩnh"):

| Phân loại | Số bảng | Ý nghĩa |
|---|---|---|
| Đủ điều kiện chuyển **ngay** | **1** | `ProjectManagement` (nhưng thực chất là **bảng tổng hợp 3 dòng tĩnh**, không phải danh sách ⇒ **không nên** chuyển) |
| Cần cân nhắc | **12** | có `colSpan` (thường là **dòng trạng thái rỗng** — chuyển được nếu truyền `emptyText` đúng nguyên văn) · 1 có `Fragment` (`Purchasing`) |
| Còn lại | **~76** | `rowRole`/nhóm dòng, **không có `baseline-table`** (dùng khuôn CSS khác), hoặc là **chuỗi HTML in** (`printTabularReport`) ⇒ **KHÔNG chuyển** |

⚠️ **Ba chỗ cần THÊM TÍNH NĂNG cho `DataTable` trước khi chuyển được** (không được làm mất tính năng đang có):
1. **`rowStyle`/`rowClassName`** — bảng **ma trận quyền phòng ban** (`DepartmentPermissionManager`) tô nền vàng
   cho dòng **chưa lưu** bằng `style` trên `<tr>`; `DataTable` hiện **chưa có** chỗ truyền ⇒ chuyển ngay sẽ **mất
   dấu "chưa lưu"**.
2. **Tiêu đề cột ĐỘNG** — bảng quyền có 7 cột sinh từ `PERM_CAPS.map` ⇒ phải dựng `columns` động (làm được,
   nhưng cần viết cẩn thận để không lệch thứ tự cột).
3. **Bảng không dùng `baseline-table`** (`WorkflowManager` ×2 · `Admin` ×3 · nhiều bảng khác dùng `<table>` trần
   hoặc khuôn CSS riêng như `purchase-comparison-head`) — `DataTable` **luôn** render `.baseline-table`, nên
   chuyển thẳng sẽ **đổi CSS**. Muốn chuyển phải: hoặc thêm tham số cho `DataTable`, hoặc xác nhận CSS tương đương.

⇒ **Kết luận (đã hiệu chỉnh bằng thực tế):** con số "42 bảng" trong kế hoạch trước là **đếm thô**; ước lượng ban đầu
"số bảng vừa an toàn vừa có giá trị là ~10–12" **hơi thấp** — thực tế **đã chuyển được 14 bảng** và vẫn còn
**3 nhóm chuyển được tiếp** (xem mục 4), vì ba mở rộng `cellClassName` / `rowStyle` / `tableClassName` gỡ được
hầu hết rào cản. Phần **~73 bảng còn lại** vẫn **KHÔNG chuyển**: không phải danh sách phẳng (bảng in HTML,
bảng nhóm dòng, bảng tổng hợp tĩnh, lưới nhập liệu).

## 4. Việc kế tiếp của TASK-083 (thứ tự đã xác định — cập nhật sau bảng 14)

1. ~~Mở rộng `DataTable`: `rowStyle`~~ · ✅ **XONG** (bảng 5) · ~~`tableClassName`~~ ✅ **XONG** (bảng 11) ·
   ~~`cellClassName`~~ ✅ **XONG** (TASK-081).
2. ~~Chuyển các bảng có `colSpan` **chỉ ở dòng rỗng**~~ ✅ **XONG 13 bảng** (mục 2) — `emptyText` **NGUYÊN VĂN**.
3. **Kế tiếp — mở rộng `DataTable` thêm `rowClassName`** (lớp CSS trên `<tr>`) để chuyển được bảng
   **Phiếu đề nghị / Requests** đang cần `className={selected?.id===r.id ? 'selected-row' : ''}` (chọn dòng).
   ⚠️ Hiện chưa có chỗ truyền ⇒ chuyển ngay sẽ **mất dấu dòng đang chọn**.
4. Chuyển `MaterialCatalogPage` bảng **danh mục `material-list-table`** (dùng `tableClassName` đã có, giữ `nowrap`;
   cột alias ĐỘNG).
5. Chỉ chuyển bảng `<table>` trần **khi** đã chứng minh CSS tương đương (`canonical.css:103-113` đã chứng minh cho
   `.table-wrap table` — nhưng mỗi bảng **vẫn phải so cổng ảnh trước/sau**, xem mục 2b).

## 4b. Lịch sử head định danh nguồn (14 bảng = 9 head)

| Head | Bảng đã chuyển | Fingerprint |
|---|---|---|
| `0116_…datatable2_identity.sql` | 1 | `VNTECH-FP-…` (đợt đầu) |
| `0117_…datatable3_identity.sql` | 2–4 | `VNTECH-FP-624193C1D2EB2FE6` |
| `0118`…`0122` | 5–13 | … |
| `0122_phase1_ui_datatable8_identity.sql` | 13 | `VNTECH-FP-30EE365D549AD7D4` |
| `0123_phase1_ui_datatable9_identity.sql` | **14 (danh sách dự án 9 cột)** | **`VNTECH-FP-ADA2358D8EFD995C`** |

⚠️ **Bắt buộc mỗi lần đổi `app/page.tsx`:** head mới → `node tools/refresh-phase-identity.mjs <head.sql> "<NHÃN>"`
→ `UPDATE vntech_product_identity` trên **MySQL** (SQLite do `local-runtime.mjs` tự chạy migration)
→ `node scripts/generate-release-manifest.mjs` → `npm run build`. Bỏ bước nào cũng **chặn build** (fingerprint gate).

## 5. Tệp thay đổi (đợt này — bảng 14)

| Tệp | Nội dung |
|---|---|
| `app/page.tsx` | bảng **danh sách dự án 9 cột** (`ProjectManagement`) → `<DataTable>` (4019 → 4007 dòng) |
| `drizzle/0123_phase1_ui_datatable9_identity.sql` | **MỚI** — head định danh nguồn (fixed point `VNTECH-FP-ADA2358D8EFD995C`) |
| `lib/vntech-identity-data.mjs` · `VNTECH_*.txt` · `VNTECH_FINGERPRINT.json` · `MANIFEST_SHA256.txt` | đồng bộ định danh + manifest |
| `docs/agent-progress/TASK-083.md` | hồ sơ này |

**Bằng chứng kiểm chứng lượt bảng 14:** `tsc --noEmit` **EXIT 0** · eslint **0 error** (72 warning, đều có trước) ·
`master-baseline-gate` **ĐẠT** (`!important=4950` · `css=400643B`) · `npm run build` **EXIT 0** +
`BUILT ARTIFACT VALIDATION: ĐẠT` · `npm run test:regression` **61 test / 59 pass / 2 fail (đúng 2 ca đã biết)** ·
cổng ảnh **trùng byte** với lượt trước (`867D58DD…`) · `probe-column-parity` **KHÔNG khoá nào thiếu cột** ·
`probe-money-consistency` **14/14** · `probe-row-duplication` **15/15** · UI `:8787` và proxy `:9000` **HTTP 200**,
định danh phục vụ **`VNTECH-FP-ADA2358D8EFD995C`**.

